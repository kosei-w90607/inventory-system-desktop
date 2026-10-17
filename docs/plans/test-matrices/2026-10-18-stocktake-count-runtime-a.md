# Test Design Matrix: 棚卸しの数の置き場と在庫数の求め直しの runtime (a)

Plan Packet: [2026-10-18-stocktake-count-runtime-a](../2026-10-18-stocktake-count-runtime-a.md)。行の # は packet の「横断の約束」（Y1〜Y8）と Contract Ledger を引く。test 名は予定の名前で、Writer が変えるときは同じ行の名前を直す（AC は名前の存在を `rg -n 'fn <名前>'` か `it("…")` の文で確かめる）。

## Risk

Risk: R4

## Contracts Under Test

- SPEC-STK-CNT-D1（入出庫・初期在庫の業務日、計数の鍵）、D2（求め直しと写し・`stock_after`・上限は書く直前）、D3（入出庫・初期在庫・計数どうしの判定、理由 2・3、範囲）、D9（(a) の列と表）、D10（移行）、D12（停止の入口に触れない、(a) と (b) の境）。
- MNT-03-D17（[22 §19](../../function-design/22-mnt-migration.md) の vL の手順 1〜10）、MNT-03-D1（共有の helper）。
- 21・31 の新契約（`NewMovement` の phase、`update_stock_quantity` の写し、`stock_after` は呼出しごと、業務日の検査、`phase = 1` は誤り）。
- 20・30 の新契約（`ProductUpdates.stock_quantity` を除く、初期在庫の movement と求め直し）。
- 36・75・74（整合性の 4 項目、型の形、補正は求め直し、操作ログの形と記録済みの形、移行の知らせ）。

## Failure Modes

- 計数の無い DB で、書込みの後の写しか `stock_after` が今と違う（求め直しの規則の誤り、`stock_after` を TX の全部の新しい movement に書いてしまう）。
- 写しを `recompute_stock` 以外が書く経路が残る。
- vL が行・id・列・index を欠く、`sqlite_sequence` を戻す、止まる DB で何かを書く、TX の中の失敗で一部が残る、業務日を誤った参照先から埋める。
- 形の違う日付が `business_date` に入り、文字列の大小の比べ方が崩れる。
- 既定・fresh の計数と入出庫の窓の判定の取り違え（同じ日付を「入る」とする、fresh のカーソルの境を 1 つずらす）、計数どうしの順の誤り、衝突の範囲の誤り。
- `phase = 1` の行を入出庫として黙って扱う。
- 整合性が印・範囲だけの違いを見逃す、補正が求め直しでない値を書く、記録済みの操作ログを画面が読めなくなる。

## Test Matrix

- 既存の test を回帰として引く行は、`rg` で名前の存在を確かめた（2026-10-18）。新しい test は予定の名前。
- oracle は ADR D3 の判定表・22 §19 の手順・36 の型から独立に写す。fixture の値は設計の例と違う合成の値にする（mock の値を期待値にしない）。

| # | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| M1 | MNT-03-D17 手順 4・5、D1・D9 | 列・index の欠け | integration（migration） | `test_migration_req903_vl_fresh_database_has_keys_counts_and_copy_columns` | 空の DB に最新まで当てた後、`pragma_table_info('inventory_movements')` に `business_date`・`phase`・`settlement_no`、`products` に 3 列、`stock_counts` の表、`idx_inventory_movements_ledger` と `stock_counts` の `(product_code, id)` の index のどれかが無い |
| M2 | MNT-03-D17 手順 2〜5、Y1・Y8 | 業務日の埋め方・id・sequence | integration | `test_migration_req201_vl_backfills_business_date_and_keeps_ids_and_sequence` | 直前の版の DB（入庫・返品交換・手動販売・廃棄の記録と、`reference_type` NULL の初期在庫の movement、末尾の movement を 1 つ消して sequence が最大の id より大きい）で、各行の `business_date` が header の日付（初期在庫は `created_at` の先頭 10 文字）でない、`phase` が 0 でない、`settlement_no` が NULL でない、ほかの列・id が変わる、`sqlite_sequence` が前の値でない（次の INSERT の id が消した id と同じになる） |
| M3 | MNT-03-D17 手順 1 (a)、D10 | 止まる DB で書く | integration | `test_migration_req205_vl_stops_on_stocktakes_or_csv_imports_without_changes` | `stocktakes` に 1 行だけの DB と `csv_imports` に 1 行だけの DB（表ごと 1 case）で、`MigrationFailed` でない、message に `作り直し` と表名が無い、schema・全表の値・版のどれかが変わる |
| M4 | MNT-03-D17 手順 1 (b)・手順 2 | 参照先の無い行・形か暦の外れる日付・旧の補正の movement を通す | integration | `test_migration_req903_vl_stops_on_unmappable_movements` | 手順 1 (b): `reference_type = 'csv_import'` の movement（取込みの行なし）、`movement_type = 'receiving'` で `reference_type = 'stocktake'` の movement（参照先の条件だけで止まるか）、`movement_type = 'stocktake'` の movement。手順 2: 参照先の header の無い `receiving_record` の movement、header の日付が `2026/10/01`（形が外れる）、`2026-02-30`（`date()` が `2026-03-02` に繰り上げる）、`2026-02-32` と `2026-13-01`（`date()` が NULL を返す。拒む条件を `NOT (date(d) = d)` にすると通ってしまう。Contract Probe P7）の記録の movement。計 8 case で、止まらない・schema・全表の値・版のどれかが変わる・message に `inventory_movements` か `作り直し`（直し方の案内）が無い |
| M5 | MNT-03-D17 手順 8、Y2 | 上限の外の和で書く | integration | `test_migration_req903_vl_stops_when_recomputed_stock_out_of_range` | movement の和が `1000000000` の商品のある DB で止まらない・schema・全表の値・版のどれかが変わる・message に `products`・`stock_quantity`・`作り直し`（直し方の案内）のどれかが無い（境界: 和が `999999999` と `-999999999` の DB は通る） |
| M6 | MNT-03-D17 手順 8、Y7、D2 | 写しの直し方・知らせの記録 | integration | `test_migration_req904_vl_fixes_copy_and_logs_trigger_migration` | 写し 7・和 5 の商品と写し＝和の商品のある DB で、前者の `stock_quantity` が 5 にならない、後者が変わる、`operation_logs` に `integrity_fix` の 1 行（`trigger: migration`、`fixed_count` 1、`skipped_count` 0、`adjustments` の 1 要素の before 7・after 5〈印 0・範囲 NULL〉、36 の形。`created_at` が `%Y-%m-%dT%H:%M:%S` の形〈22 §19 手順 8〉）が無い。写し＝和だけの DB で行が書かれる。vL の後の全商品で `derive_stock` が写しと同じでない |
| M7 | D9（stock_counts の CHECK） | 計数の表の縛りの欠け | schema | `test_migration_req205_vl_stock_counts_checks` | `count_value = -1`、`count_kind = 'other'`、`default` に `seen_movement_id` あり、`fresh` に `seen_movement_id` なし、存在しない商品・明細の FK のどれかが受け入れられる |
| M8 | D9（写しの列の CHECK）、Y3 | 印と範囲の不一致を受ける | schema | `test_migration_req903_vl_copy_columns_check` | 印 1・範囲なし、印 1・low > high、印 0・範囲あり のどれかが受け入れられる、または印 1・low ≤ high と既定の INSERT が拒まれる（同梱の SQLite を下げて列の追加の CHECK が効かなくなっても red） |
| M9 | MNT-03-D1、手順 9・10 | TX の中の失敗で一部が残る | integration（故障の注入） | `test_migration_req903_vl_commit_failure_rolls_back_everything` | 今の `FailurePoint::Commit` を vL に当てたとき、`inventory_movements` の旧い表・`products` の列・`stock_counts`・版のどれかが変わる（`db/migration_tx.rs` は変えない） |
| L1 | D2（計数なし） | 和と違う | unit | `test_stock_ledger_req201_no_counts_equals_sum_of_valid_movements` | 計数の無い商品で、`is_voided = 0` の movement の和でない（無効の movement を足す、初期在庫を落とす）。範囲・理由がある |
| L2 | D3（既定の計数 × 入出庫） | 日付の窓の取り違え | unit | `test_stock_ledger_req205_default_count_vs_movement_dates` | 既定の計数（日付 D、値 10）に対し、業務日 D−1 の +3 が足される（正しくは「入る」で足さない）、D+1 の −2 が足されない（正しくは「入らない」で足す）、D の +4 が写しで足されない・範囲が `8〜12`（D+1 の −2 を足した土台 8 に、決まらない +4 を足す・足さない）にならない・理由に `same_date_movement` が無い |
| L3 | D3（fresh の計数 × 入出庫） | カーソルの境 | unit | `test_stock_ledger_req205_fresh_count_cursor_boundary` | fresh の計数（今日 T、`seen_movement_id` = m）に対し、id m の movement が足される（正しくは「入る」で足さない）、id m+1 で業務日 T−1 が足される（正しくは「入る」）、id m+1 で業務日 T が決まらない（写しで足し、範囲を持つ）にならない、業務日 T+1 が足されない（正しくは「入らない」で足す） |
| L4 | D3（初期在庫） | 初期在庫を計数の後とみなす | unit | `test_stock_ledger_req205_initial_stock_always_included` | 計数の日付より後に登録した商品の初期在庫の movement が計数に「入っていない」として足される |
| L5 | D3（計数どうし: 既定どうし） | 日付の順の誤り | unit | `test_stock_ledger_req205_later_default_count_wins` | 日付 D1 < D2 の既定の計数で、D1 の計数が効く |
| L6 | D3（計数どうし: fresh が先の全てを置き換える） | 保存の順の誤り | unit | `test_stock_ledger_req205_fresh_replaces_earlier_counts` | 先に保存された既定の計数（日付 T）より後の fresh（今日 T）が効かない |
| L7 | D3（fresh の後の既定、D < T / D = T / D > T） | 3 通りの取り違え | unit | `test_stock_ledger_req205_default_after_fresh_three_cases` | D < T で既定が効く、D = T で重ならない（衝突にならない・同値なら fresh を代表にしない）、D > T で fresh が効く |
| L8 | D3 の理由 3（衝突） | 衝突の範囲・土台 | unit | `test_stock_ledger_req205_conflicting_counts_range_and_min_base` | 同じ日付の既定の計数 8 と 11 で、写しが 8 を土台にしない、範囲が両方の土台の範囲を合わせない、理由に `conflicting_counts` が無い |
| L9 | D3（同値の重なり） | 同値を衝突にする | unit | `test_stock_ledger_req205_equal_overlapping_counts_not_conflict` | 同じ日付の既定の計数 9 と 9 が衝突（理由・範囲あり）になる |
| L10 | D3（範囲の両向き） | 正負の決まらない記録の範囲 | unit | `test_stock_ledger_req205_range_with_positive_and_negative_undetermined` | 既定の計数 10 と同じ日付の +3・−2 で、写しが 11 でない、範囲が `8〜13` でない |
| L11 | D3（理由の重複なし・順） | 理由の列の誤り | unit | `test_stock_ledger_req205_reasons_dedup_and_order` | 決まらない入出庫と衝突が同時にあるとき、理由が `same_date_movement`・`conflicting_counts` の順で 1 回ずつでない |
| L12 | Y8（phase = 1 は誤り） | 黙って入出庫として扱う | unit | `test_stock_ledger_req401_phase_one_movement_is_error_until_b` | `phase = 1` の movement（test の直の INSERT）のある商品で、`derive_stock` が `Ok` を返す、`recompute_stock` が写しを書く |
| L13 | Y2・Y3（上限は書く直前、TX 全体を戻す） | 上限の外を書く | unit | `test_stock_ledger_req903_recompute_rejects_out_of_range_value_and_range_end` | 求めた値が `1000000000`、または範囲の端が `-1000000000` のとき、`ValidationFailed("在庫数が大きすぎます")` でない、写しが変わる。端の `999999999` は通る |
| L14 | D2（`recompute_stock` が 4 項目を書く） | 印・範囲を書かない | unit | `test_stock_ledger_req205_recompute_writes_quantity_flag_and_range` | 衝突のある商品で `recompute_stock` の後の `stock_recheck`・`stock_range_low`・`stock_range_high` が求めた値でない。計数を足して解けた後に 0・NULL に戻らない |
| W1 | Y1・31（業務日の形） | 形の違う日付を通す | unit | `test_create_receiving_req201_rejects_noncanonical_date` | `2026-4-7`・` 2026-04-07`・`+2026-04-07`・`-0001-04-07`・`+10000-04-07`（chrono が読んで同じ文字列に書き戻す 2 つ。Contract Probe P6）・`2026/04/07`・空で `ValidationFailed("日付の形式が不正です（YYYY-MM-DD）")` でない、何かが書かれる（`write_surface` の比較） |
| W2 | Y1（実在） | 実在しない日付 | unit | `test_create_receiving_req201_rejects_nonexistent_date` | `2026-02-30` で `ValidationFailed("存在しない日付です")` でない、何かが書かれる |
| W3 | Y1（4 業務の全部） | 1 つの業務だけ検査が抜ける | unit | `test_create_return_req202_rejects_noncanonical_date`・`test_create_manual_sale_req203_rejects_noncanonical_date`・`test_create_disposal_req204_rejects_noncanonical_date` | 返品交換・手動販売・廃棄のどれかが `2026-4-7` を受ける |
| W4 | Y1（DB の CHECK） | DB が形を拒まない | schema | `test_inventory_repo_req201_business_date_check_rejects_noncanonical` | `insert_movement` に `2026-4-7` を渡して INSERT が成功する |
| W5 | Y1（sales_service と共有の検査） | 共有に替えた後の退行 | unit | 既存の `sales_service` の日付の test（`sales_service.rs:817`・`:826`）＋ `test_validate_business_date_req301_shape_then_calendar` | `2026-04-07`・`0000-01-01` が拒まれる、`2026-4-7`・`-0001-04-07`・`+10000-04-07`・`２０２６-04-07` が通る、`2026/04/07`・`2026-ab-07` が「日付の形式が不正です（YYYY-MM-DD）」でない、`2026-02-30` が「存在しない日付です」でない |
| W6 | 31（業務日を movement に書く） | header と違う日付を書く | unit | `test_create_receiving_req201_movement_business_date_is_header_date` | 入庫日 `2026-05-03` の入庫の movement の `business_date` が `2026-05-03` でない（今日の日付になる） |
| W7 | Y1・31（movement を作らない保存も同じ検査） | レジ処理済みの返品だけ検査が抜ける | unit | `test_create_return_req202_register_processed_rejects_noncanonical_date` | `register_processed = true` の返品で `2026-4-7` と `2026-02-30` が `ValidationFailed`（文は W1・W2 と同じ）でない、何かが書かれる（`return_records` が増える） |
| E1 | D2・Y4（入出庫 4 業務の値が今と同じ） | 値の変化、`stock_after` の書き方 | integration（BIZ の入口） | `test_inventory_req201_req204_recompute_matches_previous_stock_and_stock_after` | 初期在庫 5 の商品に、入庫（同じ商品の明細 2 行: +2・+3）→ 手動販売 −1 → 廃棄 −1 → 返品交換（レジ未処理）+1 → 返品交換（レジ処理済み）を順に行い、各 movement の `stock_after` が `7, 10, 9, 8, 9`（入庫の 2 行は途中の値）でない、写しが 9 でない、レジ処理済みで movement が増える |
| E2 | 負の在庫の警告（INV-3） | 警告の判定が求め直しの値でない | unit | 既存の 4 業務の負の警告の test（`rg -n 'negative_stock_warning' src-tauri/src/biz/inventory_service` の test）| 期待を変えずに通らない |
| E3 | 30（初期在庫の movement と求め直し） | 登録の写しと movement の食い違い | integration | `test_create_product_req101_initial_stock_movement_and_copy_match`・`test_commit_import_req104_initial_stock_movement_and_copy_match` | 初期在庫 5 の登録・商品 CSV の新規行で、写しが 5 でない、初期在庫の movement（`reference_type` NULL、業務日 = 今日、`stock_after` 5）が無い。初期在庫 0 で movement ができる。上書きの行で在庫が変わる |
| E4 | 旧本体（停止の裏の test だけの経路） | 旧本体の値の変化 | integration | 既存の `commit_tests.rs`・`rollback_tests.rs`・`stocktake_service.rs` の旧本体の test、`cross_feature_tests.rs` の `test_cross_feature_req201_req202_req203_req204_req401_model` | 期待を変えずに通らない（取消の `StockCorrection` の old / new、棚卸しの確定の `stock_after`、model の在庫） |
| I1 | 36（突合の相手） | 和と比べ続ける | unit | `test_integrity_req904_check_compares_copy_with_derived` | 計数（test の直の INSERT）のある商品で、写し＝求めた値なのに不一致に出る（和と比べている）、写し≠求めた値なのに出ない |
| I2 | 36（印・範囲だけの違い） | 「差異なし」と出す | unit | `test_integrity_req904_flag_or_range_only_difference_is_reported` | 数が同じで `stock_recheck` か範囲だけ違う商品（DB の直の UPDATE）が一覧に出ない、`differing_fields` が `["recheck","range"]` でない |
| I3 | 36（`differing_fields` の順と重複なし） | 列の誤り | unit | `test_integrity_req904_differing_fields_order` | 数・印・範囲が全部違う商品で `["quantity","recheck","range"]` でない |
| I4 | 36（補正は求め直し） | 和を書く・movement を作る | unit | `test_integrity_req904_fix_writes_recompute_result_without_movement` | 補正の後の写しの 4 項目が `derive_stock` と違う、movement が増える、同じ商品で skip が数えられない |
| I5 | 36（ログの形） | 記録の形の誤り | unit | `test_integrity_req904_fix_log_before_after_shape` | `integrity_fix` の detail の各要素が `product_code`・`stock_unit`・`before`・`after`（それぞれ 4 項目）でない、`trigger` が入る |
| I6 | 36（check のログの形） | 記録の形の誤り | unit | `test_integrity_req904_check_log_copy_derived_shape` | `integrity_check` の detail の各 mismatch が `copy`・`derived`・`differing_fields` を持たない |
| U1 | 75（一覧の列と語） | 語・値の誤り | component | `IntegrityCheckPage` の `it("違う項目と、保存している値・記録から求め直した値を並べる")` | 「違う項目」「保存している値」「記録から求め直した値」の列見出し、「在庫数・要再確認・範囲」の語、「（要再確認 4〜5）」の値の文字が無い。「システム在庫が多い」「入出庫の合計が多い」が残る |
| U2 | 75（印・範囲だけの違いも一覧） | 「差異なし」と出す | component | `it("数が同じで要再確認だけが違う商品も一覧に出す")` | `differing_fields: ["recheck","range"]` の mismatch で「差異なし」が出る |
| U3 | 75（確認 dialog） | 前後の値の誤り | component | `it("補正の確認で保存している値から記録から求め直した値への前後を出す")` | dialog に選んだ商品の前後の値（単位つき）が無い |
| U4 | 75（補正の結果） | 結果の値の誤り | component | `it("補正の結果を before と after から出す")` | `StockAdjustment` の `before`・`after` の数と印が結果に出ない |
| U5 | 75（色だけで示さない） | 状態を色だけで出す | component | `it("違う項目を文字で示す")` | 違う項目が Badge の色だけで、文字の語が無い |
| U6 | 74（記録済みの形と新しい形） | 記録済みのログを読めない | component | `OperationLogsPage` の `it("integrity_fix の記録済みの形と before/after の形の両方を読む")` | 記録済みの `old_stock`・`new_stock`・`adjustment` の行が今の表示でなくなる、新しい形の行が技術情報（JSON）に回る、どちらにも合わない要素が要約に出る |
| U7 | 75・bindings（command の新しい形） | wire の取り違え | component | `it("run_integrity_check の copy と derived を表示に使う")` | mock の `copy.stock_quantity` と `derived.stock_quantity` を入れ替えても表示が同じ（どちらの field を読むかを確かめる。mock の値は 36 の例と違う値） |
| U8 | 75（移行の知らせ） | 知らせの欠け・誤り | component | `it("移行の integrity_fix があれば日時と商品の数と操作ログへの導線を出す")`・`it("移行の行の後に別の integrity_fix があっても知らせを出す")`・`it("ログの読取りに失敗してもチェックを止めない")` | `trigger: migration` の行で知らせの文・件数・`/settings/logs` への導線が無い、`listLogs` の呼出しが `page: 1`・`per_page: 100`・`operation_type: "integrity_fix"` でない、新しい順の 1 行目が `trigger` の無い `integrity_fix` で 2 行目が移行の行のとき知らせが出ない、`trigger` の無い行だけで知らせが出る、`listLogs` の失敗でチェックの button が押せない |

