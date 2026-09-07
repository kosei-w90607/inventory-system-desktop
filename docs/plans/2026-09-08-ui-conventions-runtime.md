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

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。D-038（`docs/DEV_WORKFLOW.md:284`）の既定（介入 ≤3 / 実働 ≤30分 / relay ≤2）を超過する記録済み理由（**F17, Opus P2-8**）: L3 が状態 Badge tone・CTA・検索欄 Label・Alert warning の 4 系統・6+ 画面にまたがり 1 round で確認しきれない可能性が高いため、L3 を 1〜2 round に分割する枠を持つ。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 5 回の内訳: 1 回目 = 起票承認。2〜3 回目 = owner Windows native L3（1〜2 round）。4 回目 = Ready 承認。5 回目 = 予備（追加 L3 round または承認 + merge 代行）。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator が業務判断に使う状態表示（在庫状態・PLU 反映状況・整合性チェック補正・CSV 取込み結果）の視覚言語を切り替える（badge の tone・icon 有無）ほか、CTA の階層（`secondary` 中間段の新設）・検索欄の accessible name（`aria-label` → 可視 `<Label>`）・一括価格改定の注意文言の見た目（warning Alert への切替）を変更する。DB スキーマ・Tauri command・route/search state の変更はない。**G2（Opus P2-1）是正**: live 型を参照する既存 test の `getByLabelText`/`findByLabelText("商品検索")` は RTL の accessible-name exact match のため、Label 文言が「商品検索」→「商品を検索」へ変わると **旧文言では解決できなくなる**（起票時「解決手段は維持される」としていたのは誤り）。**H3（Opus P3-2/Sonnet P3-1）是正**: live query 19（`SearchBar.test.tsx` 4 + `ProductListPage.test.tsx` 9 + `InventoryRecordsPage.test.tsx` 6）+ `:744` の `queryByText("商品検索", { selector: "label" })` 文字列 1 = **計 20 箇所の文字列書換え**（`"商品検索"` → `"商品を検索"`）が必須対応（F5）。`:745`（`expect(keywordInput).not.toHaveAttribute("id")`）は文字列を含まない属性 assertion のため書換え対象ではなく、`not.toHaveAttribute` → `toHaveAttribute` への反転のみ（G4/F7）。CTA class 変更は既存 test が role+name query のため解決性は壊れないが、変化そのものを検証する新規 class oracle が要る。DEV_WORKFLOW Risk Tiers の R3「operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

## Goal

Goal Invariant:

### 最小完了条件

- `badge.tsx` に `tone`（`warning`/`success`/`destructive`、既定なし）を追加し、①状態 badge の非中立サイト（起票時実測で列挙した全サイト）が `variant="outline"` + `tone` + 非中立 icon に置換される
- `badge.tsx` の `secondary` variant が `border-border` を持ち、`StocktakePage.tsx:624,854` の手動 `border-border` 併記が不要になり削除される
- ③強調サイト（`ProductRankingTable.tsx:80` / `ProductImportPreview.tsx:76` / `BackupRestorePage.tsx:533`）が `border-warning` 枠を持ち、`BackupRestorePage.tsx:533` は `variant="secondary"` → `variant="default"` の種類取り違えも是正される
- `button.tsx` の `secondary` variant が `border border-border` を持ち、CTA 中間段 3 サイト（`ProductForm.tsx` 2 箇所 / `PriceRevisionFilters.tsx` 1 箇所）が `secondary` へ降格する
- `StocktakePage.tsx:863,1002` の `formatListDifference` 表示と `IntegrityCheckPage.tsx:379-382` の差異数値、`daily-sales`/`monthly-sales` の `SummaryCardsBar.tsx` 2 箇所（F2）に DSR-08 の色規則（+ = `text-success-strong` / − = `text-destructive-strong` / 0 = `text-muted-foreground`）が適用される
- `SearchBar.tsx` の live 型が可視 `<Label>`（既定文言「商品を検索」）を持ち `aria-label` を持たなくなる。commit 型は不変
- `alert.tsx` に `warning` variant が追加され、17 箇所（`PriceRevisionPage.tsx:79-83`・14 箇所の手書き warning Alert・`DailySalesPage.tsx:174-176`・`MonthlySalesPage.tsx:165-167` の新規 Alert 化）が `variant="warning"` へ移行し、`HomePage.tsx:78` に `AlertTriangle` icon が追加される（Coordinator adjudication 2026-09-08、Plan Review F1 是正）
- `01-decision-rules.md` の重複 DSR-23 ブロック（`:469-479`）が除去され、catalog の陳腐化 anchor（`PriceRevisionPage.tsx:112` → `:79-83`）が是正される

### 失敗定義

- badge/button/alert 側の token 変更が、tone 未指定の既存 variant（`default`/`secondary`/`outline`/`ghost`、`alert` の `default`/`destructive`）の見た目を変える
- 非中立の①状態 badge に icon が付かない、または中立 badge（`通常`/`formatRecordStatus` 等）に tone が誤って付く
- 「取込み済み」/「確認済み」/「成功」/「部分成功」を出し分ける単一 Badge（`DailyReportImportPage.tsx:163-182`、`ResultStep.tsx:47`）で、意図しない分岐に tone が付く、または既存の `requiresAdditionalConfirm` 分岐（既に warning 相当の className を持つ）が二重着色になる
- `SearchBar.tsx` の commit 型（`aria-label` + 可視 Label 併存）が誤って変更される、または live 型の `aria-label` 撤去で `StockInquiryPage.test.tsx:467` の `getByRole("searchbox")` が解決できなくなる
- `DailySalesPage.tsx:174-176` / `MonthlySalesPage.tsx:165-167` の「レジ日報は未取込みです」を plain `<p>` のまま放置する（owner 決定 2026-09-06、[archived packet](../archive/plans/2026-09-05-ui-conventions-batch-design.md):530 参照）、または `role`/`AlertTitle` を誤る
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

**F25（Opus P3-8）注記**: 本節中の test file の query 出現数（「8 箇所」「9 箇所」等）は静的な source 事実（`rg` で数えた既存 query 呼び出しサイト数）であり、test 実行結果（pass/fail 件数、mutation kill 件数等の揮発 evidence）ではない。D-038 Evidence Ownership（`docs/DEV_WORKFLOW.md:127`）が禁じるのは exact-HEAD SHA・test 実行件数のような **実行するたびに変わりうる証跡**の tracked doc への転記であり、ソースコード中の固定文字列出現数は re-run しても変わらない静的事実のため対象外。

**S1 badge.tsx の現状**（`src/components/ui/badge.tsx`）:
- `:7-26` の `badgeVariants`。base（`:8`）は `border border-transparent`。variant は `default`（`:12`）/`secondary`（`:13`, `bg-secondary text-secondary-foreground`, 枠なし）/`destructive`（`:14-15`）/`outline`（`:16-17`, `border-border-strong`）/`ghost`（`:18`）/`link`（`:19`）の 6 種、`tone` は存在しない
- `StockStatusBadge.tsx`（`src/features/stock-inquiry/components/StockStatusBadge.tsx`）: `:16-20` の `STATUS_STYLE` 定数（`ok`=中立 stone / `low`=warning / `stockout`=destructive）を `:25`（stockout badge）/`:34`（low badge）/`:42`（ok badge）で `className={cn("font-medium", STATUS_STYLE.x)}` として適用。tone 化しても同じ 3 クラス文字列を出す限り behavior-identical

