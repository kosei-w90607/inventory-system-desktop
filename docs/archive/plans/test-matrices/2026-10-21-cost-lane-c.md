# Test Design Matrix: 原価の lane（C）— 原価の 1/100 円と巻・cm を外す起点の migration（vB）

対象 packet: [2026-10-21-cost-lane-c](../2026-10-21-cost-lane-c.md)。基準版は `6a25f63f`（main）。oracle は設計正本（[共通規則](../../../function-design/10-common-rules.md) SPEC-UNIT-D1・D5・D6・D10、[22](../../../function-design/22-mnt-migration.md) §16、[51](../../../function-design/51-ui-product-form.md) UI-01b-D22・D24、[77](../../../function-design/77-ui-bulk-price-revision.md) の新原価〈案〉）の例と規則から写し、実装の定数から写さない。

## Risk

Risk: R3

## Contracts Under Test

- MNT-03-D14（vB）: 原価の列を持つ 5 つの表に行の無い DB にだけ当たり、6 列を `_centi` に改名し、`products` を作り直して `stock_unit` の CHECK を 10 個にする。行のある DB は何も変えずに止まり、原因と直し方を名指す（22 §16 手順 1〜6、packet の Y10）。
- 22 §16 の作り直しの手順: アプリの data の folder と作業フォルダの旧 DB を移した後の起動は、取込みも復元の補完も起こさず空の DB で vB まで当たる。
- SPEC-UNIT-D5 と「入力の上限と安全な整数の範囲」の原価の行: 原価は 1/100 円の整数で `0`〜`99999999`。入力は浮動小数を通さない。表示は割り切れれば円の整数、そうでなければ小数 2 桁（記号は半角の `¥`。今は全角の `￥` と `1,000 円` の形の画面もある）。補助は `P ÷ n` を 1/100 円未満で四捨五入（packet の Y1〜Y3・Y5）。
- SPEC-UNIT-D6: 行の金額は 1/100 円の原価をそのまま `cost_line_centi` に渡して求め、合計は今の丸めと安全な整数の検査（Y4）。
- 31 §12.3・§12.8: 原価差分は 1/100 円どうしの完全一致、fingerprint の原価は 1/100 円の十進の文字列（Y6・Y7）。
- 77 の新原価（案）と現掛率（Y8）。
- SPEC-UNIT-D1・D9・D10・D11: 単位は 10 個で、DB の CHECK・enum・bindings・formatter・商品 CSV の `在庫単位`・select・在庫少の並びが同じ一覧（Y9）。
- D-128: 原価の label と価格の節の説明は税抜。

## Failure Modes

- FM1: vB が行のある DB で何か（列名・CHECK・版・`foreign_keys`）を変える、または止まりの文が原因と直し方を出さない。
- FM2: vB の作り直しが `products` の列の定義（型・NOT NULL・既定値・並び）・`products` 自身の外部キー・`tax_rate` の CHECK・§19 の写しの 3 列とその CHECK・`products` の index・子の表の外部キーを落とす。
- FM3: DB の CHECK と enum の一覧が食い違う（片方だけが `roll`・`cm` を持つ）。
- FM4: 円の値が 1/100 円の列・wire に入る（`* 100` の取り残し、円の上限 `999999` で検査する）、または 1/100 円の値を円として出す（`¥8,333`）。
- FM5: 原価の解析・補助が浮動小数を通る（`0.29` → 28、`1.15` → 114、`1000` ÷ 12 → 83.34）、`.5` の境界で切り捨てる。
- FM6: 原価の上限の境界がずれる（`99999999` を拒む、`100000000` を受ける）。
- FM7: 補助の袋の値段・入り数が DB か wire に出る、開き直すと前の値が残る、長さの単位の商品で補助が出る。
- FM8: 原価差分を円と 1/100 円で比べる（83.33 と 83 を同じとみなす）、fingerprint が 83.33 と 83.34 を区別しない。
- FM9: 新原価（案）が 1 円未満を出す、現掛率が 100 倍ずれる。
- FM10: `roll`・`巻`・`cm` を商品 CSV が受ける、select に出る、在庫少の並びから単位が漏れる。
- FM11: 既存の test を期待を弱めて通す（版の期待を消す、境界の値を緩める、`cm` の case を `m` の case なしで消す）。
- FM12: 作り直しの後の起動で作業フォルダの旧 DB が取り込まれる、確定済みの復元の記録が新しい DB の操作ログに書かれる。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。helper 名だけで実 router / integration と分類しない。
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。状態 reset なら初回 mount に加え同値再選択等の別経路を確認し、対象契約が行使されるものを選ぶ。
- oracle の anchor は定義文にしか現れない literal を選び、`rg -c` で対象 file 内 1 件を file ごとに確かめる（複数 file を 1 本の `rg` で数えない）。不変の guard にも感度の実測行を置き、文言を改訂した後は「新しい文言が exact で 1 件 + 旧い文言が 0 件」の対にする。
- oracle は検証対象と独立の正本から転記し、mutation は production 側だけを変える。
- 結果を空にする注入で、期待が空集合の case だけが kill を主張していないかを確かめ、各組合せに非空の期待を 1 件置く。

test の名前は実装の Writer が REQ・契約 ID を付けて決め、PR の本文にこの表の ID との対応を書く（下の名前は目安）。

