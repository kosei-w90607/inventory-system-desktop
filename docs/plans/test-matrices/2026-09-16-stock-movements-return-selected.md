# Test Design Matrix: ㉖ 在庫変動履歴からの戻りで在庫照会の検索条件と商品選択を保持する（NAV-1）

Packet: `docs/plans/2026-09-16-stock-movements-return-selected.md`。file:line は origin/main `c6167c4d` で実測。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-UI06C-D9-R1: 在庫照会 → 在庫変動履歴の link が現在の `/stock` URL を `returnTo` として送り、「在庫照会へ戻る」が正規化した `returnTo` へ戻る。欠落・不正は `/stock?q=<code>&selected=<code>` へ fallback（UI-06a-D7 / UI-06c-D9）
- UI-06c-D9（入れ子）: `detailReturnTo` が `returnTo` を含む
- UI-06c-D2: 既存 search params 4 key の挙動と `...prev` spread は不変
- §58.4 受け側ガード: `useStockInquiry` は非接触

## Failure Modes

- FM1: 在庫変動履歴 link に `returnTo` が付かない（現行のまま、戻ると選択が消える）
- FM2: `returnTo` を検証せずそのまま使う（外部 URL / `//` へ戻る）
- FM3: fallback に `q=` が無い、または `encodeURIComponent` されていない（受け側の検索前ガードで `selected` が消える / 特殊文字の商品コードで壊れる）
- FM4: `detailReturnTo` に `returnTo` が載らず、業務記録詳細から戻った後の「在庫照会へ戻る」が fallback へ落ちる
- FM5: filter 変更・reset・page 送りで `returnTo` が消える
- FM6: 受け側 hook / route file / helper / 業務記録詳細画面に副作用が及ぶ
- FM7: `returnTo` が `max(500)` を超えて `undefined` に落ち、意図せず fallback になる
- FM8（GA5、L3 round 1 で実発生）: fallback の `q` / `selected` が数字だけの商品コードで `parseSearch` により number になり、route の `z.string()` で `undefined` に落ちて検索前状態へ戻る

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPEC-UI06C-D9-R1（producer） | FM1 | unit（RTL + `renderWithRouter` 実 router、`initialPath` 指定） | T1 `StockDetailContent.test.tsx` 「REQ-301 / UI-06a-D7: 在庫変動履歴 link が現在の /stock URL を returnTo で送る」（`:33-48` の書き換え。`initialPath = "/stock?q=BT&selected=BT0002"` で render し、href = `/stock/BT0002/movements?returnTo=%2Fstock%3Fq%3DBT%26selected%3DBT0002`） | `?returnTo=` 欠落（FM1）、直列化形の不一致 |
| SPEC-UI06C-D9-R1（正規化） | FM2 | unit（`it.each`、`renderWithClient` = 実 router） | T2' `StockMovementsPage.test.tsx` 「REQ-303 / UI-06c-D9: 在庫照会へ戻る の returnTo %s を %s へ正規化する」有効 case: `search={{ returnTo: "/stock?q=BT&status=all&selected=BT0002" }}` → href = 同値（実 router の再直列化で query の順序 / encoding が変わる場合は `new URL(href, "http://x")` で `pathname` と `searchParams` を比較する） | helper を通さず別値へ戻る |
| SPEC-UI06C-D9-R1（fallback 欠落） | FM3 | unit（同 `it.each`） | T2 欠落 case: `search={{}}` → href = `/stock?q=BT0002&selected=BT0002` | `q=` 欠落、`selected` 欠落 |
| SPEC-UI06C-D9-R1（fallback、数字だけの商品コード、GA5） | FM8 | unit（実 router） | T2-num `StockMovementsPage.test.tsx`: `productCode="2099000000019"`、`search={{}}` → 「在庫照会へ戻る」の href を `new URL(href, "http://x")` で parse し、`searchParams.get("q")` と `get("selected")` が `"\"2099000000019\""`（TanStack の引用符付き）であること、または `defaultParseSearch` 相当で string `"2099000000019"` に戻ること | 文字列で組んだ fallback（number に化ける、FM8） |
| SPEC-UI06C-D9-R1（fallback 外部 URL） | FM2 | unit（同 `it.each`） | T3 `returnTo: "https://example.invalid/escape"` → fallback | 検証なし（FM2） |
| SPEC-UI06C-D9-R1（fallback `//`） | FM2 | unit（同 `it.each`） | T4 `returnTo: "//example.invalid/escape"` → fallback | 検証なし（FM2） |
| UI-06c-D9（入れ子） | FM4 | unit | T5 `StockMovementsPage.test.tsx` 「REQ-207 / UI-06c-D9: 元記録 link の returnTo に在庫変動履歴の returnTo を入れ子で含める」（`:87-123` と同じ fixture に `returnTo` を足し、`廃棄・破損 #7` の href に `%26returnTo%3D` が含まれること。`returnTo` なしの既存 `:87-123` は不変） | `returnToParams.set("returnTo", ...)` 欠落（FM4） |
| UI-06c-D2（保持） | FM5 | unit | T6 `StockMovementsPage.test.tsx` 「UI-06c-D9: filter 変更後も returnTo が残る」（`:147` と同型に `onSearchChange` の updater を capture し、`returnTo` 付き prev に適用した結果に `returnTo` が残ること。reset は `:313` と同型で 1 case） | spread を壊す実装（FM5） |
| UI-06c-D1 / D2（不変） | FM6 | regression（既存） | `StockMovementsPage.test.tsx:87` `:147` `:313`（`rg -n 'REQ-303: URL search\|filter変更時はpage\|SPEC-UIBB-2 解除' src/features/stock-movements/StockMovementsPage.test.tsx` で実在確認） | 既存 4 key の挙動を変えた場合 |
| §58.4 受け側ガード（不変） | FM6 | regression（既存、非接触） | `useStockInquiry.test.tsx:733` 「list 成功時に selected が現 list に不在なら clear」/ `:768` 「検索前（status=all + q 空）に selected 付き URL → clear」 | hook を触った場合（AC5 で diff 0 も機械検査） |
| 長さ上限 | FM7 | 概算（review evidence） | Boundary Checks の概算。自動 test は置かない | — |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `returnTo`（在庫変動履歴 URL） | 在庫照会 link click 時の href（search state 込み） | — | route の zod で string / `max(500)` を通過 | filter / page / reset は `...prev` で保持 | not applicable（query に依存しない） | 業務記録詳細から `detailReturnTo` で戻ると入れ子で復元 | F5 / app 再起動で URL から復元 | 不正値は `.catch(undefined)` → fallback | — | T1 / T5 / T6 |
| 「在庫照会へ戻る」の href | fallback（`returnTo` なし） | — | `normalizeReturnTo(returnTo, fallback)` | `returnTo` の変化で再計算（render ごと） | — | — | — | 不正値は fallback | — | T2〜T4 |
| 在庫照会の `selected`（受け側、不変） | URL の `selected` | list loading 中は判定しない（`isSuccess` ガード） | list に含まれれば展開 | `q` / `dept` / `status` 変更で clear | — | `returnTo` で戻ると list 再取得 → 含まれれば展開 | — | list 不在 / 検索前なら clear（既存） | — | 既存 hook test、AC-L3-1 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `returnTo` consumer（`normalizeReturnTo` + `Link to={backHref}`） | 業務記録詳細 6 画面（`CsvImportRecordDetailPage` / `ManualSaleRecordDetailPage` / `ReceivingRecordDetailPage` / `DisposalRecordDetailPage:46,80` / `StocktakeRecordDetailPage` / `ReturnRecordDetailPage`、`rg -l normalizeReturnTo src/features` で実在確認） | `StockMovementsPage`（本 lane） | label は「在庫照会へ戻る」のまま（DSR-18 の「前の画面へ戻る」は業務記録詳細 route 向け。着地先が常に在庫照会なので label を変えない） | T2〜T4 |
| `returnTo` producer（`useRouterState` の `location.href` を `search={{ returnTo }}` で送る） | 4 作業画面の recent list / 保存結果（`DisposalPage.tsx:134` ほか、DSR-18 lane PR #20 / ㉕）、`/inventory/records` hub、操作ログ | `StockDetailContent` の「在庫変動履歴」（本 lane） | 業務記録詳細 6 画面の「在庫変動履歴」link（`params` のみ）は producer にしない: そこから在庫変動履歴へ来て「在庫照会へ戻る」を押す利用者には fallback（商品コード検索）が自然で、元の記録詳細へ戻す導線は label 変更を伴う別 scenario | AC5（6 画面 diff 0）、T1 |
| 在庫変動履歴 → 業務記録詳細の `detailReturnTo`（`URLSearchParams` 直列化） | `StockMovementsPage.tsx:73-82` のみ | 同 site に `returnTo` を追加 | — | T5 |
| route search schema の `returnTo`（`z.string().max(500).optional().catch(undefined)`） | `stocktake.records.$stocktakeId.tsx:7`、`csv-import.records.$importId.tsx`、`inventory/**/records/$recordId.tsx`（`rg -n 'returnTo: z.string' src/routes` で実在確認） | `stockMovementsSearchSchema`（types.ts、本 lane） | route file には書かない（schema は types.ts が単一所有者、66 §66.3） | AC1 / AC5 |

