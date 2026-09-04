# Test Design Matrix: UI 一覧の背骨 D — Lane 2（PageShell / ListShell / Pagination 移設 / token）

Plan Packet: [../2026-09-03-ui-list-backbone-d-lane2.md](../2026-09-03-ui-list-backbone-d-lane2.md)

## Risk

R3（route/search state + operator workflow の見た目変更）。render の実追従（sticky 帯 / 余白 / 濃化 / 境界線）は happy-dom で判定できないため L3 が oracle、本 Matrix は DOM 構造・class・文言・配線の契約に限定する。

## Contracts Under Test

- SC1: token 4 件（`--border-strong` / `--row-current` / `--border` / `--input`）+ `@theme` map 2 件
- SC2a / SC2b: `PageShell` の root 契約（`cn` 順序含む）/ page root 全置換
- SC3a / SC3b / SC3c: 範囲付き文言 / 0 件契約 / `PaginationSummary` text-only + typography
- SC4a〜SC4e: `ListShell` の toolbar 枠 / topSummary + gating / skeleton / sticky 帯（th cell 単位）+ `border-separate` + th / td cell 罫線 + `h-10` `whitespace-nowrap` + overflow 上書き / pager 配線
- SC5a / SC5b / SC5c: 商品一覧 既定 100（URL 優先）/ pilot 構成（isLoading、0 件）/ returnTo 保持
- SC6 / SC7 / SC8 / SC9（Gated Amendment 2）: SegmentedControl 群枠 / PLU 一括 caption + group / sticky 帯 surface `--list-head` / dialog target 保持
- SC13（Gated Amendment 3 追補 S16）: globals.css の forced-colors focus outline（fs literal）。SC10 は追補 S17（wrapper `w-min min-w-full` / 帯 `overflow-hidden` + `[&>div]:truncate` + `forced-colors:border-b`）、SC12 は追補 S18 / S19（mockup 3 file 帯化 / history 文言 / 同一明度 字面）で拡張
- SC10 / SC11 / SC12（Gated Amendment 3）: summary 帯と thead の垂直隣接 + `px-2` inset（正負の oracle）/ PLU 一括 caption 独立行左寄せ 2 段 + 実件数 3 分岐 + `aria-describedby` + dialog title 同期 / mockup `.pager.top` + catalog ⑯ + 文言表の presence / absence 対 oracle
- SC14a / SC14b（Gated Amendment 4）: mockup 5 file の画面 markup が現実装と Lane 2 差分に限定され架空 field・未実装機能・後続候補を描かないこと（SC14a）/ 末尾 note が 今回採用・現実装維持・後続候補・owner L3 所感 の 4 区分で残ること（SC14b）

## Failure Modes

