# Test Design Matrix: 画面遷移の戻り先（returnTo）を型で守る

対象 packet: [2026-09-25-nav-return-to-types](../2026-09-25-nav-return-to-types.md)。行番号は base `85b18a04` のもの。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-NAV-RETURN-TYPES-2026-09-25 C1: `returnToLinkProps(value, options?)` は合格値だけを `{ to, search }` で返し、欠落・不正・解析不能・pin 不一致は `null`。throw しない
- C2: 戻り値の型は `{ to: string; search: Record<string, unknown> } | null`（呼出側の分岐を型で強制）
- C3: `null` のとき業務記録詳細 6 画面は `/inventory/records`、在庫変動履歴は `/stock?q=<code>&selected=<code>`（変更前と同じ）
- C4: `detailReturnTo` は正規化した search と入れ子 `returnTo` を router の既定の直列化で運び、受け側の schema で元の search に戻る。現行の値の範囲で href は変更前と同一
- C5: 在庫照会 → 在庫変動履歴 → 業務記録詳細 → 戻る 2 回で、各段の href が行きと文字列一致する
- 維持: DSR-15 の guard（`normalizeReturnTo` / `parseReturnTo`）、UI-06c-D9 の pin と fallback、DSR-17 (a) の `<Link>` push

## Failure Modes

- FM1: helper が不合格時に空の `to` を返し、呼出側が素通しして押しても遷移しない戻り link を描画する（backlog `:28` の起点）
- FM2: 戻り値の型から `null` が落ち、新しい呼出側が分岐を書かずに typecheck を通る
- FM3: `null` の分岐で既定の戻り先を取り違える（6 画面のどれかが `/inventory/records` 以外へ、在庫変動履歴が `q` / `selected` を落とす）
- FM4: pin 判定が外れ、「在庫照会へ戻る」が `/stock` 以外へ着地する
- FM5: `detailReturnTo` の直列化を変えた結果、key 順・既定値の省略・入れ子 `returnTo` の符号化が変わり、既存の戻り href と scroll 復元の key（`location.href`）がずれる
- FM6: `detailReturnTo` が JSON として読める string 値を引用符なしで出し、受け側の `parseSearch` で number 等に変わって落ちる（GA5 と同じ機序）
- FM7: 入れ子の `returnTo` が往復のどこかで落ち、「在庫照会へ戻る」が既定の fallback に落ちる

## Test Matrix

