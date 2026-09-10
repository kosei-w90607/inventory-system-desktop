# Test Design Matrix: ⑲ 取引先ピッカー統合 dialog の runtime 反映

Plan Packet: [2026-09-10-supplier-picker-runtime.md](../2026-09-10-supplier-picker-runtime.md)

## Risk

Risk: R3

## Contracts Under Test

- C1 picker 構成（`DialogTitle` / `DialogDescription` / 検索 input / 「現在の選択」固定帯 / sr-only 列見出し / ✓ + 「選択中」badge / footer primary `Plus` + 「閉じる」、catalog `:584`）
- C2 一覧 = 先頭 `leadingLabel` 行 + name 昇順（D3）、検索は `includes(trim)` の client-side filter（D4）、0 件 = `EmptyState`
- C3 行クリック → `onSelect(id | null)` 1 回 + dialog close。Esc / 外クリック → close のみ、`onSelect` 未呼出（catalog `:586`）
- C4 追加 flow（A 案）: footer → `CreateSupplierDialog` が内側に open → 成功 → `onCreated(supplier)` 1 回 → `onSelect(supplier.id)` 1 回 → 両 dialog close
- C5 状態: `isLoading` → Skeleton（一覧なし）/ `isError` → Alert + 再試行 → `onRetry` 1 回 / 検索 0 件 → EmptyState、クリアで復帰
- C6 a11y: open 時 `document.activeElement` = 検索 input / 内側 close 後 = 検索 input / Esc は内側 open 中に内側だけ閉じる（P1、jsdom 再現不能なら L3 のみ）
- C7 `CreateSupplierDialog` 1 実装、`onCreated(supplier)`、products 版削除、4 呼び出し元が suppliers 版を import
- C8 3 host の trigger = outline button に現在値 + `aria-haspopup="dialog"`、既存 disabled 条件継承（D5）
- C9 PriceRevisionFilters: 先頭「すべての取引先」、`onSelect(null)` → `onPatch({ supplier: null })`、toggle は filter 列で既定 on（SPEC-PRV-D3）
- C10 ProductForm: inline パネル撤去、「取引先なし」で保存可（UI-01b-D8）、追加後 local 一覧再取得 + 自動選択（D8）
- C11 ReceivingPage: 「指定なし」、未指定保存可（UI-02-D3）、追加後 `refetch`
- C12 SupplierManagementPage: 検索で絞る / data 非空 & 0 件 → 「該当する取引先はありません」/ data 空 → 既存文言 / 追加 flow 不変（SPEC-SUP-D2 / D9）
- C13 docs 同期 literal（AC10）

## Failure Modes

