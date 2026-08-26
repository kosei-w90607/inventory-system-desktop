# Test Design Matrix: 棚卸し詳細 route + get_stocktake_record（65 slice 4c）

Plan Packet: [../2026-08-27-stocktake-record-detail.md](../2026-08-27-stocktake-record-detail.md)

## Risk

Risk: R3

## Contracts Under Test

- 20 §2.11a: IO 詳細取得（ヘッダ NotFound / item_count / 補正明細 = movement 起点 JOIN + live 基準差異 / movements filter）
- 35 §20.6a: BIZ wire DTO 構成（NotFound 変換 / StocktakeStatus 変換 fail-fast / source 補完共有 / corrected_count）
- 42 §22.5 / §22.8: CMD thin wrapper + 登録・生成義務（collect_commands + invoke_handler の 2 箇所）
- 65 §65.3 / §65.5 / §65.6.1 / §65.10 slice 4c: route・表示項目・状態正規化・in_progress 正常表示・CTA 非表示
- 66 UI-06c-D7 後続: movements link click → SPA 遷移（到達導線）
- 65 §65.5 / TRACE-D11 同型: returnTo 検索条件保持 + 不正値 fallback
- D-052 C23（予約）: stocktakeComplete / stocktakeCountUpdate の invalidation 集合変更 + 独立転記 oracle
- D-4 / 順17: query key literal 直書き 0
- Scope 5: layout + index 再構成での既存 `/stocktake` 作業画面維持

## Failure Modes

