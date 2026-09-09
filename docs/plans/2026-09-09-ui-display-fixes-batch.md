# Plan Packet: 表示小修正 batch（⑰、前月比二重符号・操作ログ詳細の折り返し・レジ日報未取込み文言・取引先改名行ボタン順・在庫照会 detail 余白・価格履歴日時表記）

owner Windows native L3（2026-09-08、⑭ 非接触の既存不具合として発見）で見つかった 6 件の表示小修正をまとめた batch。`docs/Plans.md` Backlog「表示小修正 lane（候補束）」(a)〜(f) を対象にする。docs-only の plan-first commit であり、S1〜S6 の実装は後続 Codex Writer が行う。

## Workflow State

- Phase: plan-draft
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Codex（`model_reasoning_effort=medium`）
- Plan Reviewer: Sonnet + Opus
- Final Reviewer: Sonnet 一次 + Codex ロジックレビュー
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（AC-L3-1〜6）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。D-038 既定（介入 ≤3 / 実働 ≤30分 / relay ≤2）の範囲内で収まる見込み（6 件とも小さい視覚確認で 1 round の L3 で足りる規模、⑭のような複数系統・6+ 画面にまたがる規模ではない）。S5 は候補 A を直接実装して L3 に出し、窮屈さが残る場合のみ B へ Gated Amendment で差替える 1 経路に固定する（A/B の事前提示による relay 往復は発生させない前提）。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

§5.5 を使わない change のため両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
6 件とも UI helper・文言・class の調整で、DB スキーマ・Tauri command DTO・route/search state・operator workflow の契約は変更しない（`docs/DEV_WORKFLOW.md` Risk Tiers の R2「UI helper・文言・class」に該当）。S3（レジ日報未取込み文言）は日本語表現の変更のみで、`daily_report_imports` の判定条件（`official_daily_report`/`official_department_totals` が null）自体は変更しない。S4（ボタン順）・S5（余白）は class/DOM 順の入替のみで新規 component は作らない。S6（日時表記統一）は既存 `formatDateTime` の再利用（import 追加）のみで新規ロジックを持たない。R3 への格上げ条件（契約・出力スキーマ・データ安全境界・command wire shape・route/search state・workflow gate への抵触）はいずれの S にも該当しない。

## Goal

Goal Invariant:

### 最小完了条件

- S1: 日次/月次売上の前月比・前日比 sub が減少時に単一符号（`-N.N%`）で表示され、`--N.N%` の二重符号が解消される
- S2: 操作ログ詳細の `dd` が長い値でも折り返され、「詳細を表示」列が全行で画面外へ出る不具合が解消される
- S3: 月次/日次「レジ日報は未取込みです」Alert に、直近取り込んだ Z004（商品別 CSV）とは別の日報であることを示す一文が追加される
- S4: 取引先管理の改名行の 2 ボタンが Cancel 左 / Action 右（DOM 順 Cancel → Action）になり、catalog ⑧ Dialog 節に inline 行操作も同順である旨が追記される
- S5: 在庫照会の展開行 detail で、商品名の上と CTA 群の下に owner 承認済みの余白が入る
- S6: `PriceHistorySection.tsx` の日時表示が共有 `formatDateTime` + `font-mono tabular-nums` に揃い、起票時実測の棚卸しで見つかった同型の未統一箇所（`DisposalPage.tsx`／`ReceivingPage.tsx`／`ReturnExchangePage.tsx`／`OperationLogsPage.tsx`／`AdditionalImportConfirmDialog.tsx`）も対象に含まれる

### 失敗定義

- いずれかの S が他の S、または Non-scope の対象を誤って巻き込む（例: S1 の符号修正が `value`〈¥ 金額〉側の符号表示まで変えてしまう、S6 の統一が `IntegrityCheckPage.tsx` の一文サブタイトル文脈を表セル前提の `font-mono tabular-nums` へ誤って揃えてしまう等）
- 既存 test の削除・skip
- S3 の文言確定を Z-code の実装根拠なしに owner 決定へ持ち込む（`daily_report_import_service`/`sales_service` の実際の Z 種別対応と食い違う文言を採用する）

### 非目的

- 状態 Badge tone・CTA hierarchy 等、⑭ で完了済みの design-system 規約を再設計しない
- 取引先ピッカー統合 dialog（`docs/Plans.md` Backlog、design-first、未起票）の実装
- 新規 DSR の起草（catalog ⑧ への 1 行追記のみ）

## 起票時実測（2026-09-09、worktree base `c8e1409` = origin/main、すべて本 packet 起草者が rg で再確認。発注書の anchor と差分がある箇所は本節で訂正する）

**(a) 前月比/前日比の二重符号**: `src/features/daily-sales/components/SummaryCardsBar.tsx:137`（`const sign = diff >= 0 ? "+" : "-";`）/`:148`（`sub: \`${sign}${pct.toFixed(1)}%\`,`）。`src/features/monthly-sales/components/SummaryCardsBar.tsx:113`（`sign`）/`:124`（`sub`）。発注書は daily 側を `:143,148` と記載していたが、`:143` は隣接する `valueClassName` の 3 分岐（`text-destructive-strong` 分岐）の行で `sign`/`sub` ではない — 実測により `:137,148` へ訂正する。既存 test: `SummaryCardsBar.test.tsx`（daily `:159-178`、monthly `:137-`）に `it.each` の SC25/DSR-08 parametrized test があるが、これは `value`（¥ 金額、例 `"-¥20"`）の class のみを検証し、`sub`（`%` 表示）の文字列は assert していない（`screen.getByText(label)` の `label` は `¥` 側）。減少 case の `sub` 厳密一致 test は存在しない — 発注書の記載どおり確認済み。負の pct 例: 前日 100000 → 今日 19900 のとき `diff=-80100, pct=-80.1`、現状 `sub = "-" + "-80.1" + "%" = "--80.1%"`。`Math.abs(pct)` にすると `"-" + "80.1" + "%" = "-80.1%"` になる

