# Plan Packet: UI 磨き batch 3 の runtime 反映（⑮、説明セクション・記録ID列撤去・備考「—」・PriceHistory表構造化・単位表示統合）

⑩（design-first、PR #42 squash `ee8e294`）は `docs/design-system` canonical docs / `docs/function-design` 60・67・68 / `01-decision-rules.md` DSR-22 / `65-inventory-record-traceability.md` のみを改訂した docs-only packet で、Non-scope に「`src/**` の実装変更全て」を明記し runtime 反映を後続 lane（本 lane）へ申し送った。owner Human Gate は 3 件（説明文 3 案 = そのまま採用、記録ID表示方針 = (b) 一覧の表示列から外す、備考空欄表示 = 「—」）すべて 2026-09-06 に回答済みで、canonical docs 側は既にこの決定を反映済み（[archived packet](../archive/plans/2026-09-06-ui-polish-batch3-design.md) Review Response 節）。本 lane はその runtime 反映（説明セクション 3 画面 + `PageHeader` component gap の root-cause fix・記録ID列撤去・備考「—」統一・価格履歴の表構造化・`ManualSalePage.tsx` の記録状態Badge化・単位表示 9 箇所の統合）と、あわせて発見された catalog/DSR-22 の runtime-gap 記述の是正を扱う。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Codex（`model_reasoning_effort=medium`、難所と判断した箇所は Coordinator 判断で high へ昇格）
- Plan Reviewer: Opus（read-only claims-producer）+ 独立 Sonnet subagent（fresh context）
- Final Reviewer: Sonnet subagent（fresh context）一次 + Codex ロジックレビュー、裁定は Fable
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（説明セクション 3 画面〈商品一括インポート/PLU書出し/バックアップ・復元〉の読みやすさ / 業務画面 4 画面〈入庫/返品交換/手動販売/廃棄〉の subtitle 復活と間隔 / 備考「—」と折り返し / 価格履歴の表 / 単位表示）

**Stacked train（Plan Review round 1 是正、F2, Opus P1-2 / Sonnet P3-1）**: branch `agent/ui-polish-batch3-runtime` は ⑭（`agent/ui-conventions-runtime`）の tip `7c12dab` から cut する。merge train は ⑭ → ⑮。手順は 2 段階に分かれ、混同しない:
- **(i) 着手時（base branch 同期、D-074 の手順ではない）**: ⑭ の実装が着地してから着手し、`origin/agent/ui-conventions-runtime` の tip を本 branch へ 1 回 merge する（rebase 禁止）。これは先頭 lane が未 merge のまま進めるための base 同期であり、D-074（stacked train の base 付け替え）の適用対象ではない。
- **(ii) ⑭ squash merge 後（D-074、`docs/DEV_WORKFLOW.md:257`）**: 本 branch の旧 tip を `git tag`/ref で保存する → 最新 `origin/main` を 1 回だけ merge する（先頭 lane branch tip を追加で merge する多段 merge は禁止、`:257`）→ PR の base を `agent/ui-conventions-runtime` から `main` へ付け替える。

`CsvImportRecordDetailPage.tsx` は両 lane が近接領域（⑭ の `STATUS_TONE` 追加 `:38-42` 付近 / 本 lane の `formatQuantity` 是正 `:51-53`）を触るため、Writer は (i) の merge 後にコンフリクトの有無を確認してから S7 に着手する。**F7（Opus P2-5）追加**: `InventoryRecordsPage.test.tsx` も conflict-prone — ⑭ S5 が `:559,599,629,656,716,741,744,745` を書き換える一方、本 lane の S4 はヘッダー配列テストを追加する。(i) merge 後にこの file のコンフリクトも個別確認する。既存フィルタ欄テスト（AC5/SC7）は行番号ではなく `getByLabelText("記録ID")` の query literal で参照する（⑭ merge で行番号がずれるため）。

## Owner Effort Budget

- 介入回数上限: 5
- 実働時間上限: 45分
- relay 往復上限: 3
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。D-038（`docs/DEV_WORKFLOW.md:284`）の既定（介入 ≤3 / 実働 ≤30分 / relay ≤2）を超過する記録済み理由: L3 が説明セクション 3 画面・業務入力 4 画面・記録一覧・価格履歴・9 箇所の単位表示統合という 8 スコープ項目・10 画面前後にまたがり 1 round で確認しきれない可能性が高いため、L3 を 1〜2 round に分割する枠を持つ（⑭ と同型の超過理由）。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 5 回の内訳: 1 回目 = 起票承認。2〜3 回目 = owner Windows native L3（1〜2 round）。4 回目 = Ready 承認。5 回目 = 予備（追加 L3 round または承認 + merge 代行）。

**STATECAP 継承（F8, Opus P2-6, `docs/DEV_WORKFLOW.md:259`）**: `origin/main..7c12dab` には state-only commit が既に 1 本（`7c12dab`）あり、⑭ は Ready までにさらに +2 本見込み（継承 commit は STATECAP 二段 cap の双方に計上されうる）。Coordinator plan: ⑭ merge 前の本 lane の state-only commit は `plan-draft->plan-gate->plan-approved->implementing` の 1 本のみとし、以後の遷移（local-verified / independent-review / human-confirm / ready）は ⑭ squash merge + `origin/main` 単段 merge（stacked train (ii)）で merge-base が進み継承分が消えた後に記録する。順序上それが不可能な場合（⑭ merge が本 lane の L3 より後になる等）は closeout 圧縮記録（PR #40/#41 先例）で圧縮する。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator の主要業務入力 4 画面（入庫・返品交換・手動販売・廃棄）の説明文・備考表示・PageHeader 構造、記録一覧（入出庫履歴）の列構成、商品詳細の価格履歴表示、9 箇所の数量表示 formatter を横断的に変更する。DB スキーマ・Tauri command・route/search state・DTO の変更はない。operator が業務判断に使う「備考（メモ）」「記録の識別」「数量・単位」の視覚表現を切り替えるため DEV_WORKFLOW Risk Tiers の R3「operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

## Goal

Goal Invariant:

### 最小完了条件

- `PageHeader.tsx` の `actions` 分岐が `subtitle`/新設 `description` prop を描画するようになり（root-cause fix）、`ReceivingPage.tsx:295` / `ManualSalePage.tsx:310` / `ReturnExchangePage.tsx:418` / `DisposalPage.tsx:285` の 4 画面で消えている `subtitle` が画面に表示される
- `ProductImportPage.tsx:20-32` / `PluExportPage.tsx:360` / `BackupRestorePage.tsx:335` の 3 画面に、function-design 60/67/68 で確定済みの説明文（`description` prop）が表示される
- `SupplierManagementPage.tsx:35-38` の外側 sibling `<p>` が `PageHeader` の `subtitle` prop へ移行し、`PageHeader` 内 `space-y-1` グループで描画される
- `InventoryRecordsPage.tsx` の入出庫履歴一覧から記録ID列（head `:352` + body `:373-375`）が撤去され 7 列になる。フィルタ入力欄（`:217`「記録ID」）は維持される
- 備考の空欄表示が「—」に統一される: `ReceivingPage.tsx:698`（truncate + title 追加）/ `ReturnExchangePage.tsx` の共有 `formatNote()`（`:110-113`、`:475` 保存結果パネル・`:981` 直近テーブルの 2 箇所に反映）/ `ReturnRecordDetailPage.tsx:57`。`MovementTable.tsx:93-95` は truncate → 折り返し（`whitespace-normal break-words`）+ `title` 属性追加で全文確認手段を持つ
- 「直近の○○」系 4 画面（入庫・返品交換・手動販売・廃棄）に「直近 {N} 件の{対象}を新しい順に表示します。」の説明文が付き、`PriceHistorySection.tsx:43` の説明文が実際の件数（10）を含む形へ揃う
- `PriceHistorySection.tsx:66-80` の `<ul>/<li>` が `<Table>` + `TableHead`（変更日時/売価/原価）へ変わり、`ManualSalePage.tsx:725` の内側二重枠が外れる
- `ManualSalePage.tsx:749` が `<Badge variant="outline">{formatRecordStatus(...)}</Badge>` へ統一され、9 箇所の重複ローカル `formatQuantity` が `formatStockDisplay`/`formatStockUnitLabel`（`src/features/stock-inquiry/lib/format-stock-display.ts`）へ統合される

### 失敗定義

- `PageHeader` の修正で `PageHeader.test.tsx:61-73`（`actions` 指定時に `header` が `flex` class を持つ）が red になる、または `subtitle`/`description` 未指定時の既存 3 variant の見た目が変わる
- `InventoryRecordsPage.tsx` のフィルタ欄「記録ID」（`:217`）が誤って削除される、または `ManualSalePage.tsx:730` / `DisposalPage.tsx:684` の直近テーブルの記録ID列まで誤って撤去される
- 備考の全文確認手段（`MovementTable.tsx` の折り返し + `title`、各記録詳細ページの truncate なし表示）が失われる、または `DisposalPage.tsx`（note フィールドなし）に備考列を追加してしまう
- `ManualSalePage.tsx`（DTO `InventoryRecordSummary` に `note` フィールドが無い）に備考列を追加しようとして存在しないフィールドを参照する
- 9 箇所の `formatQuantity` 統合で、単位コードの日本語化以外に数量の書式（桁区切りの有無）が意図せず変わったまま owner に確認されない
- Non-scope（下記）に挙げた項目まで誤って変更してしまう

### 非目的

- ⑭ の runtime 項目（状態 Badge tone・CTA 中間段・検索欄 Label・Alert warning・DSR-08 増減色）— 別 lane（stacked train で先行）
- 新規 DSR の起草（本 lane は DSR-22 の runtime 反映と `:435` 陳腐化記述の是正のみ）
- DB / Tauri command / route / DTO の変更（なし。`ManualSalePage.tsx` の備考列追加は `InventoryRecordSummary` DTO に `note` が無いため Non-scope）
- 「直近の○○」系 section に新たな箱を追加すること（DSR-16、囲みは既存の 1 段のまま）
- `MovementTable.tsx` の note に展開 widget を作ること（折り返し + `title` のみで DSR-12 を満たす）
- `MovementTable.tsx` 以外の `stock-movements` 機能変更

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-08、worktree base `7c12dab`〈⑭ tip〉、すべて本 packet 起草者が rg/bat で再確認。⑩ design packet 起票時実測〈2026-09-06〉からの再測定 — canonical docs 側は⑩で確定済みのため drift なし、runtime 側の file:line は概ね drift なし〈verify 済み〉だが 2 件のみ drift を検出）

