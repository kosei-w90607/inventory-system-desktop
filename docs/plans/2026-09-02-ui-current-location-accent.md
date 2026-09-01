# Plan Packet: 現在地アクセント（DSR-21 正本化 + SidebarLink 実装）+ PLU 通知バーの icon 同乗

UI ガッツリ整えターン（owner 宣言 2026-09-02）の wave 8 lane 1。起点は『UIデザインの教科書［新版］』突合の最重要 finding = 現在地表現の doc 衝突。`docs/design-system/00-foundations.md` L62 は「サイドバーはアクティブ項目のみ Primary アクセント 1 色」と規定する一方、`docs/design-system/02-component-catalog.md` L300-301 は SidebarLink / StatusChips / SegmentedControl を stone 系 selection tone に統一し「amber は業務セマンティック色・主要アクションに残し、選択状態の背景色とは分離する」と規定する。実装 `src/components/ui/selection-tone.ts` は catalog 側に一致し有彩色ゼロ。owner 裁定 (a)（2026-09-02）= 実装を foundations 側へ寄せる。本 packet は両 doc を矛盾なく両立させる規範（DSR-21: 現在地は有彩色アクセント、選択状態は無彩色）を正本化し、SidebarLink の現在地のみに Primary アクセントを重ねる。同じ DSR-08 レンズで済む `PluNotificationBar` の icon 欠落（Plans.md backlog「PLU 警告の視認性」、PR #26 L3 owner 所感起源）を 1 箇所是正として同乗させる。

## Workflow State

- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Codex（GPT-5.6、発注書駆動、worktree isolation）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Fable 裁定
- Final Reviewer: Claude Sonnet 5 subagent（fresh context、Plan Reviewer とは別個体）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Plan Review、L3（owner render oracle）、Ready、merge

Phase 遷移記録（kickoff → spec-check → design → plan-draft → plan-gate、本 plan-first commit に同乗）: kickoff で owner 裁定 (a) と同乗 1 件、branch、R2 を固定。spec-check で foundations L62 / catalog L300-301 / `selection-tone.ts` / `SidebarLink.tsx` / `segmented-control.tsx` L12 / `PluNotificationBar.tsx` L23-24 / `PluExportPage.tsx` L406-412 / `alert.tsx` L7 を Coordinator が直接読取し、drift が doc↔doc 衝突であること、`SELECTION_TONE_ACTIVE` の消費者が SidebarLink のみであること、`SELECTION_TONE_CHIP_ON` が StatusChips 専用であること、SegmentedControl が独自 stone 定義であることを確認。design phase として DSR-21 の規範文を本 packet「Design Intent Trace」直下に確定（design output は本 plan-first change に置き、Writer が verbatim 転記する）。plan-draft で本 packet を作成し、Matrix は R2 optional 判定で省略（class 存在 oracle と L3 目視の 2 段で足りる）。実装は Coordinator の `plan-approved` 合図まで開始しない。

## Owner Effort Budget

- 介入回数上限: 5
- 実働時間上限: 45分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定 3 からの引き上げ理由: 視覚系 UI change は render oracle が owner の目のみで、amber アクセントと PLU 通知バー / 主要ボタンの視覚競合が L3 で判明した場合に縮退 amendment + 再目視の 1 往復を見込む（PR #15 実測の教訓、`docs/archive/plans/2026-08-29-ui-polish-batch.md`）。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 5 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
契約非変更の表示是正 + design-system 規範追加。route/search state・Tauri command DTO・bindings・DB schema・CSV format・merge gate に触れない。backend 変更なし。SidebarLink の active 判定ロジック（`aria-current` / `data-status` / activeMatch predicate）は不変で、変わるのは class token のみ。PluNotificationBar は表示条件不変で icon 要素の追加のみ。operator-facing の見た目変更のため owner 目視を Human Gate に置く（Plans.md 注意リストの慣行）。R3 該当行（operator workflow の実挙動変更）には至らない。

## Goal

Goal Invariant: 利用者がどの画面でも「今どこにいるか」をサイドバーの有彩色アクセントで一目で把握でき、その規範が design-system に正本化されている。

### 最小完了条件

