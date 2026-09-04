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
- Amendments: 4401112 b318240 357941c 75d5e30 ec56d20 cf56d18 29091d4 9005270 cdd82d9 9e9e76f a823df8
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（runtime code + design docs + mockup HTML、worktree isolation、TDD）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Opus 5 デザイン面レビュー（発注書駆動・read-only・§5.4 低制約 profile、D-056 準拠）+ Fable 裁定
- Final Reviewer: Codex（GPT-5.6、ロジック・整合面、PR review 1 回 = relay 1/2）+ Opus 5 デザイン面レビュー（read-only）+ Claude Sonnet 5 subagent mutation 独立再実測（隔離 worktree、Writer とは別 fresh context）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（商品一覧 pilot の器・sticky 帯・範囲付き文言・PageShell 余白・`--border` / `--input` 濃化の render oracle + DSR-22 低視力 L3 (a)(b) の実施分）。Lane 1b mockup 5 file の視認は Gated Amendment 5 で non-blocking へ descope（run 5 = 帯 1 点）

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
| D-2 | sticky 帯と識別列固定 | `stickyHeader` 時、ListShell root の **descendant variant のみ**で（caller に className を渡させない、Opus round 2 P2-7）: (i) table-container の overflow を `[&_[data-slot=table-container]]:overflow-visible` で解く。(ii) table を `[&_[data-slot=table]]:border-separate [&_[data-slot=table]]:border-spacing-0` にする。separated model では `tr` の border が描画されないため（Tailwind preflight の `border-collapse: collapse` 依存が外れる）、`th` に `border-b-2 border-border`、**tbody の `td` にも `border-b border-border`**（最終行は `border-b-0`）を cell 単位で再付与する（承認 mockup `:36-37` の th / td 罫線と同型。Sonnet round 2 P1-1 / Opus round 2 P1-1）。(iii) sticky・背景も **`th` cell 単位**: `[&_thead_th]:sticky [&_thead_th]:z-10 [&_thead_th]:bg-list-head [&_thead_tr]:bg-list-head`（Gated Amendment 2 S11 で `bg-muted` から `--list-head` へ、summary 帯と同一 surface にし左右端を揃える）に加え、**summary 帯を描画するとき（`topSummary && totalCount > 0`）は `[&_thead_th]:top-10`、それ以外は `[&_thead_th]:top-0`**（帯が無いのに 40px 浮かない、Opus round 3 P2-A。mockup `:36` と同型、識別列固定の z 階層〈header > 固定列 > 本文〉へ接続しやすい、Opus round 2 P2-5）。th の `font-weight` / padding、td の height / padding、th の `box-shadow` は mockup（`:36-37`）と table primitive 既定（`table.tsx:61,74`）の既存差であり本 lane の対象外（記録済み逸脱、Opus round 3 P3-B）。(iv) 上部 `PaginationSummary` を `sticky top-0 z-20 flex h-10 w-full items-center truncate bg-list-head` の帯にし、**summary + th を 1 つの sticky 帯**として `<main>` 相対に留める（Opus P1-4: `<main>` 相対では上部 summary が最初の 1 画面で流れ去り、DSR-22 が上部表示を要求した目的〈Q5 原則③④〉が失われる）。帯高 `h-10` と th の `top-10` は対で固定し、`whitespace-nowrap` で 1 行を構造的に保証する（可変 offset は happy-dom で検証できず不採用、Sonnet round 2 P2-1 / Opus round 2 P2-3）。summary 帯には下端線を付けず、線は th 下端の 2px 1 本のみ（帯と th が同色で 1 ユニットに読める、Opus round 2 P3-1）。背景は `--list-head`（= #e7e5e4、Gated Amendment 2 S11 で `bg-muted`〈#f5f5f4〉から変更。旧 `bg-muted` は本文 `--card`/`--muted` と近く sticky 帯が浮き上がらなかった、owner L3 run 1 FAIL-3）。**表の外枠（mockup `:33` `.tbl` の `border-radius:8px; overflow:hidden`）は本 lane では付けない** — `overflow:hidden` が `<main>` 相対 sticky を殺すため移植不可（Opus round 2 P2-2、Lane 3〜5 で `overflow-hidden` なしの枠を再検討）。識別列固定は `identityColumns?: number` prop を予約するだけで描画に影響しない。両立方式（wrapper を横 scroll container に戻すと sticky が死ぬ / `<main>` を両軸 scroller にすると page 全体が横 scroll する / 二重 table）は Lane 3〜5 で横 overflow が実発生する画面を確認してから probe する | 起票時実測 2 点目。mockup の箱内スクロール（`max-height:56vh`）は DSR-17 と衝突するため不採用、この機構差分と外枠不採用を S6 で `mockup-d-lists.html` の注記に追記する。DSR-22 は識別列固定を「横 overflow 実発生時のみ opt-in」と pin しており、pilot で overflow 実発生の証拠がない段階で方式を固定しない |
| D-3 | 範囲付き文言の 0 件・端数契約 | `from = (page-1)*perPage+1`、`to = min(page*perPage, totalCount)`。`totalCount === 0` のときは `0 件` のみ表示し前後ボタンは両方 disabled、`totalPages` は 1 扱い。`toLocaleString("ja-JP")` は n / from / to すべてに適用、数値は `tabular-nums` | catalog ⑩「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」を pin しつつ、0 件で「0 件中 0〜0 件目」と読ませない。Probe 3 で 0 件時に pager を描画しない caller を確認し現状維持 |
| D-4 | 上部 variant の形と typography | `PaginationSummary`（text-only、ボタンなし）を `Pagination.tsx` から export。typography は `text-base font-semibold text-foreground tabular-nums`（16px、承認 mockup `:65` と一致。catalog ⑩ `:646` の `text-sm font-medium` は 04 原則 1「本文 16px 最低線」と mockup に反するため S6 で catalog 側を是正、Opus P2-4）。下部 pager の `text-sm text-muted-foreground` は据え置き。上部・下部で同一文言が重複することは記録に留め（screen reader は DOM 順で 2 回読む、`aria-hidden` は付けない）、Lane 3〜5 の判断材料とする（Opus P3-3） | catalog ⑩ Don't「上部 variant に下部と同じボタン群を無条件で重ねる」/ DSR-22「上部は text 必須・pager ボタン任意」 |
| D-5 | ListShell の props | `{ toolbar?: ReactNode; toolbarSecondary?: ReactNode; pagination?: {page, perPage, totalCount, onPageChange}; topSummary?: boolean; stickyHeader?: boolean; identityColumns?: number; isLoading?: boolean; skeleton?: ReactNode; children }`。toolbar 枠は `rounded-lg border bg-card p-4`（2 段時は段間 `space-y-3`）の 1 箱に 2 段（`toolbarSecondary` 省略時は 1 段、`toolbar` 省略時は枠なし、承認 mockup `.filters` = card 塗り + 8px 半径、Opus P2-1）。上部 summary と下部 pager は **`pagination.totalCount > 0` のときだけ描画**（0 件時に `EmptyState` の上下へ「0 件」と pager が出ない、Opus P2-2）。children は caller の loading / error / empty / data 分岐を抱えてよいが、`isLoading` が true のとき ListShell は children の代わりに skeleton（既定 `ListSkeleton`）を描画する。`topSummary` / `stickyHeader` は静的 boolean であり、DSR-22 の「実表示が viewport を超えるとき」は **perPage 既定 100 が viewport を超えることをもって画面単位で満たすとみなし、結果件数による動的判定はしない**（近似採用、Opus P2-7） | catalog ⑯ 必須構成 6 項目のうち 1〜3・6 を本 lane で満たし、4（識別列）は予約、5（現在行 3 点）は token 提供のみ。04 原則 6 の枠文言（`rounded-md border p-4`）は S6 で mockup 準拠（`rounded-lg border bg-card p-4`）へ同期。記録済み逸脱: mockup の `--card` は #fff、runtime は 00-foundations の #f5f5f4。toolbar 箱 #f5f5f4 / sticky 帯・th #e7e5e4（Gated Amendment 2 S11 で分離）/ ページ地 #fafaf9 の 3 段（1.04:1 / 1.15:1 / 1.20:1）になる。`--card` の見直しは全画面波及のため Lane 3〜5 候補、L3 で owner が判定（Final Review round 1 P1-1）。 |
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

**S8 Plans.md ④ + 申し送り**: ④ を「Lane 2 完了、次 = Lane 3〜5」へ更新し、sub-bullet に (i) 入出庫履歴 / 在庫変動履歴の perPage 200 は backend `inventory_service::list.rs:21` `MAX_PER_PAGE` 100 → 200 の契約変更（docs 21 + tests）を伴う（Codex 適性）(ii) sticky 帯 × 識別列固定 × DSR-17 `<main>` 単一 scroll の両立 probe は横 overflow 実発生画面で行う（D-2）(iii) 棚卸し A' 帯ラベルの contrast 是正（Lane 1a 申し送り、`--muted-foreground` 対 `--card` 4.40:1）は棚卸し lane で (iv) outline ボタン / Badge / chip / SegmentedControl 枠の `--border-strong` sweep（segmented は `border-stone-300` 直書きの token 化を含む、D-7）(v) Card 内に一覧を持つ画面を ListShell 化する際は toolbar 枠の `bg-card` が card-on-card で沈むため枠の地色を再判断（pilot は Card なし）(vi) `StocktakePage.test.tsx:1038` の test 名「canonical ProductPagination」は棚卸し lane で `Pagination` へ更新 (viii) 100% 表示での構造線の反復による重さ → container の囲みを一階層減らす案（owner L3 所感、Lane 3〜5 候補）(vii) `ListSkeleton` の外枠（`rounded-md border p-3`）は表の外枠再検討（D-2）とセットで Lane 3〜5（`ListSkeleton` は他 2 画面も使うため本 lane では触らない）、を記録。`Plans.md:93` の UI_TECH_STACK stale 行を消化済みへ。

### Gated Amendment 1（Writer 完了報告起源、2026-09-03、Coordinator 起票）

Writer 完了報告（HEAD `467fe67`）で `generate_traceability -- --check` が [T1]（90-traceability.md drift）と [T4]（REQ/UI 未参照 FE test 数 baseline 22 / 現在 25）で FAIL、および旧 `ProductPagination` path / 名の残存が canonical docs 以外に見つかった。いずれも契約の追加ではなく、既存 gate の指示どおりの是正と S6 の sweep 範囲拡張。

- **A1-a（T4 / T1）**: tool の指示文「増えた場合は新しいテストの describe/it に REQ-NNN / UI-NN ID を含めてください」に従い、新規 contract test 3 file（`src/components/patterns/PageShell.test.tsx` / `src/styles/globals.test.ts` / `src/test/page-root-pageshell-sweep.test.ts`）の `describe` に pilot 画面 `UI-01a` を含める（header comment に「共有部品の contract test、traceability 上は Lane 2 pilot = UI-01a へ紐付け」を明記）。`FE_UNREFERENCED_BASELINE` は **変更しない**（baseline 更新は「意図的に減らした場合」の手順であり、`src-tauri` diff 0 行の AC9 を維持）。その後 `cargo run --bin generate_traceability`（`--check` なし）で `docs/function-design/90-traceability.md` を再生成して commit し、`--check` clean を AC9 に含める。
- **A1-b（旧 path / 名の sweep 拡張）**: `docs/function-design/{50,58,59,66,73,74,75}-*.md` と `docs/FUNCTION_DESIGN.md:39,139` の `ProductPagination` / `features/products/components/ProductPagination` を `Pagination`（`src/components/patterns/Pagination.tsx`）へ更新、`docs/design-system/reference/mockup-d-lists.html:105` の保留項目文言「238 件中 1 / 5 ページ」を範囲付き統一形「238 件中 1〜50 件目 · 1 / 5 ページ」へ。歴史記述（「旧 ProductPagination」「PR #30 …」等、`旧` を含む行 / Plans.md の完了記録 / archive / reference 分析 doc §1-3）は残す。`StocktakePage.test.tsx:1038` の test 名は AC5（diff 0 行）を優先して据え置き、棚卸し lane で更新（S8 に (vi) として追記）。
- **AC 追加**: AC3 に `rg -n "ProductPagination" docs/function-design docs/FUNCTION_DESIGN.md docs/design-system --glob '!**/2026-08-23-current-design-analysis.md' | rg -v "旧"` = 0 を追加。AC9 の traceability を「`--check` clean（90-traceability.md 再生成 commit を含む）」へ明確化。
- **Probe 2 の記録**: Writer は worktree にブラウザ計測手段がなく計測不能（静的分析では商品名列が `whitespace-normal` 折返しのため overflow 発生の可能性は低いと推定）。AC-L3-2 の L3 実測を oracle とし、overflow 実発生なら Probe 2 に定めた Gated Amendment 経路（`stickyHeader` を pilot で false）へ。

### Gated Amendment 2（owner L3 run 1 FAIL 起源、2026-09-03、Coordinator 起票）

PR #32 comment 5526295095 の FAIL 4 点を全件 accept。owner の修正案（Primary 色を使わない / ボタン色は強めない / 表の外枠と page 灰色化は追加しない / timeout の対症療法は不採用）を制約として採る。

- **S9 SegmentedControl の操作群 affordance（FAIL-1）**: `src/components/ui/segmented-control.tsx:9,12` の `border-stone-300` 直書きを撤去し、群 wrapper を `rounded-md border border-border-strong bg-background p-0.5` の 1 枠にする（操作枠 3:1、DSR-22 `:443` の segmented 対象化）。未選択肢は `border-transparent` のまま、選択中の stone 塗り + bold（`selection-tone.ts` の既存 tone）は不変。Primary 色は使わない。これにより D-7 / S8 (iv) の「segmented は Lane 3〜5 sweep」は本 lane で消化（S8 (iv) から segmented を外す）。Spec: 群 wrapper の classList に `border-border-strong` を含み `border-stone-300` を含まない（`rg -c "stone-300" src/components/ui/segmented-control.tsx` = 0）。
- **S10 PLU 一括操作の作用範囲と確認予告（FAIL-2）**: `ProductListPage.tsx` の `toolbarSecondary` 内で `PLU 対象にする` / `PLU 対象から外す` の pair を 1 つの group（`role="group"` + `aria-labelledby`）に包み、直上に可視 caption「**PLU 一括操作**（絞り込みに一致する商品すべてが対象・他ページ含む・確認画面あり）」を `text-sm`（label 部は `font-medium text-foreground`、括弧部は `text-muted-foreground`）で置く。button の label・variant・色は不変（既存 test の `getByRole("button", { name })` を壊さない）。Spec: caption text が `toolbarSecondary` 内に存在し、2 button が同じ group の子である。
- **S11 sticky 帯の surface 連続化（FAIL-3）**: 新 token `--list-head: #e7e5e4`（stone-200、対 `--background` 1.20:1、対 `--foreground` ≈13.8:1）を `globals.css` `:root` + `@theme inline`（`--color-list-head`）に追加し 00-foundations 表へ「一覧 sticky 帯 / `--list-head`」として登録（DS3 対象化）。summary 帯（`bg-muted` → `bg-list-head`）・`[&_thead_th]`（`bg-muted` → `bg-list-head`）・`[&_thead_tr]:bg-list-head` を同一 surface にし、summary 帯と table が同じ幅（container `w-full`、table `w-full`、帯に `w-full`）で左右端が揃うことを保証する。th 下端 2px 線は維持、表の外枠・page 灰色化は追加しない。Writer は Probe 4 として `npm run dev` の商品一覧で帯と th の左右端が一致することを目視し結果を記録（計測不能なら理由）。catalog ⑯ 使用トークン / D-2 / mockup-d-lists.html の `--d-head` 注記を `--list-head` #e7e5e4 へ同期（mockup 側は `--d-head` 値を #e7e5e4 に更新）。Spec: 帯と `[&_thead_th]` / `[&_thead_tr]` の class に `bg-list-head` を含み `bg-muted` を含まない。
- **S12 dialog 退出中の反対文言残像（FAIL-4、P2 bug）**: `ProductListPage.tsx:303-309` の `open={bulkTarget !== null}` / `pluTarget={bulkTarget ?? true}` を、`bulkDialogOpen: boolean` と `bulkTarget: boolean`（最後に選んだ target を保持、初期 true）の 2 state に分離する。close は `setBulkDialogOpen(false)` のみで target を触らない。timeout による reset 遅延は不採用。Spec: 「対象から外す」を開いて cancel した直後の最終 render で dialog に渡る `pluTarget` が `false` のまま（`vi.mock` で `PluBulkTargetConfirmDialog` の props を記録して検証）。
- **Matrix 追加**: SC6（S9）/ SC7（S10）/ SC8（S11）/ SC9（S12）と X17〜X20。AC10 = X1〜X20。
- **AC-L3 更新**: AC-L3-1 (f) を「SegmentedControl が操作群として認識できる（群枠あり）」へ、AC-L3-2 に「summary 帯と th が同一 surface で左右端まで連続し 1 つの帯に見える」を追加、AC-L3-6（新設）= 「PLU 一括操作の caption で作用範囲と確認ありが押す前に分かる」「`PLU 対象から外す` を開いて cancel しても閉じる途中に反対文言が出ない」。L3 run 2 は canonical の最初から（未実施項目を含む）。
- **docs**: S8 (iv) から segmented を除去（token 化済み）、S8 に (viii)「100% 表示での構造線の反復による重さ → container の囲みを一階層減らす案（owner 所感、Lane 3〜5 候補）」を追記。

### Gated Amendment 3（owner L3 run 2 FAIL 起源、2026-09-04、Coordinator 起票）

PR #32 comment 5527090250 の FAIL 1 点（AC-L3-2 の 1 帯化）と懸念付き PASS 1 点（PLU 一括 caption）を accept。owner の修正案（summary と table の間だけ gap を作らない / summary に header と対応する水平 inset / caption は左寄せ 2 段 + 実件数、新規 component なし）を採る。Amendment 2 S11 が surface と幅のみを規定し垂直隣接・水平 inset を書いていなかったこと、mockup `.pager.top` が背景なし・`.tbl` と 24px gap の別構造で「1 つの帯」の視覚正本が無かったことが根本原因。本 Amendment は Writer 発注前に Opus デザイン面レビュー（発注書駆動・read-only、2026-09-04、P1 5 / P2 6 / P3 5）を通し、全件 accept して以下へ反映済み（P1-1 同乗 vehicle 入替 / P1-2 `basis-full` / P1-3 presence oracle / P1-4 dialog title 同期 / P1-5 文言表登録 / P2-1〜6 fixture・mutant 分割・正の oracle・横 overflow 観察・読込中文言・literal oracle / P3-1〜5 anchor・単一 table・inset 値・文言順・truncate backlog）。

