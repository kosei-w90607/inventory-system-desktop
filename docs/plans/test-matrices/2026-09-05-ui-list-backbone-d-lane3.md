# Test Design Matrix: UI 一覧の背骨 D — Lane 3（perPage Select 横展開 / 件数文言自然文化 / backend 上限 200）

Plan Packet: [../2026-09-05-ui-list-backbone-d-lane3.md](../2026-09-05-ui-list-backbone-d-lane3.md)

## Risk

R3（route/search state の新設 6 画面 + backend バリデーション契約変更）。render の実追従（Select の見た目・帯の太さ）は happy-dom で判定できないため L3 が oracle、本 Matrix は DOM 構造・class・文言・配線・backend 境界値の契約に限定する。

## Contracts Under Test

- SC1: `LIST_PER_PAGE_OPTIONS` の値・移設・旧名 0 hit（L3-D2）
- SC2: `PaginationSummary` の `font-semibold` 撤去 + `.text-base` selector 移行（L3-D5）
- SC3: `rangeText` 新文言（上限・端数・0 件境界、L3-D1）
- SC4a〜SC4f: 6 画面（在庫照会/入出庫履歴/在庫変動履歴/操作ログ/一括価格改定/整合性チェック）の Select 配線・既定値・request/slice 反映
- SC5: `MAX_PER_PAGE` 200 boundary（`list_inventory_records` / `list_movements` の 200 OK・201 NG）
- SC6: 既存 3 test（`list_receivings`/`list_inventory_records`/`list_movements` の exceeds-max）の境界値更新
- SC7: 商品一覧・棚卸しの import 元切替後の非退行（既存既定値・既存 test 無変更）

## Failure Modes

