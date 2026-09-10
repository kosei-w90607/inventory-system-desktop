# Plan Packet: ⑲ 取引先ピッカー統合 dialog の runtime 反映（`SupplierPickerDialog` 新設 / `CreateSupplierDialog` 統合 / 呼び出し元 3 + 取引先管理検索）

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

If a state-only commit materializes multiple phases, list the complete adjacent forward sequence and the pre-existing evidence for every intermediate transition in an append-only review/evidence record. Recording compression never permits a gate skip.

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1
- Writer: Codex
- Plan Reviewer: Sonnet + Opus
- Final Reviewer: Sonnet + Opus + Codex
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（AC-L3-1〜6、dialog 重ね (A) の実機確認を含む）+ Ready 承認

## Owner Effort Budget

- 介入回数上限: 5（視覚系 + 実機 dialog 重ね確認。⑭ / ⑮ の実績 L3 2〜3 round を見込む）
- 実働時間上限: 60分
- relay 往復上限: 3
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。使う場合はtarget branch / PRへorder commitを混ぜず、artifact pathと専用remote order branch refを宣言する。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator workflow（取引先の選択・追加の手順）と UI 契約（`CreateSupplierDialog` の `onCreated` 引数、3 画面の取引先入力 widget）を変える。DB / Tauri command / DTO / route は変更しないが、本アプリ初の dialog-in-dialog を導入し、その挙動は Windows WebView2 実機でしか確定できない（canonical 自身が「実機未検証の期待値」と明記）。

## Goal

Goal Invariant:

### 最小完了条件

- 一括価格改定の絞り込み・商品登録/修正 form・入庫記録の 3 画面で、取引先を `Select` ではなく取引先ピッカー dialog（名前検索 + scroll 一覧 + 「現在の選択」固定帯 + footer「新しい取引先を追加」primary / 「閉じる」）から選べる。ピッカー内の「新しい取引先を追加」で既存 `CreateSupplierDialog` が重なって開き、追加成功後は新規取引先が自動選択され両 dialog が閉じる（A 案）
- 取引先管理画面に名前検索 input と scroll 一覧の箱がある（client-side filter、footer なし）
- `CreateSupplierDialog` の実装が 1 つ（`onCreated(supplier)` 契約）になり、`ProductForm` の inline 常設パネル（3 つ目の実装）が撤去されている
- owner の Windows native L3 で dialog 重ね (A) の ESC / 外クリック / focus trap / 初期 focus / 復帰先が canonical の期待どおりに動く

### 失敗定義

- 取引先を選ぶ・追加する既存の操作が 3 画面のどれかでできなくなる（取引先未指定で保存できる契約 UI-01b-D8 / UI-02-D3 を含む）
- 一括価格改定の「取引先未設定の商品も含める」toggle の既定 on（SPEC-PRV-D3）が失われる、または dialog 内へ移動する
- dialog 重ね (A) が WebView2 で破綻し（ESC で両方閉じる / 内側 dialog の外クリックが picker まで閉じる / focus が内側から漏れる）、(B) fallback へ切替えずに Ready 化する
- `CreateSupplierDialog` が 2 実装のまま残る、または `ProductForm` の inline パネルが残る

### 非目的

- 取引先管理の並び替え / paging / bulk rename（78 §78.12 Deferred のまま）
- backend `list_suppliers` の並び順変更（`ORDER BY id ASC` のまま。picker 側で client-side name 昇順にする）
- 取引先一覧 query key の統一（`productForm.suppliers` / `priceRevision.suppliers` / `queryKeys.suppliers` の `withUsage()` の 3 key 併存は既存のまま。追加後の再取得は各 host の既存 key で行う）
- フィルタ入力 Label 上置きの全画面統一（⑳ design lane）。本 lane の trigger の Label 配置は各 host の現行配置を維持する
- (B) fallback（単一 dialog 2-stage）の実装。(A) が L3 で破綻した場合のみ Gated Amendment で切替える

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-10、worktree base `bb081e3`、Explore 報告を Coordinator が rg で再確認）

### canonical（⑱ PR #49 で確定、本 lane は転記・実装のみ）

- `docs/design-system/01-decision-rules.md:469-479` DSR-24（適用 = 一括価格改定 filter / 商品登録・修正 form / 入庫記録。非適用 = `DepartmentFilter`、取引先管理〈見た目のみ流用〉）
- `docs/design-system/02-component-catalog.md:578-598` picker dialog 小節（構成 `:584` / 動作 `:586` / 重ね契約 (A)(B) `:588-590` / 状態 `:592` / a11y `:594`）。`:582` canonical 行は「後続実装、`src/features/suppliers/components/**` 配下を想定」
- `docs/design-system/reference/mockup-f-supplier-picker.html` 7 状態（state-1 filter 文脈 / state-2 入力文脈 / state-3 取引先管理 / state-4 A 案 / state-6b 二重 scrim / state-7 入庫記録）。背景の trigger は `<span class="btn outline">取引先を選択</span>`（文言は placeholder、現在値表示の規定なし → 設計判断 D5）
- `docs/function-design/77-ui-bulk-price-revision.md:27,30,94`（SPEC-PRV-D3 / D6、『すべての取引先』行は一覧先頭、toggle は filter 列に残置）
- `docs/function-design/51-ui-product-form.md:21,36,149-156,210`（UI-01b-D7 / D21。`:151` canonical `CreateSupplierDialog` = `src/features/products/components/CreateSupplierDialog.tsx` と明記、inline 常設パネルは撤去指示）
- `docs/function-design/78-ui-supplier-management.md:28,55-59,146-158`（SPEC-SUP-D2 名前検索 + scroll 一覧、client-side filter、全件取得維持）
- `docs/function-design/61-ui-receiving.md:23,155`（UI-02-D3 defer 解除、検索 / 追加 / 自動選択で閉じる）
- `docs/design-system/01-decision-rules.md:25` DSR-01 具体例に `ProductForm.tsx:343` / `:481` の stale citation（実 tree は `:387` / `:496`。inline パネル撤去で段落自体が解消される）

