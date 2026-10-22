# Test Design Matrix: 日報の紙（1 日 1 枚）と日報の意味づけ

Plan Packet: [2026-10-17-daily-report-sheet-design](../2026-10-17-daily-report-sheet-design.md)。本 lane は docs だけで、下の test は後続の「日報の紙の runtime」の lane が実装する（本 lane が走らせるのは AC12 の docs の検査だけ）。既存の test を引くときは、runtime の lane の起票の時に `rg` で在ることを確かめ直す。

## Risk

Risk: R3

## Contracts Under Test

- SALES-SHEET-D1〜D6（[34](../../../function-design/34-biz-sales-service.md) §19.3a）
- 24 §14.21 手順 3（支払の合算の鍵）、§14.21a・§14.21b（[24](../../../function-design/24-io-csv-import-repo.md)）
- CMD `get_daily_report_sheet`（[42](../../../function-design/42-cmd-sales-stocktake.md)）
- IO-07-D4a（[29](../../../function-design/29-io-daily-report-parser.md)）
- UI-09a-D17・D18・D19（[56](../../../function-design/56-ui-daily-sales.md)）、UI_TECH_STACK §6.5.5

## Failure Modes

- 同じ日の 2 取込みを足さず、精算ごとの紙になる（D1）。
- 並び順だけで足し、名称の差し替えの日に別の行を足す。名称だけで足し、1 本の中の完全一致の同じ名称の行をまとめる。行の数か並びが変わった日に知らせが出ない（D2）。
- 行がずれ、1 本の中に同じ名称の行がある帳票を位置と名称の組で足し、ずれた位置で別の項目を足す。名称が空の行も同じ名称に数え、Z002 を毎回足さない側へ倒す（D2 の 3）。紙と画面の支払集計で足すかどうかが食い違う（D2、24 §14.21 手順 3）。
- NULL を 0 として足し、未取得を 0 に見せる（D2）。NULL のある値で途中の溢れを先に見て error にする。足す順を取込みの id の昇順から変え、互換の範囲の日に今は error の値を返す（D2 の足す値）。
- 個数を倍精度で足して誤差が出る（D2、IO-07-D2）。
- 名称の空の枠（値 0）を載せる、または名称が空で値のある行を落とす（D3）。
- 手動販売の行や数量・金額とも 0 の行が PLU の部分に出る。取り込んでいない日を「売れなかった」と出す（D4）。
- 溢れで一部だけの紙を返す（D5）。取消した取込みが紙に入る（D1・D6）。
- 支払集計の鍵の変更で、互換の範囲（24 §14.21 手順 3）の日の値や行が変わる。範囲の外の日（1 取込みの中に同じ `payment_key` の行がある日、同じ組の保存済みの `payment_key` が取込みで違う日）が新しい規則の値にならない。同じ `payment_key` の 2 行で画面の行の key が重なり、1 行が消える（14.21、UI-09a）。
- `credit` の規則を外すときに、`cash`・`gross_sales`・`net_sales` の鍵も変わる（D4a）。
- 支払集計を足さない日（D2 の 3）に、画面の 2 回以上の日の文・warning の注記の見出し・紙の題が「合算」「部門確認」のままで事実と合わない（UI-09a-D16・D17）。名称か並びが変わった日（D2 の 2）に、紙は知らせるが画面の支払集計は黙って通す（34 §19.3 手順 3）。印刷ボタンの下に帳票ごとの知らせが出ない（D17）。
- `import_seq` を、その帳票の行がある取込みだけで数え、行の無い取込みを飛ばして番号がずれる（D2 の 3、24 §14.21a）。
- 印刷ボタンが取込みの無い日に押せる、押せない理由が Tooltip だけ（D17）。紙の内容の読込みに失敗した後、日付を選び直す以外に読み直せない（D17）。
- 紙の上の文字が 9 pt を割る、色を使う、画面に紙の内容が出る（D17）。
- 印刷を押したときに古い内容で印刷する。読み直しの失敗・`import_count` 0 でも印刷する（D6・D17）。
- 代わりの道で HTML の書込みか `open_path` が失敗したのに成功と扱う。名称を escape せずに HTML に入れる（D18）。

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SALES-SHEET-D1 | 精算ごとの紙 | integration（実 DB、`sales_service.rs` の test） | `test_daily_report_sheet_sums_all_completed_imports_of_the_day` | 同じ日の合成の束 2 つ（総売の金額 1000 と 500）を取り込んだ日に、総売の行が 1 行で 1500 にならない。`import_count` が 2 でない |
| SALES-SHEET-D1・D6 | 取消した取込みが入る | integration | `test_daily_report_sheet_excludes_rolled_back_import` | 2 取込みの片方を取り消した後に、取り消した側の値が足される |
| SALES-SHEET-D2 | 名称の差し替えの日に別の行を足す | unit（BIZ の足し算の関数） | `test_sheet_rows_keep_same_position_different_label_separate` | 位置 4 の名称が取込み 1 で `項目A`（金額 10）、取込み 2 で `項目B`（金額 20）のとき、結果が `(4, 項目A, 10)` と `(4, 項目B, 20)` の 2 行にならない。`label_changed_sources` が `[Z002]` でない |
| SALES-SHEET-D2 | 行が 1 つずれた日 | unit | `test_sheet_rows_split_by_position_when_rows_shift` | 取込み 1 が `(15, 項目A, 10)`・`(16, 項目B, 20)`、取込み 2 が `(15, 項目X, 5)`・`(16, 項目A, 30)`・`(17, 項目B, 40)` のとき、結果が `(15, 項目A, 10)`・`(15, 項目X, 5)`・`(16, 項目B, 20)`・`(16, 項目A, 30)`・`(17, 項目B, 40)` の 5 行（並びもこの順）にならない。`label_changed_sources` にその帳票が入らない。`unsummed_sources` が空でない、または行の `import_seq` が `None` でない |
| SALES-SHEET-D2 | 行がずれ、1 本の中に同じ名称の行がある日（D2 の 3） | unit | `test_sheet_rows_unsummed_when_rows_shift_with_duplicate_label` | Z002 の取込み 1 が `(1, 項目A, 10)`・`(2, 項目A, 20)`、取込み 2 が `(1, 項目X, 5)`・`(2, 項目A, 30)`・`(3, 項目A, 40)`、Z001 は 2 取込みで組の集合が同じ（`(1, 総売, 100)` を 2 回）のとき、`payment_rows` が `(import_seq 1: (1, 項目A, 10), (2, 項目A, 20))`・`(import_seq 2: (1, 項目X, 5), (2, 項目A, 30), (3, 項目A, 40))` の 5 行（並びもこの順）にならない（位置 2 が 50 の行が出る）。`unsummed_sources` が `[Z002]` でない、`label_changed_sources` に Z002 が無い。Z001 の行が `(1, 総売, 200)` の 1 行（`import_seq` が `None`）でない |
| SALES-SHEET-D2 | `import_seq` は取込みの id の並びの位置 | unit | `test_sheet_rows_import_seq_follows_import_ids` | `import_ids` が `[11, 12, 13]` で、Z002 の行が取込み 11 の `(1, 項目A, 10)`・`(2, 項目A, 20)` と取込み 13 の `(1, 項目X, 5)`・`(2, 項目A, 30)`・`(3, 項目A, 40)` だけ（取込み 12 に Z002 の行が無い）のとき、取込み 13 の行の `import_seq` が 3 でない（2 になる）、または `import_count` が 3 でない |
| SALES-SHEET-D2 | 名称が空の同じ行は 3 にしない | unit | `test_sheet_rows_blank_labels_do_not_trigger_unsummed` | 取込み 1 が `(1, 項目A, 10)`・`(2, "", 0)`・`(3, "", 0)`、取込み 2 が `(1, 項目X, 5)`・`(2, 項目A, 30)`・`(3, "", 0)`・`(4, "", 0)` のとき、`unsummed_sources` が空でない（名称が空の行を同じ名称に数えた）、または `label_changed_sources` にその帳票が無い、または `(1, 項目A, 10)`・`(1, 項目X, 5)`・`(2, 項目A, 30)` が組ごとの行として出ない |
| SALES-SHEET-D2 | 組の集合が同じ日の知らせ | unit | `test_sheet_rows_no_notice_when_label_sets_match` | 2 取込みの位置と名称の組の集合が同じ日に `label_changed_sources` が空でない、または各行の金額が 2 取込みの和でない |
| SALES-SHEET-D2 | 名称だけで足す | unit | `test_sheet_rows_do_not_merge_same_label_at_different_positions` | 1 本の中の位置 7（金額 10）と位置 33（金額 20）の完全一致の同じ名称の 2 行が、2 取込みで足して `(7, 名称, 20)`・`(33, 名称, 40)` の 2 行にならない。組の集合が同じなので `unsummed_sources` が空でない |
| SALES-SHEET-D2 | NULL を 0 として足す | unit | `test_sheet_rows_propagate_null` | 片方の取込みで金額が NULL の組が NULL でなく、もう片方の値になる |
| SALES-SHEET-D2 | 個数の誤差 | unit | `test_sheet_rows_sum_quantity_in_hundredths` | 総売の個数 130 と 200（100 倍の整数）の和が `3.3` でない |
| SALES-SHEET-D2 | 並び | unit | `test_sheet_rows_order_by_position_then_first_seen_import` | 取込み 1（古い）の位置 2 が `項目B`（金額 1）、取込み 2 の位置 2 が `項目A`（金額 2）・位置 1 が `項目C`（金額 3）のとき、結果の行の (位置, 名称, 金額) が `(1, 項目C, 3)`・`(2, 項目B, 1)`・`(2, 項目A, 2)` の順と値にならない |
| SALES-SHEET-D2・D5 | 溢れ | unit | `test_sheet_rows_overflow_is_validation_failed` | 金額 `i64::MAX` と `1` の組で `ValidationFailed` にならず、紙の内容を返す |
| SALES-SHEET-D2・D5 | 足す順で成否が変わる | unit | `test_sheet_rows_add_in_import_id_order` | `import_ids` が `[13, 12, 11]`（取込みの時刻が id の逆の日）で、組の金額が取込み 11 `i64::MAX`・12 `1`・13 `-i64::MAX` のとき、`ValidationFailed` にならない（`import_ids` の順か値の並べ替えで足して `1` を返す） |
| SALES-SHEET-D2 | NULL と溢れの優先 | unit | `test_sheet_rows_null_wins_over_overflow` | 組の金額が取込みの id の順に `i64::MAX`・`1`・NULL のとき、その組の金額が NULL にならない（`ValidationFailed` になる）。同じ組の件数が `1`・`1`・`1`（NULL 無し）のとき件数が `3` でない（値ごとに決めていない） |
| SALES-SHEET-D3 | 名称の空の行 | unit | `test_sheet_rows_drop_blank_label_zero_rows_only` | 名称が空で値が 0 の行が残る、または名称が空で金額 5 の行が落ちる |
| SALES-SHEET-D4 | PLU の部分の選び方 | integration | `test_daily_report_sheet_plu_rows_are_auto_nonzero_only` | 手動販売の行、または Z004 の数量・金額とも 0 の行が `plu_rows` に入る |
| SALES-SHEET-D4 | 取り込んでいない日 | integration | `test_daily_report_sheet_plu_import_counts` | Z004 の取込みが無い日に `plu_import.import_count` が 0 でない。`completed_partial` の取込みの `skipped_count` が和に入らない。`rolled_back` の取込みが数に入る |
| SALES-SHEET-D5 | 空の日 | integration | `test_daily_report_sheet_empty_day_returns_zero_imports` | 取込みの無い日に error になる、または行が空でない |
| SALES-SHEET-D5 | 日付の誤り | unit | `test_daily_report_sheet_rejects_invalid_date` | `2026-02-30` で §19.3 と同じ文言の `ValidationFailed` にならない |
| 24 §14.21a | 読む範囲 | integration（`sales_repo.rs` の test） | `test_get_daily_report_sheet_lines_reads_completed_only_in_order` | `rolled_back` の親の行を読む。`import_ids` が completed の親の `id` を `imported_at ASC, id ASC` の順に持たない（`rolled_back` の親の `id` が入る、行の無い completed の親の `id` が落ちる）。帳票・取込み・位置の順に並ばない。保存した `label` の前後の空白（`  項目A `）が除かれる。NULL の `amount`・`count` が 0 になる。Z005 の行の `label` が `raw_department_name` でなく `normalized_department_name` になる（2 つを違う値にした fixture） |
| 24 §14.21 手順 3 | 互換の範囲の日 | integration | `test_payment_aggregate_unchanged_when_labels_stable` | 位置と名称の組の集合が同じで 1 取込みの中に同じ `payment_key` が無い 2 取込み（`(1, 現金, cash, 金額 100・件数 2)`・`(2, 項目B, payment_2, 金額 30・件数 1)` を 2 回）で、返る行が `(cash, 現金, 200, 4)`・`(payment_2, 項目B, 60, 2)` の 2 行（行ごとに `payment_key`・`label`・`amount`・`count` を assert）にならない |
| 24 §14.21 手順 3 | 1 取込みの中に同じ `payment_key` の 2 行 | integration | `test_payment_aggregate_splits_duplicate_payment_key_by_position` | 位置 1 と位置 2 の名称がどちらも `現金`（`payment_key` はどちらも `cash`、金額 10・20）の取込みを 2 回入れたとき、結果が `(cash, 現金, 20)` と `(cash, 現金, 40)` の 2 行にならない（今の実装は 1 行 60。新しい規則の期待値。組の集合が同じ日なので足す側〈D2 の 1〉） |
| 24 §14.21 手順 3 | 同じ組の保存済みの `payment_key` が取込みで違う日（互換の範囲の外） | integration | `test_payment_aggregate_merges_pair_with_mixed_stored_payment_key` | 位置 1・名称 `項目C` の行を、取込み 1 は `payment_key` `credit`（金額 10）、取込み 2 は `payment_1`（金額 20）で保存した日に、結果が `(credit, 項目C, 30)` の 1 行にならない（今の実装は `credit` 10 と `payment_1` 20 の 2 行。新しい規則の期待値。`payment_key` は手順 5 の代表の行〈取込み 1 の行〉の保存値） |
| 24 §14.21 手順 3・34 §19.3 手順 3 | 紙と画面の食い違い（D2 の 3） | integration（実 DB、`sales_service.rs` の test。紙の test と同じ fixture） | `test_daily_sales_payment_unsummed_matches_sheet_rule` | `test_sheet_rows_unsummed_when_rows_shift_with_duplicate_label` と同じ Z002 の 2 取込みを入れた日に、`get_daily_sales` の `payment_lines` が取込みの古い順の 5 行（`label`・`amount` の順が `項目A 10`・`項目A 20`・`項目X 5`・`項目A 30`・`項目A 40`）でない（位置 2 が 50 の行が出る）、`warnings` に `支払集計（Z002）は、この日の精算の間で行の名称か並びが変わり、1 回の精算の中に同じ名称の行が 2 行以上あるため、足さずに取込みの古い順に並べています。紙（日報を印刷）で取込みごとに見られます` が 1 件無い、または D2 の 2 の文も出る。組の集合が同じ日（上の互換の範囲の test の fixture）にこの warning が出る |
| 24 §14.21 手順 3 | 足す順（互換の範囲） | integration | `test_payment_aggregate_adds_in_import_id_order` | Z002 の位置 1・名称 `現金` の組の金額が取込みの id の順に `i64::MAX`・`1`・`-i64::MAX` の 3 取込みで、`imported_at` を id の逆にした日に、`get_completed_daily_report_aggregate` が `DbError::QueryFailed` にならない（今の実装も error。足す順を変えた回帰） |
| 24 §14.21 手順 3 | NULL と溢れの優先（互換の範囲の例外） | integration | `test_payment_aggregate_null_wins_over_overflow` | 同じ組の金額が取込みの id の順に `i64::MAX`・`1`・NULL、件数が `1`・`1`・`1` の日に、結果がその組の金額 NULL・件数 `3` の 1 行にならない（`DbError::QueryFailed` になる。今の実装は error。新しい規則の期待値） |
| 34 §19.3 手順 3 | 名称か並びが変わった日の画面の知らせ（D2 の 2） | integration（`sales_service.rs` の test） | `test_daily_sales_payment_label_changed_warns` | 同じ位置で名称の違う 2 取込み（`項目A` 金額 10、`項目B` 金額 20）の日に、`get_daily_sales` の `warnings` に `支払集計（Z002）は、この日の精算の間で行の名称か並びが変わっています。同じ名称の行が 2 行あれば、別々に足しています` が 1 件でない、または D2 の 3 の文が出る。組の集合が同じ日にこの文が出る |
| 24 §14.21 手順 3 | 名称の差し替えの日 | integration | `test_payment_aggregate_splits_rows_when_label_changes` | 同じ位置で名称の違う 2 取込み（`項目A` 金額 10、`項目B` 金額 20）の結果が `(項目A, 10)`・`(項目B, 20)` の 2 行にならない |
| UI-09a 支払集計の行の key | 同じ `payment_key` の 2 行 | component（`DailySalesPage` の test） | `DailySalesPage shows both payment rows with same payment_key (UI-09a)` | `payment_lines` に `payment_key` が同じ `cash` で金額の違う 2 行（`¥20`・`¥40`）を渡したとき、表に 2 行とも出ない。同じ test で、応答を `項目X ¥5（payment_1）`・`項目B ¥40（cash）` の 2 行へ更新して再描画した後に、支払集計の表の行が 2 行で `¥5`・`¥40` でない（前の `¥20` の行が残る。行の key を `payment_key` だけにすると、初回の描画は通っても更新の後に古い行が残りうる） |
| UI-09a-D16・REQ-401 | 支払集計を足さない日の画面の文 | component（`DailySalesPage` の test） | `DailySalesPage texts stay true on unsummed payment day (UI-09a)` | `source_import_count` 2 で `warnings` に上の D2 の 3 の文を入れた応答のとき、文が `総売上・純売上・支払集計・部門別集計は2回の取込みを合算しています（注記で足していないと示した表を除く）。日計（Z001）は取込みごとに表示します。` でない、warning の注記の見出しが `日報の確認が必要です` でない（`日報の部門確認が必要です` が出る）、または D2 の 3 の文が注記に出ない |
| IO-07-D4a | `credit` の規則を外す | unit（`daily_report_parser.rs` の test） | `test_payment_key_has_no_credit_rule` | 全角の `クレジット` を含む名称の行の `payment_key` が `credit` になる。`現金` の行が `cash` でない。総売・純売の `line_key` が変わる |
| CMD | 登録 | drift / bindings | `scripts/check-command-drift.sh`、bindings の clean diff | `get_daily_report_sheet` が `collect_commands` か `invoke_handler` に無い、bindings が再生成されていない |
| UI-09a-D17 | 押せない状態 | component（Vitest + RTL、`ExportBar` の test） | `ExportBar disables print with reason when no imports (UI-09a)` | `import_count` 0 で `日報を印刷` が押せる、`この日のレジ日報は未取込みのため、印刷できません。` が文で出ない、またはリンク `売上データ取込みを開く` の行き先が `/csv-import` でない |
| UI-09a-D17 | 数えていない PLU の行を画面でも示す | component | `ExportBar shows skipped PLU rows with link (UI-09a)` | `plu_import.skipped_count` 3 で、画面に `数えていない PLU の行が 3 行あります` とリンク `取込みの記録を開く` が出ない、リンクの行き先が `/inventory/records` で search が `recordType: "csv_import"`・`status: "active"`・`dateFrom` と `dateTo` がその日（例 `2026-03-21`）でない、またはボタンが押せなくなる |
| UI-09a-D17 | 帳票ごとの知らせを画面でも示す | component | `ExportBar shows label change notices per source (UI-09a)` | `label_changed_sources` が `[Z002]`・`unsummed_sources` が空で、画面に `支払集計（Z002）：この日の精算の間で、帳票の行の名称か並びが変わっています。同じ名称の行が 2 行あれば、別々に足しています。` が 1 行出ない。両方が `[Z002]` のとき `支払集計（Z002）：` の後が `この日の精算の間で、帳票の行の名称か並びが変わり、1 回の精算の中に同じ名称の行が 2 行以上あります。別の項目を足さないよう、この帳票は足さずに取込みごとに載せています。` でない、または 2 の文も出る。`label_changed_sources` が空のときに `：` の行が出る。ボタンが押せなくなる |
| UI-09a-D17・SALES-SHEET-D6 | 古い内容で印刷 | component | `print waits refetch and prints new values (UI-09a)` | 画面を開いたときの応答が総売 `100`、押した後の読み直しの応答を遅らせて総売 `600` にしたとき、(a) 読み直しの解決の前に `window.print` が呼ばれる、(b) `window.print` の spy の中で読んだ紙の DOM の総売が `600` でない（`100` のまま）、(c) 紙の印刷の時刻が押した時刻（fake timer で進めた値）でない |
| UI-09a-D17 | 読み直しの失敗・取消の直後 | component | `print is skipped when refetch fails or no imports (UI-09a)` | 読み直しが失敗したとき、または読み直しの応答が `import_count` 0 のときに `window.print` が呼ばれる。ボタンの下にその状態の文（失敗は CmdError の文、0 は `この日のレジ日報は未取込みのため、印刷できません。`）が出ない。失敗のときに `再試行` が出ない、または `再試行` を押しても紙の内容を読み直さない（次の応答 `import_count` 1 でボタンが押せるようにならない） |
| UI-09a-D18 | 代わりの道の失敗 | unit（Rust の CMD の test、書込みと開く処理を差し替える） | `test_print_fallback_reports_error_when_open_fails` | 書込みか `open_path` を失敗させたときに CMD が `Ok` を返す。名称に `<b>&"` を入れたとき、書いた HTML にその文字が escape されずに出る（runtime の lane が代わりの道を採り、42 に command を足す Gated Amendment で名前・引数・返り値を決めた後だけ。test 名もその時に直す） |
| UI-09a-D17 | 紙の文と表 | component | `DailyReportSheet renders tables, notices and no yen sign (UI-09a)` | 各表の `thead` の 1 行目が `日計（Z001）　2026年3月21日（土）` / `支払集計（Z002）　…` / `部門別集計（Z005）　…` / `PLU の売上（Z004）　…` の形でない、`thead` の 2 行目が列の見出しでない、`label_changed_sources` が `[Z002]` のとき支払集計の見出しの下に `この日の精算の間で、帳票の行の名称か並びが変わっています。同じ名称の行が 2 行あれば、別々に足しています。` が出ない（ほかの表の下に出る）、`unsummed_sources` が `[Z002]` で `import_seq` 1・2 の行のとき、支払集計が 2 つの表（1 行目が `支払集計（Z002）　1回目の取込み　2026年3月21日（土）` と `… 2回目の取込み …`）に分かれない、最初の表の下に D2 の 3 の文が出ない、または D2 の 2 の文も出る、金額 `1234` が `1,234` でない（`¥` が付く）、名称が空の行が `（名前なし）` でない |
| UI-09a-D17 | 支払集計を足さない日の紙の題 | component | `DailyReportSheet title on unsummed day (UI-09a)` | `import_count` 2 で `unsummed_sources` が `[Z002]` のとき題の行に `2回の取込みを合算（取込みごとに載せた帳票を除く）` が出ない、`unsummed_sources` が空のとき `2回の取込みを合算` でない（括弧の文が出る） |
| UI-09a-D17 | PLU の知らせ | component | `DailyReportSheet PLU notices by import state (UI-09a)` | `plu_import.import_count` 0 で `この日の PLU の売上は取り込まれていません。` が出ない、取込みがあって行が無い日に `この日に売れた PLU の商品はありません。` が出ない、`skipped_count` 3 で `数えていない PLU の行が 3 行あります（入出庫履歴の CSV取込みの記録で見られます）。` が出ない |
| UI-09a-D17 | 画面に出さない・下限 | component（class の検査） | `DailyReportSheet is print-only and min 9pt (UI-09a)` | 紙の root に画面で隠す class（`hidden print:block` 相当）が無い、文字の大きさの class が 9 pt を割る |

