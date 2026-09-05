# Plan Packet: UI 一覧の背骨 D — Lane 4（表を縮ませる / ページ送りの上下切り分け / 表示件数の位置統一 / 枠の地色）

owner 決定（2026-09-05、[Plans.md ④](../Plans.md) R2-1/R2-2/R3-2/R5-2/R5-4 各 sub-bullet + E12、`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md:95,109,145`）に基づき、「窓を狭めると表が枠から出っ張る」現象を識別列 sticky ではなく表そのものを縮ませる方式（D）で解消し、ページ送りの上下帯を「上部は常時表示・ボタンなし」「下部は複数ページ時のみ」へ切り分け、表示件数 `Select` の位置と filter/toolbar 枠の地色を 8 画面で統一する。E12 が示した「横 scroll 容器 + 識別列 sticky」案は、DSR-17 `<main>` 単一 scroll 契約と CSS の overflow 計算規則から Contract Probe（Playwright 不要）で不採用と確定し、`ListShell` の `identityColumns` prop は引き続き未使用のまま予約する。

**Plan Review round 1（独立 Sonnet subagent + Opus 5 read-only claims-producer、D-056）は reject**。Coordinator が P1 を実装・既存 test に対して裏取りし、本 packet（plan-draft 差し戻し是正）へ反映した。要点: (1) `ListShell.tsx:99` の `w-min min-w-full` wrapper は撤去しない——Lane 2 追補 S17（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`）が横 overflow 時に summary 帯を table 幅へ追随させるために導入し、owner が AC-L3-2 で確認済み、`ListShell.test.tsx:343` が `className` の完全一致で保護している。是正は wrapper を触らず、対象列の折返しで min-content の床を下げること。(2) 表を縮ませる対象は**商品一覧 `ProductTable.tsx` のみ**——`stickyHeader` を採用するのは `ProductListPage.tsx:284` だけであり、他 7 画面は `table.tsx:9` の `overflow-x-auto` で内部 scroll するため page 地へ出っ張ることは無い。詳細は「起票時実測」節と `## Review Response` を参照。**round 2（Opus 5）も reject**（並行した Sonnet round 2 は rate limit で中断、Workflow State の妥当性検証のみ完了）: 上部 summary 導入に伴う既存 test の重複文言破綻・SC7b の配線退行 oracle・catalog 旧文言の対句・在庫照会の上部 summary 条件・整合性チェックの frame 除外・table wrapper の rounded-lg 統一・範囲外 page の検知漏れを指摘、いずれも本 commit（第 1 便）で反映済み。item (1) 折返しの効果と floor 概算（Opus #1/#3/#4）は owner 決定待ちのため第 2 便で扱う。

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
- Human Gate: owner Windows native L3 — AC-L3-1 窓を狭めても商品一覧の表が枠内に収まり部門列が折り返す, AC-L3-2 ページ送り上下（複数ページの画面 1 つ + 単一ページの画面 1 つ）, AC-L3-3 表示件数 Select の位置と枠の地色が 6 画面で揃う（整合性チェックの単独 Select は対象外、下記 S1 参照）

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
8 一覧画面（商品一覧 / 棚卸し / 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ / 一括価格改定 / 整合性チェック）の operator workflow に見える見た目変更（商品一覧の表の折返し、ページ送りの上下帯構成、表示件数 `Select` の位置、filter/toolbar 枠の地色）+ 共有 UI primitive（`Pagination`/`PaginationSummary`、Button/Badge と並ぶ widely-shared component）の contract 変更。DB スキーマ・Tauri command DTO・POS CSV・PLU TSV 形式の変更はない。DEV_WORKFLOW Risk Tiers の R3「route/search state, operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

**Stacked train（D-074、AGENT_OPERATING_MANUAL §3.3 Stacked train 節）**: 本 branch は Lane 5（`agent/ui-list-backbone-d-lane5`、Draft PR #35、human-confirm 中、tip `04f89a4`）から作成した（`InventoryRecordsPage.tsx` / `StockMovementsPage.tsx` / `PriceRevisionFilters.tsx` / `OperationLogsPage.tsx` / `button.tsx`/`badge.tsx` が Lane 5 と重なるため main 起点では衝突する）。Coordinator は本 packet の plan-approved 前に、branch を lane ⑧（`agent/ui-select-unify`、native `<select>` 23 箇所 → shadcn `Select` 置換、Lane 5 merge 後起票）の tip へ単段 merge で付け替える予定（merge train: Lane 5 → ⑧ → Lane 4）。Lane 5 が先に merge された場合は旧 tip を保存してから最新 `origin/main` を 1 回だけ merge する。rebase はしない（D-039 / PK5「Plan Commit ancestry」）。付け替え後の merge delta が実装 file に触れる場合は、その delta を独立に再検証（対象 test の再実行 + Final Reviewer による差分実読）してから Phase を進める。forward state-only は本 lane 自身で 1 本（human-confirm → ready-hosted-final）に抑え、他の遷移は content commit 同乗で行う（D-074 rules、no rebase、forward state-only budget 1）。

## Goal

Goal Invariant:

### 最小完了条件

- 商品一覧で、窓を狭めても表が toolbar 枠の幅を越えて出っ張らない（部門列が折り返す。Lane 2 の「横 overflow 時に summary 帯が table 幅へ追随する」挙動自体は不変・維持）
- 上部に `PaginationSummary`（範囲付き統一形、`text-sm text-muted-foreground`、ボタンなし）が `totalCount > 0` のとき常に表示される（`ListShell` の 1 画面 + 新規 7 画面）
- 下部 `Pagination`（summary + 前へ/次へ）は `totalPages > 1` のときだけ表示され、`totalPages <= 1`（0 件を含む）では何も描画しない
- 表示件数 `Select` が 8 画面すべてで toolbar/filter 枠内の最後尾（右端）に位置する
- 検索欄・取引先・部門などを囲む filter/toolbar 枠の地色が 8 画面すべてで既存 `--card` #f5f5f4 に統一される（新規 token なし）

### 失敗定義

- 商品一覧で窓を狭めたときに表が枠外へ出っ張る、または部門列が折り返さず横 scroll のみに依存したままになる
- 他 7 画面の table 幅・長文列に不要な変更を加えてしまう（Non-scope 逸脱、7 画面は内部 `overflow-x-auto` scroll のため元々 bleed しない）
- 上部 summary が 7 画面のいずれかで欠落する、または `totalCount === 0` の場面で誤って描画される、または新規追加により既存の件数文言 assertion（`getByText` 単数一致）が壊れたまま放置される
- 下部 `Pagination` が単一ページで描画される、または複数ページで誤って非表示になる（51 件 / perPage 50 の 2 ページ目で「前へ」が消える等）
- 表示件数 `Select` が 8 画面のいずれかで枠外、または枠内の最後尾以外に残る
- 8 画面のいずれかで枠地色が `bg-card` にならない、または新規 token を追加してしまう
- `identityColumns` sticky 経路の実装に着手してしまう、または `ListShell.tsx:99` の wrapper を撤去・変更してしまう（Non-scope 逸脱）

### 非目的

- `ListShell.tsx:99` の `w-min min-w-full` wrapper の撤去・変更（Plan Review round 1 で reject、Lane 2 追補 S17 の既存挙動を維持する）
- 識別列固定（sticky）の実装。DSR-22 `identityColumns` prop は予約のまま維持し、`ListShell` へ配線しない
- 商品一覧以外の 7 画面（棚卸し / 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ / 一括価格改定 / 整合性チェック）の table 幅・長文列の変更。いずれも `stickyHeader` を使わず `table.tsx:9` の `overflow-x-auto` で内部 scroll するため、窓を狭めても page 地へ出っ張ることはない（Plan Review round 1 で確定した scope 縮小）
- 非 ListShell 画面を `ListShell` 化すること（frame class は直接適用し、component 差し替えは行わない）
- `Playwright` の devDep 追加（Plans.md ④ の旧記述はこの packet が supersede する。probe は CSS 仕様の静的確認のみで足り、headless browser は不要）
- R2-3 / R2-4（在庫照会の展開行再クリック・検索条件追加）、badge 色（⑦）、native `<select>` → shadcn `Select` 置換（⑧）
- `StockMovementsPage.tsx:98` の商品情報 card（既存 `rounded-lg border bg-card p-4`、本 lane の filter 枠とは無関係の別 section）への変更
- `PriceRevisionTable.tsx` の商品名・table 幅・入力欄の変更全般（Non-scope に縮小。7 画面の table 幅変更を全体で不採用としたことに伴い、当初想定していた `min-w-[1280px]` 撤去・商品名折返しも取り下げる。旧 L4-D6 の residual risk 記録は削除し、狭幅時の水平 scroll はそもそも内部 scroll として現状のまま許容する）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、worktree base `04f89a4`〈Lane 5 branch tip、Draft PR #35 human-confirm 中〉、すべて本 packet 起草者が rg で再確認。行番号は Lane 5 実装後の現行値であり、Plans.md ④ の R2-1〜R5-4 起草時点の行番号とは異なる。Plan Review round 1/2 是正で本節を全面改訂）

### ListShell / table primitive の overflow 機構（出っ張りの機序、round 1 是正版）