- **S13 summary 帯と thead の垂直隣接 + 水平 inset（FAIL、AC-L3-2）**: `ListShell.tsx:71-78` root の `space-y-3` は残し、`stickyHeader && showTopSummary` のとき summary 帯（`:87`）と `isLoading ? skeleton : children`（`:103`）を spacing utility を持たない 1 つの `<div>` wrapper に包み、root の `space-y-3` が toolbar /（帯 + table）/ 下部 `Pagination` の間だけに効くようにする（帯と `[data-slot=table-container]` の間に page 地を挟まない）。summary 帯に `px-2` を追加し、`table.tsx:61` `TableHead` の `px-2` と左基準線を一致させる（揃えるのは帯と thead の相互一致であり、toolbar 箱 `p-4` との 8px 差は許容）。帯の `h-10` / `truncate` / `bg-list-head` / `w-full` / `sticky top-0 z-20` と root の `[&_thead_th]:top-10` 結合は不変。非 sticky 分岐（`:95-99`）と `showTopSummary` false の描画は不変。summary 直下の hairline は追加しない（AC-L3-2 の字面「1 つの帯」を優先。L3 run 3 で 80px の一枚板が重く見える場合は `border-b border-border` 1 class を Gated Amendment 経路として予約）。横 overflow 時に帯 `w-full` が thead の右端まで届かない点は追補 S17 で wrapper を `w-min min-w-full` にして是正する（帯の `min-w-full` は containing block が wrapper のため no-op、wrapper の `w-max` は商品名列の折返しを解いて 100% でも横 overflow を作る。Opus closure P1-2 の主張は accept、修正方向は rebut）。それでも割れるなら「pilot の `stickyHeader` false」を Gated Amendment 経路として予約。Spec: 帯の classList に `px-2` を含む。帯の `parentElement` の classList に `space-y-` / `gap-` / `mt-` / `mb-` / `pt-` / `pb-` で始まる token が無い。帯の `parentElement` は ListShell root（`container.firstElementChild`）と異なり、root の classList は `space-y-3` を含む。帯の `nextElementSibling` が `[data-slot=table-container]`（children 描画時）。
- **S14 PLU 一括操作 caption の左寄せ 2 段 + 実件数 + dialog title 同期（懸念付き PASS、owner 提案採用、AC-L3-6 前段）**: `ProductListPage.tsx:199-205` の block を `basis-full flex flex-col items-start gap-1`（`ml-auto` と `items-end` を撤去。`ml-auto` を残すと 125% 以上で block が別行右寄せになり左端が text 幅で浮くため、常に toolbarSecondary 内の独立行とし左端を toolbar 箱の `p-4` 基準線に一致させる）へ。1 段目 `<p id="plu-bulk-caption" className="text-sm font-medium text-foreground">PLU 一括操作</p>`。2 段目 `<p id="plu-bulk-description" className="text-sm text-muted-foreground">` の文言は `totalCount`（`:92`、dialog `:325` の `count` と同一値）で分岐する: (a) `productsQuery.data` あり かつ `totalCount > 0` → 「絞り込みに一致する {totalCount.toLocaleString("ja-JP")} 件すべてが対象です。他のページの商品も含みます。押すと確認画面が開きます。」 (b) `productsQuery.data` あり かつ `totalCount === 0` → 「絞り込みに一致する商品がないため実行できません。」 (c) `productsQuery.data` 未取得（読込中、button は disabled）→ 「件数を読み込んでいます。読み込みが終わると操作できます。」。owner 原案「絞り込みに一致する全453件が対象です（他ページを含む）。実行前に確認します。」からの改変理由: 件数を文頭に置き短文 3 つに割る（高齢利用者向けに 1 文 1 情報）、注釈全体を括弧で括らない、「実行前に確認します」は主語が曖昧なため「押すと確認画面が開きます」で押した結果を予告する。数字と「件」の間の半角空白は帯（`Pagination.tsx:43`）・dialog（`PluBulkTargetConfirmDialog.tsx:37-38`）の規約に揃える。group（`:206-210`）は `aria-labelledby="plu-bulk-caption"` を維持し `aria-describedby="plu-bulk-description"` を追加。button の label・variant・disabled 条件・onClick は不変。**dialog title 同期**: `PluBulkTargetConfirmDialog.tsx:34` の「表示中の商品をPLU対象にしますか / 表示中の商品をPLU対象から外しますか」は caption の「他のページの商品も含みます」と正面から矛盾するため「絞り込みに一致する商品をPLU対象にしますか / 絞り込みに一致する商品をPLU対象から外しますか」へ変更し、`docs/function-design/50-ui-product-list.md:103` の文言表行と `ProductListPage.test.tsx:132` / `:173` の literal を同一 commit で更新、`docs/screen_mockups.html` の同文言は同 dialog の描写なら同期（archive docs は不変）。Spec: SC7 の文言 oracle を新文言へ更新し group 検査は維持（旧文言「（絞り込みに一致する商品すべてが対象・他ページ含む・確認画面あり）」と「表示中の商品を」は `src` で 0 hit）。SC11 で (a)(b)(c) の文言完全一致（(a) の fixture は `total_count: 1234` で「1,234 件」を literal 期待）・`aria-describedby` の参照先・block の classList に `basis-full` と `items-start` を含み `ml-auto` / `items-end` を含まないこと。SC11 の期待文言は component / 定数を参照せず test 内に literal 転記し完全一致で比較する（production 定数と oracle を共有しない）。
- **S15 mockup / catalog ⑯ / 文言表の同期（doc、Writer の content commit に含める）**: `mockup-d-lists.html:85-86` の `.pager.top` を `.tbl` 内（`.scroll` の直前）へ移し、`:64-65` に `.pager.top{background:var(--d-head);padding:0 12px;min-height:40px}` を追加（`.tbl` の枠と左右端を共有し、th `padding:10px 12px` と左基準線を揃える。密度比較 `:93` / `:97` は不変）。`02-component-catalog.md:906` 第 3 項を「単一 `<table>` 内（header を別 table に分けない）。summary 帯（`<table>` 外の `div`、`h-10` / `px-2` / `--list-head`）と `thead` を page 地を挟まず垂直に隣接させ、同一 surface・同一 inset の 1 つの sticky 帯として `<main>` 相対に留める。記録済み逸脱: mockup `.tbl` の外枠（border + radius + `overflow:hidden`）は runtime では付けない（`overflow-hidden` が sticky を殺す、Plan Review round 2）。inset 値は mockup 12px / runtime 8px で、揃えるのは帯と thead の相互一致であって絶対値ではない」へ字面修正。同 file 第 1 項「toolbar 2 段」に「node 構造の 2 段であり視覚行数ではない（PLU 一括操作 block は `basis-full` で独立行、125% 以上では視覚 3 行以上になりうる）」を 1 文追記。`50-ui-product-list.md:99-105` の文言表に `| toolbar caption | (a)(b)(c) の 3 文 |` 行を追加し、`:103` dialog title 行を新文言へ更新。DSR-22 本文は不変（帯の構成は catalog ⑯ が正本）。Spec: mockup CSS `rg -c '\.pager\.top\{[^}]*--d-head' docs/design-system/reference/mockup-d-lists.html` = 1、markup `rg -c -F '<div class="tbl"><div class="pager top">' 同 file` = 1。catalog `rg -c -F 'sticky header**（単一' docs/design-system/02-component-catalog.md` = 0（旧字面の起点 literal、起票時 1 hit）かつ `rg -c -F 'page 地を挟まず垂直に隣接' 同 file` = 1 かつ `rg -c -F '同一 surface・同一 inset' 同 file` = 1。文言表 `rg -c -F '押すと確認画面が開きます' docs/function-design/50-ui-product-list.md` = 1 かつ `rg -c -F '表示中の商品を' 同 file` = 0。
- **Matrix 追加**: SC10（S13）/ SC11（S14）/ SC12（S15、doc oracle）と X21〜X29。AC10 = X1〜X29。
- **AC-L3 更新**: AC-L3-2 に「summary 帯と th の間に page 地の隙間が無く、summary 文言の左端が 1 列目の列名の左端と揃い、通常位置と sticky 位置で帯の見え方が変わらない」「横スクロールを発生させたとき summary 帯の背景が thead と同じ右端まで続くか」を追加。AC-L3-6 前段を「PLU 一括操作の title と説明文が左寄せ 2 段で、実件数入りの文として作用範囲（他ページ含む）と確認画面が押す前に分かる。dialog title が『絞り込みに一致する商品を…』で caption と矛盾しない」へ更新。L3 run 3 は canonical の最初から（未実施項目を含む）。
- **docs**: S8 に (ix)「帯文言の自然文化（『全 n 件のうち a〜b 件を表示（p/t ページ）』、owner L3 run 2 所感、P3）は DSR-22 範囲付き統一形の改訂で 8 caller + mockup + Matrix に波及するため Lane 3〜5」、(x) は追補 S17（帯 `overflow-hidden` + `[&>div]:truncate`）で消化済みのため追記しない（Opus closure round 2 P3-2）。
- **遷移と STATECAP**: post-impl state-only は 2/2 到達済み（`646fa1c` / `916696c`）のため、`implementing -> local-verified -> independent-review -> human-confirm` は packet の content commit（Contract Coverage Ledger への SC10〜SC12 行追加 + Gated Amendment 3 対応結果記入 + Workflow State）に同乗して materialize する（先例: `docs/archive/plans/2026-07-17-backup-migration-failure-contract-design.md:259` の amendment 同乗）。Writer は S13 / S14 / S15 + test + Matrix を content commit とし、packet の結果記入と Ledger 行は書かずに報告する（SC12 の doc oracle が content candidate で成立するように S15 を含める）。独立 closure（Sonnet mutation X21〜X29 は clean tree の最終 content commit、Opus デザイン面は同 commit）で P1/P2 = 0 後、Coordinator が Ledger 行 + 結果記入 + Workflow State を 1 commit で作る（content candidate = Writer の最終 content commit）。`human-confirm -> ready-hosted-final` は L3 run 3 PASS 後の DSR-22 履歴系固定列 mapping 最終確定（AC-L3-5、`01-decision-rules.md:441` の暫定文言撤去）content commit に同乗する。

#### Gated Amendment 3 追補（Final Review closure round 1 起源、2026-09-04、Coordinator 起票）

content candidate `76dc43e`（S13〜S15、Writer 3 commit）に対する独立 closure: Sonnet mutation = X21〜X29 全 kill + X16〜X20 再測全 kill、着地 closed、findings 0。Opus デザイン面（L3 run 3 canonical 全項目スコープ、owner の目の代理）= P1 3 / P2 5 / P3 4 → P1-1 / P1-3 / P2-1〜P2-5 / P3-1〜P3-4 accept、P1-2 は主張 accept・修正方向 rebut（上記 S13 訂正）。run 3 で FAIL 見込みとされた AC-L3-4（forced-colors）と AC-L3-5（mockup 3 file）は Amendment 3 の外側の未消化負債で、L3 前に潰す費用対効果が高いため本追補で消化する。

- **S16 forced-colors の focus indicator（Opus P1-1、AC-L3-4）**: `input.tsx:11-12` / `button.tsx:8` / `select.tsx:34` / `segmented-control.tsx:13` は `outline-none`（v4 = `outline-style: none`）+ `focus-visible:border-ring` + `ring` の 2 系統で、forced-colors では box-shadow が無効化され border 色も静止時と同じ system color に置換されるため focus が完全に消える（`rg -c forced-colors src` = 0）。`globals.css` の `@layer` 外（`:root` ブロックの後、`@layer base` の前）に次を追加する: `@media (forced-colors: active) { :focus-visible { outline: 2px solid Highlight; outline-offset: 2px; } }`。unlayered のため `@layer utilities` の `outline-none` に勝つ。通常表示は不変。Spec（SC13、fs literal）: `rg -c -F '@media (forced-colors: active)' src/styles/globals.css` = 1、同 block 内に `:focus-visible` と `Highlight` を含む、block が `@layer` の外にある（`@layer base {` より前に現れる）。
- **S17 帯の横 overflow 追随 + ellipsis + forced-colors 下端線（Opus P1-2 / P2-2 / P2-3、AC-L3-2 / AC-L3-4）**: `ListShell.tsx` の S13 wrapper に `w-min min-w-full` を与える（min-content = table の最小幅。非 overflow 時は `min-w-full` で 100%、overflow 時は wrapper = table 幅となり帯 `w-full` が thead の右端まで追随する。`w-max` は不採用: 商品名列 `whitespace-normal min-w-[14rem]`（`ProductTable.tsx:52`）の折返しが解け 100% でも横 overflow が出る）。帯の `truncate` を `overflow-hidden` に変え `[&>div]:min-w-0 [&>div]:truncate` を追加する（flex item の `min-width:auto` で hard clip になる現状を、子 `PaginationSummary` root で ellipsis させる。descendant variant のみ、D-2 / D-9）。帯に `forced-colors:border-b` を追加する（背景色のみの帯は forced-colors で Canvas に潰れるため。通常表示は不変で、S13 の「hairline は追加しない」判断と両立）。Spec: SC10 を更新 — wrapper の `className` が `w-min min-w-full` に完全一致（spacing prefix 検査は維持）、帯の classList に `overflow-hidden` / `[&>div]:min-w-0` / `[&>div]:truncate` / `forced-colors:border-b` を含み裸の `truncate` を含まない。`ListShell.test.tsx:196-197` の `truncate` assertion は更新（削除しない）。実描画（横 overflow 追随・ellipsis）は AC-L3-2 が oracle。
- **S18 mockup 3 file の帯化 + history 上部文言（Opus P1-3 / P2-4、AC-L3-5）**: `mockup-d-history.html`（`.pager.top` 3 箇所）/ `mockup-d-home-sales-admin.html`（4 箇所）/ `mockup-d-import-export.html`（3 箇所）に `mockup-d-lists.html` と同型の `.pager.top{background:var(--d-head);padding:0 12px;min-height:40px}` を追加し、各 `.pager.top` を直後の `.tbl` 内（`.scroll` の直前）へ移す。`mockup-d-history.html` 上部 3 箇所の「{n} 件」+ small 要素「{from}〜{to} 件目を表示 · {p} / {t} ページ」を catalog ⑯ 第 2 項の統一形「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」へ。3 file の番号付き保留項目に「上部件数の帯化（catalog ⑯ 第 3 項）を反映済み」の 1 行を追記。Spec（SC12 拡張）: 3 file それぞれで `rg -c 'class="pager top"'` と `rg -c -F '<div class="tbl"><div class="pager top">'` が一致（3 / 4 / 3）、`.pager.top{...--d-head}` = 1、`rg -c -F '件目を表示' mockup-d-history.html` = 0。
- **S19 stale 字面の同期（Opus P2-1 / P2-5 / P3-2 / P3-3）**: `02-component-catalog.md:904` と `mockup-d-lists.html:116` の「toolbar 箱・sticky 帯・th が同一明度になる」を「toolbar 箱 #f5f5f4 / sticky 帯・th #e7e5e4 / ページ地 #fafaf9 の 3 段（1.04:1 / 1.15:1 / 1.20:1、Gated Amendment 2 S11 で分離）になる」へ。packet 側の D-5 / AC-L3-2 / AC-L3-3 / AC-L3-4 は本追補 commit で同期済み。catalog ⑯ 第 3 項の語順（「`<table>` は単一（…）。」、packet S15 字面「単一 `<table>` 内」との差）は S15 の absence oracle `sticky header**（単一` = 0 と S15 字面が衝突していた Coordinator 起草ミスで、Writer の語順変更を採る（内容等価、Opus P2-5）。Spec: `rg -c -F '同一明度になる' docs/design-system/02-component-catalog.md docs/design-system/reference/mockup-d-lists.html` = 0、`rg -c -F '3 段（1.04:1' 同 2 file` = 各 1。
- **Matrix 追加**: SC13（S16）、SC10 更新（S17）、SC12 拡張（S18 / S19）、X30〜X33。AC10 = X1〜X33。
- **記録のみ**: Opus P3-1（SC10 の spacing prefix 集合は S17 の `className` 完全一致で包含）/ P3-4（caption の `basis-full` 独立行で toolbar 箱が縦に伸び first-fold の表行数が減る、catalog ⑯ 第 1 項に注記済み）。
- **closure round 2 是正（Opus 軽確認 P1 0 / P2 2 / P3 3、Sonnet mutation X30〜X33 + X21〜X29 + X19 全 kill・findings 0、content candidate `4539416`）**: P2-1 / P2-2 / P3-1 / P3-2 / P3-3 accept（AC-L3-2 / AC-L3-4 / S8 (x) は本 commit で同期済み）。
  - **S20 SC13 oracle の強化（Opus P2-1）**: `src/styles/globals.test.ts` の「`@layer base {` より前」という位置プロキシを、block 開始位置までの `{` / `}` 対応数が 0（nesting depth 0 = どの `@layer` にも入っていない）の直接検査に替え、`outline: 2px solid Highlight` を literal で pin する（`outline: 0 solid Highlight` を素通ししない）。Matrix に X34「forced-colors block を `@layer base { ... }` の内側へ移す（位置は現在のまま）」を追加（kill = SC13）。
  - **S21 S16 / S17 の正本 doc 同期（Opus P2-2）**: `00-foundations.md` の token 表の直後（または「その他」相当の節）に「forced-colors focus indicator: `globals.css` の unlayered `@media (forced-colors: active) { :focus-visible { outline: 2px solid Highlight; outline-offset: 2px } }`。component の `outline-none` はこの安全網を前提とし、unlayered で `outline` を上書きしない」を 1 行登録。`02-component-catalog.md` ⑯ 第 3 項に「summary 帯と table の wrapper は `w-min min-w-full`（横 overflow 時に帯が table 幅へ追随、非 overflow 時は 100%）」「forced-colors 時のみ帯に `border-b`（通常表示は hairline なし、Amendment 3 S13 と両立）、帯文言の溢れは子 `PaginationSummary` で「…」」を追記。Spec: `rg -c -F 'forced-colors' docs/design-system/00-foundations.md` = 1、`rg -c -F 'w-min min-w-full' docs/design-system/02-component-catalog.md` = 1、`rg -c -F 'forced-colors 時のみ' 同 file` = 1。
- **遷移**: 追補の Writer 是正（content commit）→ Sonnet mutation 再実測（X30〜X33 + X21〜X29 再測）+ Opus デザイン面軽確認（追補差分のみ）→ closure round 2 是正（S20 / S21）→ Sonnet mutation X34 + X30 再測 + S21 doc oracle → P1/P2 = 0 で Coordinator の同乗 commit（Ledger SC6〜SC13 行 + 結果記入 + Workflow State）。content candidate = 追補の最終 content commit。

### Gated Amendment 4（owner L3 run 3 AC-L3-5 FAIL 起源、2026-09-04、Coordinator 起票）

owner は方針 A「5 mockup を現実装 + Lane 2 の比較差分に限定し、今回の所感と採否理由を packet に残す」を選択した。根本原因は S7 の「現状同期」と、各 mockup が Lane 3〜5 の候補・doc に無い値・独自の共通化案まで描くことを同時に許していた契約矛盾。結果として `mockup-d-home-sales-admin.html` は現実装にある導線・説明・集計を落とす一方、非 link card の「すぐ確認」、平均単価、部門数、架空の操作ログ実行者などを加え、Lane 2 の border / spacing を評価する reference ではなく別製品案になっていた。本 Amendment は runtime / DB / DTO / CSV / 印刷機能を変更せず、reference と acceptance contract だけを正す。起草は Codex（owner L3 handoff 後の draft、2026-09-04）、裁定は Fable（Coordinator）。Plan Review round は天井 3/3 に到達済みのため新規 round は設けず、本 Amendment は round 上限後の owner escalation（owner 方針 A の明示選択 + Fable 裁定）として確定する。役割は Workflow State のまま: Writer = Sonnet subagent（mockup 5 file + reference README + packet / Matrix / Plans のみ、`src` / `src-tauri` 不変）、Final Reviewer = Codex PR review（relay 2/2、source ↔ mockup drift と owner disposition の監査）+ Fable 裁定。Sonnet mutation と Opus は本 Amendment では不要（`src` 差分 0、SC14 は doc oracle）。Fable 裁定で Codex draft から変えた点: (1) Execution Mode / 役割行を元へ戻す（`codex-only` は Final Reviewer の self-closure を許す、D-058 系の既知 risk）(2) 新規 Plan Review を owner escalation へ置換 (3) SC14 を画面 markup（SC14a）と所感 note（SC14b）に分離 (4) DSR-22 固定列 mapping を本 Amendment で撤回・降格しない (5) AC-L3-4 省略分の residual risk を明記。

