# Plan Packet: UI 一覧の背骨 D — Lane 3（ページ送りの横展開: perPage Select 全画面 + 件数文言の自然文化 + 上部帯の太字撤去 + 履歴系 backend 上限 100→200）

Lane 2（PR #32、squash `7e0ccf1`、2026-09-04）で共有部品化した `Pagination` / `PaginationSummary` / `ListShell`（pilot: 商品一覧のみ）を土台に、ページ送り関連の残 3 項目を全一覧画面へ横展開する。`ListShell` 化そのもの（識別列固定・現在行 3 点を含む Lane 4、`--border-strong` sweep を含む Lane 5）は本 lane の対象外。owner 選定（2026-09-05、[Plans.md ④](../Plans.md) E9/E10/E11 直回答）に基づき、scope を「件数文言の自然文化」「perPage 共有定数 1 本 + 各画面 Select」「履歴系 backend 上限 200」の 3 点に限定する。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

If a state-only commit materializes multiple phases, list the complete adjacent forward sequence and the pre-existing evidence for every intermediate transition in an append-only review/evidence record. Recording compression never permits a gate skip.

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Codex（発注書 relay）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）
- Final Reviewer: Sonnet subagent（Fable が P1/P2/P3 裁定）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（8 画面の perPage Select 動作 + 入出庫履歴・在庫変動履歴の 200 選択 + 件数文言の新形 + 上部帯の非太字、AC-L3-1〜4）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-05、E9/E10/E11 直回答、消費済み）。2 回目 = Windows native L3（AC-L3-1〜4）。3 回目 = 承認 + merge（Coordinator 代行）。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
route/search state の変更（入出庫履歴・在庫変動履歴・在庫照会・操作ログ・一括価格改定・整合性チェックの 6 画面へ perPage 状態を新設）+ operator workflow の見た目変更（8 画面共通の件数文言差し替え、上部帯 `font-semibold` 撤去）+ backend バリデーション契約変更（`inventory_service::list.rs:21` `MAX_PER_PAGE` 100→200、対応 BIZ 関数 4 本の受理上限が動く）。DB スキーマ変更・POS CSV・PLU TSV 形式の変更はない。DEV_WORKFLOW Risk Tiers の R3「route/search state, operator workflow, backend validation contract」に該当し、Plan Packet + Test Design Matrix + targeted gates + Windows native L3 を必須とする。

## Goal

Goal Invariant:

### 最小完了条件

- 8 一覧画面（商品一覧 / 棚卸し / 在庫照会 / 入出庫履歴 / 在庫変動履歴 / 操作ログ / 一括価格改定 / 整合性チェック）すべてに perPage `Select`（選択肢 50 / 100 / 200、共有定数 1 本）が表示され、選択に応じて一覧の表示件数が変わる
- 件数文言が新形「全 {n} 件のうち {from}〜{to} 件を表示（{p} / {t} ページ）」で全 8 画面（上部帯 + 下部 pager）に統一される
- 上部帯 `PaginationSummary` から `font-semibold` が外れる
- 入出庫履歴・在庫変動履歴で perPage 200 を選んでも `ValidationFailed` にならない（`MAX_PER_PAGE` 100→200）

### 失敗定義

- 8 画面のいずれかで Select が出ない、選択肢が共有定数と一致しない、または既定 perPage が owner 裁定値と異なる
- 旧文言「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」が src / test / catalog ⑩ / DSR-22 のいずれかに残る
- 入出庫履歴・在庫変動履歴で 200 選択時に `ValidationFailed` が発生する、または `MAX_PER_PAGE` 引き上げにより既存の上限超過 test（101 系）が無意味化したまま放置される

### 非目的

- 残り 7 画面の `ListShell` 化（toolbar 2 段・sticky 帯・skeleton 統一）
- 識別列固定 + 表の出っ張り解消（Lane 4、owner 裁定 E12）
- native `<select>`/`<input>` の `--control-surface` token 化 + `--border-strong` sweep（Lane 5、owner 裁定 D8/E13）
- 棚卸し A'+器・完了画面の帯 contrast 是正（棚卸し lane、owner 裁定 G20）
- ページ送りの表上下両配置（catalog ⑩ で open のまま、本 lane では判断しない）
- perPage 選択肢の 40 刻み化（catalog ⑩ で不採用裁定済み、蒸し返さない）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、HEAD `6fc4aba`（main、PR #33 merge 後）、すべて本 packet 起草者が rg で再確認）

