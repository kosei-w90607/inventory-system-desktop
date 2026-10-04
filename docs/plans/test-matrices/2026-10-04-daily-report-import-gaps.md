# Test Design Matrix: 日報（Z001 / Z002 / Z005）取込みの穴

Plan Packet: [2026-10-04-daily-report-import-gaps](../2026-10-04-daily-report-import-gaps.md)。S 番号・AC 番号は packet のもの。設計判断 ID は `docs/function-design/29-io-daily-report-parser.md`（IO-07-D2〜D4）、`37-biz-daily-report-import-service.md`（BIZ-08-D2）、`22-mnt-migration.md`（MNT-03-D12）、`docs/decision-log.md` D-104。

## Risk

Risk: R3

## Contracts Under Test

- IO-07-D2: 個数（Z001 の総売の行の第3列、Z005 の第3列）は小数 2 桁までを浮動小数を通さず 100 倍の整数にする。件数は整数のまま。`quantity_hundredths_to_units` が単位の数に戻す。
- IO-07-D3: 精算回数を読めたファイルが 2 本以上で値が違えば `settlement_mismatch`。1 本以下なら比べない。日付の判定は別に残る。読めないファイルの出所は確かめない（TD-110・TD-111 の受容リスク）。
- IO-07-D4: `gross_sales` / `net_sales` / `cash` / `credit` はラベルだけで決め、「レコード」列の値を使わない。
- BIZ-08-D2: `settlement_mismatch` があれば利用者向けの message と `operation_logs.summary` を固定の文にする。他の parse error は汎用の文（BIZ-08-D1）。
- §37.2: preview の部門の `quantity` は単位の数（`f64`）、cache は 100 倍の整数で、commit は cache の整数を保存する。
- MNT-03-D12: migration v7 は変換の前に範囲検査（NULL でない値が `i64::MAX / 100` の範囲外なら何も変えず版も記録せず、message に `範囲検査` と表名を含む `MigrationFailed`）をし、2 表の `quantity` を `quantity_hundredths` に改名し、NULL でない値を 100 倍し、(a) 件数 (b) `typeof = integer` (c) `COALESCE(SUM(quantity_hundredths / 100), 0)` が変換前の合計（`COALESCE(SUM(quantity), 0)`）と同じで `NOT EXISTS (SELECT 1 FROM <表> WHERE quantity_hundredths % 100 <> 0)`（余りを `SUM` で足さない。符号の違う余りが打ち消し合う）を検証して 1 transaction で commit する（22 §15）。行が 0 の表・全行が NULL の表でも成功する。
- 24 §14.21 手順 4・§14.22 手順 2 / 34 §19.2: DB DTO は 100 倍の整数で集約し、BIZ-05 が wire の `f64` に戻す。月次の `SUM` は整数のまま。
- 24 §14.21 手順 7 / §14.22 手順 2: 日次の集約の加算（`sum_optional_strict`）は溢れを検査し、溢れたら panic も wrap もせず `DbError::QueryFailed`。月次の `SUM` の溢れも SQLite の `integer overflow` で `DbError::QueryFailed`。

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
- F13 migration v7 が NULL を 0 にする、負の値を落とす、件数・合計を検証しない、途中の失敗で改名だけが残る、検証の呼出しが v7 の本体から外れる。
- F18 100 倍で `i64` を溢れる値が REAL になって黙って通る（範囲検査が無い、`abs()` で `i64::MIN` が溢れる）、または検証を合計の 100 倍で比べて範囲内の最大の 2 行で `SUM` が溢れ、正しい DB の v7 が失敗する。
- F19 v7 の合計の検証が `COALESCE` を持たず、行が 0 の表（新規 DB、日報を取り込んでいない DB）や全行が NULL の表で `SUM` が NULL になり、正しい DB の v7 が `MigrationFailed` で起動できない。
- F20 日次の集約の加算が検査なしの `sum + value` のままで、範囲内（`i64::MAX / 100`）の 2 行の和が debug で panic、release で wrap して負の値の個数を黙って返す（v7 の行の範囲検査は集約の溢れを防がない）。
- F21 v7 の検証 (c) の余りを `SUM` で足し、符号の違う余り（`101` と `-201`）が打ち消し合って 100 で割り切れない値が通る。
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
| T7 | IO-07-D3 | F7 | unit（IO-07） | 既存の `test_parse_daily_report_req401_layout_b_concatenated_shape_supported` が assert の意味を変えずに PASS（個数は field 名と値の 100 倍だけ直す。Z001 だけ精算回数を持つ） | 読めないファイルを不一致と扱う |
| T8 | IO-07-D3 / IO-07-D1 | F6 / F8 / F9 | unit（IO-07） | `test_parse_daily_report_req401_settlement_number_read_from_preamble_only`: (a) 引用符なしの `精算回数,5,,` と引用符付きの `"0005"` の束 → 通る。(b) 精算回数の行の無い Z005 + 一致する Z001 / Z002 → 通る。(c) Z002 のプリアンブルから精算回数の行を外し（他のメタ行は残す）、ヘッダの後に第1列 = `精算回数`・第2列 = 他の 2 本（`0001`）と異なる数字（例 `0009`）・第3列と第4列は整数の合成のデータ行を置く。Z001 / Z005 は `0001` → `settlement_mismatch` が出ない（IO-07-D3 はヘッダより前の行だけを見るので Z002 は読めない 1 本、読めた 2 本は一致）、その行は Z002 の支払の行（`payment_N`）として残る。(d) 精算回数の行の無い Z005 + Z001 = `0001`・Z002 = `0002`（読める 2 本が不一致、残り 1 本は読めない）→ `settlement_mismatch` | 文字列比較、ヘッダの後も走査して第1列の `精算回数` を読む（(c) が `settlement_mismatch`）、3 本とも読めたときだけ比べる |
| T9 | IO-07-D3 | F6 | unit（IO-07） | 日付も精算回数も違う束 → `invalid_date` と `settlement_mismatch` の両方 | 片方だけで return する |
| T10 | IO-07-D4 | F10 | unit（IO-07） | `test_parse_daily_report_req401_record_column_is_row_position`: Z002 の行 `0001`=`現金`、`0002`=合成ラベル、`0003`=クレジットでない合成ラベル → `cash`・`payment_2`・`payment_3`（`credit` が無い）。Z001 の `0001`=`総売`、`0002`=`純売` → `gross_sales`・`net_sales` | 先頭の 0 を正規化して比べる（`0003` → `03`、`0001` → `01`）。コードの比較がそのまま残る件は今の code でも `"0001" != "01"` で T10 が green なので、T11 が拾う |
| T11 | IO-07-D4 | F10 | unit（IO-07） | 同じ test に、コード `101` で総売でないラベルの行 → `summary_N`、コード `03` でクレジットでないラベルの行 → `payment_N`。半角の `ｸﾚｼﾞｯﾄ` を含む合成ラベルの 2 行 → それぞれ `payment_N`（`credit` にならず、鍵が重ならない） | `code == "101"` / `"03"` が残る、半角も `credit` にして 2 行が同じ鍵になる |
| T12 | BIZ-08-D2 / BIZ-08-D1 | F11 | unit（BIZ-08） | `test_daily_report_req401_settlement_mismatch_guides_reselection`: 精算回数の違う束で `BizError::ImportError(message)` が BIZ-08-D2 の文と完全一致、`operation_logs.summary` も同じ、`detail_json` は None、diagnostic に `error_type=settlement_mismatch`、`daily_report_imports` 0 行 | 汎用の文、raw detail を含む |
| T13 | BIZ-08-D2 | F11 | unit（BIZ-08） | 同じ test に、`settlement_mismatch` と `invalid_number` が同時にある束 → BIZ-08-D2 の文（優先）。既存の `test_daily_report_req401_parse_error_logs_parse_failed` は変えずに汎用の文 | 優先順が逆 |
| T14 | §37.2 | F12 | unit（BIZ-08） | `test_daily_report_req401_decimal_quantity_preview_and_commit`: Z005 の個数 `1.3` の束 → preview の `department_summary[*].quantity == Some(1.3)`、cache の `quantity_hundredths == Some(130)`。commit の前に `parsed.cached_preview.preview_data.department_summary[i].quantity` を別の値（例 `Some(9.99)`）へ書き換えてから `commit_daily_report_import` を呼び、`daily_report_department_lines.quantity_hundredths` が cache の `130` のまま（`999` でない）、Z001 の総売の行が 100 倍の値 | preview に 100 倍が出る、commit が wire の f64 から戻す（`round(preview.quantity * 100)` 等。書き換えた値が保存される） |
| T15 | MNT-03-D12 | F13 | unit（migration） | `test_migration_req401_v7_scales_daily_report_quantity`: v6 まで適用した DB に 2 表の行（`7`・NULL・`-2`）を入れ、v7 を適用 → `quantity_hundredths` が `700`・NULL・`-200`、`count` は不変、`quantity` 列が無い、schema_versions に v7 | NULL を 0、負を落とす、改名だけ |
| T15b | MNT-03-D12 | F18 | unit（migration） | `test_migration_req401_v7_quantity_range_boundary`: v6 まで適用した合成 DB で (1) 2 表それぞれに `i64::MAX / 100` の行を 2 行（と `-(i64::MAX / 100)` の行）→ v7 が成功し、値が 100 倍の整数（`typeof = integer`）、v7 が記録される。(2) どちらかの表に `i64::MAX / 100 + 1`（または `-(i64::MAX / 100) - 1`）の行を 1 行 → `MigrationFailed` で、その message が `範囲検査` と該当の表名を含む（手順 6 の検証の失敗の message でない）、2 表とも列名が `quantity`・値が不変、v7 が記録されない。同じ assert を、どちらかの表に `i64::MIN` の行を 1 行置いた DB でも行う（panic せず `MigrationFailed`、message に `範囲検査` と表名、2 表とも列名・値が不変、v7 が記録されない） | 範囲検査が無い（手順 6 (b) の rollback で値は戻るが、message が範囲検査のものにならない）、合計の 100 倍で比べて (1) が溢れで失敗する、`q.abs() > L` で比べる（`±L`・`±(L+1)` では同じ判定になるが、`i64::MIN` で debug は panic、release は `abs()` が `i64::MIN` のままで範囲内と判定される） |
| T16 | MNT-03-D12 / MNT-03-D1 | F13 / F21 | unit（migration） | `test_migration_req401_v7_verification_failure_rolls_back`: v6 まで適用した合成 DB の `daily_report_department_lines` に、**改名前の列名 `quantity` で書いた** `AFTER UPDATE` trigger（`UPDATE … SET quantity = quantity + 1 WHERE id = NEW.id`）を置く（`RENAME COLUMN` が trigger の本文を `quantity_hundredths` に書き換え、`recursive_triggers` は既定 OFF なので 1 回だけ +1 される）。2 表に行を入れて実際の `migrate`（v7 経由）を呼ぶ → 手順 6 の検証の不一致で `MigrationFailed`、2 表とも列名が `quantity`・値が不変、v7 が記録されない。trigger を外して `migrate` を再び呼ぶと成功し、値が 100 倍。(2) 同じ形で trigger の本文を `SET quantity = quantity + CASE WHEN NEW.quantity >= 0 THEN 1 ELSE -1 END WHERE id = NEW.id` にし、`daily_report_department_lines` の行を `7` と `-2` の 2 行にする（100 倍の後に `701` と `-201`。件数・型・`SUM(q / 100) = 5` は変換前と一致し、余りは `1` と `-1`）→ 手順 6 (c) の後半（余りが 0 でない行がある）で `MigrationFailed`、2 表とも列名が `quantity`・値が不変、v7 が記録されない | 途中の状態が残る、検証の呼出しが v7 の本体から外れる、検証の関数だけを単体で test して本体の配線を見ない、(c) の後半を余りの `SUM` で比べる（(2) の符号の違う余りが打ち消し合って通る） |
| T17 | MNT-03-D12 / F14 / F19 | F14 / F19 | unit（migration） | 新規 DB（2 表とも行 0）の `migrate` が成功し、schema_versions に v7 があり、`PRAGMA table_info` に `quantity_hundredths` があり `quantity` が無い。`test_migration_req401_v7_empty_and_all_null_tables`: v6 まで適用した合成 DB で (1) 2 表とも行 0 → v7 が成功し v7 が記録される。(2) 2 表とも `quantity` が全行 NULL（各 2 行）→ v7 が成功し、値は NULL のまま、v7 が記録される。既存の v4 の test（`test_migration_req401_v4_creates_daily_report_tables_and_indexes`・`test_migration_req401_v4_daily_report_constraints`）は `init_database` で最新版まで適用した DB を見るので、版の期待を v7 に、INSERT の列名を `quantity_hundredths` に追従させ、assert の意味（表・index・制約の検査）を変えずに PASS | v4 を書き換える、v7 の未登録、手順 2・6 (c) の `SUM` に `COALESCE` が無い（行 0・全行 NULL で `MigrationFailed`） |
| T18 | 24 §14.21 手順 4 / §14.22 手順 2 / UI-09b-D10 | F15 | unit（sales_repo） | `test_daily_report_repo_req401_quantity_hundredths_aggregates_as_integer`: 同じ日・同じ部門の 2 取込みの `110`・`20`（1.1 + 0.2）→ 日次の集約が `130`、月次の `SUM` が `130`（整数）。既存の `test_get_completed_daily_report_aggregate_req501_propagates_parent_and_line_nulls` は field 名と値の 100 倍の追従だけで NULL 伝播を保つ | 列名の取り違え、REAL で足す |
| T18b | 24 §14.21 手順 7 / §14.22 手順 2 | F20 | unit（sales_repo） | `test_get_completed_daily_report_aggregate_req501_aggregate_overflow_is_error`: (1) 同じ日・同じ部門に `quantity_hundredths = i64::MAX / 100` の部門の行を 2 行（amount は小さい値。同じ親でも 2 つの親でもよい）→ `get_completed_daily_report_aggregate` が `Err(DbError::QueryFailed(_))`（panic しない）。同じ DB で `get_monthly_official_department_totals` も `Err(DbError::QueryFailed(_))`。(2) 別の DB で、同じ日・同じ部門に amount = `i64::MAX / 2 + 1` の行を 2 行（`quantity_hundredths` と count は小さい値）→ `get_completed_daily_report_aggregate` が `Err(DbError::QueryFailed(_))` | `sum + value` のまま（(1) が red。debug の `cargo test` は panic、release は wrap で負の値の `Ok`）、部門の amount の合計を `+=` のまま（(2) が red） |
| T19 | §19.2 | F15 | unit（sales_service） | `test_get_daily_sales_req501_official_quantity_in_units`: 部門の行 `quantity_hundredths = 130` → `official_daily_report.department_lines[0].quantity == Some(1.3)`、`400` → `Some(4.0)`、NULL → None | ÷100 を忘れる |
| T20 | §19.2 / main wiring | F15 | integration（BIZ-08 → BIZ-05） | `test_get_monthly_sales_req502_official_quantity_in_units`: BIZ-08 で小数の束を commit した後、`get_monthly_sales` の `official_department_totals[*].quantity == Some(1.3)`（同じ月の 2 日分なら合計の単位の数） | 月次の写像の変換漏れ |
| T21 | wire | F16 | CLI | AC7: `cd src-tauri && cargo run --bin generate_bindings` → `git diff --exit-code -- ':(top)src/lib/bindings.ts'` が exit 0 | specta が `f64` を別の型にする |
| T22 | traceability | F17 | CLI + reviewer の照合 | AC7: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0（新しい test の名前に `req401` / `req501` / `req502` を含める）。generator は名前から REQ（`_reqNNN` の後が `_` か終端）を抽出できない test を集計しないので、`--check` だけでは付け忘れを検出しない。reviewer は repo の root で `git diff -U0 origin/main...HEAD -- src-tauri \| rg -o '^\+\s*fn (test_\w+)' -r '$1' \| rg -v '_req[0-9]{3}(_\|$)'` を実行し、出力なし・exit 1 を確かめる（REQ の無い新設の test が無い）。続けて同じ diff の `rg -o` の出力（新設の test 名の一覧）を Matrix の T1〜T20（T15b・T18b を含む）の行と突き合わせ、各 test 名の REQ が Matrix の行の REQ（IO-07・BIZ-08・migration・repo は `req401`、日次〈T18b の日次の集約を含む〉は `req501`、月次は `req502`）と合うことを確かめる | REQ の無い test、REQ の取り違え |

