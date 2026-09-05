# Test Design Matrix: UI 一覧の背骨 D — Lane 4（識別列固定 / ページ送りの上下切り分け / 表示件数の位置統一 / 枠の地色）

Plan Packet: [../2026-09-05-ui-list-backbone-d-lane4.md](../2026-09-05-ui-list-backbone-d-lane4.md)

Plan Review round 1（Opus）が reject した旧 SC1（`ListShell` wrapper 撤去）・旧 SC2b〜SC2f（7 画面中 6 画面の長文列/table 幅変更）は撤回済み。round 2（Opus、reject）で在庫照会の上部 summary 条件・整合性チェックの frame 除外・table wrapper の rounded-lg 統一・範囲外 page の検知漏れを是正した（第 1 便）。owner 決定（2026-09-05、第 2 便）で item (1) を D（表を縮ませる）から識別列固定（Excel 型、`<main>` 基準 sticky-left、商品一覧のみ）へ書き換え、旧 SC-PT（部門列 `whitespace-normal`）を撤回し SC9（識別列固定）へ置き換えた。**owner Windows native L3 run 1（PR #40、2026-09-06）で AC-L3-1 が FAIL、owner 決定 案 X により item (1) は `<main>` 基準 sticky-left から data grid 型 scroll 箱へさらに書き換え**（Gated Amendment 1、GA1a〜GA1d）。同 run で AC-L3-3（一括価格改定の取引先追加ボタン位置）も所感あり（Gated Amendment 2、GA2）。SC9 自体（`identityColumns` の class 契約）は Gated Amendment 1 でも不変——変わるのは ListShell の外側の構造（scroll 箱で包む）のみ。

## Risk

R3（商品一覧の識別列固定・scroll 箱構造・table overflow 挙動 + 共有 component `Pagination`/`PaginationSummary` の変更 + operator workflow の見た目変更）。狭幅での識別列固定・scroll 箱の実際の見え方は happy-dom のレイアウト計算では判定できないため、AC-L3-1（窓を狭める実機確認、商品一覧 1 画面、run 2）が oracle。本 Matrix は DOM の class/属性契約・条件分岐（render/no-render）・DOM 順に限定する。**round 3 是正（Opus P1）**: toolbar frame への sticky 追加は no-op と判明したため Scope から撤回。**Gated Amendment 1（owner L3 run 1、2026-09-06）**: `<main>` 基準 sticky-left モデルを data grid 型 scroll 箱へ置換、GA1a〜GA1d を追加。

## Contracts Under Test