oracle（期待値）は 34・56 の正本の文と数から転記し、production の定数を import しない。文字列の anchor は 56 の表の完全一致の文。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 紙の内容（query `["daily-sales", "sheet", { date }]`） | 日次売上を開くと読む | ボタン disabled | `import_count` 1 以上で押せる | 日報・Z004 の取込みと取消の成功 | 押したときに読み直す | 日付を変えると別の key | アプリを開き直すと読み直す（保存しない） | ボタン disabled と CmdError の文 | `再試行`（`refetch()`）か、日付を選び直す | component test、L3 |
| 印刷の dialog | — | dialog 表示中 | 印刷される | — | — | 何度でも印刷できる | — | dialog の取消は何も残さない | もう一度押す | L3（P1） |
| 紙の切替え | 店は Excel を続ける | 並びの決定と実際の 1 日の確かめ | 切替えの日から紙を印刷 | — | — | — | — | 不都合が見つかる | 翌日から Excel に戻す | 運用（UI-09a-D19） |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 同じ日の取込みを足す（NULL の伝播、checked add） | 24 §14.21 手順 2〜4・7、34 §19.3 | 34 SALES-SHEET-D2 | 24 §14.22（月次は `SUM`、部門ごと。変えない） | 上の D2 の行 |
| 個数の 100 倍の整数（IO-07-D2） | 29 IO-07-D2、34 §19.2、24 §14.21 手順 4 | SALES-SHEET-D2 | — | `test_sheet_rows_sum_quantity_in_hundredths` |
| 日次売上の文字列の書き方（`toLocaleString`、`—`、負の数） | 56 UI-09a-D16 | UI-09a-D17 | 金額の `¥` だけ付けない（紙の列の幅） | component test |
| 取込み・取消の後の invalidate | 56 の主動線（`queryKeys.dailySalesRoot()` の prefix） | `["daily-sales", "sheet", { date }]`（root の prefix に乗る） | — | component test |
| 押せない状態の表示（`aria-disabled`） | 両方の `ExportBar.tsx`（今は Tooltip） | 日次の `ExportBar` は理由を文でも出す | 月次の `ExportBar` の印刷は disabled のまま（範囲外） | component test |

