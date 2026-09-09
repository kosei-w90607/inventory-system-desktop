# Plan Packet: 取引先ピッカー統合 dialog（design-first）

`docs/Plans.md` Backlog「取引先ピッカー統合 dialog（design-first、owner 案 2026-09-08）」（owner 確定仕様の正本）を design-system / function-design canonical docs へ規範化する。取引先 Select + inline「新しい取引先を追加」を 1 つの picker dialog（検索 + scroll 一覧 + 枠外固定の追加/閉じる）へ統合する DSR-24 を新設し、catalog ⑧ Dialog に小節を追加し、mockup を用意し、適用先 4 画面（一括価格改定 filter・商品登録/修正 form・入庫記録〈owner Human Gate (2) 確定 2026-09-10〉・取引先管理〈見た目のみ揃える〉）の function-design 改訂方針を確定する。**本 packet 自体は docs-only（Plan Packet + Test Design Matrix + `docs/Plans.md` の起票のみ）。design-system / function-design canonical docs 本体の改訂は Plan Gate 後、別 Writer（Codex）実装 commit が行う。**

## Workflow State

- Phase: archive
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: 47b3a69
- Amendments: ed4b058 6393def 8daaaa0 2104f2a
- Coordinator: Fable 5.1
- Writer: Codex
- Plan Reviewer: Sonnet + Opus
- Final Reviewer: Sonnet + Opus + Codex
- Reviewed Content HEAD: f4d8ad1
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required（docs-only だが Ready 後の hosted final は owner `workflow_dispatch` が必要。Ready 案内に明記する）
- Human Gate: owner mockup 確認 round 1 2026-09-10: culling (1) A / (2) 入庫記録 要（追加ボタン込み、オレンジ + ＋）/ (3) OK、(5) 二重 scrim、(6) footer OK + 現在の選択の固定帯（差別化条件付き）。→ Gated Amendment 3 + Codex 是正 33 → closure 3 → owner round 2 2026-09-10: 1 固定帯「見分けられる」OK / 2 追加ボタン「基本は良い、＋は寂しい」→ Plus icon SVG 化 / 3 選択列「浮かなくなった」OK / 4 状態 7「よさそう」OK / 5 採否注記「意図通り」OK。**round 3 は不要**（残変更は icon / 帯の小見出し / 6b の帯のみ、owner 希望があれば写しで確認）。→ Gated Amendment 4 → Codex 是正 34 → closure 4 → state-only → Ready。介入回数 = 2 / 5。

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
- mockup `mockup-f-supplier-picker.html` の内容仕様（3 画面分の起動状態 + 追加後の自動選択 A/B 2 枚 + dialog 重ねの二重 overlay 1 枚 + 入庫記録 1 枚、計 7 状態）が本 packet に記録されている。
- `docs/function-design/77-ui-bulk-price-revision.md`（REQ-105）/ `51-ui-product-form.md`（UI-01b-D21）/ `78-ui-supplier-management.md`（SPEC-SUP-D2、§78.12）/ `61-ui-receiving.md`（UI-02-D3、owner Human Gate (2) 回答 2026-09-10 で defer 解除・適用確定）の改訂文言 draft が本 packet に記録されている。
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
- ~~入庫記録（61）への適用可否の最終決定（Human Gate (2) 未回答のため本 commit では確定しない）。~~ owner Human Gate (2)（2026-09-10）で (a) 適用に確定済み（Gated Amendment 3、詳細は「設計判断」節）。

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
- **DSR-24 の適用条件**（下記「設計判断」）は「候補データが追加導線を伴う」ことを前提にしており、起票時点の入庫記録は UI-02-D3 の defer によりこの条件を満たしていなかった。owner が Human Gate (2)（2026-09-10）で defer 解除を確定したため、以降は入庫記録も DSR-24 の適用対象となる（詳細は「設計判断」節・S4 参照）。

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
> **Why**: DSR-23 は見た目の統一を目的にプルダウンを Select へ統一したが、追加導線が伴う候補では Select 自体に行を増やす手段が無く、画面ごとに inline パネル（`ProductForm.tsx`）・Select 横のボタン（`PriceRevisionFilters.tsx`）とバラバラな実装が並立してきた（`onCreated` の戻り値契約が file ごとに異なる — Supplier を返す / 返さない）。owner L3 所感（2026-09-08、`docs/Plans.md` Backlog entry）「追加である以上オレンジでは」「絞り込み列に登録操作が混ざる」は、Select 横に primary 色のボタンを並べる現行実装が、絞り込みの主動線と登録操作を同一視覚面で混同させていることを指す。dialog に閉じ込めることで、画面本体は選択操作だけに単純化され、追加操作は dialog を開いた後だけに現れる別の文脈になる。
>
> **判定フロー / 具体例**: DSR-01（1 画面 1 primary）は画面本体の主動線を変えず、dialog を開いている間だけ dialog 内の「追加の確定」ボタン 1 個を primary（amber）にすることで維持する（dialog を閉じれば画面には primary が戻らない）。適用例: 一括価格改定 filter・商品登録/修正 form・入庫記録（UI-02）（いずれも候補から 1 件を選ぶ操作を持つ）。非適用例: 部門フィルタ（`DepartmentFilter`、追加導線なし、Select のまま）。取引先管理は選択操作を持たないため DSR-24 非適用。一覧の見た目（検索 input + scroll 箱）だけ picker dialog と揃える（78 SPEC-SUP-D2、SPD-D6）。入庫記録は UI-02-D3 の defer を解除して適用（owner 判断 2026-09-10、取引先 80 件規模で Select からの選択負荷が高い）。
>
> **関連**: パターン⑧ Dialog / 確認（picker dialog 小節）、DSR-23（プルダウンは Select 統一、本 DSR はその例外条項）、DSR-01（1 画面 1 primary）。

新規 DSR-25 は起草しない（AC3 の negative oracle で保証）。

### catalog ⑧ Dialog「picker dialog」小節新設（`02-component-catalog.md`）

