# Test Design Matrix: UI 一覧の背骨 D — Lane 2（PageShell / ListShell / token / ページ送り文言移行）

Plan Packet: [../2026-09-03-ui-list-backbone-d-lane2.md](../2026-09-03-ui-list-backbone-d-lane2.md)

## Risk

R3（route/search state + operator workflow の見た目変更）。render の実追従（sticky / 余白 / 濃化）は happy-dom で判定できないため L3 が oracle、本 Matrix は DOM 構造・class・文言・配線の契約に限定する。

## Contracts Under Test

- SC1: token 3 件（`--border-strong` / `--row-current` / `--border`）+ `@theme` map 2 件
- SC2a / SC2b: `PageShell` の root 契約 / page root 全置換
- SC3a / SC3b / SC3c: 範囲付き文言 / 0 件契約 / `PaginationSummary` text-only
- SC4a〜SC4e: `ListShell` の toolbar 枠 / topSummary / skeleton / sticky class + overflow 上書き / pager 配線
- SC5a / SC5b: 商品一覧 既定 100（URL 優先）/ pilot 構成

## Failure Modes

- token が未宣言・旧値・`@theme` 未 map（utility が生えない）
- `PageShell` が `space-y` を上書き可能 / `min-h-screen` 混入 / 置換漏れ
- from / to の off-by-one、to の未 clamp、0 件で「0〜0 件目」
- Summary にボタン混入、topSummary 既定 true
- skeleton 時に children も描画
- sticky class 欠落、overflow 上書き欠落（`<main>` に追従しない）
- pager の onPageChange 未配線
- 既定 100 が URL 明示値を上書き、棚卸し既定が巻き込まれる

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 token | 値違い / 未宣言 / 未 map | unit（fs literal oracle、`readFileSync("src/styles/globals.css")`） | SC1: globals.css declares border-strong #8a8480, row-current #fff8e6, border #cdc8c4 and maps color-border-strong / color-row-current | 5 literal のいずれかが独立転記値（test 内 literal、production 定数を import しない）と不一致 |
| SC2a PageShell root | `space-y-6` / `p-6` 欠落、className が上書き | unit | SC2a: PageShell renders a single root with space-y-6 p-6 and appends className without dropping base classes | root の classList に `space-y-6` と `p-6` の両方が無い、または `className="relative"` で base が消える、または root が複数 |
| SC2b page root 全置換 | 置換漏れ | unit（fs scan、`src/features/**/*Page.tsx` を glob し test 除外） | SC2b: no feature page file declares a p-6 root className outside PageShell | 正規表現 `className="[^"]*\bp-6\b` の hit が許容 2 箇所（card / overlay の独立転記 literal）以外に存在 |
| SC3a 範囲付き文言 | off-by-one / 未 clamp / locale 欠落 | unit | SC3a: ProductPagination shows "1,234 件中 1,001〜1,234 件目 · 11 / 13 ページ" for page 11 perPage 100 total 1234, and "101 件中 101〜101 件目 · 3 / 3 ページ" for page 3 perPage 50 total 101 | 文字列完全一致（独立転記）が不成立 |
| SC3b 0 件契約 | 「0 件中 0〜0 件目」/ ボタン enabled | unit | SC3b: ProductPagination with totalCount 0 renders "0 件" only and both nav buttons disabled | text に「件目」が含まれる、または `aria-label="前のページ"` / `"次のページ"` のいずれかが enabled |
| SC3c Summary text-only | ボタン混入 | unit | SC3c: PaginationSummary renders the range text and no button element | `queryAllByRole("button")` が 1 以上、または文言不一致 |
| SC4a toolbar 枠 | 枠 class 欠落 / 2 段未分離 | unit | SC4a: ListShell wraps toolbar and toolbarSecondary in one rounded-md border p-4 box as two rows | 枠要素に `border` / `rounded-md` / `p-4` のいずれかが無い、または toolbarSecondary が枠外 |
| SC4b topSummary | 既定 true / 常時描画 | unit | SC4b: ListShell renders PaginationSummary above the table only when topSummary is true | 省略時に summary text が存在、または true 時に不在、または table より後に出現 |
| SC4c skeleton | children も描画 | unit | SC4c: ListShell renders ListSkeleton (or given skeleton) instead of children while isLoading | isLoading 時に children の test id が存在、または skeleton が不在 |
| SC4d sticky class | class 欠落 / overflow 上書き欠落 | unit | SC4d: ListShell with stickyHeader marks thead sticky top-0 and overrides table-container overflow to visible; without stickyHeader neither is applied | `thead` の classList に `sticky` / `top-0` が無い、`[data-slot=table-container]` の overflow 上書き class が無い、または false 時にも付与 |
| SC4e pager 配線 | onPageChange 未配線 | unit | SC4e: clicking 次のページ in ListShell bottom pager calls pagination.onPageChange with page+1 | mock が呼ばれない、または引数違い |
| SC5a 既定 100 | 既定 50 のまま / URL 上書き | unit | SC5a: ProductListPage requests per_page 100 by default and per_page 50 when URL perPage=50 | `searchProducts` mock の `per_page` が既定で 100 でない、または URL 明示 50 が 100 に化ける |
| SC5b pilot 構成 | ListShell 未経由 | unit | SC5b: ProductListPage renders top summary text, toolbar box, and bottom pager wired to search state | summary text 不在、枠不在、次のページ click で search state の page が進まない |
| 文言 regression | 旧文言残存 | 既存 test 更新 | IntegrityCheckPage / StockInquiryPage / OperationLogsPage の `件中` assert 6 箇所 | 新文言で fail（更新は期待値置換のみ、削除・skip 不可） |
| 棚卸し既定 | 巻き込み | 既存 test（無変更） | `StocktakePage.test.tsx` T2 / T3 `per_page: 50` | 50 以外 |