## Baseline

起票時（main `76de30d8`、2026-10-04、起草役）に逐語で実行した:

```
CARGO_TARGET_DIR=$TMPDIR/laneb-target cargo test --manifest-path src-tauri/Cargo.toml --lib daily_report
test result: ok. 54 passed; 0 failed; 0 ignored; 0 measured; 973 filtered out; finished in 3.87s
```

この中に上で引いた既存の test（`test_parse_daily_report_req401_layout_b_concatenated_shape_supported`、`test_parse_daily_report_req401_date_mismatch`、`test_parse_daily_report_req401_happy_path`、`test_daily_report_req401_parse_error_logs_parse_failed`、`test_migration_req401_v4_creates_daily_report_tables_and_indexes`、`test_migration_req401_v4_daily_report_constraints`、`test_get_completed_daily_report_aggregate_req501_propagates_parent_and_line_nulls`）が含まれる。本数は AC にしない。日報の個数を持つ test の追従の範囲は下の Compatibility Checks。

## State Lifecycle Matrix

| 状態 | 遷移 | 期待 | test |
|---|---|---|---|
| 選択 → preview | 混在の束 | preview に進まず、何も保存しない | T12 |
| 選択 → preview | 小数の束 | preview の数量が単位の数、cache は 100 倍 | T14 |
| preview → commit | 小数の束 | 100 倍の整数で保存 | T14 |
| commit → 日次・月次の取得 | 小数の行 | wire が単位の数 | T19・T20 |
| 既存 DB → 起動（v7） | 行あり | 値が同じに見える（100 倍で保存、÷100 で表示） | T15・T19 |
| 新規 DB・日報の無い DB → 起動（v7） | 行 0・全行 NULL | v7 が成功し記録される | T17 |
| v7 の失敗 → 再起動 | 範囲外の値 | 何も変えず版も記録しない | T15b |
| v7 の失敗 → 再起動 | 検証の失敗 | rollback、原因を除いた次の起動で再試行が成功 | T16 |
| rollback（論理取消） | 小数の取込み | 既存どおり残りの取込みに収束 | 既存の `test_completed_daily_report_aggregate_after_per_import_rollback_req501`（列名の追従） |