- F1 固定帯が scroll 箱の内側に入り一覧と一緒に流れる / footer が scroll に連動する
- F2 先頭行が無い、または name 昇順でなく id 順で出る
- F3 行クリックで `onSelect` が 2 回、または close しない / Esc で `onSelect(null)` が発火し選択が消える
- F4 追加成功後に自動選択されない（B 案化）/ picker が閉じない / `onCreated` 前に `onSelect` が走り古い一覧で id 不整合
- F5 取得失敗でも一覧（空）が描画され Alert が出ない / 再試行が host の refetch を呼ばない
- F6 内側 dialog の Esc で picker も閉じる / 内側 close 後 focus が body に落ちる
- F7 products 版 `CreateSupplierDialog` が残り import が混在 / `onCreated()` 引数なしの呼び出しが型で通る
- F8 trigger が固定文言で現在値が見えない / disabled 条件が落ちて `supplierWarning` 中に開ける
- F9 toggle が dialog 内に移動、または `normalized.supplier` 未指定時に既定 on が失われる
- F10 ProductForm に `showSupplierInput` 系 state が残る / 「取引先なし」で保存時に `supplierId` が `null` でない
- F11 ReceivingPage で「指定なし」に戻せない / 追加後 `refetch` されず新規名が trigger に出ない
- F12 取引先管理で data 空と検索 0 件の文言が入れ替わる / 検索が `useSuppliersWithUsage` の再取得を誘発する
- F13 docs の「後続実装」が残る / DSR-01 stale citation が残る / 51 の canonical path が旧のまま

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | F1 | unit | `SupplierPickerDialog.test.tsx` `renders title, description, search, current-selection band and fixed footer` | Title / Description / 「現在の選択」/ 「新しい取引先を追加」/ 「閉じる」のいずれかが欠ける、sr-only 列見出しが可視 |
| C2 | F2 | unit | 同 `lists leading row first and suppliers sorted by name` | 先頭行が `leadingLabel` でない、または row 順が name 昇順でない |
| C2 / C5 | — | unit | 同 `filters rows by search text and shows EmptyState when nothing matches` | 検索で行数が減らない、0 件で EmptyState が出ない、クリアで戻らない |
| C3 | F3 | unit | 同 `selecting a row calls onSelect once and closes` | `onSelect` 呼出回数 ≠ 1、または close されない |
| C3 | F3 | unit | 同 `escape and close button do not change selection` | Esc / 「閉じる」で `onSelect` が呼ばれる |
| C4 | F4 | unit | 同 `auto-selects the created supplier and closes both dialogs` | `onCreated` → `onSelect(newId)` の順でない、片方の dialog が残る |
| C5 | F5 | unit | 同 `shows skeleton while loading and alert with retry on error` | loading 中に行が出る、error で Alert なし、再試行が `onRetry` を呼ばない |
| C6 | F6 | unit（P1） | 同 `focuses search input on open and returns focus after inner dialog closes` | `document.activeElement` が検索 input でない |
| C6 | F6 | unit（P1） | 同 `escape closes only the inner create dialog` | Esc で picker も閉じる。**jsdom で Radix stack が再現しない場合は L3 へ降格し理由を記録** |
| C7 | F7 | schema（typecheck）+ rg | AC2 oracle + `npm run typecheck` | products 版が残る、`onCreated` 引数なしで compile が通る |
| C7 | F7 | regression | `SupplierManagementPage.test.tsx` 既存の追加 flow test（`rg -n "新しい取引先を追加" src/features/suppliers/SupplierManagementPage.test.tsx` で実在確認） | 引数変更で追加後の再取得が壊れる |
| C8 / C9 | F8 / F9 | unit | `PriceRevisionFilters.test.tsx` `opens supplier picker from trigger and patches supplier on select` | trigger 文言が現在値でない、`onPatch({ supplier })` が呼ばれない |
| C9 | F9 | regression | `PriceRevisionFilters.test.tsx` 既存 toggle test（`rg -n "取引先未設定の商品も含める" src/features/products/components/PriceRevisionFilters.test.tsx`） | toggle が消える / 既定 on でない |
| C8 / C10 | F8 / F10 | unit | `ProductForm.test.tsx` `selects a supplier through the picker and keeps 取引先なし as null` | 「取引先なし」選択で `supplierId !== null`、trigger が `supplierWarning` 中に enabled |
| C10 | F4 / F10 | unit | `ProductForm.test.tsx` `creates a supplier from the picker, refreshes options and auto-selects it` | 追加後に trigger が新規名にならない、`listSuppliers` が再呼出されない |
| C10 | F10 | rg | AC3 oracle | inline パネル state が残る |
| C8 / C11 | F8 / F11 | unit | `ReceivingPage.test.tsx` `selects supplier via picker and allows 指定なし` | 「指定なし」に戻せない、未指定で submit が拒否される |
| C11 | F11 | unit | `ReceivingPage.test.tsx` `refetches suppliers after creating one from the picker` | `refetch` 未呼出 |
| C12 | F12 | unit | `SupplierManagementPage.test.tsx` `filters suppliers by name and shows no-match message` | 検索で絞られない、0 件文言が data 空文言と入れ替わる |
| C12 | F12 | regression | `SupplierManagementPage.test.tsx` 既存 EmptyState test | data 空文言が変わる |
| C13 | F13 | rg | AC10 oracle 群 | 「後続実装」/ stale citation / 旧 path が残る |
| 全体 | — | L1 full | `bash scripts/local-ci.sh full`（1 worktree 1 run） | lint / typecheck / vitest / doc check のいずれか FAIL |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| picker `open` | closed、trigger に現在値 | — | 行クリックで closed + `onSelect` | — | — | 再 open で検索 text は空に戻す（内部 state reset） | — | — | — | C3 test |
| 取引先一覧（host query） | host の既存 key | `isLoading` → Skeleton | 行描画 | 追加成功 → `onCreated` で host refetch | 新規行が一覧に出て自動選択 | — | 画面再訪で host の staleTime 既定 | `isError` → Alert | `onRetry` → host refetch | C4 / C5 test |
| 検索 text | 空 | — | filter 適用 | — | — | close で reset | — | 0 件 → EmptyState | クリアで復帰 | C2 test |
| 内側 `CreateSupplierDialog` | closed | 送信中 disabled（既存） | close + picker close | — | — | — | — | 既存エラー表示（不変） | 再送信（既存） | C4 test + AC-L3-2 |
| focus | trigger | open → 検索 input | 内側 close → 検索 input / picker close → trigger | — | — | — | — | — | — | C6 test + AC-L3-5 |
| 取引先管理 検索 | 空 | — | filter 適用 | rename / merge の `onStale` refetch は既存 | 既存 | — | — | 0 件文言 | — | C12 test |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 取引先を選ぶ `Select`（sentinel `all` / `none`） | `PriceRevisionFilters.tsx:60-83` / `ProductForm.tsx:303-321` / `ReceivingPage.tsx:396-415`（`rg -n "listSuppliers\|supplier_id\|supplierId" src/features src/components` で 3 サイトのみ） | 3 サイト全部 | `DepartmentFilter` / 部門 `Select`（DSR-24 非適用） | AC4 / AC5 / AC9 |
| `CreateSupplierDialog` 実装 | products 版 / suppliers 版 / ProductForm inline | 1 実装へ | — | AC2 / AC3 |
| DSR-22 現在行 3 点 | 商品一覧の現在行実装（Writer が `rg -n "row-current" src` で実在 class を確認） | picker の現在行 + 固定帯 | 取引先管理の一覧（選択操作なし） | C1 test |
| scroll 箱（`ListShell` `STICKY_TABLE_CLASSES`） | `ListShell.tsx:51,223` | picker（`max-h` 上書き）+ 取引先管理 | — | Review Focus |
| dialog 初期 focus / 復帰 | `dialog.tsx`（`...props` 透過）、`MergeSupplierDialog.tsx` | picker（`onOpenAutoFocus` / `onCloseAutoFocus`） | — | C6 test |
| 旧挙動を語る test 名 / comment | `ProductForm.test.tsx:691-758` / `PriceRevisionFilters.test.tsx` / `ReceivingPage.test.tsx:237,254,276,1027` | 書き換え | — | Review Focus |

