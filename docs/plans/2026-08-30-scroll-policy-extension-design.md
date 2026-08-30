# DSR-17 拡張 Design Phase — 分類④主ナビ先頭 + 分類②実装方式契約

## Workflow State

- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable（Claude Code session、conductor）
- Writer: Codex（外部端末、発注書 relay。§3.1 により Fable は docs Writer に投入しない）
- Plan Reviewer: Sonnet subagent（fresh context）一次 + Fable 裁定（2026-08-30、round 1 = P1×2〈(g) 分類④×cache hit 競合未解決 / (h) 分類③ negative 契約との干渉未検討〉+ P3×1〈file:line offset〉、全件 Fable 実読裏取りの上 accept → 是正 commit、round 2 独立再検証は pending）
- Final Reviewer: Sonnet subagent（fresh context、Plan Reviewer とは別個体）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Codex 発注 relay、Ready（docs-only のため Ready 後の owner `workflow_dispatch` を含む、CI-TRIGGER-D1）、merge

この plan-first commit は `kickoff -> spec-check -> design -> plan-draft -> plan-gate` を materialize する。task scope / Risk は本 packet、design の必要性は「起票時実測」節（復元機構 0 件 + router 既定 key と push 戻りの不整合 + owner 裁定 2 件）、design 出力（DSR-17 拡張ほか）は plan-approved 後の Writer content commit で追加する。Plan Reviewer の独立性は Claude 側で充足するため、Plan Review を pending のまま Draft PR checkpoint で停止する。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者可視に何が完了するか1文`。
介入 1 回目は起票時の owner 裁定 2 件（2026-08-30、分類④統合 + DSR-18 R3 先行）で消費済み。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only の Design Phase PR。後続 R3 実装（scroll 復元）が従う DSR-17 の拡張契約（分類④新設 + 分類②実装方式）を source docs に固定するが、本 PR は runtime code、test、router 設定、generated bindings を変更しない。spike 実行・runtime 是正は後続 R3 packet とする。

## Goal

Goal Invariant:

### 最小完了条件

- DSR-17 が 3+1 分類の横断 scroll 契約（分類④ = 主ナビゲーションは遷移先先頭）へ拡張され、分類②の実装方式（push 戻り維持 + href key 復元 + `<main>` container 対応 + R3 Contract Probe で検証する未知点の列挙）が source docs だけで後続 R3 実装可能な粒度で確定し、owner 裁定 2 件（分類④統合 / DSR-18 R3 先行）が `Plans.md` へ反映される。

### 失敗定義

- 後続 R3 実装者が chat・archive packet を読まないと方式選定（key 上書き・container selector・fallback 挙動）や spike 検証項目を復元できない状態、または runtime code に diff がある状態。

### 非目的

- scroll 復元の runtime 実装・test、spike の実行そのもの、DSR-18 R3（returnTo 付与）の実装、戻り導線の方式変更（push 維持は前提）、Home one-shot（分類③）・保存時 scroll（分類①）の挙動変更。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- `docs/design-system/01-decision-rules.md` の DSR-17 を拡張する:
  - **分類④「主ナビゲーションは遷移先先頭」を新設**（owner 所感、PR #17 comment 5463874988 起源）。発火契機は主ナビゲーション（sidebar 等の navigation 操作）による route 遷移であり、route component の mount ではない——既存の「mount 一律 scroll 禁止」（PR #15 Amendment 2 revert の再導入禁止）とは発火契機で切り分けて両立することを明文化する。
  - **分類②の実装方式契約を確定**する: (a) 戻り導線は `<Link>` push 遷移を維持（DSR-18 returnTo 契約と整合、`history.back()` 化は棄却）、(b) TanStack Router `scrollRestoration` 導入時は `getScrollRestorationKey` を href key へ上書きする（実装既定の `__TSR_key` は history entry ごとに新規発行され push 戻りで復元不能 — 起票時実測参照）、(c) 唯一の scroll container `<main>` へ `data-scroll-restoration-id` を付与し CSS selector の位置依存 cache を排除、(d) 復元 miss / 分類④の先頭 scroll は `scrollToTopSelectors` で `<main>` を対象化（既定 fallback は window 限定で `<main>` に効かない — 起票時実測参照）、(e) 既存 event-driven `scrollPageToTop()`（分類①③の正本）は router 機構へ吸収せず併存、(f) WebView2 の sessionStorage 実機挙動・smooth scroll との干渉は R3 の Contract Probe + L3 で検証し、検証 fail 時は方式再裁定を revisit trigger として明記する、(g) **分類④と href key 復元の競合優先順位**: href key は URL 同一なら遷移契機（push / back / 主ナビ）を問わず同一 key になるため、同一 href に scroll cache が残る状態で主ナビから再訪すると復元が先頭 scroll に勝ち得る。契約は「主ナビ発火時は分類④が復元より優先（常に遷移先先頭）」とし、実現機構の候補（主ナビ navigation への `resetScroll` 指定〈router-core `buildAndCommitLocation` の `resetScroll` option、実在確認済み〉/ `scrollRestoration` の function 化による対象 route 制御 / 主ナビ link への restoration 対象外の目印）を列挙、選定は R3 spike の検証対象とする、(h) **分類③（Home one-shot、UI-11b-D12）との干渉整理**: `scrollRestoration` 有効化は cache miss 時に全 route の通常遷移へ先頭 scroll fallback を既定発火させるため、UI-11b-D12 の negative 契約（flag なしの通常 Home 到達では one-shot smooth scroll を発火しない）と衝突し得る。DSR-17 拡張本文で「UI-11b-D12 の negative 契約は smooth scroll（`scrollPageToTop()` 経路）の専有契約であり router の遷移時位置決めと機構分離する」旨を整理した上で、既存 negative test（`HomePage.test.tsx`）の regression なしを R3 の必須 AC とし、必要なら分類③対象 route の `scrollRestoration` 適用除外（function 化）を機構候補に含める。
  - 更新履歴へ行追加。
- `docs/quality/review-checklist.md` カテゴリ 9 の DSR-17 対応行を 3+1 分類へ同期する。
- `Plans.md`: backlog「hub 等の詳細戻り scroll 位置復元」行を design 確定済みへ更新し、R3 の着手順（DSR-18 R3〈returnTo 付与 + 共通 helper〉先行 → scroll 復元 R3）の owner 裁定を記録する。
- 本 Plan Packet の作成・commit（plan-first）。

## Non-scope

- `src/` / `src-tauri/` の runtime code、router 設定、test、generated file（scroll 復元実装と spike 実行は後続 R3 packet）。
- DSR-18 の R3 実装（returnTo 8 site 付与 + 共通 helper — 先行する別 R3 packet）。
- 分類①（保存時先頭 scroll、DSR-03 / UI-08-D6 正本）・分類③（Home one-shot、UI-11b-D12 正本）の挙動・doc 変更。
- 本 Scope 外の `Plans.md` backlog / 次の行動④⑤。

## 起票時実測（2026-08-30、HEAD d21c961）

Explore subagent による実読検証（design docs / `src/main.tsx` / `RootLayout.tsx` / 各 page の scroll 呼出 sweep + `node_modules/@tanstack` の router 実装読解）。

- **現状の復元機構は 0 件**: router 生成（`src/main.tsx:25-29`）は `defaultPreload` / `defaultErrorComponent` のみで `scrollRestoration` 未設定（既定 false）。scroll container は persistent `<main className="min-h-0 min-w-0 overflow-auto">`（`src/components/layout/RootLayout.tsx:65`、Outlet の外で unmount されない）。route 遷移で scrollTop が持ち越され、短い詳細 page 側で clamp されるため戻る前に位置が失われる構造。DSR-17 本文の前提記述（`<main>` 唯一 container・`scrollRestoration` 未設定）は HEAD で真。
- **既存の意図的 scroll は全て event-driven で DSR-17 遵守**: 共通 helper `scrollPageToTop()`（`src/lib/page-scroll.ts:3`、smooth）。分類③ = `HomePage.tsx:37-43`（one-shot flag 消費時のみ、negative test あり）。分類① = 保存成功/失敗 handler（Receiving/Disposal/ManualSale/ReturnExchange）+ PluExport の step 遷移。mount 一律 scroll は 0 件。
- **router 実装既定 key の drift（本 change の設計根拠）**: `@tanstack/react-router` 1.168.23（package.json `^1.168.23`、lock・node_modules 実体一致）。`router.d.ts:321` の JSDoc は `@default (location) => location.href` と言うが、実装 `scroll-restoration.js:44-46` の既定は `location.state.__TSR_key || location.href`。`__TSR_key` は history entry ごとに新規発行されるため、現行の `<Link to={backHref}>` push 戻り（`DisposalRecordDetailPage.tsx:85,103` ほか 6 detail page 同型）では既定のまま復元が効かない。
- **fallback は window 限定**: 復元 entry が無い場合は `window.scrollTo` + `scrollToTopSelectors`（既定 `['window']`）のみ実行（`scroll-restoration.js:153-174`）。`scrollRestoration: true` だけでは分類④（主ナビで `<main>` 先頭）は満たせない。
- **cache は sessionStorage**（key `tsr-scroll-restoration-v1_3`、`scroll-restoration.js:11-22`、`pagehide` persist）+ `window.history.scrollRestoration = "manual"` の強制（`:75`）。WebView2 での再起動またぎ挙動は未知 — R3 の L3 検証対象。
- **owner 所感④の原文所在**: PR #17 comment 5463874988「主ナビゲーションは遷移先先頭、詳細戻りは位置復元、操作完了 Home は one-shot とする横断 scroll 契約」。repo 内参照 = `docs/archive/plans/2026-08-30-ui-polish-batch-2.md:25`、backlog 統合裁定文言 = Plans.md の該当行、起票 commit `87bda10`。
- **対象 page（長い一覧 ⇄ 詳細の往復）**: `/inventory/records` hub（詳細 6 種）、`/products`（typed return-to 済み）、`/settings/logs`、作業 4 画面の recent list、`/stocktake`、`/csv-import`。

## Acceptance Criteria

- DSR-17 に分類④が新設され、発火契機（navigation 操作）と mount 一律禁止の切り分けが明文化されている。
- 分類②の実装方式契約 (a)〜(h) が DSR-17 本文に確定し、後続 R3 が chat 非依存で方式（href key 上書き / `data-scroll-restoration-id` / `scrollToTopSelectors` / 併存方針）、競合優先順位（分類④ > 復元 cache、分類③ negative 契約の非侵食）、検証義務（Contract Probe + L3、fail 時 revisit）を復元できる。
- 実装既定 key の drift（`__TSR_key` 問題）が版数付きで DSR-17 の Why または判定フローに記録され、再検証の起点になる。
- review-checklist カテゴリ 9 の DSR-17 行が 3+1 分類へ同期している。
- `Plans.md` の backlog 再編が owner 裁定 2 件（分類④統合 / DSR-18 R3 先行）と一致する。

## Design Sources

- Requirements / spec: なし（新規 REQ token 追加なし。scroll 契約の root は DSR-17）
- Architecture: 変更なし
- Function / command / DTO: 変更なし（分類①③の正本 = DSR-03 / UI-08-D6 / UI-11b-D12 は参照のみ）
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md`（DSR-17 本体、DSR-15 / DSR-18 との整合）、`docs/UI_TECH_STACK.md`（router 構成の記述があれば Writer が rg で確認し、矛盾時のみ報告）
- Decision log / ADR: DSR-17（拡張対象）/ DSR-18（戻り導線 push 維持の整合先、PR #20 で確定）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | design-system 01（DSR-17 拡張）/ review-checklist | updated in this PR |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | DSR-17 拡張（design-system 01 が durable home、新番号は増やさない） | updated in this PR |

