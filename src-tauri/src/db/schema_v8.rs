//! migration v8: 単位を 12 個の code へ広げる（products の作り直し）と、保存済みの値の上限の検査
//!
//! docs/function-design/22-mnt-migration.md §16 / MNT-03-D13（vU）/ D-113 に基づく実装。
//! SQLite は CHECK を ALTER で変えられないので `products` を作り直す。値は変えない。

use super::{migration_tx, DbError};
use rusqlite::{params, Connection};

/// 1 明細の数量・在庫・変動の数量・売価・原価（円）・円の合計の上限（v8 の時点の値。migration の履歴として固定する）
const MAX_LINE_QUANTITY: i64 = 9_999_999;
const MAX_STOCK_QUANTITY: i64 = 999_999_999;
const MAX_MOVEMENT_QUANTITY: i64 = 1_999_999_998;
const MAX_SELLING_PRICE: i64 = 999_999;
const MAX_COST_PRICE: i64 = 999_999;
const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;

/// vU の上限の検査の対象（表・列・絶対値の上限）。NULL の行は比較が偽になり除かれる
const LIMIT_CHECKS: [(&str, &str, i64); 20] = [
    ("receiving_items", "quantity", MAX_LINE_QUANTITY),
    ("return_items", "quantity", MAX_LINE_QUANTITY),
    ("manual_sale_items", "quantity", MAX_LINE_QUANTITY),
    ("disposal_items", "quantity", MAX_LINE_QUANTITY),
    ("sale_records", "quantity", MAX_LINE_QUANTITY),
    ("products", "stock_quantity", MAX_STOCK_QUANTITY),
    ("inventory_movements", "stock_after", MAX_STOCK_QUANTITY),
    ("stocktake_items", "system_stock", MAX_STOCK_QUANTITY),
    ("stocktake_items", "actual_count", MAX_STOCK_QUANTITY),
    ("inventory_movements", "quantity", MAX_MOVEMENT_QUANTITY),
    ("products", "selling_price", MAX_SELLING_PRICE),
    ("price_history", "old_selling", MAX_SELLING_PRICE),
    ("price_history", "new_selling", MAX_SELLING_PRICE),
    ("products", "cost_price", MAX_COST_PRICE),
    ("receiving_items", "cost_price", MAX_COST_PRICE),
    ("disposal_items", "cost_price", MAX_COST_PRICE),
    ("stocktake_items", "valuation_cost_price", MAX_COST_PRICE),
    ("price_history", "old_cost", MAX_COST_PRICE),
    ("price_history", "new_cost", MAX_COST_PRICE),
    ("stocktakes", "total_cost", MAX_SAFE_INTEGER),
];

/// 記録ごとの `quantity × cost_price` の和を確かめる表（表・記録の列）
const RECORD_TOTAL_CHECKS: [(&str, &str); 2] = [
    ("receiving_items", "receiving_record_id"),
    ("disposal_items", "disposal_record_id"),
];

/// v7 の時点の `products` と同じ列・同じ順・同じ制約で、`stock_unit` の CHECK だけを 12 個の code にする
const REBUILD_PRODUCTS_SQL: &str = "
CREATE TABLE products_new (
    product_code TEXT PRIMARY KEY,
    jan_code TEXT,
    name TEXT NOT NULL,
    department_id INTEGER NOT NULL REFERENCES departments(id),
    supplier_id INTEGER REFERENCES suppliers(id),
    selling_price INTEGER NOT NULL,
    cost_price INTEGER NOT NULL,
    tax_rate TEXT NOT NULL DEFAULT '10' CHECK(tax_rate IN ('10','8','0')),
    maker_code TEXT,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    stock_unit TEXT NOT NULL DEFAULT 'pcs' CHECK(stock_unit IN ('pcs','sheet','hon','bag','box','roll','kumi','set','ball','cho','m','cm')),
    is_discontinued BOOLEAN NOT NULL DEFAULT 0,
    plu_dirty BOOLEAN NOT NULL DEFAULT 1,
    plu_exported_at TEXT,
    pos_stock_sync BOOLEAN NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    plu_target BOOLEAN NOT NULL DEFAULT 0
);
INSERT INTO products_new (
    product_code, jan_code, name, department_id, supplier_id, selling_price, cost_price,
    tax_rate, maker_code, stock_quantity, stock_unit, is_discontinued, plu_dirty,
    plu_exported_at, pos_stock_sync, created_at, updated_at, plu_target
)
SELECT
    product_code, jan_code, name, department_id, supplier_id, selling_price, cost_price,
    tax_rate, maker_code, stock_quantity, stock_unit, is_discontinued, plu_dirty,
    plu_exported_at, pos_stock_sync, created_at, updated_at, plu_target
