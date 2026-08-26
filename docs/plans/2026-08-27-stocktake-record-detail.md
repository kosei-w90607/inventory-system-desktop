# Plan Packet: 棚卸し詳細 route + get_stocktake_record（65 slice 4c）

2026-08-26 遷移契約 sweep（[archive/plans/2026-08-26-transition-contract-sweep.md](../archive/plans/2026-08-26-transition-contract-sweep.md)）で起票された既存不具合の是正: 在庫変動履歴の「棚卸し #n」元記録 link が 404（`/stocktake/records/$stocktakeId` 詳細 route 不在）。UI-06c-D7 の明示契約（未実装 route でも `source.route` を表示）どおりの既存 gap であり、回帰ではない。owner 裁定（2026-08-27）= slice 4b（PR #58 CSV取込み詳細）同型の詳細 route 先行実装（一覧は runway 残置）。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Claude Fable 5 (main session)
- Writer: Codex (GPT-5.6、発注書駆動)
- Plan Reviewer: Claude Sonnet 5 (independent fresh context)
- Final Reviewer: Claude Sonnet 5 (independent fresh context) + Coordinator mutation 独立再実測
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: pending = owner Windows native L3（synthetic 棚卸し確定 → 在庫変動履歴 →「棚卸し #n」click → 詳細表示 → returnTo 戻り）+ Ready 承認

Phase 遷移記録（kickoff → spec-check → design → plan-draft → plan-gate）: task scope と R3 判定は本 packet に記録済み。spec-check で 65 §65.3 / §65.5 / §65.7.1 は完成形契約を保持するが backend 層別設計（IO/BIZ/CMD）と slice 定義が不足と判定し design へ。design 出力（20-io §2.11a / 35 §20.6a / 42 §22.5 / 65 §65.10 slice 4c + §65.8.3）は本 plan-first change に同乗。packet + Test Design Matrix を同 commit で commit し plan-gate に至る。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2（relay 会計は発注 lane 単位 — PR #95 / UI-15 先例）
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
Risk Tiers R3 行「DB, POS CSV, PLU TSV, Tauri command DTO, report CSV, route/search state, operator workflow, or merge gate changes.」のうち、新規 route/search state（`/stocktake/records/$stocktakeId` + `returnTo`）、新規 Tauri command DTO + generated bindings（`StocktakeRecordDetail` / `StocktakeStatus`）、operator workflow（「押せるのに 404」の解消）に該当するため。DB schema・CSV format・merge gate は変更しない。

## Goal

Goal Invariant:

### 最小完了条件

- 在庫変動履歴の「棚卸し #n」元記録 link から、404 ではなく棚卸し詳細（ヘッダ、補正明細、関連 movements、状態。65 §65.5 棚卸し列）が表示される。

### 失敗定義

- link が引き続き 404 になる、または詳細画面が 65 §65.5 棚卸し列の必須項目（記録ID/業務日付/作成日時/状態、明細数、商品情報、数量/単位、原価/ロス原価、関連 movements、取消/訂正情報〈= 未実装のため CTA 非表示の維持〉）を表示しない。
- 差異の表示が補正 movement と乖離する（snapshot 差で表示してしまう）。
- 既存棚卸し flow（開始/カウント/確定）、既存 `/stocktake` 作業画面、または既存 5 記録詳細画面に回帰が出る。

### 非目的

- 一覧 route `/stocktake/records` と `listStocktakeRecords(query)`（後続スライス。65 §65.10 slice 4c に明記）
- 棚卸しの取消・再開・訂正機能（status は既存 2 値のまま）
- 74-ui-operation-logs 許可リストへの `stocktake` 追加（`record_type` producer 0 件のため実データ影響なし。65 §65.8.3 が追跡）
- ロス/増加原価の集計列（一覧 slice 所管。詳細は stored 値 total_cost / valuation_cost_price の表示のみ）
- 棚卸し作業画面（UI-10）の機能変更（route file の layout + index 再構成のみ）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

