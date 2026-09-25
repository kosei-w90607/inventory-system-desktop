# Plan Packet: 保存と起動の守り（商品コードの長さ上限・在庫更新の接続の型・新しすぎる DB の拒否・自動バックアップの timer、R3）

2026-09-25 起草。出典は `docs/backlog.md`（base `85b18a04`）の 4 行: `:29` 商品コードの長さ上限、`:49` 在庫更新の共通関数が通常の接続を受け取れる、`:50` DB の版がアプリより新しい場合の拒否が無い、`:56` 設定時刻の自動バックアップの確認がバックアップ画面を開いている間しか動かない。決定済みの前提: owner 決定 2026-09-25（商品コードの上限は 100 文字。在庫照会の `selected` / `q` の既存の 100 文字制限と揃え、「登録できるのに照会で選べない」食い違いを消す）、Coordinator 判断 2026-09-25（`:49` は ㉘ を待たず本 lane で型だけを変える / `:50` はコードの拒否だけを行い MSI 配布手順の docs は v1.0 gate 側に残す / `:56` は設計正本 `docs/function-design/71-mnt-backup.md` §71.8 のとおり timer を画面に依らない場所へ移す）。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session）
- Writer: Opus 5.5 subagent（fork でない fresh context、worktree `.claude/worktrees/save-startup-guards`、branch `agent/save-startup-guards`）
- Plan Reviewer: fresh Opus 5.5 subagent + Codex（GPT-6 Sol、effort high）。互いに独立で Writer と別 context、後の reviewer に先の結果を見せない
- Final Reviewer: Fable 5.1（fresh context）+ Codex（GPT-6 Sol）。互いに独立な Double Audit、後の reviewer に先の結果を見せない。Codex の合否判定は是正後も外さない
- Final Review Minimum: 2
- Human Gate: ready,merge

manual なし（判断の根拠は Design Readiness の「manual の要否」）。r4 なし: データを消す・戻す操作を追加しない。S3 は書込みの前に止める側の変更で、既存の復元・移行の手順は変えない。

遷移記録（append-only）:

- kickoff → spec-check → design → plan-draft → plan-gate（2026-09-25、本 commit、plan-first）: 設計正本の更新点（S1〜S4 の各「docs」）は実装と同じ PR で同期する（Scope に列挙）。owner の製品判断が要る点は Design Readiness の「owner 決定待ち」1 件（自動バックアップの通知の出し方）で、推奨案で packet を書いた。推奨と異なる決定なら plan-gate のまま packet を訂正する。
- 追記（2026-09-25、Coordinator）: owner が自動バックアップの通知の出し方に (a)（成功は 1 回、失敗は連続失敗の最初の 1 回だけ）で回答した。packet は (a) で書いてあるため Scope・AC・Matrix は変えない。

## Owner Effort Budget

- 介入回数上限: 3（見込み: Design Readiness の owner 決定 1、Codex の relay、Ready・merge）
- 実働時間上限: 30分
- relay 往復上限: 2（Plan Review の Codex 1、Final Review の Codex 1）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
DB の起動時の拒否（S3、新しい `DbError` variant と起動失敗の新しい区分）、取込みの受理範囲（S1、商品 CSV の行検証と `commit_import` の入口）、在庫を書く BIZ helper の引数型（S2）、operator が毎日頼るデータ保護の動作（S4、自動バックアップの確認の置き場所）に触る。`docs/DEV_WORKFLOW.md` Risk Tiers の「DB」「data safety boundary」「operator workflow」に当たる。R4 には当たらない（データを消す・戻す操作を足さず、変更は revert で戻せる）。Tauri command の DTO・`bindings.ts`・DB schema は変えない。

## Goal

Goal Invariant:

### 最小完了条件

- 商品 CSV の取込みで、商品コードが 100 文字（UTF-16 code unit、在庫照会の `selected` / `q` と同じ数え方）を超える行はプレビューでエラー行になり登録されない。100 文字ちょうどの商品コードは登録でき、在庫照会の `selected` で選べる。
- `apply_stock_change` は借りた transaction（`&rusqlite::Transaction<'_>`）しか受け取らない。通常の接続を渡すコードはコンパイルできない。入庫・返品・手動販売・廃棄の在庫と履歴の結果は変わらない。
- DB の schema 版がアプリの知る最大より新しいとき、起動は window の前に固有の文言の dialog を出して止まり、DB の中身・`schema_versions`・操作ログ・自動バックアップのどれも書かない。新しすぎる版のバックアップからの復元も、現在の DB に戻して失敗する。
- 設定時刻の自動バックアップの確認が、どの画面を開いていても 60 秒ごとに動く。バックアップ画面を開いても確認は二重に走らず、復元の二重失敗の後は止まる。

### 失敗定義

- 101 文字以上の商品コードが preview か `commit_import` のどちらかを通って `products` に入る、または 100 文字以下の正当な商品コードが拒否される。
- S2 の後に、入庫・返品・手動販売・廃棄・（停止中の）Z004 の旧本体のどれかで在庫・履歴の結果が変わる。
- 新しすぎる DB で、起動が続く・`DatabaseInit` の「再起動してもう一度」の文言を出す・DB file の bytes が変わる・`schema_versions` に行が増える。
- 版が同じか古い DB の起動・移行の挙動が変わる。
- バックアップ画面以外を開いている間に、設定時刻を過ぎても確認が呼ばれない。バックアップ画面を開くと 1 分に 2 回以上呼ばれる。二重失敗の後も呼ばれ続ける。

### 非目的

- 商品コードの DB CHECK 制約（`products` の再作成 migration）。理由は Design Readiness。
- ㉘ runtime の数量と版の不可分更新（`stock_revision`）。本 lane は `apply_stock_change` の接続の型だけを変え、処理の中身・引数の順・符号・結果型を変えない。
- MSI 配布手順の docs（v1.0 gate、`docs/backlog.md:36`）。旧版のアプリを入れ直す手順の文書化はそちらで扱う。
- 古い版のアプリで新しい DB を読むための互換（読み取り専用での起動）。
- `check_auto_backup` の backend の判定（71 §71.8 の処理ステップ）と、自動バックアップの設定項目・画面の変更。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