**(b) 操作ログ詳細の折り返し**: `src/features/operation-logs/OperationLogsPage.tsx:162`（`<dd className="font-mono text-sm break-all">{displayValue(value)}</dd>`）。`displayValue`（`:68-73`）は object/array を `JSON.stringify` する（`:72`）ため、`mismatches` 等のフィールドが1行の長い JSON 文字列になり得る。この `dd` の祖先 `<td>`（`OperationLogsPage.tsx:559` の `<TableCell colSpan={4}>`）は `src/components/ui/table.tsx:74` の `TableCell` 基底 `whitespace-nowrap`（`p-2 align-middle whitespace-nowrap`）を継承し、`white-space` は継承プロパティのため `dd` 自身が明示的に上書きしない限り `nowrap` を引き継ぐ。`break-all`（`word-break: break-all`）は改行"機会"を増やすだけで `white-space: nowrap` がその機会自体を無効化するため、実際には折り返されず横に伸びる — これが根本原因。`rg -Fc 'whitespace-pre-wrap' src/features/operation-logs/OperationLogsPage.tsx` = 2（`:150` の `<p>`〈`log.summary`〉、`:216` の技術情報 `<pre>`、いずれも同型の nowrap 打ち消し先例）。`dd` に同じ `whitespace-pre-wrap` を足せば 3 になる。専用 test: 発注書が挙げた `OperationLogsPage.test.tsx:705-712`（`test_operation_logs_req902_t10_keeps_raw_integrity_json_in_technical_details` の一部）は「技術情報（JSON）」`<pre>` の展開・非表示を検証する test で、summary `dl`（`:154-165`）の `dd` 自体の折り返し class は直接検証していない — 新規 test が必要

**(c) レジ日報未取込み文言**: `src/features/monthly-sales/MonthlySalesPage.tsx:168`（`<AlertTitle>この月のレジ日報は未取込みです。</AlertTitle>`）/`src/features/daily-sales/DailySalesPage.tsx:176`（同型「この日付の…」）。**日報種別の根拠**（docs 実測、発注書の指示どおり rg で確定）: `docs/function-design/34-biz-sales-service.md:23`「`official_daily_report: Option<OfficialDailyReportSummary>, // Z001/Z002/Z005日報集計。未取込みならNone`」、`:192-193`「Z001/Z002/Z005は商品別明細を持たないため、`items` を水増ししない。UIは、日報集計と商品別明細の差を「日報集計」「商品別（PLU/Z004・手動販売）」のように日本語で分けて表示する。」、`docs/function-design/29-io-daily-report-parser.md:8`「Z001/Z002/Z005 ファイル束」。**「レジ日報」は Z001 単独ではなく Z001+Z002+Z005 の 3 ファイル束**であり、Z004（商品別 CSV）とは完全に別の取込み系統 — 発注書の例文「この月のレジ日報（Z001 日計）は未取込みです」は Z001 のみに限定する誤りを含むため採用しない（下記 Scope で訂正）。判定条件: `src-tauri/src/biz/sales_service.rs:225`（`official_daily_report`）は `sales_repo::get_completed_daily_report_aggregate` が None を返すときのみ warning、completed import 0 件で仕様通り（発注書の記載どおり確認済み）。**重要な追加発見**: 両画面ともセクション見出し直下に既に `<p className="text-sm text-muted-foreground">` で日報種別の説明がある — `DailySalesPage.tsx:169`「Z001 / Z002 / Z005 日報から保存した公式集計です。」、`MonthlySalesPage.tsx:161`「日報取込み済み日の Z005 部門別売上合計です。」（月次は部門集計セクションのため Z005 のみで正しい）。つまり Z-code 自体は既に 1 行上で明記済みで、owner が混乱した実際の欠落は「Z004 と別物である」という対比の欠如 — Alert 自体に Z-code を重複列挙するより `AlertDescription`（両ファイルとも `:10`/`:11` で import 済み。`DailySalesPage.tsx:96-108`/`MonthlySalesPage.tsx:90-102` のエラー Alert、`DailySalesPage.tsx:187-193` の警告 Alert で既に使用中のため新規 import 不要）で「商品別売上 CSV（Z004）の取込みとは別です。」を 1 行足す方が simple かつ非冗長（Scope で確定）。`HomePage.tsx:80`「前日分が未取込みです」は `summary.derived.needsImportWarning`/`lastImportSettlementDate` 由来で判定基盤が別（Z004 系、`PluNotificationBar` 隣接）、別画面のため Non-scope。既存 test: `DailySalesPage.test.tsx:111-134`（`test_daily_sales_page_no_official_note_req501`）/`MonthlySalesPage.test.tsx:120-135` は `AlertTitle` の文言・`data-variant`・`role`・icon のみを検証し、`AlertDescription` の追加では既存 assertion は壊れない（sibling 要素の追加のみ）

**(d) 取引先管理の改名行ボタン順**: `src/features/suppliers/components/RenameSupplierRow.tsx:101-108`（保存/再試行 Button）→`:109-117`（キャンセル Button）の順で DOM に並ぶ（`<div className="flex gap-2">` 内、`:100-118`）。catalog ⑧ Dialog 節の配置規則は `docs/design-system/02-component-catalog.md:544`（発注書は `:543` と記載していたが実測では `:544`。「**配置**: 2 ボタンの DOM 順は Cancel → Action。`sm` 以上は Cancel 左 / Action 右...」）で Cancel → Action を規定しており、本サイトは Action（保存）→ Cancel（キャンセル）で逆順。ただしこの規則は `AlertDialogFooter` のような modal dialog を前提にした節であり、inline 行内操作（modal でない）への適用は catalog 上どこにも明記がない — 発注書の指示どおり `:544` の直後に「inline 行操作の 2 ボタンも同順」を 1 行追記して明文化する（S4）。既存 test: `SupplierManagementPage.test.tsx:168-266`（`名前を変更で行が入力欄になり保存で renameSupplier を呼び...`）は `within(row).getByRole("button", { name: "保存" })`/`{ name: "キャンセル" }` の role+name query のみで DOM 順を検証していない（発注書の記載どおり間接のみ確認済み）

