# Test Design Matrix: PC の外の控えの runtime (a)（backup を確かめてから公開し、書く先を固定し、一覧の行から復元する前に控えを確かめる）

Plan Packet: [2026-10-23-backup-offsite-runtime-a](../2026-10-23-backup-offsite-runtime-a.md)。出発点は design の Matrix（[2026-10-07-backup-offsite](../../archive/plans/test-matrices/2026-10-07-backup-offsite.md)）の (a) に当たる行で、test 名はそこから引き継ぐ（`req901` と決定 ID を含める、71 §71.10 の D-114 の追加の表）。oracle は設計正本（71 §71.3・§71.4・§71.4.1・§71.5・§71.8・§71.12、43 §43.6・§43.8.5、68 UI-11b-D13・D15・§68.4・§68.7・§68.9・§68.10）から取り、実装から写さない。PC の外の控えの行（MNT-01-D8、UI-11b-D14・D16、UI-00-D12、file を選ぶ入口）は (b) の Matrix へ送る。

## Risk

Risk: R4

## Contracts Under Test

- MNT-01-D7: PC の中の backup は作業名へ書き、共有の検査（71 §71.12 の「使える控え」）に通してから、既存を上書きしない公開（71 §71.4.1）で正式名にする。一覧・掃除・今日の判定は正式名（規約の完全一致）だけを見る。
- MNT-01-D10（PC の中の保存先）: 書く先の folder とその祖先（正規化した元の path と実体の path の両方）に `CASIO\SR500_550_4000` があれば書かない・消さない。判定と書込みは `pin_to_volume` で固定した実体の path で行う。固定できなければ書かない。手動の backup は原因を固定の文で名指す（43 §43.6）。
- 71 §71.3: 規約外の多バイトの名前で名前の解析が panic しない。
- MNT-01-D9: `inspect_backup` は file と folder を変えずに版・`quick_check`・商品の数・最後の記録を返し、このアプリの backup でない file を `Err` にする。
- 43 §43.8.5: `inspect_backup` の command は MNT を呼ぶだけで、DB を使わず、`#[tauri::command(async)]`。
- UI-11b-D15（一覧の行の入口）・D13: 確かめの開始の前に共通の確認を止めて実行中の回を待ち、止めた控えでは事前バックアップと確認へ進まない。再開は復元の card の「閉じる」（`ready` へ戻る）・条件つきの unmount。「閉じる」は一覧も invalidate する。fatal でない復元の失敗の後は未選択へ戻る（§68.7）。
- §68.4 手動バックアップ手順 4: 手動 backup の成功・失敗とも一覧を取り直す。
- Rollback: 作業名は前の版の一覧・掃除・今日の判定から見えない形。

## Failure Modes

- `VACUUM INTO` の途中で止まった file・壊れた file が正式名で残り、今日の backup と数えられる・復元の候補に出る。
- 公開が同じ名前の既存の正式名を上書きする。作業名の掃除が別用途の `*.partial` を消す。
- 判定の後に drive 文字が別の volume へ移り、レジの SD に書く。link を含む保存先で、判定した folder と別の folder に作る・SD を指す link を通す。`..` を含む保存先で判定と作成の folder が違う。
- 固定できない保存先に drive 文字の path で書く。手動の backup が原因を名指さない。
- 規約外の多バイトの名前で、一覧・掃除・今日の判定・作業名の掃除が panic する。
- 新しすぎる版・壊れた・空の・別用途の DB を「戻せます」と返す。確かめが journal・`-wal`・`-shm` を作る。
- 止めた控えで事前バックアップを作る・確認の手順へ進む。確かめの間に 60 秒の確認が走る。「閉じる」で確認が再開しない・一覧が古いまま（停止の待ちで捨てた `true` が作った backup が出ない）。最終確認の「キャンセル」で再開する。fatal の後・復元の実行中の離脱で確認が再開する。fatal でない復元の失敗の後に詳細が残り、確かめを通らずに再試行する。
- `inspect_backup` を main thread で動かす（`quick_check` の間に画面が固まる）。
- 公開の後の失敗で残った正式名が、手動 backup の失敗の後の一覧に出ない。
- 作業名の形が前の版の判定に掛かり、前の版へ戻した後に作業名を今日の backup と数える。

## Test Matrix