**S2 ①状態 tone 未反映サイト**（catalog tone table `02-component-catalog.md:836-839` に既に列挙済み、file:line を再確認）:
- warning: `ProductTable.tsx:88`（`src/features/products/components/ProductTable.tsx`、`variant="secondary"` + `Clock3` icon 既存「未反映」）/ `ResultStep.tsx:47`（`src/features/csv-import/components/ResultStep.tsx`、`<Badge variant={isPartial ? "outline" : "secondary"}>{isPartial ? "部分成功" : "成功"}</Badge>` の単一 Badge が warning〈部分成功〉と success〈成功〉を同時に出し分ける）/ `DailyReportImportPage.tsx:163-182`（`src/features/daily-report-import/DailyReportImportPage.tsx`、単一 `<Badge variant={alreadyImported ? "destructive" : requiresAdditionalConfirm ? "outline" : "secondary"} className={requiresAdditionalConfirm ? "border-warning-border bg-warning-soft text-warning-strong" : undefined}>` が 3 分岐〈`alreadyImported`→「取込み済み」destructive 塗り→warning tone 化対象、`requiresAdditionalConfirm`→「同日データあり」既に warning 相当の className 手書き済み〈gated Amendment 5 の遺産、tone prop 化で置換〉、else→「確認済み」secondary→success tone 化対象〉を持つ）/ `CsvImportRecordDetailPage.tsx:140`（下記 destructive 項参照、`部分成功`分岐が warning）
- success: `IntegrityCheckPage.tsx:389`（`bg-success text-primary-foreground` 直塗り「補正済み」）/ `StocktakePage.tsx:404`（同型「未入力 {progress.uncounted_items}」全数完了時の pill、`:396-401` の未完了時 warning branch は既に tone 相当の className 手書き済み）/ `ProductTable.tsx:93`（`variant="default"` 橙「反映済み」）/ `ResultStep.tsx:47`・`DailyReportImportPage.tsx:163-182`（上記と同一サイト、それぞれ else 分岐）/ `DailyReportImportPage.tsx:322`（`<Badge>成功</Badge>`、variant 未指定=default）/ `CsvImportRecordDetailPage.tsx:140`（下記 destructive 項参照、`成功`分岐が success）
- destructive: `CsvImportRecordDetailPage.tsx:140`（`src/features/inventory-records/CsvImportRecordDetailPage.tsx`、`<Badge variant="outline">{STATUS_LABELS[detail.status]}</Badge>`。`STATUS_LABELS`（`:38-42`）は `completed`="成功"/`completed_partial`="部分成功"/`rolled_back`="取消済み" の 3 値を返す共有定数）/ `CsvImportRecordDetailPage.tsx:192`（`<Badge variant="outline">明細取消済み</Badge>`、常に destructive）。**Coordinator adjudication（2026-09-08、open question Q1 是正）**: 当初 destructive（`rolled_back`）のみ先行是正としていたが、tone family は感情区分（catalog `:830`「緑=終わったプラスの報告／琥珀=ちょっと待って／赤=警告」）である以上、同じ状態語には画面を問わず同じ tone を当てるのが原則 — `ResultStep.tsx:47`/`DailyReportImportPage.tsx:163-182` が同じ「成功」「部分成功」語をそれぞれ success/warning にしているのに `:140` だけ tone なしで残すと、同一語が画面によって色を持ったり持たなかったりする不整合になる。`completed`→success/`completed_partial`→warning/`rolled_back`→destructive の 3 値すべてに tone を適用する
- 非中立 tone には icon 必須（DSR-22）。既存 icon 再利用: warning=`AlertTriangle`（`StocktakePage.tsx:923` 等で既に多用）、success=`CheckCircle2`（`StocktakePage.tsx:700,405` 等）、destructive=`CircleAlert`/`CircleAlertIcon`（`StockStatusBadge.tsx:7,26` で在庫切れに使用中の先例）。**G11（Opus P3-4）**: warning icon は各 file の既存 import 名を使う（`AlertTriangle` / `TriangleAlertIcon` は lucide-react の同一 icon の別名、`DailyReportImportPage.tsx:1,182` は既に `TriangleAlertIcon` を import 済みのためこの file では新規 `AlertTriangle` import を追加しない）。新規 icon import は増やさない
- 中立のまま変更しない: `StockStatusBadge.tsx:42`「通常」、`formatRecordStatus` 共有（`inventory-records/types.ts`）、`differenceLabel` 由来の Badge（`IntegrityCheckPage.tsx:383`、下記 S3 参照）
- **Plan Review round 1 追加実測（F3, Sonnet P1-3）**: `daily-sales/components/ProductTable.tsx:133`（`src/features/daily-sales/components/ProductTable.tsx`、`<Badge variant="secondary" className="bg-warning-soft text-warning-strong">手動</Badge>`、`item.source === "manual"` 時のみ表示）。⑦ 起票時実測はこれを owner culling 対象（②分類か①状態か未裁定）として記録したのみだった。Coordinator adjudication（2026-09-08、決定 A）: ②分類（手動入力という「出どころ」の恒常的な区別であり、遷移する状態ではない）。原則 4「4 種目を作らない」+ 手動販売は正規の記録であり注意を要する状態ではない + owner の「色は意味がある時だけ」（catalog `:830` tone family 規約と同根）を根拠に、amber 系 className（`bg-warning-soft text-warning-strong`）を撤去し `variant="secondary"` のみ（S1 の `border-border` 付与を受ける）にする。owner 確認済み（2026-09-08、owner「A でやってみよまずは」= ②分類で色を落とす。L3 で物足りなければ ③強調への切替は class 1 行の follow-up）
- **Plan Review round 1 F4 は round 2 で撤回（G1, Opus P1-1/P1-2）**: round 1 は `ReturnExchangePage.tsx:603-607` を「レジ未処理」badge と誤認し S2 対象へ追加したが、実際にこの `<Badge>` が描画するのは `formatStockEffectBadge(false)` = **「この保存で反映」**（`:106-108` 参照）— 「レジ未処理」は隣接する別要素（`:592` の `<span className="font-medium">レジ未処理</span>` と radio の `aria-label`）であり Badge ではない。catalog `:841`「表から除外した項目とその理由」は既にこの Badge を「隣接する実際の Badge『この保存で反映』は owner 承認済みの現状維持、Non-scope」と明記している。**H7 是正**: owner 原文（`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md:18`）が名指しで承認しているのは隣接する `:580`「CSV取込みで反映」のみで、`:603-607`「この保存で反映」自体への直接言及はない — 根拠は catalog `:841` の記録のみとする（下記 Non-scope も同様に訂正）。round 1 の誤認識を Coordinator が未検証のまま accept していたため、本 round で対象から外し Non-scope へ戻す（下記 Non-scope 参照）
- **Badge 総数の再集計（F3、Sonnet P1-3）**: `rg -c "<Badge" src/features src/components --glob '!*.test.*'` を合計すると **45 件**（`ReturnExchangePage.tsx:603` の Badge 自体は既存コードに元から存在し S2/Non-scope いずれの分類でもカウント対象。⑦ 起票時実測の「44 件」との差分 1 件はこの site の走査漏れによるもので、G1 の Non-scope 判定とは独立の事実）