> **picker dialog（複数候補から 1 件選ぶ + 追加導線、DSR-24）**
>
> **使いどころ**: 取引先等、追加導線を伴う complete master data から 1 件を選ぶ場面（DSR-24 適用条件）。
>
> **canonical**: `SupplierPickerDialog`（後続実装、`src/features/suppliers/components/**` 配下を想定）。
>
> **構成**: ヘッダ（title、例:「取引先を選択」）+ 本体（名前検索 input、live・client-side filter — `list_suppliers` は無引数のため取得済み一覧をここで絞り込む — + 検索 input の下・scroll 箱の**外**に「現在の選択」の固定帯（内容 = 左に小見出し文字「現在の選択」〈`--muted`、帯内の他要素より小さいフォント〉+ 取引先名 + 「選択中」badge、背景 `--row-current`、下辺 `--border-strong`、一覧の行とは高さ・背景・境界で差別化し「流れない帯」と分かる見た目にする。小見出しがあることで現在行〈同じ `--row-current` 背景〉と役割の違いが伝わる。「すべての取引先」/「取引先なし」を選んでいればそれが帯に出る。一覧側の選択行にも ✓ + badge は残す）+ scroll 一覧（箱の見た目は商品一覧の表を流用、列見出しの「選択」文字は表示せず sr-only（読み上げ専用）にし列は ✓ + 「選択中」badge のみ、行に現在選択（DSR-22 の現在行 3 点: 左 4px primary バー + `--row-current` 背景 + ✓ と「選択中」badge / 文言。色だけに頼らない）、フィルタ文脈では先頭に「すべての取引先」行、入力文脈では先頭に既存 sentinel 相当の行〈「取引先なし」/「指定なし」〉を維持）+ footer（枠外固定、左「新しい取引先を追加（`Plus` icon 付き）」**primary（amber、inline SVG icon。全角「＋」文字は使わない）**・右「閉じる」outline）。一覧行クリック = 選択確定 + dialog を閉じる。footer は一覧の scroll と独立して常時固定表示する。picker dialog は独立した surface であり、その内部の主動線は追加ボタン 1 個。画面本体の主動線とは surface が異なるため 1 画面 1 主動線は維持される。`CreateSupplierDialog` 側の確定ボタンも同様に自 surface の主動線。
>
> **動作**: 外クリック / Esc = 「閉じる」と同じ（選択は変更しない、DSR-20 の硬化対象ではない通常 Dialog）。「新しい取引先を追加」→ 既存 `CreateSupplierDialog` をそのまま開く（owner 仕様）。追加成功後は一覧を再取得し、新規取引先を自動選択して両方の dialog を閉じる（owner 確定 2026-09-10、A 案）。picker は確認 Action を持たず（一覧行クリックが確定）、footer 左は別 surface を開く primary（追加の確定へ進む導線、amber）、右が dismiss。⑧ の **配置** bullet が定める Cancel 左 / Action 右 は確認 dialog の 2 ボタン規則であり、picker footer には適用しない。
>
> **dialog 重ね契約**（`CreateSupplierDialog` を picker dialog の上に開く）:
> - **(A) 推奨**: Radix `Dialog.Root` を picker dialog の内側でネストする。owner 仕様「既存 CreateSupplierDialog をそのまま開く」に文字面で忠実。両 dialog とも `z-50` の overlay を持ち、後着 dialog が DOM 順で後にマウントされ視覚的に手前へ来る。ESC は Radix `DismissableLayer` のスタック管理により最前面の dialog のみを閉じる想定、フォーカスは `CreateSupplierDialog` を閉じたあと picker dialog へ戻る想定。**本アプリに dialog-in-dialog の先例が無いため、これらは実機未検証の期待値であり、Windows WebView2 で ESC・外クリック伝播・focus trap を確認する（runtime lane の Windows WebView2 実機確認で検証する）**。内側 dialog の overlay は既定のまま（二重 scrim を許容、owner 確定 2026-09-10）とする（根拠: `src/components/ui/dialog.tsx` の `DialogOverlay` `bg-black/50` + `z-50`）。
> - **(B) fallback**: `MergeSupplierDialog`（単一 dialog 内 2-stage の既存先例）型の単一 dialog 内 2-stage（stage 1 = 一覧、stage 2 = 追加フォーム）。dialog を重ねないため WebView2 リスクを避けられるが、`CreateSupplierDialog` の実装（validation・toast・エラー表示）を picker dialog 内に複製することになり、owner 仕様「既存 CreateSupplierDialog をそのまま開く」との文字面が一致しない。(A) の実機確認で問題が出た場合のみ (B) に切替える。
>
> **状態**: 取得中 = Skeleton、取得失敗 = dialog 内 Alert（UI-01b-D8 の「取引先未指定なら保存可能」契約は不変）、検索 0 件 = `EmptyState`（⑥ の 0 件成功系統。⑥ の「絞り込み解除 action」は置かず、検索 input のクリアで代替する）。
>
> **a11y**: `DialogTitle` + `DialogDescription` を置く（⑧ アクセシビリティ節の `AlertDialogTitle` / `AlertDialogDescription` 規定を素の `Dialog` に拡張して適用）、open 時の初期 focus は検索 input（⑨ live 型と同じ、スキャナ入力を即受け付ける）、一覧選択または「閉じる」で閉じたら起動ボタンへ focus を戻す。`CreateSupplierDialog` を閉じたら picker の検索 input へ戻す。
>
> **Do**: 追加導線を伴う候補は本パターンに統一する（DSR-24）。footer の 2 ボタンを枠外固定にし、一覧の scroll と独立させる。
>
> **Don't**: Select 横に primary 色の追加ボタンを並べない（DSR-24 Why 参照）。追加導線を持たない候補（部門等）にまで本パターンを広げない。

### mockup `mockup-f-supplier-picker.html`（内容仕様、後続実装）

1 file に次の状態を並べる（`mockup-d-lists.html` の商品一覧の表の箱を流用）:

1. 一括価格改定 filter から開いた picker dialog（「すべての取引先」行あり、選択行に「選択中」badge）
2. 商品登録・修正 form から開いた picker dialog（先頭行「取引先なし」、「すべて」行は無し、選択行に「選択中」badge）
3. 取引先管理画面の検索 + scroll 一覧（picker dialog ではなくページ本体への埋め込み。既存 `SupplierUsageTable` に検索 input を追加し、箱を scroll 化した形。footer ボタンは無し — 選択して閉じる、という picker の用途ではないため）
4. 追加後の自動選択「あり」（新規取引先が一覧に反映され ✓ と「選択中」badge が付いた状態、**A 案（採用、owner 確定 2026-09-10）**）
5. 追加後の自動選択「なし」（新規取引先が一覧の末尾/該当位置に現れるが ✓ は付かず、利用者が改めてクリックする状態、**B 案（不採用、比較用に残す）**）
6. picker dialog を開いたまま `CreateSupplierDialog` を重ねて開いた状態（二重 overlay の見え方、owner に示す 2 variant。picker の背後に見える現在行にも同じ「選択中」badge を表示する — DSR-22 は全現在行に掛かるため）:
   - 6a. 内側 dialog の overlay を透過 `bg-transparent` にした variant（**不採用、比較用**）
   - 6b. 二重 scrim `bg-black/50` × 2 ≈ 75% 暗転にした variant（**採用、owner 確定 2026-09-10**）
7. 入庫記録から開いた picker（先頭「取引先なし」、footer 左「新しい取引先を追加」primary（`Plus` icon 付き）あり、現在の選択の固定帯あり。owner 判断 2026-09-10 で入庫記録にも適用）

検索 input の placeholder は入力例（例: `例: かえで糸店`）にする（⑨ アクセシビリティ節: placeholder は識別手段にしない）。「選択中」badge は `class="badge b-state"`（枠線 + 白背景、DSR-22 の「badge は枠線を必ず持つ」準拠）とする。`.b-state` は `mockup-d-lists.html:59` の 1 行（`border:1px solid var(--d-ctl);background:#fff;color:var(--fg)`）を移植し、`.b-class` は使用しないので削除する（未使用 CSS を残さない）。`.mark` 列は `width:64px` 固定をやめ `white-space:nowrap; width:1%`（内容幅）にして ✓ + badge が収まるようにする。列見出しは `<th><span class="sr-only">選択</span></th>`（`.sr-only` は 1 行定義）で視覚上は空、読み上げのみ「選択」を伝える（状態 1 / 2 / 4 / 5 / 6a / 6b / 7 の 7 箇所に適用）。「新しい取引先を追加」footer ボタンは `mockup-d-home-sales-admin.html:238` の primary button（`class="btn primary"`）+ inline SVG icon（16px、`Plus` 相当）の先例と同じ markup で描く（全角「＋」文字は使わない、owner round 2 所感 2026-09-10）。footer を持つ状態 1 / 2 / 4 / 5 / 6a / 6b / 7 の 7 箇所すべてに適用する。「現在の選択」固定帯（`class="current-band"`、左に小見出し `class="current-band-label"` `現在の選択`〈`--muted`〉+ 取引先名 + 「選択中」badge）は検索 input の下・scroll 箱の外に配置し、状態 1 / 2 / 4 / 6b / 7 の 5 箇所に置く（6a は不採用比較用のため帯なしのまま）。実機 render は Human Gate で owner が確認する。

