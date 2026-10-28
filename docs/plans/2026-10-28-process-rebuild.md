# Plan Packet: 開発の手続きの作り直し（D-145）

wave に属さない単独の lane。開発の手続き（packet の形・Workflow State・review と L3 の取り直し・closeout・Plans・CI の重複・owner の手）を、守りたいことの芯から組み直す workflow の lane。helper（`scripts/pr-gate.py`）・検査（`scripts/doc-consistency-check.sh`・`scripts/check-workflow-git.sh`）・hosted CI（`.github/workflows/ci.yml`）・その test と、手続きの正本の文（`AGENTS.md`・`CLAUDE.md`・`docs/DEV_WORKFLOW.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/agent-guidance/merge-evidence.md`・`docs/ci.md`・template ほか）を 1 本の PR で変える。製品の runtime（`src/**`・`src-tauri/**`）は変えない。

出所: owner の決定（repo 外の回答台帳 TD-474〜478〈2026-10-27〉、TD-479〜502〈2026-10-28〉）。所感 TD-475（小さな見直しでも大規模になる今の体制はおかしい）・TD-478（芯から組み直す）・TD-489（ゼロからすっきりした形へ、見直せるだけ見直す）を受け、Coordinator が作らせた設計案（repo の外の `.local/reports/process-slimming-2026-10-27/rebuild-proposal-v2.md`、以下「v2」）の §9 の 5 問に owner が答えた: Q1 = A（TD-498）、Q2 = C（TD-499）、Q3 = A（TD-500）、Q4 = A（TD-501）、Q5 = B（TD-502）。そのほか TD-481（同じ head の CI を 1 回に、優先度は下）・TD-483（表示だけの修正は R2）・TD-484（R3 の Final は 2 本を既定にし helper に守らせる）・TD-487（Plans は関門・ブロッカー・製品の未決判断だけ、完了は git log、進捗は handoff）。

規模と手法: 起票（本 commit）は本 packet・Test Design Matrix・`docs/decision-log.md` の D-145（plan-first）。正本の文の書き換えと helper・検査・CI・test の変更は plan-approved の後の実装の段で、#217 の merge の後に `origin/main` を単段で取り込んでから始める（下の「#217・#204 との順」）。正本の文を本 commit で書き換えない理由は下の Design Readiness。

この PR 自身は、merge されるまで今の helper（PR の base の版、D-099）と今の規則（`docs/DEV_WORKFLOW.md` の Workflow State・Plan Packet Rules、PK1〜PK5）で裁く（v2 の K12）。D-145 の新しい規則をこの PR に先取りで当てない。例外は owner の 1 回限りの決定 TD-502（下の Plan Reviewer の行）だけで、座組表の運用の本数を変えるもので helper の強制は変えない。

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
- R2 の lane（表示だけの修正を含む）は packet と計画の review なしに、PR body の 5 行と差分の review 1 本で merge まで進む。
- 走っている lane（起票の時点の open の PR 13 本）の packet を書き換えずに、新しい helper・検査がそれらを受ける。

### 失敗定義

