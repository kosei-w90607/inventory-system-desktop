# Test Design Matrix: 表示小修正 batch（⑰）

Plan Packet: [../2026-09-09-ui-display-fixes-batch.md](../2026-09-09-ui-display-fixes-batch.md)

## Risk

R2（UI helper・文言・class の 6 件の小修正。DB/DTO/route の契約は変わらない。Coordinator 判断で Test Design Matrix を必須とする — 見た目の折り返し・DOM 順・文言対比は既存 test の role+name query や `getByText` だけでは検出できない回帰があるため）。

## Contracts Under Test

- SC1: `daily-sales`/`monthly-sales` の `SummaryCardsBar.tsx` の `sub` が `Math.abs(pct)` 適用後の単一符号になる（S1、UIDISP-D1）
- SC2: `OperationLogsPage.tsx:162` の `dd` が `whitespace-pre-wrap` を持ち、長い JSON 値でも折り返される（S2、UIDISP-D2）
- SC3: `DailySalesPage.tsx`/`MonthlySalesPage.tsx` の「レジ日報は未取込みです」Alert に「商品別売上 CSV（Z004）の取込みとは別です。」の `AlertDescription` が追加される（S3、UIDISP-D3）
- SC4: `RenameSupplierRow.tsx` 編集モードのボタンが Cancel → Action の DOM 順になる（S4、UIDISP-D4）
- SC5: `StockDetailContent.tsx` の `CardHeader`/CTA `div` が owner 確定の余白 class を持つ（S5、UIDISP-D5）
- SC6: `formatDateTime` の重複ローカル実装が解消され、対象 6 file が共有 import + （`IntegrityCheckPage.tsx` を除き）`font-mono tabular-nums` を持つ（S6、UIDISP-D6）

## Failure Modes

- S1 の `Math.abs` 適用が `value`（¥ 金額）側の符号表示まで巻き込む、または 0 のケースで符号が消える
- S2 の `whitespace-pre-wrap` 追加が他の `dt`/`dd` セルへ波及する、または `break-all` が失われて折り返し粒度が変わる
- S3 の Z004 対比文言が Z-code の事実と食い違う（Z001 単独と誤記する等）、または既存 `AlertTitle`/`role`/`data-variant`/icon が壊れる
- S4 の DOM 順入替えが `SupplierManagementPage.test.tsx` の既存 role+name query を壊す、または非編集モードのボタン順まで誤って変更する
- S5 の余白追加が `StockDetailCard.tsx` fallback 経路で過剰な二重余白になる、または主経路（`ProductListTable.tsx`）で意図した余白が入らない
- S6 の重複削除で呼び出し元のシグネチャ・挙動が変わる、または `IntegrityCheckPage.tsx`（prose 文脈）に誤って `font-mono tabular-nums` が付く

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 SummaryCardsBar 単一符号 | 二重符号残存 / value 側巻き込み | unit（`SummaryCardsBar.test.tsx` 拡張、daily/monthly 両方） | SC1: 前日/前月比が負の減少 case（例 `diff=-80100, pct=-80.1`）で `sub` が厳密に `"-80.1%"` になり `"--80.1%"` にならない。同じ render で `value`（¥ 側）の符号は変更されていないことも確認する | `sub` が `"--80.1%"` のまま残る、または `value` の符号表示が変わる |
| SC2 OperationLogsPage dd 折り返し | nowrap 残存 / break-all 喪失 | unit（`OperationLogsPage.test.tsx` 拡張） | SC2: object/array 型の長い値を持つログを描画し、対応する `dd` が `whitespace-pre-wrap` と `break-all` の両方を class に持つ | `whitespace-pre-wrap` が付かない、または `break-all` が失われる |
| SC3 レジ日報 Alert Z004 対比 | 対比文言欠落 / 既存 assertion 破壊 | unit（`DailySalesPage.test.tsx`/`MonthlySalesPage.test.tsx` 拡張） | SC3: 「レジ日報は未取込みです」Alert 内に「商品別売上 CSV（Z004）の取込みとは別です。」の `AlertDescription`（`data-slot="alert-description"`）が存在し、既存の `AlertTitle`/`role="status"`/`data-variant="warning"`/icon の assertion がすべて無変更で pass する | 対比文言が存在しない、または既存 assertion のいずれかが fail する |
| SC4 RenameSupplierRow DOM 順 | 順序未入替 / query 破壊 | unit（`SupplierManagementPage.test.tsx` 拡張、既存 role+name query は無変更のまま維持） | SC4: 編集モードで `within(row).getAllByRole("button")` の最初の 2 件が `["キャンセル", "保存"]`（または `"再試行"`）の順で解決する。既存の role+name ベース test はそのまま pass する | ボタンが `["保存", "キャンセル"]` の順のまま残る、または既存 role+name query が解決できなくなる |
| SC5 StockDetailContent 余白 | 余白 class 欠落 / fallback 経路の過剰余白 | unit（`StockDetailContent.test.tsx` 拡張） | SC5: `CardHeader` と CTA `div` が owner 確定の余白 class（候補 A または B）を持つ。`StockDetailCard.tsx` 経由の render でも component が正常に描画される（クラッシュしないことの回帰確認） | 余白 class が付かない、または `StockDetailCard` 経由の render が壊れる |
| SC6 formatDateTime 統合 | 重複残存 / 誤った file への class 追加 | unit（対象 6 file それぞれの既存 test 拡張、`PriceHistorySection.test.tsx` は新設） | SC6: 各 file が `@/features/inventory-records/types` から `formatDateTime` を import し、ローカル定義（`formatDateTime`/`formatCheckedAt`）を持たない。表セル 5 file（`PriceHistorySection`/`DisposalPage`/`ReceivingPage`/`ReturnExchangePage`/`OperationLogsPage`/`AdditionalImportConfirmDialog`）の該当セルが `font-mono tabular-nums` を持つ。`IntegrityCheckPage.tsx` は `font-mono tabular-nums` を持たない（negative） | いずれかの file にローカル重複定義が残る、または `IntegrityCheckPage.tsx` に誤って `font-mono tabular-nums` が付く |