- SC9: `ListShell.tsx` の `identityColumns` prop を活性化すると、root の className（descendant variant 文字列）に先頭 2 列（`thead th`/`tbody td`）向けの `nth-child(1)`/`nth-child(2)` selector を含む sticky/left/背景/z-index/境界 class が含まれる（`tbody` は `bg-background`/`z-[1]`/右端 shadow + `forced-colors:border-r`、`thead th` は既存 `top`/`z-10` に加え `z-[11]`）。`identityColumns` 未設定では root にこれらの class が含まれない。`ListShell.tsx` 自体は既存 wrapper（`:99` `w-min min-w-full`）・sticky-top 指定を無変更のまま。`ProductListPage.tsx` は `identityColumns={2}` を渡し、`ProductTable.tsx` 商品コード列に `w-28` が付く（他の列 class は無変更）。**round 3 是正（Opus P6）**: `ListShell.tsx` は `STICKY_TABLE_CLASSES` を実 DOM の `thead th`/`tbody td` へ直接 render するのではなく root の descendant variant class として持つ（`ListShell.tsx:5-6` の設計方針、`ListShell.test.tsx:313-319` の `classTokens(container.firstElementChild)` が既存の検査 precedent）。したがって SC9a/b は rendered `th`/`td` の classList ではなく **root の class token** を対象に「含む/含まない」を検査する
- SC1a〜SC1c: `Pagination`（下部）が `totalPages <= 1`（`totalCount === 0` 含む）のとき何も描画せず、`totalPages > 1` では従来どおり描画し、51 件/perPage 50 の 2 ページ目で「前へ」が有効
- SC2: `PaginationSummary` が新規に `text-sm text-muted-foreground tabular-nums` を持つ（`text-base text-foreground` 撤去、下部の分割表記とは別に 1 箇所だけ新規出現）
- SC3a〜SC3g: 7 画面（`ListShell` を使わない全画面）で `totalCount > 0` の結果表示時に上部 `PaginationSummary` が新規描画され、既存の単数一致 `getByText` 重複文言 test 3 file 6 箇所が是正される。**SC3b（在庫照会）のみ round 2 是正**: 下部と同じ `statusValue === "all" && totalCount !== null` の 2 条件でのみ描画（`totalCount: number | null`、`types.ts:54`）
- SC4a〜SC4f: 6 画面の枠が `rounded-lg border bg-card p-4`（`bg-stone-50` / 枠なし / `bg-card` 欠落からの是正）。整合性チェックは round 2 是正で対象外（`IntegrityCheckPage.tsx:234` は Select 単独ラッパーで filter フィールドを持たない）
- SC4g: `IntegrityCheckPage.tsx:348`/`OperationLogsPage.tsx:496` の table wrapper が `overflow-x-auto rounded-md border` → `overflow-x-auto rounded-lg border` へ（round 2 是正、`bg-card` は付けない）
- SC5a〜SC5b: `StocktakePage` と一括価格改定（`PriceRevisionFilters`）で表示件数 `Select` が枠内の最後尾（他要素の後）に描画される。既存 SC10/SC9a の rewrite・pass 維持が oracle
- SC6: `StocktakePage.tsx:854` の `<fieldset>` が単一ページで描画されない
- SC7: `ListShell.test.tsx` の既存 it は `:343` の wrapper 完全一致を含め、S2 の `text-base` 判別子書換え（`:96,98,107,119`）以外は無変更のまま pass する（回帰確認。本 lane は `ListShell.tsx` を S9 の範囲〈identityColumns〉でのみ変更する）
- SC8（round 2 是正、AC13。round 3 で行番号を再確認）: フィルタ変更で `totalCount` が perPage 未満へ減っても `page > totalPages` の状態で描画される画面が無い（`StockInquiryPage.tsx:194`/`OperationLogsPage.tsx:449` の既存「先頭ページに戻る」`EmptyState` 以外の画面から 1 画面選定）

## Failure Modes