B の test は `schema_v{N}.rs` の test の定数 `VB_VERSION`（vB の番号。1 か所）を使い、vB の前の版の DB を `migrate_up_to(&conn, VB_VERSION - 1)` で作る。並走の migration が先に merge して番号を取り直すとき、B の test で直すのはこの定数だけ（file 名・`migrations()` の登録・T1 の版の期待は packet の所有表のとおり）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| MNT-03-D14 手順 3（B1） | FM4 | schema（Rust） | `test_migration_req903_vb_fresh_database_renames_cost_columns` | `init_database` の新規の DB で、6 列の新しい名前（`cost_price_centi`・`valuation_cost_price_centi`・`old_cost_centi`・`new_cost_centi`）が `pragma_table_info` に無いか、古い名前が残る。版が vB の番号でない |
| MNT-03-D14 手順 4（B2） | FM2 | schema（Rust） | `test_migration_req903_vb_rebuild_keeps_columns_indexes_and_fk` | `VB_VERSION - 1` で止めた空の DB に vB を当てた後の `products_definition`（`src-tauri/src/db/migration.rs` の test の helper: `pragma_table_info('products')` の全列〈名前・型・NOT NULL・既定値・pk〉、`pragma_foreign_key_list('products')`〈`departments`・`suppliers` への外部キー〉、`products` の index の名前と `sql`）が、当てる前の値の `cost_price` の名前だけを `cost_price_centi` に差し替えた期待と違う（§19 の 3 列の位置を含む）。`receiving_items`・`disposal_items`・`stocktake_items`・`price_history`・`stock_counts` ほか `products` を参照する表の `pragma_foreign_key_list` のどれかが変わる。helper は vB の test から呼べる所へ移す（`#[cfg(test)]` の `pub(crate)`。置き場は着手時に Writer が決める） |
| MNT-03-D14 手順 4・SPEC-UNIT-D1（B3） | FM3 | schema（Rust） | `test_migration_req903_vb_check_codes_match_enum` | vB の SQL の `CHECK(stock_unit IN (…))` が `ProductStockUnit::ALL` から組んだ文字列と違う。最新の版の DB で 10 個の code の INSERT のどれかが拒まれ、`roll`・`cm`・`kg` のどれかが受かる |
| MNT-03-D14 手順 2（B4） | FM1 | schema（Rust） | `test_migration_req903_vb_stops_on_rows_in_each_table_without_changes` | 5 つの表のどれか 1 つだけに 1 行ある `VB_VERSION - 1` の DB（表ごとに 1 case。子の表の行は `foreign_keys = OFF` で入れる）で、vB が成功する、message が手順 2 の文（`商品か原価の記録がある DB はこの版へ移せません。原価を 1/100 円で持つ版は空の DB から始めます。開発・試験 DB は作り直してください（22 §16 の作り直しの手順）: {表名}`）と完全に一致しない、schema（6 列の名前と `products` の定義）・版・`PRAGMA foreign_keys` のどれかが変わる |
| MNT-03-D14 手順 2（B5） | FM1 | schema（Rust） | `test_migration_req903_vb_stop_message_lists_all_tables_with_rows` | `products` と `price_history` に行のある DB で、message の表名が片方だけ（`products・price_history` の形でない） |
| MNT-03-D14 手順 5・6、MNT-03-D1（B6） | FM1 | schema（Rust） | `test_migration_req903_vb_verify_or_commit_failure_rolls_back` | 手順 5 の検証の失敗と COMMIT の失敗（`migration_tx::fail_operations` の failpoint）で、6 列の名前・CHECK・版のどれかが残る、`foreign_keys` が元の値に戻らない |
| MNT-03-D14（B7） | FM1 | schema（Rust） | `test_migration_req903_vb_rerun_is_noop` | `migrate` を 2 回呼ぶと vB の版の行が 2 つになる、または 2 回目が失敗する |
| §19 の CHECK を写す（B8） | FM2 | schema（Rust） | `test_migration_req903_vb_keeps_stock_range_check` | vB の後の `products`（列は `cost_price_centi`）に `stock_recheck = 1`・範囲 NULL の行、または `stock_range_low > stock_range_high` の行を入れられる、またはその error の文に `CHECK constraint failed` が無い。対照: 同じ INSERT の範囲を正しくした行（`stock_recheck = 1`・`stock_range_low <= stock_range_high`）が通らない（列名の誤りで常に失敗して緑になるのを止める） |
| MNT-03-D14 手順 4（B10） | FM2 | schema（Rust） | `test_migration_req903_vb_keeps_tax_rate_check` | vB の後の `products`（列は `cost_price_centi`）に `tax_rate = '5'` の行を INSERT できる、またはその error の文に `CHECK constraint failed` が無い（作り直しで `CHECK(tax_rate IN ('10','8','0'))` を落とした。`pragma_table_info` に CHECK は出ないので B2 では見えない）。対照: 同じ INSERT の `tax_rate = '10'` の行が通らない。既存の helper `can_insert_unit`（`migration.rs`）は旧い列名 `cost_price` で書くので、vB の後の DB には写さない（T2a） |
| MNT-03-D16 の規則（B9、§18 が先に merge したときだけ） | FM2 | schema（Rust） | §18 の lane の「最新の版までの migrate の後に 3 つの trigger がある」test | vB の後に `product_jan_aliases` の 3 つの trigger のどれかが `sqlite_master` に無い（§18 が後なら、この行は §18 の lane の義務） |
| 22 §16 作り直しの手順 (i)（R1） | FM12 | integration（Rust、起動） | `test_startup_req903_rebuild_moves_app_data_and_legacy_db_then_empty_vb` | 作業フォルダに行のある旧 DB、`{app_data}` に行のある DB がある状態から、両方を移して `prepare_database_with_init` で起動すると、取込みが起きる、空の DB でない、vB まで当たらない |
| 22 §16 作り直しの手順 (ii)（R2） | FM12 | integration（Rust、起動） | `test_startup_req903_rebuild_with_committed_manifest_writes_no_restore_log` | `{app_data}` に確定済み（phase = committed）の manifest と行のある DB がある状態から `{app_data}` を丸ごと移して起動すると、新しい DB の `operation_logs` に `backup_restore` の行がある |
| 22 §16 作り直しの手順 (iii)（R3） | FM1 | integration（Rust、起動） | `test_startup_req903_vb_stop_after_earlier_commit_backup_path_readable_from_copy` | 行のある v7 の DB（既定でない `backup_path`、棚卸し・Z004 の行なし）を起動すると v8・v9 が COMMIT した後に vB で止まり、写しを読み取りだけで開いた `SELECT value FROM app_settings WHERE key='backup_path'` が保存先を返さない、または元の DB の file が変わる |
| 22 §16 作り直しの手順の対照（R4） | FM12 | integration（Rust、起動） | `test_startup_req903_unmoved_legacy_db_is_imported_and_vb_stops` | 作業フォルダの旧 DB を移し忘れた状態で、取込みが起きずに空の DB で開く（対照が対照にならない） |
| SPEC-UNIT-D5 上限・BIZ-01（C1） | FM6 | unit（Rust） | `test_product_req101_cost_centi_upper_bound` | create・update・価格改定で、原価 `99999999` が拒まれる、`100000000` が受かる（文 `原価が大きすぎます`）、負が受かる |
| SPEC-UNIT-D5 上限・BIZ-02（C2） | FM6 | unit（Rust） | `test_receiving_disposal_req201_req204_item_cost_centi_upper_bound` | 入庫・廃棄の明細で、`99999999` が拒まれる、`100000000` が受かる（文 `明細{n}: 原価が大きすぎます`） |
| SPEC-UNIT-D5 上限・BIZ-01-D8（C3） | FM6 | unit（Rust） | `test_import_req104_cost_centi_upper_bound_preview_and_commit` | 商品 CSV の preview で `999999.99` が行の error になる、`1000000` が通る。commit の再検証が `100000000` の `ImportRow` を通す（commit は新規の行か、既存の商品のある上書きの行で確かめる。商品の無い上書きの行は再検証せずに skip するので観測できない） |
| SPEC-UNIT-D6（C4） | FM4 | unit（Rust） | `test_receiving_req201_line_cost_uses_centi_directly` | 原価 8333・数量 3 の個数の商品の行の金額が `"24999"`、合計が `250` でない。原価 8333（1 m あたり）・数量 130 の `m` の商品の行が `"10833"`、合計が `108` でない（`* 100` が残れば 100 倍） |
| SPEC-UNIT-D6（C5） | FM4 | unit（Rust） | `test_record_detail_req206_line_amounts_from_centi` | 入庫・廃棄の記録詳細（`list.rs`）の行の金額と合計が C4 と同じ値でない |
| 共通規則 (c)（C6） | FM6 | unit（Rust） | `test_receiving_disposal_req903_total_safe_integer_with_centi_limits` | 上限の明細（数量 `9999999`、原価 `99999999`）900 行の入庫・廃棄が通らない（合計 `8999999010000009` 円）、901 行（`9009999008900009` 円）が `合計金額が大きすぎます` にならない |
| SPEC-UNIT-D10・Y2（C7） | FM5・FM6 | unit（Rust） | `test_import_req104_cost_column_parses_two_decimals` | `原価` の `83.33` → 8333、`1000` → 100000、`0` → 0、`0.5` → 50、`999999.99` → 99999999 のどれかが違う。`83.333`・`1e3`・`+5`・`.5`・`5.`・空が SPEC-UNIT-D5 の文 `原価は0以上で、小数は2桁までで入力してください` にならない（今の `原価が不正です` が残る）。`-1`・`-0` が `原価は0以上で入力してください` にならない（今の preview の負の文を保つ。packet の Y2 の分け方）。`i64` に収まらない `99999999999999999999` が `原価が大きすぎます` にならない |
| 31 §12.3（C8） | FM8 | unit（Rust） | `test_receiving_req209_cost_diff_compares_centi` | 商品の原価 8333 に入庫の原価 8334 で差分が出ない、8333 で差分が出る。`CostDiff` の `master_cost_price_centi`・`received_cost_price_centi` が 8333・8334 でない |
| 31 §12.8（C9） | FM8 | unit（Rust） | `test_receiving_req201_fingerprint_distinguishes_centi_cost` | 同じ idempotency key で原価 8333 と 8334 の要求が同じ fingerprint になる（冪等の再送と扱われる） |
| SPEC-UNIT-D5 入力（C10） | FM5・FM6 | unit（TS） | `parseCostInput` の golden | `83.33` → 8333、`1000` → 100000、`0`・`0.00` → 0、`0.29` → 29、`1.15` → 115、`4.35` → 435、`999999.99` → 99999999、` 83.33 ` → 8333 のどれかが違う。`1000000` が `"too_large"` でない。`83.333`・`1e3`・`-1`・`+5`・`.5`・`5.`・空が null でない |
| SPEC-UNIT-D5 表示（C11） | FM4 | unit（TS） | 原価の formatter と入力の欄の初期値の golden | 100000 → `¥1,000`、8333 → `¥83.33`、5 → `¥0.05`、10 → `¥0.10`、0 → `¥0`、99999999 → `¥999,999.99` のどれかが違う。初期値の文字列 100000 → `1000`、8333 → `83.33`、5 → `0.05`、10 → `0.10`、0 → `0` のどれかが違う |
| 往復（C12） | FM4 | unit（TS） | 初期値の文字列の往復 | C11 の各値で `parseCostInput(初期値の文字列(x))` が x に戻らない |
| UI-01b-D24・SPEC-UNIT-D5 補助（C13） | FM5 | unit（TS） | `unitCostFromPack` の golden | `"1000"` ÷ `"12"` → 8333、`"0.29"` ÷ `"2"` → 15、`"1"` ÷ `"3"` → 33、`"0.05"` ÷ `"2"` → 3（2.5 の切り上げ）、`"0.04"` ÷ `"3"` → 1、`"999999.99"` ÷ `"1"` → 99999999 のどれかが違う。入り数 `"0"`・`"1.5"`・空・`"10000000"` が error でない（D-119 の Matrix の golden を写した） |
| UI-01b-D22・D24、D-128（C14） | FM7 | RTL | `ProductForm cost centi, label and pack helper` | 個数の単位で補助が出ない、`m` で出る（create で `m` に変えた後も開いたまま）。「原価に入れる」の後に原価の欄が `83.33` でない、保存の request に袋の値段か入り数が入る、request の `cost_price_centi` が 8333 でない。閉じて開き直した 2 つの欄が空でない。label が `原価（税抜、必須）`・`原価（税抜、必須、1 m あたり）`、価格の節の説明が UI-01b-D22 の文でない。修正の画面を原価 8333 の商品で開くと欄が `83.33` でない |
| 77（C15） | FM9 | unit（TS）+ RTL | 新原価（案）と現掛率 | 現原価 8333・現売価 100・新売価 110 で新原価（案）が 9100 でない（77 の例）。現原価 8500・現売価 100・新売価 110 で 9300 でない。現掛率が `83.3`・`85.0` でない。現売価 0 で案が現原価、掛率が `—` でない。RTL: 現原価 8333・現売価 100 の行で新売価 `110` を入れたとき、新原価の欄が `91`（SPEC-UNIT-D5 の入力の欄の初期値の文字列。`9100` でない）でない、確定で送る値が `new_cost_price_centi: 9100` でない。現売価 0・現原価 8333 の行で新売価を入れたとき、新原価の欄が `83.33` でない。現原価 8349・現売価 100・新売価 120 で新原価（案）が 10000 でない（原価を円に丸めてから掛けると 9900 になり red。C15 の 8333 の例は丸めても 9100 になり止められない） |
| UI-02-D7・D15（C16） | FM4・FM8 | RTL | 入庫の原価の初期値・送信・原価差分の dialog | 原価 8333 の商品を行に足したときの欄が `83.33` でない、送る `cost_price_centi` が 8333 でない。dialog がマスタ原価 `¥83.33`・今回の実原価 `¥85` を出さない、更新が `new_cost_price_centi: 8500` を送らない |
| UI-05-D8・共通規則 (c) の TS の twin（C17） | FM4 | unit（TS）+ RTL | 廃棄の原価の初期値・合計の BigInt | 上限の明細 11 行と原価 `0.38`（38）・数量 1 の 1 行の合計が `109999987900000` 円でない（1/100 円の和 `10999998790000049`）。同じ明細に原価 `1000000`（`parseCostInput` が `"too_large"`）の行と `83.333`（null）の行を足すと、合計が変わる、または `calculateLossTotal` が投げる（その 2 行は 0 として数える）。候補の一覧の原価が `¥83.33` の形でない |
| 棚卸し記録詳細のロス原価（C18） | FM4 | RTL | 評価原価とロス原価の表示 | 評価原価 8333 が `¥83.33` でない。評価原価 99999999・差異 -999999999 のロス原価が `999,999,989,000,000.01 円` でない（number の積なら丸まる） |
| SPEC-UNIT-D5 表示（C19） | FM4 | RTL | 在庫照会の詳細の原価 | 原価 8333 の商品の詳細（`StockDetailContent`）の「原価」の行が `¥83.33` でない、または `8,333` を含む（formatter を替え忘れると `￥8,333`） |
| SPEC-UNIT-D5 表示（C20） | FM4 | RTL | 価格の履歴の原価 | 原価 8333 → 8500 の履歴の行（`PriceHistorySection`）の原価の cell が `¥83.33 → ¥85` でない、または `8,333` を含む |
| 30 §4.4・§4.4.1、31 の入庫・廃棄の処理ステップ（C22） | FM6 | unit（Rust） | 原価の上限の検査の順 | 存在しない商品コードへ原価 `100000000` の更新・価格改定が `NotFound` でない（`ValidationFailed` になる: 原価の検査を商品の取得より前へ動かした）。原価だけ `100000000` に変えた要求を、保存済みの入庫・廃棄と同じ冪等キーで送ると `IdempotencyConflict` でない。どちらも DB が変わらない |
| SPEC-UNIT-D5 表示（C21） | FM4 | RTL | 価格改定の現原価 | 現原価 8333 の商品の行（`PriceRevisionTable`）の現原価の cell が `¥83.33` でない、または `8,333` を含む |
| SPEC-UNIT-D1・D11（U1） | FM3 | unit（Rust） | `finite_enum_contract_tests` の `ALL` | `ALL` が 10 個でない、重複がある、`from_code("roll")`・`from_code("cm")` が `None` でない |
| SPEC-UNIT-D1・D4（U2） | FM3 | unit（Rust） | `unit_amount` の種類と基準数量の golden | 10 行（個数 9 は基準 1、`m` は 100）のどれかが違う |
| SPEC-UNIT-D10（U3） | FM10 | unit（Rust） | 在庫少の 2 つの並び | 個数の並びが 9 個、長さの並びが `[M]` でない、和が `ALL` と違う |
| SPEC-UNIT-D10（U4） | FM10 | unit（Rust） | `test_import_req104_stock_unit_accepts_ten_codes_and_words` | 10 個の code と 10 個の語のどれかが通らない、`roll`・`巻`・`cm` のどれかが行の error にならない。行の error の文が、`cm` は `在庫単位が正しくありません: cm（長さは m で入れてください。初期在庫も m の数〈cm の数を 100 で割る〉にしてください）`、`巻`・`roll` は `在庫単位が正しくありません: 巻（巻で数える商品は 個 で入れてください。数は変わりません）`・`…: roll（…）` でない。一覧に無いほかの値（`kg`）の文が今の `在庫単位が正しくありません: kg` から変わる。commit の再検証（wire の `ImportRow.stock_unit = "cm"`）の文が preview と同じ `retired_stock_unit_hint` の文でない（T3 の commit の `cm` の case） |
| SPEC-UNIT-D9（U5） | FM10 | unit（TS） | `format-stock-display`・`unit-quantity` の 10 個の表 | `STOCK_UNIT_LABELS` が 10 個でない、`priceBasisQuantity`・`isLengthUnit` が 10 個の表と違う |
| UI-01b-D22・D23（U6） | FM10 | RTL | `StockUnitField` の select | create の select が 10 個（個・枚・本・袋・箱・組・セット・玉・丁・m の順）でない、edit の個数の単位の商品の select が 9 個でない |

