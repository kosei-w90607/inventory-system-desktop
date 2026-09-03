# Plan Packet: UI 一覧の背骨 D — Lane 2（共有部品 PageShell / ListShell + token 実装 + ページ送り文言移行 + Lane 1b mockup 同乗、R3 runtime）

Lane 1a（PR #31、squash `9f90964`、2026-09-03）で正本化した規範（04-backbone 原則 13〜16 / DSR-22 / catalog ⑯ + ⑩）を runtime に履行する最初の実装 lane。Lane 1a archived packet「Lane 1a / 1b 分割」「Lane 2 への申し送り」節（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md:122-131` / `:274-278`）の裁定に従い、`ListShell` より先に `PageShell` を出し、未実装 token を `globals.css` へ実装した時点で canonical docs に正式登録する。画面群への展開（識別列固定・現在行 3 点・perPage `Select` の各画面適用・棚卸し A'+器 / C）は Lane 3〜5 の別 packet とし、本 lane は共有部品 + pilot 1 画面（商品一覧）+ 全 caller のページ送り文言一括移行に限定する。

Plan Review round 1（独立 Sonnet: P1×2 / P2×4 / P3×3、Opus デザインレビュー: P1×4 / P2×8 / P3×3）を Coordinator が全件 accept して反映済み。round 2（Sonnet: P1×1 / P2×1 / P3×1、Opus: P1×3 / P2×7 / P3×3、round 1 は全件 closed）も全件 accept して本 commit へ反映済み（Review Response 節）。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

If a state-only commit materializes multiple phases, list the complete adjacent forward sequence and the pre-existing evidence for every intermediate transition in an append-only review/evidence record. Recording compression never permits a gate skip.

- Phase: implementing
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 244a5dd
- Amendments: none
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（runtime code + design docs + mockup HTML、worktree isolation、TDD）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Opus 5 デザイン面レビュー（発注書駆動・read-only・§5.4 低制約 profile、D-056 準拠）+ Fable 裁定
- Final Reviewer: Codex（GPT-5.6、ロジック・整合面、PR review 1 回 = relay 1/2）+ Opus 5 デザイン面レビュー（read-only）+ Claude Sonnet 5 subagent mutation 独立再実測（隔離 worktree、Writer とは別 fresh context）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（商品一覧 pilot の器・sticky 帯・範囲付き文言・PageShell 余白・`--border` / `--input` 濃化の render oracle + DSR-22 低視力 L3 (a)(b)）+ Lane 1b mockup 5 file の視認（履歴系固定列 mapping の最終確定を含む）

役割配分の記録（D-079 Impact「実装 code の Writer 割当ては change ごとに Coordinator 判断」に基づく 1 行）: 本 lane は UI 視覚系の runtime change であり、owner 所感「UI 視覚系は Claude が触る方が良い結果」（2026-09-03、D-079 Why）を実装 code にも適用して Writer を Sonnet subagent とする。`AGENT_OPERATING_MANUAL` §3 の独立性（Writer ≠ Plan Reviewer / Writer ≠ Final Reviewer / Final Reviewer は fresh context）は、Plan Reviewer 一次・mutation 独立再実測を Writer とは別の Sonnet fresh context、Final Review を Codex が担うことで維持する。

2026-09-03: Plan Review round 1（独立 Sonnet subagent fresh context = P1 2 / P2 4 / P3 3、Opus 5 デザイン面レビュー〈発注書駆動・read-only〉= P1 4 / P2 8 / P3 3）→ 全件 accept、是正を本 commit に反映（Matrix SC3a の算術訂正 / AC2 の file 数と箇所数の分離 / `--border` 1.66:1 → 1.59:1 訂正 / `ProductPagination` を `src/components/patterns/Pagination.tsx` へ移設し patterns → features の逆依存を回避 / sticky 帯 = summary + thead、`bg-muted` + `border-separate` / `--input` を `--border-strong` へ揃え階層反転を防止 / toolbar 枠 `rounded-lg border bg-card p-4` / `totalCount > 0` gating + `isLoading` 配線 / summary typography 16px semibold tabular-nums / L3 に dialog・sidebar・境界線・現在位置可読性を追加 / returnTo を SC5c へ自動化 / X13・X14 追加 / S7 の描画内容 pin）。

2026-09-03: Plan Review round 2（Sonnet = P1 1 / P2 1 / P3 1、Opus = P1 3 / P2 7 / P3 3、round 1 全件 closed 確認）→ 全件 accept、是正を本 commit に反映（`border-separate` で tbody 行の罫線も消える → 本文 cell にも `border-b` を再付与 / sticky・背景・罫線を `th` cell 単位の descendant variant へ一本化し caller に className を渡さない / 帯は `h-10` + `whitespace-nowrap` で 1 行固定 / SegmentedControl の stone-300 直書き 1.43:1 を Non-scope + L3 + S8 へ / SearchBar の検索ボタンのみ `border-border-strong` を本 lane で付与 / 表の外枠は付けない（`overflow-hidden` が sticky を殺す）/ AC1 を 00 と reference で分離 / focus 判別性と form 画面 150% を AC-L3-4 へ / th は `text-foreground` 維持 / X15・X16 追加）。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者可視に何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-03 会話「進めよう」、消費済み）。2 回目 = Windows native L3（AC-L3-1〜5）+ Lane 1b mockup 5 file の視認（同一セッション内、複数往復は同一 gate 内）。3 回目 = Ready 後の承認の一言（Ready・merge は Coordinator 代行、runtime PR のため hosted final は Ready で自動起動し owner dispatch 不要）。

## Consultation Relay

§5.5 は使わない。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
route/search state の変更（商品一覧 `perPage` 既定 50 → 100、`src/features/products/search.ts` の正規化）+ operator workflow の見た目変更（全 page root の `PageShell` 化で section 間余白が 16px / 20px → 24px に統一、`--border` / `--input` 濃化が全画面の構造線・入力枠・dialog 枠・sidebar 境界に波及、商品一覧の器が ListShell 構成へ）。DB / POS CSV / PLU TSV / Tauri command DTO / report CSV の変更はない（`search_products` の `per_page` は backend clamp 200 の範囲内、`src-tauri/src/constants.rs:6`）。DEV_WORKFLOW Risk Tiers の R3「route/search state, operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + mutation 独立再実測 + Windows native L3 を必須とする。視覚系 UI change の教訓（PR #15 / #28: render oracle は owner の目のみ、CSS 詳細度は全 gate 素通り）に従い、L3 の確認対象を「旧 root 3 系統から 1 画面ずつ + dialog + sidebar」+ pilot 画面に明示する。

## 起票時実測（2026-09-03、HEAD `31c069d`、Plan Review round 1 で訂正済み）

