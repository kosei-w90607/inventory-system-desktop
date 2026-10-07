# UI-11b: バックアップ・復元画面

> 親文書: [FUNCTION_DESIGN.md](../FUNCTION_DESIGN.md)
> 対応REQ: QR-05 / REQ-901
> Design Phase: 2026-07-06。PR #141 で settings / log / backup 系 command bindings は配線済み。実効保存先常時表示（PR #144 L3 / Fable 裁定起源の follow-up）を追記。2026-10-07: PC の外の控えと復元の前の確かめ（D-114、UI-11b-F8〜F10・D14〜D16）を追記（runtime は後続の lane）。

UI-11b は、ローカル SQLite DB の手動バックアップ、バックアップ設定、バックアップ一覧、復元を operator が 1 画面で扱うための画面である。backend 契約の正本は [71-mnt-backup.md](71-mnt-backup.md) と [43-cmd-settings-log.md](43-cmd-settings-log.md) に置き、本書は UI 側の状態遷移、文言、安全確認、query cache の扱い、Windows native L3 を固定する。

## 68.1 目的

- 非IT高齢オーナーが、バックアップ作成・保存先確認・復元を単独で完遂できる。
- 復元は DB 全体を過去状態へ戻す destructive 操作として扱い、真の Undo がないことを UI が隠さない。
- DB 破損からの復旧シナリオでは、現在状態を保存できない場合だけ break-glass で復元を続けられる。
- backup 系設定（`backup_enabled` / `backup_time` / `backup_path` / `backup_retention_days`）はこの画面が所有し、UI-11a 閾値設定へ混ぜない。

## 68.2 関数要求

| ID | 要求 |
|---|---|
| UI-11b-F1 | 画面表示時に `commands.getSettings()` と `commands.listBackups()` を読み、バックアップ設定とバックアップ一覧を表示する。 |
| UI-11b-F2 | `backup_enabled` / `backup_time` / `backup_retention_days` を UI-11b で更新できる。 |
| UI-11b-F3 | `backup_path` は native directory picker で選んだパスだけを `commands.updateSetting()` に渡す。自由入力欄は作らない。 |
| UI-11b-F4 | 手動バックアップは `commands.createBackup()` を呼び、成功後に一覧を再取得する。 |
| UI-11b-F5 | 自動バックアップ確認は実装済み。共通レイアウトが mount する `useAutoBackupCheck` の 60 秒 interval（画面に依らない）から `commands.checkAutoBackup()` を呼び、`true` の時は backup list を invalidate/refetch して完了 toast を表示する（UI-11b-D13）。 |
| UI-11b-F6 | 復元は、事前バックアップ作成、詳細提示、最終確認、`commands.restoreBackup({ backup_path })`、cache clear、ホーム遷移、結果 Alert の順で扱う。 |
| UI-11b-F7 | 復元失敗時は CMD 層の再接続契約に合わせ、recoverable failure と double failure を UI 状態として分ける。 |
| UI-11b-F8 | 「PC の外の控え」の card で、用意の状態・最後に PC の外へ写せた日時・差してある媒体・最後の失敗を出し、USB メモリを保存先として用意できる（UI-11b-D14、71 §71.11）。 |
| UI-11b-F9 | 復元の詳細へ進む前に `commands.inspectBackup` で控えを確かめ、新しすぎる版・壊れた控え・読めない控えを固有の文言で止める。一覧の行に加え、「控えを選んで確かめる」で選んだ file（USB メモリの上の控え・新しい PC での復元）も同じ流れに入る（UI-11b-D15、71 §71.12・§71.13）。 |
| UI-11b-F10 | 共通レイアウトの確認（UI-11b-D13）が `checkAutoBackup` の後に `checkOffsiteBackup` を呼び、写せなかったときに知らせる（UI-11b-D16）。 |

## 68.3 シグネチャ

UI は PR #141 で生成済みの `commands.*` だけを使う。

| Command | UI 用途 | 戻り値 / 入力 |
|---|---|---|
| `commands.getSettings()` | backup 系設定の初期表示。 | `AppSetting[]` |
| `commands.updateSetting(request)` | backup 系設定の保存。 | `UpdateSettingRequest { key, value }` |
| `commands.listLogs(query)` | 直近の backup 操作ログを補助表示する場合だけ使う。全操作ログ UI は UI-11c が所有する。 | `LogQuery` -> `PaginatedResult<OperationLog>` |
| `commands.createBackup()` | 手動バックアップ、復元前の強制事前バックアップ。 | `BackupResult { file_path, file_name, size_bytes }` |
| `commands.checkAutoBackup()` | 共通レイアウトが mount する `useAutoBackupCheck` の 60 秒 interval（画面に依らない）の自動バックアップ確認（UI-11b-D13）。 | `boolean` |
| `commands.listBackups()` | バックアップ一覧。 | `BackupInfo[]` |
| `commands.getEffectiveBackupDir()` | `backup_path` 未設定時の実効保存先（アプリ既定フォルダ）常時表示。 | `String` |
| `commands.restoreBackup(request)` | 選択バックアップへの復元。 | `RestoreBackupRequest { backup_path }` -> `null` |
| `commands.getOffsiteBackupStatus()` | 「PC の外の控え」の card とホームの知らせ（D-114）。 | `OffsiteBackupStatus` |
| `commands.prepareOffsiteMedium(request)` | USB メモリを保存先として用意（D-114）。 | `PrepareOffsiteMediumRequest { selected_path }` -> `OffsiteMediumView` |
| `commands.checkOffsiteBackup()` | 共通レイアウトの確認から PC の外へ写す（D-114、UI-11b-D16）。 | `OffsiteCheckResult` |
| `commands.inspectBackup(request)` | 復元の前の確かめと「控えを選んで確かめる」（D-114、UI-11b-D15）。 | `InspectBackupRequest { backup_path }` -> `BackupInspection` |

