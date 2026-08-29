# 画面遷移 scroll 方針の規範化 Design Phase

## Workflow State

- Phase: implementing
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: 84b1179754d2742f09c09670371b78d3f2640f25
- Amendments: none
- Coordinator: Fable（Claude Code session、conductor）
- Writer: Codex（本 session）
- Plan Reviewer: Sonnet subagent（fresh context）一次 + Fable 裁定（2026-08-29、round 1 = P1×1 / P2×2 → 是正 commit 14c06136eb828620cd5027b17ab3c32d952c58c8、round 2 独立再検証で P1/P2 = 0）
- Final Reviewer: Sonnet subagent（fresh context、Plan Reviewer とは別個体）+ Fable 裁定（pending）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Plan Review、Ready、merge

この content commit は `kickoff -> spec-check -> design -> plan-draft -> plan-gate` を materialize する。task scope / Risk は本 packet、design の必要性と出力は DSR-17 / UI-11b-D12、packet 完備と commit は本 change を evidence とする。Plan Reviewer の独立性は Claude 側で充足するため、本 PR では `plan-approved` へ進めず、Plan Review を pending のまま Draft PR checkpoint で停止する。

2026-08-29: Plan Review 完了（Sonnet subagent 一次、Writer = Codex と別主体。round 1 = P1×1 / P2×2、全件 Fable 裁定 accept、是正 commit 14c06136eb828620cd5027b17ab3c32d952c58c8、round 2 独立再検証で P1/P2 = 0・regression なし）。plan-approved の evidence が成立した。この state-only commit は `plan-gate -> plan-approved -> implementing` を materialize する。plan-first commit 84b1179 は全 content commit の先頭にあり PK5 ancestry を充足する。本 PR は docs-only Design Phase のため implementing で追加する implementation content はなく、次は content candidate 14c0613 の L1 evidence で `implementing -> local-verified` へ進む。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only の Design Phase PR。後続実装が従う画面横断 scroll と復元成功 Alert の durable contract を source docs に固定するが、本 PR は runtime code、test、route/search state、command wire shape、DB、generated bindings を変更しない。後続の表示磨き実装は別 packet とする。

## Goal

Goal Invariant:

### 最小完了条件

- 画面遷移 scroll の 3 分類規範と復元成功 Alert の scroll 契約が source docs（DSR-17 / UI-11b-D12）だけで後続実装可能な粒度で確定し、owner 裁定 3 件が `Plans.md` へ反映される。

### 失敗定義

- 後続実装者が chat・archive packet を読まないと scroll 発火条件（one-shot flag 条件 / negative test 義務 / mount 一律禁止）を復元できない状態、または runtime code に diff がある状態。

### 非目的

- scroll の runtime 実装・test、hub の位置復元設計、`scrollRestoration` の導入検証、状態表現の doc 改訂。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- `docs/design-system/01-decision-rules.md` に DSR-17 を追加し、画面遷移と scroll の 3 分類、発火条件、mount 一律 scroll 禁止を正本化する。
- `docs/function-design/68-ui-backup-restore.md` に UI-11b-D12 を追加し、復元成功 Alert の初期可視性と通常 Home 到達の negative contract を固定する。
- `docs/quality/review-checklist.md` カテゴリ 9 に DSR-17 対応行を追加する。
- `Plans.md` の「次の行動」③と関連 backlog を owner 裁定に合わせて再編する。
- 本 Plan Packet を作成し、1 content commit と Draft PR にまとめる。

## Non-scope

- `src/` / `src-tauri/` の runtime code、test、generated file。
- hub 等の詳細戻り位置復元の方式選定、TanStack Router `scrollRestoration` の検証 spike。
- 入出庫履歴の状態表現を統一する design doc 改訂。owner 裁定どおり現状維持とする。
- card-soup 監査で確認したグレー候補の runtime 是正。
- 本 Scope 外の `Plans.md` backlog / 次の行動④⑤。

## 裁定記録

- 入出庫履歴の状態表現統一: 現状維持で close（owner 裁定 2026-08-29）。`docs/function-design/65-inventory-record-traceability.md` §65.6.1 の意図的乖離を維持し、source doc は改訂しない。
- card-soup 監査: 違反 0 件、グレー 2 件を表示磨き batch 第 2 弾候補へ編入して close（Explore 実査 2026-08-29、Fable session）。候補は CostDiffDialog の商品名見出し格上げと、整合性検証の補正結果 per-item border の `divide-y` 化。

## Acceptance Criteria