- **page root は 3 系統 + 個別 1 = 43 箇所 / 28 file**: `rg -n --glob '*Page.tsx' --glob '!*.test.tsx' 'className="[^"]*\bp-6\b[^"]*"' src/features` = 45 hit、内訳 `space-y-4 p-6` 21 / `space-y-5 p-6` 13 / `min-h-screen space-y-6 p-6` 8 / `relative min-h-screen space-y-6 p-6` 1（absolute overlay を持つ画面）/ 非 root 2（`w-full max-w-md ... p-6` の card、`absolute inset-0 ... p-6` の overlay）。file 数は `rg -c ... | wc -l` = 28（`ProductFormPage.tsx` と 6 つの `*RecordDetailPage.tsx` が loading / error / success の 3 root を持つため箇所数 43 ≠ file 数 28、Sonnet P1-1）。`PageShell` は `rg -n "PageShell" src` 0 件。`StocktakePage.tsx:215` / `:926` の 2 root は Lane 1a 申し送りどおり現存。既存 test に page root class を assert するものはない（`rg -n "space-y-4 p-6|space-y-5 p-6|min-h-screen" src --glob '*.test.tsx'` = 0）。
- **`<main>` が唯一の縦 scroll container**: `src/components/layout/RootLayout.tsx:65` `<main data-scroll-restoration-id="main" className="min-h-0 min-w-0 overflow-auto">`。shadcn `Table` は `src/components/ui/table.tsx:9` で `<div data-slot="table-container" className="relative w-full overflow-x-auto">` に包まれるため、`overflow-x-auto` が縦方向にも scroll container を成立させ（`overflow-y` は `auto` に計算される）、`thead` の `position: sticky` は wrapper 内でしか効かず `<main>` の scroll に追従しない。Tailwind preflight は `table { border-collapse: collapse }` を既定にしており（`src` に `border-separate` 0 hit）、collapse では罫線が table 側に属するため sticky した thead は下端線を失う（Opus P1-2）。承認 mockup `mockup-d-lists.html` は `:35` `border-collapse:separate;border-spacing:0` + `:36` `th{background:var(--d-head)} border-bottom:2px solid var(--d-line)` + `:86` `.tbl > .scroll{max-height:56vh}` の**箱内スクロール**で描いている（`--d-head` = #f5f5f4 = `--muted` / `--card` 相当、mockup 保留項目 2「sticky header の背景色」）。箱内スクロールは DSR-17（`<main>` 単一 scroll container、scroll 復元の allowlist）と衝突するため採らない（設計判断 D-2）。
- **backend per_page 上限は 2 系統**: `PAGINATION_MAX_PER_PAGE = 200`（`src-tauri/src/constants.rs:6`、`search_products` / `get_stocktake_items` / `list_logs` は超過を silent clamp）と `inventory_service::list.rs:21` `MAX_PER_PAGE: u32 = 100`（`list_inventory_records` / `list_movements` は超過で `BizError::ValidationFailed`、docs `21-io-inventory-repo.md:7` に契約明記）。**入出庫履歴・在庫変動履歴に perPage 200 を選択肢として出すには backend 契約変更（DTO/validation、docs 21 + tests `list.rs:322,504,515`）が必要** → 本 lane では per-screen `Select` を追加しないため非該当、Plans.md ④ へ申し送る（Scope S8）。整合性チェックは `run_integrity_check` 全件取得 + client-side slice（`IntegrityCheckPage.tsx:95-96`）で上限なし。
- **ページ送り現行文言の caller / test**: `ProductPagination`（`src/features/products/components/ProductPagination.tsx:16`、props `{page, perPage, totalCount, onPageChange}`、文言 `:29` `{totalCount.toLocaleString("ja-JP")} 件中 {page} / {totalPages} ページ`）の caller は 8 画面（IntegrityCheck `:375` / InventoryRecords `:351` / StockInquiry `:197` / OperationLogs `:519` / ProductList `:290` / StockMovements `:204` / Stocktake `:852` / PriceRevision `:128`、すべて下部 1 箇所。`stock-inquiry/types.ts` は型 import のみ）。現行文言を assert する test は **3 file 6 箇所**（`IntegrityCheckPage.test.tsx:410` / `StockInquiryPage.test.tsx:491` / `OperationLogsPage.test.tsx:257,269,396,408`、Sonnet P3-9）。`ProductPagination.test.tsx` は `1 / 3 ページ` の現在ページ span のみを見ており件数文言は未 assert（新規 test 追加対象）。`src/components/patterns/*.tsx`（非 test）は `features/` を import していない（`rg -n 'from "@/features' src/components/patterns --glob '!*.test.tsx'` = 0、Sonnet P2-4）— ListShell が `features/products` の pagination を import すると初の逆依存になる（設計判断 D-9）。
- **perPage 既定の現状**: 商品一覧 `search.ts:63` `perPage` は `PRODUCT_PER_PAGE_OPTIONS = [50, 100, 200]`（`:36`）で正規化、`normalizePerPage` の fallback `50` は同 file 1 行。棚卸しは PR #30 で既定 50（`StocktakePage.tsx:123`、test T2/T3 が `per_page: 50` を固定）。`ProductListPage.test.tsx:218,222` は `returnTo` に `perPage=50` を含む search string を assert しており、`returnTo` 往復の perPage 保持は happy-dom で自動検証できる（Sonnet P2-5 → SC5c）。
- **token 候補値**: `docs/design-system/reference/2026-08-23-current-design-analysis.md:104-116` §8 — `--border-strong` `#8a8480`（対 `--background` 3.53:1 / 対 `--card` 3.38:1、独立再計算一致）、`--row-current` `#fff8e6`（対 `--foreground` 16.5:1、一致）、`--border` 値変更案 `#cdc8c4`（§8 は 1.66:1 と記すが WCAG 相対輝度で独立再計算すると L ≈ 0.5827、対 `#fafaf9` L ≈ 0.9553 で **1.59:1**。1.66 は対純白 #ffffff の値。Sonnet P2-3 / Opus P2-5、S1 で §8 を訂正してから登録）。`src/styles/globals.css` `:root` は `:52-93`、`--border: #e7e5e4`（`:62`）と `--input: #e7e5e4`（`:63`）は別 token で、`input.tsx:11` / `select.tsx:34` は `border-input`、`button.tsx:16`（outline）/ `card.tsx:10` / `badge.tsx:17` / `dialog.tsx:56` / `select.tsx:59`（content）/ `RootLayout.tsx:62`（sidebar `border-r`）は `--border` を使う。`:96-98` の `@layer base { * { border-color: var(--border) } }` により色未指定の全 border が `--border` の影響を受ける（`badge.tsx:17` outline と `RootLayout.tsx:62` は `border-border` 明示 utility、参照 token は同じ、Opus P1-3 / P2-6、Sonnet round 2 P3-1）。`src/components/ui/segmented-control.tsx:9,12` は token でなく `border-stone-300`（#d6d3d1、対 `--background` **1.43:1**）/ `border-transparent` 直書きで、新 `--border` 1.59:1 より薄くなる（DSR-22 `:443` の「segmented」は 3:1 対象、pilot に 2 個 `ProductListPage.tsx:131,138`、Opus round 2 P1-3）。`SearchBar.tsx:75` の `Input`（`border-input`）と `:98` の `Button variant="outline"`（素の `border`）が隣接する。`--ring: #b45309`（`:74`）は対 `--background` 4.81:1 で据え置き可だが、対 新 `--input` #8a8480 は 1.36:1（旧 #e7e5e4 対比 4.0:1）で focus 時の枠色変化が弱まる（Opus round 2 P2-6）。`@theme inline` は `:9-50`、dark block なし。`rg -n "border-strong|row-current" src` = 0。
- **Lane 1b mockup 5 file の所在**: 旧 branch tip `20c4600` に `docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html` が存在（`git ls-tree 20c4600` 実測）。main には `mockup-d-lists.html` / `mockup-d-stocktake.html` のみ。`reference/README.md:16` に「残り 5 file は Lane 1b として後続 Lane 2 実装 PR に同乗する（本 PR では追加しない）」の stale 文（Opus P3-2）。
- **shared patterns 設計書**: `docs/function-design/59-ui-shared-patterns.md:16-24` §59.1 は `ファイル | 契約（props） | 採用画面 | catalog` の 4 列表。`generate_traceability` は frontend `src/**/*.test.{ts,tsx}` の `REQ-nnn` / `UI-nn` token のみ走査（`src-tauri/src/bin/generate_traceability.rs:290,509,546`、SPEC- は非対象）。`ListSkeleton`（`src/components/patterns/ListSkeleton.tsx`、既定 columns 8、`aria-label="一覧を読み込み中"`）は ProductTable の 8 列と一致。`ProductListPage.tsx:236-241` は `Skeleton` 3 本の自前 loading で `ListSkeleton` 未使用（Opus P2-3）。`npm run dev` は Tauri 抜きの Vite 単体起動（Probe 2 の前提）。

## Goal

Goal Invariant: 一覧画面の器と page root が共有部品に集約され、規範（04 原則 6 / 13〜16、DSR-22、catalog ⑯ ⑩）の canonical 記載が「Lane 2 で新設予定」から実 path へ置き換わり、DS1 / DS3 の突合対象に入る。

### 最小完了条件

(a) `globals.css` に `--border-strong` / `--row-current` を実装し、`--border` を一段濃く・`--input` を `--border-strong` に揃え、00-foundations.md のカラーパレット表へ HEX 付きで正式登録する。(b) `src/components/patterns/PageShell.tsx` を新設し、`src/features/**/*Page.tsx` の page root 43 箇所（28 file）を `PageShell` へ置換する（`p-6` 直書き root が 0 になる）。(c) `ProductPagination` を `src/components/patterns/Pagination.tsx`（`Pagination` + `PaginationSummary`）へ移設し、文言を範囲付き統一形へ移行、8 caller + test を一括更新する。(d) `src/components/patterns/ListShell.tsx` を新設し（toolbar 枠 / sticky 帯 = 上部 summary + thead / 下部 pager / `ListSkeleton` / `totalCount > 0` gating）、商品一覧を pilot として採用する（既定 perPage 100、`isLoading` 配線）。(e) catalog ⑯ ⑩ / DSR-22 / 04 / 59.1 / design-system README / review-checklist / mockup-d-lists 注記の「Lane 2 移行対象」「新設予定」表記を実装済み表記へ更新する。(f) Lane 1b mockup 5 file を現行規範に同期して追加し（S7 の描画内容 pin を満たす）reference README を更新する。(g) Plans.md ④ を Lane 2 完了 + Lane 3〜5 申し送り（backend 上限 / sticky × 識別列 probe / A' 帯 contrast / 操作枠 sweep）へ更新する。

### 失敗定義

- `PageShell` 化で page root の余白が画面ごとに異なるまま残る（`p-6` 直書き root が 1 つでも残る、または `PageShell` が className で `space-y` を上書きされる）。
- 範囲付き文言が component / caller / test のいずれかで不整合（catalog ⑯ Don't「部分導入」に該当）。
- sticky 帯が happy-dom の class oracle では green だが Windows native で `<main>` scroll に追従しない、または scroll 中に header と行の境界線 / 現在位置 text が消える（L3 で検出、失敗時は state-backtrack + Gated Amendment）。
- token 実装後も 00-foundations.md の表に未登録、または catalog ⑯ ⑩ の canonical が旧 path / 「なし」のまま（DS1 / DS3 false-green の温床、Lane 1a Codex P2-2 の再発）。
- 構造線が操作枠より濃い階層反転（`--border` だけ濃くして `--input` が旧値のまま）。
- 商品一覧の URL `perPage` 既定変更で既存の `perPage=50` URL や `returnTo` 復元が壊れる。
- `src/components/patterns/` が `src/features/` を import する。

### 非目的