- `identityColumns` を渡しても root の class token に先頭 2 列向けの固定 selector class が含まれない、または `identityColumns` を渡さない画面の root にこれらが誤って含まれる
- 固定 class が誤った列数（1 列だけ、または 3 列目以降にも）に適用される
- 識別列の `thead th` に `z-[11]` が付かず、他の非識別列 `th` と同じ `z-10` のまま重なりが不定になる（round 3 追加）
- `ListShell.tsx:99` の `w-min min-w-full` wrapper・`overflow-visible`・sticky-top 指定が変更されてしまう
- 商品一覧以外の 7 画面に `identityColumns` の配線・table 幅・長文列の変更が混入する（Non-scope 逸脱）
- `Pagination` が `totalPages <= 1` でもボタン・文言を描画してしまう、または `totalPages > 1` なのに誤って非表示になる
- 上部 `PaginationSummary` が 7 画面のいずれかで描画されない、`totalCount === 0` 相当のタイミングで誤って描画される、または新設に伴う重複文言で既存 test が壊れたまま放置される
- 枠色が `bg-card` にならない画面が残る、または `bg-card` 追加で page 内の他要素（`StockMovementsPage.tsx:98` の商品情報 card 等、Non-scope）を誤って巻き込む
- 表示件数 `Select` が枠内の最後尾に来ない（`StocktakePage` の reorder 漏れ、`PriceRevisionFilters` への配線漏れ、既存 SC9a が検出する `onPerPageChange` 未配線）
- `StocktakePage.tsx:854` の `<fieldset>` が単一ページで空要素のまま残る
- `ListShell.tsx` に意図しない変更が混入し `ListShell.test.tsx` の既存 it のいずれかが壊れる（特に `:343` の wrapper 完全一致）
- 在庫照会の上部 summary が下部と異なる条件（`totalCount>0` のみ等）で描画され、`source: "low_stock"` のとき誤って表示される
- 整合性チェックの Select 単独ラッパーに誤って `bg-card` frame が付く、または table wrapper の `rounded-md`→`rounded-lg` 統一漏れ
- フィルタ変更で `totalCount` が減った直後に `page > totalPages` のまま一覧が描画される画面が新たに生まれる

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC9a ListShell 識別列 class（あり、root token） | 固定 class 欠落 / 誤った列数 | unit（既存 `ListShell.test.tsx` 拡張、`classTokens(container.firstElementChild)` で root を検査、`:313-319` precedent 踏襲） | SC9a: with identityColumns={2}, root class tokens contain nth-child(1)/nth-child(2) selectors for thead th/tbody td with sticky+left-0/left-[7rem] (+ tbody: bg-background, z-[1], right-edge shadow, forced-colors:border-r; thead th: z-[11]); no nth-child(3) or later selector variant is present | root token に列 1-2 向け selector が欠落する、または列 3 以降向けの selector が誤って含まれる、または `thead th` に `z-[11]` が無い |
| SC9b ListShell 識別列 class（なし、対照、root token） | 誤爆 | unit（既存 `ListShell.test.tsx` 拡張、対照 case） | SC9b: without identityColumns, root class tokens contain none of the identity-specific tokens (nth-child selectors for columns 1-2, z-[11], forced-colors:border-r on tbody) | `identityColumns` 未設定でも識別列固有の token が root に含まれる |
| SC9c ListShell wrapper 不変（round 3 是正、toolbar sticky は撤回） | wrapper 変更 | unit（既存 `ListShell.test.tsx` 拡張） | SC9c: `:99` wrapper className stays exactly `w-min min-w-full` after identityColumns is activated | wrapper の class が変わる |
| SC9d ProductListPage/ProductTable 配線（round 3 是正、rendered root 経由で確認） | 未配線 | unit（`ProductListPage.test.tsx`: render 済み `ListShell` root の class token で `identityColumns={2}` 相当の適用を確認、mock された prop capture ではない。`ProductTable.test.tsx` 拡張） | SC9d: ProductListPage's rendered ListShell root carries the identityColumns=2 class tokens; ProductTable's 商品コード cell has w-28 | root token に識別列 class が反映されない、または `w-28` が付かない |
| SC1a Pagination 単一ページ非表示 | ボタン/文言残存 | unit（既存 `Pagination.test.tsx` 拡張） | SC1a: totalPages<=1 (including totalCount===0) renders null | `container.firstChild` が null にならない |
| SC1b Pagination 複数ページ表示 | 過剰適用（空集合 oracle 対） | unit（同上、対照 case） | SC1b: totalPages>1 still renders summary + 前へ/次へ | totalPages>1 なのに null になる |
| SC1c 51件/50件表示の 2 ページ目 edge | 「前へ」欠落 | unit（既存 `Pagination.test.tsx` 拡張、edge oracle） | SC1c: totalCount=51, perPage=50, page=2 renders an enabled 前へ button | 「前へ」が disabled または非表示になる |
| SC2 PaginationSummary style | 旧 class 残存 / oracle 誤り防止 | unit（既存 `Pagination.test.tsx` 拡張） | SC2: PaginationSummary root has exactly text-sm text-muted-foreground tabular-nums (new, single occurrence), text-base text-foreground has 0 occurrences | 旧 class が残る、新 class が付かない、または下部の分割表記と誤って同一視される |
| SC3a〜SC3g 7 画面の上部 summary 新規描画 + 既存重複文言 test 是正 | 描画漏れ / 既存 test 破綻放置 | unit（各 Page.test.tsx 拡張、7 file。うち `IntegrityCheckPage.test.tsx`/`OperationLogsPage.test.tsx`/`StockInquiryPage.test.tsx` は既存 `getByText` 是正を含む） | SC3x: results view renders PaginationSummary text above the table when totalCount > 0; existing single-match getByText assertions at IntegrityCheckPage.test.tsx:414, OperationLogsPage.test.tsx:280/292/419/431, StockInquiryPage.test.tsx:526 are rewritten to getAllByText/within and still pass | 対象画面のいずれかで上部 summary が見つからない、または上記 6 箇所のいずれかが多重一致で例外を投げたまま残る |
| SC3b 在庫照会 上部 summary 条件（round 2/3 是正） | 上部が誤って常時描画される、下部と条件が食い違う、または 0 件で描画される | unit（既存 `StockInquiryPage.test.tsx` 拡張） | SC3b: top PaginationSummary renders only when statusValue === "all" && (totalCount ?? 0) > 0, matching the corrected bottom Pagination gate | status が `"all"` 以外、`totalCount===null`、または `totalCount===0` で上部が描画される、または条件成立時に描画されない |
| SC4a〜SC4f 6 画面の枠 | 旧枠残存/新枠欠落 | unit（各 Page/Component.test.tsx 拡張、file 別 `rg` anchor は Plan Packet Scope S1 参照） | SC4x: filter section root has rounded-lg border bg-card p-4 | 旧 class（`bg-stone-50`／枠なし／`bg-card` 欠落）が残る |
| SC4g table wrapper rounded-lg 統一（round 2 是正） | rounded-md 残存 / bg-card 誤付与 | unit（`IntegrityCheckPage.test.tsx`/`OperationLogsPage.test.tsx` 拡張） | SC4g: table wrapper div has overflow-x-auto rounded-lg border, no bg-card | `rounded-md` が残る、または `bg-card` が誤って付く |
| SC5a StocktakePage Select 最後尾（既存 SC10 rewrite） | 順序不変 | unit（既存 `StocktakePage.test.tsx:1055` の SC10 rewrite、新規 test ではない） | SC10（rewrite）: filter row lists department filter, then uncounted-only checkbox, then per-page select in that DOM order | DOM 順で Select が Checkbox より前にある |
| SC5b PriceRevisionFilters Select 配線（既存 SC9a が oracle） | 未配線残存 | unit（既存 `PriceRevisionPage.test.tsx:694-703`（re-stack 後の行番号）の SC9a、無変更のまま pass 必須 + `PriceRevisionFilters` 側の位置 assertion 追加） | SC9a（無変更）+ 新規: 表示件数 Select renders inside PriceRevisionFilters as the last child of the filter row, and clicking it still calls mockScrollPageToTop | SC9a が fail する（`onPerPageChange` 配線漏れ）、または Select が `PriceRevisionPage.tsx` 側に独立して残る |
| SC6 StocktakePage fieldset ガード | 空 fieldset 残存 | unit（既存 `StocktakePage.test.tsx` 拡張） | SC6: fieldset wrapping the bottom Pagination is absent when totalPages<=1 | 単一ページで空の `<fieldset>` が DOM に残る |
| SC7 ListShell 回帰 | 意図しない副作用 | unit（既存 `ListShell.test.tsx`、S2 起因の判別子書換え 4 箇所以外は無変更 pass 必須） | SC7: existing it (including :343 wrapper exact-match) still pass unmodified | 本 lane の変更が `ListShell.tsx` に混入し既存 it のいずれかを fail させる |
| SC8 範囲外 page 非到達（round 2 是正、AC13） | page > totalPages のまま描画される | unit（1 画面、既存 test 拡張。フィルタ変更で totalCount を減らして page reset を確認） | SC8: changing a filter that shrinks totalCount below the current page's range still leaves page <= totalPages (via existing reset handler) | フィルタ変更後も `page > totalPages` の状態で一覧が描画される |
| GA1a ProductListPage flex box（Gated Amendment 1） | class 欠落 | unit（`ProductListPage.test.tsx` 新規） | GA1a: PageShell root has flex h-full min-h-0 flex-col overflow-hidden | root class にいずれかが欠ける |
| GA1b ListShell scroll 箱 + data-scroll-container（Gated Amendment 1） | box 欠落 / 属性欠落 / Pagination が box 内 | unit（`ListShell.test.tsx` 新規、`stickyHeader` 分岐） | GA1b: box element has min-h-0 flex-1 overflow-auto and data-scroll-container; bottom Pagination is a sibling after the box, not inside it | box の class/属性が欠ける、または `Pagination` が box の子として見つかる |
| GA1c scroll 解決 helper（Gated Amendment 1） | フォールバック不良 | unit（`page-scroll.test.ts` 新規/拡張、fake scroller） | GA1c: with a `[data-scroll-container]` element present, scrollPageToTop targets it; without one, falls back to main | 属性ありでも `main` を対象にしてしまう、または属性なしで例外を投げる |
| GA1d 商品一覧 scroll restoration（Gated Amendment 1） | 復元先が main のまま | unit（`ProductListPage.scroll-restoration.test.tsx` 新規、`OperationLogsPage.scroll-restoration.test.tsx` 踏襲） | GA1d: box scrollTop is restored on 一覧→詳細→戻り for 商品一覧 | 復元が `main.scrollTop` に対して行われ box の位置が戻らない |
| GA2 PriceRevisionFilters 取引先グルーピング（Gated Amendment 2） | unit 分離で折返し時に離れる | unit（`PriceRevisionFilters.test.tsx` 新規） | GA2: 取引先 label/Select/Button share one flex wrapper div; DOM order Select→Button→(...)→表示件数 Select is preserved | 3 要素が共通 wrapper を持たない、または DOM 順序が崩れる |

