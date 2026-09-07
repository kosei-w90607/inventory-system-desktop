# Plan Packet: UI 規約の runtime 反映（⑭、状態 Badge tone・CTA 中間段・検索欄 Label・Alert warning・DSR-08 増減色）

⑦（design-first 候補提示、PR #39 squash `6ff2247`、[archived packet](../archive/plans/2026-09-05-ui-conventions-batch-design.md) / [Matrix](../archive/plans/test-matrices/2026-09-05-ui-conventions-batch-design.md)）は design-system canonical docs（`00-foundations.md` / `01-decision-rules.md` / `02-component-catalog.md`）のみを改訂した docs-only packet で、Non-scope に「`src/**` の実装変更全て」を明記し runtime 反映を後続 lane（本 lane）へ申し送った。本 lane はその runtime 反映（状態 Badge の `tone` prop 化・CTA `secondary` 中間段・SearchBar live 型可視 Label・Alert `warning` variant・DSR-08 増減数値の色）と、あわせて発見された `01-decision-rules.md` の DSR-23 重複ブロック・`04-backbone.md`/catalog の陳腐化 anchor を是正する docs 同期を扱う。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Codex（`model_reasoning_effort=medium`、難所と判断した箇所は Coordinator 判断で high へ昇格）
- Plan Reviewer: Opus 5（read-only claims-producer）+ 独立 Sonnet subagent（fresh context）
- Final Reviewer: Sonnet subagent（fresh context）一次 + Codex ロジックレビュー、裁定は Fable
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（状態 Badge tone 6 画面 / CTA secondary の見え方 / 検索欄 Label / 一括価格改定 warning Alert）

## Owner Effort Budget

- 介入回数上限: 5
- 実働時間上限: 45分
- relay 往復上限: 3
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 5 回の内訳: 1 回目 = 起票承認。2〜3 回目 = owner Windows native L3（1〜2 round）。4 回目 = Ready 承認。5 回目 = 予備（追加 L3 round または承認 + merge 代行）。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator が業務判断に使う状態表示（在庫状態・PLU 反映状況・整合性チェック補正・CSV 取込み結果）の視覚言語を切り替える（badge の tone・icon 有無）ほか、CTA の階層（`secondary` 中間段の新設）・検索欄の accessible name（`aria-label` → 可視 `<Label>`）・一括価格改定の注意文言の見た目（warning Alert への切替）を変更する。DB スキーマ・Tauri command・route/search state の変更はない。既存 test の `getByLabelText("商品検索")`（一部 `findByLabelText`）は可視 Label 化で解決手段自体は維持されるが、`aria-label` 撤去を検証する negative oracle の追加や、queryByText の否定アサーション反転が要る（`InventoryRecordsPage.test.tsx:744`）。CTA class 変更は既存 test が role+name query のため解決性は壊れないが、変化そのものを検証する新規 class oracle が要る。DEV_WORKFLOW Risk Tiers の R3「operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

## Goal

Goal Invariant:

### 最小完了条件

- `badge.tsx` に `tone`（`warning`/`success`/`destructive`、既定なし）を追加し、①状態 badge の非中立サイト（起票時実測で列挙した全サイト）が `variant="outline"` + `tone` + 非中立 icon に置換される
- `badge.tsx` の `secondary` variant が `border-border` を持ち、`StocktakePage.tsx:624,854` の手動 `border-border` 併記が不要になり削除される
- ③強調サイト（`ProductRankingTable.tsx:80` / `ProductImportPreview.tsx:76` / `BackupRestorePage.tsx:533`）が `border-warning` 枠を持ち、`BackupRestorePage.tsx:533` は `variant="secondary"` → `variant="default"` の種類取り違えも是正される
- `button.tsx` の `secondary` variant が `border border-border` を持ち、CTA 中間段 3 サイト（`ProductForm.tsx` 2 箇所 / `PriceRevisionFilters.tsx` 1 箇所）が `secondary` へ降格する
- `StocktakePage.tsx:863,1002` の `formatListDifference` 表示と `IntegrityCheckPage.tsx:377-378` の差異数値に DSR-08 の色規則（+ = `text-success-strong` / − = `text-destructive-strong` / 0 = `text-muted-foreground`）が適用される
- `SearchBar.tsx` の live 型が可視 `<Label>`（既定文言「商品を検索」）を持ち `aria-label` を持たなくなる。commit 型は不変
- `alert.tsx` に `warning` variant が追加され、`PriceRevisionPage.tsx:79-83` と 14 箇所の手書き warning Alert（起票時実測列挙）が `variant="warning"` へ移行し、`HomePage.tsx:78` に `AlertTriangle` icon が追加される
- `01-decision-rules.md` の重複 DSR-23 ブロック（`:469-479`）が除去され、catalog/backbone の陳腐化 anchor（`PriceRevisionPage.tsx:112`、DailySalesPage/MonthlySalesPage の「未取込み」誤citation）が是正される

### 失敗定義

- badge/button/alert 側の token 変更が、tone 未指定の既存 variant（`default`/`secondary`/`outline`/`ghost`、`alert` の `default`/`destructive`）の見た目を変える
- 非中立の①状態 badge に icon が付かない、または中立 badge（`通常`/`formatRecordStatus` 等）に tone が誤って付く
- 「取込み済み」/「確認済み」/「成功」/「部分成功」を出し分ける単一 Badge（`DailyReportImportPage.tsx:163-182`、`ResultStep.tsx:47`）で、意図しない分岐に tone が付く、または既存の `requiresAdditionalConfirm` 分岐（既に warning 相当の className を持つ）が二重着色になる
- `SearchBar.tsx` の commit 型（`aria-label` + 可視 Label 併存）が誤って変更される、または live 型の `aria-label` 撤去で `StockInquiryPage.test.tsx:467` の `getByRole("searchbox")` が解決できなくなる
- DailySalesPage.tsx:175 / MonthlySalesPage.tsx:166 の「レジ日報は未取込みです」（plain `<p>`、Alert ではない）を誤って Alert 化する（catalog の誤 citation を実装要求と取り違える）
- Non-scope（下記）に挙げた項目まで誤って変更してしまう

