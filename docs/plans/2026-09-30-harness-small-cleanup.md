# Plan Packet: ハーネスの残りの小口を整理する（R2）

wave に属さない単独の lane。2026-09-30 起草。出典は [backlog](../backlog.md) の「ハーネスの残りの小口の整理」（`docs/backlog.md:87`、ハーネス刷新 PR4・PR5 の closeout で挙がった 4 件）。owner 決定 2026-09-30: 4 件を R2 の 1 本にする（規則の意味を変えるので、Risk Tiers `docs/DEV_WORKFLOW.md:47` の R2「Local developer workflow … docs change」に当たり、backlog の「R0/R1 で 1 本」は起票時の見積もり違い）。同日の owner 回答: Windows の Codex Desktop はこの repo では多分使わない（個人の別 repo では使う）。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

実装後の状態はPR native state / 専用record / CIが所有し、trackedに書かない。

- Phase: plan-gate
- Risk: R2
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（`subagent_type: writer`）
- Plan Reviewer: fresh Opus 5.5（`subagent_type: reviewer`）+ Codex GPT-6.1 Sol / high
- Final Reviewer: fresh Opus 5.5 + Codex GPT-6.1 Sol / high
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/harness-small-cleanup

座組は `docs/AGENT_OPERATING_MANUAL.md` `## 座組`（確認日 2026-09-30）に照合した。Final Reviewer の Claude 側は R2 で design lane でないため fresh Opus 5.5。Final Review Minimum 2 は、Scope の `AGENTS.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/DEV_WORKFLOW.md`・`docs/agent-guidance/*` が `scripts/ci/classify-changes.sh:59` の policy docs（workflow=true）に当たるため（`docs/DEV_WORKFLOW.md:83`）。manual なし: 製品 runtime・画面・配布物への変化がない文書変更で、Windows native の確認対象がない。

遷移記録（append-only）:

- kickoff → spec-check（2026-09-30、本 commit）: 対象を S1〜S4 に限定し、Risk を R2 と記録した。
- spec-check → plan-draft（2026-09-30、本 commit）: 唯一の許された skip。設計正本が workflow 文書自身（`AGENTS.md`・`docs/DEV_WORKFLOW.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/agent-guidance/README.md`）で、その改訂が本 lane の Scope そのもの。Design Readiness を参照。
- plan-draft → plan-gate（2026-09-30、本 commit）: packet を plan-first commit で確定。R2 のため Test Design Matrix は作らない（下の Test Plan）。fresh Opus 5.5 と Codex の Plan Review へ。

## Owner Effort Budget

- 介入回数上限: 6（既定 6）
- 実働時間上限: 30 分（既定 30 分）
- Plan Review round 天井: 3（既定 3）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 2（2026-09-30: #5 の回答 1、組み方の判断 1） | 2（Ready 1、merge 1） | 2 | 6 = 2 + 2 + 2 |

relay（Coordinator が Codex を起動する往復）は上限を置かない（D-098）。
既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R2

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers を当てた。変更は毎 session 読まれる運用文書（`AGENTS.md`・`docs/Plans.md`）、reviewer 発注の規則（MANUAL §5.4）、参照されない補助文書（agent-guidance の profiles・evals）の改訂と削除で、runtime 契約・DB・CSV/TSV・command・route/search・画面の振舞いを変えない。R3 の「merge gate changes」に当たらない理由: helper（`scripts/pr-gate.py`）・classifier（`scripts/ci/classify-changes.sh`）・`.github/workflows/ci.yml`・pre-push・checker（`scripts/doc-consistency-check.sh`）・`scripts/tests/*` はいずれも触らず、required gate の green / red は変わらない（`.codex/bin/*-safe-*.sh` と `scripts/tests/codex-safe-wrappers.test.sh` を残す裁定は下の Scope S2）。R2 の「Local developer workflow … docs change that affects maintainability」に当たる。R0/R1 でない理由: S1〜S3 は規則の意味（closeout の書き方、Workspace Access の適用条件、reviewer 発注の形）を変える。

## Goal

Goal Invariant:

### 最小完了条件

- 毎 session 読まれる文書が今の運用と合い、短くなる: `AGENTS.md` の Workspace Access は wrapper を使う条件（Windows の Codex Desktop から動かすとき）を明示し、`docs/Plans.md` の `## 直近の完了` は「1 行 + link」の entry が上限件数以内で、main の SHA を含まない。
- reviewer 発注の規則が今の発注の形と逆向きでない: `docs/AGENT_OPERATING_MANUAL.md` §5.4 が「読むもの・読まないもの・判定の問い・確かめる command を具体に書く」側に立ち、「観点 list・必読順・検証 command の指定は書かない」の文が無い。
- 参照されない `docs/agent-guidance/profiles/` と `evals/` が無く、README・shared・model-notes に切れた参照が残らない。

### 失敗定義

- `docs/Plans.md` を刈った結果、完了の記録（PR・archive の packet・closeout 時の申し送り）が repo のどこからも辿れなくなる。
- Workspace Access の文を変えた結果、`.env*`・鍵を読まない規則（`AGENTS.md` Safety）や Windows の Codex Desktop 向けの wrapper・execpolicy・test が壊れる、または CI の `Run Codex safe wrapper regression tests`（`.github/workflows/ci.yml:299-300`）が red になる。
- §5.4 を書き換えた結果、read-only の宣言・報告フォーマット・subagent 生成上限（現行の 5 点のうち残すべき 3 点）が消え、reviewer が tracked file を編集する、または結論を誘導される。
- `docs/agent-guidance/` の削除で `bash scripts/doc-consistency-check.sh` の link 検査が red になる。

### 非目的

