# Test Design Matrix: 棚卸しの数の置き場と在庫数の求め直しを設計正本へ置き換える

Packet: [2026-10-16-stocktake-count-placement-design](../2026-10-16-stocktake-count-placement-design.md)。本 lane は docs だけで、下の Test Matrix は後続の runtime の lane が実装する test の設計（oracle は [ADR](../../../adr/2026-10-16-stocktake-count-placement.md) と各文書の「計数の置き場と在庫の求め直しの契約」）。本 lane が実行する検査は「本 lane の検査」の表。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-STK-CNT-D1 並びの鍵（保存・表示の順。計数に入っているかは D3 の窓で決める）。
- SPEC-STK-CNT-D2 求め直し（効く計数 + それに入っていない記録の和。計数が無ければ全ての和。求め直しの入力が変わる TX はそれに依る全ての商品を求め直す。写しを書くのは求め直しの関数だけ。`stock_after` は保存した時点の写し）。
- SPEC-STK-CNT-D3 窓の原理と判定表（既定の計数・fresh な計数 × 入出庫・精算・初期在庫、計数どうし、A1）、要再確認の 3 つの理由（決まらない精算の行が個数 ≠ 0 または金額 ≠ 0、決まらない入出庫、計数の衝突）と範囲と解け方。
- SPEC-STK-CNT-D4 Z004 の取り込む条件（精算回数の有無・machine_no・同じ精算の別版・精算日と精算回数の順）、欠けの知らせ、日付のずれの知らせ、共有 JAN の行。
- SPEC-STK-CNT-D5 既定の計数（日付を選べる、未来の日付の拒否、後の計数の知らせ）と fresh な計数（今日だけ、保存の時点の精算回数と movement の id）。
- SPEC-STK-CNT-D6 完了の 3 条件、「0 にする」、廃番かつ在庫 0 の対象外、完了の後の差の表示（保存しない）、評価額の固定と非遡及。
- SPEC-STK-CNT-D7 取消は無効にして求め直す。取り消した精算の別版を取り込める。
- SPEC-STK-CNT-D8 在庫連動を始めるときの拒否。
- SPEC-STK-CNT-D10 migration が止まる DB と止まらない DB。
- SPEC-STK-CNT-D12 / SPEC-STOP-D6 5 つの入口の一括の解除。
- BIZ-07（D-051 の Superseded in part）写しと求め直しの比較。

## Failure Modes

- F1 手入力を保存の順で並べ、日をまたいで入荷が計数に吸収される・二重になる（素描の review P1-2）。
- F2 締めの前に数えて取込みの後に保存した数を「後」に置き、その日の売上を引き漏らす（素描の review P1-1）。
- F3 同じ置き場に紙の古い数が後から入り、新しい保存として効いて棚の数が戻る（過去の review の AP-CB :423、素描 N-3）。
- F4 決まらない精算を、個数だけで判定して金額だけ残った行を見逃す（Q2 の B）。
- F5 「後」の計数の後の同じ日の 2 回目の精算を全部引いて過小にし、要再確認も出ない（素描 N-1）。
- F6 計数が movement を作り、求め直しと二重に効く。確定が在庫を動かす（STK-1 の再発）。
- F7 後着の古い精算の Z004 が計数の後として引かれる（STK-2 の再発）。
- F8 取消で計数に吸収済みの売上を戻し二重になる（取消の補償の要る形の再発）。
- F9 精算回数の無い file・同じ精算の別版を確認だけで通し二重計上する。
- F10 reset・時計の戻りで並びが食い違ったまま取り込み、置き場が誤る。
- F11 要再確認・決まらない精算の未取込み・未計数があるのに完了でき、評価額が固定される。
- F12 完了の後の記録で評価額が書き換わる。
- F13 写しを書く経路が求め直しの外に残り、写しと記録がずれる（整合性の検査が見つける側にも回らない）。
- F14 停止の入口の一部だけが開く（SPEC-STOP-D6 違反）。
- F15 棚卸しのある DB で migration が旧行を推測の位置で移す。
- F16 連動しない間の売上がある商品の在庫連動を始め、在庫が黙って過大になる。
- F17 入れ直し（fresh）が、保存の前に入れた同じ日の入出庫を決まらないとして過剰に要再確認を出す（round 1 の R1）。
- F18 「後」の計数で同じ日の n+2 以降の精算（3 回目）を黙って全部引き、二重に引く（round 1 の R2・H1）。
- F19 精算の欠け（取り込み済みの 2 本の間）を見逃して完了できる（round 1 の R5）。
- F20 打ち直しの方法が無く、誤った数が残る。または紙の古い数が入れ直しの数を黙って負かす（round 1 の R6・R7）。
- F21 精算の一覧が変わる TX（確定・取消・欠けの後追い）で、その取込みに行が無い計数のある商品を求め直さず、写しが古いまま（round 1 の R3・H3）。
- F22 正常な行が全て 0 の Z004 を拒み、その精算が欠けとして残る（round 1 の R4）。
- F23 計数より前の日付の記録を後入力して、writer の 1 つが写しを増減させる（round 1 の R12）。
- F24 要再確認の間に在庫連動を切ると、連動中の movement が残るのに理由と範囲が消え、完了できる（round 2 の 1）。
- F25 取込みの無い状態の fresh な計数のカーソル 0 が精算回数 0 とぶつかり、精算 0 の売上を入っているとみなす（round 2 の 2）。
- F26 連動しない間の売上が計数にとって決まらないのに在庫連動を始められる（round 2 の 3）。
- F27 同じ値で重なる既定の計数と fresh な計数で、どちらの窓で判定するかが定まらない（round 2 の 4）。
- F28 整合性の検査が数だけを比べ、印や範囲だけ違う商品を「差異なし」とする（round 2 の 6）。

