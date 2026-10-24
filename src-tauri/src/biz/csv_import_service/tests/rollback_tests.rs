use crate::biz::csv_import_service::test_support::*;
use crate::biz::csv_import_service::*;
use crate::biz::BizError;
use crate::db::test_support::setup_test_db;
use crate::db::{product_repo, sales_repo};

/// commit してからrollbackをテストするヘルパー
fn commit_import(
    conn: &mut crate::db::DbConnection,
    bytes: Vec<u8>,
    filename: &str,
) -> ImportResult {
    let pv = parse_and_build_cache(conn, bytes, filename);
    let cached = build_cached(pv);
    commit_csv_import(
        conn,
        CommitRequest {
            cached_data: cached,
            today: TEST_TODAY.to_string(),
        },
    )
    .unwrap()
}

// --- rollback_csv_import テスト ---

#[test]
fn test_rollback_req401_normal() {
    // REQ-401: CSV取込み
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let bytes = make_z004_bytes(1, "2026-03-21", &[("4912345678901", "商品A", 3, 900)]);
    let import_result = commit_import(&mut conn, bytes, "Z004_260321");

    // 在庫が減っていることを確認
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, 7); // 10 - 3

    // ロールバック
    let rb = rollback_csv_import(&mut conn, import_result.csv_import_id).unwrap();
    assert!(rb.success);
    assert_eq!(rb.voided_sale_count, 1);
    assert_eq!(rb.voided_movement_count, 1);

    // DB検証: 在庫が元に戻っている
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, 10);
}

#[test]
fn test_rollback_req401_idempotent() {
    // REQ-401: CSV取込み
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let bytes = make_z004_bytes(1, "2026-03-21", &[("4912345678901", "商品A", 3, 900)]);
    let import_result = commit_import(&mut conn, bytes, "Z004_260321");

    // 1回目のロールバック
    let rb1 = rollback_csv_import(&mut conn, import_result.csv_import_id).unwrap();
    assert!(rb1.success);
    assert_eq!(rb1.voided_sale_count, 1);

    // 2回目のロールバック（冪等）
    let rb2 = rollback_csv_import(&mut conn, import_result.csv_import_id).unwrap();
    assert!(rb2.success);
    assert_eq!(rb2.voided_sale_count, 0);
    assert_eq!(rb2.voided_movement_count, 0);

    // DB検証: 在庫は1回目のロールバック後のまま
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, 10);
}

#[test]
fn test_rollback_req401_not_found() {
    // REQ-401: CSV取込み
    let (_dir, mut conn) = setup_test_db();
    let result = rollback_csv_import(&mut conn, 999);
    assert!(result.is_err());
    match result.unwrap_err() {
        BizError::NotFound(msg) => assert!(msg.contains("999")),
        e => panic!("Expected NotFound, got {:?}", e),
    }
}

#[test]
fn test_rollback_req401_same_day_is_per_import_with_negative_return() {
    // REQ-401 / I-B6 / SPEC-SDI-D2,D7: 対象importだけを取消し、同日返品siblingを保持する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let first = commit_import(
        &mut conn,
        make_z004_bytes(1, "2026-03-21", &[("4912345678901", "商品A", 2, 600)]),
        "Z004_0001",
    );
    let second_preview = parse_and_build_cache(
        &conn,
        make_z004_bytes(2, "2026-03-21", &[("4912345678901", "返品A", -1, -300)]),
        "Z004_0002",
    );
    let second = commit_csv_import(
        &mut conn,
        CommitRequest {
            cached_data: build_cached(second_preview),
            today: TEST_TODAY.to_string(),
        },
    )
    .unwrap();

    rollback_csv_import(&mut conn, first.csv_import_id).unwrap();

    let active =
        crate::db::sales_repo::find_imports_by_settlement_date(&conn, "2026-03-21").unwrap();
    assert_eq!(active.len(), 1);
    assert_eq!(active[0].id, second.csv_import_id);
    let product = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(product.product.stock_quantity, 11);
    let remaining_sales = sales_repo::get_daily_sales_records(&conn, "2026-03-21").unwrap();
    assert_eq!(remaining_sales.len(), 1);
    assert_eq!(remaining_sales[0].quantity, -1);
    assert_eq!(remaining_sales[0].amount, -300);
    assert_eq!(remaining_sales[0].source, "auto");
}

