# Plan Packet: 開発の手続きの作り直し（D-145）

wave に属さない単独の lane。開発の手続き（packet の形・Workflow State・review と L3 の取り直し・closeout・Plans・CI の重複・owner の手）を、守りたいことの芯から組み直す workflow の lane。helper（`scripts/pr-gate.py`）・検査（`scripts/doc-consistency-check.sh`・`scripts/check-workflow-git.sh`）・hosted CI（`.github/workflows/ci.yml`）・その test と、手続きの正本の文（`AGENTS.md`・`CLAUDE.md`・`docs/DEV_WORKFLOW.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/agent-guidance/merge-evidence.md`・`docs/ci.md`・template ほか）を 1 本の PR で変える。製品の runtime（`src/**`・`src-tauri/**`）は変えない。

出所: owner の決定（repo 外の回答台帳 TD-474〜478〈2026-10-27〉、TD-479〜502〈2026-10-28〉）。所感 TD-475（小さな見直しでも大規模になる今の体制はおかしい）・TD-478（芯から組み直す）・TD-489（ゼロからすっきりした形へ、見直せるだけ見直す）を受け、Coordinator が作らせた設計案（repo の外の `.local/reports/process-slimming-2026-10-27/rebuild-proposal-v2.md`、以下「v2」）の §9 の 5 問に owner が答えた: Q1 = A（TD-498）、Q2 = C（TD-499）、Q3 = A（TD-500）、Q4 = A（TD-501）、Q5 = B（TD-502）。そのほか TD-481（同じ head の CI を 1 回に、優先度は下）・TD-483（表示だけの修正は R2）・TD-484（R3 の Final は 2 本を既定にし helper に守らせる）・TD-487（Plans は関門・ブロッカー・製品の未決判断だけ、完了は git log、進捗は handoff）。

規模と手法: 起票（本 commit）は本 packet・Test Design Matrix・`docs/decision-log.md` の D-145（plan-first）。正本の文の書き換えと helper・検査・CI・test の変更は plan-approved の後の実装の段で、#217 の merge の後に `origin/main` を単段で取り込んでから始める（下の「#217・#204 との順」）。正本の文を本 commit で書き換えない理由は下の Design Readiness。

この PR 自身は、merge されるまで今の規則（`docs/DEV_WORKFLOW.md` の Workflow State・Plan Packet Rules）で進める（v2 の K12）。機械の側は 2 つに分かれる: helper（`scripts/pr-gate.py` の status・capture・record・ready・merge）は PR の base の版で走る（D-099）。bash の検査（`doc-consistency-check.sh` の PK1・PK4・PK5 と、本 lane が足す H2・H13）は pre-push と hosted の docs job で branch の版で走り、PK4 は branch の `scripts/pr-gate.py` の `parse_packet` を import する。よって実装の commit の後は、この PR の packet を新しい検査が見る。本 lane が自分の検査を緩めて自分を通すことの手当て: (1) 本 packet は最後まで今の形（Workflow State の 11 行と今の必須の節）に保ち、新しい検査と今の検査の両方を満たす。(2) 最終 head で、base の版の検査（`scripts/` を base の版に差し替えた一時の worktree）でも本 packet を回す（AC9）。D-145 の新しい規則をこの PR に先取りで当てない。例外は owner の 1 回限りの決定 TD-502（下の Plan Reviewer の行）だけで、座組表の運用の本数を変えるもので helper の強制は変えない。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票は本 run の起草役。実装は plan-approved の後の別の run で `subagent_type: writer`）
- Plan Reviewer: round 1 は fresh Opus 5.5（`subagent_type: reviewer`、fork でない）+ Codex の 2 本（座組表どおり）。round 2 以降は、前の round で P1/P2 を出した側だけに出す（両方が出していれば両方。repo 外の回答台帳 TD-502、この PR に限る owner の決定）。round の天井は 3（`docs/DEV_WORKFLOW.md` Review Rules）
- Final Reviewer: Claude 側 1 本（R3 なので Fable 5〈当面、TD-410〉）+ Codex。座組表どおり。gate を変える変更なので、Codex が使えない間も Fable 5 + fresh Opus に代えず Codex を待つ（TD-499 の C）
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/process-rebuild

manual なし: helper・検査・CI と文書の変更で、Windows native で確かめる物が無い。Final Review Minimum 2: `scripts/pr-gate.py`・`scripts/**`・`.github/workflows/ci.yml`・`docs/agent-guidance/**` を変え classifier が `workflow=true` を出す workflow gate の変更（`docs/DEV_WORKFLOW.md` Workflow State の `Final Review Minimum`、Contract Audit の Double Audit）。

遷移の記録:

1. kickoff → spec-check（2026-10-28、起草役）: 範囲を v2 の §8.1 の段 2（§6 の H1〜H9・H11〜H14、§7 の tracked の文書、decision-log の新しい D、#204 の目的の H13 での畳み込み）とし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-28、起草役、同じ commit）: 手続きの正本の多くの節を置き換える設計が要る（下の Design Readiness）。
3. design → plan-draft（2026-10-28、起草役、同じ commit）: 設計の判断を D-145 に置いた。各正本の書き換えの中身は下の Scope の「正本の文の最終形」に節ごとに定め、文そのものは実装の段で書く（理由は Design Readiness）。未解決の設計の問いは無い（決めきれなかった点は Review Focus に挙げ、Plan Review に問う）。
4. plan-draft → plan-gate（2026-10-28、Coordinator）: packet と Matrix は起票の commit `2efd9426` で commit 済み。`doc-consistency-check.sh --target plan` は全チェック通過。
5. plan-gate のまま是正（2026-10-28、round 1 の reject を受けて）: round 1 の是正（Review Response 参照）。

## Owner Effort Budget

今の規則（PK1 の必須の節）で起票するので置く。D-145 (11) で Owner Effort Budget を消す決定（TD-501）は、この PR の merge の後の packet から効く。

- 介入回数上限: 8（既定 6 から上げる。理由: 起票の前に設計の入力として 5 つの decision point〈TD-498〜502〉を 1 回の問いで得たため）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定。round 2 以降の本数は Workflow State の Plan Reviewer の行の TD-502 の形）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 8 | 5（TD-498〜502） | 2（Ready 1・merge 1） | 1（Plan Review の裁定が owner に上がる 1） | 8 = 5 + 2 + 1 |

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
merge の関門（helper の review・manual の受理条件、Final Review Minimum と Human Gate の決め方、packet の検査、hosted CI の `Merge gate` の出し方）を変える。`docs/DEV_WORKFLOW.md` Risk Tiers の R3 の「merge gate changes」。D-098 が挙げる安全の境界（古い証拠の拒否・独立 review・Plan Commit の固定・fail-closed）のいくつかの形を変える改訂で、AGENTS.md Working Rules の「安全の境界の改訂は通常の packet・PR の経路で行う」に従い、owner の決定（TD-474〜502）で起票する。項目ごとの扱いは下の「安全の境界ごとの扱い」。R4 にしない理由: 破壊的な操作・店の実データ・secret・不可逆な git の操作を伴わない（既存の packet・archive を消さず、動かさない）。

required gate の green / red: 変わる。(1) Draft の run も `Merge gate` を出す（H9）。(2) pre-push と hosted の docs job に、計画の承認の前の実装を止める ERROR（H2）と、生きた docs に `path:行` を新しく足す ERROR（H13）が加わる。(3) PK1・PK4 の対象が差分の触る packet に絞られ（H4）、必須の節が変わる（H14）。

## Goal

Goal Invariant:

### 最小完了条件

- R3 の lane で、人（owner・Coordinator・Writer）が書き写す・書き直すのは判断（計画・finding・裁定・PASS/FAIL・承認）だけになり、状態（Phase・担当・本数・Human Gate・完了の一覧・lane の現在地）を手で書かずに、今と同じ安全の境界で merge まで進む。具体的には: packet に Phase・担当 4 行・Branch・Final Review Minimum・Human Gate・Owner Effort Budget を書かない、`Plan Commit` を手で写さない、merge の後に closeout の PR を作らない、L3 の後の docs だけの commit で L3 を取り直さない、同じ head の CI を 2 回回さない。
- R2 の lane（表示だけの修正と、gate・未知の path に触れない開発の道具・docs）は packet と計画の review なしに、PR body の 5 行と差分の review 1 本で merge まで進む。R2 の行き先は 1 つ: classifier が `workflow=true` か `unknown=true` を出す変更は R2 にできず R3 として起票する。`rust`・`frontend` に触れる R2（契約に触れない表示・開発の道具）は packet なしでよい。
- 走っている lane（起票の時点の open の PR 13 本）の packet を書き換えずに、新しい helper・検査がそれらを受ける。

### 失敗定義

