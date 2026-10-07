# Test Design Matrix: SD を直接読む設計

Packet: [2026-10-06-sd-direct-read](../2026-10-06-sd-direct-read.md)。本 lane は docs だけで、下の test は後続の runtime の lane が実装する（test 名は予定。既存の test として引用するものは `rg` で確かめた）。

## Risk

Risk: R3

## Contracts Under Test

- IO-07-D5（束の `settlement_no`）
- IO-09-D1〜D4（root の発見、名前の分類、読取り専用・書込み API なし・path の封じ込め・上限、形の測定）
- IO-09 §29.7.4 手順 4（手で選んだ file が SD の root の下か）と BIZ-08 §37.3 手順 1a（手で選んだ SD 上の file を SD の入力にする）
- 24 §14.14・§14.18a（`settlement_no` の INSERT と、精算回数で照合の候補を取る repository 関数）
- IO-10 §29.8.3（初回に保存先の directory を作ってから書く）
- BIZ-08-D3（SD の候補: 窓、組分け、状態、snapshot）
- BIZ-08-D4（同じ精算を別の bytes で取り込まない。preview と commit の TX）
- BIZ-08-D6（SD の経路は精算回数のある束だけ。scan・preview・commit）
- CMD-12-D1（scan cache、2 command）
- UI-07-D12・D15・D16（SD から読む画面、状態の表示、SD を戻す案内、予備のファイル選択）

## Failure Modes

