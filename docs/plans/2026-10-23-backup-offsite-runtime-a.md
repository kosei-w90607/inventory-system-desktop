# Plan Packet: PC の外の控えの runtime (a)（backup を確かめてから公開し、書く先を固定し、一覧の行から復元する前に控えを確かめる）

wave に属さない単独の lane。D-114（design lane = PR #155、[packet](../archive/plans/2026-10-07-backup-offsite.md)・[Matrix](../archive/plans/test-matrices/2026-10-07-backup-offsite.md)）の runtime を 2 つの lane に分けた最初の lane（(a)）。導入の前の関門 3（[Plans の導入の前の関門](../Plans.md#導入の前の関門)）。owner の決定は repo 外の回答台帳 TD-384（2026-10-23: PC の外の控えの runtime・#188 b1 の実装・#172 を並走の候補にする）と、同日夜の owner の指示（#188 の Codex の closure を待つ間に進める）。並走の lane は PR #188（`agent/stocktake-count-runtime-b`）と PR #172（`agent/sd-direct-read-runtime`）。

## 規模と手法

**手法: lane を 2 つに分ける（(a) = PC の中の backup の作り方と復元の前の確かめ、(b) = PC の外の控え）。(a) は 1 lane・1 PR のまま S1〜S4 の段に積み、横断の約束は下の「横断の約束」の 1 つの表に先に置く。** 本 run は (a) だけを起票する。

2026-10-23 に本 worktree（HEAD `eed07d37`）で数えた:

| 区分 | runtime 全体 | うち (a) | command と出力 |
|---|---|---|---|
| 触る正本 | D-114 を引く live の文書 13 file。runtime の後に注記を直すのは 71・68・53・43・22 と MSI の手順書 | 71（§71.3・§71.4・§71.8 の「今の実装」「runtime の lane で確かめる」の注記）・68（前文）・43（§43.11）・`docs/FUNCTION_DESIGN.md`（MNT-01 の索引の行）。この commit で MSI の手順書・`docs/backlog.md`・`docs/Plans.md` | `rg -l 'D-114' docs --glob '!docs/archive/**' --glob '!docs/plans/**'` → `ARCHITECTURE.md`・`FUNCTION_DESIGN.md`・`Plans.md`・`SCREEN_DESIGN.md`・`architecture/cmd-task-specs.md`・`architecture/mnt-task-specs.md`・`backlog.md`・`decision-log.md`・22・43・53・68・71 の 13 |
| 画面 | 2（UI-11b `/settings/backup`、UI-00 ホーム） | 1（UI-11b の復元の詳細と手動 backup の失敗の再取得） | 68 §68.6・53 §53.1 の実読 |
| wire の型 | 新しい型 7 | 2（`InspectBackupRequest`・`BackupInspection`） | `rg -o 'PrepareOffsiteMediumRequest\|InspectBackupRequest\|OffsiteMediumView\|OffsiteCheckResult\|OffsiteBackupStatus\|OffsiteFailureKind\|BackupInspection' docs/function-design/43-cmd-settings-log.md \| sort -u \| wc -l` → 7 |
| Tauri command | 新設 6、入口の処理が変わる 1（`create_backup`、43 §43.6） | 新設 1（`inspect_backup`）、変わる 1（`create_backup`） | `rg -c '^\| 43\.8\.[2-7] \|' docs/function-design/43-cmd-settings-log.md` → 6 |
| Windows API | 71 が名指す 8 種、うち 2 種は今の code にある | 新しく使う 2（`GetFullPathNameW`・`GetFinalPathNameByHandleW`）、既にある 2 を使う（`CreateFileW`・`MoveFileExW`） | `rg -o 'GetFullPathNameW\|CreateFileW\|GetFinalPathNameByHandleW\|MoveFileExW\|GetLogicalDrives\|GetDriveTypeW\|GetFileAttributesW\|SetThreadErrorMode' docs/function-design/71-mnt-backup.md \| sort \| uniq -c` → 8 種。`rg -o 'MoveFileExW\|CloseHandle\|GetFinalPathNameByHandleW\|CreateFileW\|GetFullPathNameW' src-tauri/src \| sort \| uniq -c` → `mnt/restore.rs` に `CloseHandle`・`CreateFileW`・`MoveFileExW` だけ |
| test の設計の行 | design の Matrix の Test Matrix 68 行 | 27 行（下の Matrix。design の行の (a) に当たる部分と、rollback の行・手動 backup の再取得の行。Plan Review round 1 で URI の組立ての行と hook の単体の行を足した） | `rg -c '^\| (MNT\|43\|71\|UI)' docs/archive/plans/test-matrices/2026-10-07-backup-offsite.md` → 68。`rg -c '^\| (MNT\|43\|71\|UI\|Rollback\|§68)' docs/plans/test-matrices/2026-10-23-backup-offsite-runtime-a.md` → 27（2026-10-23、是正の後） |
| 横断の約束がかかる経路 | (a) 5、(b) は (b) の起票で数える | 5 | 下の「横断の約束」の表の行 |

手法の選び方（3 つの案を現物に当てた）:

- 1 lane のまま段に分ける: Rust（`mnt::backup` の作り方の置き換え・新 module `mnt::offsite`・Windows の媒体の列挙）・CMD 6 本と既存 1 本・bindings・frontend（card・ホーム・復元の確かめ・共通の確認の hook）を 1 PR に持つ。design の Matrix の 68 行を 1 つの R4 の Final Review（Minimum 2、Double Audit）に載せることになり、design lane は docs だけで Plan Review 3 round と Final Review 5 回を要した（[design の packet](../archive/plans/2026-10-07-backup-offsite.md) の Review Response）。Windows でしか通らない code（書く先の固定・媒体の列挙）の初回の実機の確かめが L3 の 1 回に集まり、外れたとき（Contract Probe の P7・P8）に全部の実装が待つ。
- 層で分ける（Rust を先、画面を後）: 画面を持たない lane は、媒体の列挙など Windows でしか通らない code を実機で 1 度も通さずに merge する（呼ばれないので害は無いが、Final Review が実機で動いていない code を承認する）。
- 採った案（機能で 2 つに分ける）: (a) は「PC の中の backup を確かめてから公開する・レジの SD に書かない・一覧の行から復元する前に控えを確かめる」で、PC の外の控えが無くても利用者に効く（backlog の「保存と起動の守りの follow-up」の (2) を閉じる）。(b) が使う共有の関数（書く先の固定 `pin_to_volume`、上書きしない公開、`inspect_backup` と「使える控え」）を (a) が置く。書く先の固定は PC の中の全部の backup に効くので、その外部前提（Contract Probe の P7・P8）は (a) が先に確かめる。design の正本を変えずに分けられる: UI-11b-D15 の入口 2 つのうち一覧の行を (a)、「控えを選んで確かめる」（D14 が PC の外の控えの card に置く button）を (b) が持つ。

各 lane の配布の単位としての安全（途中の版で店が壊れた状態にならない）:

- (a) だけが入った版: PC の中の backup は作業名 → 確かめ → 上書きしない公開になり、作成途中・壊れた file を今日の backup・一覧・復元の候補に数えない。レジの SD の上・固定できない保存先には書かず、手動の backup で原因の folder を名指す（43 §43.6）。一覧の行から復元するとき、新しすぎる版・壊れた・読めない控えを確認の手順の前に止める。PC の外の控えの command・画面は無い（`docs/project-memory.md` の「PC の外の保存先は今使っていない」のまま）。
- (b) が入った版: D-114 の全部。PC の外の控えは任意で、用意しない店は (a) の版と同じに動く（TD-381）。

関門 3. を満たす全体の順: (a)（本 packet）→ (b)（(a) の merge の後に起票。下の「後続の lane」）→ 通しの演習（71 §71.13、go-live の前に owner が別の PC で）。3 つとも初回の導入の前。

後続の lane（(b)、本 run では起票しない）: MNT-01-D8（`mnt::offsite`、71 §71.11）と媒体の root の MNT-01-D10、43 §43.8.2〜§43.8.4・§43.8.6・§43.8.7、UI-11b-D14（card）・UI-11b-D15 の「控えを選んで確かめる」の入口（file picker、`selected` が `BackupInfo` でない file を受ける形）・UI-11b-D16（共通の確認の `checkOffsiteBackup` と停止の待ちへの追加）・UI-00-D12（ホーム）、22 §16 の folder の外の場所 (3)、design の packet の closeout の申し送り (a)〜(c)（`attached` で (5) の文を分ける・成功の記録を置き換えた後の sync の失敗の扱い・Matrix の原因の文の行の `stale = true` の前提）、L3 の UI-11b-L3-6〜L3-9。`Cargo.toml` の `windows-sys` の feature `Win32_System_Diagnostics_Debug`（`SetThreadErrorMode`）も (b)。

## Workflow State

- Phase: plan-gate
- Risk: R4
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票は本 run。実装の Writer は plan-approved の後に Coordinator が発注で決める）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3 以上）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 2
- Human Gate: ready,merge,manual,r4
- Branch: agent/backup-offsite-runtime

遷移の記録:

1. kickoff → spec-check（2026-10-23、Writer）: owner の決定（TD-384）と backlog の「PC の外の控えの runtime」・「保存と起動の守りの follow-up」の (2) を起点に Scope を (a) に限り、Risk を R4 と記録した（下の Risk）。
2. spec-check → plan-draft（2026-10-23、Writer、本 commit）: (a) が触る設計は 71 §71.3・§71.4・§71.4.1・§71.5・§71.8・§71.12、43 §43.6・§43.8.5、68 UI-11b-D13・D15・§68.4・§68.7・§68.11、22 MNT-03-D11 に揃っていて、新しい設計の判断が要らない（下の Design Readiness）。`docs/DEV_WORKFLOW.md` Workflow State の表の唯一の skip（Design Readiness が既存の設計正本で足りると引く）に当たる。owner の判断事項 J1（下）は範囲を足すかの問いで、既定（足さない）で設計は足りる。J1 で足すと決まれば design へ戻る（43 §43.7・68 UI-11b-D13 を直す）。Contract Probe の P7・P8 は未確認で、plan-approved の前に記録する（下の Contract Probe）。plan-gate へは Coordinator が進める。
3. plan-draft → plan-gate（2026-10-23、Coordinator、本 commit）: owner が判断事項 J1 に A（入れない。backlog に残す）と答えた（repo 外の回答台帳 TD-390）。推奨どおりで、Scope・契約は起票のまま。packet と Matrix が揃い commit されている。Plan Review round 1 に出す。Codex は利用上限で 2026-10-24 まで使えないので、round 1 は fresh Opus 5.5 で始め、Codex が戻った時点で同じ round の Codex 分を足す（`docs/AGENT_OPERATING_MANUAL.md` §3.3）。

## Owner Effort Budget