### function-design 改訂方針（draft、後続 Writer が反映）

**`77-ui-bulk-price-revision.md`（REQ-105 / SPEC-PRV-D3）**: 「取引先の選択は取引先ピッカー dialog（`01-decision-rules.md` DSR-24）を経由する。『すべての取引先』行は一覧先頭に残し、『取引先未設定の商品も含める』toggle はフィルタ列に残置する（dialog 内へは移動しない）。」を追記する。

**`51-ui-product-form.md`（UI-01b-D21）**: 「取引先の選択は取引先ピッカー dialog（DSR-24）を経由し、『新しい取引先を追加』は picker dialog 内から既存 `CreateSupplierDialog`（`src/features/products/components/CreateSupplierDialog.tsx` を正、`onCreated: (supplier) => Promise<void>` 契約へ統合）を開く。現行の inline 常設パネル（`showSupplierInput` state、独立した 3 つ目の実装、起票時実測参照）は撤去し、trim・空文字拒否・同名衝突・失敗時入力保持の validation は `CreateSupplierDialog` に委譲する。」を追記する。

**`78-ui-supplier-management.md`（SPEC-SUP-D2 / §78.12）**: SPEC-SUP-D2 を「`/settings/suppliers` のシステム管理画面に、name 昇順一覧・usage 件数・「新しい取引先を追加」を置く。同画面に名前検索 input + scroll 一覧（取得済み一覧の client-side filter、箱の見た目は picker dialog と同じ、DSR-24）を併設する。」型へ縮めて改訂する（`/settings/suppliers` の 2 回目を削除、canonical の既存重複記載を是正）。あわせて §78.12 Deferred の「検索、任意並び替え、paging、bulk rename」から「検索、」を外し「任意並び替え、paging、bulk rename」を残す。

**`61-ui-receiving.md`（UI-02-D3、owner Human Gate (2) 確定 2026-09-10、(a) 採用）**: UI-02-D3 を「取引先欄は picker dialog + 『新しい取引先を追加』を経由する（DSR-24）。初回実装の defer は本 packet（⑱）で解除する。」へ改訂し、変更履歴に 1 行追加する。あわせて `§61.9 Test Focus` の UI-02-D3 行に「取引先欄は picker dialog 経由で選択・追加できる（検索 / 追加 / 自動選択で閉じる）」の観点 1 文を追加する（J6）。owner 原文: 「もちろん必要だぞ追加ボタンは」「要るよ流石に」「お互い必要で決着」「追加ボタンに関しては俺はオレンジボタンで＋マークもつけた追加ボタンにしてもいいと思ってるけどどう」（追加ボタンは picker dialog 共通の primary + inline SVG `Plus` icon 仕様〈H5、J1/J2 で自立化〉へ反映済み）。

owner culling 時に提示した 3 案（記録として残す）:
- (a) **要（picker dialog 適用、owner 採用）**: 入庫記録の取引先欄も picker dialog + 追加導線に統一する。Pros: 3 画面の見た目・操作が完全に揃う。Cons: UI-02-D3「inline 新規取引先作成は初回 UI-02 実装では扱わない」という**明示的な design decision を覆す**ことになり、本 packet（design-first の統一 dialog 提案）の範囲でその是非を判断する材料が無い（入庫記録固有の運用理由が UI-02-D3 に書かれていない一方、覆す積極的理由も owner 確定仕様には明記されていない）。→ owner 確定 2026-09-10「取引先 80 件規模で Select からの選択負荷が高い」ため採用。
- (b) 不要（現状維持、Coordinator 推奨、不採用）: 入庫記録の Select はそのまま。Pros: UI-02-D3 の defer 判断を尊重し、本 packet の範囲を「追加導線が既にある/既に要望されている 3 画面」に閉じられる。Cons: 4 画面中 1 画面だけ見た目が異なったまま残る。
- (c) 中間案（不採用）: 検索+scroll の見た目だけ揃え、追加導線は付けない。DSR-24 対象外のため個別 design 判断（取引先管理と同型の「見た目だけ揃える」）になるが、入庫記録は取引先管理と違い選択面そのものであり、追加導線のない picker 形だけを借りると DSR-24 の意図（追加導線の集約）から外れた見た目だけの改変になる。

UI-02-D3 の defer 上書きは本 Gated Amendment 3 で確定し、次の Codex 発注 33 で canonical へ反映する。

### 実装コンポーネント統合方針（runtime lane 申し送り）

`CreateSupplierDialog` は 3 実装（`products/` 版・`suppliers/` 版・`ProductForm.tsx` 内 inline）を `onCreated: (supplier: Supplier) => Promise<void>` 契約（`products/` 版）へ 1 本化する。`suppliers/` 版は `onCreated: () => Promise<void>` を `(supplier) => Promise<void>` へ拡張し、呼び出し元（`SupplierManagementPage.tsx`）は返り値を使わず再取得のみ行えばよい（後方互換）。

## Scope