## 既存の test の移し方（書き換える / 変えない / 期待を変える）

packet の S1・S2・S4・S6 はこの節を引く。行番号と数は 2026-10-18 に本 worktree で測った（code は main `f5d7aaf4` と同じ。`git diff --stat f5d7aaf4 HEAD -- src-tauri src` が空）。分類の意味:

- **書き換える**: 値の期待（`assert` の右辺・件数・message）を変えず、test の入力・呼び方・絞り方だけを新しい契約に合わせる。
- **変えない**: 触らない。理由を書く。
- **期待を変える**: 正本の契約の変更で期待が変わる。理由の正本と新しい期待を書く（弱めない）。

着手時に各表の command を逐語で回し、表と違う所があれば表を直してから進める（違いの理由を PR の本文に書く。AC9）。

### T1 版の期待と migrate の呼び方（S1）

```
$ rg -n '\(8, 8\)|assert_eq!\(.*\b8\b' src-tauri/src/db/migration.rs src-tauri/src/db/schema_v2.rs | wc -l
18
$ rg -c 'migrate\(&conn\)' src-tauri/src/db/migration.rs
25
$ rg -n 'migration::migrate\(&conn\)' src-tauri/src
src-tauri/src/cmd/inventory_cmd.rs:68:        db::migration::migrate(&conn).unwrap();
src-tauri/src/cmd/disposal_cmd.rs:93:        db::migration::migrate(&conn).unwrap();
src-tauri/src/cmd/receiving_cmd.rs:77:        db::migration::migrate(&conn).unwrap();
src-tauri/src/cmd/return_cmd.rs:76:        db::migration::migrate(&conn).unwrap();
src-tauri/src/db/mod.rs:210:    migration::migrate(&conn)?;
src-tauri/src/db/schema_v2.rs:452:        super::super::migration::migrate(&conn).unwrap();
src-tauri/src/biz/inventory_service/list.rs:274:        db::migration::migrate(&conn).unwrap();
```