- **8 画面の現 per_page 値・定数名・file:line・Select 有無**（Explore 前提と突合し全件一致、line 番号のみ現行 HEAD で更新）:
  - 商品一覧: `src/features/products/search.ts:36` `PRODUCT_PER_PAGE_OPTIONS = [50, 100, 200]`、既定 100（`normalizePerPage` fallback 50、URL 明示があれば優先）。Select 実装済み（`ProductListPage.tsx:189-206`、id `product-per-page`、label 「表示件数」）
  - 棚卸し: `StocktakePage.tsx:124` `useState(50)`、`:69` で `PRODUCT_PER_PAGE_OPTIONS` を import。Select 実装済み（`:755-775`、id `stocktake-per-page`、label 「表示件数」、perPage 変更で `page: 1` に reset）
  - 在庫照会: `src/features/stock-inquiry/hooks/useStockInquiry.ts:63` `per_page: 50`（`commands.searchProducts` 呼出し、backend は `product_repo.rs:774` `per_page.min(PAGINATION_MAX_PER_PAGE=200)` で 200 まで clamp 済み）。`StockInquiryPage.tsx:200` は `perPage={50}` 固定値を `PaginationSummary`/`Pagination` へ渡すのみ。Select 未実装
  - 入出庫履歴: `src/features/inventory-records/InventoryRecordsPage.tsx:44` `const PER_PAGE = 20`、`:100` `per_page: PER_PAGE`（`list_inventory_records` 呼出し、backend は `inventory_service/list.rs:21` `MAX_PER_PAGE=100` で 101 以上が `ValidationFailed`）。Select 未実装
  - 在庫変動履歴: `src/features/stock-movements/types.ts:52` `MOVEMENTS_PER_PAGE = 20`、`hooks/useStockMovements.ts:49` `per_page: MOVEMENTS_PER_PAGE`（`list_movements` 呼出し、同じ `MAX_PER_PAGE=100`）。Select 未実装
  - 操作ログ: `src/features/operation-logs/OperationLogsPage.tsx:33` `const PER_PAGE = 20`、`:272` `per_page: PER_PAGE`（`commands.listLogs` → `system_service::list_operation_logs` → `system_repo.rs:124` `per_page.min(PAGINATION_MAX_PER_PAGE=200)` で 200 まで clamp 済み、`MAX_PER_PAGE` とは別系統）。Select 未実装
  - 一括価格改定: `src/features/products/priceRevisionSearch.ts:27-30` で `PRODUCT_PER_PAGE_OPTIONS` を再利用した `PriceRevisionPerPage` 型を既に定義（Select 実装は未配線 — `PriceRevisionPage.tsx` に `<Select>` JSX なし、`PriceRevisionFilters.tsx:102` は `PRODUCT_PER_PAGE_OPTIONS.map` を含むが要素種別は独立確認要）。URL search（`src/routes/products/price-revision.tsx:10` `validateSearch: priceRevisionSearchSchema`）を持つ。backend は `product_repo.rs:774` 経由で 200 まで clamp 済み
  - 整合性チェック: `src/features/integrity-check/IntegrityCheckPage.tsx:45` `const PER_PAGE = 100`、`:97` `mismatches.slice((page-1)*PER_PAGE, page*PER_PAGE)` — **client-side slice**。`:82` の `per_page: 1` は無関係な別クエリ（`commands.listLogs` で直近の整合性チェック実行有無を確認するだけの呼出しで、一覧の pagination とは無関係）。整合性チェックの一覧は `run_integrity_check` の結果を全件メモリに保持して分割表示するため、backend `MAX_PER_PAGE` の影響を受けない。Select 未実装
  - 上記のうち **backend `MAX_PER_PAGE`（`list.rs:21`）の影響を受けるのは入出庫履歴・在庫変動履歴の 2 画面のみ**。在庫照会・操作ログ・一括価格改定・棚卸し・商品一覧は `PAGINATION_MAX_PER_PAGE=200`（`constants.rs:6`）系の silent clamp を経由し、選択肢上限 200 が既に通る。整合性チェックはどちらの系統にも属さない
- **旧文言 `件中` / `件目` の hit 数**（`rg -c` 実測、HEAD `6fc4aba`）:
  - src 側の真の pagination pin: `src/components/patterns/Pagination.tsx:43`（`rangeText` 実装、`Pagination` 下部・`PaginationSummary` 上部の両方がこの 1 関数を共有）
  - test 側 6 file 12 箇所: `Pagination.test.tsx:36,41,46,63`（SC3a/SC3c、上限・端数・0件境界の 3 ケース + summary 1 ケース）/ `ListShell.test.tsx:106` / `OperationLogsPage.test.tsx:257,269,396,408`（4 箇所同一文言）/ `IntegrityCheckPage.test.tsx:410` / `StockInquiryPage.test.tsx:491` / `ProductListPage.test.tsx:630`
  - docs 側で pin している箇所（S11 対象、archived plans と reference 分析 doc は D-050 非遡及のため対象外）:
    - `docs/design-system/02-component-catalog.md` ⑩ ページネーション: 構造例 2 箇所（`:613`,`:619`）+ 文言節 1 箇所（`:643`）
    - `docs/design-system/01-decision-rules.md` DSR-22（`:427` 見出し）: ルール文中 2 箇所（`:429`）。同ファイル `:460` は 2026-09-03 時点の変更履歴（当時の canonical を記述した過去表記）で、D-050 の非遡及対象として編集しない
    - `docs/function-design/74-ui-operation-logs.md:263`: 「範囲付き統一形」の pin 1 箇所
    - mockup 4 file: `mockup-d-lists.html`（3 箇所）/ `mockup-d-history.html`（3 箇所）/ `mockup-d-forms-b.html`（1 箇所）/ `mockup-c-products.html`（1 箇所）
    - **偽陽性として除外**（同じ「件中」「件目」文字列だが pagination と無関係、S11 で触らない）: `docs/function-design/36-biz-integrity-check.md:92`（operation_log summary 文言「{checked_count}件中{mismatch_count}件の不整合」）/ `docs/function-design/53-ui-home.md:88`（レビュー指摘の個数を指す「11 件中」）/ `docs/function-design/73-ui-stocktake.md:114`（「1 件目はスキャンできても」の運用描写）/ `docs/function-design/75-ui-integrity-check.md:195`（fixture 設計の「100件目、101件目」）
  - **食い違い**: 発注時の想定「DSR-22 / 04-backbone / review-checklist / mockup 注記の旧文言」のうち `docs/design-system/04-backbone.md` と `docs/quality/review-checklist.md` は `rg -c "件中|件目"` = 0（実測、両 file とも hit なし）。この 2 file は S11 の対象から除外する