## Adjacent Pattern Audit

- 個数の読み取りの site: `parse_z001`（第3列）、`parse_z005`（第3列）。件数の site: `parse_z001`（総売以外）、`parse_z002`（第3列）。金額の site（`parse_optional_i64` / `parse_required_i64`）は変えない。
- 鍵の site: `summary_line_key`、`payment_key` の 2 つ（`rg -n 'fn (summary_line_key|payment_key)' src-tauri/src/io/daily_report_parser.rs`）。
- `quantity` の SQL の site: `sales_repo.rs` の INSERT 2・日次の aggregate 1・月次の集計 1（packet 起票時実測 #2）と test の直接の INSERT（`sales_repo.rs`・`sales_cmd.rs`・`migration.rs` の test）。
- wire の `quantity` の site: `DailyReportDepartmentLinePreview`、`OfficialDailyDepartmentLine`、`OfficialMonthlyDepartmentTotal`（lane C の `OfficialDailySummaryLine` は lane C）。

## Negative Paths

- T3（不正な小数の形）、T4（件数の小数）、T6・T9（精算回数・日付の不一致）、T11（コードだけが一致する行）、T13（複数の error）、T15b（範囲外の値・`i64::MIN`）、T16（migration の検証の失敗）、T18b（集約の溢れ）。