- **S22 reference の役割を 5 file で固定**: forms-a / forms-b / history / home-sales-admin / import-export の最終 note 冒頭を「runtime の現状を土台に、Lane 2 で実装済みの `PageShell` 24px、`--border` / `--input`、商品一覧 pilot で確定した帯 token を確認する reference。後続候補を画面へ先行実装しない」へ統一する。`番号付き保留項目` と「n 番だけ嫌」方式を廃止し、各 file の末尾を (a) 今回採用（Lane 2）(b) 現実装維持 (c) 後続候補（本 mockup へ描かない）(d) owner L3 所感、の 4 区分にする。sample 数値は `表示例` と明記し、新しい field / command / link capability の根拠にしない。説明 UI 自体と runtime を混同しないため、forms-a の 16px / 24px 比較 panel は「説明用・実装対象外」を見出し直下にも表示する。
- **S23 history を runtime contract へ戻す**: 入出庫履歴は現実装の列・filter を土台にし、固定列は DSR-22 `:435` の mapping（記録日時 + 代表商品）どおりに描く（owner run 3 所感「固定列を含む現実装を維持」を evidence とし、DSR-22 の mapping 表と `:441` の暫定文言は本 Amendment で変更しない。最終確定は L3 PASS 後の docs commit で行う従来計画のまま）。明細数の追加提案を描かない。在庫少一覧は runtime と同じ `状態 → 在庫数 → 売価` の情報順を維持する。操作ログは `日時 / 種別 / 概要 / 詳細` と現在の概要可視性を維持し、DB / DTO に無い `実行者` を markup / sample data / note から除去する。整合性補正 detail は現実装の見出し + semantic list（商品コード、旧在庫 → 新在庫、差分）として描き、nested table と列見出しを追加しない。`開始日` / `終了日` の `期間` group 化は後続候補として note のみに残し、本 mockup へ先行適用しない。商品一覧の角丸外枠は見た目の肯定所感を記録する一方、runtime では `overflow:hidden` が `<main>` 相対 sticky を壊す D-2 trade-off のため不採用と明記する。
- **S24 home-sales-admin を runtime contract へ戻す**: Home は runtime の 3 summary card、PLU warning / 前日未取込み alert、`毎日の作業` 4 action、`入庫・出庫` 4 action、`その他` を省略せず描く。`在庫切れ` card の非 link な補助文「すぐ確認」と独自 PLU summary card を除去する。action の説明文は owner が肯定した後続候補だが現実装には無いため画面へ描かず note に残す。日次は別置き `TabsHeader`、`DateNavigator` + 部門 filter、runtime の 4 summary（売上合計 / 販売点数 / 売上明細数 / 前日比）、`レジ日報（公式）` の説明・総売上 / 純売上・支払集計・部門別集計、商品明細、右下 `CSV 出力` + disabled `印刷` を保つ。平均単価 / 部門数への置換、tabs / export の filter card 取込み、独自列構成を除去する。前日比は runtime 同様に正負を文言 + 符号 + 色で区別する。月次は別置き `TabsHeader`、月 navigator + mode tabs、公式部門集計の説明「日報取込み済み日の Z005 部門別売上合計です。」と列 `部門 / 数量 / 件数 / 金額`、mode 別 table、右下 ExportBar（CSV active / 印刷 disabled）へ戻す。商品ランキング 1 位 badge は現実装どおり残す。Backup は runtime の `バックアップ設定` / `手動バックアップ` / `バックアップ一覧` / `復元` card、列 `日時 / サイズ / ファイル名 / 操作`、最新 badge、対象日時入り最終 dialog を保ち、保存先や作成 button を PageHeader / 独立帯へ移さない。日時 `YYYY-MM-DD HH:mm` と page subtitle は後続候補として note のみに置く。
- **S25 機能 gap と UI 候補を実装済みに見せない**: 日次 Z001 は `daily_report_summary_lines` に保存されるが、現 `OfficialDailyReportSummary` が公開するのは `gross_amount` / `net_amount` / payment / department のみであることを packet / mockup note に記録し、「Z001 / Z002 / Z005 の全取込み情報を見られる」は別 R3 候補とする。Z004 / 手動販売由来の部門小計を商品明細から別表へ分ける案も後続候補。日次 / 月次の印刷は disabled placeholder で紙面未実装、CSV は実装 + 自動 test 済みだが owner native 出力未確認、と明記する。import-export は current source / function-design に存在する field・状態・操作だけを描き、docs に無い列・識別列固定（import-export は DSR-22 mapping 表の対象外）・他画面への `ListShell` 展開を画面から除去して後続候補へ移す。DSR-22 mapping 表に載る画面（history の記録日時 + 代表商品）の固定列は描画を維持する。forms-a / forms-b も同じ基準で、Lane 2 外の `FormSection` shared 化・入力中 row・識別列固定を描画上の採用案にしない。
- **S26 owner 所感の durable disposition**: 本 packet の L3 run 3 証跡を正本とし、採用 = 現実装の情報構造を尊重、説明文は operator の理解に効く、月次ランキング 1 位 badge / forms-b の amber progress。現状維持 = 日次 / 月次の専用 layout、操作ログ overview + semantic detail、Backup 導線、在庫少列順。後続候補 = action 説明、期間 group、Z001 summary 公開、部門小計分離、日付書式、CSV native 出力確認、印刷要否・紙面設計。明示不採用 = 架空実行者、非 link「すぐ確認」、平均単価、画面固有の意味を壊す共通化、未実装機能を有効 button として描くこと。これらを mockup note と Plans.md Lane 3〜5 申し送りへ同期するが、機能実装は本 Amendment の Non-scope。
- **SC14a（画面 markup、absence / presence）/ SC14b（所感 note、4 区分 + disposition）の doc oracle**: SC14a = 画面 markup に限定した契約: history の `実行者` / nested detail table = 0、home-sales-admin の `すぐ確認` / `平均単価` / summary card としての `部門数` = 0、印刷 control は `aria-disabled="true"` で日次 / 月次各 1・active 印刷 button = 0、import-export の画面 markup に固定列 class なし、runtime 由来の presence（下記）。SC14b = 各 file 末尾 note の契約: 5 file すべてに `今回採用（Lane 2）` / `現実装維持` / `後続候補（本 mockup へ描かない）` / `owner L3 所感` が各 1 以上。`番号付き保留項目` = 0。history の `実行者` / nested detail table = 0、`日時` / `種別` / `概要` / `詳細` と `旧在庫` / `新在庫` / `差分` は各 1 以上。home-sales-admin の `すぐ確認` / `平均単価` / summary card としての `部門数` = 0、`入庫・出庫` / 4 action label / `販売点数` / `売上明細数` / `前日比` / `Z001 / Z002 / Z005` / `日報取込み済み日の Z005 部門別売上合計です。` / `日時`→`サイズ`→`ファイル名` の列順は presence。印刷 control は `aria-disabled="true"` で日次 / 月次各 1、active 印刷 button = 0。import-export の note に `docs に無い列` / `識別列固定` / `ListShell` は後続候補と明記し、画面 markup に固定列 class を付けない。具体的な shell command と件数は Writer の起票時実測で確定して Matrix SC14a / SC14b へ転記し、未実測の数は固定しない。note 側の文言（所感・採否理由）は SC14a の absence 対象語を含んでよい（例: note で「架空の `実行者` は不採用」と書く）ため、SC14a の rg は `<table>` 〜 `</table>` / card markup の範囲、SC14b は末尾 note の範囲に scope を分けて実測する。
- **AC-L3-4 disposition**: run 3 で forced-colors の検索欄 focus・帯境界・入出庫履歴 cell button focus と OS 125% の崩れなしは確認済み。既実装の安全網は保持する。owner の実運用判断により、OS 150%、in-app 特大 × OS 125%、form 150%、forced-colors の再実施を本 PR の残 Human Gate から外す。表示 scale は operator がアプリ内機能を通常必要とした場合に別 cross-screen R3 で扱い、Windows 設定変更を日常手順にしない。**residual risk（明記）**: OS 150% / in-app 特大 1.3 × OS 125% / form 画面 150% は未実測のまま merge するため、その scale で toolbar 枠・sticky 帯 1 行・pager `min-w-20`・入力枠密集の崩れが潜在しうる。緩和 = 実装は rem / em 基準で px 直書きなし（DSR-22 低視力 L3 (b) の実装規約は維持）、`h-10` 帯は `truncate` → ellipsis 化済み、wrapper `w-min min-w-full` で横 overflow 時も帯が追随。検出経路 = Lane 3〜5 の L3 checklist に「特大 × 125%」を 1 回含める（Plans.md 申し送り）+ operator からの実利用報告。DSR-22 `:449` の checklist 文言自体は変更しない（本 PR の Human Gate から外すだけで規範は残す）。
- **S27 Writer 判断点の裁定（月次 summary card / 整合性チェック / 在庫少の基準 の runtime 同期、2026-09-04 Coordinator 追補）**: Writer `abcb9ac` / `d5b298e` の判断点 1（月次の `SummaryCardsBar` を S24 に字面が無いため描かず）と 2（home-sales-admin 内の整合性チェック / 在庫少の基準 画面を対照表外として未点検）は、S22 の原則「runtime の現状を土台にする」に照らし drift として是正する。(a) 月次: runtime `MonthlySalesPage.tsx:105` の `SummaryCardsBar`（`components/SummaryCardsBar.tsx` の label、`月間売上合計` / `月間販売点数` / `前月比` ほか、実 label を source から転記）を mode tabs の直下に描く。(b) 整合性チェック: `IntegrityCheckPage.tsx` の見出し `在庫整合性検証`、実行 button `整合性チェック実行`、確定 button `補正を確定`（`:303`。行 checkbox の label が `補正する` `:364`、dialog 内 button が `補正を実行する` `:429`）、dialog 文言、部分失敗 alert 文言、上部件数表示の有無を source どおりに揃え、mockup の `チェックを実行` / `整合性チェック`（h1）を除去。**訂正（2026-09-04、Coordinator）**: S27 初版は確定 button を `補正する` と誤記し（`:364` の行 label を誤読）、Writer `9922994` は packet 字面を優先して primary button を `補正する` に描いた。runtime 一致を正とし本訂正で `補正を確定` へ戻す（Writer 判断点 1 の裁定、S27 訂正 commit）。(c) 在庫少の基準: `ThresholdSettingsPage.tsx` の descriptor（`requiredLabel` / `unit` / `description` の実値）と alert 文言（`保存できませんでした` + message）を source から転記し、mockup の `生地の基準の保存に失敗しました` 型の部分失敗 alert は runtime に同型が無ければ除去。(d) 月次ランキング帯の `同順位なし前提（BIZ-05 row_number）` は operator 向け画面に内部語彙を出さない runtime に合わせ、note 側へ移す。Spec（SC14a 拡張、Writer 実測転記）: home-sales-admin の画面 markup で `月間売上合計` / `月間販売点数` / `前月比` = 各 ≥ 1、`在庫整合性検証` / `整合性チェック実行` / `補正を確定` / `補正を実行する` = 各 ≥ 1、primary button として `>補正する<` = 0（行 label の `補正する` は残る）、`チェックを実行` / `BIZ-05` = 0（画面 markup 範囲）、在庫少の基準の label が descriptor 実値と一致。
- **Amendment 4 closure round 1 是正（Codex Final Review comment 5534065618、P1 5 / P2 2 / P3 0、全件 accept、2026-09-04 Coordinator 起票、content candidate `e529e05`）**: Coordinator が 7 件すべてを mockup / runtime 実読で再現確認した。P1-1 は Amendment 3 追補 S18（Opus P1-3 起源、history / home-sales-admin / import-export の `.pager.top` 帯化）と Amendment 4 の原則「runtime + Lane 2 差分に限定」の契約矛盾（Coordinator 起草）であり、owner 方針 A を上位として S18 を pilot 以外の file について supersede する。relay は 2/2 を消費済みのため Codex の再 round は無く、是正後の closure は Sonnet 独立 doc oracle + drift spot check + Fable 裁定で閉じる。
  - **S28 後続 Lane の ListShell 表現を 4 file から除去（P1-1）**: `mockup-d-forms-b.html` / `mockup-d-history.html` / `mockup-d-home-sales-admin.html` / `mockup-d-import-export.html` の画面本体から `.pager.top` 帯・sticky 表現を削除し、forms-b `:208` の `id` / `id2` 固定列 class も通常 header へ戻す（DSR-22 mapping 対象 = history の記録日時 + 代表商品 / 在庫変動履歴の日時 + 種別 / 操作ログの日時 + 種別 / 棚卸し は固定列 class を維持、mapping 表は不変）。各末尾 note の ListShell 展開は「後続候補（本 mockup へ描かない）」へ一本化（forms-b `:237` の「今回採用」、import-export `:177` の「現実装維持」を訂正）。`mockup-d-lists.html:87` の pilot 帯は維持。追補 S18 の SC12 oracle（3 file の `class="pager top"` = nested = 3 / 4 / 3、`--d-head` = 1）は本 Amendment で **lists のみ**へ縮小し、3 file は `class="pager top"` = 0 を新期待とする（Matrix SC12 行を更新、history の「件目を表示」= 0 は維持）。
  - **S29 history を runtime contract へ（P1-2）**: `:149` の `期間` group + `並び替え` UI を runtime `InventoryRecordsPage.tsx:150-220` の `記録種別 / 開始日 / 終了日 / SearchBar / 記録ID / 部門 / 状態` へ置換（sort 削除）。`:150` の列は DSR-22 の先頭 2 列（記録日時 + 代表商品）だけ固定列 class を残し、残りを runtime の列（`:298-345`、`金額 / ロス原価` は無い）へ戻す。JS `:200-203` の row click + inline detail + `詳細ページを開く` / `関連 movements を見る` を全削除し、各 row に `詳細を見る` link 1 個（`65-inventory-record-traceability.md:214-215`）。`:163` の `誰がいつ何をしたか` を runtime subtitle `システムの操作履歴を期間・種別で確認します`（`OperationLogsPage.tsx:331`）へ exact 置換。
  - **S30 home-sales-admin の欠落と独自表現（P1-3）**: Home `:175` 直後に `前日分が未取込みです` alert（`HomePage.tsx:79` の文言）を追加。日次 `:211` は上部件数を除去し、商品明細の列を runtime `daily-sales/components/ProductTable.tsx`（商品コード / 商品名 / 部門 / 数量 / 単価 / 金額、部門小計行）へ。Backup `:243` の `… の状態に戻す` を runtime の 選択 card + `この控えに戻す` → `復元の確認へ進む` → dialog `キャンセル` / `{label} の控えに戻す`（`BackupRestorePage.tsx:550,619,657-675`）へ exact 置換。整合性 `:251` を runtime 6 列 `商品コード / 名前 / システム在庫 / 入出庫の合計 / 差異 / 操作`（`IntegrityCheckPage.tsx:311-316`）へ置換し、checkbox と `補正済み` 表示を `操作` cell 内へ戻す（S27 の button 文言は維持）。
  - **S31 import-export の state machine と table / action（P1-4）**: `:144-147` の `結果（前回の取込み）` を preview 画面から削除（runtime は `idle / parsing / preview / importing / result / error` の排他 switch、`DailyReportImportPage.tsx:28-64`。result は別 state として描くなら見出しで分離）。商品 import `:153-158` を runtime `ProductImportPreview.tsx` の 4 summary label + `新規候補 / 重複（行ごとの上書き checkbox）/ エラー` 3 section へ。PLU `:165-173` を runtime `PluExportPage.tsx` の excluded `理由` 列、未反映商品の `売価 / 在庫`、書出し設定、`破棄して再書出し`（`:450,466`）へ置換し、`状態` / `memory No.` 列と `再書出し` を除去。`:177` の sticky header / 件数先出しは「後続候補」へ。
  - **S32 forms-a の入力中 row 除去（P1-5）**: `mockup-d-forms-a.html:274-276,334-339,353` の `cur` row + 左帯 + `入力中` badge を削除し（receiving runtime に `入力中` = 0）、末尾 note の「後続候補（本 mockup へ描かない）」へ理由付きで移す。`mockup-d-lists.html:136` の商品一覧 reference（Lane 2 pilot、DSR-22 現在行 token の消費者は Lane 3〜5）は不変。
  - **S33 SC14a / SC14b の scope と再実行性（P2-1）**: presence も absence も画面本体を `sed -n '/<main>/,/<\/main>/p' file | rg -v 'class="note"'`（`<main>` が無い file は `<body>`〜末尾 note 直前の同等範囲、Writer が実測で範囲 anchor を確定）に通し、末尾 note は `sed -n '/<\/main>/,$p'` 相当の範囲に限定して 4 見出しを各 exactly 1 にする。Matrix `:79` の `rg -c 'a\|b\|c'`（rg では `\|` が literal で常に no-match）を 3 語の `for w in …; do rg -c -F -- "$w"` へ、`:90` の loop は no-match を明示的に `0` 化（`|| echo 0`）。forbidden signature を SC14a absence に追加: `class="pager top"`（lists 以外の 4 file）、`<label>期間 `、`詳細ページを開く`、`関連 movements を見る`、`結果（前回の取込み）`、`memory No.`、receiving の `入力中`、`の状態に戻す`。全 command を実行して exit code と件数を Matrix に転記。
  - **S34 Plans.md の durable handoff を 4 区分へ（P2-2）**: `Plans.md:50 (vi)` を `採用 / 現状維持 / 後続候補 / 明示不採用` の 4 labeled sub-bullet に分け、packet evidence（`rg -n "owner L3 run 3 = FAIL"` 行）の理由（operator 理解に効く説明文、専用 layout / semantic detail の優位、DTO 未公開・native 出力未確認・紙面未設計、架空 field / 誤誘導 / 意味を壊す共通化）まで転記。5 mockup の末尾 note の 4 区分と同じ字面で照合できるようにする。
  - **遷移**: Writer（Sonnet、docs-only、`src` / `src-tauri` 差分 0 維持）→ Sonnet 独立 closure（SC12 / SC14a / SC14b 全 command 再実行 + runtime との drift spot check: Codex が挙げた 7 箇所 + 各 file 1 画面を無作為抽出）→ Fable 裁定 → Coordinator の同乗 commit（Ledger SC14a / SC14b 行 + 結果記入 + Workflow State）→ L3 run 4 は改訂 5 mockup の視認を canonical first action とし、runtime 変更が無いことを SHA diff で示す。
- **Amendment 4 closure round 2 是正（Sonnet 独立 closure、content candidate `fda21da`、P1 1 / P2 3 / P3 3、全件 accept、2026-09-04 Coordinator 起票）**: Codex 指摘 7 件は着地確認済み（Matrix 全 command 一致、DSR-22 mapping 維持、packet 原文一致）。独立 spot check が対照表外の画面で新規 P1 を検出したため是正する。Coordinator が runtime 実読で全件再現（`DailyReportImportPage.tsx:227-238` は `Info` 2 項目で `<table>` 0、`DisposalPage.tsx:346` / `ManualSalePage.tsx:408` の見出し、`:153` の alert 文言）。
  - **S35 import-export 部門別集計を runtime の Info list へ（P1-1）**: `mockup-d-import-export.html:134-135` の 5 列 table（部門コード / 部門名 / 点数 / 売上 / 状態 badge）を、runtime `DailyReportImportPage.tsx:226-238` どおり card 見出し `部門別集計` + `raw_department_name → 金額` の 2 項目 label / value list へ置換（DTO の `department_id` / `quantity` / `count` は未使用 = 画面に無い）。`:144` note の「部門別集計 table に D を適用」「文言を補った」を「runtime は 2 項目 list、5 列 table は後続候補（DTO 未使用 field の可視化は別 R3）」へ書き換え、状態 badge の部門未対応表現も後続候補へ。Spec: 画面本体で `<th>部門コード<` = 0、`<th class="num">点数<` = 0、`部門別集計` ≥ 1。
  - **S36 Matrix command の再実行性（P2-1 / P2-2）**: Matrix `:83`（S31 absence `結果（前回の取込み）` / `memory No.`）に `| rg -v 'class="note"'` scope を付け、`:77`（SC12 4 file absence）の loop を `|| echo 0` 付きに直して 0 件でも `0` を印字させる。両行の実測値を再転記。
  - **S37 Plans.md (vi) を 4 labeled sub-bullet 構造へ（P2-3）**: `Plans.md:50 (vi)` の 1 段落埋め込みを、`採用:` / `現状維持:` / `後続候補:` / `明示不採用:` の 4 つの独立 sub-bullet（各 1 行、理由付き）へ分割。内容は不変。
  - **S38 forms-b 見出しと import-export alert の runtime 同期（P3-1 / P3-2）**: `mockup-d-forms-b.html:154` の `伝票情報` を `販売内容`（`ManualSalePage.tsx:408`）、`:178` の `伝票情報` を `廃棄・破損内容`（`DisposalPage.tsx:346`）へ。`mockup-d-import-export.html:133` の `同じ日の取込みが既にあります。` を `同じ日の取込みがあります`（`DailyReportImportPage.tsx:153`、句点なし）へ exact 置換。Spec: 3 語とも旧 0 / 新 ≥ 1。
  - **記録のみ**: P3-3（forms-a 価格履歴「直近 10 件」は runtime default limit 10 と整合、誤誘導なし）。Sonnet 所感「対照表外の画面を毎 round 1〜2 件無作為抽出する運用」は Lane 3〜5 packet の Test Plan へ申し送り（Plans.md 申し送り (vii) に 1 行）。
  - **遷移**: Writer（Sonnet、docs-only）→ Fable が S35〜S38 の Spec rg と `git diff -- src src-tauri` 空を実読で確認（closure round 3 は doc-only 4 点のため subagent 再発注せず Coordinator 検分で閉じる）→ 同乗 commit → L3 run 4。