**S1 PageHeader component gap**（`src/components/patterns/PageHeader.tsx`）:
- 現状 27-45 行の 2 分岐: `actions !== undefined`（`:29-36`）は `<header className="flex flex-wrap items-center justify-between gap-3"><h1>{title}</h1>{actions}</header>` を返し `subtitle` を参照しない。それ以外（`:38-45`）は `<header className="space-y-1"><h1>{title}</h1>{subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}</header>`。**drift**: task 提示の `:29-42` は本 packet起草時実測の `:27-45`（`:29-36` actions 分岐 / `:38-45` それ以外）とややずれている。**（G3, Opus P2-1 是正）**: catalog `:48` の引用のうち `PageHeader.tsx:27-45` / `:29-36` は本 packet 実測と完全一致（drift なし）だが、同じ `:48` が引用する 4 画面の `subtitle` 呼び出し行（`ReceivingPage.tsx:288-291`/`ManualSalePage.tsx:303-306`/`ReturnExchangePage.tsx:411-414`/`DisposalPage.tsx:278-281`）は実際の `<PageHeader` 開始行（`:295`/`:310`/`:418`/`:285`、いずれも +7 drift、実測確認済み）と一致していない — 「catalog `:48` の引用は完全一致」という当初の言い方は `PageHeader.tsx` 自身の anchor に限った話で、4 画面の呼び出し側 anchor には当てはまらない
- `PageHeader.test.tsx:61-73`「subtitle が指定されていても actions が優先されフレックスレイアウトになる」は `header` に `flex` class が付くことのみを assert し、`subtitle` の描画有無は検査していない（catalog `:48` の記述どおり）
- 影響 5 画面（`SupplierManagementPage.tsx:35-38` は S3 で別途扱う）: `ReceivingPage.tsx:295` / `ManualSalePage.tsx:310` / `ReturnExchangePage.tsx:418` / `DisposalPage.tsx:285` はいずれも `subtitle` prop を渡しているが `actions` に握りつぶされ画面に一切表示されない（file:line はすべて task 提示どおり drift なし、確認済み）
- `docs/function-design/60-ui-product-import.md:101`「PageHeader title は `一括インポート`、subtitle は初期投入・大量更新用の短い説明に留める」— `subtitle` は 1 行の短い副題用途、複数文の操作説明は新設 `description` prop の役目と役割分担する（catalog `:46` の記述と整合）

**S2 説明セクション 3 画面**（function-design 側は⑩で確定済み、runtime 未反映）:
- `ProductImportPage.tsx:20-32`: `actions`（「商品一覧へ戻る」）あり。説明文は現在無い。60:102 の確定文言（「CSVファイルから複数の商品をまとめて登録・更新するページです。ファイルを選ぶと新規登録候補・既存商品との重複・エラー行の3つに分けて内容を確認でき、重複行は初期状態でスキップされるので上書きする行だけ個別に選んで取り込みます。取り込みを実行すると、新規登録・上書き更新・スキップの件数が画面に表示されます。」）を `description` prop に渡す。`subtitle` は追加しない（60:101 の「短い説明に留める」対象は元々の 1 行副題用途で、`description` と重複させる意味が無いため — ponytail: 要らないものは足さない）
- `PluExportPage.tsx:360`: `<PageHeader title="PLU書出し" />` のみ、`actions` 無し。67:123 の確定文言を `description` に渡す
- `BackupRestorePage.tsx:335`: `<PageHeader title="バックアップ・復元" />` のみ、`actions` 無し。68:147 の確定文言を `description` に渡す

**S3 SupplierManagementPage 間隔**:
- `SupplierManagementPage.tsx:35-38`: `<PageHeader title="取引先管理" actions={addButton} />` の直後に sibling `<p className="text-sm text-muted-foreground">メーカー・ブランドの追加、名称変更、重複した取引先の統合を行います。</p>`（単文、1 文）。`PageShell` の `space-y-6`（24px）が間隔として適用され、`subtitle` 経由（`space-y-1`、4px）の画面と間隔が 6 倍異なる（⑩ 起票時実測どおり）。単文のため `description`（複数文用途）ではなく `subtitle` を使う（S1 の 60:101 役割分担に合わせる）
- 既存 `SupplierManagementPage.test.tsx` にこの文言を assert するテストは無い（`rg` 確認済み、0 hit）— 新規オラクル追加のみで既存 test 破壊なし

**S4 記録ID列撤去**:
- `InventoryRecordsPage.tsx:349-359` の `TableHeader`: 種別(351)/**記録ID(352)**/業務日付(353)/代表商品(354)/明細数(355)/状態(356)/記録日時(357)/操作(358) の 8 列。**drift**: task 提示の head anchor `:349` は `<TableHeader>` の開始行で、実際の `<TableHead>記録ID</TableHead>` literal は `:352`。body 側 `:373-375`（`<TableCell className="font-mono tabular-nums">#{String(record.record_id)}</TableCell>`）は task 提示どおり drift なし
- フィルタ欄「記録ID」ラベルは `:216-218`（`<label ... htmlFor="records-id">記録ID</label>`）で一覧列と独立した UI 要素、維持する（task 提示 `:217` と一致）
- `01-decision-rules.md:435` の DSR-22 固定列マッピング表・入出庫履歴行は「（記録ID列は本節の (b) 決定により一覧から除外。**現状〈本 PR 時点〉は記録IDを含む 8 列…のままで、除去は runtime follow-up で実施する**）」という**未実施を前提にした注記**を含んでおり、本 lane が列を撤去した後はこの注記が stale になる（S8 で是正）
- `ManualSalePage.tsx:730`（直近テーブルの記録ID列 head）/ `DisposalPage.tsx:684`（同）は Non-scope（下記）。それぞれの保存結果パネルの「記録ID」ラベルは `ManualSalePage.tsx:356` / `DisposalPage.tsx:315`（両方 drift なし、確認済み）。**（F18, Sonnet P3-2 追加）**: `ReceivingPage.tsx:332` / `ReturnExchangePage.tsx:448` にも同型の保存結果パネル「記録ID」span がある（`<span className="text-muted-foreground">記録ID</span>` + `{result.record_id}`、両方 drift なし、確認済み）。計 4 画面（入庫・返品交換・手動販売・廃棄）すべての保存結果パネルが記録ID を表示しており、いずれも本 lane が触るのは `InventoryRecordsPage.tsx` の一覧列のみのため、この 4 箇所はすべて Non-scope

**S5 備考「—」統一**:
- `ReceivingPage.tsx:698`: `<TableCell>{record.note ?? ""}</TableCell>`（空欄は素の空文字、drift なし）。truncate+title の precedent は `OperationLogsPage.tsx:533`（`<TableCell className="max-w-0 truncate" title={item.summary}>`）— **drift**: task 提示の `:522` は実際には `:533`（11 行のずれ、他の operation-logs 実装変更による自然なズレと推定）
- `ReturnExchangePage.tsx`: `formatNote()`（`:110-113`）/`hasNote()`（`:115-117`）は共有ヘルパーで、消費箇所は 3 箇所（`:475` 保存結果パネルの `<p>`、`:981` 直近テーブルの `<span>`。**新規発見**: task 提示は直近テーブル `:977-982` のみだったが、同じ `formatNote()` は保存結果パネル `:467-477`（`<span className="text-muted-foreground">備考</span>` の隣、値は `:475`）でも使われており、`formatNote()` 本体を直す 1 箇所の変更で両方に反映される）。`formatNote()` の `"備考なし"` を `"—"` に変えるだけで両消費箇所に効く（`hasNote()` は変更不要、文字色の切替ロジックは維持）
- `ReturnExchangePage.test.tsx:261`（直近テーブル region 内 `getByText("備考なし")`）/`:278`（保存結果 region 内 `getByText("備考なし")`）はいずれも drift なし、`"—"` へ書き換える
- `ManualSalePage.tsx`: 直近テーブルは `commands.listInventoryRecords(RECENT_MANUAL_SALES_QUERY)`（`:163`、他 3 画面と異なり共有 `InventoryRecordSummary` DTO を使う専用 command 無し）を使用しており、`InventoryRecordSummary`（`src/lib/bindings.ts:841-850`）は `record_type`/`record_id`/`business_date`/`representative_item`/`item_count`/`status`/`created_at`/`detail_route` の 8 field のみで **`note` フィールドが無い**（実測確認済み）。備考列追加は DTO 変更を要するため Non-scope（下記）
- `DisposalPage.tsx`: `rg -n "備考|note" DisposalRecordDetailPage.tsx` 0 件（⑩ 起票時実測どおり、drift なし）。廃棄・破損に note フィールドなし、Non-scope
- `MovementTable.tsx:57`（`<TableHead>備考</TableHead>`）/`:93-95`（`<TableCell className="max-w-80 truncate">{movement.note?.trim() ? movement.note : "—"}</TableCell>`）は drift なし。「—」自体は既に実装済み、truncate のみで `title` を欠く点が是正対象
- `ReturnRecordDetailPage.tsx:55-58`（独立ローカル `formatNote`）: `:57` `return trimmed === "" ? "備考なし" : trimmed;` は drift なし。消費先は `:166-167` の `<section aria-label="備考">`
- `OtherRecordDetailPages.test.tsx:263`（`REQ-202/UI-03-D19` テスト内 `getByText("備考なし")`）は drift なし、`"—"` へ書き換える。**Coordinator adjudication（2026-09-08、CHANGE）**: テスト名自体が「備考なしを独立表示する」という旧文言を含むため、Writer は同じ commit で it() の説明文も「備考が無い記録は「—」を独立表示する」等へ更新することを**必須**とする（maintainability lens: test 名は実際の挙動と一致させる、可読性是正の任意扱いから昇格）