## Negative Paths

- missing input: 取込みの無い日 → `import_count` 0、ボタン disabled。
- invalid input: 日付の誤り → `ValidationFailed`。
- duplicate/ambiguous input: 同じ位置に 2 つの名称 → 別の行と知らせ。同じ精算の二重の取込み（精算回数の読めない束）→ 二重に足す（D-120 の Guarantee range、test は「足される」ことを固定しない）。
- unknown reference: 商品に当たらない Z004 の行 → `skipped_count` の文。
- dependency missing: Z004 の取込みが止まっている → 「取り込まれていません」。
- permission/write failure: 不該当（書かない）。代わりの道（UI-09a-D18）を使うときだけ HTML の書込みの失敗 → 印刷しない旨の CmdError（runtime の lane が代わりの道を採るときに足す）。
- dry-run side effect: 読み取りだけで、DB を変えない（`get_daily_report_sheet` の後に表の行数が変わらない）。

## Boundary Checks

- threshold: 文字の大きさの下限 9 pt。
- null/default: NULL の伝播、`—` の表示。
- empty/non-empty: 取込み 0・行 0・PLU 0。
- min/max: 金額の和の `i64` の溢れ。足す順で成否が変わる 3 取込み（`i64::MAX`・`1`・`-i64::MAX`）と、NULL を含む組（溢れより NULL が先）。
- status/policy enum: `completed` だけ（日報）、`completed`・`completed_partial`（Z004）。
- wire type: `DailyReportSheet` の number は i64 由来。1 日の数回の取込みの和で安全な整数を越えない（拒否の検査は持たない）。安全な整数を越える値の扱いは日次売上の DTO と同じ規則にし、`docs/backlog.md` の「日次売上と日報の紙の wire の i64」で紙の runtime の lane の前に決める（本 lane の範囲外）。
- internal type: 個数は 100 倍の `i64`。
- producer/consumer: BIZ が足し、UI は描くだけ。
- round-trip token: 不該当（保存も往復もしない）。
- precision/range: 個数は小数 2 桁まで。
- cross-language parse: 不該当。

