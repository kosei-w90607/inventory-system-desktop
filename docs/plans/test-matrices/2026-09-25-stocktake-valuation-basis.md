# Test Design Matrix: 棚卸しの評価額に価格の基準数量と店の丸め規則を入れる

[Plan Packet](../2026-09-25-stocktake-valuation-basis.md)。設計の正本は `docs/function-design/35-biz-stocktake-service.md` §20.5a（SPEC-STK-VAL-D1〜D6）。行番号は base `85b18a04`。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-STK-VAL-D1: 価格の基準数量は在庫単位で決まる（`pcs` = 1、`cm` = 100、wildcard arm なし）
- SPEC-STK-VAL-D2: 金額は 1/100 円・円の整数で、浮動小数を使わない。中間・商品別の金額・合計は i128、最後の円額だけを i64 へ検査付きで変換する
- SPEC-STK-VAL-D3: 商品別の金額は `原価 × 数量 × 100 ÷ 基準数量` の正確な値を 1/100 円で四捨五入する
- SPEC-STK-VAL-D4: 総額は商品別の金額の合計を円未満で四捨五入した円の整数（列・DTO・表示は不変）
- SPEC-STK-VAL-D5: 負の原価・数量（`valuation_line_centi` の中の 1 か所で検査し、文言に商品コード）、i128 の × 100・合計の桁あふれ、i64 を越える円額は ValidationFailed で確定を止め、TX を ROLLBACK する。負の値を含まない入力で旧式が確定できたものは新式でも確定できる
- SPEC-STK-VAL-D6: 確定済みの値を再計算しない。個数商品だけの確定の総額は変更前と同じ
- 35 §20.5 ステップ 5〜8: `valuation_cost_price` の snapshot（基準数量あたりの値のまま）、操作ログの `total_cost`

## Failure Modes

- 長さ商品の評価額が 100 倍になる（基準数量で割らない、`Cm` を 1 にする）
- 商品別の金額を切捨てる・偶数丸めにする、最終合計を切捨てる・偶数丸めにする
- 丸めを最終合計の 1 段だけにする（商品別の丸めを飛ばす）
- 浮動小数で計算して 0.005 の境界を誤る
- 負の原価・数量で負の金額を作り、黙って保存する
- 乗算・合計・i64 への変換の桁あふれで誤った総額を保存する（wrapping、`as` の切詰め、または debug で panic）
- 中間を i64 に限り、旧式が確定できた大きな値の確定を拒む
- 個数商品の既存の総額が変わる
- 確定で error になっても、一部の明細の `valuation_cost_price` や header が書き換わったまま残る
- 旧本体が新しい関数を使わず、関数の test だけが green になる（配線漏れ）

## Test Matrix