- 介入回数上限: 7（既定 6 から上げた。理由: R4 の lane で L3 が要り、Contract Probe を Windows の実機で owner に流してもらう decision point が 1 つ増える。起票の時の予備 1〈L3 の FAIL の後の 2 回目の round〉は、Plan Review round 1 で足した P9・P10 の流し直しに使った）
- 実働時間上限: 30 分（既定。見込み: Contract Probe 5 分〈P7・P8 と P9・P10 の 2 回、どちらも script 1 行〉、L3 15 分、判断と承認 10 分）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 7 | 3（2026-10-23: owner の判断事項 J1〈TD-390〉、Contract Probe の P7・P8 の依頼〈結果の受領は同じ decision point〉、P9・P10 の流し直し〈同〉。TD-384 は lane の選択の前の決定で本 lane に数えない） | 4（R4 の計画の承認 1、L3 1、R4 の承認と Ready 1〈目視の省略の受理を同じ依頼で取る、下の human visual confirmation〉、merge 1） | 0（L3 が FAIL して 2 回目の round が要るときは、その判断と上限の改定を同じ 1 回で諮る、`docs/DEV_WORKFLOW.md` Owner Effort Budget） | 7 = 3 + 4 + 0 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。owner は 2026-10-21 から数日、手が使いにくい（左手だけ）。問いは記号か短文で答えられる形にする（下の owner の判断事項、Contract Probe の段取り）。

## Risk

Risk: R4

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R4 の行（「Destructive data lifecycle, backup restore, …」）に当たる: backup の作り方（作業名 → 確かめ → 上書きしない公開）、保持日数の掃除（`cleanup_old_backups` が file を消す）の書く先の固定、復元の前の確かめ（restore の入口）を変える。Final Review Minimum 2、Human Gate `r4`。画面（UI-11b の復元の詳細と手動 backup の失敗の文）を変え、Windows でしか通らない code（`pin_to_volume` の Windows 側）を初めて実機で通すので `manual`（L3）。

この変更でどれかの required gate の green / red が変わるか: 変わらない。classifier の workflow の一覧（`scripts/ci/classify-changes.sh` の `AGENTS.md|CLAUDE.md|docs/DEV_WORKFLOW.md|…|docs/templates/*|…` と `.github/workflows/*|scripts/ci/*|…|scripts/check-command-drift.sh|…` の行）に当たる file を Scope に持たない（下の Scope の表）。実装は Rust・frontend・bindings・traceability の既存の job に test を足すだけで、gate の構成と required の名前を変えない。本 commit は docs だけ。

Rollback / recovery notes（R4）:

- (a) の版から前の版（`eed07d37` の時点の code）のアプリへ戻したとき: 残りうるのは backup の保存先の作業名 `inventory_backup_{YYYYMMDD}_{HHMMSS}.db.partial` だけ（中断・消せなかった残り。71 §71.4 のエラーハンドリング）。前の版の一覧・掃除は `extract_datetime_from_backup`・`extract_date_from_backup` の規約の完全一致で、今日の判定（`collect_today_backup_names`）は前方一致と `.db` の後方一致で、どれも `.db.partial` を見ない。前の版の `create_backup` は正式名へ直接書く今の形に戻るだけで、DB・`app_settings`・既存の backup の一覧と復元は変わらない。書く先の固定と控えの確かめは状態を残さない（PC 側の file を足さない）。戻した後に残る作業名は消さなくてよく、再び (a) の版へ上げると次の `create_backup` の手順 3 が消す。
- この扱いは「作業名が `.db` で終わらず、規約の解析が日時を返さない」ことに依る。下の Matrix の rollback の行（`test_create_backup_req901_d7_partial_name_invisible_to_previous_filters`）が作業名でこの 2 つを確かめ、L3 で前の版を入れ直す手順は求めない（`docs/DEV_WORKFLOW.md` L3 Eligibility の (2)・(3)。前の版の MSI を入れ直す操作は fault-injection に近い手間で、確かめる中身は名前の形だけ）。design の packet の Rollback notes の申し送り（古い版へ戻した後に起きることを L3 か test で 1 回確かめる）を (a) はこの test で満たす。PC の外の控えの file（`offsite-backup.json`・媒体の `InventoryBackup\`）は (b) の rollback notes が持つ。
- 戻し方: merge の後に戻すときは (a) の squash commit の revert。DB の migration は無い。

## Goal

Goal Invariant:

### 最小完了条件

- 店の PC で、起動時・設定時刻・手動・復元の前の backup が、作業名へ書かれ、共有の検査（71 §71.12 の「使える控え」）に通ってから、既存を上書きしない操作で正式名になる。途中で止まった・壊れた file は今日の backup・一覧・復元の候補に数えない（MNT-01-D7）。
- backup を書く・消す処理は、判定した volume に固定した path で行い、レジの SD の上（`CASIO\SR500_550_4000` が書く先の祖先にある所）と固定できない保存先には書かない・消さない。手動の backup はその原因と直し方を固定の文で名指す（MNT-01-D10、43 §43.6）。
- 一覧の行から復元するとき、確認の手順の前に控えを確かめ、新しすぎる版・壊れた控え・読めない控えを固有の文言で止め（事前バックアップも作らない）、戻せる控えには「この控えは戻せます」と商品の数・最後の記録の日時を添える（MNT-01-D9、UI-11b-D15 の一覧の行の入口）。backlog の「保存と起動の守りの follow-up」の (2) を閉じる。
- Windows の実機で、今の保存先（PC の中の folder）と USB メモリの上の folder の両方で、手動の backup が今までどおり作られる（L3）。自動の backup（起動時・設定時刻）は同じ `create_backup` を通るので、L3 で別に見ず自動 test で足りる。

### 失敗定義

- Windows で backup が作れなくなる（書く先の固定が NTFS・FAT32・exFAT のどれかで失敗する、`VACUUM INTO` が固定した path へ書けない）。
- 作業名の file が正式名・今日の backup・一覧に数えられる。同じ名前の確かめ済みの backup を上書きする。
- レジの SD の上に backup を書く・そこで消す。判定した folder と書いた folder が違う。
- 復元の契約（MNT-01-D1〜D6、`CmdErrorKind` の restore の 3 値、UI-11b-D2〜D5・D11・D12）を変える。確かめで止めた控えで事前バックアップを作る・確認の手順へ進む。
- 控えの確かめが対象の file・folder を変える（journal・`-wal`・`-shm` を作る）。

### 非目的

- PC の外の控え（MNT-01-D8 の全部、43 §43.8.2〜§43.8.4・§43.8.6・§43.8.7、UI-11b-D14・D16、UI-00-D12、「控えを選んで確かめる」の file picker の入口）。後続の (b)。
- 更新・migration の前の保全の gate（D-114 の Revisit、backlog の「backup に、PC の外のコピーと…」の項の残り）。
- `backup_path` に取外し可能な drive を選ばせない変更（MNT-01-D10 の棄却案）。保持日数（MNT-01-D3）と日付での掃除の規則の変更。
- 自動 backup の確認の失敗で原因を名指すこと（AI の review 由来の backlog の項。下の owner の判断事項 J1 の既定は足さない）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更（backup の作り方・復元の入口の状態遷移）なので、店の毎日の列を置く。(a) の版で成り立つ列で、PC の外の控えの列は (b)。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 毎朝、PC を起動する（保存先は既定の PC の中の folder） | 店主は何もしない | 起動時の自動 backup（71 §71.9）が作業名へ書き、確かめてから正式名にする。バックアップ画面の一覧に今日の行が出る | — | P7・P8・P9（NTFS の `%APPDATA%` の folder で固定・`VACUUM INTO`・公開・親 directory の sync が成り立つ。2026-10-23 PASS） |
| 営業中、設定時刻を過ぎる | 何もしない | 60 秒の確認（UI-11b-D13）が同じ形で作る。途中で電源が落ちても作業名だけが残り、今日の backup と数えないので次の確認で作り直し、残りは次の作成で消える | — | — |
| owner がバックアップ画面を開く | 「今すぐバックアップを作成」 | 同じ形で作り、一覧に新しい行。失敗しても一覧を取り直す（公開の後の失敗では確かめ済みの正式名が残りうる、68 §68.4） | — | — |
| 保存先を USB メモリの上の folder にしてある（既存の設定） | 何もしない／手動 | 判定した volume に固定して書く。USB メモリを抜いて同じ drive 文字にレジの SD が入っても SD に書かない（書込みは失敗し、既存の失敗の知らせ） | 差し直す | P7・P8・P9（FAT32 の取外し可能な drive で 2026-10-23 PASS。exFAT は未確認、Matrix の Residual Test Gaps） |
| 保存先の祖先にレジの SD の folder がある（SD の写しを drive の直下に置いた等） | 「今すぐバックアップを作成」 | 書かずに「この保存先はレジの SD カードの上にあります（{sd_folder} が見つかりました）。…」（43 §43.6）。自動 backup も書かない | 写しを folder の中へ移すか「保存先を選ぶ」で選び直す | 自動 backup の失敗は連続の最初の 1 回の toast だけ（J1） |
| 復元: 一覧の行を選ぶ | 行の復元の導線 | 共通の確認を止めて実行中の回を待ち、控えを確かめる → 「この控えは戻せます」と商品の数・最後の記録の日時 → 既存の事前バックアップと 2 段の確認 | 復元の card の「閉じる」で確認が再開する（最終確認の「キャンセル」は詳細へ戻るだけで止めたまま） | P10（volume GUID path の控えを URI で開く。2026-10-23 PASS） |
| 新しすぎる版・壊れた・読めない控えを選んだ | 行の復元の導線 | 固有の文言（UI-11b-D15）。事前バックアップを作らず、復元の button を出さない | 「閉じる」で一覧へ戻り、別の控えを選ぶ（確認が再開する） | — |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項

確認済み事実: D-114 と設計正本で (a) の振舞いは一意に決まる。自動 backup の確認（UI-11b-D13、owner 決定 2026-09-25 (a)）は失敗を連続の最初の 1 回の toast「自動バックアップ確認に失敗しました」だけで知らせ、原因を名指さない。(a) の MNT-01-D10 で、保存先の祖先にレジの SD の folder がある・固定できない保存先の自動 backup が新しく失敗するようになる（今は書けていた所）。手動の backup はその原因を名指す（43 §43.6）。PC の外の控えを用意した店は (b) のホームの知らせ（UI-00-D12 の (2)）が手動の backup へ導くが、用意しない店には届かない。backlog の「自動 backup の確認の失敗で原因を名指す」は AI の review 由来で、owner の確認の前に必須にしない。

| # | 判断事項 | 選択肢 | 推奨（区分） | 根拠 |
|---|---|---|---|---|
| J1 | 自動 backup の確認の失敗で原因を名指すことを (a) に入れるか | A 入れない（backlog に残す）／ B (a) に入れる: 43 §43.7 の `check_auto_backup` で保存先の固定の失敗を §43.6 と同じ固定の文へ写し、UI-11b-D13 の失敗の toast にその文を出す（design へ戻り、43・68 を直してから plan-draft へ） | **A**（candidate） | 店はまだ導入の前で、新しく失敗する保存先は SD の写しを drive の直下に置いた場合と固定できない保存先（network・Mount Manager の外の仮想 drive）に限られる。L3 で店の PC の保存先が固定できることを確かめる（下の Contract Probe・L3-a2）。B は設計の差し戻し 1 回と、毎分の確認の失敗の toast の文の設計（連続の最初の 1 回の規則との組）を足す。用意しない店でも自動 backup が止まり続けたことを知りたいなら B |

店主に聞く事項: 無い。

## Scope

段（実装の順。各段の終わりで対象の test が通る）:

- S1 共有の関数（`mnt::backup`）: `pin_to_volume`・`pin_backup_dir`・`BackupDirError`（71 §71.4 の「書く先の固定」）、上書きしない公開 `publish_no_replace`（71 §71.4.1）、名前の解析の panic の直し（71 §71.3）、`inspect_backup`・`BackupInspection`・「使える控え」（71 §71.12、MNT-01-D9）。`inspect_backup` の開き方は 71 §71.12 手順 1 の 1 文のとおり: `backup_path` の文字列（Windows は `\` のまま。`\`→`/`・`//` の圧縮・drive 文字の前の `/` を行わない）の `%`・`?`・`#` を 1 回の走査で `%25`・`%3f`・`%23` に置き換え、前に `file:`、後ろに `?immutable=1` を付け、`SQLITE_OPEN_READ_ONLY | SQLITE_OPEN_URI` で開く（手順 4a に渡る作業名は Windows では必ず `\\?\Volume{GUID}\…` で `?` を含む）。
- S2 作り方（`mnt::backup`）: `create_backup` の手順 0・3・4・4a・4b（MNT-01-D7・D10）、`cleanup_old_backups` の手順 0（§71.5）、`collect_today_backup_names` の完全一致（§71.8 手順 3）、既存の metadata の test の移し替え（§71.10 の D-114 の追加の表）。
- S3 CMD と登録: `create_backup` の command の固定の文（43 §43.6）、新 command `inspect_backup`（43 §43.8.5、`#[tauri::command(async)]`）、`lib.rs` の登録、bindings と traceability の再生成。
- S4 画面: 一覧の行の復元の入口に控えの確かめ（UI-11b-D15、§68.7 の `restore_inspecting`・`restore_blocked`・`restore_detail`）、共通の確認の停止を確かめの開始へ早める `suspendAutoBackupCheckAndWait`（UI-11b-D15・D13）、`ready` へ戻す復元の card の「閉じる」（UI-11b-D15、§68.7・§68.9・§68.10）、`restore_failed_recovered`・IPC の例外の後に復元の card を未選択へ戻す（§68.7 の `restore_failed_recovered` → `ready`）、手動 backup の失敗でも一覧を取り直す（§68.4 手動バックアップ手順 4、§68.10）。
  - 「閉じる」: 復元の card に `selected` があり `restoring` でない間ずっと出る 1 つの button（`restore_inspecting`・`restore_blocked`・`restore_detail`・`pre_backup_failed`。`restore_blocked` も同じ card なので「一覧へ戻る」を別に作らない）。他の操作と同じく `controlsDisabled`（確かめの間・事前バックアップの間・fatal の後）で押せない。押すと `setRestoreState(initialRestoreState)`、`resumeAutoBackupCheck()`、一覧の query の invalidate（停止の待ちで捨てた確認の `true` が作った backup を一覧に出す）。最終確認の dialog の「キャンセル」は §68.7 どおり `restore_detail` へ戻るだけで、再開しない。
  - 文言（§68.9）: 確かめの間は「控えを確かめています」、戻せる控えの詳細は「この控えは戻せます」「商品の数: N 件」（`Some(0)` は「商品の数: 0 件」、`None` は行なし）「最後の記録: {和式日時}」（`None` は行なし。和式日時は一覧と同じ `formatBackupDate`）。
  - `handleRestore` の fatal でない分岐（`restore_failed_recovered` などの Err と IPC の例外）に `setRestoreState(initialRestoreState)` を 1 行足す。再試行は行を選び直して確かめから入る。`handleRestore` の `suspendAutoBackupCheck()` は残る。

