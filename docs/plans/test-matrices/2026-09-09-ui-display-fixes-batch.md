# Test Design Matrix: 表示小修正 batch（⑰）

Plan Packet: [../2026-09-09-ui-display-fixes-batch.md](../2026-09-09-ui-display-fixes-batch.md)

## Risk

R2（UI helper・文言・class の 6 件の小修正。DB/DTO/route の契約は変わらない。Coordinator 判断で Test Design Matrix を必須とする — 見た目の折り返し・DOM 順・文言対比は既存 test の role+name query や `getByText` だけでは検出できない回帰があるため）。

## Contracts Under Test

- SC1: `daily-sales`/`monthly-sales` の `SummaryCardsBar.tsx` の `sub` が `pct` 自身から導出した単一符号になる（S1、UIDISP-D1）
- SC2: `OperationLogsPage.tsx:559` の展開行祖先 `TableCell` が `whitespace-normal` を持ち、`:162` の `dd` は `break-all` を維持して長い JSON 値でも折り返される（S2、UIDISP-D2）
- SC3: `DailySalesPage.tsx`/`MonthlySalesPage.tsx` の「レジ日報は未取込みです」Alert に「商品別売上 CSV（Z004）の取込みとは別です。」の `AlertDescription` が追加される（S3、UIDISP-D3）
- SC4: `RenameSupplierRow.tsx` 編集モードのボタンが Cancel → Action の DOM 順になる（S4、UIDISP-D4）
- SC5: `StockDetailContent.tsx` の `CardHeader`/CTA `div` が候補 A（`pt-4`/`pb-4`。B への Gated Amendment 成立後はその class）の余白 class を持つ（S5、UIDISP-D5）
- SC6: `formatDateTime` の重複ローカル実装が解消され、対象 6 file が共有 import + （`IntegrityCheckPage.tsx` を除き）`font-mono tabular-nums` を持つ（S6、UIDISP-D6）

## Failure Modes

