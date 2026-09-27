# ハーネス文脈効率: 条件付き読書と重複手順の整理

## Workflow State

- Phase: archive
- Risk: R3
- Execution Mode: codex-only
- Plan Commit: ece0977c
- Amendments: 53601661b1d4963b1c322e216a91861bc34abaab
- Coordinator: owner（起草は Codex、D-084。未解決 findings の採否は owner）
- Writer: Codex（現在のセッション。owner の明示指名により別 run の指定を置換）
- Plan Reviewer: Sonnet（round 3の当時passはmedium。単独の保証には使わず、xhigh是正監査とhigh closureで承認済み契約を再確認済み）
- Final Reviewer: Sonnet と Opus の独立xhigh Double Audit、およびowner承認のOpus high closure（pass、P1/P2なし）
- Reviewed Content HEAD: e7bf3aeef34a352a3aaa0dcaa4cd98d8981d2379
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: none（承認済みのmerge・closeoutを完了）

Execution Mode は D-084 の起草・実装・裁定分離を使う。既存 Fable セッションへ新しい権限や作業を送信していない。CLI による非 Codex reviewer の実行可否はレビュー開始時に確認し、不能なら pending のまま gate を前進させない。

## Owner Effort Budget

- 介入回数上限: 3（規範の既定値）
- 実働時間上限: 30分（規範の既定値、実績は未実測）
- relay 往復上限: 2（規範の既定値）
- Plan Review round 天井: 3（規範の既定値）

このchange限りのowner承認例外（2026-09-14）: 過去介入の厳密な回数・実働時間は未実測、既定の介入予算超過を隠さず記録する表記を受容。今回の一括是正裁定を以後の計数起点とし、Ready/mergeは別に記録する。Final Reviewは今回のxhigh Double Auditで集合を確定し、一括是正後に修正箇所だけの独立high closureを1回許可する。新しいPlan rally、追加の全面監査、他changeの予算変更は許可しない。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

読書・再開・検証の入口とそれを検査する script を変更する workflow change。データやアプリ runtime への変更はないが、必要な gate の読落しを防ぐ検証が必要。

## Goal

Goal Invariant:

### 最小完了条件

Astra / Sol / Claude の関係する入口から、依頼と phase に必要な正本へ到達できる。質問・小変更・closure が無関係な履歴全文や重複した手順を読まずに進み、必要な承認と検証を維持する。読書量の代理値と取得できた実モデルの usage/判断結果を区別して報告する。

### 失敗定義

未了 backlog を失う、R2+ gate を読み落とす、承認境界を緩める、既存の必要なテストを省略する、partial read が安全境界を越える、または文書サイズの減少だけで token/品質改善を主張すること。

### 非目的

アプリ機能、DB/POS契約、依存更新、新しい自走基盤、R2 Plan Gate/STATECAP/最終SHA方式の撤廃、global設定やplugin cacheの一括改変。

## Scope

- S1: `AGENTS.md`、`CLAUDE.md`、`docs/agent-guidance/{README.md,shared.md,model-notes.md,profiles/*}` の条件付き参照と共有/モデル固有の責務整理。
- S2: `.agents/skills/{inventory-workflow-start,inventory-implementation,implementation,test-driven-development}/SKILL.md` の発火条件と重複手順。関連する `.claude/rules/{implementation-quality,test-quality,commands,review-workflow}.md` と `.claude/commands/{check,test,phase-complete,plan-rally,design-review}.md` の正本参照整合。Skillのnameと既存symlinkは維持。
- S3: `docs/Plans.md` の未了backlogを `docs/backlog.md` へ移し、完了履歴は `docs/archive/` に保存。`docs/project-memory.md` と `docs/PROJECT_HANDOFF.md` の揮発状態は履歴/正本リンクへ整理。履歴リンクの相対pathを補正し、未了項目の移送を対照確認する。
- S4: `.codex/bin/read-safe-file.sh` の範囲指定と `scripts/tests/codex-safe-wrappers.test.sh` の境界検証。
- S5: `scripts/tests/reading-order-drift.test.sh`、必要な `scripts/doc-consistency-check.sh`/plan fixture の入口整合、`docs/agent-guidance/evals/` の新しい代表ケース。旧 gate/state/enums の受入条件は変更しない。
- S6: `docs/DEV_WORKFLOW.md`、`docs/AGENT_OPERATING_MANUAL.md`、`docs/project-profile.md`、`docs/ci.md`、`docs/code_review.md`、`docs/templates/{pr-review-prompt,subagent-review-packet,workflow-effectiveness-review}.md`、`.github/pull_request_template.md`、`.codex/README.md` の関係する読込み/重複検証/引継ぎ文言だけを同期。該当差分がないfileは変更しない。

