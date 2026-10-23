# Test Design Matrix: PC の外の控えの runtime (b)（USB メモリへ自動で写して確かめ、画面とホームに出し、選んだ控えを確かめる）

Plan Packet: [2026-10-23-backup-offsite-runtime-b](../2026-10-23-backup-offsite-runtime-b.md)。出発点は design の Matrix（[2026-10-07-backup-offsite](../../archive/plans/test-matrices/2026-10-07-backup-offsite.md)）の (b) に当たる 50 行で、test 名はそこから引き継ぐ（`req901` と決定 ID を含める、71 §71.10 の D-114 の追加の表）。本 packet の起票で足した行には「(b) で足した」と書いた。oracle は設計正本（71 §71.11、43 §43.8.2〜§43.8.4・§43.8.6・§43.8.7、68 UI-11b-D14〜D16・§68.4・§68.9・§68.10、53 UI-00-D12）から取り、実装から写さない。(a) の行（MNT-01-D7・D9・D10 の PC の中の側、UI-11b-D15 の一覧の行の入口、§68.4 手動バックアップ手順 4）は (a) の Matrix（`docs/plans/test-matrices/2026-10-23-backup-offsite-runtime-a.md`、(a) の branch）が持ち、(b) は回帰で回す。

## Risk

Risk: R4

## Contracts Under Test

- MNT-01-D8: 目印と PC 側の状態の両方で見分けた取外し可能な媒体の `InventoryBackup\` へ、1 回の確認の中は volume の識別に固定して、共有の検査（71 §71.12 の「使える控え」）に通った最新の backup を作業名へ写し、読み戻しの SHA-256 で照合してから上書きしない公開で正式名にする。媒体ごとに新しい 30 本を残す。状態は DB の外。最後に写せた日（写した控えの日付の方が古ければその日付）から 3 日以上で `stale`。成功の記録の置き換えの後の親 directory の sync の失敗は成功のまま（本 packet の commit で決めた、71 §71.11.4 のエラーの表）。
- MNT-01-D10（媒体の側）: root に `CASIO\SR500_550_4000` がある媒体を用意しない・写さない。
- 43 §43.8.2〜§43.8.4・§43.8.6・§43.8.7: 5 command は MNT を呼ぶだけで（§43.8.6 は先に §43.6 と同じ backup の作成と写像）、DB の Mutex を写す前に放し、`#[tauri::command(async)]` で、失敗を `validation` / `internal` の固定の文へ写す。
- UI-11b-D14: card の状態の文と原因の文（(5) は `attached` で 2 つ、本 packet の commit）、副情報、3 つの button、作り直しとやめるの流れ、取り直した status で決める表示。
- UI-11b-D15（file の入口）: 「控えを選んで確かめる」で選んだ file が (a) の停止・確かめ・詳細・復元の流れに同じ path で入る。作成日時が取れない file は file 名を出す（本 packet の commit の §68.9）。
- UI-11b-D16: 共通の確認の同じ回の中で `checkAutoBackup` の後に `checkOffsiteBackup`、mount で 1 回、結果の種類に依らず status を invalidate、停止と世代番号を共有、失敗は連続の最初の 1 回だけ toast。
- UI-00-D12: ホームは `stale = true` のときだけ、card と同じ順と文（「バックアップ画面の」を付ける）で知らせ、計算しない。
- Rollback: (b) の file は前の版が読む場所の外か、検査済みの規約の名前の正式名だけ。

## Failure Modes

- drive 文字の変化で、レジの SD・目印の無い媒体・別の PC で用意した媒体に書く。探した後に抜かれ、同じ文字に割り当たった別の媒体に書く。新しい版の目印を作り直す。
- 写した file を読み戻さずに成功とする。照合の失敗の file が正式名で残る。壊れた・空の・このアプリのものでない写す元を写す。
- 媒体の上の掃除が、今写した file・目印・規約外の file を消す。久しぶりに差した媒体の古い控えを日付で一度に消す。
- 状態の file が壊れたときに黙って `NotPrepared` になる。媒体が見えないときに `last_success` を消す・変える。作り直し・やめるの途中の失敗で記録や再試行の入口を失う。
- 成功の記録を置き換えた後の sync の失敗で、card が成功の日時と失敗の文を並べる（design の packet の closeout の申し送り (b)）。
- 用意済みの媒体が差してあるのに「USB メモリが差してあるか確かめてください」を出す（申し送り (a)）。
- 共通の確認が復元の間（控えの確かめの開始から）に写す・掃除する。古い世代の結果で status を invalidate する。媒体が抜けているだけで毎分 toast を出す。抜き差しの後に差してある媒体の表示が変わらない。
- 媒体の `InventoryBackup` の reparse point を追って、PC の中や別の媒体に書く・消す。規約外の多バイトの名前で媒体の写しの並びが panic する。command を main thread で動かして写しの間に画面が固まる。写す間 DB の Mutex を持つ。
- ホームが用意の前・やめた後に知らせる。3 日の境界がずれる。原因が PC の中の backup・記録・空きなのに USB の文を出す。
- 選んだ file が復元の流れに入らない・別の path で戻す。作成日時が取れない file で日時を作り出す。アプリの今の DB を選んだときに DB を失う。

## Test Matrix