## 既存の test の移し方（T1〜T5）

実装の Writer は着手時に各 command を逐語で回し、下の表と違えば表を直してから進める（AC8）。「書き換える」「変えない」の所で意味の期待（境界の位置、件数、message、行の error の有無）を変えない。

### T1 版の期待と migrate の呼び方（vB を登録すると変わるもの）

数える command: `rg -n 'migrate\(&conn\)|migrate_up_to\(' src-tauri/src` と `rg -n 'assert_eq!\(.*\b9\b' src-tauri/src/db | rg -i 'version|\bv\b|v1|v2|count'`（起票の時点の出力は `migrate(&conn)` が 34 行、版の期待の行が下の (a)〜(c) と、版と関係の無い `app_settings` の件数の 2 行〈`migration.rs`・`schema_v2.rs` の `9`〉）。`test_migration_req903_is_idempotent` の件数の `assert_eq!` は複数行に分かれていて 2 つ目の command に当たらないので、(a) の各関数は中を読んで確かめる。

| 分類 | test（file と関数） | 理由 | 変え方 |
|---|---|---|---|
| (a) 新しい番号へ書き換える（12 行） | `migration.rs` の `test_migration_req903_is_idempotent`（`v1`・`v2`・件数の 3 行）、`test_migration_req401_v4_creates_daily_report_tables_and_indexes`、`test_migration_req907_v5_seeds_all_plu_slots`、`test_migration_req907_upgrades_v4_database_and_seeds_all_plu_slots`、`test_migration_req903_v8_fresh_database_and_empty_tables` の前半の `init_database` の後の `(9, 9)`。`schema_v2.rs` の `test_v2_req903_applied_on_fresh_db`、`test_v2_req903_idempotent_rerun`（`v` の 2 行と件数）。`schema_v9.rs` の `test_migration_req903_vl_fresh_database_has_keys_counts_and_copy_columns` | 新規の DB か、5 つの表に行の無い DB（`setup_v4_only_db` は `schema_versions` にしか行を入れない）を最新の版まで当て、最新の版と件数を期待する | 版と件数を vB の番号に（件数の message の `v1+…+v9` も） |
| (b) `migrate_up_to(&conn, VB_VERSION - 1)`（vB の直前の版。B の前書きの定数を test から引ける所に置く）に替え、期待はその版のまま（8 か所） | `migration.rs` の `test_migration_req903_v3_adds_plu_target_and_backfills_valid_ean13`（`products` に 2 行）、`test_migration_req903_v8_fresh_database_and_empty_tables` の後半（行 0 の v7 の DB。期待の列の定義が `cost_price` の名前を持つ）。`schema_v2.rs` の `test_v2_req903_backfill_with_parent_child_fk`（`products`・`receiving_items` に行）。`schema_v9.rs` の `test_migration_req201_vl_backfills_business_date_and_keeps_ids_and_sequence`、`test_migration_req903_vl_stops_when_recomputed_stock_out_of_range` の成功の端の loop、`test_migration_req904_vl_fixes_copy_and_logs_trigger_migration`（2 か所）、`test_migration_req903_vl_commit_failure_rolls_back_everything` の再実行（どれも `seed_product` で `products` に行） | 行を入れてから最新の版まで当てるので vB で止まる。test の目的は v9 以前の migration で、期待は v9 の版 | 呼び方だけを替える。期待は vB の直前の版（起票の時点で 9: `(9, 9)`・`version == 9`）のまま。並走の migration が先に入って直前の版が上がったら、期待もその版にそろえる（下げない） |
| (c) 呼び方か期待を変える（2 か所） | `migration.rs` の `test_migration_req903_v8_fresh_database_and_empty_tables` の前半の 12 個の code の INSERT の loop | 最新の版の CHECK は 10 個で、`roll`・`cm` が拒まれる。loop が確かめるのは v8 の CHECK | loop を、新しい接続に `migrate_up_to(&conn, 8)` で v8 まで当てた新規の DB に移す（12 個が入り `kg` が拒まれる期待は変えない）。最新の版の CHECK は B3 が持つ |
| (c) | `migration.rs` の `test_migration_req903_v8_commit_and_fk_restore_failures` の (3) の開き直し | `init_database` が最新の版まで当てるが、`seed_v7_products_with_children` の商品と子の表の行があるので vB で止まる | 開き直しの前に、棚卸しの行を消している今の形を広げ、fixture が入れた全ての表の行を子から順に消す（`foreign_key_check` が 0 行のまま）。期待 `(9, 9)` を vB の番号に。「v8 を当て直さずに開ける」の確かめ（`foreign_keys` 1、版の行の数）は変えない |
| (d) 変えない | `migration.rs` の v6・v7 の test（`suppliers`・日報の表だけに行。最新まで当てても版を期待しない）、v8 で止まる・戻る test（`test_migration_req903_v8_fk_check_failure_rolls_back`、`test_migration_req903_v8_commit_and_fk_restore_failures` の (1)(2)(4)、`test_migration_req903_v8_limit_check_rejects_*`）、`migrate_up_to(&conn, 8)` の 3 つ、MNT-03-D11 の 2 つ（`app_max_version()` で比べる）。`schema_v9.rs` の `setup_v8_db` と v9 で止まる test。`cmd`・`biz` の `setup_db` の 5 つと `db/mod.rs` の `configure_database`（新規の DB に当ててから行を入れる） | vB に届かないか、届いても行が無く版を期待しない | — |