- token が未宣言・旧値・`@theme` 未 map・`--input` が旧値のまま（階層反転）
- `PageShell` が `space-y` を上書き可能 / `min-h-screen` 混入 / 置換漏れ
- from / to の off-by-one、to の未 clamp、0 件で「0〜0 件目」
- Summary にボタン混入、14px のまま、topSummary 既定 true、0 件で summary / pager 描画
- skeleton 時に children も描画
- sticky class 欠落、`border-separate` 欠落、th / td の cell 罫線欠落（tbody の区切り線が消える）、overflow 上書き欠落、summary が帯に入らない・2 行に折り返す、caller className 方式への逸脱
- pager の onPageChange 未配線
- 既定 100 が URL 明示値を上書き、`returnTo` が perPage を落とす、棚卸し既定が巻き込まれる
- `components/patterns` が `features` を import

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 token | 値違い / 未宣言 / 未 map | unit（fs literal oracle、`readFileSync("src/styles/globals.css")`） | SC1: globals.css declares border-strong #8a8480, row-current #fff8e6, border #cdc8c4, input var(--border-strong) and maps color-border-strong / color-row-current | 6 literal のいずれかが独立転記値（test 内 literal、production 定数を import しない）と不一致 |
| SC2a PageShell root | `space-y-6` / `p-6` 欠落、className が上書き | unit | SC2a: PageShell renders a single root with space-y-6 p-6, appends className="relative", and keeps space-y-6 when className="space-y-4" is passed | root の classList に `space-y-6` と `p-6` の両方が無い、`relative` が付かない、`space-y-4` を渡して `space-y-6` が消える、または root が複数 |
| SC2b page root 全置換 | 置換漏れ | unit（fs scan、`src/features/**/*Page.tsx` を glob し test 除外） | SC2b: no feature page file declares a p-6 root className outside PageShell | 正規表現 `className="[^"]*\bp-6\b` の hit が許容 2 箇所（card / overlay の独立転記 literal）以外に存在 |
| SC3a 範囲付き文言 | off-by-one / 未 clamp / locale 欠落 | unit | SC3a: Pagination shows "1,234 件中 1,001〜1,100 件目 · 11 / 13 ページ" for page 11 perPage 100 total 1234, "1,234 件中 1,201〜1,234 件目 · 13 / 13 ページ" for page 13, and "101 件中 101〜101 件目 · 3 / 3 ページ" for page 3 perPage 50 total 101 | 文字列完全一致（独立転記、検算: 11 ページ目 = 1001〜min(1100,1234)=1100 / 13 ページ目 = 1201〜1234 / 3 ページ目 = 101〜101）が不成立 |
| SC3b 0 件契約 | 「0 件中 0〜0 件目」/ ボタン enabled | unit | SC3b: Pagination with totalCount 0 renders "0 件" only and both nav buttons disabled | text に「件目」が含まれる、または `aria-label="前のページ"` / `"次のページ"` のいずれかが enabled |
| SC3c Summary text-only + typography | ボタン混入 / 14px | unit | SC3c: PaginationSummary renders the range text with text-base font-semibold tabular-nums and no button element | `queryAllByRole("button")` が 1 以上、文言不一致、または classList に `text-base` / `font-semibold` / `tabular-nums` のいずれかが無い |
| SC4a toolbar 枠 | 枠 class 欠落 / 2 段未分離 / toolbar 省略で枠が出る | unit | SC4a: ListShell wraps toolbar and toolbarSecondary in one rounded-lg border bg-card p-4 box as two rows, and renders no box when toolbar is omitted | 枠要素に `border` / `rounded-lg` / `bg-card` / `p-4` のいずれかが無い、toolbarSecondary が枠外、または toolbar 省略時に枠要素が存在 |
| SC4b topSummary + gating | 既定 true / 常時描画 / 0 件で描画 | unit | SC4b: ListShell renders PaginationSummary above the table only when topSummary is true and totalCount > 0, and renders neither summary nor bottom pager when totalCount is 0 | 省略時に summary text が存在、true 時に不在、table より後に出現、または totalCount 0 で summary / pager のいずれかが存在 |
| SC4c skeleton | children も描画 | unit | SC4c: ListShell renders ListSkeleton (or given skeleton) instead of children while isLoading | isLoading 時に children の test id が存在、または `aria-label="一覧を読み込み中"` が不在 |
| SC4d sticky 帯 | class 欠落 / separate 欠落 / cell 罫線欠落 / overflow 上書き欠落 / 2 行化 | unit | SC4d: ListShell with stickyHeader marks the summary band sticky top-0 z-20 h-10 whitespace-nowrap bg-muted, every thead th sticky z-10 bg-muted border-b-2 with top-10 when the summary band is rendered and top-0 when topSummary is false, every tbody td border-b (last row border-b-0), table border-separate border-spacing-0, and overrides table-container overflow to visible — all via ListShell root classes; without stickyHeader none is applied | summary の classList に `sticky` / `top-0` / `h-10` / `whitespace-nowrap` / `bg-muted` のいずれかが無い、`thead th` に `sticky` / `bg-muted` / `border-b-2` のいずれかが無い、summary 帯ありで `top-10` が無い、`topSummary` 偽で `top-0` でなく `top-10` が付く、`tbody td` に `border-b` が無い、table に `border-separate` が無い、`[data-slot=table-container]` の overflow 上書き class が無い、children 側の `Table` に className が渡っている、または false 時にも付与 |
| SC4e pager 配線 | onPageChange 未配線 | unit | SC4e: clicking 次のページ in ListShell bottom pager calls pagination.onPageChange with page+1 | mock が呼ばれない、または引数違い |
| SC5a 既定 100 | 既定 50 のまま / URL 上書き | unit | SC5a: ProductListPage requests per_page 100 by default and per_page 50 when URL perPage=50 | `searchProducts` mock の `per_page` が既定で 100 でない、または URL 明示 50 が 100 に化ける |
| SC5b pilot 構成 | ListShell 未経由 / isLoading 未配線 / 0 件で summary | unit | SC5b: ProductListPage renders top summary text, toolbar box, and bottom pager wired to search state; shows ListSkeleton while loading; renders EmptyState without summary or pager for 0 results | summary text 不在、枠不在、次のページ click で search state の page が進まない、loading 時に `aria-label="一覧を読み込み中"` 不在、または 0 件で「0 件」text / pager が存在 |
| SC5c returnTo 保持 | perPage 脱落 | unit（既存 `ProductListPage.test.tsx:218,222` の更新） | SC5c: returnTo search string carries the current perPage (100 by default, 200 after Select change) | `returnTo` に `perPage=100` / `perPage=200` が含まれない |
| 文言 regression | 旧文言残存 | 既存 test 更新 | IntegrityCheckPage / StockInquiryPage / OperationLogsPage の `件中` assert 6 箇所 | 新文言で fail（更新は期待値置換のみ、削除・skip 不可） |
| 棚卸し既定 | 巻き込み | 既存 test（無変更） | `StocktakePage.test.tsx` T2 / T3 `per_page: 50` | 50 以外 |
| SC6 SegmentedControl 群枠 | stone-300 直書き残存 / 群枠なし | unit（`SegmentedControl.test.tsx` + fs literal） | SC6: SegmentedControl group wrapper has border-border-strong and the source contains no stone-300 literal; unselected items stay buttons | wrapper の token 完全一致 classList に `border-border-strong` が無い、file に `stone-300` が残る、または未選択肢が `button` role でない |
| SC7 PLU 一括 caption | caption 欠落 / group 外 | unit | SC7: ProductListPage renders the "PLU 一括操作" caption with 絞り込みに一致する商品すべてが対象 and both PLU bulk buttons inside the same labelled group | caption text 不在、または 2 button の `closest('[role=group]')` が異なる / null |
| SC8 sticky 帯 surface | `bg-muted` 残存 / 帯と th の token 不一致 | unit | SC8: ListShell with stickyHeader applies bg-list-head to the summary band, thead th and thead tr, and no bg-muted remains on them | いずれかに `bg-list-head` が無い、または `bg-muted` が残る |
| SC9 dialog target 保持 | close で target が反転 | unit（`vi.mock` で dialog props 記録） | SC9: after opening 対象から外す and cancelling, the last rendered PluBulkTargetConfirmDialog props keep pluTarget false while open becomes false | 最終 render の `pluTarget` が `true`、または `open` が false にならない |
| SC10 帯の隣接 + inset + 横追随 + ellipsis + forced-colors 線 | 帯と table の間に page 地 / 左基準線ずれ / root の `space-y-3` 消失 / wrapper 幅が table に追随しない / hard clip / forced-colors で帯消失 | unit（`ListShell.test.tsx`） | SC10: ListShell with stickyHeader and topSummary renders the summary band with px-2, overflow-hidden, child truncate and forced-colors border inside a wrapper whose className is exactly w-min min-w-full and is not the root, the root keeps space-y-3, and the band's next sibling is the table container | 帯の classList に `px-2` / `overflow-hidden` / `[&>div]:min-w-0` / `[&>div]:truncate` / `forced-colors:border-b` のいずれかが無い、裸の `truncate` が残る、wrapper の `className` が `w-min min-w-full` と不一致、wrapper が `container.firstElementChild` と同一、root の classList に `space-y-3` が無い、または `nextElementSibling` が `[data-slot=table-container]` でない |
| SC11 caption 2 段 + 実件数 + dialog title | 文言分岐誤り / describedby 欠落 / 右寄せ・`ml-auto` 残存 / dialog title 旧文言 | unit（`ProductListPage.test.tsx`、total_count 1234 / 0 / 読込中、期待文言は test 内 literal） | SC11: ProductListPage renders the two-line PLU caption as a full-width left-aligned block, with the 1,234 件 sentence for total_count 1234, the disabled reason for 0, the loading sentence before data, the group described by the sentence, and the dialog title 絞り込みに一致する商品を… | (a)(b)(c) の文言完全一致が崩れる（「1,234」の桁区切りを含む）、group の `aria-describedby` が説明文 `id` を指さない、block の classList に `basis-full` / `items-start` が無い、`ml-auto` / `items-end` が残る、または dialog title に「表示中の商品を」が残る |
| SC12 mockup / catalog / 文言表 同期 | mockup 帯なし / catalog 字面 stale / 文言表 未登録 / 3 file 未帯化 / history 上部文言 / 同一明度 stale | doc oracle（rg、presence + absence） | SC12: mockup-d-lists nests `.pager.top` inside `.tbl` with `--d-head` as the Lane 2 pilot（`rg -c -F 'class="pager top"' mockup-d-lists.html` = 1）; history, home-sales-admin and import-export no longer render `.pager.top`（Amendment 4 closure round 1 で除去、`for f in mockup-d-forms-b mockup-d-history mockup-d-home-sales-admin mockup-d-import-export; do rg -c -F 'class="pager top"' $f.html; done` = 0/0/0/0）; history has no 件目を表示; catalog ⑯ item 3 carries the new wording and item 1 says 3 段; the wording table registers the caption and the new dialog title | S15 Spec の 7 本、S18 Spec の 3 file × 3 本 + history 1 本、S19 Spec の 2 file × 2 本 のいずれかが期待値と異なる、または 3 file の `class="pager top"` が 1 以上 |
| SC13 forced-colors focus | forced-colors で focus 不可視 / block が `@layer` 内 / outline 幅 0 | fs literal（`globals.css`、`globals.test.ts`） | SC13: globals.css declares exactly one forced-colors media block at brace nesting depth 0 whose :focus-visible rule pins outline: 2px solid Highlight | `@media (forced-colors: active)` が 1 件でない、block 開始位置までの `{` / `}` 対応数が 0 でない（`@layer` 内）、または block 内に `:focus-visible` と literal `outline: 2px solid Highlight` が無い |
| SC14a mockup 画面 markup | mockup の画面 markup が架空 field / 未実装機能 / Lane 3〜5 候補を実装済み UI として描く | doc oracle（5 HTML の `rg -v 'class="note"'` で note を除いた画面 markup 範囲 ↔ current source / function-design の対照、presence + absence。Writer が起票時実測で shell command と件数を確定） | SC14a: screen markup of the five mockups matches current runtime information and controls — no 実行者, no nested detail table, no すぐ確認 / 平均単価 / 部門数 summary card, print controls aria-disabled, no fixed-column class in import-export, history and forms-b 棚卸しカウント一覧 fixed columns per DSR-22 mapping（`01-decision-rules.md:434`、mapping 対象画面の例外、Coordinator 裁定）, no `.pager.top` outside `mockup-d-lists.html`, no forbidden signature（`<label>期間 ` / `詳細ページを開く` / `関連 movements を見る` / `結果（前回の取込み）` / `memory No.` / receiving の `入力中` / backup の `の状態に戻す`） | 画面 markup 範囲の absence 語が残る、presence 語（`入庫・出庫` / 4 action label / `販売点数` / `売上明細数` / `前日比` / `Z001 / Z002 / Z005` / 説明文 / Backup 列順）が欠ける、印刷が active、import-export に固定列 class がある、または forbidden signature が画面 markup 範囲に 1 件以上残る |
| SC14b mockup 所感 note | note が 4 区分に分かれず後続候補が採用に見える | doc oracle（5 HTML を `sed -n '/<\/main>/,$p'` で末尾 note 範囲に限定、presence） | SC14b: each mockup's trailing note (after `</main>`) ends with the four sections 今回採用（Lane 2）/ 現実装維持 / 後続候補（本 mockup へ描かない）/ owner L3 所感 each exactly once, with no 番号付き保留項目 | いずれかの file で末尾 note 範囲の 4 見出しのどれかが 0、または `番号付き保留項目` ≥ 1 |