- 存在しない stocktake_id で panic / 空表示 / internal error 化（not_found に変換されない）
- 差異が snapshot 差（`system_stock - actual_count`）で表示され、棚卸し中に在庫が動いた商品で補正実績と食い違う
- 補正明細に補正のなかった商品が混入する（stocktake_items 全件表示化）/ 補正のあった商品が落ちる
- in_progress 詳細（手動 URL）が error 扱いになる / 原価が 0 円と誤表示される
- status が raw 値（in_progress 等）のまま表示される / 想定外値が握りつぶされる
- source 補完の label/route 複製 drift（inventory_service と別実装になる）
- link click が 404 のまま / href だけ正しく実遷移が壊れている
- layout + index 再構成で既存 `/stocktake` 棚卸し作業画面が描画されなくなる
- count 更新・確定後に詳細 cache が stale のまま表示され続ける（invalidation 欠落）/ 高頻度 mutation に広域 prefix が付いて無関係 query が refetch され続ける（過剰）
- returnTo に外部 URL / `//` 始まりが通る
- 既存棚卸し flow・既存 5 詳細の回帰

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- Test Name は実装時に確定するが、REQ token（REQ-206 / REQ-207）を含める既存規約に従う。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| 20 §2.11a ヘッダ NotFound | 不存在 id が Ok / panic | unit (Rust) | T1 `test_get_stocktake_record_detail_req206_not_found` | NotFound を握りつぶし空 DTO を返す実装 |
| 20 §2.11a item_count + header | 件数誤り・header 欠落 | unit (Rust) | T2 `test_get_stocktake_record_detail_req206_header_and_item_count`（corrected_count < item_count の fixture で両値を独立 assert） | COUNT を items.len() に置換する mutant |
| 20 §2.11a 補正明細 = movement 起点 + live 基準差異 + ORDER BY product_code ASC | snapshot 差への退化・全件混入・順序不定 | unit (Rust) | T3 `test_get_stocktake_record_detail_req207_correction_items_live_basis`（**弁別 fixture**: system_stock=10 のまま棚卸し中に stock_quantity を 8 へ変更し actual_count=10 で確定 → movement quantity=+2 / snapshot 差=0。snapshot 実装ではこの行が消えるか差異 0 になるため red。**非空期待が主 oracle**） | JOIN 起点を stocktake_items 全件に変える / 差異を `system_stock - actual_count` で計算する mutant |
| 20 §2.11a movements filter | voided / 他 reference 混入 | unit (Rust) | T4 `test_get_stocktake_record_detail_req207_movements_filter`（N 件 case が主 oracle + in_progress 0 件 case 併設 — 空集合 oracle 衝突の回避、順22 X2 教訓） | `is_voided=0` / `reference_type='stocktake'` filter 除去 mutant |
| 35 §20.6a NotFound 変換 | DatabaseError 化 / 文言喪失 | unit (Rust) | T5 `test_get_stocktake_record_req206_not_found_message`（「棚卸し記録が見つかりません」独立転記 oracle） | NotFound → DatabaseError に落とす mutant |
| 35 §20.6a status 変換 | raw 値素通し・想定外値握りつぶし | unit (Rust) | T6 `test_get_stocktake_record_req206_status_enum`（in_progress / completed 両値 + 手動 UPDATE で想定外値を注入し fail-fast を assert） | 変換を固定値化する / 想定外値を Completed に丸める mutant |
| 35 §20.6a source 補完 | label/route drift | unit (Rust) | T7 `test_get_stocktake_record_req207_movement_source`（label「棚卸し」/ route `/stocktake/records/{id}` の独立転記 exact oracle。production 定数非 import） | resolve_movement_source 非経由の複製・label/route 改変 mutant |
| 42 §22.5 CMD 変換 | kind 誤り | integration (Rust, production command 実呼び — 順5 規範、mock 禁止) | T8 `test_get_stocktake_record_cmd_req206_not_found_kind` | kind="not_found" 以外を返す mutant |
| 65 §65.5 表示項目 + §65.6.1 状態正規化 + CTA 非表示 | 必須項目欠落・raw status 表示・CTA 出現 | RTL | T9 `StocktakeRecordDetailPage` 表示 test（completed fixture: header/明細数/商品情報/数量単位/原価・ロス原価/movements/「完了」label + 取消/訂正 CTA 不在 assert + 商品 link は canonical 同構造） | 表示項目の脱落・label 正規化の欠落・CTA 追加 |
| 66 UI-06c-D7 到達導線 | click しても遷移しない | RTL + userEvent.click | T10 movements link click → SPA 遷移後の詳細 render assert（**href assert 単独は不可** — batch A X3 survivor 教訓） | route path 改変・layout Outlet 欠落・link 非活性化 mutant |
| NotFound UI | error が空白画面になる | RTL | T11 不存在 id での利用者向け日本語 error 表示（describeError 経由） | describeError 非経由・error 握りつぶし |
| 65 slice 4c in_progress 表示 | 進行中詳細が error 化・原価 0 円誤表示 | RTL | T12 in_progress fixture で「進行中」label + 補正明細 0 件 + movements 0 件 + 原価の算定前表示（「—」等）の正常表示 | in_progress を error 扱いにする・total_cost None を 0 表示する mutant |
| returnTo | 外部 URL 通過・条件喪失 | RTL | T13 returnTo 保持戻り + 不正値 fallback（既存 5 詳細の test pattern 踏襲） | validateSearch 除去・fallback 除去 |
| D-052 C23 oracle | invalidation 欠落・過剰 | unit (TS、独立転記 oracle、production SSOT 非 import — 既存静的 gate 継承) | T14 stocktakeComplete / stocktakeCountUpdate 新集合の順序非依存・重複検出付き完全一致 | SSOT から新規 key を削る / inventoryRecords.root() 等の余分な key を足す mutant |
| query key 直書き 0 | literal 復活 | unit (TS、既存 sweep pattern) | T15 stocktakeDetail key の literal sweep | page/hook に生 key 配列を書く実装 |
| Scope 5: 既存 `/stocktake` 作業画面の index route 描画 | layout 化で既存作業画面が描画されなくなる | RTL (runtime route test) | T16 `/stocktake` 直接進入で `StocktakePage` が従来どおり描画される回帰 test | index 移設漏れ・layout の Outlet 欠落 |

## State Lifecycle Matrix

対象 state: 詳細 query（`queryKeys.inventoryRecords.stocktakeDetail(stocktakeId)`）+ 画面表示

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 詳細 query / 画面 | 未 fetch（直接 URL 進入含む） | loading 表示（既存 5 詳細と同形） | §65.5 項目表示（T9）。in_progress は T12 の空表示 | count 更新 / 確定成功で D-052 SSOT 経由 stale 化（T14） | 再表示で in_progress → completed の状態変化を反映（T6/T12 が両端状態を固定） | returnTo 戻り→再訪で検索条件保持（T13） | アプリ再起動後も直接 URL で表示可（route 生成 AC5） | NotFound / DB error → describeError 表示（T11） | TanStack Query 既定 retry 後 error 確定（既存 5 詳細と同設定） | Matrix + PR body |

