# Plan Packet: 旧証跡方式（legacy）と Execution Mode の撤去（harness 改訂 PR1、R3）

2026-09-24 起草。出典は harness 監査（2026-09-24、fresh Opus 5.5、local-only の報告。要点は本 packet に書き下した）の §7 PR1 行と、owner 決定 2026-09-23（Opus 5.5 を主軸とする座組・Execution Mode は廃止の方向）・2026-09-24（規則は環境が変わるたびに改める。安全境界は維持する）。harness 改訂で最初に merge gate を変える PR。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Evidence Mode: github
- Phase: plan-gate
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（worktree `agent/harness-overhaul`、effort medium）
- Plan Reviewer: Opus 5.5（fork でない fresh subagent、Writer と別 context。Codex は rate limit 中のため Opus のみ。Plan Gate 前に Codex が戻れば Astra を加える）
- Final Reviewer: Opus 5.5（fresh subagent）+ Codex（互いに独立、Writer・Plan Reviewer とも別 context、Double Audit。Final Review の通過は Codex の復帰を待つ）
- Final Review Minimum: 2
- Human Gate: ready,merge

manual なし: 製品の runtime・画面・配布物は変わらない。

本 packet の `Evidence Mode` と `Execution Mode` の 2 行は、本 PR 自身を現行 main（`3148347b`）の checker と helper で検査するために置く（本 PR が撤去する field だが、本 PR の検査は変更前の版で行う。下記「helper の自己検査の穴」）。`fable-window` は並走 4 lane と同じ選び方（Fable 5.1 は難所の相談役として利用可能）で、本 lane の役割には Fable を割り当てない。`Review Response` の `Findings Freeze` 行も同じ理由で置く。

座組は owner 決定 2026-09-23（Opus = Opus 5.5 を Coordinator / Writer / review へ全面解禁、Sonnet 5 / Opus 5 は座組から退役、Codex 停止中は Final Review だけ待つ、第三者性の要る review は fork でない fresh subagent）に従う。`docs/AGENT_OPERATING_MANUAL.md` §3 の高自律・低制約適性 slot の項（D-056、Opus は read-only の Reviewer / Explorer 専任）と §3.4 の表とは衝突する。owner 決定 2026-09-24（規則は環境が変わるたびに改める）により owner の現行決定を優先し、D-056 の改訂は harness 改訂 PR2（座組と役割）へ積む。Plan Reviewer と Writer は同じ model の別 context で、`docs/DEV_WORKFLOW.md` Review Rules の vendor 条項（D-062）は Writer が Codex の packet が対象のため literal には掛からない。別 vendor の目は Final Review の Codex が担う。

遷移記録（append-only）:

- kickoff → spec-check → plan-draft（起草、未 commit）: Risk R3（下記 Risk）。改訂対象は workflow 正本と、それを強制する script / test そのものであり、設計の正本は本 PR が書き換える workflow 文書自身。規則の内容は owner 決定と監査で決まっており、owner の設計判断を要する未決の論点は無い（spec-check → plan-draft の唯一の skip。Design Readiness 参照）。
- plan-draft → plan-gate（2026-09-24、Coordinator）: packet と Matrix を plan-first commit で確定し、`docs/Plans.md` の wave 13 に登録。fresh Opus の Plan Review へ（Codex は rate limit 中）。

## Owner Effort Budget

- 介入回数上限: 3（見込み: Codex Final Review の relay 1、Ready 1、merge 1）
- 実働時間上限: 15分（文書と script の変更で、owner の作業は Codex relay と Ready / merge の判断に限られる見込み）
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
`docs/project-profile.md` High-risk Changes の「Test/workflow gates that affect what may be merged」に当たる。本変更は docs job（`scripts/doc-consistency-check.sh` PK4）、PK5 step と pre-push / local-ci（`scripts/check-workflow-git.sh`）、helper（`scripts/pr-gate.py` の packet 解釈・承認時 snapshot の比較対象・Double Audit の条件）の合否を変える。file の種類ではなく gate への影響で R3 とする。`scripts/ci/classify-changes.sh` は `scripts/**` を実行制御 = full、`docs/DEV_WORKFLOW.md` 等を policy docs にするため workflow=true になり、helper は Final Review Minimum 2 を要求する。R4 には当たらない（data・DB・破壊的 git 操作を含まず、変更は revert で戻せる）。

## Goal

Goal Invariant:

### 最小完了条件

- 本 PR の merge 後、Coordinator は template どおり `Evidence Mode` 行・`Execution Mode` 行なしで R2+ packet を起票でき、checker（PK4）・PK5 検査・helper がその packet を受理する。Plan Gate 後の Phase / Plan Commit の更新は通常の commit で行え、commit subject の規約や件数上限（STATECAP）で止まらない。
- 起票・Plan Review 中の並走 4 lane（docs 復元、㉗ ADR 修正、㉘ 危険操作の停止、EJ parser core）の packet は、書き換えずに本 PR の前後どちらの checker / helper でも合格し続ける。
- 撤去しないもの（PK5 の Plan Commit 保護、Plan Commit `pending` literal、Amendments の prefix 保存、shallow 履歴の拒否、Final Review Minimum 1/2 と R4・workflow gate の 2、Human Gate、承認時 snapshot との Risk / Minimum / Human Gate 比較、Plans 登録、active packet 1 つ、base 側 classifier、直接 UI merge 禁止）は、変更前に拒否していた入力を変更後も拒否する。
- workflow 正本（DEV_WORKFLOW / template / ci.md / merge-evidence）に legacy 方式と Execution Mode を前提とする規則文が残らず、文書と強制が食い違わない。

### 失敗定義

- 並走 lane の packet が本 PR の merge 前後どちらかで checker / helper に拒否される、または書き換えを要求される。
- 撤去対象以外の gate が弱まる（上記「撤去しないもの」のどれかが、変更前に拒否した入力を受理する）。
- 本 PR が自分を、変更後の helper / checker だけで検査して merge される。
- 文書が撤去済みの仕組み（state-only commit、STATECAP、三点一致、Rebase Map、Execution Mode による review 数の分岐）を手順として指示し続ける。

### 非目的