### SC14a / SC14b 実測表（Writer 起票時実測、2026-09-04、Amendment 4 closure round 1 で scope 分離・再実測）

SC14a（画面 markup 範囲）の absence / presence は `rg -v 'class="note"'` を通し `class="note"` を含む物理行（mid-screen note・末尾 position note とも 1 行 1 note）を除外する。SC14b（末尾 note 範囲）は `sed -n '/<\/main>/,$p' <file>` で `</main>` 以降だけに絞ってから数える（P2-1 是正、mid-screen note を含めた file 全体カウントは併記のみで oracle には採用しない）。presence の複数語チェックは `for w in …; do rg -c -F -- "$w" <file>; done` で個別に実行し、no-match は `rg` の exit 1 のまま件数 0 として明示する（合算 `\|` alternation は使わない）。

| Check | Command | 実測値 | 結果 |
|---|---|---|---|
| SC14a absence: history `実行者` | `rg -n '実行者' docs/design-system/reference/mockup-d-history.html \| rg -v 'class="note"' \| wc -l` | 0 | green |
| SC14a absence: history nested detail table | `rg -n '<table>.*<table>' docs/design-system/reference/mockup-d-history.html \| wc -l` | 0 | green |
| SC14a absence: home-sales-admin `すぐ確認` | `rg -n 'すぐ確認' docs/design-system/reference/mockup-d-home-sales-admin.html \| rg -v 'class="note"' \| wc -l` | 0 | green |
| SC14a absence: home-sales-admin `平均単価` | `rg -n '平均単価' docs/design-system/reference/mockup-d-home-sales-admin.html \| rg -v 'class="note"' \| wc -l` | 0 | green |
| SC14a absence: home-sales-admin summary card `部門数` | `rg -n '部門数' docs/design-system/reference/mockup-d-home-sales-admin.html \| rg -v 'class="note"' \| wc -l` | 0 | green |
| SC14a absence: active 印刷 button（`aria-disabled` なし） | `rg -n '>印刷</button>' docs/design-system/reference/mockup-d-home-sales-admin.html \| rg -v 'aria-disabled' \| wc -l` | 0（日次 / 月次とも `aria-disabled="true"` 付き 1 件ずつ） | green |
| SC14a absence: import-export 固定列 class | `rg -n 'class="id"\|class="id2"' docs/design-system/reference/mockup-d-import-export.html \| wc -l` | 0 | green |
| SC14a S28 absence: `.pager.top`（forms-b / history / home-sales-admin / import-export、`mockup-d-lists.html` の pilot は対象外） | `for f in mockup-d-forms-b mockup-d-history mockup-d-home-sales-admin mockup-d-import-export; do rg -c -F 'class="pager top"' docs/design-system/reference/$f.html; done` | 0 / 0 / 0 / 0 | green |
| SC14a S29 absence: `<label>期間 ` / `詳細ページを開く` / `関連 movements を見る`（history） | `for w in '<label>期間 ' '詳細ページを開く' '関連 movements を見る'; do rg -n -F -- "$w" docs/design-system/reference/mockup-d-history.html \| rg -v 'class="note"' \| wc -l; done` | 0 / 0 / 0 | green |
| SC14a S29 presence: history 記録種別 / 記録ID filter・`詳細を見る` link・操作ログ subtitle | `for w in 記録種別 記録ID 詳細を見る システムの操作履歴を期間・種別で確認します; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-history.html; done` | 3 / 4 / 2 / 2（filter label + note 参照を含む） | green |
| SC14a S30 presence: home 前日未取込み alert / 日次 `部門` 列 | `rg -c -F -- "前日分が未取込みです" docs/design-system/reference/mockup-d-home-sales-admin.html; rg -n -F '<th>商品コード</th><th>商品名</th><th>部門</th>' docs/design-system/reference/mockup-d-home-sales-admin.html \| wc -l` | 2 / 1 | green |
| SC14a S30 presence: Backup 3 段の文言（`この控えに戻す` / `復元の確認へ進む` / `の控えに戻す`） | `for w in "この控えに戻す" "復元の確認へ進む" "の控えに戻す"; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-home-sales-admin.html; done` | 3 / 3 / 4 | green |
| SC14a S30 absence: `の状態に戻す`（backup 旧文言） | `rg -n -F -- "の状態に戻す" docs/design-system/reference/mockup-d-home-sales-admin.html \| rg -v 'class="note"' \| wc -l` | 0 | green |
| SC14a S31 absence: `結果（前回の取込み）` / `memory No.`（import-export） | `for w in '結果（前回の取込み）' 'memory No.'; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-import-export.html \|\| echo 0; done` | 0 / 0 | green |
| SC14a S31 presence: 商品一括インポート 4 summary（登録対象 / 新規候補 / 重複 / エラー）+ PLU 書出し設定 | `for w in 登録対象 新規候補 書出し設定 破棄して再書出し; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-import-export.html; done` | 2 / 2 / 3 / 2 | green |
| SC14a S32 absence: forms-a receiving `入力中`（左バー + badge） | `rg -n -F -- "入力中" docs/design-system/reference/mockup-d-forms-a.html \| rg -v 'class="note"' \| wc -l` | 0 | green |
| SC14a presence: `入庫・出庫` | `rg -c -F -- "入庫・出庫" docs/design-system/reference/mockup-d-home-sales-admin.html` | 3（見出し 1 + note 2） | green |
| SC14a presence: 4 action label | `for w in 入庫記録 返品・交換 手動販売出庫 廃棄・破損; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-home-sales-admin.html; done` | 各 3（sidebar nav + action + note） | green |
| SC14a presence: `販売点数` / `売上明細数` / `前日比`（個別） | `for w in 販売点数 売上明細数 前日比; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-home-sales-admin.html; done` | 4 / 2 / 2（`販売点数` は S27 で追加した `月間販売点数` の部分一致 2 件を含む） | green |
| SC14a presence: `Z001 / Z002 / Z005` | `rg -c -F -- "Z001 / Z002 / Z005" docs/design-system/reference/mockup-d-home-sales-admin.html` | 2 | green |
| SC14a presence: `日報取込み済み日の Z005 部門別売上合計です。` | `rg -c -F -- "日報取込み済み日の Z005 部門別売上合計です。" docs/design-system/reference/mockup-d-home-sales-admin.html` | 1 | green |
| SC14a presence: Backup 列順 `日時`→`サイズ`→`ファイル名`（S28 で `id` class 除去済み） | `rg -n -F '<th>日時</th><th class="num">サイズ</th><th>ファイル名</th>' docs/design-system/reference/mockup-d-home-sales-admin.html \| wc -l` | 1 | green |
| SC14a presence: history 固定列（DSR-22 mapping の例外画面） | `rg -n '<th class="id">記録日時</th><th class="id2">代表商品</th>\|<th class="id">日時</th><th class="id2">種別</th>' docs/design-system/reference/mockup-d-history.html \| wc -l` | 3（入出庫履歴 / 在庫変動履歴 / 操作ログ） | green |
| SC14a presence: forms-b 棚卸しカウント一覧 固定列（DSR-22 mapping `01-decision-rules.md:434`、history と同格の例外、Coordinator 裁定） | `rg -c '<th class="id">商品コード</th><th class="id2">商品名</th>' docs/design-system/reference/mockup-d-forms-b.html` | 1 | green |
| SC14a S27 presence: `月間売上合計` / `月間販売点数` / `前月比` | `for w in 月間売上合計 月間販売点数 前月比; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-home-sales-admin.html; done` | 2 / 2 / 2（各 summary card 1 行 + note 1 行） | green |
| SC14a S27 presence: `在庫整合性検証` / `整合性チェック実行` / `補正する` | `for w in 在庫整合性検証 整合性チェック実行 補正する; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-home-sales-admin.html; done` | 1 / 1 / 5（見出し説明文 1 + dialog 警告文「補正すると」1 + note 2 + S30 で追加した 操作列の checkbox aria-label・ラベル 1 行） | green |
| SC14a S27 presence: primary button `補正を確定` | `rg -n '>補正を確定<' docs/design-system/reference/mockup-d-home-sales-admin.html \| rg -v 'class="note"' \| wc -l` | 1（確定 button、画面 markup 範囲） | green |
| SC14a S27 absence: `チェックを実行` / `BIZ-05`（画面 markup 範囲） | `for w in "チェックを実行" "BIZ-05"; do rg -n -F -- "$w" docs/design-system/reference/mockup-d-home-sales-admin.html \| rg -v 'class="note"' \| wc -l; done` | 0 / 0（`BIZ-05` は note 側へ移設した 1 件のみ残存、画面 markup 範囲では 0） | green |
| SC14a S27 presence: 在庫少の基準 descriptor 実値 | `for w in "一般商品の基準（必須）" "生地の基準（必須）" "在庫がこの個数以下になったら在庫少（初期値: 3個）" "在庫がこの長さ以下になったら在庫少（初期値: 500cm = 5m）"; do rg -c -F -- "$w" docs/design-system/reference/mockup-d-home-sales-admin.html; done` | 1 / 1 / 1 / 1（`extract-thresholds.ts` descriptor から exact 転記） | green |
| SC14b STRICT: 4 見出し各 = 1（末尾 note 範囲のみ、5 file） | `for f in forms-a forms-b history home-sales-admin import-export; do for h in "今回採用（Lane 2）" "現実装維持" "後続候補（本 mockup へ描かない）" "owner L3 所感"; do sed -n '/<\/main>/,$p' docs/design-system/reference/mockup-d-$f.html \| rg -c -F -- "$h"; done; done` | forms-a 1/1/1/1、forms-b 1/1/1/1、history 1/1/1/1、home-sales-admin 1/1/1/1、import-export 1/1/1/1（すべて厳密に 1） | green |
| SC14b（参考）: file 全体カウント（mid-screen note 含む、oracle 非採用） | `for f in forms-a forms-b history home-sales-admin import-export; do for h in "今回採用（Lane 2）" "現実装維持" "後続候補（本 mockup へ描かない）" "owner L3 所感"; do rg -c -F -- "$h" docs/design-system/reference/mockup-d-$f.html; done; done` | forms-a 1/1/1/1、forms-b 1/1/1/1、history 1/2/2/1、home-sales-admin 1/5/5/1、import-export 1/4/4/1（すべて ≥ 1、参考値） | green |
| SC14b: `番号付き保留項目` = 0（5 file） | `for f in forms-a forms-b history home-sales-admin import-export; do rg -c -F '番号付き保留項目' docs/design-system/reference/mockup-d-$f.html \|\| echo 0; done` | 0 / 0 / 0 / 0 / 0 | green |