## Boundary Checks

- 小数 2 桁の上限 `9999.99` → `999999`（T2）、負の小数（T1）、カンマ付き（T1）、`0` と `0.0`（T1 に足してよい）。
- 精算回数の先頭 0（T8）、読めたのが 1 本（T7）・2 本で不一致（T8 (d)）・0 本（layout B だけの束は既存 test の形で十分）。
- migration v7 の範囲: 範囲内の最大 `i64::MAX / 100`（2 行）と負の端、範囲外の 1 件と `i64::MIN`（T15b）。日次・月次の集約の溢れ（範囲内の最大の 2 行、T18b）。行が 0 の表と全行が NULL の表（T17）。

## Compatibility Checks

- S1〜S8 の file のうち日報の個数（`quantity`）を持つ既存 test は全部、assert の意味を変えず、field 名・列名（`quantity` → `quantity_hundredths`）と値の 100 倍（`Some(4)` → `Some(400)` 等）だけを直して PASS させる。対象は `rg -n 'quantity' <file>` で列挙し、手で数えない。同じ file でも `sale_records` / `inventory_movements` / `products.stock_quantity` / `receiving_items` / `return_items` の `quantity` は日報の個数でないので変えない。wire の DTO を assert する test は単位の数（`Some(4.0)` 等）にする。
- 現時点（2026-10-04、`d37767a8` に round 1 の是正を載せた worktree、起草役）の `rg -n 'quantity' <file>` の hit のうち、日報の個数の test（helper を含む）:
  - `src-tauri/src/io/daily_report_parser.rs`: `test_parse_daily_report_req401_happy_path`（`:648`・`:652`・`:661`）、`test_parse_daily_report_req401_committed_fixture_bundle`（`:689`・`:703`）、`test_parse_daily_report_req401_layout_b_concatenated_shape_supported`（`:857`）
  - `src-tauri/src/db/migration.rs`: `test_migration_req401_v4_daily_report_constraints`（`:945`・`:960`、INSERT の列名）。同じ file の `:1015`・`:1016`（`test_migration_req401_v4_keeps_existing_sales_tables_intact`）は `sale_records` / `inventory_movements` で対象外
  - `src-tauri/src/db/sales_repo.rs`: `test_daily_report_repo_req401_insert_lines_and_keep_nullable_values`（`:1999`・`:2009`・`:2039`・`:2050`）、`test_completed_daily_report_aggregate_req501_all_active_parents`（`:2197`）、`test_get_completed_daily_report_aggregate_req501_propagates_parent_and_line_nulls`（`:2272`・`:2283`・`:2302`）、`test_get_completed_daily_report_aggregate_req501_groups_identities_deterministically`（`:2346`・`:2357`・`:2368`・`:2379`・`:2390`・`:2415`）、`test_completed_daily_report_aggregate_after_per_import_rollback_req501`（`:2468`・`:2503`）、`test_daily_report_repo_req401_rollback_is_parent_status_only`（`:2544`）、`test_get_monthly_official_department_totals_req502_includes_two_same_date_parents`（`:2818`・`:2829`・`:2840`・`:2855`）、`test_get_monthly_official_department_totals_null_department_req502`（`:2886`・`:2900`）。他の test の hit（helper の `seed_product`・`seed_product_with_dept`・`seed_sale` と、`test_insert_sale_record_*`・`test_*csv_import*`・`test_void_*`・`test_get_daily_sales_records_*`・`test_get_monthly_by_*`）は `sale_records` / `inventory_movements` / `stock_quantity` の `quantity` で対象外
  - `src-tauri/src/biz/sales_service.rs`: helper `seed_daily_report_lines`（`:641`。`:735`・`:754`・`:783`・`:785`・`:945`・`:961` の test が使う）。他の test の hit（`:666`・`:696`・`:719`・`:725`・`:760`・`:935` の商品別・部門別の売上の集計と、helper の `:575`・`:591`）は `sale_records` 系で対象外
  - `src-tauri/src/cmd/sales_cmd.rs`: `test_get_daily_sales_cmd_passes_official_report_req501`（`:327`）。`:249`（`test_export_sales_csv_req501_response_contract`）は対象外
  - `src-tauri/src/biz/daily_report_import_service/tests.rs`: 日報の個数の field を直接書く test は無い（hit は helper `z001_with_lines` の変数名 `quantity_or_count` と `stock_quantity`）。cache の型を組み立てる箇所が出たら同じ規則
  - `src-tauri/tests/import_internal_contract_test.rs`: `test_import_internal_contract_req401_is_minimal` は plan 側の commit で split pin にした（S8）。実装 PR で単一 pin `quantity_hundredths` へ戻す