## Test Matrix

- 本 lane は既存の test を引いていない（runtime の lane が `rg` で確かめてから既存の test を回帰の対照に引く。診断 2 本は `rg -n 'fn diagnostic_cross_feature_req205' src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs` で確かめた: `diagnostic_cross_feature_req205_count_then_movement`・`diagnostic_cross_feature_req205_req401_late_import` の 2 本）。
- oracle は ADR・31・32・35 の文から転記し、mutation は production 側だけを変える。各組合せに非空の期待を 1 件以上置く（要再確認が「無い」ことだけを期待する case で kill を主張しない）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D3 | F1 | unit（BIZ、合成 DB） | `default_count_absorbs_earlier_dated_movement` | 入庫（日付 D−1）→ 既定の計数（D）→ D の精算: 在庫 = 計数 − （D の精算は決まらない、写しでは適用）。入庫を計数の後に足すと入庫の分だけ大きくなる |
| D3 | F1 | unit | `default_count_excludes_later_dated_movement` | 既定の計数（D）→ 入庫（D+1）: 在庫 = 計数 + 入庫（要再確認なし） |
| D3 | F17 | unit | `fresh_count_absorbs_movements_saved_before_it` | 入庫（今日 T、保存）→ fresh な計数（T）: 入庫は入っている、要再確認なし。fresh の後に入庫（T）を保存すると決まらない（`same_date_movement`）、範囲 = 計数〜計数 + 入庫 |
| D3 | F17 | unit | `default_count_same_date_movement_is_recheck` | 入庫（D、保存）→ 既定の計数（D）: 決まらない（既定の計数の窓は日付 D の全体）、範囲 = 計数〜計数 + 入庫、写し = 計数 + 入庫 |
| D3 | F18 | unit | `fresh_count_all_later_same_day_settlements_are_undetermined` | 精算 n（日付 T）取込み → fresh な計数 → 精算 n+1・n+2（どちらも日付 T）で売れた: どちらも決まらない（要再確認）。n+1 だけを決まらないとすると n+2 の売上を黙って引く |
| D3 | — | unit | `default_count_next_day_settlement_is_not_undetermined` | 既定の計数（D）、D に精算 n があり、精算 n+1（日付 D+1）で売れた: n だけ決まらない、n+1 は入っていない（A1 の固定。要再確認は n の行だけで判定） |
| D3 | — | unit | `fresh_count_next_day_settlement_is_not_undetermined` | 精算 n（日付 T）→ fresh → 精算 n+1（日付 T+1）で売れた: 要再確認なし、在庫 = 計数 − 売上（A1 の固定） |
| D3 | — | unit | `fresh_count_includes_late_older_settlement` | 精算 n（日付 T−2）だけ取込み → fresh な計数（T）→ 精算 n+1（日付 T−1）を後から取り込む: n+1 は入っている（引かない）。精算回数だけで後とすると引いてしまう |
| D3 | F7 | unit | `default_count_includes_late_older_settlement` | 既定の計数（D）の後に、精算 n−1（日付 D−1）を遅れて取り込む: 引かない（入っている） |
| D3 | — | unit | `default_count_all_settlements_on_date_are_undetermined` | 既定の計数（D）、精算 n・n+1・n+2 がどれも日付 D: 3 本とも決まらない |
| D3 | — | unit | `default_count_on_day_without_settlement` | 既定の計数（休業日 D）、次の精算 k（日付 D+1）と k+1（日付 D+2）: k だけ決まらない、k+1 は入っていない |
| D3 | — | unit | `initial_stock_is_always_absorbed` | 商品の登録（初期在庫 5、登録日 D）→ 既定の計数（D）: 初期在庫は入っている、要再確認なし（`same_date_movement` にしない） |
| D3 | F4 | unit | `undetermined_settlement_amount_only_row_is_recheck` | 決まらない精算に個数 0・金額 ≠ 0 の行: 要再確認（`undetermined_settlement`）。個数だけで判定すると出ない |
| D3 | — | unit | `undetermined_settlement_zero_zero_row_is_not_recheck` | 個数・金額とも 0 の行と、行が無い商品: 要再確認なし（非空の対照として同じ精算に個数 ≠ 0 の別の商品を置き、その商品は要再確認） |
| D3 | F3 | unit | `overlapping_default_counts_conflict` | 同じ日付 D の既定の計数 5 と 7: 要再確認（`conflicting_counts`）、写しの土台は 5、範囲は 5 を土台と 7 を土台の両方を含む。新しい方を効かせると要再確認が出ない |
| D3 | — | unit | `overlapping_equal_counts_count_as_one` | 同じ日付の既定の計数 5 と 5: 要再確認なし |
| D3 | F20 | unit | `fresh_count_supersedes_earlier_counts` | 既定の計数（T）7 → fresh な計数（T）5: 効くのは 5、衝突しない（打ち直し） |
| D3 | F20 | unit | `default_count_after_fresh_same_day_conflicts` | fresh な計数（T）5 → 既定の計数（T）7（紙の古い数）: 衝突で要再確認。既定の計数（T−1）7 なら fresh が効き衝突しない |
| D3 | — | unit | `closed_day_count_resolves_after_next_settlement` | 休業日 D の計数で次の精算 k（D+1）が決まらない: k を取り込んだ後の fresh な計数で解ける |
| D2 | F6・F13 | unit | `count_does_not_create_movement_and_complete_does_not_move_stock` | 計数の保存で `inventory_movements` の行数が変わらない。完了の前後で写しが同じ |
| D2 | F13 | unit | `copy_equals_sum_when_no_count` | 計数の無い商品で、入出庫 4 業務と Z004 と取消を混ぜた後の写しが `SUM(is_voided=0 の quantity)` と等しい（求め直しの写しと SUM の一致を見る。旧 writer の「保存した数 + 差分」も計数の無い商品では SUM と一致するので、writer の切替の検出には使わない。検出先は `backdated_record_before_count_does_not_change_copy_per_writer`） |
| D2 | F21 | unit | `settlement_list_change_recomputes_all_counted_products` | 計数（D）のある商品 A（Z004 の file に行が無い）と B: 精算の欠け k の後追いで、A の決まらない精算が変わり写しと要再確認が変わる（file に行がある商品だけを求め直すと A が古いまま）。取消でも同じ |
| D2 | F23 | unit | `backdated_record_before_count_does_not_change_copy_per_writer` | 既定の計数（D）の後に、日付 D−1 の入庫・返品交換・手動販売・廃棄・Z004 の精算（精算日 D−1）・商品の登録の初期在庫をそれぞれ入れる: どの writer でも写しが増減しない（入っている）。整合性の補正の後も同じ |
| D2 | — | unit | `stock_after_is_not_rewritten_by_backdated_record` | 後入力で前に記録が入っても、既存の movement の `stock_after` が変わらない |
| D4 | F9 | unit（BIZ-03） | `z004_without_settlement_no_is_rejected` | 従来の形の file（メタ無し）: preview と確定で `ImportError`（「精算回数の無い file は取り込めません」）、DB は不変 |
| D4 | F22 | unit | `all_zero_z004_is_imported_as_settlement_only` | 正常な行が全て 0 の file: 取込みは確定し、売上と movement は 0、精算の一覧に入る（欠けの知らせに出ない、計数の決まらない精算の判定に入る） |
| D4 | F9 | unit | `same_settlement_other_hash_is_rejected_unless_rolled_back` | 同じ machine_no・精算回数の active な取込みがあり hash が違う: 拒否。その取込みを取り消した後は取り込める |
| D4 | F10 | unit | `settlement_order_contradiction_is_rejected` | 取り込み済みの精算 n（精算日 D）に対し、精算回数 n+1 で精算日 D−1 の file、精算回数 n−1 で精算日 D+1 の file: どちらも拒否 |
| D4 | F10 | unit | `different_machine_no_is_rejected` | active な取込みと machine_no が違う file: 拒否 |
| D4 | — | unit | `gap_notice_lists_missing_settlement_ranges` | 取り込み済み n と n+3: `notices` に区間 n+1〜n+2 が 1 つ。n+1 を取り込むと区間 n+2（from = to）だけになる。取り込み済み n と n+2 と n+5: 区間 n+1 と n+3〜n+4 の 2 つ（昇順） |
| D4 | — | unit | `gap_notice_with_huge_settlement_no_is_bounded` | 精算 1 の後に精算回数が i64 の最大の Z004 を preview: 知らせは区間 2〜(最大 − 1) の 1 つで、preview が返る（番号を 1 つずつ並べると返らない） |
| D4 | — | unit | `future_settlement_date_is_notice_not_reject` | 精算日が today より後: 取り込める、`notices` に日付のずれ |
| D4 | — | unit | `same_date_other_settlement_needs_no_confirmation` | 同じ精算日で精算回数の違う file: `additional_import_confirmed` なしで確定できる |
| D4 | — | unit | `shared_jan_row_records_sales_only` | JAN を 2 商品が持つ行（1 つが在庫連動の場合と、どちらも連動でない場合）: 先頭の商品に売上だけを記録し、どの候補にも movement を作らず、全候補の写しが変わらない。行エラーにしない（TD-296） |
| D4 | — | unit（BIZ-01） | `shared_jan_change_from_linked_product_is_rejected` | 在庫連動の商品 A が自分の JAN を非連動の C と同じ値に変える update: `validation`（field `jan_code`）で拒む。C が A と同じ JAN に変える update、一括 import で同じ組を作る行も拒む |
| D10 | — | integration（migration） | `migration_reports_existing_shared_jan_violation` | 移行の前に在庫連動の商品と同じ JAN を持つ別の商品がある DB: 自動では変えず、件数と商品コードが `operation_logs` に残る |
| D4 | — | unit（BIZ-01） | `shared_jan_sync_enable_is_validation_error` | 別の商品と JAN を共有する商品の在庫連動の有効化: `validation`（field `pos_stock_sync`）、`stocktake_guard` にしない |
| D5 | — | unit（BIZ-06） | `fresh_count_stores_cursors_and_today` | fresh な計数: `business_date` = today、`settlement_no` = 取り込み済みの最大（取込みが無ければ NULL）、`seen_movement_id` = movement の最大 id（無ければ 0）。`business_date` が today と違えば `ValidationFailed` |
| D5 | — | unit | `future_business_date_is_rejected` | 既定の計数の `business_date` > today: `ValidationFailed`、DB は不変 |
| D5 | — | unit | `preview_placement_reports_later_count` | fresh な計数がある商品の前の日の分の既定の計数: `later_count_exists = true`、保存は拒まない |
| D6 | F11 | unit | `complete_blocked_by_pending_settlement_recheck_uncounted` | 3 つの条件をそれぞれ 1 つだけ満たさない棚卸し: `completion_blocked`、`block_reason` がそれぞれ `settlement_pending`・`recheck`・`uncounted`、DB は不変 |
| D6 | F19 | unit | `settlement_pending_when_no_settlement_before_count_date` | 導入の初めに、精算日 D の 2 本目の精算だけを取り込み（D より前の取込みが無い）、既定の計数（D）: `settlement_pending`（(iii)。1 本目の抜けを見逃さない）。D−1 の精算を取り込むと (iii) は解ける。D−1 の精算 100 と D の 102 を取り込み、101 が欠けたままなら (ii) の `settlement_pending` が続き、101 を取り込むと解ける |
| D6 | F19 | unit | `settlement_pending_detects_gap_between_imported` | 取り込み済み 100・102（どちらも精算日 D）、101 が未取込み、計数（D）: `settlement_pending`。「D 以上の精算が取り込まれていない」だけでは通ってしまう。fresh な計数（n = 102）なら k > n でないので pending にしない |
| D6 | — | unit | `zero_uncounted_with_selected_date` | 「0 にする」の日付に前の営業日を選ぶ: その日付の既定の計数になる。今日より後は `ValidationFailed` |
| D5 | — | unit（BIZ-06） | `stocktake_item_of_other_product_is_rejected` | 商品 A の `product_code` に商品 B の `stocktake_item_id` を付けて保存: 書く前に `ValidationFailed`、`stock_counts` と明細は不変 |
| D9 | — | schema | `movement_reference_type_null_with_phase_1_is_rejected` | `reference_type` が NULL で phase=1 の movement の INSERT は CHECK で拒まれる（`IS` の比べ方）。`reference_type='csv_import'` で phase=0 も拒まれる |
| D6 | — | unit | `post_completion_difference_of_undetermined_record_is_range` | 12/31 の入荷を入力し、12/31 の精算を取り込んだ後に、その商品を fresh な計数（「入れ直す」、12/31）で保存 → 要再確認が無いので完了できる → 年明けに日付 12/31 の別の納品書（+5）を後入力（fresh の後に保存した同じ日付の movement なので決まらない）: 差は確定の差の合計に入らず、「要再確認」の印と範囲（0〜+5、評価額も同じ 2 端）で出る |
| D6 | — | unit | `zero_uncounted_then_complete_fixes_valuation` | 未計数を「0 にする」→ 完了: 0 の既定の計数が今日に入り、評価額 = §20.5a の関数（評価数量 `max(写し, 0)`） |
| D6 | — | unit | `discontinued_zero_stock_item_does_not_block` | 廃番かつ写し 0 の未計数の明細: 完了を止めない |
| D6 | F12 | unit | `valuation_not_changed_by_backdated_record_after_completion` | 完了の後に棚卸しの期間の日付の入庫: 写しと要再確認は変わり、`total_cost`・`valuation_cost_price`・`valuation_quantity` は変わらない |
| D6 | — | unit | `post_completion_difference_is_shown_not_saved` | 同じ入庫の後、棚卸しの記録の詳細の差が入庫の数と等しい。評価額の差 = 凍結した原価で求め直した数量と `valuation_quantity` をそれぞれ §20.5a で評価して丸めた総額の差（負の数量を関数に渡さない）。完了日より後の日付の入庫は差に入らない。完了日の日付で完了の後に保存した入庫は差に入る（入出庫は業務日だけで切る。完了の前に保存した完了日の入庫は評価数量にも入っているので差 0）。DB には差を保存しない（TD-296） |
| D3・D8 | F24 | unit | `sync_off_keeps_recheck_and_range` | 連動中に計数（D）→ D の精算でその商品が売れて要再確認 → 在庫連動を切る: 理由（`undetermined_settlement`）と範囲が残り、完了は `recheck` で拒まれる。今の `pos_stock_sync` で理由 1 を判定すると消える |
| D3 | F25 | unit | `fresh_count_with_no_imports_then_settlement_zero` | 取込みの無い状態で fresh な計数 5（`settlement_no` は NULL）→ 同じ日に 2 売れる → 精算回数 0（精算日 = 今日）を取り込む: 精算 0 は決まらない（要再確認、範囲 3〜5）。カーソルを 0 にすると `k ≤ n` で入るとみなし写し 5・要再確認なし |
| D8 | F26 | unit（BIZ-01） | `enable_sync_rejected_when_unsynced_sale_is_undetermined` | 連動しない商品で既定の計数 10（D）→ D に 2 売れて精算を取り込む（`stock_linked=0`）→ 在庫連動を on: 売上が計数にとって決まらないので `recount_required`。fresh な計数を入れた後は通る |
| D3 | F27 | unit | `equal_default_and_fresh_counts_use_fresh_window` | 既定の計数（T）5 と fresh な計数（T）5 が重なる: 1 つとみなし、fresh の窓とカーソルで判定する（fresh より先に保存した今日の入出庫は入っている、要再確認なし） |
| BIZ-07 | F28 | unit | `integrity_detects_recheck_or_range_only_difference` | 写しの数は同じで `stock_recheck` だけ（または範囲だけ）を書き換えた商品: 不一致に出て、`differing_fields` が `recheck`（`range`）。補正のログに 4 項目の old / new |
| D7 | F8 | unit | `rollback_voids_and_recomputes_without_compensation` | 計数の後の精算の取込みを取り消す: 在庫 = 計数 + 残りの入っていない記録の和。計数に入っている精算の取込みを取り消す: 在庫は変わらない。補償の movement が無い |
| D8 | F16 | unit（BIZ-01） | `enable_sync_rejected_when_unsynced_sales_not_in_count` | 連動しない間の売上が効く計数に入っていない: `recount_required`。fresh な計数を入れた後は通る。計数が無く売上が 1 件でもあれば拒否 |
| D10 | F15 | integration（migration） | `migration_stops_when_stocktakes_or_csv_imports_exist` | `stocktakes` か `csv_imports` が 1 行でもある DB: 失敗、schema と行は不変 |
| D10 | — | integration | `migration_backfills_business_date_and_recomputes` | 入出庫と初期在庫だけの DB: `business_date` が業務記録の日付で埋まり、写しが移行前と等しい。移行前の `stock_quantity` を壊した商品を 1 つ置くと、写しは求め直しの値になり、`operation_logs` に old / new の行が 1 つ残る（黙って書き換えない） |
| D12 | F14 | integration | `stop_entrances_lifted_together` | 5 つの入口（棚卸しの開始・保存・完了、Z004 の確定・取消）が同じ build で全て新しい経路に繋がる。1 つでも停止 error を返すか、旧本体を呼ぶと fail |
| D12 | F6・F7 | regression | 診断 2 本（`diagnostic_cross_feature_req205_count_then_movement`・`diagnostic_cross_feature_req205_req401_late_import`）を新しい経路で書き直し `#[ignore]` を外す | 数えた後の入出庫が確定で消える、後着の Z004 が二重に引かれると fail |
| BIZ-07 | F13 | unit | `integrity_compares_copy_with_derive_stock` | 写しを直に書き換えた商品だけが不一致に出る。計数のある商品が SUM と違っても不一致に出ない。補正の後は不一致が 0 |

