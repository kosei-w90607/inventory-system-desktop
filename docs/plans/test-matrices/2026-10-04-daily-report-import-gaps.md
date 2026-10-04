# Test Design Matrix: 日報（Z001 / Z002 / Z005）取込みの穴

Plan Packet: [2026-10-04-daily-report-import-gaps](../2026-10-04-daily-report-import-gaps.md)。S 番号・AC 番号は packet のもの。設計判断 ID は `docs/function-design/29-io-daily-report-parser.md`（IO-07-D2〜D4）、`37-biz-daily-report-import-service.md`（BIZ-08-D2）、`22-mnt-migration.md`（MNT-03-D12）、`docs/decision-log.md` D-104。

## Risk

Risk: R3

## Contracts Under Test

- IO-07-D2: 個数（Z001 の総売の行の第3列、Z005 の第3列）は小数 2 桁までを浮動小数を通さず 100 倍の整数にする。件数は整数のまま。`quantity_hundredths_to_units` が単位の数に戻す。
- IO-07-D3: 精算回数を読めたファイルが 2 本以上で値が違えば `settlement_mismatch`。1 本以下なら比べない。日付の判定は別に残る。
- IO-07-D4: `gross_sales` / `net_sales` / `cash` / `credit` はラベルだけで決め、「レコード」列の値を使わない。
- BIZ-08-D2: `settlement_mismatch` があれば利用者向けの message と `operation_logs.summary` を固定の文にする。他の parse error は汎用の文（BIZ-08-D1）。
- §37.2: preview の部門の `quantity` は単位の数（`f64`）、cache は 100 倍の整数で、commit は cache の整数を保存する。
- MNT-03-D12: migration v7 は 2 表の `quantity` を `quantity_hundredths` に改名し、NULL でない値を 100 倍し、件数と合計を検証して 1 transaction で commit する。
- 24 §14.21 手順 4・§14.22 手順 2 / 34 §19.2: DB DTO は 100 倍の整数で集約し、BIZ-05 が wire の `f64` に戻す。月次の `SUM` は整数のまま。

## Failure Modes

- F1 小数の個数が `invalid_number` のままで、その日の取込みが丸ごと失敗する（今の挙動）。
- F2 浮動小数で parse して 100 倍し、`1.13` が `112` などに丸めずれる（`f64` の `1.13 * 100.0` は `112.99…`）。
- F3 小数部 1 桁を 100 倍でなく 10 倍にする（`1.3` → 13）、または小数部を左詰めしない（`1.05` → 15）。
- F4 件数の列まで小数を受け、件数が 100 倍の値で保存される、または Z001 の総売以外の行が個数として 100 倍される。
- F5 小数 3 桁以上・`.5`・`1.` を黙って受ける（丸め・0 埋め）。
- F6 精算回数を比べず、同日の別の精算の束が通る（今の挙動）。
- F7 精算回数が読めないファイル（layout B の Z002 / Z005）を「違う」と扱い、正規の layout B の束が止まる。
- F8 精算回数を文字列で比べ、`0005` と `5`（Excel で保存し直した形）を違うと判定する。
- F9 データ行や「精算回数」と同じ文字を含むラベルを精算回数として読む（ヘッダより後ろを見る）。
- F10 コードの比較が残る、または先頭 0 を正規化して比べ、Z002 の `0003` の行が `credit`、`0001` の行が `cash` になる。
- F11 `settlement_mismatch` でも汎用の文のまま、または文にファイル名・精算回数などの raw detail が入る。
- F12 cache を wire の `f64` から作り、commit で `round(q * 100)` の往復を通す、または preview の `quantity` が 100 倍のまま wire に出る。
- F13 migration v7 が NULL を 0 にする、負の値を落とす、件数・合計を検証しない、途中の失敗で改名だけが残る。
- F14 v4 の CREATE 文を書き換え、既存 DB と新規 DB で列の履歴が分かれる。
- F15 月次の集計を `f64` で足して誤差が出る、または日次・月次の写像で ÷100 を忘れて 100 倍の値が wire に出る。
- F16 `bindings.ts` の `quantity` の型が `number` 以外になる。
- F17 新しい FE / Rust の test に REQ / spec の ID が無く traceability が崩れる。

## Test Matrix

- 既存 test の引用は 2026-10-04 の baseline の出力（下の「Baseline」）で実在を確かめた。新しい test の名前は案で、Writer が同じ意味で変えてよい（名前を変えたら PR body に対応を書く）。
- fixture は合成の文字列（既存の `preamble` / `z001` / `z002` / `z005` の helper を流用し、精算回数・個数の列を引数にする）。実データを使わない。

