# Test Design Matrix: 売上の SD からの一括取込みと EJ の控えの閲覧の設計

本 lane は docs だけで、自動 test を足さない。下の行は後続の lane（backlog の「SD の一括取込みと EJ の控えの runtime（A）」と「Z004 を SD の一括取込みに入れる runtime（B）」）が実装する test の設計で、設計正本の節（37 §37.10・§37.11、24 §14.25、45 §45.6c、55 UI-07-D17、SCREEN_DESIGN の UI-09c、pos-tables の `ej_records`）と D-121 から導いた。本 lane が自分で回す検査は packet の AC1〜AC11。test の名前は後続が実装のときに決め直してよいが、Would fail if の観測は変えない。fixture は合成の EJ・日報・Z004 だけ（実 encoding の CP932・CRLF）。

## Risk

Risk: R3

## Contracts Under Test

- BIZ-08-D7: 一括取込みは日報（対象日・精算回数の昇順）→ Z004（精算回数の昇順、(B)）→ EJ の順に、今の関数で 1 項目 1 TX。業務の拒否・取込み済み・同日追加の確認が要るは飛ばして続け、確定の段の失敗で止め、残りは NotAttempted。確定済みは残り、同じ操作のやり直しで二重に数えない
- BIZ-08-D8: 同じ日の active な取込みが全て精算回数を持ち、束も持つときは `NoDuplicate`。どれかが NULL か束が None なら `AdditionalImportConfirmationRequired`
- BIZ-08-D9: EJ は形の検査を通った file の記録を、番号を鍵に文のまま保存。同じ呼出しの中・保存済みとの文の違いは保存しない（conflict）。SD の file で新しい記録を持つものだけを TX の前に写す。`total_amount` は `Restored` の取引だけ。欠けは番号の連続で区間に
- BIZ-08-D10: CV17 の取込みの前後・順の入れ替わりで二重に数えない
- UI-07-D17 / UI-09c-D1〜D5: 押せる条件、結果の label、控えの一覧と文、番号で探す、欠けの Alert と手で選ぶ取込み
- CMD-12-D2: scan_token の検証と期限、`SourceCopyFailed` の文の置換え、登録

## Failure Modes

