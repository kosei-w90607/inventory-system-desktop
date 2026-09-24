//! ㉘ runtime ①: 旧棚卸しとZ004業務commit・取消の停止（SPEC-STOP-D1 / D5）。
//! 合成fixture F1〜F7 の各状態で、まず前提値を確かめ、次に5つのBIZ入口が停止errorを返し
//! DB全tableを変えないことを確かめる。後続laneの期待結果はTest Design Matrixに記録し、
//! ここではassertしない。

use crate::biz::csv_import_service::test_support::*;
use crate::biz::csv_import_service::*;
use crate::biz::stocktake_service::{self, CompleteStocktakeRequest, UpdateCountRequest};
use crate::biz::{inventory_service, BizError};
use crate::db::test_support::setup_test_db;
use crate::db::DbConnection;
use rusqlite::types::Value;
use serde_json::json;

// 35 §20.0 / 32 §15.0 からの独立転記（production定数をimportしない）。
const BIZ06_STOP: &str = "棚卸しの開始・数の保存・確定は一時停止中です。数えた後の入出庫が確定で打ち消される不具合を直すまで使えません。";
const BIZ03_STOP: &str = "商品別CSV（Z004）の取込みの確定と取消は一時停止中です。在庫が二重に減ったり戻ったりする不具合を直すまで使えません。";

const MISSING_ID: i64 = 999_999;

/// 停止した入口へ渡す、fixtureの中の実在ID（無ければMISSING_IDだけを使う）。
#[derive(Default)]
struct Targets {
    stocktake_ids: Vec<i64>,
    item_ids: Vec<i64>,
    import_ids: Vec<i64>,
    previews: Vec<CachedPreview>,
}

/// sqlite_master の全業務table（sqlite_* を除く）を全列 rowid 順で読む。
fn all_tables(conn: &DbConnection) -> Vec<(String, Vec<Vec<Value>>)> {
    let names: Vec<String> = conn
        .prepare(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
        )
        .unwrap()
        .query_map([], |row| row.get(0))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap();
    names
        .into_iter()
        .map(|name| {
            let mut stmt = conn
                .prepare(&format!("SELECT * FROM \"{name}\" ORDER BY rowid"))
                .unwrap();
            let width = stmt.column_count();
            let rows = stmt
                .query_map([], |row| (0..width).map(|col| row.get(col)).collect())
                .unwrap()
                .collect::<Result<Vec<Vec<Value>>, _>>()
                .unwrap();
            (name, rows)
        })
        .collect()
}

fn expect_biz06<T: std::fmt::Debug>(result: Result<T, BizError>) {
    match result {
        Err(BizError::ValidationFailed(message)) => assert_eq!(message, BIZ06_STOP),
        other => panic!("BIZ-06 の停止errorではない: {other:?}"),
    }
}

fn expect_biz03<T: std::fmt::Debug>(result: Result<T, BizError>) {
    match result {
        Err(BizError::ImportError(message)) => assert_eq!(message, BIZ03_STOP),
        other => panic!("BIZ-03 の停止errorではない: {other:?}"),
    }
}

/// 5つのBIZ入口を呼び、すべて停止errorで、DB全table（operation_logsを含む）が不変であること。
fn assert_all_entries_stopped(conn: &mut DbConnection, targets: &Targets) {
    let before = all_tables(conn);

    expect_biz06(stocktake_service::start_stocktake(conn));

    // 停止は入力検査・存在確認より先（負数・0・正数・存在しない明細ID）。
    let item_ids = targets.item_ids.iter().copied().chain([MISSING_ID]);
    for stocktake_item_id in item_ids {
        for actual_count in [-1, 0, 5] {
            expect_biz06(stocktake_service::update_count(
                conn,
                &UpdateCountRequest {
                    stocktake_item_id,
                    actual_count,
                },
            ));
        }
    }

    let stocktake_ids = targets.stocktake_ids.iter().copied().chain([MISSING_ID]);
    for stocktake_id in stocktake_ids {
        for force_fill in [false, true] {
            expect_biz06(stocktake_service::complete_stocktake(
                conn,
                &CompleteStocktakeRequest {
                    stocktake_id,
                    force_fill,
                },
            ));
        }
    }

    // 空だとcommitの検査が0回で通るため、各fixtureは合成previewを1件以上持つ。
    assert!(
        !targets.previews.is_empty(),
        "commitを検査するpreviewがない"
    );
    for cached in &targets.previews {
        for additional_import_confirmed in [false, true] {
            expect_biz03(commit_csv_import(
                conn,
                CommitRequest {
                    additional_import_confirmed,
                    cached_data: cached.clone(),
                },
            ));
        }
    }

    let import_ids = targets.import_ids.iter().copied().chain([MISSING_ID]);
    for csv_import_id in import_ids {
        expect_biz03(rollback_csv_import(conn, csv_import_id));
    }

    assert_eq!(before, all_tables(conn), "停止した入口がDBを変えた");
}