- 計画の承認の前の実装、古い head の証拠、Writer 自身の review、R4 の承認の使い回し、壊れた packet のどれかを、新しい helper・検査が今より通しやすくする（緩めると packet に書いた H6・H8 の 2 か所を除く）。
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
| R2 の表示だけの修正の branch | Writer が実装 → PR body に目的・範囲・非目的・AC・Risk の 5 行 → `pr-gate.py capture --risk R2 --manual not-required` → 差分の review 1 本 → record | packet・計画の review・Plan Commit なしで Draft まで進む | review が P1/P2 0、画面なら目視 1 | R2N1・R2N2 |
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
| `docs/decision-log.md` | 末尾に D-145。置き換わる D（D-034・D-038・D-055・D-097・D-101・D-124〈#217 の D-144 の後の残り〉）の末尾に `Superseded in part by: D-145` の行 | D-145 は本 commit、Superseded の行は実装 |
| `scripts/plan-approve.sh`（新設） | H1 | 実装 |
| `scripts/pr-gate.py` | H2・H3・H4・H5・H6・H7・H8・H9（`ci`）・H11 | 実装 |
| `scripts/check-workflow-git.sh` | H2（Phase の検査を外し、先走りの検査を足す） | 実装 |
| `scripts/doc-consistency-check.sh` | H2（PK4 の Phase）・H4（PK1・PK4 の対象、Plans の pointer の検査を外す）・H13・H14 | 実装 |
| `scripts/lanes.sh`（新設） | H12 | 実装 |
| `.github/workflows/ci.yml` | H9（`merge_gate` の name 式、trigger の `ready_for_review`） | 実装 |
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
| `docs/templates/plan-packet.md` | v2 §2.5 の最小形（Risk・Plan Commit・Amendments・Goal・Scope・AC・設計正本・契約の一覧・テストの表・L3・復旧・当たるときだけの 3 項目） | Workflow State の 11 行の雛形、Owner Effort Budget、Ordinary Operation・Registration・Impact Review Lenses・Boundary/Wire・Contract Probe の節（発注の固定の問いへ移す）、Implementation Results・Review Response（PR の comment へ） |
| `docs/templates/test-design-matrix.md` | 削除せず、旧い packet が引く参照として残し、冒頭に「新しい packet は packet の `## テストの表` に書く」 | — |
| `docs/templates/subagent-review-packet.md` | 計画の review と closure の発注の固定の問い。reviewer は読んだ SHA を `REVIEWED_HEAD=` の 1 行で報告する（H11） | Review Response を読ませない除外の指示（packet から消えるので不要） |
| `.github/pull_request_template.md` | 要約・範囲・検証の結果（報告を指す）・残り。R2 は目的・範囲・非目的・AC・Risk の 5 行 | Plan Packet・Source docs・helper status の link・介入 N/M・Dashboard / archive follow-up |
| `docs/Plans.md` | 導入の前の関門・ブロッカー・製品の決まっていない判断・参照（TD-487） | 現在のフェーズ・次の行動・直近の完了・Wave Registry |
| `docs/PROJECT_HANDOFF.md`・`docs/project-profile.md`・`.agents/skills/inventory-workflow-start/SKILL.md`・`.agents/skills/inventory-implementation/SKILL.md`・`.agents/skills/test-design/SKILL.md`・`docs/backlog.md`（Wave Registry の項目） | 消える節・語への参照を新しい形に直す（drift の sweep。下の AC7） | — |

### helper・検査・CI の変更（v2 §6 の番号）