**(e) 在庫照会の展開行 detail の余白**: `src/features/stock-inquiry/components/StockDetailContent.tsx:69`（`<CardHeader>`）/`:77`（`<CardContent className="space-y-4">`）/`:94`（CTA 群 `<div className="flex flex-wrap gap-2">`、末尾要素）。**根本原因を追加実測で特定**（発注書は「CardHeader 既定 padding」とのみ記載していたが実際は既定 padding が効いていない）: `StockDetailContent` は 2 経路で使われる。(1) `StockDetailCard.tsx:20-22` の fallback 経路は `<Card className="mt-2">`（`card.tsx:10` の `flex flex-col gap-6 ... py-6`）で包まれ、Card 自身の `py-6`（上下 24px）と `gap-6`（Header/Content 間 24px）が効く。(2) 実際に owner が L3 で見ている主経路 `src/features/stock-inquiry/components/ProductListTable.tsx:100-101`（`<TableCell colSpan={7} className="p-0 align-top whitespace-normal"><StockDetailContent query={detailQuery} /></TableCell>`）は `p-0` で `Card` ラッパーを介さず `StockDetailContent` を直接描画するため、`CardHeader`/`CardContent` 自身は `px-6`（横のみ）しか持たず（`card.tsx:23,62`）、**縦方向の余白が完全に 0**。owner が見ているのはこの主経路であり、「窮屈」は単なる感覚差ではなく実際に余白ゼロ。catalog にはこの 2 経路の余白差に関する規定はなし（抵触なし、確認済み）。既存 test: `StockDetailContent.test.tsx` は link の活性のみ検証、余白 class は未検証

**(f) 価格履歴の日時表記 + 全画面日時表記統一**: `src/features/products/components/PriceHistorySection.tsx:88`（`<TableCell>{entry.changed_at.replace("T", " ")}</TableCell>`、class なし）vs `src/features/manual-sale/ManualSalePage.tsx:39`（`import { formatDateTime, formatRecordStatus } from "@/features/inventory-records/types";`）+`:764`（`<TableCell className="font-mono tabular-nums">{formatDateTime(record.created_at)}</TableCell>`）。共有 formatter は `src/features/inventory-records/types.ts:104-106`（`export function formatDateTime(value: string): string { return value.replace("T", " "); }`）。**cross-feature import は既に先例あり**（`ManualSalePage.tsx:39` が `manual-sale` feature から `inventory-records/types` を import 済み、`AdditionalImportConfirmDialog.tsx:61` のコメントも「既存 formatter 慣行（`src/features/inventory-records/types.ts` 他、各 feature で...）」と明記）。`rg -n "no-restricted-imports" eslint.config.js` = 0 hit（feature 間 import を禁止する eslint rule は存在しない）。よって `src/lib/` への移設は不要、`ManualSalePage.tsx` と同じ import をそのまま追加すればよい（ponytail rung 2、既存 pattern 再利用）。**全画面棚卸し**（`rg -n 'replace\("T", " "\)' src/features -g '!*.test.*'`、8 hit）: (1) `src/features/inventory-records/types.ts:105` = 共有 formatter 本体 (2) `src/features/products/components/PriceHistorySection.tsx:88` = 本件 (3) `src/features/disposal/DisposalPage.tsx:91-92`（ローカル `formatDateTime` 定義）+`:706`（呼び出し、`<TableCell>` に class なし） (4) `src/features/receiving/ReceivingPage.tsx:78-79`（ローカル定義）+`:705`（呼び出し、class なし） (5) `src/features/return-exchange/ReturnExchangePage.tsx:92-93`（ローカル定義）+`:995`（呼び出し、class なし。**`docs/Plans.md:106` L8-5「記録日時の font 差」の仮説サイトそのもの** — 隣接 cell との `tabular-nums` 有無差が機序として実測確定）  (6) `src/features/integrity-check/IntegrityCheckPage.tsx:61-62`（ローカル `formatCheckedAt` 定義）+`:188`（呼び出し、ただし `latestCheckText` という一文プロパティの中の値であり `<TableCell>` ではなく段落中の日時 — 表セルではないため `font-mono tabular-nums` は文脈上不適合、cross-feature import での重複排除のみ対象とし class 追加は対象外） (7) `src/features/operation-logs/OperationLogsPage.tsx:521`（ローカル関数を経由しないインライン `{item.created_at.replace("T", " ")}`、class なし） (8) `src/features/csv-import/components/AdditionalImportConfirmDialog.tsx:63-64`（ローカル定義）+`:121,139`（呼び出し、`whitespace-normal` のみで `tabular-nums`/`font-mono` なし）。(3)(4)(5)(7)(8) の 5 file 6 箇所はいずれもテーブルセル内の日時表示で `font-mono tabular-nums` 欠落 + 共有 `formatDateTime` 未使用（ローカル再実装）。(6) は prose 文でありテーブルセルではないため font-mono/tabular-nums の対象外、import 統合のみ。専用 test: `PriceHistorySection.test.tsx` は存在しない（発注書の記載どおり確認済み）。他 5 file の該当箇所を assert する専用 test も現状なし（`rg` で `replace\("T"` や `font-mono` を各 test file で検索し 0 hit を確認済み）

## Scope

