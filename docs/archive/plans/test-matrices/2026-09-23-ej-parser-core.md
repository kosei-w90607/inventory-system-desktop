# Test Design Matrix: EJ（電子ジャーナル）parser の core

対象 packet: [2026-09-23-ej-parser-core.md](../2026-09-23-ej-parser-core.md)。契約の正本は本 PR で新設する `docs/function-design/29-io-ej-parser.md`（IO-08-D1〜D10）。

## Risk

Risk: R3

## Contracts Under Test

- IO-08-D1 純関数・生バイト入力・file_hash・致命的エラー 3 種（`DecodeFailed` / `NoRecords` / `Empty`）
- IO-08-D2 CRLF 区切り・24 バイト固定幅・最終改行
- IO-08-D3 2 行ヘッダ・モード欄・日時と番号は文字列のまま
- IO-08-D4 先頭断片・EOF を閉じの根拠にしない
- IO-08-D5 位置による行分類・Unknown を残す
- IO-08-D6 明細の復元と記録内照合（数量×単価・点数・合計 / 現金・非負・同名非合算・符号非反転）
- IO-08-D7 明細を持たない記録（入金 / 出金 / 替・設定書込み・精算）
- IO-08-D8 復元状態の型（`Unresolved` は明細を持たない）・`header_line_no`・診断 code / 範囲・code ごとの固定文言（完全一致）・文言に生の行を入れない
- 不変条件: どの行も失われない（先頭断片・ヘッダ 2 行・本文の行番号を合わせると 1〜N をちょうど 1 回ずつ覆う）
- 金額 token の字形: 合計域の `合  計` / `お預り` / `お  釣` / `現金` と `入金` / `出金` は全角 `￥` + 全角数字 + 全角 `，`、明細・`対象計`・`内税`・精算票は ASCII 数字。精算票の `AmountOnly` とラベル行は通貨記号なしの負値を取りうる（検査しない）

## Failure Modes

- 未知の行・未知のモード・照合の不一致を含む取引から明細が返り、後続が在庫へ反映できてしまう。
- 区切りの後の「現金」行を明細と読み、架空の明細が増える（区切りの位置を無視した分類）。
- 区切りの前の名称が合計域のラベルで始まる（例:「現金」で始まる商品名）と、明細が消える。
- 数量行が後続の複数の明細に掛かる、または数量行が無視されて数量が 1 になる。
- 同じ名称の行を合算し、記録内の行と明細の対応が崩れる。
- 返品モードで符号を反転する、または金額の符号で返品を判定する。
- EOF や file 末尾を取引の終わりとみなし、切れた取引を復元済みにする。
- 幅違反・孤立した LF / CR・最終改行なしを正規化で隠す。
- 最初のヘッダより前の行を捨てる、または最初の記録に混ぜる。
- 番号の先頭 0 を落とす、日時を変換・補正する。
- 番号の連続・file 名の日付で区間を判断する（IO の範囲を越える）。
- 診断の文言に名称・金額を含む生の行が入り、後の log・画面へ流れる。
- decode 失敗・ヘッダなし・空入力で部分結果を返す。
- 合計・現金の全角数字を読めず、正しい取引まで復元不能になる（実物の全取引が不成立になる）。
- 精算票の通貨記号なしの負値を Unknown とし、返品だけの日の精算が復元不能になる。
- 名称の中の空白で名称が切れる、または金額の一部が名称に入る。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。helper 名だけで実 router / integration と分類しない。
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。状態 reset なら初回 mount に加え同値再選択等の別経路を確認し、対象契約が行使されるものを選ぶ。

packet が使う ID と test 名の対応:

- T-P1 `parse_ej_normal_sale_restores_items` / T-P2 `parse_ej_quantity_line_applies_to_next_item` / T-P3 `parse_ej_repeated_same_name_lines_kept_separate` / T-P4 `parse_ej_return_mode_keeps_positive_amounts` / T-P5 `parse_ej_exact_cash_tender_without_total_line` / T-P6 `parse_ej_item_named_like_label_before_separator_is_item` / T-P7 `parse_ej_non_item_records_paid_in_paid_out_exchange` / T-P8 `parse_ej_settlement_and_program_records` / T-P9 `parse_ej_multiple_settlements_in_one_file_and_pre_dated_first_record` / T-P10 `parse_ej_amount_formats` / T-P11 `parse_ej_file_hash_is_raw_sha256` / T-P12 `parse_ej_item_name_with_inner_space` / T-P13 `parse_ej_zero_amount_item_is_restored`
- T-N1 `parse_ej_unknown_line_in_item_region_unresolves_record_only` / T-N2 `parse_ej_unknown_line_after_separator_unresolves_record` / T-N3 `parse_ej_unrecognized_header_mode_unresolves_record` / T-N4 `parse_ej_item_count_mismatch_unresolves` / T-N5 `parse_ej_quantity_price_mismatch_unresolves` / T-N6 `parse_ej_total_mismatch_unresolves` / T-N7 `parse_ej_negative_item_amount_unresolves` / T-N8 `parse_ej_quantity_line_not_followed_by_item_unresolves` / T-N9 `parse_ej_record_truncated_at_eof_unresolves` / T-N10 `parse_ej_missing_final_crlf_reports_diagnostic` / T-N11 `parse_ej_invalid_width_line_unresolves_record` / T-N12 `parse_ej_leading_lines_before_first_header_are_reported` / T-N13 `parse_ej_decimal_quantity_unresolves` / T-N14 `parse_ej_unknown_line_in_settlement_unresolves` / T-N15 `parse_ej_settlement_not_starting_with_title_unresolves` / T-N16 `parse_ej_program_body_with_other_line_unresolves` / T-N17 `parse_ej_count_without_total_or_cash_unresolves` / T-N18 `parse_ej_header_only_record_unresolves`
- T-F1 `parse_ej_decode_failure_is_fatal` / T-F2 `parse_ej_no_record_header_is_fatal` / T-F3 `parse_ej_empty_input_is_fatal` / T-I1 `parse_ej_every_line_is_accounted_for` / T-I2 `parse_ej_diagnostic_messages_are_fixed_texts` / T-R1 `real_ej_structure_probe`

合計域の `合  計` / `お預り` / `お  釣` / `現金` と `入金` / `出金` の fixture 行は、実物と同じく全角 `￥` + 全角数字 + 全角 `，` で組む（T-P1 / T-P5 / T-P7 / T-P10 ほか全取引）。ASCII 数字だけの fixture で全角の経路を素通りさせない。

