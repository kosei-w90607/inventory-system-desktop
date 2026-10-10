## 19. BIZ-05: 売上集計ロジック

> **2026-06-30 REQ-401 redesign note**: 既存BIZ-05は `sale_records` 由来の商品別売上を日次/月次レポートとして返す。current operation の公式日報入力は Z001/Z002/Z005 であり、これは `daily_report_imports` / `daily_report_*_lines` 由来の集計データである。BIZ-05は今後、公式日報集計と商品別売上明細を分けて返す。日報集計を `sale_records` に擬似展開しない。

### 単位の拡張の後の数量（proposed・未実装、D-113）

[共通規則](10-common-rules.md) SPEC-UNIT-D3 の「表示する所」（owner の決定 TD-203: 長さの商品の数量は m、単価は 1 m あたり）の BIZ-05 の側。以下の本文は現行実装の契約である。
- `DailySaleItem` に `stock_unit: ProductStockUnit` を足す（`quantity` は今どおり在庫の数量、長さは cm）。`DeptSubtotal`・`GrandTotal`・`MonthlySaleItem` の `quantity: i64` を `count_points: i64`（個数の種類の数量の和）と `length_cm: i64`（長さの種類の数量の和、cm）に置き換える。`MonthlySaleItem` の商品別の行はどちらか一方だけが値を持ち、`stock_unit: ProductStockUnit | null`（商品別だけ値）で数量の種類を運ぶ（販売と返品が相殺して `(0, 0)` になった長さの商品の行を `0 m` で出すため。SPEC-UNIT-D11）。集計の読取りを安全な整数の範囲で検査して拒むことはしない（[共通規則](10-common-rules.md) の「入力の上限と安全な整数の範囲」の (d): 1 明細の数量の上限 `9999999` の下では、1 つの集計が `9007199254740991` を越えるのに 900,720,016 件の明細が要る）。CSV（§19.5）は画面と同じ値から書く。
- 部門小計・総合計・月次の部門別は、数量の種類ごとに 2 本に分けて足す（SPEC-UNIT-D3 の集計の規則、owner の決定 TD-206・TD-207）。個数の種類の 10 単位は単位をまたいで `count_points` に足し、`m`・`cm` は `length_cm` に足す（`pcs` 3・`sheet` 2・`m` 130・`cm` 50 の日は `count_points` 5・`length_cm` 180）。種類は `biz::unit_amount::stock_unit_kind` で決める。月次の部門別は、SQL を部門と商品の単位で GROUP BY して BIZ で種類ごとに足すか、SQL の `SUM(CASE …)` の単位の並びを `ProductStockUnit` の全 variant から作る（SPEC-UNIT-D10 と同じ。`SUM(sr.quantity)` を部門だけで足したままにしない）。和は checked で足し、i64 の溢れは `ValidationFailed`（範囲の契約ではなく溢れの扱い。今の部門小計と総合計は plain の `+=` と `sum()`: `sales_service.rs:229`・`:244`）。SQL の `SUM` の溢れは SQLite の error のまま。
- §19.5 の CSV の `数量` の列: 商品の行（日次・月次の商品別）は在庫の数量を表示の単位の数で書く（個数の商品は今と同じ整数、`m`・`cm` の商品はどちらも m の数 `1.3`〈SPEC-UNIT-D3、長さは m・cm とも m で出す〉）。集計の行（月次の部門別）は画面と同じ文字列（`5 点・1.8 m`。個数の商品だけの部門は今と同じ整数）。
- レジの日報（公式日報）の数量（D-104）は変えない。
- テスト（単位の lane の完了条件）: 上限の端の数量の集計が正確に出る。同じ日・同じ部門の長さの商品 A の明細 `9999999`（cm）が 2 件、B の明細 `-9999999` が 1 件 → A の行 `19999998`、B の行 `-9999999`、部門小計と総合計の `length_cm` は `9999999`、`count_points` は 0 で、`get_daily_sales` は成功する。月次の商品別・部門別も同じ形で 1 つずつ。

### 19.1 モジュール構成

```
src-tauri/src/
  biz/
    sales_service.rs  -- 日次・月次売上集計
```

### 19.2 型定義

