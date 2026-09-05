# Test Design Matrix: UI 一覧の背骨 D — Lane 4（表を縮ませる / ページ送りの上下切り分け / 表示件数の位置統一 / 枠の地色）

Plan Packet: [../2026-09-05-ui-list-backbone-d-lane4.md](../2026-09-05-ui-list-backbone-d-lane4.md)

Plan Review round 1（Opus）が reject した旧 SC1（`ListShell` wrapper 撤去）・旧 SC2b〜SC2f（7 画面中 6 画面の長文列/table 幅変更）は撤回済み。本 Matrix は round 1/2 是正後の Scope（商品一覧の部門列折返しのみ + 8 画面共通の frame/pagination/Select）に対応する。

## Risk

R3（商品一覧の table overflow 挙動 + 共有 component `Pagination`/`PaginationSummary` の変更 + operator workflow の見た目変更）。狭幅での「出っ張り」消失・部門列の折返しは happy-dom のレイアウト計算では判定できないため、AC-L3-1（窓を狭める実機確認、商品一覧 1 画面）が oracle。本 Matrix は DOM の class 契約・条件分岐（render/no-render）・DOM 順に限定する。

## Contracts Under Test

- SC-PT: `ProductTable.tsx` 部門列に `whitespace-normal` が付く（新規 `min-w-*` を追加しない、`ListShell.tsx` は無変更）
- SC1a〜SC1c: `Pagination`（下部）が `totalPages <= 1`（`totalCount === 0` 含む）のとき何も描画せず、`totalPages > 1` では従来どおり描画し、51 件/perPage 50 の 2 ページ目で「前へ」が有効
- SC2: `PaginationSummary` が新規に `text-sm text-muted-foreground tabular-nums` を持つ（`text-base text-foreground` 撤去、下部の分割表記とは別に 1 箇所だけ新規出現）
- SC3a〜SC3g: 7 画面（`ListShell` を使わない全画面）で `totalCount > 0` の結果表示時に上部 `PaginationSummary` が新規描画され、既存の単数一致 `getByText` 重複文言 test 3 file 6 箇所が是正される
- SC4a〜SC4g: 7 画面の枠が `rounded-lg border bg-card p-4`（`bg-stone-50` / 枠なし / `bg-card` 欠落からの是正）
- SC5a〜SC5b: `StocktakePage` と一括価格改定（`PriceRevisionFilters`）で表示件数 `Select` が枠内の最後尾（他要素の後）に描画される。既存 SC10/SC9a の rewrite・pass 維持が oracle
- SC6: `StocktakePage.tsx:854` の `<fieldset>` が単一ページで描画されない
- SC7: `ListShell.test.tsx` 既存 17 it（`:343` の wrapper 完全一致を含む）が無変更のまま pass する（回帰確認、本 lane は `ListShell.tsx` を変更しない）

## Failure Modes