- **Pagination.test.tsx / ListShell.test.tsx / 各 Page test の文言 oracle の位置**: 上記「旧文言 hit 数」節に列挙した test 側 6 file 12 箇所と同一
- **`.text-base.font-semibold` selector の破損リスク**（実装実読で判明、発注時未記載）: `ListShell.test.tsx:96,116` と `ProductListPage.test.tsx:628,654` が `container.querySelector(".text-base.font-semibold")` で上部 `PaginationSummary` を一意特定している。`font-semibold` を外すと 4 箇所とも selector が何も一致しなくなる。下部 `Pagination` は `text-sm text-muted-foreground`（`font-semibold` を含んだことがない）なので `.text-base` 単独でも上部と衝突しないことを確認済み（S2 の完了条件に採用）
- **`MAX_PER_PAGE` の Rust test の位置と現 boundary test の値**: `src-tauri/src/biz/inventory_service/list.rs:321` `test_list_receivings_req201_per_page_exceeds_max`（`:326` `per_page: 101`）/ `list.rs:503` `test_list_inventory_records_req206_rejects_invalid_page_params`（`:515` `per_page: 101`）/ `src-tauri/src/cmd/inventory_cmd.rs:111` `test_list_movements_req303_per_page_exceeds_max`（`:120` `per_page: 101`）。3 test とも `MAX_PER_PAGE` を 200 へ上げると `per_page: 101` が上限内に収まり `unwrap_err()` が `Ok` を返して panic する（テストの意図が無意味化）。境界値を `201` へ更新しないと即 fail する
- **`MAX_PER_PAGE` を共有する関数**（発注時「2 系統ある事実」より詳細）: `list.rs:21` の `MAX_PER_PAGE` は `validate_page_params`（`list_receivings` / `list_returns` / `list_disposals` / `list_inventory_records` が共有）と `list_movements` 内の直接比較（`:204`）の**両方**から参照される。100→200 の変更は本 lane スコープ外の `list_receivings`/`list_returns`/`list_disposals`（入庫・返品・廃棄の「直近」ミニ一覧、`per_page: 10` 固定で UI から可変にならない）にも同時適用されるが、これらの画面は per_page を UI から変更できないため機能影響はない。設計 doc は「共通型」として書かれているため 3 箇所とも 200 へ揃える（下記 Design Sources）
- **`MAX_PER_PAGE` を設計 doc に明記する 3 箇所**（`rg -n "per_page|上限" docs/function-design/`実測、docs 番号は rg で実在確認済み）:
  - `docs/function-design/21-io-inventory-repo.md:7` §10.1「per_page: u32（デフォルト50、上限100。100超はBIZ層でバリデーションエラー）」— `ListQuery` 共通型（入庫/返品/廃棄/入出庫履歴ハブが共有）
  - `docs/function-design/44-cmd-inventory.md:1056` §23.10「ページパラメータのバリデーション（page >= 1, 1 <= per_page <= 100）」— BIZ 層 list ラッパー全般（`list_movements` を含む）
  - `docs/function-design/65-inventory-record-traceability.md:86` §65.4.2「一覧は `page` 1 始まり、`per_page` 上限 100。」— `list_inventory_records` 専用
- **REQ 番号**（Design Intent Trace 用、既存 test から実在確認）: 入出庫履歴 = REQ-206（`InventoryRecordsPage.test.tsx:108`）/ 在庫変動履歴 = REQ-303（`StockMovementsPage.test.tsx:82`）/ 在庫照会 = REQ-301（`StockInquiryPage.test.tsx:3`）/ 操作ログ = REQ-902・UI-11c（`OperationLogsPage.test.tsx:77`）/ 一括価格改定 = REQ-105・UI-14（`PriceRevisionPage.test.tsx:142`）/ 整合性チェック = REQ-904・UI-13（`IntegrityCheckPage.test.tsx:104`）/ 商品一覧 = UI-01a / 棚卸し = REQ-205・UI-10。既存 REQ トークンの再利用のみで新規 REQ は追加しないため `generate_traceability` 再生成は不要（S11 で再確認する）

## Scope

