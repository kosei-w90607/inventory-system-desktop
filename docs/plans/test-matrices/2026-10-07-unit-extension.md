# Test Design Matrix: 単位の拡張と、原価 × 数量の価格の基準数量

Plan Packet: [2026-10-07-unit-extension](../2026-10-07-unit-extension.md)。本 lane は docs だけで、下の test は後続の runtime の lane（U = 単位、C = 原価、P = Z004・EJ）が実装する。契約の正本は [共通規則](../../function-design/10-common-rules.md) SPEC-UNIT-D1〜D11 と [22](../../function-design/22-mnt-migration.md) §16。oracle の値は正本の例と店の事実（台帳の番号）から独立に写し、実装の出力から作らない。

## Risk

Risk: R4

## Contracts Under Test

- SPEC-UNIT-D1 単位の 12 個の code と、数量の種類・価格の基準数量の導出（U）
- SPEC-UNIT-D2・D3 在庫の数量は整数（長さは cm）、m の入力と表示（U）
- SPEC-UNIT-D4 レジの数量 1 = 価格の基準数量、PLU の単価は売価のまま（U、回帰）
- SPEC-UNIT-D5 原価の 1/100 円の入力・保存・表示（C）
- SPEC-UNIT-D6 原価 × 数量の行と合計の丸め（U。C の後は 1/100 円の原価で）
- SPEC-UNIT-D7・UI-04-D18 手動販売の金額の初期値と、数量に合わせた求め直し（U）
- SPEC-UNIT-D8 POS の数量の 100 倍の整数と BIZ の換算（P）
- SPEC-UNIT-D9 TS の twin と Rust の関数の golden の一致、formatter の網羅（U）
- SPEC-UNIT-D10 在庫少の種類の分岐、商品 CSV の `在庫単位` の正規化（U）
- SPEC-UNIT-D11 wire の `stock_unit` の enum、`StocktakeItemDetail.stock_unit`（U）
- MNT-03-D13 migration vU（表の作り直し）・vC（改名と 100 倍）と回復（U・C）

## Failure Modes

