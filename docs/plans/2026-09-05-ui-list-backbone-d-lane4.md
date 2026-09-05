# Plan Packet: UI 一覧の背骨 D — Lane 4（表を縮ませる / ページ送りの上下切り分け / 表示件数の位置統一 / 枠の地色）

owner 決定（2026-09-05、[Plans.md ④](../Plans.md) R2-1/R2-2/R3-2/R5-2/R5-4 各 sub-bullet + E12、`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md:95,109,145`）に基づき、8 一覧画面の「窓を狭めると表が枠から出っ張る」現象を識別列 sticky ではなく表そのものを縮ませる方式（D）で解消し、ページ送りの上下帯を「上部は常時表示・ボタンなし」「下部は複数ページ時のみ」へ切り分け、表示件数 `Select` の位置と filter/toolbar 枠の地色を 8 画面で統一する。E12 が示した「横 scroll 容器 + 識別列 sticky」案は、DSR-17 `<main>` 単一 scroll 契約と CSS の overflow 計算規則から Contract Probe（Playwright 不要）で不採用と確定し、`ListShell` の `identityColumns` prop は引き続き未使用のまま予約する。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer、D-056）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer）+ Codex ロジックレビュー 1 回（Codex 枠切れ、2026-09-07 夜の週次リセット後。§3.3 Capacity-degraded により pending、human-confirm で待機し Phase を前進させない）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3 — AC-L3-1 窓を狭めても表が枠内に収まり長文列が折り返す（2 画面）, AC-L3-2 ページ送り上下（複数ページの画面 1 つ + 単一ページの画面 1 つ）, AC-L3-3 表示件数 Select の位置と枠の地色が 8 画面で揃う, plus one run at 特大 × OS 125%（Plans.md ④ (vii) residual risk）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3。1 = 起票選定 2026-09-05 消費済み、2 = L3、3 = 承認 + merge Coordinator 代行）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
8 一覧画面（商品一覧 / 棚卸し / 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ / 一括価格改定 / 整合性チェック）の operator workflow に見える見た目変更（表の横幅挙動、ページ送りの上下帯構成、表示件数 `Select` の位置、filter/toolbar 枠の地色）+ 共有 UI primitive（`ListShell`/`Pagination`/`PaginationSummary`、Button/Badge と並ぶ widely-shared component）の contract 変更。DB スキーマ・Tauri command DTO・POS CSV・PLU TSV 形式の変更はない。DEV_WORKFLOW Risk Tiers の R3「route/search state, operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

**Stacked train（D-074、AGENT_OPERATING_MANUAL §3.3 Stacked train 節）**: 本 branch は Lane 5（`agent/ui-list-backbone-d-lane5`、Draft PR #35、human-confirm 中、tip `04f89a4`）から作成した（`InventoryRecordsPage.tsx` / `StockMovementsPage.tsx` / `PriceRevisionFilters.tsx` / `OperationLogsPage.tsx` / `button.tsx`/`badge.tsx` が Lane 5 と重なるため main 起点では衝突する）。Coordinator は本 packet の plan-approved 前に、branch を lane ⑧（`agent/ui-select-unify`、native `<select>` 23 箇所 → shadcn `Select` 置換、Lane 5 merge 後起票）の tip へ単段 merge で付け替える予定（merge train: Lane 5 → ⑧ → Lane 4）。Lane 5 が先に merge された場合は旧 tip を保存してから最新 `origin/main` を 1 回だけ merge する。rebase はしない（D-039 / PK5「Plan Commit ancestry」）。付け替え後の merge delta が実装 file に触れる場合は、その delta を独立に再検証（対象 test の再実行 + Final Reviewer による差分実読）してから Phase を進める。forward state-only は本 lane 自身で 1 本（human-confirm → ready-hosted-final）に抑え、他の遷移は content commit 同乗で行う（D-074 rules、no rebase、forward state-only budget 1）。

## Goal

Goal Invariant:

### 最小完了条件

- 8 一覧画面すべてで、窓を狭めても表が toolbar/filter 枠の幅を越えて出っ張らず、長文列（商品名・名前・備考・概要）が折り返して表示される
- 上部に `PaginationSummary`（範囲付き統一形、`text-sm text-muted-foreground`、ボタンなし）が `totalCount > 0` のとき常に表示される（`ListShell` の 1 画面 + 新規 7 画面）
- 下部 `Pagination`（summary + 前へ/次へ）は `totalPages > 1` のときだけ表示され、`totalPages <= 1`（0 件を含む）では何も描画しない
- 表示件数 `Select` が 8 画面すべてで toolbar/filter 枠内の最後尾（右端）に位置する
- 検索欄・取引先・部門などを囲む filter/toolbar 枠の地色が 8 画面すべてで既存 `--card` #f5f5f4 に統一される（新規 token なし）

### 失敗定義

- 8 画面のいずれかで窓を狭めたときに表が枠外へ出っ張る、または対象の長文列が折り返さず横 scroll のみに依存したままになる
- 上部 summary が 7 画面のいずれかで欠落する、または `totalCount === 0` の場面で誤って描画される
- 下部 `Pagination` が単一ページで描画される、または複数ページで誤って非表示になる（51 件 / perPage 50 の 2 ページ目で「前へ」が消える等）
- 表示件数 `Select` が 8 画面のいずれかで枠外、または枠内の最後尾以外に残る
- 8 画面のいずれかで枠地色が `bg-card` にならない、または新規 token を追加してしまう
- `identityColumns` sticky 経路の実装に着手してしまう（Non-scope 逸脱）

### 非目的