- 版の固定（`quantity` でない）: `src-tauri/src/db/schema_v2.rs` の `:378`・`:586`・`:596`・`:601`（S8）と `migration.rs` の v6 を数える test（S5）は v7 に追従させる。
- `src/**` の FE の test は変えずに PASS（AC8）。bindings の diff 0（T21）。

## Data Safety Checks

- 新しい fixture は合成の文字列だけ。`tests/fixtures/daily-report/` を変えない。
- AC9 の実データの probe は scratchpad（repo 外）で、出力は束の鍵・成否・error_type・行番号だけ。

## Main Wiring / Integration Checks

- T14（IO-07 → BIZ-08 の preview と commit → DB）と T20（BIZ-08 の commit → BIZ-05 の月次の wire）で、層をまたいだ 100 倍の整数と単位の数の境界を通す。

## Mutation-style Adequacy Questions

- 個数の parse を `value.parse::<f64>()? * 100.0` の切り捨てに変えると T2 が red になるか（`1.13` → 112）。
- 小数部 1 桁の ×10 を ×1 にすると T1 が red になるか。
- `settlement_mismatch` の条件を「3 本とも読めて違う」に狭めると T6・T9 は green のままで、T8 (d) が red になるか。「読めない 1 本を不一致とみなす」に広げると T7 が red になるか。
- 精算回数を `String` で比べると T8 (a) が red になるか。
- `payment_key` に `code == "03"` を戻すと T11 が red になるか。
- BIZ-08-D2 の分岐を消すと T12 が red になるか。
- migration の `WHERE … IS NOT NULL` を外して `COALESCE(…, 0) * 100` にすると T15 が red になるか。
- 手順 2・6 (c) の `SUM` から `COALESCE` を外すと T17（新規 DB と `test_migration_req401_v7_empty_and_all_null_tables` の行 0・全行 NULL）が red になるか（`SUM` が NULL で比較が成り立たず `MigrationFailed`）。
- v7 の範囲検査を消すと T15b (2) が red になるか（範囲外の値は 100 倍で REAL になり手順 6 (b) が rollback するので、値・列名・版の assert は green のままで、message の `範囲検査` の assert だけが red になる）。検証 (c) を「合計の 100 倍と比べる」に変えると T15b (1) が red になるか（`SUM` の溢れ）。v7 の本体から検証の呼出しを消すと T16 が red になるか。
- v7 の範囲検査を `q.abs() > L` に変えると T15b (2) の `i64::MIN` の行が red になるか（debug は panic、release は範囲内と判定して範囲検査の message にならない）。
- v7 の検証 (c) の後半を `COALESCE(SUM(quantity_hundredths % 100), 0) = 0` に戻すと T16 (2) が red になるか（`701` と `-201` の余り `1` と `-1` が打ち消し合い、(a)・(b)・(c) の前半も通るので v7 が成功してしまう）。
- 精算回数の読み取りをヘッダの後も走査するように変えると T8 (c) が red になるか（ヘッダの後の第1列 `精算回数` の行の `0009` を読み、`settlement_mismatch`）。
- 日次の集約の `checked_add` を `sum + value` に戻すと T18b が red になるか（debug の `cargo test` は panic）。
- 部門の amount の合計の `checked_add` を `+=` に戻すと T18b (2) が red になるか（(2) は amount だけが溢れる fixture なので、`quantity_hundredths` の検査では止まらない）。
- commit の部門の行を cache の 100 倍の整数でなく preview の `quantity`（wire の `f64`）から `round(q * 100)` で作ると T14 が red になるか（commit の前に preview の値を書き換えるので、書き換えた値が保存される）。
- BIZ-05 の写像の ÷100 を消すと T19・T20 が red になるか（型が `f64` なので compile は通る）。

## Residual Test Gaps

- layout B の実物のメタの精算回数（未確認、D-104 Revisit）。test は合成の layout B（精算回数なし）だけ。
- specta の `f64` の出力は T21 の CLI だけで、unit test は無い。
- 実データの確かめは AC9 の local-only の probe で、CI に入らない。