- サイドバーの現在地 link に Primary token 由来の有彩色アクセントが付き、非現在地には付かない（RTL で class 存在を固定、L3 で owner 目視）
- DSR-21 が `01-decision-rules.md` に存在し、catalog L300-301 の実装ルールが DSR-21 と矛盾しない
- Home の PLU 通知バーに `AlertTriangle` icon が表示される

### 失敗定義

- 現在地アクセントが PLU 通知バーや主要ボタンの amber と競合し、owner が「警告と現在地の区別がつかない」と判定したまま merge する
- StatusChips / SegmentedControl の選択色まで有彩色化して「選択 = 無彩色」の分離を崩す
- `amber-` 生 class を `src/` に持ち込む（token 体系の逸脱、DSR-08 違反）

### 非目的

- 一覧 filter chip / 二択切替の色再設計
- サイドバー構造・grouping・pending link 表示の変更
- PLU 通知バーの文言・表示条件・遷移先の変更
- UX 磨き残 2 観察（処理中フィードバック不足 / 薄いグレーの多用）の消化 — 別 design packet

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。

## Scope

1. **`src/components/ui/selection-tone.ts`**: 現在地アクセント用 token 定数を追加（例: `CURRENT_LOCATION_ACCENT`）。値は Primary token のみで構成（`border-l-primary` 系）。既存 3 定数の値は不変。
2. **`src/components/layout/SidebarLink.tsx`**: active 時に `SELECTION_TONE_ACTIVE` + `SELECTION_TONE_ACTIVE_ICON` に加えて現在地アクセントを合成する（`<Link activeProps>` 経路と `ActiveMatchSidebarLink` 経路の両方）。active / inactive でテキスト開始位置がずれないよう、バー幅分の transparent border を base 側に置く等の layout shift 回避を Writer が設計する。pending span は不変。
3. **`src/features/home/components/PluNotificationBar.tsx`**: warning `Alert` の先頭子要素に `<AlertTriangle />`（lucide-react）を追加。`PluExportPage.tsx` L406-412 と同型、className token は不変。
4. **docs 正本化**（Writer 転記、規範文は本 packet「DSR-21 規範文」を verbatim）:
   - `docs/design-system/01-decision-rules.md`: `## DSR-21 現在地と選択状態の色分離` を DSR-20 の後に新設（**ルール** / **Why** / **判定フロー / 具体例** / **関連** の DSR-08 型構成 + 更新履歴 dated 行）
   - `docs/design-system/02-component-catalog.md` L300-301: 実装ルール 2 行を改訂 — SidebarLink の現在地は stone selection tone に DSR-21 の Primary アクセントを重ねる / StatusChips・SegmentedControl は選択状態のため stone のまま / 「amber は選択状態の**背景色**とは分離する」は維持（アクセントは背景でない）。Sidebar パターン節（あれば）にも DSR-21 参照 1 行
   - `docs/quality/review-checklist.md` カテゴリ 9（Operator UI visibility）: 「現在地と選択状態の色分離が DSR-21 に従うか」1 行
   - `docs/UI_TECH_STACK.md` L693 付近が DSR 列挙なら DSR-21 を追記（列挙でなければ不要、Writer が実読で判定し報告）
5. **tests**:
   - `src/components/layout/SidebarLink.test.tsx`: 現在地アクセント token の存在 oracle を追加 — active link は `CURRENT_LOCATION_ACCENT` 相当の class を持ち、inactive link は持たない。既存 test（`data-status` / `aria-current` / focus ring）は改変しない
   - `src/features/home/components/PluNotificationBar.test.tsx` 新設: `pluDirtyCount >= 1` で `role="alert"`（Alert primitive の既定 role を Writer が実読確認）内に `svg` が 1 つ描画される / `isLoading` `isError` `count 0` で非描画（既存契約の固定）
6. 生成物・gate: `bash scripts/doc-consistency-check.sh`（DS3 token HEX 整合を含む）PASS、`npm run lint`（palette 外色 ban）PASS、`rg -n "amber-" src` = 0 hit。REQ token を test に追加する場合のみ `cargo run --bin generate_traceability` 再生成（追加しない方針、Writer 判断で追加時は再生成必須）。

## Non-scope