- 8 画面それぞれへの perPage `Select` 追加と既定値の個別最適化（Lane 3〜5。入出庫履歴 / 在庫変動履歴は backend `MAX_PER_PAGE` 100 → 200 の契約変更を伴うため Codex 適性、Scope S8 で申し送る）。
- 識別列固定（DSR-22 mapping）の実装、現在行 3 点の各画面適用、棚卸し A'+器 / 完了画面 C の実装、outline ボタン / Badge / chip 枠の `--border-strong` 化 sweep（Lane 3〜5）。
- dark mode token の追加（`@custom-variant dark` は未使用の下地のまま）。

## 設計判断

| # | 内容 | 裁定 | 採用先・理由 |
|---|---|---|---|
| D-1 | `PageShell` の契約 | `<div className={cn(className, "space-y-6 p-6")}>` の単一 root（base を `cn` の後段に置き、`className="space-y-4"` を渡しても tailwind-merge の後勝ちで `space-y-6` が残る、Opus P3-1）。`min-h-screen` は持たない（`<main>` が `min-h-0 overflow-auto` の grid cell であり content の最小高は不要。overlay を持つ 1 画面は `className="relative"` で補う） | 04 原則 6「p-6 / space-y-6 を唯一の page root」。`space-y-4` / `space-y-5` の 34 箇所は 24px へ揃える（規範化済み・未履行の履行、旧分析 doc §1-6）。Writer は Probe 1 で `min-h-screen` 依存が無いことを 9 画面で確認する |
| D-2 | sticky 帯と識別列固定 | `stickyHeader` 時、ListShell root の **descendant variant のみ**で（caller に className を渡させない、Opus round 2 P2-7）: (i) table-container の overflow を `[&_[data-slot=table-container]]:overflow-visible` で解く。(ii) table を `[&_[data-slot=table]]:border-separate [&_[data-slot=table]]:border-spacing-0` にする。separated model では `tr` の border が描画されないため（Tailwind preflight の `border-collapse: collapse` 依存が外れる）、`th` に `border-b-2 border-border`、**tbody の `td` にも `border-b border-border`**（最終行は `border-b-0`）を cell 単位で再付与する（承認 mockup `:36-37` の th / td 罫線と同型。Sonnet round 2 P1-1 / Opus round 2 P1-1）。(iii) sticky・背景も **`th` cell 単位**: `[&_thead_th]:sticky [&_thead_th]:z-10 [&_thead_th]:bg-muted` に加え、**summary 帯を描画するとき（`topSummary && totalCount > 0`）は `[&_thead_th]:top-10`、それ以外は `[&_thead_th]:top-0`**（帯が無いのに 40px 浮かない、Opus round 3 P2-A。mockup `:36` と同型、識別列固定の z 階層〈header > 固定列 > 本文〉へ接続しやすい、Opus round 2 P2-5）。th の `font-weight` / padding、td の height / padding、th の `box-shadow` は mockup（`:36-37`）と table primitive 既定（`table.tsx:61,74`）の既存差であり本 lane の対象外（記録済み逸脱、Opus round 3 P3-B）。(iv) 上部 `PaginationSummary` を `sticky top-0 z-20 flex h-10 items-center whitespace-nowrap overflow-hidden bg-muted` の帯にし、**summary + th を 1 つの sticky 帯**として `<main>` 相対に留める（Opus P1-4: `<main>` 相対では上部 summary が最初の 1 画面で流れ去り、DSR-22 が上部表示を要求した目的〈Q5 原則③④〉が失われる）。帯高 `h-10` と th の `top-10` は対で固定し、`whitespace-nowrap` で 1 行を構造的に保証する（可変 offset は happy-dom で検証できず不採用、Sonnet round 2 P2-1 / Opus round 2 P2-3）。summary 帯には下端線を付けず、線は th 下端の 2px 1 本のみ（帯と th が同色で 1 ユニットに読める、Opus round 2 P3-1）。背景は `bg-muted`（= #f5f5f4、承認 mockup `--d-head` と一致、mockup 保留項目 2 を「`--d-head` 採用」で閉じる、Opus P1-1）。**表の外枠（mockup `:33` `.tbl` の `border-radius:8px; overflow:hidden`）は本 lane では付けない** — `overflow:hidden` が `<main>` 相対 sticky を殺すため移植不可（Opus round 2 P2-2、Lane 3〜5 で `overflow-hidden` なしの枠を再検討）。識別列固定は `identityColumns?: number` prop を予約するだけで描画に影響しない。両立方式（wrapper を横 scroll container に戻すと sticky が死ぬ / `<main>` を両軸 scroller にすると page 全体が横 scroll する / 二重 table）は Lane 3〜5 で横 overflow が実発生する画面を確認してから probe する | 起票時実測 2 点目。mockup の箱内スクロール（`max-height:56vh`）は DSR-17 と衝突するため不採用、この機構差分と外枠不採用を S6 で `mockup-d-lists.html` の注記に追記する。DSR-22 は識別列固定を「横 overflow 実発生時のみ opt-in」と pin しており、pilot で overflow 実発生の証拠がない段階で方式を固定しない |
| D-3 | 範囲付き文言の 0 件・端数契約 | `from = (page-1)*perPage+1`、`to = min(page*perPage, totalCount)`。`totalCount === 0` のときは `0 件` のみ表示し前後ボタンは両方 disabled、`totalPages` は 1 扱い。`toLocaleString("ja-JP")` は n / from / to すべてに適用、数値は `tabular-nums` | catalog ⑩「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」を pin しつつ、0 件で「0 件中 0〜0 件目」と読ませない。Probe 3 で 0 件時に pager を描画しない caller を確認し現状維持 |
| D-4 | 上部 variant の形と typography | `PaginationSummary`（text-only、ボタンなし）を `Pagination.tsx` から export。typography は `text-base font-semibold text-foreground tabular-nums`（16px、承認 mockup `:65` と一致。catalog ⑩ `:646` の `text-sm font-medium` は 04 原則 1「本文 16px 最低線」と mockup に反するため S6 で catalog 側を是正、Opus P2-4）。下部 pager の `text-sm text-muted-foreground` は据え置き。上部・下部で同一文言が重複することは記録に留め（screen reader は DOM 順で 2 回読む、`aria-hidden` は付けない）、Lane 3〜5 の判断材料とする（Opus P3-3） | catalog ⑩ Don't「上部 variant に下部と同じボタン群を無条件で重ねる」/ DSR-22「上部は text 必須・pager ボタン任意」 |
| D-5 | ListShell の props | `{ toolbar?: ReactNode; toolbarSecondary?: ReactNode; pagination?: {page, perPage, totalCount, onPageChange}; topSummary?: boolean; stickyHeader?: boolean; identityColumns?: number; isLoading?: boolean; skeleton?: ReactNode; children }`。toolbar 枠は `rounded-lg border bg-card p-4` の 1 箱に 2 段（`toolbarSecondary` 省略時は 1 段、`toolbar` 省略時は枠なし、承認 mockup `.filters` = card 塗り + 8px 半径、Opus P2-1）。上部 summary と下部 pager は **`pagination.totalCount > 0` のときだけ描画**（0 件時に `EmptyState` の上下へ「0 件」と pager が出ない、Opus P2-2）。children は caller の loading / error / empty / data 分岐を抱えてよいが、`isLoading` が true のとき ListShell は children の代わりに skeleton（既定 `ListSkeleton`）を描画する。`topSummary` / `stickyHeader` は静的 boolean であり、DSR-22 の「実表示が viewport を超えるとき」は **perPage 既定 100 が viewport を超えることをもって画面単位で満たすとみなし、結果件数による動的判定はしない**（近似採用、Opus P2-7） | catalog ⑯ 必須構成 6 項目のうち 1〜3・6 を本 lane で満たし、4（識別列）は予約、5（現在行 3 点）は token 提供のみ。04 原則 6 の枠文言（`rounded-md border p-4`）は S6 で mockup 準拠（`rounded-lg border bg-card p-4`）へ同期 |
| D-6 | 商品一覧 pilot の範囲 | `ProductListPage.tsx:103` / `:150` の 2 段 toolbar を `toolbar` / `toolbarSecondary` へ、table を children に、`:290` の pager を `pagination` prop へ、`:236-241` の自前 `Skeleton` 3 本を削除して `isLoading={productsQuery.isLoading}` を配線（Opus P2-3）。`topSummary` / `stickyHeader` を `true`。既定 perPage を 100 へ（`search.ts` `normalizePerPage` の fallback。URL 明示値優先の現行挙動を維持）。`SearchBar.tsx:98` の検索ボタンに `border-border-strong` を付与（D-7 例外） | DSR-22 判定フロー「商品一覧は 1 件探索が主動線のため既定 100」。他 7 caller は文言移行 + import 更新のみで ListShell 化しない（Lane 3〜5） |
| D-7 | `--border` 濃化と `--input` | `--border` `#e7e5e4` → `#cdc8c4`（1.59:1）と同時に `--input` を `var(--border-strong)`（3.53:1）へ揃える（Opus P1-3: `--border` だけ濃くすると表罫線・card 枠 1.59:1 に対し入力 / Select 枠 1.20:1 となり DSR-22「操作枠 ≥ 構造線」が反転する）。outline ボタン / Badge / chip / SegmentedControl の枠は本 lane では `--border`（1.59:1）または stone 直書き（segmented 1.43:1）のままで、`--border-strong` 化（segmented は token 化を含む）は Lane 3〜5 の sweep（Non-scope）。**例外 1 件**: `SearchBar.tsx:98` の検索ボタンは入力枠 3.53:1 と隣接して段差が目立つため、本 lane で `border-border-strong` を明示付与する（1 file 1 class、S5、Opus round 2 P2-1）。`--ring` #b45309 は対ページ背景 4.81:1 で据え置き、focus 時の枠色変化の弱まりは AC-L3-4 で判定し否なら Lane 3〜5 で ring 強化を検討（Opus round 2 P2-6）。L3 で旧 root 3 系統から 1 画面ずつ + dialog + sidebar 境界 + 商品一覧を owner が判定し、否なら Gated Amendment で token 値のみ戻す | DSR-22「構造線は一段濃く、操作枠は 3:1 以上」。`--border-strong` に実消費者（input / select / textarea / checkbox）を与え、宣言だけの dead token にしない |
| D-8 | Lane 1b の同乗と descope 経路 | Writer は runtime（S1〜S5）→ docs（S6, S8）→ mockup（S7）の順で積む。Plan Review round 天井または relay 上限に達した時点で S7 が未着手なら、Coordinator は S7 を Non-scope へ移し Plans.md ④ に「Lane 1b は次 lane 同乗」と戻す（Gated Amendment として記録） | Lane 1a 申し送り「Lane 1b は Lane 2 実装 PR に同乗」を守りつつ、runtime 本体の収束を優先する |
| D-9 | `ProductPagination` の移設 | `src/features/products/components/ProductPagination.tsx` を `src/components/patterns/Pagination.tsx` へ移し、export 名を `Pagination`（下部）/ `PaginationSummary`（上部）とする。8 caller の import と JSX 名を `rg` 駆動で更新、test file も同 path へ移動（`Pagination.test.tsx`）。catalog ⑩ canonical path を新 path へ | Sonnet P2-4: `components/patterns` は `features/` を import しない実績（0 件）があり、ListShell が `features/products` へ依存すると初の逆依存になる。8 feature が共有する component は pattern であり、caller 8 箇所を文言移行で触る本 lane が移設の最小コスト点。旧 Non-scope「移設しない」は撤回 |

