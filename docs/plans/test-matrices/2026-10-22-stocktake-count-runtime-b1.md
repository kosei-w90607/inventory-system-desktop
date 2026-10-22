# Test Design Matrix: 棚卸しの数の置き場と在庫数の求め直しの runtime (b1)

Plan Packet: [2026-10-22-stocktake-count-runtime-b1](../2026-10-22-stocktake-count-runtime-b1.md)。期待値は設計正本（ADR SPEC-STK-CNT-D1〜D12、22 §20、24・30・31・32・35・36・40・41・42・51・55・65・73・75 の D-118 の節、共通規則）から導き、実装や mock から写さない。test の名前は REQ を含む（`docs/DOC_STYLE_GUIDE.md` §1）。横断の約束の # は packet の「横断の約束」（Z1〜Z17）。

## Risk

Risk: R4

## Contracts Under Test

- vZ（22 §20）: 止まる検査・全行と id の写し・`sqlite_sequence`・Z004 と phase を結ぶ CHECK・列の追加と CHECK（Z17）。
- 精算の窓（ADR D3 の「精算 k」の行、A1、理由 1）と求め直す商品（ADR の横断の表）、初期在庫の見分け方（ADR D9）。
- 計数の保存（既定・fresh・0 にする）の検査と保存と求め直し、後入力の確認、要再確認の一覧（ADR D5、35）。
- 完了の拒否の 3 つの理由・評価額・カーソル・総額の範囲、記録の詳細と完了の後の差（ADR D6、35、65）。
- Z004 の preview の拒否と知らせ、確定の取り直し・引き当ての食い違い・`stock_linked`・整数の数量の換算・共有 JAN の行・全て 0 の file、取消と取り込み直し（ADR D4・D7、32、24）。
- 共有 JAN の不変条件・在庫連動を始める検査・共有 JAN の一覧（ADR D4・D8・D10、30、36）。
- wire（`stocktake_guard` と回復型、新設 4 と外す command、生成の enum）と画面（73・55・51・65・75、UI_TECH_STACK の再取得）。
- 撤去（停止・旧本体・時点証拠・probe）と、STK-1・STK-2 の診断の新しい経路での PASS。

## Failure Modes

- 5 つの入口の部分的な解除、停止の文言や旧本体・時点証拠の code の残り。
- 精算の窓の判定の誤り（`d_k = D` を入るとする、A1 を当てない、`k ≤ n` の fresh の比べ方の誤り、欠けで「最初の 1 本」を誤る）、理由 1 が今の `pos_stock_sync` を見る。
- 求め直す商品の漏れ（計数を持つが取込みに無い商品、連動の off の商品の取込みの行）。
- 計数の保存が未来の日付・形の違う日付・上限の外・別の商品の明細を通す、fresh のカーソルを TX の外で読む。
- 完了が理由を無視して進む・在庫を動かす・総額の範囲の外を保存する。完了の後に評価額が変わる。
- Z004 の拒否の漏れ（精算回数の無い file・同じ精算の別の版・順の食い違い）、preview と違う商品へ確定が入れる、長さの商品が 100 分の 1、共有 JAN の行が在庫を動かす、`stock_linked` が今の設定を写す。
- 取消が補償の movement を作る・計数を消す・求め直さない。
- 共有 JAN の不変条件の経路の漏れ（どちらの商品を変える場合か）、在庫連動を始める検査が「決まらない」売上を通す。
- vZ が行・id・列・index を欠く、`sqlite_sequence` を戻す、止まる DB で何かを変える。
- wire の number が安全な整数を越える値を運ぶ、未知の code を画面が「そのまま続行」にする。
- 既存の test を契約の置き換えの根拠なしに消す・弱める。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。helper 名だけで実 router / integration と分類しない。
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。
- oracle の anchor は定義文にしか現れない literal を選び、`rg -c` で対象 file 内 1 件を file ごとに確かめる（複数 file を 1 本の `rg` で数えない）。文言を改訂した後は「新しい文言が exact で 1 件 + 旧い文言が 0 件」の対にする。
- oracle は検証対象と独立の正本から転記し、mutation は production 側だけを変える。
- 結果を空にする注入で、期待が空集合の case だけが kill を主張していないかを確かめ、各組合せに非空の期待を 1 件置く。

### M: migration vZ（22 §20、Z17）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| M1 | 空の DB で vZ が当たり、5 つの列と Z004 と phase を結ぶ CHECK と 3 つの index がある | 列・CHECK・index の欠け | schema | `test_vz_req903_fresh_db_has_columns_checks_and_indexes` | 手順 3〜5 のどれかを落とす、index を作り直さない |
| M2 | 直前の版の DB（入庫・返品交換・手動販売・廃棄・初期在庫と demo の seed の形の `sale_auto`〈`reference_type` NULL〉の movement、末尾の行を消した履歴）で全列と id が同じ、`sqlite_sequence` が前の値 | 行・値の欠け、id の使い回し | schema / regression | `test_vz_req903_rebuild_keeps_rows_ids_and_sequence` | 写しの列の漏れ、手順 4 の `sqlite_sequence` の戻しを落とす（次の INSERT の id が前の最大 + 1 になる） |
| M3 | 止まる検査（`stocktakes` の行、`csv_imports` の行、`reference_type = 'csv_import'` の movement、`phase = 1` の movement。1 つずつ）で schema・値・版が何も変わらず `MigrationFailed`（`作り直し` と表名） | 止まる DB を変える、原因の文が無い | schema / negative | `test_vz_req903_stops_without_changes_on_stocktake_or_z004_rows` | 検査を書込みの後に置く、条件の 1 つを落とす、message に表名が無い |
| M4 | vZ の後、`csv_import`・`phase = 0` と、`phase = 1`・`csv_import` でない行の INSERT が CHECK で拒まれ、`csv_import`・`phase = 1`・`settlement_no` 0 と 7 は入る（Contract Probe P3） | CHECK の漏れ・`=` で比べる誤り | schema / negative | `test_vz_req401_reference_type_and_phase_check` | CHECK を `=` で書く（NULL で通る）、CHECK を落とす |
| M5 | `csv_imports` の `machine_no` が NULL・空、`settlement_no` が NULL・負の INSERT が CHECK で拒まれ、`('0001', 42)` は入る（Contract Probe P1） | 列の CHECK の漏れ | schema / negative | `test_vz_req401_csv_imports_settlement_key_checks` | 列の CHECK を落とす、`machine_no <> ''` を落とす |
| M6 | `sale_records` の `stock_linked` の既定 0・2 の拒否、`stocktake_items` の `valuation_quantity`・`stocktakes` のカーソルが NULL を許す | 既定・CHECK の誤り | schema | `test_vz_req205_stock_linked_default_and_completion_columns` | 既定を 1 にする、CHECK を落とす、カーソルを NOT NULL にする |
| M7 | 再実行で重複適用しない。最新の版までの migrate の後に §18 の trigger があれば残る（§18 が先に入った版で） | 二重適用・trigger の消失 | schema | `test_vz_req903_idempotent_and_keeps_jan_alias_triggers_when_present` | 版の記録を落とす、作り直しで trigger を消す（§18 は `products` の規則なので vZ では当たらないことの確かめ） |

### L: 精算の窓と求め直し（ADR D3・D2・D9、31）