- H1 `scripts/plan-approve.sh <packet> <SHA>` と `--amend <SHA>`: SHA が 40 桁の小文字 hex で branch の HEAD の祖先、packet の `Plan Commit` が `pending`（`--amend` では SHA が Plan Commit の子孫で `Amendments` に無い）を確かめ、その行だけを書き換えて packet だけの commit を作る。push はしない。
- H2 Phase を外す: `parse_packet` は Phase を必須にせず、旧い packet の Phase 行は受けて評価しない。`snapshot`・`nonci`・`status` の `phase == implementing` を `plan_commit != pending` に置き換える。`check-workflow-git.sh` の Phase の 8 値の検査を外し、新しい検査を足す: 差分（PK5 と同じ起点）が触る packet のどれかが `Plan Commit: pending` で、同じ差分に classifier（branch の版の `scripts/ci/classify-changes.sh`）の `rust`・`frontend`・`generated`・`env`・`unknown` のどれかが true、または `scripts/**`・`.github/**` の path があれば ERROR。起点が取れなければ全 packet と全差分で判定する（fail-closed）。v2 §6 H2 の 4 種に `env` と workflow の実行 code の path を足した（workflow の lane の helper の先走りを止めるため。`workflow=true` 全体は docs も含むので使わない）。
- H3 `requirements` で Minimum を導く: R2 = 1、R3 = 2、R4 = 2、classifier `workflow=true` なら 2。packet に `Final Review Minimum` があれば導いた値との大きい方。Human Gate は ready,merge を常に、r4 は R4、manual は packet の `## L3` 節があるとき、または旧い packet の `Human Gate` に manual があるとき。`approved packet condition changed` は Risk と `## L3` 節の有無で照合し、旧い packet は今の 3 field も照合する。
- H4 archive への移送をなくす: R0/R1 の道の `moved packet is not Phase archive` の検査を外す（`docs/archive/plans/` への移動は受け、削除だけ・archive の外への移動は今のまま拒む。v2 §6 H4 は移送の分岐ごと消す案で、本 packet は #215 の型を通しつつ active な packet の黙った削除を止める形に絞った）。PK1・PK4 の対象を、差分が触る `docs/plans/` の packet にする（PK5 と同じ起点。取れなければ全 packet）。PK4 の `docs/Plans.md` の `## 次の行動` の pointer の検査を外す。`--target plan PATH` の明示の検査は今のまま。
- H5 L3 の使い回し C: #217 が足す同期だけの条件の関数の隣に、「manual の版から今の head までの lane の commit（1 親）の path が、classifier で `docs` だけ（`workflow=false`）、`--no-renames` で列挙、packet の `## L3` 節が byte で同じ」の条件を足し、#217 の A・B と組み合わせて manual を引き継ぐ。R4 は引き継がない。
- H6 `--review-stage docs`: H5 と同じ条件で、旧 record の review が pass、broad の Plan 契約が今の packet と同じ、packet の `## Scope`・AC・`## 契約の一覧`（旧い packet は `## Acceptance Criteria`・`## Contract Ledger`）が byte で同じ、`--evidence` に P3 だけと裁定した pointer があるときだけ、`{head, base, sync_from}` の closure を書く（#217 の `--review-stage sync` と同じ形）。`workflow=true` の docs は受けない。
- H7 GA の後: broad の版と今の版で packet の `## Scope` と AC の節が byte で同じなら、`FRESH_BROAD` の代わりに closure を求める。節が読めなければ今のまま `FRESH_BROAD`。
- H8 R2 の packet なしの道: `--risk R2` を受け、Minimum 1・`plan_commit` null・`--manual` 必須。classifier の `workflow`・`rust`・`unknown` が true、または diff が active な packet を触るなら拒む。
- H9 同じ head の CI を 1 回に: `merge_gate` の name を常に `Merge gate` にし、trigger から `ready_for_review` を外す。helper `ci()` は同じ head の最新の run が `pull_request`（Draft を含む）か `workflow_dispatch` で成功し `Merge gate` が 1 つなら受ける（今の照合は全部残す）。Ready の後の push を pre-push が拒む挙動は今のまま。
- H11 `record --report FILE`: FILE の `REVIEWED_HEAD=<40hex>` の 1 行を読み `--reviewed-head` に使う。capture の head との照合は今のまま。
- H12 `scripts/lanes.sh`: open の PR ごとに番号・branch・差分が触る packet・head・helper status の blocker を 1 表で出す。read-only。
- H13 生きた docs に `path:行` を新しく足したら ERROR（差分の `+` 行だけ。既存の行は対象外）。起点が無ければ WARN。#204 の検査（D-125 の目的）を、この縮めた形で置き換える。
- H14 PK1 の必須の節を v2 §2.5 に合わせる（R2+ は Risk・Goal・Scope・AC、R3+ は設計正本・契約の一覧・テストの表）。旧い packet の節は在れば受ける。
- H10（`.local/codex-orders/new-order.sh`）は repo の外で本 PR の範囲の外（Non-scope）。

### 安全の境界ごとの扱い

D-098 が DEV_WORKFLOW Workflow State で挙げる境界、AGENTS の Safety・npm ガード、既存テストを弱めない規則について、項目ごとに「緩める / 同じ強さを別の形で守る / 強める / 変えない」を書く。