- 既存 test は `rg` で実在を確認した（packet「起票時実測」の行番号）。
- helper と mock: `renderWithRouter`（`src/test/render-with-router.tsx`）は実 `routeTree` と memory history を持つが、page component に search を props で渡すため route の `validateSearch` は通らない。`ReturnToFlow.test.tsx` は `RouterProvider` で実 route を描画し、`commands.*` だけを mock に置き換える（mock の境界は generated bindings）。T7 は後者。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | FM1 | unit | T1 `return-to.test.ts`「returns null for a missing or invalid returnTo without throwing」（`it.each`: `undefined` / `null` / `""` / `"relative"` / `"https://evil.example"` / `"/\\evil.example"` / `"/a/..//["` / `"//["`、`toBeNull()`） | 不合格時に `{ to: "", search: {} }` などの object を返す（AC6 (1)）、または guard が throw する |
| C1 | FM4 | unit | T2 `return-to.test.ts`「returns null on an options.pathname mismatch」（`"/inventory/records?page=2"` と `"/stocktake?page=2"` を pin `/stock` で `null`）と「keeps a value that matches options.pathname」（`"/stock?q=BT0002&selected=BT0002"` → `{ to: "/stock", search: { q: "BT0002", selected: "BT0002" } }`） | pin 判定を外す（AC6 (3)）、`startsWith` に緩める、pin 一致の値まで `null` にする |
| C1 | FM5 | unit | T3 `return-to.test.ts`「decomposes a valid returnTo into to (pathname) and search (object)」（base `:53-63` の fallback 引数を外すだけ。`q=%222099000000019%22` が string、`page=2` が number） | `search` を `{}` 固定にする、`defaultParseSearch` を通さず数字だけの `q` の型が崩れる |
| C2 | FM2 | typecheck | T4 `return-to.test.ts` の `expectTypeOf(returnToLinkProps("/x")).toEqualTypeOf<{ to: string; search: Record<string, unknown> } \| null>()`（`npm run typecheck` が検査） | 戻り値の型から `\| null` を外す（AC6 (2)、Contract Probe 1 で TS2344 を確認済み） |
| C4 | FM6 | unit | T5 `StockMovementsPage.test.tsx`「REQ-303 / UI-06c-D9 (SPEC-NAV-RETURN-TYPES C4): 元記録 link の detailReturnTo は受け側の schema で元の search に戻る」（`it.each`: (a) `{ dateFrom: "2026-06-01", dateTo: "2026-06-30", type: "disposal", page: 2, returnTo: "/stock?q=%222099000000019%22&selected=%222099000000019%22" }` (b) `{ returnTo: "123" }` (c) `{}`。「廃棄・破損 #7」の href の search から外側の `returnTo` を `defaultParseSearch` で取り、それを `new URL(…, "http://inventory.local")` にして pathname = `/stock/BT0002/movements`、`stockMovementsSearchSchema.parse(defaultParseSearch(inner.search))` を `normalizeStockMovementsSearch` した値が入力の同値と deep-equal、`returnTo` が入力と一致。(c) だけは外側の `returnTo` が `/stock/BT0002/movements`〈`?` なし〉と文字列一致することも見る） | `detailReturnTo` を base の `URLSearchParams` 手組みへ戻す（(b) で `returnTo` が number 123 → schema で `undefined`、AC6 (4)）、key を落とす、既定値の正規化を壊す。(b) は現行の正当な値では差が出ない入力で、直列化の可逆性（将来 string の param を足したときの罠）を検査する旨を test に comment で書く |
| C4 | FM5 | unit（既存、期待値不変） | T6 `StockMovementsPage.test.tsx:89`「REQ-303: URL searchからMovementQueryを作りlistMovementsを呼ぶ」の href 文字列一致（`:120-123`） | key 順・`page` の出し方・符号化が変わる（AC4 で期待値の書換えを禁止） |
| C4 / C5 | FM7 | unit（既存） | `StockMovementsPage.test.tsx:443`「REQ-207 / UI-06c-D9: 元記録 link の returnTo に在庫変動履歴の returnTo を入れ子で含める」 | `detailReturnTo` から `returnTo` を落とす（AC6 (5)） |
| C5 | FM5 / FM7 | integration（実 `routeTree` + memory history） | T7 `ReturnToFlow.test.tsx`「SPEC-NAV-RETURN-TYPES C5 REQ-207 / REQ-303: 在庫照会（数字だけの商品コード）→ 在庫変動履歴 → 業務記録詳細 → 前の画面へ戻る → 在庫照会へ戻る で各段の href が行きと文字列一致する」: 初期 entry `/stock?q=%222099000000019%22&selected=%222099000000019%22`（router の直列化と同じ形）、在庫照会の詳細の在庫変動履歴への link を click → `pathname` = `/stock/2099000000019/movements` を待ち `location.href` を記録 → 「廃棄・破損 #7」→ `/inventory/disposal/records/7` → 「前の画面へ戻る」→ `location.href` が記録した在庫変動履歴の href と一致 → 「在庫照会へ戻る」→ `location.href` が初期 entry と一致し、`location.search` が `{ q: "2099000000019", selected: "2099000000019" }`（string） | 入れ子 `returnTo` を落とす（AC6 (5)）、helper が合格値を `null` にする、符号化が段ごとにずれる、数字だけの商品コードが number 化する |
| C3 | FM3 | unit（既存、期待値不変） | 6 画面の T11 系（`OtherRecordDetailPages.test.tsx` の `:198` / `:241` / `:290`、`DisposalRecordDetailPage.test.tsx:121`、`StocktakeRecordDetailPage.test.tsx:195`、`CsvImportRecordDetailPage.test.tsx:251` の `it.each`。不正 `returnTo` → `/inventory/records`）、`DisposalRecordDetailPage.test.tsx:101`（error 分岐・`returnTo` なし）、`ReturnToFlow.test.tsx:109` T9 | `??` の右辺を別の hub にする（AC6 (6)）、error 分岐の戻り link だけ分岐を外す |
| C3 / 維持 | FM3 / FM4 | unit（既存、期待値不変） | `StockMovementsPage.test.tsx:393` `SPEC-UI06C-D9-R1` の 7 case と `:425` GA5 T2-num | `null` の分岐を反転する（有効な `returnTo` でも fallback へ落ちる）、fallback の `q` / `selected` を文字列 URL で組む |
| 維持 | — | unit（既存、変えない） | `return-to.test.ts:5-50` `normalizeReturnTo` の 2 describe | guard（`parseReturnTo`）を S1 の改修で壊す |