- 識別列固定（sticky）の実装。DSR-22 `identityColumns` prop は予約のまま維持し、`ListShell` へ配線しない
- 非 ListShell 画面（棚卸し / 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ / 一括価格改定 / 整合性チェック）を `ListShell` 化すること（frame class は直接適用し、component 差し替えは行わない）
- `Playwright` の devDep 追加（Plans.md ④ の旧記述はこの packet が supersede する。probe は CSS 仕様の静的確認のみで足り、headless browser は不要）
- R2-3 / R2-4（在庫照会の展開行再クリック・検索条件追加）、badge 色（⑦）、native `<select>` → shadcn `Select` 置換（⑧）
- `StockMovementsPage.tsx:98` の商品情報 card（既存 `rounded-lg border bg-card p-4`、本 lane の filter 枠とは無関係の別 section）への変更
- `PriceRevisionTable.tsx` の入力欄（新売価・新原価・確定ボタン列、各 `min-w-32`/`min-w-44`）の最小幅そのものを縮めること。狭幅・拡大表示での残存水平 scroll は residual risk として記録する（下記 L4-D6）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、worktree base `04f89a4`〈Lane 5 branch tip、Draft PR #35 human-confirm 中〉、すべて本 packet 起草者が rg で再確認。行番号は Lane 5 実装後の現行値であり、Plans.md ④ の R2-1〜R5-4 起草時点の行番号とは異なる）

### ListShell / table primitive の overflow 機構（出っ張りの機序）

- `table.tsx:9` の `Table` container は `relative w-full overflow-x-auto`（data-slot=table-container）。通常の非 sticky 画面ではこの `overflow-x-auto` が横 overflow 時に**内部スクロールバー**を出し、page 地には出っ張らない
- `ListShell.tsx` の `STICKY_TABLE_CLASSES`（`:40-63`）は sticky 時に `[&_[data-slot=table-container]]:overflow-visible` でこの内部スクロールを**打ち消す**（sticky thead の `top` 基準を `<main>` に保つため。DSR-17 `:292` が `<main>` を唯一の scroll container と定める契約に従う設計）。overflow-visible な container は横に溢れた内容を隠しも scroll もしないため、そのまま右へ表示される
- `ListShell.tsx:99` の帯+table wrapper `<div className="w-min min-w-full">`（Gated Amendment 3 S13 由来）は「横 overflow 時は帯が table の内容幅（`w-min` = `width: min-content`）へ追随し、非 overflow 時は親幅 100%」という意図（catalog ⑯ 項目 3、`02-component-catalog.md:906`）。しかし overflow-visible な子と組み合わさると、内容幅が親（toolbar 枠）の幅を超えたときにこの wrapper 自体が親の外へ広がり、`<main>` へその分だけ余分な横幅を持ち込む——これが「toolbar は縮むのに下の list が右へ出っ張る」（owner E12 原文）の直接の機序
- **是正の要点**: wrapper を `w-full`（親幅に固定）へ戻し、代わりに長文列を `whitespace-normal` で折り返させることで table の内容幅そのものを toolbar 幅以下に収める。sticky thead の `top` 基準（`<main>` 相対）や `overflow-visible` の指定は変更不要（折り返しにより内容幅超過そのものが起きなくなるため）

### 識別列 sticky（E12 案）が Non-scope である技術的根拠（Contract Probe、Playwright 不要）

- CSS Overflow の仕様上、要素の `overflow-x` と `overflow-y` の一方が `visible` 以外（例: `auto`）のとき、`visible` のままのもう一方は `auto` へ computed される（2 軸を跨ぐスクロールは意味を持たないため）。したがって「表を横 scroll 容器（`overflow-x: auto`）に包む」設計は、その要素を **縦方向にもスクロール可能な独立 scrolling ancestor** に変える
- DSR-17 `:292` は `<main>`（`RootLayout.tsx`）を route content の唯一の scroll container と定める。`position: sticky` の `top` オフセットは最近傍の scrolling ancestor を基準にするため、横 scroll 容器を挟むと sticky thead の基準が `<main>` からその容器へ切り替わり、`ListShell` が前提とする `<main>` 相対の sticky 挙動（DSR-22 の sticky header）と両立しない
- この帰結は CSS 仕様から静的に導けるため、Playwright / headless Chromium での実行時 probe は不要（Contract Probe = 本節の記述そのもの、追加実験なし、N/A）。E12 が示唆した「両立方式の probe」（`01-decision-rules.md:429` 末尾の申し送り）はこの結論をもって**不採用**とし、`identityColumns` prop は Lane 2 からの予約状態のまま維持する

### 8 画面の table / frame / pagination 現況サーベイ

| 画面 | ListShell | table 幅制約 | 長文列（現状） | perPage Select 位置 | filter/toolbar 枠 | 上部 summary | 下部 pager 条件 |
|---|---|---|---|---|---|---|---|
| 商品一覧（`ProductListPage.tsx`） | ✅（`:272-335`） | `ListShell.tsx:99` `w-min min-w-full`（sticky） | `ProductTable.tsx:53` 商品名 = 既に `min-w-[14rem] whitespace-normal`（対応済み） | `toolbarSecondary`（`:186-211`）内、並び替え Select・SegmentedControl の後 | `ListShell.tsx:88` `rounded-lg border bg-card p-4`（reference） | あり（`topSummary` prop、`totalCount>0`） | `hasResults`（`totalCount>0`）のみ、`totalPages` 非考慮 |
| 棚卸し（`StocktakePage.tsx`） | ✗ | 制約なし（`Table` 直描画、`:822`） | `:838` 商品名 `<TableCell>{item.name}</TableCell>`、class なし＝nowrap | `:752-778` filter 行内、部門 Filter の後・未入力のみ Checkbox の**前**（最後尾でない） | `:742` 枠なし（`<div className="flex flex-wrap items-center gap-4">`） | なし | 無条件（`<fieldset><Pagination/></fieldset>`、`:854-863`） |
| 在庫照会（`StockInquiryPage.tsx`） | ✗ | 制約なし（`ProductListTable.tsx`、wrapper なし） | `ProductListTable.tsx:80` 商品名 `<TableCell>{item.name}</TableCell>`、class なし＝nowrap | `:131-156` filter 行内、SearchBar・DepartmentFilter の後＝既に最後尾 | `:102` 枠なし | なし | `statusValue === "all"` かつ `totalCount !== null` のときのみ（`totalPages` 非考慮、`:234-243`） |
| 入出庫履歴（`InventoryRecordsPage.tsx`） | ✗ | 制約なし | `:362`（`InventoryRecordsPage.tsx` の代表商品列、`Table` 呼出し元）= 既に `min-w-[12rem] whitespace-normal`（対応済み） | `:272-297` filter 行内、6 native 入力欄の後＝既に最後尾 | `:159` `rounded-md border p-4`（bg なし） | なし | 無条件（`recordsQuery.data` があれば、`:387-394`） |
| 在庫変動履歴（`StockMovementsPage.tsx`） | ✗ | 制約なし | `MovementTable.tsx:93` 備考 `max-w-80 truncate`（1 行 ellipsis） | `:185-210` filter 行内、開始日・終了日・種別の後＝既に最後尾 | `:134` 枠なし（`:98` の商品情報 card は別 section、Non-scope） | なし | 無条件（`movementsQuery.data` があれば、`:243-250`） |
| 操作ログ（`OperationLogsPage.tsx`） | ✗ | `:497` `<Table className="min-w-[760px]">` + `:496` `overflow-x-auto rounded-md border` wrapper | `:522` 概要 `max-w-0 truncate` + `title` 属性（1 行 ellipsis） | `:398-423` filter 行内、開始日・終了日・種別の後＝既に最後尾 | `:344` `rounded-md border p-4`（bg なし） | なし | 無条件（`logsQuery.data.items.length > 0`、`:558-564`） |
| 一括価格改定（`PriceRevisionPage.tsx` + `PriceRevisionFilters.tsx`） | ✗ | `PriceRevisionTable.tsx:212` `<Table className="min-w-[1280px]">` | `:94-107` 商品名 `<TableCell className="min-w-48">`（span 直下、class なし＝nowrap） | `PriceRevisionPage.tsx:67-96`、`PriceRevisionFilters` の**外**・独立 div（枠外） | `PriceRevisionFilters.tsx:33` `rounded-md border bg-stone-50 p-4` | なし | 無条件（`list.productsQuery.data` があれば、`:168-175`） |
| 整合性チェック（`IntegrityCheckPage.tsx`） | ✗ | 制約なし（`:348` `overflow-x-auto rounded-md border` wrapper のみ、固定 min-w なし） | `:368` 名前 `<TableCell>{item.name}</TableCell>`、class なし＝nowrap（`TableHead` は `:353` `min-w-56`） | `:234-264` 単独 div、他 filter なし | `:234` 枠なし | なし | 無条件（`mismatches.length > 0` 分岐内、`:417-422`） |