- **S1 前月比/前日比の二重符号是正**: `daily-sales/components/SummaryCardsBar.tsx:148` と `monthly-sales/components/SummaryCardsBar.tsx:124` の `sub` の符号を、`diff` 由来の `sign` ではなく `pct` 自身から導出する形へ変更する（先例: `src/features/monthly-sales/components/comparison-cell.tsx:27-29` の `const sign = ratio >= 0 ? "+" : ""` + `pct.toFixed(1)`）: `` sub: `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%` `` （`Math.abs(pct)` 案は撤回。`value` 側の `¥` 表示・`sign` 変数自体は変更しない）。あわせて `daily-sales/components/SummaryCardsBar.tsx:134` の分母ガード（`if (yAmount === 0) return { value: "比較不可", sub: "前日売上 0 円" };`）を、`monthly-sales/components/SummaryCardsBar.tsx:108-109` と同型の `yAmount <= 0` へ揃え、`sub: yAmount === 0 ? "前日売上 0 円" : "前日返品超過"` にする（根拠: `docs/architecture/ui-task-specs.md:298` Q-7 の `prev_amount <= 0` ガード、`monthly-sales/lib/compute-summary.ts:10`「負数 amount（返品超過月）はそのまま合計する」）。NaN/Infinity は分母ガード（daily `<= 0`、monthly `<= 0`）で到達不能のため、Writer は冗長な NaN/Infinity guard を追加しない。test: 両 file の `SummaryCardsBar.test.tsx` に、減少 case（例: 前日 100000 → 今日 19900、`diff=-80100, pct=-80.1`）で `sub` が厳密に `"-80.1%"` になる（`"--80.1%"` にならない）ことを assert する test、および daily の分母が負の case（`yAmount < 0`、前日返品超過）で `sub` が `"前日返品超過"` になることを assert する test を追加する。完了条件: `rg -Fc --include-zero '${sign}${pct.toFixed(1)}%' src/features/daily-sales/components/SummaryCardsBar.tsx src/features/monthly-sales/components/SummaryCardsBar.tsx` が両 file で 0（旧式除去の negative oracle、空集合 oracle）。実装文字列を pin する正側 oracle は置かず、SC1 の vitest 厳密一致 test で正側を検証する
- **S2 操作ログ詳細の折り返し**: 修正位置を `dd` ではなく展開行の祖先 `<td>`（`<TableCell colSpan={4}>`、`OperationLogsPage.tsx:559`）にする。`className="whitespace-normal"` を追加する（先例: `src/features/stock-inquiry/components/ProductListTable.tsx:100` の `p-0 align-top whitespace-normal`、Codex 実装レビュー Round 1 P2-1 起源の comment あり）。`dd`（`:162`）の `break-all` はそのまま維持し `whitespace-pre-wrap` は追加しない（`Detail` 配下の `dt`/`h4`/`li`/`tabular-nums` span 群〈`:176-192`、補正内容 = mismatches を持つ整合性補正ログ〉も同じ nowrap 継承下にあり、`dd` だけの打ち消しでは AC-L3-2 を満たさないため）。`:150` の `<p>`・`:216` の `<pre>` の個別 `whitespace-pre-wrap` は同 root cause への過去の個別パッチであり、撤去は Non-scope（動作不変のため触らない）。test: `OperationLogsPage.test.tsx` に、長い JSON 文字列値（object/array 型のフィールド）を持つログを展開表示し、展開行の祖先 `TableCell`（`:559`）が `whitespace-normal` を持つことを assert する test を追加する（既存の JSON 展開 case に同居可）。完了条件: `rg -Fc 'whitespace-normal' src/features/operation-logs/OperationLogsPage.tsx` ≥ 1
- **S3 レジ日報未取込み文言**: `DailySalesPage.tsx` の `<AlertTitle>この日付のレジ日報は未取込みです。</AlertTitle>`（`:176`）の直後に `<AlertDescription>商品別売上 CSV（Z004）の取込みとは別です。</AlertDescription>` を追加する。`MonthlySalesPage.tsx` の同型 `<AlertTitle>`（`:168`）にも同じ文言の `<AlertDescription>` を追加する（`AlertDescription` は両 file とも import 済み、新規 import 不要）。設計意図: 両画面ともセクション見出し直下の説明文（`:169`/`:161`）に Z-code は既に明記済みのため、Alert 内で Z-code を重複列挙せず「Z004 とは別物」という owner が実際に混同した対比のみを補う（起票時実測で確定、発注書の Z001 限定の例文は不採用）。既存 `AlertTitle` の文言・`role`・`data-variant`・icon は変更しない。test: 両 file の既存 test（`DailySalesPage.test.tsx:111-134`/`MonthlySalesPage.test.tsx` 相当ブロック）に、「レジ日報は未取込みです」の warning Alert を `getByRole("status")` 等で取得し `within()` でスコープした上で、新規 `AlertDescription` の文言と `data-slot="alert-description"` を assert する行を追加する（同一画面の他 Alert との tautology 回避、既存 assertion は無変更のまま pass する）。完了条件: `rg -Fc "商品別売上 CSV（Z004）の取込みとは別です。" src/features/daily-sales/DailySalesPage.tsx src/features/monthly-sales/MonthlySalesPage.tsx` が両 file で ≥ 1
- **S4 取引先改名行のボタン順**: `RenameSupplierRow.tsx` の編集モード（`:99-118`）で、保存/再試行 Button（現 `:101-108`）とキャンセル Button（現 `:109-117`）の DOM 順を入れ替え、キャンセルを先に描画する（`sm` size のため横並びのまま、外見上は Cancel 左 / Action 右になる）。catalog ⑧ Dialog 節（`02-component-catalog.md:544`「配置」bullet）の直後に「inline 行操作（例: 取引先管理の名前変更）の 2 ボタンも同じ DOM 順（Cancel → Action）に揃える」の 1 行を追記する（catalog 編集は本 packet の Scope 対象だが、本 plan-first commit では実施しない — 後続 Codex 実装時に行う）。既存 test（`SupplierManagementPage.test.tsx:168-266,394-402`）は role+name query のため解決性は変わらない。test: 新規に `within(row).getAllByRole("button")` の並び順が `["キャンセル", "保存"]`（または `"再試行"`）になることを assert する test を追加する。完了条件: `RenameSupplierRow.tsx` 内でキャンセル Button の JSX が保存 Button より前に出現する（`rg -n '"キャンセル"|"保存中".*"保存"'` 相当の目視確認 + 新規 DOM 順 test）
- **S5 在庫照会展開行 detail の余白**: `StockDetailContent.tsx:69` の `<CardHeader>` に `pt-4`、`:94` の CTA `<div className="flex flex-wrap gap-2">` に `pb-4` を追加する（候補 A、控えめ）。owner L3 に出し、窮屈さが残る場合のみ候補 B（`pt-6`/`pb-6`、fallback 経路の `Card` 標準 `py-6` と同じ量、統一感重視）へ Gated Amendment で差替える 1 経路に固定する（A/B の事前提示・確定待ちは行わない）。`StockDetailCard.tsx` 経由の fallback 経路（既に `Card` の `py-6`/`gap-6` を持つ）では A でも余白が追加分だけ厚くなる副作用があるが、fallback は list 失敗時のみの経路のため許容範囲とする（Review Focus に明記）。test: `CardHeader`/CTA `div` が `pt-4`/`pb-4` を持つことを assert する DOM 契約 test を追加する（見た目の適否自体は owner L3 の目視が唯一の oracle）。完了条件: `rg -Fc 'pt-4' src/features/stock-inquiry/components/StockDetailContent.tsx` ≥ 1 かつ `rg -Fc 'pb-4' src/features/stock-inquiry/components/StockDetailContent.tsx` ≥ 1（B への Gated Amendment 発生時は Writer が確定案に合わせて rg oracle を書き替える）
- **S6 日時表記の統一**: `PriceHistorySection.tsx:88` を、`ManualSalePage.tsx:39` と同じ `import { formatDateTime } from "@/features/inventory-records/types";` を追加した上で `<TableCell className="font-mono tabular-nums">{formatDateTime(entry.changed_at)}</TableCell>` へ変更する（`ManualSalePage.tsx:764` と同じ形、cross-feature import は既存先例をそのまま踏襲）。あわせて、なぜ `"T"` を空白に置換するだけで済ませているか（DB は `YYYY-MM-DDTHH:MM:SS` を返すが画面表示は日付+時刻の間に半角スペースのみで足りる、タイムゾーン変換は行わない）を短い日本語 comment として `formatDateTime`（`inventory-records/types.ts:104`）に残す（`docs/Plans.md:159` の ⑮ Sonnet closure P3 積み残し「接頭語撤去・`T` 除去に理由 comment」への対応）。加えて起票時実測の棚卸しで見つかった重複ローカル実装 5 箇所を同じ形へ統一する: `DisposalPage.tsx`（`:91-92` のローカル `formatDateTime` を削除し `inventory-records/types` から import、`:706` に `font-mono tabular-nums` を追加）/ `ReceivingPage.tsx`（同型、`:78-79`/`:705`）/ `ReturnExchangePage.tsx`（同型、`:92-93`/`:995`、**L8-5 の font 差はこの箇所への `tabular-nums` 追加で解消する**）/ `OperationLogsPage.tsx:521`（インライン `.replace("T", " ")` を `formatDateTime` 呼び出しへ置換、`font-mono tabular-nums` を追加。ただし `formatDateTime` の import 追加のみで S2 の `dd` 修正とは無関係な別行）/ `AdditionalImportConfirmDialog.tsx`（`:63-64` のローカル定義を削除し import、`:121,139` の `whitespace-normal` を維持しつつ `font-mono tabular-nums` を追加）。`IntegrityCheckPage.tsx:61-62`（`formatCheckedAt`）は prose 文脈（`:188`）のため `formatDateTime` への import 統合のみ行い、`font-mono tabular-nums` は追加しない（表セルでないため）。完了条件: `rg -c 'function formatDateTime\(value: string\): string \{' src/features` が `inventory-records/types.ts` の 1 箇所のみ（重複ローカル定義 0、`formatCheckedAt` は別名のため対象外）、`rg -Fc 'from "@/features/inventory-records/types"' src/features/products/components/PriceHistorySection.tsx src/features/disposal/DisposalPage.tsx src/features/receiving/ReceivingPage.tsx src/features/return-exchange/ReturnExchangePage.tsx src/features/operation-logs/OperationLogsPage.tsx src/features/csv-import/components/AdditionalImportConfirmDialog.tsx src/features/integrity-check/IntegrityCheckPage.tsx` が全 7 file で ≥ 1、`rg -Fc --include-zero 'formatCheckedAt' src/features/integrity-check/IntegrityCheckPage.tsx` が 0（import だけ足して local 定義を消し忘れる経路を塞ぐ、空集合 oracle）