- FM1: 業務の拒否で止まり、拒まれ続ける 1 項目が以後の項目と EJ を毎回止める
- FM2: 確定の段の失敗の後も続け、同じ原因の失敗を重ねる、または止まった後の項目を取り込む
- FM3: やり直しで、確定済みの日報・Z004・EJ を二重に保存する
- FM4: 新しい精算から先に入れ、Z004 の欠けの知らせが途中の状態で出る・順の検査で拒まれる
- FM5: 同じ日に精算回数の NULL の取込みがあるのに確認なしで入れる（D-071 の守りを外しすぎる）
- FM6: 精算回数のそろう同じ日の 2 つの束で確認を求め、一括取込みが止まる（置換えが効かない）
- FM7: EJ の同じ記録が `XZ` と `XZ_BKUP` から 2 回保存される、または file の hash で見分けて伸びた file の新しい記録を落とす
- FM8: 同じ番号で文の違う記録が保存済みを上書きする
- FM9: 形の外れた（最終改行の無い）EJ の最後の記録を保存し、後の完全な記録が conflict になる
- FM10: 写しを TX の後に書く、写しの失敗で DB を変える、手で選んだ file を写す
- FM11: `total_amount` を復元できない記録・取引中止に入れる、取り消した値引きを足す、安全な整数の範囲を超えた値を返す
- FM12: 欠けを file の有無や日付で決める、使い始める前を欠けに数える、区間でなく番号を 1 つずつ返す
- FM13: EJ が在庫・売上の集計に入る
- FM14: 控えの画面で 0 円と復元できない記録が同じ表示になる、種類を色だけで示す、番号の先頭 0 が落ちる

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- 既存の test の書換え（BIZ-08-D8）: `src-tauri/src/biz/daily_report_import_service/tests.rs:275`・`:481`・`:536`（2026-10-17 の `rg -n 'AdditionalImportConfirmationRequired' src-tauri/src/biz/daily_report_import_service`）。(A) の起票で数え直す。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| BIZ-08-D7 | FM1 | integration（合成の DB と snapshot） | `test_bulk_import_skips_rejected_and_continues_to_ej` | 2 つの日報の束のうち古い方が BIZ-08-D4 で拒まれる snapshot で、新しい方が ImportedDailyReport にならない、EJ の記録が保存されない、または古い方が Skipped 以外になる |
| BIZ-08-D7 | FM2 | integration（写しの失敗の注入: app_data_dir を書けない path） | `test_bulk_import_stops_at_copy_failure_and_marks_rest_not_attempted` | 1 つ目の束で写しが失敗したとき、`stopped` が true でない、2 つ目と EJ が NotAttempted でない、DB に日報の行か `ej_records` の行が入る |
| BIZ-08-D7 | FM3 | integration | `test_bulk_import_rerun_on_same_snapshot_is_idempotent` | 同じ snapshot で 2 回呼んだ後、`daily_report_imports` の completed の行数か `ej_records` の行数が 1 回目と違う、または 2 回目の日報が Skipped（取込み済み）でない |
| BIZ-08-D7 | FM4 | unit（並べる関数） | `test_bulk_import_orders_by_report_date_then_settlement_no` | snapshot の束が新しい順で入っているとき、処理の順が (対象日, 精算回数) の昇順にならない |
| BIZ-08-D7 | FM2 | integration | `test_bulk_import_needs_confirmation_is_not_a_stop` | 同じ日に精算回数の NULL の取込みがある束が NeedsIndividualConfirmation 以外になる、または以後の項目が NotAttempted になる |
| BIZ-08-D8 | FM6 | unit（§37.3） | `test_same_date_bundles_with_settlement_no_need_no_confirmation` | 同じ日に精算回数 41 の completed があり、精算回数 42 の束を preview したとき `NoDuplicate` でない |
| BIZ-08-D8 | FM5 | unit | `test_same_date_with_null_settlement_import_still_needs_confirmation` | 同じ日に精算回数 NULL の completed（D-111 より前の形）があり、精算回数 42 の束で `AdditionalImportConfirmationRequired` でない |
| BIZ-08-D8 | FM5 | unit | `test_bundle_without_settlement_no_still_needs_confirmation` | 手で選んだ精算回数の無い束（layout B）で、同じ日に completed があるのに `NoDuplicate` になる |
| BIZ-08-D8 | FM6 | integration | `test_bulk_import_two_settlements_same_day_both_imported` | 同じ日の精算回数 41・42 の束を一括で取り込み、2 つ目が §37.4 手順 5 の再検査か確認で止まる |
| BIZ-08-D9 | FM7 | integration | `test_ej_same_record_in_xz_and_backup_saved_once` | `XZ` の file と `XZ_BKUP` の file に同じ番号・同じ文の記録があるとき、`ej_records` に 2 行入る、または `inserted_count` が 2 になる |
| BIZ-08-D9 | FM7 | integration | `test_ej_grown_file_adds_only_new_records` | 前日に読んだ `XZ` の file に記録が 2 つ足された版を読んだとき、足された 2 つ以外が新しく入る、または足された記録が落ちる |
| BIZ-08-D9 | FM8 | integration | `test_ej_conflicting_text_does_not_overwrite` | 保存済みの番号と同じ番号で文の違う記録を読んだとき、保存済みの `body_text` が変わる、または `conflict_count` が 1 でない |
| BIZ-08-D9 | FM8 | unit | `test_ej_conflict_within_one_call_saves_neither` | 同じ呼出しの 2 つの file に同じ番号で文の違う記録があるとき、どちらかが保存される |
| BIZ-08-D9 | FM9 | unit | `test_ej_file_without_final_crlf_is_unreadable` | 最終改行の無い EJ の file の記録が 1 つでも保存される、または file 名が `unreadable_files` に無い |
| BIZ-08-D9 | FM10 | integration | `test_ej_copy_only_sd_files_with_new_records_before_tx` | 新しい記録を持たない SD の file か、手で選んだ file の写しが書かれる、または写しの失敗のとき `ej_records` に行が入る |
| BIZ-08-D9 | FM11 | unit | `test_ej_total_amount_only_for_restored_sale` | `Restored` の取引（明細 2 つと、正の訂正で取り消した ％値引き）の `total_amount` が 明細の和 と違う、取引中止・復元できない取引・精算票で NULL でない |
| BIZ-08-D9 | FM11 | unit | `test_ej_total_amount_outside_safe_integer_is_null` | 合計の絶対値が 2^53 − 1 を超える合成の `Restored` で NULL にならない |
| BIZ-08-D9 | FM12 | repo（SQL） | `test_list_ej_number_gaps_returns_ranges` | 番号 000100・000101・000105・000107 を保存したとき、区間が [000102〜000104]・[000106] の 2 つにならない（000099 以前を欠けにする、番号を 1 つずつ返す、先頭 0 を落とすのどれでも red） |
| BIZ-08-D9 | FM13 | integration | `test_ej_import_does_not_touch_stock_or_sales` | EJ の取込みの前後で `inventory_movements`・`sale_records`・`products.stock_quantity`・日報の表のどれかの行が変わる |
| BIZ-08-D9 | — | unit | `test_list_ej_records_validates_date_and_no` | 日付 `2026-02-30` か番号 `0000001`・`12a` が ValidationFailed にならない、番号 `5` が `000005` で引けない |
| BIZ-08-D9 | — | repo | `test_list_ej_records_on_date_truncates_over_1000` | 同じ日に 1001 件の記録があるとき、`truncated` が true でない、または 1000 件を返さない |
| BIZ-08-D10 | FM3 | integration | `test_bulk_import_after_cv17_moved_counts_nothing_twice` | 前日に `XZ` から取り込んだ束と EJ と同じ bytes が `XZ_BKUP`（`_nnnn` の名前）にある snapshot で、日報が Imported になる、または EJ が新しく入る |
| BIZ-08-D10 | FM3 | integration | `test_bulk_import_cv17_changed_bytes_rejected_by_settlement_no` | 同じ精算回数で bytes の違う束が `XZ_BKUP` にあるとき（SD-23 が外れた場合の合成）、Skipped にならず Imported になる |
| CMD-12-D2 | — | cmd | `test_commit_register_sd_bulk_import_rejects_expired_token` | 31 分前の snapshot の token で import_error と §45.6b の文にならない |
| CMD-12-D2 | — | cmd | `test_bulk_item_source_copy_failed_message_is_fixed` | 写しの失敗の item の message が §45.7 の固定の文でない（io error の kind が message に出る） |
| UI-07-D17 | — | RTL | `bulk import button enabled only with importable items` | 日報の `NotImported` 0 件・EJ の新しい控え 0 件で「まとめて取り込む」が押せる、または片方が 1 件で押せない |
| UI-07-D17 | — | RTL | `bulk import result shows label per outcome and stop notice` | 結果の 5 つの outcome の label が文字で出ない、止まったときに「途中で止まりました」の文が無い |
| UI-09c-D2 | FM14 | RTL | `receipt list shows zero yen and dash distinctly` | `total_amount` 0 の行と NULL の行がどちらも同じ表示になる、番号 `000123` が `123` と出る、種類の label が無い |
| UI-09c-D3 | — | RTL | `receipt search by number moves to the day and selects` | 番号を入れて Enter で、その日に移って行が選ばれない、IME の変換中の Enter で探す、無い番号で「その番号の控えはありません」が出ない |
| UI-09c-D5 | — | RTL | `gap alert shown only with gaps` | 欠けが無いのに Alert が出る、欠けがあるのに区間の文が無い |
| UI-09c-D1 | — | route / navigation | `navigation reaches receipts screen`（REQ の番号つき） | navigation の `ui-09c` から `/reports/receipts` に着かない、search の `date`・`no` の不正な値で画面が error になる |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 一括取込み（UI-07-D17） | `sd_list`（scan の結果、ボタンは条件で押せる） | 取込み中（ボタン disabled、離脱を block） | 結果（項目ごとの label） | 日報・Z004 の取込みと同じ D-052 の対象と、控えの一覧の query | 日次売上・控えの画面を開いたときに読み直す | 結果から一覧へ戻ると scan の一覧のまま（状態の数は古い。読み直しで新しくなる） | アプリを閉じると scan cache が消え、読み直しが要る | 止まった項目と NotAttempted を出す。確定済みは残る | 同じ token で再実行（30 分以内）か読み直し。確定済みは飛ばされる | Matrix の D7 の行、RTL |
| scan の snapshot（CMD の cache） | 無し | scan 中 | snapshot と token | 新しい scan で置き換わる（最新の 1 つ） | — | 同じ token で一括取込みを何度でも | 再起動で消える | 期限切れ（30 分）で import_error | 読み直し | `test_commit_register_sd_bulk_import_rejects_expired_token` |
| `ej_records` | 空 | 一括取込み・手で選ぶ取込みの TX | 新しい記録が入る（insert-only） | 控えの一覧の query | 画面を開く・日付を変える | 同じ番号は数えるだけ | DB に残る（backup に入る） | 写し・TX の失敗で何も入らない | 同じ file でやり直せる | Matrix の D9 の行 |
| 控えの画面（UI-09c） | 最も新しい日（記録が無ければ空の状態） | 読込み中 | 一覧と選んだ控え | 取込みの成功で無効にする | 日付・番号の変更 | URL の `date`・`no` で同じ控えに戻る | 再起動の後も URL から | 読めないとき画面の error | 再試行 | RTL |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 日報の同日追加の確認（D-071 → BIZ-08-D8） | `parse.rs:159`、`commit.rs:37`、`daily_report_import_cmd.rs:446`、`DailyReportImportPage.tsx:139`、backend の test 3 か所、frontend の test（Scope の列挙） | BIZ の分岐と backend の test の期待 | frontend は status を見て描くだけで変えない。Z004 の側は D-118 が置き換え済み | D8 の行 |
| 写しを TX の前に書く（BIZ-08-D5） | 37 §37.4 手順 2b、IO-10 | 一括取込みの Z004（(B)）、EJ の SD の file | 手で選んだ EJ・Z004 タブの file は写さない（BIZ-08-D9、32 の「SD の一括取込み」） | `test_ej_copy_only_sd_files_with_new_records_before_tx` |
| 形の検査（IO-09-D4） | §37.9 手順 5・10 | EJ の file（SD と手で選んだ file の両方） | — | `test_ej_file_without_final_crlf_is_unreadable` |
| 区間で知らせる欠け（D-118 の Z004） | 32 の新契約の知らせ (a) | EJ の欠け（区間・昇順・番号の数に依らない） | — | `test_list_ej_number_gaps_returns_ranges` |
| 日付ナビ（UI-09a） | `DailySalesPage` の前日・翌日・`<input type="date">`、zod の `.catch(undefined)` | UI-09c-D1・D2（隣の日は記録のある日へ） | 既定日は当日でなく記録のある最も新しい日 | RTL |
| 状態を文字と icon で示す（UI-07-D15 (3)） | 55 | UI-07-D17 の結果、UI-09c の種類 | — | RTL |

