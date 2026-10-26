# Test Design Matrix: 日報の紙の runtime

Plan Packet: [2026-10-27-daily-report-sheet-runtime](../2026-10-27-daily-report-sheet-runtime.md)。設計 lane の Matrix（`docs/archive/plans/test-matrices/2026-10-17-daily-report-sheet-design.md`）の行を、D-142（支払集計の D2 を BIZ の 1 つの関数へ、parser の上限）に合わせて写し直した。新しい test の名前は Writer が既存の命名（`_req401` / `_req501` の接尾、`(UI-09a)` の括弧）に揃えて直してよいが、`Would fail if...` の入力と期待は変えない。

## Risk

Risk: R3

## Contracts Under Test

- SALES-SHEET-D1〜D6（[34](../../function-design/34-biz-sales-service.md) §19.3a）
- 34 §19.3 手順 3（画面の支払集計: IO が足さずに返した行に BIZ-05 が紙と同じ D2 の関数を当てる、互換の範囲、warning）
- 24 §14.21 手順 3・§14.21a・§14.21b（[24](../../function-design/24-io-csv-import-repo.md)）
- CMD `get_daily_report_sheet`（[42](../../function-design/42-cmd-sales-stocktake.md) §22.4・§22.8）
- IO-07-D4a・IO-07-D6（[29](../../function-design/29-io-daily-report-parser.md)）、[10](../../function-design/10-common-rules.md) の「入力の上限と安全な整数の範囲」の (a) の表の行と (e)
- UI-09a-D16・D17・D18（[56](../../function-design/56-ui-daily-sales.md)）、UI_TECH_STACK §6.5.5

## Failure Modes

- 同じ日の 2 取込みを足さず精算ごとの紙になる、取り消した取込みが入る（D1）。
- 並び順だけ・名称だけで足す、行がずれ同じ名称の行がある帳票を組で足す、名称が空の行を同じ名称に数える、`import_seq` を行のある取込みだけで数える（D2）。
- NULL を 0 として足す、NULL より先に溢れを見る、足す順を取込みの id の昇順から変える、個数を倍精度で足す（D2 の足す値）。
- 画面の支払集計と紙で足し方が食い違う、D2 の実装が 2 つある（34 §19.3 手順 3、D-142 の (4)）。
- IO の支払の行を BIZ へ移すときに、互換の範囲の日の行・値・並び・代表が変わる、既存の test の期待を弱める（S2）。
- 名称の空の枠（値 0）を載せる、名称が空で値のある行を落とす（D3）。手動販売の行・0 の行が PLU に出る、取り込んでいない日を「売れなかった」と出す（D4）。溢れで一部だけの紙を返す（D5）。
- `credit` の規則を外すときに `cash`・`gross_sales`・`net_sales` の鍵も変わる（D4a）。
- 上限を越える数を受ける、上限ちょうどを拒む、上限の越えを形の誤りの文で出す、個数と金額で上限を取り違える（IO-07-D6）。
- 画面か紙の片方にだけ範囲の検査を置き、同じ値を片方は出し片方は error にする（10 の (e)、D-142）。
- 2 回以上の日の文・注記の見出しが「合算」「部門確認」のままで足さない日の事実と合わない、名称か並びの変わった日に画面が黙る、同じ `payment_key` の 2 行で行の key が重なる（UI-09a-D16）。
- 印刷ボタンが取込みの無い日に押せる、押せない理由が Tooltip だけ、読込みの失敗に `再試行` が無い、古い内容で印刷する、読み直しの失敗・0 件でも印刷する（D17・D6）。
- 紙の文字が 9 pt を割る、色を使う、画面に紙が出る、印刷にアプリの枠が出る（D17・D18）。

## Test Matrix