- **Plans.md ④ の記録済み claim の訂正**（記憶ルール「記録済み claim も起草時実測」準拠）: R2-1 sub-bullet（`Plans.md:82`）は「単一ページ時は下部行ごと非表示、在庫照会で観測」と記す。実コード確認では在庫照会の `<Pagination>` は `statusValue === "all"` でのみ描画され、`totalPages` は判定に使われていない（`StockInquiryPage.tsx:234`）。「単一ページで非表示になる」経路は現状存在せず、本 packet は Plans.md の記述を実装事実としては採用しない（S4 で `totalPages <= 1` gating を新規に `Pagination.tsx` 側へ実装することで、結果として在庫照会を含む 8 画面すべてに同じ挙動を持たせる）
- **ListShell.test.tsx の it 数訂正**: 発注時想定「16 it」に対し実測 17 it（`rg -c '\bit\('` = 17、`describe` 8 個。SC4a〜SC4e/SC8/SC10/SC17 に加え identityColumns の reserved-prop test を含む）
- **Pagination.test.tsx の it 数**: 8 it（既存）。`totalCount === 0` を「0 件」と表示する既存 case が S4 の `totalPages<=1` null 化で仕様変更になる（下記 Scope S4 参照）

## Scope

- **S1 `ListShell` sticky wrapper の出っ張り根絶**: `ListShell.tsx:99` の `<div className="w-min min-w-full">` を `<div className="w-full">` へ（L4-D1、起票時実測「ListShell / table primitive の overflow 機構」節参照）。完了条件: `rg -Fn 'className="w-min min-w-full"' src/components/patterns/ListShell.tsx` = 0（起票時 1）かつ `rg -Fn 'className="w-full"' src/components/patterns/ListShell.tsx` ≥ 1
- **S2 長文列の折り返しスイープ**（対象列は起票時実測サーベイの「長文列」欄、L4-D2）:
  - S2a 棚卸し `StocktakePage.tsx:838` 商品名 `<TableCell>{item.name}</TableCell>` → `<TableCell className="min-w-40 whitespace-normal">{item.name}</TableCell>`
  - S2b 在庫照会 `ProductListTable.tsx:80` 商品名 → 同型
  - S2c 整合性チェック `IntegrityCheckPage.tsx:368` 名前 → `<TableCell className="whitespace-normal">{item.name}</TableCell>`（`TableHead` 既存 `min-w-56` を幅の下限に流用）
  - S2d 在庫変動履歴 `MovementTable.tsx:93` 備考 `className="max-w-80 truncate"` → `className="max-w-80 whitespace-normal"`（truncate 撤去、幅上限は維持）
  - S2e 操作ログ `OperationLogsPage.tsx:497` `<Table className="min-w-[760px]">` → `<Table>`（固定幅撤去）。`:522` 概要 `className="max-w-0 truncate" title={item.summary}` → `className="max-w-80 whitespace-normal"`（`title` 撤去、折返しで全文可視のため）
  - S2f 一括価格改定 `PriceRevisionTable.tsx:212` `<Table className="min-w-[1280px]">` → `<Table>`（固定幅撤去、入力欄各列の `min-w-32`/`min-w-44` は残す＝入力可能な最小幅として不変、L4-D6）。`:94` 商品名 `<TableCell className="min-w-48">` → `<TableCell className="min-w-48 whitespace-normal">`
  - 完了条件（file 別）: `rg -Fn "whitespace-normal" <file>` が対象列数以上、かつ旧 class（`max-w-0 truncate`/`min-w-[760px]`/`min-w-[1280px]`/`max-w-80 truncate`）が 0 件（各 anchor は上記 sub-item 参照）
