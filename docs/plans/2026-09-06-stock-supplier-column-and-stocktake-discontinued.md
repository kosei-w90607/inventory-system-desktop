# Plan Packet: (d) 在庫少一覧の取引先列 + 棚卸し廃番 badge + R2-3（⑨、owner 決定）

owner 決定（2026-09-05/06、店舗ヒアリング + 合意要約 + owner 決定、`docs/evidence/hearing-2026-09-05-stock-inquiry.sanitized.md` 「owner 決定」節。**未 merge 注記**: 本 file は commit `d6b1007`〈branch `agent/ui-conventions-batch`〉に存在し、本 packet 起票時点〈2026-09-06〉で `main` / Lane 4 系列へ未 merge。同 branch が先に merge されれば本 packet の evidence link は解決する。未 merge のままレビューに入る場合は「起票時実測」節の全文転記を一次情報として扱う）に基づき、(d-1) 在庫少・在庫切れ一覧に取引先列を追加し取引先名で並べる（発注書を取引先別に書くため）、(d-2) 棚卸しリストの行に廃番 badge を追加する（廃棄判断の基準になるため）、を 1 lane として実装する。owner 回答「2 はどっちも廃で」（廃番も取引先消滅も同じ「廃」表示で区別しない）を受け、取引先消滅は (d-3) 「該当商品を廃番に更新する運用」で代替し、専用対応は起票しない。あわせて design-first 候補 ⑦ (d) の R2-3（在庫照会の展開行を再クリックで閉じる）を同乗する。Plans.md ⑨ が本 lane を記録する。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer、D-056）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer）+ Codex ロジックレビュー 1 回（Codex 枠切れ、2026-09-07 夜の週次リセット後に実施。§3.3 Capacity-degraded によりCodex成分は pending のまま Phase を前進させない）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（AC-L3-1〈在庫少・在庫切れ一覧が取引先名順に並ぶ〉/ AC-L3-2〈棚卸しリストの廃番行に badge が出る〉/ AC-L3-3〈在庫照会の展開行が再クリックで閉じる〉の 3 項目）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-06、消費済み）。2 回目 = owner Windows native L3（AC-L3-1〜3）。3 回目 = 承認 + merge（Coordinator 代行）。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator workflow の変更（在庫少・在庫切れ一覧の並び順が取引先名優先に変わる、棚卸しリストに新しい badge 列挙が増える、在庫照会の行クリック挙動が変わる）に加え、Tauri command が返す DTO（`StocktakeItemDetail`）へのフィールド追加と specta bindings 再生成を伴う。DB スキーマ・migration の変更はない（新規カラムは `products.is_discontinued` 参照のみで、`stocktake_repo.rs` の 2 つの SQL は既に `products p` を JOIN 済みのため新規 JOIN も不要）。DEV_WORKFLOW Risk Tiers の R3「operator workflow」「Tauri command DTO」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

**Stacked train（D-074、DEV_WORKFLOW「Stacked train」節）**: 本 branch は Lane 4（`agent/ui-list-backbone-d-lane4`、tip `1a8ba62`〈Draft PR、Phase: implementing、Plan Commit `59c243d`〉）に stack している。merge train 順序: Lane 5 → ⑧（native select 統一）→ Lane 4 → 本 lane（Plans.md ⑧ / ④ の記載を正とする）。先行 lane の squash merge 後は、旧 tip を保存してから最新 `origin/main` を 1 回だけ merge する単段 merge で base を付け替える（rebase しない）。付け替え後の merge delta が実装 file に触れる場合は、その delta を独立に再検証してから Phase を進める。

## Goal

Goal Invariant:

### 最小完了条件

- 在庫少・在庫切れ一覧（在庫照会 `status=stockout|low_stock`、`list_low_stock` 経由）に取引先列が表示され、取引先名 昇順（取引先なしは最後）→ 同名内は在庫数 昇順 → 商品名 昇順で並ぶ
- 棚卸しカウント画面の一覧テーブル（`StocktakePage.tsx` の counted/uncounted 統合テーブル）で、対象商品が廃番のとき行内に「廃番」badge が表示される（`variant="secondary"` + `border-border-strong`〈3:1、Gated Amendment 1 準拠〉+ `Archive` icon）
- 在庫照会の展開行は、選択中の行を再クリックすると閉じる。結果 1 件時の自動展開は同一検索条件（status/q/dept/page）内で 1 度だけ発火し、手動クローズ後に同じ条件のまま再展開しない

### 失敗定義

- 取引先列が表示されない、または並び順が取引先名優先になっていない（取引先なしが先頭に来る、同名内の副次ソートが崩れる 等）
- 廃番商品が棚卸しリストで badge なしのまま表示される、または非廃番商品にも badge が出る
- 展開行が再クリックで閉じない、または自動展開が同一検索条件内で繰り返し発火して手動クローズを打ち消す
- `StocktakeItemDetail` への `is_discontinued` 追加で `bindings.ts` の diff が当該フィールド追加以外の予期しない変更を含む