- 座組・役割・AGENT_OPERATING_MANUAL の書き直し、D-056 / D-084 / D-087 等の改訂、decision-log の追記（PR2）。
- 入口・重複の整理: AGENTS / CLAUDE / `.claude/**` / `.agents/**` Skill の Evidence Mode 定型文、PR template、code_review、review 系 template、project-profile の縮約（PR3）。
- Plan Packet template 全体の統合、Owner Effort Budget・Contract Ledger・WER・PK1 / PK3 の変更（PR4）。
- classifier の穴（`.claude/agents/**`）と helper の自己検査の穴の恒久対策（PR5）。本 PR は自分の検査手順だけで回避する。
- Phase enum の簡素化（kickoff〜plan-gate を 1 値にする案）。8 値のまま残す。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、発注 → 停止と訂正 → review → owner 判断の通常列を、本 PR の merge 後の gate で書く。本 packet 自身は変更前の gate で検査を受ける（下記「helper の自己検査の穴」）。この表は本 PR の review の省略や合否に先取りして使わない。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 本 PR merge 後の main から branch を切る | Coordinator が新 template で R2+ packet を書く（`Evidence Mode` / `Execution Mode` 行なし、`Plan Commit: pending`）。`bash scripts/doc-consistency-check.sh --target plan` | PK4 が 10 field・Phase 8 値・Risk 一致だけを見て OK を返す | Plans.md「次の行動」への link を足し、plan-first commit を push | なし |
| plan-gate、Plan Reviewer が P1/P2 = 0 | Coordinator が Phase を plan-approved / implementing、Plan Commit を確定 SHA に更新する commit を作る（subject は通常の Conventional Commits） | pre-push / local-ci の `check-workflow-git.sh` が PK5 だけを検査して通る（STATECAP の件数・subject 検査なし） | Writer へ発注 | なし |
| 実装済み、Draft PR | `python3 scripts/pr-gate.py status/capture/record` で broad audit を Minimum 本数（workflow=true / R4 なら 2）記録し、修正後は closure を記録 | helper が review / manual / R4 と CI を判定し、Execution Mode の値で本数が変わらない | owner の Ready 指示 | 本 PR の merge より前に作った capture file は `requirements` の形が変わるため `fresh capture required` で拒否される（作り直す。Contract Probe P3） |
| Draft、review 通過 | owner Ready → helper `ready` → hosted CI → owner merge 指示 → helper `merge` | squash merge、closeout PR へ | closeout で packet を archive | なし |
| Ready 後に修正が要る | Draft へ戻して push、fresh capture → closure | 旧 green と旧 record を流用しない | closure 通過 | なし |
| 本 PR の merge 前に起票した lane（旧 template の行を持つ） | packet を書き換えずに進める。main 同期は origin/main の単段 merge（Rebase Map なし） | 新 checker / helper は旧 3 行（`Evidence Mode: github`、`Execution Mode`、`Findings Freeze`）を受理し、値を gate に使わない | 通常どおり | 新 template の packet を本 PR 前の main から切った branch で使うと、旧 checker / helper が拒否する（AC4） |
| GitHub Actions が使えない | merge を止め、許可済みの local 作業と証跡を保存する | 旧「not-required の閉じた 2 経路」は無い | Actions 復旧後に通常経路 | なし |

## Scope

本 packet と Matrix の `D1`〜`D9` は子 ID `SPEC-WF-HARNESS1-D1`〜`SPEC-WF-HARNESS1-D9` の略記（`docs/decision-log.md` の D-n とは別）。行番号は main `3148347b` のもの。

- S1 `scripts/doc-consistency-check.sh` PK4（`:1268-1385`）（D1 / D2 / D4）:
  - `WORKFLOW_STATE_EXEC_MODES`（`:1271`）、`WORKFLOW_STATE_HOSTED_CI_REQUIREMENTS`（`:1272`）、Execution Mode の必須・enum 検査（`:1370-1376`）、R3+ の `Findings Freeze` 行要求（`:1378-1384`）、legacy 分岐（`:1331-1333`、`:1338-1343`）を削除する。
  - `Evidence Mode`（`:1297-1301`）は任意にする。行があれば値は `github` だけを受理し、`legacy` と他の値は ERROR（「Evidence Mode は廃止。書くなら github」）。
  - 必須 field を Phase / Risk / Plan Commit / Amendments / Coordinator / Writer / Plan Reviewer / Final Reviewer / Final Review Minimum / Human Gate の 10 個に固定し、Final Review Minimum と Human Gate の検査（`:1316-1325`）を無条件に適用する。legacy field 3 種（Reviewed Content HEAD / Final Exact-HEAD Evidence / Hosted CI Requirement）の行は従来どおり ERROR（`:1326-1330` を無条件化）。
  - `WORKFLOW_STATE_PHASES`（`:1270`）を 8 値（kickoff spec-check design plan-draft plan-gate plan-approved implementing archive）に、`WORKFLOW_STATE_PLAN_APPROVED_PHASES`（`:1273`）を plan-approved implementing にし、github 限定の Phase 検査（`:1349-1351`）を enum 検査へ統合する。error 文の「13 phase enum」を「Phase enum」にする。
  - Plans.md「次の行動」link 検査（`:1387-1413`）、archive skip（`:1283`）、R1 以下 skip（`:1288`）、Risk 一致（`:1364-1368`）、Plan Commit pending 検査（`:1356-1361`）は変えない。
- S2 `scripts/check-workflow-git.sh`（D1 / D3）:
  - 削除: `workflow_phase_index`（`:40-50`）、`resolve_rebase_chain`（`:55-81`）、`check_plan_commit_ancestry` 内の Rebase Map 処理（`:94-98`、`:113`、`:130`、`:138-196`、`:209-211`、`:223-230`。実効 SHA = 記録 SHA）、`resolve_main_merge_base` と `check_state_only_commit_cap`（`:262-356`）、`main` の `has_legacy` と STATECAP 呼出し（`:359`、`:381`、`:393-395`）。
  - `main` の marker 検査（`:378-389`）を「marker は任意、あれば github のみ。Phase は marker の有無に関わらず 8 値のどれか」に変える。
  - 残す: PK5（ancestry、Plan Commit 書換え検出 `:232-244`、Amendments の prefix 保存 `:245-258`、Amendments の descendant / ancestor）、pending skip、full history 要求（`:360-373`）。header comment（`:1-29`）と成功表示（`:398`）から STATECAP / Rebase Map を外す。`WORKFLOW_STATE_PHASES` は S1 と同じ 8 値の定義として残す（test 18 の parity 用）。
- S3 `scripts/pr-gate.py`（D1 / D2 / D5）: `FIELDS`（`:21`）から `Evidence Mode` と `Execution Mode` を外す。`parse_packet` は `Evidence Mode` 行があれば `github` だけ受理（`:161`）、legacy field の拒否（`:162-163`）は維持、Execution Mode の enum（`:169`）と戻り値の `mode`（`:184`、`:247`）を削除。承認時 snapshot の比較対象（`:240`）を Risk / Final Review Minimum / Human Gate にする。Double Audit 条件（`:250-251`）を `risk == R4 or workflow == true` にする（codex-only R3 UI 分岐の削除）。他の関数は変えない。
- S4 test（D1〜D5 / D7 / D8。詳細は Test Design Matrix）:
  - `scripts/tests/doc-consistency-plan-packet.test.sh`: fixture の既定（`write_packet` `:351-466`、`reset_packet_defaults` `:311-336`）を新 template の形（marker・Execution Mode なし、10 field、`Human Gate: ready,merge`、`Final Review Minimum: 2`）にする。case 3 / 5 / 6 / 14 / 18 / 21 / 22 / 27 と末尾の merge evidence schema block（`:1073-1091`）を置き換え、新規 case を足す。
  - `scripts/tests/workflow-git-checks.test.sh`: fixture の `write_packet`（`:54-69`）に Phase 行を足し、marker を外す。Rebase Map（`:241-507`）と STATECAP / backtrack（`:557-707`）の case を削除し、「無視されること」を示す新規 case に置き換える。PK5 と shallow の case は残す。
  - `scripts/tests/pr-gate.test.py`: `REQ`（`:20`）から `mode` を外す。`test_packet_schema`（`:81-88`）、`configure_packet`（`:257`）、`test_unamended_gate_condition_changes_are_rejected`（`:279-291`）、`test_codex_ui_minimum_one_rejected`（`:389-393`）を改め、新規 test を足す。
  - `scripts/tests/reading-order-drift.test.sh`（`:157-165`）: 直接 UI merge / 残存リスクの要求先を `AGENTS.md` と `docs/DEV_WORKFLOW.md` の 2 file にし、Skill 5 本への `Evidence Mode` 要求を削除する。要求を関数にして、片方を消した写しで失敗する mutation を 1 つ足す。
  - `scripts/tests/ci-workflow.test.sh`: `validate_public_actions_doc_contract`（`:184-209`）から Actions 利用不能時の 2 経路と `not-required` の 3 行（`:205-207`）を外し、「Actions 利用不能なら merge を停止する」の 1 文を要求する。対応する M3 mutation 3 件（`:302-319`）を、この 1 文を消した mutation 1 件に置き換える。
  - `scripts/tests/codex-safe-wrappers.test.sh`: fixture（`:91`）と default 一覧（`:137`）から `.codex/execpolicy.rules` を外し、T11（`:335-342`）を「`.codex/rules/default.rules` に history-view token が無い、`.codex/execpolicy.rules` が tracked でない」に改める。
  - `scripts/tests/pre-push.test.sh:147`、`scripts/tests/local-ci.test.sh:106` の fail 文言の `PK5/STATECAP` を `PK5` にする。