### runtime 現状

- `CreateSupplierDialog` 3 実装:
  - `src/features/products/components/CreateSupplierDialog.tsx`（105 行、`onCreated: (supplier: Supplier) => Promise<void>` `:20-28`、`commands.createSupplier` `:42`、呼び出し = `PriceRevisionFilters.tsx:184-191`）
  - `src/features/suppliers/components/CreateSupplierDialog.tsx`（116 行、`onCreated: () => Promise<void>` `:20-28`、`<form>` 包み `:69-114`、`describeError` 使用、呼び出し = `SupplierManagementPage.tsx:68-74`）
  - `src/features/products/components/ProductForm.tsx:301-391` inline パネル（`showSupplierInput` state `:98`、toggle button `:322-332`〈`variant="secondary"`〉、`createSupplier` + `listSuppliers` を直接呼び `setSupplierOptions` `:357-386`、確定ボタン「追加する」`:387`）
- 取引先を選ぶ 3 サイト（すべて shadcn `Select`）:
  - `PriceRevisionFilters.tsx:60-83`（`value="all"` sentinel、`suppliersQuery` prop、key `queryKeys.priceRevision.suppliers()`、隣に「新しい取引先を追加」button）。toggle `:143-156`、取得失敗 `:157-168`（`<p role="alert">` + 再試行 link）
  - `ProductForm.tsx:303-321`（`value="none"` sentinel「取引先なし」、`suppliers` prop `:43` を local `supplierOptions` state に写す、`supplierWarning` 時 disabled `:305`）
  - `ReceivingPage.tsx:396-415`（`value="none"` sentinel「指定なし」、`supplierQuery` `:133-141` = `queryKeys.productForm.suppliers()` を ProductForm と共用、`isFormLocked || supplierQuery.isLoading` で disabled）
- `SupplierManagementPage.tsx`（86 行）: 検索 input なし。`useSuppliersWithUsage()`（backend `ORDER BY s.name ASC`、`product_repo.rs:556`）→ `SupplierUsageTable`。`Plus` は lucide-react `:1,28`
- `commands.listSuppliers()` は `ORDER BY id ASC`（`product_repo.rs:420`）。name 昇順は取引先管理の `list_suppliers_with_usage` のみ
- `src/components/ui/dialog.tsx`: `radix-ui` 統合 package、`DialogContent` は `...props` 透過（`onOpenAutoFocus` / `onInteractOutside` / `onEscapeKeyDown` を呼び出し側から渡せる）、`DialogOverlay` = `bg-black/50 z-50` `:34`
- dialog-in-dialog の先例・test 先例なし（`rg` 0 件）。`MergeSupplierDialog.tsx` が単一 dialog 2-stage の先例（(B) fallback の型）
- `ListShell.tsx:51` `STICKY_TABLE_CLASSES` / `:223` `max-h-[calc(100vh-6.75rem)] overflow-auto` が商品一覧の scroll 箱
- `ProductForm.test.tsx:691-758` が inline パネルの test（`data-variant="secondary"` assertion `:695-698` を含む）。`ProductForm.test.tsx` に `QueryClientProvider` なし（0 件）→ ProductForm は queryClient を持たない
- bindings: `Supplier { id, name, created_at }`（`bindings.ts:1645-1649`）、`createSupplier(name) => Supplier` `:28`、`listSuppliers() => Supplier[]` `:26`
- test file 数 170（`fd -e test.tsx -e test.ts . src`）

## 設計判断（Coordinator adjudication、Plan Review で覆せる）

- **D1 `CreateSupplierDialog` の canonical 位置 = `src/features/suppliers/components/CreateSupplierDialog.tsx`**（51 `:151` の literal「`src/features/products/components/…`」を改める）。理由: 取引先 master を所有する feature は suppliers。`SupplierPickerDialog` を suppliers 配下に置く（catalog `:582`）以上、picker → products/CreateSupplierDialog、products/ProductForm → suppliers/Picker の相互依存を避ける唯一の配置。suppliers 版の本体（`<form>` 包み = Enter 確定、`describeError`）を残し、`onCreated` の型だけ products 版の `(supplier: Supplier) => Promise<void>` に揃える。products 版は削除。却下案 = products 版を canonical にして suppliers 版を削る（feature 依存が双方向になる）
- **D2 `SupplierPickerDialog` の props 契約**（`src/features/suppliers/components/SupplierPickerDialog.tsx`）:
  - `open: boolean` / `onOpenChange(open)` — 通常の Radix 制御
  - `suppliers: Supplier[]` / `isLoading: boolean` / `isError: boolean` / `onRetry(): void` — host の query 状態をそのまま渡す（picker は fetch しない。3 host の query key が異なるため、picker が key を知る必要をなくす）
  - `leadingLabel: string` — 先頭行の文言（filter = 「すべての取引先」、ProductForm = 「取引先なし」、入庫 = 「指定なし」）
  - `selected: number | null` — 現在選択（`null` = 先頭行）
  - `onSelect(id: number | null): void` — 行クリックで呼び、picker は自分で閉じる
  - `onCreated(supplier: Supplier): Promise<void>` — host が一覧を再取得する。picker 内部の handler = `await onCreated(s)` → `onSelect(s.id)` → 両 dialog を閉じる（A 案）
  - `triggerLabel` は持たない。trigger は host 側（D5）