- S1 の符号導出変更（`pct` 自身から導出）が `value`（¥ 金額）側の符号表示まで巻き込む、または分母が負/0 のケースで符号・文言が誤る
- S2 の `whitespace-normal` 追加（展開行祖先 `TableCell:559`）が他の `TableCell`/`dt`/`dd` セルへ波及する、または `dd` の `break-all` が失われて折り返し粒度が変わる
- S3 の Z004 対比文言が Z-code の事実と食い違う（Z001 単独と誤記する等）、または既存 `AlertTitle`/`role`/`data-variant`/icon が壊れる
- S4 の DOM 順入替えが `SupplierManagementPage.test.tsx` の既存 role+name query を壊す、または非編集モードのボタン順まで誤って変更する
- S5 の余白追加が `StockDetailCard.tsx` fallback 経路で過剰な二重余白になる、または主経路（`ProductListTable.tsx`）で意図した余白が入らない
- S6 の重複削除で呼び出し元のシグネチャ・挙動が変わる、または `IntegrityCheckPage.tsx`（prose 文脈）に誤って `font-mono tabular-nums` が付く

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 SummaryCardsBar 単一符号 | 二重符号残存 / value 側巻き込み / 分母が負の case 未検証 | unit（`SummaryCardsBar.test.tsx` 拡張、daily/monthly 両方） | SC1: 前日/前月比が負の減少 case（例 `diff=-80100, pct=-80.1`）で `sub` が厳密に `"-80.1%"` になり `"--80.1%"` にならない。daily の分母が負の case（`yAmount < 0`）で `sub` が `"前日返品超過"` になる。同じ render で `value`（¥ 側）の符号は変更されていないことも確認する | `sub` が `"--80.1%"` のまま残る、分母が負の case で `sub` が「前日返品超過」にならない、または `value` の符号表示が変わる |
| SC2 OperationLogsPage 展開行折り返し | nowrap 残存 / break-all 喪失 | unit（`OperationLogsPage.test.tsx` 拡張） | SC2: object/array 型の長い値を持つログを展開表示し、展開行の祖先 `TableCell`（`:559`）が `whitespace-normal` を持ち、`dd`（`:162`）は `break-all` を維持する | 祖先 `TableCell` に `whitespace-normal` が付かない、または `dd` の `break-all` が失われる |
| SC3 レジ日報 Alert Z004 対比 | 対比文言欠落 / 既存 assertion 破壊 / 他 Alert との誤検出（tautology） | unit（`DailySalesPage.test.tsx`/`MonthlySalesPage.test.tsx` 拡張） | SC3: 「レジ日報は未取込みです」warning Alert を `getByRole("status")` 等で取得し `within()` でスコープした上で、内部に「商品別売上 CSV（Z004）の取込みとは別です。」の `AlertDescription`（`data-slot="alert-description"`）が存在することを確認する。既存の `AlertTitle`/`role="status"`/`data-variant="warning"`/icon の assertion はすべて無変更で pass する | 対比文言が存在しない、スコープ外の別 Alert の内容を誤検出する、または既存 assertion のいずれかが fail する |
| SC4 RenameSupplierRow DOM 順 | 順序未入替 / query 破壊 | unit（`SupplierManagementPage.test.tsx` 拡張、既存 role+name query は無変更のまま維持） | SC4: 編集モードで `within(row).getAllByRole("button")` の最初の 2 件が `["キャンセル", "保存"]`（または `"再試行"`）の順で解決する。既存の role+name ベース test はそのまま pass する | ボタンが `["保存", "キャンセル"]` の順のまま残る、または既存 role+name query が解決できなくなる |
| SC5 StockDetailContent 余白 | 余白 class 欠落 / fallback 経路の過剰余白 | unit（`StockDetailContent.test.tsx` 拡張） | SC5: `CardHeader` と CTA `div` が候補 A（`pt-4`/`pb-4`。B への Gated Amendment 成立後はその class）を持つ。`StockDetailCard.tsx` 経由の render でも component が正常に描画される（クラッシュしないことの回帰確認） | 余白 class が付かない、または `StockDetailCard` 経由の render が壊れる |
| SC6 formatDateTime 統合 | 重複残存 / 誤った file への class 追加 | unit（対象 6 file それぞれの既存 test 拡張、`PriceHistorySection.test.tsx` は新設） | SC6: 各 file が `@/features/inventory-records/types` から `formatDateTime` を import し、ローカル定義（`formatDateTime`/`formatCheckedAt`）を持たない（`rg -Fc --include-zero 'formatCheckedAt' IntegrityCheckPage.tsx` = 0 を含む）。表セル 6 file・7 箇所（`PriceHistorySection.tsx:88`/`DisposalPage.tsx:706`/`ReceivingPage.tsx:705`/`ReturnExchangePage.tsx:995`/`OperationLogsPage.tsx:521`/`AdditionalImportConfirmDialog.tsx:120,138`〈呼び出し行は`:121`/`:139`〉）の該当セルが `font-mono tabular-nums` を持つ。`IntegrityCheckPage.tsx` は `font-mono tabular-nums` を持たない（negative） | いずれかの file にローカル重複定義が残る、または `IntegrityCheckPage.tsx` に誤って `font-mono tabular-nums` が付く |

Mandatory oracle rule: class の存在確認は `toHaveClass` の個別トークン指定を使う（`className` 文字列全体の一致は tailwind の class 順序変更で壊れやすいため使わない）。DOM 順（SC4）は `getAllByRole` の配列順で検証し、個別の `getByRole(..., {name})` だけに頼らない。

## State Lifecycle Matrix