- 既存の test を回帰の証跡に挙げる前に `rg` で実在を確かめる（下の「既存」は 2026-10-23 に `eed07d37` で `rg -n 'fn test_…'` で確かめた名前）。
- file 操作の失敗の注入は restore の `RestoreFileOps` と同じ trait（`publish_no_replace` を足して共有する）の注入の型で行い、呼ばれた操作の順を記録する（restore の test の注入の型の操作の記録と同じ形）。`sync_all` や親 directory の sync を省くと順の oracle で red になる（正常系の結果だけでは省いても green になるため）。
- 書く先の固定は Windows 以外の同じ関数（`canonicalize` と symbolic link）を通す。Windows 側の `GetFullPathNameW`・`GetFinalPathNameByHandleW`・親 directory の sync・volume GUID path の URI の open は Contract Probe の P7〜P10（2026-10-23 PASS）と L3-a1〜L3-a4 で確かめる。
- 既存の test の移し方（契約ごと移す）: page の「REQ-901 / UI-11b-D13: 復元の前に発火して待機中の確認の結果は捨てる」の 2 本（復元の間に届く・再開の後に届く）は、確認が未解決のまま一覧の行から復元へ進む流れを前提にしている。D15 の後は行を選ぶと `suspendAutoBackupCheckAndWait()` が実行中の回を待つので、この前提に届かない（待たずに通す実装に変えると D15 に反し、先に確認を解決すると「捨てる」の oracle が消える）。2 本は削り、契約（停止の前に始まった確認の結果を、停止中に届いても再開の後に届いても捨て、捨てても実行中の guard は解く）を下の UI-11b-D13・D15 の hook の行（単体）と UI-11b-D15・D13 の page の行へ移す。oracle（`toast.success` なし・一覧の invalidate の数が同じ・次の tick で再び呼ぶ）は弱めない。
- 時刻・公開の名前は注入できる形にする（同じ秒の 2 回目の case のため）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| MNT-01-D7 | `VACUUM INTO` の失敗で正式名・作業名の file が残る | unit（`mnt::backup`、注入: `VACUUM INTO` の `Err`。続けて作業名の削除の失敗も注入した case） | `test_create_backup_req901_d7_vacuum_failure_leaves_no_published_file` | 作業名を使わず正式名へ直接書く、`Err` の後に作業名の file が残る（削除を省く）。削除の失敗の case: 次の `create_backup` の後に作業名が残る（手順 3 の掃除を省く） |
| MNT-01-D7 | 壊れた作業名の file を公開する | unit（注入: 作業名の file を検査の前に壊す） | `test_create_backup_req901_d7_quick_check_failure_removes_partial_without_success_log` | 手順 4a の検査を飛ばす、失敗でも公開する、成功の操作ログ（`backup_create`）を書く |
| MNT-01-D7 | 作業名・規約外の名前を今日の backup と数える | unit（`check_auto_backup` から `collect_today_backup_names` を通す） | `test_check_auto_backup_req901_d7_partial_and_nonconforming_not_counted_as_today` | 今日の判定が規約の完全一致（`extract_datetime_from_backup`）をやめる（作業名 `…_{HHMMSS}.db.partial` だけ・`inventory_backup_{今日}_manual.db` だけの dir で backup を作らない。今の前方一致の実装では後者が red） |
| MNT-01-D7 | 前回の残りの作業名が溜まる・別用途の `*.partial` を消す | unit（規約に合う `.db.partial` と `notes.db.partial`） | `test_create_backup_req901_d7_removes_only_conforming_stale_partial` | 手順 3 の削除を消す（前者が残る）、`*.partial` の glob で消す（後者が消える） |
| MNT-01-D7・§71.4.1 | 公開が既存の正式名を上書きする | unit（同じ正式名を先に置く。時刻か公開の名前を注入する） | `test_create_backup_req901_d7_publish_does_not_replace_existing` | `std::fs::rename` で公開する（既存の bytes が変わる）、衝突を成功にする（`DbError::QueryFailed` でない・作業名が残る） |
| MNT-01-D7・§71.4.1 | 公開の順・永続化を省く | unit（注入、操作の記録） | `test_create_backup_req901_d7_publish_order_and_failure_points` | 記録が `sync_file` → `publish_no_replace` → `sync_parent` の順でない。sync・公開・親 directory の sync の各点の失敗で、成功の操作ログがある・公開の前の失敗で正式名がある。公開の後（親 directory の sync）の失敗で、検査済みの正式名が残らない（71 §71.4 のエラーハンドリング） |
| MNT-01-D6 | metadata の失敗を size 0 の成功にする（既存の test の移し替え） | unit（注入を公開の後の正式名の path だけに当てる） | 既存 `test_create_backup_req901_metadata_error_propagates_without_success_log`（`mnt/backup.rs`） | 注入を作業名にも当てたまま（手順 4a で先に失敗して oracle が red）、oracle を弱める（message の「サイズ」・dir に 1 file を外す）。移した後も metadata の失敗で成功の操作ログがある実装は red |
| Rollback | 作業名が前の版の判定に掛かる | unit（作業名の文字列を作る関数か `create_backup` の作業名の path） | `test_create_backup_req901_d7_partial_name_invisible_to_previous_filters` | 作業名が `.db` で終わる、`extract_datetime_from_backup`・`extract_date_from_backup` が作業名に `Some` を返す（前の版の今日の判定〈前方一致と `.db` の後方一致〉と一覧・掃除〈規約の完全一致〉が作業名を数える） |
| MNT-01-D10 | レジの SD に backup を書く・SD の上で消す | unit（`{tmp}/CASIO/SR500_550_4000` を置き、`backup_dir = {tmp}/backups`〈まだ無い sub folder〉で `create_backup` と `cleanup_old_backups`） | `test_create_backup_req901_d10_refuses_register_sd_root` | 手順 0 の判定を消す、`backup_dir` の直下だけを見る、IO-09 の `resolve_register_sd_root` を流用する（どれも `{tmp}/backups` を SD と判定しない）。oracle: `{tmp}` の一覧と bytes が前後で同じ（`backups` も作らない）、`create_backup` は `DbError::QueryFailed`、`cleanup_old_backups` は `Err` |
| MNT-01-D10 | 判定の後に drive 文字が SD へ移り、SD に書く | unit（Windows 以外の `pin_to_volume` を通す。`backup_dir = {tmp}/E/backups` で `{tmp}/E` を `{tmp}/vol-a` への symbolic link にし、手順 0 の直後の注入で `{tmp}/E` を `{tmp}/sd`〈`CASIO/SR500_550_4000` あり〉への link に替える） | `test_create_backup_req901_d10_writes_only_to_pinned_volume` | 手順 1〜4b を `backup_dir`（drive 文字の path）で行う。oracle: `{tmp}/sd` の一覧と bytes が前後で同じ、作業名・正式名は `{tmp}/vol-a/backups` にだけできる、返す `file_path` は `{backup_dir}/{ファイル名}` |
| MNT-01-D10 | link を含む保存先で別の folder に作る・SD を指す link を通す | unit（(1) `{tmp}/c/backup-link` を `{tmp}/d/store` への symbolic link にし、設定は `{tmp}/c/backup-link/new`〈まだ無い〉。(2) 同じ形で link の先を `{tmp}/sd/store`〈`{tmp}/sd/CASIO/SR500_550_4000` あり〉にする。(3) link 自身を SD を模した folder の中に置く） | `test_pin_backup_dir_req901_d10_follows_links_to_actual_folder` | (1) 正式名が `{tmp}/d/store/new` にできない。(2)(3) `RegisterSd` でない・SD を模した folder の一覧と bytes が前後で同じでない（元の path か実体の path の片方の祖先だけで判定する実装が red） |
| MNT-01-D10 | 判定した folder と作る folder が別になる | unit（設定 `{tmp}/a/b/../c/./d`） | `test_pin_to_volume_req901_d10_normalizes_before_pinning` | 正規化の前に固定・判定する（`{tmp}/a/c/d` 以外の folder ができる、判定した祖先と作った folder の祖先が違う） |
| MNT-01-D10・43 §43.6 | 固定できない保存先に書く・原因を名指さない | unit（`pin_to_volume` を `Err` にする注入）と CMD（手動の `create_backup`） | `test_create_backup_req901_d10_unpinnable_writes_nothing_and_names_cause` | 固定できないのに drive 文字の path へ書く（保存先の一覧が前後で同じでない）。CMD が `validation` と 43 §43.6 の固定の文（「この保存先は PC の中の folder として確かめられません。PC の中の folder を選び直してください」）を返さない。SD の上の case（`{tmp}/CASIO/SR500_550_4000` を置き、保存先は `{tmp}/backups`）で、文が見つけた folder の path（`{tmp}/CASIO/SR500_550_4000`）と「folder の中へ移して」の直し方を含まない、`internal` になる |
| 71 §71.3 | 規約外の多バイトの名前で panic して backup・一覧・掃除が止まる | unit（`backup_dir` に `inventory_backup_あああああ.db` と `inventory_backup_あああああ.db.partial`〈どちらも stem が 15 bytes〉を置く） | `test_backup_names_req901_multibyte_nonconforming_names_do_not_panic` | 名前の解析が長さの確認の後・`_` と ASCII の確認の前に slice する（`list_backups`・`cleanup_old_backups`・`check_auto_backup` の今日の判定・`create_backup` の作業名の掃除のどれかが panic する）。期待: どれも panic せず、その名前を無視し、`create_backup` は成功し、2 つの file は消えない。媒体の写しの並び（design の行の残り）は (b) |
| MNT-01-D9 | 新しすぎる版を戻せると返す | unit（`write_newer_schema_db` の形で `app_max_version() + 1` の DB と、版が `i64::MAX` の DB） | `test_inspect_backup_req901_d9_newer_than_app` | 版の比較を消す・`migrate` と別の判定を書く（どちらの case も `newer_than_app = true` でない）。新しすぎる版で必須の表を見て `Err` にする（§71.12 手順 2a は新しすぎる版の表を見ない） |
| MNT-01-D9 | 壊れた控えを戻せると返す | unit（page を壊した file） | `test_inspect_backup_req901_d9_quick_check_failure` | `quick_check` を飛ばす（`quick_check_ok = true` になる）、`product_count` を `Some` で返す |
| MNT-01-D9 | 確かめが file・folder を変える | unit（WAL mode にして閉じた DB〈file の header が WAL を示す〉で、前後の SHA-256 と folder の一覧を比べる。rollback mode の DB は使わない） | `test_inspect_backup_req901_d9_leaves_file_and_folder_unchanged` | `immutable=1` をやめる（WAL の DB を開くと `-wal`・`-shm` ができる見込み）。Writer は `immutable=1` を外すと red になることを一度確かめ、green のままなら fixture を替える（design の P4） |
| MNT-01-D9 | URI の組立てで path が別の file を指す（Windows の作業名は必ず `\\?\Volume{GUID}\…` で `?` を含む） | unit（一時 directory に、file 名そのものが `\\?\Volume{x}\d#1\50% done\x.db` の形の DB を置く。Linux では `\`・`?`・`#`・`%` を含む 1 つの合法な名前で、URI の解析は OS に依らない） | `test_inspect_backup_req901_d9_uri_escapes_path_chars` | 開き方が 71 §71.12 手順 1 の 1 文（`backup_path` の文字列〈Windows は `\` のまま。`\`→`/`・`//` の圧縮・drive 文字の前の `/` を行わない〉の `%`・`?`・`#` を 1 回の走査で `%25`・`%3f`・`%23` に置き換え、前に `file:`、後ろに `?immutable=1` を付け、`SQLITE_OPEN_READ_ONLY \| SQLITE_OPEN_URI` で開く）と違う: 符号化しない（`?` 以降が query になる）、`\` を `/` に変える、`%` を別の走査で後から置き換える（二重の符号化）のどれも `Err` で red。期待: `Ok` で版と `quick_check_ok = true` が返り、folder の一覧が前後で同じ |
| MNT-01-D9 | 読めない file を `Ok` にする・確かめが file を作る | unit（存在しない path、SQLite でない bytes） | `test_inspect_backup_req901_d9_unreadable_is_error` | open・版の読取りの失敗を既定値に倒す。存在しない path の case で file を作る（`SQLITE_OPEN_READ_ONLY` を落とすと `immutable=1` でも作る。oracle: path が無いまま・folder の一覧が前後で同じ） |
| MNT-01-D9 | 空の・別用途の DB を戻せると返す | unit（0 byte の file、`schema_versions` の無い別用途の表だけの DB、`schema_versions` が空の DB、版 1 で `products` の無い DB の 4 つ） | `test_inspect_backup_req901_d9_non_app_database_is_error` | 手順 2a を消す（版 0 を `Ok` で返す、必須の表を見ない） |
| 43 §43.8.5 | 失敗の写像が message の文字列に依る・kind を足す・空の入力を通す | unit（CMD の `inspect_backup`） | `test_inspect_backup_cmd_req901_maps_errors_to_validation` | 空の `backup_path` が `validation` でない、MNT の `DbError` が `validation` と固定の文「この控えを読めませんでした。別の控えを選んでください。」でない、DB の Mutex を取る、`CmdErrorKind` に値が増える |
| 43 §43.8.2 実行の thread | `inspect_backup` を main thread で動かす | source の検査（`src-tauri/tests/design_compliance_test.rs` と同じく `syn` で `cmd/settings_cmd.rs` を読む。`syn` は既存の dev-dependency） | `test_inspect_backup_cmd_req901_runs_off_main_thread` | `inspect_backup` の attribute が `#[tauri::command(async)]` でない（`async fn` でもない）。(b) は同じ test に残りの 5 command を足す |
| UI-11b-D15 | 止めた控えで事前バックアップ・確認へ進む | flow（`BackupRestorePage.flow.test.tsx`。mock の `inspectBackup` が新しすぎる版・壊れた・`Err` の 3 つ） | 一覧の行から選ぶと、3 つのどれでも `createBackup` が呼ばれず、復元の button が無く、固有の文言（UI-11b-D15 の 3 つの文の完全一致）が出る。`inspectBackup` の IPC の例外（reject）も読めない控えの文言。確かめの間は「控えを確かめています」が出て、復元の導線と「閉じる」は押せない。復元の card の「閉じる」で `ready`（未選択）に戻る | `restore_inspecting` を飛ばす、`restore_blocked` で button を出す、文言が設計の文と違う、「一覧へ戻る」を別に作る（「閉じる」が無い） |
| UI-11b-D15 | 戻せる控えの詳細に確かめの結果が出ない・0 件を隠す | component（`BackupRestorePage.test.tsx`。mock の `inspectBackup` が戻せる控えで、商品の数は設計の例と無関係の値と 0 の 2 case、最後の記録は値ありと `null`） | 「この控えは戻せます」と「商品の数: N 件」（0 の case は「商品の数: 0 件」）と「最後の記録: 和式日時」（`operation_logs` の形 `YYYY-MM-DDTHH:MM:SS` の値を和式に整える。`null` の case は行なし）が出て、`inspectBackup` に一覧の行の `file_path` と同じ値が渡る。その後の事前バックアップと `restoreBackup({ backup_path })` に同じ値が渡る | `product_count = 0` を出さない（`None` と同じに扱う）、mock の値でなく固定の値を出す、別の path を渡す |
| UI-11b-D15・D13 | 確かめ・詳細・最終確認の間に 60 秒の確認が走る、再開の条件がずれる、捨てた `true` の backup が一覧に出ない | flow（`BackupRestorePage.flow.test.tsx`。hook を mount した画面で、mock の `checkAutoBackup` を解決しない promise で止めておく） | 一覧の行を選ぶと `inspectBackup` の前に共通の確認が止まり、実行中の `checkAutoBackup` が解決するまで `inspectBackup` を呼ばない。`true` で解決させると、その後に `inspectBackup` が 1 回呼ばれ、`toast.success` は出ず一覧の invalidate の数は変わらない（停止の前に始まった結果を捨てる。順は「解決 → `inspectBackup`」で固定し、test は解決の前に `inspectBackup` を待たない）。止めている間は interval が進んでも `checkAutoBackup` を呼ばない（詳細・事前バックアップ・最終確認を通して）。最終確認の「キャンセル」は詳細へ戻るだけで、interval が進んでも呼ばない。復元の card の「閉じる」（`restore_detail`・`restore_blocked`・`pre_backup_failed` のそれぞれ）で再開して次の tick で `checkAutoBackup` が呼ばれ、一覧が invalidate される。（復元の実行中でも fatal の後でもない）画面の unmount で再開する。`restore_failed_unrecoverable` の後と `restore_durability_unknown` の後のそれぞれで unmount しても、interval が進んでも呼ばない。復元の実行中（`restoreBackup` が未解決）に unmount しても再開せず、その後 `restoreBackup` が成功・fatal でない Err で解決したら再開、fatal で解決したら止めたまま。`restore_failed_recovered` の後は復元の card が未選択（既存の it.each「REQ-700 68 §68.7 shows error_id for %s」の `restore_failed_recovered` の行に assert を足す。再試行は行を選び直して確かめから） | 停止を `restoreBackup` の直前まで遅らせる（詳細の間の tick で `checkAutoBackup` が呼ばれる）、実行中の回を待たずに `inspectBackup` を呼ぶ、待つ間に届いた `true` で toast・invalidate する、「キャンセル」で再開する、「閉じる」で再開しない・一覧を invalidate しない、unmount で無条件に再開する、`restore_failed_recovered` の後に詳細を残す |
| UI-11b-D13・D15 | 停止の前に始まった確認の結果を使う、待つ対象が見えない、捨てた後に guard が残る（page の D13 の 2 本から契約ごと移す） | unit（`useAutoBackupCheck.test.tsx`。mock の `checkAutoBackup` を解決しない promise で止めておく） | (1) 実行中の回があるときに `suspendAutoBackupCheckAndWait()` を呼ぶと、回の解決まで promise が解決せず、`true` で解決させると `toast.success` も一覧の invalidate も無いまま promise が解決する。実行中の回が無い・hook が mount されていないときはすぐ解決する。(2) `suspendAutoBackupCheck()` → `resumeAutoBackupCheck()` の後に停止の前の回が `true` で解決しても `toast.success` も invalidate も無く（世代番号で捨てる）、次の tick で `checkAutoBackup` が再び呼ばれる（捨てても guard が解ける） | guard を hook の `useRef` に置いたまま待つ（module の関数から実行中の回が見えず、待たずに解決する）、停止の flag だけを見て世代番号を比べない（(2) で toast が出る）、捨てた結果で guard を解かない（(2) の次の tick で呼ばれない） |
| §68.4 手動バックアップ手順 4 | 公開の後の失敗で残った正式名が一覧に出ない | flow（`BackupRestorePage.flow.test.tsx`。`createBackup` の失敗の mock） | 手動 backup の失敗でも `queryKeys.backupRestore.list()` が invalidate され、`listBackups` が取り直される。失敗の文は `describeError` の文（`validation` は message のまま）が出る | 成功のときだけ invalidate する（今の code はこれで red） |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| PC の中の backup の file | 無し | 作業名 `.partial` | 確かめ → 上書きしない公開 → 正式名 | 手動は成功・失敗とも一覧を invalidate、自動は `true` のとき | 一覧の再取得 | 一覧は正式名だけ | 次の `create_backup` が残りの作業名を消す。前の版へ戻しても作業名は見えない | 公開の前: 作業名を消す（消せなければ次回）。公開の後: 正式名は残り `Err` | 次の確認・手動 | MNT-01-D7 の行、rollback の行、手動 backup の再取得の行 |
| 書く先の固定 | 設定の `backup_path` か既定 | 正規化 → 実体の path → 判定 | 実体の path で書く・消す | — | 毎回の呼出しで固定し直す（状態を持たない） | — | — | 固定できない・SD の上: 書かない・消さない、手動は固定の文 | 写しを動かす・保存先を選び直す | MNT-01-D10 の行 |
| 復元の詳細 | 未選択 | 共通の確認を止めて実行中の回を待つ → `restore_inspecting` | `restore_detail`（確かめの結果つき） | 「閉じる」で一覧 | 選び直すたびに確かめ直す | 「閉じる」で未選択に戻って別の控え（確認が再開） | — | `restore_blocked`（固有の文言）。fatal でない復元の失敗の後は未選択 | 別の控えを選ぶ（確かめから） | UI-11b-D15 の行 |
| 共通の確認（`checkAutoBackup`） | mount | 実行中の guard（module scope の `inFlight`） | `true` で一覧を invalidate | 世代番号が違えば捨てる（捨てた `true` の backup は「閉じる」の invalidate で一覧に出る） | — | — | — | 連続の最初の 1 回だけ toast（変えない） | 60 秒後。復元の確かめの間は止めたまま | UI-11b-D15・D13 と UI-11b-D13・D15 の行、既存の `useAutoBackupCheck.test.tsx` |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 作業名 → sync → rename → 親 dir の sync（restore の manifest、MNT-01-D5） | `src-tauri/src/mnt/restore.rs` の `write_manifest`・`StdRestoreFileOps` の `sync_parent` | backup の公開（MNT-01-D7） | restore の manifest と reconcile は変えない。目印・状態の file（MNT-01-D8）は (b) | MNT-01-D7 の公開の行 |
| file 操作の失敗の注入（restore の `RestoreFileOps`） | `mnt/restore.rs` の trait `RestoreFileOps`・`StdRestoreFileOps`・`tests` の注入の型 | backup の作業名・公開の注入 | 新しい trait を作らない（本番と test で別の判定を作らない、71 §71.8 の注入境界と同じ） | MNT-01-D7 の公開の順の行 |
| 版の判定（MNT-03-D11） | `src-tauri/src/db/migration.rs` の `app_max_version`・`read_current_version_without_ddl`・`migrate` | `inspect_backup` が同じ関数を共有する | restore の中に版の事前検査を足さない（22 MNT-03-D11） | MNT-01-D9 の行 |
| 新しすぎる版の DB の test helper | `src-tauri/src/db/test_support.rs` の `write_newer_schema_db` | `inspect_backup` の新しすぎる版の fixture | — | MNT-01-D9 の新しすぎる版の行 |
| 規約の名前の解析（`extract_datetime_from_backup`・`extract_date_from_backup`） | `mnt/backup.rs` の `list_backups`（前者）・`cleanup_old_backups`（後者）・`collect_today_backup_names`（今は前方一致） | 今日の判定と作業名の掃除が前者を使う | `extract_date_from_backup` は形を変えない（`_` の位置を先に見る） | §71.3 の行、今日の判定の行 |
| レジの SD の folder 名（IO-09） | 29 §29.7（`CASIO\SR500_550_4000`）、#172 の `io::register_sd`（main に未着） | MNT-01-D10 の判定 | 文字列を二重に持たない（先に main に入る lane が置く、packet の Scope の `io/mod.rs` の行） | MNT-01-D10 の行 |
| 共通の確認の停止と世代番号（UI-11b-D13） | `src/features/backup-restore/useAutoBackupCheck.ts` の `suspendAutoBackupCheck`・`resumeAutoBackupCheck`・世代番号、`BackupRestorePage.tsx` の `handleRestore` の停止と再開 | `suspendAutoBackupCheckAndWait` は同じ flag と世代番号を使い、実行中の回の完了を待つ。実行中の guard を hook の `useRef` から同じ module scope へ移す | 別の停止の仕組みを作らない。guard を 2 つ持たない。`handleRestore` の停止は残す（D13 の「止めたままの状態に重ねる」） | UI-11b-D15・D13 の行 |
| `vi.mock` による hook の module の置き換え | `src/features/inventory-records/OtherRecordDetailRoutes.test.tsx`・`src/lib/app-router.test.tsx`（`rg -n 'vi.mock\("@/features/backup-restore/useAutoBackupCheck"' src`） | 2 か所とも新しい export を mock に足す | 実物を import する test（`RootLayout.test.tsx` ほか）は変えない | AC5 |
| 手動の失敗の後の取り直し（§68.4） | `BackupRestorePage.tsx` の `handleManualBackup`（成功だけ）・`handleStartRestoreConfirmation`（事前、成功だけ） | 手動だけ成功・失敗とも | 事前バックアップの失敗の後は設計が取り直しを定めない（packet の Non-scope） | 手動 backup の再取得の行 |