owner承認の狭いScope補正（2026-09-14）: `docs/decision-log.md` のD-082へ、HC-D1/D7がD-034/D-057/D-082の入口・規範配置を部分改訂する同期注記だけを追加する。旧決定本文と製品仕様は書き換えない。この承認をgated amendmentとして保存し、後続commitでそのSHAをAmendmentsへ追記する。

## Non-scope

- R2+ Plan Packet/Matrix/独立性/13-field/phase/STATECAP/Plan Commit/Amendments/最終HEAD/L3/Ready/merge の契約変更。
- 稼働中 Fable セッション、user-global config/Skills、ignored hook の編集。調査済み候補は後続へ引継ぐ。
- 原因不明の基準 branch の既存 doc WARN やアプリ defect の便乗修正。

## Acceptance Criteria

- AC1: `AGENTS.md` のルートが質問/小変更/初回review/closure/R2+resumeを区別し、HC-D1〜D3 の代表ケースで必要な正本とstop条件を保持する（`docs/agent-guidance/evals/` のケース結果）。
- AC2: 対象 Skill/Claude rule の重複したphase表、human-confirm直後だけの追加L1 full、一律のコード削除指示を撤去し、必須gateの正本リンクを保持する（`git diff -- .agents/skills .claude` の review）。
- AC3: `docs/backlog.md` とarchiveを旧Plans/memory/handoffと対照し、移送前の原文を archive に保存し、未了項目の本文・未解決判断・参照先を全件対応づけて保存を確認する。件数一致だけでは合格としない（移送記録）。
- AC4: `bash scripts/tests/codex-safe-wrappers.test.sh` が全読/部分読/不正範囲/path安全/外部symlinkの正負ケースを検出する。既存の安全テストは維持。
- AC5: `bash scripts/tests/reading-order-drift.test.sh` と `bash scripts/doc-consistency-check.sh`、必要なplan/script testsが通り、旧gateのfixture期待値を緩めない。
- AC6: baselineとcandidateで代表ケースの読書量/取得可能なusage/判断を比較し、未取得tokenは未実測と記載。未許可mutation、必要契約の脱落、無関係な旧blockerによる停止がない（`docs/agent-guidance/evals/` のケース結果）。
- AC7: `bash scripts/local-ci.sh full` と独立Double Auditが完了し、最終PR本文が現行のgate/evidence契約を満たす。

## Design Sources

- [提案する設計とHC-D1〜D11](../harness-context/2026-09-24-context-efficiency.md)
- [workflow](../../DEV_WORKFLOW.md)、[役割](../../AGENT_OPERATING_MANUAL.md)、[CI](../../ci.md)、[profile](../../project-profile.md)
- [AGENTS](../../../AGENTS.md)、[Codex共有契約](../../agent-guidance/shared.md)、`CLAUDE.md`、既存safe wrapper/tests

## Required Design Artifacts

workflow設計はcontext-efficiency.mdに置く。DB/function/UIの振舞いは非接触で、既存製品設計の改訂は不要。

## Registration / Generation Obligations

- 新設source docはagent-guidance indexから参照する。backlog/archive移送は相対リンクを修正する。
- REQ token、Tauri commands、frontend routes、bindingsは変更しない。既存local fullの生成drift検査を維持。

## Design Intent Trace

| Spec | Design decision | Implementation target | Test target |
|---|---|---|---|
| SPEC-HARNESS-CONTEXT | HC-D1〜D3 | AGENTS/entry references | reading-order drift + behavioral cases |
| SPEC-HARNESS-CONTEXT | HC-D4〜D5, HC-D7 | Skills/Claude rules/review references | source/diff audit + behavioral cases |
| SPEC-HARNESS-CONTEXT | HC-D6 | Plans/backlog/memory/handoff/archive | lossless relocation audit + docs check |
| SPEC-HARNESS-CONTEXT | HC-D8〜D9 | safe-read wrapper + tests | wrapper real-output/negative tests |
| SPEC-HARNESS-CONTEXT | HC-D10〜D11 | scope/disposition + eval evidence | no out-of-scope diff + model usage reports |

