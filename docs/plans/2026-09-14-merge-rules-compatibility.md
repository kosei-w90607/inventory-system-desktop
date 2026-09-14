# ruleset応答の既定項目によるhelperの互換性問題を修正する

## Workflow State

- Phase: plan-draft
- Evidence Mode: legacy
- Risk: R3
- Execution Mode: codex-only
- Plan Commit: pending
- Amendments: none
- Coordinator: owner（起草は現在のCodex）
- Writer: Codex（計画起草と別の実装run、packet編集禁止）
- Plan Reviewer: pending（Sonnet high予定、Claude CodeのOAuth期限切れで認証待ち）
- Final Reviewer: Sonnet high + Opus high（独立fresh contextのDouble Audit）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Plan Gate / Ready / merge / 本番有効化

main保護は未有効のためlegacyで修正を完成させる。旧bootstrapのarchiveは変更せず、このpacketを現在の修正範囲とする。ownerの「順に進めよう」は計画準備の依頼であり、未完成計画の採用・Ready・merge・本番有効化を先取りしない。計画を起草するrunと実装するrunを分け、後者はpacketを編集しない。非Codex reviewer利用不能時は可用性規定に従いpendingとし、自己承認しない。

## Owner Effort Budget

- 介入回数上限: 12（マージ検証整理のchange全体、owner 2026-09-14承認の規範値）
- 実働時間上限: 30分（規範値、実績は未実測）
- relay 往復上限: 2（規範値）
- Plan Review round 天井: 3（規範値）

旧bootstrapからの累計をリセットしない。試験承認まで介入7回、今回の上限変更が8回目。残る判断は計画採用、Ready、mergeと機械的closeout、本番有効化。次の承認依頼は介入9回目 / 予算12回。詳細は旧[packet](../archive/plans/2026-09-14-merge-evidence-simplification.md)と現owner指示。elapsed hands-on timeは未実測。レビューの原文は機械経由で保存し、ownerの手作業relayを前提にしない。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

helperのReady/mergeを許可する照合処理が変わるためworkflow gate change。製品・DB・本番設定の変更は含めない。

## Goal

Goal Invariant:

### 最小完了条件

観測したGitHubの既定項目を含む正常なruleset応答をhelperが受理し、必要な保護の欠落・変更は引き続き拒否する。修正を旧gate下でmergeして、本番有効化の判断へ渡せる状態にする。

### 失敗定義

未知fieldや異なる既定値、弱められた保護を通すこと。desiredをPR側で差し替えて許可を減らせること。正常な観測応答が引き続き止まること。有効化前に新modeやbypassを使うこと。

### 非目的

設定方式の再設計、API応答の汎用正規化、CI/helper全体の作り直し、他のP3・製品lane・依存更新・実データ処理。

## Scope

- S1: `scripts/pr-gate.py`の`Gate.rules`でMG-D1aの限定照合を実装する。既存`copy`と共有経路を使い、設定・記録・CI評価の他の処理を増やさない。
- S2: `scripts/tests/pr-gate.test.py`の既存CLI fixtureを拡張する。API応答の既定項目をdesiredとは独立したliteralで与え、status/Ready/mergeの正負例へ接続する。raw live API全量はcommitしない。
- S3: `docs/agent-guidance/merge-evidence.md`のMG-D1a、`docs/decision-log.md`のD-086、本packet/Matrix、`docs/Plans.md`を同期する。D-086の採用状態はowner Plan Gate後に記録する。
- S4: legacyの検証・独立Double Auditを完了する。公開/Ready・mergeはそれぞれowner判断後。通常docs-only closeoutへ移送し、追加の再帰closeoutを作らない。

## Non-scope

`.github/merge-gate-ruleset.json`とGitHub設定は不変更。新たなnative拒否試験・ref/ruleset作成・削除は実行しない。将来の本番適用は既存MG-D11と別の具体的owner承認に従う。アプリ/DB/実POS/secret、global設定、classifier/CI/PK5、他のP3を変更しない。

## Acceptance Criteria

