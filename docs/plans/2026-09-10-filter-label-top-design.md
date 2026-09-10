# Plan Packet: ⑳ フィルタ入力の Label 上置き統一 + セクション見出しの規範化（design-first、docs-only）

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

If a state-only commit materializes multiple phases, list the complete adjacent forward sequence and the pre-existing evidence for every intermediate transition in an append-only review/evidence record. Recording compression never permits a gate skip.

- Phase: plan-draft
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1
- Writer: Codex
- Plan Reviewer: Sonnet + Opus
- Final Reviewer: Sonnet + Opus + Codex
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required（docs-only のため Ready 後の hosted final は owner `workflow_dispatch`。Ready 案内に明記する）
- Human Gate: owner mockup-g 確認（culling 3 件: (1) SegmentedControl の可視 Label 要否 (2) セクション見出しを component 化するか class 統一のみか (3) Checkbox は label 内包の横並び維持でよいか）+ Ready 承認

## Owner Effort Budget

- 介入回数上限: 4（docs-only design。⑱ の実績 = mockup 2 round）
- 実働時間上限: 20分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。使う場合はtarget branch / PRへorder commitを混ぜず、artifact pathと専用remote order branch refを宣言する。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（design-system canonical docs + mockup）。runtime 契約は変えない。後続 runtime lane の前提になる規範を書くため Plan Packet は必要だが、Test Matrix は rg oracle 中心の軽量版。

## Goal

Goal Invariant:

### 最小完了条件

- catalog ⑨ に「フィルタ入力（検索 / Select / date / number / `DepartmentFilter` / 並び替え / 表示件数）は可視 Label を `grid gap-1` で上置きし、toolbar は `items-end`」が**全フィルタ入力の規範**として書かれ、例外（Checkbox / SegmentedControl）が明文化されている
- catalog ① に「セクション見出し（h2 + 説明 + action）」の variation が新設され、`PageHeader` (c) と同じ折返し契約（`items-start` / 左 `min-w-0 flex-1` / 右 `shrink-0`）と「1 ページ 1 h1 は不変」が書かれている
- 適用範囲（どの画面のどの入力 / どの見出しが後続 runtime lane の対象か）が本 packet に file:line で記録され、runtime lane 申し送りになっている
- owner が mockup-g で現行 / 提案を並べて確認し、culling 3 件に回答している

### 失敗定義

- 規範が live SearchBar だけの記述のまま（⑭ の現状）で終わる
- catalog に page の file:line が書かれ、runtime lane 後に即 stale になる
- 1 ページ 1 h1 の規則が崩れる（セクション見出しを `PageHeader` で描く指示になる）
- `src/**` に diff が出る

### 非目的

- runtime 変更（後続 runtime lane。`DepartmentFilter` 1 component の改修で 4 サイトが揃う）
- backbone 原則 7「live + 検索ボタン併記」と catalog ⑨「ボタンなし」の drift 解消（backbone 自身が batch 1〜2 の宿題と記述済み、別件）
- 新規 DSR の起草（Label 配置は catalog の構造 / token 規約で足りる、DSR は「なぜ」を要する判断規則）
- ⑲ 取引先ピッカー runtime lane の trigger の Label 配置（⑲ は現行配置維持、runtime lane で本規範に揃える）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-10、worktree base `bb081e3`、Explore 報告を Coordinator が rg で再確認）

### Backlog の前提訂正

- Backlog `Plans.md:167` の「操作ログ / 取引先管理 等の他フィルタ入力を sweep」は前提が古い。**`OperationLogsPage` / `InventoryRecordsPage` / `StockMovementsPage` は既に全入力 `grid gap-1` 上置き**（`OperationLogsPage.tsx:349-425` / `InventoryRecordsPage.tsx:161-296` / `StockMovementsPage.tsx:135-207`）。取引先管理はフィルタ入力自体が無い（⑲ が検索を新設）。commit 型 `SearchBar` は採用箇所 0（catalog `:606` literal「現在の採用箇所なし・機能残置」）
- 実際の未統一面 = (a) `DepartmentFilter`（shared、`flex items-center gap-2` 横並び `DepartmentFilter.tsx:61-64`、4 サイト）(b) `<label>` + `Select` の横並び対（並び替え / 表示件数 / 取引先）(c) `StocktakePage` の toolbar（`items-center gap-4` `:746`、Checkbox / 表示件数）(d) `IntegrityCheckPage` 表示件数（`:232-251`）