- **S3 filter/toolbar 枠の地色統一**（`rounded-lg border bg-card p-4`、L4-D3。`ListShell.tsx:88` の既存 class 文字列と完全一致させる）:
  - S3a 棚卸し `StocktakePage.tsx:742` `<div className="flex flex-wrap items-center gap-4">` → `<div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">`
  - S3b 在庫照会 `StockInquiryPage.tsx:102` `<div className="flex flex-wrap items-center gap-3">` → 同型で `rounded-lg border bg-card p-4` 追加
  - S3c 入出庫履歴 `InventoryRecordsPage.tsx:159` `className="space-y-3 rounded-md border p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - S3d 在庫変動履歴 `StockMovementsPage.tsx:134` `<div className="flex flex-wrap items-end gap-3">` → `rounded-lg border bg-card p-4` 追加（`:98` の商品情報 card は不変、Non-scope）
  - S3e 操作ログ `OperationLogsPage.tsx:344` `className="space-y-3 rounded-md border p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - S3f 一括価格改定 `PriceRevisionFilters.tsx:33` `className="space-y-3 rounded-md border bg-stone-50 p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - S3g 整合性チェック `IntegrityCheckPage.tsx:234` `<div className="flex items-center gap-2">` → `rounded-lg border bg-card p-4` 追加
  - 完了条件（file 別）: 対象 file で `rg -Fn "bg-stone-50"` / 該当の枠なし旧 class文字列 = 0、`rg -Fn "rounded-lg border bg-card p-4"` ≥ 1
- **S4 `Pagination`/`PaginationSummary` の上下切り分け契約変更**（`src/components/patterns/Pagination.tsx`、L4-D4。8 画面共有の 1 箇所修正で全 caller に反映——owner の「呼出し元を直せば一気に全部変わる」設計選好、Lane 3 の flag 是正先例と同型）:
  - `PaginationSummary` の className: `"text-base text-foreground tabular-nums"` → `"text-sm text-muted-foreground tabular-nums"`（下部 `Pagination` の左側 summary と同じ見た目に統一）
  - `Pagination`: `computeRange` 直後に `if (totalPages <= 1) return null;` を追加（`totalCount === 0` は `totalPages = max(1, ceil(0/perPage)) = 1` のため同じ分岐で null になる——既存の「0 件」表示 test は本変更で仕様が変わる。下記 AC4 参照）
  - 完了条件: `rg -Fn 'className="text-base text-foreground tabular-nums"' src/components/patterns/Pagination.tsx` = 0（起票時 1）かつ `rg -Fn "text-sm text-muted-foreground tabular-nums" src/components/patterns/Pagination.tsx` ≥ 2（上部 summary + 下部 pager の 2 箇所が同じ token）かつ `rg -n "totalPages <= 1" src/components/patterns/Pagination.tsx` ≥ 1
- **S5 上部 `PaginationSummary` の 7 画面ロールアウト**（`ListShell` を使わない全画面、L4-D5。各画面の「結果あり」分岐内、`<Table>` 直前に 1 行追加するだけの機械的変更）:
  - S5a 棚卸し `StocktakePage.tsx`（`items.length === 0` の EmptyState 分岐の else 側、`:822` の `<Table>` 直前）
  - S5b 在庫照会 `StockInquiryPage.tsx`（`data` 分岐内、`ProductListTable` 直前）
  - S5c 入出庫履歴 `InventoryRecordsPage.tsx`（`recordsQuery.data` 分岐内、`:333` の `<Table>` 直前）
  - S5d 在庫変動履歴 `StockMovementsPage.tsx`（`movementsQuery.data` 分岐内、`MovementTable` 直前）
  - S5e 操作ログ `OperationLogsPage.tsx`（`logsQuery.data.items.length > 0` 分岐内、`:496` の table wrapper 直前）
  - S5f 一括価格改定 `PriceRevisionPage.tsx`（`list.productsQuery.data` 分岐内、`PriceRevisionTable` 直前）
  - S5g 整合性チェック `IntegrityCheckPage.tsx`（`mismatches.length > 0` 分岐内、`:348` の table wrapper 直前）
  - 各画面とも `page`/`perPage`/`totalCount` は既存の下部 `<Pagination>` 呼出しと同じ値を渡す（新規 state 追加なし）。完了条件: 各 file で `rg -c "PaginationSummary" <file>` ≥ 1（起票時 0、商品一覧除く）かつ 0 件分岐（EmptyState 系）に新規 import が漏れ出していないこと（対応 test で確認）
- **S6 表示件数 `Select` の右端統一**（L4-D5 続き。5 画面は起票時実測で既に最後尾——変更不要——のため、実際の構造変更は 2 画面のみ）:
  - S6a 棚卸し `StocktakePage.tsx:752-778` の表示件数 `Select` ブロック（`:752-778`）を `:779-793` の未入力のみ表示 Checkbox ブロックより**後**へ並べ替える（JSX の子要素順の入替えのみ、ロジック変更なし）
  - S6b 一括価格改定: `PriceRevisionPage.tsx:67-96` の表示件数 `Select` ブロックを `PriceRevisionFilters.tsx` の filter 行（`:34-91`）へ**移設**し、その最後尾（`廃番を含む` チェックボックスの後）に配置する。`PriceRevisionFilters` に `perPage: number` / `onPerPageChange: (value: number) => void` prop を追加し、呼び出し元 `PriceRevisionPage.tsx` から現行の state/handler をそのまま渡す（新規 state 追加なし、配線の付け替えのみ）
  - 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ は起票時実測のとおり既に filter 行の最後尾のため変更不要（回帰確認のみ、L4-D5）
  - 完了条件: S6a は `StocktakePage.test.tsx` で DOM 順（Select が Checkbox の後）を新規 assert。S6b は `rg -n "price-revision-per-page" src/features/products/components/PriceRevisionFilters.tsx` ≥ 1（起票時 0）かつ `rg -n "price-revision-per-page" src/features/products/PriceRevisionPage.tsx` = 0（起票時 1、独立 Select 削除）