- **S1 DSR-24 新設**: `01-decision-rules.md` に DSR-24（上記「設計判断」draft）を追加し、title を「DSR-01〜24」へ更新する。新規 DSR-25 は起草しない。DSR-23 の「関連」行末へ `DSR-24（追加導線 + 選択を伴う候補は picker dialog、本 DSR の例外）` を追記する（DSR-23 本文のルール / Why / 具体例は無変更）。`docs/design-system/README.md:13`（範囲表記 `DSR-01〜23`→`24` + トピック一覧に「DSR-24」を追記）と `docs/UI_TECH_STACK.md:403`（範囲表記 `DSR-01〜23`→`24`）を同期する。あわせて `docs/quality/review-checklist.md` カテゴリ 9 に DSR-24 対応のチェック行を 1 行追加する（先例 = DSR-23、AC11 に倣う登録）。`docs/UI_TECH_STACK.md` §7.4 更新履歴（`:823-830`）にも DSR-24 反映を記録する 1 行を追加する。
- **S2 catalog ⑧ picker dialog 小節**: `02-component-catalog.md` ⑧ Dialog / 確認に「picker dialog」小節（上記 draft）を追加する。Human Gate (1) 回答後、A/B いずれかへの確定・置換は本 commit の Scope に含めず Gated Amendment として扱う。あわせて既存 ⑧ の使いどころ（`:510`）へ 1 行拡張「加えて、選択・入力を画面から切り離して dialog に閉じる非確認 dialog も本節が扱う（picker dialog、DSR-24）」と、形式表（`:533-536`、形式 / 割込み度 / 用途 / 実装の 4 列）へ 1 行追加（`| **Dialog（非確認）** | 中（明示ボタンで開閉、確認は挟まない） | 候補選択・追加導線の集約。「取引先を選択」 | shadcn/ui \`Dialog\` |`）を行う。
- **S3 mockup**: `docs/design-system/reference/mockup-f-supplier-picker.html`（上記内容仕様、7 状態）を新規追加し、`reference/README.md` の一覧表に 1 行追加する。あわせて `reference/README.md` に欠落している `mockup-e-badge-cta-samples.html` の 1 行を補完し、末尾の系統説明（`:23` 「3 つの mockup-c と 7 つの mockup-d は…」）を mockup-e・mockup-f を含む文言へ更新する。
- **S4 function-design 改訂**: `77-ui-bulk-price-revision.md`（REQ-105）/ `51-ui-product-form.md`（UI-01b-D21）を上記 draft のとおり改訂し、`78-ui-supplier-management.md`（SPEC-SUP-D2 / §78.12）を上記 draft のとおり改訂する。`61-ui-receiving.md`（UI-02-D3）は owner Human Gate (2) 確定（2026-09-10、(a) 採用）により編集対象へ昇格し、上記 draft のとおり改訂する（変更履歴 1 行を含む）。改訂対象の本文節は file:line で以下のとおり: 77 `:89-95`（SPEC-PRV-D3 / D6 節の「取引先 filter に『新しい取引先を追加』を置き…」）、`:81`（command 表の「filter 内の『新しい取引先を追加』」→ picker dialog 経由の表現へ）/ 51 `:21`（UI-01b-D7）、`:149-156`（取引先 inline 追加節）、`:210`（テスト観点）/ 78 `:28`（SPEC-SUP-D2）、`:60`（§78.3 画面構成の「URL search state、paging は持たない」文へ「名前検索は取得済み一覧の client-side filter、全件取得維持」を追記。Coordinator 裁定は §78.6 と記載していたが実測では §78.3 画面構成、rg で実証済み）、`:149`（78.11 テスト観点に検索を追加）、`:161`（§78.12 から検索を外す）/ 61 `:23`（UI-02-D3、「初回 UI-02 実装では扱わない」の defer 解除）、`:151`（§61.9 Test Focus の UI-02-D3 行に「picker dialog 経由」観点を追加）。入庫記録（`ReceivingPage.tsx:399-421`）は S5 の 4 呼び出し元置換で「適用対象」へ格上げする。
- **S5 runtime lane への申し送り**（本 packet 内、Non-scope の直後の節に記載、次の Writer 実装 commit の Scope 外だが再利用対象）: `CreateSupplierDialog` 3 実装の統合契約 / 4 呼び出し元の置換順（一括価格改定 filter・商品登録/修正 form・取引先管理・入庫記録〈`ReceivingPage.tsx:399-421`、owner Human Gate (2) 確定 2026-09-10 で全 4 画面が適用対象〉）/ front 側 filter の実装方針（`list_suppliers` 無引数のまま、client-side filter）/ dialog 重ね (A) の WebView2 実測義務（AC-L3）/ DSR-01 の stale citation は 2 箇所（`ProductForm.tsx:343` → 実測 `:387`〈「追加する」〉、トグル「新しい取引先を追加」の実体は `:331`／`ProductForm.tsx:481` → 実測 `:496`〈「登録する / 保存する」〉）、いずれも inline パネル撤去時に自然解消 / ⑰ merge 後、catalog `:544` 側へ『（確認 dialog の 2 ボタン）』の限定語を足す。
- **S6 Plans.md 同期**: 「次の行動」に ⑱ 行を追加し、Backlog の関連 2 entry に起票済み注記を付ける（本 commit で直接実施）。

## Non-scope

- `SupplierPickerDialog` の実装、`CreateSupplierDialog` 3 実装の統合実装、4 呼び出し元の置換（runtime lane、別 packet）。
- `01-decision-rules.md` / `02-component-catalog.md` / `docs/function-design/77,51,78,61` の実際の編集（本 commit では draft を本 packet に記録するのみ。Plan Gate 後、別 Writer 実装 commit が反映する）。
- `mockup-f-supplier-picker.html` の HTML 実体作成（後続 Writer 実装 commit）。
- Windows native L3 実機確認（dialog 重ねの focus trap / ESC / 外クリック伝播、runtime lane AC-L3）。
- `⑰ 表示小修正 batch`（同時進行、`docs/Plans.md` Backlog「表示小修正 lane」。⑰ 実体 = branch `agent/ui-display-fixes-batch`、Draft PR #48、plan-first commit `743ba68`、同時起票、Plans.md 行は当該 branch 側にある）: catalog ⑧ Dialog 節の footprint overlap に注意する。⑰ は既存 `RenameSupplierRow.tsx` の footer ボタン順是正（Cancel 左 / Action 右への入替）で catalog `:544`（`**配置**` bullet）直後、比較用 variant `:560` の手前へ 1 行追記する見込み、本 packet（⑱）は「picker dialog」小節（比較用 variant の後、⑧ セクション末尾）に加え使いどころ（`:510`）・形式表（`:535`）へも手を入れる見込みで、editing する行範囲は重ならない想定だが、**merge 順は ⑰ 先を前提に書く**（後に merge する側が origin/main を単段 merge して自身の rg oracle を再実行する）。群 2 の是正で ⑧ 使いどころ `:510` / 形式表 `:535` / `:544` 付近に手が入るため、⑰（`:544` 直後 1 行追記）との textual conflict 可能性が上がる。merge 順は ⑰ 先を維持し、⑱ 側で origin/main 単段 merge 時に両側保持で解消する。
- 記録状態 Badge tone・単位拡張・フィルタ Label 上置き統一 等、`docs/Plans.md` Backlog の他 design-first 候補（本 packet と無関係）。

## Acceptance Criteria

以下は**次の Writer 実装 commit**（design-system / function-design canonical docs 本体の改訂）が満たすべき AC であり、本 plan-first commit では baseline（現状 0 件、個別に注記したものを除く）を確認済みの anchor として記録する。本 plan-first commit 自体の AC は AC10〜AC12。AC13〜AC33（round 1/round 2/Gated Amendment 1/2/3/4 是正で追加）も次の Writer 実装 commit が満たすべき forward AC であり、本 plan-first commit ではやはり baseline のみを確認する。

