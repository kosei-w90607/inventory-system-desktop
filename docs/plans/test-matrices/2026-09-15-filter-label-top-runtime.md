# Test Design Matrix: ㉑ フィルタ Label 上置き + 見出し 2 段の runtime 反映

対象 packet: [2026-09-15-filter-label-top-runtime](../2026-09-15-filter-label-top-runtime.md)（SPEC-FILTER-LABEL-RT-1、D-RT1〜8）。

## Risk

Risk: R3

## Contracts Under Test

- C1 catalog ⑨ 使用トークン: toolbar の全フィルタ入力が `div.grid.gap-1` + 上置き label（weight 400）で、accessible name は不変
- C2 catalog ⑨ DepartmentFilter 内部 block: `htmlFor` は SelectTrigger の id、`labelId` は不要、5 site 一括
- C3 catalog ⑨ D1 Checkbox 句: フィルタ toolbar 内の Checkbox は label 内包 + `self-center`
- C4 catalog ⑤ アクセシビリティ: toolbar 内 SegmentedControl は上置き可視 Label（`<span id>` + `aria-labelledby`）、tab / mode 切替は Label なし、`ariaLabel` prop は常に必須
- C5 catalog ① 構造 block: actions 持ち `PageHeader` は `header.space-y-1` > 見出し行（h1 `min-w-0 flex-1` + `shrink-0` actions）+ 全幅の subtitle / description。actions 無しは DOM 不変
- C6 catalog ① セクション見出し variation: h2 `text-xl font-semibold`、右要素持ちは見出し行 + 説明行の 2 段、h2 `min-w-0 flex-1`
- C7 失敗定義: search state / 候補ソース / 確定経路 / 文言 / tab 型 / actions 無し page / `src-tauri` / function-design は不変

## Failure Modes

- F1 label wrapper を `grid gap-1` にした際に `htmlFor` / id が外れ、`getByRole("combobox", { name })` が解決しない
- F2 `labelId` 撤去で `aria-labelledby` を参照していた site がある（実測では未参照だが、撤去後の test で検出）
- F3 SegmentedControl の `label` 指定時に `aria-label` と `aria-labelledby` が併存し、accessible name の出どころが二重化する / `label` 指定時に group name が span と一致しない
- F4 tab 型 SegmentedControl（TabsHeader / ModeTabs）に `label` が渡り可視 Label が付く
- F5 `PageHeader` の 2 段化で actions 無し分岐まで書き換わり 13 page の DOM が変わる / description が左 group に残り 2 段にならない / h1 の `min-w-0 flex-1` が欠け長い見出しで actions が次行左へ落ちる
- F6 棚卸し Checkbox の label 内包で `getByLabelText("未入力のみ表示")` が解決しない、または `id` が二重になる
- F7 `StocktakePage.test.tsx:1185,1261` の完全一致 literal が旧 class のまま FAIL する、または literal を消して「旧 frame 不在」の検出力を失う
- F8 形態 C の 2 段化で `<Progress>` が `space-y-1` の内側へ入る / 説明 `<p>` が row の中に残る
- F9 h2 sweep が `HomePage.tsx` や非 h2（`p.text-lg`）まで書き換える、または 27 箇所に取りこぼしがある
- F10 catalog の「runtime 反映は後続 lane」marker が残る / ① canonical 行の `description?` 追加漏れ

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 / C2 | F1 / F2 | unit | `src/components/patterns/DepartmentFilter.test.tsx`（既存 + 追加: wrapper が `grid gap-1`、`getByRole("combobox", { name: "部門" })` 解決、`aria-labelledby` 属性なし） | label の `htmlFor` が trigger id を指さない / `labelId` が残る |
| C1 | F1 | regression | 既存 page test: `ProductListPage.test.tsx` / `StockInquiryPage.test.tsx` / `PriceRevisionFilters.test.tsx:73-77` / `StocktakePage.test.tsx` / `IntegrityCheckPage.test.tsx` の `getByRole("combobox", { name: "表示件数" })` 等（無変更で PASS） | wrapper 変更で accessible name が壊れる |
| C1 | F1 | rg oracle | AC2 / AC4（wrapper が `flex items-center gap-2` でない、`font-normal` の有無） | 一部 site が旧配置のまま |
| C4 | F3 | unit | `src/components/ui/segmented-control.test.tsx`（追加: `label="廃番表示"` → `getByRole("group", { name: "廃番表示" })` 解決 + `getByText("廃番表示")` が `span` + group に `aria-label` 属性なし / `label` なし → `aria-label={ariaLabel}` 現行どおり） | `aria-label` 併存 / span と group が id で結ばれていない |
| C4 | F3 | integration | `src/features/products/ProductListPage.test.tsx`（追加: 廃番表示 / PLU表示 / 並び順 の 3 group が name で解決し、同名の可視 text が存在） | `label` prop が渡っていない |
| C4 | F4 | rg oracle | AC3（`src/features/sales` / `ModeTabs.tsx` に ` label=` 0 件） | tab 型に label が付く |
| C5 | F5 | unit | `src/components/patterns/PageHeader.test.tsx`（追加: actions + description で description `<p>` の親が `header`〈見出し行の sibling〉、h1 に `min-w-0 flex-1`、`header` が `space-y-1` / actions 無し（title のみ・title + subtitle）の DOM が現行 snapshot と一致） | 左 group に残る / actions 無し分岐が変わる / `min-w-0 flex-1` 欠落 |
| C3 | F6 | unit | `src/features/stocktake/StocktakePage.test.tsx`（既存 `getByLabelText("未入力のみ表示")` 相当 + 追加: `label` が `Checkbox` を内包し `self-center` を持つ） | label 内包に失敗 / `self-center` 欠落 |
| C1 | F7 | unit | `src/features/stocktake/StocktakePage.test.tsx:1185,1261` の literal を `"flex flex-wrap items-end gap-3 rounded-lg border bg-card p-4"` へ更新（旧 frame 不在の意図は保つ） | 旧 literal のまま / literal 削除 |
| C6 | F8 | unit | `src/features/stocktake/StocktakePage.test.tsx`（追加: `StocktakeProgressHeader` の説明 `<p>` が h2 の row の sibling、`<Progress>` の親が `space-y-2`）/ `src/features/integrity-check/IntegrityCheckPage.test.tsx`（追加: 差異のある商品の説明 `<p>` が row の sibling、h2 に `min-w-0 flex-1`） | 説明が row 内に残る / Progress が `space-y-1` 内へ入る |
| C6 | F9 | rg oracle | AC8（`<h2 className="text-lg font-semibold">` 0 件、HomePage `text-lg font-medium` 3 件不変）+ `npm run typecheck` | 取りこぼし / 除外違反 |
| C7 | F9 | rg oracle | AC10（`src-tauri` / function-design / DSR / sales / ModeTabs / home に diff 0） | 範囲外に触る |
| C5 / C6 / C1 | F10 | docs review | AC9 / AC12 | marker 残存 / `description?` 欠落 |
| 全体 | — | L3 | AC-L3-1〜4（github mode の manual record） | 実描画が mockup-g と異なる |

