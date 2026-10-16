# Test Design Matrix: 単位・数量・原価の精度の見直しの結果を設計正本へ置き換える

本 lane は docs だけで、自動 test を足さない。下の行は後続の lane（backlog の「原価の lane（C）」と「単位の語の直しの lane」）が実装する test の設計で、設計正本の節と D-119 から導いた。本 lane が自分で回す検査は packet の AC12（docs の検査、traceability の検査、設計照合 test）と AC1〜AC11 の `rg` の数だけ。test の名前は後続の lane の起票で確かめ、既存の test を引く行は `rg` で実在を確かめた。

## Risk

Risk: R3

## Contracts Under Test

- MNT-03-D14（vB）: 原価の列を持つ 5 つの表に行の無い DB にだけ当たり、6 列を `_centi` に改名し値を変えない。行のある DB では何も変えずに `MigrationFailed`（`作り直し` と表名）。前提が確かめられたときだけ `stock_unit` の CHECK を 10 個にする
- SPEC-UNIT-D1: 巻・cm は作り直しの起点でだけ外す（今の DB に新しい migration で外さない）
- SPEC-UNIT-D2 / BIZ-01-D8 / UI-01b-D23: 単位の変更は個数の単位どうしだけ（商品修正・商品 CSV の上書き・UI を通らない command）。在庫・明細・価格・PLU の状態は変えない。操作ログに `stock_unit` の前後
- SPEC-UNIT-D5 / UI-01b-D24: 袋の値段 ÷ 入り数を 1/100 円未満で四捨五入して原価の欄に入れる。袋の値段と入り数は保存しない
- 22 §16 の「DB の作り直しを 1 回にまとめる順」: 作り直した DB では棚卸しの runtime の migration が止まらない

## Failure Modes