**DailySalesReport構造体**:

```
struct DailySalesReport {
    date: String,                          // 対象日（YYYY-MM-DD）
    items: Vec<DailySaleItem>,             // 商品別売上一覧
    department_subtotals: Vec<DeptSubtotal>, // 部門小計
    grand_total: GrandTotal,               // 総合計
    official_daily_report: Option<OfficialDailyReportSummary>, // Z001/Z002/Z005日報集計。未取込みならNone
}
```

**DailySaleItem構造体**:

```
struct DailySaleItem {
    product_code: String,
    name: String,
    department_name: String,
    department_id: i64,
    quantity: i64,       // 売上帳票視点（+販売/-返品）
    amount: i64,         // 金額（円）
    source: DailySaleSource, // "auto" / "manual"
}
```

**DeptSubtotal構造体**:

```
struct DeptSubtotal {
    department_id: i64,
    department_name: String,
    quantity: i64,
    amount: i64,
}
```

**GrandTotal構造体**:

```
struct GrandTotal {
    quantity: i64,
    amount: i64,
}
```

**OfficialDailyReportSummary構造体（REQ-401 redesign target）**:

```
struct OfficialDailyReportSummary {
    source_import_count: i64,
    report_date: String,
    gross_amount: Option<i64>,
    net_amount: Option<i64>,
    payment_lines: Vec<OfficialDailyPaymentLine>,
    department_lines: Vec<OfficialDailyDepartmentLine>,
    warnings: Vec<String>,
    summary_imports: Vec<OfficialDailySummaryImport>, // Z001の全行を取込みごとに。imported_at ASC, id ASC。合算しない（D-096）
}
```

**OfficialDailySummaryImport構造体**:

```
struct OfficialDailySummaryImport {
    daily_report_import_id: i64,          // UIのkeyと取込みの識別
    imported_at: String,                  // YYYY-MM-DDTHH:MM:SS（daily_report_imports.imported_at）
    lines: Vec<OfficialDailySummaryLine>, // sort_order ASC, id ASC
}
```

**OfficialDailySummaryLine構造体**:

```
struct OfficialDailySummaryLine {
    label: String,          // 保存されたZ001のラベルをそのまま
    quantity: Option<f64>,  // 総売の行の個数（単位の数、小数 2 桁まで。それ以外の行はNone）
    count: Option<i64>,     // 総売以外の行の件数（総売の行はNone）
    amount: Option<i64>,
}
```

- `summary_imports` は `report_date=date AND status='completed'` の親ごとに1件で、件数は `source_import_count` と等しい。`line_key`（総売・純売以外は並び順から作る `summary_N`）は利用者に意味を持たないため返さない。
- `OfficialDailyReportSummary` の field の並びは code の struct と生成 bindings の並びと同じとする。wire の field 列は `src-tauri/tests/import_internal_contract_test.rs` の wire 契約 test が完全一致で固定し、`summary_imports` は既存 7 field（`source_import_count` 〜 `warnings`）の後ろに足す。

**OfficialDailyPaymentLine構造体**:

```
struct OfficialDailyPaymentLine {
    payment_key: String,
    label: String,
    amount: Option<i64>,
    count: Option<i64>,
}
```

**OfficialDailyDepartmentLine構造体**:

```
struct OfficialDailyDepartmentLine {
    department_id: Option<i64>,
    raw_department_name: String,
    normalized_department_name: Option<String>,
    amount: i64,
    quantity: Option<f64>,  // 単位の数（小数 2 桁まで）
    count: Option<i64>,
}
```

日報（Z001 / Z005）の個数は DB と IO の DB DTO では 100 倍の整数（`quantity_hundredths`）、wire（`OfficialDailySummaryLine` / `OfficialDailyDepartmentLine` / `OfficialMonthlyDepartmentTotal` の `quantity`）では単位の数（`f64`）とする。変換は BIZ-05 の写像（`map_official_daily_report` と月次の写像）で IO-07 の `quantity_hundredths_to_units` を呼ぶだけで、ほかの値は変えない（IO-07-D2、D-104）。TypeScript の型は `number | null` のまま変わらず、UI は今までどおり `toLocaleString("ja-JP")` で出す（`1.3` は `1.3`、整数は小数点なし。UI-09a-D16 の「数は `toLocaleString`」の前提を保つ）。件数（`count`）と金額は整数のまま。

