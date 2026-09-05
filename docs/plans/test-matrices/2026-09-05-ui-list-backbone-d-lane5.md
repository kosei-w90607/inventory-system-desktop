# Test Design Matrix: UI 一覧の背骨 D — Lane 5（操作面 + 枠 sweep）

Plan Packet: [../2026-09-05-ui-list-backbone-d-lane5.md](../2026-09-05-ui-list-backbone-d-lane5.md)

## Risk

R3（widely-shared UI primitive `Button`/`Badge` の枠 token 変更 + 11 画面 23 箇所の native 入力欄の面 token 変更）。render の実際の見た目（濃淡の視認性）は happy-dom で判定できないため L3 が oracle、本 Matrix は DOM の class 契約に限定する。

## Contracts Under Test

- SC1: `button.tsx` variant outline が `border-input` を持つ（L5 S2）
- SC2: `badge.tsx` variant outline が `border-border-strong` を持つ（L5 S3、L5-D1）
- SC3: `SegmentedControl` の既存 `--border-strong` 化が退行していない（L5 S4、L5-D2、回帰確認のみ）
- SC4a〜SC4k: 11 画面/component の native 入力欄が `bg-control-surface`（`PriceRevisionFilters` のみ `border-input` 新規付与も伴う）
- SC5: badge.tsx 変更が override 呼び出し側（`StockStatusBadge` 等）に波及しない
- SC6: catalog / DSR-22 の `--control-surface` HEX・SegmentedControl focus・日付月ナビ記述が runtime と一致する（docs review、非 vitest）

## Failure Modes