## Non-scope

- Home の「前日分が未取込みです」文言（`HomePage.tsx:80`、判定基盤が別で Z004 系。S3 対象外）
- `src/components/ui/table.tsx` の `TableCell` 基底 `whitespace-nowrap` の変更（全表に波及するため、S2 は展開行 cell〈`OperationLogsPage.tsx:559`〉側の個別打ち消しに留める）
- 取引先ピッカー統合 dialog（`docs/Plans.md` Backlog、design-first、未起票。catalog ⑧ Dialog 節を本 lane と同 footprint で触るため、S4 は `:544` 直後の 1 行追記のみに範囲を絞り、Dialog 節の他の記述には触れない）
- 記録状態 Badge の tone（`docs/Plans.md` Backlog、owner 決定 2026-09-08、⑮ merge 後の別 lane）
- 在庫整合性検証の差異 Badge への tone 付与（`docs/Plans.md` Backlog、DSR 側判断が必要な design lane）
- 新規 DSR の起草（S4 は catalog ⑧ への 1 行追記のみ）
- `IntegrityCheckPage.tsx:188` の `font-mono tabular-nums` 化（prose 文脈のため対象外、S6 参照）

## Acceptance Criteria

- AC1（S1）: `daily-sales`/`monthly-sales` の `SummaryCardsBar.tsx` で、減少 case の `sub` が `pct` 由来の単一符号（例 `"-80.1%"`）になる。両 file の `SummaryCardsBar.test.tsx` に厳密一致 assertion を追加し（負値ケース・daily の分母が負のケース〈`yAmount < 0`、「前日返品超過」〉を実値で検証）、旧式 `${sign}${pct.toFixed(1)}%` が残っていないことを `rg -Fc --include-zero` で確認する（空集合 oracle、実装文字列を pin する正側 oracle は置かない）
- AC2（S2）: `OperationLogsPage.tsx:559` の展開行祖先 `<TableCell colSpan={4}>` が `whitespace-normal` を持ち、`:162` の `dd` は `break-all` を維持する（`whitespace-pre-wrap` は追加しない）。完了条件: `rg -Fc 'whitespace-normal' src/features/operation-logs/OperationLogsPage.tsx` ≥ 1。新規 test で長い JSON 値を持つログ展開時の `TableCell` の class を assert する
- AC3（S3）: `DailySalesPage.tsx`/`MonthlySalesPage.tsx` の「レジ日報は未取込みです」Alert 直下に「商品別売上 CSV（Z004）の取込みとは別です。」の `AlertDescription` が追加され、既存 `AlertTitle`/`role`/`data-variant`/icon の assertion がすべて無変更で pass する
- AC4（S4）: `RenameSupplierRow.tsx` 編集モードで `within(row).getAllByRole("button")` がキャンセル → 保存（または再試行）の順で解決する（DOM 順 oracle、role+name query の解決性は既存のまま維持）
- AC5（S5）: owner が確定した候補（A または B）の class が `StockDetailContent.tsx` の `CardHeader`/CTA `div` に反映され、DOM 契約 test が class の存在を assert する。見た目の適否自体は AC-L3-5 の owner 目視が oracle
- AC6（S6）: `formatDateTime` のローカル重複定義が `inventory-records/types.ts` の 1 本のみに統合され（`rg -c` で重複 0 を確認）、対象 6 file（`PriceHistorySection.tsx`/`DisposalPage.tsx`/`ReceivingPage.tsx`/`ReturnExchangePage.tsx`/`OperationLogsPage.tsx`/`AdditionalImportConfirmDialog.tsx`）が共有 import を持つ。表セル 6 file・7 箇所（`PriceHistorySection.tsx:88`/`DisposalPage.tsx:706`/`ReceivingPage.tsx:705`/`ReturnExchangePage.tsx:995`/`OperationLogsPage.tsx:521`/`AdditionalImportConfirmDialog.tsx:121,139`、`IntegrityCheckPage.tsx` を除く）が `font-mono tabular-nums` を持つ
- AC-L3-1（owner Windows native L3）: 日次/月次売上の前月比・前日比が減少時に `-N.N%` の単一符号で見える
- AC-L3-2（owner Windows native L3）: 操作ログの「詳細を表示」で長い値（JSON 等）を持つログでも列が画面外へ出ず、詳細欄が折り返して読める
- AC-L3-3（owner Windows native L3）: 日次/月次の「レジ日報は未取込みです」に Z004 との違いが分かる説明が添えられている
- AC-L3-4（owner Windows native L3）: 取引先管理の名前変更行でキャンセルが左、保存が右に見える
- AC-L3-5（owner Windows native L3）: 在庫照会の展開行 detail で商品名の上とボタン群の下が窮屈に見えない（候補 A/B のどちらかを owner が選ぶ）
- AC-L3-6（owner Windows native L3）: 価格履歴の日時表示が他画面（入庫・廃棄・返品交換等）の記録日時と同じ書体・詰めで見える