- FM1: vB が行のある DB で列を改名する・CHECK を変える（値の意味が黙って 100 倍に読まれる）
- FM2: vB が 5 つの表の一部しか数えず、行のある DB を通す
- FM3: vB の途中の失敗で、改名だけが残る・版が記録される・foreign_keys が OFF のまま残る
- FM4: 前提を確かめずに巻・cm を外し、`roll`・`cm` の行を持つ DB の作り直しで初期投入の行が CHECK で拒まれる（または今の DB を作り直しなしに縛る）
- FM5: 個数 ↔ 長さの単位の変更が、商品フォーム・商品 CSV の上書き・command のどれかで通る（在庫 100 が 100 cm から 100 個に変わる）
- FM6: 個数の単位どうしの変更で、在庫・明細・価格・`plu_dirty` が変わる、または操作ログに残らない
- FM7: 商品 CSV の preview は拒むが commit が TX の中で再検証せず、wire の行を信じて種類をまたぐ変更を書く
- FM8: 原価の補助の割り算を浮動小数で行い、四捨五入を誤る（`1000` 円 ÷ 12 が 83.34 になる、`.5` の境界で切り捨てる）
- FM9: 原価の補助が入り数・袋の値段を DB か wire に出す
- FM10: 作り直した DB で棚卸しの runtime の migration が止まり、作り直しが 2 回になる

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| MNT-03-D14 | FM1・FM2 | migration（合成の DB） | `test_vb_stops_when_any_cost_table_has_rows`（5 つの表ごとに 1 case） | 5 つの表のどれか 1 つに 1 行だけある DB で vB が成功するか、schema（`pragma_table_info` の列名・CHECK）・`schema_versions`・`PRAGMA foreign_keys` のどれかが変わる。期待: `MigrationFailed`、message に `作り直し` とその表名、何も変わらない。非空の期待として、どの表にも行が無い DB では成功する（下の行） |
| MNT-03-D14 | FM1 | migration | `test_vb_renames_cost_columns_on_empty_db` | 空の DB に v1 から vB までを当てた後、6 列のどれかが古い名前のまま、または `_centi` の名前が無い |
| MNT-03-D14 / SPEC-UNIT-D1 | FM4 | migration | `test_vb_unit_check_has_ten_codes` | 手順 4 を行う build で、CHECK が `roll`・`cm`・`kg` のどれかを受ける、または 10 個のどれかを拒む |
| MNT-03-D14 | FM3 | migration（失敗の注入） | `test_vb_failure_rolls_back_and_restores_foreign_keys` | 手順 5 の検証を失敗させたとき、改名・CHECK・版のどれかが残るか、`PRAGMA foreign_keys` が手順 1 の値に戻らない |
| MNT-03-D14 | — | migration | `test_vb_not_reapplied` | vB を記録した DB で `migrate` を再実行すると、vB が 2 度当たる |
| SPEC-UNIT-D2 / BIZ-01-D8 | FM5 | unit（BIZ-01、試験 DB） | `test_update_product_rejects_unit_kind_change` | `pcs` の商品を `m` に、`m` の商品を `pcs` に、`m` の商品を `cm` に変える `update_product` が通る。期待: `ValidationFailed("在庫単位は個数の単位どうしでだけ変えられます")`、商品の行と操作ログは変わらない |
| SPEC-UNIT-D2 / BIZ-01-D8 | FM6 | unit | `test_update_product_changes_count_unit_word_only` | `pcs` → `ball` の変更で、`stock_quantity`・明細・`selling_price`・`cost_price`・`plu_dirty`・price_history のどれかが変わる、または操作ログの detail_json に `stock_unit` の `{"old":"pcs","new":"ball"}` が無い |
| SPEC-UNIT-D2 / BIZ-01-D8 | — | unit | `test_update_product_same_unit_is_no_change` | 今と同じ単位を送ると操作ログの detail_json に `stock_unit` が書かれる（BIZ-01-D7 の「値を持っても更新前と同じ field は書かない」） |
| SPEC-UNIT-D2 / BIZ-01-D8 | FM5・FM7 | unit（商品 CSV の preview と commit） | `test_import_overwrite_unit_kind_change_is_row_error` | 上書きの行で `在庫単位` を種類をまたいで変えると preview が行の error にしない、または preview を通さずに組んだ wire の行で commit が書く。期待: preview の行の error `在庫単位は個数の単位どうしでだけ変えられます（登録: …、CSV: …）`、commit は TX 全体を戻す。非空の対照: 個数の単位どうし（`個` → `玉`）の上書きは preview も commit も通り、単位が変わる |
| UI-01b-D23 | FM5 | RTL（`ProductForm` の edit mode。mock の境界は後続の lane の起票で対象 test の `vi.mock` を読んで決める） | `ProductForm edit unit select shows count units only` | 個数の商品の select に長さの単位が出る、長さの商品で select が操作できる、単位を変えないのに `stock_unit` を送る |
| SPEC-UNIT-D5 / UI-01b-D24 | FM8 | unit（TS の純関数） | `unitCostFromPack` の golden（`1000` 円 ÷ 12 → 8333、`1` 円 ÷ 3 → 33、`0.05` 円 ÷ 2 → 3〈2.5 の切り上げ〉、`0.04` 円 ÷ 3 → 1、`999999.99` 円 ÷ 1 → 99999999） | 割り算を number の小数で行う、四捨五入の境界（`2r >= n`）を `>` にする、結果が袋の値段を越える |
| SPEC-UNIT-D5 / UI-01b-D24 | FM9 | RTL | `ProductForm cost helper fills cost only` | 「原価に入れる」の後に保存の request に袋の値段か入り数が入る、入り数 0・`1.5`・空で原価の欄が変わる |
| D-119 (8) | FM10 | migration（棚卸しの runtime の lane の test に足す） | 棚卸しの runtime の migration の「棚卸しと Z004 の取込みの無い DB で当たる」test に、vB の後の DB（商品あり、棚卸しの明細・Z004 の取込みなし）の case を足す | vB の後の DB で棚卸しの runtime の migration が止まる |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| DB の版と原価の列（vB） | 行のある開発・試験 DB（v8 以降） | 新しい版の起動の migrate | 空の DB で 6 列が `_centi`、版を記録 | — | — | 再起動で再実行しない | 作り直し（移して空の DB）で v1 から当たる | 行のある DB で止まり何も変えない | 作り直しの後の起動 | `test_vb_*` |
| 商品の単位（UI-01b-D23） | 登録済みの個数の商品 | 商品修正で select を変えた | 単位の語が変わり、在庫の数は同じ | 商品の query を stale にする（今の `updateProduct` の invalidation のまま） | 一覧・在庫照会が新しい語で出る | 過去の記録の詳細も新しい語 | — | 種類をまたぐ変更は BIZ が拒む | 直して保存 | `test_update_product_*`、RTL |
| 原価の補助の入力（UI-01b-D24） | 補助を閉じている | 袋の値段と入り数を入れた | 原価の欄に値が入る | — | — | 補助を開き直すと空 | 画面を離れると消える（保存しない） | 入力の error で原価の欄を変えない | 直して押す | RTL、golden |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 原価の値の変換（vC・100 倍・範囲検査・旧版へ戻す手順） | `rg -n 'vC\|範囲検査\|100 倍する\|既存の値を 100 倍\|移行の前の記録\|両方の key\|連続適用' docs --glob '!docs/archive/**' --glob '!docs/research/**' --glob '!docs/plans/**'` の全 hit（22・10・master-tables・transaction-tables・30・31・decision-log・backlog） | 22 §16、10 の掛ける lane、master-tables、transaction-tables、30 の操作ログ、31 の fingerprint、backlog の「U から C へ送るもの」 | decision-log の D-113 の本文（決定の記録。Superseded in part の行で置換えを書いた）と D-119（撤去の記録）。22 の v7 の範囲検査と回復の手順（vU の旧版へ戻す手順。原価に関係しない） | packet の AC1 |
| 単位を登録の後に変えない | `rg -n '登録の後に変え\|単位を変えない\|単位は読取専用\|stock_unit.*読取専用\|ProductUpdateRequest.*単位' docs --glob '!docs/archive/**'` | 10 SPEC-UNIT-D2、30 BIZ-01-D8・§4.4、51 UI-01b-D5・D23 | 51 UI-01b-D22 の末尾（PR #167 が同じ行を書き換えるので触らず、D5 の行に置き換えを書いた。merge の後に揃える）、`docs/archive/` の packet（履歴） | packet の AC4 |
| 12 の語を店の答えとして引く | `rg -n '12 種すべて\|すべて使う\|12 unit words\|店は 12' docs --glob '!docs/archive/**'` | 10 SPEC-UNIT-D1 の出典、project-memory、decision-log（D-113 の前提の訂正の行） | 聞き取りの記録 `docs/evidence/hearing-2026-09-14-stock-units.sanitized.md`（その時点の答えの記録で、正しい）、D-113 の本文 | packet の AC7 |
| 10 cm を最小と刻みの両方に読む | `rg -n '最小 10 cm\|minimum 10 cm\|10 cm 刻み' docs --glob '!docs/archive/**'` | project-memory、backlog、10 SPEC-UNIT-D2 | 聞き取りの記録の Coordinator の読み取り（その時点の記録）、10 の「10 cm 刻みを強制しない」（決定の文） | packet の AC7 |