## 68.4 処理ステップ

### 初期表示

1. `getSettings` と `listBackups` を並列に読む。
2. `backup_enabled` / `backup_time` / `backup_path` / `backup_retention_days` を UI 用 state に変換する。
3. `BackupInfo.created_at` は和式日時に変換し、`size_bytes` は MB 表示にする。
4. 一覧の先頭行に `最新` Badge を付ける。

### 手動バックアップ

1. `createBackup` を呼ぶ。
2. 成功時は `listBackups` を再取得し、作成ファイル名とサイズを success Alert で表示する。
3. 失敗時は入力・設定 state を保持し、保存先の確認と再試行を促す。

### backup_path 変更

1. native directory picker を開く。
2. operator がキャンセルした場合は何も保存しない。
3. 選択されたディレクトリだけを `updateSetting({ key: "backup_path", value })` で保存する。
4. 保存後に `listBackups` と `getEffectiveBackupDir` を再取得し、新しい保存先の一覧・表示へ切り替える。

### 実効保存先の常時表示（PR #144 follow-up）

1. 画面表示時に `getEffectiveBackupDir` を読み、バックアップ設定カード内の `backup_path` 導線の近くに「現在の保存先」として常時表示する。
2. `backup_path` が空（未設定）の場合、実効パスはアプリ既定フォルダ（Windows では `AppData/Roaming/com.kosei.inventory/backups` 相当）になるため、「保存先が未設定のためアプリ既定フォルダに保存されます」を補足表示する。
3. 取得失敗時は表示行そのものを出さない。手動バックアップ・復元等の他機能は取得失敗の影響を受けない。
4. `backup_path` 保存成功後は本 query を invalidate し、新しい実効保存先へ表示を追随させる。

### PC の外の控え（D-114、UI-11b-D14）

1. 画面表示時に `getOffsiteBackupStatus` を読み、「PC の外の控え」の card に状態を出す（§68.9 の文言）。
2. 「この USB メモリを控えの保存先にする」は native directory picker を開き、選んだ path を `prepareOffsiteMedium` に渡す。cancel は何もしない。成功時は status を invalidate し、「控え N を PC の外の控えの保存先にしました」を success Alert で出す。失敗は `CmdError` の固定の文（43 §43.8.2〜§43.8.5）を card の中に出し、status は変えない。
3. 取得失敗時は card の中に「PC の外の控えの状態を取得できませんでした」と再読込 button を出す。手動バックアップ・復元等の他機能は影響を受けない。

### 復元

1. 一覧行から復元対象を選ぶ。または「控えを選んで確かめる」で native file picker（`.db`）から file を選ぶ（USB メモリの上の控え、新しい PC での復元。UI-11b-D15）。
1a. 選んだ控えに `inspectBackup` を行う（`restore_inspecting`）。`newer_than_app`・`quick_check_ok = false`・`Err` なら `restore_blocked` で固有の文言を出し、復元へ進む button を出さない（UI-11b-D15）。
2. 詳細提示で日時・サイズ・補助的なファイル名 / パスと、確かめの結果（「この控えは戻せます」・商品の数・最後の記録の日時）を表示し、「この時点の状態に戻ります。この控えより後に記録した内容は消えます」を表示する。
3. 第一段として `createBackup` を自動実行する。成功しない限り通常経路では復元へ進めない。
4. 事前バックアップ自体が失敗した場合だけ、break-glass checkbox「今の状態は保存できませんが、復元を続けます」を表示する。operator が自分でチェックした時だけ最終確認へ進める。
5. 最終確認 AlertDialog で「元に戻せません」と対象日時を再掲し、実行ボタンのラベルに対象日時を含める。
6. `restoreBackup({ backup_path })` を呼ぶ。
7. 成功時は React Query cache を `invalidate` ではなく全消去し、ホームへ遷移して success Alert を出す。プロセス再起動は求めない。
8. 失敗時は `CmdError.message` と double failure 判定に従って、recoverable failure または restart-required failure を表示する。

## 68.5 Design Decisions

