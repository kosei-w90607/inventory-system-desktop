# マージ検証をGitHubへ集約し、証跡の手作業を減らす

## Workflow State

- Phase: plan-gate
- Risk: R3
- Execution Mode: codex-only
- Plan Commit: pending
- Amendments: none
- Coordinator: owner（起草・調査は現在のCodex）
- Writer: Codex（ownerがこのセッションで設計を詰めるよう依頼。実装は本依頼の範囲外）
- Plan Reviewer: Opus（独立fresh context、xhigh。GitHub/CI/状態移行が交差する計画のため）
- Final Reviewer: 非Codexの独立Double Audit（実装後。担当は実装開始時に可用性で確定）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: 実装開始 / ruleset有効化 / Ready / merge

現行のlegacy workflowで設計・Plan Gateを通す。新modeの保護をこの計画に先取り適用しない。ownerは「GitHubで強制し、docs・後処理は軽いPR経路」を選択した。現在Codexが起草し、別モデルがPlan Review、ownerが採否を決める個別依頼であり、D-084の一般の役割制限を書き換えない。

## Owner Effort Budget

- 介入回数上限: 3（規範の既定値）
- 実働時間上限: 30分（規範の既定値、実績は未実測）
- relay 往復上限: 2（規範の既定値）
- Plan Review round 天井: 3（規範の既定値）

今回の設計方式の選択を介入1回目として記録。残りは実装の採否と、有効化/Ready/mergeの具体的な確認にまとめる。過去PRの例外は継承しない。外部モデルへのrepoの公開可能な指示・設計・差分のread-only送信許可は既存の明示承認を引き継ぐ。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

merge gate、CI選択、Workflow Stateの保存先、main保護を変える。アプリやDBへの変更はないが、古いgreenやskipで未検証の版がmergeされない検証が必要。

## Goal

Goal Invariant:

### 最小完了条件

必要な検証・独立review・owner承認を維持し、通常のReady/mergeでAIがSHAを手集めせず、状態記録だけのcommit/full再実行を増やさない。GitHubがmainへの条件を強制し、docs/closeoutは軽いPR経路で完了する。

### 失敗定義

古いhead/base、必要jobのskip/欠落、偽の成功、未了review/manual/R4でmergeできること。保護を有効にして正規のdocs/closeoutを閉塞させること。証跡管理を別の巨大な状態管理基盤へ移しただけになること。

### 非目的

Plan Gateや独立性の撤廃、アプリ/DB/POS変更、依存更新、global Skill/plugin整理、独自署名・DB・GitHub bot・merge queueの導入、発注書46の実行。

## Scope

- S1 CI: `.github/workflows/ci.yml`、`.github/merge-gate-ruleset.json`（新規desired policy）、`scripts/ci/classify-changes.sh`、`scripts/ci/check-required-jobs.sh`（新規）、`scripts/tests/run-workflow-tests.sh`（新規）を使い、全体aggregate・Draftのcheck名分離・docs経路・検証parityを実装する。
- S2 helper: `scripts/pr-gate.py`（新規）。status/capture/record/ready/mergeと、PR内の非CI記録、表示用local cache。既存gh/Python/Bashを使い、新規packageを導入しない。
- S3 state: `scripts/doc-consistency-check.sh`、`scripts/check-workflow-git.sh`、`scripts/pre-push.sh`、`scripts/local-ci.sh`。github markerの新packetとlegacyを区別し、新modeの実装後state-only/三点一致を撤去。Plan Commit/Amendmentsの保護は残す。
- S4 tests: 既存`classify-changes.test.sh`、`ci-workflow.test.sh`、`local-ci.test.sh`、`pre-push.test.sh`、`workflow-git-checks.test.sh`、`doc-consistency-plan-packet.test.sh`、`reading-order-drift.test.sh`。新規`merge-gate.test.sh`、`pr-gate.test.py`。synthetic fixtureで失敗を検出し、helperを実際の呼出経路へ接続する。
- S5 docs: `AGENTS.md`、`CLAUDE.md`、`docs/{DEV_WORKFLOW,ci,AGENT_OPERATING_MANUAL,project-profile,code_review,decision-log,Plans,PROJECT_HANDOFF}.md`、`docs/agent-guidance/{README,shared,merge-evidence}.md`、`docs/templates/{plan-packet,test-design-matrix,subagent-review-packet,pr-review-prompt,workflow-effectiveness-review}.md`、`.github/pull_request_template.md`、`.codex/README.md`。
- S6 Skills: `.agents/skills/{inventory-workflow-start,inventory-implementation,inventory-code-review,pr-review,review-only-subagent}/SKILL.md`、`.claude/rules/{commands,review-workflow,implementation-quality}.md`、`.claude/commands/{check,test,phase-complete,plan-rally,design-review}.md` の今回の契約参照だけを同期。無関係な本文は編集しない。
- S7 activation: 現repoのmain rulesetの具体的payload・snapshot・read-back手順を用意し、ownerが有効化を承認した後にだけ適用する。検証用GitHub fixtureは合成資料だけとし、mainを変更する負例を実運用のmainへ投げない。