| # | Contract | Failure Mode | Test Type | Test Name（案） | Would fail if... |
|---|---|---|---|---|---|
| T1 | IO-07-D2 | F1 / F3 | unit（IO-07） | `test_parse_daily_report_req401_decimal_quantity_hundredths`: Z001 の総売の第3列 `1.3`、Z005 の部門の第3列 `2.25`・`-0.5`・`1,234.5` → `quantity_hundredths` が `130`・`225`・`-50`・`123450`、整数 `4` は `400` | 小数で `invalid_number`、10 倍、小数部の桁合わせ違い |
| T2 | IO-07-D2 | F2 | unit（IO-07） | 同じ test に `1.13`・`0.29`・`9999.99` → `113`・`29`・`999999`（`f64` の積で外れる値） | 浮動小数で parse して切り捨てる |
| T3 | IO-07-D2 | F5 | unit（IO-07） | `test_parse_daily_report_req401_decimal_quantity_rejects_invalid_shapes`: 個数 `1.234`・`.5`・`1.`・`1.2.3` → `invalid_number`（source と line_no 付き） | 3 桁を丸める、`.5` を 0.5 と読む |
| T4 | IO-07-D2 | F4 | unit（IO-07） | `test_parse_daily_report_req401_count_column_stays_integer`: Z001 の純売の行の第3列 `1.5` と Z002 の件数 `1.5` → `invalid_number`。Z001 の純売の整数の件数は `count` に整数のまま（100 倍しない） | 件数も 100 倍、総売以外を個数扱い |
| T5 | IO-07-D2 | F15 | unit（IO-07） | `test_daily_report_req401_quantity_hundredths_to_units`: `130` → `1.3`、`400` → `4.0`、`-50` → `-0.5`、`serde_json::to_string(&1.3_f64)` が `1.3` | 割る数の誤り、`f32` |
| T6 | IO-07-D3 | F6 | unit（IO-07） | `test_parse_daily_report_req401_settlement_mismatch`: 同じ日付で Z001 の精算回数 `0001`、Z002 / Z005 が `0002` → `settlement_mismatch`（`source_file` は None でよい、error_message あり）、`invalid_date` は出ない | 比べない（今の挙動） |
| T7 | IO-07-D3 | F7 | unit（IO-07） | 既存の `test_parse_daily_report_req401_layout_b_concatenated_shape_supported` を変えずに PASS（Z001 だけ精算回数を持つ） | 読めないファイルを不一致と扱う |
| T8 | IO-07-D3 / IO-07-D1 | F8 / F9 | unit（IO-07） | `test_parse_daily_report_req401_settlement_number_read_from_preamble_only`: (a) 引用符なしの `精算回数,5,,` と引用符付きの `"0005"` の束 → 通る。(b) 精算回数の行の無い Z005 + 一致する Z001 / Z002 → 通る。(c) データ行のラベルに `精算回数` を含む行がある束 → 精算回数として読まない（通る） | 文字列比較、ヘッダ後を読む |
| T9 | IO-07-D3 | F6 | unit（IO-07） | 日付も精算回数も違う束 → `invalid_date` と `settlement_mismatch` の両方 | 片方だけで return する |
| T10 | IO-07-D4 | F10 | unit（IO-07） | `test_parse_daily_report_req401_record_column_is_row_position`: Z002 の行 `0001`=`現金`、`0002`=合成ラベル、`0003`=クレジットでない合成ラベル → `cash`・`payment_2`・`payment_3`（`credit` が無い）。Z001 の `0001`=`総売`、`0002`=`純売` → `gross_sales`・`net_sales` | コードの比較が残る・先頭 0 の正規化 |
| T11 | IO-07-D4 | F10 | unit（IO-07） | 同じ test に、コード `101` で総売でないラベルの行 → `summary_N`、コード `03` でクレジットでないラベルの行 → `payment_N`。半角の `ｸﾚｼﾞｯﾄ` を含む合成ラベルの 2 行 → それぞれ `payment_N`（`credit` にならず、鍵が重ならない） | `code == "101"` / `"03"` が残る、半角も `credit` にして 2 行が同じ鍵になる |
| T12 | BIZ-08-D2 / BIZ-08-D1 | F11 | unit（BIZ-08） | `test_daily_report_req401_settlement_mismatch_guides_reselection`: 精算回数の違う束で `BizError::ImportError(message)` が BIZ-08-D2 の文と完全一致、`operation_logs.summary` も同じ、`detail_json` は None、diagnostic に `error_type=settlement_mismatch`、`daily_report_imports` 0 行 | 汎用の文、raw detail を含む |
| T13 | BIZ-08-D2 | F11 | unit（BIZ-08） | 同じ test に、`settlement_mismatch` と `invalid_number` が同時にある束 → BIZ-08-D2 の文（優先）。既存の `test_daily_report_req401_parse_error_logs_parse_failed` は変えずに汎用の文 | 優先順が逆 |
| T14 | §37.2 | F12 | unit（BIZ-08） | `test_daily_report_req401_decimal_quantity_preview_and_commit`: Z005 の個数 `1.3` の束 → preview の `department_summary[*].quantity == Some(1.3)`、cache の `quantity_hundredths == Some(130)`、commit 後の `daily_report_department_lines.quantity_hundredths` が `130`、Z001 の総売の行が 100 倍の値 | preview に 100 倍が出る、commit が f64 から戻す |
| T15 | MNT-03-D12 | F13 | unit（migration） | `test_migration_req401_v7_scales_daily_report_quantity`: v6 まで適用した DB に 2 表の行（`7`・NULL・`-2`）を入れ、v7 を適用 → `quantity_hundredths` が `700`・NULL・`-200`、`count` は不変、`quantity` 列が無い、schema_versions に v7 | NULL を 0、負を落とす、改名だけ |
| T16 | MNT-03-D12 / MNT-03-D1 | F13 | unit（migration） | v7 の検証の失敗（例: 適用前に `schema_versions` 以外で失敗を注入できる既存の helper の型を使う、または検証の関数を単体で呼ぶ）で rollback され、列名が `quantity` のまま、v7 が記録されない | 途中の状態が残る |
| T17 | MNT-03-D12 / F14 | F14 | unit（migration） | 新規 DB の `migrate` 後の `PRAGMA table_info` に `quantity_hundredths` があり `quantity` が無い。既存の v4 の test（`test_migration_req401_v4_creates_daily_report_tables_and_indexes`・`test_migration_req401_v4_daily_report_constraints`）は v4 の時点の検査として PASS（版の数の期待は v7 に追従） | v4 を書き換える、v7 の未登録 |
| T18 | 24 §14.21 手順 4 / §14.22 手順 2 / UI-09b-D10 | F15 | unit（sales_repo） | `test_daily_report_repo_req401_quantity_hundredths_aggregates_as_integer`: 同じ日・同じ部門の 2 取込みの `110`・`20`（1.1 + 0.2）→ 日次の集約が `130`、月次の `SUM` が `130`（整数）。既存の `test_get_completed_daily_report_aggregate_req501_propagates_parent_and_line_nulls` は列名の追従だけで NULL 伝播を保つ | 列名の取り違え、REAL で足す |
| T19 | §19.2 | F15 | unit（sales_service） | `test_get_daily_sales_req501_official_quantity_in_units`: 部門の行 `quantity_hundredths = 130` → `official_daily_report.department_lines[0].quantity == Some(1.3)`、`400` → `Some(4.0)`、NULL → None | ÷100 を忘れる |
| T20 | §19.2 / main wiring | F15 | integration（BIZ-08 → BIZ-05） | `test_get_monthly_sales_req502_official_quantity_in_units`: BIZ-08 で小数の束を commit した後、`get_monthly_sales` の `official_department_totals[*].quantity == Some(1.3)`（同じ月の 2 日分なら合計の単位の数） | 月次の写像の変換漏れ |
| T21 | wire | F16 | CLI | AC7: `cd src-tauri && cargo run --bin generate_bindings` → `git diff --exit-code -- src/lib/bindings.ts` が exit 0 | specta が `f64` を別の型にする |
| T22 | traceability | F17 | CLI | AC7: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0（新しい test の名前に `req401` / `req501` / `req502` を含める） | REQ の無い test |