### 非目的

- 在庫照会への検索条件追加（R2-4。owner 決定「検索条件追加は不要、欲しいのは取引先別に並ぶこと」により Non-scope）
- 取引先消滅の専用データ列・UI 追加（d-3。`suppliers` へ状態列を追加しない設計〈`docs/db-design/master-tables.md:170-182`〉を維持し、「該当商品を廃番に更新する運用」で代替）
- 商品一覧の廃番 badge・棚卸し候補行の廃番 badge 等、既存 secondary badge 全体への枠 3:1 sweep（`02-component-catalog.md` に記録済みの Lane 3〜5 backlog のまま。本 lane は棚卸しリスト行に**新規追加する** badge 1 箇所のみを対象とする）
- 「すべて」view（`search_products` 経由、pagination あり）の並び順・列構成変更

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-06、worktree base `1a8ba62`〈Lane 4 branch tip〉、すべて本 packet 起草者が rg/bat で再確認）

- **(d-1) データ経路**: 在庫少・在庫切れ一覧は `useStockInquiry.ts:74-79` の `commands.listLowStock(false)` → `filterLowStockList(rows, q, dept, status)`（`filter-low-stock-list.ts:19-47`）で、**pagination なし**（`totalCount: null, source: "low_stock"`）。バックエンド `list_low_stock_products`（`product_repo.rs:1194-1237`）は `ProductWithRelations`（`:103-109`）を返し、`supplier_name: Option<String>` は既存フィールド、`ORDER BY p.stock_quantity ASC, p.name ASC`（`:1225`）。`filter-low-stock-list.ts` は現状フィルタのみで**ソートしない**（SQL 順のまま透過）。全件クライアント保持済み・pagination なしのため、並び替えはクライアント側（`filterLowStockList` 拡張）が SQL `ORDER BY` 変更より小さい差分（Rust 変更・新規 Rust test 不要、既存 IO 層の他消費者への影響もゼロ）。本 packet はこちらを採用する
- **(d-1) 実装対象**: `filter-low-stock-list.ts` の公開関数を `filterLowStockList` → `filterAndSortLowStockList` にリネームし（フィルタだけでなくソートも行う実態に合わせる、呼び出し元 1 箇所 + test file 1 箇所のみが影響）、フィルタ後に `Array.prototype.sort` で (1) `supplier_name`（`null` は最後、非 null は `localeCompare`）(2) `stock_quantity` 昇順 (3) `name`（`localeCompare`）の順で安定ソートする。呼び出し元は `useStockInquiry.ts:78`
- **(d-1) UI 列**: `ProductListTable.tsx:56-64` の列は 商品コード / 商品名 / 部門 / 状態 / 在庫数 / 売価（6 列、`colSpan={6}` を `:98` で使用）。取引先列は 部門 の直後・状態 の前に挿入する（マスタ系列を隣接させる）。null 表示は `—`（`73-ui` の `counted_at`/差異列と同じ既存慣行に揃える）。列追加で `colSpan={6}` → `colSpan={7}` に更新が必要（`ProductListTable.tsx:98`、旧 `colSpan=5→6` 移行時と同型の regression リスク）
- **(d-1) 「すべて」view 非対象**: `search_products` 経由（`useStockInquiry.ts:55-72`）は変更しない。`ProductListTable` は `source: "search" | "low_stock"` で分岐しており、取引先列と新ソートは `source === "low_stock"` の表示のみに適用する（`ProductWithRelations.supplier_name` は search 側でも DTO 上は存在するが、search 結果は既存の `ORDER BY p.product_code`〈`sort_key: "ProductCode"`〉のまま変更しない）
- **(d-2) DTO**: `StocktakeItemDetail`（`stocktake_repo.rs:63-74`）に `is_discontinued` フィールドなし。構築箇所は 2 つ、いずれも既に `products p` を `JOIN` 済み（新規 JOIN 不要、SELECT 列と struct field の追加のみ）:
  - `find_stocktake_item_by_code`（`:342-372`、SELECT は `:348-349`、struct 構築は `:360-370`）— 商品コード/JAN 完全一致検索の対象解決に使う
  - `list_stocktake_items`（`:485-560`、SELECT は `:537-539`、struct 構築は `:548-558`）— 棚卸しカウント画面のページング一覧本体
  - `UncountedItem`（`:87-91`）は `#[derive(Debug, Clone)]` のみ（`serde::Serialize`/`specta::Type` なし）で frontend に公開されない内部専用構造体（`force_fill` 用、`mod.rs:72` で re-export されるが command からは呼ばれない）。§73.6 の「未入力のみ toggle」は `StocktakeItemDetail` を `counted_only=false` でフィルタする既存経路（`counted_only` param）を使うため、**badge 対象は `StocktakeItemDetail` のみで足りる**（`UncountedItem` への追従は不要）