- **S1 共有定数の移設**: `src/components/patterns/list-per-page.ts`（新設）に `LIST_PER_PAGE_OPTIONS = [50, 100, 200] as const` を定義（L3-D2）。`src/features/products/search.ts:36` の `PRODUCT_PER_PAGE_OPTIONS` 定義を削除し、`search.ts` / `priceRevisionSearch.ts` / `PriceRevisionFilters.tsx` / `ProductListPage.tsx` / `StocktakePage.tsx` / `search.test.ts` の import を新 module へ切り替える。型 `ProductPerPage`（`search.ts:42`）/ `PriceRevisionPerPage`（`priceRevisionSearch.ts:6`）は `(typeof LIST_PER_PAGE_OPTIONS)[number]` を参照するローカル型エイリアスとして残し、型名自体は変更しない（L3-D2、既存 zod schema の型注釈を壊さない）。完了条件: `rg -n "PRODUCT_PER_PAGE_OPTIONS" src` が 0 件、`rg -n "LIST_PER_PAGE_OPTIONS" src` が 8 箇所以上（旧箇所数と同数以上）
- **S2 `PaginationSummary` の weight 変更**: `Pagination.tsx:99` の className から `font-semibold` を削除（`text-base text-foreground tabular-nums` を維持）。`ListShell.test.tsx:96,116` と `ProductListPage.test.tsx:628,654` の selector を `.text-base.font-semibold` → `.text-base` へ更新し、`ListShell.test.tsx:105` の `expect(summaryTokens).toContain("font-semibold")` を削除する（`toContain("text-base")` は残す）。完了条件: `rg -n "font-semibold" src/components/patterns/Pagination.tsx` が 0 件、`rg -n "text-base.font-semibold" src --glob '*.test.tsx'` が 0 件
- **S3 `rangeText` 文言差し替え**: `Pagination.tsx:33-44` の `rangeText` を新形「全 {n} 件のうち {from}〜{to} 件を表示（{p} / {t} ページ）」へ（`totalCount === 0` は「0 件」のまま）。`Pagination.test.tsx:36,41,46,63` の期待文言を独立転記で更新（production 定数からの導出禁止）。完了条件: `rg -Fn "件中" src/components/patterns/Pagination.tsx` が 0 件、`rg -Fn "全 {" src/components/patterns/Pagination.tsx` は該当なし（テンプレートリテラルなので実際の記法は `` `全 ${...} 件のうち` `` 系、リテラル完全一致は実装後に再確認）
- **S4 在庫照会 Select**: `StockInquiryPage.tsx` にローカル state `perPage`（既定 50、`useState`）を追加し `useStockInquiry.ts:63` の `per_page: 50` 固定値を差し替える。Select は商品一覧と同じ `Select`/`SelectTrigger`/`SelectContent`/`SelectItem` 構成、label 文言「表示件数」、id `stock-inquiry-per-page`。perPage 変更時は表示中の page を 1 に戻す（ローカル state、URL 非対応 — L3-D3）。完了条件: `StockInquiryPage.test.tsx` に Select 変更で `searchProducts` mock の `per_page` が変わることを assert する新規 test
- **S5 入出庫履歴 Select**: `InventoryRecordsPage.tsx:44` の `const PER_PAGE = 20` をローカル state（既定 50、owner 裁定）に置き換え、`:100` の `per_page: PER_PAGE` を state 参照に変更。Select 追加（id `inventory-records-per-page`）。perPage 変更で page を 1 に戻す（ローカル state）。完了条件: 200 選択時に `list_inventory_records` 呼出しの `per_page: 200` が `ValidationFailed` にならないこと（S10 の backend 変更と対）を統合 test で確認
- **S6 在庫変動履歴 Select**: `stock-movements/types.ts:52` の `MOVEMENTS_PER_PAGE = 20` 定数参照を `StockMovementsPage.tsx` 側のローカル state（既定 50）に置き換え、`useStockMovements.ts:49` を state 経由に変更。Select 追加（id `stock-movements-per-page`）。完了条件: S5 と同様、200 選択時に `ValidationFailed` が出ないことを確認
- **S7 操作ログ Select**: `OperationLogsPage.tsx:33` の `const PER_PAGE = 20` をローカル state（既定 50）に置き換え、`:272` を state 参照に変更。Select 追加（id `operation-logs-per-page`）。backend は `system_repo.rs` 経由で 200 まで clamp 済みのため backend 変更は不要
- **S8 一括価格改定 Select**: `PriceRevisionPage.tsx` に `Select` JSX を追加（`priceRevisionSearch.ts` の URL search state `perPage` は既存、UI 未配線分のみ実装）。既定値は owner 決定（2026-09-05）どおり 50。現状の fallback（`priceRevisionSearch.ts:90` の `: 50`）と一致するため値の変更はなく、Select の配線のみ。backend は 200 まで clamp 済みのため backend 変更不要
- **S9 整合性チェック Select**: `IntegrityCheckPage.tsx:45` の `const PER_PAGE = 100`（既定 100、現状維持）をローカル state に置き換え、Select 追加（id `integrity-check-per-page`）。**client-side slice** のため、他画面と異なり「request per_page」ではなく「`visibleMismatches` の件数上限」がテスト対象になる（L3-D6）。完了条件: Select で 50 を選ぶと 1 ページの表示行数が 50 以下になることを assert する新規 test（mock request の `per_page` assert は該当なし）
- **S10 backend `MAX_PER_PAGE` 200**: `src-tauri/src/biz/inventory_service/list.rs:21` の `MAX_PER_PAGE: u32 = 100` を `200` へ変更。既存 3 test の境界値を `101` → `201` へ更新（`list.rs:326`,`list.rs:515`,`src-tauri/src/cmd/inventory_cmd.rs:120`）。新規に `per_page: 200` が `Ok` を返すことを確認する boundary test を `list_inventory_records` と `list_movements` それぞれに追加する。設計 doc 3 箇所（`21-io-inventory-repo.md:7` / `44-cmd-inventory.md:1056` / `65-inventory-record-traceability.md:86`）の「上限100」を「上限200」へ更新。`constants.rs:6` の `PAGINATION_MAX_PER_PAGE = 200` は変更しない（既に 200、2 系統併存の事実を doc へ注記するかは Coordinator 裁定）
- **S11 docs 同期**: 起票時実測の「旧文言 hit 数」節に列挙した非除外・非 archived の doc をすべて新文言へ更新: `02-component-catalog.md`（構造例 2 箇所 `:613,619` + 文言節 `:643` + 既定値表・class 記述の整合確認）/ `01-decision-rules.md` DSR-22（`:429` 2 箇所）/ `74-ui-operation-logs.md:263`/ mockup 4 file（`mockup-d-lists.html` 3 / `mockup-d-history.html` 3 / `mockup-d-forms-b.html` 1 / `mockup-c-products.html` 1）。`04-backbone.md` と `review-checklist.md` は実測 0 hit のため対象外（起票時実測で記録済み）。REQ token を新規追加しないため `generate_traceability` 再生成は不要（実装後に `rg -n "REQ-" src --glob '*.test.tsx'` の差分で再確認）
- **S12 Plans.md ④ + Contract Coverage Ledger 記入**: 本 packet の active link を反映（本 commit で同時実施）。Contract Coverage Ledger は下記節を参照