- AC1: `rg -c "^## DSR-24" docs/design-system/01-decision-rules.md` ≥ 1（baseline 0 確認済み）。DSR-24 が新設されている。
- AC2: `rg -c "^# 判断ルール集（DSR-01〜24）" docs/design-system/01-decision-rules.md` = 1（baseline 0 確認済み、`〜` は U+301C wave dash。見出し行 anchor に限定し更新履歴表等の本文中の同一文言に釣られない）。title が更新されている。
- AC3: `rg -c "^## DSR-25" docs/design-system/01-decision-rules.md` = 0。新規 DSR を誤って複数起草していないことの negative oracle。
- AC4: `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -Fc "picker dialog"` ≥ 1（baseline 0 確認済み、更新履歴表の同一文言に釣られないよう本文範囲に限定）。picker dialog 小節が追加されている。
- AC5: `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -Fc "focus trap"` ≥ 1（baseline 0 確認済み）かつ reviewer 実読で (A) 推奨 / (B) fallback の両方が書かれ、(A) の WebView2 実機確認義務が明記されていることを確認。owner Human Gate (1) 確定（2026-09-10、A 案）後は `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -c '自動選択.*Human Gate \(1\)'` = 0（baseline 1 確認済み。未確定文の残存禁止 negative oracle、旧「≥ 1」から反転）かつ `rg -Fc "自動選択して両方の dialog を閉じる（owner 確定" docs/design-system/02-component-catalog.md` ≥ 1（baseline 0 確認済み）。
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
- AC18d（A4、77 command 表の旧配置）: `rg -Fc "filter 内の「新しい取引先を追加」" docs/function-design/77-ui-bulk-price-revision.md` = 0（baseline 1 確認済み、`:81`）。
- AC20（A1、canonical の packet 内部参照の自立化、A16 で範囲拡張、J5 で節限定・個別実行に訂正）: catalog 側と DSR 側を **個別に 2 回**実行する（multi-file awk は `exit` が全 file を止めるため round 2 の再実測で誤検出済み、以後採用しない）。
  - `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md | rg -c "Contract Probe|起票時実測参照|起票時実測「|catalog には|Human Gate \(2\) で覆されない限り"` = 0（baseline 0 実測確認済み）。
  - `awk '/^## DSR-24/,/^## DSR-25|^## 更新履歴/' docs/design-system/01-decision-rules.md | rg -c "Contract Probe|起票時実測参照|起票時実測「|catalog には|Human Gate \(2\) で覆されない限り"` = 0（baseline 0 実測確認済み、DSR-24 節〜次見出し/更新履歴の直前までに限定し、無関係な DSR-17/18 節の「Contract Probe」〈`:294`/`:322`〉を誤検出しないようにする）。
  - canonical が本 packet の内部節構造・archive 後に壊れる語へ依存していないことの negative oracle。