## Design Sources

List the source design docs this plan relies on. Plan Packets are not durable design source of truth.

- Requirements / spec: 該当なし（新規 REQ 追加なし、既存画面の表示調整のみ）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の component/呼び出し側変更のみ）
- Function / command / DTO: `docs/function-design/34-biz-sales-service.md`（S3 の Z001/Z002/Z005 根拠、`:23,192-193`）/ `docs/function-design/29-io-daily-report-parser.md`（同上、`:8`）
- DB: 該当なし
- Screen / UI: `docs/design-system/02-component-catalog.md` ⑧ Dialog 節（S4、`:544` 配置規則）/ `docs/design-system/01-decision-rules.md` DSR-08（S1 は文言のみで色は変更しないため直接の改訂対象ではないが、既存の色規則と矛盾しないことを確認済み）
- Decision log / ADR: 該当なし（新規 entry なし）

## Required Design Artifacts

Use `docs/DEV_WORKFLOW.md` Design artifact selection to decide what must exist before implementation.

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | — | 該当なし |
| Command / DTO / generated binding / wire shape | — | 該当なし |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `02-component-catalog.md` ⑧（S4 は 1 行追記のみ、`:544` 配置 bullet 末尾の従属文として S4 実装 commit で追記。`:542`-`:546` の modal 前提「状態」bullet 群には追記しない）、`34-biz-sales-service.md`/`29-io-daily-report-parser.md`（S3 の文言根拠） | updated in this PR（S4 実装 commit で catalog `:544` 直後に追記） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | — | 該当なし（新規 entry なし） |

## Registration / Generation Obligations

新規追加物に付随する登録・生成義務の checklist。該当なしなら `該当なし` と 1 行残す（節の削除はしない）。

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 該当なし（新規 REQ 追加なし、既存 test file の拡張のみ） |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |

L1 full の生成系検査は bindings / frontend routes / traceability の 3 種。本 lane はいずれも対象外（frontend の表示・文言・class 変更のみ）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | 起票時実測「(a)」節 | UIDISP-D1 | `value`（¥ 金額）は `diff` 由来の `sign` を保ったまま変更しない。`sub`（%）のみ `pct` 自身から符号を導出する形へ変える（`Math.abs(pct)` 案は撤回、先例 `comparison-cell.tsx:27-29`）。あわせて daily の分母ガードを monthly と同型の `<= 0` に揃える。DSR-08 の色規則自体には触れない（色は既存のまま） | `SummaryCardsBar.tsx`（daily/monthly） | AC1 |
| — | 起票時実測「(b)」節 | UIDISP-D2 | `TableCell` 基底の `whitespace-nowrap` は他の全セルに影響するため変更せず、展開行の祖先 `<TableCell colSpan={4}>`（`:559`）個別に `whitespace-normal` で打ち消す（先例: `ProductListTable.tsx:100` の `p-0 align-top whitespace-normal`）。`dd`（`:162`）の `break-all` は維持し `whitespace-pre-wrap` は追加しない（`:150`/`:216` の個別打ち消しは同 root cause の過去パッチとして touch しない） | `OperationLogsPage.tsx` | AC2 |
| — | `34-biz-sales-service.md:23,192-193`、`29-io-daily-report-parser.md:8` | UIDISP-D3 | 「レジ日報」= Z001+Z002+Z005 の 3 ファイル束。Alert 内で Z-code を再列挙せず、既存のセクション説明文（`:169`/`:161`）と役割分担し、Z004 との対比のみを `AlertDescription` で補う | `DailySalesPage.tsx`、`MonthlySalesPage.tsx` | AC3 |
| — | `02-component-catalog.md:544` | UIDISP-D4 | Dialog footer の Cancel→Action 規則を inline 行操作にも明文化して適用する。新規 component は作らず既存 2 Button の DOM 順のみ入替える | `RenameSupplierRow.tsx`、`02-component-catalog.md` | AC4 |
| — | 起票時実測「(e)」節 | UIDISP-D5 | `StockDetailContent` の主経路（`src/features/stock-inquiry/components/ProductListTable.tsx:100-101` 経由）が `p-0` TableCell に直接描画され `Card` の既定余白を持たないことが根本原因。`Card` 自体の class は変更せず `StockDetailContent` 側で明示的に余白を持たせる（fallback 経路への影響は許容） | `StockDetailContent.tsx` | AC5、AC-L3-5 |
| — | 起票時実測「(f)」節、`ManualSalePage.tsx:39,764` 先例 | UIDISP-D6 | 共有 `formatDateTime`（`inventory-records/types.ts`）への統合は既存の cross-feature import 先例をそのまま踏襲するのみで、新規 helper・新規配置場所（`src/lib/`）は作らない（rule of three 以前に既に 2 feature 間の import 実績があるため、抽象化の追加ではなく重複の除去） | `PriceHistorySection.tsx` 他 5 file | AC6、AC-L3-6 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: `34-biz-sales-service.md`/`29-io-daily-report-parser.md` が Z001/Z002/Z005 の役割分担を、catalog ⑧ が Dialog footer 順序を、既に確定済みの正本として持つ。本 packet の「起票時実測」節はその正本と runtime の drift の棚卸しに留まる
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし（catalog ⑧ への 1 行追記は S4 の実装時に行う運用上の追記であり、新規 DSR や decision-log entry には昇格させない）
- Assumptions and constraints: 対象範囲は `docs/Plans.md` Backlog「表示小修正 lane（候補束）」の (a)〜(f) のみ。S6 の棚卸しで見つかった `IntegrityCheckPage.tsx` は prose 文脈のため font-mono/tabular-nums の対象から明示的に除外する
- Deferred design gaps, risk, and follow-up target: S5 の候補 A/B は owner L3 で確定するまで未決。取引先ピッカー統合 dialog は別 lane（未起票）
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-09-ui-display-fixes-batch.md) 各行に UIDISP-D 番号か関連 file:line を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は「`IntegrityCheckPage.tsx` は font-mono/tabular-nums 対象外」「取引先ピッカー dialog は Non-scope」の 2 点のみ、いずれも起票時実測・Non-scope に明記済み。抜け道なし

## Impact Review Lenses

Fill this when the task starts from field investigation, real-device confirmation, external tool behavior, POS/register integration, CSV/TSV/report format changes, operator workflow discoveries, or a finding that may change source design assumptions. Otherwise write `not applicable` and why.

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の component/呼び出し側変更のみ | — |
| Fact check / design decision split | 適用: 発注書の S3 例文「レジ日報（Z001 日計）」は Z001 単独に限定する事実誤認を含んでいたため、`34-biz-sales-service.md`/`29-io-daily-report-parser.md` の実測で Z001+Z002+Z005 の 3 ファイル束へ訂正した | 起票時実測「(c)」節、S3 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: owner が実際に混乱した実発生（Z004 だけ取り込んで警告を見た）に基づく文言修正。owner L3 で確認（AC-L3-1〜6） | AC-L3-1〜6 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable — 表示文言・class のみ、集計ロジックは変更しない | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜6） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

State whether the design is ready for implementation.

- Existing design docs are sufficient because: 6 件とも既存の design-system 規約（DSR-08 の色規則は不変、catalog ⑧ の Dialog 配置規則）または既存 function-design（Z001/Z002/Z005 の役割分担）の範囲内の適用・不具合修正であり、新規 design 判断を要しない
- Source docs updated in this PR: なし（catalog ⑧ への 1 行追記は S4 の実装時に行う。本 plan-first commit では docs/plans と Plans.md のみ）
- Design gaps intentionally deferred: S5 の余白量（候補 A/B）は owner L3 で確定
- Durable decisions discovered in this plan and promoted to source docs: なし

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の component/呼び出し側変更のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: S3 で文言追加（Z004 との対比）。他は class/DOM 順の調整のみ
- Error, empty, retry, and recovery behavior: 不変
- Testability and traceability IDs: 新規 REQ 追加なし、既存 test file の拡張のみ

## Contract Probe

N/A — 外部ライブラリ・OS/hardware 挙動への新規依存なし。`whitespace-normal`/`whitespace-pre-wrap`/`white-space` の継承挙動は CSS 標準仕様（`white-space` は継承プロパティ、`word-break` とは独立した軸）であり追加実験は不要。cross-feature import（S6）は `ManualSalePage.tsx:39` で既に実行時に動作確認済みの既存パターンの再利用。

## Contract Coverage Ledger

該当なし（R2。`docs/DEV_WORKFLOW.md` Plan Packet Rules により Contract Coverage Ledger は R3/R4 必須節。本 lane は Coordinator 判断で Test Design Matrix のみ必須とした — 理由は Risk 節参照）。