## Non-scope

- 残り 7 画面の `ListShell` 化（toolbar 2 段・sticky 帯・skeleton 統一。owner 裁定、Lane 3〜5 振り分けの前提）
- 識別列固定 + 表の出っ張り解消（Lane 4、owner 裁定 E12「1 item として扱う」だが本 lane には含めない）
- native `<select>`/`<input>` の `--control-surface` #fafaf9 token 化 sweep + outline button/Badge/SegmentedControl の `--border-strong` sweep（Lane 5、owner 裁定 D8/E13）
- 棚卸し A'+器（帯の枠あり）の実装、完了画面の帯 contrast 是正（棚卸し lane、owner 裁定 G20）
- ページ送りの表上下両配置（catalog ⑩ で open のまま判断しない）
- perPage 選択肢の 40 刻み化（catalog ⑩ で不採用裁定済み）
- `list_receivings` / `list_returns` / `list_disposals` の per_page 選択肢拡張（UI から可変にならないため、backend 上限変更の副次的影響を受けるのみで新規 test は追加しない）

## Acceptance Criteria

- AC1: `LIST_PER_PAGE_OPTIONS` が `src/components/patterns/list-per-page.ts` に定義され `[50, 100, 200]` と一致する — vitest（新規 test、production 定数の import ではなく独立転記比較）
- AC2: `PRODUCT_PER_PAGE_OPTIONS` の残存が 0 件 — `rg -n "PRODUCT_PER_PAGE_OPTIONS" src` = 0
- AC3: `Pagination.tsx` の `PaginationSummary` から `font-semibold` が外れている — `rg -n "font-semibold" src/components/patterns/Pagination.tsx` = 0
- AC4: 旧文言「件中」「件目」が pagination 実装・test・対象 docs から 0 件（偽陽性 4 箇所を除く）— `rg -Fn "件中" src/components/patterns` = 0 かつ `rg -Fn "件中" src --glob '*.test.tsx'` = 0（IntegrityCheckPage/StockInquiryPage/OperationLogsPage/ProductListPage/ListShell/Pagination の各 test）
- AC5: 新文言「全 {n} 件のうち」が `Pagination.tsx` に存在する — `rg -Fn "件のうち" src/components/patterns/Pagination.tsx` ≥ 1
- AC6: `list_inventory_records`（`InventoryRecordsPage`）と `list_movements`（`StockMovementsPage`）で `per_page: 200` が `Ok` を返す — `cargo test test_list_inventory_records` / `cargo test test_list_movements` 新規 boundary test 名で確認
- AC7: `MAX_PER_PAGE` 超過境界が `201` に更新されている — `cargo test test_list_receivings_req201_per_page_exceeds_max` / `test_list_inventory_records_req206_rejects_invalid_page_params` / `test_list_movements_req303_per_page_exceeds_max` が pass
- AC8: 6 画面（在庫照会/入出庫履歴/在庫変動履歴/操作ログ/一括価格改定/整合性チェック）それぞれに `Select` が新規追加される — 各 Page.test.tsx に Select 変更 test が存在（vitest test name で確認）
- AC9: 入出庫履歴・在庫変動履歴で perPage 200 選択時に `ValidationFailed` が発生しない — 対応 Page.test.tsx の統合 test（mock backend 経由）
- AC10: 設計 doc 3 箇所（`21-io-inventory-repo.md` §10.1 / `44-cmd-inventory.md` §23.10 / `65-inventory-record-traceability.md` §65.4.2）が「上限200」と記述する — `rg -Fn "上限200" docs/function-design/21-io-inventory-repo.md docs/function-design/44-cmd-inventory.md docs/function-design/65-inventory-record-traceability.md` 各 1 件以上
- AC11: catalog ⑩・DSR-22 の文言 pin が新形に統一される — `rg -Fn "件のうち" docs/design-system/02-component-catalog.md docs/design-system/01-decision-rules.md` 各 1 件以上、`rg -Fn "件中" docs/design-system/02-component-catalog.md docs/design-system/01-decision-rules.md` が偽陽性を除き 0
- AC12: `generate_traceability` 再生成が不要であることの確認 — 実装後 `git diff --stat src/**/*.test.tsx` の REQ token 追加差分が 0（新規 REQ を追加していない）
- AC-L3-1（owner Windows native L3）: 8 画面で `Select`（`LIST_PER_PAGE_OPTIONS`）が出て 50/100/200 が選べる
- AC-L3-2（owner Windows native L3）: 入出庫履歴・在庫変動履歴で 200 を選んで `ValidationFailed` にならない
- AC-L3-3（owner Windows native L3）: `Pagination.tsx` の件数文言が新形で表示される
- AC-L3-4（owner Windows native L3）: 上部の `PaginationSummary` 帯が太字（`font-semibold`）でない