| Decision ID | Decision | Rationale / source |
|---|---|---|
| UI-11b-D2 | 復元前の事前バックアップは強制。`createBackup` 成功前に通常の復元へ進めない。例外は事前バックアップ失敗時だけの break-glass checkbox。 | D-032。通常経路の安全策を弱めず、DB 破損復旧だけを残す。 |
| UI-11b-D3 | 確認は 2 段。一覧選択後の詳細提示と、最終確認 AlertDialog。復元実行ボタンのラベル自体に対象日時を含める。 | D-032。3 段以上は儀式化するため採用しない。 |
| UI-11b-D4 | 復元成功後は React Query cache を全消去し、ホームへ遷移し、成功 Alert を出す。アプリ再起動は不要。 | DB 全体が入れ替わるため invalidate では不足。backend は成功時に新接続を返す。 |
| UI-11b-D5 | restore 失敗 + 退避復元も失敗した double failure は、DSR-03 上部帯の全画面 destructive Alert、restart guidance、画面内操作 disabled で扱う。ページ離脱の強制ブロックはしない。 | 再起動が唯一の解であり、強制ブロックより誘導文言を優先する。 |
| UI-11b-D6 | `backup_enabled` / `backup_time` / `backup_path` / `backup_retention_days` は UI-11b が所有する。 | operator のメンタルモデルは「バックアップのことはバックアップ画面」。UI-11a は業務パラメータのみ。 |
| UI-11b-D7 | バックアップ一覧は和式日時を主情報、MB サイズを副情報、行ごとの復元導線、先頭行 `最新` Badge とする。ファイル名・絶対パスは主表示にしない。 | ファイル名やパスより「いつの控えか」が operator の判断軸。 |
| UI-11b-D8 | `backup_path` 変更は native directory picker のみ。自由入力は不可。現在の保存先は表示のみ。 | PR #125 の file dialog 移行前例に合わせ、WebView path 入力の誤操作を避ける。 |
| UI-11b-D9 | `checkAutoBackup` の呼出しは共通レイアウトが mount する `useAutoBackupCheck` の 60 秒 interval（画面に依らない）で frontend に実装済み（UI-11b-D13）。`true` の時は backup list を invalidate/refetch し、完了 toast を表示する。 | 自動バックアップの実行結果を一覧と利用者通知へ反映する契約。backend / binding も実装済み。 |
| UI-11b-D10 | Windows native L3 で、手動バックアップファイル、復元によるデータ切替、復元前自動バックアップ、backup_path 変更後出力を目視確認する。double failure は自動テスト + 文言目視のみ。 | ファイル実体と DB 入れ替わりは native runtime でしか最終確認できない。 |
| UI-11b-D11 | 復元成功の success Alert はホーム遷移後に表示する one-shot 通知とし、受け渡しは frontend の in-memory flag で行う。router / history state・URL search param は使わない。ホーム component は **mount 時に一度だけ** flag を component-local 表示 state へ取り込み（取り込みと同時に flag を消去）、**その mount 中は Alert を表示し続ける**（他 query の更新や再 render で消さない）。非表示になるのは unmount 後の再訪・reload・アプリ再起動・通常到達（flag なし）のみ。React StrictMode の二重 mount でも表示される Alert は 1 個。navigate が reject された場合は flag を消去し、次回ホーム到達で誤表示しない。復元失敗時は flag を set しない。 | history.state 経由は reload / 履歴再訪で残存し one-shot 性の証明が実装依存になる。in-memory は消滅が構造的に保証される。render 中の module read で consume する実装は StrictMode の discard render が flag を消費し Alert 不可視になり得るため、mount 時取り込み + mount 中表示維持を契約とする（表示寿命を規定しないと PR #144 L3「toast 見落とし」問題を再生産する）。D4 / F6 の「遷移先で success Alert」契約の実装機構を固定する。 |
| UI-11b-D12 | 復元成功 Alert を表示する mount effect は、D11 の one-shot flag を component-local state へ取り込んだ時に `scrollPageToTop()` を呼び、Alert の初期可視性を保証する。flag なしの通常 Home 到達では scroll しない。後続の実装 PR はこの negative test を完了条件とする（DSR-17 分類③）。 | 成功 Alert が下部 scroll 位置のまま画面外になる owner Windows native L3 P2（2026-08-29）。D11 の Alert 表示契約に可視性保証が欠けていた。 |
| UI-11b-D13 | 自動バックアップの確認（71 §71.8 のフロントエンドタイマー）は `useAutoBackupCheck`（backup-restore feature）が持ち、共通レイアウト（UI-12 `RootLayout`）が 1 回 mount する。mount 時に 60 秒の interval を 1 本張り、unmount で外す。mount の瞬間には呼ばない（起動時の確認は Rust の setup hook が持つ）。バックアップ画面は自分の interval を持たない。**実行中の guard**: 前の回の `checkAutoBackup` が解決するまで次の回は呼ばない（backend の Mutex は DB 処理を直列にするが、command の呼出しの積み上がりは防がない）。**通知**（owner 決定 2026-09-25 = (a)）: `true` なら backup list を invalidate し成功 toast `自動バックアップを作成しました`（当日のバックアップが無いときの即時作成を含め、1 日に数回まで）。`false` は何もしない。失敗は連続失敗の最初の 1 回だけ toast `自動バックアップ確認に失敗しました`（id `backup-auto-check-error`）、`true` / `false` が返れば連続失敗を解く。**復元の間の停止**: `BackupRestorePage` は `commands.restoreBackup` を呼ぶ前に `suspendAutoBackupCheck()` を呼ぶ（実行中の確認の解決は待たない）。停止の flag と世代番号は module scope の in-memory state（UI-11b-D11 と同じ形、reload / 再起動で初期値）で、停止のたびに世代番号を 1 進める。確認は呼ぶ時点の世代を控え、結果（`true` / `false` / 失敗）が届いた時点の世代と違えばその結果を捨てる（invalidate・toast・連続失敗の更新をしない。捨てたときも実行中の guard は解く）。停止の前に始まった確認の結果は、停止中に届いても、停止 → 復元 → 再開の後に届いても捨てられる。復元の結果が `restore_failed_unrecoverable` / `restore_durability_unknown` の 2 種なら止めたまま（再起動まで）、それ以外（成功・`restore_failed_recovered` などの fatal でない Err・IPC の例外）は `resumeAutoBackupCheck()` で再開する（世代番号は戻さない）。 | 71 §71.8 は画面に依らない 60 秒ごとの確認を定めるが、確認がバックアップ画面を開いている間しか動かず、設定時刻のバックアップが取れない日が残っていた。全 route の親である共通レイアウトに置けば test で配線を確かめられる。結果が届いた時点で停止中かだけを見ると、再開の後に届いた古い `true` が成功 toast と一覧の invalidate を起こすため世代番号で比べる。棄却: §71.8 を実装に合わせて弱める / `main.tsx` に置く（配線を source 文字列でしか確かめられない）/ 実行中の確認の解決を待ってから復元する（待機中の確認は lock を取るまで file に触れず、結果を捨てれば足りる）/ 失敗を毎分 toast（売上の入力中などに毎分出る）。 |