## Baseline

起票時（main `76de30d8`、2026-10-04、起草役）に逐語で実行した:

```
CARGO_TARGET_DIR=$TMPDIR/laneb-target cargo test --manifest-path src-tauri/Cargo.toml --lib daily_report
test result: ok. 54 passed; 0 failed; 0 ignored; 0 measured; 973 filtered out; finished in 3.87s
```

この中に上で「変えずに PASS」とした既存の test（`test_parse_daily_report_req401_layout_b_concatenated_shape_supported`、`test_parse_daily_report_req401_date_mismatch`、`test_parse_daily_report_req401_happy_path`、`test_daily_report_req401_parse_error_logs_parse_failed`、`test_migration_req401_v4_creates_daily_report_tables_and_indexes`、`test_migration_req401_v4_daily_report_constraints`、`test_get_completed_daily_report_aggregate_req501_propagates_parent_and_line_nulls`）が含まれる。本数は AC にしない。

## State Lifecycle Matrix

| 状態 | 遷移 | 期待 | test |
|---|---|---|---|
| 選択 → preview | 混在の束 | preview に進まず、何も保存しない | T12 |
| 選択 → preview | 小数の束 | preview の数量が単位の数、cache は 100 倍 | T14 |
| preview → commit | 小数の束 | 100 倍の整数で保存 | T14 |
| commit → 日次・月次の取得 | 小数の行 | wire が単位の数 | T19・T20 |
| 既存 DB → 起動（v7） | 行あり | 値が同じに見える（100 倍で保存、÷100 で表示） | T15・T19 |
| v7 の失敗 → 再起動 | 検証の失敗 | rollback、次の起動で再試行 | T16 |
| rollback（論理取消） | 小数の取込み | 既存どおり残りの取込みに収束 | 既存の `test_completed_daily_report_aggregate_after_per_import_rollback_req501`（列名の追従） |