## State Lifecycle Matrix

| State/subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 商品一覧 `perPage`（URL search） | URL なし → 100 / URL 明示 → その値 | — | 一覧 100 件 | `Select` 変更で URL 更新 | search 再実行 | `returnTo` 復元で保持 | 再起動で URL 依存 | — | — | SC5a / SC5c / AC-L3-3 |
| ListShell `isLoading` | false | true → skeleton | children | query 再実行で true | — | — | — | error は caller の `EmptyState`（children 内） | — | SC4c / SC5b |
| ListShell summary / pager | totalCount 0 → 非描画 | — | totalCount > 0 → 描画 | 絞り込みで 0 件 → 非描画 | — | — | — | — | — | SC4b / SC5b |
| pager page | 1 | — | onPageChange(page+1) | — | — | — | — | 端で disabled | — | SC4e / SC3b |

## Adjacent Pattern Audit

| Source pattern/contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test/evidence |
|---|---|---|---|---|
| 04 原則 6 page root | `src/features/**/*Page.tsx` 45 hit / 28 file | 43 箇所 → `PageShell` | card / overlay の `p-6` 2 箇所（root ではない） | SC2b / AC2 |
| catalog ⑩ `ProductPagination` → `Pagination` | 8 caller | 移設 + 文言を全 caller | ListShell 化は pilot のみ（Lane 3〜5） | SC3a / AC3 / regression |
| catalog ⑯ ListShell | 商品一覧 | pilot | 他 7 画面 + 識別列固定（D-2） | SC5b |
| DSR-17 `<main>` scroll | `RootLayout.tsx:65` / `table.tsx:9` | overflow 上書きのみ | `data-scroll-restoration-id` 非接触、箱内スクロール不採用 | SC4d / Review Focus |
| `components/patterns` 非依存 | `rg 'from "@/features' src/components/patterns` = 0 | 維持 | — | AC4 |
| `@layer base * border-color` | globals.css:96-98 | token 値変更のみ | dialog / sidebar は L3 標本に追加 | AC-L3-1 |