### フィルタ入力の現状（page × input × 配置）

| page | input | component | Label | 配置 | file:line |
|---|---|---|---|---|---|
| 商品一覧（toolbar `flex flex-wrap items-end gap-3` `:105`） | 検索 | SearchBar live | 商品を検索 | 上置き | `ProductListPage.tsx:111-118` |
| 〃 | 部門 | DepartmentFilter | 部門 | 横並び | `:119-129` |
| 〃（2 段目 `flex flex-wrap items-center gap-3` `:155`） | 廃番表示 / PLU表示 / 並び順 | SegmentedControl | `ariaLabel` のみ | 可視 Label なし | `:136-149,177-183` |
| 〃 | 並び替え | `<label>`+Select | 並び替え | 横並び | `:156-159` |
| 〃 | 表示件数 | `<label>`+Select | 表示件数 | 横並び | `:185-188` |
| 在庫照会（`items-end` `:102`） | 検索 / 部門 / 表示件数 | SearchBar live / DepartmentFilter / `<label>`+Select | — | 上置き / 横並び / 横並び | `StockInquiryPage.tsx:104-131` |
| 一括価格改定（`items-end` `:47`） | 検索 / 取引先 / 部門 / 廃番を含む / 表示件数 / 取引先未設定を含める | SearchBar live / `<label>`+Select〈⑲ で trigger 化〉/ DepartmentFilter / Checkbox / `<label>`+Select / Checkbox | — | 上置き / 横並び / 横並び / 横並び(checkbox) / 横並び / 横並び(checkbox) | `PriceRevisionFilters.tsx:48-153` |
| 入出庫履歴 | 記録種別 / 期間 / 検索 / 記録ID / 部門 / 状態 / 表示件数 | Select / date / SearchBar / number / Select / Select / Select | — | **全部上置き** | `InventoryRecordsPage.tsx:161-296` |
| 操作ログ | 期間 / 種別 / 表示件数 | date / Select / Select | — | **全部上置き** | `OperationLogsPage.tsx:349-425` |
| 在庫変動 | 期間 / 種別 / 表示件数 | date / Select / Select | — | **全部上置き** | `StockMovementsPage.tsx:135-207` |
| 棚卸し（`items-center gap-4` `:746`） | 部門 / 未入力のみ表示 / 表示件数 | DepartmentFilter / Checkbox+Label / Label+Select | — | 横並び / 横並び(checkbox) / 横並び | `StocktakePage.tsx:747-789` |
| 整合性検証 | 表示件数 | `<label>`+Select（`flex items-center gap-2`） | 表示件数 | 横並び | `IntegrityCheckPage.tsx:232-251` |
| 入庫 / 手動販売 / 返品交換 / 廃棄 | 商品追加の検索（⑮ `ProductAddSuggest`、フィルタではない） | Label + Input | 商品を検索・スキャン | 上置き（`space-y-2`） | `ReceivingPage.tsx:437-452` / `ManualSalePage.tsx:472-487` / `ReturnExchangePage.tsx:682-697` / `DisposalPage.tsx:371-386` |
| 棚卸し | 商品を検索・スキャン（カウント入力、フィルタではない） | Label + Input | — | 上置き（`space-y-2`） | `StocktakePage.tsx:561-568` |

### 規範の現在地

- catalog ⑨ `:636`「live 型は `div.grid.gap-1` 配下に可視 `Label` を上置きし `Input` を続ける。呼び出し側 toolbar は `items-end`」— **live SearchBar 限定**。`DepartmentFilter` の構造 block（`:620-630`）は横並びのまま。⑨ に page の file:line 引用は 0（`awk '/^## ⑨/,/^## ⑩/' | rg -c "\.tsx:[0-9]+"` = 0、この状態を維持する）
- catalog ⑤ SegmentedControl `:266-` に Label 規定なし
- memory / Backlog の「DSR-01 `:21`」は誤引用（DSR-01 は 1 画面 1 primary の規則で Label 配置の規定なし）
- 04-backbone 原則 7 `:23`「live + 検索ボタン併記」は catalog ⑨「ボタンなし」と drift（backbone 自身が「batch 1〜2 で改める」と記述、本 lane 非目的）

