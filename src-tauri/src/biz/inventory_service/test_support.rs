//! テスト共通ヘルパー（inventory_service サブモジュール共用）

use crate::db::product_repo;
use crate::db::{self, DbConnection};
use tempfile::TempDir;

pub(super) fn setup_test_db() -> (TempDir, DbConnection) {
    let dir = tempfile::tempdir().unwrap();
    let db_path = dir.path().join("test.db");
    let conn = db::init_database(db_path.to_str().unwrap()).unwrap();
    (dir, conn)
}

pub(super) fn create_test_product(conn: &DbConnection, code: &str, stock: i64) {
    product_repo::insert_product(
        conn,
        &product_repo::NewProduct {
            product_code: code.to_string(),
            jan_code: None,
            name: format!("テスト商品 {}", code),
            department_id: 1,
            supplier_id: None,
            selling_price: 500,
            cost_price: 300,
            tax_rate: "10".to_string(),
            maker_code: None,
            stock_quantity: stock,
            stock_unit: "pcs".to_string(),
            is_discontinued: false,
            plu_dirty: true,
            plu_exported_at: None,
            plu_target: true,
            pos_stock_sync: true,
        },
    )
    .unwrap();
    // 写しは記録から求め直すので、同じ値の初期在庫の movement も入れる（Matrix T3）
    if stock != 0 {
        crate::db::test_support::insert_initial_stock_movement(conn, code, stock, stock);
    }
}

/// PLU登録済みの商品を作成するヘルパー（plu_dirty=false, plu_exported_at あり）
pub(super) fn create_plu_exported_product(conn: &DbConnection, code: &str, stock: i64) {
    product_repo::insert_product(
        conn,
        &product_repo::NewProduct {
            product_code: code.to_string(),
            jan_code: None,
            name: format!("PLU登録済み商品 {}", code),
            department_id: 1,
            supplier_id: None,
            selling_price: 500,
            cost_price: 300,
            tax_rate: "10".to_string(),
            maker_code: None,
            stock_quantity: stock,
            stock_unit: "pcs".to_string(),
            is_discontinued: false,
            plu_dirty: false,
            plu_exported_at: Some("2026-04-01T12:00:00".to_string()),
            plu_target: true,
            pos_stock_sync: true,
        },
    )
    .unwrap();
    // 写しは記録から求め直すので、同じ値の初期在庫の movement も入れる（Matrix T3）
    if stock != 0 {
        crate::db::test_support::insert_initial_stock_movement(conn, code, stock, stock);
    }
}

pub(super) fn create_test_supplier(conn: &DbConnection) -> i64 {
    product_repo::find_or_create_supplier(conn, "テスト取引先")
        .unwrap()
        .id
}

/// 単位を指定して商品を作るヘルパー
pub(super) fn create_test_product_with_unit(
    conn: &DbConnection,
    code: &str,
    stock: i64,
    unit: &str,
) {
    create_test_product(conn, code, stock);
    conn.execute(
        "UPDATE products SET stock_unit = ?1 WHERE product_code = ?2",
        rusqlite::params![unit, code],
    )
    .unwrap();
}

pub(super) fn stock_of(conn: &DbConnection, code: &str) -> i64 {
    conn.query_row(
        "SELECT stock_quantity FROM products WHERE product_code = ?1",
        [code],
        |row| row.get(0),
    )
    .unwrap()
}

/// 表ごとの行数と在庫の合計（保存を拒んだときに何も書かれていないことの比較に使う）
pub(super) fn write_surface(conn: &DbConnection, tables: &[&str]) -> Vec<i64> {
    let mut surface: Vec<i64> = tables
        .iter()
        .map(|table| {
            conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| {
                row.get(0)
            })
            .unwrap()
        })
        .collect();
    surface.push(
        conn.query_row(
            "SELECT COALESCE(SUM(stock_quantity), 0) FROM products",
            [],
            |row| row.get(0),
        )
        .unwrap(),
    );
    surface
}

/// `ValidationFailed` で、文が一致し、何も書かれていないことを確かめる
pub(super) fn assert_rejected_without_writes<T: std::fmt::Debug>(
    conn: &DbConnection,
    tables: &[&str],
    before: &[i64],
    result: Result<T, crate::biz::BizError>,
    message: &str,
) {
    assert!(
        matches!(result, Err(crate::biz::BizError::ValidationFailed(ref m)) if m == message),
        "{message}: {result:?}"
    );
    assert_eq!(write_surface(conn, tables), before, "{message}");
}