- `button.tsx`/`badge.tsx` のいずれかで旧 class（`border`単体 / `border-border`）が残る、または新 class が意図しない variant（`default` 等）にも付く
- 11 画面 23 箇所のいずれかで `bg-background` が残る、または `PriceRevisionFilters` で `border-input` が付与されない
- `SegmentedControl` に不要な変更が加わり `border-stone-300` 等が再混入する
- `StockStatusBadge` 等の override 呼び出し側で意図しない色変化が起きる（override が badge.tsx の新色に負ける）
- `ExportBar.tsx` / `ProductFormPage.tsx:233`（plu-memory-no） / `ReturnExchangePage.tsx:147,570` を誤って変更してしまう
- catalog / DSR-22 の HEX・focus・日付月ナビ記述のいずれかが旧値のまま残る

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 button outline | 旧 class 残存 / 誤った variant への付与 | unit（新規 `src/components/ui/button.test.tsx`） | SC1: Button variant="outline" has border-input; variant="default" does not | `variant="outline"` render 結果が `border-input` を持たない、または `variant="default"` が誤って持つ |
| SC2 badge outline | 旧 class 残存 / 誤った variant への付与 | unit（新規 `src/components/ui/badge.test.tsx`） | SC2: Badge variant="outline" has border-border-strong; variant="default" does not | `variant="outline"` render 結果が `border-border-strong` を持たない、または `variant="default"` が誤って持つ |
| SC3 SegmentedControl 退行なし（L5-D2） | 意図しない再変更 | unit（既存 `segmented-control.test.tsx` SC6、無変更のまま pass 必須） | SC3: existing SC6 (group wrapper has border-border-strong, no stone-300 literal) still passes unmodified | `segmented-control.tsx` に本 lane で変更が入り SC6 が fail する、または `border-stone-300` が再混入する |
| SC4a InventoryRecordsPage native 6 箇所 | `bg-background` 残存 | unit（既存 `InventoryRecordsPage.test.tsx` 拡張） | SC4a: all 6 native fields (記録種別/開始日/終了日/記録ID/部門/状態) resolved by getByLabelText have bg-control-surface, none have bg-background | 6 箇所のいずれかで `bg-control-surface` が付かない、または `bg-background` が残る |
| SC4b ReceivingPage native 1 箇所 | 同上 | unit（既存 `ReceivingPage.test.tsx` 拡張） | SC4b: 取引先 select (getByLabelText) has bg-control-surface | `bg-control-surface` が付かない |
| SC4c DisposalPage native 1 箇所 | 同上 | unit（既存 `DisposalPage.test.tsx` 拡張） | SC4c: 種別 select (getByLabelText via row aria-label) has bg-control-surface | 同上 |
| SC4d ReturnExchangePage native 4 箇所（textarea 含む、L5-D5） | 同上 + textarea 見落とし | unit（既存 `ReturnExchangePage.test.tsx` 拡張） | SC4d: 種別 select / 備考 textarea / 追加方向 select / 方向 select (row aria-label) all have bg-control-surface; `:147` registerOptionClass label still has bg-background (regression guard) | 4 箇所のいずれかで `bg-control-surface` が付かない、または `:147` の非対象要素が誤って変更される |
| SC4e ProductForm native 3 箇所 | `bg-background` 残存 | unit（既存 `ProductForm.test.tsx` 拡張） | SC4e: 部門/取引先/税率 select (getByLabelText) all have bg-control-surface | 3 箇所のいずれかで `bg-control-surface` が付かない |
| SC4f StockUnitField native 1 箇所 | 同上 + checkbox 誤変更 | unit（既存 `StockUnitField.test.tsx` 拡張） | SC4f: 数量単位 select has bg-control-surface; POS販売 checkbox class unchanged | select が `bg-control-surface` を持たない、または checkbox の class が変更されている |
| SC4g ManualSalePage native 1 箇所 | `bg-background` 残存 | unit（既存 `ManualSalePage.test.tsx` 拡張） | SC4g: 理由 select (getByLabelText) has bg-control-surface | 同上 |
| SC4h StockMovementsPage native 3 箇所 | 同上 | unit（既存 `StockMovementsPage.test.tsx` 拡張） | SC4h: 開始日/終了日/種別 (getByLabelText) all have bg-control-surface | 3 箇所のいずれかで付かない |
| SC4i PriceRevisionFilters native 1 箇所（border-input 新規付与） | `border-input` 未付与 or `bg-background` 残存 | unit（既存 `PriceRevisionPage.test.tsx` 拡張、component 単体 test なし） | SC4i: 取引先 select (aria-label) has both border-input and bg-control-surface | `border-input` または `bg-control-surface` のどちらかが欠ける |
| SC4j MonthNavigator native 1 箇所 | `bg-background` 残存 | unit（既存 `MonthlySalesPage.test.tsx` 拡張、component 単体 test なし） | SC4j: 月 input has bg-control-surface | 付かない |
| SC4k DateNavigator native 1 箇所 | 同上 | unit（既存 `DailySalesPage.test.tsx` 拡張、component 単体 test なし） | SC4k: 日付 input has bg-control-surface | 付かない |
| SC5 badge override 非退行 | override 呼び出し側の色変化 | unit（既存 `StockStatusBadge` 関連 test、無変更のまま pass 必須。file 名は Writer 実装時に `fd` で確認） | SC5: StockStatusBadge outline colors (ok/low/stockout) unchanged after badge.tsx base outline change | badge.tsx 変更で override 呼び出し側の実効 class が変わってしまう |
| SC6a catalog `--control-surface` HEX + focus + 日付月ナビ | 旧表記残存 | docs review（`rg -Fn`、非 vitest/cargo） | SC6a: `02-component-catalog.md` shows 0 hits for `#fff（S44）`, `border-stone-300\` + soft ring`, `input は \`border-input bg-background\`` and ≥1 hit for their new wording | いずれかの旧表記が 1 件以上残る、または新表記が 0 件 |
| SC6b DSR-22 `--control-surface` HEX | 旧表記残存 | docs review（`rg -Fn`、非 vitest/cargo） | SC6b: `01-decision-rules.md` DSR-22 shows 0 hits for `#ffffff` control-surface wording and ≥1 hit for `#fafaf9` wording | 旧表記が残る、または新表記が 0 件 |

## Mutation Oracle Notes

- SC1/SC2 は `variant="default"`（対照 case）を必ず併記し、新 class が意図しない variant にまで漏れ出していないことを同一 test 内で確認する（空集合 oracle 禁止の趣旨、意図しない過剰適用も検出する）
- SC4a〜SC4k は「file 内の対象箇所すべて」を 1 test 内で列挙し、1 箇所でも取りこぼすと fail する構成にする（`InventoryRecordsPage`/`ProductForm`/`StockMovementsPage`/`ReturnExchangePage` は複数箇所を含むため、mutant は「N 箇所のうち 1 箇所だけ戻す」を想定し、それでも fail することを Writer 完了条件とする）
- SC4d は `:147` の非対象要素（`registerOptionClass`）が誤って変更されないことも同一 test 内で確認し、過剰適用を検出する
- SC5 は「呼び出し側の override が badge.tsx の base 変更に勝つ」ことを検証する対のオラクルであり、`StockStatusBadge` の 3 状態すべてが変化しないことを確認してから SC2 の badge.tsx 変更を確定する

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC1〜SC5 は vitest、SC6a/SC6b は `rg -Fn` の docs review オラクル（vitest/cargo ではない静的検査だが Plan Gate/Final Review の再検証対象として本 Matrix に明示した、Lane 3 SC8a/SC8b の先例に倣う）。