- **S7 DSR-22 の文言改訂**（`docs/design-system/01-decision-rules.md:429`、L4-D7）: 「上部の件数・現在位置 text と table header の sticky 化は、実表示が viewport を超えるときにだけ発動する（1 画面に収まる短い一覧では省略してよい。…）。上部は `PaginationSummary` で範囲付き統一形「全 {n} 件のうち {from}〜{to} 件を表示（{p} / {t} ページ）」の text 表示を必須、pager ボタンは任意（`Pagination` 下部と別 component）。下部は件数 + pager フル装備で、canonical は `Pagination`…」を「上部の件数・現在位置 text は `totalCount > 0` の一覧すべてで常に表示する（table header の sticky 化は引き続き `ListShell` の `stickyHeader` prop 採用画面のみ）。上部は `PaginationSummary` で範囲付き統一形「全 {n} 件のうち {from}〜{to} 件を表示（{p} / {t} ページ）」の text 表示のみを持ち、pager ボタンは置かない（`Pagination` 下部と別 component）。下部は `totalPages > 1` のときだけ、件数 + pager フル装備の `Pagination`（`src/components/patterns/Pagination.tsx`）を描画する…」へ改める。識別列固定の記述（同 `:429` 後半の mapping 表・E12 由来の「両立方式の probe」申し送り）は「Lane 4 で Contract Probe（CSS 仕様の静的確認）により不採用と確定、`identityColumns` prop は予約のまま維持する」を追記する。完了条件: `rg -Fn "実表示が viewport を超えるときにだけ発動する" docs/design-system/01-decision-rules.md` = 0（起票時 1）かつ `rg -Fn "totalCount > 0 の一覧すべてで常に表示する" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fn "pager ボタンは任意" docs/design-system/01-decision-rules.md` = 0（起票時 1）かつ `rg -Fn "pager ボタンは置かない" docs/design-system/01-decision-rules.md` ≥ 1
- **S8 catalog ⑩ ページネーションの改訂**（`docs/design-system/02-component-catalog.md:602-663`、L4-D8）: `:606` の説明文・`:608-641` の構造例（上部 variant の class を `text-base text-foreground` → `text-sm text-muted-foreground` へ）・`:645` 使用トークン節（上部 `PaginationSummary` の記述を下部と同じトークンへ）・`:653` アクセシビリティ節（上部/下部の同時描画前提の記述を「下部は複数ページ時のみ描画」へ）・`:658` Do 節（「viewport を超える一覧は上部にも…」→「一覧はすべて上部に…常に」）・`:663` Don't 節（現状の記述に「下部を単一ページで表示しない」を追加）を改訂する。完了条件: `rg -Fn "text-base text-foreground tabular-nums" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:612`）かつ `rg -Fn "text-sm text-muted-foreground tabular-nums" docs/design-system/02-component-catalog.md` ≥ 2 かつ `rg -Fn "viewport を超える一覧は上部にも" docs/design-system/02-component-catalog.md` = 0（起票時 1）
- **S9 catalog ⑯ 一覧の器の改訂**（`docs/design-system/02-component-catalog.md:896-926`、L4-D8 続き）: 項目 2（`:905`、「両者とも `totalCount > 0` のときだけ描画する」→「上部は `totalCount > 0` のとき常に、下部は `totalPages > 1` のときだけ描画する」）・項目 3（`:906`、「件数行と table の wrapper は `w-min min-w-full`（横 overflow 時に帯が table 幅へ追随、非 overflow 時は 100%）」→「件数行と table の wrapper は `w-full`（長文列の折返しにより table の内容幅は toolbar 幅を超えない、Lane 4 S1/S2）」）を改訂する。完了条件: `rg -Fn "両者とも \`totalCount > 0\` のときだけ描画する" docs/design-system/02-component-catalog.md` = 0（起票時 1）かつ `rg -Fn "w-min min-w-full（横 overflow 時に帯が table 幅へ追随" docs/design-system/02-component-catalog.md` = 0（起票時 1）かつ `rg -Fn "wrapper は \`w-full\`" docs/design-system/02-component-catalog.md` ≥ 1
- **S10 Plans.md ④ + Contract Coverage Ledger 記入**: 本 packet の active link を反映（本 commit で同時実施）。Contract Coverage Ledger は下記節を参照

## Non-scope

- 識別列固定（sticky）の実装、`identityColumns` prop の配線（Contract Probe で不採用確定、L4-D1〜D1 続き）
- 非 ListShell 7 画面の `ListShell` 化（frame class の直接適用のみ）
- `Playwright` devDep 追加（Plans.md ④ 旧記述を本 packet が supersede）
- R2-3 / R2-4（在庫照会）、badge 色・増減数値の色（⑦）、native `<select>` → shadcn `Select` 置換（⑧、R5-3）
- `StockMovementsPage.tsx:98` 商品情報 card（別 section、既存 `bg-card` のまま不変）
- `PriceRevisionTable.tsx` の入力欄列（新売価・新原価・確定ボタン）の最小幅縮小。狭幅・OS 125% 拡大時の残存水平 scroll は L4-D6 の residual risk として記録し、AC-L3-1 の対象 2 画面には含めない（商品一覧 + 操作ログ or 棚卸しを想定、Writer 実装後に owner と最終選定）

## Acceptance Criteria