1. IO: `db::stocktake_repo` へ `get_stocktake_record_detail` 追加（[20-io-product-repo.md](../function-design/20-io-product-repo.md) §2.11a）。補正明細は補正 movement 起点の JOIN（差異 = movement quantity、snapshot 差ではない — §2.11a 処理ステップ 3）
2. BIZ: `biz::stocktake_service::get_stocktake_record` 追加（[35-biz-stocktake-service.md](../function-design/35-biz-stocktake-service.md) §20.6a）。movements の source 補完は `biz::inventory_service` の共有 `resolve_movement_source` を再利用（`pub(crate)` re-export は PR #58 で導入済み — `src-tauri/src/biz/inventory_service/mod.rs` の `pub(crate) use list::resolve_movement_source;` を実読確認済み）。`StocktakeStatus` enum（2 値、D-061）新設、想定外値 fail-fast
3. CMD: `cmd::stocktake_cmd::get_stocktake_record` 追加 + `#[tauri::command]` / `#[specta::specta]` 属性の対 + `lib.rs` の **2 箇所登録**: `export_specta_bindings()` 内 `collect_commands![...]` と `.invoke_handler(tauri::generate_handler![...])` の両方（[42-cmd-sales-stocktake.md](../function-design/42-cmd-sales-stocktake.md) §22.5 / §22.8 追記。4b Plan Review round 1 P2 の教訓を最初から Scope 化）
4. bindings: `cargo run --bin generate_bindings` 再生成（`getStocktakeRecord` / `StocktakeRecordDetail` / `StocktakeRecordDetailItem` / `StocktakeStatus` union。既存 `Stocktake` 型と既存 stocktake command 7 本〈get_active_stocktake / start_stocktake / get_stocktake_items / find_stocktake_item / get_last_completed_stocktake / update_count / complete_stocktake、`lib.rs` L316-322 実カウント〉の wire は不変 = diff 追加のみ）
5. route: **`stocktake.tsx` の layout route 化**（`<Outlet />` のみを render、`csv-import.tsx` と同型）+ **`src/routes/stocktake/index.tsx` 新設**（`StocktakePage` を index route へ移設。**現行 `stocktake.tsx` の `validateSearch: searchSchema`（dept / counted_only / page）と `RouteComponent` の `Route.useSearch()` / `Route.useNavigate()` 消費も一体で index route へ移設する** — 既存 layout+index 5 site はいずれも validateSearch を持たず precedent 不在のため明示指定。rally round 1 P1-2）+ `src/routes/stocktake.records.$stocktakeId.tsx` 新設 + `npm run generate:routes`。既存 `/stocktake` 作業画面は index route で従来どおり描画され、`?dept=` / `?counted_only=` / `?page=` 付き直接進入で search 駆動の絞り込み・ページングが従来どおり機能することを runtime route test で固定する（T16。4b gated Amendment 1 の教訓を最初から Scope 化）。詳細 route 側の `validateSearch` は `returnTo` pattern（`z.string().max(500).optional().catch(undefined)`）を既存 5 詳細 route と同形で踏襲
6. UI: `src/features/inventory-records/StocktakeRecordDetailPage.tsx` 新設。`CsvImportRecordDetailPage.tsx` を canonical 参照とし、同構造（useQuery + queryKeys + describeError + returnTo 戻り導線）。status label は in_progress →「進行中」/ completed →「完了」の正規化表示（65 §65.6.1）。in_progress（手動 URL 進入）は補正明細 0 件・movements 0 件・原価は算定前として「—」等で表示する正常表示
7. query key: `queryKeys.inventoryRecords.stocktakeDetail(stocktakeId)` + prefix 用 `stocktakeDetailRoot()` 追加
8. D-052 契約変更（C23 として採番予約。実装時に live `invalidation-contract.ts` の最終 C 番号を再実測して確定 — PR #86 WER の番号衝突教訓）: `stocktakeComplete` / `productCreate` / `productImport` へ `queryKeys.inventoryRecords.stocktakeDetailRoot()` を追加。導出（UI_TECH_STACK §2.5 table.column、rally round 1 P1-1 / P2-3 で全数やり直し）: (a) `complete_stocktake` は stocktakes / stocktake_items / inventory_movements を書き、本 query の全読取り列に影響する (b) `create_product` ステップ6 と `commit_import` は進行中棚卸しへ stocktake_items 行を自動追加し（`src-tauri/src/biz/product_service.rs` L257-264 / L1345-1353 実読）、in_progress 詳細の `item_count` を変化させる (c) `stocktakeCountUpdate` は**追加しない** — 書き込む actual_count / counted_at を本 query が返すのは補正明細（movement 起点 JOIN）経由のみで、補正 movement が存在しない in_progress 中は空、completed 後は `update_count` 自体が status guard で到達不能（`src-tauri/src/biz/stocktake_service.rs` L207-211）。列レベルで読取り集合と交差しない (d) `stocktakeStart` は新規 header/items の作成のみで既存詳細の読取り対象を変更しないため追加しない (e) 商品改名による product_name / department_name の stale は既存 5 詳細と同じ pre-existing class（4b と同裁定で非対象）。**広域 prefix `inventoryRecords.root()`（4b の csvImportRollback 方式）は不採用** — 専用 `stocktakeDetailRoot()` prefix が過剰禁止原則に適う最小集合。独立転記 oracle test（`src/test/invalidation-oracle.ts`）の追随 + production-only mutation 感度の再実測込み
9. tests: 実装と同時に作成、`REQ-206` / `REQ-207` token 付与、`cargo run --bin generate_traceability` で 90 再生成
10. design docs（本 plan-first commit に同乗済み）: 20-io §2.11a / 35 §20.6a + 更新履歴 / 42 §22.5 `get_stocktake_record` + §22.8 追記 / 65 §65.10 slice 4c + §65.8.3 差替え + 変更履歴
11. 52-ui §52.3 routing 表 UI-10 行の layout + index 表記同期（`src/routes/stocktake.tsx`（layout）+ `src/routes/stocktake/index.tsx`（index）。UI-07 行と同形。実装と同 PR で Writer が実施）