| UI-11b-D14 | 「PC の外の控え」の card を設定の card の後に置く（D-114）。主情報は状態の 1 行: 用意の前「PC の外の控えはまだ用意されていません。USB メモリを差して「この USB メモリを控えの保存先にする」を押してください。」／ 写せた後「最後に PC の外へ写した控え: 10月7日 9:01（控え 1、確かめ済み）」／ 用意したがまだ写せていない「まだ PC の外へ写せていません」。`stale` なら warning の Alert「PC の外の控えが {N} 日写せていません。USB メモリが差してあるか確かめてください。」（一度も写せていなければ「PC の外の控えがまだ写せていません。USB メモリが差してあるか確かめてください。」）。副情報: 差してある媒体（「差してある控え: 控え 2」／「用意した USB メモリが差さっていません」）と、`last_failure_kind` の固定の文（43 §43.8.2〜§43.8.5 の表）。button は「この USB メモリを控えの保存先にする」と「控えを選んで確かめる」。媒体の path は補助テキスト | owner 決定（2026-10-07、repo 外の回答台帳 TD-190 の Q4）「確かめて画面に出す」。PC の中の backup の成功と PC の外の保全の成功を分けて見せる（同じ「最新」Badge にまとめると、USB が抜けていても安心して見える）。札の名前（控え N）は入れ替えの運用で、どの媒体が差してあるかを目で合わせるため。棄却: PC の中の一覧に PC の外の列を足す（行は PC の中の file で、PC の外の写しと 1 対 1 でない）／ 媒体の file の一覧を出す（運用者の判断は「最後に写せた日」だけで足りる） |
| UI-11b-D15 | 復元の詳細へ進む前に `inspectBackup` で控えを確かめる（71 MNT-01-D9）。入口は一覧の行と「控えを選んで確かめる」（native file picker、`.db`）の 2 つで、後は同じ state machine（§68.7）を通る。止める文言: 新しすぎる版「この控えは、より新しい版のアプリで作られています。この版のアプリでは戻せません。新しい版のアプリを入れてから戻してください（今のデータは変わっていません）。」／ 壊れた控え「この控えは壊れているため戻せません。別の控えを選んでください。」／ 読めない控え「この控えを読めませんでした。別の控えを選んでください。」。戻せる控えは「この控えは戻せます」と、商品の数・最後の記録の日時（取れたときだけ）を詳細に添える。止めた控えでは事前バックアップを作らず、復元の button を出さない。確かめた後の差し替えの失敗（MNT-03-D11 の最後の守り）は今の `restore_failed_recovered` の表示のまま | 新しすぎる版の backup の復元が「もう一度お試しください」になり、何度試しても失敗する理由が伝わらなかった（`docs/backlog.md` の「保存と起動の守りの follow-up」の (2)）。新しい PC での復元（71 §71.13）は今の一覧（PC の中の保存先）に媒体の控えが出ないので、file を選ぶ入口が要る。「控えを選んで確かめる」と「戻す」を 1 つの入口にし、確かめるだけなら詳細を見て閉じればよい（復元は 2 段の確認〈UI-11b-D3〉が守る）。棄却: 新しい error kind で復元の後に知らせる（MNT-01-D9 の棄却案）／ 「確かめる」と「ファイルから戻す」を別の button にする（同じ選択と確かめを 2 か所に置く） |
| UI-11b-D16 | 共通レイアウトの確認（UI-11b-D13 の `useAutoBackupCheck`）は、`checkAutoBackup` の結果が届いた後（成否に依らず）に同じ回の中で `checkOffsiteBackup` を呼ぶ。mount の瞬間にも 1 回だけ `checkOffsiteBackup` を呼ぶ（起動直後に写し、ホームの知らせが連休明けに出続けないため。`checkAutoBackup` は mount で呼ばない UI-11b-D13 のまま）。実行中の guard・停止・世代番号は UI-11b-D13 と同じものを使う（復元の間は写さない）。結果: `copied` なら PC の外の控えの status を invalidate する（成功の toast は出さない。画面とホームの日時が知らせる）。失敗は連続失敗の最初の 1 回だけ toast「PC の外の控えを写せませんでした」（id `backup-offsite-error`）と status の invalidate。`not_prepared` / `no_local_backup` / `medium_missing` / `up_to_date` は何もしない | 自動バックアップの確認と同じ場所・同じ停止の仕組みに置けば、復元との競合の守りを二重に持たない。毎日の成功を toast にすると営業中に毎朝出る（UI-11b-D13 の成功 toast は自動バックアップの作成に限る）。媒体が抜けているだけでは toast にせず、日数で知らせる（ホーム UI-00-D12、本書 D14）。棄却: 自動バックアップの command の中で写す（DB の Mutex を持ったまま数秒の copy をする）／ 別の interval を張る（停止と世代番号を二重に持つ） |