### T2 原価の値と名前（Rust）

数える command: `rg -c -w 'cost_price|valuation_cost_price|old_cost|new_cost|old_cost_price|new_cost_price|master_cost_price|received_cost_price|MAX_COST_PRICE' src-tauri/src src-tauri/tests | sort`（起票の時点で 34 file。多いのは `product_service.rs` 86、`migration.rs` 41、`product_repo.rs` 35、`receiving.rs` 22、`disposal_repo.rs` 20）。

| 分類 | 所 | 変え方 |
|---|---|---|
| 変えない（履歴） | `schema_v1.rs`・`schema_v8.rs` の SQL と自分の定数、`migration.rs`・`schema_v2.rs`・`schema_v9.rs` の、vB の前の版（`VB_VERSION - 1` 以下）の DB に入れる fixture（`can_insert_unit`・`seed_v7_products_with_children`・`seed_v8_limit_line_records`・v8 の上限の test の INSERT・`schema_v9.rs` の `seed_product` を v8 の DB に当てる所）。同じ file でも最新の版の DB に当てる所は下の行 | vB の前の版の DB には古い列名しか無い |
| 最新の版の DB に当てる test は列名・key を `_centi` に直す（T2a の (i)・(iii)） | `init_database`・`setup_test_db`・`setup_db` で作る DB（最新の版 = vB の後）に旧い名前で書く・読む test と helper。`migration.rs` の `test_check_constraints_req903_reject_invalid_values`・`test_foreign_key_req903_constraints`、`schema_v9.rs` の `test_migration_req205_vl_stock_counts_checks`・`test_migration_req903_vl_copy_columns_check`（`init_database` の DB に `seed_product` で書く）、`disposal_repo.rs` の `test_insert_disposal_req204_check_disposal_type` ほか T2a の表 | 名前を直す。`schema_v9.rs` の `seed_product` は v8 の DB と最新の DB の両方で使うので、最新の DB 用に `_centi` で書く形を分ける（形は Writer が決める）。失敗だけを確かめる負の INSERT は、error の文（`FOREIGN KEY constraint failed`・`CHECK constraint failed`）まで確かめるか、同じ INSERT の正しい値が通る正の対照を置く（列名の誤りで常に失敗して緑になるのを止める） |
| 名前だけ書き換える | 原価の値が金額・表示・境界の期待に効かない fixture（例: 商品を作るだけの `NewProduct { cost_price: 50, … }`） | field 名を `_centi` に。値は変えない（意味は 1/100 円になるが、どの期待にも効かない） |
| 名前と値を書き換える（1 対 1） | 原価から求める期待のある test: 入庫・廃棄の行の金額と合計（`receiving.rs`・`disposal.rs`・`list.rs`）、原価差分（`receiving.rs` の `cost_diffs` の 500・501・499）、棚卸しの評価額（`stocktake_service.rs`・`time_evidence_tests.rs`）、価格改定と価格の履歴、商品 CSV の原価の値 | fixture の円の原価 a を `a * 100` の 1/100 円にし、円の金額・合計の期待は変えない（1/100 円の行の金額の文字列の期待は 100 倍の値に変わる所だけを表にする） |
| 境界の値を書き換える | 原価の上限の test（`product_service.rs` の `1_000_000` で `原価が大きすぎます` を期待する case、`receiving.rs`・`disposal.rs` の `lim-*-cost`、v8 の上限の test を除く） | 整数の literal の `999_999`/`1_000_000` を `99_999_999`/`100_000_000` に（境界の位置は変えない: 上限は受け、1 つ外は error）。文は変えない。商品 CSV の行の文字列（`PL-EDGE,…,999999`・`PL-COST,…,1000000` 等）は円の文字列のまま ×100 せず、受ける端を `999999.99`（保存の値 99999999）、拒む端を `1000000` のままにする（TS の入力の文字列は T5 の同じ行） |
| 例外: 原価を ×100 すると `i64` に収まらない fixture（下の T2b） | `stocktake_service.rs` の `test_complete_req205_total_cost_overflow`・`test_complete_req205_total_cost_yen_overflow`（原価 `i64::MAX / 2 + 1`） | 原価の数値は保ち（1/100 円として読む）、数量を前者は `2 → 200`、後者は各 `1 → 100` にして、円の合計が `i64` を越える条件を保つ。overflow の文と rollback の assertion は変えない |

### T2b 原価を ×100 すると範囲を越える fixture の洗い出し（round 3 の是正）