- **遷移 / review**: 新規 Plan Review round は設けない（天井 3/3 到達済み、本 Amendment = owner escalation + Fable 裁定）。本 Amendment commit を `Amendments` へ追加する。Writer（Sonnet subagent、worktree）は runtime / src-tauri / bindings に触れず、5 mockup + reference README + packet / Matrix / Plans のみを編集する。doc gate、SC14a / SC14b、`git diff -- src src-tauri` 0 を通し、Codex PR review（relay 2/2、Writer / Coordinator と別 context）が source ↔ mockup drift と owner disposition を監査、Fable が裁定する。post-impl STATECAP は既に上限のため、`implementing -> local-verified -> independent-review -> human-confirm` は Coordinator の結果記入 content commit に同乗する。L3 は revised exact HEAD へ同期後、既 PASS の runtime 変更がないことを SHA diff で確認し、5 mockup の視認を canonical first action とする。

### Gated Amendment 5（owner L3 run 4 起源 + 方針 A、2026-09-04、Coordinator 起票、owner escalation）

owner の run 4 直接フィードバック（Codex を介さない原文、Review Response の evidence 行）を受け、owner は方針 A「mockup 視認を本 PR の Human Gate から外し、Lane 3〜5 は runtime-first（実装して実機で見る）へ切り替える」を明示選択した。理由 = mockup 方式は既存画面の手写しで drift が構造的に出続け（Amendment 4 で 3 round・30 箇所超を直しても run 4 で伝票番号 / toast 色 / リセット button 欠落等が残った）、その間 runtime が進まない。Plan Review round は天井到達済みのため新規 round は設けず、Fable 裁定で確定する。本 Amendment の runtime 変更は商品一覧の帯 1 点のみ。

- **S39 商品一覧の帯: 件数行を page 地色 + 1px 下線へ（owner run 4「灰色の塊に入れ込んだのがミス、角が角、下に線を引く程度」、AC-L3-2 の翻意）**: `ListShell.tsx:95` の summary 帯の `bg-list-head` を `bg-background` に、`forced-colors:border-b` を無条件の `border-b border-border` に置換（常時 1px 下線、forced-colors でも線が残るため S17 の条件付き線は不要）。thead の `[&_thead_th]:bg-list-head` / `[&_thead_tr]:bg-list-head` / `border-b-2` は不変（灰色面は列見出しのみ）。wrapper（`w-min min-w-full`）・`h-10` / `top-10` 結合・`px-2` inset・`overflow-hidden` + `[&>div]:truncate`・横追随は不変（隙間なし・左基準線一致・sticky 動作は run 3 PASS を維持）。Spec: 帯の classList に `bg-background` / `border-b` / `border-border` を含み、`bg-list-head` / `bg-muted` / `forced-colors:border-b` を含まない。root の `[&_thead_th]:bg-list-head` / `[&_thead_tr]:bg-list-head` は維持。test: SC8 を「帯 = `bg-background` + `border-b border-border`、thead = `bg-list-head`」へ、SC10 の `forced-colors:border-b` 期待を `border-b` へ更新（既存 test の削除・skip なし）。Matrix: X19 を「帯の `bg-background` を `bg-list-head` に戻す」、X33 を「帯から `border-b` を削除」へ書き換え（kill = SC8 / SC10）。docs: catalog ⑯ 第 3 項を「件数行（`bg-background` + 1px `--border` 下線）と `thead`（`--list-head` 面 + 2px 下線）を page 地を挟まず垂直に隣接させ、同一 inset で sticky にする。灰色面は列見出しのみ（owner L3 run 4）」へ、00-foundations の `--list-head` 説明を「thead surface」へ、`mockup-d-lists.html` の `.pager.top` を `background:var(--bg);border-bottom:1px solid var(--d-line)` へ（`.tbl` 内配置は維持）。SC12 の lists oracle を `.pager.top{...--d-head}` = 0 / `border-bottom` presence = 1 へ更新。AC-L3-2 の「同一 surface で 1 つの帯」要件を本 Amendment の字面へ差し替え。
- **S40 AC-L3-5 の descope（方針 A）**: mockup 5 file は reference-only とし、視認を本 PR の Human Gate から外す（non-blocking。Amendment 4 の是正結果はそのまま残す）。DSR-22 `:441` 履歴系固定列 mapping の最終確定 evidence は run 3 所感「history は固定列を含む現実装を維持」+ run 4 で異論なし（history 未着手だが mapping への異議は無し）で足りると裁定し、暫定文言の撤去は従来計画どおり L3 run 5 PASS 後の docs commit（`human-confirm -> ready-hosted-final` の同乗 vehicle）で行う。AC-L3-5 と Human Gate 行を書き換え。
- **S41 owner 反応 ledger の Plans.md 転記（runtime backlog 化）**: run 1〜4 の owner コメント（PR #32 comment 5526295095 / 5527090250 / run 3 evidence / run 4 原文）から「こうしようよ」を拾った ledger（Coordinator が Sonnet 収集 draft を裁定した scratch 正本、5 分類 = runtime 是正（この PR）/ runtime backlog（Lane 3〜5）/ runtime bug / mockup のみ記録 / 採用済み・肯定）を `Plans.md` の Lane 3〜5 申し送りに新 sub-bullet「owner 反応 ledger（run 1〜4、原文優先、runtime-first の入力）」として転記する。runtime bug（入庫画面の unit code `pcs` が表示に漏れる、`format-stock-display.ts` の変換が入庫に未適用）は独立 backlog 行にする。肯定項目（保存結果の緑 icon、レジ戻し badge、CSV 取込み反映 badge の色、レシート画像「任意」、原価差分の見やすさ）は「維持」として残す。mockup のみの反応は Plans.md に書かず ledger scratch と packet evidence に留める。
- **S42 runtime-first の durable decision**: `docs/decision-log.md` に新番号で「既存画面の視覚整えは runtime-first（実装 → 実機 L3-lite 反復、closure では対照表外の画面を 1〜2 件無作為抽出）。standalone HTML mockup は新規 layout・未実装画面にのみ使い、既存画面の手写しは行わない」を登録（Why = PR #32 Amendment 4 の drift 実測と owner 総評、Impact = Lane 3〜5 packet の Test Plan / Human Gate 設計、AGENT_OPERATING_MANUAL の Writer 割当ては不変）。Plans.md ④ の Lane 3〜5 行に同 decision を 1 行で参照。
- **Matrix**: SC8 / SC10 / SC12 更新、X19 / X33 書き換え。AC10 = X1〜X34（番号不変）。
- **AC-L3 更新**: AC-L3-2 の帯要件を S39 の字面へ。AC-L3-5 を S40 の字面へ。L3 run 5 = 商品一覧の帯 1 点（縦 scroll で件数行が地色 + 下線、列見出しだけ灰色、隙間なし、sticky 維持）のみ。run 1〜4 の PASS 項目は再確認不要。
- **遷移**: Writer（Sonnet、worktree、runtime code + test + docs + mockup-d-lists + Plans.md + decision-log）→ Sonnet 独立 closure（X19 / X33 新注入 + X21 / X22 / X29 / X31 / X32 再測、SC12 lists oracle、`git diff -- src` が ListShell.tsx + test のみ）→ Fable 裁定 → 同乗 commit（Ledger S39〜S42 行 + 結果記入 + Workflow State）→ L3 run 5 → PASS で DSR-22 `:441` 確定 docs commit に `human-confirm -> ready-hosted-final` 同乗 → Ready → hosted final → 承認の一言（介入 3/3）→ merge。

### Gated Amendment 6（owner L3 run 5 PASS + 追加要望・bug 起源、2026-09-04、Coordinator 起票、owner escalation）

run 5 の帯は PASS。owner 原文の追加要望 2 点と、同画面で見つかった unit code 生表示 bug を束ねる（owner「まとめてできるならやってしまおう」）。Plan Review round は天井到達済みのため Fable 裁定で確定。runtime 変更は ListShell の角丸 / 操作面 token / 単位表示 helper の 3 点。

- **S43 列見出しの左右上を角丸に**: `ListShell.tsx` の `STICKY_TABLE_CLASSES` に `[&_thead_th:first-child]:rounded-tl-md` / `[&_thead_th:last-child]:rounded-tr-md` を追加し、`[&_thead_tr]:bg-list-head`（Amendment 2 S11 の左右端揃え保険）を削除する（tr 背景は角丸が効かず角の外側に灰色が四角く覗くため。border-separate + spacing 0 では th だけで端まで埋まる）。th の `bg-list-head` / `border-b-2` / sticky / `top-10` は不変。Spec: root classList に `[&_thead_th:first-child]:rounded-tl-md` と `[&_thead_th:last-child]:rounded-tr-md` を含み `[&_thead_tr]:bg-list-head` を含まない（SC4d / SC8 更新、既存の tr 期待 assertion は書き換え）。Matrix X35「角丸 2 class を削除」、X36「`[&_thead_tr]:bg-list-head` を復活」。docs: catalog ⑯ 第 3 項に「列見出し面の左右上は `rounded-md`（owner run 5）」、mockup-d-lists の `th:first-child` / `th:last-child` に `border-top-left-radius` / `border-top-right-radius: 6px`。
- **S44 入力欄・ドロップダウンの面を白に（owner run 2 所感の要望化）**: 新 token `--control-surface: #ffffff` を `globals.css` `:root` + `@theme inline`（`--color-control-surface`）に追加し 00-foundations 表へ「操作面 / `--control-surface` / white / #ffffff / 対 `--card` 1.04:1・対 `--background` 1.02:1（面の差で操作対象を示す。枠 3:1 の要件は `--border-strong` 据え置き）」を登録（DS3 対象）。`input.tsx:11` と `select.tsx:34`（SelectTrigger）の `bg-transparent` を `bg-control-surface` へ（`dark:bg-input/30` 系は不変）。textarea component が存在すれば同様（`fd textarea src/components/ui`）。Spec（SC15、fs literal）: `rg -c -F '--control-surface: #ffffff' src/styles/globals.css` = 1、`rg -c -F 'bg-control-surface' src/components/ui/input.tsx src/components/ui/select.tsx` = 各 1、両 file で `bg-transparent` = 0（SelectContent 等の別要素に `bg-transparent` が残る場合は行番号で限定）。Matrix X37「input.tsx の `bg-control-surface` を `bg-transparent` に戻す」（kill = SC15）。docs: DSR-22 `:443` の token 列挙に `--control-surface` を追加、catalog ⑯ 第 1 項の「箱と帯が同色」記録済み逸脱に「操作面は白（S44）で箱 #f5f5f4 と区別」を追記、mockup-d-lists の `input` / `.ctl` は既に `#fff`（同期不要、確認のみ）。全画面波及の residual risk: L3 は商品一覧のみ、他画面の入力欄は Lane 3〜5 の実機で確認（Plans.md 申し送りに 1 行）。
- **S45 unit code 生表示の sweep（owner run 5 bug、ledger #13 の拡張）**: `src/features/stock-inquiry/lib/format-stock-display.ts` に `formatStockUnitLabel(unit): string`（`pcs` → `個`、`cm` → `cm`、他 → `—`）を追加し、`ProductTable.tsx:69` を `formatStockDisplay(item.stock_quantity, item.stock_unit)`（「18 個」）へ、`ReceivingPage.tsx:557` / `DisposalPage.tsx:584` / `ReturnExchangePage.tsx:866` の `{row.stockUnit}` を `formatStockUnitLabel(row.stockUnit)` へ。`ManualSalePage.tsx:589` 付近の単位列も同型なら同様（Writer が sweep: `rg -n "\{row\.stockUnit\}|\{item\.stock_unit\}|\} \{item\.stock_unit\}" src --glob '*.tsx'` の全 hit）。Spec（SC16）: ProductTable の render test で fixture `stock_quantity: 18, stock_unit: "pcs"` が「18 個」を表示し `pcs` を含まない、`formatStockUnitLabel` の unit test 3 分岐、fs literal で `rg -c '\{row\.stockUnit\}' src --glob '*.tsx'` = 0。Matrix X38「ProductTable を `{quantity} {stock_unit}` の生連結に戻す」、X39「`formatStockUnitLabel` の `pcs` 分岐を `pcs` 返却へ」。既存 test（ProductTable / Receiving 等）が `pcs` 文字列を期待していれば新表示へ更新（削除・skip なし）。docs: 58-ui-stock-inquiry §58.6 の helper 説明に `formatStockUnitLabel` を追記、Plans.md ledger の `pcs` 行を「本 PR Amendment 6 S45 で是正」へ。
- **Matrix**: SC15 / SC16 新設、SC4d / SC8 更新、X35〜X39。AC10 = X1〜X39。
- **AC-L3 更新**: AC-L3-2 に「列見出し面の左右上が丸い」を追加。AC-L3-1 に「商品一覧の検索欄と Select の面が白く、toolbar 箱 #f5f5f4 と区別できる」を追加。AC-L3-6 相当として「商品一覧の在庫数が『18 個』表示で `pcs` が出ない」を AC-L3-3 末尾に追加。L3 run 6 = この 3 点のみ。
- **遷移**: Writer（Sonnet、worktree、TDD）→ Sonnet 独立 closure（X35〜X39 新注入 + X19 / X33 / X21 / X31 再測、SC15 / SC16、`git diff -- src` の file 集合が Spec どおり）→ Fable 裁定 → 同乗 commit（Ledger S43〜S45 行 + 結果記入 + Workflow State）→ L3 run 6（3 点）→ PASS で DSR-22 `:441` 確定 docs commit に `human-confirm -> ready-hosted-final` 同乗 → Ready → merge。

## Non-scope

- 商品一覧以外 7 画面の ListShell 化・perPage `Select`・既定値変更（Lane 3〜5）。
- backend `MAX_PER_PAGE` の引き上げ（Rust + docs 21 / 24 / 32、Lane 3〜5 の履歴系 lane で Codex 発注）。
- 識別列固定の描画実装、現在行 3 点（`bg-row-current` + 左バー + badge）の各画面適用、棚卸し header A'+器 / 完了画面 C、outline ボタン / Badge / chip / SegmentedControl 枠の `--border-strong` 化 sweep（例外 = SearchBar 検索ボタン 1 箇所は本 lane、D-7）、表の外枠（D-2）。
- dark mode token、E2E / visual regression の再評価（④ 完了時、UI_TECH_STACK §7.2）。
- decision-log の新規 D 採番（座組は D-079 の Impact 条項で足り、設計判断は本 packet と DSR-22 / catalog 追記で正本化する。Plan Review が D 化を求めた場合のみ追加）。

## Acceptance Criteria