- AC21（A2、DSR-22 現在行 3 点）: `awk '/^\*\*picker dialog/{f=1} f{print} f&&/^---$/{exit}' docs/design-system/02-component-catalog.md | rg -Fc "DSR-22"` ≥ 1（baseline 0 確認済み、picker dialog 小節を `**picker dialog` 開始 〜 直後の `---` 区切りで限定）。
- AC22（A2/A10/A11、mockup「選択中」可視 badge、A10 で硬化）: `rg -c 'class="badge b-state">選択中' docs/design-system/reference/mockup-f-supplier-picker.html` ≥ 5（baseline 0 実測。状態 1 / 2 / 4 / 6a / 6b の 5 箇所に可視 badge が要る）かつ `rg -c '\.b-class' docs/design-system/reference/mockup-f-supplier-picker.html` = 0（baseline 1 実測。`.b-class` は使用しないため negative oracle）。旧オラクル（`rg -Fc "選択中"` ≥ 3）は `aria-label` 属性値だけで満たせてしまう既知の弱点があったため、可視 class 付き literal へ強化した（round Gated Amendment 2）。
- AC25（A13、78 の DSR-24 参照復元）: `rg -Fc "DSR-24" docs/function-design/78-ui-supplier-management.md` ≥ 1（baseline 0 確認済み）。SPEC-SUP-D2 の改訂文が picker dialog との箱の見た目一致を DSR-24 引用付きで記録している。
- AC23（A3、状態と a11y）: `awk '/^\*\*picker dialog/{f=1} f{print} f&&/^---$/{exit}' docs/design-system/02-component-catalog.md | rg -c "DialogDescription"` ≥ 1（baseline 0 確認済み）かつ同範囲で `rg -c "EmptyState"` ≥ 1（baseline 0 確認済み）。
- AC24（A8、78 §78.3 client-side filter）: `rg -Fc "client-side filter" docs/function-design/78-ui-supplier-management.md` ≥ 1（baseline 1 確認済み、`:60`。既に Writer が正しく編集済みのため forward AC としては既に充足しているが、次回改訂で誤って消されないための回帰防止 oracle として記録する）。
- AC16c（A9、UI_TECH_STACK 更新履歴）: `rg -c "^\| 2026-09-" docs/UI_TECH_STACK.md` ≥ 1（baseline 0 確認済み。§7.4 更新履歴表は現状 `2026-08-03`/`2026-07-23`/`2026-04-16` の 3 行のみで `2026-09-` 行が無い）。
- AC26（H3、61 の picker dialog 適用）: `rg -Fc "picker dialog" docs/function-design/61-ui-receiving.md` ≥ 1（baseline 0 確認済み）かつ `rg -Fc "初回 UI-02 実装では扱わない" docs/function-design/61-ui-receiving.md` = 0（baseline 1 確認済み、`:23`）。UI-02-D3 の defer 解除が反映され、旧 defer 文言が残置されていない。
- AC27（H3、mockup 状態数 7）: `rg -c '<section id="state-' docs/design-system/reference/mockup-f-supplier-picker.html` ≥ 7（baseline 6 確認済み。`<section id="state-N"><h2>` の state 見出しパターンで数える。生の `<h2>` は各状態内の dialog title 等と重複計上されるため不採用）。
- AC28（H4、列見出し sr-only）: `rg -c 'class="sr-only">選択' docs/design-system/reference/mockup-f-supplier-picker.html` ≥ 6（baseline 0 確認済み。状態 1 / 2 / 4 / 5 / 6b / 7 の 6 箇所）。
- AC29a（H5、J2 で literal 訂正、追加ボタン primary literal）: `awk '/^\*\*picker dialog/{f=1} f{print} f&&/^---$/{exit}' docs/design-system/02-component-catalog.md | rg -Fc "新しい取引先を追加（\`Plus\` icon 付き）"` ≥ 1（baseline 0 確認済み。旧 literal「＋ 新しい取引先を追加」は J2 により置換、全角「＋」は不採用）。
- AC29b（J2、mockup の primary button + inline SVG icon、状態数を 7 へ訂正）: `rg -c 'class="btn primary"' docs/design-system/reference/mockup-f-supplier-picker.html` ≥ 7 かつ footer 内 SVG `rg -c 'class="picker-footer".*<svg' docs/design-system/reference/mockup-f-supplier-picker.html` ≥ 7（baseline: primary 実測 10〈footer 7 + state-3 管理画面 1 + create-footer「追加する」2、Coordinator 想定の 7 は footer 限定と判明〉/ footer 内 svg 実測 0。footer button の対象は状態 1 / 2 / 4 / 5 / 6a / 6b / 7 の 7 箇所〈旧 round 3 の AC29 は 6a を数え漏れて 6 箇所としていた誤りを訂正〉）。
- AC30（H6/J3、現在の選択の固定帯、6b を追加）: `rg -c 'class="current-band"' docs/design-system/reference/mockup-f-supplier-picker.html` ≥ 5（baseline 4 実測。状態 1 / 2 / 4 / 7 は実装済み、6b が未実装で対象、6a と 5 は帯なしのまま）。
- AC31（J1、footer secondary の旧語残置）: `awk '/^\*\*picker dialog/{f=1} f{print} f&&/^---$/{exit}' docs/design-system/02-component-catalog.md | rg -c "secondary"` = 0（baseline 1 実測確認済み）。footer 左ボタンが secondary のまま記述されていないことの negative oracle。
- AC32（J4、固定帯の小見出しラベル）: `rg -c '現在の選択' docs/design-system/reference/mockup-f-supplier-picker.html` ≥ 5（baseline 5 実測 — ただし内訳は `current-band-label` span 4 件〈状態 1/2/4/7〉+ state-7 の lead 文中の地の文 1 件で、6b 追加後の期待値 5 件〈band 5 + lead 文言次第で 6 件〉と机上で一致するとは限らない。reviewer 実読で `current-band-label` の実件数〈AC30 と同数であるべき〉を確認する）。
- AC33（J6、61 §61.9 テスト観点）: `rg -Fc "picker dialog 経由" docs/function-design/61-ui-receiving.md` ≥ 1（baseline 0 実測確認済み、§61.9 Test Focus は `:151`）。
- AC-HumanGate: owner mockup 確認 round 1（2026-09-10、`e42f27d`）で (1) 状態 1〜3 の見た目 / (2) 自動選択 A 案 / (3) 入庫記録 要 / (4) 取引先管理の見た目 / (5) overlay 二重 scrim / (6) footer・固定帯 を culling 済み、round 2（2026-09-10、`e4c815b`）で 1 固定帯 / 2 追加ボタン（Plus icon 化を指示）/ 3 選択列 sr-only / 4 状態 7 / 5 採否注記 を確認済み（原文は Human Gate 欄・Review Response 参照）。**owner round 3 は不要**（Coordinator 判断、残変更は icon / 帯の小見出し / 6b の帯のみで owner 希望があれば写しで確認）。

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
| owner Backlog entry | `01-decision-rules.md`（新設） | SPD-D1 | DSR-23 の Select 統一を全面撤回せず、追加導線の有無で例外条項として切り出す（DSR-23 の ルール / Why / 具体例 は無変更、「関連」行末へ DSR-24 への相互参照のみ追記）。適用条件を明文化し、部門等の非対象を明示 | `01-decision-rules.md` | AC1/AC2/AC3/AC13/AC15/AC16/AC16c/AC17/AC19 |
| owner Backlog entry | `02-component-catalog.md` ⑧（既存 Dialog 節の拡張） | SPD-D2 | 独立した新セクションを作る代替は⑧ Dialog / 確認との重複が大きいため、既存⑧の比較用 variant と並ぶ小節として追加する | `02-component-catalog.md` | AC4/AC5/AC14/AC16/AC20/AC21/AC23/AC29a/AC29b/AC31 + reviewer 実読 |
| owner Backlog entry | mockup（新設） | SPD-D3 | 既存 mockup-d-lists.html の商品一覧の箱を流用し、新規 CSS 系統を増やさない | `reference/mockup-f-supplier-picker.html`、`reference/README.md` | AC6/AC22/AC27/AC28/AC29b/AC30/AC32 |
| REQ-105 | `77-ui-bulk-price-revision.md` | SPD-D4 | 「取引先未設定の商品も含める」toggle を dialog 内へ移動する代替は owner 確定仕様（filter 列に残す）と矛盾するため不採用 | `77-ui-bulk-price-revision.md` | AC7/AC18a/AC18d |
| REQ-106 / UI-01b-D21 | `51-ui-product-form.md` | SPD-D5 | `ProductForm.tsx` の独立 3 つ目の inline 実装をそのまま残す代替は DSR-24 の目的（実装の乱立解消）に反するため、既存 `CreateSupplierDialog`（`products/` 版）契約への統合を明記 | `51-ui-product-form.md` | AC8/AC18b |
| SPEC-SUP-D2 | `78-ui-supplier-management.md` | SPD-D6 | 検索を別画面（専用一覧 route）に切り出す代替は SPEC-SUP-D2 が単一画面運用を前提にしているため不採用、既存画面内への検索追加を選ぶ | `78-ui-supplier-management.md` | AC9a/AC9b/AC18c/AC24/AC25 |
| UI-02-D3 | `61-ui-receiving.md` | SPD-D7 | owner culling 3 案を提示し Coordinator は (b) 不要を推奨したが、owner が (a) 要（取引先 80 件規模で Select からの選択負荷が高い）を Human Gate (2) で確定（2026-09-10）。defer 解除は owner 判断のため無断上書きではない | `61-ui-receiving.md` | AC26/AC33 |
| owner Backlog entry | 本 packet「設計判断」節 | SPD-D8 | `CreateSupplierDialog` 3 実装の統合契約を先に決めておくことで、次の Writer 実装 commit が呼び出し元置換のたびに個別判断しなくて済む | runtime lane（別 packet） | 該当なし（review-only） |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: DSR-24 の draft・catalog picker dialog 小節の draft はいずれも Why・適用条件・reject した代替（(B) fallback）を明記しており、次の Writer 実装 commit がそのまま canonical docs へ転記できる。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: DSR-24（新設）・picker dialog パターン・`CreateSupplierDialog` 統合契約は次の実装 commit で design-system / function-design docs へ昇格予定（本 commit では未反映）。新規 decision-log entry は不要（既存 DSR/catalog 体系の拡張の範囲内）。
- Assumptions and constraints: dialog 重ねの (A) 推奨は Radix の一般的なスタック管理挙動を前提にした**未検証の外部前提**であり、Contract Probe 節・runtime lane AC-L3 でのみ確定する。
- Deferred design gaps, risk, and follow-up target: 追加後の自動選択 A/B・入庫記録への適用・取引先管理・状態 7・固定帯・ボタン・sr-only 見出しの実機の見た目は owner Human Gate round 1〜2（2026-09-10）で確定済み、round 3 は不要（Coordinator 判断）。dialog 重ねの実機挙動は runtime lane 実装後の L3 待ち。
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-09-supplier-picker-dialog-design.md) 各行に SPD-D 番号を付す）。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 唯一の例外は dialog 重ねの実機挙動（Contract Probe で N/A + runtime lane 申し送りとして明記、下記）。状態 7 / 固定帯 / ボタン / sr-only 見出し・入庫記録（61）の適用可否は owner Human Gate round 1〜2（2026-09-10）で確定済み、round 3 不要（Coordinator 判断）。他は全て機械 oracle 化できている。抜け道なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — docs-only、backend/DTO 変更なし | — |
| Fact check / design decision split | 適用: 発注前提「`CreateSupplierDialog` 2 実装並存」は実測で誤り（`ProductForm.tsx` は独立 3 つ目の inline 実装を持ち、どちらの `CreateSupplierDialog` も import しない）と判明し訂正した | 本 packet「起票時実測」節・「設計判断」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 取引先選択は 4 画面の主動線に影響する。runtime 反映は別 packet だが、UI-02-D3（入庫記録の inline 追加 defer）という既存 operator workflow 決定は Human Gate (2) で owner が明示的に解除した（2026-09-10、取引先 80 件規模で Select からの選択負荷が高い） | AC-HumanGate |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし。ただし後続 runtime lane は `src/**` 4 file 相当の改修を伴い R3 相当になり得る旨を明記（Risk 節参照） | 次の runtime lane packet |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner が mockup 上で round 1（自動選択 A/B・入庫記録適用・overlay・footer）+ round 2（取引先管理見た目・状態 7・固定帯・ボタン・sr-only 見出し）を culling 済み。round 3 は不要（Coordinator 判断、残変更は icon / 帯の小見出し / 6b の帯のみ）。dialog 重ねの実機（Windows WebView2）確認は本 packet の対象外で runtime lane の AC-L3 が担う | Human Gate、runtime lane AC-L3 |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: DSR-23（Select 統一）・catalog ⑧ Dialog（既存比較用 variant、`MergeSupplierDialog` 先例）の構造が既に存在し、本 packet は例外条項（DSR-24）と小節の新設で足りる。
- Source docs updated in this PR: なし（本 commit では `01-decision-rules.md` / `02-component-catalog.md` / `docs/function-design/**` を編集しない。draft のみ本 packet に記録）。
- Design gaps intentionally deferred: 追加後の自動選択 A/B・入庫記録への適用・取引先管理・状態 7・固定帯等の見た目は owner Human Gate round 1〜2 で確定済み、round 3 不要。dialog 重ねの実機挙動（runtime lane AC-L3）。
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
| SPD-D1 DSR-24 新設 | `01-decision-rules.md` | AC1/AC2/AC3/AC13/AC15/AC16/AC16c/AC17/AC19 rg | non-scope（runtime 反映は別 lane） |
| SPD-D2 catalog picker dialog 小節 | `02-component-catalog.md` | AC4/AC5/AC14/AC16/AC20/AC21/AC23/AC29a/AC29b/AC31 rg + reviewer 実読 | non-scope |
| SPD-D3 mockup-f | `reference/mockup-f-supplier-picker.html`、`reference/README.md` | AC6/AC22/AC27/AC28/AC29b/AC30/AC32 rg | non-scope（mockup 視認は Human Gate、実機 L3 対象外） |
| SPD-D4 REQ-105 改訂 | `77-ui-bulk-price-revision.md` | AC7/AC18a/AC18d rg | non-scope |
| SPD-D5 UI-01b-D21 改訂 + 3 実装事実訂正 | `51-ui-product-form.md` | AC8/AC18b rg + reviewer 実読 | non-scope |
| SPD-D6 SPEC-SUP-D2 改訂 | `78-ui-supplier-management.md` | AC9a/AC9b/AC18c/AC24/AC25 rg | non-scope |
| SPD-D7 UI-02-D3（owner Human Gate (2) 確定 2026-09-10） | `61-ui-receiving.md` | AC26/AC33 rg | non-scope（canonical 反映は次の Codex 発注 33） |
| SPD-D8 CreateSupplierDialog 統合契約 | 本 packet「設計判断」節（runtime lane 申し送り） | reviewer 実読 | non-scope |
| S6 Plans.md 同期 | `Plans.md` | AC12 rg | — |
| 全体整合 | docs | AC11 `doc-consistency-check.sh --target plan` | — |
| Non-scope 遵守 | `src/**`・`decision-log.md`・`design-system/**`・`function-design/**` | AC10 `git diff --name-only` | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-09-supplier-picker-dialog-design.md](test-matrices/2026-09-09-supplier-picker-dialog-design.md)（R2 だが Coordinator 判断で必須化、上記「Risk」節参照）。
- Human Gate に L3 は含まない（docs-only、mockup 確認のみ）。