- 計画の承認の前の実装、古い head の証拠、Writer 自身の review、R4 の承認の使い回し、壊れた packet のどれかを、新しい helper・検査が今より通しやすくする（緩めると packet に書いた H6・H8・H14〈新しい形の R3 の Data Safety〉の 3 か所を除く）。
- 走っている lane の旧い packet を新しい helper・検査が拒み、lane が止まる。
- 文書と helper が食い違う期間ができる（文だけ先に merge する等）。
- 既存の拒否の test を消す・skip する・弱める。

### 非目的

- 製品の振舞い・画面・DB の変更。
- repo の外の運用の道具（`.local/checklists/`・`.local/codex-orders/templates/`・`new-order.sh`・`env.md`・`MODEL-SELECTION.md`・MEMORY の 1 行目）の作り直し。v2 §8.1 の段 0 で、Coordinator が PR なしで行う。
- owner の個人の `~/.claude/CLAUDE.md`、Codex の sandbox の設定（TD-500。settings の変更は owner）。
- GitHub の ruleset（required check の名 `Merge gate` は変えない）。
- 既存の archive の packet・WER・decision-log の過去の D の本文の書き換え（Superseded の行の追加だけ）。
- D 番号・migration の版の自動の採番、PR の件名の型の検査、owner の承認の自動の記録（v2 §6 の「入れないもの」）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、作り直しの後の通常列を置く（D-145 の流れ）。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| R2 の表示だけの修正の branch | Writer が実装 → PR body に目的・範囲・非目的・AC・Risk の 5 行 → `pr-gate.py capture --risk R2 --manual required`（operator 向けの画面に触れるとき。目視を manual として `record --kind manual --evidence <目視の記録の pointer>` で記録する）か `--manual not-required`（画面に触れないとき）→ 差分の review 1 本 → record | packet・計画の review・Plan Commit なしで Draft まで進む。画面の目視を飛ばすと helper の status が `manual incomplete` で止まる | review が P1/P2 0、画面なら manual の pass | R2N1・R2N2・R2N3 |
| R3 の lane を起票 | packet（最小形）を書いて commit → Plan Review round 1 の 2 本 → 是正 → `scripts/plan-approve.sh <packet> <reviewer の読んだ SHA>` | Plan Commit を手で写さない。承認の前に code を push すると pre-push が止める | Plan Review が P1/P2 0 | PA1・PH4 |
| R3 の lane を実装・review | 実装 → Draft → capture → Final broad 2 本（Risk から helper が 2 を導く）→ 是正 → closure | packet に本数・Human Gate を書かない | helper status の blocker が manual と CI だけ | MN1 |
| L3 の後に P3 の docs の是正を積む | lane の docs だけの commit → push → capture → `record --kind review --review-stage docs --evidence <P3 だけと裁定した pointer>` | L3 も review も取り直さない（C・H6） | `## L3` 節と計画の節が変わらない | C1・RC1 |
| 先行 PR の merge の後 | `git -c merge.directoryRenames=false merge origin/main`（#217 の A・B のまま） | 同期で L3 を取り直さない | #217 の条件 | #217 |
| Ready・merge | owner が名指しの PR の束を 1 回で承認 → Coordinator が helper `ready`・`merge`。同じ head の Draft の run の `Merge gate` を merge の証拠に使う | closeout の PR を作らない。Plans に完了の行を足さない | helper の `merge` が通る | CI1・CI2 |
| 次の session の再開 | `git fetch origin` → `git log --oneline -20 origin/main` → `bash scripts/lanes.sh` → handoff | 完了は git log、lane の現在地は helper から読む | — | LN1 |
| Codex の枠が無い | R3 の Final は Fable 5 + fresh Opus の 2 本。R4 と gate を変える変更は Codex を待つ | R3 の lane が止まらない | — | TD-499 |

## Scope

新しく書く引用は D-125・`docs/DOC_STYLE_GUIDE.md` §1 の形（path と symbol・節名・決定 ID。行番号で引かない）。owner の決定は「repo 外の回答台帳 TD-nnn」で引く。

### 予定の file

| file | 変更 | 段 |
|---|---|---|
| `docs/plans/2026-10-28-process-rebuild.md`・`docs/plans/test-matrices/2026-10-28-process-rebuild.md` | 本 packet と Matrix | 本 commit |
| `docs/decision-log.md` | 末尾に D-145。置き換わる D（D-034・D-038・D-055・D-097・D-101・D-107〈PK4 の対象を active な packet に絞る所〉・D-124〈#217 の D-144 の後の残り〉）の末尾に `Superseded in part by: D-145` の行 | D-145 は本 commit、Superseded の行は実装 |
| `scripts/plan-approve.sh`（新設） | H1 | 実装 |
| `scripts/pr-gate.py` | H2・H3・H4・H5・H6・H7・H8・H9（`ci`）・H11 | 実装 |
| `scripts/check-workflow-git.sh` | H2（Phase の検査を外し、先走りの検査を足す） | 実装 |
| `scripts/doc-consistency-check.sh` | H2（PK4 の Phase）・H4（PK1・PK4 の対象、Plans の pointer の検査を外す）・H13・H14 | 実装 |
| `scripts/lanes.sh`（新設） | H12 | 実装 |
| `.github/workflows/ci.yml` | H9（`merge_gate` の name 式、trigger の `ready_for_review`）。docs job の `doc-consistency-check.sh` の step に `WORKFLOW_BASE_SHA`（PR の base の SHA）を渡す行（今は PK5 の step だけが持つ。H2・H4・H13 の起点） | 実装 |
| `scripts/pre-push.sh` | H2・H13 の検査に起点を渡す（今の `WORKFLOW_BASE_SHA` の渡し方に合わせる。要るときだけ） | 実装 |
| `scripts/tests/pr-gate.test.py`・`workflow-git-checks.test.sh`・`doc-consistency-plan-packet.test.sh`・`ci-workflow.test.sh`・`reading-order-drift.test.sh`・`run-workflow-tests.sh`、新設の `plan-approve.test.sh`・`lanes.test.sh` | Matrix の行。Phase・移送・Owner Effort Budget・`Draft (no merge evidence)` を前提にした case を新しい契約に合わせて書き換える | 実装 |
| 正本の文（下の「正本の文の最終形」の表の file） | 書き換え | 実装 |

### 正本の文の最終形

行数は見込みで未実測（起票の時点の行数は `wc -l AGENTS.md CLAUDE.md docs/DEV_WORKFLOW.md docs/AGENT_OPERATING_MANUAL.md docs/agent-guidance/merge-evidence.md docs/ci.md docs/code_review.md docs/templates/plan-packet.md docs/templates/test-design-matrix.md docs/templates/subagent-review-packet.md .github/pull_request_template.md docs/Plans.md` → 76・35・364・217・173・100・107・203・111・33・45・85。`docs/Plans.md` は `Plans.md` の symlink の実体）。各 file は #217 の merge の後の版から書き換える。

