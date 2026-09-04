# Plan Packet: UI 一覧の背骨 D — Lane 5（操作面 + 枠の sweep: native 入力欄の `--control-surface` token 化 + outline ボタン / Badge / SegmentedControl 枠の `--border-strong` 化）

owner 決定（D8/E13/E15、2026-09-04〜05、[Plans.md ④](../Plans.md) owner 反応 ledger / 直回答）に基づき、runtime に残る native `<select>`/`<input>`（shadcn `Input`/`Select` を通らないもの）を `--control-surface` #fafaf9 へ、outline 系 `Button`/`Badge`/`SegmentedControl` の枠を `--border-strong` へ揃える。起票時実測で SegmentedControl は Lane 2（PR #32）で既に token 化済みであることが判明したため、本 lane では規約整合の確認のみを行う（下記参照）。

## Workflow State

- Phase: human-confirm
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 259155c
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）
- Final Reviewer: Sonnet subagent（fresh context）+ Codex ロジックレビュー 1 回（週次リセット後に実施、それまで Final Review は Sonnet のみで進め human-confirm で待機）
- Reviewed Content HEAD: 251ecde
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（AC-L3-1〈入力欄の面と枠〉/ AC-L3-2〈outline ボタン・Badge の枠〉の 2 項目）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-04/05、D8/E13/E15、消費済み）。2 回目 = Windows native L3（AC-L3-1〜2）。3 回目 = 承認 + merge（Coordinator 代行）。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator workflow の見た目変更（11 画面 23 箇所の native 入力欄 + 2 個の shared UI primitive〈`Button`/`Badge`〉の枠・面トークン変更）。DB スキーマ・Tauri command・route/search state・POS CSV / PLU TSV 形式の変更はない。`button.tsx`/`badge.tsx` は widely-shared primitive（`variant="outline"` 使用箇所は Button 149 / Badge outline 20 超）のため、1 箇所の誤りが全画面に波及するクラスの変更である。DEV_WORKFLOW Risk Tiers の R3「operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

**Stacked train（D-074、DEV_WORKFLOW「Stacked train」節）**: 本 branch は Lane 3（`agent/ui-list-backbone-d-lane3`、Draft PR #34、human-confirm 中）の tip `b411c76` に stack している（`InventoryRecordsPage.tsx` / `StockMovementsPage.tsx` / `PriceRevisionFilters.tsx` が Lane 3 と重なるため main 起点では衝突する）。Lane 3 の squash merge 後は、旧 tip を保存してから最新 `origin/main` を 1 回だけ merge する単段 merge で base を付け替える（rebase しない。plan-first commit / gated amendment の SHA 書換えは D-039 / PK5「Plan Commit ancestry」（DEV_WORKFLOW `:125`）に反する）。付け替え後の merge delta が実装 file に触れる場合は、その delta を独立に再検証（対象 test の再実行 + Final Reviewer による差分実読）してから Phase を進める。STATECAP の継承: stack 点以前にある Lane 3 の forward state-only commit（`8f38132` / `d2b1dd1`）は Lane 3 merge 後に `merge-base(origin/main, HEAD)..HEAD` の検査範囲へ継承されうるため、本 lane 自身の forward state-only は 1 本（human-confirm → ready-hosted-final）に抑え、他の遷移は content commit 同乗で行う。Writer は Lane 3 の merge 通知を受けたら作業を一旦止め、Coordinator の base 付け替え後に再開する。

## Goal

Goal Invariant:

### 最小完了条件

- 起票時実測で列挙した native `<select>`/`<input>`/`<textarea>` 23 箇所（11 画面、shadcn `Input`/`Select` を通らないもの、type="checkbox"/"radio"/"file"/hidden を除く）が `border-input bg-control-surface`（1 箇所は `border-input` 新規付与も伴う）になる
- `button.tsx` の `variant="outline"` が `border-input`（= `--border-strong`）を持つ
- `badge.tsx` の `variant="outline"` が `border-border-strong`（= `--border-strong`）を持つ
- `SegmentedControl` は既に `--border-strong` 化済み（Lane 2 PR #32 S9）であることを再確認し、退行させない
- `02-component-catalog.md` / `01-decision-rules.md` DSR-22 の `--control-surface` HEX 記述と SegmentedControl focus 記述が runtime と一致する

### 失敗定義

- 23 箇所のいずれかで旧 class（`bg-background`、または `border` 単体）が残る
- `button.tsx`/`badge.tsx` の変更が既存呼び出し側（`StockStatusBadge` 等の border override）に視覚退行を起こす、または既存 test を壊す
- catalog / DSR-22 の `--control-surface` HEX・SegmentedControl focus 記述が runtime と食い違ったまま残る
- Non-scope（下記）に挙げた項目まで誤って変更してしまう

### 非目的

- ListShell 化、識別列固定・出っ張り解消（Lane 4）、ページ送り関連（Lane 3）、棚卸し header
- toolbar / filter 枠の地色差（ListShell の `bg-card` と非 ListShell 画面の枠地色、Lane 2 申し送り (v) / owner E15、ListShell 化 lane で扱う）
- `ExportBar.tsx`（daily-sales / monthly-sales）の disabled `<span role="button">`（select/input でも `Button` variant でもないカスタム要素、下記起票時実測参照）
- `ProductFormPage.tsx:233` の `plu-memory-no` 表示欄（`readOnly`、`bg-muted` の非編集表示専用欄、下記起票時実測参照）
- `SegmentedControl` の active/selected 状態の stone-300 と stone-400 の catalog記述と実装の食い違い（`selection-tone.ts` `SELECTION_TONE_ACTIVE`、E13 が扱う「操作枠 3:1」とは無関係の pre-existing な別件、下記起票時実測参照）
- `StockStatusBadge` / `ProductTable` 等、Badge outline に semantic な border override（`border-warning-border` 等）を持つ呼び出し側の色自体（badge.tsx 変更でも tailwind-merge により override が優先されるため無変更で不変）
- `ReturnExchangePage.tsx:570` の「レジ戻し済み」badge（owner「後続 sweep で消さない」明示済み、Plans.md ④ owner ledger 参照）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、worktree base `b411c76`〈Lane 3 branch tip、Draft PR #34 human-confirm 中〉、すべて本 packet 起草者が rg で再確認）

