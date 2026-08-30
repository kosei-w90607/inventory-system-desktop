# 成功 feedback / destructive dialog 横断規約 Design Phase — DSR-19 + DSR-20

## Workflow State

- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable（Claude Code session、conductor）
- Writer: Codex（外部端末、発注書 relay。§3.1 により Fable は docs Writer に投入しない）
- Plan Reviewer: Sonnet subagent（fresh context）一次 + Fable 裁定（2026-08-30、round 1 = P1×0 / P2×1〈Scope DSR-20 の項目数と AC 5 要素の不整合〉/ P3×1〈PK4 link の plan-first 前倒し提案〉、全件 accept → 是正 commit で Scope (1)〜(5) 化 + Plans.md active link 前倒し追加、round 2 独立再検証は pending）
- Final Reviewer: Sonnet subagent（fresh context、Plan Reviewer とは別個体）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Codex 発注 relay、Ready（docs-only のため Ready 後の owner `workflow_dispatch` を含む、CI-TRIGGER-D1）、merge

この plan-first commit は `kickoff -> spec-check -> design -> plan-draft -> plan-gate` を materialize する。task scope / Risk は本 packet、design の必要性は「起票時実測」節（feedback 5 方式分岐・通知なし 2 件・dialog 規範の空白 + owner 裁定 3 件）、design 出力（DSR-19 / DSR-20 ほか）は plan-approved 後の Writer content commit で追加する。Plan Reviewer の独立性は Claude 側で充足するため、Plan Review を pending のまま Draft PR checkpoint で停止する。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者可視に何が完了するか1文`。
介入 1 回目は起票時の owner 裁定 3 件（2026-08-30、B-2 toast 最低保証 / B-3 全面規範化 / 1 packet 同梱）で消費済み。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only の Design Phase PR。後続 R3 実装（toast 追加 2 件・variant 統一・硬化手段統一等）が従う横断規約（DSR-19 / DSR-20）を source docs に固定するが、本 PR は runtime code、test、component、generated bindings を変更しない。runtime 是正は後続 R3 packet とする。

## Goal

Goal Invariant:

### 最小完了条件

- 作成・保存成功の feedback 規約（toast 最低保証 + 併用基準 + duration 階層）が DSR-19 として、destructive 確認 dialog の規約（variant 統一 + 並び順 + dismiss 方針 + cancel 文言基準）が DSR-20 として source docs に確定し、通知なし 2 flow（取引先追加 / 価格改定行確定）の設計 doc 側契約が追記され、owner 裁定 3 件が `Plans.md` へ反映される。理論裏付け（『UXデザインの法則』第 2 版: Peak-End / Zeigarnik / Von Restorff）は Why に書誌付きで cite する。

### 失敗定義

- 後続 R3 実装者が chat・archive packet を読まないと「どの flow にどの feedback 方式・duration を使うか」「destructive dialog のボタン構成・dismiss・硬化の判断」を復元できない状態、または runtime code に diff がある状態。

### 非目的

- runtime 実装・test の追加（toast 追加・variant 変更・硬化手段統一は後続 R3）、既存 toast 文言の書き換え、DSR-16 × Von Restorff の階層衝突の解決（将来 DSR 改訂候補として記録のみ）、UI 表示磨き第 3 弾の起票。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- `docs/design-system/01-decision-rules.md`:
  - **DSR-19「作成・保存成功の feedback 規約」新設**（番号 19 は本 packet で予約）: (1) 作成・保存の成功は toast を最低保証とする（owner 裁定 B-2）、(2) result panel / 画面全置換は「保存後に継続作業・確認事項がある flow」の併用として基準化（既存の入庫系 result panel・棚卸し結果・CSV 取込み result step は基準適合の先例として整理）、(3) duration 階層の明文化 = 基本 3s（Toaster 全体既定）/ 重要情報付き 5s（商品保存の先例）/ 取消・非 IT operator 向け読了配慮 8s（PR #15 の先例）、(4) toast id 規約（連打重複抑止）の適用基準、(5) DSR-03「Toast vs Alert」を supersede せず refine する関係の明記。Why に『UXデザインの法則』第 2 版（Jon Yablonski、オライリー・ジャパン、2025-01）の Peak-End rule / Zeigarnik 効果を書誌付きで cite。
  - **DSR-20「destructive 確認 dialog の配置・dismiss 規約」新設**（番号 20 予約）: (1) destructive 確認の Action は `variant="destructive"` に統一（owner 裁定 B-3、現状 12 件中 3 件）、(2) ボタン並び順 = DOM 順 Cancel→Action（sm 以上で Cancel 左 / Action 右）を規範化し、narrow 幅の `flex-col-reverse`（Action が上）も意図された挙動として明文化、3 ボタン構成の順序先例（統合 stage 2）を規定、(3) 外クリック / Esc は cancel ブリッジを本則とし、硬化（dismiss 不可）の適用条件（誤 dismiss が在庫二重計上等の実害に直結する dialog — CostDiffDialog 先例 / 未保存破棄の意図的 friction — UnsavedChangesDialog、Zeigarnik の意図的活用として肯定）を規定、(4) 硬化の実装手段の 1 系統化（prop 明示硬化を正、`onOpenChange` 非配線の暗黙硬化は禁止）、(5) cancel 文言の基準（既定「キャンセル」、文脈上の具体文言は許容条件付き）。Why に Von Restorff 効果を書誌付きで cite。DSR-07（確認 dialog を出す境界）/ DSR-08（色単独禁止 — variant 統一は色 + 配置 + 文言の複合強調）/ DSR-16 との整合を明記。
  - 見出しの採番表記 drift 是正（「DSR-01〜15」→ 実体に同期）。
  - 更新履歴へ行追加。
- `docs/design-system/02-component-catalog.md`: ⑦ Toast の duration 記載を実装（全体既定 3000ms）+ DSR-19 階層へ是正（現行「既定 5000ms」は doc/impl drift）、⑧ Dialog / 確認へ並び順・variant・硬化条件の DSR-20 参照を追記。
- `docs/function-design/78-ui-supplier-management.md` §78.5: 取引先追加成功の完了通知契約（toast）を追記（§78.6/78.7 の完了通知と対称化、実装は後続 R3）。
- `docs/function-design/77-ui-bulk-price-revision.md`: 行確定の成功 feedback 契約（toast、DSR-19 適合）を該当節へ追記（実装は後続 R3）。
- `docs/UI_TECH_STACK.md`: §6.1 スタブの委譲先が catalog 更新で足りるか Writer が確認し、必要な場合のみ参照行を同期。UI-USW-D2（破棄確認 dialog）へ Esc 無効の明文化を追記（現状は実装のみで doc 記載なし）。
- `docs/quality/review-checklist.md`: DSR-19 / DSR-20 対応行を追加。
- `Plans.md`: 「次の行動」の active packet link は Plan Review round 1 是正 commit で Coordinator が追加済み（PR #21 の PK4 fail-closed で relay 1 往復を消費した教訓の前倒し適用）。Writer は backlog の「取引先追加成功 toast の横断規約」「統合 dialog のボタン配置・外クリック方針」2 行を design 確定へ更新し、runtime 是正の R3 を後続候補として記録し、merge までに active link の文言を最新 Phase へ保つ。
- 本 Plan Packet の作成・commit（plan-first）。

## Non-scope

- `src/` / `src-tauri/` の runtime code、component、test、generated file（toast 追加 2 件・variant 統一・硬化手段統一・cancel 文言是正は後続 R3 packet）。
- 既存 toast 文言・duration の実装変更。
- DSR-16 × Von Restorff の階層衝突の解決（将来 DSR 改訂候補として Plans.md 注意リストではなく本 packet の Deferred に記録）。
- DSR-18 R3 / scroll 復元 R3（別系統の既定 backlog、順序は確定済み）。
- 本 Scope 外の `Plans.md` backlog / 次の行動④⑤。

## 起票時実測（2026-08-30、HEAD 7485f92）

Explore subagent による全数棚卸し（toast 全 site rg + 主要 flow の成功 feedback 実読 + dialog 15 site 実読 + design docs 突合）。

- **toast 基盤**: sonner 2.0.7 単一。`RootLayout.tsx:69` の `<Toaster position="bottom-right" richColors closeButton duration={3000} />` が全体既定 3000ms。
- **成功 feedback は 5 方式に分岐**: toast のみ（改名・統合・PLU 一括・在庫少基準・帳票出力等）/ toast + result panel（入庫・返品交換・手動販売・廃棄の保存、`scrollPageToTop()` 併用）/ result panel のみ（売上 CSV 取込み確定・日報取込み確定 — toast は取消時のみ）/ 画面全置換（棚卸し確定 `StocktakeResultPage`）/ **なし 2 件** = 取引先追加（`CreateSupplierDialog.tsx:45-47` 2 実装とも。設計 doc 78 §78.5 も完了通知を規定せず、§78.6/78.7 のみ規定の非対称）と価格改定行確定（`PriceRevisionTable.tsx:51-57` — 入力欄クリア + 「最近改定」badge のみ）。
- **duration 3 分岐**: 全体既定 3000 / 商品登録・編集 5000（`ProductFormPage.tsx:105,141`）/ 取消 2 件 8000（PR #15、非 IT operator の読了配慮 comment あり）。catalog ⑦ の「自動消去（duration 既定 5000ms）」記載は実装（3000ms）と drift。toast id 規約は付与 site（帳票・商品保存）と未付与 site（PLU 一括・改名・統合）が混在。
- **dialog 15 site 棚卸し**: primitive は Radix 既定のまま（Esc / 外クリック閉じ・modal true）、footer は `flex-col-reverse … sm:justify-end`（DOM 順 Cancel→Action、narrow で Action が上）。destructive 確認 12 件中 `variant="destructive"` は 3 件のみ（UnsavedChanges / backup 復元 / 統合 stage 2）。「廃番にする」「取り消す」「補正を実行する」「確定する」は default variant。cancel 文言は「キャンセル」9 /「やめる」/「戻る」/「編集を続ける」の 4 種。3 ボタン構成は統合 stage 2（`MergeSupplierDialog.tsx:147-200`）が唯一の先例。
- **硬化の現状 2 例外・2 系統**: CostDiffDialog = prop 明示硬化（`onPointerDownOutside` / `onEscapeKeyDown` preventDefault + `showCloseButton={false}`、gated Amendment 5 の実害是正 comment あり、`CostDiffDialog.tsx:74-96`）/ UnsavedChangesDialog = `onOpenChange` 非配線による**暗黙**硬化（意図 comment なし、`UnsavedChangesDialog.tsx:18,30-33`）。catalog ⑧ は「Esc・外側クリックを onOpenChange 経由で cancel にブリッジ」を規定しており、硬化の適用条件・実装手段は未規範。
- **既存規範と採番**: DSR-03（Toast vs Alert）/ DSR-07（確認 dialog を出す境界）/ DSR-08（色単独禁止）/ DSR-16 が隣接。DSR 使用済みは 01〜18、**次の空き番号 = 19**。`01-decision-rules.md:1` の見出しは「DSR-01〜15」のままで実体と drift。
- **理論ソース**（分析班レポート 2026-08-30 の蒸留、正本は本 packet が初記録）: B-2 ← Peak-End rule + Zeigarnik 効果（完了の明示が作業の締めを作る）、B-3 ← Von Restorff 効果（危険な選択肢の孤立化）。UnsavedChangesDialog の Esc 無効は Zeigarnik の意図的活用として肯定評価。Von Restorff × DSR-16 の囲み階層との衝突は将来 DSR 改訂候補。書誌: Jon Yablonski『UXデザインの法則 ―最高のプロダクトとサービスを支える心理学』第 2 版、オライリー・ジャパン（相島雅樹・磯谷拓也 訳）、2025-01。原著 Laws of UX（lawsofux.com）。

## Acceptance Criteria

- DSR-19 が新設され、toast 最低保証・併用基準・duration 階層・id 規約適用基準・DSR-03 との refine 関係の 5 要素が後続 R3 で chat 非依存に実装可能な粒度で記述されている。
- DSR-20 が新設され、variant 統一・並び順（narrow 挙動と 3 ボタン先例含む）・dismiss 本則と硬化条件・実装手段 1 系統化・cancel 文言基準の 5 要素が同粒度で記述されている。
- 両 DSR の Why に理論が書誌付きで cite され、規範本文は theory 非依存の app 契約として自立している。
- 78 §78.5 と 77 の該当節に成功 feedback 契約が追記され、通知なし 2 flow の R3 是正が doc 裏付けを持つ。
- catalog ⑦ の duration drift が是正され、⑧ に DSR-20 参照が追記されている。01-decision-rules 見出しの採番表記が実体と同期している。
- `Plans.md` 再編が owner 裁定 3 件と一致し、本 packet の active link が「次の行動」に存在する。

## Design Sources

- Requirements / spec: なし（新規 REQ token 追加なし）
- Architecture: 変更なし
- Function / command / DTO: `docs/function-design/78-ui-supplier-management.md` / `77-ui-bulk-price-revision.md`（feedback 契約の追記先）
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md`（DSR-03 / 07 / 08 / 16 隣接）、`02-component-catalog.md`（⑦⑧）、`docs/UI_TECH_STACK.md`（§6.1 / UI-USW-D2）
- Decision log / ADR: DSR-03（refine 対象）/ DSR-07 / DSR-08 / DSR-16（整合確認先）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | design-system 01・02 / 78 / 77 / UI_TECH_STACK / review-checklist | updated in this PR |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | DSR-19 / DSR-20 新設（design-system 01 が durable home） | updated in this PR |