## Test Plan

Test Design Matrix: [test-matrices/2026-09-09-ui-display-fixes-batch.md](test-matrices/2026-09-09-ui-display-fixes-batch.md)
- Human Gate に L3 を含むため、Writer completion は owner native build 前に `cargo check --release` を実施する（本 lane は frontend のみだが慣行として維持、CI gate ではない）。

- targeted tests: `SummaryCardsBar.test.tsx`（daily/monthly、減少 case の `sub` 厳密一致）/ `OperationLogsPage.test.tsx`（長い JSON 値の `dd` class）/ `DailySalesPage.test.tsx`・`MonthlySalesPage.test.tsx`（`AlertDescription` 追加）/ `SupplierManagementPage.test.tsx` または新設（`RenameSupplierRow` の DOM 順）/ `StockDetailContent.test.tsx`（余白 class）/ 対象 6 file の日時表示 test（共有 formatter + class）
- negative tests: S1 の `value`（¥ 金額）側の符号が変更されないこと、S3 の既存 `AlertTitle`/`role`/`data-variant` が変更されないこと、S6 の `IntegrityCheckPage.tsx` に `font-mono tabular-nums` が追加されないこと
- compatibility checks: S4 の role+name ベース既存 query が DOM 順入替え後も解決し続けること、S6 の呼び出し元シグネチャ（`formatDateTime(value: string)`）が不変であること
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: 該当なし（route/DTO 変更なし）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない。

## Review Focus

- S1: `value`（¥ 金額）側の符号表示を巻き込んでいないか。負値・0・正値の 3 ケースが正しく区別されるか
- S2: `whitespace-normal`（展開行祖先 `TableCell:559`）の追加が他の `TableCell`/`dd`/`dt` セルの見た目に波及しないか（本サイト以外の `dl`/`TableCell` は変更しない）
- S3: Z004 との対比文言が Z-code の事実（Z001+Z002+Z005 の 3 ファイル束）と整合しているか。既存 `AlertTitle`/`role`/`data-variant`/icon の assertion が無変更で pass するか
- S4: DOM 順入替えが `SupplierManagementPage.test.tsx` の既存 role+name query を壊していないか。catalog ⑧ への追記が Dialog 節の他の記述（modal 前提の規則）と矛盾しないか
- S5: 候補 A/B いずれも `StockDetailCard.tsx` 経由の fallback 経路で余白が過剰にならないか（許容範囲内か owner L3 で確認）
- S6: 重複ローカル `formatDateTime`/`formatCheckedAt` の削除が呼び出し元のシグネチャ・挙動を変えていないか。`IntegrityCheckPage.tsx` に誤って `font-mono tabular-nums` が付かないか。保守者可読性（`formatDateTime` の `"T"` 除去理由 comment）

## Spec Contract

該当なし（R2。`docs/DEV_WORKFLOW.md` Plan Packet Rules により Spec Contract は R3/R4 必須節）。

## Trace Matrix

該当なし（R2。Trace Matrix は R3/R4 必須節。AC と Scope の対応は上記「Acceptance Criteria」「Design Intent Trace」で代替する）。

## Data Safety

該当なし（R2。DB 書込み・secrets・local-only path のいずれも扱わない）。

## Writer Instructions

- Codex `model_reasoning_effort=medium`（難所と Coordinator が判断した箇所〈S6 の cross-feature import 統合・重複削除〉は high へ昇格可）。commands 実行数と修正 round 数を PR body に記録する
- 各 S の設計意図（WHY）は上記 Scope 節に書き込み済み。Writer は再導出せずそのまま従う。S3 の文言は本 packet で確定済み（Plan Review で最終確認）。S5 は候補 A で実装して L3 に出す（Scope 参照、事前提示・確定待ちは行わない）
- worktree: `npm ci --ignore-scripts` → `npm run generate:routes` 必須（route 変更はないが worktree 既知手順として実施）。`npm run format:check` + lint + typecheck + targeted tests を push 前に毎回実行する。`git add` は明示パスのみ（`-A`/`.` 禁止）。packet / `Plans.md` は編集しない（S4 の catalog 追記は実装時に別 commit で行ってよい。追記位置は `:542`-`:546` の modal 前提「状態」bullet 群ではなく、`:544` 配置 bullet 末尾に続ける従属文とする）。PR body の `Reviewed Content HEAD` は `pending` のまま置く。commit subject は conventional prefix、body は日本語可
- ponytail block（実装原則、owner 2026-09-05 導入、以下を verbatim で発注書に注入）:

```
### 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- 具体的な適用: S6 は `src/lib/` への formatter 移設や新規 wrapper component を作らない（既存 `inventory-records/types.ts` の `formatDateTime` をそのまま import する、rung 2）。S4 は新規 Button 順序 component を作らず既存 2 Button の JSX 順序を入替えるだけに留める（rung 6〜7）
- Maintainability review lens（owner 決定 2026-09-07）: 命名 / 理由 comment / 退屈な構造 > 賢い圧縮。`formatDateTime` の `"T"` 除去理由・S3 の Z-code 対比文言の意図を短い comment で残す

## Implementation Results

pending（本 commit は plan-first のみ。Codex Writer 実装後に記録する）。

Backlog 申し送り（本 lane では対応しない）:
- `src/features/plu-export/PluExportPage.tsx:159`（`formatPendingSavedAt`、`toLocaleString("ja-JP")`、`:381`/`:463` で prose 文脈に描画）にも S6 と同型の日時表記書式の不統一があるが本 lane 非対象（起票時実測「(f)」節・Adjacent Pattern Audit 参照）。書式統一は別 lane の Backlog 候補とする
- `formatDateTime`（`src/features/inventory-records/types.ts`）は S6 完了後 7 feature から import される想定で、置き場所の命名が feature 名と乖離する匂いがある。rule-of-three 到達済みのため `src/lib/` への移設を Backlog 候補として記録する（本 lane では動かさない）

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none。
