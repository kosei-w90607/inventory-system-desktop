# Test Design Matrix: 棚卸しカウント画面の磨き batch

Plan Packet: [../2026-09-02-stocktake-count-screen-polish.md](../2026-09-02-stocktake-count-screen-polish.md)

## Risk

Risk: R3

## Contracts Under Test

- S1 / DSR-01: counting 画面の primary（`bg-primary` class）ボタンは「数を保存」の 1 個のみ。「棚卸しを確定する」「選択」は outline。
- S2: `selectItem` 到達（`find_stocktake_item` 直接解決・商品名検索単一候補自動選択・候補選択のいずれの経路でも）で前商品の数量 FieldError をクリアする。
- S3: FieldError 表示スロットは常時 render し、エラー有無で「数を保存」ボタンの位置を変えない。
- S4: 「対象にありません」は `role="status"` + `text-muted-foreground` + `Info` icon で表示し、`role="alert"` / `text-destructive` を使わない。
- S5: 未入力 Badge は `progress.uncounted_items > 0` で warning tone（`border-warning-border bg-warning-soft text-warning-strong` + `AlertTriangle`）、`=== 0` で success tone（`bg-success text-primary-foreground` + `CheckCircle2`）。
- S6: `PRODUCT_NAME_SEARCH_QUERY.is_discontinued` は `null`（廃番商品も候補に含む）。候補行は廃番商品に「廃番」Badge を付す。
- S8: `useStocktakeItems` の `perPage` は呼び出し側が明示指定し既定 50、変更時に `page` を 1 へ戻す。一覧のページ送りは catalog ⑩ canonical `ProductPagination` を使い、独自 markup を残さない。

## Failure Modes