oracle（期待値）は 34・56・29・10 の正本の文と数から転記し、production の定数（`MAX_DAILY_REPORT_*`、文言）を import しない。文字列の anchor は 56・34・29 の完全一致の文。mutation は production 側だけを変える。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SALES-SHEET-D1 | 精算ごとの紙 | integration（実 DB、`sales_service.rs` の test） | `test_daily_report_sheet_sums_all_completed_imports_of_the_day` | 同じ日の合成の束 2 つ（総売の金額 1000 と 500）を取り込んだ日に、総売の行が 1 行で 1500 にならない。`import_count` が 2 でない |
| SALES-SHEET-D1・D6 | 取消した取込みが入る | integration | `test_daily_report_sheet_excludes_rolled_back_import` | 2 取込みの片方を取り消した後に、取り消した側の値が足される |
| SALES-SHEET-D2 | 名称の差し替えの日 | unit（BIZ の D2 の関数） | `test_sheet_rows_keep_same_position_different_label_separate` | 位置 4 の名称が取込み 1 で `項目A`（金額 10）、取込み 2 で `項目B`（金額 20）のとき、結果が `(4, 項目A, 10)` と `(4, 項目B, 20)` の 2 行でない。場合が 2（`LabelChanged`）でない |
| SALES-SHEET-D2 | 行が 1 つずれた日 | unit | `test_sheet_rows_split_by_position_when_rows_shift` | 取込み 1 が `(15, 項目A, 10)`・`(16, 項目B, 20)`、取込み 2 が `(15, 項目X, 5)`・`(16, 項目A, 30)`・`(17, 項目B, 40)` のとき、結果が `(15, 項目A, 10)`・`(15, 項目X, 5)`・`(16, 項目B, 20)`・`(16, 項目A, 30)`・`(17, 項目B, 40)` の 5 行（この順）でない、場合が 2 でない、`import_seq` が `None` でない |
| SALES-SHEET-D2 | 行がずれ 1 本の中に同じ名称（D2 の 3） | unit | `test_sheet_rows_unsummed_when_rows_shift_with_duplicate_label` | 取込み 1 が `(1, 項目A, 10)`・`(2, 項目A, 20)`、取込み 2 が `(1, 項目X, 5)`・`(2, 項目A, 30)`・`(3, 項目A, 40)` のとき、結果が `import_seq` 1 の `(1, 項目A, 10)`・`(2, 項目A, 20)` と `import_seq` 2 の `(1, 項目X, 5)`・`(2, 項目A, 30)`・`(3, 項目A, 40)` の 5 行（この順）でない（位置 2 が 50 の行が出る）、場合が 3（`Unsummed`）でない |
| SALES-SHEET-D2 | 紙の帳票ごとの場合 | integration（実 DB） | `test_daily_report_sheet_unsummed_only_for_shifted_source` | 上の行の Z002 の 2 取込みと、組の集合が同じ Z001（`(1, 総売, 100)` を 2 回）の日に、`unsummed_sources` が `[Z002]` でない、`label_changed_sources` が `[Z002]` でない、Z001 の行が `(1, 総売, 200)` の 1 行（`import_seq` が `None`）でない |
| SALES-SHEET-D2 | `import_seq` は `import_ids` の位置 | unit | `test_sheet_rows_import_seq_follows_import_ids` | `import_ids` が `[11, 12, 13]` で、取込み 11 の `(1, 項目A, 10)`・`(2, 項目A, 20)` と取込み 13 の `(1, 項目X, 5)`・`(2, 項目A, 30)`・`(3, 項目A, 40)` だけのとき、取込み 13 の行の `import_seq` が 3 でない（2 になる） |
| SALES-SHEET-D2 | 名称が空の同じ行は 3 にしない | unit | `test_sheet_rows_blank_labels_do_not_trigger_unsummed` | 取込み 1 が `(1, 項目A, 10)`・`(2, "", 0)`・`(3, "", 0)`、取込み 2 が `(1, 項目X, 5)`・`(2, 項目A, 30)`・`(3, "", 0)`・`(4, "", 0)` のとき、場合が 3 になる、または 2 でない、または `(1, 項目A, 10)`・`(1, 項目X, 5)`・`(2, 項目A, 30)` が組ごとの行として出ない |
| SALES-SHEET-D2 | 組の集合が同じ日 | unit | `test_sheet_rows_no_notice_when_label_sets_match` | 2 取込みの組の集合が同じ日に場合が 1（`Summed`）でない、または各行の金額が 2 取込みの和でない |
| SALES-SHEET-D2 | 名称だけで足す | unit | `test_sheet_rows_do_not_merge_same_label_at_different_positions` | 1 本の中の位置 7（金額 10）と位置 33（金額 20）の同じ名称の 2 行が、2 取込みで `(7, 名称, 20)`・`(33, 名称, 40)` の 2 行にならない。場合が 1 でない |
| SALES-SHEET-D2 | NULL を 0 として足す | unit | `test_sheet_rows_propagate_null` | 片方の取込みで金額が NULL の組が NULL でなく、もう片方の値になる |
| SALES-SHEET-D2 | 個数の誤差 | unit | `test_sheet_rows_sum_quantity_in_hundredths` | 総売の個数 130 と 200（100 倍の整数）の和が `3.3` でない |
| SALES-SHEET-D2 | 並び | unit | `test_sheet_rows_order_by_position_then_first_seen_import` | 取込み 1（古い）の位置 2 が `項目B`（金額 1）、取込み 2 の位置 2 が `項目A`（金額 2）・位置 1 が `項目C`（金額 3）のとき、結果が `(1, 項目C, 3)`・`(2, 項目B, 1)`・`(2, 項目A, 2)` の順と値でない |
| SALES-SHEET-D2・D5 | 溢れ | unit | `test_sheet_rows_overflow_is_validation_failed` | 金額 `i64::MAX` と `1` の組で `ValidationFailed`（文 `売上集計の計算でオーバーフローが発生しました`）にならない |
| SALES-SHEET-D2・D5 | 足す順 | unit | `test_sheet_rows_add_in_import_id_order` | `import_ids` が `[13, 12, 11]`（取込みの時刻が id の逆）で、組の金額が取込み 11 `i64::MAX`・12 `1`・13 `-i64::MAX` のとき `ValidationFailed` にならない（並べ替えて `1` を返す） |
| SALES-SHEET-D2 | NULL と溢れの優先 | unit | `test_sheet_rows_null_wins_over_overflow` | 組の金額が取込みの id の順に `i64::MAX`・`1`・NULL のとき NULL にならない。同じ組の件数が `1`・`1`・`1` のとき `3` でない |
| SALES-SHEET-D3 | 名称の空の行 | unit | `test_sheet_rows_drop_blank_label_zero_rows_only` | 名称が空で値が 0 の行が残る、または名称が空で金額 5 の行が落ちる |
| SALES-SHEET-D4 | PLU の部分の選び方 | integration | `test_daily_report_sheet_plu_rows_are_auto_nonzero_only` | 手動販売の行、または Z004 の数量・金額とも 0 の行が `plu_rows` に入る |
| SALES-SHEET-D4・24 §14.21b | 取り込んでいない日・数え方 | integration | `test_daily_report_sheet_plu_import_counts` | Z004 の取込みが無い日に `plu_import` が `(0, 0)` でない。`completed_partial` の取込みの `skipped_count` が和に入らない。`rolled_back` の取込みが数に入る |
| SALES-SHEET-D5 | 空の日 | integration | `test_daily_report_sheet_empty_day_returns_zero_imports` | 取込みの無い日に error になる、または行が空でない |
| SALES-SHEET-D5 | 日付の誤り | unit | `test_daily_report_sheet_rejects_invalid_date` | `2026-02-30` で §19.3 と同じ文言の `ValidationFailed` にならない |
| 24 §14.21a | 読む範囲 | integration（`sales_repo.rs` の test） | `test_get_daily_report_sheet_lines_reads_completed_only_in_order` | `rolled_back` の親の行を読む。`import_ids` が completed の親の `id` を `imported_at ASC, id ASC` で持たない（行の無い completed の親が落ちる）。帳票・取込み・位置の順に並ばない。保存した `label` の前後の空白（`  項目A `）が除かれる。NULL が 0 になる。Z005 の `label` が `raw_department_name` でなく `normalized_department_name` になる（2 つを違う値にした fixture） |
| 24 §14.21 手順 3 | IO は支払を足さない | integration（`sales_repo.rs` の test） | `test_completed_daily_report_aggregate_req501_payment_lines_unsummed_in_order` | 同じ日の 2 取込みで同じ位置・名称の支払の行が 1 行に足されて返る。行が親の `imported_at ASC, id ASC`・行の `sort_order ASC, id ASC` で並ばない。行に親の id・行の id・`sort_order`・`payment_key` が無い |
| 34 §19.3 手順 3 | 互換の範囲の日 | integration（`sales_service.rs` の test） | `test_daily_sales_payment_unchanged_when_labels_stable` | 組の集合が同じで 1 取込みの中に同じ `payment_key` が無い 2 取込み（`(1, 現金, cash, 金額 100・件数 2)`・`(2, 項目B, payment_2, 金額 30・件数 1)` を 2 回）で、`payment_lines` が `(cash, 現金, 200, 4)`・`(payment_2, 項目B, 60, 2)` の 2 行（行ごとに 4 つの field を assert）でない。`warnings` に支払の文が出る |
| 34 §19.3 手順 3 | 1 取込みの中に同じ `payment_key` の 2 行 | integration | `test_daily_sales_payment_splits_duplicate_payment_key_by_position` | 位置 1 と 2 の名称がどちらも `現金`（`payment_key` はどちらも `cash`、金額 10・20）の取込みを 2 回入れたとき、`(cash, 現金, 20)` と `(cash, 現金, 40)` の 2 行でない |
| 34 §19.3 手順 3 | 同じ組の保存済みの `payment_key` が取込みで違う日 | integration | `test_daily_sales_payment_merges_pair_with_mixed_stored_payment_key` | 位置 1・名称 `項目C` を取込み 1 は `credit`（金額 10）、取込み 2 は `payment_1`（金額 20）で保存した日に、`(credit, 項目C, 30)` の 1 行でない（代表は取込み 1 の行） |
| 34 §19.3 手順 3・SALES-SHEET-D2 | 紙と画面が同じ規則（D2 の 3） | integration（紙の test と同じ fixture） | `test_daily_sales_payment_unsummed_matches_sheet_rule` | `test_daily_report_sheet_unsummed_only_for_shifted_source` と同じ Z002 の 2 取込みの日に、`payment_lines` が取込みの古い順の 5 行（`項目A 10`・`項目A 20`・`項目X 5`・`項目A 30`・`項目A 40`）でない、`warnings` に 34 §19.3 手順 3 の 3 の文が 1 件無い、2 の文も出る |
| 34 §19.3 手順 3 | 名称か並びが変わった日の warning（D2 の 2） | integration | `test_daily_sales_payment_label_changed_warns` | 同じ位置で名称の違う 2 取込み（`項目A` 10、`項目B` 20）の日に、`payment_lines` が `(項目A, 10)`・`(項目B, 20)` の 2 行でない、`warnings` に 2 の文が 1 件でない、3 の文が出る |
| 34 §19.3 手順 3 | 足す順・溢れ・NULL（画面） | integration | `test_daily_sales_payment_overflow_and_null_order` | 位置 1・`現金` の組の金額が取込みの id の順に `i64::MAX`・`1`・`-i64::MAX`（`imported_at` を id の逆にした日）で `get_daily_sales` が `ValidationFailed` にならない。金額が `i64::MAX`・`1`・NULL、件数が `1`・`1`・`1` の日に、その組の金額が NULL・件数 `3` の 1 行でない |
| 34 §19.3 手順 3 | 実装が 1 つ | source の検査（`sales_service.rs` の test。`include_str!` で source を読む） | `test_payment_and_sheet_share_one_d2_function` | `sales_repo.rs` に支払の group 化の code（`payment_key` で `BTreeMap` に入れる集約）が残る、または `get_daily_sales` の支払と `get_daily_report_sheet` が D2 の関数を別々に持つ（Writer が関数名を決めた後に、その関数を呼ぶ所が 2 つ〈画面の支払と紙〉以上あることと、`sales_repo.rs` に `PaymentGroup` が無いことを確かめる） |
| IO-07-D4a | `credit` の規則を外す | unit（`daily_report_parser.rs` の test） | `test_payment_key_has_no_credit_rule` | 全角の `クレジット` を含む名称の行の `payment_key` が `credit` になる（並び順の `payment_N` でない）。`現金` の行が `cash` でない。総売・純売の `line_key` が変わる |
| IO-07-D6 | 上限ちょうどを受ける | unit | `test_parse_daily_report_req401_accepts_limit_values` | Z001 の金額 `9999999999`・`-9999999999`、Z002 の件数 `9999999999`、Z005 の個数 `9999999.99`（100 倍で `999999999`）の束が誤り無しで読めない |
| IO-07-D6 | 1 越えると列を名指して拒む | unit | `test_parse_daily_report_req401_rejects_over_limit_with_column` | Z001 の金額 `10000000000` の束で、誤りが `invalid_number` で文が `Z001の金額列の値が大きすぎます` でない。Z005 の個数 `10000000.00` で `Z005の個数列の値が大きすぎます` でない。Z002 の件数 `-10000000000` で `Z002の件数列の値が大きすぎます` でない（列の語は今の「変換できません」の文と同じ語で、Writer が今の文から転記する） |
| IO-07-D6 | 形の誤りの文は今のまま | unit（既存） | `test_parse_daily_report_req401_invalid_number`（既存。`rg -n 'fn test_parse_daily_report_req401_invalid_number' src-tauri/src/io/daily_report_parser.rs` で在ることを 2026-10-27 に確かめた） | 形の誤り（`abc`）の文が `…を変換できません` でなくなる |
| 10 (e)・D-142 | 範囲の検査を置かない | integration | `test_daily_sales_and_sheet_return_same_large_values` | 上限の中の大きな値（Z001 の総売の金額 `9999999999` の取込み 2 本）の日に、`get_daily_sales` の `gross_amount` と `get_daily_report_sheet` の総売の行の金額がどちらも `19999999998` でない（どちらかが error・欠ける） |
| CMD | 登録・呼出し | drift / bindings / command test | `scripts/check-command-drift.sh`、bindings の clean diff、`test_get_daily_report_sheet_cmd_passes_sheet_req401`（`sales_cmd.rs`。既存の `test_get_daily_sales_cmd_passes_official_report_req501` と同じ形） | `collect_commands!` か `generate_handler!` に無い、bindings が再生成されていない、command が BIZ の結果をそのまま返さない |
| UI-09a 支払集計の行の key | 同じ `payment_key` の 2 行 | component（`DailySalesPage.test.tsx`） | `DailySalesPage shows both payment rows with same payment_key (UI-09a)` | `cash` で `¥20`・`¥40` の 2 行が表に 2 行とも出ない。応答を `項目X ¥5（payment_1）`・`項目B ¥40（cash）` に更新して再描画した後に、表が 2 行で `¥5`・`¥40` でない（前の `¥20` が残る） |
| UI-09a-D16・REQ-401 | 足さない日の画面の文 | component | `DailySalesPage texts stay true on unsummed payment day (UI-09a)` | `source_import_count` 2 で `warnings` に 3 の文を入れた応答のとき、文が `総売上・純売上・支払集計・部門別集計は2回の取込みを合算しています（注記で足していないと示した表を除く）。日計（Z001）は取込みごとに表示します。` でない、注記の見出しが `日報の確認が必要です` でない、3 の文が注記に出ない |
| UI-09a-D17 | 押せない状態（0 件） | component（`ExportBar.test.tsx`） | `ExportBar disables print with reason when no imports (UI-09a)` | `import_count` 0 で `日報を印刷` が押せる、`この日のレジ日報は未取込みのため、印刷できません。` が文で出ない、リンク `売上データ取込みを開く` の行き先が `/csv-import` でない |
| UI-09a-D17 | 読込みの失敗と `再試行` | component | `print is skipped when refetch fails or no imports (UI-09a)` | 読み直しが失敗したとき、または応答が `import_count` 0 のときに `window.print` が呼ばれる。ボタンの下に CmdError の文か未取込みの文が出ない。失敗のときに `再試行` が出ない、押しても読み直さない（次の応答 `import_count` 1 で押せるようにならない） |
| UI-09a-D17・SALES-SHEET-D6 | 古い内容で印刷 | component | `print waits refetch and prints new values (UI-09a)` | 開いたときの総売 `100`、押した後の読み直しを遅らせて総売 `600` にしたとき、(a) 解決の前に `window.print` が呼ばれる、(b) `window.print` の spy の中で読んだ紙の DOM の総売が `600` でない、(c) 紙の印刷の時刻が押した時刻（fake timer）でない |
| UI-09a-D17 | 数えていない PLU の行 | component | `ExportBar shows skipped PLU rows with link (UI-09a)` | `skipped_count` 3 で `数えていない PLU の行が 3 行あります` とリンク `取込みの記録を開く` が出ない、行き先が `/inventory/records` で search が `recordType: "csv_import"`・`status: "active"`・`dateFrom` と `dateTo` がその日でない、ボタンが押せなくなる |
| UI-09a-D17 | 帳票ごとの画面の文 | component | `ExportBar shows label change notices per source (UI-09a)` | `label_changed_sources` `[Z002]`・`unsummed_sources` 空で `支払集計（Z002）：この日の精算の間で、帳票の行の名称か並びが変わっています。同じ名称の行が 2 行あれば、別々に足しています。` が 1 行出ない。両方 `[Z002]` で 3 の文でない、2 の文も出る。空のときに `：` の行が出る |
| UI-09a-D17 | 紙の文と表 | component（`DailyReportSheet.test.tsx`） | `DailyReportSheet renders tables, notices and no yen sign (UI-09a)` | 各表の `thead` の 1 行目が `日計（Z001）　2026年3月21日（土）` / `支払集計（Z002）　…` / `部門別集計（Z005）　…` / `PLU の売上（Z004）　…` の形でない、2 行目が列の見出しでない、2 の知らせが支払集計の見出しの下に出ない、`unsummed_sources` `[Z002]` で `import_seq` 1・2 の行が `支払集計（Z002）　1回目の取込み　2026年3月21日（土）` と `… 2回目の取込み …` の 2 つの表に分かれない、金額 `1234` が `1,234` でない（`¥` が付く）、名称が空の行が `（名前なし）` でない |
| UI-09a-D17 | 足さない日の紙の題 | component | `DailyReportSheet title on unsummed day (UI-09a)` | `import_count` 2・`unsummed_sources` `[Z002]` で `2回の取込みを合算（取込みごとに載せた帳票を除く）` が出ない、空のとき `2回の取込みを合算` でない |
| UI-09a-D17 | PLU の知らせ | component | `DailyReportSheet PLU notices by import state (UI-09a)` | `plu_import.import_count` 0 で `この日の PLU の売上は取り込まれていません。` が出ない、取込みがあって行が無い日に `この日に売れた PLU の商品はありません。` が出ない、`skipped_count` 3 で `数えていない PLU の行が 3 行あります（入出庫履歴の CSV取込みの記録で見られます）。` が出ない |
| UI-09a-D17・D18 | 画面に出さない・下限・印刷の CSS | component と literal（`DailyReportSheet.test.tsx`・`globals.test.ts`） | `DailyReportSheet is print-only and min 9pt (UI-09a)`、`globals.css declares A4 page and hides app root in print (UI-09a)` | 紙の root に画面で隠す class（`hidden print:block` 相当）が無い、紙が `document.body` の直下に無い、文字の大きさの class が 9 pt を割る。`globals.css` に `size: A4 portrait`・`margin: 10mm` と印刷のときに `#root` を隠す規則が無い |
| UI-09a-D17 | query key | unit（`query-keys.test.ts`） | `keeps dailyReportSheet keys under daily-sales root` | `queryKeys.dailyReportSheet("2026-07-23")` が `["daily-sales", "sheet", { date: "2026-07-23" }]` でない、`dailySalesRoot()` の prefix でない |