## State Lifecycle Matrix

not applicable: 本 lane は class / DOM 構造 / 可視 label の配置のみで、state（URL / query / cache / form）に触れない。`SegmentedControl` の `label` は描画時固定の prop で lifecycle を持たない。search state 不変は C7 の rg oracle（AC10）と既存 page test（無変更 PASS）で担保する。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 上置き label（`grid gap-1` + `<label className="text-sm text-muted-foreground" htmlFor>`） | 既に上置き: 入出庫履歴 `InventoryRecordsPage.tsx:160-` / 操作ログ `OperationLogsPage.tsx:348-` / 在庫変動 `StockMovementsPage.tsx:134-` / ProductList 1 段目 `:106` / SearchBar live 型 `:177`。横並び: packet 実測表 #1〜#6 | #1〜#6 の全 site | ProductAddSuggest wrapper 5 箇所（toolbar 外、⑮）、form 内の `Label`（FormSection 配下は ④ の規範） | AC1 / AC2 |
| フィルタ toolbar 内 Checkbox（label 内包） | `PriceRevisionFilters.tsx:102,143`（内包）/ `StocktakePage.tsx:756`（sibling） | Stocktake 1 site + `self-center` 3 site | toolbar 外: `IntegrityCheckPage.tsx:399` / `PriceRevisionPage.tsx:65`（内包、toolbar 外）/ `ProductForm.tsx:226` / `BackupRestorePage.tsx:415,594`（sibling、form 内）/ `ProductImportPreview.tsx:132`（`aria-label` のみ） | AC6 |
| SegmentedControl 使用 site | `ProductListPage.tsx:135,143,179`（toolbar）/ `src/features/sales/**` TabsHeader / `monthly-sales/components/ModeTabs.tsx`（tab / mode） | toolbar 3 site | tab / mode 2 site（catalog ⑤: 可視 Label を持たない） | AC3 |
| `PageHeader` actions 持ち page | `rg -l "<PageHeader" src --glob "!*.test.tsx"` 28 page 中 actions 持ち 15（⑳ D8 実測: 説明なし 9 / subtitle 5 / CSV 1） | component 1 箇所 | actions 無し 13 page（DOM 不変） | AC5 / `PageHeader.test.tsx` |
| section h2 | `<h2 className="text-lg font-semibold">` 27 箇所 / `text-xl font-semibold` 既存（IntegrityCheck / Stocktake / FormSection ④） | 27 箇所 | `HomePage.tsx:90,95,100`（`font-medium`、home lane）/ 非 h2 の `text-lg`（`IntegrityCheckPage.tsx:491` / `BackupRestorePage.tsx:577` / `ProductImportPreview.tsx:244` / `DailySalesPage.tsx:237`） | AC8 |
| accessible name（testing-library `getByRole` name） | 各一覧 test の `combobox`「表示件数」/「部門」、`ProductListPage.test.tsx:769,827` の `aria-labelledby` 実績 | — | — | 既存 test 無変更 PASS |