- AC1（S1）: `rg -n -- "--border-strong: #8a8480|--row-current: #fff8e6|--border: #cdc8c4|--input: var\(--border-strong\)" src/styles/globals.css` = 4 hit、`rg -n -- "--color-border-strong|--color-row-current" src/styles/globals.css` = 2 hit。`rg -c "border-strong" docs/design-system/00-foundations.md` ≥ 1、`rg -c "#e7e5e4" docs/design-system/00-foundations.md` = 0、`rg -c "1\.66:1" docs/design-system/00-foundations.md docs/design-system/reference/2026-08-23-current-design-analysis.md` = 0（reference `:19` の「#e7e5e4」は現状問題の歴史記述として残す、Opus round 2 P2-4）。`SC1` green。
- AC2（S2）: `rg -n --glob '*Page.tsx' --glob '!*.test.tsx' 'className="[^"]*\bp-6\b' src/features` の hit が非 root 2 箇所（card / overlay）のみ。file 数 `rg -l "<PageShell" src/features --glob '!*.test.tsx' | wc -l` = 28、箇所数 `rg -c "<PageShell" src/features --glob '!*.test.tsx' | awk -F: '{s+=$2} END{print s}'` = 43（機械抽出表と突合）。`SC2a` / `SC2b` green。
- AC3（S3）: `rg -n "件中 [0-9,]+〜[0-9,]+ 件目 · " src --glob '*.test.tsx'` ≥ 4 file、旧形 `rg -n '件中 [0-9]+ / [0-9]+ ページ"' src --glob '*.test.tsx'` = 0、旧 path `rg -n "features/products/components/ProductPagination|<ProductPagination" src docs/design-system` = 0、`rg -n "ProductPagination" docs/function-design docs/FUNCTION_DESIGN.md docs/design-system --glob '!**/2026-08-23-current-design-analysis.md' | rg -v "旧"` = 0（Gated Amendment 1）。`SC3a` / `SC3b` / `SC3c` green。
- AC4（S4）: `SC4a`〜`SC4e` green。`rg -n "identityColumns" src/components/patterns/ListShell.tsx` ≥ 1 かつ描画分岐なし（Review Focus で確認）。`rg -n 'from "@/features' src/components/patterns --glob '!*.test.tsx'` = 0。
- AC5（S5）: `SC5a` / `SC5b` / `SC5c` green、`StocktakePage.test.tsx` の `per_page: 50` 期待は無変更（`git diff --stat -- src/features/stocktake/StocktakePage.test.tsx` = 0 行）。
- AC-L3-1（S2 / D-7、render oracle）: 旧 root 3 系統から 1 画面ずつ（`space-y-4` 系 = 入庫、`space-y-5` 系 = Writer が機械抽出表から 1 画面指定、`min-h-screen` 系 = 棚卸しカウント）+ ホームを開き、section 間余白が揃っていること、構造線（表罫線 / card 枠）と入力 / Select の枠が「入力枠の方が濃い」階層で見えること、確認 dialog を 1 つ開いて枠が主張しすぎないこと、sidebar 右端の境界線が主張しすぎないこと、商品一覧の検索欄と検索ボタンの枠の濃さが揃って見えること、SegmentedControl（商品一覧の 2 個）が群枠により操作群として認識できること（Gated Amendment 2 S9）、商品一覧の検索欄と Select の面が白く toolbar 箱 #f5f5f4 と区別できること（Gated Amendment 6 S44）を owner が判定。否の場合は D-7 の可逆 amendment。
- AC-L3-2（S4 / S5、render oracle）: 商品一覧で perPage 100 の一覧を縦 scroll し、上部の「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」text（ボタンなし）と table header が 1 つの帯として `<main>` の上端に留まり続けること、scroll 中も現在位置 text が読めること、帯と行の境界線（th 下端 2px）も行間の区切り線（td 下端 1px）も消えないこと、件数行が page 地色 + 1px `--border` 下線、列見出しだけが `--list-head` 面で、両者が page 地を挟まず隣接して見えること（Gated Amendment 5 S39、owner run 4 で「同一 surface の 1 つの帯」を撤回）、列見出し面の左右上が `rounded-md` で丸いこと（Gated Amendment 6 S43）、toolbar が card 地色の 1 枚の枠に 2 段で入っていること、下部に同文言 + 前へ / 次へがあることを確認。toolbar 箱 #f5f5f4 / sticky 帯 #e7e5e4 / ページ地 #fafaf9 の 3 段の明度差（1.04:1 / 1.15:1 / 1.20:1）が弱すぎないか。否なら Gated Amendment で `--card` #fff を検討（Final Review round 1 P1-1）。帯の文言が末尾まで読めるか（125% / 150%）。横スクロールしたとき上部帯が消えないか（消えるなら Probe 2 の Gated Amendment 経路 = pilot の `stickyHeader` false）。summary 帯と th の間に page 地の隙間が無く、summary 文言の左端が 1 列目の列名の左端と揃い、通常位置と sticky 位置で帯の見え方が変わらないこと、横スクロールを発生させたとき summary 帯の背景が thead と同じ右端まで続くこと（追補 S17 の wrapper `w-min min-w-full`。切れるなら pilot `stickyHeader` false の Gated Amendment 経路）、125% / 150% で帯文言が溢れるとき末尾が「…」で切れて hard clip にならないこと、切れた分（{p} / {t} ページ）が下部 `Pagination` で読めること（追補 S17、Opus closure round 2 P3-3）（Gated Amendment 3 S13 / 追補 S17）。
- AC-L3-3（S5、route/search state）: 商品一覧を URL 指定なしで開くと 100 件表示、`?perPage=50` 付きで開くと 50 件であることを確認（Tauri native に address bar が無いため、表示件数 Select を 50 にして 50 件になることを等価手順とする、Opus closure P3-2）。在庫数列が「18 個」形式で `pcs` が出ないこと（Gated Amendment 6 S45）（`returnTo` 往復の perPage 保持は SC5c で自動検証、L3 対象外）。
- AC-L3-4（Gated Amendment 4 disposition）: owner L3 run 3 の forced-colors（商品一覧の検索欄 focus / sticky 帯境界、入出庫履歴 cell button focus）と OS 125% の崩れなしを PASS evidence とする。`globals.css` の安全網は維持し、OS 150% / in-app 特大 × OS 125% / form 150% / forced-colors の再実施は本 PR の残 Human Gate に含めない。residual risk = その scale での崩れが未検出のまま merge される（緩和・検出経路は Scope の Amendment 4「AC-L3-4 disposition」に明記、Plans.md Lane 3〜5 申し送りへ同期）。
- AC-L3-5（Gated Amendment 5 S40 で descope、non-blocking）: `docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html` は reference-only。owner の視認は本 PR の Human Gate に含めない（run 4 の forms-a 所感は Plans.md ledger へ転記済み、残 4 file は任意）。DSR-22 `:441` 履歴系固定列 mapping の最終確定 evidence = run 3 所感 + run 4 で異議なし。
- AC-L3-6（Gated Amendment 2 S10 / S12 + Gated Amendment 3 S14、render oracle）: 商品一覧の PLU 一括操作 caption が title と説明文の左寄せ 2 段で、実件数入りの文として作用範囲（他ページ含む）と確認画面が開くことが押す前に分かり、dialog title が「絞り込みに一致する商品を…」で caption と矛盾しないこと。`PLU 対象から外す` を押して dialog を cancel で閉じたとき、閉じる途中に「PLU対象にしますか」系の反対文言が出ないこと。
- AC6（S6）: `rg -c "Lane 2 で新設予定|Lane 2 移行対象|Lane 2 で globals.css" docs/design-system/*.md` = 0、`rg -c "src/components/patterns/ListShell.tsx" docs/design-system/02-component-catalog.md` ≥ 1、`rg -c "src/components/patterns/Pagination.tsx" docs/design-system/02-component-catalog.md` ≥ 1、`rg -c "rounded-lg border bg-card p-4" docs/design-system/04-backbone.md docs/design-system/02-component-catalog.md` ≥ 2、`rg -c "DSR-01〜22" docs/UI_TECH_STACK.md` ≥ 1 かつ `rg -c "DSR-01〜13" docs/UI_TECH_STACK.md` = 0、`rg -c "PageShell|ListShell|Pagination" docs/function-design/59-ui-shared-patterns.md` ≥ 3。
- AC7（S7）: `fd -I 'mockup-d-' docs/design-system/reference` = 7 file、`rg -c "mockup-d-" docs/design-system/reference/README.md` ≥ 7、`rg -c "本 PR では追加しない" docs/design-system/reference/README.md` = 0、各 file に外部資源参照なし（`rg -n 'https?://' <file>` = 0）、`rg -c "space-y-6|border-strong" docs/design-system/reference/mockup-d-forms-a.html` ≥ 2、`rg -c "記録日時|代表商品" docs/design-system/reference/mockup-d-history.html` ≥ 2。
- AC8（S8）: `rg -c "MAX_PER_PAGE" docs/Plans.md` ≥ 1、`Plans.md:93` 相当の UI_TECH_STACK stale 行が消化済み表記。
- AC9（gate）: `bash scripts/doc-consistency-check.sh` ERROR 0（DS1 / DS3 の実在件数増を記録）、`bash scripts/doc-consistency-check.sh --target plan`、`npm run typecheck` / `npm run lint` / `npm run test` / `npm run format:check` / `npm run build` clean、`cd src-tauri && cargo run --bin generate_traceability -- --check` clean（T1 = 90-traceability.md の再生成 commit を含む、T4 = 新規 test の `UI-01a` 紐付けで baseline 22 のまま、Gated Amendment 1）、`git diff --stat -- src/lib/bindings.ts src-tauri` = 0 行。
- AC10（mutation）: Matrix「必須 mutation 注入」X1〜X39 を Final Review で Sonnet subagent（隔離 worktree、clean tree）が `npm run test` で独立再実測し全 kill（survivor 0、Gated Amendment 2 で X17〜X20、Gated Amendment 3 で X21〜X29、追補で X30〜X34、Gated Amendment 6 で X35〜X39 追加）。

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
| accessibility | sticky 帯に `bg-list-head` 必須（透過で行が透ける）、`border-separate` 下で th / td の cell 罫線が境界線を残す、forced-colors で枠が消えない、summary の重複読み上げは記録 | AC-L3-2 / AC-L3-4 |
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
| Gated Amendment 2 S9 SegmentedControl 群枠 | segmented-control.tsx | SC6 | AC-L3-1 (f) |
| Gated Amendment 2 S10 / Amendment 3 S14 PLU caption + dialog title | ProductListPage.tsx / PluBulkTargetConfirmDialog.tsx | SC7 / SC11 | AC-L3-6 |
| Gated Amendment 2 S11 / Amendment 3 S13 / 追補 S17 sticky 帯（surface・隣接・inset・横追随・ellipsis・forced-colors 線） | ListShell.tsx / globals.css | SC8 / SC10 | AC-L3-2 / AC-L3-4 |
| Gated Amendment 2 S12 dialog target 保持 | ProductListPage.tsx | SC9 | AC-L3-6 |
| Amendment 3 S15 / 追補 S18 / S19 / S21 doc 同期（mockup 4 file・catalog ⑯・文言表・00-foundations） | docs/design-system, docs/function-design | SC12（doc oracle） | AC-L3-5 |
| 追補 S16 forced-colors focus indicator | globals.css | SC13 | AC-L3-4 |
| Amendment 4 S22〜S32 mockup 5 file の画面 markup（runtime + Lane 2 差分に限定、DSR-22 mapping 対象のみ固定列） | docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html | SC14a（doc oracle、画面本体範囲） | AC-L3-5 |
| Amendment 4 S22 / S26 / S34 末尾 note 4 区分 + Plans.md 4 区分 handoff | 同 5 file + docs/Plans.md | SC14b（doc oracle、末尾 note 範囲） | AC-L3-5 |
| Amendment 4 S28（追補 S18 の supersede）lists pilot のみ帯化 | mockup-d-lists.html + 4 file | SC12（縮小） | AC-L3-5（descope） |
| Amendment 5 S39 件数行 `bg-background` + 1px 下線、灰色面は thead のみ | ListShell.tsx / catalog ⑯ / 00-foundations / mockup-d-lists.html | SC8 / SC10 / SC12（更新）、X19 / X33 | AC-L3-2（run 5 = 帯 1 点） |
| Amendment 5 S40 AC-L3-5 descope（mockup は reference-only） | reference/README.md | — | AC-L3-5（non-blocking） |
| Amendment 5 S41 owner 反応 ledger の Plans.md 転記（runtime backlog 9 + 維持 1） | docs/Plans.md | doc oracle（bullet 数 10） | — |
| Amendment 5 S42 runtime-first（D-080） | docs/decision-log.md / Plans.md ④ | doc oracle（`^## D-080` = 1） | — |
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
- `ListShell` は toolbar を `rounded-lg border bg-card p-4` の枠に描画し（`toolbar` 省略時は枠なし）、`pagination.totalCount > 0` かつ `topSummary` のときだけ `PaginationSummary` を table の上に描画し、`pagination.totalCount > 0` のとき table の下に `Pagination` を描画し、`isLoading` のとき children の代わりに skeleton（既定 `ListSkeleton`）を描画する。`stickyHeader` のとき、ListShell root の descendant variant のみで（caller に className を渡さない）summary を `sticky top-0 z-20 flex h-10 w-full items-center truncate bg-list-head` の帯、`th` を `sticky z-10 bg-list-head border-b-2 border-border` + `tr` を `bg-list-head` + summary 帯を描画するときのみ `top-10`（それ以外は `top-0`）、tbody の `td` を `border-b border-border`（最終行 `border-b-0`）、table を `border-separate border-spacing-0`、table-container の overflow を visible に上書きする。表の外枠は描画しない。`identityColumns` は描画に影響しない。
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

### S2 before/after（機械抽出、`rg -n --glob '*Page.tsx' --glob '!*.test.tsx' 'className="[^"]*\bp-6\b[^"]*"' src/features | sort`）

before（HEAD `9d11287`、45 hit）:

```
src/features/backup-restore/BackupRestorePage.tsx:333:    <div className="min-h-screen space-y-6 p-6">
src/features/csv-import/CsvImportPage.tsx:40:    <div className="min-h-screen space-y-6 p-6">
src/features/daily-sales/DailySalesPage.tsx:76:    <div className="min-h-screen space-y-6 p-6">
src/features/disposal/DisposalPage.tsx:274:    <div className="space-y-5 p-6">
src/features/home/HomePage.tsx:61:    <div className="min-h-screen space-y-6 p-6">
src/features/integrity-check/IntegrityCheckPage.tsx:183:    <div className="relative min-h-screen space-y-6 p-6">
src/features/integrity-check/IntegrityCheckPage.tsx:438:          className="absolute inset-0 z-40 flex items-center justify-center bg-background/85 p-6 backdrop-blur-[1px]"
src/features/integrity-check/IntegrityCheckPage.tsx:440:          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-center shadow-lg">
src/features/inventory-records/CsvImportRecordDetailPage.tsx:104:    <div className="space-y-5 p-6">
src/features/inventory-records/CsvImportRecordDetailPage.tsx:70:      <div className="space-y-4 p-6">
src/features/inventory-records/CsvImportRecordDetailPage.tsx:80:      <div className="space-y-4 p-6">
src/features/inventory-records/DisposalRecordDetailPage.tsx:62:      <div className="space-y-4 p-6">
src/features/inventory-records/DisposalRecordDetailPage.tsx:72:      <div className="space-y-4 p-6">
src/features/inventory-records/DisposalRecordDetailPage.tsx:94:    <div className="space-y-5 p-6">
src/features/inventory-records/InventoryRecordsPage.tsx:143:    <div className="space-y-5 p-6">
src/features/inventory-records/ManualSaleRecordDetailPage.tsx:64:      <div className="space-y-4 p-6">
src/features/inventory-records/ManualSaleRecordDetailPage.tsx:74:      <div className="space-y-4 p-6">
src/features/inventory-records/ManualSaleRecordDetailPage.tsx:96:    <div className="space-y-5 p-6">
src/features/inventory-records/ReceivingRecordDetailPage.tsx:56:      <div className="space-y-4 p-6">
src/features/inventory-records/ReceivingRecordDetailPage.tsx:66:      <div className="space-y-4 p-6">
src/features/inventory-records/ReceivingRecordDetailPage.tsx:88:    <div className="space-y-5 p-6">
src/features/inventory-records/ReturnRecordDetailPage.tsx:111:    <div className="space-y-5 p-6">
src/features/inventory-records/ReturnRecordDetailPage.tsx:79:      <div className="space-y-4 p-6">
src/features/inventory-records/ReturnRecordDetailPage.tsx:89:      <div className="space-y-4 p-6">
src/features/inventory-records/StocktakeRecordDetailPage.tsx:106:    <div className="space-y-5 p-6">
src/features/inventory-records/StocktakeRecordDetailPage.tsx:72:      <div className="space-y-4 p-6">
src/features/inventory-records/StocktakeRecordDetailPage.tsx:82:      <div className="space-y-4 p-6">
src/features/manual-sale/ManualSalePage.tsx:299:    <div className="space-y-5 p-6">
src/features/monthly-sales/MonthlySalesPage.tsx:75:    <div className="min-h-screen space-y-6 p-6">
src/features/operation-logs/OperationLogsPage.tsx:329:    <div className="space-y-5 p-6">
src/features/plu-export/PluExportPage.tsx:358:    <div className="space-y-5 p-6">
src/features/products/PriceRevisionPage.tsx:45:    <div className="space-y-4 p-6">
src/features/products/ProductFormPage.tsx:189:      <div className="space-y-4 p-6">
src/features/products/ProductFormPage.tsx:198:      <div className="space-y-4 p-6">
src/features/products/ProductFormPage.tsx:218:    <div className="space-y-4 p-6">
src/features/products/ProductImportPage.tsx:18:    <div className="space-y-4 p-6">
src/features/products/ProductListPage.tsx:90:    <div className="space-y-4 p-6">
src/features/receiving/ReceivingPage.tsx:276:    <div className="space-y-5 p-6">
src/features/return-exchange/ReturnExchangePage.tsx:407:    <div className="space-y-5 p-6">
src/features/stock-inquiry/StockInquiryPage.tsx:87:    <div className="space-y-4 p-6">
src/features/stock-movements/StockMovementsPage.tsx:72:    <div className="space-y-4 p-6">
src/features/stocktake/StocktakePage.tsx:215:    <div className="min-h-screen space-y-6 p-6">
src/features/stocktake/StocktakePage.tsx:926:    <div className="min-h-screen space-y-6 p-6">
src/features/suppliers/SupplierManagementPage.tsx:33:    <div className="space-y-4 p-6">
src/features/threshold-settings/ThresholdSettingsPage.tsx:183:    <div className="min-h-screen space-y-6 p-6">
```

after（本 commit、2 hit = 非 root の card / overlay のみ、残存許容）:

```
src/features/integrity-check/IntegrityCheckPage.tsx:439:          className="absolute inset-0 z-40 flex items-center justify-center bg-background/85 p-6 backdrop-blur-[1px]"
src/features/integrity-check/IntegrityCheckPage.tsx:441:          <div className="w-full max-w-md space-y-4 rounded-lg border bg-card p-6 text-center shadow-lg">
```

file 数 `rg -l "<PageShell" src/features --glob '!*.test.tsx' | wc -l` = 28、箇所数 `rg -c "<PageShell" src/features --glob '!*.test.tsx' | awk -F: '{s+=$2} END{print s}'` = 43（AC2 一致）。

### Probe 1（S2、`min-h-screen` 依存、実装前確認）

9 root（8 file + StocktakePage の 2 root）を `rg -n "min-h-screen|sticky bottom|absolute inset|sticky top|fixed "` で確認。footer 固定・中央寄せへの依存は 0 件。唯一の依存は `IntegrityCheckPage.tsx:438` の `absolute inset-0`（補正確認オーバーレイ）で、その祖先 root（`:183`）に `relative` が必要。→ `PageShell` 本体には `min-h-screen` を入れず、`IntegrityCheckPage` のみ `className="relative"` で補った（実装済み）。

### Probe 2（S4、overflow 上書き、商品一覧 perPage 200 + 最長商品名）

**計測不能**。理由: worktree の `node_modules` に Playwright/Puppeteer 等のブラウザ計測ツールが存在せず（`ls node_modules/.bin | grep -i playwright` = 0 件）、Writer 実行環境（sandboxed agent、GUI ブラウザなし）から実ブラウザでの幅計測ができない。`npm run dev`（Vite 単体）の起動自体は確認済み（正常起動、`VITE ready`）だが、Tauri command が mock されないため画面は空になり描画確認も伴わない。

代替として静的構造分析を行った: `ProductTable.tsx` の商品名列は既に `min-w-[14rem] whitespace-normal`（可変長テキストの折り返し設定）を持ち、他列（商品コード・部門・数量系・PLU バッジ）は固定長コンテンツで無制限幅にならない。`table.tsx` 既定の `TableCell` は `whitespace-nowrap` だが商品名列はこれを上書き済み。したがって perPage 200 + 最長商品名でも table が `<main>` 幅を超えて水平 overflow する可能性は低いと推測されるが、これは実測ではない。**Coordinator 確認事項**: AC-L3-2 の Windows native L3 実測で足りるか、別途ブラウザ計測環境を用意して Probe 2 を独立再実行するか判断を仰ぐ。実測できないまま `stickyHeader` を pilot で有効のまま実装した（D-2 の記載どおり、overflow 実発生の証拠が無い段階では方式を固定しない前提を維持）。

### Probe 3（S3、0 件表示、8 caller）

8 caller（Stocktake / InventoryRecords / OperationLogs / IntegrityCheck / PriceRevision / StockInquiry / StockMovements、および移設前の商品一覧）すべてで `items.length === 0` 分岐が `Pagination` の代わりに `EmptyState`（または同等の空表示）を描画しており、`Pagination` が `totalCount === 0` で呼ばれる実行パスは存在しない（8 file を `rg` で確認）。D-3 の「0 件」契約は 8 caller の実運用では発火せず、`Pagination` 単体 test（SC3b）でのみ検証される。pilot（`ListShell` 経由の商品一覧）も D-5 の `totalCount > 0` gating により 0 件時は上下とも非描画で、こちらも「0 件」文言のパスを通らない（SC5b で確認済み）。

### DS1 / DS3 実在件数（before/after、`doc-consistency-check.sh` 実測）

- DS1（design-system docs 内 `src/` path 実在）: baseline（HEAD `9d11287`）38 件 → 本 commit 40 件（+2、`Pagination.tsx` / `ListShell.tsx` の canonical path 追加）
- DS3（token HEX 整合、00-foundations ↔ globals.css）: baseline 21 件 → 本 commit 23 件（+2、`--border-strong` / `--row-current` の正式登録）

### AC9 gate 結果まとめ