**S3 DSR-08 増減数値の色**: `formatListDifference`（`src/features/stocktake/lib/stocktake-formatters.ts:21-25`、**H5, Opus P3-4 是正**: 実装を再確認すると正=`+N`（`+${String(difference)}`）/負=`-N`（`String()` の自動符号）/0=`"0"`（`String(0)`）/null=`—`（`—` は null 専用で DSR-08 の 3 分岐には含まれない）の文字列を返すのみで色を持たない）の呼び出し元 2 箇所 `StocktakePage.tsx:863`（`computeListDifference(item)`）/`:1002`（`item.difference`）はいずれも `<TableCell className="text-right">` で無色。`IntegrityCheckPage.tsx:379-382`（`<span className="font-semibold tabular-nums">{item.difference > 0 ? "+" : ""}{item.difference...}</span>`、**Plan Review round 1 是正〈F14, Opus P2-4〉: 起票時 `:377-378` は 2 行分ずれており、span 自体は `:379-382`**）も無色 — 隣接する `:383` の `<Badge variant="outline">{differenceLabel(item.difference)}</Badge>` は catalog の「表から除外した項目」（`:841`）どおり tone 対象外のBadgeのまま変更しない、色付けは `:379-382` の span 自体に対して行う。**一括価格改定（`PriceRevisionTable.tsx`）に増減数値は存在しない**（`差額`/`margin`/`profit` を rg で検索し 0 hit、確認済み）— DSR-08 適用対象なし
- **Plan Review round 1 追加実測（F2, Sonnet P1-2）**: `src/features/daily-sales/components/SummaryCardsBar.tsx:139` と `src/features/monthly-sales/components/SummaryCardsBar.tsx:115`（両方とも `const valueClassName = diff >= 0 ? "text-success-emphasis" : "text-destructive";`）は前日比/前月比の増減表示に色を持つが、`>= 0` の 2 値分岐で `diff === 0`（差なし）まで緑になる。`00-foundations.md:44`「`--success-emphasis`」の用途セルは「増減用途は DSR-08 が置換」と既に明記しており、DSR-08（`01-decision-rules.md:159`）は 3 値（+/−/0）の色分けを要求する。2 サイトを `diff > 0 ? "text-success-strong" : diff < 0 ? "text-destructive-strong" : "text-muted-foreground"` の 3 分岐へ置換する（`text-success-emphasis`/`text-destructive` から `text-success-strong`/`text-destructive-strong` への色調整も伴う）。S3 の対象に追加する

**S4 CTA 中間段**: `button.tsx:17` の `secondary` variant（`"bg-secondary text-secondary-foreground hover:bg-secondary/80"`、枠なし）。`ProductForm.tsx:322-331`（`<Button type="button" variant="outline" size="sm" ...>新しい取引先を追加</Button>`）/`:352-388`（`<Button type="button" size="sm" disabled={isCreatingSupplier} ...>追加する</Button>`、variant 未指定=default）/`PriceRevisionFilters.tsx:82-89`（`<Button type="button" variant="outline" ...>新しい取引先を追加</Button>`）の 3 箇所。`SupplierManagementPage.tsx:22-30`（`<Button type="button" onClick=...><Plus />新しい取引先を追加</Button>`、variant 未指定=default）は画面の唯一の主動線のため primary のまま変更しない。既存 test は role+name query のため解決性は壊れない（確認済み）: `ProductForm.test.tsx:648,650`（`getByRole("button", {name: "新しい取引先を追加"/"追加する"})`）/`PriceRevisionPage.test.tsx:535,537`（同型）/`SupplierManagementPage.test.tsx:122,124`（同型、こちらは primary のまま変更なし対象の確認用。**F19 是正**: 起票時 `:124,126` は実測とずれていた）

**S5 SearchBar**: `SearchBar.tsx` の `LiveSearchBar`（`:111-185`）は `Omit<SearchBarProps, "label" | "id" | "showSubmitButton" | "wrapperClassName">`（`:119`）で `label`/`id` を受け取れず、`<Label>` を描画せず、`aria-label={inputAriaLabel}`（`:181`、既定「商品検索」）のみを持つ。`CommitSearchBar`（`:35-105`）は `<Label htmlFor={inputId}>`（`:72-74`）+ `aria-label={inputAriaLabel}`（`:80`）の両方を持つ（catalog は commit 型のこの併存を維持と明記、変更しない）。4 呼び出しサイトはいずれもラベル省略（既定文言が適用される）: `InventoryRecordsPage.tsx:214`（`<SearchBar value=... debounceMs={200} onSearchChange=... />`、ラベルなし）/`StockInquiryPage.tsx:103`/`PriceRevisionFilters.tsx:47`/`ProductListPage.tsx:110`。
test 影響（re-count、**Plan Review round 1 是正〈F5/F6/F7, Opus P1-1〜P1-3〉: RTL の `getByLabelText`/`findByLabelText` は accessible name の exact match であり、live 型の Label 文言が「商品検索」→「商品を検索」へ変わると新文言でしか解決できない。「解決手段は維持される」という起票時の結論は誤り — 以下の live 型 query サイトは `"商品を検索"` への書き換えが必須**）:
- `SearchBar.test.tsx`: `getByLabelText("商品検索")` は commit 型 describe ブロック（`:24-79`）に **4 箇所**（`:27,48,59,69`）、live 型 describe ブロック（`:89-`）に **4 箇所**（`:92,108,121,133`）で計 8 箇所（**F6 是正**: 起票時は 8 箇所すべてを commit 型と誤分類していた）。commit 型 4 箇所は文言・aria-label とも不変のためそのまま残す。live 型 4 箇所は `"商品を検索"` へ書き換える
- `ProductListPage.test.tsx`: `getByLabelText("商品検索")` **9 箇所**（`:215,244,302,325,448,471,480,507,542`、live 型呼び出し画面のため全箇所 `"商品を検索"` へ書き換える）
- `InventoryRecordsPage.test.tsx`: `findByLabelText("商品検索")`（非同期）**6 箇所**（`:559,599,629,656,716,741`、live 型のため全箇所 `"商品を検索"` へ書き換える）+ **negative assertion 2 箇所**（`:744` `expect(screen.queryByText("商品検索", { selector: "label" })).not.toBeInTheDocument()` と `:745` `expect(keywordInput).not.toHaveAttribute("id")` — **F7 是正〈Opus P1-3〉**: `:744` だけでなく `:745` も反転対象。live 型 Input は `htmlFor` と対にするため `id` を持つようになり、`:745` の「id を持たない」negative も成立しなくなる。両方とも positive assertion へ反転する）
- `StockInquiryPage.test.tsx`: `getByLabelText("商品検索")` は **0 箇所**。実際は `:467` `screen.getByRole("searchbox")` で role query しており文言変更・`aria-label` 撤去いずれの影響も受けない。test 修正不要
- `PriceRevisionPage.test.tsx`: SearchBar 関連の `getByLabelText`/`findByLabelText` query は **0 箇所**（検索は `mockSearchProducts` の呼び出し引数で検証しており、input 自体を label で特定していない）。test 修正不要
- **DOM 構造（F8, Opus P2-7, Coordinator decision）**: live 型は `<div className="flex items-center gap-2"><Label htmlFor={inputId} className="shrink-0 text-muted-foreground">{inputLabel}</Label><Input ... className={inputClass} /></div>` の横並び wrapper にする（`Input` は **G9, Opus P3-3 是正**: 既存の `:145` `const inputClass = inputClassName ?? "max-w-md";` セマンティクスをそのまま維持する — `max-w-md` をハードコードせず `inputClassName` prop 経由の上書きを引き続き受け付ける。`Label` は `CommitSearchBar` と同じ `shrink-0 text-muted-foreground` を流用）
- **型（F9, Opus P3-5）**: `LiveSearchBar` の `Omit<SearchBarProps, ...>` に `"ariaLabel"` を追加し、使われなくなった `ariaLabel` prop が型上も受理されないようにする（1 行）