## Scope

**S1 token 実装 + 00-foundations 正式登録**: `src/styles/globals.css` `:root` に `--border-strong: #8a8480;` / `--row-current: #fff8e6;` を追加、`--border` を `#cdc8c4` へ、`--input` を `var(--border-strong)` へ変更（D-7）、`@theme inline` に `--color-border-strong: var(--border-strong);` / `--color-row-current: var(--row-current);` を追加（`border-border-strong` / `bg-row-current` utility）。`reference/2026-08-23-current-design-analysis.md` §8 の `--border` 行を 1.66:1 → **1.59:1** へ訂正し「Lane 2 で実装済み（globals.css）」を追記してから、`docs/design-system/00-foundations.md:12-18` のカラーパレット表へ「操作枠 / `--border-strong` / — / #8a8480 / 対 `--background` 3.53:1・対 `--card` 3.38:1（DSR-22、`--input` が参照）」「現在行背景 / `--row-current` / — / #fff8e6 / 対 `--foreground` 16.5:1（DSR-22、消費者は Lane 3〜5）」の 2 行を追加し、`--border` 行を `#cdc8c4`（実測 1.59:1、DSR-22「構造線を一段濃く」）へ更新。

**S2 `PageShell` 新設 + page root 43 箇所（28 file）の置換**: `src/components/patterns/PageShell.tsx`（D-1）+ `PageShell.test.tsx`。`src/features/**/*Page.tsx`（test 除外）の root `<div className="space-y-4 p-6">` / `"space-y-5 p-6"` / `"min-h-screen space-y-6 p-6"` / `"relative min-h-screen space-y-6 p-6"` の 43 箇所を `<PageShell>`（overlay 画面は `<PageShell className="relative">`）へ置換。非 root 2 箇所（card / overlay の `p-6`）は対象外。Writer は before/after 表を機械抽出（`rg -n ... | sort` の出力を貼る、手動転記禁止）で Implementation Results に置く。

**S3 `Pagination` 移設 + 範囲付き文言 + `PaginationSummary`**: D-9 の移設（`git mv` + import / JSX 名の `rg` 駆動更新、旧 path 0 hit）。文言を D-3 の範囲付き統一形へ、`PaginationSummary` を D-4 の typography で export。3 file 6 箇所の期待文言を新形へ更新（例: `IntegrityCheckPage.test.tsx:410` `"101 件中 1 / 2 ページ"` → `"101 件中 1〜100 件目 · 1 / 2 ページ"`）、`Pagination.test.tsx` に SC3a〜c を追加。

**S4 `ListShell` 新設**: `src/components/patterns/ListShell.tsx`（D-2 / D-5）+ `ListShell.test.tsx`。sticky 帯（summary + th）の class・`border-separate` + th / td の cell 罫線・overflow 上書き・`h-10` + `whitespace-nowrap`・`totalCount > 0` gating・skeleton を class / DOM oracle で保証し（すべて ListShell root の descendant variant、caller の className 不要）、実追従と境界線は L3（AC-L3-2）。

**S5 商品一覧 pilot**: D-6。`search.ts` の perPage 既定を 100 へ。`ProductListPage.test.tsx` の `per_page` 期待 50 → 100 を更新、`returnTo` に perPage が保持される既存 assert（`:218,222`）は新既定に合わせて更新し SC5c として明示、URL `perPage=50` 明示時の regression を追加。`src/components/patterns/SearchBar.tsx:98` の検索ボタンへ `border-border-strong` を付与（D-7 例外 1 件、`SearchBar.test.tsx` があれば class oracle を追加）。

**S6 canonical docs 同期**: catalog ⑯ canonical を `` `src/components/patterns/ListShell.tsx` `` へ（「Lane 2 で新設予定」撤去、必須構成 4 は「API 予約のみ、実装は Lane 3〜5」、1 の枠を `rounded-lg border bg-card p-4` へ）、catalog ⑩ canonical を `` `src/components/patterns/Pagination.tsx` `` へ・件数文言 pin を範囲付き統一形へ・上部 variant canonical を `` `PaginationSummary` `` へ・`:646` の上部 typography を `text-base font-semibold text-foreground tabular-nums` へ・「Lane 2 移行対象」表記を撤去、DSR-22 の「範囲付き統一形は Lane 2 移行対象」「Lane 2 で globals.css に実装した時点で」文を実装済み表記へ + D-2 の両立 probe 申し送りを 1 文追記、04-backbone 原則 6 の枠文言を `rounded-lg border bg-card p-4` へ・`:40` 表「現行 3 系統を 1 つへ」を実装済みへ・原則 13〜15 の token 参照を実 token 名へ、`mockup-d-lists.html` の保留項目 2 を「`--d-head` 採用」+ 機構差分注記（箱内スクロール不採用 = DSR-17、表の外枠 `overflow:hidden` 不採用 = sticky 保護、th の文字色は mockup の muted でなく runtime の `text-foreground` を維持〈`--muted-foreground` 対 `bg-muted` 4.40:1 は 14px の 4.5:1 未達〉、Opus round 2 P3-2）へ、catalog ⑯ 必須構成 3 の「横スクロール時は固定列右端に影」を項目 4（識別列、Lane 3〜5）側へ移す（影は識別列がないと発生しない、Opus round 2 P3-3）、`59-ui-shared-patterns.md` §59.1 に `PageShell` / `ListShell` / `Pagination` の 3 行追加（採用画面は `rg` 実測式、D-050 準拠）、`docs/design-system/README.md` の実装状況表記があれば同期、`docs/quality/review-checklist.md` カテゴリ 9 に「page root は `PageShell`、一覧の器は `ListShell`」の確認行を追加、`docs/UI_TECH_STACK.md:403` の「DSR-01〜13」を「DSR-01〜22」へ（backlog `Plans.md:93` 消化）。

**S7 Lane 1b mockup 5 file の現状同期（描画内容の pin、Opus P2-8）**: `git show 20c4600:docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html` を起点に、CSS 変数を S1 の実装値（`--border` #cdc8c4 / `--border-strong` #8a8480 / `--input` = border-strong / `--row-current` #fff8e6）へ揃え、04 原則 13〜16 / DSR-22 / `mockup-d-lists.html` と同一 token 系統に同期して追加。各 file が新たに見せるもの: **forms-a / forms-b** = `PageShell` の `space-y-6` 統一の前後比較 1 組（旧 `space-y-4` 系の代表）+ 入力枠 `--border-strong` 化、**home-sales-admin** = `--border` 濃化後の card 群 + dialog 枠、**history** = DSR-22 mapping の固定列（入出庫履歴 = 記録日時 + 代表商品〈先頭 2 列へ並べ替え〉/ 在庫変動履歴 = 日時 + 種別 / 操作ログ = 日時 + 種別）を描き、AC-L3-5 で owner が最終確定する（DSR-22 `:441`「Lane 2 の L3 で実利用者確認のうえ最終確定」）、**import-export** = token 同期 + 番号付き保留項目。各 file に「これを採ると何が変わるか」1 行 note + 番号付き保留項目。`reference/README.md:12-13` の表へ 5 行追加、`:16` の stale 文（「本 PR では追加しない」）を削除、`:18` の「2 つの mockup-d」を「7 つ」へ。描かないもの = sidebar / PageHeader / ボタンの見た目（旧 SPEC-UILB-D6 継続）。