**S6「直近の○○」系 4 画面 + 価格履歴**:
- 4 画面の recent section 見出し: `ReceivingPage.tsx:661`（h2「直近の入庫」）/ `ManualSalePage.tsx:697`（h2「直近の手動販売出庫」）/ `ReturnExchangePage.tsx:935`（h2「直近の返品・交換」）/ `DisposalPage.tsx:653`（h2「直近の廃棄・破損」）はいずれも drift なし。件数 N: `ReceivingPage.tsx:151`（`commands.listReceivings(1, 10, null, null)`）→N=10、`ReturnExchangePage.tsx:205`（`commands.listReturns(1, 10, null, null)`）→N=10、`DisposalPage.tsx:154`（`commands.listDisposals(1, 10, null, null)`）→N=10、`ManualSalePage.tsx:84`（`RECENT_MANUAL_SALES_QUERY.per_page: 5`）→**N=5**（他 3 画面と異なる。**drift**: task の例示 `ReceivingPage.tsx:58 per_page 10` は実在するが PRODUCT_SEARCH_QUERY（商品検索候補、`:60-67`）の値であり「直近の入庫」件数とは無関係。正しい根拠は `:151` の `listReceivings` 呼び出し引数）
- `PriceHistorySection.tsx:43`: `<FormSection title="価格履歴" description="直近の売価・原価の変更を新しい順に表示します。">` で件数の記載が無い。`limit` state 既定値は `:16` `useState(10)`。owner 決定文言「直近 10 件の売価・原価の変更を新しい順に表示します。」（`docs/Plans.md` runtime backlog 起源、catalog `:193` の例文と一致）へ更新する
- `PriceHistorySection.tsx:66-80`: `<ul className="divide-y rounded-md border">` + `<li>`（`entry.changed_at` / 売価 old→new / 原価 old→new の 3 情報）。**drift**: task 提示 `:66-77` は実際には `:66-80`（末尾 `</ul>` と条件分岐の閉じまで含む）。列見出し無し。`<Table>`+`TableHead`（変更日時/売価/原価）へ変換する。既存テストは `ProductForm.test.tsx:551-598` 付近が `findByText` で内容を検証しており（`rg` 確認済み、`PriceHistorySection.test.tsx` という専用ファイルは存在しない）、構造変更後もテキスト自体は残るため破壊されない。新規 columnheader オラクルはこのファイルへ追加する（T4: 新規テストファイルを作らず既存ファイルを拡張）
- **（F5, Opus P2-3 / Sonnet P2-1 追加）** `PriceHistorySection.tsx:82-93`: `limit === 10` のとき `<Button variant="outline" size="sm" onClick={() => setLimit(100)}>すべて表示</Button>` を表示する（`limit` state は `:16` `useState(10)`、クリックで `100` へ増える 2 状態）。`:43` の `description` を固定文字列「直近 10 件の…」にすると `limit=100` へ展開した後に文言と実際の取得件数（100 件）が食い違う。Coordinator decision: `description` を `limit` から動的に導出する（`` `直近 ${limit} 件の売価・原価の変更を新しい順に表示します。` ``）
- `ManualSalePage.tsx:725`: `<div className="rounded-md border"><Table>...</Table></div>` の内側枠。他 3 画面（`ReceivingPage.tsx:674` 相当、`ReturnExchangePage.tsx`、`DisposalPage.tsx:680` 相当）は `<Table>` を直接置き内側の追加枠を持たない（DSR-16 準拠は「外す」方向、⑩ 設計判断どおり）

**S7 記録状態Badge + 単位表示統合**:
- `ManualSalePage.tsx:749`: `<TableCell>{formatRecordStatus(record.status)}</TableCell>`（plain text、drift なし）。既存 5 箇所（`InventoryRecordsPage.tsx` 等）はすべて `<Badge variant="outline">{formatRecordStatus(...)}</Badge>` 済み（⑩ 起票時実測どおり）
- ローカル `formatQuantity` は 9 file に存在（`rg -c "function formatQuantity" src --glob '!*.test.*'` = 9、drift なし）: `DisposalPage.tsx:91-93`（呼出し `:459,514`）/ `ReturnExchangePage.tsx:119-121`（呼出し `:783,834`）/ `ManualSalePage.tsx:101-103`（呼出し `:557,610`）/ `CsvImportRecordDetailPage.tsx:51-53`（呼出し `:187`）/ `ManualSaleRecordDetailPage.tsx:42-44`（呼出し `:175`）/ `ReceivingRecordDetailPage.tsx:37-39`（呼出し `:159`）/ `DisposalRecordDetailPage.tsx:43-45`（呼出し `:165`）/ `ReturnRecordDetailPage.tsx:47-49`（呼出し `:208`）/ `StocktakeRecordDetailPage.tsx:41-52`（`formatQuantity`/`formatSignedQuantity`/`formatOptionalQuantity` の 3 関数、呼出し `:194,197,200`）。すべて呼出し行は task 提示どおり drift なし。**（G7, Sonnet P3-1 是正）**: 「全 12 呼出しサイト」は誤りで正しくは **14**（`DisposalPage.tsx` 2〈`:459,514`〉+ `ReturnExchangePage.tsx` 2〈`:783,834`〉+ `ManualSalePage.tsx` 2〈`:557,610`〉+ detail page 単発 5〈`:187,175,159,165,208`〉+ `StocktakeRecordDetailPage.tsx` 3〈`:194,197,200`〉= 14）。`rg -n "formatQuantity\(|formatSignedQuantity\(|formatOptionalQuantity\(" src/features --glob '!*.test.*' | wc -l` = **26**（実測、内訳: 関数定義 11〈8 file × 1 + `StocktakeRecordDetailPage.tsx` の 3 関数〉+ 上記 render 呼出し 14 + `formatOptionalQuantity` 定義内部の委譲呼出し 1〈`StocktakeRecordDetailPage.tsx:51`〉= 26）。この rg コマンドは定義行と内部委譲呼出しも含むため、「呼出しサイト」の主張には render 側の 14 のみを数える
- 9 箇所とも `value.toLocaleString()`（または `.toLocaleString("ja-JP")`）で桁区切りを付けたうえで unit code をそのまま結合している。canonical `formatStockDisplay`（`format-stock-display.ts:15-24`）は `String(quantity)`（**桁区切りなし**）+ unit 翻訳（pcs→個/cm→cm/その他→—）。**Coordinator adjudication（2026-09-08）**: 桁区切りの退行は受け入れず、`formatStockDisplay` 自体を両分岐とも `quantity.toLocaleString("ja-JP")` へ修正する（下記「設計判断」節）。これにより既に canonical を使っている 4 箇所（`ProductTable.tsx:79`/`ProductListTable.tsx:88`/`StockMovementsPage.tsx:124-127`/`StockDetailContent.tsx:81-84`、**drift**: task 提示の `:70`/`:86`/`:126-129` はそれぞれ `:79`/`:88`/`:124-127` に訂正）も桁区切り表示を得る（意図した挙動変化）。`rg -n '[0-9]{4,} 個|[0-9]{4,} cm' src --glob '*.test.*'` は 0 hit（実測確認済み）— この 4 箇所を含め、1000 以上の数量文字列を assert する既存 test は無いため test churn なし
- `formatSignedQuantity`/`formatOptionalQuantity`（`StocktakeRecordDetailPage.tsx` のみ、1 file）に対応する canonical helper は `format-stock-display.ts` に無い（`formatStockDisplay`/`formatStockUnitLabel` の 2 関数のみ）。1 file のみの使用のため rule of three 未達、shared module への昇格はしない（ponytail rung 2: 既存パターンの拡張のみ）
- **（F4, Opus P2-2 追加）`formatStockDisplay` の fallback「—」到達可能性**: `docs/DB_DESIGN.md:94`「`products.stock_unit: CHECK(stock_unit IN ('pcs','cm'))`」により `stock_unit` の値域は DB 制約で `pcs`/`cm` の 2 値に閉じている。`formatStockDisplay(quantity: number, unit: string)` のシグネチャは `unit: string` で型上は任意の文字列を受理するが、実データ経路（DB → DTO → runtime）では fallback「—」分岐に到達しない。**Coordinator adjudication**: 値域が閉じているため fallback 到達不能・現状の「—」実装のままで許容する（新たな assert や runtime guard は追加しない、ponytail: 到達しない分岐への防御コードを増やさない）。万一将来 `stock_unit` の値域が拡張された場合は、既存 Q-4 fallback 契約（「—」）どおりに動作し続ける — この既存契約は SC19 の `formatQuantity` 統合オラクルに紐付ける
- **（F14, Opus P3-4 是正）import 現況**: `ReturnExchangePage.tsx:39`/`DisposalPage.tsx:38`/`ManualSalePage.tsx:40` は既に `formatStockUnitLabel` を import 済み（単位列専用、下記 F15 参照）。9 file すべてに両関数を新規 import する指示は誤りで、**必要な file・必要な関数のみ**追加する: この 3 file は `formatStockDisplay` のみ新規追加（候補一覧セルで使用）、残り 6 file（`CsvImportRecordDetailPage.tsx`/`ManualSaleRecordDetailPage.tsx`/`ReceivingRecordDetailPage.tsx`/`DisposalRecordDetailPage.tsx`/`ReturnRecordDetailPage.tsx`/`StocktakeRecordDetailPage.tsx`）は `formatStockDisplay` を新規 import（いずれも未 import、確認済み）
- **（F15, Opus P3-5 追加）単位重複の解消**: `ManualSalePage.tsx:610`（現在庫セル）と `:651`（単位セル、同じ `row.stockUnit` を参照）/ `DisposalPage.tsx:514`+`:595` / `ReturnExchangePage.tsx:834`+`:881` はそれぞれ同一行内に「現在庫」列と独立の「単位」列（`formatStockUnitLabel(row.stockUnit)`、既存）を持つ。ここで現在庫セルに `formatStockDisplay`（単位サフィックス付き）をそのまま使うと、単位が同じ行に二重表示される。9 site の分類を表で明記する:

| file | call site | 対応 |
|---|---|---|
| `DisposalPage.tsx` | `:459`（商品候補一覧、単位列なし） | `formatStockDisplay`（単位付き） |
| `DisposalPage.tsx` | `:514`（入力行、`:595` に単位列あり） | 数値のみ `row.currentStockQuantity.toLocaleString("ja-JP")`（単位は言わない） |
| `ReturnExchangePage.tsx` | `:783`（商品候補一覧、単位列なし） | `formatStockDisplay`（単位付き） |
| `ReturnExchangePage.tsx` | `:834`（入力行、`:881` に単位列あり） | 数値のみ `toLocaleString("ja-JP")` |
| `ManualSalePage.tsx` | `:557`（商品候補一覧、単位列なし） | `formatStockDisplay`（単位付き） |
| `ManualSalePage.tsx` | `:610`（入力行、`:651` に単位列あり） | 数値のみ `toLocaleString("ja-JP")` |
| `CsvImportRecordDetailPage.tsx` | `:187`（単位列なし） | `formatStockDisplay` |
| `ManualSaleRecordDetailPage.tsx` | `:175`（単位列なし） | `formatStockDisplay` |
| `ReceivingRecordDetailPage.tsx` | `:159`（単位列なし） | `formatStockDisplay` |
| `DisposalRecordDetailPage.tsx` | `:165`（単位列なし） | `formatStockDisplay` |
| `ReturnRecordDetailPage.tsx` | `:208`（単位列なし） | `formatStockDisplay` |
| `StocktakeRecordDetailPage.tsx` | `:194,197,200`（単位列なし、3 列とも同じ `stock_unit`） | `formatStockDisplay`/`formatSignedQuantity`/`formatOptionalQuantity`（薄いラッパー経由） |

