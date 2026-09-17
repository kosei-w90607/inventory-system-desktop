# Writer 発注の前提確認と再開指示の整理

## Workflow State

- Evidence Mode: github
- Phase: plan-draft
- Risk: R2
- Execution Mode: dual-vendor-no-fable
- Plan Commit: pending
- Amendments: none
- Coordinator: Codex（主担当、owner の今回の変更依頼による）
- Writer: Codex
- Plan Reviewer: pending（Sonnet の独立 context に依頼予定）
- Final Reviewer: pending（Sonnet の独立 context に依頼予定）
- Final Review Minimum: 1
- Human Gate: ready,merge

2026-09-17 kickoff → spec-check → plan-draft。owner は発注漏れの調査を受け、既存文書で対処できるなら修正するよう依頼した。Skill 化は利点が上回る場合の選択肢であり必須ではない。既存の正本・権限・品質条件を具体化する docs change として設計充足を確認。Plan Gate 前の対象文書の編集は行わない。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

起票時点で追加の承認依頼なし。owner 実働時間は未実測。独立レビューの発注・回収は主担当が行う。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

既存の開発用文書とテンプレートの整理。製品 runtime、workflow phase、承認権限、Plan Gate / merge gate の通過条件、機械 checker は変更しない。Scope・AC・証跡所有の既存規則を発注作成時に適用する方法を具体化する。独立レビューで gate 変更に及ぶと判明した場合は範囲・Risk を再評価する。

## Goal

### 最小完了条件

Coordinator が既存文書を使って、必要な関連変更・生成義務を含む Packet と、現在の作業状態に一致する Writer 発注書を作れる。仕様・Scope・AC の重複転記、未実測の固定条件、再開時の古い着手条件を防ぐ確認箇所が明確である。

### 失敗定義

注意事項だけが増え、実際の発注構成・訂正対象・テンプレートに届かない。または、Writer の越境修正や必須検証の省略を許す。

### 非目的

専用 Skill / hook / checker / 起動自動化の新設、モデル・役割の変更、budget の変更、過去の発注書・archive の書き換え、製品修正。

## Scope

- `docs/AGENT_OPERATING_MANUAL.md` §5.6: 発注構成、起草時の現物確認、初回と再開の区別、訂正時の照合。既存の節番号・生成義務の注意を手順へ統合する。
- `docs/DEV_WORKFLOW.md` Plan Packet Rules: 既存の前提訂正 sweep の対象に、当該変更の最終 Writer 発注書・再開指示を含める。
- `docs/templates/plan-packet.md` Scope / AC / Registration / Generation Obligations: 隣接 test・mock・生成物・依存更新の波及、可観測な AC、既存 REQ 参照の増減を明確化する。
- `docs/templates/test-design-matrix.md` Test Matrix / Boundary Checks / Mutation-style Adequacy Questions: mock と実経路の境界、受信側 parse と同値再選択など、実際に差を観測する経路を具体化する。
- 本 Packet と `docs/Plans.md`: 計画、現在地、次の行動を同期する。local-only の発注例・照合結果・レビュー報告は `.local/reports/writer-dispatch-docs/` に置く。

## Non-scope

- 上記以外の tracked file、Skills、AGENTS、CLAUDE、CI / helper / permissions、runtime / tests / generated files。
- 実際の子 Writer 起動・自動再開 runbook、owner の Ready / merge 判断、棚卸し lane の設計判断。
- 過去の実発注書は証拠として保存し、修正例は別の local artifact にする。

## Acceptance Criteria

- AC1: §5.6 だけで発注構成と初回 / 再開の作成手順を辿れ、Scope / AC / commit 条件の正本が Packet に一意に定まる。対象 worktree / branch / 開始 HEAD と履歴の baseline を区別する。
- AC2: 起草段階で仕様節の referent、数値の測定 command / 出力、helper / mock の実装、削除 oracle の旧例 / 新例、同時成立しない指示を照合する場所がある。本数の固定 AC を runner の結果記録へ移す一方、業務の固定閾値・test 保護は維持する。
- AC3: Scope と生成義務は既存 REQ 参照の追加・変更・削除、必要な生成先、隣接 test / mock、依存更新の波及を扱う。予期しない越境は既存 Gated Amendment へ返す。
- AC4: 訂正 sweep は Packet / Matrix / Plans と当該発注書・再開指示を対象とし、完了済み履歴は書き換えない。
- AC5: Matrix は test helper の実境界を確認し、実際の受信・復元や同値再選択を必要に応じて検証する。mutation は振舞いを変える経路で red を確認し、構造推論だけの合格や無断の AC 撤去を認めない。
- AC6: 下記の事例照合が通り、`git diff --check`、`bash scripts/doc-consistency-check.sh`、`bash scripts/doc-consistency-check.sh --target plan`、`bash scripts/local-ci.sh changed` が成功する。P1/P2 の未解決なし。

## Design Sources