### 既存の test の移し方（S2。弱体化しない）

| 既存の test（`sales_repo.rs`） | IO に残す assert | BIZ へ移す assert（同じ fixture と値） |
|---|---|---|
| `test_completed_daily_report_aggregate_req501_all_active_parents` | 親の数・gross / net・部門、支払の行が足されずに並ぶこと | 支払の `payment_key` の並び（`old`・`cash`・`credit`）と値を `get_daily_sales` の `payment_lines` で |
| `test_get_completed_daily_report_aggregate_req501_propagates_parent_and_line_nulls` | 親と部門の NULL、支払の行の NULL がそのまま返ること | 支払の NULL の伝播を `get_daily_sales` で |
| `test_get_completed_daily_report_aggregate_req501_groups_identities_deterministically` | 部門の group の代表 | 支払の group の代表（最小 `sort_order`、同値なら最小の行 id）を `get_daily_sales` で |
| `test_get_completed_daily_report_aggregate_req501_aggregate_overflow_is_error` | gross / net・部門の溢れが `DbError::QueryFailed` | 支払の溢れを `get_daily_sales` の `ValidationFailed` で（D-142 の (4)。期待の種類だけが変わる） |

在ることは 2026-10-27 に `rg -n 'fn test_[a-z0-9_]*' -o src-tauri/src/db/sales_repo.rs` で確かめた。#172 の merge の後に同じ command で取り直す。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 紙の内容（query `["daily-sales", "sheet", { date }]`） | 日次売上を開くと読む | ボタン disabled | `import_count` 1 以上で押せる | 日報・Z004 の取込みと取消の成功（`dailySalesRoot()` の prefix） | 押したときに `await refetch()` | 日付を変えると別の key | アプリを開き直すと読み直す（保存しない） | ボタン disabled と CmdError の文 | `再試行` か日付を選び直す | component test、L3-1 |
| 印刷の dialog | — | dialog 表示中 | 印刷される | — | — | 何度でも印刷できる | — | dialog の取消は何も残さない | もう一度押す | L3-1 |
| 日報の束の上限（IO-07-D6） | 束を選ぶ | parser | 上限の中は今と同じ | — | — | — | — | `invalid_number` で取り込めない（何も書かない） | 正しい束を選び直す | parser の unit test |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 同じ日の取込みを足す（NULL の伝播、checked add） | `sales_repo.rs` の `sum_optional_strict`・`aggregate_overflow`、24 §14.21 手順 2・4・7、34 §19.3 | BIZ の D2 の関数（支払と紙） | gross / net・部門・月次（§14.22）は IO のまま | D2 の行 |
| 個数の 100 倍の整数（IO-07-D2） | 29 IO-07-D2、`quantity_hundredths_to_units` の呼ぶ所 | 紙の行 | — | `test_sheet_rows_sum_quantity_in_hundredths` |
| 日次売上の値の書き方（`toLocaleString`、`—`、負の数） | `DailySalesPage.tsx` の `formatMoney`・日計の表 | 紙の表 | 金額の `¥` だけ付けない（UI-09a-D17） | 紙の component test |
| 取込み・取消の後の invalidate | `src/lib/invalidation-contract.ts` の `dailySalesRoot()` の entry（`csvImportCommit`・`csvImportRollback`・`dailyReportImport`） | `dailyReportSheet` の key は root の prefix に乗る | `manualSale` は `dailySales(saleDate)` だけ（紙は手動販売を載せない） | query key の test |
| 押せない状態の表示と理由 | 日次・月次の `ExportBar.tsx` | 日次は理由を文で出す | 月次の印刷は disabled と Tooltip のまま（範囲外） | ExportBar の component test |
| 読込みの失敗の `再試行` | 56 §56.8 の当日の取得失敗の `再試行` | 紙の内容の読込みの失敗 | — | `print is skipped when refetch fails or no imports (UI-09a)` |
| parser の数の誤りの文 | `daily_report_parser.rs` の `invalid_number` の 6 か所の `match` | 上限の越えの文 | — | IO-07-D6 の行 |