operator の操作・command 入口の受理範囲・起動の状態遷移を変えるため表を置く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 商品一括インポート画面。CSV に 101 文字の商品コードの行と正常な行がある | CSV を選びプレビュー | 101 文字の行はエラー行（`商品コードは100文字以内で入力してください`）、正常な行は登録候補 | 登録を押すと正常な行だけが登録される | なし（S1、T1） |
| 同上で商品コードがちょうど 100 文字の行 | プレビュー → 登録 → 在庫照会でその商品コードを検索し選ぶ | 登録でき、在庫照会で選択状態が URL に残る | — | frontend の `selected` は `z.string().max(100)`（`src/features/stock-inquiry/types.ts:37`、base `85b18a04`）。T3 が同じ文字列で確かめる |
| 入庫画面で商品と数量を入れる | 保存 | 在庫が増え、在庫変動履歴に 1 行増える（今までどおり） | 返品・手動販売・廃棄も同じ | Probe S2 |
| 新しい版のアプリで一度開いた DB（`schema_versions` の最大が 7）がある PC に、6 までしか知らない版のアプリが入っている | アプリを起動 | window が出る前に dialog（Scope S3 の文言）。OK で終了。DB は変わらず、自動バックアップも作られない | 新しい版のアプリを入れ直して起動すると通常起動 | Probe S3-a / S3-b |
| バックアップ設定: 有効、時刻 23:00。当日の起動時バックアップは取得済み | ホーム・売上など任意の画面を開いたまま 23:00 を過ぎる | 1 分以内にバックアップが作られ、toast `自動バックアップを作成しました` が出る。バックアップ画面を開くと一覧に出ている | 翌日の起動で起動時バックアップ（今までどおり） | toast の出し方は owner 決定待ち（Design Readiness） |
| 上と同じ設定で、保存先に書けない状態（USB を抜いた等） | 23:00 を過ぎても任意の画面を開いたまま | 失敗の toast `自動バックアップ確認に失敗しました` が 1 回出る。同じ失敗が続いても毎分は出ない | 保存先を戻すと次の確認で作られる。成功か `false` の後に再び失敗すると toast がまた 1 回出る | 同上 |
| バックアップ画面で復元し、復元と退避の復旧の両方が失敗（二重失敗） | 画面を移っても待つ | 再起動の案内が出たまま。自動バックアップの確認は止まる | アプリを再起動すると確認が再開する | なし（T18） |

「この文書を完了できる」と「通常運用を達成できる」は一致する（4 件とも runtime の変更で、merge 後の通常起動で効く）。

## 起票時実測（2026-09-25、base `85b18a04`）

- 商品コードが入る経路: 手入力の `create_product` は JAN（BIZ-01-D1 で ASCII 数字 8 / 13 桁）か `generate_custom_code` の `{code_prefix}-{seq:04}`（`docs/function-design/30-biz-product-service.md` §4.2 step 3 / §4.3）で、利用者が任意の文字列を入れる経路が無い。`update_product` は product_code を変えない。任意の文字列が入るのは商品 CSV の `preview_import` / `commit_import`（`src-tauri/src/biz/product_service.rs:1009` / `:1243`）だけ。`preview_import` の商品コード検証は空判定のみ（`:1067`）、`commit_import` は wire から受けた `valid_rows` を再検証しない（30 §4.9「個別行のバリデーションエラー → preview_import で事前に検出済み」）。Z004 は JAN で既存商品を引き（`csv_import_service/parse.rs:108`）、商品コードを作らない
- 商品 CSV の文字コード: UTF-8 BOM 付きは UTF-8、それ以外は CP932（`src-tauri/src/io/product_csv_importer.rs:138-155`）。UTF-8 なら BMP 外の文字（UTF-16 で 2 unit）も入る
- frontend の 100 文字制限（`rg -n 'max\(100\)' src/features --glob '*types.ts'` と `src/features/products/{search,priceRevisionSearch}.ts`）: `stock-inquiry/types.ts:31` `q`・`:37` `selected`、`inventory-records/types.ts:43` `q`、`products/search.ts:55` `q`、`products/priceRevisionSearch.ts:21` `q`。zod の `.max()` は JS の `string.length`（UTF-16 code unit）で数える
- `products.product_code` を外部キーで参照する定義: `rg -n 'product_code' src-tauri/src/db/schema_v*.rs | rg -i 'references' | wc -l` = 8
- `apply_stock_change` の呼出し元（`rg -n 'apply_stock_change\(' src-tauri/src`）: 本番 5（下表）、test 6（`common.rs:146,175,198,226,247,293`、いずれも `&conn`）、関数 pointer の cast 1（`invariants.rs:213`）。`rg -n 'Transaction\b|Transaction<' src-tauri/src` = 0 hit（型名 `Transaction` を書いた箇所は無い）
- 起動順（`src-tauri/src/lib.rs:1157-1216`）: 診断ログ初期化 → 古いログ file 削除 → `prepare_database`（`reconcile_restore` → 新 DB が無いときだけ legacy 移行 → `init_database` = PRAGMA foreign_keys / journal_mode=WAL / busy_timeout → `migrate` → 復元後処理の補完）→ 操作ログの自動削除 → 起動時の自動バックアップ → `AppState`。`prepare_database` の Err は dialog を出して setup の Err で終わり、以降の手順は走らない
- `migrate`（`src-tauri/src/db/migration.rs:137-160`）: `schema_versions` を `CREATE TABLE IF NOT EXISTS` → `MAX(version)` → `migration.version > current_version` の分だけ適用（`:142`）。新しすぎる版では何もせず `Ok` を返し、呼出し側はそのまま書込みを続ける
- 復元は差し替えた file を `open_existing_database`（= `configure_database` → `migrate`）で開き、失敗なら現在の DB へ戻して `RestoreError::Recovered`（`src-tauri/src/mnt/restore.rs:483-500`）。backup file の schema 版は見ていない（`rg -n 'schema_versions|version' src-tauri/src/mnt/restore.rs` = 0 hit）
- 自動バックアップの確認の timer: `src/features/backup-restore/BackupRestorePage.tsx:167-188` の `useEffect` だけ（`rg -n 'setInterval|checkAutoBackup' src --glob '!*.test.*' --glob '!src/lib/bindings.ts'` = `BackupRestorePage.tsx:170` / `:173`）。二重失敗（`fatalRestoreKind`、page の `useState`、`:117`）で止める。成功（`true`）で一覧を invalidate するが toast は出さない。失敗は `toast.error("自動バックアップ確認に失敗しました", { id: "backup-auto-check-error" })` を毎回出す
- backend の `check_auto_backup`（`src-tauri/src/cmd/settings_cmd.rs:200-210`）は `AppState.db` の Mutex を取って判定する。重なって呼ばれても直列になり、2 回目は「設定時刻以降のバックアップあり」で `false` を返す（71 §71.8 step 5e〜g）。復元の二重失敗の後は Mutex に in-memory の空の接続が入る（`settings_cmd.rs:271-289`）
- 直接の `invalidateQueries` を許す file は `src/lib/invalidation-contract.static.test.ts:23-27` の 3 件（backup-restore の page を含む）。`docs/UI_TECH_STACK.md:250` は「backup/restore domain」を許可範囲とする
- `RootLayout` を描く test（`rg -l --glob '*.test.tsx' --glob '*.test.ts' -e 'routeTree\.gen' -e 'createAppRouter' -e 'RootLayout' src`）15 file のうち、`QueryClientProvider` / `renderWithClient` / `new QueryClient` を含まないのは 7 file（`RootLayout.test.tsx`、`OtherRecordDetailRoutes.test.tsx`、`app-router.test.tsx`、`app-router.null-cache.test.tsx`、`route-error-fallback.test.tsx`、`dev-script.test.ts`、`page-scroll.test.ts`）。実際に `RootLayout` を QueryClient なしで描くのがどれかは未実測（Writer が S4 の後に `npm test` で特定する）