- `table.tsx:9` の `Table` container は `relative w-full overflow-x-auto`（data-slot=table-container）。通常の非 sticky 画面ではこの `overflow-x-auto` が横 overflow 時に**内部スクロールバー**を出し、page 地には出っ張らない（7 画面はこの経路のみで、本 lane の対象外）
- `ListShell.tsx` の `STICKY_TABLE_CLASSES`（`:40-63`）は sticky 時に `[&_[data-slot=table-container]]:overflow-visible` でこの内部スクロールを打ち消す（sticky thead の `top` 基準を `<main>` に保つため。DSR-17 `:292` が `<main>` を唯一の scroll container と定める契約に従う設計）
- `ListShell.tsx:99` の帯+table wrapper `<div className="w-min min-w-full">` は Lane 2 追補 S17（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`）で導入された。`w-min` = `width: min-content`、`min-w-full` = `min-width: 100%` であり、CSS の `width`/`min-width` 解決規則により実効幅は **`max(内容の min-content, 親幅 100%)`** になる（`min-width` が `width` を下回らせない）。すなわち: 内容の min-content が親幅以下なら wrapper は親幅 100%（帯が toolbar 幅に一致）、内容の min-content が親幅を超えたときだけ wrapper がその min-content 幅まで広がり、overflow-visible な子と組み合わさって `<main>` へ余分な横幅を持ち込む——これが「toolbar は縮むのに下の list が右へ出っ張る」（owner E12 原文）の機序
- **Lane 2 の意図は正しく機能している**: 横 overflow が実際に生じている間、帯（summary band）が table の内容幅へ追随して同じ右端に揃うのは、`owner` が AC-L3-2（Lane 2 L3）で確認済みの**望ましい**挙動であり、`ListShell.test.tsx:343`（`expect(wrapper?.className).toBe("w-min min-w-full")`）が `className` の完全一致で回帰を防いでいる。Plan Review round 1 の Opus P1 はこの点を指摘し、当初案（wrapper を `w-full` に固定）が Lane 2 の contract を破壊すると判定した——**accept**
- **是正の要点（round 1 是正）**: wrapper には触れない。出っ張りは「内容の min-content が親幅を超えている」間だけ起きるので、対象列（商品一覧の部門列）を折り返させて min-content の床（floor）を下げ、出っ張りが発生する窓幅の下限を狭める。床を下回るまで窓を狭めれば、Lane 2 の想定どおり帯が table 幅へ追随する——それは bleed ではなく仕様どおりの追随であり、本 lane の失敗定義には含めない

### 表を縮ませる対象は商品一覧 `ProductTable.tsx` のみである根拠（round 1 是正）

- `stickyHeader` prop を渡す `ListShell` caller は `ProductListPage.tsx:284` の 1 画面のみ（`rg -n "stickyHeader" src/features --glob '!*.test.*'` で確認、他 7 画面はいずれも `ListShell` を使わない）
- 他 7 画面はすべて `table.tsx:9` の `overflow-x-auto`（`overflow-visible` の上書きなし）が有効なままのため、内容が幅を超えても内部スクロールバーで吸収され、page 地への出っ張りは発生しない。したがって「窓を狭めると出っ張る」症状は商品一覧固有であり、Plan Review round 1 の Opus P1（他 7 画面への長文列折返し・table 幅撤去は Non-scope）を **accept** し、旧 S2b〜S2f（棚卸し / 在庫照会 / 整合性チェック / 在庫変動履歴 / 操作ログ / 一括価格改定）を撤回する

### `ProductTable.tsx` 列監査（floor 対象の特定、round 1 是正で新規追加）

| 列 | 現 class（`ProductTable.tsx`） | floor への寄与 | 本 lane の扱い |
|---|---|---|---|
| 商品コード（`:52`） | `font-mono text-sm font-medium`（既定 nowrap） | 小（短い mono code） | 不変（nowrap 維持） |
| 商品名（`:53-61`） | `min-w-[14rem] whitespace-normal`（対応済み、Badge 「廃番」+ JAN 行を内包） | `min-w-[14rem]`＝224px に固定（折返し済みで無制限に伸びない） | 不変（既に対応済み、Lane 2 で実装） |
| 部門（`:62`） | `<TableCell>{item.department_name}</TableCell>`（class なし＝既定 nowrap） | **大**（部門名の全文字数だけ横幅を要求、店の部門名は 2〜6 文字程度だが nowrap のため 1 行分の実測幅がそのまま floor になる） | **本 lane で `whitespace-normal` を付与**（唯一の変更対象） |
| 売価・原価・在庫数（`:63-71`） | `text-right tabular-nums`（既定 nowrap） | 小〜中（数値 3 列、桁数は固定長に近い） | 不変（数値は折返し不可、Coordinator が明示的に nowrap 維持を選択） |
| PLU（`:72-89`） | `Badge`（`gap-1 whitespace-nowrap`、対象外/未反映/反映済みの 3 状態） | 中（badge 自体は短い固定文言 + icon） | 不変（badge は意味的に 1 行で示す部品のため折返し対象にしない） |
| 操作（`:90-100`） | `text-right`、`Button size="sm"`「修正」 | 小 | 不変（ボタン文言は折返し対象にしない） |

- **floor の概算（プランニング目的の概算、ブラウザ実測ではない。AC-L3-1 の owner 実機確認が唯一の正式な oracle）**: 各 cell は `table.tsx:69-79` の `p-2`（padding 8px×2＝16px）を共通で持つ。商品コード ≈ 100px（mono 10 文字 + padding）、商品名 ≈ 224px（`min-w-[14rem]` で固定、折返し済み）、部門 ≈ 折返し後は 1 行あたり最短で成立する幅（Tailwind の `whitespace-normal` は追加の `min-w`/`max-w` を伴わない限り parent の空き幅まで縮む——本 lane では新規 `min-w-*` を追加しない、Opus P2 準拠）、売価/原価/在庫数 ≈ 75px×3＝225px（¥7桁程度の tabular-nums）、PLU ≈ 106px（badge + icon + padding）、操作 ≈ 80px（sm button + padding）。部門列を折返し可能にした後の table 全体の min-content floor は概算で **≈ 730〜760px**（部門列の折返し後の最小幅を 1 文字分＋padding ≈ 30〜40px として計算、対して現状（部門 nowrap）は部門名の長さ次第で floor が青天井に伸びうる）。RootLayout のサイドバー幅・page 余白（`RootLayout.tsx`、概算 240〜280px）を足すと、出っ張りが解消する窓幅のおおよその下限は **≈ 980〜1050px 程度**と見積もる。この数値は Writer 実装時・Plan Review・AC-L3-1 の owner 実機確認で置き換えられる暫定値であり、packet はこれをピクセル契約として固定しない
- **AC-L3-1 の運用**: 商品一覧を上記の概算下限幅（またはそれ以下）まで窓を狭め、表が枠内に収まり部門列が折り返すことを owner が確認する。他 7 画面は Non-scope のため AC-L3-1 の対象に含めない

### 識別列 sticky（E12 案）が Non-scope である技術的根拠（Contract Probe、Playwright 不要、変更なし）

- CSS Overflow の仕様上、要素の `overflow-x` と `overflow-y` の一方が `visible` 以外（例: `auto`）のとき、`visible` のままのもう一方は `auto` へ computed される（2 軸を跨ぐスクロールは意味を持たないため）。したがって「表を横 scroll 容器（`overflow-x: auto`）に包む」設計は、その要素を**縦方向にもスクロール可能な独立 scrolling ancestor**に変える
- DSR-17 `:292` は `<main>`（`RootLayout.tsx`）を route content の唯一の scroll container と定める。`position: sticky` の `top` オフセットは最近傍の scrolling ancestor を基準にするため、横 scroll 容器を挟むと sticky thead の基準が `<main>` からその容器へ切り替わり、`ListShell` が前提とする `<main>` 相対の sticky 挙動（DSR-22 の sticky header）と両立しない
- この帰結は CSS 仕様から静的に導けるため、Playwright / headless Chromium での実行時 probe は不要（Contract Probe = 本節の記述そのもの、追加実験なし、N/A）。E12 が示唆した「両立方式の probe」（`01-decision-rules.md:429` 末尾の申し送り）はこの結論をもって**不採用**とし、`identityColumns` prop は Lane 2 からの予約状態のまま維持する

### 8 画面の frame / perPage Select / pagination 現況サーベイ（table 幅・長文列列は商品一覧のみ対象のため列を割愛）

| 画面 | perPage Select 位置 | filter/toolbar 枠（現状） | 上部 summary | 下部 pager 条件（現状） |
|---|---|---|---|---|
| 商品一覧（`ProductListPage.tsx`） | `toolbarSecondary`（`:186-211`）内、並び替え Select・SegmentedControl の後 | `ListShell.tsx:88` `rounded-lg border bg-card p-4`（reference） | あり（`topSummary` prop、`totalCount>0`） | `hasResults`（`totalCount>0`）のみ、`totalPages` 非考慮 |
| 棚卸し（`StocktakePage.tsx`） | `:752-778` filter 行内、部門 Filter の後・未入力のみ Checkbox の**前**（最後尾でない） | `:742` 枠なし（`<div className="flex flex-wrap items-center gap-4">`） | なし | 無条件（`<fieldset><Pagination/></fieldset>`、`:854-863`） |
| 在庫照会（`StockInquiryPage.tsx`） | `:131-156` filter 行内、SearchBar・DepartmentFilter の後＝既に最後尾 | `:102` 枠なし | なし | `statusValue === "all"` かつ `totalCount !== null` のときのみ（`totalPages` 非考慮、`:234-243`） |
| 入出庫履歴（`InventoryRecordsPage.tsx`） | `:272-297` filter 行内、6 native 入力欄の後＝既に最後尾 | `:159` `rounded-md border p-4`（bg なし） | なし | 無条件（`recordsQuery.data` があれば、`:387-394`） |
| 在庫変動履歴（`StockMovementsPage.tsx`） | `:185-210` filter 行内、開始日・終了日・種別の後＝既に最後尾 | `:134` 枠なし（`:98` の商品情報 card は別 section、Non-scope） | なし | 無条件（`movementsQuery.data` があれば、`:243-250`） |
| 操作ログ（`OperationLogsPage.tsx`） | `:398-423` filter 行内、開始日・終了日・種別の後＝既に最後尾 | `:344` `rounded-md border p-4`（bg なし） | なし | 無条件（`logsQuery.data.items.length > 0`、`:558-564`） |
| 一括価格改定（`PriceRevisionPage.tsx` + `PriceRevisionFilters.tsx`） | `PriceRevisionPage.tsx:67-96`、`PriceRevisionFilters` の**外**・独立 div（枠外） | `PriceRevisionFilters.tsx:33` `rounded-md border bg-stone-50 p-4` | なし | 無条件（`list.productsQuery.data` があれば、`:168-175`） |
| 整合性チェック（`IntegrityCheckPage.tsx`） | `:234-264` 単独 div、他 filter なし | `:234` 枠なし | なし | 無条件（`mismatches.length > 0` 分岐内、`:417-422`） |

- **Plans.md ④ の記録済み claim の訂正**（記憶ルール「記録済み claim も起草時実測」準拠）: R2-1 sub-bullet（`Plans.md:82`）は「単一ページ時は下部行ごと非表示、在庫照会で観測」と記す。実コード確認では在庫照会の `<Pagination>` は `statusValue === "all"` でのみ描画され、`totalPages` は判定に使われていない（`StockInquiryPage.tsx:234`）。「単一ページで非表示になる」経路は現状存在せず、本 packet は Plans.md の記述を実装事実としては採用しない（S2 で `totalPages <= 1` gating を新規に `Pagination.tsx` 側へ実装することで、結果として在庫照会を含む 8 画面すべてに同じ挙動を持たせる）
- **ListShell.test.tsx の it 数訂正**: 発注時想定「16 it」に対し実測 17 it（`rg -c '\bit\('` = 17、`describe` 8 個。`:343` の wrapper `className` 完全一致 assertion を含む）
- **Pagination.test.tsx の it 数**: 8 it（既存）。`totalCount === 0` を「0 件」と表示する既存 case が S2 の `totalPages<=1` null 化で仕様変更になる（下記 Scope S2 参照）
- **上部 summary 新設が既存 test を壊す箇所（round 2 是正、Sonnet Plan Review 指摘）**: 下部 `Pagination` の件数文言と上部 `PaginationSummary` の件数文言は同一 `rangeText` を共有するため、新規に上部 summary を追加すると同じ文字列が DOM に 2 回現れる。単数一致の `screen.getByText(...)` を使う既存 test は多重一致で例外を投げ fail する。確認済みの該当箇所: `IntegrityCheckPage.test.tsx:414`（`screen.getByText("全 101 件のうち 1〜100 件を表示（1 / 2 ページ）")`）、`OperationLogsPage.test.tsx:280,292,419,431`（`screen.getByText("全 45 件のうち 41〜45 件を表示（3 / 3 ページ）")` 4 箇所）、`StockInquiryPage.test.tsx:526`（`screen.getByText("全 51 件のうち 51〜51 件を表示（2 / 2 ページ）")`）。これらは `getByText` → `getAllByText(...)` の `length` 検査、または `within(container)` でどちらの帯かを限定する形へ書き換える（S3 のスコープに含める）
- **StocktakePage 既存 test の row citation（round 1/2 是正）**: `StocktakePage.test.tsx:1042`（`it("SC8c': list pagination uses the canonical ProductPagination component"`）は `findByRole("button", { name: "前のページ" })` を `total_count` の少ない fixture で呼んでおり、`Pagination` が `totalPages<=1` で null を返すと `findByRole` が timeout する。`StocktakePage.test.tsx:1054`（`it("SC10: filter row lists department filter, then per-page select, then uncounted-only checkbox in that DOM order"`）は `compareDocumentPosition` で「部門 → 表示件数 → 未入力のみ表示」の順を assert しており、S4（Select 並べ替え）で DOM 順が変わるため書き換えが必須（新規 test ではなく既存 SC10 の rewrite）
- **PriceRevisionPage 既存 test の配線 oracle（round 2 是正）**: `PriceRevisionPage.test.tsx:660-669`（`it("SC9a: 表示件数変更で画面を先頭へ戻す"`）は `表示件数` という accessible name の combobox をクリックして `mockScrollPageToTop` の呼出しを確認する。この test は `Select` を `PriceRevisionFilters` へ移設しても accessible name・id を保てば無変更のまま pass するはずであり、`onPerPageChange` の配線を落とす mutant を検出する既存 oracle として SC7b の failure mode に転用する（新規 test を追加しない）
- **catalog ⑩ の pre-S2 記述箇所（round 2 是正、Sonnet Plan Review 指摘）**: `02-component-catalog.md:643`「`totalCount === 0` のときは「0 件」のみを表示し前後ボタンは両方 disabled」と `:648`「`totalCount === 0` は両方 disabled」は S2（`totalPages<=1` null 化）以前の挙動を記述しており、新形「`totalPages <= 1`（0 件含む）は下部 pager を描画しない」への更新が必要（S6 のスコープに追加）
- **catalog `text-base text-foreground tabular-nums` の出現数**: `02-component-catalog.md` に起票時 **2 箇所**（`:612` 構造例コード片、`:645` 使用トークン節）。両方とも S6 で新形へ更新する

## Scope

- **S1 filter/toolbar 枠の地色統一**（`rounded-lg border bg-card p-4`、L4-D3。`ListShell.tsx:88` の既存 class 文字列と完全一致させる。対象は 6 画面——round 2 是正で整合性チェックを除外、下記参照）:
  - S1a 棚卸し `StocktakePage.tsx:742` `<div className="flex flex-wrap items-center gap-4">` → `<div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">`
  - S1b 在庫照会 `StockInquiryPage.tsx:102` `<div className="flex flex-wrap items-center gap-3">` → 同型で `rounded-lg border bg-card p-4` 追加
  - S1c 入出庫履歴 `InventoryRecordsPage.tsx:159` `className="space-y-3 rounded-md border p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - S1d 在庫変動履歴 `StockMovementsPage.tsx:134` `<div className="flex flex-wrap items-end gap-3">` → `rounded-lg border bg-card p-4` 追加（`:98` の商品情報 card は不変、Non-scope）
  - S1e 操作ログ `OperationLogsPage.tsx:344` `className="space-y-3 rounded-md border p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - S1f 一括価格改定 `PriceRevisionFilters.tsx:33` `className="space-y-3 rounded-md border bg-stone-50 p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - **整合性チェックは対象外（round 2 是正、Opus P2）**: `IntegrityCheckPage.tsx:234` の `<div className="flex items-center gap-2">` は表示件数 `Select` 単独のラッパーで、`phase === "completed" && result !== null` のときにしか描画されず、他 filter フィールドを一切持たない「filter/toolbar 枠」ではない。囲む対象が Select 1 つだけの div に枠を付けても他画面の filter frame と意味が揃わないため、S1 の frame sweep から除外する（AC1 は 6 画面、AC-L3-3 も 6 画面が対象）
  - S1g 表 frame の `rounded-md` → `rounded-lg` 統一（round 2 是正、Opus P3）: filter/toolbar 枠を `rounded-lg` に揃える一方、同じ画面の table を囲む `overflow-x-auto rounded-md border` wrapper が `rounded-md` のまま残ると角丸が食い違う。`IntegrityCheckPage.tsx:348` と `OperationLogsPage.tsx:496` の `className="overflow-x-auto rounded-md border"` を `className="overflow-x-auto rounded-lg border"` へ（`border`/`overflow-x-auto` は不変、角丸 token のみ 1 箇所ずつ変更。`bg-card` は付けない——table wrapper は filter frame ではないため地色は変えない）
  - 完了条件（file 別）: 対象 6 file で `rg -Fn "bg-stone-50"` / 該当の枠なし旧 class 文字列 = 0、`rg -Fn "rounded-lg border bg-card p-4"` ≥ 1。`IntegrityCheckPage.tsx:234` の `Select` ラッパーに `bg-card` が付いていないことを回帰確認する（対象外の逸脱防止）。`IntegrityCheckPage.tsx`/`OperationLogsPage.tsx` で `rg -Fn "overflow-x-auto rounded-md border" <file>` = 0 かつ `rg -Fn "overflow-x-auto rounded-lg border" <file>` ≥ 1
- **S2 `Pagination`/`PaginationSummary` の上下切り分け契約変更**（`src/components/patterns/Pagination.tsx`、L4-D4。8 画面共有の 1 箇所修正で全 caller に反映——owner の「呼出し元を直せば一気に全部変わる」設計選好、Lane 3 の flag 是正先例と同型。Plan Review で変更なし、oracle のみ round 2 で是正）:
  - `PaginationSummary` の className: `"text-base text-foreground tabular-nums"` → `"text-sm text-muted-foreground tabular-nums"`（下部 `Pagination` の左側 summary と同じ見た目に統一）
  - `Pagination`: `computeRange` 直後に `if (totalPages <= 1) return null;` を追加（`totalCount === 0` は `totalPages = max(1, ceil(0/perPage)) = 1` のため同じ分岐で null になる——既存の「0 件」表示 test は本変更で仕様が変わる。下記 AC4 参照）
  - 完了条件（round 2 是正: `rg -Fn "text-sm text-muted-foreground tabular-nums"` は今日 0 件——下部の class は `"flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"`（外側 div）と `"tabular-nums"`（内側 div）に分割されており、結合済み文字列としては存在しない。よって完了条件は「新規に 1 箇所だけ出現する」ことを検査する）: `rg -Fn 'className="text-base text-foreground tabular-nums"' src/components/patterns/Pagination.tsx` = 0（起票時 1）かつ `rg -Fn "text-sm text-muted-foreground tabular-nums" src/components/patterns/Pagination.tsx` = 1（`PaginationSummary` 側のみに新規出現、下部の分割 class 表記とは別）かつ `rg -n "totalPages <= 1" src/components/patterns/Pagination.tsx` ≥ 1（`rg -c` は一致した**行数**を数える点に注意——本 file は該当行が単一のため `-c`/`-Fn` の値は一致する）
- **S3 上部 `PaginationSummary` の 7 画面ロールアウト + 既存重複文言 test の是正**（`ListShell` を使わない全画面、L4-D5。各画面の「結果あり」分岐内、`<Table>` 直前に 1 行追加するだけの機械的変更。Plan Review round 2 で既存 test 破綻の是正を追加）:
  - S3a 棚卸し `StocktakePage.tsx`（`items.length === 0` の EmptyState 分岐の else 側、`:821-852`）。**round 2 是正（Opus P3）**: この else 分岐は現在 `<Table>...</Table>` を裸で返す（囲み `<div>`/`<>` なし）。`PaginationSummary` を追加するには 2 要素を返す必要があるため、`<>...</>`（Fragment）または `<div className="space-y-3">` で `<Table>` ごと包み直す（単なる「1 行追加」ではない）
  - S3b 在庫照会 `StockInquiryPage.tsx`（`data` 分岐内、`ProductListTable` 直前）。**round 2 是正（Opus P1）**: 下部 `<Pagination>` は `statusValue === "all" && data.totalCount !== null` でのみ描画される（`totalCount: number | null`、`types.ts:54`。`source: "low_stock"` のとき `totalCount` は `null`）。上部 `PaginationSummary` にも**同じ条件**を書く——status フィルタが `"all"` 以外（在庫少 等）のときは `totalCount` が無いため上下とも表示しない。他 6 画面と異なり在庫照会だけ「`totalCount > 0` かつ `statusValue === "all"`」の 2 条件になる
  - S3c 入出庫履歴 `InventoryRecordsPage.tsx`（`recordsQuery.data` 分岐内、`:333` の `<Table>` 直前）
  - S3d 在庫変動履歴 `StockMovementsPage.tsx`（`movementsQuery.data` 分岐内、`MovementTable` 直前）
  - S3e 操作ログ `OperationLogsPage.tsx`（`logsQuery.data.items.length > 0` 分岐内、`:496` の table wrapper 直前）
  - S3f 一括価格改定 `PriceRevisionPage.tsx`（`list.productsQuery.data` 分岐内、`PriceRevisionTable` 直前）
  - S3g 整合性チェック `IntegrityCheckPage.tsx`（`mismatches.length > 0` 分岐内、`:348` の table wrapper 直前）
  - 各画面とも `page`/`perPage`/`totalCount` は既存の下部 `<Pagination>` 呼出しと同じ値を渡す（新規 state 追加なし）
  - **既存 test 是正（round 2、必須）**: `IntegrityCheckPage.test.tsx:414`、`OperationLogsPage.test.tsx:280,292,419,431`、`StockInquiryPage.test.tsx:526` の `screen.getByText(<件数文言>)` を、上部/下部の重複を許容する形（`screen.getAllByText(...)` で `length` 検査、または `within(<下部 Pagination の container>)` で片方に限定）へ書き換える。既存 `it` の削除・skip はしない
  - 完了条件: 各 file で `rg -c "PaginationSummary" <file>` ≥ 1（起票時 0、商品一覧除く）かつ 0 件分岐（EmptyState 系）に新規 import が漏れ出していないこと（対応 test で確認）。上記 3 file 6 箇所の `getByText` が `getAllByText`/`within` へ置き換わっていること（`rg -c "getByText\(\"全 " <file>` が是正後は 0、置換先の `getAllByText`/`within` 使用箇所が同数以上）
- **S4 表示件数 `Select` の右端統一**（L4-D5 続き。5 画面は起票時実測で既に最後尾——変更不要——のため、実際の構造変更は 2 画面のみ）:
  - S4a 棚卸し `StocktakePage.tsx:752-778` の表示件数 `Select` ブロックを `:779-793` の未入力のみ表示 Checkbox ブロックより**後**へ並べ替える（JSX の子要素順の入替えのみ、ロジック変更なし）。**既存 test の rewrite が必須**: `StocktakePage.test.tsx:1054`（`it("SC10: filter row lists department filter, then per-page select, then uncounted-only checkbox in that DOM order"`）の `compareDocumentPosition` 期待順を「部門 → 未入力のみ表示 → 表示件数」へ書き換える（新規 test を追加するのではなく既存 SC10 を rewrite、Matrix SC4a はこの rewrite を指す）
  - S4b 一括価格改定: `PriceRevisionPage.tsx:67-96` の表示件数 `Select` ブロックを `PriceRevisionFilters.tsx` の filter 行（`:34-91`）へ**移設**し、その最後尾（`廃番を含む` チェックボックスの後）に配置する。`PriceRevisionFilters` に `perPage: number` / `onPerPageChange: (value: number) => void` prop を追加し、呼び出し元 `PriceRevisionPage.tsx` から現行の state/handler をそのまま渡す（新規 state 追加なし、配線の付け替えのみ）。**既存 test が退行 oracle を兼ねる**: `PriceRevisionPage.test.tsx:660-669`（`it("SC9a: 表示件数変更で画面を先頭へ戻す"`）は accessible name `表示件数` の combobox をクリックし `mockScrollPageToTop` の呼出しを確認する既存 test で、`onPerPageChange` の配線漏れ mutant を検出する（新規 test 追加なし、この既存 test の pass 維持が SC4b の failure-mode oracle）。**round 2 是正（Opus P2）**: `PriceRevisionFilters.tsx:46` は取引先 native `<select>` を同じ filter 行に持つ。lane ⑧（`agent/ui-select-unify`、merge train Lane 5 → ⑧ → Lane 4）がこの native `<select>` を shadcn `Select` へ置換する予定で、本 lane の branch は ⑧ の tip へ単段 merge で付け替えてから実装する（Risk 節の Stacked train 参照）。したがって S4b 実装時点では取引先は既に shadcn `Select` に置換済みのはずであり、本 packet では native `<select>` への対応を追加しない（下記 Residual Risk 参照）
  - 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ は起票時実測のとおり既に filter 行の最後尾のため変更不要（回帰確認のみ、L4-D5）
  - 完了条件: S4a は `StocktakePage.test.tsx:1054` の rewrite 後の `compareDocumentPosition` 期待順で pass。S4b は `rg -n "price-revision-per-page" src/features/products/components/PriceRevisionFilters.tsx` ≥ 1（起票時 0）かつ `rg -n "price-revision-per-page" src/features/products/PriceRevisionPage.tsx` = 0（起票時 1、独立 Select 削除）かつ `PriceRevisionPage.test.tsx:660-669` の SC9a が無変更のまま pass
- **S5 `StocktakePage.tsx:854` の空 `<fieldset>` ガード**（P3、round 1 是正で新規追加。`Pagination` が `totalPages<=1` で null を返すと `<fieldset disabled={disabled}><Pagination/></fieldset>` が中身の無い `<fieldset>` だけを残す。他 2 箇所は table と同じ `space-y-*` container 内の兄弟のため React が null 子を描画せず stray gap は生じない——`IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` は verified non-issue として変更しない、下記 Review Focus 参照）: `StocktakePage.tsx` 側で `totalPages`（`Pagination.tsx` と同じ `Math.max(1, Math.ceil(totalCount / perPage))` 式）を計算し、`totalPages > 1` のときだけ `<fieldset>` を描画する。完了条件: `StocktakePage.test.tsx` に「単一ページのとき `<fieldset>` が描画されない」新規 assertion
- **S6 DSR-22 の文言改訂**（`docs/design-system/01-decision-rules.md:429`、L4-D7）: 「上部の件数・現在位置 text と table header の sticky 化は、実表示が viewport を超えるときにだけ発動する（1 画面に収まる短い一覧では省略してよい。…）。上部は `PaginationSummary` で範囲付き統一形…の text 表示を必須、pager ボタンは任意（`Pagination` 下部と別 component）。下部は件数 + pager フル装備で、canonical は `Pagination`…」を「`ListShell` 採用画面では `topSummary` prop（既定 `false`、`ListShell.tsx:69`）で上部表示を明示的に opt-in し、非 `ListShell` 画面では対応する `PaginationSummary` を直接描画することで、pagination を持つ一覧画面すべてに適用する。opt-in 後の上部の件数・現在位置 text は `totalCount > 0` のとき常に表示する（table header の sticky 化は引き続き `ListShell` の `stickyHeader` prop 採用画面のみ）。上部は `PaginationSummary` で範囲付き統一形…の text 表示のみを持ち、pager ボタンは置かない。下部は `totalPages > 1` のときだけ、件数 + pager フル装備の `Pagination`（`src/components/patterns/Pagination.tsx`）を描画する…」へ改める。識別列固定の記述（同 `:429` 後半の mapping 表・E12 由来の「両立方式の probe」申し送り）は「Lane 4 で Contract Probe（CSS 仕様の静的確認）により不採用と確定、`identityColumns` prop は予約のまま維持する」を追記する。完了条件: `rg -Fn "実表示が viewport を超えるときにだけ発動する" docs/design-system/01-decision-rules.md` = 0（起票時 1）かつ `rg -Fn "totalCount > 0 のとき常に表示する" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fn "pager ボタンは任意" docs/design-system/01-decision-rules.md` = 0（起票時 1）かつ `rg -Fn "pager ボタンは置かない" docs/design-system/01-decision-rules.md` ≥ 1
- **S7 catalog ⑩ ページネーションの改訂**（`docs/design-system/02-component-catalog.md:602-663`、L4-D8）: `:608-641` の構造例（上部 variant の class を `text-base text-foreground` → `text-sm text-muted-foreground` へ）・`:643`（「`totalCount === 0` のときは『0 件』のみを表示し前後ボタンは両方 disabled」→「`totalPages <= 1`（0 件含む）は下部 pager を描画しない」）・`:645` 使用トークン節（上部 `PaginationSummary` の記述を下部と同じトークンへ）・`:648`（「`totalCount === 0` は両方 disabled」→「`totalPages <= 1`（0 件含む）は下部 pager 自体を描画しない」）・`:653` アクセシビリティ節（上部/下部の同時描画前提の記述を「下部は複数ページ時のみ描画」へ）・`:658` Do 節（「viewport を超える一覧は上部にも…」→「一覧はすべて上部に…常に」）・`:663` Don't 節（「下部を単一ページ（totalPages<=1）で表示しない」を追加）を改訂する。完了条件: `rg -Fn "text-base text-foreground tabular-nums" docs/design-system/02-component-catalog.md` = 0（起票時 2 箇所、`:612`,`:645`）かつ `rg -c "text-sm text-muted-foreground tabular-nums" docs/design-system/02-component-catalog.md` ≥ 2 かつ `rg -Fn "のときは「0 件」のみを表示し前後ボタンは両方 disabled" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:643`。実文は `` `totalCount === 0` `` の直後にこの句が続く）かつ `rg -Fn "は両方 disabled）" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:648`）かつ `rg -Fn "viewport を超える一覧は上部にも" docs/design-system/02-component-catalog.md` = 0（起票時 1）
- **S8 catalog ⑯ 一覧の器の改訂**（`docs/design-system/02-component-catalog.md:896-926`、L4-D8 続き。round 1 是正で対象を項目 2 のみへ縮小——項目 3 の `w-min min-w-full` 記述は現状の実装（不変）と一致しているため変更しない）: 項目 2（`:905`、「両者とも `totalCount > 0` のときだけ描画する」→「上部は `totalCount > 0` のとき常に、下部は `totalPages > 1` のときだけ描画する」）のみ改訂する。完了条件: `rg -Fn "両者とも \`totalCount > 0\` のときだけ描画する" docs/design-system/02-component-catalog.md` = 0（起票時 1）かつ `rg -n "totalPages > 1" docs/design-system/02-component-catalog.md` ≥ 1（項目 2 内）。項目 3（`w-min min-w-full` の記述）は無変更のまま残ることを回帰確認する（``rg -Fn 'min-w-full`（横 overflow 時に帯が table 幅へ追随' docs/design-system/02-component-catalog.md`` ≥ 1 を維持、単一引用符内でバックティックはエスケープしない）
- **S9 Plans.md ④ + Contract Coverage Ledger 記入**: 本 packet の active link を反映（本 commit で同時実施）。Lane 4 の item (1) は「商品一覧の折返しに限定（他 7 画面は内部横 scroll で出っ張らない）」と明記する。Contract Coverage Ledger は下記節を参照

## Non-scope

- `ListShell.tsx:99` の `w-min min-w-full` wrapper の撤去・変更（Plan Review round 1 で reject、Lane 2 追補 S17 の既存挙動・`ListShell.test.tsx:343` の完全一致契約を維持する）
- 識別列固定（sticky）の実装、`identityColumns` prop の配線（Contract Probe で不採用確定）
- 商品一覧以外の 7 画面の table 幅・長文列変更（`stickyHeader` 非採用画面は `table.tsx:9` の内部 `overflow-x-auto` で bleed しないため、Plan Review round 1 で Non-scope 確定）。`PriceRevisionTable.tsx` の `min-w-[1280px]`/商品名折返しを含む
- 非 ListShell 7 画面の `ListShell` 化（frame class の直接適用のみ）
- `Playwright` devDep 追加（Plans.md ④ 旧記述を本 packet が supersede）
- R2-3 / R2-4（在庫照会）、badge 色・増減数値の色（⑦）、native `<select>` → shadcn `Select` 置換（⑧、R5-3）
- `StockMovementsPage.tsx:98` 商品情報 card（別 section、既存 `bg-card` のまま不変）
- `IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` の `Pagination` null 化に伴う wrapper 調整（`space-y-*` container 内の兄弟要素のため null 子は React が描画せず stray gap を生まない、verified non-issue。`StocktakePage.tsx:854` の `<fieldset>` のみ単独子のため S5 で対処する）
- `IntegrityCheckPage.tsx:234` の表示件数 `Select` 単独ラッパーへの frame 付与（round 2 是正、上記 S1 参照。他 filter フィールドを持たないため対象外）

## Residual Risk

- **⑧ 未 merge のまま実装した場合の既知残件（round 2 是正、Opus P2）**: S4b は `PriceRevisionFilters.tsx` の取引先 native `<select>`（`:46`）が lane ⑧ で shadcn `Select` に置換済みであることを前提にする。もし何らかの事情で ⑧ が本 lane より先に merge されないまま Writer が実装した場合、表示件数 `Select`（shadcn）の隣に取引先 native `<select>` が残り、枠の濃淡差（Lane 5 の `--control-surface`/`--border-strong` sweep 対象）は解消済みでも見た目の部品種別は揃わない。Coordinator は実装着手前に ⑧ の merge 状態を確認し、未 merge なら Stacked train の merge train 順（Lane 5 → ⑧ → Lane 4）どおり待つ。待たずに実装する場合はこの既知残件を owner L3 の所感として記録し、別 item 化する

## Acceptance Criteria

- AC1: S1a〜S1f の 6 画面すべてで枠が `rounded-lg border bg-card p-4`（整合性チェックは round 2 是正で対象外、下記参照）— 各 file 個別 `rg -Fn`（Scope S1 各 sub-item のとおり）。加えて S1g（round 2 是正）で `IntegrityCheckPage.tsx:348`/`OperationLogsPage.tsx:496` の table wrapper が `rounded-md` → `rounded-lg` に統一される（`bg-card` は付かない）
- AC2: `Pagination` が `totalPages <= 1` で何も描画しない、`totalPages > 1` では従来どおり描画する — 新規 vitest（`Pagination.test.tsx` 拡張、SC1a〜SC1c）。既存の「`totalCount === 0` は『0 件』を表示する」test は本変更で「`totalCount === 0` は null を描画する」へ書き換える（削除ではなく仕様変更としての更新、既存 test の無効化には当たらない）
- AC3: `PaginationSummary` が新規に `text-sm text-muted-foreground tabular-nums` を持つ（`text-base text-foreground` は 0 件） — `rg -Fn "text-base text-foreground tabular-nums" src/components/patterns/Pagination.tsx` = 0、`rg -Fn "text-sm text-muted-foreground tabular-nums" src/components/patterns/Pagination.tsx` = 1（下部の分割表記とは別、Scope S2 の oracle 注記参照）
- AC4: 7 画面すべてで `totalCount > 0` の結果表示時に上部 `PaginationSummary` が描画され、かつ `IntegrityCheckPage.test.tsx:414`/`OperationLogsPage.test.tsx:280,292,419,431`/`StockInquiryPage.test.tsx:526` の重複文言 test が `getAllByText`/`within` へ是正されて pass する — 各 Page.test.tsx 新規/是正 assertion（Scope S3 各 sub-item）。**例外（round 2 是正）**: 在庫照会のみ上部 summary は `statusValue === "all" && totalCount !== null` のときだけ描画される（下部と同条件、`source: "low_stock"` では `totalCount` が `null` のため上下とも非表示のままでよい）
- AC5: 51 件 / perPage 50 のとき page 2 で「前へ」が有効表示される — `Pagination.test.tsx` 新規 edge test
- AC6: 表示件数 `Select` が 8 画面すべてで filter/toolbar 枠内の最後尾 — `StocktakePage.test.tsx:1054`（SC10 rewrite）、`PriceRevisionFilters.tsx`/`PriceRevisionPage.tsx`（配線先の変更 + `PriceRevisionPage.test.tsx:660-669` SC9a の pass 維持）。他 5 画面は既存 DOM 順が変わらないことを既存 test の pass 維持で確認（回帰）
- AC7: `StocktakePage.test.tsx:1042`（SC8c'）が `Pagination` の `totalPages<=1` null 化後も pass する（fixture の `total_count` を perPage 超に上げる、または前へ/次への不在を assert する形へ是正）
- AC8: `StocktakePage.tsx:854` の `<fieldset>` が単一ページで描画されない — 新規 assertion（Scope S5）
- AC9: `ListShell.test.tsx` の既存 17 it（`:343` の wrapper 完全一致 assertion を含む）が無変更のまま pass する — 回帰確認（本 lane は `ListShell.tsx` を一切変更しない）
- AC10: DSR-22 の文言が新形へ更新される（`topSummary`/`identityColumns` の既存 opt-in 機構と矛盾しない形で） — Scope S6 の `rg -Fn` 完全一致検査
- AC11: catalog ⑩ の文言・構造例・トークン記述・`totalCount===0` 系の pre-S2 記述（`:643`,`:648`）が新形へ更新される — Scope S7 の `rg -Fn`/`rg -c` 完全一致検査
- AC12: catalog ⑯ 項目 2 のみ新形へ更新され、項目 3（`w-min min-w-full`）は無変更のまま残る — Scope S8 の `rg -Fn` 完全一致検査（新形出現 + 旧項目 3 残存の両方を確認）
- AC13（round 2 是正、Opus P2）: `page > totalPages` の状態で描画される画面が無いこと — 8 画面のうち `StockInquiryPage.tsx:196`（`isOutOfRangePage`）と `OperationLogsPage.tsx:452`（`outOfRange`）の 2 画面は既存の「先頭ページに戻る」`EmptyState` で明示的に検知・復帰する。残り 6 画面は専用の範囲外検知 UI を持たず、フィルタ変更時に page をリセットする既存 handler（`Error, empty, retry, and recovery behavior` 節に例示済み）のみで防いでいる。下部 `Pagination` が `totalPages<=1` で非表示になっても、フィルタ変更で `totalCount` が変わった直後に一時的に `page > totalPages` になり得る経路が新たに生まれていないことを、フィルタ変更で `totalCount` を perPage 未満へ減らす新規 test 1 本（対象画面は Writer が残り 6 画面から 1 画面選定、既存の page-reset handler 経路を通る）で確認する — 新規 vitest 1 本
- AC-L3-1（owner Windows native L3）: `ProductListPage.tsx`（商品一覧）で窓を狭めても表が枠内に収まり部門列が折り返す（対象は商品一覧 1 画面のみ、起票時実測の floor 概算 ≈ 980〜1050px 付近から確認）
- AC-L3-2（owner Windows native L3）: `Pagination.tsx` の複数ページの画面 1 つで下部ページ送りが表示され、単一ページの画面 1 つで下部ページ送りが非表示になる（上部件数のみ残る）
- AC-L3-3（owner Windows native L3）: 表示件数 `Select` の位置が 8 画面で揃って見え、filter/toolbar 枠の地色が対象 6 画面（整合性チェックを除く、round 2 是正）で揃って見える

## Design Sources

- Requirements / spec: 該当なし（新規 REQ 追加なし）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の class/component 構成変更のみ）
- Function / command / DTO: 該当なし
- DB: 変更なし
- Screen / UI: `docs/design-system/00-foundations.md`（`--card` #f5f5f4、変更なし・正本参照のみ）/ `docs/design-system/01-decision-rules.md` DSR-17（`:292`、`<main>` 単一 scroll 契約、参照のみ）/ DSR-22（`:429`、S6 で改訂）/ `docs/design-system/02-component-catalog.md` ⑩ ページネーション（S7）/ ⑯ 一覧の器（S8）/ `docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`（S17、`w-min min-w-full` の導入経緯、参照のみ・変更なし）
- Decision log / ADR: `docs/decision-log.md` D-074（Stacked train）/ D-079（UI 視覚系 change の座組）。本 lane は owner 決定（Plans.md ④ R2-1/R2-2/R3-2/R5-2/R5-4、E12）の執行であり新規 durable decision の追加はない（L4-D3〜D8 は packet 止まりの実装判断）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | — | 該当なし |
| Command / DTO / generated binding / wire shape | — | 該当なし |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-22、`02-component-catalog.md` ⑩/⑯ | updated in this PR（S6/S7/S8） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | 既存 D-074/D-079 の座組を踏襲、新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 新規 REQ 追加なし。既存 test file への assertion 拡張のみで新規 test file は作成しない予定（S1〜S5 はいずれも既存 Page/Component test の拡張）。`generate_traceability` の `FE_UNREFERENCED_BASELINE`（`generate_traceability.rs:48`、現在 24）は新規 test file を追加しない限り再生成不要。Writer が実装中に新規 test file が必要と判断した場合（例: `PriceRevisionFilters.test.tsx` が未存在なら新設が必要）は Lane 5 L5-D6 の先例（画面非依存の shared UI primitive の class 契約 test は REQ/UI ID を付けない）に従い baseline を更新し、gated amendment として記録する |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | 起票時実測「識別列 sticky（E12 案）が Non-scope である技術的根拠」節 | L4-D1（2026-09-05） | E12 が示した横 scroll 容器 + 識別列 sticky 案は、CSS の overflow 計算規則（`overflow-x: auto` は `overflow-y` を `auto` へ computed する）により当該容器を独立 scrolling ancestor に変え、DSR-17 `:292` の「`<main>` が唯一の scroll container」契約と衝突し `ListShell` の sticky thead（`<main>` 相対）と両立しない。この結論は CSS 仕様から静的に導けるため Playwright/headless probe は不要（Contract Probe = 本節記述、N/A）。owner は D（表を縮ませる）を選定し、E12 案は不採用 | なし（Non-scope 確定） | 該当なし |
| — | 起票時実測「ListShell / table primitive の overflow 機構（round 1 是正版）」節 | L4-D2（2026-09-05、round 1 是正） | 当初案（`ListShell.tsx:99` の wrapper を `w-full` に固定）は Plan Review round 1（Opus）の P1 で reject。Lane 2 追補 S17 が導入した `w-min min-w-full` は横 overflow 時に summary 帯を table 幅へ追随させる**意図した**挙動で、owner が AC-L3-2 で確認済み、`ListShell.test.tsx:343` が完全一致で保護している。是正: wrapper は不変のまま、表を縮ませる対象を商品一覧 `ProductTable.tsx` の部門列折返しに限定し、min-content の床を下げることで出っ張りが発生する窓幅の下限を狭める（床を超えて窓を狭めれば Lane 2 の追随挙動が発動する——bleed ではなく仕様どおり） | `ProductTable.tsx`（部門列のみ） | S1（frame）とは独立、Writer が `ProductTable.test.tsx` へ新規 assertion（部門列 `whitespace-normal`、既存 `min-w-*` を追加しないことの確認を含む） |
| — | 起票時実測「表を縮ませる対象は商品一覧 `ProductTable.tsx` のみである根拠」節 | L4-D2 続き（2026-09-05、round 1 是正） | `stickyHeader` を採用するのは `ProductListPage.tsx:284` のみで、他 7 画面は `table.tsx:9` の `overflow-x-auto` により内部 scroll するため出っ張らない。旧 S2b〜S2f（6 画面の長文列折返し・固定 table 幅撤去）は Non-scope へ撤回した | なし（Non-scope 確定） | 該当なし |
| — | Plans.md ④ R5-4 owner 決定 | L4-D3（2026-09-05） | owner は「既存 `--card` #f5f5f4 に統一、新規 token なし」を明示（R5-4 sub-bullet の `--list-toolbar`（仮）token 案は旧案として本 packet が supersede する）。理由は既存 toolbar 枠（商品一覧）との統一で追加の視覚差分を持ち込まないこと | 7 画面の filter/toolbar 枠 | S1 各新規 assertion |
| — | Plans.md ④ R2-1 owner 決定 | L4-D4（2026-09-05） | 上部は常時表示・ボタンなし、下部は複数ページ時のみという上下非対称の設計は、Q12 §1「初心者ほど操作体系はシンプルなほうがよい」（DSR-22 Why 既存引用）を単一ページ時にも徹底したもの。共有 component（`Pagination.tsx`）1 箇所の修正で 8 画面全 caller に反映する設計を採る（owner「呼出し元を直せば一気に全部変わる設計」選好、Lane 3 flag 是正の先例と同型） | `Pagination.tsx` | S2 新規 assertion |
| — | Plans.md ④ R5-2 owner 決定 | L4-D5（2026-09-05） | 表示件数 Select は toolbar 枠内の右端に統一。起票時実測で 5/7 画面は既に最後尾のため、構造変更が必要なのは棚卸し（reorder）と一括価格改定（Filters への移設 + prop 配線）のみ。既に条件を満たす画面まで無用に書き換えない（ponytail: 既に満たす契約への追加変更は避ける） | `StocktakePage.tsx`、`PriceRevisionFilters.tsx`/`PriceRevisionPage.tsx` | S4 各新規/是正 assertion |
| — | `StocktakePage.tsx:854` fieldset | L4-D6（2026-09-05、round 1 是正で新規） | `Pagination` の `totalPages<=1` null 化により `<fieldset>` の唯一の子が消え空要素が残る。他 2 箇所（`IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243`）は `space-y-*` container 内の兄弟要素で null 子は描画されず stray gap を生まないため verified non-issue とし、`StocktakePage.tsx` のみ `totalPages` を computed して `<fieldset>` 自体をガードする | `StocktakePage.tsx` | S5 新規 assertion |
| — | `rangeText` の `totalCount === 0 → "0 件"` 分岐 | L4-D9（2026-09-05、round 1 P3 disposition） | `Pagination`（下部）は S2 で `totalPages<=1` を早期 null 化するため `totalCount===0` の場合に `rangeText` の「0 件」分岐へ到達しない。`PaginationSummary`（上部）も production caller は S3 で `totalCount > 0` の結果表示分岐内でのみ mount するため同様に到達しない。したがって本 lane の完了後、この分岐は現行 production 経路からは事実上到達不能になるが、防御的フォールバック（呼び出し側が将来ガードを外した場合に `NaN`/負値の range 計算を防ぐ）として残す方が、全 caller を洗い出して削除する労力より小さい——**keep**（ponytail: 削除しないことを明示する） | `Pagination.tsx`（変更なし） | 既存 `Pagination.test.tsx` の当該 case（「0 件」→「null を返す」へ更新、AC2） |
| — | `01-decision-rules.md` DSR-22 / `02-component-catalog.md` ⑩⑯ | L4-D7〜D8（2026-09-05） | S6/S7/S8 の文言改訂は実装（S1〜S5）に一致させる事後同期であり、新規ルールの追加ではない。⑯ 項目 3（`w-min min-w-full`）は実装が不変のため文言も不変 | 3 doc | S6/S7/S8 の `rg` 完全一致検査 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 packet の「起票時実測」節が値・機序・理由の一次情報。実装後は S6〜S8 で DSR-22/catalog へ反映し packet 依存を解消する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし。L4-D1〜D9 は実装詳細の Coordinator 判断のため packet 止まりでよい（owner 決定 R2-1/R5-2/R5-4/E12 は既に Plans.md ④ に記録済み）
- Assumptions and constraints: 対象範囲を商品一覧 1 画面（table 幅）+ 8 画面共通（frame/pagination/Select）に確定。Plan Review round 1/2 でこの境界線（特に 7 画面 Non-scope 化）の妥当性を検査済み
- Deferred design gaps, risk, and follow-up target: 識別列 sticky の恒久不採用（L4-D1、`identityColumns` prop は削除せず予約のまま）。`PriceRevisionTable` 等 7 画面の table 幅・長文列は本 lane では扱わない（内部 scroll のため現状のままで機能上の問題はない）
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-list-backbone-d-lane4.md) 各行に L4-D 番号か DSR-22/catalog 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は `StockMovementsPage.tsx:98` 商品情報 card（別 section、不変）と `IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` の null-child no-op（verified non-issue）のみ。すべて起票時実測・Review Focus で列挙し、抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の class/component 構成変更のみ | — |
| Fact check / design decision split | 適用: Plans.md ④ R2-1 の「在庫照会で観測」claim を実コードで再確認し、現状は該当挙動が存在しないことを確認（起票時実測節）。加えて Plan Review round 1 の Opus P1（wrapper 撤去・7 画面 scope）を実装・既存 test に対して裏取りし accept | 起票時実測「Plans.md ④ の記録済み claim の訂正」、`## Review Response` |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 商品一覧の折返し + 8 画面のページ送り・表示件数配置・枠地色が変わる。owner L3 で確認（AC-L3-1〜3） | AC-L3-1〜3 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜3） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし。Playwright 等の新規依存は追加しない（Non-scope） | — |

## Design Readiness

- Existing design docs are sufficient because: DSR-17（`<main>` 単一 scroll）/ DSR-22（一覧の器の適用条件）/ catalog ⑩⑯ は Lane 2〜5 で正本化済み。本 lane は既存契約の適用条件を owner 決定に合わせて改訂する（S6〜S8）のみで、新規 token・新規 component は追加しない
- Source docs updated in this PR: `01-decision-rules.md` DSR-22（S6）/ `02-component-catalog.md` ⑩（S7）/ ⑯ 項目 2 のみ（S8）
- Design gaps intentionally deferred: 商品一覧以外の 7 画面の table 幅・長文列（内部 scroll のため現状で機能上の問題はない、Non-scope）
- Durable decisions discovered in this plan and promoted to source docs: なし（既存 owner 決定の執行）
- **識別列 sticky 不採用の記録**（Design Readiness 固有の記載事項）: E12 が提案した「横 scroll 容器 + 識別列 sticky」の両立方式は、DSR-17 の `<main>` 単一 scroll 契約と CSS の overflow 計算規則（`overflow-x: auto` は `overflow-y` を `auto` へ computed し、独立 scrolling ancestor を作る）から静的に導ける矛盾により Contract Probe（追加実験なし）で不採用と確定した。`ListShell.tsx` の `identityColumns` prop は Lane 2 からの予約状態のまま維持し、削除しない（将来 DSR-22 の mapping 表が使われる可能性を閉じないため）
- **wrapper 不変の記録（round 1 是正）**: `ListShell.tsx:99` の `w-min min-w-full` は Lane 2 追補 S17 の意図した挙動（横 overflow 時の帯追随、owner AC-L3-2 確認済み）であり、`ListShell.test.tsx:343` の完全一致 assertion で保護されている。本 lane はこの wrapper に触れず、表を縮ませる対象を商品一覧の部門列折返しに限定してこの挙動と両立させる

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の class/component 構成変更のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言変更なし（件数文言そのものは Lane 3 で確定済み）、見た目（部門列の折返し・枠・配置）のみ
- Error, empty, retry, and recovery behavior: `Pagination` の `totalPages<=1` null 化は EmptyState 分岐（既存、totalCount===0 は先に EmptyState で処理される）と重複しない副作用のみ。既存の error/empty/loading 分岐は不変。フィルタ変更時に page をリセットする既存 handler（例: `StocktakePage.tsx` の部門/未入力のみフィルタが `page: 1` を設定、`StockInquiryPage.tsx` の検索語・部門・状態フィルタが `page: undefined` を設定）はいずれも本 lane で変更しないため、下部 pager が消えても「範囲外 page に取り残される」経路は生まれない（Writer は実装時に全 8 画面のフィルタ handler をこの観点で再点検する。上記 2 画面は本 packet 起草者が確認済みの代表例で、残り画面の網羅的な確認は Writer の実装時作業とする）
- Testability and traceability IDs: 新規 REQ 追加なし

## Contract Probe

- E12 の「横 scroll 容器 + 識別列 sticky」両立可否: 起票時実測「識別列 sticky（E12 案）が Non-scope である技術的根拠」節に記載の CSS 仕様（overflow-x/overflow-y の computed 規則）と DSR-17 `:292` の `<main>` 単一 scroll 契約から静的に導出。追加実験不要（N/A、Playwright/headless Chromium は使わない）
- `ListShell` sticky thead の `top` 基準・`w-min min-w-full` wrapper の追随挙動: 本 lane では `ListShell.tsx` を一切変更しないため前提の再検証は不要（静的コード確認、N/A）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| L4-D1 識別列 sticky 不採用（owner D 決定） | なし（Non-scope 確定） | 該当なし | non-scope |
| L4-D2 ProductTable 部門列 whitespace-normal（round 1 是正、対象を 1 画面へ縮小） | `ProductTable.tsx` | `ProductTable.test.tsx` 新規 assertion | AC-L3-1 |
| S1a〜S1f 枠地色 bg-card 統一（L4-D3、整合性チェック除く） | 6 file | 各 Page/Component test 拡張 | AC-L3-3 |
| S1g table wrapper rounded-lg 統一（round 2 是正） | `IntegrityCheckPage.tsx`/`OperationLogsPage.tsx` | 各 test 拡張 | AC1（L3 対象外） |
| S2 Pagination 上下切り分け（L4-D4） | `Pagination.tsx` | `Pagination.test.tsx` 拡張 | AC-L3-2 |
| S3a〜S3g 上部 summary ロールアウト + 重複文言 test 是正（L4-D4） | 7 file + 3 file の既存 test 是正 | 各 Page test 拡張/是正 | AC-L3-2 |
| S4a〜S4b Select 右端統一（L4-D5） | `StocktakePage.tsx`、`PriceRevisionFilters.tsx`/`PriceRevisionPage.tsx` | 既存 SC10/SC9a rewrite・pass 維持 | AC-L3-3 |
| S5 StocktakePage fieldset ガード（L4-D6） | `StocktakePage.tsx` | 新規 assertion | non-scope（L3 対象外、機械検査） |
| L4-D9 rangeText 0 件分岐 keep（round 1 P3） | `Pagination.tsx`（変更なし） | 既存 test 更新（AC2） | non-scope |
| AC13 範囲外 page 非到達確認（round 2 是正） | 6 画面のいずれか 1 画面（既存 page-reset handler 経路） | 新規 vitest 1 本 | non-scope（L3 対象外、機械検査） |
| S6 DSR-22 改訂（L4-D7） | `docs/design-system/01-decision-rules.md` | 該当なし（docs review） | non-scope |
| S7 catalog ⑩ 改訂（L4-D8） | `docs/design-system/02-component-catalog.md` | 該当なし（docs review） | non-scope |
| S8 catalog ⑯ 項目 2 改訂（L4-D8） | `docs/design-system/02-component-catalog.md` | 該当なし（docs review） | non-scope |

## 実装原則（ponytail、full）

書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（`<input type="date">`、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。

本 lane での適用例: S2 は `Pagination.tsx` 1 箇所の修正で 8 画面全 caller に反映する（画面ごとに個別ロジックを複製しない）。S4 は起票時実測で既に条件を満たす 5 画面には触れず、満たさない 2 画面のみを直す（満たしている契約への冗長な書き換えをしない）。round 1 是正では「表を縮ませる」対象を出っ張りの実症状がある商品一覧 1 画面へ絞り、症状のない 7 画面への投機的な変更をしない（YAGNI、Opus P1 が正しく検出した過剰適用）。部門列の折返しに新規 `min-w-*` の床を追加しない（Opus P2、既存の `whitespace-normal` 1 class で足りる）。

## Test Plan

Test Design Matrix: [test-matrices/2026-09-05-ui-list-backbone-d-lane4.md](test-matrices/2026-09-05-ui-list-backbone-d-lane4.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（本 lane は frontend のみだが release check の慣行は維持する）。

- targeted tests: 商品一覧の部門列 class assertion、8 画面 + `Pagination` の class・DOM 順・条件分岐 assertion（既存 test file の拡張が中心、新規 test file は原則追加しない）
- negative tests: `totalPages <= 1`（0 件含む）で `Pagination` が描画されないことの対照 case、EmptyState 分岐で新規 `PaginationSummary` が誤って描画されないことの対照 case、7 画面の table 幅/長文列が本 lane で変更されていないことの回帰
- compatibility checks: `ListShell.test.tsx` 既存 17 it が pass のまま（AC9、本 lane は `ListShell.tsx` を変更しないため無変更で pass する）、`Pagination.test.tsx` の「0 件」表示 test は仕様変更として更新（削除ではない）、`StocktakePage.test.tsx:1042`/`:1054`、`PriceRevisionPage.test.tsx:660-669`、`IntegrityCheckPage.test.tsx:414`、`OperationLogsPage.test.tsx:280,292,419,431`、`StockInquiryPage.test.tsx:526` の既存 test 是正
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: `PriceRevisionFilters` への perPage prop 追加が `PriceRevisionPage.tsx` の既存 state/handler と正しく配線されること（S4b、既存 SC9a が oracle）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（class 文字列・component 構成・条件分岐の変更のみ）。

## Review Focus

- `ProductTable.tsx` の部門列 `whitespace-normal` 化が新規の `min-w-*` 床を追加していないこと（Opus P2、YAGNI）
- 商品一覧以外の 7 画面に table 幅・長文列の変更が一切入っていないこと（Non-scope 逸脱の検出）
- `ListShell.tsx` が 1 行も変更されていないこと（`ListShell.test.tsx` 17 it が無変更のまま pass、特に `:343` の wrapper 完全一致）
- `Pagination.tsx` の `totalPages <= 1` null 化（S2）が `totalCount === 0` の既存契約（EmptyState 分岐が先に処理する前提）と矛盾しないこと
- 上部 `PaginationSummary` ロールアウト（S3）が EmptyState / エラー / ローディング分岐に誤って描画されないこと、かつ重複文言による既存 test 破綻（`IntegrityCheckPage.test.tsx:414` 等）がすべて是正されていること
- `PriceRevisionFilters` への perPage 移設（S4b）が既存の `patchSearch`/`scrollPageToTop` 呼出しと `PriceRevisionPage.test.tsx:660-669`（SC9a）を壊していないこと
- `StocktakePage.tsx:854` の `<fieldset>` が単一ページで空要素として残っていないこと（S5）。`IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` は verified non-issue のため変更が無いことを確認する
- Non-scope（識別列 sticky、`ListShell.tsx:99` wrapper、`StockMovementsPage.tsx:98`、商品一覧以外の table 幅）に列挙した項目が変更されていないこと
- 在庫照会の上部 summary（S3b）が下部と同じ `statusValue === "all" && totalCount !== null` 条件で描画されること（round 2 是正）
- `IntegrityCheckPage.tsx:234` の Select 単独ラッパーに frame（`bg-card`）が付いていないこと、`IntegrityCheckPage.tsx:348`/`OperationLogsPage.tsx:496` の table wrapper が `rounded-lg` に統一されていること（round 2 是正、S1）
- フィルタ変更で `totalCount` が減っても `page > totalPages` の状態で描画される画面が無いこと（AC13、round 2 是正）

## Spec Contract

Contract ID: SPEC-UILB-D6

- 商品一覧の表が窓を狭めても toolbar 枠の幅を超えて出っ張らず部門列が折り返し（他 7 画面は不変）、ページ送りが上部常時表示（ボタンなし）・下部複数ページ限定へ切り分けられ、表示件数 `Select` の位置と filter/toolbar 枠の地色（既存 `--card`）が 8 画面で統一される

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UILB-D6 | L4-D2（商品一覧部門列） | `ProductTable.test.tsx` 新規 assertion | 商品一覧の折返し | vitest |
| SPEC-UILB-D6 | S1a〜S1g | 各 Page/Component test 拡張 | 枠地色 | vitest |
| SPEC-UILB-D6 | S2 | `Pagination.test.tsx` 拡張 | 上下切り分け | vitest |
| SPEC-UILB-D6 | S3a〜S3g | 各 Page test 拡張 + 重複文言 test 是正 | 上部 summary 常時表示 | vitest |
| SPEC-UILB-D6 | S4a〜S4b | 既存 SC10/SC9a rewrite・pass 維持 | Select 右端統一 | vitest |
| SPEC-UILB-D6 | S5 | `StocktakePage.test.tsx` 新規 assertion | fieldset ガード | vitest |
| SPEC-UILB-D6 | S6〜S8 | docs review（自動テストなし） | DSR-22/catalog ⑩⑯ の記述一致 | `rg` 完全一致 |
| SPEC-UILB-D6 | AC13（範囲外 page） | 新規 vitest 1 本 | page-reset handler 経路の維持 | vitest |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし

## Implementation Results

（Writer 実装後に記入。plan-draft 時点では未記入）

## Review Response

Plan Review round 1（独立 Sonnet subagent、fresh context + Opus 5、read-only claims-producer、D-056）: **reject**。P1 2 件、Coordinator が実装・既存 test に対して実読で裏取り:
- P1-1（accept）: `ListShell.tsx:99` の `w-min min-w-full` wrapper 撤去は、Lane 2 追補 S17（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`）が意図した「横 overflow 時に summary 帯が table 幅へ追随する」挙動を破壊する。owner が AC-L3-2（Lane 2 L3）で確認済み、`ListShell.test.tsx:343` が `className` の完全一致 assertion で保護している。是正: wrapper は不変のまま、旧 S1（wrapper 撤去）を全面撤回し、対象列の折返しで min-content の床を下げる方式へ転換
- P1-2（accept）: 表を縮ませる対象は `stickyHeader` を採用する商品一覧 `ProductListPage.tsx:284` の 1 画面のみで、他 7 画面は `table.tsx:9` の `overflow-x-auto` により内部 scroll するため出っ張らない。旧 S2b〜S2f（6 画面の長文列折返し・固定 table 幅撤去）を Non-scope へ撤回
- P2-9（accept）: `ProductTable.tsx` 部門列の折返しに新規 `min-w-*` の床を追加しない（既存 `whitespace-normal` 1 class のみ）
- round 2（独立 Sonnet subagent、Plan Review 継続）: 新規 P2 3 件、P3 2 件。P1-1/P1-2 は round 1 是正で解消済みのため round 2 の対象外（moot、既に反映済み）と明記:
  - P2（accept）: 上部 `PaginationSummary` 新設で件数文言が DOM に 2 回現れ、単数一致の `screen.getByText(...)` を使う既存 test（`IntegrityCheckPage.test.tsx:414`、`OperationLogsPage.test.tsx:280,292,419,431`、`StockInquiryPage.test.tsx:526`）が壊れる。S3 に是正を追加（`getAllByText`/`within` への書き換え）
  - P2（accept）: `PriceRevisionPage.test.tsx:660-669`（SC9a）を SC4b の配線退行 oracle として明示引用し、`onPerPageChange` 配線漏れ mutant を検出する既存 test であることを failure-mode に記録
  - P2（accept）: `AC5`/`S2` の oracle が誤り——`text-sm text-muted-foreground tabular-nums` は今日 0 件（下部は `text-sm text-muted-foreground`（外側）と `tabular-nums`（内側）に分割済み）。oracle を「新規に 1 箇所だけ出現する」検査へ訂正し、`rg -c` は一致行数を数える点を明記
  - P3（accept）: catalog `text-base text-foreground tabular-nums` の出現数を「起票時 2 箇所（`:612`,`:645`）」と明記
  - P3（accept）: catalog `:643`/`:648` の pre-S2（`totalCount===0`）記述を S7 に追加し、新旧の対句オラクルを記録

Plan Review round 2（Opus 5、read-only claims-producer）: **reject**（第 1 便のみ反映。Sonnet 側の並行 round 2 は rate limit で中断——Workflow State の妥当性検証のみ完了、実装差分の指摘には至らず）。Coordinator が実装・既存 test に対して実読で裏取り、item 1/3/4（部門列折返しの効果と floor 概算の是非）は owner 決定待ちのため本 commit では触れず、次便で扱う:
- P1（accept）: 在庫照会の下部 `<Pagination>` は `statusValue === "all" && data.totalCount !== null`（`totalCount: number | null`、`types.ts:54`）でのみ描画される。S3b の上部 `PaginationSummary` にも同一条件を明記し、AC4 に在庫照会の例外を追加した
- P2（accept）: `page > totalPages` の検知は `StockInquiryPage.tsx:196`/`OperationLogsPage.tsx:452` の 2 画面のみが専用 `EmptyState` を持つ。残り 6 画面向けに AC13 + Matrix SC8（1 本）を追加した
- P2（accept）: `PriceRevisionFilters.tsx:46` に取引先 native `<select>` が残る件は、lane ⑧（merge train Lane 5 → ⑧ → Lane 4）が本 lane の実装前に置換する前提であることを S4b に明記し、⑧ 未 merge のまま実装した場合の既知残件を新設 `## Residual Risk` に記録した（本 lane では対応しない）
- P2（accept）: `IntegrityCheckPage.tsx:234` は `phase === "completed" && result !== null` でのみ描画される Select 単独ラッパーで filter フィールドを持たないため、S1 の frame sweep（7→6 画面）と AC1/AC-L3-3 から除外した
- P3（accept）: `StocktakePage.tsx:821-852` の else 分岐は現在 `<Table>` を裸で返す。S3a の記述を「1 行追加」から「Fragment/div で `<Table>` を包み直す」へ訂正した
- P3（accept）: filter frame が `rounded-lg` になる一方、`IntegrityCheckPage.tsx:348`/`OperationLogsPage.tsx:496` の table wrapper が `rounded-md` のまま残ると角丸が食い違う。S1g（新設）で両 file の `rounded-md` → `rounded-lg` を同じ sweep に含めた（`bg-card` は付けない）
- 本 packet はこれらすべてを反映済み。item 1/3/4（floor 概算・折返し効果、owner 決定待ち）は次便で扱う。次回 Plan Review で新規 P1/P2 なしを確認後、`plan-gate -> plan-approved` へ進める予定
- Findings Freeze: not yet frozen（round 1/2 是正の再レビュー、および item 1/3/4 の owner 決定が未完了のため）; post-freeze exceptions: none.