### 非目的

- ⑩ runtime 項目（`PageHeader` root-cause fix、ページ説明文 3 画面、記録 ID 列撤去、備考「—」、`ManualSalePage.tsx` 記録状態 Badge 化、`formatQuantity` 9 箇所統合、`MovementTable` note 全文アクセス）— 別 lane。footprint が `ManualSalePage`/`InventoryRecordsPage` で本 lane と重なるため意図的に後続へ回す
- 中立 ①状態 badge の文言 culling（`有効` 等、`formatRecordStatus` 共有）
- `selection-tone.ts` L5-D2 drift（別 Backlog）
- `--list-toolbar`（`--card` に superseded 済み、起票なし）
- (d) 在庫照会の検索条件・展開行再クリック（⑨ で完了済み、別 lane）
- `destructive` Alert variant の soft-fill 化（⑦ Non-scope を継承、対称性は後続候補）
- 新規 DSR の起草（本 lane は DSR-23 の重複除去と既存 DSR-01/08/22 の runtime 反映のみ）
- DB / Tauri command / route / DTO の変更（なし）

## 起票時実測（2026-09-08、worktree base `47f2163` = origin/main、すべて本 packet 起草者が rg で再確認。⑦ design batch 起票時実測〈2026-09-05〉からの再測定 — ⑦ が merge 済みのため catalog/token 側は「反映済み」、runtime 側は依然「未反映」で drift なし〈token 系〉/ drift あり〈test 件数・DailySalesPage 系 anchor〉の 2 系統に分かれる）

**S1 badge.tsx の現状**（`src/components/ui/badge.tsx`）:
- `:7-26` の `badgeVariants`。base（`:8`）は `border border-transparent`。variant は `default`（`:12`）/`secondary`（`:13`, `bg-secondary text-secondary-foreground`, 枠なし）/`destructive`（`:14-15`）/`outline`（`:16-17`, `border-border-strong`）/`ghost`（`:18`）/`link`（`:19`）の 6 種、`tone` は存在しない
- `StockStatusBadge.tsx`（`src/features/stock-inquiry/components/StockStatusBadge.tsx`）: `:16-20` の `STATUS_STYLE` 定数（`ok`=中立 stone / `low`=warning / `stockout`=destructive）を `:25`（stockout badge）/`:34`（low badge）/`:42`（ok badge）で `className={cn("font-medium", STATUS_STYLE.x)}` として適用。tone 化しても同じ 3 クラス文字列を出す限り behavior-identical

**S2 ①状態 tone 未反映サイト**（catalog tone table `02-component-catalog.md:836-839` に既に列挙済み、file:line を再確認）:
- warning: `ProductTable.tsx:88`（`src/features/products/components/ProductTable.tsx`、`variant="secondary"` + `Clock3` icon 既存「未反映」）/ `ResultStep.tsx:47`（`src/features/csv-import/components/ResultStep.tsx`、`<Badge variant={isPartial ? "outline" : "secondary"}>{isPartial ? "部分成功" : "成功"}</Badge>` の単一 Badge が warning〈部分成功〉と success〈成功〉を同時に出し分ける）/ `DailyReportImportPage.tsx:163-182`（`src/features/daily-report-import/DailyReportImportPage.tsx`、単一 `<Badge variant={alreadyImported ? "destructive" : requiresAdditionalConfirm ? "outline" : "secondary"} className={requiresAdditionalConfirm ? "border-warning-border bg-warning-soft text-warning-strong" : undefined}>` が 3 分岐〈`alreadyImported`→「取込み済み」destructive 塗り→warning tone 化対象、`requiresAdditionalConfirm`→「同日データあり」既に warning 相当の className 手書き済み〈gated Amendment 5 の遺産、tone prop 化で置換〉、else→「確認済み」secondary→success tone 化対象〉を持つ）/ `CsvImportRecordDetailPage.tsx:140`（下記 destructive 項参照、`部分成功`分岐が warning）
- success: `IntegrityCheckPage.tsx:389`（`bg-success text-primary-foreground` 直塗り「補正済み」）/ `StocktakePage.tsx:404`（同型「未入力 {progress.uncounted_items}」全数完了時の pill、`:396-401` の未完了時 warning branch は既に tone 相当の className 手書き済み）/ `ProductTable.tsx:93`（`variant="default"` 橙「反映済み」）/ `ResultStep.tsx:47`・`DailyReportImportPage.tsx:163-182`（上記と同一サイト、それぞれ else 分岐）/ `DailyReportImportPage.tsx:322`（`<Badge>成功</Badge>`、variant 未指定=default）/ `CsvImportRecordDetailPage.tsx:140`（下記 destructive 項参照、`成功`分岐が success）
- destructive: `CsvImportRecordDetailPage.tsx:140`（`src/features/inventory-records/CsvImportRecordDetailPage.tsx`、`<Badge variant="outline">{STATUS_LABELS[detail.status]}</Badge>`。`STATUS_LABELS`（`:38-42`）は `completed`="成功"/`completed_partial`="部分成功"/`rolled_back`="取消済み" の 3 値を返す共有定数）/ `CsvImportRecordDetailPage.tsx:192`（`<Badge variant="outline">明細取消済み</Badge>`、常に destructive）。**Coordinator adjudication（2026-09-08、open question Q1 是正）**: 当初 destructive（`rolled_back`）のみ先行是正としていたが、tone family は感情区分（catalog `:830`「緑=終わったプラスの報告／琥珀=ちょっと待って／赤=警告」）である以上、同じ状態語には画面を問わず同じ tone を当てるのが原則 — `ResultStep.tsx:47`/`DailyReportImportPage.tsx:163-182` が同じ「成功」「部分成功」語をそれぞれ success/warning にしているのに `:140` だけ tone なしで残すと、同一語が画面によって色を持ったり持たなかったりする不整合になる。`completed`→success/`completed_partial`→warning/`rolled_back`→destructive の 3 値すべてに tone を適用する
- 非中立 tone には icon 必須（DSR-22）。既存 icon 再利用: warning=`AlertTriangle`（`StocktakePage.tsx:923` 等で既に多用）、success=`CheckCircle2`（`StocktakePage.tsx:700,405` 等）、destructive=`CircleAlert`/`CircleAlertIcon`（`StockStatusBadge.tsx:7,26` で在庫切れに使用中の先例）。新規 icon import は増やさない
- 中立のまま変更しない: `StockStatusBadge.tsx:42`「通常」、`formatRecordStatus` 共有（`inventory-records/types.ts`）、`differenceLabel` 由来の Badge（`IntegrityCheckPage.tsx:383`、下記 S3 参照）