### 本 lane の検査（docs）

| 検査 | command | 期待 |
|---|---|---|
| doc 整合 | `bash scripts/doc-consistency-check.sh`、`bash scripts/doc-consistency-check.sh --target plan` | ERROR 0・WARN 0 |
| traceability | `cd src-tauri && cargo run --bin generate_traceability -- --check` | OK |
| 設計照合 | `cd src-tauri && cargo test --test design_compliance_test` | pass |
| AC の数 | packet の AC1〜AC8 の command | packet に書いた値 |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 商品の写し（在庫・要再確認・範囲） | 記録から求めた値 | 書込みの TX の中 | 同じ TX で求め直して書く | 計数・入出庫・Z004 の確定と取消・商品の登録・整合性の補正 | D-052 の SSOT で consumer を取り直す | 画面の再訪で DB の値 | 再起動でも DB の値（未保存の入力は残らない） | TX ごと戻る（写しも記録も変わらない） | 同じ操作をやり直す | Matrix の D2・BIZ-07 の行 |
| 計数（`stock_counts`） | 無し | 保存の TX | INSERT（消さない・書き換えない） | 後の計数（ADR D3 の「計数どうし」。fresh な計数は先の計数を全て置き換える）で効かなくなる | 棚卸しの一覧・要再確認の一覧 | 同上 | 同上 | TX ごと戻る | もう一度保存（同じ鍵の同じ値は 1 つとみなす） | D2・D5 の行 |
| 要再確認 | 無し | — | 求め直しの結果で付く | 「入れ直す」（fresh な計数）で解ける | 取込みの結果・棚卸しの一覧 | 再訪でも写しの印 | 同上 | — | — | D3 の行 |
| Z004 の取込み | 未取込み | preview（DB に売上を書かない） | 確定（売上・movement・求め直し） | 取消（無効にして求め直す） | 結果の要再確認の一覧 | 一覧の画面 | preview の cache は消える（file を選び直す） | 拒否（理由の message、DB 不変） | 正しい file・取り込み直し | D4・D7 の行 |
| 棚卸し | 無し → 進行中 | 完了の検査 | 完了（評価額の固定） | — | 結果の画面 | 記録詳細 | 進行中のまま再開 | `completion_blocked`（DB 不変） | 片付けてから完了 | D6 の行 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 写しの書込み（`update_stock_quantity` の呼出し） | repo 外の Q8 の範囲の調査 §2.1 の W1〜W7・T1（`rg -n "stock_quantity" -g '*.rs' src-tauri/src` の書込みの行） | 31・21・30・36 の新契約で、全て求め直しの関数へ寄せる | `seed_demo.rs`（開発用の bin。runtime の lane が求め直しを呼ぶ形にするか判断） | D2 の `backdated_record_before_count_does_not_change_copy_per_writer`（writer の切替）。`copy_equals_sum_when_no_count` は写しと SUM の一致だけ |
| 停止 ADR の 5 入口 | 停止 ADR SPEC-STOP-D1、32 §15.0、35 §20.0、55・73 の停止の節 | ADR D12・停止 ADR の改訂の段 | — | D12 の行 |
| 旧 ADR の契約の節 | `rg -l '^#+ 時点証拠契約' docs`（開始 32 file） | 31 file は新契約の節、23 は「精算の識別メタ」 | 旧 ADR 本文（superseded の記録） | packet の AC2 |
| 同日追加の確認（D-071） | pos-tables §12 のケース 2・3、32 の型（`additional_import_confirmed`）、41、55 | Z004 の側（精算回数の照合） | 日報の側（lane 2） | D4 の `same_date_other_settlement_needs_no_confirmation` |