この準備段階で編集するのはsource design、本packet、Matrix、indexとこのbranchのPlansだけ。既存の実行コード・CI・GitHub設定は変更しない。

## Non-scope

- アプリ、DB、実POS/店舗データ、認証情報、公開範囲の変更。
- 新GitHubアカウント/外部サービス、native review承認者の増員。
- global/user-local config、発注書46、既存archiveのschema一括変換。
- 既存doc WARN、npm/Cargo advisoryの便乗修正。

## Acceptance Criteria

- AC1: `merge-gate.test.sh`で必要jobのfailure/cancelled/skipped/欠落/未知値、分類失敗が非0。docsのみではdocs/aggregateが成功し、Rust/frontendを必要扱いしない。
- AC2: `ci-workflow.test.sh`とlive dogfoodで、Draft runがrequired名`Merge gate`のsuccess/skippedを作らず、Readyの対象job成功後だけ同名gateがsuccessになる。paths-ignore/本文skip tokenによる抜け道がない。
- AC3: `doc-consistency-plan-packet.test.sh` / `workflow-git-checks.test.sh`の新旧fixtureで、legacyの拒否条件とPlan Gate/Plan Commit/Amendmentsを維持し、新modeは実装後のphase保存のためにtracked変更を要求しない。未知modeや必要field不足は非0。
- AC4: `pr-gate.test.py`でstale head/base、複数/不正author記録、必要review/manual/R4欠落、API失敗、誤repo、shell特殊文字、確認後head更新を拒否。正常系では必要APIだけで結果を返し、無関係なPR本文を変更しない。
- AC5: 新modeの通常caseで、Ready/merge前後の`git status`が不変、capture/recordは自動取得した対象版に結び付き、SHA手転記と実装後state-only commitを要求しない（規範の目標。token削減量は未実測）。
- AC6: localとhostedの必要検証集合を比較し、現行local fullにあるworkflow回帰、bindings、traceability、frontend tests/build、env、docsが失われない。`local-ci.sh full`自体は保持する。
- AC7: owner承認後に`gh api repos/kosei-w90607/inventory-system-desktop/rules/branches/main`でPR必須・GitHub Actions/15368のMerge gate・strict・bypassなし・削除/force禁止を確認する。sourceの検証用ref手順で拒否とdocs-only PR成功を残す。成功前は旧gateを外さない。
- AC8: repo-wideのlive参照を更新し、旧の無条件三点照合・state-only強制・main直接closeoutはlegacy/migration説明だけに残る。archiveは書き換えない。`doc-consistency-check.sh`と必要testsが通る。
- AC9: bootstrapは旧契約の`local-ci.sh full`がCLEAN/PASS、独立Double Audit、owner Ready/merge、hosted証拠を満たす。新modeの有効化後のcloseoutはdocs-only PRで完了し、自身のcloseoutを再帰要求しない。

