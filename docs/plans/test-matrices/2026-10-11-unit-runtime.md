# Test Design Matrix: 単位を 12 種へ広げる runtime（単位の lane、U）

Plan Packet: [2026-10-11-unit-runtime](../2026-10-11-unit-runtime.md)。契約の正本は [共通規則](../../function-design/10-common-rules.md) SPEC-UNIT-D1〜D4・D6・D7・D9〜D11 と「入力の上限と安全な整数の範囲」、[22](../../function-design/22-mnt-migration.md) §16。出発点は設計 lane の Matrix（`docs/archive/plans/test-matrices/2026-10-07-unit-extension.md`）で、U の行を取り、行番号と既存 test の名前を 2026-10-11 の HEAD `7070382f` の現物で確かめ直した。C（原価）・P（Z004・EJ）・⑤（棚卸しの再開）の行は写していない。oracle の値は正本の例と整数の計算から独立に写し、実装の出力から作らない。`X1`〜`X13` は packet の「横断の約束」の表の行。

## Risk

Risk: R4

## Contracts Under Test

- SPEC-UNIT-D1 単位の 12 個の code と、数量の種類・価格の基準数量の導出
- SPEC-UNIT-D2・D3 在庫の数量は整数（長さは cm）、m の入力と表示、表示する所の表（7 の棚卸しを除く）、数量の種類ごとの 2 本の集計、単価、入力の行の数量の加算
- SPEC-UNIT-D4 PLU の単価は売価のまま（回帰）
- SPEC-UNIT-D6 原価 × 数量の行と合計の丸め（原価は円の整数を `i128::from(円) * 100` で渡す）
- SPEC-UNIT-D7・UI-04-D18 手動販売の金額の初期値と、数量に合わせた求め直し
- SPEC-UNIT-D9 TS の twin と Rust の関数の golden の一致、formatter の網羅
- SPEC-UNIT-D10・BIZ-01-D8 在庫少の種類の分岐、商品 CSV の `在庫単位`・`初期在庫`・上書き
- SPEC-UNIT-D11 wire の `stock_unit` の enum と、表示のために足す field
- SPEC-UNIT-D11 の続き「入力の上限と安全な整数の範囲」（X1〜X12）
- MNT-03-D13 migration v8（vU）と上限の検査（X13）、回復の手順
- UI-01b-D22 商品フォーム

## Failure Modes

- 浮動小数を通して `0.29` m が 28 cm になる、表示した `1.3 m` を保存し直して 127 cm が 130 cm になる。
- 長さの商品の金額を基準数量で割らず 100 倍になる（入庫・廃棄・手動販売）。
- 行ごとの丸めと合計の丸めが場所ごとに違い、同じ明細から違う金額が出る。
- 新しい個数の単位（`ball` 等）が在庫少の SQL のどちらの分岐にも入らず、在庫少に出ない。
- formatter の `default` が新しい単位を `—` で出す。
- v8 で `products` の行・列・index・FK が欠ける、失敗したのに表・版・`foreign_keys` が変わる。
- 商品 CSV の `玉` が取込み全体を止める。CSV の上書きで単位が変わる。`m` の行の `初期在庫` `25` が 25 cm で入る。
- 長さの商品の数量を cm の整数のまま出す画面が残る（日次売上の `130`・`¥7`、販売点数の `130 点`）。
- 入力の行の再追加・統合が `1.3` を整数でないと見て `1` に戻す。
- 行の金額を JS の number で受けて 1/100 円ずれる。
- 上限の外の数量・在庫・売価・原価が保存される。在庫を動かさない明細（レジ処理済みの返品、在庫に連動しない商品の売上）が上限の検査を通らない。移行の前に保存済みの上限の外の値がそのまま残る。
- 既存の `pcs`・`cm` の商品の値・表示の意味・評価額が変わる。

## Test Matrix