## Design Intent Audit

決定・理由・棄却案はsource docに置いた。token効果とmodel判断は未実測で、変更前後の観測を予定する。正本の縮小をgate削減と誤解させないことをPlan/Final Reviewで直接確認する。

## Impact Review Lenses

環境・再現性 = 各CLI/harnessが共有入口を使い、wrapperが同じworktree内で動くこと。fact/design split = bytesとtokens、静的整合とmodel実測を分離。data safety = synthetic fixtureのみ。製品adapter/accounting/operator UIのlensは非該当。

## Design Readiness

既存gateを維持する最初のsliceとしてsource designを起草済み。採用候補はHC-D1〜D11。Plan Gate前は実装禁止。範囲をR2 gate/SHA方式の変更へ広げる場合は別設計へ戻る。

## Contract Probe

起票時: `git ls-files docs/plans` は空、root `Plans.md` はsymlink、shared SkillsもClaude側symlinkでありduplicate copyではない。`claude --version` は `2.1.270 (Claude Code)`、`codex --version` は `codex-cli 0.154.0`。新しいCLI機能への依存はなく、Python標準ライブラリによるTOML検証は今回の共有runtime変更に含めない。safe-readの新CLIはsynthetic fixtureで実装時に検証する。

## Contract Coverage Ledger

| Design contract | Implementation target | Automated test / review | L3 or non-scope |
|---|---|---|---|
| HC-D1, HC-D2, HC-D3 | root entry + router | reading-order drift / representative routing cases | native L3非該当 |
| HC-D4, HC-D5, HC-D7 | Skills/Claude references | focused source audit / behavioral cases | native L3非該当 |
| HC-D6 | Plans/backlog/memory/handoff | relocation audit / docs link check | business decisions不変更 |
| HC-D8 | read-safe-file.sh | codex-safe-wrappers.test.sh | same trust boundary |
| HC-D9, HC-D11 | tests/evals | script tests / measured model outputs | token取得不能は未実測 |
| HC-D10 | scope and diff | no global/ignored hook edits | later scoped work |
| Existing plan-first/state/approval/CI | governing docs / preserved tests | workflow-git/plan/CI tests + Double Audit | owner Ready/merge |

## Test Plan

[Test Design Matrix](test-matrices/2026-09-13-harness-context-efficiency.md)。wrapperはRed→Green、文書は意味のある経路ケースと独立source auditで検証。local fullを旧契約どおり実行する。製品UI変更はないためWindows native L3なし。

## Boundary / Wire Contract

producer = read-safe-file.sh CLI caller、consumer = same wrapper。追加形は先頭引数でのみ認識する `--lines START:END <path>`。それ以外の option 風引数は既存どおり拒否し、read のフラグ位置違い/未知の flag と list/search の既存拒否を負例で検証する。正の整数inclusive範囲、単一fileのみ。旧複数path引数は互換。invalid/逆順/空/外部path/secret-looking pathは非0。stdoutは指定範囲の元本文のみ、診断はstderr。機密拒否は部分読みにも適用。

## Review Focus

必要な正本/gateを読まずに進む経路、未了backlogの消失、モデル間の権限差、partial-readによるpath安全の劣化、比較実験の過大主張を重点確認する。

## Spec Contract

Contract ID: SPEC-HARNESS-CONTEXT

HC-D1〜D11を採用候補とし、既存のproduct/gate契約は維持する。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-HARNESS-CONTEXT | S1〜S3/S6 | review evidence | route/gate/backlog保存 | PR body |
| SPEC-HARNESS-CONTEXT | S4〜S5 | scripts/tests/codex-safe-wrappers.test.sh | boundary output/errors | local full |
| SPEC-HARNESS-CONTEXT | S5 | scripts/tests/reading-order-drift.test.sh | canonical routing | local full / eval |

## Data Safety