- primary ボタン class が「棚卸しを確定する」「選択」にも残る、または「数を保存」から外れる。
- `selectItem` の `setFieldError(null)` が削除・欠落し、対象切替後も前商品の FieldError が残る。
- FieldError 表示スロットの wrapper（`min-h-5`）が撤去され、エラー出現時にボタン位置がずれる。
- 「対象にありません」が `role="alert"` / `text-destructive` のまま残る、または `Info` icon が付かない。
- 未入力 Badge の tone 分岐が実装されず、N=0 でも warning tone のまま、または N>0 でも success tone のまま。
- `PRODUCT_NAME_SEARCH_QUERY.is_discontinued` が `false` のまま残る、または候補行に廃番 Badge が付かない。
- `useStocktakeItems` の既定 `perPage` が 200（旧固定値）のまま残る。
- 表示件数変更時に `page` が 1 へ戻らない。
- `StocktakeItemList` が catalog ⑩ `ProductPagination` を使わず独自ページ送り markup を残す。

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| S1 primary CTA 1 個 | 「棚卸しを確定する」/「選択」が primary のまま | unit | SC1: counting screen has exactly one primary-styled button | `bg-primary text-primary-foreground`（`button.tsx` variant class の独立転記）を含むボタンが counting 画面（候補表示状態含む）に 2 個以上、または 0 個 |
| S2 FieldError クリア | `selectItem` の `setFieldError(null)` 欠落 | unit | SC2: switching target via candidate selection clears previous FieldError | 前商品で数量負数エラーを出した状態から live 候補（または候補テーブル「選択」）で別商品へ切替えた後も、旧 FieldError 文言が画面に残る。同一 assert 内で新商品名（presence oracle）が表示されていることも確認する |
| S3 FieldError 予約高さ | wrapper 撤去・`min-h-5` 欠落 | unit | SC3: FieldError slot renders at fixed height with and without an error | FieldError なし時に slot 用 wrapper 要素（`min-h-5` class）が存在しない、またはエラー表示時にのみ wrapper 自体が出現する（構造が条件分岐している） |
| S4 対象にありません tone | `role="alert"` / `text-destructive` 残置 | unit | SC4: target-not-found message renders as status info, not an alert | `targetMessage` 表示に `role="alert"` または `text-destructive` が付く、または `Info` icon（`aria-hidden` svg）が存在しない |
| S5 未入力 Badge tone | tone 分岐なし | unit | SC5: uncounted badge tone switches between warning and success | `progress.uncounted_items` が 1 以上のとき `border-warning-border bg-warning-soft text-warning-strong` を含む Badge が無い、または `0` のとき `bg-success` を含む Badge が無い。両ケースとも同一 test 内で assert（tone 混同の見逃し防止） |
| S6 廃番商品の名前検索包含 | `is_discontinued: false` 残置 | unit | SC6: product-name search fallback query includes discontinued products and marks them | `searchProducts` 呼び出し引数の `is_discontinued` が `null` でない（mock 呼び出し引数の直接 assert）。廃番商品が候補に含まれるケースで候補行に「廃番」Badge が無い |
| S8a per_page 既定値 | 既定が 200 のまま | unit | SC8a: default per_page in the initial items query is 50 | `getStocktakeItems` mock 呼び出しの `per_page` 引数が `50` でない |
| S8b per_page 変更時の page reset | page が 1 へ戻らない | unit | SC8b: changing per_page resets page to 1 | 表示件数 `Select` を変更した後の `getStocktakeItems` 呼び出しで `page` が変更前の値のまま（1 以外） |
| S8c' catalog ⑩ 統一 | 独自 markup 残置 | unit | SC8c': list pagination uses the canonical ProductPagination component | 「前のページ」/「次のページ」`aria-label`（`ProductPagination.tsx` から独立転記したリテラル）を持つボタンが存在しない、または表示件数 `Select` の option ラベル「50 件」「100 件」「200 件」が render されない（non-empty presence oracle） |
| 既存 UI-10-D1〜D12 契約の非破壊 | S1〜S6/S8 導入による既存動作の破壊 | regression | SC9: existing StocktakePage / suggest / SPEC-UIBB suites unchanged green | `StocktakePage.test.tsx`（T1〜T23）/ `StocktakePage.suggest.test.tsx`（W5/W7/W8/W12/W17）/ SPEC-UIBB-1/2 のいずれかが fail する |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `fieldError`（数量入力欄） | `null` | — | 入力検証 NG で文言セット | 対象切替（`selectItem`）で `null` へクリア（S2） | — | 別商品を再選択しても直前エラーが残らないことを毎回確認 | 画面再訪（`counting` 再入場）で `null` から開始 | — | 同一商品への再入力でも毎試行置換（DSR-03） | SC2 |
| `targetMessage`（対象確認結果） | `null` | — | `find_stocktake_item` None かつ商品名検索 0 件で文言セット、`role="status"` | 次の `resolveItem` 呼出しで `null` へリセット | — | — | — | — | — | SC4 |
| `perPage`（画面内 state） | `50`（`PRODUCT_PER_PAGE_OPTIONS` 最小値） | — | `Select` 変更で更新 | — | 変更時に `useStocktakeItems` queryKey が変わり自動 refetch | 画面再訪でも初期値 `50` に戻る（永続化しない） | app 再起動で `50` から再開 | — | — | SC8a/SC8b |
| `search.page`（一覧ページ） | `1` | — | ページ送り操作で増減 | `perPage` 変更時に強制的に `1` へ | — | — | — | — | — | SC8b |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| catalog ⑩ `ProductPagination` + `PRODUCT_PER_PAGE_OPTIONS` | `ProductListPage.tsx`（自 feature、perPage Select 先例）/ `InventoryRecordsPage.tsx` / `StockMovementsPage.tsx`（perPage 固定・Select なし） / `OperationLogsPage.tsx` / `StockInquiryPage.tsx`（クロスフィーチャー import 先例、`ProductPagination` のみ） | `StocktakeItemList.tsx` へ `ProductPagination` + perPage `Select` の両方を追加（`StockMovementsPage` 等は Select 非搭載のため perPage Select の直接先例は `ProductListPage.tsx` のみ） | ページ送りの上下 2 箇所配置・`PRODUCT_PER_PAGE_OPTIONS` の値変更（40 刻み化）は catalog ⑩ の配置規約・共有定数改訂を伴うため本 packet では移植しない（Non-scope、④ lane へ委譲） | SC8c' |
| Badge semantic tone（className override） | `StockStatusBadge.tsx`（warning: outline + `border-warning-border bg-warning-soft text-warning-strong`）/ `IntegrityCheckPage.tsx:345-348`（success: `bg-success text-primary-foreground`） | `StocktakeProgressHeader`（S5）の未入力 Badge | 新規 semantic variant の追加はしない（既存 className パターンの再利用のみ） | SC5 |
| 情報系メッセージの tone（`role="status"` + icon） | `73-ui-stocktake.md` §73.9 の元契約（エラー扱いにしない）と実装 drift | `StocktakeCountEntry` の `targetMessage`（S4） | — | SC4 |

## Negative Paths

- missing input: `activeStocktakeId === null` のとき `useStocktakeItems` は `enabled: false` のまま（`perPage` 変更の影響を受けない、既存契約 T1 で被覆済み）。
- invalid input: `Select` は `PRODUCT_PER_PAGE_OPTIONS` の 3 択のみで任意値を送信できない（構造的に不正値が発生しない）。
- duplicate/ambiguous input: 同一商品を続けて選択（counted 済み再指定）しても FieldError クリアは idempotent（S2、既存 T6 と組合せ確認）。
- unknown reference: `find_stocktake_item` が `None` かつ商品名検索も 0 件 → S4 の情報表示（既存 T5 の oracle を tone 是正後の形へ更新）。
- dependency missing: 該当なし（S1〜S8 とも既存 CMD の呼び出しパラメータ変更のみ）。
- permission/write failure: 該当なし（表示・検索クエリのみ、書込み系 API 非接触）。
- dry-run side effect: 該当なし。

## Boundary Checks

