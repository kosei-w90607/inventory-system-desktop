# Test Design Matrix: UI 規約の runtime 反映（⑭）

Plan Packet: [../2026-09-08-ui-conventions-runtime.md](../2026-09-08-ui-conventions-runtime.md)

## Risk

R3（状態 Badge tone・CTA secondary・SearchBar live Label・Alert warning の runtime 反映。operator が業務判断に使う視覚表現を変更する。render の実際の見た目は happy-dom で完全には判定できないため L3 が oracle、本 Matrix は DOM 契約〈class/属性/icon 存在/accessible name〉に限定する）。

## Contracts Under Test

- SC1: `badge.tsx` の `tone`（`warning`/`success`/`destructive`）が catalog `:859` の exact class 文字列を出す（RUNTIME 節 S1）
- SC2: `badge.tsx` の `secondary` variant が `border-border` を持つ。`StocktakePage.tsx:624,854` の手動 `border-border` 併記が削除されても見た目が不変（S1）
- SC3: ③強調 3 サイト（`ProductRankingTable.tsx:80`/`ProductImportPreview.tsx:76`/`BackupRestorePage.tsx:533`）が `border-warning` を持ち、`BackupRestorePage.tsx:533` が `variant="default"` へ是正される（S1）
- SC4: S2 で列挙した非中立①状態サイトが `tone` + icon を持つ: `ProductTable.tsx:88`（warning「未反映」）/`:93`（success「反映済み」）
- SC5: `ResultStep.tsx:47` の単一 Badge が `isPartial` の真偽で warning（「部分成功」）/success（「成功」）を出し分ける
- SC6: `DailyReportImportPage.tsx:163-182` の単一 Badge が 3 分岐（`alreadyImported`→warning「取込み済み」/`requiresAdditionalConfirm`→既存 warning 相当を `tone` へ置換「同日データあり」/else→success「確認済み」）で正しい tone を出す
- SC7: `IntegrityCheckPage.tsx:389` と `StocktakePage.tsx:404` の `bg-success` 直塗り pill が `variant="outline"` + `tone="success"` へ移行し、icon が付く
- SC8: `CsvImportRecordDetailPage.tsx:140` は `STATUS_TONE`（`STATUS_LABELS` と対の `Record<CsvImportStatus, tone>`）経由で `completed`→success/`completed_partial`→warning/`rolled_back`→destructive の 3 状態すべてに tone + icon を持つ（Coordinator adjudication 2026-09-08、tone family = 感情区分の一貫適用）。`:192`「明細取消済み」は常に destructive tone + icon
- SC9: `StocktakePage.tsx:863,1002` の `formatListDifference` 表示に DSR-08 の色（+ → `text-success-strong`、− → `text-destructive-strong`、0 → `text-muted-foreground`）が付く
- SC10: `IntegrityCheckPage.tsx:379-382`（**F14, Opus P2-4 是正**: 起票時 `:377-378` から訂正）の差異数値 span に同上 3 色が対で付く（隣接 `:383` の `differenceLabel` Badge は tone 対象外のまま無変更）
- SC25（F2, Sonnet P1-2）: `daily-sales/components/SummaryCardsBar.tsx:139` と `monthly-sales/components/SummaryCardsBar.tsx:115` の `diff >= 0 ? "text-success-emphasis" : "text-destructive"` が同上 3 色（`diff === 0` は `text-muted-foreground`）へ置換され、`diff === 0` が緑にならない
- SC26（F3, Sonnet P1-3, Coordinator adjudication A）: `daily-sales/components/ProductTable.tsx:133`「手動」badge が amber className（`bg-warning-soft text-warning-strong`）を失い `variant="secondary"` のみになる（`tone`/`data-tone` は持たない、②分類）
- SC27（F4, Sonnet P2-1）: `ReturnExchangePage.tsx:603-607`「レジ未処理」が `tone="warning"` + icon へ機械的に移行し、`:580`「レジ戻し済み」（中立 stone class）は無変更のまま
- SC11: `button.tsx` の `secondary` variant が `border border-border` を持つ
- SC12: `ProductForm.tsx:322`「新しい取引先を追加」/`:352`「追加する」が `variant="secondary"` へ降格し、`data-variant="secondary"` を持つ
- SC13: `PriceRevisionFilters.tsx:82`「新しい取引先を追加」が `variant="secondary"` へ降格する
- SC14: `SupplierManagementPage.tsx:22`「新しい取引先を追加」button は primary のまま変更されない（negative oracle）
- SC15: `SearchBar.tsx` の `LiveSearchBar` が可視 `<Label htmlFor>`（既定文言「商品を検索」）を持ち、`aria-label` を持たない。`CommitSearchBar` は Label + `aria-label` 併存のまま不変
- SC16: `InventoryRecordsPage.test.tsx:744` の negative assertion（可視 label 不在）が、live 型 Label 追加後は反転した positive assertion（可視 label 存在）として成立する
- SC17: `StockInquiryPage.test.tsx:467` の `getByRole("searchbox")` query が `aria-label` 撤去後も解決し続ける（role ベース query は影響を受けないことの回帰確認）
- SC18: `alert.tsx` に `warning` variant が catalog `:392` の exact class 文字列で追加される
- SC19: `PriceRevisionPage.tsx:79` が `variant="warning"` + `AlertTriangle` + `AlertTitle`「ご注意」+ 既存本文を `AlertDescription` に持ち、`role="note"` を維持する
- SC20: 14 箇所の手書き warning Alert（起票時実測列挙）が `variant="warning"` へ移行し、`role` 属性・icon・文言が維持される
- SC21: `HomePage.tsx:78` が `variant="destructive"` のまま `AlertTriangle` icon を追加で持つ
- SC22（**F1, Opus P1-4 是正、negative→positive に転換**）: `DailySalesPage.tsx:174-176`/`MonthlySalesPage.tsx:165-167` の plain `<p>`「レジ日報は未取込みです」が `<Alert variant="warning" role="status">` + `AlertTriangle` + `AlertTitle`（既存文をそのまま使用）へ変換される。`MonthlySalesPage.tsx:169-171`「公式部門集計の行はありません」（別文言）は `<p>` のまま
- SC23: `01-decision-rules.md` の DSR-23 見出しが 1 個のみ（`:469-479` の重複ブロックが削除される）
- SC24: catalog `:404` の `PriceRevisionPage.tsx:112-116` citation が `:79-83` へ訂正される（**F15**、DailySalesPage/MonthlySalesPage citation 自体は変更しない）
- SC28（F16, Opus P2-6）: catalog `:836-839` の①状態 tone family マッピング表の success 行・warning 行に `CsvImportRecordDetailPage.tsx:140` の該当分岐（成功/部分成功）が追加される

