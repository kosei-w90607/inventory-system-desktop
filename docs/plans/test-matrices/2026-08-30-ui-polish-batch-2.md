# Test Design Matrix: UI 表示磨き batch 第 2 弾

Plan Packet: [../2026-08-30-ui-polish-batch-2.md](../2026-08-30-ui-polish-batch-2.md)

## Risk

Risk: R2

## Contracts Under Test

- UI-02-D15: 入庫は保存済み、更新は商品マスタ原価を今回の実原価へ変更、見送りは入庫記録を残してマスタ原価を変更しない。
- SPEC-SUP-D4 / D6: 統合前に source が一覧から削除され、商品・入庫記録が target へ引き継がれると読める。
- UI-01a-D11: 現在の filter 一致全件だけが一括対象で、不一致商品は変更されない。
- UI-11b-D11 / D12、DSR-17 分類③: one-shot flag consume 時だけ Home を先頭表示し、通常 Home 到達は scroll しない。D11 の StrictMode / mount 寿命は不変。
- UI-02-D15 / DSR-16: 固有操作を持つ複数の原価差分商品は、一意な商品名見出し付き summary card で識別できる。
- UI-13-D5 / DSR-16: 補正結果の同型反復は per-item box でなく `divide-y` 行区切りで読める。
- route、search state、command wire、generated bindings、Rust / DB は不変。既存 test を削除・skip しない。

## Failure Modes

- 原価差分 dialog が入庫保存とマスタ更新を同じ操作に見せる、または見送りで入庫も消えるように読める。
- supplier source の削除または商品・入庫記録の引き継ぎの片方が説明から欠落する。
- PLU bulk の filter 外商品まで変更されるように読める。
- Home mount で flag の有無にかかわらず scroll する、または flag true でも Alert が画面外のままになる。
- CostDiff の商品名が `dd` のままで複数 card の一意見出しがない。
- Integrity fix summary の各行に rounded border が残り、同一意味階層の box が反復する。
- 文言実装と function-design が drift する、旧説明が残る、既存 test が削除・skip される、scope 外 file が変わる。

## Test Matrix

既存 test の実在は `rg` で確認済み: `ReceivingPage.test.tsx`、`SupplierManagementPage.test.tsx`、`ProductListPage.test.tsx`、`HomePage.test.tsx`、`BackupRestorePage.flow.test.tsx`、`IntegrityCheckPage.test.tsx`。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| UI-02-D15 文言 3 点 | 保存済み / 更新効果 / 見送り非効果の欠落 | RTL | T1 `ReceivingPage`: CostDiff dialog description に 3 要素句が全て render される | 1 点でも省略、逆転、別領域への偶然一致 |
| SPEC-SUP-D4 / D6 | source 削除または参照引き継ぎの欠落 | RTL | T2 `SupplierManagementPage`: stage 2 に source / target 名、一覧削除、商品・入庫記録の引き継ぎを assert | DELETE だけ / 付替えだけの片側説明 |
| UI-01a-D11 | filter 外非変更の境界欠落 | RTL | T3 `ProductListPage`: PLU confirm dialog に「現在の絞り込みに一致しない商品は変更されません」を assert | 件数文言だけで対象外境界がない |
| UI-11b-D12 positive | flag true でも scroll 不発 | RTL | T4 `HomePage`: `consumeRestoreSuccessPending()` true の mount で Alert 表示 + `scrollPageToTop()` 1 回 | helper 未結線、effect 外、複数発火 |
| UI-11b-D12 negative | 通常 Home で scroll 発火 | RTL | T5 `HomePage`: flag false の mount で `scrollPageToTop()` 0 回 | 無条件 mount scroll、条件反転 |
| UI-02-D15 / DSR-16 | 商品名を見出しで識別不能 | RTL | T6 `ReceivingPage`: 2 商品 fixture の dialog に各商品名の heading が 1 つずつ存在 | `dd` 維持、共通見出しだけ、片方欠落 |
| UI-13-D5 / DSR-16 | per-item box / 行区切り欠落 | RTL | T7 `IntegrityCheckPage`: fix summary `ul` が `divide-y`、各 `li` が row padding を持ち `rounded-md border` を持たない | class 移行漏れ、片方だけ旧 box |
| source / implementation wording | 新文言欠落 / 旧説明残存 | CLI | T8 presence oracle（下表の `rg -F -c`） | src count が期待値を外れる |
| scope / regression freeze | test skip、route / wire / DB diff | CLI + regression | T9 skip scan + explicit diff allowlist + existing suites | test 無効化、scope drift、既存挙動回帰 |

