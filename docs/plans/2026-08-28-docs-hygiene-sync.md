# Plan Packet: docs 衛生 batch — 74-ui stocktake 除外理由同期 + fresh checkout frontend gate 前提明記

## Workflow State

- Phase: ready-hosted-final
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: e6d4d76
- Amendments: none
- Coordinator: Fable (Claude Code)
- Writer: Sonnet subagent (worker, fresh context)（§3.1「投入しない場合: … docs 同期」に該当するため希少 slot を Writer に充てない。Plan Reviewer / Final Reviewer とはそれぞれ別の fresh context で独立性を維持）
- Plan Reviewer: Sonnet subagent (independent)
- Final Reviewer: Sonnet subagent (independent)
- Reviewed Content HEAD: d8c427d
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: none（Ready 承認 2026-08-28 済み — 視覚確認は docs-only のため非該当）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 15分
- relay 往復上限: 2（本 lane は Codex 発注なしのため実消費 0 見込み）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only。74-ui の除外理由文言 3 箇所の現況同期（結論 = 許可リスト除外は不変、理由のみ差替え）+ DEV_SETUP_CHECKLIST への開発環境前提 1 行追記。runtime・契約・画面のいずれにも触れないが、design doc の理由記述は将来の allow-list 追加判断のトリガー条件を規定するため、maintainability に影響する semantic な docs change として R2（R0 の non-semantic cleanup には該当しない）。

## Goal

Goal Invariant:

### 最小完了条件

- `docs/function-design/74-ui-operation-logs.md` の stocktake 除外理由 3 箇所（表 UI-11c-D7 行 / §74.9 相当 bullet / §末尾表）が、正本 65 §65.8.3（2026-08-27 改訂済み）と同型の「stocktake 系 `record_type` を書き込む producer が0件」理由に同期され、「詳細 route が未実装のため」という stale な理由（PR #9 の route 実装で失効）が消える。
- `docs/DEV_SETUP_CHECKLIST.md` に、fresh checkout / 環境再構築後は frontend gate（typecheck / lint / test）実行前に `npm run generate:routes` を明示実行する前提が 1 行明記される。

### 失敗定義

- 74-ui に「未実装」を理由とする stocktake 除外記述が 1 箇所でも残る。
- 除外という結論や allow-list 追加のトリガー条件（producer 側 `record_type` 採用と併せて追加）が、65 §65.8.3 の正本と食い違う新文言になる。

### 非目的

- stocktake / csv_import の allow-list への実追加（producer 側 `record_type` 採用は既存 follow-up、別 change）。
- 74-ui の他節の見直し・整理。
- `.npmrc` / package.json / scripts 側の挙動変更（docs 記載のみ）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

起草時実査（2026-08-28。`rg -c "未実装" docs/function-design/74-ui-operation-logs.md` = 3 行で全数確認済み）:

**A. 74-ui stocktake 除外理由の同期（3 箇所 + 更新履歴）**

1. L57（UI-11c-D7 表 row・補足列）: 「`stocktake` は `/stocktake/records/$stocktakeId` 詳細 route が未実装のため初期 allow-list から除外し、対応する detail route 実装後に registry へ追加する。」→「`stocktake` は詳細 route（`/stocktake/records/$stocktakeId`）が実装済みだが、stocktake 系 `record_type` を書き込む producer が0件のため初期 allow-list からの除外を維持し、producer 側の `record_type` 採用（既存 follow-up）と併せて registry へ追加する。」（同 cell 内の csv_import 文と同型になる）
2. L243（許可リスト bullet）: 「`stocktake` は同節の完成形 route 表には載っているが、対応する `$stocktakeId` 詳細 route が未実装のため、当該 route が実装されるまで許可リストから除外する。」→「`stocktake` は詳細 route（`/stocktake/records/$stocktakeId`）が実装済みだが、stocktake 系 `record_type` を書き込む producer が0件のため許可リストからの除外を維持し、producer 側の `record_type` 採用（既存 follow-up）と併せて許可リストへ追加する。」
3. L564（§末尾表 cell）: 「`stocktake` は対応する詳細 route（`/stocktake/records/$stocktakeId`）が未実装のため除外する」→「`stocktake` は詳細 route が実装済みだが、stocktake 系 `record_type` を書き込む producer が0件のため除外を維持し、producer 側の `record_type` 採用（既存 follow-up）と併せて追加する」
4. §更新履歴（L609 実在確認済み）へ日付 + 要旨 1 行を追加（PR 番号は非転記、dated 形式 — D-050 / PR #6 表記規約と同じ）。

