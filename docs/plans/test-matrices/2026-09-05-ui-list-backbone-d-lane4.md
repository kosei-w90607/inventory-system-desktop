# Test Design Matrix: UI 一覧の背骨 D — Lane 4（表を縮ませる / ページ送りの上下切り分け / 表示件数の位置統一 / 枠の地色）

Plan Packet: [../2026-09-05-ui-list-backbone-d-lane4.md](../2026-09-05-ui-list-backbone-d-lane4.md)

## Risk

R3（8 一覧画面の table overflow 挙動 + 共有 component `Pagination`/`PaginationSummary`/`ListShell` の変更 + operator workflow の見た目変更）。狭幅での「出っ張り」消失・長文列の折返しは happy-dom のレイアウト計算では判定できないため、AC-L3-1（窓を狭める実機確認、2 画面）が oracle。本 Matrix は DOM の class 契約・条件分岐（render/no-render）に限定する。

## Contracts Under Test

- SC1: `ListShell.tsx` の帯+table wrapper が `w-full`（`w-min min-w-full` 撤去）
- SC2a〜SC2f: 長文列（商品名 / 名前 / 備考 / 概要）に `whitespace-normal` が付き、`OperationLogsPage`/`PriceRevisionTable` の `<Table>` から固定 `min-w-[…]` が外れる
- SC3: `Pagination`（下部）が `totalPages <= 1` のとき何も描画しない（`totalCount === 0` を含む）
- SC4: `PaginationSummary`（上下とも）が `text-sm text-muted-foreground` を持つ（`text-base text-foreground` 撤去）
- SC5a〜SC5g: 7 画面（`ListShell` を使わない全画面）で `totalCount > 0` の結果表示時に上部 `PaginationSummary` が新規描画される
- SC6a〜SC6g: 7 画面の枠が `rounded-lg border bg-card p-4`（`bg-stone-50` / 枠なし / `bg-card` 欠落からの是正）
- SC7a〜SC7b: `StocktakePage` と `一括価格改定`（`PriceRevisionFilters`）で表示件数 `Select` が枠内の最後尾（他要素の後）に描画される
- SC8: `ListShell.test.tsx` SC4a〜SC10・SC17 が既存のまま pass する（回帰確認）

## Failure Modes

