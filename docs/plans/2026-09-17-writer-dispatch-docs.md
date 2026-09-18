# Writer 発注の前提確認と再開指示の整理

## Workflow State

- Evidence Mode: github
- Phase: implementing
- Risk: R2
- Execution Mode: dual-vendor-no-fable
- Plan Commit: 36bbae61be2f29af5d36898f3015e4bf28a2cf2c
- Amendments: 25cf5cb26a2b6d78f53335d9b95bb29b612fa6fa
- Coordinator: Codex（主担当、owner の今回の変更依頼による）
- Writer: Codex
- Plan Reviewer: Sonnet（独立 read-only context）
- Final Reviewer: Sonnet + Opus（Plan Reviewer と別の独立 read-only context、Double Audit）
- Final Review Minimum: 2
- Human Gate: ready,merge

2026-09-17 kickoff → spec-check → plan-draft。owner は発注漏れの調査を受け、既存文書で対処できるなら修正するよう依頼した。Skill 化は利点が上回る場合の選択肢であり必須ではない。既存の正本・権限・品質条件を具体化する docs change として設計充足を確認。Plan Gate 前の対象文書の編集は行わない。

2026-09-17 plan-draft → plan-gate。計画を `7424877a` で先行 commit。docs check の Goal Invariant marker 警告を補正して独立 Plan Review へ提出する。

2026-09-17 plan-gate → plan-approved → implementing。Sonnet の fresh context が計画版を直接読み P1/P2 なしと判定し、R2 分類を確認。報告は local-only `plan-review.md` に保存。P3 の tracked / local-only 訂正タイミングの区別は採用し、本文へ反映する。Required Design Artifacts の全 N/A 表化は任意の形式提案として記録し、対象 source docs と充足根拠が明示済みのため今回の完了条件へ加えない。github mode を維持し、review 報告内の legacy local-verified / full の言及は新modeへ適用しない。

2026-09-19 Gated Amendment 1。PR #82 の helper status が `required Double Audit minimum is 2` で fail-closed。本変更は `docs/DEV_WORKFLOW.md` / `docs/AGENT_OPERATING_MANUAL.md` / `docs/templates/*` に触れ、classifier が workflow 分類にするため、Final Review Minimum を 2 へ引き上げ Final Reviewer に Opus を加える。Scope・AC・対象本文は不変で、要件を緩める変更はない。2026-09-17 の Sonnet Final Review（対象 `602c751e`）は履歴として保持し、helper の broad 2 本は本 Amendment 後の head で fresh context により取り直す。owner の 2026-09-19 指示（main への取り込み許可）を受け、PR 作成以後の取り込み調整と本 Amendment の記録は Fable が担当する。

2026-09-19 役割の記録。owner の 2026-09-19 指示（main への取り込み許可）により、PR #82 作成以後の取り込み調整・Amendment の記録・review の発注と裁定を Fable が担当する（`docs/AGENT_OPERATING_MANUAL.md` §3.1 の例外適用。Plan Reviewer / Final Reviewer は非 Fable の独立 fresh context を維持）。`Execution Mode` / `Coordinator` の field は Plan Gate 承認時の lane 指定として変更せず、実担当の差はこの記録で示す。broad 指摘の是正は Sonnet（Final Reviewer とは別 context）が Writer として行い、closure は Opus が確認する。

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

Goal Invariant:

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

§5.6 に発注構成と作成・再開・訂正手順を集約し、既存の注意を統合した。Packet template は Scope の波及先と生成義務、可観測な AC を明確化し、Matrix は mock 境界と受信・復元の検証を具体化した。訂正 sweep は tracked / local-only の保存先を区別する。別保存の再開発注例と事例照合を local artifact に用意。検証と独立 Final Review の結果は local artifact、公開時は PR evidence に置く。

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

2026-09-19 Final Review broad（head `bb0b4608`）= Sonnet P1/P2 なし・P3 2 件、Opus P2 2 件・P3 5 件。P2 2 件（Plans.md の GA1 未同期、§5.6 最終照合への実行条件の追加）と P3 3 件（Registration 表の行、`rg` の手段、live / historical の区別）を採用して是正。AC5 / Scope の曖昧表現 WARN（M1、既知の 2 箇所）は AC 文言の変更が新しい Gated Amendment と broad の取り直しを要するため本 PR では変更せず、既知の WARN として保持。Coordinator field の指摘は上記の役割記録で対応。報告は PR #82 の comment（`#issuecomment-5732743285`、`#issuecomment-5732763646`）。