fn stock(conn: &DbConnection, product_code: &str) -> i64 {
    conn.query_row(
        "SELECT stock_quantity FROM products WHERE product_code=?1",
        [product_code],
        |row| row.get(0),
    )
    .unwrap()
}

fn count(conn: &DbConnection, sql: &str) -> i64 {
    conn.query_row(sql, [], |row| row.get(0)).unwrap()
}

fn item_id(conn: &DbConnection, stocktake_id: i64, product_code: &str) -> i64 {
    conn.query_row(
        "SELECT id FROM stocktake_items WHERE stocktake_id=?1 AND product_code=?2",
        (stocktake_id, product_code),
        |row| row.get(0),
    )
    .unwrap()
}

fn legacy_count(conn: &DbConnection, stocktake_item_id: i64, actual_count: i64) {
    stocktake_service::legacy_update_count(
        conn,
        &UpdateCountRequest {
            stocktake_item_id,
            actual_count,
        },
    )
    .unwrap();
}

fn legacy_commit(conn: &mut DbConnection, bytes: Vec<u8>, filename: &str) -> i64 {
    let preview = parse_and_build_cache(conn, bytes, filename);
    commit::legacy_commit_csv_import(
        conn,
        CommitRequest {
            additional_import_confirmed: false,
            cached_data: build_cached(preview),
        },
    )
    .unwrap()
    .csv_import_id
}

fn preview(
    conn: &DbConnection,
    settlement_date: &str,
    lines: &[(&str, &str, i32, i32)],
) -> CachedPreview {
    build_cached(parse_and_build_cache(
        conn,
        make_z004_bytes(settlement_date, lines),
        &format!("Z004_{settlement_date}.CSV"),
    ))
}

/// F1 STK-1: 連動商品1件、在庫10 → 旧start → 旧count 10 → 手動販売2（在庫8）。確定の直前。
fn build_f1(conn: &mut DbConnection) -> Targets {
    create_test_product_with_jan(conn, "STK1-SYNC", "2900000001008", 10, true);
    let stocktake_id = stocktake_service::legacy_start_stocktake(conn)
        .unwrap()
        .stocktake_id;
    let item = item_id(conn, stocktake_id, "STK1-SYNC");
    legacy_count(conn, item, 10);
    let request = serde_json::from_value(json!({
        "idempotency_key": "stk1-manual-sale", "sale_date": "2026-03-02", "reason": "other",
        "note": null, "items": [{"product_code": "STK1-SYNC", "quantity": 2, "amount": 200}],
        "confirmation_token": null
    }))
    .unwrap();
    inventory_service::create_manual_sale(conn, request).unwrap();
    let cached = preview(conn, "2026-03-02", &[("2900000001008", "合成F1", 1, 100)]);
    Targets {
        stocktake_ids: vec![stocktake_id],
        item_ids: vec![item],
        previews: vec![cached],
        ..Targets::default()
    }
}