## Compatibility Checks

- old schema/input: DB の列を変えない。既存の取込み（`payment_key` が `cash`・`payment_N`）もそのまま足せる（鍵に使わない）。
- new schema/input: 無し。
- output order: 支払集計は互換の範囲（24 §14.21 手順 3）の日は今と同じ行・値・並び（ただし NULL の前の和が溢れる値は、今の error でなく NULL。同じ段の例外）。範囲の外の日は上の 14.21 の行の新しい規則の値。
- optional field behavior: 既存の DTO に field を足さない。

## Data Safety Checks

- source-derived data: test の fixture は合成の束だけ。実データの名称の値・金額を写さない。
- generated outputs: 印刷の結果・代わりの道の HTML を commit しない。
- secrets: 不該当。
- local-only files: 店の実際の日の紙の写真・PDF。
- synthetic sample boundaries: 名称は `項目A` のような合成の語。

## Main Wiring / Integration Checks

- helper connected to main path: 日次売上の `ExportBar` → `getDailyReportSheet` → CMD → BIZ → IO。
- output reaches manifest/report: 紙の内容が `@media print` の印刷に出る（L3）。
- effective config reaches runtime: `@page` の A4 縦（L3、P1）。
- CLI arg reaches implementation: 不該当。

## Manual（runtime の lane の L3。Human Gate に manual）