**S3 DSR-08 増減数値の色**: `formatListDifference`（`src/features/stocktake/lib/stocktake-formatters.ts:21-25`、`+N`/`N`/`—` の文字列を返すのみで色を持たない）の呼び出し元 2 箇所 `StocktakePage.tsx:863`（`computeListDifference(item)`）/`:1002`（`item.difference`）はいずれも `<TableCell className="text-right">` で無色。`IntegrityCheckPage.tsx:377-378`（`<span className="font-semibold tabular-nums">{item.difference > 0 ? "+" : ""}{item.difference...}</span>`）も無色 — 隣接する `:383` の `<Badge variant="outline">{differenceLabel(item.difference)}</Badge>` は catalog の「表から除外した項目」（`:841`）どおり tone 対象外のBadgeのまま変更しない、色付けは `:377-378` の span 自体に対して行う。**一括価格改定（`PriceRevisionTable.tsx`）に増減数値は存在しない**（`差額`/`margin`/`profit` を rg で検索し 0 hit、確認済み）— DSR-08 適用対象なし

**S4 CTA 中間段**: `button.tsx:17` の `secondary` variant（`"bg-secondary text-secondary-foreground hover:bg-secondary/80"`、枠なし）。`ProductForm.tsx:322-331`（`<Button type="button" variant="outline" size="sm" ...>新しい取引先を追加</Button>`）/`:352-388`（`<Button type="button" size="sm" disabled={isCreatingSupplier} ...>追加する</Button>`、variant 未指定=default）/`PriceRevisionFilters.tsx:82-89`（`<Button type="button" variant="outline" ...>新しい取引先を追加</Button>`）の 3 箇所。`SupplierManagementPage.tsx:22-30`（`<Button type="button" onClick=...><Plus />新しい取引先を追加</Button>`、variant 未指定=default）は画面の唯一の主動線のため primary のまま変更しない。既存 test は role+name query のため解決性は壊れない（確認済み）: `ProductForm.test.tsx:648,650`（`getByRole("button", {name: "新しい取引先を追加"/"追加する"})`）/`PriceRevisionPage.test.tsx:535,537`（同型）/`SupplierManagementPage.test.tsx:124,126`（同型、こちらは primary のまま変更なし対象の確認用）

**S5 SearchBar**: `SearchBar.tsx` の `LiveSearchBar`（`:111-185`）は `Omit<SearchBarProps, "label" | "id" | "showSubmitButton" | "wrapperClassName">`（`:119`）で `label`/`id` を受け取れず、`<Label>` を描画せず、`aria-label={inputAriaLabel}`（`:181`、既定「商品検索」）のみを持つ。`CommitSearchBar`（`:35-105`）は `<Label htmlFor={inputId}>`（`:72-74`）+ `aria-label={inputAriaLabel}`（`:80`）の両方を持つ（catalog は commit 型のこの併存を維持と明記、変更しない）。4 呼び出しサイトはいずれもラベル省略（既定文言が適用される）: `InventoryRecordsPage.tsx:214`（`<SearchBar value=... debounceMs={200} onSearchChange=... />`、ラベルなし）/`StockInquiryPage.tsx:103`/`PriceRevisionFilters.tsx:47`/`ProductListPage.tsx:110`。
test 影響（re-count、task 提示値からの drift あり）:
- `SearchBar.test.tsx`: `getByLabelText("商品検索")` **8 箇所**（`:27,48,59,69,92,108,121,133`、commit 型 describe ブロック内。task 提示の 9 は over-count）
- `ProductListPage.test.tsx`: `getByLabelText("商品検索")` **9 箇所**（`:215,244,302,325,448,471,480,507,542`。task 提示の 12 は over-count）
- `InventoryRecordsPage.test.tsx`: **`findByLabelText("商品検索")`（非同期）6 箇所**（`:559,599,629,656,716,741`）+ **negative assertion 1 箇所**（`:744` `expect(screen.queryByText("商品検索", { selector: "label" })).not.toBeInTheDocument()` — 現状「可視 label が無いこと」を検証しており、live 型に可視 Label を追加すると **この assertion 自体を反転**する必要がある。task 提示の「11 箇所 getByLabelText」は実態と異なる（`findByLabelText` 6 + 反転対象 negative 1 が正）
- `StockInquiryPage.test.tsx`: `getByLabelText("商品検索")` は **0 箇所**。実際は `:467` `screen.getByRole("searchbox")` で role query しており `aria-label` 撤去の影響を受けない（task 提示の「2 箇所」は誤り、この画面は SearchBar Label 変更で test 修正不要）
- `PriceRevisionPage.test.tsx`: SearchBar 関連の `getByLabelText`/`findByLabelText` query は **0 箇所**（検索は `mockSearchProducts` の呼び出し引数で検証しており、input 自体を label で特定していない）。test 修正不要
- 上記いずれも `aria-label` 撤去後に `getByLabelText`/`findByLabelText("商品検索")` は可視 `<Label>` を accessible name として引き続き解決できる（Testing Library は `<label>` 関連付けと `aria-label` の両方を `getByLabelText` の対象にするため、解決手段の変更は不要）

