## 在庫ドメイン不変条件

在庫関連処理で共通して遵守するルール。

**INV-1: quantity符号規約**
- inventory_movements.quantity は在庫視点（+増加/-減少）
- sale_records.quantity は売上帳票視点（+販売/-返品）
- SUM計算が自然になるよう、テーブルの目的に合わせた符号にする

**INV-1a: 入力値は常に正数**
- 全ての Request 構造体の quantity フィールドは正の整数のみ受け付ける（quantity <= 0 → BizError::ValidationFailed）
- 符号変換は BIZ 層の各業務関数内でのみ実施する:
  - create_receiving: apply_stock_change に +quantity
  - create_return (direction=in): +quantity
  - create_return (direction=out): -quantity
  - create_manual_sale: -quantity
  - create_disposal: -quantity
- IO層は符号変換を行わない。BIZ層から渡された値をそのまま記録する

**INV-2: stock_after算出責任**
- BIZ-02の共通在庫変動関数 (apply_stock_change) が `products.stock_quantity + quantity` を計算する
- IO層（inventory_repo::insert_movement）は渡された stock_after をそのまま記録する

**INV-3: 負在庫ポリシー**
- stock_after < 0 の場合は警告フラグをセットするが、処理は続行する
- 理由: 小規模店舗では入庫記録の遅延で一時的にマイナスになることがある。エラーにすると業務が止まる

**INV-4: is_voided の使用範囲**
- is_voided フラグは CSV 取込みロールバック時（BIZ-03）のみ使用する
- BIZ-02 では is_voided を操作しない。insert_movement は常に is_voided=0 で挿入する

**INV-5: 冪等性**
- 各ヘッダテーブルに idempotency_key (TEXT NOT NULL UNIQUE) と request_fingerprint (TEXT NOT NULL) を持つ
- CMD層がUUID v4でidempotency_keyを生成しBIZ層に渡す
- BIZ層がリクエスト内容からrequest_fingerprintを計算する
- idempotency_key重複時:
  - request_fingerprint一致 → 冪等な再送成功（既存レコードのIDを返す）
  - request_fingerprint不一致 → BizError::IdempotencyConflict
- 予約プレフィックス `__legacy__:` はマイグレーション時のバックフィル用。UUIDと衝突しない

**INV-6: CSV取込みの自然冪等性（file_hash方式）**
- csv_importsテーブルはINV-5のidempotency_key/request_fingerprintパターンを使わない
- file_hash（SHA-256、生バイト列＝デコード前のrawバイトから算出、hex小文字64文字）が自然な重複検知キー
- 重複判定: `file_hash一致 + status IN ('completed','completed_partial')` → ブロック
- ロールバック後（status='rolled_back'）の再取込みは許可
- settlement_date一致 + 別file_hash → 既存active import全件を示す追加確認後、新規分をinsert-onlyで取込む
- settlement_dateはgroup keyでありuniqueness keyではない。訂正は対象import IDのrollbackと再取込みを明示した2操作で行う
- スコープ: 単一店舗（1DB）
- 改行コード差異（CRLF/LF）は別hashとなるが、これは仕様として許容。同一内容でも改行コードが違えば別ファイル扱い
- file_hashにUNIQUE制約なし（DB_DESIGN.md確定済み: ロールバック後に同一hashが2行できるため）。競合防止はcommit TX内でのcheck-then-insertで対応
- **前提: SQLite単一接続（1人運用デスクトップ）**。マルチ接続化する場合は UNIQUE(file_hash) の条件付き再導入またはアプリ層排他ロックが必須

**INV-7: csv_import参照のinventory_movements制約**
- reference_type='csv_import' のinventory_movementsは、movement_type='sale_auto' のみ
- BIZ-03のcommit_csv_importが生成し、rollback_csv_importがvoidする
- void_movements_by_reference は reference_type + reference_id のみで絞り込む（movement_type条件は冗長のため付与しない。この不変条件が安全性の根拠）

