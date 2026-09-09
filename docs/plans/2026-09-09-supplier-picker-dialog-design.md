# Plan Packet: 取引先ピッカー統合 dialog（design-first）

`docs/Plans.md` Backlog「取引先ピッカー統合 dialog（design-first、owner 案 2026-09-08）」（owner 確定仕様の正本）を design-system / function-design canonical docs へ規範化する。取引先 Select + inline「新しい取引先を追加」を 1 つの picker dialog（検索 + scroll 一覧 + 枠外固定の追加/閉じる）へ統合する DSR-24 を新設し、catalog ⑧ Dialog に小節を追加し、mockup を用意し、適用先 3 画面（一括価格改定 filter・商品登録/修正 form・取引先管理）+ 適用未定 1 画面（入庫記録）の function-design 改訂方針を確定する。**本 packet 自体は docs-only（Plan Packet + Test Design Matrix + `docs/Plans.md` の起票のみ）。design-system / function-design canonical docs 本体の改訂は Plan Gate 後、別 Writer（Codex）実装 commit が行う。**

## Workflow State

- Phase: implementing
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: 47b3a69
- Amendments: none
- Coordinator: Fable 5.1
- Writer: Codex
- Plan Reviewer: Sonnet + Opus
- Final Reviewer: Sonnet + Opus + Codex
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required（docs-only だが Ready 後の hosted final は owner `workflow_dispatch` が必要。Ready 案内に明記する）
- Human Gate: owner mockup 確認（culling 3 項目: 追加後の自動選択 A/B / 入庫記録への適用 / 取引先管理の検索一覧）。mockup を実機（Windows native、対象 3 画面: 一括価格改定 filter / 商品登録・修正 form / 取引先管理）と並べて提示する。

## Owner Effort Budget

- 介入回数上限: 5（視覚系 change の実績予算 5〜6）
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）
- Coordinator 責務: hosted final の `workflow_dispatch` と Ready / merge 代行は同一 relay に束ねる。

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（`docs/design-system/01-decision-rules.md` DSR-24 新設 / `02-component-catalog.md` ⑧ picker dialog 小節 / mockup `reference/mockup-f-supplier-picker.html` / `docs/function-design/77,51,78,61`（61 は Human Gate 次第）+ `docs/Plans.md`）。`src/**`・DB・Tauri command・route の変更はない。DEV_WORKFLOW Risk Tiers の R2「docs change that affects maintainability but not runtime contracts」に該当し、`2026-09-06-ui-polish-batch3-design.md`（⑩、docs-only design-first の同型前例）と同じ形。ただし後続 runtime lane は既存 3 実装の統合・dialog 重ねの WebView2 実機確認を伴う R3 相当になり得るため、Impact Review Lenses の Data Safety / Operator workflow 欄にその旨を明記する。Coordinator 判断により Test Design Matrix を必須化する（R2 optional 判定を使わない）— 複数 function-design doc にまたがる新規文言の存在確認と、DSR-24 が DSR-01/DSR-23 と矛盾しないことの reviewer 実読を機械的に保証する必要があるため。

## Goal

Goal Invariant:

### 最小完了条件

- `01-decision-rules.md` DSR-24（新設）の draft 本文（ルール / Why / 適用条件 / 判定フロー）が本 packet「設計判断」節に確定済みの状態で記録され、DSR-01（1 画面 1 primary）・DSR-23（Select 統一）と矛盾しないことが Design Intent Audit で self-check されている。
- `02-component-catalog.md` ⑧ Dialog の picker dialog 小節 draft（構成・動作・dialog 重ね契約の (A) 推奨 / (B) fallback）が本 packet に記録され、(A) の WebView2 実機確認義務が runtime lane の AC-L3 へ明示的に申し送られている。
- mockup `mockup-f-supplier-picker.html` の内容仕様（3 画面分の起動状態 + 追加後の自動選択 A/B 2 枚 + dialog 重ねの二重 overlay 1 枚、計 6 状態）が本 packet に記録されている。
- `docs/function-design/77-ui-bulk-price-revision.md`（REQ-105）/ `51-ui-product-form.md`（UI-01b-D21）/ `78-ui-supplier-management.md`（SPEC-SUP-D2、§78.12）の改訂文言 draft が本 packet に記録され、`61-ui-receiving.md` は Human Gate (2) の回答が出るまで両論（要 / 不要）併記のまま確定しない。
- `CreateSupplierDialog` が実装として 2 file・3 箇所（`ProductForm.tsx` は独立 3 つ目の inline 実装で、どちらの `CreateSupplierDialog` も import していない）並存している事実が「起票時実測」節に記録され、統合方針（`onCreated: (supplier) => Promise<void>` 契約へ寄せる）が runtime lane 申し送りに含まれる。
- `docs/Plans.md` の「次の行動」に本 packet への active link を持つ ⑱ 行が追加され、Backlog の関連 2 entry（取引先ピッカー統合 dialog／取引先一覧の操作性）に起票済み注記が付く。
- `src/**` / `docs/decision-log.md` / `docs/design-system/**` / `docs/function-design/**` のいずれも本 commit で変更されない。

### 失敗定義

- owner 確定仕様（`docs/Plans.md` Backlog entry）の内容を変えて書く、または回答前の owner culling 対象（追加後の自動選択 A/B・入庫記録への適用・備考文言等）を owner 回答なしに確定事項として書く。
- `PageHeader`/DSR-01/DSR-23 等の既存 canonical ルール本文を、本 commit で `docs/design-system/**` を編集して書き換えてしまう（docs-only 前提の逸脱）。
- `CreateSupplierDialog` の並存を「2 実装」のまま記録し、`ProductForm.tsx` の 3 つ目の独立 inline 実装を見落とす。
- dialog 重ねの (A)/(B) tradeoff を書かずに (A) のみを既定として断定し、WebView2 実機確認義務を runtime lane へ申し送らない。
- `src/**` のいずれかの file が本 commit で変更される。

### 非目的

- `SupplierPickerDialog` 実装そのもの、`CreateSupplierDialog` 2 実装の統合実装、4 呼び出し元の置換、mockup HTML file 自体の作成（いずれも後続 Writer 実装 commit）。
- `01-decision-rules.md` / `02-component-catalog.md` / `docs/function-design/77,51,78,61` の実際の編集（本 commit では draft を packet 内に記録するのみ）。
- Windows native L3 実機確認（dialog 重ねの focus trap / ESC / 外クリック伝播を含む、runtime lane の AC-L3）。
- 入庫記録（61）への適用可否の最終決定（Human Gate (2) 未回答のため本 commit では確定しない）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-09、worktree base `c8e1409`、すべて本 packet 起草者が rg で再確認）

### 適用先候補 4 箇所（`listSuppliers` 呼び出し元）

- `src/features/receiving/ReceivingPage.tsx:139`（`unwrapResult(commands.listSuppliers(), ...)`）
- `src/features/products/components/ProductForm.tsx:371`（inline 追加成功後の再取得、下記参照）
- `src/features/products/hooks/usePriceRevisionList.ts:62`（`suppliersQuery`、一括価格改定 filter 用）
- `src/features/products/hooks/useProductFormOptions.ts:37`（`suppliersQuery`、商品登録/修正 form 用）

### 一括価格改定 filter（`PriceRevisionFilters.tsx`）

