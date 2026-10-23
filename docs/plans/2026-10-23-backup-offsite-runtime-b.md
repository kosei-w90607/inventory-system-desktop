# Plan Packet: PC の外の控えの runtime (b)（USB メモリへ自動で写して確かめ、画面とホームに出し、選んだ控えを確かめる）

wave に属さない単独の lane。D-114（design lane = PR #155、[packet](../archive/plans/2026-10-07-backup-offsite.md)・[Matrix](../archive/plans/test-matrices/2026-10-07-backup-offsite.md)）の runtime を 2 つに分けた後の lane（(b)）。導入の前の関門 3（[Plans の導入の前の関門](../Plans.md#導入の前の関門)）。先の lane (a) は PR #190（branch `agent/backup-offsite-runtime`、packet `docs/plans/2026-10-23-backup-offsite-runtime-a.md`。本 packet は (a) の branch にしか無い file を code span で引く）。owner の決定は repo 外の回答台帳 TD-391（2026-10-23: (a) の Plan Review の間に (b) を先に起票する）。本 lane の branch は main（`eed07d37`）から作り、(a) の merge の後に `origin/main` を単段で取り込む（`docs/DEV_WORKFLOW.md` Wave Operation）。merge は (a) の後。並走の lane は PR #188（`agent/stocktake-count-runtime-b`）と PR #172（`agent/sd-direct-read-runtime`）。

## 規模と手法

**手法: 1 lane・1 PR のまま S1〜S7 の段に積み、横断の約束は下の「横断の約束」の 1 つの表に先に置く。** (b) をさらに分けない。

2026-10-23 に本 worktree（HEAD `eed07d37`）で数えた:

| 区分 | (b) | command と出力 |
|---|---|---|
| 触る正本 | 起票の commit で 71（§71.10 の作り直しの行・§71.11.4 のエラーの表・§71.11.5a 手順 7）、68（UI-11b-D14 の (5)・§68.9）、53（UI-00-D12 の (5)・更新履歴）。J1 の commit（TD-398）で 71（§71.10・§71.11.1・§71.11.2 手順 3c・§71.11.3・§71.11.4 手順 3 とエラーの表・§71.11.5c・§71.11.7・MNT-01-D11）、43（エラーの写像の表・DTO の形・§43.8.8・§43.11）、68（UI-11b-F3・§68.3・§68.4 の backup_path 変更・UI-11b-D14 の (4)・§68.7・§68.8・§68.11・§68.12）、53（UI-00-D12 の (4)・更新履歴）、`docs/decision-log.md`（D-130）。実装の commit で 71（§71.1）・68（前文）・53（§53.1）・43（§43.11）・22（§16 の folder の外の場所）・`docs/FUNCTION_DESIGN.md`（MNT-01 の索引の行）の「後続の lane」の注記 | 下の AC7 の `rg` の baseline（8 行） |
| 画面 | 2（UI-11b `/settings/backup` の「PC の外の控え」の card と「控えを選んで確かめる」の入口、UI-00 ホームの知らせ） | 68 §68.6・53 §53.1 の実読 |
| wire の型 | 新しい型 6（`PrepareOffsiteMediumRequest`・`OffsiteMediumView`・`OffsiteCheckResult`・`OffsiteBackupStatus`・`OffsiteFailureKind`〈8 値〉・`BackupDirChoiceRequest`〈J1、D-130〉。残りの 2 つは (a)） | `rg -o 'PrepareOffsiteMediumRequest\|OffsiteMediumView\|OffsiteCheckResult\|OffsiteBackupStatus\|OffsiteFailureKind\|BackupDirChoiceRequest' docs/function-design/43-cmd-settings-log.md \| sort -u \| wc -l` → `6` |
| Tauri command | 新設 6（43 §43.8.2〜§43.8.4・§43.8.6〜§43.8.8。§43.8.5 の `inspect_backup` は (a)。§43.8.8 の `check_backup_dir_choice` は J1〈D-130〉） | `rg -c '^\| 43\.8\.[2-7] \|' docs/function-design/43-cmd-settings-log.md` → `6`（うち (a) 1）、`rg -c '^### 43\.8\.8 ' docs/function-design/43-cmd-settings-log.md` → `1` |
| Windows API | 新しく使う 4 種（`GetLogicalDrives`・`GetDriveTypeW`・`GetFileAttributesW`・`SetThreadErrorMode`）。(a) が置く `pin_to_volume`（`GetFullPathNameW`・`CreateFileW`・`GetFinalPathNameByHandleW`）と上書きしない公開（`MoveFileExW`）を媒体の root にも使う | `rg -o 'GetLogicalDrives\|GetDriveTypeW\|GetFileAttributesW\|SetThreadErrorMode' docs/function-design/71-mnt-backup.md \| sort \| uniq -c` → 4 種。同じ式を `src-tauri/src` に当てると出力なし・`exit=1` |
| test の設計の行 | design の Matrix の Test Matrix 68 行のうち 50 行（MNT-01-D8 の 35、`MNT-01-D10 / D8` 1、43 の 4、UI-11b-D14 の 4、UI-11b-D15 の 2〈file の入口と D16 との組〉、UI-11b-D16 の 3、UI-00-D12 の 1）と、本 packet で足す行 | `rg -c '^\| MNT-01-D8' docs/archive/plans/test-matrices/2026-10-07-backup-offsite.md` → `35`、同じく `'^\| MNT-01-D10 / D8'` → `1`、`'^\| 43 §'` → `4`、`'^\| UI-11b-D14'` → `4`、`'^\| UI-11b-D15'` → `3`（うち一覧の行の 1 は (a)）、`'^\| UI-11b-D16'` → `3`、`'^\| UI-00-D12'` → `1` |
| 予定 path | 34（新設 9 を含む。J1 の commit で `docs/decision-log.md` を足した。下の Scope の表） | `` sed -n '/^\| file \| 段 \| 変更 \| 他 lane との重なり \|/,/^$/p' docs/plans/2026-10-23-backup-offsite-runtime-b.md \| tail -n +3 \| cut -d'\|' -f2 \| grep -o '`[^`]*`' \| sort -u \| wc -l `` → `34`（`.test.ts`・`.test.tsx` の略記はそれぞれ 1 file）。下の「並走との重なり」の入力 |
| 横断の約束がかかる経路 | 8（J1 の保存先の選択の確かめを足した） | 下の「横断の約束」の表の行 |

手法の選び方（3 つの案を現物に当てた）:

- さらに 2 つに分ける（例: 用意・写し・card を先、ホームの知らせ・作り直し・やめる・file の入口を後）: 先の lane だけの版は、用意した後に記録の file が読めなくなると画面から直せず（UI-11b-D14 の「記録を作り直す」が無い）、USB の控えをやめる操作も無い（TD-381 の「任意」が画面で成り立たない）。媒体が抜けたまま過ぎる日を店主に届けるのはホームの知らせ（UI-00-D12）だけで、先の lane だけでは黙って過ぎる。どれも D-127（その場で直せる・黙って通さない）に反する版になる。L3 も 2 回になり、2 つは `src/lib/bindings.ts`・`src-tauri/src/lib.rs`・`BackupRestorePage.tsx` を共有するので束ねられない（D-124）。owner は 2026-10-21 から数日、手が使いにくい。
- 層で分ける（Rust を先、画面を後）: (a) の packet の「規模と手法」と同じ理由で採らない（媒体の列挙・`SetThreadErrorMode`・reparse point の判定は Windows でしか通らず、画面の無い lane は実機で 1 度も通さずに merge する）。
- 採った案（1 lane のまま段に分ける）: PC の外の控え（MNT-01-D8）は 1 つの機能で、card・ホーム・作り直し・やめるは同じ状態の file（`offsite-backup.json`）と同じ status の query を読む。段の境で対象の test を通し、横断の約束（失敗の時点と順序・0 の表示・状態の取り直し）を 1 つの表に先に置いて、各段はその表を引く。Final Review は R4 の Minimum 2（Double Audit）を 1 回で受ける。

関門 3. を満たす全体の順: (a)（PR #190）→ (b)（本 packet）→ 通しの演習（71 §71.13、go-live の前に owner が別の PC で）。

## (a) への依存

(b) は (a) が置く共有の関数と画面の部品の上に立つ。(a) は Plan Review round 1 の指摘（reject）の是正を `b8b201a5` に積み、次の round の判定の前にある。下の表の「(a) の形」の列は `b8b201a5` の (a) の packet の Scope と正本（71 §71.12 手順 1、68 UI-11b-D15・§68.7・§68.9・§68.10）で読んだ形で、round 1 で揺れていた 3 つ（URI の符号化、共通の確認の止め方と再開、`restore_detail` の部品と文言）は正本の文になった。(b) の branch は (a) の merge の後に `origin/main` を単段で取り込み、その時点の (a) の形に (b) の Scope・Matrix・AC の該当の行を当て直す（当て直しが契約を変えるなら Gated Amendment）。(b) の plan-gate → plan-approved は (a) が plan-approved に達した後に行う（防ぐ失敗: (a) の次の round で変わった契約を (b) の承認済みの packet が引き続け、承認の後に Gated Amendment が要る）。

| (a) が置くもの | (a) の形（`b8b201a5`） | (b) の使い方 | 当て直しの観点 |
|---|---|---|---|
| `inspect_backup` の open の URI の組み方 | 確定（71 §71.12 手順 1）: `backup_path` の文字列（Windows は `\` のまま）の `%`・`?`・`#` を 1 回の走査で `%25`・`%3f`・`%23` に置き換え、`file:` と `?immutable=1` を付けて `SQLITE_OPEN_READ_ONLY \| SQLITE_OPEN_URI` で開く。(a) の test `test_inspect_backup_req901_d9_uri_escapes_path_chars` | §71.11.4 手順 3a の写す元の検査（`backup_dir` の正式名）と、「控えを選んで確かめる」で選んだ file（USB の上の drive 文字の path）。どちらも (a) の `inspect_backup` を呼び、(b) は URI を組まない | Matrix の行 `test_check_offsite_req901_d8_source_path_with_uri_chars_is_inspected` は、手順 3a が共有の `inspect_backup` を通ることを `#`・`%` を含む `backup_dir` で確かめる（独自の open を書くと red） |
| 共通の確認の停止と待ち | 確定（(a) の Scope の S4）: 実行中の回の promise を module scope の `let inFlight: Promise<void> \| null` に持ち、`suspendAutoBackupCheckAndWait = async () => { suspendAutoBackupCheck(); await inFlight; }`。実行中の回が無い・hook が mount されていないときはすぐ解決する。(a) では回の中身は `checkAutoBackup` だけ | 同じ回の promise の中で `checkAutoBackup` の結果の後に `checkOffsiteBackup` を呼ぶ（UI-11b-D16）。mount の 1 回の `checkOffsiteBackup` も `inFlight` に入れ、interval の回と同じ guard で重ねない（待つ対象を 1 つに保つ。別の promise を作らない） | S4 の hook の変更を (a) の形の上に足す。待つ対象が `checkAutoBackup` と `checkOffsiteBackup` の両方であること（UI-11b-D15）を Matrix の UI-11b-D15・D16 の行で確かめる |
| 復元の card の部品と文言 | 確定（68 UI-11b-D15・§68.7・§68.9・§68.10）: 1 つの button「閉じる」（`restore_inspecting`・`restore_blocked`・`restore_detail`・`pre_backup_failed` で出し、確かめ・事前バックアップの間は disabled。`restore_blocked` も「閉じる」で、「一覧へ戻る」は無い）。「閉じる」で `ready`・`resumeAutoBackupCheck()`・backup list の invalidate。最終確認の「キャンセル」は `restore_detail` へ戻るだけで再開しない。文言は「控えを確かめています」「この控えは戻せます」「商品の数: N 件」（0 は「商品の数: 0 件」、取れないときは行なし）「最後の記録: 和式日時」（取れないときは行なし） | 「控えを選んで確かめる」の入口が同じ state machine と部品を通る（UI-11b-D15）。(b) が足すのは、作成日時が取れない file の見出しと復元実行 button の file 名の形（本 commit の §68.9）だけ | S5 の file の入口は (a) の部品をそのまま使い、別の部品を作らない。Matrix の file の入口の行と L3-b4 の操作の名前は「閉じる」 |
| 復元の失敗の後の戻り方 | 確定（68 §68.7・§68.4 復元の手順）: `restore_failed_recovered`・IPC の例外の後は復元の card を未選択へ戻す（`setRestoreState(initialRestoreState)`）。再試行は選び直して確かめから | file の入口から選んだ控えでも同じ（再試行は file を選び直す） | S5 で `selected` の型を広げるとき、(a) の戻し方をそのまま使う |
| page の test の `vi.mock("@/lib/bindings")` の既定と D13 の page の test 2 本 | 確定（(a) の Scope の S4）: 両 page の test の `commands` に `inspectBackup: vi.fn()` と戻せる控えを返す既定を足し、「復元の前に発火して待機中の確認の結果は捨てる」の 2 本は削って hook の単体 test と page の新しい行へ移す | 同じ mock に 6 つの新しい command（`checkOffsiteBackup`・`getOffsiteBackupStatus`・`prepareOffsiteMedium`・`resetOffsiteState`・`stopOffsiteBackup`・`checkBackupDirChoice`〈J1。既定は `Ok`〉）の既定を足す | (a) の mock の形の上に足し、(a) の oracle を弱めない |
| `pin_to_volume`・`PinnedPath`（71 §71.4 の「書く先の固定」） | 71 のまま（PR #190 の head `a8285043` でも §71.4 の「書く先の固定」は `b8b201a5` と同じ） | 媒体の root の固定（§71.11.3 の「媒体の固定」）と、J1 の同じ folder の判定の両側（§71.11.3） | (a) の merge の後、`pin_to_volume` の `actual` の形（Windows は volume GUID path、Windows 以外は `canonicalize`）が判定の前提のままかを確かめる |
| file 操作の trait | (a) の Scope の S1 のまま（`mnt/restore.rs` の `RestoreFileOps`・`StdRestoreFileOps` を `mnt` の中で共有し `publish_no_replace` を足す。足した method は既存の注入の型では本物へ委ねる） | 媒体の写しの copy・`sync_all`・読み戻し・公開・親 directory の sync・置き換えの注入（design の Matrix の注入の前提） | (b) が足す操作（copy・読み戻し・作業名への書込み・置き換え・`create_new` の copy）を同じ trait に足す（本番と test で別の判定を作らない） |
| 「使える控え」の判定（71 §71.12）、`read_current_version_without_ddl` の `pub(crate)` | 71 のまま | §71.11.4 手順 3a | — |
| 名前の解析の直し（71 §71.3） | 71 のまま | 媒体の写しの並び・掃除・作業名の掃除 | — |
| レジの SD の folder 名の定数 | `src-tauri/src/io/mod.rs` の `pub(crate) const`（(a) と #172 の packet の取り決め。先に merge した lane が置く） | 媒体の root の判定（MNT-01-D10、§71.11.2 手順 3、§71.11.3） | 先に main に入った定数を使い、文字列を二重に持たない |
| 手動の backup の CMD の写像（43 §43.6 の `pin_backup_dir` → 固定の文） | 43 のまま。(a) の Scope は `create_backup` の command の中で写す形で、helper に括り出すかを決めていない | 43 §43.8.6 の作り直しが先に作る backup の失敗を「§43.6 と同じ写像」で返す | (a) が §43.6 の写像を 1 つの helper にしていればそれを呼び、していなければ (b) で helper に括り出して両方から呼ぶ（写像を二重に書かない） |
| `#[tauri::command(async)]` の最初の command と `syn` の source の検査 | (a) の Matrix の `test_inspect_backup_cmd_req901_runs_off_main_thread`（「(b) は同じ test に残りの 5 command を足す」） | 6 command も `(async)`（J1 の `check_backup_dir_choice` を含む） | 同じ test に 6 command を足す（(a) の文の「5」は J1 の前の数） |
| Contract Probe の P7〜P10 | 4 つとも PASS（owner の Windows の PC、2026-10-23、FAT32 の USB と `%APPDATA%`。exFAT は未測） | 媒体の root の固定、公開、公開の後の親 directory の sync、選んだ file の読取り専用の open | 下の Contract Probe の P4 を閉じ、P11 を狭めた |
| D-114 の注記の (a) の書き分け（71・68・43・`docs/FUNCTION_DESIGN.md`） | (a) の実装の commit で書く（`b8b201a5` では未記入。(a) の「置き換わる注記」は「PC の外の控え（5 つの関数）は後続の (b)」の形を予定） | (b) の実装の commit で残りの「(b) は後続」の文を外す | AC7 の検索の式に (a) が書いた「(b)」の語を足して 0 件にする |