## Design Sources

List the source design docs this plan relies on. Plan Packets are not durable design source of truth.

- Requirements / spec: `docs/spec/requirements.md`（REQ-105/206/301/303/902/904 は既存）
- Architecture: `docs/ARCHITECTURE.md`（UI → CMD → BIZ → IO 一方向、変更なし）
- Function / command / DTO: `docs/function-design/21-io-inventory-repo.md` §10.1 / `44-cmd-inventory.md` §23.10 / `65-inventory-record-traceability.md` §65.4.2 / `59-ui-shared-patterns.md`
- DB: 変更なし
- Screen / UI: `docs/design-system/02-component-catalog.md` ⑩ ページネーション / `docs/design-system/01-decision-rules.md` DSR-22
- Decision log / ADR: なし（本 packet の L3-D1〜D6 が新規決定）

## Required Design Artifacts

Use `docs/DEV_WORKFLOW.md` Design artifact selection to decide what must exist before implementation.

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | `21-io-inventory-repo.md` §10.1 / `44-cmd-inventory.md` §23.10 / `65-inventory-record-traceability.md` §65.4.2 | updated in this PR（S10） |
| Command / DTO / generated binding / wire shape | `ListQuery` / `MovementQuery` の `per_page` 上限（型は変更なし） | existing sufficient（値のみ変更、DTO shape 不変） |
| DB / transaction / audit / rollback / migration | — | 該当なし |
| Screen / UI / route state / Japanese wording | `02-component-catalog.md` ⑩ / `01-decision-rules.md` DSR-22 | updated in this PR（S11） |
| CSV / TSV / report / import / export format | — | 該当なし |
| durable decision / ADR | 本 packet の L3-D1〜D6（Design Intent Trace 参照） | new in this PR |

## Registration / Generation Obligations