- **native `<select>`/`<input>`/`<textarea>` の全列挙**（`rg -n "<select|<input" src/features --glob '!*.test.*'` に加え `<textarea` を別途 sweep）。全件 `border-input`（= `--border-strong`）を既に持ち `bg-background` のみが対象、例外 1 件のみ `border-input` 未付与:
  - `InventoryRecordsPage.tsx:165`（記録種別 select）/`:187`（開始日 input）/`:201`（終了日 input）/`:216`（記録ID input）/`:232`（部門 select）/`:254`（状態 select）— 6 箇所、既知の D8 前提と一致
  - `ReceivingPage.tsx:393`（取引先 select）— 1 箇所、既知の D8 前提と一致
  - `DisposalPage.tsx:509`（種別 select、`row.productCode` 付き aria-label）— 1 箇所、既知の D8 前提と一致
  - `ReturnExchangePage.tsx:528`（種別 select）/`:616`（備考 textarea、D8 の文言は「select/input」だが `textarea` も同じ非 shadcn native 入力欄であり本 packet の「native 入力欄」に含める、L5-D5）/`:708`（追加方向 select）/`:827`（方向 select、per-row aria-label）— 4 箇所（D8 未列挙、本実測で新規発見）
  - `ProductForm.tsx:274`（部門 select）/`:297`（取引先 select）/`:413`（税率 select）— 3 箇所（D8 未列挙、`ProductFormPage` 経由で共有）
  - `StockUnitField.tsx:51`（数量単位 select）— 1 箇所（D8 未列挙）。同ファイル `:67` の `type="checkbox"`（POS販売で在庫を減らす）は D8 の明示除外対象
  - `ManualSalePage.tsx:429`（理由 select）— 1 箇所（D8 未列挙）
  - `StockMovementsPage.tsx:139`（開始日 input）/`:153`（終了日 input）/`:167`（種別 select）— 3 箇所（D8 未列挙）
  - `MonthNavigator.tsx:35`（月 input type="month"）/`DateNavigator.tsx:33`（日付 input type="date"）— 2 箇所（D8 未列挙、月次/日次売上の date navigator。`02-component-catalog.md:685,696` ⑪ 日付・月ナビの canonical 例）
  - `PriceRevisionFilters.tsx:45`（取引先 select）— 1 箇所（D8 未列挙）。**唯一 `border-input` 未付与**（現 class `"h-9 w-48 rounded-md border bg-background px-3 text-foreground"`）、`border-input` 新規付与 + `bg-control-surface` の両方が必要
  - 合計 **23 箇所**（11 file）。`rg -c "border-input bg-background" <file>` で各 file の総数が bg-background 総数と一致することを確認済み（ReturnExchangePage のみ総数 5 のうち 1 件は対象外、下記参照）
- **既に完了済み（対象外）**: `OperationLogsPage.tsx:351,365,379`（開始日/終了日 input・種別 select）は Lane 3 Gated Amendment 2 A2-b（`cc7b0e8`）で既に `border-input bg-control-surface` 化済み（`git diff` で確認、worktree base に反映済み）。D8 の owner 原文が列挙した「操作ログ」分はこれで消化済み、本 lane の対象から除外する
- **type 除外の確認**: `StockUnitField.tsx:67`（`type="checkbox"`）/ `ReturnExchangePage.tsx:557,580`（`type="radio"`、レジ戻し区分）は D8 の明示除外規定どおり対象外
- **native 要素だが select/input/textarea でないため対象外**: `ExportBar.tsx`（`src/features/daily-sales/components/` と `src/features/monthly-sales/components/` の両方、同一実装）の disabled `<span role="button" aria-disabled="true">` が `border-input bg-background`（`:34`）を使うが、`<select>`/`<input>`/`<textarea>` でも shadcn `Button` でもないカスタム要素のため D8/E13 いずれの文言にも該当しない。Non-scope として記録（L5-D4）
- **readOnly 表示欄のため対象外**: `ProductFormPage.tsx:233`（`plu-memory-no`、`className="h-10 w-full rounded-md border bg-muted px-3 text-sm"`、`readOnly`）は D8 の除外 type リストに含まれないが、`bg-muted`（`bg-background`/`bg-control-surface` 系とは別の非編集表示トークン）を使う read-only 表示欄で、D8 の対象例（検索欄・ドロップダウン）とは性質が異なる。Coordinator 判断で Non-scope（L5-D3）。Plan Review で妥当性検査対象
- **ReturnExchangePage の bg-background 総数不一致の内訳**: `rg -c "bg-background" ReturnExchangePage.tsx` = 5、`rg -c "border-input bg-background"` = 4。差分の 1 件（`:147` `"border-border bg-background hover:bg-muted/40"`）は `registerOptionClass` 関数の戻り値で、レジ戻し区分の `type="radio"` 選択肢を囲む `<label>` の背景（D8 除外対象の radio に付随する非入力要素）。対象外
- **`button.tsx` variant outline 現 class**（`:15-16`）: `"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"`。ライトモード（本アプリは dark block 未使用、`@theme inline` に dark 定義なし）では `border`（幅のみ）が `@layer base { * { border-color: var(--border) } }` の既定色に従うため実質 `--border`（薄い）。`dark:border-input` はライトモードでは有効にならない。`variant="outline"` の呼び出し箇所は `rg -c 'variant="outline"' src/**/*.tsx`（.test 除く）= 149 件
- **`badge.tsx` variant outline 現 class**（`:17`）: `"border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"`。base（`:8`）の `border border-transparent` と合わさり、色は `border-border`（= `--border`、薄い）が有効
- **`badge.tsx` outline の border override 呼び出し側**（変更の影響確認）: `StockStatusBadge.tsx`（3 状態とも `border-stone-200`/`border-warning-border`/`border-destructive-border` で override）、`ReturnExchangePage.tsx:570`（`border-stone-200` override、owner「後続 sweep で消さない」明示）は tailwind-merge の後勝ちにより `badge.tsx` 変更の影響を受けない（override が優先される）。無 override で新色を受け取るのは `ProductTable.tsx:74`・`DisposalPage.tsx:304`・`ReceivingPage.tsx:321`・`ManualSalePage.tsx:345`・`ReturnExchangePage.tsx:437`・`PriceRevisionTable.tsx:104`・`IntegrityCheckPage.tsx:379`・`MovementTable.tsx:69`・`AdditionalImportConfirmDialog.tsx:132`・`CsvImportRecordDetailPage.tsx:140,192`・`ManualSaleRecordDetailPage.tsx:123`・`ReceivingRecordDetailPage.tsx:115`・`DisposalRecordDetailPage.tsx:117`・`StocktakeRecordDetailPage.tsx:137`・`ReturnRecordDetailPage.tsx:144,203` の 17 箇所（badge.tsx 側 1 箇所の変更で一律反映、個別 file 変更不要）
- **`segmented-control.tsx` 現状（S4 の前提）**: `segmentedControlListClass`（`:9-10`）= `"inline-flex h-9 w-fit items-center justify-center rounded-md border border-border-strong bg-background p-0.5 text-muted-foreground"`、`segmentedControlItemClass`（`:12-13`）の focus-visible = `border-border-strong`。両方とも **既に `--border-strong` 化済み**（Lane 2 PR #32 S9、commit 履歴 `git log -p -- src/components/ui/segmented-control.tsx` で `border-stone-300` → `border-border-strong` の置換を確認）。`rg -n "border-stone-300" src` = 0 hit（全 src 対象、SegmentedControl 含め残存なし）。owner E13 (c) の前提（「`border-stone-300` 直書き」が未対応）は現状と食い違う。**本 lane では S4 のコード変更は不要**、既存 test `segmented-control.test.tsx` SC6（`describe("SC6: SegmentedControl group wrapper has border-border-strong and the source contains no stone-300 literal")`）が既に regression guard として機能している。L5-D2 として記録
- **`segmented-control.tsx` active 状態は対象外（catalog との別件不一致）**: active/selected の border は `selection-tone.ts` `SELECTION_TONE_ACTIVE` = `"border-stone-400 bg-stone-300 font-semibold text-stone-950 hover:bg-stone-300 hover:text-stone-950"`（`border-stone-400`）。`02-component-catalog.md:290,294` は「active: `bg-stone-300` + `border-stone-300` + `font-semibold`」と記載し stone-400 と食い違う（`:303` も同様に「二択切替は…`border-stone-300`にする」と記載）。この不一致は選択状態の stone 濃淡（塗り + 縁取り）の話で、E13 が扱う「未選択時の操作枠 3:1」とは別件・別 lane 判断が要る pre-existing drift のため Non-scope（L5-D2 に併記、後続 lane 候補として記録のみ）
- **catalog ⑤ SegmentedControl「使用トークン」表（`:284-291`）root 行の広範な staleness**: root = `inline-flex h-9 w-fit rounded-lg bg-muted p-[3px]` と記載するが実装は `rounded-md border border-border-strong bg-background p-0.5`（`rounded-lg`→`rounded-md`、`bg-muted`→`bg-background`、`p-[3px]`→`p-0.5`、border 記述自体が表に無い）。Lane 2 S9 の rewrite 前の記述が残存したままと見られる。本 lane は E13 の「枠 `--border-strong`」に直結する `:296` focus 行のみ同期し、root 行全体の再同期は Goal Invariant 外（border 以外の複数属性の広範な書き直しになる）のため Non-scope・後続 docs-accuracy 候補として記録（L5-D2）
- **`--control-surface` HEX の doc drift**: `00-foundations.md:21` は `#fafaf9`（Gated Amendment 7 S46 で #fff から更新済み、正）。`01-decision-rules.md:443` DSR-22 と `02-component-catalog.md:904` は共に `#ffffff`/`#fff`（Gated Amendment 6 S44 時点の旧値）のまま同期されていない。両 doc とも `globals.css:70`（`--control-surface: #fafaf9`）と不一致
- **`globals.test.ts` 既存カバレッジ**: `SC15`（`:89-103`）が shadcn `input.tsx`/`select.tsx` の `border-input bg-control-surface` を既に検査済み（Gated Amendment 6/7 で対応済み、本 lane の対象外）。`button.tsx`/`badge.tsx` を検査する既存 test は無い（`button.test.tsx`/`badge.test.tsx` 不在、`fd` で確認）
- **各対象 file の accessible name 確認**: 23 箇所すべてに `<label htmlFor>` または `aria-label` が付与済み（`InventoryRecordsPage`/`ReceivingPage`/`ProductForm`/`StockUnitField`/`ManualSalePage`/`StockMovementsPage` は `htmlFor`、`DisposalPage`/`ReturnExchangePage` の per-row select は動的 `aria-label`、`PriceRevisionFilters` は静的 `aria-label="取引先"`、`MonthNavigator`/`DateNavigator` は隣接 button に `aria-label` があるが input 自体は `aria-label="月を選択"`/`aria-label="日付を選択"` を実装で確認要 — 起票時点では labelling ボタンのみ確認、input 自体の accessible name は Writer 実装時に `getByLabelText` が解決可能か再確認する）