- `LIST_PER_PAGE_OPTIONS` が旧値と異なる、または `PRODUCT_PER_PAGE_OPTIONS` が残存し二重定義になる
- `font-semibold` が残る、または `.text-base` selector が下部 `Pagination` の要素と誤って一致する
- `rangeText` の off-by-one / 0 件契約破壊 / 旧文言残存
- 6 画面いずれかで Select 未配線、既定値相違、perPage 変更が反映されない、または page が 1 に戻らない
- 入出庫履歴・在庫変動履歴で 200 選択時に `ValidationFailed` が発生する
- `MAX_PER_PAGE` 引き上げにより既存の「上限超過」test が無意味化（101 が通ってしまう）まま放置される
- 整合性チェックの Select が backend request を誤って発火する、または slice 件数が変わらない
- 商品一覧・棚卸しが import 元切替で既定値・挙動を退行させる

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 定数移設 | 値相違 / 旧名残存 / 二重定義 | unit（新規 `list-per-page.test.ts`） | SC1: LIST_PER_PAGE_OPTIONS equals [50, 100, 200] (independently transcribed) and is imported by search.ts, priceRevisionSearch.ts, ProductListPage.tsx, StocktakePage.tsx | 独立転記した `[50, 100, 200]` と不一致、または `rg -n "PRODUCT_PER_PAGE_OPTIONS" src` が 1 件以上 |
| SC1 既存 test 移行 | 定数 import 元の更新漏れ | unit（既存 `search.test.ts:187` 更新） | SC1b: search.test.ts asserts LIST_PER_PAGE_OPTIONS (re-exported or imported) equals [50, 100, 200] | import 元を旧 module のままにした場合に test 自体が resolve に失敗する（TS コンパイルエラーで検出） |
| SC2 font-semibold 撤去 | class 残存 | unit（`Pagination.test.tsx` SC3c 更新） | SC2: PaginationSummary renders text-base text-foreground tabular-nums and does NOT include font-semibold | classList に `font-semibold` が含まれる、または `text-base` が欠落 |
| SC2 selector 移行 | 上部/下部の取り違え | unit（`ListShell.test.tsx:96,116` / `ProductListPage.test.tsx:628,654` 更新） | SC2b: ListShell / ProductListPage top summary is uniquely selected by `.text-base` (not `.text-base.font-semibold`), and this selector does not match the bottom Pagination's text-sm range div | `.text-base` が 0 件または 2 件以上に一致する、あるいは下部 `Pagination` の要素と誤って一致する |
| SC3a 新文言（範囲） | off-by-one / 未 clamp | unit（`Pagination.test.tsx` SC3a 更新） | SC3a: Pagination shows "全 1,234 件のうち 1,001〜1,100 件を表示（11 / 13 ページ）" for page 11 perPage 100 total 1234, "全 1,234 件のうち 1,201〜1,234 件を表示（13 / 13 ページ）" for page 13, and "全 101 件のうち 101〜101 件を表示（3 / 3 ページ）" for page 3 perPage 50 total 101 | 文字列完全一致（独立転記、検算は Lane 2 SC3a と同一算術）が不成立、または旧文言「件中」「件目」が残る |
| SC3b 0 件契約（維持） | 「0 件のうち」等への変質 | unit（`Pagination.test.tsx` SC3b、無変更） | SC3b: Pagination with totalCount 0 renders "0 件" only（回帰確認、new format 化で 0 件文言が壊れていないこと） | text が「0 件」以外になる |
| SC3c ListShell/ProductList 文言反映 | 新文言が全 caller に伝播しない | unit（`ListShell.test.tsx:106` / `ProductListPage.test.tsx:630` 更新） | SC3c: ListShell / ProductListPage top summary shows "全 25 件のうち 1〜10 件を表示（1 / 3 ページ）" / "全 150 件のうち 1〜100 件を表示（1 / 2 ページ）" | 旧文言が残る、または `rangeText` 変更が `PaginationSummary` 経由の caller に反映されていない |
| SC3d 旧文言 0 hit（横断） | 4 file の更新漏れ | unit（既存 test 更新: `IntegrityCheckPage.test.tsx:410` / `StockInquiryPage.test.tsx:491` / `OperationLogsPage.test.tsx:257,269,396,408`） | SC3d: 各 Page test は新文言「全 {n} 件のうち…」を assert し、旧文言「件中」「件目」を含まない | いずれかの test が旧文言のまま残る（`rg -Fn "件中|件目" src --glob '*.test.tsx'` が偽陽性 4 箇所以外で 1 件以上） |
| SC4a 在庫照会 Select | 未配線 / 既定値相違 | unit（`StockInquiryPage.test.tsx` 新規） | SC4a: selecting per-page 100 in StockInquiryPage's Select causes the next searchProducts call to use per_page 100（既定 50 は変更前と同値） | Select 変更後も `per_page` が 50 のまま、または初期値が 50 でない |
| SC4b 入出庫履歴 Select | 未配線 / page 未 reset | unit（`InventoryRecordsPage.test.tsx` 新規） | SC4b: selecting per-page 200 causes the next list_inventory_records-equivalent request to use per_page 200 and resets page to 1 | request の `per_page` が変わらない、または page が 1 に戻らない |
| SC4c 在庫変動履歴 Select | 未配線 / page 未 reset | unit（`StockMovementsPage.test.tsx` 新規） | SC4c: selecting per-page 200 causes the next list_movements request to use per_page 200 and resets page to 1 | 同上（SC4b と同型） |
| SC4d 操作ログ Select | 未配線 | unit（`OperationLogsPage.test.tsx` 新規） | SC4d: selecting per-page 200 causes the next list_logs request to use per_page 200 | request の `per_page` が変わらない |
| SC4e 一括価格改定 Select | 未配線 / URL 未反映 | unit（`PriceRevisionPage.test.tsx` 新規） | SC4e: selecting per-page in PriceRevisionPage's Select updates the URL search perPage and the next product list request | URL の `perPage` が変わらない、または request に反映されない |
| SC4f 整合性チェック Select（client-side） | slice 件数不変 / 誤った backend request | unit（`IntegrityCheckPage.test.tsx` 新規） | SC4f: selecting per-page 50 in IntegrityCheckPage limits the visible mismatch rows to at most 50 per page, without adding a new listLogs/searchProducts call beyond the existing check-status query | 表示行数が 50 を超える、または新規 backend call が発火する |
| SC5a 200 OK（入出庫履歴） | 誤って ValidationFailed | unit（`list.rs` 新規） | SC5a: list_inventory_records accepts per_page 200 and returns Ok | `unwrap()` が panic する（`Err` が返る） |
| SC5b 200 OK（在庫変動履歴） | 誤って ValidationFailed | unit（`list.rs` 新規、`inventory_cmd.rs` と対） | SC5b: list_movements accepts per_page 200 and returns Ok | 同上 |
| SC5c 201 NG（維持、境界値更新） | 境界値が古いまま無意味化 | unit（`list.rs:321`,`list.rs:503`,`inventory_cmd.rs:111` 更新） | SC5c: test_list_receivings_req201_per_page_exceeds_max / test_list_inventory_records_req206_rejects_invalid_page_params / test_list_movements_req303_per_page_exceeds_max use per_page 201 and expect ValidationFailed | per_page が 101 のまま残っていると `unwrap_err()` が `Ok` を受け取り panic する（更新漏れの直接検出） |
| SC6 商品一覧・棚卸しの非退行 | import 元切替で既定値破壊 | unit（既存 `ProductListPage.test.tsx` / `StocktakePage.test.tsx`、無変更のまま pass 必須） | SC6: ProductListPage defaults to per_page 100, StocktakePage defaults to per_page 50, both unaffected by the LIST_PER_PAGE_OPTIONS move | いずれかの既定値が変わる、または import 解決エラーで test が落ちる |
| SC7 空集合 oracle | 空集合期待の組合せが mutant を素通し | unit（`IntegrityCheckPage.test.tsx` 新規、非空 1 case を含める） | SC7: with 0 mismatches, IntegrityCheckPage's per-page Select is present but the list renders no rows regardless of selection（非空 case は SC4f が担当、本 test は 0 件 case 専用） | 0 件時に Select 自体が消える、または非空 case との組合せ mutant が両方 pass してしまう（0 件 test を独立させることで検出） |