fixture は test 内の builder で作る: 文字列を CP932 で encode し、24 バイトに満たなければ右を空白で埋め、24 バイトを超えれば builder 自身が panic する（fixture の誤りを test の PASS に紛れ込ませない）。名称・金額・日付・番号は架空の値を使う。全 test は `src-tauri/src/io/ej_parser.rs` の `#[cfg(test)] mod tests` に置く（新設のため既存 test の引用は無い）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| IO-08-D3 / D5 / D6 | 通常販売の明細が名称・数量・金額で返らない。番号の先頭 0 が落ちる | unit | `parse_ej_normal_sale_restores_items` | 明細 2 行の取引（区切り・点数 2・対象計・内税・合計・お預り・お釣。合計 / お預り / お釣は全角数字）が `Restored` でない、`header_line_no` がヘッダ 1 行目を指さない、名称の末尾空白が残る、番号 `0001` / `000123` が数値化される、日時が文字列のまま返らない |
| IO-08-D6 | 数量行の掛かり方 | unit | `parse_ej_quantity_line_applies_to_next_item` | 数量行（3 点 @120）の直後の明細（\360）が数量 3・単価 120 にならない、その次の明細まで数量 3 になる、数量行の無い明細の単価が `Some` になる |
| IO-08-D6 | 同名行の合算 | unit | `parse_ej_repeated_same_name_lines_kept_separate` | 同じ名称の明細 2 行が 1 件に合算される、点数 2 との照合が崩れる |
| IO-08-D3 / D6 | 返品の符号 | unit | `parse_ej_return_mode_keeps_positive_amounts` | モード欄 `戻` が `Return` にならない、明細の金額が負に反転される |
| IO-08-D6 | 合計の無い現金ちょうどの取引 | unit | `parse_ej_exact_cash_tender_without_total_line` | 合計域が点数・対象計・内税・現金（全角数字）だけの取引が `Unresolved` になる、または「現金」行が明細に入る |
| IO-08-D5 | 位置によらないラベル判定 | unit | `parse_ej_item_named_like_label_before_separator_is_item` | 区切りの前の「現金」で始まる名称の明細が `Labeled` に分類されて明細から消える |
| IO-08-D7 | 入金 / 出金 / 替 | unit | `parse_ej_non_item_records_paid_in_paid_out_exchange` | 本文 1 行の `入金` / `出金` / `替` の記録が `NoItems` でない、または診断が出る。金額の無い `替` の行が `NoItems` / Unknown にならない（fixture の `替` の行は実物と同じく `替` + 空白 + 半角カナの文字列で、数字・通貨記号を含めない） |
| IO-08-D5 / D7 | 設定書込み・精算 | unit | `parse_ej_settlement_and_program_records` | `PGM`（区切り・SD設定書込み・区切り）と `精算`（日計明細の題・総売・金額だけ・純売・金額だけ・現金在高・純客・区切り・日計明細・SDｶｰﾄﾞ保存・ｽﾏ-ﾄﾌｫﾝ送信）が `NoItems` でない、題の両端の数字が文字列で保持されない。返品だけの日の精算（`総売` / `純客` の負値、通貨記号なしの `-` + 数字の `AmountOnly`、`対象計` / `内税` / `消費税合計` / `現金在高` の通貨記号なしの負値）が `NoItems` でない |
| IO-08-D3 / D9 | file 内の複数精算・前日付の先頭 | unit | `parse_ej_multiple_settlements_in_one_file_and_pre_dated_first_record` | 先頭の記録が file の他の記録より前の日付だと異常扱いされる、2 回目の精算の後の記録が落ちる、記録の順序が変わる |
| IO-08-D6 | 金額の表記 | unit | `parse_ej_amount_formats` / `parse_ej_amount_i64_bounds` | 半角 `\1,234`、全角 `￥１２，３４５`（全角数字・全角読点）、単価 `@1,200`、通貨記号なしの `-980` のどれかが `i64` に読めない。数字・桁区切り・通貨記号の幅が 1 つの token の中でそろわない token（`￥1,234`、`\１２`）が数値として受理される。`i64::MIN` / `i64::MAX` が読めない、その外側が受理される |
| IO-08-D1 | file_hash | unit | `parse_ej_file_hash_is_raw_sha256` | file_hash が生バイトの SHA-256 小文字 hex 64 文字でない、decode 後の文字列から計算される |
| IO-08-D5 / D6 | 名称の中の空白 | unit | `parse_ej_item_name_with_inner_space` | 名称に空白を含む明細（例 `ﾃｽﾄ ｲﾄ A` + 空白 + `\200`）で、名称が最初の空白で切れる、金額の一部が名称に入る、名称の末尾空白が残る |
| IO-08-D6 | 0 円の明細 | unit | `parse_ej_zero_amount_item_is_restored` | 金額 `\0` の明細を含み合計が一致する取引が `Unresolved` になる |
| IO-08-D5 / D8 | 明細域の未知の行 | unit | `parse_ej_unknown_line_in_item_region_unresolves_record_only` | 未知の行（例: 金額の無い架空の訂正表示）を含む取引が `Restored` になる、同じ file の前後の取引まで `Unresolved` になる、診断の行番号がずれる、`EjRestoration::Unresolved` 以外の variant になる |
| IO-08-D5 | 合計域の未知の行 | unit | `parse_ej_unknown_line_after_separator_unresolves_record` | 合計域の未知のラベル（例: 架空の支払種別）を含む取引が `Restored` になる |
| IO-08-D3 | 未知のモード | unit | `parse_ej_unrecognized_header_mode_unresolves_record` | 未知のモード欄の記録が `Unrecognized(raw)` にならない、`Normal` として明細が復元される |
| IO-08-D6 | 点数の不一致 | unit | `parse_ej_item_count_mismatch_unresolves` | 点数 3 と数量の合計 2 の取引が `Restored` になる |
| IO-08-D6 | 数量×単価の不一致 | unit | `parse_ej_quantity_price_mismatch_unresolves` | 2 点 @100 に対し金額 \300 の取引が `Restored` になる |
| IO-08-D6 | 合計の不一致 | unit | `parse_ej_total_mismatch_unresolves` | 合計が明細の金額の合計と違う取引が `Restored` になる |
| IO-08-D6 | 合計が無いときの現金の不一致 | unit | `parse_ej_cash_mismatch_without_total_line_unresolves` | 合計行が無く、現金の金額が明細の金額の合計と違う取引が `Restored` になる、`InconsistentRecord` が出ない |
| IO-08-D6 | 負の明細金額 | unit | `parse_ej_negative_item_amount_unresolves` | 明細域の負の金額が明細として受理される |
| IO-08-D6 | 数量行の孤立 | unit | `parse_ej_quantity_line_not_followed_by_item_unresolves` | 数量行の直後が区切りの取引（点数 1・合計 \100 は明細 \100 とそろう）が `Restored` になる |
| IO-08-D4 / D6 / D7 | EOF で切れた取引・精算 | unit | `parse_ej_record_truncated_at_eof_unresolves` | 明細の後で file が終わる取引、`日計明細` の終わり行の無い精算が `Restored` / `NoItems` になる |
| IO-08-D2 | 最終改行なし | unit | `parse_ej_missing_final_crlf_reports_diagnostic` | 最後の CRLF が無い file で `MissingFinalNewline` が出ない、または最後の行が失われる |
| IO-08-D2 | 幅違反・孤立 LF | unit | `parse_ej_invalid_width_line_unresolves_record` | 23 / 25 バイトの行や孤立した LF を含む行が正規化されて通る、`InvalidWidth` が出ない |
| IO-08-D2 | 24 バイト内の孤立 CR / LF | unit | `parse_ej_lone_cr_or_lf_within_24_bytes_unresolves_record` | 幅 24 のまま空白 1 バイトが CR / LF に置き換わった行が trim で隠れて `Restored`・診断 0 になる、生行が保たれない |
| IO-08-D2 / D3 / D4 | ヘッダ・先頭断片の孤立 CR / LF | unit | `parse_ej_lone_cr_or_lf_in_header_or_leading_line_is_invalid_width` | モード欄に CR / LF を含む 2 行がヘッダとして検出される、先頭断片の CR / LF を含む行に `InvalidWidth` が出ない |
| IO-08-D4 | 先頭断片 | unit | `parse_ej_leading_lines_before_first_header_are_reported` | 最初のヘッダより前の行が捨てられる、最初の記録に混ざる、`LeadingFragment` が出ない |
| IO-08-D5 / D6 | 小数の数量 | unit | `parse_ej_decimal_quantity_unresolves` | `1.3 点 @…` の行が数量行として受理される（小数の数量は未観測） |
| IO-08-D5 / D7 | 精算内の未知の行 | unit | `parse_ej_unknown_line_in_settlement_unresolves` | 精算の本文に未知の行がある記録が `NoItems` になる、`UnknownLine` が出ない |
| IO-08-D7 | 題で始まらない精算 | unit | `parse_ej_settlement_not_starting_with_title_unresolves` | 本文の先頭が `SettlementTitle` でない精算が `NoItems` になる |
| IO-08-D7 | PGM の本文 | unit | `parse_ej_program_body_with_other_line_unresolves` | 区切り・`Status` 以外の行を含む `PGM` の記録が `NoItems` になる |
| IO-08-D6 | 合計も現金も無い取引 | unit | `parse_ej_count_without_total_or_cash_unresolves` | 区切り・点数はあるが `合  計` も `現金` も無い取引が `Restored` になる、`IncompleteRecord` が出ない |
| IO-08-D6 | 点数の行が無い取引 | unit | `parse_ej_total_without_item_count_unresolves` | 区切り・合計（明細とそろう）はあるが `ItemCount` の無い取引が `Restored` になる、`IncompleteRecord` が出ない |
| IO-08-D6 | ヘッダだけの記録 | unit | `parse_ej_header_only_record_unresolves` | 本文 0 行の通常の記録（次のヘッダが直後に来る）が `Restored` / `NoItems` になる |
| IO-08-D6 | 数量行の連続 | unit | `parse_ej_consecutive_quantity_lines_unresolve` | 同じ数量行（2 点 @100）が 2 行続き、直後の明細 \200・点数 2・合計 200 とそろう取引（前後どちらの数量行を採っても照合がそろう fixture）が `Restored` になる、`InconsistentRecord` が出ない |
| IO-08-D6 | 点数・照合に使うラベルの行の重複 | unit | `parse_ej_duplicate_count_or_total_lines_unresolve` | 点数の行、`合  計` の行、合計の無い取引の `現金` の行のどれかが 2 行あり、値がそろっている取引が `Restored` になる（最初の行を採って照合する）、`InconsistentRecord` にならない |
| IO-08-D5 / D6 | 数量 0・負の単価の数量行 | unit | `parse_ej_zero_quantity_or_negative_unit_price_unresolves` | `0 点 @100` と \0 の明細の組、または `1 点 @-100` の行が数量行として受理され、記録が `Restored` になる（数量 0 は照合を素通りする）。その行が `Unknown`・`UnknownLine` にならない。`@-0` が受理される、`@0` が拒否される |
| IO-08-D6 | 区切りの前に明細が無い | unit | `parse_ej_no_item_before_separator_unresolves` | 明細 0 件・点数 0・合計 0 の取引が空の `Restored` になる、`IncompleteRecord` が出ない |
| IO-08-D6 | 照合に使うラベルの金額が読めない | unit | `parse_ej_unreadable_total_amount_unresolves` | `合  計` の金額 token が読めない（`￥1,00`）取引で、`現金` の行へ読み替えて照合し `Restored` になる、`InconsistentRecord` にならない |
| IO-08-D5 / D7 | 返品モードの入金の行 | unit | `parse_ej_paid_in_line_in_return_mode_unresolves` | 返品モード（`戻`）で本文が `入金` の 1 行だけの記録が `NoItems` になる（明細なしの判定は通常モードだけ）、`IncompleteRecord` にならない |
| IO-08-D2 / D4 | 先頭断片の幅違反 | unit | `parse_ej_invalid_width_leading_line_is_reported` | 23 バイトの先頭断片の行に `InvalidWidth` が出ない、`LeadingFragment` が出ない、後続の記録の明細が復元されない |
| IO-08-D5 | 通貨記号の必須 / 拒否 | unit | `parse_ej_currency_symbol_required_on_item_and_rejected_on_unit_price` | 通貨記号の無い明細の金額（`120`）や、通貨記号つきの単価（`@\100`）が受理され、記録が `Restored` になる、その行が `Unknown` にならない |
| IO-08-D1 | decode 失敗 | unit | `parse_ej_decode_failure_is_fatal` | CP932 として不正なバイト列で `Ok` や部分結果が返る |
| IO-08-D1 | ヘッダなし | unit | `parse_ej_no_record_header_is_fatal` | 24 バイトの行だけでヘッダの無い入力で `Ok` が返る |
| IO-08-D1 | 空入力 | unit | `parse_ej_empty_input_is_fatal` | 0 バイトで `Err(Empty)` にならない |
| 不変条件 / IO-08-D8 | 行の消失・文言への生の行の混入 | unit | `parse_ej_every_line_is_accounted_for` | 先頭断片・未知の行・幅違反・複数種の記録を混ぜた file で、先頭断片 + 2 × 記録数 + 本文の行数が全行数と一致しない。先頭断片・`header_line_no` とその次の行・本文の行番号を合わせたものが 1〜N をちょうど 1 回ずつ覆わない（重複・欠番）。どれかの diagnostic の message に fixture の名称文字列が含まれる |
| IO-08-D8 | 診断文言の揺れ | unit | `parse_ej_diagnostic_messages_are_fixed_texts` | 7 code をすべて発生させる fixture で、各 diagnostic の message が code ごとの固定文言と完全一致しない |
| IO-08-D5〜D7（実物） | 実物の形状への不一致 | CLI（ignore、Coordinator 手元） | `real_ej_structure_probe` | `INVENTORY_EJ_PROBE_DIR` の実物 6 本のどれかが `Err`、`Unresolved` が 1 件以上、診断が 1 件以上。`.TXT`（大文字小文字を区別しない）以外の file を読む、読んだ / 読まなかった file 数を出さない、環境変数が無いのに PASS する、出力に件数以外が出る |
| 既存契約の不変 | 既存 parser・BIZ・bindings・traceability の変化 | CLI | `cargo test`、`cargo test --test design_compliance_test`、`cargo run --bin generate_traceability -- --check` | 既存 test が落ちる、`29-io-ej-parser.md` が module に対応づかない、traceability の生成結果が変わる |