| gate | 結果 |
|---|---|
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run test` | pass（160 file / 1226 test） |
| `npm run format:check` | pass（`npm run format` を 1 回適用後） |
| `npm run build` | pass |
| `bash scripts/doc-consistency-check.sh` | ERROR 0（WARN 5、いずれも本 lane 起因ではない pre-existing） |
| `bash scripts/doc-consistency-check.sh --target plan` | pass |
| `git diff --stat 9d11287 -- src/lib/bindings.ts src-tauri` | 空（0 行） |
| `cd src-tauri && cargo run --bin generate_traceability -- --check` | 初回 **FAIL**（T1/T4）→ Gated Amendment 1 対応後 **pass**（ERROR 0 / WARN 0、詳細下記） |

### 未解決事項（Coordinator 判断待ち）

**generate_traceability T1/T4 と src-tauri 不可侵の衝突**: 本 lane で新設した shared component の contract test 4 file のうち、`PageShell.test.tsx` / `src/styles/globals.test.ts` / `src/test/page-root-pageshell-sweep.test.ts` の 3 file は REQ-nnn / UI-nn を持たない。これは既存の `PageHeader.test.tsx` 等 5 file と同型の「画面非依存の共通部品」で、`generate_traceability.rs:40-42` のコメントが明記する意図的除外パターンに合致する。4 file 目 `ListShell.test.tsx` は唯一の実採用画面が UI-01a（商品一覧 pilot）であることを header comment に明記し、baseline 差分を 4→3 へ縮小した（`8a4d07e`〜本 commit 群で反映済み）。

残り 3 file 分は `FE_UNREFERENCED_BASELINE`（`src-tauri/src/bin/generate_traceability.rs:43`）を 22→25 へ更新して再生成（`docs/function-design/90-traceability.md` の T1 drift も同時に解消）しない限り `--check` が通らない。しかしこの定数は `src-tauri/**` 配下にあり、発注書の「変更禁止: ... `src-tauri/**` と `src/lib/bindings.ts`」および AC9 の `git diff --stat -- src/lib/bindings.ts src-tauri` = 0 行と直接衝突する。

contract を独断で変更しない方針に従い、**src-tauri 配下は未変更のまま stop した**（`git diff --stat 9d11287 -- src-tauri` は空のまま）。Coordinator 判断選択肢:

(a) 本 lane に限り `FE_UNREFERENCED_BASELINE` 22→25 の 1 行更新 + `90-traceability.md` 再生成を Gated Amendment として許可する（範囲: baseline 定数と生成物のみ、他の src-tauri ロジック変更なし）。
(b) 4 file の一部を既存の REQ/UI 参照済み test file へ統合し、新規 unreferenced file 数を増やさない設計に作り直す（TDD 構造・可読性は低下する）。
(c) T4 failure を記録したまま Final Review（Codex）へ引き継ぎ、Codex 側の判断・権限で src-tauri 変更を検討する。

現状は `generate_traceability -- --check` が ERROR 2 件（T1 drift / T4 baseline 22 vs 現在 25）で fail する状態のまま、他の全 gate は green（Gated Amendment 1 起票前の記録として保持、対応結果は下記）。

### Gated Amendment 1 対応（2026-09-03、Coordinator 起票分）

Coordinator 起票の Gated Amendment 1（本 packet `## Scope` 末尾）に従い、`src-tauri` 配下を一切変更せずに A1-a / A1-b を実施した。

**A1-a（T4 / T1、baseline は変更しない）**:

- 変更 file（3）: `src/components/patterns/PageShell.test.tsx` / `src/styles/globals.test.ts` / `src/test/page-root-pageshell-sweep.test.ts`。各 file の header comment に「共有部品の contract test。traceability 上は Lane 2 pilot = UI-01a へ紐付け（Gated Amendment 1）」を追記し、`describe` 文字列に `UI-01a` を含める（例: `SC2a: PageShell renders a single root with space-y-6 p-6 (UI-01a pilot / 共有 page root)`）。`FE_UNREFERENCED_BASELINE`（`src-tauri/src/bin/generate_traceability.rs:43`）は無変更。
- `cd src-tauri && cargo run --bin generate_traceability`（`--check` なし）で `docs/function-design/90-traceability.md` を再生成 → 出力は commit 済みの内容と byte-identical（`git diff --stat` 0 行、追加 commit なし）。
- before: `generate_traceability -- --check` = ERROR 2 件（`[T1]` 90-traceability.md drift、`[T4]` baseline 22 / 現在 25）。after: `traceability check: OK（ERROR 0 件 / WARN 0 件）`。FE 未参照ファイル数は 25 → 22（baseline どおり）。
- `git diff --stat 9d11287 -- src-tauri src/lib/bindings.ts` = 0 行（維持）。

**A1-b（旧 path / 名の sweep 拡張）**:

- 変更 file（9）: `docs/FUNCTION_DESIGN.md`（:39,139）/ `docs/design-system/01-decision-rules.md`（:429）/ `docs/design-system/reference/mockup-d-lists.html`（:105）/ `docs/function-design/50-ui-product-list.md`（:43）/ `58-ui-stock-inquiry.md`（10 箇所）/ `66-ui-stock-movements.md`（:106）/ `73-ui-stocktake.md`（:220）/ `74-ui-operation-logs.md`（3 箇所）/ `75-ui-integrity-check.md`（2 箇所）。現行描画・現行契約を指す箇所は `ProductPagination` → `Pagination`（`src/components/patterns/Pagination.tsx`）へ置換。歴史記述（当時の名称を指す changelog 行・decision 行）は「旧 `ProductPagination`」を明記して残す（例: `58-ui-stock-inquiry.md:633` の 2026-08-03 changelog 行）。
- `mockup-d-lists.html:105` の保留項目文言「238 件中 1 / 5 ページ」→「238 件中 1〜50 件目 · 1 / 5 ページ」（`〜` = U+301C、`·` = U+00B7、実文字コードを確認済み）。同 li 内の「**Lane 2 移行対象**」記述も実装済み表記へ更新。
- `StocktakePage.test.tsx:1038` は AC5（diff 0 行）優先で無変更（棚卸し lane で更新予定）。
- oracle: `rg -n "ProductPagination" docs/function-design docs/FUNCTION_DESIGN.md docs/design-system --glob '!**/2026-08-23-current-design-analysis.md' | rg -v "旧"` = **0 hit**（before は 21 hit（旧 path/名の未タグ付き参照））。

**再実行 gate（全 green）**: `bash scripts/doc-consistency-check.sh`（ERROR 0、WARN 5、pre-existing）/ `--target plan`（全チェック通過）/ `npm run test`（160 file / 1226 test）/ `npm run lint` / `npm run format:check`。`cd src-tauri && cargo run --bin generate_traceability -- --check`（OK、ERROR 0 / WARN 0）。`git diff --stat 9d11287 -- src-tauri src/lib/bindings.ts` = 0 行。

これにより AC9 の traceability 条件（Gated Amendment 1 で追記された「T4 = 新規 test の `UI-01a` 紐付けで baseline 22 のまま」）と AC3 追加条件（旧 path/名 sweep）を共に満たし、未解決事項は解消した。

### Final Review round 1 是正（2026-09-03、Opus デザイン面 P1 1 / P2 6 / P3 4 + Sonnet mutation X16 survivor + Codex P2-3 / P2-4）

**X16 survivor 是正（test-only、自己確認済み）**: `ListShell.test.tsx` の SC4a/SC4b/SC4d の class assert を、raw class 文字列への部分一致（`rootClass.toContain(...)`）から `classTokens()` ヘルパー（空白分割の配列に対する完全一致 `toContain`/`not.toContain`）へ全面置換。`"[&_tbody_td]:border-b"` が `"[&_tbody_td]:border-border"` に前方一致していたため X16（td の `border-b` 削除）を素通りしていた。是正後、`ListShell.tsx` の `"[&_tbody_td]:border-b"` を一時削除して自己確認 → SC4d が期待どおり FAIL（`expected [...] to include '[&_tbody_td]:border-b'`）することを確認し、直後に revert（`git diff` 0 行に復帰）。

**P1-1（`--card` = `--muted` 記録）**: runtime は `--card` = `--muted` = `#f5f5f4`（globals.css）で toolbar 箱と sticky 帯が同一明度になり承認 mockup（`--card:#fff`）と乖離する既知の逸脱。**実装は変更していない**（承認済み 00-foundations の値を維持）。D-5 行末・catalog ⑯ 必須構成 1・`mockup-d-lists.html` の位置付け note に同一の記録済み逸脱 1 行を追記し、AC-L3-2 に「toolbar 箱・sticky 帯・ページ地の明度関係が許容できるか。否なら Gated Amendment で `--card` #fff を検討」を追加。

**P2 是正**:
- `01-decision-rules.md:429` の上部文言を範囲付き統一形「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」へ訂正。
- `mockup-d-lists.html` 保留項目 3（識別列 mapping 要約）を「mapping は DSR-22 表を正本とする」のみへ簡略化（旧要約は DSR-22 表の入出庫履歴 mapping と食い違っていた）。保留項目 4（操作枠・構造線コントラスト）を「実装済み」表記へ。
- `ListShell.tsx` の summary 帯に `truncate`（`overflow-hidden`/`text-ellipsis`/`whitespace-nowrap` の shorthand）を適用し、SC4d の token assert に `truncate` を追加。AC-L3-2 に「帯の文言が末尾まで読めるか（125%/150%）」「横スクロールで上部帯が消えないか（消えるなら Probe 2 の Gated Amendment 経路）」を追加。
- mockup ボタン枠色を実装と 1:1 化: `mockup-d-lists.html` の `.btn` 基本枠を `var(--border)` へ、`.search .btn`（検索ボタン）のみ `border-strong` 相当を維持（runtime `SearchBar.tsx:98` と一致）。新規 mockup のうち検索欄を持つ `history` / `home-sales-admin` の 2 file に `.d .search .btn{border-color:var(--border-strong)}` を追加（`forms-a` / `forms-b` / `import-export` は検索欄を持たないため対象外）。

**P3 是正**:
- `ProductListPage.tsx` の `bulkError` Alert を `toolbarSecondary` 内・PLU 一括ボタン直後（旧 `31c069d` と同じ「ボタン直下」の位置）へ移設。既存 test は位置を assert していなかったため更新不要、全 23 test green を確認。
- D-5 / 04 原則 6 / catalog ⑯ の枠文字列に「（2 段時は段間 `space-y-3`）」を補記（`ListShell.tsx` の実装 `space-y-3 rounded-lg border bg-card p-4` と一致）。
- 新規 mockup 5 file の未使用 `--d-ctl` 宣言を削除（`forms-a` の `.samplewrap` は `--border-strong` へ置換のうえ、5 file 全てで declaration 自体を除去）。
- packet S8 に「(vii) `ListSkeleton` の外枠（`rounded-md border p-3`）は表の外枠再検討（D-2）とセットで Lane 3〜5」を追記。

**Codex Final Review（PR #32 comment 5525240043）P2-3（docs drift 残り）**:
- `50-ui-product-list.md`: perPage 既定 `50` → `100`（URL 明示値優先の記述は維持）、§50.4 直後に更新履歴 1 行を追加。
- `74-ui-operation-logs.md:263`: `Pagination` 再利用契約の文言を範囲付き統一形へ。
- `mockup-d-lists.html` 下部 pager の描画文字列（`<span>238 件中 1 / 5 ページ</span>`）を上部と同じ範囲付き統一形へ（`238 件中 1〜50 件目 · 1 / 5 ページ`）。
- sweep: `rg -n "件中 \{p\}|件中 \{page\}|既定.*50" docs/function-design docs/design-system` を実行し全 hit を確認。棚卸し（既定 50、D-6 で不変）・PriceRevision（UI-01a と同じ「200 上限」を指す記述で既定自体は不変）・changelog 行（「当時の」等で historical framing 済み）・reference 分析 doc（旧 Lane 0 所見の歴史記録）は現状維持が正しいことを確認、実修正が必要だったのは上記 3 箇所のみ。

**Codex P2-4（SC2b 強化、test-only、自己確認済み）**: `page-root-pageshell-sweep.test.ts` に `<PageShell` occurrence 総数 43 の literal oracle を追加し、許容 `p-6` 2 件を件数一致ではなく `file path + class 文字列` の exact allowlist（`IntegrityCheckPage.tsx` の overlay/card 2 行）へ強化。是正後、`ReceivingRecordDetailPage.tsx` の 3 分岐の 1 つを一時的に `<div className="space-y-6 p-6">` へ戻して自己確認 → 両 assert が期待どおり FAIL（allowlist 不一致 3 件 / occurrence 42 ≠ 43）することを確認し、直後に revert（`git diff` 0 行に復帰）。

**再実測 gate（全 green）**: `npm run typecheck` / `lint` / `test`（160 file / 1226 test）/ `format:check`（差分なし）/ `build` / `doc-consistency-check.sh`（ERROR 0、WARN 5 pre-existing）/ `--target plan`（全チェック通過）/ `generate_traceability --check`（OK、ERROR 0 / WARN 0）。DS1 = 40 件・DS3 = 23 件（前回から変動なし、新規 token/path 追加なし）。`git diff --stat 9d11287 -- src-tauri src/lib/bindings.ts` = 0 行を維持。AC1〜AC9（Gated Amendment 1 の追加条件含む）を再実測し全 green を確認。

### Gated Amendment 2 対応（2026-09-03、owner L3 run 1 FAIL 4 点是正、S9〜S12）

**S9 SegmentedControl 群枠**: `segmented-control.tsx` の群 wrapper（`segmentedControlListClass`）を `rounded-lg bg-muted p-[3px]` から `rounded-md border border-border-strong bg-background p-0.5` へ（Primary 色不使用）。未選択肢の `border-transparent` は不変。選択中の tone は `selection-tone.ts` の `SELECTION_TONE_ACTIVE`（SidebarLink と共有、`border-stone-400 bg-stone-300 ...`）を import して置換し、file 内の `stone-300` literal を撤去（focus-visible の border も `border-border-strong` へ）。`segmented-control.test.tsx` に SC6（wrapper の token 完全一致 classList + fs literal oracle `rg -c stone-300` = 0）を追加、既存 test の active tone 期待値を `border-stone-400` へ更新。

**S10 PLU 一括 caption**: `ProductListPage.tsx` の `toolbarSecondary` 内、PLU 一括 2 button を `role="group"` + `aria-labelledby="plu-bulk-caption"` で包み、直上に `<p id="plu-bulk-caption">` で caption「**PLU 一括操作**（絞り込みに一致する商品すべてが対象・他ページ含む・確認画面あり）」を配置（label = `font-medium text-foreground`、括弧部 = `text-muted-foreground`、全体 `text-sm`）。button の label・variant・color は無変更。`ProductListPage.test.tsx` に SC7 を追加（caption class + 2 button が同一 group）。 追記是正（2026-09-03）: `bulk_set_plu_target` は現在の絞り込み条件に一致する全件（他ページ含む）に作用する（`PluBulkTargetConfirmDialog.tsx:37-38` の dialog 本文と一致）ため、Coordinator が実読で作用範囲を突合し caption 文言を「絞り込みに一致する商品すべてが対象・他ページ含む・確認画面あり」へ精密化（現在ページのみと誤読され得た旧文言「表示中の商品すべてが対象」を是正）。

**S11 sticky 帯 surface**: `globals.css` に `--list-head: #e7e5e4`（`:root`）+ `--color-list-head`（`@theme inline`）を追加。00-foundations 表へ「一覧 sticky 帯 / `--list-head` / `stone-200` / #e7e5e4 / 対 `--background` 1.20:1・対 `--foreground` 13.93:1（WCAG 相対輝度で独立計算）」を登録。`ListShell.tsx` の summary 帯・`[&_thead_th]`・新設 `[&_thead_tr]` を `bg-muted` → `bg-list-head` へ、帯に `w-full` を追加（`bg-muted` は残さない）。`globals.test.ts` の SC1 に `--list-head` / `--color-list-head` を追加、`ListShell.test.tsx` に SC8（帯・th・tr すべて `bg-list-head` を持ち `bg-muted` が残らない）を追加。catalog ⑯ 使用トークン・packet D-2（(iii)(iv) 節）・Spec Contract・Impact Lenses accessibility 行を `--list-head` へ同期。`mockup-d-lists.html` の `--d-head` 値を `#f5f5f4` → `#e7e5e4` へ更新し保留項目の note も同期、Lane 1b mockup 5 file（forms-a/forms-b/history/home-sales-admin/import-export）の `--d-head` も同値へ揃えた。

**Probe 4（帯と th の左右端一致、`npm run dev` 目視）**: **計測不能**。前回 Probe 2 と同じ理由（worktree にブラウザ計測手段がなく、sandboxed agent 環境に GUI ブラウザがない）。`npm run dev` 自体の起動は確認した（正常起動）。代替として DOM 構造を静的分析した: summary 帯（`w-full` 明示）と `Table` の `[data-slot=table-container]`（`table.tsx` 既定で `w-full`）はいずれも `ListShell` root の直接子（同じ余白なしの flow container）で、`ListShell` root 自体は横方向の padding/margin を持たない（`space-y-3` は縦方向のみ）。したがって両者は同じ利用可能幅に対して 100% で伸びるため、左右端は理論上一致するはずだが、これは実測ではない。**Coordinator 確認事項**: AC-L3-2 の owner L3 run 2 で実測確認を行うことで足りるか判断を仰ぐ。

**S12 dialog 残像**: `ProductListPage.tsx` の `bulkTarget: boolean | null`（open/target 兼用）を `bulkDialogOpen: boolean` + `bulkTarget: boolean`（初期 `true`、最後に選んだ値を保持）の 2 state に分離。close は `setBulkDialogOpen(false)` のみで `bulkTarget` を触らない。新規 file `ProductListPage.bulk-dialog-target.test.tsx` を作成し、`vi.mock` で `PluBulkTargetConfirmDialog` を差し替えて渡された props を記録する SC9 を実装（「対象から外す」→ cancel 後の最終 render で `open === false && pluTarget === false` を assert、対称確認として「対象にする」側も追加）。**bug 再現を確認**: 是正前に本 test を実行したところ、最終 render が `{ open: false, pluTarget: true }` となり（旧実装のとおり `bulkTarget` が `null` に戻り `pluTarget={bulkTarget ?? true}` の fallback で反転）意図どおり FAIL することを確認してから実装した（TDD）。既存の bulk 系 test（`ProductListPage.test.tsx` の REQ-907 B-V3、実 dialog を使用）への影響を避けるため、dialog mock は専用 file に隔離し `ProductListPage.test.tsx` 自体は無変更（既存 24 test は影響なく green）。

**X17〜X20**: Writer 側の自己確認は実施していない（Final Review で Sonnet 独立 closure が再実測、発注書の指示どおり）。

**再実測 gate（全 green）**: `npm run typecheck` / `lint` / `test`（161 file / 1233 test）/ `format:check`（`npm run format` を 1 回適用後 差分なし）/ `build`。`bash scripts/doc-consistency-check.sh`（ERROR 0、WARN 5 pre-existing、DS1 = 40 件・DS3 = 24 件〈+1、`--list-head`〉）。`--target plan`（全チェック通過）。`cd src-tauri && cargo run --bin generate_traceability -- --check`（OK、ERROR 0 / WARN 0。新規 test file `ProductListPage.bulk-dialog-target.test.tsx` は本文中の `REQ-907` 言及により FE 未参照 baseline 22 のまま維持、`90-traceability.md` 再生成 1 行差分を commit に含める）。`git diff --stat 9d11287 -- src-tauri src/lib/bindings.ts` = 0 行を維持。S9（`rg -c stone-300 segmented-control.tsx` = 0）を含む全 AC を再実測し green を確認。

### Gated Amendment 3 対応（2026-09-04、owner L3 run 2 FAIL 是正 + closure 起源の追補、S13〜S21）

**Writer content commit**: S13〜S15 = `39f8683` / `72f3f23` / `76dc43e`（closure round 1 candidate）、追補 S16〜S19 = `b3c8b24` / `13fad54` / `4539416`（closure round 2 candidate）、closure round 2 是正 S20 / S21 = `b03958d` / `2a2ff14`（最終 content candidate、Reviewed Content HEAD）。