新規追加物に付随する登録・生成義務の checklist。該当なしなら `該当なし` と 1 行残す（節の削除はしない）。

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし（既存 command の per_page 値のみ変更、新規 command なし） |
| function-design doc 新設 | 該当なし（既存 doc 3 箇所の値更新のみ、新設なし） |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 該当なし（既存 REQ-105/206/301/303/902/904 の再利用のみ、新規 REQ 追加なし。実装後に `rg -n "REQ-" src --glob '*.test.tsx'` の差分で新規 REQ token が無いことを再確認） |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし（既存画面への Select 追加のみ） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | `02-component-catalog.md` ⑩ / `01-decision-rules.md` DSR-22 | L3-D1（2026-09-05） | 件数文言を「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」から「全 {n} 件のうち {from}〜{to} 件を表示（{p} / {t} ページ）」へ。owner 直回答 E9「文言は自然文型で確定」。代替案（現行維持）は owner が明示的に棄却 | `Pagination.tsx` `rangeText` | `Pagination.test.tsx` SC3a/SC3c |
| — | `02-component-catalog.md` ⑩「perPage 規約」 | L3-D2（2026-09-05） | 共有定数を `features/products` から `components/patterns` へ移設。理由: Lane 2 D-9 が確立した「patterns は features を import しない」逆依存禁止の原則を、定数の定義側にも適用する（現状は逆に features 側の定数を patterns 以外の 6 画面が import する歪な構成だった）。型エイリアス名は変更コスト対効果が低いため据え置き | `src/components/patterns/list-per-page.ts`（新設） | `search.test.ts` の定数 import 元更新 |
| — | Plans.md ④ owner 反応 ledger E9〜E11 | L3-D3（2026-09-05） | perPage の永続化先は画面ごとに分岐: URL search state を既に持つ画面（商品一覧・一括価格改定）はそれを踏襲、それ以外（在庫照会・入出庫履歴・在庫変動履歴・操作ログ・整合性チェック）はローカル state のみとし再訪でリセットする。理由: 6 画面に新規 URL search schema を追加するのは本 lane の scope（perPage 横展開のみ）を超える設計変更になる。Coordinator 確定（2026-09-05） | 5 画面の `useState` | 各 Page.test.tsx |
| — | `21-io-inventory-repo.md` §10.1 / `44-cmd-inventory.md` §23.10 / `65-inventory-record-traceability.md` §65.4.2 | L3-D4（2026-09-05） | `MAX_PER_PAGE`（list.rs:21）は `list_receivings`/`list_returns`/`list_disposals`/`list_inventory_records`/`list_movements` の5関数で共有される単一定数のため、100→200 の変更は入出庫履歴・在庫変動履歴以外にも及ぶ。UI から可変にならない 3 関数（receivings/returns/disposals）は機能影響なしと確認済み | `list.rs:21` | `list.rs` 既存 3 test の境界値更新 + 新規 200 OK test 2 本 |
| — | `ListShell.test.tsx` / `ProductListPage.test.tsx` | L3-D5（2026-09-05） | `font-semibold` 撤去に伴い `.text-base.font-semibold` selector が機能しなくなるため `.text-base` 単独へ切替。下部 `Pagination` は `text-sm` のため衝突しないことを確認済み | `ListShell.test.tsx:96,116` / `ProductListPage.test.tsx:628,654` | 同上（selector 更新自体が contract） |
| — | `IntegrityCheckPage.tsx` | L3-D6（2026-09-05） | 整合性チェックは `run_integrity_check` 全件取得後の client-side slice のため、他画面のような「request per_page」オラクルが成立しない。Select の効果は「1 ページの表示行数上限」で検証する | `IntegrityCheckPage.tsx:45,97` | `IntegrityCheckPage.test.tsx` 新規 test |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 packet の「起票時実測」節と Design Intent Trace が値・理由の一次情報。実装後は S11 で catalog ⑩ / DSR-22 に文言 pin を反映し、packet 依存を解消する
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: L3-D1（文言）と L3-D4（`MAX_PER_PAGE` 共有範囲）は S11/S10 で catalog ⑩・DSR-22・design doc 3 箇所へ反映する。L3-D2/D3/D5/D6 は実装詳細のため packet 止まりで良い（source doc への昇格不要、Coordinator 裁定）
- Assumptions and constraints: 画面別既定 perPage は owner 決定（2026-09-05）で全 8 画面確定済み。URL param 対象画面の判定（L3-D3）は Coordinator 確定（2026-09-05）、Plan Review は妥当性を検査する
- Deferred design gaps, risk, and follow-up target: `list_receivings`/`list_returns`/`list_disposals` の 200 boundary test は本 lane で追加しない（UI 非公開のため）。Lane 4/5 の contract audit で拾う候補として記録
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-list-backbone-d-lane3.md) 各行に L3-D 番号か DSR-22/catalog ⑩ 節番号を付す）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外なし。全 8 画面が同一 `LIST_PER_PAGE_OPTIONS` を参照し、backend 上限緩和は既存 5 関数すべてに一律適用される（部分適用の抜け道なし）

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI ↔ BIZ の既存境界を変更しない | — |
| Fact check / design decision split | 適用: 起票時実測で「発注時の想定と食い違う点」を複数発見（04-backbone/review-checklist の 0 hit、`.text-base.font-semibold` selector 破損、IntegrityCheck の client-side slice） | 本 packet の「起票時実測」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 8 画面の一覧操作に Select が増える。owner L3 で操作性を確認（AC-L3-1） | AC-L3-1〜4 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner Windows native L3（AC-L3-1〜4） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: catalog ⑩・DSR-22 は Lane 1a/2 で正本化済みで、本 lane は既定値・上限値の数値更新と全画面展開のみ
- Source docs updated in this PR: `02-component-catalog.md` ⑩ / `01-decision-rules.md` DSR-22 / `21-io-inventory-repo.md` §10.1 / `44-cmd-inventory.md` §23.10 / `65-inventory-record-traceability.md` §65.4.2
- Design gaps intentionally deferred: なし（既定 perPage は 8 画面すべて owner 決定済み）
- Durable decisions discovered in this plan and promoted to source docs: L3-D1（文言）/ L3-D4（`MAX_PER_PAGE` 共有範囲の明記）

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 維持。UI 層の state 追加のみ、CMD/BIZ/IO の呼出し方向は変更しない
- Backend function design: `list.rs` の `MAX_PER_PAGE` 定数値変更のみ、シグネチャ不変
- Command / DTO / data contract: `ListQuery`/`MovementQuery` の shape 不変、許容値域のみ変更
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 件数文言統一、Select ラベル「表示件数」で統一
- Error, empty, retry, and recovery behavior: `ValidationFailed` の発火境界が 101→201 に移動。0 件時の表示（「0 件」）は変更しない
- Testability and traceability IDs: 既存 REQ-105/206/301/303/902/904 を再利用、新規 REQ 追加なし

## Contract Probe

Required for R3/R4 plans that rely on an unverified external premise. If not applicable, state N/A and the reason.

- IntegrityCheckPage の Select が client-side slice にのみ作用し backend request を発火しないという前提: `IntegrityCheckPage.tsx:76-99` の実読（起票時実測）で `mismatches` が `run_integrity_check` の単発結果を `useState` 保持していることを確認済み → 実装時に再度 `IntegrityCheckPage.tsx` を読んで前提が崩れていないか確認するのみで、追加の実験は不要（N/A、静的コード確認で足りる）
- `.text-base` 単独 selector が `ListShell`/`ProductListPage` の DOM で他要素と衝突しないという前提: 起票時実測で下部 `Pagination` が `text-sm` であることを確認済み。実装時に `screen.debug()` 等で他の `text-base` 要素混入がないか確認する（Writer completion 条件、Contract Probe 自体は N/A）

## Contract Coverage Ledger