予定 path の全部（所有の列は並走 lane との重なり。下の「節の所有表」）:

| file | 段 | 変更 | 他 lane との重なり |
|---|---|---|---|
| `src-tauri/src/mnt/backup.rs` | S1・S2 | 上の S1・S2。`create_backup`・`cleanup_old_backups` の signature と `BackupResult`・`BackupInfo` の形は変えない（`BackupResult.file_path` は今までどおり `{backup_dir}/{ファイル名}`、§71.4 手順 0）。`collect_today_backup_names` の signature は変えない（§71.8 の注入境界の helper のまま）。`extract_date_from_backup` は形を変えない（`_` の位置を先に見るので panic しない、§71.3） | なし |
| `src-tauri/src/mnt/restore.rs` | S1 | file 操作の trait（`RestoreFileOps`・`StdRestoreFileOps`）を backup と共有する: 可視性を `mnt` の中へ広げ、`publish_no_replace` を足す（Windows は `MoveFileExW` を `MOVEFILE_WRITE_THROUGH` だけで、Windows 以外は `std::fs::hard_link` → 作業名の削除。71 §71.4.1）。本番と test で別の判定を作らない（design の packet の申し送りの表の「file 操作の差し替え」）。restore の振舞いと既存の注入の型は変えない（足した method は既存の注入の型では本物の操作へ委ねる） | なし |
| `src-tauri/src/db/migration.rs` | S1 | `read_current_version_without_ddl` を private から `pub(crate)` へ（MNT-01-D9、22 MNT-03-D11 の「同じ判定を二重に書かない」）。`app_max_version` は既に `pub(crate)` で変えない | #188・#172 は migration を足すが、この関数の可視性の行は触らない見込み（下の節の所有表） |
| `src-tauri/src/io/mod.rs`（条件つき） | S1 | レジの SD の folder 名の定数（`CASIO`・`SR500_550_4000`、29 §29.7、MNT-01-D10）を IO-09 と共有する。#172 の `io::register_sd` が先に main に入っていればその定数を使い、(a) は足さない。(a) が先なら `io/mod.rs` に `pub(crate) const` を置き、#172 が使う（文字列を二重に持たない。design の packet の申し送りの表の「レジの SD の root の判定」） | #172 が `pub mod register_sd;` を足す（行が別。merge の順で両方を残す） |
| `src-tauri/src/cmd/settings_cmd.rs` | S3 | `create_backup` の command: `get_backup_dir` の後に `mnt::backup::pin_backup_dir` を呼び、`BackupDirError` を 43 §43.6 の表の `validation` の固定の文へ写す。新 command `inspect_backup`（`InspectBackupRequest { backup_path: String }` → `BackupInspection`、DB を使わない、空の `backup_path` は `validation`、MNT の `DbError` は「この控えを読めませんでした。別の控えを選んでください。」の `validation`。43 §43.8.5 とエラーの写像の表の最後の行）。`#[tauri::command(async)]` + `#[specta::specta]`（43 §43.8.2 の「実行の thread」。repo で最初の async の command） | なし |
| `src-tauri/src/lib.rs` | S3 | `collect_commands!` と `generate_handler!` の settings の塊に `cmd::settings_cmd::inspect_backup` を 1 行ずつ足す | #188・#172 も両方の macro に自分の command を足す（行が別。下の節の所有表） |
| `src/lib/bindings.ts` | S3 | 再生成（`cd src-tauri && cargo run --bin generate_bindings`）。手で編集しない | #188・#172 も再生成する（衝突は手で解かず、取り込んだ後に再生成する、D-098） |
| `docs/function-design/90-traceability.md` | S3 | 再生成（`cd src-tauri && cargo run --bin generate_traceability`。AUTO-GENERATED） | 生成物（同上） |
| `src/features/backup-restore/useAutoBackupCheck.ts` | S4 | 実行中の guard の置き場を hook の `useRef`（`inFlight`）から module scope の `let inFlight: Promise<void> \| null` へ移す（停止の flag・世代番号と同じ所に置き、真実を 2 つにしない。interval は `suspended \|\| inFlight` で飛ばし、回の promise を `inFlight` に入れ、回の `finally` で `null` に戻す）。新しい export `suspendAutoBackupCheckAndWait = async () => { suspendAutoBackupCheck(); await inFlight; }`（停止して世代番号を進め、実行中の回の完了を待つ。実行中の回が無い・hook が mount されていないときはすぐ解決する。(a) では実行中の回は `checkAutoBackup` だけ。(b) が `checkOffsiteBackup` を同じ回に足す）。既存の `suspendAutoBackupCheck`・`resumeAutoBackupCheck`・interval・世代番号・連続失敗の `failing`（hook の `useRef` のまま）は変えない | なし |
| `src/features/backup-restore/BackupRestorePage.tsx` | S4 | 一覧の行を選ぶ → `suspendAutoBackupCheckAndWait()` → `commands.inspectBackup({ backup_path: file_path })` → `restore_detail`（確かめの結果を表示）か `restore_blocked`（固有の文言、復元の button と事前バックアップなし。`inspectBackup` の `Err` と IPC の例外はどちらも読めない控えの文言）。復元の card の「閉じる」（上の S4）・unmount（復元の実行中でも fatal の 2 種の後でもないとき）で `resumeAutoBackupCheck()`（UI-11b-D15）。`handleRestore` の `suspendAutoBackupCheck()` は残す（UI-11b-D13 の「止めたままの状態に重ねる」）。`handleRestore` の fatal でない分岐で `setRestoreState(initialRestoreState)`。手動 backup の失敗でも `queryKeys.backupRestore.list()` を invalidate する（§68.4 手順 4）。`selected` の型は `BackupInfo` のまま（file を選ぶ入口は (b)） | なし |
| `src/features/backup-restore/useAutoBackupCheck.test.tsx`・`BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx` | S4 | 下の Matrix の UI の行。既存の test の直し: (1) `BackupRestorePage.test.tsx` と `BackupRestorePage.flow.test.tsx` の `vi.mock("@/lib/bindings", …)` はどちらも `commands` を丸ごと置き換えるので、両方の `commands` に `inspectBackup: vi.fn()` を足し、既定の mock（`mockDefaultCommands`・`installDefaultCommands`）に戻せる控えを返す既定を 1 つ足す（足さないと復元に進む全 test が `inspectBackup is not a function` で落ちる）。(2) 行を押した後の詳細は確かめの解決の後に出るので、helper（page の `openRestoreDetail`、flow の `driveToRestoreSuccess`）と行を直接押す test（flow の `test_ui11b_d11_restore_failure_then_normal_home_navigation_shows_no_alert`）は詳細を `findBy…` で待つ。(3) page の「REQ-901 / UI-11b-D13: 復元の前に発火して待機中の確認の結果は捨てる」の 2 本（復元の間に届く・再開の後に届く）は削り、契約ごと Matrix の UI-11b-D13・D15 の hook の行と UI-11b-D15・D13 の page の行へ移す（Matrix の「既存の test の移し方」）。(4) page の it.each「REQ-700 68 §68.7 shows error_id for %s」の `restore_failed_recovered` の行に「復元の card が未選択」の assert を 1 つ足す。module scope の `inFlight` は同じ file の test の間で残るので、確認を未解決のまま残す test は `finally` で解決する（既存の test はそうしている） | なし |
| `src/features/inventory-records/OtherRecordDetailRoutes.test.tsx`・`src/lib/app-router.test.tsx` | S4 | `vi.mock("@/features/backup-restore/useAutoBackupCheck", …)` の置き換えに新しい export `suspendAutoBackupCheckAndWait` を足す（`vi.mock` は export を丸ごと置き換えるので、足さないと import が undefined になる） | なし |
| `docs/function-design/71-mnt-backup.md` | S2・S3 | (a) で入る所の「今の実装」「runtime の lane で…」の注記を今の事実へ置き換える（下の「置き換わる注記」） | なし |
| `docs/function-design/68-ui-backup-restore.md` | S4 | 前文の「runtime は後続の lane」を (a) で入った所と (b) の残りへ書き分ける（下の「置き換わる注記」） | なし |
| `docs/function-design/43-cmd-settings-log.md` | S3 | §43.11 の登録の code block に `inspect_backup` を足し、D-114 の段落を残りの 5 command（(b)）へ直す | なし |
| `docs/FUNCTION_DESIGN.md` | S3 | MNT-01 の索引の行の「…と inspect_backup（D-114、runtime は後続の lane）」を、`inspect_backup` は実装済み・PC の外の控えは後続の (b) へ書き分ける（下の「置き換わる注記」） | なし |
| `src-tauri/Cargo.toml`（条件つき） | S1 | `GetFullPathNameW`・`GetFinalPathNameByHandleW` が既存の feature `Win32_Storage_FileSystem` に無いと build で分かったときだけ、既存の `windows-sys = "=0.61.2"` に feature を足す（新しい依存ではない。71 §71.4 の「書く先の固定」の最後の項）。`Cargo.lock` は feature を持たないので変わらない | なし |
| 本 commit: `docs/plans/2026-10-23-backup-offsite-runtime-a.md`・`docs/plans/test-matrices/2026-10-23-backup-offsite-runtime-a.md` | — | 新設 | なし |
| 本 commit: `docs/msi-distribution-runbook.md` | — | 流れ 3 の手順 4 に、PC の外の媒体が PC の外の控えの USB メモリなら `InventoryBackup\` の外の folder に置くことと理由（71 §71.11.7）を足した。backlog が「runtime の lane の起票で直す」とした直し | なし |
| 本 commit: `docs/backlog.md` | — | 「backup に、PC の外のコピーと…」の項の着手・設計の段から MSI の手順書の直しの残りを外し、「PC の外の控えの runtime」に着手の段（(a) と (b) の分け方と packet）、「保存と起動の守りの follow-up」の (2) の閉じる lane を (a) にした | #172 は SD 直読みの項を触る（項が別） |
| 本 commit: `docs/Plans.md` | — | 導入の前の関門 3. の文に packet への pointer を 1 句（D-097 の範囲。lane の行は足さない） | #188 は「次の行動」を触る見込み（段落が別） |
| Plan Review round 1 の是正の commit: `docs/function-design/71-mnt-backup.md`・`docs/function-design/68-ui-backup-restore.md`・`docs/backlog.md` | — | 71 §71.12 手順 1 に URI の組み方の 1 文（S1 と同じ文）、§71.11.4 の競合の表の復元の行の「取消」を「閉じる」へ。68 UI-11b-D15 の再開の入口を「閉じる」へ、§68.7 に `pre_backup_failed` → `ready`、§68.9 に「閉じる」と確かめの文言、§68.10 に「閉じる」の一覧の invalidate、§68.11 の止めた控えの行を「閉じる」へ。backlog の「PC の外の控えの runtime」の項に probe の結果 | なし |

対象を使う呼出し側・隣接 test・helper / mock・生成物（2026-10-23、`eed07d37` で `rg` した。行番号でなく symbol で引く）:

| 型・関数 | 作る所 | 読む所・test |
|---|---|---|
| `create_backup`（MNT） | `src-tauri/src/mnt/backup.rs` の `create_backup` | 呼出し: `cmd/settings_cmd.rs` の `create_backup`、`mnt/backup.rs` の `check_auto_backup`（2 か所）。test: `mnt/backup.rs` の `tests` の 7 本（`rg -n 'create_backup\(' src-tauri/src/mnt/backup.rs` の `tests` の中）と `cmd/settings_cmd.rs` の `tests` の 2 本。`test_create_backup_req901_metadata_error_propagates_without_success_log` は `fail_any_metadata()` を手順 4a の検査が先に踏むので、注入を公開の後の正式名だけに当てる形へ移し、oracle（message の「サイズ」・dir に 1 file）は変えない（71 §71.10 の D-114 の表） |
| `cleanup_old_backups` | `mnt/backup.rs` の `cleanup_old_backups` | 呼出し: `mnt/backup.rs` の `run_cleanup`。test: `mnt/backup.rs` の `tests` の 4 本 |
| `collect_today_backup_names` | `mnt/backup.rs` | 呼出し: `check_auto_backup`。test: `mnt/backup.rs` の entry error の注入の test（`test_check_auto_backup_req901_entry_error_propagates_without_creating_backup`） |
| `extract_datetime_from_backup` | `mnt/backup.rs` | 呼出し: `list_backups`。(a) で作業名の掃除と今日の判定が足す |
| `list_backups` | `mnt/backup.rs` | 呼出し: `cmd/settings_cmd.rs` の `list_backups`・`tests`、`mnt/backup.rs` の `tests`。形は変えない |
| `read_current_version_without_ddl` | `db/migration.rs` | 呼出し: 同 file の `migrate`、新しい `inspect_backup` |
| `RestoreFileOps`・`StdRestoreFileOps` | `mnt/restore.rs` | restore の本体と test の注入の型（`mnt/restore.rs` の `tests`）。backup が `publish_no_replace` を足して使う |
| 新 `inspect_backup`・`BackupInspection` | `mnt/backup.rs`（71 §71.12） | `create_backup` の手順 4a、新 command `inspect_backup`。(b) の `mnt::offsite` の写す元の検査（§71.11.4 手順 3a） |
| 新 `pin_to_volume`・`pin_backup_dir` | `mnt/backup.rs`（71 §71.4） | `create_backup`・`cleanup_old_backups` の手順 0、CMD の `create_backup`。(b) の媒体の root の固定（§71.11.3） |
| 新 command `inspect_backup`・`InspectBackupRequest` | `cmd/settings_cmd.rs`、`lib.rs` の 2 つの macro | `src/lib/bindings.ts`（再生成）、`BackupRestorePage.tsx` |
| `useAutoBackupCheck` の module | `src/features/backup-restore/useAutoBackupCheck.ts` | mount: `src/components/layout/RootLayout.tsx`。実物を import する test: `RootLayout.test.tsx`・`BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx`・`useAutoBackupCheck.test.tsx`。`vi.mock` で置き換える test: `OtherRecordDetailRoutes.test.tsx`・`app-router.test.tsx`。invalidate を直接呼んでよい file の一覧（`src/lib/invalidation-contract.static.test.ts` の `ALLOWED_DIRECT_CALL_FILES`）に `useAutoBackupCheck.ts`・`BackupRestorePage.tsx` は既にあり、変えない（新しい file から invalidate しない）。実行中の guard（`inFlight`）を読む所は hook の interval の 1 か所だけ（`rg -n 'inFlight' src` → `useAutoBackupCheck.ts` の中だけ）で、module scope へ移しても他の読み手は無い。StrictMode の二重 mount は既存の `useAutoBackupCheck.test.tsx` の「unmount で止まり、StrictMode の二重 mount でも 1 本」が回帰で通す |
| `BackupRestorePage` の復元の選択 | `BackupRestorePage.tsx` の `selectRestoreBackup`・`handleStartRestoreConfirmation`・`handleRestore` | `BackupRestorePage.test.tsx`（helper `openRestoreDetail`・`startRestoreConfirmation` を通る全部の test: `rg -n 'openRestoreDetail\(user\)\|startRestoreConfirmation\(user\)' src/features/backup-restore/BackupRestorePage.test.tsx`）・`BackupRestorePage.flow.test.tsx`（helper `driveToRestoreSuccess` を通る test と、行を直接押す `test_ui11b_d11_restore_failure_then_normal_home_navigation_shows_no_alert`）。test の fixture: 両 file の `vi.mock("@/lib/bindings", …)` の `commands` と既定の mock（`mockDefaultCommands`・`installDefaultCommands`）。page の source を静的に読む test（`src/lib/describe-error-adoption-sweep.test.ts`・`src/hooks/unsaved-changes-guard-sweep.test.ts`）は変えない（止める文言は固定の文で、`CmdError` の message を画面に出さない） |

置き換わる注記（この変更で不要になる記述・条件。(a) の実装の commit で全件を直す。`rg` の式は AC6）:

- 71 §71.3 の「今の `extract_datetime_from_backup` は長さ 15 bytes の確認の後に…runtime の lane で直す」→ 直した後の事実（名前の解析は確認を slice の前に行う）だけを残す。
- 71 §71.4 の「書く先の固定」の最後の項の「…は、runtime の lane が Windows で確かめる。使う API が既存の feature `Win32_Storage_FileSystem` にあることは runtime の lane の build で確かめる」→ Contract Probe と L3 の結果（確かめた日と、P7〜P10 の結果）へ置き換える。
- 71 §71.8 手順 3 の「今の実装は前方一致と `.db` の後方一致で見ており〈…〉、規約外の名前を数える。runtime の lane で完全一致に替える」→ 外す。
- 71 §71.10 の「D-114 の追加（後続の runtime の lane の完了条件…）」の見出しの句 →「(a) の行は runtime の (a) が、PC の外の控えの行は (b) が入れる」へ。
- 68 の前文の「（runtime は後続の lane）」→ (a) で入った所（UI-11b-D15 の一覧の行の入口）と (b) の残りへ書き分ける。
- 43 §43.11 の「D-114 の 6 command（§43.8.2〜§43.8.7）は後続の runtime の lane で…」→ `inspect_backup` は登録済み、残りの 5 command は (b)。
- `docs/FUNCTION_DESIGN.md` の MNT-01 の索引の行の「…と inspect_backup（D-114、runtime は後続の lane）」→ `inspect_backup` は実装済み、PC の外の控え（5 つの関数）は後続の (b)。
- 回避の手順で置き換わるもの: 無い（(a) の前は利用者が手で避ける手順を持っていない。MSI の手順書の流れ 3 の直しは本 commit）。
- 不要になる code: `collect_today_backup_names` の前方一致の判定の 1 行は完全一致に置き換わる（足さずに置き換える）。`create_backup` の正式名への直接の `VACUUM INTO` と直後の metadata の読取りは作業名の経路に置き換わる。`useAutoBackupCheck` の hook の `useRef` の `inFlight` は module scope の `inFlight` に置き換わる（guard を 2 つ持たない）。
- 不要になる test: page の「復元の前に発火して待機中の確認の結果は捨てる」の 2 本は、D15 の後は一覧の行の経路から前提（確認が未解決のまま復元へ進む）に届かないので削り、契約（停止の前に始まった確認の結果を、停止中に届いても再開の後に届いても捨てる）は hook の単体 test と page の新しい行へ移す（Matrix の「既存の test の移し方」）。

横断の約束（失敗の時点と順序・0 の表示・状態の取り直し。(a) の 5 経路。上の 3 つの観点を 1 か所に置き、各段はこの表を引く）:

| 経路 | 失敗の時点と順序 | 0 の表示 | 状態の取り直し |
|---|---|---|---|
| `create_backup`（起動時・60 秒・手動・事前） | 固定 → folder の作成 → 残りの作業名の掃除（失敗は warn）→ `VACUUM INTO` → 検査 → `sync_all` → 上書きしない公開 → 親 directory の sync → metadata → 操作ログ（失敗は warn）。公開より前の失敗は正式名を作らず作業名を消す（消せなければ warn、次回の手順 3）。公開の後の失敗は検査済みの正式名を残して `Err`（71 §71.4 のエラーハンドリング） | `size_bytes = 0` の成功を返さない（MNT-01-D6） | 手動は成功・失敗とも一覧を取り直す（§68.4 手順 4）。自動は `true` のときだけ（UI-11b-D13、変えない） |
| `cleanup_old_backups` | 固定・判定 → 一覧 → 消す。固定できない・SD の上は何も消さずに `Err`（`run_cleanup` が warn） | 消した数 0 は `Ok(0)` | — |
| `check_auto_backup` の今日の判定 | entry の失敗は `QueryFailed` で作成へ進まない（MNT-01-D6、変えない）。作業名・規約外の名前は数えない | 今日の正式名 0 → 作る | — |
| 一覧の行からの復元の確かめ | 停止して実行中の回を待つ（待つ間に届いた結果は捨てる）→ `inspectBackup` → `restore_detail` / `restore_blocked`。`Err`（読めない）と IPC の例外は止める側。復元の失敗（fatal でない）の後は未選択へ戻り、再試行は確かめから | 「商品の数: 0 件」と出す（`Some(0)`。空の DB の控えを見分ける、71 §71.13 の合格の「空の控えが写っていない」）。`None` は行を出さない。最後の記録の日時 `None` は行を出さない | 復元の card の「閉じる」・条件つきの unmount で再開（UI-11b-D15）。「閉じる」は一覧も invalidate する（待つ間に捨てた `true` の backup を出す）。確かめの結果は選び直すたびに取り直し、cache しない |
| `inspect_backup`（MNT・CMD） | URI の組立て（S1 の 1 文）→ open（読取り専用・`immutable=1`）→ 版 → このアプリの backup か → `quick_check` → 商品の数と最後の記録（失敗は `None`）。どこで失敗しても file・folder を変えない | 版 0 は `Err`（読めない控え、§71.12 手順 2a） | — |

## Non-scope

- 後続の (b) の全部（上の「後続の lane」）。理由: PC の外の控えは (a) の共有の関数の上に立ち、(a) の版は PC の外の控えが無くても安全に配れる（上の「各 lane の配布の単位としての安全」）。
- backlog の「backup に、PC の外のコピーと…」の項の残りの「更新・migration は必要な保全に成功しなければ開始しない」（D-114 の Revisit）。理由: MSI の手順書の流れ 3 が手で取る手順を持ち、アプリで止める仕組みは D-114 の範囲の外。
- 同じ項の導入の前の関門で足した「backup の保持 3 日と PC の日付で消すこと」（MNT-01-D3）と「PC の入れ替えの時の引越しの手順」。理由: 前者は (a) で規則を変えない（固定を足すだけ）。後者は 71 §71.13 の本番の復元の手順で、(b) と通しの演習で通す。
- backlog の「自動 backup の確認の失敗で原因を名指す」（AI の review 由来）。理由: owner の判断事項 J1 の既定 A。
- backlog の「バックアップ保存先の UNC / ネットワークパス対応」（保留）。理由: 固定できない保存先には書かない（71 §71.4）。network は旧い形でも `VACUUM INTO` が失敗する既知の問題で、固定の追加による退行ではない。
- 既存の restore の契約（MNT-01-D1〜D6、UI-11b-D2〜D5・D11・D12、D-032）の変更。ただし UI-11b-D13 の停止の始まりを、UI-11b-D15 が控えの確かめの開始へ早める（復元の結果での再開・fatal の後の停止は変えない）。
- 事前バックアップ（復元の流れの中の `createBackup`）の失敗の後の一覧の取り直し。理由: §68.4・§68.10 が取り直しを定めるのは手動の backup だけで、復元の流れは失敗の表示（break-glass）を持つ。公開の後の失敗で残った正式名は、次の一覧の取得で見える（Residual Test Gaps）。

## Acceptance Criteria

baseline は本 worktree（HEAD `eed07d37`、本 commit の前）で逐語に実行した出力。「完了時」は実装の後の期待。

- AC1（共有の関数と控えの確かめがある）: `rg -n 'fn (pin_to_volume|pin_backup_dir|inspect_backup|publish_no_replace)\b' src-tauri/src` が 4 つの関数の定義を返す（`publish_no_replace` は trait の宣言と実装で 2 行以上になってよい）。baseline: 出力なし・`exit=1`。
- AC2（Rust の test）: `cd src-tauri && cargo test --lib -- mnt::backup mnt::restore cmd::settings_cmd db::migration` が exit 0 で、Matrix の Rust の行の test がすべて PASS。`rg -n 'req901_d(7|9|10)|req901_multibyte' src-tauri/src` が Matrix の Rust の行の test 名を返す。baseline: 後者は出力なし・`exit=1`。
- AC3（今日の判定が完全一致）: Matrix の `test_check_auto_backup_req901_d7_partial_and_nonconforming_not_counted_as_today` が PASS（AC2 の `cargo test` に含まれる。実装の文字列は問わない）。baseline: この test は無い（AC2 の `rg` の baseline に含まれる）。
- AC4（登録と bindings）: `bash scripts/check-command-drift.sh` が `D=69 H=69 S=69 T=69` で exit 0。`rg -n 'inspectBackup|InspectBackupRequest|BackupInspection' src/lib/bindings.ts` が command と 2 つの型を返す。`git diff --exit-code src/lib/bindings.ts` が `cd src-tauri && cargo run --bin generate_bindings` の後に exit 0。baseline: `D=68 H=68 S=68 T=68`、`rg -n 'inspectBackup|suspendAutoBackupCheckAndWait|InspectBackupRequest|BackupInspection' src` は出力なし・`exit=1`。並走の lane が先に command を足して merge したら、期待の 69 はその数 + 1 に読み替える（`H` と `S` が等しいことが条件）。
- AC5（frontend の test）: `npm test -- src/features/backup-restore src/components/layout/RootLayout.test.tsx src/features/inventory-records/OtherRecordDetailRoutes.test.tsx src/lib/app-router.test.tsx src/lib/invalidation-contract.static.test.ts`（`package.json` の `test` = `vitest run`。version pin なしの `npx` を使わない、D-030）が exit 0 で、Matrix の UI の行の test がすべて PASS。baseline: 未実測（既存の test は main の CI で緑）。
- AC6（置き換わる注記の残り 0）: `rg -n "今の \`extract_datetime_from_backup\` は|今の実装は前方一致と|runtime の lane の build で確かめる|runtime の lane が Windows で確かめる" docs/function-design/71-mnt-backup.md` が出力なし。baseline: `57:今の \`extract_datetime_from_backup\` は`、`96:` に 2 つ、`372:今の実装は前方一致と` の 3 行（`rg -n … -o` の出力 4 件）。`rg -n '後続の runtime の lane で' docs/function-design/43-cmd-settings-log.md` は `inspect_backup` を含まない文だけを返す（残りの 5 command の (b) の文）。`rg -n 'inspect_backup（D-114、runtime は後続の lane）' docs/FUNCTION_DESIGN.md` が出力なし。baseline: MNT-01 の索引の 1 行・`exit=0`。
- AC7（層と設計照合）: `cd src-tauri && cargo test --test architecture_test --test design_compliance_test` が exit 0。baseline: 未実測（main の CI で緑）。
- AC8（release build）: Human Gate に L3 を含むので、Writer の完了条件として `cd src-tauri && cargo check --release` が exit 0（`docs/DEV_WORKFLOW.md` Implementation Rules。CI gate ではない）。
- AC9（L3）: 下の Test Plan の L3-a1〜L3-a4 が全部 PASS（owner の目視の PASS / FAIL）で、`python3 scripts/pr-gate.py record --pr NUMBER` の manual の記録が pass。
- AC10（docs）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-23-backup-offsite-runtime-a.md` が ERROR 0（WARN は報告）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/function-design/71-mnt-backup.md` §71.3（名前の解析）・§71.4（手順 0〜4b、MNT-01-D7・D10、「書く先の固定」）・§71.4.1・§71.5 手順 0・§71.8 手順 3 と注入境界・§71.10 の D-114 の追加の表・§71.12（MNT-01-D9）／`43-cmd-settings-log.md` §43.6・§43.8.2 の「実行の thread」・§43.8.5・エラーの写像の表・DTO の形・§43.11／`68-ui-backup-restore.md` UI-11b-F9・D13・D15、§68.4（手動バックアップ手順 4・復元の手順 1〜2）、§68.7（`restore_inspecting`・`restore_blocked`・`restore_detail`）、§68.10、§68.11／`22-mnt-migration.md` MNT-03-D11 の「復元への波及」／`docs/decision-log.md` D-114・D-032。
- 必要な設計成果物: function-design（MNT-01・CMD-11・UI-11b） = existing sufficient（PR #155 で設計済み。Plan Review round 1 の是正で、Writer が 1 通りに決められなかった 2 つ〈71 §71.12 手順 1 の URI の組み方、68 の `ready` へ戻す「閉じる」と確かめの文言〉を正本に足した。設計の方向は変えていない。実装の後に注記を事実へ置き換える、Scope の「置き換わる注記」）／DB = existing sufficient（schema・`app_settings` を変えない）／SCREEN_DESIGN = existing sufficient（バックアップ・復元画面の「復元の詳細へ進む前に控えを確かめ」の行）／decision-log = 足さない（下）／Boundary / Wire Contract = 下に記入。
- plan にしかない durable な判断の昇格先: lane を 2 つに分けたことは実装の切り方で、製品の判断ではない（設計正本は完成の形を持つ。`docs/DEV_WORKFLOW.md` Design completion criteria の「source docs do not shrink the business need」）。D-129 は使わない。packet の中の小さな実装の決定（file 操作の trait の共有、SD の folder 名の定数の置き場所、商品の数 0 の表示）は design の packet が「runtime の lane が決める」と申し送った所と、設計の文（UI-11b-D15「取れたときだけ」）から一意に読める所で、新しい正本の文を要さない。
- 前提・制約と、延期した design gap の follow-up: 外部前提 P7〜P10（volume GUID path への `VACUUM INTO` と公開、`GetFinalPathNameByHandleW(VOLUME_NAME_GUID)`、公開の後の親 directory の sync、URI の open）は 2026-10-23 に Windows の probe で全部 PASS（下の Contract Probe）。exFAT は未確認（Matrix の Residual Test Gaps）。延期: (b) の全部（上の「後続の lane」）、J1。延期が安全な理由: (a) の版は今の backup と復元を強めるだけで、PC の外の控えが無い今より悪くしない。
- 絶対保証の自己点検: 「作業名を成功に数えない」: 一覧・掃除・今日の判定は規約の完全一致で、`.db.partial` は日時を返さない。例外は公開の後の失敗（metadata・親 directory の sync）で、そのとき残る正式名は検査済み（MNT-01-D7 の Compatibility）。「確かめ済みの backup を上書きしない」: Windows は `MoveFileExW` を `MOVEFILE_REPLACE_EXISTING` なしで呼び、存在の確認と移動が 1 つの呼出し。Windows 以外は test だけで `hard_link`。例外なし。「レジの SD に書かない」: 正規化した元の path と実体の path の両方の祖先で判定し、以後は実体の path で書く。例外: 判定の後に同じ volume の上へ利用者が `CASIO\SR500_550_4000` を作った場合（判定は 1 回の呼出しの入口だけ。次の呼出しで止まる）。「判定した folder に書く」: 正規化を固定より先に行う（§71.4 の (1)）。「控えの確かめは file を変えない」: `immutable=1` の読取り専用の open。例外は無いが、test は WAL の DB の fixture で `-wal`・`-shm` ができないことを見る（design の Matrix の MNT-01-D9 の行の注意）。「止めた控えで事前バックアップを作らない」: `restore_blocked` は復元の button を出さず、`handleStartRestoreConfirmation` へ進む経路を持たない。
- 判定: ready（plan-draft、2026-10-23。Plan Review round 1 の是正の後も同じ）。未解決の設計の問いは無い。外部前提 P7〜P10 は記録済み（全部 PASS）。J1 は owner が A と答えた（TD-390）。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 | (a) の扱い |
|---|---|---|
| Tauri command（frontend から呼ぶ） | `lib.rs` の specta `collect_commands!` 登録 / `#[tauri::command]` + `#[specta::specta]` の対 / `bindings.ts` の再生成 | `inspect_backup` に `#[tauri::command(async)]` + `#[specta::specta]`、`collect_commands!` と `generate_handler!` の両方、`cargo run --bin generate_bindings`。`scripts/check-command-drift.sh` は `#\[tauri::command([^]\n]*)\]` で `(async)` を受ける（同 script の command の集合を取る行）。`src-tauri/tests/design_compliance_test.rs` の関数の正規表現は attribute を任意として `fn` を拾う（同 file の `tauri::command` を含む正規表現）。AC4 |
| function-design doc 新設 | `build_doc_to_modules_map()` | 該当なし（新しい doc も module も無い。`mnt::offsite` の追加は (b)） |
| source / workflow doc 新設・改名・削除 | 親文書の目次・索引 | 該当なし |
| REQ / coverage | `cargo run --bin generate_traceability` で `90-traceability.md` 再生成 | test に REQ-901 と決定 ID を付ける（REQ-901 の coverage は既に required、`docs/spec/requirements.md` の REQ-901 の行）。再生成を S3 の完了条件に含める |
| route 新設・改名・削除 | `npm run generate:routes` | 該当なし |
| operator 画面新設・改名・削除 | `navigation.ts` と到達テスト | 該当なし（既存の `/settings/backup` の中） |

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 書く先の固定（Windows の path と volume の API）とレジの SD の folder 名は OS・機種に依る部分で、`pin_to_volume`・`pin_backup_dir` と IO-09 と共有する定数に閉じる。core は「作業名 → 確かめ → 上書きしない公開」「正式名だけを数える」「使える控え」 | レジの機種が変わったら MNT-01-D10 の folder 名の定数を IO-09 と一緒に替える |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 事実: 今の `create_backup` は `VACUUM INTO` で正式名へ直接書く（`mnt/backup.rs` の `create_backup`）、今日の判定は前方一致（同 `collect_today_backup_names`）、restore は既に `CreateFileW`・`MoveFileExW` を使う（`mnt/restore.rs` の `StdRestoreFileOps`）。外部前提: P7〜P10（Windows でしか確かめられない。2026-10-23 に全部 PASS）。判断: D-114・MNT-01-D7・D9・D10（正本に済み） | Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 作成の途中の失敗は作業名だけが残り次回に消える。同じ秒の 2 回目は既存を残して失敗。公開の後の失敗は検査済みの正式名が残る。復元の card の「閉じる」は確認を再開する。復元の失敗（fatal でない）の後は未選択へ戻り、再試行は確かめから。復元の実行中の離脱は結果で決める（UI-11b-D13・D15）。前の版へ戻した後は作業名が見えないだけ（Rollback notes） | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 店主の操作は増えない（自動 backup はそのまま）。owner は復元の前に確かめの結果を見る。保存先がレジの SD の上なら手動の backup の文が直し方を名指す | L3-a1〜L3-a4 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | backup の作り方を `rusqlite::backup` 等へ替えるときは手順 4 だけを替え、検査・公開・固定は残る（MNT-01-D7 の見直し契機） | — |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | test は一時 directory の合成の DB。L3 は試しの DB。repo に実データ・backup file・probe の出力の中の volume GUID を置かない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | not applicable: 業務の数値を変えない（商品の数・最後の記録は控えの確かめの表示だけ） | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | Windows の `pin_to_volume`（`GetFullPathNameW`・`GetFinalPathNameByHandleW`）と固定した path への `VACUUM INTO`・`MoveFileExW` は Windows でしか通らない（CI に Windows の runner は無い: `rg -n -i 'windows' .github/workflows/*.yml` が出力なし）。新しすぎる版・壊れた控えは L3 Eligibility の (3) に当たるので自動 test | L3-a1〜L3-a4、Contract Probe |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 新しい依存は足さない（`windows-sys = "=0.61.2"` の既存の feature。足りなければ feature だけ）。Windows 以外の test は同じ関数の Windows 以外の側（`canonicalize` と symbolic link）を通す（71 §71.4 の test の項）。Windows 側の実機の確かめは probe と L3 で、CI に Windows の runner を足すことは defer（理由: 今の CI の構成の範囲の外で、L3 が同じ path を通す） | — |