synthetic fixtureと公開可能なworkflow文書だけを使う。実データ、auth/env、モデル会話全文、個人応答拡張はcommitしない。比較出力はignored `.local/`、PRには必要な集計と所見を残す。

## Implementation Results

S1〜S6の実装を現在のCodexが実施。条件付き入口、Skill/Claude手順の整理、原文archiveとbacklog分離、安全な部分読込みと境界テストを反映した。先行candidateのlocal fullはCLEAN/PASS。独立Final Reviewで見つかった申し送り保存、再開/closureケース、節参照と証拠metadataを補正した。ownerのモデル別effort方針と起動指定を同期し、xhigh是正監査の指摘をowner承認の一括修正へ反映した。固定ケースとhigh closureを完了するまでFinal Review通過を主張しない。

## Review Response

- Findings Freeze: 2026-09-14のSonnet/Opus xhigh是正Double Auditを初回Broad Auditとしてownerが採用し、既知finding集合を確定。以後は承認された一括是正とclosureのみ。

2026-09-14: Sonnet round 1 は正常終了したが、P2/P3 と pass を併記し、対象 source の未読を残したため Plan Gate 未通過。owner は未了 backlog の本文・未決判断・参照先の全件照合と、`--lines` 以外の option 拒否の維持を計画へ反映し、レビュー通過まで進めることを承認した。source design、AC、Boundary / Wire Contract、Matrix の同じ前提を同期した。round 2 は修正の確認と初回 Broad Audit の未読分を完了し、P1/P2 が残る場合は pass にしない。

owner 介入は scope 承認とこの裁定を消費。次の裁定が範囲や既存 gate を変える場合は owner に返す。

## Follow-up Disposition

最初のsliceで変更しない制度候補: R2計画/役割/owner裁定の軽量化、STATECAP/Plan Commit/SHA方式、global Skill/plugin公開と旧agmsg hook、起動ラッパーのworktree優先。今回のcontext比較結果と依存範囲を根拠に次の採否を決める。ユーザーの全体目的は継続し、このsliceだけで全ハーネス整備完了とはしない。

## Plan Gate 通過記録

2026-09-14: owner承認の具体化を反映した内容commit `48ceddca` をSonnetが再確認した。round 2で初回のP2/P3をclosedとし、残したPROJECT_HANDOFFの経緯ログもround 3で確認した。最終verdictはpass、P1/P2/P3なし、未確認事項なし。実装後の移送全件照合はAC3/Matrixで引き続き必須。

このstate-only commitは `plan-gate -> plan-approved` を実体化する。根拠は元のplan-first commit `ece0977c`、ownerの指摘採用承認、Sonnetの最終pass。実装commitはまだ存在しない。元のPlan Commitを保持し、Scope/AC/Design/Matrixは変更しない。review原文とusageはignored `.local/harness-context-review/` に保持する。実装のFinal Review/Double Auditは未実施であり、Plan Gate通過を代用しない。

## 実装着手の owner 指示

2026-09-14: owner は、Windows側での過去の検証を理由に、別runへWriterを委譲せず現在のCodex自身が実装するよう明示した。このchangeのWriter割当とrun分離だけを置き換える。Scope、設計契約、合格条件、Final Reviewerの独立性は維持する。`plan-approved -> implementing` は最初の実装内容commitに同乗して実体化する。

## Reviewer effort の是正

2026-09-14: ownerはSonnet/Opusの基本をhigh、難問ではxhighと指定した。判断基準は見落とし防止と、手戻りを含む総token効率。既存project設定もhighだったが、Codexがreview用CLIでmediumを明示したため引下げが生じた。Plan/Finalの旧結果・指摘・実行ログは履歴として残すが、mediumのpassだけを通過根拠にしない。

現在のimplementingからphaseを前進させず、Final Reviewの是正検証で承認済みPlanの契約・Matrixも独立に再確認する。新しいPlan rallyやScope/合格条件の変更ではない。入口・承認境界・移送保存が交差する今回の監査はSonnet/Opusともxhighを指定する。起動指定と取得できた実行metadataを保存し、実効effortが応答で確認できない場合はその限界を明記する。残るowner裁定、Ready/mergeは代行しない。

## 一括是正と運用例外の owner 裁定