## Non-scope

- 一覧 route `/stocktake/records` + `listStocktakeRecords(query)`
- 棚卸しの取消 / 再開 / 訂正 command・CTA
- 74-ui-operation-logs 許可リストへの `stocktake` 追加
- CSV 出力 / 印刷（65 §65.10 slice 6）・画像添付
- `stocktakes` / `stocktake_items` / `inventory_movements` の schema 変更（なし）
- 既存 stocktake command 7 本（get_active_stocktake / start_stocktake / get_stocktake_items / find_stocktake_item / get_last_completed_stocktake / update_count / complete_stocktake）の wire 変更（なし）
- 棚卸し作業画面の recent / last-completed 表示への詳細導線追加（後続判断）

## Acceptance Criteria

- AC1（変更前 canary）: main 時点で `/stocktake/records` 系 route が存在しない実出力（`rg -c "stocktake/records" src/routeTree.gen.ts` = 0 件〈exit 1〉）を PR body に収録する
- AC2: `cd src-tauri && cargo test` green（`get_stocktake_record` 系の IO/BIZ/CMD test を含む）
- AC3: `npm test` green（`StocktakeRecordDetailPage` test を含む）
- AC4: `src/lib/bindings.ts` diff に `getStocktakeRecord` / `StocktakeRecordDetail` / `StocktakeStatus` が追加され（`rg -c "getStocktakeRecord" src/lib/bindings.ts` ≥ 1）、`cargo run --bin generate_bindings` 再実行で clean diff。既存 `Stocktake` 型と既存 stocktake command 7 本（Scope 4 列挙）の wire 行は不変（diff が追加のみ）
- AC5: `src/routeTree.gen.ts` に `/stocktake/records/$stocktakeId` が生成される（`rg -F -c "stocktake/records/" src/routeTree.gen.ts` ≥ 1）
- AC6: 在庫変動履歴画面の「棚卸し #n」link を `userEvent.click` で押下し、SPA 遷移後に詳細画面の内容が render されることを assert する test（`href` assert のみは不可 — batch A X3 survivor の教訓）
- AC7: 存在しない stocktake_id で利用者向け日本語 error（「棚卸し記録が見つかりません」系）が表示される test（`src/features/inventory-records/StocktakeRecordDetailPage.test.tsx`、Matrix T11。`npm test` で実行され green）
- AC8: `/stocktake` 直接進入で既存棚卸し作業画面（`StocktakePage`）が従来どおり描画され、`?dept=` / `?counted_only=` / `?page=` 付き進入で search 駆動の絞り込み・ページングが機能する runtime route test（layout + index 再構成 + validateSearch 移設の回帰防止、Matrix T16）
- AC9: in_progress 棚卸しの詳細（手動 URL 進入）で「進行中」label + 補正明細 0 件 + movements 0 件の正常表示 test（`src/features/inventory-records/StocktakeRecordDetailPage.test.tsx`、Matrix T12。completed 側の非空期待 case と対にする — 空集合 oracle 衝突の回避。`npm test` で実行され green）
- AC10: invalidation 独立転記 oracle test が `stocktakeComplete` / `productCreate` / `productImport` の新集合と順序非依存・重複検出付き完全一致（`stocktakeCountUpdate` の非追加も集合一致で担保）
- AC11: `bash scripts/local-ci.sh full` CLEAN（L1、exact-HEAD evidence は PR body 所管）

## Design Sources

