# Test Design Matrix: SD を直接読む設計

Packet: [2026-10-06-sd-direct-read](../2026-10-06-sd-direct-read.md)。本 lane は docs だけで、下の test は後続の runtime の lane が実装する（test 名は予定。既存の test として引用するものは `rg` で確かめた）。

## Risk

Risk: R3

## Contracts Under Test

- IO-07-D5（束の `settlement_no`）
- IO-09-D1〜D4（root の発見、名前の分類、読取り専用・書込み API なし・path の封じ込め・上限、形の測定）
- BIZ-08-D3（SD の候補: 窓、組分け、状態、snapshot）
- BIZ-08-D4（同じ精算を別の bytes で取り込まない。preview と commit の TX）
- CMD-12-D1（scan cache、2 command）
- UI-07-D12〜D14（SD から読む画面、状態の表示、SD を戻す案内、予備のファイル選択）

## Failure Modes

- 観測した名前の場合（接尾字 A/B、`XZ_BKUP` の `_nnnn`、大文字の `EJ`、同じ日の複数の Z、未知の名前）を落とす・誤って読む
- 状態の値（系列の有無、CP932・CRLF・BOM、`RESERVE`・`XZ_BKUP` の有無）を決め打ちにして、外れた file を推測で読む
- 取込み済みを名前で判定し、`EcrDatas` から取り込み済みの分を「取り込めます」と出す
- 取込み前の原本と取込み後の bytes が違うとき、同じ精算を 2 回取り込める
- 同じ日の 2 回目の精算を誤って「取込み済み」にする
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
| BIZ-08-D3 | `XZ` と `XZ_BKUP` の同じ bytes を 2 つ出す | integration | `scan::same_bytes_in_both_areas_collapse` | 同じ bytes の組が `XZ` と `XZ_BKUP` にあるとき候補が 2 つになる |
| BIZ-08-D3 | `EcrDatas` から取込み済みの分を取り込めると出す | integration | `scan::imported_by_hash` | 同じ bytes の束を既存の手でのファイル選択の経路で commit した後、scan でその束が `Imported` にならない |
| BIZ-08-D3 | 取消の後に取り込めない | integration | `scan::rolled_back_is_not_imported` | rollback した束が `NotImported` に戻らない |
| BIZ-08-D3 | そろわない束を読む | integration | `scan::incomplete_group` | Z002 の無い組が `Incomplete` にならない、またはその組の file が読まれる |
| BIZ-08-D3 | 形の外れた束を取り込める | integration | `scan::shape_violation_is_unreadable` | Z005 だけ BOM 付き（または孤立 LF）の組が `Unreadable` にならない、snapshot に入る |
| BIZ-08-D3 | 途中の失敗で一部を返す | integration | `scan::io_failure_returns_error_without_candidates` | 2 組目の読取りで IO error を注入したとき `Ok` を返す |
| BIZ-08-D3 | 並びが新しい順でない | unit | `scan::candidates_sorted_newest_first` | 10-05 と 10-06、同じ日の精算回数 6 と 5 の並びが 10-06(6)・10-06(5)・10-05 にならない |
| BIZ-08-D4 | 別の bytes の同じ精算を追加確認で通す | integration | `daily_report_import_service::same_settlement_different_bytes_is_rejected` | 同じ report_date・精算回数で 1 byte 違う束（Z002 の末尾の行の金額だけ違う）の preview が `ImportError`（固定の文）にならず `AdditionalImportConfirmationRequired` になる |
| BIZ-08-D4 | 同じ日の正常な 2 回目を止める | integration | `daily_report_import_service::same_date_other_settlement_still_confirms` | 精算回数 6 の束（既存は 5）が `AdditionalImportConfirmationRequired` 以外になる |
| BIZ-08-D4 | NULL・None を照合する | integration | `daily_report_import_service::null_settlement_no_is_not_compared` | `settlement_no` NULL の既存行、または layout B の束（None）で `ImportError` になる |
| BIZ-08-D4 | TX の間に入った同じ精算を通す | integration | `daily_report_import_service::commit_rechecks_same_settlement_in_tx` | preview の後に同じ精算の別の bytes を commit し、元の preview の commit が副作用なしで止まらない（`daily_report_imports` の行が増える） |
| BIZ-08-D4 | 保存しない | integration | `daily_report_import_service::commit_stores_settlement_no` | commit した行の `settlement_no` が束の値でない |
| BIZ-08-D4 | migration | integration | `migration::adds_daily_report_settlement_no_nullable` | 既存の DB を移行した後、既存行の `settlement_no` が NULL でない、列が無い |
| CMD-12-D1 | 期限切れの scan を使う | unit | `daily_report_import_cmd::from_sd_rejects_expired_scan` | 31 分前の snapshot で preview を返す |
| CMD-12-D1 | 取り込めない候補を受ける | unit | `daily_report_import_cmd::from_sd_rejects_unknown_candidate` | snapshot に無い candidate_key で preview を返す |
| CMD-12-D1 | 新しい scan で古い snapshot が残る | unit | `daily_report_import_cmd::new_scan_replaces_cache` | 2 回目の scan の後に 1 回目の scan_token で preview を返す |
| CMD-12-D1 | CMD が IO を呼ぶ | 既存の構造 test | `src-tauri/tests/architecture_test.rs`（`rg -n "fn " src-tauri/tests/architecture_test.rs` で存在を確かめた） | `cmd` から `io::register_sd` を use する |
| UI-07-D13 | 状態を色だけで示す・文言違い | component | `DailyReportImportPage.sd.test.tsx` の状態ごとの label | 5 状態の label（「取り込めます」「取込み済み」「同じ精算を取込み済み」「ファイルがそろっていません」「読めません」）と icon が出ない |
| UI-07-D13 | SD を戻す案内が出ない | component | 同上 | scan 成功の後に「SD はレジに戻してください」が出ない |
| UI-07-D13 | 見つからないときの予備が出ない | component | 同上 | 「SD が見つかりません」の error のとき「場所を選ぶ」が出ない |
| UI-07-D13 | reducer の遷移 | unit | `reducer.test.ts`（既存 file、`src/features/daily-report-import/reducer.test.ts`） | `scanning` → `sd_list` → `parsing` → `preview` と、SD から来た parse 失敗の recoverTo `sd_list` が成り立たない |
| UI-07-D14 | 1 つずつ選び足し・外す | component | `DailyReportImportPage.files.test.tsx` | Z001 → Z005 → Z002 の順に 1 つずつ足して「確認する」が有効にならない、1 つ外すと無効に戻らない |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| SD の scan（snapshot） | idle | scanning（ボタン disabled、離脱は block しない） | sd_list と scan_token、SD を戻す案内 | 新しい scan で置き換え、30 分で失効 | 「SD から読む」をもう一度 | 画面を離れて戻ると idle（snapshot は 30 分残るが UI は持たない） | アプリの再起動で失効 | 見つからない・2 つ以上・読めない → 固定の文と予備の操作、候補は出さない | もう一度読む | CMD-12-D1 の 3 行、UI の状態 test |
| 候補の状態 | — | — | NotImported / Imported / SameSettlementImported / Incomplete / Unreadable | commit で NotImported → Imported（再 scan で反映） | 再 scan | — | — | — | rollback で Imported → NotImported | BIZ-08-D3 の行 |
| 日報の取込み | preview | importing（既存の block） | result | rollback | 既存 | 既存 | 既存 | BIZ-08-D4 の拒否 | 前の取込みを取り消してから読み直す | BIZ-08-D4 の行 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| preview cache（AppState、30 分、UUID token） | `45-cmd-daily-report-import.md` §45.2・§45.3・§45.4 | scan cache（§45.6a・§45.6b）に同じ 30 分・UUID | scan は commit しないので「失敗時に残す」の規則は不要。新しい scan で置き換える | CMD-12-D1 の行 |
| 重複判定（bundle_hash の AlreadyImported、同日追加の確認） | 37 §37.3 手順 8、§37.4 手順 4〜5 | SD の候補の状態（§37.9 手順 7）が同じ hash の照合を使う | — | BIZ-08-D3 の imported_by_hash |
| 利用者向けの固定の文（BIZ-08-D1・D2） | 37 §37.3 手順 3 | BIZ-08-D4 と §37.9 の文も raw detail を含めない固定の文 | — | BIZ-08-D4 の行 |
| UI の入力エラーの 1 スロット表示（destructive テキスト + icon、ボタン直下） | 55 §55.0 手順 2 | 「SD から読む」の直下の error | 上部 Alert 帯はデータ安全系だけのまま | UI-07-D13 の行 |
| 前回選択フォルダの記憶 | 55 §55.1 `useDailyReportImportFlow.ts` | 予備の経路だけに残す | SD の経路は場所を記憶しない（自動で探す） | UI-07-D14 |