| file | 残す・置く中身 | 消す中身 |
|---|---|---|
| `AGENTS.md` | Session Start の表を 4 行（質問・調査 / R0〜R2 / R3〜R4 の計画と実装・再開 / review）にし、先頭に「`git fetch origin` の後、`git log --oneline -20 origin/main` と `bash scripts/lanes.sh` で完了と lane の現在地を読む。handoff・memory・前の調べの値は行動の根拠にする前に正本で引き直す」（v2 §2.6）。Working Rules・Decision and Approval Boundaries（束ねた Ready/merge の承認の委任を R0〜R4 の全 PR に広げる。Codex の起動を Coordinator の委任に足す〈TD-500〉）・Workspace Access・Memory Model（現在地は handoff、Plans は関門・ブロッカー・製品の決まっていない判断）・Safety・npm ガードは文のまま | Ready・merge・closeout の行の closeout、`Plans.md` を現在地とする文 |
| `CLAUDE.md` | import・言語・報告の形・コピペ物の path・安全境界の検証を subagent に出さない・座組表への pointer | 重複した入口の説明（AGENTS と同じ文） |
| `docs/DEV_WORKFLOW.md` | Risk の線（R2 に表示だけの修正〈TD-483〉、状態を持つ画面は R3）、Risk ごとの最小の流れの表（v2 §2.2。R2 は Q1 の A）、R3/R4 の packet の最小形（v2 §2.5）、計画の固定（`plan-approve.sh`・PK5・先走りの検査）、L3（`## L3` 節・L3 Eligibility・fixture の実 encoding・取り直しの表〈v2 §2.3〉）、review の規則（Findings Freeze・round の上限 3・不可逆 finding の 4 項目・Contract Audit の項目・計画の review の発注の固定の問い〈普通の一日・登録と生成・外の前提・データの安全・前提の出所〉・closure の固定の問い〈是正で足した契約文と見送った経路を全部挙げる〉）、検証の command、Design Phase の短い規則、Wave の one-writer・path の所有・単段の同期、Subagent Budget、Commit / PR Messages | Phase の enum・遷移の表・遷移の記録、Workflow State の担当 4 行・Final Review Minimum・Human Gate の手書き、Owner Effort Budget の節、Post-Merge Closeout の節、Draft PR Checkpoint の PR body の全文の直し直しと介入の数、`Draft (no merge evidence)` を待つ Ready の手順、Artifact Map の archive と test-matrices の行 |
| `docs/AGENT_OPERATING_MANUAL.md` | 役割・独立性・座組表（model は agent 定義の名を指す。effort の値は agent 定義の frontmatter を正とする）、§3.3 に TD-499（R3 の Final は Codex が使えない間 Fable 5 + fresh Opus、R4 と gate を変える変更は Codex を待つ）、§3.5、発注書の必須項目、相談役は任意 | §5.3（Plans cleanup）、相談役の必須、Owner Effort Budget への言及 |
| `docs/agent-guidance/merge-evidence.md` | helper の契約。計画の固定（H1）、Minimum・Human Gate の導出（H3）、L3 の使い回し C と docs の closure（H5・H6）、GA の closure（H7）、R2 の packet なしの道（H8）、同じ head の CI（H9）、`--report`（H11）を足す。MG-D3 と MG-D9 に Superseded の注記 | closeout の節、Phase archive の移送 |
| `docs/ci.md` | Draft の run も `Merge gate` を出し、`ready_for_review` で再実行しない。Final Trigger Selection を同じ head の 1 run に縮める | Draft と Ready の 2 名の段、Ready の後の Draft の赤の rerun の手順 |
| `docs/code_review.md` | closure の固定の問いを 1 項 | — |
| `docs/templates/plan-packet.md` | 下の「新しい packet の書式」の正例と同じ形 | Workflow State の 11 行の雛形（3 行に）、Owner Effort Budget、Ordinary Operation・Registration・Impact Review Lenses・Boundary/Wire・Contract Probe の節（発注の固定の問いへ移す）、R3 の Data Safety（発注の固定の問いへ。R4 は残す）、Implementation Results・Review Response（PR の comment へ） |
| `docs/templates/test-design-matrix.md` | 削除せず、旧い packet が引く参照として残し、冒頭に「新しい packet は packet の `## Test Plan` の表に書く」 | — |
| `docs/templates/subagent-review-packet.md` | 計画の review と closure の発注の固定の問い。reviewer は読んだ SHA を `REVIEWED_HEAD=` の 1 行で報告する（H11） | Review Response を読ませない除外の指示（packet から消えるので不要） |
| `.github/pull_request_template.md` | 要約・範囲・検証の結果（報告を指す）・残り。R2 は目的・範囲・非目的・AC・Risk の 5 行 | Plan Packet・Source docs・helper status の link・介入 N/M・Dashboard / archive follow-up |
| `docs/Plans.md` | 導入の前の関門・ブロッカー・製品の決まっていない判断・参照（TD-487） | 現在のフェーズ・次の行動・直近の完了・Wave Registry |
| `docs/PROJECT_HANDOFF.md`・`docs/project-profile.md`・`docs/DEV_SETUP_CHECKLIST.md`（`Draft (no merge evidence)` の行）・`.agents/skills/inventory-workflow-start/SKILL.md`・`.agents/skills/inventory-implementation/SKILL.md`・`.agents/skills/test-design/SKILL.md`・`docs/backlog.md`（Wave Registry の項目と、`Draft (no merge evidence)`・`ready_for_review` を引く項目） | 消える節・語への参照を新しい形に直す（drift の sweep。下の AC4・AC7。対象の行は実装の段に AC4・AC7 の `rg` で全部挙げる） | — |

### 新しい packet の書式（1 通り）

新しい packet は次の正例の形だけにする（v2 §2.5 の先頭の裸の `Risk:`・`Plan Commit:` の行の形は採らない）。Workflow State は `- Key: value` の 3 行で、helper・PK4・PK5 はこの節だけを読む。`## Risk` の `Risk: Rn` の行は PK1 と helper が Workflow State の Risk と一致を確かめる今の検査のまま残す（機械が照合する鏡で、食い違えば止まる）。見出しの名は今の template と同じ英語の名を使い、新しい名を作らない（旧い packet との対応を少なくする）。下の正例は字下げの code block にし、本 packet の検査がそれを本 packet の節と取り違えないようにした。

    # Plan Packet: <件名>（PR の件名と同じ）

    ## Workflow State

    - Risk: R3
    - Plan Commit: pending
    - Amendments: none

    ## Risk

    Risk: R3

    Reason:
    <理由 1 文。出所つき>

    ## Goal

    Goal Invariant:

    ### 最小完了条件
    ### 失敗定義
    ### 非目的

    ## Scope
    ## Acceptance Criteria
    ## Design Readiness
    ## Contract Ledger
    （表: 契約 ID / 設計正本の節 / 実装（Scope） / 自動 test / L3・非対象）
    ## Test Plan
    （表: Contract / Failure Mode / Test Type / Test Name / Would fail if...。runtime の R3 は状態の遷移・negative・mutation の注入を含む）
    ## L3            ← manual があるときだけ（節があること = manual）
    ## Recovery      ← R4 だけ
    ## Data Safety   ← R4 だけ

形式の見分け: Workflow State に `Phase` の行がある packet を旧形式、無い packet を新形式とする（`Phase` の値は評価しない）。

| 項目 | 新形式 | 旧形式（受ける形） |
|---|---|---|
| Workflow State | `Risk`・`Plan Commit`・`Amendments` の 3 行。`Final Review Minimum` は上げるときだけ 1 行 | 今の 11 行。`Final Review Minimum`・`Human Gate` は書いた値をそのまま使う（下の H3） |
| PK1 の必須の節 | 全部: Risk・Goal・Scope・Acceptance Criteria。R3+: Design Readiness・Contract Ledger・Test Plan。R4: Recovery・Data Safety | 今の PK1 の必須の節（Owner Effort Budget・Contract Probe・Data Safety・Test Design Matrix の link を含む）のまま。非遡及 |
| 契約の一覧 | `## Contract Ledger` | `## Contract Ledger`、または `## Spec Contract` と `## Trace Matrix` の組（今と同じ） |
| テストの表 | `## Test Plan` の中の表 | `## Test Plan` と Test Design Matrix の link |
| manual | `## L3` 節があること | Workflow State の `Human Gate` に `manual` |
| L3 の比較対象（H5・H6） | `## L3` 節 | `## L3` 節があればそれ、無ければ `## Test Plan` 節の全体。どちらも無ければ比べられないとして使い回さない |

同じ入力を全部の読み手に通す: 正例（新形式）と、起票の時点の open の lane の packet（旧形式）を、実装の後の branch で PK1（`--target plan`）・PK4・PK5（`check-workflow-git.sh`）・helper の `parse_packet` と `requirements` に通す（AC8）。

### active な packet の定義（1 か所）

active な packet = `docs/plans/` 直下の dated packet（`docs/plans/YYYY-MM-DD-*.md`）のうち、比べる起点の tree に同じ path が無いもの（この branch が足した packet）。起点は、helper では PR の base の SHA、push 前と hosted の検査では `WORKFLOW_BASE_SHA`（無ければ `origin/main`）と HEAD の merge-base。helper の `requirements`（`--packet` と packet なしの道の判定）、PK1・PK4・PK5、H2、`--target plan` の引数なしの対象は、全部この 1 つの定義を使う。

- merge 済みの packet（起点の tree にある packet）は active でない。squash merge のため、その `Plan Commit` は main の祖先にならず（起票の時点で `git merge-base --is-ancestor 7895aca82b11016d6a22c69ef30257e65d640db3 origin/main` → exit 1。`docs/plans/2026-10-27-docs-small-batch-3.md` の Plan Commit。`docs/plans/2026-10-23-stocktake-count-runtime-b2.md` の `33831dd3…` も exit 1）、今の取り方（差分が触る packet）では、後の PR がその packet を 1 行直すだけで PK5 が落ちる。
- merge 済みの packet は R0/R1 の道で直してよい（typo・link の直し）。ただし Workflow State の節の行を変える差分は ERROR にする（merge の時点の記録を書き換えない）。
- link の検査（R3）は、merge 済みの packet の link 切れを WARN にする（文書の改名・削除のたびに merge 済みの packet を直させない。直すのは任意で、上の R0/R1 の道で行う）。
- 起点が取れない・merge-base が一意でないときは、active な packet を決められないとして ERROR で止め、理由を名指す（merge 済みの packet が残るので「全 packet を検査する」は必ず落ち、fail-closed の代わりにならない）。
- 旧い closeout の PR（#215 の型）が packet を `docs/archive/plans/` へ移すのは受ける（H4）。

### 計画の節（H6・H7 が比べる集合、1 か所）