**S8 Plans.md ④ + 申し送り**: ④ を「Lane 2 完了、次 = Lane 3〜5」へ更新し、sub-bullet に (i) 入出庫履歴 / 在庫変動履歴の perPage 200 は backend `inventory_service::list.rs:21` `MAX_PER_PAGE` 100 → 200 の契約変更（docs 21 + tests）を伴う（Codex 適性）(ii) sticky 帯 × 識別列固定 × DSR-17 `<main>` 単一 scroll の両立 probe は横 overflow 実発生画面で行う（D-2）(iii) 棚卸し A' 帯ラベルの contrast 是正（Lane 1a 申し送り、`--muted-foreground` 対 `--card` 4.40:1）は棚卸し lane で (iv) outline ボタン / Badge / chip / SegmentedControl 枠の `--border-strong` sweep（segmented は `border-stone-300` 直書きの token 化を含む、D-7）(v) Card 内に一覧を持つ画面を ListShell 化する際は toolbar 枠の `bg-card` が card-on-card で沈むため枠の地色を再判断（pilot は Card なし）、を記録。`Plans.md:93` の UI_TECH_STACK stale 行を消化済みへ。

## Non-scope

- 商品一覧以外 7 画面の ListShell 化・perPage `Select`・既定値変更（Lane 3〜5）。
- backend `MAX_PER_PAGE` の引き上げ（Rust + docs 21 / 24 / 32、Lane 3〜5 の履歴系 lane で Codex 発注）。
- 識別列固定の描画実装、現在行 3 点（`bg-row-current` + 左バー + badge）の各画面適用、棚卸し header A'+器 / 完了画面 C、outline ボタン / Badge / chip / SegmentedControl 枠の `--border-strong` 化 sweep（例外 = SearchBar 検索ボタン 1 箇所は本 lane、D-7）、表の外枠（D-2）。
- dark mode token、E2E / visual regression の再評価（④ 完了時、UI_TECH_STACK §7.2）。
- decision-log の新規 D 採番（座組は D-079 の Impact 条項で足り、設計判断は本 packet と DSR-22 / catalog 追記で正本化する。Plan Review が D 化を求めた場合のみ追加）。

## Acceptance Criteria

- AC1（S1）: `rg -n -- "--border-strong: #8a8480|--row-current: #fff8e6|--border: #cdc8c4|--input: var\(--border-strong\)" src/styles/globals.css` = 4 hit、`rg -n -- "--color-border-strong|--color-row-current" src/styles/globals.css` = 2 hit。`rg -c "border-strong" docs/design-system/00-foundations.md` ≥ 1、`rg -c "#e7e5e4" docs/design-system/00-foundations.md` = 0、`rg -c "1\.66:1" docs/design-system/00-foundations.md docs/design-system/reference/2026-08-23-current-design-analysis.md` = 0（reference `:19` の「#e7e5e4」は現状問題の歴史記述として残す、Opus round 2 P2-4）。`SC1` green。
- AC2（S2）: `rg -n --glob '*Page.tsx' --glob '!*.test.tsx' 'className="[^"]*\bp-6\b' src/features` の hit が非 root 2 箇所（card / overlay）のみ。file 数 `rg -l "<PageShell" src/features --glob '!*.test.tsx' | wc -l` = 28、箇所数 `rg -c "<PageShell" src/features --glob '!*.test.tsx' | awk -F: '{s+=$2} END{print s}'` = 43（機械抽出表と突合）。`SC2a` / `SC2b` green。
- AC3（S3）: `rg -n "件中 [0-9,]+〜[0-9,]+ 件目 · " src --glob '*.test.tsx'` ≥ 4 file、旧形 `rg -n '件中 [0-9]+ / [0-9]+ ページ"' src --glob '*.test.tsx'` = 0、旧 path `rg -n "features/products/components/ProductPagination|<ProductPagination" src docs/design-system` = 0。`SC3a` / `SC3b` / `SC3c` green。
- AC4（S4）: `SC4a`〜`SC4e` green。`rg -n "identityColumns" src/components/patterns/ListShell.tsx` ≥ 1 かつ描画分岐なし（Review Focus で確認）。`rg -n 'from "@/features' src/components/patterns --glob '!*.test.tsx'` = 0。
- AC5（S5）: `SC5a` / `SC5b` / `SC5c` green、`StocktakePage.test.tsx` の `per_page: 50` 期待は無変更（`git diff --stat -- src/features/stocktake/StocktakePage.test.tsx` = 0 行）。
- AC-L3-1（S2 / D-7、render oracle）: 旧 root 3 系統から 1 画面ずつ（`space-y-4` 系 = 入庫、`space-y-5` 系 = Writer が機械抽出表から 1 画面指定、`min-h-screen` 系 = 棚卸しカウント）+ ホームを開き、section 間余白が揃っていること、構造線（表罫線 / card 枠）と入力 / Select の枠が「入力枠の方が濃い」階層で見えること、確認 dialog を 1 つ開いて枠が主張しすぎないこと、sidebar 右端の境界線が主張しすぎないこと、商品一覧の検索欄と検索ボタンの枠の濃さが揃って見えること、SegmentedControl（商品一覧の 2 個）の枠が表罫線より薄く見えても許容できるか（否なら Lane 3〜5 の sweep を前倒し）を owner が判定。否の場合は D-7 の可逆 amendment。
- AC-L3-2（S4 / S5、render oracle）: 商品一覧で perPage 100 の一覧を縦 scroll し、上部の「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」text（ボタンなし）と table header が 1 つの帯として `<main>` の上端に留まり続けること、scroll 中も現在位置 text が読めること、帯と行の境界線（th 下端 2px）も行間の区切り線（td 下端 1px）も消えないこと、toolbar が card 地色の 1 枚の枠に 2 段で入っていること、下部に同文言 + 前へ / 次へがあることを確認。
- AC-L3-3（S5、route/search state）: 商品一覧を URL 指定なしで開くと 100 件表示、`?perPage=50` 付きで開くと 50 件であることを確認（`returnTo` 往復の perPage 保持は SC5c で自動検証、L3 対象外）。
- AC-L3-4（DSR-22 低視力 L3 (a)(b)、`ProductListPage.tsx` の render oracle）: 商品一覧を Windows ハイコントラスト（forced-colors）で開き、toolbar 枠・入力枠・focus・sticky 帯とその下端境界線が消えないこと。DPI 125% / 150% で toolbar 枠・sticky 帯（1 行のまま）・pager（`min-w-20` に「10 / 13 ページ」が収まる）が崩れないこと。検索欄に Tab で focus したとき静止時の枠との違いが一目で分かること。入力の多い画面（商品登録 or 入庫登録）を 1 つ 150% で開き、3.53:1 の入力枠が密集しても「線だらけ」に見えないこと。
- AC-L3-5（S7、mockup 視認）: `docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html` 5 file をブラウザで開き、番号付き保留項目に「n 番だけ嫌」形式で回答。保留項目には最低限 (1) forms の `space-y-6` 統一 (2) home-sales-admin の `--border` 濃化 + dialog 枠 (3) history の固定列 mapping（DSR-22 `:441` の最終確定）を含める。
- AC6（S6）: `rg -c "Lane 2 で新設予定|Lane 2 移行対象|Lane 2 で globals.css" docs/design-system/*.md` = 0、`rg -c "src/components/patterns/ListShell.tsx" docs/design-system/02-component-catalog.md` ≥ 1、`rg -c "src/components/patterns/Pagination.tsx" docs/design-system/02-component-catalog.md` ≥ 1、`rg -c "rounded-lg border bg-card p-4" docs/design-system/04-backbone.md docs/design-system/02-component-catalog.md` ≥ 2、`rg -c "DSR-01〜22" docs/UI_TECH_STACK.md` ≥ 1 かつ `rg -c "DSR-01〜13" docs/UI_TECH_STACK.md` = 0、`rg -c "PageShell|ListShell|Pagination" docs/function-design/59-ui-shared-patterns.md` ≥ 3。
- AC7（S7）: `fd -I 'mockup-d-' docs/design-system/reference` = 7 file、`rg -c "mockup-d-" docs/design-system/reference/README.md` ≥ 7、`rg -c "本 PR では追加しない" docs/design-system/reference/README.md` = 0、各 file に外部資源参照なし（`rg -n 'https?://' <file>` = 0）、`rg -c "space-y-6|border-strong" docs/design-system/reference/mockup-d-forms-a.html` ≥ 2、`rg -c "記録日時|代表商品" docs/design-system/reference/mockup-d-history.html` ≥ 2。
- AC8（S8）: `rg -c "MAX_PER_PAGE" docs/Plans.md` ≥ 1、`Plans.md:93` 相当の UI_TECH_STACK stale 行が消化済み表記。
- AC9（gate）: `bash scripts/doc-consistency-check.sh` ERROR 0（DS1 / DS3 の実在件数増を記録）、`bash scripts/doc-consistency-check.sh --target plan`、`npm run typecheck` / `npm run lint` / `npm run test` / `npm run format:check` / `npm run build` clean、`cd src-tauri && cargo run --bin generate_traceability -- --check` clean、`git diff --stat -- src/lib/bindings.ts src-tauri` = 0 行。
- AC10（mutation）: Matrix「必須 mutation 注入」X1〜X16 を Final Review で Sonnet subagent（隔離 worktree、clean tree）が `npm run test` で独立再実測し全 kill（survivor 0）。