### 手書き見出し（PageHeader を通らない h2）の現状

Backlog `Plans.md:163` の行番号は drift 済み（内容で再特定）。**いずれも sub-section の h2 であり page title ではない**（各 page は別途 `PageHeader` の h1 を持つ）。`PageHeader` は h1 を描くため、これらを `PageHeader` に寄せる案は「1 ページ 1 h1」（catalog `:60`）に反する → 却下。

| site | 現行 | 形 |
|---|---|---|
| `StocktakeProgressHeader.tsx:384-395`（Backlog「StocktakePage:386」） | `flex flex-wrap items-center justify-between gap-3` + h2「棚卸し中…」+ p 進捗 + action | 進捗 banner |
| `MonthlySalesPage.tsx:155-163`（旧 `:82`） | `<section aria-labelledby>` + h2 `text-lg font-semibold` + p | 説明付き、action なし |
| `DailySalesPage.tsx:163-171`（旧 `:82`） | 同上 | 同上 |
| `DisposalPage.tsx:653-660` | `flex flex-wrap items-center justify-between gap-2` + h2「直近の廃棄・破損」+ Button「すべての履歴を見る」 | 直近テーブル見出し |
| `ReturnExchangePage.tsx:935-941` | 同型「直近の返品・交換」 | 〃 |
| `ManualSalePage.tsx:713-716`（旧 `:699`） | 同型「直近の手動販売出庫」 | 〃 |
| `ReceivingPage.tsx:661-667` | 同型「直近の入庫」 | 〃 |
| `IntegrityCheckPage.tsx:325-334`（旧 `:300`） | `flex flex-wrap items-end justify-between gap-3` + h2「差異のある商品」+ p + Button | 説明 + action（PageHeader (c) に最も近い、`items-end`） |
| `IntegrityCheckPage.tsx:438`（旧 `:461`） | `AlertDialogTitle` | **見出しではない → 対象外** |

共通形 = h2（`text-lg` または `text-xl` `font-semibold`）+ 任意 `<p className="text-sm text-muted-foreground">` + 任意右 action、wrapper は `flex flex-wrap items-center|items-end justify-between gap-2|gap-3`。⑮ で `PageHeader` (c) に入れた折返し契約（`items-start` / 左 `min-w-0 flex-1` / 右 `shrink-0`）が無いため、長い説明で action が次行左へ落ちる同型バグを 8 箇所が潜在的に持つ。catalog `:197`「直近の○○」系 4 画面の統一は文型のみで見出し構造の規定なし。catalog `:243`（④ フォームセクション）は h2 token のみ。

## 設計判断（Coordinator adjudication、Plan Review / Human Gate で覆せる）

- **D1 規範の置き場 = catalog ⑨ の使用トークン段落を「すべてのフィルタ入力」に拡張**（DSR 新設なし）。draft literal:
  > **使用トークン**: **すべてのフィルタ入力**（検索 / Select / date / number / `DepartmentFilter` / 並び替え / 表示件数）は `div.grid.gap-1` 配下に可視 `Label`（`text-sm text-muted-foreground`）を上置きし、入力要素を続ける。呼び出し側 toolbar は `flex flex-wrap items-end gap-3` で入力欄の下辺を揃える（⑭ で live 型 SearchBar に導入した形を全入力へ拡張。owner 2026-09-08「検索ツールの場所の表記は揃えたい」）。例外: **Checkbox は label 内包の横並び**（`<label class="flex items-center gap-2">` に `Checkbox` + 文言、checkbox の慣行）を維持し、**SegmentedControl は可視 Label を持たない**（選択肢文言が自己記述、`ariaLabel` 必須。⑤ 参照）。live 型 SearchBar は `Input` の `max-w-md` 維持。`id` 未指定時は `useId()`…（以下既存文を維持）
