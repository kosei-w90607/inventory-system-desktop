use crate::biz::csv_import_service::test_support::*;
use crate::biz::csv_import_service::*;
use crate::biz::BizError;
use crate::db::test_support::setup_test_db;
use crate::db::{product_repo, sales_repo};

fn write_surface(conn: &crate::db::DbConnection) -> [i64; 4] {
    [
        conn.query_row("SELECT COUNT(*) FROM csv_imports", [], |row| row.get(0))
            .unwrap(),
        conn.query_row("SELECT COUNT(*) FROM sale_records", [], |row| row.get(0))
            .unwrap(),
        conn.query_row("SELECT COUNT(*) FROM inventory_movements", [], |row| {
            row.get(0)
        })
        .unwrap(),
        conn.query_row(
            "SELECT COALESCE(SUM(stock_quantity), 0) FROM products",
            [],
            |row| row.get(0),
        )
        .unwrap(),
    ]
}

// --- commit_csv_import テスト ---

#[test]
fn test_commit_req401_normal_flow() {
    // REQ-401: CSV取込み
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    create_test_product_with_jan(&conn, "TEST-002", "4912345678902", 5, true);
    let bytes = make_z004_bytes(
        "2026-03-21",
        &[
            ("4912345678901", "商品A", 3, 900),
            ("4912345678902", "商品B", 1, 200),
        ],
    );
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    let cached = build_cached(pv);

    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    )
    .unwrap();

    assert_eq!(result.status, sales_repo::CsvImportStatus::Completed);
    assert_eq!(result.total_items, 2);
    assert_eq!(result.total_amount, 1100);
    assert_eq!(result.skipped_count, 0);

    // DB検証: 在庫が減っている
    let p1 = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p1.product.stock_quantity, 7); // 10 - 3
    let p2 = product_repo::find_by_product_code(&conn, "TEST-002")
        .unwrap()
        .unwrap();
    assert_eq!(p2.product.stock_quantity, 4); // 5 - 1
}

#[test]
fn test_commit_req401_same_day_additional_import_is_insert_only() {
    // REQ-401 / I-B3 / SPEC-SDI-D3: 同日別hashは既存分を残して追加する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);

    // 最初のインポート
    let bytes1 = make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 2, 600)]);
    let pv1 = parse_and_build_cache(&conn, bytes1, "Z004_old");
    let cached1 = build_cached(pv1);
    let result1 = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached1,
        },
    )
    .unwrap();
    assert_eq!(result1.status, sales_repo::CsvImportStatus::Completed);
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, 8); // 10 - 2

    // 同日の別ファイルを追加取込み
    let bytes2 = make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 5, 1500)]);
    // settlement_date 同日チェックのため手動でPreviewDataを構築
    let pv2 = parse_and_build_cache(&conn, bytes2, "Z004_new");
    assert_eq!(
        pv2.preview_data.duplicate_check.status,
        DuplicateStatus::AdditionalImportConfirmationRequired
    );
    let cached2 = build_cached(pv2);
    let result2 = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: true,
            cached_data: cached2,
        },
    )
    .unwrap();
    assert_eq!(result2.status, sales_repo::CsvImportStatus::Completed);
    assert_eq!(result2.total_items, 1);
    assert_eq!(result2.total_amount, 1500);

    // DB検証: 旧データ(-2) と追加データ(-5) がともに残る。
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, 3);
    let imports = sales_repo::find_imports_by_settlement_date(&conn, "2026-03-21").unwrap();
    assert_eq!(imports.len(), 2);
    assert!(imports
        .iter()
        .all(|item| item.status != sales_repo::CsvImportStatus::RolledBack));
    for import_id in [result1.csv_import_id, result2.csv_import_id] {
        let active_sales: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM sale_records WHERE csv_import_id = ?1 AND is_voided = 0",
                [import_id],
                |row| row.get(0),
            )
            .unwrap();
        let active_movements: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM inventory_movements
                 WHERE reference_type = 'csv_import' AND reference_id = ?1 AND is_voided = 0",
                [import_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(active_sales, 1);
        assert_eq!(active_movements, 1);
    }
}

#[test]
fn test_commit_req401_additional_import_requires_confirmation() {
    // REQ-401 / I-B5 / SPEC-SDI-D3: 追加確認 false は副作用なしで拒否する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);

    // 同日の既存インポートを作成
    sales_repo::insert_csv_import(
        &conn,
        &sales_repo::NewCsvImport {
            filename: "old".to_string(),
            settlement_date: "2026-03-21".to_string(),
            file_hash: "oldhash".to_string(),
            total_items: 1,
            total_amount: 100,
            skipped_count: 0,
            status: "completed".to_string(),
        },
    )
    .unwrap();

    let bytes = make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 3, 900)]);
    let pv = parse_and_build_cache(&conn, bytes, "Z004_new");
    let cached = build_cached(pv);
    let before = write_surface(&conn);

    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    );
    assert!(result.is_err());
    match result.unwrap_err() {
        BizError::ValidationFailed(msg) => assert!(msg.contains("追加確認")),
        e => panic!("Expected ValidationFailed, got {:?}", e),
    }
    assert_eq!(write_surface(&conn), before);
}