## Negative Paths

- missing input: 取込みの無い日 → `import_count` 0、ボタン disabled と文とリンク。
- invalid input: 日付の誤り → `ValidationFailed`。上限を越える数の束 → `invalid_number`（列を名指す）。
- duplicate/ambiguous input: 同じ位置に 2 つの名称 → 別の行と知らせ。行がずれ同じ名称の行 → 足さずに取込みごと。同じ精算の二重の取込み（精算回数の読めない束）→ 二重に足す（D-120 の Guarantee range。test は固定しない）。
- unknown reference: 商品に当たらない Z004 の行 → `skipped_count` の文とリンク。
- dependency missing: Z004 を取り込んでいない日 → 「取り込まれていません」。
- permission/write failure: 不該当（書かない）。代わりの道を採るときだけ HTML の書込みの失敗（Gated Amendment で足す）。
- dry-run side effect: 読み取りだけで DB を変えない（`get_daily_report_sheet` の前後で表の行数が同じ。`test_daily_report_sheet_sums_all_completed_imports_of_the_day` に assert を 1 つ足す）。

## Boundary Checks

- threshold: 上限 `9999999999`・`999999999`（100 倍）のちょうどと 1 越え（IO-07-D6）。文字の大きさの下限 9 pt。
- null/default: NULL の伝播、`—` の表示。
- empty/non-empty: 取込み 0・行 0・PLU 0。
- min/max: `i64::MAX` の溢れと足す順（D2）。上限の負の端 `-9999999999`。
- status/policy enum: 日報は `completed` だけ、Z004 は `completed`・`completed_partial`。
- wire type: `DailyReportSheet` の number は i64 由来で、D-142 の上限の下で安全な整数の範囲（`test_daily_sales_and_sheet_return_same_large_values`）。
- internal type: 個数は 100 倍の `i64`。
- producer/consumer: BIZ が足し、UI は描くだけ（UI で足し算・並べ替え・絞り込みをしない）。
- round-trip token: 不該当。
- precision/range: 個数は小数 2 桁まで。
- cross-language parse: wire の number（Rust の i64 → JSON → TS の number）。上限の中の値で正確（上の large values の test が Rust の側、TS の側は ExportBar・紙の component test の値）。