## Negative Paths

- missing input: 精算回数・マシンNo. の無い Z004（拒否）。計数の日付の欠け（UI が既定の今日を送る。BIZ は欠けを `ValidationFailed`）。
- invalid input: 負の計数・上限超え（`ValidationFailed`）、未来の日付（`ValidationFailed`）、精算回数が整数でない（拒否）。
- duplicate/ambiguous input: 同じ hash（今の重複の拒否）、同じ精算の別版（拒否）、重なる計数の値の違い（要再確認）、共有 JAN の行（先頭の商品へ売上だけを保存し、全候補の在庫は変えない。行エラーにしない）。
- unknown reference: 進行中でない棚卸しの明細への計数（`ValidationFailed`）、無い商品（`NotFound`）。
- dependency missing: 決まらない精算が未取込み（完了の拒否 `settlement_pending`）、欠けた精算（知らせ）。
- permission/write failure: 求め直しの書込みの失敗（TX ごと戻る）、migration の失敗（全体を戻す）。
- dry-run side effect: preview と `preview_stock_count_placement` は DB を書かない。

## Boundary Checks

- threshold: 在庫の上限 `999999999`（写しと範囲の両端）。精算日と PC の今日の比較（今日より後で知らせ）。
- null/default: 計数の `settlement_no`・`seen_movement_id` は既定の計数で NULL。fresh な計数の `seen_movement_id` は NOT NULL（movement が無ければ 0）、`settlement_no` は取込みが無ければ NULL（精算回数 0 と区別する）。範囲は要再確認のときだけ NOT NULL。
- empty/non-empty: 計数の無い商品（全ての和）、記録の無い商品（0）、要再確認の一覧の空。
- min/max: 計数 0（売り切れ・「0 にする」）、精算回数の最小と最大の間の欠け。
- status/policy enum: `block_reason` 3 値、`recount_reasons` 3 値、action 2 値、StocktakeRecovery の code 2 値（`recount_required`・`completion_blocked`）。
- wire type: `count_value: i64`、`business_date: String`（YYYY-MM-DD）、`stock_range_low/high: Option<i64>`。
- internal type: `settlement_no: i64`（23 の文字列から BIZ が変換）。
- producer/consumer: 42 → 73、41 → 55、40 → 51・58・66。
- round-trip token: 無し（計数の token を持たない）。
- precision/range: 長さの商品の計数は cm の整数（m の入力は UI が直す、SPEC-UNIT-D3）。
- cross-language parse: 範囲の 2 値は JS の安全な整数の範囲（在庫の上限の検査で保証）。