## Negative Paths

- `PageShell className="relative"` で base class が残る、`className="space-y-4"` で `space-y-6` が残る（SC2a）
- `totalCount` 0 / 端数最終ページ / perPage 200 で to = total（SC3a / SC3b）
- `topSummary` / `stickyHeader` 省略時に何も付かない、0 件で summary / pager 非描画（SC4b / SC4d）
- URL `perPage=50` が既定 100 に化けない（SC5a）

## Boundary Checks

- from / to: page 1 → 1〜perPage、最終ページ → to = totalCount、totalCount < perPage → 1〜totalCount
- `toLocaleString("ja-JP")` の 3 桁区切りが n / from / to すべてに掛かる（SC3a の 1,234 case）
- sticky 帯の th offset は summary 高（`h-10` = `top-10`）と一致し、summary 帯なしのときは `top-0`、summary は `whitespace-nowrap` で 1 行固定（SC4d の class pair）

## Compatibility Checks

- `Pagination` props 不変（8 caller は import path / JSX 名のみ更新）
- `StocktakePage.test.tsx` diff 0 行
- `src/lib/bindings.ts` / `src-tauri` diff 0 行
- 旧 path `features/products/components/ProductPagination` 参照 0（AC3）

## Data Safety Checks

- synthetic seed のみ、永続化なし

