# Test Design Matrix: 棚卸しの評価額に価格の基準数量と店の丸め規則を入れる

[Plan Packet](../2026-09-25-stocktake-valuation-basis.md)。設計の正本は `docs/function-design/35-biz-stocktake-service.md` §20.5a（SPEC-STK-VAL-D1〜D6）。行番号は base `85b18a04`。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-STK-VAL-D1: 価格の基準数量は在庫単位で決まる（`pcs` = 1、`cm` = 100、wildcard arm なし）
- SPEC-STK-VAL-D2: 金額は 1/100 円・円の整数で、浮動小数を使わない
- SPEC-STK-VAL-D3: 商品別の金額は `原価 × 数量 × 100 ÷ 基準数量` の正確な値を 1/100 円で四捨五入する
- SPEC-STK-VAL-D4: 総額は商品別の金額の合計を円未満で四捨五入した円の整数（列・DTO・表示は不変）
- SPEC-STK-VAL-D5: 負の原価・数量、i64 の桁あふれは ValidationFailed で確定を止め、TX を ROLLBACK する
- SPEC-STK-VAL-D6: 確定済みの値を再計算しない。個数商品だけの確定の総額は変更前と同じ
- 35 §20.5 ステップ 5〜8: `valuation_cost_price` の snapshot（基準数量あたりの値のまま）、操作ログの `total_cost`

## Failure Modes

- 長さ商品の評価額が 100 倍になる（基準数量で割らない、`Cm` を 1 にする）
- 商品別の金額を切捨てる・偶数丸めにする、最終合計を切捨てる・偶数丸めにする
- 丸めを最終合計の 1 段だけにする（商品別の丸めを飛ばす）
- 浮動小数で計算して 0.005 の境界を誤る
- 負の原価・数量で負の金額を作り、黙って保存する
- 乗算・合計の桁あふれで誤った総額を保存する（wrapping、または debug で panic）
- 個数商品の既存の総額が変わる
- 確定で error になっても、一部の明細の `valuation_cost_price` や header が書き換わったまま残る
- 旧本体が新しい関数を使わず、関数の test だけが green になる（配線漏れ）

## Test Matrix

新しい test は `src-tauri/src/biz/stocktake_service.rs` の `#[cfg(test)] mod tests` に置き、名前か本文に `REQ-205` と `SPEC-STK-VAL-Dn` を付ける。既存 test の実在は base で `rg -n 'fn test_complete_req205_total_cost_multiple_products|fn test_complete_req205_total_cost_overflow' src-tauri/src/biz/stocktake_service.rs` = 2 hit（`:1193`・`:1300`）で確認した。T7〜T11 は旧本体 `legacy_complete_stocktake` を一時 DB で実際に通す（mock なし）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| T1 SPEC-STK-VAL-D1 | 長さ商品を 1 個あたりとして扱う | unit | `test_valuation_req205_price_basis_by_unit` | `price_basis_quantity(ProductStockUnit::Pcs) != 1` か `price_basis_quantity(ProductStockUnit::Cm) != 100` |
| T2 SPEC-STK-VAL-D3 | 商品別の金額を切捨て・誤った四捨五入 | unit | `test_valuation_req205_line_rounds_half_up` | `valuation_line_centi(1000, 5, 12)` が `41667` でない（416.666… 円）/ `(385, 153, 100)` が `58905` でない / `(1, 1, 200)` が `1` でない（0.005 円 = 境界ちょうど）/ `(1, 1, 201)` が `0` でない（0.004975… 円）/ `(300, 5, 1)` が `150000` でない |
| T3 SPEC-STK-VAL-D4 | 総額を切捨て・偶数丸め | unit | `test_valuation_req205_total_rounds_half_up_to_yen` | `valuation_total_yen(58950)` が `590`、`(58949)` が `589`、`(50)` が `1`、`(150)` が `2`、`(0)` が `0` でない（`50` と `150` は偶数丸めと区別する） |
| T4 SPEC-STK-VAL-D3・D4 | 丸めが最終合計の 1 段だけ | unit | `test_valuation_req205_two_stage_rounding` | `valuation_line_centi(1, 1, 250)`（0.004 円）が `0` でない、または 200 本の合計を `valuation_total_yen` に通した値が `0` でない（合計してから丸めると 0.8 円 → 1 円） |
| T5 SPEC-STK-VAL-D5 | 負の入力で負の金額を返す | unit / negative | `test_valuation_req205_negative_input_rejected` | `valuation_line_centi(-1, 1, 1)` か `(1, -1, 1)` が `Err(BizError::ValidationFailed(_))` でない |
| T6 SPEC-STK-VAL-D5 | 乗算の桁あふれ | unit / negative | `test_valuation_req205_line_overflow_rejected` | `valuation_line_centi(i64::MAX / 100 + 1, 1, 1)` が「オーバーフロー」を含む `ValidationFailed` でない（× 100 の段で桁あふれする入力） |
| T7 SPEC-STK-VAL-D1・D4、§20.5 ステップ 5c-d・8 | 旧本体が基準数量で割らない、snapshot や操作ログが食い違う | integration | `test_complete_req205_total_cost_length_product_per_meter` | 長さ商品（`cm`、原価 385、実カウント 153）と個数商品（`pcs`、原価 300、実カウント 5）の確定で、`StocktakeResult.total_cost`・`stocktakes.total_cost`・操作ログの detail_json の `total_cost` が `2089` でない、または長さ商品の `valuation_cost_price` が `385` でない |
| T8 SPEC-STK-VAL-D4 | 保存値の総額を切捨て・偶数丸め | integration | `test_complete_req205_total_cost_rounds_half_up_at_yen` | 長さ商品（原価 1）の実カウント 50 の確定（0.50 円）の `total_cost` が `1` でない、または別の棚卸しで実カウント 49（0.49 円）の `total_cost` が `0` でない |
| T9 SPEC-STK-VAL-D6 | 個数商品の既存の総額が変わる | regression（既存） | `test_complete_req205_total_cost_multiple_products` | 期待値 `3500`（`:1207`）が変わる。期待値の行は編集しない（AC2） |
| T10 SPEC-STK-VAL-D5 | 負の原価の確定で一部が書き換わる | integration / negative | `test_complete_req205_negative_cost_rolls_back` | test 内の SQL で商品の `cost_price` を `-1` にした棚卸しの確定が `ValidationFailed`（商品コードを含む）でない、または確定後に header が `in_progress` でない・`total_cost` が NULL でない・どの明細の `valuation_cost_price` も NULL でない・商品の `stock_quantity` が確定前と違う |
| T11 SPEC-STK-VAL-D5 | 合計の桁あふれ | integration / negative | `test_complete_req205_total_cost_sum_overflow` | 個数商品 2 つ（原価 `i64::MAX / 200 + 1`、実カウント 1。商品別の金額はそれぞれ i64 に収まり、合計が越える）の確定が「オーバーフロー」を含む `ValidationFailed` でない、または header が `in_progress` のままでない |

