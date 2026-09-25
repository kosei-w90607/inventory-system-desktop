# Test Design Matrix: 保存と起動の守り

[Plan Packet](../2026-09-25-save-startup-guards.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-SSG-2026-09-25 C1〜C9（packet の Spec Contract）
- BIZ-01-D5 / MNT-03-D11 / UI-11b-D13（S1〜S4 の docs 同期の後）、31 §12.2 の前提条件

## Failure Modes

- FM1: 101 以上（UTF-16 code unit）の商品コードが preview を通り登録される
- FM2: 数え方が frontend と食い違う（文字数や byte 数で数え、BMP 外の文字で「登録できるのに照会で選べない」、かなで「照会できるのに登録できない」）
- FM3: preview を通さず `commit_import` へ直接送られた行が上限を超えて入る、または途中まで書いてから止まる
- FM4: `apply_stock_change` に通常の接続を渡すコードがコンパイルできる（型の約束が戻る）
- FM5: S2 の型の変更で在庫・履歴の結果が変わる
- FM6: 新しすぎる版の DB で起動が続き、書込みが起きる
- FM7: 拒否の位置が書込みの後にあり、`schema_versions`・DDL・DB file の bytes が変わる
- FM8: 同じ版の DB まで拒否する（比較の境界の誤り）
- FM9: 新しすぎる版が `DatabaseInit`（「再起動してもう一度」）の文言で出る、または dialog を出さずに終わる
- FM10: 新しすぎる版の backup の復元が成功扱いになり、旧版のアプリがそれに書く
- FM11: バックアップ画面以外では確認が動かない（backlog `:56` の現行の不具合）
- FM12: バックアップ画面を開くと page と共通レイアウトの 2 本の interval が走る
- FM13: 失敗の toast が毎分どの画面にも出る、または一度も出ない
- FM14: 復元の二重失敗の後も確認が走り続ける（page の state が hook に届かない）
- FM15: unmount・StrictMode の二重 mount で interval が残る、増える
- FM16: 既存 test を移す過程で、60 秒の周期・一覧の invalidate・二重失敗での停止の assertion が消える（tautology 化）

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | FM1 / FM2 | unit（BIZ、UTF-8 BOM の CSV bytes を既存 helper で作る） | T1 `biz::product_service::tests::test_preview_import_req104_product_code_length_limit`: 行ごとに (a) `A`×100 → valid (b) `A`×101 → error、errors に `商品コードは100文字以内で入力してください` が完全一致で 1 つ (c) `𠀋`（U+2000B）×50 = 100 unit → valid (d) `𠀋`×51 = 102 unit → error (e) `あ`×100（300 byte）→ valid (f) `あ`×101 → error。他の列は全行正常 | 判定が無い / `chars().count()`（(d) を通す）/ `len()`（(e) を拒否）/ 境界が `>=` |
| C2 | FM3 | unit（BIZ、実 DB） | T2 `biz::product_service::tests::test_commit_import_req104_rejects_overlong_product_code_without_writes`: `valid_rows` = 正常な 1 行 + `A`×101 の 1 行で `commit_import` → `Err(BizError::ValidationFailed(msg))`、msg が上の文言。前後で `products` の件数・`operation_logs` の件数・`inventory_movements` の件数が同じ（正常な行も入らない） | 再検証が無い / TX の中で 1 行目を書いてから止まる（件数が増える） |
| C1 | FM2 | unit（frontend、T1 と独立に転記した golden） | T3 `src/features/stock-inquiry/types.test.ts` 「REQ-301 / BIZ-01-D5: selected は BIZ と同じ数え方で 100 まで受理する」: `stockInquirySearchSchema` に `selected` = `A`×100 / `𠀋`×50 / `あ`×100 → 保持、`A`×101 / `𠀋`×51 → `undefined` | zod の数え方の前提（Contract Probe の未実測項目）が違う |
| C3 | FM4 | compile（型の guard） | T4 `biz/inventory_service/invariants.rs` の `test_pub_use_req201_leak_detection` の cast を `apply_stock_change as fn(&rusqlite::Transaction<'_>, _, _, _, _, _, _) -> _` にする | 第 1 引数が `&DbConnection` に戻る（Probe S2 で `E0605` を確認済み） |
| C3 | FM5 | unit（既存 6 本の書換え） | T5 `common.rs` の `test_apply_stock_change_req201_{increase,decrease,negative_warning,product_not_found,movement_recorded,update_returns_false}`: `let tx = conn.transaction()` を渡し、DB の確認も `tx` 越しに読む。期待値（15 / 7 / -3・警告 / NotFound / movement の 6 列）は変えない | 型の変更で在庫の計算・履歴の記録が変わる |
| C3 | FM5 | regression（既存） | `cargo test --lib inventory_service`（入庫・返品・手動販売・廃棄・冪等性・不変条件）と `cargo test --lib csv_import_service`（停止中の旧本体を含む） | 呼出し元の挙動が変わる |
| C4 | FM6 / FM7 | unit（MNT-03、in-memory でなく tempdir の実 DB） | T6 `db::migration::tests::test_migrate_req903_d11_rejects_newer_schema_without_writes`: `init_database` で最新版の DB を作り、`schema_versions` に `app_max + 1` を足して閉じる → 新しい接続で `migrate` → `Err(DbError::SchemaNewerThanApp { db_version: app_max + 1, app_max })`。前後で `SELECT version FROM schema_versions ORDER BY version` と `SELECT type, name, sql FROM sqlite_master ORDER BY name` が同じ | 比較が無い / 比較が適用の loop の後 |
| C4 | FM8 | unit | T7 `db::migration::tests::test_migrate_req903_d11_same_version_is_noop`: 最新版の DB に `migrate` をもう一度 → `Ok(())`、`schema_versions` の行が同じ | 比較が `>=` |
| C4 | FM7 | unit（file の bytes） | T8 `db::migration::tests::test_init_database_req903_d11_newer_schema_leaves_file_bytes_unchanged`: T6 と同じ DB を閉じて SHA-256 → `init_database` → `Err(SchemaNewerThanApp)` → drop → SHA-256 が同じ、tempdir の file の集合が同じ（Probe S3-b の形） | 拒否より前に書く処理がある（PRAGMA の順を変えた等） |
| C5 | FM9 | unit（起動、既存 `prepare_database_with_init` の注入と実 DB） | T9 `bindings_generation_tests::test_startup_req903_d11_newer_schema_stops_startup_with_own_message`: (a) 実 DB（`app_data/inventory.db` に T6 と同じ新しすぎる DB）で `prepare_database` → `Err(StartupDatabaseError::SchemaNewerThanApp(_))`（`DatabaseInit` でない） (b) `operator_message()` が `Some`、固定部（packet Scope S3 の文）を独立転記して完全一致、末尾に `\n` + 版の detail (c) `init` が `DbError::ConnectionFailed` を返す注入では従来どおり `DatabaseInit`。setup の分岐は既存 `test_startup_spec_sfv_t3_database_init_failure_has_operator_message` が `operator_message()` → `show_pre_window_fatal` を固定 | 写像が無い / 文言が `DatabaseInit` のまま / 他の失敗まで新しい区分に写す |
| C6 | FM10 | unit（MNT-01、既存 restore の harness） | T10 `mnt::restore::tests::test_restore_req901_newer_schema_backup_rolls_back_to_current`: 現在の DB（supplier `old`）と、`schema_versions` に `app_max + 1` を足した backup（supplier `new`）→ `restore_backup_with_ops(…, InjectedOps::new(InjectedFailure::None))` → `Err(RestoreError::Recovered(msg))`、msg に版の detail、再 open で supplier が `old`、復元の遺物が無い（既存 `assert_no_restore_artifacts`） | 新しすぎる backup が成功扱いになる |
| C7 | FM11 | unit（hook、fake timer、`renderHook` + QueryClient） | T11 `src/features/backup-restore/useAutoBackupCheck.test.tsx` 「REQ-901 / UI-11b-D13: 60 秒ごとに確認し、mount の瞬間には呼ばない」: mount 直後 0 回 → 60 秒で 1 回 → 120 秒で 2 回 | interval が無い / mount で即時に呼ぶ / 周期が違う |
| C8 | FM13 | unit（hook） | T12 同 file 「`true` で一覧を invalidate し成功 toast、`false` では何もしない」: `invalidateQueries` の spy が `queryKeys.backupRestore.list()` で 1 回、`toast.success` が `自動バックアップを作成しました` で 1 回。`false` の回は両方 0 | invalidate が無い / 成功 toast が無い（owner 決定 (c) なら toast の assertion を反転） |
| C8 | FM13 | unit（hook） | T13 同 file 「失敗の toast は連続失敗の最初の 1 回だけ」: 失敗・失敗・失敗 → `toast.error` 1 回（id `backup-auto-check-error`）、次に `false`、次に失敗 → 2 回目の `toast.error` | 連続判定が無い（毎回出る）/ 解除が無い（2 回目が出ない）（owner 決定 (b) なら毎回出る形へ） |
| C9 | FM14 | unit（hook） | T14 同 file 「`suspendAutoBackupCheck()` の後は呼ばない」: 60 秒で 1 回 → suspend → さらに 120 秒で呼出し回数が増えない | flag を見ない |
| C7 | FM15 | unit（hook） | T15 同 file 「unmount で止まり、StrictMode の二重 mount でも 1 本」: `<StrictMode>` で mount → 60 秒で 1 回（2 回でない）→ unmount → 60 秒で増えない | cleanup が無い / effect の中で interval を 2 本張る |
| C7 | FM11 | integration（`RootLayout` を root にした memory router、QueryClient あり、hook は mock しない、`commands.checkAutoBackup` を mock） | T16 `src/components/layout/RootLayout.test.tsx` 「UI-12 / UI-11b-D13: route を移っても自動バックアップの確認が続く」: `/` で 60 秒 → 1 回、別の子 route へ navigate して 60 秒 → 2 回 | `RootLayout` が hook を呼ばない（page にしか timer が無い現行の不具合） |
| C7 | FM12 | integration（実 routeTree、既存 `BackupRestorePage.flow.test.tsx` の harness） | T17 同 file 「REQ-901 / UI-11b-D13: バックアップ画面を開いていても確認は 1 分に 1 回」: `/settings/backup` で 60 秒 → `checkAutoBackup` 1 回、120 秒 → 2 回 | page に interval が残る（2 回 / 60 秒） |
| C9 | FM14 / FM16 | integration（hook を mount する wrapper + `BackupRestorePage`、既存 page test の fake timer と mock） | T18 `BackupRestorePage.test.tsx` の既存 「QR-05 REQ-901 stops auto backup checks after double failure」を、`useAutoBackupCheck()` を呼ぶ wrapper と page を一緒に描く形に直す: 二重失敗の表示の後 60 秒進めても呼出し回数が増えない。wrapper なしの page 単体では timer が無く assertion が自明に通るため、wrapper を必須とする | page が `suspendAutoBackupCheck()` を呼ばない |

既存 test の移し先（FM16、弱めない）:

| 既存 test（`src/features/backup-restore/BackupRestorePage.test.tsx`、base `85b18a04`） | assertion | 移し先 |
|---|---|---|
| `QR-05 REQ-901 checks auto backup every 60 seconds`（`:440`） | mount 直後 0 回、60 秒で 1 回、一覧の再取得 | T11（周期）+ T12（invalidate）。page 側には T17 の「page を開いても 1 分に 1 回」を置く。元の test は page に timer が無くなるため削除し、PR body に移し先を書く |
| `QR-05 REQ-901 stops auto backup checks after double failure`（`:291`） | 二重失敗の後 60 秒で呼出しが増えない | T18（同じ名前のまま wrapper つきへ） |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 商品 CSV の行（S1） | 未取込み | preview 中 | 100 以下 → valid | — | 再 preview で同じ判定 | 画面を戻っても同じ | — | 101 以上 → error 行 / commit は `ValidationFailed` | CSV を直して再 preview | T1 / T2 |
| 起動時の DB（S3） | file あり | `init_database` | 版 ≤ app_max → 通常起動 | — | — | — | 新しい版を入れ直して起動 → 通常起動（DB 不変のため） | 版 > app_max → dialog → 終了、DB 不変 | 同じ版のまま再起動 → 同じ dialog | T6〜T9 |
| 復元の差し替え（S3 の波及） | 現在の DB | 差し替え・open | 版 ≤ app_max → 成功（既存） | — | — | — | — | 版 > app_max → 現在の DB へ戻す `Recovered` | 別の backup を選ぶ | T10 |
| 自動バックアップの確認（S4） | mount、0 回 | 呼出し中（重なっても待たない） | `true` → invalidate + 成功 toast / `false` → 何もしない | 一覧の query | バックアップ画面を開けば一覧に出る | route を移っても続く | reload で suspend が解け、連続失敗の状態も消える | 最初の失敗だけ toast | 次の 60 秒で再試行、`true` / `false` で連続失敗を解く | T11〜T18 |
| 二重失敗の停止（S4） | 未停止 | — | — | — | — | 画面を移っても停止のまま | 再起動で解除 | 二重失敗 → suspend | — | T14 / T18 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 商品コードの 100 文字（UTF-16）上限 | frontend の `max(100)` 5 site（packet 起票時実測）、BIZ の商品コードの入口（`create_product` / `update_product` / `preview_import` / `commit_import`）、Z004 parse | `preview_import` / `commit_import` | `create_product`（JAN か発番で届かない）/ `update_product`（product_code 不変）/ Z004（JAN で引くだけ）/ frontend（値・数え方は不変、oracle として T3） | T1〜T3 |
| TX の内側を前提にする BIZ helper | `rg -n 'TX内\|TX 内\|トランザクション内' src-tauri/src/biz --glob '!**/tests/**'`（起票時実測、base `85b18a04`）: 関数の前提として書いてあるのは `inventory_service/common.rs:37`（`apply_stock_change`）と `product_service.rs:153`（`generate_custom_code`、30 §4.3 も「TX 内で呼ばれる」と注記）の 2 つ。他の hit は関数の中の手順の注記 | `apply_stock_change` だけ | `generate_custom_code` は backlog `:49` の範囲外で本 lane では変えない。closeout で backlog 候補にする | AC3 |
| 起動失敗の operator 文言（MNT-03-D5） | `StartupDatabaseError` の 3 variant と `StartupFailureKind` 3 種（`lib.rs:31-78`） | 新 variant `SchemaNewerThanApp`（同じ「固定部 + `\n{details}`」の形） | 既存の文言は不変 | T9、既存 sfv T1〜T5 |
| `migrate` を通る open | `init_database` / `open_existing_database`（起動・復元・test） | 全部（`migrate` の中に置くため） | legacy 移行の `VACUUM INTO`（旧 DB を読むだけで `migrate` を通らない）| T6 / T8 / T10 |
| in-memory の module flag（UI-11b-D11 の形） | `src/lib/restore-success-notification.ts` | `suspendAutoBackupCheck` | — | T14 / T18 |
| 直接 `invalidateQueries` の許可（D-052-S1） | `invalidation-contract.static.test.ts:23-27` | `useAutoBackupCheck.ts` を足す | — | 既存の static test |
| QueryClient なしで `RootLayout` を描く test | 起票時実測の候補 7 file | S4 の後に `npm test` で失敗した file だけ hook を mock | QueryClient を持つ test は mock しない（T16 / T17 が実 hook を通す） | AC7 / AC10 |

## Negative Paths

- missing input: 商品コードが空 → 既存の `商品コードが空です`（上限の判定は空でないときだけ）。`schema_versions` が無い DB → 作成して 0 とみなす（既存）
- invalid input: 101 以上の商品コード（T1 / T2）、版 > app_max（T6 / T8 / T9 / T10）
- duplicate/ambiguous input: CSV 内重複と上限超過が同じ行 → errors に両方（既存の重複判定は変えない）。確認の呼出しが重なる → backend が直列にし 2 回目は `false`（起票時実測、hook は待たない）
- unknown reference: 該当なし
- dependency missing: `commands.checkAutoBackup` が失敗 → T13
- permission/write failure: バックアップ保存先に書けない → backend が Err → T13 の toast
- dry-run side effect: preview は DB を書かない（既存）。新しすぎる DB は `migrate` を始めない（T6 / T8）

## Boundary Checks

- threshold: 商品コード 100 / 101（T1）、版 app_max / app_max + 1（T6 / T7）
- null/default: 商品コードの空（既存）
- empty/non-empty: `schema_versions` が空（既存の新規 DB の経路）
- min/max: `𠀋`×50（100 unit）/ ×51（102 unit）
- status/policy enum: `StartupDatabaseError` の variant（T9）
- wire type: `ImportRow.product_code: String`、`CmdError.kind = Validation`（T2 の `ValidationFailed` が CMD で `Validation` になるのは既存の変換）
- internal type: `DbError::SchemaNewerThanApp { db_version, app_max }`
- producer/consumer: CSV → BIZ、BIZ の登録値 → 在庫照会の `selected`（T1 と T3 の同じ golden）
- round-trip token: 該当なし
- precision/range: `i64` の版
- cross-language parse: UTF-16 code unit の数え方（Rust `encode_utf16().count()` と JS `length`、T1 / T3）

## Compatibility Checks

- old schema/input: 版が app_max 以下の DB は今までどおり migrate / 起動（既存の migration test、T7）
- new schema/input: 版が app_max より大きい DB は拒否（T6〜T10）
- output order: 該当なし
- optional field behavior: 該当なし

## Data Safety Checks

- source-derived data: なし（合成の値だけ）
- generated outputs: `90-traceability.md` の再生成、`bindings.ts` 差分 0（AC9）
- secrets: なし
- local-only files: `.local/ci-evidence/`
- synthetic sample boundaries: tempdir の DB、test の mock

## Main Wiring / Integration Checks

- helper connected to main path: `PRODUCT_CODE_MAX_LEN` の判定を `preview_import` と `commit_import` が呼ぶ（T1 / T2）。`migrate` の比較を `init_database` / `open_existing_database` が通る（T8 / T10）
- output reaches manifest/report: 該当なし
- effective config reaches runtime: `RootLayout` が hook を呼ぶ（T16）、page が suspend を呼ぶ（T18）。起動の setup が新 variant の `operator_message()` を dialog へ渡す（T9 + 既存 sfv T3 の source 検査）
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? T9 は operator 文言の固定部を独立転記して完全一致を見る。T3 は T1 と同じ golden 文字列を独立に書く
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? T12（`true` の回だけ invalidate）、T2 / T6（前後で DB の行・schema が同じ）
- If a key branch is inverted, which test fails? `>` を `<` にすると T6 と既存の全起動 test、`true` / `false` の分岐を逆にすると T12
- If a threshold comparison changes, which test fails? 商品コードの `>` を `>=` → T1 (a)、版の `>` を `>=` → T7
- If a guard is removed, which test fails? 上限の判定 → T1、commit の再検証 → T2、版の比較 → T6 / T8、suspend → T14 / T18、連続失敗の判定 → T13
- If an output field is omitted, which test fails? `SchemaNewerThanApp` の版の detail → T9 (b) / T10
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? not applicable（workflow の変更ではない）
- If output order changes, which test fails? 該当なし
- If dry-run performs a side effect, which test fails? preview が DB を書かないのは既存 test。新しすぎる DB への `migrate` が書かないのは T6 / T8
- If a JSON number crosses JavaScript safe integer range, which test fails? 該当なし（版は wire に出ない）
- If a state token is round-tripped through browser/client code, which test fails? 商品コードの `selected` の受理範囲 → T3

## Residual Test Gaps

- Windows 実機での新しい variant の dialog 表示は自動 test で見ない（dialog の仕組みは MNT-03-D8 の lane で確認済み。packet Design Readiness の「manual の要否」）
- 実時間での 23:00 の到達は fake timer で代える。backend の時刻判定は既存の backup.rs の test が持つ
- zod が UTF-16 code unit で数える前提は T3 の実行で初めて確かめる（Contract Probe の未実測項目）