- **D2 `DepartmentFilter` の構造 block（⑨ `:620-630`）と canonical 説明を上置き形へ改める**（`<div className="grid gap-1"><Label htmlFor>部門</Label><Select …/></div>`）。component 1 箇所の改修で 4 サイトが揃うことを「runtime 反映」注記に書く（file:line は書かない）
- **D3 catalog ⑨ に page の file:line を書かない**（stale 化防止）。適用範囲の実測表は本 packet に置き、runtime lane packet が引き継ぐ。catalog には「一覧 / 記録画面の toolbar 全部」と書く
- **D4 セクション見出し = catalog ① の variation として新設**（「**バリエーション: セクション見出し（h2）**」、`:56` 使用トークン段落の直前）。draft literal:
  > **バリエーション: セクション見出し（h2）**: page 内の sub-section（「直近の○○」テーブル / 公式部門集計 / 差異のある商品 / 棚卸し進捗 等）の見出しは h2（`text-lg font-semibold`）+ 任意の説明 `<p className="text-sm text-muted-foreground">` + 任意の右 action で構成し、wrapper は `PageHeader` (c) と同じ折返し契約（外側 `flex flex-wrap items-start justify-between gap-3`、左 group `min-w-0 flex-1 space-y-1`、右 `shrink-0`）に従う。長い説明で action が次行左へ落ちるのを防ぐ（⑮ Gated Amendment 2 と同じ根拠）。**1 ページ 1 h1 は不変**であり、sub-section を `PageHeader` で描かない。canonical: `SectionHeader{title, description?, actions?}`（後続実装、`src/components/patterns/SectionHeader.tsx` 想定。**Human Gate (2)** で component 化 / class 統一のみ を確定）。Dialog の `AlertDialogTitle` は対象外
  - Coordinator 推奨 = **component 化**。理由: 同型 8 箇所（rule of three の 2.6 倍）、折返し契約は class 4 組の同時適用で「1 つ落とすと再発」する種類のもの。却下案 = class 統一のみ（diff は小さいが 8 箇所の手書き維持）
- **D5 SegmentedControl は可視 Label なし（D1 例外）を Coordinator 既定とし Human Gate (1) で確認**。理由: 「廃番表示」「PLU表示」の選択肢文言（`PRODUCT_DISCONTINUED_OPTIONS` 等）が自己記述で、Label を足すと toolbar が縦に膨らむ。owner が「揃えたい」を優先するなら上置き Label を足す（runtime lane で `SegmentedControl` に `label?` prop）
- **D6 mockup-g（`docs/design-system/reference/mockup-g-filter-toolbar.html`）を新設**、state-1 商品一覧 toolbar 現行 / 提案（SegmentedControl 両案）、state-2 棚卸し toolbar（Checkbox 横並び維持）、state-3 セクション見出し（「直近の入庫」に長い説明 + action、現行の折返し崩れ / 提案）。CSS token は `mockup-d-lists.html` を流用、外部 CDN / JS なし
- **D7 ⑲ との境界**: ⑲ は `PriceRevisionFilters` の取引先を trigger 化するが Label 配置は現行維持（⑲ Non-scope）。本規範の runtime lane が trigger の wrapper も `grid gap-1` へ揃える。catalog 更新履歴表の末尾で ⑲ と textual conflict が出る想定 → 後続 merge 側が両側保持

## Scope