- `SELECTION_TONE_CHIP_ON` / `segmentedControlActiveClass` の値変更（StatusChips / SegmentedControl / ModeTabs / PluExportPage / ProductListPage の見た目不変）
- `00-foundations.md` L62 の改訂（本 packet で充足される側の規定、不変）
- 現在地アクセントの他 site 展開（breadcrumb・tab 等）
- PLU 通知バーの test 以外の挙動変更、`AlertTriangle` 以外の icon 選択
- 4 色エリアモデルの再導入

## Acceptance Criteria

- AC1: `SidebarLink.test.tsx` の新 test が「active link に現在地アクセント class あり / inactive link になし」を assert し green。アクセント合成を外す mutant（Scope 2 の `cn(...)` からアクセント定数を除去）で当該 test のみ red
- AC2: `rg -n "amber-" src` が 0 hit（起票時 0 hit を維持）、`npm run lint` PASS
- AC3: `git diff --name-only` に `StatusChips.tsx` / `segmented-control.tsx` / `ModeTabs.tsx` が含まれない、`segmented-control.test.tsx` green
- AC4: `PluNotificationBar.test.tsx` が icon（`svg`）描画と 3 種の非描画条件を assert し green。icon 除去 mutant で icon test のみ red
- AC5: `rg -n "DSR-21" docs/design-system/01-decision-rules.md docs/design-system/02-component-catalog.md docs/quality/review-checklist.md` が各 file ≥1 hit、`bash scripts/doc-consistency-check.sh` PASS
- AC6（L3、owner render oracle）: (i) Home で PLU 通知バー表示状態のとき、サイドバー現在地アクセントと通知バーが「警告」と「現在地」として区別できる (ii) 主要ボタン（Primary）と現在地アクセントが同一画面で競合しない (iii) active / inactive の切替でテキスト開始位置がずれない (iv) 全画面で現在地が一目で分かる。(i)(ii) 不成立時は gated amendment でアクセント縮退（バー幅 2px、または icon 色のみ）を 1 往復で処置
- AC7: `SidebarLink.tsx` の active 判定（`aria-current` / `data-status` / activeMatch）に diff がなく、既存 SidebarLink test 全件 green

## Design Sources

- Requirements / spec: `docs/design-system/00-foundations.md` L62（アクティブ項目のみ Primary アクセント 1 色）、L24（Primary = `--primary` amber-700）
- Architecture: 該当なし（frontend 表示層のみ）
- Function / command / DTO: 該当なし
- DB: 該当なし
- Screen / UI: `docs/design-system/02-component-catalog.md` L287-301（stone selection tone、「選択状態の背景色とは分離」）、`docs/function-design/52-ui-shared-layout.md` §52.1 / §52.6（SidebarLink 契約）、`docs/design-system/01-decision-rules.md` DSR-08（色は二次シグナル、生 Tailwind 色禁止）
- Decision log / ADR: DSR-16 正本化（PR #15、theory → DSR → 実装の先例）。理論ソース = 『UIデザインの教科書［新版］ マルチデバイス時代のインターフェース設計』（原田秀司、翔泳社、2020）5-3「現在地は有彩色、hover は無彩色」

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-21 新設 / `02-component-catalog.md` L300-301 改訂 / `review-checklist.md` カテゴリ 9 | updated in this PR |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| Durable decision / ADR | DSR-21（design-system が durable 正本、decision-log 追記は不要 — DSR-16 先例と同じ扱い） | updated in this PR |

## Registration / Generation Obligations