/// F2 STK-2: 在庫10、未取込みのPOS販売2（現物8）→ 旧start → 旧count 8 → 旧complete（在庫8）
/// → 販売2のZ004をparse・cache。
fn build_f2(conn: &mut DbConnection) -> Targets {
    create_test_product_with_jan(conn, "STK2-SYNC", "2900000002005", 10, true);
    let stocktake_id = stocktake_service::legacy_start_stocktake(conn)
        .unwrap()
        .stocktake_id;
    let item = item_id(conn, stocktake_id, "STK2-SYNC");
    legacy_count(conn, item, 8);
    stocktake_service::legacy_complete_stocktake(
        conn,
        &CompleteStocktakeRequest {
            stocktake_id,
            force_fill: false,
        },
    )
    .unwrap();
    let late = preview(conn, "2026-03-01", &[("2900000002005", "合成F2", 2, 200)]);
    Targets {
        stocktake_ids: vec![stocktake_id],
        item_ids: vec![item],
        previews: vec![late],
        ..Targets::default()
    }
}

#[test]
fn test_legacy_stop_req205_f1_count_then_movement() {
    // REQ-205 / SPEC-STOP-D1,D5 / F1（STK-1）: 5入口とも停止し、在庫8のまま。
    let (_dir, mut conn) = setup_test_db();
    let targets = build_f1(&mut conn);

    assert_eq!(stock(&conn, "STK1-SYNC"), 8);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM stocktake_items"), 1);
    let (actual, counted, status): (Option<i64>, Option<String>, String) = conn
        .query_row(
            "SELECT si.actual_count, si.counted_at, s.status FROM stocktake_items si
             JOIN stocktakes s ON s.id = si.stocktake_id",
            [],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)),
        )
        .unwrap();
    assert_eq!(
        (actual, counted.is_some(), status.as_str()),
        (Some(10), true, "in_progress")
    );
    assert_eq!(
        count(
            &conn,
            "SELECT COUNT(*) FROM inventory_movements WHERE product_code='STK1-SYNC' AND quantity=-2 AND is_voided=0",
        ),
        1
    );

    assert_all_entries_stopped(&mut conn, &targets);
    assert_eq!(stock(&conn, "STK1-SYNC"), 8);
}

#[test]
fn test_legacy_stop_req205_req401_f2_late_import() {
    // REQ-205 / REQ-401 / SPEC-STOP-D1,D5 / F2（STK-2）: commitは停止し、在庫8・売上未記録のまま。
    let (_dir, mut conn) = setup_test_db();
    let targets = build_f2(&mut conn);

    assert_eq!(stock(&conn, "STK2-SYNC"), 8);
    assert_eq!(
        count(
            &conn,
            "SELECT COUNT(*) FROM stocktakes WHERE status='completed'"
        ),
        1
    );
    let rows = &targets.previews[0].matched_rows;
    assert_eq!(rows.len(), 1);
    assert_eq!(
        (
            rows[0].product_code.as_str(),
            rows[0].quantity,
            rows[0].pos_stock_sync
        ),
        ("STK2-SYNC", 2, true)
    );
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM sale_records"), 0);

    assert_all_entries_stopped(&mut conn, &targets);
    assert_eq!(stock(&conn, "STK2-SYNC"), 8);
    assert_eq!(count(&conn, "SELECT COUNT(*) FROM sale_records"), 0);
}