## Mutation Oracle Notes

- SC1a/SC1b/SC1c は 3 件で 1 組の対照 oracle（0 件相当 null / 複数ページ表示 / 境界 51 件 2 ページ目の有効「前へ」）。`totalPages<=1` の null 化だけを見る単独 test は「常に null を返す」mutant を通すため、SC1b・SC1c の非 null 期待が必須（空集合 oracle 衝突の回避、SC1a 単独運用禁止）
- SC3a〜SC3g は `totalCount > 0` の分岐でのみ描画されることを、EmptyState 分岐（該当画面の 0 件 test）が既存のまま変化しないことと対で確認する（新規 summary が誤って空状態にも描画されない）。加えて既存の単数一致 `getByText` test 6 箇所の是正漏れ（重複文言のまま放置）を fail 条件に含める
- SC4a〜SC4g は file ごとに旧 class の `rg -Fn` 完全一致文字列を Plan Packet の Scope S1 節から転記し、新旧が同一 test 内で排他であることを確認する
- SC5a は Checkbox の `aria-label`／`htmlFor` 等、既存 assertion を壊さない形で DOM 順のみを rewrite する（新規 test を追加しない）
- SC5b は「配線漏れ」mutant（`onPerPageChange` を渡さない）を既存 SC9a が検出することを前提に、新規に追加するのは DOM 位置（最後尾）の assertion のみとする
- SC9a/SC9b は対の oracle（`identityColumns` あり/なし）。あり側だけの単独 test は「常に固定 class を付ける」mutant を通すため、なし側の非付与期待が必須（空集合 oracle 衝突の回避）
- SC9a は「列 1-2 に付く」「列 3 以降に付かない」「`thead th` に `z-[11]` が付く」の 3 条件を同一 test 内で確認し、列数の過不足・z-index 抜け（Opus P1/P2）を検出する
- SC9c は `w-min min-w-full` の完全一致（既存 `:343` assertion と同じ厳密度）を維持し、識別列固定の実装が wrapper 側へ意図せず波及しないことを保証する。toolbar 側の assertion は行わない（round 3 是正、no-op のため Scope 対象外）
- S3 是正 4 箇所（`ListShell.test.tsx:96,98,107,119`/`ProductListPage.test.tsx:632-637`/`Pagination.test.tsx:71`）は S2 の class 変更が既存 test の判別子（`.text-base`/`toHaveClass("text-base", ...)`）を壊す mutant 検出であり、是正漏れがあれば既存 test 自体が red のまま残ることを oracle とする（round 3 追加）
- GA1b は「box の class が欠ける」と「`Pagination` が box の中に入ってしまう」の 2 種の mutant を区別して検出する（前者は class 文字列の欠落、後者は DOM 構造の逸脱で、どちらも「下部ページ送りが常に見える」という owner 期待像を壊す別々の failure mode）
- GA1c は fake scroller の有無で対照 oracle を作る（属性ありのときだけ helper がそれを対象にする、無いときは `main` にフォールバックする、の両方を同一 test 内で確認し「常に `main` を返す」「常に fake scroller を返す」のどちらの mutant も検出する）
- GA2 は DOM 順序（`compareDocumentPosition`）と共通 wrapper の存在を両方確認する。owner 所感の直接原因は flex-wrap による視覚分離であり DOM 順序は起票時実測で既に正しいと判明しているため、共通 wrapper の存在確認が本 Gated Amendment の主たる oracle、DOM 順序確認は既存契約の回帰ガード

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC9〜SC7・GA1a〜GA2 はすべて vitest（happy-dom の class/DOM 順検査）。実際の視覚的な「識別列が固定されたまま右側だけ流れる」「取引先ボタンが隣にある」見え方は happy-dom で判定できないため、AC-L3-1〜AC-L3-3（run 2）の owner Windows native L3 が唯一の oracle（Lane 3/5 の docs-review 先例とは異なり、本 lane に docs-only の静的 oracle は無い — DSR-17/DSR-22/catalog ⑩/⑯/⑰ の文言同期は Plan Packet Scope S6〜S8・Gated Amendment 1 で `rg -Fn`/`rg -c` 完全一致検査を行う。`rg -c` は一致した行数を数える点に注意）。