## Compatibility Checks

- old schema/input: DB の列を変えない。既存の取込み（`payment_key` が `cash`・`payment_N`・`credit`）もそのまま足せる（鍵に使わない）。
- new schema/input: 上限を越える数の束は取り込めない（今は受ける）。
- output order: 支払集計は互換の範囲の日は今と同じ行・値・並び（NULL の前の和が溢れる値は NULL、NULL の無い和の溢れは error の種類が `ValidationFailed` に変わる。34 §19.3 手順 3）。
- optional field behavior: 既存の wire の DTO に field を足さない。

## Data Safety Checks

- source-derived data: test と fixture は合成の束だけ（名称は `項目A` の形）。
- generated outputs: 印刷の結果を commit しない。
- secrets: 不該当。
- local-only files: L3 の紙の写真、P8 の数えの出力。
- synthetic sample boundaries: `tests/fixtures/daily-report-sheet/` の README に合成であることと各 file の役を書く。

## Main Wiring / Integration Checks

- helper connected to main path: 日次売上 → `useDailyReportSheet` → `commands.getDailyReportSheet` → CMD → BIZ → IO。画面の支払集計 → `get_daily_sales` → D2 の関数。
- output reaches manifest/report: 紙の内容が `@media print` の印刷に出る（L3-1・L3-2）。
- effective config reaches runtime: `@page` の A4 縦と余白（L3-1）。
- CLI arg reaches implementation: 不該当。