計数の日付 D・今日 T・精算 k の精算日 d_k の組は ADR D3 の判定表から決め、期待は表の文から写す。

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| L1 | 既定の計数（日付 D）に対する精算: `d_k < D` 入る、`d_k = D` 決まらない（D の全ての精算）、`d_k > D` は D に精算があれば入らない（A1） | 境界の取り違え | unit | `test_stock_ledger_req205_default_count_settlement_window` | `=` を入るにする、D の 2 本目の精算を入るにする、A1 を当てない |
| L2 | 既定の計数で D に精算が無いとき、`d_k > D` の最初の 1 本だけ決まらない、残りは入らない | 「最初の 1 本」の誤り | unit | `test_stock_ledger_req205_default_count_first_settlement_after_quiet_day` | 全部を決まらないにする、全部を入らないにする |
| L3 | fresh な計数（今日 T、保存の時点の n）: `k ≤ n` 入る。`k > n` のうち `d_k < T` 入る、`d_k = T` 決まらない、`d_k > T` は T に精算（n を含む）があれば入らない、無ければ最初の 1 本だけ決まらない | fresh の比べ方の誤り | unit | `test_stock_ledger_req205_fresh_count_settlement_cursor` | `k < n` にする、n を見ずに日付だけで決める |
| L4 | fresh で n が NULL（取込みが無かった）なら全ての精算を日付で判定する | NULL を 0 とみなす | unit | `test_stock_ledger_req205_fresh_count_without_imports_uses_dates` | NULL を 0 に倒す（精算 0 を入るにする） |
| L5 | 理由 1: 決まらない精算の取込みにその商品の有効な Z004 の movement がある → `UndeterminedSettlement`、範囲は適用する・しないの最小と最大 | 理由 1 の漏れ・範囲の誤り | unit | `test_stock_ledger_req205_undetermined_settlement_movement_recheck` | 理由を足さない、範囲の端を取り違える |
| L6 | 理由 1: movement の無い行でも、取込みのときの `stock_linked = 1` で個数 ≠ 0 か金額 ≠ 0 の行があれば要再確認。`stock_linked = 0` の行と、個数・金額とも 0 の行は理由にならない。今の `pos_stock_sync` を見ない | 今の設定を見る・0 の行を拾う | unit | `test_stock_ledger_req205_undetermined_settlement_uses_stock_linked_at_import` | 今の `pos_stock_sync` を見る、金額 ≠ 0 の条件を落とす |
| L7 | 取り消した取込み（`rolled_back`）は精算の一覧に入らない | 取消の漏れ | unit | `test_stock_ledger_req205_rolled_back_import_excluded_from_settlements` | active の条件を落とす |
| L8 | 初期在庫の印は `reference_type` NULL で `movement_type` が `receiving`。`sale_auto`・`reference_type` NULL（demo の seed）は業務日で窓を持つ | seed の売上を初期在庫とみなす | unit | `test_stock_ledger_req205_seed_sale_without_reference_is_windowed` | `movement_type` の条件を落とす（計数の後の seed の売上が引かれない） |
| L9 | 計数の無い商品では `phase = 1` の movement を含む全ての有効な movement の和（誤りで止まらない） | (a) の止まりが残る | unit | `test_stock_ledger_req205_sum_includes_settlement_movements_without_counts` | `phase != 0` の分岐を残す |
| L10 | 理由の順と重複なし（`undetermined_settlement`・`same_date_movement`・`conflicting_counts`） | 順・重複の誤り | unit | `test_stock_ledger_req205_recheck_reason_order_and_dedup` | 理由を push する順を変える、同じ理由を 2 回足す |
| L11 | 欠けがあると過剰に決まらない側へ倒れ、欠けの後追いの取込みで決まる（D の精算の有無と「最初の 1 本」は取り込み済みの精算で決める） | 欠けで過小になる | unit | `test_stock_ledger_req205_gap_errs_on_undetermined_side_and_resolves_after_backfill` | 欠けた精算を推測で埋める |
| L12 | Z004 の確定・取消で求め直す商品 = 計数を持つ全ての商品 + その取込みの売上か movement を持つ全ての商品（連動の on / off を問わない） | 求め直しの漏れ | integration | `test_stock_ledger_req205_req401_recompute_targets_for_settlement_change` | 計数を持つが取込みに無い商品を省く、連動 off の商品を省く |

### C: 計数の保存と読取り（ADR D5、35）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| C1 | 既定の計数の保存: `stock_counts` に `default` の行、写しを求め直す、結果（id・種類・在庫・範囲・理由・`later_count_exists`） | 保存・求め直しの漏れ | integration | `test_save_stock_count_req205_default_saves_and_recomputes` | `recompute_stock` を呼ばない、結果の field を落とす |
| C2 | fresh な計数: `business_date` は今日（違えば `ValidationFailed`）、`settlement_no` は同じ TX の最大の精算回数（無ければ NULL）、`seen_movement_id` は `MAX(id)`（無ければ 0） | カーソルの誤り | integration | `test_save_stock_count_req205_fresh_stores_cursor_in_same_tx` | 今日以外を通す、カーソルを TX の外で読む、NULL を 0 にする |
| C3 | 未来の日付・形の違う日付（`2026-4-7`）・実在しない日付（`2026-02-30`）は何も書かずに拒否 | 日付の検査の漏れ（循環の前提が崩れる） | negative | `test_save_stock_count_req205_rejects_future_or_invalid_dates` | `validate_business_date` か今日との比べを落とす |
| C4 | 値の範囲: 0 は保存できる、負と `1000000000` は何も書かずに `ValidationFailed`、`999999999` は保存できる | 上限の漏れ | negative / boundary | `test_save_stock_count_req205_count_value_range` | 上限を落とす、0 を拒む |
| C5 | `stocktake_item_id` が進行中の棚卸しの明細でない、明細の商品と `product_code` が違う → 書く前に `ValidationFailed`（「この明細は別の商品です」ほか） | 明細の取り違え | negative | `test_save_stock_count_req205_rejects_mismatched_stocktake_item` | 一致の検査を落とす、INSERT の後に検査する |
| C6 | 明細の `actual_count`・`counted_at` は効く計数に揃う（fresh が先の計数を置き換える。後入力の古い日付の既定の計数は効かない） | 写しの誤り | integration | `test_save_stock_count_req205_item_copy_follows_effective_count` | 最後に保存した値を写す |
| C7 | `preview_stock_count_placement` は ADR D3 の「計数どうし」で、その日付の計数より後の計数があるとき `later_count_exists = true`（保存は拒まない） | 後入力の確認の誤り | unit | `test_preview_stock_count_placement_req205_later_count_exists` | 日付だけで比べる（fresh の後の同じ日付の既定を後とする） |
| C8 | `zero_uncounted_items`: 選んだ商品に値 0 の既定の計数を 1 TX で、商品ごとに求め直す。日付は選べ、未来は拒否。1 つでも拒否なら何も書かない | 部分的な保存 | integration / negative | `test_zero_uncounted_items_req205_one_tx_per_request` | 商品ごとに commit する、未来の日付を通す |
| C9 | `list_recheck_products`: 写しが要再確認の商品、進行中の棚卸しに明細があれば `active_count` と `stocktake_item_id`、無ければ `count_now`、理由つき | 回復先の誤り | unit | `test_list_recheck_products_req205_actions_and_reasons` | action を取り違える、架空の id を入れる |
| C10 | 明細の読取り（`get_stocktake_items`・`find_stocktake_item`）: 効く計数の値・種類・日付、写しの在庫と範囲、理由、差異（効く計数 − 入っている記録だけの帳簿。計数が無ければ null）、`stock_unit`。進捗の計数済み = 明細を参照する計数がある | 差異・計数済みの定義の誤り | integration | `test_get_stocktake_items_req205_effective_count_and_difference` | 差異を `actual_count - system_stock` にする、計数済みを `actual_count` の NULL で数える |