- **D3 一覧の並び = picker 内で `name.localeCompare(other, "ja")` 昇順**（backend 不変）。理由: 80 件の目視走査は名前順が前提、取引先管理（name ASC）と揃える。1 行で済む
- **D4 検索 input = `Label` + `Input type="search"`（`grid gap-1`）を picker 内に直接置く。`SearchBar` は使わない**。理由: `SearchBar` の debounce / Enter flush / IME guard は URL state・server 再取得のための機構で、取得済み 80 件の in-memory filter には不要。test も同期で書ける。filter = `name.includes(query.trim())`（大小文字正規化なし、日本語名主体）。0 件 = `EmptyState`（絞り込み解除 action なし、catalog `:592`）
- **D5 host 側 trigger = `Button variant="outline"`、文言 = 現在の選択（取引先名 / `leadingLabel`）、`aria-haspopup="dialog"`、host の `<Label htmlFor>` で「取引先」と紐付ける**。mockup の `取引先を選択` は placeholder 文言であり、閉じた状態で現在値が見えないのは `Select` からの後退になるため現在値を出す。icon は付けない（owner「飾りより情報」）。disabled 条件は各 host の現行 `Select` の条件を引き継ぐ（`supplierWarning !== null` / `isFormLocked || isLoading`）。**owner L3 で見た目を確認する（AC-L3-6）**
- **D6 scroll 箱 = `ListShell.tsx` の `STICKY_TABLE_CLASSES` 系を流用**（export して picker と取引先管理で共用、または同 class 文字列を 1 定数として共有）。dialog 内は viewport 基準 `max-h` が不適のため `max-h-[50vh]` 相当を picker 側で上書き。新規 class 系統を作らない
- **D7 「現在の選択」固定帯 = scroll 箱の外、検索 input の下**（catalog `:584` literal）。小見出し「現在の選択」（`text-xs text-muted-foreground`）+ 名前 + `Badge`「選択中」、背景 `bg-row-current`（token 名は `00-foundations` / 既存 DSR-22 実装の `--row-current` 利用箇所を Writer が `rg` で確認して同じ class を使う）、下辺 `border-b border-border-strong`
- **D8 ProductForm の追加後再取得 = 既存 `:371-376` の `commands.listSuppliers()` → `setSupplierOptions` を `onCreated` に移す**（ProductForm は queryClient を持たず test にも Provider が無い。invalidate 化は非目的）。ReceivingPage = `supplierQuery.refetch()`、PriceRevisionFilters = 既存 `:187-190` と同じ、取引先管理 = `suppliersQuery.refetch()`（引数は無視）
- **D9 DSR-01 `:25` の「runtime 是正対象（2026-09-05 起票時実測）: `ProductForm.tsx:343`…」文は、inline パネル撤去で対象が消えるため、citation 訂正ではなく「解消済み（本 PR、DSR-24 の picker 化で inline パネル撤去）」に書き換える**（Backlog の「`:343`→`:387`・`:481`→`:496` 同乗」は訂正でなく解消として消化）
- **D10 dialog 重ね (A) の自動 test は jsdom で書く**（内側 open 中の ESC が内側だけ閉じる / 内側 close 後の focus が検索 input）。jsdom で Radix `DismissableLayer` の stack が再現しない場合は当該 test を「WebView2 L3 のみ」に落とし、Implementation Results に理由を残す（Contract Probe P1）

## Scope