- wrapper の script・test・`ci.yml`・classifier・helper・checker の変更（CI 制御の変更は R3 になり、owner 裁定で本 lane から外した）。
- `docs/AGENT_OPERATING_MANUAL.md` の全面的な縮約と節番号の振り直し（`docs/backlog.md:66` の別項目）。
- `docs/Plans.md` の `## 次の行動`・`## ブロッカー`・`## 製品の未決判断` の内容の見直し（本 lane は `## 直近の完了` と Wave Registry の完了済み wave だけを扱う）。
- Codex 側の発注の雛形（`.local/`、tracked 外）の改訂。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、変更後の文書を使う通常の場面を操作列で書く。発注 → 停止と訂正 → review → owner 判断の通常列はそのまま使う。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| lane の PR が merge 済みで、closeout の R0 PR を書く Coordinator / subagent | `docs/DEV_WORKFLOW.md` Post-Merge Closeout の改訂後の行に従い、`## 直近の完了` の先頭に 1 行（日付・PR link・1 文・archive の packet への link、SHA なし）を足し、上限を超えた古い行を `docs/archive/harness-context/2026-09-30-Plans-completed.md` の先頭へ移す | 次の session が `docs/Plans.md` を読むとき、直近の完了が上限件数以内の短い行で見え、詳細は link 先（PR・archive の packet・移送先の archive）で読める | `bash scripts/doc-consistency-check.sh` が exit 0（link 実在と PK4 の pointer 行）、`## 直近の完了` の行数が上限以内 | 移送先の file は本 lane で作る。closeout の雛形（`.local/`）は merge 後に Coordinator が直す（Non-scope） |
| Coordinator が read-only の reviewer（Plan Review / Final Review）への発注書を書く | 改訂後の MANUAL §5.4 に従い、goal・scope 境界・read-only 宣言・報告フォーマット・subagent 生成上限に加えて、読むもの・読まないもの・判定の問い（Ordinary Operation の 3 値を冒頭で答える、「目的を達成できるか」と「危険な結果を出さないか」を分けて問う）・確かめる command を具体に書く。期待する結論・finding・検証の順序は書かない | reviewer が対象と問いを 1 通りに受け取り、冒頭の 1 行で操作列の成立を答え、findings を claims として返す。Coordinator は `docs/DEV_WORKFLOW.md` Review Rules に従って裁定する | reviewer の報告が §5.4 の報告フォーマット（Verdict・件数・file:line）を満たす | §5.4 の改訂は今の発注の形（2026-09-27 以降の Codex review の発注）を規則にするもので、新しい発注の形を導入しない |
| 新しい session が `AGENTS.md` の Session Start から入り、Workspace Access を読む | WSL の作業 checkout で通常の読書・検索（Claude Code の Read / `rg`、Codex の `-s danger-full-access --ignore-rules` 起動）を行う。Windows の Codex Desktop から動かすときだけ `.codex/bin/*-safe-*.sh` と `.codex/README.md` の許可コマンドに従う | wrapper を使わない通常の session が、規則に反しているかの迷いなく読書できる。Windows の Codex Desktop を使う場面では従来どおり wrapper の経路が残る | `AGENTS.md` の Workspace Access が「Windows の Codex Desktop から動かすとき」の条件を先頭に持つ | Windows の Codex Desktop をこの repo で使わない（owner 2026-09-30「多分使わない」）は前提であり、使う場面が戻っても wrapper・test・rules は残っているので壊れない |

## Scope

各項目に出典と、main `58d9c051`（本 packet の起草時）での確認結果を付ける。

### S1: `docs/Plans.md` の `## 直近の完了` を刈り、closeout の書き方を変える（backlog (1)）

現状（確認済み）:

- `docs/Plans.md` は 57,760 bytes（`wc -c docs/Plans.md`）。`## 直近の完了` は `:28`〜`:101`（`## ブロッカー` が `:102`）で 52,056 bytes、entry は 34 件（AC-S1-1 の baseline）、最古は 2026-08-31 の PR #52、最新は 2026-09-30 の PR #130。entry は長文で main の SHA を含む（例 `:30` の「main `2ba91dea`」。8 桁の SHA を持つ行は `## 直近の完了`〜`## ブロッカー` で 32、AC-S1-2）。
- `### Wave Registry`（`:87`〜`:101`、3,216 bytes）は wave 10・11・12 の完了済みの記録で、`:89` の形式の行が「完了済み wave の記録だけを置く。進行中の lane は `docs/plans/` の packet が持つ（D-097）。これより前の完了済み wave の記録は archive に移送済み」と定める。lane 行は squash の SHA を含む。
- `docs/DEV_WORKFLOW.md:32`（Artifact Map）は Plans.md を「Current phase, active work, blockers, next actions only」、`:361`（Done Definition）は「reflects the live state, not the full PR history」、`AGENTS.md:33`（Working Rules）は「履歴の全文は dashboard に戻さない」と定め、`docs/DEV_WORKFLOW.md:112`（Evidence Ownership、D-038）は exact-HEAD の SHA を `Plans.md` に転記しないと定める（2026-07-12 以降の記述に適用。現在の entry は全て 2026-08-31 以降）。書き足す規則は `docs/DEV_WORKFLOW.md:329`「Update `Plans.md` so it reflects current live state, completed work, archived evidence, and next action」の 1 行だけで、entry の形と上限が無い。
- 完了履歴の既存の archive は `docs/archive/harness-context/2026-09-14-Plans.md`（126,060 bytes、`docs/Plans.md:3` が指す「移送前の記録」の snapshot）。`docs/Plans.md:114`・`:120`、`docs/backlog.md:5` からも参照される。
- PK4 は `## 次の行動` に `docs/plans/` を指す pointer の行があることだけを見る（`scripts/doc-consistency-check.sh:1305-1321`）。`docs/Plans.md:13` にその行がある（確認済み）。helper は `Plans.md` を読まない（D-097）。