既存 test を回帰の根拠に引く行は、`rg` で名前と行を確かめた（2026-10-11）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPEC-UNIT-D1 | 単位を足して種類・基準数量を決め忘れる | unit（Rust） | `unit_amount` の `stock_unit_kind`・`price_basis_quantity` の 12 個の表（個数の 10 code は `Count`・1、`m`・`cm` は `Length`・100）。今の `test_valuation_req205_price_basis_by_unit`（`biz/stocktake_service.rs:1404`）を移して 12 個に広げる | 12 個の code のどれかの種類か基準数量が正本の表と違う |
| SPEC-UNIT-D1・D11（X12） | wire の文字列と enum の対がずれる | unit（Rust） | `src-tauri/src/finite_enum_contract_tests.rs` の対の表（`:63`）・`rejects!`（`:134`）・`parity!`（`:188`〜`:189`）を 12 個に | 1 つでも `as_str` と serde の値が違う、一覧に無い `kg` を受ける |
| SPEC-UNIT-D3 | m の文字列 → cm の誤り、0 と上限の扱い | unit（TS） | m の入力の純関数: `1.3`→130、` 1.3 `（前後の空白）→130、`1.27`→127、`2`→200、`0.01`→1、`0.29`→29、`1.15`→115、`4.35`→435。0: `0`・`0.00` は数量欄（入庫・返品・手動販売・廃棄）で error（`数量は0.01以上で、小数は2桁までの m で入力してください`）、0 を受ける欄（商品登録の初期在庫）では 0。上限: 数量欄は `99999.99`→9999999 を受け、`100000`・`100000.00` は error。初期在庫の欄は `9999999.99`→999999999 を受け、`10000000` は error。`1.300`・`1e2`・`-1`・`.5`・空 → error | 浮動小数で掛けて切り捨てた（`Math.trunc(Number(s) * 100)` は `0.29`→28・`1.15`→114・`4.35`→434。設計 lane が node で確かめた値）、3 桁目を丸めた、符号を受けた、数量欄で 0 を通した、欄ごとの上限を取り違えた |
| SPEC-UNIT-D3・D9 | cm → m の表示の誤り、formatter が単位を落とす | unit（TS）+ unit（Rust） | formatter: 130→`1.3 m`、127→`1.27 m`、200→`2 m`、-30→`-0.3 m`、123456→`1,234.56 m`、0→`0 m`、`cm` の 130→`1.3 m`、`cm` の 300→`3 m`、`ball` の 3→`3 玉`、`pcs` の 1234→`1,234 個`。12 個の code それぞれの表示の語の表。`formatStockUnitLabel` は `cm` の商品が `cm`、`m` が `m`。Rust の `format_length_m` も長さの行で同じ表（golden） | 小数 1 桁に丸めた、末尾の 0 を残した、負の符号を落とした、`cm` の商品を `130 cm` で出した、12 個のどれかの語が正本の表と違う |
| SPEC-UNIT-D3（TD-203、表の 2） | 売上の明細・単価が cm のまま | unit（TS）+ RTL | 日次売上: `m` の商品の明細（数量 130・金額 910）→ 数量 `1.3 m`・単価 `¥700/m`・金額 `¥910`、`pcs` の明細（数量 3・金額 2100）→ `3 個`・`¥700`、数量 0 → 単価 `—`、返品（-130・-910）→ 単価 `¥700/m`。単価の twin: 910×100÷130 → 700、1000×100÷130 = 769.2 → 769、1×100÷200 = 0.5 → 1 | 単価が `¥7`（基準数量を掛けない）、数量が `130`、四捨五入でない |
| SPEC-UNIT-D3（TD-206/207、表の 3・4、X9） | 単位の違う商品の数量を足す、相殺で種類を失う | unit（Rust）+ unit（TS） | BIZ-05: 同じ部門に `pcs` 3・`sheet` 2・`m` 130・`cm` 50 の日 → 部門小計・総合計の `count_points` 5・`length_cm` 180、画面 `5 点・1.8 m`（部門小計・合計・販売点数のカード〈日次・ホーム〉）。`pcs` 3・`ball` 2 だけ → 5・0 → `5 点`。`m` 130 だけ → 0・130 → `1.3 m`。明細 0 行 → 0・0 → `0 点`。月次の部門別: 同じ `m` の商品を月に 2 回（130・120）と `pcs` 5 → 5・250 → `5 点・2.5 m`、`stock_unit` は null。月次の商品別: `m` の商品が 0・130・`m` → `1.3 m`、`pcs` の商品が 3・0・`pcs` → `3 点`、`m` の商品を +130・-130 → 0・0・`m` → `0 m`（`0 点` ではない）、`pcs` の +3・-3 → `0 点`。TS の `group-items.ts` の小計・`compute-summary.ts` の合計も同じ値。数量の並べ替え（昇順）: `pcs` 2・`pcs` 5・`m` 130 → `m` 130、`pcs` 2、`pcs` 5 | 長さを点に足した（135 点）、個数の単位を単位ごとに分けた（`3 個・2 枚`）、相殺した長さの商品の行を `0 点` で出した、`quantity` の名前のまま意味を変えた |
| SPEC-UNIT-D3・X9 | 上限の中の集計を拒む、TS の和が溢れても黙って出す | unit（Rust）+ unit（TS） | 同じ日・同じ部門の長さの商品 A の明細 9999999 cm が 2 件と B の -9999999 cm が 1 件 → A の行 19999998、B の行 -9999999、部門小計と総合計の `length_cm` 9999999・`count_points` 0 で、`get_daily_sales` は成功する。月次の商品別・部門別も同じ形で 1 つずつ。TS の再集計は、9007199254740991 と 2 を足す fixture で `—`、9007199254740990 と 1 は 9007199254740991 | 上限の中の集計を範囲の検査で拒んだ、和を plain の `+=` のままにした（review で確かめる。Residual Test Gaps）、TS の和を検査せず 9007199254740992 を出した |
| SPEC-UNIT-D3（TD-203、表の 5） | 売上の CSV の数量が cm のまま | unit（Rust） | `export_sales_csv`: 日次の `m` の行の `数量` が `1.3`、`cm` の商品の 50 が `0.5`、`pcs` の行が `3`（今どおり）、月次の部門別の行が `5 点・1.8 m`、個数の商品だけの部門は今と同じ整数、`1.30` と書かない | `130` を書いた、長さを点に足した、小数の末尾の 0 を残した |
| SPEC-UNIT-D3（TD-203、表の 6・8・9・11・12） | 在庫変動・整合性チェック・PLU 書出し・操作ログが cm のまま | RTL | 在庫変動: `m` の商品の変動 +250・変動後 2750 → `+2.5 m`・`27.5 m`。入庫の記録詳細（`m` の商品 +250・変動後 2750 と `pcs` の商品 +3・変動後 13 が 1 つの伝票）の「関連する在庫変動」→ `+2.5 m`・`27.5 m` と `+3`・`13`（行ごとに `detail.items` の単位）。返品・手動販売・廃棄・CSV 取込み・棚卸しの記録詳細も同じ形で 1 つずつ。対応に無い商品コードの行は整数。整合性チェック: 在庫 2750・変動の合計 2700・差異 50 → `27.5 m`・`27 m`・`+0.5 m`、補正の結果 `27.5 m → 27 m`。PLU 書出しの未書出しの一覧: 2750 → `27.5 m`。操作ログの `integrity_fix`: `stock_unit` の key がある記録は `旧在庫 27.5 m → 新在庫 27 m`、key の無い記録済みの log は `旧在庫 2,750 → 新在庫 2,700`（今どおり）。`pcs` の商品はどれも今どおり | 単位を渡さず整数で出した、記録詳細で 1 つの単位を全行に当てた、`StockAdjustment` に単位が無い、key の無い log を m で出した |
| SPEC-UNIT-D3（表の 12）・X10 | 新しく書く `integrity_fix` の detail_json に単位が無い | unit（Rust） | `m` の商品（在庫 2750・変動の和 2700）と `pcs` の商品を補正 → detail_json の adjustments の各要素に `stock_unit`（`"m"`・`"pcs"`）、`old_stock`・`new_stock`・`adjustment` は今と同じ値 | key を足さない、長さの商品だけに足した |
| SPEC-UNIT-D3（表の 10）・31 | 在庫警告の文に cm の整数が入る | unit（Rust） | 在庫 100 cm の `m` の商品を手動販売で 130 → `stock_warnings` が `{商品コード}: 在庫がマイナスになりました（-0.3 m）`。入庫・返品・廃棄で負の在庫になる明細も同じ形で 1 つずつ。`cm` の商品の -30 → `（-0.3 m）`。`pcs` の商品の -2 → 今どおり `（-2）` | `（-30）` のまま、4 か所のどれかが整形を通さない |
| SPEC-UNIT-D6 | 基準数量で割らない・丸めの誤り | unit（Rust） | `cost_line_centi`・`cost_total_yen`: 33300×250÷100 → 83250・合計 833、33300×50÷100 → 16650・合計 167、境界 `2r = basis`（100×1÷200 → 1）と `2r < basis`（100×1÷201 → 0）、`i128::from(i64::MAX) * 100`×1÷1 → `i64::MAX × 100`。複数明細: `m` 0.5 m × 333 円（16650）・`cm` 50 cm × 1 円/m（50）・`pcs` 3 × 2 円（600）→ 行 `[16650, 50, 600]`、`cost_total_yen` = 173 円（行ごとに円へ丸めて足すと 174 円）。負の原価・数量は `ValidationFailed` | 割らない（100 倍）、四捨五入を切り捨てにした、合計を行ごとに円へ丸めてから足した、関数の中で原価をもう一度 100 倍した |
| SPEC-UNIT-D6（回帰） | 今の評価額の値が変わる | unit（Rust、回帰） | 今の 7 本（`biz/stocktake_service.rs:1404`〜`:1487`: `test_valuation_req205_price_basis_by_unit`・`line_rounds_half_up`・`total_rounds_half_up_to_yen`・`two_stage_rounding`・`negative_input_rejected`・`line_overflow_rejected`・`total_bounds`）を `unit_amount` へ移し、原価の引数を `i128::from(円) * 100` にして同じ期待で回す（`i64::MAX`・`92_233_720_368_547_759` の円の原価の成功と、`1 << 62` の原価の overflow を含む）。旧本体の確定の test（`legacy_complete_stocktake` を呼ぶ `:1495`・`:1538` の `cm` の商品の評価額）と新方式の `time_evidence_tests.rs:1100` の `cm` の商品の test は編集せずに通る | 関数を移すときに値・境界・overflow の扱いを変えた、原価の引数を i64 の 1/100 円にして `i64::MAX` 円を渡せなくした |
| SPEC-UNIT-D6（X7） | IO が金額を計算し続ける、行の金額が number になる | integration（Rust） | 入庫・廃棄の記録詳細: 上の複数明細の伝票（`m`・`cm`・`pcs` の 3 行）→ 行 `"16650"`・`"50"`・`"600"`、合計 `173`。長さの商品 2.5 m・原価 333 → 行 `"83250"`・合計 833。個数の商品（今の `db/receiving_repo.rs` の test の fixture と同じ数量 4・原価 250）→ 行 `"100000"`・合計 1000（`:603`〜`:604` の期待 1000 円と同じ額）。廃棄も今の `db/disposal_repo.rs` の test の fixture（数量 2・原価 120 と数量 3・原価 80）で行 `"24000"` が 2 つ・合計 480（`:1094`・`:1098` の期待と同じ額）。原価 999999・数量 9999999 の 1 行 → `"999998900000100"` | `receiving_repo.rs:229`・`disposal_repo.rs:647` の `quantity * cost_price` が残る（長さで 100 倍）、wire を number にした |
| SPEC-UNIT-D6・D9（X7） | 行の金額の表示が 1/100 円ずれる | unit（TS） | 行の金額の formatter: `"83250"` → `832.50 円`、`"16650"` → `166.50 円`、`"5"` → `0.05 円`、`"0"` → `0.00 円`、`"999998900000100"` → `9,999,989,000,001.00 円`、`"99999998900000001"` → `999,999,989,000,000.01 円`（number では `…000.00` になる大きさ） | TS が `Number()` を通した、下 2 桁を落とした |
| SPEC-UNIT-D6・D9 | 廃棄の入力画面の合計が BIZ と違う | unit（TS） | 廃棄の合計の twin を golden の表で（Rust と同じ例を独立に写す。`m` 0.5 m × 333・`cm` 50 cm × 1・`pcs` 3 × 2 → `173 円`、`m` 0.5 m × 333 だけ → `167 円`）。上限の明細（`pcs`、原価 999999・数量 9999999）900 行 → `8,999,990,100,000,900 円`、901 行 → `—` | twin の丸めが BIZ と違う、行ごとに円へ丸めてから足した（174 円）、number で足した、範囲外の合計を数で出した |
| SPEC-UNIT-D3 | 入力の行の再追加・統合で小数の数量を失う | unit（TS） | 入庫・返品・手動販売・廃棄の helper: `m` の行 `1.3` に同じ商品を再追加 → `2.3`、`1.27` → `2.27`、廃棄の `0.5` と `0.3` の統合 → `0.8`、返品の方向の切替えの合算 `0.5` + `0.3` → `0.8`、`0.1` + `0.2` → `0.3`、`cm` の `130` に再追加 → `131`（今どおり）、個数の `3` → `4`、規則に合わない `abc` の再追加 → 初期値、統合は廃棄が元の値（統合先 `5` と `abc` → `5`）・返品の方向の切替えが `1`（今の `sumQuantities`） | `Number.isInteger` のまま（`1.3` → `1`、`0.5+0.3` → `0.5`）、浮動小数で足した（`0.1+0.2` が `0.30000000000000004`） |
| UI-01b-D22・SPEC-UNIT-D3 | 単位の select が 2 個のまま、`m` の初期在庫 0 を拒む、保存できない在庫連動の提案になる | unit（TS）+ RTL | select に 12 個の表示の語が正本の表の順で出る。単位 `m` で売価・原価の label に「1 m あたり」、`pcs` では出ない。単位 `m`・初期在庫 `0`（既定のまま）→ `initial_stock` 0、`25` → 2500、`0.005` → `数量は0以上で、小数は2桁までの m で入力してください`。修正の画面は既存の商品の単位（12 個のどれでも）をそのまま出す（`sheet` の商品が `個` にならない）。`ej_unverified` の間、在庫連動の checkbox に触らずに単位を `m` → `ball` へ替える → 提案は `false` のままで保存が成功する。`ej_unverified` でない間は `m` → `false`、`ball` → `true`。checkbox を触った後は単位を替えても値が変わらない | select が `value === "cm" ? "cm" : "pcs"`（`StockUnitField.tsx:62`）のまま、修正の写像が 2 値（`product-form-request.ts:70`）のまま、初期在庫の欄に `数量は0.01以上…` を当てた |
| X1（1 明細の数量） | 上限の外の数量が保存される | integration（Rust）+ unit（TS） | 入庫・返品（在庫を動かす）・手動販売・廃棄を UI を通らない command で 1 つずつ: 数量 9999999 は成功（在庫 0 の商品で、入庫と入る方向の返品は在庫 9999999、手動販売と廃棄は -9999999）、数量 10000000 は `ValidationFailed`（`明細1: 数量が大きすぎます`）で、在庫・記録・明細・変動・操作ログが増えない。レジ処理済みの返品（`register_processed=true`）: 10000000 → `ValidationFailed` で `return_records`・`return_items`・操作ログが増えず在庫も変わらない、9999999 → 成功して `return_items` に 9999999、在庫は変わらない。TS: 個数と `cm` の商品の `9999999` は受け `10000000` は入力の error | 数量の検証が 1 以上のまま、上限の検査を `apply_stock_change` の中だけに置いた（レジ処理済みの返品が通る）、画面の上限が `Number.isSafeInteger` のまま |
| X2（POS 由来の数量） | 在庫を動かさない行が上限の検査を通らない | integration（Rust） | 商品別売上 CSV の preview: 在庫に連動しない商品（`pos_stock_sync=false`）の行の数量 10000000 → `invalid_number` の行の error で、`legacy_commit_csv_import` の後も `sale_records` にその行が無く在庫も変わらない（同じ file のほかの行は取り込まれる）。9999999 と -9999999 の行は `sale_records` に入る。在庫に連動する商品の行の 10000000 も同じ行の error | 上限の検査を在庫を動かす枝だけに置いた、取込み全体を止めた |
| X3（在庫） | 計算の後の在庫・初期在庫・補正の後の在庫が上限の外 | integration（Rust） | 初期在庫 999999999 の商品の登録は成功、1000000000 は `ValidationFailed`（`在庫数が大きすぎます`）。商品 CSV の `pcs,999999999` は受け、`pcs,1000000000` は行の error。在庫 999999999 の商品に 1 を入庫 → `ValidationFailed` で、在庫・入庫の記録・明細・変動・操作ログが TX 全体で変わらない。在庫 999999998 に 1 を入庫 → 999999999 で成功。返品（入る方向）も同じ形、手動販売・廃棄・商品別売上 CSV の販売（`legacy_commit_csv_import`）は在庫 -999999999 から 1 で `ValidationFailed`（-999999998 から 1 は成功）。取込みの取消（旧本体の取消の test の経路）: 在庫 999999999 の商品で、数量 1 の販売の取込みを取り消す（補正 +1）→ `ValidationFailed` で取消が TX 全体で戻る。在庫 999999998 なら成功して 999999999。整合性の補正: 変動の和 1000000000（DB を直接 seed）の商品 → `fix_integrity` が `ValidationFailed` で在庫と操作ログが変わらない、999999999 は成功。`run_integrity_check` は同じ DB で不一致を返す（読取りは拒まない） | `apply_stock_change` が i64 の溢れだけを検査した、初期在庫に上限が無い、取消の `old_stock + correction`（`commit.rs:273`）を検査しない、整合性チェックの読取りを範囲で拒んだ |
| X5・X6（売価・原価） | 上限の外の売価・原価が保存される | unit（Rust）+ unit（TS） | create・update・`revise_product_price`: 売価 999999 は受け、1000000 は `ValidationFailed`（`売価が大きすぎます`）。原価 999999 は受け、1000000 は `ValidationFailed`（`原価が大きすぎます`）。商品 CSV の `売価`・`原価` も 999999 は受け 1000000 は preview の行の error、preview を通さない commit は `ValidationFailed` で TX 全体が戻る。入庫と廃棄の明細の原価 999999 は成功、1000000 は `ValidationFailed`（`明細1: 原価が大きすぎます`）。TS: 商品フォームと入庫・廃棄の欄で同じ境界 | 売価・原価の検証が 0 以上のまま、入庫・廃棄の明細に上限が無い |
| X8（円の合計） | 円の合計が安全な整数を超える記録が保存される | integration（Rust）+ unit（Rust） | `check_safe_integer`: 9007199254740991 と -9007199254740991 は通り、9007199254740992 と -9007199254740992 は `ValidationFailed`。入庫の create（`pcs`）: 上限の明細（原価 999999・数量 9999999）900 行 → 合計 8999990100000900 円で成功。それに原価 999999・数量 7209161 の 1 行と原価 949252・数量 1 の 1 行を足す → 合計 9007199254740991 円で成功し、記録詳細も同じ合計を返す。最後の行の原価を 949253 にする → `ValidationFailed`（`合計金額が大きすぎます`）で、在庫・入庫の記録・明細・変動・操作ログが変わらない。上限の明細 901 行（9009990089000901 円）も拒む。廃棄の create も同じ形で 1 つずつ | create が合計を求めず記録詳細の読取りで初めて計算した、検査を保存の後に置いた、`cost_total_yen` の結果を検査せずに保存した |
| X11・SPEC-UNIT-D7・UI-04-D18 | 手動販売の金額が 100 倍・数量に追従しない | unit（TS・Rust）+ RTL | `sale_amount_yen`（四捨五入）: 700×130÷100 → 910、333×130÷100 = 432.9 → 433、333×125÷100 = 416.25 → 416、333×100÷100 = 333、境界 1×50÷100 = 0.5 → 1、999999×9999999÷1 → 9999989000001、999999×9999999÷100 → 99999890000。TS の twin も同じ表。画面: `m` の商品を追加 → 数量 `1`・金額 700、数量 `1.3` → 金額 910、金額を 800 に直した後に数量 `2` → 800 のまま、`m` の数量 `100000`（上限超え）の間は未編集の金額欄が空、個数の商品の再追加 → 数量 +1・金額 + 売価、個数の商品（売価 700）の数量を `3` に変える → 金額は 700 のまま、payload の数量は 130 | 初期値が `String(selling_price)`（`manual-sale-row-utils.ts:24`）のまま長さで 100 倍、編集後も上書きする、payload に m の数を送る、個数の商品まで数量で金額を求め直した |
| SPEC-UNIT-D10 | 在庫少から単位が漏れる | integration（Rust） | `list_low_stock`: `ball` 2 個（一般の基準 3）→ 出る、`m` 400 cm（生地の基準 500）→ 出る、`m` 600 cm → 出ない、`pcs` 4 → 出ない。12 個の code を 1 つずつ在庫 0 で置くと 12 個とも出る。今の `test_list_low_stock_req302_threshold_branching`（`cmd/inventory_cmd.rs:201`、`LS-CM` 300 cm）は編集せずに通る | SQL が `'pcs'` / `'cm'` のまま、並びを手で書いて 1 つ落とした、長さを一般の基準で比べた |
| SPEC-UNIT-D10・BIZ-01-D8（X12） | 商品 CSV の単位の語 | unit（Rust） | preview: `玉`→`ball`、` m `→`m`、`pcs`→`pcs`、`セット`→`set`、空→None（INSERT で `pcs`）、`kg`→行の error で他の行は valid。preview を通さない wire（`commit_import` に `stock_unit: Some("kg")` の行）は `ValidationFailed` で TX 全体が戻る | 表示の語を受けない、`kg` で取込み全体が止まる、commit が DB の CHECK に任せた |
| SPEC-UNIT-D3・BIZ-01-D8（X3） | `m` の行の `初期在庫` を cm で読む | unit（Rust） | preview・commit: `m,25` → 在庫 2500、`m,26.15` → 2615、`m,0` → 0、`m,0.05` → 5、`m,1.15` → 115、`m,9999999.99` → 999999999、`m,10000000` → 行の error、`m,25.155`・`m,-1`・`m,1e2` → 行の error `初期在庫の値が不正です`、`cm,25` → 25、`pcs,25` → 25 | `m` の行を整数で読んだ（25 → 25 cm）、`f64` で掛けた（1.15 → 114） |
| SPEC-UNIT-D2・BIZ-01-D8（X12） | CSV の上書きで単位が変わる | unit（Rust） | 既存の `m`・在庫 100・入庫の明細（数量 100・原価 333）の商品を `ball` で上書きする CSV: preview は行の error `在庫単位は登録の後に変えられません`、他の行は valid。preview を通さない wire は `ValidationFailed` で TX 全体が戻る。どちらの後も `stock_unit = 'm'`・`stock_quantity = 100`・入庫記録詳細の行 `"33300"` のまま。同じ単位（`m`）と空の上書きは成功し単位は `m`。今の `test_commit_import_req104_overwrite_preserves_optional_fields`（`biz/product_service.rs:3372`）は編集せずに通る | preview だけで止めて commit で再検証しない、上書きで `stock_unit` を UPDATE する経路を残した |
| SPEC-UNIT-D11 | `stock_unit` が string のまま、足す field が欠ける | type check（TS）+ unit（Rust） | `npm run typecheck`（formatter の param が `ProductStockUnit`、`MovementTable` の必須の prop、`quantity` を読む古い site）。DB に一覧に無い単位（CHECK を外した表に `kg` を直接 seed）がある記録の詳細の読取りは error。bindings に `DailySaleItem.stock_unit`・`IntegrityMismatch.stock_unit`・`StockAdjustment.stock_unit`・`ProductResponse.stock_unit`・`MonthlySaleItem.stock_unit`（`ProductStockUnit \| null`）・`count_points`・`length_cm` があり、`DeptSubtotal`・`GrandTotal`・`MonthlySaleItem` に `quantity` が無い（AC7 の再生成の差分で確かめる） | 記録詳細の 6 型か行の型が `string` のまま、足す field を optional にした、`quantity` を残した |
| SPEC-UNIT-D4 | PLU の単価が変わる | unit（Rust、回帰） | 既存の `test_selling_price_boundaries_req402`（`src-tauri/src/io/plu_formatter.rs:825`）ほか PLU の formatter の test を編集せずに通す | 長さの商品の単価を基準数量で割った・掛けた |
| MNT-03-D13 vU | 作り直しで行・列・index・FK が欠ける、失敗で何かが変わる | integration（Rust、migration） | v7 の DB（`pcs`・`cm`・負の在庫・discontinued・`plu_target=1` の行、全列に値、8 つの子の表に行）→ v8 → `products` の全列の値・行数・3 つの index・`foreign_key_check` 0 行が同じ、`stock_unit` の値ごとの件数が同じ、12 個の code をすべて INSERT でき `kg` は CHECK で拒む、子の表の FK が効く（子のある商品の DELETE が拒まれる）、`foreign_keys` が元の値。新規の DB（v1 から v8 まで）でも同じ。手順 6 の失敗（検証を失敗させる注入。今の failpoint の仕組みを使う）で表・版が戻り `foreign_keys` が元の値。再実行で v8 を 2 度当てない。v8 を当てた DB を app_max 7 の `migrate` で開くと `SchemaNewerThanApp` | 列を写し落とした（`plu_target`）、index を作り直さない、`foreign_keys` を戻さない、版だけ記録した |
| MNT-03-D13 vU の上限の検査（X13） | 移行の前に保存済みの上限の外の値がそのまま残る | integration（Rust、migration） | v7 の DB に各列の端の値（`receiving_items`・`return_items`・`manual_sale_items`・`disposal_items` の `quantity` 9999999、`sale_records.quantity` 9999999 と -9999999、`products.stock_quantity`・`inventory_movements.stock_after`・`stocktake_items.system_stock` の 999999999 と -999999999、`stocktake_items.actual_count` の 999999999 と NULL、`inventory_movements.quantity` の 1999999998 と -1999999998、`products.selling_price`・`price_history.old_selling`・`new_selling` の 999999、原価の 6 列の 999999 と -999999〈`valuation_cost_price` は NULL も〉、`stocktakes.total_cost` の 9007199254740991 と NULL、上限の明細 900 行の入庫と廃棄の記録〈和 8999990100000900〉）→ v8 が成功し値が変わらない。どれか 1 つを 1 つ外（数量 10000000、在庫 1000000000 か -1000000000、変動 1999999999、売価 1000000、原価 1000000、`total_cost` 9007199254740992、上限の明細 901 行の記録〈和 9009990089000901〉）にした DB → `MigrationFailed`（message に `上限の検査` と表名・列名）で、表・値・版が変わらず `foreign_keys` が元の値。上限の外が明細・履歴の列（`inventory_movements.stock_after`、`price_history.old_selling`、`price_history.old_cost`）だけにある DB も止まる。止まった DB は app_max 7 の `migrate` でそのまま開ける。行 0 の表で成功 | `products` の列だけを見た、変動の数量を 1 明細の数量の上限で比べた（初期在庫 20000000 の商品の変動で、上限の中の DB が止まる）、原価の列を見ない、記録ごとの和を見ない、止まったときに `foreign_keys` を戻さない |
| MNT-03-D13 回復 | 旧版へ戻せない、手順書が正本と違う | manual（Writer が L3 の前に 1 度。owner の L3 にしない） | 22 §16 の回復の手順を合成の DB で通す: v7 のアプリ相当（app_max 7 の build か、v7 までを当てた DB）で backup → v8 を当てる → アプリを止める → 復元の中断の遺物が無いことを確かめる → backup の写しの `MAX(version)` が 7 以下・`integrity_check` が `ok` → 今の DB・WAL・SHM を別の folder へ移す → `{db_path}` に置く → app_max 7 の `migrate` が開き backup の時点のデータを出す。`.restore_manifest` が残る状態では手順 3 で、合う backup が無い状態では手順 4 で止まり、元の名前の DB・WAL・SHM と遺物は中身も名前も変わらない。結果を PR に残す | 手順が 71 の restore に頼った、確かめる前に DB を移した |