## Main Wiring / Integration Checks

- helper connected to main path: `ListShell.pagination.onPageChange` が `ProductListPage` の search state 更新（`navigate({ search })`）へ配線されていること（SC5b で page 遷移を検証）
- `isLoading={productsQuery.isLoading}` が ListShell へ渡り、自前 `Skeleton` が削除されていること（SC5b）
- `PageShell` が実 page から import されていること（SC2b の fs scan + AC2 の `rg -l "<PageShell"`）
- `@theme` map が生えた utility を ListShell の sticky 帯が `bg-muted` と併用（class oracle、SC4d）

## Mutation-style Adequacy Questions

- token の値を 1 文字変えたら SC1 が落ちるか（production 定数を import せず literal 転記か）
- 1 画面の root を旧 class に戻したら SC2b が落ちるか
- from の計算を `page*perPage` にしたら SC3a が落ちるか
- Summary にボタンを足したら SC3c が落ちるか
- overflow 上書き class だけ消したら SC4d が落ちるか
- th / td の cell 罫線 class だけ消したら SC4d が落ちるか
- `totalCount > 0` gating を外したら SC4b が落ちるか
- 既定を 50 に戻したら SC5a が落ちるか
- pilot から `isLoading` 配線を外したら SC5b が落ちるか

## 必須 mutation 注入（Final Review で clean tree 独立再実測）