設計判断 D1（刈った entry の行き先）: **非破壊に archive へ移す**（Coordinator の推奨を採る）。新しい file `docs/archive/harness-context/2026-09-30-Plans-completed.md` を作り、刈った entry と Wave Registry の完了済み wave（10・11・12）の行を、本文を変えずに移す（相対 link だけ移送先に合わせて補正。`2026-09-14-Plans.md` と同じ方式）。以後の closeout も同じ file の先頭へ移す（1 file を rolling で使う）。棄却案: (a) 消す（PR と archive の packet が持つ）— entry には closeout 時の申し送り（follow-up の置き場、closeout で決めた事項、Codex の Final Review の扱い）が含まれ、古い packet の Review Response に無いものがある。34 件を 1 件ずつ照合して消してよいか決める手間が、移す手間より大きく、消すと戻せない。(b) 既存の `2026-09-14-Plans.md` へ追記 — その file は「移送前の記録」の snapshot で構造が異なり（`## 残作業分類`・`## Backlog（未了）` 等）、追記すると snapshot の意味が崩れる。

設計判断 D2（残す件数の規則）: **直近 10 件**（固定の N）。理由: wave 13・14 以降は wave の境界を Wave Registry に置かず（D-097、`docs/Plans.md:9-16` の「次の行動」に置く）、「1 wave」は機械で数えられない。10 件は今の closeout の頻度（2026-09-25〜30 の 6 日で 12 件）で 1 週間弱の視界に当たり、`grep -c` で検査できる。棄却案: 1 wave（境界が無い）、5 件（並走 6 本の wave 14 が同日に閉じると 1 wave 分を切る）。

設計判断 D3（entry の 1 行の形）: 先頭から順に、日付（YYYY-MM-DD）、PR 番号の link（GitHub の PR url）、題名（Risk、必要なら wave・lane）、結果の 1 文、archive の packet への相対 link（R3/R4 で Matrix があれば Matrix の link を続ける）を 1 行に置く。main の SHA・squash の SHA・test 本数・介入回数は書かない（D-038）。残す 10 件も本 lane でこの形に書き換え、元の長文は D1 の archive に移す（つまり 34 件全ての長文が archive に入り、`Plans.md` には 10 件の短い行が残る）。

設計判断 D4（`docs/DEV_WORKFLOW.md:329` の書き換え）: 1 行を「`Plans.md` の `## 直近の完了` の先頭に 1 行（日付・PR link・1 文・archive の packet への link。SHA・test 本数を書かない）を足し、10 件を超えた古い行を `docs/archive/harness-context/2026-09-30-Plans-completed.md` の先頭へ本文を変えずに移す。`## 次の行動`・`## ブロッカー`・`## 製品の未決判断` を現在の状態に同期する」の趣旨に置き換える（英語の行なので英語で書く）。`docs/DEV_WORKFLOW.md:361-363`（Done Definition）と `:32` は既に整合し、変えない。`docs/AGENT_OPERATING_MANUAL.md` §5.3（Plans.md cleanup prompt、`:129-138`）の 1「完了項目を archive へ移す」は整合し、移送先の file 名を足すだけにする。

file と変更目的:

- `docs/Plans.md`: `## 直近の完了` を 10 件の短い行にし、`### Wave Registry` の完了済み wave の行を移して形式の行だけ残す。`:3` の「完了履歴は archive」の link に新 file を足す。
- `docs/archive/harness-context/2026-09-30-Plans-completed.md`（新規）: 冒頭に「移送前の記録。現在の状態は docs/Plans.md」の注記と、以後の closeout が先頭へ足す規則の 1 行。移した entry の相対 link を `../../` 起点に補正する。
- `docs/DEV_WORKFLOW.md:329`: D4。
- `docs/AGENT_OPERATING_MANUAL.md:129-138`（§5.3）: 移送先の file 名を 1 の行に足す。

### S2: `AGENTS.md` の Workspace Access を「Windows の Codex Desktop から動かすとき」に限る（backlog (2)）

現状（確認済み）:

- `AGENTS.md:48-55`（`## Workspace Access`）。`:50` が「WSL の作業 checkout を使用する。Windows からの実行、許可コマンド、起動設定は `.codex/README.md`」、`:52` が repo 内の読書・検索を `.codex/bin/read-safe-file.sh` / `search-safe-files.sh` / `list-safe-files.sh` に寄せる規則、`:53` が repo 外の Skill の読み方、`:54` が Windows から raw `wsl.exe ... bash -lc ...`・`cat` / `sed` / `rg` / `find` を広く allow しない規則。
- wrapper を使う規則の出典は D-049（`docs/decision-log.md:367-375`）: Windows の Codex Desktop の execpolicy が public clone の path の wrapper だけを auto-allow するため。`.codex/README.md:171-204` が Windows からの `wsl.exe ... --exec .codex/bin/*-safe-*.sh` の形と ask/deny の方針を持つ。
- 今の Codex は WSL から `-s danger-full-access --ignore-rules` で起動され rules を読まない（`docs/backlog.md:160` の起動行）。発注書 331 本（2026-09-30 時点の local の数、Coordinator 実測）で wrapper を使うものは 0。owner 2026-09-30: Windows の Codex Desktop はこの repo では多分使わない。
- tracked で wrapper を名指しする箇所（`rg -n 'read-safe-file|search-safe-files|list-safe-files|Workspace Access' --glob '!docs/archive/**'`）: `AGENTS.md:48`・`:52`、`scripts/tests/classify-changes.test.sh:101`（classifier の test の入力、変えない）、`docs/backlog.md:87`（本 lane の出典）、`docs/decision-log.md:370-378`（D-049 / D-050 の履歴、変えない）、`docs/research/audit-2026-07/adjudication.md:44`（履歴、変えない）。`.agents/**`・`.claude/**`・`CLAUDE.md`・`docs/TOOLING_SKILL_COMMANDS.md`・`docs/DEV_SETUP_CHECKLIST.md` に hit は無い。
- `.codex/bin/*-safe-*.sh` は `scripts/ci/classify-changes.sh:55` の実行制御（full）、`scripts/tests/codex-safe-wrappers.test.sh` は `.github/workflows/ci.yml:299-300` の step で走る（baseline: `bash scripts/tests/codex-safe-wrappers.test.sh` exit 0、`PASS: codex-safe-wrappers (T1-T15, HC-D8)`）。

