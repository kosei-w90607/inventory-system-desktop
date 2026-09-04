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
- SC8: 設計 doc 10 箇所の旧表記→新表記 対 anchor + `docs/decision-log.md` D-081 entry / D-031 付記の存在（Plan Review round 1 P1-2/P1-3、AC10/AC10b と対）

## Failure Modes

- `LIST_PER_PAGE_OPTIONS` が旧値と異なる、または `PRODUCT_PER_PAGE_OPTIONS` が残存し二重定義になる
- `font-semibold` が残る、または `.text-base` selector が下部 `Pagination` の要素と誤って一致する
- `rangeText` の off-by-one / 0 件契約破壊 / 旧文言残存
- 6 画面いずれかで Select 未配線、既定値相違、perPage 変更が反映されない、または page が 1 に戻らない
- 入出庫履歴・在庫変動履歴で 200 選択時に `ValidationFailed` が発生する
- `MAX_PER_PAGE` 引き上げにより既存の「上限超過」test が無意味化（101 が通ってしまう）まま放置される
- 整合性チェックの Select が backend request を誤って発火する、または slice 件数が変わらない
- 商品一覧・棚卸しが import 元切替で既定値・挙動を退行させる
- 設計 doc 10 箇所のいずれかで旧表記「上限100」系が残る、または D-081 entry が `docs/decision-log.md` に存在しない・D-031 に付記されない

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
| SC8a 設計 doc 10 箇所の対 anchor | 旧表記残存 | docs review（`rg -Fn`、非 vitest/cargo） | SC8a: each of the 10 design-doc locations shows 0 hits for its old wording and ≥1 hit for its new wording（Plan Packet AC10 の file 別 anchor 列挙どおり、`21-io-inventory-repo.md:7` / `44-cmd-inventory.md:161,1056` / `65-inventory-record-traceability.md:86` / `61-ui-receiving.md:105` / `63-ui-return-exchange.md:118` / `64-ui-disposal.md:106` / `66-ui-stock-movements.md:85` / `62-ui-manual-sale.md:143` / `10-common-rules.md:91`） | 10 箇所のいずれかで旧表記「上限100」系（またはその画面固有表記）が 1 件以上残る、または新表記が 0 件 |
| SC8c UI 契約 4 file の固定 perPage 記述（Gated Amendment 1） | 固定 perPage 契約の残存 | docs review（`rg -Fn` / `rg -n`、非 vitest/cargo） | SC8c: Plan Packet AC10c の表記別 anchor（`66-ui-stock-movements.md:62,103` camelCase + sample / `74-ui-operation-logs.md:58,189,262,578` / `75-ui-integrity-check.md:101,102,183` 件固定 / `58-ui-stock-inquiry.md:147,240,454`）がすべて旧 0 / 新 ≥1。起票時 hit 数（1 / 1 / 1 / 1 / 1 / 1 / 2 / 1 / 3 / 1）を AC10c に併記し vacuous oracle を排除 | 4 file のいずれかで固定 perPage の旧記述（camelCase / snake_case / 「件固定」）が 1 件以上残る、または新記述「既定 50」「既定 100」が 0 件 |
| SC9a perPage 変更で先頭 scroll（Gated Amendment 2 A2-a、DSR-17 ①） | 変更後も途中位置のまま | vitest（8 Page test、`scrollPageToTop` を `vi.mock("@/lib/page-scroll")` で mock） | SC9a: 表示件数 Select の変更で `scrollPageToTop` が 1 回呼ばれる（8 画面各 1 case）。対照 case: ページ送り button では呼ばれない（1 画面で可）。mutant X15 = handler から呼出しを外す → 8 case fail | いずれかの画面で呼出し 0 回、または対照 case で呼ばれる |
| SC9b 操作種別 registry の網羅（A2-c） | 現行機能のログが「その他（raw）」fallback | vitest（`operation-type-labels.test.ts` 新規 or 既存拡張） | SC9b: 5 key（`product_price_revise` / `product_bulk_plu_target` / `plu_register_snapshot_import` / `supplier_rename` / `supplier_merge`）の `category` / `label` を test 側に独立転記した literal と完全一致比較。mutant X16 = `product_price_revise` entry 削除 → fail | 5 key のいずれかが未登録、または label が転記と不一致 |
| SC9c 操作ログ native 入力欄の token（A2-b） | `--border` 残存で濃淡差 | docs review（`rg`、AC15）→ `16c10be` で vitest 化（`OperationLogsPage.test.tsx` の `toHaveClass`、3 要素） | SC9c: 旧 class 3 箇所 0 hit + `border-input bg-control-surface` ≥ 3、vitest で 3 要素の class を assert。mutant X17 / X17b = kill | 旧 class が 1 件以上残る、または 3 要素のいずれかで token 欠落 |
| SC10a perPage 変更後の最終 scroll 位置（Gated Amendment 3 A3-a / A3-b、内蔵復元との後勝ち） | 復元 cache の直接代入が先頭 scroll を上書きし viewport が途中に残る | vitest（`OperationLogsPage.scroll-restoration.test.tsx` 新規、本番 `createAppRouter` + 実 routeTree、`behavior:"smooth"` の `scrollTo` は no-op spy） | SC10a: page 1 で 640 → 次のページ → page 2 で 900 → 表示件数 100 の後、`main.scrollTop === 0`。是正前 fail（`640`）を記録。mutant X18 = `onRendered` の flag 消費を外す → fail | 最終 `scrollTop` が 0 でない |
| SC10b flag の期限と戻り復元の共存（A3-a） | navigate を伴わない `scrollPageToTop` 後の正規「戻り」復元が壊れる | vitest（`app-router.test.tsx` 追加 2 case、fake timers） | SC10b: flag 期限切れ後の一覧→詳細→戻りは保存位置へ復元（T5/T10/T11 と同値）、flag 有効中の render は先頭。mutant X19 = 期限判定を外す → 期限切れ case が fail | 戻り復元が先頭に固定される、または期限内 render が復元される |
| SC10c SC9a の限界の記録（A3-c） | 呼出し回数 assert だけでは復元との競合を検出できない | 記録のみ（Matrix） | SC10c: SC9a は「handler が呼ぶ」契約、SC10a が「最終位置」契約。両方を保つ | — |
| SC8b decision-log D-081 新規 + D-031 付記 | entry 欠落 / 付記漏れ | docs review（`rg -Fn`、非 vitest/cargo） | SC8b: docs/decision-log.md contains exactly one `## D-081` heading and one `Superseded in part by: D-081` line inside the D-031 entry（`:220-227`） | `rg -Fn "## D-081" docs/decision-log.md` が 0 または 2 件以上、あるいは `Superseded in part by: D-081` が D-031 entry 範囲内に存在しない |

