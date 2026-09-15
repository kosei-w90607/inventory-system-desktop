# Test Design Matrix: ㉒ 表示小修正 batch 2

対象 packet: [2026-09-15-display-fixes-batch-2](../2026-09-15-display-fixes-batch-2.md)（SPEC-DISP-B2-1、D-B1〜7）。R2 のため任意だが test 更新が 5 file に及ぶため付ける。

## Risk

Risk: R2

## Contracts Under Test

- C1 69 §69.9: 区画見出し「基準値」、h1「在庫少の基準」
- C2 69 §69.7: 空 / 非整数 / 1 未満 / 99999 超は保存拒否、文言は「1〜99999の整数を入力してください」1 本
- C3 catalog ⑥: `AlertTitle` は `font-semibold`、構造不変
- C4 catalog ① / 58 §58.7: 在庫照会 subtitle 1 行
- C5 catalog ⑬ / 58 §58.10: 在庫状態 Badge「正常」（stone 無彩色不変）
- C6 58 §58.7 / mockup-d `:177`: `status !== "all"` で「全 N 件」（N = filter 後の `items.length`）、`status === "all"` は現行の PaginationSummary、0 件は EmptyState のみ
- C7 65 §65.8.1: 一覧 6 列（明細数なし）、`item_count` は DTO に残り代表商品分岐が使う

## Failure Modes

- F1 見出しを変えたが 69 / test が旧文言のまま（または h1 まで変わる）
- F2 文言を 1 本化した際に判定分岐（1 未満 / 99999 超）まで消える
- F3 `AlertTitle` の class 変更が `line-clamp-1` 等を落とす
- F4 「通常」が docs / test に残る
- F5 件数行が `status === "all"` でも出る / 0 件で出る / N が filter 前の件数になる / `PaginationSummary` の gate が変わる
- F6 列削除で `toHaveLength(7)` が残る / `item_count` の参照を消して代表商品分岐が壊れる / `ManualSalePage` の明細数まで消える
- F7 ㉑ の hunk（表示件数 block）と衝突する編集

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | F1 | unit | `src/features/threshold-settings/ThresholdSettingsPage.test.tsx`（既存 `:304` h1 + 追加 `getByRole("heading", { level: 2, name: "基準値" })`） | 区画見出しが旧文言 / h1 が変わる |
| C1 / C2 | F1 | rg oracle | AC1 / AC6 | 69 の同期漏れ |
| C2 | F2 | unit | `ThresholdSettingsPage.test.tsx:96,109,122,135`（4 case の期待文言を同一文へ、`mockUpdateSetting` 未呼出の assert は維持） | 判定分岐が消える（保存が通る） |
| C3 | F3 | unit | `src/components/ui/alert.test.tsx`（追加: `AlertTitle` が `font-semibold` を持ち `font-medium` を持たない） | class 差替え漏れ |
| C4 | — | unit | `src/features/stock-inquiry/StockInquiryPage.test.tsx`（追加: `getByText("商品ごとの在庫数と状態を確認し、その場で入出庫へ進みます")`） | subtitle 未設定 |
| C5 | F4 | unit | `src/features/stock-inquiry/components/ProductListTable.test.tsx:85,87`（「正常」） | 旧文言 |
| C5 | F4 | rg oracle | AC4 | docs 残存 |
| C6 | F5 | unit | `StockInquiryPage.test.tsx`（追加 3 本: low_stock 3 件 → 「全 3 件」/ all → 「全 」の text なし + PaginationSummary 現行 / low_stock 0 件 → EmptyState のみ） | gate 反転 / 0 件で描画 / N 誤り |
| C6 | F5 | rg oracle | AC5（`statusValue === "all"` 2 件不変） | gate 改変 |
| C7 | F6 | unit | `src/features/inventory-records/InventoryRecordsPage.test.tsx:164`（代表商品「-」のみ）/ `:922`（6 列）/ `:927`（`toHaveLength(6)`） | 列が残る / 代表商品分岐が壊れる |
| C7 | F6 | rg oracle | AC7（`item_count` 残置、ManualSalePage 不変） | 過剰削除 |
| C1〜C7 | F7 | review | ㉑ branch との `git diff` hunk 比較（Coordinator、stack 時） | 同一 hunk を編集 |