not applicable — 本 lane は静的な表示（文言・class・DOM 順・import 元）の調整のみで、state machine・cache・route/search・import/export・retry・永続化 state を持たない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `.replace("T", " ")` / `toLocaleString` による日時表示の重複実装 | `rg -n 'replace\("T", " "\)' src/features -g '!*.test.*'`（8 hit）+ `rg -n 'toLocaleString\("ja-JP", \{' src/features -g '!*.test.*'`（1 hit、`PluExportPage.tsx:162`、Date option 付きで金額/数量〈option なし〉と構文上分離、合計 9 箇所。広く `\|toLocaleString` のみで当てると 90 hit になり大半が金額/数量向けで無関係と手で除いた根拠として括弧内に残す） | `PriceHistorySection.tsx`/`DisposalPage.tsx`/`ReceivingPage.tsx`/`ReturnExchangePage.tsx`/`OperationLogsPage.tsx`/`AdditionalImportConfirmDialog.tsx`（6 file） | `inventory-records/types.ts`（共有 formatter 本体、変更対象外）、`IntegrityCheckPage.tsx`（prose 文脈、import 統合のみで class 追加は対象外）、`src/features/plu-export/PluExportPage.tsx:159`（`formatPendingSavedAt`、`:162` の `toLocaleString("ja-JP", {`〈Date option 付き〉で `YYYY/MM/DD HH:mm`、prose 文脈、`:381`/`:463` で描画。本 lane 非対象、書式統一は Backlog 候補として Implementation Results 欄に申し送り） | SC6 各 file 拡張 |
| Cancel→Action の DOM 順（Dialog footer） | `02-component-catalog.md:544` の配置規則 | `RenameSupplierRow.tsx`（inline 行操作） | modal `AlertDialog` 自体（既に準拠済み、変更不要） | SC4 |
| `TableCell` 基底 `whitespace-nowrap` の個別打ち消し先例 | `rg -Fn 'whitespace-normal|whitespace-pre-wrap' src/features/operation-logs/OperationLogsPage.tsx`（先例: `:150`/`:216` の `whitespace-pre-wrap`、`ProductListTable.tsx:100` の `whitespace-normal`） | `:559`（展開行祖先 `TableCell`、`whitespace-normal`） | 他の `TableCell` 直下セル（波及させない）、`:150`/`:216` の既存個別打ち消し（同 root cause の過去パッチ、touch しない） | SC2 |

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
- 分母が負: daily の `yAmount < 0`（前日返品超過）で `sub` が `"前日返品超過"` になり、除算（`pct` 計算）に入らないこと（monthly の `prevTotal <= 0` ガードと同型）
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

- `SummaryCardsBar.tsx` の `sub` を旧式 `${sign}${pct.toFixed(1)}%`（`diff` 由来の `sign` 使用）に戻したら、SC1 の負値 case（`"-80.1%"` 期待、`"--80.1%"` ではない）が fail するか。daily の分母ガードを `yAmount <= 0` から `yAmount === 0` に戻したら、分母が負の case（`"前日返品超過"` 期待）が fail するか
- `OperationLogsPage.tsx:559` の `whitespace-normal` を削除したら、SC2 の長い JSON 値 test が fail するか
- `DailySalesPage.tsx`/`MonthlySalesPage.tsx` の `AlertDescription` の文言を「Z001 の取込みとは別です」（誤った Z-code 限定）に差し替えたら、SC3 は検出できるか（文字列の厳密一致で検出可能）
- `RenameSupplierRow.tsx` のボタン順を元（保存→キャンセル）に戻したら、SC4 の `getAllByRole` 順序 assertion が fail するか
- `StockDetailContent.tsx` の余白 class を削除したら、SC5 の class 存在 assertion が fail するか
- `PriceHistorySection.tsx` に `formatDateTime` を import せず旧 `entry.changed_at.replace("T", " ")` のままにしたら、SC6 の import 元 assertion が fail するか。同時に `IntegrityCheckPage.tsx` に誤って `font-mono tabular-nums` を追加してしまったら SC6 の negative 側が fail するか

## Residual Test Gaps

- SC1 の daily 負分母 case（「前日返品超過」）は monthly 同型の防御として妥当だが、実運用での到達性（実際に前日売上合計が負になり得るか）は未確認の防御 test である
- S5 の余白量（候補 A/B のどちらが「窮屈でない」と感じられるか）は happy-dom で検証不能、owner Windows native L3 が唯一の oracle（AC-L3-5）
- S6 の「他画面と同じ書体・詰めに見える」（AC-L3-6）は class の存在確認まではできるが、実際の視覚比較は owner L3 に依存する
- S3 の文言が owner にとって実際に分かりやすいかは L3 の所感に依存する（AC-L3-3）。文言確定は Plan Review で一度固めるが、L3 で追加調整が入る可能性がある