- `:60-92` 取引先 `Select`（`:75` `SelectItem value="all"` = すべての取引先）+ 隣接する secondary ボタン「新しい取引先を追加」（`:83-91`）。
- `:184-191` `CreateSupplierDialog`（`src/features/products/components/CreateSupplierDialog.tsx` の方）を呼び、`onCreated={async (supplier) => { await suppliersQuery.refetch(); onPatch({ supplier: supplier.id }); }}` — 追加成功後に**自動選択**する既存挙動。
- `:143-157` 「取引先未設定の商品も含める」toggle は `normalized.supplier !== undefined` のときだけ表示（filter 列側、Select/追加ボタンの外）。

### 商品登録・修正 form（`ProductForm.tsx`）

- `:302-321` 取引先 `Select`（`:314` `SelectItem value="none"` = 取引先なし）。
- `:322-332` secondary ボタン「新しい取引先を追加」（`showSupplierInput` トグル）。
- `:333-389` `showSupplierInput` true 時に表示される inline 常設パネル（`Input` + trim 検証 + `commands.createSupplier` 直呼び + `:371` `listSuppliers` 再取得 + 成功時 `update("supplierId", created.id)` で自動選択）。
- **事実訂正（発注前提の誤り、Coordinator 指摘の「2 実装並存」を修正）**: `ProductForm.tsx` は `CreateSupplierDialog`（`products/` 版・`suppliers/` 版のいずれも）を **import していない**（`rg -n "CreateSupplierDialog" src/features/products/components/ProductForm.tsx` 0 件）。`showSupplierInput`/`supplierName`/`supplierCreateError`/`isCreatingSupplier` という**独立した 3 つ目の inline 実装**を state ごと持ち、`commands.createSupplier`/`commands.listSuppliers` を直接呼ぶ。統合対象は発注前提の「2 実装」ではなく、**「2 file 2 実装 + ProductForm.tsx 内の 3 つ目の inline 実装」の計 3 実装**である。

### `CreateSupplierDialog` 2 file の契約差分

- `src/features/products/components/CreateSupplierDialog.tsx`: `onCreated: (supplier: Supplier) => Promise<void>`。呼び出し先で `supplier.id` を受け取り選択状態にできる（`PriceRevisionFilters.tsx` が使用）。
- `src/features/suppliers/components/CreateSupplierDialog.tsx`: `onCreated: () => Promise<void>`。呼び出し先は再取得のみで、作成された supplier を受け取れない（`SupplierManagementPage.tsx:68-74` が使用、選択状態という概念がない画面のため要件を満たしている）。
- 両実装とも `Dialog`/`DialogContent`/`DialogFooter`（`src/components/ui/dialog.tsx`）+ `commands.createSupplier` + trim 検証 + 同名衝突時エラー表示という構造は同一で、命名衝突（同名 export）以外は差分が小さい。picker dialog が新規追加後の自動選択を前提とする（owner 仕様）ため、統合後の契約は `(supplier: Supplier) => Promise<void>` 側（`products/` 版）に寄せるのが自然。

### 取引先管理画面（`SupplierManagementPage.tsx`）

- `:33-40` `PageHeader`（`actions` + `subtitle` 併存、⑮ の `PageHeader.tsx` root-cause fix 済みのため両方とも表示される）。
- `:60-66` `SupplierUsageTable`（`src/features/suppliers/components/SupplierUsageTable.tsx`）は `<div className="rounded-md border"><Table>...</Table></div>` の単純な枠付き表で、検索 input・scroll 制御（`max-height` 等）・pagination のいずれも持たない（`useSuppliersWithUsage()` で全件取得、DSR-22 の `ListShell` 採用画面にも未登録）。
- `:68-83` `CreateSupplierDialog`（`suppliers/` 版）+ `MergeSupplierDialog` の 2 dialog。
- backend `list_suppliers`（`src-tauri/src/cmd/product_cmd.rs:117`）は **引数なし**（`pub fn list_suppliers(state: State<AppState>) -> Result<Vec<Supplier>, CmdError>`）— 検索・paging を持たない。取引先管理の検索も他 2 画面と同様、front 側 filter で実装する必要がある。

### `MergeSupplierDialog`（単一 dialog 内 2-stage の先例）

- `src/features/suppliers/components/MergeSupplierDialog.tsx:41`（`stage: 1 | 2` state）、`:74-166`（stage 別に本体を出し分け、`DialogContent` は 1 つのまま）。footer は stage 1 = キャンセル/次へ の 2 ボタン、stage 2 = 「残す取引先を選び直す」(outline) / キャンセル(outline) / 統合する(destructive) の**3 ボタン**（`02-component-catalog.md:544` が「取引先統合 stage 2」として引用する既存先例）。
- **重要な違い**: `MergeSupplierDialog` は「同じ dialog の中身を差し替える」2-stage であり、**別の `Dialog` component を重ねて開く実装ではない**。本 packet が求める「picker dialog を開いたまま `CreateSupplierDialog` をさらに開く」という dialog-in-dialog の先例はアプリ内に存在しない。

### Dialog 使用状況全般

- `src/components/ui/dialog.tsx`: `DialogContent` の `showCloseButton`（既定 `true`、`:45-49`）で右上 × ボタンの有無を切替可能。`overlay`（`:26-40`）・`content`（`:42-74`）ともに `z-50` 固定。
- `<Dialog` 系（`AlertDialog` を除く）使用箇所は 6 file: `src/components/ui/dialog.tsx`（定義）、`src/features/shortcuts/ShortcutsDialog.tsx`、`src/features/suppliers/components/CreateSupplierDialog.tsx`、`src/features/suppliers/components/MergeSupplierDialog.tsx`、`src/features/products/components/CreateSupplierDialog.tsx`、`src/features/receiving/CostDiffDialog.tsx`。いずれも単独 dialog で、他の `Dialog` を子として開く実装は 0 件。
- `package.json:46` `"radix-ui": "^1.4.3"`（bundled package、`Dialog as DialogPrimitive` を named import）。Radix の `Dialog.Root`/`Portal`/`FocusScope`/`DismissableLayer` は複数インスタンスをスタックとして扱う設計だが、本アプリでの入れ子使用は前例が無いため、ESC・外クリック伝播・フォーカス復帰の実挙動は仕様書上の期待にとどまり実機未検証（下記「設計判断」参照、Contract Probe 節）。

### 入庫記録の取引先欄（未調査 anchor、本節で実測完了）

- `src/features/receiving/ReceivingPage.tsx:399-421`: 取引先欄は `Select`（shadcn、DSR-23 準拠）で、`SelectItem value="none"`＝指定なし + 候補一覧のみ。**追加導線（「新しい取引先を追加」ボタン等）は存在しない**（`rg -n "新しい取引先|CreateSupplierDialog" src/features/receiving/ReceivingPage.tsx` 0 件）。
- `docs/function-design/61-ui-receiving.md:23` UI-02-D3「取引先候補は `commands.listSuppliers()` 由来の complete master data とする。**inline 新規取引先作成は初回 UI-02 実装では扱わない**。取引先は任意項目だが、誤った master 追加は後から直しづらい。UI-01b と同じ候補取得方針にそろえる。」— 入庫記録に追加導線が無いのは実装漏れではなく、明示的な design decision（UI-02-D3）による defer。
- **DSR-24 の適用条件**（下記「設計判断」）は「候補データが追加導線を伴う」ことを前提にしており、入庫記録は現状この条件を満たさない。適用するには UI-02-D3 の defer を覆す別の design 判断が要る。適用範囲の提案は「設計判断」節参照（Human Gate (2) の材料）。