- `ListShell` の wrapper 変更後も横 overflow 時に page 地へ出っ張る（`w-min min-w-full` の残存、または `whitespace-normal` 未適用による内容幅温存）
- 長文列のいずれかが `whitespace-nowrap`（table primitive 既定）のまま残る、または `OperationLogsPage`/`PriceRevisionTable` の固定 `min-w-[…]` が残って viewport 内でも水平 scroll が発生する
- `Pagination` が `totalPages <= 1` でもボタン・文言を描画してしまう、または `totalPages > 1` なのに誤って非表示になる
- 上部 `PaginationSummary` が 7 画面のいずれかで描画されない、または `totalCount === 0` 相当のタイミングで誤って描画される
- 枠色が `bg-card` にならない画面が残る、または `bg-card` 追加で page 内の他要素（`StockMovementsPage.tsx:98` の商品情報 card 等、Non-scope）を誤って巻き込む
- 表示件数 `Select` が枠内の最後尾に来ない（`StocktakePage` の reorder漏れ、`PriceRevisionFilters` への配線漏れ）
- 既存 `ListShell.test.tsx`／`Pagination.test.tsx` の回帰

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 ListShell wrapper | `w-min min-w-full` 残存 | unit（既存 `ListShell.test.tsx` 拡張、SC10 の隣接 assertion） | SC1: sticky band wrapper has w-full, not w-min/min-w-full | wrapper の class に `w-min` または `min-w-full` が含まれる |
| SC2a StocktakePage 商品名 | nowrap 残存 | unit（既存 `StocktakePage.test.tsx` 拡張） | SC2a: 商品名 cell has whitespace-normal | 商品名 `TableCell` が `whitespace-normal` を持たない |
| SC2b StockInquiry 商品名（`ProductListTable`） | 同上 | unit（既存 `ProductListTable.test.tsx` or `StockInquiryPage.test.tsx` 拡張） | SC2b: 商品名 cell has whitespace-normal | 同上 |
| SC2c IntegrityCheckPage 名前 | 同上 | unit（既存 `IntegrityCheckPage.test.tsx` 拡張） | SC2c: 名前 cell has whitespace-normal | 同上 |
| SC2d MovementTable 備考 | truncate 残存 | unit（既存 `MovementTable.test.tsx` 拡張） | SC2d: 備考 cell has whitespace-normal, not truncate | `truncate` が残る、または `whitespace-normal` が付かない |
| SC2e OperationLogsPage 概要 + Table 幅 | truncate/固定幅残存 | unit（既存 `OperationLogsPage.test.tsx` 拡張） | SC2e: 概要 cell has whitespace-normal (no truncate/max-w-0); `<table>` has no min-w-[760px] | いずれかの旧 class が残る |
| SC2f PriceRevisionTable 商品名 + Table 幅 | 同上 | unit（既存 `PriceRevisionTable.test.tsx` or `PriceRevisionPage.test.tsx` 拡張） | SC2f: 商品名 cell has whitespace-normal; `<table>` no longer has min-w-[1280px] | いずれかの旧 class が残る |
| SC3a Pagination 単一ページ非表示 | ボタン/文言残存 | unit（既存 `Pagination.test.tsx` 拡張） | SC3a: totalPages<=1 (including totalCount===0) renders null | `container.firstChild` が null にならない |
| SC3b Pagination 複数ページ表示 | 過剰適用（空集合 oracle 対） | unit（同上、対照 case） | SC3b: totalPages>1 still renders summary + 前へ/次へ | totalPages>1 なのに null になる |
| SC3c 51件/50件表示の 2 ページ目 edge | 「前へ」欠落 | unit（既存 `Pagination.test.tsx` 拡張、L4-D 由来の edge oracle） | SC3c: totalCount=51, perPage=50, page=2 renders an enabled 前へ button | 「前へ」が disabled または非表示になる |
| SC4 PaginationSummary style | 旧 class 残存 | unit（既存 `Pagination.test.tsx` 拡張） | SC4: PaginationSummary root has text-sm text-muted-foreground, not text-base/text-foreground | 旧 class が残る、または新 class が付かない |
| SC5a〜SC5g 7 画面の上部 summary 新規描画 | 描画漏れ | unit（各 Page.test.tsx 拡張、7 file） | SC5x: results view renders PaginationSummary text above the table when totalCount > 0 | 対象画面のいずれかで上部 summary が見つからない |
| SC6a〜SC6g 7 画面の枠 | 旧枠残存/新枠欠落 | unit（各 Page/Component.test.tsx 拡張、file 別 `rg` anchor は Plan Packet 参照） | SC6x: filter section root has rounded-lg border bg-card p-4 | 旧 class（`bg-stone-50`／枠なし／`bg-card` 欠落）が残る |
| SC7a StocktakePage Select 最後尾 | 順序不変 | unit（既存 `StocktakePage.test.tsx` 拡張、DOM 順アサート） | SC7a: 表示件数 Select is the last child within the filter row, after 未入力のみ表示 checkbox | DOM 順で Select が Checkbox より前にある |
| SC7b PriceRevisionFilters Select 配線 | 未配線残存 | unit（既存 `PriceRevisionFilters.test.tsx` or `PriceRevisionPage.test.tsx` 拡張） | SC7b: 表示件数 Select renders inside PriceRevisionFilters as the last child of the filter row | Select が `PriceRevisionPage.tsx` 側に独立して残る、または `PriceRevisionFilters` 内で最後尾でない |
| SC8 ListShell 回帰 | 意図しない副作用 | unit（既存 `ListShell.test.tsx`、無変更のまま pass 必須） | SC8: existing SC4a-SC10/SC17 still pass unmodified | SC1 の wrapper 変更が他 SC を fail させる |

## Mutation Oracle Notes

- SC3a/SC3b/SC3c は 3 件で 1 組の対照 oracle（0 件相当 null / 複数ページ表示 / 境界 51 件 2 ページ目の有効「前へ」）。totalPages<=1 の null 化だけを見る単独 test は「常に null を返す」mutant を通すため、SC3b・SC3c の非 null 期待が必須（空集合 oracle 衝突の回避、SC3a 単独運用禁止）
- SC2a〜SC2f は「対象 file 内の対象列すべて」を 1 test 内で列挙し、1 列だけ戻す mutant でも fail する構成にする（Lane 5 SC4a〜SC4k の先例）
- SC5a〜SC5g は `totalCount > 0` の分岐でのみ描画されることを、EmptyState 分岐（該当画面の 0 件 test）が既存のまま変化しないことと対で確認する（新規 summary が誤って空状態にも描画されない）
- SC6a〜SC6g は file ごとに旧 class の `rg -Fn` 完全一致文字列を Plan Packet の Scope 節から転記し、新旧が同一 test 内で排他であることを確認する
- SC7a は Checkbox の `aria-label`／`htmlFor` 等、既存 assertion を壊さない形で DOM 順のみを新規に検査する

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC1〜SC8 はすべて vitest（happy-dom の class/DOM 順検査）。実際の視覚的な「出っ張り消失」「狭幅での折返し」は happy-dom で判定できないため、AC-L3-1〜AC-L3-3 の owner Windows native L3 が唯一の oracle（Lane 3/5 SC6a/SC6b の docs-review 先例とは異なり、本 lane に docs-only の静的 oracle は無い — DSR-22/catalog ⑩/⑯ の文言同期は S7〜S9 で `rg -Fn` 完全一致検査を Plan Packet 側で行う）。
