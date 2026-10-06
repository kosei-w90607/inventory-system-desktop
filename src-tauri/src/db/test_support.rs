//! テスト共通ヘルパー

use super::DbConnection;
use crate::db::product_repo::{self, NewProduct};

pub fn setup_test_db() -> (tempfile::TempDir, DbConnection) {
    let dir = tempfile::tempdir().unwrap();
    let db_path = dir.path().join("test.db");
    let conn = crate::db::init_database(db_path.to_str().unwrap()).unwrap();
    (dir, conn)
}

/// schema 版がアプリの最大 + 1 の DB を作って閉じる（MNT-03-D11 の fixture）。足した版を返す
pub fn write_newer_schema_db(path: &std::path::Path) -> i64 {
    let conn = crate::db::init_database(path.to_str().unwrap()).unwrap();
    let newer = crate::db::migration::app_max_version() + 1;
    conn.execute(
        "INSERT INTO schema_versions (version, applied_at) VALUES (?1, '2026-09-25T00:00:00')",
        [newer],
    )
    .unwrap();
    newer
}

/// テスト用に商品を1件挿入するヘルパー
pub fn seed_product(conn: &DbConnection, product_code: &str) {
    let product = NewProduct {
        product_code: product_code.to_string(),
        jan_code: None,
        name: "テスト商品".to_string(),
        department_id: 1,
        supplier_id: None,
        selling_price: 500,
        cost_price: 300,
        tax_rate: "10".to_string(),
        maker_code: None,
        stock_quantity: 0,
        stock_unit: "pcs".to_string(),
        is_discontinued: false,
        plu_dirty: true,
        plu_exported_at: None,
        plu_target: true,
        pos_stock_sync: true,
    };
    product_repo::insert_product(conn, &product).unwrap();
}

/// テスト用に取引先を作成するヘルパー
pub fn seed_supplier(conn: &DbConnection) -> i64 {
    conn.execute(
        "INSERT INTO suppliers (name, created_at) VALUES ('テスト取引先', '2026-04-06T00:00:00')",
        [],
    )
    .unwrap();
    conn.last_insert_rowid()
}

/// v7 の DB に時点証拠 schema を当てる（SPEC-STK-TIME-D8。registry には登録しない、D-109 (2)）。
/// `schema_versions` に `app_max_version()+1` が入るので、この DB を `init_database` で開き直さない（MNT-03-D11）
pub fn apply_time_evidence(conn: &DbConnection) {
    super::schema_time_evidence::apply_time_evidence_schema(
        conn,
        crate::db::migration::app_max_version() + 1,
    )
    .unwrap();
}

/// 時点証拠 schema を当てた空の試験 DB
pub fn setup_time_evidence_db() -> (tempfile::TempDir, DbConnection) {
    let (dir, conn) = setup_test_db();
    apply_time_evidence(&conn);
    (dir, conn)
}

/// `seed_legacy_fixture` の旧明細: (商品コード, 棚卸しID, 当てた後の observation_kind)。
/// 分類は tracking「移行と保存TX」の表から決めた期待値（AC3）
pub const LEGACY_ITEM_KINDS: [(&str, i64, &str); 8] = [
    ("LG-MEAS", 1, "legacy"),      // 完了済み header の数量と時刻あり
    ("LG-UNC", 2, "uncounted"),    // 両 NULL
    ("LG-AUTO", 2, "auto_filled"), // actual 0・system 0・時刻 NULL（廃番の商品）
    ("LG-MEAS", 2, "legacy"),      // 数量と時刻あり
    ("LG-ODD", 2, "legacy"),       // 矛盾形: 数量 NULL・時刻あり
    ("LG-A35", 2, "legacy"),       // actual 3・system 5・時刻 NULL
    ("LG-A05", 2, "legacy"),       // actual 0・system 5・時刻 NULL
    ("LG-A33", 2, "legacy"),       // actual 3・system 3・時刻 NULL
];