- **(d-2) FE 描画先**: `StocktakePage.tsx:822-851` の統合テーブル（`items: StocktakeItemDetail[]`、`:712` で型付け）が counted/uncounted 両方を 1 テーブルで描画する（`actual_count ?? "未入力"`、`:841`）。badge は `:838` の商品名セル（`<TableCell>{item.name}</TableCell>`）に追加する。既存の候補行（`:604-649`、`candidate.is_discontinued` で `secondary` badge、枠なし）とは別の描画箇所
- **(d-2) badge 仕様の正本 = Gated Amendment 1（2026-09-03、owner Human Gate 所感、archived: [Lane 1a-refresh packet](../archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md):204-231,486,493,496）**: 「廃番 Badge の可読性是正」として owner が既に **枠線（`--border-strong` 相当、対 `--background` 実測 3.53:1）+ icon 付き**を裁定済み（`docs/design-system/04-backbone.md:20,44` に反映済み正本: 「②分類 = secondary pill + 枠線（隣接背景に対し 3:1、DSR-22）。icon は識別に必要な場合に限り可（廃番等、Gated Amendment 1）」）。**既存の secondary badge**（`ProductTable.tsx:56`/`StocktakePage.tsx:624`〈候補行〉/`ProductAddSuggest.tsx:129` 等）はこの是正が未適用のまま「Lane 3〜5 sweep 対象」で残置されている（`02-component-catalog.md:158` コメント、`rg -c "secondary" docs/plans/2026-09-05-ui-list-backbone-d-lane5.md docs/archive/plans/2026-09-05-ui-list-backbone-d-lane3.md docs/plans/2026-09-05-ui-list-backbone-d-lane4.md` = 0、いずれの Lane も secondary badge の枠 sweep を実施していないことを確認済み）。本 lane が**新規に追加する** badge はこの未是正パターンを複製せず、Gated Amendment 1 の正本仕様（`border-border-strong` + icon）で最初から実装する。globals.css 実装済み: `--border-strong: #8a8480`（`globals.css:XX`、Lane 2 で登録済み）、Tailwind utility `border-border-strong` は `@theme inline` の `--color-border-strong: var(--border-strong)`（`:27`）経由で利用可能。icon は mockup（`mockup-d-lists.html:117,132,140`）の "archive box" 相当として lucide-react `Archive`（`node_modules/lucide-react/dist/esm/icons/archive.js` 実在確認済み）を採用する。既存の候補行 badge（枠なし）を同じ file 内で合わせて是正するかは Non-scope（下記）参照
- **R2-3 現状**: `ProductListTable.tsx:72-77` の行 `onClick` は常に `onSelect(item.product_code)` を呼び、選択済み行の再クリックは同じ値を渡すだけで no-op（閉じない）。`useStockInquiry.ts:126-132` の自動展開 `useEffect` は `listItems?.length === 1 && args.selected === null` の全ての機会で発火するため、再クリックで `selected` を `null`（URL `selected: undefined`）へ戻しても、同じ検索条件で結果がまだ 1 件なら即座に再展開し「閉じる」操作を打ち消す
- **traceability baseline**: 現在 `FE_UNREFERENCED_BASELINE = 24`（`generate_traceability.rs:48`、Lane 5 L5-D6 起源）。本 lane は既存 test file（`filter-low-stock-list.test.ts` / `ProductListTable.test.tsx` / `useStockInquiry.test.tsx` / `StocktakePage.test.tsx`、すべて REQ-301/302/205 参照済み）の拡張のみを想定し、新規 test file を追加しない。Rust 側 `stocktake_repo.rs` の `mod tests`（既存 42 fn、`test_..._req205_...` 命名規約）への test fn 追加は traceability baseline（FE 専用）の対象外
- **既存 test 命名規約**: FE は `describe("filterLowStockList (REQ-302 sub-filter)", ...)`（`filter-low-stock-list.test.ts:41`、リネームに伴い `describe` 名も `filterAndSortLowStockList` へ更新）、`describe("useStockInquiry (REQ-301/302)", ...)`。Rust は `test_list_stocktake_items_req205_*` / `test_find_stocktake_item_by_code_req205_*`（`stocktake_repo.rs:882-940,1335-1430`）

## Scope