## Workflow State

- Phase: plan-draft
- Risk: R4
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票は本 run。実装の Writer は plan-approved の後に Coordinator が発注で決める）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3 以上）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 2
- Human Gate: ready,merge,manual,r4
- Branch: agent/backup-offsite-runtime-b

遷移の記録:

1. kickoff → spec-check（2026-10-23、Writer）: owner の決定（TD-391）と (a) の packet の「後続の lane」・backlog の「PC の外の控えの runtime」を起点に Scope を (b) に限り、Risk を R4 と記録した（下の Risk）。
2. spec-check → design（2026-10-23、Writer、本 commit）: design の packet の closeout の申し送り (a)（`attached` で (5) の文を分ける）と (b)（成功の記録を置き換えた後の sync の失敗の扱い）は runtime の lane が決めると申し送られ、正本に決まった文が無い。「控えを選んで確かめる」で選んだ file の作成日時が取れないときの表示も正本に無い。本 commit で設計正本を直した（下の「本 commit で変えた正本」）。
3. design → plan-draft（2026-10-23、Writer、本 commit）: 上の 3 つの設計の出力は本 commit の正本にあり、未解決の設計の問いは無い。owner の判断事項 J1（下）は範囲を足すかの問いで、既定（足さない）で設計は足りる。J1 で A を選べば design へ戻る。plan-gate へは Coordinator が進める。
4. plan-draft → design（2026-10-23、Writer、J1 の commit）: owner が J1 に A を答えた（repo 外の回答台帳 TD-398。同じ日の TD-396 の B を置き換えた）。A は失敗の種類・判定の時点と順序・43 の固定の文・画面の原因と直し方の文を正本に足すので、最も早く影響を受ける design へ戻る（`docs/DEV_WORKFLOW.md` Workflow State の「A correction returns explicitly to the earliest affected phase」）。
5. design → plan-draft（2026-10-23、Writer、J1 の commit）: J1 の設計の出力（71 MNT-01-D11・§71.11.2 手順 3c・§71.11.3 の判定・§71.11.4 手順 3・§71.11.5c、43 §43.8.8 とエラーの写像の表、68 UI-11b-F3・§68.4 の backup_path 変更・UI-11b-D14 の (4)・§68.11・§68.12、53 UI-00-D12 の (4)、`docs/decision-log.md` D-130）は同じ commit の正本にあり、未解決の設計の問いは無い（保存先を選ぶ側でも止める判断と理由は下の「owner の判断事項」と MNT-01-D11）。(a) の plan-approved の前に (b) の plan-gate へ進めない条件（上の「(a) への依存」）は変えない。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定。見込み: L3 20 分、判断と承認 10 分）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 2（2026-10-23 の J1 の commit の時点。J1 の 1 回目〈TD-396、B〉と確かめ直し〈TD-398、A〉。TD-391 は lane の選択の前の決定で本 lane に数えない） | 4（R4 の計画の承認 1、L3 1〈控え用の USB メモリの本数の確かめは同じ decision point〉、R4 の承認と Ready 1、merge 1） | 0（L3 の 2 回目の予備を外した。下） | 6 = 2 + 4 + 0 |

J1 の 2 回を別の decision point として数えた理由: `docs/DEV_WORKFLOW.md` Owner Effort Budget は介入を問い合わせの数でなく decision point の数で数え、manual の lane は L3 の round ごとに 1 回を数える。J1 の確かめ直しは、1 回目の答え（B）を受けた後に owner がもう一度判断した別の round で、owner の手間も 2 回かかった（L3 の 2 回目と同じ数え方）。合計が上限の 6 を超える見込み（2 + 4 + 予備 1 = 7）になったので、同節の「上限に届く見込みのとき」に従い、Goal Invariant の最小完了経路（計画の承認・L3 1 回・R4 と Ready・merge）を残し、optional な予備（L3 の 2 回目）を外した。L3 の 2 回目が要るときは、その判断と上限の改定を同じ 1 回で owner に諮る。

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。owner は 2026-10-21 から数日、手が使いにくい。問いは記号か短文で答えられる形にする（下の owner の判断事項、L3 の台本）。Contract Probe の P7〜P10 は (a) が owner に頼んで 2 回とも済んでおり（(a) の介入に数える）、(b) は owner に probe を頼まない（下の Contract Probe）。

## Risk

Risk: R4

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R4 の行（「Destructive data lifecycle, backup restore, …」）に当たる: 取外し可能な媒体へ backup を書き、媒体の上の古い写しを消し（`OFFSITE_KEEP` の掃除）、PC 側の状態の file を退避・置き換え、復元の入口（「控えを選んで確かめる」で選んだ file を復元の流れに入れる）を足す。Final Review Minimum 2、Human Gate `r4`。画面（UI-11b の card と file の入口、UI-00 のホームの知らせ）を足し、Windows でしか通らない code（媒体の列挙・`SetThreadErrorMode`・reparse point の判定・媒体の root の固定）を初めて実機で通すので `manual`（L3）。

この変更でどれかの required gate の green / red が変わるか: 変わらない。classifier の workflow の一覧（`scripts/ci/classify-changes.sh` の `classify_files` の 2 つの `case` の workflow の行）に当たる file を Scope に持たない（下の Scope の表。`src-tauri/tests/design_compliance_test.rs` は `src-tauri/*` の rust の区分）。実装は Rust・frontend・bindings・traceability の既存の job に test を足すだけで、gate の構成と required の名前を変えない。本 commit は docs だけ。

Rollback / recovery notes（R4）:

- (b) の版から前の版（(a) の版、または `eed07d37` の時点の版）のアプリへ戻したとき: (b) が PC の中に足す file は `{app_data_dir}\offsite-backup.json`（状態）と、作り直し・やめるの退避名 `offsite-backup.json.unreadable-*`・`offsite-backup.json.stopped-*` と、状態の作業名だけ。媒体の上には `InventoryBackup\offsite-medium.json`（目印）・規約の名前の写し・残りの作業名 `*.db.partial`。前の版はどれも読まない（前の版の一覧・掃除は `backup_dir` だけを見て、媒体と `app_data_dir` の直下の JSON を見ない）。DB・`app_settings`・`backup_dir` の backup・復元は変わらない。戻した後に残る file は消さなくてよく、再び (b) の版へ上げると同じ目印と状態から続く（design の packet の Rollback notes の申し送りのとおり）。
- 確かめ方: 前の版のアプリを入れ直す実機の手順は求めない（`docs/DEV_WORKFLOW.md` L3 Eligibility の (3)。(a) の Rollback notes と同じ判断）。前の版の code が見る場所に (b) の file が入らないことを、Matrix の rollback の行（`test_offsite_req901_d8_files_outside_previous_version_paths`）が、状態・退避・目印・写しの path が `backup_dir` の外か規約の名前の正式名だけであること（前の版の一覧に数えられても検査済みの backup）で確かめる。
- 戻し方: merge の後に戻すときは (b) の squash commit の revert。DB の migration は無い。

## Goal

Goal Invariant:

### 最小完了条件

- owner がバックアップ画面で USB メモリを「控えの保存先にする」と、媒体に目印と確かめ済みの最新の backup の写しができ、card に「最後に PC の外へ写した控え: 日時（控え N、確かめ済み）」が出る。以後、用意した媒体が差してある間は、起動直後と 60 秒ごとの確認がまだ写していない最新の backup を写して読み戻しで照合する（MNT-01-D8、UI-11b-D14・D16）。
- 写せない日が 3 日続くと、ホームと card が原因ごとの文で知らせ、直し方の操作（差し直す・今すぐバックアップを作成・記録を作り直す・PC の外の控えをやめる）へ導く（UI-00-D12、UI-11b-D14）。
- 「控えを選んで確かめる」で USB の上の控えを選ぶと、復元の前の確かめ（(a) の state machine）に入り、戻せる控えは詳細に、止めた控えは固有の文言になる（UI-11b-D15 の file の入口、71 §71.13 の短い確かめ）。
- USB を用意しない・やめた店では、PC の中の backup とアプリの全機能が (a) の版と同じに動き、PC の外の控えの知らせは出ない（TD-381）。
- PC の中の保存先と USB メモリの `InventoryBackup` を同じ folder にしようとすると、保存先を選ぶ画面と用意の card で書かずに止まり、確認でもその組み合わせを写さずに、card とホームが「保存先を選ぶ」で選び直す直し方を名指す（MNT-01-D11、D-130、TD-398）。
- Windows の実機で、店の型の USB メモリ（FAT32）で、用意・写し・入れ替え・抜いた状態・レジの SD の拒否・控えの確かめ・やめるが設計どおりに見える（L3）。

### 失敗定義