## Mutation Oracle Notes

- SC1/SC5c は「独立転記 + 完全一致」を徹底する。production 定数・本番 `MAX_PER_PAGE` からの逆算で期待値を作らない（`feedback-test-oracle-must-not-share-ssot` の教訓）
- SC3a〜SC3d の anchor は `rg -Fn` の literal 一致に限定し、汎用語（「件」単独等）を anchor にしない（`feedback-matrix-anchor-uniqueness` の教訓。「全 {n} 件のうち」「{from}〜{to} 件を表示」の複合文字列を anchor にする）
- SC2b の `.text-base` selector 一意性は、下部 `Pagination` の DOM 上に `text-base` を持つ要素が存在しないことを毎回 assert してから上部要素を取得する（selector 衝突の回帰防止）
- SC5a/SC5b（非空・200 OK）と SC5c（201 NG）は対のオラクルとして扱い、どちらか一方だけを更新した状態で mutation を注入した場合に必ずもう一方が落ちるよう、同一 test file 内に隣接して配置する
- SC7 は 0 件 case を独立 test にする（`empty-set-oracle-collision` の教訓: 非空期待の SC4f と混在させると、0 件へ縮退させる mutant を両方の test が素通しし得る）

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。ledger 側で「non-scope（docs review）」とした行（DSR-22 pin / catalog ⑩ pin / 3 design doc の上限値記述）は自動テストを持たないため本 Matrix に対応行を置かない — 実装後の docs review（`rg` 完全一致確認）が oracle になる。