版の期待の 18 行:

| 分類 | 所 | 理由・新しい期待 |
|---|---|---|
| 書き換える（vL の番号へ。12 行） | `migration.rs:718`・`:728`・`:770`・`:806`・`:870`・`:886`・`:1529`・`:1541`、`schema_v2.rs:378`・`:586`・`:596`・`:601`（`:601` は message の「v1+…+v8の8レコード」も） | 空の DB・行の無い DB・在庫 0 で movement の無い商品だけの DB（`:770`）を最新の版まで当てる。vL の手順 1・2・8 のどれにも当たらず vL が当たる |
| 書き換える（migrate を版 8 までに替え、期待は 8 のまま。3 行） | `test_migration_req903_v8_rebuild_keeps_rows_definition_indexes_and_fk` の `:1460`・`:1520`（期待 `:1488`・`:1521`）、`test_migration_req903_v8_limit_check_accepts_boundary_values` の `:1708`（期待 `:1712` は schema_versions の行数 8） | fixture が棚卸しの行（`seed_v7_products_with_children` の `:1419`、`:1688`）を持ち、最新まで当てると vL の手順 1 で止まる。版の上限を取る test 用の migrate（`migrate_up_to(conn, 8)`。§16 の vB の test と同じ helper で、先に入る lane が足す）に替える |
| 変えない（8 のまま。2 行） | `:1619`・`:1638` | v8 の COMMIT の後の foreign_keys の復元の失敗で、その `migrate` の呼出しは `MigrationFailed` を返して vL へ進まない（22 §3.2 MNT-03-D1） |
| 期待を変える（1 行） | `:1629`（`test_migration_req903_v8_commit_and_fk_restore_failures` の (3)。`:1624`〜`:1629` で接続を捨てて `init_database` で開き直す） | 開き直しは最新の版まで当てるので vL へ進み、fixture の `stocktakes`（`:1419`）で手順 1 に当たって開けない（22 §19 手順 1）。新しい期待: `drop(conn)` の後、素の接続（`Connection::open`）で `DELETE FROM stocktake_items; DELETE FROM stocktakes;` を実行して閉じ、`init_database` で開き直すと、`foreign_keys` が 1、`max_version_and_count` が (vL の番号, vL の番号)（v8 を当て直さず vL が 1 回当たる）。vL の止まり自体は M3 が見る |

版の期待でない行の期待を変える所（1 か所）:

| 分類 | 所 | 理由・新しい期待 |
|---|---|---|
| 期待を変える | `:1542`（`test_migration_req903_v8_fresh_database_and_empty_tables` の、行の無い v7 の DB を `:1540` で最新まで当てた後の `products_definition` の完全一致） | vL が `products` に 3 列を足す（22 §19 手順 6）。新しい期待: `pragma_table_info('products')` が前の 18 列の後に `stock_recheck`（`INTEGER`・notnull 1・既定 `0`）、`stock_range_low`（`INTEGER`・notnull 0・既定 NULL）、`stock_range_high`（同）の 3 行を足したもの。FK の一覧と index は前と同じ。`:1541` の版は上の「書き換える」 |

`migration.rs` の `migrate(&conn)` の 25 の呼出し:

| 分類 | 所 | 理由 |
|---|---|---|
| 変えない（vL を当てない。2） | `:473`（新しすぎる版で拒む）・`:493`（同じ版） | migrate が何も当てない |
| 変えない（vL が当たるが、手順 1・2・8 に当たる行が無い。10） | `:608`・`:648`（v6、取引先だけ）・`:763`（v3、在庫 0・movement の無い商品）・`:877`（空の v4）・`:1126`・`:1149`・`:1174`・`:1254`（v7、日報の表。`daily_report_imports` は `csv_imports` と別の表）・`:1287`・`:1292`（空・NULL の行） | 版の期待は上の表 |
| 変えない（vL の前の migration で止まる。9） | `:1210`・`:1244`（v7 の検査）・`:1562`（v8 の FK の検査）・`:1586`・`:1602`（v8 の COMMIT の失敗）・`:1614`・`:1635`（v8 の COMMIT の後の foreign_keys の復元の失敗）・`:1849`・`:1894`（v8 の上限の検査） | 失敗した migration で `migrate` が返る |
| 書き換える（3） | `:1460`・`:1520`・`:1708` | 上の表 |
| 期待を変える（1） | `:1540`（呼び方は変えない） | 上の `:1542` |

`migration.rs` の外の `migrate` の呼出し（上の command の 7 行）: `db/mod.rs:210` は `init_database` の本体。test の 6 は変えない（cmd の 4 と `list.rs:274` は空の DB〈`init_database(":memory:")`〉、`schema_v2.rs:452` は v1 の DB に在庫 0 の商品と movement の無い入庫・返品だけ）。

### T2 movement の書込みの形（S2）