## State Lifecycle Matrix

not applicable: `parse_ej` は状態を持たない純関数で、保存・cache・route・再試行の状態が無い。途中で切れた file の再取得と再 parse は、同じ関数に別の入力を渡すだけである（`parse_ej_record_truncated_at_eof_unresolves` と `parse_ej_normal_sale_restores_items` の組で表す）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| CP932 strict decode（`encoding_rs::SHIFT_JIS.decode_without_bom_handling` + error で致命的） | `src-tauri/src/io/z004_parser.rs:118`、`src-tauri/src/io/daily_report_parser.rs`、`src-tauri/src/io/product_csv_importer.rs` | `ej_parser.rs`（行ごとに decode、どれかが不正なら致命的） | BOM 判定（IO-03）は採らない: EJ は BOM なしを観測 | `parse_ej_decode_failure_is_fatal` |
| file_hash = 生バイトの SHA-256 小文字 hex | `z004_parser.rs:113`、`daily_report_parser.rs` | `ej_parser.rs` | なし | `parse_ej_file_hash_is_raw_sha256` |
| 改行正規化（NEL / CRLF / LF / CR → LF） | `z004_parser.rs`（Step 3）、`daily_report_parser.rs` | なし | 採らない（IO-08-D2）: 固定幅の形式で孤立した LF / CR は破損の兆候で、正規化すると幅の検査が効かない | `parse_ej_invalid_width_line_unresolves_record` |
| 致命的エラー / 行単位エラーの二層 | `z004_parser.rs` の `Z004ParseError` / `ParseError` | `EjParseError`（致命的）と `EjDiagnostic`（行・記録・file 範囲）| 行単位エラーを「他の行は処理できた」の意味だけで使わず、記録を復元不能にする範囲を持たせる（取引境界の誤りは行単位では表せないため） | `parse_ej_unknown_line_in_item_region_unresolves_record_only` |
| 番号は意味が検証されるまで文字列 | `docs/function-design/23-io-z004-parser.md:5` | `EjRecord` の 4 桁の欄と 6 桁の番号 | なし | `parse_ej_normal_sale_restores_items` |
| test 内 fixture builder（layout A の text 組立て） | `z004_parser.rs` の `layout_a_text` / `synthetic_layout_a_fixture` | `ej_parser.rs` の 24 バイト行 builder | fixture file を置かない（Z004 と同じく test 内で組み立てる） | 全 unit test |

