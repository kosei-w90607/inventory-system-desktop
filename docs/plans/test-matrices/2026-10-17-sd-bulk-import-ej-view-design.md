# Test Design Matrix: 売上の SD からの一括取込みと EJ の控えの閲覧の設計

本 lane は docs だけで、自動 test を足さない。下の行は後続の lane（backlog の「SD の一括取込みと EJ の控えの runtime（A）」と「Z004 を SD の一括取込みに入れる runtime（B）」）が実装する test の設計で、設計正本の節（37 §37.10・§37.11、24 §14.25、45 §45.6c、55 UI-07-D17、SCREEN_DESIGN の UI-09c、pos-tables の `ej_records`）と D-121 から導いた。本 lane が自分で回す検査は packet の AC1〜AC14。test の名前は後続が実装のときに決め直してよいが、Would fail if の観測は変えない。fixture は合成の EJ・日報・Z004 だけ（実 encoding の CP932・CRLF）。

## Risk

Risk: R3

## Contracts Under Test

- BIZ-08-D7: 一括取込みは日報（対象日・精算回数の昇順、同じ値なら `XZ` の束を先にして `candidate_key` の順）→ Z004（精算回数の昇順、同じ値なら `XZ` の file を先にして `sd_relative_path` の順。scan で読めなかった file は先頭で名指しして飛ばす。(B)）→ EJ の順に、今の関数で 1 項目 1 TX。業務の拒否・取込み済み・同日追加の確認が要るは飛ばして続け、確定の段の失敗で止め、残りは NotAttempted。確定済みは残り、同じ操作のやり直しで二重に数えない
- BIZ-08-D8: 同じ日の active な取込みが全て精算回数を持ち、束も持つときは `NoDuplicate`。どれかが NULL か束が None なら `AdditionalImportConfirmationRequired`
- BIZ-08-D9: EJ は形と日時（暦）の検査を通った file の記録を、番号を鍵に文のまま保存。伸びうる file（名前に連番 `_nnnn` の無い EJ。出所に依らない）と最終改行の無い file の最後の記録は保留。同じ呼出しの中・保存済みとの文の違いは保存しない（conflict。保存済みの有無を返す）。SD の file で新しい記録を持つものだけを TX の前に写す。`total_amount` は `Restored` の取引だけ。欠けは番号の連続で区間に。移してよい EJ は新しい記録・conflict・保留・読めない file が全部 0 のときだけ
- BIZ-08-D10: CV17 の取込みの前後・順の入れ替わりで二重に数えない
- UI-07-D17 / UI-09c-D1〜D5: 押せる条件、結果の label、控えの一覧と文、番号で探す、欠けの Alert と手で選ぶ取込み
- CMD-12-D2: scan_token の検証と期限、`SourceCopyFailed` の文の置換え、登録、有限の値の生成 enum（`Failed` の kind は `CmdErrorKind`、EJ の kind・mode は `EjRecordKindCode`・`EjRecordModeCode`）

## Failure Modes