```
$ rg -c 'NewMovement \{' src-tauri/src src-tauri/tests
src-tauri/src/biz/stocktake_service.rs:1
src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs:2
src-tauri/src/biz/product_service.rs:2
src-tauri/src/biz/integrity_service.rs:3
src-tauri/src/db/inventory_repo.rs:11
src-tauri/src/biz/inventory_service/common.rs:1
src-tauri/src/biz/stocktake_service/time_evidence_tests.rs:1
src-tauri/src/biz/stocktake_service/time_evidence.rs:2
$ rg -n 'INSERT INTO inventory_movements' src-tauri/src src-tauri/tests | wc -l
32
$ rg -c 'INSERT INTO inventory_movements' src-tauri/src src-tauri/tests
src-tauri/src/cmd/inventory_cmd.rs:2
src-tauri/src/db/schema_time_evidence.rs:2
src-tauri/src/seed_demo.rs:2
src-tauri/src/db/return_repo.rs:1
src-tauri/src/biz/csv_import_service/tests/list_tests.rs:1
src-tauri/src/db/stocktake_repo.rs:4
src-tauri/src/db/test_support.rs:1
src-tauri/src/db/manual_sale_repo.rs:1
src-tauri/src/biz/stocktake_service.rs:1
src-tauri/src/db/migration.rs:3
src-tauri/src/db/receiving_repo.rs:1
src-tauri/src/db/sales_repo.rs:4
src-tauri/src/db/inventory_repo.rs:4
src-tauri/src/db/disposal_repo.rs:3
src-tauri/src/biz/inventory_service/list.rs:2
```

`NewMovement {` の hit 23 = 型の定義 1 + literal 22:

| 分類 | 所 | 数 | 直し方 |
|---|---|---|---|
| 変えない（型の定義。field を足す側） | `inventory_repo.rs:104` | 1 | S2 の本体 |
| 書き換える（production の code） | `inventory_service/common.rs:104`（`apply_stock_change`）・`product_service.rs:275`・`:1578`（初期在庫）・`stocktake_service.rs:521`（旧本体の棚卸しの確定） | 4 | 業務日は 31・30 の新契約（header の日付・PC の今日）、`settlement_no: None` |
| 書き換える（時点証拠の `#[cfg(test)]` の code） | `stocktake_service/time_evidence.rs` の 2 | 2 | 業務日 = PC の今日、`settlement_no: None`。写しを直に書く振舞いは変えない（(b) で外す） |
| 書き換える（test） | `inventory_repo.rs` 10（`:454`・`:606`・`:639`・`:667`・`:859`・`:872`・`:886`・`:914`・`:957`・`:970`）・`integrity_service.rs` 3（`:281`・`:297`・`:770`）・`cross_feature_tests.rs` 2・`time_evidence_tests.rs` 1 | 16 | 固定の業務日（例 `"2026-04-01"`）と `settlement_no: None` を足すだけ |

raw の `INSERT INTO inventory_movements` の hit 32:

| 分類 | 所 | 数 | 直し方 |
|---|---|---|---|
| 書き換える（production の定義） | `inventory_repo.rs:127`（`insert_movement`） | 1 | S2 の本体 |
| 書き換える（demo の seed） | `seed_demo.rs:398`・`:462` | 2 | `:398`（`seed_initial_receiving` の初期在庫）は `BASE_TIMESTAMP` の日付、`:462`（`seed_sales` の `sale_auto`）は売上ごとの `sale_date`（`:480`。`created_at` の先頭 10 文字と同じ）を業務日にする |
| 書き換える（時点証拠の `#[cfg(test)]` の code） | `inventory_repo.rs:421`（`insert_stocktake_movement`） | 1 | 業務日 = PC の今日、`phase` 0 |
| 書き換える（test・test の support） | `stocktake_repo.rs` 4・`sales_repo.rs` 4・`disposal_repo.rs` 3・`inventory_repo.rs` 2（`:835`・`:927`）・`schema_time_evidence.rs` 2・`cmd/inventory_cmd.rs` 2・`inventory_service/list.rs` 2・`db/test_support.rs` 1（`:122`、`seed_legacy_fixture`。時点証拠の test が vL の後の DB に入れる）・`return_repo.rs` 1・`receiving_repo.rs` 1・`manual_sale_repo.rs` 1・`stocktake_service.rs` 1・`csv_import_service/tests/list_tests.rs` 1 | 25 | 列に `business_date`（固定の日付）と `phase`（`0`。NOT NULL で既定値が無い）を足す。`reference_type` が `csv_import`・`stocktake` の行も (a) の間は `phase = 0` |
| 変えない | `migration.rs:1415`・`:1553`・`:1681` | 3 | vL の前の版の DB に入れる行（vL が埋める） |

### T3 在庫つきの商品の fixture（helper の定義ごと。S4）

判定: 在庫 ≠ 0 の商品を作り、その後に写しを求め直す経路（入出庫 4 業務の `create_*`、旧本体の Z004 の確定・取消と棚卸しの確定、整合性の補正）を通して、写し・`stock_after`・負の警告のどれかを確かめる test が使う定義は「書き換える」: 在庫 ≠ 0 なら同じ値の初期在庫の movement も `insert_initial_stock_movement(conn, code, stock, stock)`（`db/test_support.rs` に新設。`movement_type` `receiving`・`reference_type` NULL・業務日 `"2026-04-01"`）で入れる。S4 の後は写しを記録から求め直すので、入れないと写しが記録の和（例: 補正の movement だけ）になる。同じ名前の別の定義は 1 つずつ分ける。

```
$ rg -n 'fn (seed_\w*product\w*|create_test_product\w*|create_plu_exported_product|insert_test_product\w*|product_full|product)\s*\(' src-tauri/src
（34 行。下の表の「定義」の列が全部）
```