## 68.6 Route / Components

| 要素 | 設計 |
|---|---|
| Route | `/settings/backup` は実装済み。`src/config/navigation.ts` の `ui-11b` も active 化済み。 |
| Page | `BackupRestorePage` |
| Components | `BackupSettingsPanel`, `ManualBackupPanel`, `BackupListTable`, `RestoreDetailPanel`, `RestoreConfirmDialog`, `BackupPathPicker`, `RestoreFatalAlert`, `OffsiteBackupPanel`（D-114） |
| Query hooks | `useBackupSettings`, `useBackupList`, `useEffectiveBackupDir`, `useCreateBackup`, `useUpdateBackupSetting`, `useRestoreBackup`, `useAutoBackupCheck`, `useOffsiteBackupStatus`・`usePrepareOffsiteMedium`・`useInspectBackup`（D-114） |
| Native API | `@tauri-apps/plugin-dialog` の directory picker（保存先・USB メモリ）と file picker（「控えを選んで確かめる」、`.db`）。自由入力 path は置かない。 |

## 68.7 State Machine

| State | Entry / action | Next | UI behavior |
|---|---|---|---|
| `loading` | `getSettings` + `listBackups` | `ready` / `load_error` | skeleton または progress を表示。 |
| `ready` | 初期表示完了 | `creating_backup` / `path_selecting` / `restore_inspecting` / `offsite_preparing` | 設定、手動作成、一覧、復元導線、PC の外の控えを操作可能。 |
| `offsite_preparing` | directory picker → `prepareOffsiteMedium` | `ready` | cancel は state 変更なし。成功・失敗とも `ready` へ戻り、結果を card の中に出す（D-114、UI-11b-D14）。 |
| `restore_inspecting` | 一覧行の選択、または「控えを選んで確かめる」の file picker → `inspectBackup` | `restore_detail` / `restore_blocked` / `ready` | file picker の cancel は `ready`。確かめの間は復元の導線を disabled（D-114、UI-11b-D15）。 |
| `restore_blocked` | 新しすぎる版・壊れた控え・読めない控え | `ready` / `restore_inspecting` | 固有の文言（UI-11b-D15）。復元の button を出さず、事前バックアップを作らない。 |
| `creating_backup` | 手動 `createBackup` | `ready` / `backup_error` | 画面内の destructive ではない操作を一時 disabled。 |
| `path_selecting` | directory picker | `ready` / `path_update_error` | cancel は state 変更なし。 |
| `restore_detail` | 確かめで戻せると分かった控え（一覧行・選んだ file） | `pre_restore_backup` / `ready` | 対象日時・サイズ・確かめの結果・「この控えより後に記録した内容は消えます」を表示。 |
| `pre_restore_backup` | 自動 `createBackup` | `restore_confirm` / `pre_backup_failed` | 成功しない限り通常復元へ進めない。 |
| `pre_backup_failed` | 事前バックアップ失敗 | `restore_confirm` / `restore_detail` | break-glass checkbox を表示。checkbox 未チェックでは進行不可。 |
| `restore_confirm` | 最終 AlertDialog | `restoring` / `restore_detail` | 「元に戻せません」と日時を再掲。実行ボタンに日時を含める。 |
| `restoring` | `restoreBackup` | `restore_succeeded` / `restore_failed_recovered` / `restore_failed_unrecoverable` | 画面内操作を disabled。 |
| `restore_succeeded` | CMD が Ok を返す | home route | Query cache を `clear` し、ホームへ遷移して success Alert（one-shot、UI-11b-D11）。 |
| `restore_failed_recovered` | CMD が **recoverable 分類**の Err を返す（DB 接続再確立済み） | `ready` | 復元失敗を表示し、一覧を再取得して再試行可能にする。 |
| `restore_failed_unrecoverable` | CMD が **unrecoverable 分類**の Err を返す | terminal | DSR-03 上部帯の full-page destructive Alert、全操作 disabled、「アプリを閉じて、もう一度開いてください」。 |