- threshold: `progress.uncounted_items` の 0 / 1 境界（S5 tone 分岐、`0` と `1` を隣接 case として両方 assert）。
- null/default: `perPage` 既定 `50`（SC8a）。`targetMessage` / `fieldError` の `null` 初期状態。
- empty/non-empty: SC5 は N>0/N=0 の両 tone を同一 test 内で non-empty presence assert（tone 混同の見逃し防止）。SC8c' は「独自 markup が存在しない」ことと「canonical component が存在する」ことの両方を assert（削除できていないだけで green になる空検証を排除）。
- min/max: `PRODUCT_PER_PAGE_OPTIONS` の最小 `50` / 最大 `200`（IO `PAGINATION_MAX_PER_PAGE` と一致、クランプ不要）。
- status/policy enum: 該当なし。
- wire type: `ProductSearchQuery.is_discontinued: boolean | null`（変更は値のみ）。
- internal type: `perPage: (typeof PRODUCT_PER_PAGE_OPTIONS)[number]`。
- producer/consumer: `commands.searchProducts` / `commands.getStocktakeItems`（producer、既存）→ `StocktakePage.tsx` / `useStocktakeItems.ts`（consumer、本 packet で呼び出し引数のみ変更）。
- round-trip token: なし。
- precision/range: 該当なし。
- cross-language parse: 該当なし。

## Compatibility Checks

- old schema/input: `is_discontinued: false` で保存されていた挙動は「現行品のみ」に絞る後方互換の狭い集合であり、`null` への変更は結果を拡張する方向のみ（既存の狭い一致ケースを壊さない）。
- new schema/input: `perPage` 明示引数化後も既存呼び出し元（`StocktakePage.tsx` 1 箇所のみ、`rg` で確認済み）以外に影響しない。
- output order: 該当なし（`ORDER BY si.id ASC` 無変更）。
- optional field behavior: `is_discontinued: null` は `ProductSearchQuery` 型が既に許容する既存の optional 値（新規追加ではない）。

## Data Safety Checks

- source-derived data: 該当なし。
- generated outputs: 該当なし。
- secrets: 該当なし。
- local-only files: 該当なし（DB/ファイル非接触）。
- synthetic sample boundaries: test の商品名・コード・件数はすべて synthetic。

## Main Wiring / Integration Checks

- helper connected to main path: `useStocktakeItems` の `perPage` 引数が `StocktakePage` の state から実際に配線されていること（SC8a/SC8b で `getStocktakeItems` mock 呼び出し引数を検証）。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- 「棚卸しを確定する」の `variant="outline"` を削除（default に戻す）したら？ → SC1 が fail（primary が 2 個になる）。
- `selectItem` 内の `setFieldError(null)` を削除したら？ → SC2 が fail（前商品のエラーが残る）。
- FieldError スロットの `min-h-5` wrapper を撤去したら？ → SC3 が fail（構造検査で wrapper 不在）。
- `targetMessage` の `role` を `"alert"` に戻したら？ → SC4 が fail。
- 未入力 Badge の tone 分岐を削除し常に `variant="secondary"` に戻したら？ → SC5 が fail（両 case で warning/success class 不在）。
- `PRODUCT_NAME_SEARCH_QUERY.is_discontinued` を `false` に戻したら？ → SC6 が fail（mock 呼び出し引数の assert）。
- `useStocktakeItems` の既定 `perPage` を `200` に戻したら？ → SC8a が fail。
- 表示件数変更時の `page: 1` リセットを削除したら？ → SC8b が fail。
- `ProductPagination` を使わず旧 markup に戻したら？ → SC8c' が fail（aria-label / Select option ラベルの presence oracle）。

## 必須 mutation 注入（Final Review で clean tree 独立再実測）

| # | 注入 | kill 期待 |
|---|---|---|
| X1 | 「棚卸しを確定する」/「選択」ボタンから `variant="outline"` を削除する（default に戻す） | SC1 |
| X2 | `selectItem` 内の `setFieldError(null)` を削除する | SC2 |
| X3 | FieldError スロットの `min-h-5` wrapper 常時 render を撤去し条件分岐に戻す | SC3 |
| X4 | `targetMessage` 表示を `role="alert"` + `text-destructive` に戻す | SC4 |
| X5 | 未入力 Badge の tone 分岐を撤去し常に `variant="secondary"` に戻す | SC5 |
| X6 | `PRODUCT_NAME_SEARCH_QUERY.is_discontinued` を `false` に戻す | SC6 |
| X7 | `useStocktakeItems` の既定 `perPage` を `200` に戻す | SC8a |
| X8 | 表示件数変更時の `page: 1` リセット呼び出しを削除する | SC8b |
| X9 | `StocktakeItemList` のページ送りを `ProductPagination` から旧手書き markup へ差し戻す | SC8c' |

## Residual Test Gaps

- Badge/Button の視覚トーン・レイアウトずれ（S1/S3/S4/S5/S8）は happy-dom の class 検査で構造は保証できるが、実際の色・余白の見た目は AC-L3-1〜AC-L3-5（owner Windows native）で被覆する。
- S6 の live 候補プレビュー（`ProductAddSuggest`）側の `is_discontinued` フィルタが `PRODUCT_NAME_SEARCH_QUERY` と独立したクエリ定数を持つ場合、SC6 は商品名検索フォールバック経路のみを直接 assert し、live 候補経路は Contract Probe（packet 本体）の確認結果に応じて Writer が同型 test を追加する。