- AC1: 既定項目なし、許容項目の片方だけ、両方を含む応答で`pr-gate.test.py`のstatusにrules blockerがなく、正当なReady/mergeが成功する。現行実装で両方の正常回帰を先にREDにする。
- AC2: `required_reviewers`が非空・null・異なる型、追加approval項目がfalse/null/文字列/数値の場合は非0またはrules blockerを返し、Ready/mergeの実呼出がない。
- AC3: `scripts/tests/pr-gate.test.py`で未知parameter、既存のparameter drift、rule欠落、app/context/strict不足、bypass/inactive/target/conditions/name不一致を拒否する。既存testを保持し、互換応答と同時に弱化を与えた場合もReady/mergeが非0となり、gh pr呼出がない。
- AC4: `scripts/tests/pr-gate.test.py`でdesired側が許容名の項目を明示するときは比較から除かず、一致は受理、不一致は拒否する。PR側policyで必要条件を減らす経路を増やさない。API応答とdesiredの元objectの呼出前後一致をassertする。
- AC5: 保存したlive応答を`scripts/tests/pr-gate.test.py`の合成fixtureへ移し、main用name/refへの置換だけで現行の不一致と修正後の通過を確認する。既定値検査を除く実mutationでAC2が非0、無変更positive controlはexit 0になることを確認する。
- AC6: `python3 scripts/tests/pr-gate.test.py`、`bash scripts/tests/run-workflow-tests.sh`、必要なdoc/PK5、legacyのCLEANな`bash scripts/local-ci.sh full`、Sonnet/Opusの独立監査を通す。Readyのexact HEADで旧L1/PR/hosted CI一致を満たす。本番適用済みとは報告しない。

## Design Sources

- [MG-D1a・D1/D8/D11](../agent-guidance/merge-evidence.md)、[D-085/D-086](../decision-log.md)。
- [workflow](../DEV_WORKFLOW.md)、[CI](../ci.md)、[役割](../AGENT_OPERATING_MANUAL.md)、[profile](../project-profile.md)。
- 実物: `Gate.rules`、`Gate.status`、`Gate.mutate`、`CLI.setUp`、`CLI.assert_rules_blocked`。
- 製品のARCHITECTURE/FUNCTION/DB/SCREEN契約は非接触。

## Required Design Artifacts

変更するJSON境界とdurable decisionはMG-D1a/D-086で定義した。アプリの関数・DB・画面・生成物の追加設計は該当しない。

## Registration / Generation Obligations

新規runtime module・command・test entryは追加しない。既存`pr-gate.test.py`はshared workflow suiteから実行される。新packetはPlansから、Matrixは本packetから参照する。bindings/routes/traceability生成は非接触。

## Design Intent Trace

| Spec | Source / Decision | 意図 | 実装先 | 検証 |
|---|---|---|---|---|
| SPEC-MERGE-EVIDENCE | MG-D1a / D-086 | 既知の応答だけを扱いdrift検出を維持 | Gate.rules | AC1〜5 |
| SPEC-MERGE-EVIDENCE | MG-D1 / D8 | current mainのpolicy、共有経路、freshな保護確認を維持 | Gate.rules/status/mutate | AC3〜4 / CLI |
| SPEC-MERGE-EVIDENCE | MG-D11 | 有効化前のlegacy検証を維持 | 修正PR / closeout | AC6 |

## Design Intent Audit

sourceに動機・限定した値/型・棄却案・見直し条件を置いた。未確認項目の一般的な意味や送信APIの受付を推測せず、観測した応答だけを扱う。未知のserver変更を自動吸収する保証はしない。

## Impact Review Lenses

外部adapter/core: GitHub JSON応答とdesired照合の境界。Fact/design: 追加fieldの実測と許容方針を分離。Lifecycle: GET→比較用copy→許可/拒否、改版時のfresh取得は既存経路を維持。Replacement/環境・再現性: 新依存なし、未観測の応答形は拒否。Data safety: 合成fixtureと公開可能な設定形のみ。Operator/会計/実機: 製品非接触。manual: 保存応答のreplayと将来の本番read-backを区別する。

## Design Readiness

MG-D1aで実装に必要な条件を定義済み、採用はPlan Gate待ち。PR必須/CI/app/strict/bypass条件は既存sourceを継承する。公開ドキュメントで確認できないfieldの意味は本修正の入力条件にせず、送信policyを維持する。

## Contract Probe