**S13**: `ListShell.tsx` の `stickyHeader && showTopSummary` 分岐で summary 帯と children を wrapper（追補 S17 で `w-min min-w-full`）に包み、帯に `px-2`。root `space-y-3` は不変。**S14**: `ProductListPage.tsx` の caption block を `basis-full flex flex-col items-start gap-1`、2 段目 `#plu-bulk-description` を (a)(b)(c) 3 分岐、group に `aria-describedby`。dialog title を「絞り込みに一致する商品を…」へ（`50-ui-product-list.md` 文言表・test literal 同期、`docs/screen_mockups.html:357` の「表示中の商品数」は在庫 summary card の別文脈で不変）。**S15**: mockup-d-lists の `.pager.top` を `.tbl` 内 + `--d-head`、catalog ⑯ 第 3 項の字面（語順は「`<table>` は単一（…）。」— packet 字面「単一 `<table>` 内」は自身の absence oracle `sticky header**（単一` = 0 と衝突する Coordinator 起草ミスで、Writer の語順変更を採用、内容等価）、第 1 項に「node 構造の 2 段」注記、文言表に toolbar caption 行 + 3 文 literal 脚注。**S16**: `globals.css` に unlayered forced-colors `:focus-visible` outline（`Highlight`）。**S17**: wrapper `w-min min-w-full`、帯 `overflow-hidden` + `[&>div]:min-w-0 [&>div]:truncate` + `forced-colors:border-b`。**S18**: mockup history / home-sales-admin / import-export の帯化（3 / 4 / 3 箇所）+ history 上部文言統一形。**S19**: catalog :904 / mockup-d-lists :116 の「同一明度」→ 3 段。**S20**: SC13 を nesting depth 0 + `outline: 2px solid Highlight` literal に強化。**S21**: 00-foundations に forced-colors focus 安全網 1 行、catalog ⑯ 第 3 項に wrapper / forced-colors 線 / ellipsis を追記。

**Probe（帯の隣接・inset・横追随の目視）**: Writer は GUI なしで計測不能。静的 DOM 分析（SC10 の正負 oracle: wrapper ≠ root、root は `space-y-3` 保持、帯の次兄弟が table-container、wrapper `className` 完全一致）で構造を保証。実描画は L3 run 3（AC-L3-2）が oracle。

**独立 closure**: round 1（`76dc43e`）= Sonnet mutation X21〜X29 全 kill + X16〜X20 再測全 kill、findings 0 / Opus デザイン面（L3 run 3 canonical 全項目スコープ）P1 3 / P2 5 / P3 4 → 追補 S16〜S19。round 2（`4539416`）= Sonnet X30〜X33 + X21〜X29 + X19 全 kill、findings 0 / Opus 軽確認 P1 0 / P2 2 / P3 3 → S20 / S21。round 3（`2a2ff14`）= Sonnet X34 + X30 + 追加 mutant（outline 幅 0）全 kill（SC13 の describe 内 it を S20 仕様へ書き換え、net 削除なし）、S21 doc oracle 3 本一致。着地 S13〜S21 closed、既存 test の削除・skip 0。

**再実測 gate（各 round で Writer + closure が独立に全 green）**: typecheck / lint / test / format:check / build / `doc-consistency-check.sh --target plan` / `doc-consistency-check.sh`（ERROR 0、WARN 5 pre-existing）。test 件数は PR body を正本とし転記しない。

**X21〜X34 の Writer 自己注入**: 未実施（発注書どおり、独立 closure が再実測）。

**遷移**: post-impl state-only 2/2 到達のため、`implementing -> local-verified -> independent-review -> human-confirm` を本 commit（Contract Coverage Ledger SC6〜SC13 行 + 本結果記入 + Workflow State）に同乗して materialize。根拠 = content candidate `2a2ff14`（closure round 3 で P1/P2 = 0）、L1 evidence は PR body。

### Gated Amendment 4 対応（2026-09-04、owner L3 run 3 AC-L3-5 FAIL 是正、S22〜S34、docs-only）

**Writer content commit**: S22〜S26 = `abcb9ac` / `d5b298e`、S27 = `9922994` / `dddfc27`（+ Coordinator 訂正 `9005270` に対する `e529e05`）、closure round 1 是正 S28〜S34 = `e5a50c7` / `6a40705` / `6d24e0d`、統合 merge = `fda21da`、closure round 2 是正 S35〜S38 = `48e0622` / `8ae2ac9`（最終 content candidate、Reviewed Content HEAD）。`git diff cf56d18..8ae2ac9 --stat -- src src-tauri` = 空、DSR-22 差分 0。

**着地**: 5 mockup を「runtime の現状 + Lane 2 実装済み差分」に限定（S22）。history / home-sales-admin / import-export / forms-a / forms-b の架空 field・未実装機能・後続候補を画面から除去し末尾 note の 4 区分（今回採用（Lane 2）/ 現実装維持 / 後続候補（本 mockup へ描かない）/ owner L3 所感）へ（S23〜S26、S29〜S32）。月次 summary card / 整合性チェック / 在庫少の基準 を runtime 同期（S27、確定 button は runtime どおり `補正を確定`）。追補 S18 の帯化は lists pilot 以外で supersede し、DSR-22 mapping 対象（history 記録日時 + 代表商品、棚卸し 商品コード + 商品名 等）の固定列 class のみ維持（S28）。SC12 / SC14a / SC14b は画面本体範囲 / 末尾 note 範囲に scope 分離し、全 command を `rg -c -F` + `|| echo 0` 型へ（S33）。Plans.md `:50 (vi)` を 採用 / 現状維持 / 後続候補 / 明示不採用 の 4 sub-bullet へ（S34 / S37）。import-export 部門別集計を runtime の 2 項目 list へ、forms-b 見出し（販売内容 / 廃棄・破損内容）と import-export alert 文言を runtime 同期、Matrix command の `|| echo 0` / note 除外 scope（S35 / S36 / S38）。

**process 記録**: (1) S27 初版で Coordinator が確定 button を `補正する` と誤記（`:364` の行 label を誤読）→ `9005270` で訂正、Writer 版を `e529e05` で是正。(2) closure round 1 の Writer が `cdd82d9` を checkout せず `e529e05` 起点で作業し、packet の S28〜S34 仕様文を自分の文面へ書き換えた → Coordinator が復元を指示（`6d24e0d`）、復元時に「遷移 / review」bullet が 1 行欠落したため統合 merge `fda21da` で packet は `cdd82d9` 版を採用。Writer は以後 packet の Scope / Spec / AC / Matrix 契約行を編集しない。(3) forms-b 棚卸しの固定列は Codex 修正案（history のみ例外）でなく DSR-22 mapping 表（`:434`）を根拠に維持（Coordinator 裁定）。(4) PLU 書出しの `既存 PLU バックアップ確認` alert は 67-ui REQ-402 に記載があるが runtime 未実装のため画面から除去し、docs ↔ runtime gap として note に記録（Lane 3〜5 候補）。

**独立 closure**: Codex Final Review round 1（comment 5534065618、`e529e05`）P1 5 / P2 2 → 全件 accept、是正 S28〜S34。relay 2/2 消費のため以後は Sonnet 独立 closure（`fda21da`、Matrix 全 command 再実行 + 5 画面 runtime spot check）= P1 1 / P2 3 / P3 3（Codex 7 件は着地確認済み、新規 P1 = import-export 部門別集計の未実装 5 列 table、対照表外 spot check で検出）→ 全件 accept、closure round 2 是正 S35〜S38（`9e9e76f`）→ Writer `48e0622` / `8ae2ac9` → closure round 3 は doc-only 4 点のため Coordinator 実読で閉じた（S35 `<th>部門コード<` 0 / `点数` 0 / `部門別集計` 3、S38 `伝票情報` 0 / `販売内容` 1 / `廃棄・破損内容` 1 / `既にあります` 0 / `同じ日の取込みがあります` 1、S37 sub-bullet 4、4 file `class="pager top"` 0、src / DSR-22 差分 0、packet 不変、doc gate ERROR 0）。P1/P2 = 0。

**遷移**: post-impl state-only 2/2 到達のため、`implementing -> local-verified -> independent-review -> human-confirm` を本 commit（Contract Coverage Ledger SC14a / SC14b / SC12 行 + 本結果記入 + Workflow State）に同乗して materialize。根拠 = content candidate `8ae2ac9`、L1 evidence は PR body。

### Gated Amendment 5 対応（2026-09-04、owner L3 run 4 起源 + 方針 A、S39〜S42）

**Writer content commit**: `1de174b`（S39、ListShell.tsx + test のみ）/ `cf9b255`（S39 docs + S40）/ `cb2994f`（S41 / S42）/ `7b80f67`（S41 の owner 原文訂正、Haiku 機械置換、content candidate = Reviewed Content HEAD）。`git diff 0ecce49..cb2994f --stat -- src` = ListShell.tsx + ListShell.test.tsx の 2 file、`src-tauri` / packet / DSR-22 差分 0。

**着地**: S39 = `ListShell.tsx:97` の帯を `bg-background` + `border-b border-border` へ（`bg-list-head` / `forced-colors:border-b` 除去、thead の `bg-list-head` / `border-b-2` は不変、wrapper・`h-10` / `top-10`・`px-2`・ellipsis・横追随は不変）。TDD で SC4d / SC8 を先に更新して red → green。catalog ⑯ 第 3 項「灰色面は列見出しのみ」、00-foundations `--list-head` = thead surface、mockup-d-lists `.pager.top` = `var(--bg)` + `border-bottom`、Matrix SC8 / SC10 / SC12 更新。S40 = reference README 5 行に reference-only。S41 = Plans.md Lane 3〜5 申し送りに「owner 反応 ledger（run 1〜4、原文優先）」10 bullet（runtime backlog 9 = 商品登録のレジ登録 section 分離 / 現在庫の数量単位併記 / 価格履歴文言 / 入庫商品追加の列構成 / `pcs` 生表示 bug / 直近 10 件の明示 / 交換注釈の配置 / 方向 badge の色 / レシート画像「（任意）」、維持 1）。S42 = decision-log D-080（runtime-first、既存画面の手写し mockup は行わない）+ Plans.md ④ 参照。

**process 記録**: owner run 4 は Codex を介さない原文で受領（scratch 保存 → packet evidence）。反応 ledger は Sonnet が read-only で 38 行に起こし、Coordinator が runtime 実在を確認して裁定（mockup のみの反応 13 件は runtime が既に正しいため Plans.md に書かず、対応済み 6 件は転記不要）。 **owner 原文による訂正（同日）**: Coordinator の裁定 4 件が mockup への指摘を runtime 要望に読み替えていた — レジメモリ No. / バーコード登録の配置（runtime は form 外の読み取り専用欄、`ProductFormPage.tsx:228-240`）と 現在庫・数量単位（runtime は 現在庫 → 数量単位 で owner の意図どおり）は記録のみへ、入庫 list の列順は「商品コード / 商品名 / 現在庫 / 入庫数量 / 単位 / 原価 / 操作」の owner 条件付き候補へ、交換注釈の置き場所は「未定、実機で候補を見て決める」へ（Plans.md 訂正 commit = `7b80f67`）。owner 指摘の meta: forced-colors L3 の mandatory 化は owner 意図でなく AI レビュー側（DSR-22 低視力 L3 節 = Coordinator 起草、追補 S16 = Opus P1-1）が持ち込んだ要件で、Codex / subagent を介した要約が意見を歪めた例。以後 owner 反応は原文を evidence に直接保存し、要約を裁定の一次資料にしない。

**独立 closure**: Sonnet mutation（`cb2994f`）= X19 / X33 新注入 kill、X21 / X22 / X29 / X31 / X32 再測 kill、追加 2 件（`border-border` 削除 / thead `bg-list-head` 削除）kill、survivor 0。doc oracle 7/7、既存 test 削除なし（SC8 は同一 case の書き換え）、gate 全 green、findings 0。`7b80f67` は Plans.md のみの docs 訂正で Coordinator が実読確認（旧字面 0 / 新字面 1、bullet 8）。P1/P2 = 0。

**遷移**: post-impl state-only 2/2 到達のため、`implementing -> local-verified -> independent-review -> human-confirm` を本 commit（Contract Coverage Ledger S39〜S42 行 + 本結果記入 + Workflow State）に同乗して materialize。根拠 = content candidate `7b80f67`（src は `cb2994f` から不変）、L1 evidence は PR body。L3 run 5 = 商品一覧の帯 1 点（件数行が地色 + 1px 下線、列見出しだけ灰色、隙間なし、sticky 維持）。

## Review Response

2026-09-03 Plan Review round 1（独立 Sonnet = P1 2 / P2 4 / P3 3、Opus デザイン面 = P1 4 / P2 8 / P3 3）: 全件 accept。Sonnet P1-1（AC2 の `rg -l` は 28 file、43 は箇所数）→ AC2 を file 数 + 箇所数の二段構えへ / P1-2（Matrix SC3a の to は 1,100）→ 訂正 / P2-3（`#cdc8c4` は 1.59:1、1.66 は対純白）→ 起票時実測・S1・reference §8 訂正を scope 化 / P2-4（patterns → features 逆依存）→ D-9 で `Pagination.tsx` へ移設、旧 Non-scope 撤回 / P2-5（returnTo は自動化可能）→ SC5c 新設、AC-L3-3 を render 確認のみへ / P2-6（SC4c / SC5b に X なし）→ X13 / X14 追加、AC10 = X1〜X14 / P3-7（`:36`）/ P3-8（`npm run build`）/ P3-9（3 file 6 箇所）→ 訂正。Opus P1-1（sticky 背景は mockup `--d-head` = `bg-muted`）/ P1-2（`border-collapse` で下端線が消える → `border-separate border-spacing-0` + thead cell `border-b`）/ P1-3（`--border` 単独濃化で階層反転 → `--input: var(--border-strong)` を同時適用、outline / Badge / chip は Lane 3〜5 sweep）/ P1-4（上部 summary が流れ去る → summary + thead の 1 帯 sticky、mockup 箱内スクロール不採用理由を注記）→ D-2 / D-7 改訂。P2-1（枠は `rounded-lg border bg-card p-4`、04 原則 6 を同期）/ P2-2（`totalCount > 0` gating、`toolbar` optional）/ P2-3（pilot に `isLoading` 配線）/ P2-4（summary は 16px semibold tabular-nums、catalog ⑩ `:646` を是正）/ P2-5（1.59:1）/ P2-6（AC-L3-1 に dialog + sidebar）/ P2-7（静的 boolean の近似採用を D-5 に明記）/ P2-8（S7 の描画内容 pin + DSR-22 `:441` の最終確定を AC-L3-5 へ）→ 反映。P3-1（`cn` 順序 + SC2a case）/ P3-2（README `:16` stale）/ P3-3（重複読み上げの記録）→ 反映。

2026-09-03 Plan Review round 2（独立 Sonnet = P1 1 / P2 1 / P3 1、Opus デザイン面 = P1 3 / P2 7 / P3 3。round 1 の 24 件は両者とも closed 確認、誤是正なし）: 全件 accept。Sonnet P1-1 = Opus P1-1（`border-separate` は `tr` の border を描画しないため tbody 行の区切りも消える、mockup `:37` は `td` に border-bottom）→ D-2 (ii) を th `border-b-2` + td `border-b` の cell 単位へ拡張 / Opus P1-2（thead `border-b` に oracle と mutant なし）→ SC4d oracle 拡張 + X15 / X16、AC10 = X1〜X16 / Opus P1-3（SegmentedControl `border-stone-300` 1.43:1 < 新 `--border` 1.59:1）→ Non-scope・AC-L3-1・S8 (iv) に追記 / Sonnet P2-1 = Opus P2-3（`h-10` / `top-10` の magic pair）→ `flex h-10 items-center whitespace-nowrap overflow-hidden` で 1 行固定、可変 offset は不採用 / Opus P2-1（SearchBar の入力枠 3.53:1 と outline ボタン 1.59:1 の段差）→ 検索ボタンのみ本 lane で `border-border-strong`（D-7 例外 1 件、S5）/ P2-2（表の外枠は `overflow:hidden` が sticky を殺す）→ 本 lane では付けない旨を D-2 に明記 / P2-4（AC1 の `#e7e5e4` 0 hit は reference `:19` で達成不能）→ 00 と reference で oracle 分離 / P2-5（sticky は th cell 単位）→ D-2 (iii) 一本化 / P2-6（focus 判別性 4.0:1 → 1.36:1、`--ring` は据え置き）→ AC-L3-4 に focus 項目 / P2-7（適用機構が未 pin）→ descendant variant のみを D-2 / Spec Contract に明記 / P3-1（th 下端 2px、summary 帯に線なし）/ P3-2（th は `text-foreground` 維持）/ P3-3（⑯ 3 の影は項目 4 側）→ D-2 / S6 に反映。Sonnet P3-1（badge / RootLayout は明示 utility）→ 起票時実測の表現を精緻化。Opus 回答（z-index 衝突なし / card-on-card は pilot 安全・S8 (v) へ / summary 16px semibold は PageHeader 24px と競合せず維持 / S7 pin 3 点で十分、150% は AC-L3-4 の form 画面追加で代替）→ 反映。

2026-09-03 Plan Review round 3（最終、closure）: Sonnet = P1/P2/P3 0（round 2 の 18 件 closed、cross-section 整合・marker 0 を確認）。Opus = P1 0 / P2 1 / P3 2（round 2 の 15 件 closed、最終 class set は承認 mockup `:33-37,65,85-86` を記録済み逸脱 3 件以外で再現すると確認）。P2-A（`stickyHeader` のみ真で `topSummary` 偽のとき th が `top-10` 固定で 40px 浮く）→ D-2 (iii) / Spec Contract / SC4d を「summary 帯を描画するときのみ `top-10`、それ以外 `top-0`」へ条件付け。P3-A（Impact Lenses / Coverage Ledger / Trace Matrix の「`border-separate` で境界線を残す」等の表現 drift 3 箇所）→ cell 罫線へ統一。P3-B（th font-weight / padding、td height、th box-shadow の既存差が未記録）→ D-2 に記録済み逸脱として追記。round 天井 3 に到達したため追加 round は設けず、是正 3 件は契約の条件付けと表現統一のみで新規設計を含まないことを Coordinator が実読で確認して収束とする（介入 1/3 = 起票選定のまま）。

2026-09-03: Plan Gate 収束（round 3/3、是正 commit = round 1 `1711667` / round 2 `b62b23f` / round 3 は直前の content commit）。`plan-gate -> plan-approved -> implementing` を本 state-only commit で圧縮遷移（forward state-only 1/3）: plan-approved の証跡 = Review Response 節（Sonnet 3 round + Opus 3 round、最終 P1/P2 = 0 に是正済み）、Plan Commit = plan-first commit `244a5dd`。Writer = Sonnet subagent（worktree isolation、発注書は Coordinator 起草、runtime → docs → mockup の順、D-8 descope 経路あり）。**記録訂正（Codex P2-2）**: `9d11287` の subject は Coordinator の起票ミスで canonical token `state-only遷移` を欠き、`check-workflow-git.sh` の STATECAP 計数に載らない。`9d11287` 以降の 15 commit は Codex / Opus / mutation 再実測 / PR head が SHA で参照しており、履歴書換えは証跡を無効化するため不採用（SHA 書換え禁止の先例 PR #85）。forward state-only は Coordinator が手動計上し `9d11287` = 1/3、以後の遷移は canonical subject で積む。この例外の承認を Human Gate の承認依頼に含める。