## Negative Paths

- missing input: 空入力 → `Err(Empty)`（`parse_ej_empty_input_is_fatal`）。ヘッダなし → `Err(NoRecords)`（`parse_ej_no_record_header_is_fatal`）。
- invalid input: CP932 不正 → `Err(DecodeFailed)`。幅違反・孤立 LF / CR → `InvalidWidth` + 記録の復元不能。最終改行なし → `MissingFinalNewline`。
- duplicate/ambiguous input: 同名の明細行は合算せず別の明細（`parse_ej_repeated_same_name_lines_kept_separate`）。明細域の「現金」で始まる名称は明細（`parse_ej_item_named_like_label_before_separator_is_item`）。同じ file を 2 回渡しても同じ結果・同じ file_hash（純関数。重複の判定は非目的）。
- unknown reference: 未知の行・未知のモード → `Unresolved` + `UnknownLine` / `UnrecognizedMode`。
- dependency missing: 該当なし（外部依存なし）。T-R1 は ignore 付きで CI では実行しない。`--ignored` で実行したのに環境変数が無ければ panic する（何も確かめずに PASS しない）。dir 内の `.TXT` 以外の file は読まず、読まなかった数だけを出力する。
- permission/write failure: 該当なし（読み取り専用、file I/O は T-R1 だけ）。
- dry-run side effect: 該当なし（副作用なし）。