## Mutation Oracle Notes

- SC1/SC5c は「独立転記 + 完全一致」を徹底する。production 定数・本番 `MAX_PER_PAGE` からの逆算で期待値を作らない（`feedback-test-oracle-must-not-share-ssot` の教訓）
- SC3a〜SC3d の anchor は `rg -Fn` の literal 一致に限定し、汎用語（「件」単独等）を anchor にしない（`feedback-matrix-anchor-uniqueness` の教訓。「全 {n} 件のうち」「{from}〜{to} 件を表示」の複合文字列を anchor にする）
- SC2b の `.text-base` selector 一意性は、下部 `Pagination` の DOM 上に `text-base` を持つ要素が存在しないことを毎回 assert してから上部要素を取得する（selector 衝突の回帰防止）
- SC5a/SC5b（非空・200 OK）と SC5c（201 NG）は対のオラクルとして扱い、どちらか一方だけを更新した状態で mutation を注入した場合に必ずもう一方が落ちるよう、同一 test file 内に隣接して配置する
- SC7 は 0 件 case を独立 test にする（`empty-set-oracle-collision` の教訓: 非空期待の SC4f と混在させると、0 件へ縮退させる mutant を両方の test が素通しし得る）

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。ledger 側で「non-scope（docs review）」とした行のうち DSR-22 pin / catalog ⑩ pin（文言・定数名・weight）は SC3d / 個別 docs review に含める。設計 doc 10 箇所の上限値記述と decision-log D-081/D-031 は SC8a/SC8b で `rg -Fn` の docs review オラクルとして本 Matrix に明示した（vitest/cargo ではない静的検査だが、Plan Gate/Final Review の再検証対象として Test Matrix に含める）。`66-ui-stock-movements.md` の `per_page` 固定記述改訂のみ SC4c/SC8a の両方に関連する（Contract Coverage Ledger の AC8 行と対）。