| 境界 | 本 PR の変更 | 扱い | 根拠 |
|---|---|---|---|
| 古い証拠の拒否 | H5（docs だけの lane の commit の後の L3 の使い回し）、H9（Draft の run を merge の証拠に）、H11（報告から reviewed head） | 同じ強さを別の形で守る。runtime・生成物・未知の path・L3 節の変更では使い回さない。CI は同じ head の run だけ。reviewed head は capture の head と照合 | Matrix C2・C3・CI2・RP1 |
| 独立 review | H3（Minimum の導出）は強める（R3 は 2 本に上がる、TD-484）。H7（GA の後の closure）は同じ強さを別の形で守る（範囲が変われば fresh broad）。H6（docs だけの commit の機械の closure）は **緩める**: lane が書いた P3 の docs の文が人の review を経ずに入る。範囲を TD-476 (2) に限り、gate の文書・計画の節の変更と裁定の pointer の無いものは受けない | owner の決定 TD-476 (2)。Matrix RC2・GA2・MN2 |
| Plan Commit の固定 | H1（script が書く）は同じ強さ（PK5 と helper の照合は今のまま）。H8（R2 の packet なしの道）は **緩める**: R2 から Plan Commit の固定を外す。害は docs の文と表示に留まり、gate・runtime の変更は R2 の道で受けない | owner の決定 TD-498（Q1 = A）。Matrix R2N2 |
| 不可逆 finding の 4 項目 | 文を DEV_WORKFLOW の review の規則に残す | 変えない | — |
| fail-closed | H2 は強める（承認の前の実装を機械が止める。今は止めていない〈`check-workflow-git.sh` の冒頭の説明と `pr-gate.py` の `snapshot` を読んだ。pre-push と CI の全経路は未確認〉）。H4・H14 は同じ強さを別の形で守る（差分が触る packet は今と同じに検査し、差分が取れなければ全 packet）。壊れた packet・enum の外の Risk は今のまま止める | Matrix PH4・PH6・AR2 |
| owner の Human Gate・R4 の承認 | H3 で導く（manual は `## L3` 節、r4 は R4）。束ねた Ready/merge の承認は各 PR の helper `merge` を省かない | 同じ強さを別の形で守る | Matrix MN3・MN4 |
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
- ほかの走っている lane（#216・#212・#211・#210・#209・#201・#197・#194・#190・#172）の packet は書き換えない。新しい helper・検査は旧い packet の行を受けて評価しない（PH3・MN2・MN3）。H5〜H9 は、各 lane が base 同期して PR の base に新しい helper が入った後から効く（D-099）。

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