**B. DEV_SETUP_CHECKLIST fresh checkout 前提の明記（1 箇所）**

5. §4.5「動作確認」へ注記 1 行: fresh checkout / 環境再構築（`npm ci --ignore-scripts`）直後は、frontend gate（typecheck / lint / test）実行前に `npm run generate:routes` を明示実行する。理由 = `.npmrc` の `ignore-scripts=true` が `pretypecheck` / `prelint` / `pretest` の `tsr generate` 実行を抑止するため、routeTree 未生成のままだと typecheck / lint が fail する（2026-08-26 実測・再現/復旧確認済み。起草時実査: package.json の `pretypecheck` / `prelint` / `pretest` が `npm run generate:routes` を呼ぶことを確認済み）。表記は dated 形式で PR 番号非転記。

表記規約: 新文言は 65 §65.8.3 の正本文言と同型に揃える。dated 履歴 block は据え置き（74-ui 更新履歴の既存行、および 65 §更新履歴の 2026-08-27 行は無改変）。

## Non-scope

- 65-inventory-record-traceability.md（正本側、2026-08-27 改訂済みで無改変）。
- 74-ui の他の記述（producer 0件の一般記述 L57 前半、csv_import 除外記述 — いずれも現況適合を起草時実査で確認済み）。
- Plans.md backlog の当該 entry 取り消し線化（closeout で実施）。
- `.claude/` / `.codex/` / scripts / CI 側の変更。

## Acceptance Criteria

検索 oracle は自己参照回避のため検索対象を明示 path に限定する（本 packet の在る `docs/plans` を検索対象に含めない。rg の負 glob は環境既知 bug のため使わない）。

- AC-1: `rg -c "未実装" docs/function-design/74-ui-operation-logs.md` が hit 0（exit 1。起草時実査で現状 hit はこの 3 行のみ）。
- AC-2: `rg -F -c 'stocktake 系 `record_type` を書き込む producer が0件' docs/function-design/74-ui-operation-logs.md` ≥ 3（新文言 exact presence の対 oracle）。
- AC-3: `rg -F -c 'npm run generate:routes' docs/DEV_SETUP_CHECKLIST.md` ≥ 1（起草時実査で現状 0）。
- AC-4: `bash scripts/doc-consistency-check.sh` PASS（ERROR 0）。
- AC-5: 74-ui §更新履歴に日付 + 要旨行が追加されている（`rg -c "2026-08-28" docs/function-design/74-ui-operation-logs.md` ≥ 1）。

## Design Sources

- Requirements / spec: 変更なし（REQ 非接触）
- Architecture: 変更なし
- Function / command / DTO: `docs/function-design/65-inventory-record-traceability.md` §65.8.3（正本、無改変・手本）/ `docs/function-design/74-ui-operation-logs.md`（本 PR で同期）
- DB: 変更なし
- Screen / UI: 変更なし（画面契約・許可リストの結論は不変）
- Decision log / ADR: 変更なし（durable な新規判断なし — 理由文言の正本は 65 §65.8.3 に既在）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | 74-ui 除外理由 3 箇所（本 PR で同期。画面挙動は不変） | updated in this PR |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | なし | existing sufficient |

## Registration / Generation Obligations