数える command（round 3 の是正の時点）: `rg -n 'i64::MAX|i128::MAX|MAX_SAFE_INTEGER|9_007_199|9007199|92_233|9_223_372' src-tauri/src src-tauri/tests src --glob '!src/lib/bindings.ts'`（81 行）と `rg -n '[0-9][0-9_]{13,}' src-tauri/src src-tauri/tests | rg -i 'cost|seed_product|product\(|item\(|line\('`（15 行）、原価の上限の literal の fixture `rg -n '999_999\b' src-tauri/src/biz/inventory_service`。各 hit が原価の fixture か、×100 で `i64`・安全な整数・上限 `99999999` を越えるかを読んだ。

| 分類 | 所 | 移し方 |
|---|---|---|
| ×100 で `i64` を越える原価の fixture | `stocktake_service.rs` の `test_complete_req205_total_cost_overflow`・`test_complete_req205_total_cost_yen_overflow`（原価 `i64::MAX / 2 + 1`） | T2 の例外の行（原価の数値を保ち、数量を ×100） |
| 円の原価を渡す test の helper（変えない） | `unit_amount.rs` の test の `line(…)`（`i64::MAX`・`92_233_720_368_547_759`・`1 << 62`・`1 << 60`・`999_999` の原価。helper が中で ×100 する。AC4 の 1 行） | 変えない（35 §20.5a の円の golden） |
| ×100 しても上限の中の原価の fixture | `receiving.rs`・`disposal.rs`・`list.rs` の上限の明細（原価 `999_999`: `LIM-*`・`X8-*` の 900 行と 901 行・`am-limit`）、TS の `receiving-request.test.ts`・`disposal-request.test.ts` の原価の文字列 `"999999"`（円の文字列のまま） | T2 の「名前と値」の 1 対 1（`999_999` → `99_999_900`。上限 `99_999_999` の境界の行は当てない）。行の金額の文字列（`"999998900000100"`）と円の合計（`8_999_990_100_000_900` 等）の期待は変わらない。上限の端を確かめる case だけが境界の行 |
| 原価でない大きな値（変えない） | 売上の金額（`sales_service.rs`・`sales_repo.rs`）、在庫・数量・計数（`stock_ledger.rs`・`inventory_repo.rs`・`time_evidence*`・`schema_time_evidence.rs`）、円の合計の安全な整数の検査（`unit_amount.rs` の `check_safe_integer`、`schema_v8.rs`、`migration.rs` の `total_cost`、`receiving.rs`・`disposal.rs` の合計の期待）、v7 の上限（`schema_v7.rs`・`migration.rs`）、連番（`product_service.rs`）、`ej_parser.rs`、`csv_import_service/list.rs`、TS の売上・在庫・操作ログ・`addSafeInteger`・`parseRequiredSafeInteger` の test | 変えない |

### T2a 旧い名前で書き、失敗だけを確かめる test の洗い出し（round 2 の是正）

改名の後に旧い名前で書く所は、SQL の `no such column`・serde の missing field・`unwrap` の panic で red になるので気づける。気づけないのは、失敗だけを確かめる test（`is_err()` 等）が旧い名前で書く所と、serde が未知の key を黙って無視する所で、改名の後も緑のまま中身が抜ける。数える command（2026-10-21、round 2 の是正の時点）:

- SQL の書込み: `rg -U --vimgrep '(INSERT INTO|UPDATE) \w+[^"]*?\b(cost_price|valuation_cost_price|old_cost|new_cost)\b' src-tauri/src src-tauri/tests | cut -d: -f1,2 | sort -u`（66 か所。複数行の SQL は始まりの行）
- JSON の key: `rg -n '"(cost_price|valuation_cost_price|old_cost|new_cost|old_cost_price|new_cost_price|master_cost_price|received_cost_price)"\s*:' src-tauri/src src-tauri/tests`（9 行）
- 各 hit を囲む関数を読み、DB の版（`init_database`・`setup_test_db`・`setup_db` は最新、`setup_v*_only_db`・`migrate_up_to(…, 8)`・`setup_v8_db` は vB の前）と、確かめ方（失敗だけか、正の期待や `unwrap` があるか）で分けた。helper は呼ぶ所の確かめ方で分けた（`can_insert_unit` は `bool` を返すので呼ぶ 8 か所を見た）
- TS は対象外: test も `npm run typecheck`（`tsconfig.json` の `include` が `src` を含み、test も入る。`strict`）が型で止め、旧い名前の file に `as any`・`as unknown as` は無い（`rg -n 'as any|as unknown as'` が 0 行）。型で止まらない 2 file（`src/lib/request-helpers.test.ts` の `toEqual` の literal、`src/features/operation-logs/OperationLogsPage.test.tsx` の JSON の文字列の `stock_unit: "cm"`）は、実行時の完全一致で red になる側

| 分類 | 所（file と関数） | 数 | 扱い |
|---|---|---|---|
| (i) 改名で中身の抜ける test | `migration.rs` の `test_foreign_key_req903_constraints`（`init_database`、`is_err()` だけ。外部キーが効かなくても緑）、`test_check_constraints_req903_reject_invalid_values` の負の 2 つ（`tax_rate '15'`・`stock_unit 'kg'`。同じ test の正の 1 行は red になる）、`disposal_repo.rs` の `test_insert_disposal_req204_check_disposal_type`（`setup_test_db`、`is_err()` だけ。round 2 の洗い出しで見つけた）、`product_service.rs` の `test_product_update_request_req102_ordinary_fields_omitted_null_value` の `{"cost_price":null}`（serde が未知の key を無視して `None` のまま緑。packet S2） | SQL 4 か所・JSON 1 行（4 test） | 名前を `_centi` に直し、負の INSERT は error の文まで確かめるか正の対照を置く（T2 の行） |
| (ii) vB の前の版の fixture（変えない） | `migration.rs` の `seed_v7_products_with_children`・`seed_v8_limit_line_records`・`can_insert_unit`（呼ぶ 8 か所とも v9 以前の DB。T1 の (c) で最新の DB の 12 個の loop を `migrate_up_to(&conn, 8)` へ移した後も）・v3 と v8 の test（`setup_v2_only_db`・`setup_v7_only_db`。v8 の上限の test は失敗を期待するが、v7 の DB には旧い列があり INSERT は通る）、`schema_v2.rs` の `test_v2_req903_backfill_with_parent_child_fk`、`schema_v8.rs` の履歴の SQL、`schema_v9.rs` の `seed_product` の v8 の DB の分 | SQL 32 か所 | 変えない（AC2 の hit ごとの表） |
| (iii) その他（直さないと red になる） | production の SQL（`product_repo.rs`・`receiving_repo.rs`・`disposal_repo.rs`・`stocktake_repo.rs`・`seed_demo.rs`、`#[cfg(test)]` の `schema_time_evidence.rs`）、`unwrap`・`expect` の helper（`csv_import_service/test_support.rs`・`time_evidence_tests.rs` の `product_full`・`disposal_repo.rs` の `seed_existing_four_records`・`product_repo.rs` の `insert_test_product_for_plu`・`insert_history_fixture`・`db/test_support.rs` の `seed_legacy_fixture`・`list.rs` の `receive`・`dispose`・`cross_feature_tests.rs` の `perform`）、正の期待のある test（`receiving.rs` の原価差分の 4 つ、`stocktake_service.rs` の `test_complete_req205_negative_cost_rolls_back`〈`UPDATE` を `unwrap`〉、`csv_import_cmd.rs`・`inventory_cmd.rs`・`disposal_repo.rs` の一覧の 3 つ・`product_repo.rs`・`stocktake_repo.rs` の 2 つ）、`schema_v9.rs` の最新の DB の 2 つ（`seed_product` の `unwrap` で panic）、JSON の 8 行（`unwrap` の missing field か正の期待。`product_service.rs` の `product_price_revise` の log は production で S3）、`migration.rs` の `test_check_constraints_req903_reject_invalid_values` の正の 1 行、`product_service.rs` の comment の誤検出 1 | SQL 30 か所・JSON 8 行 | 名前を `_centi` に直す（T2 の行・S2） |

### T3 巻・cm と単位の数（Rust と TS）