## Negative Paths

- missing input: SD が無い（NotFound）、`XZ` が無い、Z002 の無い組
- invalid input: 規則外の名前、暦日として不正な日付、BOM・孤立 LF / CR・CP932 でない bytes、parse_errors のある束
- duplicate/ambiguous input: SD が 2 枚、同じ bytes が `XZ` と `XZ_BKUP`、同じ精算の別の bytes
- unknown reference: snapshot に無い candidate_key、期限切れの scan_token
- dependency missing: Windows 以外では自動の発見が空（予備の経路だけ）
- permission/write failure: 読取りの途中の IO error（全体の失敗）。書込みは無い
- dry-run side effect: scan は DB にも SD にも書かない（scan_leaves_tree_unchanged、scan の後の DB の行数が同じ）

## Boundary Checks

- threshold: 窓の 30 日、scan cache の 30 分、1 file の 20MB
- null/default: `settlement_no` None・NULL、`selected_path` None
- empty/non-empty: 候補 0 件（「新しい精算はありません」）
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
- 大文字小文字の無視を外すと `list_classifies_observed_names` の `ej261004.txt` が落ちる。

## Residual Test Gaps

- 実 SD の自動の発見（`DRIVE_REMOVABLE`）と、取込み前の原本の形（SD-23 / SD-24）は自動 test にできない。runtime の lane の L3（店の PC で「SD から読む」→ 一覧 → 取り込む → SD をレジへ戻して次の精算ができる）。
- 窓より前の未取込みは検知しない（Non-scope）。