## Design Sources

- [目的・動機とMG-D1〜D12](../agent-guidance/merge-evidence.md)
- [workflow](../DEV_WORKFLOW.md)、[CI](../ci.md)、[役割](../AGENT_OPERATING_MANUAL.md)、[profile](../project-profile.md)
- [D-033/D-035等](../decision-log.md)、[review](../code_review.md)
- 実行の正本は`ci.yml`、classifier、local-ci、pre-push、PK4/PK5と既存tests。アプリ設計正本は非接触。

## Required Design Artifacts

source designはmerge-evidence.md。実装時にCI/workflow正本とdecision-logへ採用内容を同期する。DB/function/UIの新規設計は不要。

## Registration / Generation Obligations

aggregateのrequired contextとGitHub appを実効rulesへ登録する。新testsを共通workflow suiteへ接続し、そのsuiteをlocal/hostedから呼ぶ。新modeをテンプレート・checker・resume/レビューSkillへ同時に反映する。appのbindings/routes/REQ登録は変更せず、既存の生成drift検査を維持する。

## Design Intent Trace

| Spec | Decision | 実装先 | 検証 |
|---|---|---|---|
| SPEC-MERGE-EVIDENCE | MG-D1〜D4 | CI / classifier / gate / ruleset | gate負例、検証parity、live dogfood |
| SPEC-MERGE-EVIDENCE | MG-D5〜D8 | template / checker / pr-gate | 新旧schema、状態遷移、stale/競合/権限 |
| SPEC-MERGE-EVIDENCE | MG-D9〜D12 | closeout / 移行 / docs / 出力 | docs PR、rollback、参照sweep、読取り量 |

## Design Intent Audit

動機、守る失敗条件、採らない案をsourceへ置いた。外部のcheck評価は公式契約とread-only probeで確認し、dynamic名・ruleset拒否のruntimeは有効化前dogfoodへ分離した。分量・token効果の実測値は作らず、実装の判断基準として手転記/状態commitを要求しないことを固定する。

## Impact Review Lenses

環境・再現性: GitHub event/job/checkと実効rules。Fact/design: APIの観測値と提案payloadを区別。Lifecycle: Draft/Ready、stale head/base、offline、失敗、再開。Replacement: old/new packetとbootstrap。Data safety: 合成fixtureと最小の公開metadata。製品UI/会計/POS adapterは非接触。

## Design Readiness

GitHub強制と軽いdocs PR経路はowner選択済み。変更対象・各契約・実装順・負例をこのpacket/Matrixへ具体化した。Plan Gate前にproduction codeへ着手しない。settingsの有効化は完成したpayloadと実効検証をownerが確認する最終段階であり、設計選択を有効化許可へ読み替えない。

## Contract Probe

- `gh api repos/kosei-w90607/inventory-system-desktop --jq '{visibility,permissions}'` → public、admin/maintain/push/pull可（2026-09-14 read-only）。
- `gh api repos/kosei-w90607/inventory-system-desktop/branches/main --jq '{name,protected}'` → main / false。`gh api .../rules/branches/main` → []。
- `gh api repos/.../commits/fda74d083c7b3d0a1f531eaaa3e29693dae094d1/check-runs` →既存CIのappはgithub-actions、id=15368。これはtokenやcredentialではなく公開app識別子。
- 現物`ci.yml`と`local-ci.sh`を対照し、Rust aggregateがfrontend/docs/envを覆わず、localのworkflow回帰suiteがhostedには未接続と確認。これを直す前にlocal final要件を外さない。
- 公式Contexts表はjobs.nameでgithub contextを許可。dynamic名のDraft/Ready実挙動と設定後の拒否は未実測で、有効化前の必須確認へ置く。

## Contract Coverage Ledger