## Design Sources

- Requirements: `docs/REQUIREMENTS.md`（UI 群、既存 REQ-105 / REQ-907 等の一覧画面要件）
- Architecture: `docs/ARCHITECTURE.md`（UI 層 / patterns 配置、`components/patterns` → `features` の非依存は実績慣行）
- Function design: `docs/function-design/59-ui-shared-patterns.md` §59.1 / `docs/function-design/58-ui-stock-inquiry.md:80,561`（200 clamp 記述）/ `docs/function-design/21-io-inventory-repo.md:7`（100 上限）
- Screen design: `docs/SCREEN_DESIGN.md`（商品一覧）
- Design system: `docs/design-system/00-foundations.md` / `01-decision-rules.md` DSR-17・DSR-22 / `02-component-catalog.md` ⑩ ⑯ / `04-backbone.md` 原則 1・6・11・13〜16 / `reference/mockup-d-lists.html`（承認 mockup）/ `reference/2026-08-23-current-design-analysis.md` §8
- Decision log: D-056 / D-079

## Required Design Artifacts

| Area | Required source doc | Status |
|---|---|---|
| token | 00-foundations.md カラーパレット表 / reference §8 | S1 で 2 行追加 + `--border` 更新 + §8 訂正 |
| shared patterns | 59-ui-shared-patterns.md §59.1 | S6 で `PageShell` / `ListShell` / `Pagination` 行追加 |
| catalog | 02-component-catalog.md ⑯ ⑩ | S6 で canonical path / 文言 pin / 枠・typography 更新 |
| DSR | 01-decision-rules.md DSR-22 | S6 で実装済み表記 + D-2 両立 probe 申し送り |
| backbone | 04-backbone.md 原則 6 / `:40` 表 | S6 |
| mockup | reference/README.md + mockup-d-lists 注記 + 5 HTML | S6 + S7 |
| checklist | quality/review-checklist.md カテゴリ 9 | S6 |
| plans | Plans.md ④ | S8 |

## Registration / Generation Obligations

新規 Tauri command / route / function-design doc / operator 画面の追加はない。

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| `src/components/patterns/PageShell.tsx` | 59-ui-shared-patterns.md §59.1 行追加 / 04 原則 6 の canonical 参照 / test 同梱 | S2 + S6 |
| `src/components/patterns/ListShell.tsx` | 59-ui-shared-patterns.md §59.1 行追加 / catalog ⑯ canonical 記載（DS1 対象化）/ test 同梱 | S4 + S6 |
| `src/components/patterns/Pagination.tsx`（`Pagination` + `PaginationSummary`、旧 `ProductPagination` の移設） | 59-ui-shared-patterns.md §59.1 行追加 / catalog ⑩ canonical path 更新 / 旧 path の参照 0（AC3）/ test 移動 | S3 + S6 |
| token 3 件 + `--input` 変更 | 00-foundations.md 表（DS3 対象化） | S1 |
| mockup 5 file | reference/README.md 表 | S7 |
| REQ coverage | 新規 REQ 追加なし。既存 test の REQ token は文言更新・file 移動のみで保持（`generate_traceability --check` で確認） | AC9 |

## Design Intent Trace

| Spec/requirement ID | Source design doc section | Decision ID | Why | Implementation target | Test target |
|---|---|---|---|---|---|
| 04 原則 6 | 04-backbone.md:22,40 | D-1 / D-5 | page root 3 系統を 1 つへ、toolbar 枠 | `PageShell` + 43 root / ListShell 枠 | SC2a / SC2b / SC4a / AC-L3-1 |
| 04 原則 13 / DSR-22 操作枠 3:1・構造線 | 01-decision-rules.md DSR-22 | D-7 | 操作枠 ≥ 構造線の階層 | `--border-strong` / `--input` / `--border` | SC1 / AC-L3-1 |
| 04 原則 14 / catalog ⑯ 1〜3・6 | 02-component-catalog.md ⑯ | D-2 / D-5 | 一覧の器の共通化、上部件数の常時可視 | `ListShell` sticky 帯 | SC4a〜e / AC-L3-2 |
| 04 原則 15 / DSR-22 現在行 | 01-decision-rules.md DSR-22 | — | 現在行専用 tone | `--row-current` token のみ | SC1 |
| 04 原則 1 / catalog ⑩ 上部 typography | 04-backbone.md 原則 1 / mockup `:65` | D-4 | 16px 最低線、tabular-nums | `PaginationSummary` | SC3c |
| catalog ⑩ 件数文言 | 02-component-catalog.md:644 | D-3 / D-4 | 範囲付き統一形 + 上部 text-only | `Pagination` / `PaginationSummary` | SC3a〜c |
| DSR-22 perPage 既定 | 01-decision-rules.md DSR-22 判定フロー | D-6 | 商品一覧 100 / 棚卸し 50 | `search.ts` | SC5a / SC5c / AC-L3-3 |
| DSR-17 (c) `<main>` scroll | 01-decision-rules.md DSR-17 | D-2 | sticky 帯を `<main>` 相対に、箱内スクロール不採用 | `ListShell` overflow 上書き | SC4d / AC-L3-2 |
| 04 原則 11 | 04-backbone.md 原則 11 | D-5 / D-6 | 読込みは `ListSkeleton` | ListShell / pilot | SC4c / SC5b |
| DSR-22 低視力 L3 | 01-decision-rules.md DSR-22 末尾 | — | forced-colors / DPI | — | AC-L3-4 |
| DSR-22 `:441` 履歴系固定列 | 01-decision-rules.md DSR-22 表 | — | Lane 2 L3 で最終確定 | mockup-d-history | AC-L3-5 |
| Lane 1a 申し送り（token 正式登録・canonical 復元） | archived packet :274-278 | — | DS1 / DS3 false-green 回避 | 00 / ⑯ ⑩ 記載 | AC1 / AC6 |
| patterns → features 非依存 | ARCHITECTURE.md / 実績 0 件 | D-9 | 共有 pattern の依存方向 | `Pagination.tsx` 移設 | AC3 / AC4 |

## Design Intent Audit

- 実装対象の各要素は上表の設計 doc 節へ遡れる。
- 設計 doc に存在しない新規契約（`ListShell` props、0 件文言、sticky 帯構成、`--input` の参照先）は本 packet の設計判断で決め、S6 で catalog / DSR-22 / 04 へ転記する。
- 設計 doc と承認 mockup が食い違う箇所（枠の地色・半径、上部 typography、sticky 背景）は mockup（owner 視認済み）を優先し、doc 側を S6 で是正する。
- Lane 3〜5 へ送る項目は Non-scope と S8 に明示し、暗黙の scope 縮小をしない。
- 旧 Lane 1 branch の成果は mockup 5 file の起点としてのみ使い、規範文は main の Lane 1a 正本を優先する。
- 「Lane 2 で〜予定」表記は S6 で全 sweep（AC6 = 0 hit）し、宙ぶらりん参照を残さない。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| operator workflow | 商品一覧の既定表示件数 50 → 100、全画面の section 余白統一、入力枠の濃化 | AC-L3-1 / AC-L3-3 |
| route/search state | `perPage` 既定の正規化変更（URL 明示値は優先維持、`returnTo` 保持） | SC5a / SC5c / AC-L3-3 |
| scroll restoration（DSR-17） | ListShell の overflow 上書きは `<main>` scroll を変えない。table-container が scroll container でなくなるため横 overflow 時は `<main>` が横 scroll する（pilot で overflow 実発生なしを Probe 2 で確認） | Contract Probe 2 |
| accessibility | sticky 帯に `bg-muted` 必須（透過で行が透ける）、`border-separate` 下で th / td の cell 罫線が境界線を残す、forced-colors で枠が消えない、summary の重複読み上げは記録 | AC-L3-2 / AC-L3-4 |
| blast radius | `@layer base * { border-color }` により dialog / popover / separator / sidebar 境界も濃化 | AC-L3-1（dialog + sidebar） |
| DS1 / DS3 gate | canonical path・token HEX の実在件数が増える、旧 path 参照 0 | AC3 / AC9 記録 |
| test suite | 文言 assert 6 箇所 + `per_page` 期待 + `returnTo` 期待の更新、test file 移動 1、削除・skip なし | Review Focus |
| dependency direction | `components/patterns` → `features` 0 件を維持 | AC4 |
| backend | 変更なし。`per_page: 100` は clamp 200 内 | AC9 bindings 0 行 |
| Lane 3〜5 | backend 上限 / 識別列 probe / A' contrast / 操作枠 sweep を申し送り | S8 |
| npm | 新規依存なし | — |

## Design Readiness