#[test]
fn test_rollback_req401_selected_negative_return_reverses_only_return_contribution() {
    // REQ-401 / I-B7 / SPEC-SDI-D2: 負数返品importを取消すと返品寄与だけを逆転しfirst saleを保持する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let first = commit_import(
        &mut conn,
        make_z004_bytes(1, "2026-03-21", &[("4912345678901", "商品A", 2, 600)]),
        "Z004_0001",
    );
    let return_preview = parse_and_build_cache(
        &conn,
        make_z004_bytes(2, "2026-03-21", &[("4912345678901", "返品A", -1, -300)]),
        "Z004_0002",
    );
    let returned = commit_csv_import(
        &mut conn,
        CommitRequest {
            cached_data: build_cached(return_preview),
            today: TEST_TODAY.to_string(),
        },
    )
    .unwrap();
    let before = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(before.product.stock_quantity, 9);

    rollback_csv_import(&mut conn, returned.csv_import_id).unwrap();

    let after = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(after.product.stock_quantity, 8);
    let active = sales_repo::find_imports_by_settlement_date(&conn, "2026-03-21").unwrap();
    assert_eq!(active.len(), 1);
    assert_eq!(active[0].id, first.csv_import_id);
    let first_active_sale: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sale_records WHERE csv_import_id = ?1 AND is_voided = 0",
            [first.csv_import_id],
            |row| row.get(0),
        )
        .unwrap();
    let return_active_sale: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sale_records WHERE csv_import_id = ?1 AND is_voided = 0",
            [returned.csv_import_id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(first_active_sale, 1);
    assert_eq!(return_active_sale, 0);
}

