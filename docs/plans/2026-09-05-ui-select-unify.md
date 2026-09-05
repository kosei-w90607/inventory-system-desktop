# Plan Packet: native `<select>` → shadcn `Select` 統一（⑧、R5-3 owner 決定）

owner 決定（R5-3、2026-09-05、[owner L3 原文](../design-system/reference/2026-09-04-owner-l3-feedback-raw.md)「Lane 3 承認 + Lane 5 L3 所感 原文」）に基づき、runtime に残る native `<select>` を shadcn `Select`（商品一覧・在庫照会等で既に使われている部門フィルタと同じ見た目）へアプリ全体で統一する。Lane 5（[packet](2026-09-05-ui-list-backbone-d-lane5.md)）が native `<select>`/`<input>`/`<textarea>` に当てた `--control-surface` token 化は暫定であり、本 lane が正本（native `<select>` を置換で解消する）。Plans.md ⑧（`rg -n "⑧" Plans.md`）が本 lane を記録する。

## Workflow State

- Phase: human-confirm
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 5d94a72
- Amendments: Gated Amendment 2（2026-09-06、共有 `select.tsx` の空文字 echo 無視、Writer commit `348ea3d`、Final Review Opus 採用）
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer、D-056）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer）+ Codex ロジックレビュー 1 回（Codex 枠切れ、2026-09-07 夜の週次リセット後に実施。§3.3 Capacity-degraded により Codex 成分は pending、human-confirm で待機し Phase を前進させない）
- Reviewed Content HEAD: ce39c8f
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（AC-L3-1〈プルダウン統一の見た目〉/ AC-L3-2〈開閉・選択・「すべて」・キーボード操作、owner 選定 2 画面〉の 2 項目）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（R5-3、2026-09-05、消費済み）。2 回目 = owner Windows native L3（AC-L3-1〜2）。3 回目 = 承認 + merge（Coordinator 代行）。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator workflow の見た目・操作方法の変更（10 画面 16 箇所の native `<select>` を shadcn `Select` へ置換。プルダウンの開閉・選択操作の挙動自体が変わる — native の `<select>` ネイティブ dropdown から Radix popover + キーボード操作へ）。DB スキーマ・Tauri command・route/search state・POS CSV / PLU TSV 形式の変更はない。既存 test の `userEvent.selectOptions` / `toHaveValue` / `fireEvent.change` による native select 前提のアサーションを Radix Select 前提（`getByRole("combobox")` / `getByRole("option")` / 表示テキスト）へ書き換える必要があり、書き換え漏れは silent green ではなく test failure になるため回帰検出は機械的に効く。DEV_WORKFLOW Risk Tiers の R3「operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

**Stacked train（D-074、DEV_WORKFLOW「Stacked train」節）**: 本 branch は Lane 5（`agent/ui-list-backbone-d-lane5`、Draft PR #35、human-confirm 中、tip `04f89a4`〈Lane 5 が `origin/main` `07302b5` を単段 merge した後の再スタック先、旧 tip `431cd59`〉）に stack している（`InventoryRecordsPage.tsx` / `ReceivingPage.tsx` / `DisposalPage.tsx` / `ReturnExchangePage.tsx` / `ProductForm.tsx` / `StockUnitField.tsx` / `PriceRevisionFilters.tsx` / `StockMovementsPage.tsx` / `OperationLogsPage.tsx` の native `<select>` class を Lane 5 が `bg-control-surface` 化済みで、本 lane はその同じ要素を置換するため main 起点では衝突する）。Lane 5 の squash merge 後は、旧 tip を保存してから最新 `origin/main` を 1 回だけ merge する単段 merge で base を付け替える（rebase しない。plan-first commit / gated amendment の SHA 書換えは D-039 / PK5「Plan Commit ancestry」（DEV_WORKFLOW `:125`）に反する）。付け替え後の merge delta が実装 file に触れる場合は、その delta を独立に再検証（対象 test の再実行 + Final Reviewer による差分実読）してから Phase を進める。STATECAP の継承: stack 点以前にある Lane 5 の forward state-only commit は Lane 5 merge 後に `merge-base(origin/main, HEAD)..HEAD` の検査範囲へ継承されうるため、本 lane 自身の forward state-only は 1 本（human-confirm → ready-hosted-final）に抑え、他の遷移は content commit 同乗で行う。Writer は Lane 5 の merge通知を受けたら作業を一旦止め、Coordinator の base 付け替え後に再開する。

merge train 順序: Lane 5 → ⑧ → Lane 4（本 lane の bullet〈Plans.md ⑧〉が明記する順序、Sonnet Plan Review round 1 P3-4）。

## Goal

Goal Invariant:

### 最小完了条件

- 起票時実測で列挙した native `<select>` 16 箇所（10 画面/component、`type="checkbox"`/`"radio"`/`"file"`/hidden を除く。native `<input>`/`<textarea>` は Lane 5 の scope のまま本 lane では変更しない）が shadcn `Select`（`SelectTrigger`/`SelectContent`/`SelectItem`）に置換される
- 既存の `aria-label` / `<Label htmlFor>` 関連付けが `SelectTrigger` の `id`/`aria-label` で維持され、既存 test の要素特定手段（`getByLabelText` 等）が引き続き解決できる
- 空値 sentinel（native の `<option value="">`）を持つ箇所は Radix の `SelectItem value=""` 禁止制約に適合する非空 sentinel（または `SelectValue placeholder` を使う無 sentinel 方式）へ変換し、state 境界での null/undefined 変換ロジックが不変の業務意味を保つ
- 数値 ID を値に持つ箇所（`departmentId`/`supplierId` 等）は文字列化・数値復元が往復して壊れない
- `docs/design-system/01-decision-rules.md` に DSR-23 が新設され、native `<select>` を業務選択肢に使わない規約が正本化される

### 失敗定義

- 16 箇所のいずれかで native `<select>` が残る、または見た目が「部門」Select と異なる（枠・面 token が Lane 5 の `--control-surface`/`border-input` 契約から外れる）
- 既存 test の `aria-label`/`htmlFor` ベースの要素特定が壊れる、またはテスト書き換えで assertion の実質的な検査内容が弱まる（例: 値の変化を検証しない）
- 空値 sentinel の変換ミスで「すべて」「指定なし」「取引先なし」等の意味が変わる、または required な部門選択が誤って任意化される
- OperationLogsPage の `<optgroup>` カテゴリ分けが `SelectGroup`/`SelectLabel` 移行で失われる
- Non-scope（下記）に挙げた項目まで誤って変更してしまう

### 非目的

- Lane 5 の scope（native `<input>`/`<textarea>` の `--control-surface` token 化、`button.tsx`/`badge.tsx` の outline 枠、SegmentedControl 確認）は再度触らない。**例外（Sonnet Plan Review round 1 P2-10）**: 本 lane が編集する同じ test file 内に Lane 5 が追加した token-contract regression test（`describe`/`it` タイトルが「native input tokens（Lane 5 SC4x）」等）が同居する場合、そのタイトル文字列の改名（例:「native input tokens（Lane 5 SC4x）」→ select 対象を除いた input のみを指す表現）は許可する。assertion 内容・対象要素・期待値は変更しない — 下記「Lane 5 token-contract regression 一覧」参照
- `MonthNavigator.tsx`/`DateNavigator.tsx` の `<input type="month"/"date">`（select ではない、Lane 5 が既に token 化済み）
- R5-2（表示件数 Select の配置統一）、R5-4（外枠 `#F5F5F4` 統一）、識別列固定・出っ張り解消（いずれも Lane 4 候補、Plans.md ④ 参照）
- `ExportBar.tsx` の disabled `<span role="button">`（select ではない、Lane 5 Non-scope L5-D4 を継承）
- `ProductFormPage.tsx:233` の `plu-memory-no` readOnly 表示欄（select ではない、Lane 5 Non-scope L5-D3 を継承）
- `ReturnExchangePage.tsx` の `type="radio"` レジ戻し区分（select ではない、D8 明示除外を継承）
- R3-4「追加」系 button の primary 化（design-first 候補 ⑦、CTA hierarchy の設計判断）— 本 lane は取引先 select 自体の置換のみ行い、隣接する「取引先追加」button の variant は変更しない

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、worktree base `431cd59`〈Lane 5 branch tip、Draft PR #35 human-confirm 中〉、すべて本 packet 起草者が rg で再確認）