| 契約 | 実装先 | 自動/独立検証 | manual / non-scope |
|---|---|---|---|
| MG-D1 | ruleset + helper | payload/実効rules照合 | owner有効化承認 |
| MG-D2 | aggregate evaluator | 必要job全結果の負例 | native評価のdogfood |
| MG-D3 | event/名前/分類 | Draft/Ready/docs/skip fixture | 実check名確認 |
| MG-D4 | shared test driver/consumer | local-hosted parity | 現行gateを先に保持 |
| MG-D5 | new marker/template/checker | old/new phase/required fields | archive非変換 |
| MG-D6 | comment record/capture | author/重複/stale/改版 | 独立性と採否はowner/model |
| MG-D7 | local feedback / final条件 | local failure保持・manual未了拒否 | Windows/R4は現行保護 |
| MG-D8 | pr-gate | CLI/HTTP/race/side effect | settings自動変更なし |
| MG-D9 | closeout PR | docs経路、再帰なし | 親の後処理承認を引継ぐ |
| MG-D10 | mode selector/legacy | 既存fixture維持 | 古い成果を勝手に変換しない |
| MG-D11 | rollout/rollback | 前提欠落で停止 | 正確なpayloadのowner承認 |
| MG-D12 | status/JSON/docs | 通常出力/異常詳細 | token効果は未実測 |

## Test Plan

[Test Design Matrix](test-matrices/2026-09-14-merge-evidence-simplification.md)。実装時は意味のある負例を先にREDへし、対象tests→local full→独立review→live dogfoodへ進める。実装中の全量再実行は新しい変更/失敗/未解決懸念に対応する範囲だけ。planning-onlyではdocs/plan checkとread-only Plan Reviewを行い、fullや外部設定mutationを行わない。

## Boundary / Wire Contract

producerはGitHub REST/GraphQLとreview capture、consumerはhelper/CI evaluator。repo/PRとhead/base（現repoのfull SHA）を検証し、未知status・不正JSON・重複marker・不正author・欠落gateは拒否する。comment JSONはversion=1、review/manual/r4のoutcomeとevidence pointerのみでCI結果を複製しない。branch名等をshellへ展開しない。旧13-fieldはmarkerなしのlegacy、新mode未知値はlegacyへfallbackしない。

## Review Focus

Draftのskippedがrequired成功になる穴、CIの検証parity欠落、settings有効化順序、review/manualの古い版への誤結合、legacyからの無断gate省略、docs closeoutの閉塞/再帰、手作業が新しい記録基盤へ移っただけにならないこと。

## Spec Contract

Contract ID: SPEC-MERGE-EVIDENCE

MG-D1〜D12を実装する。Plan Gate/独立review/owner権限/Windows・R4保護は保持し、証跡の所有・最後の判定・実装後の状態保存を変更する。

## Trace Matrix

| Spec | Step | Test | Review focus | Evidence |
|---|---|---|---|---|
| SPEC-MERGE-EVIDENCE | S1/S4 | merge-gate.test.sh、ci-workflow.test.sh、classify-changes.test.sh | false green、parity | local/CI |
| SPEC-MERGE-EVIDENCE | S2/S3 | pr-gate.test.py、PK4/PK5既存fixture | stale/race/mode | local/独立review |
| SPEC-MERGE-EVIDENCE | S5〜S7 | docs check、rules read-back、docs PR | 移行・権限・手作業削減 | PR/live dogfood |

新規test名は予定であり、既存の実行済みcoverageとは扱わない。

## Data Safety

実データ、auth/env、credential、個人memoryを読まない/commitしない。API probeはrepo/rules/checksの公開可能metadataだけ。capture/cacheと詳細logsはignored `.local/merge-evidence/`または`.local/pr-gate/`。mainを改変する失敗実験はせず、synthetic API fixtureと検証用refで試す。

## Implementation Results

未着手。設計・計画・Matrixの準備とPlan Reviewがこの依頼の完了範囲。

## Review Response

- Findings Freeze: not yet frozen

Plan Reviewの指摘と採否、到達したgateを追記する。現行コードや設定を変更せずに、すぐ実装へ移れるところまで具体化する。