## Registration / Generation Obligations

該当なし（既存 doc の節追記・改訂のみ。新規 doc・route・command・REQ token の追加なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| DSR-19（本 packet で番号予約） | design-system/01-decision-rules.md | DSR-19 | toast 最低保証（owner 裁定 B-2）。「判断基準のみ明文化」案は通知なし flow の非対称を固定化するため棄却。Peak-End / Zeigarnik を Why に cite | 後続 R3 packet（toast 追加 2 件ほか） | 後続 R3 Matrix |
| DSR-20（番号予約） | 同上 | DSR-20 | 全面規範化（owner 裁定 B-3）。「配置・dismiss のみ」案は Von Restorff 上の主眼（destructive の孤立化）を欠くため棄却。暗黙硬化（handler 非配線）の禁止は実装手段の判読可能性のため | 後続 R3 packet（variant 統一・硬化手段統一ほか） | 後続 R3 Matrix |
| UI-15（78 §78.5） | 78-ui-supplier-management.md §78.5 | 78 側の次番 Dn または §78.5 本文契約（Writer が既存 doc の記法に合わせ rg で確定） | 追加成功のみ通知を欠く §78.6/78.7 との非対称是正 | 後続 R3 | 後続 R3 Matrix |
| 77 の該当 ID | 77-ui-bulk-price-revision.md 該当節 | 77 側の次番 Dn 同上 | 行確定の完了明示欠落（Zeigarnik）の是正 | 後続 R3 | 後続 R3 Matrix |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 PR 完了後、DSR-19/20 + 78/77 追記で成立する。理論ソースの書誌は DSR の Why に記録され、分析班レポート（chat 内限り）へ依存しない。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: owner 裁定 3 件 → DSR-19/20 / Plans.md へ promote。UnsavedChangesDialog の Esc 無効の意図（Zeigarnik 活用）を DSR-20 の硬化条件例として初めて doc 化。
- Assumptions and constraints: 既存 toast 文言・duration の実装は変更しない（規約は現状の 3/5/8 階層を追認して基準化）。variant 統一等の実装差分は R3 で一括。
- Deferred design gaps, risk, and follow-up target: Von Restorff × DSR-16 の囲み階層衝突（将来 DSR 改訂候補）、runtime 是正 R3、既存 R3 キュー（DSR-18 R3 → scroll R3）との着手順は R3 起票時に owner と選定。
- Test Design Matrix can cite design decision IDs or source doc sections: 後続 R3 Matrix が DSR-19 の 5 要素 / DSR-20 の 5 要素を行単位で cite できる粒度で書く。
- Absolute guarantee / escape hatch self-check completed: toast 最低保証の例外（result panel のみ等の既存 flow）は DSR-19 の併用基準で明示的に位置付け、暗黙例外を残さない。硬化は適用条件を閉じ、既定は cancel ブリッジ。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | sonner / Radix の library 挙動（既定 duration・dismiss）と app 規約を分離して記述 | DSR-19 / DSR-20 |
| Fact check / design decision split | 5 方式分岐・variant 3/12・硬化 2 系統は実測事実、toast 最低保証・全面規範化は owner 裁定 + 理論裏付けの design decision | 本 packet / DSR-19/20 |
| Lifecycle / retry | toast は一過性で再表示不可 — 回復導線が要る結果は DSR-03 どおり Alert 側（refine 関係で明記） | DSR-19 |
| Operator workflow | 非 IT operator の読了配慮（8s 先例）と、destructive 誤操作の実害防止（CostDiffDialog 先例）が規約の実益 | DSR-19 / DSR-20 |
| Replacement path | sonner / Radix 更改時は catalog ⑦⑧ の記載が再検証の起点 | catalog |
| Data safety / evidence | 実 store データ不要、file:line 実測のみ | 本 packet |
| Reporting / accounting semantics | not applicable — 集計語義に触れない | — |
| Manual verification | toast 視認性・dialog 操作感の実機確認は後続 R3 の L3 で実施、本 PR は docs のみ | 後続 R3 packet |
| 環境・再現性 | not applicable — 環境依存の新設なし | — |

