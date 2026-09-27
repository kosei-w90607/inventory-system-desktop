# Test Design Matrix: ㉘ runtime ① 旧棚卸しとZ004業務commit・取消の停止と再現fixture

[Plan Packet](../2026-09-23-legacy-stocktake-z004-write-stop.md)

## Risk

Risk: R3

## Contracts Under Test

`D1`〜`D6` は packet の Spec Contract `SPEC-STOP-D1`〜`SPEC-STOP-D6` の略記。

- D1: 5 つの BIZ 入口（`start_stocktake` / `update_count` / `complete_stocktake` / `commit_csv_import` / `rollback_csv_import`）が最初の文で停止し、DB 全 table を変えない。
- D2: 停止 error の wire（kind `validation` / `import_error`、固定文言、field / error_id = null）。型・kind・登録・bindings は不変。
- D3: 旧本体 `legacy_*` は production から呼ばれず、既存振舞いは不変。診断 2 本は旧本体で再現を続ける。
- D4: 棚卸し画面・Z004 タブの案内と入口の無効化。閲覧・プレビュー・日報タブは維持。
- D5: 再現 fixture F1〜F7 と停止検査。後続 lane の期待結果は記録のみ。
- D6: 解除は ⑤ だけ（review で確認）。
- 保護する隣接契約: `42-cmd-sales-stocktake.md` §22.10（CMD test の方式）、`41-cmd-pos.md` §17.5（commit 成功時だけ token 削除）、`73-ui-stocktake.md` §73.9 / `55-ui-csv-import.md` §55.5（kind 別の回復）、D-052（invalidation SSOT）、D-061（`CmdErrorKind` 12 値）、UI-10-D11（HID 連続スキャン）、入庫・手動販売・返品・廃棄・日報取込みの既存振舞い。

## Failure Modes

- FM1: 入口のどれかが停止より前に DB を読み書きする、operation log を書く、TX を開く（例: `rollback_csv_import` の rolled_back 冪等 Ok、`commit_csv_import` の `csv_import_failed` log）。
- FM2: 条件付きで旧処理を通す（force_fill=false だけ許可、同日 import なしだけ許可 等）。
- FM3: `update_count` の入力検査が停止より先に走り、負数で検査文言を返す（停止の位置が「最初の文」でない）。
- FM4: CMD の commit が停止時に preview token を消す、または別 kind に変換する。
- FM5: 旧本体への付け替えで既存 test の assert・入力が変わる（弱体化）。production から旧本体が呼べる。
- FM6: 停止で診断が「fixture/BIZ completion error」で落ち、既知の不具合の再現でなくなる。
- FM7: 画面の非表示だけで止め、command が通る。逆に UI の定数を安全の根拠にして backend を止めない。
- FM8: 閲覧（一覧の絞り込み・ページ送り、前回の棚卸し、プレビュー、日報タブ）まで無効化する。
- FM9: kind 流用が consumer の既存分岐を誤作動させる（`stocktake_in_progress` の自動 refetch、`stocktake_not_in_progress` の固定文言、`import_error` の recoverTo）。
- FM10: bindings / `CmdErrorKind` / command 登録が変わる。
- FM11: fixture が後続 lane の未確定の期待結果（判定不能の扱い）を実行 oracle として固定する。

## Test Matrix

引用した既存 test は起票時 main `3148347b` で `rg` により実在を確認した（`diagnostic_cross_feature_req205_count_then_movement` :582、`diagnostic_cross_feature_req205_req401_late_import` :609、`test_parse_and_validate_req401_empty_records_excluded` :115、`test_parse_and_validate_req401_multiple_jan_hits` :203、`test_parse_and_validate_req401_no_valid_data` :257、`test_update_count_req205_negative_validation` / `test_update_count_req205_zero_is_valid`（`stocktake_cmd.rs`）、`test_csv_cmd_req401_snapshot_mismatch_deletes_preview_token`（`csv_import_cmd.rs:396`））。新規 test 名は Writer が repo の命名（`test_<対象>_req205_*` / `test_<対象>_req401_*`）に合わせて決め、PR body に列挙する。