- **S1 `SupplierPickerDialog` 新設**（`src/features/suppliers/components/SupplierPickerDialog.tsx` + `SupplierPickerDialog.test.tsx`）: D2 props、構成 = `DialogTitle`「取引先を選択」+ `DialogDescription`（1 文、例「名前で検索して選ぶか、新しい取引先を追加します。」）+ 検索（D4）+ 固定帯（D7）+ scroll 一覧（D6、`<table>` で列見出し「選択」は `sr-only`、行 = ✓〈lucide `Check`〉+ `Badge`「選択中」+ 名前、現在行に DSR-22 の 3 点〈左 4px primary バー + `bg-row-current` + ✓ / badge〉、先頭行 `leadingLabel`、以降 D3 順）+ footer（`shrink-0`、左 `Button` primary〈lucide `Plus` + 「新しい取引先を追加」〉、右 `Button variant="outline"`「閉じる」）。状態 = `isLoading` → `ListSkeleton`、`isError` → `Alert variant="destructive"` + 再試行（`onRetry`）、検索 0 件 → `EmptyState`。動作 = 行クリック → `onSelect` + 閉じる / 外クリック・Esc → 閉じる（選択不変）/ 追加 → 内側に `CreateSupplierDialog`（S2）を開く、成功 → `onCreated` → `onSelect(id)` → 両方閉じる。a11y = open 時 focus は検索 input（Radix 既定の最初の focusable で足りなければ `onOpenAutoFocus` で明示）、内側 close 後の focus は検索 input（`CreateSupplierDialog` の `onCloseAutoFocus` で指定）、閉じたら trigger へ戻る（Radix 既定）
- **S2 `CreateSupplierDialog` 統合**（D1）: `src/features/suppliers/components/CreateSupplierDialog.tsx` の `onCreated` を `(supplier: Supplier) => Promise<void>` に変更し `:46` で `await onCreated(supplier)`。`src/features/products/components/CreateSupplierDialog.tsx` を削除し、`PriceRevisionFilters.tsx` の import を suppliers 版へ。`SupplierManagementPage.tsx:68-74` は callback 引数を無視するだけで動作不変
- **S3 `PriceRevisionFilters.tsx` の取引先 `Select` → trigger + picker**（`:60-83` の `Select` と隣接「新しい取引先を追加」button を撤去、D5 trigger に置換、`leadingLabel="すべての取引先"`、`selected = normalized.supplier ?? null`、`onSelect(id) → onPatch({ supplier: id })`〈`null` は既存どおり `all` 意味〉、`onCreated` は既存 `:187-190` の内容を picker へ移す。`:143-156` toggle は不変（filter 列に残す、SPEC-PRV-D3）。`:157-168` の取得失敗 `<p role="alert">` は picker 内 Alert と重複するため撤去し picker の `isError` / `onRetry` に一本化するか残すかは Writer 判断〈残す場合は理由を comment〉）。`PriceRevisionFilters.test.tsx` の Select 依存 assertion を picker 経由に書き換え
- **S4 `ProductForm.tsx` の取引先 `Select` + inline パネル → trigger + picker**（`:303-391` を D5 trigger + `SupplierPickerDialog`〈`leadingLabel="取引先なし"`〉に置換、`showSupplierInput` / `supplierName` / `supplierCreateError` / `isCreatingSupplier` state と `:322-332` toggle button を撤去、`onCreated` = D8。`supplierWarning !== null` の disabled は trigger に引き継ぐ）。`ProductForm.test.tsx:691-758` の inline パネル test を picker 経由の flow（空白名拒否は `CreateSupplierDialog` 側の既存 test に委ね、ProductForm 側は「追加成功 → 自動選択 → 両 dialog close」を検証）に書き換え、`data-variant="secondary"` assertion `:695-698` を撤去
- **S5 `ReceivingPage.tsx` の取引先 `Select` → trigger + picker**（`:396-415`、`leadingLabel="指定なし"`、`selected = values.supplierId`、`onSelect(id) → updateValues(supplierId: id)`、`onCreated → supplierQuery.refetch()`、disabled = `isFormLocked || supplierQuery.isLoading`）。`ReceivingPage.test.tsx:237,254,276,1027` の Select 依存 assertion を書き換え
- **S6 取引先管理の名前検索 + scroll 箱**（`SupplierManagementPage.tsx`）: `PageHeader` の下に `Label`「取引先名で検索」+ `Input type="search"`（`grid gap-1`、D4 と同じ filter）、`SupplierUsageTable` を D6 の scroll 箱で包む。data が非空で filter 結果 0 件 → `EmptyState`「該当する取引先はありません」（既存の「取引先はまだ登録されていません」は data 空のときのみ）。`SupplierManagementPage.test.tsx` に「検索で一覧が絞られる / 0 件文言」test 追加
- **S7 docs 同期**: `02-component-catalog.md:582` canonical 行を実装済み path へ（「後続実装、…想定」を消す）/ `01-decision-rules.md:25` D9 / `51-ui-product-form.md:151` canonical path を D1 へ + 変更履歴 / `61` `77` `78` の変更履歴に runtime 反映 1 行 / `docs/design-system/README.md`・`UI_TECH_STACK.md` に picker の「後続実装」文言があれば同期（Writer が `rg -n "後続実装|runtime lane" docs/design-system docs/UI_TECH_STACK.md` で実測、無ければ変更なしと報告）

## Non-scope

- 78 §78.12 Deferred（並び替え / paging / bulk rename / 単独削除）
- backend（`src-tauri/**`）一切。`list_suppliers` の並び順、DTO、command 追加なし
- query key の統一・cross-screen cache invalidation（既存 3 key のまま）
- `DepartmentFilter` / 部門 `Select` の picker 化（DSR-24 非適用）
- フィルタ入力 Label 上置きの sweep（⑳ design lane）。3 host の Label 配置は現行維持
- (B) fallback の実装（L3 破綻時のみ Gated Amendment）
- `MergeSupplierDialog` / `RenameSupplierRow` の変更
- `docs/decision-log.md`（durable 判断の追加なし。D1 の path 変更は 51 の記述更新で足りる）
- mockup-f の更新（trigger 文言の差 D5 は mockup を直さず本 packet と catalog `:584` への 1 句追記で記録）
- ⑳ lane（`agent/filter-label-top-design`、docs-only）との衝突: catalog / DSR の更新履歴表末尾で textual conflict が出る想定。merge 順は先に Ready になった方、後続が origin/main を単段 merge し両側保持で解消

## Acceptance Criteria

R3 のため各 AC に機械 oracle を付す。`rg` の出力空 = 0 件。