## Scope

- **S1a InventoryRecordsPage native 6 箇所**: `:165,187,201,216,232,254` の `bg-background` → `bg-control-surface`。完了条件: `rg -c "border-input bg-background" src/features/inventory-records/InventoryRecordsPage.tsx` = 0（起票時 6）かつ `rg -c "border-input bg-control-surface" src/features/inventory-records/InventoryRecordsPage.tsx` ≥ 6
- **S1b ReceivingPage native 1 箇所**: `:393` の `bg-background` → `bg-control-surface`。完了条件: `rg -Fn 'border border-input bg-background px-3 text-sm"' src/features/receiving/ReceivingPage.tsx` = 0（起票時 1）かつ `rg -c "border-input bg-control-surface" src/features/receiving/ReceivingPage.tsx` ≥ 1
- **S1c DisposalPage native 1 箇所**: `:509` の `bg-background` → `bg-control-surface`。完了条件: `rg -c "border-input bg-background" src/features/disposal/DisposalPage.tsx` = 0（起票時 1）かつ `rg -c "border-input bg-control-surface" src/features/disposal/DisposalPage.tsx` ≥ 1
- **S1d ReturnExchangePage native 4 箇所**: `:528,616,708,827` の `bg-background` → `bg-control-surface`（`:147` の `registerOptionClass` は対象外、`bg-background` のまま維持）。完了条件: `rg -c "border-input bg-background" src/features/return-exchange/ReturnExchangePage.tsx` = 0（起票時 4）かつ `rg -c "border-input bg-control-surface" src/features/return-exchange/ReturnExchangePage.tsx` ≥ 4 かつ `rg -Fn "border-border bg-background hover:bg-muted/40" src/features/return-exchange/ReturnExchangePage.tsx` ≥ 1（`:147` 不変の回帰確認）
- **S1e ProductForm native 3 箇所**: `:274,297,413` の `bg-background` → `bg-control-surface`。完了条件: `rg -c "border-input bg-background" src/features/products/components/ProductForm.tsx` = 0（起票時 3）かつ `rg -c "border-input bg-control-surface" src/features/products/components/ProductForm.tsx` ≥ 3
- **S1f StockUnitField native 1 箇所**: `:51` の `bg-background` → `bg-control-surface`（`:67` の checkbox は不変）。完了条件: `rg -c "border-input bg-background" src/features/products/components/StockUnitField.tsx` = 0（起票時 1）かつ `rg -c "border-input bg-control-surface" src/features/products/components/StockUnitField.tsx` ≥ 1
- **S1g ManualSalePage native 1 箇所**: `:429` の `bg-background` → `bg-control-surface`。完了条件: `rg -c "border-input bg-background" src/features/manual-sale/ManualSalePage.tsx` = 0（起票時 1）かつ `rg -c "border-input bg-control-surface" src/features/manual-sale/ManualSalePage.tsx` ≥ 1
- **S1h StockMovementsPage native 3 箇所**: `:139,153,167` の `bg-background` → `bg-control-surface`。完了条件: `rg -c "border-input bg-background" src/features/stock-movements/StockMovementsPage.tsx` = 0（起票時 3）かつ `rg -c "border-input bg-control-surface" src/features/stock-movements/StockMovementsPage.tsx` ≥ 3
- **S1i PriceRevisionFilters native 1 箇所**: `:45` の `"h-9 w-48 rounded-md border bg-background px-3 text-foreground"` → `"h-9 w-48 rounded-md border border-input bg-control-surface px-3 text-foreground"`（`border-input` 新規付与 + `bg-control-surface`）。完了条件: `rg -Fn "rounded-md border bg-background px-3 text-foreground" src/features/products/components/PriceRevisionFilters.tsx` = 0（起票時 1）かつ `rg -Fn "border border-input bg-control-surface px-3 text-foreground" src/features/products/components/PriceRevisionFilters.tsx` ≥ 1
- **S1j MonthNavigator native 1 箇所**: `:35` の `bg-background` → `bg-control-surface`。完了条件: `rg -c "border-input bg-background" src/features/monthly-sales/components/MonthNavigator.tsx` = 0（起票時 1）かつ `rg -c "border-input bg-control-surface" src/features/monthly-sales/components/MonthNavigator.tsx` ≥ 1
- **S1k DateNavigator native 1 箇所**: `:33` の `bg-background` → `bg-control-surface`。完了条件: `rg -c "border-input bg-background" src/features/daily-sales/components/DateNavigator.tsx` = 0（起票時 1）かつ `rg -c "border-input bg-control-surface" src/features/daily-sales/components/DateNavigator.tsx` ≥ 1
- **S2 button.tsx outline 枠**: `:16` の `"border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50"` を `"border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:hover:bg-input/50"` へ（`border-input` を base に付与、冗長化した `dark:border-input` は撤去、`bg-background` は不変〈E13 は枠のみ、面は対象外〉）。完了条件: `rg -Fn "border bg-background shadow-xs" src/components/ui/button.tsx` = 0（起票時 1）かつ `rg -Fn "border border-input bg-background shadow-xs" src/components/ui/button.tsx` ≥ 1。新規 `src/components/ui/button.test.tsx` で `variant="outline"` が `border-input` を持つことを assert（`variant="default"` は持たないことも対照 case で確認）
- **S3 badge.tsx outline 枠**: `:17` の `"border-border text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"` を `"border-border-strong text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground"` へ（L5-D1: Badge は input 系コンポーネントではないため `border-input` でなく `SegmentedControl`/`SearchBar` D-7 例外と同じ直接 utility `border-border-strong` を使う、Coordinator 判断）。完了条件: `rg -Fn "border-border text-foreground" src/components/ui/badge.tsx` = 0（起票時 1）かつ `rg -Fn "border-border-strong text-foreground" src/components/ui/badge.tsx` ≥ 1。新規 `src/components/ui/badge.test.tsx` で `variant="outline"` が `border-border-strong` を持つことを assert（`variant="default"` は持たないことも対照 case で確認）
- **S4 SegmentedControl の確認（コード変更なし）**: 起票時実測のとおり Lane 2 PR #32 S9 で既に `border-border-strong` 化済み。本 lane は退行がないことを既存 test `segmented-control.test.tsx` SC6 の pass 維持で確認するのみ（新規実装なし）。完了条件: `rg -n "border-stone-300" src/components/ui/segmented-control.tsx` = 0（起票時 0、維持確認）かつ既存 `SC6` test が pass のまま
- **S5 catalog・00-foundations・01-decision-rules の記述同期**: (a) `02-component-catalog.md:696` 使用トークン文「input は `border-input bg-background`。」→「input は `border-input bg-control-surface`。」+ `:685` の code snippet 内 `bg-background` → `bg-control-surface`（⑪ 日付・月ナビ、S1j/S1k と対）(b) `02-component-catalog.md:904` 「操作面は `--control-surface` #fff（S44）で箱 #f5f5f4 と区別する（Gated Amendment 6）」→「操作面は `--control-surface` #fafaf9（Gated Amendment 7 S46）で箱 #f5f5f4 と区別する」(c) `02-component-catalog.md:296` 「**focus**: `border-stone-300` + soft ring」→「**focus**: `border-border-strong` + soft ring」（S4 の既存実装と対）(d) `01-decision-rules.md:443` DSR-22 の `--control-surface` 記述「（操作面、`#ffffff`、対 `--card` 1.04:1・対 `--background` 1.02:1、入力欄・Select、Gated Amendment 6 S44）」→「（操作面、`#fafaf9`、対 `--card` #f5f5f4 1.02:1、入力欄・Select、Gated Amendment 7 S46）」（`00-foundations.md:21` の正本表記と一致させる）。完了条件は AC 参照。`00-foundations.md` 自体は既に正（`#fafaf9`）のため変更なし
- **S6 Plans.md ④ + Contract Coverage Ledger 記入**: 本 packet の active link を反映（本 commit で同時実施）。Contract Coverage Ledger は下記節を参照