### K: 開始・完了（ADR D6、35、§20.5a）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| K1 | 完了: 明細ごとに `valuation_quantity = max(写し, 0)`、評価原価、§20.5a の総額、カーソル（最大の精算回数〈無ければ NULL〉・最大の計数の id）、header を completed。movement を作らず写しを変えない | 在庫を動かす・カーソルの漏れ | integration | `test_complete_stocktake_req205_freezes_valuation_without_movements` | movement を書く、`recompute_stock` を呼ぶ、カーソルを書かない |
| K2 | `settlement_pending` の (i) 精算日が X 以上の精算が無い、(ii) 取り込まれていない k が隣の精算の日付で X を挟む、(iii) 既定の計数で X より前の精算が無い → `StocktakeGuard`（`completion_blocked`、明細ごとの target と `block_reason`）、何も書かない | 未取込みを見落とす | negative | `test_complete_stocktake_req205_settlement_pending_three_conditions` | (i)〜(iii) のどれかを落とす、fresh の n の扱いを誤る |
| K3 | 明細の商品の写しが要再確認 → `recheck` | 要再確認を見落とす | negative | `test_complete_stocktake_req205_blocks_on_recheck` | `stock_recheck` を見ない |
| K4 | 未計数 → `uncounted`。完了の時点で廃番かつ写し 0 の明細は止めない。理由は全部集めてから返す | 例外の誤り・最初の理由で返す | negative | `test_complete_stocktake_req205_uncounted_except_discontinued_zero` | 廃番 0 を止める、廃番で在庫 ≠ 0 を通す、最初の理由だけを返す |
| K5 | 総額が安全な整数の範囲の外（原価と実数が上限の個数の単位の商品 10 個）→ `ValidationFailed`（「合計金額が大きすぎます」）、何も書かない。9 個は保存できる | 範囲の漏れ | negative / boundary | `test_complete_stocktake_req205_total_cost_safe_integer_range` | `check_safe_integer` を落とす |
| K6 | §20.5a の評価の golden（基準数量・四捨五入・負の原価・i128 の溢れ）を新しい完了で保つ | 評価の誤り | unit | 既存の `test_complete_req205_total_cost_*` を新しい完了へ移す（T2） | 評価の関数を差し替える |
| K7 | 開始: 進行中が無ければ全ての対象の商品の明細（自動の 0 の入力なし）、進行中があれば `StocktakeInProgress`、対象 0 件は今の文言 | 自動の 0 が残る | integration | `test_start_stocktake_req205_creates_items_without_auto_fill` と既存の開始の test（T2） | 廃番 0 を自動で埋める |
| K8 | 開始・完了の操作ログ（今の形）と整合性の結果を含む完了の結果 | ログ・結果の欠け | integration | 既存の `test_start_stocktake_req205_operation_log`・`test_complete_req205_operation_log`・`test_complete_stocktake_req205_includes_integrity_result` を移す（T2） | ログを落とす |

### R: 記録の詳細と完了の後の差（ADR D6、35、65）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| R1 | 完了した棚卸しの明細は、カーソルの時点の効く計数と差異、評価数量・評価原価、差異が負で評価原価があれば行のロス原価（`cost_line_centi` の 1/100 円の十進の文字列。長さは基準数量 100） | カーソルの後の計数を使う、基準数量を落とす | integration | `test_get_stocktake_record_req206_items_at_cutoff_with_loss_cost` | id ≤ `cutoff_count_id` を落とす、基準数量で割らない |
| R2 | 完了の後の差: 完了日以前の日付で完了の後に入れた入出庫が差になり、完了日より後の日付の記録は入らない。精算は精算日 < 完了日と、= 完了日でカーソル以下。確定の差と要再確認の差を分け、確定の差の合計は円の十進の文字列 | 差の取り違え | integration | `test_get_stocktake_record_req206_after_completion_diff_split` | 完了日より後の記録を入れる、要再確認の差を合計に入れる |
| R3 | 記録の詳細は補正の movement の節を持たない。入出庫の記録の一覧の棚卸しの件数は明細の数 | movement 起点が残る | integration | `test_list_inventory_records_req206_stocktake_count_is_item_count` | 件数を movement から数える |
| R4 | 見つからない・状態の enum（今の契約） | — | regression | 既存の `test_get_stocktake_record_req206_not_found_message`・`test_get_stocktake_record_req206_status_enum_and_fail_fast` を移す（T2） | — |
| R5 | 完了の時点の在庫が負でも `max(…,0)` で評価し、負の数量を評価の関数に渡さない | 負の評価 | negative | `test_get_stocktake_record_req206_after_completion_diff_clamps_negative` | `max` を落とす（`ValidationFailed` か負の差） |

### Z: Z004 の preview・確定・取消（ADR D4・D7、32、24）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| Z1 | 順 1: メタが無い（従来の形）・精算回数が数字でない・`9007199254740992` → preview も確定も拒否（32 の文） | 拒否の漏れ・範囲 | negative / boundary | `test_parse_req401_rejects_missing_or_out_of_range_settlement_no` | 範囲の検査を落とす（`9007199254740991` は受ける） |
| Z2 | 順 2: active な取込みと machine_no が違う → 拒否 | 別のレジを通す | negative | `test_parse_req401_rejects_other_machine_no` | machine_no を比べない |
| Z3 | 順 3: 同じ hash（今の重複の拒否） | — | regression | 既存の重複の test を移す（T2） | — |
| Z4 | 順 4: 同じ精算の active な取込みで hash が違う → 拒否。取り消した取込みは比べない（取り込み直せる） | 二重計上・取り込み直し不能 | negative / integration | `test_parse_req401_rejects_other_version_of_same_settlement_and_allows_after_rollback` | `rolled_back` を比べる先に入れる |
| Z5 | 順 5: 精算回数が小さいのに精算日が後、大きいのに前 → 拒否（両方向） | 順の食い違いを通す | negative | `test_parse_req401_rejects_settlement_order_mismatch_both_directions` | 片方向だけ見る |
| Z6 | 知らせ: 欠けを連続の区間にまとめ昇順（1 つなら `from = to`）、区間の数は欠けた番号の数に依らない（精算 1 と `9007199254740991` の間でも区間 1）。精算日が今日より後は知らせで拒否しない | 区間の誤り・番号を並べる | unit / boundary | `test_parse_req401_settlement_gap_notices_and_future_date` | 番号ごとに並べる（大きな番号で止まる）、未来の日付を拒む |
| Z7 | 同じ精算日の別の精算は確認なしに確定まで進む（`additional_import_confirmed` が無い） | 同日の確認が残る | integration | `test_commit_req401_same_date_other_settlement_needs_no_confirmation` | 同日の snapshot の照合を残す |
| Z8 | 確定: `csv_imports` に精算の鍵、売上に `stock_linked`、在庫連動の行の movement は `business_date = settlement_date`・`phase = 1`・`settlement_no`、求め直す商品を求め直し、結果に `recheck_targets` と知らせ。写しと `derive_stock` が一致 | 鍵・求め直しの漏れ | integration | `test_commit_req401_writes_settlement_key_and_recomputes` | `settlement_no` を渡さない（CHECK で落ちる）、求め直さない |
| Z9 | 正常な行が全て 0 の file は売上と movement を作らず取込みとして確定し、精算の並び・欠けに入る | 空の拒否が残る | integration | `test_commit_req401_zero_rows_file_is_imported_as_settlement` | 空の対象の拒否を残す |
| Z10 | 共有 JAN の行: 売上は先頭の商品、どの候補の movement も作らない、`stock_linked = 0`、行の error にしない | 候補の在庫を動かす | integration | `test_commit_req401_shared_jan_row_records_sale_only` | 先頭の商品の在庫を動かす |
| Z11 | 在庫連動でない商品の行は売上だけ（`stock_linked = 0`） | movement を作る | integration | 既存の `test_commit_req401_pos_stock_sync_false` を移す（T2） | 連動の分岐を落とす |
| Z12 | 長さの商品の整数の数量は × 100 で売上と movement に入る。× 100 の後の絶対値が `9999999` を越える行は preview の行の error。小数の数量は今の行の error | 100 分の 1・溢れ | unit / boundary | `test_parse_req401_length_unit_quantity_converted_to_cm` | × 100 を落とす、上限の検査を落とす |
| Z13 | 確定の取り直しで preview の行と違う商品に当たる・商品が無くなる行があれば何も書かずに `ImportError`（「商品の登録が読み込みの後に変わりました…」） | 黙って別の商品へ入れる | negative | `test_commit_req401_rejects_when_matched_product_changed_after_preview` | 取り直しの結果を比べない |
| Z14 | 取消: 売上と movement を無効にし、求め直す商品を求め直し、補償の movement を作らず、計数を消さない。結果に `recheck_targets`。取消済みは冪等の Ok | 補償・計数の消去 | integration | `test_rollback_req401_voids_and_recomputes_without_compensation` | 補償の movement を書く、計数を消す、求め直さない |
| Z15 | 確定の TX で順 1〜5 を取り直す（preview の後に別の取込みが確定した場合） | TOCTOU | negative | `test_commit_req401_rechecks_rules_in_tx` | 確定で検査を省く |
| Z16 | 部分的な行の error・返品の符号・負の在庫の警告・在庫の上限で TX 全体が戻る（今の契約） | — | regression | 既存の `test_commit_req401_partial_with_errors`・`test_commit_req401_sign_flip_inv1`・`test_commit_req401_negative_stock_warning`・`test_commit_req401_stock_limit_rolls_back_whole_tx`・`test_preview_req401_pos_quantity_limit_is_row_error` を移す（T2） | — |