## Negative Paths

- missing input: 原価の補助の入り数・袋の値段が空 → 補助の欄の入力の error、原価の欄を変えない
- invalid input: 入り数 0・小数・`10000000` → `入り数は1以上の整数で入力してください`。袋の値段が小数 3 桁 → 原価の欄と同じ文
- duplicate/ambiguous input: 商品 CSV の上書きで同じ商品の行が 2 つ → 今の重複の扱い（変えない）
- unknown reference: 単位の変更の対象の商品が無い → 今の `NotFound`
- dependency missing: vB の前提（Excel の巻・cm）が確かめられない → 手順 4 を行わない build
- permission/write failure: vB の TX の失敗 → rollback、foreign_keys を戻す
- dry-run side effect: 商品 CSV の preview は DB に書かない（今のまま）

## Boundary Checks

- threshold: 入り数は 1〜`9999999`。原価の補助の結果は袋の値段以下
- null/default: `ProductUpdateRequest.stock_unit` の omitted / null は更新しない
- empty/non-empty: vB の起点の検査は表ごとに 0 行と 1 行
- min/max: 原価 `99999999` ÷ 1 = `99999999`（上限の中）
- status/policy enum: `ProductStockUnit` は 12（作り直しの起点の後は前提つきで 10）
- wire type: `ProductUpdateRequest_Deserialize` の `stock_unit` は `ProductStockUnit | null | undefined`
- internal type: `stock_unit_kind` で個数か長さかを決める（code の並びを手で書かない）
- producer/consumer: BIZ-01 が検査し、UI は select を絞るだけ（UI の絞りを信頼しない）
- round-trip token: 該当なし
- precision/range: 原価の補助は整数の商と余りで求める
- cross-language parse: 原価の補助は TS だけ（結果は BIZ が D5 の規則で検査する）