## Manual（Human Gate の manual。L3）

L3 は本 PR が merge の train の先頭に来て、最新の `origin/main` を取り込んだ head で 1 回に頼む（D-124）。owner の操作は「PR の head の build を Windows で開き、Coordinator が渡す手順の順に fixture を取り込み、印刷して PASS / FAIL と記号で答える」の 1 回。

| 項目 | 到達経路 | 入力物 | 依存する既知の backlog | 確かめること（PASS の基準） |
|---|---|---|---|---|
| L3-1 印刷の手段（P1、UI-09a-D18） | Windows の build → 売上データ取込みで `tests/fixtures/daily-report-z001/` の `2026-03-24` の 2 束を順に取り込む → 日次売上（`/reports/daily`）で 2026-03-24 → `日報を印刷` | 作り直した空の DB と上の fixture | 無し | OS の印刷の dialog が出て、プレビューが A4 縦・余白 10 mm で、アプリのサイドバー・画面の部品が出ず紙の内容だけが出る。題の行に `2回の取込みを合算`。FAIL なら代わりの道の Gated Amendment（P1） |
| L3-2 紙の並びと字（O1、P5） | 同じ日に `tests/fixtures/daily-report-sheet/Z004_260324.CSV` を取り込み → `日報を印刷` → 実機のプリンタで印刷 | L3-1 の DB と Z004 の fixture | 無し | 既定の案 a の紙で、字が読めて（9 pt 以上）、2 枚目に続くなら 2 枚目の上に表の見出しの行と列の見出しが出て、2 段が段ごとに続き、PLU の下に `数えていない PLU の行が 1 行あります（…）。` が出る。読みにくければ b か c を名指す（O1） |
| L3-3 画面の文（UI-09a-D16・D17、O3） | `tests/fixtures/daily-report-sheet/` の `2026-03-25` の 2 束を取り込む → 日次売上で 2026-03-25 → 画面を見て `日報を印刷` | 同じ DB と fixture | 無し | 支払集計が足さずに 5 行で並び、注記の見出し `日報の確認が必要です` と 3 の文、2 回以上の日の文、ボタンの下の `支払集計（Z002）：…` の文が読めて意味が分かる。紙の支払集計が `1回目の取込み`・`2回目の取込み` の 2 つの表に分かれる。2 つの知らせが重いと思えば O3 の b を名指す |