### X: STK-1・STK-2 と cross feature の model

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| X1 | STK-1: 数えた後の入出庫が完了で打ち消されない（新しい経路で PASS） | 確定が数えた後の記録を打ち消す | integration / regression | `test_cross_feature_req205_count_then_movement_is_kept`（`diagnostic_cross_feature_req205_count_then_movement` を改名し `#[ignore]` を外す） | 完了が写しを計数の値に上書きする |
| X2 | STK-2: 完了の後に届いた過去の精算が二重に減らない（新しい経路で PASS） | 後着の Z004 の二重減算 | integration / regression | `test_cross_feature_req205_req401_late_import_not_double_counted`（`diagnostic_cross_feature_req205_req401_late_import` を改名し `#[ignore]` を外す） | 計数に入っている精算を窓で除かない |
| X3 | cross feature の model（XFA-D1〜D3）の 3 本を新しい経路で保つ | — | integration | 既存の `test_cross_feature_req201_req202_req203_req204_req401_model`・`test_cross_feature_req205_controls`・`test_cross_feature_req904_req203_model_detects_consistent_corruption` を移す（T2） | — |

### J: 共有 JAN と在庫連動を始める検査（ADR D4・D8、30）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| J1 | create: 在庫連動の商品と同じ JAN の別の商品がある、または連動の新しい商品が別の商品と JAN を共有する → `ValidationFailedAt`（field `pos_stock_sync` か `jan_code`、30 の文） | create の漏れ | negative | `test_create_product_req101_rejects_shared_jan_with_stock_linked` | create で検査しない |
| J2 | update: 連動の A が JAN を非連動の C と同じ値に、非連動の C が A と同じ JAN に、C を連動にする、の 3 通りで拒否 | どちらかの商品の変更の漏れ | negative | `test_update_product_req102_rejects_shared_jan_both_directions` | 自分の側だけを見る |
| J3 | 商品一括 import: 当該行だけ error 行、他の正常行は続く。commit は wire の行を信頼せず TX の中で同じ検査 | preview だけの検証 | integration / negative | `test_import_req104_shared_jan_row_error_and_commit_recheck` | commit で検査しない |
| J4 | 在庫連動を始める（false → true）: 連動なしの Z004 の売上（`stock_linked = 0`、個数 ≠ 0 か金額 ≠ 0）が全て効く計数に「入る」ときだけ許す。「入らない」「決まらない」・衝突・計数が無く売上がある → `StocktakeGuard`（`recount_required`、`active_count` / `count_now`） | 決まらない売上を通す | negative / integration | `test_update_product_req102_start_stock_link_requires_recount` | 「決まらない」を通す、計数の無いときを通す |
| J5 | 一括 import の上書きで連動を始める行も同じ検査で行の error | import の漏れ | negative | `test_import_req104_start_stock_link_row_error` | import の上書きで検査しない |
| J6 | true → false は記録も確認も要らない。連動の切替の TX でその商品を求め直す（値は変わらない） | 切替で写しがずれる | integration | `test_update_product_req102_toggle_stock_link_recomputes` | 求め直しを呼ばない（呼ばなくても値は同じなので、写しをわざと食い違わせた fixture で確かめる） |

### I: 整合性（ADR D10、36）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| I1 | `shared_jan_conflicts`: 連動の商品と同じ JAN の別の商品の組を JAN の昇順・商品コードの昇順で返す。`fix_integrity` の対象にしない。写しの比較の結果を変えない | 組の漏れ・自動の修正 | integration | `test_run_integrity_check_req904_lists_shared_jan_conflicts` | 非連動どうしの組を出す、連動の商品だけの組を落とす、補正する |
| I2 | 精算の窓を持つ `derive_stock` と写しの比較: Z004 の確定・取消・計数の後に差異なし | 整合性の誤検知 | integration | `test_run_integrity_check_req904_no_mismatch_after_settlements_and_counts` | 整合性の検査が精算の窓と違う規則で求める |

### W: CMD と wire（40・41・42、D-061）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| W1 | `StocktakeGuard` → kind `stocktake_guard` と `stocktake_recovery` が Some。既存の kind では None | 回復型の漏れ | unit | `test_cmd_error_req205_stocktake_guard_carries_recovery` | 変換で recovery を落とす、既存の kind に Some を入れる |
| W2 | 新設 4 の command が `collect_commands` と test の一覧に登録され、`update_count` が無い | 登録の漏れ | unit | `test_stocktake_cmd_req205_new_commands_registered` | 登録を落とす |
| W3 | CMD が PC の今日を BIZ へ渡す（BIZ は時計を読まない） | BIZ が時計を読む | unit | `test_stocktake_cmd_req205_passes_local_today` | BIZ の中で `chrono::Local` を読む |
| W4 | `complete_stocktake(stocktake_id)`（`force_fill` なし）、`completion_blocked` の wire が完全一致 | 旧い引数が残る | unit | `test_complete_stocktake_cmd_req205_completion_blocked_wire` | `force_fill` を残す |
| W5 | `commit_csv_import(preview_token)`、成功で token を消し、拒否・失敗では残す | token の消し方 | unit | `test_csv_cmd_req401_commit_keeps_token_on_rejection_and_removes_on_success` | message の文字列で消す分岐を残す |
| W6 | 新しい有限の値（Z14）の wire の round-trip | 生成型と Rust の食い違い | unit | `finite_enum_contract_tests.rs` に足す行（`test_response_only_enum_wire_serialize_req303_req501` の一覧） | enum の rename を誤る |
| W7 | TS: `CMD_ERROR_KIND` と `describeError` が `stocktake_guard` を扱い、未知の code を続行にしない | TS の twin の漏れ | unit | `describe-error.test.ts` の `stocktake_guard` の case | `CMD_ERROR_KIND` に足さない（`satisfies` で typecheck が落ちる） |
| W8 | `CountRecoveryTarget` の参照なしは null（架空の id を使わない）、`recount_reasons` は要再確認の対象のときだけ | 架空の id | unit | `test_cmd_error_req205_recovery_targets_use_null_for_missing_refs` | 0 を入れる |