- workflow-state 行（本 packet の遷移運用）:
  - content candidate → L1 / independent review → state-only human-confirm commit（STATECAP 3/PR、correction ループ時は content commit 同乗を優先）
  - owner authorization → Draft state-only Ready commit → exact-HEAD L1 → PR body → Ready/dispatch → merge（三点一致）
  - state-only violation: file allowlist + zero-context hunk の両検査
  - hosted failure: product/gate failure は implementing へ返す。`test_revise_product_price_req105_no_op_writes_no_operation_log` の failpoint 並列 race flake（Plans.md backlog 起票済み）が再発した場合は単独実行 PASS を確認して再実行し、PR body に disposition 記録（PR #8 先例）

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| returnTo validateSearch（`z.string().max(500).optional().catch(undefined)`） | `receiving.records.$recordId.tsx` / `inventory/disposal/records/$recordId` 系 / `return.records.$recordId.tsx` / `manual-sale.records.$recordId.tsx` / `csv-import.records.$importId.tsx`（5 site） | 新 route 1 site | — | T13 |
| `queryKeys.inventoryRecords.*Detail` | receivingDetail / returnDetail / manualSaleDetail / disposalDetail / csvImportDetail（5 key） | stocktakeDetail + stocktakeDetailRoot 追加 | — | T15 |
| 詳細 Page 構造（useQuery + describeError + 戻り導線 + 商品 link） | 既存 5 RecordDetailPage | StocktakeRecordDetailPage | 取消/訂正 CTA・rollback CTA は移植しない（未実装 / 非目的） | T9 / T11 |
| 状態 label 正規化（65 §65.6.1） | CsvImportRecordDetailPage の STATUS_LABELS map | 詳細 header（進行中/完了の 2 値） | 棚卸し作業画面は status badge を持たない現況（実読確認済み）のため画面間 label drift の突合対象は本 Page のみ | T9 / T12 |
| 差異の符号付き表示（UI-10-D10 / 73 §73.6、PR #75 教訓） | 棚卸し確定結果画面の `formatListDifference` | 補正量の符号付き表示 | — | T9 |
| production command 実呼び test（順5 規範） | 既存 5 詳細の CMD test | T8 | — | T8 |
| layout + index route 構造 | `receiving` / `return` / `manual-sale` / `disposal` / `csv-import`（5 site 全列挙） | `stocktake.tsx`（layout 化）+ `stocktake/index.tsx`（新設） | — | T16 / T10 |

## Negative Paths

- missing input: stocktake_id 欠落は route param 必須のため型レベルで防止（TanStack Router）
- invalid input: 数値でない stocktakeId 文字列 → NotFound 経路（既存 5 詳細と同挙動、T11 系）
- duplicate/ambiguous input: なし（PK 単一取得）
- unknown reference: 存在しない stocktake_id → T1 / T5 / T8 / T11
- dependency missing: products / departments JOIN の欠損は canonical（既存 5 詳細）の JOIN 方針へ揃える。stocktake_items 行を欠く異常 movement は補正明細から落ち movements 節にのみ現れる（§2.11a、表示は壊れない）
- permission/write failure: read-only のため該当なし
- dry-run side effect: 該当なし（書込みなし）

## Boundary Checks

- threshold: なし（pagination なしの単一取得。補正明細は差異発生商品のみで全商品規模にならない）
- null/default: actual_count / counted_at / valuation_cost_price / total_cost / completed_at の Option 表示（in_progress では全て None — T12）
- empty/non-empty: movements 0/N（T4）、補正明細 0/N（T3 非空 / T12 空）
- min/max: adjustment_quantity は正負両方向（棚卸し補正は増減双方 — T3 fixture は正、負方向は T9 fixture に含める）
- status/policy enum: StocktakeStatus 2 値全 case + 想定外値（T6）
- wire type: StocktakeRecordDetail（AC4 bindings diff）
- internal type: StocktakeRecordDetailCore（IO）/ wire DTO（BIZ）分離
- producer/consumer: CMD → Page 単一経路
- round-trip token: 該当なし（read-only）
- precision/range: i64 原価・数量・id、JS safe integer 内
- cross-language parse: snake_case field / enum union の bindings 生成（AC4）