## Negative Paths

- missing input: `returnTo` 欠落 → fallback `/stock?q=<code>&selected=<code>`（T2）
- invalid input: 外部 URL / `//` 始まり → fallback（T3 / T4）。`max(500)` 超過 → zod `.catch(undefined)` → fallback（Boundary）
- duplicate/ambiguous input: `returnTo` の中に `returnTo` が入れ子で含まれる（業務記録詳細往復）→ 外側から順に 1 段ずつ剥がれる設計、`URLSearchParams` が encode するため衝突しない（T5）
- unknown reference: 存在しない商品コードで直打ち → fallback の在庫照会は 0 件 EmptyState（既存挙動、`selected` は clear）
- dependency missing: not applicable
- permission/write failure: not applicable（表示・遷移のみ）
- dry-run side effect: not applicable

## Boundary Checks

- threshold: `returnTo` `max(500)`。典型 = `/stock?q=<20 字>&dept=12&status=low_stock&page=3&selected=<20 字>` ≈ 70 字 → encode 後 ≈ 100 字。入れ子（在庫変動履歴 URL + filter 4 key + 上記）≈ 250 字。500 未満
- null/default: `returnTo` undefined → fallback
- empty/non-empty: `returnTo: ""` → `startsWith("/")` false → fallback
- min/max: 上記 threshold
- status/policy enum: not applicable（既存 `type` enum は不変）
- wire type: URL search param string
- internal type: `string | undefined`
- producer/consumer: `StockDetailContent`（producer）/ `StockMovementsPage`（consumer）/ `MovementTable` 経由の業務記録詳細（入れ子の再 producer）
- round-trip token: `returnTo` の URL encode / decode は TanStack Router と `URLSearchParams` に委ねる（既存 `:117-121` の直列化形と同じ）
- precision/range: not applicable
- cross-language parse: not applicable