### DSR-01 / DSR-23 との関係

- `01-decision-rules.md:19-27` DSR-01 は `ProductForm.tsx:343`「追加する」ボタンの二重 primary 疑いを runtime 是正対象として引用している。実測では現在「追加する」相当のボタンは `:387`、トグルボタン「新しい取引先を追加」は `:331` にあり、`:343` の引用行はズレている（scope 外の drift、本 packet では `01-decision-rules.md` を編集しないため是正しない。runtime lane が inline パネルを撤去すれば当該引用自体が不要になるため、報告のみ行う）。
- `01-decision-rules.md:457-465` DSR-23「プルダウンは shadcn Select に統一する」— DSR-24 はこの例外条項として位置づける（下記）。

### mockup 命名規約

- 既存 mockup は `mockup-c-*`（3 file）/ `mockup-d-*`（7 file）/ `mockup-e-badge-cta-samples.html`（1 file）の 11 file。`mockup-f-*` の前例は 0 件（`rg -c "mockup-f" docs/design-system/reference/README.md` = 0）。本 packet は `mockup-f-supplier-picker.html` を新規命名として使う。

## 設計判断

### DSR-24 新設（`01-decision-rules.md`、title を「DSR-01〜24」へ）

> ## DSR-24 追加導線を伴う master 参照は picker dialog に統一する
>
> **ルール**: 複数候補から 1 件を選ぶ master 参照（取引先等）のうち、選択に加えて「新規追加」の導線を伴うものは、shadcn `Select`（DSR-23）ではなく picker dialog（検索 input + scroll 一覧 + 枠外固定の追加/閉じるボタン）に統一する。候補が追加導線を持たない選択（部門等）は DSR-23 の `Select` のまま変更しない。
>
> **適用条件**: (1) 呼び出し画面が候補から 1 件を選ぶ操作を持つこと、(2) その候補データが「漸進的に増える complete master data」であること（例: 取引先 = `listSuppliers()` / `createSupplier()` の組）、(3) その画面が候補への追加導線（inline パネル・別 Select 横のボタン等）を持つこと。3 条件のいずれかを満たさない候補は対象外（例: `DepartmentFilter` の部門は追加導線を持たない固定 master のため (3) を満たさず対象外）。追加導線を持たない画面への適用可否は本 DSR の対象外とし、個別の design 判断に委ねる。
>
> **Why**: DSR-23 は見た目の統一を目的にプルダウンを Select へ統一したが、追加導線が伴う候補では Select 自体に行を増やす手段が無く、画面ごとに inline パネル（`ProductForm.tsx`）・Select 横のボタン（`PriceRevisionFilters.tsx`）とバラバラな実装が並立してきた（起票時実測「`CreateSupplierDialog` 2 file の契約差分」参照）。owner L3 所感（2026-09-08、`docs/Plans.md` Backlog entry）「追加である以上オレンジでは」「絞り込み列に登録操作が混ざる」は、Select 横に primary 色のボタンを並べる現行実装が、絞り込みの主動線と登録操作を同一視覚面で混同させていることを指す。dialog に閉じ込めることで、画面本体は選択操作だけに単純化され、追加操作は dialog を開いた後だけに現れる別の文脈になる。
>
> **判定フロー / 具体例**: DSR-01（1 画面 1 primary）は画面本体の主動線を変えず、dialog を開いている間だけ dialog 内の「追加の確定」ボタン 1 個を primary（amber）にすることで維持する（dialog を閉じれば画面には primary が戻らない）。適用例: 一括価格改定 filter・商品登録/修正 form（いずれも候補から 1 件を選ぶ操作を持つ）。非適用例: 部門フィルタ（`DepartmentFilter`、追加導線なし、Select のまま）。取引先管理は選択操作を持たないため DSR-24 非適用。一覧の見た目（検索 input + scroll 箱）だけ picker dialog と揃える（78 SPEC-SUP-D2、SPD-D6）。入庫記録は現状 UI-02-D3 により追加導線を持たないため非適用（Human Gate (2) で覆されない限り）。
>
> **関連**: パターン⑧ Dialog / 確認（picker dialog 小節）、DSR-23（プルダウンは Select 統一、本 DSR はその例外条項）、DSR-01（1 画面 1 primary）。

新規 DSR-25 は起草しない（AC3 の negative oracle で保証）。

### catalog ⑧ Dialog「picker dialog」小節新設（`02-component-catalog.md`）

> **picker dialog（複数候補から 1 件選ぶ + 追加導線、DSR-24）**
>
> **使いどころ**: 取引先等、追加導線を伴う complete master data から 1 件を選ぶ場面（DSR-24 適用条件）。
>
> **canonical**: `SupplierPickerDialog`（後続実装、`src/features/suppliers/components/` 配下を想定）。
>
> **構成**: ヘッダ（title、例:「取引先を選択」）+ 本体（名前検索 input、live・client-side filter — `list_suppliers` は無引数のため取得済み一覧をここで絞り込む — + scroll 一覧、箱の見た目は商品一覧の表を流用、行に現在選択 ✓、フィルタ文脈では先頭に「すべての取引先」行、入力文脈では先頭に既存 sentinel 相当の行〈「取引先なし」/「指定なし」〉を維持）+ footer（枠外固定、左「新しい取引先を追加」secondary・右「閉じる」outline）。一覧行クリック = 選択確定 + dialog を閉じる。footer は一覧の scroll と独立して常時固定表示する。
>
> **動作**: 外クリック / Esc = 「閉じる」と同じ（選択は変更しない、DSR-20 の硬化対象ではない通常 Dialog）。「新しい取引先を追加」→ 既存 `CreateSupplierDialog` をそのまま開く（owner 仕様）。追加成功後は一覧を再取得する。新規取引先を自動選択するか（A: 自動選択 + 両 dialog を閉じる / B: 一覧へ反映のみ、picker は開いたまま）は Human Gate (1) 未確定。確定まで catalog には A/B 両論を併記する。picker は確認 Action を持たず（一覧行クリックが確定）、footer 左は別 surface を開く secondary、右が dismiss。⑧ の **配置** bullet が定める Cancel 左 / Action 右 は確認 dialog の 2 ボタン規則であり、picker footer には適用しない。
>
> **dialog 重ね契約**（`CreateSupplierDialog` を picker dialog の上に開く）:
> - **(A) 推奨**: Radix `Dialog.Root` を picker dialog の内側でネストする。owner 仕様「既存 CreateSupplierDialog をそのまま開く」に文字面で忠実。両 dialog とも `z-50` の overlay を持ち、後着 dialog が DOM 順で後にマウントされ視覚的に手前へ来る。ESC は Radix `DismissableLayer` のスタック管理により最前面の dialog のみを閉じる想定、フォーカスは `CreateSupplierDialog` を閉じたあと picker dialog へ戻る想定。**本アプリに dialog-in-dialog の先例が無いため、これらは実機未検証の期待値であり、Windows WebView2 で ESC・外クリック伝播・focus trap を確認する（runtime lane AC-L3、下記 Contract Probe 参照）**。内側 dialog の overlay は透過（`bg-transparent`）とするか二重 scrim（`bg-black/50` × 2 ≈ 75% 暗転）を許容するかを mockup で owner に示す（根拠: `src/components/ui/dialog.tsx` の `DialogOverlay` `bg-black/50` + `z-50`）。
> - **(B) fallback**: `MergeSupplierDialog`（起票時実測参照）型の単一 dialog 内 2-stage（stage 1 = 一覧、stage 2 = 追加フォーム）。dialog を重ねないため WebView2 リスクを避けられるが、`CreateSupplierDialog` の実装（validation・toast・エラー表示）を picker dialog 内に複製することになり、owner 仕様「既存 CreateSupplierDialog をそのまま開く」との文字面が一致しない。(A) の実機確認で問題が出た場合のみ (B) に切替える。
>
> **Do**: 追加導線を伴う候補は本パターンに統一する（DSR-24）。footer の 2 ボタンを枠外固定にし、一覧の scroll と独立させる。
>
> **Don't**: Select 横に primary 色の追加ボタンを並べない（DSR-24 Why 参照）。追加導線を持たない候補（部門等）にまで本パターンを広げない。