## Boundary / Wire Contract

- producer: MNT-01（71 §71.12 の `inspect_backup`、§71.4 の `pin_backup_dir`）、CMD-11（43 §43.6・§43.8.5）
- consumer: UI-11b（`commands.inspectBackup`、`commands.createBackup` の失敗の文）
- wire type: `InspectBackupRequest { backup_path: String }`、`BackupInspection { file_name, created_at?, size_bytes, schema_version, app_max_version, newer_than_app, quick_check_ok, product_count?, last_operation_at? }`（71 §71.12 のまま）。error は既存の `CmdError`（`validation` / `internal`。`CmdErrorKind` に値を足さない）。`create_backup` の wire（`BackupResult`）は変えず、失敗に `validation` の 2 つの固定の文が足る（43 §43.6）
- internal type: `PinnedPath { normalized, actual }`、`BackupDirError::{Unpinnable, RegisterSd { sd_folder }}`（wire に出さない。`sd_folder` は CMD の文の中の path の文字列だけ）
- precision/range: `size_bytes` は既存の `BackupResult.size_bytes` と同じ u64（bindings の `number`）。`product_count` は件数で JS の安全な整数の内（43 §43.8 の DTO の形）。版（`schema_version`・`app_max_version`）は外の DB の値で範囲を仮定せず、UI は判定にも表示にも使わない（判定は `newer_than_app`。UI-11b-D15 の文は版の数を出さない）。日時は文字列で、`created_at` は `YYYY-MM-DD HH:MM:SS`（file 名から）、`last_operation_at` は `operation_logs.created_at` の値のまま（今の書込みは `YYYY-MM-DDTHH:MM:SS`、`db/system_repo.rs` の `insert_operation_log`）。UI はどちらも一覧と同じ `formatBackupDate`（空白と `T` の両方を受ける）で和式にする
- round-trip path: `listBackups` の `BackupInfo.file_path` → `inspectBackup({ backup_path })` → `restore_detail` → 既存の `restoreBackup({ backup_path })`（同じ値）
- invalid input: 空の `backup_path` は `validation`。開けない・版を読めない・版 0・必須の表が無い file は `inspect_backup` が `DbError` → 「この控えを読めませんでした。別の控えを選んでください。」（`validation`）
- compatibility: 既存の command・DTO・`CmdErrorKind`・`app_settings`・DB の schema・file 名の規約・操作ログの形は変えない。前の版のアプリは作業名を見ない（Rollback notes）