**INV-8: products物理DELETE禁止**
- productsテーブルの行を物理DELETEしない。廃番管理は is_discontinued フラグ（論理削除）のみ
- 理由: inventory_movements, sale_records, receiving_items, return_items, disposal_items, manual_sale_items, stocktake_items, price_history の8テーブルがFK参照しており、物理削除は整合性を破綻させる

---

## 単位・数量・金額の共通規則（proposed・未実装、D-113）

契約 ID: SPEC-UNIT-D1〜D11（2026-10-07、[decision-log](../decision-log.md) D-113）。今の実装は単位が `pcs` / `cm` の 2 値、原価が円の整数で、本節はその後の契約である。実装は後続の runtime の lane（単位の lane と原価の lane。Plan Packet `2026-10-07-unit-extension` の申し送りの表）が行い、それまで下の各文書の現行の記述が実装の正本である。owner の判断 J1〜J4 は 2026-10-08 にすべて推奨の案に決まり（repo 外の回答台帳 TD-195）、該当の項目に `決定（owner、D-113 Jn）` と書いた。

**SPEC-UNIT-D1 単位の一覧と数量の種類**: 商品の単位（`products.stock_unit`、wire は generated enum `ProductStockUnit`）は次の 12 個の code に限る。code は ASCII で、一度決めた code の意味を変えない。表示の語は code から UI が引き、DB と wire には日本語を入れない。

| code | 表示の語 | 数量の種類 | 在庫の数量の 1 | 価格の基準数量 | 数量の入力 |
|---|---|---|---|---|---|
| `pcs` | 個 | 個数 | 1 個 | 1 | 整数 |
| `sheet` | 枚 | 個数 | 1 枚 | 1 | 整数 |
| `hon` | 本 | 個数 | 1 本 | 1 | 整数 |
| `bag` | 袋 | 個数 | 1 袋 | 1 | 整数 |
| `box` | 箱 | 個数 | 1 箱 | 1 | 整数 |
| `roll` | 巻 | 個数 | 1 巻 | 1 | 整数 |
| `kumi` | 組 | 個数 | 1 組 | 1 | 整数 |
| `set` | セット | 個数 | 1 セット | 1 | 整数 |
| `ball` | 玉 | 個数 | 1 玉 | 1 | 整数 |
| `cho` | 丁 | 個数 | 1 丁 | 1 | 整数 |
| `m` | m | 長さ | 1 cm | 100（1 m あたり） | m で小数 2 桁まで（D3） |
| `cm` | cm | 長さ | 1 cm | 100（1 m あたり） | cm の整数 |