### U: 画面（73・55・51・65・75、UI_TECH_STACK）

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| U1 | 「数を保存」: 保存の日付（既定は今日）を出し、保存で `saveStockCount`（`fresh: false`）、保存済みの feedback、検索欄へ focus | 日付の非表示・focus | component | `StocktakePage.test.tsx` の `U1 default count saves with today's date and returns focus` | 日付を出さない、focus を戻さない |
| U2 | 「前の日の分を入れる」: 今日より後を選べない、`previewStockCountPlacement` の `later_count_exists` で「後の数が既にあり、そちらが効きます」を保存の前に出す（拒まない） | 確認の漏れ | component | `U2 back-dated count warns when a later count exists` | 確認を出さない、保存を拒む |
| U3 | 商品の「入れ直す」は前に保存した数があるときだけ、`fresh: true`・日付は今日だけ | fresh の誤送信 | component | `U3 recount sends fresh true with today only` | 前の数が無いのに出す、日付を選ばせる |
| U4 | m の商品の実数は小数 2 桁までを cm に直して送り、小数 3 桁・負・上限の外は入力の error | m の換算の誤り | component | `U4 length product count converts meters to cm` | 浮動小数で掛ける（`0.29` → 28） |
| U5 | 日付の変わり目（時計を差し替える）: 前の保存から日付が変わったら確認 | 確認の漏れ | component | `U5 date change since last save asks before saving` | 日付の比べを落とす |
| U6 | 要再確認の一覧（棚卸しの有無にかかわらず）と行の「入れ直す」（`stocktake_item_id` を送る）、保存の後に一覧から消える | 一覧・再取得の漏れ | component | `U6 recheck list recount resolves the row` | 保存の後に invalidate しない |
| U7 | 完了の確認の文に H2 の問い、`completion_blocked` で `block_reason` ごとの一覧、「0 にする」と「残りをまとめて 0 にする」（確認を挟む、日付を選べる） | 理由の混同 | component | `U7 completion blocked lists reasons and zero actions` | 理由を 1 つの一覧に混ぜる、確認を挟まない |
| U8 | 完了の結果: 評価額と明細の数、在庫を動かさない旨の文 | 旧い補正の一覧 | component | `U8 completion result shows valuation without adjustments` | `adjusted_items` の一覧を出す |
| U9 | 「今の数を入れる」の入口（search の商品コードと `returnTo`）、保存の後に元の画面へ戻る | 戻り先の誤り | component / route | `U9 count_now entry saves fresh and returns` | `returnTo` を捨てる、検証しない |
| U10 | Z004 の preview の拒否（BIZ の文の Alert、「ファイルを選び直す」）、知らせ、同じ日の追加の確認の dialog を出さない | 確認の残り | component | `PreviewStep.test.tsx` の `U10 z004 preview shows notices without additional confirm` | dialog を出す |
| U11 | 取込みの結果と取消の結果の要再確認の一覧と棚卸しの画面への導線 | 導線の漏れ | component | `ResultStep.test.tsx` の `U11 import result lists recheck targets with recount link` | 一覧を出さない |
| U12 | 商品フォーム: 共有 JAN の field 付きの拒否を欄の近くに、`recount_required` で文と回復先への導線、入力を保ち toast・遷移をしない | 回復の導線の漏れ | component | `ProductFormPage.test.tsx` の `U12 stock link start rejection shows recovery link` | 遷移する、message を解析する |
| U13 | 棚卸しの記録の詳細: 明細の数・差異・評価数量・ロス原価（BIZ の文字列）、完了の後の差（確定と要再確認を分け合計）、「在庫変動」の節が無い | 旧い補正の表示 | component | `StocktakeRecordDetailPage.test.tsx` の `U13 record detail shows counts and after-completion diff` | movements の節を残す、ロス原価を画面で掛ける |
| U14 | 整合性の画面の共有 JAN の一覧（文・JAN ごとの商品コード、補正の操作を持たない、差異なしと別の欄） | 一覧の漏れ | component | `IntegrityCheckPage.test.tsx` の `U14 shared jan conflicts are listed separately` | 差異の一覧に混ぜる |
| U15 | 計数の保存・0 にする・完了・Z004 の取込みと取消の後に、写しを読む consumer（棚卸しの一覧と要再確認の一覧・在庫照会・商品一覧と詳細・在庫変動・整合性）を invalidate | 古い写しが残る | component | `StocktakePage.test.tsx` の `U15 writes invalidate stock copy consumers` と `useCsvImportFlow.test.tsx` の同名の case | invalidate の key を落とす |
| U16 | 停止の案内が無く、開始・数の保存・完了・Z004 の「取り込む」が押せる | 停止の UI の残り | component | `U16 stocktake and z004 writes are enabled`（棚卸しと Z004 の 2 file） | 停止の prop や Alert を残す |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 計数の保存（既定・fresh） | 数量欄は空、日付は今日 | 保存中は商品の切替・離脱を抑止 | 写しと明細の写しが変わり feedback | 写しの consumer（U15） | 一覧・要再確認の一覧 | 同じ商品をもう一度検索すると前の数が読取りで出る | 再起動の後も DB の計数が効く（UI の draft を復活させない） | 拒否は文と field、入力を保つ | 入力を直して保存 | C1〜C8・U1〜U6・U15 |
| 要再確認 | 写しの印 0 | — | 入れ直しで解ける | 保存・取込み・取消の後 | 一覧 | 取込みの結果と棚卸しの画面の両方 | DB の写しが正 | — | 入れ直し | L5・L6・C9・U6・U11 |
| 完了 | 進行中 | 完了中は全操作を無効 | 評価額の固定、結果の表示 | 進行中・前回の要約・記録の一覧 | 前回の要約（完了の前の snapshot を結果に渡す今の UI-10-D5 を保つ） | 記録の詳細で完了の後の差 | 完了した記録は変わらない | `completion_blocked` は理由の一覧、範囲の外は文 | 理由を片付けて再び完了 | K1〜K5・R1〜R5・U7・U8 |
| Z004 の取込み | ファイル選択 | preview → 確定中は離脱を抑止 | 結果と要再確認の一覧 | 写しの consumer・取込みの一覧 | 結果の後の一覧 | 取込みの記録の詳細 | token は 30 分で消える | 拒否の文、token を残す | ファイルを選び直す | Z1〜Z16・U10・U11 |
| Z004 の取消 | 取込みの記録 | 取消中 | 結果と要再確認の一覧 | 同上 | 同上 | 取り込み直し（同じ精算回数の file） | — | 失敗の文 | — | Z14・U11 |
| 在庫連動を始める | 連動 off の商品 | 保存中 | 連動 on | 商品の consumer | — | 回復先から戻る（`returnTo`） | — | `recount_required` と導線 | 数を入れて保存し直す | J4〜J6・U12・U9 |
| migration vZ | 直前の版の DB | 起動中 | 版 vZ | — | — | — | 止まった DB は作り直し | `MigrationFailed`（作り直しの文） | 作り直しの後に起動 | M1〜M7 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 停止の入口（SPEC-STOP-D1〜D4） | `rg -l '一時停止中' src src-tauri/src --glob '!src/lib/bindings.ts'` の 10 file | 全部を撤去 | — | AC6・U16 |
| 旧本体の呼出し | `rg -c 'legacy_(commit_csv_import\|rollback_csv_import\|start_stocktake\|update_count\|complete_stocktake)\(' src-tauri/src` の 7 file | 全部を新しい経路か撤去へ（T2） | — | AC6・AC10 |
| IME の確定の Enter の guard（UI-10-D2 の追記 2） | `rg -n 'isComposing' src/features/stocktake src/features/receiving` | 新しい数量欄・日付の欄・入れ直しの欄 | — | U1 と既存の T23 を移す |
| 数量の空欄の FieldError（ST-C5-D1） | `StocktakePage.test.tsx` の T-C5-1〜4 | 「数を保存」「入れ直す」の両方 | — | T5 の移す行 |
| m の入力（SPEC-UNIT-D3 の `parseLengthInput` の系） | `rg -n 'parseRequired|parseLength|unit-quantity' src/features/receiving src/features/disposal src/lib` | 棚卸しの実数の欄 | — | U4 |
| query invalidation（D-052 の SSOT） | `src/features/stocktake/stocktake-error-invalidation.ts` と各 hook の `invalidateQueries` | 保存・0 にする・完了・Z004 の取込みと取消 | — | U15 |
| `CmdErrorKind` の網羅（`CMD_ERROR_KIND` の `satisfies`、`describeError`、`BackupRestorePage` の kind の分岐） | `rg -n 'restore_durability_unknown' src src-tauri/src --glob '!src/lib/bindings.ts'` | `invoke.ts`・`describe-error.ts` | `BackupRestorePage` は restore の kind だけを分ける（`stocktake_guard` を受けない画面なので足さない） | W7 |
| route search の `returnTo`（UI-01b-D2 ほか） | `rg -n 'returnTo' src/routes` | `/stocktake/` の search | — | U9 |
| 生成の enum（D-061） | `src-tauri/src/finite_enum_contract_tests.rs` の一覧 | 新しい 5 つ | — | W6 |
| 写しを求め直す書く経路（(a) の Y2） | `rg -n 'recompute_stock\(' src-tauri/src --glob '!*test*'` | 計数の保存・0 にする・Z004 の確定と取消・連動の切替 | 完了（在庫を動かさない） | L12・C1・Z8・Z14・J6 |

## Negative Paths