- **native `<select>` の全列挙**（`rg -n "<select" src/features src/components --glob '!*.test.*'`）。**合計 16 箇所（10 file）**。Plans.md ⑧ の「23 箇所」は Lane 5 起票時実測の select + input + textarea 混合カウントの引き継ぎ値であり、select のみに絞ると 16 箇所になる（**Plans.md ⑧ との数の食い違いを明示**）。native `<input>`/`<textarea>` は Lane 5 の scope のまま本 lane では対象外:
  - `DisposalPage.tsx:509`（種別 select、per-row・`aria-label={row.productCode} の種別`、`DisposalType` 文字列 enum 3 値、sentinel 不要）
  - `ManualSalePage.tsx:429`（理由 select、`id="manual-sale-reason"` + `Label htmlFor`、`ManualSaleReason` 文字列 enum 2 値、sentinel 不要）
  - `ReceivingPage.tsx:393`（取引先 select、`id="receiving-supplier"` + `Label htmlFor`、`supplierId: number | null`、`<option value="">指定なし</option>` の空値 sentinel が Radix で使用不可 → 非空 sentinel へ変換要）
  - `InventoryRecordsPage.tsx:165`（記録種別 select、`id="records-type"` + `<label htmlFor>`、`INVENTORY_RECORD_TYPE_OPTIONS` に `{value:"all"}` が既に含まれる文字列 enum、sentinel 変換不要）
  - `InventoryRecordsPage.tsx:232`（部門 select、`id="records-department"` + `<label htmlFor>`、`departmentId: number | null`、`<option value="all">すべて</option>` と native 側で既に非空 sentinel `"all"` を採用済み、sentinel 自体の変換は不要。**Opus Plan Review round 1 P1-4 実測**: `:235` `value={normalized.departmentId ?? "all"}` と `:244` `SelectItem` 相当の `option value={department.id}` はいずれも number が無変換で `value` に渡る — Radix は文字列必須のため `value={normalized.departmentId == null ? "all" : String(normalized.departmentId)}` へ、option 側も `String(department.id)` へ揃え、`onChange`/`onValueChange` で `Number(value)` に復元する。`String(null)` が `"null"` という有効文字列を作らないよう `== null` 分岐を先に置くこと）
  - `InventoryRecordsPage.tsx:254`（状態 select、`id="records-status"` + `<label htmlFor>`、`INVENTORY_RECORD_STATUS_OPTIONS` に `{value:"all"}` が既に含まれる文字列 enum、sentinel 変換不要）
  - `StockUnitField.tsx:51`（数量単位 select、`id="stock-unit"` + `Label htmlFor`、`"pcs"|"cm"` 文字列 enum、sentinel 不要）
  - `PriceRevisionFilters.tsx:45`（取引先 select、static `aria-label="取引先"`、`normalized.supplier: number | undefined`、`<option value="">すべての取引先</option>` の空値 sentinel が Radix で使用不可 → 非空 sentinel `"all"` へ変換要（`"none"` ではない、L8-D1 参照）。`:49` `value={normalized.supplier === undefined ? "" : String(normalized.supplier)}` は既に「常に controlled、未選択は `""`」の安全な形（S8a の L8-D2 是正が踏襲した先例）。**Opus Plan Review round 2 P3-4 是正**: `:43-45` の `<label className="...">取引先<select .../></label>`（ラベル文言が `<select>` を囲む構造）は `SelectTrigger` 置換後、Radix が open を trigger 自身の `pointerdown` にバインドするため、ラベル文言部分をクリックしても focus はするが open しなくなる（native `<select>` は`<label>` 内包で全域クリックが open に届く点と挙動が変わる）。囲み構造をそのまま残さず `<label className="text-sm text-muted-foreground" htmlFor="price-revision-supplier">取引先</label>` + `SelectTrigger id="price-revision-supplier"` の分離形へ変換する（同ファイル内の他ラベル "取引先未設定の商品も含める" 等と同じ `htmlFor` 分離パターン）。分離後は静的 `aria-label="取引先"` は冗長になるため撤去する（可視 label が accessible name を担う））
  - `StockMovementsPage.tsx:167`（種別 select、`id="movement-type"` + `<label htmlFor>`、`MOVEMENT_TYPE_OPTIONS` に `{value:"all"}` が既に含まれる文字列 enum、sentinel 変換不要。同ファイル `:189` に既に shadcn `Select`（表示件数）が同居しており、canonical pattern の参照元）
  - `ProductForm.tsx:274`（部門 select、必須項目、`id="department-id"` + `Label htmlFor`、`departmentId: number | null`、`<option value="">選択してください</option>` は「未選択」を表す placeholder 用途 → sentinel item でなく Radix の `SelectValue placeholder` 方式へ、`FieldError` によるバリデーション表示は維持。**Opus Plan Review round 1 P1-4 実測**: `:277` `value={values.departmentId ?? ""}` と `:287` `option value={department.id}` は number が無変換で `value` に渡る — `SelectItem value={String(department.id)}` へ揃え、`onValueChange` で `Number(value)` に復元する。**Opus Plan Review round 2 P1-1 是正**: 「未選択時は `value` を渡さず placeholder に委ね、選択済み時のみ `String()` を渡す」は Radix `Select.Root` を uncontrolled ⇄ controlled に切り替えることになり、`ProductFormPage.tsx:74` `setValues(createProductFormDefaults)`（`mode==="create"` の live reset path）で部門を未選択へ戻した際に旧ラベル残存 + React 警告を招く。常に controlled で渡す — `value={values.departmentId === null ? "" : String(values.departmentId)}`。`Select.Root` の `value=""` はどの `SelectItem` にも一致しないため自動的に `SelectValue placeholder` を表示する（Radix が例外を投げるのは `SelectItem value=""` のみで `Root` の `value=""` は安全）。同じ「常に controlled、未選択は `""`」パターンは `PriceRevisionFilters.tsx:49` `value={normalized.supplier === undefined ? "" : String(normalized.supplier)}` に既存の codebase 先例がある）
  - `ProductForm.tsx:297`（取引先 select、任意項目、`id="supplier-id"` + `Label htmlFor`、`supplierId: number | null`、`<option value="">取引先なし</option>` は「取引先なし」という業務上明示的な選択状態 → 非空 sentinel（`"none"`）へ変換要。**Opus Plan Review round 1 P1-4 実測**: `:300` `value={values.supplierId ?? ""}` も同じ number-reaches-value 問題を持つ — `value={values.supplierId == null ? "none" : String(values.supplierId)}` へ、option も `String(supplier.id)` へ揃え、`onValueChange` で `"none" → null` / それ以外 `Number(value)` に復元する（`String(null)` が `"null"` になる経路を作らない）。隣接する「取引先追加」`Button`（`variant="outline"`）は本 lane では変更しない）
  - `ProductForm.tsx:413`（税率 select、`id="tax-rate"` + `Label htmlFor`、`"10"|"8"|"0"` 文字列 enum（既に非空）、sentinel 不要）
  - `OperationLogsPage.tsx:378`（種別 select、`id="log-type"` + `<label htmlFor>`、`operation_type: string | undefined`、`<option value="">すべて</option>` の空値 sentinel が Radix で使用不可 → 非空 sentinel へ変換要。加えて `<optgroup>` によるカテゴリ分けを `SelectGroup`/`SelectLabel`（`select.tsx` export 済み、未使用）へ移行する。Lane 3 Gated Amendment 2 で `--control-surface` 化済みの箇所だが、select 自体は native のまま残っていたため本 lane の対象に含める）
  - `ReturnExchangePage.tsx:524`（種別 select、`id="return-type"` + `Label htmlFor`、`"return"|"exchange"` 文字列 enum、sentinel 不要）
  - `ReturnExchangePage.tsx:704`（追加方向 select、`id="return-add-direction"` + `Label htmlFor`、`"in"|"out"` 文字列 enum、sentinel 不要。**Opus Plan Review round 1 P1-3 実測**: `:707` `disabled={isFormLocked || values.returnType === "return"}` で `returnType==="return"` の間は trigger 自体が開けなくなり、`:714` の `returnType==="exchange"` 条件描画 `SelectItem`（渡し）は disabled 状態と完全に重複する防御になっている。disabled な trigger の option 構成は DOM から検証不能なため、条件描画をやめて「戻り」「渡し」を常時 2 件描画し、到達不能性は `disabled` 側 1 箇所に一本化する。test は `returnType==="exchange"`（有効）時のみ「戻り」「渡し」両方を assert し、`returnType==="return"` 側は「trigger が disabled であること」のみ assert（選択肢構成は L3-only、happy-dom では disabled trigger を開けないため検証できない）
  - `ReturnExchangePage.tsx:823`（方向 select、per-row・`aria-label={row.productCode} の方向`、`"in"|"out"` 文字列 enum、sentinel 不要。**Opus Plan Review round 1 P1-3 実測**: `:825` も同型の `disabled={isFormLocked || values.returnType === "return"}` + `:842` 条件描画「渡し（在庫-）」を持つ。`:704` と同じ理由で条件描画を撤去し「戻り（在庫+）」「渡し（在庫-）」を常時 2 件描画、到達不能性は `disabled` に一本化する。test も同様に enabled（exchange）側のみ選択肢を assert、disabled 側は L3-only）