「数値のみ」の 3 site（`:610`/`:514`/`:834`）は `formatStockDisplay` を呼ばず `Number.prototype.toLocaleString("ja-JP")` を直接呼ぶ（canonical helper が単位を強制的に付けるため、単位無し表示にはラッパーを介さない ponytail rung 6: 1 行で済むため関数を作らない）
- `CsvImportRecordDetailPage.tsx` は ⑭ の S2（`STATUS_TONE` 追加、`STATUS_LABELS:38-42` の隣に新設）と本 lane の S7（`formatQuantity:51-53` → canonical 化）が同一 file の近接領域（38-53 行付近）を触る。Writer は ⑭ tip merge 後にこの file のコンフリクトを個別確認する

**S8 docs 同期**:
- **（G1, Opus P1-1, CHANGE）** catalog `:48`（component gap 記述、5 画面列挙）/ `:191`（`MovementTable.tsx:94` の `title` 欠落記述）はいずれも「未反映」を前提にした現在形の gap 文であり、本 PR 完了後は**単なる状態注記の追記ではなく、gap 文自体を反映済み文へ書き換える**（F1 のルール、下記 S8 参照）。append 方針が適用されるのは `## 更新履歴` への新規行追加のみで、`:48`/`:191` 本文には適用しない
- `01-decision-rules.md:435` の「現状〈本 PR 時点〉は記録IDを含む 8 列…のままで、除去は runtime follow-up で実施する」という一節を、本 PR での列撤去完了を反映する形へ更新する（決定内容〈(b)〉自体は変更しない、実施済み状態への更新のみ）
- `docs/function-design/60,67,68,65` に「実装状況」相当セクションは存在しない（`rg -n "実装状況"` 0 hit、確認済み）— 追加不要
- catalog `## 更新履歴`（`:994-999` 付近、末尾行 `:998`）/ `01-decision-rules.md` `## 更新履歴`（`:481-486` 付近、末尾行 `:486`）にそれぞれ本 PR の新規 1 行を追加する（既存行は変更しない、append-only）

## 設計判断（Coordinator adjudication）

- **S1 PageHeader 修正方式**: catalog `:48` が明記する root-cause fix は「`actions` 分岐（`:29-36`）のみを `<h1>` + 条件付き `<p>`（`subtitle`/`description`）を `<div className="space-y-1">` にまとめる」形に限定し、外側 `<header>` の class・`subtitle`-only 分岐（`:38-45`）は無変更（`PageHeader.test.tsx:61-73` は無変更で green のまま）。単一 `<header className="flex ...">` へ両分岐を統合する案も検討したが、(a) catalog が既に owner Human Gate + Plan Review 3 round + Codex 4 round を経て確定した記述であり再設計は不要、(b) 統合案は `PageHeader.test.tsx` の 2 test（`(a)`/`(b)` variant の「`header` に `space-y-1` が付く」assertion）を破壊し diff が大きくなる、という 2 点から不採用（ponytail: 既存の確定済みパターンを踏襲し、承認済みでない再設計をしない）。`PageHeader.test.tsx:61-73` は「`subtitle`+`actions` 共存時も両方描画される」ことを示す positive assertion（`getByText` で subtitle 文言確認）を追加し、`description` との co-render も同テスト内で検証する（新規テストファイルは作らず既存 it() を拡張、T4 準拠）
- **S7 桁区切りの扱い（Coordinator adjudication 2026-09-08、CHANGE）**: 9 箇所を canonical `formatStockDisplay` へそのまま統合すると 1000 以上の数量で桁区切りが失われる（「1,234 個」→「1234 個」）退行が起きるため、これを受け入れない。代わりに `format-stock-display.ts` の `formatStockDisplay` 自体を修正し、`pcs`/`cm` 両分岐で `String(quantity)` を `quantity.toLocaleString("ja-JP")` に置き換える（`formatStockUnitLabel` は無変更）。契約: `formatStockDisplay(1234, "pcs")` = 「1,234 個」、`(10, "pcs")` = 「10 個」（既存契約不変）、`(300, "cm")` = 「300 cm」（既存契約不変）。この修正は既に canonical を使っている 4 箇所（`ProductTable.tsx:79`/`ProductListTable.tsx:88`/`StockMovementsPage.tsx:124-127`/`StockDetailContent.tsx:81-84`）にも桁区切り表示を追加する意図した挙動変化で、`rg -n '[0-9]{4,} 個|[0-9]{4,} cm' src --glob '*.test.*'` = 0 hit（実測確認済み）のため test churn は無い。ponytail: 独自の桁区切りラッパーを新設せず既存の canonical 関数を 1 行ずつ直すだけ（rung 2、既存パターンの最小拡張）。AC-L3-4 はこれにより「owner が許容範囲か確認するリスクチェック」ではなく「桁区切りが付いていることを確認する positive contract」へ書き直す
- **`formatSignedQuantity`/`formatOptionalQuantity` の扱い**: `StocktakeRecordDetailPage.tsx` 内のローカル関数として残し、内部実装のみ `formatStockDisplay` を呼ぶ形に薄くする（`formatSignedQuantity` は符号 `+` の付与のみ、`formatOptionalQuantity` は `null` → 「—」 のみを担う 1 行ラッパー）。1 file 限定のため shared module への昇格はしない
- **S2 `subtitle` と `description` の役割分担**: 60:101「subtitle は初期投入・大量更新用の短い説明に留める」を根拠に、`description` を追加する 3 画面には `subtitle` を追加しない（1 行の副題が無いため）。`SupplierManagementPage.tsx`（単文）は `subtitle` を使う
- **（F10, Opus P2-8 追加）S6(c) の根拠は owner 原文の反転である旨を明記**: owner 原文（`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md:83`「直近の○○シリーズ、手動販売出庫だけ囲ってんのに他囲ってないとかあるから囲うので統一しちゃおうか」）は文字どおり読むと「他 3 画面にも囲みを足す」方向を示唆する。しかし ⑩ Plan Review round 1 P1（`docs/archive/plans/2026-09-06-ui-polish-batch3-design.md:12`）の実測により、**4 画面とも外枠（`rounded-md border p-4` の `<section>`）は既にあり**、`ManualSalePage.tsx` だけが内側にもう 1 段 `<div className="rounded-md border">` を重ねている（二重囲み）ことが判明した。owner の意図（「統一しちゃおう」＝見た目を揃えたい）と DSR-16「囲みは意味階層ごとに 1 つまで」の両方を満たす技術的に正しい方向は「他 3 画面に箱を足す」ではなく「`ManualSalePage.tsx` の内側の箱を外す」であり、⑩ はこの実測に基づき owner 原文の字面を反転させる形で確定した（[archived packet](../archive/plans/2026-09-06-ui-polish-batch3-design.md) 起票時実測・設計判断節）。本 lane はこの ⑩ 決定をそのまま実装するのみで新規判断は行わない

## Scope