- **S1 filter-low-stock-list のリネーム + ソート追加**: `filter-low-stock-list.ts` の `filterLowStockList` を `filterAndSortLowStockList` へリネームし、フィルタ後に `supplier_name`（null 最後、非 null は昇順）→ `stock_quantity` 昇順 → `name` 昇順の安定ソートを追加する。呼び出し元 `useStockInquiry.ts:78` を更新。完了条件: `rg -c "filterAndSortLowStockList" src/features/stock-inquiry/hooks/useStockInquiry.ts` ≥ 1 かつ `rg -c "filterLowStockList" src/features/stock-inquiry` = 0（リネーム漏れなし）
- **S2 ProductListTable に取引先列を追加**: `ProductListTable.tsx` の列を 商品コード / 商品名 / 部門 / **取引先** / 状態 / 在庫数 / 売価（7 列）へ。取引先 null は `—`。展開行 `colSpan` を `6` → `7` へ更新。列は `source === "low_stock"` のときのみソート済み前提で表示（`source === "search"` でも同じ列を出すが並び順は search 側のまま）。完了条件: `rg -Fc 'colSpan={7}' src/features/stock-inquiry/components/ProductListTable.tsx` ≥ 1 かつ `rg -Fc 'colSpan={6}' src/features/stock-inquiry/components/ProductListTable.tsx` = 0
- **S3 展開行トグルクローズ + 自動展開の検索条件単位制限（R2-3）**: `ProductListTable.tsx` の行 `onClick` を、選択中行の再クリックで `onSelect(null)` を呼ぶよう変更（`onSelect` の型を `(productCode: string | null) => void` へ）。`StockInquiryPage.tsx` の `onSelect` wiring を `selected: code ?? undefined` へ。`useStockInquiry.ts` の自動展開 `useEffect`（`:126-132`）に、検索条件（`status`/`q`/`dept`/`page`）から導出した key を `useRef` で保持し、同じ key で一度自動展開したら再展開しない guard を追加する（UI-06a-D5、下記 Design Intent Trace）。完了条件: `ProductListTable.test.tsx` に再クリックで選択解除される test、`useStockInquiry.test.tsx` に「同一条件で手動クローズ後は再自動展開しない」+「条件変化後は再度自動展開する」の対 test
- **S4 `StocktakeItemDetail` に `is_discontinued` を追加**: `stocktake_repo.rs:64` の struct へ `pub is_discontinued: bool` を追加し、`find_stocktake_item_by_code`（`:348-349,360-370`）と `list_stocktake_items`（`:537-539,548-558`）の両 SQL に `p.is_discontinued` を追加、struct 構築に `is_discontinued: row.get(N)?` を追加する（新規 JOIN 不要、SELECT 列追加のみ）。完了条件: `rg -Fc 'pub is_discontinued: bool' src-tauri/src/db/stocktake_repo.rs` = 1、両関数の SELECT 文に `p.is_discontinued` が含まれる（`rg -c 'is_discontinued' src-tauri/src/db/stocktake_repo.rs` ≥ 4〈struct 定義 1 + SELECT 2 + 構築 2 = 5 が期待値、Writer 実装後に実数へ合わせて Matrix で確定〉）
- **S5 bindings 再生成**: `cd src-tauri && cargo run --bin generate_bindings` を実行し `src/lib/bindings.ts` を再生成する。完了条件: `git diff --stat -- src/lib/bindings.ts` が `StocktakeItemDetail` 型定義への `is_discontinued: boolean` 追加 1 行のみであることを確認（予期しない diff が出た場合は原因を特定してから進める）
- **S6 StocktakePage.tsx に廃番 badge を追加**: `StocktakePage.tsx:838` 商品名セルへ `{item.is_discontinued ? <Badge variant="secondary" className="border-border-strong"><Archive aria-hidden="true" />廃番</Badge> : null}` を追加（`Archive` を `lucide-react` から import）。Gated Amendment 1 準拠（枠 3:1 + icon）。完了条件: `rg -Fc 'border-border-strong' src/features/stocktake/StocktakePage.tsx` ≥ 1（新規箇所）、`rg -c 'Archive' src/features/stocktake/StocktakePage.tsx` ≥ 2（import 1 + JSX 1）
- **S7 docs 同期**: `58-ui-stock-inquiry.md` に UI-06a-D4（取引先列 + 並び順）/ UI-06a-D5（展開行トグルクローズ + 自動展開の検索条件単位制限）を §58.10 に追加し、§58.7 ProductListTable 節の列挙・colSpan 記述・§58.4 selected ライフサイクル節を更新する。`73-ui-stocktake.md` に UI-10-D13（棚卸しリストの廃番 badge）を §73.3 に追加し、§73.6 一覧・フィルタ表へ「廃番 badge」行を追加する。両 file の更新履歴に本 PR の 1 行を追加

## Non-scope