- Requirements / spec: REQ-206（過去記録の検索・詳細表示）、REQ-207 / TRACE-D2（movement → 元記録の相互遷移）
- Architecture: `docs/ARCHITECTURE.md`（UI → CMD → BIZ → IO 一方向）
- Function / command / DTO: [65-inventory-record-traceability.md](../function-design/65-inventory-record-traceability.md) §65.3 / §65.5 / §65.7.1 / §65.10 slice 4c、[20-io-product-repo.md](../function-design/20-io-product-repo.md) §2.11a、[35-biz-stocktake-service.md](../function-design/35-biz-stocktake-service.md) §20.5 / §20.6a、[42-cmd-sales-stocktake.md](../function-design/42-cmd-sales-stocktake.md) §22.3 / §22.5 / §22.8、[31-biz-inventory-service.md](../function-design/31-biz-inventory-service.md) §12.6a（read-only パターン正本）、[66-ui-stock-movements.md](../function-design/66-ui-stock-movements.md) UI-06c-D7
- DB: `docs/db-design/tracking-system-tables.md` 16-17（stocktakes / stocktake_items。status CHECK 2 値。schema 変更なし）
- Screen / UI: 65 §65.5 / §65.8、`docs/UI_TECH_STACK.md` §2.5（D-052 導出原則）、[52-ui-shared-layout.md](../function-design/52-ui-shared-layout.md) §52.3（UI-10 行）、[59-ui-shared-patterns.md](../function-design/59-ui-shared-patterns.md)、`docs/design-system/README.md` 一式
- Decision log / ADR: D-052（invalidation SSOT。Revisit 条項 = 契約変更時は SSOT / oracle / mutation 再実測を同一 PR）、D-061（有限 IPC 値の generated enum）、D-062（Plan Reviewer 別 vendor）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 20-io §2.11a / 35 §20.6a / 42 §22.5 | updated in this PR（plan-first commit 同乗） |
| Command / DTO / generated binding / wire shape | 42 §22.5 + 本 packet `Boundary / Wire Contract` | updated in this PR |
| DB / transaction / audit / rollback / migration | db-design/tracking-system-tables.md 16-17 | existing sufficient（read-only、schema 変更なし） |
| Screen / UI / route state / Japanese wording | 65 §65.3 / §65.5 / §65.6.1 / §65.10 slice 4c + 52 §52.3 UI-10 行 | 65 slice 4c は updated in this PR、52 行は実装 PR で同期（Scope 11） |
| CSV / TSV / report / import / export format | — | 触らない |
| Durable decision / ADR | D-052 / D-061 / D-062 既存適用 | existing sufficient（新規 durable decision なし。差異定義は 35 §20.6a 設計ノートに正本化済み） |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| Tauri command `get_stocktake_record` | `lib.rs` の 2 箇所登録（`collect_commands![...]` + `.invoke_handler(generate_handler![...])`）/ `#[tauri::command]` + `#[specta::specta]` 対 / `generate_bindings` 再生成 | Scope 3 / 4。Ledger に invoke_handler 行を独立行として立てる |
| function-design doc 新設 | — | 該当なし（既存 4 doc への追記。design_compliance の doc↔module map は既存 module〈stocktake_repo / stocktake_service / stocktake_cmd〉の追記のため entry 追加不要の見込み、L1 の design_compliance test green で機械確認。§2.11a / §20.6a / §22.5 の新関数は実装までは info_unimplemented 扱い） |
| source / workflow doc 新設・改名 | — | 該当なし |
| Consultation Relay | — | 不使用 |
| REQ coverage 追加 | `generate_traceability` で 90 再生成 | Scope 9 |
| route 新設 | `npm run generate:routes` | Scope 5 |
| operator 画面新設 | navigation entry | 不要（詳細画面は sidebar 非搭載。既存 5 記録詳細と同輩、`src/config/navigation.ts` は `/stocktake` top-level のみで詳細 entry を持たない現況を実読確認済み）。到達導線契約は「movements link click → SPA 遷移」を Ledger 行 + AC6 で担保 |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-207 / TRACE-D2 | 65 §65.3（route 表 L64）/ §65.10 slice 4c | UI-06c-D7 後続 | 詳細 route 実装を採用（owner 裁定 2026-08-27）。link 生成停止 + text 表示化案は UI-06c-D7 契約の amendment を要し、完成形実装時に差し戻す使い捨て作業のため不採用。一覧 + 詳細の同時実装案は 404 是正に一覧が不要のため不採用 | route + `StocktakeRecordDetailPage` | AC1 / AC5 / AC6 |
| REQ-206 | 65 §65.5 棚卸し列 / §65.6.1 状態正規化 | — | 表示項目は既存契約に従う。原価/ロス原価 yes / 金額 no / 種別 no / 画像 no の列定義どおり | `StocktakeRecordDetailPage` | AC3 / T9 |
| REQ-205 系（差異意味論） | 35 §20.5 / §20.6a 設計ノート / 20-io §2.11a ステップ 3 | 65 slice 4c | 差異 = 補正 movement quantity（確定時 live 在庫基準）。snapshot 差（`system_stock - actual_count`）案は棚卸し中の在庫変動（SP-205-09）で補正実績と乖離するため不採用 | IO JOIN + Page 表示 | T3（乖離 fixture で弁別） |
| REQ-207 | 66 UI-06c-D7 | — | link URL 表示契約は不変。遷移先実装のみ追加 | — | AC6 |
| D-061 | 35 §20.6a | D-061 | `status` は BIZ 所有の新設 2 値 enum `StocktakeStatus`（IO は raw TEXT を返し BIZ で変換 — 層方向維持）。既存 `Stocktake` wire の `status: String` は既存 command 互換のため不変 | DTO | AC4 / T6 |
| D-052 C23（予約） | UI_TECH_STACK §2.5 | D-052 | `stocktakeComplete` / `productCreate` / `productImport` へ `stocktakeDetailRoot()` prefix（棚卸し中の商品自動明細追加が `item_count` を変える — Scope 8 導出 (b)）。`stocktakeCountUpdate` は列レベルで読取り集合と交差せず非追加（導出 (c)）、`stocktakeStart` も非追加（導出 (d)）。広域 `inventoryRecords.root()` は不採用（最小集合） | `invalidation-contract.ts` + oracle test | AC10 / T14 |
| REQ-206 | 65 §65.5（returnTo 戻り） | TRACE-D11 同型 | movements から来た場合の検索条件保持は既存 5 詳細の `returnTo` pattern を踏襲 | route `validateSearch` | T13 |