- 既存の test を回帰の証跡に挙げる前に `rg` で実在を確かめる（下の Adjacent Pattern Audit の既存は 2026-10-23 に `eed07d37` で確かめた名前。(a) の test は (a) の merge の後に確かめる）。
- 媒体の発見は root の列を受ける内部関数に一時 directory を渡して通し、production と test で別の判定を作らない（71 §71.11.3）。drive の種類の判定（`GetDriveTypeW`）は L3-b1〜L3-b3 で確かめる。
- 写しの失敗の注入は、(a) が共有した file 操作の trait（restore の `RestoreFileOps` と同じ形、`publish_no_replace` を含む）に (b) が足す操作で行う（copy・`sync_all`・上書きしない公開・親 directory の sync・読み戻しの bytes・目印の読み直し・状態の file の置き換え）。差し替えは呼ばれた操作の順を記録し、`sync_all` や親 directory の sync を省くと順の oracle で red になる（正常系の結果だけでは省いても green になるため）。
- 時刻と今日の日付は注入できる形にする（3 日の境界・同じ秒の退避名の case のため）。
- 原因の文の行（UI-11b-D14・UI-00-D12）の mock の status は、どれも `prepared = true`・`stale = true` を前提にする（原因の文は `stale = true` のときだけ出る。design の packet の closeout の申し送り (c)）。`stale = false` と用意の前の行は別に置く。
- mock の日数・札は設計の例（3 日・控え 1）と違う値（5 日・控え 2）を使い、表示が mock から来たことを確かめる。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| MNT-01-D10 / D8 | 用意・写しがレジの SD に書く | unit（root の列に `{tmp}/sd/CASIO/SR500_550_4000` を置いた root を渡す） | `test_offsite_req901_d10_prepare_and_copy_refuse_register_sd_root` | §71.11.2 手順 3・§71.11.3 の判定を消す（SD を模した root の一覧と bytes が前後で同じでない、用意が `OffsiteError::RegisterSd` でない、`sd_folder` が見つけた path でない） |
| MNT-01-D8 用意 | 取外し可能でない drive を用意する | unit（drive の種類を返す関数を差し替え） | `test_prepare_offsite_req901_d8_rejects_non_removable` | 手順 2 を消す（`NotRemovable` でない、何か書く） |
| MNT-01-D8 用意 | 既存の目印を作り直して `medium_id` が変わる・写しを消す | unit | `test_prepare_offsite_req901_d8_reuses_existing_marker_and_keeps_copies` | 読める目印を書き換える、folder を作り直す |
| MNT-01-D8 用意 | 新しい版の目印を古い版が作り直す | unit（`format: 2` で `label` の形を変えた目印、`medium_id` だけの `format: 2` の目印） | `test_prepare_offsite_req901_d8_unknown_marker_format_is_refused` | `format` が 1 でないのに目印を書き換える（目印の bytes・folder・状態が前後で同じでない）、`MarkerUnsupported` でない |
| MNT-01-D8 用意 | 札が重なる | unit（状態の `media` が「控え 2」だけ） | `test_prepare_offsite_req901_d8_label_is_max_plus_one` | 新しい札が「控え 2」になる（数 + 1）。期待は「控え 3」 |
| MNT-01-D8 用意・状態 | 目印・状態の公開の永続化を省く | unit（注入、操作の記録） | `test_offsite_req901_d8_marker_and_state_publish_order` | 記録が `write` → `sync_file` → `replace` → `sync_parent` の順でない |
| MNT-01-D8 用意 | 状態が読めないのに上書きして媒体の一覧を失う・媒体に目印だけ書く | unit（目印の無い媒体 + 壊れた状態の file） | `test_prepare_offsite_req901_d8_state_unreadable_writes_nothing` | 手順 3a を手順 4 の後に置く（媒体に `InventoryBackup` か目印ができる）、壊れた状態の file を新しい内容で上書きする、`StateUnreadable` でない |
| MNT-01-D8 用意 | PC 側の状態の file の空き不足を USB メモリの空き不足と伝える | unit（注入: 手順 5 の状態の file の作業名の書込みで `StorageFull`） | `test_prepare_offsite_req901_d8_state_write_full_is_io` | 結果が `OffsiteError::Io` でない |
| MNT-01-D8 用意 | `InventoryBackup` の reparse point を追って PC の中・別の媒体に書く | unit（媒体の root の `InventoryBackup` を別の一時 directory への symbolic link にする。目印の file だけを link にする case も） | `test_prepare_offsite_req901_d8_redirected_inventory_dir_is_refused` | 手順 3b を消す（転送先の folder に目印・写しができる）、`Redirected` でない |
| MNT-01-D8 写し | 用意の前・媒体が見えないときに書く・`last_success` を変える | unit | `test_check_offsite_req901_d8_not_prepared_and_medium_missing_write_nothing` | 手順 1・3 の後に書く（状態の file の bytes と媒体の一覧が前後で同じでない） |
| MNT-01-D8 写し | 目印の無い媒体・別の PC で用意した媒体に書く | unit（root の列に、目印なし・未登録の `medium_id` の 2 つ） | `test_check_offsite_req901_d8_ignores_unmarked_and_foreign_media` | §71.11.3 の目印・状態の照合を消す |
| MNT-01-D8 写し | 成功で正式名・`last_success`（hash）が残らない | unit | `test_check_offsite_req901_d8_copy_publishes_verified_copy_and_records_success` | 正式名・`last_success.sha256`（元の file の SHA-256 と一致、oracle は test が別に計算）が無い |
| MNT-01-D8 写し | 壊れた・空の・このアプリのものでない写す元を「写せた」にする | unit（PC の中の最新の正式名に、page を壊した DB・0 byte の file・別用途の表だけの DB の 3 つ） | `test_check_offsite_req901_d8_unverified_source_is_not_copied` | 手順 3a を消す（媒体に正式名ができる・`last_success` が変わる）、`last_failure.kind` が `source_unverified` でない |
| MNT-01-D8 写し（(b) で足した） | 写す元の path の文字で検査が開けず、写せない | unit（`backup_dir` を `{tmp}/a#b%c` のように `#` と `%` を含む名前の folder にし、正式名 1 本と用意済みの媒体 1 つ） | `test_check_offsite_req901_d8_source_path_with_uri_chars_is_inspected` | 手順 3a が共有の `inspect_backup`（71 §71.12 手順 1 の符号化。(a) の `test_inspect_backup_req901_d9_uri_escapes_path_chars` が符号化そのものを持つ）を通らず、独自に URI を組むか path をそのまま `file:` に付ける（`Copied` でなく `source_unverified` になる） |
| MNT-01-D8 写し | 写す元の一覧の失敗を「backup が無い」にする・媒体に書く | unit（注入: `list_backups` の `Err`、用意済みの媒体 1 つ） | `test_check_offsite_req901_d8_source_list_error_is_io` | 結果が `OffsiteError::Io` でない（`NoLocalBackup` に倒す）、`last_failure` が `{ kind: io, medium_id: None }` でない、媒体の一覧と bytes・`last_success` が前後で同じでない |
| MNT-01-D8 写し | 公開の前の失敗（写す途中の抜去・`Io`・`StorageFull`）で成功にする・残りが溜まる | unit（注入: copy の途中・`sync_all`・公開そのものの各点で `Io`、copy で `StorageFull`） | `test_check_offsite_req901_d8_interruption_before_publish` | 各点で: 正式名がある、`last_success` が前後で同じでない、`last_failure.kind` が `io` / `storage_full` でない、次の呼出しで作業名が消えて写り直さない（手順 4b → `Copied`） |
| MNT-01-D8 写し | 公開の後の失敗（親 directory の sync）で正式名を消す・成功を記録する・写し直す | unit（注入: 公開の後の親 directory の sync で `Io`） | `test_check_offsite_req901_d8_interruption_after_publish` | その回: 検査済みの正式名が残らない、`last_success` が変わる、`last_failure.kind` が `io` でない。次の呼出し: `UpToDate` でない、`last_success` が変わる。その後に新しい backup を PC の中に置いた呼出しで `Copied` と `last_success` の更新が無い |
| MNT-01-D8 写し（(b) で足した） | 成功の記録を置き換えた後の sync の失敗を失敗として返し、画面が成功と失敗を並べる | unit（注入: 手順 5 の成功の記録の状態の file の置き換えの後の親 directory の sync で `Io`） | `test_check_offsite_req901_d8_success_record_sync_failure_stays_copied` | 結果が `Copied` でない（`OffsiteError::Io` を返す）、状態の file が成功の記録（`last_success.file_name` が今回の file、`last_failure = None`）で読めない、`tracing::warn!` を出さない。対の case: 置き換えそのものの失敗の注入では `OffsiteError::Io` で状態の file の bytes が前後で同じ（置き換えの前の失敗は今までどおり） |
| MNT-01-D8 写し | 探した後に入れ替わった媒体へ書く | unit（注入: 照合の後、copy の直前・公開の直前に目印の `medium_id` を別の値に替える） | `test_check_offsite_req901_d8_medium_swap_after_discovery_writes_nothing` | 目印の読み直しを消す（入れ替わった媒体に作業名・正式名ができる・掃除で消える）、`last_failure.kind` が `io` でない |
| MNT-01-D8 写し | 媒体の上の reparse point を追う | unit（(1) 用意済みの媒体の `InventoryBackup` を別の一時 directory への symbolic link に替える、(2) `InventoryBackup` の中に、転送先の file を指す正式名の名前の symbolic link と、規約に合う作業名の名前の symbolic link を置く） | `test_check_offsite_req901_d8_reparse_points_are_not_followed` | (1) 転送先に作業名・正式名ができる、媒体を用意済みと数える。(2) link を写し済みと数えて `UpToDate` になる、掃除・作業名の掃除で転送先の file が消える・変わる |
| MNT-01-D8 写し | 公開が媒体の既存の正式名を上書きする | unit（同じ名前で size の違う正式名を媒体に置く） | `test_check_offsite_req901_d8_publish_does_not_replace_existing_copy` | 既存の bytes が変わる、`Io` でない |
| MNT-01-D8 写し | 媒体の作業名の掃除が別用途の `*.partial` を消す | unit（媒体に `unrelated.partial` と規約に合う作業名） | `test_check_offsite_req901_d8_removes_only_conforming_partial` | 手順 4b を `*.partial` の glob で消す（前者が消える）、規約に合う作業名を消さない |
| MNT-01-D8 照合 | 読み戻しの不一致を成功にする | unit（読み戻しの bytes を 1 byte 変える注入） | `test_check_offsite_req901_d8_verify_mismatch_removes_partial_and_records_failure` | 手順 4e の比較を消す、作業名を公開する、`last_failure.kind` が `verify_mismatch` でない |
| MNT-01-D8 写し | 同じ file を毎回写す | unit | `test_check_offsite_req901_d8_up_to_date_skips_copy` | 手順 4a を消す（2 回目の呼出しで `UpToDate` でない、媒体の file の更新時刻が変わる） |
| MNT-01-D8 保持 | 今写した file・規約外の file を消す、30 本を超えて残す | unit（case 1: 31 本の正式名 + 目印 + 規約外の 1 file。case 2: 今写す file より名前の新しい正式名を 30 本置く〈PC の時計が遅れた場合〉） | `test_check_offsite_req901_d8_retention_keeps_newest_and_foreign_files` | case 1: 掃除の数・並び・対象の判定がずれる（30 本・目印・規約外の file が残り、最も古い 1 本だけが消える）。case 2: 「今写した file は消さない」の除外を消す |
| 71 §71.3（媒体の側、(b) で足した） | 規約外の多バイトの名前で媒体の写しの並び・掃除が panic する | unit（媒体の `InventoryBackup` に `inventory_backup_あああああ.db` と `inventory_backup_あああああ.db.partial`〈どちらも stem が 15 bytes〉を置く） | `test_check_offsite_req901_d8_multibyte_names_on_medium_do_not_panic` | 写しの並び・保持の掃除・作業名の掃除が (a) の直した名前の解析でなく独自の slice を使う（panic する）。期待: panic せず、その名前を無視し、写しは `Copied`、2 つの file は消えない |
| MNT-01-D8 状態 | 状態の file の破損で黙って止まる | unit | `test_offsite_status_req901_d8_state_unreadable_is_stale_not_unprepared` | `offsite_status` が破損を `prepared = false` にする（期待は `prepared = true`・`stale = true`・`last_failure_kind = state_unreadable`） |
| MNT-01-D8 状態 | 写す元の古さを USB の原因と見分けない | unit（today を渡す。`backup_dir` の最新の正式名が 10 日前・2 日前・3 日前・無い・一覧が `Err` の 5 つ） | `test_offsite_status_req901_d8_local_backup_old` | `local_backup_old` が 10 日前・3 日前・無いで `true`、2 日前・一覧の `Err` で `false` でない。`stale` の値が `local_backup_old` で変わる |
| MNT-01-D8 状態 | 3 日の境界がずれる | unit（today を渡す） | `test_offsite_status_req901_d8_stale_boundary_three_days` | `>=` を `>` にする（2 日前 = false、3 日前 = true、写せていない = true）。日数を写した日だけで数える（今日写した 10 日前の控えで `days_since_last_success = 10`・`stale = true` にならない） |
| MNT-01-D8 状態 | 状態を DB に置いて復元で巻き戻る | integration（`restore_backup` の前後で `offsite-backup.json` の bytes が同じ） | `test_restore_req901_d8_does_not_touch_offsite_state` | 状態を `app_settings` に置く、restore が app data の他の file を触る |
| MNT-01-D8 やめる | やめても写し・知らせが続く・媒体や PC の中の backup を消す・状態の file を消す | unit（状態の file が読める・壊れた・`format: 2` の 3 つ、目印と写しのある媒体 1 つ、`backup_dir` に正式名 2 本） | `test_stop_offsite_backup_req901_d8_sets_aside_state_and_keeps_media` | 退避の file（`offsite-backup.json.stopped-*`）の bytes が元と同じでない、状態の file が残る、`offsite_status` が `prepared = false`・`stale = false` でない、`check_offsite_backup` が `NotPrepared` でない、媒体の `InventoryBackup` の一覧と bytes・PC の中の backup の一覧が前後で同じでない。その後に同じ媒体を用意すると、目印の `medium_id` と札が同じで新しい backup が写る（`Copied`）でない |
| MNT-01-D8 やめる | 移せないのに状態を失う | unit（注入: 移す操作の失敗、同じ秒の退避名を先に置く case） | `test_stop_offsite_backup_req901_d8_failure_keeps_state` | `StopFailed` でない、状態の file の bytes が元のままでない |
| MNT-01-D8 やめる | 移した後の親 directory の sync の失敗を「元のまま」と扱う | unit（注入: 手順 3 の移動の後の `sync_parent` で `Io`） | `test_stop_offsite_backup_req901_d8_sync_failure_after_move` | `StopFailed` でない、状態の file が元の名前にある、`offsite_status` が `prepared = false` でない |
| MNT-01-D8 作り直し | 読めない記録を消す・上書きする・画面から直せない | unit（壊れた JSON の状態の file、目印のある媒体 1 つ、`backup_dir` に媒体に無い新しい正式名） | `test_reset_offsite_state_req901_d8_sets_aside_and_reregisters` | 退避の file（`offsite-backup.json.unreadable-*`）の bytes が元と同じでない、状態の file が新しい内容に置き換わらない（`medium_id`・`label` が目印と違う）、結果が `Copied` でない、`last_success` が書かれない |
| MNT-01-D8 作り直し | 新しい版のアプリの記録を退避・上書きする | unit（`format: 2` の状態の file） | `test_reset_offsite_state_req901_d8_unsupported_format_is_untouched` | `StateUnsupported` でない、状態の file の bytes・app data の一覧が前後で同じでない |
| MNT-01-D8 作り直し | 媒体が 0 本で作り直して知らせが消える | unit（壊れた状態の file、目印のある媒体なし） | `test_reset_offsite_state_req901_d8_no_medium_changes_nothing` | `NoMediumAttached` でない、状態の file の bytes・app data の一覧が前後で同じでない、`offsite_status` が `prepared = true`・`stale = true`・`state_unreadable` のままでない |
| MNT-01-D8 作り直し | 途中の失敗で知らせと再試行の入口を失う | unit（注入: 手順 4 の作業名の書込み・`sync_all`、手順 5 の copy・`sync_all`・親 directory の sync、手順 6 の置き換えそのものの各点で失敗。同じ秒の退避名を先に置く case も） | `test_reset_offsite_state_req901_d8_failure_keeps_unreadable_and_retry_recovers` | 置き換えより前の各点で: `StateResetFailed` でない、状態の file の bytes が元のままでない、`offsite_status` が `state_unreadable` でない。注入を外した押し直しで `Copied` と媒体の登録に戻らない。前回の作業名が残っていても押し直しが成功しない |
| MNT-01-D8 作り直し | 置き換えの後の失敗を「元の読めない記録のまま」と扱う | unit（注入: (1) 手順 6 の置き換えの後の親 directory の sync で `Io`、(2) 手順 7 の写しの copy で `Io`。壊れた状態の file と目印のある媒体 1 つ） | `test_reset_offsite_state_req901_d8_failure_after_replace_reports_readable_state` | (1) `StateResetFailed` でない、状態の file が新しい内容でない、`offsite_status` が `prepared = true`・`stale = true`・`last_failure_kind = None` でない。(2) 結果が `OffsiteError::Io` でない、`offsite_status` の `last_failure_kind` が `io` でない、退避の file が残らない |
| MNT-01-D8 作り直し（本 packet の commit で期待を直した） | 手順 7 の中で成功の記録を置き換えた後の sync の失敗を、失敗として返す | unit（注入: 手順 7〈§71.11.4 手順 5〉の成功の記録の状態の file の置き換えの後の親 directory の sync で `Io`。壊れた状態の file、目印のある媒体 1 つ、`backup_dir` に媒体に無い新しい正式名） | `test_reset_offsite_state_req901_d8_step7_state_sync_failure_stays_copied` | 結果が `Copied` でない（design の Matrix の旧い期待 `OffsiteError::Io` のまま）、`offsite_status` が `stale = false`・`last_failure_kind = None`・`last_success_at` が今回の写しの日時でない |
| Rollback（(b) で足した） | (b) の file が前の版の一覧・掃除・今日の判定に掛かる | unit（用意・写し・作り直し・やめるを一時 directory で通した後の `app_data_dir`・`backup_dir`・媒体の file の一覧） | `test_offsite_req901_d8_files_outside_previous_version_paths` | 状態・退避・作業名・目印が `backup_dir` に置かれる、媒体の file のうち §71.3 の規約の名前に合うものが検査済みの正式名以外にある（作業名が `.db` で終わる等） |
| 43 §43.8.2〜§43.8.7 | 失敗の写像が message の文字列に依る・kind を足す | unit（CMD） | `test_offsite_cmd_req901_maps_errors_to_fixed_kinds` | `RegisterSd` の文が `sd_folder` の path を含まない、`StopFailed`・`StateResetFailed` の文が記録の状態を断言する、`NotRemovable` / `RegisterSd` / `MarkerUnsupported` / `Redirected` / `StateUnsupported` / `NoMediumAttached` が `validation` でない、ほかの 7 つ（`StateResetFailed`・`StopFailed` を含む）が 43 の表の `internal` でない、空の `selected_path` が `validation` でない、`CmdErrorKind` に値が増える |
| 43 §43.8.6 | 作り直しで backup を作らずに「まだ写せていません」が残る・作成の失敗で記録に触れる・作成の失敗の文が手動の backup と違う | integration（CMD、壊れた状態の file と目印のある媒体。媒体には PC の中の最新と同じ名前・size の写しを先に置く。作成の失敗は保存先の祖先に `CASIO/SR500_550_4000` を置く case） | `test_reset_offsite_cmd_req901_creates_backup_before_reset` | 作り直しの後の結果が `Copied` でない（新しい backup を先に作らない）。作成の失敗の case で、状態の file の bytes が前後で同じでない（MNT を呼ぶ）、`CmdError` が §43.6 の `RegisterSd` の固定の文・`validation` でない（写像を二重に書いて食い違う） |
| 43 §43.8.3 | 写す間 DB の Mutex を持つ | integration（写しの途中で別の command が DB を読める。注入で copy を止めて確かめる） | `test_check_offsite_cmd_req901_releases_db_lock_before_copy` | CMD が lock を持ったまま MNT を呼ぶ |
| 43 実行の thread | 写し・照合・drive の列挙を main thread で動かして画面が固まる | source の検査（`syn` で `cmd/settings_cmd.rs` を読む。`syn` は既存の dev-dependency） | `test_offsite_cmds_req901_run_off_main_thread`（(a) の `test_inspect_backup_cmd_req901_runs_off_main_thread` に 5 command を足す形でもよい） | 5 command（`prepare_offsite_medium`・`check_offsite_backup`・`get_offsite_backup_status`・`reset_offsite_state`・`stop_offsite_backup`）の attribute が `#[tauri::command(async)]` でない（`async fn` でもない） |
| UI-11b-D15 隣接（(b) で足した） | file の入口でアプリの今の DB を選び、復元で DB を失う | integration（MNT の `restore_backup` に `backup_path` = 今の DB の path を渡す） | `test_restore_req901_d15_live_db_path_keeps_current_db` | 今の DB の行が復元の前後で同じでない、`RestoreError::Recovered` 以外を返す、退避・manifest の遺物が残る。red なら implementing で止め、design（file の入口で今の DB の path を止める）へ戻す（restore の契約は変えない） |
| UI-11b-D14（状態の文と原因の文） | 状態の文が設計とずれる、(5) が差してある媒体でも USB の確認の文を出す | unit（`offsite-status-text.test.ts`。status の組み合わせ表を入力にする。原因の行の status は `prepared = true`・`stale = true`） | 用意の前・写せた後（日時は mock の値、札は「控え 2」）・まだ写せていない・(1)〜(4)・(5) の `attached` が空・(5) の `attached` が空でない・`last_success_at` が無いときの前半、ホームの形（「バックアップ画面の」を付ける）の各文が設計の文と完全一致 | 文言・日数・札が設計の文と違う。(5) で `attached` が空でないのに「USB メモリが差してあるか確かめてください」を出す（本 packet の commit の文）、(5) の文が札を名指す、原因の順が設計と違う、`stale = false` で原因の文を出す、UI が日数を計算する（mock の `days_since_last_success = 5` と `last_success_at` の日付が食い違う入力で、出す日数が 5 でない） |
| UI-11b-D14 | card の表示が状態とずれる | component（`OffsiteBackupPanel.test.tsx`） | 用意の前（「PC の外の控えをやめる」が無い）・用意の後（ある）・差してある媒体の副情報（「差してある控え: 控え 2」／「用意した USB メモリが差さっていません」）・`last_failure_kind` の固定の文の副情報・`state_unreadable` で「記録を作り直す」・status の取得失敗で「PC の外の控えの状態を取得できませんでした」と再読込 | button が状態と合わない、副情報が無い、取得失敗で card 全体を消す |
| UI-11b-D14 | 読めない記録を画面から直せない | flow（`BackupRestorePage.flow.test.tsx`。mock の status が `state_unreadable`〈`prepared = true`・`stale = true`〉、`resetOffsiteState` は解決する promise） | 「記録を作り直す」を押すと `resetOffsiteState` が 1 回呼ばれ、status と backup list が invalidate され、成功の文が出る。失敗の mock（`NoMediumAttached`・`StateResetFailed`）でも status と backup list が invalidate され、固定の文が card に出る。card の原因の文と button は取り直した status で決まる: 取り直しの mock が `state_unreadable` なら残る、読める記録なら button が無く (1) 以外の原因の文 | button が無い、別の command を呼ぶ、失敗のとき invalidate しない、失敗の種類から button を出す |
| UI-11b-D14 | やめる操作が確認なしで走る・やめた後も知らせが残る | flow（`BackupRestorePage.flow.test.tsx`。mock の status が `prepared = true`） | 「PC の外の控えをやめる」を押すと確認の AlertDialog が出て、「キャンセル」では `stopOffsiteBackup` を呼ばず、「やめる」で 1 回呼んで status を invalidate し、成功の文と用意の前の文が出る。backup list の query を invalidate しない。`StopFailed` の mock でも status を invalidate し、取り直しの mock が `prepared = true` なら button が残り、`prepared = false` なら用意の前の文で button が無い。`state_unreadable`・`NoMediumAttached` の mock で、card が「記録を作り直す」と「PC の外の控えをやめる」の 2 つを名指す | 確認なしで呼ぶ、キャンセルで呼ぶ、invalidate しない、2 つの直し方の片方しか出さない |
| UI-11b-D14・§68.4 | 用意の途中の失敗の後に card が実の状態と食い違う | flow（`BackupRestorePage.flow.test.tsx`） | `prepareOffsiteMedium` の成功・失敗の mock のどちらでも status が invalidate される。directory picker の cancel では呼ばない。成功は「控え 2 を PC の外の控えの保存先にしました」（mock の札） | 成功のときだけ invalidate する、cancel で呼ぶ |
| UI-11b-D15（file の入口） | 選んだ file が復元の流れに入らない | flow（`BackupRestorePage.flow.test.tsx`。file picker の mock が `E:\InventoryBackup\inventory_backup_20991231_235959.db` の形の path を返す） | 選び終えると (a) の停止と待ちの後に `inspectBackup` に同じ path が渡り、戻せる控えの詳細の後の事前バックアップと `restoreBackup({ backup_path })` にも同じ値が渡る。picker の cancel では `inspectBackup` も停止も呼ばない | 一覧の `BackupInfo` しか受けない、別の path を渡す、cancel で止める |
| UI-11b-D15・§68.9（(b) で足した） | 作成日時が取れない file で日時を作り出す | component（`BackupRestorePage.test.tsx`。mock の `inspectBackup` が `created_at = null`・`file_name = "inventory.db"`） | 詳細の見出しと復元実行 button が「inventory.db の控えに戻す」の形で file 名を出し、日時（`Invalid Date`・`1月1日 0:00` 等）を出さない | `created_at` が `null` のときに日時の整形を呼ぶ、空の label を出す |
| UI-11b-D15・D16 | 確かめ・詳細・最終確認の間に 60 秒の確認の掃除が選んだ控えを消す | flow（`BackupRestorePage.flow.test.tsx` と `useAutoBackupCheck.test.tsx`。mock の `checkOffsiteBackup` を解決しない promise で止めておく） | 控えを選ぶ（一覧の行と file の入口の両方）と、(a) の停止が `inspectBackup` の前に効き、実行中の回（`checkAutoBackup` の後の `checkOffsiteBackup`、または mount の 1 回の `checkOffsiteBackup`）の解決を待ってから `inspectBackup` を呼ぶ。止めている間は interval が進んでも `checkAutoBackup`・`checkOffsiteBackup` を呼ばない。file の入口の詳細で最終確認の「キャンセル」を押しても再開しない（`restore_detail` へ戻るだけ）。復元の card の「閉じる」（(a) の部品）で `ready` へ戻ると再開し、次の tick で `checkOffsiteBackup` が呼ばれる（短い確かめの (1) → 閉じる → (2)、71 §71.13）。復元の結果・unmount の扱いは (a) の行のまま | 待つ対象が `checkAutoBackup` だけ（実行中の `checkOffsiteBackup` を待たずに `inspectBackup` を呼ぶ）、mount の 1 回を `inFlight` に入れない（待たない）、止めている間に `checkOffsiteBackup` を呼ぶ、「キャンセル」で再開する |
| UI-11b-D16 | 復元の間に写す・古い結果で invalidate する・順が逆 | hook（`useAutoBackupCheck.test.tsx`、実物の hook） | 停止中は `checkOffsiteBackup` を呼ばない、停止の前に始まった結果を捨てる、`checkAutoBackup` の結果の後（成功・失敗の両方の case）に呼ぶ、mount で 1 回だけ呼ぶ（`checkAutoBackup` は mount で呼ばない、UI-11b-D13 のまま） | 世代番号・停止を共有しない、順が逆、`checkAutoBackup` の失敗のときに呼ばない、mount で呼ばない・毎 render 呼ぶ |
| UI-11b-D16 | 媒体なしで毎分 toast | hook | `medium_missing` で toast が無い、失敗は連続の最初の 1 回だけ toast「PC の外の控えを写せませんでした」（id `backup-offsite-error`）、失敗でない結果が返れば連続を解く | 結果ごとに toast を出す、成功の toast を出す |
| UI-11b-D16 | 抜き差しの後に差してある媒体の表示が変わらない | hook（`not_prepared`・`no_local_backup`・`medium_missing`・`up_to_date`・`copied`・失敗の 6 つ） | どの結果でも `queryKeys.backupRestore.offsiteStatus()` が invalidate される。世代番号が違って捨てた結果では invalidate しない | `copied` と失敗のときだけ invalidate する（`medium_missing`・`up_to_date` で red） |
| UI-00-D12 | 用意の前に知らせる・境界の判定をホームでする・原因の文がずれる | component（`HomePage.test.tsx`、実 hook + QueryClient。原因の行の mock は `prepared = true`・`stale = true`） | `prepared = false` と `stale = false` で Alert なし、`stale = true` で日数の文（mock の日数 5）と「バックアップ画面へ」の link（href `/settings/backup`）、写せていないときの文、`state_unreadable` で記録の文（「バックアップ画面の」の付いた 2 つの名指し）、やめた後〈`prepared = false`〉で Alert なし、`local_backup_old = true` で PC の中の backup の文、`source_unverified` でその文、`storage_full` で「USB メモリの空きが足りません」を続けた文、`io` で (5) の `attached` が空・空でないの 2 つの文、query 失敗で Alert なしと toast「PC の外の控えの状態を取得できませんでした」 | ホームが日数を計算する、`stale` 以外を見て出す、記録が読めないとき・写す元が古いとき・差してあるときに「USB メモリが差してあるか確かめてください」を出す、link が無い |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 媒体の写し | 無し | 媒体の作業名 `.partial` | 照合 → 上書きしない公開 → 正式名、`last_success`（置き換えの後の sync の失敗も成功のまま） | status の invalidate（UI-11b-D16） | 画面・ホームの status | 入れ替えで別の媒体（目印で見分ける） | mount の 1 回の確認で写す | 作業名を消し `last_failure`（公開の後の失敗は正式名を残す） | 60 秒後の確認 | MNT-01-D8 写しの行 |
| PC 側の状態の file | 無し（`NotPrepared`） | 作業名 → `sync_all` → 置き換え → 親 dir の sync | 用意で `media`、写しで `last_success` | — | `offsite_status` は毎回 file から | 復元で変わらない | そのまま残る | 読めない → `StateUnreadable`・`stale` | 画面の「記録を作り直す」（新しい版の記録は作り直さない）、または「PC の外の控えをやめる」 | MNT-01-D8 状態・作り直し・やめるの行 |
| card | status の query | `offsite_preparing` / `offsite_resetting` / `offsite_stopping` | 成功の文 + 取り直した status | 成功・失敗とも status（作り直しは backup list も） | status の再取得 | 画面へ戻るたび | — | 固定の文を card の中に。取得失敗は再読込 | 押し直し | UI-11b-D14 の行 |
| 復元の詳細（file の入口） | 未選択 | picker → (a) の停止と待ち → `restore_inspecting` | `restore_detail`（作成日時が取れなければ file 名） | — | 選び直すたびに確かめ直す | 復元の card の「閉じる」で `ready` へ戻って別の控え（確認が再開） | — | `restore_blocked` | 別の控えを選ぶ | UI-11b-D15 の file の入口の行 |
| 共通の確認 | mount（`checkOffsiteBackup` を 1 回） | 実行中の guard（(a) の実行中の回の promise） | 結果の種類に依らず status を invalidate | 世代番号が違えば捨てる | — | — | mount で 1 回 | 連続の最初の 1 回だけ toast | 60 秒後 | UI-11b-D16 の行 |
| ホームの知らせ | query | — | `stale` なら Alert | status の invalidate で消える | — | ホームへ戻るたび | mount の 1 回の確認の後 | query 失敗は Alert なし + toast | query の再取得 | UI-00-D12 の行 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 共通の確認の停止と世代番号（UI-11b-D13）と (a) の停止の待ち | `src/features/backup-restore/useAutoBackupCheck.ts` の `suspended`・`generation`・`suspendAutoBackupCheck`・`resumeAutoBackupCheck`、(a) の `suspendAutoBackupCheckAndWait`、`BackupRestorePage.tsx` の停止・再開の呼出し | `checkOffsiteBackup` は同じ interval の同じ回の中で、同じ guard・停止・世代番号・実行中の回の promise を使う（UI-11b-D16） | 別の interval を張らない（UI-11b-D16 の棄却案） | UI-11b-D16・D15・D16 の行。既存の `useAutoBackupCheck.test.tsx` の停止の test を回帰で回す |
| 失敗の toast は連続の最初の 1 回（UI-11b-D13、id 付き） | `useAutoBackupCheck.ts` の `failing` と toast の id `backup-auto-check-error` | id `backup-offsite-error` で同じ形（別の連続の flag） | 成功の toast は写しに付けない（UI-11b-D16） | UI-11b-D16 の行 |
| ホームの独立 query と失敗時の沈黙 + toast（53 §53.5） | `src/features/home/HomePage.tsx` の `pluDirty`・`csvImports` の `isError` の effect と toast の id | status の query の失敗も Alert なし + toast（id を付ける） | 「誤検知より沈黙」の既存の判断を変えない | UI-00-D12 の行 |
| 作業名 → sync → rename → 親 dir の sync（restore の manifest、MNT-01-D5） | `src-tauri/src/mnt/restore.rs` の `write_manifest`・`StdRestoreFileOps` の `sync_parent`、(a) の backup の公開 | 媒体の写し、目印・状態の file | restore の manifest と reconcile は変えない | MNT-01-D8 の公開の順の行 |
| file 操作の失敗の注入（`RestoreFileOps`、(a) が共有） | `mnt/restore.rs` の trait・`StdRestoreFileOps`・`tests` の注入の型 | 写しの copy・sync・公開・読み戻し・置き換え・`create_new` の copy の注入 | 新しい trait を作らない（本番と test で別の判定を作らない） | MNT-01-D8 写し・照合・作り直しの行 |
| 規約の名前の解析（71 §71.3、(a) が直す） | `mnt/backup.rs` の `extract_datetime_from_backup`・`extract_date_from_backup` | 媒体の写しの並び・保持の掃除・作業名の掃除 | 独自の解析を書かない | 71 §71.3 の媒体の側の行 |
| レジの SD の folder 名（IO-09） | 29 §29.7（`CASIO\SR500_550_4000`）、(a) の `io/mod.rs` の定数か #172 の `io::register_sd` | 用意と探す規則の root の判定 | 文字列を二重に持たない | MNT-01-D10 / D8 の行 |
| 手動の backup の写像（43 §43.6、(a)） | `cmd/settings_cmd.rs` の `create_backup`（(a) の形） | §43.8.6 の作り直しの前の backup | 写像を二重に書かない（1 つの helper） | 43 §43.8.6 の行 |
| invalidate を直接呼んでよい file（D-052-S1） | `src/lib/invalidation-contract.static.test.ts` の `ALLOWED_DIRECT_CALL_FILES`（`BackupRestorePage.tsx`・`useAutoBackupCheck.ts` を含む） | status の invalidate はこの 2 file から | 新しい file（`OffsiteBackupPanel.tsx`・`OffsiteBackupWarning.tsx`・`useOffsiteBackupStatus.ts`）から invalidate しない。許可の一覧を変えない | AC4 の static test |
| CmdError の利用者向け表示（UI-ERR-D1） | `src/lib/describe-error.ts`、`src/lib/describe-error-adoption-sweep.test.ts` | card の失敗の文は `describeError` を通す | raw の message を直接出さない | AC4 の sweep test |
| `vi.mock("@/lib/bindings")` の既定 | `RootLayout.test.tsx`（`commands: { checkAutoBackup }`）、`HomePage.test.tsx`、`BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx`、`useAutoBackupCheck.test.tsx` | 新しい command の既定を足す（mount の 1 回の `checkOffsiteBackup`、ホームの `getOffsiteBackupStatus`） | hook の module を `vi.mock` で置き換える test（`OtherRecordDetailRoutes.test.tsx`・`app-router.test.tsx`）は (b) が export を足さないので変えない | AC4 |