## Scope

### S1 商品コードの長さ上限（BIZ-01-D5）

- `src-tauri/src/constants.rs`: `PRODUCT_CODE_MAX_LEN: usize = 100` を追加。コメントに「UTF-16 code unit で数える。frontend の route search（`selected` / `q`）の zod `.max(100)` と同じ数え方」と BIZ-01-D5 を書く
- `src-tauri/src/biz/product_service.rs`:
  - 長さ判定を 1 か所に置く（`code.encode_utf16().count() > PRODUCT_CODE_MAX_LEN`）
  - `preview_import` の行検証: 商品コードが空でなく上限を超えるとき、その行の errors に `商品コードは100文字以内で入力してください` を足す（行はエラー行になる。空判定・CSV 内重複・他の列の検証は今までどおり）
  - `commit_import`: TX を開く前に `valid_rows` の全行を同じ判定で調べ、1 行でも超えれば `BizError::ValidationFailed("商品コードは100文字以内で入力してください")` を返し DB を変えない（wire から来る行を信頼しない）
- 変えないもの: `create_product` / `update_product`（起票時実測のとおり任意の文字列が入らない）、DB schema、Z004・日報・EJ の取込み、frontend
- docs（同じ PR）: `docs/function-design/30-biz-product-service.md` §4.8 step 4（商品コードの行に上限）・§4.9 処理ステップ（TX 前の再検証）・BIZ-01-D5 の設計判断（上限の出典 = owner 決定 2026-09-25、数え方、置く層、DB CHECK を置かない理由）。`docs/db-design/master-tables.md:29` の `product_code` の説明に「100 文字以内（UTF-16 code unit）。取込み経路で BIZ-01-D5 が保証し、DB CHECK は置かない」

### S2 `apply_stock_change` の接続を借りた transaction に

- `src-tauri/src/biz/inventory_service/common.rs:41-42`: 第 1 引数を `conn: &rusqlite::Transaction<'_>` にする。本体の repo 呼出しは `Deref` で今までどおり通る（Probe S2）。使われなくなる `use crate::db::DbConnection;` を消す。doc comment の「TX 内部から呼ばれる」を「引数の型で TX の内側に限る」に改める
- 呼出し元の file × 呼出しの表（`rg -n 'apply_stock_change\(' src-tauri/src` と `invariants.rs` の cast、base `85b18a04`）:

| file | 呼出し | 渡している接続 | 本 lane の変更 |
|---|---|---|---|
| `biz/inventory_service/receiving.rs:196` | `create_receiving` の明細ごと | `&tx`（`:141` `conn.transaction()`） | なし |
| `biz/inventory_service/returns.rs:251` | `create_return` の明細ごと | `&tx`（`:190`） | なし |
| `biz/inventory_service/manual_sale.rs:267` | `create_manual_sale` の明細ごと | `&tx`（`:196`） | なし |
| `biz/inventory_service/disposal.rs:188` | `create_disposal` の明細ごと | `&tx`（`:136`） | なし |
| `biz/csv_import_service/commit.rs:157` | `execute_commit`（停止中の `legacy_commit_csv_import` からだけ到達、PR #95） | `&tx`（`:102`） | なし |
| `biz/inventory_service/common.rs:146,175,198,226,247,293` | 単体 test 6 本 | `&conn`（通常の接続） | test の中で `conn.transaction()` を開いて渡す。assertion は変えない（DB の確認も同じ `tx` 越しに読む） |
| `biz/inventory_service/invariants.rs:213` | `apply_stock_change as fn(_, _, _, _, _, _, _) -> _` | — | 第 1 引数の型を `&rusqlite::Transaction<'_>` と明記した cast にする（型を戻すとコンパイルが止まる guard、T4） |
| `biz/inventory_service/mod.rs:27` | `pub(crate) use common::apply_stock_change;` | — | なし |

- docs（同じ PR）: `docs/function-design/31-biz-inventory-service.md` §12.2 のシグネチャ（`conn: &Transaction<'_>`）と前提条件の 1 文（型で TX の内側に限る）。同 file 冒頭の「時点証拠契約（proposed・未実装）」の「apply_stock_changeの引数・符号・結果型は維持し」は、本 lane の後の引数を維持するという意味のまま成り立つので変えない

### S3 新しすぎる DB の拒否（MNT-03-D11）

- `src-tauri/src/db/mod.rs`: `DbError::SchemaNewerThanApp { db_version: i64, app_max: i64 }` を追加。Display は `データの版がこのアプリより新しいため開けません（データの版: {db_version}、このアプリが扱える版: {app_max}）`
- `src-tauri/src/db/migration.rs` `migrate`: `get_current_version` の直後、適用の loop の前で、`migrations()` の最大 version（`app_max`）と比べ、`current_version > app_max` なら上の Err を返す。`schema_versions` の作成（`CREATE TABLE IF NOT EXISTS`、既存なら何もしない）より後・どの migration の BEGIN よりも前に置く。`app_max` は `migrations()` から導き、数値を別に書かない
- `src-tauri/src/lib.rs`: `StartupDatabaseError::SchemaNewerThanApp(String)` を追加し、`prepare_database_with_init` は `init` の Err が `DbError::SchemaNewerThanApp` のときだけこの variant へ写す（他は今までどおり `DatabaseInit`）。`operator_message()` は `Some` で次の固定部 + `\n{details}` を返す（MNT-03-D5 の形）:
  - `このデータは、より新しい版のアプリで使われています。この版のアプリで書き込むとデータを傷めるおそれがあるため、起動を中止しました（データは変更していません）。新しい版のアプリを入れ直してから起動してください。わからない場合は管理者へ連絡してください。`
  - `Display` は他の variant と同じく detail をそのまま返す。setup の分岐（`lib.rs:1188-1200`）は変えない（`operator_message()` の `Some` を `show_pre_window_fatal` へ渡し、Err で setup を終える既存の形に乗る）