## Test Plan

Test Design Matrix: [2026-10-23-backup-offsite-runtime-a](test-matrices/2026-10-23-backup-offsite-runtime-a.md)。

- targeted tests: AC2・AC5・AC7 の command。
- negative tests: Matrix の Negative Paths。
- compatibility checks: 既存の restore の test（`mnt/restore.rs` の `tests`）、backup の既存の test（`mnt/backup.rs` の `tests`、`cmd/settings_cmd.rs` の `tests`）を回帰で回す。
- data safety checks: 差分に実データ（店の DB・backup file・実 JAN・商品名・金額）と probe の出力の volume GUID を入れない。
- main wiring/integration checks: `RootLayout.tsx` の `useAutoBackupCheck` と `BackupRestorePage` の停止の待ち（Matrix の UI-11b-D15 の行）、CMD の `create_backup` から `pin_backup_dir` まで（Matrix の MNT-01-D10 の CMD の行）。
- Writer の完了条件に `cd src-tauri && cargo check --release`（AC8）。

L3（Windows の実機、owner の目視。到達経路・入力物・用意できる fixture。Coordinator は Ready の依頼と同時に試しの DB の手順を渡す。前の版の MSI の入れ直しは求めない）:

| ID | 確かめること | 到達経路 | 入力物 | 合格基準 |
|---|---|---|---|---|
| L3-a1 | 既定の保存先（PC の中、NTFS）で手動 backup ができ、作業名が残らない（P7〜P10 の実の binary） | 設定 → バックアップ・復元 →「今すぐバックアップを作成」 | 試しの DB（商品を数件登録した開発用の DB。店の DB を使わない）。保存先は既定 | 一覧に今日の和式日時の行が増える。保存先の folder に `inventory_backup_YYYYMMDD_HHMMSS.db` があり、`.partial` で終わる file が無い |
| L3-a2 | USB メモリの上の folder を保存先にしても作れる（P7〜P10 の実の binary、FAT32） | 同じ画面 →「保存先を選ぶ」で USB メモリの上の新しい空の folder → 「今すぐバックアップを作成」 | 控え用の USB メモリ（owner が用意済み、TD-346）に新しい空の folder（例 `{USB}\backup-test-a2`）を作って選ぶ。既存の folder は選ばない（設定を戻すまでの自動の確認で `cleanup_old_backups` が保持日数より古い規約名の file を消す、71 §71.5）。L3 の後に保存先を既定へ戻し、その folder を消す | 一覧に新しい行。その folder に正式名の file があり、`.partial` が無い |
| L3-a3 | 保存先の祖先にレジの SD の folder があると書かず、原因の folder を名指す（MNT-01-D10、43 §43.6） | 同じ画面 →「保存先を選ぶ」で、USB メモリの root に作った `CASIO\SR500_550_4000` の folder と並ぶ folder（例 `{USB}\backup-test`）→「今すぐバックアップを作成」 | 同じ USB メモリに試しの folder `CASIO\SR500_550_4000` を作る（レジの SD は使わない。68 UI-11b-L3-7 の試しの媒体と同じ形）。L3 の後に試しの folder を消し、保存先を既定へ戻す | 「この保存先はレジの SD カードの上にあります（…CASIO\SR500_550_4000 が見つかりました）。…」が出て、USB メモリの一覧が前後で同じ（新しい file が無い） |
| L3-a4 | 一覧の行から復元に進むと控えの確かめが出て、閉じても DB は変わらない（UI-11b-D15） | 同じ画面 → 一覧の行の「この控えに戻す」→ 詳細 → 復元の card の「閉じる」 | L3-a1 で作った控え | 詳細に「この控えは戻せます」「商品の数: N 件」「最後の記録: 和式日時」が出る。「閉じる」で復元の card が未選択に戻り、ホームの数字が変わらない |