- missing input: 精算回数・マシンNo. の無い Z004（Z1）、計数の値の空欄（U1 の FieldError）。
- invalid input: 形の違う日付・実在しない日付・未来の日付（C3）、範囲の外の計数（C4）、範囲の外の精算回数（Z1）、× 100 で溢れる長さの行（Z12）。
- duplicate/ambiguous input: 同じ hash（Z3）、同じ精算の別の版（Z4）、共有 JAN の行（Z10）、重なる計数の値の違い（L10 の衝突）。
- unknown reference: 別の商品の明細・進行中でない明細（C5）、preview の後に消えた商品（Z13）。
- dependency missing: 未取込みの精算（K2）、計数の無い商品の在庫連動の開始（J4）。
- permission/write failure: 在庫の上限・評価額の範囲で TX 全体が戻る（K5・Z16）、vZ の確かめの失敗（M3）。
- dry-run side effect: preview（`parse_and_validate`）と `preview_stock_count_placement`・`list_recheck_products`・`derive_stock` は書かない（Z6・C7・C9 で DB の行数が変わらないことを確かめる）。

## Boundary Checks

- threshold: 計数 `999999999` と `1000000000`（C4）、精算回数 `9007199254740991` と `9007199254740992`（Z1）、長さの行 `99999`（× 100 で `9999900`）と `100000`（Z12）、評価額の総額 9 個と 10 個（K5）。
- null/default: fresh の `settlement_no` が NULL（L4・C2）、`seen_movement_id` 0、`stock_linked` の既定 0（M6）、カーソル NULL（K1）。
- empty/non-empty: 精算の取込みが無い DB（L4・K2 の (i)(iii)）、正常な行が全て 0 の file（Z9）、要再確認が 0 の一覧。
- min/max: 欠けの区間の端（Z6）、範囲の最小と最大（L5）。
- status/policy enum: `count_kind`・`block_reason`・`action`・`code`・`recount_reasons`（W6・W8）。
- wire type: 数は number（安全な整数）、読取りの金額は十進の文字列（R1・R2）。
- internal type: `RecheckReason` と `RecountReason` の順（L10・W6）。
- producer/consumer: CMD の今日（W3）、画面の日付の欄の ISO（U2）。
- round-trip token: preview token（W5）。
- precision/range: m の入力の 2 桁（U4）、行のロス原価の基準数量（R1）。
- cross-language parse: `CmdErrorKind` の TS の twin（W7）。

## Compatibility Checks

- old schema/input: 直前の版の DB（M2）、従来の形の Z004（Z1。今の tracked の fixture `tests/fixtures/z004/normal-small.csv` ほかを拒否の入力に使う）。
- new schema/input: layout A の精算の識別メタを持つ Z004（test の helper `make_z004_bytes` を精算回数つきに）。
- output order: 欠けの区間の昇順、共有 JAN の一覧の JAN と商品コードの昇順、`recount_reasons` の順。
- optional field behavior: `stocktake_recovery` は既存の kind で null、`after_completion` は完了していなければ null。

## Data Safety Checks

- source-derived data: 無い（実データを使わない）。
- generated outputs: `src/lib/bindings.ts`、`docs/function-design/90-traceability.md`。
- secrets: 無い。
- local-only files: owner の L3 用の DB（作り直すときは消さずに移す。packet の Data Safety）。
- synthetic sample boundaries: `tests/fixtures/z004/` の合成の Z004（CP932・CRLF、マシンNo. `0001`）と商品の CSV、Rust・TS の fixture。

## Main Wiring / Integration Checks

- helper connected to main path: 計数の保存・完了・Z004 の確定と取消が `recompute_stock` を通る（C1・Z8・Z14）。CMD が BIZ を呼ぶ（W2〜W5）。
- output reaches manifest/report: 取込みの結果の `recheck_targets` と知らせが画面に出る（U10・U11）。
- effective config reaches runtime: 在庫連動の設定が確定の TX で `stock_linked` に写る（Z8・L6）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → 画面の test の mock の在庫・範囲・理由は設計正本の例（「4〜5」・理由の文）と違う値にし、表示がその mock の値を出すことを見る（U6・U11）。BIZ の test は fixture の記録から期待を手で計算し、`derive_stock` の結果と比べる（L・C・K）。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → U15、完了の結果の前回の要約（UI-10-D5 の snapshot を保つ既存の T19 を移す）。
- If a key branch is inverted, which test fails? → A1（L1）、`k ≤ n`（L3）、`stock_linked`（L6）、廃番 0 の例外（K4）。
- If a threshold comparison changes, which test fails? → C4・Z1・Z12・K5。
- If a guard is removed, which test fails? → C3・C5・Z13・J2・M3。
- If an output field is omitted, which test fails? → C1（結果の field）、Z8（`recheck_targets`）、W1（`stocktake_recovery`）。
- If output order changes, which test fails? → Z6・I1・L10。
- If dry-run performs a side effect, which test fails? → Z6・C7・C9 の行数の確かめ。
- If a JSON number crosses JavaScript safe integer range, which test fails? → Z1（精算回数）、K5（総額）、R2（読取りの金額は文字列）。
- If a state token is round-tripped through browser/client code, which test fails? → W5（preview token）、U9（`returnTo`）。

## 既存の test の移し方

着手時に下の command を逐語で回し、表と違う所があれば表を直してから進める（2026-10-22 の HEAD `c98fe7dd` で測った）。分類は 3 つ: **移す**（契約が新しい経路に残る。呼び先と fixture を新しい経路へ替え、値の期待〈`assert` の右辺・件数・message〉を変えない）、**期待を変える**（設計正本の契約の変更。正本の節を書く）、**契約ごと外す**（ADR・owner の決定で契約が置き換わった。置き換えた節と、同じ失敗を止める Matrix の行を書く）。

### T1 最新の版の期待

```
$ rg -n 'max_version_and_count\(&conn\), \(10, 10\)|version_and_products\(&conn\), \(crate::db::VB_VERSION, 0\)' src-tauri/src
src-tauri/src/lib.rs:1215:        assert_eq!(version_and_products(&conn), (crate::db::VB_VERSION, 0));
src-tauri/src/lib.rs:1249:        assert_eq!(version_and_products(&conn), (crate::db::VB_VERSION, 0));
src-tauri/src/db/migration.rs:1548:        assert_eq!(max_version_and_count(&conn), (10, 10));
src-tauri/src/db/migration.rs:1687:            assert_eq!(max_version_and_count(&conn), (10, 10));
exit=0
```

- **期待を変える**（22 §20: 最新の版が vZ になる）: 4 行とも最新の版の期待を vZ の版の定数へ（`lib.rs` の 2 行は「作り直しの後の空の DB は最新の版まで当たる」の意味なので vZ の定数。vB の定数のままにしない）。`migrate_up_to` で版を指定する test と、`app_max_version()` を引く test（`migration.rs` 5・`test_support.rs` 3。`schema_time_evidence.rs` の 3 は撤去）は変えない。

### T2 旧本体・停止の test

```
$ rg -c 'legacy_(commit_csv_import|rollback_csv_import|start_stocktake|update_count|complete_stocktake)\(' src-tauri/src
src-tauri/src/biz/csv_import_service/commit.rs:1
src-tauri/src/biz/csv_import_service/tests/rollback_tests.rs:15
src-tauri/src/biz/csv_import_service/tests/commit_tests.rs:17
src-tauri/src/biz/csv_import_service/tests/legacy_stop_tests.rs:10
src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs:5
src-tauri/src/biz/csv_import_service/rollback.rs:1
src-tauri/src/biz/stocktake_service.rs:37
exit=0
$ rg -c '#\[test\]' src-tauri/src/biz/csv_import_service/tests/commit_tests.rs src-tauri/src/biz/csv_import_service/tests/rollback_tests.rs src-tauri/src/biz/csv_import_service/tests/legacy_stop_tests.rs src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs src-tauri/src/biz/csv_import_service/tests/parse_tests.rs src-tauri/src/biz/csv_import_service/tests/list_tests.rs src-tauri/src/biz/stocktake_service.rs src-tauri/src/cmd/stocktake_cmd.rs src-tauri/src/cmd/csv_import_cmd.rs
src-tauri/src/cmd/csv_import_cmd.rs:4
src-tauri/src/cmd/stocktake_cmd.rs:10
src-tauri/src/biz/stocktake_service.rs:40
src-tauri/src/biz/csv_import_service/tests/list_tests.rs:6
src-tauri/src/biz/csv_import_service/tests/parse_tests.rs:22
src-tauri/src/biz/csv_import_service/tests/legacy_stop_tests.rs:7
src-tauri/src/biz/csv_import_service/tests/rollback_tests.rs:8
src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs:5
src-tauri/src/biz/csv_import_service/tests/commit_tests.rs:15
exit=0
```