該当なし（route / command / doc 新設・REQ token 変更なし。生成物再生成なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| UI-11c-D7 | 74-ui L57 / L243 / L564 | 65 §65.8.3（2026-08-27 改訂）を正本として同期 | route 実装（PR #9 相当）で「未実装」理由が失効。結論（除外）は producer 0件により不変のため、理由のみ正本と同型へ差替え | 74-ui 3 箇所 | AC-1/AC-2（機械 oracle） |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（除外理由と追加トリガーが 65 / 74 で同型になる）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: 65 §65.8.3 の 2026-08-27 改訂が理由文言の正本であること（同 doc 更新履歴で確認済み）
- Deferred design gaps, risk, and follow-up target: producer 側 `record_type` 採用（既存 follow-up、Plans.md backlog「操作ログ関連記録の producer 0 件」）
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix は R2 optional 判定で省略（機械 oracle は AC-1〜AC-5）
- Absolute guarantee / escape hatch self-check completed: 該当なし（保証文言の新設なし）

## Impact Review Lenses

not applicable — 起点は repo 内実査（PR #9 Final Review P3-1 の doc-only follow-up + PR #8 Final Review P3-1 の前提明記）であり、実地調査・実機・外部 tool・POS 連携・format 変更のいずれにも該当しない。

## Design Readiness

- Existing design docs are sufficient because: 理由文言の正本は 65 §65.8.3 に確立済み。本 PR は 74-ui をそれへ同期するのみで、新規設計判断を含まない
- Source docs updated in this PR: `docs/function-design/74-ui-operation-logs.md`（3 箇所 + 更新履歴）/ `docs/DEV_SETUP_CHECKLIST.md`（§4.5 注記 1 行）
- Design gaps intentionally deferred: なし
- Durable decisions discovered in this plan and promoted to source docs: なし

Minimum design checks:

- Layer ownership: 非該当（docs-only）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 画面文言は不変（design doc の理由記述のみ）
- Error, empty, retry, and recovery behavior: 変更なし
- Testability and traceability IDs: REQ 非接触、oracle は AC-1〜AC-5

## Contract Probe

N/A — 外部前提なし。pre-script 抑止の機序は 2026-08-26 の Final Review が再現・復旧を実測済みで、package.json の pre-script 定義は起草時に実読確認済み（R2 docs-only）。

## Contract Coverage Ledger

R2 簡易版（触れる契約行のみ）:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| UI-11c-D7 stocktake 除外（結論不変・理由同期） | 74-ui L57 / L243 / L564 | AC-1/AC-2（rg 対 oracle） | non-scope（画面挙動不変） |
| DEV_SETUP_CHECKLIST fresh checkout 前提 | §4.5 注記 1 行 | AC-3 | non-scope |

## Test Plan

Test Design Matrix は R2 optional 判定で省略（理由: docs-only で oracle は AC-1〜AC-5 に機械化済み。挙動変更なし）。

- targeted tests: なし（docs-only）
- negative tests: 不要
- compatibility checks: `bash scripts/doc-consistency-check.sh`（AC-4）
- data safety checks: N/A
- main wiring/integration checks: L1 full（Ready 前の exact HEAD で実行）

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない。

## Review Focus

- 新文言 3 箇所が 65 §65.8.3 の正本文言と同型で、結論（除外維持）と追加トリガー（producer 側採用と併せて追加）を変えていないこと
- 是正で書く新文言自身が新たな事実誤りを持ち込まないこと（詳細 route 実装済みの主張は routeTree / 65 §65.10 slice 4c で裏取り）
- DEV_SETUP_CHECKLIST 注記の機序記述（ignore-scripts が pre-script を抑止する）が正確であること
- dated 履歴 block（74-ui 更新履歴の既存行）が無改変であること

## Spec Contract

N/A（R2。触れる契約は Contract Coverage Ledger 参照）。

## Trace Matrix

