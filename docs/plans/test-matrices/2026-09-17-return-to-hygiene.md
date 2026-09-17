# Test Design Matrix: ㉙ returnTo 衛生

[Plan Packet](../2026-09-17-return-to-hygiene.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-RETURNTO-HYGIENE-2026-09-17 C1〜C6（packet の Spec Contract）
- DSR-15 / DSR-18 / UI-06c-D9（S6 の改訂後）

## Failure Modes

- FM1: `/\host` や tab 入りの `returnTo` が guard を通り、app 外 origin を指す link が描画される
- FM2: guard を強めた結果、正当な `returnTo`（検索条件つき / 入れ子 `returnTo` つき）が fallback へ落ちる
- FM3: `to` / `search` への分解で検索条件が欠ける、または型が変わって戻り先の route schema で落ちる
- FM4: 「在庫照会へ戻る」が `/stock` 以外の pathname に着地する
- FM5: 業務記録詳細のどれか 1 画面だけ置換が漏れ、文字列 `to` が残る
- FM6: 入出庫履歴の数字だけの検索語が、詳細から戻ると消える（現行の実害、Probe 3）
- FM7: 20 文字を超える商品コードで `selected` が落ち、戻った在庫照会で選択が外れる
- FM8: S5 の href 化で、戻り先の一覧の表示（絞り込み・page）が変わる

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | FM1 / FM2 | unit（`it.each` 追加） | T1 `src/lib/return-to.test.ts` 「normalizeReturnTo (REQ-207 / DSR-15 / DSR-18 …)」に `"/\\evil.example"` → fallback、`"/\t/evil.example"` → fallback、`"/ok#frag"` → `/ok`、入れ子つき `"/stock/BT0002/movements?type=disposal&returnTo=%2Fstock%3Fq%3DBT%26selected%3DBT0002"` → 同値、`"/inventory/records?q=%22123%22&page=2"` → 同値、を追加。既存 8 case は期待値不変 | origin 判定が無い（旧 `startsWith`）/ 正当な query を落とす / hash を残す |
| C2 | FM3 | unit | T2 同 file 「returnToLinkProps (REQ-207 / DSR-18)」: `"/inventory/records?recordType=receiving_record&page=2&q=%222099000000019%22"` → `{ to: "/inventory/records", search: { recordType: "receiving_record", page: 2, q: "2099000000019" } }`。欠落 → fallback を同じ形に分解 | `search` が空 / 文字列のまま / `q` が number |
| C2 / C3 | FM3 | unit（実 router、`renderWithClient`） | T3 `OtherRecordDetailPages.test.tsx` の既存 T11 系に、検索条件つき `returnTo` の case を 1 つ追加し、描画 href を `defaultParseSearch` した結果が元の search と deep-equal であることを確認。入力が router 形式（`defaultStringifySearch` で作った値）の case は描画 href が入力と文字列一致（DSR-17 (b)） | 分解で条件が欠ける / 再直列化で型が変わる |
| C4 | FM4 | unit（実 router） | T4 `StockMovementsPage.test.tsx` の `SPEC-UI06C-D9-R1` `it.each` に `"/inventory/records?page=2"`（app 内だが `/stock` でない）→ `/stock?q=BT0002&selected=BT0002` を追加 | pathname pin が無い |
| C3 | FM5 | static | T5 AC2 の `rg`（0 hit）。6 画面の既存「returnTo %s を安全に %s へ正規化する」test（`OtherRecordDetailPages.test.tsx:206,240,292` / `DisposalRecordDetailPage.test.tsx:129` / `CsvImportRecordDetailPage.test.tsx:255` / `StocktakeRecordDetailPage.test.tsx:202`）が引き続き pass | 1 画面の置換漏れ / 置換で fallback が壊れる |
| C5 | FM6 | unit（実 router、`initialPath` に `?q=%222099000000019%22` を指定） | T6 `InventoryRecordsPage.test.tsx` 「REQ-207 / DSR-18: 数字だけの検索語が詳細 link の returnTo で string のまま往復する」: 詳細 link の href から `returnTo` を取り出し、`defaultParseSearch` → `inventoryRecordsSearchSchema`（route が使う schema）で parse して `q === "2099000000019"` | 手組み（引用符なし）へ戻す |
| C6 | FM7 | unit | T7 `src/features/stock-inquiry/types.test.ts` 「REQ-301: selected は 21 文字以上の商品コードを落とさない」: 21 文字 → 保持、101 文字 → `undefined` | `max(20)` のまま |
| C1〜C5 | FM2 / FM8 | integration（実 routeTree + memory history、`ReturnToFlow.test.tsx` の harness） | T8 `ReturnToFlow.test.tsx` 「REQ-207 / REQ-303: 入出庫履歴（数字だけの検索語）→ 詳細 → 前の画面へ戻る で検索語が残り、戻った先の `location.href` が出発時の href と文字列一致する」+ 既存 T10（`/settings/logs` の 2 段往復）が pass。T2-num（`StockMovementsPage.test.tsx:419`）は `stockInquirySearchSchema.parse(defaultParseSearch(url.search))` まで通す形へ強化 | 入れ子 `returnTo` を guard が落とす / 戻り先で schema に落ちる |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `returnTo` search param | 欠落 → fallback | — | 有効 → 遷移元へ | filter 変更・reset でも保持（既存、非接触） | — | 戻り先で同じ search state を復元 | app 再起動で URL state は失われる（既存、対象外） | 不正 → fallback | — | T1 / T3 / T4 / T8、既存 `StockMovementsPage.test.tsx:460` |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 文字列 `to` に query を載せる戻り link | `rg -n '<Link to=\{' src/features`（Writer が実装時に全 hit を確認） | 業務記録詳細 6 画面 + 在庫変動履歴 | products（`onNavigateToList` の typed parse-back で `Link to` を使わない） | AC2 |
| `returnTo` の手組み | `InventoryRecordsPage.tsx` / `StockMovementsPage.tsx` / `products/lib/return-to.ts` | `InventoryRecordsPage.tsx`（S5） | `StockMovementsPage.tsx` `detailReturnTo`（数字だけの string 値なし）/ products（typed parse-back） | 起票時実測、T6 |

## Negative Paths

- missing input: `undefined` / `null` / `""` → fallback（T1 既存 case）
- invalid input: 外部 URL / `//` / `/\` / tab / pathname 不一致（T1 / T4）
- duplicate/ambiguous input: 該当なし
- unknown reference: app 内だが存在しない pathname は router の not-found に任せる（現行どおり、対象外）
- dependency missing: 該当なし
- permission/write failure: 該当なし
- dry-run side effect: 該当なし

## Boundary Checks

- threshold: `selected` 20 / 21 / 100 / 101 文字（T7）
- null/default: 欠落 → fallback（T1 / T2）
- empty/non-empty: search なしの `returnTo`（`/inventory/receiving`）→ `search: {}`（T2）
- min/max: `returnTo` `max(500)` は route schema 側で不変（対象外）
- status/policy enum: 該当なし
- wire type: URL search param（string）
- internal type: `{ to, search }`
- producer/consumer: T6（producer）/ T2・T3（consumer）
- round-trip token: T8
- precision/range: 13 桁の数字だけの語が number にならない（T2 / T6。`2099000000019` は safe integer 内だが string のまま往復することを確認）
- cross-language parse: 該当なし

## Compatibility Checks

- old schema/input: 手組み形式の `returnTo`（既存 test の入力値）を引き続き受理（T5 の既存 test 群）
- new schema/input: router の href 形式（T6 / T8）
- output order: search param の順序は router の stringify に従う。href 比較は `defaultParseSearch` 後の deep-equal で行う（AC4）
- optional field behavior: `options.pathname` 省略時は pin しない（T3）

## Data Safety Checks

- source-derived data: なし
- generated outputs: `90-traceability.md`（再生成、手動編集なし）
- secrets: なし
- local-only files: なし
- synthetic sample boundaries: 商品コード・JAN は既存の synthetic fixture のみ

## Main Wiring / Integration Checks

- helper connected to main path: T3 / T4（実 page component 経由）、T8（実 routeTree）
- output reaches manifest/report: 該当なし
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- If a guard is removed, which test fails? → AC5 (1): T1 の `/\` case
- If a key branch is inverted, which test fails? → AC5 (2): T4（pathname pin）
- If an output field is omitted, which test fails? → AC5 (5): T3（`search` を `{}` 固定）
- If a threshold comparison changes, which test fails? → AC5 (4): T7
- If a state token is round-tripped through browser/client code, which test fails? → AC5 (3): T6、T8
- If a JSON number crosses JavaScript safe integer range, which test fails? → 対象外（値は string として往復させる契約で、number 化そのものを T2 / T6 が検出する）
- 他の問い（mock 値 / invalidate 順序 / Workflow State / legacy / output order / dry-run）は該当なし

## Residual Test Gaps

- Tauri native webview での実遷移は自動 test で覆えない → AC-L3-1
- `detailReturnTo` の手組み（Non-scope）に将来 string の自由入力値が足された場合の検出は無い → DSR-18 の改訂文（送信側は router の href）で規約化