- targeted tests: 各 Scope 項目の rg exact-match presence oracle（AC1〜AC9b、AC13〜AC33）。
- negative tests: 新規 DSR-25 起草 0 件（AC3）、§78.12 の「検索、」除去（AC9a）、取引先管理への SupplierPickerDialog 誤適用 0 件（AC13）、旧記述の残置 0 件（AC18a/AC18b/AC18c）。
- compatibility checks: DSR-23 の ルール / Why / 具体例 が無変更（S1 で追記するのは「関連」行のみ）、`list_suppliers`/`createSupplier` の wire — いずれも本 commit の diff hunk に含まれないこと。61 UI-02-D3 の defer 解除は owner 判断（Human Gate (2)、2026-09-10）に基づく契約変更であり、runtime lane で入庫記録の取引先欄が picker dialog に変わる旨を申し送る（S5 参照）。
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
- 入庫記録（61）の適用確定が owner Human Gate (2) 回答（2026-09-10、原文引用）に基づいて正確に転記されているか。
- runtime 申し送り（S5）が漏れなく Scope 外を吸収しているか（4 呼び出し元の置換順、front 側 filter 方針、AC-L3 の WebView2 実測義務）。
- `src/**` / `docs/decision-log.md` / `docs/design-system/**` / `docs/function-design/**` の変更が本 commit に混入していないか。

## Spec Contract

Contract ID: SPEC-SPD-1

- DSR-24（追加導線を伴う master 参照の picker dialog 統一、入庫記録含む）、catalog picker dialog 小節（dialog 重ね契約含む）、mockup-f 内容仕様（7 状態）、function-design 4 doc（77/51/78/61）の改訂 draft が本 packet に記録され、`src/**`・`docs/decision-log.md`・`docs/design-system/**`・`docs/function-design/**` は本 commit で無変更のまま。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-SPD-1 | S1 | AC1/AC2/AC3/AC13/AC15/AC16/AC16c/AC17/AC19 rg | DSR-24 と DSR-01/DSR-23 の整合 | rg |
| SPEC-SPD-1 | S2 | AC4/AC5/AC14/AC16/AC20/AC21/AC23/AC29a/AC29b/AC31 rg + reviewer 実読 | picker dialog 小節・dialog 重ね契約 | rg / reviewer 実読 |
| SPEC-SPD-1 | S3 | AC6/AC22/AC27/AC28/AC29b/AC30/AC32 rg | mockup-f 仕様・README 同期 | rg |
| SPEC-SPD-1 | S4 | AC7/AC8/AC9a/AC9b/AC18a/AC18b/AC18c/AC18d/AC24/AC25/AC26/AC27/AC33 rg | REQ-105 / UI-01b-D21 / SPEC-SUP-D2 改訂、3 実装事実訂正 | rg / reviewer 実読 |
| SPEC-SPD-1 | S5 | reviewer 実読 | runtime 申し送りの網羅性 | reviewer 実読 |
| SPEC-SPD-1 | S6 | AC12 rg | Plans.md 同期 | rg |
| SPEC-SPD-1 | 全体 | AC10/AC11 | Non-scope 遵守・doc gate | git diff / doc-consistency-check.sh |

## Data Safety

- what must not be committed: なし。
- local-only paths: 該当なし。
- synthetic-only paths: 該当なし。

## Implementation Results