**S6 Alert warning**: `alert.tsx:6-20` の `alertVariants` は `default`（`:11`）/`destructive`（`:12-13`）の 2 種のみ、`warning` は存在しない（`alert.test.tsx` も存在しない）。`PriceRevisionPage.tsx:79-83`（`<Alert role="note"><AlertDescription>...</AlertDescription></Alert>`、variant 未指定=default、`AlertTitle` なし）。**14 箇所の手書き warning Alert**（`rg -n 'border-warning bg-warning-soft text-warning-strong' src --glob '!*.test.*'` で完全一致確認、task 提示リストと file:line 完全一致・drift なし）: `StocktakePage.tsx:922`、`PluExportPage.tsx:407,434,444,534,698`、`IntegrityCheckPage.tsx:278,317,438`、`PreviewStep.tsx:60`、`DailyReportImportPage.tsx:152`、`DailySalesPage.tsx:183`、`PluNotificationBar.tsx:24`、`BackupRestorePage.tsx:578`。`HomePage.tsx:78`（`<Alert variant="destructive"><AlertTitle>前日分が未取込みです</AlertTitle>...`、icon なし）は catalog `:404` の指示どおり destructive のまま `AlertTriangle` icon のみ追加。
**Plan Review round 1 是正（F1, Opus P1-4, Coordinator error corrected）**: 起票時は catalog `:404`「日次 / 月次売上の『レジ日報は未取込みです』（`DailySalesPage.tsx:175`、`MonthlySalesPage.tsx:166`）は warning variant」を「catalog 側の citation drift（実装未確認のまま書かれた誤り）」と誤判定し Non-scope へ落としていたが、これは誤りだった。owner が [archived packet](../archive/plans/2026-09-05-ui-conventions-batch-design.md):530（2026-09-06「owner 再決定」「owner 決定」の 2 entry）で明示的に「日次売上 / 月次売上ページの『レジ日報は未取込みです』は情報提示のため Alert warning (c) 琥珀」と決定済みであり、catalog `:404` はこの owner 決定を正しく記録している — 実装（`<p>`→`<Alert>`）が未反映のまま残っていた runtime gap であり、catalog の記述ミスではない。両サイトを S6 Scope に組み込む: `DailySalesPage.tsx:174-176`（`<p className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">この日付のレジ日報は未取込みです。</p>`、単文のみ）/ `MonthlySalesPage.tsx:165-167`（同型「この月のレジ日報は未取込みです。」、単文のみ）を `<Alert variant="warning" role="status">` + `<AlertTriangle aria-hidden="true" />` + `<AlertTitle>` へ変換する（既存文が単文のため `AlertTitle` にその文をそのまま使い `AlertDescription` は置かない、Coordinator 指定）。両 file とも `Alert`/`AlertTitle` は import 済みだが `AlertTriangle` は未 import（`AlertDescription` も import 済みだが本サイトでは使わない）。`MonthlySalesPage.tsx:169-171`（`rows.length === 0` 時「公式部門集計の行はありません。」の別の `<p>`）は文言が異なり対象外、変更しない

**S7 (drift 訂正対象の docs anchor)**:
- `01-decision-rules.md:457-467` と `:469-479` に **同一の DSR-23 見出し・本文が verbatim 重複**（`rg -n "^## DSR-23"` で 2 hit 確認、`sed` 突合で内容完全一致確認済み）。`:481` の `## 更新履歴` 直前が `:469-479`（2 個目のブロック）
- **F15（Opus P2-5）**: catalog `:404` は適用先候補を `PriceRevisionPage.tsx:112-116` と cite しているが、実際の `<Alert role="note">` サイトは `:79-83`（本 packet「起票時実測」節で確認済み）。行番号が drift しているため訂正する
- `04-backbone.md` の badge/枠記述・foundations 反映表は ⑦ で既に runtime gap として記録済み（`:44` token 表、`:52` 反映先、`04-backbone.md` 本体は今回変更しない、catalog/DSR 側のみ runtime 反映済みへの状態更新を `## 更新履歴` に 1 行追加）
- **F16（Opus P2-6）**: catalog `:836-839` の①状態 tone family マッピング表は `CsvImportRecordDetailPage.tsx:41,140` を destructive 行（取消済み）にのみ記載しているが、S2 の Coordinator adjudication（Q1）により同サイトは success（成功）/warning（部分成功）行にも tone を持つ。success 行・warning 行それぞれに `CsvImportRecordDetailPage.tsx:140` の該当分岐（「成功」「部分成功」）を追加する。**G7（Opus P2-6/Sonnet P3-2）追加**: 同じ tone table 行内の他 anchor も本 packet 起票時実測で再確認すると drift している — warning 行の `ProductTable.tsx:79`「未反映」→ 実在行は `:88`、success 行の `ProductTable.tsx:84`「反映済み」→ 実在行は `:93`、success 行の `IntegrityCheckPage.tsx:387`「補正済み」→ 実在行は `:389`。この 3 箇所も同じ commit で修正する。**H6（Opus P3-5）追加**: `:841`「表から除外した項目とその理由」の「レジ未処理」citation `ReturnExchangePage.tsx:90,592` も drift している — 実際は formatter `formatRegisterProcessed`（`:96-98`、「レジ未処理」を返すのは `:97`）/ radio `aria-label`（`:592`）/ 可視 `<span>`（`:602`）の 3 箇所に分かれる。`:90` は formatter 定義の行番号ではなく `:97` が正（`function formatRegisterProcessed`宣言は`:96`、return 文が`:97`）。citation を `ReturnExchangePage.tsx:97,592,602` へ訂正する

## Scope