- レジの SD・目印の無い媒体・別の PC で用意した媒体・固定 disk・`InventoryBackup\` の外に書く。探した後に入れ替わった媒体へ書く。媒体の上の reparse point を追って PC の中や別の媒体の file を書く・消す。
- PC の中の保存先が媒体の `InventoryBackup` と同じ folder のときに、用意する・保存する・黙って `UpToDate` を返し続ける。同じ folder を設定の文字列で比べて junction・symbolic link・drive 文字の違いで見落とす。`InventoryBackup` の中の folder や媒体の root を保存先にした組み合わせまで止める。
- 照合していない・照合の失敗した写しを正式名にする。写す元が「使える控え」でないのに写す。媒体の上の今写した file・目印・規約外の file を消す。
- 状態の file が壊れたときに黙って写さなくなる。媒体が見えないときに `last_success` を変える。用意の前・やめた後にホームが知らせる。
- 共通の確認が復元の間（控えの確かめの開始から）に写す・掃除する。媒体が抜けているだけで毎分 toast を出す。command を main thread で動かして写しの間に画面が固まる。
- (a) の契約（MNT-01-D7・D9・D10 の PC の中の側、UI-11b-D13・D15 の一覧の行の入口）と restore の契約（MNT-01-D1〜D6、UI-11b-D2〜D5・D11・D12）を変える。

### 非目的

- (a) の範囲（PC の中の backup の作り方・書く先の固定・一覧の行からの復元の確かめ）。(a) の packet。
- 持ち帰った媒体の古さをアプリで扱うこと、写しの暗号化、媒体を 1 本だけ登録から外す操作、USB の HDD・network の保存先（D-114 の Revisit）。
- 更新・migration の前の保全の gate（D-114 の Revisit）。
- 自動 backup の確認の失敗で原因を名指すこと（backlog の AI の review 由来の項、(a) の J1 の決定〈TD-390〉のまま）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更（媒体への書込みと知らせの状態遷移）なので、店の毎日の列を置く。運用の型は C（2 本の入れ替え、D-114、TD-196）。(a) の版の列（PC の中の backup と一覧の行からの復元）はそのまま成り立つ前提で、ここには (b) で足す列だけを置く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 導入時、PC の外の控えは用意の前 | owner が控え 1 を差し、バックアップ画面の「この USB メモリを控えの保存先にする」で選ぶ | 媒体に `InventoryBackup\` と目印、続けて最新の backup が写り、card に「最後に PC の外へ写した控え: 今日の日時（控え 1、確かめ済み）」 | card に今日の日時 | P1・P7〜P10 は確認済み（下の Contract Probe）。P11（Rust の std の copy・`sync_all`・読み戻しが FAT32 の上の volume GUID path で通る）は L3-b2 |
| 控え 1 が差してある | owner が控え 1 を抜き、同じ口に控え 2 を差して用意し、控え 2 を抜いて持ち帰り、控え 1 を差し戻す | 控え 2 にも写る。控え 1 を差し戻すと 60 秒以内に「差してある控え: 控え 1」 | — | 空きの USB の口は 1 つ（TD-198） |
| 毎朝、PC を起動する | 店主は何もしない | 共通レイアウトの mount の 1 回の確認が控え 1 へ写す（UI-11b-D16） | — | (a) の起動時の自動 backup が先に作る |
| 営業中、設定時刻の backup ができる | 何もしない | 60 秒以内の確認で控え 1 へ写る | — | — |
| 控え 1 が抜けた | 何もしない | toast は出ない。最後に写せた日から 3 日でホームに「PC の外の控えが 3 日写せていません。USB メモリが差してあるか確かめてください。」 | 店主が差し直す | — |
| 控え 1 は差してあるが書込みに失敗し続ける（書込み禁止 等） | 何もしない | 連続の最初の 1 回だけ toast。3 日でホームに「…USB メモリは差してありますが、写せません。いったん抜いて差し直し、…」（本 commit で分けた (5)） | 差し直す・別の媒体を用意する | — |
| PC の中の backup が 3 日作られていない | 何もしない | ホームに PC の中の backup の文（UI-00-D12 の (2)）。USB の文でない | 「今すぐバックアップを作成」→ 60 秒以内に写る | 手動の backup の失敗の原因は (a) の 43 §43.6 の文が名指す |
| 状態の file が壊れた | 何もしない | ホームと card に「記録を読めません」の文と 2 つの直し方 | 「記録を作り直す」（CMD が先に backup を作る）か「PC の外の控えをやめる」 | — |
| 控え 1 を用意した後、owner が保存先を変える | 「保存先を選ぶ」で控え 1 の `InventoryBackup` を選ぶ | 設定の card に「PC の中の保存先が、USB メモリの InventoryBackup フォルダと同じです。「保存先を選ぶ」で PC の中の別のフォルダを選び直してください」。「現在の保存先」は前のまま（保存しない） | PC の中の別の folder を選び直す | 判定は固定した path（P12 は L3-b6） |
| 保存先を USB メモリの上の `InventoryBackup` にしてある PC で、その USB メモリを用意する（用意の前に選んだ保存先） | 「この USB メモリを控えの保存先にする」 | card に同じ固定の文。目印も状態も書かれない | 保存先を選び直してから用意し直す | — |
| 保存先が控え 1 の `InventoryBackup` と同じ folder になった（drive 文字の割当ての変化） | 何もしない | 確認は写さず、card の副情報に同じ固定の文、連続の最初の 1 回だけ toast。3 日でホームと card に「…日写せていません。PC の中の保存先が…」（UI-00-D12・UI-11b-D14 の (4)） | 保存先を選び直す → 60 秒以内に写る | 選び直すまで PC の中の保持日数の掃除が媒体の古い写しを消す（71 §71.11.7） |
| USB の控えを使わない | owner が「PC の外の控えをやめる」→ 確認で「やめる」 | 用意の前の文。ホームは知らせない。媒体と PC の中の backup は消えない | — | — |
| owner の訪問（短い確かめ） | 持ち帰った控え 2 を差した直後に「控えを選んで確かめる」→ 控え 2 の最新の file | 共通の確認が止まり、「この控えは戻せます」と商品の数・最後の記録。閉じると確認が再開し、60 秒以内に今日の控えが控え 2 へ写る | card に「差してある控え: 控え 2」と今日の日時 | (a) の停止と待ち（上の「(a) への依存」） |
| 新しい PC での本番の復元 | 「控えを選んで確かめる」で控えを選び、2 段の確認で戻し、「今すぐバックアップを作成」、媒体を用意し直す（71 §71.13） | 最後の入れ替えの時点まで戻り、媒体の最新が戻した内容の控えになる | 媒体の最新の控えの商品の数が戻した結果と合う | 通しの演習は go-live の前に owner が別の PC で（本 lane の L3 の外） |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項

確認済み事実: D-114 と設計正本で (b) の振舞いは一意に決まる（起票の commit と J1 の commit で正本に足したものは下の Design Readiness）。起票の時に現物と正本を突き合わせて、正本が扱っていない組み合わせを 1 つ見つけた: PC の中の保存先（`backup_path`、UI-11b-D8 で取外し可能な drive も選べる）を、用意した USB メモリの `InventoryBackup` の folder そのものにした場合。このとき PC の中の保持日数の掃除（71 §71.5、既定 3 日）が媒体の写しを日付で消し（`OFFSITE_KEEP` の 30 本が 3 日分になる）、写す元と写す先が同じ file なので §71.11.4 手順 4a が毎回 `UpToDate` になって `last_success` が書かれず、3 日で (5) の知らせ（差してあるのに写せない）が出る。出所: 本 lane の起票（AI）。

| # | 判断事項 | 選択肢 | 決定 | 根拠 |
|---|---|---|---|---|
| J1 | PC の中の保存先が用意した媒体の `InventoryBackup` と同じ folder のときの扱いを (b) に入れるか | A 入れる: 用意（§71.11.2）と確認（§71.11.4）で `backup_dir` と媒体の `InventoryBackup` が同じ実体の folder なら書かずに新しい失敗を返し、card とホームが「PC の中の保存先を USB メモリの InventoryBackup の外へ選び直す」直し方を名指す／ B 入れない: 71 §71.11.7 に 1 文足す／ C 入れない: backlog に残す | **A**（解決済み。owner の決定 2026-10-23、repo 外の回答台帳 TD-398。同じ日の TD-396 の B〈起票の推奨〉を置き換えた） | 回避を手順書の文に回さず、問題を起きたその画面で原因と直し方を名指す（AGENTS.md の「使い手に押しつけない」、D-127）。正本は 71 MNT-01-D11・`docs/decision-log.md` D-130 |

J1 の A で Writer が決めた技術判断（owner の答えの範囲の中。理由は MNT-01-D11 と D-130）:

- 保存先を選ぶ側（逆の順: 先に媒体を用意し、後で設定の画面で保存先にその媒体の `InventoryBackup` を選ぶ）でも止める。保存する前に新しい command `check_backup_dir_choice`（43 §43.8.8、71 §71.11.5c）で確かめ、同じ folder なら保存せず、設定の card にその場で固定の文を出す（68 §68.4 の backup_path 変更）。理由: この順では、確認が写すのを止めても、PC の中の保持日数の掃除（§71.5）が媒体の写しを日付で消し続け、確認の失敗では止められない。用意と確認でも止めるのは、用意の前に選んだ保存先（目印がまだ無い）と、選んだ後の drive 文字の割当ての変化を、保存先の選択だけでは見落とすため。3 つの時点は同じ判定の関数（§71.11.3）を使う。
- 判定は (a) の `pin_to_volume`（PR #190 の head `a828504362b2c6936766e46766b68b129ce08a17` の 71 §71.4 の「書く先の固定」。`pin_backup_dir` の `actual` と同じ値）で固定した 2 つの path を component ごとに比べ、設定の文字列や drive 文字の path を比べない。保存先が `InventoryBackup` の中の folder や媒体の root のときは止めない（互いの掃除が file を消さない、§71.11.3）。
- 保存先の選択の確かめは `update_setting` に `backup_path` の key だけの分岐を足さず、別の command にする（key に依らない設定の保存の入口に分岐を足さない。drive の列挙を main thread でしない、43 §43.8.2 の「実行の thread」）。確かめは PC 側の状態の file を読まず、目印のある媒体の `InventoryBackup` を全部止める（§71.11.5a 手順 3 と同じ探し方。状態が読めないときも止められ、別の PC の控えも保持日数の掃除が消すため）。
- 新しい失敗は `OffsiteFailureKind` の 8 値目にし、card とホームの原因の文は (4)（USB の差し直しでは直らない失敗の種類に 43 の固定の文を続ける）に入れる（番号を付け直さない）。(2) の `local_backup_old` と重なったときはホームは (2) を出し、card は副情報の固定の文でこの原因も名指す。

店主に聞く事項: 無い。L3 の依頼のときに owner に 1 つだけ確かめる（同じ decision point）: 控え用の USB メモリが手元に 2 本あるか（L3-b3 に要る。1 本なら L3-b3 を後の回に回し、L3 は省かない）。

## Scope

段（実装の順。各段の終わりで対象の test が通る。(a) の merge の後の main の上で行う）:

- S1 MNT の土台（新 module `mnt::offsite`）: 71 §71.11.1 の型（`OffsiteMediumMarker`・`OffsiteState`・`OffsiteMediumEntry`・`OffsiteCopyRecord`・`OffsiteFailureRecord`・`OffsiteFailureKind`・`OffsiteError` と `kind()`）と定数（`OFFSITE_DIR_NAME`・`OFFSITE_KEEP`・`OFFSITE_STALE_DAYS`）、目印と状態の読み書き（作業名 → `sync_all` → 置き換え → 親 directory の sync）、媒体を探す内部関数（§71.11.3。root の列を受ける内部関数を production と test で共有し、Windows だけ `GetLogicalDrives`・`GetDriveTypeW` で列を作る）、reparse point の判定（Windows は `GetFileAttributesW`、Windows 以外は `symlink_metadata`）、媒体の固定（(a) の `pin_to_volume` を root に）と目印の読み直し、PC の中の保存先と同じ folder の判定（§71.11.3、MNT-01-D11。固定した 2 つの path を比べる 1 つの関数）、thread の error mode の guard（`SetThreadErrorMode`、drop で戻す）、process 全体の `Mutex<()>`。file 操作は (a) が共有する trait に、写しに要る操作を足して注入する。
- S2 MNT の関数: `prepare_offsite_medium`（§71.11.2。手順 3c の同じ folder の判定を含む）、`check_offsite_backup` とその本体の内部関数（§71.11.4。起票の commit で決めた「成功の記録の置き換えの後の親 directory の sync の失敗は成功のまま」と、手順 3 の同じ folder の判定を含む）、`offsite_status`（§71.11.5、`local_backup_old`）、`reset_offsite_state`（§71.11.5a）、`stop_offsite_backup`（§71.11.5b）、`check_backup_dir_choice`（§71.11.5c）。
- S3 CMD と登録: 43 §43.8.2〜§43.8.4・§43.8.6〜§43.8.8 の 6 command（`#[tauri::command(async)]` + `#[specta::specta]`、DB の Mutex は `backup_dir` の読取りの間だけ、§43.8.6 は先に §43.6 と同じ backup の作成と写像、§43.8.8 は DB を使わない）、エラーの写像の表（`BackupDirIsMediumFolder` の行を含む）、`lib.rs` の 2 つの macro、bindings と traceability の再生成、`design_compliance_test.rs` の `build_doc_to_modules_map()` の `71-mnt-backup.md` の行に `mnt::offsite`。
- S4 共通の確認（UI-11b-D16）: `useAutoBackupCheck` の同じ回の中で `checkAutoBackup` の結果の後（成否に依らず）に `checkOffsiteBackup`、mount の瞬間に 1 回だけ `checkOffsiteBackup`、結果の種類に依らず status を invalidate（世代番号が違って捨てた結果は除く）、失敗は連続の最初の 1 回だけ toast（id `backup-offsite-error`）。実行中の guard・停止・世代番号・(a) の実行中の回の promise は同じものを使う。
- S5 バックアップ画面: 「PC の外の控え」の card（UI-11b-D14。状態の 1 行、`stale` の原因の文〈本 commit の (5) の分け方を含む〉、副情報、3 つの button、やめるの確認の AlertDialog、取得失敗と再読込）、`offsite_preparing`・`offsite_resetting`・`offsite_stopping`（§68.7）、「控えを選んで確かめる」の入口（native file picker、`.db`。選び終えた時点から (a) の停止・確かめ・詳細の流れ。`selected` の型を `BackupInfo` でない file も持てる形にし、作成日時が取れないときは file 名を出す〈本 commit の §68.9〉）、invalidate（§68.10 の 4 行）、「保存先を選ぶ」の保存の前の `checkBackupDirChoice`（§68.4 の backup_path 変更。`Err`・例外は保存せず設定の card に文、`path_update_error`）、原因の文の (4) の `backup_dir_is_medium_folder`。
- S6 ホーム: `OffsiteBackupWarning`（UI-00-D12。独立の query、`stale = true` のときだけ warning の Alert、原因の文は S5 と同じ選び方の関数を使い「バックアップ画面の」を付ける〈(4) の `backup_dir_is_medium_folder` も〉、`/settings/backup` への link「バックアップ画面へ」、query の失敗は Alert なし + toast「PC の外の控えの状態を取得できませんでした」）。
- S7 正本の注記: 下の「置き換わる注記」を事実へ置き換える。

予定 path の全部（他 lane との重なりの列は下の「並走との重なり」）:

| file | 段 | 変更 | 他 lane との重なり |
|---|---|---|---|
| `src-tauri/src/mnt/offsite.rs`（新設） | S1・S2 | 71 §71.11 の全部。公開関数は 71 のシグネチャのものに限る（無い `pub fn` は設計照合の警告になる。内部関数は `pub(crate)` か private） | なし |
| `src-tauri/src/mnt/mod.rs` | S1 | `pub mod offsite;`（71 §71.1） | なし |
| `src-tauri/src/mnt/restore.rs` | S1・S2 | (a) が `mnt` の中で共有した file 操作の trait に、写しの注入に要る操作（copy・作業名への書込み・読み戻し・置き換え・`create_new` の copy。design の Matrix の注入の列）を足す。既存の注入の型では本物の操作へ委ねる。restore の振舞いは変えない。Matrix の「アプリの今の DB を選んだとき」の回帰の test を足す | (a)（同じ trait。(a) の merge の後に足す） |
| `src-tauri/src/mnt/backup.rs`（条件つき） | S2 | `list_backups`・名前の解析・「使える控え」の判定を `mnt::offsite` から呼べる可視性にする（変える必要が無ければ触らない）。振舞いは変えない | (a) |
| `src-tauri/src/cmd/settings_cmd.rs` | S3 | 6 command と test。§43.8.6 は §43.6 と同じ backup の作成と写像を 1 つの helper で共有する（上の「(a) への依存」）。test の `AppState` は既存の helper `app_state_for_test` を使う（literal を足さない） | (a)・#172（`app_state_for_test` の `AppState` の literal に field）・#188（`CmdError` の literal に field）。違う symbol |
| `src-tauri/src/lib.rs` | S3 | `collect_commands!` と `generate_handler!` の settings の塊に 6 行ずつ | (a)・#172・#188（行が別） |
| `src-tauri/Cargo.toml`（条件つき） | S1 | 既存の `windows-sys = "=0.61.2"` の feature に `Win32_System_Diagnostics_Debug`（`SetThreadErrorMode`）。#172 が先に main に足していれば触らない。`GetLogicalDrives`・`GetDriveTypeW`・`GetFileAttributesW` が既存の `Win32_Storage_FileSystem` に無いと build で分かったときだけ、その feature も足す（新しい依存ではない。`Cargo.lock` は feature を持たないので変わらない） | (a)（条件つき）・#172（同じ feature。先に merge した lane が足す） |
| `src-tauri/tests/design_compliance_test.rs` | S3 | `build_doc_to_modules_map()` の `71-mnt-backup.md` の行に `"mnt::offsite"` | #172（29 の行）・#188（行が別） |
| `src/lib/bindings.ts` | S3 | 再生成（`cd src-tauri && cargo run --bin generate_bindings`）。手で編集しない | (a)・#172・#188（衝突は手で解かず、取り込んだ後に再生成する、D-098） |
| `docs/function-design/90-traceability.md` | S3 | 再生成（`cd src-tauri && cargo run --bin generate_traceability`） | 生成物（同上） |
| `src/lib/query-keys.ts` | S4 | `queryKeys.backupRestore` に `offsiteStatus()`（UI-11b と UI-00 の同じ key、53 §53.1） | #188（`stocktake` の key。行が別） |
| `src/features/backup-restore/useAutoBackupCheck.ts` | S4 | 上の S4。`queryKeys.backupRestore.offsiteStatus()` の invalidate はこの file から（`src/lib/invalidation-contract.static.test.ts` の `ALLOWED_DIRECT_CALL_FILES` に既にある） | (a) |
| `src/features/backup-restore/useAutoBackupCheck.test.tsx` | S4 | Matrix の UI-11b-D16 の行と D15・D16 の行 | (a) |
| `src/features/backup-restore/useOffsiteBackupStatus.ts`（新設） | S5 | status の読取りの query hook（`commands.getOffsiteBackupStatus`）。invalidate しない | なし |
| `src/features/backup-restore/offsite-status-text.ts`（新設）・同 `.test.ts`（新設） | S5 | UI-11b-D14 と UI-00-D12 の状態の文と原因の文を status から選ぶ関数（1 か所。ホームの「バックアップ画面の」の付け方は引数）。日数を計算しない | なし |
| `src/features/backup-restore/OffsiteBackupPanel.tsx`（新設）・同 `.test.tsx`（新設） | S5 | card の表示（presentational）。command の呼出しと invalidate は `BackupRestorePage.tsx` が持ち、card は handler を受ける（新しい file から invalidate しない。上の static test の許可の一覧を変えない） | なし |
| `src/features/backup-restore/BackupRestorePage.tsx` | S5 | card の配置と 3 つの mutation（用意・作り直し・やめる。成功・失敗とも §68.10 の invalidate）、file の入口、`selected` の型、「保存先を選ぶ」の保存の前の `checkBackupDirChoice`（今の `updateBackupSetting` の `backup_path` の呼出しの前） | (a) |
| `src/features/backup-restore/BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx` | S5 | Matrix の UI-11b-D14・D15 の行と UI-11b-F3（保存先の選択の確かめ）の行。`vi.mock("@/lib/bindings")` に新しい command の既定 | (a) |
| `src/components/layout/RootLayout.test.tsx` | S4 | `vi.mock("@/lib/bindings")` の `commands` に `checkOffsiteBackup` の既定（mount の 1 回の呼出しが undefined にならない） | なし |
| `src/features/home/components/OffsiteBackupWarning.tsx`（新設） | S6 | UI-00-D12 | なし |
| `src/features/home/HomePage.tsx` | S6 | 前日未取込みの警告と同じ段に `OffsiteBackupWarning`（53 §53.1）、query の失敗の toast | なし |
| `src/features/home/HomePage.test.tsx` | S6 | Matrix の UI-00-D12 の行。`vi.mock("@/lib/bindings")` に `getOffsiteBackupStatus` の既定 | なし |
| `docs/function-design/71-mnt-backup.md` | 本 commit・S7 | 本 commit: 下の「本 commit で変えた正本」。S7: §71.1 の 2 行の注記 | (a)（§71.3・§71.4・§71.8・§71.10 の見出しの注記。節が別） |
| `docs/function-design/68-ui-backup-restore.md` | 本 commit・S7 | 本 commit: UI-11b-D14 の (5)、§68.9 の D-114 の項。S7: 前文 | (a)（前文の書き分けと、round 1 の是正の commit `b8b201a5` で §68.7・§68.9・§68.10・§68.11 の復元の card の「閉じる」と文言。(a) の branch の差分にある）。前文は (a) の書き分けの後に (b) の残りを外す |
| `docs/function-design/53-ui-home.md` | 本 commit・S7 | 本 commit: UI-00-D12 の (5)、更新履歴。S7: §53.1 の `OffsiteBackupWarning` の行の注記 | なし |
| `docs/function-design/43-cmd-settings-log.md` | 本 commit・S7 | 本 commit（J1）: エラーの写像の表・DTO の形・§43.8.8・§43.11 の段落の command の数。S7: §43.11 の登録の code block に 6 command、D-114・D-130 の段落を外す | (a)（同じ段落を `inspect_backup` の分だけ書き分ける） |
| `docs/function-design/22-mnt-migration.md` | S7 | §16 の「folder の外でアプリが読む場所（今の現物で 2 つ。…(3) を足す）」を 3 つの現物の文へ | #172（§17）・#188（§20）。節が別 |
| `docs/FUNCTION_DESIGN.md` | S7 | MNT-01 の索引の行の「runtime は後続の lane」と、PC の外の控えの関数の列に `check_backup_dir_choice` を足す（J1 の commit は本 file を触らない） | (a)（同じ行を書き分ける）・#188（D-118 の行。行が別） |
| 本 commit: `docs/plans/2026-10-23-backup-offsite-runtime-b.md`・`docs/plans/test-matrices/2026-10-23-backup-offsite-runtime-b.md` | — | 新設（J1 の commit で当て直し） | なし |
| 本 commit（J1）: `docs/decision-log.md` | — | D-130 を足す（D-114 の本文は変えない） | #188（D-109 の末尾の Superseded in part の 1 行。節が別） |