- 観測した名前の場合（接尾字 A/B、`XZ_BKUP` の `_nnnn`、大文字の `EJ`、同じ日の複数の Z、未知の名前）を落とす・誤って読む
- 状態の値（系列の有無、CP932・CRLF・BOM、`RESERVE`・`XZ_BKUP` の有無）を決め打ちにして、外れた file を推測で読む
- 取込み済みを名前で判定し、`EcrDatas` から取り込み済みの分を「取り込めます」と出す
- 取込み前の原本と取込み後の file は同じ bytes と推定する（SD-23、推定・強）が、推定が外れて bytes が違うとき、同じ精算を 2 回取り込める
- 同じ日の 2 回目の精算を誤って「取込み済み」にする
- SD の経路で精算回数の無い束（`settlement_no` が None）を取り込み、後で別の bytes の同じ精算が照合をすり抜ける
- 取込み済み・取り込めない候補を snapshot に入れ、選べてしまう
- 写しの失敗の後に preview token を失い、同じ preview で再試行できない
- SD に書く、または root の外を読む
- 読取りの途中の失敗で途中までの一覧を出す
- CMD が IO を直接呼ぶ、規則が CMD / UI にある

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| IO-07-D5 | 3 本の精算回数がそろうのに None | unit | `daily_report_parser::settlement_no_is_some_when_all_three_agree` | 3 本とも `精算回数` が `0005`・`5`・`05` の束で `Some(5)` を返さない |
| IO-07-D5 | 1 本読めないのに Some | unit | `daily_report_parser::settlement_no_is_none_when_any_unreadable` | Z001 だけ精算回数の行があり、Z002 / Z005 が layout B の束で `Some` を返す |
| IO-07-D5 | 不一致でも Some | unit | `daily_report_parser::settlement_no_is_none_on_mismatch` | `settlement_mismatch` の束で `Some` を返す |
| IO-09-D1 | 選んだ path から root を解決できない | unit | `register_sd::resolve_accepts_drive_casio_and_model_folder` | 一時 directory の drive 相当・`CASIO`・`SR500_550_4000`（大文字小文字を混ぜる）の 3 通りのどれかで root にならない |
| IO-09-D1 | 別の folder を root にする | unit | `register_sd::resolve_rejects_non_register_folder` | `CASIO\SR500_550_4000` の無い folder で `NotRegisterSd` にならない |
| IO-09-D2 | 接尾字・連番の名前を落とす | unit | `register_sd::list_classifies_observed_names` | `XZ\2026\10\` の `Z001_06 .CSV`・`Z001_06A.CSV`・`Z001_06B.CSV` と `XZ_BKUP\2026\10\Z001_06 _0001.CSV`、`XZ\EJ261006.TXT`、`XZ_BKUP\EJ261005_0001.TXT`、小文字の `ej261004.txt`・`Ej261003.TXT`（`XZ` 直下）のどれかが期待の kind・area・date にならない |
| IO-09-D2 | 未知の名前を Z / EJ として読む | unit | `register_sd::list_returns_unknown_without_reading` | `XZ\2023\02\` の規則外の名前、`XZ` の連番つきの Z、`XZ_BKUP` の連番なしの Z、暦日として不正な `Z001_31 .CSV`（`2026\02\`）が `Unknown` にならない。読取りの関数が呼ばれる（test の stub で数える） |
| IO-09-D2 | 系列を決め打ちにする | unit | `register_sd::list_keeps_other_series` | `Z006_06 .CSV`・`Z123_06 .CSV` が返らない、またはエラーになる |
| IO-09-D2 | 窓の外を返す・窓の中を落とす | unit | `register_sd::list_filters_by_from_month_and_date` | `from` = 2026-10-03 で `XZ\2026\09\` の Z が返る、`XZ\2026\10\Z001_03 .CSV` が返らない、`XZ` 直下の古い日付の EJ が返らない |
| IO-09-D2 | `XZ_BKUP` が無いと失敗 / `XZ` が無いのに続ける | unit | `register_sd::list_area_presence` | `XZ_BKUP` の無い tree でエラー、`XZ` の無い tree で `MissingSalesArea` 以外 |
| IO-09-D3 | SD に書く | unit | `register_sd::scan_leaves_tree_unchanged` | list と read の前後で、一時 tree の全 file の名前・size・内容の hash・更新時刻が 1 つでも変わる |
| IO-09-D3 | 書込み API を使う | unit（source の検査） | `register_sd::module_has_no_write_api` | `src-tauri/src/io/register_sd.rs` に `fs::write` / `create_dir` / `rename` / `remove_` / `set_permissions` / `.write(true)` / `.append(true)` / `.create(true)` のどれかがある |
| IO-09-D3 | root の外を読む | unit | `register_sd::read_rejects_escaping_paths` | `..\x`・`C:\x`・`\x`・空の要素の相対 path で `InvalidPath` にならない |
| IO-09-D3 | 上限を超えて全部読む | unit | `register_sd::read_stops_at_limit` | `max_bytes` + 1 byte の file で `TooLarge` にならない |
| IO-09-D4 | 形を直して返す・測らない | unit | `register_sd::read_measures_shape` | BOM 付き・孤立 LF・孤立 CR・最終改行なし・CP932 でない byte 列のそれぞれで、該当の flag が立たない、または bytes が元と違う |
| BIZ-08-D3 | 窓の始まりを誤る | unit | `scan::window_from_latest_import_or_30_days` | completed の最大 report_date が 60 日前なら `from` がその日、昨日なら today − 30、取込みなしなら today − 30 にならない。rolled_back だけの日を最大に数える |
| BIZ-08-D3 | 同じ日の 2 つの精算を 1 つにする | integration（一時 tree + DB） | `scan::same_day_two_settlements_are_two_candidates` | 接尾字が空白と `A` の 2 組（精算回数 5・6）が 2 つの `NotImported` にならない |
| BIZ-08-D3 | `XZ` と `XZ_BKUP` の同じ bytes を 2 つ出す | integration | `scan::same_bytes_in_both_areas_collapse` | 同じ bytes の組が `XZ` と `XZ_BKUP` にあるとき候補が 2 つになる、またはまとめた候補の snapshot の 3 本の `sd_relative_path` が `XZ\` で始まらない（§37.9 手順 6。`XZ_BKUP` を先に列挙する tree でも `XZ` を残す。優先を消す mutant で red） |
| BIZ-08-D3 | `EcrDatas` から取込み済みの分を取り込めると出す | integration | `scan::imported_by_hash` | 同じ bytes の束を既存の手でのファイル選択の経路で commit した後、scan でその束が `Imported` にならない |
| BIZ-08-D3 | 取消の後に取り込めない | integration | `scan::rolled_back_is_not_imported` | rollback した束が `NotImported` に戻らない |
| BIZ-08-D3 | そろわない束を読む | integration | `scan::incomplete_group` | Z002 の無い組が `Incomplete` にならない、またはその組の file が読まれる |
| BIZ-08-D3 | 形の外れた束を取り込める | integration | `scan::shape_violation_is_unreadable` | Z005 だけ BOM 付き（または孤立 LF）の組が `Unreadable` にならない、snapshot に入る |
| BIZ-08-D3 | 途中の失敗で一部を返す | integration | `scan::io_failure_returns_error_without_candidates` | 2 組目の読取りで IO error を注入したとき `Ok` を返す |
| BIZ-08-D3 | 並びが新しい順でない | unit | `scan::candidates_sorted_newest_first` | 10-05 と 10-06、同じ日の精算回数 6 と 5 の並びが 10-06(6)・10-06(5)・10-05 にならない |
| BIZ-08-D3 | 同じ精算の別の bytes の束を「取り込めます」と出す | integration（一時 tree + DB） | `scan::same_settlement_other_bytes_is_same_settlement_imported` | DB に report_date・精算回数 5 の completed（hash H1）があり、SD に同じ日・精算回数 5 で 1 byte 違う束があるとき、状態が `SameSettlementImported` にならない、または snapshot に入る（手順 7 の照合を消す mutant で red） |
| BIZ-08-D3 | 取り込めない候補を snapshot に入れる | integration | `scan::snapshot_holds_only_not_imported` | `Imported`・`SameSettlementImported`・`Incomplete`・`Unreadable` の候補を 1 つずつ含む tree で、`files_by_candidate` の key が `NotImported` の候補だけにならない（手順 9 の絞り込みを消して全候補を入れる mutant で red）。続けて `Imported` の candidate_key で `parse_and_validate_daily_report_from_sd` が `validation` にならない |
| BIZ-08-D6 | scan で精算回数の無い束を取り込めると出す | integration | `scan::bundle_without_settlement_no_is_unreadable` | Z001 だけ精算回数の行があり Z002 / Z005 に無い（形は layout A のまま）束が `Unreadable` にならない、または snapshot に入る（手順 7 の None の分岐を消す mutant で red） |
| BIZ-08-D6 | preview で SD の None の束を通す | integration | `daily_report_import_service::sd_bundle_without_settlement_no_is_rejected` | 同じ束を `sd_relative_path` つきで `parse_and_validate_daily_report` に渡したとき、§37.3 手順 4 の固定の文の `ImportError` にならない（手順 4 の検査を消す mutant で red） |
| BIZ-08-D6 | 手で選んだ None の束まで止める | integration | `daily_report_import_service::manual_bundle_without_settlement_no_still_previews` | 同じ bytes を `sd_relative_path` なし・`source_path` が test の SD の root の外（`parse_and_validate_daily_report_with_sd_roots` に一時 directory の root を渡す）で渡したとき preview が成功しない（PC 上の file を手で選ぶ経路の扱いを壊す） |
| BIZ-08-D6 | 手で選んだ SD 上の None の束を通す | integration | `daily_report_import_service::manual_sd_bundle_without_settlement_no_is_rejected` | 同じ bytes を `sd_relative_path` なし・`source_path` が test の SD の root の下で渡したとき、§37.3 手順 4 の固定の文の `ImportError` にならない（§37.3 手順 1a を消す mutant で red） |
| §37.3 手順 1a | SD 上かを確かめられないのに PC の file として通す | integration | `daily_report_import_service::sd_root_lookup_failure_stops_preview` | root の列を返す処理の失敗を注入したとき、§37.3 手順 1a の固定の文の `ImportError` にならない（失敗を PC 扱いにする mutant で red） |
| BIZ-08-D6 | commit で SD の None の cache を通す | integration | `daily_report_import_service::commit_rejects_sd_cache_without_settlement_no` | `sd_source_files` が空でなく `settlement_no` が None の cache を直接作って commit したとき、`ImportError` にならない、`daily_report_imports` の行が増える、または `pos-sources/` に写しができる（§37.4 手順 2a を消す mutant で red。preview の検査が残っていても落ちる） |
| BIZ-08-D4 | 別の bytes の同じ精算を追加確認で通す | integration | `daily_report_import_service::same_settlement_different_bytes_is_rejected` | 同じ report_date・精算回数で 1 byte 違う束（Z002 の末尾の行の金額だけ違う）の preview が `ImportError`（固定の文）にならず `AdditionalImportConfirmationRequired` になる |
| BIZ-08-D4 | 同じ日の正常な 2 回目を止める | integration | `daily_report_import_service::same_date_other_settlement_still_confirms` | 精算回数 6 の束（既存は 5）が `AdditionalImportConfirmationRequired` 以外になる |
| BIZ-08-D4 | NULL・None を照合する | integration | `daily_report_import_service::null_settlement_no_is_not_compared` | `settlement_no` NULL の既存行、または layout B の束（None）で `ImportError` になる |
| BIZ-08-D4 | TX の間に入った同じ精算を通す | integration | `daily_report_import_service::commit_rechecks_same_settlement_in_tx` | 先に同じ日・精算回数 5・hash H1 の completed の行 A を repository で入れ、精算回数 5・hash H2 の cache を直接作る（`duplicate_check.status` = `AdditionalImportConfirmationRequired`、`active_same_date_import_ids` = [A の id] で TX の中の手順 5 の snapshot の再検査は通る形）。`additional_import_confirmed = true` で commit したとき、§37.3 手順 8 の BIZ-08-D4 の固定の文の `ImportError` にならない、または `daily_report_imports` の行が増える（§37.4 手順 4a を消す mutant で red。手順 5 は同じ snapshot なので先に拒まない） |
| BIZ-08-D4 | 保存しない | integration | `daily_report_import_service::commit_stores_settlement_no` | commit した行の `settlement_no` が束の値でない |
| BIZ-08-D4（24 §14.18a） | 照合の候補を誤って取る | integration（DB） | `sales_repo::find_same_settlement_daily_report_import_matches_only_completed_other_hash` | 同じ日・精算回数 5 の行が (H1, completed)・(H2, rolled_back)・(H3, completed、精算回数 NULL) のとき、hash H1 で呼んで `None` にならない、hash H9 で呼んで H1 の行の id にならない（rolled_back・NULL・同じ hash を除く条件のどれかを消す mutant で red） |
| BIZ-08-D4（24 §14.14） | INSERT が精算回数を落とす | integration（DB） | `sales_repo::insert_daily_report_import_stores_settlement_no` | `settlement_no: Some(5)` で入れた行の列が 5 でない、`None` で入れた行が NULL でない |
| BIZ-08-D4 | migration | integration | `migration::adds_daily_report_settlement_no_nullable` | 既存の DB を移行した後、既存行の `settlement_no` が NULL でない、列が無い |
| IO-10 | 同じ path の違う bytes を上書きする | unit | `pos_source_copy::different_bytes_get_hash_suffixed_name` | 同じ相対 path に違う bytes を 2 回書くと、1 回目の file の内容が変わる、または 2 回目が `~` + hash 12 桁の名前にならない |
| IO-10 | 同じ bytes を書き直す | unit | `pos_source_copy::same_bytes_not_rewritten` | 同じ bytes の 2 回目が `written: true` になる、更新時刻が変わる |
| IO-10 | 半端な file を最終の名前に残す | unit | `pos_source_copy::writes_via_temp_and_rename` | 書込みの途中の失敗を注入したとき、最終の名前の file ができる |
| IO-10 | 初回に保存先の directory が無いと書けない | unit | `pos_source_copy::creates_missing_directory_before_temp_file` | 空の一時 directory を app_data_dir にして `XZ\2026\10\Z001_06 .CSV` を書いたとき、`Ok` にならない、または `pos-sources/casio-sr-s4000/sd/XZ/2026/10/` の下に最終の名前の file ができない（`create_dir_all` を一時 file の後へ戻す mutant で red） |
| IO-10 | app data の外に書く | unit | `pos_source_copy::rejects_escaping_paths` | `..\x`・`C:\x` の相対 path で書く |
| BIZ-08-D5 | 写しの失敗でも取り込む | integration | `daily_report_import_service::copy_failure_aborts_commit` | 書けない app_data_dir（読取り専用の一時 directory）で commit が成功する、`daily_report_imports` の行が増える |
| BIZ-08-D5 | 写しの失敗の後に同じ token で再試行できない | integration（CMD + 一時 directory） | `daily_report_import_cmd::copy_failure_keeps_preview_token_for_retry` | 読取り専用の app_data_dir で commit が `import_error` になった後、`daily_report_preview_cache` に同じ preview_token が残らない、または書ける directory に替えて同じ token で commit が成功しない（行が 1 つ増え、写しが 3 本できる）。失敗時に token を消す mutant で red |
| BIZ-08-D5 | 写しの path を記録しない | integration | `daily_report_import_service::commit_records_copy_paths` | SD の束の commit の `source_files_json` に `sd_relative_path`・`copy_path` が無い、`copy_path` の file の bytes が束と違う |
| BIZ-08-D5 | PC 上の file を手で選んだ束も写す | integration | `daily_report_import_service::pc_bundle_has_no_copy` | `source_path` が test の SD の root の外（または `None`）の束の commit で `pos-sources/` に file ができる |
| BIZ-08-D5 | 手で選んだ SD 上の file を写さない | integration | `daily_report_import_service::manual_sd_files_are_copied` | `source_path` が test の SD の root の下の 3 本の commit で、`pos-sources/casio-sr-s4000/sd/` の下にその相対 path の写しが 3 本できない、または `source_files_json` に `sd_relative_path`・`copy_path` が無い（§37.3 手順 1a を消す mutant で red） |
| BIZ-08-D5 | 保存先の無い初回で取り込めない | integration | `daily_report_import_service::first_commit_creates_copy_directory` | `pos-sources/` の無い app_data_dir（空の一時 directory）で SD の束を commit したとき、写し 3 本と `daily_report_imports` の 1 行ができない |
| BIZ-08-D5 | 古い JSON を読めない | integration | `daily_report_import_service::source_filenames_accepts_missing_copy_fields` | `copy_path` の無い既存の `source_files_json` で同日の summary が失敗する |
| CMD-12-D1 | 期限切れの scan を使う | unit | `daily_report_import_cmd::from_sd_rejects_expired_scan` | 31 分前の snapshot で preview を返す |
| CMD-12-D1 | 取り込めない候補を受ける | unit | `daily_report_import_cmd::from_sd_rejects_unknown_candidate` | snapshot に無い candidate_key で preview を返す |
| CMD-12-D1 | 新しい scan で古い snapshot が残る | unit | `daily_report_import_cmd::new_scan_replaces_cache` | 2 回目の scan の後に 1 回目の scan_token で preview を返す |
| CMD-12-D1 | CMD が IO を呼ぶ | 既存の構造 test | `src-tauri/tests/architecture_test.rs`（`rg -n "fn " src-tauri/tests/architecture_test.rs` で存在を確かめた。LAYER_RULES は `:44`〜`:47` で cmd → db・io を禁止） | `cmd` から `io::register_sd`（`RegisterSd*` の型を含む）を use する。選択は BIZ-08 の `DailyReportSdSelection` で渡す |
| UI-07-D15 | 状態を色だけで示す・文言違い | component | `DailyReportImportPage.sd.test.tsx` の状態ごとの label | 5 状態の label（「取り込めます」「取込み済み」「同じ精算を取込み済み」「ファイルがそろっていません」「読めません」）と icon が出ない |
| UI-07-D15 | 取り込めない精算を「無い」と出す | component | `DailyReportImportPage.sd.test.tsx` の一覧の上の文 | (a) `NotImported` 1 件と `Unreadable` 1 件で文が出る、(b) `Incomplete` 1 件・`Unreadable` 1 件だけで「取り込める精算はありません。取り込めない精算が 2 件あります（「ファイルがそろっていません」「読めません」の行）。」が出ない、または「新しい精算はありません」が出る、(c) 候補 0 件と、`Imported`・`SameSettlementImported` だけのときに「新しい精算はありません」が出ない |
| UI-07-D15 | SD を戻す案内が出ない | component | 同上 | scan 成功の後に「SD はレジに戻してください」が出ない |
| UI-07-D15 | 見つからないときの予備が出ない | component | 同上 | 「SD が見つかりません」の error のとき「場所を選ぶ」が出ない |
| UI-07-D15 | reducer の遷移 | unit | `reducer.test.ts`（既存 file、`src/features/daily-report-import/reducer.test.ts`） | `scanning` → `sd_list` → `parsing` → `preview` と、SD から来た parse 失敗の recoverTo `sd_list` が成り立たない |
| UI-07-D16 | 1 つずつ選び足し・外す | component | `DailyReportImportPage.files.test.tsx` | Z001 → Z005 → Z002 の順に 1 つずつ足して「確認する」が有効にならない、1 つ外すと無効に戻らない |
| UI-07-D16 | dialog の path を捨てる | unit（hook） | `useDailyReportImportFlow.test.tsx` の payload | dialog が返した 3 つの path が、`parseAndValidateDailyReport` の各要素の `source_path` に入らない（今の `{ filename, file_bytes }` だけの payload のまま） |
| IO-09（§29.7.4 手順 4） | SD の root の下かを誤る | unit | `register_sd::locate_in_roots_maps_paths` | root `E:\CASIO\SR500_550_4000` に対し、`e:\casio\sr500_550_4000\XZ\2026\10\Z001_06 .CSV` が `XZ\2026\10\Z001_06 .CSV` にならない。`E:\CASIO\SR500_550_4000X\a.CSV`（名前の前方一致だけ）・`C:\EcrDatas\a.CSV`・相対 path・`..` を含む path・空の root の列のどれかが `None` にならない |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| SD の scan（snapshot） | idle | scanning（ボタン disabled、離脱は block しない） | sd_list と scan_token、SD を戻す案内 | 新しい scan で置き換え、30 分で失効 | 「SD から読む」をもう一度 | 画面を離れて戻ると idle（snapshot は 30 分残るが UI は持たない） | アプリの再起動で失効 | 見つからない・2 つ以上・読めない → 固定の文と予備の操作、候補は出さない | もう一度読む | CMD-12-D1 の 3 行、UI の状態 test |
| 候補の状態 | — | — | NotImported / Imported / SameSettlementImported / Incomplete / Unreadable（精算回数の無い束を含む、BIZ-08-D6） | commit で NotImported → Imported（再 scan で反映） | 再 scan | — | — | — | rollback で Imported → NotImported | BIZ-08-D3 の行 |
| 日報の取込み | preview | importing（既存の block） | result | rollback | 既存 | 既存 | 既存 | BIZ-08-D4 の拒否 | 前の取込みを取り消してから読み直す | BIZ-08-D4 の行 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| preview cache（AppState、30 分、UUID token） | `45-cmd-daily-report-import.md` §45.2・§45.3・§45.4 | scan cache（§45.6a・§45.6b）に同じ 30 分・UUID | scan は commit しないので「失敗時に残す」の規則は不要。新しい scan で置き換える | CMD-12-D1 の行 |
| 重複判定（bundle_hash の AlreadyImported、同日追加の確認） | 37 §37.3 手順 8、§37.4 手順 4〜5 | SD の候補の状態（§37.9 手順 7）が同じ hash の照合を使う | — | BIZ-08-D3 の imported_by_hash |
| 利用者向けの固定の文（BIZ-08-D1・D2） | 37 §37.3 手順 3 | BIZ-08-D4 と §37.9 の文も raw detail を含めない固定の文 | — | BIZ-08-D4 の行 |
| UI の入力エラーの 1 スロット表示（destructive テキスト + icon、ボタン直下） | 55 §55.0 手順 2 | 「SD から読む」の直下の error | 上部 Alert 帯はデータ安全系だけのまま | UI-07-D15 の行 |
| 前回選択フォルダの記憶 | 55 §55.1 `useDailyReportImportFlow.ts` | 予備の経路だけに残す | SD の経路は場所を記憶しない（自動で探す） | UI-07-D16 |

## Negative Paths

- missing input: SD が無い（`find_register_sd_roots` が空の列）、`XZ` が無い、Z002 の無い組
- invalid input: SD の root の下かを確かめられない手で選んだ file（§37.3 手順 1a）、規則外の名前、暦日として不正な日付、BOM・孤立 LF / CR・CP932 でない bytes、parse_errors のある束、SD の経路で精算回数の無い束（BIZ-08-D6）
- duplicate/ambiguous input: SD が 2 枚、同じ bytes が `XZ` と `XZ_BKUP`、同じ精算の別の bytes
- unknown reference: snapshot に無い candidate_key、期限切れの scan_token
- dependency missing: Windows 以外では自動の発見が空（予備の経路だけ）
- permission/write failure: 読取りの途中の IO error（全体の失敗）。書込みは無い
- dry-run side effect: scan は DB にも SD にも書かない（scan_leaves_tree_unchanged、scan の後の DB の行数が同じ）

## Boundary Checks

- threshold: 窓の 30 日、scan cache の 30 分、1 file の 20MB
- null/default: `settlement_no` None・NULL、`selected_path` None
- empty/non-empty: 候補 0 件と全件取込み済み（「新しい精算はありません」）、取り込めない候補だけ（「取り込める精算はありません。取り込めない精算が N 件あります…」）
- min/max: 接尾字 `A`〜`Z` と空白、連番 4 桁
- status/policy enum: 候補の状態 5 値
- wire type: `DailyReportSdCandidateStatus` は specta の string union
- internal type: `settlement_no: Option<i64>`
- producer/consumer: BIZ-08 → CMD-12 → UI-07
- round-trip token: scan_token、candidate_key（bundle_hash）
- precision/range: 精算回数の先頭 0
- cross-language parse: path の区切り `\`（Windows）と test の一時 directory

## Compatibility Checks

- old schema/input: `settlement_no` NULL の既存行、手で選んだ 3 ファイル（既存の command）
- new schema/input: SD の候補からの preview
- output order: 候補の並び（新しい順）
- optional field behavior: `report_date` は読めた束だけ

## Data Safety Checks

- source-derived data: test の SD の tree は合成（実の名前の形だけを使い、中身は合成）
- generated outputs: bindings は generator で再生成
- secrets: 無し
- local-only files: 実 SD の採取は repo 外
- synthetic sample boundaries: 合成の Z は layout A の形で、値は合成

## Main Wiring / Integration Checks

- helper connected to main path: `scan_register_sd` → BIZ-08 §37.9 → IO-09、`parse_and_validate_daily_report_from_sd` → §37.3
- output reaches manifest/report: commit した日報が日次売上に出る（既存）
- effective config reaches runtime: specta の登録（`lib.rs`）
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- 窓の `min` を `max` にすると `window_from_latest_import_or_30_days` が落ちる。
- BIZ-08-D4 の照合から `settlement_no` を外す（report_date だけ）と `same_date_other_settlement_still_confirms` が落ちる。
- `XZ` / `XZ_BKUP` の連番の有無の規則を外すと `list_returns_unknown_without_reading` が落ちる。
- 形の検査を外すと `shape_violation_is_unreadable` が落ちる。
- BIZ-08-D6 の 3 つの検査（scan の手順 7、preview の §37.3 手順 4、commit の §37.4 手順 2a）は、どれか 1 つを消すとその段の行（`bundle_without_settlement_no_is_unreadable`・`sd_bundle_without_settlement_no_is_rejected`・`commit_rejects_sd_cache_without_settlement_no`）が落ちる。検査の条件を「SD の経路」でなく全部の束にすると `manual_bundle_without_settlement_no_still_previews` が落ちる。
- 大文字小文字の無視を外すと `list_classifies_observed_names` の `ej261004.txt` が落ちる。

## Residual Test Gaps

- 実 SD の自動の発見（`DRIVE_REMOVABLE`）と、取込み前の原本が取込み後の file と同じ bytes か（SD-23 は静的解析で推定・強。実機の前後比較は packet の P1 で runtime の lane の L3 の前）・その形（SD-24）は自動 test にできない。runtime の lane の L3（店の PC で「SD から読む」→ 一覧 → 取り込む → SD をレジへ戻して次の精算ができる）。
- 窓より前の未取込みは検知しない（Non-scope）。