### 既存 test の期待を変える所（契約の変更による書換え。弱めない）

| 既存 test（file:line） | 今の期待 | 新しい期待 | 根拠 |
|---|---|---|---|
| `test_commit_import_req104_nonempty_invalid_stock_unit_rolls_back`（`biz/product_service.rs:3324`） | `在庫単位=kg` の行で commit が DB の CHECK で失敗し取込み全体が rollback | preview では `kg` の行が行の error で他の行は valid。preview を通さない commit は `ValidationFailed` で TX 全体が rollback（rollback の確認は残す） | SPEC-UNIT-D10、BIZ-01-D8 |
| `test_revise_product_price_req105_persists_large_values_exactly`（`biz/product_service.rs:4261`） | 売価 9,999,999・原価 9,999,998 が正確に保存される | 上限の端（売価 999999・原価 999999）が商品と履歴に正確に保存され、1 つ外（1000000）は `ValidationFailed` で商品・履歴・操作ログが変わらない | 共通規則 (a)（X5・X6） |
| `test_fix_integrity_req904_t2_audit_detail_and_skips`（`biz/integrity_service.rs:480`、期待は `:524`〜`:527`） | adjustments の各要素が `product_code`・`old_stock`・`new_stock`・`adjustment` の 4 key | 同じ 4 key の値はそのままで、`stock_unit` の key が足される | SPEC-UNIT-D3 の表の 12 |
| `test_daily_sales_req501_normal`（`biz/sales_service.rs:695`）・`test_daily_sales_req501_empty_date`（`:730`）・`test_daily_sales_req501_dept_subtotals`（`:743`）・`test_get_daily_sales_no_fake_items_req501`（`:790`）と `biz/csv_import_service/tests/cross_feature_tests.rs` の `grand_total` を読む行 | `grand_total.quantity`・部門小計の `quantity` | 同じ値を `count_points` で比べ、`length_cm` が 0 であることを足す（fixture は個数の商品だけ） | SPEC-UNIT-D11 |
| `db/receiving_repo.rs:603`〜`:604`、`db/disposal_repo.rs:1094`・`:1098` | repo が `line_cost` 1000・`total_cost` 1000、`total_loss_cost` 480・`line_loss_cost` 240 を返す | repo は数量・原価・単位を返す。同じ明細の金額は BIZ の記録詳細の test で `"100000"`・1000、`"24000"`・480 を確かめる（額は同じ） | SPEC-UNIT-D6、21 §10.2・§10.5 |
| `format-stock-display.test.ts:24`〜`:26`・`:42`〜`:44`（想定外の単位は `—`） | `"kg"`・`""` → `—` | 消す（一覧に無い値は型で渡せない）。代わりに 12 個の code の表の test | SPEC-UNIT-D9 |
| `N cm` の表示を期待する TS の test（`rg -c '[0-9] cm' src --glob '*.test.*'` の 9 file・12 行: `format-stock-display.test.ts` 4、`DisposalPage.test.tsx`・`CsvImportRecordDetailPage.test.tsx`・`DisposalRecordDetailPage.test.tsx`・`OtherRecordDetailPages.test.tsx`・`StocktakeRecordDetailPage.test.tsx`・`ManualSalePage.test.tsx`・`ProductTable.test.tsx`・`ReturnExchangePage.test.tsx` 各 1） | 例: `300 cm` | 同じ数量を m の形（`3 m`）。入力の行の単位欄（`formatStockUnitLabel`）の `cm` はそのまま | SPEC-UNIT-D3 の表示、TD-203 |
| 売上・ホーム・記録詳細・PLU 書出しの fixture（packet の Scope S4・S6 が挙げる file） | `quantity`・`line_cost`・`line_loss_cost`、`stock_unit` 無し | 新しい field 名と必須の `stock_unit`。期待する表示は個数の商品では今と同じ | SPEC-UNIT-D11 |