### mockup `mockup-f-supplier-picker.html`（内容仕様、後続実装）

1 file に次の状態を並べる（`mockup-d-lists.html` の商品一覧の表の箱を流用）:

1. 一括価格改定 filter から開いた picker dialog（「すべての取引先」行あり）
2. 商品登録・修正 form から開いた picker dialog（先頭行「取引先なし」、「すべて」行は無し）
3. 取引先管理画面の検索 + scroll 一覧（picker dialog ではなくページ本体への埋め込み。既存 `SupplierUsageTable` に検索 input を追加し、箱を scroll 化した形。footer ボタンは無し — 選択して閉じる、という picker の用途ではないため）
4. 追加後の自動選択「あり」（新規取引先が一覧に反映され ✓ が付いた状態、Human Gate (1) の A 案）
5. 追加後の自動選択「なし」（新規取引先が一覧の末尾/該当位置に現れるが ✓ は付かず、利用者が改めてクリックする状態、Human Gate (1) の B 案）
6. picker dialog を開いたまま `CreateSupplierDialog` を重ねて開いた状態（二重 overlay の見え方。内側 dialog の overlay を透過 `bg-transparent` とするか二重 scrim `bg-black/50` × 2 ≈ 75% 暗転を許容するかを owner に示す）

### function-design 改訂方針（draft、後続 Writer が反映）

**`77-ui-bulk-price-revision.md`（REQ-105 / SPEC-PRV-D3）**: 「取引先の選択は取引先ピッカー dialog（`01-decision-rules.md` DSR-24）を経由する。『すべての取引先』行は一覧先頭に残し、『取引先未設定の商品も含める』toggle はフィルタ列に残置する（dialog 内へは移動しない）。」を追記する。

**`51-ui-product-form.md`（UI-01b-D21）**: 「取引先の選択は取引先ピッカー dialog（DSR-24）を経由し、『新しい取引先を追加』は picker dialog 内から既存 `CreateSupplierDialog`（`src/features/products/components/CreateSupplierDialog.tsx` を正、`onCreated: (supplier) => Promise<void>` 契約へ統合）を開く。現行の inline 常設パネル（`showSupplierInput` state、独立した 3 つ目の実装、起票時実測参照）は撤去し、trim・空文字拒否・同名衝突・失敗時入力保持の validation は `CreateSupplierDialog` に委譲する。」を追記する。

**`78-ui-supplier-management.md`（SPEC-SUP-D2 / §78.12）**: SPEC-SUP-D2 に「`/settings/suppliers` に名前検索 input + scroll 一覧（picker dialog と同じ箱の見た目、DSR-24）を追加する。」を追記し、§78.12 Deferred の「検索、任意並び替え、paging、bulk rename」から「検索、」を外し「任意並び替え、paging、bulk rename」を残す。

**`61-ui-receiving.md`（UI-02-D3、Human Gate (2) 待ち）**: 3 案を owner culling とする（Coordinator 推奨は「不要」）。

- (a) **要（picker dialog 適用）**: 入庫記録の取引先欄も picker dialog + 追加導線に統一する。Pros: 3 画面の見た目・操作が完全に揃う。Cons: UI-02-D3「inline 新規取引先作成は初回 UI-02 実装では扱わない」という**明示的な design decision を覆す**ことになり、本 packet（design-first の統一 dialog 提案）の範囲でその是非を判断する材料が無い（入庫記録固有の運用理由が UI-02-D3 に書かれていない一方、覆す積極的理由も owner 確定仕様には明記されていない）。
- (b) **不要（現状維持、Coordinator 推奨）**: 入庫記録の Select はそのまま。Pros: UI-02-D3 の defer 判断を尊重し、本 packet の範囲を「追加導線が既にある/既に要望されている 3 画面」に閉じられる。Cons: 4 画面中 1 画面だけ見た目が異なったまま残る。
- (c) 中間案（検索+scroll の見た目だけ揃え、追加導線は付けない）: DSR-24 対象外のため個別 design 判断（取引先管理と同型の「見た目だけ揃える」）になるが、入庫記録は取引先管理と違い選択面そのものであり、追加導線のない picker 形だけを借りると DSR-24 の意図（追加導線の集約）から外れた見た目だけの改変になる。Coordinator は不採用を推奨。

Human Gate (2) で (a) が選ばれた場合、UI-02-D3 の defer を明示的に上書きする 1 行を `61-ui-receiving.md` に追記する必要があり、これは本 packet の Scope に含めず gated amendment または次の Plan Review round で扱う。

### 実装コンポーネント統合方針（runtime lane 申し送り）

`CreateSupplierDialog` は 3 実装（`products/` 版・`suppliers/` 版・`ProductForm.tsx` 内 inline）を `onCreated: (supplier: Supplier) => Promise<void>` 契約（`products/` 版）へ 1 本化する。`suppliers/` 版は `onCreated: () => Promise<void>` を `(supplier) => Promise<void>` へ拡張し、呼び出し元（`SupplierManagementPage.tsx`）は返り値を使わず再取得のみ行えばよい（後方互換）。

## Scope