## Registration / Generation Obligations

該当なし（既存 doc の節改訂のみ。新規 doc・route・command・REQ token の追加なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| DSR-17（分類④新設） | design-system/01-decision-rules.md DSR-17 節 | DSR-17（改訂） | owner 所感（PR #17 comment 5463874988）の横断契約要求。別 DSR 新設案は同一トピック分裂で棄却、mount 一律 scroll 解禁案は PR #15 Amendment 2 の教訓で棄却 | 後続 scroll R3 packet | 後続 R3 Matrix |
| DSR-17（分類②方式契約） | 同上 | DSR-17（改訂） | push 戻り + href key 上書きが DSR-18 returnTo 契約と相互補完（returnTo が href を再現 → href key 復元が効く）。`history.back()` 化は DSR-18 と衝突し棄却。既定 key 放置は実装既定 `__TSR_key` により復元不能で棄却 | 後続 scroll R3 packet（DSR-18 R3 の後） | 後続 R3 Matrix + Contract Probe + L3 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 PR 完了後、DSR-17 拡張本文で成立する。owner 所感の原文は PR comment 起源のため、要旨と出典（PR #17 comment ID）を DSR-17 側に記録する。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: owner 裁定 2 件（分類④統合 / DSR-18 R3 先行）→ DSR-17 本文と Plans.md へ promote。
- Assumptions and constraints: router 1.168.23 の実装挙動（既定 key / fallback / sessionStorage）は node_modules 実読による観測事実であり、版数更新で変わり得る——DSR-17 に版数付きで記録し、R3 Contract Probe を再検証の関門にする。
- Deferred design gaps, risk, and follow-up target: spike 実行と WebView2 実機挙動（R3）、(g) 競合機構の選定と (h) 分類③非侵食の実証（R3 spike / regression test）、DSR-18 R3（先行実装）、`/stock` 詳細入口未整備（既存 backlog）。
- Test Design Matrix can cite design decision IDs or source doc sections: 後続 R3 Matrix が DSR-17 の (a)〜(h) を行単位で cite できる粒度で書く。
- Absolute guarantee / escape hatch self-check completed: 復元 miss 時は先頭 scroll fallback（安全側）。例外 2 系（(g) 主ナビ×cache hit 競合 = 分類④優先、(h) 分類③ route への既定 fallback 波及 = negative 契約非侵食の義務化）を契約に計上済み。検証 fail 時の revisit trigger を DSR-17 に明記し、片道決定にしない。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | TanStack Router の scroll 実装（外部 library）と app 契約の境界。library 挙動は版数付き観測として記録し、app 契約（4 分類）は library 非依存に書く | DSR-17 |
| Fact check / design decision split | router 既定 key の drift・fallback window 限定は node_modules 実読の観測事実、4 分類と方式選定は owner 裁定 + design decision | 本 packet / DSR-17 |
| Lifecycle / retry | 復元 miss（cache 消滅・再起動）時は先頭 scroll fallback で安全側。WebView2 の sessionStorage 寿命は R3 L3 で検証 | 後続 R3 packet |
| Operator workflow | 長い一覧での調査往復（絞り込み → 詳細 → 戻り）で位置を失わないことが業務価値。主ナビ切替では先頭表示が predictable | DSR-17 |
| Replacement path | router 更改時は DSR-17 の版数付き観測記録が再検証の起点 | DSR-17 revisit trigger |
| Data safety / evidence | 実 store データ不要。scroll 位置は sessionStorage のみで永続個人情報なし | 本 packet |
| Reporting / accounting semantics | not applicable — 集計語義に触れない | — |
| Manual verification | WebView2 の sessionStorage / smooth scroll 干渉 / 実復元挙動は R3 の Windows native L3 で検証、本 PR は docs のみ | 後続 R3 packet |
| 環境・再現性 | router version は package.json + lockfile で pin 済み。DSR-17 に観測版数（1.168.23）を明記 | DSR-17 |