#[test]
fn test_commit_req401_toctou_check() {
    // REQ-401 / I-B2 / SPEC-SDI-D4: hash recheck はsnapshot mismatchより先にhard blockする。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let bytes = make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 3, 900)]);
    let pv = parse_and_build_cache(&conn, bytes.clone(), "Z004_260321");
    let file_hash = pv.preview_data.file_info.file_hash.clone();

    // プレビュー後にDBに同じhashを挿入（他の操作がcommitした状況をシミュレート）
    sales_repo::insert_csv_import(
        &conn,
        &sales_repo::NewCsvImport {
            filename: "sneaky".to_string(),
            settlement_date: "2026-03-21".to_string(),
            file_hash,
            total_items: 1,
            total_amount: 900,
            skipped_count: 0,
            status: "completed".to_string(),
        },
    )
    .unwrap();

    let cached = build_cached(pv);
    let before = write_surface(&conn);
    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    );
    assert!(result.is_err());
    match result.unwrap_err() {
        BizError::ImportError(msg) => assert!(msg.contains("取込み済み")),
        e => panic!("Expected ImportError, got {:?}", e),
    }
    assert_eq!(write_surface(&conn), before);
}

#[test]
fn test_commit_req401_pos_stock_sync_false() {
    // REQ-401: CSV取込み
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, false); // pos_stock_sync=false
    let bytes = make_z004_bytes("2026-03-21", &[("4912345678901", "生地A", 3, 900)]);
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    let cached = build_cached(pv);

    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    )
    .unwrap();
    assert_eq!(result.status, sales_repo::CsvImportStatus::Completed);
    assert_eq!(result.total_items, 1);

    // DB検証: 在庫は動かない
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, 10); // 変わらず
}

#[test]
fn test_commit_req401_negative_stock_warning() {
    // REQ-401: CSV取込み
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 2, true); // 在庫2
    let bytes = make_z004_bytes(
        "2026-03-21",
        &[
            ("4912345678901", "商品A", 5, 1500), // 5個販売 → 在庫-3
        ],
    );
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    let cached = build_cached(pv);

    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    )
    .unwrap();
    // 処理は完了する（INV-3: 負在庫は警告のみ）
    assert_eq!(result.status, sales_repo::CsvImportStatus::Completed);

    // DB検証: 在庫がマイナス
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, -3); // 2 - 5
}

#[test]
fn test_commit_req401_partial_with_errors() {
    // REQ-401: CSV取込み
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    // 1件マッチ + 1件アンマッチ
    let bytes = make_z004_bytes(
        "2026-03-21",
        &[
            ("4912345678901", "商品A", 3, 900),
            ("9999999999999", "未登録商品", 1, 100),
        ],
    );
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    let cached = build_cached(pv);

    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    )
    .unwrap();
    assert_eq!(result.status, sales_repo::CsvImportStatus::CompletedPartial);
    assert_eq!(result.total_items, 1);
    assert_eq!(result.skipped_count, 1);
}

#[test]
fn test_commit_req401_sign_flip_inv1() {
    // REQ-401: CSV取込み
    // INV-1: quantity=3（売上帳票視点）→ inventory_quantity=-3（在庫視点）
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 100, true);
    let bytes = make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 3, 900)]);
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    let cached = build_cached(pv);

    commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    )
    .unwrap();

    // DB検証: 在庫が3減っている（100 - 3 = 97）
    let p = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(p.product.stock_quantity, 97);
}

#[test]
fn test_commit_req401_settlement_date_toctou() {
    // REQ-401 / I-W5 / SPEC-SDI-D4: snapshot追加差分は副作用なし再preview。
    // Preview時はNoDuplicateだったが、commit前に同日データが別経路で取り込まれた場合
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let bytes = make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 3, 900)]);
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    // Preview時点ではNoDuplicate
    assert_eq!(
        pv.preview_data.duplicate_check.status,
        DuplicateStatus::NoDuplicate
    );

    // Preview後に別経路で同日データを挿入
    sales_repo::insert_csv_import(
        &conn,
        &sales_repo::NewCsvImport {
            filename: "Z004_sneaky".to_string(),
            settlement_date: "2026-03-21".to_string(),
            file_hash: "sneaky_different_hash".to_string(),
            total_items: 1,
            total_amount: 500,
            skipped_count: 0,
            status: "completed".to_string(),
        },
    )
    .unwrap();

    let cached = build_cached(pv);
    let before = write_surface(&conn);
    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: cached,
        },
    );
    assert!(result.is_err());
    match result.unwrap_err() {
        BizError::ImportError(msg) => assert_eq!(
            msg,
            "同日の取込み状況が変わりました。再度プレビューしてください"
        ),
        e => panic!("Expected ImportError, got {:?}", e),
    }
    let sales: i64 = conn
        .query_row("SELECT COUNT(*) FROM sale_records", [], |row| row.get(0))
        .unwrap();
    assert_eq!(sales, 0);
    let product = product_repo::find_by_product_code(&conn, "TEST-001")
        .unwrap()
        .unwrap();
    assert_eq!(product.product.stock_quantity, 10);
    assert_eq!(write_surface(&conn), before);
}