- **S1 DSR-24 新設**: `01-decision-rules.md` に DSR-24（上記「設計判断」draft）を追加し、title を「DSR-01〜24」へ更新する。新規 DSR-25 は起草しない。DSR-23 の「関連」行末へ `DSR-24（追加導線 + 選択を伴う候補は picker dialog、本 DSR の例外）` を追記する（DSR-23 本文のルール / Why / 具体例は無変更）。`docs/design-system/README.md:13`（範囲表記 `DSR-01〜23`→`24` + トピック一覧に「DSR-24」を追記）と `docs/UI_TECH_STACK.md:403`（範囲表記 `DSR-01〜23`→`24`）を同期する。あわせて `docs/quality/review-checklist.md` カテゴリ 9 に DSR-24 対応のチェック行を 1 行追加する（先例 = DSR-23、AC11 に倣う登録）。
- **S2 catalog ⑧ picker dialog 小節**: `02-component-catalog.md` ⑧ Dialog / 確認に「picker dialog」小節（上記 draft）を追加する。Human Gate (1) 回答後、A/B いずれかへの確定・置換は本 commit の Scope に含めず Gated Amendment として扱う。あわせて既存 ⑧ の使いどころ（`:510`）へ 1 行拡張「加えて、選択・入力を画面から切り離して dialog に閉じる非確認 dialog も本節が扱う（picker dialog、DSR-24）」と、形式表（`:533-536`、形式 / 割込み度 / 用途 / 実装の 4 列）へ 1 行追加（`| **Dialog（非確認）** | 中（明示ボタンで開閉、確認は挟まない） | 候補選択・追加導線の集約。「取引先を選択」 | shadcn/ui \`Dialog\` |`）を行う。
- **S3 mockup**: `docs/design-system/reference/mockup-f-supplier-picker.html`（上記内容仕様、6 状態）を新規追加し、`reference/README.md` の一覧表に 1 行追加する。あわせて `reference/README.md` に欠落している `mockup-e-badge-cta-samples.html` の 1 行を補完し、末尾の系統説明（`:23` 「3 つの mockup-c と 7 つの mockup-d は…」）を mockup-e・mockup-f を含む文言へ更新する。
- **S4 function-design 改訂**: `77-ui-bulk-price-revision.md`（REQ-105）/ `51-ui-product-form.md`（UI-01b-D21）を上記 draft のとおり改訂し、`78-ui-supplier-management.md`（SPEC-SUP-D2 / §78.12）を上記 draft のとおり改訂する。`61-ui-receiving.md` は Human Gate (2) の回答後に対応する（本 commit / 次の実装 commit いずれも対象外、回答が出るまで pending）。改訂対象の本文節は file:line で以下のとおり: 77 `:89-95`（SPEC-PRV-D3 / D6 節の「取引先 filter に『新しい取引先を追加』を置き…」）/ 51 `:21`（UI-01b-D7）、`:149-156`（取引先 inline 追加節）、`:210`（テスト観点）/ 78 `:28`（SPEC-SUP-D2）、`:149`（78.11 テスト観点に検索を追加）、`:161`（§78.12 から検索を外す）。Human Gate (2) で (a) が選ばれた場合、入庫記録の picker 状態を mockup に追加する Gated Amendment が必要（状態 7 は本 packet では作らない）。
- **S5 runtime lane への申し送り**（本 packet 内、Non-scope の直後の節に記載、次の Writer 実装 commit の Scope 外だが再利用対象）: `CreateSupplierDialog` 3 実装の統合契約 / 4 呼び出し元の置換順（一括価格改定 filter・商品登録/修正 form・取引先管理を先に、入庫記録は Human Gate (2) 次第）/ front 側 filter の実装方針（`list_suppliers` 無引数のまま、client-side filter）/ dialog 重ね (A) の WebView2 実測義務（AC-L3）/ DSR-01 の stale citation は 2 箇所（`ProductForm.tsx:343` → 実測 `:387`〈「追加する」〉、トグル「新しい取引先を追加」の実体は `:331`／`ProductForm.tsx:481` → 実測 `:496`〈「登録する / 保存する」〉）、いずれも inline パネル撤去時に自然解消 / ⑰ merge 後、catalog `:544` 側へ『（確認 dialog の 2 ボタン）』の限定語を足す。
- **S6 Plans.md 同期**: 「次の行動」に ⑱ 行を追加し、Backlog の関連 2 entry に起票済み注記を付ける（本 commit で直接実施）。

## Non-scope

- `SupplierPickerDialog` の実装、`CreateSupplierDialog` 3 実装の統合実装、4 呼び出し元の置換（runtime lane、別 packet）。
- `01-decision-rules.md` / `02-component-catalog.md` / `docs/function-design/77,51,78,61` の実際の編集（本 commit では draft を本 packet に記録するのみ。Plan Gate 後、別 Writer 実装 commit が反映する）。
- `mockup-f-supplier-picker.html` の HTML 実体作成（後続 Writer 実装 commit）。
- Windows native L3 実機確認（dialog 重ねの focus trap / ESC / 外クリック伝播、runtime lane AC-L3）。
- `61-ui-receiving.md` の改訂（Human Gate (2) 回答待ち）。(a) 適用が選ばれた場合は入庫記録の picker 状態を mockup に追加する Gated Amendment が必要（状態 7 は本 packet では作らない）。
- `⑰ 表示小修正 batch`（同時進行、`docs/Plans.md` Backlog「表示小修正 lane」。⑰ 実体 = branch `agent/ui-display-fixes-batch`、Draft PR #48、plan-first commit `743ba68`、同時起票、Plans.md 行は当該 branch 側にある）: catalog ⑧ Dialog 節の footprint overlap に注意する。⑰ は既存 `RenameSupplierRow.tsx` の footer ボタン順是正（Cancel 左 / Action 右への入替）で catalog `:544`（`**配置**` bullet）直後、比較用 variant `:560` の手前へ 1 行追記する見込み、本 packet（⑱）は「picker dialog」小節（比較用 variant の後、⑧ セクション末尾）に加え使いどころ（`:510`）・形式表（`:535`）へも手を入れる見込みで、editing する行範囲は重ならない想定だが、**merge 順は ⑰ 先を前提に書く**（後に merge する側が origin/main を単段 merge して自身の rg oracle を再実行する）。群 2 の是正で ⑧ 使いどころ `:510` / 形式表 `:535` / `:544` 付近に手が入るため、⑰（`:544` 直後 1 行追記）との textual conflict 可能性が上がる。merge 順は ⑰ 先を維持し、⑱ 側で origin/main 単段 merge 時に両側保持で解消する。
- 記録状態 Badge tone・単位拡張・フィルタ Label 上置き統一 等、`docs/Plans.md` Backlog の他 design-first 候補（本 packet と無関係）。

## Acceptance Criteria

以下は**次の Writer 実装 commit**（design-system / function-design canonical docs 本体の改訂）が満たすべき AC であり、本 plan-first commit では baseline（現状 0 件、個別に注記したものを除く）を確認済みの anchor として記録する。本 plan-first commit 自体の AC は AC10〜AC12。AC13〜AC19（round 1/round 2 是正で追加）も次の Writer 実装 commit が満たすべき forward AC であり、本 plan-first commit ではやはり baseline のみを確認する。