## Compatibility Checks

- old schema/input: 行のある v8 以降の DB → vB が止まる（作り直す）。商品 CSV の今の行の error の文 `在庫単位は登録の後に変えられません` は、単位の語の直しの lane の後は種類をまたぐときの新しい文に変わる（test の期待を書き換える）
- new schema/input: `_centi` の 6 列、前提つきで 10 個の単位の CHECK
- output order: 変えない
- optional field behavior: `stock_unit` を送らない `updateProduct` は今と同じ

## Data Safety Checks

- source-derived data: test は合成の商品と合成の DB だけ。持ち帰りの Excel を fixture にしない
- generated outputs: bindings の再生成の差分だけ
- secrets: 無し
- local-only files: 作り直しで移した開発・試験 DB の file を commit しない
- synthetic sample boundaries: 原価・入り数は架空の値

## Main Wiring / Integration Checks

- helper connected to main path: vB が `migrations()` の registry に登録され、新しい DB の作成で当たる
- output reaches manifest/report: 単位の変更が操作ログ（`product_update`）に入る
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → 原価の補助の golden（`1000` ÷ 12 → 8333）は設計正本の例から写す
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → 該当なし（単位の変更は今の `updateProduct` の invalidation を使う）
- If a key branch is inverted, which test fails? → 個数の種類の判定を反転すると `test_update_product_rejects_unit_kind_change` と `test_update_product_changes_count_unit_word_only`
- If a threshold comparison changes, which test fails? → 四捨五入の `2r >= n` を `>` にすると golden の `0.05` 円 ÷ 2
- If a guard is removed, which test fails? → vB の起点の検査を外すと `test_vb_stops_when_any_cost_table_has_rows`。commit の再検証を外すと `test_import_overwrite_unit_kind_change_is_row_error`
- If an output field is omitted, which test fails? → 操作ログの `stock_unit` を落とすと `test_update_product_changes_count_unit_word_only`
- If output order changes, which test fails? → 該当なし
- If dry-run performs a side effect, which test fails? → 商品 CSV の preview の既存の test（変えない）
- If a JSON number crosses JavaScript safe integer range, which test fails? → 該当なし（原価の補助の結果は `99999999` 以下）
- If a state token is round-tripped through browser/client code, which test fails? → 該当なし

## Residual Test Gaps

- 最新の在庫 Excel の巻・cm の行の数は自動 test で確かめられない（Contract Probe の P1。原価の lane の起票の前に owner が持ち帰りで確かめる）。
- 作り直しの手順（DB の file を移して空の DB から起動する）は開発者が原価の lane で 1 度通し、手順の記録を packet に残す。自動 test にしない。
- 商品フォームの単位の select の 1 文と原価の補助の見た目は、後続の lane の Windows native L3（human visual confirmation）。
- U5・U6 の店の答えで変わる所は、答えが出たときの lane の Matrix で設計する。
