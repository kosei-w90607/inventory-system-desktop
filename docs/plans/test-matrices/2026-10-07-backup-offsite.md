# Test Design Matrix: backup の PC の外の控えと復元

Plan Packet: [2026-10-07-backup-offsite](../2026-10-07-backup-offsite.md)。本 lane は docs だけで、下の test は後続の runtime の lane が実装する（test 名は runtime の lane が決め、`req901` と決定 ID を含める。71 §71.10 の「D-114 の追加」の表と同じ対象）。oracle は設計正本（71 §71.4・§71.11・§71.12、68 UI-11b-D14〜D16、53 UI-00-D12、43 §43.8.2〜§43.8.5）から取り、実装から写さない。

## Risk

Risk: R4

## Contracts Under Test

- MNT-01-D7: backup は作業名へ書き、`quick_check` と版の読取りで確かめてから正式名にする。今日の backup の判定・一覧・掃除・PC の外の控えは正式名だけを見る。
- MNT-01-D8: PC の外の控えは、目印と PC 側の状態の両方で見分けた取外し可能な媒体の `InventoryBackup\` へ、確かめ済みの最新の backup を作業名へ写し、読み戻しの SHA-256 で照合してから正式名にする。媒体ごとに新しい 30 本を残す。状態は DB の外。最後に写せた日から 3 日以上で `stale`。
- MNT-01-D9: `inspect_backup` は file と folder を変えずに、版（アプリより新しいか）・`quick_check`・商品の数・最後の記録を返す。復元の詳細は確かめで止めた控えを確認の手順へ進めない。
- MNT-01-D10: backup の file を、root に `CASIO\SR500_550_4000` がある drive に書かない。
- 43 §43.8.2〜§43.8.5: 4 command は MNT を呼ぶだけで、DB の Mutex を写す前に放し、失敗を `validation` / `internal` の固定の文へ写す。
- UI-11b-D14〜D16、UI-00-D12: card の状態の文、確かめの止める文言、共通の確認の順と停止、ホームの知らせの条件。

## Failure Modes

- `VACUUM INTO` の途中で止まった file・壊れた file が正式名で残り、今日の backup と数えられる・復元の候補に出る・PC の外へ写される。
- drive 文字の変化で、レジの SD・目印の無い媒体・別の PC で用意した媒体に書く。
- 写した file を読み戻さずに成功とする。照合の失敗の file が正式名で残る。
- 媒体の上の掃除が、今写した file・目印・規約外の file を消す。久しぶりに差した媒体の古い控えを一度に消す。
- 状態を DB に置いて復元で巻き戻る。状態の file が壊れたときに黙って `NotPrepared` になる。
- 媒体が見えないときに `last_success` を消す・変える。
- 新しすぎる版・壊れた控えで事前バックアップを作り、確認の手順へ進む。`inspect_backup` が journal を作る・file を変える。
- 共通の確認が復元の間に写す。古い世代の結果で status を invalidate する。媒体が抜けているだけで毎分 toast を出す。
- ホームが用意の前に知らせる。3 日の境界がずれる。

## Test Matrix

- 既存の test を回帰の証跡に挙げる前に `rg` で実在を確かめる（下の Adjacent Pattern Audit の「既存」は 2026-10-07 に `rg -n` で確かめた名前）。
- 媒体の発見は root の列を受ける内部関数に一時 directory を渡して通し、production と test で別の判定を作らない（71 §71.11.3）。drive の種類の判定（`GetDriveTypeW`）は Windows の L3 で確かめる。
- 写しの失敗の注入は、restore の `RestoreFileOps` と同じ形の file 操作の差し替えで行う（copy・sync・rename・読み戻しの bytes）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| MNT-01-D7 | `VACUUM INTO` の失敗で正式名の file が残る | unit（`mnt::backup`、注入） | `test_create_backup_req901_d7_vacuum_failure_leaves_no_published_file` | 作業名を使わず正式名へ直接書く、または失敗後に作業名の file を消さない |
| MNT-01-D7 | 壊れた作業名の file を公開する | unit（注入: 作業名の file を検査の前に壊す） | `test_create_backup_req901_d7_quick_check_failure_removes_partial_without_success_log` | 手順 4a の `quick_check` を飛ばす、失敗でも rename する、成功の操作ログを書く |
| MNT-01-D7 | 作業名を今日の backup と数える | unit | `test_check_auto_backup_req901_d7_partial_not_counted_as_today` | 今日の判定が `.db` の後方一致・規約の完全一致をやめる（作業名 `…_{HHMMSS}.db.partial` だけの dir で backup を作らない） |
| MNT-01-D7 | 前回の残りの作業名が溜まる | unit | `test_create_backup_req901_d7_removes_stale_partial_before_write` | 手順 3 の残りの作業名の削除を消す |
| MNT-01-D10 | レジの SD に backup を書く | unit（一時 dir の root に `CASIO\SR500_550_4000`） | `test_create_backup_req901_d10_refuses_register_sd_root` | 手順 0 の判定を消す（dir の一覧が前後で同じ、`DbError::QueryFailed`） |
| MNT-01-D10 / D8 | 用意・写しがレジの SD に書く | unit | `test_offsite_req901_d10_prepare_and_copy_refuse_register_sd_root` | §71.11.2 手順 3・§71.11.3 の判定を消す |
| MNT-01-D8 用意 | 取外し可能でない drive を用意する | unit（drive の種類を返す関数を差し替え） | `test_prepare_offsite_req901_d8_rejects_non_removable` | 手順 2 を消す |
| MNT-01-D8 用意 | 既存の目印を作り直して `medium_id` が変わる・写しを消す | unit | `test_prepare_offsite_req901_d8_reuses_existing_marker_and_keeps_copies` | 読める目印を書き換える、folder を作り直す |
| MNT-01-D8 用意 | 状態が読めないのに上書きして媒体の一覧を失う | unit | `test_prepare_offsite_req901_d8_state_unreadable_does_not_overwrite` | 手順 5 で壊れた状態の file を新しい内容で上書きする |
| MNT-01-D8 写し | 用意の前・媒体が見えないときに書く・`last_success` を変える | unit | `test_check_offsite_req901_d8_not_prepared_and_medium_missing_write_nothing` | 手順 1・3 の後に書く（状態の file の bytes と媒体の一覧が前後で同じでない） |
| MNT-01-D8 写し | 目印の無い媒体・別の PC で用意した媒体に書く | unit（root の列に、目印なし・未登録の `medium_id` の 2 つ） | `test_check_offsite_req901_d8_ignores_unmarked_and_foreign_media` | §71.11.3 の目印・状態の照合を消す |
| MNT-01-D8 写し | 成功で正式名・`last_success`（hash）が残らない | unit | `test_check_offsite_req901_d8_copy_publishes_verified_copy_and_records_success` | 正式名・`last_success.sha256`（元の file の SHA-256 と一致、oracle は test が別に計算）が無い |
| MNT-01-D8 照合 | 読み戻しの不一致を成功にする | unit（読み戻しの bytes を 1 byte 変える注入） | `test_check_offsite_req901_d8_verify_mismatch_removes_partial_and_records_failure` | 手順 4e の比較を消す、作業名を rename する、`last_failure.kind` が `verify_mismatch` でない |
| MNT-01-D8 写し | 同じ file を毎回写す | unit | `test_check_offsite_req901_d8_up_to_date_skips_copy` | 手順 4a を消す（2 回目の呼出しで `UpToDate`、媒体の file の更新時刻が変わらない） |
| MNT-01-D8 保持 | 今写した file・規約外の file を消す、30 本を超えて残す | unit（31 本の正式名 + 目印 + 規約外の 1 file） | `test_check_offsite_req901_d8_retention_keeps_newest_and_foreign_files` | 掃除の数・並び・対象の判定がずれる（30 本・目印・規約外の file が残り、最も古い 1 本だけが消える） |
| MNT-01-D8 状態 | 状態の file の破損で黙って止まる | unit | `test_offsite_status_req901_d8_state_unreadable_is_stale_not_unprepared` | `offsite_status` が破損を `prepared = false` にする |
| MNT-01-D8 状態 | 3 日の境界がずれる | unit（today を渡す） | `test_offsite_status_req901_d8_stale_boundary_three_days` | `>=` を `>` にする（2 日前 = false、3 日前 = true、写せていない = true） |
| MNT-01-D8 状態 | 状態を DB に置いて復元で巻き戻る | integration（`restore_backup` の前後で `offsite-backup.json` の bytes が同じ） | `test_restore_req901_d8_does_not_touch_offsite_state` | 状態を `app_settings` に置く、restore が app data の他の file を触る |
| MNT-01-D9 | 新しすぎる版を戻せると返す | unit（`app_max_version() + 1` の DB。既存の test helper `db/test_support.rs:16` の形） | `test_inspect_backup_req901_d9_newer_than_app` | 版の比較を消す・`migrate` と別の判定を書く |
| MNT-01-D9 | 壊れた控えを戻せると返す | unit（page を壊した file） | `test_inspect_backup_req901_d9_quick_check_failure` | `quick_check` を飛ばす |
| MNT-01-D9 | 確かめが file・folder を変える | unit（前後の SHA-256 と folder の一覧） | `test_inspect_backup_req901_d9_leaves_file_and_folder_unchanged` | `immutable=1`・読取り専用をやめる（journal の file ができる） |
| MNT-01-D9 | 読めない file を `Ok` にする | unit | `test_inspect_backup_req901_d9_unreadable_is_error` | open・版の読取りの失敗を既定値に倒す |
| 43 §43.8.2〜§43.8.5 | 失敗の写像が message の文字列に依る・kind を足す | unit（CMD） | `test_offsite_cmd_req901_maps_errors_to_fixed_kinds` | `NotRemovable` / `RegisterSd` が `validation` でない、`CmdErrorKind` に値が増える |
| 43 §43.8.3 | 写す間 DB の Mutex を持つ | integration（写しの途中で別の command が DB を読める。注入で copy を止めて確かめる） | `test_check_offsite_cmd_req901_releases_db_lock_before_copy` | CMD が lock を持ったまま MNT を呼ぶ |
| UI-11b-D14 | 状態の文が設計とずれる | component（`OffsiteBackupPanel`） | `OffsiteBackupPanel` の UI-11b-D14 の各状態（用意の前・写せた・まだ・`stale`・媒体なし・失敗の種類） | 文言・日数・札の名前の表示が設計の文と違う（mock の日時・札は設計の例と違う値を使う） |
| UI-11b-D15 | 止めた控えで事前バックアップ・確認へ進む | flow（`BackupRestorePage.flow.test.tsx`） | 新しすぎる版・壊れた・読めないの 3 つで `createBackup` が呼ばれず、復元の button が無く、固有の文言が出る | `restore_inspecting` を飛ばす、`restore_blocked` で button を出す |
| UI-11b-D15 | 選んだ file が復元の流れに入らない | flow | file picker で選んだ path が `inspectBackup` と `restoreBackup({ backup_path })` に同じ値で渡る | 一覧の `BackupInfo` しか受けない |
| UI-11b-D16 | 復元の間に写す・古い結果で invalidate する | hook（`useAutoBackupCheck.test.tsx`） | 停止中は `checkOffsiteBackup` を呼ばない、停止の前に始まった結果を捨てる、`checkAutoBackup` の後に呼ぶ、mount で 1 回だけ呼ぶ | 世代番号・停止を共有しない、順が逆、mount で呼ばない・毎 render 呼ぶ |
| UI-11b-D16 | 媒体なしで毎分 toast | hook | `medium_missing` で toast も invalidate も無い、失敗は連続の最初の 1 回だけ toast（id `backup-offsite-error`） | 結果ごとに toast を出す |
| UI-00-D12 | 用意の前に知らせる・境界の判定をホームでする | component（`HomePage.test.tsx`、実 hook + QueryClient） | `prepared = false` と `stale = false` で Alert なし、`stale = true` で日数の文（mock の日数は設計の例の 3 と違う 5）と「バックアップ画面へ」の link、写せていないときの文、query 失敗で Alert なしと toast | ホームが日数を計算する、`stale` 以外を見て出す |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| PC の中の backup の file | 無し | 作業名 `.partial` | 確かめ → 正式名 | — | 一覧の再取得 | 一覧は正式名だけ | 次の `create_backup` が残りの作業名を消す | 作業名を消す（消せなければ次回） | 次の確認・手動 | MNT-01-D7 の行 |
| 媒体の写し | 無し | 媒体の作業名 `.partial` | 照合 → 正式名、`last_success` | status の invalidate（UI-11b-D16） | 画面・ホームの status | 入れ替えで別の媒体（目印で見分ける） | 起動直後の確認で写す | 作業名を消し `last_failure` | 60 秒後の確認 | MNT-01-D8 の行 |
| PC 側の状態の file | 無し（`NotPrepared`） | 作業名 → rename | 用意で `media`、写しで `last_success` | — | `offsite_status` は毎回 file から | 復元で変わらない | そのまま残る | 読めない → `StateUnreadable`・`stale` | 利用者が直す（上書きしない） | MNT-01-D8 状態の行 |
| 復元の詳細 | 未選択 | `restore_inspecting` | `restore_detail`（確かめの結果つき） | — | — | 一覧へ戻って別の控え | — | `restore_blocked`（固有の文言） | 別の控えを選ぶ | UI-11b-D15 の行 |
| 共通の確認 | mount | 実行中の guard | `copied` → invalidate | 世代番号が違えば捨てる | — | — | mount で 1 回 | 連続の最初の 1 回だけ toast | 60 秒後 | UI-11b-D16 の行 |
| ホームの知らせ | query | — | `stale` なら Alert | status の invalidate で消える | — | ホームへ戻るたび | 起動直後の確認の後 | query 失敗は Alert なし + toast | query の再取得 | UI-00-D12 の行 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 共通の確認の停止と世代番号（UI-11b-D13） | `src/features/backup-restore/useAutoBackupCheck.ts:18`〜`:31`（`suspended`・`generation`・`suspendAutoBackupCheck`・`resumeAutoBackupCheck`）、`BackupRestorePage.tsx` の停止・再開の呼出し（`:273`・`:279`・`:303`） | `checkOffsiteBackup` は同じ interval の同じ回の中で、同じ guard・停止・世代番号を使う（UI-11b-D16） | 別の interval を張らない（UI-11b-D16 の棄却案） | UI-11b-D16 の行。既存の `useAutoBackupCheck.test.tsx` の停止の test を回帰で回す |
| 失敗の toast は連続の最初の 1 回（UI-11b-D13、id 付き） | `useAutoBackupCheck.ts:56`〜`:61`（id `backup-auto-check-error`） | id `backup-offsite-error` で同じ形 | 成功の toast は写しに付けない（UI-11b-D16） | UI-11b-D16 の行 |
| ホームの独立 query と失敗時の沈黙 + toast（53 §53.5） | 53 §53.5 の pluDirty・csvImports の行、`HomePage.tsx:78`（前日未取込みの Alert） | status の query の失敗も Alert なし + toast | 「誤検知より沈黙」の既存の判断を変えない（backup の画面の card が取得失敗を出す） | UI-00-D12 の行 |
| 作業名 → sync → rename → 親 dir の sync（restore の manifest、MNT-01-D5） | `src-tauri/src/mnt/restore.rs:256`（`write_manifest`）・`:182`（`sync_parent`） | backup の公開（MNT-01-D7）、媒体の写し・目印・状態の file（MNT-01-D8） | restore の manifest と reconcile は変えない | MNT-01-D7・D8 の行 |
| file 操作の失敗の注入（restore の `RestoreFileOps`） | `src-tauri/src/mnt/restore.rs:99`〜`:110`（trait `RestoreFileOps`）、test の注入の型（`:779` の `impl InjectedOps`） | 写しの copy・sync・rename・読み戻しの注入 | 本番と test で別の判定を作らない（71 §71.8 の注入境界と同じ） | MNT-01-D8 照合の行 |
| 版の判定（MNT-03-D11） | `src-tauri/src/db/migration.rs:79`（`app_max_version`）・`:91`（`read_current_version_without_ddl`）・`:171`（`migrate` の呼出し） | `inspect_backup` は同じ関数を共有する | restore の中に版の事前検査を足さない（22 MNT-03-D11） | MNT-01-D9 の行 |
| 新しすぎる版の DB の test helper | `src-tauri/src/db/test_support.rs:16`・`:59`〜`:63` | `inspect_backup` の新しすぎる版の fixture | — | MNT-01-D9 の行 |
| レジの SD の folder（IO-09） | 29 §29.7（`CASIO\SR500_550_4000`）、SD 直読みの runtime の lane（未実装） | MNT-01-D10 の判定 | 文字列を二重に持たない（先に入る lane が置く、packet の申し送り） | MNT-01-D10 の行 |

## Negative Paths

- missing input: 空の `selected_path` / `backup_path` は `validation`。PC の中に backup が無ければ `NoLocalBackup`。
- invalid input: 取外し可能でない drive は `NotRemovable`。`medium_id` か `label` の読めない目印は作り直す。`format` が 1 でない状態の file は `StateUnreadable`。
- duplicate/ambiguous input: 同じ `medium_id` の媒体が 2 本見えれば両方へ写す。同じ名前の写しが既にあれば写さない。
- unknown reference: 目印の `medium_id` が状態に無い媒体には書かない。
- dependency missing: 媒体が見えない（`MediumMissing`）、空の読取り機（P3、黙って飛ばす）。
- permission/write failure: 媒体の空きなし（`StorageFull`）、書込み禁止の媒体（`Io`）、状態の file の書込みの失敗（写しは残る）。
- dry-run side effect: `offsite_status` と `inspect_backup` は書かない（MNT-01-D9 の行、MNT-01-D8 状態の行）。

## Boundary Checks

- threshold: `OFFSITE_STALE_DAYS` = 3（2 日前は古くない、3 日前は古い）。`OFFSITE_KEEP` = 30（31 本目が消える）。
- null/default: `last_success` が無い → `stale = true`（用意の後）。状態の file が無い → `prepared = false`、`stale = false`。
- empty/non-empty: 媒体の `InventoryBackup\` が空（用意の直後）。
- min/max: 版 = `app_max_version()` は戻せる、`+ 1` は止める。
- status/policy enum: `OffsiteCheckResult` の 5 値、`OffsiteFailureKind` の 6 値の wire の snake_case。
- wire type: `BackupInspection`・`OffsiteBackupStatus` の optional field は bindings で `null` を許す。
- internal type: 目印・状態の JSON は wire に出さない。
- producer/consumer: MNT → CMD → bindings → UI-11b・UI-00。
- round-trip token: file picker の path がそのまま `inspectBackup` と `restoreBackup` に渡る。
- precision/range: 日時の文字列、日数・件数・版は小さい整数。
- cross-language parse: 日時の文字列を UI が和式に整える（既存の `BackupInfo.created_at` と同じ形）。

## Compatibility Checks

- old schema/input: 既存の backup の file（正式名、`VACUUM INTO` 製）はそのまま一覧・復元・写しの対象。作業名の file は今は存在しない。
- new schema/input: DB の schema は変えない。DB の外に `offsite-backup.json`、媒体に `InventoryBackup\offsite-medium.json`。
- output order: 媒体の写しは名前（日時）の新しい順で掃除する。
- optional field behavior: `BackupInspection.product_count`・`last_operation_at` は取れないとき `null`（確かめの結果を変えない）。

## Data Safety Checks

- source-derived data: test の DB・控え・目印・状態の file はすべて合成。実 DB・実 backup・実 USB の中身を fixture にしない。
- generated outputs: bindings の再生成だけ。
- secrets: 無し。
- local-only files: L3 で作った媒体の中身・別の PC に戻した店のデータは repo に入れない。
- synthetic sample boundaries: レジの SD は一時 dir の `CASIO\SR500_550_4000` で模す。

## Main Wiring / Integration Checks

- helper connected to main path: `RootLayout.tsx:48` の `useAutoBackupCheck` から `checkOffsiteBackup` まで（UI-11b-D16 の hook の行）。
- output reaches manifest/report: `check_offsite_backup` の成功が `offsite-backup.json` の `last_success` に入り、`get_offsite_backup_status` から画面とホームへ届く（MNT-01-D8 写しの行と UI-00-D12 の行）。
- effective config reaches runtime: `backup_path` の設定が写す元の `backup_dir` になる（43 §43.8.3）。
- CLI arg reaches implementation: 該当なし（CLI なし）。

## Mutation-style Adequacy Questions

- mock の値を設計の例と違えたとき: card とホームの日数・札の名前は mock に設計の例（3 日・控え 1）と違う値（5 日・控え 2）を使い、表示が mock から来たことを確かめる（UI-11b-D14・UI-00-D12 の行）。
- invalidate の順: `checkOffsiteBackup` の `copied` の後に status が invalidate され、停止の前に始まった結果は捨てる（UI-11b-D16 の行）。
- 分岐を反転したとき: `stale` の条件を反転すると UI-00-D12 の行と 3 日の境界の行が落ちる。
- 閾値の比較を変えたとき: `>=` → `>` で 3 日の境界の行が落ちる。保持の 30 → 31 で保持の行が落ちる。
- guard を消したとき: MNT-01-D10 の判定を消すと 2 つの D10 の行が落ちる。目印・状態の照合を消すと「目印の無い媒体」の行が落ちる。読み戻しの比較を消すと照合の行が落ちる。
- 出力の field を消したとき: `last_success.sha256` を消すと写しの成功の行が落ちる。
- 出力の順を変えたとき: 保持の並びを古い順にすると保持の行が落ちる。
- dry-run が副作用を持ったとき: `inspect_backup`・`offsite_status` が書くと前後の比較の行が落ちる。
- JSON の数が JS の安全な整数を超えたとき: 該当なし（日数・件数・版は小さい）。
- 状態の token を browser と往復したとき: file picker の path の往復（UI-11b-D15 の 2 つ目の行）。

## Residual Test Gaps

- Windows の drive の種類の判定（P1）・空の読取り機（P3）・実 USB の抜き差しと drive 文字の変化は自動 test で通さない（Windows の L3、68 UI-11b-L3-6〜9）。
- 読み戻しが file cache から返るか（P2）は test しない（保証の範囲を狭めた）。
- 3 日の知らせ・新しすぎる版の控えの実機の目視は L3 Eligibility の条件 (3) に当たり、自動 test と runtime の lane の human visual confirmation（試しの DB と状態の file を用意して画面を見る）で扱う。
- 通しの演習（別の PC での復元）は運用の手順で、test にしない（71 §71.13）。