触らない: `docs/Plans.md`（D-097。導入の前の関門 3. の pointer は (a) が置いた）、`docs/backlog.md`（「PC の外の控えの runtime」の項の着手の段は (a) が持ち、(b) の完了の整理と閉じる項は closeout。L3 の共有の path を減らす、D-124）、`docs/project-memory.md`（「PC の外の保存先は今使っていない」は店の事実のまま）、`docs/db-design/`（DB の schema・`app_settings` を変えない）。

本 commit で変えた正本（plan-first、spec-check → design → plan-draft の design の出力。J1 の commit〈plan-draft → design → plan-draft〉の分は表の後半）:

| file | 変更 | 理由 |
|---|---|---|
| `docs/function-design/71-mnt-backup.md` | §71.11.4 のエラーの表の「状態の file の書込みの失敗」を、作業名の書込み・`sync_all`・置き換えそのもの（`Io`）と、手順 5 の成功の記録の置き換えの後の親 directory の sync（成功のまま `Copied`・`tracing::warn!`）の 2 行に分け、理由と棄却案を表の下に置いた。§71.11.5a の「手順 7 の失敗」の項と §71.10 の D-114 の追加の表の「MNT-01-D8 作り直し」の行を同じ扱いへ直した | design の packet の closeout の申し送り (b)。置き換えた後の状態は成功を返すので、`Io` を返すと画面とホームが成功の日時と失敗の文を並べる |
| `docs/function-design/68-ui-backup-restore.md` | UI-11b-D14 の (5) を `attached` で 2 つの文に分けた。§68.9 の D-114 の項に、選んだ file の作成日時が取れないとき file 名を出すことを足した | 申し送り (a)。file の入口は規約外の名前の file も選べ、`BackupInspection.created_at` は `null` になりうる（71 §71.12）のに、表示が正本に無かった |
| `docs/function-design/53-ui-home.md` | UI-00-D12 の (5) を 68 と同じに分け、更新履歴に 1 行 | 申し送り (a) |
| `docs/function-design/71-mnt-backup.md`（J1） | MNT-01-D11 を新設。§71.11.1 に `BackupDirIsMediumFolder`（`OffsiteFailureKind` の 8 値目・`OffsiteError` の 14 値目）、§71.11.2 手順 3c とエラーハンドリング、§71.11.3 に「PC の中の保存先と同じ folder の判定」、§71.11.4 手順 3 とエラーの表の行、§71.11.5c `check_backup_dir_choice` を新設、§71.11.7 に保証の範囲と例外の 1 項、§71.10 の D-114 の追加の表に MNT-01-D11 の行 | owner の J1 = A（TD-398）。保存先を選ぶ側でも止める判断（上の「owner の判断事項」） |
| `docs/function-design/43-cmd-settings-log.md`（J1） | エラーの写像の表に `BackupDirIsMediumFolder` → `validation` の固定の文、DTO の形の `OffsiteFailureKind` を 8 値、§43.8.8 `check_backup_dir_choice`（`BackupDirChoiceRequest`、`(async)`、DB なし）を新設、§43.11 の段落の command の数 | 同上。`update_setting` に key の分岐を足さない理由は §43.8.8 |
| `docs/function-design/68-ui-backup-restore.md`（J1） | UI-11b-F3、§68.3 に `checkBackupDirChoice`、§68.4 の backup_path 変更の手順 3〜5、UI-11b-D14 の (4) に `backup_dir_is_medium_folder`、§68.7 の `path_selecting`、§68.8 の設定保存、§68.11 の 2 行、§68.12 に UI-11b-L3-10 | 同上。起きたその画面（設定の card・PC の外の控えの card）で名指す |
| `docs/function-design/53-ui-home.md`（J1） | UI-00-D12 の (4) に `backup_dir_is_medium_folder` とホームの文（「バックアップ画面の「保存先を選ぶ」」）、更新履歴に 1 行 | 同上 |
| `docs/decision-log.md`（J1） | D-130 を新設（D-114 に足す。D-114 の本文は変えない） | D-114 の Compatibility の「command 6 つ」が 7 つになり、`OffsiteFailureKind` が 8 値になる横断の変更で、owner の決定（TD-398）を持つ |

対象を使う呼出し側・隣接 test・helper / mock・生成物（2026-10-23、`eed07d37` で `rg` した。行番号でなく symbol で引く。(a) の merge の後に同じ `rg` で取り直す）:

| 型・関数 | 作る所 | 読む所・test |
|---|---|---|
| 新 `mnt::offsite` の 6 つの公開関数 | `src-tauri/src/mnt/offsite.rs` | CMD の 6 command（`cmd/settings_cmd.rs`）。`prepare_offsite_medium` の手順 6 と `reset_offsite_state` の手順 7 は lock を取らない `check_offsite_backup` の本体を呼ぶ（§71.11.4 の排他） |
| `list_backups`（MNT） | `mnt/backup.rs` の `list_backups` | 既存: `cmd/settings_cmd.rs` の `list_backups`・`tests`、`mnt/backup.rs` の `tests`。新: §71.11.4 手順 2 の写す元、§71.11.5 の `local_backup_old`。形は変えない |
| `inspect_backup` と「使える控え」の判定（(a)） | `mnt/backup.rs`（(a)） | 新: §71.11.4 手順 3a。UI の file の入口は (a) の `commands.inspectBackup` |
| `create_backup` の CMD の写像（(a) の 43 §43.6） | `cmd/settings_cmd.rs` の `create_backup`（(a)） | 新: §43.8.6 の `reset_offsite_state` の command |
| file 操作の trait（(a) が共有） | `mnt/restore.rs`（`RestoreFileOps`・`StdRestoreFileOps`） | restore の本体と注入の型（`mnt/restore.rs` の `tests`）、(a) の backup の公開、新: `mnt::offsite` |
| `get_backup_dir`（CMD の helper） | `cmd/settings_cmd.rs` の `get_backup_dir` | 既存の backup 系 command。新: 6 command のうち `backup_dir` を読む 4 つ（§43.8.7・§43.8.8 は読まない） |
| `pin_to_volume`（(a)） | `mnt/backup.rs`（(a)、71 §71.4） | 新: 媒体の root の固定（§71.11.3）と、同じ folder の判定の両側（`backup_dir`・選んだ folder と、媒体の `InventoryBackup`）。(a) の `pin_backup_dir`・`create_backup`・`cleanup_old_backups` の使い方は変えない |
| 「保存先を選ぶ」の保存（`updateBackupSetting` の `backup_path`） | `BackupRestorePage.tsx`（今の handler は picker の結果を `updateBackupSetting("backup_path", selected)` へ渡す） | 新: その前に `commands.checkBackupDirChoice`。既存の test は `BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx`（`rg -ln 'backup_path' src --glob '*.test.*'` が返す 3 file のうち `src/features/threshold-settings/lib/extract-thresholds.test.ts` は閾値の key の抽出で、保存の流れを描画しない）。`update_setting` の CMD・BIZ は変えない |

| `useAutoBackupCheck` の module | `src/features/backup-restore/useAutoBackupCheck.ts` | mount: `src/components/layout/RootLayout.tsx` の `RootLayout`。実物を import する test: `RootLayout.test.tsx`・`BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx`・`useAutoBackupCheck.test.tsx`。`vi.mock` で置き換える test: `src/features/inventory-records/OtherRecordDetailRoutes.test.tsx`・`src/lib/app-router.test.tsx`（(b) は export を足さないので変えない。(a) が `suspendAutoBackupCheckAndWait` を足す） |
| `queryKeys.backupRestore` | `src/lib/query-keys.ts` | 既存の 3 key の読み手は `BackupRestorePage.tsx`・`useAutoBackupCheck.ts`。新 `offsiteStatus()` の読み手は `useOffsiteBackupStatus.ts`（card とホーム）、invalidate は `useAutoBackupCheck.ts`・`BackupRestorePage.tsx` |
| `HomePage` | `src/features/home/HomePage.tsx` | 描画する test は `src/features/home/HomePage.test.tsx` だけ（`rg -ln 'features/home/HomePage\|from "@/features/home' src --glob '*.test.*'` は静的な走査の `src/hooks/unsaved-changes-guard-sweep.test.ts` だけを返し、それは描画しない） |
| `BackupRestorePage` の復元の選択（`selected`） | `BackupRestorePage.tsx`（(a) の形） | `BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx` |
| `describeError` | `src/lib/describe-error.ts`（変えない） | card の失敗の文（`validation` は message、`internal` は message と error ID）。`src/lib/describe-error-adoption-sweep.test.ts` が新しい component の raw message の表示を見る（新しい file を許可の一覧に足さない） |

置き換わる注記（この変更で不要になる記述・条件・code。実装の commit で全件を直す。`rg` の式は AC7）:

- 71 §71.1 の module 構成の `mod.rs` の行の「pub mod offsite は runtime の lane で足す」と `offsite.rs` の行の「runtime は後続の lane」→ 外す。
- 68 の前文の「（runtime は後続の lane）」→ (a) が書き分けた後の (b) の残りの句を外す。
- 53 §53.1 の `OffsiteBackupWarning.tsx` の行の「runtime は後続の lane」→ 外す（更新履歴の 2026-10-07 の行は履歴なので残す）。
- 43 §43.11 の「D-114 の 6 command（§43.8.2〜§43.8.7）と D-130 の 1 command（§43.8.8）は後続の runtime の lane で…」→ (a) が `inspect_backup` を書き分けた後の残りの 6 command の文を外し、code block に 6 command を足す。
- 22 §16 の「今の現物で 2 つ。PC の外の控えの runtime〈D-114〉が (3) を足す」→ (3) を今の現物として 3 つの文へ。
- `docs/FUNCTION_DESIGN.md` の MNT-01 の索引の行の「runtime は後続の lane」→ 外し、PC の外の控えの関数の列に `check_backup_dir_choice` を足す（J1 の commit は本 file を編集の範囲に持たないので、実装の commit で揃える）。
- 回避の手順で置き換わるもの: 無い（PC の外の控えは今使っていない。MSI の手順書の流れ 3 の直しは (a) の起票の commit で済み）。
- 不要になる code: 無い（足す lane。(a) の `suspendAutoBackupCheckAndWait` の待つ対象に `checkOffsiteBackup` を足し、別の待ちを作らない）。
- 本 commit で不要になった正本の条件: §71.11.4 のエラーの表の「状態の file の書込みの失敗 → `Io`」の範囲から、成功の記録の置き換えの後の親 directory の sync を外した（§71.11.5a の項の「手順 7 の中で成功の記録を置き換えた後の … sync の失敗 … `stale = false` になりうる」の例外の句も外した）。
- J1 の commit で不要になった条件: B を前提にした packet の文（S7 と Scope の 71 の行と Contract Ledger の「J1 が B なら §71.11.7 に 1 文」、Non-scope の「J1 の A」、Design Readiness の「延期: J1（既定 B）」、Contract Ledger の隣接の除外の「J1 の B は文だけ」、Matrix の Negative Paths の「既定 B では code で止めない」）を外した。正本には B の文が無かった（B は実装の commit で足す予定だった）ので、正本から外す文は無い。sweep は Contract Audit の表。

横断の約束（失敗の時点と順序・0 の表示・状態の取り直し。(b) の 8 経路。各段はこの表を引く）:

| 経路 | 失敗の時点と順序 | 0 の表示 | 状態の取り直し |
|---|---|---|---|
| `check_offsite_backup`（mount の 1 回・60 秒・用意の手順 6・作り直しの手順 7） | 状態を読む（読めなければ `StateUnreadable`、書かない）→ 写す元の一覧（`Err` は `last_failure = io`・`medium_id: None`）→ 媒体を探す（0 は `MediumMissing`、状態を変えない）→ 見つけた媒体の `InventoryBackup` が `backup_dir` と同じ folder なら `BackupDirIsMediumFolder`（どの媒体にも書かず・消さない、`last_failure` は `medium_id` 付き、写す元の検査もしない。J1）→ 写す必要があるときだけ写す元を検査（落ちれば `source_unverified`、どの媒体にも書かない）→ 媒体ごとに a〜g（公開の前の失敗は正式名を作らず作業名だけ、公開の後の親 directory の sync の失敗は正式名を残し `last_success` を書かない、掃除の失敗は warn）→ 成功の記録の置き換え（その後の親 directory の sync の失敗は成功のまま・warn。本 commit） | 写したもの 0 は `UpToDate`（状態を変えない）。`OFFSITE_KEEP` 本目より後を消す（31 本目から） | 結果の種類に依らず status を invalidate（世代番号が違って捨てた結果は除く、UI-11b-D16） |
| `prepare_offsite_medium` | root → 取外し可能か → レジの SD → 状態を読む → reparse point → `backup_dir` と同じ folder（`BackupDirIsMediumFolder`、J1）→ 目印（`format` が 1 でなければ何も書かない）→ 状態に足す → 手順 6 の写し（失敗は用意を取り消さず `last_failure`）。手順 4 より前の失敗は何も書かない | 札は「控え N」の N = 状態の `media` の札の最大 + 1（`media` が空なら 1） | 成功・失敗とも status を invalidate（§68.4 手順 2） |
| `reset_offsite_state`（CMD は先に backup を作る） | backup の作成の失敗は作り直しを呼ばない（§43.6 の写像）→ lock → 状態を読む（無い・読めるなら手順 7 へ、`format` が 1 でない数は `StateUnsupported`）→ 見えている目印の媒体（0 は `NoMediumAttached`、何も変えない）→ 新しい状態の作業名 → 原本の copy（`create_new`）→ 置き換え → 親 directory の sync → 手順 7。置き換えより前の失敗は元の読めない file のまま | — | 成功・失敗とも status と backup list を invalidate。card は取り直した status で決める（§68.4 手順 4） |
| `stop_offsite_backup` | lock → 状態が無ければ `Ok` → 退避名へ上書きしない移動 → 親 directory の sync。移せなければ何も変えず `StopFailed`、移した後の sync の失敗も `StopFailed`（status は用意の前） | — | 成功・失敗とも status を invalidate。backup list は invalidate しない（§68.10） |
| `offsite_status`（card・ホーム） | 書かない。状態が無い → `prepared = false`・`stale = false`。読めない → `prepared = true`・`stale = true`・`state_unreadable`。`list_backups` の `Err` は `local_backup_old = false` | `days_since_last_success` は 0 から（今日写せば 0 で、`stale` でない）。`stale` の境界は 3 日（2 日前は false、3 日前は true） | — |
| card とホームの原因の文 | `stale = true` のときだけ、(1) `state_unreadable` → (2) `local_backup_old` → (3) `source_unverified` → (4) `storage_full`・`verify_mismatch`・`backup_dir_is_medium_folder`（J1） → (5) それ以外（`attached` が空か否かで 2 つ、本 commit）の順で 1 つ選ぶ | `{N}` は `days_since_last_success`。`last_success_at` が無ければ「まだ写せていません」の形（日数を出さない） | status の query の再取得で選び直す。UI は日数を計算しない |
| 「保存先を選ぶ」（`check_backup_dir_choice` → `updateSetting`、J1） | directory picker の cancel は何もしない → `checkBackupDirChoice`（媒体を探し、目印のある媒体の `InventoryBackup` と同じ folder なら `BackupDirIsMediumFolder`。読めない root は飛ばして `Ok`。書かない）→ `Ok` のときだけ `updateSetting`。`Err`・IPC の例外は保存せず `path_update_error`（設定の card に文、現在の保存先の表示を保つ） | 目印のある媒体が 0 本なら止めずに `Ok` | 保存したときだけ今の §68.10 の設定保存の invalidate（backup list・実効保存先）。止めたときは invalidate しない |
| 「控えを選んで確かめる」 | file picker の cancel は何もしない（止めない）→ 選び終えた時点で (a) の停止と待ち → `inspectBackup` → `restore_detail` / `restore_blocked`。以後は (a) の一覧の行の入口と同じ | 作成日時が取れない file は日時の代わりに file 名（本 commit の §68.9）。商品の数 0 は (a) の「商品の数: 0 件」 | 復元の card の「閉じる」（`ready`・再開・backup list の invalidate）と条件つきの unmount で再開。最終確認の「キャンセル」は `restore_detail` へ戻るだけで再開しない（(a) の形） |