## Adjacent Pattern Audit

- 個数の読み取りの site: `parse_z001`（第3列）、`parse_z005`（第3列）。件数の site: `parse_z001`（総売以外）、`parse_z002`（第3列）。金額の site（`parse_optional_i64` / `parse_required_i64`）は変えない。
- 鍵の site: `summary_line_key`、`payment_key` の 2 つ（`rg -n 'fn (summary_line_key|payment_key)' src-tauri/src/io/daily_report_parser.rs`）。
- `quantity` の SQL の site: `sales_repo.rs` の INSERT 2・日次の aggregate 1・月次の集計 1（packet 起票時実測 #2）と test の直接の INSERT（`sales_repo.rs`・`sales_cmd.rs`・`migration.rs` の test）。
- wire の `quantity` の site: `DailyReportDepartmentLinePreview`、`OfficialDailyDepartmentLine`、`OfficialMonthlyDepartmentTotal`（lane C の `OfficialDailySummaryLine` は lane C）。

## Negative Paths

- T3（不正な小数の形）、T4（件数の小数）、T6・T9（精算回数・日付の不一致）、T11（コードだけが一致する行）、T13（複数の error）、T16（migration の失敗）。

## Boundary Checks

- 小数 2 桁の上限 `9999.99` → `999999`（T2）、負の小数（T1）、カンマ付き（T1）、`0` と `0.0`（T1 に足してよい）。
- 精算回数の先頭 0（T8）、読めたのが 1 本（T7）・0 本（layout B だけの束は既存 test の形で十分）。

## Compatibility Checks

- 既存の parser・BIZ-08・sales・migration の test を変えずに PASS（T7・T13・T17・T18 の既存分、Baseline の一覧）。列名の追従（`quantity` → `quantity_hundredths`）は test の期待値を変えずに field 名と値の 100 倍だけを直す。
- `src/**` の FE の test は変えずに PASS（AC8）。bindings の diff 0（T21）。

## Data Safety Checks

- 新しい fixture は合成の文字列だけ。`tests/fixtures/daily-report/` を変えない。
- AC9 の実データの probe は scratchpad（repo 外）で、出力は束の鍵・成否・error_type・行番号だけ。

## Main Wiring / Integration Checks

- T14（IO-07 → BIZ-08 の preview と commit → DB）と T20（BIZ-08 の commit → BIZ-05 の月次の wire）で、層をまたいだ 100 倍の整数と単位の数の境界を通す。

## Mutation-style Adequacy Questions

- 個数の parse を `value.parse::<f64>()? * 100.0` の切り捨てに変えると T2 が red になるか（`1.13` → 112）。
- 小数部 1 桁の ×10 を ×1 にすると T1 が red になるか。
- `settlement_mismatch` の条件を「3 本とも読めて違う」に狭めると T6 は green のまま、T9 も green のまま。「読めない 1 本を不一致とみなす」に広げると T7 が red になるか。
- 精算回数を `String` で比べると T8 (a) が red になるか。
- `payment_key` に `code == "03"` を戻すと T11 が red になるか。
- BIZ-08-D2 の分岐を消すと T12 が red になるか。
- migration の `WHERE … IS NOT NULL` を外して `COALESCE(…, 0) * 100` にすると T15 が red になるか。
- BIZ-05 の写像の ÷100 を消すと T19・T20 が red になるか（型が `f64` なので compile は通る）。

## Residual Test Gaps

- layout B の実物のメタの精算回数（未確認、D-104 Revisit）。test は合成の layout B（精算回数なし）だけ。
- specta の `f64` の出力は T21 の CLI だけで、unit test は無い。
- 実データの確かめは AC9 の local-only の probe で、CI に入らない。