## Compatibility Checks

- old schema/input: schema 変更なし。既存 stocktakes 行（過去の確定済み棚卸し）がそのまま表示可能
- new schema/input: なし
- output order: 補正明細 product_code ASC（T3）
- optional field behavior: Option field の None 表示は canonical 踏襲（「—」等、T12）
- 既存 wire: `Stocktake` 型・既存 stocktake command 5 本の bindings 行が不変（AC4 で diff 追加のみを確認）

## Data Safety Checks

- source-derived data: test fixture は synthetic のみ（実棚卸し・実原価値の転記禁止）
- generated outputs: bindings.ts / routeTree.gen.ts / 90-traceability.md は生成コマンド経由のみ（手動編集禁止）
- secrets: 該当なし
- local-only files: `.local/ci-evidence/`
- synthetic sample boundaries: L3 fixture は backup → synthetic 投入 → 確認 → restore の往復（UI-15 L3 先例）。手順を PR body に記載

## Main Wiring / Integration Checks

- helper connected to main path: collect_commands + invoke_handler 登録 → bindings 生成 → `commands.getStocktakeRecord` 呼出し（AC4/AC6 で end-to-end）
- output reaches manifest/report: routeTree.gen.ts に route 生成（AC5）
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- mock 値と設計期待値の弁別: T5/T7 の文言・source oracle、T14 の invalidation oracle は独立転記 exact 比較で、production 定数を import しない（D-052 既存 gate + 順6 教訓）
- invalidate/refetch 順序: 確定 → stale → 再表示で completed へ更新（T12 + T14 の組で lifecycle を固定）
- key branch 反転: NotFound 分岐（T1/T5/T8）、is_voided filter（T4）、status 変換分岐（T6）
- threshold 変更: 該当なし
- guard 除去: validateSearch returnTo guard（T13）
- output field 省略: 表示項目（T9）、item_count/corrected_count（T2）
- 出力順序変更: T3
- JSON safe integer: 既存 wire と同等のため既存検査を継承
- 差異意味論の弁別: T3 の乖離 fixture が snapshot 実装と movement 実装を区別する（fixture 設計が oracle の核 — 単純 fixture では両実装が同値になり素通しする）

## 必須 mutation 注入（Final Review で clean tree 独立再実測、5 件級以上）

| ID | 注入 | red になるべき test |
|---|---|---|
| X1 | BIZ NotFound 変換を DatabaseError 化 | T5 / T8 |
| X2 | IO movements の `is_voided=0` filter 除去 | T4 |
| X3 | resolve_movement_source の stocktake arm の route prefix を別文字列へ改変 | T7（exact oracle）/ T10（click 遷移） |
| X4 | invalidation-contract の stocktakeComplete から新規 key 除去 | T14 |
| X5 | status 変換を固定値（常に Completed）化 | T6 / T12 |
| X6 | 補正明細の差異算出を `system_stock - actual_count` へ改変（snapshot 化） | T3（乖離 fixture により quantity 期待値が不一致で red） |
| X7 | `stocktake.tsx` layout の `<Outlet />` 除去 | T10 / T16 |

- 注入は commit 済み clean tree 上でのみ実施（未 commit 是正の消失防止 — PR #19 教訓）
- Writer の kill 主張は Final Review / Coordinator が Matrix どおりの実注入で独立再現する（順6 X3 / PR #27 X7 / 順22 X2 の教訓）

## Residual Test Gaps

- L3 視認（実表示の見た目・日本語 wording の適切さ・実 IPC 経路）は自動 test で代替不能 → Human Gate
- 実データ規模（対象商品数百件の棚卸し）での表示性能は測定しない（補正明細は差異発生商品のみに絞られる構造のため既存 5 詳細と同等と推定、`未実測`）
- 一覧 route / CSV 出力 / 印刷 / 74 許可リスト追随は後続スライスへ deferred