| 分類 | 定義（在庫） | 理由 |
|---|---|---|
| 書き換える | `biz/inventory_service/test_support.rs:14` `create_test_product`・`:40` `create_plu_exported_product`（在庫は引数）、`:72` `create_test_product_with_unit`（`:14` を呼ぶ） | 入出庫 4 業務の test が書込みの後の写し・`stock_after`・負の警告を確かめる |
| 書き換える | `biz/csv_import_service/test_support.rs:14` `create_test_product_with_jan`（引数。raw の INSERT）、`csv_import_service/tests/time_evidence_tests.rs:518` `product`（`:14` を在庫 10 で呼ぶ） | 旧本体の Z004 の確定・取消が写しを求め直す（`commit_tests.rs`・`rollback_tests.rs`・`cross_feature_tests.rs`） |
| 書き換える | `biz/stocktake_service.rs:615` `seed_product`・`:662` `seed_product_with_jan`・`:916` `seed_product_custom`（引数）、`:945` `seed_product_with_unit`（`:916` を呼ぶ） | 旧本体の棚卸しの確定が補正の movement を入れて求め直す。例: `test_complete_req205_stock_after_equals_actual`（`:1253`〜。`:1257` で `seed_product`）は在庫 10・履歴なしで作り実数 7 を確定する。初期在庫の movement が無いと、補正の movement −3 だけから求めて −3 になり、今の期待 7 が崩れる |
| 変えない（除外） | `biz/integrity_service.rs:256` `seed_product`（引数） | 整合性の test は写しと記録をわざと食い違わせて差異を作る（`add_movement` で記録だけを足す）。初期在庫の movement を足すと差異の前提が崩れる |
| 変えない（在庫 0） | `db/test_support.rs:26` `seed_product`、`db/stocktake_repo.rs:1138` `seed_product`、`db/sales_repo.rs:1645` `seed_product`・`:2923`、`biz/sales_service.rs:709` `seed_product`・`:1557`（`:709` を呼ぶ）、`biz/product_service.rs:1659`、`db/product_repo.rs:1347` `create_test_product`（`NewProduct` を返すだけ）・`:1866` | 在庫 0 は初期在庫の movement を作らない（30 の新契約と同じ）。求め直しの値も 0 |
| 変えない（写しを求め直す経路を通らない） | `db/stocktake_repo.rs:1160`（7）・`:1618`（引数）、`db/product_repo.rs:1830`（10・5）・`:2448`（10）、`cmd/inventory_cmd.rs:133`（引数。在庫照会・在庫推移の一覧）、`biz/daily_report_import_service/tests.rs:97`（引数。日報の取込み）、`biz/plu_export_service.rs:931`（10）・`:911`（`:931` を呼ぶ） | IO の読取り・在庫照会・日報・PLU の書出しの test で、写しを書き直さない |
| 変えない（経路は通るが、写し・`stock_after`・警告を確かめない） | `biz/inventory_service/list.rs:278` `seed_product_with_stock`（引数）・`:723`（`:278` を呼ぶ） | `list_movements` の test（`:492`・`:520`）は書込みをしない。明細の金額の test（`:731`〜）は入庫・廃棄を通るが、明細の金額だけを確かめる |
| 変えない（時点証拠） | `biz/stocktake_service/time_evidence_tests.rs:39` `product_full`・`:58` `product` | 時点証拠の `#[cfg(test)]` の code は写しを直に書き（`update_stock_quantity_with_revision`）、求め直しを通らない（(b) で外す） |
| 変えない（vL の前の版の DB） | `db/migration.rs:1381` `seed_v7_products_with_children` | vL の手順 8 が写しを直す（T1） |
| 変えない（demo の seed。test の fixture でない） | `seed_demo.rs:193`・`:301` | movement の業務日は T2 |

helper の呼出しの行は変えない。同じ商品に初期在庫の movement を helper の後で自分で入れている `csv_import_service/tests/cross_feature_tests.rs:86`〜`:100`（World）は二重になるので、自分の `insert_movement` を消す（和は同じ。T5）。

### T4 写しを直に入れる・書き換える所（S4）

```
$ rg -n 'SET stock_quantity' src-tauri/src src-tauri/tests | wc -l
18
$ rg -U -c 'INSERT INTO products\s*\([^)]*stock_quantity' src-tauri/src src-tauri/tests
src-tauri/src/cmd/csv_import_cmd.rs:1
src-tauri/src/db/test_support.rs:1
src-tauri/src/seed_demo.rs:1
src-tauri/src/db/migration.rs:1
src-tauri/src/db/product_repo.rs:2
src-tauri/src/biz/csv_import_service/test_support.rs:1
src-tauri/src/biz/stocktake_service/time_evidence_tests.rs:1
```

`SET stock_quantity` の hit 18 = 定義 2（`inventory_repo.rs:158` の `update_stock_quantity`、`:382` の時点証拠の `update_stock_quantity_with_revision`）+ 時点証拠の test 1（`:507`）+ その他 15:

| 分類 | 所 | 数 | 理由・直し方 |
|---|---|---|---|
| 書き換える | `csv_import_service/tests/rollback_tests.rs:301`（`set_stock`）・`commit_tests.rs:658` | 2 | 旧本体の Z004 の取消・確定が記録から求め直すので、写しだけを動かすと上限の検査の土台にならない。UPDATE の前に「新しい値 − その時点の写し」の movement を `insert_initial_stock_movement(conn, code, 差, 新しい値)` で入れて写しと記録を揃える。期待（`在庫数が大きすぎます`、`(999_999_999, 0, 0)`・`(999_999_999, 1, 1)`、`-999_999_999`）は変えない |
| 変えない | `migration.rs:1665`・`:1667`・`:1755`・`:1760` | 4 | vL の前の版の DB（`:1665`・`:1667` は T1 で版 8 まで、`:1755`・`:1760` は v8 の上限の検査で止まる） |
| 変えない | `stocktake_repo.rs:2022` | 1 | IO の読取りの test |
| 変えない | `stocktake_service.rs:900` | 1 | `legacy_update_count` が今の写しとの差を読むだけで、写しを書き直さない |
| 変えない（意図した食い違い） | `cross_feature_tests.rs:537` | 1 | 写しをわざと壊して model が見つけるかを試す test |
| 変えない（時点証拠） | `stocktake_service/time_evidence_tests.rs:737`・`:773`・`:787`・`:1390`・`:1420`・`:1463` | 6 | 求め直しを通らない（T3） |

raw の `INSERT INTO products (… stock_quantity …)` の 8 か所: `product_repo.rs:691`（production の `insert_product`）と `seed_demo.rs:216`（demo）は変えない。`csv_import_service/test_support.rs:23` は T3 の `create_test_product_with_jan`（書き換える）。`stocktake_service/time_evidence_tests.rs:48`（`product_full`）・`db/test_support.rs:92`（`seed_legacy_fixture`）・`product_repo.rs:2456`（`insert_test_product_for_plu`）・`migration.rs:1385` は T3 の「変えない」。`cmd/csv_import_cmd.rs:328` は変えない（parse の cache の test で、Z004 の確定は停止の入口で止まり写しを求め直さない）。

### T5 商品で絞って movement を読む test（S4 の helper の結果）

規則: T3・T4 の「書き換える」で同じ商品に初期在庫の movement が増える。商品で絞って movement を読む test は、対象の業務の参照先（`reference_type`）で絞るか、操作の前後の差を見る形に直し、値の期待（数量・`stock_after`・種類・note、返品で増えない 0 件など）は変えない。