## Negative Paths

- missing input: 空の `backup_path`（`inspect_backup`）は `validation`。backup の保存先の folder が無い（`cleanup_old_backups` は `Ok(0)`、`create_backup` は作る）。
- invalid input: 空の file・SQLite でない bytes・版 0・必須の表が無い DB は `inspect_backup` が `Err`。規約外の多バイトの名前は無視（panic しない）。
- duplicate/ambiguous input: 同じ秒に 2 回作ると 2 回目は既存を残して `DbError::QueryFailed`。規約に合う作業名と `notes.db.partial` が並ぶ（前者だけ消す）。
- unknown reference: 存在しない控えの path は `inspect_backup` が `Err`（読めない控え）で、file を作らない。
- dependency missing: 保存先が固定できない（network・Mount Manager の外）→ 書かない・消さない。
- permission/write failure: `VACUUM INTO`・sync・公開・親 directory の sync の失敗（公開の前と後で oracle を分ける）。作業名の削除の失敗は warn で次回。
- dry-run side effect: `inspect_backup` は file と folder を変えない（MNT-01-D9 の行）。

## Boundary Checks

- threshold: 規約の名前の stem は 15 bytes（`YYYYMMDD_HHMMSS`）。
- null/default: `BackupInspection.product_count`・`last_operation_at`・`created_at` は取れないとき `null`。`product_count = 0` は `null` と別に「0 件」と出す。
- empty/non-empty: 空の保存先、空の DB の控え（版はあるが商品 0）。
- min/max: 版 = `app_max_version()` は戻せる、`+ 1` と `i64::MAX` は止める。
- status/policy enum: `CmdError.kind` は `validation` / `internal` だけ（値を足さない）。
- wire type: `BackupInspection` の optional field は bindings で `null` を許す。
- internal type: `PinnedPath`・`BackupDirError` は wire に出さない。
- producer/consumer: MNT → CMD → bindings → UI-11b。
- round-trip token: `BackupInfo.file_path` がそのまま `inspectBackup` と `restoreBackup` に渡る（UI-11b-D15 の戻せる控えの行）。
- precision/range: 版は範囲を仮定せず UI は使わない。件数は JS の安全な整数の内。
- cross-language parse: 日時の文字列を UI が和式に整える（既存の `BackupInfo.created_at` と同じ形）。