## Non-scope

- (a) の範囲の全部（上の非目的）。理由: (a) の packet。
- 持ち帰った媒体の古さ・写しの暗号化・媒体を 1 本だけ外す操作・USB の HDD・network（D-114 の Revisit、design の packet の Non-scope）。
- 作り直しの時に差していない媒体を名指す文（71 §71.11.7 の AI の review 由来の改善の候補。owner の確認の前の要件にしない）。
- 更新・migration の前の保全の gate（D-114 の Revisit）。
- 通しの演習と本番の復元の実施（71 §71.13 の運用の手順。本 lane は手順が通る画面を作り、L3-b4 で短い確かめの (1) だけを実機で通す）。
- 既存の restore の契約（MNT-01-D1〜D6、UI-11b-D2〜D5・D11・D12）と (a) の UI-11b-D13・D15 の一覧の行の入口の変更。

## Acceptance Criteria

baseline は本 worktree（HEAD `eed07d37`、本 commit の前。AC7 は本 commit の正本の直しの後）で逐語に実行した出力。「完了時」は実装の後の期待。(a) の merge の後に同じ command で baseline を取り直し、(a) が足した分を読み替える。

- AC1（module と 6 つの関数がある）: `rg -n '^pub mod offsite;' src-tauri/src/mnt/mod.rs` が 1 行、`rg -n 'pub fn (prepare_offsite_medium|check_offsite_backup|offsite_status|reset_offsite_state|stop_offsite_backup|check_backup_dir_choice)\b' src-tauri/src/mnt/offsite.rs` が 6 行（J1 の commit で `check_backup_dir_choice` を足した）。baseline: 前者は出力なし・`exit=1`、後者の式を `src-tauri/src` に当てると出力なし・`exit=1`（file が無い）。
- AC2（Rust の test）: `cd src-tauri && cargo test --lib -- mnt::offsite mnt::backup mnt::restore cmd::settings_cmd` が exit 0 で、Matrix の Rust の行の test がすべて PASS。`rg -n 'fn test_[a-z_]*req901_d8|fn test_[a-z_]*req901_d11|fn test_offsite_cmd|fn test_offsite_cmds' src-tauri/src` が Matrix の Rust の行の test 名を返す。baseline（J1 の commit で取り直した）: `rg -n 'req901_d8|req901_d10_prepare|req901_d11|offsite|backup_dir_choice' src-tauri/src src --glob '!src/lib/bindings.ts' -c` が出力なし・`exit=1`。
- AC3（登録と bindings）: `bash scripts/check-command-drift.sh` が `D=75 H=75 S=75 T=75` で exit 0。`rg -n 'getOffsiteBackupStatus|prepareOffsiteMedium|checkOffsiteBackup|resetOffsiteState|stopOffsiteBackup|checkBackupDirChoice' src/lib/bindings.ts` が 6 つの command を返し、`git diff --exit-code src/lib/bindings.ts` が `cd src-tauri && cargo run --bin generate_bindings` の後に exit 0。baseline（J1 の commit で取り直した）: `D=68 H=68 S=68 T=68`、`rg -n 'getOffsiteBackupStatus|prepareOffsiteMedium|checkOffsiteBackup|resetOffsiteState|stopOffsiteBackup|checkBackupDirChoice|OffsiteBackupStatus|BackupDirChoiceRequest' src` は出力なし・`exit=1`。期待の 75 は baseline 68 + (a) の 1 + (b) の 6。並走の lane が先に command を足して merge したら、その数を足して読み替える（`H` と `S` が等しいことが条件）。
- AC4（frontend の test）: `npm test -- src/features/backup-restore src/features/home src/components/layout/RootLayout.test.tsx src/lib/invalidation-contract.static.test.ts src/lib/describe-error-adoption-sweep.test.ts`（`package.json` の `test` = `vitest run`。version pin なしの `npx` を使わない、D-030）が exit 0 で、Matrix の UI の行の test がすべて PASS。baseline: 未実測（既存の test は main の CI で緑）。
- AC5（feature）: `rg -c 'Win32_System_Diagnostics_Debug' src-tauri/Cargo.toml` が 1（#172 と (b) のどちらが足しても 1）。baseline: 出力なし・`exit=1`。
- AC6（層と設計照合）: `cd src-tauri && cargo test --test architecture_test --test design_compliance_test` が exit 0、`rg -n 'map.insert\("71-mnt-backup.md", vec!\["mnt::backup", "mnt::offsite"\]\);' src-tauri/tests/design_compliance_test.rs` が 1 行。baseline: 後者は出力なし（今は `map.insert("71-mnt-backup.md", vec!["mnt::backup"]);`）。
- AC7（置き換わる注記の残り）: `rg -n 'runtime は後続の lane|後続の runtime の lane で|pub mod offsite は runtime の lane で足す|今の現物で 2 つ' docs/function-design/71-mnt-backup.md docs/function-design/53-ui-home.md docs/function-design/43-cmd-settings-log.md docs/function-design/68-ui-backup-restore.md docs/function-design/22-mnt-migration.md docs/FUNCTION_DESIGN.md` が 53 の更新履歴の `| 2026-10-07 |` の行だけを返す。baseline（J1 の commit の後に取り直した）: `docs/FUNCTION_DESIGN.md:121:`・`68-ui-backup-restore.md:5:`・`22-mnt-migration.md:379:`・`53-ui-home.md:38:`・`53-ui-home.md:325:`・`43-cmd-settings-log.md:321:`・`71-mnt-backup.md:8:`・`71-mnt-backup.md:10:` の 8 行（J1 の commit で 43 の行が 312 から 321 へ移った。数は同じ）。(a) が同じ箇所を「(b) は後続」の別の語で書き分けたら、その語を式に足して同じ期待にする（上の「(a) への依存」の最後の行）。
- AC8（traceability）: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0。
- AC9（release build）: Human Gate に L3 を含むので、Writer の完了条件として `cd src-tauri && cargo check --release` が exit 0（`docs/DEV_WORKFLOW.md` Implementation Rules。CI gate ではない）。
- AC10（L3）: 下の Test Plan の L3-b1〜L3-b7 が全部 PASS（owner の目視の PASS / FAIL）で、`python3 scripts/pr-gate.py record --pr NUMBER` の manual の記録が pass。
- AC11（docs）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-23-backup-offsite-runtime-b.md` が ERROR 0（WARN は報告）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/function-design/71-mnt-backup.md` §71.1・§71.3・§71.4 の「書く先の固定」・§71.4.1・§71.10 の D-114 の追加の表・§71.11（§71.11.1〜§71.11.7〈§71.11.5c を含む〉、MNT-01-D8、MNT-01-D10 の媒体の側、MNT-01-D11）・§71.12 の「使える控え」・§71.13／`43-cmd-settings-log.md` §43.4・§43.6・§43.8.2〜§43.8.4・§43.8.6〜§43.8.8、「実行の thread」、エラーの写像の表、DTO の形、§43.11／`68-ui-backup-restore.md` UI-11b-F3・F8〜F10・D14〜D16、§68.3、§68.4（backup_path 変更の手順 1〜5、PC の外の控えの手順 1〜5、復元の手順 1・1a）、§68.6、§68.7（`path_selecting`・`offsite_*`・`restore_inspecting`）、§68.8 の設定保存、§68.9、§68.10、§68.11、§68.12 の UI-11b-L3-6〜L3-10、§68.13／`53-ui-home.md` §53.1・§53.5 の UI-00-D12 と query 失敗の行／`22-mnt-migration.md` §16 の folder の外の場所 (3)／`docs/decision-log.md` D-114・D-111（D-114 による一部の置き換え）・D-127・D-130。
- 必要な設計成果物: function-design（MNT-01・CMD-11・UI-11b・UI-00） = updated in this PR（起票の commit の 3 つの直しと、J1 の commit の MNT-01-D11 の一式〈上の「本 commit で変えた正本」の表の後半〉。ほかは PR #155 で設計済み）／DB = existing sufficient（schema・`app_settings` を変えない。状態は DB の外の file）／SCREEN_DESIGN = existing sufficient（ホームの利用者配慮とバックアップ画面のレイアウト判断の D-114 の行）／decision-log = D-130 を足した（J1、下）／Boundary / Wire Contract = 下に記入。
- plan にしかない durable な判断の昇格先: 起票の commit の 3 つの決定（(5) の分け方、成功の記録の置き換えの後の sync の失敗、file 名の表示）は 68・53・71 の該当の決定の中に理由と棄却案ごと置いた（UI-11b-D14、UI-00-D12、MNT-01-D8 の §71.11.4）。どれも D-114 の範囲の中の細部で、新しい横断の決定ではない。J1 の A（TD-398）は 71 MNT-01-D11 に決定・理由・棄却案・見直し契機を置き、D-114 の Compatibility の command の数と `OffsiteFailureKind` の値の数を変える横断の変更なので、owner の決定ごと D-130 に置いた（D-114 の本文は変えない）。packet の中の小さな実装の決定（状態の文の選び方を 1 つの関数に置く、card を presentational にして invalidate を page に置く、file 操作の trait の共有）は design の packet が「runtime の lane が決める」と申し送った所と、既存の静的な test の規則から一意に読める所。
- 前提・制約と、延期した design gap の follow-up: P11（Rust の std の copy・`sync_all`・読み戻しが FAT32 の上の volume GUID path で通る）は L3-b2 で確かめる（下の Contract Probe。外れたら implementing で止め、Gated Amendment で design へ戻す）。延期: 無い（J1 は TD-398 で A に決まり、本 lane に入れた）。J1 の判定の外部前提 P12（Windows で USB の root と `InventoryBackup` を固定した path が同じ volume GUID の形で比べられる）は L3-b6 で確かめる（下の Contract Probe）。
- 絶対保証の自己点検（設計正本の自己点検〈design の packet の Design Readiness〉を (b) の実装の形で引き継ぐ）: 「レジの SD に書かない」: 用意の手順 3 と探す規則で root の `CASIO\SR500_550_4000` を見て、書込みは固定した volume GUID path で行う。例外は design の packet のとおり（判定の後に同じ volume に利用者が folder を作った場合は次の確認で止まる）。「用意した媒体にしか書かない」: 目印の `medium_id` と状態の `media` の照合。例外は目印を手で写した場合と、作り直し（§71.11.5a）が照合を外す場合（owner の明示の操作）。「照合した写しだけを正式名にする」: 読み戻しの SHA-256 の比較の後の上書きしない公開。例外なし。「黙って写さなくならない」: 状態の file の破損は `stale` 側。例外は状態の file が消えた場合（`NotPrepared`、design のとおり）と、本 commit の成功の記録の置き換えの後の sync の失敗の後の電源断（前の記録に戻り `stale` 側に倒れる。黙ってはいない）。「復元の間に写さない」: (a) の停止と待ちの対象に `checkOffsiteBackup` を足す。例外は、停止の前に始まって終わった回（待つので確かめの開始の前に終わる）。「やめた後に知らせない」: 状態の file が無いとき `prepared = false`・`stale = false`。例外は電源断で退避の移動が戻った場合（用意の後に戻り、もう一度押せる、§71.11.5b）。「PC の中の保存先と媒体の `InventoryBackup` を同じ folder にしない」（J1、MNT-01-D11）: 保存先の選択・用意・確認の 3 つの時点で固定した path で比べて止める。例外は、選んだ時点で目印の無かった folder が後で用意された場合（用意が止める）と、選んだ後の drive 文字の割当ての変化（次の確認が止めて知らせる。止めている間も PC の中の保持日数の掃除が媒体の古い写しを消す、71 §71.11.7）と、確かめと保存の間に媒体が差し替わった場合（確かめと保存は別の command。次の確認が止める）。「止めすぎない」: `InventoryBackup` の中の folder と媒体の root は止めない（互いの掃除が file を消さない、71 §71.11.3）。
- 判定: ready（plan-draft、2026-10-23。J1 の commit で design に戻り、正本を足して plan-draft へ戻した）。未解決の設計の問いは無い。(b) の plan-approved は (a) の plan-approved の後（上の「(a) への依存」）。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 | (b) の扱い |
|---|---|---|
| Tauri command（frontend から呼ぶ） | `lib.rs` の specta `collect_commands!` 登録 / `#[tauri::command]` + `#[specta::specta]` の対 / `bindings.ts` の再生成 | 6 command に `#[tauri::command(async)]` + `#[specta::specta]`、`collect_commands!` と `generate_handler!` の両方、`cargo run --bin generate_bindings`。AC3 |
| function-design doc 新設 | `build_doc_to_modules_map()` | 新しい doc は無いが、新しい module `mnt::offsite` を既存の `71-mnt-backup.md` の行に足す（`src-tauri/tests/design_compliance_test.rs`）。71 に無い `pub fn` を作らない。AC6 |
| source / workflow doc 新設・改名・削除 | 親文書の目次・索引 | 該当なし |
| REQ / coverage | `cargo run --bin generate_traceability` で `90-traceability.md` 再生成 | test に REQ-901 と決定 ID を付ける（REQ-901 の coverage は既に required）。再生成を S3 の完了条件に含める。AC8 |
| route 新設・改名・削除 | `npm run generate:routes` | 該当なし |
| operator 画面新設・改名・削除 | `navigation.ts` と到達テスト | 該当なし（既存の `/settings/backup` とホームの中。ホームの知らせから `/settings/backup` への link は Matrix の UI-00-D12 の行が href を見る） |

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 媒体の列挙（drive の種類）・reparse point の判定・thread の error mode・volume GUID path は OS に依る部分で、`mnt::offsite` の中の小さな関数（Windows だけの列の作り方と判定）に閉じ、root の列を受ける内部関数は OS に依らない。core は「目印と状態で見分ける」「照合してから正式名」「状態は DB の外」「3 日で知らせる」 | USB の HDD を許すときは列の作り方と判定だけを替える（MNT-01-D8 の見直し契機） |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 事実: owner の USB は Windows で取外し可能な drive（TD-375、(a) の probe）、(a) の probe の P7〜P10。外部前提: P11（下の Contract Probe）。判断: D-114・MNT-01-D8・UI-11b-D14〜D16・UI-00-D12（正本に済み）と起票の commit の 3 つ。J1: owner の決定（TD-398）は A を選ぶこと。判定の時点を 3 つにする・別の command にする・(4) に入れるのは Writer の技術判断（上の「owner の判断事項」、MNT-01-D11、D-130）。外部前提: P12 | Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 写しの途中の抜去は作業名が残り次の確認で消して写し直す。公開の後の失敗は正式名が残り `UpToDate`。照合の失敗は作業名を消す。用意の再実行は同じ `medium_id`。作り直しの途中の失敗は押し直せる。やめた後は用意の前。前の版へ戻しても file は見えないだけ（Rollback notes） | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 店主の操作は無し（差しっぱなしの控え 1 を抜かない、知らせが出たら差し直す）。owner が用意・入れ替え・短い確かめ・保存先の選び直し・やめる（Ordinary Operation、71 §71.13） | L3-b1〜L3-b7 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 保存先を USB の HDD・network に広げるときは §71.11.3 の発見だけを替え、写し・照合・状態・知らせは残る | D-114 の Revisit |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | test は一時 directory の合成の DB・目印・状態の file。L3 は試しの DB。媒体の中身・状態の file の中身・volume GUID を repo に置かない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | not applicable: 業務の数値を変えない（日数・札・商品の数は控えの表示だけ） | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | drive の種類の判定・空の読取り機の口で dialog が出ないこと・volume GUID path への copy と照合と公開・抜き差しと drive 文字の変化・レジの SD の拒否・媒体から読む確かめ・保存先と媒体の `InventoryBackup` の固定した path の比べ方（volume GUID の形、P12）は Windows でしか通らない（CI に Windows の runner は無い）。3 日の知らせ・壊れた記録・新しすぎる版は L3 Eligibility の (3) に当たるので自動 test、ホームの知らせの目視は Coordinator が用意する状態の file で行う（L3-b5） | L3-b1〜L3-b7、Contract Probe |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 新しい依存は足さない（`windows-sys = "=0.61.2"` の feature だけ、`sha2`・`uuid` は既存）。Windows 以外の test は root の列を受ける内部関数と symbolic link で同じ関数を通す（71 §71.11.3）。Windows の runner を CI に足すことは defer（(a) と同じ理由） | — |