## Boundary Checks

- threshold: 行幅 24 バイトちょうど（23 / 25 は違反）。
- null/default: 数量行の無い明細は数量 1・単価なし。合計が無ければ現金の値で照合し、どちらも無ければ `IncompleteRecord`。
- empty/non-empty: 0 バイト、ヘッダだけの記録（本文 0 行の通常の記録は `IncompleteRecord`、`parse_ej_header_only_record_unresolves`）、最後の CRLF の後が空 / 非空。
- min/max: 金額 0 の明細（受理、`parse_ej_zero_amount_item_is_restored`）、負の金額（不成立）、`i64` に収まらない桁の金額は数値化できず `Unknown`（両端の `i64::MIN` / `i64::MAX` は受理、`parse_ej_amount_i64_bounds`）。
- status/policy enum: `EjMode` 5 種、`EjRestoration` 3 種、`EjDiagnosticCode` 7 種。
- wire type: 生バイト（CP932・CRLF・24 バイト固定幅）。
- internal type: 金額・数量・単価 `i64`、日時・番号は文字列。
- producer/consumer: producer = レジ（SD）→ CV17 → EcrDatas、consumer = `parse_ej`。
- round-trip token: 該当なし（読み取り専用）。
- precision/range: 分精度の日時は変換しない。番号の先頭 0 を保つ。
- cross-language parse: 該当なし（Rust の内部型だけ、bindings に出さない）。