裁定（Coordinator 2026-09-30、そのまま使う）: wrapper の script と test は残す。消すと `ci.yml` と classifier に触れ、CI 制御の変更で R3 になる。`AGENTS.md` の Workspace Access だけを「Windows の Codex Desktop から動かすとき」に限る。

変更の要点: `## Workspace Access` を、(1) WSL の作業 checkout を使い、別 worktree では cwd を確かめる（全 session 共通）、(2) Windows の Codex Desktop から動かすときだけ、`.codex/README.md` の許可コマンドに従い、repo 内の読書・検索を `.codex/bin/*-safe-*.sh` で行い、raw `wsl.exe ... bash -lc ...`・`cat` / `sed` / `rg` / `find` を広く allow せず、PowerShell の相対 path や UNC アクセスに依存しない、(3) repo 外の Skill は指定された `SKILL.md` と必要な参照だけを直接読む（全 session 共通、wrapper に外部 path を渡さない文は (2) へ）、の 3 点に組み替える。`.env*`・鍵・`auth.json` を読まない規則は `## Safety` にあり、変えない。D-049 は「Windows の Codex Desktop の経路」の決定として有効なまま、適用条件を AGENTS の文に書くだけで改訂しない（decision-log の追記は不要。D-101 の Compatibility に 1 文で触れる）。

file と変更目的:

- `AGENTS.md:48-55`: 上の組み替え。
- PR #81（Draft、`chore/repo-path-lowercase`）が触る `.codex/README.md`・`.codex/rules/default.rules`・`CLAUDE.md`・`docs/DEV_SETUP_CHECKLIST.md`・`docs/TOOLING_SKILL_COMMANDS.md`・`docs/project-memory.md`・`docs/plu-export-and-real-csv-verification.md`・`scripts/tests/codex-safe-wrappers.test.sh` は Scope に入れない（README の `/home/kosei/Projects/` の path は #81 が直す）。

### S3: `docs/AGENT_OPERATING_MANUAL.md` §5.4 を今の発注の形に合わせる（backlog (3)）

現状（確認済み）:

- `docs/AGENT_OPERATING_MANUAL.md:140-150`（§5.4「低制約発注書 profile（read-only の Reviewer / Explorer 向け）」）。5 点（goal・scope 境界・read-only 宣言・報告フォーマット・subagent 生成上限）のみで構成し、「過程指示・検証手順の指定を書かない（手順を縛るほど性能が落ちる世代特性への対応…）」「観点 list・必読順・検証 command の指定は書かない」と定める。Contract Audit / Final Review 役への発注では実施項目を scope 境界に列挙する例外がある。
- 今の reviewer 発注の実際の形（Coordinator の雛形、tracked 外、2026-09-27 以降の Plan Review / Final Review broad の発注）は次を具体に書く: 前提（隔離 worktree・SHA の一致で止まる条件・子 agent 禁止・tracked file の編集と git / PR 操作の禁止・実店舗の実値を書かない）、**読むもの**（AGENTS の節、DEV_WORKFLOW の要る節、対象 packet を `## Review Response` の前まで、設計正本の触る節と隣接節、Scope が触る現物）、**読まないもの**（他の reviewer の結果、PR body・comment）、注意（owner 決定の原文は claim として扱う）、**判定の問い**（冒頭 1 行で Ordinary Operation の操作列の成立を 3 値で答える。そのうえで A「正常な条件で目的を達成できるか」・B「危険な結果を出さないか」・C「現物と合っているか」を別々に問う。AC の command を実際に回して表にする。旧前提の語を `rg` で全列挙する）、深度（effort と実読の範囲。「検証の手順・順序は任せる」）、severity の決め方、報告様式（冒頭 1 行・合否と件数・findings 表・AC 実測表・確認した対象と確認できなかった対象・監査した commit と `git status --porcelain`）。
- owner 2026-09-27「Sol は指示の質に結果が寄る」で具体化が方針。`docs/DEV_WORKFLOW.md:266-267`（Review Rules の Plan Review の発注の項、D-090）も「対象 packet の適用版・Goal・`Ordinary Operation`・Contract Probe・対象差分を参照させ」「操作列が目的を達成できるかを 3 値で答え」「『危険な結果を出さないか』と『正常な条件で目的を達成できるか』は別々に問う」と具体化の側にある。
- §5.4 を参照する他の箇所（`rg -n '5\.4|低制約' docs AGENTS.md CLAUDE.md .agents .claude --glob '!docs/archive/**'`。無関係な `§6.5.4`・`§5.4 フォーカス管理`・`65.4`・PDF の `5.4` を除く）: `docs/AGENT_OPERATING_MANUAL.md:154`（§5.6 の冒頭「§5.4 の read-only Reviewer / Explorer 専用の低制約 profile ではなく」）、`docs/backlog.md:87`（本 lane の出典）・`:160`（runbook 候補、「§5.4 / §5.6 は発注書の中身 profile のみ」）、`docs/decision-log.md:430-455`・`:520-521`・`:646`・`:766`（D-056 / D-058 / D-062 / D-081 / D-093 の履歴、変えない）、`docs/research/2026-07-28-codex-sol-week-playbook.md:14`（履歴、変えない）。`docs/templates/subagent-review-packet.md` は §5.4 を参照せず、`## Role`・`## Target`（読ませないもの）・`## Contract Audit`・`## Output` の構成で既に「読むもの・読ませないもの・出力契約」を持ち、変えない。`.claude/agents/reviewer.md` は §5.4 を参照しない。