- 浮動小数を通して `0.29` m が 28 cm になる、表示した `1.3 m` を保存し直して 127 cm が 130 cm になる。
- 長さの商品の金額を基準数量で割らず 100 倍になる（入庫・廃棄・棚卸し記録詳細・手動販売）。
- 行ごとの丸めと合計の丸めが場所ごとに違い、同じ明細から違う金額が出る。
- 新しい個数の単位（`ball` 等）が在庫少の SQL のどちらの分岐にも入らず、在庫少に出ない。
- formatter の `default` が新しい単位を `—` で出す。
- vU で products の行・列・index・FK が欠ける、vC で原価の値が 100 倍にならない・二重に 100 倍になる・REAL になる。
- 原価の改名の後も古い名前の SQL・画面が残り、円と 1/100 円を取り違える。
- POS の個数の商品で `1.3` を丸めて在庫を 1 減らす、長さの商品の `1.3` を 1.3 cm として減らす。
- 商品 CSV の `玉` が取込み全体を止める（今の DB CHECK の挙動）。

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPEC-UNIT-D1 | 単位を足して種類・基準数量を決め忘れる | unit（Rust） | `unit_amount` の `stock_unit_kind`・`price_basis_quantity` の 12 個の表 | 12 個の code のどれかの種類か基準数量が正本の表と違う。match に wildcard を置いた（compile は通るが表の test が落ちる） |
| SPEC-UNIT-D1・D11 | wire の文字列と enum の対がずれる | unit（Rust） | `finite_enum_contract_tests.rs` の対の表・`rejects!`・`parity!` を 12 個に | 1 つでも as_str と serde の値が違う、一覧に無い `kg` を受ける |
| SPEC-UNIT-D3 | m の文字列 → cm の誤り | unit（TS） | m の入力の純関数: `1.3`→130、`1.27`→127、`2`→200、`0.01`→1、`0.29`→29、`1.300`・`1e2`・`-1`・`.5`・空 → error | 浮動小数で掛けた（`0.29`→28）、3 桁目を丸めた、符号を受けた |
| SPEC-UNIT-D3 | cm → m の表示の誤り | unit（TS） | formatter: 130→`1.3 m`、127→`1.27 m`、200→`2 m`、-30→`-0.3 m`、123456→`1,234.56 m`、`cm` の 130→`130 cm`、`ball` の 3→`3 玉` | 小数 1 桁に丸めた、末尾の 0 を残した、負の値の符号を落とした |
| SPEC-UNIT-D6 | 基準数量で割らない・丸めの誤り | unit（Rust） | `cost_line_centi`・`cost_total_yen`: 333×250÷100（円の原価は ×100）→ 83250・合計 833、333×50÷100 → 16650・合計 167、8333×36÷1 → 299988・合計 3000、境界 `2r = basis`（1×1÷200 → 1）と `2r < basis`（1×1÷201 → 0） | 割らない（100 倍）、四捨五入を切り捨てにした、合計を行ごとに円へ丸めてから足した |
| SPEC-UNIT-D6 | 今の評価額の値が変わる | unit（Rust、回帰） | 今の `stocktake_service.rs:1402`〜`:1482` の test を `unit_amount` へ移して同じ期待で回す | 関数を移すときに値・境界・overflow の扱いを変えた |
| SPEC-UNIT-D6 | IO が金額を計算し続ける | integration（Rust） | 入庫・廃棄の記録詳細: 長さの商品 2.5 m・原価 333 → 行 83250（1/100 円）・合計 833、個数の商品は今と同じ値 | `receiving_repo.rs:229` の `quantity * cost_price` が残る（長さで 100 倍） |
| SPEC-UNIT-D6・D9 | 廃棄の入力画面の合計が BIZ と違う | unit（TS） | 廃棄の合計の twin を golden の表で（Rust と同じ例を独立に写す） | twin の丸めが BIZ と違う |
| SPEC-UNIT-D7・UI-04-D18 | 手動販売の金額が 100 倍・数量に追従しない | unit（TS）+ RTL | m の商品を追加 → 数量 `1`・金額 700、数量 `1.3` → 金額 910、金額を 800 に直した後に数量 `2` → 金額 800 のまま、個数の商品の再追加 → 数量 +1・金額 + 売価、payload の数量は 130 | 初期値が `String(selling_price)` のまま長さで 100 倍、編集後も上書きする、payload に m の数を送る |
| SPEC-UNIT-D7 | 割り切れない金額の丸め | unit（TS・Rust） | `sale_amount_yen`: 333×130÷100 = 432.9 → 433（J4 の推奨。J4 が切り上げなら 433、割り切れる 333×100÷100 = 333 は両案で同じ）、333×125÷100 = 416.25 → 416（切り上げなら 417） | 丸めの向きを J4 の決定と違えた |
| SPEC-UNIT-D10 | 在庫少から単位が漏れる | integration（Rust） | `list_low_stock`: `ball` 2 個（一般の基準 3）→ 出る、`m` 400 cm（生地の基準 500）→ 出る、全 variant が一般か生地のどちらかに入る | SQL が `'pcs'` / `'cm'` のまま、並びを手で書いて 1 つ落とした |
| SPEC-UNIT-D10・BIZ-01-D8 | 商品 CSV の単位の語 | unit（Rust） | preview: `玉`→`ball`、` m `→`m`、`pcs`→`pcs`、空→None（INSERT で `pcs`）、`kg`→行の error で他の行は valid | 表示の語を受けない、`kg` で取込み全体が止まる（今の `product_service.rs:3324` の期待を契約に合わせて書き換える） |
| SPEC-UNIT-D11 | `stock_unit` が string のまま | type check（TS） | `npm run typecheck`（formatter の param が `ProductStockUnit`） | 記録詳細の 6 型か行の型が `string` のまま |
| SPEC-UNIT-D4 | PLU の単価が変わる | unit（Rust、回帰） | 既存の PLU の formatter の test（単価 = 売価） | 長さの商品の単価を基準数量で割った・掛けた |
| SPEC-UNIT-D5 | 原価の文字列 → 1/100 円の誤り | unit（TS） | `83.33`→8333、`1000`→100000、`0.5`→50、`83.333`・`-1`・`9007199254740991` を超える値 → error | 浮動小数で掛けた、3 桁目を丸めた |
| SPEC-UNIT-D5 | 原価の表示 | unit（TS） | 8333→`83.33 円`、100000→`1,000 円`、50→`0.50 円` | 円の整数を `.00` 付きで出す、1/100 円の値を円として出す |
| SPEC-UNIT-D5・BIZ-01-D8 | 原価の上限・負 | unit（Rust） | create・update・revise・CSV: 0 と上限は受け、-1 と上限 + 1 は `ValidationFailed` | 上限の検査を落とした |
| MNT-03-D13 vU | 作り直しで行・列・index・FK が欠ける | integration（Rust、migration） | 前の版の DB（`pcs`・`cm`・負の在庫・discontinued の行、全列に値）→ vU → 全列の値・行数・3 つの index・`foreign_key_check` 0 行が同じ、`ball` を INSERT できる、`kg` は CHECK で拒む、手順 6 の失敗で表・版が戻り `foreign_keys` が元の値 | 列を写し落とした、index を作り直さない、foreign_keys を戻さない |
| MNT-03-D13 vC | 原価の変換の誤り | integration（Rust、migration） | 6 列に 0・正・負・NULL（`valuation_cost_price` だけ）・範囲の境界（`i64::MAX / 100`）→ vC → 100 倍・NULL のまま・`typeof` integer。範囲外の 1 行で何も変わらず版を記録しない。行 0 の表で成功。再実行で 2 度 100 倍にしない | 範囲検査を落とした（REAL になる）、NULL を 0 にした、版を 2 度適用した |
| SPEC-UNIT-D8 | POS の数量の換算 | unit（Rust） | parser: `3`→300、`1.3`→130、`1.30`→130、`1,234.5`→123450、`-1.3`→-130、`1.300`・`1e2`・空 → InvalidNumber。BIZ: 個数の商品 300→3、130→在庫に効かせず示す、100→1。長さの商品 130→130 cm | 個数で 130 を 1 に丸めた、長さで 130 を 1 cm にした、IO が商品を引いた |
| SPEC-UNIT-D8 | EJ の照合 | unit（Rust） | 数量 130・単価 333 → 金額 433 で照合が通る、432 で通らない | 小数の数量で `quantity × unit_price` を i64 のまま比べた |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| DB の版（vU・vC） | 前の版 | 起動時の migrate の TX | 新しい版、値は vC で 100 倍 | — | — | 旧版のアプリで開くと `SchemaNewerThanApp` | 再起動で再適用しない | 何も変えず版も記録しない | 原因を直して再起動 | 22 §16 の test |
| 手動販売の行の金額 | 追加時に式で | 数量を編集中 | 保存 | 金額を編集したら追従を止める | — | 同じ商品の再追加 | フォームのリセットで初期化 | 入力の error | 直して再送（idempotency は UI-04-D10） | UI-04-D18 の RTL |
| m の入力欄 | 空か初期値 | 入力中の文字列 | 整数（cm）で送る | 単位の違う商品へ行を替えない（行は商品ごと） | — | 保存結果の表示は BIZ の値 | — | 入力の error（文は SPEC-UNIT-D3） | 直して再送 | TS の純関数の test |
| 商品 CSV の preview | ファイル選択 | preview | 正規化した code で commit | — | — | — | — | 行の error（不正な単位） | ファイルを直して選び直す | BIZ-01-D8 の test |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 価格の基準数量で割る（SPEC-STK-VAL-D1・D3） | `rg -n "quantity \* cost_price\|quantity \* costPrice\|\* item.valuation_cost_price" src src-tauri/src`（2026-10-07: `receiving_repo.rs:229`、`disposal_repo.rs:647`、`disposal-request.ts:40`、`StocktakeRecordDetailPage.tsx:183`）と手動販売の `manual-sale-row-utils.ts:24`・`:40` | 入庫・廃棄（IO → BIZ）、廃棄の入力画面（twin）、手動販売（twin） | 棚卸し記録詳細のロス原価は U か棚卸し ⑤ が起票時に決める（申し送り） | 上の SPEC-UNIT-D6・D7 の行 |
| `stock_unit` の 2 値の分岐 | `rg -n "'cm'\|\"cm\"\|Cm\b" src-tauri/src`、`rg -n "\"cm\"\|'cm'" src --glob '!*.test.*'`（在庫少の SQL、seed、formatter、商品フォームの写像・提案） | 全部（申し送りの表） | `schema_v1.rs:40` の CHECK は migration の履歴として書き換えない | SPEC-UNIT-D1・D10 の行 |
| 浮動小数を通さない 100 倍の整数（D-104） | `io/daily_report_parser.rs:535` | Z004・EJ の数量（P） | 日報の wire の `f64`（表示用）は変えない | SPEC-UNIT-D8 の行 |
| 意図的な二重実装と golden（BIZ-01-D2） | `30-biz-product-service.md` BIZ-01-D2 | 金額の twin、m の換算の twin | — | SPEC-UNIT-D9 の行 |