```
$ rg -U -n -o 'FROM inventory_movements[^";]*?product_code' src-tauri/src | rg ':FROM inventory_movements'
src-tauri/src/seed_demo.rs:394:FROM inventory_movements \
src-tauri/src/biz/csv_import_service/tests/legacy_stop_tests.rs:261:FROM inventory_movements WHERE product_code
src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs:306:FROM inventory_movements WHERE product_code
src-tauri/src/biz/product_service.rs:1891:FROM inventory_movements WHERE product_code
src-tauri/src/biz/product_service.rs:4119:FROM inventory_movements WHERE product_code
src-tauri/src/biz/integrity_service.rs:583:FROM inventory_movements WHERE product_code
src-tauri/src/biz/integrity_service.rs:635:FROM inventory_movements im
src-tauri/src/biz/inventory_service/common.rs:296:FROM inventory_movements WHERE product_code
src-tauri/src/biz/inventory_service/returns.rs:461:FROM inventory_movements WHERE product_code
src-tauri/src/biz/inventory_service/receiving.rs:521:FROM inventory_movements WHERE product_code
src-tauri/src/biz/stocktake_service.rs:1192:FROM inventory_movements WHERE product_code
src-tauri/src/db/stocktake_repo.rs:597:FROM inventory_movements im
src-tauri/src/biz/inventory_service/disposal.rs:369:FROM inventory_movements WHERE product_code
src-tauri/src/db/inventory_repo.rs:170:FROM inventory_movements
src-tauri/src/db/inventory_repo.rs:194:FROM inventory_movements
src-tauri/src/db/inventory_repo.rs:405:FROM inventory_movements WHERE product_code
$ rg -n 'FROM inventory_movements( ORDER BY id)?"' src-tauri/src
src-tauri/src/biz/csv_import_service/tests/commit_tests.rs:13:        conn.query_row("SELECT COUNT(*) FROM inventory_movements", [], |row| {
src-tauri/src/biz/product_service.rs:2387:            .query_row("SELECT COUNT(*) FROM inventory_movements", [], |row| {
src-tauri/src/biz/integrity_service.rs:325:        conn.query_row("SELECT COUNT(*) FROM inventory_movements", [], |row| {
src-tauri/src/biz/integrity_service.rs:350:                 FROM inventory_movements ORDER BY id",
src-tauri/src/db/schema_time_evidence.rs:195:             FROM inventory_movements",
src-tauri/src/db/schema_time_evidence.rs:311:                    is_voided, created_at FROM inventory_movements ORDER BY id",
src-tauri/src/db/schema_time_evidence.rs:876:        let max_movement = int(&conn, "SELECT MAX(id) FROM inventory_movements");
src-tauri/src/biz/inventory_service/manual_sale.rs:431:            .query_row("SELECT COUNT(*) FROM inventory_movements", [], |r| r.get(0))
src-tauri/src/biz/inventory_service/manual_sale.rs:456:            .query_row("SELECT COUNT(*) FROM inventory_movements", [], |r| r.get(0))
```

上の 16 + 9 = 25 か所:

| 分類 | 所 | 数 | 理由・直し方 |
|---|---|---|---|
| 書き換える（参照先でも絞る） | `inventory_service/common.rs:296`（`AND reference_type = 'receiving_record'`）、`disposal.rs:369`（`AND reference_type = 'disposal_record'`）、`returns.rs:461`（`AND reference_type = 'return_record'`） | 3 | 商品を T3 の「書き換える」helper で作るので、同じ商品に `reference_type` NULL の初期在庫の movement が増える。今の形のままでは `common.rs:293` は `reference_type` を `String` で読んで NULL の行で panic し、`disposal.rs:367` は最初の行が初期在庫になり、`returns.rs:442`〜`:466` は件数が 1 になる。期待（`(5, 15, receiving, receiving_record, 42, テストメモ)`、`(-5, disposal)`、0 件）は変えない |
| 変えない（期待は同じ、fixture 側を直す） | `cross_feature_tests.rs:306`（商品ごとの和） | 1 | World（`:86`〜`:100`）の自分の初期在庫の INSERT を消す（T3）。和は同じ |
| 変えない（種類・数量で絞る、または前後の差） | `stocktake_service.rs:1192`（`movement_type = 'stocktake'`）、`legacy_stop_tests.rs:261`（`quantity=-2`）、`manual_sale.rs:431`・`:456`（前後の件数）、`commit_tests.rs:13`（`write_surface` の前後の比較） | 5 | 初期在庫の movement（`receiving`・正の数量）は当たらないか、前後で同じ |
| 変えない（削除） | `receiving.rs:521` | 1 | 商品を消す前の DELETE。初期在庫の movement も一緒に消え、後の期待は同じ |
| 変えない（初期在庫の movement を足さない fixture・code） | `integrity_service.rs:583`・`:635`・`:325`・`:350`（T3 の除外）、`schema_time_evidence.rs:195`（時点証拠の migration の code）・`:311`・`:876`（同 test。在庫 0 の `seed_product` と `seed_legacy_fixture`）、`inventory_repo.rs:405`（`max_movement_id`。test は在庫 0 の `seed_product`） | 8 | movement が増えない |
| 変えない（production の商品登録・商品 CSV の test） | `product_service.rs:1891`・`:4119`・`:2387` | 3 | helper を使わず `create_product`・`commit_import` で作る。件数 1・数量 10・巻戻しの 0 は今と同じ（E3 が新しい振舞いを足して見る） |
| 変えない（production の読取り・seed） | `seed_demo.rs:394`、`stocktake_repo.rs:597`（参照先で絞る）、`inventory_repo.rs:170`・`:194`（和の関数。S2 で関数ごと消える。T6） | 4 | test でない |

### T6 契約の変更で期待を変える test（S2・S6）