## Design Readiness

- Existing design docs are sufficient because: 不十分 — DSR-17 は分類②の方式選定を spike 側の宿題として残し、分類④は未定義（本 PR で是正）。
- Source docs updated in this PR: design-system 01（DSR-17 拡張）/ review-checklist / Plans.md。
- Design gaps intentionally deferred: spike 実行・WebView2 実機挙動（R3 Contract Probe + L3）、DSR-18 R3。
- Durable decisions discovered in this plan and promoted to source docs: owner 裁定 2 件 → DSR-17 / Plans.md。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI 層内のみ、境界変更なし。
- Backend function design: 変更なし。
- Command / DTO / data contract: 変更なし。
- Persistence / transaction / audit impact: なし（scroll 位置は sessionStorage のみ）。
- Operator workflow / Japanese UI wording: 文言変更なし、挙動契約のみ。
- Error, empty, retry, and recovery behavior: 復元 miss 時の先頭 scroll fallback を契約化。
- Testability and traceability IDs: DSR-17 (a)〜(h) を後続 R3 の Matrix / Probe が cite。

## Contract Probe

N/A — 本 PR は docs-only で外部前提の実行検証を伴わない。router 実装の観測（既定 key / fallback / sessionStorage）は「起票時実測」節の node_modules 実読を根拠とし、実行時挙動の裏取りは後続 R3 の Contract Probe（是正仮適用の end-to-end: `scrollRestoration` + href key + `data-scroll-restoration-id` + `scrollToTopSelectors` を入れた状態で保存→復元→miss fallback を通す）と L3 に義務付ける。