#[test]
fn test_commit_req401_same_date_snapshot_removal_requires_repreview() {
    // REQ-401 / I-W5 / SPEC-SDI-D4: snapshot削除差分も完全一致比較で検出する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let existing_id = sales_repo::insert_csv_import(
        &conn,
        &sales_repo::NewCsvImport {
            filename: "existing".to_string(),
            settlement_date: "2026-03-21".to_string(),
            file_hash: "existing-hash".to_string(),
            total_items: 1,
            total_amount: 100,
            skipped_count: 0,
            status: "completed".to_string(),
        },
    )
    .unwrap();
    let preview = parse_and_build_cache(
        &conn,
        make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 1, 300)]),
        "Z004_new",
    );
    sales_repo::update_csv_import_status(&conn, existing_id, "rolled_back").unwrap();
    let before = write_surface(&conn);

    let error = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: true,
            cached_data: build_cached(preview),
        },
    )
    .unwrap_err();
    assert!(
        matches!(error, BizError::ImportError(ref message) if message == "同日の取込み状況が変わりました。再度プレビューしてください")
    );
    assert_eq!(write_surface(&conn), before);
}

#[test]
fn test_commit_req401_same_date_snapshot_replace_requires_repreview() {
    // REQ-401 / I-W5 / SPEC-SDI-D4: 件数が同じでもactive ID置換を検出し副作用を出さない。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let existing_id = sales_repo::insert_csv_import(
        &conn,
        &sales_repo::NewCsvImport {
            filename: "existing-a".to_string(),
            settlement_date: "2026-03-21".to_string(),
            file_hash: "existing-a-hash".to_string(),
            total_items: 1,
            total_amount: 100,
            skipped_count: 0,
            status: "completed".to_string(),
        },
    )
    .unwrap();
    let preview = parse_and_build_cache(
        &conn,
        make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 1, 300)]),
        "Z004_new",
    );
    sales_repo::update_csv_import_status(&conn, existing_id, "rolled_back").unwrap();
    sales_repo::insert_csv_import(
        &conn,
        &sales_repo::NewCsvImport {
            filename: "existing-b".to_string(),
            settlement_date: "2026-03-21".to_string(),
            file_hash: "existing-b-hash".to_string(),
            total_items: 1,
            total_amount: 200,
            skipped_count: 0,
            status: "completed".to_string(),
        },
    )
    .unwrap();
    let before = write_surface(&conn);

    let error = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: true,
            cached_data: build_cached(preview),
        },
    )
    .unwrap_err();

    assert!(
        matches!(error, BizError::ImportError(ref message) if message == "同日の取込み状況が変わりました。再度プレビューしてください")
    );
    assert_eq!(write_surface(&conn), before);
}

#[test]
fn test_commit_req401_same_date_snapshot_order_requires_exact_match() {
    // REQ-401 / I-W5 / SPEC-SDI-D4: set一致でもordered ID snapshotの順序差を拒否する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    for (filename, hash) in [("old-a", "hash-a"), ("old-b", "hash-b")] {
        sales_repo::insert_csv_import(
            &conn,
            &sales_repo::NewCsvImport {
                filename: filename.to_string(),
                settlement_date: "2026-03-21".to_string(),
                file_hash: hash.to_string(),
                total_items: 1,
                total_amount: 1,
                skipped_count: 0,
                status: "completed".to_string(),
            },
        )
        .unwrap();
    }
    let preview = parse_and_build_cache(
        &conn,
        make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 1, 300)]),
        "new",
    );
    let mut cached = build_cached(preview);
    cached.active_same_date_import_ids.reverse();
    let before = write_surface(&conn);

    let error = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: true,
            cached_data: cached,
        },
    )
    .unwrap_err();
    assert!(
        matches!(error, BizError::ImportError(ref message) if message == "同日の取込み状況が変わりました。再度プレビューしてください")
    );
    assert_eq!(write_surface(&conn), before);
}