| test | 今の期待 | 変える理由（正本） | 新しい期待 |
|---|---|---|---|
| T1 の `migration.rs:1629`・`:1542` | 上の T1 | 22 §19 手順 1・6 | 上の T1 |
| `src-tauri/src/db/inventory_repo.rs` の `sum_movements_*` の test 5 本（`:847`〜`:993`） | 和の関数の値 | 関数を消した（36 の「突合の相手を SUM にしない」） | 同じ和の意味を L1 で確かめる（消す 5 本の case〈無効の除外・movement なし〉を L1 の case に入れる） |
| `src-tauri/src/db/inventory_repo.rs` の `update_stock_quantity` の test（`:768`・`:786`・`:807`） | 数だけを書く | 写しの 4 項目を書く（21） | 同じ値と、範囲つきの書込みの case |
| `test_find_all_stock_quantities_req301`（`product_repo.rs:2569`） | 3 つ組 | 写しの 4 項目の行（S2） | 同じ商品の同じ値 |
| `integrity_service.rs` の test（`movements_sum`・`difference`・adjustments の完全一致。`rg -n 'movements_sum|difference|old_stock' src-tauri/src/biz/integrity_service.rs` の test の行） | 和との差 | 36 の型の形 | `copy`・`derived`・`differing_fields`、`before`・`after` の同じ値 |
| `src/features/integrity-check/IntegrityCheckPage.test.tsx` の差の語と `movements_sum` の行（`rg -F -c` で `システム在庫が多い` 2・`入出庫の合計が多い` 2・`入出庫の合計` 7・`movements_sum` 1） | 差の Badge と和 | 75 の注記 | U1〜U5・U7 の語と形 |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| DB の版（vL） | 直前の版 | 起動の migrate の中 | 版 = vL、列・表あり | — | — | 次の起動で再適用しない | 再起動で同じ版 | 止まる DB・TX の中の失敗で何も変わらない | 作り直しの後に起動して当たる | M1〜M9 |
| 写し（4 項目） | 作った時の値 | 書込みの TX の中 | 求め直しの値 | 計数・movement の追加 | 次の書込みの TX で求め直す | 画面を開き直しても写しを読む | 再起動で同じ | 上限の外・phase=1 で TX 全体が戻る | 直した入力で再送 | L1〜L14、E1、E3 |
| `stock_after` | INSERT の仮の値 | 求め直しの前 | その呼出しの写しの値 | 後入力で前の記録が入っても書き換えない | — | — | — | TX 全体が戻る | — | E1 |
| 整合性の画面 | idle | running | 差異なし / 一覧 | 補正の後 | 「再度チェック」 | 開き直しで idle と移行の知らせ | — | command の失敗の今の表示。ログの読取りの失敗は知らせを出さない | 再度チェック | U1〜U8 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 写しを書く経路（`update_stock_quantity`） | `rg -n 'update_stock_quantity\(' src-tauri/src --glob '!*test*'` の 4 か所と定義 | 4 か所とも `recompute_stock` へ | `update_stock_quantity_with_revision`（時点証拠の `#[cfg(test)]`、(b) で外す） | AC4 |
| 在庫を動かす書込み（`apply_stock_change` の呼出し） | `rg -n 'apply_stock_change\(' src-tauri/src` の production 5（4 業務・旧 Z004） | 5 とも業務日を渡す | — | E1・E4・W6 |
| 初期在庫の movement（`reference_type` NULL） | `product_service.rs:273`〜`:285`・`:1574`〜`:1590`、`seed_demo.rs:398`、在庫つきの商品の fixture（下の T3・T4） | production と demo は業務日を付ける。fixture は T3・T4 の「書き換える」 | T3・T4 の「変えない」（`integrity_service.rs:256` の写しと記録をわざと食い違わせる fixture ほか、理由は表） | E3、M2、T3〜T5 |
| 業務日の検査（`validate_date`） | `sales_service.rs:507` と 4 業務の `create_*`（movement を作らないレジ処理済みの返品・交換を含む） | 31 の「業務日の形と暦の検査」の共有の関数 1 つへ | — | W1〜W5・W7 |
| 操作ログの `integrity_fix` の読取り | `OperationLogsPage.tsx:96`〜`:139` | 新しい形を足し、記録済みの形を残す | `integrity_check` の画面の表示は今のまま（74 に専用の表示が無い） | U6 |

## Negative Paths

- missing input: header の日付が空（W1）。
- invalid input: 形の違う日付・実在しない日付（W1〜W4・W7。vL が写す既存の記録の日付は M4）、`count_value` の負・`count_kind` の外（M7）、印と範囲の食い違い（M8）。
- duplicate/ambiguous input: 同じ日付の既定の計数の衝突（L8）と同値（L9）、同じ要求の同じ商品の明細 2 行（E1）。
- unknown reference: 参照先の無い movement（M4）、存在しない商品・明細の FK（M7）。
- dependency missing: `phase = 1` の求め直し（L12）。
- permission/write failure: vL の COMMIT の失敗（M9）。
- dry-run side effect: `derive_stock` が写しを書かない（L12・I1 で写しの不変を見る）。

## Boundary Checks

- threshold: 在庫の上限 `999999999` と 1 つ外（L13・M5）。
- null/default: `stock_recheck` 0 と範囲 NULL の既定（M8）、`settlement_no` NULL と phase 0（M2・W4）、fresh の `seen_movement_id` 0（L3 の境の case に id 0 を含める）。
- empty/non-empty: movement の無い商品（L1）、計数の無い商品（L1）、違いの無い DB の移行（M6）。
- min/max: 範囲の端 `-999999999`・`999999999`（L13）。
- status/policy enum: `count_kind`（M7）、`IntegrityField`（I3）。
- wire type: `StockCopy` の bool と Option（U7）。
- internal type: `DerivedStock.range` の (lo, hi) の順（L10）。
- producer/consumer: 36 の型 → bindings → 画面（U7）、操作ログの JSON → parser（U6）。
- round-trip token: 業務日の形の検査（W1・W5。chrono が読んで同じ文字列に書き戻す `-0001-04-07`・`+10000-04-07` を形で拒む）。
- precision/range: i64 の和の `checked_add`（L13 に和の溢れの case）。
- cross-language parse: 操作ログの数は `Number.isSafeInteger`（U6、今の型）。

## Compatibility Checks

- old schema/input: 直前の版の DB（M2〜M6）、記録済みの操作ログの形（U6）。
- new schema/input: 空の DB（M1）。
- output order: `differing_fields` の順（I3）、理由の順（L11）。
- optional field behavior: `StockCopy` の範囲の NULL（U1 の「要再確認」の無い値）。

## Data Safety Checks

- source-derived data: 無い（全部合成）。
- generated outputs: `src/lib/bindings.ts`・`docs/function-design/90-traceability.md`（再生成で一致）。
- secrets: 無い。
- local-only files: owner の L3 用の DB（作り直しは消さずに移す。packet の Data Safety）。
- synthetic sample boundaries: 商品コード・JAN・日付は合成の値。

## Main Wiring / Integration Checks

- helper connected to main path: `apply_stock_change` が `recompute_stock` を呼ぶ（E1）、`fix_integrity` が `recompute_stock` を呼ぶ（I4）。
- output reaches manifest/report: 移行の記録が操作ログに入り、画面が読む（M6・U8）。
- effective config reaches runtime: migration の登録（M1 は `init_database` で作った DB）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → U7（`copy` と `derived` の入替え）。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → E1（`stock_after` の途中の値）、I4（補正の前後）。
- If a key branch is inverted, which test fails? → L2（`E < D` と `E > D` の入替え）、L3（`i ≤ m` を `i < m` に）、L7。
- If a threshold comparison changes, which test fails? → L13・M5（`<=` と `<`）。
- If a guard is removed, which test fails? → L12（phase=1）、W1・W7（形の検査）、M3・M4（止まる検査）。
- If an output field is omitted, which test fails? → I5・I6・M6（ログの key）、U1。
- If output order changes, which test fails? → I3・L11。
- If dry-run performs a side effect, which test fails? → I1（`derive_stock` の後の写しの不変）。
- If a JSON number crosses JavaScript safe integer range, which test fails? → 該当なし（数は `999999999` 以内。U6 は今の `isSafeInteger` の検査を保つ）。
- If a state token is round-tripped through browser/client code, which test fails? → 該当なし（route / search の状態を変えない）。
- 実注入: Final Review は L2・L3・L13・E1・M2（sequence）・I2 の production 側を 1 つずつ変えて red を実測する（`docs/DEV_WORKFLOW.md` Contract Audit の Mutation / anti-tautology check）。

## Residual Test Gaps

- Windows の実機の DB での vL の当たり方・止まり方は L3-1 だけ（自動 test は合成の DB）。
- 差異ありの一覧・移行の知らせの見た目は自動 test と画面の写しで、L3 に入れない（DB の手での改変が要る）。
- 精算（phase = 1）の窓・理由 1 は (b) の test（本 lane は L12 で「誤りで止まる」だけ）。