- AC1: `ListShell.tsx` の sticky wrapper が `w-full` — `rg -Fn 'className="w-min min-w-full"' src/components/patterns/ListShell.tsx` = 0、`rg -Fn 'className="w-full"' src/components/patterns/ListShell.tsx` ≥ 1
- AC2: S2a〜S2f の長文列すべてで `whitespace-normal` が付き、旧 truncate/固定幅 class が 0 — 各 file 個別 `rg -Fn`（Scope S2 各 sub-item のとおり）
- AC3: S3a〜S3g の 7 画面すべてで枠が `rounded-lg border bg-card p-4` — 各 file 個別 `rg -Fn`（Scope S3 各 sub-item のとおり）
- AC4: `Pagination` が `totalPages <= 1` で何も描画しない、`totalPages > 1` では従来どおり描画する — 新規 vitest（`Pagination.test.tsx` 拡張、SC3a〜SC3c）。既存の「`totalCount === 0` は『0 件』を表示する」test は本変更で「`totalCount === 0` は null を描画する」へ書き換える（削除ではなく仕様変更としての更新、既存 test の無効化には当たらない）
- AC5: `PaginationSummary` が `text-sm text-muted-foreground` を持つ — `rg -Fn "text-base text-foreground tabular-nums" src/components/patterns/Pagination.tsx` = 0、`rg -c "text-sm text-muted-foreground tabular-nums" src/components/patterns/Pagination.tsx` ≥ 2
- AC6: 7 画面すべてで `totalCount > 0` の結果表示時に上部 `PaginationSummary` が描画される — 各 Page.test.tsx 新規 assertion（Scope S5 各 sub-item）
- AC7: 51 件 / perPage 50 のとき page 2 で「前へ」が有効表示される — `Pagination.test.tsx` 新規 edge test（SC3c）
- AC8: 表示件数 `Select` が 8 画面すべてで filter/toolbar 枠内の最後尾 — `StocktakePage.test.tsx`（DOM 順）、`PriceRevisionFilters.test.tsx` または `PriceRevisionPage.test.tsx`（配線先の変更）の新規 assertion。他 5 画面は既存 DOM 順が変わらないことを既存 test の pass 維持で確認（回帰）
- AC9: `ListShell.test.tsx` の既存 17 it が無変更のまま pass する — 回帰確認（S1 の wrapper 変更が sticky 関連 test に影響しないこと）
- AC10: DSR-22 の文言が新形へ更新される — Scope S7 の `rg -Fn` 完全一致検査
- AC11: catalog ⑩ の文言・構造例・トークン記述が新形へ更新される — Scope S8 の `rg -Fn` 完全一致検査
- AC12: catalog ⑯ 項目 2/3 の文言が新形へ更新される — Scope S9 の `rg -Fn` 完全一致検査
- AC-L3-1（owner Windows native L3）: 代表 2 画面（`ProductListPage.tsx` + `OperationLogsPage.tsx` or `StocktakePage.tsx`、Writer 実装後に確定）で窓を狭めても表が枠内に収まり長文列が折り返す
- AC-L3-2（owner Windows native L3）: `Pagination.tsx` の複数ページの画面 1 つで下部ページ送りが表示され、単一ページの画面 1 つで下部ページ送りが非表示になる（上部件数のみ残る）
- AC-L3-3（owner Windows native L3）: 表示件数 `Select` の位置と filter/toolbar 枠の地色が 8 画面で揃って見える
- AC-L3-4（owner Windows native L3、residual risk run）: 特大ウィンドウ × OS 表示倍率 125% で一括価格改定（`PriceRevisionTable`）の残存水平 scroll が許容範囲か確認する（Non-scope L4-D6 の確定材料、fail してもこの 1 点は Backlog へ）

## Design Sources

- Requirements / spec: 該当なし（新規 REQ 追加なし）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の class/component 構成変更のみ）
- Function / command / DTO: 該当なし
- DB: 変更なし
- Screen / UI: `docs/design-system/00-foundations.md`（`--card` #f5f5f4、変更なし・正本参照のみ）/ `docs/design-system/01-decision-rules.md` DSR-17（`:292`、`<main>` 単一 scroll 契約、参照のみ）/ DSR-22（`:429`、S7 で改訂）/ `docs/design-system/02-component-catalog.md` ⑩ ページネーション（S8）/ ⑯ 一覧の器（S9）
- Decision log / ADR: `docs/decision-log.md` D-074（Stacked train）/ D-079（UI 視覚系 change の座組）。本 lane は owner 決定（Plans.md ④ R2-1/R2-2/R3-2/R5-2/R5-4、E12）の執行であり新規 durable decision の追加はない（L4-D1〜D8 は packet 止まりの実装判断）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | — | 該当なし |
| Command / DTO / generated binding / wire shape | — | 該当なし |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-22、`02-component-catalog.md` ⑩/⑯ | updated in this PR（S7/S8/S9） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | 既存 D-074/D-079 の座組を踏襲、新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 新規 REQ 追加なし。既存 test file への assertion 拡張のみで新規 test file は作成しない予定（S1〜S6 はいずれも既存 Page/Component test の拡張）。`generate_traceability` の `FE_UNREFERENCED_BASELINE`（`generate_traceability.rs:48`、現在 24）は新規 test file を追加しない限り再生成不要。Writer が実装中に新規 test file が必要と判断した場合（例: `PriceRevisionFilters.test.tsx` が未存在なら新設が必要）は Lane 5 L5-D6 の先例（画面非依存の shared UI primitive の class 契約 test は REQ/UI ID を付けない）に従い baseline を更新し、gated amendment として記録する |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | 起票時実測「識別列 sticky（E12 案）が Non-scope である技術的根拠」節 | L4-D1（2026-09-05） | E12 が示した横 scroll 容器 + 識別列 sticky 案は、CSS の overflow 計算規則（`overflow-x: auto` は `overflow-y` を `auto` へ computed する）により当該容器を独立 scrolling ancestor に変え、DSR-17 `:292` の「`<main>` が唯一の scroll container」契約と衝突し `ListShell` の sticky thead（`<main>` 相対）と両立しない。この結論は CSS 仕様から静的に導けるため Playwright/headless probe は不要（Contract Probe = 本節記述、N/A）。owner は D（表を縮ませる）を選定し、E12 案は不採用 | なし（Non-scope 確定） | 該当なし |
| — | 起票時実測「ListShell / table primitive の overflow 機構」節 | L4-D2（2026-09-05） | 出っ張りは `ListShell.tsx:99` の `w-min min-w-full` wrapper が overflow-visible な子と組み合わさって親幅を超えて広がることが直接原因。是正は wrapper を `w-full` に戻し、長文列を折り返させて内容幅そのものを縮める（sticky の `overflow-visible`/`<main>` 相対指定は変更不要） | `ListShell.tsx`、8 画面の長文列 | S1/S2 各新規 assertion |
| — | Plans.md ④ R5-4 owner 決定 | L4-D3（2026-09-05） | owner は「既存 `--card` #f5f5f4 に統一、新規 token なし」を明示（R5-4 sub-bullet の `--list-toolbar`（仮）token 案は旧案として本 packet が supersede する）。理由は既存 toolbar 枠（商品一覧）との統一で追加の視覚差分を持ち込まないこと | 7 画面の filter/toolbar 枠 | S3 各新規 assertion |
| — | Plans.md ④ R2-1 owner 決定 | L4-D4（2026-09-05） | 上部は常時表示・ボタンなし、下部は複数ページ時のみという上下非対称の設計は、Q12 §1「初心者ほど操作体系はシンプルなほうがよい」（DSR-22 Why 既存引用）を単一ページ時にも徹底したもの。共有 component（`Pagination.tsx`）1 箇所の修正で 8 画面全 caller に反映する設計を採る（owner「呼出し元を直せば一気に全部変わる設計」選好、Lane 3 flag 是正の先例と同型） | `Pagination.tsx` | S4 新規 assertion（SC3a〜SC3c、SC4） |
| — | Plans.md ④ R5-2 owner 決定 | L4-D5（2026-09-05） | 表示件数 Select は toolbar 枠内の右端に統一。起票時実測で 5/7 画面は既に最後尾のため、構造変更が必要なのは棚卸し（reorder）と一括価格改定（Filters への移設 + prop 配線）のみ。既に条件を満たす画面まで無用に書き換えない（ponytail: 既に満たす契約への追加変更は避ける） | `StocktakePage.tsx`、`PriceRevisionFilters.tsx`/`PriceRevisionPage.tsx` | S6 新規 assertion |
| — | 起票時実測「PriceRevisionTable」節 | L4-D6（2026-09-05） | `PriceRevisionTable.tsx` は行ごとに新売価・新原価の数値入力欄 + 確定ボタンを持ち、各列に実用上の最小幅（`min-w-32`×2 + `min-w-44`）がある。これらを縮めると入力操作性が損なわれるため対象外とし、固定 `min-w-[1280px]` の撤去（表全体が不要に広がる分だけ縮む）と商品名列の折返しに限定する。残存する水平 scroll は AC-L3-4 で owner が許容可否を判定する residual risk として扱う | なし（Non-scope、残存 scroll は容認候補） | AC-L3-4（L3 のみ） |
| — | `01-decision-rules.md` DSR-22 / `02-component-catalog.md` ⑩⑯ | L4-D7〜D8（2026-09-05） | S7/S8/S9 の文言改訂は実装（S1〜S6）に一致させる事後同期であり、新規ルールの追加ではない | 3 doc | S7/S8/S9 の `rg` 完全一致検査 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 packet の「起票時実測」節が値・機序・理由の一次情報。実装後は S7〜S9 で DSR-22/catalog へ反映し packet 依存を解消する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし。L4-D1〜D8 は実装詳細の Coordinator 判断のため packet 止まりでよい（owner 決定 R2-1/R5-2/R5-4/E12 は既に Plans.md ④ に記録済み）
- Assumptions and constraints: 8 画面の対象範囲・長文列の列挙・枠地色の対象は起票時実測で確定。Plan Review はこの境界線（特に `PriceRevisionTable` の residual risk 扱い）の妥当性を検査する
- Deferred design gaps, risk, and follow-up target: `PriceRevisionTable` の残存水平 scroll（L4-D6）、識別列 sticky の恒久不採用（L4-D1、`identityColumns` prop は削除せず予約のまま）
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-list-backbone-d-lane4.md) 各行に L4-D 番号か DSR-22/catalog 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は `PriceRevisionTable` 入力欄列の最小幅（L4-D6、明示的 residual risk）と `StockMovementsPage.tsx:98` 商品情報 card（別 section、不変）のみ。すべて起票時実測で列挙し、抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の class/component 構成変更のみ | — |
| Fact check / design decision split | 適用: Plans.md ④ R2-1 の「在庫照会で観測」claim を実コードで再確認し、現状は該当挙動が存在しないことを確認（起票時実測節） | 起票時実測「Plans.md ④ の記録済み claim の訂正」 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 8 画面の表・ページ送り・表示件数配置・枠地色が変わる。owner L3 で確認（AC-L3-1〜4） | AC-L3-1〜4 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜4） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし。Playwright 等の新規依存は追加しない（Non-scope） | — |