## Design Intent Audit

- Source docs can answer what/why without chat history: yes — 65 slice 4c が起点（404 起票と owner 裁定）と非 scope 境界を、20/35/42 が層別設計と差異定義を記載
- Plan-only durable decisions promoted: なし（差異定義・StocktakeStatus 所有・movement 起点 JOIN の層判断は 20/35 に記載済み）
- Assumptions / constraints: SQLite 単一接続、status は DB CHECK による 2 値保証、詳細 route は親 layout（`<Outlet />`）経由で描画される layout + index 構造（csv-import 系 5 種と同型。Contract Probe 参照）、補正 movement は `complete_stocktake` のみが生成（35 §20.5）
- Deferred design gaps: 一覧 route / 74 許可リスト追随 / 取消・再開機能（それぞれ 65 §65.10・§65.8.3・35 §20.7 が追跡）
- Test Design Matrix cites decision IDs: yes（Matrix 参照）
- Absolute guarantee self-check: 「in_progress 棚卸しは movements 0 件」は補正 movement を `complete_stocktake` だけが書くことに依存 — `stocktake` reference を書く他の経路は BIZ-06 §20.5 のみ（整合性補正 BIZ-07 は movement を作らない = 65 冒頭 D-051）。例外なし。詳細画面は 0 件でも N 件でも表示が壊れない設計とし T4/T12 で固定

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 本 change は app-core の棚卸し記録表示のみ。POS/Z004/CV17 等 adapter 事実に触れない | — |
| Fact check / design decision split | 404 は 2026-08-26 遷移契約 sweep の実読裏取り済み起票（producer `list.rs:226` + route 不在）。差異意味論は `complete_stocktake` 実装（live 在庫基準）の実読で確定 | sweep 記録 + 35 §20.6a |
| Lifecycle / retry | in_progress → completed の状態遷移表示、棚卸し中の商品自動明細追加・確定による詳細 cache 鮮度（D-052 C23）を State Lifecycle Matrix でカバー | Test Matrix |
| Operator workflow | 「押せるのに 404」解消。movements → 詳細 → returnTo 戻りの実順序 | Matrix T10/T13 + L3 |
| Replacement path | not applicable（POS 外部システム非接触） | — |
| Data safety / evidence | synthetic fixture のみ。実棚卸しデータ非 commit | Data Safety 節 |
| Reporting / accounting semantics | 表示のみで集計意味論不変。total_cost / valuation_cost_price は stored 値の表示転記 | — |
| Manual verification | L3 視認 1 系統（synthetic 棚卸し確定後の link 遷移・表示・戻り確認） | Human Gate |
| 環境・再現性 | 新設の環境依存なし（既存 toolchain / 既存生成系のみ） | — |

## Design Readiness

- Existing design docs are sufficient because: 65 が route / 表示項目 / command 対 / 状態正規化の完成形を保持し、31 §12.6a が read-only 詳細取得の層パターンを、PR #58（slice 4b）が同型実装の canonical を確立済み
- Source docs updated in this PR: 20-io §2.11a / 35 §20.6a + 更新履歴 / 42 §22.5 + §22.8 / 65 §65.10 slice 4c + §65.8.3 + 変更履歴（いずれも plan-first commit 同乗）
- Design gaps intentionally deferred: 一覧 route、74 許可リスト追随、取消・再開機能
- Durable decisions discovered and promoted: 差異定義（補正 movement 正）を 35 §20.6a 設計ノートへ正本化