変更の要点（新しい §5.4）: 見出しは「5.4 read-only の Reviewer / Explorer への発注書」の趣旨に改め、節番号は変えない（`:766` の D-093 が「MANUAL の見出しと節番号は変えず」と定める）。

- 必ず書くこと: (1) goal（何を判定・報告してほしいか）、(2) 対象と読む範囲（packet は `## Review Response` の前まで。設計正本の触る節と隣接節。Scope が触る現物）と**読まないもの**（他の reviewer の結果の置き場、PR body・comment）、(3) read-only 宣言（tracked file の編集・git / PR 操作の禁止。Final Review の review comment 投稿は例外として明記）と subagent 生成上限（既定 0）、(4) 判定の問い（冒頭 1 行で Ordinary Operation の操作列の成立を `成立 / 具体的な反例あり / 外部前提が未確認` で答える。「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に問う。AC の command は実際に回して baseline と比べる）、(5) 報告フォーマット（合否と P1/P2/P3 の件数・findings は file:line と具体的な反例と最小の修正案一案・AC 実測表・確認した対象と確認できなかった対象・全文 dump 禁止）、(6) 停止する条件（対象 SHA / PR head の不一致だけ。途中で許可を求めて止まらない）。
- 書かないこと: 期待する結論や finding（「○○が問題のはず」）、finding の件数の目標、検証の手順と順序（「まず X を確認してから Y」。対象と問いは書くが、順序は reviewer に任せる）、他の reviewer の結果、Writer 向けの手順（§5.6）。
- 残すこと: findings は claims として Coordinator が裁定する（`docs/DEV_WORKFLOW.md` Review Rules）。Contract Audit / Final Review 役への発注で「Contract Audit」の実施項目を対象として列挙する文。
- 消すこと: 「過程指示・検証手順の指定を書かない（手順を縛るほど性能が落ちる世代特性への対応…）」「観点 list・必読順・検証 command の指定は書かない」の文と、その根拠の括弧書き。

file と変更目的:

- `docs/AGENT_OPERATING_MANUAL.md:140-150`（§5.4）: 上の書き換え。`:154`（§5.6 冒頭）の「低制約 profile」の語を新しい見出しに合わせる。
- `docs/backlog.md:160` の「§5.4 / §5.6 は発注書の中身 profile のみで起動機構が未文書化」は、§5.4 の改訂後も真（起動機構は書かない）なので変えない。

### S4: `docs/agent-guidance/profiles/` と `evals/` を消す（backlog (4)）

現状（確認済み）:

- `docs/agent-guidance/profiles/{frontier,balanced,high-throughput}.md`（651 / 545 / 514 bytes）と `evals/{decision-gate-fixture,context-routing-fixture}.md`（3,791 / 3,040 bytes）。D-057（2026-07-28、GPT-5.6 family 向け）で置き、D-082（2026-09-05）が「profile 分離、slot-neutral 方針、人格を tracked に置かない方針は維持」とした。
- repo 内の参照（`rg -n 'profiles|evals' --glob '!docs/archive/**'`。`docs/project-memory.md:40` の「daily report profiles」は無関係）: `docs/agent-guidance/README.md:6`（profile の一覧、「未指定は frontier」）・`:16`（2 つの fixture で比較する）、`docs/backlog.md:66`（MANUAL 縮約の項の「profiles の README への統合」）・`:87`（本 lane の出典）。`docs/agent-guidance/shared.md` は「ここやprofileに別の契約を複製しない」「profileは作業の分解や応答密度の補助であり…」の 2 文、`docs/agent-guidance/model-notes.md` は「共通契約と用途別profileを使う」の 1 文で profile の語を使う（AC-S4-2 の baseline: README 2、shared 2、model-notes 1）。
- script・test・workflow は file を名指ししない（`rg -n 'agent-guidance/(profiles|evals)' scripts .github` は hit 0、exit 1）。`scripts/tests/classify-changes.test.sh:47` は `docs/agent-guidance/shared.md` を classifier の入力にするだけで、profiles・evals を使わない。`docs/agent-guidance/merge-evidence.md` に profiles・evals の語は無い。
- Coordinator の発注書・雛形は profile を指定しない（2026-09-30 時点、local の 331 本）。

設計判断 D5: **消す**（Coordinator の推奨を採る）。理由: 発注書が profile を選ばず、fixture は D-057 の起草時（2026-07-28）の 1 回の比較に使われ、以後の model 更改（D-082、HC-D1/D7）で再実行されていない。README の一覧と shared・model-notes の profile の文は、存在しない選択肢を毎回読ませる。D-057 の部分改訂として D-101 に記録する。棄却案: (a) 残して README の参照だけ消す（誰も参照しない file を tracked に残す理由が無く、classifier の policy docs に数えられ続ける）、(b) `docs/archive/` へ移す（履歴は git と D-057 / D-082 の本文が持つ。archive にも参照が無く、移す価値が無い）、(c) README へ統合する（`docs/backlog.md:66` の案。統合しても選ぶ場面が無い）。

file と変更目的:

- `docs/agent-guidance/profiles/*.md`・`docs/agent-guidance/evals/*.md`: `git rm`（5 file）。
- `docs/agent-guidance/README.md:6`・`:16`: profile の行と fixture の文を消す。「Model updates」の「モデル更新時は…観測された不足にだけ補助を追加する」は残す。
- `docs/agent-guidance/shared.md`: profile に触れる 2 文を、profile の語を使わない形に直す（「ここに別の契約を複製しない」「読書量を減らす場合も…」の趣旨は残す）。
- `docs/agent-guidance/model-notes.md`: 「共通契約と用途別profileを使う」を「共通契約を使う」にする。
- `docs/decision-log.md`: D-101 を追記（下の「D-101 の文案の要点」）。