| # | 注入 | kill 期待 |
|---|---|---|
| X1 | `globals.css` の `--border-strong` を `#e7e5e4` に変更 | SC1 |
| X2 | `PageShell` の base class から `space-y-6` を削除 | SC2a |
| X3 | `ProductListPage.tsx` の root を `<div className="space-y-4 p-6">` に戻す | SC2b |
| X4 | from の計算を `page * perPage` に変更 | SC3a |
| X5 | to の `Math.min(..., totalCount)` を外す | SC3a |
| X6 | `totalCount === 0` の分岐を削除 | SC3b |
| X7 | `PaginationSummary` に前へ / 次へボタンを描画 | SC3c |
| X8 | ListShell の toolbar 枠から `border` を削除 | SC4a |
| X9 | `topSummary` の `totalCount > 0` gating を外し 0 件でも描画 | SC4b |
| X10 | `stickyHeader` 時の overflow 上書き class を削除（sticky class は残す） | SC4d |
| X11 | ListShell 内 `Pagination` の `onPageChange` を no-op に差替 | SC4e |
| X12 | `search.ts` の perPage 既定を 50 に戻す | SC5a |
| X13 | ListShell の `isLoading` 分岐を外し常に children を描画 | SC4c |
| X14 | `ProductListPage` から `isLoading` prop の受け渡しを削除 | SC5b |
| X15 | ListShell の `thead th` から `border-b-2` を削除 | SC4d |
| X16 | ListShell の `tbody td` から `border-b` を削除 | SC4d |
| X17 | `segmented-control.tsx` の群枠を `border-stone-300` に戻す | SC6 |
| X18 | ProductListPage の PLU 一括 caption を削除 | SC7 |
| X19 | ListShell の summary 帯を `bg-muted` に戻す | SC8 |
| X20 | ProductListPage の dialog を `pluTarget={bulkTarget ?? true}` 単一 state に戻す | SC9 |
| X21 | ListShell の帯 + table wrapper を外し帯を root 直下へ戻す（gap 復活） | SC10 |
| X22 | ListShell の summary 帯から `px-2` を削除 | SC10 |
| X23 | ProductListPage の caption block の `items-start` を `items-end` に戻す | SC11 |
| X24 | ProductListPage の group から `aria-describedby` のみ削除 | SC11 |
| X25 | caption の `totalCount.toLocaleString("ja-JP")` を `String(totalCount)` に置換 | SC11 |
| X26 | caption 2 段目を旧括弧文言「（絞り込みに一致する商品すべてが対象・他ページ含む・確認画面あり）」に戻す | SC11 |
| X27 | caption の (b)(c) 分岐を削除し常に (a) の文を出す | SC11 |
| X28 | caption block の `basis-full` を `ml-auto` に戻す | SC11 |
| X29 | ListShell root から `space-y-3` を削除 | SC10 |
| X30 | `globals.css` の forced-colors block を削除 | SC13 |
| X31 | ListShell の wrapper から `w-min min-w-full` を削除 | SC10 |
| X32 | ListShell の帯から `[&>div]:truncate` を削除し裸の `truncate` に戻す | SC10 |
| X33 | ListShell の帯から `forced-colors:border-b` を削除 | SC10 |
| X34 | `globals.css` の forced-colors block を `@layer base { ... }` の内側へ移す（file 内の位置は現在のまま） | SC13 |

## Residual Test Gaps

- sticky 帯の実追従・境界線・余白・濃化の見え方は happy-dom で判定不能 → AC-L3-1 / AC-L3-2 が oracle。
- forced-colors は run 3 で PASS。OS 150% / in-app 特大 × OS 125% / form 150% は owner の実運用判断で Amendment 4 が残 Human Gate から除外（residual risk: その scale の崩れは未検出のまま merge、検出経路は Lane 3〜5 L3 + 実利用報告、packet AC-L3-4 disposition 参照）。
- mockup HTML の business semantics は source 対照 + AC-L3-5、presence / absence は SC14a（画面 markup）/ SC14b（所感 note）の doc oracle。
- `--row-current` は本 lane で消費者なし（宣言と 00 登録のみ、Lane 3〜5 で test 対象化）。