2026-09-14: ownerは、一括是正差分・修正箇所だけのhigh確認・今回限りの運用例外案への確認に「続けていいよ」と回答した。共有reviewの検出範囲と確信度、既存テストの保護、Human Gateの前提と同一scope内の承認引継ぎ、棚卸しの原申し送り保存を復元する。Ready後の必須full、read引数の位置、runtime依存申告、成果物保存先、L8申し送りの文脈も同じ正本で明確にする。Sonnetのtest-first消失候補は、Skill descriptionのbefore implementingと本文の失敗テスト→修正が存在する根拠で現状維持とする裁定案が承認された。

既存Decision Gate FixtureのS1/S4/S5を是正後に公開合成状態で実行する。個人extensionの比較は行わない。Claude Q、Skill自動発火、Cの入口tool trace等の未実測は明示する。追加Skill・全guardの拡張はこのclosureの必須作業に増やさず、既知P3として次のdogfoodで採否を確認する。D-084の通常適性範囲と別run Writer規定に対して、この承認済みR3ハーネス作業は現在CodexがWriter・ownerが裁定・非Codexが独立reviewを担う個別指示を適用する。過去の修正採用も今回の一括裁定で確認した。一般の役割制約やReady/mergeは変更しない。

## 是正後の検証と独立closure

2026-09-14: 内容候補 `e7bf3aeef34a352a3aaa0dcaa4cd98d8981d2379` のlocal fullは開始・終了CLEAN、PASS、MERGE_EVIDENCE_VALID=true。gated amendment `53601661` の祖先関係とPK5/STATECAPも確認した。Astra medium / Sol highで公開S1/S4/S5を実行し、未決判断の保持、未確認laneの条件付け、解消済み承認の非再要求を確認した。これはAGENTS読取りを試験条件で指定した限定観測であり、自動discoveryやprivate extension比較の合格を主張しない。

独立したOpus high closureは同じ内容候補の差分・契約・owner裁定・実行結果を確認し、pass、P1/P2なしと報告した。既知指摘は修正でclosed、owner裁定の現状維持、または既知P3として後続へ移送された。原文とmodel usage、tool traceはignored evidenceに保持し、必要な結果をPR本文へ反映する。

このstate-only記録は `implementing -> local-verified -> independent-review -> human-confirm` の隣接遷移を実体化する。各条件は内容候補のlocal full、独立closure、ownerの一括裁定により充足済み。Ready/mergeの承認は含まず、Ready後のexact-HEAD L1/hosted要件も維持する。

Freeze後の新規P3は現行規定により後続候補として記録する: sharedの完了/blocked報告規定の通常ルートへの配置、棚卸し申し送りのarchiveにある下位文脈への案内、Ready時のowner例外表記の明確化。ignored evidenceの英語誤字は修正済み。これらを新しいblockerや追加のreview発注理由にしない。

## Ready・merge・後処理の owner 承認

2026-09-14: ownerは「Readyからマージ、後処理まで済ませていい」と明示承認した。今回の個別計数起点以後の承認は2回目で、過去累計未実測・旧既定超過を明示する承認済みの表記例外を維持する。未pushの既存docsコミットの統合・pushも承認されたが、本PRの監査対象へ混ぜず、merge後のcloseoutで移送済みBacklogへ内容を引き継ぐ。

このstate-only commitで `human-confirm -> ready-hosted-final` を記録する。結果のexact HEADでL1 fullを実行してPR本文を更新し、Ready eventで必要なhosted finalを取得する。PR HEAD・L1 SHA・successful hosted headShaの一致とmerge可能状態を確認してからsquash mergeする。承認は検証失敗の受容や必須gateの省略を含まない。

## Post-Merge Closeout

2026-09-14: owner承認に基づきPR #52をsquash mergeした。merge時のPR HEAD・最終L1・successful hosted headShaの一致とmerge可能状態を確認済み。最終evidenceはPR本文に保持する。Plan/Matrixをarchiveへ移し、単位の聞き取りと衛生laneの既存docsコミットを履歴ごとmainへ統合した。本文の移送先をBacklogへ合わせ、商品の新しい設計判断は加えていない。次のdogfood対象は衛生batch 4の計画起草とそのR2+ workflow。発注書46は未実行で、起点・参照先・起動指定・条件に応じたRiskの更新が先行する。