## Negative Paths

- missing input: m・原価の欄が空 → 入力の error。商品 CSV の `在庫単位` が空 → `pcs`。
- invalid input: m の小数 3 桁・指数・符号、原価の小数 3 桁・上限超え、商品 CSV の `kg`、POS の `1.300`。
- duplicate/ambiguous input: 同じ商品の手動販売の再追加（UI-04-D6 のまま）。
- unknown reference: DB に一覧に無い単位の行 → repo の読取りの error。
- dependency missing: vU の前に時点証拠の migration が products に列を足していた → vU はその列も写す（22 §16 手順 3）。
- permission/write failure: migration の途中の失敗 → 何も変えない。
- dry-run side effect: 商品 CSV の preview は DB を変えない（今どおり）。

## Boundary Checks

- threshold: 丸めの境界 `2r = basis`（切り上げ）と `2r < basis`（切り捨て）、合計の `r = 50`。
- null/default: `valuation_cost_price` の NULL は vC の後も NULL。CSV の空の単位は `pcs`。
- empty/non-empty: 明細 0 行の記録詳細の合計 0。
- min/max: m の最小 0.01（1 cm）、原価の上限 `9007199254740991`、vC の範囲 `i64::MAX / 100`。
- status/policy enum: `ProductStockUnit` の 12 値。
- wire type: 数量は整数、原価・行の金額は 1/100 円の整数、合計は円の整数。
- internal type: i128 の中間、`quantity_hundredths: i64`。
- producer/consumer: BIZ が金額を返し、UI は保存済みの値を計算しない。
- round-trip token: 127 cm → `1.27 m` → 入力欄に戻しても 127（表示の文字列を保存し直さない）。
- precision/range: 長さ 1 cm、原価 1/100 円。
- cross-language parse: Rust の金額の関数と TS の twin を同じ golden の表で。

