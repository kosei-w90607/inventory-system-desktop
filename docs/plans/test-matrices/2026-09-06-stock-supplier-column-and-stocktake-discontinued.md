# Test Design Matrix: (d) 在庫少一覧の取引先列 + 棚卸し廃番 badge + R2-3（⑨）

Plan Packet: [../2026-09-06-stock-supplier-column-and-stocktake-discontinued.md](../2026-09-06-stock-supplier-column-and-stocktake-discontinued.md)

## Risk

R3（在庫少・在庫切れ一覧の並び順変更、棚卸しリストへの badge 追加、在庫照会の展開行クリック挙動変更という operator workflow 変更 + `StocktakeItemDetail` DTO フィールド追加 + specta bindings 再生成を伴う）。render の実際の見た目は happy-dom で完全には判定できないため L3 が oracle、本 Matrix は DOM/データ契約（列・並び順・class・DTO フィールド）に限定する。

## Contracts Under Test

- SC1（UI-06a-D4）: `filterAndSortLowStockList`（旧 `filterLowStockList`）が、フィルタ後の結果を `supplier_name`（null 最後、非 null は昇順）→ `stock_quantity` 昇順 → `name` 昇順で安定ソートする
- SC2（UI-06a-D4）: `ProductListTable.tsx` に取引先列（商品コード/商品名/部門/**取引先**/状態/在庫数/売価の 7 列）が追加され、`supplier_name` が `null` のとき `—` を表示する
- SC3（UI-06a-D4）: 展開行の `colSpan` が `7`（旧 `6` は残らない）
- SC4（UI-06a-D5）: 選択中の行を再クリックすると `onSelect` が `null` で呼ばれ、`selected` URL state が `undefined` になる（詳細展開が閉じる）
- SC5（UI-06a-D5）: 自動展開は同一検索条件（`status`/`q`/`dept`/`page`）内で 1 度のみ発火する。手動クローズ（`selected` が `null` に戻る）後、同じ条件で `listItems.length === 1` のままでも再展開しない。条件が変化した後、新しい条件で `listItems.length === 1` なら再展開する
- SC6（UI-10-D13）: `StocktakeItemDetail` に `is_discontinued: bool` が追加され、`find_stocktake_item_by_code` と `list_stocktake_items` の両経路で商品の実際の `products.is_discontinued` 値が正しく返る
- SC7（UI-10-D13）: `StocktakePage.tsx` の一覧テーブルで、`item.is_discontinued === true` の行にのみ「廃番」badge（`variant="secondary"` + `border-border-strong` class + `Archive` icon）が表示される
- SC8（「すべて」view 非干渉、compatibility）: `source === "search"` の一覧（`ProductListPage` 系ではなく在庫照会の「すべて」チップ）の並び順・列構成が本 lane で変化しない

## Failure Modes