## State Lifecycle Matrix

not applicable: 文言・class・列の変更のみ。件数行は `data` 由来の派生表示で独自 state を持たず、`status` の URL state は既存契約（58 §58.4）のまま。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 「通常」を在庫状態として描画 | `rg -n '通常' src --glob '*.tsx' --glob '!*.test.tsx'` → `StockStatusBadge.tsx:36` のみ（`ProductListTable.tsx:98` は CSS comment） | 1 site | 74-ui-operation-logs の「通常」（別文脈） | AC4 |
| 「明細数」列 / field | 一覧列 `InventoryRecordsPage.tsx:354,377` / `ManualSalePage.tsx:360,743` / 記録詳細 `*RecordDetailPage.tsx` 5 file / 保存結果パネル 3 file（`ReceivingPage.tsx:331` / `DisposalPage.tsx:316` / `ReturnExchangePage.tsx:451`）/ `daily-sales` の「売上明細数」4 hit（別語） | 1 page（一覧列） | ManualSalePage（65 の対象外、別画面）/ 記録詳細 5 file + 保存結果パネル 3 file（65 §65.5・各画面 doc の別契約、L8-4 は一覧列のみ）/ 売上明細数（別語） | AC7 |
| `AlertTitle` 使用 | 35 file 81 箇所 | component 1 箇所 | — | `alert.test.tsx` |
| PageHeader subtitle 持ち page | 入庫 / 廃棄 / 手動販売 / 返品交換 / 取引先管理（⑳ D8 実測）+ 在庫少の基準 | 在庫照会 1 page 追加 | — | AC3 |
| 件数表示 | `PaginationSummary`（status = all）/ mockup-d `.cnt-plain` | 在庫照会の絞り込み時 1 site | 他一覧（server pagination で PaginationSummary が担う） | AC5 |

## Negative Paths

- missing input: 空欄 → 「1〜99999の整数を入力してください」+ 保存拒否（`:96`）
- invalid input: 小数・文字 / 0 / 100000 → 同文言 + 保存拒否（`:109,122,135`）
- duplicate/ambiguous input: not applicable
- unknown reference: not applicable
- dependency missing: not applicable
- permission/write failure: not applicable
- dry-run side effect: not applicable

## Boundary Checks

- threshold: 1 / 99999 の境界は既存 test の入力値を維持
- null/default: `data.items.length === 0` → 件数行なし
- empty/non-empty: status = all / low_stock の両 case
- min/max: not applicable
- status/policy enum: `status` の 3 値（all / low_stock / out_of_stock）で件数行の有無が 1 : 2
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: not applicable

## Compatibility Checks

- old schema/input: `item_count` を持つ既存 fixture は無変更
- new schema/input: not applicable
- output order: 列順（記録種別 / 業務日付 / 代表商品 / 状態 / 記録日時 / 操作）
- optional field behavior: not applicable

## Data Safety Checks

- source-derived data / generated outputs / secrets: なし
- local-only files: `.local/codex-orders/**`
- synthetic sample boundaries: test fixture のみ

## Main Wiring / Integration Checks

- helper connected to main path: `AlertTitle` の class が実 Alert に効く（`alert.test.tsx` は実 component を描画）
- output reaches manifest/report: not applicable
- effective config reaches runtime: not applicable
- CLI arg reaches implementation: not applicable

## Mutation-style Adequacy Questions

- 件数行の gate を `statusValue === "all"` に反転したら → 「all → 件数行なし」test が FAIL
- N を `data.totalCount ?? 0` にしたら → low_stock（totalCount null）で「全 0 件」となり「全 3 件」test が FAIL
- 判定分岐から `< 1` を外したら → `:122` の保存拒否 assert が FAIL
- `AlertTitle` の class を戻したら → `alert.test.tsx` の class assert が FAIL
- 列を残したら → `:922` の 6 列 assert が FAIL
- `item_count` 参照を消したら → typecheck または代表商品 test が FAIL
- 「通常」を残したら → AC4 rg が 1 件以上

## Residual Test Gaps

- weight の見え方（600 が本文より強いか）と「全 N 件」の配置は jsdom で検証不可 → L3 AC-L3-2 / 3