**MonthlySalesReport構造体**:

```
struct MonthlySalesReport {
    month: String,                                  // 対象月（YYYY-MM）
    mode: SalesMode,                                // 集計モード
    items: Vec<MonthlySaleItem>,                    // 集計結果
    prev_month_comparison: Option<Vec<MonthlySaleItem>>, // 前月比較（取得できた場合）
    official_department_totals: Option<Vec<OfficialMonthlyDepartmentTotal>>, // Z005日報集計由来。日報未取込みならNone
}
```

**MonthlySaleItem構造体**:

```
struct MonthlySaleItem {
    key: String,            // 商品別: product_code / 部門別: department_id の文字列
    label: String,          // 商品別: 商品名 / 部門別: 部門名
    quantity: i64,
    amount: i64,
    ranking: u32,           // amount降順のランキング（1始まり）
}
```

**OfficialMonthlyDepartmentTotal構造体（REQ-401 redesign target）**:

```
struct OfficialMonthlyDepartmentTotal {
    department_id: Option<i64>,
    label: String,
    amount: i64,
    quantity: Option<f64>,  // 単位の数（月の SUM を 100 倍の整数で足してから戻す）
    count: Option<i64>,
}
```

**SalesMode列挙型**:

```
enum SalesMode {
    ByProduct,      // 商品別
    ByDepartment,   // 部門別
}
```

---

### 19.3 get_daily_sales

**関数要求**: 指定日の売上データを商品別に集計し、部門小計と総合計を含むレポートを返す。is_voided=0 のレコードのみ対象

**シグネチャ**:
```
fn get_daily_sales(conn: &DbConnection, date: &str) -> Result<DailySalesReport, BizError>
```

**前提条件**: conn は &DbConnection（autocommit）。読み取り専用クエリのためTX不要

**処理ステップ**:

1. **日付バリデーション**
   - date が YYYY-MM-DD 形式でない → BizError::ValidationFailed("日付の形式が不正です（YYYY-MM-DD）")
   - chrono で暦妥当性チェック（2月30日等）→ BizError::ValidationFailed("存在しない日付です")

2. **商品別売上取得と同日active import加算**
   - sales_repo::get_daily_sales_records(conn, date) → Vec<DailySaleItem>
   - SQLは `sale_date=? AND is_voided=0` の全行を対象にし、`product_code + source` でquantity / amountを合計する。Z004の同日複数import由来行をすべて含める
   - `source='auto'` と `source='manual'` は別groupとし、同一商品でも統合しない。表示名・部門はproduct_codeから決定し、結果を部門ID、商品コード、sourceの決定順で返す
   - 0件でも正常（データなしの日）