- DSR-17 が persistent `<main>` / `scrollRestoration` 未設定の構造前提、3 分類、分類別の発火契約、mount 一律 scroll 禁止を source doc だけで説明する。
- UI-11b-D12 が D11 flag 取り込み時だけの `scrollPageToTop()`、通常 Home 到達では発火しない negative test 義務、DSR-17 分類③との関係を固定する。
- `Plans.md` は状態表現統一を現状維持で close し、card-soup 監査を違反 0・グレー 2 件の表示磨き候補編入で close し、詳細戻り scroll だけを別 change backlog に残す。
- `src/` / `src-tauri/` と Scope 外 docs に diff がなく、変更 file が Scope の 5 file だけである。
- `bash scripts/doc-consistency-check.sh`、`rg -F -c` による DSR-17 / UI-11b-D12 実在確認、`git diff --check`、`git diff --stat`、`git status --short` が pass する。
- 変更を 1 content commit に集約し、remote ref を実確認して Draft PR を open し、Ready / merge 前で停止する。

## Design Sources

- Requirements / spec: `docs/function-design/68-ui-backup-restore.md` の対応 REQ（QR-05 / REQ-905）。新規 REQ は採番しない。
- Architecture: `docs/function-design/52-ui-shared-layout.md` §52.1（RootLayout 構成の正本）。`src/components/layout/RootLayout.tsx` の persistent `<main>` と `src/main.tsx` の router 設定は構造事実の確認のみ。
- Function / command / DTO: `docs/function-design/68-ui-backup-restore.md` UI-11b-D11 / D12。
- DB: 変更なし。
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-03 / DSR-17、UI-08-D6。
- Decision log / ADR: owner 裁定 2026-08-29、PR #15 Amendment 2 の実証記録。本 PR では新規 global decision ID / ADR を採番しない。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし | intentionally deferred。runtime backend 非変更 |
| Command / DTO / generated binding / wire shape | なし | intentionally deferred。wire 非変更 |
| DB / transaction / audit / rollback / migration | なし | existing sufficient。DB 非変更 |
| Screen / UI / route state / Japanese wording | DSR-17、UI-11b-D12 | updated in this PR |
| CSV / TSV / report / import / export format | なし | intentionally deferred。format 非変更 |
| Durable decision / ADR | DSR-17、UI-11b-D12 | updated in this PR。新規 global ID 不要 |

## Registration / Generation Obligations

該当なし。本 PR は既存 source docs の改訂と Plan Packet 新設だけであり、新規 command / function-design doc / workflow doc / REQ coverage / route / operator 画面を追加しない。Plan Packet は `docs/plans/` の既存 artifact 規則で登録される。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| operator UI 横断 | `docs/design-system/01-decision-rules.md` | DSR-17 分類① | 状態遷移後の結果可視性は既存 DSR-03 / UI-08-D6 を再利用し、重複契約を却下。 | existing / future mutation handlers | existing event-driven tests |
| operator UI 横断 | `docs/design-system/01-decision-rules.md` | DSR-17 分類② | 一覧→詳細→戻りは先頭化でなく位置復元。mount 一律は PR #15 Amendment 2 の回帰を招くため却下。 | future router / layout change | future restoration spike / navigation test |
| QR-05 / REQ-905 | `docs/function-design/68-ui-backup-restore.md` | UI-11b-D12 / DSR-17 分類③ | D11 の one-shot Alert に初期可視性を付加し、通常 Home 到達への一律適用を却下。 | future `HomePage` mount effect | flag ありの先頭 scroll + flag なしの negative test |
| owner 裁定 | `Plans.md` | 2026-08-29 backlog 裁定 | 状態表現は意図的乖離を維持し、card-soup 監査はグレー候補だけを表示磨きへ送る。 | dashboard routing only | diff review |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes。3 分類、one-shot 発火条件、negative test、禁止事項を DSR-17 / UI-11b-D12 へ置く。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: scroll の durable contract は DSR-17 / UI-11b-D12 へ昇格。backlog close の裁定記録は本 packet と `Plans.md` に置く。
- Assumptions and constraints: persistent `<main>` と router の `scrollRestoration` 未設定を現行 code で確認。既存 one-shot flag は UI-11b-D11 に従う。
- Deferred design gaps, risk, and follow-up target: 詳細戻り位置復元は検証 spike 付き別 change。D12 runtime 実装は表示磨き batch 第 2 弾候補。
- Test Design Matrix can cite design decision IDs or source doc sections: R2 docs-only のため Matrix 不要。後続実装は DSR-17 / UI-11b-D12 から test を導出できる。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: Home 先頭表示の例外を D11 型 one-shot flag 消費時だけに限定し、通常到達を negative test で固定する。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 外部 adapter 非関与。scroll は frontend UI 横断規約。 | DSR-17 |
| Fact check / design decision split | persistent `<main>` / router 設定は code 事実、3 分類と禁止は owner 裁定。 | DSR-17 / UI-11b-D12 |
| Lifecycle / retry | D11 flag の set / consume / clear と mount 中 Alert 維持は既存契約。D12 は consume 成功時だけ可視性を付加。 | UI-11b-D11 / D12 |
| Operator workflow | 復元成功後に Home 上部の Alert を初期表示範囲へ入れ、詳細戻りの文脈は保持する。 | DSR-17 / UI-11b-D12 |
| Replacement path | router 実装方式は分類②の別 spike で選ぶ。3 分類の product contract は方式から独立。 | future change |
| Data safety / evidence | docs-only。実店舗 DB / backup / log /価格等に接触しない。 | diff / PR evidence |
| Reporting / accounting semantics | not applicable。会計・在庫データ意味論を変更しない。 | none |
| Manual verification | 本 PR は runtime 変更なし。D12 後続実装で operator 目視要否を再判定する。 | future R2/R3 packet |
| 環境・再現性 | 新規環境依存なし。local repo の source と repo-owned docs checker だけを使う。 | validation log |