- R2-4 在庫照会への検索条件追加（owner 決定「不要」、⑦ (d) から削除済み）
- d-3 取引先消滅の専用データ列・UI（`suppliers` へ状態列を追加しない設計を維持、「該当商品を廃番に更新する運用」で代替）
- 既存 secondary badge（`ProductTable.tsx:56`/`StocktakePage.tsx` 候補行 `:624`/`ProductAddSuggest.tsx:129` 等）への `border-border-strong` + icon sweep。**注記**: 候補行の badge（`:624`）は本 lane が編集する同じ file 内にあり、新規追加する badge（S6）と隣り合って見た目が不揃いになる。是正は 1〜2 行の小さな diff だが、owner 決定（d-1/d-2/R2-3）の範囲外であり Lane 3〜5 backlog として既に記録済みのため、本 lane では触れない。同時是正が望ましいかは Plan Review / owner 判断に委ねる（open question、下記 Review Focus 参照）
- 「すべて」view（`search_products` 経由）の並び順・列構成・pagination 変更
- `UncountedItem`（`stocktake_repo.rs:87-91`）への `is_discontinued` 追加（frontend 非公開の内部専用構造体、消費者なし）

## Acceptance Criteria

- AC1: 取引先列が `ProductListTable.tsx` に存在し、`source === "low_stock"` の一覧で取引先名昇順（null 最後）→ 在庫数昇順 → 商品名昇順に並ぶ — `filter-low-stock-list.test.ts` に 3 取引先（うち 1 件 null）を含む非空期待の sort test
- AC2: `colSpan={7}`（旧 `colSpan={6}` は 0 件）— `rg -Fc 'colSpan={7}' src/features/stock-inquiry/components/ProductListTable.tsx` ≥ 1 かつ `rg -Fc 'colSpan={6}' src/features/stock-inquiry/components/ProductListTable.tsx` = 0
- AC3: 選択中行の再クリックで詳細展開が閉じる（`selected` が `undefined` になる）— `ProductListTable.test.tsx` に regression test
- AC4: 自動展開は同一検索条件内で 1 度のみ — `useStockInquiry.test.tsx` に「手動クローズ後、同条件では再展開しない」+「条件変化後は再展開する」の対 test
- AC5: `StocktakeItemDetail` に `is_discontinued: bool` が追加され、両 SQL 経路（`find_stocktake_item_by_code`/`list_stocktake_items`）で正しい値が返る — Rust `#[cfg(test)]` に `test_list_stocktake_items_req205_includes_is_discontinued` / `test_find_stocktake_item_by_code_req205_includes_is_discontinued` を追加
- AC6: `bindings.ts` の diff が `StocktakeItemDetail` への `is_discontinued: boolean` 追加のみ — `git diff --stat -- src/lib/bindings.ts` を目視確認
- AC7: 廃番商品の棚卸し行に「廃番」badge（`border-border-strong` + `Archive` icon）が表示され、非廃番行には表示されない — `StocktakePage.test.tsx` に非空期待の対 test
- AC8: `cargo run --bin generate_traceability -- --check` が ERROR 0 / WARN 0（FE baseline 24 のまま。新規 test file を追加しない想定のため不変見込み）
- AC-L3-1（owner Windows native L3）: 在庫少・在庫切れ一覧が取引先名順に並んで見える
- AC-L3-2（owner Windows native L3）: 棚卸しリストの廃番商品行に badge が視認できる
- AC-L3-3（owner Windows native L3）: 在庫照会の展開行を再クリックすると閉じる

## Design Sources

- Requirements / spec: REQ-301（`docs/spec/requirements.md:29`、商品別在庫数照会）/ REQ-302（`:30`、在庫切れ・在庫少一覧）/ REQ-205（`:24`、棚卸しによる在庫数補正）
- Architecture: `docs/ARCHITECTURE.md`（変更なし、UI 層 + IO 層〈既存 JOIN への列追加〉のみ）
- Function / command / DTO: `docs/function-design/20-io-product-repo.md` §2.11（`StocktakeItemDetail` 定義箇所、フィールド追加の記載要否は Writer が実装時に確認）
- DB: `docs/db-design/master-tables.md:165-185`（取引先テーブル、状態列を持たない設計を維持）。migration 変更なし
- Screen / UI: `docs/function-design/58-ui-stock-inquiry.md`（§58.4 selected ライフサイクル / §58.6 純関数 / §58.7 ProductListTable / §58.10 業務ルール、UI-06a-D4/D5 新設）、`docs/function-design/73-ui-stocktake.md`（§73.3 Design Decisions / §73.6 一覧・フィルタ、UI-10-D13 新設）、`docs/design-system/04-backbone.md` 原則 4（badge 3 種、②分類の枠 3:1 + icon 許容）
- Decision log / ADR: 新規 durable decision は design-system 側の Gated Amendment 1（既存、[archived packet](../archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md):204-231）を適用するのみで新規 entry は不要

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | `stocktake_repo.rs`（`find_stocktake_item_by_code`/`list_stocktake_items`） | updated in this PR（S4） |
| Command / DTO / generated binding / wire shape | `StocktakeItemDetail` + `bindings.ts` | updated in this PR（S4/S5） |
| DB / transaction / audit / rollback / migration | — | existing sufficient（既存 JOIN 利用、migration 不要） |
| Screen / UI / route state / Japanese wording | `58-ui-stock-inquiry.md` / `73-ui-stocktake.md` | updated in this PR（S7） |
| CSV / TSV / report / import / export format | — | 該当なし |
| Durable decision / ADR | Gated Amendment 1（badge 枠 3:1 + icon） | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし（既存 command `get_stocktake_items`/`find_stocktake_item` の DTO 拡張のみ、新規 command なし） |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 新規 REQ 追加なし。既存 REQ-301/302/205 の test file 拡張のみで新規 test file を追加しない想定のため traceability FE baseline（現 24）は不変見込み |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |
| generated binding | `cargo run --bin generate_bindings`（S5）で `bindings.ts` を再生成し、diff を `StocktakeItemDetail.is_discontinued` 追加のみに限定確認する |