## Negative Paths

- missing input: 空白の取引先名 → `CreateSupplierDialog` 既存 test（`rg -n "whitespace" src/features/suppliers/components` / `SupplierManagementPage.test.tsx` で実在確認）
- invalid input: 該当なし（検索 text に制約なし）
- duplicate/ambiguous input: 同名追加 → backend が既存行を返す（UI-01b-D21、既存、不変）
- unknown reference: `selected` が一覧に無い id（削除 / 統合後）→ 固定帯は `leadingLabel` にフォールバック（Writer: 1 行、test 1 本）
- dependency missing: `listSuppliers` 失敗 → Alert + 再試行、保存は可能（UI-01b-D8）
- permission/write failure: `createSupplier` 失敗 → 内側 dialog の既存エラー表示、picker は開いたまま
- dry-run side effect: 該当なし

## Boundary Checks

- threshold: 該当なし
- null/default: `selected: null` = 先頭行が現在行、固定帯に `leadingLabel`
- empty/non-empty: `suppliers` 空（data 取得成功で 0 件）→ 先頭行のみ + 追加ボタン（EmptyState は検索 0 件のみ）
- min/max: 一覧 80 件想定、`max-h` で scroll
- status/policy enum: 該当なし
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: 該当なし（DTO 不変）

## Compatibility Checks

- old schema/input: 該当なし
- new schema/input: 該当なし
- output order: picker は name 昇順（D3）、取引先管理は backend name 昇順（不変）
- optional field behavior: `Supplier.created_at` は未使用のまま

## Data Safety Checks

- source-derived data: 該当なし
- generated outputs: 該当なし（bindings / routes / traceability 差分なし）

## Main Wiring / Integration Checks

- route / navigation 変更なし。3 画面 + 取引先管理は既存 route のまま
- `npm run generate:routes` 差分なし（L1 full で確認）

## Mutation-style Adequacy Questions

closure（Sonnet + Opus）で最低限注入する mutant。**各 mutant は `SupplierPickerDialog.test.tsx` + 当該 host の test file を実行して kill を確認**する（1 file だけ回さない）。

1. D3 の `localeCompare` を削る → C2 test が落ちるか
2. 行クリック handler から `onOpenChange(false)` を削る → C3 test が落ちるか
3. A 案 handler の `onSelect(s.id)` を削る → C4 test が落ちるか
4. `onCreated` と `onSelect` の順を入れ替える → C4 test が落ちるか（await の順序 assertion）
5. `isError` 分岐を削り常に一覧描画 → C5 test が落ちるか
6. 先頭行の描画を削る → C2 test が落ちるか
7. `PriceRevisionFilters` で `onSelect(null)` を `onPatch({ supplier: undefined })` に変える → C9 test が落ちるか
8. `ProductForm` で「取引先なし」を `0` にマップ → C10 test が落ちるか
9. `SupplierManagementPage` の 0 件文言を入れ替える → C12 test が落ちるか
10. 固定帯の小見出し「現在の選択」を消す → C1 test が落ちるか

## Residual Test Gaps

- dialog 重ね (A) の ESC / 外クリック伝播 / focus trap は jsdom で完全には再現できない可能性 → AC-L3-5 が正本（P1）
- 二重 scrim の見た目、trigger の見た目（D5）は視覚 oracle = owner のみ（AC-L3-2 / 6）
- WebView2 固有の focus 挙動