#[test]
fn test_legacy_stop_req205_req401_f3_legacy_shapes() {
    // REQ-205 / REQ-401 / SPEC-STOP-D1,D5 / F3（旧形式）: 旧明細4形・完了済み棚卸し・
    // 識別メタなしのcompleted / rolled_back import。rolled_back済みへのrollbackも冪等Okでなく停止。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "F3-NORMAL", "2900000003002", 5, true);
    create_test_product_with_jan(&conn, "F3-DISC", "2900000003019", 0, true);
    create_test_product_with_jan(&conn, "F3-COUNT", "2900000003026", 9, true);
    create_test_product_with_jan(&conn, "F3-ODD", "2900000003033", 4, true);
    conn.execute(
        "UPDATE products SET is_discontinued=1 WHERE product_code='F3-DISC'",
        [],
    )
    .unwrap();

    let completed_import = legacy_commit(
        &mut conn,
        make_z004_bytes("2026-03-20", &[("2900000003026", "合成F3-a", 1, 100)]),
        "Z004_F3_a.CSV",
    );
    let rolled_back_import = legacy_commit(
        &mut conn,
        make_z004_bytes("2026-03-21", &[("2900000003026", "合成F3-b", 1, 100)]),
        "Z004_F3_b.CSV",
    );
    rollback::legacy_rollback_csv_import(&mut conn, rolled_back_import).unwrap();

    let completed = stocktake_service::legacy_start_stocktake(&mut conn)
        .unwrap()
        .stocktake_id;
    stocktake_service::legacy_complete_stocktake(
        &mut conn,
        &CompleteStocktakeRequest {
            stocktake_id: completed,
            force_fill: true,
        },
    )
    .unwrap();
    let active = stocktake_service::legacy_start_stocktake(&mut conn)
        .unwrap()
        .stocktake_id;
    let counted_item = item_id(&conn, active, "F3-COUNT");
    legacy_count(&conn, counted_item, 7);
    let odd_item = item_id(&conn, active, "F3-ODD");
    conn.execute(
        "UPDATE stocktake_items SET actual_count=NULL, counted_at='2026-03-02T10:00:00' WHERE id=?1",
        [odd_item],
    )
    .unwrap();

    let shapes: Vec<(String, Option<i64>, bool)> = conn
        .prepare(
            "SELECT product_code, actual_count, counted_at IS NOT NULL FROM stocktake_items
             WHERE stocktake_id=?1 ORDER BY product_code",
        )
        .unwrap()
        .query_map([active], |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?)))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap();
    assert_eq!(
        shapes,
        vec![
            ("F3-COUNT".to_string(), Some(7), true),
            ("F3-DISC".to_string(), Some(0), false),
            ("F3-NORMAL".to_string(), None, false),
            ("F3-ODD".to_string(), None, true),
        ]
    );
    assert_eq!(
        count(
            &conn,
            "SELECT COUNT(*) FROM stocktakes WHERE status='completed'"
        ),
        1
    );
    assert_eq!(
        count(
            &conn,
            "SELECT COUNT(*) FROM csv_imports WHERE status='completed'"
        ),
        1
    );
    assert_eq!(
        count(
            &conn,
            "SELECT COUNT(*) FROM csv_imports WHERE status='rolled_back'"
        ),
        1
    );

    let item_ids = ["F3-NORMAL", "F3-DISC", "F3-COUNT", "F3-ODD"]
        .iter()
        .map(|code| item_id(&conn, active, code))
        .collect();
    let cached = preview(
        &conn,
        "2026-03-22",
        &[("2900000003026", "合成F3-c", 1, 100)],
    );
    let targets = Targets {
        stocktake_ids: vec![active, completed],
        item_ids,
        import_ids: vec![completed_import, rolled_back_import],
        previews: vec![cached],
    };
    assert_all_entries_stopped(&mut conn, &targets);
}

#[test]
fn test_legacy_stop_req401_f4_zero_rows() {
    // REQ-401 / SPEC-STOP-D1,D5 / F4（ゼロ行）: 0 / 0 行は現行parseで照合前に除外される。
    // 全行0のfileは既存 test_parse_and_validate_req401_no_valid_data の入力で固定済み。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "F4-A", "2900000004009", 3, true);
    create_test_product_with_jan(&conn, "F4-B", "2900000004016", 3, true);
    let cached = preview(
        &conn,
        "2026-03-03",
        &[
            ("2900000004009", "合成F4-A", 0, 0),
            ("2900000004016", "合成F4-B", 1, 100),
        ],
    );

    let codes: Vec<&str> = cached
        .matched_rows
        .iter()
        .map(|row| row.product_code.as_str())
        .collect();
    assert_eq!(codes, vec!["F4-B"]);

    let targets = Targets {
        previews: vec![cached],
        ..Targets::default()
    };
    assert_all_entries_stopped(&mut conn, &targets);
}