**S6 Alert warning**: `alert.tsx:6-20` の `alertVariants` は `default`（`:11`）/`destructive`（`:12-13`）の 2 種のみ、`warning` は存在しない（`alert.test.tsx` も存在しない）。`PriceRevisionPage.tsx:79-83`（`<Alert role="note"><AlertDescription>...</AlertDescription></Alert>`、variant 未指定=default、`AlertTitle` なし）。**14 箇所の手書き warning Alert**（`rg -n 'border-warning bg-warning-soft text-warning-strong' src --glob '!*.test.*'` で完全一致確認、task 提示リストと file:line 完全一致・drift なし）: `StocktakePage.tsx:922`、`PluExportPage.tsx:407,434,444,534,698`、`IntegrityCheckPage.tsx:278,317,438`、`PreviewStep.tsx:60`、`DailyReportImportPage.tsx:152`、`DailySalesPage.tsx:183`、`PluNotificationBar.tsx:24`、`BackupRestorePage.tsx:578`。`HomePage.tsx:78`（`<Alert variant="destructive"><AlertTitle>前日分が未取込みです</AlertTitle>...`、icon なし）は catalog `:404` の指示どおり destructive のまま `AlertTriangle` icon のみ追加。
**catalog citation の drift（S7 対象）**: catalog `:404` は「日次 / 月次売上の『レジ日報は未取込みです』（`DailySalesPage.tsx:175`、`MonthlySalesPage.tsx:166`）は warning variant」と記す。実測すると **両方とも plain `<p className="rounded-md border border-dashed ...">この日付のレジ日報は未取込みです。</p>`**（`DailySalesPage.tsx:175`）/ 同型（`MonthlySalesPage.tsx:166`）で **Alert ではない**。catalog は `MonthlySalesPage.tsx:166` だけでなく `DailySalesPage.tsx:175` も実装ターゲットとして書けていない（plain text を Alert 化する変更は本 lane の Scope に含めない、`<p>`→`<Alert>` への構造変更は「注意喚起」の新規適用でありこの packet の Goal Invariant〈既存 warning 表現の variant 統一〉を超える）。S7 で catalog `:404` のこの 1 文を「plain text のまま、Alert 化は対象外」と訂正する

**S7 (drift 訂正対象の docs anchor)**:
- `01-decision-rules.md:457-467` と `:469-479` に **同一の DSR-23 見出し・本文が verbatim 重複**（`rg -n "^## DSR-23"` で 2 hit 確認、`sed` 突合で内容完全一致確認済み）。`:481` の `## 更新履歴` 直前が `:469-479`（2 個目のブロック）
- catalog `:404` の DailySalesPage/MonthlySalesPage citation drift（上記 S6 参照）
- `04-backbone.md` の badge/枠記述・foundations 反映表は ⑦ で既に runtime gap として記録済み（`:44` token 表、`:52` 反映先、`04-backbone.md` 本体は今回変更しない、catalog/DSR 側のみ runtime 反映済みへの状態更新を `## 更新履歴` に 1 行追加）

## Scope