## Compatibility Checks

- old schema/input: 該当なし（新しい入力形式。既存の保存データ・wire に触れない）。
- new schema/input: 実物 6 本の構造（Contract Probe）と一致する合成 fixture で全経路を通す。実物は AC9 で確認する。
- output order: 記録は file の出現順、明細は記録内の出現順（`parse_ej_multiple_settlements_in_one_file_and_pre_dated_first_record`、`parse_ej_repeated_same_name_lines_kept_separate`）。
- optional field behavior: 単価は数量行があるときだけ `Some`。

## Data Safety Checks

- source-derived data: 実物の EJ・その値・probe の出力を commit しない。Writer は実物を開かない。
- generated outputs: `bindings.ts` / `90-traceability.md` を再生成しない（差分 0、AC7）。
- secrets: 該当なし。
- local-only files: 実物の EJ、Coordinator の構造 probe script、T-R1 の出力。
- synthetic sample boundaries: fixture の名称・金額・日付・番号は架空。レジが印字する固定ラベルだけを実物の表記で使う。

## Main Wiring / Integration Checks

- helper connected to main path: 呼出し側（BIZ）はまだ無い（非目的）。`io/mod.rs` に `pub mod ej_parser;` があり build される。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: T-R1 の環境変数 `INVENTORY_EJ_PROBE_DIR` が dir の読み込みに届く（AC9 の実行で確認）。

## Mutation-style Adequacy Questions