- 変えないもの: `restore.rs`（新しすぎる backup は既存の「開けなければ戻す」経路で `Recovered` になる。T10 で固定）、legacy 移行、`reconcile_restore`、PRAGMA の順
- docs（同じ PR）: `docs/function-design/22-mnt-migration.md` §3.2 処理ステップ（step 3 の後に版の比較）とエラーハンドリング、MNT-03-D11 の設計判断（書く前に止める・何を書かないか・`DatabaseInit` と分ける理由・復元への波及）、§12.4 の文言表に 1 行。`docs/function-design/10-common-rules.md` の DbError 列挙に variant。`docs/function-design/20-io-product-repo.md` §2.2 のエラー一覧に 1 行。`docs/function-design/71-mnt-backup.md` §71.7 の復元に「新しすぎる版の backup は差し替え後の open で拒否され、現在の DB に戻る（MNT-03-D11）」を 1 文

### S4 自動バックアップの確認の timer を共通レイアウトへ（UI-11b-D13）

- 新設 `src/features/backup-restore/useAutoBackupCheck.ts`（68 §68.6 の Query hooks 一覧に名前がある hook）:
  - `useAutoBackupCheck()`: mount 時に 60 秒の `setInterval` を 1 本張り、unmount で外す。mount の瞬間には呼ばない（起動時の確認は Rust の setup hook が持つ）
  - 各回: 停止中なら何もしない。`commands.checkAutoBackup()` を `unwrapResult` で呼び、`true` なら `queryKeys.backupRestore.list()` を invalidate し `toast.success("自動バックアップを作成しました")`。`false` なら何もしない
  - 失敗: 直前の回が失敗でなければ `toast.error("自動バックアップ確認に失敗しました", { id: "backup-auto-check-error" })`。失敗が続く間は出さない。`true` / `false` が返れば連続失敗の状態を解く（owner 決定待ち、Design Readiness の推奨案）
  - `suspendAutoBackupCheck()`: module scope の flag を立て、以後の回を止める。再起動（reload）で消える（`src/lib/restore-success-notification.ts` と同じ in-memory flag の形）
  - 前の回が終わる前に次の回が来ても待たずに呼ぶ（backend の Mutex と §71.8 step 5e〜g で 2 回目は `false`、起票時実測）
- `src/components/layout/RootLayout.tsx`: `useAutoBackupCheck()` を 1 回呼ぶ
- `src/features/backup-restore/BackupRestorePage.tsx`: `:167-188` の `useEffect`（interval）を消し、二重失敗を表示にした所（`setFatalRestoreKind(kind)`、`:318`）で `suspendAutoBackupCheck()` を呼ぶ。`unwrapResult` / `toast` などの import が使われなくなれば消す
- `src/lib/invalidation-contract.static.test.ts:23-27`: `ALLOWED_DIRECT_CALL_FILES` に `features/backup-restore/useAutoBackupCheck.ts` を足す（`docs/UI_TECH_STACK.md:250` の「backup/restore domain」の範囲内。page の同じ invalidate がこの file へ移る）
- `RootLayout` を QueryClient なしで描く既存 test: hook の module を mock する 1 行（`RootLayout.test.tsx` が `@/features/shortcuts` を mock しているのと同じ形）を足す。対象 file は S4 の後の `npm test` の失敗で特定する（起票時実測の候補 7 file）。assertion は変えない
- docs（同じ PR）: `docs/function-design/68-ui-backup-restore.md` の UI-11b-F5 / UI-11b-D9 / §68.3 / §68.8 / §68.10 の「60 秒 interval」を「共通レイアウトが mount する `useAutoBackupCheck` の 60 秒 interval（画面に依らない）」へ、UI-11b-D13 を新設（置き場所・二重失敗での停止の受け渡し・通知の出し方・重なった呼出しの扱い）、UI-11b-L3-5 の「60秒 interval 停止」は D13 の停止を指すと明記。`docs/function-design/71-mnt-backup.md` §71.8 関数要求の「フロントエンドタイマー（60秒間隔）」に「共通レイアウト（UI-12）が mount し、画面に依らない（UI-11b-D13）」を足す。`docs/function-design/52-ui-shared-layout.md` §52.1 の `RootLayout.tsx` 行に「自動バックアップ確認 hook の呼出し（UI-11b-D13。hook 本体と state は backup-restore feature が持つ）」、§52.2 に同じ例外を 1 文

### S5 test と生成物