新しい test は `src-tauri/src/biz/stocktake_service.rs` の `#[cfg(test)] mod tests` に置き、名前か本文に `REQ-205` と `SPEC-STK-VAL-Dn` を付ける。`valuation_line_centi` の第 4 引数（商品コード）は T5 以外では省略して書く。T6・T11・T12 の入力と mutant (7b)〜(7d) の red は packet の Contract Probe 4 で試作して確かめた。既存 test の実在は base で `rg -n 'fn test_complete_req205_total_cost_multiple_products|fn test_complete_req205_total_cost_overflow' src-tauri/src/biz/stocktake_service.rs` = 2 hit（`:1193`・`:1300`）で確認した。T7〜T11 は旧本体 `legacy_complete_stocktake` を一時 DB で実際に通す（mock なし）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| T1 SPEC-STK-VAL-D1 | 長さ商品を 1 個あたりとして扱う | unit | `test_valuation_req205_price_basis_by_unit` | `price_basis_quantity(ProductStockUnit::Pcs) != 1` か `price_basis_quantity(ProductStockUnit::Cm) != 100` |
| T2 SPEC-STK-VAL-D3 | 商品別の金額を切捨て・誤った四捨五入 | unit | `test_valuation_req205_line_rounds_half_up` | `valuation_line_centi(1000, 5, 12)` が `41667` でない（416.666… 円）/ `(385, 153, 100)` が `58905` でない / `(1, 1, 200)` が `1` でない（0.005 円 = 境界ちょうど）/ `(1, 1, 201)` が `0` でない（0.004975… 円）/ `(300, 5, 1)` が `150000` でない |
| T3 SPEC-STK-VAL-D4 | 総額を切捨て・偶数丸め | unit | `test_valuation_req205_total_rounds_half_up_to_yen` | `valuation_total_yen(&[58950])` が `Ok(590)`、`&[58949]` が `Ok(589)`、`&[50]` が `Ok(1)`、`&[250]` が `Ok(3)`、`&[0]` が `Ok(0)` でない（`50` と `250` は偶数丸め〈0 と 2〉と区別する） |
| T4 SPEC-STK-VAL-D3・D4 | 丸めが最終合計の 1 段だけ | unit | `test_valuation_req205_two_stage_rounding` | `valuation_line_centi(1, 1, 250)`（0.004 円）が `Ok(0)` でない、またはその 200 本を `valuation_total_yen` に渡した値が `Ok(0)` でない（合計してから丸めると 0.8 円 → 1 円） |
| T5 SPEC-STK-VAL-D5 | 負の入力で負の金額を返す | unit / negative | `test_valuation_req205_negative_input_rejected` | `valuation_line_centi(-1, 1, 1, "NEG-001")` か `(1, -1, 1, "NEG-001")` が、商品コード `NEG-001` を含む `Err(BizError::ValidationFailed(_))` でない |
| T6 SPEC-STK-VAL-D2・D5 | × 100 の桁あふれ、中間を i64 に限る | unit / negative | `test_valuation_req205_line_overflow_rejected` | `valuation_line_centi(1 << 62, 737_869_762_948_382_065, 100)` が「オーバーフロー」を含む `ValidationFailed` でない（i128 の × 100 の段で桁あふれする入力。mutant (7b) を殺す）、または `(i64::MAX, 1, 1)` が `Ok(i64::MAX × 100)`・`(i64::MAX, 1, 100)` が `Ok(i64::MAX)` でない（旧式が通る最大付近） |
| T7 SPEC-STK-VAL-D1・D4、§20.5 ステップ 5c-d・8 | 旧本体が基準数量で割らない、snapshot や操作ログが食い違う | integration | `test_complete_req205_total_cost_length_product_per_meter` | 長さ商品（`cm`、原価 385、実カウント 153）と個数商品（`pcs`、原価 300、実カウント 5）の確定で、`StocktakeResult.total_cost`・`stocktakes.total_cost`・操作ログの detail_json の `total_cost` が `2089` でない、または長さ商品の `valuation_cost_price` が `385` でない |
| T8 SPEC-STK-VAL-D4 | 保存値の総額を切捨て・偶数丸め | integration | `test_complete_req205_total_cost_rounds_half_up_at_yen` | 長さ商品（原価 1）の実カウント 50 の確定（0.50 円）の `total_cost` が `1` でない、または別の棚卸しで実カウント 49（0.49 円）の `total_cost` が `0` でない |
| T9 SPEC-STK-VAL-D6 | 個数商品の既存の総額が変わる | regression（既存） | `test_complete_req205_total_cost_multiple_products` | 期待値 `3500`（`:1207`）が変わる。期待値の行は編集しない（AC2） |
| T10 SPEC-STK-VAL-D5 | 負の原価の確定で一部が書き換わる | integration / negative | `test_complete_req205_negative_cost_rolls_back` | test 内の SQL で商品の `cost_price` を `-1` にした棚卸しの確定が `ValidationFailed`（商品コードを含む）でない、または確定後に header が `in_progress` でない・`total_cost` が NULL でない・どの明細の `valuation_cost_price` も NULL でない・商品の `stock_quantity` が確定前と違う |
| T11 SPEC-STK-VAL-D5 | i64 を越える円額 | integration / negative | `test_complete_req205_total_cost_yen_overflow` | 個数商品 2 つ（原価 `i64::MAX / 2 + 1`、実カウント 1。i128 の合計は収まり、円額 2^63 が i64 を越える）の確定が「オーバーフロー」を含む `ValidationFailed` でない、または header が `in_progress` のままでない（mutant (7d) を殺す） |
| T12 SPEC-STK-VAL-D2・D5 | 合計の桁あふれ、i64 の上限付近の丸め、旧式が確定できた値を拒む | unit / negative | `test_valuation_req205_total_bounds` | `valuation_total_yen(&[i64::MAX × 100 + 49])` が `Ok(i64::MAX)` でない、`&[i64::MAX × 100 + 50]` が「オーバーフロー」の `ValidationFailed` でない（mutant (7d) を殺す）、`&[]` が `Ok(0)` でない、`&[valuation_line_centi(92_233_720_368_547_759, 1, 1)]` が `Ok(92_233_720_368_547_759)` でない（pcs で旧式と一致）、または原価 `1 << 60`・数量 `983_826_350_597_842_753`・basis 1 の行 3 本が「オーバーフロー」の `ValidationFailed` でない（合計の i128 の桁あふれ。2 本では wrap が負になり変換の error に紛れるため 3 本。mutant (7c) を殺す） |

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
| レジの数量 × 単価の照合 | `ej_parser.rs:502` | なし | レジの数量（1 = 1 m で打てる、未運用）と単価の照合で、在庫単位の基準数量とは別 | Impact Review Lenses |
| 手動販売の金額の初期値 `amount = selling_price`（数量 1 ごとに売価を足す） | `62-ui-manual-sale.md:26` UI-04-D6、`src/features/manual-sale/lib/manual-sale-row-utils.ts:24,40` | なし | 棚卸しの評価額ではない。長さ商品を数量 1（= 1 cm）で足すと 1 m 分の金額が入る。本 lane の前から同じで悪化しない。master-tables の既知の不整合に置き、closeout で Backlog へ（Q3 の 4 項目の隣） | master-tables 価格の基準数量の設計意図、35 §20.5a「範囲の外」 |
| 円の整数の表示 `formatYen` | `src/features/inventory-records/types.ts:109`、`StocktakePage.tsx:107,995,1010`、`StocktakeRecordDetailPage.tsx:149` | なし（総額は円の整数のまま） | 表示の変更が無い | AC9 / AC10 |