- 位置による分類を外し、行の形だけで分類したら? → `parse_ej_exact_cash_tender_without_total_line`（「現金」行が明細になり点数と合計がずれる）と `parse_ej_item_named_like_label_before_separator_is_item` が落ちる。
- 点数の照合を外したら? → `parse_ej_item_count_mismatch_unresolves` が落ちる。
- 数量×単価の照合を外したら? → `parse_ej_quantity_price_mismatch_unresolves` が落ちる。
- 合計 / 現金の照合を外したら? → `parse_ej_total_mismatch_unresolves` が落ちる。現金の照合だけを外したら（現金の値を明細の合計に差し替える）→ `parse_ej_cash_mismatch_without_total_line_unresolves` が落ちる。
- 数量行を後続の全明細に掛けたら? → `parse_ej_quantity_line_applies_to_next_item` が落ちる。
- 同名行を合算したら? → `parse_ej_repeated_same_name_lines_kept_separate` が落ちる。
- 返品モードで符号を反転したら? → `parse_ej_return_mode_keeps_positive_amounts` が落ちる。
- EOF を記録の閉じとみなしたら? → `parse_ej_record_truncated_at_eof_unresolves` が落ちる。
- 未知の行を黙って読み飛ばしたら? → `parse_ej_unknown_line_in_item_region_unresolves_record_only` と `parse_ej_every_line_is_accounted_for` が落ちる。
- 改行を正規化したら? → `parse_ej_invalid_width_line_unresolves_record` が落ちる。幅 24 の行の CR / LF を検査しなかったら? → `parse_ej_lone_cr_or_lf_within_24_bytes_unresolves_record` と `parse_ej_lone_cr_or_lf_in_header_or_leading_line_is_invalid_width` が落ちる。
- 先頭断片を捨てたら? → `parse_ej_leading_lines_before_first_header_are_reported` と `parse_ej_every_line_is_accounted_for` が落ちる。
- 診断の message に生の行を埋めたら、または文言を変えたら? → `parse_ej_every_line_is_accounted_for` と `parse_ej_diagnostic_messages_are_fixed_texts` が落ちる。
- 行番号を 1 つずらす・ヘッダ 2 行目を数え落とすと? → `parse_ej_every_line_is_accounted_for`（1〜N の被覆）が落ちる。
- 全角数字を読めなくしたら? → `parse_ej_amount_formats`、`parse_ej_normal_sale_restores_items`、`parse_ej_exact_cash_tender_without_total_line` が落ちる。
- `AmountOnly` を通貨記号つき・非負に限ったら? → `parse_ej_settlement_and_program_records`（返品だけの日の精算）が落ちる。
- 名称を最初の空白で切ったら? → `parse_ej_item_name_with_inner_space` が落ちる。
- 明細の金額を「0 より大」にしたら? → `parse_ej_zero_amount_item_is_restored` が落ちる。
- 合計 / 現金が無いとき照合を省いて通したら? → `parse_ej_count_without_total_or_cash_unresolves` が落ちる。
- 点数の行が無いとき点数の照合を省いて通したら? → `parse_ej_total_without_item_count_unresolves` が落ちる。
- 区切りの直前の数量行の検査を外したら、または数量行の連続で後の行・前の行のどちらかを採ったら? → `parse_ej_quantity_line_not_followed_by_item_unresolves` / `parse_ej_consecutive_quantity_lines_unresolve` が落ちる（どちらも点数・合計を明細とそろえ、他の照合では落ちない fixture にしてある）。
- 本文 0 行の記録を空の `Restored` にしたら? → `parse_ej_header_only_record_unresolves` が落ちる。
- 数量行の数量 0 や `-` つきの単価を受理したら（数量の下限を 0 にする、単価の `-` の検査を外す）? → `parse_ej_zero_quantity_or_negative_unit_price_unresolves` が落ちる（数量 0 の数量行と \0 の明細の組は他の照合を素通りするため、この test だけが検出する）。
- 点数・`合  計`・`現金` の行が重複したとき、最初の行を採って照合したら? → `parse_ej_duplicate_count_or_total_lines_unresolve` が落ちる。
- 精算・PGM の本文の未知の行を読み飛ばしたら、または精算の題の位置を見なかったら? → `parse_ej_unknown_line_in_settlement_unresolves`、`parse_ej_program_body_with_other_line_unresolves`、`parse_ej_settlement_not_starting_with_title_unresolves` が落ちる。
- 番号を数値化したら? → `parse_ej_normal_sale_restores_items`（先頭 0）が落ちる。
- 未知のモードを `Normal` に倒したら? → `parse_ej_unrecognized_header_mode_unresolves_record` が落ちる。
- mutation は Writer が主要 5 種（位置分類・点数照合・合計照合・EOF 閉じ・未知行の読み飛ばし）を実注入して red を確認し、PR body に種類だけを記録する。Final Reviewer はそのうち 1 種以上を独立に再注入する。
- 該当しない問い: mock 値（mock を使わない）、invalidate / refetch、JSON の安全整数、browser state、dry-run、出力順以外の state token、legacy の state-only / 三点一致（github mode のため）。

## Residual Test Gaps

- 実物 6 本に現れない形式（訂正・取消・値引き・番号印字・点検・クレジット・小数数量）は、合成の「未知の形」で復元不能に倒れることだけを確かめる。実物の形状は訪店時の採取まで不明で、その間は実運用で復元不能の取引が出うる（fail-closed であり、誤った明細は返らない）。
- 番号の採番規則・精算票の Z 番号の意味・file の分割規則は IO で扱わない（次の design lane）。
- T-R1 の実物確認は Coordinator の手元でだけ実行でき、CI では実行しない。結果は PR body の件数だけが証跡になる。