## Design Readiness

- Existing design docs are sufficient because: 不十分 — DSR-03 は方式選択の判断基準を持たず、catalog ⑧ はボタン順・硬化条件を未規定、78 §78.5 / 77 は成功 feedback 契約を欠く（本 PR で是正）。
- Source docs updated in this PR: design-system 01・02 / 78 / 77 / UI_TECH_STACK / review-checklist / Plans.md。
- Design gaps intentionally deferred: runtime 是正（R3）、Von Restorff × DSR-16 階層衝突。
- Durable decisions discovered in this plan and promoted to source docs: owner 裁定 3 件 + UnsavedChangesDialog Esc 無効の意図の doc 化。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI 層内のみ、境界変更なし。
- Backend function design: 変更なし。
- Command / DTO / data contract: 変更なし。
- Persistence / transaction / audit impact: なし。
- Operator workflow / Japanese UI wording: cancel 文言基準と toast 文言の型を規約化（実装文言の変更は R3）。
- Error, empty, retry, and recovery behavior: toast（一過性）と Alert（回復導線）の境界を DSR-03 refine で維持。
- Testability and traceability IDs: DSR-19/20 の各要素を後続 R3 の Matrix が cite。

## Contract Probe

N/A — 外部 library / OS 前提の実行検証なし。sonner / Radix の既定挙動は「起票時実測」節の実読を根拠とし、実装時の挙動確認は後続 R3 の test / L3 に含める。