- **S1 `src/components/patterns/PageHeader.tsx` root-cause fix**（`:27-45`、**Coordinator adjudication 2026-09-08: ACCEPT as drafted、Q2**）: `PageHeaderProps` に `description?: string`（`text-sm text-muted-foreground` の `<p>`、`subtitle` の下に描画、catalog `:46`）を追加する。`actions !== undefined` 分岐（`:29-36`）を、`<h1>` + 条件付き `subtitle` `<p>` + 条件付き `description` `<p>` を `<div className="space-y-1">` にまとめ `{actions}` と並べる形へ変更する（外側 `<header>` の class は無変更）。`subtitle`-only 分岐（`:38-45`）にも同様に `description` の描画を追加する（`actions` の有無に関わらず `subtitle`/`description` が同じ見た目になる）。設計意図: component 1 箇所の修正で `ReceivingPage.tsx:295`/`ManualSalePage.tsx:310`/`ReturnExchangePage.tsx:418`/`DisposalPage.tsx:285` の 4 画面の消えている `subtitle` と、S2/S3 の新規 `description`/`subtitle` 呼び出しを同時に成立させる。完了条件: `PageHeader.test.tsx` に `description` 描画・`subtitle`+`actions`+`description` 共存の positive assertion を追加し、既存 `:61-73` を含む全 test が green のまま
- **S2 説明セクション 3 画面**: `ProductImportPage.tsx:20-32` に `description={"CSVファイルから複数の商品をまとめて登録・更新するページです。ファイルを選ぶと新規登録候補・既存商品との重複・エラー行の3つに分けて内容を確認でき、重複行は初期状態でスキップされるので上書きする行だけ個別に選んで取り込みます。取り込みを実行すると、新規登録・上書き更新・スキップの件数が画面に表示されます。"}`（60:102 と exact 一致）を追加。`PluExportPage.tsx:360` に **（F17, Opus P3-7 是正、verbatim 引用）** `description={"レジのPLU登録状況を書き出すページです。『レジ登録状況を読み込む』でレジのCSV（Z004）を読み込み、空き・外部登録・アプリ管理・競合の件数を確認します。『差分を書き出す』（未反映の商品だけ）か『全件を書き出す』を選んで保存し、『この書出しを未反映から外す』を押して確定します。"}`（67:123 と exact 一致）を追加。`BackupRestorePage.tsx:335` に `description={"アプリのデータ全体をまとめて保存し、必要なときに元に戻すためのページです。自動バックアップの時刻を設定したり、今すぐ手動でバックアップを作成したり、保存先を選んだりできます。過去のバックアップから復元すると現在の記録は元に戻せませんが、復元の前には自動で今の状態のバックアップが作られます。"}`（68:147 と exact 一致）を追加する。設計意図: function-design 側で owner 確定済みの文言をそのまま runtime へ反映するのみで、新規の文言判断は行わない。完了条件: 各画面で `getByText` により文言全体（または文の先頭部分）が解決できる
- **S3 `SupplierManagementPage.tsx:35-38`**: sibling `<p>` を削除し、`<PageHeader title="取引先管理" actions={addButton} subtitle="メーカー・ブランドの追加、名称変更、重複した取引先の統合を行います。" />` へ統合する。設計意図: S1 の component 修正により `actions`+`subtitle` が共存できるようになったため、外側 sibling `<p>` という迂回実装が不要になる。完了条件: 文言が `<header>` 内（`PageShell` の `space-y-6` の外）で描画される
- **S4 記録ID列撤去**: `InventoryRecordsPage.tsx` の head（`:352` の `<TableHead>記録ID</TableHead>`）と body（`:373-375` の `<TableCell className="font-mono tabular-nums">#{String(record.record_id)}</TableCell>`）を削除し 7 列にする。フィルタ入力欄（`:216-218`）は変更しない。設計意図: DSR-22（`01-decision-rules.md:443`）で owner culling 済みの (b) 決定をそのまま実装する。完了条件: `rg -Fc '<TableHead>記録ID</TableHead>' src/features/inventory-records/InventoryRecordsPage.tsx` = 0（起票時 1）、ヘッダー配列テスト（新規）で 7 列（種別/業務日付/代表商品/明細数/状態/記録日時/操作）を確認する
- **S5 備考「—」統一**: (a) `ReceivingPage.tsx:698` を `<TableCell className="max-w-80 truncate" title={record.note ?? undefined}>{record.note?.trim() ? record.note : "—"}</TableCell>`（`OperationLogsPage.tsx:533` の truncate+title パターンを再利用）へ変更。(b) `ReturnExchangePage.tsx` の共有 `formatNote()`（`:110-113`）の戻り値 `"備考なし"` を `"—"` へ変更（`hasNote()` は無変更）。この 1 箇所の変更で `:475`（保存結果パネル）と `:981`（直近テーブル）の両方に反映される。(c) `ManualSalePage.tsx` は Non-scope（DTO に `note` フィールドが無い、下記参照）。(d) `MovementTable.tsx:93-95` の `className="max-w-80 truncate"` を `className="max-w-80 whitespace-normal break-words"` へ変更し、`title={movement.note?.trim() ? movement.note : undefined}` を追加する（空値時は `title` を出さない）。(e) `ReturnRecordDetailPage.tsx:57` の `"備考なし"` を `"—"` へ変更する。設計意図: 「—」への統一は owner culling 完了済み（catalog `:191`）。`MovementTable` は truncate から折り返しへ変えることで DSR-12 の全文確認手段を自身で満たす（展開 widget は作らない）。完了条件: `rg -Fo "備考なし" src/features/return-exchange/ReturnExchangePage.tsx src/features/inventory-records/ReturnRecordDetailPage.tsx | wc -l` = 0（起票時 2 file 合計で hit あり、**F11 是正**: cross-file scalar count）、`ReceivingPage.tsx`/`MovementTable.tsx` に `title=` 属性が追加される
- **S6「直近の○○」系統一 + 価格履歴表構造化**: (a) `ReceivingPage.tsx:661`/`ReturnExchangePage.tsx:935`/`DisposalPage.tsx:653` のセクション見出し直下に「直近 10 件の{入庫/返品・交換/廃棄・破損}を新しい順に表示します。」、`ManualSalePage.tsx:697` は N=5 の「直近 5 件の手動販売出庫を新しい順に表示します。」を追加する（各画面の実際の取得件数に一致させる）。**（F5, CHANGE）** `PriceHistorySection.tsx:43` の `description` は固定文字列ではなく `limit` state から動的に導出する（`` `直近 ${limit} 件の売価・原価の変更を新しい順に表示します。` ``）— `:82-93`「すべて表示」button で `limit` が `10`→`100` に変わるため、固定文言だと展開後に実件数と食い違う。(b) `PriceHistorySection.tsx:66-80` の `<ul>/<li>` を `<Table>`（`TableHead`: 変更日時/売価/原価）へ変換する（既存の `entry.changed_at` / 売価 old→new / 原価 old→new の情報構造は維持、表示形式のみ変更）。(c) `ManualSalePage.tsx:725` の内側 `<div className="rounded-md border">` を外し `<Table>` を直接置く（他 3 画面と同型に揃える、DSR-16。根拠は owner 原文の反転であることを上記「設計判断」節 F10 に明記済み）。設計意図: 4 画面の文言統一と価格履歴の表構造化は catalog `:193` が既に確定した使用パターンをそのまま適用するのみ。完了条件: 各画面で説明文が exact match、`PriceHistorySection` の `TableHead` 3 列が `getByRole("columnheader")` で解決、「直近 10 件の…」→「すべて表示」クリック後「直近 100 件の…」の 2 状態が対で確認される。**（F3, Opus P2-1 / Sonnet P1-1 是正）**: `rg -Fo 'rounded-md border">' src/features/manual-sale/ManualSalePage.tsx | wc -l` は起票時 **3**（`:538`〈商品候補一覧〉/`:590`〈入力中の行一覧〉/`:725`〈直近テーブル、対象〉）— 是正後は **2**（`:538`,`:590` は別テーブルのため対象外で残る、撤去されるのは `:725` の 1 箇所のみ）。`ManualSalePage.test.tsx` に「直近テーブルの `<Table>` が bordered `<div>` の直下にない」DOM assertion（例: 直近 region 内で `container.querySelector(':scope > table')` 相当、または `within(recentRegion).queryByRole("table")` の親要素が `<div class="rounded-md border">` でないことを確認）を追加する
- **S7 記録状態Badge + 単位表示統合**: `ManualSalePage.tsx:749` を `<Badge variant="outline">{formatRecordStatus(record.status)}</Badge>` へ統一する。`format-stock-display.ts` の `formatStockDisplay` を `pcs`/`cm` 両分岐とも `quantity.toLocaleString("ja-JP")` へ修正する（1 行ずつ、`formatStockUnitLabel` は無変更、Coordinator adjudication）。9 箇所のローカル `formatQuantity`（+ `StocktakeRecordDetailPage.tsx` の `formatSignedQuantity`/`formatOptionalQuantity`）を削除する。**（F15, CHANGE）**: 置き換え先は一律ではない — `ManualSalePage.tsx:610`/`DisposalPage.tsx:514`/`ReturnExchangePage.tsx:834`（入力行テーブル、それぞれ隣接 `:651`/`:595`/`:881` に独立の「単位」列 `formatStockUnitLabel` が既にある）は数値のみ `quantity.toLocaleString("ja-JP")` を直接呼ぶ（単位の二重表示を避ける、ponytail rung 6: 1 行で済むため関数を作らない）。それ以外の 9 site（`ManualSalePage.tsx:557`/`DisposalPage.tsx:459`/`ReturnExchangePage.tsx:783`〈商品候補一覧、単位列なし〉+ 6 detail page の単発サイト、上記「起票時実測」表参照）は `formatStockDisplay`（単位付き）を使う。`StocktakeRecordDetailPage.tsx` の `formatSignedQuantity`/`formatOptionalQuantity` はローカル関数として残し、内部で `formatStockDisplay` を呼ぶ薄いラッパーにする（1 file 限定、shared 化しない）。**（F14, CHANGE）import**: `ReturnExchangePage.tsx:39`/`DisposalPage.tsx:38`/`ManualSalePage.tsx:40` は `formatStockUnitLabel` を既に import 済みのため再追加しない — この 3 file は `formatStockDisplay` のみ新規 import する。残り 6 detail page file は `formatStockDisplay` を新規 import する（いずれも未 import）。設計意図: catalog `:176` が既に確定した「共通 formatter を使い unit を直接結合しない」ルールを実装する。9 箇所の重複コードを削除できる（ponytail: 削除は追加より良い）。桁区切りは canonical 側で復元し、既存 4 箇所（`ProductTable.tsx:79`/`ProductListTable.tsx:88`/`StockMovementsPage.tsx:124-127`/`StockDetailContent.tsx:81-84`）も桁区切り表示になる（意図した挙動変化、テスト破壊なし確認済み）。**（F4）** `formatStockDisplay` の fallback「—」は DB CHECK 制約（`stock_unit IN ('pcs','cm')`）により実データでは到達不能、現状のまま許容し新規 guard は追加しない。完了条件: `rg -Fo 'function formatQuantity' src | wc -l` = 0（起票時 9、**F11**: scalar count）、`format-stock-display.test.ts` に `formatStockDisplay(1234, "pcs")` = 「1,234 個」の独立 literal ケースが追加される、6 detail page file で `formatStockDisplay` の import が追加され、`ReturnExchangePage.tsx`/`DisposalPage.tsx`/`ManualSalePage.tsx` は `formatStockDisplay` のみ追加 import（`formatStockUnitLabel` は既存のまま再追加しない）、**（F12、hedge 削除）** `StocktakeRecordDetailPage.test.tsx`（実在）で符号付き/optional のケースが従来どおり機能する
- **S8 docs 同期**:
  - **(F1, Opus P1-1, CHANGE)** catalog `:48` の component gap 記述のうち現在形の gap 文「`actions` と `subtitle`（および説明セクション）は現状排他である」「…の計 5 画面が影響を受けている」は**単なる状態注記の追記ではなく書き換え対象**とする（反映済み・「何を・どの PR で・どう解消したか」の文へ全面改稿）。書き換え例: 「`actions` と `subtitle`（および説明セクション）の排他は本 PR（⑮）で解消済み: `PageHeader.tsx` の `actions` 分岐に `<h1>` + 条件付き `subtitle`/`description` を `<div className="space-y-1">` にまとめる root-cause fix を適用し、`SupplierManagementPage.tsx` の外側 sibling `<p>` 移行を含む計 5 画面で説明文/副題が正しく描画されるようになった（外側 `<header>` の class は不変のため `PageHeader.test.tsx:61-73` は green のまま）。呼び出し側で wrapper を都度書く使用パターンは不要になった。」同様に catalog `:191` の「`MovementTable.tsx:94` は現状 truncate のみで `title` を欠くため是正対象」を「`MovementTable.tsx:93-95` は本 PR（⑮）で truncate から折り返し（`whitespace-normal break-words`）+ `title` 属性へ是正済み、`MovementTable` 自身が全文確認手段を持つ」へ書き換える。**（G6, CHANGE）** オラクルは AC9 を正本とする（本節では転記しない、乖離防止）
  - **(F13, Opus P3-3)** catalog `:191` はさらに独立した stale citation を持つ: `OperationLogsPage.tsx:522`（truncate+title precedent）は実測 `:533` に drift している（本 packet「起票時実測」S5 節で確認済み）。この citation も `:522`→`:533` へ訂正する。**（G6, CHANGE）** オラクルは AC9 を正本とする（本節では転記しない）
  - `01-decision-rules.md:435` の「現状〈本 PR 時点〉は記録IDを含む 8 列…のままで、除去は runtime follow-up で実施する」という一節を、本 PR での列撤去完了を反映する形へ更新する（decision 本体 (b) は変更しない）
  - **(F9, Opus P2-7 / G2, Opus P1-2 是正)** `01-decision-rules.md:435`（`InventoryRecordsPage.tsx:342`〈記録日時〉/`:339`〈代表商品〉/ 末尾の裸 `` `:336-343` ``）と `:443`（`InventoryRecordsPage.tsx:336-343`、file 名付き）の anchor は既に実測 `:349-359`/`:357`/`:354` へ drift しており（本 packet「起票時実測」S4 節）、S4 の列撤去でさらに 1 列分ずれる（記録ID列撤去後は後続列の head 行番号がそれぞれ 1 つ若返る）。Writer は実装完了後の実測行番号（列撤去後の実際の head 行、`rg -n` で再実測）へこれらの引用を更新する（正確な新番号は実装 diff 確定後にのみ判明するため plan 段階では確定させない）。**G2 是正**: `:435` は file 名付き `InventoryRecordsPage.tsx:336-343` ではなく裸の `` `:336-343` `` を書いている（file 名の再掲を省略）ため、file 名付き literal の出現は `:443` のみ（1 件）— 「起票時 2」という書き方は誤りで、正しいオラクルは裸の `` `:336-343` `` を対象にする。**（G6, CHANGE）** オラクルは AC9 を正本とする（本節では転記しない）。新引用が実装後の実際の行番号と一致することは Final Review で `rg -n` 実読により確認する（pre-implementation の時点で正確な新番号を確定できないため機械 oracle 化できず、Writer 自己検証 + Final Review 実測に依存、Residual Test Gap）
  - **(G3, Opus P2-1 追加)** catalog `:48` の 4 画面 anchor（`ReceivingPage.tsx:288-291`/`ManualSalePage.tsx:303-306`/`ReturnExchangePage.tsx:411-414`/`DisposalPage.tsx:278-281`）は実際の `<PageHeader` 開始行（`:295`/`:310`/`:418`/`:285`、いずれも +7 drift）と一致していない。F1 の書き換え時にこれら 4 anchor も実測行へ訂正する（削除ではなく訂正を優先 — anchor 自体は読者の役に立つ）。ただし S1 の component 修正で `PageHeader.tsx` 内部の行番号は動くが、呼び出し側 4 画面の `<PageHeader` 開始行はコンポーネント内部の行数変化の影響を受けないため、Writer は実装完了後にこの 4 行を再実測して確定する。オラクルは AC9 参照
  - **(G4, Opus P2-2 追加)** catalog `:46`「既存の `PageHeader` 外側 sibling `<p>` 実装（例: `SupplierManagementPage.tsx:35-38`）は、この記法へ runtime lane で移行する。」は未来形の申し送り文で、S3 実装完了後は事実と異なる（既に移行済みのため）。「本 PR（⑮）で `subtitle` prop へ移行済み」へ書き換える。オラクルは AC9 参照
  - catalog / `01-decision-rules.md` の `## 更新履歴` にそれぞれ本 PR の新規 1 行を追加する（既存行は変更しない）
  - `docs/function-design/58-ui-stock-inquiry.md` §58.6（`:366-370` 付近の `format-stock-display` 記述）と §58.12（`:634-639` 付近の表記揺れ表）にそれぞれ 1 行、数量が `toLocaleString("ja-JP")` 桁区切りで表示される旨を追記する（Coordinator adjudication 2026-09-08、Q1）
  - `docs/Plans.md` ⑮ の状態更新は Coordinator が別途行う（本 lane の Writer 作業には含めない）
  - 設計意図: 実装完了後に catalog/DSR/58-doc を読む者が「未反映の gap」「桁区切りなし」「stale citation」という誤った状態を見ないようにする（F1: 状態注記の追記だけでは旧 gap 文言と新 status 文言が併存し矛盾するため、gap 文言自体を書き換える）
  - 完了条件: **（G6, CHANGE）** 全 oracle は AC9 を正本とする（本節では重複転記しない、乖離防止）。58-doc の桁区切り追記のみ本節固有: `rg -Fo "toLocaleString" docs/function-design/58-ui-stock-inquiry.md | wc -l` ≥ 1（起票時 0）