## Failure Modes

- 中立 tone（`ok`/`formatRecordStatus`/`differenceLabel` Badge）に tone が誤って付く、または非中立サイトに tone が付かない
- 非中立 tone に icon が付かない（DSR-22 違反）
- `ResultStep.tsx`/`DailyReportImportPage.tsx` の複数状態出し分けで、意図しない分岐に tone が付く、または `requiresAdditionalConfirm` 分岐が二重着色になる
- `CsvImportRecordDetailPage.tsx:140` の `STATUS_TONE` map が状態語と異なる tone を返す（例: 「部分成功」に destructive が付く、「成功」に warning が付く）
- DSR-08 の色付けが記号・文言を巻き込んで変更してしまう、または 0 のケースが無色のまま放置される（3 ケースのうち 1 つでも欠けると空集合オラクルになる）
- CTA secondary 降格が `SupplierManagementPage.tsx` の primary まで巻き込む
- SearchBar live 型の `aria-label` 撤去で `StockInquiryPage.test.tsx:467` の `getByRole("searchbox")` が解決できなくなる（実際には role ベースなので影響しないはずだが、回帰確認を怠ると見逃す）
- commit 型の Label/aria-label 併存が誤って変更される
- Alert warning 移行で `role` 属性や本文文言が失われる、または `PriceRevisionPage.tsx` の `AlertTitle` 追加で `role="note"` が壊れる
- `DailySalesPage.tsx`/`MonthlySalesPage.tsx` の plain text が Alert 化されないまま放置される（**F1 是正後の failure mode**、owner 決定 2026-09-06 の未反映）、または `role="status"` を誤る、または別文言の `MonthlySalesPage.tsx:169-171`（行なし）まで巻き込まれる
- `SummaryCardsBar.tsx` 2 サイト（F2）で `diff === 0` が緑（`text-success-strong`）または赤のまま残る 2 値分岐の名残
- `daily-sales/components/ProductTable.tsx:133`「手動」badge（F3）の amber className 撤去漏れ、または `ReturnExchangePage.tsx:603-607`「レジ未処理」（F4）の tone/icon 移行漏れ
- DSR-23 重複除去で本文の一部が欠落する、または `## 更新履歴` の位置がずれる

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 badge tone class | tone class 文字列の欠落/誤り | unit（`badge.test.tsx` 拡張） | SC1: `tone="warning"/"success"/"destructive"` はそれぞれ独立 literal 表で定義された class を持つ（cva オブジェクトから derive しない） | tone class が catalog `:859` の 3 点セットと異なる、または tone 間で class が入れ替わる |
| SC2 secondary border | `border-border` 欠落 | unit（`badge.test.tsx` 拡張） | SC2: `variant="secondary"` は `border-border` を持つ | class が付かない、または `StocktakePage.tsx` の手動併記削除後に枠が消える |
| SC3 ③強調枠 + variant 是正 | 枠欠落 / variant 取り違え残存 | unit（各 page test 拡張: `ProductRankingTable`/`ProductImportPreview`/`BackupRestorePage`） | SC3: 3 サイトとも `border-warning` を持ち、`BackupRestorePage.tsx:533` は `data-variant="default"` | 枠が付かない、または `BackupRestorePage` が `secondary` のまま |
| SC4 non-neutral tone + icon | tone 欠落 / icon 欠落 | unit（`src/features/products/components/ProductTable.test.tsx` 拡張、**F22 是正**: `daily-sales/components/ProductTable.test.tsx` と同名別 file のため full path で明示） | SC4: 「未反映」badge は `tone="warning"` + `svg` を持つ、「反映済み」badge は `tone="success"` + `svg` を持つ | tone/icon いずれかが欠ける |
| SC5 ResultStep 出し分け | 分岐の tone 取り違え | unit（`ResultStep.test.tsx` 拡張、なければ新設） | SC5: `isPartial=true` で `tone="warning"`+「部分成功」、`isPartial=false` で `tone="success"`+「成功」を対で確認 | 片方の分岐が他方の tone を持つ、または tone なしで通過する |
| SC6 DailyReportImportPage 3 分岐 | 分岐 tone 取り違え / 二重着色 | unit（`DailyReportImportPage.test.tsx` 拡張） | SC6: 3 分岐それぞれで期待 tone（warning/warning/success）+ 文言が対応する。`requiresAdditionalConfirm` 分岐が `className` 手書きでなく `tone` prop 由来であることも確認 | いずれかの分岐が誤った tone、または `requiresAdditionalConfirm` が二重に warning class を持つ |
| SC7 solid pill 移行 | 直塗り残存 / icon 欠落 | unit（`IntegrityCheckPage.test.tsx`/`StocktakePage.test.tsx` 拡張） | SC7: 「補正済み」「未入力 0」相当の完了 pill が `bg-success` 直塗りでなく `variant="outline"`+`tone="success"`+icon を持つ | `bg-success text-primary-foreground` が残る、または icon が欠ける |
| SC8 CsvImportRecordDetail 3 状態 tone | tone 取り違え / tone 欠落 | unit（`CsvImportRecordDetailPage.test.tsx` 拡張） | SC8: `status="completed"` は `tone="success"`+icon、`status="completed_partial"` は `tone="warning"`+icon、`status="rolled_back"` は `tone="destructive"`+icon の 3 ケースを個別に確認（非空集合オラクル、3 値とも独立 assert）。`:192`「明細取消済み」は常に destructive tone | 3 状態のいずれかで tone が欠ける、または他の状態の tone と入れ替わる（例: success↔warning の取り違え） |
| SC9 StocktakePage DSR-08 | 色欠落 / 記号・文言破壊 | unit（`StocktakePage.test.tsx` 拡張） | SC9: `difference` が正/負/0 の 3 ケースで `text-success-strong`/`text-destructive-strong`/`text-muted-foreground` をそれぞれ持ち、`+N`/`N`/`—` の文言は不変 | 3 ケースのいずれかで色が欠ける、または文言が変わる |
| SC10 IntegrityCheckPage DSR-08 | 色欠落 / Badge 側への誤混入 | unit（`IntegrityCheckPage.test.tsx` 拡張） | SC10: `:379-382`（F14 是正）の span が 3 ケースで対応する色を持つ。隣接 `:383` の Badge は `tone` 属性を持たない（negative） | span の色が欠ける、または Badge 側に tone が付いてしまう |
| SC25 SummaryCardsBar 3-way（F2） | `diff === 0` が緑/赤のまま残る | unit（`SummaryCardsBar.test.tsx` 拡張、なければ新設、daily-sales/monthly-sales 両方） | SC25: `diff` が正/負/0 の 3 ケースで `text-success-strong`/`text-destructive-strong`/`text-muted-foreground` をそれぞれ持つ（`diff >= 0` 境界の mutant を明示 kill） | `diff === 0` で `text-success-strong` が残る、または 3 ケースのいずれかで色が欠ける |
| SC26 daily-sales ProductTable「手動」（F3） | amber className 残存 | unit（`daily-sales/components/ProductTable.test.tsx` 拡張） | SC26: 「手動」badge は `data-variant="secondary"` を持ち `data-tone` 属性を持たない（negative）、`bg-warning-soft`/`text-warning-strong` class を持たない（negative） | amber className が残る、または誤って `tone` が付く |
| SC27 ReturnExchangePage レジ未処理（F4） | tone/icon 移行漏れ | unit（`ReturnExchangePage.test.tsx` 拡張） | SC27: 「レジ未処理」badge は `data-tone="warning"` + `svg` を持つ。「レジ戻し済み」badge は `data-tone` を持たない（negative、無変更確認） | tone/icon が付かない、または「レジ戻し済み」に誤って tone が付く |
| SC11 button secondary border | `border-border` 欠落 | unit（`button.test.tsx` 拡張） | SC11: `variant="secondary"` は `border` class を持つ | class が付かない |
| SC12 ProductForm CTA 降格 | 降格漏れ / query 破壊 | unit（`ProductForm.test.tsx` 拡張、既存 `:648,650` の role+name query は無変更のまま維持） | SC12: 「新しい取引先を追加」「追加する」button が `data-variant="secondary"` を持つ。既存の role+name ベース test はそのまま pass する | variant が outline/default のまま残る、または既存 role+name query が解決できなくなる |
| SC13 PriceRevisionFilters CTA 降格 | 降格漏れ | unit（`PriceRevisionPage.test.tsx` 拡張） | SC13: 「新しい取引先を追加」button が `data-variant="secondary"` を持つ | variant が outline のまま残る |
| SC14 SupplierManagementPage primary 不変 | 誤って降格される | unit（`SupplierManagementPage.test.tsx` 拡張、negative） | SC14: 「新しい取引先を追加」button が `data-variant="default"`（primary）のまま | 誤って secondary へ降格される |
| SC15 SearchBar live Label | Label 欠落 / aria-label 残存 | unit（`SearchBar.test.tsx` 拡張） | SC15: live 型は `getByLabelText("商品を検索")` で解決でき、`input.getAttribute("aria-label")` が `null`。commit 型は `getByLabelText("商品検索")` 解決 + `aria-label="商品検索"` の両方が残る（対照 case） | live 型に `aria-label` が残る、または Label が付かない。commit 型が誤って変更される |
| SC16 InventoryRecordsPage negative→positive 反転 | 反転漏れ | unit（`InventoryRecordsPage.test.tsx:744` 拡張） | SC16: `queryByText("商品検索", { selector: "label" })` は「商品を検索」を new selector として `getByText` で解決できる（positive） | 反転されず negative のまま残り false-positive で pass する |
| SC17 StockInquiryPage searchbox 回帰 | role query 破壊 | unit（`StockInquiryPage.test.tsx:467` 無変更で pass 確認） | SC17: `getByRole("searchbox")` が live Label 追加後も解決する | `aria-label` 撤去の副作用で role が変わり解決できなくなる |
| SC18 alert.tsx warning variant | class 文字列の誤り | unit（新設 `alert.test.tsx`） | SC18: `variant="warning"` は catalog `:392` の exact class を独立 literal 表で持つ | class が catalog と異なる |
| SC19 PriceRevisionPage warning Alert | role 破壊 / icon・title 欠落 | unit（`PriceRevisionPage.test.tsx` 拡張） | SC19: `getByRole("note")` で解決でき、`AlertTitle`「ご注意」+ `svg` を持ち、既存本文が `AlertDescription` に残る | `role="note"` が失われる、または title/icon が欠ける |
| SC20 14 箇所 warning 移行 | class/role/文言破壊 | unit（14 file の既存 test を無変更で pass 確認 + `data-variant="warning"` 追加アサーション） | SC20: 各サイトが `data-variant="warning"` を持ち、既存 `role`/文言アサーションは無変更で pass する | いずれかのサイトで role/文言が変わる、または variant が付かない |
| SC21 HomePage icon 追加 | icon 欠落 | unit（`HomePage.test.tsx` 拡張） | SC21: `variant="destructive"` のまま `svg`（`AlertTriangle`）を持つ | icon が追加されない |
| SC22 DailySalesPage/MonthlySalesPage Alert 化（F1、positive に転換） | 未変換 / role・title 誤り | unit（両 file の既存 test 拡張） | SC22: 「レジ日報は未取込みです」が `role="status"` の `Alert`（`data-variant="warning"`）+ `AlertTitle`（既存文そのまま）+ `svg` を持つ。`MonthlySalesPage.tsx:169-171`「公式部門集計の行はありません」は引き続き `<p>` のまま（negative、別文言サイトの無変更確認） | `<p>` のまま残る、`role`/title が誤る、または別サイトまで Alert 化される |
| SC23 DSR-23 重複除去 | 重複残存 / 本文欠落 | docs review（`rg -c`、非 vitest） | SC23: `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 1 | 2 個目のブロックが残る、または 1 個目が誤って消える |
| SC24 catalog citation 行番号訂正（F15） | 訂正漏れ | docs review（`rg -Fn`、非 vitest） | SC24: catalog `:404` の `PriceRevisionPage.tsx:112-116` が `:79-83` へ訂正されている | 旧行番号が残ったまま |
| SC28 catalog tone table 同期（F16） | 追加漏れ | docs review（`rg -Fn`、非 vitest） | SC28: catalog `:836-839` の success 行・warning 行に `CsvImportRecordDetailPage.tsx:140` の言及がそれぞれ追加されている | 片方または両方の行への追加が漏れる |

Mandatory oracle rule（全 SC 共通、⑧ Plan Review round 1 P1-1 の教訓を継承）: tone/variant の存在確認は `className` の文字列一致だけでなく `data-variant`/`data-slot`/`data-tone` 属性（`badge.tsx:39` の `data-variant`/`data-slot` + 本 lane 新設 `data-tone`〈F12〉/ `button.tsx:54` / `alert.tsx` 新設 `data-variant`〈F11〉）も併記する。className 文字列だけの assertion は tailwind の class 順序変更（prettier-plugin-tailwindcss）で壊れやすいため、`toHaveClass` の個別トークン指定を優先する。

## State Lifecycle Matrix

not applicable — 本 lane は静的な視覚表現（class/variant/icon/Label）の切替のみで、state machine・cache・route/search・import/export・retry・永続化 state を持たない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| ①状態 badge tone（非中立 + icon 必須） | `rg -n "<Badge" src/features src/components --glob '!*.test.*'`（**F3 是正**: 本 packet 再実行で 45 件、⑦ 起票時実測の 44 件は `ReturnExchangePage.tsx:603` を含む前の値） | S2 起票時実測列挙の全サイト（`CsvImportRecordDetailPage.tsx:140` は 3 状態すべて／`ReturnExchangePage.tsx:603-607` を F4 で追加、Coordinator adjudication 2026-09-08） | `formatRecordStatus` 共有（中立）、`ReturnExchangePage.tsx:580`（中立）、`daily-sales/components/ProductTable.tsx:133`「手動」（F3 で②分類へ確定） | 各 page test 拡張 |
| 手書き warning Alert class（`border-warning bg-warning-soft text-warning-strong`） | `rg -n 'border-warning bg-warning-soft text-warning-strong' src --glob '!*.test.*'`（14 hit、完全一致） | 14 箇所すべて | なし（全数移行） | AC4 rg + 各 page test |
| CTA outline→secondary 中間段 | `rg -n '<Button' src/features/products/components/ProductForm.tsx src/features/products/components/PriceRevisionFilters.tsx src/features/suppliers/SupplierManagementPage.tsx` | `ProductForm.tsx:322,352`、`PriceRevisionFilters.tsx:82` | `SupplierManagementPage.tsx:22`（画面唯一の primary、降格対象外） | `button.test.tsx` + 各 page test |
| SearchBar 呼び出しサイト | `rg -n "<SearchBar" src/features --glob '!*.test.*'` | `InventoryRecordsPage.tsx:214`/`StockInquiryPage.tsx:103`/`PriceRevisionFilters.tsx:47`/`ProductListPage.tsx:110`（4 件、ラベル省略で既定文言適用） | commit 型呼び出しサイト（現状の採用箇所なし、機能残置のため変更なし） | 各 page test + `SearchBar.test.tsx` |

## Negative Paths

- missing input: 該当なし（フォーム入力の必須/任意チェックは変更しない）
- invalid input: 該当なし
- duplicate/ambiguous input: `CsvImportRecordDetailPage.tsx:140` の共有 Badge が `STATUS_TONE` の 3 値それぞれで正しい tone のみを表示し、他の状態の tone を漏らさないこと（SC8）
- unknown reference: 該当なし
- dependency missing: 該当なし
- permission/write failure: 該当なし（UI 表示のみ、書込みなし）
- dry-run side effect: 該当なし

## Boundary Checks

- threshold: DSR-08 の `difference > 0` / `< 0` / `=== 0` の境界（SC9/SC10、0 を含む 3 分岐すべて検証）
- null/default: `badge.tsx` の `tone` 未指定（`defaultVariants` に含めない）で既存 variant の見た目が変わらないこと
- empty/non-empty: 該当なし
- min/max: 該当なし
- status/policy enum: `CsvImportStatus`（`completed`/`completed_partial`/`rolled_back`）の 3 値すべてが tone 対象（**F18, Sonnet P1-1 是正**: 起票時は `rolled_back` のみと記載していたが、Coordinator adjudication Q1〈2026-09-08〉により 3 値すべてへ変更済み、SC8）
- wire type: 該当なし
- internal type: 該当なし
- producer/consumer: 該当なし
- round-trip token: 該当なし
- precision/range: 該当なし
- cross-language parse: 該当なし

## Compatibility Checks

- old schema/input: 該当なし（DTO 変更なし）
- new schema/input: 該当なし
- output order: 該当なし
- optional field behavior: `SearchBarProps` の `label`/`id` は既定文言/既定 id にフォールバックし、既存呼び出しサイト（省略）の挙動は変わらない

## Data Safety Checks

- source-derived data: 該当なし
- generated outputs: 該当なし
- secrets: 該当なし
- local-only files: 該当なし
- synthetic sample boundaries: 該当なし

## Main Wiring / Integration Checks

- helper connected to main path: `badge.tsx`/`alert.tsx`/`button.tsx` の新規 variant/tone は既存の `cn()`/cva パターンを経由し、既存の `variant` 解決経路と同じ main path を通る（新設 wiring なし）
- output reaches manifest/report: 該当なし
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- tone success の class 文字列を warning に差し替えたら、`badge.test.tsx` の独立 literal 表（cva オブジェクトから derive しない）が fail するか（SC1）
- `ProductTable.tsx:88` の tone を `warning` から未指定へ戻したら、SC4 の (tone class + icon) 対アサーションが fail するか（icon だけを見る片側アサーションでは検出できない）
- `DailyReportImportPage.tsx:163-182` の `requiresAdditionalConfirm` 分岐の tone を誤って `success` に変えたら、SC6 の分岐別アサーションが fail するか
- `CsvImportRecordDetailPage.tsx:140` の `STATUS_TONE` で `success`↔`warning` を入れ替えたら（`completed`→warning、`completed_partial`→success の誤り）、SC8 の 3 ケース個別アサーションが fail するか
- `StocktakePage.tsx:863` の `difference === 0` ケースで色クラスを外し忘れたら（`text-success-strong` が 0 でも残る mutant）、SC9 の 3 ケース対アサーションが fail するか
- `button.tsx:17` の `secondary` から `border` を削除したら、SC11 が fail するか。同時に `SupplierManagementPage.tsx` の primary button が誤って secondary に変わったら SC14（negative）が fail するか
- `SearchBar.tsx` の live 型に `aria-label` を再導入したら、SC15 の negative oracle（`getAttribute("aria-label") === null`）が fail するか
- `alert.tsx` の warning class 文字列から `border-warning` を削除したら、SC18 が fail するか。同時に `PriceRevisionPage.tsx` の `role="note"` を `role="alert"` に変えてしまったら SC19 が fail するか
- `DailySalesPage.tsx:174-176` の `<Alert>` 化を revert して `<p>` に戻してしまったら（**F1 是正でオラクルが positive に転換**）、SC22 が fail するか。同時に `MonthlySalesPage.tsx:169-171`（別文言）まで誤って Alert 化してしまったら SC22 の negative 側が fail するか
- `daily-sales/components/SummaryCardsBar.tsx:139` の 3 分岐を `diff >= 0` の 2 分岐へ戻してしまったら（`diff === 0` が緑に戻る mutant）、SC25 が fail するか
- `daily-sales/components/ProductTable.tsx:133`「手動」badge に amber className を復元してしまったら、SC26 が fail するか
- `01-decision-rules.md` の DSR-23 重複ブロックを片方だけ消して見出し文言を変えてしまったら、SC23（見出し数 = 1）は pass するが本文欠落は検出できるか（see below: 本文一致は Final Review の目視 diff で補完、`rg -c` は見出し数のみ検証する構造的限界がある）

## Residual Test Gaps

- 実際の視覚的な色（琥珀/緑/赤の識別しやすさ、DPI 125%/150% での崩れ）は happy-dom で検証不能、owner Windows native L3 が唯一の oracle（AC-L3-1〜4）
- forced-colors（ハイコントラスト）モードでの tone/枠の見え方は本 lane の Scope 外（DSR-22 の低視力 L3 checklist 項目として別途扱う、既存運用を継続）
- SC23 の `rg -c` は見出し数のみを検証し、2 個の重複ブロックの本文が完全一致しているかまでは機械検証しない（起票時実測で `sed` 突合により事前確認済みだが、Writer の削除操作自体の正確性は Final Review の目視 diff に依存する）