## Design Readiness

- Existing design docs are sufficient because: DSR-03 / UI-08-D6 と UI-11b-D11 が状態遷移後の可視性と one-shot flag の既存契約を持つ。
- Source docs updated in this PR: DSR-17、UI-11b-D12。
- Design gaps intentionally deferred: 詳細戻り位置復元方式と `scrollRestoration` spike、runtime/test、Windows native 目視。
- Durable decisions discovered in this plan and promoted to source docs: scroll 3 分類、mount 一律禁止、復元成功時の条件付き先頭表示。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): frontend UI 表示だけの将来契約。CMD / BIZ / IO / MNT は非関与。
- Backend function design: 変更なし。
- Command / DTO / data contract: 変更なし。
- Persistence / transaction / audit impact: 変更なし。
- Operator workflow / Japanese UI wording: 復元成功 Alert の既存文言は不変。初期可視性だけを追加契約化。
- Error, empty, retry, and recovery behavior: 復元失敗では flag を set しない D11 契約を維持。navigate reject 時の clear も不変。
- Testability and traceability IDs: UI-11b-D12 を後続 test の trace ID とし、flag なし negative test を必須化。

## Contract Probe

- N/A: 外部 premise なし。現行構造は repository の `RootLayout.tsx` / `main.tsx` / PR #15 Amendment 2 で確認済み。

## Contract Coverage Ledger

R2 docs-only: not required。後続 runtime change が R3 に分類される場合は、その packet / Matrix で DSR-17 / UI-11b-D12 を ledger 化する。

## Test Plan

- targeted tests: `bash scripts/doc-consistency-check.sh` を `/tmp/doccheck.log` へ直接書き、exit code と `RESULT` 行を確認する。
- negative tests: `src/` / `src-tauri/` / Scope 外 docs の diff 0、通常 Home 到達時に scroll しない契約が source doc に実在すること。
- compatibility checks: `rg -F -c` で DSR-17 / UI-11b-D12 の実在確認、`git diff --check`。
- data safety checks: `git status --short` で意図した docs だけを確認し、実店舗 artifact がないことを確認する。
- main wiring/integration checks: docs-only のため runtime gate / Test Design Matrix は不要。Design Intent Trace で代替する。

## Boundary / Wire Contract

- N/A: browser history / route search / command DTO / generated binding / DB wire を変更しない。将来の scroll 発火は UI component-local effect と in-memory one-shot flag の内部契約だけを使う。

## Review Focus

- 3 分類が相互排他的で、通常 Home 到達と復元成功後の Home 到達を明確に区別できるか。
- DSR-17 が DSR-03 / UI-08-D6 を重複定義せず、UI-11b-D12 が D11 の表示寿命・StrictMode 契約を弱めていないか。
- mount 一律禁止、negative test 義務、詳細戻り位置復元の defer が source docs だけで復元できるか。
- `Plans.md` が状態表現統一 / card-soup 監査を close し、後続候補だけを重複なく残しているか。

## Spec Contract

R2 docs-only: not required。durable contract は DSR-17 / UI-11b-D12 を正本とする。

## Trace Matrix

R2 docs-only: not required（Design Intent Trace で代替）。

## Data Safety

R2 docs-only: runtime / store data 非接触。実 CSV、DB、JAN、価格、log、backup、secret を読まず、commit しない。

## Implementation Results

docs-only Design Phase。runtime scroll 実装と test は後続の表示磨き batch 第 2 弾候補、詳細戻り位置復元は検証 spike 付き別 change とする。

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none。
- Plan Reviewer: pending（Sonnet subagent fresh context 一次 + Fable 裁定）。
- Final Reviewer: pending（Plan Reviewer とは別の Sonnet subagent fresh context + Fable 裁定）。
- Review-only skipped because: narrow R2 docs-only Design Phase で runtime mutation がなく、repo-owned docs gate と独立 Plan / Final Review を Draft PR 上で行うため。