`restore_backup` の MNT 層は失敗時に DB ファイルを退避から戻すが、有効な接続は返さない。CMD 層は `match` で処理し、「退避復元済み」の失敗に限り **create 能力のない open**（71 §71.7 MNT-01-D4）で再接続を試み、成功すれば recovered connection を Mutex に戻してから Err を返す。UI はこの recoverable failure を通常の再試行可能エラーとして扱う。復元後の状態が確定できない失敗、または no-create 再接続に失敗した double failure が restart-required 状態である（create 能力のある `init_database` を復旧再接続に使うと、main 不在時に空 DB が作られ recoverable に偽装される — MNT-01-D4 参照）。

recoverable / unrecoverable の判別は **CMD が返す構造化された `CmdError.kind`** で行う。確定値は `restore_failed_recovered` / `restore_failed_unrecoverable` / `restore_durability_unknown` であり、**エラーメッセージ文字列の部分一致に依存しない**（順 8 = P3-4 の error 表示統一と前方互換）。D-061（順14）により kind は generated enum `CmdErrorKind` へ型強化済みだが、restore 3 値の値・wire 文字列表現・terminal / recoverable 分岐・表示文言・error_id 併記契約はすべて不変であり、frontend の判別は bindings 由来 literal union を使う。unrecoverable 分類内でも表示文言は結果確定度で異なる — 復元結果が durability 不明のケース（71 MNT-01-D5 (e)(ii)）は失敗を断定せず「復元が完了したか確定できませんでした。アプリを再起動してください。」とし、結果は再起動後の reconcile が確定し、確認手段は §68.11 の best-effort 契約（操作ログが第一手段、記録系障害の持続時は復元対象日時のデータ内容確認）に従う（state machine への影響なし、terminal 分岐のまま。Codex 第 8 round P2-2）。文言（「アプリを再起動してください」等）は表示専用とし、frontend テストも識別子で固定する（PR #14 Codex 再々レビュー P2-2）。

restore_* 3 kind の表示（recoverable の定型 message、fatal Alert）には `CmdError.error_id`（40-cmd-product.md 5.3 CMD-ERR-D1）を「（エラーID: …）」として併記する（監査是正 順8 / D-053）。error_id は診断ログ突合のための correlation 情報であり、本節の文言設計・state machine・recovery 導線は不変。restore_* の表示所有権は本節にあり、共通 `describeError`（UI_TECH_STACK §6.4 UI-ERR-D1）は restore_* 表示には使わない。error_id が欠落した payload では ID 節を省略する。error_id は既存の固定文言と同一テキストノードに結合せず、別要素（例: Alert 内の別 `<p>`）で併記し、既存の完全一致 assertion の書換え範囲を最小化する。

## 68.8 Command Contract

| UI action | Command | Contract note |
|---|---|---|
| 初期設定読込 | `commands.getSettings()` | `AppSetting[]` から backup 系 4 key を抽出する。不明 key は無視。 |
| 設定保存 | `commands.updateSetting({ key, value })` | UI-11b は backup 系 key だけを保存する。`backup_path` は native picker 由来のみ。 |
| 操作ログ補助表示 | `commands.listLogs(query)` | full 操作ログ画面は UI-11c。UI-11b では backup 操作の直近表示に限定する。 |
| 手動 / 事前バックアップ | `commands.createBackup()` | `BackupResult` の `file_name` と `size_bytes` を表示。`file_path` は詳細/補助表示のみ。 |
| 自動バックアップ確認 | `commands.checkAutoBackup()` | 共通レイアウトが mount する `useAutoBackupCheck` の 60 秒 interval（画面に依らない）で呼び、`true` の時は一覧を再取得する（UI-11b-D13）。 |
| 一覧読込 | `commands.listBackups()` | `created_at` は `YYYY-MM-DD HH:MM:SS` 文字列。UI で和式日時へ整形する。 |
| 復元 | `commands.restoreBackup({ backup_path })` | 成功時は new DB connection が Mutex に入る。失敗時も CMD が再接続を試み、二重失敗では再起動文言を含む Err を返す。 |