## Presence Oracle

Phase B の実装文言は次の固定要素句で検査する。count は行数であり、すべて src 内 `>= 1`。置換する旧文言だけ `0` とする。B-2 / B-3 は既存説明への追記なので、置換旧文言を捏造しない。

| Oracle | Command | Expected |
|---|---|---|
| 入庫保存済み | `rg -F -c '入庫の記録は保存済みです' src/features/receiving/CostDiffDialog.tsx` | `>= 1` |
| 更新の効果 | `rg -F -c '商品マスタの原価が今回の実原価に変わります' src/features/receiving/CostDiffDialog.tsx` | `>= 1` |
| 見送りの非効果 | `rg -F -c '入庫記録はそのまま残り、商品マスタの原価は変わりません' src/features/receiving/CostDiffDialog.tsx` | `>= 1` |
| source 一覧削除 | `rg -F -c 'は取引先一覧から削除され' src/features/suppliers/components/MergeSupplierDialog.tsx` | `>= 1` |
| 参照引き継ぎ | `rg -F -c '商品・入庫記録は' src/features/suppliers/components/MergeSupplierDialog.tsx` | `>= 1` |
| filter 外非変更 | `rg -F -c '現在の絞り込みに一致しない商品は変更されません' src/features/products/components/PluBulkTargetConfirmDialog.tsx` | `>= 1` |
| 置換前 CostDiff 説明 | `rg -F -c '今回の実原価が商品マスタと異なります。更新する商品を1件ずつ確認してください。' src/features/receiving/CostDiffDialog.tsx` | `0`（`rg` exit 1） |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| Home restore-success flag | flag false / Alert hidden | N/A | flag true を mount effect が consume、local state true、Alert + scroll 1 回 | なし | Home queries は既存どおり | 同一 mount は Alert 維持、unmount 後再訪は非表示 | in-memory reset で非表示 | restore failure は flag set なし | なし | T4/T5 + 既存 D11 flow tests |
| CostDiff row state | idle、入庫は既に保存済み | updating | success、master cost 表示更新 | 既存 contract | 既存 contract | dialog 再表示なし | 次回入庫で差分再提示 | 行内 error | 既存再試行 | T1/T6 + 既存 T4/T5/T7-T11 |
| Supplier merge stage 2 | source / target / usage 表示 | merging | dialog close + toast + list refetch | D-052 C22 既存 | 既存 | source は一覧から削除済み | DB 永続 | stage 2 保持 | 再試行 | T2 + 既存 supplier tests |
| PLU bulk target | current filters + count | updating | result toast | D-052 C19 既存 | 既存 | URL filter 不変 | DB 永続 | destructive Alert | 再実行 | T3 + 既存 product tests |
| Integrity fix summary | fix result なし | fix pending | adjustments を行区切り表示 | D-052 C12 既存 | 既存 | mount local state | 非永続 UI state | error / skipped warning | 既存 | T7 + 既存 integrity tests |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `scrollPageToTop()` event-driven | receiving、disposal、manual-sale、return-exchange、plu-export、page-scroll tests | Home の D12 flag true branchだけ | 他画面は DSR-17 分類①、無条件 Home mount へ横展開しない | T4/T5 |
| one-shot restore flag | `HomePage.tsx` + `BackupRestorePage.flow.test.tsx` D11 tests | 既存 effect 内の scroll 結線 | producer、navigate reject、flag module は変更しない | T4/T5 + D11 regression |
| 一意見出し付き summary card | DSR-16、CostDiffDialog の全 card site | CostDiff 商品名 | 単一 record / table は対象外 | T6 |
| `divide-y` adjustments list | `OperationLogsPage.tsx` 補正内容、Integrity confirm dialog、PriceHistorySection | Integrity fix result summary | outer Card border は意味階層の囲みなので維持 | T7 |
| irreversible dialog wording | MergeSupplierDialog stage 2、78 §78.7 | source 削除 + transfer 追記 | backend / toast は変更しない | T2 |