- **S1 badge.tsx tone variant 新設**: `badgeVariants` の `variants` に `tone: { warning: "border-warning-border bg-warning-soft text-warning-strong", success: "border-success-border bg-success-soft text-success-strong", destructive: "border-destructive-border bg-destructive-soft text-destructive-strong" }`（`defaultVariants` に `tone` を含めない = 未指定時は tone クラスなし）を追加する。設計意図: 3 点セットは catalog `:859` の「使用トークン」節が既に確定済みの正本値であり、cva の `tone` は `variant="outline"` と組み合わせて①状態 badge を表現する（`variant`+`tone` は独立 axis、`tone` だけでは枠 color を持たない他 variant〈`default`/`secondary`〉には影響しない）。`secondary` variant（`:13`）に `border-border` を追加し、`StocktakePage.tsx:624,854` の手動 `className="ml-2 border-border"` を `className="ml-2"` へ簡略化する（②分類「廃番」badge、catalog `:843` の②分類 note どおり）。③強調 3 サイト（`ProductRankingTable.tsx:80` / `ProductImportPreview.tsx:76` / `BackupRestorePage.tsx:533`）に `border-warning` を追加し、`BackupRestorePage.tsx:533` は `variant="secondary"` → `variant="default"` へ是正する（catalog `:845` の③強調 note どおり）。完了条件: `rg -Fc 'border-warning-border bg-warning-soft text-warning-strong' src/components/ui/badge.tsx` ≥ 1、同様に success/destructive 文字列も ≥ 1、`rg -Fc 'secondary: "border-border bg-secondary' src/components/ui/badge.tsx` ≥ 1（`:13` に `border-border` が追加されたことの exact-match、Writer が実際の文字列に揃えて oracle を確定する）
- **S2 ①状態 non-neutral サイトの tone 移行**: 起票時実測の全サイトを `variant="outline"` + 該当 `tone` + 非中立 icon へ移行する。設計意図: 単一 Badge が複数状態を出し分ける `ResultStep.tsx:47` と `DailyReportImportPage.tsx:163-182` は、`tone`/icon/文言をそれぞれ状態ごとの分岐にする（既存の三項演算子/条件分岐構造は維持、`variant`/`className` を `tone` へ置換するのみ）。`CsvImportRecordDetailPage.tsx:140` は `STATUS_LABELS`（`:38-42`）と対になる `STATUS_TONE: Record<CsvImportStatus, "success" | "warning" | "destructive">`（`completed`→`success`/`completed_partial`→`warning`/`rolled_back`→`destructive`）と、tone ごとの icon を返す小さな lookup を `STATUS_LABELS` の隣に置き、3 値すべてに tone + icon を適用する（Coordinator adjudication 2026-09-08、open question Q1 是正）。設計意図: tone family は感情区分（catalog `:830`）であり同じ状態語（成功/部分成功/取消済み）は画面を問わず同じ tone を持つのが原則 — `ResultStep.tsx:47`/`DailyReportImportPage.tsx:163-182` は既に「成功」「部分成功」に success/warning を当てているため、`:140` だけ destructive 限定で据え置くと同一語が画面ごとに色を持ったり持たなかったりする不整合になる。`STATUS_TONE` はデータの map であり、抽象化コンポーネントではない（ponytail rung 2〈既存パターン再利用〉相当、`STATUS_LABELS` という既存の `Record` パターンをそのまま踏襲するだけ）。完了条件: 各対象 file で `tone="warning"`/`tone="success"`/`tone="destructive"` の出現、かつ icon component（`AlertTriangle`/`CheckCircle2`/`CircleAlert`）が対応する分岐に存在すること（`rg` の exact-match は Writer が各 file の最終構造に合わせて確定、Test Design Matrix の SC 行に file 別 oracle を記載）
- **S3 DSR-08 増減数値の色**: `StocktakePage.tsx:863,1002` と `IntegrityCheckPage.tsx:377-378` の数値表示に `item.difference > 0 ? "text-success-strong" : item.difference < 0 ? "text-destructive-strong" : "text-muted-foreground"` 相当の条件クラスを追加する。設計意図: 記号（+/なし）+ 文言（badge 側）は既に併記済みのため、DSR-08 の「補助シグナル」規定どおり色は追加のみで記号・文言を変更しない。完了条件: `rg -n "text-success-strong|text-destructive-strong" src/features/stocktake/StocktakePage.tsx src/features/integrity-check/IntegrityCheckPage.tsx` が該当 2 file both で ≥ 1
- **S4 CTA 中間段**: `button.tsx:17` の `secondary` に `border border-border` を追加。`ProductForm.tsx:322` 「新しい取引先を追加」を `variant="outline"` → `variant="secondary"`、`:352` 「追加する」を variant 未指定 → `variant="secondary"`、`PriceRevisionFilters.tsx:82` 「新しい取引先を追加」を `variant="outline"` → `variant="secondary"` へ変更する。設計意図: DSR-01 の 3 段階層（primary/secondary/outline・ghost）のうち「補助アクション」（別入力面を開くインライン操作）に該当する 3 サイトを中間段へ降格し、`SupplierManagementPage.tsx:22` の画面唯一の主動線 primary とは区別する。完了条件: `rg -Fc 'variant="secondary"' src/features/products/components/ProductForm.tsx` ≥ 1（`:322` 側）、`ProductForm.tsx:352` の Button に `variant="secondary"` が追加されたこと（variant 未指定サイトへの追加のため `rg` の単純カウントでは 2 箇所目を区別できない — Writer は Test Design Matrix の SC 行が指す `data-variant` 属性の unit test で担保する）、`rg -Fc 'variant="secondary"' src/features/products/components/PriceRevisionFilters.tsx` ≥ 1、`button.test.tsx` に `secondary` variant の `border` class 存在アサーションを追加
- **S5 SearchBar live 型可視 Label**: `SearchBarProps` の `Omit` から `label`/`id` を除外している範囲を LiveSearchBar 用に緩め、`LiveSearchBar` に `<Label htmlFor={inputId}>{inputLabel}</Label>`（既定文言「商品を検索」、`label ?? "商品を検索"`）を追加し `aria-label` prop 適用を撤去する。設計意図: catalog `:588` は既に「live 型は可視 `<Label>` のみを accessible name とし aria-label は持たない」と確定済み — CommitSearchBar の `inputId ?? "search-input"` パターンを LiveSearchBar にも適用し、4 呼び出しサイトはラベル省略のまま既定文言が効くようにする（呼び出し側の変更は不要）。完了条件: `rg -c "aria-label" src/components/patterns/SearchBar.tsx` の live 型範囲（`LiveSearchBar` 関数本体）内で 0（commit 型の `aria-label` は維持するため file 全体では非ゼロのまま、Writer は行範囲を指定して確認する）、`rg -Fc "商品を検索" src/components/patterns/SearchBar.tsx` ≥ 1
- **S6 Alert warning variant**: `alertVariants` に catalog `:392` の exact class string（`warning: "bg-warning-soft border-warning text-warning-strong [&>svg]:text-warning *:data-[slot=alert-description]:text-warning-strong/90"`）を追加。`PriceRevisionPage.tsx:79` を `<Alert variant="warning" role="note">` + `<AlertTriangle aria-hidden="true" />` + `<AlertTitle>ご注意</AlertTitle>` + 既存本文を `<AlertDescription>` へ（catalog `:404` の指示どおり、`role="note"` は維持）。14 箇所の手書き warning Alert（起票時実測列挙）を `variant="warning"` + 手書き class 除去へ移行（既存 `role` 属性・icon・文言は維持）。`HomePage.tsx:78` は `variant="destructive"` のまま `<AlertTriangle aria-hidden="true" />` を追加。設計意図: `warning` は①状態 badge と同じ 4 点構造（soft/border/strong/icon）で owner v4 確定済みのため、追加実験は不要。DailySalesPage/MonthlySalesPage の「未取込み」plain text は Scope に含めない（起票時実測「catalog citation の drift」参照）。完了条件: `rg -Fc 'warning: "bg-warning-soft border-warning text-warning-strong' src/components/ui/alert.tsx` = 1、`rg -n 'border-warning bg-warning-soft text-warning-strong' src --glob '!*.test.*'` の hit が `alert.tsx` 定義行以外で 0（AC4 と同一 oracle）
- **S7 docs 同期**: `01-decision-rules.md:469-479` の重複 DSR-23 ブロックを削除する（`:457-467` の 1 個目を正本として残す）。catalog `:404` の DailySalesPage/MonthlySalesPage citation を「plain text のまま、Alert 化は本 lane の対象外」へ訂正する。`01-decision-rules.md` と `02-component-catalog.md` の `## 更新履歴` にそれぞれ本 PR の 1 行を追加する（runtime 反映が完了した旨、DSR-23 重複除去の旨）。設計意図: 実装物の正本を1本化し、次に catalog/DSR を読む者が誤った実装ターゲットへ誘導されないようにする。完了条件: `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 1（起票時 2）、catalog `:404` 相当の文言に「plain text」または「Alert 化は対象外」を含む注記が追加される

## Non-scope

- ⑩ runtime 項目（`PageHeader` root-cause fix、ページ説明文 3 画面、記録 ID 列撤去、備考「—」、`ManualSalePage.tsx` 記録状態 Badge 化、`formatQuantity` 9 箇所統合、`MovementTable` note 全文アクセス）— 別 lane、footprint overlap（`ManualSalePage`/`InventoryRecordsPage`）のため意図的に順序化
- 中立 ①状態 badge の文言 culling（`有効` 等）
- `selection-tone.ts` L5-D2 drift
- `--list-toolbar`（`--card` に superseded 済み）
- (d) 在庫照会 検索条件・展開行再クリック（⑨ で完了済み）
- `destructive` Alert variant の soft-fill 化
- `DailySalesPage.tsx:175` / `MonthlySalesPage.tsx:166` の plain text「レジ日報は未取込みです」を Alert 化すること（catalog citation の誤りは S7 で docs 側を訂正する。plain text → Alert への構造変更自体は別途要望があれば起票）
- 新規 DSR の起草
- DB / Tauri command / route / DTO の変更（なし）

## Acceptance Criteria

- AC1: `badge.tsx` が `tone` を `warning`/`success`/`destructive` の 3 種で公開し、3 つの exact class 文字列がそれぞれ `rg -c` で 1（`badge.tsx` 内で重複定義されていない）。`badge.test.tsx` に独立 literal 表（cva オブジェクトから derive しない）で 3 tone の class 検証を追加する
- AC2: S2 で列挙した非中立①状態サイトについて、各対応 test（page test）で rendered badge が (a) tone class を持つ (b) `svg` 子要素（icon）を持つ の両方を確認する。空集合オラクル禁止 — 各サイトにつき tone あり/なしの対照確認を含める
- AC3: `secondary` badge/button が `border-border` を持つ（`badge.test.tsx`/`button.test.tsx` の unit test）。`rg -Fc 'className="ml-2 border-border"' src/features/stocktake/StocktakePage.tsx` = 0（是正後、起票時 2）
- AC4: `rg -n 'border-warning bg-warning-soft text-warning-strong' src --glob '!*.test.*'` の hit が `alert.tsx` 定義行以外で 0（sweep 完全性、起票時 14 箇所すべて置換済みであること）
- AC5: `rg -c "aria-label" src/components/patterns/SearchBar.tsx` の `LiveSearchBar` 関数範囲内で 0。`SearchBar.test.tsx` に live 型の negative oracle（`input.getAttribute("aria-label")` が `null`）を追加する。`InventoryRecordsPage.test.tsx:744` の negative assertion を可視 Label 存在の positive assertion へ反転する
- AC6: DSR-08 サイト（`StocktakePage.tsx` 2 箇所 / `IntegrityCheckPage.tsx` 1 箇所）で +/−/0 の 3 ケースそれぞれが対応する class を持つことを確認する test を追加する（非空集合 oracle、3 ケースとも検証）
- AC7: `PriceRevisionPage` warning Alert が `getByRole("note")` で解決でき、`AlertTitle` の文言（「ご注意」）を含み、`svg`（`AlertTriangle`）を持つ
- AC8: docs 側 — `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 1（起票時 2）。`doc-consistency-check.sh` の ERROR 0（DS3 token check 含む、トークンは既に foundations/globals.css 両方に登録済みのため差分なしで通過見込み）
- AC-L3-1（owner Windows native L3）: 状態 Badge の tone（在庫状態・PLU 反映・整合性チェック補正・CSV 取込み結果等、S2 で列挙した 6 画面前後）が「終わったことは緑・注意は琥珀・警告は赤」の感情分けで見える
- AC-L3-2（owner Windows native L3）: CTA の `secondary`（「新しい取引先を追加」「追加する」）が primary/outline と見分けがつき、くどすぎない枠に見える
- AC-L3-3（owner Windows native L3）: 商品一覧・在庫照会・一括価格改定・入出庫履歴（`SearchBar.tsx` 呼び出し 4 画面）の検索欄に「商品を検索」という可視ラベルが見える
- AC-L3-4（owner Windows native L3）: `PriceRevisionPage.tsx` の「画面を再読み込みすると…」注意文言が warning（琥珀）の見た目になっている