- **canonical 参照元**: `src/components/patterns/DepartmentFilter.tsx`（部門フィルタ、`ALL_VALUE = "__all__"` sentinel パターン、`<label htmlFor>` + `SelectTrigger id` 関連付け、`disabled` 対応）。`src/features/stock-movements/StockMovementsPage.tsx:189-209`（表示件数、`SelectTrigger id` + `SelectValue` + `SelectContent`/`SelectItem` の数値文字列化パターン）。他 8 画面（`StocktakePage`/`IntegrityCheckPage`/`StockInquiryPage`/`ProductListPage`/`PriceRevisionPage`/`OperationLogsPage`/`MergeSupplierDialog`/`InventoryRecordsPage`）が既に `SelectTrigger` を import 済みで、Radix Select は runtime で広く実証済み
- **sentinel 命名の既存不一致**: `DepartmentFilter.tsx` は `"__all__"`、native の `InventoryRecordsPage`/`StockMovementsPage`/`OperationLogsPage`（是正後）は `"all"` を使う。本 lane はこれを統一しない（既存呼び出し側の option 定数・test 文字列を無用に触ると回帰面が広がる）。新規に sentinel を導入する箇所は選択肢の業務意味で 2 群に分ける（**Sonnet Plan Review round 1 P2-6 是正**: 旧稿は `PriceRevisionFilters` を「指定なし」群へ誤って含め、S6（Scope）の `"all"` 採用と矛盾していた）: (a) 「すべて」の意味を持つ箇所は既存 native 隣接ファイル群と同じ `"all"` を採用 — `PriceRevisionFilters`（`すべての取引先`）/`OperationLogsPage`（`すべて`、同ファイル内に他の enum sentinel 先例が無いため隣接ファイル群の慣習を踏襲）。(b) 「指定なし/取引先なし」という明示的な無選択の意味を持つ箇所は `"none"` を採用 — `ReceivingPage`（`指定なし`）/`ProductForm` 取引先（`取引先なし`）。L8-D1、Coordinator 判断、詳細は Design Intent Trace
- **Contract Probe（済、下記「Contract Probe」節参照）**: `DisposalPage.tsx:509` と `ReturnExchangePage.tsx:823` は table 行の `.map()` 内に render される per-row select で、この codebase にはまだ per-row 独立 Radix `Select` インスタンスの前例がない（既存 `SelectTrigger` 使用箇所 9 file はすべて画面トップレベルの単一フィルタ）。happy-dom 環境で 2 行の独立 Select を mount し、片方の選択操作がもう片方に波及しないこと、`aria-label` ベースで両方を独立に query できることをスクラッチ test で確認済み（PASS、詳細は Contract Probe 節）
- **既存 test の native select 前提アサーション（Sonnet + Opus Plan Review round 1 P1-5 実測を統合）**: `rg -n "selectOptions|fireEvent\.change" src --glob '*.test.tsx'` を対象 10 file だけでなく `src/features` 全体で再実行し、対象 select の `aria-label`/`htmlFor` 文言でフィルタして再確認した確定リスト:
  - `ProductForm.test.tsx`（`userEvent.selectOptions` 7 箇所、数量単位 select 対象）
  - `ReturnExchangePage.test.tsx:301,303,364`（`userEvent.selectOptions`、種別/追加方向）
  - `ReturnExchangePage.suggest.test.tsx:97-98`（`fireEvent.change`、種別/追加方向 — 旧稿で見落としていた別 test file、round 1 P1-5 で追加）
  - `InventoryRecordsPage.test.tsx:350`（`userEvent.selectOptions`、記録種別）。**Opus Plan Review round 2 P1-2 是正**: 「他は既存 shadcn Select 用 `getByRole("combobox")` パターンが既に存在」は誤り（round 1 の false statement）— `:312` `expect(await screen.findByLabelText("部門")).toHaveValue("2")` と `:314` `expect(screen.getByLabelText("状態")).toHaveValue("active")` も native DOM value 前提の `toHaveValue` であり、SC4b/SC4c の書き換え対象に含める
  - `DisposalPage.test.tsx`（`fireEvent.change`/`toHaveValue` は種別 select と理由 input に混在、種別 select 分のみが対象。`:130,611` の `toHaveValue("damage")` 等が対象）
  - `ReceivingPage.test.tsx`/`ManualSalePage.test.tsx`/`StockUnitField.test.tsx` — select 関連 assertion を `rg` で洗い出して書き換える
  - `PriceRevisionPage.test.tsx:539`（`expect(screen.getByLabelText("取引先")).toHaveValue("44")` — round 2 P1-2 で追加。`PriceRevisionFilters.tsx:133-140` の `CreateSupplierDialog onCreated` が `onPatch({ supplier: supplier.id })` で新規作成した取引先を自動選択する、SC6 と同一 select の auto-select 経路。**Opus Plan Review round 3 P1 是正**: `onPatch` は `PriceRevisionPage.tsx` が内部管理する `patchSearch` へ渡るだけで、test は `@tanstack/react-router`/`sonner`/`@/lib/bindings`/`@/lib/page-scroll` のみ mock しており（`:19-35`）`onPatch`/`patchSearch` 自体は observable でない。表示テキストでも `onPatch` 引数でもなく、既存 `:170-172` と同型の `await waitFor(() => expect(mockSearchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ supplier_id: 44 })))` を assert する（`priceRevisionSearch.ts:128` が `normalized.supplier` → `supplier_id` を写像する検索 query 経由での確認）
  - `StockMovementsPage.test.tsx:179`（`userEvent.selectOptions`、種別）
  - `OperationLogsPage.test.tsx:193`（`userEvent.selectOptions`、種別）
  - `ProductFormPage.test.tsx:115,152`（`userEvent.selectOptions(getByLabelText(/^部門/), …)`、`ProductForm.test.tsx` とは別の page-level wrapper test file — round 1 P1-5 で追加）
  - `ProductFormPage.unsaved-guard.test.tsx:111`（同上、`userEvent.selectOptions(getByLabelText(/^部門/), "1")` — round 1 P1-5 で追加）
  - `ReturnExchangePage.suggest.test.tsx:105`（`expect(screen.getByLabelText("RT-L1 の方向")).toHaveValue("out")` — round 2 P1-2 で追加、`:97-98` と同じ file・同じ flow 内にある per-row 方向 select〈SC10c〉の `toHaveValue` 見落とし）

  すべて Radix Select 前提（`await user.click(getByRole("combobox", {name}))` → `await user.click(await screen.findByRole("option", {name}))`、値の検証は表示テキストまたは `onValueChange`/送信 payload の引数で行い `.value`/`toHaveValue`/`fireEvent.change` は使わない）へ書き換える。**Opus Plan Review round 1 P1-2 実測**: Radix はポップオーバーが閉じている間 `role="option"` を DOM に生成しない。`OperationLogsPage.test.tsx:192` の `await screen.findByRole("option", {...})`（trigger を開かずに option を探す）と `:532` の `queryByRole("option", ...).not.toBeInTheDocument()`（閉じたまま存在しないことを主張、常に真になり得る vacuous assertion）と `:546` の `getByRole("option", ...)`（閉じたまま option を要求）はすべて trigger を開いてからでないと成立しない、または成立しても検査内容が空になる。書き換え時は必ず (1) `await user.click(getByRole("combobox", {...}))` で開く (2) 開いた状態で positive/negative 双方の option 存在を assert する（negative 単独では trigger が本当に開いているかを証明しないため、同じ open 状態で少なくとも 1 件の positive option 存在も併記する）
  - `native <select>` の残存有無を検査する際、この file が `<form>` 内（`ProductForm.tsx:129` 相当）にあると Radix は送信用に aria-hidden な bubble `<select>` を DOM に残す（**Sonnet Plan Review round 1 P2-7 実測**）。DOM 上の `document.querySelectorAll("select")`/`container.querySelector("select")` 等の走査は false positive（bubble select を native `<select>` の残存と誤検出）を生むため使用禁止とし、置換完了の唯一のオラクルは source-text 検査 `rg -c "<select" <file>` = 0 とする（AC1〜AC10 参照）
- **DSR-23 新設候補地**: `docs/design-system/01-decision-rules.md` は DSR-22 が最終（`:427-451`、`## 更新履歴` は `:455`）。DSR-10 相当の軽量形式（ルール / Why / 具体例）が適切（DSR-19〜22 のような長文理論引用は不要、owner 決定の執行という性質が DSR-10 に近い）。参照更新が要る箇所: `01-decision-rules.md:1`（title `DSR-01〜22` → `DSR-01〜23`）、`docs/design-system/README.md:13`（DSR 列挙）、`docs/UI_TECH_STACK.md:403`（DSR 列挙）
- **catalog の native 言及**: `rg -n "native" docs/design-system/02-component-catalog.md docs/design-system/01-decision-rules.md` は native `<select>`/`<input>` を暫定と明記した文は 0 件（該当する記述自体が存在しない — Lane 5 D8 の owner 決定は Plans.md ④ にのみ記録され catalog には反映されていなかった）。catalog ④ フォームセクション（`:201-251`）Don't / ⑨ 検索+フィルタ（`:543-600`）Don't のどちらにも native `<select>` 禁止規定はない。本 lane は DSR-23 を正本にし、④・⑨ から DSR-23 へ 1 行ずつ参照を張る（catalog 本文を重複させない）
- **Lane 5 token-contract regression 一覧（Sonnet Plan Review round 1 P2-10）**: 以下は Lane 5 が同一 test file 内に追加した `border-input`/`bg-control-surface` class assertion で、本 lane の select 置換後も pass し続ける前提（`select.tsx:30` の `SelectTrigger` が同じ `border-input bg-control-surface` を持つため）。置換 test 書き換え時に誤って削除しないこと、`describe`/`it` タイトルの改名は上記「非目的」の例外規定により許可: `ManualSalePage.test.tsx:577-579`、`ReceivingPage.test.tsx:958-960`、`DisposalPage.test.tsx:605-612`、`InventoryRecordsPage.test.tsx:677-699`、`ProductForm.test.tsx:681-682`、`ReturnExchangePage.test.tsx:524-539`、`StockUnitField.test.tsx:170`、`PriceRevisionPage.test.tsx:673`、`OperationLogsPage.test.tsx:511-521`（この test は「開始日」「終了日」「種別」を同一ループで検査しており、「種別」が select→`Select` 置換後も `getByLabelText("種別")` が `SelectTrigger` に解決してクラスを保つか要再確認、Writer 実装時の回帰点として明記）、`StockMovementsPage.test.tsx:301`
- **traceability baseline**: 現在 `FE_UNREFERENCED_BASELINE = 24`（Lane 5 L5-D6）。本 lane は既存 test file（すべて REQ/UI ID 参照済み）を編集するのみで新規 test file を追加しない想定のため baseline は変化しない見込み。Writer が新規 shared test helper file を追加する場合は `generate_traceability -- --check` で drift を検出し、Lane 5 L5-D6 の先例に倣って baseline 更新 + comment 記録を行う

## Scope