human visual confirmation（`docs/DEV_WORKFLOW.md` Human Visual Confirmation For Screen Changes）: 対象は `/settings/backup` の復元の card（確かめの間の「控えを確かめています」、戻せる控えの詳細、「閉じる」）と止めた控えの文言。目視は L3-a4 の戻せる控えの表示と「閉じる」で行う。止める文言（新しすぎる版・壊れた・読めない）の目視は省き、文言は flow の test の完全一致で固定する。理由: 止める控えを実機で用意するには新しすぎる版・壊れた file を人が作る手順が要り、L3 Eligibility の (3) に当たる（名前を替えた文字の file で読めない控えを見る手順も足さない。owner の手の制約と同じ (3)）。この省略で残る危険（文言の見え方を人が見ない）の受理は、Coordinator が Ready の依頼に 1 行で書き、owner の 1 語の受理を取って PR に記録する（同じ依頼の decision point で、介入を足さない）。

## Review Focus

- Ordinary Operation の列が正常な条件で目的（PC の中の backup が確かめ済みになり、SD に書かず、復元の前に止める）を達成できるか。とくに Windows で今の保存先の backup が作れなくなる経路（固定の失敗）が L3 と probe より前に見つかる手立てがあるか。
- 機能で 2 つに分けた切り方で、(a) の版が単独で安全に配れるか（「各 lane の配布の単位としての安全」）。(b) が (a) の共有の関数をそのまま使えるか（71 §71.11.3 の「媒体の固定」が `pin_to_volume` を使う、§71.11.4 手順 3a が「使える控え」を使う）。
- 作業名・公開・固定の順（横断の約束の表）が 71 §71.4 のエラーハンドリングと一致し、test の注入点が本番と同じ関数を通るか（`RestoreFileOps` の共有、§71.8 の注入境界）。
- UI-11b-D15 の停止と再開が、(a) の入口（一覧の行）だけで D13 の fatal の後の停止・復元の実行中の離脱と矛盾しないか。
- 置き換わる注記の列挙に漏れが無いか、この変更で不要になる記述・条件・code が他に無いか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| MNT-01-D7 | 71 §71.4 手順 3・4・4a・4b、エラーハンドリング、MNT-01-D7 | `mnt/backup.rs` の `create_backup` | Matrix の MNT-01-D7 の行（今日の判定の行を除く 5 行） | L3-a1・L3-a2（`.partial` が残らない） |
| 71 §71.4.1 上書きしない公開 | 71 §71.4.1 | `mnt/restore.rs` の file 操作の trait に `publish_no_replace` | Matrix の MNT-01-D7 の公開の 2 行 | L3-a1（Windows の `MoveFileExW`） |
| MNT-01-D7（今日の判定） | 71 §71.8 手順 3、注入境界 | `mnt/backup.rs` の `collect_today_backup_names` | Matrix の今日の判定の行 | 非対象 |
| MNT-01-D10（PC の中の保存先） | 71 §71.4 手順 0 と「書く先の固定」、§71.5 手順 0、MNT-01-D10 | `mnt/backup.rs` の `pin_to_volume`・`pin_backup_dir`・`create_backup`・`cleanup_old_backups` | Matrix の MNT-01-D10 の 5 行 | L3-a2・L3-a3 |
| 43 §43.6（手動の backup の原因の名指し） | 43 §43.6 の `BackupDirError` の表 | `cmd/settings_cmd.rs` の `create_backup` | Matrix の MNT-01-D10 の CMD の行 | L3-a3 |
| 71 §71.3 名前の解析 | 71 §71.3 | `mnt/backup.rs` の `extract_datetime_from_backup` | Matrix の §71.3 の行 | 非対象 |
| MNT-01-D9 | 71 §71.12（手順 1〜5、手順 2a、「使える控え」、エラーハンドリング） | `mnt/backup.rs` の `inspect_backup`、`db/migration.rs` の `read_current_version_without_ddl` の共有 | Matrix の MNT-01-D9 の 6 行（URI の組立ての行を含む） | L3-a4（戻せる控え）。Windows の volume GUID path の URI の open は Contract Probe の P10 |
| MNT-03-D11（改めた文） | 22 §3.2 の MNT-03-D11「復元への波及」 | 版の判定の関数を共有するだけ。restore の中は変えない | 既存の `test_restore_backup_req901_runs_migration`（`mnt/backup.rs`）と `test_restore_req901_newer_schema_backup_rolls_back_to_current`（`mnt/restore.rs`）（回帰） | 非対象 |
| 43 §43.8.5 | 43 §43.8.5、§43.8.2 の「実行の thread」、エラーの写像の表の最後の行、DTO の形 | `cmd/settings_cmd.rs` の `inspect_backup`、`lib.rs` の 2 つの macro | Matrix の 43 §43.8.5 の 2 行 | 非対象 |
| UI-11b-F9・D15（一覧の行の入口・「閉じる」） | 68 UI-11b-F9・D15、§68.4 復元の手順 1・1a・2、§68.7（`pre_backup_failed` → `ready`、`restore_failed_recovered` → `ready` を含む）、§68.9、§68.10 の「閉じる」の行 | `BackupRestorePage.tsx` | Matrix の UI-11b-D15 の 3 行と、既存の it.each「REQ-700 68 §68.7 shows error_id for %s」の `restore_failed_recovered` の行に足す未選択の assert | L3-a4、目視 |
| UI-11b-D13（停止の始まりと世代番号） | 68 UI-11b-D13 の「D-114 の後は」の文、D15 の共通の確認の停止 | `useAutoBackupCheck.ts` の module scope の `inFlight` と `suspendAutoBackupCheckAndWait`、`BackupRestorePage.tsx` | Matrix の UI-11b-D15・D13 の page の行と UI-11b-D13・D15 の hook の行（page の D13 の 2 本から契約ごと移す）。既存の `useAutoBackupCheck.test.tsx` の停止・guard・StrictMode の test（回帰） | 非対象 |
| §68.4 手動バックアップ手順 4・§68.10 | 68 §68.4、§68.10 の「手動 `createBackup` の結果（成功・失敗とも）」 | `BackupRestorePage.tsx` の `handleManualBackup` | Matrix の手動 backup の再取得の行 | 非対象 |
| §68.11 手動バックアップ失敗 | 68 §68.11 の「手動バックアップ失敗」の行 | `describeError` が `validation` の文をそのまま出す（`src/lib/describe-error.ts`、変えない） | Matrix の MNT-01-D10 の CMD の行（文）と UI の行 | L3-a3 |
| MNT-01-D6（metadata の既存 test） | 71 §71.10 の D-114 の表の「MNT-01-D6 metadata の既存 test の移し替え」、MNT-01-D6 | `mnt/backup.rs` の `tests` | Matrix の MNT-01-D6 の行 | 非対象 |
| Rollback（前の版から作業名が見えない） | 本 packet の Rollback notes、design の packet の Rollback notes の申し送り | 作業名の形 | Matrix の rollback の行 | 非対象（Rollback notes） |
| 隣接の除外: MNT-01-D1〜D5、UI-11b-D2〜D5・D11・D12、D-032 | 71 §71.7、68 §68.5 | 変えない（確かめは restore の前に足すだけ） | 既存の restore の test と `BackupRestorePage` の test（回帰） | 非対象 |
| 隣接の除外: MNT-01-D2・D3 | 71 §71.9、§71.8 | 変えない（`resolve_backup_dir` と保持日数の確定の規則） | 既存の test（回帰） | 非対象 |
| 隣接の除外: UI-11b-D8 | 68 §68.5 | 変えない（`backup_path` は picker だけ、取外し可能な drive も選べる） | 既存 | 非対象 |
| 隣接の除外（(b) へ）: MNT-01-D8、§71.11.1〜§71.11.7、43 §43.8.2〜§43.8.4・§43.8.6・§43.8.7、UI-11b-F8・F10・D14・D16、UI-00-D12、UI-11b-D15 の file picker の入口、22 §16 (3) | 71 §71.11、43、68、53、22 | (b) の packet | (b) の Matrix | (b) の L3（UI-11b-L3-6〜L3-9） |