## Contract Coverage Ledger

N/A — R2 docs-only。後続 scroll R3 packet で DSR-17 (a)〜(h) × 対象 page の Ledger を必須とする。

## Test Plan

- targeted tests: docs-only のため L1 full の docs 系 gate（doc-consistency-check、link checker）を evidence とする。
- negative tests: N/A(runtime 変更なし)。
- compatibility checks: DSR-17 の既存 3 分類の記述（分類①③の正本参照、mount 一律禁止）が拡張後も残存することを rg presence oracle で確認。
- data safety checks: 実 store データなし。
- main wiring/integration checks: N/A。

## Boundary / Wire Contract

本 PR は docs-only で wire 変更なし。後続 R3 で以下を Ledger 化する予告のみ記す:

- producer: router `scrollRestoration`（href key、`<main>` の scroll event capture）
- consumer: `<main>` scroll container（`data-scroll-restoration-id` 付与）
- wire type: sessionStorage（`tsr-scroll-restoration-v1_3`）
- invalid input: 復元 entry 欠落時は `scrollToTopSelectors: ['main']` による先頭 scroll fallback
- compatibility: 既存 event-driven `scrollPageToTop()`（分類①③）と併存、干渉は R3 Probe で検証

## Review Focus

- 分類④の発火契機定義が「mount 一律 scroll 禁止」と矛盾なく切り分けられているか。
- 分類②方式契約 (a)〜(h) が R3 実装者に十分な粒度か、かつ library 観測事実（版数付き）と app 契約が分離して書かれているか。
- (g) 競合優先順位（分類④ > 復元 cache）と (h) 分類③ negative 契約の非侵食が、機構候補の列挙 + R3 検証義務として閉じているか。
- DSR-18（push 戻り + returnTo）との整合——href key 復元との相互補完関係が正しく記述されているか。
- Plans.md 再編が owner 裁定 2 件と一致するか。
- 既存分類①③の正本（DSR-03 / UI-08-D6 / UI-11b-D12）を侵食していないか。

## Spec Contract

N/A — R2。

## Trace Matrix

N/A — R2（Design Intent Trace を参照）。

## Data Safety

N/A — R2 docs-only、実 store データ非関与。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