- Test Design Matrix の T1〜T18
- REQ 付きの test を足すため `cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成する
- `cargo run --bin generate_bindings` で `src/lib/bindings.ts` に差分が出ないことを確かめる（command の型は変えない）

## Non-scope

- `docs/backlog.md` / `docs/Plans.md` の完了の記録（closeout で行う）
- 商品コードの DB CHECK、`products` の再作成 migration（Design Readiness）
- ㉘ runtime の `stock_revision` と数量の不可分更新。㉘ は後で `apply_stock_change` とその呼出し先 `inventory_repo::update_stock_quantity` を触る。本 lane は `apply_stock_change` の第 1 引数の型だけを変え、処理の中身・引数の並び・符号・`StockChangeOutcome` を変えないので、㉘ の設計（31 冒頭の時点証拠契約）と衝突しない
- MSI 配布手順の docs、旧版アプリの入れ直し手順（v1.0 gate、`docs/backlog.md:36`）
- 起動失敗の dialog の仕組み（`show_pre_window_fatal`、MNT-03-D4〜D8）
- 復元の手順（`restore.rs`）と backup file の版の事前検査
- `check_auto_backup` の backend、バックアップ画面の見た目・文言（toast 以外）
- frontend の既存の `max(100)` の値と数え方

## Acceptance Criteria

- **AC1（S1）** `cd src-tauri && cargo test --lib product_service` が pass し、T1・T2 を含む
- **AC2（S1）** `npx vitest run src/features/stock-inquiry` が pass し、T3 を含む
- **AC3（S2）** `rg -n -A1 'pub\(crate\) fn apply_stock_change\(' src-tauri/src/biz/inventory_service/common.rs` の 2 行目が `conn: &rusqlite::Transaction<'_>,`（baseline: `42-    conn: &DbConnection,`）
- **AC4（S2）** `cd src-tauri && cargo test --lib inventory_service && cargo test --lib csv_import_service` が pass（既存の在庫操作 test の期待値は変えない）
- **AC5（S3）** `cd src-tauri && cargo test --lib db::migration && cargo test --lib test_startup && cargo test --lib mnt::restore` が pass し、T6〜T10 を含む（T6〜T8 は `db::migration` の test module、T9 は `lib.rs` の test module〈`bindings_generation_tests`〉で名前を `test_startup_` で始める、T10 は `mnt::restore` の test module に置く）
- **AC6（S4）** `rg -n 'setInterval|checkAutoBackup' src --glob '!*.test.*' --glob '!src/lib/bindings.ts'` の一致が `src/features/backup-restore/useAutoBackupCheck.ts` だけ（baseline: `BackupRestorePage.tsx:170` / `:173`）
- **AC7（S4）** `npx vitest run src/features/backup-restore src/components/layout src/lib` が pass し、T11〜T18 を含む
- **AC8** mutant（Writer が注入 → red を確認 → 戻す。Final Reviewer が独立に再注入）: (1) S1 の判定を `chars().count()` にする → T1 の BMP 外の case が red (2) S1 の判定を `len()`（byte）にする → T1 のかなの case が red (3) `commit_import` の再検証を外す → T2 が red (4) S3 の比較を `>=` にする → T7 が red (5) S3 の比較を外す → T6・T8 が red (6) `prepare_database_with_init` の写像を外し `DatabaseInit` に落とす → T9 が red (7) S2 の第 1 引数を `&DbConnection` に戻す → `cargo test` がコンパイルで止まる（T4） (8) hook の失敗 toast の連続判定を外す → T13 が red (9) `BackupRestorePage` から `suspendAutoBackupCheck()` の呼出しを外す → T18 が red (10) `RootLayout` から hook の呼出しを外す → T16 が red
- **AC9** `cd src-tauri && cargo run --bin generate_bindings` の後 `git diff --exit-code src/lib/bindings.ts` が 0
- **AC10** `bash scripts/local-ci.sh full` が pass（traceability の再生成を含む生成系の検査が clean）
- **AC11** `bash scripts/doc-consistency-check.sh` が ERROR 0

## Design Sources