- FM1: 業務の拒否で止まり、拒まれ続ける 1 項目が以後の項目と EJ を毎回止める
- FM2: 確定の段の失敗の後も続け、同じ原因の失敗を重ねる、または止まった後の項目を取り込む
- FM3: やり直しで、確定済みの日報・Z004・EJ を二重に保存する
- FM4: 新しい精算から先に入れ、Z004 の欠けの知らせが途中の状態で出る・順の検査で拒まれる
- FM5: 同じ日に精算回数の NULL の取込みがあるのに確認なしで入れる（D-071 の守りを外しすぎる）
- FM6: 精算回数のそろう同じ日の 2 つの束で確認を求め、一括取込みが止まる（置換えが効かない）
- FM7: EJ の同じ記録が `XZ` と `XZ_BKUP` から 2 回保存される、または file の hash で見分けて伸びた file の新しい記録を落とす
- FM8: 同じ番号で文の違う記録が保存済みを上書きする
- FM9: 書きかけの EJ の記録（伸びうる file の最後の記録。SD から読んだ `XZ` 直下の file も、手で選んだ `XZ\EJyymmdd.TXT` や名前を変えた写しも。最終改行の無い file の最後の記録）を保存し、後の完全な記録が永久に conflict になる。逆に、二度と伸びない連番つきの file（`XZ_BKUP`・`EcrDatas`・それを手で選んだ file）の最後の記録を保留して永久に欠かす。保留した記録が残る file を、移してよい（全記録が保存済みと一致）と判定する
- FM10: 写しを TX の後に書く、写しの失敗で DB を変える、手で選んだ file を写す
- FM11: `total_amount` を復元できない記録・取引中止に入れる、取り消した値引きを足す、安全な整数の範囲を超えた値を返す
- FM12: 欠けを file の有無や日付で決める、使い始める前を欠けに数える、区間でなく番号を 1 つずつ返す
- FM13: EJ が在庫・売上の集計に入る
- FM14: 控えの画面で 0 円と復元できない記録が同じ表示になる、種類を色だけで示す、番号の先頭 0 が落ちる
- FM15: 暦の外れた日時（`2026-02-30 12:00` 等）の記録を保存し、閲覧の日付の引きで拒まれる・見えない
- FM16: conflict の知らせが事実と合わない（保存済みが無いのに「前の控えを残しました」とリンクを出す）、scan で読めなかった EJ の file を一括の結果で名指ししない
- FM17: 有限の wire の値（失敗の kind、EJ の kind・mode）が `string` で、片側の値の変更が型の誤りにならない
- FM18: Z004 の部分成功（取り込まなかった行がある `completed_partial`）が一括取込みの結果で件数だけの「取り込みました」になり、入らなかった行が黙って消える（読み直しでは取込み済みになり二度と出ない）
- FM19: EJ の新しい控えが 0 件で、保留・conflict・読めない file だけがあるとき、ボタンが押せず、番号・file 名・直し方に届かない
- FM20: 一括取込み・手で選ぶ EJ の取込みの後も控えの query が古いまま残り、控えの画面に新しい控えが出ない
- FM21: 同じ日・同じ精算回数の 2 束、または同じ精算回数の 2 つの Z004（SD-23 が外れた場合）の順が決まらず、どちらの bytes が入るかが実行ごとに変わる
- FM22: scan で読めなかった Z004 が一括取込みの結果に出ず、最新の精算の Z004 が入っていないことが黙って過ぎる（末尾の精算なので精算回数の欠けの知らせにも出ない）

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- 既存の test の書換え（BIZ-08-D8）: `src-tauri/src/biz/daily_report_import_service/tests.rs:275`・`:481`・`:536`（2026-10-17 の `rg -n 'AdditionalImportConfirmationRequired' src-tauri/src/biz/daily_report_import_service`）。(A) の起票で数え直す。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| BIZ-08-D7 | FM1 | integration（合成の DB と snapshot） | `test_bulk_import_skips_rejected_and_continues_to_ej` | 2 つの日報の束のうち古い方が BIZ-08-D4 で拒まれる snapshot で、新しい方が ImportedDailyReport にならない、EJ の記録が保存されない、または古い方が Skipped 以外になる |
| BIZ-08-D7 | FM2 | integration（写しの失敗の注入: app_data_dir を書けない path） | `test_bulk_import_stops_at_copy_failure_and_marks_rest_not_attempted` | 1 つ目の束で写しが失敗したとき、その item が `Failed(BizError::SourceCopyFailed(_))` でない、2 つ目と EJ の item（`RegisterSdBulkSource::Ej`）が NotAttempted でない、DB に日報の行か `ej_records` の行が入る |
| BIZ-08-D7 | FM2 | integration（EJ の写しの失敗） | `test_bulk_import_ej_failure_is_an_item` | 日報は取込み済みで EJ だけ新しい snapshot で EJ の写しが失敗したとき、items に `source = Ej`・`Failed(SourceCopyFailed)` の 1 件が無い（失敗の理由を返せない） |
| BIZ-08-D7 | — | unit | `test_bulk_import_no_ej_item_when_no_ej_files` | `ej_files` と `ej_unreadable_files` がどちらも空の snapshot で、items に `source = Ej` の item がある |
| BIZ-08-D7 | FM16 | integration | `test_bulk_import_names_scan_unreadable_ej_files` | `ej_files` が空で `ej_unreadable_files` に 1 本ある snapshot で EJ の item が無い、または `ImportedEj` の `unreadable_files` にその file 名が無い。`ej_files` に形の外れた 1 本もある snapshot で、2 本の名前の両方が無い |
| BIZ-08-D7 | FM3 | integration | `test_bulk_import_rerun_on_same_snapshot_is_idempotent` | 同じ snapshot で 2 回呼んだ後、`daily_report_imports` の completed の行数か `ej_records` の行数が 1 回目と違う、または 2 回目の日報が Skipped（取込み済み）でない |
| BIZ-08-D7 | FM4・FM21 | unit（並べる関数） | `test_bulk_import_orders_by_report_date_then_settlement_no` | snapshot の束が新しい順で入っているとき、処理の順が (対象日, 精算回数) の昇順にならない。同じ対象日・同じ精算回数の `XZ` の束と `XZ_BKUP` の束で `XZ` が先にならない、同じ area の 2 束が `candidate_key` の辞書順にならない、または `files_by_candidate` への入れ順を変えると処理の順が変わる |
| BIZ-08-D7 | FM21 | unit（並べる関数、(B)） | `test_bulk_import_orders_z004_by_settlement_no_independent_of_enumeration` | 同じ精算回数で bytes の違う 2 つの Z004（`XZ` と `XZ_BKUP`）と別の精算回数の 1 つを持つ snapshot で、`z004_files` の入れ順を反転すると処理の順（ImportedZ004 になる file）が変わる、`XZ` の file が先にならない、または精算回数でなく file 名の順で並ぶ |
| BIZ-08-D7 | FM22 | integration（(B)） | `test_bulk_import_names_scan_unreadable_z004_files` | 日報と EJ は取り込め、最新の精算の Z004 だけが `z004_unreadable_files` にある snapshot で、その相対 path の `RegisterSdBulkSource::Z004`（`settlement_date` が None）の item が無い、outcome が §37.10 手順 3 の固定の文の Skipped でない、または以後の項目が NotAttempted になる |
| BIZ-08-D7 | FM2 | integration | `test_bulk_import_needs_confirmation_is_not_a_stop` | 同じ日に精算回数の NULL の取込みがある束が NeedsIndividualConfirmation 以外になる、または以後の項目が NotAttempted になる |
| BIZ-08-D8 | FM6 | unit（§37.3） | `test_same_date_bundles_with_settlement_no_need_no_confirmation` | 同じ日に精算回数 41 の completed があり、精算回数 42 の束を preview したとき `NoDuplicate` でない |
| BIZ-08-D8 | FM5 | unit | `test_same_date_with_null_settlement_import_still_needs_confirmation` | 同じ日に精算回数 NULL の completed（D-111 より前の形）があり、精算回数 42 の束で `AdditionalImportConfirmationRequired` でない |
| BIZ-08-D8 | FM5 | unit | `test_bundle_without_settlement_no_still_needs_confirmation` | 手で選んだ精算回数の無い束（layout B）で、同じ日に completed があるのに `NoDuplicate` になる |
| BIZ-08-D8 | FM5 | repo（SQL） | `test_exists_same_date_without_settlement_no_ignores_rolled_back` | 同じ日の精算回数 NULL の取込みが `rolled_back` だけのとき true を返す、`completed` のとき false を返す |
| BIZ-08-D8 | FM6 | integration | `test_bulk_import_two_settlements_same_day_both_imported` | 同じ日の精算回数 41・42 の束を一括で取り込み、2 つ目が §37.4 手順 5 の再検査か確認で止まる |
| BIZ-08-D9 | FM7 | integration | `test_ej_same_record_in_xz_and_backup_saved_once` | `XZ` の file と `XZ_BKUP` の file に同じ番号・同じ文の記録（`XZ` の file の最後でない記録）があるとき、`ej_records` にその番号の行が 2 行入る、またはその番号で `inserted_count` が 2 に数えられる |
| BIZ-08-D9 | FM7・FM9 | integration | `test_ej_grown_file_adds_only_new_records` | 1 回目に `XZ\EJyymmdd.TXT` の `[r1, r2]` を取り込み（r1 を入れ r2 を保留）、2 回目に同じ名前の `[r1, r2, r3, r4]` を取り込んだとき、2 回目の `inserted_count` が 2（r2・r3）・`already_count` が 1（r1）・`held_count` が 1（r4）でない、または r4 が入る |
| BIZ-08-D9 | FM8・FM16 | integration | `test_ej_conflicting_text_does_not_overwrite` | 保存済みの番号と同じ番号で文の違う記録を読んだとき、保存済みの `body_text` が変わる、`conflict_count` が 1 でない、または `conflicts[0].saved` が true でない |
| BIZ-08-D9 | FM8・FM16 | unit | `test_ej_conflict_within_one_call_saves_neither` | 保存済みの無い番号について、同じ呼出しの 2 つの file に同じ番号で文の違う記録があるとき、どちらかが保存される、または `conflicts[0].saved` が false でない（初回の取込みで「前の控えを残しました」が出る） |
| BIZ-08-D9 | FM9 | unit | `test_ej_missing_final_crlf_drops_only_last_record` | 最終改行の無い `XZ_BKUP` の file で、最後の記録が保存される、または最後より前の記録が保存されない |
| BIZ-08-D9 | FM9 | unit | `test_ej_xz_last_record_is_held` | `XZ` 直下の file の最後の記録（`NoItems` の設定の記録で、診断が無いもの）が保存される、または `held_count` が 1 でない |
| BIZ-08-D9 | FM9 | unit | `test_ej_backup_last_unresolved_record_is_saved` | `XZ_BKUP` の file の最後の記録が `Unresolved`（`IncompleteRecord`）のとき保存されない |
| BIZ-08-D9 | FM9 | integration | `test_ej_hand_picked_growable_file_holds_last_record` | `import_ej_records` に `sd_relative_path: None` で渡した `EJ261018.TXT`・`ej261018.txt`・`EJ261018 - コピー.TXT` の最後の記録が保存される、または `held_count` がそれぞれ 1 でない。同じく `sd_relative_path: None` の `EJ261018_0001.TXT` の最後の記録が保存されない（名前の判定が出所に依らない） |
| BIZ-08-D9 | FM9 | unit | `test_ej_plan_full_match_requires_no_held` | 伸びうる file `[保存済み r1, 未保存 r2]` を `plan_ej_records` に当てて `held_count` が 1 でない（移してよいと誤る）。r2 を連番つきの file で保存した後に同じ file を当てて `held_count` が 0・`already_count` が 2 でない |
| BIZ-08-D9 | FM9 | integration | `test_ej_partial_then_complete_saves_complete` | 1 回目に `XZ` 直下の file（最後の取引が途中まで）を読み、2 回目に同じ取引が完全な `XZ_BKUP` の file を読んだとき、保存された文が完全版でない、または conflict が数えられる |
| BIZ-08-D9 | FM8 | unit | `test_ej_same_number_twice_in_one_file_is_conflict` | 1 つの file に同じ番号が 2 回（文が同じでも）出たとき、どちらかが保存される、または conflict に数えない |
| BIZ-08-D9 | — | integration | `test_ej_import_counts_at_tx_time` | plan の後、TX の前に同じ番号の別の文が保存されたとき、結果の `conflict_count`・`conflicts[0].saved` が plan の時点の値のままで、TX の中の比べの値でない |
| BIZ-08-D9 | FM15 | unit | `test_ej_invalid_calendar_datetime_file_is_unreadable` | 見出しの日時が `2026-02-30 12:00`（または `2026-10-18 24:00`）の記録を 1 つ含む file の、ほかの記録が 1 つでも保存される、またはその file 名が `unreadable_files` に無い。同じ呼出しの正しい file の記録が保存されない |
| BIZ-08-D9 | FM10 | integration | `test_ej_copy_only_sd_files_with_new_records_before_tx` | 新しい記録を持たない SD の file か、手で選んだ file の写しが書かれる、または写しの失敗のとき `ej_records` に行が入る |
| BIZ-08-D9 | FM11 | unit | `test_ej_total_amount_only_for_restored_sale` | 合成の 2 つの `Restored` の取引で: (1) 明細 2 つと、正の訂正で取り消した ％値引き → `total_amount` が明細の和と違う（取り消した値引きを足す）。(2) 明細 2 つと、取り消した ％値引きと、残る有効な値引き 1 件 → `total_amount` が「明細の和 + 残る値引き」（明細の和より小さい値）と違う（値引きの加算を消すと (2) が red）。取引中止・復元できない取引・精算票で NULL でない |
| BIZ-08-D9 | FM11 | unit | `test_ej_total_amount_outside_safe_integer_is_null` | 合計の絶対値が 2^53 − 1 を超える合成の `Restored` で NULL にならない |
| BIZ-08-D9 | FM12 | repo（SQL） | `test_list_ej_number_gaps_returns_ranges` | 番号 000100・000101・000105・000107 を保存したとき、区間が [000102〜000104]・[000106] の 2 つにならない（000099 以前を欠けにする、番号を 1 つずつ返す、先頭 0 を落とすのどれでも red） |
| BIZ-08-D9 | FM13 | integration | `test_ej_import_does_not_touch_stock_or_sales` | EJ の取込みの前後で `inventory_movements`・`sale_records`・`products.stock_quantity`・日報の表のどれかの行が変わる |
| BIZ-08-D9 | — | unit | `test_list_ej_records_validates_date_and_no` | 日付 `2026-02-30` か番号 `0000001`・`12a` が ValidationFailed にならない、番号 `5` が `000005` で引けない |
| BIZ-08-D9 | — | repo | `test_list_ej_records_on_date_truncates_over_1000` | 同じ日に 1001 件の記録があるとき、`truncated` が true でない、または 1000 件を返さない |
| BIZ-08-D10 | FM3・FM9 | integration | `test_bulk_import_after_cv17_moved_counts_nothing_twice` | 前日に `XZ` から取り込んだ束と EJ（`[r1, r2]`、r2 は保留）と同じ bytes が `XZ_BKUP`（`_nnnn` の名前）にある snapshot で、日報が Skipped（取込み済み）でない、または EJ の `inserted_count` が 1（前回保留した r2 だけ）・`already_count` が 1（r1）・`held_count` が 0 でない（保存済みは増えず、保留した記録は確定の条件を満たしたこの回に 1 度だけ入る） |
| BIZ-08-D10 | FM3 | integration | `test_bulk_import_cv17_changed_bytes_rejected_by_settlement_no` | 同じ精算回数で bytes の違う束が `XZ_BKUP` にあるとき（SD-23 が外れた場合の合成）、Skipped にならず Imported になる |
| CMD-12-D2 | — | cmd | `test_commit_register_sd_bulk_import_rejects_expired_token` | 31 分前の snapshot の token で import_error と §45.6b の文にならない |
| CMD-12-D2 | — | cmd | `test_bulk_item_source_copy_failed_message_is_fixed` | BIZ の `Failed(SourceCopyFailed)` の item が、wire で kind `internal` と §45.7 の固定の文にならない（io error の kind が message に出る） |
| CMD-12-D2 | FM17 | wire（response の serialize 出力の固定、D-064 (iv)） | `test_ej_wire_enums_serialize_as_fixed_values` | `EjRecordKindCode`・`EjRecordModeCode` の各値の serialize が pos-tables の `ej_records.kind`・`mode` の CHECK の値と 1 対 1 で一致しない、`RegisterSdBulkOutcomeDto::Failed` の `kind` が `CmdErrorKind` の値でない（bindings で `string` になる）、DB の未知の kind・mode の値が `DbError` にならず読める |
| UI-07-D17 | — | RTL | `bulk import button enabled by z004_new_count`（(B)） | 日報・EJ が 0 件で `z004_new_count` が 1 のとき「まとめて取り込む」が押せない |
| UI-07-D17 | FM18 | RTL | `bulk result shows z004 partial with skipped rows and detail link`（(B)） | 正常の行 1 行と未登録の商品の行 1 行の Z004 の結果（`ImportedZ004`、`status` が `completed_partial`・`skipped_count` が 1）で、label が「一部を取り込みました」でない、「取り込まなかった行が 1 件あります」が無い、または `/csv-import/records/{csv_import_id}` へのリンクが無い |
| UI-07-D17 | FM16 | RTL | `bulk result names gaps held unreadable conflicts with in-place action` | EJ の結果に欠けの区間と「EJ のファイルを選んで取り込む」、保留の件数と「次に SD を読んだときにもう一度確かめます」の文、読めない file 名、conflict の番号のどれかが出ない（TD-310）。`saved: false` の conflict に「前の控えを残しました」か控えの画面へのリンクが出る、`saved: true` にリンクが無い。件数 0 の項目に行が出る |
| UI-07-D17 | FM19 | RTL | `bulk import button enabled only with importable items` | 日報の `NotImported` 0 件で `ej` の `new_count`・`held_count`・`conflict_count`・`unreadable_file_count` が全て 0 のとき「まとめて取り込む」が押せる、日報の `NotImported` か `new_count` の片方が 1 件で押せない、または `new_count` 0 で `held_count`・`conflict_count`・`unreadable_file_count` のどれか 1 つだけが 1 のとき押せない |
| UI-07-D17 | — | RTL | `bulk import result shows label per outcome and stop notice` | 結果の 5 つの outcome の label が文字で出ない、止まったときに「途中で止まりました」の文が無い |
| CMD-12-D2 | FM20 | unit（D-052 の invalidation の oracle） | `bulk import and ej file import invalidate ej records` | 一括取込みの成功で `["ej-records"]` が無効にならない、または手で選ぶ EJ の取込みの成功で `["ej-records"]` 以外（日報・在庫・売上の key）を無効にする |
| UI-09c-D2 | FM14 | RTL | `receipt list shows zero yen and dash distinctly` | `total_amount` 0 の行と NULL の行がどちらも同じ表示になる、番号 `000123` が `123` と出る、種類の label が無い |
| UI-09c-D3 | — | RTL | `receipt search by number moves to the day and selects` | 番号を入れて Enter で、その日に移って行が選ばれない、IME の変換中の Enter で探す、無い番号で「その番号の控えはありません」が出ない |
| UI-09c-D5 | — | RTL | `gap alert shown only with gaps` | 欠けが無いのに Alert が出る、欠けがあるのに区間の文が無い |
| UI-09c-D1 | — | route / navigation | `navigation reaches receipts screen`（REQ の番号つき） | navigation の `ui-09c` から `/reports/receipts` に着かない、search の `date`・`no` の不正な値で画面が error になる |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 一括取込み（UI-07-D17） | `sd_list`（scan の結果、ボタンは条件で押せる） | 取込み中（ボタン disabled、離脱を block） | 結果（項目ごとの label） | 45 §45.6c 手順 4 の対象（日報・Z004 の取込みと同じ D-052 の対象と、控えの `queryKeys.ejRecords.root()`） | 日次売上・控えの画面を開いたときに読み直す | 結果から一覧へ戻ると scan の一覧のまま（状態の数は古い。読み直しで新しくなる） | アプリを閉じると scan cache が消え、読み直しが要る | 止まった項目と NotAttempted を出す。確定済みは残る | 同じ token で再実行（30 分以内）か読み直し。確定済みは飛ばされる | Matrix の D7 の行、RTL |
| scan の snapshot（CMD の cache） | 無し | scan 中 | snapshot と token | 新しい scan で置き換わる（最新の 1 つ） | — | 同じ token で一括取込みを何度でも | 再起動で消える | 期限切れ（30 分）で import_error | 読み直し | `test_commit_register_sd_bulk_import_rejects_expired_token` |
| `ej_records` | 空 | 一括取込み・手で選ぶ取込みの TX | 新しい記録が入る（insert-only） | `queryKeys.ejRecords.root()`（一括取込みと手で選ぶ取込みの成功。45 §45.6c 手順 4） | 画面を開く・日付を変える | 同じ番号は数えるだけ | DB に残る（backup に入る） | 写し・TX の失敗で何も入らない | 同じ file でやり直せる | Matrix の D9 の行 |
| 控えの画面（UI-09c） | 最も新しい日（記録が無ければ空の状態） | 読込み中 | 一覧と選んだ控え | 取込みの成功で無効にする | 日付・番号の変更 | URL の `date`・`no` で同じ控えに戻る | 再起動の後も URL から | 読めないとき画面の error | 再試行 | RTL |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 日報の同日追加の確認（D-071 → BIZ-08-D8） | `parse.rs:159`、`commit.rs:37`、`daily_report_import_cmd.rs:446`、`DailyReportImportPage.tsx:139`、backend の test 3 か所、frontend の test（Scope の列挙） | BIZ の分岐と backend の test の期待 | frontend は status を見て描くだけで変えない。Z004 の側は D-118 が置き換え済み | D8 の行 |
| 写しを TX の前に書く（BIZ-08-D5） | 37 §37.4 手順 2b、IO-10 | 一括取込みの Z004（(B)）、EJ の SD の file | 手で選んだ EJ・Z004 タブの file は写さない（BIZ-08-D9、32 の「SD の一括取込み」） | `test_ej_copy_only_sd_files_with_new_records_before_tx` |
| 形の検査（IO-09-D4） | §37.9 手順 5・10 | EJ の file（SD と手で選んだ file の両方） | 測り方は IO-09 の `measure_register_sd_shape` 1 つ | `test_ej_missing_final_crlf_drops_only_last_record` |
| 区間で知らせる欠け（D-118 の Z004） | 32 の新契約の知らせ (a) | EJ の欠け（区間・昇順・番号の数に依らない） | — | `test_list_ej_number_gaps_returns_ranges` |
| 日付ナビ（UI-09a） | `DailySalesPage` の前日・翌日・`<input type="date">`、zod の `.catch(undefined)` | UI-09c-D1・D2（隣の日は記録のある日へ） | 既定日は当日でなく記録のある最も新しい日 | RTL |
| 状態を文字と icon で示す（UI-07-D15 (3)） | 55 | UI-07-D17 の結果、UI-09c の種類 | — | RTL |