- S5 `scripts/pre-push.sh:183-187`、`scripts/local-ci.sh:195-196` の comment と表示から STATECAP / state-only を外す（挙動は不変）。`local-ci.sh:90-93` の `MERGE_EVIDENCE_VALID` log 項目は残す。
- S6 `docs/DEV_WORKFLOW.md`（D6。Artifact Map `:27-38` には触れない = PR0 の hunk）:
  - `## Workflow State`（`:73-144`）を github 方式だけの記述に書き直す（Spec Contract D6 の要素）。見出し `## Workflow State` と、PK4 が参照する field 名、fail-closed 規則、packet 選択規則、Plan Commit ancestry（PK5）、Evidence Ownership は残す。
  - Wave Operation（`:260`、`:268`、`:269`）と Stacked train（`:277-279`、`:282`）の legacy 部分: Rebase Map と rebase 後の L1 再実行、STATECAP の継承を削除し、「main との同期は origin/main の単段 merge」「Ready 化は merge train 先頭の lane だけ」にする。見出し `### Stacked train` と単段 merge の規則文は残す（並走 lane の packet が参照）。
  - Verification Gates（`:338` の legacy 文、`:362` の legacy 文）、Draft PR Checkpoint（`:424`、`:428`、`:430`。`:425` の Human Gate 欄は残す）、Post-Merge Closeout（`:445`、`:448-450`、`:470` の MG-D11 の句）から legacy と Actions 例外を外す。
  - `:312`（Execution Mode への言及）と `:381`（D-062 の vendor 条項の codex-only への言及）は PR2 が Review Rules / 座組と一緒に書き換えるため触れない（Non-scope）。
- S7 `docs/templates/plan-packet.md` `## Workflow State`（`:3-22`）: `Evidence Mode` と `Execution Mode` の行、legacy / bootstrap への言及（`:7`）、codex-only R3 UI の文（`:22`）を削除する。他の節は触れない（PR4）。`docs/templates/test-design-matrix.md` の legacy 行（`:33-38`、`:107-108`）を削除し、`:33` を github の観点だけにする。
- S8 `docs/ci.md`（D6）: `## 移行状態`（`:5-9`）を現行契約 2 文（GitHub は PR / CI、helper は review / manual / R4、直接 UI merge 禁止と残存リスク）にする。Verification Ladder の legacy 文（`:16`、`:19`）、Public Standard-Runner Policy の legacy 例外（`:49-58`）を「Actions 利用不能なら merge を停止し、許可済みの local 作業と証跡を保存する」の 1 文に、Local Commands（`:72`）、Pre-push Contract（`:80`）、Stale Green Prevention（`:90`）の legacy 文を外す。`CI-PUBLIC-D1:` / `CI-TRIGGER-D1:` と表 3 行は残す（ci-workflow test が要求）。
- S9 `docs/agent-guidance/merge-evidence.md`（D6）: 移行・rollout・有効化の記録（`## 移行・運用・復旧` の手順 1〜7 `:154-160`、`## 測定と実装時の判断基準` `:166-170`、`## 公式根拠とprobe` `:172-184`、`## 実行手順と有効化payload` の有効化 payload 部分 `:202-227`）を新設 `docs/archive/2026-09-14-merge-evidence-rollout.md` へ移す（本文は変えずに移送し、冒頭に出典と移送日を 2 行足す）。merge-evidence 側は現行契約を残し、Status（`:3`）、MG-D10 / MG-D11 の行（`:27-28`。ID は残し「完了・履歴は archive」と書く）、`:83`、`:85`（Execution Mode を比較対象から外す）、`:87`、`:138` の legacy 文を直す。`:162`、`:164`（closeout と Actions 停止時）と helper の使用例（`:189-200`）は残す。
- S10 最小限の同期（本 PR の撤去と字面が矛盾する行だけ）: `docs/AGENT_OPERATING_MANUAL.md` §3.2 の冒頭（`:56`）に「Execution Mode 欄は任意で、checker / helper は要求も評価もしない」を 1 文足し、`:61` の「R3 の UI 契約変更は Opus 1 run を足す」を削除、`:236`（legacy 発注書の state-only subject）を削除、`:268` の「Evidence Modeごとの」を削除。`docs/project-profile.md:160`（phase1 probe の行）を削除、`:163` の「(legacy merge evidence)」を外す、`:237` の legacy の句を削除。他の行は PR2 / PR3 が扱う。
- S11 削除と重複解消（D8）: `scripts/check-phase1-probe-removed.sh` を削除（呼出し元なし。参照は S10 の project-profile `:160` だけ）。`.codex/execpolicy.rules` を削除し、`.codex/rules/default.rules` を唯一の policy とする。`.codex/bin/search-safe-files.sh:53,58`、`.codex/bin/read-safe-file.sh:73`、`.codex/bin/list-safe-files.sh:50` の allowlist から `.codex/execpolicy.rules` を外し、`.codex/README.md:10,18,22` を直す（検証は `codex execpolicy check --rules .codex/rules/default.rules`、同 README `:234` と同じ）。
- S12 本 packet・Matrix・`docs/Plans.md`: 計画・現在地・次の行動の同期（Coordinator。Writer は編集しない）。

対象を使う側の確認（起票時、main `3148347b`）: PK4 の field を読むのは `doc-consistency-check.sh`・`check-workflow-git.sh`・`pr-gate.py` の 3 script と上記 test だけ（`rg -n 'Execution Mode|Evidence Mode' scripts`）。`check-phase1-probe-removed.sh` の参照は `docs/project-profile.md:160` だけ（`rg -n 'phase1-probe' --glob '!docs/archive/**' .`）。`.codex/execpolicy.rules` の参照は wrapper 3 本・wrapper test・`.codex/README.md`・`docs/decision-log.md:368-371`（追記型、非変更）。hosted CI は `.github/workflows/ci.yml:294` で PR head を checkout し `check-workflow-git.sh` を `WORKFLOW_BASE_SHA` 付きで実行する（`:309-312`、変更しない）。

## Non-scope