DB 全 table の比較（以下「全 table 不変」）は、`sqlite_master` の `type='table'` かつ `name NOT LIKE 'sqlite_%'` の各 table を全列 `ORDER BY rowid` で読んだ値の、呼出し前後の完全一致とする。既存の `World::business_snapshot`（`cross_feature_tests.rs:345`）は `stocktakes` / `stocktake_items` / `operation_logs` を含まないため、この用途にはそのまま使わない。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1 | FM1 / FM2 | integration（実 SQLite、BIZ 直呼び） | T1: F1〜F7 の各状態で、まず Fixture 表の前提 assert を満たすことを確かめ、次に 5 入口を呼び、停止 error と全 table 不変 | どれかの入口が停止前に書く、log を書く、条件付きで旧処理を通す。fixture が意図した状態を作れず、停止がなくても差分が出ない（空の oracle） |
| D1 | FM1 | integration | T2: F3 の rolled_back 済み import に `rollback_csv_import` → 停止 error（Ok でない）、全 table 不変 | 冪等 Ok 経路が停止より前に残る |
| D1 | FM1 | integration | T3: F5 の cached preview で `commit_csv_import` → 停止 error、`operation_logs` を含む全 table 不変 | `csv_import_failed` log が書かれる |
| D1 | FM3 | integration | T4: `update_count` に負数・0・正数・存在しない明細 ID → すべて BIZ-06 停止文言 | 検査・存在確認が停止より先に走る |
| D2 | FM4 / FM9 | CMD（`tauri::test::mock_builder`、production command 関数） | T5: `stocktake_cmd::start_stocktake` / `update_count`（負数・0）/ `complete_stocktake` → kind `validation`、message = 停止文言、field / error_id = null、全 table 不変（既存 2 test を改め、1 test 追加） | 別 kind・別文言・field 付き、または DB が変わる |
| D2 | FM4 | CMD | T6: 有効 token を cache に置き `csv_import_cmd::commit_csv_import` → kind `import_error`、停止文言、token が cache に残る、全 table 不変（`test_csv_cmd_req401_snapshot_mismatch_deletes_preview_token` を改める） | 停止時に token を消す、別 kind |
| D2 | FM4 | CMD | T7: `csv_import_cmd::rollback_csv_import` → kind `import_error`、停止文言、全 table 不変（追加） | 同上 |
| D2 | FM10 | CLI | T8: `cargo run --bin generate_bindings` 後 `git diff --exit-code -- src/lib/bindings.ts` が exit 0。`git diff origin/main --stat -- src-tauri/src/lib.rs src-tauri/src/biz/mod.rs src-tauri/src/cmd/mod.rs src/lib/invoke.ts` が空 | kind・型・登録が変わる |
| D3 | FM5 | regression（既存 BIZ test の付け替え） | T9: `stocktake_service.rs` の test module、`commit_tests.rs`、`rollback_tests.rs`、`cross_feature_tests.rs` の通常 test が呼出し先だけ変えて PASS | 付け替えで assert・入力が変わる、旧本体の振舞いが変わる |
| D3 | FM5 | CLI | T10: `rg -n 'legacy_(start_stocktake\|update_count\|complete_stocktake\|commit_csv_import\|rollback_csv_import)\(' src-tauri/src` のすべての一致が、旧本体の定義行か、`tests/` 配下の file か、`#[cfg(test)]` の module 内の行である（packet AC3 と同じ分類。Writer は一致行の分類を PR body に列挙）。`cargo clippy --all-targets --all-features -- -D warnings` 成功 | production から旧本体を呼ぶ、dead_code で clippy が落ちる |
| D3 | FM6 | diagnostic（`--ignored`） | T11: `cargo test --offline --lib cross_feature_tests -- --ignored --nocapture` で 2 本が FAIL し、出力に `XFA_TEMPORAL_FAIL` / `XFA_LATE_IMPORT_FAIL` が出る。`#[ignore` は 2 行のまま | 診断が停止 error で `expect` の panic になり、時点問題の再現でなくなる |
| D4 | FM7 / FM8 | component（React Testing Library、commands は mock） | T12: 棚卸し、進行中なし・停止中（既定）: 案内の見出し・本文（73 の正本と完全一致）と icon、「棚卸しを開始する」disabled、click しても `startStocktake` 未呼出し、前回の棚卸しの要約が表示 | 案内がない、開始できる、前回の要約まで消す |
| D4 | FM7 / FM8 | component | T13: 棚卸し、進行中あり・停止中: カウント入力 fieldset が disabled、「棚卸しを確定する」disabled（confirm dialog が開かない）、`updateCount` / `completeStocktake` 未呼出し。部門絞り込み・未入力のみ・ページ送りは有効で search 更新が起きる | 書く入口が残る、または閲覧まで止める |
| D4 | FM5 | regression（既存 UI test） | T14: `StocktakePage.test.tsx` / `StocktakePage.suggest.test.tsx` の既存 test を停止 off の render で assert 不変のまま PASS（IME Enter、HID 連続スキャン、kind 別回復を含む） | 停止の追加で既存 flow が壊れる |
| D4 | FM7 / FM8 | component | T15: Z004 タブ（`CsvImportPage`）に案内（55 の正本と完全一致）。`PreviewStep` 停止中（既定）: プレビュー表示、「取り込む」disabled、click しても `PreviewStep` の `onConfirm` mock が未呼出し。`CsvImportPage.test.tsx` の停止 test は test ごとの mock で preview 状態と安定した `confirmImport` 参照を返して render し、click しても `confirmImport` が未呼出し（既存 test の assert は不変）。`commitCsvImport` の未呼出しは assert しない（`CsvImportPage` の test は `useCsvImportFlow` を mock するため到達経路が無い）。「ファイルを選び直す」有効。disabled を外す mutation の実注入で red | 取り込める、プレビューまで止める |
| D4 | FM5 | regression | T16: `PreviewStep.test.tsx` の既存 test を停止 off で PASS。`CsvImportPage.test.tsx` の既存 test、`src/features/daily-report-import/**` の test が不変で PASS | 日報タブ・既存 Z004 flow が壊れる |
| D5 | FM11 | integration | T1 と同じ（F1〜F7 の builder は T1 だけが assert に使う。後続 lane の期待結果は下の Fixture 表に記録し、① では実行しない） | fixture が未確定の期待結果を assert する |