## Negative Paths

- missing input: snapshot に日報も EJ も無い（ボタンを押せない。BIZ に来ても items が空で Ok）。控えの DB が空（空の状態）。
- invalid input: 日付・番号の形、EJ の形の外れ・parse の致命的エラー・暦の外れた見出しの日時、20MB 超の EJ。
- duplicate/ambiguous input: 同じ EJ の記録が 2 つの file に、同じ番号で文の違う記録、同じ精算の別 bytes の日報、同じ日の 2 つの精算。
- unknown reference: 無い id（NotFound）、無い番号（空の結果）。
- dependency missing: SD を抜いた後（snapshot の bytes で進む）、scan の期限切れ。
- permission/write failure: 写しの失敗（SourceCopyFailed で止まる）、DB の失敗（Failed で止まる）。
- dry-run side effect: `plan_ej_records` と scan は DB に書かない（`ej_records` の行数が変わらない）。

## Boundary Checks

- threshold: 1 日 1000 件（`truncated`）、scan の 30 分、EJ の file 20MB。
- null/default: `total_amount` NULL は「—」、0 は「0円」。`DailyReportSdScan.ej` が None（`ej_files` と `ej_unreadable_files` が空）。どちらも空なら EJ の item を作らない。EJ の結果の件数 0（保留・conflict・読めない file・欠け）は行を出さない。
- empty/non-empty: 欠け 0 区間は Alert 無し。新しい控え 0 件は「新しい控えはありません」。
- min/max: 番号 000000〜999999、合計の絶対値 2^53 − 1。
- status/policy enum: `RegisterSdBulkOutcome` の 7 値、`ej_records.kind`・`mode` の CHECK と wire の `EjRecordKindCode`・`EjRecordModeCode`、`Failed` の `CmdErrorKind`。
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
- optional field behavior: `DailyReportSdScan.ej` の None。EJ の file（`ej_files` と `ej_unreadable_files`）が空なら一括の結果の items に `source = Ej` の item が無い（`test_bulk_import_no_ej_item_when_no_ej_files`）。

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
- `total_amount` から adjustments を外したら: `test_ej_total_amount_only_for_restored_sale` の (2)（取り消した値引きと残る有効な値引き 1 件の取引）が red。(1) だけでは red にならない（取り消した値引きは parser が外すので、和は明細の和と同じ）。
- 伸びうるかの判定を `sd_relative_path` の有無や置き場所にしたら: `test_ej_hand_picked_growable_file_holds_last_record` が red。
- 移してよい条件から保留を外したら（`held_count` を見ない）: `test_ej_plan_full_match_requires_no_held` が red。
- conflict の `saved` を常に true にしたら: `test_ej_conflict_within_one_call_saves_neither` が red。
- 暦の検査を外したら: `test_ej_invalid_calendar_datetime_file_is_unreadable` が red。
- scan で読めなかった file 名を結果に足さなかったら: `test_bulk_import_names_scan_unreadable_ej_files` が red。Z004 の側は `test_bulk_import_names_scan_unreadable_z004_files` が red。
- Z004 の同じ精算回数の順から `XZ` の優先か `sd_relative_path` の順を外したら: `test_bulk_import_orders_z004_by_settlement_no_independent_of_enumeration` が red。
- 欠けの区間を番号ごとにしたら・min より前を数えたら: `test_list_ej_number_gaps_returns_ranges` が red。
- 写しの条件から「新しい記録を持つ」を外したら: `test_ej_copy_only_sd_files_with_new_records_before_tx` が red。
- 番号を number で wire に出したら: `receipt list shows zero yen and dash distinctly` の `000123` の期待が red。

## Residual Test Gaps

- 控えの文の等幅の並び（半角カナと全角の混じる行）は自動 test で確かめられない。(A) の Windows L3（UI-09c-D4）。
- 実際の SD での一括取込み（`XZ` と `XZ_BKUP` の両方、CV17 の取込みの前後）は (A) の L3 と SD 直読みの runtime の Contract Probe（SD-23）。
- 締めのたびに出る EJ の保留の文が雑音にならないか（UI-07-D17 の出し方）は (A) の Windows L3。
- (B) の Z004 の行の test は、棚卸しの runtime の (b) の確定の経路が入った後に (B) の Matrix で足す。