## Compatibility Checks

- old schema/input: 既存の backup の file（正式名、`VACUUM INTO` 製）はそのまま一覧・復元の候補で、復元の前に確かめを通る。旧い実装の中断で壊れた正式名は確かめで「壊れているため戻せません」になる。
- new schema/input: DB の schema・`app_settings` は変えない。作業名 `*.db.partial` が保存先に一時的に現れる。
- output order: 一覧の並び（新しい順）は変えない。
- optional field behavior: `BackupInspection` の optional field が `null` でも確かめの結果（戻せるか）は変わらない。

## Data Safety Checks

- source-derived data: test の DB・作業名・SD を模した folder はすべて合成。実 DB・実 backup・実 USB の中身を fixture にしない。
- generated outputs: bindings と traceability の再生成だけ。
- secrets: 無し。
- local-only files: probe の script と出力、L3 の試しの folder と backup。
- synthetic sample boundaries: レジの SD は一時 dir と L3 の試しの USB の `CASIO\SR500_550_4000` で模す。

## Main Wiring / Integration Checks

- helper connected to main path: CMD の `create_backup` → `pin_backup_dir` → MNT の `create_backup` の手順 0（MNT-01-D10 の CMD の行）。`RootLayout.tsx` の `useAutoBackupCheck` と `BackupRestorePage` の `suspendAutoBackupCheckAndWait` が同じ module の状態を使う（UI-11b-D15・D13 の行は実物の hook で通す）。
- output reaches manifest/report: 確かめの結果が `restore_detail` の表示へ届く（UI-11b-D15 の戻せる控えの行）。
- effective config reaches runtime: `backup_path` の設定が `pin_backup_dir` の入力になる（`get_backup_dir` の後）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- mock の値を設計の例と違えたとき: 戻せる控えの商品の数・最後の記録は設計の文に無い値を使い、表示が mock から来たことを確かめる（UI-11b-D15 の戻せる控えの行）。
- invalidate の順: 手動 backup の失敗の後に一覧が invalidate される（手動 backup の再取得の行）。確かめの前に停止し、実行中の回を待つ順（UI-11b-D15・D13 の行）。
- URI の組立てを変えたとき: 符号化を外す・`\` を `/` に変える・走査を分けて二重に符号化すると URI の行が落ちる。
- 分岐を反転したとき: `newer_than_app` の比較を反転すると新しすぎる版の行が落ちる。`restore_blocked` の分岐を反転すると止めた控えの行が落ちる。
- 閾値の比較を変えたとき: stem の長さ・`_` の位置の確認を slice の後へ動かすと §71.3 の行が panic で落ちる。
- guard を消したとき: 手順 0 の判定を消すと D10 の SD の行、固定を省くと固定の行、実体の path の祖先の判定を省くと link の行、正規化を省くと正規化の行が落ちる。手順 4a を消すと壊れた作業名の行が落ちる。
- 出力の field を消したとき: `product_count` を出さないと戻せる控えの行が落ちる。
- 出力の順を変えたとき: 公開の操作の順を入れ替えると公開の順の行が落ちる。
- dry-run が副作用を持ったとき: `inspect_backup` が書くと前後の比較の行が落ちる。
- JSON の数が JS の安全な整数を超えたとき: 版は超えうるが UI は使わず、戻せるかは Rust の `newer_than_app` が決める（新しすぎる版の行の `i64::MAX` の case）。
- 状態の token を browser と往復したとき: `file_path` の往復（UI-11b-D15 の戻せる控えの行）。

## Residual Test Gaps

- Windows の `pin_to_volume`（`GetFullPathNameW`・`GetFinalPathNameByHandleW`、末尾のピリオド・`/` の混在・junction・FAT32・exFAT・Mount Manager の外の drive）、固定した path への `VACUUM INTO`・`MoveFileExW`・親 directory の sync、volume GUID path の URI の open は自動 test で通さない（CI に Windows の runner が無い）。Contract Probe の P7〜P10（2026-10-23 PASS、Windows に同梱の SQLite）と L3-a1〜L3-a4（実の binary）で確かめる。
- exFAT は probe でも L3 でも確かめていない（owner の USB は FAT32）。exFAT の USB を保存先にした店で固定・公開の後の sync が外れると、その保存先の backup が止まる（手動は固定の文か失敗の表示、自動は連続の最初の 1 回の toast）。
- 新しすぎる版・壊れた控えの実機の目視は L3 Eligibility の (3) に当たり、文言は flow の test の完全一致で固定する。
- 事前バックアップの失敗の後の一覧の取り直しは設計が定めず、test しない（packet の Non-scope）。
- 前の版のアプリを入れ直す実機の確かめはしない（packet の Rollback notes。作業名の形の test で代える）。