- Requirements / spec: REQ-104（商品 CSV の一括インポート）/ REQ-301（在庫照会）/ REQ-201〜204（在庫操作）/ REQ-903（マイグレーション・DB 基盤）/ REQ-901（バックアップ）
- Architecture: `docs/ARCHITECTURE.md`（`UI -> CMD -> BIZ -> IO/MNT`。S1 は BIZ、S2 は BIZ 内部、S3 は IO/MNT と起動、S4 は UI）
- Function / command / DTO: `docs/function-design/30-biz-product-service.md` §4.2 / §4.3 / §4.8 / §4.9、`31-biz-inventory-service.md` §12.2、`22-mnt-migration.md` §3.2 / §12.4、`71-mnt-backup.md` §71.7 / §71.8、`68-ui-backup-restore.md`、`52-ui-shared-layout.md` §52.1 / §52.2、`10-common-rules.md` DbError、`20-io-product-repo.md` §2.2
- DB: `docs/db-design/master-tables.md` products（`:29`）
- Screen / UI: `docs/UI_TECH_STACK.md:250`（直接 invalidate の許可範囲）、68 §68.9 / §68.11
- Decision log / ADR: 新しい D-n なし（設計判断は各 function design の decision ID に置く）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 30 §4.8 / §4.9 / BIZ-01-D5、31 §12.2、22 §3.2 / MNT-03-D11、10 DbError、20 §2.2 | updated in this PR |
| Command / DTO / generated binding / wire shape | 該当なし（`commit_import` の入力 DTO は不変、Err の kind は既存 `Validation`） | existing sufficient |
| DB / transaction / audit / rollback / migration | master-tables products、22 MNT-03-D11、71 §71.7 | updated in this PR |
| Screen / UI / route state / Japanese wording | 68 UI-11b-D13 ほか、52 §52.1 / §52.2、22 §12.4 の文言表 | updated in this PR |
| CSV / TSV / report / import / export format | 30 §4.8（行検証に 1 行。CSV の列・文字コードは不変） | updated in this PR |
| Durable decision / ADR | 各 decision ID（BIZ-01-D5 / MNT-03-D11 / UI-11b-D13） | updated in this PR |

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| REQ / coverage の追加・変更（test 内の REQ 参照の増加） | `cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成（S5、AC10） |

他の行（Tauri command の追加・function-design doc の新設・route・operator 画面の新設・consultation relay）は該当なし。`bindings.ts` は再生成して差分 0 を確かめる（AC9）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-104 / REQ-301 | 30 §4.8 / §4.9、master-tables products | BIZ-01-D5 | 上限 100 は owner 決定 2026-09-25（照会の 100 と揃える）。数え方は zod `.max()` と同じ UTF-16 code unit（文字数や byte 数だと BMP 外・かなで照会と食い違う）。棄却: DB CHECK（`products` を参照する FK 定義が 8 あり、SQLite は CHECK の追加に表の再作成が要る。任意の文字列が入る経路は取込みだけで BIZ で閉じられる） | S1 | T1 / T2 / T3 |
| REQ-201〜204 | 31 §12.2 | 31 §12.2 前提条件 | 「TX の内側から呼ぶ」を型で強制する。棄却: doc comment のまま（backlog `:49` の指摘）、㉘ で一緒に直す（㉘ は店の確認待ちで未着手、型の変更は振舞いを変えず先に閉じられる） | S2 | T4 / T5 |
| REQ-903 | 22 §3.2 / §12.4 | MNT-03-D11 | 旧版のアプリが新しい DB に書く事故を書込みの前に止める。`DatabaseInit` の「再起動してもう一度」は再起動で直らないため文言を分ける。棄却: 読み取り専用で起動（画面ごとの書込み禁止が要り範囲が大きい）、警告して続行（書込みが起きる） | S3 | T6〜T9 |
| REQ-901 | 71 §71.7 | MNT-03-D11（波及） | 新しすぎる backup を復元すると旧版のアプリがそれに書く。差し替え後の open が拒否すれば既存の戻し経路で安全に失敗する。棄却: restore に版の事前検査を足す（同じ判定の二重化） | S3（変更なし、test のみ） | T10 |
| REQ-901 | 71 §71.8、68 UI-11b-F5 / D9 | UI-11b-D13 | 71 §71.8 どおり画面に依らず 60 秒ごとに確認する。置き場所は共通レイアウト（全 route の親で、test で配線を確かめられる）。棄却: §71.8 を実装に合わせて弱める（設定時刻のバックアップが取れない日が残る）、`main.tsx` に置く（配線を source 文字列でしか確かめられない） | S4 | T11〜T18 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: S1〜S4 の docs 同期の後は yes（上限と数え方・置く層、型の約束、拒否の位置と文言、timer の置き場所と停止・通知）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: BIZ-01-D5 / MNT-03-D11 / UI-11b-D13 と、master-tables の `product_code` の上限
- Assumptions and constraints: 新しい版の DB はこのアプリの系列が作るので WAL mode である（全版が `PRAGMA journal_mode = WAL` を実行する）。Probe S3-b は WAL の DB で起動時の読取りが bytes を変えないことを確かめた
- Deferred design gaps, risk, and follow-up target: 旧版を入れ直す手順の文書化（MSI 配布手順、v1.0 gate）。自動バックアップの通知の出し方は owner 決定待ち（Design Readiness）
- Test Design Matrix can cite design decision IDs or source doc sections: yes
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「101 文字以上の商品コードが入らない」は取込みの 2 入口（T1 / T2）と、任意の文字列が入らない手入力経路（起票時実測）で成り立つ。例外 = 開発用の `seed_demo` と test の直接 INSERT（本番経路でない）。「新しすぎる DB に書かない」は `migrate` を通るすべての open（起動・復元の差し替え後）で成り立つ。例外 = `init_database` の前に走る `reconcile_restore`（復元途中の file の入れ替えだけで DB の中身を書かない）と legacy 移行（新 DB が無いときだけ、旧 DB の複製を置く）。互換: 版が同じか古い DB の挙動は不変

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable（POS adapter に触れない） | — |
| Fact check / design decision split | 事実（SQLite の読取りが bytes を変えない、rusqlite の `Transaction` の `Deref`、zod の数え方）を Contract Probe で確かめ、設計判断（上限の層・拒否の位置・timer の置き場所）と分けた | Contract Probe |
| Lifecycle / retry | S3: 拒否の後に新しい版を入れ直せば通常起動（DB 不変）。S4: 失敗の後の次の回で再試行、二重失敗の後は再起動まで停止 | Matrix の State Lifecycle |
| Operator workflow | S3 の dialog と S4 の toast が operator に見える。文言は Scope | Design Readiness の owner 決定待ち |
| Replacement path | S4 は page の timer を hook へ置き換える。page 側の 2 本の既存 test を hook と結合 harness へ移す（弱めない、Matrix の対応表） | Matrix |
| Data safety / evidence | S3 は書く前に止める。S1 は取込みの受理範囲を狭める（本番データ無し、店のコードは JAN 13 桁か独自コードで 100 に届かない） | Data Safety |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 不要と判断（Design Readiness） | — |
| 環境・再現性 | 新しい環境依存なし。rusqlite 0.31 の bundled SQLite 3.45.0 で Probe S3-b を実測 | — |

## Design Readiness

- Existing design docs are sufficient because: 4 件とも向きは正本か owner / Coordinator の決定で決まっている（S1 = owner 決定の上限、S2 = 31 §12.2 の前提条件、S3 = backlog `:50` の「書込みの前に拒否」、S4 = 71 §71.8）。本 PR で同期するのは、その具体化（数え方・層・位置・文言・置き場所）
- Source docs updated in this PR: S1〜S4 の「docs」に列挙
- Design gaps intentionally deferred: MSI 配布手順（v1.0 gate）、`stock_revision`（㉘）
- Durable decisions discovered in this plan and promoted to source docs: BIZ-01-D5 / MNT-03-D11 / UI-11b-D13（decision ID は本 packet が予約する。並走 lane が同じ系列を足す場合は merge 後の側が採番し直す）

**owner 決定（2026-09-25 に回答済み = (a)）: 自動バックアップの通知の出し方**

timer を画面に依らない場所へ移すと、確認の結果の toast がどの画面にも出るようになる。今の page は成功で toast を出さず（68 UI-11b-F5 / D9 は「完了 toast を表示する」と書く）、失敗で毎回 toast を出す（Toaster は 3 秒で消える、`RootLayout.tsx:69`）。

- (a) 推奨: 成功は toast `自動バックアップを作成しました` を 1 回（正本 F5 / D9 どおり。設定時刻の分だけなので 1 日に高々 1 回）。失敗は連続失敗の最初の 1 回だけ toast、成功か `false` で解く。売上の入力中などに毎分 toast が出るのを避けつつ、失敗を 1 回は見せる
- (b) 失敗も今の page と同じく毎分 toast（どの画面でも）。成功は (a) と同じ
- (c) 成功の toast を出さない（正本 F5 / D9 を実装に合わせて直す）。失敗は (a) と同じ

packet は (a) で書いた。(b) / (c) なら S4 の hook の 1 か所・UI-11b-D13 の文・T12 / T13 を直す（plan-gate のまま訂正）。

**manual の要否（drafter の判断、manual なし）**

- S3 の dialog は既存の `show_pre_window_fatal`（Windows は `MessageBoxW`）をそのまま使い、起動失敗の可視化の lane（MNT-03-D5〜D8）で Windows 実機の表示を確認済み。本 lane で変わるのは文言と variant だけで、T9 が固定部の文字列と setup の分岐を確かめる。Windows 実機で見るには `schema_versions` に行を足した DB が要り、`docs/DEV_WORKFLOW.md` の L3 Eligibility (3)（合成の行の挿入のような故障注入級の手順は自動 test へ回す）に当たる
- S4 は画面の構成を変えない。60 秒の周期・停止・通知は fake timer の test で確かめ、`check_auto_backup` の backend は変えない
- S1 のエラー文言は既存のエラー行の一覧に 1 種類増えるだけで、画面の構成は変えない

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): S1 の上限は BIZ（CMD は薄いまま）。S3 の判定は `db::migration`（MNT-03）、operator 文言は起動（lib.rs）。S4 は UI の hook で、判定は backend のまま
- Backend function design: 30 / 31 / 22 を同期
- Command / DTO / data contract: 不変（`bindings.ts` 差分 0、AC9）
- Persistence / transaction / audit impact: S1 は TX 前に拒否（操作ログを書かない）。S2 は TX の境界を型にするだけ。S3 は migration の BEGIN より前に拒否
- Operator workflow / Japanese UI wording: S1 のエラー行の文言、S3 の dialog の固定部、S4 の toast 2 種（Scope）
- Error, empty, retry, and recovery behavior: S3 は新しい版を入れ直せば回復。S4 の失敗は次の回で再試行、二重失敗は再起動で再開
- Testability and traceability IDs: REQ-104 / REQ-301 / REQ-201〜204 / REQ-903 / REQ-901、SPEC-SSG-2026-09-25

## Contract Probe

- rusqlite の `&Transaction<'_>` を受ける関数の中で、`&DbConnection` を受ける repo 関数がそのまま呼べ、5 つの本番の呼出し元が変更なしでコンパイルでき、test を TX 経由に直せば通る（Probe S2）: scratchpad に src-tauri を複製し S2 を仮適用して `cargo check --all-targets` → lib はコンパイルでき、error は `common.rs` の test 6 か所の型不一致だけ（warning は使われなくなった `DbConnection` の import）。test を `conn.transaction()` 経由に直し `invariants.rs:213` の cast に型を明記すると `cargo test --lib inventory_service` 89 pass、`cargo clippy --all-targets --all-features -- -D warnings` clean。第 1 引数を `&rusqlite::Connection` に戻すと `invariants.rs:213` の cast が `E0605` でコンパイルを止めた（test の `&tx` は `Deref` で通るので、cast が唯一の guard）
- 新しすぎる版の WAL の DB を起動時と同じ PRAGMA と `CREATE TABLE IF NOT EXISTS schema_versions` と `SELECT MAX(version)` で開いて閉じても、main file の bytes と file の集合が変わらない（Probe S3-a / S3-b）: S3-a = Python sqlite3 3.51.3 で WAL の DB（`schema_versions` 1〜7）を作り hash → 上の手順 → hash 一致、file は `inventory.db` だけ。S3-b = 仮適用なしの probe crate で `init_database` → `schema_versions` に 7 を足して閉じ hash → rusqlite（bundled SQLite 3.45.0）で同じ手順 → hash 一致、file は `inventory.db` だけ
- zod の `.max(100)` が UTF-16 code unit で数える（BMP 外 1 文字 = 2）: 未実測。T3 が stock-inquiry の schema に同じ golden 文字列を通して確かめる（T1 と独立に転記した値）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| master-tables products `product_code` の上限（新設） | S1 | T1 / T2 | — |
| 30 BIZ-01-D5 数え方 = UTF-16 code unit、上限 100 | S1 | T1（境界・BMP 外・かな）/ T3（frontend と同じ文字列） | — |
| 30 §4.8 step 4 行検証（空・CSV 内重複・部門・価格・税率・PLU対象）は不変 | S1（1 行足すだけ） | 既存 `test_preview_import_req104_validation_errors` ほか | — |
| 30 §4.9 `commit_import` は wire の行を再検証し、超過なら DB を変えない | S1 | T2 | — |
| 30 §4.2 step 3 / §4.3 手入力の product_code は JAN か発番（上限に届かない） | 変更なし | 既存 | non-scope（起票時実測） |
| 30 BIZ-01-D1 手入力の JAN 形式検証、import 経路は寛容 | 変更なし | 既存 | non-scope |
| stock-inquiry `selected` / `q` の `max(100)` | 変更なし（oracle） | T3 | — |
| 31 §12.2 シグネチャ・前提条件（TX の内側、自身は TX を開かない） | S2 | T4（型の guard）/ T5 | — |
| 31 §12.2 処理ステップ 1〜6・INV-2・INV-3 は不変 | 変更なし | 既存 common.rs 6 本（TX 経由へ）、inventory_service の 4 業務 test | — |
| 31 時点証拠契約（proposed、㉘） | 変更なし | — | non-scope（㉘） |
| 32 §15 commit の `apply_stock_change(&tx, …)`（停止中） | 変更なし | 既存 csv_import_service の test | — |
| 35 / 36 の apply_stock_change 非経由 | 変更なし | — | non-scope |
| 22 §3.2 migrate の処理ステップ（版の比較を追加） | S3 | T6 / T7 | — |
| 22 MNT-03-D11 書く前に止める（schema_versions・DDL・DB bytes 不変） | S3 | T6 / T8 | — |
| 22 MNT-03-D1 ROLLBACK / COMMIT 失敗の併合 | 変更なし | 既存 E1〜E3 | — |
| 22 MNT-03-D4 / D5 fail-closed の dialog と表示完了後の終了 | 変更なし（新 variant が同じ分岐に乗る） | T9 + 既存 `test_startup_spec_sfv_t3_*` | 既存 L3（MNT-03-D8 の lane で確認済み） |
| 22 MNT-03-D7 `operator_message()` は `Option<String>` のまま、defensive fallback 維持 | S3 | T9 | — |
| 22 §12.4 文言表（新しい行） | S3 | T9（固定部の完全一致） | — |
| 22 §12 legacy 移行 / 71 reconcile は init の前に走り DB の中身を書かない | 変更なし | 既存 b9 ほか | — |
| 10 DbError 列挙 / 20 §2.2 init_database のエラー | S3 | T6 | — |
| 71 §71.7 復元: 差し替え後の open 失敗で現在の DB へ戻る（新しすぎる版に波及） | 変更なし | T10 | — |
| 71 §71.8 setup hook と画面に依らない 60 秒の確認 | S4 | T11 / T16 | — |
| 71 §71.8 処理ステップ（backend） | 変更なし | 既存 backup.rs の test | — |
| 68 UI-11b-F5 / D9 / §68.10 `true` で一覧を invalidate、完了 toast | S4 | T12 | — |
| 68 UI-11b-D13 置き場所・停止・通知・重なり（新設） | S4 | T11〜T18 | — |
| 68 UI-11b-D5 / L3-5 二重失敗で確認を止める | S4 | T18 | — |
| 68 §68.3 / §68.6 hook 名 `useAutoBackupCheck` | S4 | T11 | — |
| 52 §52.1 / §52.2 共通レイアウトの責務（hook の呼出しだけ） | S4 | T16 | — |
| UI_TECH_STACK:250 直接 invalidate は backup/restore domain まで | S4（allowlist に 1 file） | `invalidation-contract.static.test.ts` | — |
| SPEC-SSG-2026-09-25 C1〜C9 | S1〜S4 | Trace Matrix | — |