数える command: Rust `rg -n -w 'Roll|Cm' src-tauri/src src-tauri/tests`（21 行・5 file）と `rg -c "[\"']cm[\"']|[\"']roll[\"']" src-tauri/src src-tauri/tests | sort`（17 file）、TS `rg -c "[\"']cm[\"']|[\"']roll[\"']|\broll:|\bcm:" src | sort`（36 file）。単位の数の test は `rg -n '12 個|12 種|12 単位' src src-tauri/src` の test の行。

| 分類 | 所 | 変え方 |
|---|---|---|
| 変えない（履歴・別の意味） | `schema_v1.rs`・`schema_v8.rs` の CHECK、`migration.rs` の v7・v8 の fixture の `'cm'`、`extract-thresholds.ts`・`extract-thresholds.test.ts` の在庫少の基準の単位 `cm` | vB の前の版、在庫少の基準の語（SPEC-UNIT-D10） |
| 一覧の数を 12 → 10 | `finite_enum_contract_tests.rs`、`unit_amount.rs` の golden、`product_service.rs` の 12 個の code と語の test・在庫少の 2 つの並びの test（`vec![ProductStockUnit::M, ProductStockUnit::Cm]`）、`inventory_cmd.rs` の在庫少の 12 個の test、`format-stock-display.test.ts`・`unit-quantity.test.ts` の 12 個の表、`StockUnitField.test.tsx`・`ProductForm.test.tsx`・`product-form-request.test.ts` の 12 個の語の期待 | 一覧から巻・cm の 2 つを外す。並び・種類・基準数量の期待はそのほかで変えない |
| `cm` の fixture を `m` に（1 対 1） | 長さの商品の fixture として `cm` を使う test（Rust: `disposal.rs`・`list.rs`・`manual_sale.rs`・`receiving.rs`・`returns.rs`・`sales_service.rs`・`stocktake_service.rs`・`time_evidence_tests.rs`・`inventory_cmd.rs`・`seed_demo.rs`・`seed_test.rs`、`product_service.rs` の `test_commit_import_req104_overwrite_preserves_optional_fields`〈既存の単位の保持〉。TS: 日次売上・月次売上・廃棄・手動販売・返品交換・入庫・在庫変動・整合性・記録詳細・操作ログの test。商品フォームの在庫連動の提案〈UI-01b-D6〉を `cm` で確かめる test: `StockUnitField.test.tsx` の 5 本〈`proposes POS sync off for cm but preserves user override`・`suggest: pcs→cm calls …`・`suggest: pcs→cm→pcs …`・`Codex round3 P2-class: …`・`suggest: after checkbox interaction …`〉、`ProductForm.test.tsx` の 4 本〈`create pcs→cm→pcs without checkbox …`・`pcs→cm: both stockUnit and posStockSync update …`・`pcs→cm→pcs without checkbox: posStockSync restores to true`・`after checkbox interaction (touched=true) …`〉、`product-form-request.test.ts` の `preserves cm POS sync override in payload`。これらは消さずに `cm` を `m` に替える: 長さの単位で提案が `false` になり、触った後は提案で変えない契約は `m` でも同じ） | `m` と `cm` は在庫・価格・POS の意味が同じ（SPEC-UNIT-D1）なので、内部の cm の整数を渡す fixture（Rust の struct・SQL、TS の mock の数量）は数量・金額・表示の期待（`1.3 m` 等）を変えない。TS の入力の文字列を渡す case は下の行 |
| TS の入力の文字列の `cm` の case（数える command: `rg -n "[\"']cm[\"']" src -g '*-request.test.ts' -g '*-row-utils.test.ts' -g 'unit-quantity.test.ts' -g 'ProductForm.test.tsx'`、round 1 の是正の時点で 58 行・11 file） | 入力の文字列は cm の整数（`"130"` = 1.3 m）なので、`"cm"` を `"m"` にするだけでは 100 倍になる | `m` の入力の形にするときは入力の文字列を 1/100 にする（`"130"` → `"1.3"`、`"50"` → `"0.5"`）。数量・金額の期待は変えない。cm の上限・0 の case（例 `["cm", "10000000"]`・`build("cm", "0")`）は、同じ欄の `m` の上限・0 の case があれば外し、無ければ `m` の case に書き換える（下の行と同じ扱い。`m` の上限は `99999.99`） |
| 長さどうしの単位の変更を拒む case を契約ごと外す（対を表にする） | `product_service.rs` の `test_update_product_req102_rejects_length_to_length_and_checks_unit_last`（前半の `m` の商品を `Cm` に変える要求）、`test_import_req104_overwrite_rejects_cross_kind_stock_unit`（`m` の商品 `OU-M` を CSV の `cm` で読む行） | 長さの単位が `m` だけになり、SPEC-UNIT-D2 の「長さの単位どうしの変更も許さない」が当たる組が無くなる（`m → m` は同じ単位で許される）。その case を外し、同じ test に残る種類をまたぐ変更（`pcs` ↔ `m`）を拒む case を PR の本文に対で示す（更新は `test_update_product_req102_rejects_cross_kind_stock_unit`〈`pcs` ↔ `m` の両向き〉、CSV は同じ test の `OU-PCS` を `m` で読む行）。更新の test の後半の順の確かめ（`pcs` の商品を `M` に変える要求で、取引先の error が単位の error より先に出る）は残し、test の名前から `length_to_length` を外す。CSV の値の `cm` は U4 の行の error が持つ。`test_commit_import_req104_overwrite_revalidates_stock_unit_wire` の `("RV-M", "cm", …)` の組は外さず、期待を `retired_stock_unit_hint` の文（`在庫単位が正しくありません: cm（…）`）に変える（commit の外した単位の case を 1 本残す。U4） |
| `cm` の入力の分岐の case を契約ごと外す（1 対 1 の対を表にする） | `cm` の商品の入力が cm の整数であることだけを確かめる case（例: `unit-quantity.test.ts`・`*-request.test.ts`・`*-row-utils.test.ts` の `cm` の入力の case、`ProductForm.test.tsx` の `cm` の初期在庫） | SPEC-UNIT-D3 の `cm` の入力の契約が無くなるので case を外す。同じ欄の `m` の入力の case（小数 2 桁、上限、0 の扱い）が残ることを PR の本文に表で示す。`m` の case が無い欄があれば、外す前に `m` の case を足す |

### T4 v8 の履歴の test（backlog の (i) と「U から C へ送るもの」）

| test | 理由 | 変え方 |
|---|---|---|
| `schema_v8.rs` の `test_v8_req903_check_codes_match_enum` | enum から `Roll`・`Cm` を外すと、v8 の CHECK（12 個、履歴）と食い違って red になる | v8 の CHECK を固定の 12 個の一覧（`'pcs','sheet','hon','bag','box','roll','kumi','set','ball','cho','m','cm'`）と比べる形にする（v8 の SQL は変えない）。enum との一致は B3 へ移す |
| `schema_v8.rs` の `test_v8_req903_limits_match_runtime_constants` の原価の行 | runtime の原価の上限が 1/100 円の `MAX_COST_PRICE_CENTI` になる | `assert_eq!(MAX_COST_PRICE * 100 + 99, constants::MAX_COST_PRICE_CENTI)`（v8 の円の上限と今の上限が円の桁で同じ）。他の行は変えない |

### T5 原価の値と名前（TS）

数える command: `rg -c -w 'cost_price|valuation_cost_price|old_cost_price|new_cost_price|master_cost_price|received_cost_price|MAX_COST_PRICE' src | sort`（起票の時点で 46 file。多いのは `ReceivingPage.test.tsx` 21、`bindings.ts` 16、`PriceRevisionPage.test.tsx` 14、`ProductForm.test.tsx` 8）と、原価の field 名を含まないのに期待が変わる test を拾う `rg -n 'deriveProposedCost|formatMarkupRate|parseRequiredSafeInteger|原価（必須|原価も円の整数' src --glob '*.test.*'`（round 3 の是正の時点で 28 行・3 file: `price-revision-math.test.ts` 18、`request-helpers.test.ts` 7、`ProductForm.test.tsx` 3）。