- `docs/decision-log.md`: 追記しない。本 PR が置き換える D-034（Execution Mode 3 値）/ D-035（state-only・三点一致）/ D-038(8)（STATECAP）/ D-046-3（backtrack）/ D-049（execpolicy の 2 mirror 維持）/ D-055・D-074（Rebase Map）/ D-084（codex-only の review 数）/ D-085 の MG-D10・MG-D11（移行）の該当部分は、harness 改訂 PR2 の D-091（仮）がまとめて superseded として列挙する。本 packet の Design Sources に対応を残す。
- Evidence Mode の定型文を持つ入口文書（`AGENTS.md:14`、`CLAUDE.md:11`、`.claude/rules/*`、`.claude/commands/*`、`.agents/skills/*/SKILL.md` 6 本、`docs/code_review.md:36`、`docs/templates/subagent-review-packet.md:26`、`docs/templates/pr-review-prompt.md:40`、`docs/agent-guidance/{README,shared}.md`、`docs/PROJECT_HANDOFF.md:17`、`.github/pull_request_template.md:18,32`）: PR3。いずれも「legacy の場合は…」の条件文で、本 PR 後は legacy packet が作れない（checker が `Evidence Mode: legacy` を拒否する）ため誤った操作へ導かない。例外は `.agents/skills/inventory-code-review/SKILL.md:60` の「exact-HEAD evidence」の照合で、無条件の指示として残る。PR3 まで reviewer は `docs/DEV_WORKFLOW.md` を正とする（Review Focus で確認）。
- `docs/AGENT_OPERATING_MANUAL.md` の S10 以外（§3.1 / §3.2 の各 mode の定義、§3.3、§3.5、§5.5 相談窓口役）、`docs/DEV_WORKFLOW.md:312,381`: PR2。
- PR0（死んだ文書の削除、別 worktree `agent/harness-pr0-dead-docs`）の file: `.claude/memory/*`、`docs/ai-workflow/*`、`.agents/skills/{implementation,setup-project-profile,workflow-effectiveness-review}`、`docs/templates/{project-profile,workflow-effectiveness-review}.md`、`docs/TOOLING_SKILL_COMMANDS.md`、`docs/agent-guidance/context-efficiency.md`、`.codex/status-bar/README.md`、`docs/DEV_WORKFLOW.md` Artifact Map（`:27-38`）。`docs/DEV_WORKFLOW.md` は両 PR が編集するが hunk は 30 行以上離れる。後に merge する側が origin/main を 1 回 merge する。
- `.github/**`、`scripts/ci/**`、`src/**`、`src-tauri/**`、`docs/backlog.md`、`docs/Plans.md` の「次の行動」以外。
- 非目的に挙げた項目すべて。

## Acceptance Criteria

baseline は main `3148347b` の本 worktree で同じ command を実行した実測（2026-09-24）。

- AC1（checker、D1 / D2 / D4）: `bash scripts/tests/doc-consistency-plan-packet.test.sh` が exit 0 で、Matrix の T-P1〜T-P9 を含む。`rg -n 'WORKFLOW_STATE_EXEC_MODES|WORKFLOW_STATE_HOSTED_CI_REQUIREMENTS|Findings Freeze:|13 phase enum|legacy/github' scripts/doc-consistency-check.sh` が 0 件（baseline: `:1271`、`:1272`、`:1300`、`:1355`、`:1381`、`:1382` ほか。コマンド出力は Contract Probe P5）。
- AC2（PK5 検査、D1 / D3）: `bash scripts/tests/workflow-git-checks.test.sh` が exit 0 で、T-G1〜T-G6 を含む。`rg -n 'STATECAP|state-backtrack|state-only|Rebase Map|resolve_rebase_chain|has_legacy' scripts/check-workflow-git.sh` が 0 件（baseline: 31 行が一致。Contract Probe P5）。
- AC3（helper、D1 / D2 / D5）: `python3 scripts/tests/pr-gate.test.py` が OK で、T-H1〜T-H7 を含む。`rg -n "Execution Mode|codex-only|mode=" scripts/pr-gate.py` が 0 件（baseline: `:21`、`:169`、`:184`、`:240`、`:247`、`:251`）。
- AC4（並走 lane との両立、D1 / D2）: 本 PR の HEAD の checker で、並走 4 lane の packet（各 branch の commit 済み版、未 commit なら worktree の版）に `bash scripts/doc-consistency-check.sh --target plan <path>` を実行し、4 本とも `PK4: Workflow State machine 整合 OK` を出す（baseline: main `3148347b` の checker で 4 本とも同じ出力。Contract Probe P4）。さらに Matrix T-P2 / T-H2 が旧 template 形の fixture を受理する。
- AC5（撤去しない gate、D5）: Matrix の「保持」行（T-P5〜T-P8、T-G1〜T-G3、T-H3〜T-H5）が変更前と同じ入力を拒否する。各行は Matrix の Mutation-style Adequacy Questions の mutation を実注入し、対応する test（例: `python3 scripts/tests/pr-gate.test.py` の T-H3、`bash scripts/tests/workflow-git-checks.test.sh` の T-G1）が非 0 で終わることを 1 回確認して、PR body に command と exit code を記録する。
- AC6（文書、D6）: `rg -n 'state-only|STATECAP|state-backtrack|三点一致|Rebase Map|Hosted CI Requirement|Reviewed Content HEAD|Final Exact-HEAD|Execution Mode|legacy|codex-only' docs/DEV_WORKFLOW.md docs/ci.md docs/agent-guidance/merge-evidence.md docs/templates/plan-packet.md docs/templates/test-design-matrix.md` の一致が次だけになる: DEV_WORKFLOW の廃止を述べる 1 文（旧方式・Execution Mode は廃止、archive は非遡及）、同文書と merge-evidence の「拒否する legacy field の名前」を列挙する各 1 文、DEV_WORKFLOW `:312` / `:381` 相当の 2 行（PR2 へ残す）。baseline: DEV_WORKFLOW 36 行、ci.md 8、merge-evidence 13、plan-packet template 2、test-design-matrix template 5（Contract Probe P5）。`test -f docs/archive/2026-09-14-merge-evidence-rollout.md` が成功し、移送元の節見出し `## 移行・運用・復旧` の手順 1〜7 と有効化 payload が merge-evidence.md に無い。
- AC7（drift test、D7）: `bash scripts/tests/reading-order-drift.test.sh` と `bash scripts/tests/ci-workflow.test.sh` が exit 0。前者は `AGENTS.md` か `docs/DEV_WORKFLOW.md` の一方から `直接UI merge` を消した写しで失敗し、`.agents/skills/*` の `Evidence Mode` を要求しない。後者は ci.md から「Actions 利用不能なら merge を停止」の文を消した写しで失敗する。
- AC8（削除と重複、D8）: `git ls-files scripts/check-phase1-probe-removed.sh .codex/execpolicy.rules` が空。`rg -n 'execpolicy\.rules|phase1-probe' --glob '!docs/archive/**' --glob '!docs/decision-log.md' --glob '!docs/plans/**' .` が 0 件（baseline: wrapper 3 本・wrapper test・`.codex/README.md`・`docs/project-profile.md:160`）。`bash scripts/tests/codex-safe-wrappers.test.sh` が exit 0。
- AC9（helper の自己検査の回避、D9）: 本 PR の status / capture / record / ready / merge はすべて origin/main 版の `scripts/pr-gate.py` の写しで行い（手順は下記）、PR body にその blob SHA と `git rev-parse origin/main:scripts/pr-gate.py` の一致を記録する。origin/main 版の `doc-consistency-check.sh --target plan` と `check-workflow-git.sh` を本 PR の HEAD に対して実行し、どちらも exit 0。本 PR の新 helper の `status` も実行し、blocker の集合が base 版と一致する（差があれば停止して Coordinator へ）。
- AC10（全体）: `git diff --check`、`bash scripts/doc-consistency-check.sh`、`bash scripts/doc-consistency-check.sh --target plan`、`bash scripts/tests/run-workflow-tests.sh`、`bash scripts/local-ci.sh changed` が成功。hosted CI（full）が pass。未解決の P1 / P2 なし。

### helper の自己検査の穴（本 PR の固定手順）

`pr-gate.py` は review 要件の判定に base 側の classifier を GitHub から取得するが、helper 本体は実行した checkout の file である。本 PR は helper 自身を変えるため、変更後の helper で自分を検査すると、変更に誤りがあっても自分を通しうる（恒久対策は PR5）。本 PR では次を固定する。