- **S1 DisposalPage 1 箇所**: `:509` の種別 per-row native `<select>` を `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` へ（`aria-label` 維持、`DisposalType` 3 値、sentinel 不要）。`disabled={isFormLocked}`（`:511`）を `Select`（Root）の `disabled` として保持する（**Opus Plan Review round 2 P2-2**、実装は Radix 仕様どおり Root 側に配置、Gated Amendment 2 で packet の `SelectTrigger` 表記を訂正）。完了条件: `rg -c "<select" src/features/disposal/DisposalPage.tsx` = 0（起票時 1）かつ `rg -c "SelectTrigger" src/features/disposal/DisposalPage.tsx` ≥ 1
- **S2 ManualSalePage 1 箇所**: `:429` の理由 select を置換（`id`/`Label htmlFor` 維持、2 値、sentinel 不要）。完了条件: `rg -c "<select" src/features/manual-sale/ManualSalePage.tsx` = 0（起票時 1）かつ `rg -c "SelectTrigger" src/features/manual-sale/ManualSalePage.tsx` ≥ 1
- **S3 ReceivingPage 1 箇所**: `:393` の取引先 select を置換。`<option value="">指定なし</option>` を非空 sentinel（`"none"`）へ変換し `onValueChange` で `"none" → null` に写像。完了条件: `rg -c "<select" src/features/receiving/ReceivingPage.tsx` = 0（起票時 1）かつ `rg -c "SelectTrigger" src/features/receiving/ReceivingPage.tsx` ≥ 1 かつ `rg -Fn 'SelectItem value="none"' src/features/receiving/ReceivingPage.tsx` ≥ 1
- **S4 InventoryRecordsPage 3 箇所**: `:165`（記録種別、S4a）/`:232`（部門、S4b、numeric ID を `String()` 化する round-trip 契約あり — 起票時実測「Plan Review round 1 P1-4 実測」参照）/`:254`（状態、S4c）を置換。3 箇所とも既存の文字列 enum（`"all"` sentinel 含む）をそのまま `SelectItem value` に転用、sentinel 変換不要（S4b の numeric ID のみ `String()`/`Number()` 変換が要る）。S4b は実装後、実在部門を 1 件選び「trigger 表示が部門名（`department.name` そのまま、`InventoryRecordsPage.tsx:245` は `code_prefix` suffix を持たない — `ProductForm.tsx` S8a とは異なる）になる」かつ「search state の `departmentId` が対応する number になる」ことを対で確認する round-trip test を追加する（**Opus Plan Review round 1 P1-4、round 2 P3-3 で期待文言を明示**、単なる見た目確認だけでは `String(null)` 等の文字列/数値境界のバグを検出できない）。完了条件: `rg -c "<select" src/features/inventory-records/InventoryRecordsPage.tsx` = 0（起票時 3）かつ `rg -c '<SelectTrigger' src/features/inventory-records/InventoryRecordsPage.tsx` ≥ 2（**Sonnet Plan Review round 1 P2-8**: 旧稿はプレーンな `"SelectTrigger"` 文字列で ≥4 としていたが、この pattern は開始・終了タグ双方にマッチするため行数が実使用数の 2 倍近くなり、既存 1 箇所〈表示件数〉だけで旧閾値へほぼ到達する near-vacuous な oracle だった。開始タグのみに一致する `<SelectTrigger` へ固定し、閾値を半分の ≥2 へ補正）
- **S5 StockUnitField 1 箇所**: `:51` の数量単位 select を置換（`Label htmlFor` 維持、`"pcs"|"cm"`、sentinel 不要、隣接 checkbox は不変）。完了条件: `rg -c "<select" src/features/products/components/StockUnitField.tsx` = 0（起票時 1）かつ `rg -c "SelectTrigger" src/features/products/components/StockUnitField.tsx` ≥ 1
- **S6 PriceRevisionFilters 1 箇所**: `:45` の取引先 select を置換。`<option value="">すべての取引先</option>` を非空 sentinel（`"all"`、DepartmentFilter の `allLabel` 慣習と表現を揃える）へ変換。**Opus Plan Review round 2 P3-4**: 囲み `<label>` 構造（`:43-45`）を `<label htmlFor="price-revision-supplier">` + `SelectTrigger id="price-revision-supplier"` の分離形へ変換し、静的 `aria-label="取引先"` は撤去する（ラベル文言クリックでは open しなくなる Radix の挙動差の回避）。`disabled={suppliersQuery.isLoading}`（`:48`）を `Select`（Root）の `disabled` として保持する（**Opus Plan Review round 2 P2-2**、Gated Amendment 2 で packet の `SelectTrigger` 表記を訂正）。完了条件: `rg -c "<select" src/features/products/components/PriceRevisionFilters.tsx` = 0（起票時 1）かつ `rg -c "SelectTrigger" src/features/products/components/PriceRevisionFilters.tsx` ≥ 1 かつ `rg -Fc 'htmlFor="price-revision-supplier"' src/features/products/components/PriceRevisionFilters.tsx` ≥ 1 かつ `rg -Fc 'id="price-revision-supplier"' src/features/products/components/PriceRevisionFilters.tsx` ≥ 1（**Opus Plan Review round 3 P1**: 旧稿の `rg -Fn 'id="price-revision-supplier"' ≥ 2` は `htmlFor="…"` に `id=` という literal が含まれず 1 件しか一致し得ない不成立オラクルだった — `htmlFor=` と `id=` を別々に ≥1 で検査する 2 本立てへ分割。exit code の扱いは他の `= 0` オラクルと同様、明示確認・`&&` 非直結を守る）。`PriceRevisionFilters.tsx:133-140` `CreateSupplierDialog onCreated` の auto-select（`onPatch({ supplier: supplier.id })`）は numeric ID round-trip 契約の対象だが、`PriceRevisionPage.tsx` は `patchSearch` を内部管理し `onPatch` はテストから observable でない（**Opus Plan Review round 3 P1 是正**、起票時実測「既存 test の native select 前提アサーション」節参照）
- **S7 StockMovementsPage 1 箇所**: `:167` の種別 select を置換（`"all"` sentinel 含む既存文字列 enum をそのまま転用）。完了条件: `rg -c "<select" src/features/stock-movements/StockMovementsPage.tsx` = 0（起票時 1）かつ `rg -c '<SelectTrigger' src/features/stock-movements/StockMovementsPage.tsx` ≥ 1（**Sonnet Plan Review round 1 P2-8**: 旧稿の `rg -c "SelectTrigger" ... ≥ 2` はプレーン pattern の開始・終了タグ二重ヒットにより既存 1 箇所〈表示件数〉だけで今日時点で既に真 — `<SelectTrigger` に固定し閾値を半分の ≥1 へ補正。既存 1 + 新規 1 = 2 箇所という実体は `<select` = 0 の方で保証される）
- **S8 ProductForm 3 箇所**: `:274`（部門、必須、S8a、`value={values.departmentId === null ? "" : String(values.departmentId)}` の常時 controlled 方式〈**Opus Plan Review round 2 P1-1**、L8-D2 是正〉、`SelectValue placeholder="選択してください"`、`FieldError` 表示は不変、numeric ID の `String()`/`Number()` round-trip 契約あり）/`:297`（取引先、任意、S8b、`disabled={supplierWarning !== null}`〈`:301`〉を `Select`（Root）の `disabled` として保持〈**Opus Plan Review round 2 P2-2**、Gated Amendment 2 で packet の `SelectTrigger` 表記を訂正〉、非空 sentinel `"none"` へ変換、numeric ID の round-trip 契約あり）/`:413`（税率、S8c、既に非空の `"10"|"8"|"0"`、sentinel 不要）。S8a・S8b は実装後、実在部門/取引先を 1 件選び「trigger 表示が名前になる」かつ「`update()` へ渡る値が対応する number になる」ことを対で確認する round-trip test を追加する（**Opus Plan Review round 1 P1-4**）。S8a の round-trip は `department.code_prefix !== null` の部門を 1 件含め、trigger 表示テキストが `department.name` だけでなく `:289` の「（独自コード可）」suffix を含む文字列全体（`department.name + （独自コード可）`）になることまで確認する（**Opus Plan Review round 2 P3-3**、suffix 欠落 mutation を kill するため）。**Opus Plan Review round 1 P2-9 是正（round 2 P2-1 で具体化）**: 既存 `ProductForm.test.tsx:657` の `expect(await screen.findByLabelText("取引先")).toHaveValue("44")` は自動選択された取引先とその ID の一致を検証する唯一の assertion であり、trigger 表示テキスト（取引先名）への書き換えでは「ID が 1 ずれている」種類の mutation を検出できなくなる。ただし `ProductForm.test.tsx:509-535` の `renderStateful` harness は `useState` の実 setter を `onValuesChange` に渡すのみで `onSubmit` を呼ばないため「送信 payload」は構成できない。**Opus Plan Review round 3 P1 是正**: `vi.fn(setValues)` を `Harness` 内で inline 生成すると test scope から参照できない（`ProductForm.test.tsx:511` の `setValues` はクロージャ内のローカル変数）。正しくは `renderStateful` 内で `const onValuesChange = vi.fn();` を `Harness` の外（`renderStateful` 直下）で hoist し、`Harness` へは `onValuesChange={(next) => { onValuesChange(next); setValues(next); }}` を渡して実 state 更新と spy 呼び出しを両立させ、`renderStateful` の戻り値を `return { ...render(<Harness />), onValuesChange };` へ拡張して呼び出し側が spy を参照できるようにする。呼び出し側は `const { onValuesChange } = renderStateful();` の後、`expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: 44 }))` を assert する。完了条件: `rg -c "<select" src/features/products/components/ProductForm.tsx` = 0（起票時 3）かつ `rg -c '<SelectTrigger' src/features/products/components/ProductForm.tsx` ≥ 2（**Sonnet Plan Review round 1 P2-8**、プレーン pattern の二重ヒットを避けるため `<SelectTrigger` に固定し閾値を半分へ補正）かつ `rg -Fn 'SelectItem value="none"' src/features/products/components/ProductForm.tsx` ≥ 1
- **S9 OperationLogsPage 1 箇所**: `:378` の種別 select を置換。`<option value="">すべて</option>` を非空 sentinel（`"all"`）へ、`<optgroup>` によるカテゴリ分けを `SelectGroup` + `SelectLabel` へ移行（カテゴリ見出しが `SelectContent` 内に維持される）。**Opus Plan Review round 1 P1-2 実測（既存 test の書き換え必須箇所）**: `OperationLogsPage.test.tsx:192` の `await screen.findByRole("option", {...})`（trigger を開かずに option を探索、Radix は閉状態で option を DOM に生成しないため常に fail する）、`:532` の `queryByRole("option", ...).not.toBeInTheDocument()`（同じ理由で閉状態のまま常に真になる vacuous assertion）、`:546` の `getByRole("option", ...)`（閉状態で fail する）はすべて `await user.click(getByRole("combobox", {name: "種別"}))` で trigger を開いた後に評価する形へ書き換える。`:532`（`does not derive operation type options from the current page`）は開いた状態で「'その他（future_type）' が存在しない」ことと「他の実在カテゴリの option が最低 1 件存在する」ことを対で assert し、開いていることそのものを証明する。完了条件: `rg -c "<select" src/features/operation-logs/OperationLogsPage.tsx` = 0（起票時 1）かつ `rg -c '<SelectGroup' src/features/operation-logs/OperationLogsPage.tsx` ≥ 1（**Opus Plan Review round 3 P3**: プレーンな `"SelectGroup"` は import 文の行にも一致するため、開始タグのみに一致する `<SelectGroup` へ固定）かつ `rg -c "<optgroup" src/features/operation-logs/OperationLogsPage.tsx` = 0
- **S10 ReturnExchangePage 3 箇所**: `:524`（種別）/`:704`（追加方向）/`:823`（per-row 方向、`aria-label` 維持）。いずれも sentinel 不要。**Opus Plan Review round 1 P1-3 是正**: `:704`/`:823` は `disabled={... || values.returnType === "return"}` を持ち、`returnType==="exchange"` の時だけ「渡し」`option` を条件描画していたが、disabled な trigger は開けず選択肢構成を DOM で検証できない。条件描画を撤去して「戻り」「渡し」を常時 2 件描画し（到達不能性は `disabled` に一本化）、test は enabled（exchange）側でのみ両 option の存在を assert、disabled（return）側は「trigger が disabled であること」のみを assert し選択肢構成は L3-only と明記する。`ReturnExchangePage.suggest.test.tsx:97-98`（`fireEvent.change` on 種別/追加方向）も本 lane の対象として同時に書き換える（Plan Review round 1 P1-5 で追加）。完了条件: `rg -c "<select" src/features/return-exchange/ReturnExchangePage.tsx` = 0（起票時 3）かつ `rg -c '<SelectTrigger' src/features/return-exchange/ReturnExchangePage.tsx` ≥ 3（**Sonnet Plan Review round 1 P2-8**、プレーン pattern の二重ヒットを避けるため `<SelectTrigger` へ固定）かつ `rg -Fc 'returnType === "exchange" ? ' src/features/return-exchange/ReturnExchangePage.tsx` = 2（起票時 4 — `:266,317` の無関係な既存ロジック分岐 2 件 + `:714,842` の option 条件描画 2 件。置換後は `:714,842` の 2 件のみ消え `:266,317` は不変のため 2 になる。条件描画撤去の確認オラクル）
- **S11 DSR-23 新設 + catalog 参照追加**: `01-decision-rules.md` に DSR-22（`:451` 末尾）の後・`## 更新履歴`（`:455`）の前へ DSR-23「プルダウンは shadcn `Select` に統一する」を新設（ルール = native `<select>` を業務選択肢に使わない、Why = R5-3 owner 決定〈同一画面内に見た目が 2 種類あるプルダウンが混在していた〉+ 一貫した開閉・キーボード操作、具体例 = 空値 sentinel は非空文字列へ写像し `SelectItem value=""` を使わない）。title を `DSR-01〜22` → `DSR-01〜23` へ（`:1`）。`README.md:13` の DSR 列挙は範囲表記（`DSR-01〜22`→`23`）に加えてトピック一覧文字列にも「DSR-23 プルダウン統一」を追加する（**Opus Plan Review round 2 P3-1**、範囲リテラルの更新だけでは README のトピック一覧に新規 DSR が載らない）。`UI_TECH_STACK.md:403` の DSR 列挙も範囲表記を同期。catalog ④ フォームセクション Don't（`:247-249`）と ⑨ 検索+フィルタ Don't（`:595-598`）にそれぞれ 1 行「native `<select>` を使わない（DSR-23）」を追加（本文重複はさせない）。**Opus Plan Review round 2 P2-3（DSR-22 新設の Lane 1a-refresh 先例、[archived packet](../archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md):189 に倣う registration）**: `01-decision-rules.md:455`（`## 更新履歴`）と `02-component-catalog.md:939`（同）にそれぞれ DSR-23 新設を記録する 1 行を追加し、`docs/quality/review-checklist.md` カテゴリ 9（`### 9. Operator UI visibility`、`:68-87`）に DSR-23 対応のチェック行を 1 行追加、その `## 更新履歴`（`:112`）にも 1 行追加する。完了条件は AC11 参照
- **S12 Plans.md ⑧ + Contract Coverage Ledger 記入**: 本 packet の active link を反映（本 commit で同時実施）。Contract Coverage Ledger は下記節を参照
- **S13 共有 `Select` の空文字 echo guard（Gated Amendment 2、2026-09-06）**: 共有 `Select`（`src/components/ui/select.tsx`）は `onValueChange("")` を無視する（`<form>` 内 Radix `Select` の hidden native select〈bubble input〉が、controlled value と選択肢一覧が同一 render で同時に変わる場面〈非同期取得した既存値の初期表示・作成直後の自動選択〉で発火する echo 対策。Writer commit `348ea3d` で実装済み、本 amendment で packet に遡及記録）。完了条件: `rg -Fc 'if (value === "") return;' src/components/ui/select.tsx` = 1。加えて DSR-23 に guard の存在理由を明記する 1 文「共有 `Select` は空文字の `onValueChange` を無視する（Radix bubble select の echo 対策、`SelectItem value=""` 禁止と対）」を追加する（掃除で誤って消されないため）— オラクル: `rg -Fc "空文字の \`onValueChange\` を無視" docs/design-system/01-decision-rules.md` = 1