/// v7 の上に旧 header・旧明細の各形・旧 import・売上・movement を生の SQL で作る
/// （`legacy_stop_tests` の F3 と同じ形。旧 BIZ の `legacy_*` は呼ばない）。合成値だけ
pub fn seed_legacy_fixture(conn: &DbConnection) {
    conn.execute_batch(
        "INSERT INTO products (product_code, jan_code, name, department_id, selling_price, cost_price,
            tax_rate, stock_quantity, stock_unit, is_discontinued, plu_dirty, pos_stock_sync,
            created_at, updated_at) VALUES
         ('LG-MEAS','2900000010001','合成旧A',1,100,50,'10',3,'pcs',0,1,1,'2026-03-01T09:00:00','2026-03-01T09:00:00'),
         ('LG-UNC', '2900000010002','合成旧B',1,100,50,'10',4,'pcs',0,1,1,'2026-03-01T09:00:00','2026-03-01T09:00:00'),
         ('LG-AUTO','2900000010003','合成旧C',1,100,50,'10',0,'pcs',1,1,1,'2026-03-01T09:00:00','2026-03-01T09:00:00'),
         ('LG-ODD', '2900000010004','合成旧D',1,100,50,'10',2,'pcs',0,1,1,'2026-03-01T09:00:00','2026-03-01T09:00:00'),
         ('LG-A35', '2900000010005','合成旧E',1,100,50,'10',5,'pcs',0,1,1,'2026-03-01T09:00:00','2026-03-01T09:00:00'),
         ('LG-A05', '2900000010006','合成旧F',1,100,50,'10',5,'pcs',0,1,1,'2026-03-01T09:00:00','2026-03-01T09:00:00'),
         ('LG-A33', '2900000010007','合成旧G',1,100,50,'10',3,'pcs',0,1,1,'2026-03-01T09:00:00','2026-03-01T09:00:00');
         INSERT INTO stocktakes (id, started_at, completed_at, status, total_cost) VALUES
         (1,'2026-03-01T09:00:00','2026-03-01T18:00:00','completed',150),
         (2,'2026-03-02T09:00:00',NULL,'in_progress',NULL);
         INSERT INTO stocktake_items
            (stocktake_id, product_code, system_stock, actual_count, valuation_cost_price, counted_at) VALUES
         (1,'LG-MEAS',3,3,50,'2026-03-01T10:00:00'),
         (2,'LG-UNC',4,NULL,NULL,NULL),
         (2,'LG-AUTO',0,0,NULL,NULL),
         (2,'LG-MEAS',3,3,NULL,'2026-03-02T10:00:00'),
         (2,'LG-ODD',2,NULL,NULL,'2026-03-02T10:00:00'),
         (2,'LG-A35',5,3,NULL,NULL),
         (2,'LG-A05',5,0,NULL,NULL),
         (2,'LG-A33',3,3,NULL,NULL);
         INSERT INTO csv_imports (id, filename, settlement_date, file_hash, total_items, total_amount,
            skipped_count, status, imported_at) VALUES
         (1,'Z004_LG_a.CSV','2026-03-20','synthetic-hash-lg-a',1,100,0,'completed','2026-03-20T20:00:00'),
         (2,'Z004_LG_b.CSV','2026-03-21','synthetic-hash-lg-b',1,100,0,'rolled_back','2026-03-21T20:00:00');
         INSERT INTO sale_records (csv_import_id, product_code, sale_date, quantity, amount, source,
            source_line_no, created_at) VALUES
         (1,'LG-MEAS','2026-03-20',1,100,'auto',3,'2026-03-20T20:00:00');
         INSERT INTO inventory_movements (product_code, movement_type, quantity, stock_after,
            reference_type, reference_id, created_at) VALUES
         ('LG-MEAS','stocktake',0,4,'stocktake',1,'2026-03-01T18:00:00'),
         ('LG-MEAS','sale_auto',-1,3,'csv_import',1,'2026-03-20T20:00:00');",
    )
    .unwrap();
}