## Design Readiness

- Existing design docs are sufficient because: DSR-17（`<main>` 単一 scroll）/ DSR-22（一覧の器の適用条件）/ catalog ⑩⑯ は Lane 2〜5 で正本化済み。本 lane は既存契約の適用条件を owner 決定に合わせて改訂する（S7〜S9）のみで、新規 token・新規 component は追加しない
- Source docs updated in this PR: `01-decision-rules.md` DSR-22（S7）/ `02-component-catalog.md` ⑩⑯（S8/S9）
- Design gaps intentionally deferred: `PriceRevisionTable` の残存水平 scroll（L4-D6、owner L3 の許容可否判定待ち）
- Durable decisions discovered in this plan and promoted to source docs: なし（既存 owner 決定の執行）
- **識別列 sticky 不採用の記録**（Design Readiness 固有の記載事項）: E12 が提案した「横 scroll 容器 + 識別列 sticky」の両立方式は、DSR-17 の `<main>` 単一 scroll契約と CSS の overflow 計算規則（`overflow-x: auto` は `overflow-y` を `auto` へ computed し、独立 scrolling ancestor を作る）から静的に導ける矛盾により Contract Probe（追加実験なし）で不採用と確定した。`ListShell.tsx` の `identityColumns` prop は Lane 2 からの予約状態のまま維持し、削除しない（将来 DSR-22 の mapping 表が使われる可能性を閉じないため）

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の class/component 構成変更のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言変更なし（件数文言そのものは Lane 3 で確定済み）、見た目（幅・折返し・枠・配置）のみ
- Error, empty, retry, and recovery behavior: `Pagination` の `totalPages<=1` null 化は EmptyState 分岐（既存、totalCount===0 は先に EmptyState で処理される）と重複しない副作用のみ。既存の error/empty/loading 分岐は不変
- Testability and traceability IDs: 新規 REQ 追加なし

## Contract Probe