| 分類 | 所 | 変え方 |
|---|---|---|
| 名前だけ書き換える | 原価の値が表示・金額の期待に効かない mock（`BackupRestorePage.flow.test.tsx`・`HomePage.test.tsx`・`useHomeSummary.test.tsx`・`PluExportPage.test.tsx`・`ProductImportPreview.test.tsx`・`reducer.test.ts`・`StockMovementsPage.test.tsx`・`ReturnToFlow.test.tsx` ほか） | field 名を `_centi` に。値は変えない |
| 名前と値を書き換える（1 対 1） | 原価の表示・送信・金額の期待のある test（`PriceRevisionPage.test.tsx`・`ProductForm.test.tsx`・`product-form-request.test.ts`・`ReceivingPage.test.tsx`・`receiving-request.test.ts`・`receiving-row-utils.test.ts`・`disposal-request.test.ts`・`DisposalPage.test.tsx`・記録詳細の test・`PriceHistorySection.test.tsx`・`ProductTable.test.tsx`・`src/lib/request-helpers.test.ts`） | 円の原価 a の mock を `a * 100` にし、表示の期待（`¥500` 等）は変えない（下の 2 つの「期待を変える」の行を除く）。入力の文字列から送る値の期待は 1/100 円に（`"500"` → 50000） |
| 期待を変える: 原価の表示の記号（SPEC-UNIT-D5 の半角の `¥`） | `rg -n '￥' src --glob '*.test.*'` と `rg -n '"[0-9,]+ 円"' src/features/receiving --glob '*.test.*'` の原価の期待（round 1 の是正の時点）: `ProductTable.test.tsx` の `"￥567"`（原価の列）、`ProductForm.test.tsx` の価格の履歴の原価の cell `"￥60 → ￥70"`・`"￥100 → ￥105"`・`"￥90 → ￥100"` と、売価と原価の cell を `/^￥/` で見る loop、`ReceivingPage.test.tsx` の原価差分の dialog の `"500 円"`・`"501 円"`（4 行） | 原価の期待だけを半角の `¥` の形に（`"¥567"`、`"¥60 → ¥70"`、`"¥500"`）。同じ test の売価の期待（`"￥100 → ￥120"` 等）は変えない。`/^￥/` の loop は売価の cell と原価の cell の期待に分ける。`SummaryCards.test.tsx` の `￥` は売上の金額の comment で対象外 |
| 期待を変える: 棚卸し記録詳細のロス原価の形（packet の「起票時に起草役が決めたこと」の `formatCentiYen`） | `StocktakeRecordDetailPage.test.tsx` の `within(row).getByText("¥600")`（ロス原価） | `"600.00 円"`（評価原価 30000・差異 -2 の 1/100 円 60000 を `formatCentiYen` で）。ロスの無い行も `0.00 円`（今の `¥0`。今の test に期待は無い）。同じ行の評価原価 `"¥300"` と合計 `"¥2,400"` は変えない。packet が formatter を替えると決めた所（原価の表示の Y3、原価差分の dialog、ロス原価）の既存の表示の期待を `rg -n '¥|￥|円' <各画面の test>` で洗い、T5 の外で形が変わるのはこの 1 行だけだった（round 2 の是正） |
| 期待を変える: 原価の field 名を含まない原価の式・文・構造の test（round 3 の是正） | 上の 2 つ目の command の 3 file: `price-revision-math.test.ts`（`deriveProposedCost`・`formatMarkupRate` の golden）、`ProductForm.test.tsx` の label の完全一致 `原価（必須、1 m あたり）`・`原価（必須）` と価格の節の説明の完全一致、`request-helpers.test.ts` の `integerCallCount`（`parseRequiredSafeInteger(` の呼出しの数） | `price-revision-math.test.ts` は入力の原価を 1/100 円にし、出力を Y8 の式の値にする（`deriveProposedCost(1200, 70000, 1000)` → 84000、`formatMarkupRate(70000, 1000)` → `"70.0"`。円の golden の各行の原価を ×100、案を ×100 にした値。掛率の文字列は変わらない）。10^7 直下の exact の case（`deriveProposedCost(9_999_999, 9_999_999, 1)`）は ×100 で積が安全な整数を越えるので、上限の積の case に作り直す: `deriveProposedCost(999_999, 99_999_999, 1)` → `99_999_899_000_000`（積 `999999 × 99999999` = `99999899000001` は安全な整数の範囲。共通規則 (b)）。C15 の `8349/100/120 → 10000` もここに置く。`ProductForm.test.tsx` の 3 行は UI-01b-D22 の原価の lane の後の文（`原価（税抜、必須、1 m あたり）`・`原価（税抜、必須）`・説明の文）。`request-helpers.test.ts` の `integerCallCount` は入庫 `1 → 0`・廃棄 `2 → 0`（原価の欄が `parseCostInput` になる。手動販売の 1 は変えない）と、その上の comment の「原価・販売金額」を「販売金額」に。`parseRequiredSafeInteger` 自身の test は変えない |
| 期待を変える: TS の原価の入力の上限の端（round 3 の是正） | `receiving-request.test.ts`・`disposal-request.test.ts`・`product-form-request.test.ts` の上限の端の case、`PriceRevisionPage.test.tsx` の新原価の上限の case（受ける端 `"999999"`） | 入力の文字列は円のまま ×100 しない。受ける端を `"999999.99"`（送る値 `99999999`）にし、拒む端 `"1000000"`（`原価が大きすぎます`）は変えない（`"999999"` のままだと送る値が 99999900 になり端を確かめない） |
| 期待を変える: 原価の形式の error の文（SPEC-UNIT-D5） | `rg -n '原価は0以上の整数' src --glob '*.test.*'` の 5 か所: `DisposalPage.test.tsx`（`DP-001: … / 原価は0以上の整数で入力してください / …`）、`disposal-request.test.ts`、`receiving-request.test.ts`（`toContain("原価は0以上の整数")`）、`src/lib/request-helpers.test.ts` の 2 か所 | 原価の文の部分だけを `原価は0以上で、小数は2桁までで入力してください` に。並び・ほかの文（数量・理由）・件数は変えない |
| 定数の test | `unit-quantity.test.ts` の `expect(MAX_COST_PRICE).toBe(999999)` と `parsePriceInput(…, MAX_COST_PRICE)` の 3 行 | `MAX_COST_PRICE_CENTI` の `99999999` に。原価の解析の case は C10 の `parseCostInput` へ移し、`parsePriceInput` の case は売価の上限で残す |
| field の一覧 | `product-update-patch-contract.test.ts` の `ProductUpdateRequest` の field の一覧 | `cost_price` を `cost_price_centi` に（単位の語の直しの lane が入れた `stock_unit` を含む 10 field の形の上で。backlog の申し送り） |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| vB（DB の版） | v9 の DB | migrate の中 | 版が vB、6 列が `_centi`、CHECK が 10 個 | — | — | 再起動で再実行しない | 次の起動は vB を当て直さない | 行のある DB・検証・COMMIT の失敗で全部戻る | 作り直した空の DB で起動し直す | B1〜B8、R1〜R4 |
| 原価の補助（UI-01b-D24） | 閉じている | 袋の値段と入り数を入れた | 原価の欄に値が入る | 単位を `m` に変えると閉じて隠れる（原価の欄は変えない） | — | 開き直すと 2 つの欄が空 | 画面を離れると消える（保存しない） | 入力の error で原価の欄を変えない | 直して押す | C13・C14 |
| 原価差分の dialog（UI-02-D15） | 保存の前 | 保存の後に差分を検出 | 「更新する」で商品の原価が今回の実原価に | 価格改定の query の無効化（今のまま） | 商品の再取得 | — | — | 更新の失敗は行ごとの error（今のまま） | 行ごとに押し直す | C16 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 原価の入力の解析（Y2） | 商品フォーム（`product-form-request.ts` の `readPrice` の原価の 2 か所）、価格改定（`PriceRevisionTable.tsx`）、入庫（`receiving-request.ts`）、廃棄（`disposal-request.ts`）、補助の袋の値段、商品 CSV（`product_service.rs` の `原価` の列） | 全部 | 売価の欄（`parsePriceInput` のまま。円の整数） | C7・C10・C14〜C17 |
| 小数 2 桁の文字列 → 100 倍の整数（Y2 が使う既存の関数） | Rust `product_service.rs` の `parse_meters_to_cm`（商品 CSV の `初期在庫` の m）、TS `src/lib/unit-quantity.ts` の `readQuantity` の `m` の分岐 | 両方を単位に依らない名前・関数にして原価の解析と共有する（新しい解析を書かない） | — | C7・C10 と、今の m の数量の test（変えない） |
| 1/100 円未満の四捨五入の割り算（Y5 が使う既存の関数） | TS `src/lib/unit-quantity.ts` の `divideRoundHalfUp`（`2r >= d`。`saleAmountYen` が使う） | `unitCostFromPack` が使う | — | C13 |
| 原価の形式の error の文（SPEC-UNIT-D5） | `receiving-request.ts`・`disposal-request.ts`・`product-form-request.ts` の `readPrice`・`PriceRevisionTable.tsx` の新原価の欄、商品 CSV の `原価`（`product_service.rs`） | 全部 | 売価の文（今のまま） | T5 の「期待を変える」、C7、AC7 |
| 原価の欄の属性（小数の入力） | `ReceivingPage.tsx`・`DisposalPage.tsx`・`PriceRevisionTable.tsx`（`type="number"`）・`ProductForm.tsx`（`type` なし）の原価の欄。先例は `quantityInputAttributes`（`m` の数量の欄の `inputMode: "decimal"`・`step: "0.01"`） | 全部（`step` は `type="number"` の欄だけ） | 売価の欄 | L3-2・L3-3 の入力 |
| 原価の表示（Y3） | `ProductTable.tsx`・`StockDetailContent.tsx`・`PriceHistorySection.tsx`（全角の `￥`）、`CostDiffDialog.tsx`（`1,000 円`）、`PriceRevisionTable.tsx`・`DisposalPage.tsx` の候補の一覧・`ReceivingRecordDetailPage.tsx`・`DisposalRecordDetailPage.tsx`・`StocktakeRecordDetailPage.tsx`（半角の `¥`） | 全部（半角の `¥` の 1 つの formatter） | 行の金額（`formatCentiYen` のまま）、円の合計（`formatYen` のまま）、売価の表示（同じ画面でも今の formatter のまま） | C11・C14〜C21 |
| `cost_line_centi` の呼出し（Y4） | `rg -n 'cost_line_centi\(' src-tauri/src` の production 5 と `#[cfg(test)]` 1 | 全部（`* 100` を外す） | `unit_amount.rs` の test の helper（円の原価で 35 §20.5a の golden を確かめる） | C4〜C6、AC4 |
| 単位の網羅（Y9） | Rust の match（`as_str`・`stock_unit_kind`・`price_basis_quantity`・`stock_unit_label`）、TS の `Record<ProductStockUnit, …>` と switch（`STOCK_UNIT_LABELS`・`priceBasisQuantity`・`isLengthUnit`） | 全部 | — | U1〜U6 |