## Negative Paths

- missing input: `valuation_total_yen` に 0 行を渡した値は 0（T12。旧本体では start が 0 件を拒否し〈`stocktake_service.rs:364`〉、商品の削除も無いため到達しない）
- invalid input: 負の原価・数量（T5 / T10）
- duplicate/ambiguous input: 該当なし（明細は商品ごとに 1 件、既存）
- unknown reference: 商品が無い明細は既存の NotFound（変更なし）
- dependency missing: 該当なし
- permission/write failure: DB 書込みの失敗は既存の DatabaseError と ROLLBACK（変更なし）
- dry-run side effect: 該当なし

## Boundary Checks

- threshold: 1/100 円の四捨五入の境界（0.005 円ちょうど → 1、0.004975… → 0、T2）、円の境界（0.50 → 1、0.49 → 0、T3 / T8）
- null/default: `valuation_cost_price` は確定前 NULL、error 時も NULL（T10）
- empty/non-empty: 0 行で `Ok(0)`（T12）
- min/max: 数量 0 で金額 0（`valuation_line_centi(385, 0, 100)` = 0 を T2 に含めてよい）、i128 の × 100・合計の上端（T6 / T12）、円額の i64 の上端（T11 / T12、既存の overflow test）
- status/policy enum: `ProductStockUnit` の全 variant（T1）
- wire type: `total_cost` は i64 / INTEGER のまま（AC9）
- internal type: 中間・商品別の金額・合計は 1/100 円の i128、円額は i64（非公開）
- producer/consumer: 旧本体 → `complete_stocktake` → DB → 読取り（T7）
- round-trip token: 該当なし
- precision/range: 浮動小数なし（AC3）。現実の worst case の総額は JS の safe integer を越えないが、i64 の成功値は越えうる（packet Boundary / Wire Contract、Residual Test Gaps）
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