### Fixture（D5）

すべて合成データ。既存 helper（`create_test_product_with_jan` / `make_z004_bytes` / `parse_and_build_cache` / `build_cached`、`test_support.rs`）と旧本体で状態を作る。「後続 lane の期待結果」は oracle の候補であり、① では assert しない。「ADR 修正 lane 依存」は、並走する ㉗ ADR 修正 lane（owner 決定 2026-09-23: 判定不能は所属によらず「適用 + 商品×資料の要再確認を DB に残す」、共有 JAN 行は保留を維持、OS 監視と legacy 専用復旧を外す）の merge 後の版に従い、本 lane では固定しない。

| ID | 状態の作り方 | 現行（旧本体）の結果と再現場所 | 前提 assert（停止した入口を呼ぶ前） | ① の assert | 後続 lane の期待結果 |
|---|---|---|---|---|---|
| F1 STK-1 | 連動商品 1 件だけの DB（明細が 1 行になり、旧 complete を force_fill=false で呼べる）。在庫 10 → 旧 start → 旧 count 10 → 手動販売 2（在庫 8）。確定の直前 | 旧 complete で在庫 10 に戻る（`diagnostic_cross_feature_req205_count_then_movement`、`XFA_TEMPORAL_FAIL`） | 在庫 8、明細 actual_count 10（counted_at あり）、棚卸し in_progress、手動販売の movement（-2）がある | T1: 5 入口停止、在庫 8 のまま、全 table 不変 | ③: 確定後も 8（保存時の L を固定し確定で現在庫へ N − L を加える。㉗ 申し送り）。ADR 修正 lane 非依存 |
| F2 STK-2 | 在庫 10、未取込みの POS 販売 2（現物 8）→ 旧 start → 旧 count 8 → 旧 complete（在庫 8）→ 販売 2 の Z004 を parse・cache | 旧 commit で在庫 6（`diagnostic_cross_feature_req205_req401_late_import`、`XFA_LATE_IMPORT_FAIL`） | 在庫 8、棚卸し completed、cache の matched_rows が連動商品の 1 行で数量 2、`sale_records` 0 件 | T1: commit 停止、在庫 8、売上未記録、全 table 不変 | ④: 売上 2 を一度だけ記録。資料の受領が実測より後の本 fixture は判定不能に当たり、在庫の扱いは ADR 修正 lane 依存（受領が実測より前なら受領順の Before で 8 のまま = ADR D4、非依存） |
| F3 旧形式 | 旧 start で 4 形の明細: 通常商品 在庫 5（actual NULL / counted_at NULL）、廃番 在庫 0（0 / NULL）、旧 count 7（7 / 時刻）、異常形（SQL で actual NULL・counted_at 時刻）。別に旧 complete 済みの棚卸し 1 件、旧 commit 済み Z004 import 1 件（識別メタなし）と旧 rollback 済み import 1 件 | ② 以前の DB 形（ADR D8 の移行表の入力） | 進行中棚卸しの明細が 4 形（NULL / NULL、0 / NULL、7 / 時刻、NULL / 時刻）で各 1 行、completed の棚卸し 1 件、`csv_imports` に status completed 1 件と rolled_back 1 件 | T1 / T2: 5 入口停止（rolled_back 済みにも）、全 table 不変 | ② / ⑤: ADR D8 移行表で uncounted / auto_filled / legacy / legacy（異常表示）。識別メタなし import の日付を preflight に出す。ADR 修正 lane 依存（legacy 専用復旧を外すため、移行後の復旧経路は修正後の版） |
| F4 ゼロ行 | 連動商品 A の行 0 / 0 と商品 B の行 1 / 100 を持つ Z004 を parse・cache。全行 0 の file は既存 `test_parse_and_validate_req401_no_valid_data` の入力を参照し、新しい builder を作らない | 0 / 0 行が照合前に捨てられる（`parse.rs:94`、`test_parse_and_validate_req401_empty_records_excluded`）。全行 0 は「取込み対象のデータがありません」 | cache の matched_rows が商品 B の 1 行だけで、A の 0 / 0 行が無い（現行の除外） | T1: commit 停止、全 table 不変 | ②: 在庫判定の対象になる全行（0 / 0 を含む）と売上記録の行を分ける（ADR D4 ゼロ行）。ADR 修正 lane 非依存 |
| F5 共有 JAN | 連動商品 P1 / P2 に同じ JAN、その JAN の行 1 / 100 の Z004 を parse・cache | 先頭の商品へ全量 + warning（`parse.rs:121`、`test_parse_and_validate_req401_multiple_jan_hits`） | 同じ JAN の products が 2 行、cache の warnings に「複数商品」を含む 1 件、matched_rows の product_code が先頭の商品 | T1 / T3: commit 停止、log を含む全 table 不変 | ④: 共有 JAN 行は保留（owner 2026-09-23 維持、ADR D4 共有 JAN）。先頭配賦しない |
| F6 逆順 | 連動商品 P を旧 count 済み（進行中）。精算日 D+1 の Z004 と D の Z004 を parse・cache（取込み順 D+1 → D） | 旧 commit は日付順を検査せず両方減算 | cache 2 件の settlement_date が D+1 と D、商品 P の明細 actual あり・棚卸し in_progress | T1: 両方の commit 停止、全 table 不変 | ④: 受領順と精算メタで判定。時刻で After と言えない場合の扱いは ADR 修正 lane 依存 |
| F7 欠落 | 精算日 D と D+2 の Z004 を parse・cache（D+1 は無い） | 旧実装は欠落を検出しない | cache 2 件の settlement_date が D と D+2、D+1 の `csv_imports` が無い | T1: commit 停止、全 table 不変 | ㉘ は未提出・欠番全般を検出しない（ADR D3 / D9、拒否された資料の settlement_missing だけ）。欠落の検出は EJ と次の design lane に依る |