#[test]
fn test_commit_req401_additional_confirmation_without_duplicate() {
    // REQ-401 / I-B5 / SPEC-SDI-D3: NoDuplicate + true は ValidationFailed。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "TEST-001", "4912345678901", 10, true);
    let bytes = make_z004_bytes("2026-03-21", &[("4912345678901", "商品A", 3, 900)]);
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    assert_eq!(
        pv.preview_data.duplicate_check.status,
        DuplicateStatus::NoDuplicate
    );
    let cached = build_cached(pv);
    let before = write_surface(&conn);

    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: true,
            cached_data: cached,
        },
    );
    assert!(result.is_err());
    match result.unwrap_err() {
        BizError::ValidationFailed(msg) => assert!(msg.contains("追加確認")),
        e => panic!("Expected ValidationFailed, got {:?}", e),
    }
    assert_eq!(write_surface(&conn), before);
}

// --- 入力の上限（共通規則 SPEC-UNIT-D11 の続き、X2・X3） ---

#[test]
fn test_preview_req401_pos_quantity_limit_is_row_error() {
    // REQ-401 / X2: POS 由来の数量は絶対値 9999999 まで。越える行は invalid_number の行の error で、
    // 在庫を動かさない行（pos_stock_sync=false）も同じ検査を通る。ほかの行は取り込む
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "X2-NOSYNC", "4912345678901", 10, false);
    create_test_product_with_jan(&conn, "X2-SYNC", "4912345678902", 10, true);
    create_test_product_with_jan(&conn, "X2-EDGE", "4912345678903", 10, false);
    create_test_product_with_jan(&conn, "X2-RETURN", "4912345678904", 10, false);
    let bytes = make_z004_bytes(
        "2026-03-21",
        &[
            ("4912345678901", "連動しない商品", 10_000_000, 100),
            ("4912345678902", "連動する商品", -10_000_000, -100),
            ("4912345678903", "上限の端", 9_999_999, 100),
            ("4912345678904", "上限の端の返品", -9_999_999, -100),
        ],
    );
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    let errors: Vec<(usize, CsvImportErrorType, &str)> = pv
        .error_rows
        .iter()
        .map(|row| (row.line_no, row.error_type, row.error_message.as_str()))
        .collect();
    assert_eq!(errors.len(), 2, "{errors:?}");
    for (_, error_type, message) in &errors {
        assert_eq!(*error_type, CsvImportErrorType::InvalidNumber);
        assert_eq!(*message, "数量が大きすぎます");
    }
    assert_eq!(pv.matched_rows.len(), 2);

    commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: build_cached(pv),
        },
    )
    .unwrap();

    let mut statement = conn
        .prepare("SELECT product_code, quantity FROM sale_records ORDER BY product_code")
        .unwrap();
    let saved: Vec<(String, i64)> = statement
        .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap();
    assert_eq!(
        saved,
        vec![
            ("X2-EDGE".to_string(), 9_999_999),
            ("X2-RETURN".to_string(), -9_999_999)
        ]
    );
    for code in ["X2-NOSYNC", "X2-SYNC", "X2-EDGE", "X2-RETURN"] {
        let product = product_repo::find_by_product_code(&conn, code)
            .unwrap()
            .unwrap();
        assert_eq!(product.product.stock_quantity, 10, "{code}");
    }
}

#[test]
fn test_commit_req401_stock_limit_rolls_back_whole_tx() {
    // REQ-401 / X3: 販売の取込みで計算の後の在庫が -999999999 を下回ったら TX 全体を戻す
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "X3-FULL", "4912345678901", -999_999_999, true);
    create_test_product_with_jan(&conn, "X3-OTHER", "4912345678902", 10, true);
    let bytes = make_z004_bytes(
        "2026-03-21",
        &[
            ("4912345678902", "ほかの商品", 2, 200),
            ("4912345678901", "下限の商品", 1, 100),
        ],
    );
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260321");
    let before = write_surface(&conn);
    let result = commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: build_cached(pv),
        },
    );
    assert!(
        matches!(result, Err(BizError::ValidationFailed(ref m)) if m == "在庫数が大きすぎます"),
        "{result:?}"
    );
    assert_eq!(write_surface(&conn), before);

    conn.execute(
        "UPDATE products SET stock_quantity = -999999998 WHERE product_code = 'X3-FULL'",
        [],
    )
    .unwrap();
    let bytes = make_z004_bytes("2026-03-22", &[("4912345678901", "下限の商品", 1, 100)]);
    let pv = parse_and_build_cache(&conn, bytes, "Z004_260322");
    commit::legacy_commit_csv_import(
        &mut conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: build_cached(pv),
        },
    )
    .unwrap();
    let product = product_repo::find_by_product_code(&conn, "X3-FULL")
        .unwrap()
        .unwrap();
    assert_eq!(product.product.stock_quantity, -999_999_999);
}