`commit_tests.rs`（15）:

| test | 分類 | 理由 / 代わりの行 |
|---|---|---|
| `test_commit_req401_normal_flow`、`test_commit_req401_toctou_check`、`test_commit_req401_pos_stock_sync_false`、`test_commit_req401_negative_stock_warning`、`test_commit_req401_partial_with_errors`、`test_commit_req401_sign_flip_inv1`、`test_preview_req401_pos_quantity_limit_is_row_error`、`test_commit_req401_stock_limit_rolls_back_whole_tx` | 移す | 売上・行の error・状態・同じ hash の再検査・連動 off・符号・上限は 32 の新契約に残る。fixture の Z004 に精算回数を足す（Z3・Z11・Z16） |
| `test_commit_req401_same_day_additional_import_is_insert_only`、`test_commit_req401_additional_import_requires_confirmation`、`test_commit_req401_same_date_snapshot_removal_requires_repreview`、`test_commit_req401_same_date_snapshot_replace_requires_repreview`、`test_commit_req401_same_date_snapshot_order_requires_exact_match`、`test_commit_req401_additional_confirmation_without_duplicate`、`test_commit_req401_settlement_date_toctou` | 契約ごと外す | ADR D4 の「同じ精算日の別の精算は確認なしに別の取込み」（D-071 の Z004 の側の置換え）。`test_commit_req401_settlement_date_toctou` も同じ日の snapshot の照合（preview の後に別の経路で同じ日の取込みが入る。test の comment は SPEC-SDI-D4）。同じ精算の二重は順 4、確定の TX の取り直しは Z4・Z7・Z15 |

`rollback_tests.rs`（8）:

| test | 分類 | 理由 / 代わりの行 |
|---|---|---|
| `test_rollback_req401_normal`、`test_rollback_req401_idempotent`、`test_rollback_req401_not_found`、`test_rollback_req401_same_day_is_per_import_with_negative_return`、`test_rollback_req401_selected_negative_return_reverses_only_return_contribution`、`test_import_rollback_req401_logs_exact_selected_id_and_preserves_commit_on_log_failure`、`test_rollback_req401_stock_limit_rolls_back_whole_tx` | 移す | 取込みごとの取消・冪等・操作ログ・上限は残る。在庫の期待は求め直しの値（計数の無い fixture では今と同じ和） |
| `test_rollback_req401_stock_corrections` | 契約ごと外す | ADR D7「補償の movement は作らない」、`StockCorrection` を外す。Z14 |

`cross_feature_tests.rs`（5）: model の 3 本は移す（X3）。診断 2 本は `#[ignore]` を外して改名し、新しい経路で PASS する回帰 test にする（X1・X2。ADR D12・停止 ADR SPEC-STOP-D3 の「診断 2 本は新しい経路で PASS する回帰 test に変える」）。

`legacy_stop_tests.rs`（7、file ごと撤去）: 停止の assert（5 つの入口が停止 error・DB の全表が不変）は契約ごと外す（停止 ADR を superseded にする。SPEC-STOP-D6 の解除）。F1〜F7 の入力は新しい経路の test の入力に移す: F1（STK-1）→ X1、F2（STK-2）→ X2、F3（旧い形の明細と取込み）→ M3（vZ の止まり。v9 で既に止まる形）、F4（全て 0 の行）→ Z9、F5（共有 JAN）→ Z10、F6（逆順）→ Z5、F7（欠けた日）→ Z6・L11。

`stocktake_service.rs`（40）:

| test | 分類 | 理由 / 代わりの行 |
|---|---|---|
| `test_get_active_stocktake_req205_*`（2）、`test_find_stocktake_item_req205_*`（2）、`test_get_last_completed_stocktake_req205_*`（2）、`test_get_progress_req205_normal`、`test_get_progress_req205_not_found`、`test_get_stocktake_record_req206_not_found_message`、`test_get_stocktake_record_req206_status_enum_and_fail_fast` | 移す | 読取りの契約は残る（進捗の計数済みの定義は C10。fixture は計数を入れる） |
| `test_start_stocktake_req205_normal`、`test_start_stocktake_req205_already_in_progress`、`test_start_stocktake_req205_no_eligible`、`test_start_stocktake_req205_operation_log` | 移す | 開始の契約は残る（K7・K8） |
| `test_start_stocktake_req205_auto_fill_discontinued` | 契約ごと外す | tracking「自動の 0 の入力を持たない」。廃番かつ写し 0 は完了を止めない（K4） |
| `test_update_count_req205_normal`・`_negative`・`_zero_is_valid`・`_item_not_found`・`_not_in_progress`・`_dynamic_difference` | 契約ごと外す | `update_count` は 42 の新契約で外す。同じ失敗は C1・C4・C5・C10 が止める |
| `test_complete_req205_normal_all_counted`、`test_complete_req205_not_found`、`test_complete_req205_already_completed`、`test_complete_req205_total_cost_multiple_products`、`test_complete_req205_total_cost_overflow`、`test_complete_req205_total_cost_length_product_per_meter`、`test_complete_req205_total_cost_rounds_half_up_at_yen`、`test_complete_req205_negative_cost_rolls_back`、`test_complete_req205_total_cost_yen_overflow`、`test_complete_req205_operation_log`、`test_complete_stocktake_req205_includes_integrity_result` | 移す | 評価額（§20.5a）・状態・ログは残る。評価数量は `max(写し, 0)` で、fixture の計数を保存した後の写しが今の `actual_count` と同じなら値は同じ（K1・K6・K8） |
| `test_complete_req205_force_fill_true`、`test_complete_req205_force_fill_false_uncounted`、`test_complete_req205_force_fill_sets_actual_to_system_stock`、`test_complete_req205_force_fill_negative_stock_clamped_to_zero` | 契約ごと外す | owner の決定 TD-263 の Q7 = b（force_fill を持たない）、ADR D6。未計数は K4、0 にするは C8 |
| `test_complete_req205_creates_movements`、`test_complete_req205_no_difference`、`test_complete_req205_stock_after_equals_actual` | 契約ごと外す | ADR D6「完了は在庫を動かさない」。K1 が「movement 0・写し不変」を止める |
| `test_get_stocktake_record_req207_movement_source` | 契約ごと外す | 65 の新契約（記録の詳細は補正の movement の節を持たない）。R3 |

`stocktake_cmd.rs`（10）: `test_update_count_req205_negative_stops_before_validation`・`test_update_count_req205_zero_stops`・`test_start_and_complete_stocktake_req205_stop` は契約ごと外す（停止 ADR の撤去。W2〜W4 が新しい command の wire を止める）。残り 7（ページの検証 2・find 2・last completed・active・record の not found）は移す。

`csv_import_cmd.rs`（4）: `test_get_csv_import_record_cmd_req206_not_found_kind` は移す。`test_csv_cmd_req401_parse_cache_preserves_ordered_same_date_ids` は契約ごと外す（同じ日の取込みの一覧を Z004 で使わない。ADR D4）。`test_csv_cmd_req401_commit_stop_keeps_preview_token`・`test_csv_cmd_req401_rollback_stop` は停止の assert を外し、token を残す振舞いは W5 が持つ。

`parse_tests.rs`（22）・`list_tests.rs`（6）: 旧本体を呼ばない。parse の test は fixture に精算回数を足す（従来の形の拒否を確かめる test は従来の形のまま Z1 へ）。`test_parse_and_validate_req401_future_settlement_date`（「未来」の拒否を確かめる）は期待を変える（32: 精算日が今日より後は拒否せず知らせ。Z6）。同じ日の取込みの一覧（`duplicate_check`）を確かめる parse の test は契約ごと外す（ADR D4。Z7）。

`disposal_repo.rs` の `test_list_inventory_records_req206_stocktake_item_count_diff_only`: 期待を変える（65: 棚卸しの件数は明細の数。R3）。

### T3 時点証拠の test