## State Lifecycle Matrix

確定の 1 TX の中で閉じる。画面・cache・route の状態は変えない。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `stocktakes.total_cost` | NULL（in_progress） | 確定の TX 内で 1/100 円を積算 | 店の規則の円の整数を保存（T7 / T8） | 該当なし（確定後は不変、D6） | 既存の読取りが保存値を返す | 既存の記録詳細・前回サマリ（変更なし） | 保存値のまま | ValidationFailed で NULL のまま（T10 / T11） | 原因のデータを直して同じ確定を呼ぶ（既存と同じ） | T7 / T8 / T10 / T11 |
| `stocktake_items.valuation_cost_price` | NULL | TX 内で確定時の原価を書く | 基準数量あたりの原価のまま（T7 の 385） | 該当なし | 既存 | 既存 | 保存値のまま | ROLLBACK で NULL（T10） | 同上 | T7 / T10 |

## Adjacent Pattern Audit

「原価（価格）× 在庫数量」で金額を出す箇所を全て調べた。command: `rg -n '\* *(ri|di|ms|mi|si|p)?\.?(cost_price|selling_price|unit_price)|(cost_price|selling_price|unit_price) *\*|checked_mul' src-tauri/src` と `rg -n 'cost_price|costPrice|line_cost|lineLossCost|valuation_cost_price' src --glob '!src/lib/bindings.ts' --glob '!*.test.*'`（base で実行）。

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 棚卸しの評価額 `原価 × 数量` | `stocktake_service.rs:504-520`（旧本体）、35「確定・legacyの取消の保留」の新方式の式 | 旧本体（S1）、新方式の式（設計、本 plan-first commit） | なし | T7〜T11、AC8 |
| 入庫の原価小計 `ri.quantity * ri.cost_price` | `receiving_repo.rs:229`（小計）・`:250`（合計）、表示 `ReceivingRecordDetailPage.tsx:122,163` | なし | 仕入れ伝票の端数の規則が店に未確認で、棚卸しの規則を流用できない（packet Q3 (a)）。本 lane の前から同じ誤りで悪化しない | 35 §20.5a「範囲の外」、master-tables の設計意図 |
| 廃棄のロス原価 `di.quantity * di.cost_price` | `disposal_repo.rs:647`、入力画面の合計 `src/features/disposal/lib/disposal-request.ts:40`、表示 `DisposalRecordDetailPage.tsx:169` | なし | 同上（Q3 (b)） | 同上 |
| 棚卸し記録詳細のロス原価 `|補正差異| × 評価原価` | `StocktakeRecordDetailPage.tsx:181-183`（画面が計算） | なし | 記録詳細を作り直す ⑤ で BIZ から返す形にする。⑤ までは新しい確定が起きない（Q3 (c)） | 同上 |
| 売上金額 `selling_price * quantity` | `seed_demo.rs:469`（demo の売上の生成） | なし | demo data の生成だけで業務規則ではない。長さ商品の demo 売上金額は 100 倍になるが、demo 専用 | Non-scope |
| レジの数量 × 単価の照合 | `ej_parser.rs:502` | なし | レジの数量（1 = 1 m）と単価の照合で、在庫単位の基準数量とは別 | Impact Review Lenses |
| 円の整数の表示 `formatYen` | `src/features/inventory-records/types.ts:109`、`StocktakePage.tsx:107,995,1010`、`StocktakeRecordDetailPage.tsx:149` | なし（総額は円の整数のまま） | 表示の変更が無い | AC9 / AC10 |