Minimum design checks:

- Layer ownership: UI（表示・returnTo）→ CMD（thin wrapper）→ BIZ（NotFound 変換・status enum 変換・source 補完・corrected_count）→ IO（SQL・DTO core）
- Backend function design: 20-io §2.11a / 35 §20.6a / 42 §22.5
- Command / DTO / data contract: Boundary / Wire Contract 節
- Persistence / transaction / audit impact: read-only、TX 不要、操作ログ記録なし（31 §12.6a / 41 §17.5 get_csv_import_record と同判断）
- Operator workflow / Japanese wording: 状態 label 正規化（進行中/完了）、error 文言は describeError 経由、差異は符号付き表示（UI-10-D10 / 73 §73.6 の符号表現と統一 — PR #75 の教訓）
- Error / empty / retry / recovery: NotFound・in_progress 空明細・movements 0 件・DB error の各経路を Matrix でカバー
- Testability / traceability: REQ-206 / REQ-207 token、90 再生成

## Contract Probe

- layout + index 構造で flat dot 詳細 route が親 `<Outlet />` 経由で描画される前提: `src/routeTree.gen.ts` に `getParentRoute: () => CsvImportRoute` が 2 箇所（L74 / L191）実在 + `csv-import.tsx`（layout）/ `csv-import/index.tsx`（index）実在を rg / 実読で確認 → 本 repo 内の稼働実装（4b gated Amendment 1 の是正結果）で検証済み。stocktake 側も同構成を踏襲する
- `resolve_movement_source` の sibling module 到達性: `src-tauri/src/biz/inventory_service/mod.rs:28` に `pub(crate) use list::resolve_movement_source;` 実在を実読確認 → `stocktake_service` から `crate::biz::inventory_service::resolve_movement_source` で到達可
- status 2 値前提: `src-tauri/src/db/schema_v1.rs` L208-225 に `CHECK(status IN ('in_progress','completed'))` 実在を実読確認 → cancelled 等の第 3 値は DB 層で不存在
- 差異意味論の前提: `biz/stocktake_service.rs` L407 `let difference = product.product.stock_quantity - item.actual_count;`（確定時 live 在庫基準）を実読確認 → snapshot 差との乖離が設計上あり得る（§20.4 動的差異 test も同前提）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| 20 §2.11a: ヘッダ不存在 → DbError::NotFound | `stocktake_repo::get_stocktake_record_detail` | T1 | — |
| 20 §2.11a: item_count = stocktake_items 全件数 | 同上 | T2 | — |
| 20 §2.11a: 補正明細は movement 起点 JOIN + 差異 = movement quantity（live 基準）+ ORDER BY product_code ASC | 同上 | T3（snapshot 乖離 fixture で弁別） | — |
| 20 §2.11a: movements は `stocktake`/`is_voided=0` filter + source=None、in_progress は 0 件で正常 | 同上 | T4（0 件 / N 件両 case、**非空期待が主 oracle**） | — |
| 35 §20.6a: NotFound 変換 + 「棚卸し記録が見つかりません」文言 | `stocktake_service::get_stocktake_record` | T5 | — |
| 35 §20.6a: status raw TEXT → StocktakeStatus 2 値変換 + 想定外値 fail-fast | 同上 | T6 | — |
| 35 §20.6a: source 補完は `resolve_movement_source` 共有（label「棚卸し」/ route `/stocktake/records/{id}`） | 同上 | T7（独立転記 exact oracle） | — |
| 35 §20.6a: corrected_count = items 件数 | 同上 | T2 / T3 | — |
| 42 §22.5: CMD thin wrapper + kind="not_found" 変換 | `stocktake_cmd::get_stocktake_record` | T8（production command 実呼び） | — |
| 42 §22.8: collect_commands 登録 + specta 対 + bindings 生成 | `lib.rs` `export_specta_bindings()` / `bindings.ts` | AC4（clean diff） | — |
| 42 §22.8: invoke_handler（`generate_handler!`）登録 — collect_commands と独立の登録点 | `lib.rs` `.invoke_handler(...)` | T10 / AC6（IPC 実呼出し経路）+ 実装 review で登録行 diff 確認 | L3 視認が実 IPC の最終確認 |
| 65 §65.3: route `/stocktake/records/$stocktakeId` | route file + generate:routes | AC5 | — |
| Scope 5: `stocktake.tsx` layout 化 + `stocktake/index.tsx` 移設で既存作業画面が従来どおり `/stocktake` で描画され、search param（dept / counted_only / page）駆動の絞り込みが機能する | route files（layout + index。validateSearch + useSearch/useNavigate は index 所属） | T16 / AC8（runtime route test） | L3 で作業画面到達も一瞥確認 |
| Scope 5: 詳細 route が layout `<Outlet />` 経由で実描画される | `stocktake.tsx` layout | T10（click 遷移後の詳細 render assert） | — |
| 65 §65.5 棚卸し列: 表示項目（ID/日付/作成日時/状態/明細数/商品情報/数量単位/原価・ロス原価/movements） | `StocktakeRecordDetailPage` | T9 | L3 視認 |
| 65 §65.6.1 / slice 4c: status 正規化 label（進行中/完了）+ 取消/訂正 CTA 非表示 | 同上 | T9 / T12 | L3 視認 |
| 65 slice 4c: in_progress の正常表示（空明細・空 movements・原価は算定前表示） | 同上 | T12 / AC9 | — |
| 65 §65.5 / TRACE-D11 同型: returnTo 検索条件保持 + 不正戻り先 fallback | route `validateSearch` + Page | T13 | — |
| 66 UI-06c-D7: movements link click → SPA 遷移で詳細 render（到達導線契約） | movements link（既存 `MovementTable.tsx`）+ 新 route | T10（userEvent.click、href assert 単独不可） | L3 視認 |
| D-052 C23（予約）: stocktakeComplete / productCreate / productImport へ stocktakeDetailRoot() 追加 + 独立転記 oracle 完全一致 | `invalidation-contract.ts` + oracle test | T14 / AC10 | — |
| D-052: stocktakeStart / stocktakeCountUpdate 非追加の導出記録 | PR body | — | 導出根拠（Scope 8 (c)(d)）を PR body 記録 |
| query key 直書き禁止（D-4 / 順17 無例外化） | `queryKeys.inventoryRecords.stocktakeDetail` | T15（literal sweep 既存 pattern） | — |
| 52 §52.3 UI-10 行の layout + index 表記同期 | 52-ui-shared-layout.md | 実装 review で diff 確認（doc 行） | — |
| 65 §65.8.3: stocktake 除外理由差替え（route 未実装 → producer 0 件）の doc 同期 | 65-inventory-record-traceability.md（plan-first 同乗済み） | 実装 review で diff 確認（doc 行） | — |
| 既存 flow 回帰なし（棚卸し開始/カウント/確定 + 既存 5 詳細） | — | 既存 test suite green（AC2/AC3） | — |