引継ぎ資料の fixture 候補のうち、時計異常と EJ 欠落は置かない。時計異常は時刻による前後判定の経路で、ADR の適用範囲の但し書きにより ㉘ の実装対象外（ADR 修正 lane と次の design lane の範囲）。EJ 欠落は EJ parser lane の成果が入ってから、その入力形で作る。

### 既存テストの移行先

| 既存 test | ① での扱い | 理由 / 移行先 |
|---|---|---|
| `stocktake_service.rs` test module の start / update / complete 呼出し | 旧本体へ付け替え、assert 不変 | D3。③ が新処理へ移すときの対照 |
| `commit_tests.rs` / `rollback_tests.rs` | 同上 | D3。④ の対照。mismatch 時の BIZ 拒否（`commit_tests.rs:383` 等）もここで維持 |
| `cross_feature_tests.rs` の通常 test と診断 2 本 | 同上（`#[ignore]` 不変） | D3。⑤ で Matrix 指定の正規回帰へ移す（① の拒否で解消扱いにしない） |
| `test_update_count_req205_negative_validation` / `test_update_count_req205_zero_is_valid` | 期待値を停止へ改める | command の契約が停止に変わるため（42 §22.10 の方式は維持）。負数の検査は旧本体の BIZ test（`stocktake_service.rs:267` の文言）で維持。⑤ で新 save command の検査 test へ |
| `test_csv_cmd_req401_snapshot_mismatch_deletes_preview_token`（前半 :396-437） | 停止時に token を残す test へ改める | 停止で mismatch 分岐へ到達しない。CMD の mismatch 時 token 削除（SPEC-SDI-D4）は ⑤ で新 commit 経路に接続するときに再び test する |
| 同 test の後半 `csv_import_cmd.rs:438-459`（AdditionalImportConfirmationRequired の token で `commit_csv_import(..., true)` → Completed、成功時だけ token 削除） | 改めた test から外れる | 41 §17.5 成功時のみ token 削除 / CMD の AdditionalImportConfirmationRequired → commit 成功。停止中は到達不能、⑤ で新 commit 経路へ再接続して再び test する。BIZ 側の追加確認の一致検査は `commit_tests.rs`（旧本体）で維持 |
| `StocktakePage.test.tsx` / `StocktakePage.suggest.test.tsx` / `PreviewStep.test.tsx` | render に停止 off を渡し assert 不変 | D4。③ / ⑤ の新 UI が引き継ぐ IME / HID / kind 別回復の回帰を保つ |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 棚卸し画面（進行中なし） | 案内 + 開始 disabled | 該当なし（開始を送らない） | 該当なし | 既存 query の invalidation は不変 | 前回の要約を再取得して表示 | 同じ表示 | 同じ表示（build 固定） | 状態取得の失敗は既存の Alert + 再試行 | 既存 | T12、M1 |
| 棚卸し画面（進行中あり） | 案内 + 入力・確定 disabled、一覧は有効 | 該当なし | 該当なし | 不変 | 一覧の絞り込み・ページ送りで再取得 | 同じ | 同じ | 一覧取得の失敗は既存の Alert | 既存 | T13。M1b で目視（表示された場合）、表示されなければ T13 だけ |
| Z004 タブ | 案内 + ファイル選択 | parse 中は既存の spinner | プレビュー表示、「取り込む」disabled | 該当なし | 該当なし | 選び直しで再 parse | 同じ | parse 失敗は既存の `ErrorState` | 選び直し | T15、M2 |
| preview cache（CMD） | 空 | parse で token 登録 | 停止中は commit が成功しないため削除されない | TTL 30 分で既存どおり失効 | 該当なし | 同じ token で再 commit しても停止 | app 再起動で cache 消失（既存） | 停止 error で token は残る | 停止のまま | T6 |
| DB（開発 DB の旧進行中棚卸し・取込み記録） | 既存行 | 該当なし | 書換えなし | 該当なし | 該当なし | 閲覧のみ | 同じ | 停止 error、全 table 不変 | 同じ | T1〜T7 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 在庫・売上・棚卸しを書く BIZ 入口 | `stocktake_service.rs`（:260 / :312 / :400）、`csv_import_service/{commit,rollback}.rs`、`inventory_service/**`、`daily_report_import_service/**`、`integrity_service.rs`、`product_service.rs` | 5 入口 | 入庫・手動販売・返品・廃棄・日報・`fix_integrity`・商品一括 import: STK-1 / STK-2 を起こさない（棚卸し確定または Z004 commit が要る）。ただし商品の新規登録（`product_service.rs:261-268`）と商品一括 import（`:1346-1352`）は進行中の旧棚卸しへ未計数の明細を追加し続け、⑤ の移行対象の明細が増える（停止対象外、packet 操作列に記載）。日報は在庫を変えない（`rg -n 'update_stock_quantity\|apply_stock_change\|insert_movement' src-tauri/src/biz/daily_report_import_service` が一致なし） | T1、既存 test |
| 停止した入口の呼出し元 | `src-tauri/src/cmd/*`、`lib.rs`、`bin/*`、`seed_demo.rs`、`src-tauri/tests/*`、frontend の `commands.*` | CMD 5 本（本体不変） | `seed_demo.rs`: SQL 直書き。`src-tauri/tests/*`: 呼出しなし | T5〜T7、T10 |
| 書く操作の UI 入口 | `StocktakePage.tsx`（:170 開始、`StocktakeCountEntry` の保存、:304 確定）、`useCsvImportFlow.ts`（:100 commit、:121 rollback）、`PreviewStep.tsx`（:128）、`ResultStep.tsx`（取消） | 開始・カウント入力・確定・「取り込む」 | `ResultStep` の取消: commit 停止で結果 step に到達しないため変更しない（backend も停止）。ホームの未取込み警告: packet Non-scope | T12〜T15 |
| kind 別の UI 分岐 | `StocktakePage.tsx:106 / :176`、`useCsvImportFlow.ts:25`、`ErrorState.tsx:34`、`useDailyReportImportFlow.ts:36`、`useProductImportFlow.ts:30` | なし（kind を足さない） | 停止は既存 kind を使い、`stocktake_*` の分岐に入らない。`import_error` は recoverTo = idle（既存の意味で妥当） | T5 / T6、FM9 |