- 取引先列が表示されない、または列の位置・ヘッダ文言が仕様と異なる
- ソートが取引先名以外を主キーにしている、取引先 null が先頭/中間に来る、同名内の副次ソート（在庫数→商品名）が崩れる
- `colSpan` が更新されず `6` のまま残り、展開行が最終列にはみ出す/欠ける
- 再クリックしても閉じない（`onSelect` が旧 `product_code` のまま呼ばれる）
- 自動展開の guard が検索条件の変化を正しく検出できず、(a) 条件が変わっても再展開しない（別の商品 1 件に絞り込んでも自動で開かない）、または (b) 条件が変わっていないのに再展開する（手動クローズが打ち消される）
- `StocktakeItemDetail` の 2 つの構築箇所のうち片方だけに `is_discontinued` を追加し、もう片方が既定値（`false` 固定等）で誤魔化される
- badge が全行に出る、または `border-border-strong` を持たない（既存の枠なし secondary badge と同じ見づらさを複製する）
- 「すべて」view の並び順・列構成が誤って変更される

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 取引先ソート（UI-06a-D4） | ソートキー順序誤り / null 処理誤り | unit（`filter-low-stock-list.test.ts` 拡張） | SC1: `filterAndSortLowStockList` は 3 商品（取引先 A / 取引先 B / 取引先なし〈null〉、独立転記した期待順）を入力し、返り値の順序が 取引先名昇順（null 最後）→ 在庫数昇順 → 商品名昇順 と完全一致する。同一取引先内で在庫数が同値の 2 商品を含め、商品名で副次ソートされることも確認する | 取引先名でソートされない、null が先頭/中間に来る、同一取引先内の副次ソートが働かない、または既存フィルタ機能（status/dept/q）が壊れる |
| SC2 取引先列（UI-06a-D4） | 列欠落 / null 表示誤り | unit（`ProductListTable.test.tsx` 拡張） | SC2: `source="low_stock"` の一覧で取引先列ヘッダ「取引先」が存在し、`supplier_name: "取引先A"` の行に「取引先A」、`supplier_name: null` の行に「—」が表示される | 列が存在しない、ヘッダ文言が異なる、または null 表示が空文字/undefined になる |
| SC3 colSpan（UI-06a-D4） | DOM 構造崩れ | unit（`ProductListTable.test.tsx` 拡張、fs literal） | SC3: `rg -Fc 'colSpan={7}' src/features/stock-inquiry/components/ProductListTable.tsx` = 1 かつ `rg -Fc 'colSpan={6}' src/features/stock-inquiry/components/ProductListTable.tsx` = 0（static oracle）。加えて展開行 `<TableCell colSpan={7}>` が実際に render されることを RTL で確認 | `colSpan` が 6 のまま残る、または 7 への更新が別箇所に漏れる |
| SC4 展開行トグルクローズ（UI-06a-D5） | 再クリックで閉じない | unit（`ProductListTable.test.tsx` 拡張） | SC4: 選択中の行（`selected` prop が該当 `product_code` と一致）を再度クリックすると、`onSelect` が `null` を引数に呼ばれる。別の行をクリックした場合は当該行の `product_code` で呼ばれる（回帰） | 再クリックで `onSelect` が呼ばれない、または旧 `product_code` のまま呼ばれて閉じない |
| SC5 自動展開の条件単位制限（UI-06a-D5） | guard 誤動作 | unit（`useStockInquiry.test.tsx` 拡張） | SC5a: 検索条件が同一のまま `listItems.length === 1` で `selected` が `null` → `undefined`（手動クローズ相当）に変化しても `navigate` が再度呼ばれない。SC5b: `status`/`q`/`dept`/`page` のいずれかが変化した後、新しい条件で `listItems.length === 1` かつ `selected === null` なら `navigate` が呼ばれる（既存の自動展開が生きていることの回帰確認） | SC5a: 手動クローズ後に同条件で自動再展開してしまう。SC5b: 条件変化後の自動展開が壊れる（既存 test `REQ-301: 結果 1 件で詳細カード自動展開` の回帰） |
| SC6 `StocktakeItemDetail.is_discontinued`（UI-10-D13） | 片方の経路だけ反映 / 既定値誤魔化し | unit（`stocktake_repo.rs` `#[cfg(test)]` 拡張） | SC6a: `test_list_stocktake_items_req205_includes_is_discontinued` — 廃番商品 1 件 + 非廃番商品 1 件を fixture に含む棚卸しで `list_stocktake_items` を呼び、返り値の `is_discontinued` が商品ごとの実値と一致する。SC6b: `test_find_stocktake_item_by_code_req205_includes_is_discontinued` — 同様に `find_stocktake_item_by_code` で廃番商品を検索し `is_discontinued: true` が返る | いずれかの経路で `is_discontinued` が常に `false`（未反映）、または実際の商品状態と一致しない |
| SC7 廃番 badge 表示（UI-10-D13） | 全行表示 / 枠・icon 欠落 | unit（`StocktakePage.test.tsx` 拡張） | SC7: 廃番商品の行に「廃番」テキストを含む要素が存在し、その要素（または祖先）が `border-border-strong` class を持ち、`Archive` icon（`svg` 子要素、`aria-hidden="true"`）を含む。非廃番商品の行には「廃番」テキストが存在しない（対で確認、空集合 oracle を避ける） | badge が非廃番行にも出る、廃番行に出ない、または `border-border-strong` class を持たない（既存の枠なし badge と同じ見づらさを複製する mutant） |
| SC8 「すべて」view 非干渉 | 意図しない副作用 | unit（`ProductListTable.test.tsx`/`useStockInquiry.test.tsx` 既存 test の無変更 pass 確認） | SC8: `source="search"` の既存 test（並び順・列構成に関する既存 assertion）が本 lane の変更後も無変更で pass する | 取引先列 or ソートが `source="search"` 側にも意図せず適用される |

## Mutation Oracle Notes

- SC1 は「取引先名でソートされる」ことに加えて「同一取引先内の副次ソート（在庫数→商品名）が働く」ことを同一 test 内で対に確認し、mutant「主キーだけ合っていて副次キーが無視される」を検出する。期待順序は production のソート関数から独立に手で転記する（`test-oracle-must-not-share-ssot` の教訓に倣う）
- SC4/SC5 は「再クリックで閉じる」と「同条件では再展開しない」を分離した 2 つの Contract として扱う。両方を 1 test に混ぜると、片方だけ壊れた mutant（例: 再クリックは効くが guard が効かず即座に再展開される）を見逃す
- SC5 は「条件が変わらない限り再展開しない」（SC5a）と「条件が変われば再展開する」（SC5b）を対のオラクルにする。SC5a 単独だと guard を常時 true にする mutant（一切自動展開しない）を kill できない
- SC6 は 2 つの構築箇所（`find_stocktake_item_by_code`/`list_stocktake_items`）を独立した test として書く。1 test に統合すると、どちらか片方が未反映でも「もう片方が正しいから全体は pass」という偽陽性を生む
- SC7 は非廃番行の「廃番」テキスト不在を同一 test 内で確認し、badge が常に表示される mutant（空集合オラクル回避）を検出する。border class の検査は、text 存在確認だけでは「枠なしのまま」の mutant を見逃すため必須

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC1〜SC5, SC7, SC8 は vitest、SC6 は cargo test。S5（bindings 再生成）と S7（docs 同期）は `git diff`/`rg` の docs review オラクルで Plan Packet 側の完了条件に記載済み、本 Matrix には独立行を立てない（Plan Packet Registration / Generation Obligations 参照）。