FROM products;
DROP TABLE products;
ALTER TABLE products_new RENAME TO products;
CREATE INDEX idx_products_jan_code ON products(jan_code);
CREATE INDEX idx_products_department_id ON products(department_id);
CREATE INDEX idx_products_is_discontinued ON products(is_discontinued);
";

/// v8 マイグレーション: 単位の CHECK を 12 個の code へ（MNT-03-D13 の vU）
///
/// Custom マイグレーション。`foreign_keys` の退避と復元は v2 と同じ形（TX の外）。
pub(crate) fn apply_v8_stock_units(conn: &Connection, version: i64) -> Result<(), DbError> {
    // 1. TX の外で foreign_keys を読み、OFF にする
    let original_fk: i64 = conn
        .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
        .map_err(|e| DbError::MigrationFailed(format!("v{version} foreign_keys読取失敗: {e}")))?;
    conn.execute_batch("PRAGMA foreign_keys = OFF;")
        .map_err(|e| DbError::MigrationFailed(format!("v{version} foreign_keys=OFF失敗: {e}")))?;

    let result = apply_v8_inner(conn, version);

    // transaction を閉じられない場合は復元を試みず、接続破棄必須として返す（MNT-03-D1）
    if !conn.is_autocommit() {
        let original_error = result
            .as_ref()
            .err()
            .map(ToString::to_string)
            .unwrap_or_else(|| "migration result was unexpectedly successful".to_string());
        tracing::error!(
            version,
            error = %original_error,
            "migration transaction could not be closed; foreign_keys restore skipped and connection must be discarded"
        );
        return Err(DbError::MigrationFailed(format!(
            "v{version} migration失敗: {original_error}（transaction 状態不明のためforeign_keysを復元せず、接続破棄必須）"
        )));
    }

    // 7（後半）. TX が閉じた後に foreign_keys を元の値に戻す
    let restore_result = migration_tx::restore_foreign_keys(conn, version, original_fk);
    match (result, restore_result) {
        (Ok(()), Ok(())) => Ok(()),
        (Err(error), Ok(())) | (Ok(()), Err(error)) => Err(error),
        (Err(original_error), Err(restore_error)) => {
            tracing::error!(
                version,
                error = %restore_error,
                original_error = %original_error,
                "migration failed and foreign_keys restore also failed"
            );
            Err(DbError::MigrationFailed(format!(
                "{original_error}; foreign_keys復元失敗も発生: {restore_error}"
            )))
        }
    }
}

/// 手順 2〜7（foreign_keys が OFF の間の 1 つの TX）
fn apply_v8_inner(conn: &Connection, version: i64) -> Result<(), DbError> {
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    conn.execute_batch("BEGIN;")
        .map_err(|e| DbError::MigrationFailed(format!("v{version} BEGIN失敗: {e}")))?;

    let result = (|| -> Result<(), DbError> {
        // 2. 行数と単位ごとの件数を読み、上限の検査を行う（読取りだけ）
        let before = product_counts(conn)?;
        check_limits(conn, version)?;

        // 3〜5. 作り直し（値は変えない）
        conn.execute_batch(REBUILD_PRODUCTS_SQL)?;

        // 6. (a) 行数 (c) 単位ごとの件数 (b) foreign_key_check
        let after = product_counts(conn)?;
        if after != before {
            return Err(DbError::MigrationFailed(format!(
                "v{version} products 検証失敗: 行数か単位ごとの件数が作り直しの前後で違います（{before:?} -> {after:?}）"
            )));
        }
        let fk_errors: i64 =
            conn.query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
                row.get(0)
            })?;
        if fk_errors != 0 {
            return Err(DbError::MigrationFailed(format!(
                "v{version} FK整合性エラー: {fk_errors}件の違反を検出"
            )));
        }

        // 7. 版を記録
        conn.execute(
            "INSERT INTO schema_versions (version, applied_at) VALUES (?1, ?2)",
            params![version, now],
        )?;
        Ok(())
    })();

    if let Err(error) = result {
        return Err(migration_tx::rollback_after_error(
            conn,
            format!("v{version} stock_unit migration失敗: {error}"),
        ));
    }
    migration_tx::commit_transaction(conn, &format!("v{version} COMMIT失敗"))
}