撤去する test（`return-to.test.ts`）: `:65-70`「decomposes the fallback the same way when the value is missing」、`:72-77`「… when the value is invalid」、`:79-84`「decomposes a query-bearing fallback without losing search types」、`:93-98`「returns the empty sentinel for invalid fallback %s without throwing」、`:100-106`「does not reapply the pathname pin to the fallback」。いずれも S1 で消える `fallback` 引数だけを検査する。`:93-98` の入力群は T1 の不正値へ、query 付き値の型保存は T3 へ、既定 hub の行き先は既存 T11 系へ引き継ぐ。`:108-113` の pin 不一致 case は T2 へ書き換える（期待値を sentinel から `null` へ）。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 在庫変動履歴の `returnTo`（在庫照会の href） | 在庫照会の link click で `location.href` を受ける | not applicable（query に依存しない） | route の zod で string / `max(500)` を通過 | not applicable | not applicable | 業務記録詳細から戻ると `detailReturnTo` の入れ子から復元（T7） | F5 / 再起動で URL から復元（不変） | 不正値は `.catch(undefined)` または helper の `null` → `/stock?q&selected`（既存 `SPEC-UI06C-D9-R1`） | not applicable | T7 / 既存 |
| `detailReturnTo`（在庫変動履歴の現在地） | 正規化した search から組む | not applicable | 元記録 link の `search.returnTo` に載る | filter / page / reset で組み直す（`...prev` で `returnTo` を保持、不変） | not applicable | 業務記録詳細の「前の画面へ戻る」で同じ href に戻る（T7） | not applicable | not applicable（検証済み値だけを組む） | not applicable | T5 / T6 / T7 |
| 業務記録詳細の `backLinkProps` | `returnTo` を helper に通す | 詳細 query の loading 中は link を出さない（不変） | 合格なら遷移元、`null` なら `/inventory/records` | not applicable | not applicable | not applicable | URL から再計算 | 詳細 query の error 分岐でも同じ `backLinkProps`（`DisposalRecordDetailPage.test.tsx:101`） | not applicable | 既存 T11 系 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `returnToLinkProps` の呼出し | `rg -n 'returnToLinkProps\(' src --glob '!*.test.*'` の 7 呼出し（packet の file × import 表） | 7 site すべて（S2 の 6 + S3 の 1） | なし | AC2（typecheck）、既存 T11 系、`SPEC-UI06C-D9-R1` |
| `<Link {...backLinkProps}>` の spread | `rg -n '<Link \{\.\.\.backLinkProps\}>' src` = 12（6 画面 × 2） | 変えない（`backLinkProps` が非 null になる） | なし | AC2 |
| 空の `to` の sentinel | `rg -n 'to: "", search: \{\}' src` = 2（helper と test） | 両方消す | なし | AC3 |
| 送信側の returnTo の直列化 | `useRouterState({ select: … location.href })` の site（`rg -n 'location\.href' src/features --glob '!*.test.*'`）、`StockMovementsPage.tsx` の `detailReturnTo`、`products/lib/return-to.ts` の `buildProductListReturnTo` | `detailReturnTo`（S3） | `location.href` の site は既に router の href で変えない。`buildProductListReturnTo` は受け側が typed parse-back で router の `parseSearch` を通らないため DSR-18 の存置例外のまま | T5 / T7 |
| returnTo を受ける route schema | `rg -n 'returnTo: z\.' src/routes src/features --glob '!*.test.*'` | 変えない | Non-scope（route schema の見直しはしない） | 既存 |

## Negative Paths

- missing input: `returnTo` 欠落（`undefined` / `null` / `""`）→ `null`（T1）→ 既定 hub（既存 T11 系、`SPEC-UI06C-D9-R1`）
- invalid input: 外部 origin・`/\`・解析不能・`//[` → `null`（T1）。pin 不一致 → `null`（T2）
- duplicate/ambiguous input: not applicable（search param は単一値。router-core の decode は同名 key を配列にするが、route schema が string 以外を `undefined` にし、helper は string だけを受ける。不変）
- unknown reference: not applicable（記録の存在確認は詳細 query の error 分岐で、本 lane は変えない）
- dependency missing: not applicable
- permission/write failure: not applicable（書込みなし）
- dry-run side effect: not applicable

## Boundary Checks