### D-101 の文案の要点（decision-log への追記は実装の commit）

- 見出し: `## D-101: 毎 session 読む文書を今の運用に合わせて短くする（Plans.md の完了の行、Workspace Access の適用条件、reviewer 発注の形、agent-guidance の profiles・evals の撤去。D-057 の部分改訂）（2026-09-30）`
- Status: accepted（owner 2026-09-30 の起票承認と組み方の判断、#5 の回答。本 packet の plan-approved）。
- Decision: (1) `Plans.md` の `## 直近の完了` は 1 行 + link の entry を直近 10 件、SHA を書かない。超えた行は `docs/archive/harness-context/2026-09-30-Plans-completed.md` へ本文を変えずに移す（S1 の D1〜D4）。(2) `AGENTS.md` の Workspace Access の wrapper・execpolicy の規則は Windows の Codex Desktop から動かすときに限る。wrapper・test・rules は残す（S2）。(3) MANUAL §5.4 は read-only の reviewer への発注で読むもの・読まないもの・判定の問い・確かめる command を具体に書き、期待する結論・finding・検証の順序を書かない（S3）。(4) `docs/agent-guidance/profiles/` と `evals/` を消す（S4）。
- Why: backlog:87 の 4 件の現状（本 packet の Scope の確認結果）。owner 2026-09-27「Sol は指示の質に結果が寄る」。owner 2026-09-30「Windows の Codex Desktop はこの repo では多分使わない」。
- Alternatives: S1 の D1・D2、S4 の D5 の棄却案。
- Replaces (partial): D-057 の「slot-neutral な `frontier` / `balanced` / `high-throughput` task-fit profile へ分離する」と「runtime identity 不明時は `frontier` を使う」の部分（shared contract、人格を tracked に置かない方針、root override の loader は維持）。D-056 の「発注書は低制約 profile（§5.4 = … 5 点のみ）を用い」の部分（read-only の claims-producer として扱う構造は維持）。
- Compatibility: D-049（wrapper の repo root 解決と safe read 境界、execpolicy の mirror）は Windows の Codex Desktop の経路の決定として有効のまま。`scripts/tests/codex-safe-wrappers.test.sh`・`ci.yml:299-300`・classifier は変えない。`docs/templates/subagent-review-packet.md` は変えない。
- Revisit: Windows の Codex Desktop をこの repo で再び使うとき（wrapper の経路を AGENTS の先頭へ戻す）。10 件の上限が 1 wave の並走数を切るとき。

## Non-scope

- wrapper の script（`.codex/bin/*-safe-*.sh`）・test（`scripts/tests/codex-safe-wrappers.test.sh`）・`.github/workflows/ci.yml`・`scripts/ci/classify-changes.sh`・helper・checker の変更（Coordinator の裁定 2026-09-30。CI 制御の変更は R3）。
- PR #81（Draft、`chore/repo-path-lowercase`）が触る file（`.codex/README.md`・`.codex/rules/default.rules`・`CLAUDE.md`・`docs/DEV_SETUP_CHECKLIST.md`・`docs/TOOLING_SKILL_COMMANDS.md`・`docs/project-memory.md`・`docs/plu-export-and-real-csv-verification.md`・`scripts/tests/codex-safe-wrappers.test.sh` ほか）。`.codex/README.md` の `/home/kosei/Projects/` の path は #81 が直す。
- Coordinator の closeout の雛形（`.local/`、tracked 外）の `Plans.md` の entry の書き方: merge 後に Coordinator が直す。
- `docs/backlog.md` の他の項目（`:66` の MANUAL 全面縮約と「profiles の README への統合」の語、`:160` の runbook）。`:87` の完了の反映と `:66` の「profiles の README への統合」の語の削除は本 lane の closeout で行う。
- `docs/Plans.md` の `## 次の行動`・`## ブロッカー`・`## 製品の未決判断`・`## 参照` の内容（`:3` の link の追加だけ S1 に含む）。
- `docs/templates/subagent-review-packet.md`・`.claude/agents/reviewer.md` の改訂（S3 の現状のとおり整合しており、変える理由が無い）。
- D-049 の改訂（適用条件を AGENTS の文に書くだけで、決定は有効のまま）。

## Acceptance Criteria

baseline は main `58d9c051` の worktree で AC の command を逐語で実行した出力（2026-09-30）。実装完了時の期待値と区別する。