#[test]
fn test_import_rollback_req401_logs_exact_selected_id_and_preserves_commit_on_log_failure() {
    // REQ-401 / I-B9 / SPEC-SDI-D2: log失敗はbusiness rollbackを戻さず、成功logは選択IDを記録する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let first = commit_import(
        &mut conn,
        make_z004_bytes(1, "2026-03-21", &[("4912345678901", "商品A", 1, 300)]),
        "Z004_0001",
    );
    let second_preview = parse_and_build_cache(
        &conn,
        make_z004_bytes(2, "2026-03-21", &[("4912345678901", "商品B", 2, 600)]),
        "Z004_0002",
    );
    let second = commit_csv_import(
        &mut conn,
        CommitRequest {
            cached_data: build_cached(second_preview),
            today: TEST_TODAY.to_string(),
        },
    )
    .unwrap();

    conn.execute_batch(
        "CREATE TRIGGER fail_csv_rollback_log
         BEFORE INSERT ON operation_logs
         WHEN NEW.operation_type = 'csv_rollback'
         BEGIN SELECT RAISE(FAIL, 'synthetic log failure'); END;",
    )
    .unwrap();
    let result = rollback_csv_import(&mut conn, first.csv_import_id).unwrap();
    assert!(result.success);
    let first_record = sales_repo::find_csv_import_by_id(&conn, first.csv_import_id)
        .unwrap()
        .unwrap();
    let second_record = sales_repo::find_csv_import_by_id(&conn, second.csv_import_id)
        .unwrap()
        .unwrap();
    assert_eq!(first_record.status, sales_repo::CsvImportStatus::RolledBack);
    assert_eq!(second_record.status, sales_repo::CsvImportStatus::Completed);

    conn.execute_batch("DROP TRIGGER fail_csv_rollback_log;")
        .unwrap();
    rollback_csv_import(&mut conn, second.csv_import_id).unwrap();
    let (summary, detail): (String, String) = conn
        .query_row(
            "SELECT summary, detail_json FROM operation_logs
             WHERE operation_type = 'csv_rollback' ORDER BY id DESC LIMIT 1",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();
    assert!(summary.contains(&format!("ID {}", second.csv_import_id)));
    assert!(detail.contains(&format!(r#""csv_import_id":{}"#, second.csv_import_id)));
}

#[test]
fn test_rollback_req401_stock_limit_rolls_back_whole_tx() {
    // REQ-401 / 共通規則 (a)（X3）: 取込みの取消の補正の後の在庫が上限の外なら、取消を TX 全体で戻す
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let bytes = make_z004_bytes(1, "2026-03-21", &[("4912345678901", "商品A", 1, 100)]);
    let import_result = commit_import(&mut conn, bytes, "Z004_260321");
    let set_stock = |conn: &crate::db::DbConnection, stock: i64| {
        // 写しを記録から求め直すので、新しい値との差の movement を入れて写しと記録を揃える（Matrix T4）
        let current: i64 = conn
            .query_row(
                "SELECT stock_quantity FROM products WHERE product_code = 'TEST-001'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        crate::db::test_support::insert_initial_stock_movement(
            conn,
            "TEST-001",
            stock - current,
            stock,
        );
        conn.execute(
            "UPDATE products SET stock_quantity = ?1 WHERE product_code = 'TEST-001'",
            [stock],
        )
        .unwrap();
    };
    let state = |conn: &crate::db::DbConnection| -> (i64, i64, i64) {
        conn.query_row(
            "SELECT (SELECT stock_quantity FROM products WHERE product_code = 'TEST-001'),
                    (SELECT COUNT(*) FROM sale_records WHERE is_voided = 1),
                    (SELECT COUNT(*) FROM inventory_movements WHERE is_voided = 1)",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .unwrap()
    };

    set_stock(&conn, 999_999_999);
    let result = rollback_csv_import(&mut conn, import_result.csv_import_id);
    assert!(
        matches!(result, Err(BizError::ValidationFailed(ref m)) if m == "在庫数が大きすぎます"),
        "{result:?}"
    );
    assert_eq!(state(&conn), (999_999_999, 0, 0));
    let import = sales_repo::find_csv_import_by_id(&conn, import_result.csv_import_id)
        .unwrap()
        .unwrap();
    assert_ne!(import.status, sales_repo::CsvImportStatus::RolledBack);

    set_stock(&conn, 999_999_998);
    rollback_csv_import(&mut conn, import_result.csv_import_id).unwrap();
    assert_eq!(state(&conn), (999_999_999, 1, 1));
}

#[test]
fn test_rollback_req401_voids_and_recomputes_without_compensation() {
    // REQ-401 / REQ-205 / ADR D2・D7（Matrix Z14）: 取消は売上と movement を無効にし、求め直す商品を
    // 求め直す。補償の movement を作らず、計数を消さない。結果に recheck_targets
    let day = "2026-04-10";
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    crate::biz::stocktake_service::save_stock_count(
        &mut conn,
        &crate::biz::stocktake_service::SaveStockCountRequest {
            product_code: "TEST-001".to_string(),
            count_value: 10,
            fresh: false,
            business_date: day.to_string(),
            stocktake_item_id: None,
        },
        day,
    )
    .unwrap();
    let one = [("4912345678901", "商品A", 1, 100)];
    let first = commit_import(&mut conn, make_z004_bytes(1, day, &one), "a");
    let second = commit_import(&mut conn, make_z004_bytes(2, "2026-04-11", &one), "b");
    let counts = |conn: &crate::db::DbConnection| -> (i64, i64) {
        conn.query_row(
            "SELECT (SELECT COUNT(*) FROM inventory_movements), (SELECT COUNT(*) FROM stock_counts)",
            [],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap()
    };
    let before = counts(&conn);
    // 計数の日付の精算 1 を取り消すと、精算 2 が計数の日付の後の最初の 1 本で決まらない（要再確認のまま）
    let rb = rollback_csv_import(&mut conn, first.csv_import_id).unwrap();
    assert_eq!(counts(&conn), before);
    assert_eq!(stock_copy(&conn, "TEST-001"), (9, true, Some((9, 10))));
    assert_eq!(rb.recheck_targets.len(), 1);
    assert_eq!(rb.recheck_targets[0].product_code, "TEST-001");
    let voided: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM inventory_movements WHERE reference_id = ?1 AND is_voided = 1",
            [first.csv_import_id],
            |row| row.get(0),
        )
        .unwrap();
    assert_eq!(voided, 1);
    // 両方を取り消すと計数だけが残り、要再確認が解ける
    let rb = rollback_csv_import(&mut conn, second.csv_import_id).unwrap();
    assert_eq!(counts(&conn), before);
    assert_eq!(stock_copy(&conn, "TEST-001"), (10, false, None));
    assert!(rb.recheck_targets.is_empty());
    let derived = crate::biz::stock_ledger::derive_stock(&conn, "TEST-001").unwrap();
    assert_eq!((derived.stock, derived.range), (10, None));
}