- threshold: `page` は 2 以上だけ `detailReturnTo` に載せる（T5 (a)、T6）
- null/default: `type` = `all` と `page` = 1 は載せない（T5 (c) の `{}` が `detailReturnTo` = `/stock/BT0002/movements`〈`?` なし〉）
- empty/non-empty: `defaultStringifySearch({})` = `""`（Contract Probe 2 の 1 入力目）
- min/max: `returnTo` の `max(500)` は route schema の責務で不変
- status/policy enum: `type` の enum 値（`disposal` 等）は JSON として読めないため引用符が付かない（Contract Probe 2）
- wire type: URL search の string。数字だけの string は引用符付き（`%22…%22`）
- internal type: `{ to: string; search: Record<string, unknown> } | null`（T4）
- producer/consumer: 在庫変動履歴（producer）→ 業務記録詳細（consumer、`returnToLinkProps` の `defaultParseSearch`）→ 在庫変動履歴 route（`stockMovementsSearchSchema`）
- round-trip token: 入れ子 `returnTo`（T5 (a)、T7）
- precision/range: not applicable
- cross-language parse: not applicable（TS だけ）

route / search の往復は、T5 が受信側 schema の parse 後の型まで、T7 が実 route の `validateSearch` と在庫照会の検索・選択の復元まで確かめる。数字だけの商品コード `2099000000019` を使う。

## Compatibility Checks

- old schema/input: 変更前の手組みで作られた `detailReturnTo` の URL（bookmark 相当）は、現行の値の範囲で変更後と同一（Contract Probe 2）。受け側の扱いは不変
- new schema/input: 追加の search param なし
- output order: `detailReturnTo` の key 順は `dateFrom` / `dateTo` / `type` / `page` / `returnTo`（base の `set` 順と同じ。T6 の文字列一致が検出）
- optional field behavior: 値が `undefined` の key は出さない（手組みの `if` と同じ。T5 (c)）

## Data Safety Checks

- source-derived data: なし
- generated outputs: `docs/function-design/90-traceability.md`（S5 で再生成、`--check` で drift 0）
- secrets: なし
- local-only files: `.local/ci-evidence/`（commit しない）
- synthetic sample boundaries: 商品コード `BT0002` / `2099000000019`、記録 ID 7 はすべて合成値

## Main Wiring / Integration Checks

- helper connected to main path: 7 画面が `returnToLinkProps` を呼び、`npm run typecheck`（AC2）が全呼出しの `null` の扱いを検査する
- output reaches manifest/report: not applicable
- effective config reaches runtime: router の search 直列化が既定のままであること（`src/lib/app-router.ts:76` の `createRouter` に custom の `stringifySearch` が無い）。T7 は同じ既定の router で往復する
- CLI arg reaches implementation: not applicable

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? T7 の mock は `listMovements` の movement の `source.route`（`/inventory/disposal/records/7`）と商品コードだけを与え、戻り先の href は mock に無い。href は往復で組まれた値で、初期 entry との文字列一致で検査する
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? not applicable（query の invalidate を変えない）
- If a key branch is inverted, which test fails? `StockMovementsPage` の `backLinkProps ? … : …` の反転 → `SPEC-UI06C-D9-R1` の有効 case。helper の `null` 条件の反転 → T1 / T3
- If a threshold comparison changes, which test fails? `page > 1` を `>= 1` にする → T5 (c)（`{}` の入力で `detailReturnTo` に `?page=1` が付き、`/stock/BT0002/movements` との文字列一致が落ちる。T6 は `page=2` なので検出しない。正規化後の比較だけでは通る）
- If a guard is removed, which test fails? pin 判定 → T2、DSR-15 の guard → T1 と `normalizeReturnTo` の既存 test
- If an output field is omitted, which test fails? `returnTo` を落とす → T7 と既存の入れ子 test。`dateFrom` 等を落とす → T6 / T5 (a)
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? not applicable（packet に exact-HEAD を書かない）
- If output order changes, which test fails? T6（href の文字列一致）
- If dry-run performs a side effect, which test fails? not applicable
- If a JSON number crosses JavaScript safe integer range, which test fails? `2099000000019` は safe integer の範囲内。数字だけの商品コードが number 化する経路は T7 の `location.search` が string であることの assertion で検出する（範囲超えの桁は本 lane の対象外、既存 GA5 と同じ）
- If a state token is round-tripped through browser/client code, which test fails? 入れ子 `returnTo` の往復 → T5 / T7

## Residual Test Gaps

- 既定 hub の literal（`{ to: "/inventory/records", search: {} }`）の typo は型検査されない（Contract Probe 1）。6 画面の既存 T11 系の不正 case が href で検出する
- `detailReturnTo` の手組みへの差戻しは、現行の正当な値では観測できない（出力が同一）。T5 (b) の JSON として読める string の入力でだけ検出する
- Windows native の実クリックは確認しない（manual なし）。画面の変化が無く、T7 が実 router の往復を固定するため