## Non-scope

- Lane 5 の scope（native `<input>`/`<textarea>` の `--control-surface` token 化、`button.tsx`/`badge.tsx` outline 枠、SegmentedControl 確認）
- `MonthNavigator.tsx`/`DateNavigator.tsx` の `<input type="month"/"date">`（select ではない）
- R5-2（表示件数 Select の配置統一）、R5-4（外枠 `#F5F5F4` 統一）、識別列固定・出っ張り解消（Lane 4 候補）
- `ExportBar.tsx` の disabled `<span role="button">`（select ではない、L5-D4 継承）
- `ProductFormPage.tsx:233` の `plu-memory-no` readOnly 表示欄（select ではない、L5-D3 継承）
- `ReturnExchangePage.tsx` の `type="radio"` レジ戻し区分・`:135` `registerOptionClass`（関数定義。呼び出し側は `:556,579`）・`:570` 「レジ戻し済み」badge（select ではない、Lane 5 Non-scope を継承。Sonnet Plan Review round 1 P3-5 で `:147`〈関数本体内〉から定義行 `:135` へ引用修正）
- R3-4「追加」系 button の primary 化（design-first 候補 ⑦）
- sentinel 命名規約の全画面統一（`"__all__"` vs `"all"` 等、既存呼び出し側を無用に変更しない、起票時実測「sentinel 命名の既存不一致」参照）

## Acceptance Criteria

- AC1〜AC10: S1〜S10 の完了条件（各 Scope 項目内に file 別 `rg` オラクル記載済み）。**Opus Plan Review round 1 P1-1**: native `<select>` に `<label htmlFor>`/`aria-label` を残したままにすると `getByRole("combobox", {name})` が native select にも解決してしまい「置換されていない」mutation を kill できない。すべての vitest assertion（Test Design Matrix SC1〜SC10）は combobox 解決に加えて `element.tagName === "BUTTON"` または `toHaveAttribute("data-slot", "select-trigger")` を併記し、native `<select>`（`tagName === "SELECT"`）を明確に除外する
- **オラクル運用の注意（Sonnet Plan Review round 1 P2-7, P3-3）**: (a) `<form>` 内の Radix Select は送信用の aria-hidden な bubble `<select>` を DOM に残すため、置換完了の判定に `document.querySelectorAll("select")` 等の DOM 走査を使わない — 唯一の oracle は source-text 検査 `rg -c "<select" <file>` = 0 とする。(b) `rg -c` は 0 件時に何も出力せず exit code 1 を返す。AC1〜AC13 の `= 0` を検査するコマンドは `rg -c "<pattern>" <file> ; echo "exit=$?"` の形で明示的に exit code を確認し（期待値 exit=1）、`rg -c ... && <次の操作>` のように `&&` で直結しない
- AC11: DSR-23 が新設され、旧 title 表記が 0、新 title 表記が 1 以上 — `rg -Fn '# 判断ルール集（DSR-01〜22）' docs/design-system/01-decision-rules.md` = 0（起票時 1）、`rg -Fn '# 判断ルール集（DSR-01〜23）' docs/design-system/01-decision-rules.md` ≥ 1、`rg -c '^## DSR-23 ' docs/design-system/01-decision-rules.md` = 1、`rg -Fn 'DSR-01〜22' docs/design-system/README.md docs/UI_TECH_STACK.md` = 0、`rg -Fn 'DSR-01〜23' docs/design-system/README.md docs/UI_TECH_STACK.md` ≥ 2。**Opus Plan Review round 2 P3-1**: `README.md:13` はトピック一覧文字列としても DSR-23 を含む — `rg -Fn 'DSR-23' docs/design-system/README.md` ≥ 1（範囲表記の 1 件と別に独立確認）。**Opus Plan Review round 2 P2-3**: 更新履歴 / review-checklist 登録 — `rg -c 'DSR-23' docs/design-system/01-decision-rules.md` ≥ 2（本文 heading 1 + 更新履歴行 1）、`rg -c 'DSR-23' docs/design-system/02-component-catalog.md` の更新履歴部分（`:939` 以降）に ≥ 1、`rg -Fn 'DSR-23' docs/quality/review-checklist.md` ≥ 2（カテゴリ 9 のチェック行 1 + 更新履歴行 1）。**Gated Amendment 2（S13）**: `rg -Fc "空文字の \`onValueChange\` を無視" docs/design-system/01-decision-rules.md` = 1（共有 `Select` の echo guard 存在理由を DSR-23 に明記）
- AC12: catalog ④/⑨ に DSR-23 参照が追加される — `rg -Fn 'DSR-23' docs/design-system/02-component-catalog.md` ≥ 2
- AC13: `generate_traceability -- --check` が ERROR 0 / WARN 0 で通る（baseline 24 のまま、または変化した場合は L8-D2 相当の記録を伴う）
- AC-L3-1（owner Windows native L3）: 10 画面のプルダウンが `DepartmentFilter` の `Select` と同じ見た目に統一されて見える
- AC-L3-2（owner Windows native L3）: owner 選定 2 画面で `Select` の開閉・選択・「すべて」相当の選択肢・キーボード操作（矢印キー + Enter）が問題なくできる。**Sonnet Plan Review round 1 P3-2**: owner が選ぶ 2 画面のうち 1 画面は per-row テーブル型（`DisposalPage` の種別 select、または `ReturnExchangePage` の方向 select）を固定で含める。Radix Select は native `<select>` と矢印キーの意味が異なる（↑/↓ が値変更でなく開閉・候補移動になる、typeahead が Enter 確定を要する）ため、per-row 一括操作の実利用感の変化は L3 でしか検出できない

## Design Sources