- `.local/merge-evidence/activation-20260914/probe/reproduce-rules.py`を`python3`で実行 → `REPRODUCED: captured GitHub response -> main ruleset drift: rules`、既定項目だけ除いたcontrol → `CONTROL PASS`。main用name/refの置換を含むlocal replayで、production適用の証拠ではない。
- native拒否・成功・cleanupは[PR #57](https://github.com/kosei-w90607/inventory-system-desktop/pull/57) / [PR #58](https://github.com/kosei-w90607/inventory-system-desktop/pull/58)とlocal `probe/RESULT.md` / `result.json`に保存済み。policy不変更の本修正で同じnative負例を再実行しない。liveの設定応答は本番適用のread-backで再照合する。

## Contract Coverage Ledger

| 契約 | 実装先 | Automated test | L3 / Non-scope |
|---|---|---|---|
| MG-D1a 既知fieldの不在/許容値/型 | Gate.rules | 新規CLI正常・値/型負例 | 保存実応答replay |
| MG-D1a desired明示値と元data不変 | Gate.rules | 新規priority / no-mutation | 設定書込みなし |
| MG-D1a 未知field/順序の扱い | Gate.rules | 新規unknown / order negative | 全面正規化しない |
| MG-D1 name/target/enforcement/conditions/bypass、PR/check/app/strict/deletion/force | Gate.rules | 既存rules負例＋互換応答との組合せ | native実績保持 |
| MG-D8 status/Ready/merge同一経路、current main、通信失敗で停止 | Gate.status/mutate/rules | CLI / 既存offline/race | schema/record変更なし |
| MG-D11 旧gateとowner判断、closeout/activation順序 | legacy PR運用 | full / PK5 / hosted | 本番は別承認 |

隣接監査はCIとmain保護/Helperの境界/移行・復旧のsource節を確認した。記録schema、manual再利用、CI分類・draftの実装は非接触で、既存suiteの回帰を維持する。

## Test Plan

[Test Design Matrix](test-matrices/2026-09-14-merge-rules-compatibility.md)。対象は`python3 scripts/tests/pr-gate.test.py`、shared suite、doc/plan、legacy full。製品UI非接触なのでWindows L3は不要。テスト数・所要時間・token削減量は未実測。

## Boundary / Wire Contract

- producer: GitHub ruleset detail / current mainのdesired JSON。
- consumer: `Gate.rules`（status/Ready/mergeの共有検査）。
- wire/internal: JSON object→Python dict/list/bool。JSON trueと数値1を区別する。
- round trip: GET原文を保持し、copy上だけで既知の応答項目を除く。設定APIへの書戻しなし。
- invalid: 異なる値/型・未知field・不足/変更した保護は拒否。offline/不明応答を成功へ補完しない。
- compatibility: 未指定の既定項目は不在または表の値のみ。desiredが明示する値は比較対象。配列順序と他の照合契約は不変更。

## Review Focus

許容範囲が固定の値/型を越えていないか、desiredまで削っていないか、statusだけ直ってmutationへ接続しない修正にならないか。正常API fixtureがdesiredをそのまま返す自己充足を避けたか。Plan/公開/有効化の権限を混同していないか。

## Spec Contract

Contract ID: SPEC-MERGE-EVIDENCE

MG-D1aの既知応答だけを受理し、MG-D1/D8の保護を維持する。新規test名はMatrixで予定と明記し、実装前のcoverageと主張しない。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-MERGE-EVIDENCE / MG-D1a | S1/S2 | Matrix C1〜C5 | 限定受理とdrift拒否 | CLI / replay / mutation |
| SPEC-MERGE-EVIDENCE / MG-D1/D8/D11 | S3/S4 | Matrix C6 | 保護/独立性/移行順 | source / legacy PR evidence |

## Data Safety

raw API、vendor metadata、review出力、実行logはignored `.local/merge-rules-compatibility/`または既存probe directory。tracked testは合成値だけ。実データ・secret・個人設定を読まずcommitしない。runtimeとpolicy・GitHub設定を変更しない準備run。

## Implementation Results

未実装。Plan Gate前にruntime code/testを変更しない。

## Review Response

- Findings Freeze: not yet frozen

Plan Review未実施。Sonnet highの独立CLI起動はOAuth期限切れ（HTTP 401）で認証に失敗し、review結果を生成していない。AGENT_OPERATING_MANUAL §3.3に従いPlan Reviewerをpendingとし、Phaseを前進させない。要求モデル・effortはSonnet/high、実効モデルは未確認。ownerは上限変更を承認済み、計画採用・外部公開・Ready・merge・本番有効化は未承認。