- **AC1** `fd -g "SupplierPickerDialog.tsx" src/features/suppliers/components | wc -l` = 1、`fd -g "SupplierPickerDialog.test.tsx" src/features/suppliers/components | wc -l` = 1（baseline 0 / 0）
- **AC2** `test ! -e src/features/products/components/CreateSupplierDialog.tsx`（exit 0、baseline 存在）/ `rg -c "onCreated: \(supplier: Supplier\) => Promise<void>" src/features/suppliers/components/CreateSupplierDialog.tsx` = 1（baseline 0）/ `rg -n "products/components/CreateSupplierDialog" src | wc -l` = 0（baseline 1 = PriceRevisionFilters import）
- **AC3** `rg -n "showSupplierInput|setSupplierOptions|new-supplier-name|isCreatingSupplier" src/features/products/components/ProductForm.tsx | wc -l` = 0（baseline ≥ 8）/ `rg -c "SupplierPickerDialog" src/features/products/components/ProductForm.tsx` ≥ 2（import + JSX、baseline 0）
- **AC4** `rg -n 'SelectItem value="all"' src/features/products/components/PriceRevisionFilters.tsx | wc -l` = 0（baseline 1）/ `rg -c "SupplierPickerDialog" src/features/products/components/PriceRevisionFilters.tsx` ≥ 2 / `rg -n "取引先未設定の商品も含める" src/features/products/components/PriceRevisionFilters.tsx | wc -l` = 1（不変、toggle 残置）
- **AC5** `rg -n 'SelectItem value="none">指定なし' src/features/receiving/ReceivingPage.tsx | wc -l` = 0（baseline 1）/ `rg -c "SupplierPickerDialog" src/features/receiving/ReceivingPage.tsx` ≥ 2
- **AC6** `rg -n "取引先名で検索" src/features/suppliers/SupplierManagementPage.tsx | wc -l` ≥ 1（baseline 0）/ `rg -n "該当する取引先はありません" src/features/suppliers/SupplierManagementPage.tsx | wc -l` = 1
- **AC7** picker 構成の literal: `rg -c "DialogTitle" src/features/suppliers/components/SupplierPickerDialog.tsx` ≥ 1、同 `DialogDescription` ≥ 1、`sr-only` ≥ 1、`現在の選択` ≥ 1、`選択中` ≥ 1、`新しい取引先を追加` = 1、`閉じる` ≥ 1、`localeCompare` = 1、`rg -n "＋" src/features/suppliers/components/SupplierPickerDialog.tsx | wc -l` = 0、`rg -c "Plus" …SupplierPickerDialog.tsx` ≥ 1、`rg -c "SearchBar" …SupplierPickerDialog.tsx` = 0（D4）
- **AC8** A 案の自動 test: `rg -n "auto-selects the created supplier and closes both dialogs" src/features/suppliers/components/SupplierPickerDialog.test.tsx | wc -l` = 1、`npx vitest run src/features/suppliers` green
- **AC9** trigger（D5）: `rg -n 'aria-haspopup="dialog"' src/features/products/components/PriceRevisionFilters.tsx src/features/products/components/ProductForm.tsx src/features/receiving/ReceivingPage.tsx | wc -l` = 3（baseline 0）
- **AC10** docs 同期: `rg -n "後続実装" docs/design-system/02-component-catalog.md | wc -l` = 0（baseline 1、`:582`）/ `rg -n "ProductForm.tsx:343|ProductForm.tsx:481" docs/design-system/01-decision-rules.md | wc -l` = 0（baseline 2 hit in 1 行）/ `rg -n "src/features/suppliers/components/CreateSupplierDialog.tsx" docs/function-design/51-ui-product-form.md | wc -l` ≥ 1（baseline 0）/ `rg -n "products/components/CreateSupplierDialog" docs --glob '!docs/archive/**' --glob '!docs/plans/**' | wc -l` = 0（baseline 1）/ 61・77・78・01・02・51 の変更履歴表に本 PR 行が各 1（`rg -c "取引先ピッカー" <doc>` が baseline + 1）
- **AC11** 品質 gate: `npm run lint` / `npm run typecheck`（package.json の該当 script 名で）/ `npx vitest run` 全 green / `bash scripts/local-ci.sh full` `RESULT=PASS`（1 worktree 1 run）/ `bash scripts/doc-consistency-check.sh` ERROR 0 / `bash scripts/check-workflow-git.sh` PASS
- **AC12** plan-first commit は docs のみ: `git diff --name-only origin/main..<Plan Commit> -- src src-tauri | wc -l` = 0
- **AC-L3-1**（一括価格改定 `PriceRevisionFilters.tsx`、WebView2）: trigger に現在値「すべての取引先」→ 開く → 検索で絞る → 行クリックで閉じ trigger に取引先名、toggle が既定 on で現れ位置は filter 列
- **AC-L3-2**（商品登録 form `ProductForm.tsx`）: trigger「取引先なし」→ 開く → 「新しい取引先を追加」→ 内側 dialog が**手前に重なって**開く（二重 scrim）→ 名前入力 → 追加 → 両 dialog が閉じ trigger に新規名。inline パネルが無い
- **AC-L3-3**（入庫記録 `ReceivingPage.tsx`）: AC-L3-2 と同じ flow、「指定なし」に戻せる、取引先未指定で保存できる
- **AC-L3-4**（取引先管理 `SupplierManagementPage.tsx`）: 検索 input で一覧が絞られる、0 件文言、scroll 箱内で一覧が縦 scroll、追加ボタン・名前変更・統合は従来どおり
- **AC-L3-5**（dialog 重ね (A) の実機契約、catalog `:589`）: 内側 open 中の **ESC は内側だけ**閉じる / 内側の**外クリックは内側だけ**閉じる / Tab が内側から漏れない / 内側 close 後の focus は picker の検索 input / picker close 後の focus は trigger。1 つでも破綻 → state-backtrack + Gated Amendment で (B) へ
- **AC-L3-6**（trigger の見た目、D5、`aria-haspopup="dialog"` の outline `Button`）: outline button に現在値、icon なし、Label「取引先」との対応が自然。owner 所感で「Select らしさが要る」なら Gated Amendment（chevron 追加）