## Compatibility Checks

- old schema/input: 棚卸しか Z004 の取込みを持つ DB は migration が止まる（作り直しは別の承認）。従来の形の Z004 は取り込まない。
- new schema/input: 入出庫と初期在庫だけの DB は移行の後も写しが同じ。
- output order: 要再確認の一覧と欠けの知らせの区間は昇順（31・32）。在庫変動の履歴は鍵の順（66）。
- optional field behavior: `stocktake_item_id` の無い計数（棚卸しの外の入れ直し）。

## Data Safety Checks

- source-derived data: test の fixture は合成の値だけ（商品名・JAN・金額を実データから写さない）。tracked に置く POS の sample は合成の fixture だけ（owner の決定 TD-296）。
- generated outputs: bindings の再生成は runtime。
- secrets: 無し。
- local-only files: 見直しの成果物・回答台帳・持ち帰りデータは repo の外。
- synthetic sample boundaries: Z004 の fixture は既存の合成の builder（`legacy_stop_tests.rs` の F1〜F7 を新しい経路の期待に置き換える）。

## Main Wiring / Integration Checks

- helper connected to main path: 求め直しの関数が入出庫 4 業務・Z004 の確定と取消・商品の登録と一括 import・計数の保存・整合性の補正から呼ばれる（D2 の `backdated_record_before_count_does_not_change_copy_per_writer` と D12 の行。`copy_equals_sum_when_no_count` は写しと SUM の一致だけを見る）。
- output reaches manifest/report: 取込みの結果の `recheck_targets` と `notices` が UI に届く（55 の L3）。
- effective config reaches runtime: CMD が渡す PC の今日が BIZ の fresh な計数の日付と未来の日付の検査に届く（D5 の行）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- 決まらない精算の判定を「個数 ≠ 0」だけにすると → `undetermined_settlement_amount_only_row_is_recheck` が fail。
- fresh な計数の `seen_movement_id` を見ないと → `fresh_count_absorbs_movements_saved_before_it` が fail。
- fresh な計数の決まらない精算を n+1 だけにすると → `fresh_count_all_later_same_day_settlements_are_undetermined` が fail。
- 精算の一覧が変わる TX で file に行がある商品だけを求め直すと → `settlement_list_change_recomputes_all_counted_products` が fail。
- `settlement_pending` を「D 以上の精算が無い」だけにすると → `settlement_pending_detects_gap_between_imported` が fail。
- 重なる既定の計数で新しい id を効かせると → `overlapping_default_counts_conflict` が fail。
- 精算を到着の順・精算回数だけで判定すると → `fresh_count_includes_late_older_settlement` と `default_count_includes_late_older_settlement` が fail。
- 完了の検査の 1 つを外すと → `complete_blocked_by_pending_settlement_recheck_uncounted` の該当の case が fail。
- 取消で補償の movement を作ると → `rollback_voids_and_recomputes_without_compensation` が fail。
- 入出庫の 1 業務が求め直しの規則を通らない（旧 writer が残る）と → `backdated_record_before_count_does_not_change_copy_per_writer` が fail（計数より前の日付の記録でその writer だけ写しが増減する）。計数の無い商品の SUM の一致（`copy_equals_sum_when_no_count`）では、旧 writer の「保存した数 + 差分」も SUM と一致するので検出しない。
- 精算日と精算回数の順の検査の不等号を逆にすると → `settlement_order_contradiction_is_rejected` が fail（両向きの case を持つ）。

## Residual Test Gaps

- 店の Windows の PC での求め直しの速さ（合成データの WSL の値だけ。runtime の lane が測る）。
- 受け入れた穴（締めの後の販売で 2 回目の精算をしない、打ち消し合い、部門キー、日付の選び忘れ）は test で塞がない（固定の case で「要再確認が出ない」ことを pin する: `fresh_count_next_day_settlement_is_not_undetermined`・`default_count_next_day_settlement_is_not_undetermined`）。
- レジの reset・入替は実物が無く、合成の file で拒否だけを確かめる。
- Windows L3（73 の (a)〜(e)、55 の拒否と知らせ、51 の拒否の表示）は runtime の lane。