隣接契約 sweep 実施記録: 65 §65.5「詳細画面からは在庫照会の商品詳細へ遷移できる」— 補正明細行の商品 link は canonical（CsvImportRecordDetailPage）と同構造とし T9 の表示項目に含める。65 §65.5「取消/訂正 CTA は cancel/correct command 実装済みの場合だけ表示」— 棚卸しは未実装のため非表示（表示条件どおり、T9 で CTA 不在を assert）。65 §65.9 出力（CSV/印刷）は slice 6 で非 scope。65 §65.4 一覧検索は一覧 slice で非 scope。73-ui-stocktake（作業画面）の契約は無改変（route file 再構成のみ、T16 が回帰を固定）。65 §65.5 の「取消/訂正情報」列 yes（棚卸し含む全種別）は完成形の表示項目であり、cancel/correct 未実装の現況では全 6 詳細画面とも該当情報フィールドが schema 上存在しない pre-existing の完成形先行記述（rally round 1 P3-6。§65.6.1 共通フィールドは stocktakes 非対象）— 本 slice は CTA 非表示 + 状態 label 表示で現況適合とし、情報表示は slice 5（取消/訂正）で扱う。

## Test Plan

Test Design Matrix: [test-matrices/2026-08-27-stocktake-record-detail.md](test-matrices/2026-08-27-stocktake-record-detail.md)

- targeted tests: IO/BIZ/CMD unit + production command 実呼び、Page RTL、click SPA 遷移、invalidation oracle
- negative tests: NotFound、in_progress 空明細・空 movements、不正 returnTo fallback、想定外 status 値
- compatibility checks: 既存 stocktake command 7 本（Scope 4 列挙）の wire 不変（bindings diff が追加のみであること）、既存 5 詳細画面 test green、既存 `/stocktake` 作業画面の runtime 描画維持（search param 駆動挙動込み）
- data safety checks: synthetic fixture のみ、実棚卸しデータ非使用
- main wiring/integration checks: collect_commands + invoke_handler 登録 → bindings 生成 → frontend 呼出しの end-to-end（AC4/AC5/AC6）
- Human Gate に L3 を含むため、Writer 完了条件に `cargo check --release` を含める（CI gate ではない）

## Boundary / Wire Contract