## Non-scope

- ⑭ の runtime 項目（状態 Badge tone・CTA 中間段・検索欄 Label・Alert warning・DSR-08 増減色）— 別 lane（stacked train で先行、本 lane が上に乗る）
- `ManualSalePage.tsx` の直近テーブルへの備考列追加: `commands.listInventoryRecords` が返す `InventoryRecordSummary` DTO（`src/lib/bindings.ts:841-850`）に `note` フィールドが存在しない（実測確認済み）。追加には DTO 変更（`list_inventory_records` の戻り値型拡張）を要し、本 lane の Non-scope（DB/Tauri/DTO 変更なし）に該当する
- `DisposalPage.tsx` への備考列追加: 廃棄・破損記録に note フィールドが存在しない（`rg -n "備考|note" DisposalRecordDetailPage.tsx` 0 件）
- `ManualSalePage.tsx:730` / `DisposalPage.tsx:684` の直近テーブルの記録ID列: 種別が画面固定のため表内で一意であり、保存結果パネルの「記録ID」表示（`ManualSalePage.tsx:356` / `DisposalPage.tsx:315`、**F18 追加**: `ReceivingPage.tsx:332` / `ReturnExchangePage.tsx:448` も同型）との突合導線として機能する。DSR-22 `:443` の (b) 決定の理由（「全体では一意でない」）は入出庫履歴一覧（複数種別横断）にのみ当てはまり、単一種別のみを扱うこれらの直近テーブルには当たらない
- `InventoryRecordsPage.tsx:216-218` の記録IDフィルタ入力欄（一覧列とは独立の UI 要素、DSR-22 `:443` により維持）
- `MovementTable.tsx` への展開 widget の新設（折り返し + `title` で DSR-12 を満たすため不要）
- `MovementTable.tsx` 以外の `stock-movements` 機能変更
- 「直近の○○」系 section への新たな囲みの追加（DSR-16、既存 1 段のまま）
- 新規 DSR の起草
- DB / Tauri command / route / DTO の変更（なし）

## Acceptance Criteria

- AC1: `PageHeader.test.tsx` の既存 3 variant test（`:1-73`）がすべて green のまま、かつ新規に (i) `description` 単独描画 (ii) `subtitle`+`description`+`actions` 共存描画 の 2 ケースを positive assertion で追加する（`getByText` で文言確認）
- AC2: `ReceivingPage.tsx`/`ManualSalePage.tsx`/`ReturnExchangePage.tsx`/`DisposalPage.tsx` の各 page test で、既存 `subtitle` 文言が画面に表示されることを新規 positive assertion で確認する（起票時実測で該当テストなしを確認済み、空集合オラクル回避のため必ず正の文言一致で書く）
- AC3: `ProductImportPage.test.tsx`/`PluExportPage.test.tsx`/`BackupRestorePage.test.tsx` それぞれで、60:102/67:123/68:147 の確定文言が `getByText` で解決できる。**（F17 追加、文言一致 oracle）**: `rg -Fc "レジのPLU登録状況を書き出すページです" src/features/plu-export/PluExportPage.tsx` ≥ 1 かつ `rg -Fc "アプリのデータ全体をまとめて保存し" src/features/backup-restore/BackupRestorePage.tsx` ≥ 1（各文の冒頭文で実装 tsx 側に文言が実在することを確認、function-design 側の文言と tsx 側の転記が一致しているかを rg で機械検証する）
- AC4: `SupplierManagementPage.test.tsx` で、説明文が `<header>` 要素の内側（`within(screen.getByRole("banner"))` 等、`PageHeader` の `<header>` を指す形）で解決できることを確認する
- AC5: `rg -Fo '<TableHead>記録ID</TableHead>' src/features/inventory-records/InventoryRecordsPage.tsx | wc -l` = 0（起票時 1、**F11 是正**: scalar count へ）。`InventoryRecordsPage.test.tsx` に新規ヘッダー配列テストを追加し、7 列（種別/業務日付/代表商品/明細数/状態/記録日時/操作）を `getAllByRole("columnheader")` の text 配列で確認する。フィルタ入力欄「記録ID」（`getByLabelText("記録ID")`）は既存 test 2 箇所（**F7 是正**: ⑭ S5 の書き換えで行番号がずれるため、`:315`/`:891` の行番号ではなく `getByLabelText("記録ID")` の query literal で参照する）のまま解決し続ける（negative regression 回帰確認）
- AC6: `rg -Fo "備考なし" src/features/return-exchange/ReturnExchangePage.tsx src/features/inventory-records/ReturnRecordDetailPage.tsx | wc -l` = 0（起票時 2 file 合計で 1 件以上、**F11 是正**: cross-file scalar count）。`ReturnExchangePage.test.tsx:261,278` と `OtherRecordDetailPages.test.tsx:263` が `"—"` へ更新され green。`ReceivingPage.test.tsx`（**F16 是正**: 既存 file、新規作成ではない）に assertion を追加し、note が空のとき `"—"` + `title` 属性なし、note があるとき `title` 属性ありを対で確認する（空集合オラクル回避）。`MovementTable.test.tsx`（**F12 是正**: 実在 file、hedge 削除）を拡張し、note が長いとき `title` 属性を持ち `whitespace-normal` class を持つことを確認する
- AC7: `ReceivingPage.tsx`/`ManualSalePage.tsx`/`ReturnExchangePage.tsx`/`DisposalPage.tsx` の各 page test で「直近 {N} 件の…」文言が exact match で解決できる（N はそれぞれ 10/5/10/10）。**F5（CHANGE、対 oracle）**: `ProductForm.test.tsx`（`PriceHistorySection` 消費箇所）で (i) 初期状態「直近 10 件の売価・原価の変更を新しい順に表示します。」+ `getAllByRole("columnheader")` で 3 列（変更日時/売価/原価） (ii)「すべて表示」button クリック後「直近 100 件の売価・原価の変更を新しい順に表示します。」の 2 状態を対で確認する（空集合オラクル回避、`limit` 導出漏れの mutant を kill）。**F3（是正）**: `ManualSalePage.tsx:725` の内側二重枠撤去は `rg -Fo 'rounded-md border">' src/features/manual-sale/ManualSalePage.tsx | wc -l` = **2**（起票時 3、**F11**: scalar count）で確認し、`ManualSalePage.test.tsx` に直近テーブルが bordered `<div>` の直下にない DOM assertion を追加する
- AC8: `rg -Fo 'function formatQuantity' src | wc -l` = 0（起票時 9、**F11 是正**: scalar count）。`ManualSalePage.tsx:749` の badge 化を `getByRole("status")`/`toHaveClass` 等の unit test で確認する。**（F15 是正）**: 単位列を持つ 3 site（`ManualSalePage.tsx:610`/`DisposalPage.tsx:514`/`ReturnExchangePage.tsx:834`）は数値のみ（単位なし）表示になることを確認し、隣接する単位列（`:651`/`:595`/`:881`）が引き続き「個」/「cm」を表示することを確認する（対で確認、重複表示が無いことの negative）。残り 9 site（商品候補一覧 3 + detail page 6）は単位コード（`pcs`/`cm`）が「個」/「cm」へ翻訳される表示を確認する（既存 test の期待値更新を含む）。**（F14 是正）**: `ReturnExchangePage.tsx`/`DisposalPage.tsx`/`ManualSalePage.tsx` は `formatStockDisplay` のみ新規 import（`formatStockUnitLabel` は既存のまま）、他 6 file は `formatStockDisplay` を新規 import することを import 文の diff で確認する。`format-stock-display.test.ts` に `formatStockDisplay(1234, "pcs")` = 「1,234 個」の独立 literal ケースを追加し、`(10, "pcs")`=「10 個」/`(300, "cm")`=「300 cm」の既存契約が不変であることを確認する（Coordinator adjudication、Q1）
- AC9: docs 側（**G6, Opus P3-2 / Sonnet P3-2 是正、全 oracle を `rg -Fo … | wc -l` = 0 の scalar 形へ統一。本 AC9 が S8 の唯一の oracle 正本 — Scope S8 の完了条件は本 AC9 を参照する形に簡略化済み**）:
  - `rg -Fo "記録IDを含む 8 列" docs/design-system/01-decision-rules.md | wc -l` = 0（是正後、起票時 1）
  - **F1 是正、pair oracle**: catalog `:48`/`:191` の現在形 gap 文が書き換えられている — `rg -Fo "現状排他である" docs/design-system/02-component-catalog.md | wc -l` = 0 かつ `rg -Fo "計 5 画面が影響" docs/design-system/02-component-catalog.md | wc -l` = 0 かつ `rg -Fo "は現状 truncate のみで" docs/design-system/02-component-catalog.md | wc -l` = 0（起票時いずれも 1）。かつ `rg -Fo "本 PR（⑮）で" docs/design-system/02-component-catalog.md | wc -l` ≥ 2（反映済み文言が :48/:191 双方に追加されている）
  - **F13 追加**: `rg -Fo "OperationLogsPage.tsx:522" docs/design-system/02-component-catalog.md | wc -l` = 0（起票時 1）かつ `rg -Fo "OperationLogsPage.tsx:533" docs/design-system/02-component-catalog.md | wc -l` ≥ 1
  - **F9/G2 是正（オラクル対象の訂正、実測値反映）**: `rg -Fo "InventoryRecordsPage.tsx:336-343" docs/design-system/01-decision-rules.md | wc -l` = 0（起票時 **1**〈`:443` のみ、file 名付きは `:435` には無い〉）。`rg -Fo ":336-343" docs/design-system/01-decision-rules.md | wc -l` = 0（起票時 **2**〈`:435`,`:443`〉）。`` rg -Fo ':339`' docs/design-system/01-decision-rules.md | wc -l `` = 0（起票時 **1**〈`:435`、代表商品 anchor〉）。`` rg -Fo ':342`' docs/design-system/01-decision-rules.md | wc -l `` = 0（起票時 **1**〈`:435`、記録日時 anchor〉）。新引用が実装後の実際の行番号と一致することは Final Review の `rg -n` 実読で確認（machine oracle 化不能、Residual Test Gap）
  - **G3 追加（catalog `:48` の 4 画面 anchor drift）**: catalog `:48` の `ReceivingPage.tsx:288-291`/`ManualSalePage.tsx:303-306`/`ReturnExchangePage.tsx:411-414`/`DisposalPage.tsx:278-281` は実際の `<PageHeader` 開始行（`:295`/`:310`/`:418`/`:285`、いずれも +7 drift）と一致していない。S8 の書き換えでこれら 4 anchor も実測行へ訂正する（S1 の component 修正で行番号がさらに動きうるため、Writer が実装完了後に再実測して確定する）。オラクル: `rg -Fo "ReceivingPage.tsx:288-291" docs/design-system/02-component-catalog.md | wc -l` = 0（起票時 1）かつ `rg -Fo "ManualSalePage.tsx:303-306" docs/design-system/02-component-catalog.md | wc -l` = 0（起票時 1）かつ `rg -Fo "ReturnExchangePage.tsx:411-414" docs/design-system/02-component-catalog.md | wc -l` = 0（起票時 1）かつ `rg -Fo "DisposalPage.tsx:278-281" docs/design-system/02-component-catalog.md | wc -l` = 0（起票時 1）
  - **G4 追加（catalog `:46` 未来形文の是正）**: `:46` の「既存の `PageHeader` 外側 sibling `<p>` 実装（例: `SupplierManagementPage.tsx:35-38`）は、この記法へ runtime lane で移行する。」は未来形で、S3 実装後は虚偽になる。「本 PR（⑮）で `subtitle` prop へ移行済み」へ書き換える。オラクル: `rg -Fo "runtime lane で移行する" docs/design-system/02-component-catalog.md | wc -l` = 0（起票時 1）
  - `doc-consistency-check.sh` の ERROR 0