- AC1: `rg -c "^## DSR-24" docs/design-system/01-decision-rules.md` ≥ 1（baseline 0 確認済み）。DSR-24 が新設されている。
- AC2: `rg -c "^# 判断ルール集（DSR-01〜24）" docs/design-system/01-decision-rules.md` = 1（baseline 0 確認済み、`〜` は U+301C wave dash。見出し行 anchor に限定し更新履歴表等の本文中の同一文言に釣られない）。title が更新されている。
- AC3: `rg -c "^## DSR-25" docs/design-system/01-decision-rules.md` = 0。新規 DSR を誤って複数起草していないことの negative oracle。
- AC4: `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -Fc "picker dialog"` ≥ 1（baseline 0 確認済み、更新履歴表の同一文言に釣られないよう本文範囲に限定）。picker dialog 小節が追加されている。
- AC5: `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -Fc "focus trap"` ≥ 1（baseline 0 確認済み）かつ reviewer 実読で (A) 推奨 / (B) fallback の両方が書かれ、(A) の WebView2 実機確認義務が明記されていることを確認。gate 未回答の間は `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -c '自動選択.*Human Gate \(1\)'` ≥ 1（baseline 0 確認済み。「自動選択」と「Human Gate (1)」が同一行に共起することを要求し、既存の別件 Human Gate (1)〈2026-09-06 badge tone、`:836`/`:838`〉との字面重複を排除する）。
- AC6: `rg -Fc "mockup-f-supplier-picker.html" docs/design-system/reference/README.md` ≥ 1 かつ `rg -Fc "mockup-e-badge-cta-samples.html" docs/design-system/reference/README.md` ≥ 1（baseline とも 0 実測確認済み）。
- AC7: `awk '/^## 77\.10 変更履歴/{exit}{print}' docs/function-design/77-ui-bulk-price-revision.md | rg -Fc "取引先ピッカー"` ≥ 1（baseline 0 確認済み、本文範囲に限定し変更履歴表での言及に釣られない）。
- AC8: `awk '/^## 7\.9 変更履歴/{exit}{print}' docs/function-design/51-ui-product-form.md | rg -Fc "取引先ピッカー"` ≥ 1（baseline 0 確認済み、本文範囲に限定）かつ reviewer 実読で「独立した 3 つ目の実装」の撤去が明記されていることを確認（発注前提の「2 実装」誤りを引き継いでいないか）。
- AC9a: `rg -Fc "検索、任意並び替え、paging、bulk rename" docs/function-design/78-ui-supplier-management.md` = 0（現状 baseline 1、改訂後は「検索、」が外れているはずの negative oracle）。
- AC9b: `awk '/^## 78\.13 変更履歴/{exit}{print}' docs/function-design/78-ui-supplier-management.md | rg -Fc "名前検索"` ≥ 1（baseline 0 確認済み、本文範囲に限定）。SPEC-SUP-D2 に名前検索が追記されている。
- AC10: `git diff --name-only c8e1409..47b3a69 -- src docs/decision-log.md docs/design-system docs/function-design` の出力が空（baseline 実測: 空、確認済み）。評価時点は plan-first commit `8eff442` のみとし、Writer 実装 commit 後は本 AC を評価しない。Plan Commit 確定時は Plan Review 是正 commit をすべて含む最終 SHA へ差し替える（`8eff442` のまま凍結しない。SHA 自体は今は変えず、Coordinator が遷移 commit で差し替える）。
- AC11: `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-09-09-supplier-picker-dialog-design.md` および `bash scripts/doc-consistency-check.sh` が ERROR 0 で通過。
- AC12: `docs/Plans.md` の「次の行動」に本 packet（basename `2026-09-09-supplier-picker-dialog-design.md`）への active link を持つ ⑱ 行があり、Backlog の「取引先ピッカー統合 dialog」「取引先一覧の操作性（78 §78.12）」の両 entry に起票済み注記が付いている。
- AC13（F1 negative oracle）: `awk '/^## DSR-24/,/^## DSR-25|^## 更新履歴/' docs/design-system/01-decision-rules.md | rg -Uc --multiline-dotall "取引先管理.*SupplierPickerDialog"` = 0（baseline 0 確認済み。DSR-24 節に範囲限定した上で `--multiline-dotall` を付けて行跨ぎの共起も検出する。`-U` 単独では `.` が改行に一致しないため行跨ぎを検出できない〈round 3 実証〉。本文全体に dotall を掛けると DSR-24 本文の「取引先管理」と file 内の他所の `SupplierPickerDialog` が偽陽性を生むため節限定にする）。`rg -c` は 0 件時に出力なし・exit 1 となるため、出力が空の場合は 0 件として扱う（`--include-zero` 相当の解釈を明記）。取引先管理へ DSR-24 の canonical 実装〈`SupplierPickerDialog`〉を誤って適用していないことの negative oracle。
- AC14: `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -Fc "shadcn/ui \`Dialog\`"` ≥ 1（baseline 0 確認済み、本文範囲に限定）。形式表に picker dialog 用の非確認 Dialog 行が追加されている。
- AC15: `awk '/^## DSR-23/,/^## 更新履歴/' docs/design-system/01-decision-rules.md | rg -Fc "DSR-24"` ≥ 1（baseline 0 確認済み）。DSR-23 の関連行に DSR-24 の相互参照が追記されている。
- AC16（更新履歴表の日付行、F6c）: `rg -c "^\| 2026-09-" docs/design-system/01-decision-rules.md` ≥ 15（baseline 14 確認済み）かつ `rg -c "^\| 2026-09-" docs/design-system/02-component-catalog.md` ≥ 13（baseline 12 確認済み）。DSR-24 新設 / picker dialog 小節追加を記録する更新履歴行がそれぞれ 1 行以上増えている。
- AC17（F7 周辺 doc 同期）: `rg -Fn 'DSR-01〜23' docs/design-system/README.md docs/UI_TECH_STACK.md` = 0（baseline 2 件〈`README.md:13`、`UI_TECH_STACK.md:403`〉確認済み）かつ `rg -Fc 'DSR-24' docs/design-system/README.md` ≥ 1（baseline 0 確認済み）。
- AC18（F8 negative oracle 3 本）:
  - AC18a: `rg -Fc "取引先 filter に \`新しい取引先を追加\` を置き" docs/function-design/77-ui-bulk-price-revision.md` = 0（baseline 1 確認済み、`:94`）。
  - AC18b: `rg -Fc "「分類と取引先」セクションの complete master data 選択に「新しい取引先を追加」を併設する" docs/function-design/51-ui-product-form.md` = 0（baseline 1 確認済み、`:151`）。
  - AC18c: `rg -Fc "システム管理 navigation から UI-15 に到達し、name 昇順・商品件数・入庫記録件数・追加導線が表示される" docs/function-design/78-ui-supplier-management.md` = 0（baseline 1 確認済み、`:149`。改訂後は同テスト観点行に「検索」が加わり文言が変わる想定の negative oracle）。
- AC19（review-checklist カテゴリ 9 同期、Sonnet P3）: `rg -Fc 'DSR-24' docs/quality/review-checklist.md` ≥ 1（baseline 0 確認済み）。カテゴリ 9 に DSR-24 対応のチェック行が追加されている（先例 = DSR-23、AC11）。
- AC-HumanGate: owner が (1) 追加後の自動選択 A/B (2) 入庫記録への適用 要/不要（Coordinator 推奨は不要） (3) 取引先管理の検索+scroll 一覧の見た目 を mockup 上で culling する（原文回答、Coordinator が転記し原文を正とする）。mockup を実機（Windows native、対象 3 画面: 一括価格改定 filter / 商品登録・修正 form / 取引先管理）と並べて提示する。

## Design Sources