3. **公式日報集計取得（REQ-401 redesign target）**
   - sales_repo::get_completed_daily_report_aggregate(conn, date) → Option<OfficialDailyReportRow>（IO の DB DTO）を、`map_official_daily_report` で `OfficialDailyReportSummary` へ写す。warning は BIZ がここで作る
   - `report_date=date AND status='completed'` の親を全件対象とし、`source_import_count` に親件数を返す。単一parent IDはwireへ返さない（`summary_imports` の要素の取込み ID は除く、D-096）
   - 親gross/netは合計する。ただし対象親のいずれかがNULLなら集約値もNULLとし、不完全値を確定値に見せない
   - paymentは `payment_key` で、departmentは `department_id`、未対応行は `normalized_department_name` fallback `raw_department_name` で集約する。amountは合計し、optional quantity/countは対象行のいずれかがNULLなら集約値もNULLとする
   - labelとsortはgroup内の最小 `sort_order`、同値なら最小row IDの行を決定的な代表とする
   - 日報未取込みでも正常。`official_daily_report=None` とし、UIは「日報未取込み」と表示できる
   - SALES2-D5: 集約後の `department_id IS NULL` groupが n 件ある場合、`warnings` に「部門マスタと対応していない部門が n 件あります（部門名のまま表示しています）」を1件だけ追加する。importごとに警告を重複させない。NULL groupがなければ空配列
   - Z001の行は合算しない。IO が同じ親の集合について親ごとに返す取込み（`OfficialDailyReportRow.summary_imports`）を、並びと値を変えずに `OfficialDailySummaryImport` / `OfficialDailySummaryLine` へ写し、`summary_imports` に取込みの古い順で返す（D-096、[24 §14.21](24-io-csv-import-repo.md#1421-get_completed_daily_report_aggregate)）

4. **部門小計の計算**
   - items を department_id でグルーピング
   - 各グループの quantity, amount を合計 → Vec<DeptSubtotal>
   - 部門IDの昇順でソート

5. **総合計の計算**
   - 全 items の quantity, amount を合計 → GrandTotal

6. **結果返却**
   - DailySalesReport { date, items, department_subtotals, grand_total, official_daily_report }

**設計判断 — 日報集計と商品別明細を分ける**:
- `official_daily_report` はレジ日報の公式集計を表す。
- `items` / `department_subtotals` / `grand_total` はZ004または手動販売出庫に基づく商品別売上を表す。
- Z001/Z002/Z005は商品別明細を持たないため、`items` を水増ししない。
- UIは、日報集計と商品別明細の差を「日報集計」「商品別（PLU/Z004・手動販売）」のように日本語で分けて表示する。
- 公式日報seriesと商品別seriesは別の正本であり、互いを加算して一つの売上値にしない。
- 公式日報seriesの中でも、Z001の行は足してよいと確かめていないため取込みごとに返し、支払・部門のように合算しない（D-096）。

**エラーハンドリング**:
- 日付形式不正 → BizError::ValidationFailed(メッセージ)
- 暦妥当性エラー → BizError::ValidationFailed(メッセージ)
- DB読み取り失敗 → BizError::DatabaseError(DbError)

**入力例**:
```
date: "2026-03-21"
```

**出力例**:
```
Ok(DailySalesReport {
    date: "2026-03-21",
    items: [
        DailySaleItem { product_code: "4976383262108", name: "ﾊﾏﾅｶ ｱﾐｱﾐ極太", department_name: "毛糸", quantity: 3, amount: 1782, source: "auto" },
        DailySaleItem { product_code: "HZ-0099", name: "ヘアゴムA", department_name: "ヘア雑貨", quantity: 1, amount: 880, source: "manual" },
    ],
    department_subtotals: [
        DeptSubtotal { department_id: 2, department_name: "ヘア雑貨", quantity: 1, amount: 880 },
        DeptSubtotal { department_id: 3, department_name: "毛糸", quantity: 3, amount: 1782 },
    ],
    grand_total: GrandTotal { quantity: 4, amount: 2662 },
})
```

---

### 19.4 get_monthly_sales

**関数要求**: 指定月の売上データを商品別または部門別に集計し、ランキングと前月比較を含むレポートを返す。is_voided=0 のレコードのみ対象

**シグネチャ**:
```
fn get_monthly_sales(
    conn: &DbConnection,
    month: &str,
    mode: SalesMode,
) -> Result<MonthlySalesReport, BizError>
```

**前提条件**: conn は &DbConnection（autocommit）。読み取り専用クエリのためTX不要

**処理ステップ**:

1. **月バリデーション**
   - month が YYYY-MM 形式でない → BizError::ValidationFailed("月の形式が不正です（YYYY-MM）")
   - 月の範囲チェック（01-12）→ BizError::ValidationFailed("存在しない月です")

2. **対象月の日付範囲を導出**
   - date_from = "{month}-01"
   - date_to = 月末日を計算（例: 2026-03 → "2026-03-31"）

3. **モード別集計（商品別売上明細）**
   - ByProduct:
     - sales_repo::get_monthly_sales_by_product(conn, date_from, date_to) → Vec<(product_code, name, quantity, amount)>
     - key = product_code, label = name
   - ByDepartment:
     - sales_repo::get_monthly_sales_by_department(conn, date_from, date_to) → Vec<(department_id, department_name, quantity, amount)>
     - key = department_id.to_string(), label = department_name

4. **ランキング付与（商品別売上明細）**
   - amount の降順でソート
   - 1始まりの ranking を付与
   - 同額の場合は同順位（dense rank ではなく row number）

5. **前月比較（商品別売上明細）**
   - 前月を計算: YYYY-MM → 1ヶ月前（2026-01 → 2025-12 の年境界に注意）
   - 前月の同集計をステップ3-4と同じ方法で取得
   - 取得できた場合は Some(prev_items)、前月データなしは Some(空Vec)

6. **公式日報部門集計（REQ-401 redesign target）**
   - sales_repo::get_monthly_official_department_totals(conn, date_from, date_to) → Option<Vec<OfficialMonthlyDepartmentTotal>>
   - `daily_report_department_lines` を `daily_report_imports.status='completed'` かつ `report_date BETWEEN date_from AND date_to` で集計する
   - 同一日の複数completed親もすべて加算する。日次の追加取込みが月次合計へ加算されることを回帰契約とする
   - mode に関係なく `official_department_totals` として返す
   - 日報取込みが1件もない月は `None`。一部日だけ日報がある月は取得済み日だけの合計とする。将来coverage countを返す場合はparent件数ではなく `COUNT(DISTINCT report_date)` を使う
   - 公式日報部門集計と商品別集計は別seriesとして返し、両者を加算しない

7. **結果返却**
   - MonthlySalesReport { month, mode, items, prev_month_comparison, official_department_totals }

**エラーハンドリング**:
- 月形式不正 → BizError::ValidationFailed(メッセージ)
- DB読み取り失敗 → BizError::DatabaseError(DbError)

**設計判断 — ranking を items に埋め込む（architecture/cmd-task-specs.md との差異）**:
- architecture/cmd-task-specs.md CMD-09 は `MonthlySalesReport(items[], rankings[], prev_month_comparison)` と ranking を独立配列で記載
- 本設計では `MonthlySaleItem.ranking` として items に埋め込む。理由: ranking は items の amount 降順と1:1対応しており、別配列にすると items とのインデックス同期が必要になる。埋め込みの方がUI側の実装が単純

**設計判断 — 全件返却（ページングなし）**:
- 先決事項D-5 に基づき、初期実装では全件返却
- 4000商品の月次集計でもJSON応答は数MB（許容範囲）
- パフォーマンス問題が発生した場合は LIMIT/OFFSET を追加

**設計判断 — 前月比較の年境界処理**:
- 2026年1月 → 前月は2025年12月
- chrono の NaiveDate 演算で month - 1 を計算（年のロールオーバーを自動処理）
- テストで12月→1月の境界を明示的にカバーすること

---

### 19.5 export_sales_csv

**関数要求**: 指定日または指定月の売上データをCSVバイト列としてエクスポートする。日次・月次（商品別/部門別）の3種類のレポート形式をサポート

**型定義**:

```
enum SalesReportType {
    Daily,              // 日次（target: YYYY-MM-DD）
    MonthlyByProduct,   // 月次・商品別（target: YYYY-MM）
    MonthlyByDepartment,// 月次・部門別（target: YYYY-MM）
}

struct SalesCsvExportResult {
    csv_bytes: Vec<u8>,          // UTF-8 BOM付きCSVバイト列
    count: usize,                // レコード件数
    suggested_filename: String,  // 推奨ファイル名
}
```

**シグネチャ**:
```
fn export_sales_csv(
    conn: &DbConnection,
    report_type: &SalesReportType,
    target: &str,
) -> Result<SalesCsvExportResult, BizError>
```

**前提条件**: conn は &DbConnection（autocommit）。読み取り専用クエリのためTX不要

**処理ステップ**:

1. **report_type で分岐してデータ取得 + CSV構築**
   - Daily:
     - get_daily_sales(conn, target) を呼ぶ
     - ヘッダ: `["商品コード", "商品名", "部門", "数量", "金額", "記録元"]`
     - rows: items → [product_code, name, department_name, quantity, amount, translate_source(source)]
     - suggested_filename: `sales_daily_{target}.csv`
   - MonthlyByProduct:
     - get_monthly_sales(conn, target, SalesMode::ByProduct) を呼ぶ
     - ヘッダ: `["ランク", "商品コード", "商品名", "数量", "金額"]`
     - rows: items → [ranking, key, label, quantity, amount]
     - suggested_filename: `sales_monthly_product_{target}.csv`
   - MonthlyByDepartment:
     - get_monthly_sales(conn, target, SalesMode::ByDepartment) を呼ぶ
     - ヘッダ: `["ランク", "部門名", "数量", "金額"]`
     - rows: items → [ranking, label, quantity, amount]
     - suggested_filename: `sales_monthly_dept_{target}.csv`

2. **CSV生成**
   - report_csv_exporter::export_csv(&headers, &rows) → Vec<u8>（UTF-8 BOM付き、CRLF改行）

3. **結果返却**
   - SalesCsvExportResult { csv_bytes, count: items.len(), suggested_filename }

**エラーハンドリング**:
- 日付/月形式不正 → BizError::ValidationFailed（get_daily_sales/get_monthly_sales 内でバリデーション済み）
- DB読み取り失敗 → BizError::DatabaseError(DbError)

**設計判断 — source の日本語変換**:
- CSV出力では "auto" → "POS"、"manual" → "手動" に変換。利用者向け帳票のため英語識別子のままでは不親切
- 内部ヘルパー translate_source で変換。未知の値は防御的にそのまま通す

**設計判断 — 既存関数の再利用**:
- get_daily_sales / get_monthly_sales を内部で呼び出す。日付バリデーション・DBクエリ・集計ロジックの重複を避ける
- CSV列構造のみが新規ロジック。IO-05 export_csv は純関数で既実装

---

### 19.6 非目的

このモジュールが**やらないこと**を明示する。責務境界の誤解を防ぐため。

| やらないこと | 理由 | 責務を持つモジュール |
|------------|------|-----------------|
| sale_records への書き込み | 読み取り専用モジュール | BIZ-03（CSV取込み）, BIZ-02（手動販売） |
| is_voided レコードの操作 | ロールバック処理 | BIZ-03 rollback_csv_import |
| 在庫変動の集計 | 在庫変動履歴は別ドメイン | BIZ-02 / CMD-06 list_movements |
| ページング処理 | 初期実装では全件返却（先決事項D-5） | 将来追加時はこのモジュール内 |

### 19.7 対応不変条件

| 不変条件 | 本モジュールでの対応 |
|---------|-----------------|
| INV-1: quantity符号規約 | sale_records.quantity を売上帳票視点でそのまま返す（+販売/-返品）。符号変換しない |
| INV-4: is_voided の使用範囲 | WHERE is_voided = 0 で voided レコードを除外。voided を操作する処理は持たない |

### 更新履歴

| 日付 | PR | 内容 |
|---|---|---|
| 2026-08-16 | PR #79 | SPEC-SDI-D6: 商品別 `product_code + source` 集約、全completed日報親のNULL安全な日次集約、`source_import_count`、月次additive regressionを正本化。 |
| 2026-09-27 | daily-report-z-display（design） | `OfficialDailyReportSummary.summary_imports` と `OfficialDailySummaryImport` / `OfficialDailySummaryLine` を追加。Z001の行は取込みごとに返し合算しない（D-096、[Plan Packet](../archive/plans/2026-09-27-daily-report-z-display.md)）。 |
| 2026-10-04 | daily-report-import-gaps（plan-first） | 日報の個数の wire を単位の数（`f64`）にし、DB の 100 倍の整数から BIZ-05 で戻す（IO-07-D2、D-104）。 |
| 2026-10-08 | 単位の拡張 design lane | 冒頭に単位の拡張の後の数量（proposed・未実装、D-113 / SPEC-UNIT-D3・D11、owner の決定 TD-203）を追加: 売上の wire の単位と、単位の違う商品の数量を数量の種類ごとの 2 本（点と m）に分けて出す規則（TD-206・TD-207）。 |
| 2026-10-06 | z001-display（runtime、起票） | §19.2 の `OfficialDailyReportSummary` の field の並びを code（`sales_service.rs` の struct）と生成 bindings に合わせた（`source_import_count` を先頭へ。PR #114 Final Review の P3、[Plan Packet](../archive/plans/2026-10-06-z001-display.md)）。 |