- `AGENTS.md` Session Start / Decision and Approval Boundaries。
- `docs/AGENT_OPERATING_MANUAL.md` §1 / §3 / §5.6: 発注方法と役割の正本。
- `docs/DEV_WORKFLOW.md` Plan Packet Rules / Workflow State / Review Rules: Goal 優先、訂正 sweep、Evidence Ownership、独立レビュー。
- `docs/templates/plan-packet.md` Scope / AC / Registration / Generation Obligations。
- `docs/templates/test-design-matrix.md` Test Matrix / Boundary Checks / Mutation-style Adequacy Questions。
- 調査根拠は PR #61 / #64 / #67 / #70 / #71 / #75 の archive packet と local-only の発注調査報告。停止総数・改善率は本 Packet へ転記しない。

## Required Design Artifacts

既存 source docs で権限・品質条件は充足。本変更の運用手順は §5.6 と既存 template の該当欄へ反映する。新しい durable な承認判断・gate・cross-cutting architecture decision はないため ADR / decision-log は不要。

## Registration / Generation Obligations

本 Packet を `docs/Plans.md` から参照する。新しい source doc、route、command、REQ token、test を追加しないため、bindings / route tree / traceability の再生成は対象外。テンプレート中の REQ 説明は generator 入力の function-design / test には該当しない。

## Design Intent Trace

既存の D-034（正本・役割）、D-038（証跡所有）、D-062（実測・独立レビュー）を根拠とし、上記 Scope の文書へ適用する。新しい規範を Skill や memory に複製しない。

## Design Intent Audit

現行 §5.6 が手順の正本で、既存 Skill は workflow / manual へ接続済み。独立した Skill が必要になる根拠は今回確認できず、入口と契約の二重管理を避ける。Skill 化は文書の運用確認で具体的な到達・再利用の不足が判明した場合の再検討事項。

## Impact Review Lenses

- Fact check / design decision split: 実測と推定を分け、推定を停止条件にしない。
- Lifecycle / retry: 初回と再開の状態差を発注へ反映する。
- Data safety / evidence: local の履歴・report は commit しない。
- その他: 製品・実機・外部 format の変更はなく対象外。

## Design Readiness

既存設計は sufficient。Scope / AC / 検証 / 訂正 / 承認の所有先は既存正本で決まっており、その適用方法を説明する。未解決の製品仕様・owner 設計判断はない。Plan Gate でこの範囲と Risk を独立確認する。

## Contract Probe

N/A: 未確認の外部 API / library / OS 挙動を変更根拠にしない。過去の local 発注と現行正本の対照を Test Plan で使う。

## Test Plan

文書の意味は以下の事例照合で検証する。自動テストの追加はせず、既存 docs / workflow gate を実行する。照合結果は local review artifact に残し、レビュー時に対象本文を直接確認する。

| 事例 | 確認対象 | Would fail if... / 合格条件 |
|---|---|---|
| 再生成だけの再開に実装前 baseline が残る（#75） | §5.6 と別保存の再開発注例 | 開始 HEAD、完了済み、残作業、証跡の適用範囲を分け、旧 baseline を再開の条件にしない |
| Packet と発注書で commit 条件が矛盾（#67） | §5.6 / 訂正 sweep | Packet 参照に一本化し、相反する既存発注は Coordinator が訂正する |
| 旧 regex が新 URL にも一致 / 旧表現を見逃す（#75 / #64） | AC の説明と発注前確認 | 旧例で一致、新例で不一致、指定式の PASS と Goal 達成を両方確認する |
| helper 名から実 router と推定 / test 総数を固定（#71） | §5.6 / AC / Matrix | 実装と mock 境界を読み、対象 test の必要な振舞い・全 PASS を基準にする |
| 既存 REQ 付き test 追加 / 隣接 matcher / 推移依存の Scope 漏れ（#75 / #70 / #61） | Scope / Generation 表 | 実測した影響先と生成先を事前に Scope へ入れ、未知の拡張は停止・裁定へ戻す |
| href のみ / mount だけで状態復元を保証（#75 / #67） | Matrix | 受信側の parse・復元と同値再選択のような異なる経路を対象にする |
| github / legacy・承認・budget の混同 | 全差分 | gate・権限・必要検証は既存正本のまま、legacy-only 条件を github へ追加しない |

残存限界: 文書を読まずに発注する行動を機械的には防げない。次の発注の closeout で発注訂正由来の停止・本物の判断待ち・owner 再操作を区別して観測する。改善効果は未実測。

## Boundary / Wire Contract

N/A: executable / wire / schema / report format の変更なし。発注の例は機械 parse 用の schema にしない。

## Review Focus

- R2 の範囲に収まり、gate・承認・役割の変更を混ぜていないか。
- 文書の適用先が一意で、単なる注意事項追加や参照先の循環になっていないか。
- 初回・再開・予期しない越境・検証再利用の条件が既存正本と整合するか。

## Implementation Results

未着手。Plan Gate 待ち。

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