L1 full の生成系検査は bindings / frontend routes / traceability の 3 種。本 lane は bindings（S5）と traceability（AC8）が対象。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-302 | `58-ui-stock-inquiry.md` §58.6/§58.7 | UI-06a-D4（2026-09-06） | 在庫少・在庫切れ一覧の並び順を取引先名優先へ変更する。SQL `ORDER BY` 変更（`product_repo.rs:1225`）ではなくクライアント側ソートを採用: (a) 一覧は既に pagination なしの全件クライアント保持（`useStockInquiry.ts:74-79`）で、フィルタ後の配列を並べ替えるだけで済む (b) SQL 変更は新規 Rust test・IO 層の契約変更・design doc（`20-io-product-repo.md`）改訂を伴い、変更面積が大きい (c) 「すべて」view（`search_products`）の並び順には影響させたくない、という要件をクライアント側の方が自然に満たす | `filter-low-stock-list.ts`（リネーム + ソート追加）/ `useStockInquiry.ts` | `filter-low-stock-list.test.ts` |
| REQ-302 | `58-ui-stock-inquiry.md` §58.7 | UI-06a-D5（2026-09-06） | 展開行の再クリックで閉じる操作を実装するには、既存の「結果 1 件で自動展開」（`useStockInquiry.ts:126-132`、`selected === null` ガードのみ）を「同一検索条件で 1 度だけ」に絞る必要がある。検索条件（`status`/`q`/`dept`/`page`）から導出した key を `useRef` に保持し、同じ key で既に自動展開済みなら再発火しないガードを追加する。代替案（`selected` の変化元〈ユーザー操作 vs 自動展開〉を別 state で追跡する）は state 数が増え、URL 一本化の既存方針（§58.4）に反するため不採用 | `useStockInquiry.ts` | `useStockInquiry.test.tsx` |
| REQ-205 | `73-ui-stocktake.md` §73.3/§73.6 | UI-10-D13（2026-09-06） | 棚卸しリストの行に廃番 badge を追加する。badge 仕様は新規に決めず、既存の owner 承認済み Gated Amendment 1（`--border-strong` 3:1 + icon）をそのまま適用する。理由: 同じ「廃番」badge を枠なしで新規追加すると、既に owner が「見づらい」と裁定した状態を複製することになり、Lane 3〜5 sweep の対象をさらに増やす。新規追加箇所は最初から正本仕様で作る方が手戻りがない | `stocktake_repo.rs` / `StocktakePage.tsx` | `stocktake_repo.rs` `#[cfg(test)]` / `StocktakePage.test.tsx` |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 packet の「起票時実測」節が値・理由の一次情報。実装後は S7 で 58-ui/73-ui に UI-06a-D4/D5・UI-10-D13 として反映し packet 依存を解消する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 新規 durable decision なし。badge 仕様は既存の Gated Amendment 1（design-system 側の正本）をそのまま適用する
- Assumptions and constraints: 対象範囲は (d-1) 在庫少・在庫切れ一覧の列 + 並び順、(d-2) 棚卸しリストの badge、R2-3 展開行トグルの 3 点に限定。d-3（取引先消滅）と R2-4（検索条件追加）は owner 決定により明示的に対象外
- Deferred design gaps, risk, and follow-up target: 既存 secondary badge 全体の枠 3:1 sweep（候補行含む）は Lane 3〜5 backlog のまま。Plans.md ⑦ (a)（Badge の色と枠の規約、design-first）が本来の受け皿
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-06-stock-supplier-column-and-stocktake-discontinued.md) 各行に UI-06a-D4/D5 または UI-10-D13 を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は d-3（データがない）と R2-4（owner 不要判定）のみで、いずれも起票時実測とヒアリング evidence で理由を確認済み。抜け道なし

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層 + IO 層内の列追加のみ | — |
| Fact check / design decision split | 適用: badge 仕様は新規設計せず既存 Gated Amendment 1 を適用することを起票時実測で確認。evidence file（`hearing-2026-09-05-...`）が本 packet 起票時点で未 merge branch にのみ存在する cross-branch 依存を確認 | 「起票時実測」節、Review Focus |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 在庫少一覧の並び順・棚卸しリストの badge・在庫照会の行クリック挙動が変わる。owner L3 で確認（AC-L3-1〜3） | AC-L3-1〜3 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし（既存カラムの読み取りのみ） | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜3） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: badge の視覚仕様は Gated Amendment 1（design-system 正本）で既に確定済み、`ProductWithRelations.supplier_name` は既存 DTO フィールド、`stocktake_repo.rs` の 2 SQL は既に `products` を JOIN 済みで新規 JOIN 設計が不要
- Source docs updated in this PR: `58-ui-stock-inquiry.md`（UI-06a-D4/D5）、`73-ui-stocktake.md`（UI-10-D13）
- Design gaps intentionally deferred: 既存 secondary badge 全体の枠 3:1 sweep（Lane 3〜5 backlog）
- Durable decisions discovered in this plan and promoted to source docs: なし（既存 Gated Amendment 1 の適用のみ）

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。IO 層（`stocktake_repo.rs`）の SELECT 列追加 + UI 層の列/badge/クリック挙動変更のみ、BIZ/CMD 層は無変更
- Backend function design: `stocktake_repo.rs` の 2 関数へフィールド追加（新規関数なし）
- Command / DTO / data contract: `StocktakeItemDetail` に `is_discontinued: bool` 追加（additive、既存フィールド不変）
- Persistence / transaction / audit impact: なし（読み取りのみ、書込み経路の変更なし）
- Operator workflow / Japanese UI wording: 「廃番」文言は既存語彙のまま流用、新規文言なし。並び順変更と行クリック挙動変更は operator に見える
- Error, empty, retry, and recovery behavior: 変更なし（既存の失敗 4 状態・空状態処理は無影響）
- Testability and traceability IDs: 新規 REQ 追加なし、既存 REQ-301/302/205 の test file 拡張のみ