## Design Sources

- Requirements / spec: 該当なし（新規 REQ 追加なし）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の component/呼び出し側変更のみ）
- Function / command / DTO: 該当なし
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-01/DSR-08/DSR-22/DSR-23（既存、runtime 反映元） / `docs/design-system/02-component-catalog.md` ①/⑥/⑨/⑬（既存、runtime 反映元） / `docs/design-system/00-foundations.md`（token、既存・変更なし）
- Decision log / ADR: 新規 entry なし。⑦ の owner 決定（B2/C1/DSR-22 narrow 化/Alert warning v4/③強調枠 v3）を執行するのみ

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | — | 該当なし |
| Command / DTO / generated binding / wire shape | — | 該当なし |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-01/08/22/23、`02-component-catalog.md` ①/⑥/⑨/⑬ | existing sufficient（⑦ で確定済み、本 PR は runtime 反映のみ） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | ⑦ の owner 決定を執行、新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 新規 REQ 追加なし。既存 test file の編集のみのため traceability baseline 不変見込み。新規 test file（`alert.test.tsx`）を追加する場合は `generate_traceability -- --check` で drift を検出し、baseline 更新 + 日付付き独立 comment 記録を行う |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |
| design-system DSR 新設 | なし（DSR-23 の重複除去のみ、DSR 総数不変） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | `02-component-catalog.md:832-839` tone family マッピング表（owner culling 済み） | RUNTIME-D1 | 表に列挙済みのサイトをそのまま実装対象にする。文言・分類の再裁定は行わない（⑦ で owner 決定済み） | `badge.tsx`、各 page file | AC1/AC2 |
| — | 起票時実測「S2」節 | RUNTIME-D2 | 単一 Badge が複数状態を出し分ける `ResultStep.tsx:47`/`DailyReportImportPage.tsx:163-182` は既存の三項演算子構造を維持し `variant`/`className` のみ `tone` へ置換する。共有抽象化コンポーネントは新設しない（2 箇所のみで形が異なるため rule of three 未達） | `ResultStep.tsx`、`DailyReportImportPage.tsx` | 各 file 既存 test の拡張 |
| — | `01-decision-rules.md` DSR-08 | RUNTIME-D3 | `formatListDifference`/`differenceLabel` は文字列 formatter のまま維持し、色は呼び出し側の className で追加する（formatter に color を混ぜない、関心の分離） | `StocktakePage.tsx`、`IntegrityCheckPage.tsx` | 各 file 既存 test の拡張 |
| — | 起票時実測「S6 catalog citation の drift」 | RUNTIME-D4 | `DailySalesPage.tsx:175`/`MonthlySalesPage.tsx:166` は plain `<p>` であり Alert ではないため実装対象に含めない。catalog `:404` の citation 誤りは docs 側（S7）で訂正し、実装ターゲットの誤読を防ぐ | `02-component-catalog.md` | 該当なし（docs review） |
| — | `01-decision-rules.md:457-479` | RUNTIME-D5 | DSR-23 の verbatim 重複は `01-decision-rules.md:469-479`（2 個目、`## 更新履歴` 直前）を削除し `:457-467`（1 個目）を正本として残す。番号の若い側を残すのが最小差分 | `01-decision-rules.md` | AC8 rg |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: catalog tone table・DSR-01/08/22/23 が既に確定済みの正本。本 packet の「起票時実測」節は runtime 側の未反映箇所の棚卸しであり、実装完了後は catalog 側の記述のみで完結する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: RUNTIME-D4（DailySalesPage/MonthlySalesPage citation 訂正）は catalog `:404` へ昇格（S7）。他は実装詳細の Coordinator 判断のため packet 止まりでよい
- Assumptions and constraints: 対象範囲は⑦ が確定した「badge tone・CTA secondary・SearchBar live Label・Alert warning・DSR-08 増減色」の runtime 反映のみ。⑦ Non-scope・本 packet 起票時実測「非目的」に挙げた項目は対象外
- Deferred design gaps, risk, and follow-up target: DailySalesPage/MonthlySalesPage の plain text→Alert 化（要望があれば別途起票）
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-08-ui-conventions-runtime.md) 各行に RUNTIME-D 番号か catalog/DSR 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は「中立 tone 変更なし」「DailySalesPage/MonthlySalesPage plain text は対象外」の 2 点のみ、いずれも起票時実測・Non-scope に明記済み。`CsvImportRecordDetailPage.tsx:140` は Coordinator adjudication（2026-09-08）で例外を解消し 3 値すべてに tone を適用する扱いへ統一済み。抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の component/呼び出し側変更のみ | — |
| Fact check / design decision split | 適用: catalog `:404` の DailySalesPage/MonthlySalesPage citation が実装未確認のまま書かれていたことを実測で発見（両方とも plain `<p>` で Alert ではない） | 本 packet「起票時実測」節、S7 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 状態 Badge・CTA・検索欄・注意文言は複数画面の主動線に影響する。owner L3 で確認（AC-L3-1〜4） | AC-L3-1〜4 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜4） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: ⑦ が catalog/DSR 側の badge tone 3 点セット・CTA 3 段・SearchBar Label 反転・Alert warning 4 点構造をすべて確定済み。本 lane は runtime 反映のみで新規 design 判断を要しない
- Source docs updated in this PR: `01-decision-rules.md`（DSR-23 重複除去のみ）、`02-component-catalog.md`（citation 訂正 + 更新履歴）
- Design gaps intentionally deferred: DailySalesPage/MonthlySalesPage plain text→Alert 化
- Durable decisions discovered in this plan and promoted to source docs: RUNTIME-D4（catalog citation 訂正）

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の component/呼び出し側変更のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言変更なし（tone/class/icon の視覚変更のみ、SearchBar は「商品を検索」の新規可視文言を追加）
- Error, empty, retry, and recovery behavior: 不変
- Testability and traceability IDs: 新規 REQ 追加なし、既存 test file 編集 + `alert.test.tsx` 新設