- Requirements / spec: 該当なし（新規 REQ 追加なし）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の component 置換のみ）
- Function / command / DTO: 該当なし
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md`（DSR-23 新設）/ `docs/design-system/02-component-catalog.md` ④ フォームセクション・⑨ 検索+フィルタ（DSR-23 参照追加）/ `docs/function-design/59-ui-shared-patterns.md`（`DepartmentFilter` 既存記載、変更なし・参照のみ）
- Decision log / ADR: `docs/decision-log.md` D-079（UI 視覚系 change の座組）。本 lane は owner 決定（R5-3、Plans.md ④）の執行であり、新規 durable decision は DSR-23（design-system 側）に置く。decision-log への新規 entry は不要（DSR-23 が design-system 内の正本）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | — | 該当なし |
| Command / DTO / generated binding / wire shape | — | 該当なし |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-23、`02-component-catalog.md` ④/⑨ | updated in this PR（S11） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | DSR-23 が design-system 側の正本、decision-log 新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 新規 REQ 追加なし。既存 test file の編集のみを想定し traceability baseline（現 24）は不変見込み。Writer が新規 shared test helper file を追加する場合は `generate_traceability -- --check` で drift を検出し、baseline 更新 + 日付付き独立 comment 記録を行う（Lane 5 L5-D6 の先例） |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |
| design-system DSR 新設 | DSR-23。`01-decision-rules.md` title 範囲・更新履歴・`README.md:13`（範囲表記 + トピック一覧）・`UI_TECH_STACK.md:403` の DSR 列挙・`02-component-catalog.md` 更新履歴・`docs/quality/review-checklist.md` カテゴリ 9 + 更新履歴を同期（S11、[Lane 1a-refresh archived packet](../archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md):189 の DSR-22 新設手順を踏襲、Opus Plan Review round 2 P2-3） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | 起票時実測「sentinel 命名の既存不一致」節 | L8-D1（2026-09-05） | 新規に sentinel を導入する箇所（`ReceivingPage`/`PriceRevisionFilters`/`OperationLogsPage`/`ProductForm` 取引先）の命名は、`DepartmentFilter.tsx` の `"__all__"` へ統一せず、各ファイルの既存文字列 enum 慣習（`InventoryRecordsPage`/`StockMovementsPage` 等の `"all"`）に揃える。理由: 既存の native select 隣接ファイル群がすでに `"all"` を採用しており、`"__all__"` へ変更すると無関係な既存 test 文字列まで触ることになり回帰面が広がる。`"取引先なし"`/`"指定なし"` の意味には `"none"` を使う（`"all"` と意味が異なるため） | `ReceivingPage.tsx`/`PriceRevisionFilters.tsx`/`OperationLogsPage.tsx`/`ProductForm.tsx` | 各 file 既存 test の拡張 |
| — | `ProductForm.tsx:274` 起票時実測 | L8-D2（2026-09-05、round 2 P1-1 で is 是正） | 部門 select（必須項目）は sentinel item を持たせず Radix の `SelectValue placeholder="選択してください"` を使う。理由: 「選択してください」は業務上の選択肢ではなく未入力状態の表示であり、`FieldError` によるバリデーションと組み合わせて扱う方が、偽の選択可能 option を作らずに済む。**round 2 是正**: 「未選択時は `value` prop 自体を渡さない」は誤りだった（Radix `Select.Root` の uncontrolled ⇄ controlled 切替を招く）。正しくは常に `value={departmentId === null ? "" : String(departmentId)}` を渡す controlled 方式（`Root` の `value=""` は無害、`SelectItem value=""` のみ禁止） | `ProductForm.tsx` | `ProductForm.test.tsx` |
| — | 起票時実測「Contract Probe」節 | L8-D3（2026-09-05） | `DisposalPage.tsx`/`ReturnExchangePage.tsx` の per-row select は、この codebase に前例のない「`.map()` 内の独立 Radix Select インスタンス複数個」パターンになる。Plan Gate 前にスクラッチ test で他行への波及がないことを確認済み（Contract Probe 節）、実装時も各 file の集約 test に「他行が変化しないこと」の回帰確認を含める | `DisposalPage.tsx`/`ReturnExchangePage.tsx` | `DisposalPage.test.tsx`/`ReturnExchangePage.test.tsx` |
| — | `01-decision-rules.md` DSR-23（新設） | L8-D4（2026-09-05） | DSR-22 までの長文理論引用形式ではなく DSR-10 相当の軽量形式（ルール/Why/具体例）を採用。理由: 本規約は owner 決定の執行であり、外部理論の Why 付与を必要としない cross-cutting 選定ルール | `01-decision-rules.md` | docs review（`rg`） |
| — | Plan Review round 1 P1-4（Opus） | L8-D5（2026-09-05） | numeric ID を値に持つ select（`ProductForm.tsx:277,300`/`InventoryRecordsPage.tsx:235`）は native では number がそのまま `value` に渡り React が暗黙に文字列化していたが、Radix は `value` に文字列を要求するため明示的な `String(id)`/`Number(value)` の対変換に統一し、`null`/`undefined` は `String()` に通さず先に sentinel/placeholder 分岐で吸収する（`String(null) === "null"` という有効文字列を作らない）。理由: 暗黙の型強制に頼ると Radix 側で trigger が空白表示になる、または `"null"` という架空の選択値が生まれる | `ProductForm.tsx`/`InventoryRecordsPage.tsx` | 各 file の round-trip test（S4b/S8a/S8b） |
| — | Plan Review round 1 P1-3（Opus） | L8-D6（2026-09-05） | `ReturnExchangePage.tsx:704,823` の「渡し」option 条件描画（`returnType==="exchange"` 時のみ）は同じ条件で trigger 自体を `disabled` にする防御と完全に重複しており、disabled な trigger は開けないため happy-dom では検証不能な死んだ分岐になる。条件描画を撤去し「戻り」「渡し」を常時 2 件描画、到達不能性は `disabled` の 1 箇所に一本化する。理由: 二重防御は保守コストを増やすだけで、片方（disabled）が唯一の実効的なガードである | `ReturnExchangePage.tsx` | `ReturnExchangePage.test.tsx`（S10、enabled 側のみ選択肢を assert） |
| — | Plan Review round 2 P3-4（Opus） | L8-D7（2026-09-05） | `PriceRevisionFilters.tsx:43-45` のラベル文言が `<select>` を囲む構造は、`SelectTrigger` 置換後 Radix が open を trigger 自身の `pointerdown` にバインドするため、ラベル文言クリックで focus はするが open しなくなる（native `<select>` の全域クリック open と挙動が変わる）。`<label htmlFor>` + `SelectTrigger id` の分離形へ変換し、静的 `aria-label` は撤去する。理由: 挙動差を L3 チェック項目として残すより、既存の他ラベル（同ファイル内の checkbox 等）と同じ `htmlFor` 分離パターンへ揃える方が驚きが少ない | `PriceRevisionFilters.tsx` | `PriceRevisionPage.test.tsx` |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 packet の「起票時実測」節が値・理由の一次情報。実装後は S11 で DSR-23 に反映し packet 依存を解消する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: DSR-23 は design-system 側の正本として新設（S11）。L8-D1〜D3 は実装詳細の Coordinator 判断のため packet 止まりでよい
- Assumptions and constraints: 16 箇所の対象範囲は「native `<select>` のみ」（D8 明示除外の checkbox/radio/file/hidden + Lane 5 が扱う input/textarea を除く）で確定。Plan Review はこの境界線の妥当性を検査する
- Deferred design gaps, risk, and follow-up target: sentinel 命名の全画面統一（Non-scope）は要望が続けば起票候補として記録
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-select-unify.md) 各行に L8-D 番号か DSR-23 を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は type="checkbox"/"radio"/"file"/hidden（D8 明示）+ Lane 5 scope（input/textarea）+ L8-D1〜D2（Coordinator 判断、理由記載済み）のみ。すべて起票時実測で列挙し、抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の component 置換のみ | — |
| Fact check / design decision split | 適用: catalog に native select 暫定の記述自体が存在しないことを起票時実測で確認（Lane 5 owner 決定は Plans.md にのみ記録され catalog 未反映だった） | 本 packet の「起票時実測」節、DSR-23 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 10 画面のプルダウンの開閉・選択操作が変わる。owner L3 で確認（AC-L3-1〜2） | AC-L3-1〜2 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜2）、Contract Probe（per-row Select 独立性）は自動 test で先行検証済み | Human Gate、Contract Probe 節 |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: shadcn `Select` の visual token（`border-input bg-control-surface`）は Lane 5 で正本化済み、`DepartmentFilter`/`StockMovementsPage` 等 9 file が canonical 実装例として既に存在する
- Source docs updated in this PR: `01-decision-rules.md` DSR-23（新設）、`02-component-catalog.md` ④/⑨（参照追加）
- Design gaps intentionally deferred: sentinel 命名の全画面統一（Non-scope）
- Durable decisions discovered in this plan and promoted to source docs: DSR-23（native `<select>` 禁止、shadcn `Select` に統一）

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の component 置換のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言変更なし（sentinel の内部値のみ変更、表示文言は不変）、プルダウンの開閉・キーボード操作が variant する
- Error, empty, retry, and recovery behavior: `ProductForm` 部門の `FieldError` バリデーション表示は不変（L8-D2）
- Testability and traceability IDs: 新規 REQ 追加なし、既存 test file 編集のみ

## Contract Probe

- **per-row 独立 Radix Select インスタンスの premise**（`DisposalPage.tsx`/`ReturnExchangePage.tsx` の `.map()` 内 select）: この codebase に前例がないため、happy-dom 環境で 2 行の独立 `Select` を mount し、(1) 片方の選択操作がもう片方の表示値に波及しないこと (2) 両方が `aria-label` で独立に `getByRole("combobox")` 解決できることをスクラッチ test（`vitest run`、非 commit）で実行し **PASS** を確認済み（2026-09-05、実行環境: 本 worktree、`npm ci --ignore-scripts` 後の `vitest 4.1.5`）。実装時の本番 test はこの確認結果を前提に進めてよい
- `SelectItem value=""` が Radix で例外を投げる（空文字列 value 禁止）という premise: `select.tsx`（radix-ui `1.4.3`）の実装は本 lane で直接検証していないが、Radix Select の公開 API 制約として広く知られており、この codebase の既存 `DepartmentFilter`（`ALL_VALUE = "__all__"`）と `StockMovementsPage`（数値文字列化）がいずれも非空 sentinel を採用していることが状況証拠になる。実装時に空文字列 sentinel を誤って使うと Radix が runtime エラーを出すため、fail-closed に検出される（追加の事前確認は不要、N/A）。**Opus Plan Review round 2 P1-1 訂正**: この制約は `SelectItem` 固有であり `Select.Root` の `value` prop には適用されない — `Root` の `value=""` はどの `SelectItem` にも一致せず `SelectValue placeholder` を安全に表示する。round 1 は両者を混同し、S8a（`ProductForm.tsx:274`、必須項目）で「未選択時は `value` を渡さない」という誤った設計（Root を uncontrolled ⇄ controlled に切り替える、`ProductFormPage.tsx:74` の `setValues(createProductFormDefaults)` reset path で顕在化）を導いていた。是正後は S8a も含め全箇所で「常に controlled、未選択/sentinel 値は非空文字列（`""` を含む）」に統一する（`PriceRevisionFilters.tsx:49` が既存の正しい先例）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| S1〜S10 native `<select>` → shadcn `Select`（owner R5-3） | 10 file 16 箇所 | 各 Page/Component test 書き換え | AC-L3-1〜2 |
| L8-D1 sentinel 命名は既存ファイル慣習に従う | `ReceivingPage.tsx`/`PriceRevisionFilters.tsx`/`OperationLogsPage.tsx`/`ProductForm.tsx` | 同上 | non-scope（実装判断） |
| L8-D2 ProductForm 部門は placeholder 方式（sentinel item なし） | `ProductForm.tsx` | `ProductForm.test.tsx` | AC-L3-2 |
| L8-D3 per-row Select 独立性（Contract Probe） | `DisposalPage.tsx`/`ReturnExchangePage.tsx` | `DisposalPage.test.tsx`/`ReturnExchangePage.test.tsx` + 起票時 Contract Probe | non-scope（自動 test 先行検証済み） |
| S9 OperationLogsPage `<optgroup>` → `SelectGroup`/`SelectLabel` | `OperationLogsPage.tsx` | `OperationLogsPage.test.tsx` | AC-L3-1 |
| L8-D5 numeric ID の String/Number round-trip（round 1 P1-4） | `ProductForm.tsx`/`InventoryRecordsPage.tsx` | 各 file の round-trip test（S4b/S8a/S8b） | AC-L3-2 |
| L8-D6 ReturnExchangePage 条件描画撤去（round 1 P1-3） | `ReturnExchangePage.tsx` | `ReturnExchangePage.test.tsx`（S10） | non-scope（disabled 側は L3-only、vitest oracle なし・static `rg` のみ） |
| S13 共有 `Select` 空文字 echo guard（Gated Amendment 2） | `src/components/ui/select.tsx` + DSR-23 | `ProductFormPage.test.tsx`（SC15、duplicate-error test `:246`） | non-scope（機械検査 + 既存 test 回帰） |
| L8-D7 PriceRevisionFilters ラベル分離（round 2 P3-4） | `PriceRevisionFilters.tsx` | `PriceRevisionPage.test.tsx` | non-scope（AC-L3-2 は open 挙動一般で確認） |
| Lane 5 token-contract regression 一覧（round 1 P2-10） | 10 file の既存 test（起票時実測「Lane 5 token-contract regression 一覧」参照） | 既存 test の pass 維持、タイトル改名のみ許可 | non-scope（回帰確認のみ） |
| SC13 追加 call-site test file（round 1 P1-5, round 2 P1-2） | `ProductFormPage.test.tsx`/`ProductFormPage.unsaved-guard.test.tsx`/`ReturnExchangePage.suggest.test.tsx`/`PriceRevisionPage.test.tsx:539`/`InventoryRecordsPage.test.tsx:312,314` | 各 file の native select 前提 assertion 書き換え | AC-L3-1〜2 |
| S11 DSR-23 新設 + catalog 参照 | `01-decision-rules.md`/`02-component-catalog.md`/`README.md`/`UI_TECH_STACK.md` | 該当なし（docs review） | non-scope |
| S12 Plans.md ⑧ 同期 | `Plans.md` | 該当なし | non-scope |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-05-ui-select-unify.md](test-matrices/2026-09-05-ui-select-unify.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（本 lane も frontend のみだが release check の慣行は維持する）。

- targeted tests: 10 画面/component の select 置換 assertion 書き換え（既存 test 拡張、新規 file 追加なし想定）。対象 test file は起票時実測「既存 test の native select 前提アサーション」の確定リストに従う（`ProductForm.test.tsx`/`ProductFormPage.test.tsx`/`ProductFormPage.unsaved-guard.test.tsx`/`ReturnExchangePage.test.tsx`/`ReturnExchangePage.suggest.test.tsx`/`InventoryRecordsPage.test.tsx`/`DisposalPage.test.tsx`/`ReceivingPage.test.tsx`/`ManualSalePage.test.tsx`/`StockUnitField.test.tsx`/`PriceRevisionPage.test.tsx`/`StockMovementsPage.test.tsx`/`OperationLogsPage.test.tsx`、round 1 P1-5 で `ProductFormPage.test.tsx`/`ProductFormPage.unsaved-guard.test.tsx`/`ReturnExchangePage.suggest.test.tsx` を追加）
- negative tests: sentinel 変換箇所（`ReceivingPage`/`PriceRevisionFilters`/`OperationLogsPage`/`ProductForm` 取引先）で「すべて」「指定なし」「取引先なし」選択時に state が意図どおり `null`/`undefined` になることの対照 case
- compatibility checks: OperationLogsPage のカテゴリ分けが `SelectGroup` 移行後も維持されること、per-row select（Disposal/ReturnExchange）で他行が変化しないこと
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: 該当なし（route/DTO 変更なし）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（select の内部 value 文字列化は state 境界内で完結し、外部 wire 形式には出ない）。

## Review Focus

- 16 箇所すべてが shadcn `Select` に置換され、`aria-label`/`htmlFor` の関連付けが既存どおり解決できること
- 空値 sentinel を持っていた 3 箇所（`ReceivingPage`/`PriceRevisionFilters`/`OperationLogsPage`）が非空 sentinel へ正しく変換され、「すべて」「指定なし」の業務意味が変わっていないこと
- `ProductForm` 部門（必須、placeholder 方式）と取引先（任意、sentinel 方式）の使い分けが意図どおりであること
- per-row select（`DisposalPage`/`ReturnExchangePage`）で他行への波及がないこと
- OperationLogsPage のカテゴリ分けが `SelectGroup` 移行後も維持されていること
- Non-scope に列挙した項目（Lane 5 scope、`MonthNavigator`/`DateNavigator`、`ExportBar`、`plu-memory-no`、radio 系、R3-4 button primary 化）が変更されていないこと
- sentinel 命名（`"all"` vs `"__all__"` 等）を全画面で無用に統一していないこと

## Spec Contract

Contract ID: SPEC-UISEL-D1

- 10 画面 16 箇所の native `<select>` が shadcn `Select` に置換され、既存の `aria-label`/`htmlFor` 関連付けと空値 sentinel の業務意味が維持され、DSR-23 が native `<select>` 禁止規約を正本化する

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UISEL-D1 | S1〜S10 | 各 Page/Component test 書き換え | select 置換の見た目・挙動 | vitest |
| SPEC-UISEL-D1 | S9 | `OperationLogsPage.test.tsx` | カテゴリ分け維持 | vitest |
| SPEC-UISEL-D1 | S1, S10 | `DisposalPage.test.tsx`/`ReturnExchangePage.test.tsx` | per-row 独立性 | vitest + Contract Probe |
| SPEC-UISEL-D1 | S11 | docs review（自動テストなし） | DSR-23 新設・catalog 参照 | `rg` 完全一致 |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし

## Writer Instructions

- PR body の Reviewed Content HEAD は pending で置く（`## Workflow State` の `Reviewed Content HEAD` フィールドと同様、Final Reviewer が audit した content commit の SHA を後から state-only commit で埋める。Writer 自身は書き換えない）
- `git add` は明示パスのみ（`git add -A`/`git add .` 禁止）。commit 前に `git status` / `git diff --cached --name-only` で意図した file のみが staged であることを確認する
- 実装原則（ponytail、full。owner 2026-09-05 導入、subagent には発注書経由で注入する運用）:

```
## 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- 具体的な適用: sentinel を新規導入する 3 箇所（`ReceivingPage`/`PriceRevisionFilters`/`OperationLogsPage`）に共通の「取引先/種別セレクタ」抽象化コンポーネントを新設しない（3 箇所は値の型・sentinel 命名・grouping 有無がそれぞれ異なり、無理に共通化すると分岐だらけの偽の汎用コンポーネントになる — rule of three 未達かつ形が揃っていない）。`DepartmentFilter` のような共有 pattern component 化は、今後 4 箇所目以降で形が揃った時に再検討する

## Implementation Results

実装中（Phase: implementing、Plan Commit `5d94a72`、2026-09-05 Plan Gate 収束）。

## Review Response

Plan Review round 1（独立 Opus 5 read-only claims-producer が happy-dom で probe を実行 + 独立 Sonnet subagent、fresh context）: Opus reject / Sonnet approve-with-P2。Coordinator adjudication（2026-09-05）= P1 5 件 + P2 5 件 + P3 5 件（`git diff --stat` 反映済み）を全件 accept、本 commit（amend）で反映:
- P1（5 件、すべて accept）: (1) Matrix SC1〜SC10 に `data-slot="select-trigger"`/`tagName==="BUTTON"` の component-identity assertion を追加（AC1〜AC10 に明記、Test Matrix 側は次項参照） (2) OperationLogsPage の Radix 閉状態 option 不在の 3 箇所（`:192,532,546`）を S9 に明記し trigger を開いてから assert する契約へ (3) ReturnExchangePage `:704/:823` の disabled と条件描画の重複を L8-D6 で解消、S10 で条件描画撤去 + enabled 側のみ assert (4) ProductForm/InventoryRecordsPage の numeric ID string 化を L8-D5 で明文化、S4b/S8a/S8b に round-trip test を追加 (5) 見落としていた `ProductFormPage.test.tsx`/`ProductFormPage.unsaved-guard.test.tsx`/`ReturnExchangePage.suggest.test.tsx` を起票時実測・Scope・Test Plan に追加
- P2（5 件、すべて accept）: (6) sentinel 命名グループの矛盾（PriceRevisionFilters を `"none"` 側に誤分類）を是正 (7) DOM `querySelectorAll("select")` 走査を禁止し source-text `rg -c "<select"` を唯一の oracle に明記 (8) `rg -c "SelectTrigger"` の二重カウント問題を `<SelectTrigger` 固定 + 閾値半減で是正（S4/S7/S8） (9) `ProductForm.test.tsx:657` の `toHaveValue("44")` を送信 payload の `supplierId` assertion へ置き換える方針を S8 に明記 (10) Lane 5 token-contract regression 一覧を起票時実測へ追加し、タイトル改名の例外を非目的節に明記
- P3（5 件、すべて accept）: (11) PriceRevisionFilters の wrapping `<label>` 構造を維持する注記を追加 (12) AC-L3-2 に per-row テーブル画面を 1 画面固定で含める注記を追加 (13) `rg -c` の exit code 1 no-output 挙動と `&&` 非直結の運用注意を追加 (14) 「Plans.md ④ の記載どおり」を「本 lane の bullet（⑧）が明記する順序」へ reword (15) `ReturnExchangePage.tsx:147` の引用を定義行 `:135` へ訂正

Plan Review round 2（独立 Sonnet subagent、fresh context + 独立 Opus 5 read-only claims-producer）: Sonnet approve（P3: round 1 の P3 引用番号スキームが `:48` P3-1 / `:145,:157` 両方 P3-2 / `:152` P3-13 と衝突・不整合 — 通し番号 P3-1〜P3-5 へ統一） / Opus reject。Coordinator adjudication（2026-09-05）= Opus 指摘 10 件（source verified）を全件 accept、本 commit（amend）で反映。Sonnet の引用番号整合も同時に是正（`:48`→P3-4、`:147`→P3-5、`:159`→P3-2、`:154`→P2-7,P3-3、旧 P3-1/P3-13 消滅）:
- P1（2 件、すべて accept）: (1) S8a/L8-D2/Contract Probe を「未選択時は `value` を渡さない」（uncontrolled⇄controlled 切替、`ProductFormPage.tsx:74` の create-mode reset で顕在化）から「常時 `value={id===null?"":String(id)}` で controlled」へ是正（`Select.Root` の `value=""` は無害、禁止されるのは `SelectItem value=""` のみ） (2) 見落としていた `toHaveValue` 4 箇所（`InventoryRecordsPage.test.tsx:312,314`、`ReturnExchangePage.suggest.test.tsx:105`、`PriceRevisionPage.test.tsx:539`）を確定リスト・SC13 へ追加し、`:108` の誤った「他は getByRole(combobox) パターン既存」記述を是正。`PriceRevisionPage.test.tsx:539` は `PriceRevisionFilters.tsx:133-140` の `CreateSupplierDialog` auto-select 経由で SC6 と同一 select であることが判明し、SC6 に numeric ID round-trip 契約を追加
- P2（3 件、すべて accept）: (3) SC8b の「送信 payload」検証は `ProductForm.test.tsx:509-535` `renderStateful` が `onSubmit` を呼ばない harness のため構成不能と判明 — `onValuesChange={vi.fn(setValues)}` + `objectContaining({ supplierId: 44 })` へ具体化 (4) `DisposalPage.tsx:511`/`ProductForm.tsx:301`/`PriceRevisionFilters.tsx:48` の `disabled` prop 保持を S1/S6/S8b と Matrix SC1/SC6/SC8b に明記 (5) SC8c に「trigger を開いてから option を数える」要件が欠けていたため、round 1 P1-2 の open-first 要件を Matrix 全 SC 共通の Mandatory oracle rule として一般化 (6) DSR-22 新設時の登録手順（[Lane 1a-refresh archived packet](../archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md):189）に倣い、`01-decision-rules.md:455`/`02-component-catalog.md:939` の更新履歴行と `docs/quality/review-checklist.md` カテゴリ 9 + 更新履歴（`:112`）行を S11/AC11 へ追加
- P3（4 件、すべて accept）: (7) `README.md:13` はトピック一覧文字列にも DSR-23 が要る（範囲リテラルの更新だけでは不足）ことを AC11 に追加 (8) Matrix Contract Coverage Cross-check に SC13/L8-D7 の Ledger 対応を明記 (9) SC4b/SC8a の round-trip 期待 trigger 表示テキストを明示（`ProductForm.tsx:286-287` の `code_prefix !== null` 時「（独自コード可）」suffix 込み、`InventoryRecordsPage.tsx:245` は suffix なしと明示区別） (10) `PriceRevisionFilters.tsx:43` の囲み `<label>` は round 1（項目 11）で「維持する」と裁定したが、round 2 で Radix の open が trigger 自身の `pointerdown` にバインドされ label 文言クリックでは開かなくなる挙動差が判明 — 裁定を覆し `<label htmlFor>` + `SelectTrigger id` の分離形へ変換する方針へ変更（L8-D7 新設、round 1 の裁定を上書き）

Plan Review round 3（独立 Sonnet subagent、fresh context + 独立 Opus 5 read-only claims-producer）: Sonnet approve / Opus reject（oracle mechanics のみ）。Coordinator adjudication（2026-09-05）= Opus 指摘 P1 3 件 + P3 1 件（`git diff --stat` 反映済み）を全件 accept、本 commit（amend、最終ドラフター pass）で反映:
- P1（3 件、すべて accept）: (1) S6 完了条件 `rg -Fn 'id="price-revision-supplier"' ≥ 2` は `htmlFor="…"` に `id=` literal が含まれず不成立 — `rg -Fc 'htmlFor="price-revision-supplier"' ≥1` と `rg -Fc 'id="price-revision-supplier"' ≥1` の 2 本立てへ分割 (2) `PriceRevisionPage.test.tsx:539` は `onPatch`/`patchSearch` を mock しておらず（mock は router/sonner/bindings/page-scroll のみ、`:19-35`）observable でないと判明 — `mockSearchProducts` の `supplier_id: 44` 呼び出し（`:170-172` と同型、`priceRevisionSearch.ts:128` の写像経由）へ全面差替え（起票時実測 `:111`、S6 完了条件 `:132`、Matrix SC6 を修正） (3) `ProductForm.test.tsx:511` の `Harness` 内で `vi.fn(setValues)` を inline 生成すると test scope から参照できないと判明 — `renderStateful` 直下で `const onValuesChange = vi.fn()` を hoist し `(next) => { onValuesChange(next); setValues(next); }` を渡し、戻り値を `{ ...render(<Harness />), onValuesChange }` へ拡張する形へ具体化（S8 完了条件 `:134`、Matrix SC8b を修正）
- P3（1 件、accept）: (4) S9 完了条件 `rg -c "SelectGroup"` は import 文の行にも一致するため `rg -c '<SelectGroup'` へ固定（`:135`）

2026-09-05: Plan Gate 収束（round 3/3。round 1 = Opus reject P1 5 / Sonnet approve-with-P2、是正 amend / round 2 = Opus reject P1 2 / Sonnet approve、是正 amend / round 3 = Sonnet approve、Opus reject は oracle 記述 3 件 + P3 1 件で設計欠陥なし）。round 3 の是正 4 件は同一 vendor ラリー天井のため Coordinator が該当行（S6 二重 oracle / SC6 `mockSearchProducts` supplier_id 44 / SC8b `renderStateful` spy hoist / S9 `<SelectGroup`）を直接検分して閉じた（owner 許可 2026-09-05「ラリーが止まらない時は Fable が見る」）。`plan-draft -> plan-gate -> plan-approved -> implementing` を Plans.md ⑧ 同期の本 content commit に同乗させて遷移（forward state-only は温存）。Plan Commit = `5d94a72`（plan-first commit、Lane 5 tip `04f89a4` 直上）。Codex ロジックレビュー 1 回は §3.3 pending のまま。

2026-09-06: Final Review round 1 = Opus approve-with-P2（`select.tsx` echo guard を機序実証の上で採用 → Gated Amendment 2、P2: comment の `<select` literal / SC8a の値 assert、P3: L8-D6 は static oracle のみ / `disabled` は Root）+ Sonnet fresh reject（全 mutant 再注入で survivor: SC4a / SC4c / SC8a / SC8b、P3 SC10c）→ Writer 是正 `774eee5`（comment + DSR-23 の 1 文）/ `ce39c8f`（test 5 件）→ 独立 closure 再注入（fresh Sonnet、隔離 worktree）で 6/6 kill、full suite 1300/1300 pass、L1 full RESULT=PASS（END_HEAD_SHA `ce39c8f`）。P1/P2 = 0 を確認し `implementing -> local-verified -> independent-review -> human-confirm` を Plans.md ⑧ 同期（S12）の本 content commit に同乗させて遷移、Reviewed Content HEAD = `ce39c8f`。Writer 観察: full suite 1 回目で `app-router.test.tsx` の scroll-restoration が 1 度 fail（単独再実行 pass、closure の再実行でも再現せず）— Lane 3 由来の既知 race 系として記録のみ。次 = owner Windows native L3（AC-L3-1〈プルダウンの見た目統一〉/ AC-L3-2〈開閉・選択・「すべて」・キーボード: ↑↓ で開く / IME 頭文字検索なし / ラベル文字クリックで開かない、per-row 画面 1 つを含む〉、介入 2/3）→ Codex ロジックレビュー 1 回（§3.3 pending、9/7 夜）→ Findings Freeze → ready-hosted-final。

- Findings Freeze: not yet frozen（Codex ロジックレビュー待ち）; post-freeze exceptions: none.

### Gated Amendment 2（2026-09-06、Final Review 起源、Coordinator 記録）

- 事象: Writer が S8（ProductForm 部門 / 取引先）の実装中に、`<form>` 内の Radix `Select` が hidden native select（bubble input）の echo で `onValueChange("")` を発火し、同一 render で value と選択肢一覧が変わる場面（非同期取得した既存値の初期表示・作成直後の自動選択）に数値 ID を空で上書きする実バグを発見（`ProductFormPage.test.tsx:217` 付近の既存 duplicate-error test で再現）。呼び出し側の delay hack でなく `src/components/ui/select.tsx` の共有 `Select` で `value === ""` の `onValueChange` を無視する root-cause 修正を Writer commit `348ea3d` で投入（packet 未記載 = 本 amendment で遡及記録）。
- Final Review（Opus、2026-09-06）の裏取り: `@radix-ui/react-select` 2.2.6 `dist/index.mjs:75,115-133,919-922,1070-1085`（`isFormControl` / `SelectBubbleInput` の uncontrolled `defaultValue` + `prevValue !== value` 時の value 代入と `change` dispatch / `SelectItemText` の `useLayoutEffect` 登録が 1 commit 遅れ）で機序を確認、`select.tsx:25` の guard を削除すると `ProductFormPage.test.tsx:246` が fail（1 failed / 9 passed）→ 復元で 10 passed を実測。全 19 `<Select>` 消費者は controlled（`defaultValue` 0 件）で、`SelectItem value=""` は Radix が throw（`dist:825`）かつ DSR-23 で禁止のため、空文字 callback の抑止は同期ずれを起こさない。より狭い代替（数値 3 site の guard / form 限定）は残り 13 site を同じ echo に晒す or Radix 内部依存のため不採用。
- 裁定: 採用。Scope に S13「共有 `Select` の空文字 echo guard」（oracle: `rg -Fc `if (value === "") return;` src/components/ui/select.tsx` = 1）、Matrix に SC15（mutant = guard 削除、kill test = `ProductFormPage.test.tsx` duplicate-error test）、DSR-23 に guard の存在理由 1 文（後から「掃除」されないため）を追加する。是正は Final Review P2 と同じ Writer commit で行う。
- 併記（Final Review P2/P3）: `select.tsx:15` comment の literal `<select` が AC の `rg "<select" src` = 0 を壊す → 文言変更 / SC8a（`ProductForm.test.tsx:782-797`）が `update` 値を assert せず mutant X2 が当該 file で生存 → `expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({ departmentId: 1 }))` を追加 / L8-D6 の条件撤去は vitest oracle なし（static `rg` のみ、PR body にそう書く）/ `disabled` は `SelectTrigger` でなく Root（`Select`）に載せた実装で機能同等（packet 文言の方が古い）。

2026-09-06: owner Windows native L3（HEAD `ce39c8f`、介入 2/3）= **PASS**（原文「基本問題なさそう」、`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md`「⑧ PR #38 L3 結果 原文」）。AC-L3-1 / AC-L3-2 に指摘なし（キーボード 3 点の受容可否は言及なし = 受容と読む、Coordinator 転記）。所感 8 件は全て本 lane の scope 外で Plans.md ④ ledger へ起票する: (1) 入出庫履歴・在庫変動履歴・記録詳細で単位 code `pcs` 生表示（PR #32 S45 の是正対象外だった残り、sweep）(2) badge 無色は ⑦ runtime lane 待ち（想定どおり）(3) 手動販売出庫の記録状態が plain text「有効」→ Badge へ（`inventory-records/types.ts:14` `formatRecordStatus` の描画箇所）(4) 明細数 summary は run 3 原文 (h)「削ってよい」→ 今回「手動販売出庫は残す寄り、何とも言えず」= 未決のまま (5) 記録日時の font 差は既起票（Plans ④ C5、実機観測で機序確定待ち）(6) 備考: 欄は必須、空欄 vs「備考なし」薄字を決める、一定文字数で … 省略、「直近の○○」series 共通化（A1 (a)(b)(c) と統合）(7) 商品一括インポート / PLU 書出し / バックアップにページ説明セクション（title 直下: どういうページか・何をするか・何が起きるか、backbone 原則 8 の 1 行説明の拡張、design-first）(8) 取引先管理の title と説明の間隔が他 page と不一致 → PageHeader 統一 (9) 記録 ID は種別ごとの連番で一意でない → 種別込みの表示（例: 種別 prefix）か一覧から外す、design 判断（DSR-22 の識別列並べ替え候補と統合）。Human Gate 完了。残り = Codex ロジックレビュー 1 回（§3.3 pending、9/7 夜）→ Findings Freeze → ready-hosted-final。