```
$ rg -c '#\[test\]' src-tauri/src/db/schema_time_evidence.rs src-tauri/src/biz/stocktake_service/time_evidence.rs src-tauri/src/biz/stocktake_service/time_evidence_tests.rs src-tauri/src/biz/csv_import_service/time_evidence.rs src-tauri/src/biz/csv_import_service/tests/time_evidence_tests.rs src-tauri/src/db/inventory_repo.rs src-tauri/src/db/stocktake_repo.rs src-tauri/src/db/sales_repo.rs
src-tauri/src/db/sales_repo.rs:53
src-tauri/src/db/stocktake_repo.rs:45
src-tauri/src/db/inventory_repo.rs:23
src-tauri/src/biz/csv_import_service/tests/time_evidence_tests.rs:14
src-tauri/src/biz/stocktake_service/time_evidence_tests.rs:19
src-tauri/src/db/schema_time_evidence.rs:8
exit=0
```

- **契約ごと外す**: 時点証拠 ADR（SPEC-STK-TIME-D1〜D10）は D-118 で superseded で、D-109 で `#[cfg(test)]` に置いた code は「runtime の lane が外す」（ADR D12、35・32・21 の D-118 の節）。file ごとの 3 つ（`schema_time_evidence.rs` 8、`stocktake_service/time_evidence_tests.rs` 19、`csv_import_service/tests/time_evidence_tests.rs` 14）と、`inventory_repo.rs`・`stocktake_repo.rs`・`sales_repo.rs` の `mod time_evidence` の中の test（3 file の `#[test]` の数は file 全体の数で、そのうち `mod time_evidence` の中の分だけを外す。着手時に `rg -n 'mod time_evidence' -A` で範囲を確かめる）。同じ失敗を止める行は無い（契約そのものが無くなった）。

### T4 停止の画面の test

```
$ rg -c 'writesSuspended|一時停止中|WRITES_SUSPENDED|IMPORT_SUSPENDED' src
src/features/stocktake/StocktakePage.tsx:8
src/features/stocktake/StocktakePage.suggest.test.tsx:1
src/features/stocktake/StocktakePage.test.tsx:2
src/features/csv-import/CsvImportPage.test.tsx:1
src/features/csv-import/CsvImportPage.tsx:3
src/features/csv-import/components/PreviewStep.tsx:2
exit=0
```

- 停止の案内と無効化を確かめる test は契約ごと外す（SPEC-STOP-D4 の撤去）。U16 が「押せる・案内が無い」を止める。flow の test が渡していた「停止 off」の prop は外す（値の期待は変えない）。

### T5 棚卸しの画面の test

```
$ rg -c '^\s*(it|test)\(' src/features/stocktake/StocktakePage.test.tsx src/features/stocktake/StocktakePage.suggest.test.tsx src/features/stocktake/lib/stocktake-formatters.test.ts
src/features/stocktake/lib/stocktake-formatters.test.ts:10
src/features/stocktake/StocktakePage.suggest.test.tsx:4
src/features/stocktake/StocktakePage.test.tsx:56
exit=0
```

- 移す: UI-10-D1〜D13 の振舞い（開始・継続の表示、検索・HID・候補・名前の検索の fallback・IME の guard・focus・廃番 badge・絞り込み・ページ送り・`stocktake_in_progress`・`stocktake_not_in_progress` の扱い・前回の要約の snapshot）と数量の空欄の FieldError（T-C5-1〜4）。mock の `updateCount` を `saveStockCount` に替え、送る引数の期待を新しい request の形にする（値は同じ）。
- 契約ごと外す: force_fill の確認と再送（T9・T10・T20）。owner の決定 TD-263、ADR D6。U7 が完了の拒否の一覧と 0 にするを止める。
- `stocktake-formatters.test.ts` の差異の計算（`update_count` の `current_difference` と同じ式）は、差異を BIZ が返す（35 の新契約の「読取り」）ので画面の計算をやめ、その test は契約ごと外す（C10・U1 が止める）。表示の formatter（日時・数量）の test は移す。

### T6 Z004 タブの test

```
$ rg -c '^\s*(it|test)\(' src/features/csv-import/CsvImportPage.test.tsx src/features/csv-import/components/PreviewStep.test.tsx src/features/csv-import/components/ResultStep.test.tsx src/features/csv-import/hooks/useCsvImportFlow.test.tsx src/features/csv-import/reducer.test.ts
src/features/csv-import/reducer.test.ts:6
src/features/csv-import/hooks/useCsvImportFlow.test.tsx:9
src/features/csv-import/components/ResultStep.test.tsx:1
src/features/csv-import/CsvImportPage.test.tsx:2
src/features/csv-import/components/PreviewStep.test.tsx:4
exit=0
```

- 期待を変える: `reducer.test.ts`・`useCsvImportFlow.test.tsx` の `additionalImportConfirmed` の payload と commit の引数（41: Z004 は使わない）。
- 移す: 取込みの流れ・error の表示・離脱の抑止。`PreviewStep.test.tsx` の `AdditionalImportConfirmDialog.tsx?raw` の日時の書式の test は、dialog を日報取込みタブが使い続けるので移す（置き場所を日報取込みの test へ移すかは着手時に決める）。
- 契約ごと外す: 停止の案内の test（T4 と同じ）。

### T7 `CmdError` の構築と mock

```
$ rg -c 'CmdError \{' src-tauri/src
src-tauri/src/cmd/csv_import_cmd.rs:4
src-tauri/src/cmd/daily_report_import_cmd.rs:5
src-tauri/src/cmd/disposal_cmd.rs:1
src-tauri/src/cmd/inventory_cmd.rs:1
src-tauri/src/cmd/manual_sale_cmd.rs:1
src-tauri/src/cmd/mod.rs:12
src-tauri/src/cmd/plu_export_cmd.rs:1
src-tauri/src/cmd/product_cmd.rs:1
src-tauri/src/cmd/receiving_cmd.rs:1
src-tauri/src/cmd/return_cmd.rs:1
src-tauri/src/cmd/settings_cmd.rs:4
exit=0
$ rg -l 'error_id: null' src --glob '*.ts*' | wc -l
34
exit=0
```

- 移す（機械的な追随）: Rust の 32 か所の struct の literal に `stocktake_recovery: None`、TS の `CmdError` の型の mock に `stocktake_recovery: null`（値の期待は変えない）。TS の 34 file のうち型が `CmdError` でない literal は変えない（着手時に typecheck の error で数え直す）。

### T8 棚卸しの記録の詳細の画面の test

```
$ rg -c '^\s*(it|test)\(' src/features/inventory-records/StocktakeRecordDetailPage.test.tsx
7
exit=0
```

- 期待を変える（65 の新契約）: 補正の movement の節・`adjustment_quantity` と画面のロス原価の計算を確かめる行は、明細の数・差異・BIZ のロス原価の文字列・完了の後の差へ（U13）。到達・戻り・not found の test は移す。

### T9 生成の enum と kind の一覧

```
$ rg -n 'restore_durability_unknown|RestoreDurabilityUnknown' src src-tauri/src --glob '!src/lib/bindings.ts' | wc -l
16
exit=0
```

- 移す: `cmd/mod.rs` の kind の test と `finite_enum_contract_tests.rs` の一覧に `stocktake_guard` と新しい 5 つの enum を足す（W1・W6）。`BackupRestorePage` の kind の分岐は変えない（Adjacent Pattern Audit の除外）。

## Residual Test Gaps

- Windows の実機での HID・IME・native の file dialog の CP932 の取込みは L3（packet の Test Plan の L3-3・L3-5・L3-8）。
- 移行の前からある共有 JAN の組の画面の一覧は、DB の手での改変が要るので L3 に入れず、U14 と画面の写し。
- 日付の変わり目（U5）は時計を差し替える自動 test と画面の写しで、Windows の実機の時計では見ない。
- 計数の衝突（理由 3）の画面の表示は L3 の台本に入れず、C10・U6 と画面の写し。
- 店の PC の件数（数千点）での Z004 の確定と完了の時間は未実測（ADR の Consequences の「1 商品の求め直しは合成データで 0.01 ms 未満」は repo の外の測定）。実装の後に合成の 3000 商品の fixture で測るかは S5 で決める（R4 の L3 の合否に入れない）。