- Requirements / spec: 該当なし（新規 REQ token 追加なし。REQ-105 の SPEC 拡張のみ）。
- Architecture: 変更なし。
- Function / command / DTO: 変更なし（`list_suppliers`/`createSupplier` の wire は不変）。
- DB: 変更なし。
- Screen / UI: `docs/design-system/01-decision-rules.md`（DSR-24 新設）/ `02-component-catalog.md`（⑧ picker dialog 小節）/ `docs/function-design/77,51,78`（改訂対象）/ `61`（Human Gate 待ち）。
- Decision log / ADR: 新規 entry なし。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-24（新設）、`02-component-catalog.md` ⑧、mockup-f、`docs/function-design/77,51,78` | intentionally deferred（draft は本 packet に記録済み、実反映は次の Writer 実装 commit） |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| durable decision / ADR | 該当なし（新規 decision-log entry なし） | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし（既存 3 doc の改訂のみ、61 は保留） |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 該当なし（新規 REQ 追加なし、`generate_traceability` 再生成不要） |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |
| 新規 DSR | DSR-24 起草。`01-decision-rules.md` の `## 更新履歴` 表への行追加は次の Writer 実装 commit で行う（本 commit では未着手）。 |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| owner Backlog entry | `01-decision-rules.md`（新設） | SPD-D1 | DSR-23 の Select 統一を全面撤回せず、追加導線の有無で例外条項として切り出す（DSR-23 の ルール / Why / 具体例 は無変更、「関連」行末へ DSR-24 への相互参照のみ追記）。適用条件を明文化し、部門等の非対象を明示 | `01-decision-rules.md` | AC1/AC2/AC3/AC13/AC15/AC16/AC17/AC19 |
| owner Backlog entry | `02-component-catalog.md` ⑧（既存 Dialog 節の拡張） | SPD-D2 | 独立した新セクションを作る代替は⑧ Dialog / 確認との重複が大きいため、既存⑧の比較用 variant と並ぶ小節として追加する | `02-component-catalog.md` | AC4/AC5/AC14/AC16 + reviewer 実読 |
| owner Backlog entry | mockup（新設） | SPD-D3 | 既存 mockup-d-lists.html の商品一覧の箱を流用し、新規 CSS 系統を増やさない | `reference/mockup-f-supplier-picker.html`、`reference/README.md` | AC6 |
| REQ-105 | `77-ui-bulk-price-revision.md` | SPD-D4 | 「取引先未設定の商品も含める」toggle を dialog 内へ移動する代替は owner 確定仕様（filter 列に残す）と矛盾するため不採用 | `77-ui-bulk-price-revision.md` | AC7/AC18a |
| REQ-106 / UI-01b-D21 | `51-ui-product-form.md` | SPD-D5 | `ProductForm.tsx` の独立 3 つ目の inline 実装をそのまま残す代替は DSR-24 の目的（実装の乱立解消）に反するため、既存 `CreateSupplierDialog`（`products/` 版）契約への統合を明記 | `51-ui-product-form.md` | AC8/AC18b |
| SPEC-SUP-D2 | `78-ui-supplier-management.md` | SPD-D6 | 検索を別画面（専用一覧 route）に切り出す代替は SPEC-SUP-D2 が単一画面運用を前提にしているため不採用、既存画面内への検索追加を選ぶ | `78-ui-supplier-management.md` | AC9a/AC9b/AC18c |
| UI-02-D3 | `61-ui-receiving.md`（pending） | SPD-D7 | UI-02-D3 の defer を本 packet の範囲で無断で覆さない。owner culling 3 案を提示し (b) 不要を推奨 | pending（Human Gate (2) 後） | AC-HumanGate |
| owner Backlog entry | 本 packet「設計判断」節 | SPD-D8 | `CreateSupplierDialog` 3 実装の統合契約を先に決めておくことで、次の Writer 実装 commit が呼び出し元置換のたびに個別判断しなくて済む | runtime lane（別 packet） | 該当なし（review-only） |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: DSR-24 の draft・catalog picker dialog 小節の draft はいずれも Why・適用条件・reject した代替（(B) fallback）を明記しており、次の Writer 実装 commit がそのまま canonical docs へ転記できる。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: DSR-24（新設）・picker dialog パターン・`CreateSupplierDialog` 統合契約は次の実装 commit で design-system / function-design docs へ昇格予定（本 commit では未反映）。新規 decision-log entry は不要（既存 DSR/catalog 体系の拡張の範囲内）。
- Assumptions and constraints: dialog 重ねの (A) 推奨は Radix の一般的なスタック管理挙動を前提にした**未検証の外部前提**であり、Contract Probe 節・runtime lane AC-L3 でのみ確定する。
- Deferred design gaps, risk, and follow-up target: 追加後の自動選択 A/B・入庫記録への適用・取引先管理の見た目は owner culling 待ち（Human Gate）。dialog 重ねの実機挙動は runtime lane 実装後の L3 待ち。
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-09-supplier-picker-dialog-design.md) 各行に SPD-D 番号を付す）。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 唯一の例外は入庫記録（61）の適用可否（owner culling のため確定できない、AC-HumanGate で代替）と dialog 重ねの実機挙動（Contract Probe で N/A + runtime lane 申し送りとして明記、下記）。他は全て owner culling 完了を待たずに機械 oracle 化できている。抜け道なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — docs-only、backend/DTO 変更なし | — |
| Fact check / design decision split | 適用: 発注前提「`CreateSupplierDialog` 2 実装並存」は実測で誤り（`ProductForm.tsx` は独立 3 つ目の inline 実装を持ち、どちらの `CreateSupplierDialog` も import しない）と判明し訂正した | 本 packet「起票時実測」節・「設計判断」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 取引先選択は 3〜4 画面の主動線に影響する。runtime 反映は別 packet だが、UI-02-D3（入庫記録の inline 追加 defer）という既存 operator workflow 決定と衝突しないよう Human Gate (2) で owner 判断を仰ぐ | AC-HumanGate |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし。ただし後続 runtime lane は `src/**` 4 file 相当の改修を伴い R3 相当になり得る旨を明記（Risk 節参照） | 次の runtime lane packet |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner が mockup 上で 3 項目（自動選択 A/B・入庫記録適用・取引先管理見た目）を culling する。dialog 重ねの実機（Windows WebView2）確認は本 packet の対象外で runtime lane の AC-L3 が担う | Human Gate、runtime lane AC-L3 |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: DSR-23（Select 統一）・catalog ⑧ Dialog（既存比較用 variant、`MergeSupplierDialog` 先例）の構造が既に存在し、本 packet は例外条項（DSR-24）と小節の新設で足りる。
- Source docs updated in this PR: なし（本 commit では `01-decision-rules.md` / `02-component-catalog.md` / `docs/function-design/**` を編集しない。draft のみ本 packet に記録）。
- Design gaps intentionally deferred: 追加後の自動選択 A/B・入庫記録への適用・取引先管理の見た目（owner culling、Human Gate）。dialog 重ねの実機挙動（runtime lane AC-L3）。
- Durable decisions discovered in this plan and promoted to source docs: `CreateSupplierDialog` が 3 実装であるという事実、および統合契約の方向性（`(supplier) => Promise<void>`）は owner culling 不要な既存コード実測からの導出として確定済み（runtime lane 申し送り）。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 該当なし（docs-only）。
- Backend function design: 該当なし。
- Command / DTO / data contract: 該当なし。
- Persistence / transaction / audit impact: 該当なし。
- Operator workflow / Japanese UI wording: DSR-24・picker dialog の日本語文言（「取引先を選択」「新しい取引先を追加」「閉じる」等）は既存文言を踏襲し、新規文言は最小限。
- Error, empty, retry, and recovery behavior: 該当なし（picker dialog 自体は既存 `CreateSupplierDialog` の validation/error 処理を再利用する設計、新規処理は追加しない）。
- Testability and traceability IDs: SPD-D1〜D8（新規 DSR は DSR-24 のみ）。

## Contract Probe

該当なし（R2 のため必須ではないが、後続 runtime lane が依拠する未検証の外部前提を記録する）。