## Negative Paths

- missing input: 空の `selected_path` は `validation`。PC の中に backup が無ければ `NoLocalBackup`。file picker の cancel は何もしない。
- invalid input: 取外し可能でない drive は `NotRemovable`。`format` が 1 で `medium_id` か `label` の読めない目印・JSON として読めない目印は作り直す。`format` が 1 でない目印は `MarkerUnsupported`。`format` が 1 でない状態の file は `StateUnreadable`（作り直しは `StateUnsupported` で退避もしない）。空の・別用途の DB は写す元なら `SourceUnverified`、選んだ file なら (a) の「読めない控え」。
- duplicate/ambiguous input: 同じ `medium_id` の媒体が 2 本見えれば両方へ写す。同じ名前・同じ size の写しが既にあれば写さない。同じ名前で size の違う正式名は上書きせず `Io`。同じ秒の退避名が既にあれば作り直しは `StateResetFailed`、やめるは `StopFailed`。PC の中の保存先と媒体の `InventoryBackup` が同じ folder（packet の J1。既定 B では code で止めない）。
- unknown reference: 目印の `medium_id` が状態に無い媒体には書かない。file の入口でアプリの今の DB を選んだとき（UI-11b-D15 隣接の行）。
- redirected input: 媒体の `InventoryBackup` か目印が reparse point なら用意は `Redirected`、確認はその媒体を用意済みとしない。`InventoryBackup` の中の reparse point の entry は開かず・数えず・消さない。
- dependency missing: 媒体が見えない（`MediumMissing`）、空の読取り機（黙って飛ばす、thread の error mode で dialog を抑える）。
- permission/write failure: 媒体の空きなし（`StorageFull`）、書込み禁止の媒体（`Io`、card とホームは (5) の差してある文）、状態の file の書込みの失敗（置き換えの前は `Io`、置き換えの後の sync は成功のまま）。
- dry-run side effect: `offsite_status` は書かない（MNT-01-D8 状態の行）。