- **S1 catalog ⑨ 改訂**（`02-component-catalog.md:602-660`）: 使用トークン段落を D1 literal へ / `DepartmentFilter` 構造 block を D2 へ / 使いどころに「toolbar の全フィルタ入力」を 1 句 / **状態** bullet に「Checkbox / SegmentedControl の例外」を残さず D1 の 1 段落に集約（重複記述しない）
- **S2 catalog ① 改訂**（`:24-56`）: D4 variation 新設（`:56` 使用トークンの直前）/ `:197`「直近の○○」系 4 画面の統一 段落末尾に「見出し構造は ① セクション見出し variation に従う」1 句
- **S3 catalog ⑤ SegmentedControl**（`:266-`）: 「可視 Label を持たない（⑨ D1 例外）、`ariaLabel` 必須」を状態 / a11y bullet に 1 行（Human Gate (1) の結果で確定文にする。回答前は draft literal のまま）
- **S4 mockup-g 新設 + `reference/README.md` 一覧表に 1 行登録**（D6）
- **S5 更新履歴**: `02-component-catalog.md` 更新履歴表に 1 行（PR 番号は Draft PR 作成後に Writer が埋める、無ければ「本 PR」）
- **S6 runtime lane 申し送り（本 packet に記録、Writer は書かない）**: `DepartmentFilter.tsx:61-64` → `grid gap-1`（4 サイト一括）/ `ProductListPage.tsx:156-159,185-188` / `StockInquiryPage.tsx:129-131` / `PriceRevisionFilters.tsx`（表示件数 `:115-119`、取引先 trigger〈⑲ 後〉）/ `StocktakePage.tsx:746-789`（toolbar `items-center gap-4` → `items-end gap-3`、表示件数上置き、Checkbox 維持）/ `IntegrityCheckPage.tsx:232-251` / 商品追加検索 5 箇所の `space-y-2` → `grid gap-1`（任意、⑮ ProductAddSuggest wrapper）/ `SectionHeader` 新設 + 8 箇所置換（Human Gate (2) 次第）/ SegmentedControl `label?`（Human Gate (1) 次第）

## Non-scope

- `src/**` / `src-tauri/**` 一切
- 04-backbone 原則 7 の drift（検索ボタン併記）
- DSR 新設、`01-decision-rules.md` の変更（本 lane は catalog + mockup のみ）
- `docs/SCREEN_DESIGN.md`（Label 配置の記述なし、Explore 実測）
- `docs/function-design/*`（各画面の doc は toolbar の Label 配置を規定していない。runtime lane で必要なら同期）
- `Plans.md` の Backlog 前提訂正は Coordinator が plan-first commit で行う（Writer は触らない）
- ⑲ lane の file（`01-decision-rules.md:25` / catalog `:578-598` picker 小節 / 51 / 61 / 77 / 78）

## Acceptance Criteria

docs-only のため rg oracle（出力空 = 0 件）。baseline は起票時実測。

- **AC1** `rg -c "すべてのフィルタ入力" docs/design-system/02-component-catalog.md` ≥ 1（baseline 0）
- **AC2** `awk '/^## ⑨/,/^## ⑩/' docs/design-system/02-component-catalog.md | rg -c 'className="grid gap-1"'` ≥ 1（baseline 0、D2 の DepartmentFilter block）
- **AC3** `rg -c "label 内包の横並び" docs/design-system/02-component-catalog.md` ≥ 1（baseline 0）/ `rg -c "可視 Label を持たない" docs/design-system/02-component-catalog.md` ≥ 2（baseline 0、⑨ D1 + ⑤ S3）
- **AC4** `rg -c "バリエーション: セクション見出し" docs/design-system/02-component-catalog.md` = 1（baseline 0）/ `rg -c "SectionHeader" docs/design-system/02-component-catalog.md` ≥ 1（baseline 0）/ `awk '/^## ①/,/^## ②/' … | rg -c "min-w-0 flex-1"` ≥ 2（baseline 1）
- **AC5**（負の oracle、D3）`awk '/^## ⑨/,/^## ⑩/' docs/design-system/02-component-catalog.md | rg -c "\.tsx:[0-9]+"` = 0（baseline 0、維持）
- **AC6**（負の oracle）`rg -c "1 ページ 1 個の h1" docs/design-system/02-component-catalog.md` = 1（baseline 1、不変）/ `rg -n "sub-section を .PageHeader. で描かない|PageHeader で描かない" docs/design-system/02-component-catalog.md | wc -l` ≥ 1
- **AC7** `fd -g "mockup-g-filter-toolbar.html" docs/design-system/reference | wc -l` = 1（baseline 0）/ `rg -c "mockup-g" docs/design-system/reference/README.md` ≥ 1（baseline 0）/ `rg -c "<script|https?://" docs/design-system/reference/mockup-g-filter-toolbar.html` = 0
- **AC8** `awk '/^## 更新履歴/,0' docs/design-system/02-component-catalog.md | rg -c "セクション見出し"` ≥ 1（baseline 0）
- **AC9** `git diff --name-only origin/main..HEAD -- src src-tauri docs/design-system/01-decision-rules.md docs/function-design | wc -l` = 0
- **AC10** `bash scripts/doc-consistency-check.sh` ERROR 0 / `bash scripts/check-workflow-git.sh` PASS / `bash scripts/tests/reading-order-drift.test.sh` PASS / `npm run format:check` PASS（docs は `.prettierignore` 除外、既定どおり）
- **AC-HumanGate** owner が mockup-g を実機 3 画面（商品一覧 / 棚卸し / 入庫の直近テーブル）と並べ、culling (1)(2)(3) に回答。回答は Gated Amendment で catalog の draft literal を確定文へ