1. Coordinator が本 PR の worktree で `git fetch origin` の後、`git show origin/main:scripts/pr-gate.py > "$TMPDIR/pr-gate-base.py"` を作る。`git hash-object "$TMPDIR/pr-gate-base.py"` と `git rev-parse origin/main:scripts/pr-gate.py` の一致を確認する。
2. cwd を本 PR の worktree にしたまま `python3 "$TMPDIR/pr-gate-base.py" status|capture|record|ready|merge --pr N --packet docs/plans/2026-09-24-harness-legacy-and-execution-mode-removal.md` を実行する。helper は `git rev-parse --show-toplevel`（`scripts/pr-gate.py:195`）で repo root を決め、自分の file 位置を使わない（`__file__` 参照 0 件）ため、capture は本 PR の worktree の `.local/pr-gate/` に置かれ、HEAD 照合も本 PR に対して行われる。
3. base 側が進んだら（origin/main の単段 merge の後、または `git rev-parse origin/main:scripts/pr-gate.py` が変わった時）1 をやり直す。本 PR の merge が済むまで本 PR の新 helper で record / ready / merge をしない。
4. 同様に `git show origin/main:scripts/doc-consistency-check.sh` と `...:scripts/check-workflow-git.sh` を `$TMPDIR` に取り出し、本 PR の worktree の root で実行する（両 script は cwd の repo を対象にし、自分の位置を使わない）。hosted CI の docs job は本 PR の変更後の script で自分を検査するため、この cross-run を Final Review の証跡に含める。
5. このため本 packet は旧 checker / 旧 helper が要求する `Evidence Mode: github`・`Execution Mode`・`Findings Freeze` 行を持つ（Workflow State の注記）。

## Design Sources