## Negative Paths

- missing input: snapshot に日報も EJ も無い（ボタンを押せない。BIZ に来ても items が空で Ok）。控えの DB が空（空の状態）。
- invalid input: 日付・番号の形、EJ の形の外れ・parse の致命的エラー、20MB 超の EJ。
- duplicate/ambiguous input: 同じ EJ の記録が 2 つの file に、同じ番号で文の違う記録、同じ精算の別 bytes の日報、同じ日の 2 つの精算。
- unknown reference: 無い id（NotFound）、無い番号（空の結果）。
- dependency missing: SD を抜いた後（snapshot の bytes で進む）、scan の期限切れ。
- permission/write failure: 写しの失敗（SourceCopyFailed で止まる）、DB の失敗（Failed で止まる）。
- dry-run side effect: `plan_ej_records` と scan は DB に書かない（`ej_records` の行数が変わらない）。

## Boundary Checks

- threshold: 1 日 1000 件（`truncated`）、scan の 30 分、EJ の file 20MB。
- null/default: `total_amount` NULL は「—」、0 は「0円」。`ej` が None（EJ の file が無い）。
- empty/non-empty: 欠け 0 区間は Alert 無し。新しい控え 0 件は「新しい控えはありません」。
- min/max: 番号 000000〜999999、合計の絶対値 2^53 − 1。
- status/policy enum: `RegisterSdBulkOutcome` の 6 値、`ej_records.kind`・`mode` の CHECK。
- wire type: 番号・4 桁の欄は文字列、件数・ID は number、合計は number か null。
- internal type: `NewEjRecord`、`EjImportPlan`。
- producer/consumer: BIZ の文が UI に届く（Skipped・Failed の message）。
- round-trip token: scan_token、URL の `date`・`no`（数字だけの番号を文字列のまま往復する）。
- precision/range: 合計の和の溢れは IO-08 が復元不能にする（`i64` に収まらない）。
- cross-language parse: `no` の `000123` が number にならない。