- **S1 badge.tsx tone variant 新設**: `badgeVariants` の `variants` に `tone: { warning: "border-warning-border bg-warning-soft text-warning-strong", success: "border-success-border bg-success-soft text-success-strong", destructive: "border-destructive-border bg-destructive-soft text-destructive-strong" }`（`defaultVariants` に `tone` を含めない = 未指定時は tone クラスなし）を追加する。設計意図: 3 点セットは catalog `:859` の「使用トークン」節が既に確定済みの正本値であり、cva の `tone` は `variant="outline"` と組み合わせて①状態 badge を表現する（`variant`+`tone` は独立 axis、`tone` だけでは枠 color を持たない他 variant〈`default`/`secondary`〉には影響しない）。`secondary` variant（`:13`）に `border-border` を追加し、`StocktakePage.tsx:624,854` の手動 `className="ml-2 border-border"` を `className="ml-2"` へ簡略化する（②分類「廃番」badge、catalog `:843` の②分類 note どおり）。③強調 3 サイト（`ProductRankingTable.tsx:80` / `ProductImportPreview.tsx:76` / `BackupRestorePage.tsx:533`）に `border-warning` を追加し、`BackupRestorePage.tsx:533` は `variant="secondary"` → `variant="default"` へ是正する（catalog `:845` の③強調 note どおり）。`daily-sales/components/ProductTable.tsx:133`「手動」badge（**F3, Coordinator adjudication 決定 A**）は amber className（`bg-warning-soft text-warning-strong`）を撤去し `variant="secondary"` のみへ（`secondary` variant の `border-border` を自動的に受ける、②分類）。`Badge` component に `data-tone={tone}` 属性を出力する（**F12, Opus P2-3**、`badge.tsx:39` の `data-slot`/`data-variant` と並べて 1 行追加、tone 未指定時は `data-tone` が出力されない）。完了条件: `rg -Fc 'border-warning-border bg-warning-soft text-warning-strong' src/components/ui/badge.tsx` ≥ 1、同様に success/destructive 文字列も ≥ 1、`rg -Fc 'secondary: "border-border bg-secondary' src/components/ui/badge.tsx` ≥ 1（`:13` に `border-border` が追加されたことの exact-match、Writer が実際の文字列に揃えて oracle を確定する）、`rg -Fc 'data-tone={tone}' src/components/ui/badge.tsx` ≥ 1
- **S2 ①状態 non-neutral サイトの tone 移行**: 起票時実測の全サイトを `variant="outline"` + 該当 `tone` + 非中立 icon へ移行する。設計意図: 単一 Badge が複数状態を出し分ける `ResultStep.tsx:47` と `DailyReportImportPage.tsx:163-182` は、`tone`/icon/文言をそれぞれ状態ごとの分岐にする（既存の三項演算子/条件分岐構造は維持、`variant`/`className` を `tone` へ置換するのみ）。`CsvImportRecordDetailPage.tsx:140` は `STATUS_LABELS`（`:38-42`）と対になる `STATUS_TONE: Record<CsvImportStatus, "success" | "warning" | "destructive">`（`completed`→`success`/`completed_partial`→`warning`/`rolled_back`→`destructive`）と、tone ごとの icon を返す小さな lookup を `STATUS_LABELS` の隣に置き、3 値すべてに tone + icon を適用する（Coordinator adjudication 2026-09-08、open question Q1 是正）。設計意図: tone family は感情区分（catalog `:830`）であり同じ状態語（成功/部分成功/取消済み）は画面を問わず同じ tone を持つのが原則 — `ResultStep.tsx:47`/`DailyReportImportPage.tsx:163-182` は既に「成功」「部分成功」に success/warning を当てているため、`:140` だけ destructive 限定で据え置くと同一語が画面ごとに色を持ったり持たなかったりする不整合になる。`STATUS_TONE` はデータの map であり、抽象化コンポーネントではない（ponytail rung 2〈既存パターン再利用〉相当、`STATUS_LABELS` という既存の `Record` パターンをそのまま踏襲するだけ）。完了条件: 各対象 file で `tone="warning"`/`tone="success"`/`tone="destructive"` の出現、かつ icon component（`AlertTriangle`/`CheckCircle2`/`CircleAlert`）が対応する分岐に存在すること（`rg` の exact-match は Writer が各 file の最終構造に合わせて確定、Test Design Matrix の SC 行に file 別 oracle を記載）
- **S3 DSR-08 増減数値の色**: `StocktakePage.tsx:863,1002` と `IntegrityCheckPage.tsx:379-382` の数値表示に `item.difference > 0 ? "text-success-strong" : item.difference < 0 ? "text-destructive-strong" : "text-muted-foreground"` 相当の条件クラスを追加する。加えて `daily-sales/components/SummaryCardsBar.tsx:139` と `monthly-sales/components/SummaryCardsBar.tsx:115`（**F2, Sonnet P1-2**）の `diff >= 0 ? "text-success-emphasis" : "text-destructive"` を同じ 3 分岐（`diff > 0 ? "text-success-strong" : diff < 0 ? "text-destructive-strong" : "text-muted-foreground"`）へ置換する（`diff === 0` が緑になる 2 値分岐の誤りを是正、DSR-08 `01-decision-rules.md:159`）。設計意図: 記号（+/なし）+ 文言（badge 側）は既に併記済みのため、DSR-08 の「補助シグナル」規定どおり色は追加のみで記号・文言を変更しない。完了条件: `rg -n "text-success-strong|text-destructive-strong" src/features/stocktake/StocktakePage.tsx src/features/integrity-check/IntegrityCheckPage.tsx src/features/daily-sales/components/SummaryCardsBar.tsx src/features/monthly-sales/components/SummaryCardsBar.tsx` が該当 4 file すべてで ≥ 1、`rg -c "text-success-emphasis" src/features/daily-sales/components/SummaryCardsBar.tsx src/features/monthly-sales/components/SummaryCardsBar.tsx` が両 file で 0（置換完了の negative oracle）
- **S4 CTA 中間段**: `button.tsx:17` の `secondary` に `border border-border` を追加。`ProductForm.tsx:322` 「新しい取引先を追加」を `variant="outline"` → `variant="secondary"`、`:352` 「追加する」を variant 未指定 → `variant="secondary"`、`PriceRevisionFilters.tsx:82` 「新しい取引先を追加」を `variant="outline"` → `variant="secondary"` へ変更する。設計意図: DSR-01 の 3 段階層（primary/secondary/outline・ghost）のうち「補助アクション」（別入力面を開くインライン操作）に該当する 3 サイトを中間段へ降格し、`SupplierManagementPage.tsx:22` の画面唯一の主動線 primary とは区別する。**F23（Opus P3-6）**: DSR-01（`01-decision-rules.md:25`）が runtime 是正対象として名指ししているのは `ProductForm.tsx:343`「追加する」（現行行番号 `:352`）と `button.tsx:17` の 2 点のみ — `ProductForm.tsx:322`/`PriceRevisionFilters.tsx:82` の「新しい取引先を追加」2 箇所を secondary へ降格するのは本 packet が DSR-01 の「補助アクション」規定を適用した結果であり、owner が個別列挙した対象ではない。完了条件: `rg -Fc 'variant="secondary"' src/features/products/components/ProductForm.tsx` ≥ 1（`:322` 側）、`ProductForm.tsx:352` の Button に `variant="secondary"` が追加されたこと（variant 未指定サイトへの追加のため `rg` の単純カウントでは 2 箇所目を区別できない — Writer は Test Design Matrix の SC 行が指す `data-variant` 属性の unit test で担保する）、`rg -Fc 'variant="secondary"' src/features/products/components/PriceRevisionFilters.tsx` ≥ 1、`button.test.tsx` に `secondary` variant の `border` class 存在アサーションを追加
- **S5 SearchBar live 型可視 Label**: `SearchBarProps` の `Omit` から `label`/`id` を除外している範囲を LiveSearchBar 用に緩め、`LiveSearchBar` を `<div className="flex items-center gap-2"><Label htmlFor={inputId} className="shrink-0 text-muted-foreground">{inputLabel}</Label><Input ... id={inputId} className={inputClass} /></div>` の横並び wrapper へ変更する（**G9**: `inputClass` は既存 `:145` の `inputClassName ?? "max-w-md"` セマンティクスを維持、`inputClassName` prop は引き続き受理する）（**F8, Opus P2-7, Coordinator decision**、既定文言「商品を検索」、`label ?? "商品を検索"`）。`aria-label` prop 適用を撤去し、`Omit` に `"ariaLabel"` を追加する（**F9, Opus P3-5**、dead prop の型排除）。設計意図: catalog `:617`（アクセシビリティ節、**F20, Opus P3-1 是正**: 起票時引用の `:588` は JSX コメントブロックで正典ではない）は既に「live 型は可視 `<Label>` のみを accessible name とし aria-label は持たない」と確定済み — CommitSearchBar の `inputId ?? "search-input"` パターンを LiveSearchBar にも適用し、4 呼び出しサイトはラベル省略のまま既定文言が効くようにする（呼び出し側の変更は不要）。**F5/F7（Opus P1-1〜P1-3）**: live 型 Label の accessible name 変更に伴い、live 型を参照する既存 test の `getByLabelText`/`findByLabelText("商品検索")` を `"商品を検索"` へ書き換える（`SearchBar.test.tsx` live 型 4 箇所・`ProductListPage.test.tsx` 9 箇所・`InventoryRecordsPage.test.tsx` 6 箇所）。`InventoryRecordsPage.test.tsx:744-745` の negative assertion 2 件（label 不在・id 不在）を positive へ反転する。完了条件: **H2 是正**: `rg -c "aria-label" src/components/patterns/SearchBar.tsx` = 1（起票時 2〈`:80` commit 型 + `:181` live 型〉、`:181` 撤去後は commit 型 `:80` のみ残る。「live 型範囲内で 0」は `rg` が関数スコープを認識せず実行不能だったため file 全体の総数比較へ差し替え）、`rg -Fc "商品を検索" src/components/patterns/SearchBar.tsx` ≥ 1、`rg -c '"商品を検索"' src/components/patterns/SearchBar.test.tsx` ≥ 4、`rg -c '"商品を検索"' src/features/products/ProductListPage.test.tsx` ≥ 9、`rg -c '"商品を検索"' src/features/inventory-records/InventoryRecordsPage.test.tsx` ≥ 6、`rg -Fc 'getByLabelText("商品検索")' src/components/patterns/SearchBar.test.tsx` = 4（**G3, Opus P2-2 是正**: `(`/`)` は正規表現グループのため `-F` 必須。commit 型のみ残る）
- **S6 Alert warning variant**: `alertVariants` に catalog `:392` の exact class string（`warning: "bg-warning-soft border-warning text-warning-strong [&>svg]:text-warning *:data-[slot=alert-description]:text-warning-strong/90"`）を追加し、`Alert` component に `data-variant={variant}` 属性を出力する（**F11, Opus P2-2**、`badge.tsx`/`button.tsx` は既に `data-variant` を出す、`alert.tsx` のみ欠けていた 1 行追加）。`PriceRevisionPage.tsx:79` を `<Alert variant="warning" role="note">` + `<AlertTriangle aria-hidden="true" />` + `<AlertTitle>ご注意</AlertTitle>` + 既存本文を `<AlertDescription>` へ（catalog `:404` の指示どおり、`role="note"` は維持）。14 箇所の手書き warning Alert（起票時実測列挙）を `variant="warning"` + 手書き class 除去へ移行（既存 `role` 属性・icon・文言は維持）。`HomePage.tsx:78` は `variant="destructive"` のまま `<AlertTriangle aria-hidden="true" />` を追加。**F1（Opus P1-4、Coordinator error corrected）**: `DailySalesPage.tsx:174-176`/`MonthlySalesPage.tsx:165-167`「レジ日報は未取込みです」の plain `<p>` を `<Alert variant="warning" role="status"><AlertTriangle aria-hidden="true" /><AlertTitle>この日付のレジ日報は未取込みです。</AlertTitle></Alert>`（月次側は「この月の…」、単文のため `AlertDescription` なし）へ変換する（owner 決定 2026-09-06、[archived packet](../archive/plans/2026-09-05-ui-conventions-batch-design.md):530）。両 file に `AlertTriangle` の import を追加する。設計意図: `warning` は①状態 badge と同じ 4 点構造（soft/border/strong/icon）で owner v4 確定済みのため、追加実験は不要。完了条件: `rg -Fc 'warning: "bg-warning-soft border-warning text-warning-strong' src/components/ui/alert.tsx` = 1、`rg -n 'border-warning bg-warning-soft text-warning-strong' src --glob '!*.test.*'` = 0（`alert.tsx` の定義文字列は語順が異なる `bg-warning-soft border-warning ...` のため元々この pattern にヒットしない、**F10, Opus P2-1**）、`rg -o 'variant="warning"' src --glob '!*.test.*' | wc -l` = 17（**G10 是正**、14 箇所 + `PriceRevisionPage.tsx` + `DailySalesPage.tsx` + `MonthlySalesPage.tsx`）、`rg -Fc "この日付のレジ日報は未取込みです" src/features/daily-sales/DailySalesPage.tsx` ≥ 1（`<p>` 削除後も `AlertTitle` として文言が残ることの確認）
- **S7 docs 同期**: `01-decision-rules.md:469-479` の重複 DSR-23 ブロックを削除する（`:457-467` の 1 個目を正本として残す）。catalog `:404` の `PriceRevisionPage.tsx:112-116` citation を `:79-83` へ行番号訂正する（**F15**、DailySalesPage/MonthlySalesPage の記述自体は正しい owner 決定の記録のため変更しない、S6 で実装反映のみ行う）。**H1（Opus P2-1）明記**: `## 更新履歴`（`:1000` 付近）の既存行「適用先候補 `PriceRevisionPage.tsx:112-116` を記録」は append-only の履歴レコードのため書き換えない — `:404` の citation のみを訂正し、`:1000` の履歴文字列はそのまま残す。catalog `:836-839` の①状態 tone family マッピング表の success 行・warning 行に `CsvImportRecordDetailPage.tsx:140` の該当分岐（成功/部分成功）を追加する（**F16**）。**G7/H6 追加**: 同じ tone table の陳腐化 anchor 3 件（`ProductTable.tsx:79`→`:88`、`:84`→`:93`、`IntegrityCheckPage.tsx:387`→`:389`）と、`:841`「表から除外した項目」の `ReturnExchangePage.tsx:90,592`→`:97`（formatter）/`:592`（aria-label）/`:602`（可視 span）を同時に訂正する（H6、3 anchor に分割）。これら 4 件は catalog 内で `rg -Fn` 実測いずれも 1 件のみで `## 更新履歴` への複製はない（H1 と異なり history row 保存の配慮は不要）。`01-decision-rules.md` と `02-component-catalog.md` の `## 更新履歴` にそれぞれ本 PR の新規 1 行を追加する（runtime 反映が完了した旨、DSR-23 重複除去の旨、catalog 行番号訂正の旨。既存の履歴行は変更しない）。設計意図: 実装物の正本を1本化し、次に catalog/DSR を読む者が誤った実装ターゲットへ誘導されないようにする。完了条件: `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 1（起票時 2）、`rg -Fn "PriceRevisionPage.tsx:112-116" docs/design-system/02-component-catalog.md` の hit が 1 件のみ（更新履歴行）、`rg -Fc "PriceRevisionPage.tsx:79-83" docs/design-system/02-component-catalog.md` ≥ 1、catalog `:836-839` の success 行・warning 行それぞれに `CsvImportRecordDetailPage.tsx:140` の言及が追加される

## Non-scope

- ⑩ runtime 項目（`PageHeader` root-cause fix、ページ説明文 3 画面、記録 ID 列撤去、備考「—」、`ManualSalePage.tsx` 記録状態 Badge 化、`formatQuantity` 9 箇所統合、`MovementTable` note 全文アクセス）— 別 lane、footprint overlap（`ManualSalePage`/`InventoryRecordsPage`）のため意図的に順序化
- 中立 ①状態 badge の文言 culling（`有効` 等）
- `selection-tone.ts` L5-D2 drift
- `--list-toolbar`（`--card` に superseded 済み）
- (d) 在庫照会 検索条件・展開行再クリック（⑨ で完了済み）
- `destructive` Alert variant の soft-fill 化
- `MonthlySalesPage.tsx:169-171`（`rows.length === 0` 時「公式部門集計の行はありません。」の plain text）— 文言が異なる別サイトのため対象外
- `ReturnExchangePage.tsx:580`「CSV取込みで反映」Badge は owner 原文（2026-09-04 `:18`「あとレジ戻し済みのCSV取込みで反映のバッジが色付きなのもいいと思う」）が名指しで承認済みの現状維持。`:603-607`「この保存で反映」Badge は owner 原文に個別の直接言及はないが、catalog `:841`「表から除外した項目とその理由」が両サイトを一括して「owner 承認済みの現状維持、Non-scope」と記録済み（**H7, Opus P3-6 是正**: 起票時は両サイトを owner 原文 `:18` 直接引用としていたが、原文が名指しするのは `:580` のみ — `:603-607` の根拠は catalog `:841` の記録のみとする）。手書き tone class は S1 の `tone` と同値だが、icon 追加は見た目変更になるため両サイトとも触らない（**G1, round 1 F4 の revert**、round 1 は隣接する「レジ未処理」文言・aria-label と Badge 自体の表示文言「この保存で反映」を誤認していた）
- 新規 DSR の起草
- DB / Tauri command / route / DTO の変更（なし）

## Acceptance Criteria

- AC1: `badge.tsx` が `tone` を `warning`/`success`/`destructive` の 3 種で公開し、3 つの exact class 文字列がそれぞれ `rg -c` で 1（`badge.tsx` 内で重複定義されていない）。`badge.test.tsx` に独立 literal 表（cva オブジェクトから derive しない）で 3 tone の class 検証を追加する
- AC2: S2 で列挙した非中立①状態サイトについて、各対応 test（page test）で rendered badge が (a) tone class を持つ (b) `svg` 子要素（icon）を持つ の両方を確認する。空集合オラクル禁止。**F13（Opus P3-9）是正**: 「tone あり/なしの対照確認」は分岐構造を持つサイト（`ResultStep.tsx`/`DailyReportImportPage.tsx`/`CsvImportRecordDetailPage.tsx` — 同一 Badge が複数状態を出し分ける）にのみ適用する。無条件サイト（`ProductTable.tsx:88,93` 等、常に同じ tone を出す）は positive の (a)(b) 確認のみでよい（対照 case は存在しない状態と比較できないため）
- AC3: `secondary` badge/button が `border-border` を持つ（`badge.test.tsx`/`button.test.tsx` の unit test）。`rg -Fc 'className="ml-2 border-border"' src/features/stocktake/StocktakePage.tsx` = 0（是正後、起票時 2）
- AC4（**F10, Opus P2-1 是正、pair oracle**）: (a) `rg -n 'border-warning bg-warning-soft text-warning-strong' src --glob '!*.test.*'` = 0（`alert.tsx` の定義文字列は語順が異なる `bg-warning-soft border-warning ...` のため、この pattern はそもそも `alert.tsx` にヒットしない — 例外なしの完全 sweep）。(b) `rg -o 'variant="warning"' src --glob '!*.test.*' | wc -l` = 17（**G10, Opus P3-3 是正**: `rg -c` は複数 file を跨ぐと file 別件数が個別行で出力され単一の合計にならないため、`-o`（マッチ文字列のみ出力）+ `wc -l` で総数を数える。14 箇所の手書き Alert + `PriceRevisionPage.tsx` + `DailySalesPage.tsx` + `MonthlySalesPage.tsx`、変換完了の positive 側）
- AC5: **H2（Opus P3-1）是正**: 「`LiveSearchBar` 関数範囲内で 0」は `rg` が関数スコープを認識しないため実行不能なオラクルだった — file 全体の総数 `rg -c "aria-label" src/components/patterns/SearchBar.tsx` = 1（起票時 2〈`:80` commit 型 + `:181` live 型〉、live 型の `:181` を撤去後は commit 型 `:80` の 1 本のみ残る）へ差し替える。`SearchBar.test.tsx` に live 型の negative oracle（`input.getAttribute("aria-label")` が `null`）を追加する。`InventoryRecordsPage.test.tsx:744-745` の negative assertion 2 件（label 不在・id 不在）を positive assertion へ反転する（**F7 是正**、`:745` も対象、H3: `:745` は文字列書換えでなく属性 assertion の反転のみ）。**F5（Opus P1-1）是正**: live 型を参照する既存 query を `"商品を検索"` へ書き換える — `rg -c '"商品を検索"' src/features/products/ProductListPage.test.tsx` ≥ 9、`rg -c '"商品を検索"' src/features/inventory-records/InventoryRecordsPage.test.tsx` ≥ 6、`rg -c '"商品を検索"' src/components/patterns/SearchBar.test.tsx` ≥ 4（live 型分）、`rg -Fc 'getByLabelText("商品検索")' src/components/patterns/SearchBar.test.tsx` = 4（**G3, Opus P2-2 是正**: `(`/`)` は正規表現グループのため `-F` 必須。commit 型のみ残る、live 型は書き換え済み）。**H4（Opus P3-3）追加、negative pair**: `rg -Fc 'ByLabelText("商品検索")' src/features/products/ProductListPage.test.tsx` = 0（起票時 9）、`rg -Fc 'ByLabelText("商品検索")' src/features/inventory-records/InventoryRecordsPage.test.tsx` = 0（起票時 6）
- AC6（**F2, Sonnet P1-2 で 5 サイトへ拡張**）: DSR-08 サイト（`StocktakePage.tsx` 2 箇所 / `IntegrityCheckPage.tsx` 1 箇所 / `daily-sales/components/SummaryCardsBar.tsx` 1 箇所 / `monthly-sales/components/SummaryCardsBar.tsx` 1 箇所、計 5 サイト）で +/−/0 の 3 ケースそれぞれが対応する class を持つことを確認する test を追加する（非空集合 oracle、3 ケースとも検証。`SummaryCardsBar` 2 サイトは `diff === 0` が緑にならないことを mutation として明示検証する — `diff >= 0` の境界誤りを再現できる oracle にする）
- AC7: `PriceRevisionPage` warning Alert が `getByRole("note")` で解決でき、`AlertTitle` の文言（「ご注意」）を含み、`svg`（`AlertTriangle`）を持つ
- AC8: docs 側 — `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 1（起票時 2）。`rg -Fc "PriceRevisionPage.tsx:79-83" docs/design-system/02-component-catalog.md` ≥ 1（**F15** citation 訂正）。**H1（Opus P2-1）是正**: `rg -Fc "PriceRevisionPage.tsx:112-116" docs/design-system/02-component-catalog.md` = 0 は達成不能なオラクルだった — この文字列は `:404`（citation、訂正対象）と `:1000`（`## 更新履歴` の履歴行「適用先候補 `PriceRevisionPage.tsx:112-116` を記録」、append-only につき書き換え禁止）の 2 箇所に実在する（`rg -Fn` で実測確認済み）。正しいオラクルは `rg -Fn "PriceRevisionPage.tsx:112-116" docs/design-system/02-component-catalog.md` の hit が 1 件のみで、かつその行が `## 更新履歴` の表内（行番号が更新履歴セクション開始行以降）であること — S7 で「更新履歴の既存行は書き換えない」ことを明記する。catalog `:836-839` の success/warning 行に `CsvImportRecordDetailPage.tsx:140` の言及が追加される（**F16**）。**G7 追加（H1 と同型チェック実施済み、こちらは複製なしと確認）**: `ProductTable.tsx:79`/`ProductTable.tsx:84`/`IntegrityCheckPage.tsx:387` はいずれも catalog 内で `rg -Fn` 実測 1 件のみ（更新履歴への複製なし）— `rg -Fc "ProductTable.tsx:79" docs/design-system/02-component-catalog.md` = 0 かつ `rg -Fc "ProductTable.tsx:84" docs/design-system/02-component-catalog.md` = 0 かつ `rg -Fc "IntegrityCheckPage.tsx:387" docs/design-system/02-component-catalog.md` = 0（旧 anchor 全 0 hit）、`rg -Fc "ProductTable.tsx:88" docs/design-system/02-component-catalog.md` ≥ 1 かつ `rg -Fc "ProductTable.tsx:93" docs/design-system/02-component-catalog.md` ≥ 1 かつ `rg -Fc "IntegrityCheckPage.tsx:389" docs/design-system/02-component-catalog.md` ≥ 1（新 anchor 反映済み）。**H6（Opus P3-5）追加**: `rg -Fc "ReturnExchangePage.tsx:90,592" docs/design-system/02-component-catalog.md` = 0（旧 anchor、`rg -Fn` 実測 1 件のみで更新履歴への複製なし確認済み）、正しい anchor（`:97` 実装のformatter/`:592` aria-label/`:602` 可視 span）への訂正後の文言を含む。`doc-consistency-check.sh` の ERROR 0（DS3 token check 含む、トークンは既に foundations/globals.css 両方に登録済みのため差分なしで通過見込み）
- AC-L3-1（owner Windows native L3）: 状態 Badge の tone（在庫状態・PLU 反映・整合性チェック補正・CSV 取込み結果等、S2 で列挙した 6 画面前後）が「終わったことは緑・注意は琥珀・警告は赤」の感情分けで見える
- AC-L3-2（owner Windows native L3）: CTA の `secondary`（「新しい取引先を追加」「追加する」）が primary/outline と見分けがつき、くどすぎない枠に見える
- AC-L3-3（owner Windows native L3）: 商品一覧・在庫照会・一括価格改定・入出庫履歴（`SearchBar.tsx` 呼び出し 4 画面）の検索欄に「商品を検索」という可視ラベルが見える。4 画面とも toolbar の折返し・並びが Label 追加で崩れない（**F8 追加**）
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
| — | 起票時実測「S6」節、[archived packet](../archive/plans/2026-09-05-ui-conventions-batch-design.md):530 | RUNTIME-D4（**F1 是正、2026-09-08**） | `DailySalesPage.tsx:174-176`/`MonthlySalesPage.tsx:165-167` の plain `<p>`「レジ日報は未取込みです」は owner 決定（2026-09-06）どおり `<Alert variant="warning" role="status">` へ変換する。catalog `:404` はこの owner 決定を正しく記録しており citation 誤りではなかった（当初の Coordinator 判定を訂正）。catalog `:404` の行番号のみ `PriceRevisionPage.tsx:112-116`→`:79-83` へ訂正する（S7） | `DailySalesPage.tsx`、`MonthlySalesPage.tsx`、`02-component-catalog.md` | 各 file 既存 test の拡張 |
| — | `01-decision-rules.md:457-479` | RUNTIME-D5 | DSR-23 の verbatim 重複は `01-decision-rules.md:469-479`（2 個目、`## 更新履歴` 直前）を削除し `:457-467`（1 個目）を正本として残す。番号の若い側を残すのが最小差分 | `01-decision-rules.md` | AC8 rg |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: catalog tone table・DSR-01/08/22/23 が既に確定済みの正本。本 packet の「起票時実測」節は runtime 側の未反映箇所の棚卸しであり、実装完了後は catalog 側の記述のみで完結する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: RUNTIME-D4（DailySalesPage/MonthlySalesPage は owner 決定〈2026-09-06〉どおり実装対象、catalog `:404` の行番号のみ訂正）は catalog `:404` へ昇格（S7）。他は実装詳細の Coordinator 判断のため packet 止まりでよい
- Assumptions and constraints: 対象範囲は⑦ が確定した「badge tone・CTA secondary・SearchBar live Label・Alert warning・DSR-08 増減色」の runtime 反映のみ。⑦ Non-scope・本 packet 起票時実測「非目的」に挙げた項目は対象外
- Deferred design gaps, risk, and follow-up target: `daily-sales/components/ProductTable.tsx:133`「手動」badge の②分類/①状態 owner 確認（Coordinator 仮裁定 A、owner 確認済み 2026-09-08）
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-08-ui-conventions-runtime.md) 各行に RUNTIME-D 番号か catalog/DSR 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は「中立 tone 変更なし」「`MonthlySalesPage.tsx:169-171`（別文言の plain text）は対象外」の 2 点のみ、いずれも起票時実測・Non-scope に明記済み。`CsvImportRecordDetailPage.tsx:140` は Coordinator adjudication（2026-09-08）で例外を解消し 3 値すべてに tone を適用する扱いへ統一済み。`DailySalesPage.tsx`/`MonthlySalesPage.tsx` の「未取込み」plain text は Plan Review round 1（F1）で Non-scope 誤判定を訂正し S6 Scope へ組み込み済み。抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の component/呼び出し側変更のみ | — |
| Fact check / design decision split | 適用: catalog `:404` の DailySalesPage/MonthlySalesPage citation は行番号のみ drift（`:112-116`→`:79-83` は別サイトの話、DailySales/MonthlySales 自体は owner 決定を正しく記録）。Plan Review round 1（F1）で「citation drift につき Non-scope」という起票時の誤判定を訂正し Scope へ組み込んだ | 本 packet「起票時実測」節、S6/S7 |
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
- Design gaps intentionally deferred: `daily-sales/components/ProductTable.tsx:133`「手動」badge の②分類/①状態 owner 確認（Coordinator 仮裁定 A、owner 確認済み 2026-09-08）
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
| S3 DSR-08 増減数値の色 | `StocktakePage.tsx`、`IntegrityCheckPage.tsx`、`daily-sales/components/SummaryCardsBar.tsx`、`monthly-sales/components/SummaryCardsBar.tsx`（F2 で 2 file 追加） | AC6 | non-scope（色は補助シグナル） |
| S4 CTA secondary 中間段 | `button.tsx`、`ProductForm.tsx`、`PriceRevisionFilters.tsx` | AC3 | AC-L3-2 |
| S5 SearchBar live Label | `SearchBar.tsx` | AC5 | AC-L3-3 |
| S6 Alert warning variant | `alert.tsx`、`PriceRevisionPage.tsx` 他 10 file（**F21 recount**: `StocktakePage`/`PluExportPage`/`IntegrityCheckPage`/`PreviewStep`/`DailyReportImportPage`/`DailySalesPage`/`PluNotificationBar`/`BackupRestorePage`/`HomePage`/`MonthlySalesPage`） | AC4/AC7 | AC-L3-4 |
| S7 docs 同期（DSR-23 重複除去 + citation 訂正） | `01-decision-rules.md`、`02-component-catalog.md` | AC8 | non-scope |
| RUNTIME-D4 DailySalesPage/MonthlySalesPage Alert 化（F1 是正） | `DailySalesPage.tsx`、`MonthlySalesPage.tsx` | AC4 | AC-L3-4 |

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
- Alert warning 17 箇所（14 + `PriceRevisionPage` + `DailySalesPage` + `MonthlySalesPage`）が role/icon/文言を保ったまま variant のみ切り替わること。`HomePage.tsx` destructive + icon 追加が正しいこと
- `DailySalesPage.tsx`/`MonthlySalesPage.tsx` の「レジ日報は未取込みです」が owner 決定（2026-09-06）どおり `role="status"` + `AlertTitle` へ変換され、`MonthlySalesPage.tsx` の「公式部門集計の行はありません」（別サイト）が誤って巻き込まれていないこと
- `daily-sales/components/ProductTable.tsx:133`「手動」badge が amber className を失い `variant="secondary"` のみになっていること（Coordinator decision A、owner 確認済み 2026-09-08）
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
### 実装原則（ponytail、full）
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

- **G12（Sonnet P3-3、no action）記録**: `## 起票時実測` / `## Writer Instructions` は template（`docs/templates/plan-packet.md`）にない追加見出しだが、逸脱ではなく repo 慣行（`## 起票時実測` は archive 済み packet 19 件、`## Writer Instructions` は 4 件以上で使用実測確認済み）。
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