上の表に無い既存 test は編集しない。編集が要ると分かったら Writer は止まって Coordinator へ返す。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| DB の版（v8） | v7（新規は 0） | 起動時の `migrate` の TX | v8、値は同じ | — | — | 旧版のアプリで開くと `SchemaNewerThanApp`。旧版へ戻すのは 22 §16 の回復の手順 | 再起動で再適用しない | v8 の変更と版を戻し、`foreign_keys` を元の値に戻す。上限の検査で止まった DB は版 7 のままで旧版でそのまま開ける | 更新を保留し、管理者が対応を決める（履歴の列の値は画面で直せない） | MNT-03-D13 の 2 行と回復の manual |
| m の入力欄（入庫・返品・手動販売・廃棄・商品登録の初期在庫） | 空か初期値 | 入力中の文字列 | cm の整数で送る | 行は商品ごと（単位の違う商品へ行を替えない） | 保存の後の現在庫は BIZ の値を m で出す | 同じ商品の再追加は cm の整数で足す | フォームのリセットで初期化 | 入力の error（文は SPEC-UNIT-D3、上限は X1・X3） | 直して再送（冪等の key は今のまま） | m の入力の純関数と加算の test、各画面の RTL |
| 手動販売の行の金額 | 追加時に式で | 数量を編集中 | 保存 | 金額を編集したら追従を止める | — | 同じ商品の再追加 | フォームのリセットで初期化 | 数量が入力の error の間は金額を求めない | 直して再送 | UI-04-D18 の RTL |
| 商品 CSV の preview | ファイル選択 | preview | 正規化した code で commit | — | — | — | — | 行の error（不正な単位・単位の変更・上限）。commit は再検証で TX 全体を戻す | ファイルを直して選び直す | BIZ-01-D8 の test |
| 売上の画面（日次・月次・ホーム）の数量 | 読込み | query | 点と m の 2 本 | 取込み・手動販売の後は今の invalidate のまま | 今のまま | 日付・月を替える | — | 和が安全な整数を外れたら `—` | — | 集計の test と RTL |
| 入出庫の保存 | 入力 | 保存中 | 記録と在庫と変動 | 今のまま | 記録詳細は BIZ が金額を求め直す（保存の前に検査した合計と同じ） | — | — | 上限・合計の検査で `ValidationFailed`、何も書かない | 直して再送。同じ key の再送は今の冪等のまま | X1・X3・X8 の行 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 価格の基準数量で割る（SPEC-STK-VAL-D1・D3） | `rg -n 'quantity \* (ri\|di)\.cost_price\|quantity \* costPrice\|\* item.valuation_cost_price' src src-tauri/src`（2026-10-11: `receiving_repo.rs:229`、`disposal_repo.rs:647`、`disposal-request.ts:40`、`StocktakeRecordDetailPage.tsx:183`）と `manual-sale-row-utils.ts:24`・`:40`、`seed_demo.rs:469` | 入庫・廃棄（IO → BIZ）、廃棄の入力画面（twin）、手動販売（twin）、seed | 棚卸し記録詳細のロス原価（`StocktakeRecordDetailPage.tsx:182`〜`:183`）は ⑤（packet の「起票時に起草役が決めたこと」） | SPEC-UNIT-D6・D7 の行 |
| 数量を整数のまま出す所（TD-203） | 共通規則 SPEC-UNIT-D3 の「表示する所」の表（12 行）と、`rg -n 'formatStock(Display\|UnitLabel)\('`（22 か所）、`rg -n 'MovementTable\b'`（呼ぶ所 7）、売上の `quantity` を読む所（packet の S6） | 表の 1〜6・8〜12 | 表の 7（棚卸しの計数と確定の結果）は ⑤。レジの日報（D-104）、記録済みの `note`・detail_json、入力の DTO、件数 | SPEC-UNIT-D3 の行 |
| `stock_unit` の 2 値の分岐 | `rg -n '"cm"' src-tauri/src src-tauri/tests`（2026-10-11: `product_repo.rs:44`・`:65`、`seed_demo.rs`、test の fixture）、`rg -n "stock_unit = '(pcs\|cm)'" src-tauri/src`（`product_repo.rs:1258`〜`:1259`）、TS は `StockUnitField.tsx:46`・`:62`・`:88`、`product-form-request.ts:70`、formatter の 2 つの switch | 全部（packet の S2・S5・S6） | `schema_v1.rs:40` の CHECK は migration の履歴として書き換えない | SPEC-UNIT-D1・D10、UI-01b-D22 の行 |
| 在庫を書く所に上限（X3） | `rg -n 'update_stock_quantity\(' src-tauri/src --glob '!*test*'`（`common.rs:64`・`commit.rs:274`・`integrity_service.rs:173`・`stocktake_service.rs:571`）と初期在庫（`product_service.rs:957`・`:1204`〜`:1213`） | `stocktake_service.rs:571` 以外 | 旧本体の確定（test だけが呼ぶ）と新方式の確定は ⑤ | X3 の行 |
| 表を作り直す migration（v2） | `db/schema_v2.rs:18`〜`:27`（手順）・`:29`〜`:78`（`foreign_keys` の退避と復元）・`:139`〜`:198` | v8 | — | MNT-03-D13 の行、Contract Probe P2・P3 |
| 意図的な二重実装と golden（BIZ-01-D2） | `30-biz-product-service.md` BIZ-01-D2 | 金額の twin、m の換算と表示の twin | — | golden の行 |