## Boundary / Wire Contract

- producer: MNT-01（71 §71.11）、CMD-11（43 §43.8.2〜§43.8.4・§43.8.6〜§43.8.8）
- consumer: UI-11b（`getOffsiteBackupStatus`・`prepareOffsiteMedium`・`checkOffsiteBackup`・`resetOffsiteState`・`stopOffsiteBackup`・`checkBackupDirChoice`〈J1〉、(a) の `inspectBackup`）、UI-00（`getOffsiteBackupStatus`）
- wire type: `PrepareOffsiteMediumRequest { selected_path: String }`、`OffsiteMediumView { label, drive_root, newest_copy? }`、`OffsiteCheckResult`（`kind` の tagged enum 5 値: `not_prepared` / `no_local_backup` / `medium_missing` / `up_to_date` / `copied { file_name, labels }`）、`OffsiteBackupStatus { prepared, last_success_at?, last_success_label?, days_since_last_success?, stale, attached[], last_failure_kind?, local_backup_old }`、`OffsiteFailureKind`（8 値、snake_case。J1 で `backup_dir_is_medium_folder` を足した）、`BackupDirChoiceRequest { selected_path: String }`（J1、43 §43.8.8）。error は既存の `CmdError`（`validation` / `internal`、`CmdErrorKind` に値を足さない）。`stop_offsite_backup` と `check_backup_dir_choice` は `null`
- internal type: `OffsiteMediumMarker`（媒体の `InventoryBackup\offsite-medium.json`）と `OffsiteState`（`{app_data_dir}\offsite-backup.json`）、`format: 1` の JSON。wire に出さない。`OffsiteError` の 14 値は CMD が 43 の表の固定の文へ写す
- precision/range: `days_since_last_success` は chrono の日付の差で JS の安全な整数の内。日時は `YYYY-MM-DD HH:MM:SS`（ローカル時刻）の文字列。SHA-256 は状態の file の中だけ
- round-trip path（J1）: directory picker の path → `checkBackupDirChoice({ selected_path })` → `Ok` のときだけ同じ値で `updateSetting({ key: "backup_path", value })`
- round-trip path: 用意（目印・状態を書く）→ 確認（目印を読み、写し、状態を書く）→ status（状態と見えている媒体を読む）→ card・ホーム。復元: file picker の path → (a) の `inspectBackup({ backup_path })` → `restore_detail` → 既存の `restoreBackup({ backup_path })`（同じ値）
- invalid input: 空の `selected_path` は `validation`。取外し可能でない・レジの SD・`format` が 1 でない目印・reparse point の媒体は `validation` の固定の文。状態の file の形の違い・`format` が 1 でない数は `StateUnreadable`（作り直しは `StateUnsupported`）。用意済みの媒体が見えない作り直しは `NoMediumAttached`。PC の中の保存先（選ぼうとする folder を含む）が媒体の `InventoryBackup` と同じ folder は `BackupDirIsMediumFolder` の `validation` の固定の文（J1、保存先の選択・用意・確認）
- compatibility: 既存の command・DTO・`CmdErrorKind`・`app_settings`・DB の schema は変えない。新しい版のアプリが置いた目印・状態（`format` が 1 でない）を (b) の版が上書きしない（71 §71.11.1・§71.11.2 手順 4）。前の版のアプリは (b) の file を読まない（Rollback notes）

## Test Plan

Test Design Matrix: [2026-10-23-backup-offsite-runtime-b](test-matrices/2026-10-23-backup-offsite-runtime-b.md)。

- targeted tests: AC2・AC4・AC6 の command。
- negative tests: Matrix の Negative Paths。
- compatibility checks: (a) の backup・restore の test と `useAutoBackupCheck.test.tsx`・`BackupRestorePage` の test を回帰で回す。
- data safety checks: 差分に実データ（店の DB・backup file・媒体の中身・状態の file の中身・実 JAN・商品名・金額・volume GUID）を入れない。
- main wiring/integration checks: `RootLayout.tsx` の `useAutoBackupCheck` から `checkOffsiteBackup` まで（Matrix の UI-11b-D16 の行は実物の hook）、`HomePage.tsx` の `OffsiteBackupWarning` から status の query まで（Matrix の UI-00-D12 の行は実 hook + QueryClient）、CMD の 6 command から `mnt::offsite` まで（Matrix の 43 の行）、`BackupRestorePage.tsx` の「保存先を選ぶ」から `checkBackupDirChoice` を経て `updateSetting` まで（Matrix の UI-11b-F3 の行）。
- Writer の完了条件に `cd src-tauri && cargo check --release`（AC9）。

L3（Windows の実機、owner の目視。(a) と束ねない: 下の「並走との重なり」のとおり (a) と 16 file を共有するので D-124 の条件を満たさない。(b) が merge の train の先頭に来て `origin/main` を取り込んだ head で頼む）。owner の手の回数を減らす工夫: 1 回の座りで L3-b1〜L3-b7 を台本の順に通す（同じ USB メモリを L3-b1 の試しの folder → 消す → L3-b2 の用意の順で使い回し、2 本目は L3-b3 だけ）。ホームの知らせの目視（L3-b5）は Coordinator がアプリを閉じた間に状態の file を用意し、owner は見るだけ。最後に L3-b7 でやめて、owner の PC を用意の前の状態に戻す（媒体の写しは消えない）。Coordinator は Ready の依頼と同時に台本と試しの DB の手順を渡す。

| ID | 確かめること | 到達経路 | 入力物 | 合格基準 |
|---|---|---|---|---|
| L3-b1 | 用意の前の文と、レジの SD の拒否（UI-11b-L3-7、MNT-01-D10） | 設定 → バックアップ・復元 →「PC の外の控え」の card →「この USB メモリを控えの保存先にする」で USB メモリの root | 控え用の USB メモリ（TD-346、中の file は消さない）の root に試しの folder `CASIO\SR500_550_4000` を作っておく。試しの DB（店の DB を使わない）。保存先は既定（「現在の保存先」が PC の中の folder） | 最初に用意の前の文が出る。選ぶと「これはレジの SD カードです（…CASIO\SR500_550_4000 が見つかりました）。…」が出て、USB メモリの一覧が前後で同じ（`InventoryBackup` ができない）。終わったら試しの folder を消す |
| L3-b2 | 用意と写し（UI-11b-L3-6。P11 の実機） | 同じ card →「この USB メモリを控えの保存先にする」で同じ USB メモリ | 同じ USB メモリ（試しの folder を消した後） | card に「最後に PC の外へ写した控え: 今日の日時（控え 1、確かめ済み）」と「控え 1 を PC の外の控えの保存先にしました」。USB メモリの `InventoryBackup` に `offsite-medium.json` と `inventory_backup_YYYYMMDD_HHMMSS.db` があり、`.partial` で終わる file が無い |
| L3-b3 | 2 本目の用意と入れ替え（UI-11b-L3-8） | 控え 1 を抜く → 2 本目を差して同じく用意 → 抜く → 控え 1 を差し直す | 控え用の USB メモリの 2 本目（手元に無ければ本項を後の回に回す） | 抜いた状態で「用意した USB メモリが差さっていません」。2 本目で「差してある控え: 控え 2」と今日の日時。控え 1 を差し直すと 60 秒以内に「差してある控え: 控え 1」（drive 文字が変わってもよい） |
| L3-b4 | 控えを選んで確かめる（UI-11b-L3-9、71 §71.13 の短い確かめの (1)） | card の「控えを選んで確かめる」→ 控え 1 の `InventoryBackup` の最新の file → 詳細 → 閉じる | 控え 1 | 詳細に「この控えは戻せます」と商品の数・最後の記録の日時が出る。閉じた後もホームの数字が変わらない。閉じてから 60 秒以内に card の表示が更新される（確認が再開する） |
| L3-b5 | ホームの知らせ（UI-00-D12 の目視） | Coordinator がアプリを閉じた間に状態の file の `last_success` を 5 日前の日時と名前にし、USB メモリを抜いてから起動 → ホーム → USB メモリを差す | L3-b2 でできた状態の file（Coordinator が WSL から用意する。消す command を使わない。元の file は退避名で残す） | ホームに「PC の外の控えが 5 日写せていません。USB メモリが差してあるか確かめてください。」と「バックアップ画面へ」が出る（色だけでなく文で）。差すと 60 秒以内に知らせが消える |
| L3-b6 | 保存先に USB メモリの InventoryBackup を選ぶと止まる（UI-11b-L3-10、MNT-01-D11、J1。P12 の実機） | 控え 1 を差したまま、バックアップの設定の「保存先を選ぶ」→ 控え 1 の `InventoryBackup` を選ぶ | 控え 1（L3-b2 で用意したもの） | 設定の card に「PC の中の保存先が、USB メモリの InventoryBackup フォルダと同じです。「保存先を選ぶ」で PC の中の別のフォルダを選び直してください」が出て、「現在の保存先」が前と同じ（保存されない） |
| L3-b7 | やめる（UI-11b-D14、§68.4 手順 5） | card の「PC の外の控えをやめる」→ 確認で「キャンセル」→ もう一度押して「やめる」 | — | キャンセルでは何も変わらない。やめると「PC の外の控えをやめました」と用意の前の文。USB メモリの `InventoryBackup` の中身が前後で同じ。ホームに知らせが出ない |

human visual confirmation（`docs/DEV_WORKFLOW.md` Human Visual Confirmation For Screen Changes）: 対象は `/settings/backup` の「PC の外の控え」の card（用意の前・写せた後・差さっていない・やめた後の文、button の 3 つ）と「控えを選んで確かめる」の詳細、ホームの知らせ（`/`）。日本語の文は上の L3 の合格基準。壊れた記録・写す元が古い・空きなし・差してあるのに写せない・保存先が媒体の InventoryBackup と同じ folder（(4) の `backup_dir_is_medium_folder`）の各原因の文は L3 Eligibility の (3) に当たるので、`offsite-status-text.test.ts` の完全一致と card・ホームの component の test で固定し、目視は L3-b5 の (5) の文で代表する（受け入れた残りのリスクは Residual Test Gaps に書き、Ready の依頼で owner に示す）。

## Review Focus