| 項目 | 到達経路 | 入力物 | 依存する既知の backlog | 確かめること |
|---|---|---|---|---|
| L3-1 印刷の手段（P1） | Windows の開発の build → 日次売上 → `日報を印刷` | 合成の束を取り込んだ開発の DB | 無し | OS の印刷の dialog が出て、プレビューが A4 縦で余白 10 mm。効かなければ代わりの道を採る前に、店の PC の `.html` の関連付けが印刷できるブラウザであることを確かめ（エディタ等なら代わりの道を採らない）、同じことを確かめる |
| L3-2 並びの案の比較（Q1、P5） | 同じ | 合成の束 2 つを同じ日に取り込んだ日と、PLU の行を数行持つ日（Z004 の取込みが止まっている間は PLU の行の無い紙と、test 用に PLU の行を入れた紙） | Z004 の取込みの再開（停止 ADR） | owner が案 a・b・c を実機のプリンタで印刷して並べ、読みやすさで選ぶ。既定の a が 9 pt で 1 枚に収まるか、収まらない日に表の見出しの行と列の見出しが 2 枚目の上に繰り返し出て、2 段が段ごとに続くか（UI-09a-D17 の続け方） |
| L3-3 値の一致（P2） | 店のアプリの運用の後（UI-09a-D13 の導入前受入〈go-live の前〉の後）の実際の 1 日 → 日次売上 → `日報を印刷` | 店の実際の日の取込み（同じ日に 2 回以上精算した日があればその日も） | 店のアプリの運用の開始 | アプリの紙とレジスターツールの日報（今の Excel の紙）の値が行ごとに同じ |