## Compatibility Checks

- old schema/input: `ej_records` の無い DB に (A) の migration が当たる。D-111 より前の精算回数の NULL の日報の取込みが同じ日にある。
- new schema/input: `XZ_BKUP` だけ・`XZ` だけ・両方の EJ。
- output order: 一括取込みの結果は処理の順、控えは番号の順、欠けは 4 桁の欄・番号の昇順。
- optional field behavior: `DailyReportSdScan.ej` の None、`RegisterSdBulkResult.ej` の None。

## Data Safety Checks

- source-derived data: test と L3 は合成の EJ・日報・Z004 だけ。
- generated outputs: 写しの file と `ej_records` の行を commit しない。
- secrets: 無し。
- local-only files: 持ち帰りの EJ・SD の写し。
- synthetic sample boundaries: 合成の EJ は IO-08 の文法表の形で作り、実物の品名・金額・番号を使わない。

## Main Wiring / Integration Checks

- helper connected to main path: 「まとめて取り込む」→ CMD-12 → BIZ-08 §37.10 → 各取込みの関数 → DB。
- output reaches manifest/report: 一括取込みの結果が日次売上と控えの画面に反映される（invalidate）。
- effective config reaches runtime: 無し（設定を足さない）。
- CLI arg reaches implementation: 無し。