## Negative Paths

- missing input: m の欄が空 → 入力の error。商品 CSV の `在庫単位` が空 → `pcs`。
- invalid input: m の小数 3 桁・指数・符号、0 を受けない数量欄の `0`、数量・在庫・売価・原価の上限超え、商品 CSV の `kg`・`m` の行の `25.155`。
- duplicate/ambiguous input: 同じ商品の再追加（cm の整数で足す）。商品 CSV の上書きで単位が違う行。
- unknown reference: DB に一覧に無い単位の行 → repo の読取りの error。`MovementTable` の対応に無い商品コード → 整数で出す。
- dependency missing: 時点証拠の migration は未配線なので v8 は v7 の列だけを写す（後に入る lane が `products` の列と `stocktake_recounts` を扱う）。
- permission/write failure: v8 の途中の失敗 → 表・版が戻り `foreign_keys` が元の値。create の TX の中の上限の検査 → TX 全体が戻る。
- dry-run side effect: 商品 CSV と商品別売上 CSV の preview は DB を変えない（今どおり）。

## Boundary Checks

- threshold: 丸めの境界 `2r = basis`（切り上げ）と `2r < basis`（切り捨て）、合計の `r = 50`、在庫少の基準（基準以下が在庫少）。
- null/default: CSV の空の単位は `pcs`。`MonthlySaleItem.stock_unit` は部門別で null。v8 の検査は NULL の行を除く。
- empty/non-empty: 明細 0 行の日の集計は 0・0 → `0 点`。行 0 の表で v8 が成功。
- min/max: m の最小 0.01（0 を受ける欄は 0）、1 明細の数量 `9999999`（`99999.99` m）、在庫の絶対値 `999999999`（`9999999.99` m）、売価 `999999`、原価 `999999`（円）、変動の数量 `1999999998`（v8 の検査）、円の合計 `±9007199254740991`。
- status/policy enum: `ProductStockUnit` の 12 値、`StockUnitKind` の 2 値。
- wire type: 数量は整数、`count_points`・`length_cm` は整数、行の金額は 1/100 円の整数の十進の文字列、合計は円の整数。
- internal type: i128 の中間、`ImportRow.stock_unit` は `Option<String>`。
- producer/consumer: BIZ が金額と集計を返し、UI は保存済みの値を計算しない（入力中の見込みだけ twin）。
- round-trip token: 127 cm → `1.27 m` → 入力欄に `1.27` と入れても 127。
- precision/range: 長さ 1 cm、行の金額 1/100 円、合計 1 円。
- cross-language parse: Rust の金額・表示の関数と TS の twin を同じ golden の表で。