## Test Plan

[Test Design Matrix](test-matrices/2026-09-25-save-startup-guards.md)。

- targeted tests: T1〜T18
- negative tests: T1（101・BMP 外 51 文字）/ T2（commit の超過）/ T6（新しすぎる版）/ T10（新しすぎる backup）/ T13（連続失敗）/ T18（二重失敗後）
- compatibility checks: T7（同じ版は何もしない）、既存の migration・起動・在庫操作・取込みの test を期待値を変えずに通す
- data safety checks: T2（DB 不変）/ T8（file の bytes 不変）/ T9（起動が止まり後続の手順が走らない）/ T10（現在の DB が残る）
- main wiring/integration checks: T16（共通レイアウトの下で route を移っても確認が続く）/ T17（バックアップ画面を開いても 1 分に 1 回）/ T18（page の二重失敗が hook を止める）/ T9（setup の分岐）
- commit 構成（1 通りに決める）: S1・S2・S3・S4 をそれぞれ 1 commit（test・実装・その S の docs 同期を同じ commit に入れる）、最後に `90-traceability.md` の再生成を別 commit。計 5 commit。packet / Matrix / `docs/Plans.md` / `docs/backlog.md` は Writer が編集しない
- 検証 command が書く出力: `bash scripts/local-ci.sh full` が `.local/ci-evidence/` へ書く log、`cargo` の `target/`、vitest の一時出力は許す（untracked / gitignore の生成物に限る）