- AC1（helper）: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/tests/pr-gate.test.py` が exit 0 で、Matrix の PH1〜PH3・MN1〜MN4・AR1・C1〜C4・RC1・RC2・GA1・GA2・R2N1・R2N2・CI2・RP1・RP2 と KEEP の helper の case が通る。
- AC2（計画の固定と先走りの検査）: `bash scripts/tests/plan-approve.test.sh` と `bash scripts/tests/workflow-git-checks.test.sh` が exit 0 で、Matrix の PA1〜PA3・PH4〜PH6 が通る。
- AC3（packet の検査）: `bash scripts/tests/doc-consistency-plan-packet.test.sh` が exit 0 で、Matrix の AR2・AR3・FL1・FL2・PK1N が通る。
- AC4（CI）: `bash scripts/tests/ci-workflow.test.sh` が exit 0 で Matrix の CI1 が通る。`rg -n "Draft \(no merge evidence\)|ready_for_review" .github docs --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/decision-log.md'` が 0 件。
- AC5（lane の一覧）: `bash scripts/tests/lanes.test.sh` が exit 0 で Matrix の LN1 が通る。
- AC6（回帰）: `bash scripts/tests/run-workflow-tests.sh` が exit 0。`bash scripts/check-workflow-git.sh` が exit 0。Draft の hosted の run（classifier `workflow=true` で full）が緑。
- AC7（文書）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-28-process-rebuild.md` が ERROR 0。`rg -n -e 'Owner Effort Budget' -e '介入 N 回目' -e 'Post-Merge Closeout' -e '直近の完了' -e 'Wave Registry' AGENTS.md CLAUDE.md docs .github .agents --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/decision-log.md' --glob '!docs/research/**'` が 0 件（本 packet と旧い packet は `docs/plans/**` の除外で外れる。`scripts/tests/**` は旧い packet の受理の fixture に語が残るので対象にしない）。
- AC8（旧い packet の受理）: 実装の後の branch で、起票の時点の open の lane の packet（`docs/plans/` の dated file。#216・#212・#211・#210・#209・#201・#197・#194・#190・#172 の各 branch の版）を `python3 -c` で helper の `parse_packet` に通し、全部 exit 0（command と出力を PR body に貼る）。

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
- 旧い packet の明示の Minimum・manual を下限として尊重する形で、走っている lane の条件が下がらないか。
- 本 commit で正本の文を書き換えない判断（Design Readiness）。
- この変更で不要になる記述・条件は他に無いか（D-127）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-145 (1) 人は判断だけを書く | D-145 | 正本の文の最終形 | AC7 | 非対象 |
| D-145 (2) Plan Commit を script で固定 | DEV_WORKFLOW Plan Commit ancestry（PK5） | H1 | PA1〜PA3 | 非対象 |
| D-145 (3) Phase を外し、承認の前の実装を止める | DEV_WORKFLOW Workflow State（fail-closed） | H2 | PH1〜PH6 | 非対象 |
| D-145 (4) Minimum と Human Gate の導出 | DEV_WORKFLOW Workflow State（`Final Review Minimum`・`Human Gate`）、TD-484 | H3 | MN1〜MN4 | 非対象 |
| D-145 (5) archive へ移さない、closeout をなくす | DEV_WORKFLOW Post-Merge Closeout、merge-evidence MG-D9、D-101 | H4 | AR1〜AR3 | 非対象 |
| D-145 (6) L3 の使い回し C と docs の closure | merge-evidence MG-D13（#217）、DEV_WORKFLOW Wave Operation の L3 の箇条 | H5・H6 | C1〜C4・RC1・RC2 | 非対象 |
| D-145 (7) GA の後の closure | merge-evidence の `FRESH_BROAD` の文、DEV_WORKFLOW Review Rules（Findings Freeze） | H7 | GA1・GA2 | 非対象 |
| D-145 (8) R2 の packet なしの道 | DEV_WORKFLOW Risk Tiers・Plan Packet Rules、TD-498 | H8 | R2N1・R2N2 | 非対象 |
| D-145 (9) 同じ head の CI を 1 回 | docs/ci.md Hosted Trigger Model・Final Trigger Selection、merge-evidence MG-D3 | H9 | CI1〜CI3 | 非対象 |
| D-145 (10) reviewed head を報告から | merge-evidence の実行手順 | H11 | RP1・RP2 | 非対象 |
| D-145 (10) lane の一覧 | AGENTS Session Start | H12 | LN1 | 非対象 |
| D-145 (10) 新しい `path:行` を足さない | D-125 | H13 | FL1・FL2 | 非対象 |
| D-145 (10) packet の最小形 | DEV_WORKFLOW Plan Packet Rules、template | H14 | PK1N | 非対象 |
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
- 走っている lane の旧い packet の形: 起票の時点の open の PR の packet は全部 Workflow State の 11 行の形（#217・#204 の packet を `git show origin/<branch>:<packet>` で読んだ。ほかは AC8 で実装の段に確かめる）。

## Data Safety

- commit しないもの: 回答台帳の原文（TD の番号で引く）、record の中身、店のデータ、`.local/**`。
- local だけ: `.local/pr-gate/` の capture（今のまま ignored）、v2 の設計案。
- 合成だけ: test の git repo・fake gh の state・合成の packet。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。