## Non-scope

- ListShell 化、識別列固定 + 出っ張り解消（Lane 4）、ページ送り関連（Lane 3）、棚卸し header
- toolbar / filter 枠の地色差（Lane 2 申し送り (v) / owner E15、ListShell 化 lane）
- `ExportBar.tsx`（daily-sales / monthly-sales）の disabled `<span role="button">`（select/input でも Button variant でもない、起票時実測 L5-D4）
- `ProductFormPage.tsx:233` の `plu-memory-no` readOnly 表示欄（`bg-muted`、起票時実測 L5-D3）
- `SegmentedControl` active/selected 状態の stone-300 と stone-400 の catalog/実装食い違い、catalog ⑤ 使用トークン表 root 行の広範な staleness（`rounded-lg`/`bg-muted`/`p-[3px]` 等、border 以外の複数属性、起票時実測 L5-D2）
- `StockStatusBadge` 等の Badge outline border override 色自体（badge.tsx 変更は無影響、起票時実測で確認済み）
- `ReturnExchangePage.tsx:570` の「レジ戻し済み」badge（owner「後続 sweep で消さない」明示済み）
- `ReturnExchangePage.tsx:147` `registerOptionClass` の radio 選択肢ラベル背景（D8 除外対象の radio に付随、不変）

## Acceptance Criteria