## Negative Paths

- missing input: `update_count` の存在しない明細 ID、`complete_stocktake` の存在しない棚卸し ID → 停止文言（T4 / T1）。
- invalid input: 負数の actual_count → 停止文言（T4 / T5）。不正な UUID の preview token → CMD の既存 validation error（BIZ へ到達しない、DB 不変。既存振舞い）。
- duplicate/ambiguous input: 同じ token で commit を繰り返す → 毎回停止、token は残る（T6）。共有 JAN（F5）→ 停止。
- unknown reference: 存在しない import ID の rollback → 停止文言（T1）。
- dependency missing: 該当なし。
- permission/write failure: 停止は DB へ書かない。
- dry-run side effect: 該当なし（preview の副作用は既存どおり、cache 登録のみ）。

## Boundary Checks

- threshold: 該当なし。
- null/default: 停止 error の field / error_id は null（T5〜T7）。
- empty/non-empty: 進行中棚卸しの有無で棚卸し画面の分岐（T12 / T13）。
- min/max: actual_count の 0 と負数（T4 / T5）。
- status/policy enum: `CmdErrorKind` は 12 値のまま（T8）。
- wire type: `CmdError` の形は不変（T8）。
- internal type: 既存 `BizError` variant（T1 / T5）。
- producer/consumer: BIZ → CMD 既存変換 → UI 既存表示（T5〜T7、T12〜T15）。
- round-trip token: preview token は停止中も有効なまま残る（T6）。
- precision/range: 該当なし。
- cross-language parse: 該当なし。