#[test]
fn test_legacy_stop_req401_f5_shared_jan() {
    // REQ-401 / SPEC-STOP-D1,D5 / F5（共有JAN）: 先頭商品へ全量 + warning の状態でもcommitは停止し、
    // csv_import_failed を含むoperation_logsも書かない（全table比較）。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "F5-P1", "2900000005006", 5, true);
    create_test_product_with_jan(&conn, "F5-P2", "2900000005006", 5, true);
    let cached = preview(&conn, "2026-03-04", &[("2900000005006", "合成F5", 1, 100)]);

    assert_eq!(
        count(
            &conn,
            "SELECT COUNT(*) FROM products WHERE jan_code='2900000005006'"
        ),
        2
    );
    let warnings = &cached.preview_data.matched_summary.warnings;
    assert_eq!(warnings.len(), 1);
    assert!(warnings[0].contains("複数商品"), "{warnings:?}");
    assert_eq!(cached.matched_rows.len(), 1);
    assert_eq!(cached.matched_rows[0].product_code, "F5-P1");

    let targets = Targets {
        previews: vec![cached],
        ..Targets::default()
    };
    assert_all_entries_stopped(&mut conn, &targets);
}

#[test]
fn test_legacy_stop_req205_req401_f6_reverse_order() {
    // REQ-205 / REQ-401 / SPEC-STOP-D1,D5 / F6（逆順）: 旧count済みの進行中棚卸しで、D+1 → D の順の
    // 2件のcommitとも停止する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "F6-P", "2900000006003", 10, true);
    let stocktake_id = stocktake_service::legacy_start_stocktake(&mut conn)
        .unwrap()
        .stocktake_id;
    let item = item_id(&conn, stocktake_id, "F6-P");
    legacy_count(&conn, item, 10);
    let later = preview(
        &conn,
        "2026-03-06",
        &[("2900000006003", "合成F6-D1", 1, 100)],
    );
    let earlier = preview(
        &conn,
        "2026-03-05",
        &[("2900000006003", "合成F6-D", 2, 200)],
    );

    let dates: Vec<&str> = [&later, &earlier]
        .iter()
        .map(|cached| cached.preview_data.file_info.settlement_date.as_str())
        .collect();
    assert_eq!(dates, vec!["2026-03-06", "2026-03-05"]);
    let (actual, status): (Option<i64>, String) = conn
        .query_row(
            "SELECT si.actual_count, s.status FROM stocktake_items si
             JOIN stocktakes s ON s.id = si.stocktake_id WHERE si.id=?1",
            [item],
            |row| Ok((row.get(0)?, row.get(1)?)),
        )
        .unwrap();
    assert_eq!((actual, status.as_str()), (Some(10), "in_progress"));

    let targets = Targets {
        stocktake_ids: vec![stocktake_id],
        item_ids: vec![item],
        previews: vec![later, earlier],
        ..Targets::default()
    };
    assert_all_entries_stopped(&mut conn, &targets);
}

#[test]
fn test_legacy_stop_req401_f7_missing_day() {
    // REQ-401 / SPEC-STOP-D1,D5 / F7（欠落）: D と D+2 だけのcacheでもcommitは停止する。
    let (_dir, mut conn) = setup_test_db();
    create_test_product_with_jan(&conn, "F7-P", "2900000007000", 10, true);
    let first = preview(
        &conn,
        "2026-03-07",
        &[("2900000007000", "合成F7-D", 1, 100)],
    );
    let third = preview(
        &conn,
        "2026-03-09",
        &[("2900000007000", "合成F7-D2", 1, 100)],
    );

    let dates: Vec<&str> = [&first, &third]
        .iter()
        .map(|cached| cached.preview_data.file_info.settlement_date.as_str())
        .collect();
    assert_eq!(dates, vec!["2026-03-07", "2026-03-09"]);
    assert_eq!(
        count(
            &conn,
            "SELECT COUNT(*) FROM csv_imports WHERE settlement_date='2026-03-08'"
        ),
        0
    );

    let targets = Targets {
        previews: vec![first, third],
        ..Targets::default()
    };
    assert_all_entries_stopped(&mut conn, &targets);
}