## Design Sources

- Requirements / spec: owner 2026-09-08「検索ツールの場所の表記は揃えたい、今回は商品を検索だけ」（Plans.md `:167`）、⑮ Writer 実測の手書き header 9 箇所（Plans.md `:163`）
- Architecture: 該当なし
- Function / command / DTO: 該当なし
- DB: 該当なし
- Screen / UI: `docs/design-system/02-component-catalog.md` ① / ⑤ / ⑨ / `:197`、`04-backbone.md` 原則 6 / 7、`reference/mockup-d-lists.html`（token 流用元）、`PageHeader.tsx:31-43`（折返し契約の実装）
- Decision log / ADR: 追加なし

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | catalog ① / ⑤ / ⑨、mockup-g | updated in this PR |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| Durable decision / ADR | 該当なし（catalog の構造規約で足りる） | intentionally deferred（DSR 化しない） |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| mockup-g（reference doc 新設） | `docs/design-system/reference/README.md` 一覧表へ登録（S4）。他の生成義務は該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| owner 2026-09-08 揃えたい | catalog ⑨ `:636` | D1 / D2 / D3 | 全入力へ拡張、file:line は書かない。却下 = DSR 新設 | S1 | AC1〜3 / AC5 |
| ⑮ PageHeader (c) 折返し契約 | catalog ① `:48-52` | D4 | 8 箇所同型、1 h1 不変。却下 = PageHeader 流用 | S2 | AC4 / AC6 |
| SegmentedControl の Label | catalog ⑤ | D5 | 自己記述で Label 不要（Human Gate (1)） | S3 | AC3 |
| mockup 運用 | reference/README | D6 | 静的 HTML、token 流用 | S4 | AC7 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: S1 / S2 後は yes（規範 + 例外 + 根拠が catalog にある）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: D1 / D4 / D5 → catalog
- Assumptions and constraints: Checkbox 横並びは慣行（Human Gate (3)）
- Deferred design gaps, risk, and follow-up target: backbone 原則 7 drift（既存宿題）、runtime lane（S6）
- Test Design Matrix can cite design decision IDs or source doc sections: yes
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外 2 種（Checkbox / SegmentedControl）を D1 に明文化、他に例外なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable | — |
| Fact check / design decision split | Backlog の前提（操作ログ等未統一）は事実誤り → 本 packet で訂正、Plans.md も plan-first commit で訂正 | Plans.md |
| Lifecycle / retry | not applicable | — |
| Operator workflow | Label 上置きで toolbar が 1 行分高くなる（既に入出庫履歴 / 操作ログで実装済みの形、owner 既視） | AC-HumanGate |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | mockup-g を実機と並べる | AC-HumanGate |
| 環境・再現性 | not applicable | — |

## Design Readiness

- Existing design docs are sufficient because: 規範の形は ⑭ / ⑮ で実装・記述済み（live SearchBar / PageHeader (c)）。本 lane はその適用範囲を広げる記述
- Source docs updated in this PR: catalog ① / ⑤ / ⑨ / 更新履歴、reference/README、mockup-g
- Design gaps intentionally deferred: backbone 原則 7、DSR 化
- Durable decisions discovered in this plan and promoted to source docs: D1 / D4 / D5

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): docs のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: Label 文言は現行のまま（部門 / 並び替え / 表示件数 / 取引先）
- Error, empty, retry, and recovery behavior: 該当なし
- Testability and traceability IDs: AC1〜AC10