該当なし（新規 command / doc file / route / 画面なし。REQ token を test に追加しない方針。追加した場合のみ 90-traceability 再生成が義務化される）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| 00-foundations L62 | サイドバー = 単色 stone + アクティブ項目のみ Primary アクセント | UI-CL-D1（2026-09-02） | 現在地は有彩色（教科書 5-3）。全面 amber 背景は catalog「選択状態の背景色とは分離」と PLU 通知バー同色競合で不採用。amber テキスト on stone-300 は AA コントラスト未達見込みで不採用 → 左端 Primary バー（背景でないアクセント） | `selection-tone.ts` / `SidebarLink.tsx` | SidebarLink accent test / L3 (i)-(iv) |
| catalog L300-301 | selection tone の stone 統一 | UI-CL-D2（2026-09-02） | 選択状態（filter chip / 二択切替）は「何を絞っているか」であり現在地ではない → 無彩色維持。route-driven の日次/月次 tab は catalog 既定の押しボタン外観回避を優先し stone 維持（画面位置は sidebar 現在地で一意）、要望発生時に再裁定 | 変更なし（Non-scope） | AC3 |
| DSR-08 | 色は二次シグナル、意味は text + icon が一次 | UI-CL-D3（2026-09-02） | PLU 通知バーだけ icon なし（同型 3 site 中 1 site の実装差分）。owner 所感「PLU 警告の視認性」の機序 | `PluNotificationBar.tsx` | PluNotificationBar icon test |

### DSR-21 規範文（Writer が `01-decision-rules.md` へ verbatim 転記、見出し番号・構成は DSR-08 型）

```markdown
## DSR-21 現在地と選択状態の色分離

**ルール**: 「今どこにいるか」を示す現在地（主ナビゲーションの active link、`aria-current="page"`）は、stone 系 selection tone に Primary token のアクセント 1 点（左端バー、`border-l-primary` 系 token）を重ねて有彩色で示す。「何を絞っているか / どのモードか」を示す選択状態（filter chip の on、SegmentedControl の active）は無彩色 stone のままとし、有彩色を使わない。hover は両者とも無彩色。アクセントは背景色ではなく細いバーに限定し、`amber-` 生 class は使わない（DSR-08）。

**Why**: 『UIデザインの教科書［新版］』（原田秀司、翔泳社、2020）5-3 は「現在地は有彩色、hover は無彩色」で現在地と一時状態を区別する。`00-foundations.md` の「アクティブ項目のみ Primary アクセント 1 色」はこれと一致する。一方 Primary（amber-700）は warning 系（PLU 通知・在庫少）と同系色のため、背景全面に使うと警告と現在地の区別が崩れる。背景は stone に残しバーだけ有彩色にすることで、`02-component-catalog.md` の「amber は選択状態の背景色とは分離する」を維持したまま現在地を有彩色化できる。

**判定フロー / 具体例**: 対象が「画面の位置」を表すなら現在地 → アクセントあり（例: SidebarLink の active）。対象が「絞り込み・表示モード」を表すなら選択状態 → stone のみ（例: 在庫照会の状態 chip、商品別 / 部門別の切替、日次 / 月次 tab）。迷う場合は「他画面へ移動しても残る状態か」で判定し、移動で消える状態は選択状態とする。

**関連**: パターン SegmentedControl（`02-component-catalog.md` 実装ルール）、DSR-08（色は二次シグナル）。review-checklist カテゴリ 9 対応（現在地と選択状態の色分離）。
```

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（DSR-21 + catalog 改訂で「現在地 = 有彩色 / 選択 = 無彩色」の理由と適用範囲が読める）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: UI-CL-D1〜D3 は DSR-21 本文と catalog 実装ルールへ吸収
- Assumptions and constraints: Tailwind v4 で `border-l-primary`（longhand）が `border-stone-400`（shorthand）に生成順で勝つこと（Contract Probe で Writer が実証）。jsdom は computed style を持たないため RTL は class 存在 oracle に限定、視覚の正は L3
- Deferred design gaps, risk, and follow-up target: route-driven tab（日次 / 月次）の現在地扱いは stone 維持で凍結、要望時に DSR-21 判定フローで再裁定。amber 競合時の縮退案は AC6 の gated amendment
- Test Design Matrix can cite design decision IDs or source doc sections: R2 optional 判定で Matrix 省略。AC1 / AC4 に mutant 条件を直書き
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外 = SegmentedControl / StatusChips の不変（AC3 で機械確認）、pending span 不変

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable（表示層のみ） | — |
| Fact check / design decision split | 事実 = doc↔doc 衝突 + 実装は catalog 側（Coordinator 実読）。判断 = DSR-21 | 本 packet Design Intent |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 操作手順不変。視認性向上のみ | L3 AC6 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | owner Windows native L3 で AC6 (i)-(iv) | PR body L3 記録 |
| 環境・再現性 | 新設の環境依存なし | — |