- 規範文は Lane 1a で確定済み（DSR-22 / ⑯ / ⑩ / 04）、承認 mockup `mockup-d-lists.html` が runtime の見本。
- token 値は reference §8 に実測付きで確定済み（`--border` 比のみ本 packet で 1.59:1 へ訂正）。
- `ListShell` / `PageShell` / `Pagination` API は本 packet D-1 / D-2 / D-4 / D-5 / D-9 で確定、Plan Review round 1 の critique を反映済み。
- L3 手順は AC-L3-1〜5 に固定。

Minimum design checks for business-app work:
- 日本語文言は catalog ⑩ の pin と一字一句一致（「〜」は U+301C、「·」は U+00B7）。
- 色のみで状態を伝えない（sticky 帯は位置 + 境界線、現在行 token は本 lane で未使用）。
- 既定件数変更で操作者の待ち時間が増えないこと（`search_products` 100 件は既存 `Select` 選択肢で実運用済み）。
- 余白統一で情報密度が下がりすぎないこと、枠の濃化で画面が「線だらけ」にならないこと（L3）。
- 既存 test の削除・skip なし。
- docs の「予定」表記を残さない。
- 機械抽出の before/after 表。

## Contract Probe

- **Probe 1（S2、`min-h-screen` 依存）**: 9 画面（`min-h-screen` 系 8 + `relative` 1）で root の `min-h-screen` を外しても footer 固定・中央寄せ・overlay 位置が変わらないことを Writer が実装前に確認する（`rg -n "min-h-screen|sticky bottom|absolute inset" <各 file>`）。`relative` 依存 1 画面は `className="relative"` を渡す。依存が見つかった場合は当該画面だけ `className` で補い、`PageShell` 本体に `min-h-screen` を入れない。
- **Probe 2（S4、overflow 上書き）**: pilot の商品一覧を perPage 200 + 最長商品名の合成データで描画し、table 幅が `<main>` 幅を超えないこと（横 overflow が実発生しないこと）を happy-dom ではなく Writer の `npm run dev`（Tauri なしの Vite）で目視 or 幅計測し、結果を Implementation Results に記録する。超える場合は D-2 の probe を本 lane に前倒しせず、`stickyHeader` を pilot で `false` にして AC-L3-2 の sticky 項目を L3 から外す Gated Amendment を起票する。
- **Probe 3（S3、0 件表示）**: 8 caller のうち 0 件時に `Pagination` を描画しない caller を `rg -n "totalCount|total_count" <各 Page>` で確認し、描画する caller のみ D-3 の `0 件` 契約が見える。pilot は D-5 の `totalCount > 0` gating で上下とも非描画。結果を Implementation Results に列挙する。
- 登録漏れ是正を含む probe は是正を仮適用した状態で end-to-end に実行する — 本 packet は登録漏れ型ではないため非該当。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| S1 token 3 件 + `--input` | globals.css / 00-foundations / reference §8 | SC1（fs literal oracle） | AC-L3-1（濃化と階層の視認） |
| D-1 PageShell | PageShell.tsx / 43 root | SC2a / SC2b | AC-L3-1 |
| D-3 範囲付き文言 | Pagination.tsx | SC3a / SC3b | AC-L3-2 |
| D-4 PaginationSummary | 同 file | SC3c | AC-L3-2 |
| D-5 toolbar 枠 | ListShell.tsx | SC4a | AC-L3-2 |
| D-5 topSummary opt-in + `totalCount > 0` gating | ListShell.tsx | SC4b | AC-L3-2 |
| D-5 skeleton | ListShell.tsx | SC4c | — |
| D-2 sticky 帯（summary + th、cell 罫線、条件付き `top-10`、overflow 上書き） | ListShell.tsx | SC4d | AC-L3-2（実追従・境界線） |
| D-5 pager 配線 | ListShell.tsx | SC4e | — |
| D-6 既定 100 | search.ts | SC5a | AC-L3-3 |
| D-6 pilot 構成（isLoading 配線、0 件） | ProductListPage.tsx | SC5b | AC-L3-2 |
| D-6 returnTo 保持 | ProductListPage.tsx | SC5c | — |
| D-9 依存方向 | Pagination.tsx 移設 | AC3 / AC4（rg oracle） | — |
| DSR-22 低視力 | — | — | AC-L3-4 |
| S6 docs | design-system / 59 / checklist / UI_TECH_STACK / mockup 注記 | AC6（rg oracle） | — |
| S7 mockup | reference | AC7 | AC-L3-5 |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-03-ui-list-backbone-d-lane2.md](test-matrices/2026-09-03-ui-list-backbone-d-lane2.md)

- targeted: `npm run test -- src/components/patterns src/features/products src/features/integrity-check src/features/stock-inquiry src/features/operation-logs`（SC1〜SC5c + 文言 regression）
- negative: 0 件 / 端数ページ / `perPage` URL 明示 / `topSummary` false / `stickyHeader` false / `className="space-y-4"` の上書き試行
- compatibility: 8 caller の props 不変（import / JSX 名のみ更新）、`StocktakePage.test.tsx` 無変更、`returnTo` regression
- data safety: synthetic のみ
- main wiring: `ListShell.pagination.onPageChange` → `ProductListPage` の search state 更新（SC5b で mock 呼び出しを検証）、`isLoading` → `ListSkeleton`
- L3: AC-L3-1〜5（Windows native、owner）

## Boundary / Wire Contract

- producer / consumer: frontend 内のみ。`search_products` の `per_page` 引数値が既定で 100 になる（wire type 不変、`src/lib/bindings.ts` diff 0 行）。
- backend clamp: `PAGINATION_MAX_PER_PAGE = 200` 内。
- route/search state: `ProductSearch` schema の `perPage` 既定値のみ変更、URL 明示値・`returnTo` 復元は現行挙動。
- CSS token: 新規 2 + 値変更 2（`--border` / `--input`）。消費者は utility 経由、`--row-current` は本 lane で未使用。
- module boundary: `src/components/patterns/` は `src/features/` を import しない。
- compatibility: `Pagination` props 不変、`PaginationSummary` は追加 export、旧 `ProductPagination` 名は残さない。

## Review Focus

- `PageShell` に `min-h-screen` / `space-y` 上書き経路が紛れていないか（D-1、`cn` の順序）。
- 43 箇所 / 28 file の置換漏れ・過剰置換（card / overlay の `p-6` を触っていないか）— 機械抽出表と `rg` 実測の突合。
- 範囲付き文言の from / to 計算と 0 件契約（D-3）、`toLocaleString` / `tabular-nums` の適用漏れ。
- `PaginationSummary` にボタンが無いこと、`ListShell` の `topSummary` 既定 false、`totalCount > 0` gating。
- sticky 帯の overflow 上書きが `<main>` の scroll / DSR-17 復元に副作用を持たないこと（`data-scroll-restoration-id` を触らない）、`border-separate` が非 sticky 時の見た目を変えないこと。
- `identityColumns` が描画に影響しない予約 prop であること。
- `components/patterns` から `features` への import が 0 であること（AC4）。
- 既存 test の削除・skip・弱体化がないこと（文言更新は期待値の置換のみ、file 移動は `git mv`）。
- S6 の「予定」表記 sweep（AC6 = 0）と DS1 / DS3 件数の増加が実在物と一致すること、旧 path 参照 0。
- mockup 5 file が S7 の pin（forms の余白比較 / home-sales-admin の濃化 / history の固定列）を満たし、外部資源を持たないこと。
- Sonnet Writer の mutation 自己申告は採用せず、Final Review の独立再実測のみを kill 証跡とする。

## Spec Contract

Contract ID: SPEC-UILB-D-LANE2-2026-09-03