## Contract Probe

N/A。外部前提なし（docs-only）。

## Contract Coverage Ledger

R2 のため簡略。

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| D1 全フィルタ入力の上置き規範 + 例外 | S1 | AC1 / AC3 | AC-HumanGate |
| D2 DepartmentFilter 構造 block | S1 | AC2 | non-scope（runtime lane） |
| D3 file:line を書かない | S1 | AC5 | — |
| D4 セクション見出し variation | S2 | AC4 / AC6 | AC-HumanGate (2) |
| D5 SegmentedControl 例外 | S3 | AC3 | AC-HumanGate (1) |
| D6 mockup-g | S4 | AC7 | AC-HumanGate |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-10-filter-label-top-design.md](test-matrices/2026-09-10-filter-label-top-design.md)

- targeted tests: AC1〜AC8 の rg / awk / fd oracle
- negative tests: AC5 / AC6 / AC9
- compatibility checks: 既存 ⑨ の live 型 SearchBar 記述（`max-w-md` / `useId()` / 既定 label）が残る（`rg -c "useId" catalog` 不変）
- data safety checks: 該当なし
- main wiring/integration checks: 該当なし

## Boundary / Wire Contract

該当なし（docs-only）。

## Review Focus

- D1 の段落が既存の live 型 SearchBar 記述を**置換でなく拡張**していること（`max-w-md` / `useId()` / 既定「商品を検索」が残る）
- catalog ⑨ に page の file:line が入っていないこと（AC5）
- ① variation が「1 ページ 1 h1」と矛盾しないこと、`PageHeader` の (c) 契約の literal（`items-start` / `min-w-0 flex-1` / `shrink-0`）と一致していること
- Human Gate 未回答の 3 件が確定文になっていないこと（draft literal のまま、両論併記）
- mockup-g が `mockup-d-lists.html` の token を流用し、新規 CSS 系統・外部 CDN・JS を持たないこと
- 更新履歴 1 行のみで、他 section の文言を触っていないこと

## Spec Contract

R2 のため簡略。Contract ID: SPEC-FILTERLABEL-D-1 — catalog ⑨ / ① / ⑤ に上置き規範・例外・セクション見出し variation が draft literal どおり転記され、mockup-g が登録される。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-FILTERLABEL-D-1 | S1 | AC1 / AC2 / AC3 / AC5 | 拡張であり置換でない | rg |
| SPEC-FILTERLABEL-D-1 | S2 | AC4 / AC6 | 1 h1 不変 | rg |
| SPEC-FILTERLABEL-D-1 | S3 | AC3 | draft literal | rg |
| SPEC-FILTERLABEL-D-1 | S4 | AC7 | token 流用 | fd / rg |
| SPEC-FILTERLABEL-D-1 | S5 | AC8 | 1 行のみ | awk |

## Data Safety

- what must not be committed: なし
- local-only paths: `.local/codex-orders/**`、`.local/preview/**`（Human Gate 用の写し）
- synthetic-only paths: 該当なし

## Writer Instructions

- Codex `model_reasoning_effort=medium`。docs-only、編集してよい file = `02-component-catalog.md` / `reference/README.md` / `reference/mockup-g-filter-toolbar.html`（新規）の 3 file のみ。他に diff が出たら push せず停止
- 着手前: `git status --short` 空 → `git checkout --detach <遷移 commit SHA>` → `rev-parse --short HEAD` を報告。packet / Matrix / Plans.md / PR body は編集しない
- 各 S の転記元は本 packet「設計判断」の draft literal。**再導出・言い換えしない**。Human Gate 3 件は draft literal のまま（確定文にしない）
- docs は `.prettierignore` 除外のため `format:check` は既定どおり実行して PASS を報告すればよい（前提不一致ではない）
- mockup-g は単一 HTML + inline CSS、`mockup-d-lists.html` の `:root` 変数と `.tbl` / `.field` 系 class を複製。外部 CDN / JS なし
- 完了後に worktree を自分で detach する。`git add` は明示 path、`HEAD:branch` push 禁止
- ponytail block（verbatim）:

```
### 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか (5) 導入済み依存で済むか (6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