L3 の前に Writer が `cargo check --release` を通す（`docs/DEV_WORKFLOW.md` Implementation Rules）。

## Mutation-style Adequacy Questions

- 足す鍵から名称を外したら: `test_sheet_rows_keep_same_position_different_label_separate` が落ちる。
- 足す鍵から位置を外したら: `test_sheet_rows_do_not_merge_same_label_at_different_positions` が落ちる。
- NULL の伝播を外したら: `test_sheet_rows_propagate_null` が落ちる。NULL より先に溢れを見たら: `test_sheet_rows_null_wins_over_overflow` と `test_payment_aggregate_null_wins_over_overflow` が落ちる。
- 足す順を取込みの古い順（`import_ids`）か値の並べ替えに変えたら: `test_sheet_rows_add_in_import_id_order` と `test_payment_aggregate_adds_in_import_id_order` が落ちる。
- 支払集計の 2 の日の warning を外したら: `test_daily_sales_payment_label_changed_warns` が落ちる。印刷ボタンの下の帳票ごとの文を外したら: `ExportBar shows label change notices per source (UI-09a)` が落ちる。
- `status='completed'` の条件を外したら: `test_daily_report_sheet_excludes_rolled_back_import` が落ちる。
- PLU の `source='auto'` の絞り込みを外したら: `test_daily_report_sheet_plu_rows_are_auto_nonzero_only` が落ちる。
- 押したときの読み直しを外したら、または読み直しを待たずに印刷したら: `print waits refetch and prints new values (UI-09a)` が落ちる（遅延応答の新しい値 `600` が印刷の時点の DOM に無い）。
- 読み直しの失敗・0 件の分岐を外したら: `print is skipped when refetch fails or no imports (UI-09a)` が落ちる。
- D2 の 3 の条件（組の集合の不一致かつ 1 本の中の同じ名称）を外して常に組で足したら: `test_sheet_rows_unsummed_when_rows_shift_with_duplicate_label` と `test_daily_sales_payment_unsummed_matches_sheet_rule` が落ちる。同じ名称の判定に空の名称を含めたら: `test_sheet_rows_blank_labels_do_not_trigger_unsummed` が落ちる。
- 支払集計の鍵から位置を外したら: `test_payment_aggregate_splits_duplicate_payment_key_by_position` と `test_sheet_rows_split_by_position_when_rows_shift` が落ちる。
- 支払集計の鍵に保存済みの `payment_key` を残したら: `test_payment_aggregate_merges_pair_with_mixed_stored_payment_key` が落ちる。
- 支払集計の表の行の key を `payment_key` だけに戻したら: `DailySalesPage shows both payment rows with same payment_key (UI-09a)` の更新の後の確かめが落ちる。
- `import_seq` を行のある取込みだけで数えたら: `test_sheet_rows_import_seq_follows_import_ids` が落ちる。
- 押せない状態の条件を反転したら: `ExportBar disables print with reason when no imports (UI-09a)` が落ちる。

## Residual Test Gaps

- 実機のプリンタの見え方・字の読みやすさ・1 枚に収まるかは自動 test に乗らない（L3-2）。
- レジスターツールの日報との値の一致は実際の日でしか確かめられない（L3-3）。
- WebView2 の印刷の dialog は自動 test に乗らない（L3-1。`window.print` の呼出しだけを spy で確かめる）。