## Compatibility Checks

- old schema/input: `returnTo` なしの既存 deep link → fallback（従来の `/stock?selected=<code>` より良い着地）
- new schema/input: `returnTo` 付き URL は既存 4 key と共存
- output order: `detailReturnTo` の `URLSearchParams` は set 順（`dateFrom` / `dateTo` / `type` / `page` / `returnTo`）。既存 `:117-121` の期待値は `returnTo` なしで不変
- optional field behavior: `returnTo` optional、未指定で従来経路

## Data Safety Checks

- source-derived data: なし（synthetic 商品コード `BT0002` / `DP-001`）
- generated outputs: なし（`generate:routes` 不要）
- secrets: なし
- local-only files: なし
- synthetic sample boundaries: test fixture は既存 `makeStockDetail` / `makeMovement`

## Main Wiring / Integration Checks

- helper connected to main path: `normalizeReturnTo` を `StockMovementsPage` の header Link に配線（T2〜T4 が実 router で href を確認）
- output reaches manifest/report: not applicable
- effective config reaches runtime: route の `validateSearch` は `stockMovementsSearchSchema` を import 済み（`$code.movements.tsx:15`）のため、schema 追加だけで runtime に届く
- CLI arg reaches implementation: not applicable

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? T1 は `initialPath` の値が href に現れることで producer が router state を読んだと分かる。T2' は渡した `returnTo` がそのまま href になる
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? T6（filter 変更後も残る）
- If a key branch is inverted, which test fails? `normalizeReturnTo` の条件反転 → T2'（有効値が fallback になる）と T3 / T4（不正値が通る）の両方
- If a threshold comparison changes, which test fails? `max(500)` は zod 契約。自動 test なし（Residual）
- If a guard is removed, which test fails? helper を外す → T3 / T4
- If an output field is omitted, which test fails? `returnTo` を `returnToParams` に載せない → T5。`search={{ returnTo }}` を外す → T1
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? not applicable（github mode、PR body / record が所有）
- If output order changes, which test fails? `detailReturnTo` の既存期待値 `:117-121`（`returnTo` なし）
- If dry-run performs a side effect, which test fails? not applicable
- If a JSON number crosses JavaScript safe integer range, which test fails? not applicable
- If a state token is round-tripped through browser/client code, which test fails? T1（encode）/ T2'（decode 後に同じ URL へ戻る）/ T5（入れ子の再 encode）

## Residual Test Gaps

- `max(500)` 超過の fallback は zod 契約の既存挙動として自動 test を置かない（概算で 250 字）
- 在庫照会へ戻った後の展開復元（受け側 hook の既存挙動）は実 navigation を伴うため unit test では href まで。L3（AC-L3-1）で往復を確認する
- 業務記録詳細から在庫変動履歴へ来た場合の「在庫照会へ戻る」は fallback を T2 で固定するが、その画面経由の実往復は L3 に含めない（Non-scope の scenario）