- AC-L3-1（owner Windows native L3）: 説明セクション 3 画面（商品一括インポート/PLU書出し/バックアップ・復元）の説明文が読みやすく、他の説明のない画面と間隔が揃って見える
- AC-L3-2（owner Windows native L3）: 業務入力 4 画面（入庫/返品交換/手動販売/廃棄）で消えていた副題が復活し、`SupplierManagementPage.tsx` と同じ見た目になっている
- AC-L3-3（owner Windows native L3）: 備考欄が空のとき「—」、長いときは折り返し（`MovementTable` 系画面）または truncate+title（入庫直近テーブル）で表示され、読みにくくない
- AC-L3-4（owner Windows native L3、**Coordinator adjudication 2026-09-08 で risk-check から positive contract 確認へ書き換え**）: `PriceHistorySection.tsx` が表形式で見やすく、列見出しが分かる。入出庫記録詳細・直近テーブルの数量・単位表示（`formatStockDisplay`）が「10 個」/「1,234 個」のように桁区切り付きで自然に見えることを確認する（桁区切りは `format-stock-display.test.ts` の独立 literal ケースで既に機械保証されるため、L3 は見た目の自然さの確認に限定する）
- AC-L3-5（owner Windows native L3、**F10 追加**）: `ManualSalePage.tsx`「直近の手動販売出庫」テーブルの二重枠が外れ、入庫・返品交換・廃棄と同じ 1 枠に見える
- AC-L3-6（owner Windows native L3、**F15 追加**）: `ManualSalePage.tsx`/`DisposalPage.tsx`/`ReturnExchangePage.tsx` の入力行テーブルで「現在庫」列（数値のみ）と「単位」列（個/cm）が重複表示にならず自然に見える

## Design Sources

- Requirements / spec: 該当なし（新規 REQ 追加なし）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の component/呼び出し側変更のみ）
- Function / command / DTO: 該当なし（`ManualSalePage.tsx` 備考列は DTO 制約により Non-scope）
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-12/DSR-16/DSR-22（既存、runtime 反映元） / `docs/design-system/02-component-catalog.md` ①/③（既存、runtime 反映元） / `docs/function-design/60-ui-product-import.md`・`67-ui-plu-export.md`・`68-ui-backup-restore.md`・`65-inventory-record-traceability.md`（既存、確定済み文言・決定の反映元） / `docs/function-design/58-ui-stock-inquiry.md` §58.6/§58.12（本 PR で桁区切り仕様を追記、Coordinator adjudication Q1）
- Decision log / ADR: 新規 entry なし。⑩ の owner 決定（説明文 3 案そのまま採用・記録ID (b)・備考「—」）を執行するのみ

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | — | 該当なし |
| Command / DTO / generated binding / wire shape | — | 該当なし（`ManualSalePage.tsx` 備考は DTO 制約で Non-scope） |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-12/16/22、`02-component-catalog.md` ①/③、`function-design/60,65,67,68` | existing sufficient（⑩ で確定済み、本 PR は runtime 反映のみ） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | ⑩ の owner 決定を執行、新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 新規 REQ 追加なし。既存 test file の編集 + 一部拡張のみのため traceability baseline 不変見込み。新規 test file を作る場合（本 packet では想定していない、既存ファイル拡張を優先）は `generate_traceability -- --check` で drift を検出する |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |
| design-system DSR 新設 | なし（DSR-22 の runtime 反映記述の是正のみ、DSR 総数不変） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | `02-component-catalog.md:46,48` | RUNTIME2-D1 | `PageHeader.tsx` の `actions` 分岐のみを直す最小 diff を採用し、両分岐を単一 `<header className="flex...">` へ統合する再設計は不採用（catalog が既に確定済みの記述と一致させる、`PageHeader.test.tsx` 破壊を避ける） | `PageHeader.tsx` | AC1 |
| — | `docs/function-design/60,67,68`（UI/Wording 節） | RUNTIME2-D2 | owner culling 完了済みの確定文言をそのまま `description` prop へ転記する。文言の再編集は行わない | `ProductImportPage.tsx`、`PluExportPage.tsx`、`BackupRestorePage.tsx` | AC3 |
| — | `01-decision-rules.md:443` DSR-22 | RUNTIME2-D3 | (b) 一覧の表示列から外す、で owner 確定済み。種別横断の入出庫履歴一覧にのみ適用し、種別固定の直近テーブル（`ManualSalePage.tsx`/`DisposalPage.tsx`）には適用しない（一意性の理由が当てはまらない） | `InventoryRecordsPage.tsx` | AC5 |
| — | `02-component-catalog.md:191` | RUNTIME2-D4 | 空欄「—」への統一は owner culling 完了済み。`MovementTable.tsx` は truncate→折り返しへ変え自身で全文確認手段を持つ（詳細ページ任せにしない、⑩ の Why をそのまま実装） | `ReceivingPage.tsx`、`ReturnExchangePage.tsx`、`MovementTable.tsx`、`ReturnRecordDetailPage.tsx` | AC6 |
| — | `02-component-catalog.md:176` | RUNTIME2-D5（**Coordinator adjudication 2026-09-08 で CHANGE**） | 9 箇所の重複 formatter を canonical `formatStockDisplay`/`formatStockUnitLabel` へ統合する。桁区切り喪失という退行は受け入れず、`formatStockDisplay` 自体に `toLocaleString("ja-JP")` を追加して桁区切りを復元する（独自ラッパーは新設しない、canonical 側を 1 行ずつ直す） | 9 file + `format-stock-display.ts` | AC8 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: catalog ①/③・DSR-12/16/22 は既に owner 確定済みの正本。本 packet の「起票時実測」節は runtime 側の未反映箇所の棚卸しであり、実装完了後は catalog/DSR 側の記述のみで完結する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 本 packet 自体に新規の durable decision はなし（すべて⑩で確定済みの実装のみ）。S8 で catalog/DSR の runtime-gap 記述を「反映済み」へ更新する
- Assumptions and constraints: 対象範囲は⑩が確定した「説明セクション・記録ID・備考・PageHeader間隔・単位表示」の runtime 反映のみ。⑩ Non-scope（`04-backbone.md` 原則9改訂、DSR-12/16 本文改訂等）は対象外
- Deferred design gaps, risk, and follow-up target: **（F6, Opus P2-4 是正）** `formatQuantity` 統合に伴う桁区切り喪失は Coordinator adjudication（2026-09-08、Q1）で解消済み — `formatStockDisplay` 自体を `toLocaleString("ja-JP")` へ修正し、SC22（`format-stock-display.test.ts` の独立 literal ケース）で機械保証する。AC-L3-4 は「桁区切りが付いていること」の確認ではなく、桁区切り付き表示が業務データとして自然かという主観評価のみに限定される（自動テストでは検証できない残余部分）
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-08-ui-polish-batch3-runtime.md) 各行に RUNTIME2-D 番号か catalog/DSR 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は「`ManualSalePage.tsx`/`DisposalPage.tsx` 直近テーブルの記録ID列は Non-scope」「`ManualSalePage.tsx` 備考列は DTO 制約で Non-scope」の 2 点のみで、いずれも起票時実測・Non-scope に明記済み。抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の component/呼び出し側変更のみ | — |
| Fact check / design decision split | 適用: `01-decision-rules.md:435` の「現状は8列のまま」注記が本 PR 完了後に stale になる。S8 で是正 | S8 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 説明文・備考・記録一覧・数量表示は複数画面の主動線に影響する。owner L3 で確認（AC-L3-1〜4） | AC-L3-1〜4 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜4） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: ⑩ が catalog/DSR 側で説明セクション・記録ID方針・備考規則・PageHeader component gap・単位表示ルールをすべて確定済み。本 lane は runtime 反映のみで新規 design 判断を要しない（S1/S7 の実装方式選択のみ Coordinator adjudication で解決済み）
- Source docs updated in this PR: `01-decision-rules.md`（`:435` 注記の状態更新のみ）、`02-component-catalog.md`（`:48`/`:191` の状態注記追加）
- Design gaps intentionally deferred: なし
- Durable decisions discovered in this plan and promoted to source docs: なし（S8 は既存決定の状態更新のみ）

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の component/呼び出し側変更のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 説明文 3 画面・4 画面の副題復活・「直近 N 件の」文言が新規追加。既存業務文言の変更なし
- Error, empty, retry, and recovery behavior: 不変
- Testability and traceability IDs: 新規 REQ 追加なし、既存 test file の拡張のみ