## Contract Coverage Ledger

N/A — R2 docs-only。後続 R3 packet で DSR-19/20 の各要素 × 対象 site の Ledger を必須とする。

## Test Plan

- targeted tests: docs-only のため L1 full の docs 系 gate（doc-consistency-check、link checker）を evidence とする。
- negative tests: N/A（runtime 変更なし）。
- compatibility checks: catalog ⑦ の旧「既定 5000ms」文言 0 hit + 新階層記述 exact 存在の対 oracle。DSR-03 / 07 / 08 / 16 の既存記述の非破壊を rg で確認。
- data safety checks: 実 store データなし。
- main wiring/integration checks: N/A。

## Boundary / Wire Contract

本 PR は docs-only で wire 変更なし。toast / dialog は UI 層内の表示規約であり、command wire・DB に非接触。後続 R3 も UI 層内の是正に閉じる見込み（78 §78.5 / 77 の契約追記も CMD/BIZ 変更を要しない — 既存 mutation の成功 callback への toast 追加）。

## Review Focus

- DSR-19 の併用基準が既存 5 方式の実測（入庫系 panel 併用・棚卸し全置換・CSV 系 panel のみ）を矛盾なく位置付けているか — 既存実装を「違反」にしない整理か、意図的に違反として R3 是正対象にするかの区別が明確か。
- DSR-20 の硬化条件が CostDiffDialog（実害防止）と UnsavedChangesDialog（意図的 friction）の 2 先例を過不足なく一般化し、DSR-07 の「確認 dialog を出す境界」と役割分担できているか。
- variant 統一が DSR-08（色単独禁止）と整合する書き方か（色 + 配置 + 文言の複合強調）。
- 理論 cite が Why に限定され、規範本文が theory 非依存で自立しているか。
- catalog ⑦ duration 是正が実装（3000ms 既定 + 5s/8s 個別）と一致するか。
- Plans.md 再編が owner 裁定 3 件と一致し、active packet link が存在するか。

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