## Negative Paths

- missing input: dialog は既存 state が対象を供給する。新規 input なし。
- invalid input: 既存 validation / disabled 契約を維持。
- duplicate/ambiguous input: CostDiff 2 商品の heading を個別 assert（T6）。
- unknown reference: supplier not-found の stage 2 保持 + 再取得を既存 test で維持。
- dependency missing: `main` 不在時の `scrollPageToTop` fallback は helper unit test の既存責務。
- permission/write failure: UI helper の DOM scroll のみ。永続 write failure は既存 error tests。
- dry-run side effect: 該当なし。

## Boundary Checks

- threshold: CostDiff 2 商品、Integrity adjustment 複数行で反復構造を検査。
- null/default: Home flag false を明示（T5）、supplier target 未選択は既存 disabled test。
- empty/non-empty: cost_diffs empty / idempotent replay、fix adjustments empty は既存 tests。
- min/max: 新規数値境界なし。
- status/policy enum: CostDiff idle / updating / success / error、Home flag true / false。
- wire / internal / producer-consumer / round-trip / precision: 変更なし。bindings diff 0。

## Compatibility Checks

- old schema/input: 変更なし。
- new schema/input: 変更なし。
- output order: 文言追記と heading 格上げのみ。商品 / adjustment の配列順を維持。
- optional field behavior: 変更なし。

## Data Safety Checks

- source-derived data: なし。
- generated outputs: bindings / route tree / traceability は変更しない。
- secrets: `.env`、credential、実 backup を読取・commit しない。
- local-only files: PR body 作成用 temporary file は commit しない。
- synthetic sample boundaries: RTL fixture は synthetic name / code / count のみ。

## Main Wiring / Integration Checks

- helper connected to main path: Home の既存 D11 mount effect 内、consume true branchで `scrollPageToTop()` を直接呼ぶことを T4 で検査。
- output reaches manifest/report: not applicable。
- effective config reaches runtime: not applicable。
- CLI arg reaches implementation: not applicable。
- D11 producer-to-consumer flow: `BackupRestorePage.flow.test.tsx` の既存 StrictMode / rerender / revisit / failure tests を削除せず green にする。

## Mutation-style Adequacy Questions

- `consumeRestoreSuccessPending()` の条件を反転する → T4 と T5 の両方が red になる。
- scroll 呼出しを effect 外へ移す / 無条件化する → T5 が red になる。
- CostDiff の 3 文から 1 文を落とす → T1 と Presence Oracle が red になる。
- supplier の DELETE または引き継ぎ片方を落とす → T2 と Presence Oracle が red になる。
- PLU の非対象境界を落とす → T3 と Presence Oracle が red になる。
- 商品名を `dd` に戻す / heading を片方だけ落とす → T6 が red になる。
- `divide-y` を落とす、または `rounded-md border` を戻す → T7 が red になる。
- test を skip する / scope 外 file を編集する → T9 が red になる。

## Residual Test Gaps

- 実際の Windows WebView で Home が先頭へ smooth scroll し復元成功 Alert が初期 viewport に入ることは jsdom で代替できないため Windows native L3 で確認する。
- heading の視覚階層、長い商品名 / 取引先名の折返し、divide-y の読みやすさは Windows native L3 で確認する。
- CostDiffDialog / MergeSupplierDialog / PluBulkTargetConfirmDialog の 3 dialog の文言レイアウト目視（L3 checklist）
- Plan Review 後に契約または oracle を変える必要が出た場合は gated Amendment とし、Packet `Amendments` へ commit SHA を追記してから実装する。