- AC-S1-1（entry の上限）: `sed -n '/^## 直近の完了/,/^### Wave Registry/p' docs/Plans.md | grep -c '^- '` → baseline `34`、完了時 `10` 以下で `1` 以上。
- AC-S1-2（SHA の転記なし）: `sed -n '/^## 直近の完了/,/^## ブロッカー/p' docs/Plans.md | grep -cE '`[0-9a-f]{8}`'` → baseline `32`、完了時 `0`（Wave Registry の完了済み wave の行も移すため）。
- AC-S1-3（file size、参考値）: `wc -c docs/Plans.md` → baseline `57760 docs/Plans.md`、完了時の値は `未実測`（実装の PR body に実測を書く。数の目標は AC-S1-1 が持つ）。
- AC-S1-4（closeout の規則）: `rg -n 'Update `Plans.md` so it reflects current live state' docs/DEV_WORKFLOW.md` → baseline `329:- Update ...`（1 行）、完了時 `0` 行。`rg -n '2026-09-30-Plans-completed.md' docs/DEV_WORKFLOW.md docs/AGENT_OPERATING_MANUAL.md docs/Plans.md` → baseline `0` 行、完了時 各 file に `1` 行以上。
- AC-S1-5（非破壊の移送）: `test -e docs/archive/harness-context/2026-09-30-Plans-completed.md; echo $?` → baseline `1`、完了時 `0`。`grep -c '^- \*\*' docs/archive/harness-context/2026-09-30-Plans-completed.md` → 完了時 `34`（刈った 24 件 + 短い行に書き換えた 10 件の元の長文）。移した entry の PR link と archive の packet の link が `bash scripts/doc-consistency-check.sh` の link 実在検査を通る。
- AC-S2-1（適用条件の明示）: `sed -n '/^## Workspace Access/,/^## Memory Model/p' AGENTS.md | rg -c 'Codex Desktop'` → baseline `0`、完了時 `1` 以上。同じ範囲で `rg -c 'read-safe-file'` → baseline `1`、完了時 `1`（wrapper の経路は Windows の Codex Desktop の条件の下に残る）。
- AC-S2-2（wrapper・CI 制御に触らない）: `git diff --stat origin/main -- .codex scripts/tests/codex-safe-wrappers.test.sh .github/workflows/ci.yml scripts/ci/classify-changes.sh | wc -l` → baseline `0`、完了時 `0`。`bash scripts/tests/codex-safe-wrappers.test.sh` → baseline exit 0（`PASS: codex-safe-wrappers (T1-T15, HC-D8)`）、完了時 exit 0。
- AC-S2-3（Safety 以降は不変）: `diff <(git show origin/main:AGENTS.md | sed -n '/^## Safety/,$p') <(sed -n '/^## Safety/,$p' AGENTS.md); echo $?` → baseline `0`、完了時 `0`（`## Safety` と `## npm 供給網ガード` に変更行が無い）。
- AC-S3-1（逆向きの文の削除）: `rg -c '観点 list・必読順・検証 command の指定は書かない|手順を縛るほど性能が落ちる世代特性' docs/AGENT_OPERATING_MANUAL.md` → baseline `2`、完了時 `0`（rg は hit 0 で exit 1 になるので `|| echo 0`）。
- AC-S3-2（具体に書く側の要点）: `sed -n '/^### 5.4 /,/^### 5.6 /p' docs/AGENT_OPERATING_MANUAL.md | rg -c '読むもの|読まないもの|判定の問い|確かめる command'` → baseline `0`、完了時 `2` 以上。同じ範囲で `rg -c 'read-only|subagent|報告フォーマット'` → 完了時 `1` 以上（残すべき 3 点が消えていない）。
- AC-S3-3（参照の整合）: `rg -n '低制約' docs/AGENT_OPERATING_MANUAL.md` → baseline `2` 行（`:140`・`:154`）、完了時 `0` 行（見出しと §5.6 の参照を新しい語に合わせる）。`rg -n '5\.4' docs/AGENT_OPERATING_MANUAL.md` → 完了時 `:154` 相当の参照が新しい見出しへの参照として残る（切れた節番号を作らない）。
- AC-S4-1（削除）: `test ! -e docs/agent-guidance/profiles && test ! -e docs/agent-guidance/evals; echo $?` → baseline `1`、完了時 `0`。
- AC-S4-2（切れた参照なし）: `rg -c 'profile|evals/' docs/agent-guidance/README.md docs/agent-guidance/shared.md docs/agent-guidance/model-notes.md` → baseline `README.md:2` / `shared.md:2` / `model-notes.md:1`、完了時 hit 0（rg exit 1）。
- AC-S4-3（script・workflow の名指しなし）: `rg -n 'agent-guidance/(profiles|evals)' scripts .github docs --glob '!docs/archive/**' --glob '!docs/backlog.md' --glob '!docs/plans/**'` → baseline hit 0（exit 1）、完了時 hit 0（`docs/decision-log.md` の D-101 は path でなく語で書く）。
- AC-S4-4（決定の記録）: `rg -c '^## D-101' docs/decision-log.md` → baseline `0`、完了時 `1`。
- AC-C-1（docs gate）: `bash scripts/doc-consistency-check.sh` → 完了時 exit 0。active packet がある間は `bash scripts/doc-consistency-check.sh --target plan` も exit 0。
- AC-C-2（PK5）: `bash scripts/check-workflow-git.sh` → 完了時 exit 0。
- AC-C-3（classifier の分類、参考）: 実装の PR の hosted CI で docs job が走り、`Merge gate` が成功する（Ready 後の run）。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: `AGENTS.md` `## Workspace Access`・`## Working Rules`・`## Safety`、`docs/DEV_WORKFLOW.md` `## Artifact Map`・`## Workflow State`（Evidence Ownership）・`## Review Rules`・`## Post-Merge Closeout`・`## Done Definition`、`docs/AGENT_OPERATING_MANUAL.md` `## 座組`・§5.3・§5.4・§5.6、`docs/agent-guidance/README.md`・`shared.md`・`model-notes.md`、`docs/decision-log.md` D-038・D-049・D-056・D-057・D-082・D-090・D-093・D-097・D-098。
- 必要な設計成果物: 設計正本 = updated in this PR（上の file が本 lane の変更対象そのもの。source doc の別の更新は無い）。decision-log = updated in this PR（D-101）。ADR = not needed（workflow 文書の改訂で、製品の設計判断でない）。
- plan にしかない durable な判断の昇格先: S1 の D1〜D4 → `docs/DEV_WORKFLOW.md` Post-Merge Closeout と D-101。S2 の適用条件 → `AGENTS.md` と D-101 の Compatibility。S3 の要点 → MANUAL §5.4。S4 の D5 → D-101（D-057 の部分改訂）。
- 前提・制約と、延期した design gap の follow-up: Windows の Codex Desktop をこの repo で使わない（owner 2026-09-30「多分」）は前提で、戻す経路（wrapper・test・rules）は残す。closeout の雛形（`.local/`）の同期は merge 後の Coordinator。`docs/backlog.md:66` の MANUAL 縮約は別 lane。
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: 「`Plans.md` に SHA を書かない」は D-038 の既存規則で、例外は無い。「10 件以下」は closeout の手順で守り、機械の検査は AC-S1-1 の command（checker には足さない。足すなら別 lane で PK を変える）。
- 判定（ready / not ready）と理由: ready。設計正本が workflow 文書自身で、変更の要点は本 packet の Scope に 1 通りに書け、Writer が正本と本 packet だけで実装できる。spec-check → plan-draft の skip はこの判定による。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| source / workflow doc 新設・改名・削除 | S1: `docs/archive/harness-context/2026-09-30-Plans-completed.md` の新設 → `docs/Plans.md:3` の「完了履歴は archive」の link に足す（`docs/PROJECT_HANDOFF.md` は `2026-09-14-Plans.md` を参照せず〈`rg -n 'harness-context' docs/PROJECT_HANDOFF.md` は `2026-09-14-PROJECT_HANDOFF.md` の 1 hit だけ〉、更新不要）。S4: `docs/agent-guidance/profiles/*`・`evals/*` の削除 → `docs/agent-guidance/README.md` の一覧から外す（AC-S4-2）。link 実在は `bash scripts/doc-consistency-check.sh` で確かめる |