## Boundary Checks

- threshold: `OFFSITE_STALE_DAYS` = 3（2 日前は古くない、3 日前は古い）。`OFFSITE_KEEP` = 30（31 本目が消える）。`local_backup_old` も 3 日。
- null/default: `last_success` が無い → `stale = true`（用意の後）。状態の file が無い → `prepared = false`、`stale = false`。`BackupInspection.created_at` が `null` → file 名を出す。
- empty/non-empty: 媒体の `InventoryBackup\` が空（用意の直後）。`attached` が空・空でない（(5) の 2 つの文）。
- min/max: 札の N は `media` の最大 + 1（「控え 2」だけなら「控え 3」）。
- status/policy enum: `OffsiteCheckResult` の 5 値、`OffsiteFailureKind` の 7 値の wire の snake_case、`OffsiteError` の 13 値の写像（43 の表）。
- wire type: `OffsiteBackupStatus` の optional field は bindings で `null` を許す。`stop_offsite_backup` は `null`。
- internal type: 目印・状態の JSON は wire に出さない。
- producer/consumer: MNT → CMD → bindings → UI-11b・UI-00。
- round-trip token: file picker の path がそのまま (a) の `inspectBackup` と `restoreBackup` に渡る（UI-11b-D15 の file の入口の行）。
- precision/range: 日数は JS の安全な整数の内（43 §43.8 の DTO の形）。
- cross-language parse: 日時の文字列を UI が和式に整える（既存の `BackupInfo.created_at` と同じ形）。

## Compatibility Checks

- old schema/input: (a) の版の backup の file（正式名）はそのまま写す元になる（共有の検査に通ったものだけ）。旧い実装の中断で壊れた正式名は `SourceUnverified`。
- new schema/input: DB の schema は変えない。DB の外に `offsite-backup.json`（と退避名）、媒体に `InventoryBackup\offsite-medium.json`。
- output order: 媒体の写しは名前（日時）の新しい順で掃除する。
- optional field behavior: `OffsiteBackupStatus.days_since_last_success` が `null` のとき（写せていない）は「まだ写せていません」の形。

## Data Safety Checks

- source-derived data: test の DB・控え・目印・状態の file はすべて合成。実 DB・実 backup・実 USB の中身を fixture にしない。
- generated outputs: bindings と traceability の再生成だけ。
- secrets: 無し。
- local-only files: L3 の試しの DB、USB メモリの中身、L3-b5 で Coordinator が用意した状態の file。
- synthetic sample boundaries: レジの SD は一時 dir と L3 の試しの USB の `CASIO\SR500_550_4000` で模す。媒体の root の列は一時 directory。

## Main Wiring / Integration Checks

- helper connected to main path: `RootLayout.tsx` の `useAutoBackupCheck` から `checkOffsiteBackup` まで（UI-11b-D16 の hook の行は実物の hook）。`HomePage.tsx` の `OffsiteBackupWarning` から `getOffsiteBackupStatus` の query まで（UI-00-D12 の行は実 hook + QueryClient）。CMD の 5 command から `mnt::offsite` まで（43 の行は production の CMD test 規範〈43 §43.12〉）。
- output reaches manifest/report: `check_offsite_backup` の成功が `offsite-backup.json` の `last_success` に入り、`get_offsite_backup_status` から card とホームへ届く（MNT-01-D8 写しの行と UI-00-D12 の行）。
- effective config reaches runtime: `backup_path` の設定が写す元の `backup_dir` になる（43 §43.8.3、`get_backup_dir` の後）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- mock の値を設計の例と違えたとき: card とホームの日数・札は mock に 5 日・控え 2 を使い、表示が mock から来たことを確かめる（UI-11b-D14・UI-00-D12 の行）。UI が日数を計算する実装は、日数と日付を食い違わせた入力で red。
- invalidate の順: `checkOffsiteBackup` の結果（種類に依らず）の後に status が invalidate され、停止の前に始まった結果は捨てる（UI-11b-D16 の行）。作り直しの失敗でも backup list が invalidate される（UI-11b-D14 の作り直しの行）。
- 分岐を反転したとき: `stale` の条件を反転すると UI-00-D12 の行と 3 日の境界の行が落ちる。`attached` の判定を反転すると UI-11b-D14 の状態の文の行の (5) の 2 case が落ちる。
- 閾値の比較を変えたとき: `>=` → `>` で 3 日の境界の行が落ちる。保持の 30 → 31 で保持の行が落ちる。
- guard を消したとき: MNT-01-D10 の root の判定を消すと D10 / D8 の行、目印・状態の照合を消すと「目印の無い媒体」の行、読み戻しの比較を消すと照合の行、目印の読み直しを消すと入れ替わりの行、reparse point の判定を消すと reparse point の行が落ちる。
- 出力の field を消したとき: `last_success.sha256` を消すと写しの成功の行、`attached` を消すと card の副情報の行と (5) の行が落ちる。
- 出力の順を変えたとき: 保持の並びを古い順にすると保持の行が落ちる。`checkAutoBackup` と `checkOffsiteBackup` の順を入れ替えると UI-11b-D16 の順の行が落ちる。
- dry-run が副作用を持ったとき: `offsite_status` が書くと状態の行（前後の bytes の比較）が落ちる。
- JSON の数が JS の安全な整数を超えたとき: 日数は上限から超えない（43 §43.8 の DTO の形）。
- 状態の token を browser と往復したとき: file picker の path の往復（UI-11b-D15 の file の入口の行）。
- 本 packet の commit の決定を戻したとき: 成功の記録の置き換えの後の sync の失敗で `Io` を返すと、`test_check_offsite_req901_d8_success_record_sync_failure_stays_copied` と `test_reset_offsite_state_req901_d8_step7_state_sync_failure_stays_copied` が落ちる。

## Residual Test Gaps

- Windows の drive の種類の判定・空の読取り機で dialog が出ないこと・volume GUID path への Rust の std の copy と読み戻し（packet の Contract Probe の P11。公開・親 directory の sync・読取り専用の open は (a) の probe の P7〜P10 で PASS）・実 USB の抜き差しと drive 文字の変化は自動 test で通さない（CI に Windows の runner が無い）。L3-b1〜L3-b4 で確かめる。exFAT の媒体は L3 でも通さない（店の USB は FAT32）。
- 読み戻しが file cache から返るか（P2）は test しない（保証の範囲を狭めた）。
- 3 日の知らせのうち (5) の媒体が見えない文だけを実機で目視し（L3-b5）、ほかの原因の文（記録が読めない・写す元が古い・確かめられない・空きなし・差してあるのに写せない）は L3 Eligibility の (3) に当たるので、文の完全一致の unit と component の test で固定する。残りのリスク（実機の画面での折り返し・色）は Ready の依頼で owner に示して受け入れを記録する。
- 作り直し（壊れた状態の file）は実機で通さない（状態の file を壊す手順は L3 Eligibility の (3)）。
- 通しの演習（別の PC での復元）は運用の手順で、test にしない（71 §71.13）。
- 前の版のアプリを入れ直す実機の確かめはしない（packet の Rollback notes。file の置き場所の test で代える）。