- `ProductTable.tsx` 部門列が `whitespace-nowrap`（table primitive 既定）のまま残る、または折返しに加えて不要な `min-w-*` の床を新規追加してしまう（Opus P2 の過剰適用）
- 商品一覧以外の 7 画面に table 幅・長文列の変更が混入する（Non-scope 逸脱）
- `Pagination` が `totalPages <= 1` でもボタン・文言を描画してしまう、または `totalPages > 1` なのに誤って非表示になる
- 上部 `PaginationSummary` が 7 画面のいずれかで描画されない、`totalCount === 0` 相当のタイミングで誤って描画される、または新設に伴う重複文言で既存 test が壊れたまま放置される
- 枠色が `bg-card` にならない画面が残る、または `bg-card` 追加で page 内の他要素（`StockMovementsPage.tsx:98` の商品情報 card 等、Non-scope）を誤って巻き込む
- 表示件数 `Select` が枠内の最後尾に来ない（`StocktakePage` の reorder 漏れ、`PriceRevisionFilters` への配線漏れ、既存 SC9a が検出する `onPerPageChange` 未配線）
- `StocktakePage.tsx:854` の `<fieldset>` が単一ページで空要素のまま残る
- `ListShell.tsx` に意図しない変更が混入し `ListShell.test.tsx` の既存 17 it のいずれかが壊れる（特に `:343` の wrapper 完全一致）

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC-PT ProductTable 部門列 | nowrap 残存 / 過剰な min-w 追加 | unit（既存 `ProductTable.test.tsx` 拡張） | SC-PT: 部門 cell has whitespace-normal and no new min-w-* class; 商品名 cell の既存 min-w-[14rem] whitespace-normal は不変 | 部門 `TableCell` が `whitespace-normal` を持たない、または新規 `min-w-*` が付与される |
| SC1a Pagination 単一ページ非表示 | ボタン/文言残存 | unit（既存 `Pagination.test.tsx` 拡張） | SC1a: totalPages<=1 (including totalCount===0) renders null | `container.firstChild` が null にならない |
| SC1b Pagination 複数ページ表示 | 過剰適用（空集合 oracle 対） | unit（同上、対照 case） | SC1b: totalPages>1 still renders summary + 前へ/次へ | totalPages>1 なのに null になる |
| SC1c 51件/50件表示の 2 ページ目 edge | 「前へ」欠落 | unit（既存 `Pagination.test.tsx` 拡張、edge oracle） | SC1c: totalCount=51, perPage=50, page=2 renders an enabled 前へ button | 「前へ」が disabled または非表示になる |
| SC2 PaginationSummary style | 旧 class 残存 / oracle 誤り防止 | unit（既存 `Pagination.test.tsx` 拡張） | SC2: PaginationSummary root has exactly text-sm text-muted-foreground tabular-nums (new, single occurrence), text-base text-foreground has 0 occurrences | 旧 class が残る、新 class が付かない、または下部の分割表記と誤って同一視される |
| SC3a〜SC3g 7 画面の上部 summary 新規描画 + 既存重複文言 test 是正 | 描画漏れ / 既存 test 破綻放置 | unit（各 Page.test.tsx 拡張、7 file。うち `IntegrityCheckPage.test.tsx`/`OperationLogsPage.test.tsx`/`StockInquiryPage.test.tsx` は既存 `getByText` 是正を含む） | SC3x: results view renders PaginationSummary text above the table when totalCount > 0; existing single-match getByText assertions at IntegrityCheckPage.test.tsx:414, OperationLogsPage.test.tsx:280/292/419/431, StockInquiryPage.test.tsx:526 are rewritten to getAllByText/within and still pass | 対象画面のいずれかで上部 summary が見つからない、または上記 6 箇所のいずれかが多重一致で例外を投げたまま残る |
| SC4a〜SC4g 7 画面の枠 | 旧枠残存/新枠欠落 | unit（各 Page/Component.test.tsx 拡張、file 別 `rg` anchor は Plan Packet Scope S1 参照） | SC4x: filter section root has rounded-lg border bg-card p-4 | 旧 class（`bg-stone-50`／枠なし／`bg-card` 欠落）が残る |
| SC5a StocktakePage Select 最後尾（既存 SC10 rewrite） | 順序不変 | unit（既存 `StocktakePage.test.tsx:1054` の SC10 rewrite、新規 test ではない） | SC10（rewrite）: filter row lists department filter, then uncounted-only checkbox, then per-page select in that DOM order | DOM 順で Select が Checkbox より前にある |
| SC5b PriceRevisionFilters Select 配線（既存 SC9a が oracle） | 未配線残存 | unit（既存 `PriceRevisionPage.test.tsx:660-669` の SC9a、無変更のまま pass 必須 + `PriceRevisionFilters` 側の位置 assertion 追加） | SC9a（無変更）+ 新規: 表示件数 Select renders inside PriceRevisionFilters as the last child of the filter row, and clicking it still calls mockScrollPageToTop | SC9a が fail する（`onPerPageChange` 配線漏れ）、または Select が `PriceRevisionPage.tsx` 側に独立して残る |
| SC6 StocktakePage fieldset ガード | 空 fieldset 残存 | unit（既存 `StocktakePage.test.tsx` 拡張） | SC6: fieldset wrapping the bottom Pagination is absent when totalPages<=1 | 単一ページで空の `<fieldset>` が DOM に残る |
| SC7 ListShell 回帰 | 意図しない副作用 | unit（既存 `ListShell.test.tsx`、無変更のまま pass 必須、17 it） | SC7: existing 17 it (including :343 wrapper exact-match) still pass unmodified | 本 lane の変更が `ListShell.tsx` に混入し既存 it のいずれかを fail させる |

## Mutation Oracle Notes

- SC1a/SC1b/SC1c は 3 件で 1 組の対照 oracle（0 件相当 null / 複数ページ表示 / 境界 51 件 2 ページ目の有効「前へ」）。`totalPages<=1` の null 化だけを見る単独 test は「常に null を返す」mutant を通すため、SC1b・SC1c の非 null 期待が必須（空集合 oracle 衝突の回避、SC1a 単独運用禁止）
- SC3a〜SC3g は `totalCount > 0` の分岐でのみ描画されることを、EmptyState 分岐（該当画面の 0 件 test）が既存のまま変化しないことと対で確認する（新規 summary が誤って空状態にも描画されない）。加えて既存の単数一致 `getByText` test 6 箇所の是正漏れ（重複文言のまま放置）を fail 条件に含める
- SC4a〜SC4g は file ごとに旧 class の `rg -Fn` 完全一致文字列を Plan Packet の Scope S1 節から転記し、新旧が同一 test 内で排他であることを確認する
- SC5a は Checkbox の `aria-label`／`htmlFor` 等、既存 assertion を壊さない形で DOM 順のみを rewrite する（新規 test を追加しない）
- SC5b は「配線漏れ」mutant（`onPerPageChange` を渡さない）を既存 SC9a が検出することを前提に、新規に追加するのは DOM 位置（最後尾）の assertion のみとする
- SC-PT は「部門列に `whitespace-normal` を付けるが `min-w-*` は追加しない」という 2 条件を同一 test 内で確認し、過剰適用（不要な床の追加）も検出する

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC-PT〜SC7 はすべて vitest（happy-dom の class/DOM 順検査）。実際の視覚的な「出っ張り消失」「部門列の折返し」は happy-dom で判定できないため、AC-L3-1〜AC-L3-3 の owner Windows native L3 が唯一の oracle（Lane 3/5 の docs-review 先例とは異なり、本 lane に docs-only の静的 oracle は無い — DSR-22/catalog ⑩/⑯ の文言同期は Plan Packet Scope S6〜S8 で `rg -Fn`/`rg -c` 完全一致検査を行う。`rg -c` は一致した行数を数える点に注意）。