- Requirements / spec: 該当なし（製品要件を変えない）。
- Architecture / Function / DB / Screen: 該当なし。
- Workflow（改訂対象の正本）: `docs/DEV_WORKFLOW.md` Workflow State / Wave Operation / Stacked train / Verification Gates / Draft PR Checkpoint / Post-Merge Closeout、`docs/templates/plan-packet.md`、`docs/templates/test-design-matrix.md`、`docs/ci.md`、`docs/agent-guidance/merge-evidence.md`（MG-D1〜D12、RecordV1、helper の境界）、`docs/project-profile.md` High-risk Changes、`AGENTS.md` Safety / Decision and Approval Boundaries（変更しない安全境界）。
- 公式資料: [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)（2026-09-24 確認。本 PR が書き換える agent 向けの規則文の照合に使う。対応は Design Readiness の「公式 guide との照合」）。[Codex Rules](https://learn.chatgpt.com/docs/agent-configuration/rules)（`https://developers.openai.com/codex/rules` からの redirect 先、2026-09-24 確認。Contract Probe P1）。
- Decision log / ADR: D-030（npm ガード、変更しない）、D-034 / D-035 / D-038 / D-039（PK5、維持）/ D-046 / D-049 / D-055 / D-062 / D-074 / D-084 / D-085（MG-D1〜D12）/ D-087 / D-090（Ordinary Operation、維持）。
- owner 決定: 2026-09-23（座組、Execution Mode の廃止方向、Codex 停止中は Final Review だけ待つ）、2026-09-24（規則は環境が変わるたびに改める。安全・データ保護・外部書込み承認の境界は別扱いで維持）、2026-09-24（harness 改訂は公式 Opus 5.5 prompting guide を見ながら行い、review でも確認する）。
- 根拠となる実測: archive の github packet 13 件の Execution Mode の分布と Rebase Map 0 件（Contract Probe P5）、並走 4 lane の packet の現状（P4）。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | 該当なし | existing sufficient |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| Workflow 規則（本変更の対象） | S6〜S10 の文書 | updated in this PR |
| helper の packet 解釈（RecordV1 は不変） | `docs/agent-guidance/merge-evidence.md` `## 状態と非CI記録` | updated in this PR |
| Durable decision / ADR | `docs/decision-log.md` D-091（仮） | intentionally deferred（PR2。Non-scope） |

## Registration / Generation Obligations

- source / workflow doc の新設: `docs/archive/2026-09-14-merge-evidence-rollout.md`（S9）。merge-evidence.md から link し、移送した本文内の相対 link（`../../.github/merge-gate-ruleset.json` 等）は深さが同じため変わらないことを doc check で確認する。
- 削除: `scripts/check-phase1-probe-removed.sh`（参照元を S10 で削除）、`.codex/execpolicy.rules`（参照元を S11 で削除）。削除した path は classifier で未知 path = full になるが、本 PR は R3 packet 経路のため helper は拒否しない（R0/R1 経路だけが拒否する）。
- test の登録: 新規 test は既存の test file 内に足し、`scripts/tests/run-workflow-tests.sh` と `ci-workflow.test.sh` の parity 一覧は変えない。
- Tauri command / function-design doc / REQ / route / operator 画面: 該当なし。bindings / route tree / traceability の再生成は対象外。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| SPEC-WF-HARNESS1 | DEV_WORKFLOW Workflow State、merge-evidence 状態と非CI記録 | D1 | legacy は bootstrap 用で active 0、新規は全件 github（archive 13 件）。却下: legacy の検査を残して「使わない」とする（毎回 STATECAP が走り、文書が二重のまま） | S1〜S3、S6〜S9 | T-P1〜T-P4、T-G4、T-H1 |
| SPEC-WF-HARNESS1 | MANUAL §3.2、DEV_WORKFLOW Workflow State | D2 | Execution Mode は「Fable がいない間」の可用性ラベルで、owner 2026-09-23 に前提が消えた。却下: enum に新しい値を足す（座組は PR2 の表が持つ） | S1、S3、S7、S10 | T-P2、T-P3、T-H2、T-H6、T-H7 |
| SPEC-WF-HARNESS1 | DEV_WORKFLOW Plan Commit ancestry / Wave Operation | D3 | STATECAP・backtrack・Rebase Map は legacy の state-only と rebase 前提。github packet の使用 0 件、base 同期は origin/main 単段 merge（D-074）で足りる。却下: Rebase Map を任意で残す（検査されない escape hatch になる） | S2、S6 | T-G1〜T-G6 |
| SPEC-WF-HARNESS1 | DEV_WORKFLOW Review Rules Findings Freeze | D4 | 原則は残すが、PK4 が行の存在だけを見る検査は helper の broad / closure と重複。却下: 行要求の維持（PR4 で template を統合するまで旧行が必須のまま残る） | S1 | T-P9 |
| SPEC-WF-HARNESS1 | merge-evidence MG-D5〜D8 | D5 | merge gate の中核は残す（owner 2026-09-14 の選択）。R3 UI を Minimum 2 にしていた codex-only 分岐だけを外す | S3 | T-H3〜T-H5 |
| SPEC-WF-HARNESS1 | ci.md、merge-evidence | D6 | Actions 利用不能時の閉じた 2 経路は legacy 専用で、github は「Actions 停止なら merge 停止」（merge-evidence `:164`） | S6〜S10 | AC6、T-D1 |
| SPEC-WF-HARNESS1 | reading-order-drift / ci-workflow test | D7 | 定型文を PR3 で消せるよう、要求を安全境界（直接 UI merge 禁止）の 2 file へ絞る | S4 | T-D1、T-D2 |
| SPEC-WF-HARNESS1 | `.codex/README.md`、D-049 | D8 | Codex 公式は `.codex/rules/*.rules` だけを読む（P1）。mirror は二重管理 | S11 | T-W1 |
| SPEC-WF-HARNESS1 | 本 packet の固定手順 | D9 | helper を変える PR の自己検査の回避。却下: helper を base から取得する実装を本 PR に入れる（PR5 の範囲、本 PR の変更を増やす） | AC9 | AC9 の記録 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 規則は S6〜S10 の正本に置く。撤去の理由は DEV_WORKFLOW の廃止の 1 文と merge-evidence の MG-D10 / MG-D11 行（履歴は archive へ）、decision-log の整理は PR2 の D-091。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 「Evidence Mode 行は任意、書くなら github」「Execution Mode 行は任意で値を評価しない」は DEV_WORKFLOW Workflow State に置く。decision-log は PR2（Non-scope）。
- Assumptions and constraints: 並走 lane の packet が旧 3 行を持つこと（P4 で確認）、helper が cwd の repo を使うこと（P2）。
- Deferred design gaps, risk, and follow-up target: 入口文書の定型文（PR3）、MANUAL の座組（PR2）、helper の自己検査の恒久対策（PR5）、inventory-code-review Skill `:60`（PR3）。
- Test Design Matrix can cite design decision IDs or source doc sections: D1〜D9 を引用する。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「旧 field を受理するが要求しない」が唯一の互換の抜け道。受理するのは `Evidence Mode: github`、任意値の `Execution Mode`、`Findings Freeze` 行だけで、`Evidence Mode: legacy`・未知値・legacy field 3 種・実装後の Phase は従来どおり拒否する。Rebase Map 行は無視されるだけで、ancestry は記録 SHA で検査されるため escape hatch にならない（T-G2）。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable: 製品 code なし | なし |
| Fact check / design decision split | 適用。「並走 lane の packet が通り続ける」「helper は cwd を使う」「Codex は `.codex/rules` だけを読む」は実測・公式資料で確認（P1〜P4）。効果（読む量の削減）は未実測で、規則文に数値を書かない | Contract Probe |
| Lifecycle / retry | 適用。本 PR の merge 前に作った capture は `requirements` の形が変わり `fresh capture required` で止まる。作り直せば進む（fail-closed） | Ordinary Operation、T-H7 |
| Operator workflow | not applicable: 店舗 operator の操作は変わらない。利用者は Coordinator / Writer / reviewer / owner | なし |
| Replacement path | 適用。legacy 経路・Execution Mode を置き換える経路は github 方式だけ。archive packet は検査対象外（`is_archived_plan_path`）で書き換えない | T-P1 |
| Data safety / evidence | 適用。監査報告・owner 発言の原文は local-only のまま転記しない。RecordV1 と既存 PR の record は変えない | Data Safety |
| Reporting / accounting semantics | not applicable | なし |
| Manual verification | not applicable: 実機確認なし | なし |
| 環境・再現性 | 適用。helper を base の写しで動かす手順は `$TMPDIR` と `git show` だけを使い、新しい道具を足さない | AC9 |

## Design Readiness

- Existing design docs are sufficient because: 改訂の内容は owner 決定と merge-evidence の現行契約（github 方式）で決まっている。本 PR は既存の github 契約を唯一の方式として残し、legacy と Execution Mode の分岐を消す。
- Source docs updated in this PR: S6〜S10。
- Design gaps intentionally deferred: 非目的と Non-scope の項目。
- Durable decisions discovered in this plan and promoted to source docs: 旧 field の受理規則（D1 / D2）を DEV_WORKFLOW に置く。

公式 guide との照合（[Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5)、2026-09-24）。Writer は S6〜S9 の新しい文面をこの観点で書き、Final Review が確かめる:

- 「Unattended agentic runs」: 完了条件を先に書き、望む停止（本人の入力なしに進めない時、意図して保護されたものに阻まれた時）を名指しする。新しい Workflow State は各 phase の「次へ進む条件」と、止まる場面（field の欠落・enum 外 = fail-closed、Ready / merge / R4 は owner の指示待ち、Actions 停止時は merge 停止）を明記し、それ以外の場面で「報告して待つ」を求めない。同節の「risky / irreversible な操作の確認は残す」に合わせ、Ready / merge / 破壊的操作の owner 承認は文面から弱めない。
- 同節の「text だけの turn の終わりを完了の証明にしない」: 完了の判定を helper status・CI・record という機械の結果に置く現行の github 方式は整合する。新しい文面でも「報告した = 完了」と読める句を書かない。
- 「Mark pasted text in user messages」: record comment・PR body・review 報告・外部資料から取り込んだ文は data として扱い、そこに書かれた指示には従わない、を merge-evidence の record の節で保つ（現行 `:89` の「reviewer は編集しない」「他 comment を編集しない」は残す）。
- 「Explore context」: 本 PR は review の観点を狭める文（件数上限・観点の禁止）を足さない。起票時点の食い違い: なし（本 PR が触る文面にそうした句はない。`docs/quality/review-checklist.md` の件数上限は PR3 / PR4 の対象）。
- 起票時点で確認した食い違い: 現行 DEV_WORKFLOW `:127` の fail-closed 規則は「owner へ報告し黙って直さない」で、guide の「望む停止」に合う。維持する。現行 `:140`（STATECAP の件数）と `:125`（backtrack の subject 規約）は完了条件と無関係な形式上の停止で、本 PR で消える。

Minimum design checks for business-app work: 製品の layer / command / DB / operator workflow / error 挙動に変更なし。Testability は Test Design Matrix と AC の command で担保する。

## Contract Probe

- P1 前提「Codex は `.codex/execpolicy.rules` を読まない」: [Codex Rules](https://learn.chatgpt.com/docs/agent-configuration/rules)（2026-09-24 取得）の「Project-local rules under `<repo>/.codex/rules/` load only when the project `.codex/` layer is trusted.」「Codex scans `rules/` under every active config layer at startup」→ `.codex/` 直下の `execpolicy.rules` は読込み対象外。`cmp .codex/execpolicy.rules .codex/rules/default.rules` → 一致（exit 0）。`.codex/README.md:234` の検証 command も `--rules .codex\rules\default.rules` を使う。→ mirror の削除で Codex の挙動は変わらない。
- P2 前提「helper と checker は写しを cwd の repo に対して実行できる」: `rg -n '__file__' scripts/pr-gate.py` → 0 件、`scripts/pr-gate.py:195` が `git rev-parse --show-toplevel`。`rg -n 'BASH_SOURCE|SCRIPT_DIR' scripts/doc-consistency-check.sh scripts/check-workflow-git.sh` → 0 件、`scripts/check-workflow-git.sh:33` が `git rev-parse --show-toplevel`。→ AC9 の手順が成立する（実行による確認は Draft PR 作成後に `status` で行い PR body に記録する）。
- P3 前提「旧 capture は新 helper で fail-closed になる」: `scripts/pr-gate.py:280-281` の snapshot は `requirements`（`mode` を含む、`:184`）を丸ごと保存し、`record` は `captured == snap`（`:416`）で比較する。→ `mode` の削除後、旧 capture は `capture/server/head/base changed; fresh capture required` で拒否される。RecordV1（`:93-104` の wire）は `mode` を持たないため、既存 PR の record は影響を受けない。T-H7 で固定する。
- P4 前提「並走 4 lane の packet は旧 checker で PK4 OK」: 2026-09-24、main `3148347b` の本 worktree で `bash scripts/doc-consistency-check.sh --target plan ../<lane>/docs/plans/<packet>.md`（docs-rules / adr-fix / ej-core / stk-stop の 4 本）→ 4 本とも `[INFO]  PK4: Workflow State machine 整合 OK`。4 本とも `Evidence Mode: github`、`Execution Mode: fable-window`、10 field + `Final Review Minimum: 2`、`Review Response` に `- Findings Freeze:` 行を持つ（`rg` で確認）。`Rebase Map:` 行は 0 件。hosted CI は各 PR の head を checkout するため（`.github/workflows/ci.yml:294`）、main 同期前の lane は旧 script で、同期後は新 script で検査される。どちらでも受理されることを AC4 で確認する。
- P5 baseline の出力（main `3148347b`）:
  - `rg -c "STATECAP|state-backtrack|state-only|Rebase Map|Hosted CI Requirement|WORKFLOW_STATE_EXEC_MODES|codex-only|fable-window|dual-vendor" scripts --glob "!scripts/tests/**" --glob "!scripts/probes/**"` → `local-ci.sh:1`、`doc-consistency-check.sh:7`、`pre-push.sh:3`、`pr-gate.py:3`、`check-workflow-git.sh:31`。
  - `rg -c "state-only|STATECAP|state-backtrack|三点一致|Rebase Map|Hosted CI Requirement|Reviewed Content HEAD|Final Exact-HEAD|Execution Mode|legacy" docs/DEV_WORKFLOW.md docs/ci.md docs/agent-guidance/merge-evidence.md docs/templates/plan-packet.md docs/templates/test-design-matrix.md` → `test-design-matrix.md:5`、`plan-packet.md:2`、`ci.md:8`、`merge-evidence.md:13`、`DEV_WORKFLOW.md:36`。
  - `rg -l '^- Evidence Mode: github' docs/archive/plans | wc -l` → 13、`...: legacy` → 2。`rg -l '^Rebase Map:' docs/archive/plans` → 2 件（いずれも Evidence Mode 導入前の packet で、archive は検査対象外）。
  - 変更前の対象 test: `doc-consistency-plan-packet` / `workflow-git-checks` / `reading-order-drift` / `ci-workflow` / `codex-safe-wrappers` の各 `.test.sh` が exit 0、`python3 scripts/tests/pr-gate.test.py` が OK。
- P6 前提「ci-workflow test は ci.md の legacy 例外の文を要求している」（監査の footprint に無かった依存）: `scripts/tests/ci-workflow.test.sh:205-207` が `**non-release R2/R3 Actions unavailable**`・`**public repository Phase B bootstrap R4**`・`` `not-required` でも観測済み product/test/gate failure は blocker `` を grep し、`:302-319` の M3 mutation 3 件がそれを前提にする。→ S4 で同時に改める。
- 未確認の外部前提（library / OS / hardware）: 上記以外なし。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| D1 legacy の撤去（marker 任意・github のみ、legacy field 拒否、Phase 8 値） | S1 / S2 / S3 / S6〜S9 | T-P1〜T-P4、T-G4、T-H1 | archive は非遡及 |
| D2 Execution Mode の撤去（任意・未評価・承認条件でない・R3 UI 分岐なし） | S1 / S3 / S7 / S10 | T-P2、T-P3、T-H2、T-H6、T-H7 | MANUAL の座組は PR2 |
| D3 STATECAP / backtrack / Rebase Map の撤去、PK5 の維持 | S2 / S6 | T-G1〜T-G6 | なし |
| D4 Findings Freeze 行の要求の撤去 | S1 | T-P9 | 原則は Review Rules に残す |
| D5 merge gate の中核の維持 | S3（変えない部分） | T-H3〜T-H5、T-P5〜T-P8 | なし |
| D6 文書の github 一本化と archive 移送 | S6〜S10 | AC6、doc check、T-D2 | 入口の定型文は PR3 |
| D7 drift test の要求先 | S4 | T-D1、T-D2 | なし |
| D8 phase1 probe の削除、execpolicy mirror の解消 | S11 | T-W1、AC8 | なし |
| D9 自己検査の回避手順 | AC9 | 手順の記録（PR body） | 恒久対策は PR5 |
| 隣接契約: PK5（ancestry・書換え検出・Amendments prefix・pending skip・shallow 拒否） | 変えない | T-G1〜T-G3 と既存 case | なし |
| 隣接契約: Plans.md「次の行動」link、active packet 1 つ、base 側 classifier | 変えない | 既存 case（plan-packet test 11 / 11c / 12 / 28、pr-gate `test_multiple_packet_and_missing_manual`） | なし |
| 隣接契約: 直接 UI merge 禁止と残存リスク（AGENTS / DEV_WORKFLOW） | 文面を残す | T-D1 | CLAUDE.md / PR template の記述は PR3 まで残る |
| 隣接契約: `DEV_WORKFLOW.md#stacked-train` の単段 merge、MANUAL §5.6「Writer が編集前に止まったとき」（並走 lane が参照） | 見出しと規則文を残す | AC6 の review、doc check | なし |
| 隣接契約: 安全境界（AGENTS Safety / Decision and Approval Boundaries、D-030、pre-push の Ready push 拒否） | 変えない | `git diff origin/main --stat -- AGENTS.md CLAUDE.md .npmrc` が空、pre-push test | なし |

## Test Plan

[Test Design Matrix](test-matrices/2026-09-24-harness-legacy-and-execution-mode-removal.md)。packet と実装は別 commit（plan-first）。Writer は S1〜S11 を実装し、packet・Matrix・`docs/Plans.md` を編集しない。test は「撤去した検査が無くなったこと」「保持した検査が同じ入力を拒否すること」を対にして書き、保持側は mutation を実注入して red を確認する（AC5）。

- targeted tests: AC1〜AC3 / AC7 / AC8 の test file。
- negative tests: T-P3 / T-P4（legacy marker・legacy field の拒否）、T-G2（Rebase Map を書いても ancestry は逃げない）、T-H3〜T-H5（Minimum の保持）。
- compatibility checks: AC4（並走 4 lane の実 packet）、T-P2 / T-H2（旧 template 形の fixture）、T-H7（旧 capture の fail-closed）。
- data safety checks: fixture は合成だけ。並走 lane の packet は AC4 で読むだけで、本 PR に複製しない。
- main wiring/integration checks: `bash scripts/tests/run-workflow-tests.sh`、`bash scripts/local-ci.sh changed`、hosted CI full。AC9 の base 版 cross-run。

## Boundary / Wire Contract

- producer: Plan Packet の `## Workflow State`（Markdown の `- Key: value` 行）。
- consumer: `doc-consistency-check.sh` PK4、`check-workflow-git.sh`、`pr-gate.py` `workflow_fields` / `parse_packet`。
- wire type: Markdown 行。必須 key 10 個、任意 key として `Evidence Mode`（値は `github` のみ）・`Execution Mode`（値は任意、未評価）・その他の追加 key（従来どおり禁止しない、plan-packet test 24）。
- internal type: pr-gate の `requirements` dict から `mode` を削除。capture JSON の形が変わる（P3）。
- round-trip path: 承認時 snapshot（Plan Commit / 最後の Amendment の packet）と現在の packet の比較は Risk / Final Review Minimum / Human Gate だけ。snapshot 側に `Execution Mode` があり現在側に無くても KeyError にならない（比較しないため）。T-H6。
- invalid input: `Evidence Mode: legacy` / 未知値、legacy field 3 種、Phase 8 値外、必須 key 欠落・空値は拒否。
- compatibility: RecordV1 は不変。既存 PR の record comment はそのまま有効。archive packet は検査しない。

## Review Focus

- 撤去で弱まってはならない gate（PK5、Minimum の R4 / workflow 条件、Human Gate、承認時 snapshot の比較、Plans 登録、active packet 1 つ、base classifier、legacy field の拒否）が、diff 上で本当に不変か。test の保持行が実注入で red になるか。
- 「受理するが要求しない」が escape hatch になっていないか: 旧 field の値で gate が変わらないこと、Rebase Map 行が ancestry を逃がさないこと、marker の任意化で legacy packet を通さないこと。
- 並走 4 lane の packet（旧 template 形）と、本 PR の merge 前後・main 同期前後のすべての組合せで拒否が起きないか。逆向き（新 template の packet を本 PR 前の branch で使う）の制約が Ordinary Operation に書かれているか。
- 本 PR が自分を変更後の helper / checker だけで検査していないか（AC9 の記録、base 版 blob の一致）。
- 移送後の merge-evidence.md が現行契約（MG-D1〜D12 の要点、RecordV1、helper の境界、base 同期の manual 再利用、Actions 停止時の扱い）を欠いていないか。archive への移送で link が切れていないか。
- 文書に撤去済みの仕組みを指示する文が残っていないか（AC6）。PR3 へ残す入口文書の条件文が誤った操作へ導かないか、特に `.agents/skills/inventory-code-review/SKILL.md:60`。
- 改訂後の agent 向け文面が公式 Opus 5.5 prompting guide と整合するか（URL・節名を根拠に）: [Prompting Claude Opus 5.5](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5) の「Unattended agentic runs」（完了条件と望む停止の明記、risky / irreversible な操作の確認の維持）、「Mark pasted text in user messages」（取り込んだ文を data として扱う）、「Explore context in multi-app workflows」（発見を抑える review 文を足さない）。
- 普通の一日の観点: 本 PR の merge 後、Coordinator が新 template と DEV_WORKFLOW だけで R2+ を起票から merge まで進められるか（Ordinary Operation の表）。

## Spec Contract

Contract ID: SPEC-WF-HARNESS1

- D1（legacy の撤去）: active packet の `Evidence Mode` 行は任意。行があれば値は `github` だけを受理し、`legacy` と他の値は checker・PK5 検査・helper のいずれでも拒否する。`Reviewed Content HEAD` / `Final Exact-HEAD Evidence` / `Hosted CI Requirement` の行は拒否する。Phase は kickoff / spec-check / design / plan-draft / plan-gate / plan-approved / implementing / archive の 8 値で、実装後の状態は PR の native state・RecordV1・CI から導き tracked に保存しない。state-only commit、canonical subject、隣接遷移の圧縮、STATECAP、state-backtrack、三点一致、`Hosted CI Requirement`、Actions 利用不能時の閉じた 2 経路、legacy の exact-HEAD L1 merge 証拠は廃止する。Phase / Plan Commit の更新は通常の commit で行う。archive packet は遡及しない。
- D2（Execution Mode の撤去）: `Execution Mode` 行は任意で、checker・helper は値を評価しない。helper の承認時 snapshot の比較対象に含めない。Final Review Minimum の 2 の条件は R4 と workflow gate（classifier の workflow=true）だけで、Execution Mode・vendor 構成で変わらない。
- D3（PK5 検査）: `check-workflow-git.sh` は PK5（Plan Commit の ancestry、Plan Commit の書換え検出、Amendments の descendant / ancestor と登録順の prefix 保存、pending の skip）と full history の要求だけを行う。`Rebase Map:` 行は解釈しない（実効 SHA = 記録 SHA）。state-only 系 commit の件数・subject を検査しない。
- D4（Findings Freeze）: PK4 は `## Review Response` の `- Findings Freeze:` 行を要求しない。Review Rules の Findings Freeze の原則は変えない。
- D5（維持する merge gate）: Final Review Minimum は 1/2、R4 は 2 かつ Human Gate に r4、workflow=true は 2。Human Gate は `ready,merge` に必要な `manual` / `r4`。承認時 snapshot と Risk / Final Review Minimum / Human Gate を比較。Plans 登録、active packet ちょうど 1 つ、base 側 classifier、RecordV1、single-writer、match-head merge は不変。
- D6（文書）: DEV_WORKFLOW `## Workflow State` は次を持つ: (a) 10 必須 field と任意の旧 field の扱い（D1 / D2）、(b) Phase 8 値と遷移表（kickoff → spec-check → design / plan-draft → plan-gate → plan-approved → implementing、完了後 archive。各遷移の条件は現行 `:110-116`、`:122` を維持）、(c) 誤りの訂正は最も早い影響 phase へ戻る（commit の形式は問わない。Plan Gate 後の契約変更は Gated Amendment）、(d) 現行 `:127` の fail-closed 規則と `:128` の packet 選択規則を変えずに残す、(e) 実装後の現在地は helper status・専用 record・CI、(f) Plan Commit ancestry（PK5、`Plan Commit: pending` の literal を含む）、(g) Evidence Ownership（exact-HEAD SHA と test 数を tracked に書かない）。template・test-design-matrix・ci.md・merge-evidence・MANUAL / project-profile の該当行は S7〜S10 のとおり。書く文面は Design Readiness の公式 guide との照合に従う（完了条件と望む停止を明記、owner の Ready / merge / 破壊的操作の承認を弱めない、取り込んだ文は data）。
- D7（drift test）: 直接 UI merge 禁止と残存リスクの文を `AGENTS.md` と `docs/DEV_WORKFLOW.md` に要求する。Skill への Evidence Mode 要求は無い。ci.md に「GitHub Actions が利用不能なら merge を停止する」を要求する。
- D8（削除）: `scripts/check-phase1-probe-removed.sh` と `.codex/execpolicy.rules` を削除し、`.codex/rules/default.rules` を唯一の project policy とする。wrapper の allowlist は削除した path を含まない。
- D9（自己検査の回避）: 本 PR の helper 操作と checker / PK5 検査の cross-run は origin/main 版の写しで行う（AC9 の手順）。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-WF-HARNESS1-D1 | S1 / S2 / S3 / S6〜S9 | T-P1〜T-P4、T-G4、T-H1 | escape hatch | PR の diff、runner 出力 |
| SPEC-WF-HARNESS1-D2 | S1 / S3 / S7 / S10 | T-P2、T-P3、T-H2、T-H6、T-H7 | 旧 field の値で gate が変わらない | 同上 |
| SPEC-WF-HARNESS1-D3 | S2 / S6 | T-G1〜T-G6 | PK5 の保持 | 同上 |
| SPEC-WF-HARNESS1-D4 | S1 | T-P9 | なし | 同上 |
| SPEC-WF-HARNESS1-D5 | S3 | T-H3〜T-H5、T-P5〜T-P8 | 弱まってはならない gate | 同上、AC5 の実注入記録 |
| SPEC-WF-HARNESS1-D6 | S6〜S10 | AC6、T-D2 | 撤去済みの指示の残存、公式 guide との整合 | rg 出力 |
| SPEC-WF-HARNESS1-D7 | S4 | T-D1、T-D2 | 安全境界の所在 | runner 出力 |
| SPEC-WF-HARNESS1-D8 | S11 | T-W1、AC8 | なし | 同上 |
| SPEC-WF-HARNESS1-D9 | AC9 | AC9 の記録 | 自己検査 | PR body |

## Data Safety

- commit しないもの: harness 監査報告（`.local/reports/harness-audit-2026-09-24.md`）と公式資料の保存版（`.local/reports/official-guides/**`）の原文、owner 発言の原文、vendor の session ID、実店舗のデータ、helper の capture file（`.local/pr-gate/**`）。
- local-only paths: `.local/**`、`$TMPDIR` の base 版 script の写し。
- synthetic-only paths: test fixture はすべて test 内で生成する合成 packet と合成 git 履歴。並走 lane の packet は AC4 で読むだけ。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