N/A（R2、Design Intent Trace 参照）。

## Data Safety

N/A — 実データ・secrets・破壊的操作なし。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

74-ui の stocktake 除外理由 3 箇所を、65 §65.8.3 と同型の「stocktake 系 `record_type` producer が0件」理由へ同期した。更新履歴の要旨行は AC-1（`未実装` 全域 0 件）と衝突しない言い回しへ調整済み（旧文言をそのまま引用しない paraphrase）。DEV_SETUP_CHECKLIST §4.5 には fresh checkout 後の `npm run generate:routes` 前提を注記として追加した。AC-1〜AC-5 は実測ですべて期待どおり。

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: frozen after Final Review; post-freeze exceptions: none.

### Plan Gate 記録（append-only）

- Plan Gate rally: 独立 Sonnet Plan Reviewer、2 round 収束（round 1 = P1: 1 / P2: 1 / P3: 0。P1 = Writer への希少 slot 割当が §3.1「投入しない場合: … docs 同期」に literal 該当 → Writer を Sonnet subagent へ差替え。P2 = 新文言 literal の「0 件」空白入りが正本 65 §65.8.3 / 74-ui csv_import 文の「0件」と字句不一致で AC-2 が drift を素通しする構図 → packet 内 literal 5 箇所 + 説明文 2 箇所 + Plans.md 項 0 を no-space へ統一。いずれも Coordinator 独立再確認の上で全採用・是正 `882b68a`。round 2 = delta 検証で両是正の反映・byte 一致・新規不整合なしを確認、新規指摘 0、P1/P2/P3 = 0）。
- owner 起票承認 2026-08-28（wave 6 batch 起票の会話にて。本 lane 介入 1/3）。
- state-only 遷移 `plan-draft->plan-gate->plan-approved->implementing` の根拠: packet 完成・commit 済み〈plan-first `e6d4d76` + Plan Gate 前 in-place 是正 `882b68a`〉（plan-draft->plan-gate）/ 独立 Plan Reviewer P1/P2 = 0 + Plan Commit 記入 + plan-first commit が全実装 commit に先行（plan-gate->plan-approved）/ Writer = Sonnet subagent への実装開始許可（plan-approved->implementing）。

### Final Review / 遷移記録（append-only）

- Final Review（独立 Sonnet、fresh context、read-only）2026-08-28: content commit の diff 全 hunk を Scope 1〜5 と突合し packet 外 hunk 0 / AC-1〜AC-5 独立再実測（`rg` / `bash scripts/doc-consistency-check.sh`、コマンドは Acceptance Criteria 記載どおり）で全 PASS / 新文言 3 箇所は packet literal・正本 65 §65.8.3 と同型（結論・トリガー不変）/ csv_import 節 byte 無改変 / stocktake 詳細 route 実在を route file + routeTree 登録で裏取り / 更新履歴 dated 行は既存行無改変 / DEV_SETUP 注記の機序は package.json / .npmrc 実読と整合 / Writer 逸脱 1 件（更新履歴要旨の paraphrase 化 = AC-1 自己衝突回避）は裁量範囲と裁定。P1: 0 / P2: 0 / P3: 0。
- state-only 遷移 `implementing->local-verified->independent-review->human-confirm` の根拠: content candidate の L1 `local-ci.sh full` CLEAN PASS evidence（implementing->local-verified。exact SHA と evidence 位置は PR body を正とする）/ 独立 Final Reviewer 監査完了（local-verified->independent-review）/ findings P1/P2 = 0 裁定済み + Reviewed Content HEAD 設定（independent-review->human-confirm）。
- state-only 遷移 `human-confirm->ready-hosted-final` の根拠: owner Ready 承認 2026-08-28（wave 6 batch、本 lane 介入 2/3。train の Ready 遷移実行・merge・closeout を Coordinator へ委任）。exact HEAD の L1 full evidence と hosted run は PR body を正とする。