## Contract Probe

N/A — 外部ライブラリ・OS/hardware 挙動への新規依存なし。`tone` prop は cva の既存パターン（`variant` と同じ仕組み）の追加軸であり、Radix/shadcn の挙動には影響しない。SearchBar の `aria-label`/`<Label>` 切替は WCAG 2.5.3 の標準的な accname 計算（Testing Library の `getByLabelText` は両方を解決する既知の挙動）であり追加実験は不要。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| S1 badge.tsx tone 新設 + secondary/③強調枠 | `badge.tsx` | AC1/AC3 | non-scope（見た目は AC-L3-1） |
| S2 ①状態 non-neutral tone 移行 | 起票時実測列挙の全 file | AC2 | AC-L3-1 |
| S3 DSR-08 増減数値の色 | `StocktakePage.tsx`、`IntegrityCheckPage.tsx` | AC6 | non-scope（色は補助シグナル） |
| S4 CTA secondary 中間段 | `button.tsx`、`ProductForm.tsx`、`PriceRevisionFilters.tsx` | AC3 | AC-L3-2 |
| S5 SearchBar live Label | `SearchBar.tsx` | AC5 | AC-L3-3 |
| S6 Alert warning variant | `alert.tsx`、`PriceRevisionPage.tsx` 他 15 file | AC4/AC7 | AC-L3-4 |
| S7 docs 同期（DSR-23 重複除去 + citation 訂正） | `01-decision-rules.md`、`02-component-catalog.md` | AC8 | non-scope |
| RUNTIME-D4 DailySalesPage/MonthlySalesPage 対象外化 | なし（Non-scope 明記のみ） | 該当なし | non-scope |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-08-ui-conventions-runtime.md](test-matrices/2026-09-08-ui-conventions-runtime.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（本 lane は frontend のみだが release check の慣行は維持する）。

- targeted tests: `badge.test.tsx`（tone 3 種の独立 literal 表）/ `button.test.tsx`（secondary の border）/ 新設 `alert.test.tsx`（warning variant）/ 各 page test（S2/S3/S6 の対象サイト）/ `SearchBar.test.tsx`（live 型 Label + negative aria-label oracle）
- negative tests: 中立 badge に tone が付かないこと、`aria-label` が live 型に残っていないこと、`CsvImportRecordDetailPage.tsx:140` の 3 状態が互いの tone（success⇄warning⇄destructive）を取り違えないこと
- compatibility checks: commit 型 SearchBar の Label/aria-label 併存が不変であること、`data-variant`/`data-slot` 属性が引き続き出力されること、既存 role+name query（CTA button）が解決し続けること
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: 該当なし（route/DTO 変更なし）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない。

## Review Focus

- S2 の非中立①状態サイトすべてに tone + icon が付き、中立サイトが変更されていないこと
- `ResultStep.tsx:47`/`DailyReportImportPage.tsx:163-182` の複数状態出し分け Badge が、各分岐で正しい tone に切り替わること
- `CsvImportRecordDetailPage.tsx:140` の `STATUS_TONE` map が `STATUS_LABELS` の 3 値（成功/部分成功/取消済み）すべてに正しい tone（success/warning/destructive）を対応させていること
- CTA secondary 3 サイトが降格され、`SupplierManagementPage.tsx` の primary が変更されていないこと
- SearchBar commit 型が変更されず、live 型のみ Label/aria-label が反転していること
- Alert warning 14+1（`PriceRevisionPage`）箇所が role/icon/文言を保ったまま variant のみ切り替わること。`HomePage.tsx` destructive + icon 追加が正しいこと
- DailySalesPage/MonthlySalesPage の plain text が誤って Alert 化されていないこと
- DSR-23 の重複が 1 本化され、他の DSR 番号・本文に影響していないこと

## Spec Contract

Contract ID: SPEC-UIRUNTIME-1

- ⑦ が design-system canonical docs 側で確定した状態 Badge tone・CTA secondary 中間段・SearchBar live Label・Alert warning・DSR-08 増減色が runtime（`src/**`）へ反映され、DSR-23 の重複ブロックと catalog の陳腐化 citation が是正される

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UIRUNTIME-1 | S1 | `badge.test.tsx` | tone 3 種の独立 literal 表 | vitest |
| SPEC-UIRUNTIME-1 | S2 | 各 page test 拡張 | non-neutral tone + icon | vitest |
| SPEC-UIRUNTIME-1 | S3 | `StocktakePage.test.tsx`/`IntegrityCheckPage.test.tsx` | DSR-08 +/−/0 の 3 ケース | vitest |
| SPEC-UIRUNTIME-1 | S4 | `button.test.tsx`/`ProductForm.test.tsx`/`PriceRevisionPage.test.tsx` | secondary 降格 + primary 不変 | vitest |
| SPEC-UIRUNTIME-1 | S5 | `SearchBar.test.tsx`/`InventoryRecordsPage.test.tsx` | live Label + negative aria-label | vitest |
| SPEC-UIRUNTIME-1 | S6 | 新設 `alert.test.tsx` + 各 page test | warning variant + role/icon 維持 | vitest |
| SPEC-UIRUNTIME-1 | S7 | docs review（自動テストなし） | DSR-23 重複除去・citation 訂正 | `rg` 完全一致 |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし

## Writer Instructions

- Codex `model_reasoning_effort=medium`（難所〈`ResultStep.tsx`/`DailyReportImportPage.tsx` の複数状態出し分け Badge 等〉と Coordinator が判断した箇所は high へ昇格）。commands 実行数と修正 round 数を PR body に記録する
- 各 S の設計意図（WHY）は上記 Scope 節に 1〜2 文で書き込み済み。Writer は再導出せずそのまま従う
- worktree: `npm ci --ignore-scripts` → `npm run generate:routes` 必須（route 変更はないが worktree 既知手順として実施）。`npm run format:check` + lint + typecheck + targeted tests を push 前に毎回実行する。`git add` は明示パスのみ（`-A`/`.` 禁止）。packet / `Plans.md` は編集しない。PR body の `Reviewed Content HEAD` は `pending` のまま置く。`HEAD:branch` 形式の push はしない。commit subject は conventional prefix、body は日本語可
- ponytail block（実装原則、owner 2026-09-05 導入、以下を verbatim で発注書に注入）:

```
## 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- 具体的な適用: `ResultStep.tsx`/`DailyReportImportPage.tsx` の複数状態出し分け Badge に共通の「状態→tone」マッピング抽象化コンポーネントを新設しない（2 箇所のみで分岐構造・icon が異なり rule of three 未達）。既存の三項演算子構造を維持したまま `variant`/`className` を `tone` prop へ置換するだけに留める
- Maintainability review lens（owner 決定 2026-09-07）: 命名 / 理由 comment / 退屈な構造 > 賢い圧縮。tone マッピングや icon 選定の意図を短い comment で残す（保守者が badge tone 表を読まずに読めるように）

## Implementation Results

未着手（Phase: plan-draft）。

## Review Response

未着手。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