Required for R3/R4. Include every contract or design decision in the touched source-doc sections; a missing row is a Plan Gate blocker.

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| L3-D1 件数文言 | `Pagination.tsx` `rangeText` | `Pagination.test.tsx` SC3a/SC3c（更新） | AC-L3-3 |
| L3-D2 共有定数移設 | `list-per-page.ts` + 6 file の import 更新 | `search.test.ts`（更新）+ 新規 `list-per-page.test.ts` | non-scope（L3 対象外、機械的契約） |
| L3-D3 perPage 永続化先の分岐 | 5 画面の `useState` | 各 Page.test.tsx | AC-L3-1 |
| L3-D4 `MAX_PER_PAGE` 共有範囲 | `list.rs:21` | `list.rs` 3 test 更新 + 新規 2 test | AC-L3-2 |
| L3-D5 `.text-base` selector | `ListShell.test.tsx` / `ProductListPage.test.tsx` | 同左（selector 更新） | non-scope（内部 test 契約） |
| L3-D6 整合性チェック client-side slice | `IntegrityCheckPage.tsx` | `IntegrityCheckPage.test.tsx` 新規 | AC-L3-1 |
| DSR-22 件数文言 pin | `01-decision-rules.md:429` | 該当なし（docs review） | non-scope |
| catalog ⑩ 件数文言 pin + perPage 規約 | `02-component-catalog.md:613,619,643,651` | 該当なし（docs review） | non-scope |
| 21-io-inventory-repo.md §10.1 上限値 | `docs/function-design/21-io-inventory-repo.md:7` | 該当なし（docs review） | non-scope |
| 44-cmd-inventory.md §23.10 上限値 | `docs/function-design/44-cmd-inventory.md:1056` | 該当なし（docs review） | non-scope |
| 65-inventory-record-traceability.md §65.4.2 上限値 | `docs/function-design/65-inventory-record-traceability.md:86` | 該当なし（docs review） | non-scope |
| `list_receivings`/`list_returns`/`list_disposals` の上限緩和副作用 | `list.rs:21`（共有定数） | 追加テストなし（UI 非公開のため） | non-scope（Lane 4/5 audit 候補として記録） |

## Test Plan

For R3/R4, include or link a Test Design Matrix: [test-matrices/2026-09-05-ui-list-backbone-d-lane3.md](test-matrices/2026-09-05-ui-list-backbone-d-lane3.md)
- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate.

- targeted tests: 8 画面の Select 動作 test（新規 6 + 既存 2 画面の import 更新確認）、`Pagination.test.tsx` SC3a/SC3c 更新、`list.rs`/`inventory_cmd.rs` の boundary test 更新 + 新規
- negative tests: perPage 201 相当（既存 3 test の境界値更新）、`ValidationFailed` を維持する経路の確認
- compatibility checks: `PRODUCT_PER_PAGE_OPTIONS` 依存箇所の網羅的置換確認（`rg` 0 hit）
- data safety checks: 該当なし（DB 書込みなし）
- main wiring/integration checks: 各画面の Select → state → backend request/client slice の配線 test

## Boundary / Wire Contract

Required when the change touches JSON API, browser state, CSV, config, manifest, cache schema, Tauri command DTOs, generated bindings, report output, or DB-backed compatibility.

- producer: frontend の `per_page` パラメータ（`ListQuery`/`MovementQuery` DTO 経由）
- consumer: `inventory_service::list.rs` の `validate_page_params` / `list_movements` 内チェック
- wire type: `u32`（既存、変更なし）
- internal type: `u32`（既存、変更なし）
- precision/range: 許容範囲が `1..=100` から `1..=200` へ拡大（`MAX_PER_PAGE` 定数値のみ変更、DTO shape 不変）
- round-trip path: frontend Select → state → `commands.list*` invoke → BIZ validate → repo query → `PaginatedResult` 返却
- invalid input: `per_page > 200` は引き続き `BizError::ValidationFailed("ページパラメータが不正です")`（境界値のみ移動、エラー経路は不変）
- compatibility: 既存 `per_page <= 100` のリクエストは影響なし。201 以上を送っていた既存 test はすべて更新対象として本 packet に列挙済み

## Review Focus

- `rangeText` の文言差し替えが `Pagination`（下部）と `PaginationSummary`（上部）の両方に一貫して効くこと（共有関数のため二重実装なきこと）
- `.text-base` 単独 selector が意図せぬ要素に一致していないこと（L3-D5）
- `MAX_PER_PAGE` の 100→200 変更が影響する 5 関数すべてで既存 test が矛盾なく更新されていること（`list_receivings`/`list_returns`/`list_disposals` を含む）
- 6 画面の perPage 状態が「URL param か local state か」の裁定（L3-D3）どおりに実装されているか
- IntegrityCheckPage の Select が client-side slice の件数のみに作用し、余計な backend request を発火していないこと

## Spec Contract

Required for R3/R4.
Use at least one data row. Put concrete test names in the Test column when a regression test exists; use review/evidence labels only for plan-only checks.

Contract ID: SPEC-UILB-D3

- 8 一覧画面が共有 `LIST_PER_PAGE_OPTIONS`（50/100/200）を参照する `Select` を持ち、件数文言が新形に統一され、入出庫履歴・在庫変動履歴で perPage 200 が `ValidationFailed` を起こさない

## Trace Matrix

Required for R3/R4.

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UILB-D3 | S1 | `search.test.ts`（更新）+ 新規 `list-per-page.test.ts` | 共有定数の 1 本化 | vitest |
| SPEC-UILB-D3 | S2/S3 | `Pagination.test.tsx` SC3a/SC3c、`ListShell.test.tsx`、`ProductListPage.test.tsx` | 文言・weight の全画面共通反映 | vitest |
| SPEC-UILB-D3 | S4〜S9 | 各 Page.test.tsx 新規 test | Select 配線・既定値 | vitest |
| SPEC-UILB-D3 | S10 | `list.rs`/`inventory_cmd.rs` 更新 3 + 新規 2 | 200 OK / 201 NG boundary | cargo test |
| SPEC-UILB-D3 | S11 | docs review（自動テストなし） | 文言 pin・上限値 doc 一致 | `rg` 完全一致 |

## Data Safety

Required for R3/R4.

- what must not be committed: なし（本 lane に synthetic/local-only データ生成はない）
- local-only paths: 該当なし
- synthetic-only paths: 該当なし

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
