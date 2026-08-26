# Test Design Matrix: 商品一覧 plu filter の returnTo 脱落 fix

対象: `src/features/products/lib/return-to.ts` / `return-to.test.ts` / `src/features/products/ProductListPage.test.tsx`（T4、gated amendment 1 で追加）。
Packet: [2026-08-26-plu-returnto-fix.md](../2026-08-26-plu-returnto-fix.md)（SPEC-PLURT-2026-08-26）。

方針:

- oracle は期待文字列 / 期待 object の literal 転記とし、production 定数（`PRODUCT_PLU_OPTIONS` 等）から導出しない（test oracle 独立性）。
- 既存 3 test（`allows only product list route with search params` / `rejects product form/import, external URL, and unrelated routes` / `round-trips product list search params for navigation`）は無改変。新規 case は新規 test 内へ隔離する。
- 空集合期待の case を単独 oracle にしない。T1 / T2 は非空・非既定値（`pending` / `synced`）を期待する。

## Matrix

| ID | Spec / Decision ID | 目的 | 入力 / 手順 | oracle（literal） | kill 対象 mutant |
|---|---|---|---|---|---|
| T1 | SPEC-PLURT C1 / UI-01a-D10 | build が plu を serialize する | `buildProductListReturnTo({ q: "毛糸", plu: "pending", page: 2 })` | 戻り値が `"/products?q=%E6%AF%9B%E7%B3%B8&plu=pending&page=2"` と完全一致（param 出力順は実装確定後に Writer が literal 固定、`plu=pending` の部分一致 fallback は不可） | build の `params.set("plu", ...)` 行削除 → red |
| T2 | SPEC-PLURT C1+C2 / UI-01a-D10 | 8 param 完全往復 | `buildProductListReturnTo({ q: "リボン", dept: 3, discontinued: "all", plu: "synced", sort: "name", dir: "desc", page: 4, perPage: 200 })` → `parseProductListSearchFromReturnTo` | parse 結果が入力 object と `toEqual` 完全一致（8 field 全列挙の literal、部分 match 不可） | build 側 serialize 削除 → red / parse 側 `plu` 復元削除 → red（`plu: undefined` になり不一致） |
| T3 | SPEC-PLURT C2（負系・互換） | plu 欠落の旧 returnTo 互換 | `parseProductListSearchFromReturnTo("/products?q=%E5%B8%83&page=2")` | 結果の `plu` が `undefined`（`toEqual` で `q: "布", page: 2` + 他 field undefined の全列挙） | parse が欠落時に `"all"` 等を捏造する mutant → red |
| 既存 | SPEC-PLURT C3 | sanitize 契約維持 | 既存 sanitize 2 test（無改変） | 既存 oracle のまま | — （退行検知） |
| 既存 | SPEC-PLURT C4 | 7 param 往復維持 + plu 未設定時に emit しない | 既存 `round-trips product list search params for navigation`（無改変。入力に plu なし、期待文字列に `plu` 出現なし） | 既存 exact 文字列 oracle のまま | build が plu undefined 時にも `plu=undefined` 等を emit する mutant → red（既存 exact match が検知） |
| T4 | SPEC-PLURT C1 / §50.4 既定値 `all`（gated amendment 1） | 既定 search の returnTo に `plu=all` が明示 serialize される（integration、正規化済み object 経由） | `ProductListPage.test.tsx` の既存 returnTo 期待 literal 2 箇所へ `plu%3Dall` を追記（test 構造・他 assertion 無改変） | 既存 integration test の期待 href literal 完全一致（oracle は流用、literal のみ同期） | build の `params.set("plu", ...)` 行削除 → red（literal 不一致で検知） |

## 検出境界

- 無効 enum 値（`plu=bogus`）の `all` 正規化は `/products` route の `productListSearchSchema` `.catch(undefined)` + `normalizeProductListSearch`（`src/routes/products/index.tsx:12` 結線）が既存所有であり、parse 単体は既存 pattern（`discontinued` / `sort` / `dir` と同型の cast 素通し）に合わせる。本 Matrix は parse 単体に enum 検証を新設しない — ここに test を足すと既存 3 param の cast 方式との非対称が生じ、正規化所有が二重化するため。
- 視覚確認 1 項目（dev 画面で `plu` filter → 修正 → 保存 → 戻りで filter 維持）は自動 test の外に置く。route 統合（Link → navigate → schema）の実挙動は視覚確認が受け持つ。

## 実行

- `npx vitest run src/features/products/lib/return-to.test.ts` exit 0（T1〜T3 + 既存 3 test）。
- `npx vitest run src/features/products/ProductListPage.test.tsx` exit 0（T4、gated amendment 1）。
- mutation 実証（AC8）は Final Review が commit 後の clean tree 上で T1 / T2 の kill 対象 mutant を実注入して red を独立再現する。