L3 の前に Writer が `cargo check --release` を通す（`docs/DEV_WORKFLOW.md` Implementation Rules）。O2 の既定 a で、レジスターツールの日報との値の照合（P2）は本 L3 に入れず、UI-09a-D19 の (2) で行う。

## Mutation-style Adequacy Questions

- 足す鍵から名称を外したら: `test_sheet_rows_keep_same_position_different_label_separate`。位置を外したら: `test_sheet_rows_do_not_merge_same_label_at_different_positions` と `test_daily_sales_payment_splits_duplicate_payment_key_by_position`。
- 保存済みの `payment_key` を鍵に残したら: `test_daily_sales_payment_merges_pair_with_mixed_stored_payment_key`。
- NULL の伝播を外したら: `test_sheet_rows_propagate_null`。NULL より先に溢れを見たら: `test_sheet_rows_null_wins_over_overflow` と `test_daily_sales_payment_overflow_and_null_order`。
- 足す順を変えたら: `test_sheet_rows_add_in_import_id_order` と `test_daily_sales_payment_overflow_and_null_order`。
- D2 の 3 の条件を外したら: `test_sheet_rows_unsummed_when_rows_shift_with_duplicate_label` と `test_daily_sales_payment_unsummed_matches_sheet_rule`。空の名称を同じ名称に数えたら: `test_sheet_rows_blank_labels_do_not_trigger_unsummed`。
- `import_seq` を行のある取込みだけで数えたら: `test_sheet_rows_import_seq_follows_import_ids`。
- 画面の支払に別の足し方を書いたら（D2 を 2 つにしたら）: `test_payment_and_sheet_share_one_d2_function` と `test_daily_sales_payment_unsummed_matches_sheet_rule`。
- 2 の warning を外したら: `test_daily_sales_payment_label_changed_warns`。ボタンの下の文を外したら: `ExportBar shows label change notices per source (UI-09a)`。
- `status='completed'` を外したら: `test_daily_report_sheet_excludes_rolled_back_import` と `test_get_daily_report_sheet_lines_reads_completed_only_in_order`。PLU の `source='auto'` を外したら: `test_daily_report_sheet_plu_rows_are_auto_nonzero_only`。
- `credit` の分岐を戻したら: `test_payment_key_has_no_credit_rule`。
- 上限の比較を `>=` にしたら: `test_parse_daily_report_req401_accepts_limit_values`。上限の検査を外したら: `test_parse_daily_report_req401_rejects_over_limit_with_column`。金額と個数の上限を入れ替えたら: 同じ 2 本（Z005 の個数の端）。
- 紙か画面の片方に範囲の検査を足したら: `test_daily_sales_and_sheet_return_same_large_values`。
- 押したときの読み直しを外したら、待たずに印刷したら: `print waits refetch and prints new values (UI-09a)`。失敗・0 件の分岐を外したら: `print is skipped when refetch fails or no imports (UI-09a)`。押せない条件を反転したら: `ExportBar disables print with reason when no imports (UI-09a)`。
- 支払集計の行の key を `payment_key` だけに戻したら: `DailySalesPage shows both payment rows with same payment_key (UI-09a)` の更新の後の確かめ。

## Residual Test Gaps

- 実機のプリンタの見え方・字の読みやすさ・1 枚に収まるかは自動 test に乗らない（L3-2）。
- WebView2 の印刷の dialog と `@page` の効きは自動 test に乗らない（L3-1。`window.print` の呼出しは spy で確かめる）。
- レジスターツールの日報との値の一致は実際の日でしか確かめられない（O2 の既定で UI-09a-D19 の (2)）。
- 実データの数の最大の桁（P8）は repo の外で数える。