- Ordinary Operation の列が正常な条件で目的（差してあれば何もしなくても写り、写せない日が続けば原因ごとに知らされ、選んだ控えを確かめられる）を達成できるか。
- (a) への依存の一覧に漏れが無いか。(a) の是正で変わりうる所に (b) が依るとき、当て直しの観点が書けているか。
- 起票の commit の 3 つの設計の直し（(5) の分け方、成功の記録の置き換えの後の sync の失敗、file 名の表示）が D-114 と他の節（UI-11b-D16 の toast、§68.4 手順 4、§71.11.7）と矛盾しないか。
- 1 lane のままにした判断と、横断の約束の表が 71 §71.11.4 のエラーの表・§71.11.5a・§71.11.5b と一致するか。test の注入点が本番と同じ関数を通るか（root の列を受ける内部関数、file 操作の trait）。
- J1 の A（TD-398）の入れ方: 同じ folder の判定が固定した path で 3 つの時点（保存先の選択・用意・確認）に同じ関数で入り、止めすぎない（`InventoryBackup` の中の folder・媒体の root）か。保存先の選択を別の command にした判断（`update_setting` に分岐を足さない）と、原因の文を (4) に入れて番号を付け直さない判断が妥当か。この変更で不要になる記述・条件・code が他に無いか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| MNT-01-D8（型・保存の形） | 71 §71.11.1 | `mnt/offsite.rs` | Matrix の MNT-01-D8 用意・状態の行、公開の順の行 | 非対象 |
| MNT-01-D8（用意） | 71 §71.11.2 | `prepare_offsite_medium` | Matrix の MNT-01-D8 用意の 8 行 | L3-b1・L3-b2・L3-b3 |
| MNT-01-D8（探す・媒体の固定・reparse point・error の dialog） | 71 §71.11.3 | 媒体を探す内部関数、`pin_to_volume` の root への使用、thread の error mode の guard | Matrix の写しの「目印の無い媒体」「入れ替わった媒体」「reparse point」の行 | L3-b2・L3-b3（drive の種類・空の口・drive 文字の変化） |
| MNT-01-D8（写し・照合・保持・排他） | 71 §71.11.4（エラーの表、本 commit の行を含む） | `check_offsite_backup` と本体の内部関数、`Mutex<()>` | Matrix の写し・照合・保持の行、`test_check_offsite_req901_d8_success_record_sync_failure_stays_copied` | L3-b2・L3-b4 |
| MNT-01-D8（status・`local_backup_old`・3 日） | 71 §71.11.5 | `offsite_status` | Matrix の状態の行 | L3-b5 |
| MNT-01-D8（作り直し） | 71 §71.11.5a（本 commit の手順 7 の項を含む） | `reset_offsite_state` | Matrix の作り直しの 6 行 | 非対象（L3 Eligibility の (3)） |
| MNT-01-D8（やめる） | 71 §71.11.5b | `stop_offsite_backup` | Matrix のやめるの 3 行 | L3-b7 |
| MNT-01-D8（保証の範囲） | 71 §71.11.7 | 上の全部 | 上の行 | — |
| MNT-01-D11（同じ folder の判定と 3 つの時点、J1） | 71 MNT-01-D11、§71.11.2 手順 3c、§71.11.3 の「PC の中の保存先と同じ folder の判定」、§71.11.4 手順 3 とエラーの表、§71.11.7、D-130 | 判定の関数（S1）、`prepare_offsite_medium`・`check_offsite_backup`（S2） | `test_prepare_offsite_req901_d11_backup_dir_same_folder_is_refused`・`test_check_offsite_req901_d11_backup_dir_same_folder_writes_nothing` | L3-b6（判定の Windows の形） |
| MNT-01-D11（保存先の選択の確かめ） | 71 §71.11.5c | `check_backup_dir_choice`（S2） | `test_check_backup_dir_choice_req901_d11_refuses_only_medium_folder` | L3-b6 |
| MNT-01-D10（媒体の側） | 71 MNT-01-D10、§71.11.2 手順 3、§71.11.3 | 用意と探す規則 | `test_offsite_req901_d10_prepare_and_copy_refuse_register_sd_root` | L3-b1 |
| 71 §71.3（媒体の写しの並び） | 71 §71.3 | (a) の名前の解析を媒体の掃除・並びに使う | `test_check_offsite_req901_d8_multibyte_names_on_medium_do_not_panic` | 非対象 |
| 71 §71.4.1（媒体の公開） | 71 §71.4.1 | (a) の `publish_no_replace` | `test_check_offsite_req901_d8_publish_does_not_replace_existing_copy` | L3-b2 |
| 43 §43.8.2〜§43.8.4・§43.8.6〜§43.8.8 | 43 の表、§43.8.8、エラーの写像の表（`BackupDirIsMediumFolder` の行を含む）、DTO の形 | `cmd/settings_cmd.rs` の 6 command、`lib.rs` | Matrix の 43 の 4 行 | 非対象 |
| 43「実行の thread」 | 43 §43.8.2〜§43.8.7 の前文、§43.8.8 | 6 command の `#[tauri::command(async)]` | `test_offsite_cmds_req901_run_off_main_thread`（(a) の `test_inspect_backup_cmd_req901_runs_off_main_thread` に足す形でもよい） | 非対象 |
| UI-11b-F8・D14 | 68 UI-11b-F8・D14（起票の commit の (5) と、J1 の commit の (4) の `backup_dir_is_medium_folder` を含む）、§68.4 PC の外の控えの手順 1〜5、§68.7 の `offsite_*`、§68.9、§68.11 | `OffsiteBackupPanel.tsx`・`offsite-status-text.ts`・`BackupRestorePage.tsx` | Matrix の UI-11b-D14 の 5 行 | L3-b1〜L3-b3・L3-b7、目視 |
| UI-11b-F3・§68.4 の backup_path 変更（保存の前の確かめ、J1） | 68 UI-11b-F3、§68.3、§68.4 の backup_path 変更の手順 1〜5、§68.7 の `path_selecting`、§68.8 の設定保存、§68.11 の backup_path 保存失敗 | `BackupRestorePage.tsx` | Matrix の UI-11b-F3 の行 | L3-b6 |
| UI-11b-F9・D15（file の入口） | 68 UI-11b-F9・D15、§68.4 復元の手順 1・1a、§68.9 の file 名の表示（本 commit） | `BackupRestorePage.tsx` | Matrix の UI-11b-D15 の file の入口の 2 行 | L3-b4 |
| UI-11b-F10・D16 | 68 UI-11b-F10・D16、§68.10 | `useAutoBackupCheck.ts` | Matrix の UI-11b-D16 の 3 行と D15・D16 の行 | L3-b3・L3-b4（60 秒以内） |
| §68.10（invalidate） | 68 §68.10 の PC の外の控えの 4 行 | `useAutoBackupCheck.ts`・`BackupRestorePage.tsx` | Matrix の UI-11b-D14・D16 の行 | 非対象 |
| UI-00-D12 | 53 §53.1、§53.5 UI-00-D12（起票の commit の (5) と、J1 の commit の (4) の `backup_dir_is_medium_folder` を含む）と query 失敗の行 | `OffsiteBackupWarning.tsx`・`HomePage.tsx` | Matrix の UI-00-D12 の行 | L3-b5、目視 |
| 22 §16 の folder の外の場所 (3) | 22 §16 | 文の直し（code なし） | — | 非対象 |
| 71 §71.13（短い確かめの (1)） | 71 §71.13 | 上の file の入口と停止 | Matrix の D15・D16 の行 | L3-b4 |
| D-114 | `docs/decision-log.md` D-114 | 上の全部 | 上の全部 | 上の全部 |
| Rollback（前の版から見えない） | 本 packet の Rollback notes | file の置き場所と名前 | Matrix の rollback の行 | 非対象 |
| 隣接の除外（(a) へ）: MNT-01-D7・D9・D10 の PC の中の側、UI-11b-D13・D15 の一覧の行の入口、§68.4 手動バックアップ手順 4 | 71、68 | (a) の packet | (a) の Matrix（回帰で回す） | (a) の L3 |
| 隣接の除外: MNT-01-D1〜D6、UI-11b-D2〜D5・D11・D12、D-032 | 71 §71.7、68 §68.5 | 変えない（file の入口は確かめの後に既存の restore に入る） | 既存の restore の test と、Matrix の「アプリの今の DB を選んだとき」の行 | 非対象 |
| 隣接の除外: UI-11b-D8、MNT-01-D3、§71.5 の保持日数の掃除、43 §43.4 の `update_setting` | 68 §68.5、71 §71.5・§71.8、43 §43.4 | 変えない（保存先は native picker だけで選ぶまま。J1 の確かめは保存の前に別の command で行い、`update_setting` と掃除の契約は変えない。掃除が同じ folder の写しを消す残りは 71 §71.11.7 の例外） | 既存 | 非対象 |
| 隣接の除外: D-111・IO-09-D3 | D-111、29 §29.7 | 変えない（folder 名の定数を共有するだけ） | — | 非対象 |

Contract Audit（新しく足す契約の文を境界の 4 観点で一巡した。起票の commit の分: 3 つの正本の直しと、本 packet の Scope の小さな実装の決定）:

- 安全な整数の範囲: 新しい文は数を足さない。(5) の `{N}` は `days_since_last_success`（chrono の日付の差、43 §43.8 の DTO の形）。file 名の表示は文字列だけ。
- 0 の表示: (5) の 2 つの文はどちらも `last_success_at` が無いとき「まだ写せていません」の形で、`{N}` に 0 や空を出さない。`stale = true` は `last_success_at` が無いか `{N}` が 3 以上なので、日数の文に 0・1・2 は出ない。作成日時が取れない file は日時を作り出さず file 名を出す（既定の日時〈0 時 0 分〉を出さない）。
- 失敗の時点と順序: 成功の記録の置き換えの後の親 directory の sync の失敗を「成功のまま・warn」と決めた（§71.11.4 のエラーの表）。置き換えの前（作業名の書込み・`sync_all`・置き換えそのもの）の失敗は今までどおり `Io`。横断の約束の表の `check_offsite_backup` の行に順を置いた。
- 単位や種類の混在: (5) の分け方は「今見えている媒体」（`attached`）を材料にし、「最後に失敗した媒体」（状態の `last_failure.medium_id`、wire に出ない）と混ぜない。だから文は札を名指さない（失敗した媒体と差してある媒体が違いうる。札は副情報の「差してある控え」が出す）。file 名の表示は「作成日時」と「file 名」の 2 つの種類を混ぜず、作成日時が取れるときは今までどおり日時だけを出す。

J1 の commit で足した契約の文（TD-398、D-130、71 MNT-01-D11）:

1. 71 §71.11.1: `OffsiteFailureKind` の 8 値目と `OffsiteError` の 14 値目 `BackupDirIsMediumFolder`。`kind()` は `Some(同じ値)`。
2. 71 §71.11.2 手順 3c とエラーハンドリング: 用意は reparse point の判定の後・手順 4 の書込みの前に止め、何も書かず `last_failure` にも残さない。folder がまだ無くても止める。
3. 71 §71.11.3「PC の中の保存先と同じ folder の判定」: 両側を `pin_to_volume` で固定した `actual` を component ごとに比べる（Windows は ASCII の大文字・小文字を区別しない）。文字列・drive 文字の path を比べない。保存先を固定できなければ同じと見なさない。同じ folder だけを止め、`InventoryBackup` の中の folder と媒体の root は止めない。
4. 71 §71.11.4 手順 3 とエラーの表の行: 媒体を探した後・写す元の検査（手順 3a）の前に止め、どの媒体にも書かず・消さず、`last_failure = { kind: BackupDirIsMediumFolder, medium_id: その媒体 }`、`last_success` は変えない。
5. 71 §71.11.5c `check_backup_dir_choice`: 状態の file を読まずに §71.11.5a 手順 3 と同じ探し方で目印のある媒体を探し、同じ folder なら `Err`。書かない・lock を取らない・読めない root は飛ばして `Ok`・既存の `backup_path` を書き換えない。
6. 71 §71.11.7 の項と MNT-01-D11: 3 つの時点、例外（選んだ時点で目印の無かった folder、drive 文字の割当ての変化、止めている間の保持日数の掃除）。
7. 43 のエラーの写像の表の行（`validation`、固定の文）、DTO の形の 8 値、§43.8.8（`BackupDirChoiceRequest` → `null`、空は `validation`、`(async)`、DB なし、`update_setting` に分岐を足さない理由）、§43.11 の command の数。
8. 68 UI-11b-F3、§68.3、§68.4 の backup_path 変更の手順 3〜5（確かめ → `Ok` のときだけ同じ値で保存、`Err`・例外は保存せず `path_update_error`）、UI-11b-D14 の (4)、§68.7 の `path_selecting`、§68.8、§68.11 の 2 行、§68.12 の UI-11b-L3-10。
9. 53 UI-00-D12 の (4) とホームの文（「バックアップ画面の「保存先を選ぶ」」）。
10. `docs/decision-log.md` D-130。

境界の 4 観点（上の 1〜10 を一巡した）:

- 安全な整数の範囲: 数を足さない。(4) の `{N}` は今までどおり `days_since_last_success`（43 の DTO の形の範囲）。新しい wire の値は文字列の enum の値（`backup_dir_is_medium_folder`）と `null` の戻り値だけ。
- 0 の表示: (4) は `stale = true` のときだけで、`last_success_at` が無ければ「まだ写せていません。」の形、あれば `{N}` は 3 以上なので「0 日写せていません」は出ない。`stale = false`（同じ folder になってから 3 日未満）は card の副情報の固定の文だけで日数を出さない。目印のある媒体が 0 本の保存先の選択は止めずに `Ok`。確認で用意済みの媒体が 0 本なら判定の前に `MediumMissing`（判定は見つけた媒体にしか掛からない）。
- 失敗の時点と順序: 用意は 状態を読む（3a）→ reparse point（3b）→ 同じ folder（3c）→ 書込み（4）。読めない状態は `StateUnreadable` が先。確認は 状態 → 写す元の一覧（`Err` が先）→ 媒体を探す（0 は `MediumMissing` が先）→ 同じ folder → 写す元の検査（3a）→ 写し。作り直しの手順 7 で同じ folder になったら §71.11.4 の失敗をそのまま返し（`StateResetFailed` にしない、§71.11.5a）、card は取り直した status の `last_failure_kind` で決める。保存先の選択は 確かめ → 保存で、`Err`・例外なら保存しない。確かめと保存の間の差し替えは次の確認が止める（Design Readiness の絶対保証の自己点検）。失敗の toast は連続の最初の 1 回の今の文のまま（UI-11b-D16）で、原因は card が名指す。
- 単位や種類の混在: 比べるのは固定した `actual` 同士だけで、設定の文字列・drive 文字の path・volume GUID path を混ぜて比べない。用意と確認は状態に登録した媒体（その媒体にしか書かない）、保存先の選択は目印のある媒体全部（状態を読まない。別の PC の控えも保持日数の掃除が消す）を相手にし、相手の範囲の違いは §71.11.5c 手順 1 に理由を置いた。`CmdError` の kind は 3 つの入口とも `validation`、`last_failure` に残すのは確認だけ（用意は何も書かない）。card は「保存先を選ぶ」、ホームは「バックアップ画面の「保存先を選ぶ」」で、button の名前の付け方は既存の規則（UI-11b-D14 の前文）のまま。

継ぎ足さない（D-127）の sweep（2026-10-23、J1 の commit の後に `rg -n '<式>' docs src src-tauri --glob '!docs/archive/**'` で洗った。hit の列は直す前の hit で、直した後に残る hit は「扱い」の列に書いた。本表の式そのものの hit は数えない）:

| 旧い言い方の式 | hit | 扱い |
|---|---|---|
| `J1 が B\|既定 B\|既定は B\|B は文\|J1 の B\|（既定 B` | 起票の時点: packet の S7・Scope の 71 の行・Contract Ledger の保証の範囲と隣接の除外・Non-scope・Design Readiness、Matrix の Negative Paths | 直した。残る hit は packet の「J1 の commit で不要になった条件」の 1 行（外した文の記録）だけ。正本に B の文は無かった |
| `OffsiteFailureKind.{0,6}7 値\|7 値、snake\|の 7 値`・`13 値` | 71 §71.11.1 の注記、43 の DTO の形、packet の Boundary / Wire Contract、Matrix の Boundary Checks | 直した（8 値・14 値）。直した後の hit は 0 件 |
| `5 command\|5 つの command\|5 つの公開関数\|5 つの新しい command\|5 つの関数` | packet の S3・Scope の表・呼出し側の表・(a) への依存の表・Registration・Main wiring・節の所有表、Matrix の 43 の行と Main Wiring | 直した（6）。対象外: packet の「(a) への依存」の 2 か所（(a) の Matrix の文「(b) は同じ test に残りの 5 command を足す」と、(a) が予定する注記「5 つの関数」の引用。(a) の文で、(b) は 6 に読み替えると同じ行に書いた）、43 の「層経路（D-060）」の段落の「backup/restore 系 5 command」（D-114 の前からある既存の command の数）、`docs/backlog.md`・`docs/UI_TECH_STACK.md`・`docs/research/` の hit（別の文脈の数） |
| `L3-b1〜L3-b6\|L3-b6` | packet の Test Plan・AC10・Lens 2 行・Contract Ledger 2 行 | 直した（新しい L3-b6 を保存先の選択にし、やめるを L3-b7 へ。範囲は L3-b1〜L3-b7） |
| `D=74`・`新しい型 5\|新設 5`・`7 経路` | packet の AC3・規模と手法の表・横断の約束の前文 | 直した（75・6・8）。`7 経路` の残りの hit は `docs/function-design/10-common-rules.md`（別の文脈） |
| `D-130 は使わない` | packet の Design Readiness | 直した（D-130 を使った理由） |
| `43\.8\.4・§43\.8\.6・§43\.8\.7` | packet の S3・Tauri command の行・Contract Ledger・producer、Matrix の Contracts Under Test | 直した（§43.8.6〜§43.8.8） |
| (4) の失敗の種類の列挙（`storage_full` と `verify_mismatch` を並べた所。式 `rg -n 'storage_full.{1,6}verify_mismatch'`） | 68 UI-11b-D14、53 UI-00-D12、packet の横断の約束、Matrix の UI-11b-D14 の行 | 直した（どれも `backup_dir_is_medium_folder` を含む） |
| `UI-11b-L3-6〜L3-9` | `docs/backlog.md`（「PC の外の控えの runtime」の項） | 対象外: 本 run の編集の範囲の外（backlog は closeout が持つ、Scope の「触らない」）。packet の Design Readiness は L3-10 まで直した |
| `D-114` の「command 6 つ」（`docs/decision-log.md` D-114 の Compatibility） | 1 件 | 対象外: merge 済みの決定の本文は append-only（decision-log の Status の書き方）で、本 run の編集の範囲は D-130 の追加だけ。D-130 の Compatibility が「7 つになる」と書いた。D-114 に `Superseded in part by` の行を足すかは Coordinator の判断（発注と食い違って判断した点に報告） |

## Contract Probe