Contract Audit（新しく足す契約の文を境界の 4 観点で一巡した。新しい文は本 packet の Scope の小さな実装の決定と、MSI の手順書の流れ 3 の 1 文）:

- 安全な整数の範囲: `BackupInspection.product_count` は件数で上限から JS の安全な整数に届かない。版は範囲を仮定せず UI は使わない（43 §43.8 の DTO の形のとおり）。`size_bytes` は既存と同じ u64。新しい文は数を足さない。
- 0 の表示: 商品の数 `Some(0)` を「0 件」と出し、`None` と区別する（横断の約束の表）。空の DB の控え（新しい PC の起動時の自動 backup 等、71 §71.11.7）を「戻せます」の後に見分ける材料になる。止めずに出すのは設計どおり（アプリは空の DB の控えを区別しない、71 §71.11.7）。保持日数の掃除の 0 件は `Ok(0)`。
- 失敗の時点と順序: 横断の約束の表の 5 経路に置いた。手動 backup は成功・失敗とも一覧を取り直す（今の code は成功のときだけで、§68.4 手順 4 の設計に合わせる）。
- 単位や種類の混在: `size_bytes` は bytes で、画面は MB（既存の一覧と同じ）。一覧の行から来る控えは名前が規約に合うので `created_at` は常に `Some`（`None` の扱いは file を選ぶ入口の (b)）。MSI の手順書の 1 文は「USB メモリの `InventoryBackup\` の外」と「backup の保存先の外」の 2 つの場所の種類を混ぜない（手順 4 の 2 か所のうち PC の外の媒体の側だけに掛かる）。

Contract Audit の段 2（Plan Review round 1 の是正で足した契約の文。並べると: (A) URI の組立ての 1 文〈71 §71.12 手順 1・S1・Matrix〉、(B) `inFlight` の module scope と `suspendAutoBackupCheckAndWait`、(C) 復元の card の「閉じる」〈出る間・押せない間・3 つの処理〉、(D) `pre_backup_failed` → `ready`、(E) fatal でない復元の失敗の後の未選択、(F) 確かめの間と詳細の文言〈「控えを確かめています」「商品の数: N 件」「最後の記録: 和式日時」〉、(G) `inspectBackup` の IPC の例外も読めない控えの文言、(H) L3-a2 の新しい空の folder、(I) 目視の省略の受理、(J) P9・P10 の probe。4 観点で一巡した）:

- 安全な整数の範囲: (F) の N は `product_count`（件数、JS の安全な整数の内）で、新しい数の型は無い。(A) の符号化は文字の置換で数を作らない。(B) は世代番号（既存の整数、停止のたびに 1 進むだけ）を変えない。
- 0 の表示: (F)「商品の数: 0 件」と出し、`None` は行を出さない（`0` と「取れない」を混ぜない）。最後の記録の `None` も行なし。(C) の後の一覧が 0 件なら既存の「まだバックアップはありません」。
- 失敗の時点と順序: (A) は 1 回の走査で置き換える（走査を分けて `%` を後にすると `%3f` の `%` を二重に符号化する。Matrix の URI の行の file 名は `%` と `?` を両方含み、二重の符号化で red）。open の失敗は手順 4a では作業名を消して `Err`、確かめでは `restore_blocked`。(B) は停止（世代番号を進める）を待つより先に行い、待つ間に届いた結果は捨て、その後に `inspectBackup`（順は「解決 → `inspectBackup`」で固定。Matrix の page の行が逆の順で red）。(C) は確かめ・事前バックアップ・復元の間は押せず、`restoring` では出ない（復元の結果での再開は UI-11b-D13 が持つ）。処理の順は state を未選択へ → 再開 → 一覧の invalidate（invalidate の取得は確認と並んでもよい。backend の Mutex が直列にする）。(D)(E) は §68.7 の Next と一致させた（最終確認の「キャンセル」は `restore_detail` へ戻るだけ）。(J) は外れたときの分岐を下の Contract Probe に置いた。
- 単位や種類の混在: (A) の path の文字列は OS の path のまま（Windows の `\`・`\\?\` の前置を URI の `/` へ変えない。変えると `winIsLongPathPrefix` の backslash の完全一致に外れ、現在の drive の `C:\?\Volume…` に解決する）。符号化は小文字の `%3f`・`%23`・`%25`（SQLite の `%HH` の復号は大小を問わない）。(F) の日時は `created_at`（空白）と `last_operation_at`（`T`）で形が違い、同じ `formatBackupDate` が両方を受ける（Boundary / Wire Contract）。(H) は保存先の folder（規約名の file を消しうる場所）と、L3 の後に消す試しの folder を同じものにする。

## Contract Probe

結果（2026-10-23、owner の Windows の PC、控え用の USB メモリ〈FAT32〉と `%APPDATA%` の folder〈NTFS〉の両方。Windows に同梱の SQLite 3.53。値〈volume GUID・drive の path〉は書かない）:

- P7 `VACUUM INTO` が volume GUID path（`\\?\Volume{GUID}\…`）の作業名へ書け、`MoveFileExW`（`MOVEFILE_REPLACE_EXISTING` なし）で正式名へ移せる（71 §71.4 の「書く先の固定」の前提）: **PASS**（USB と `%APPDATA%` の両方で、作業名へ書いて正式名に移せ、size が 0 より大きい）。
- P8 NTFS の folder と取外し可能な drive（控え用の USB メモリ）の root で、`CreateFileW`（`FILE_FLAG_BACKUP_SEMANTICS`）で開いた handle の `GetFinalPathNameByHandleW(…, VOLUME_NAME_GUID)` が `\\?\Volume{` で始まる path を返す（同じ関数を PC の中の保存先と (b) の媒体の root に使う前提）: **PASS**（両方で `\\?\Volume{` で始まる）。USB の `GetDriveTypeW` は 2（`DRIVE_REMOVABLE`）で、design の P1 の残り（`Removable` を `DRIVE_REMOVABLE` と同じ区分と見なす前提）も閉じた。
- P9 公開の後の親 directory の sync（71 §71.4 手順 4b、`StdRestoreFileOps::sync_parent` と同じ形）が FAT32・NTFS で通る: 試しの folder を volume GUID path で `CreateFileW`（`GENERIC_WRITE`、`FILE_FLAG_BACKUP_SEMANTICS`）で開いて `FlushFileBuffers` する。**PASS**（両方で通った）。
- P10 `inspect_backup` の開き方（71 §71.12 手順 1）が volume GUID path で成り立つ: 公開した `probe.db` を、path の `%`・`?`・`#` だけを符号化した `file:` URI + `?immutable=1` で `SQLITE_OPEN_READONLY | SQLITE_OPEN_URI` で開いて読み、試しの folder の file が増えない。**PASS**（読めて、folder の file は増えなかった）。
- 確かめていない: exFAT（owner の USB は FAT32。Matrix の Residual Test Gaps）。

段取り（実施済み。owner の手の回数を減らした形の記録）: Coordinator が PowerShell の script（repo に置かない。Windows PowerShell 5.1 の `Add-Type` の P/Invoke、追加の install なし）を用意し、owner が控え用の USB メモリを差して 1 行で流し、最後の 1 行の合否を返した。P7・P8 の回と、Plan Review round 1 で足した P9・P10 の流し直しの 2 回（介入は各 1 回、Owner Effort Budget）。試しの folder（`InventoryProbe`、`InventoryBackup` の外）は script が消し、店の DB とアプリの folder には触れていない。

- 読み方: Windows に同梱の SQLite は rusqlite の bundled の SQLite と別の build で、P7・P10 は同じ SQLite の URI の解析と Windows の VFS の path の扱いの代わりの確かめになる。実の binary の確かめは L3-a1・L3-a2（固定した path への `VACUUM INTO`・公開・親 directory の sync、手順 4a の URI の open）と L3-a4（一覧の行の確かめ）が持つ。
- L3 で外れたときの分岐（probe は全部 PASS なので plan-gate では止めない）: implementing で止め、Gated Amendment として design の直しと packet の改定を Plan Review に出す。直す所は外れた前提で決まる: P7・P8 の形（固定・書く場所）→ 71 §71.4 の「書く先の固定」と MNT-01-D10 の判定の置き方、P9 の形（公開の後の親 directory の sync が USB で毎回失敗し、手動 backup が成功しているのに失敗と出る・自動は連続の最初の 1 回の toast）→ 71 §71.4 手順 4b とエラーハンドリング、P10 の形（作業名の検査が毎回 `Err` になり、Windows で backup が作れない）→ 71 §71.12 手順 1。
- 観測済みで probe の要らない前提: restore は既に `CreateFileW`・`MoveFileExW`・`CloseHandle` を Windows で使う（`mnt/restore.rs` の `StdRestoreFileOps`）。`immutable=1` の読取り専用の open が file・folder を変えないことは SQLite の公式資料（URI の `immutable` の項）に依り、Matrix の MNT-01-D9 の行が WAL の DB で実測する（design の P4）。URI を使わない読取り専用の open は WAL の header の file で `-wal`・`-shm` を作る（SQLite の wal.html §5）ので、一覧の行に手で置かれた live DB の写しが来うる限り、URI + `immutable=1` が唯一の形。URI の解析は `file:` の直後が `//` のときだけ authority を見て、それ以外は `%HH` の復号と `?`・`#` の区切りだけで `\` を触らない（bundled の `sqlite3.c` の `sqlite3ParseUri`）。`SQLITE_OPEN_READ_ONLY` を落とすと `immutable=1` でも無い file を作る（Matrix の読めない file の行の「file を作らない」）。
- 本 lane の外: P1 は確認済み（2026-10-22、repo 外の回答台帳 TD-375）。P2〜P6 は (b) と design の packet の扱いのまま。

## Data Safety

- tracked に書かない: 店の DB・backup file・USB メモリの中身、probe の出力の volume GUID と drive の path、実 JAN・商品名・金額、店主の発言の原文、repo 外の回答台帳の細部（TD の番号と要旨だけを書いた）。
- local-only: probe の script とその出力、probe と L3 で作った試しの folder（`InventoryProbe`、`CASIO\SR500_550_4000`、L3-a2 の新しい空の folder）と試しの DB の backup（L3 の後に消す）。
- synthetic-only: test は一時 directory に合成の DB・作業名・`CASIO/SR500_550_4000` の folder・symbolic link を作る。新しすぎる版の DB は既存の test helper（`src-tauri/src/db/test_support.rs` の `write_newer_schema_db`）の形。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