## Boundary / Wire Contract

- producer: 商品 CSV（UTF-8 BOM / CP932）→ `preview_import`、frontend → `commit_import(valid_rows)`（JSON）、SQLite の `schema_versions`、`commands.checkAutoBackup()` の `boolean`
- consumer: BIZ-01 の行検証、`migrate`、起動の dialog、`useAutoBackupCheck`
- wire type: `ImportRow.product_code: String`（不変）、`CmdError`（`commit_import` の超過は既存 kind `Validation`）
- internal type: `DbError::SchemaNewerThanApp { db_version: i64, app_max: i64 }`、`StartupDatabaseError::SchemaNewerThanApp(String)`（wire に出ない）
- precision/range: 商品コード ≤ 100 UTF-16 code unit。schema 版は `i64`、`app_max` は `migrations()` の最大
- round-trip path: CSV → preview → 登録 → 在庫照会 `selected`（zod `max(100)`）→ `get_stock_detail`
- invalid input: 101 以上の商品コード → エラー行 / `ValidationFailed`。`schema_versions` の最大 > `app_max` → 起動中止・復元は `Recovered`
- compatibility: 本番データは無い（`docs/project-memory.md` Store Premises Facts）。開発・試験の DB に 100 を超える商品コードがあっても読取り・在庫操作は今までどおり動き、再取込みだけが拒否される

## Review Focus

- 版の比較が、どの書込み（migration の BEGIN・`schema_versions` の INSERT・操作ログの削除・自動バックアップ・復元後処理の補完）よりも前にあるか。`CREATE TABLE IF NOT EXISTS` と `PRAGMA journal_mode = WAL` が新しい版の DB で何も書かない前提（Probe S3）の妥当性
- `SchemaNewerThanApp` だけを新しい文言へ写し、他の init 失敗の文言・順序を変えていないか
- S1 の数え方が frontend と一致するか（T1 と T3 が独立に同じ golden 文字列を持つか）。`commit_import` の再検証が TX の前か
- S2 が振舞いを変えていないか（呼出し元 5 file に差分が無いこと、common.rs の test の assertion が同じこと）
- S4 の置き換えで既存 test が弱まっていないか（Matrix の「既存 test の移し先」）。二重失敗の停止が page と hook の間で正しく受け渡されるか。StrictMode の二重 mount で interval が 1 本か
- 自動バックアップの通知が owner 決定と一致するか

## Spec Contract

Contract ID: SPEC-SSG-2026-09-25

- C1: 商品 CSV の preview は、UTF-16 code unit で 100 を超える商品コードの行を `商品コードは100文字以内で入力してください` のエラー行にし、100 以下は上限の理由で拒否しない
- C2: `commit_import` は TX を開く前に全行の商品コードを C1 と同じ判定で調べ、超過があれば `ValidationFailed` で DB を変えない
- C3: `apply_stock_change` の第 1 引数は `&rusqlite::Transaction<'_>` で、在庫・履歴の結果は変わらない
- C4: `migrate` は `schema_versions` の最大が `migrations()` の最大を超えるとき、どの migration も始めずに `DbError::SchemaNewerThanApp` を返し、DB を書かない
- C5: 起動は C4 の Err を `StartupDatabaseError::SchemaNewerThanApp` の固定文言で dialog に出し、setup を Err で終える（以降の手順は走らない）。他の init 失敗は `DatabaseInit` のまま
- C6: 新しすぎる版の backup の復元は、現在の DB に戻して `RestoreError::Recovered` で失敗する
- C7: 自動バックアップの確認は共通レイアウトが mount する hook の 60 秒 interval で呼ばれ、route に依らない。バックアップ画面は自分の interval を持たない
- C8: 確認が `true` なら一覧を invalidate し成功 toast、失敗は連続失敗の最初の 1 回だけ失敗 toast（owner 決定待ち、推奨案）
- C9: 復元の二重失敗の後は確認を呼ばない（再起動まで）

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| C1 | S1 | T1 / T3 | 数え方の一致 | AC1 / AC2 / AC8 (1)(2) |
| C2 | S1 | T2 | TX の前 | AC1 / AC8 (3) |
| C3 | S2 | T4 / T5 | 振舞い不変 | AC3 / AC4 / AC8 (7) |
| C4 | S3 | T6 / T7 / T8 | 書く前 | AC5 / AC8 (4)(5) |
| C5 | S3 | T9 | 文言と分岐 | AC5 / AC8 (6) |
| C6 | S3 | T10 | 復元への波及 | AC5 |
| C7 | S4 | T11 / T16 / T17 | 置き換えと二重呼出し | AC6 / AC7 / AC8 (10) |
| C8 | S4 | T12 / T13 | owner 決定との一致 | AC7 / AC8 (8) |
| C9 | S4 | T14 / T18 | 受け渡し | AC7 / AC8 (9) |

## Data Safety

- 実店舗の JAN・商品名・商品コード・DB・backup file を test / docs / PR に入れない。商品コードの test 値は合成（`A` の繰り返し、`𠀋`〈U+2000B〉の繰り返し、`あ` の繰り返し）
- local-only paths: `.local/ci-evidence/`（local-ci の log）
- synthetic-only paths: `src-tauri/src/**` の `#[cfg(test)]` と tempdir、`src/**/*.test.tsx` の mock

## Implementation Results

Fill after implementation.

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