## Negative Paths

- missing input: 明細 0 件の確定は総額 0（T3 の `0` → `0`。旧本体の既存の挙動）
- invalid input: 負の原価・数量（T5 / T10）
- duplicate/ambiguous input: 該当なし（明細は商品ごとに 1 件、既存）
- unknown reference: 商品が無い明細は既存の NotFound（変更なし）
- dependency missing: 該当なし
- permission/write failure: DB 書込みの失敗は既存の DatabaseError と ROLLBACK（変更なし）
- dry-run side effect: 該当なし

## Boundary Checks

- threshold: 1/100 円の四捨五入の境界（0.005 円ちょうど → 1、0.004975… → 0、T2）、円の境界（0.50 → 1、0.49 → 0、T3 / T8）
- null/default: `valuation_cost_price` は確定前 NULL、error 時も NULL（T10）
- empty/non-empty: 明細 0 件で総額 0（T3）
- min/max: 数量 0 で金額 0（`valuation_line_centi(385, 0, 100)` = 0 を T2 に含めてよい）、i64 の上端（T6 / T11、既存の overflow test）
- status/policy enum: `ProductStockUnit` の全 variant（T1）
- wire type: `total_cost` は i64 / INTEGER のまま（AC9）
- internal type: 1/100 円の i64（非公開）
- producer/consumer: 旧本体 → `complete_stocktake` → DB → 読取り（T7）
- round-trip token: 該当なし
- precision/range: 浮動小数なし（AC3）。worst case の総額は JS の safe integer を越えない（packet Boundary / Wire Contract）
- cross-language parse: 該当なし（bindings 不変）

## Compatibility Checks

- old schema/input: schema 不変。既存の完了済み記録の `total_cost` は読むだけで再計算しない（D6）
- new schema/input: 該当なし
- output order: 該当なし
- optional field behavior: 該当なし

## Data Safety Checks

- source-derived data: 使わない（価格・数量は合成値）
- generated outputs: `docs/function-design/90-traceability.md`（test の一覧だけ、店のデータを含まない）
- secrets: なし
- local-only files: `.local/ci-evidence/`（local-ci の出力、commit しない）
- synthetic sample boundaries: test の一時 DB だけ

## Main Wiring / Integration Checks

- helper connected to main path: 3 関数は旧本体の確定から呼ぶ（T7 が基準数量、T8 が総額の丸め、T10 / T11 が error の経路を旧本体で確かめる）。新方式の確定への配線は ㉘ の後続 lane（35 に明記）
- output reaches manifest/report: `stocktakes.total_cost` と操作ログの detail_json（T7）
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

実注入の一覧は packet AC4 の (1)〜(7)。

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant?: mock は使わない。T7 は長さ商品の原価 385 と数量 153 から 589.05 円を出させ、`Cm` を 1 にする mutant（AC4 (1)）では 60,405 円になって FAIL する
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct?: 該当なし（画面の cache を変えない）。確定後の値の不変は既存の読取り test と D6
- If a key branch is inverted, which test fails?: 四捨五入の条件 `2r >= basis` を `2r > basis` にすると T2 の `(1, 1, 200)` が FAIL。総額の `r >= 50` を `r > 50` にすると T3 の `50` と T8 が FAIL
- If a threshold comparison changes, which test fails?: 同上
- If a guard is removed, which test fails?: 負の検査 → T5 / T10、乗算の checked → T6 と既存の overflow test、合計の checked_add → T11
- If an output field is omitted, which test fails?: 操作ログの `total_cost` → T7 と既存 `test_complete_req205_operation_log`
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? The accepted design must keep current exact-HEAD evidence in PR metadata.: 該当なし（packet に HEAD を書かない）
- If output order changes, which test fails?: 該当なし（合計は順序に依らない）
- If dry-run performs a side effect, which test fails?: 該当なし
- If a JSON number crosses JavaScript safe integer range, which test fails?: 該当なし（型・範囲は不変。worst case は safe integer 未満）
- If a state token is round-tripped through browser/client code, which test fails?: 該当なし

## Residual Test Gaps

- 丸めを最終合計の 1 段だけにする mutant を旧本体の確定経路（T7 / T8）で殺す入力は、今ある単位（基準数量 1 と 100）には無い。商品別の金額が必ず 1/100 円で割り切れるためで、観測できない mutant として固定の AC にしない。2 段の丸めは関数の形（`valuation_line_centi` が丸めた値を返し、`valuation_total_yen` が合計を受ける）と T4（合成の基準数量 250）で守る。
- 新方式の確定（㉘ の後続 lane）が §20.5a の関数を呼ぶことは本 lane では test できない。35 の設計に書き、後続 lane の Contract Coverage Ledger で確かめる。
- 店の手計算との突合（実際の年末の棚卸し）は本番開始後。本 lane では合成の例（packet Ordinary Operation）で式を確かめる。