Mandatory oracle rule: class の存在確認は `toHaveClass` の個別トークン指定を使う（`className` 文字列全体の一致は tailwind の class 順序変更で壊れやすいため使わない）。DOM 順（SC4）は `getAllByRole` の配列順で検証し、個別の `getByRole(..., {name})` だけに頼らない。

## State Lifecycle Matrix

not applicable — 本 lane は静的な表示（文言・class・DOM 順・import 元）の調整のみで、state machine・cache・route/search・import/export・retry・永続化 state を持たない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `.replace("T", " ")` による日時表示の重複実装 | `rg -n 'replace\("T", " "\)' src/features -g '!*.test.*'`（8 hit） | `PriceHistorySection.tsx`/`DisposalPage.tsx`/`ReceivingPage.tsx`/`ReturnExchangePage.tsx`/`OperationLogsPage.tsx`/`AdditionalImportConfirmDialog.tsx`（6 file） | `inventory-records/types.ts`（共有 formatter 本体、変更対象外）、`IntegrityCheckPage.tsx`（prose 文脈、import 統合のみで class 追加は対象外） | SC6 各 file 拡張 |
| Cancel→Action の DOM 順（Dialog footer） | `02-component-catalog.md:544` の配置規則 | `RenameSupplierRow.tsx`（inline 行操作） | modal `AlertDialog` 自体（既に準拠済み、変更不要） | SC4 |
| `TableCell` 基底 `whitespace-nowrap` の個別打ち消し先例 | `rg -Fn 'whitespace-pre-wrap' src/features/operation-logs/OperationLogsPage.tsx`（2 hit、`:150`/`:216`） | `:162`（`dd`） | 他の `TableCell` 直下セル（波及させない） | SC2 |

## Negative Paths

- missing input: 該当なし（フォーム入力の必須/任意チェックは変更しない）
- invalid input: 該当なし
- duplicate/ambiguous input: 該当なし
- unknown reference: 該当なし
- dependency missing: 該当なし
- permission/write failure: 該当なし（UI 表示のみ、書込みなし）
- dry-run side effect: 該当なし

## Boundary Checks

- threshold: SC1 の `pct` が 0 に近い境界（例 `pct=0`、`pct=-0.05` の四捨五入）で符号が誤らないこと
- null/default: 該当なし
- empty/non-empty: 該当なし
- min/max: 該当なし
- status/policy enum: 該当なし
- wire type: 該当なし
- internal type: 該当なし
- producer/consumer: 該当なし
- round-trip token: 該当なし
- precision/range: 該当なし
- cross-language parse: 該当なし

## Compatibility Checks

- old schema/input: 該当なし（DTO 変更なし）
- new schema/input: 該当なし
- output order: SC4 の DOM 順変更は既存 role+name query の解決性に影響しないことを SC4 で確認する
- optional field behavior: 該当なし

## Data Safety Checks

- source-derived data: 該当なし
- generated outputs: 該当なし
- secrets: 該当なし
- local-only files: 該当なし
- synthetic sample boundaries: 該当なし

## Main Wiring / Integration Checks

- helper connected to main path: S6 の `formatDateTime` 共有化は既存の import 解決経路（`ManualSalePage.tsx:39` と同型）をそのまま通る（新設 wiring なし）
- output reaches manifest/report: 該当なし
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- `SummaryCardsBar.tsx` の `Math.abs(pct)` を `pct` に戻したら、SC1 の負値 case（`"-80.1%"` 期待）が fail するか
- `OperationLogsPage.tsx:162` の `whitespace-pre-wrap` を削除したら、SC2 の長い JSON 値 test が fail するか
- `DailySalesPage.tsx`/`MonthlySalesPage.tsx` の `AlertDescription` の文言を「Z001 の取込みとは別です」（誤った Z-code 限定）に差し替えたら、SC3 は検出できるか（文字列の厳密一致で検出可能）
- `RenameSupplierRow.tsx` のボタン順を元（保存→キャンセル）に戻したら、SC4 の `getAllByRole` 順序 assertion が fail するか
- `StockDetailContent.tsx` の余白 class を削除したら、SC5 の class 存在 assertion が fail するか
- `PriceHistorySection.tsx` に `formatDateTime` を import せず旧 `entry.changed_at.replace("T", " ")` のままにしたら、SC6 の import 元 assertion が fail するか。同時に `IntegrityCheckPage.tsx` に誤って `font-mono tabular-nums` を追加してしまったら SC6 の negative 側が fail するか

## Residual Test Gaps

- S5 の余白量（候補 A/B のどちらが「窮屈でない」と感じられるか）は happy-dom で検証不能、owner Windows native L3 が唯一の oracle（AC-L3-5）
- S6 の「他画面と同じ書体・詰めに見える」（AC-L3-6）は class の存在確認まではできるが、実際の視覚比較は owner L3 に依存する
- S3 の文言が owner にとって実際に分かりやすいかは L3 の所感に依存する（AC-L3-3）。文言確定は Plan Review で一度固めるが、L3 で追加調整が入る可能性がある