## Compatibility Checks

- old schema/input: v7 の DB を v8 で移す（`pcs`・`cm` の行の値は同じ）。v8 の DB を旧版のアプリは開かない。`stock_unit` の key の無い記録済みの操作ログは今どおり。
- new schema/input: 12 個の code、商品 CSV の表示の語、`m` の `初期在庫`。
- output order: 売上の数量の並べ替えは `(count_points, length_cm)` の辞書順。個数の商品だけなら今と同じ順。商品 CSV・売上の CSV の列の並びは変えない。
- optional field behavior: 足す `stock_unit` は必須の field（`MonthlySaleItem` だけ null を許す）。`count_points`・`length_cm` は必須（0 を入れる）。
- old wire: 売上の集計の `quantity` と `line_cost`・`line_loss_cost` は名前を残さない（TS の型検査が古い読み手を止める）。

## Data Safety Checks

- source-derived data: 店の事実は台帳の番号と要旨だけ。
- generated outputs: `src/lib/bindings.ts`・`docs/function-design/90-traceability.md` は再生成（手で編集しない）。
- secrets: なし。
- local-only files: 回答台帳、L3 の fixture の実体、回復の手順を通す合成の DB と backup。
- synthetic sample boundaries: test・L3 の商品・CSV は合成（実商品名・実 JAN を使わない）。