計画の節 = `## Scope`・`## Acceptance Criteria`・`## Contract Ledger`（旧形式で `## Contract Ledger` が無ければ `## Spec Contract` と `## Trace Matrix`）。比べるのは節の本文の byte。どれかの節が無い・重複して読めないときは「変わった」と扱う（fail-closed）。H6 と H7 はこの定義だけを引く。

### helper・検査・CI の変更（v2 §6 の番号）

- H1 `scripts/plan-approve.sh <packet> <SHA>` と `--amend <SHA>`: SHA が 40 桁の小文字 hex で branch の HEAD の祖先、packet の `Plan Commit` が `pending`（`--amend` では SHA が Plan Commit の子孫で `Amendments` に無い）を確かめ、さらに `git diff --name-only <SHA> HEAD` が空か、その packet だけであることを確かめる（reviewer が読んだ版の後に、手元で実装や計画の変更を積んでから承認を書く道を止める）。満たせばその行だけを書き換えて packet だけの commit を作る。push はしない。
- H2 Phase を外す: `parse_packet` は Phase を必須にせず、旧い packet の Phase 行は受けて評価しない。`snapshot`・`nonci`・`status` の `phase == implementing` を `plan_commit != pending` に置き換える。`check-workflow-git.sh` の Phase の 8 値の検査を外し、新しい検査を足す: active な packet（上の定義）のどれかが `Plan Commit: pending` で、起点からの差分に classifier（branch の版の `scripts/ci/classify-changes.sh`）の `rust`・`frontend`・`generated`・`env`・`unknown` のどれかが true、または `scripts/**`・`.github/**` の path があれば ERROR。起点が取れなければ active を決められないとして ERROR（上の定義）。v2 §6 H2 の 4 種に `env` と workflow の実行 code の path を足した（workflow の lane の helper の先走りを止めるため。`workflow=true` 全体は docs も含むので使わない）。
- H3 `requirements` で Minimum と Human Gate を決める。旧形式の packet（`Phase` の行がある）は、書いた `Final Review Minimum` と `Human Gate` をそのまま使う（今の helper と同じ。R4・`workflow=true` で 2 を求める今の検査も残す。D-145 (15) の非遡及。TD-484 の 2 本の既定は新形式の packet の話）。新形式の packet は導く: Minimum は R3 = 2、R4 = 2、classifier `workflow=true` なら 2。packet に `Final Review Minimum` の行があれば導いた値との大きい方（下げる向きは受けない）。Human Gate は ready,merge を常に、r4 は Risk が R4 のとき、manual は `## L3` 節があるとき。どちらの形式でも、Workflow State に `Human Gate` の行があり `r4`・`manual` を含めば、導いた値に足す（書いた承認を落とさない。R3 + 明示の r4 は r4 を要る）。`approved packet condition changed` は、新形式では Risk と `## L3` 節の有無と（あれば）`Final Review Minimum`・`Human Gate` の行で照合し、旧形式は今の 3 field で照合する。
- H4 archive への移送をなくす: R0/R1 の道の `moved packet is not Phase archive` の検査を外す（`docs/archive/plans/` への移動は受け、削除だけ・archive の外への移動は今のまま拒む。v2 §6 H4 は移送の分岐ごと消す案で、本 packet は #215 の型を通しつつ `docs/plans/` の packet の黙った削除を止める形に絞った）。PK1・PK4・PK5 の対象を active な packet（上の定義）にし、merge 済みの packet の Workflow State の行の変更を ERROR に、merge 済みの packet の link 切れを WARN にする。PK4 の `docs/Plans.md` の `## 次の行動` の pointer の検査を外す。`--target plan PATH` の明示の検査は今のまま。
- H5 L3 の使い回し C: #217 が足す同期だけの条件の関数の隣に、「manual の版から今の head までの lane の commit（1 親）の path が、classifier で `docs` だけ（`workflow=false`）、`--no-renames` で列挙、packet の L3 の比較対象（上の「新しい packet の書式」の表の最後の行。旧形式で `## L3` が無ければ `## Test Plan` 節の全体）が byte で同じ」の条件を足し、#217 の A・B と組み合わせて manual を引き継ぐ。比較対象が取れなければ使い回さない。R4 は引き継がない。
- H6 `--review-stage docs`: H5 と同じ条件（L3 の比較対象を含む）で、旧 record の review が pass、broad の Plan 契約が今の packet と同じ、計画の節（上の定義）が byte で同じ、`--evidence` に P3 だけと裁定した pointer があるときだけ、`{head, base, sync_from}` の closure を書く（#217 の `--review-stage sync` と同じ形）。`workflow=true` の docs は受けない。
- H7 GA の後: broad の版と今の版で計画の節（上の定義。H6 と同じ集合）が byte で同じなら、`FRESH_BROAD` の代わりに closure を求める。`## Contract Ledger` だけが変わっても `FRESH_BROAD`。節が読めなければ今のまま `FRESH_BROAD`。
- H8 R2 の packet なしの道: `--risk R2` を受け、Minimum 1・`plan_commit` null・`--manual` 必須（operator 向けの画面に触れるなら `required` で、目視を manual として記録する）。R2 の行き先は 1 つ: classifier が `workflow=true` か `unknown=true` を出す変更は R2 にできず R3 の packet で起票する（helper は `--risk R2` を拒む）。`rust`・`frontend` に触れる R2（契約に触れない表示・開発の道具）は packet なしで受ける。diff が active な packet を足していれば `--risk R2` を拒む（`--packet` の道へ）。
- H9 同じ head の CI を 1 回に: `merge_gate` の name を常に `Merge gate` にし、trigger から `ready_for_review` を外す。helper `ci()` は同じ head の最新の run が `pull_request`（Draft を含む）か `workflow_dispatch` で成功し `Merge gate` が 1 つなら受ける（今の照合は全部残す）。Ready の後の push を pre-push が拒む挙動は今のまま。
- H11 `record --report FILE`: FILE の `REVIEWED_HEAD=<40hex>` の 1 行を読み `--reviewed-head` に使う。capture の head との照合は今のまま。
- H12 `scripts/lanes.sh`: open の PR ごとに番号・branch・active な packet・head・helper status の blocker を 1 表で出す。read-only。helper status は PR ごとに、その PR の base の版の helper（`git show <base>:scripts/pr-gate.py` を一時の file に出したもの）で取る。packet の無い PR は「packet なし」と書き、`--risk`・`--manual` は PR body の Risk の行から補う（読めなければ status を呼ばず「Risk 不明」と書く）。helper が exit 2（base の版の不一致・入力の誤り）を返した PR は、その理由の 1 行を表に書いて次の PR へ進む。
- H13 生きた docs に `path:行` を新しく足したら ERROR（起点からの差分の `+` 行だけ。既存の行は対象外）。D-125 (2)・(3) と `docs/DOC_STYLE_GUIDE.md` §1「code と文書の箇所の引き方」の適用除外をそのまま反映する: 対象は設計の正本・workflow の正本・runbook（`docs/**`、`AGENTS.md`、`CLAUDE.md`）。対象外は、`docs/archive/**`・`docs/plans/**`（dated の packet と Matrix）・`docs/research/**` と dated の調査・提案・L3 の記録・`docs/decision-log.md`（append-only の本文）、`docs/backlog.md` の行のうち同じ行に 7〜40 桁の hex の commit を添えたもの。起点は PK5 と同じ（hosted は docs job の step に渡す `WORKFLOW_BASE_SHA`、push 前は `scripts/pre-push.sh` が渡すか `origin/main`）。起点が取れなければ WARN と理由。#204 の検査（D-125 の目的）を、この縮めた形で置き換える。
- H14 PK1 の必須の節を上の「新しい packet の書式」の表にする（新形式と旧形式で分ける）。R3 の Data Safety の必須は新形式で外し、計画の review の発注の固定の問い（データの安全）へ移す。R4 は Data Safety と Recovery を必須に残す。旧形式は今の必須の節のまま。
- H10（`.local/codex-orders/new-order.sh`）は repo の外で本 PR の範囲の外（Non-scope）。

### 安全の境界ごとの扱い

D-098 が DEV_WORKFLOW Workflow State で挙げる境界、AGENTS の Safety・npm ガード、既存テストを弱めない規則について、項目ごとに「緩める / 同じ強さを別の形で守る / 強める / 変えない」を書く。