## 68.9 UI / Wording

- 画面タイトル: `バックアップ・復元`
- ページ説明（① 説明セクション使用パターン、[02-component-catalog.md](../design-system/02-component-catalog.md) ①）: アプリのデータ全体をまとめて保存し、必要なときに元に戻すためのページです。自動バックアップの時刻を設定したり、今すぐ手動でバックアップを作成したり、保存先を選んだりできます。過去のバックアップから復元すると現在の記録は元に戻せませんが、復元の前には自動で今の状態のバックアップが作られます。
- 手動バックアップ button: `今すぐバックアップを作成`
- 保存先表示: `現在の保存先`（`getEffectiveBackupDir` が返す実効パスを表示。`backup_path` 未設定時は「保存先が未設定のためアプリ既定フォルダに保存されます」を補足）
- 保存先変更 button: `保存先を選ぶ`
- backup_path は表示専用。絶対パスは小さめの補助テキストにし、主情報にしない。
- 一覧主表示: `7月3日 21:00` のような和式日時。先頭行に `最新` Badge。
- サイズ表示: `12.4 MB` のような人間可読 MB。
- 復元詳細文言: `この時点の状態に戻ります。この控えより後に記録した内容は消えます`
- break-glass checkbox: `今の状態は保存できませんが、復元を続けます`
- 最終確認 title: `元に戻せません`
- 復元実行 button: `7月3日 21:00 の控えに戻す`
- double failure: `アプリを閉じて、もう一度開いてください`
- PC の外の控え（D-114、UI-11b-D14〜D16）: card の見出し `PC の外の控え`、button `この USB メモリを控えの保存先にする`・`控えを選んで確かめる`、用意の成功 `控え N を PC の外の控えの保存先にしました`、状態の文と止める文言は UI-11b-D14・D15、写せなかった toast `PC の外の控えを写せませんでした`、取得失敗 `PC の外の控えの状態を取得できませんでした`。
- 状態は色だけで表さない。`最新`、`保存先`、`復元できません`、`再起動が必要です` の日本語ラベルを主情報にする。PC の外の控えの古さも日数の文で表す（warning の色だけにしない）。

## 68.10 Query Invalidation

| Event | Query handling |
|---|---|
| 設定保存成功 | backup settings query を invalidate。`backup_path` 変更時は backup list と実効保存先（`getEffectiveBackupDir`）も invalidate。 |
| 手動 `createBackup` 成功 | backup list を invalidate/refetch。 |
| `checkAutoBackup` が `true` | backup list を invalidate/refetch し、成功 toast を出す（共通レイアウトが mount する `useAutoBackupCheck` の 60 秒 interval（画面に依らない）、UI-11b-D13）。 |
| `checkOffsiteBackup` が `copied` または失敗 | PC の外の控えの status（`getOffsiteBackupStatus`）を invalidate（ホームの知らせも同じ query key。UI-11b-D16）。 |
| `prepareOffsiteMedium` 成功 | 同じ status を invalidate。 |
| 復元成功 | PC の外の控えの status も `queryClient.clear()` で消える（status は DB の外の file から読み直すので、復元で値は変わらない。71 §71.11.1）。 |
| 復元成功 | React Query cache を `queryClient.clear()` で全消去。DB が丸ごと変わるため invalidate ではなく clear。 |
| 復元成功後 | home route へ遷移し、遷移先で success Alert を出す。 |
| 復元失敗 recovered | cache 全消去はしない。backup settings/list を refetch し、再試行可能なエラーとして表示する。 |
| 復元失敗 unrecoverable | cache 操作より restart guidance を優先し、画面内操作を disabled にする。 |

## 68.11 Error / Recovery

| Error | Recovery |
|---|---|
| 初期読込失敗 | 設定/一覧の再読込 button を出す。 |
| 手動バックアップ失敗 | 保存先確認と再試行を促す。入力済み設定は保持する。 |
| backup_path 保存失敗 | 選択した path は未保存として扱い、現在の保存先表示を維持する。 |
| 実効保存先取得失敗 | 「現在の保存先」表示行のみ非表示。手動バックアップ・復元等の他機能は継続して操作できる。 |
| backup list 空 | `まだバックアップはありません` と表示し、手動作成導線を残す。 |
| PC の外の控えの status 取得失敗 | card の中だけに取得失敗と再読込 button。他の card は操作できる。 |
| USB メモリの用意の失敗 | card の中に固定の文（43 §43.8.2〜§43.8.5 の表。レジの SD・USB メモリでない・空きなし・写せない・記録を読めない）。status は変えない。 |
| 控えの確かめで止めた（新しすぎる版・壊れた・読めない） | `restore_blocked` の固有の文言（UI-11b-D15）。一覧へ戻って別の控えを選べる。 |
| 事前バックアップ失敗 | 通常復元は block。DB 破損復旧シナリオとして break-glass checkbox を明示した時だけ進める。 |
| restore 失敗 recovered | `バックアップの復元に失敗しました。現在のデータには戻しています。もう一度お試しください。` を表示し、操作可能状態へ戻す。 |
| restore 失敗 unrecoverable | full-page destructive Alert。`バックアップの復元に失敗し、DB接続の復旧もできませんでした。アプリを閉じて、もう一度開いてください。` と表示し、画面内操作を disabled。 |
| restore 結果 durability 不明（71 MNT-01-D5 (e)(ii)） | full-page destructive Alert（unrecoverable と同じ terminal 分岐）。ただし失敗を断定せず `復元が完了したか確定できませんでした。アプリを閉じて、もう一度開いてください。` と表示。結果は再起動後に確定し、完了していた場合は**通常は**操作ログに復元完了（起動時確定）が記録される（記録は best-effort — 記録系の障害が続く場合は現れないことがあり、その場合は復元対象日時のデータ内容で確認する。71 の補完処理契約参照）。 |