- dialog-in-dialog（Radix `Dialog.Root` のネスト時の ESC・外クリック伝播・focus trap）: 本アプリに先例が無く、本 packet の範囲では実験を行わない。**runtime lane の AC-L3（Windows native）で実験し、(A) 推奨が破綻した場合は (B) fallback へ切替える**契約として申し送る唯一の未検証前提（Contract Probe そのものは runtime lane の実装 commit で実施）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| SPD-D1 DSR-24 新設 | `01-decision-rules.md` | AC1/AC2/AC3/AC13/AC15/AC16/AC17/AC19 rg | non-scope（runtime 反映は別 lane） |
| SPD-D2 catalog picker dialog 小節 | `02-component-catalog.md` | AC4/AC5/AC14/AC16 rg + reviewer 実読 | non-scope |
| SPD-D3 mockup-f | `reference/mockup-f-supplier-picker.html`、`reference/README.md` | AC6 rg | non-scope（mockup 視認は Human Gate、実機 L3 対象外） |
| SPD-D4 REQ-105 改訂 | `77-ui-bulk-price-revision.md` | AC7/AC18a rg | non-scope |
| SPD-D5 UI-01b-D21 改訂 + 3 実装事実訂正 | `51-ui-product-form.md` | AC8/AC18b rg + reviewer 実読 | non-scope |
| SPD-D6 SPEC-SUP-D2 改訂 | `78-ui-supplier-management.md` | AC9a/AC9b/AC18c rg | non-scope |
| SPD-D7 UI-02-D3（pending） | `61-ui-receiving.md` | AC-HumanGate | non-scope（Human Gate 回答待ち） |
| SPD-D8 CreateSupplierDialog 統合契約 | 本 packet「設計判断」節（runtime lane 申し送り） | reviewer 実読 | non-scope |
| S6 Plans.md 同期 | `Plans.md` | AC12 rg | — |
| 全体整合 | docs | AC11 `doc-consistency-check.sh --target plan` | — |
| Non-scope 遵守 | `src/**`・`decision-log.md`・`design-system/**`・`function-design/**` | AC10 `git diff --name-only` | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-09-supplier-picker-dialog-design.md](test-matrices/2026-09-09-supplier-picker-dialog-design.md)（R2 だが Coordinator 判断で必須化、上記「Risk」節参照）。
- Human Gate に L3 は含まない（docs-only、mockup 確認のみ）。

- targeted tests: 各 Scope 項目の rg exact-match presence oracle（AC1〜AC9b、AC13〜AC19）。
- negative tests: 新規 DSR-25 起草 0 件（AC3）、§78.12 の「検索、」除去（AC9a）、取引先管理への SupplierPickerDialog 誤適用 0 件（AC13）、旧記述の残置 0 件（AC18a/AC18b/AC18c）。
- compatibility checks: DSR-23 の ルール / Why / 具体例 が無変更（S1 で追記するのは「関連」行のみ）、`list_suppliers`/`createSupplier` の wire、UI-02-D3 本文（Human Gate (2) が (a) を選ばない限り）— いずれも本 commit の diff hunk に含まれないこと。
- data safety checks: 該当なし（DB 書込みなし）。
- main wiring/integration checks: 該当なし（route/DTO 変更なし）。`docs/Plans.md` ⑱ のリンクが本 packet basename と一致すること。

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（`list_suppliers`/`createSupplier` の wire は不変のまま、front 側の見た目のみを変更する設計）。

## Review Focus

- DSR-24 が DSR-01（1 画面 1 primary）・DSR-23（Select 統一）と矛盾なく読めるか、適用条件（追加導線の有無）が判定可能な粒度で書かれているか。
- dialog 重ねの契約が実装可能な粒度で書かれているか（(A) 推奨・(B) fallback の両方、focus trap / ESC / 外クリック伝播の期待挙動が literal に書かれ、実機未検証である旨が明記されているか）。
- owner 確定仕様（`docs/Plans.md` Backlog entry）からの逸脱がないか（検索 + scroll 一覧の箱・現在選択 ✓・枠外固定ボタン・外クリックで閉じる・一覧選択で閉じる・既存 `CreateSupplierDialog` をそのまま開く・REQ-105 toggle の残置）。
- `CreateSupplierDialog` の実装数が「2 実装」ではなく「3 実装」（`ProductForm.tsx` 内の独立 inline 実装を含む）と正しく訂正されているか。
- mockup 仕様が実機 3 画面（一括価格改定・商品登録/修正・取引先管理）+ A/B 2 状態と対応しているか。
- 入庫記録（61）が Human Gate (2) 未回答のまま確定事項として書かれていないか。
- runtime 申し送り（S5）が漏れなく Scope 外を吸収しているか（4 呼び出し元の置換順、front 側 filter 方針、AC-L3 の WebView2 実測義務）。
- `src/**` / `docs/decision-log.md` / `docs/design-system/**` / `docs/function-design/**` の変更が本 commit に混入していないか。

## Spec Contract

Contract ID: SPEC-SPD-1

- DSR-24（追加導線を伴う master 参照の picker dialog 統一）、catalog picker dialog 小節（dialog 重ね契約含む）、mockup-f 内容仕様、function-design 3 doc（77/51/78）の改訂 draft、61 の owner culling 3 案が本 packet に記録され、`src/**`・`docs/decision-log.md`・`docs/design-system/**`・`docs/function-design/**` は本 commit で無変更のまま。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-SPD-1 | S1 | AC1/AC2/AC3/AC13/AC15/AC16/AC17/AC19 rg | DSR-24 と DSR-01/DSR-23 の整合 | rg |
| SPEC-SPD-1 | S2 | AC4/AC5/AC14/AC16 rg + reviewer 実読 | picker dialog 小節・dialog 重ね契約 | rg / reviewer 実読 |
| SPEC-SPD-1 | S3 | AC6 rg | mockup-f 仕様・README 同期 | rg |
| SPEC-SPD-1 | S4 | AC7/AC8/AC9a/AC9b/AC18a/AC18b/AC18c rg | REQ-105 / UI-01b-D21 / SPEC-SUP-D2 改訂、3 実装事実訂正 | rg / reviewer 実読 |
| SPEC-SPD-1 | S5 | reviewer 実読 | runtime 申し送りの網羅性 | reviewer 実読 |
| SPEC-SPD-1 | S6 | AC12 rg | Plans.md 同期 | rg |
| SPEC-SPD-1 | 全体 | AC10/AC11 | Non-scope 遵守・doc gate | git diff / doc-consistency-check.sh |

## Data Safety

- what must not be committed: なし。
- local-only paths: 該当なし。
- synthetic-only paths: 該当なし。

## Implementation Results

未着手（Phase: implementing、Plan Commit `47b3a69`、Writer = Codex medium。docs + mockup の実装結果は Writer 報告を Coordinator が転記する）。

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

- Findings Freeze: 2026-09-09（Plan Review round 1〈Opus reject P1 2 / P2 7 / P3 4、Sonnet approve-with-P2 P2 2 / P3 2〉→ 是正 `ebb7945`、round 2〈Opus reject P1 2 / P2 3 / P3 3、Sonnet approve-with-P2 P1 1 / P3 1、いずれも round 1 是正が持ち込んだ新規欠陥〉→ 是正 `4b6ce65`、round 3 closure〈Opus approve、AC13 oracle の `-U` 誤記を本 commit で訂正〉）; post-freeze exceptions: none。