Codex Writer（medium）: 実装 `a67df7b` `1056306` `f7bf903`（S1〜S4、10 file、commands 55 / 手戻り 2、fail-closed 停止 2 = 発注書側欠陥）→ Final Review round 1（Sonnet approve / Opus approve-with-P2 3 / Codex 5157577845 Freeze 可）→ Gated Amendment 1 `ed4b058` → 是正 `a797f6e` `d9ff5e6` `014367c`（F1〜F8、commands 20）→ closure（Sonnet approve / Opus approve-with-P2〈裸 badge〉/ Codex 5157960119 closure 可）→ Gated Amendment 2 `6393def` → 是正 `e42f27d`（badge `b-state` / 6a・6b / 列幅 / 78 DSR-24 / ⑧⑥ 射程、commands 31）→ closure 2 approve ×2 → origin/main `344e222` 単段 merge `a0055f5`（Plans.md 両側保持）→ owner Human Gate round 1（A 案 / 二重 scrim / 入庫記録に適用〈61 defer 解除〉/ 選択見出し / 追加ボタン primary / 固定帯）→ Gated Amendment 3 `8daaaa0` → 是正 `e4c815b`（commands 27）→ closure 3（Sonnet approve-with-P2 / Opus reject P2 1 = `secondary` 旧語）+ owner round 2（全 OK、icon 化）→ Gated Amendment 4 `2104f2a` → 是正 `f4d8ad1`（`Plus` SVG / 6b 固定帯 / 帯の小見出し / 61 §61.9、commands 32）→ closure 4 approve ×2（P2 0、P3 3 = stale 注記 + 空白）→ 本 commit で docs 同期 + Ready 遷移。AC1〜AC33 全 PASS（AC10 対象外）。Reviewed Content HEAD `f4d8ad1`、Amendments 4 本、Human Gate 介入 2 / 5。

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

- Findings Freeze: 2026-09-09（Plan Review round 1〈Opus reject P1 2 / P2 7 / P3 4、Sonnet approve-with-P2 P2 2 / P3 2〉→ 是正 `ebb7945`、round 2〈Opus reject P1 2 / P2 3 / P3 3、Sonnet approve-with-P2 P1 1 / P3 1、いずれも round 1 是正が持ち込んだ新規欠陥〉→ 是正 `4b6ce65`、round 3 closure〈Opus approve、AC13 oracle の `-U` 誤記を本 commit で訂正〉）; post-freeze exceptions: none。
- Final Review round 1（Reviewed Content `f7bf903`、2026-09-10）: Sonnet approve（P3 1）/ Opus design approve-with-P2（P2 3 / P3 5、転記は byte 一致）/ Codex review 5157577845 Freeze 可（P1 1〈統合〉/ P2 2 / P3 1、commands 30）→ Coordinator 裁定 accept 9（A1〜A9）/ no-action 3 → Gated Amendment 1 → Codex 是正発注 30 → closure。
- no-action（記録のみ）: Codex #1 Plans.md 衝突 = 統合ラベル（merge 順 ⑰ 先で両側保持、catalog は clean auto-merge を Sonnet / Opus / Codex 3 者が実測）/ Opus P3-5 footer 右「閉じる」の意味反転と「すべての取引先」行が非 sticky は owner 確定仕様どおり、Human Gate の口頭観測項目に追加済み / Sonnet P3 発注書の衝突予測精度は Coordinator 側の教訓として記録。
- closure（Reviewed Content `014367c`、2026-09-10）: Sonnet approve / Opus approve-with-P2（P2-N1 裸 badge、P3-N1〜N5）/ Codex 5157960119 closure 可（P3 AC20 範囲、commands 26）→ 裁定 accept 7（A10〜A16）→ Gated Amendment 2 = 本 commit → Codex 是正発注 32 → Sonnet + Opus closure 2（Codex closure は不要、docs 差分が mockup + 3 行のため Coordinator 判断で省略）。Sonnet closure が裸 badge（`.badge` のみで `.b-state` 等の tone class を伴わない可視性欠如）を見逃した事実も記録（reviewer 独立性の記録、Opus P2-N1 が実証で拾った）。
- owner Human Gate round 1（2026-09-10 03:30 頃、mockup `e42f27d` を実機 3 画面と並べて確認、原文引用）:
  - (1) 状態 1〜3: 「まさにこれだね、右端の選択という列タイトルが取引先名と比べて浮いてるように見えるけども」
  - (2) 自動選択: 「A案」
  - (3) 入庫記録: 「もちろん必要だぞ追加ボタンは」「要るよ流石に」「お互い必要で決着」「追加ボタンに関しては俺はオレンジボタンで＋マークもつけた追加ボタンにしてもいいと思ってるけどどう」
  - (4) 取引先管理: 「商品一覧の表と揃って見える」
  - (5) overlay: 「二重 scrim 許容」
  - (6) footer: 「閉じるって基本往々にして右下だからこれはこれで良さそうに思う」/「すべての取引先」行: 「現在選択中のやつは枠の上に固定しとくと流れずに済むよね」「採用してもいいけど、固定は一覧の流れていくやつとは差別化した分かりやすい見せ方しないと微妙な見た目になる」
  - 裁定 H1〜H7（A 案確定 / 二重 scrim確定 / 入庫記録に適用〈61 defer 解除〉/ 選択見出し sr-only / 追加ボタン primary + Plus / 現在の選択の固定帯 / (4)(6) は変更なしで記録）→ Gated Amendment 3 = 本 commit → Codex 是正発注 33 → owner 再確認 round 2（状態 7 / 固定帯 / ボタン / sr-only 見出しの見た目）→ Ready。
- closure 3（Reviewed Content `e42f27d`、2026-09-10）: Sonnet approve-with-P2 / Opus reject P2 1（裸 「＋」文字が primary button デザインとして寂しい、SVG icon 化を要求）→ 裁定 accept 7（J1〜J7）/ no-action 1。
- owner Human Gate round 2（2026-09-10 04:10 頃、mockup `e4c815b` を確認、原文引用）:
  1. 固定帯: 「見分けられる」
  2. 追加ボタン: 「基本は良い、この取引先追加ボタンもそうだけど＋じゃボタンデザインとして寂しいかな？商品登録ボタンだとアイコン付けたりしてるし」
  3. 選択列: 「浮かなくなったね」
  4. 状態 7: 「よさそう」
  5. 採否注記: 「意図通りだな」
  - 介入 2 / 5。
  - 裁定 J1〜J7（footer 左ボタンを primary へ訂正 / 全角「＋」を廃し inline SVG `Plus` icon 化〈`mockup-d-home-sales-admin.html:238` の primary button + svg 先例に合わせる〉/ 状態 6b にも固定帯 / 固定帯に小見出しラベル / AC20 を DSR-24 節限定・個別 2 回実行に訂正 / 61 §61.9 Test Focus に観点追加 / round 1 の (1)(3)(4)(5) は owner 確認済みとして記録、**round 3 は不要**）→ Gated Amendment 4 = 本 commit → Codex 是正発注 34 → closure 4（Sonnet + Opus、差分が小さいので Codex closure は省略）→ state-only → Ready。
  - no-action（記録のみ）: Opus P3-N10 sr-only の `clip-path` 併記提案（mockup のみの静的見本向け強化、runtime 実装は Tailwind `sr-only` ユーティリティをそのまま使うため対応不要）。
- closure 4（Reviewed Content `f4d8ad1`、2026-09-10）: Sonnet approve（J1〜J6 closed、AC1〜AC33 PASS）/ Opus approve（P2 0、P3 3 = mockup `:68` / README `:20` の stale 注記、全角句点後の空白 2）→ Coordinator 裁定 accept 3 → 本 commit（docs 同期、Ready 遷移同乗、`implementing->local-verified->independent-review->human-confirm->ready-hosted-final` を圧縮記録。STATECAP: forward state-only は `1310c77` の 1 本のみ、本 commit は content commit）。Sonnet delta ack は Coordinator が実施。