## Negative Paths

- missing input: `SegmentedControl` に `label` 未指定 → `aria-label={ariaLabel}` 現行どおり（unit）
- invalid input: not applicable（文字列 prop のみ）
- duplicate/ambiguous input: `useId()` で labelId 衝突なし（同 page に 3 group 隣接、`ProductListPage.test.tsx` の 3 group 解決で確認）
- unknown reference: `labelId` 撤去後に参照が残らない（AC1 rg 0 件 + typecheck）
- dependency missing: not applicable
- permission/write failure: not applicable
- dry-run side effect: not applicable

## Boundary Checks

- threshold: not applicable
- null/default: `subtitle` / `description` は `!== undefined` 判定（空文字は描画する現行契約を維持、`PageHeader.test.tsx`）
- empty/non-empty: actions 無し → 分岐不変（snapshot）
- min/max: 長い h1 / h2（`min-w-0 flex-1`）で右要素が次行へ落ちない（jsdom では layout 不可 → class assert + L3 AC-L3-3）
- status/policy enum: not applicable
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: not applicable（wire 非接触）

## Compatibility Checks

- old schema/input: not applicable
- new schema/input: not applicable
- output order: DOM 順序（label → 入力）は `compareDocumentPosition` の既存 assert（`StocktakePage.test.tsx:1159-1183`）が維持
- optional field behavior: `label?` 未指定で現行と同一 DOM

## Data Safety Checks

- source-derived data: なし
- generated outputs: なし（`generate:routes` は fresh worktree の vitest 前提のみ、成果物差分 0 を AC10 相当で確認）
- secrets: なし
- local-only files: `.local/codex-orders/**`
- synthetic sample boundaries: test fixture のみ

## Main Wiring / Integration Checks

- helper connected to main path: `SegmentedControl` の `label` が `ProductListPage` の 3 site に実際に渡る（`ProductListPage.test.tsx`）
- output reaches manifest/report: not applicable
- effective config reaches runtime: not applicable
- CLI arg reaches implementation: not applicable

## Mutation-style Adequacy Questions

- `SegmentedControl` が `label` 指定時も `aria-label` を出力し続けたら → `segmented-control.test.tsx` の「`aria-label` 属性なし」assert が FAIL
- `aria-labelledby` が span の id を指さなかったら → `getByRole("group", { name })` が FAIL
- `PageHeader` の description を左 group に戻したら → `PageHeader.test.tsx` の「`<p>` の親が `header`」assert が FAIL
- `PageHeader` の actions 無し分岐を書き換えたら → snapshot が FAIL
- h1 の `min-w-0 flex-1` を落としたら → class assert が FAIL
- 棚卸し Checkbox を sibling のまま残したら → 「`label` が `Checkbox` を内包」assert が FAIL
- `<Progress>` を `space-y-1` の内側へ入れたら → 親 assert が FAIL
- h2 sweep を 1 箇所忘れたら → AC8 rg が 1 件
- tab 型に `label` を渡したら → AC3 rg が 1 件
- guard（`label !== undefined` 分岐）を外して常に wrapper を出したら → `label` なし case の DOM 比較が FAIL

## Residual Test Gaps

- 実描画（下辺揃え、Checkbox の縦中央、説明行の折り返し、20px）は jsdom で検証できない → L3 AC-L3-1〜4
- h2 sweep 27 箇所の見た目差は L3 で 1 page のみ抜き取り（token 統一は rg + typecheck で担保）