## Compatibility Checks

- old schema/input: 開発 DB の既存行（旧進行中棚卸し、識別メタなし import、rolled_back import）を書き換えない（F3、T1 / T2）。
- new schema/input: 該当なし（schema 不変）。
- output order: 該当なし。
- optional field behavior: 該当なし。

## Data Safety Checks

- source-derived data: 使わない。fixture はすべて合成。
- generated outputs: `docs/function-design/90-traceability.md` は generator の出力だけ。
- secrets: 該当なし。
- local-only files: M2 の合成 Z004 は local に置き commit しない。
- synthetic sample boundaries: 合成 JAN（既存 test と同系）と合成商品名。

## Main Wiring / Integration Checks

- helper connected to main path: production command 関数を managed `AppState` で直接呼ぶ（T5〜T7）。route `/stocktake` は prop を渡さないため既定（停止中）が本番経路（T12 の既定 render と同じ）。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 停止は build の定数で、設定を経由しない。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- 5 入口のどれかから停止の 1 文を消したら: T1 がその入口の fixture で DB 差分または `Ok` を検出して red。T5〜T7 も同じ入口で red。証跡として、`complete_stocktake` の停止文を除いた隔離 copy で F1 の確定後の在庫が 10（STK-1 の値）、`commit_csv_import` の停止文を除いた隔離 copy で F2 の commit 後の在庫が 6（STK-2 の値）になることを観測し、PR body に command と出力を記録する（fixture が既知の不具合を実際に通す状態であることの確認）。
- 停止の 1 文を `update_count` の入力検査の後へ移したら: T4 / T5 の負数ケースが検査文言を受けて red。
- `rollback_csv_import` の停止を rolled_back の冪等判定の後へ移したら: T2 が `Ok` を受けて red。
- `commit_csv_import` の停止を `execute_commit` の失敗 log の後へ移したら: T3 が `operation_logs` の差分で red（停止より前に log を書く経路が無いと実注入で確かめる。観測できなければ Coordinator へ返す）。
- 停止文言を変えたら: T1 / T5〜T7 の完全一致が red（期待値は source design からの転記で production 定数を import しない）。
- 棚卸し画面で開始ボタンの disabled を外したら: T12 が red。カウント fieldset の disabled を外したら T13 が red。
- 閲覧の部門絞り込みを誤って disabled にしたら: T13 が red。
- 「取り込む」の disabled を外したら: T15 が red。
- 停止を UI だけにして BIZ から外したら: T1 / T5〜T7 が red。
- If a mock value is changed so it differs from the design-doc expected value: 停止文言の期待値は 35 / 32 / 73 / 55 の正本から転記し、mock は別の値を返さない（UI test の commands mock は呼ばれないことだけを見る）。
- If invalidate/refetch changes the value before versus after the operation: 停止中は mutation が起きず invalidation も走らない。既存の invalidation test（D-052）は不変。
- If output order changes / dry-run side effect / JSON safe integer / state token round-trip: 該当なし。
- Tracked Workflow State と PR HEAD: github mode のため Workflow State に現在の PR HEAD を書かない。

## Residual Test Gaps

- Windows native 上の見え方（案内の読みやすさ、disabled の見分け）は M1 / M2 の目視に依る。
- 旧方式の進行中棚卸しがある画面は、既存 data でその状態が表示された場合は M1b で目視し、表示されなければ T13 の component test だけで固定する（合成行の挿入はしない）。
- CMD `commit_csv_import` の mismatch 時 token 削除は停止中は到達不能で、⑤ まで test がない。
- CMD `commit_csv_import` の成功時だけの token 削除と、AdditionalImportConfirmationRequired の token での commit 成功（`csv_import_cmd.rs:438-459` が固定していた 41 §17.5）も停止中は到達不能で、⑤ で新 commit 経路へ再接続するまで CMD 層の test がない。
- 後続 lane の期待結果（Fixture 表の右列）は ① では実行しない。判定不能に関わる行は ADR 修正 lane の merge 後に確定する。
- ホームの Z004 未取込み警告は、過去の Z004 取込みを持つ開発 DB で出続ける（packet Non-scope）。
