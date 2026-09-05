# Plan Packet: UI 一覧の背骨 D — Lane 4（識別列固定 / ページ送りの上下切り分け / 表示件数の位置統一 / 枠の地色）

owner 決定（2026-09-05、[Plans.md ④](../Plans.md) R2-1/R2-2/R3-2/R5-2/R5-4 各 sub-bullet + E12、`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md:95,109,145`）に基づき、「窓を狭めると表が枠から出っ張る」現象を Excel 型の識別列固定（商品コード + 商品名を左端に固定し、残りの列だけが `<main>` 基準で横に流れる）で解消し、ページ送りの上下帯を「上部は常時表示・ボタンなし」「下部は複数ページ時のみ」へ切り分け、表示件数 `Select` の位置と filter/toolbar 枠の地色を 8 画面で統一する。**item (1) は 2026-09-05 の owner 決定（第 2 便）で D（表を縮ませる）から識別列固定へ書き換えられた**（D は Opus round 2 の実測で効果僅少と判明、下記「起票時実測」節参照）。E12 が当初示した「横 scroll 容器（新規 `overflow-x:auto` box）+ 識別列 sticky」案は、DSR-17 `<main>` 単一 scroll 契約と CSS の overflow 計算規則から Contract Probe（Playwright 不要）で不採用のまま——本 lane が採る識別列固定は**新規 scroll 容器を作らず**、`<main>`（既に `overflow-auto` で両軸 scroll 可能、`RootLayout.tsx:65`）を唯一の scroll container としたまま `position: sticky` の `left` オフセットを追加するだけで、sticky thead（`top` オフセット）と同じ scrolling ancestor を共有する。`ListShell` の予約 prop `identityColumns` を商品一覧のみで活性化する。

**Plan Review round 1（独立 Sonnet subagent + Opus 5 read-only claims-producer、D-056）は reject**。Coordinator が P1 を実装・既存 test に対して裏取りし、本 packet（plan-draft 差し戻し是正）へ反映した。要点: (1) `ListShell.tsx:99` の `w-min min-w-full` wrapper は撤去しない——Lane 2 追補 S17（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`）が横 overflow 時に summary 帯を table 幅へ追随させるために導入し、owner が AC-L3-2 で確認済み、`ListShell.test.tsx:343` が `className` の完全一致で保護している。是正は wrapper を触らず、対象列の折返しで min-content の床を下げること。(2) 表を縮ませる対象は**商品一覧 `ProductTable.tsx` のみ**——`stickyHeader` を採用するのは `ProductListPage.tsx:284` だけであり、他 7 画面は `table.tsx:9` の `overflow-x-auto` で内部 scroll するため page 地へ出っ張ることは無い。詳細は「起票時実測」節と `## Review Response` を参照。**round 2（Opus 5）も reject**（並行した Sonnet round 2 は rate limit で中断、Workflow State の妥当性検証のみ完了）: 上部 summary 導入に伴う既存 test の重複文言破綻・SC7b の配線退行 oracle・catalog 旧文言の対句・在庫照会の上部 summary 条件・整合性チェックの frame 除外・table wrapper の rounded-lg 統一・範囲外 page の検知漏れを指摘、いずれも本 commit（第 1 便）で反映済み。item (1) 折返しの効果と floor 概算（Opus #1/#3/#4）は owner 決定待ちのため第 2 便で扱う。

## Workflow State

- Phase: human-confirm
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 59c243d
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer、D-056）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer）+ Codex ロジックレビュー 1 回（Codex 枠切れ、2026-09-07 夜の週次リセット後。§3.3 Capacity-degraded により pending、human-confirm で待機し Phase を前進させない）
- Reviewed Content HEAD: ae45f17
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3 — AC-L3-1 商品一覧で窓を狭めると商品コード + 商品名と列見出しが固定されたまま toolbar 枠を含む右側だけが横に流れ、縦 scroll でページが横にジャンプせず、識別列の hover/選択行/現在行背景の見え方を確認する, AC-L3-2 ページ送り上下（複数ページの画面 1 つ + 単一ページの画面 1 つ）, AC-L3-3 表示件数 Select の位置と枠の地色が 6 画面で揃う（整合性チェックの単独 Select は対象外、下記 S1 参照）

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
8 一覧画面（商品一覧 / 棚卸し / 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ / 一括価格改定 / 整合性チェック）の operator workflow に見える見た目変更（商品一覧の識別列固定、ページ送りの上下帯構成、表示件数 `Select` の位置、filter/toolbar 枠の地色）+ 共有 UI primitive（`Pagination`/`PaginationSummary`、Button/Badge と並ぶ widely-shared component）の contract 変更。DB スキーマ・Tauri command DTO・POS CSV・PLU TSV 形式の変更はない。DEV_WORKFLOW Risk Tiers の R3「route/search state, operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

**Stacked train（D-074、AGENT_OPERATING_MANUAL §3.3 Stacked train 節）**: 本 branch は当初 Lane 5（`agent/ui-list-backbone-d-lane5`、tip `04f89a4`）から作成した。2026-09-06、⑧（`agent/ui-select-unify`、native `<select>` 16 箇所 → shadcn `Select` 置換、human-confirm 中）の tip `885c10d` に単段 merge `d8a659b` で積み直し済み（旧起点 Lane 5 tip `04f89a4`。plan-first commit `59c243d` とその子孫は SHA 不変、rebase なし、D-039/PK5「Plan Commit ancestry」）。conflict は `docs/Plans.md`（⑧ の ⑧/ブロッカー節と本 branch の ④ Lane 4 節、両方保持）のみで、`ort` strategy による自動解決（conflict marker 0 件を確認済み）。merge delta は `InventoryRecordsPage.tsx`/`OperationLogsPage.tsx`/`PriceRevisionFilters.tsx`/`StockMovementsPage.tsx` 等の native `<select>` → shadcn `Select` 置換を含み、本 packet の該当行番号引用（S1c/S1e/S1f/S3c/S4b 等）を re-stack 後の値へ再検証・更新済み（起票時実測「re-stack 後の行番号再検証」節参照）。forward state-only は本 lane 自身で 1 本（human-confirm → ready-hosted-final）に抑え、他の遷移は content commit 同乗で行う（D-074 rules、forward state-only budget 1）。

## Goal

Goal Invariant:

### 最小完了条件

- 商品一覧で、窓を狭めると商品コード + 商品名（列見出しを含む）が `<main>` を基準に左端固定され、toolbar/filter 枠を含む右側の要素だけが横に流れる（Excel の行/列固定と同じ体験。round 3 是正: toolbar 自体の sticky 化は no-op のため対象外、下記「非目的」参照）。Lane 2 の「横 overflow 時に summary 帯が table 幅へ追随する」挙動自体は不変・維持
- 上部に `PaginationSummary`（範囲付き統一形、`text-sm text-muted-foreground`、ボタンなし）が `totalCount > 0` のとき常に表示される（`ListShell` の 1 画面 + 新規 7 画面）
- 下部 `Pagination`（summary + 前へ/次へ）は `totalPages > 1` のときだけ表示され、`totalPages <= 1`（0 件を含む）では何も描画しない
- 表示件数 `Select` が 8 画面すべてで toolbar/filter 枠内の最後尾（右端）に位置する
- 検索欄・取引先・部門などを囲む filter/toolbar 枠の地色が 8 画面すべてで既存 `--card` #f5f5f4 に統一される（新規 token なし）

### 失敗定義

- 商品一覧で窓を狭めたときに商品コード・商品名・列見出しが固定されない、または縦 scroll でページ全体が横にジャンプする
- 他 7 画面に `identityColumns` を配線してしまう、または table 幅・長文列に不要な変更を加えてしまう（Non-scope 逸脱、後続 lane で opt-in する）
- 上部 summary が 7 画面のいずれかで欠落する、または `totalCount === 0` の場面で誤って描画される、または新規追加により既存の件数文言 assertion（`getByText` 単数一致）が壊れたまま放置される
- 下部 `Pagination` が単一ページで描画される、または複数ページで誤って非表示になる（51 件 / perPage 50 の 2 ページ目で「前へ」が消える等）
- 表示件数 `Select` が 8 画面のいずれかで枠外、または枠内の最後尾以外に残る
- 8 画面のいずれかで枠地色が `bg-card` にならない、または新規 token を追加してしまう
- `ListShell.tsx:99` の `w-min min-w-full` wrapper を撤去・変更してしまう、または新規 `overflow-x:auto` スクロール容器を作ってしまう（`<main>` 単一 scroll 契約からの逸脱）

### 非目的

- `ListShell.tsx:99` の `w-min min-w-full` wrapper の撤去・変更（Lane 2 追補 S17 の既存挙動を維持する）
- 新規 `overflow-x:auto` スクロール容器の導入（E12 当初案、DSR-17 `<main>` 単一 scroll 契約と衝突するため不採用のまま）
- 商品一覧以外の 7 画面（棚卸し / 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ / 一括価格改定 / 整合性チェック）への `identityColumns` 配線・table 幅変更。いずれも `stickyHeader` を使わず `table.tsx:9` の `overflow-x-auto` で内部 scroll するため、窓を狭めても page 地へ出っ張ることはない。将来 opt-in する場合も同じ `identityColumns` 機構を再利用する（本 lane では配線しない）
- 固定列 cell の行 hover（`hover:bg-muted/50`）・選択行（`data-[state=selected]:bg-muted`）背景への追随（`bg-background` 固定という既知の trade-off、Residual Risk 参照）
- 列幅の動的計測（`ResizeObserver` 等）。商品コード列は固定 width class（`w-28`）を採用する
- 非 ListShell 画面を `ListShell` 化すること（frame class は直接適用し、component 差し替えは行わない）
- `Playwright` の devDep 追加（Plans.md ④ の旧記述はこの packet が supersede する。probe は CSS 仕様の静的確認のみで足り、headless browser は不要）
- R2-3 / R2-4（在庫照会の展開行再クリック・検索条件追加）、badge 色（⑦）、native `<select>` → shadcn `Select` 置換（⑧）
- `StockMovementsPage.tsx:98` の商品情報 card（既存 `rounded-lg border bg-card p-4`、本 lane の filter 枠とは無関係の別 section）への変更
- `PriceRevisionTable.tsx` の商品名・table 幅・入力欄の変更全般（Non-scope に縮小。7 画面の table 幅変更を全体で不採用としたことに伴い、当初想定していた `min-w-[1280px]` 撤去・商品名折返しも取り下げる。旧 L4-D6 の residual risk 記録は削除し、狭幅時の水平 scroll はそもそも内部 scroll として現状のまま許容する）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、worktree base `04f89a4`〈Lane 5 branch tip、Draft PR #35 human-confirm 中〉、すべて本 packet 起草者が rg で再確認。行番号は Lane 5 実装後の現行値であり、Plans.md ④ の R2-1〜R5-4 起草時点の行番号とは異なる。Plan Review round 1/2 是正で本節を全面改訂）

### re-stack 後（2026-09-06、⑧ tip `885c10d` へ単段 merge `d8a659b`）の行番号再検証

- ⑧ の native `<select>` → shadcn `Select` 置換により、本 packet が引用する `InventoryRecordsPage.tsx`/`OperationLogsPage.tsx`/`PriceRevisionFilters.tsx` の行番号がずれた（`StockMovementsPage.tsx`/`IntegrityCheckPage.tsx`/`StockInquiryPage.tsx`/`StocktakePage.tsx` は ⑧ の diff に含まれず無変更、`git diff` で確認済み）。全 file を `rg` で再実測し、Scope S1c/S1e/S1f/S3c/S4b・起票時実測サーベイ表・AC1/AC6/AC13・Review Response の該当行を更新した
- `InventoryRecordsPage.tsx`: frame `:159`（不変）、`<Table>` `:341`（旧 `:333`）、`<Pagination` `:395`（旧 `:387`）、記録種別/部門/状態は shadcn `Select` に、開始日/終了日/記録ID は native のまま
- `OperationLogsPage.tsx`: frame `:346`（旧 `:344`）、table wrapper `:502`（旧 `:496`）、`outOfRange` `:455`（旧 `:449`）、重複文言 test 4 箇所 `:281,293,420,432`（旧 `:280,292,419,431`）
- `PriceRevisionFilters.tsx`: frame `:40`（旧 `:33`）、filter 行 `:41-101`（旧 `:34-91`）、取引先は native `<select>`（旧 `:46`）→ shadcn `Select`（`id="price-revision-supplier"`、`:53-71`）に置換済み——S4b の Residual Risk 既知残件はこれで解消
- `PriceRevisionPage.test.tsx`: SC9a `:694-703`（旧 `:660-669`）
- `IntegrityCheckPage.tsx`/`StockInquiryPage.tsx`/`StocktakePage.tsx`/`StockMovementsPage.tsx`: ⑧ の diff に含まれず、本 packet が引用する行番号（`:234`,`:348`,`:417`,`:194`,`:526`,`:98`,`:134`,`:243`,`:854`,`:1042`,`:1055` 等）はすべて不変

### ListShell / table primitive の overflow 機構（`w-min min-w-full` wrapper は不変）