## State Lifecycle Matrix

| State/subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 商品一覧 `perPage`（URL search） | URL なし → 100 / URL 明示 → その値 | — | 一覧 100 件 | `Select` 変更で URL 更新 | search 再実行 | `returnTo` 復元で保持 | 再起動で URL 依存 | — | — | SC5a / AC-L3-3 |
| ListShell `isLoading` | false | true → skeleton | children | query 再実行で true | — | — | — | error は caller の `EmptyState` | — | SC4c |
| pager page | 1 | — | onPageChange(page+1) | — | — | — | — | 端で disabled | — | SC4e / SC3b |

## Adjacent Pattern Audit

| Source pattern/contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test/evidence |
|---|---|---|---|---|
| 04 原則 6 page root | `src/features/**/*Page.tsx` 45 hit | 43 root → `PageShell` | card / overlay の `p-6` 2 箇所（root ではない） | SC2b / AC2 |
| catalog ⑩ `ProductPagination` | 8 caller | 文言のみ全 caller | ListShell 化は pilot のみ（Lane 3〜5） | SC3a / regression |
| catalog ⑯ ListShell | 商品一覧 | pilot | 他 7 画面 + 識別列固定（D-2） | SC5b |
| DSR-17 `<main>` scroll | `RootLayout.tsx:65` / `table.tsx:9` | overflow 上書きのみ | `data-scroll-restoration-id` 非接触 | SC4d / Review Focus |

## Negative Paths

- `PageShell className="relative"` で base class が残る（SC2a）
- `totalCount` 0 / 端数最終ページ / perPage 200 で to = total（SC3a / SC3b）
- `topSummary` / `stickyHeader` 省略時に何も付かない（SC4b / SC4d）
- URL `perPage=50` が既定 100 に化けない（SC5a）

## Boundary Checks

- from / to: page 1 → 1〜perPage、最終ページ → to = totalCount、totalCount < perPage → 1〜totalCount
- `toLocaleString("ja-JP")` の 3 桁区切りが n / from / to すべてに掛かる（SC3a の 1,234 case）

## Compatibility Checks

- `ProductPagination` props 不変（8 caller の import / 呼び出し diff なし）
- `StocktakePage.test.tsx` diff 0 行
- `src/lib/bindings.ts` / `src-tauri` diff 0 行

## Data Safety Checks

- synthetic seed のみ、永続化なし

## Main Wiring / Integration Checks

- helper connected to main path: `ListShell.pagination.onPageChange` が `ProductListPage` の search state 更新（`navigate({ search })`）へ配線されていること（SC5b で page 遷移を検証）
- `PageShell` が実 page から import されていること（SC2b の fs scan + AC2 の `rg -l "<PageShell"`）
- `@theme` map が生えた utility を ListShell の sticky thead が `bg-background` と併用（class oracle、SC4d）

## Mutation-style Adequacy Questions

- token の値を 1 文字変えたら SC1 が落ちるか（production 定数を import せず literal 転記か）
- 1 画面の root を旧 class に戻したら SC2b が落ちるか
- from の計算を `page*perPage` にしたら SC3a が落ちるか
- Summary にボタンを足したら SC3c が落ちるか
- overflow 上書き class だけ消したら SC4d が落ちるか
- 既定を 50 に戻したら SC5a が落ちるか

## 必須 mutation 注入（Final Review で clean tree 独立再実測）

| # | 注入 | kill 期待 |
|---|---|---|
| X1 | `globals.css` の `--border-strong` を `#e7e5e4` に変更 | SC1 |
| X2 | `PageShell` の base class から `space-y-6` を削除 | SC2a |
| X3 | `ProductListPage.tsx` の root を `<div className="space-y-4 p-6">` に戻す | SC2b |
| X4 | from の計算を `page * perPage` に変更 | SC3a |
| X5 | to の `Math.min(..., totalCount)` を外す | SC3a |
| X6 | `totalCount === 0` の分岐を削除 | SC3b |
| X7 | `PaginationSummary` に前へ / 次へボタンを描画 | SC3c |
| X8 | ListShell の toolbar 枠から `border` を削除 | SC4a |
| X9 | `topSummary` の条件を外し常時描画 | SC4b |
| X10 | `stickyHeader` 時の overflow 上書き class を削除（sticky class は残す） | SC4d |
| X11 | ListShell 内 `ProductPagination` の `onPageChange` を no-op に差替 | SC4e |
| X12 | `search.ts` の perPage 既定を 50 に戻す | SC5a |

## Residual Test Gaps

- sticky の実追従・余白・濃化の見え方は happy-dom で判定不能 → AC-L3-1 / AC-L3-2 が oracle。
- forced-colors / DPI は AC-L3-4 のみ。
- mockup HTML は自動 test なし（AC7 の rg + AC-L3-5）。