## Design Readiness

- Existing design docs are sufficient because: foundations L62 が目標状態を規定済み、SidebarLink 契約（52 §52.1 / §52.6）は不変。不足は「現在地 vs 選択」の分離規範のみで、本 packet の DSR-21 規範文で確定済み
- Source docs updated in this PR: `01-decision-rules.md`（DSR-21 新設）/ `02-component-catalog.md` L300-301 / `review-checklist.md` カテゴリ 9 /（条件付き）`UI_TECH_STACK.md` DSR 列挙
- Design gaps intentionally deferred: route-driven tab の現在地扱い（stone 維持で凍結）
- Durable decisions discovered in this plan and promoted to source docs: UI-CL-D1〜D3 → DSR-21

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI 層のみ
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言変更なし、icon 追加のみ
- Error, empty, retry, and recovery behavior: 変更なし（PluNotificationBar の非描画 3 条件は test で固定）
- Testability and traceability IDs: class 存在 oracle + svg 存在 oracle。REQ token 追加なし

## Contract Probe

- Tailwind v4 の class 順序: `SELECTION_TONE_ACTIVE` の `border-stone-400` と `border-l-primary` が同一要素に付いたとき border-left-color が Primary になること → Writer が生成 CSS（dev server の出力 CSS または `npx tailwindcss@<pinned> ` 等、方法は Writer 選択）で `border-left-color` の宣言順を実証し、結果を Implementation Results に 1 行で記録。負けるなら `border-l-primary!` ではなく ACTIVE 側から `border-stone-400` を分解（`border-y-stone-400 border-r-stone-400` 等）して解決する
- Alert primitive の role: `alert.tsx` が `role="alert"` を出すか → Writer が実読、test の query に反映

## Contract Coverage Ledger

R2 optional。主要契約を列挙する:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-21 現在地 = stone + Primary アクセント | `selection-tone.ts` / `SidebarLink.tsx` | SidebarLink accent test（AC1） | L3 AC6 (i)(iv) |
| DSR-21 選択状態 = stone のみ | 変更なし | `segmented-control.test.tsx` 既存 + AC3 diff 検査 | — |
| layout shift なし | `SidebarLink.tsx` base class | —（jsdom 不可） | L3 AC6 (iii) |
| DSR-08 icon 一次シグナル | `PluNotificationBar.tsx` | PluNotificationBar icon test（AC4） | L3 で Home 目視 |
| 52 §52.1 / §52.6 SidebarLink 契約不変 | — | 既存 SidebarLink test 全件（AC7） | — |

## Test Plan

- targeted tests: `npx vitest run src/components/layout/SidebarLink.test.tsx src/features/home/components/PluNotificationBar.test.tsx src/components/ui/segmented-control.test.tsx`
- negative tests: inactive link にアクセント class なし / PluNotificationBar 非描画 3 条件
- compatibility checks: 既存 SidebarLink test 改変なし、`npm run lint`、`bash scripts/doc-consistency-check.sh`
- data safety checks: not applicable
- main wiring/integration checks: Human Gate に L3 を含むため Writer 完了条件に `cargo check --release`（CI gate ではない）

## Boundary / Wire Contract

not applicable（wire / state / format に触れない）。

## Review Focus

- DSR-21 規範文の転記が verbatim か、catalog L300-301 改訂が DSR-21 と矛盾しないか（「背景色とは分離」の維持）
- アクセントが SidebarLink の 2 経路（`<Link activeProps>` / `ActiveMatchSidebarLink`）の両方に入っているか
- `amber-` 生 class の混入ゼロ、StatusChips / SegmentedControl 不変
- 新 test の mutation 感度（AC1 / AC4 の mutant 条件）と、既存 test 無改変
- Contract Probe（CSS 順序）の実証記録があるか

## Spec Contract

R2 のため省略（契約は Contract Coverage Ledger に列挙）。

## Trace Matrix

R2 のため省略。

## Data Safety

not applicable（commit 禁止物なし。`~/Downloads/inventory-field-check/` 配下の抽出物は repo 外のまま、書誌情報のみ DSR-21 に記載）。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