- P1 店で使う USB メモリが Windows の `GetDriveTypeW` で `DRIVE_REMOVABLE` に見える: **確認済み**（2026-10-22、repo 外の回答台帳 TD-375 の `DriveInfo.DriveType` の `Removable`）。design の packet が runtime の lane に残した前提（`Removable` を `DRIVE_REMOVABLE` と同じ区分と見なす）は、(a) の Contract Probe（owner の Windows の PC、2026-10-23）で `GetDriveTypeW` を直接呼んで `DRIVE_REMOVABLE` を得たので閉じた（値は書かない）。
- P2 写した直後の読み戻しが file cache から返るか: **probe しない**（design の packet のとおり、保証の範囲を狭めた。71 §71.11.7）。
- P3 空の読取り機の口で error の dialog が出るか: **設計で前提から外した**（`SetThreadErrorMode`、71 §71.11.3）。L3-b2・L3-b3 は店の型の PC で媒体を探す経路を通し、dialog が出ないことを目視で見る（合格基準の外の観察として報告する）。
- P4 `immutable=1` の読取り専用の open が file と folder を変えない: **閉じた**。(a) の Contract Probe の P10（owner の Windows の PC、2026-10-23）で、71 §71.12 手順 1 の形（`%`・`?`・`#` だけを符号化した `file:` URI + `?immutable=1`、`SQLITE_OPEN_READONLY | SQLITE_OPEN_URI`）で FAT32 の USB と `%APPDATA%` の上の DB を開いて読め、folder の file が増えなかった（Windows 同梱の SQLite での代わりの確かめ。WAL の DB の実測は (a) の Matrix の MNT-01-D9 の行）。(b) は「控えを選んで確かめる」と §71.11.4 手順 3a で同じ関数を使うだけ。
- P5 空きの USB の口は 1 つ・P6 訪問の間隔は決まっていない: **観測**（TD-198・TD-199、design の packet のとおり）。L3-b3 は抜いてから差す順にした。
- P7〜P10（(a) の Contract Probe、owner の Windows の PC、2026-10-23 の 2 回。FAT32 の USB と `%APPDATA%`〈NTFS〉の両方。値は書かない）: **4 つとも PASS**。P7: Windows 同梱の SQLite で volume GUID path の作業名へ `VACUUM INTO` → `MoveFileExW`（置き換えなし）で正式名へ移せた。P8: USB の root と `%APPDATA%` の folder で `GetFinalPathNameByHandleW(VOLUME_NAME_GUID)` が volume GUID path を返し、USB の `GetDriveTypeW` は `DRIVE_REMOVABLE`。P9: volume GUID path の folder を `CreateFileW`（`GENERIC_WRITE`、`FILE_FLAG_BACKUP_SEMANTICS`）で開いて `FlushFileBuffers` が通った（restore の `sync_parent` と同じ形）。P10: 上の P4。(b) にとっては、媒体の root の固定（§71.11.3 の「媒体の固定」）、媒体の上の上書きしない公開（§71.11.4 手順 4f）、公開の後と目印・状態の置き換えの後の親 directory の sync、選んだ file の open の前提がこれで閉じた。exFAT の媒体は probe に無い（店の USB は FAT32。Residual Test Gaps）。
- P11 FAT32 の USB の volume GUID path の下で、Rust の std の file の copy（作業名へ）・`File::sync_all`・開き直しての読み戻し（71 §71.11.4 手順 4d・4e）が通る: **未確認（L3-b2 で確かめる）**。P7 は SQLite の `VACUUM INTO` で書いており、Rust の std の copy と読み戻しは通していない。ただし同じ OS の操作（`CreateFileW` の file handle への書込みと `FlushFileBuffers`）で、std は `\\?\` の前置の path をそのまま `CreateFileW` に渡す（変換しない）ので、外れる見込みは小さい。owner に別の probe を頼まない（owner の手の回数を減らす。用意の直後の写しは手順 4d〜4g を全部通るので、L3-b2 が同じ経路を通る）。外れたら（copy・読み戻しが失敗し、用意の後の card が「まだ PC の外へ写せていません」のまま）implementing で止め、Gated Amendment として design の直しを Plan Review に出す。
- P12（J1）Windows で、用意した USB メモリの root を `pin_to_volume` で固定した path に `InventoryBackup` を付けた path と、同じ folder（`E:\InventoryBackup`）を固定した path が、同じ volume GUID の形（`\\?\Volume{GUID}\InventoryBackup`）で比べられる: **未確認（L3-b6 で確かめる）**。Microsoft の資料は `VOLUME_NAME_GUID` を「drive の名前の代わりに volume GUID path を返す」とし（https://learn.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-getfinalpathnamebyhandlew ）、(a) の P8 は USB の root と `%APPDATA%` の folder の両方でその形を得た（値は書かない）ので、外れる見込みは小さい。owner に別の probe を頼まない（L3-b6 が同じ判定の関数を、directory picker で選んだ在る folder で通す）。外れたら（L3-b6 で止まらずに保存される）implementing で止め、Gated Amendment として判定の直しを Plan Review に出す。
- 観測済みで probe の要らない前提: `sha2`・`uuid`・`windows-sys` の `Win32_Storage_FileSystem` は既存の依存（`src-tauri/Cargo.toml`）。`GetLogicalDrives`・`GetDriveTypeW` が同じ feature にあることは design の Plan Review が同版の crate の source で確かめた（design の packet の Impact Review Lenses）。`SetThreadErrorMode` は `windows_sys::Win32::System::Diagnostics::Debug`（docs.rs の windows-sys 0.61.2、71 §71.11.3）。どれも S1 の build で確かめる（OS の振舞いの前提ではない）。

## Data Safety

- tracked に書かない: 店の DB・backup file・USB メモリの中身・状態の file の中身・volume GUID と drive の path・実 JAN・商品名・金額・店主の発言の原文・repo 外の回答台帳の細部（TD の番号と要旨だけを書いた）。
- local-only: L3 の試しの DB とその backup、USB メモリの `InventoryBackup` と試しの folder（`CASIO\SR500_550_4000`、L3-b1 の後に消す）、L3-b5 で Coordinator が用意した状態の file と退避名の元の file、owner の `%APPDATA%\com.kosei.inventory` の `offsite-backup.json*`。
- synthetic-only: test は一時 directory に合成の DB の控え・目印・状態の file・`CASIO/SR500_550_4000` の folder・symbolic link を作る。媒体の「root の列」も一時 directory。
- 媒体の露出: 控えは暗号化しない（owner が受けた、D-114 の owner の決定 1、TD-196）。L3 の USB メモリには試しの DB の控えだけが入る。

## 並走との重なり

`comm -12` の結果（2026-10-23。本 packet の予定 path 33〈起票の時点。J1 の commit で足した 34 本目の `docs/decision-log.md` は下の #188 の行〉と、次の 4 つを突き合わせた。(a)〈PR #190、`origin/agent/backup-offsite-runtime` の head `b8b201a5`〉: packet の Scope の予定 path 25 と branch の差分 7〈`git diff --name-only --no-renames origin/main...origin/agent/backup-offsite-runtime`: `docs/Plans.md`・`docs/backlog.md`・`docs/msi-distribution-runbook.md`・`docs/function-design/68-ui-backup-restore.md`・`docs/function-design/71-mnt-backup.md` と packet・Matrix〉。#172〈PR #172、head `9f02ddd7`〉: packet の S1〜S6 と節の所有表の予定 path。#188〈PR #188 の b1、head `40ee8de4`。実装 1 段目は local で進行中〉: packet の「予定 path の一覧」の 148。b2〈`agent/stocktake-count-runtime-b2`〉: 起票中で packet が無い（remote の branch は `eed07d37` のままで差分 0）。重なりは b2 の packet が置かれた後に Coordinator が見る）:

- (a) と 16 file: `docs/FUNCTION_DESIGN.md`・`docs/function-design/43-cmd-settings-log.md`・`docs/function-design/68-ui-backup-restore.md`・`docs/function-design/71-mnt-backup.md`・`docs/function-design/90-traceability.md`・`src-tauri/Cargo.toml`・`src-tauri/src/cmd/settings_cmd.rs`・`src-tauri/src/lib.rs`・`src-tauri/src/mnt/backup.rs`・`src-tauri/src/mnt/restore.rs`・`src/features/backup-restore/BackupRestorePage.flow.test.tsx`・`BackupRestorePage.test.tsx`・`BackupRestorePage.tsx`・`useAutoBackupCheck.test.tsx`・`useAutoBackupCheck.ts`・`src/lib/bindings.ts`。このうち (a) の branch の今の差分と重なるのは `68-ui-backup-restore.md`・`71-mnt-backup.md` の 2 file（(a) の round 1 の是正と本 commit の正本の直し）。節は別（下の所有表）で、`git merge-tree --write-tree` の結果は下の「(a) の差分との merge の試し」。
- #172 と 7 file: `docs/function-design/22-mnt-migration.md`・`docs/function-design/90-traceability.md`・`src-tauri/Cargo.toml`・`src-tauri/src/cmd/settings_cmd.rs`（#172 の `AppState` の literal の 15 か所の 1 つ。#172 の packet は `cmd/settings_cmd.rs` と書く）・`src-tauri/src/lib.rs`・`src-tauri/tests/design_compliance_test.rs`・`src/lib/bindings.ts`。#172 の branch の今の差分とは `22-mnt-migration.md` の 1 file（#172 は §17、本 lane は §16）。
- #188 と 9 file（J1 の commit で足した `docs/decision-log.md` を含む。#188 は D-109 の末尾の Superseded in part の 1 行、本 lane は D-130 で、節が別。`docs/decision-log.md` は (a)〈`a8285043`〉・#172〈`b852071f`〉・#188〈`40ee8de4`〉・b2〈`50c9e764`〉の branch の差分〈`git diff --name-only --no-renames origin/main...origin/<branch>`、2026-10-23〉のどれにも出ない）: `docs/decision-log.md`・`docs/FUNCTION_DESIGN.md`・`docs/function-design/22-mnt-migration.md`・`docs/function-design/90-traceability.md`・`src-tauri/src/cmd/settings_cmd.rs`・`src-tauri/src/lib.rs`・`src-tauri/tests/design_compliance_test.rs`・`src/lib/bindings.ts`・`src/lib/query-keys.ts`。#188 の branch の今の差分とは `22-mnt-migration.md` の 1 file（#188 は §20・§3.1）。加えて #188 は TS の `CmdError` の mock（`error_id: null` を持つ file）に `stocktake_recovery` を足す（#188 の Matrix の T7）ので、(b) が新しく書く test の `CmdError` の mock は、後に merge する側が同じ field を足す。

(a) の差分との merge の試し（2026-10-23、本 commit の内容の一時の commit と `b8b201a5` の `git merge-tree --write-tree`）: `71-mnt-backup.md` は自動で merge でき、`68-ui-backup-restore.md` は 2 か所が隣の行の衝突になる（本 lane が直す UI-11b-D14 の行と (a) が直す UI-11b-D15 の行、本 lane が直す §68.9 の D-114 の項と (a) が足す「復元の card」の項）。どちらも相手の行を変えていない（`eed07d37` と `b8b201a5` で本 lane が直す 2 行は同じ）ので、(a) の merge の後の単段の取り込みで両方の行を残して解く。#172（`9f02ddd7`）・#188（`40ee8de4`）の branch とは衝突なし。J1 の commit の内容で取り直した（2026-10-23、J1 の commit の内容の一時の commit と (a) の head `a8285043` の `git merge-tree --write-tree --name-only`）: `71-mnt-backup.md` は自動で merge でき、`68-ui-backup-restore.md` は 3 か所が隣の行の衝突（上の 2 か所と、本 lane が J1 で直す §68.7 の `path_selecting` の行と (a) が直す `restore_detail` の行）。どれも相手の行を変えていないので、同じく両方の行を残して解く。#172（`b852071f`）・#188（`40ee8de4`）・b2（`50c9e764`）とは衝突なし（exit 0）。

節の所有表:

| file | 本 lane が所有する節 | 他の lane | merge の後に揃える所 |
|---|---|---|---|
| `src-tauri/src/mnt/restore.rs` | file 操作の trait に足す写しの操作、「アプリの今の DB を選んだとき」の test | (a): trait の共有と `publish_no_replace` | (a) の merge の後に足す（stacked） |
| `src-tauri/src/mnt/backup.rs` | （条件つき）可視性だけ | (a): 作り方・固定・`inspect_backup` | 同上 |
| `src-tauri/src/cmd/settings_cmd.rs` | 6 command と test、§43.6 の写像の helper の共有 | (a): `create_backup` の写像・`inspect_backup`。#172: `app_state_for_test` の `AppState` の literal。#188: `CmdError` の literal | 違う symbol。後に merge する側が単段 merge で両方を残す |
| `src-tauri/src/lib.rs` | 2 つの macro の settings の塊の 5 行 | (a) 1 行、#172 2 command、#188 の command | 行が別。merge の順で両方を残す |
| `src/lib/bindings.ts`・`docs/function-design/90-traceability.md` | 生成物 | 全 lane | 衝突は手で解かず、取り込んだ後に再生成する（D-098） |
| `src-tauri/Cargo.toml` | feature `Win32_System_Diagnostics_Debug` | #172 も同じ feature、(a) は条件つきで `Win32_Storage_FileSystem` 側 | 先に merge した lane が足し、後の lane は足さない |
| `src-tauri/tests/design_compliance_test.rs` | `71-mnt-backup.md` の行 | #172: `29-io-daily-report-parser.md` の行。#188 の行 | 行が別 |
| `src/lib/query-keys.ts` | `backupRestore.offsiteStatus` | #188: `stocktake.recheckList` | 行が別 |
| `src/features/backup-restore/*`（5 file） | S4・S5 の足す所 | (a): 停止と待ち、一覧の行の入口、手動 backup の再取得、D13 の page の test の移し方 | (a) の形の上に足す（stacked）。(a) の oracle を弱めない |
| `docs/function-design/71-mnt-backup.md` | §71.1 の 2 行の注記、§71.10 の作り直しの行と MNT-01-D11 の行、§71.11（起票の commit の §71.11.4 のエラーの表・§71.11.5a、J1 の commit の §71.11.1・§71.11.2 手順 3c・§71.11.3 の判定・§71.11.4 手順 3 とエラーの表の行・§71.11.5c・§71.11.7・MNT-01-D11） | (a): §71.3・§71.4・§71.8 の注記と §71.10 の見出しの句、round 1 の是正の §71.11.4 の競合の表の復元の行と §71.12 手順 1 | 節・表が別（§71.11.4 は (a) が競合の表、本 lane がエラーの表） |
| `docs/function-design/68-ui-backup-restore.md` | UI-11b-D14 の (5) と (4)、§68.9 の D-114 の項、前文の (b) の残り、J1 の UI-11b-F3・§68.3 の 1 行・§68.4 の backup_path 変更・§68.7 の `path_selecting`・§68.8 の設定保存・§68.11 の backup_path 保存失敗と 1 行・§68.12 の UI-11b-L3-10 | (a): 前文の書き分け、round 1 の是正（`b8b201a5`）の §68.7・§68.9・§68.10・§68.11 の復元の card | §68.9 は同じ箇条の並びで、後に merge する側が両方を残す |
| `docs/function-design/43-cmd-settings-log.md` | §43.11 の 6 command、J1 のエラーの写像の表の 1 行・DTO の形の値の数・§43.8.8 | (a): §43.11 の `inspect_backup` | (a) が書き分けた段落の残りを (b) が外す |
| `docs/function-design/22-mnt-migration.md` | §16 の folder の外の場所 | #172: §17。#188: §20・§3.1 | 節が別 |
| `docs/FUNCTION_DESIGN.md` | MNT-01 の索引の行の (b) の残り | (a): 同じ行の書き分け。#188: D-118 の行 | (a) の後に (b) |

L3 の束ね: (a) とは 16 file を共有するので束ねない（D-124）。#172・#188 とも共有の path がある（上）ので、L3 の依頼の時点の head で `docs/DEV_WORKFLOW.md` Wave Operation の手順で取り直し、空でなければ束ねない。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