## Contract Probe

N/A — 外部ライブラリ・OS/hardware 挙動への新規依存なし。`PageHeader` の `description` prop 追加は既存 `subtitle` prop と同じ仕組みの追加軸であり、追加実験は不要。`formatStockDisplay` は既に 4 箇所で使用実績のある純関数のため契約確認済み。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| S1 PageHeader root-cause fix + description prop | `PageHeader.tsx` | AC1 | AC-L3-1/2 |
| S2 説明セクション 3 画面 | `ProductImportPage.tsx`、`PluExportPage.tsx`、`BackupRestorePage.tsx` | AC3 | AC-L3-1 |
| S3 SupplierManagementPage 間隔 | `SupplierManagementPage.tsx` | AC4 | AC-L3-2 |
| S4 記録ID列撤去 | `InventoryRecordsPage.tsx` | AC5 | non-scope（列削除は視認上軽微） |
| S5 備考「—」統一 | `ReceivingPage.tsx`、`ReturnExchangePage.tsx`、`MovementTable.tsx`、`ReturnRecordDetailPage.tsx` | AC6 | AC-L3-3 |
| S6「直近の○○」統一 + 価格履歴表構造化 | `ReceivingPage.tsx`、`ManualSalePage.tsx`、`ReturnExchangePage.tsx`、`DisposalPage.tsx`、`PriceHistorySection.tsx` | AC7 | AC-L3-4 |
| S7 記録状態Badge + 単位表示統合 | `ManualSalePage.tsx`、9 formatQuantity file | AC8 | AC-L3-4 |
| S8 docs 同期 | `01-decision-rules.md`、`02-component-catalog.md`、`docs/function-design/58-ui-stock-inquiry.md` | AC9 | non-scope |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-08-ui-polish-batch3-runtime.md](test-matrices/2026-09-08-ui-polish-batch3-runtime.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（本 lane は frontend のみだが release check の慣行は維持する）。

- targeted tests: `PageHeader.test.tsx`（description/subtitle co-render）/ 各 page test（S2/S3/S6 の対象サイト）/ `InventoryRecordsPage.test.tsx`（ヘッダー配列）/ `ReturnExchangePage.test.tsx`・`OtherRecordDetailPages.test.tsx`（「—」書き換え）/ `ProductForm.test.tsx`（PriceHistorySection の Table 構造）/ 9 formatQuantity file の各 test
- negative tests: `InventoryRecordsPage.tsx` のフィルタ欄「記録ID」が残り続けること、`ManualSalePage.tsx`/`DisposalPage.tsx` の直近テーブルの記録ID列が変更されないこと、`DisposalPage.tsx` に備考列が追加されないこと
- compatibility checks: `PageHeader.test.tsx:61-73`（既存 `flex` class assertion）が無変更で green、`ProductForm.test.tsx` の既存 `findByText` ベースの price history assertion が Table 変換後も解決すること
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: 該当なし（route/DTO 変更なし）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない。

## Review Focus

- `PageHeader.tsx` の修正が `actions` 分岐のみに限定され、`subtitle`-only 分岐や外側 `<header>` の class を変えていないこと（catalog `:48` 記述との一致）
- `InventoryRecordsPage.tsx` から記録ID列が撤去され、`ManualSalePage.tsx`/`DisposalPage.tsx` の直近テーブルの記録ID列とフィルタ入力欄が変更されていないこと
- `ManualSalePage.tsx` に備考列が追加されていないこと（DTO 制約による Non-scope の遵守）
- `ReturnExchangePage.tsx` の `formatNote()` 変更が保存結果パネル・直近テーブルの両方に正しく反映され、`hasNote()` の色分けロジックが維持されていること
- `MovementTable.tsx` の折り返し化で `title` 属性が空値時に出ないこと（`undefined` を渡す）
- `PriceHistorySection.tsx` の Table 変換で既存の売価/原価 old→new 表示ロジックが変わらず、新しい順の並びが維持されること
- 9 箇所の `formatQuantity` 統合で、unit 翻訳（pcs→個）が正しく行われ、桁区切りの喪失以外の表示崩れがないこと
- `01-decision-rules.md:435` の状態更新が decision 本体 (b) を変更せず、状態注記のみを更新していること

## Spec Contract

Contract ID: SPEC-UIRUNTIME2-1

- ⑩ が design-system canonical docs / function-design 側で確定した説明セクション・記録ID表示方針・備考「—」統一・PageHeader component gap・単位表示ルールが runtime（`src/**`）へ反映され、catalog/DSR の runtime-gap 記述が是正される

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UIRUNTIME2-1 | S1 | `PageHeader.test.tsx` | actions 分岐のみの最小修正 | vitest |
| SPEC-UIRUNTIME2-1 | S2 | `ProductImportPage.test.tsx`/`PluExportPage.test.tsx`/`BackupRestorePage.test.tsx` | 確定文言の exact match | vitest |
| SPEC-UIRUNTIME2-1 | S3 | `SupplierManagementPage.test.tsx` | header 内描画 | vitest |
| SPEC-UIRUNTIME2-1 | S4 | `InventoryRecordsPage.test.tsx` | 記録ID列撤去 + フィルタ欄維持 | vitest |
| SPEC-UIRUNTIME2-1 | S5 | `ReturnExchangePage.test.tsx`/`OtherRecordDetailPages.test.tsx`/`ReceivingPage.test.tsx` | 「—」統一 + title 属性 | vitest |
| SPEC-UIRUNTIME2-1 | S6 | 各 page test + `ProductForm.test.tsx` | 文言統一 + Table 構造 | vitest |
| SPEC-UIRUNTIME2-1 | S7 | `ManualSalePage.test.tsx` + 9 formatQuantity file の test | Badge化 + 単位翻訳 | vitest |
| SPEC-UIRUNTIME2-1 | S8 | docs review（自動テストなし） | 状態注記の更新 | `rg` 完全一致 |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし

## Writer Instructions

- Codex `model_reasoning_effort=medium`（難所〈`PriceHistorySection.tsx` の Table 変換、`CsvImportRecordDetailPage.tsx` の ⑭ との近接領域コンフリクト確認〉と Coordinator が判断した箇所は high へ昇格）。commands 実行数と修正 round 数を PR body に記録する
- stacked train（F2）: (i) 着手前に `origin/agent/ui-conventions-runtime` の tip を本 branch へ 1 回 merge する（rebase 禁止、base 同期のみで D-074 の手順ではない）。`CsvImportRecordDetailPage.tsx` は merge 後にコンフリクトの有無を個別確認してから S7 に着手する。(ii) ⑭ squash merge 後は D-074（`docs/DEV_WORKFLOW.md:257`）に従い、旧 tip を保存 → `origin/main` を 1 回だけ merge → PR base を `main` へ付け替える（多段 merge 禁止）
- STATECAP 継承（F8）: ⑭ merge 前は本 lane の state-only commit を `plan-draft->…->implementing` の 1 本に留める。以後の遷移は ⑭ merge 後（stacked train (ii) 完了後）に記録するか、順序上不可能なら closeout 圧縮記録にする
- 各 S の設計意図（WHY）は上記 Scope 節に 1〜2 文で書き込み済み。Writer は再導出せずそのまま従う
- worktree: `npm ci --ignore-scripts` → `npm run generate:routes` 必須（route 変更はないが worktree 既知手順として実施）。`npm run format:check` + lint + typecheck + targeted tests を push 前に毎回実行する。`git add` は明示パスのみ（`-A`/`.` 禁止）。packet / `Plans.md` は編集しない。PR body の `Reviewed Content HEAD` は `pending` のまま置く。`HEAD:branch` 形式の push はしない。commit subject は conventional prefix、body は日本語可
- ponytail block（実装原則、owner 2026-09-05 導入、以下を verbatim で発注書に注入）:

```
### 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- 具体的な適用: `PageHeader.tsx` は `actions` 分岐のみを直す最小 diff とし、両分岐の統合リファクタは行わない（Coordinator adjudication）。`formatSignedQuantity`/`formatOptionalQuantity` は shared module へ昇格せず `StocktakeRecordDetailPage.tsx` 内のローカル薄いラッパーのまま残す（1 file のみ、rule of three 未達）。`formatStockDisplay` の桁区切り追加は canonical 側 1 file・2 行の修正に留め、9 箇所の呼び出し側やテンプレート文字列に独自の `toLocaleString` を書き足さない（呼び出し側は canonical を呼ぶだけ）
- Maintainability review lens（owner 決定 2026-09-07）: 命名 / 理由 comment / 退屈な構造 > 賢い圧縮。`formatNote()` の戻り値変更・`formatStockDisplay` への置換理由を短い comment で残す（保守者が catalog を読まずに読めるように）
- **一般規則（Coordinator adjudication 2026-09-08、Q3）**: 変更した assertion の test 名 / comment が旧挙動を語っていたら、同じ commit で test 名 / comment 側も新しい挙動に合わせて直す（`OtherRecordDetailPages.test.tsx:253` のみに限らず、S5 全体・他の書き換え箇所すべてに適用する一般ルール）

## Implementation Results

未着手。

## Review Response

未着手。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