## Compatibility Checks

- old schema/input: 前の版の DB を vU・vC で移す。旧版のアプリは新しい DB を開かない。操作ログの `cost_price`（円）の記録を書き換えない。
- new schema/input: 12 個の code、`_centi` の列。
- output order: 変えない。
- optional field behavior: `StocktakeItemDetail.stock_unit` は必須の field として足す（optional にしない）。

## Data Safety Checks

- source-derived data: 店の事実は台帳の番号と要旨だけ。
- generated outputs: bindings の再生成（runtime）。
- secrets: なし。
- local-only files: 回答台帳・相談の記録・持ち帰りデータ（P3 の数え直しは件数だけを出す）。
- synthetic sample boundaries: test・L3 の商品・CSV は合成。

## Main Wiring / Integration Checks

- helper connected to main path: `biz::unit_amount` が棚卸しの確定と入庫・廃棄の記録詳細の両方から呼ばれる。
- output reaches manifest/report: 記録詳細の wire に行の金額（1/100 円）と合計（円）が出る。
- effective config reaches runtime: migration が起動時の migrate に登録される。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- 金額の関数で基準数量の割り算を外すと、長さの商品の入庫の記録詳細の test（83250 を期待）が落ちる。
- 四捨五入を切り捨てに替えると、境界 `2r = basis` の test と 167 円の test が落ちる。
- 在庫少の SQL の並びから `ball` を落とすと、全 variant の test が落ちる。
- formatter に `default` を戻しても 12 個の表の test は通る（この mutant は test では殺せない）。網羅は `default` を置かず `never` で受ける型の側で持ち、review で `default` が無いことを確かめる（Residual Test Gaps）。
- vC の範囲検査を外すと、範囲外の 1 行の test が「REAL で続く」形で落ちる（`typeof` の検証が拾う）。
- 手動販売の「金額を編集したら追従を止める」を外すと、800 のまま を期待する test が落ちる。

## Residual Test Gaps

- レジの小数の数量の端数の丸め（P3）は実データでしか確かめられない（P の lane の Plan Gate の前）。
- 丸めの受入れ（廃棄の TD-023 の案、J3・J4）は owner の L3 の目視。
- m の入力と表示の読みやすさは L3。
- formatter の `default` の有無は test で検出できない（型と review で持つ）。