- `table.tsx:9` の `Table` container は `relative w-full overflow-x-auto`（data-slot=table-container）。通常の非 sticky 画面ではこの `overflow-x-auto` が横 overflow 時に**内部スクロールバー**を出し、page 地には出っ張らない（7 画面はこの経路のみで、本 lane の対象外）
- `ListShell.tsx` の `STICKY_TABLE_CLASSES`（`:40-63`）は sticky 時に `[&_[data-slot=table-container]]:overflow-visible` でこの内部スクロールを打ち消す（sticky thead の `top` 基準を `<main>` に保つため。DSR-17 `:292` が `<main>` を唯一の scroll container と定める契約に従う設計）
- `ListShell.tsx:99` の帯+table wrapper `<div className="w-min min-w-full">` は Lane 2 追補 S17（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`）で導入された、横 overflow 時に summary 帯が table 幅へ追随する意図した挙動（owner AC-L3-2 確認済み、`ListShell.test.tsx:343` 完全一致で保護）。**本 lane はこの wrapper に一切触れない**（round 1 是正で確定済み、item (1) の書換え後も変更不要）

### item (1) 書換えの経緯（owner 決定 2026-09-05、第 2 便）: D（表を縮ませる）の効果は実測で僅少

- round 1/2 是正で「表を縮ませる」対象を商品一覧 `ProductTable.tsx` の部門列折返しに限定していたが、Opus round 2 の追加測定（item #1/#3/#4）で、部門列の折返しが table の min-content floor に与える効果は **−0〜56px 程度**に留まると判明した。floor の主因は部門列ではなく **商品名列 `min-w-[14rem]`＝224px の固定 floor** と **売価・原価・在庫数の数値 3 列（nowrap 前提、折返し不可）** であり、部門列だけ折り返しても table 全体の floor はほとんど動かない
- owner はこの実測を受け、D（部門列折返し）を**取り下げ**、item (1) を識別列固定（Excel 型、商品コード + 商品名を左端に固定し残りが `<main>` 基準で横に流れる）へ書き換えた。旧 L4-D2（`ProductTable.tsx` 部門列 `whitespace-normal`）・floor 概算節・AC-L3-1 の「部門列が折り返す」記述はすべて本節と Design Intent Trace の書換えで置き換える。`ProductTable.tsx` の既存 column class（商品名の `min-w-[14rem] whitespace-normal` を含む）は無変更のまま

### 識別列固定の実装方式：新規 scroll 容器を作らない（Contract Probe、round 1 の CSS 根拠を維持しつつ新方式を確定）

- **E12 当初案（新規 `overflow-x:auto` box + 識別列 sticky）は引き続き不採用**: CSS Overflow の仕様上、要素の `overflow-x` と `overflow-y` の一方が `visible` 以外（例: `auto`）のとき、`visible` のままのもう一方は `auto` へ computed される。したがって「表を新規の横 scroll 容器（`overflow-x: auto`）に包む」設計は、その要素を**縦方向にもスクロール可能な独立 scrolling ancestor**に変え、DSR-17 `:292` が `<main>` を唯一の scroll container と定める契約と衝突し、sticky thead の `top` 基準（`<main>` 相対）と両立しない。この結論は CSS 仕様から静的に導けるため、Playwright / headless Chromium での実行時 probe は不要（Contract Probe = 本節の記述そのもの、追加実験なし、N/A）
- **owner が採る新方式は「新規容器を作らない」**: `RootLayout.tsx:65` `<main data-scroll-restoration-id="main" className="min-h-0 min-w-0 overflow-auto">` は Tailwind `overflow-auto`（= `overflow: auto`、両軸）を既に持ち、`<main>` は**縦・横どちらの overflow でも既に scroll 可能**（実装確認済み、追加実験不要）。したがって table の内容幅が toolbar 幅を超えたとき、`ListShell.tsx:99` の wrapper が広がった分だけ `<main>` 自体が横スクロールする——これは E12 案のような「新規のローカル scroll 容器」ではなく、sticky thead が既に前提としている scrolling ancestor（`<main>`）と**同一**である
- CSS の `position: sticky` は `top`/`left`/`right`/`bottom` を独立に指定でき、1 要素が複数軸で sticky になることは仕様上問題ない。したがって識別列（`thead th`/`tbody td` の先頭 1・2 列目）に `sticky left-*` を追加しても、既存の `sticky top-*`（thead 全体）とは独立して共存する——`<main>` が縦に scroll すれば `top` 基準で、横に scroll すれば `left` 基準で、それぞれ独立に固定される
- 結論: 識別列 sticky そのものは Non-scope ではなくなった。Non-scope のまま残るのは「新規 scroll 容器を作る」実装方式（E12 当初案）のみ

### DSR-22 識別列 mapping 表（`01-decision-rules.md:431-439`）と本 lane の対象

- mapping 表の「商品系」行（`:433`）: 「商品一覧 / 在庫照会 / 一括価格改定 / 整合性チェック / 日次・月次 ranking」に対し固定列「商品コード + 商品名」（2 列）
- 本 lane で `identityColumns` を配線するのは **商品一覧のみ**（`stickyHeader` を採用する唯一の `ListShell` caller、`ProductListPage.tsx:284`、かつ「窓を狭めると出っ張る」症状が実際に起きる唯一の画面）。同じ「商品系」行に属する在庫照会・一括価格改定・整合性チェックは `ListShell` を使わず `table.tsx:9` の内部 scroll のままのため、本 lane では配線しない（Non-scope、将来 opt-in 時に同じ mapping・同じ機構を再利用する）
- mapping 表の他行（棚卸し・入出庫履歴・在庫変動履歴・操作ログ・管理系）も本 lane では触らない（全て非 `ListShell` 画面）

### `identityColumns` の API 選定（既存の予約型をそのまま使う、ponytail: 汎用 N 列 generator は作らない）

- `ListShell.tsx:30-34` の型宣言 `identityColumns?: number;` は既に「固定する先頭列の**本数**」という最小 API で予約済み。DSR-22 mapping 表の固定列数は全行が 1（管理系・取引先）か 2（それ以外すべて）で、任意 N への一般化が要る場面は無い（YAGNI）
- Tailwind の JIT は静的解析でしか class を拾えないため、`` `[&_tbody_td:nth-child(${i})]:sticky` `` のような実行時テンプレートリテラルは CSS を生成しない。したがって `identityColumns` の値（1 or 2）ごとに**リテラル class 配列を持つ小さな lookup**で実装する（`STICKY_TABLE_CLASSES` と同じ「静的配列を条件で選ぶ」パターンの踏襲であり、新しい抽象は増やさない）
- 列 1・2 の幅安定化: 列 2 の `left-[<幅>]` は列 1 の幅が変動しないことに依存する。`ResizeObserver` 等の動的計測は導入せず、`ProductTable.tsx:52` 商品コード列に固定 width class `w-28`（7rem=112px、mono 10〜13 文字程度を想定）を付与する——この想定はコードの根拠（固定桁数の規定は見当たらない）に基づく仮定であり、AC-L3-1 の owner 実機確認で実データの折返し有無を最終確認する
- **round 3 是正（Opus P2）: `w-28` と `table.tsx:74` の `whitespace-nowrap` の組合せは、幅超過時に折返しではなく列 1 の拡張・列 2 との重なりを起こす**。商品コードの実際の長さについて repo 内で確認できた根拠: `src-tauri/src/seed_demo.rs:226` の seed 生成が `format!("{}{:04}", prefix, i)`（2 文字 prefix + 4 桁 = 6 文字、例 `KE0001`）、`src/features/products/lib/test-fixtures.ts:11` が `"P-0001"`（6 文字）。DB スキーマ・BIZ 層のバリデーションに `product_code` の最大長を定める記述は見当たらず、`w-28`（7rem、mono で概ね 13〜14 文字相当）が実運用の全ケースを覆う保証は無い。したがって AC-L3-1 の確認事項は「折返し・はみ出しが無い」ではなく「横スクロール中に商品名列（列 2）の左端が商品コード列（列 1）に重ならないこと」を確認する形に改める（Writer 実装時・L3 で実データの最長 `product_code` を用いて再確認する）

### DSR-22 現在行 3 点（`01-decision-rules.md:443`）と識別列の背景トークンの相互作用（round 3、Opus P2）

- DSR-22 は「入力中 / 開いている行 / 選択行」を「現在行」として左 4px の primary バー + 淡い背景 `--row-current` + badge/文言の 3 点で示す（`:443`）。本 lane の S9 は識別列の `tbody td` を不透明化のため `bg-background` 固定にする——`TableRow`/`TableCell` 側の `hover:bg-muted/50`/`data-[state=selected]:bg-muted`/将来の `--row-current` はすべて `ListShell` の descendant variant より詳細度で負けるため、固定列 2 セルだけこれらの背景が乗らない
- **代替案（owner が L3 で選ぶ、本 lane では確定しない）**: `[&_tbody_tr]:bg-background`（`tr` レベルで不透明背景、`ListShell.tsx:53` 付近の `[&_thead_tr]:bg-list-head` と同型のパターン）を root に追加し、識別列の `td` 自体は `bg-inherit` にする——`tr` の背景が hover/選択/現在行で変わればそれを識別列も継承する。ただしこの案は `tr` の背景を「不透明な単色」に固定する必要があり、`hover:bg-muted/50` のような半透明色をそのまま `tr` に使うと、識別列とその他列で重なる背景（page 地 + tr 背景）の層数が異なり見え方が二重合成になり得る（caveat）。この選択は L4-D11 に記録し、AC-L3-1 で owner に確認する

### 既知の相互作用（round 2 第 2 便で明示）

- **(a) Lane 3 scroll restoration との無関係**: `OperationLogsPage.scroll-restoration.test.tsx` と `app-router.ts` の DSR-17 scroll 復元 flag は `main.scrollTop`（縦方向）のみを扱う。識別列固定は `left`（横方向）オフセットのみを追加し、`scrollTop`/縦の復元ロジックには触れないため無関係・無影響
- **(c) `TableCell` の既定 `whitespace-nowrap` は不変**: 商品コード・商品名セルとも、識別列固定は position/z-index/背景のみの変更であり、既存の折返し設定（商品名は Lane 2 で `whitespace-normal` 済み、商品コードは既定 `nowrap`）を変えない
- **(d) forced-colors**: box-shadow は forced-colors（Windows ハイコントラスト）で無視されるため、識別列の右端 shadow だけでは境界線が消える。したがって識別列にも `forced-colors:border-r` を追加する（詳細は Scope S9）。**round 3 是正（Opus P3）**: Lane 2 S17 が summary 帯に追加した `forced-colors:border-b` は同一 lane 内の後続是正で撤去済み（`ListShell.test.tsx:210,311` が `bandTokens` に `forced-colors:border-b` を含まないことを assert）。したがって本節はこれを「現存する precedent の踏襲」としては引用しない——識別列の `forced-colors:border-r` は「box-shadow は forced-colors で無視される」という一般的な CSS 事実のみを根拠とし、帯の撤去済み実装とは独立に判断する
- **(e) `left-0` の基準（round 3 是正、Opus P3）**: 識別列の `left-0` は `<main>` の x=0（左端）に固定され、`PageShell.tsx:21` の `p-6` gutter（24px）の**内側**ではなく `<main>` のスクロール原点に張り付く。これは既存の sticky thead（`top-0`/`top-10`、同じく `<main>` のスクロール原点基準）と同型の挙動であり、defect ではない——AC-L3-1 で「識別列が toolbar の左端より少し左（gutter 分）に見える」ことを owner が確認する際、これは既存の sticky-top 実装と一貫した仕様であると明記する

### 8 画面の frame / perPage Select / pagination 現況サーベイ（table 幅・長文列列は商品一覧のみ対象のため列を割愛）

| 画面 | perPage Select 位置 | filter/toolbar 枠（現状） | 上部 summary | 下部 pager 条件（現状） |
|---|---|---|---|---|
| 商品一覧（`ProductListPage.tsx`） | `toolbarSecondary`（`:186-211`）内、並び替え Select・SegmentedControl の後 | `ListShell.tsx:88` `rounded-lg border bg-card p-4`（reference） | あり（`topSummary` prop、`totalCount>0`） | `hasResults`（`totalCount>0`）のみ、`totalPages` 非考慮 |
| 棚卸し（`StocktakePage.tsx`） | `:752-778` filter 行内、部門 Filter の後・未入力のみ Checkbox の**前**（最後尾でない） | `:742` 枠なし（`<div className="flex flex-wrap items-center gap-4">`） | なし | 無条件（`<fieldset><Pagination/></fieldset>`、`:854-863`） |
| 在庫照会（`StockInquiryPage.tsx`） | `:131-156` filter 行内、SearchBar・DepartmentFilter の後＝既に最後尾 | `:102` 枠なし | なし | `statusValue === "all"` かつ `totalCount !== null` のときのみ（`totalPages` 非考慮、`:234-243`） |
| 入出庫履歴（`InventoryRecordsPage.tsx`） | `:281-291` filter 行内、他フィールドの後＝既に最後尾（re-stack 後: 記録種別/部門/状態は shadcn `Select`、開始日/終了日/記録ID は native のまま） | `:159` `rounded-md border p-4`（bg なし、re-stack 後も同一行） | なし | 無条件（`recordsQuery.data` があれば、`:395-402`） |
| 在庫変動履歴（`StockMovementsPage.tsx`） | `:185-210` filter 行内、開始日・終了日・種別の後＝既に最後尾 | `:134` 枠なし（`:98` の商品情報 card は別 section、Non-scope） | なし | 無条件（`movementsQuery.data` があれば、`:243-250`） |
| 操作ログ（`OperationLogsPage.tsx`） | `:398-423` filter 行内、開始日・終了日・種別の後＝既に最後尾 | `:344` `rounded-md border p-4`（bg なし） | なし | 無条件（`logsQuery.data.items.length > 0`、`:558-564`） |
| 一括価格改定（`PriceRevisionPage.tsx` + `PriceRevisionFilters.tsx`） | `PriceRevisionPage.tsx:67-96`、`PriceRevisionFilters` の**外**・独立 div（枠外） | `PriceRevisionFilters.tsx:40` `rounded-md border bg-stone-50 p-4` | なし | 無条件（`list.productsQuery.data` があれば、`:168-175`） |
| 整合性チェック（`IntegrityCheckPage.tsx`） | `:234-264` 単独 div、他 filter なし | `:234` 枠なし | なし | 無条件（`mismatches.length > 0` 分岐内、`:417-422`） |

- **Plans.md ④ の記録済み claim の訂正**（記憶ルール「記録済み claim も起草時実測」準拠）: R2-1 sub-bullet（`Plans.md:82`）は「単一ページ時は下部行ごと非表示、在庫照会で観測」と記す。実コード確認では在庫照会の `<Pagination>` は `statusValue === "all"` でのみ描画され、`totalPages` は判定に使われていない（`StockInquiryPage.tsx:234`）。「単一ページで非表示になる」経路は現状存在せず、本 packet は Plans.md の記述を実装事実としては採用しない（S2 で `totalPages <= 1` gating を新規に `Pagination.tsx` 側へ実装することで、結果として在庫照会を含む 8 画面すべてに同じ挙動を持たせる）
- **ListShell.test.tsx の it 数訂正**: 発注時想定「16 it」に対し実測 17 it（`rg -c '\bit\('` = 17、`describe` 8 個。`:343` の wrapper `className` 完全一致 assertion を含む）
- **Pagination.test.tsx の it 数**: 8 it（既存）。`totalCount === 0` を「0 件」と表示する既存 case が S2 の `totalPages<=1` null 化で仕様変更になる（下記 Scope S2 参照）
- **上部 summary 新設が既存 test を壊す箇所（round 2 是正、Sonnet Plan Review 指摘）**: 下部 `Pagination` の件数文言と上部 `PaginationSummary` の件数文言は同一 `rangeText` を共有するため、新規に上部 summary を追加すると同じ文字列が DOM に 2 回現れる。単数一致の `screen.getByText(...)` を使う既存 test は多重一致で例外を投げ fail する。確認済みの該当箇所: `IntegrityCheckPage.test.tsx:414`（`screen.getByText("全 101 件のうち 1〜100 件を表示（1 / 2 ページ）")`）、`OperationLogsPage.test.tsx:281,293,420,432`（`screen.getByText("全 45 件のうち 41〜45 件を表示（3 / 3 ページ）")` 4 箇所）、`StockInquiryPage.test.tsx:526`（`screen.getByText("全 51 件のうち 51〜51 件を表示（2 / 2 ページ）")`）。これらは `getByText` → `getAllByText(...)` の `length` 検査、または `within(container)` でどちらの帯かを限定する形へ書き換える（S3 のスコープに含める）
- **StocktakePage 既存 test の row citation（round 1/2 是正、round 3 で行番号を再確認）**: `StocktakePage.test.tsx:1042`（`it("SC8c': list pagination uses the canonical ProductPagination component"`）は `findByRole("button", { name: "前のページ" })` を `total_count` の少ない fixture で呼んでおり、`Pagination` が `totalPages<=1` で null を返すと `findByRole` が timeout する。`StocktakePage.test.tsx:1055`（`it("SC10: filter row lists department filter, then per-page select, then uncounted-only checkbox in that DOM order"`）は `compareDocumentPosition` で「部門 → 表示件数 → 未入力のみ表示」の順を assert しており、S4（Select 並べ替え）で DOM 順が変わるため書き換えが必須（新規 test ではなく既存 SC10 の rewrite）
- **PriceRevisionPage 既存 test の配線 oracle（round 2 是正）**: `PriceRevisionPage.test.tsx:694-703`（`it("SC9a: 表示件数変更で画面を先頭へ戻す"`）は `表示件数` という accessible name の combobox をクリックして `mockScrollPageToTop` の呼出しを確認する。この test は `Select` を `PriceRevisionFilters` へ移設しても accessible name・id を保てば無変更のまま pass するはずであり、`onPerPageChange` の配線を落とす mutant を検出する既存 oracle として SC7b の failure mode に転用する（新規 test を追加しない）
- **catalog ⑩ の pre-S2 記述箇所（round 2 是正、Sonnet Plan Review 指摘）**: `02-component-catalog.md:643`「`totalCount === 0` のときは「0 件」のみを表示し前後ボタンは両方 disabled」と `:648`「`totalCount === 0` は両方 disabled」は S2（`totalPages<=1` null 化）以前の挙動を記述しており、新形「`totalPages <= 1`（0 件含む）は下部 pager を描画しない」への更新が必要（S6 のスコープに追加）
- **catalog `text-base text-foreground tabular-nums` の出現数**: `02-component-catalog.md` に起票時 **2 箇所**（`:612` 構造例コード片、`:645` 使用トークン節）。両方とも S6 で新形へ更新する

## Scope

- **S1 filter/toolbar 枠の地色統一**（`rounded-lg border bg-card p-4`、L4-D3。`ListShell.tsx:88` の既存 class 文字列と完全一致させる。対象は 6 画面——round 2 是正で整合性チェックを除外、下記参照）:
  - S1a 棚卸し `StocktakePage.tsx:742` `<div className="flex flex-wrap items-center gap-4">` → `<div className="flex flex-wrap items-center gap-4 rounded-lg border bg-card p-4">`
  - S1b 在庫照会 `StockInquiryPage.tsx:102` `<div className="flex flex-wrap items-center gap-3">` → 同型で `rounded-lg border bg-card p-4` 追加
  - S1c 入出庫履歴 `InventoryRecordsPage.tsx:159` `className="space-y-3 rounded-md border p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - S1d 在庫変動履歴 `StockMovementsPage.tsx:134` `<div className="flex flex-wrap items-end gap-3">` → `rounded-lg border bg-card p-4` 追加（`:98` の商品情報 card は不変、Non-scope）
  - S1e 操作ログ `OperationLogsPage.tsx:346` `className="space-y-3 rounded-md border p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - S1f 一括価格改定 `PriceRevisionFilters.tsx:40` `className="space-y-3 rounded-md border bg-stone-50 p-4"` → `className="space-y-3 rounded-lg border bg-card p-4"`
  - **整合性チェックは対象外（round 2 是正、Opus P2）**: `IntegrityCheckPage.tsx:234` の `<div className="flex items-center gap-2">` は表示件数 `Select` 単独のラッパーで、`phase === "completed" && result !== null` のときにしか描画されず、他 filter フィールドを一切持たない「filter/toolbar 枠」ではない。囲む対象が Select 1 つだけの div に枠を付けても他画面の filter frame と意味が揃わないため、S1 の frame sweep から除外する（AC1 は 6 画面、AC-L3-3 も 6 画面が対象）
  - S1g 表 frame の `rounded-md` → `rounded-lg` 統一（round 2 是正、Opus P3）: filter/toolbar 枠を `rounded-lg` に揃える一方、同じ画面の table を囲む `overflow-x-auto rounded-md border` wrapper が `rounded-md` のまま残ると角丸が食い違う。`IntegrityCheckPage.tsx:348` と `OperationLogsPage.tsx:502` の `className="overflow-x-auto rounded-md border"` を `className="overflow-x-auto rounded-lg border"` へ（`border`/`overflow-x-auto` は不変、角丸 token のみ 1 箇所ずつ変更。`bg-card` は付けない——table wrapper は filter frame ではないため地色は変えない）
  - 完了条件（file 別）: 対象 6 file で `rg -Fn "bg-stone-50"` / 該当の枠なし旧 class 文字列 = 0、`rg -Fn "rounded-lg border bg-card p-4"` ≥ 1。`IntegrityCheckPage.tsx:234` の `Select` ラッパーに `bg-card` が付いていないことを回帰確認する（対象外の逸脱防止）。`IntegrityCheckPage.tsx`/`OperationLogsPage.tsx` で `rg -Fn "overflow-x-auto rounded-md border" <file>` = 0 かつ `rg -Fn "overflow-x-auto rounded-lg border" <file>` ≥ 1
- **S2 `Pagination`/`PaginationSummary` の上下切り分け契約変更**（`src/components/patterns/Pagination.tsx`、L4-D4。8 画面共有の 1 箇所修正で全 caller に反映——owner の「呼出し元を直せば一気に全部変わる」設計選好、Lane 3 の flag 是正先例と同型。Plan Review で変更なし、oracle のみ round 2 で是正）:
  - `PaginationSummary` の className: `"text-base text-foreground tabular-nums"` → `"text-sm text-muted-foreground tabular-nums"`（下部 `Pagination` の左側 summary と同じ見た目に統一）
  - `Pagination`: `computeRange` 直後に `if (totalPages <= 1) return null;` を追加（`totalCount === 0` は `totalPages = max(1, ceil(0/perPage)) = 1` のため同じ分岐で null になる——既存の「0 件」表示 test は本変更で仕様が変わる。下記 AC4 参照）
  - 完了条件（round 2 是正: `rg -Fn "text-sm text-muted-foreground tabular-nums"` は今日 0 件——下部の class は `"flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground"`（外側 div）と `"tabular-nums"`（内側 div）に分割されており、結合済み文字列としては存在しない。よって完了条件は「新規に 1 箇所だけ出現する」ことを検査する）: `rg -Fn 'className="text-base text-foreground tabular-nums"' src/components/patterns/Pagination.tsx` = 0（起票時 1）かつ `rg -Fn "text-sm text-muted-foreground tabular-nums" src/components/patterns/Pagination.tsx` = 1（`PaginationSummary` 側のみに新規出現、下部の分割 class 表記とは別）かつ `rg -n "totalPages <= 1" src/components/patterns/Pagination.tsx` ≥ 1（`rg -c` は一致した**行数**を数える点に注意——本 file は該当行が単一のため `-c`/`-Fn` の値は一致する）
- **S3 上部 `PaginationSummary` の 7 画面ロールアウト + 既存重複文言 test の是正**（`ListShell` を使わない全画面、L4-D5。各画面の「結果あり」分岐内、`<Table>` 直前に 1 行追加するだけの機械的変更。Plan Review round 2 で既存 test 破綻の是正を追加）:
  - S3a 棚卸し `StocktakePage.tsx`（`items.length === 0` の EmptyState 分岐の else 側、`:821-852`）。**round 2 是正（Opus P3）**: この else 分岐は現在 `<Table>...</Table>` を裸で返す（囲み `<div>`/`<>` なし）。`PaginationSummary` を追加するには 2 要素を返す必要があるため、`<>...</>`（Fragment）または `<div className="space-y-3">` で `<Table>` ごと包み直す（単なる「1 行追加」ではない）
  - S3b 在庫照会 `StockInquiryPage.tsx`（`data` 分岐内、`ProductListTable` 直前）。**round 2 是正（Opus P1）**: 下部 `<Pagination>` は `statusValue === "all" && data.totalCount !== null` でのみ描画される（`totalCount: number | null`、`types.ts:54`。`source: "low_stock"` のとき `totalCount` は `null`）。上部 `PaginationSummary` にも**同じ条件**を書く——status フィルタが `"all"` 以外（在庫少 等）のときは `totalCount` が無いため上下とも表示しない。**round 3 是正（Opus P2）**: 条件は `data.totalCount !== null` だけでなく `statusValue === "all" && (data.totalCount ?? 0) > 0` にする（`totalCount === 0` のとき `!== null` は真になるが、上部 summary を「0 件」で描画すると Goal の失敗定義「`totalCount === 0` の場面で誤って描画される」に抵触するため）。他 6 画面と異なり在庫照会だけ「`(totalCount ?? 0) > 0` かつ `statusValue === "all"`」の 2 条件になる
  - S3c 入出庫履歴 `InventoryRecordsPage.tsx`（`recordsQuery.data` 分岐内、`:341` の `<Table>` 直前。re-stack 後の行番号）
  - S3d 在庫変動履歴 `StockMovementsPage.tsx`（`movementsQuery.data` 分岐内、`MovementTable` 直前）
  - S3e 操作ログ `OperationLogsPage.tsx`（`logsQuery.data.items.length > 0` 分岐内、`:496` の table wrapper 直前）
  - S3f 一括価格改定 `PriceRevisionPage.tsx`（`list.productsQuery.data` 分岐内、`PriceRevisionTable` 直前）
  - S3g 整合性チェック `IntegrityCheckPage.tsx`（`mismatches.length > 0` 分岐内、`:348` の table wrapper 直前）
  - 各画面とも `page`/`perPage`/`totalCount` は既存の下部 `<Pagination>` 呼出しと同じ値を渡す（新規 state 追加なし）
  - **既存 test 是正（round 2/3、必須。round 3 で S2 の `text-base`→`text-sm` 変更が壊す箇所を追加、対象は 5 file 9 箇所へ拡大）**:
    - `IntegrityCheckPage.test.tsx:414`、`OperationLogsPage.test.tsx:281,293,420,432`、`StockInquiryPage.test.tsx:526` の `screen.getByText(<件数文言>)`（6 箇所、round 2 是正）を、上部/下部の重複を許容する形（`screen.getAllByText(...)` で `length` 検査、または `within(<下部 Pagination の container>)` で片方に限定）へ書き換える
    - **round 3 是正（Opus P1/P4）**: S2（`PaginationSummary` の `text-base text-foreground` → `text-sm text-muted-foreground`）は `.text-base` を判別子に使う既存 test も壊す。`ListShell.test.tsx:96,98,107,119`（`container.querySelectorAll(".text-base")`/`container.querySelector(".text-base")`/`summaryTokens`（`toContain("text-base")`）による上部 summary の一意特定・存在確認）、`ProductListPage.test.tsx:632-637`（`container.querySelectorAll("div.text-base")` の `length` と `div.text-sm.text-base` 不在確認）、`Pagination.test.tsx:71`（`toHaveClass("text-base", "text-foreground", "tabular-nums")`）の 3 file 4 箇所（`ListShell.test.tsx` は 1 test 内に複数 assertion がある）を新しい判別子（`text-sm`/新クラス）へ書き換える。既存 `it` の削除・skip はしない
  - 完了条件: 各 file で `rg -c "PaginationSummary" <file>` ≥ 1（起票時 0、商品一覧除く）かつ 0 件分岐（EmptyState 系）に新規 import が漏れ出していないこと（対応 test で確認）。上記 5 file 9 箇所の旧判別子（`getByText("全 ...")` の重複一致、`.text-base` 選択子、`toHaveClass("text-base", ...)`）がすべて是正されていること
- **S4 表示件数 `Select` の右端統一**（L4-D5 続き。5 画面は起票時実測で既に最後尾——変更不要——のため、実際の構造変更は 2 画面のみ）:
  - S4a 棚卸し `StocktakePage.tsx:752-778` の表示件数 `Select` ブロックを `:779-793` の未入力のみ表示 Checkbox ブロックより**後**へ並べ替える（JSX の子要素順の入替えのみ、ロジック変更なし）。**既存 test の rewrite が必須**: `StocktakePage.test.tsx:1055`（`it("SC10: filter row lists department filter, then per-page select, then uncounted-only checkbox in that DOM order"`）の `compareDocumentPosition` 期待順を「部門 → 未入力のみ表示 → 表示件数」へ書き換える（新規 test を追加するのではなく既存 SC10 を rewrite、Matrix SC4a はこの rewrite を指す）
  - S4b 一括価格改定: `PriceRevisionPage.tsx:67-96` の表示件数 `Select` ブロックを `PriceRevisionFilters.tsx` の filter 行（`:41-101`、re-stack 後の行番号）へ**移設**し、その最後尾（`廃番を含む` チェックボックスの後）に配置する。`PriceRevisionFilters` に `perPage: number` / `onPerPageChange: (value: number) => void` prop を追加し、呼び出し元 `PriceRevisionPage.tsx` から現行の state/handler をそのまま渡す（新規 state 追加なし、配線の付け替えのみ）。**既存 test が退行 oracle を兼ねる**: `PriceRevisionPage.test.tsx:694-703`（`it("SC9a: 表示件数変更で画面を先頭へ戻す"`）は accessible name `表示件数` の combobox をクリックし `mockScrollPageToTop` の呼出しを確認する既存 test で、`onPerPageChange` の配線漏れ mutant を検出する（新規 test 追加なし、この既存 test の pass 維持が SC4b の failure-mode oracle）。**round 4（re-stack 後、既存残件は解消）**: round 2 是正時点では `PriceRevisionFilters.tsx:46` に取引先 native `<select>` が残っていたが、lane ⑧（`agent/ui-select-unify`）の tip `885c10d` への単段 merge（下記 Stacked train 参照）でこの native `<select>` は shadcn `Select`（id `price-revision-supplier`、`:53-71`）へ置換済みであることを確認した。したがって S4b は native `<select>` への対応を追加する必要がなく、Residual Risk の「⑧ 未 merge のまま実装した場合の既知残件」は解消済みとして記録する
  - 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ は起票時実測のとおり既に filter 行の最後尾のため変更不要（回帰確認のみ、L4-D5）
  - 完了条件: S4a は `StocktakePage.test.tsx:1055` の rewrite 後の `compareDocumentPosition` 期待順で pass。S4b は `rg -n "price-revision-per-page" src/features/products/components/PriceRevisionFilters.tsx` ≥ 1（起票時 0）かつ `rg -n "price-revision-per-page" src/features/products/PriceRevisionPage.tsx` = 0（起票時 1、独立 Select 削除）かつ `PriceRevisionPage.test.tsx:694-703` の SC9a が無変更のまま pass
- **S5 `StocktakePage.tsx:854` の空 `<fieldset>` ガード**（P3、round 1 是正で新規追加。`Pagination` が `totalPages<=1` で null を返すと `<fieldset disabled={disabled}><Pagination/></fieldset>` が中身の無い `<fieldset>` だけを残す。他 2 箇所は table と同じ `space-y-*` container 内の兄弟のため React が null 子を描画せず stray gap は生じない——`IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` は verified non-issue として変更しない、下記 Review Focus 参照）: `StocktakePage.tsx` 側で `totalPages`（`Pagination.tsx` と同じ `Math.max(1, Math.ceil(totalCount / perPage))` 式）を計算し、`totalPages > 1` のときだけ `<fieldset>` を描画する。完了条件: `StocktakePage.test.tsx` に「単一ページのとき `<fieldset>` が描画されない」新規 assertion
- **S6 DSR-22 の文言改訂**（`docs/design-system/01-decision-rules.md:429`、L4-D7）: 「上部の件数・現在位置 text と table header の sticky 化は、実表示が viewport を超えるときにだけ発動する（1 画面に収まる短い一覧では省略してよい。…）。上部は `PaginationSummary` で範囲付き統一形…の text 表示を必須、pager ボタンは任意（`Pagination` 下部と別 component）。下部は件数 + pager フル装備で、canonical は `Pagination`…」を「`ListShell` 採用画面では `topSummary` prop（既定 `false`、`ListShell.tsx:69`）で上部表示を明示的に opt-in し、非 `ListShell` 画面では対応する `PaginationSummary` を直接描画することで、pagination を持つ一覧画面すべてに適用する。opt-in 後の上部の件数・現在位置 text は `totalCount > 0` のとき常に表示する（table header の sticky 化は引き続き `ListShell` の `stickyHeader` prop 採用画面のみ）。上部は `PaginationSummary` で範囲付き統一形…の text 表示のみを持ち、pager ボタンは置かない。下部は `totalPages > 1` のときだけ、件数 + pager フル装備の `Pagination`（`src/components/patterns/Pagination.tsx`）を描画する…」へ改める。識別列固定の記述（同 `:429` 末尾の「両立方式〈sticky × 識別列固定 × DSR-17 `<main>` 単一 scroll〉の probe は横 overflow が実発生する画面を確認してから Lane 3〜5 で行う」）は「Lane 4 で商品一覧のみ実装済み: 新規 scroll 容器を作らず、`<main>`（既に `overflow-auto`）を唯一の scroll container としたまま識別列に `sticky left-*` を追加する方式で両立を確認した（`identityColumns` prop 活性化、S9）。他画面は同じ mapping・同じ機構のまま opt-in 未実施」へ改める。完了条件: `rg -Fn "実表示が viewport を超えるときにだけ発動する" docs/design-system/01-decision-rules.md` = 0（起票時 1）かつ `rg -Fn "totalCount > 0 のとき常に表示する" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fn "pager ボタンは任意" docs/design-system/01-decision-rules.md` = 0（起票時 1）かつ `rg -Fn "pager ボタンは置かない" docs/design-system/01-decision-rules.md` ≥ 1 かつ `rg -Fn "probe は横 overflow が実発生する画面を確認してから Lane 3〜5 で行う" docs/design-system/01-decision-rules.md` = 0（起票時 1）かつ `rg -Fn "Lane 4 で商品一覧のみ実装済み" docs/design-system/01-decision-rules.md` ≥ 1。**round 3 追加（Sonnet、⑦/⑧ packet 先例に倣う）**: `01-decision-rules.md` の `## 更新履歴` 表（`| 日付 | PR | 内容 |`）に本 lane の行を追加する（`rg -Fn "UI 一覧の背骨 D — Lane 4" docs/design-system/01-decision-rules.md` ≥ 1、起票時 0）
- **S7 catalog ⑩ ページネーションの改訂**（`docs/design-system/02-component-catalog.md:602-663`、L4-D8）: `:608-641` の構造例（上部 variant の class を `text-base text-foreground` → `text-sm text-muted-foreground` へ）・`:643`（「`totalCount === 0` のときは『0 件』のみを表示し前後ボタンは両方 disabled」→「`totalPages <= 1`（0 件含む）は下部 pager を描画しない」）・`:645` 使用トークン節（上部 `PaginationSummary` の記述を下部と同じトークンへ）・`:648`（「`totalCount === 0` は両方 disabled」→「`totalPages <= 1`（0 件含む）は下部 pager 自体を描画しない」）・`:653` アクセシビリティ節（上部/下部の同時描画前提の記述を「下部は複数ページ時のみ描画」へ）・`:658` Do 節（「viewport を超える一覧は上部にも…」→「一覧はすべて上部に…常に」）・`:663` Don't 節（「下部を単一ページ（totalPages<=1）で表示しない」を追加）を改訂する。完了条件: `rg -Fn "text-base text-foreground tabular-nums" docs/design-system/02-component-catalog.md` = 0（起票時 2 箇所、`:612`,`:645`）かつ `rg -c "text-sm text-muted-foreground tabular-nums" docs/design-system/02-component-catalog.md` ≥ 2 かつ `rg -Fn "のときは「0 件」のみを表示し前後ボタンは両方 disabled" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:643`。実文は `` `totalCount === 0` `` の直後にこの句が続く）かつ `rg -Fn "は両方 disabled）" docs/design-system/02-component-catalog.md` = 0（起票時 1、`:648`）かつ `rg -Fn "viewport を超える一覧は上部にも" docs/design-system/02-component-catalog.md` = 0（起票時 1）。**round 3 追加（Sonnet、⑦/⑧ packet 先例に倣う）**: `02-component-catalog.md` の `## 更新履歴` 表（`:941` `| 日付 | PR | 内容 |`）に本 lane（S7/S8/S9 の要約）の行を追加する（`rg -Fn "UI 一覧の背骨 D — Lane 4" docs/design-system/02-component-catalog.md` ≥ 1、起票時 0）
- **S8 catalog ⑯ 一覧の器の改訂**（`docs/design-system/02-component-catalog.md:896-926`、L4-D8 続き。round 1 是正で対象を項目 2 のみへ縮小——項目 3 の `w-min min-w-full` 記述は現状の実装（不変）と一致しているため変更しない）: 項目 2（`:905`、「両者とも `totalCount > 0` のときだけ描画する」→「上部は `totalCount > 0` のとき常に、下部は `totalPages > 1` のときだけ描画する」）のみ改訂する。完了条件: `rg -Fn "両者とも \`totalCount > 0\` のときだけ描画する" docs/design-system/02-component-catalog.md` = 0（起票時 1）かつ `rg -n "totalPages > 1" docs/design-system/02-component-catalog.md` ≥ 1（項目 2 内）。項目 3（`w-min min-w-full` の記述）は無変更のまま残ることを回帰確認する（``rg -Fn 'min-w-full`（横 overflow 時に帯が table 幅へ追随' docs/design-system/02-component-catalog.md`` ≥ 1 を維持、単一引用符内でバックティックはエスケープしない）
- **S9 識別列固定の実装（商品一覧のみ、owner 決定 2026-09-05 第 2 便で item (1) を D から書換え）**:
  - `ListShell.tsx:30-34` の予約 prop `identityColumns?: number` を活性化する（型は変更しない、`number` = 固定する先頭列の本数）。`identityColumns` の値ごとにリテラル class 配列を持つ小さな lookup（`1`/`2` の 2 パターン、DSR-22 mapping 表が要求する最大値）で `thead th`/`tbody td` の先頭 N 列へ class を適用する。汎用 N 列 generator は作らない（起票時実測「API 選定」節参照）
  - 適用 class（`ListShell.tsx` root の descendant variant、children〈`ProductTable`〉に className を渡さない既存方針を維持。Tailwind の `:nth-child()` 疑似クラスを使い `[&_thead_th:nth-child(1)]:sticky` のようなリテラル selector で列を特定する）:
    - `thead th`/`tbody td` の 1 列目（`:nth-child(1)`）: `sticky left-0`
    - `thead th`/`tbody td` の 2 列目（`:nth-child(2)`）: `sticky left-[7rem]`（`ProductTable.tsx` 商品コード列の固定幅 `w-28`＝7rem と一致させる）
    - `tbody td` の 1・2 列目: `bg-background`（不透明化。`thead th` は既存の `[&_thead_th]:bg-list-head` を共有するため追加不要）
    - `tbody td` の 1・2 列目: `z-[1]`（他の非 sticky td より上、`thead th` の既存 `z-10` より下）
    - `tbody td` の 1・2 列目の右端: `shadow-[inset_-1px_0_0_var(--border)]`（実 `border-r` によるセル幅増加・subpixel seam を避けるための新規技法。**round 3 是正（Opus P3）**: Gated Amendment 7 S48 は corner mask 技法であり box-shadow ではない、Lane 2 に box-shadow の precedent は無い（`rg 'shadow-\[inset' src` = 0、起票時実測で確認済み）——本節は precedent の踏襲としてではなく、box-shadow が cell の box model に影響しないという CSS の性質を独立の根拠として採用する）+ `forced-colors:border-r`（box-shadow は forced-colors で無視されるため実 border を追加。Lane 2 の帯 `forced-colors:border-b` は既に撤去済みのため precedent としては引用しない、既知の相互作用 (d) 参照）
    - `thead th` の 1・2 列目: 既存の `top`/`z-10`（sticky top 部分）に加え `left-0`/`left-[7rem]` を追加する。**round 3 是正（Opus P1）**: `ListShell.tsx:45` は全 `thead th` に `z-10` を一律付与するため、識別列の `th` も他の `th` と同じ z-index のまま——横スクロール後に隣接する非識別列の `th` が識別列の `th` の上に重なって描画される可能性がある（sticky 要素同士は生成順・z-index で重なりが決まり、同一 z では DOM 順が後の要素が上に来る保証がない）。識別列の `thead th` にのみ `z-[11]`（`:107` の帯 `sticky top-0 z-20` より下、他の `thead th` の `z-10` より上）を追加する
  - **round 3 是正（Opus P1、toolbar sticky-left を撤回）**: `ListShell.tsx:88` の toolbar frame への `sticky left-0` は **no-op のため追加しない**。toolbar の containing block は `ListShell.tsx:79` root → `PageShell.tsx:21`（`p-6`）→ `RootLayout.tsx:65` `<main>` の chain で、いずれも `<main>` の幅を超えて広がることが無い（toolbar 自体は table のように内容量で幅が伸びる要素ではない）。sticky の効くスクロール範囲は「要素が本来の位置からどれだけずれるか」で決まり、toolbar の本来位置は常に `<main>` の左端と一致するため sticky range は 0 になる。したがって toolbar は `<main>` が横スクロールすると他の非固定コンテンツと同様に左へ流れる（識別列のみが固定される）。この点は Alternatives / Residual Risk に記録し、AC-L3-1 から「検索/filter 枠が左端に留まる」を削除する
  - `ProductListPage.tsx:284` の `<ListShell>` 呼出しに `identityColumns={2}` を追加する（DSR-22 商品系行）
  - `ProductTable.tsx:52` 商品コード列に `w-28` を追加する（他の列 class は無変更、商品名の `min-w-[14rem] whitespace-normal` を含め touch しない）
  - **完了条件（round 3 是正、Opus P2/P6: descendant variant は文字列連結の都合上 `rg -Fn "sticky left-0"`/`"sticky left-[7rem]"` の完全一致 3 箇所以上という検査が不成立になり得る——`nth-child` selector と組み合わさる実際の文字列は `[&_thead_th:nth-child(1)]:sticky` のように 1 token に融合するため）**: `rg -n "identityColumns" src/components/patterns/ListShell.tsx` の hit が型宣言のみの現状（1 件）から増える（消費する分岐が実装される）かつ `rg -Fn "identityColumns={2}" src/features/products/ProductListPage.tsx` ≥ 1（起票時 0）かつ `rg -Fn "w-28" src/features/products/components/ProductTable.tsx` ≥ 1（起票時 0）かつ `rg -c 'nth-child\(' src/components/patterns/ListShell.tsx` ≥ 4（`thead th`/`tbody td` × 列 1・2 の 4 パターン以上、正規表現なので `\(` のエスケープに注意）かつ `rg -Fc 'left-[7rem]' src/components/patterns/ListShell.tsx` ≥ 2（`thead th`/`tbody td` の 2 列目、`-F` の固定文字列検索でブラケットをエスケープ不要にする）かつ `rg -Fc 'z-[11]' src/components/patterns/ListShell.tsx` ≥ 1（識別列 th の z-index）
- **S10 Plans.md ④ + Contract Coverage Ledger 記入**: 本 packet の active link を反映（本 commit で同時実施）。Lane 4 の item (1) は「D から識別列固定（Excel 型、`<main>` 基準 sticky-left、商品一覧のみ。toolbar 自体の sticky 化は no-op のため対象外、round 3 是正）へ owner 決定 2026-09-05（D は実測で効果僅少）」と明記する。Contract Coverage Ledger は下記節を参照

## Non-scope

- `ListShell.tsx:99` の `w-min min-w-full` wrapper の撤去・変更（Lane 2 追補 S17 の既存挙動・`ListShell.test.tsx:343` の完全一致契約を維持する）
- 新規 `overflow-x:auto` scroll 容器の導入（E12 当初案、DSR-17 `<main>` 単一 scroll 契約と衝突するため不採用のまま）
- 商品一覧以外の 7 画面への `identityColumns` 配線・table 幅・長文列変更（`stickyHeader` 非採用画面は `table.tsx:9` の内部 `overflow-x-auto` で bleed しないため、後続 lane で opt-in する）。`PriceRevisionTable.tsx` の `min-w-[1280px]`/商品名折返しを含む
- 固定列 cell の行 hover（`hover:bg-muted/50`）・選択行（`data-[state=selected]:bg-muted`）背景への追随（`bg-background` 固定、Residual Risk 参照）
- 列幅の動的計測（`ResizeObserver` 等）。商品コード列は固定 width class（`w-28`）を採用する
- 非 ListShell 7 画面の `ListShell` 化（frame class の直接適用のみ）
- `Playwright` devDep 追加（Plans.md ④ 旧記述を本 packet が supersede）
- R2-3 / R2-4（在庫照会）、badge 色・増減数値の色（⑦）、native `<select>` → shadcn `Select` 置換（⑧、R5-3）
- `StockMovementsPage.tsx:98` 商品情報 card（別 section、既存 `bg-card` のまま不変）
- `IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` の `Pagination` null 化に伴う wrapper 調整（`space-y-*` container 内の兄弟要素のため null 子は React が描画せず stray gap を生まない、verified non-issue。`StocktakePage.tsx:854` の `<fieldset>` のみ単独子のため S5 で対処する）
- `IntegrityCheckPage.tsx:234` の表示件数 `Select` 単独ラッパーへの frame 付与（round 2 是正、上記 S1 参照。他 filter フィールドを持たないため対象外）
- toolbar frame（`ListShell.tsx:88`）への `sticky left-0` 追加（round 3 是正、Opus P1。containing block chain（`ListShell.tsx:79` root → `PageShell.tsx:21` → `RootLayout.tsx:65` `<main>`）がいずれも `<main>` 幅を超えないため sticky range が 0 の no-op と判明、Alternatives/Residual Risk 参照）

## Residual Risk

- **（解消済み）⑧ 未 merge のまま実装した場合の既知残件**: round 2 是正時点で記録した懸念——S4b が `PriceRevisionFilters.tsx` の取引先 native `<select>` に依存する前に ⑧ が merge されない場合の残件——は、2026-09-06 に lane ⑧（tip `885c10d`、human-confirm）への単段 merge（merge commit、下記 Stacked train 参照）を完了し、取引先が shadcn `Select`（id `price-revision-supplier`）に置換済みであることを実読で確認したため解消した。以降の Writer 実装は native `<select>` を意識しなくてよい
- **固定列の行 hover/選択背景が追随しない（識別列固定、owner 決定 2026-09-05 第 2 便）**: `tbody td` の識別列（1・2 列目）は不透明化のため `bg-background` 固定にする（S9）。行 hover（`TableRow` の `hover:bg-muted/50`）・選択行（`data-[state=selected]:bg-muted`）・将来の現在行背景（`--row-current`）は、これらの class が `TableRow`/`TableCell` に付き `ListShell` の descendant variant より詳細度が低いため、固定列の 2 セルだけ hover/選択の色が乗らない見た目になる。動的な背景注入は `children`（`ProductTable`）へ prop を渡す必要があり、`ListShell` の「children に className を渡さない」既存方針（D-9）と衝突するため本 lane では対応しない。owner L3 で許容可否を確認し、気になる場合は後続 lane で `TableRow`/`TableCell` 側からの背景伝播を設計する。**代替案（L4-D11、round 3 追加、Opus P2）**: `[&_tbody_tr]:bg-background` を root に追加し（`[&_thead_tr]:bg-list-head`、`ListShell.tsx:53` と同型のパターン）、識別列 `td` は `bg-inherit` にする——`tr` の背景が hover/選択/現在行で変わればそれを識別列も継承する。caveat: `hover:bg-muted/50` のような半透明色を `tr` にそのまま使うと、識別列とその他列で背景の合成層数が異なり二重合成の見え方になり得る。owner が L3 で許容可否を判断し、必要なら後続 lane でこの代替案を採用する
- **toolbar が横 scroll で左へ流れる（識別列のみ固定、round 3 是正、Opus P1）**: `ListShell.tsx:88` の toolbar frame に `sticky left-0` を追加しても、containing block chain がいずれも `<main>` 幅を超えないため sticky range が 0 になり no-op（Scope S9 参照）。したがって商品一覧の窓を狭めたとき、識別列（商品コード・商品名）は固定されるが toolbar/filter 枠は他の非固定コンテンツと同様に左へ流れる。**owner L3 で気になる場合の後続案**: toolbar を `w-min` wrapper 内に置き、`<main>` を `container-type: inline-size` にして toolbar に `w-[100cqw]` + `sticky left-0` を与える（container query 基準の幅を `<main>` の可視幅に固定し、そこに対して sticky left を効かせる）——これは新たな CSS container query の導入を伴う design 判断であり、本 lane では扱わない（別 lane 候補）

## Acceptance Criteria

- AC1: S1a〜S1f の 6 画面すべてで枠が `rounded-lg border bg-card p-4`（整合性チェックは round 2 是正で対象外、下記参照）— 各 file 個別 `rg -Fn`（Scope S1 各 sub-item のとおり）。加えて S1g（round 2 是正）で `IntegrityCheckPage.tsx:348`/`OperationLogsPage.tsx:502` の table wrapper が `rounded-md` → `rounded-lg` に統一される（`bg-card` は付かない）
- AC2: `Pagination` が `totalPages <= 1` で何も描画しない、`totalPages > 1` では従来どおり描画する — 新規 vitest（`Pagination.test.tsx` 拡張、SC1a〜SC1c）。既存の「`totalCount === 0` は『0 件』を表示する」test は本変更で「`totalCount === 0` は null を描画する」へ書き換える（削除ではなく仕様変更としての更新、既存 test の無効化には当たらない）
- AC3: `PaginationSummary` が新規に `text-sm text-muted-foreground tabular-nums` を持つ（`text-base text-foreground` は 0 件） — `rg -Fn "text-base text-foreground tabular-nums" src/components/patterns/Pagination.tsx` = 0、`rg -Fn "text-sm text-muted-foreground tabular-nums" src/components/patterns/Pagination.tsx` = 1（下部の分割表記とは別、Scope S2 の oracle 注記参照）
- AC4: 7 画面すべてで `totalCount > 0` の結果表示時に上部 `PaginationSummary` が描画され、かつ Scope S3 の既存 test 是正リスト（5 file 9 箇所、round 3 で拡大）がすべて pass する — 各 Page.test.tsx 新規/是正 assertion（Scope S3 各 sub-item）。**例外（round 2/3 是正）**: 在庫照会のみ上部 summary は `statusValue === "all" && (totalCount ?? 0) > 0` のときだけ描画される（下部と同条件、`source: "low_stock"` または `totalCount === 0` では上下とも非表示のままでよい）
- AC5: 51 件 / perPage 50 のとき page 2 で「前へ」が有効表示される — `Pagination.test.tsx` 新規 edge test
- AC6: 表示件数 `Select` が 8 画面すべてで filter/toolbar 枠内の最後尾 — `StocktakePage.test.tsx:1055`（SC10 rewrite）、`PriceRevisionFilters.tsx`/`PriceRevisionPage.tsx`（配線先の変更 + `PriceRevisionPage.test.tsx:694-703` SC9a の pass 維持）。他 5 画面は既存 DOM 順が変わらないことを既存 test の pass 維持で確認（回帰）
- AC7: `StocktakePage.test.tsx:1042`（SC8c'）が `Pagination` の `totalPages<=1` null 化後も pass する（fixture の `total_count` を perPage 超に上げる、または前へ/次への不在を assert する形へ是正）
- AC8: `StocktakePage.tsx:854` の `<fieldset>` が単一ページで描画されない — 新規 assertion（Scope S5）
- AC9（round 3 是正、Opus P1）: `ListShell.tsx` は本 lane で **S9 の範囲でのみ**変更される（`identityColumns` の活性化、識別列 class）。`:343` の wrapper 完全一致 assertion を含め、S9 と無関係な既存 it は無変更のまま pass する。ただし S2（`text-base`→`text-sm`）により `ListShell.test.tsx:96,98,107,119` の `.text-base` 判別子は書き換えが必要（Scope S3 参照、AC4 の是正リストに含む）—「`ListShell.tsx` を一切変更しない」という当初の言明は誤りだったため訂正する
- AC10: DSR-22 の文言が新形へ更新される（`topSummary` の既存 opt-in 機構、および `identityColumns` が商品一覧で実装済みとなった事実と矛盾しない形で） — Scope S6 の `rg -Fn` 完全一致検査
- AC11: catalog ⑩ の文言・構造例・トークン記述・`totalCount===0` 系の pre-S2 記述（`:643`,`:648`）が新形へ更新される — Scope S7 の `rg -Fn`/`rg -c` 完全一致検査
- AC12: catalog ⑯ 項目 2 のみ新形へ更新され、項目 3（`w-min min-w-full`）は無変更のまま残る — Scope S8 の `rg -Fn` 完全一致検査（新形出現 + 旧項目 3 残存の両方を確認）
- AC13（round 2 是正、Opus P2。round 3 で行番号を再確認）: `page > totalPages` の状態で描画される画面が無いこと — 8 画面のうち `StockInquiryPage.tsx:194`（`isOutOfRangePage`）と `OperationLogsPage.tsx:455`（`outOfRange`）の 2 画面は既存の「先頭ページに戻る」`EmptyState` で明示的に検知・復帰する。残り 6 画面は専用の範囲外検知 UI を持たず、フィルタ変更時に page をリセットする既存 handler（`Error, empty, retry, and recovery behavior` 節に例示済み）のみで防いでいる。下部 `Pagination` が `totalPages<=1` で非表示になっても、フィルタ変更で `totalCount` が変わった直後に一時的に `page > totalPages` になり得る経路が新たに生まれていないことを、フィルタ変更で `totalCount` を perPage 未満へ減らす新規 test 1 本（対象画面は Writer が残り 6 画面から 1 画面選定、既存の page-reset handler 経路を通る）で確認する — 新規 vitest 1 本
- AC14（owner 決定 2026-09-05 第 2 便、識別列固定。round 3 是正で toolbar sticky を削除、z-index を追加）: 商品一覧の `thead th`/`tbody td` の先頭 2 列（商品コード・商品名）に `sticky`（`left-0`/`left-[7rem]`）・不透明背景（`tbody` は `bg-background`）・`z-[1]`（`tbody`）・`z-[11]`（`thead th`、round 3 追加）・右端の境界（`shadow-[inset_-1px_0_0_var(--border)]` + `forced-colors:border-r`）が付き、3 列目以降には付かない。toolbar frame への sticky 追加は行わない（round 3 是正、no-op と判明、下記 Alternatives/Residual Risk 参照）。他 7 画面の table には一切変更が無い — 新規 vitest（`ListShell.test.tsx` 拡張: `identityColumns` あり/なしの対照を root の class token で確認、`ProductListPage.test.tsx`/`ProductTable.test.tsx`: `identityColumns={2}`/`w-28` の配線確認）
- AC-L3-1（owner Windows native L3。round 3 是正で toolbar 固定の記述を削除、確認事項を修正）: 商品一覧で窓を狭めると商品コード + 商品名と列見出しが固定されたまま右側の列（toolbar 枠を含む）だけが横に流れ、縦 scroll でページが横にジャンプしない。`left-0` が `<main>` の左端（`p-6` gutter の外側）を基準にすることは sticky-top の既存挙動と同型であり defect ではない（既知の相互作用 (e) 参照）。横スクロール中に商品名列（列 2）の左端が商品コード列（列 1）に重ならないことを実データで確認する（`w-28` の想定が実際の `product_code` の長さを covers するかの検証、起票時実測「幅の前提」節参照）。行 hover・選択行・現在行の背景が識別列の 2 セルだけ乗らない見え方（Residual Risk、L4-D11）を owner が許容できるか、または `[&_tbody_tr]:bg-background` 代替案への切替えを求めるかを確認する
- AC-L3-2（owner Windows native L3）: `Pagination.tsx` の複数ページの画面 1 つで下部ページ送りが表示され、単一ページの画面 1 つで下部ページ送りが非表示になる（上部件数のみ残る）
- AC-L3-3（owner Windows native L3）: 表示件数 `Select` の位置が 8 画面で揃って見え、filter/toolbar 枠の地色が対象 6 画面（整合性チェックを除く、round 2 是正）で揃って見える

## Design Sources

- Requirements / spec: 該当なし（新規 REQ 追加なし）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層内の class/component 構成変更のみ）
- Function / command / DTO: 該当なし
- DB: 変更なし
- Screen / UI: `docs/design-system/00-foundations.md`（`--card` #f5f5f4、変更なし・正本参照のみ）/ `docs/design-system/01-decision-rules.md` DSR-17（`:292`、`<main>` 単一 scroll 契約、参照のみ）/ DSR-22（`:429`、S6 で改訂。識別列 mapping 表 `:431-439` は参照のみ・変更なし）/ `docs/design-system/02-component-catalog.md` ⑩ ページネーション（S7）/ ⑯ 一覧の器（S8）/ `docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`（S17、`w-min min-w-full` の導入経緯、参照のみ・変更なし）/ `src/components/layout/RootLayout.tsx:65`（`<main>` の `overflow-auto`、参照のみ・変更なし）
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
| source doc の `## 更新履歴` 表への行追加（round 3 追加、Sonnet、⑦/⑧ packet 先例） | S6/S7 で `01-decision-rules.md`・`02-component-catalog.md` の各 `## 更新履歴` 表（`| 日付 | PR | 内容 |`）に本 lane の行を追加する。`rg -Fn "UI 一覧の背骨 D — Lane 4"` が両 file で ≥ 1 になることを完了条件とする |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | 起票時実測「識別列固定の実装方式：新規 scroll 容器を作らない」節 | L4-D1（2026-09-05、owner 決定第 2 便で改訂） | E12 当初案（新規 `overflow-x:auto` box + 識別列 sticky）は、CSS の overflow 計算規則（`overflow-x: auto` は `overflow-y` を `auto` へ computed する）により当該容器を独立 scrolling ancestor に変え、DSR-17 `:292` の「`<main>` が唯一の scroll container」契約と衝突するため引き続き不採用。owner は D（表を縮ませる、実測で効果僅少）ではなく、新規容器を作らない識別列固定（`<main>` が既に `overflow-auto` で両軸 scroll 可能、`RootLayout.tsx:65`）を選定した。`ListShell.tsx` の `identityColumns` prop を商品一覧のみ活性化する（S9） | `ListShell.tsx`、`ProductListPage.tsx` | S9 新規 assertion |
| — | 起票時実測「item (1) 書換えの経緯」節 | L4-D2（2026-09-05、owner 決定第 2 便で改訂） | round 1/2 是正で「表を縮ませる」対象を商品一覧 `ProductTable.tsx` の部門列折返しに限定していたが、Opus round 2 の実測で部門列折返しの floor 効果は −0〜56px 程度に留まり、floor の主因は商品名 `min-w-[14rem]`＝224px と数値 3 列の nowrap と判明した。owner はこの実測を受け D を取り下げ、識別列固定へ item (1) を書き換えた。`ProductTable.tsx` の部門列 `whitespace-normal` 化は行わない（column class は無変更） | なし（旧 L4-D2 は撤回） | 該当なし |
| — | 起票時実測「DSR-22 識別列 mapping 表と本 lane の対象」節 | L4-D1 続き（2026-09-05） | `stickyHeader` を採用する `ListShell` caller は `ProductListPage.tsx:284` のみで、他 7 画面（同じ「商品系」mapping 行に属する在庫照会・一括価格改定・整合性チェックを含む）は `table.tsx:9` の `overflow-x-auto` により内部 scroll するため出っ張らず、`identityColumns` を本 lane では配線しない（将来 opt-in 時に同じ機構を再利用） | なし（Non-scope、後続 lane 候補） | 該当なし |
| — | 起票時実測「`identityColumns` の API 選定」節 | L4-D10（2026-09-05） | `identityColumns?: number`（予約済みの型）をそのまま使い、実装は値 1/2 のリテラル class 配列 lookup に限定する（DSR-22 mapping 表の全行が 1 か 2 のため、任意 N 列の generator は YAGNI）。列 2 の `left-[7rem]` は列 1 の固定 width class（`ProductTable.tsx` 商品コード `w-28`）に依存し、`ResizeObserver` 等の動的計測は導入しない（ponytail、固定値の妥当性は AC-L3-1 で確認） | `ListShell.tsx`、`ProductTable.tsx` | S9 新規 assertion |
| — | Residual Risk「固定列の行 hover/選択背景が追随しない」節 | L4-D11（2026-09-05） | 識別列 cell を `bg-background` で不透明化すると、`TableRow` の `hover:bg-muted/50`/`data-[state=selected]:bg-muted` が乗らなくなる既知の trade-off。動的背景の伝播は `ListShell` の「children に className を渡さない」方針（D-9）と衝突するため本 lane では対応せず、owner L3 で許容可否を確認する | なし（許容前提、L3 で確認） | AC-L3-1（所感確認のみ） |
| — | Plans.md ④ R5-4 owner 決定 | L4-D3（2026-09-05） | owner は「既存 `--card` #f5f5f4 に統一、新規 token なし」を明示（R5-4 sub-bullet の `--list-toolbar`（仮）token 案は旧案として本 packet が supersede する）。理由は既存 toolbar 枠（商品一覧）との統一で追加の視覚差分を持ち込まないこと | 7 画面の filter/toolbar 枠 | S1 各新規 assertion |
| — | Plans.md ④ R2-1 owner 決定 | L4-D4（2026-09-05） | 上部は常時表示・ボタンなし、下部は複数ページ時のみという上下非対称の設計は、Q12 §1「初心者ほど操作体系はシンプルなほうがよい」（DSR-22 Why 既存引用）を単一ページ時にも徹底したもの。共有 component（`Pagination.tsx`）1 箇所の修正で 8 画面全 caller に反映する設計を採る（owner「呼出し元を直せば一気に全部変わる設計」選好、Lane 3 flag 是正の先例と同型） | `Pagination.tsx` | S2 新規 assertion |
| — | Plans.md ④ R5-2 owner 決定 | L4-D5（2026-09-05） | 表示件数 Select は toolbar 枠内の右端に統一。起票時実測で 5/7 画面は既に最後尾のため、構造変更が必要なのは棚卸し（reorder）と一括価格改定（Filters への移設 + prop 配線）のみ。既に条件を満たす画面まで無用に書き換えない（ponytail: 既に満たす契約への追加変更は避ける） | `StocktakePage.tsx`、`PriceRevisionFilters.tsx`/`PriceRevisionPage.tsx` | S4 各新規/是正 assertion |
| — | `StocktakePage.tsx:854` fieldset | L4-D6（2026-09-05、round 1 是正で新規） | `Pagination` の `totalPages<=1` null 化により `<fieldset>` の唯一の子が消え空要素が残る。他 2 箇所（`IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243`）は `space-y-*` container 内の兄弟要素で null 子は描画されず stray gap を生まないため verified non-issue とし、`StocktakePage.tsx` のみ `totalPages` を computed して `<fieldset>` 自体をガードする | `StocktakePage.tsx` | S5 新規 assertion |
| — | `rangeText` の `totalCount === 0 → "0 件"` 分岐 | L4-D9（2026-09-05、round 1 P3 disposition） | `Pagination`（下部）は S2 で `totalPages<=1` を早期 null 化するため `totalCount===0` の場合に `rangeText` の「0 件」分岐へ到達しない。`PaginationSummary`（上部）も production caller は S3 で `totalCount > 0` の結果表示分岐内でのみ mount するため同様に到達しない。したがって本 lane の完了後、この分岐は現行 production 経路からは事実上到達不能になるが、防御的フォールバック（呼び出し側が将来ガードを外した場合に `NaN`/負値の range 計算を防ぐ）として残す方が、全 caller を洗い出して削除する労力より小さい——**keep**（ponytail: 削除しないことを明示する） | `Pagination.tsx`（変更なし） | 既存 `Pagination.test.tsx` の当該 case（「0 件」→「null を返す」へ更新、AC2） |
| — | `01-decision-rules.md` DSR-22 / `02-component-catalog.md` ⑩⑯ | L4-D7〜D8（2026-09-05） | S6/S7/S8 の文言改訂は実装（S1〜S5）に一致させる事後同期であり、新規ルールの追加ではない。⑯ 項目 3（`w-min min-w-full`）は実装が不変のため文言も不変 | 3 doc | S6/S7/S8 の `rg` 完全一致検査 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 packet の「起票時実測」節が値・機序・理由の一次情報。実装後は S6〜S8 で DSR-22/catalog へ反映し packet 依存を解消する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし。L4-D1〜D11 は実装詳細の Coordinator/owner 判断のため packet 止まりでよい（owner 決定 R2-1/R5-2/R5-4/E12/item(1)書換えは既に Plans.md ④ に記録済み）
- Assumptions and constraints: 対象範囲を商品一覧 1 画面（識別列固定）+ 8 画面共通（frame/pagination/Select）に確定。商品コード列の固定幅（`w-28`）は仮定であり AC-L3-1 の owner 実機確認で検証する
- Deferred design gaps, risk, and follow-up target: 他 7 画面への `identityColumns` opt-in（同じ機構を再利用）。固定列の行 hover/選択背景の非追随（Residual Risk、L4-D11）
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-list-backbone-d-lane4.md) 各行に L4-D 番号か DSR-22/catalog 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は `StockMovementsPage.tsx:98` 商品情報 card（別 section、不変）、`IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` の null-child no-op（verified non-issue）、固定列の hover/選択背景非追随（L4-D11、owner 許容前提）のみ。すべて起票時実測・Review Focus・Residual Risk で列挙し、抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の class/component 構成変更のみ | — |
| Fact check / design decision split | 適用: Plans.md ④ R2-1 の「在庫照会で観測」claim を実コードで再確認し、現状は該当挙動が存在しないことを確認（起票時実測節）。加えて Plan Review round 1/2 の Opus 指摘と owner 決定（item (1) 書換え）を実装・既存 test に対して裏取りし accept | 起票時実測「Plans.md ④ の記録済み claim の訂正」、`## Review Response` |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 商品一覧の識別列固定 + 8 画面のページ送り・表示件数配置・枠地色が変わる。owner L3 で確認（AC-L3-1〜3） | AC-L3-1〜3 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜3） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし。Playwright 等の新規依存は追加しない（Non-scope）。`<main>` の `overflow-auto` は既存実装（変更なし） | — |

## Design Readiness

- Existing design docs are sufficient because: DSR-17（`<main>` 単一 scroll）/ DSR-22（一覧の器・識別列 mapping 表）/ catalog ⑩⑯ は Lane 2〜5 で正本化済み。本 lane は DSR-22 が既に想定していた「Lane 3〜5 で識別列 sticky の両立方式を確認する」を実施し、`identityColumns` prop（Lane 2 で予約済み）を活性化するのみで、新規 token・新規 component は追加しない
- Source docs updated in this PR: `01-decision-rules.md` DSR-22（S6、S9 の実装結果を反映）/ `02-component-catalog.md` ⑩（S7）/ ⑯ 項目 2 のみ（S8）
- Design gaps intentionally deferred: 商品一覧以外の 7 画面への `identityColumns` opt-in（Non-scope、後続 lane）。固定列の hover/選択背景非追随（L4-D11）
- Durable decisions discovered in this plan and promoted to source docs: なし（既存 owner 決定の執行）
- **新規 scroll 容器の不採用は維持（Design Readiness 固有の記載事項）**: E12 当初案「横 scroll 容器 + 識別列 sticky」のうち、**新規 `overflow-x:auto` 容器を作る**部分は、DSR-17 の `<main>` 単一 scroll 契約と CSS の overflow 計算規則（`overflow-x: auto` は `overflow-y` を `auto` へ computed し、独立 scrolling ancestor を作る）から静的に導ける矛盾により Contract Probe（追加実験なし）で不採用のまま。owner が 2026-09-05（第 2 便）で選んだ方式は**新規容器を作らず**、既存の `<main>`（`overflow-auto`、`RootLayout.tsx:65`）に `sticky left-*` を追加するだけであり、この矛盾に抵触しない
- **wrapper 不変の記録（round 1 是正、維持）**: `ListShell.tsx:99` の `w-min min-w-full` は Lane 2 追補 S17 の意図した挙動（横 overflow 時の帯追随、owner AC-L3-2 確認済み）であり、`ListShell.test.tsx:343` の完全一致 assertion で保護されている。本 lane（識別列固定への書換え後も）この wrapper に触れない

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層内の class/component 構成変更のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 該当なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言変更なし（件数文言そのものは Lane 3 で確定済み）、見た目（識別列固定・枠・配置）のみ
- Error, empty, retry, and recovery behavior: `Pagination` の `totalPages<=1` null 化は EmptyState 分岐（既存、totalCount===0 は先に EmptyState で処理される）と重複しない副作用のみ。既存の error/empty/loading 分岐は不変。フィルタ変更時に page をリセットする既存 handler（例: `StocktakePage.tsx` の部門/未入力のみフィルタが `page: 1` を設定、`StockInquiryPage.tsx` の検索語・部門・状態フィルタが `page: undefined` を設定）はいずれも本 lane で変更しないため、下部 pager が消えても「範囲外 page に取り残される」経路は生まれない（Writer は実装時に全 8 画面のフィルタ handler をこの観点で再点検する。上記 2 画面は本 packet 起草者が確認済みの代表例で、残り画面の網羅的な確認は Writer の実装時作業とする）
- Testability and traceability IDs: 新規 REQ 追加なし

## Contract Probe

- E12 当初案「新規 `overflow-x:auto` 容器 + 識別列 sticky」の不採用: 起票時実測「識別列固定の実装方式」節に記載の CSS 仕様（overflow-x/overflow-y の computed 規則）と DSR-17 `:292` の `<main>` 単一 scroll 契約から静的に導出。追加実験不要（N/A、Playwright/headless Chromium は使わない）
- `<main>` が既に横 scroll 可能という前提: `RootLayout.tsx:65` `className="min-h-0 min-w-0 overflow-auto"` を実読で確認済み（Tailwind `overflow-auto` = 両軸 `overflow: auto`）。追加実験不要（静的コード確認、N/A）
- `ListShell` sticky thead の `top` 基準・`w-min min-w-full` wrapper の追随挙動: wrapper 自体は本 lane で変更しない。`left-*` の追加が `top-*`/`overflow-visible` の既存指定と独立して共存することは CSS 仕様（`position: sticky` の各オフセットは独立）から静的に導出、追加実験不要（N/A）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| L4-D1 識別列固定、新規 scroll 容器なし（owner 決定第 2 便） | `ListShell.tsx`、`ProductListPage.tsx` | S9 新規 assertion | AC-L3-1 |
| L4-D2 D（表を縮ませる）取り下げの理由（Opus round 2 実測） | なし（記録のみ） | 該当なし | non-scope |
| L4-D10 identityColumns API 選定 + 幅の前提 | `ListShell.tsx`、`ProductTable.tsx` | S9 新規 assertion | AC-L3-1 |
| L4-D11 固定列 hover/選択背景 非追随（residual risk） | なし（許容前提） | 該当なし | AC-L3-1（所感） |
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
| S9 識別列固定の実装 | `ListShell.tsx`、`ProductListPage.tsx`、`ProductTable.tsx` | `ListShell.test.tsx`/`ProductListPage.test.tsx`/`ProductTable.test.tsx` 新規 assertion | AC-L3-1 |

## 実装原則（ponytail、full）

書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（`<input type="date">`、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。

本 lane での適用例: S2 は `Pagination.tsx` 1 箇所の修正で 8 画面全 caller に反映する（画面ごとに個別ロジックを複製しない）。S4 は起票時実測で既に条件を満たす 5 画面には触れず、満たさない 2 画面のみを直す（満たしている契約への冗長な書き換えをしない）。S9（識別列固定）は既存の予約 prop `identityColumns` をそのまま使い、値は DSR-22 mapping 表が要求する 1・2 のみに対応するリテラル class 配列で足りるため、任意 N 列の generator は作らない（YAGNI）。配線も症状のある商品一覧 1 画面に限定し、症状のない 7 画面への投機的な配線をしない。

## Test Plan

Test Design Matrix: [test-matrices/2026-09-05-ui-list-backbone-d-lane4.md](test-matrices/2026-09-05-ui-list-backbone-d-lane4.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate（本 lane は frontend のみだが release check の慣行は維持する）。

- targeted tests: 商品一覧の識別列固定 class assertion（`identityColumns` あり/なし対照）、8 画面 + `Pagination` の class・DOM 順・条件分岐 assertion（既存 test file の拡張が中心、新規 test file は原則追加しない）
- negative tests: `totalPages <= 1`（0 件含む）で `Pagination` が描画されないことの対照 case、EmptyState 分岐で新規 `PaginationSummary` が誤って描画されないことの対照 case、`identityColumns` 未設定時に固定 class が付かないことの対照 case、7 画面に `identityColumns`/table 幅変更が本 lane で混入していないことの回帰
- compatibility checks: `ListShell.test.tsx` 既存 17 it のうち S9 と無関係な it が pass のまま（AC9、`:96,98,107,119` は S2 の影響で是正対象）、`Pagination.test.tsx` の「0 件」表示 test は仕様変更として更新（削除ではない）、`StocktakePage.test.tsx:1042`/`:1055`、`PriceRevisionPage.test.tsx:694-703`、`IntegrityCheckPage.test.tsx:414`、`OperationLogsPage.test.tsx:281,293,420,432`、`StockInquiryPage.test.tsx:526`、`ProductListPage.test.tsx:632-637`、`Pagination.test.tsx:71` の既存 test 是正
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: `PriceRevisionFilters` への perPage prop 追加が `PriceRevisionPage.tsx` の既存 state/handler と正しく配線されること（S4b、既存 SC9a が oracle）

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（class 文字列・component 構成・条件分岐の変更のみ）。

## Review Focus

- `ListShell.tsx` の識別列 class が `identityColumns` の値（1/2）ごとのリテラル配列で実装され、実行時テンプレートリテラルで class 文字列を組み立てていないこと（Tailwind JIT が静的解析できる形か）
- 識別列（商品コード・商品名）以外の列に `sticky`/`left-*`/`bg-background`/`z-[1]` が付いていないこと、`identityColumns` を渡さない呼び出しで固定 class が一切付かないこと
- 商品一覧以外の 7 画面に `identityColumns` の配線・table 幅変更が一切入っていないこと（Non-scope 逸脱の検出）
- `ListShell.tsx:99` の `w-min min-w-full` wrapper・`top`/`overflow-visible` 指定が無変更のこと（`ListShell.test.tsx` 17 it が pass、特に `:343` の wrapper 完全一致）
- `Pagination.tsx` の `totalPages <= 1` null 化（S2）が `totalCount === 0` の既存契約（EmptyState 分岐が先に処理する前提）と矛盾しないこと
- 上部 `PaginationSummary` ロールアウト（S3）が EmptyState / エラー / ローディング分岐に誤って描画されないこと、かつ重複文言による既存 test 破綻（`IntegrityCheckPage.test.tsx:414` 等）がすべて是正されていること
- `PriceRevisionFilters` への perPage 移設（S4b）が既存の `patchSearch`/`scrollPageToTop` 呼出しと `PriceRevisionPage.test.tsx:694-703`（SC9a）を壊していないこと
- `StocktakePage.tsx:854` の `<fieldset>` が単一ページで空要素として残っていないこと（S5）。`IntegrityCheckPage.tsx:417`/`StockMovementsPage.tsx:243` は verified non-issue のため変更が無いことを確認する
- Non-scope（新規 scroll 容器、`StockMovementsPage.tsx:98`、商品一覧以外の 7 画面への `identityColumns` 配線・table 幅変更）に列挙した項目が変更されていないこと
- toolbar frame への `sticky` 追加を実装してしまっていないこと（round 3 是正、no-op と判明したため Non-scope）。summary 帯（Lane 2 S17 の table 幅追随）は無変更のこと
- 在庫照会の上部 summary（S3b）が下部と同じ `statusValue === "all" && totalCount !== null` 条件で描画されること（round 2 是正）
- `IntegrityCheckPage.tsx:234` の Select 単独ラッパーに frame（`bg-card`）が付いていないこと、`IntegrityCheckPage.tsx:348`/`OperationLogsPage.tsx:502` の table wrapper が `rounded-lg` に統一されていること（round 2 是正、S1）
- フィルタ変更で `totalCount` が減っても `page > totalPages` の状態で描画される画面が無いこと（AC13、round 2 是正）

## Spec Contract

Contract ID: SPEC-UILB-D6

- 商品一覧で窓を狭めると商品コード + 商品名と列見出しが `<main>` 基準で左端に固定され、右側の列だけが横に流れる（Excel 型識別列固定、他 7 画面は不変）。ページ送りが上部常時表示（ボタンなし）・下部複数ページ限定へ切り分けられ、表示件数 `Select` の位置と filter/toolbar 枠の地色（既存 `--card`）が 8 画面で統一される

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UILB-D6 | S9（識別列固定） | `ListShell.test.tsx`/`ProductListPage.test.tsx`/`ProductTable.test.tsx` 新規 assertion | 商品一覧の識別列固定 | vitest |
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

Plan Review round 1（独立 Sonnet subagent、fresh context + Opus 5、read-only claims-producer、D-056）: **reject**。P1 2 件（`P1-1`/`P1-2`、下記）、Coordinator が実装・既存 test に対して実読で裏取り:
- P1-1（accept）: `ListShell.tsx:99` の `w-min min-w-full` wrapper 撤去は、Lane 2 追補 S17（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane2.md:165`）が意図した「横 overflow 時に summary 帯が table 幅へ追随する」挙動を破壊する。owner が AC-L3-2（Lane 2 L3）で確認済み、`ListShell.test.tsx:343` が `className` の完全一致 assertion で保護している。是正: wrapper は不変のまま、旧 S1（wrapper 撤去）を全面撤回し、対象列の折返しで min-content の床を下げる方式へ転換
- P1-2（accept）: 表を縮ませる対象は `stickyHeader` を採用する商品一覧 `ProductListPage.tsx:284` の 1 画面のみで、他 7 画面は `table.tsx:9` の `overflow-x-auto` により内部 scroll するため出っ張らない。旧 S2b〜S2f（6 画面の長文列折返し・固定 table 幅撤去）を Non-scope へ撤回
- P2-9（accept）: `ProductTable.tsx` 部門列の折返しに新規 `min-w-*` の床を追加しない（既存 `whitespace-normal` 1 class のみ）
- `round 2`（独立 Sonnet subagent、Plan Review 継続）: 新規 P2 3 件、P3 2 件（下記）。`P1-1`/`P1-2` は round 1 是正で解消済みのため round 2 の対象外（moot、既に反映済み）と明記:
  - P2（accept）: 上部 `PaginationSummary` 新設で件数文言が DOM に 2 回現れ、単数一致の `screen.getByText(...)` を使う既存 test（`IntegrityCheckPage.test.tsx:414`、`OperationLogsPage.test.tsx:281,293,420,432`、`StockInquiryPage.test.tsx:526`）が壊れる。S3 に是正を追加（`getAllByText`/`within` への書き換え）
  - P2（accept）: `PriceRevisionPage.test.tsx:694-703`（SC9a）を SC4b の配線退行 oracle として明示引用し、`onPerPageChange` 配線漏れ mutant を検出する既存 test であることを failure-mode に記録
  - P2（accept）: `AC5`/`S2` の oracle が誤り——`text-sm text-muted-foreground tabular-nums` は今日 0 件（下部は `text-sm text-muted-foreground`（外側）と `tabular-nums`（内側）に分割済み）。oracle を「新規に 1 箇所だけ出現する」検査へ訂正し、`rg -c` は一致行数を数える点を明記
  - P3（accept）: catalog `text-base text-foreground tabular-nums` の出現数を「起票時 2 箇所（`:612`,`:645`）」と明記
  - P3（accept）: catalog `:643`/`:648` の pre-S2（`totalCount===0`）記述を S7 に追加し、新旧の対句オラクルを記録

Plan Review round 2（Opus 5、read-only claims-producer）: **reject**（第 1 便のみ反映。Sonnet 側の並行 round 2 は rate limit で中断——Workflow State の妥当性検証のみ完了、実装差分の指摘には至らず）。Coordinator が実装・既存 test に対して実読で裏取り、item 1/3/4（部門列折返しの効果と floor 概算の是非）は owner 決定待ちのため本 commit では触れず、次便で扱う:
- P1（accept）: 在庫照会の下部 `<Pagination>` は `statusValue === "all" && data.totalCount !== null`（`totalCount: number | null`、`types.ts:54`）でのみ描画される。S3b の上部 `PaginationSummary` にも同一条件を明記し、AC4 に在庫照会の例外を追加した
- P2（accept）: `page > totalPages` の検知は `StockInquiryPage.tsx:196`/`OperationLogsPage.tsx:452` の 2 画面のみが専用 `EmptyState` を持つ。残り 6 画面向けに AC13 + Matrix SC8（1 本）を追加した
- P2（accept）: `PriceRevisionFilters.tsx:46` に取引先 native `<select>` が残る件は、lane ⑧（merge train Lane 5 → ⑧ → Lane 4）が本 lane の実装前に置換する前提であることを S4b に明記し、⑧ 未 merge のまま実装した場合の既知残件を新設 `## Residual Risk` に記録した（本 lane では対応しない）
- P2（accept）: `IntegrityCheckPage.tsx:234` は `phase === "completed" && result !== null` でのみ描画される Select 単独ラッパーで filter フィールドを持たないため、S1 の frame sweep（7→6 画面）と AC1/AC-L3-3 から除外した
- P3（accept）: `StocktakePage.tsx:821-852` の else 分岐は現在 `<Table>` を裸で返す。S3a の記述を「1 行追加」から「Fragment/div で `<Table>` を包み直す」へ訂正した
- P3（accept）: filter frame が `rounded-lg` になる一方、`IntegrityCheckPage.tsx:348`/`OperationLogsPage.tsx:502` の table wrapper が `rounded-md` のまま残ると角丸が食い違う。S1g（新設）で両 file の `rounded-md` → `rounded-lg` を同じ sweep に含めた（`bg-card` は付けない）
- 本 packet はこれらすべてを反映済み。item 1/3/4（floor 概算・折返し効果、owner 決定待ち）は次便で扱う。次回 Plan Review で新規 P1/P2 なしを確認後、`plan-gate -> plan-approved` へ進める予定
2026-09-06: Plan Gate 収束（round 3/3。round 1 = Opus reject P1 5〈S1 は Lane 2 S17 の巻き戻し、商品一覧のみが症状画面〉/ Sonnet reject → 是正 `309e5e1` / round 2 = Opus reject〈部門折返しの効果僅少〉→ owner 決定で item (1) を識別列固定へ書換 `ab538ce` / round 3 = Opus reject〈toolbar sticky は containing block 幅で無効、識別列 th の z、text-base 変更の test 影響〉+ Sonnet approve-with-P2 → 是正 `89d448c`）。同一 vendor ラリー天井のため round 3 是正は Coordinator が該当行を検分して閉じた（owner 許可 2026-09-05）。⑧ tip `885c10d` へ単段 merge `d8a659b` + 行番号再検証 `a850d04` で積み直し済み。`plan-draft -> plan-gate -> plan-approved -> implementing` を Plans.md ④ 同期の本 content commit に同乗させて遷移。Plan Commit = `59c243d`（plan-first commit、Lane 5 tip `04f89a4` 直上、以後の是正・merge commit はその子孫）。Codex ロジックレビュー 1 回は §3.3 pending。

2026-09-06: Final Review round 1 = Opus reject（P1 SC3b negative oracle が「0 件」を見ない〈mutant 生存を実証〉/ P2 範囲外 page で pager 消失 / P2 件数行 14px muted の原則 1 例外未記録 / P3 ×5）+ Sonnet fresh approve-with-P2（test oracle 穴 3: 棚卸し・在庫照会の枠 assertion 無し、在庫変動履歴の selector 衝突、在庫照会 0 件 negative 無し）→ Writer 是正 `5916045`（src + test）`ae45f17`（docs: backbone 原則 1 と review-checklist に件数行の例外）、Matrix SC7 是正 `4b832e6` → 独立 closure 再注入（fresh Sonnet、隔離 worktree）で 6/6 kill、full suite pass、L1 full RESULT=PASS（evidence は PR body）。P1/P2 = 0 を確認し `implementing -> local-verified -> independent-review -> human-confirm` を Plans.md ④ 同期の本 content commit に同乗させて遷移、Reviewed Content HEAD = `ae45f17`。次 = owner Windows native L3（AC-L3-1 識別列固定〈商品一覧、窓を狭めて 2 列と見出しが残り右側だけ動く / hover・選択行の背景が固定列で消える点の受容 / 商品名が商品コード列に重ならない〉/ AC-L3-2 ページ送り〈複数ページ画面で上は小さい件数のみ・下に前へ次へ、単一ページで下が無い〉/ AC-L3-3 件数 Select が枠内右端・枠地色が揃う、特大 × 125% を 1 回、介入 2/3）→ Codex 1 回（§3.3 pending）→ Findings Freeze → ready-hosted-final。

- Findings Freeze: not yet frozen（Codex ロジックレビュー待ち）; post-freeze exceptions: none.

**owner 決定（2026-09-05、第 2 便）**: item (1) を D（表を縮ませる、round 1/2 で商品一覧の部門列折返しに縮小）から**識別列固定**（Excel 型、`<main>` 基準 sticky-left、商品一覧のみ）へ書き換える。Opus round 2 item #1/#3/#4 が指摘した通り、D の実測効果は僅少（部門列の折返しで floor が −0〜56px 程度しか動かず、floor の主因は商品名 `min-w-[14rem]`＝224px + 数値 3 列の nowrap であり、部門列折返し単体では出っ張り解消に実質寄与しない）。この owner 決定により、旧 L4-D2（ProductTable 部門列 whitespace-normal）と floor 概算節は全面撤回し、識別列固定（新設 S9）に置き換える。詳細は「起票時実測」節と Design Intent Trace L4-D1/D2（改訂）を参照。（当初は toolbar 自体の sticky-left も含めて構想したが、round 3 の Opus P1 で no-op と判明し撤回——下記 round 3 参照）

Plan Review round 3（Sonnet: approve-with-P2、Opus 5: reject。Final drafter pass、Coordinator が変更行を事後確認）:
- P1（accept）: toolbar frame の `sticky left-0` は no-op——containing block chain（`ListShell.tsx:79` root → `PageShell.tsx:21` → `RootLayout.tsx:65` `<main>`）がいずれも `<main>` 幅を超えないため sticky range が 0。S9 / 最小完了条件 / AC-L3-1 / Matrix SC9c から撤回し、Alternatives（`container-type: inline-size` + `w-[100cqw]` 案、別 lane）と Residual Risk に記録した
- P1（accept）: `ListShell.tsx:45` は全 `thead th` に一律 `z-10` を付与するため、識別列の `th` が横スクロール後に他の `th` に重なって描画され得る。識別列 `thead th` に `z-[11]`（`:107` 帯の `z-20` より下、他 `th` の `z-10` より上）を追加し、SC9a に組み込んだ
- P1（accept）: `ListShell.tsx` は S9 の範囲で変更されるため AC9/SC7 の「一切変更しない」は誤りだった。S2（`text-base`→`text-sm`）が `ListShell.test.tsx:96,98,107,119` の `.text-base` 判別子を壊す点を Scope S3・AC4・AC9 に追加した
- P1（accept）: 同じ S2 破壊が `ProductListPage.test.tsx:632-637`（`div.text-base` の `length`/`div.text-sm.text-base` 不在確認）・`Pagination.test.tsx:71`（`toHaveClass("text-base", "text-foreground", "tabular-nums")`）にも及ぶ。S3/AC4 の是正対象を 5 file 9 箇所へ拡大した
- P2（accept）: `identityColumns` の descendant variant 実装では `"sticky left-0"`/`"sticky left-[7rem]"` の連続 3 箇所以上という oracle が不成立になり得る。`rg -c 'nth-child\('` ≥ 4・`rg -Fc 'left-[7rem]'` ≥ 2（`-F` と正規表現エスケープの違いを明記）へ訂正した
- P2（accept）: SC9a/SC9b は実際には `ListShell` root の descendant variant class を検査すべきで、rendered `th`/`td` の classList ではない（`ListShell.tsx:5-6` の設計方針、`ListShell.test.tsx:313-319` の `classTokens(container.firstElementChild)` precedent）。両 SC を root token の contains/not-contains へ書き換え、SC9b の「no column gets sticky」という誤った前提（`stickyHeader` 時は root が常に `[&_thead_th]:sticky` を持つ）を削除した
- P2（accept）: S3b/SC3b の gate 条件を `statusValue === "all" && data.totalCount !== null` から `statusValue === "all" && (data.totalCount ?? 0) > 0` へ訂正した（`totalCount === 0` のとき前者は真になり「0 件」を描画してしまい、失敗定義に抵触する）
- P2（accept）: DSR-22 現在行 3 点（`:443`）の `--row-current` が識別列の `bg-background` 固定で消える点を AC-L3-1 の確認事項に追加し、代替案（`[&_tbody_tr]:bg-background` + 識別列 `bg-inherit`、caveat 付き）を L4-D11 に記録した（owner が L3 で選ぶ）
- P2（accept）: `w-28` + `table.tsx:74` の `whitespace-nowrap` の組合せは、長い `product_code` で列 1 が拡張し列 2 の `left-[7rem]` と重なり得る。AC-L3-1 の確認事項を「折返し・はみ出しが無い」から「商品名列の左端が商品コード列に重ならない」へ訂正し、`seed_demo.rs:226`/`test-fixtures.ts:11` の実例（6 文字）を起票時実測に追記した
- P3（accept）: Gated Amendment 7 S48 は corner mask 技法で box-shadow ではなく、Lane 2 の `forced-colors:border-b` は後に撤去済み（`ListShell.test.tsx:210,311` が不在を assert）。両方の precedent 引用を修正し、技法自体（box-shadow / forced-colors border）は独立の根拠で維持した
- P3（accept）: `left-0` が `<main>` の x=0（`p-6` gutter の外側）に固定される点は sticky-top の既存挙動と同型であり defect でないことを AC-L3-1 に明記した
- P3（accept）: SC9d は `identityColumns={2}` を mock prop capture ではなく rendered `ListShell` root の class token で検証するよう訂正した
- P3（accept、Backlog 記録のみ）: `PluExportPage.tsx:590` の `overflow-x-auto rounded-md border` は S1g（`IntegrityCheckPage.tsx`/`OperationLogsPage.tsx` のみ対象）の後も `rounded-md` のまま残る。本 lane の Scope 外の画面のため変更しないが、drift として記録する——Plans.md の Backlog は Coordinator 領域のため本 packet では編集しない
- Findings Freeze: not yet frozen（round 3 是正の再レビューが未完了、item 1/3/4 の owner 決定は本便で反映済みだが Plan Review 天井 3 に到達しているため Coordinator が次の扱いを判断する）; post-freeze exceptions: none.