- AC1: S1a〜S1k の 23 箇所すべてで旧 `bg-background`（対象 class 内）が 0、新 `bg-control-surface` が対象数以上 — 各 S 項目内の `rg` コマンドで file 別に検査（起票時 hit 数併記済み）
- AC2: `button.tsx` variant outline が `border-input` を持ち、旧 exact class `"border bg-background shadow-xs..."` が 0 — `rg -Fn "border bg-background shadow-xs" src/components/ui/button.tsx` = 0、`rg -Fn "border border-input bg-background shadow-xs" src/components/ui/button.tsx` ≥ 1。新規 `button.test.tsx` で `variant="outline"` render 結果が `toHaveClass("border-input")` を満たす
- AC3: `badge.tsx` variant outline が `border-border-strong` を持ち、旧 `border-border text-foreground` が 0 — `rg -Fn "border-border text-foreground" src/components/ui/badge.tsx` = 0、`rg -Fn "border-border-strong text-foreground" src/components/ui/badge.tsx` ≥ 1。新規 `badge.test.tsx` で `variant="outline"` render 結果が `toHaveClass("border-border-strong")` を満たす
- AC4: `StockStatusBadge.test.tsx`（存在すれば）または `stock-inquiry` 関連既存 test が pass のまま — badge.tsx 変更が override 呼び出し側に退行を起こしていないことの回帰確認（既存 test 名は Writer 実装時に確認）
- AC5: `SegmentedControl` が退行していない — 既存 `segmented-control.test.tsx` SC6 が pass のまま、`rg -n "border-stone-300" src/components/ui/segmented-control.tsx` = 0
- AC6: `02-component-catalog.md` の `--control-surface` HEX が `#fafaf9`、SegmentedControl focus 記述が `border-border-strong` — `rg -Fn "#fff（S44）" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:904`）かつ `rg -Fn "#fafaf9（Gated Amendment 7 S46）" docs/design-system/02-component-catalog.md` ≥ 1 かつ `rg -Fn "border-stone-300\` + soft ring" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:296`）かつ `rg -Fn "border-border-strong\` + soft ring" docs/design-system/02-component-catalog.md` ≥ 1
- AC7: `02-component-catalog.md` ⑪ 日付・月ナビの記述が `bg-control-surface` — `rg -Fn "border-input bg-background" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:685`）かつ `rg -Fn "input は \`border-input bg-background\`" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:696`）かつ `rg -Fn "border-input bg-control-surface" docs/design-system/02-component-catalog.md` ≥ 2
- AC8: `01-decision-rules.md` DSR-22 の `--control-surface` HEX が `#fafaf9` — `rg -Fn "control-surface\`（操作面、\`#ffffff\`" docs/design-system/01-decision-rules.md` = 0（起票時 1、`:443`）かつ `rg -Fn "control-surface\`（操作面、\`#fafaf9\`" docs/design-system/01-decision-rules.md` ≥ 1
- AC-L3-1（owner Windows native L3）: 代表 2 画面（入出庫履歴・在庫照会 or owner 選定の 2 画面）で `bg-control-surface` 化した入力欄の面と枠が揃って見える
- AC-L3-2（owner Windows native L3）: 代表 1 画面で `variant="outline"` の `Button`/`Badge` の枠が入力欄と同じ濃さに見える

## Design Sources

- Requirements / spec: 該当なし（新規 REQ 追加なし）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の class 変更のみ）
- Function / command / DTO: 該当なし
- DB: 変更なし
- Screen / UI: `docs/design-system/00-foundations.md`（カラーパレット、変更なし・正本参照のみ）/ `docs/design-system/01-decision-rules.md` DSR-08（色は補助）/ DSR-22（一覧の器・現在行・UI 部品枠のコントラスト）/ `docs/design-system/02-component-catalog.md` ⑤ SegmentedControl / ⑨ 検索+フィルタ / ⑪ 日付・月ナビ
- Decision log / ADR: `docs/decision-log.md` D-079（UI 視覚系 change の座組）。本 lane は owner 決定（D8/E13/E15、Plans.md ④）の執行であり新規 durable decision の追加はない（L5-D1〜D5 は packet 止まりの実装判断）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | — | 該当なし |
| Command / DTO / generated binding / wire shape | — | 該当なし |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `02-component-catalog.md` ⑤/⑨/⑪、`01-decision-rules.md` DSR-22、`00-foundations.md` | updated in this PR（S5、`00-foundations.md` は既存で正） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | `docs/decision-log.md` D-079 の座組を踏襲、新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 新規 REQ 追加なし。ただし新規 `button.test.tsx` / `badge.test.tsx` が REQ / UI ID 未参照のため T4 baseline が 22 → 24 に増加（起票時未検出、実装中に判明）→ L5-D6 で baseline 更新 + 90-traceability 再生成（Writer `a919c16` / comment 是正 `0e1dffe`） |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | `01-decision-rules.md` DSR-22 | L5-D1（2026-09-05） | Badge は input 系コンポーネントでないため、枠色は `border-input`（`--input` 経由）でなく直接 `border-border-strong` utility を使う。既存の `SegmentedControl`/`SearchBar` D-7 例外が同じ方式（直接 utility）を採用しており一貫性がある。`border-input` を使う代替案は Badge が「入力」の意味を持たないため不採用 | `src/components/ui/badge.tsx` | 新規 `badge.test.tsx` |
| — | 起票時実測「`segmented-control.tsx` 現状」節 | L5-D2（2026-09-05） | owner E13 (c) の前提（`border-stone-300` 直書き未対応）は Lane 2 PR #32 S9 で既に解消済みという実測結果に基づき、S4 はコード変更なし・確認のみとする。active/selected の stone-300 と stone-400 の catalog/実装食い違い、catalog ⑤ 使用トークン表 root 行の staleness は E13 の「操作枠 3:1」と主題が異なる pre-existing drift のため本 lane では追わない（Goal Invariant を前進させない、Non-目的） | なし（確認のみ） | 既存 `segmented-control.test.tsx` SC6 |
| — | 起票時実測「readOnly 表示欄」節 | L5-D3（2026-09-05） | `ProductFormPage.tsx:233` は `bg-muted` を使う非編集表示専用欄で、D8 の対象例（検索欄・ドロップダウン）とは性質が異なるため Non-scope。type 除外リストに明示されていない境界事例のため Plan Review で妥当性検査対象とする | なし（Non-scope） | 該当なし |
| — | 起票時実測「ExportBar」節 | L5-D4（2026-09-05） | `ExportBar.tsx` の disabled `<span role="button">` は `<select>`/`<input>`/`<textarea>` でも shadcn `Button` でもないカスタム要素のため D8/E13 いずれの文言にも該当しない | なし（Non-scope） | 該当なし |
| — | 起票時実測「native `<select>`/`<input>`/`<textarea>` の全列挙」節 | L5-D5（2026-09-05） | D8 の文言は「select/input」だが、`ReturnExchangePage.tsx:616` の `textarea` も同じ非 shadcn native 入力欄であり、D8 の意図（「native 入力欄の token 化 sweep」という packet 全体の目的）に照らして対象に含める妥当な拡張と判断 | `src/features/return-exchange/ReturnExchangePage.tsx` | `ReturnExchangePage.test.tsx` 新規 assertion |
| — | `src-tauri/src/bin/generate_traceability.rs:38-49`（`FE_UNREFERENCED_BASELINE`） | L5-D6（2026-09-05、Final Review round 1 P1 起源、Coordinator 裁定） | 新規 `button.test.tsx` / `badge.test.tsx` は画面非依存の shared UI primitive の class 契約 test で、REQ / UI ID を付けると偽の traceability になる。tool の指示文（増加時は ID 付与）は画面紐付き test を想定したもので、Lane 2 の `PageShell.test.tsx` に `UI-01a` を付けた先例は pilot 画面が実在した場合。よって baseline を 22 → 24 に更新し、comment に日付付きの独立 bullet として記録する（既存 PR-B bullet の遡及改変は Writer commit `a919c16` で発生 → `0e1dffe` で原文へ復元）。Registration Obligations 表「再生成不要」は REQ 表本体の話で、T4 baseline の増加は起票時実測で未検出だった gap | `generate_traceability.rs`（定数 + comment） | `generate_traceability -- --check` OK（ERROR 0 / WARN 0） |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 packet の「起票時実測」節が値・理由の一次情報。実装後は S5 で catalog / DSR-22 に反映し packet 依存を解消する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし。L5-D1〜D5 は実装詳細の Coordinator 判断のため packet 止まりでよい（新規 decision-log entry 不要、owner 決定 D8/E13/E15 は既に Plans.md ④ に記録済み）
- Assumptions and constraints: 23 箇所の対象範囲は D8 の明示除外（checkbox/radio/file/hidden）と Coordinator 判断（L5-D3/D4/D5）で確定。Plan Review はこの境界線の妥当性を検査する
- Deferred design gaps, risk, and follow-up target: SegmentedControl active/selected の stone-300 と stone-400 の catalog/実装食い違い、catalog ⑤ 使用トークン表 root 行の staleness（L5-D2）は後続 docs-accuracy 候補として記録
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-list-backbone-d-lane5.md) 各行に L5-D 番号か DSR-22 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は type="checkbox"/"radio"（D8 明示）+ L5-D2〜D4（Coordinator 判断、理由記載済み）のみ。すべて起票時実測で列挙し、抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の class 変更のみ | — |
| Fact check / design decision split | 適用: 起票時実測で owner E13 (c) の前提（SegmentedControl 未対応）が実装と食い違うことを発見（L5-D2） | 本 packet の「起票時実測」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 11 画面の入力欄・2 primitive の見た目が変わる。owner L3 で確認（AC-L3-1〜2） | AC-L3-1〜2 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜2） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: `--border-strong`/`--input`/`--control-surface` は Lane 2 で正本化済み（`00-foundations.md`）、本 lane は既存 token を参照する class の張り替えのみ
- Source docs updated in this PR: `02-component-catalog.md` ⑤/⑪ + toolbar 記述 / `01-decision-rules.md` DSR-22
- Design gaps intentionally deferred: SegmentedControl active/selected の catalog/実装食い違い（L5-D2、後続候補）
- Durable decisions discovered in this plan and promoted to source docs: なし（既存 owner 決定の執行）

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の class 変更のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言変更なし、見た目（枠・面）のみ
- Error, empty, retry, and recovery behavior: 変更なし
- Testability and traceability IDs: 新規 REQ 追加なし