- `src/styles/globals.css` `:root` は `--border-strong: #8a8480` / `--row-current: #fff8e6` / `--border: #cdc8c4` / `--input: var(--border-strong)` を宣言し、`@theme inline` が `--color-border-strong` / `--color-row-current` を map する。
- `PageShell` は `space-y-6 p-6` を持つ単一 `div` root を描画し、`className` は追加のみ（`space-y-*` / `p-*` を渡しても `space-y-6` / `p-6` が残る）。`src/features/**/*Page.tsx` の page root は全て `PageShell`。
- `Pagination`（`src/components/patterns/Pagination.tsx`）の件数文言は `{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ`（n / from / to は `ja-JP` locale、`tabular-nums`）。`totalCount === 0` では `0 件` のみを表示し前後ボタンは disabled。
- `PaginationSummary` は同文言の text のみを `text-base font-semibold text-foreground tabular-nums` で描画し、`button` 要素を含まない。
- `ListShell` は toolbar を `rounded-lg border bg-card p-4` の枠に描画し（`toolbar` 省略時は枠なし）、`pagination.totalCount > 0` かつ `topSummary` のときだけ `PaginationSummary` を table の上に描画し、`pagination.totalCount > 0` のとき table の下に `Pagination` を描画し、`isLoading` のとき children の代わりに skeleton（既定 `ListSkeleton`）を描画する。`stickyHeader` のとき、ListShell root の descendant variant のみで（caller に className を渡さない）summary を `sticky top-0 z-20 flex h-10 items-center whitespace-nowrap overflow-hidden bg-muted` の帯、`th` を `sticky z-10 bg-muted border-b-2 border-border` + summary 帯を描画するときのみ `top-10`（それ以外は `top-0`）、tbody の `td` を `border-b border-border`（最終行 `border-b-0`）、table を `border-separate border-spacing-0`、table-container の overflow を visible に上書きする。表の外枠は描画しない。`identityColumns` は描画に影響しない。
- 商品一覧の `perPage` 既定は 100、URL 明示値が優先、`returnTo` は現在の `perPage` を保持する。棚卸しの既定 50 は不変。
- `src/components/patterns/` は `src/features/` を import しない。
- canonical docs の `--border-strong` / `--row-current` / `ListShell.tsx` / `Pagination.tsx` / `PaginationSummary` 記載は実在 path / 実装値と一致し、「Lane 2 で〜予定」「Lane 2 移行対象」表記は 0。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| token 4 件 | S1 | SC1 | 値の一致、`--input` 参照 | Matrix / AC1 |
| PageShell 単一 root | S2 | SC2a | `cn` 順序、`min-h-screen` 不在 | Matrix |
| page root 全置換 | S2 | SC2b | 機械抽出表 | Matrix / AC2 |
| 範囲付き文言 | S3 | SC3a | from / to 計算 | Matrix / AC3 |
| 0 件契約 | S3 | SC3b | disabled | Matrix |
| Summary text-only + typography | S3 | SC3c | button 0、16px | Matrix |
| Pagination 移設 | S3 | AC3 / AC4 | 旧 path 0、逆依存 0 | AC3 / AC4 |
| toolbar 枠 | S4 | SC4a | class（bg-card） | Matrix |
| topSummary opt-in + gating | S4 | SC4b | 既定 false、0 件 | Matrix |
| skeleton | S4 | SC4c | children 非描画 | Matrix |
| sticky 帯 + cell 罫線 + 条件付き top-10 + overflow 上書き | S4 | SC4d | DSR-17 副作用なし | Matrix / AC-L3-2 |
| pager 配線 | S4 | SC4e | onPageChange | Matrix |
| 既定 100 | S5 | SC5a | URL 優先 | Matrix / AC-L3-3 |
| pilot 構成 + isLoading + 0 件 | S5 | SC5b | ListShell 経由 | Matrix / AC-L3-2 |
| returnTo 保持 | S5 | SC5c | search string | Matrix |
| docs 同期 | S6 | AC6 | 「予定」0、mockup 注記 | AC6 / AC9 |
| mockup 5 file | S7 | AC7 | S7 pin | AC7 / AC-L3-5 |
| Plans 申し送り | S8 | AC8 | 4 件 | AC8 |

## Data Safety

- 業務データ・実店舗データに非接触。CSS token・page root class・件数文言・検索 state の既定値のみを扱う。
- local-only: `perPage` は URL search state（既存機構）、永続化の追加なし。
- synthetic-only: test / probe の seed は合成の商品名・コード・件数。mockup も合成データ。

## Implementation Results

（Writer が記入。S2 の before/after 表は機械抽出、Probe 1〜3 の結果を列挙）

## Review Response

2026-09-03 Plan Review round 1（独立 Sonnet = P1 2 / P2 4 / P3 3、Opus デザイン面 = P1 4 / P2 8 / P3 3）: 全件 accept。Sonnet P1-1（AC2 の `rg -l` は 28 file、43 は箇所数）→ AC2 を file 数 + 箇所数の二段構えへ / P1-2（Matrix SC3a の to は 1,100）→ 訂正 / P2-3（`#cdc8c4` は 1.59:1、1.66 は対純白）→ 起票時実測・S1・reference §8 訂正を scope 化 / P2-4（patterns → features 逆依存）→ D-9 で `Pagination.tsx` へ移設、旧 Non-scope 撤回 / P2-5（returnTo は自動化可能）→ SC5c 新設、AC-L3-3 を render 確認のみへ / P2-6（SC4c / SC5b に X なし）→ X13 / X14 追加、AC10 = X1〜X14 / P3-7（`:36`）/ P3-8（`npm run build`）/ P3-9（3 file 6 箇所）→ 訂正。Opus P1-1（sticky 背景は mockup `--d-head` = `bg-muted`）/ P1-2（`border-collapse` で下端線が消える → `border-separate border-spacing-0` + thead cell `border-b`）/ P1-3（`--border` 単独濃化で階層反転 → `--input: var(--border-strong)` を同時適用、outline / Badge / chip は Lane 3〜5 sweep）/ P1-4（上部 summary が流れ去る → summary + thead の 1 帯 sticky、mockup 箱内スクロール不採用理由を注記）→ D-2 / D-7 改訂。P2-1（枠は `rounded-lg border bg-card p-4`、04 原則 6 を同期）/ P2-2（`totalCount > 0` gating、`toolbar` optional）/ P2-3（pilot に `isLoading` 配線）/ P2-4（summary は 16px semibold tabular-nums、catalog ⑩ `:646` を是正）/ P2-5（1.59:1）/ P2-6（AC-L3-1 に dialog + sidebar）/ P2-7（静的 boolean の近似採用を D-5 に明記）/ P2-8（S7 の描画内容 pin + DSR-22 `:441` の最終確定を AC-L3-5 へ）→ 反映。P3-1（`cn` 順序 + SC2a case）/ P3-2（README `:16` stale）/ P3-3（重複読み上げの記録）→ 反映。

2026-09-03 Plan Review round 2（独立 Sonnet = P1 1 / P2 1 / P3 1、Opus デザイン面 = P1 3 / P2 7 / P3 3。round 1 の 24 件は両者とも closed 確認、誤是正なし）: 全件 accept。Sonnet P1-1 = Opus P1-1（`border-separate` は `tr` の border を描画しないため tbody 行の区切りも消える、mockup `:37` は `td` に border-bottom）→ D-2 (ii) を th `border-b-2` + td `border-b` の cell 単位へ拡張 / Opus P1-2（thead `border-b` に oracle と mutant なし）→ SC4d oracle 拡張 + X15 / X16、AC10 = X1〜X16 / Opus P1-3（SegmentedControl `border-stone-300` 1.43:1 < 新 `--border` 1.59:1）→ Non-scope・AC-L3-1・S8 (iv) に追記 / Sonnet P2-1 = Opus P2-3（`h-10` / `top-10` の magic pair）→ `flex h-10 items-center whitespace-nowrap overflow-hidden` で 1 行固定、可変 offset は不採用 / Opus P2-1（SearchBar の入力枠 3.53:1 と outline ボタン 1.59:1 の段差）→ 検索ボタンのみ本 lane で `border-border-strong`（D-7 例外 1 件、S5）/ P2-2（表の外枠は `overflow:hidden` が sticky を殺す）→ 本 lane では付けない旨を D-2 に明記 / P2-4（AC1 の `#e7e5e4` 0 hit は reference `:19` で達成不能）→ 00 と reference で oracle 分離 / P2-5（sticky は th cell 単位）→ D-2 (iii) 一本化 / P2-6（focus 判別性 4.0:1 → 1.36:1、`--ring` は据え置き）→ AC-L3-4 に focus 項目 / P2-7（適用機構が未 pin）→ descendant variant のみを D-2 / Spec Contract に明記 / P3-1（th 下端 2px、summary 帯に線なし）/ P3-2（th は `text-foreground` 維持）/ P3-3（⑯ 3 の影は項目 4 側）→ D-2 / S6 に反映。Sonnet P3-1（badge / RootLayout は明示 utility）→ 起票時実測の表現を精緻化。Opus 回答（z-index 衝突なし / card-on-card は pilot 安全・S8 (v) へ / summary 16px semibold は PageHeader 24px と競合せず維持 / S7 pin 3 点で十分、150% は AC-L3-4 の form 画面追加で代替）→ 反映。

2026-09-03 Plan Review round 3（最終、closure）: Sonnet = P1/P2/P3 0（round 2 の 18 件 closed、cross-section 整合・marker 0 を確認）。Opus = P1 0 / P2 1 / P3 2（round 2 の 15 件 closed、最終 class set は承認 mockup `:33-37,65,85-86` を記録済み逸脱 3 件以外で再現すると確認）。P2-A（`stickyHeader` のみ真で `topSummary` 偽のとき th が `top-10` 固定で 40px 浮く）→ D-2 (iii) / Spec Contract / SC4d を「summary 帯を描画するときのみ `top-10`、それ以外 `top-0`」へ条件付け。P3-A（Impact Lenses / Coverage Ledger / Trace Matrix の「`border-separate` で境界線を残す」等の表現 drift 3 箇所）→ cell 罫線へ統一。P3-B（th font-weight / padding、td height、th box-shadow の既存差が未記録）→ D-2 に記録済み逸脱として追記。round 天井 3 に到達したため追加 round は設けず、是正 3 件は契約の条件付けと表現統一のみで新規設計を含まないことを Coordinator が実読で確認して収束とする（介入 1/3 = 起票選定のまま）。

2026-09-03: Plan Gate 収束（round 3/3、是正 commit = round 1 `1711667` / round 2 `b62b23f` / round 3 は直前の content commit）。`plan-gate -> plan-approved -> implementing` を本 state-only commit で圧縮遷移（forward state-only 1/3）: plan-approved の証跡 = Review Response 節（Sonnet 3 round + Opus 3 round、最終 P1/P2 = 0 に是正済み）、Plan Commit = plan-first commit `244a5dd`。Writer = Sonnet subagent（worktree isolation、発注書は Coordinator 起草、runtime → docs → mockup の順、D-8 descope 経路あり）。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