2026-09-03: Sonnet Writer が worktree で S1〜S8 を実装（content 11 commit、HEAD `467fe67`）。Writer 報告の判断 2 件（`generate_traceability` T1/T4 FAIL、旧 `ProductPagination` path の function-design 残存）を Gated Amendment 1（`4401112`、Coordinator 起票: T4 は tool 指示どおり新規 test 3 file を `UI-01a` へ紐付け・baseline 不変・src-tauri 不可侵維持 / T1 は 90-traceability 再生成 / 旧 path sweep / Probe 2 計測不能の記録）として packet に記録し、Writer が `c036bf4` で対応（gate 全 green、traceability check OK）。push → Draft PR #32。Final Review round 1 = Codex（PR #32 comment 5525240043、relay 1/2 消費）P1 0 / P2 4（Amendments 未記録 → 本 commit で記録 / `9d11287` subject 非 canonical → 上記の例外 / docs drift 4 箇所 / SC2b が 43 箇所を固定しない）+ Opus デザイン面 P1 1（runtime `--card` = `--muted` = #f5f5f4 で toolbar 箱と帯が同色、承認 mockup は `--card:#fff` の canonical 逸脱 → 実装は 00-foundations に忠実なため維持、記録済み逸脱 + AC-L3-2 の owner 判定項目、`--card` 見直しは Lane 3〜5 候補）/ P2 6 / P3 4 + Sonnet mutation 独立再実測（隔離 worktree）X1〜X15 kill / **X16 survivor**（`toContain` の部分文字列一致、test-only の oracle 強化）。全件 accept、Writer 是正 `2c9d77c` `e60fa2a` `ef782b8`（Coordinator 返信 = PR #32 comment 5525596726）。独立 closure（Sonnet fresh context、隔離 worktree）= X16 / X15 / X3 変種（Codex P2-4）/ X9 を再注入し全 kill、是正 14 件の着地を anchor 付きで確認、doc gate ERROR 0 / WARN 5（pre-existing）、P1/P2/P3 = 0。`implementing -> local-verified -> independent-review -> human-confirm` を本 state-only commit で圧縮遷移（post-impl state-only 1/2、forward 手動計上 2/3）: local-verified の証跡 = Writer 各 commit の gate（typecheck / lint / test 1226 / format / build / doc-consistency-check / plan / traceability）+ closure の doc gate 再実行 / independent-review の証跡 = Review Response 節 + PR #32 comment 5525240043・5525596726。Reviewed Content HEAD = `ef782b8`。次 = owner Windows native L3（AC-L3-1〜5）+ mockup 5 file 視認（介入 2/3）。

2026-09-03: **owner L3 run 1 = FAIL**（PR #32 comment 5526295095、介入 2/3 の同一 gate 内）。PASS = 入庫の余白・階層・sidebar / 125%・150% / 色の階層（懸念付き）/ 商品一覧の sticky 動作と罫線。FAIL 4 点 = (1) SegmentedControl の未選択肢が操作群に見えない（AC-L3-1 (f) 否）(2) PLU 一括操作の作用範囲と確認ありが押す前に分からない (3) sticky 帯が `bg-muted` で本文と近く、cell 単位の背景が左右端で切れて 1 つの帯に見えない（AC-L3-2）(4) `PLU 対象から外す` dialog の退出 200ms 中に `bulkTarget` が null → fallback true へ反転し反対文言が残像表示（`ProductListPage.tsx:303-309`、`b2389b19` 起源の latent bug、P2）。未実施 = AC-L3-2 の DPI / 横 scroll / forced-colors、AC-L3-3、AC-L3-4 の商品一覧、AC-L3-5、`9d11287` 例外承認。`human-confirm -> implementing` へ state-backtrack（Reviewed Content HEAD を pending へ）。是正は Gated Amendment 2（S9〜S12）として起票し、Writer 是正 → Sonnet 独立 closure（新規 X17〜X20 含む）+ Opus デザイン面軽確認 → human-confirm 再遷移（post-impl state-only 2/2）→ L3 run 2 は canonical の最初から。

2026-09-03: Gated Amendment 2 の Writer 是正 = `c1928c9`（S9〜S12 実装）/ `7136d53`（SC6〜SC9、S12 は是正前に bug 再現を確認してから TDD）/ `4fda5a2`（`--list-head` 登録 + mockup 同期）/ `b9f0ba5`（caption の作用範囲を「絞り込みに一致する商品すべて・他ページ含む」へ精密化 — Coordinator が `bulk_set_plu_target` の作用範囲を実読して突合）。Probe 4 は Writer 計測不能（L3 run 2 が oracle）。独立 closure（Sonnet fresh context、隔離 worktree）= X17〜X20 + X16 再測 全 kill（survivor 0、baseline 349 test green）、S9〜S12 の着地 anchor 付き closed、doc gate ERROR 0 / WARN 5（pre-existing）、P1/P2/P3 = 0。Opus デザイン面の軽確認は API 529 Overloaded ×2 で起動できず**未実施**（座組上の必須 round ではなく、Final Review round 1 の Opus 検分と owner の render oracle〈L3 run 2〉で代替。service 回復後に owner が望めば実施可）。`implementing -> local-verified -> independent-review -> human-confirm` を本 state-only commit で圧縮遷移（**post-impl state-only 2/2 = 上限到達、forward 手動計上 3/3**。以後の `human-confirm -> ready-hosted-final` は L3 PASS 後の content commit に同乗する〈PR #30 先例〉）。Reviewed Content HEAD = `b9f0ba5`。次 = owner L3 run 2（AC-L3-1〜6、canonical の最初から、介入 2/3 のまま）。

2026-09-03 Final Review round 1: Codex（PR #32 comment 5525240043）P1 0 / P2 4 → 全件 accept（P2-1 Amendments → 本 commit で `4401112` 記録 / P2-2 `9d11287` subject → 履歴書換え不採用・手動計上 + owner 承認の例外 / P2-3 docs drift 4 箇所 → `ef782b8` / P2-4 SC2b occurrence 43 + allowlist → `ef782b8`）。Opus デザイン面 P1 1 / P2 6 / P3 4 → 全件 accept（P1-1 `--card` 同色は記録済み逸脱 + AC-L3-2 判定項目、実装維持 / P2-1 DSR-22 上部文言 / P2-2・P2-3 mockup 保留項目 3・4 / P2-4 帯 `truncate` + AC-L3-2 に可読性・横 scroll 項目 / P2-5 横 scroll 時の帯 → AC-L3-2 / P2-6 mockup ボタン枠色を実装と 1:1 / P3-1 ListSkeleton 枠 → S8 (vii) / P3-2 bulkError を toolbarSecondary 内へ / P3-3 `space-y-3` 補記 / P3-4 `--d-ctl` 重複削除）。Sonnet mutation 独立再実測 X1〜X15 kill / X16 survivor（`[&_tbody_td]:border-b` が `[&_tbody_td]:border-border` に部分一致）→ `ListShell.test.tsx` を token 完全一致へ（test-only）。是正 = `2c9d77c`（test）/ `e60fa2a`（ui）/ `ef782b8`（docs）。独立 closure = X16 / X15 / X3 変種 / X9 全 kill、着地 14 件 closed、P1/P2/P3 = 0。

2026-09-03 owner L3 run 1 FAIL → Gated Amendment 2（S9〜S12、`b318240`）: 是正 `c1928c9` `7136d53` `4fda5a2` `b9f0ba5`。独立 closure = X17〜X20 + X16 全 kill、着地 closed、P1/P2/P3 = 0。Opus 軽確認は 529 ×2 で未実施（L3 run 2 を oracle）。

2026-09-04: **owner L3 run 2 = FAIL（途中停止）**（PR #32 comment 5527090250、head `916696c` / content `b9f0ba5`、100% 表示、介入 2/3 の同一 gate 内）。PASS = SegmentedControl 群枠（AC-L3-1 (f)）。懸念付き PASS = PLU 一括操作 caption（作用範囲と確認ありは読めるが、括弧書きが仕様注釈に見える。owner 提案 = 左寄せ 2 段 + 実件数）。FAIL = summary 帯と table header の 1 帯化（AC-L3-2）: `ListShell.tsx:73` root の `space-y-3` が summary 帯と table の間にも 12px の page 地を挟み、summary 文言は水平 inset なしで th `px-2` の左基準線と 8px ずれ、通常位置と sticky 位置で見え方が変わる。未実施 = dialog 残像（AC-L3-6 後段）/ DPI 125%・150% / 横 scroll / `?perPage=50` / forced-colors・focus / mockup 5 file + history 固定列 mapping / `9d11287` 例外承認。非 blocking 所感 = control surface と toolbar 地の明度差（Final Review round 1 P1-1 の `--card` 候補と同根、本 lane 不変）/ 帯文言「全453件のうち1〜100件を表示」案（DSR-22 統一形の改訂、P3 backlog）。Coordinator 所見: Amendment 2 S11 は surface と幅のみ規定し垂直隣接と水平 inset を書いておらず、mockup `.pager.top` も背景なし・`.tbl` と 24px gap の別構造のため「1 つの帯」を目で照合できる正本が無かった（Opus デザイン面レビューが 529 で未実施だった影響）。`human-confirm -> implementing` へ state-backtrack（Reviewed Content HEAD を pending へ）。是正は Gated Amendment 3（S13〜S15）として起票し、Opus デザイン面レビュー（発注書駆動・read-only）→ Writer 是正 → Sonnet 独立 closure（新規 X21〜X23 含む）→ human-confirm 再遷移は post-impl STATECAP 2/2 到達のため content commit 同乗で materialize → L3 run 3 は canonical の最初から。

2026-09-04 owner L3 run 2 FAIL → Gated Amendment 3（S13〜S15、`357941c`、Opus デザイン面 Plan Review P1 5 / P2 6 / P3 5 全件 accept）+ 追補（S16〜S19、`75d5e30`、closure round 1 Opus P1 3 / P2 5 / P3 4 → P1-2 は主張 accept・修正方向 rebut）+ closure round 2 是正（S20 / S21、`ec56d20`、Opus P1 0 / P2 2 / P3 3 全件 accept）: Writer content commit = `39f8683` `72f3f23` `76dc43e` / `b3c8b24` `13fad54` `4539416` / `b03958d` `2a2ff14`。独立 closure 3 round = Sonnet mutation X16〜X34 survivor 0、Opus デザイン面 P1/P2 = 0（round 3 は docs 字面 + test 強化のみで Opus 省略、Coordinator が S21 差分を実読）。`implementing -> local-verified -> independent-review -> human-confirm` を本 content commit（Ledger + 結果記入）に同乗で materialize（post-impl state-only 2/2 到達のため、先例 `2026-07-17-backup-migration-failure-contract-design.md:259`）。Reviewed Content HEAD = `2a2ff14`。L3 run 3 は canonical の最初から。

2026-09-04: **owner L3 run 3 = FAIL（AC-L3-5 途中停止）**（head `a21d2a5` / content `2a2ff14`、介入 2/3 の同一 gate 内）。PASS = AC-L3-1 の入庫・廃棄・進行中棚卸し・ホーム・商品一覧・dialog / sidebar、AC-L3-2 の縦 scroll 中の summary + thead 一帯化・現在位置・罫線・横 overflow 右端追随、AC-L3-3 の表示件数 100 → 50 → 100、AC-L3-4 の forced-colors 検索欄 focus / sticky 帯境界 / 入出庫履歴 cell button focus、AC-L3-6 の PLU caption / dialog 文言 / cancel 後の反対文言残像なし。横 overflow では DSR-17 の `<main>` 単一 scroll により title / toolbar も横へ流れるが、重なり・帯切れはなく既存設計どおりとして懸念付き PASS。OS DPI 125% は崩れなしを確認した一方、owner はノート PC の通常運用として大きすぎ、operator が Windows 設定を切り替える想定も現実的でないと判定。in-app 特大 × OS 125% / OS 150% / form 150% は未実施で、forced-colors も今回初めて追加された実運用外の試験として mandatory 継続を撤回したいとの所感を記録（既実装の安全網は無害かつ描画 PASS のため、削除是正は要求しない）。

AC-L3-5 の forms-a は比較 panel 内の旧 16px 側が、外周余白との釣合い上、新 24px 側より自然という所感。ただし実画面の PageShell 24px は AC-L3-1 で採否済みのため runtime FAIL にはしない。forms-b は棚卸し ListShell 方向・amber progress とも異論なし（section 20px は旧見本の事実表示で採否対象外）。history は固定列を含む現実装を維持する方向で、入出庫履歴の明細数省略は可、在庫少一覧は現実装の `状態 → 在庫数 → 売価` が自然。操作ログ mockup の `実行者 店主` は DB に field がなく架空で、期間 filter は `開始日` / `終了日` を同居させるなら `期間` group 化が候補、一覧と整合性補正 detail は現実装の概要列 + semantic list の方が優秀で nested table / 列見出し化は不採用。商品一覧 mockup の角丸 table 外枠は見た目がすっきりする一方、runtime は sticky を壊す `overflow:hidden` を避ける既決 trade-off があるため本 amendment では実装しない。

**停止理由** = `mockup-d-home-sales-admin.html` が Lane 2 の token / border / spacing 比較を越え、既存画面の情報・導線・データ契約を独自に再設計しており、「現状同期」の AC-L3-5 oracle として使えない。Home は説明文付き quick action の方向自体は良いが、入庫 / 返品・交換 / 手動販売出庫 / 廃棄・破損を落としたのは意図した省略ではなく mockup drift、非 link card の「すぐ確認」は誤誘導。日次は現実装の別置き日次/月次 tabs・前日/翌日・summary（売上合計 / 販売点数 / 売上明細数 / 前日比）・bottom-right ExportBar を維持し、平均単価 / 部門数への置換、filter card への tabs / export 取込み、全 section の表化は不採用。前日比の正負色は runtime 実装済み。公式 Z001 / Z002 / Z005 section も runtime に存在するが、保存済み Z001 summary line の gross / net 以外は DTO / UI に未公開であり別 R3 の機能 gap 候補、Z004 由来の部門小計を商品明細から別表へ分離する案も後続候補。印刷は日次 / 月次とも Phase 4 の disabled placeholder で印刷紙面未実装、CSV は backend / frontend と自動 test はあるが owner native 出力未確認。月次は runtime に公式部門集計の説明と金額右端の列順があり、mockup の説明欠落・`部門 / 売上金額 / 構成比` への置換は不採用、商品ランキング 1 位 badge のみ肯定。Backup は現行導線を維持し、mockup から採用候補は page subtitle / `YYYY-MM-DD HH:mm` 表示、最新 badge は現実装済み、復元 dialog も現実装が対象日時を含む。保存先 card / 今すぐバックアップ / 一覧見出しを崩す案は不採用。

owner が是正方針 A（mockup を現実装 + Lane 2 の比較差分に限定し、上記所感・採否理由を packet へ残す）を明示選択したため、`human-confirm -> implementing` へ state-backtrack（Reviewed Content HEAD を pending へ）。次は Gated Amendment 4 を起票し、mockup の架空 field / 未実装機能 / 独自共通化を除去、実装済み・後続候補・本 Lane の視認対象を分離してから docs gate / independent review / canonical L3 を再開する。

2026-09-04 owner L3 run 3 FAIL（AC-L3-5）→ Gated Amendment 4（`cf56d18`、Codex draft を Fable 裁定、owner escalation）+ S27（`29091d4` / 訂正 `9005270`）+ closure round 1 是正 S28〜S34（`cdd82d9`）: Writer content commit = `abcb9ac` `d5b298e` `9922994` `dddfc27` `e529e05` `e5a50c7` `6a40705` `6d24e0d`、統合 merge `fda21da`、closure round 2 是正（`9e9e76f`）`48e0622` `8ae2ac9`。Codex Final Review（relay 2/2）P1 5 / P2 2 全件 accept → 是正。Sonnet 独立 closure（`fda21da`）P1 1 / P2 3 / P3 3 全件 accept → 是正、closure round 3 = Coordinator 実読で P1/P2 = 0。`implementing -> local-verified -> independent-review -> human-confirm` を本 content commit（Ledger + 結果記入）に同乗で materialize。Reviewed Content HEAD = `8ae2ac9`。L3 run 4 は改訂 5 mockup の視認を canonical first action とし、runtime 変更なし（`git diff a21d2a5..8ae2ac9 --stat -- src src-tauri` = 空）。

2026-09-04: **owner L3 run 4 = FAIL（AC-L3-5 forms-a、owner 直接フィードバック = Codex を介さない原文、scratch 保存 → Amendment 5 で Plans.md ledger へ転記）**（head `97f63e9` / content `8ae2ac9`、介入 2/3 の同一 gate 内）。forms-a: 商品登録・修正はレジメモリ No. を「商品の識別」に入れて窮屈、「レジにバーコード登録する」説明が浮く、在庫の現在庫が数量単位を無視、`レジ在庫連携（pos_stock_sync）` は識別子表示で不可、価格履歴は良いが文言は「直近 10 件の売価・原価の変更を新しい順に表示します」へ、toast が黒い（現行のままでよい）。入庫記録・返品・交換は「基本的に現行実装のほうがいい」: 伝票番号は出所不明（runtime に無い）、備考が小さい、商品追加の列は「商品コード / 商品名 / 現在庫 / 入庫数量 / 原価 / 単位 / 操作」が望ましい、runtime の `pcs` 表示は変、リセット button と「すべての履歴を見る」「詳細を見る」が mockup から消えている、最近の入庫記録は直近 10 件でよい、原価差分 dialog は現行の見やすさが上、保存結果の緑 icon / レジ戻し badge / CSV 取込み反映 badge の色 / レシート画像「任意」は肯定、方向 badge の色遣いには疑問あり、「交換は戻り・渡しの明細が両方必要です」注釈の置き方は改善余地。**runtime**: 商品一覧の件数文言を列見出しと同じ灰色面に入れた帯（Amendment 2 S11 / Amendment 3 S13）は「見栄えが悪い、角が角、入れ込んだのがミス、下に線を引く程度でよい」（run 3 AC-L3-2 PASS の翻意）。**総評**: mockup は抜けが多く現行実装を踏まえきれていない、mockup をやっている間 runtime が進まないのは良くない流れ。owner が方針 A（mockup 視認を本 PR の Human Gate から外し、Lane 3〜5 は runtime-first）を明示選択。`human-confirm -> implementing` へ state-backtrack（Reviewed Content HEAD を pending へ）。次は Gated Amendment 5（帯の runtime 是正 / AC-L3-5 descope / owner 反応 ledger の Plans.md 転記 / runtime-first の decision-log）。

2026-09-04 owner L3 run 4 FAIL（AC-L3-5 forms-a、原文）+ 方針 A → Gated Amendment 5（`a823df8` + 語句 `0ecce49`、S39〜S42、owner escalation）: Writer content commit = `1de174b` `cf9b255` `cb2994f` + owner 原文訂正 `7b80f67`（Plans.md のみ）。Sonnet 独立 closure（`cb2994f`）全 9 mutant kill・findings 0、`7b80f67` は Coordinator 実読で P1/P2 = 0。`implementing -> local-verified -> independent-review -> human-confirm` を本 content commit（Ledger + 結果記入）に同乗で materialize。Reviewed Content HEAD = `7b80f67`。L3 run 5 は帯 1 点のみ（mockup 視認は descope）。

2026-09-04: **owner L3 run 5 = PASS（帯 1 点）+ 追加要望 2 + bug 1**（head `0499212` / content `7b80f67`、原文、介入 2/3 の同一 gate 内）。帯（件数行 地色 + 1px 下線、列見出しのみ灰色）は PASS。追加要望 = (1) 列見出しの灰色面の左右上の角を丸くしたい (2) 入力欄とドロップダウンの面を白くしたい（run 2 非 blocking 所感の「明度差が小さい」を owner は Codex 経由で要望として伝えたつもりだったが relay されていなかった）。bug = 商品一覧の在庫数にも unit code `pcs` が生表示（`ProductTable.tsx:69`、入庫 `ReceivingPage.tsx:557` / 廃棄 `DisposalPage.tsx:584` / 返品交換 `ReturnExchangePage.tsx:866` の単位列と同根）。owner「まとめてできるならやってしまおう」→ Gated Amendment 6 に 3 点を束ねる。`human-confirm -> implementing` へ state-backtrack（Reviewed Content HEAD を pending へ）。

- Findings Freeze: frozen at Final Review round 1（是正 `ef782b8` 後の独立 closure で P1/P2 = 0）; post-freeze exceptions: Gated Amendment 2（owner L3 run 1 FAIL 起源、S9〜S12、SC6〜SC9 / X17〜X20 は Matrix 契約の superset）, Gated Amendment 3 + 追補（owner L3 run 2 FAIL 起源 + closure round 1 / 2 の Opus finding、S13〜S21、SC10〜SC13 / X21〜X34 は Matrix 契約の superset）, Gated Amendment 4（owner L3 run 3 AC-L3-5 FAIL 起源 + Codex Final Review、S22〜S38、SC14a / SC14b、docs-only）, Gated Amendment 5（owner L3 run 4 + 方針 A、S39〜S42、runtime は帯 1 点、SC8 / SC10 / SC12 更新）.