Tauri command・function-design doc・REQ / coverage・route・operator 画面の行は該当なし（製品の code・設計書・生成物に触れない）。

## Impact Review Lenses

not applicable。現地調査・実機確認・外部 tool・POS 連携・CSV/TSV/report の形式・operator の操作の発見・設計前提の変更のいずれからも出発しない、workflow 文書の改訂と削除。各 lens に当たる finding は無い。

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 不該当（製品の境界に触れない） | なし |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 不該当（事実は Scope の file:line と AC の baseline、判断は D-101 に置く） | なし |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 不該当（runtime に触れない） | なし |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 不該当（operator の操作に触れない） | なし |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 不該当 | なし |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 不該当（店のデータを扱わない） | なし |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 不該当 | なし |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 不該当（L3 なし。AC は command で確かめる） | なし |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 不該当（新設の環境依存なし） | なし |

## Boundary / Wire Contract

not applicable。JSON API・browser state・CSV・config・manifest・cache schema・Tauri command DTO・生成 bindings・report 出力・DB 互換のいずれにも触れない。

- producer: なし
- consumer: なし
- wire type: なし
- internal type: なし
- precision/range: なし
- round-trip path: なし
- invalid input: なし
- compatibility: なし

## Test Plan

R2 のため Test Design Matrix は作らない: 変更は文書の書き換えと削除で、mutation を注入して red を確かめる対象の code・test が無く、AC の command（削除検査と存在検査）が検出力を持つ。Human Gate に manual を含まない。

- targeted tests: AC-S1-1〜S4-4 の command を実装後に逐語で実行し、baseline と完了時の値を PR body に表で書く。`bash scripts/doc-consistency-check.sh`（full。link 実在・PK1〜PK4・pointer 行）と `--target plan`。
- negative tests: AC-S3-1（旧い文の削除検査。現物の旧表現「観点 list・必読順・検証 command の指定は書かない」で一致し、完了時に不一致）、AC-S1-2（SHA の削除検査）、AC-S4-2（切れた参照の検査）。
- compatibility checks: AC-S2-2（wrapper・test・`ci.yml`・classifier に差分が無い、wrapper test PASS）、AC-S2-3（`## Safety` に変更行が無い）、AC-S3-3（§5.4 への参照が切れない）、`bash scripts/check-workflow-git.sh`（PK5）。
- data safety checks: 店のデータ・secret に触れない。移送する entry は既に公開 repository にある文で、新しい情報を足さない。
- main wiring/integration checks: 実装の PR の hosted CI（docs job、Ready 後の `Merge gate`）。

## Review Focus

- Ordinary Operation の 3 行が、変更後の文書だけを読んで 1 通りに実行できるか（特に closeout の行: 移送先・上限・行の形）。
- S1 の D1（非破壊の移送）と D2（10 件）が Goal Invariant の「短くなる」と「失敗定義」の「辿れなくなる」を同時に満たすか。棄却案の理由が現物と合うか。
- S2 の組み替えで、`## Safety` の規則と D-049 の Windows の経路が失われていないか。「Windows の Codex Desktop から動かすとき」の条件が、WSL からの Codex（`--ignore-rules`）と Claude Code の通常の session を縛らない書き方か。
- S3 の新しい §5.4 が、`docs/DEV_WORKFLOW.md:266-267`（Review Rules の Plan Review の発注の項）と `docs/templates/subagent-review-packet.md` と矛盾しないか。「書かないこと」に結論の誘導・期待する finding・検証の順序が含まれ、「必ず書くこと」に read-only 宣言・報告フォーマット・subagent 生成上限が残っているか。
- S4 の削除で切れる参照が AC-S4-2・S4-3 の検索式で全列挙されているか（`docs/decision-log.md` の D-057 / D-082 の本文は履歴として残す）。
- D-101 の要点が D-057・D-056・D-049 の何を置き換え、何を残すかを正しく書いているか。
- AC の baseline が現物と合うか（command を実際に回す）。R2・Final Review Minimum 2・Human Gate `ready,merge` の前提。

## Contract Ledger

R2 のため書かない（template の「ここから Data Safety までが R3/R4 の部分」）。

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| N/A | R2（Contract Ledger は R3/R4 の必須節） | — | — | 非対象 |

## Contract Probe

N/A。外部 library・OS・hardware の未確認の前提に依存しない（文書の改訂と削除）。

## Data Safety

R2 のため必須でない。店のデータ・secret・`.env*`・`auth.json` に触れず、移送する entry は既に tracked の文。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。