- producer: `cmd::stocktake_cmd::get_stocktake_record`（Rust）
- consumer: `StocktakeRecordDetailPage`（`commands.getStocktakeRecord(stocktakeId)` 経由の useQuery）
- wire type: `StocktakeRecordDetail`（tauri-specta 生成。field は snake_case、`status: StocktakeStatus`（2 値 union、新設）、`items: StocktakeRecordDetailItem[]`、`movements: MovementRecord[]`（source 補完済み）、`total_cost` / `completed_at` は nullable）
- internal type: IO `StocktakeRecordDetailCore`（header: Stocktake + item_count + items + movements）。BIZ が wire DTO を構成
- precision/range: 原価 i64（円整数）、数量・id i64。JS safe integer 内（既存 stocktake wire と同等）
- round-trip path: DB → IO DTO → BIZ wire DTO → bindings → UI 表示のみ（書込みなし）
- invalid input: 存在しない stocktake_id → `CmdError.kind="not_found"` → describeError 経由の利用者向け日本語文言
- compatibility: 既存 command（get_active_stocktake / start_stocktake / get_stocktake_items / find_stocktake_item / get_last_completed_stocktake / update_count / complete_stocktake）と既存 `Stocktake` wire 型は不変（型追加参照のみ、bindings diff は追加のみ）

## Review Focus

- 差異定義の実装一貫性（補正 movement quantity を正とし、snapshot 差の再導入がないか。T3 fixture の弁別性）
- D-052 C23 導出の正確さ（欠落と過剰の両方向。productCreate / productImport の棚卸し中自動明細追加を含む全数導出、stocktakeStart / stocktakeCountUpdate 非追加と root() 不採用の根拠）
- Scope 5 の validateSearch / useSearch / useNavigate 一体移設の完全性（T16 の search param 駆動 assert が形骸化していないか）
- click SPA 遷移証明が href assert に退化していないか（batch A X3 survivor の再発防止）
- in_progress の空集合 oracle 衝突（0 件期待 case だけにならないこと — 順22 X2 の教訓。completed 非空 case との対）
- layout + index 再構成による既存 `/stocktake` 作業画面の回帰（4b Amendment 1 の同型リスク）
- IO raw TEXT → BIZ enum 変換の fail-fast が握りつぶしになっていないか

## Spec Contract

Contract ID: SPEC-UI06C-STOCKTAKE-DETAIL-2026-08-27

- movements の `stocktake` 元記録 link は `/stocktake/records/$stocktakeId` に SPA 遷移し、65 §65.5 棚卸し列の項目を表示する（404 にしない）
- 詳細は read-only とし、取消/訂正 CTA を置かない（cancel/correct command 未実装のため §65.5 表示条件どおり非表示）
- 差異は補正 movement の quantity（確定時 live 在庫基準）を正として符号付き表示する
- in_progress 棚卸しは「進行中」label + 補正明細 0 件 + movements 0 件 + 原価の算定前表示（「—」等）を正常表示する
- stocktakeComplete / productCreate / productImport 成功時、本詳細 query は D-052 SSOT 経由で invalidate される（stocktakeCountUpdate は列レベル導出により非追加）

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| REQ-207 / TRACE-D2 | Scope 5/6（route + Page） | T10 / AC6 | click SPA 遷移証明 | PR body + Matrix |
| REQ-206 | Scope 6（表示項目） | T9 / AC3 | §65.5 棚卸し列適合 | PR body |
| REQ-206（NotFound） | Scope 2/3 | T5 / T8 / AC7 | 変換経路 | PR body |
| 差異意味論（35 §20.6a） | Scope 1 | T3 | snapshot 乖離 fixture 弁別 | Matrix |
| D-052 C23 | Scope 8 | T14 / AC10 | 導出正確さ | PR body（stocktakeStart / stocktakeCountUpdate 非追加の導出含む） |
| D-061 | Scope 2/4 | T6 / AC4 | enum 変換 | bindings diff |
| TRACE-D11 同型 | Scope 5 | T13 | returnTo fallback | Matrix |

## Data Safety

- 実棚卸しデータ、実売上・実原価データ、実 DB ファイルは commit しない
- test fixture・L3 用データは synthetic のみ（seed 商品 + synthetic 棚卸しの既存 test 慣行に従う）
- L3 手順は「backup → synthetic 商品投入 → 棚卸し開始〜確定（差異あり 1 件以上）→ 在庫変動履歴 → 棚卸し link click → 詳細確認 → returnTo 戻り → restore 復元」の再現手順を Ready 依頼と同時に PR body へ記載する（L3 fixture prep の教訓、UI-15 L3 先例の backup/restore 込み構成）
- `.local/ci-evidence/` はローカルのみ

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