| 境界 | 本 PR の変更 | 扱い | 根拠 |
|---|---|---|---|
| 古い証拠の拒否 | H5（docs だけの lane の commit の後の L3 の使い回し）、H9（Draft の run を merge の証拠に）、H11（報告から reviewed head） | 同じ強さを別の形で守る。runtime・生成物・未知の path・L3 節の変更では使い回さない。CI は同じ head の run だけ。reviewed head は capture の head と照合 | Matrix C2・C3・CI2・RP1 |
| 独立 review | H3（Minimum の導出）は新形式の packet で強める（R3 は 2 本、TD-484）。旧形式の packet は書いた値のままで、走っている lane の本数は上がりも下がりもしない。H7（GA の後の closure）は同じ強さを別の形で守る（計画の節〈Scope・AC・Contract Ledger〉のどれかが変われば fresh broad）。H6（docs だけの commit の機械の closure）は **緩める**: lane が書いた P3 の docs の文が人の review を経ずに入る。範囲を TD-476 (2) に限り、gate の文書・計画の節の変更と裁定の pointer の無いものは受けない | owner の決定 TD-476 (2)。Matrix RC2・GA2・MN2 |
| Plan Commit の固定 | H1（script が書く）は同じ強さ（PK5 と helper の照合は今のまま）。H8（R2 の packet なしの道）は **緩める**: R2 から Plan Commit の固定を外す。害は docs の文と表示に留まり、gate・runtime の変更は R2 の道で受けない | owner の決定 TD-498（Q1 = A）。Matrix R2N2 |
| 不可逆 finding の 4 項目 | 文を DEV_WORKFLOW の review の規則に残す | 変えない | — |
| fail-closed | H2 は強める（承認の前の実装を機械が止める。今は止めていない〈`check-workflow-git.sh` の冒頭の説明と `pr-gate.py` の `snapshot` を読んだ。pre-push と CI の全経路は未確認〉）。H4・H14 は同じ強さを別の形で守る（active な packet は今と同じに検査する。active を決める起点が取れなければ ERROR）。merge 済みの packet は今は archive へ移して検査の外に出しているので、検査の外に置くのは今と同じで、加えて Workflow State の行の変更を ERROR にする。壊れた packet・enum の外の Risk は今のまま止める | Matrix PH4・PH6・AR2・AR4・AR5 |
| owner の Human Gate・R4 の承認 | H3 で新形式は導く（manual は `## L3` 節、r4 は R4）。どちらの形式でも Workflow State に書いた `r4`・`manual` は落とさない（R3 + 明示の r4 は r4 を要る）。束ねた Ready/merge の承認は各 PR の helper `merge` を省かない | 同じ強さを別の形で守る | Matrix MN3・MN4・MN5 |
| R3/R4 の Data Safety の節（PK1 の機械の必須） | H14 で新形式の R3 から外し、計画の review の発注の固定の問い（データの安全）へ移す。R4 は必須に残す | R3 は **緩める**（機械の検査が発注の問いに替わる。店の実データを commit しない規則は AGENTS の Safety と `scripts/check-env-safety.sh`・public-sanitization の test が今のまま守る）。R4 は変えない | D-145 (10)。Matrix PK1N |
| bash の検査が branch の版で走ること | 本 PR の実装の commit の後、この PR の packet を新しい PK1・PK4・PK5 が見る | 手当て: 本 packet を今の形に保ち、最終 head で base の版の検査でも回す（AC9） | 冒頭の段落 |
| Decision and Approval Boundaries の承認境界 | 束ねた承認の委任を R0〜R4 に広げる（今は Wave の train の委任）。Codex の起動を Coordinator の委任に足す（TD-500。sandbox の設定は owner） | 委任の範囲を広げる（承認の要る操作は変えない） | owner の決定 TD-500、v2 §2.2 の「束ね」 |
| AGENTS の Safety・npm ガード | 文のまま | 変えない | — |
| 既存テストを弱めない | Phase・移送・Owner Effort Budget・`Draft (no merge evidence)` を前提にした case は新しい契約に合わせて書き換え、書き換えた case と理由を PR body に挙げる。拒否の case（古い head・broad の不足・base の版の helper・R4 の使い回し・UI merge の道・PK5）は消さない | 変えない | Matrix KEEP |

### この変更で不要になる記述・条件（D-127）

上の「正本の文の最終形」の「消す中身」の列と、helper の `parse_packet` の Phase の enum・`Final Review Minimum`・`Human Gate` の必須、`requirements` の `Phase archive` の検査、`check-workflow-git.sh` の Phase の検査、PK4 の Plans の pointer の検査、`ci.yml` の name 式の Draft の分岐。消す語（`Owner Effort Budget`・`介入 N 回目`・`Post-Merge Closeout`・`直近の完了`・`Wave Registry`）が起票の時点で現れる生きた file（`rg -lF '<語>' --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/decision-log.md' .`）:

| 語 | file |
|---|---|
| Owner Effort Budget | `docs/templates/plan-packet.md`・`scripts/doc-consistency-check.sh`・`scripts/tests/doc-consistency-plan-packet.test.sh`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/DEV_WORKFLOW.md`（ほかに `.agents/skills/inventory-workflow-start/SKILL.md` が節への link を持つ） |
| Post-Merge Closeout | `AGENTS.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/DEV_WORKFLOW.md` |
| 直近の完了 | `docs/backlog.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/Plans.md`・`docs/DEV_WORKFLOW.md` |
| Wave Registry | `scripts/tests/doc-consistency-plan-packet.test.sh`・`docs/DEV_WORKFLOW.md`・`docs/Plans.md`・`docs/backlog.md`・`docs/research/2026-07-28-codex-sol-week-playbook.md`（research は時点の調べで直さない） |
| 介入 N | `docs/AGENT_OPERATING_MANUAL.md`・`docs/research/2026-07-28-codex-sol-week-playbook.md`（同）・`docs/DEV_WORKFLOW.md`・`scripts/tests/doc-consistency-plan-packet.test.sh`・`docs/templates/plan-packet.md` |

残すもの: 不可逆 finding の 4 項目、Findings Freeze と round の上限 3、L3 Eligibility、fixture の実 encoding、Contract Audit の各項目（発注の問いとして）、one-writer と depth 1、単段の同期、relay の tag、`--pr-reviews N`、`--reviewed-head` の照合、base の版の helper、回答台帳。どれも今も防ぐ失敗が言える（v2 §2.4・§3）。

### 他の lane との所有と順

起票の時点（起点 `bbea3314`）の open の PR 13 本の変更 file（`gh pr diff <N> --name-only`）と本 lane の予定 path を突き合わせた。

| file | 相手 | 相手の所有 | 本 lane の所有 |
|---|---|---|---|
| `scripts/pr-gate.py`・`scripts/tests/pr-gate.test.py` | #217（helper の実装は plan-approved の後で、起票の時点の差分には出ない。#217 の packet の Scope の表） | 同期だけの条件・code に触れない条件・manual の A/B・`--review-stage sync`・確かめ直し（#217 の H1〜H7） | H2〜H9・H11。#217 の merge の後に、その上で書く |
| `docs/DEV_WORKFLOW.md`・`docs/agent-guidance/merge-evidence.md`・`docs/ci.md` | #217 | MG-D13 と L3 の箇条・`MG-D13` の引用 | #217 の merge の後の版から全体を書き換える（#217 の文は最終形の L3 と同期の節に残す） |
| `docs/decision-log.md` | #217（D-144）・#216（D-143）・#212（D-141）・#211（D-142）・#209（D-140）・#201（D-137）・#194（D-130 の改訂ほか） | 末尾への D の追記 | 末尾の D-145 と、置き換わる D の末尾の Superseded の行。末尾の追記は merge 順で両方を残す |
| `scripts/doc-consistency-check.sh`・`scripts/tests/doc-consistency-plan-packet.test.sh` | #201 | R0・R1 の走査に `src-tauri/dev-tools/src` を足す（`check_stale_parent_doc_references`・`check_code_doc_references`）と test の冒頭の comment | PK1・PK4 と新しい検査。関数が違うので、後から merge する側が base 同期で取り込む |
| `docs/Plans.md` | #215・#201・#190 | 各 lane の完了・関門の行 | 節の構造（現在のフェーズ・次の行動・直近の完了・Wave Registry を消す）。先に merge された相手の「直近の完了」の行は、本 lane の同期で節ごと消える（完了は git log に残る、TD-487）。関門・ブロッカーの行の中身は相手の版を保つ |
| `docs/backlog.md` | #215・#212・#211・#201・#190・#172 | 各項目の行 | `Wave Registry` の項目の 1 行だけ |
| `docs/archive/harness-context/2026-09-30-Plans-completed.md` | #215 | 完了の行の移送 | 触らない（以後の追記をやめるだけ） |

- #217（`agent/l3-reuse-after-sync`、Plan Review round 2 中）と直列: 本 lane の helper の実装は #217 の merge の後、`origin/main` を単段で取り込んだ head の上で行う。本 lane の H5・H6 は #217 の同期だけの条件の関数と `--review-stage sync` の形を前提にする。起票（本 commit）は #217 と並行。
- #204（`agent/docs-file-line-check`、plan-approved、実装の前）は v2 §8.2 のとおり本 lane に畳む: D-125 の目的（行番号の引用を新しく作らない）は H13 の縮めた検査で保ち、#204 の packet の範囲（`.github/workflows/ci.yml` の 2 か所・新しい test・`docs/ci.md`・`docs/quality/review-checklist.md`・`docs/DOC_STYLE_GUIDE.md` の節）は本 lane では引き継がない。#204 を閉じる操作は本 lane でしない（Coordinator が owner の承認の範囲で行う）。
- #215（closeout）は今の形のまま merge してよい（AR1 で新しい helper も移送を受ける）。独立の closeout の PR はこれで最後になる。
- ほかの走っている lane（#216・#212・#211・#210・#209・#201・#197・#194・#190・#172）の packet は書き換えない。新しい helper・検査は旧形式の packet を今の規則（書いた Final Review Minimum・Human Gate、今の PK1 の必須の節）で読み、Phase の値は評価しない（PH3・MN2・MN3）。起票の時点で `Final Review Minimum: 1` の R3 の lane（#212・#211・#210・#209・#197・#172。`git grep -h -e '^- Risk:' -e '^- Final Review Minimum:' -e '^- Human Gate:' origin/agent/<branch> -- <packet>` を各 branch で回した。どれも `Human Gate: ready,merge,manual`。R4 の #216・#194・#190 は 2 と `r4`、#201 は R3 で 2。AC8 で実装の段に確かめ直す）も、同期の後に 2 本へ上がらない。H5〜H9 は、各 lane が base 同期して PR の base に新しい helper が入った後から効く（D-099）。

### 1 PR に収めるか

v2 §8.3 の分ける案（2a 機械と merge-evidence・ci.md → 2b 文）を見た。1 PR に収める。理由: owner が Q5 で 2 本に分ける案（C）を選ばず B を選んだ（TD-502）。機械と文を同じ PR に入れれば規則と helper が食い違う期間が無い（v2 §8.1）。2a を先にすると、その間は文が今の規則を求め続ける。分ける条件: Plan Review が round 3 に届き、残る findings が文と機械の片方に集まるとき、Coordinator が `docs/DEV_WORKFLOW.md` Review Rules の round の天井の disposition（owner escalation）で 2a・2b への分割を owner に諮る。

## Non-scope

- 製品の runtime・画面・DB・bindings・traceability の生成物。
- repo の外の運用（`.local/**`、v2 §8.1 の段 0）と owner の個人の設定。
- GitHub の ruleset と `.github/policies/**`（required check の名は変えない）。
- 走っている lane の packet の書き換え、archive の packet・WER の書き換え。
- #204 の packet の範囲（上の「他の lane との所有と順」）。
- `scripts/ci/classify-changes.sh` の分類の変更。

## Acceptance Criteria

- AC1（helper）: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/tests/pr-gate.test.py` が exit 0 で、Matrix の PH1〜PH3・MN1〜MN5・AR1・AR4・C1〜C5・RC1〜RC3・GA1〜GA3・R2N1〜R2N3・CI2・RP1・RP2 と KEEP の helper の case が通る。
- AC2（計画の固定と先走りの検査）: `bash scripts/tests/plan-approve.test.sh` と `bash scripts/tests/workflow-git-checks.test.sh` が exit 0 で、Matrix の PA1〜PA4・PH4〜PH6・AR5 が通る。
- AC3（packet の検査）: `bash scripts/tests/doc-consistency-plan-packet.test.sh` が exit 0 で、Matrix の AR2・AR3・AR6・FL1〜FL3・PK1N が通る。
- AC4（CI）: `bash scripts/tests/ci-workflow.test.sh` が exit 0 で Matrix の CI1・CI4 が通る。`rg -n "Draft \(no merge evidence\)|ready_for_review" .github docs --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/decision-log.md' --glob '!docs/research/**'` が 0 件（`docs/research/**` は時点の調べで直さない。`docs/DEV_SETUP_CHECKLIST.md` と `docs/backlog.md` の当たりは Scope の drift の sweep の行で直す）。`ci-workflow.test.sh` は docs job の doc check の step が `WORKFLOW_BASE_SHA` を持つことも確かめる（CI4）。
- AC5（lane の一覧）: `bash scripts/tests/lanes.test.sh` が exit 0 で Matrix の LN1・LN2 が通る。
- AC6（回帰）: `bash scripts/tests/run-workflow-tests.sh` が exit 0。`bash scripts/check-workflow-git.sh` が exit 0。Draft の hosted の run（classifier `workflow=true` で full）が緑。
- AC7（文書）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-28-process-rebuild.md` が ERROR 0。`rg -n -e 'Owner Effort Budget' -e '介入 N 回目' -e 'Post-Merge Closeout' -e '直近の完了' -e 'Wave Registry' AGENTS.md CLAUDE.md docs .github .agents --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/decision-log.md' --glob '!docs/research/**'` が 0 件（本 packet と旧い packet は `docs/plans/**` の除外で外れる。`scripts/tests/**` は旧い packet の受理の fixture に語が残るので対象にしない）。
- AC8（同じ入力を全部の読み手に）: 実装の後の branch を元に一時の worktree を作り、(a) 上の「新しい packet の書式」の正例を埋めた合成の新形式の packet（R3・manual なし、R3・`## L3` あり、R4 の 3 本）と、(b) 起票の時点の open の lane の packet（`docs/plans/` の dated file。#216・#212・#211・#210・#209・#201・#197・#194・#190・#172 の各 branch の版）を 1 本ずつ `docs/plans/` に置いて commit し、`bash scripts/doc-consistency-check.sh --target plan <packet>`（PK1・PK4）が ERROR 0、`WORKFLOW_BASE_SHA=<置く前の commit> bash scripts/check-workflow-git.sh`（PK5・H2）が exit 0、helper の `parse_packet` と、合成の PR の JSON で `requirements` の結果（Minimum・manual・r4）が上の H3 の期待と一致する。負の例: 新形式の R3 で `## Contract Ledger` を欠く packet は PK1 が ERROR。command と出力を PR body に貼る。
- AC9（自分の検査で自分を緩めない）: 最終 head で `git worktree add <tmp> HEAD` → `git -C <tmp> checkout <PR の base の SHA> -- scripts` → `bash <tmp>/scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-28-process-rebuild.md`（`<tmp>` を cwd にして）が ERROR 0、同じ worktree で `bash scripts/check-workflow-git.sh` が exit 0。一時の worktree は確かめた後に消す（`git worktree remove <tmp>`）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/DEV_WORKFLOW.md` の `## Risk Tiers`・`## Plan Packet Rules`・`## Workflow State`・`## Wave Operation`・`## Owner Effort Budget`・`## Verification Gates`・`## Review Rules`・`## Contract Audit (R3/R4)`・`## Draft PR Checkpoint`・`## Post-Merge Closeout`。`docs/AGENT_OPERATING_MANUAL.md` の `## 座組`・`### 3.3 Capacity-degraded（役割担当の一時不能）`・`### 5.3 Plans.md cleanup prompt`。`docs/agent-guidance/merge-evidence.md` の `## 設計判断`（MG-D3・MG-D9）と #217 の MG-D13。`docs/ci.md` の `## Hosted Trigger Model`・`### Final Trigger Selection`。`AGENTS.md` の `## Session Start`・`## Decision and Approval Boundaries`。`docs/decision-log.md` の D-034・D-038・D-039・D-055・D-062・D-085・D-097・D-098・D-099・D-101・D-107・D-124・D-125・D-127 と #217 の D-144。
- 必要な設計成果物: workflow gate change → `docs/decision-log.md` の D-145 = updated in this PR（本 commit）。各正本の書き換え = updated in this PR（実装の段）。中身は上の「正本の文の最終形」と H1〜H14。
- 本 commit で正本の文を書き換えない理由: 書き換える文の多くは、同じ branch の検査（PK1・PK4・`reading-order-drift.test.sh`・`doc-consistency-plan-packet.test.sh`）が形を確かめている。文だけを先に変えると、branch の pre-push と hosted の docs・workflow の job が古い検査で落ちるか、検査を先に変えると plan-first の commit に実装が入る。文と検査と helper を同じ実装の段で変え、Plan Review には上の表と H1〜H14 の粒度で計画を読ませる（v2 §8.3 の「文の変更を計画の commit に入れる」案は取らない）。
- plan にしかない durable な判断の昇格先: 作り直しの決定は D-145。各 H の受理条件の細部は実装の段で merge-evidence に置く（helper の契約の正本）。
- 前提・制約と延期した design gap: (1) #217 の merge が先（H5・H6 の前提）。#217 の形が round 2 以降で変われば、本 lane は Gated Amendment で H5・H6 を合わせる。(2) H9 は MG-D3 の「Draft はマージ根拠となる check を発行しない」を置き換える（下の Contract Probe）。(3) 計画の review の発注の固定の問いが、packet の節と同じだけ拾うかは測れない（v2 §10.1 の 3）。作り直しの後の 3 lane で、問いが拾った finding の数を handoff に残す（Coordinator、repo の外）。
- 絶対保証の自己点検: 「計画の承認の前の実装を機械が止める」（H2）の例外は、(1) branch の版の classifier を使うので、同じ branch で classifier を書き換えると逃れうる（`scripts/**` の path の検査が別に止める）、(2) `--no-verify` の push（hosted の docs job の同じ検査が止める）。「旧い packet を拒まない」の例外は、旧い packet の Plan Commit・Amendments・Risk の形が壊れているとき（今と同じに止まる、fail-closed）。
- 判定: ready（決めきれなかった点は Review Focus に挙げる）。

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| source / workflow doc 新設・改名・削除 | 親文書の目次・索引の更新 | 新しい文書は作らない。`docs/DEV_WORKFLOW.md` の Source Index・Artifact Map を最終形に合わせる |
| scripts の新設 | `scripts/tests/run-workflow-tests.sh` に新しい test を登録 | `plan-approve.test.sh`・`lanes.test.sh` |
| Tauri command・function-design・REQ・route・画面 | — | 該当なし |

## Impact Review Lenses

not applicable: 実機・外部の tool・POS・CSV・operator の発見から始まる作業でない。owner の決定と repo の履歴の実測（v2 §4.1 の頻度の command）から始まり、GitHub Actions の挙動は下の Contract Probe で確かめた。

## Boundary / Wire Contract

- producer: `scripts/pr-gate.py` の `record`（RecordV1 の JSON）、`scripts/plan-approve.sh`（packet の `Plan Commit`・`Amendments` の行）、reviewer の報告（`REVIEWED_HEAD=` の行）。
- consumer: 同じ helper（PR の base の版、D-099）、`check-workflow-git.sh`（PK5・先走りの検査）、`doc-consistency-check.sh`（PK1・PK4）。
- wire type: RecordV1 は `version` 1 のまま。closure の形は #217 の `{head, base, audit}` と `{head, base, sync_from}` だけ（H6 は `sync_from` の形を使い、新しい形を足さない）。packet の Workflow State は `- Key: value` の行（Plan Commit・Amendments・Risk の 3 つを読む。旧い行は受けて評価しない）。
- internal type: 同じ dict。
- precision/range: SHA は 40 桁の小文字 hex。
- round-trip path: `plan-approve.sh` → packet → helper `parse_packet` → `capture` → `record`。
- invalid input: 短い SHA・祖先でない SHA（H1）、`REVIEWED_HEAD=` の欠け・重複（H11）。
- compatibility: 旧い packet（PH3）と今の record の形を受ける。新しい形の packet（Phase の無い）を今の main の helper は `packet fields missing/empty/duplicate` で拒むが、helper は PR の base の版だけが動き、本 lane の merge の後の base でしか新しい形の packet を判定しないので混ざらない。本 lane の merge の前に新しい形の packet を起票しない（本 packet は今の形）。

## Test Plan

Test Design Matrix: [test-matrices/2026-10-28-process-rebuild.md](test-matrices/2026-10-28-process-rebuild.md)

- targeted tests: AC1〜AC5 の command。
- negative tests: Matrix の PA2・PH1・PH4・PH6・MN2・MN4・AR1・C2〜C4・RC2・GA2・R2N2・CI2・RP2・FL2。
- compatibility checks: PH3・MN2・MN3・MN4・AR1・AC8。
- data safety checks: 合成の git repo・fake gh・合成の packet だけ。店のデータを使わない。
- main wiring/integration checks: Matrix の Main Wiring の 4 行。
- workflow: `bash scripts/tests/run-workflow-tests.sh`、`bash scripts/check-workflow-git.sh`、`bash scripts/doc-consistency-check.sh`、`--target plan`。Draft の hosted（full）。

## Review Focus

- H2 の先走りの検査の path の集合（v2 の 4 種に `env` と `scripts/**`・`.github/**` を足した）が、plan-first の commit（workflow の lane は正本の文を含みうる）を止めず、実装を全部止めるか。
- H4 で R0/R1 の移送の分岐を消さずに `Phase archive` の検査だけを外した形（v2 §6 H4 との違い）が妥当か。
- H6 の緩める範囲（docs だけ・`workflow=false`・計画の節が同じ・裁定の pointer）が TD-476 (2) に収まるか。gate の文書の P3 の是正も人の closure に回す形でよいか。
- H9 で MG-D3 を置き換えて、Draft の run の `Merge gate` を merge の証拠にしても、exact head の強さが同じか（下の Contract Probe）。
- H13 の起点が無いときを WARN にした形（v2 §6 H13 は ERROR の条件だけを書く）が、既存の 231 か所（`git grep -cE '[A-Za-z0-9_./-]+\.(md|rs|ts|tsx|py|sh):[0-9]+' origin/main -- docs ':!docs/archive'` の合計、起点 `bbea3314` で 231）を一斉に止めずに新しい引用を止めるか。
- 旧形式の packet の Minimum・Human Gate を書いた値のまま使う形で、走っている lane の条件が上がりも下がりもしないか。新形式で書いた `r4`・`manual` を落とさないか。
- active な packet の定義（起点の tree に無い dated packet）が、helper・PK1・PK4・PK5・H2 で 1 つにそろい、merge 済みの packet を直す R0 の PR と、走っている lane の packet の検査の両方を成り立たせるか。
- 新しい packet の書式の正例と旧形式の対応の表で、同じ packet を PK1・PK4・PK5・helper が同じに読むか（AC8）。
- 本 commit で正本の文を書き換えない判断（Design Readiness）。
- この変更で不要になる記述・条件は他に無いか（D-127）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-145 (1) 人は判断だけを書く | D-145 | 正本の文の最終形 | AC7 | 非対象 |
| D-145 (2) Plan Commit を script で固定 | DEV_WORKFLOW Plan Commit ancestry（PK5） | H1 | PA1〜PA4 | 非対象 |
| D-145 (3) Phase を外し、承認の前の実装を止める | DEV_WORKFLOW Workflow State（fail-closed） | H2 | PH1〜PH6 | 非対象 |
| D-145 (4) Minimum と Human Gate の導出 | DEV_WORKFLOW Workflow State（`Final Review Minimum`・`Human Gate`）、TD-484 | H3 | MN1〜MN5 | 非対象 |
| D-145 (5) archive へ移さない、closeout をなくす | DEV_WORKFLOW Post-Merge Closeout、merge-evidence MG-D9、D-101 | H4 | AR1〜AR6 | 非対象 |
| D-145 (6) L3 の使い回し C と docs の closure | merge-evidence MG-D13（#217）、DEV_WORKFLOW Wave Operation の L3 の箇条 | H5・H6 | C1〜C5・RC1〜RC3 | 非対象 |
| D-145 (7) GA の後の closure | merge-evidence の `FRESH_BROAD` の文、DEV_WORKFLOW Review Rules（Findings Freeze） | H7 | GA1〜GA3 | 非対象 |
| D-145 (8) R2 の packet なしの道 | DEV_WORKFLOW Risk Tiers・Plan Packet Rules、TD-498 | H8 | R2N1〜R2N3 | 非対象 |
| D-145 (9) 同じ head の CI を 1 回 | docs/ci.md Hosted Trigger Model・Final Trigger Selection、merge-evidence MG-D3 | H9 | CI1〜CI4 | 非対象 |
| D-145 (10) reviewed head を報告から | merge-evidence の実行手順 | H11 | RP1・RP2 | 非対象 |
| D-145 (5) active な packet の定義（helper・PK1・PK4・PK5・H2 で 1 つ） | DEV_WORKFLOW Plan Commit ancestry（PK5 の対象）、D-107 | H2・H4 と「active な packet の定義」 | AR4〜AR6・PH6 | 非対象 |
| D-145 (10) lane の一覧 | AGENTS Session Start | H12 | LN1・LN2 | 非対象 |
| D-145 (10) 新しい `path:行` を足さない | D-125 | H13 | FL1〜FL3 | 非対象 |
| D-145 (10) packet の最小形 | DEV_WORKFLOW Plan Packet Rules、template | H14 と「新しい packet の書式」 | PK1N・AC8 | 非対象 |
| D-145 (11) Owner Effort Budget を消す | DEV_WORKFLOW Owner Effort Budget、D-038、TD-501 | 文と PK1 の必須の節 | PK1N・AC7 | 非対象 |
| D-145 (12) Plans は関門・ブロッカー・製品の決まっていない判断だけ | DEV_WORKFLOW Artifact Map、D-101、TD-487 | `docs/Plans.md` と PK4 | AR3・AC7 | 非対象 |
| D-145 (13) Codex が使えない間の Final | MANUAL §3.3、TD-499 | 文 | AC7 | 非対象 |
| D-145 (14) Codex の起動と束ねた承認の委任 | AGENTS Decision and Approval Boundaries、TD-500 | 文 | AC7 | 非対象 |
| 隣接（変えない）: base の版の helper が判定 | merge-evidence、D-099 | 変えない | KEEP | 非対象 |
| 隣接（変えない）: 古い head/base の record を拒む・broad の不足を拒む・R4 を使い回さない | merge-evidence の状態と非CI記録 | 変えない | KEEP | 非対象 |
| 隣接（変えない）: 不可逆 finding の 4 項目・Findings Freeze・round の上限 3 | DEV_WORKFLOW Review Rules | 文を残す | AC7（消えていないことを `rg` で確かめる） | 非対象 |

## Contract Probe

- Draft と Ready で選ぶ job が同じか（H9 の前提、v2 §10.2）: `rg -n 'draft|event_name' .github/workflows/ci.yml` → `draft` を参照するのは `merge_gate` の name 式の 1 か所だけで、ほかは `changes` の step の `workflow_dispatch` の分岐（dispatch は常に full、`docs/ci.md` CI-TRIGGER-D1）。`rg -n 'draft' scripts/ci/classify-changes.sh scripts/ci/check-required-jobs.sh` → 0 件。よって `pull_request` の event では Draft と Ready で同じ job を選ぶ。
- MG-D3 の理由（H9 で置き換える物）: `docs/agent-guidance/merge-evidence.md` の `## 設計判断` の MG-D3 は「docs-onlyにも軽いCIを実行する。Draftはマージ根拠となるcheckを発行しない」で、棄却した案の列は paths-ignore と skip token と全 docs の full。Draft の check を根拠にしない理由は列に書かれていない。helper は Ready・merge の時点で同じ head の run を照合する（`pr-gate.py` の `ci`）ので、Draft の run の `Merge gate` を受けても別の head の証拠は通らない（Matrix CI2）。
- 計画の承認の前の実装を今の機械が止めていないこと（H2 の「強める」の根拠）: `scripts/check-workflow-git.sh` の冒頭の説明は Phase の 8 値と PK5（Plan Commit が pending の packet は対象外）だけを挙げる。`pr-gate.py` の `snapshot` は capture で `phase == implementing` を求めるが、push は止めない。pre-push と hosted の全経路は未確認。
- 走っている lane の旧い packet の形: 起票の時点の open の PR の packet は全部 Workflow State の 11 行の形（#217・#204 の packet を `git show origin/<branch>:<packet>` で読み、10 本の lane の `Risk`・`Final Review Minimum`・`Human Gate` の行を `git grep -h` で読んだ〈上の「他の lane との所有と順」〉。全文の受理は AC8 で実装の段に確かめる）。
- merge 済みの packet の Plan Commit は main の祖先でない（active な packet の定義の前提）: `git merge-base --is-ancestor 7895aca82b11016d6a22c69ef30257e65d640db3 origin/main` → exit 1、`git merge-base --is-ancestor 33831dd3c01266b0b458c0d8c8d189ad9895672c origin/main` → exit 1（`docs/plans/` に残る #214・#193 の packet の Plan Commit。`origin/main` = `bbea3314`）。

## Data Safety

- commit しないもの: 回答台帳の原文（TD の番号で引く）、record の中身、店のデータ、`.local/**`。
- local だけ: `.local/pr-gate/` の capture（今のまま ignored）、v2 の設計案。
- 合成だけ: test の git repo・fake gh の state・合成の packet。

## Implementation Results

Fill after implementation.

## Review Response

### Plan Review round 1（起点 `190fed4d26c1e5ec871c30f693ae8b4b2f4f6dd1`、判定 reject）

Codex（P1 1・P2 3）と fresh Opus 5.5（P2 5・P3 8）の findings を Coordinator が裁定し、下の表の全件を受理した（受理しなかったもの: なし）。

| ID | 出所 | 重大度 | 処置 | 直した節 |
|---|---|---|---|---|
| X1 | Codex #1 | P1 | 導く `r4` を「Risk が R4、または Workflow State の `Human Gate` に `r4` がある」にし、書いた `manual` も落とさない。R3 + 明示の r4 を拒む case を足す | packet H3・安全の境界の表（Human Gate の行）、D-145 Decision (4)、Matrix MN3・MN4・MN5 |
| X2 | Codex #2 | P2 | H5・H6 の L3 の比較対象を、旧形式で `## L3` が無ければ `## Test Plan` 節の全体にし、取れなければ使い回さない。旧形式の基準の変更を拒む case を足す（#210 の型） | packet「新しい packet の書式」の表の最後の行・H5・H6、Matrix C5・RC3 |
| X3 | Codex #3、Opus F6 | P2 / P3 | 新しい packet の書式を Workflow State 内の `- Key: value` の 3 行に統一し、正例 1 本と旧形式との対応の表を置く（見出しは今の英語の名を使い、旧い節名の対応を少なくした）。同じ入力を PK1・PK4・PK5・helper に通す検証を AC8 にした | packet「新しい packet の書式」・H14・template の行・AC8・Review Focus、D-145 Decision (10)、Matrix FMT1・PK1N |
| X4 | Codex #4 | P2 | H13・FL1 に D-125 (2)・(3) と `docs/DOC_STYLE_GUIDE.md` §1 の適用除外（commit を添えた backlog の行、dated の記録、decision-log の本文、dated の packet と Matrix）を反映し、正例を足す | packet H13、Matrix FL1・FL3 |
| X5 | Opus F1 | P2 | 「active な packet」を「起点の tree に無い dated packet」と 1 か所で定義し、helper・PK1・PK4・PK5・H2 をそろえる。merge 済みの packet は R0/R1 の道で直せる（Workflow State の行の変更は ERROR）、link 切れは WARN、起点が取れなければ ERROR | packet「active な packet の定義」・H2・H4・安全の境界の表（fail-closed）・Contract Ledger・Contract Probe、D-145 Decision (5)、Matrix AR4・AR5・AR6・PH6 |
| X6 | Opus F2 | P2 | 旧形式の packet は書いた `Final Review Minimum`・`Human Gate` をそのまま使い、新形式だけで導く（非遡及。TD-484 は新しい既定） | packet H3・安全の境界の表（独立 review）・他の lane との所有と順・Review Focus、D-145 Decision (4)、Matrix MN2 |
| X7 | Opus F3 | P2 | AC4 の `rg` から `docs/research/**` を除外し、`docs/DEV_SETUP_CHECKLIST.md` と `docs/backlog.md` の該当の行を drift の sweep の行に足す | packet AC4・正本の文の最終形の最後の行 |
| X8 | Opus F4 | P2 | H7 の比べる節を H6 と同じ「計画の節」（Scope・Acceptance Criteria・Contract Ledger）にし、定義を 1 か所に置く | packet「計画の節」・H6・H7・安全の境界の表（独立 review）、D-145 Decision (7)、Matrix GA3 |
| X9 | Opus F5 | P2 | R2 の行き先を 1 文で決める: `workflow=true` か `unknown=true` の変更は R3 として起票、`rust`・`frontend` の R2 は packet なし | packet Goal・H8、D-145 Decision (8)、Matrix R2N2 |
| X10 | Opus F7 | P3 | `lanes.sh` は PR ごとに base の版の helper で status を取り、packet の無い PR は PR body から `--risk`・`--manual` を補い、exit 2 は理由を出して飛ばす | packet H12、Matrix LN2 |
| X11 | Opus F8 | P3 | `ci.yml` の docs job の doc check の step に `WORKFLOW_BASE_SHA` を渡す行を Scope に足し、test で確かめる | packet 予定の file（`ci.yml` の行）・H13・AC4、Matrix CI4 |
| X12 | Opus F9 | P3 | `plan-approve.sh` に「reviewer の読んだ SHA から HEAD までの差分が空か packet だけ」の検査を足す | packet H1、Matrix PA4 |
| X13 | Opus F10 | P3 | R2 の画面の目視を `--manual required` と目視の evidence の manual の記録に結び付ける | packet Ordinary Operation の R2 の行・H8、Matrix R2N3 |
| X14 | Opus F11 | P3 | Superseded の列に D-107 を足す | packet 予定の file（decision-log の行）、D-145 Compatibility |
| X15 | Opus F12 | P3 | PK1 の `Data Safety` の必須を、新形式の R3 では発注の固定の問いへ移し（緩める）、R4 は残すと決めて安全の境界の表に載せる | packet 安全の境界の表・H14・template の行、Matrix PK1N |
| X16 | Opus F13 | P3 | 冒頭の「今の規則で裁く」を「helper は base の版、bash の検査は branch の版」と書き直し、本 packet を今の形に保つことと base の版の検査でも回すこと（AC9）を手当てにした | packet 冒頭の段落・安全の境界の表・AC9 |

先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。