## Negative Paths

- missing input: 原価の欄が空 → 入力の error（TS）、商品 CSV の `原価` が空 → SPEC-UNIT-D5 の文 `原価は0以上で、小数は2桁までで入力してください`。補助の入り数・袋の値段が空 → 補助の欄の error、原価の欄を変えない。
- invalid input: 小数 3 桁・指数・`+`・`.5`・`5.` → error（C7・C10）。商品 CSV の `-1`・`-0` → 負の文 `原価は0以上で入力してください`（C7）。入り数 `0`・`1.5` → error（C13）。`roll`・`巻`・`cm` の `在庫単位` → 行の error（U4）。
- duplicate/ambiguous input: 同じ idempotency key で原価だけ違う入庫 → fingerprint が違い、冪等の再送と扱わない（C9）。
- unknown reference: vB の起点の検査は外部キーに頼らず表ごとに数える（子の表だけに行のある DB でも止まる。B4）。
- dependency missing: 該当なし（新しい依存は無い）。
- permission/write failure: vB の COMMIT の失敗で全部戻る（B6）。
- dry-run side effect: 商品 CSV の preview は DB に書かない（今のまま）。vB が止まった DB は何も変わらない（B4）。

## Boundary Checks

- threshold: 原価 `99999999` は受け `100000000` は error（C1〜C3）。合計 900 行は通り 901 行は error（C6）。
- null/default: `valuation_cost_price_centi` は NULL 可のまま（棚卸し記録詳細の評価原価 NULL は `—`。今のまま）。
- empty/non-empty: vB は 5 つの表が全部空のときだけ当たる（B1・B4）。
- min/max: 原価 0（`¥0`、補助の結果が 0 になる `"0.01"` ÷ `"3"` → 0）。
- status/policy enum: `ProductStockUnit` の 10 個（U1・B3）。
- wire type: 原価は `number`（1/100 円）、行の金額は十進の文字列、合計は `number`（円）。
- internal type: Rust の原価 `i64`、計算 `i128`。TS の廃棄の合計と棚卸しのロス原価は `BigInt`。
- producer/consumer: BIZ → specta → bindings → 画面の formatter（C11）。
- round-trip token: 入力の欄の初期値の文字列 → `parseCostInput`（C12）。
- precision/range: 1/100 円の上限 `99999999` は安全な整数。`売価 × 原価` は `999999 × 99999999` 以下（Y8）。
- cross-language parse: Rust（商品 CSV）と TS（画面）の原価の解析は同じ規則（C7 と C10 の共通の例: `83.33` → 8333、`83.333` は error）。

## Compatibility Checks

- old schema/input: vB の前の版の DB は、5 つの表に行があれば vB で止まる（B4）。行が無ければ vB が当たる（B2）。v8 の CHECK と上限の履歴は変えない（T4）。
- new schema/input: 新規の DB は v1 から vB まで当たる（B1）。商品 CSV の `原価` は小数 2 桁まで受ける（C7）。
- output order: 単位の select の順は D1 の表の順から巻・cm を外した順（U6）。
- optional field behavior: `ProductUpdateRequest.cost_price_centi` は省略・null・値の今の区別のまま（`product-update-patch-contract.test.ts`）。

## Data Safety Checks

- source-derived data: 店の在庫 Excel の中身・原価の実値・商品の名前を fixture にしない（U1 の調べは行の数だけ）。
- generated outputs: `src/lib/bindings.ts`・`docs/function-design/90-traceability.md` は生成の command で作る。
- secrets: 該当なし。
- local-only files: owner の L3 用の DB と移した folder（packet の Data Safety）。
- synthetic sample boundaries: Rust と TS の fixture、demo の seed は合成の値。

## Main Wiring / Integration Checks

- helper connected to main path: vB が `migrations()` に登録され、`init_database` の新規の DB で当たる（B1）。`parseCostInput` と原価の formatter が 9 つの画面から呼ばれる（Adjacent Pattern Audit、C14〜C21）。
- output reaches manifest/report: 行の金額と合計が記録詳細に届く（C5・C18）。
- effective config reaches runtime: `MAX_COST_PRICE_CENTI` を BIZ の全ての原価の検証が使う（C1〜C3、AC3）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → 原価の golden（`83.33` → 8333、`1000` ÷ 12 → 8333、77 の 8333/100/110 → 9100）は設計正本の例から写す（C10・C13・C15）。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → 原価差分の dialog の更新の後の商品の原価（C16）。
- If a key branch is inverted, which test fails? → 補助を個数の単位でだけ出す分岐（C14）、vB の起点の検査の分岐（B4）。
- If a threshold comparison changes, which test fails? → C1〜C3・C6（`>` と `>=` の取り違え）、C13（`2r >= n` の取り違えは `"0.05"` ÷ `"2"` → 3 で落ちる）。
- If a guard is removed, which test fails? → vB の起点の検査を外すと B4、原価の上限の検査を外すと C1〜C3。
- If an output field is omitted, which test fails? → B2（§19 の 3 列・index・外部キー）、AC6（bindings の field）。
- If output order changes, which test fails? → U6（select の順）、B5（行のある表名の並び）。
- If dry-run performs a side effect, which test fails? → B4（止まった DB の schema・版・`foreign_keys` の比較）。
- If a JSON number crosses JavaScript safe integer range, which test fails? → C17（廃棄の合計の BigInt）、C18（棚卸しのロス原価の BigInt）。
- If a state token is round-tripped through browser/client code, which test fails? → C12（入力の欄の初期値の往復）。

## Residual Test Gaps

- Windows の実機での vB の止まり方と作り直しの後の起動、WebView の保存の置き場は L3-1 で確かめる（packet の Contract Probe P5）。
- 商品フォームの補助・label・select の見た目と、入庫・原価差分・価格改定の表示は L3-2・L3-3 と Human Visual Confirmation。
- 棚卸し記録詳細のロス原価は基準数量で割らないまま（35 §20.5a の既知の不整合。D-118 の (b)）。C18 は単位を 1/100 円に合わせたことだけを確かめる。