## Contract Probe

N/A — 本 lane に検証を要する未検証の外部前提はない。理由: (1) `stocktake_repo.rs` の 2 SQL は既に `products p` を JOIN 済みで新規 JOIN 設計の不確実性がない (2) クライアント側ソート・badge の class 合成は `Array.prototype.sort` / 既存 `cn`(`tailwind-merge`) パターンの再利用で、この codebase に前例のない機構を導入しない (3) `Archive` アイコンの実在は `node_modules/lucide-react/dist/esm/icons/archive.js` で確認済み。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| UI-06a-D4 取引先列 + 並び順（client sort） | `filter-low-stock-list.ts`（リネーム）/ `ProductListTable.tsx` | `filter-low-stock-list.test.ts` 拡張 / `ProductListTable.test.tsx`（列ヘッダ・null 表示） | AC-L3-1 |
| UI-06a-D5 展開行トグルクローズ + 自動展開の検索条件単位制限（R2-3） | `ProductListTable.tsx` / `StockInquiryPage.tsx` / `useStockInquiry.ts` | `ProductListTable.test.tsx` / `useStockInquiry.test.tsx` | AC-L3-3 |
| UI-10-D13 棚卸しリストの廃番 badge（Gated Amendment 1 準拠） | `stocktake_repo.rs` / `StocktakePage.tsx` | `stocktake_repo.rs` `#[cfg(test)]` 拡張 / `StocktakePage.test.tsx` | AC-L3-2 |
| `StocktakeItemDetail.is_discontinued` DTO 追加 + bindings 再生成 | `stocktake_repo.rs` / `bindings.ts`（生成物） | 上記 Rust test + `git diff` 目視 | non-scope（生成物 diff 確認のみ） |
| `colSpan` 6→7 regression | `ProductListTable.tsx` | `ProductListTable.test.tsx` | non-scope（DOM 構造検査） |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-06-stock-supplier-column-and-stocktake-discontinued.md](test-matrices/2026-09-06-stock-supplier-column-and-stocktake-discontinued.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate.

- targeted tests: `filter-low-stock-list.test.ts`（ソート追加）/ `ProductListTable.test.tsx`（取引先列・colSpan・トグルクローズ）/ `useStockInquiry.test.tsx`（自動展開の検索条件単位制限）/ `stocktake_repo.rs` `#[cfg(test)]`（`is_discontinued` 両経路）/ `StocktakePage.test.tsx`（badge 表示）
- negative tests: 取引先 null の商品が最後に来ること、非廃番商品に badge が出ないこと、条件変化がない限り自動展開が再発火しないこと
- compatibility checks: 「すべて」view の並び順・列構成が無変更であること、既存の候補行 badge（枠なし）が変更されないこと
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: `bindings.ts` の diff が `is_discontinued` 追加のみであること（S5 完了条件）

## Boundary / Wire Contract

- producer: `src-tauri/src/db/stocktake_repo.rs`（`find_stocktake_item_by_code`/`list_stocktake_items`、Rust）
- consumer: `src/features/stocktake/StocktakePage.tsx`（TypeScript、`commands.getStocktakeItems`/`commands.findStocktakeItem` 経由）
- wire type: `boolean`（specta 生成、`bindings.ts`）
- internal type: Rust `bool` ↔ TS `boolean`
- precision/range: 該当なし（boolean、NOT NULL カラム由来）
- round-trip path: `products.is_discontinued`（DB, NOT NULL boolean）→ SQL SELECT（`stocktake_repo.rs` 2 箇所）→ `StocktakeItemDetail` struct → serde/specta → `bindings.ts` → `StocktakePage.tsx` 描画
- invalid input: 該当なし（既存カラムの読み取りのみ、書込み経路なし）
- compatibility: additive field。既存の `StocktakeItemForComplete`（3 フィールド専用 struct、`:79-84`）は別構造体で無影響。`UncountedItem` も別構造体で無影響

## Review Focus

- 在庫少・在庫切れ一覧の並び順が取引先名優先（null 最後）→ 在庫数 → 商品名の 3 段になっていること。「すべて」view の並び順が変わっていないこと
- `colSpan` 更新漏れ（6 のまま残っていないか）
- 展開行トグルクローズと自動展開の相互作用: 手動クローズ後に同条件で再展開しないこと、条件変化後は再展開すること（両方の対 test があること）
- `StocktakeItemDetail` への `is_discontinued` 追加が両 SQL 経路（`find_stocktake_item_by_code`/`list_stocktake_items`）に反映されていること、`UncountedItem` には不要な追従をしていないこと
- badge の class が `border-border-strong` + `Archive` icon（Gated Amendment 1 準拠）であること
- **open question（Non-scope 節参照）**: 同一 file 内の候補行 badge（`StocktakePage.tsx:624`、枠なし）を本 lane で合わせて是正するか。Plan Review で判断する
- Non-scope に列挙した項目（R2-4、d-3、既存 badge 全体 sweep、「すべて」view）が変更されていないこと

## Spec Contract

Contract ID: SPEC-STKSUP-D1

- 在庫少・在庫切れ一覧に取引先列が追加され取引先名優先で並ぶこと、棚卸しリストの廃番行に Gated Amendment 1 準拠の badge が表示されること、在庫照会の展開行が再クリックで閉じ自動展開が検索条件単位に制限されること

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-STKSUP-D1 | S1, S2 | `filter-low-stock-list.test.ts` / `ProductListTable.test.tsx` | 取引先列・並び順・colSpan | vitest |
| SPEC-STKSUP-D1 | S3 | `ProductListTable.test.tsx` / `useStockInquiry.test.tsx` | トグルクローズ・自動展開制限 | vitest |
| SPEC-STKSUP-D1 | S4, S5 | `stocktake_repo.rs` `#[cfg(test)]` | DTO 追加・bindings diff | cargo test + `git diff` |
| SPEC-STKSUP-D1 | S6 | `StocktakePage.test.tsx` | badge 表示 | vitest |
| SPEC-STKSUP-D1 | S7 | docs review（`rg`） | UI-06a-D4/D5・UI-10-D13 反映 | `rg` 完全一致 |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし（test fixture は既存 `makeMockProductWithRelations` 等の合成データのみ）

## Writer Instructions

- PR body の Reviewed Content HEAD は pending で置く（Final Reviewer が audit した content commit の SHA を後から state-only commit で埋める。Writer 自身は書き換えない）
- `git add` は明示パスのみ（`git add -A`/`git add .` 禁止）。commit 前に `git status` / `git diff --cached --name-only` で意図した file のみが staged であることを確認する
- 実装原則（ponytail、full。subagent には発注書経由で注入する運用）:

```
## 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- 具体的な適用: 取引先/部門/状態のような単一目的の列挙 select 用に共有抽象化を新設しない（本 lane に該当箇所なし、念のため明記）。`filterAndSortLowStockList` は 1 関数のままでよい（filter と sort を別関数に分割する理由がない。呼び出し元は 1 箇所のみで rule of three 未達）。既存 secondary badge を共通コンポーネント化しない（S6 は 1 箇所のみの追加で、共有化は 4 箇所目以降で再検討する既存方針〈select-unify packet の先例〉を踏襲）

## Implementation Results

未着手（Phase: plan-draft）。

## Review Response

未着手（Phase: plan-draft、Plan Review 前）。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