## Contract Probe

- badge.tsx outline の border override 呼び出し側（`StockStatusBadge` 等）が tailwind-merge の後勝ちで新色を受け取らないという前提: 起票時実測で `cn(badgeVariants({variant}), className)` の合成順とtailwind-mergeの挙動を確認済み（静的コード確認、追加実験不要、N/A）
- `button.tsx`/`badge.tsx` の変更が dark mode 経由でのみ有効な既存 `dark:` class に影響しないという前提: 本アプリは `@theme inline` に dark block を持たず `dark:` variant は実質無効（Lane 2 archived packet で確認済みの既知事実）。追加実験不要（N/A）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| S1a〜S1k native 入力欄 `bg-control-surface`（owner D8） | 11 file 23 箇所 | 各 Page/Component test 新規 assertion + `rg` file 別 anchor | AC-L3-1 |
| S2 button.tsx outline `border-input`（owner E13 (a)） | `src/components/ui/button.tsx` | 新規 `button.test.tsx` | AC-L3-2 |
| S3 badge.tsx outline `border-border-strong`（owner E13 (b)） | `src/components/ui/badge.tsx` | 新規 `badge.test.tsx` | AC-L3-2 |
| L5-D1 Badge は `border-input` でなく直接 utility | `badge.tsx` | 同上 | non-scope（実装判断） |
| L5-D2 SegmentedControl 既完了確認（owner E13 (c)） | 変更なし、`segmented-control.tsx` 現状維持 | 既存 `segmented-control.test.tsx` SC6 | non-scope（回帰確認のみ） |
| S5(a) catalog ⑪ 日付・月ナビ `bg-control-surface` 同期 | `docs/design-system/02-component-catalog.md:685,696` | 該当なし（docs review） | non-scope |
| S5(b) catalog toolbar `--control-surface` HEX 同期 | `docs/design-system/02-component-catalog.md:904` | 該当なし（docs review） | non-scope |
| S5(c) catalog ⑤ SegmentedControl focus 同期 | `docs/design-system/02-component-catalog.md:296` | 該当なし（docs review） | non-scope |
| S5(d) DSR-22 `--control-surface` HEX 同期 | `docs/design-system/01-decision-rules.md:443` | 該当なし（docs review） | non-scope |
| L5-D3 readOnly `plu-memory-no` 欄の Non-scope 判断 | `src/features/products/ProductFormPage.tsx:233` | 追加テストなし | non-scope |
| L5-D4 `ExportBar.tsx` の Non-scope 判断 | 変更なし | 追加テストなし | non-scope |
| L5-D5 `ReturnExchangePage.tsx` textarea を対象に含める判断 | `src/features/return-exchange/ReturnExchangePage.tsx:616` | `ReturnExchangePage.test.tsx` 新規 assertion | AC-L3-1 |
| L5-D6 shared UI primitive の contract test を traceability baseline へ参入（22 → 24、ID 捏造なし） | `src-tauri/src/bin/generate_traceability.rs:43` + comment | `cargo run --bin generate_traceability -- --check` = OK | non-scope（L3 対象外、機械検査） |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-05-ui-list-backbone-d-lane5.md](test-matrices/2026-09-05-ui-list-backbone-d-lane5.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（本 lane は frontend のみだが release check の慣行は維持する）。

- targeted tests: 11 画面/component の native 入力欄 class assertion（新規）、`button.test.tsx`/`badge.test.tsx`（新規）
- negative tests: `variant="default"` は `border-input`/`border-border-strong` を持たないことの対照 case
- compatibility checks: `StockStatusBadge` 等 override 呼び出し側の既存 test が pass のまま（AC4）、`segmented-control.test.tsx` SC6 が pass のまま（AC5）
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: 該当なし（route/DTO 変更なし）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（class 文字列の変更のみ）。

## Review Focus

- 23 箇所の native 入力欄がすべて `border-input bg-control-surface`（`PriceRevisionFilters` のみ `border-input` 新規付与）になっていること、file 別の起票時 hit 数と実装後 hit 数が一致すること
- `button.tsx`/`badge.tsx` の変更が意図しない箇所（`StockStatusBadge` 等の override 呼び出し側）に波及していないこと
- `SegmentedControl` に対する誤った追加変更（既に完了済みのため）が入っていないこと
- Non-scope に列挙した項目（`ExportBar`、`plu-memory-no`、SegmentedControl active/選択状態の食い違い、`ReturnExchangePage.tsx:147`、`:570`）が変更されていないこと

## Spec Contract

Contract ID: SPEC-UILB-D5

- 11 画面 23 箇所の native 入力欄が `bg-control-surface`（1 箇所は `border-input` 新規付与も伴う）になり、`button.tsx`/`badge.tsx` の outline variant 枠が `--border-strong` 系トークンになり、SegmentedControl は既存の `--border-strong` 化を退行させない

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UILB-D5 | S1a〜S1k | 各 Page/Component test 新規 assertion | native 入力欄の面 token | vitest |
| SPEC-UILB-D5 | S2 | `button.test.tsx`（新規） | outline button の枠 token | vitest |
| SPEC-UILB-D5 | S3 | `badge.test.tsx`（新規） | outline badge の枠 token | vitest |
| SPEC-UILB-D5 | S4 | 既存 `segmented-control.test.tsx` SC6 | 退行なし確認 | vitest |
| SPEC-UILB-D5 | S5 | docs review（自動テストなし） | catalog/DSR-22 の記述一致 | `rg` 完全一致 |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし

## Implementation Results

Writer: Claude Sonnet 5 subagent（worktree isolation、`$TMPDIR/lane5-writer`、HEAD `baf5ad4`）。

- S1a〜S1k（11 画面 23 箇所の native 入力欄）: すべて `bg-background` → `bg-control-surface`、`PriceRevisionFilters.tsx:46` のみ `border-input` 新規付与も実施。起票時実測の hit 数（各 file）と実装後 hit 数が完全一致（`rg -c` で個別確認済み）。
- S2 `button.tsx`: outline variant を `"border bg-background shadow-xs..."` → `"border border-input bg-background shadow-xs..."` へ、冗長化した `dark:border-input` を撤去。新規 `button.test.tsx`（SC1）追加。
- S3 `badge.tsx`: outline variant を `border-border text-foreground` → `border-border-strong text-foreground` へ（L5-D1、`border-input` でなく直接 utility）。新規 `badge.test.tsx`（SC2）追加。
- S4 `SegmentedControl`: コード変更なし。`border-stone-300` 残存 0、既存 `segmented-control.test.tsx` SC6 は無変更のまま pass を再確認。
- S5 docs 同期: `02-component-catalog.md` ⑪ 日付・月ナビの `bg-control-surface`（:685 コード片 + :696 使用トークン文）、toolbar `--control-surface` HEX（:904、`#fff（S44）`→`#fafaf9（Gated Amendment 7 S46）`）、SegmentedControl focus 記述（:296、`border-stone-300`→`border-border-strong`）を同期。`01-decision-rules.md` DSR-22（:443）の `--control-surface` HEX を `#ffffff`→`#fafaf9` へ同期。
- S6: 本節（Implementation Results）の記入のみ実施。Plans.md ④ / Contract Coverage Ledger の編集は Coordinator 領域のため実施していない。

### 既存 test 変更（class assertion 拡張のみ、削除・skip なし）

| file | 変更内容 |
|---|---|
| `InventoryRecordsPage.test.tsx` | 新規 `describe`「native input tokens（Lane 5 SC4a）」を追加（既存 test は無変更） |
| `ReceivingPage.test.tsx` | 同上（SC4b） |
| `DisposalPage.test.tsx` | 同上（SC4c） |
| `ReturnExchangePage.test.tsx` | 同上（SC4d、`:147` registerOptionClass 非退行の assertion 含む） |
| `ProductForm.test.tsx` | 同上（SC4e） |
| `StockUnitField.test.tsx` | 同上（SC4f、checkbox 無変更の assertion 含む） |
| `ManualSalePage.test.tsx` | 同上（SC4g） |
| `StockMovementsPage.test.tsx` | 同上（SC4h） |
| `PriceRevisionPage.test.tsx` | 同上（SC4i、`border-input` 新規付与の assertion 含む） |
| `MonthlySalesPage.test.tsx` | 同上（SC4j） |
| `DailySalesPage.test.tsx` | 同上（SC4k） |

いずれも既存 `it` の削除・変更・skip はなし、新規 `describe`/`it` の追加のみ。

### mutation 自己確認（抜粋、production は都度 `git checkout --` 相当で復元済み）

- SC4a（`InventoryRecordsPage`）: 記録種別 select の class を `bg-control-surface`→`bg-background` に 1 箇所だけ戻すと、集約 test が `expect(field).toHaveClass("bg-control-surface")` で fail（6 箇所中 1 箇所の取りこぼしを検出）
- SC4d（`ReturnExchangePage`）: 種別 select（:528 相当）を同様に 1 箇所戻すと同じ assertion で fail（4 箇所中 1 箇所の取りこぼしを検出）
- SC4e（`ProductForm`）: 部門 select を同様に 1 箇所戻すと fail（3 箇所中 1 箇所の取りこぼしを検出）
- SC4h（`StockMovementsPage`）: 開始日 input を同様に 1 箇所戻すと fail（3 箇所中 1 箇所の取りこぼしを検出）
- SC1/SC2/単一箇所の S1b/c/f/g/j/k は red→green の遷移自体が kill 証跡（単一 assertion のため多重欠落パターンの追加確認は不要と判断）

### 実装判断メモ

- T4（`generate_traceability --check`）が baseline 22→24 の drift を検出（新規 `button.test.tsx`/`badge.test.tsx` が REQ/UI ID 未参照のため）。既存 `segmented-control.test.tsx`（shared UI primitive、同じく未参照）の先例に倣い、`FE_UNREFERENCED_BASELINE` を 24 へ更新して再生成した。packet の Registration Obligations 表は「新規 REQ 追加なし、再生成不要」としていたが、これは REQ 表本体（`generate_traceability.rs` の REQ-NNN 対応表）の話であり、T4 の FE 未参照 baseline drift は別軸。起票時実測に含まれていなかった drift のため、ここに実装判断として記録する。
- AC4（`StockStatusBadge` 等の回帰確認）: 専用 `StockStatusBadge.test.tsx` は存在しない。`src/features/stock-inquiry` 配下の既存 test（11 file 87 test）が無変更のまま pass することで規定の「stock-inquiry 関連既存 test が pass のまま」を満たすと判断。加えて scratch test（commit 対象外、削除済み）で `ok`/`low`/`stockout` の override 色（`border-stone-200`/`border-warning-border`/`border-destructive-border`）が badge.tsx 変更後も tailwind-merge の後勝ちで維持されることを個別に確認した。

### 残リスク / skip した検査

- SegmentedControl active/selected の stone-300 と stone-400 の catalog/実装食い違い（L5-D2）は Non-scope のまま未着手（packet どおり）
- owner Windows native L3（AC-L3-1〈入力欄の面と枠〉/ AC-L3-2〈outline ボタン・Badge の枠〉）は本 Writer セッションでは未実施（Human Gate、Coordinator 領域）

## Review Response

Plan Review（独立 Sonnet subagent、fresh context、隔離 worktree、read-only、Coordinator が P1/P2 を実読で裏取り）:
- round 1（対象 `259155c`）: P1×0 / P2×1（D-074 stacked train の記載なし）/ P3×1（`L5-D1〜D6` の誤記）。起票時実測（23 要素 11 file、token 定義、SegmentedControl の Lane 2 済み、Badge の tailwind-merge 優先順位、AC anchor、`getByLabelText` の accessible name 実在）は全件一致。是正 `f64992e`
- round 2（対象 `f64992e`）: 新規 P2×1（「D-074 rule (d)」は Coordinator の個人 memory 由来の表記で repo 正本に不在 → D-039 / PK5 へ差し替え）/ P3×1（merge delta の再検証を pre-commit）。是正 `be8acf5`
- round 3（対象 `be8acf5`）: 引用が DEV_WORKFLOW `:125` と一致、新規 P1/P2 なし → **approve**（round 3/3）

2026-09-05: Plan Gate 収束（round 3/3、是正 commit = round 1 `f64992e` / round 2 `be8acf5`）。`plan-draft -> plan-gate -> plan-approved -> implementing` を Plans.md ④ 同期の content commit に同乗させて遷移（Risk 節の stacked train 方針どおり forward state-only を温存）: plan-gate の証跡 = plan-first commit `259155c`（Plans.md ④ active link 同乗）と上記 round 1〜3、plan-approved の証跡 = round 3 approve（最終 P1/P2 = 0）、Plan Commit = `259155c`。Writer = Claude Sonnet 5 subagent（worktree isolation、Lane 3 の Sonnet Writer とは別 context）。

2026-09-05: Writer（Claude Sonnet 5 subagent、worktree isolation、TDD）が content commit 6 本（`ebe3f75` S1a〜S1k / `5fa72cf` S2 / `5f51394` S3 / `b3fccb2` S5 / `a919c16` traceability baseline / `5d2a8aa` Implementation Results）を積んだ。全 gate PASS、L1 full RESULT=PASS、`generate_traceability --check` OK（exact SHA と evidence は PR body を正とする）。

Final Review round 1（独立 Sonnet subagent、fresh context、隔離 worktree、AC1〜AC8 を実行で再実測、Badge / Button の全 caller sweep）: P1×1 / P2×0 / P3×0。
- P1（accept）: `FE_UNREFERENCED_BASELINE` 22 → 24 の変更に伴い、Writer が既存 PR-B bullet（2026-06-13、17 → 22）に `button / badge` を遡って挿入し履歴 comment が事実と食い違った。加えて baseline 変更が Registration Obligations 表の想定外で審査経路に載っていなかった。Coordinator 裁定 = baseline 24 は維持（画面非依存の shared primitive に UI ID を付けるのは偽の traceability、L5-D6）、comment は原文復元 + 日付付き独立 bullet（Writer `0e1dffe`）、L5-D6 を Design Intent Trace / Ledger / Registration Obligations へ記録（Coordinator `251ecde`）
- round 2（対象 `251ecde`）: PR-B bullet が `baf5ad4` の原文と byte 一致、Lane 5 bullet 独立、module doc に増加時の規則追記、`--check` OK、L5-D6 記録が審査経路の欠落を満たす → **approve**（新規 P1/P2 なし）

Coordinator mutation 独立再実測（Sonnet 委譲、隔離 worktree `5d2a8aa`）: Y1 button `border-input` 撤去 / Y2 badge `border-border` へ戻す / Y3〜Y6 多重箇所 file の最後の 1 要素だけ戻す（InventoryRecords 6 / ReturnExchange 4 / ProductForm 3 / StockMovements 3）/ Y9 PriceRevisionFilters の `border-input` のみ撤去 / Y10 ManualSale / Y11 MonthNavigator = **9 体全 kill、survivor 0**。集約 test が全要素を列挙し、2 token を conjunction で assert していることを確認。

Review-only skipped because: Final Review を独立 Sonnet subagent（fresh context）が担い、Coordinator が mutation を別 context で独立再実測したため R3 review-only sub-agent の役割は充足。Codex ロジックレビュー 1 回は週次リセット後に Draft PR 上で実施し（`gh pr view` の review comment を evidence とする）、その findings は human-confirm 中に裁定する（Findings Freeze は Codex round 完了時に設定）。
- Findings Freeze: not yet frozen（Codex ロジックレビュー待ち）; post-freeze exceptions: none.

2026-09-05: owner Windows native L3（HEAD `9b97849`、介入 2/3）= **PASS**。AC-L3-1 は入出庫履歴 + 一括価格改定、AC-L3-2 は入出庫履歴で確認（原文 = `docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md`「Lane 5 L3 結果 原文」）。同 L3 の所感 R5-1〜5（プルダウンの shadcn `Select` 統一と外枠 `#F5F5F4` は owner 決定）は Plans.md ④ ledger に起票済み（Lane 3 branch `5d3f98e`、Lane 3 merge 後に main へ）。Human Gate 完了。残り = Codex ロジックレビュー 1 回（週次リセット後）→ Findings Freeze → Lane 3 merge 後の base 付け替え → ready-hosted-final。

2026-09-05: Lane 3 squash merge（PR #34 → main `1d44ba2`、closeout `8cd2c04`）後の base 付け替え。旧 tip `312a7ad` を保存し、Writer（Sonnet）が `origin/main` `8cd2c04` を単段 merge → merge commit `fdcd2ed`（衝突 10 file: archive の rename もつれ 4 は main 側採用 + 誤 rename 削除、Plans.md ④ は main の Lane 3 完了表記 + Lane 5 active link、raw feedback file は両 section 併存、test 3 file は SC9a と SC4 系を両方保持）。全 gate PASS、L1 full RESULT=PASS、PK5 OK（Plan Commit `259155c` が祖先）。Final Reviewer の merge delta 再検証（`git diff 312a7ad..fdcd2ed -- src` = Lane 3 由来の純追加 4 file のみ、Lane 5 の 26 file は `312a7ad` と byte 一致、3 test file の main 側 `it` 欠落 0、74 test pass）= **approve**。PR #35 の base は main。Reviewed Content HEAD は `251ecde` のまま（merge delta は Lane 3 の reviewed content と Lane 5 の reviewed content の合成で、新規の実装変更なし）。次 = Codex ロジックレビュー（リセット後）→ Findings Freeze → ready-hosted-final。

2026-09-05: `implementing -> local-verified -> independent-review -> human-confirm` を Plans.md ④ 同期の content commit に同乗させて遷移（Risk 節の stacked train 方針どおり forward state-only を温存）: local-verified の証跡 = Writer content commit の gate 群 + L1 full RESULT=PASS（PR body）、independent-review の証跡 = Final Review round 2 approve + mutation 9/9 kill、Reviewed Content HEAD = `251ecde`。次 = Draft PR 作成（base = Lane 3 branch、Lane 3 merge 後に main へ retarget）→ Codex ロジックレビュー（リセット後）→ owner Windows native L3（AC-L3-1〜2、Lane 3 run 3 と同時実施可）。