実注入の一覧は packet AC4 の (1)〜(5)・(7b)〜(7d)。

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant?: mock は使わない。T7 は長さ商品の原価 385 と数量 153 から 589.05 円を出させ、`Cm` を 1 にする mutant（AC4 (1)）では 60,405 円になって FAIL する
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct?: 該当なし（画面の cache を変えない）。確定後の値の不変は既存の読取り test と D6
- If a key branch is inverted, which test fails?: 四捨五入の条件 `2r >= basis` を `2r > basis` にすると T2 の `(1, 1, 200)` が FAIL。総額の `r >= 50` を `r > 50` にすると T3 の `50` と T8 が FAIL
- If a threshold comparison changes, which test fails?: 同上
- If a guard is removed, which test fails?: 負の検査 → T5 / T10、× 100 の checked → T6、合計の checked_add → T12、i64 への変換 → T11・T12・既存の overflow test
- If an output field is omitted, which test fails?: 操作ログの `total_cost` → T7 と既存 `test_complete_req205_operation_log`
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? The accepted design must keep current exact-HEAD evidence in PR metadata.: 該当なし（packet に HEAD を書かない）
- If output order changes, which test fails?: 該当なし（合計は順序に依らない）
- If dry-run performs a side effect, which test fails?: 該当なし
- If a JSON number crosses JavaScript safe integer range, which test fails?: 本 lane には無い（wire・画面を変えない）。i64 の成功値は safe integer を越えうるため ⑤ で扱う（Residual Test Gaps）
- If a state token is round-tripped through browser/client code, which test fails?: 該当なし

## Residual Test Gaps

- 丸めを最終合計の 1 段だけにする mutant を旧本体の確定経路（T7 / T8）で殺す入力は、今ある単位（基準数量 1 と 100）には無い。商品別の金額が必ず 1/100 円で割り切れるためで、観測できない mutant として固定の AC にしない。2 段の丸めは関数の形（`valuation_line_centi` が丸めた値を返し、`valuation_total_yen` が合計を受ける）と T4（合成の基準数量 250）で守る。
- 新方式の確定（㉘ の後続 lane）が §20.5a の関数を呼ぶことは本 lane では test できない。35 の設計に書き、後続 lane の Contract Coverage Ledger で確かめる。
- 店の手計算との突合（実際の年末の棚卸し）は本番開始後。本 lane では合成の例（packet Ordinary Operation）で式を確かめる。
- 商品別の金額の第 1 段（原価 × 数量）の桁あふれ検査を外す mutant (7a) は殺せない。i64 の積は i128 に必ず収まるため、第 1 段は plain の `*` として検査を置かない。関数の形（引数が i64 で中間が i128）と comment で守る。
- i64 の円額を JS の `number` へ渡すと、safe integer（2^53）を越える成功値で精度が落ちる。入力例: `cm` 原価 `100000000000000001` 円/m・数量 `100` cm は新式で保存でき、JS の `number` では 1 円ずれる。本 lane は wire・画面を変えず、関数の契約（i64 の範囲）も変えない。⑤ で `total_cost` を wire・表示まで正確に扱い（十進文字列等）、この入力を確かめる（packet Design Readiness の ⑤ への申し送り、closeout で Backlog へ）。