/// `products` の行数と、`stock_unit` の値ごとの件数
fn product_counts(conn: &Connection) -> Result<(i64, Vec<(String, i64)>), DbError> {
    let total = conn.query_row("SELECT COUNT(*) FROM products", [], |row| row.get(0))?;
    let mut statement = conn.prepare(
        "SELECT stock_unit, COUNT(*) FROM products GROUP BY stock_unit ORDER BY stock_unit",
    )?;
    let by_unit = statement
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))?
        .collect::<Result<Vec<_>, _>>()?;
    Ok((total, by_unit))
}

/// vU の上限の検査（22 §16）。上限の外の値が 1 件でもあれば、表名・列名を入れた error
fn check_limits(conn: &Connection, version: i64) -> Result<(), DbError> {
    for (table, column, limit) in LIMIT_CHECKS {
        let out_of_range: bool = conn.query_row(
            &format!("SELECT EXISTS(SELECT 1 FROM {table} WHERE {column} > ?1 OR {column} < -?1)"),
            [limit],
            |row| row.get(0),
        )?;
        if out_of_range {
            return Err(DbError::MigrationFailed(format!(
                "v{version} 上限の検査失敗: {table}.{column} に ±{limit} の範囲外の値があります"
            )));
        }
    }
    // 記録ごとの和は基準数量で割る前の値で比べる。積か和の i64 の溢れ（SUM の error・REAL）も上限の外にする
    for (table, record_column) in RECORD_TOTAL_CHECKS {
        // SUM の溢れは SQLite の error になる。その場合も上限の外として同じ文で止める
        let out_of_range = conn
            .query_row(
                &format!(
                    "SELECT EXISTS(
                         SELECT 1 FROM {table} GROUP BY {record_column}
                         HAVING typeof(SUM(quantity * cost_price)) <> 'integer'
                             OR SUM(quantity * cost_price) > ?1
                             OR SUM(quantity * cost_price) < -?1)"
                ),
                [MAX_SAFE_INTEGER],
                |row| row.get::<_, bool>(0),
            )
            .map_err(|error| {
                DbError::MigrationFailed(format!(
                    "v{version} 上限の検査失敗: {table} の {record_column} ごとの quantity × cost_price の和を求められません: {error}"
                ))
            })?;
        if out_of_range {
            return Err(DbError::MigrationFailed(format!(
                "v{version} 上限の検査失敗: {table} の {record_column} ごとの quantity × cost_price の和に ±{MAX_SAFE_INTEGER} の範囲外の値があります"
            )));
        }
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::product_repo::ProductStockUnit;

    #[test]
    fn test_v8_req903_check_codes_match_enum() {
        // REQ-903 / MNT-03-D13 / SPEC-UNIT-D1: v8 の CHECK の code の並びは enum の全 variant と同じ
        let codes: Vec<String> = ProductStockUnit::ALL
            .iter()
            .map(|unit| format!("'{}'", unit.as_str()))
            .collect();
        let check = format!("CHECK(stock_unit IN ({}))", codes.join(","));
        assert!(REBUILD_PRODUCTS_SQL.contains(&check), "{check}");
    }

    #[test]
    fn test_v8_req903_limits_match_runtime_constants() {
        // REQ-903 / MNT-03-D13（X13）: 移行の検査の上限は BIZ の検証と同じ値
        use crate::constants;
        assert_eq!(MAX_LINE_QUANTITY, constants::MAX_LINE_QUANTITY);
        assert_eq!(MAX_STOCK_QUANTITY, constants::MAX_STOCK_QUANTITY);
        assert_eq!(MAX_MOVEMENT_QUANTITY, 2 * constants::MAX_STOCK_QUANTITY);
        assert_eq!(MAX_SELLING_PRICE, constants::MAX_SELLING_PRICE);
        assert_eq!(MAX_COST_PRICE, constants::MAX_COST_PRICE);
        assert_eq!(MAX_SAFE_INTEGER, constants::MAX_SAFE_INTEGER);
    }
}