## Design Sources

- Requirements / spec: `docs/function-design/77-ui-bulk-price-revision.md`（SPEC-PRV-D3 / D6、REQ-105 / 106）、`docs/function-design/51-ui-product-form.md`（UI-01b-D7 / D8 / D21）、`docs/function-design/61-ui-receiving.md`（UI-02-D3）、`docs/function-design/78-ui-supplier-management.md`（SPEC-SUP-D2 / D9）
- Architecture: `docs/ARCHITECTURE.md`（UI 層のみ）
- Function / command / DTO: 変更なし（`list_suppliers` / `create_supplier` 既存）
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md`（DSR-24 / DSR-22 / DSR-01）、`docs/design-system/02-component-catalog.md`（⑧ picker dialog 小節、⑥ EmptyState、⑨、⑯ ListShell）、`docs/design-system/reference/mockup-f-supplier-picker.html`
- Decision log / ADR: 追加なし

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | DSR-24 / catalog picker 小節 / mockup-f / 51 / 61 / 77 / 78 | existing sufficient（S7 で canonical 行・stale citation・変更履歴のみ updated in this PR） |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| Durable decision / ADR | 該当なし（D1 は 51 の path 記述更新） | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| 該当なし | Tauri command / route / function-design doc / REQ の新設なし。`bindings.ts` / routeTree / 90-traceability の再生成は不要（L1 full の生成系検査 3 種は差分なしで PASS する想定） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| DSR-24 | 01-decision-rules `:469-479` | DSR-24 | 追加導線を伴う master 参照は picker dialog。却下 = Select 横 primary 追加ボタン | S1 / S3 / S4 / S5 | `SupplierPickerDialog.test.tsx`、各 host test |
| catalog ⑧ picker dialog | 02-component-catalog `:578-598` | D2 / D3 / D4 / D6 / D7 | 構成・動作・状態・a11y の literal 転記。SearchBar 不使用は in-memory filter のため | S1 | `SupplierPickerDialog.test.tsx` |
| catalog ⑧ 重ね契約 (A) | 02-component-catalog `:588-590` | D10 | Radix nest、二重 scrim 許容。(B) は L3 破綻時のみ | S1 + S2 | jsdom test（P1）+ AC-L3-5 |
| UI-01b-D7 / D21 | 51 `:21,36,149-156` | D1 / D8 | canonical `CreateSupplierDialog` 1 実装、inline パネル撤去 | S2 / S4 | `ProductForm.test.tsx` |
| UI-01b-D8 | 51 | — | 取引先未指定で保存可能（不変） | S4 | 既存 test 維持 |
| SPEC-PRV-D3 / D6（REQ-105 / 106） | 77 `:27,30,94` | — | toggle は filter 列残置、『すべての取引先』先頭 | S3 | `PriceRevisionFilters.test.tsx` |
| UI-02-D3 | 61 `:23,155` | — | 入庫記録も picker、未指定保存可 | S5 | `ReceivingPage.test.tsx` |
| SPEC-SUP-D2 / D9 | 78 `:28,55-59,146-158` | — | 名前検索 + scroll 箱、footer なし、全件取得 | S6 | `SupplierManagementPage.test.tsx` |
| DSR-22 現在行 3 点 | 01-decision-rules DSR-22 | D7 | 色だけに頼らない現在行 | S1 | `SupplierPickerDialog.test.tsx`（✓ + badge 文言） |
| DSR-01 | 01-decision-rules `:25` | D9 | 二重 primary 疑いの対象が消える | S7 | AC10 |
| trigger 表示 | mockup-f 背景（規定なし） | D5 | 現在値を出す。却下 = 固定文言「取引先を選択」（閉じた状態で現在値不明） | S3 / S4 / S5 | AC9 + AC-L3-6 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（DSR-24 / catalog picker 小節 / 51 / 61 / 77 / 78 が ⑱ で確定済み）。D5 trigger の現在値表示のみ canonical に規定が無く、S7 で catalog `:584` に 1 句追記して source 化する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: D1（canonical path）→ 51 `:151`、D5 → catalog `:584`
- Assumptions and constraints: Radix `DismissableLayer` の nested ESC / outside-click 挙動（P1）、WebView2 での focus trap（AC-L3-5）
- Deferred design gaps, risk, and follow-up target: query key 併存（非目的、Backlog 既存なし → closeout で起票判断）、(B) fallback
- Test Design Matrix can cite design decision IDs or source doc sections: yes
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 取引先未指定での保存（UI-01b-D8 / UI-02-D3）は trigger + picker でも `null` 選択で維持。既存 `Select` の disabled 条件は trigger が継承

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable（UI 層のみ） | — |
| Fact check / design decision split | not applicable | — |
| Lifecycle / retry | 取得失敗の再試行を picker 内 Alert に一本化（S3 で host 側 alert を残すか Writer 判断） | Review Focus |
| Operator workflow | 取引先選択が 1 click（Select 展開）→ 2 click（trigger → 行）に増える代わりに検索が付く。owner は ⑱ で「80 社の切替は検索の方が速い」と判断済み | AC-L3-1 |
| Replacement path | (A) 破綻時は (B) 2-stage へ Gated Amendment | AC-L3-5 |
| Data safety / evidence | not applicable（DB 書込みは既存 `create_supplier` のみ） | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | dialog 重ね (A) は WebView2 実機のみが oracle | AC-L3-5 |
| 環境・再現性 | 新設の環境依存なし | — |

## Design Readiness

- Existing design docs are sufficient because: ⑱ が DSR-24 / catalog / mockup / 4 function-design を確定済み。本 packet の D1〜D10 は実装上の配置・props・test 戦略で、設計の再導出ではない
- Source docs updated in this PR: S7（catalog `:582` `:584`、DSR-01 `:25`、51 `:151` + 変更履歴、61 / 77 / 78 変更履歴）
- Design gaps intentionally deferred: (B) fallback、query key 統一、取引先管理の sort / paging
- Durable decisions discovered in this plan and promoted to source docs: D1 / D5

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI のみ。CMD 以下不変
- Backend function design: 不変
- Command / DTO / data contract: 不変（`Supplier` DTO をそのまま使う）
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 「取引先を選択」「現在の選択」「選択中」「新しい取引先を追加」「閉じる」「取引先名で検索」「該当する取引先はありません」（catalog / mockup / 78 の literal）
- Error, empty, retry, and recovery behavior: 取得失敗 = picker 内 Alert + 再試行、検索 0 件 = EmptyState、追加失敗 = `CreateSupplierDialog` 既存のエラー表示（不変）
- Testability and traceability IDs: SPEC-SUPPICK-RT-1、AC1〜AC12、AC-L3-1〜6

## Contract Probe

- **P1** Radix `Dialog` を nest したとき ESC / 外クリックが最前面だけを閉じ、内側 close 後に focus が picker 内へ戻る（catalog `:589` の「想定」）: Writer が S1 の test で jsdom 上で実演（`user.keyboard("{Escape}")` で内側のみ閉じる、`document.activeElement` が検索 input）→ 結果を Implementation Results に記録。jsdom で再現不能なら「L3 のみ」に落とし理由を残す（D10）。**実機 oracle は AC-L3-5**
- **P2** `DialogContent` が `onCloseAutoFocus` / `onOpenAutoFocus` を透過する（`dialog.tsx:59` `...props`）: 起票時に Coordinator が確認済み（透過）→ 実装で利用可

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-24 picker 統一（3 host） | S3 / S4 / S5 | AC4 / AC5 / AC9 + 各 host test | AC-L3-1〜3 |
| catalog 構成（検索 / 固定帯 / 一覧 / footer） | S1 | AC7 + `SupplierPickerDialog.test.tsx` | AC-L3-1 |
| catalog 動作（行クリック閉じる / Esc・外クリック / A 案） | S1 | AC8 + test | AC-L3-2 / 5 |
| catalog 重ね契約 (A) | S1 + S2 | P1 jsdom test | AC-L3-5（正本） |
| catalog 状態（Skeleton / Alert / EmptyState） | S1 | test 3 本 | non-scope（L3 は 0 件のみ AC-L3-4） |
| catalog a11y（Title / Description / 初期 focus / 復帰） | S1 | test（`document.activeElement`） | AC-L3-5 |
| DSR-22 現在行 3 点 | S1 | test（✓ + 「選択中」文言） | AC-L3-1 |
| UI-01b-D7 / D21（canonical 1 実装、inline 撤去） | S2 / S4 | AC2 / AC3 + `ProductForm.test.tsx` | AC-L3-2 |
| UI-01b-D8 / UI-02-D3（未指定で保存可） | S4 / S5 | 既存 test 維持 | AC-L3-3 |
| SPEC-PRV-D3 / D6（toggle 残置 / 先頭行） | S3 | AC4 + `PriceRevisionFilters.test.tsx` | AC-L3-1 |
| SPEC-SUP-D2 / D9（検索 + scroll 箱） | S6 | AC6 + `SupplierManagementPage.test.tsx` | AC-L3-4 |
| D3 name 昇順 | S1 | test（順序 assertion） | non-scope |
| D5 trigger 現在値 | S3 / S4 / S5 | AC9 + host test（button 文言） | AC-L3-6 |
| D9 DSR-01 解消 / S7 docs | S7 | AC10 | non-scope |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-10-supplier-picker-runtime.md](test-matrices/2026-09-10-supplier-picker-runtime.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（frontend のみだが慣行維持）

- targeted tests: `SupplierPickerDialog.test.tsx`（新設、契約 10 項目）/ `PriceRevisionFilters.test.tsx` / `ProductForm.test.tsx` / `ReceivingPage.test.tsx` / `SupplierManagementPage.test.tsx`
- negative tests: 空白名は `CreateSupplierDialog` 側で拒否（既存）/ 取得失敗時に picker の一覧が出ず Alert + 再試行 / 検索 0 件で EmptyState、検索クリアで復帰 / Esc・外クリックで `onSelect` が呼ばれない
- compatibility checks: 取引先未指定のまま保存できる（ProductForm / Receiving の既存 test）/ toggle 既定 on（PriceRevisionFilters 既存 test）/ `SupplierManagementPage` の追加 flow が引数変更後も動く
- data safety checks: 該当なし
- main wiring/integration checks: 該当なし（route / DTO 不変）

## Boundary / Wire Contract

該当なし。Tauri command / DTO / bindings / DB / CSV / route state を変更しない。`CreateSupplierDialog` の `onCreated` 引数変更は TS 内部契約（compile で検出）。

## Review Focus

- picker が fetch せず host の query 状態を受ける構造（D2）が 3 host で守られ、追加後の再取得が各 host の既存 key で行われること
- `CreateSupplierDialog` の canonical 1 本化後に、`PriceRevisionFilters` / `ProductForm` / `ReceivingPage` / `SupplierManagementPage` の 4 呼び出し元がすべて suppliers 版を import していること（AC2）
- `ProductForm` から inline パネル関連 state / handler が完全に消え、`supplierWarning` disabled が trigger に移っていること
- picker footer が scroll 箱の外で固定（`shrink-0`）、固定帯が scroll 箱の外にあること（catalog `:584` literal）
- 内側 dialog の overlay が既定のまま（二重 scrim、`bg-black/50` を消していない）
- `＋` 全角文字が無く lucide `Plus` を使っていること
- 各 host test で `Select` 依存の assertion（`getByRole("combobox")` 等）が picker 経由（`getByRole("button", { name: /取引先/ })` → dialog 内 `getByRole("row"|"button")`）へ置換され、旧挙動を語る test 名 / comment が残っていないこと
- S7 の docs 変更が literal 同期（canonical 行 / stale citation / 変更履歴）に限られ、DSR-24 本文や picker 小節の設計文を書き換えていないこと（D5 の 1 句追記を除く）

## Spec Contract

Contract ID: SPEC-SUPPICK-RT-1

- ⑱ が確定した DSR-24 / catalog picker dialog 小節 / 51 / 61 / 77 / 78 の契約が runtime（`src/features/suppliers` / `products` / `receiving`）へ反映され、`CreateSupplierDialog` が `onCreated(supplier)` 契約の 1 実装になり、canonical docs の「後続実装」表記と DSR-01 の stale citation が是正される

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-SUPPICK-RT-1 | S1 | `SupplierPickerDialog.test.tsx` | 構成 / 動作 / 状態 / a11y / 重ね (A) | vitest + AC7 / AC8 |
| SPEC-SUPPICK-RT-1 | S2 | `SupplierManagementPage.test.tsx`（追加 flow）+ typecheck | canonical 1 実装 | AC2 |
| SPEC-SUPPICK-RT-1 | S3 | `PriceRevisionFilters.test.tsx` | toggle 残置 / 先頭行 / trigger | AC4 / AC9 |
| SPEC-SUPPICK-RT-1 | S4 | `ProductForm.test.tsx` | inline 撤去 / 未指定保存 / A 案 | AC3 / AC9 |
| SPEC-SUPPICK-RT-1 | S5 | `ReceivingPage.test.tsx` | 指定なし / 未指定保存 | AC5 / AC9 |
| SPEC-SUPPICK-RT-1 | S6 | `SupplierManagementPage.test.tsx` | 検索絞り込み / 0 件 | AC6 |
| SPEC-SUPPICK-RT-1 | S7 | docs review | literal 同期のみ | AC10 |
| SPEC-SUPPICK-RT-1 | 全体 | owner L3 | dialog 重ね (A) 実機 | AC-L3-1〜6 |

## Data Safety

- what must not be committed: なし
- local-only paths: `.local/codex-orders/**`（発注書・log）
- synthetic-only paths: 該当なし

## Writer Instructions

- Codex `model_reasoning_effort=medium`（難所 = S1 の dialog 重ね test〈P1〉と S4 の ProductForm 置換。Coordinator 判断で high 昇格可）。commands 実行数と手戻り回数を PR body に記録する
- 着手前: `git status --short` 空を確認 → `git checkout --detach <遷移 commit SHA>` → `git rev-parse --short HEAD` を報告に書く。packet の Scope / Spec / AC / Matrix 契約行 / Workflow State / Ledger / 結果記入は一切編集しない（字面に疑義があれば最終報告で指摘）
- worktree: `npm ci --ignore-scripts` → `npm run generate:routes`。push 前に `npm run format:check` + lint + typecheck + targeted tests。`bash scripts/local-ci.sh full` は **1 worktree 1 run（同時走行禁止。回数上限ではない）**。`git add` は明示パスのみ（`-A` / `.` 禁止）。`HEAD:branch` 形式の push 禁止。完了後に worktree を自分で detach する。commit subject は conventional prefix、body は日本語可
- 各 S の設計意図（WHY）は Scope / 設計判断 D1〜D10 に書き込み済み。Writer は再導出せずそのまま従う。canonical の文言（catalog `:584-594`）を UI literal の正本とする
- 既存 test の assertion を書き換えるときは、旧挙動を語る test 名 / comment も同じ commit で直す（⑮ Q3 の一般規則）。既存 test の削除・skip は不可。inline パネル固有の test は picker flow の test に**置換**する（削除ではない）
- ponytail block（実装原則、以下を verbatim で発注書に注入）:

```
### 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- 具体的な適用: picker の scroll 箱は `ListShell.tsx` の class を流用し新規 class 系統を作らない（D6）。検索は `Input` 直置き（D4）。picker は fetch も queryClient も持たない（D2）。`CreateSupplierDialog` は suppliers 版の本体を残し型だけ変える（D1）。trigger は `Button variant="outline"` 1 個で、新規 component（`SupplierTrigger` 等）を作らない（D5、3 host で同じ 5 行程度なら重複を許容し、rule of three を超えて共通化したくなったら最終報告で提案するに留める）
- Maintainability review lens（owner 決定 2026-09-07）: 命名 / 理由 comment / 退屈な構造 > 賢い圧縮。D3 の並び替え・D8 の local 再取得・S3 で host 側 alert を残す / 消す判断には短い理由 comment を残す

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