## Mutation-style Adequacy Questions

- 業務の拒否を Failed（止める）に変えたら: `test_bulk_import_skips_rejected_and_continues_to_ej` が red。
- 写しの失敗を Skipped（続ける）に変えたら: `test_bulk_import_stops_at_copy_failure_and_marks_rest_not_attempted` が red。
- 並びを降順にしたら: `test_bulk_import_orders_by_report_date_then_settlement_no` が red。
- BIZ-08-D8 の「全て精算回数を持つ」を「どれかが持つ」にしたら: `test_same_date_with_null_settlement_import_still_needs_confirmation` が red。
- EJ の比べを file の hash にしたら: `test_ej_grown_file_adds_only_new_records` が red。
- conflict で上書きしたら: `test_ej_conflicting_text_does_not_overwrite` が red。
- `total_amount` から adjustments を外したら: `test_ej_total_amount_only_for_restored_sale`（％値引きのある取引）が red。
- 欠けの区間を番号ごとにしたら・min より前を数えたら: `test_list_ej_number_gaps_returns_ranges` が red。
- 写しの条件から「新しい記録を持つ」を外したら: `test_ej_copy_only_sd_files_with_new_records_before_tx` が red。
- 番号を number で wire に出したら: `receipt list shows zero yen and dash distinctly` の `000123` の期待が red。

## Residual Test Gaps

- 控えの文の等幅の並び（半角カナと全角の混じる行）は自動 test で確かめられない。(A) の Windows L3（UI-09c-D4）。
- 実際の SD での一括取込み（`XZ` と `XZ_BKUP` の両方、CV17 の取込みの前後）は (A) の L3 と SD 直読みの runtime の Contract Probe（SD-23）。
- (B) の Z004 の行の test は、棚卸しの runtime の (b) の確定の経路が入った後に (B) の Matrix で足す。