- E12 の「横 scroll 容器 + 識別列 sticky」両立可否: 起票時実測「識別列 sticky（E12 案）が Non-scope である技術的根拠」節に記載の CSS 仕様（overflow-x/overflow-y の computed 規則）と DSR-17 `:292` の `<main>` 単一 scroll 契約から静的に導出。追加実験不要（N/A、Playwright/headless Chromium は使わない）
- `ListShell` sticky thead の `top` 基準が `w-full` wrapper への変更後も `<main>` 相対のまま保たれるという前提: `STICKY_TABLE_CLASSES`（`ListShell.tsx:40-63`）の `overflow-visible`/`sticky`/`top` 指定は wrapper の width 指定（`w-min min-w-full` → `w-full`）と独立した別 class 群であり、wrapper の width 変更はこれらに影響しない（静的コード確認、追加実験不要、N/A）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| L4-D1 識別列 sticky 不採用（owner D 決定） | なし（Non-scope 確定） | 該当なし | non-scope |
| S1 ListShell wrapper `w-full`（L4-D2） | `ListShell.tsx` | `ListShell.test.tsx` 拡張（SC1） | AC-L3-1 |
| S2a〜S2f 長文列 whitespace-normal（L4-D2） | 6 file | 各 Page/Component test 拡張（SC2a〜SC2f） | AC-L3-1 |
| S3a〜S3g 枠地色 bg-card 統一（L4-D3） | 7 file | 各 Page/Component test 拡張（SC6a〜SC6g） | AC-L3-3 |
| S4 Pagination 上下切り分け（L4-D4） | `Pagination.tsx` | `Pagination.test.tsx` 拡張（SC3a〜SC3c、SC4） | AC-L3-2 |
| S5a〜S5g 上部 summary ロールアウト（L4-D4） | 7 file | 各 Page test 拡張（SC5a〜SC5g） | AC-L3-2 |
| S6a〜S6b Select 右端統一（L4-D5） | `StocktakePage.tsx`、`PriceRevisionFilters.tsx`/`PriceRevisionPage.tsx` | 各 test 拡張（SC7a〜SC7b） | AC-L3-3 |
| L4-D6 PriceRevisionTable 残存 scroll（residual risk） | `PriceRevisionTable.tsx`（`min-w-[1280px]` 撤去のみ） | S2f の assertion | AC-L3-4（residual） |
| S7 DSR-22 改訂（L4-D7） | `docs/design-system/01-decision-rules.md` | 該当なし（docs review） | non-scope |
| S8 catalog ⑩ 改訂（L4-D8） | `docs/design-system/02-component-catalog.md` | 該当なし（docs review） | non-scope |
| S9 catalog ⑯ 改訂（L4-D8） | `docs/design-system/02-component-catalog.md` | 該当なし（docs review） | non-scope |

## 実装原則（ponytail、full）

書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（`<input type="date">`、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。

本 lane での適用例: S4 は `Pagination.tsx` 1 箇所の修正で 8 画面全 caller に反映する（画面ごとに個別ロジックを複製しない）。S6 は起票時実測で既に条件を満たす 5 画面には触れず、満たさない 2 画面のみを直す（満たしている契約への冗長な書き換えをしない）。S2/S3 は class 文字列の張替えのみで新規 component を作らない。

## Test Plan

Test Design Matrix: [test-matrices/2026-09-05-ui-list-backbone-d-lane4.md](test-matrices/2026-09-05-ui-list-backbone-d-lane4.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（本 lane は frontend のみだが release check の慣行は維持する）。

- targeted tests: 8 画面 + `Pagination`/`ListShell` の class・DOM 順・条件分岐 assertion（既存 test file の拡張が中心、新規 test file は原則追加しない）
- negative tests: `totalPages <= 1`（0 件含む）で `Pagination` が描画されないことの対照 case、EmptyState 分岐で新規 `PaginationSummary` が誤って描画されないことの対照 case
- compatibility checks: `ListShell.test.tsx` 既存 17 it が pass のまま（AC9）、`Pagination.test.tsx` の「0 件」表示 test は仕様変更として更新（削除ではない）
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: `PriceRevisionFilters` への perPage prop 追加が `PriceRevisionPage.tsx` の既存 state/handler と正しく配線されること（S6b）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（class 文字列・component 構成・条件分岐の変更のみ）。

## Review Focus

- `ListShell.tsx:99` の wrapper 変更（S1）が sticky thead の `<main>` 相対 top 基準を壊していないこと（`ListShell.test.tsx` SC4d/SC8/SC10 の回帰）
- 長文列の折返し（S2）が対象列を過不足なく捉えていること（数値・日付・状態列に誤って `whitespace-normal` を適用していないこと）
- `Pagination.tsx` の `totalPages <= 1` null 化（S4）が `totalCount === 0` の既存契約（EmptyState 分岐が先に処理する前提）と矛盾しないこと
- 上部 `PaginationSummary` ロールアウト（S5）が EmptyState / エラー / ローディング分岐に誤って描画されないこと
- `PriceRevisionFilters` への perPage 移設（S6b）が既存の `patchSearch`/`scrollPageToTop` 呼出しを壊していないこと
- Non-scope（識別列 sticky、`StockMovementsPage.tsx:98`、`PriceRevisionTable` 入力欄最小幅）に列挙した項目が変更されていないこと

## Spec Contract

Contract ID: SPEC-UILB-D6

- 8 一覧画面の表が窓を狭めても filter/toolbar 枠の幅を超えて出っ張らず長文列が折り返し、ページ送りが上部常時表示（ボタンなし）・下部複数ページ限定へ切り分けられ、表示件数 `Select` の位置と filter/toolbar 枠の地色（既存 `--card`）が 8 画面で統一される

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UILB-D6 | S1 | `ListShell.test.tsx` 拡張（SC1） | sticky wrapper 幅 | vitest |
| SPEC-UILB-D6 | S2a〜S2f | 各 Page/Component test 拡張（SC2a〜SC2f） | 長文列の折返し | vitest |
| SPEC-UILB-D6 | S3a〜S3g | 各 Page/Component test 拡張（SC6a〜SC6g） | 枠地色 | vitest |
| SPEC-UILB-D6 | S4 | `Pagination.test.tsx` 拡張（SC3a〜SC3c、SC4） | 上下切り分け | vitest |
| SPEC-UILB-D6 | S5a〜S5g | 各 Page test 拡張（SC5a〜SC5g） | 上部 summary 常時表示 | vitest |
| SPEC-UILB-D6 | S6a〜S6b | 各 test 拡張（SC7a〜SC7b） | Select 右端統一 | vitest |
| SPEC-UILB-D6 | S7〜S9 | docs review（自動テストなし） | DSR-22/catalog ⑩⑯ の記述一致 | `rg` 完全一致 |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし

## Implementation Results

（Writer 実装後に記入。plan-draft 時点では未記入）

## Review Response

（plan-draft 時点、Plan Review 未実施）

- Findings Freeze: not yet frozen（Plan Review 未実施のため）; post-freeze exceptions: none.