- 出典: 店は 12 種すべてを使う（`project-memory.md` の Store Premises Facts、2026-09-14）。重さ（g・kg）は使わない（同、owner 2026-09-13）。毛糸の数え方は「玉」で、在庫計数 Excel の毛糸の「個」は owner の入力の誤り（repo 外の回答台帳 TD-192。意味は通るので Excel はそのままでよい）。`ball` は一覧に入れる（`決定（owner、D-113 J1）`、2026-10-08、TD-195。不採用: 入れずに毛糸を `個` で数える）。
- 数量の種類と価格の基準数量は code だけで決まる。商品ごとの列は持たない（[35 §20.5a](35-biz-stocktake-service.md#205a-評価額の計算価格の基準数量と店の丸め) SPEC-STK-VAL-D1 の理由のまま）。箱・袋で仕入れてばらす商品は「ばらした 1 個」を単位にし、1 個の原価を小数第 2 位まで持つ（D5）。店の答え（TD-058）は箱あたりの原価を記録するものではないので、SPEC-STK-VAL-D1 の「見直す条件」には当たらない。
- `roll`（巻）は個数で、巻と m は換算しない（1 巻の長さは商品で違う）。`kumi`（組）と `set`（セット）は別の code（店は両方使う）。
- `m` と `cm` は在庫・価格・POS の数量の意味が同じで、違いは入力と表示だけ。店は長さの商品の残り・仕入れ・値札を m で扱うので、長さの商品の登録の既定は `m` にする（UI-01b-D22）。今の `cm` の行は値も意味も変えない。
- 不採用: (a) 日本語の語を code にする（表示の語を直すと DB・CSV・ログの値が変わる）。(b) 保存の基準（`pcs` / `cm`）と表示の単位を別の列にする（種類と基準数量が 12 個の code から一意に決まり、2 列は同じことを 2 度持ち、組合せの CHECK が要る）。(c) `group`・`pair` 等の英語の code で 組・本・丁 を表す（意味の違う英語を当てると、後で読む人が数を誤る）。

**SPEC-UNIT-D2 在庫の数量の表現**: 在庫・明細・変動の数量は今までどおり整数（INV-1a・INV-3）。個数の単位は 1 単位、長さの単位は 1 cm を 1 とする。m は入力と表示の換算だけ（1 m = 100 cm）。10 cm 刻みを DB・BIZ で強制しない（実測の残り 1.27 m = 127 cm を保てる。返品・廃棄・棚卸しで端数が出うる）。商品の単位は登録の後に変えない（今の UI-01b-D5 と `ProductUpdateRequest` のまま）。

**SPEC-UNIT-D3 長さの入力と表示**:
- 入力: `m` の商品の数量欄は文字列を `^[0-9]+(\.[0-9]{1,2})?$` に全体で一致するときだけ受け、浮動小数を通さず cm の整数にする（整数部 × 100 + 小数部を右に 0 を埋めた 2 桁）。例: `1.3` → 130、`1.27` → 127、`2` → 200。小数 3 桁以上・指数表記・符号・空は入力の error で、丸めない。`cm` と個数の単位の数量欄は今の整数の規則のまま。wire には cm の整数を送る（DTO の数量の型は変えない）。適用する数量欄は、商品登録の初期在庫（[51](51-ui-product-form.md) UI-01b-D22）、入庫（[61](61-ui-receiving.md)）、返品・交換（[63](63-ui-return-exchange.md)）、手動販売（[62](62-ui-manual-sale.md) UI-04-D18）、廃棄（[64](64-ui-disposal.md)）、棚卸しの実数（[73](73-ui-stocktake.md)）で全部。在庫少の基準の欄（[69](69-ui-threshold-settings.md)）は cm のまま（D10）。
- 表示: 長さの数量を m で表すとき、符号・整数部（3 桁区切り）・小数部 2 桁を整数の演算で作り、小数部の末尾の 0 を落とす（130 → `1.3 m`、127 → `1.27 m`、200 → `2 m`、-30 → `-0.3 m`、123456 → `1,234.56 m`）。`cm` の商品は `130 cm`、個数の単位は `10 個` `3 玉` の形（数と語の間に半角空白。今の `formatStockDisplay` と同じ）。数量を伴わない単位の表示（入力の行の単位欄）は D1 の表示の語。
- 入力の error の文（`m` の商品）: `数量は0.01以上で、小数は2桁までの m で入力してください`。0 を受ける欄（棚卸しの実数）は `数量は0以上で、小数は2桁までの m で入力してください`。
- 不採用: 表示を小数 1 桁に丸める（127 cm が 1.3 m と見え、見た値を入れ直すと 130 cm になる）。`1 m 30 cm` の形を主の表示にする（表の桁がそろわず、入力の値と対応しない）。

**SPEC-UNIT-D4 価格の基準数量と POS の数量 1**: 売価・原価は「価格の基準数量」ぶんの値である（SPEC-STK-VAL-D1 を 12 単位へ広げる）。個数の単位は 1、長さの単位は 100（1 m あたり。値札・伝票と同じ）。不変条件: レジの数量 1 = 価格の基準数量（個数の商品は 1 単位、長さの商品は 1 m。店のレジは数量 1.3 × 1 m あたりの単価で打てる）。よって PLU の単価は売価のまま（[25](25-io-plu-formatter.md) IO-04 は変えない）。この不変条件が成り立たない単位を足すときは本節を見直す。

**SPEC-UNIT-D5 原価の精度（1/100 円）**（`決定（owner、D-113 J2）`、2026-10-08、TD-195）: 原価は 1/100 円の整数で持つ。DB の列と wire の field は名前に `_centi` を付けて改名する（`products.cost_price` → `cost_price_centi` ほか、[master-tables](../db-design/master-tables.md) の「単位と原価の精度の契約」の表）。売価は円の整数のまま（レジの PLU の単価と値札が円の整数）。
- 入力: 原価の欄は `^[0-9]+(\.[0-9]{1,2})?$` を浮動小数を通さず 1/100 円の整数にする（`83.33` → 8333、`1000` → 100000）。上限は `9007199254740991`（JS の number で正確に運べる最大の整数。BIZ が検査し、超えれば `原価が大きすぎます`）。error の文は `原価は0以上で、小数は2桁までで入力してください`。
- 表示: 100 で割り切れれば円の整数（`1,000 円`）、そうでなければ小数 2 桁（`83.33 円`）。
- 理由: 店は箱・袋で仕入れてばらす商品の 1 個の原価を「1 袋の値段 ÷ 入り数を小数第 3 位で四捨五入して小数第 2 位まで」持つ（`project-memory.md` の Store Premises Facts、2026-09-29。台帳 TD-058）。円の整数では 83.33 が 83 になり、1,000 個で 330 円の評価額の差になる。名前を変えずに意味だけ 100 倍にすると、古い SQL・画面が黙って 100 倍の値を出す（D-104 と同じ理由）。
- 不採用: (a) 商品ごとに原価の基準数量（入り数）を持ち `1,000 円 / 12 個` の比で表す（店の計算〈83.33 円〉と違う値になり、TD-023 の商品別の金額と合わない。列と入力欄が増える）。(b) REAL（2 進の浮動小数で四捨五入を誤る）。(c) 10 進の文字列（`SUM` できない）。(d) 売価も 1/100 円にする（レジと値札が円の整数で、要る場面が無い）。

**SPEC-UNIT-D6 原価 × 数量の金額と丸め**: 原価 × 数量の金額はすべて BIZ の共通関数で求め、IO と UI の表示の値は BIZ が返した値を使う（UI の入力中の見込みの合計は D9 の twin）。
- 行（商品別）の金額 = `原価(1/100 円) × 数量 ÷ 基準数量` の正確な値を 1/100 円未満で四捨五入する（商 q・余り r で `2r >= 基準数量` なら q + 1。SPEC-STK-VAL-D3 と同じ）。
- 合計 = 行の金額（1/100 円）の和を円未満で四捨五入した円の整数（和 s の商 q・余り r で `r >= 50` なら q + 1。SPEC-STK-VAL-D4 と同じ）。
- 適用: 棚卸しの評価額（店の答え TD-023 のとおり。35 §20.5a）。廃棄のロス原価と入力画面の合計（店の直接の答えが無いので TD-023 に合わせる。runtime の lane の L3 で owner が確かめる）。入庫の原価小計と原価合計（TD-023 と同じ。`決定（owner、D-113 J3）`、2026-10-08、TD-195。不採用: 行ごとに円未満を切り捨てる〈メーカーの伝票は切り捨てが多い、台帳 L-135。ばらした商品で伝票の合計と 1 円ずれる〉）。棚卸し記録詳細のロス原価（同じ関数。どの lane が BIZ へ移すかは Plan Packet の申し送り）。
- 原価・数量が負なら金額を求めず `ValidationFailed`（SPEC-STK-VAL-D5 と同じ。棚卸し記録詳細のロス原価は差異の絶対値を渡す）。中間は i128、合計の円は i64 へ検査付きで変換し、溢れは `ValidationFailed`。浮動小数を使わない。
- 原価が円の整数の間（D5 の前）は `原価(円) × 100` を 1/100 円として渡す（今の `valuation_line_centi` と同じ値）。

**SPEC-UNIT-D7 売価 × 数量の金額（手動販売の金額の初期値）**: `売価(円) × 数量 ÷ 基準数量` を円未満で四捨五入する（レジと同じ四捨五入〈台帳 L-136〉。`決定（owner、D-113 J4）`、2026-10-08、TD-195。不採用: 切り上げ〈店の切り売りの端数、台帳 L-135〉）。用途は [62](62-ui-manual-sale.md) UI-04-D18 の初期値だけで、利用者が直せる。

**SPEC-UNIT-D8 POS の数量（Z004・EJ）**: 本節は数量の型の契約だけを決め、Z004 の取込みの再開と EJ の取込みの配線は後続の lane（CASIO 固有）が行う。
- IO: 数量を小数 2 桁までの 100 倍の整数（`quantity_hundredths: i64`）で読む。浮動小数を通さない（D-104 の日報の個数と同じ表し方。helper は [29](29-io-daily-report-parser.md) IO-07-D2 の読み方を共有する）。レジの乗算の数量は 0.01〜9999.99（取説）で、店の実例は小数 1 桁（Z004・EJ・精算レシートとも。台帳 TD-147）。小数 3 桁以上・指数表記・空は今と同じ `InvalidNumber`。IO は商品を引かず、単位を知らない。
- BIZ: 商品を引いた後に在庫の数量へ換算する。個数の単位: `quantity_hundredths` が 100 で割り切れれば その商 を在庫の数量にし、割り切れなければその行を在庫に効かせず「整数でない数量」として利用者に示す（黙って丸めない。`1.00` は 1 として受ける）。長さの単位: 在庫の数量（cm）= `quantity_hundredths × 基準数量(100) ÷ 100` = `quantity_hundredths`（D4 の不変条件。1 m の 1/100 = 1 cm）。
- EJ の明細の金額の照合（今は `数量 × 単価 = 金額`）は、小数の数量では `quantity_hundredths × 単価 ÷ 100` を円未満で四捨五入した値と金額を比べる（レジの丸め、台帳 L-136）。実データでの確認は EJ の lane の Plan Gate の前。
- 金額は円の整数のまま。file の hash は raw bytes のまま（正規化した値で作り直さない）。日報（Z001・Z005）は D-104 のまま。

**SPEC-UNIT-D9 UI の twin と formatter**: UI の数量の換算・表示（D3）と、入力中の見込みの金額（廃棄の入力画面の合計、手動販売の金額の初期値）は TS の純関数で持つ。BIZ の関数と同じ意味の意図的な二重実装とし、同じ例の表（golden）を Rust と TS の両方の test に独立に写して意味のずれを止める（BIZ-01-D2 と同じ形）。保存された記録の金額は BIZ が返した値を表示する。formatter は `ProductStockUnit` を受けて全 variant を網羅する（wildcard を置かない。単位を足すと compile error）。

**SPEC-UNIT-D10 在庫少の判定と商品 CSV**: 在庫少は、個数の単位（10 個の code）を一般の基準、長さの単位（`m`・`cm`）を生地の基準で比べる（今の `stock_unit = 'pcs'` / `'cm'` の 2 分岐を数量の種類の分岐にする。SQL の code の並びは `ProductStockUnit` の全 variant から作り、どちらにも入らない単位が在庫少から黙って漏れることを test で止める）。基準の画面の語と cm の入力は変えない。商品 CSV の任意列 `在庫単位` は code（`pcs` 等）か表示の語（`個` 等。D1 の表の 12 語）を受け、code に正規化する。空は `pcs`（今どおり）。それ以外は preview の行の error（今は commit の DB CHECK で取込み全体が止まる）。`原価` の列は D5 の後は小数 2 桁まで。

**SPEC-UNIT-D11 wire の単位の型**: wire に出る `stock_unit` はすべて generated enum `ProductStockUnit` にする（今 `string` の記録詳細の明細 6 種〈入庫・返品・手動販売・廃棄・CSV 取込み・棚卸し〉も）。棚卸しの計数の明細 `StocktakeItemDetail` は単位を持たないので足す（m の実数の入力に要る。[73](73-ui-stocktake.md)）。repo は DB の値を `parse_stock_unit` で読み、一覧に無い値は読取りの error。file 由来の商品 CSV の行（`ImportRow.stock_unit`）は `String` のまま（D-061 / D-064 の二層）。

**シグネチャ**（BIZ の新しい module `biz::unit_amount`。35 §20.5a の 3 関数をここへ移し、棚卸し・入出庫・手動販売の詳細が共有する）:
```
pub enum StockUnitKind { Count, Length }
pub fn stock_unit_kind(unit: ProductStockUnit) -> StockUnitKind
pub fn price_basis_quantity(unit: ProductStockUnit) -> i64
pub fn cost_line_centi(cost_price_centi: i64, quantity: i64, basis: i64, product_code: &str) -> Result<i128, BizError>
pub fn cost_total_yen(lines: &[i128]) -> Result<i64, BizError>
pub fn sale_amount_yen(selling_price: i64, quantity: i64, basis: i64) -> Result<i64, BizError>
pub fn stock_quantity_from_pos(quantity_hundredths: i64, unit: ProductStockUnit) -> Result<i64, PosQuantityError>
```

---

## 共通型定義

### DbError列挙型

```
enum DbError {
    ConnectionFailed(String),
    PragmaFailed(String),
    MigrationFailed(String),
    QueryFailed(String),
    DuplicateKey(String),
    ForeignKeyViolation(String),
    NotFound,
    SchemaNewerThanApp { db_version: i64, app_max: i64 },  // DB の版がアプリより新しい（22 MNT-03-D11）
}
```

### PaginatedResult構造体

```
struct PaginatedResult<T> {
    items: Vec<T>,
    total_count: u32,
    page: u32,
    per_page: u32,  // 実際に適用された1ページ件数。上限挙動は各一覧APIの契約に従う
}
```

Pagination upper-bound policy is intentionally module-specific. D-031 introduced the real shared `PAGINATION_MAX_PER_PAGE = 200` constant for IO-layer clamps: `search_products`, stocktake item lists, and system log lists clamp to 200 and return the clamped value in `PaginatedResult.per_page`. D-081 raises the inventory movement / record BIZ lists' `MAX_PER_PAGE = 200` reject boundary without changing the reject mechanism, while sales import history lists keep their existing 100 reject behavior.

---

### 更新履歴

| 日付 | PR | 内容 |
|---|---|---|
| 2026-08-16 | PR #79 | D-071 / SPEC-SDI-D1〜D4: CSV取込みの自然冪等性を同日別hashの追加取込みとper-import訂正へ改訂。 |
| 2026-10-07 | 単位の拡張 design lane | D-113 / SPEC-UNIT-D1〜D11（proposed・未実装）: 単位を 12 種へ、長さの m の入力と表示、価格の基準数量と POS の数量 1、原価の 1/100 円、原価 × 数量・売価 × 数量の丸め、POS の数量の 100 倍の整数、在庫少と商品 CSV の単位、wire の単位の enum を追加。 |
| 2026-10-08 | 単位の拡張 design lane | D-113 の owner の判断 J1〜J4 の決定（TD-195）を SPEC-UNIT-D1・D5・D6・D7 に反映（`ball` を入れる、原価は 1/100 円、入庫の丸めは TD-023 と同じ、手動販売の金額の初期値は四捨五入）。 |