復元成功後に真の Undo は存在しない。MNT 層の `.restore_backup` 退避ファイルは成功後に削除されるため、UI は「元に戻せる」印象を与えない。

## 68.12 Windows Native L3

| ID | 確認項目 | 合格基準 |
|---|---|---|
| UI-11b-L3-1 | 手動バックアップ実行 | `createBackup` 成功後、一覧に新しい和式日時行が追加され、保存先ディレクトリに `inventory_backup_YYYYMMDD_HHMMSS.db` が実在する。 |
| UI-11b-L3-2 | 復元実行 | テスト DB で商品数など目視可能な差分を作り、復元後にデータが選択バックアップ時点へ切り替わったことを確認する。 |
| UI-11b-L3-3 | 復元前自動バックアップ | 復元操作の第一段で新しい backup file が作成され、そのファイル実体を保存先で確認できる。 |
| UI-11b-L3-4 | backup_path 変更 | native directory picker で新パスを選び、以降の手動バックアップが新パスへ出力される。 |
| UI-11b-L3-5 | double failure path | 自動テストで状態分岐・文言・操作 disabled・60秒 interval 停止（UI-11b-D13 の停止を指す。共通レイアウトの確認が再起動まで止まったままになる）を担保する。実機での誘発は求めない。 |
| UI-11b-L3-6 | USB メモリの用意と写し（D-114） | 用意の前の文が出る → USB メモリを差して用意 → card に「最後に PC の外へ写した控え: 今日の日時（控え 1、確かめ済み）」が出て、USB メモリの `InventoryBackup` に目印と正式名の `inventory_backup_YYYYMMDD_HHMMSS.db` がある（`.partial` が残らない）。 |
| UI-11b-L3-7 | レジの SD を選んだとき（D-114、MNT-01-D10） | レジの SD（または `CASIO\SR500_550_4000` を置いた試しの媒体）を選ぶと「これはレジの SD カードです…」が出て、SD に何も書かれない（前後で SD の一覧が同じ）。 |
| UI-11b-L3-8 | 2 本目の用意と入れ替え（D-114） | 1 本目を抜いてから 2 本目を差し、「控え 2」として用意する（店の PC は空きの USB の口が 1 つで、2 本を同時に差さない。repo 外の回答台帳 TD-198）→「差してある控え: 控え 2」と今日の日時。2 本目を抜いた状態では「用意した USB メモリが差さっていません」。1 本目を差し直すと 60 秒以内に「差してある控え: 控え 1」（drive 文字が変わってもよい）。 |
| UI-11b-L3-9 | 控えを選んで確かめる（D-114、UI-11b-D15） | USB メモリを差し直した後、その最新の控えを選ぶと「この控えは戻せます」と商品の数・最後の記録の日時が出る。閉じても DB は変わらない。 |

L3 証跡に実店舗 DB、実 JAN、実商品名、価格、backup file、log file は入れない。必要な差分確認は synthetic / test DB で行う。

## 68.13 Non-scope

- UI-11a 閾値設定画面。
- UI-11c 操作ログ一覧画面。
- backend `check_auto_backup` の仕様変更（D-114 は今日の backup の判定を正式名だけにした〈MNT-01-D7〉が、画面の契約は変えない）。
- backup retention days の cleanup logic 変更。
- restore_backup 契約の変更（D-114 の確かめ〈UI-11b-D15〉は restore の前に足し、restore の command・error kind・2 段の確認は変えない）。
- 新しすぎる版・壊れた控えを実機で作る manual gate（自動テストで担保。`docs/DEV_WORKFLOW.md` の L3 Eligibility の条件 (3)）。
- PC の外の控えの「古い」の知らせを実機で 3 日待って見る manual gate（状態の file の日時を変える fixture は L3 Eligibility の条件 (3) に当たるので自動テストで担保。文言の目視は runtime の lane の human visual confirmation で扱う）。
- DB 破損状態を実機で意図的に作る manual gate。