## Main Wiring / Integration Checks

- helper connected to main path: `biz::unit_amount` が、入庫・廃棄の create（合計の検査）と記録詳細、売上の集計、在庫警告、在庫少の SQL の並び、旧本体と新方式の棚卸しの評価額から呼ばれる。
- output reaches manifest/report: 記録詳細の wire に行の金額（1/100 円の文字列）と合計（円）、売上の wire に点と m の 2 本、売上の CSV に表示の単位の数量。
- effective config reaches runtime: v8 が `migrations()` に登録され、起動時の `migrate` で当たる（新規の DB と v7 の DB の両方）。上限の定数が BIZ の全検証と TS の入力から引かれる（同じ値を 2 か所に書かない）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- `cost_line_centi` で基準数量の割り算を外すと、長さの商品の入庫の記録詳細の test（`"83250"`）が落ちる。
- 四捨五入を切り捨てに替えると、境界 `2r = basis` の test と 167 円・433 円の test が落ちる。
- 合計を行ごとに円へ丸めてから足すと、`[16650, 50, 600]` → 173 円の test が 174 で落ちる。
- 在庫少の SQL の並びから `ball` を落とすと、12 個の code を 1 つずつ置く test が落ちる。
- 数量の上限の検査を `apply_stock_change` の中へ移すと、レジ処理済みの返品の 10000000 の test が保存に成功する形で落ちる。
- 入庫の create から合計の検査を外すと、9007199254740992 円の test が保存に成功する形で落ちる。
- v8 の上限の検査を外すと、1 つ外の値を持つ v7 の DB の test が、v8 が成功する形で落ちる。`plu_target` を写し落とすと、全列の比較の test が落ちる。
- 集計で `stock_unit_kind` の分岐を逆にすると、`5 点・1.8 m` の test が `180`・`5` の入れ替わりで落ちる。
- 手動販売の「金額を編集したら追従を止める」を外すと、800 のままを期待する test が落ちる。
- formatter に `default` を戻しても 12 個の表の test は通る（test では殺せない。`never` で受ける型と review で持つ。Residual Test Gaps）。
- JSON の数が安全な整数を越える所: 行の金額は文字列で運ぶので、`"99999998900000001"` の formatter の test が number 化を落とす。合計は X8 の検査の test が落とす。

## Residual Test Gaps

- 廃棄の丸めの受入れ（TD-023 に合わせた案）と m の入力・表示の読みやすさは owner の L3（L3-1〜L3-3）。
- 商品 CSV の CP932 の実 file の取込みは L3-4（自動 test は bytes の fixture）。
- formatter の `default` の有無、集計の和が checked であること（i64 の溢れに届く fixture は SQL の `SUM` が先に error になるので作れない）は test で検出できず、型と review で持つ。
- 同梱の SQLite 3.45.0 での `products` の作り直しは、packet の Contract Probe P3 の手順を Plan Gate の前に、v8 の migration の test を実装で確かめる。
- 回復の手順は Writer が合成の DB で 1 度通す manual で、自動 test にしない（file の置き換えとアプリの入れ替えを含む）。
- 棚卸しの計数の m（表の 7）、原価の小数、POS の数量は本 lane の test に無い（⑤・C・P）。
