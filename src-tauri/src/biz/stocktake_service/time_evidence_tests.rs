//! ㉘ ③: 新方式の開始・計数・保存・確定（SPEC-STK-TIME-D1 / D4 / D7 / D8、D1-R1、Matrix C3〜C21）。
//! 時点証拠 schema を当てた試験 DB の上で合成値だけを使う。在庫の移動は ② の版の関数と既存の
//! `insert_movement` で起こす（旧 BIZ は版を進めないので使わない、D-109 の Guarantee range）。
//! 期待値は ADR の数値例・35 proposed・R1 の表・② の Matrix の G 行から決め、実装の出力から決めない。

use super::time_evidence::*;
use crate::biz::csv_import_service::time_evidence::{
    classify_stock_rows, receive_source, RowDecision, StockClassification, StockEffect,
    StockEvidenceRow, UnknownReason,
};
use crate::biz::BizError;
use crate::db::inventory_repo::time_evidence::{
    bump_stock_revision, update_stock_quantity_with_revision,
};
use crate::db::inventory_repo::{insert_movement, MovementType, NewMovement};
use crate::db::product_repo::ProductStockUnit;
use crate::db::sales_repo::time_evidence::{upsert_pos_import_source, NewPosImportSource};
use crate::db::stocktake_repo::time_evidence::{
    find_latest_effective_observation, ObservationKind, ObservationOwner,
};
use crate::db::test_support::{
    apply_time_evidence, seed_legacy_fixture, setup_test_db, setup_time_evidence_db,
};
use crate::db::{DbConnection, DbError};
use crate::io::z004_parser::parse_z004;
use rusqlite::types::Value;

const GEN: u64 = 7;
const T_START: &str = "2026-12-01T09:00:00";
const T_BEGIN: &str = "2026-12-01T10:00:00";
const T_SAVE: &str = "2026-12-01T10:05:00";
const T_DONE: &str = "2026-12-31T18:00:00";
const MAX_SAFE: i64 = 9_007_199_254_740_991;

// ---------------------------------------------------------------------------
// fixture
// ---------------------------------------------------------------------------

fn product_full(
    conn: &DbConnection,
    code: &str,
    stock: i64,
    discontinued: bool,
    unit: &str,
    cost: i64,
) {
    conn.execute(
        "INSERT INTO products (product_code, jan_code, name, department_id, selling_price, cost_price,
            tax_rate, stock_quantity, stock_unit, is_discontinued, plu_dirty, pos_stock_sync,
            created_at, updated_at)
         VALUES (?1, NULL, '合成 ' || ?1, 1, 100, ?5, '10', ?2, ?4, ?3, 1, 1,
            '2026-01-01T00:00:00', '2026-01-01T00:00:00')",
        rusqlite::params![code, stock, discontinued, unit, cost],
    )
    .unwrap();
}

fn product(conn: &DbConnection, code: &str, stock: i64) {
    product_full(conn, code, stock, false, "pcs", 100);
}

/// (在庫, 版)
fn stock(conn: &DbConnection, code: &str) -> (i64, i64) {
    conn.query_row(
        "SELECT stock_quantity, stock_revision FROM products WHERE product_code = ?1",
        [code],
        |r| Ok((r.get(0)?, r.get(1)?)),
    )
    .unwrap()
}

/// 版の関数で在庫を動かし movement を残す（② の Matrix の在庫の移動）。movement ID を返す
fn move_stock(conn: &DbConnection, code: &str, delta: i64, movement_type: MovementType) -> i64 {
    let after = stock(conn, code).0 + delta;
    assert!(update_stock_quantity_with_revision(conn, code, after).unwrap());
    insert_movement(
        conn,
        &NewMovement {
            product_code: code.to_string(),
            movement_type,
            quantity: delta,
            stock_after: after,
            reference_type: None,
            reference_id: None,
            note: None,
        },
    )
    .unwrap()
}

/// 資料の受領（② の `receive_source` が TX の中で呼ぶ IO）
fn source(conn: &DbConnection, hash: &str) -> i64 {
    upsert_pos_import_source(
        conn,
        &NewPosImportSource {
            file_hash: hash.to_string(),
            received_at: "2026-12-01T21:00:00".to_string(),
            settlement_date: "2026-12-01".to_string(),
            machine_no: None,
            report_kind: None,
            settlement_no: None,
            settled_at: None,
        },
    )
    .unwrap()
    .id
}

/// 要再確認 flag を生の SQL で作る（作成は ④）
fn flag(conn: &DbConnection, code: &str, source_id: i64, reason: &str) {
    conn.execute_batch(
        "INSERT OR IGNORE INTO csv_imports (id, filename, settlement_date, file_hash, total_items,
            total_amount, skipped_count, status, imported_at)
         VALUES (900, 'Z004_SYNTH.CSV', '2026-12-01', 'synthetic-flag-import', 1, 100, 0, 'completed',
            '2026-12-01T22:00:00')",
    )
    .unwrap();
    conn.execute(
        "INSERT INTO stocktake_recount_flags
            (product_code, source_id, csv_import_id, reason, previous_recheck_pending)
         VALUES (?1, ?2, 900, ?3, 0)",
        rusqlite::params![code, source_id, reason],
    )
    .unwrap();
}

fn flags(conn: &DbConnection, code: &str) -> Vec<i64> {
    conn.prepare(
        "SELECT source_id FROM stocktake_recount_flags WHERE product_code = ?1 ORDER BY source_id",
    )
    .unwrap()
    .query_map([code], |r| r.get(0))
    .unwrap()
    .collect::<Result<_, _>>()
    .unwrap()
}

/// 全 table の全行（操作の前後で比べる）
fn snapshot(conn: &DbConnection) -> Vec<(String, Vec<Vec<Value>>)> {
    let tables: Vec<String> = conn
        .prepare("SELECT name FROM sqlite_master WHERE type = 'table' ORDER BY name")
        .unwrap()
        .query_map([], |r| r.get(0))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap();
    tables
        .into_iter()
        .map(|table| {
            let mut stmt = conn
                .prepare(&format!("SELECT * FROM \"{table}\" ORDER BY rowid"))
                .unwrap();
            let width = stmt.column_count();
            let rows = stmt
                .query_map([], |r| (0..width).map(|i| r.get(i)).collect())
                .unwrap()
                .collect::<Result<_, _>>()
                .unwrap();
            (table, rows)
        })
        .collect()
}

fn start(conn: &mut DbConnection) -> i64 {
    start_stocktake(conn, T_START).unwrap().stocktake_id
}

fn item_of(conn: &DbConnection, stocktake_id: i64, code: &str) -> i64 {
    conn.query_row(
        "SELECT id FROM stocktake_items WHERE stocktake_id = ?1 AND product_code = ?2",
        rusqlite::params![stocktake_id, code],
        |r| r.get(0),
    )
    .unwrap()
}

fn begin(
    conn: &mut DbConnection,
    item: i64,
    purpose: CountPurpose,
) -> (BeginCountResult, CountContext) {
    begin_stocktake_count(
        conn,
        &BeginCountRequest {
            stocktake_item_id: item,
            purpose,
        },
        GEN,
        T_BEGIN,
    )
    .unwrap()
}

fn save(
    conn: &mut DbConnection,
    ctx: &CountContext,
    n: i64,
) -> Result<CountSaveResult, CountError> {
    save_stocktake_count(conn, &ctx.count_token, n, Some(ctx), GEN, T_SAVE)
}

/// 進行中の明細を begin → 保存
fn count(conn: &mut DbConnection, item: i64, n: i64) -> CountSaveResult {
    let (_, ctx) = begin(conn, item, CountPurpose::InProgress);
    save(conn, &ctx, n).unwrap()
}

/// 確定済みの明細を参照して独立再実測
fn recount(conn: &mut DbConnection, item: i64, n: i64) -> CountSaveResult {
    let (_, ctx) = begin(conn, item, CountPurpose::IndependentRecount);
    save(conn, &ctx, n).unwrap()
}

fn complete(
    conn: &mut DbConnection,
    id: i64,
    force_fill: bool,
) -> Result<CompletionResult, CountError> {
    complete_stocktake(conn, id, force_fill, T_DONE)
}

fn guard_of<T: std::fmt::Debug>(
    result: Result<T, CountError>,
) -> (RecoveryCode, String, Vec<CountRecoveryTarget>) {
    match result {
        Err(CountError::Guard { message, recovery }) => (recovery.code, message, recovery.targets),
        other => panic!("回復型の拒否を期待: {other:?}"),
    }
}

/// 回復先 1 件の (action, 明細 ID)
fn single_target(targets: &[CountRecoveryTarget]) -> (RecoveryAction, Option<i64>) {
    assert_eq!(targets.len(), 1, "{targets:?}");
    (targets[0].action, targets[0].stocktake_item_id)
}

/// (kind, N, L, S, E, ledger_cursor, source_cursor, observation_revision, request_id)
type ItemRow = (
    String,
    Option<i64>,
    i64,
    Option<String>,
    Option<String>,
    Option<i64>,
    Option<i64>,
    Option<i64>,
    Option<String>,
);

fn item_row(conn: &DbConnection, item: i64) -> ItemRow {
    conn.query_row(
        "SELECT observation_kind, actual_count, system_stock, count_started_at, counted_at, ledger_cursor,
            source_cursor, observation_revision, request_id FROM stocktake_items WHERE id = ?1",
        [item],
        |r| {
            Ok((
                r.get(0)?,
                r.get(1)?,
                r.get(2)?,
                r.get(3)?,
                r.get(4)?,
                r.get(5)?,
                r.get(6)?,
                r.get(7)?,
                r.get(8)?,
            ))
        },
    )
    .unwrap()
}

/// 棚卸しの movement: (商品, 数量, stock_after, 補正区分, recount ID, reference_id)
type StocktakeMovement = (String, i64, i64, Option<String>, Option<i64>, Option<i64>);

fn stocktake_movements(conn: &DbConnection) -> Vec<StocktakeMovement> {
    conn.prepare(
        "SELECT product_code, quantity, stock_after, stocktake_adjustment_kind, stocktake_recount_id,
            reference_id FROM inventory_movements
         WHERE movement_type = 'stocktake' AND reference_type = 'stocktake' ORDER BY id",
    )
    .unwrap()
    .query_map([], |r| {
        Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?, r.get(5)?))
    })
    .unwrap()
    .collect::<Result<_, _>>()
    .unwrap()
}

fn header_state(conn: &DbConnection, id: i64) -> (String, Option<i64>, i64) {
    conn.query_row(
        "SELECT status, total_cost, reconciliation_version FROM stocktakes WHERE id = ?1",
        [id],
        |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)),
    )
    .unwrap()
}

fn int(conn: &DbConnection, sql: &str) -> i64 {
    conn.query_row(sql, [], |r| r.get(0)).unwrap()
}

// ---------------------------------------------------------------------------
// C3 開始
// ---------------------------------------------------------------------------

#[test]
fn test_start_stocktake_req205_c3_new_header_and_kinds() {
    // REQ-205 / SPEC-STK-TIME-D8 / 35 proposed「新方式の開始と明細のkind」/ C3
    let (_dir, mut conn) = setup_time_evidence_db();
    let empty = snapshot(&conn);
    assert!(matches!(
        start_stocktake(&mut conn, T_START),
        Err(BizError::ValidationFailed(_))
    ));
    assert_eq!(snapshot(&conn), empty, "対象 0 件は書込み 0");

    product(&conn, "TE-A", 5);
    product_full(&conn, "TE-D0", 0, true, "pcs", 100);
    product_full(&conn, "TE-D3", 3, true, "pcs", 100);
    let result = start_stocktake(&mut conn, T_START).unwrap();
    assert_eq!((result.item_count, result.auto_filled_count), (3, 1));
    let id = result.stocktake_id;
    assert_eq!(
        header_state(&conn, id),
        ("in_progress".to_string(), None, 1)
    );
    let row = |code| {
        let r = item_row(&conn, item_of(&conn, id, code));
        (r.0, r.1, r.2, r.4, r.6)
    };
    assert_eq!(
        row("TE-D0"),
        ("auto_filled".to_string(), Some(0), 0, None, None)
    );
    assert_eq!(row("TE-A"), ("uncounted".to_string(), None, 5, None, None));
    assert_eq!(row("TE-D3"), ("uncounted".to_string(), None, 3, None, None));

    let before = snapshot(&conn);
    assert!(matches!(
        start_stocktake(&mut conn, T_START),
        Err(BizError::StocktakeInProgress(_))
    ));
    assert_eq!(snapshot(&conn), before, "進行中があれば書込み 0");
}

// ---------------------------------------------------------------------------
// C4 begin
// ---------------------------------------------------------------------------

#[test]
fn test_begin_stocktake_count_req205_c4_context_and_owner() {
    // REQ-205 / SPEC-STK-TIME-D1 / D1-R1 / C4: begin は DB を書かず context を作る。用途と所有者の不一致
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 4);
    source(&conn, "hash-1");
    source(&conn, "hash-2");
    let first = start(&mut conn);
    let item = item_of(&conn, first, "TE-A");
    bump_stock_revision(&conn, "TE-A").unwrap(); // 版を 1 へ
    let before = snapshot(&conn);
    let (result, ctx) = begin(&mut conn, item, CountPurpose::InProgress);
    assert_eq!(snapshot(&conn), before, "begin は DB を書かない");
    assert!(uuid::Uuid::parse_str(&ctx.count_token).is_ok());
    assert_eq!(
        ctx,
        CountContext {
            count_token: result.count_token.clone(),
            purpose: CountPurpose::InProgress,
            stocktake_item_id: item,
            stocktake_id: first,
            product_code: "TE-A".to_string(),
            count_started_at: T_BEGIN.to_string(),
            stock_revision: 1,
            source_cursor: 2,
            db_generation: GEN,
        }
    );
    assert_eq!(
        result,
        BeginCountResult {
            count_token: ctx.count_token.clone(),
            stocktake_item_id: item,
            product_code: "TE-A".to_string(),
            product_name: "合成 TE-A".to_string(),
            stock_unit: ProductStockUnit::Pcs,
            book_at_start: 4,
            purpose: CountPurpose::InProgress,
        }
    );

    let changed = "数える対象の棚卸しが変わりました。表示し直してから数えてください";
    complete(&mut conn, first, true).unwrap();
    // (a) 進行中の用途で親が完了済み → 完了済み明細の独立再実測へ
    let before = snapshot(&conn);
    let begin_err = |conn: &mut DbConnection, item, purpose| {
        begin_stocktake_count(
            conn,
            &BeginCountRequest {
                stocktake_item_id: item,
                purpose,
            },
            GEN,
            T_BEGIN,
        )
    };
    let (code, message, targets) = guard_of(begin_err(&mut conn, item, CountPurpose::InProgress));
    assert_eq!(
        (code, message.as_str()),
        (RecoveryCode::CountTargetChanged, changed)
    );
    assert_eq!(
        single_target(&targets),
        (RecoveryAction::IndependentRecount, Some(item))
    );
    assert_eq!(targets[0].stocktake_id, Some(first));
    assert_eq!(snapshot(&conn), before);

    // (b) 独立再実測で参照明細の親が進行中 → その active 明細へ
    let second = start(&mut conn);
    let active = item_of(&conn, second, "TE-A");
    let before = snapshot(&conn);
    let (code, message, targets) = guard_of(begin_err(
        &mut conn,
        active,
        CountPurpose::IndependentRecount,
    ));
    assert_eq!(
        (code, message.as_str()),
        (RecoveryCode::CountTargetChanged, changed)
    );
    assert_eq!(
        single_target(&targets),
        (RecoveryAction::ActiveCount, Some(active))
    );
    // (c) 独立再実測で完了済みの明細を参照しても、同じ商品に active 明細がある → その明細へ
    let (code, _, targets) = guard_of(begin_err(&mut conn, item, CountPurpose::IndependentRecount));
    assert_eq!(code, RecoveryCode::CountTargetChanged);
    assert_eq!(
        single_target(&targets),
        (RecoveryAction::ActiveCount, Some(active))
    );
    assert_eq!(snapshot(&conn), before);

    assert!(matches!(
        begin_err(&mut conn, 9999, CountPurpose::InProgress),
        Err(CountError::Biz(BizError::NotFound(_)))
    ));
}

// ---------------------------------------------------------------------------
// C5〜C10 保存
// ---------------------------------------------------------------------------

#[test]
fn test_save_stocktake_count_req205_c5_active_measured_and_flags() {
    // REQ-205 / SPEC-STK-TIME-D1 / D4 / D8-L1 / C5: 進行中の保存。L は保存時の在庫、flag は source_id <= cursor だけ
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 10);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    // start の後・begin の前に版の関数で 10 → 7。最大の movement は void 済み
    let movement = move_stock(&conn, "TE-A", -3, MovementType::Disposal);
    conn.execute(
        "UPDATE inventory_movements SET is_voided = 1 WHERE id = ?1",
        [movement],
    )
    .unwrap();
    let s1 = source(&conn, "hash-1");
    let s2 = source(&conn, "hash-2");
    flag(&conn, "TE-A", s1, "sale_order_unknown");
    flag(&conn, "TE-A", s2, "offset_lines_present");
    let (_, ctx) = begin(&mut conn, item, CountPurpose::InProgress);
    // begin の後に受領した資料の flag（cursor 2 より後）
    let s3 = source(&conn, "hash-3");
    flag(&conn, "TE-A", s3, "sale_order_unknown");
    let revision_before = stock(&conn, "TE-A").1;

    let result = save(&mut conn, &ctx, 9).unwrap();
    assert_eq!(
        result,
        CountSaveResult {
            status: CountSaveStatus::Saved,
            stocktake_item_id: item,
            recount_id: None,
            system_stock: 7,
            actual_count: 9,
            difference: -2,
            stock_after: 7,
        }
    );
    let (quantity, revision) = stock(&conn, "TE-A");
    assert_eq!(quantity, 7, "在庫は変わらない");
    assert!(revision > revision_before);
    assert_eq!(
        item_row(&conn, item),
        (
            "measured".to_string(),
            Some(9),
            7,
            Some(T_BEGIN.to_string()),
            Some(T_SAVE.to_string()),
            Some(movement),
            Some(2),
            Some(revision),
            Some(ctx.count_token.clone()),
        ),
        "observation_revision は保存 TX の最後の版"
    );
    assert_eq!(
        flags(&conn, "TE-A"),
        vec![s3],
        "source 1・2 は消え、3 は残る"
    );
}

#[test]
fn test_save_stocktake_count_req205_req401_c6_cursor_fixed_at_begin() {
    // REQ-205 / REQ-401 / SPEC-STK-TIME-D1 / D2 / C6: begin の後に受領した資料は保存の後も計数の前と証明されない
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 10);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    let (_, ctx) = begin(&mut conn, item, CountPurpose::InProgress);
    assert_eq!(ctx.source_cursor, 0);
    // begin の後・保存の前に ② の receive_source で資料を受領する
    let text = [
        "\"精算日\",\"2026-12-01\",\"\",\"\",\"\"",
        "\"No.\",\"スキャニングコード\",\"商品名\",\"個数\",\"金額\"",
        "\"1\",\"2900000040001\",\"合成商品\",\"2\",\"200\"",
    ]
    .join("\r\n");
    let parsed = parse_z004(&encoding_rs::SHIFT_JIS.encode(&text).0).unwrap();
    let late = receive_source(&mut conn, &parsed, "2026-12-01T21:00:00").unwrap();
    flag(&conn, "TE-A", late, "sale_order_unknown");
    save(&mut conn, &ctx, 10).unwrap();

    // ② の classify_stock_rows: 保存の後もその資料は Unknown のまま（Before でない）
    let rows = [StockEvidenceRow {
        line_no: 1,
        normalized_jan: "2900000040001".to_string(),
        quantity: 2,
        amount: 200,
        candidates: vec![("TE-A".to_string(), true)],
    }];
    assert_eq!(
        classify_stock_rows(&conn, late, &rows).unwrap(),
        StockClassification::Committable(vec![RowDecision {
            line_no: 1,
            product_code: "TE-A".to_string(),
            effect: StockEffect::Unknown(UnknownReason::SaleOrderUnknown),
        }])
    );

    assert_eq!(
        item_row(&conn, item).6,
        Some(0),
        "source_cursor は begin の値"
    );
    // ② の classify_stock_rows はこの観測の source_cursor と比べて Before を決める（late > 0 なので Unknown）
    let observation = find_latest_effective_observation(&conn, "TE-A")
        .unwrap()
        .unwrap();
    assert_eq!(observation.owner, ObservationOwner::ActiveItem(item));
    match observation.kind {
        ObservationKind::Measured { source_cursor, .. } => {
            assert!(late > source_cursor, "late={late} cursor={source_cursor}")
        }
        other => panic!("measured を期待: {other:?}"),
    }
    assert_eq!(flags(&conn, "TE-A"), vec![late], "後着の資料の flag は残る");
}

#[test]
fn test_save_stocktake_count_req205_c7_guards_write_nothing() {
    // REQ-205 / SPEC-STK-TIME-D1 / D1-R1 / C7: 版・DB 世代・context・token・所有者の拒否は書込み 0
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 10);
    product(&conn, "TE-B", 5);
    let id = start(&mut conn);
    let item_a = item_of(&conn, id, "TE-A");
    let item_b = item_of(&conn, id, "TE-B");
    let latest = "最新の記録を確認してください";

    // (a) begin の後の在庫の移動
    let (_, ctx) = begin(&mut conn, item_a, CountPurpose::InProgress);
    move_stock(&conn, "TE-A", 1, MovementType::Receiving);
    let before = snapshot(&conn);
    let (code, message, targets) = guard_of(save(&mut conn, &ctx, 11));
    assert_eq!(
        (code, message.as_str()),
        (
            RecoveryCode::CountContextInvalid,
            "数えている間に記録が変わりました。もう一度数えてください"
        )
    );
    assert_eq!(
        single_target(&targets),
        (RecoveryAction::ActiveCount, Some(item_a))
    );
    assert_eq!(snapshot(&conn), before);

    // (b) DB 世代の違い
    let (_, ctx) = begin(&mut conn, item_a, CountPurpose::InProgress);
    let (code, message, _) = guard_of(save_stocktake_count(
        &mut conn,
        &ctx.count_token,
        11,
        Some(&ctx),
        GEN + 1,
        T_SAVE,
    ));
    assert_eq!(
        (code, message.as_str()),
        (RecoveryCode::CountContextInvalid, latest)
    );
    assert_eq!(snapshot(&conn), before);

    // (c) context なし（保存済みでない token）
    let (code, message, targets) = guard_of(save_stocktake_count(
        &mut conn,
        &ctx.count_token,
        11,
        None,
        GEN,
        T_SAVE,
    ));
    assert_eq!(
        (code, message.as_str()),
        (RecoveryCode::CountContextInvalid, latest)
    );
    assert!(targets.is_empty(), "商品が分からなければ空");
    assert_eq!(snapshot(&conn), before);

    // (e) 商品 A の token と商品 B の context の組
    let (_, ctx_b) = begin(&mut conn, item_b, CountPurpose::InProgress);
    let (code, message, _) = guard_of(save_stocktake_count(
        &mut conn,
        &ctx.count_token,
        3,
        Some(&ctx_b),
        GEN,
        T_SAVE,
    ));
    assert_eq!(
        (code, message.as_str()),
        (RecoveryCode::CountContextInvalid, latest)
    );
    assert_eq!(snapshot(&conn), before, "B の明細へ書かない");

    // (d) begin の後に親を確定（版も違う）→ 所有者の検査が先
    let (_, ctx) = begin(&mut conn, item_a, CountPurpose::InProgress);
    complete(&mut conn, id, true).unwrap();
    assert_ne!(stock(&conn, "TE-A").1, ctx.stock_revision);
    let before = snapshot(&conn);
    let (code, message, targets) = guard_of(save(&mut conn, &ctx, 11));
    assert_eq!(
        (code, message.as_str()),
        (
            RecoveryCode::CountTargetChanged,
            "数える対象の棚卸しが変わりました。表示し直してから数えてください"
        )
    );
    assert_eq!(
        single_target(&targets),
        (RecoveryAction::IndependentRecount, Some(item_a))
    );
    assert_eq!(snapshot(&conn), before);
}

#[test]
fn test_save_stocktake_count_req205_c8_count_range() {
    // REQ-205 / SPEC-STK-TIME-D1 / ADR D8 / C8: N は 0〜2^53-1。補正の overflow と、差異・補正量が
    // 安全な整数（±2^53-1）を外れる保存・再送は書込み 0 の ValidationFailed
    let (_dir, mut conn) = setup_time_evidence_db();
    product_full(&conn, "TE-A", 10, false, "pcs", 1);
    product(&conn, "TE-B", 10);
    product(&conn, "TE-C", 10);
    product(&conn, "TE-N", -MAX_SAFE);
    let id = start(&mut conn);
    let item_a = item_of(&conn, id, "TE-A");
    let (_, ctx) = begin(&mut conn, item_a, CountPurpose::InProgress);
    let before = snapshot(&conn);
    for n in [-1, MAX_SAFE + 1] {
        assert!(
            matches!(
                save(&mut conn, &ctx, n),
                Err(CountError::Biz(BizError::ValidationFailed(_)))
            ),
            "{n}"
        );
    }
    assert_eq!(snapshot(&conn), before);
    assert_eq!(
        save(&mut conn, &ctx, MAX_SAFE).unwrap().actual_count,
        MAX_SAFE
    );

    // 進行中: L = -(2^53-1)・N = 2 は L も N も安全だが差異 L − N が範囲外
    let item_n = item_of(&conn, id, "TE-N");
    let (_, ctx) = begin(&mut conn, item_n, CountPurpose::InProgress);
    let before = snapshot(&conn);
    assert!(matches!(
        save(&mut conn, &ctx, 2),
        Err(CountError::Biz(BizError::ValidationFailed(_)))
    ));
    assert_eq!(snapshot(&conn), before);

    complete(&mut conn, id, true).unwrap();
    let item_b = item_of(&conn, id, "TE-B");
    conn.execute(
        "UPDATE products SET stock_quantity = ?1 WHERE product_code = 'TE-B'",
        [i64::MIN + 1],
    )
    .unwrap();
    let (_, ctx) = begin(&mut conn, item_b, CountPurpose::IndependentRecount);
    let before = snapshot(&conn);
    assert!(matches!(
        save(&mut conn, &ctx, 1),
        Err(CountError::Biz(BizError::ValidationFailed(_)))
    ));
    assert_eq!(snapshot(&conn), before);

    // 独立再実測: L = -(2^53-1)・N = 2 は補正後の在庫 2 が安全でも補正量 N − L が範囲外
    let item_c = item_of(&conn, id, "TE-C");
    conn.execute(
        "UPDATE products SET stock_quantity = ?1 WHERE product_code = 'TE-C'",
        [-MAX_SAFE],
    )
    .unwrap();
    let (_, ctx) = begin(&mut conn, item_c, CountPurpose::IndependentRecount);
    let before = snapshot(&conn);
    assert!(matches!(
        save(&mut conn, &ctx, 2),
        Err(CountError::Biz(BizError::ValidationFailed(_)))
    ));
    assert_eq!(snapshot(&conn), before);

    // 再送: 範囲外の差異を持つ保存済みの行（生の SQL）を Replayed で返さない
    conn.execute(
        "INSERT INTO stocktake_recounts (stocktake_item_id, system_stock, actual_count, count_started_at,
            counted_at, ledger_cursor, source_cursor, observation_revision, request_id)
         VALUES (?1, ?2, 2, ?3, ?3, 0, 0, 1, 'rc-out-of-range')",
        rusqlite::params![item_c, -MAX_SAFE, T_SAVE],
    )
    .unwrap();
    assert!(matches!(
        save_stocktake_count(&mut conn, "rc-out-of-range", 2, None, GEN, T_SAVE),
        Err(CountError::Biz(BizError::ValidationFailed(_)))
    ));
}

#[test]
fn test_save_stocktake_count_req205_c9_tx_failure_rolls_back() {
    // REQ-205 / SPEC-STK-TIME-D1 / C9: 保存 TX の最後の書込みの失敗で、明細・flag・版・在庫・movement・recount が全て戻る
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 10);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    let s1 = source(&conn, "hash-1");
    flag(&conn, "TE-A", s1, "sale_order_unknown");
    let (_, ctx) = begin(&mut conn, item, CountPurpose::InProgress);
    let before = snapshot(&conn);
    conn.execute_batch(
        "CREATE TEMP TRIGGER fail_item BEFORE UPDATE ON stocktake_items
         BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;",
    )
    .unwrap();
    assert!(matches!(
        save(&mut conn, &ctx, 12),
        Err(CountError::Biz(BizError::DatabaseError(_)))
    ));
    assert_eq!(snapshot(&conn), before, "進行中の保存");
    conn.execute_batch("DROP TRIGGER fail_item").unwrap();
    save(&mut conn, &ctx, 12).unwrap();
    complete(&mut conn, id, false).unwrap();

    let s2 = source(&conn, "hash-2");
    flag(&conn, "TE-A", s2, "sale_order_unknown");
    let (_, ctx) = begin(&mut conn, item, CountPurpose::IndependentRecount);
    let before = snapshot(&conn);
    conn.execute_batch(
        "CREATE TEMP TRIGGER fail_movement BEFORE INSERT ON inventory_movements
         BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;",
    )
    .unwrap();
    assert!(matches!(
        save(&mut conn, &ctx, 15),
        Err(CountError::Biz(BizError::DatabaseError(_)))
    ));
    assert_eq!(snapshot(&conn), before, "独立再実測");
}

#[test]
fn test_save_stocktake_count_req205_c10_replay_and_conflict() {
    // REQ-205 / SPEC-STK-TIME-D1 / ADR D8 / C10: 再送は照会を先に、同値は Replayed、値違いは競合、古い token は失効
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 10);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    let (_, first) = begin(&mut conn, item, CountPurpose::InProgress);
    save(&mut conn, &first, 8).unwrap();
    let before = snapshot(&conn);
    let replayed = CountSaveResult {
        status: CountSaveStatus::Replayed,
        stocktake_item_id: item,
        recount_id: None,
        system_stock: 10,
        actual_count: 8,
        difference: 2,
        stock_after: 10,
    };
    assert_eq!(save(&mut conn, &first, 8).unwrap(), replayed);
    assert_eq!(
        save_stocktake_count(&mut conn, &first.count_token, 8, None, GEN, T_SAVE).unwrap(),
        replayed,
        "再起動の後（context なし）の再送"
    );
    assert!(matches!(
        save(&mut conn, &first, 9),
        Err(CountError::Biz(BizError::IdempotencyConflict(_)))
    ));
    assert_eq!(snapshot(&conn), before, "版も含め書込み 0");

    // 新しい token で保存し直した後の古い token（context あり）
    let (_, second) = begin(&mut conn, item, CountPurpose::InProgress);
    assert_eq!(
        save(&mut conn, &second, 7).unwrap().status,
        CountSaveStatus::Saved
    );
    let before = snapshot(&conn);
    let (code, message, _) = guard_of(save(&mut conn, &first, 8));
    assert_eq!(
        (code, message.as_str()),
        (
            RecoveryCode::CountContextInvalid,
            "最新の記録を確認してください"
        )
    );
    assert_eq!(snapshot(&conn), before);

    // request ID が明細と recount の両方にある異常
    conn.execute(
        "INSERT INTO stocktake_recounts (stocktake_item_id, system_stock, actual_count, count_started_at,
            counted_at, ledger_cursor, source_cursor, observation_revision, request_id)
         VALUES (?1, 10, 7, ?2, ?2, 0, 0, 1, ?3)",
        rusqlite::params![item, T_SAVE, second.count_token],
    )
    .unwrap();
    let before = snapshot(&conn);
    assert!(matches!(
        save(&mut conn, &second, 7),
        Err(CountError::Biz(BizError::DatabaseError(
            DbError::QueryFailed(_)
        )))
    ));
    assert_eq!(snapshot(&conn), before);
}

#[test]
fn test_save_stocktake_count_req205_c11_independent_recount() {
    // REQ-205 / SPEC-STK-TIME-D7 / C11: 追記・即時の recount 補正・確定済みの header と明細は不変
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 8);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    count(&mut conn, item, 8);
    assert_eq!(complete(&mut conn, id, false).unwrap().total_cost, 800);
    move_stock(&conn, "TE-A", -2, MovementType::SaleManual);
    let s1 = source(&conn, "hash-1");
    flag(&conn, "TE-A", s1, "sale_order_unknown");
    let completed = |conn: &DbConnection| {
        (
            header_state(conn, id),
            item_row(conn, item),
            int(conn, "SELECT valuation_cost_price FROM stocktake_items"),
        )
    };
    let record = completed(&conn);

    let (_, ctx) = begin(&mut conn, item, CountPurpose::IndependentRecount);
    let s2 = source(&conn, "hash-2");
    flag(&conn, "TE-A", s2, "sale_order_unknown");
    let first = save(&mut conn, &ctx, 8).unwrap();
    let r1 = first.recount_id.expect("recount の行");
    assert_eq!(
        (
            first.system_stock,
            first.actual_count,
            first.difference,
            first.stock_after
        ),
        (6, 8, -2, 8)
    );
    assert_eq!(stock(&conn, "TE-A").0, 8);
    assert_eq!(
        stocktake_movements(&conn),
        vec![(
            "TE-A".to_string(),
            2,
            8,
            Some("recount".to_string()),
            Some(r1),
            Some(id)
        )]
    );
    assert_eq!(
        completed(&conn),
        record,
        "確定済みの header・明細・評価原価は不変"
    );
    assert_eq!(
        flags(&conn, "TE-A"),
        vec![s2],
        "flag の解消は AC5 と同じ条件"
    );
    let r1_row = |conn: &DbConnection| {
        int(
            conn,
            &format!(
                "SELECT system_stock * 1000 + actual_count FROM stocktake_recounts WHERE id = {r1}"
            ),
        )
    };
    assert_eq!(r1_row(&conn), 6008);

    // 2 回目（差 0）: 行は増え、movement は増えず、1 回目の行は変わらない
    let second = recount(&mut conn, item, 8);
    assert_ne!(second.recount_id, Some(r1));
    assert_eq!(int(&conn, "SELECT COUNT(*) FROM stocktake_recounts"), 2);
    assert_eq!(stocktake_movements(&conn).len(), 1);
    assert_eq!(r1_row(&conn), 6008);
    assert_eq!(completed(&conn), record);
}

// ---------------------------------------------------------------------------
// C12〜C21 確定
// ---------------------------------------------------------------------------

#[test]
fn test_complete_stocktake_req205_c12_stk1_four_moves() {
    // REQ-205 / SPEC-STK-TIME-D8 / ADR D1 の数値例 / C12: 保存の後の入出庫を確定が打ち消さない（STK-1）
    for (movement_type, delta, expected) in [
        (MovementType::Receiving, 3, 13),
        (MovementType::SaleManual, -2, 8),
        (MovementType::Disposal, -1, 9),
        (MovementType::Return, 1, 11),
    ] {
        let (_dir, mut conn) = setup_time_evidence_db();
        product(&conn, "TE-A", 10);
        product(&conn, "TE-B", 5);
        product(&conn, "TE-C", 10);
        let id = start(&mut conn);
        let item = item_of(&conn, id, "TE-A");
        count(&mut conn, item, 10);
        let item = item_of(&conn, id, "TE-B");
        count(&mut conn, item, 7);
        let item = item_of(&conn, id, "TE-C");
        count(&mut conn, item, 12);
        move_stock(&conn, "TE-A", delta, movement_type);
        // 保存の後に動き、差も 0 でない商品: 10 → 保存 N=12 → 同じ移動 → 確定で (10 + delta) + 2
        move_stock(&conn, "TE-C", delta, movement_type);
        let result = complete(&mut conn, id, false).unwrap();
        assert_eq!(stock(&conn, "TE-A").0, expected, "{movement_type:?}");
        assert_eq!(stock(&conn, "TE-B").0, 7);
        assert_eq!(stock(&conn, "TE-C").0, expected + 2, "{movement_type:?}");
        let completion = |code: &str, quantity, after| {
            (
                code.to_string(),
                quantity,
                after,
                Some("completion".to_string()),
                None,
                Some(id),
            )
        };
        assert_eq!(
            stocktake_movements(&conn),
            vec![
                completion("TE-B", 2, 7),
                completion("TE-C", 2, expected + 2)
            ],
            "補正 0 の TE-A に movement を作らない"
        );
        assert_eq!(
            result.corrections,
            vec![
                CompletionCorrection {
                    product_code: "TE-B".to_string(),
                    system_stock: 5,
                    actual_count: 7,
                    adjustment: 2,
                    stock_after: 7,
                },
                CompletionCorrection {
                    product_code: "TE-C".to_string(),
                    system_stock: 10,
                    actual_count: 12,
                    adjustment: 2,
                    stock_after: expected + 2,
                }
            ]
        );
    }
}

#[test]
fn test_complete_stocktake_req205_c13_force_fill_and_valuation() {
    // REQ-205 / SPEC-STK-TIME-D8 / SPEC-STK-VAL / C13: force_fill は N=L=max(在庫,0)、評価数量は max(補正後の在庫,0)
    let (_dir, mut conn) = setup_time_evidence_db();
    product_full(&conn, "TE-CM", 200, false, "cm", 1000);
    product_full(&conn, "TE-NEG", -2, false, "pcs", 300);
    product_full(&conn, "TE-DISC", 0, true, "pcs", 50);
    let id = start(&mut conn);
    let cm = item_of(&conn, id, "TE-CM");
    count(&mut conn, cm, 250);
    move_stock(&conn, "TE-CM", 20, MovementType::Receiving); // 確定直前 220
    move_stock(&conn, "TE-DISC", 3, MovementType::Receiving); // 開始時の auto_filled の後の入庫

    let before = snapshot(&conn);
    assert!(matches!(
        complete(&mut conn, id, false),
        Err(CountError::Biz(BizError::ValidationFailed(_)))
    ));
    assert_eq!(snapshot(&conn), before);

    let result = complete(&mut conn, id, true).unwrap();
    // cm: 1000 円/100cm × 270cm = 2,700 円。負の在庫は評価数量 0。廃番 50 円 × 3 = 150 円（§20.5a）
    assert_eq!(result.total_cost, 2_850);
    assert_eq!(
        header_state(&conn, id),
        ("completed".to_string(), Some(2_850), 1)
    );
    assert_eq!(stock(&conn, "TE-CM").0, 270);
    assert_eq!(stock(&conn, "TE-NEG").0, -2, "負の在庫を 0 へ書き換えない");
    assert_eq!(stock(&conn, "TE-DISC").0, 3);
    let neg = item_row(&conn, item_of(&conn, id, "TE-NEG"));
    assert_eq!(
        (neg.0.as_str(), neg.1, neg.2, neg.4),
        ("auto_filled", Some(0), 0, None)
    );
    let valuations: Vec<(String, Option<i64>, i64)> = conn
        .prepare(
            "SELECT si.product_code, si.valuation_cost_price, p.cost_price FROM stocktake_items si
             JOIN products p ON p.product_code = si.product_code ORDER BY si.id",
        )
        .unwrap()
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap();
    assert_eq!(valuations.len(), 3);
    for (code, saved, cost) in valuations {
        assert_eq!(saved, Some(cost), "{code}");
    }
}

#[test]
fn test_complete_stocktake_req205_c14_flags_and_legacy_refuse() {
    // REQ-205 / SPEC-STK-TIME-D4 / D1-R1 / C14: 未解消の flag・legacy の明細は force_fill でも recount_required
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 4);
    product(&conn, "TE-B", 5);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-B");
    count(&mut conn, item, 5);
    let s1 = source(&conn, "hash-1");
    let s2 = source(&conn, "hash-2");
    flag(&conn, "TE-A", s1, "legacy_basis");
    flag(&conn, "TE-A", s2, "sale_order_unknown");
    let before = snapshot(&conn);
    let (code, message, targets) = guard_of(complete(&mut conn, id, true));
    assert_eq!(
        (code, message.as_str()),
        (
            RecoveryCode::RecountRequired,
            "取り込んだ後に数の再確認が必要です"
        )
    );
    assert_eq!(
        targets,
        vec![CountRecoveryTarget {
            product_code: "TE-A".to_string(),
            product_name: "合成 TE-A".to_string(),
            stocktake_item_id: Some(item_of(&conn, id, "TE-A")),
            stocktake_id: Some(id),
            action: RecoveryAction::ActiveCount,
            recount_reasons: vec![RecountReason::SaleOrderUnknown, RecountReason::LegacyBasis],
        }]
    );
    assert_eq!(snapshot(&conn), before);

    // 確定対象の棚卸しに残るのが legacy の明細だけ
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-L", 3);
    conn.execute_batch(
        "INSERT INTO stocktakes (id, started_at, status, reconciliation_version)
            VALUES (5, '2026-03-02T09:00:00', 'in_progress', 0);
         INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at,
            observation_kind) VALUES (5, 'TE-L', 3, 3, '2026-03-02T10:00:00', 'legacy');",
    )
    .unwrap();
    let before = snapshot(&conn);
    let (code, message, targets) = guard_of(complete(&mut conn, 5, true));
    assert_eq!(
        (code, message.as_str()),
        (
            RecoveryCode::RecountRequired,
            "更新前の記録です。今の数を確認してください"
        )
    );
    assert_eq!(
        single_target(&targets),
        (RecoveryAction::ActiveCount, Some(item_of(&conn, 5, "TE-L")))
    );
    assert!(targets[0].recount_reasons.is_empty());
    assert_eq!(snapshot(&conn), before);
}

#[test]
fn test_complete_stocktake_req205_c15_bumps_all_revisions() {
    // REQ-205 / SPEC-STK-TIME-D1 / C15: 差 0 の measured・auto_filled・force_fill の商品も版が進み、古い context は失効
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-M", 5);
    product_full(&conn, "TE-D", 0, true, "pcs", 100);
    product(&conn, "TE-U", 2);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-M");
    count(&mut conn, item, 5);
    let item = item_of(&conn, id, "TE-U");
    let (_, stale) = begin(&mut conn, item, CountPurpose::InProgress);
    let codes = ["TE-M", "TE-D", "TE-U"];
    let before: Vec<i64> = codes.iter().map(|c| stock(&conn, c).1).collect();
    complete(&mut conn, id, true).unwrap();
    for (code, revision) in codes.iter().zip(before) {
        assert!(stock(&conn, code).1 > revision, "{code}");
    }
    let (code, _, _) = guard_of(save(&mut conn, &stale, 2));
    assert_eq!(code, RecoveryCode::CountTargetChanged);
}

#[test]
fn test_complete_stocktake_req205_c16_legacy_active_to_v1() {
    // REQ-205 / SPEC-STK-TIME-D8 / D8-L1 / C16: 旧 active は legacy を数え直してから版 1 で確定。L は保存時の在庫
    let (_dir, mut conn) = setup_test_db();
    seed_legacy_fixture(&conn);
    apply_time_evidence(&conn);
    product(&conn, "LG-L1", 10);
    conn.execute_batch(
        "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at,
            observation_kind) VALUES (2, 'LG-L1', 10, 10, '2026-03-02T10:00:00', 'legacy');",
    )
    .unwrap();
    let before = snapshot(&conn);
    let (code, _, _) = guard_of(complete(&mut conn, 2, true));
    assert_eq!(code, RecoveryCode::RecountRequired, "数え直しの前は拒否");
    assert_eq!(snapshot(&conn), before);

    move_stock(&conn, "LG-L1", -3, MovementType::Disposal); // begin の前に 10 → 7
    let l1 = item_of(&conn, 2, "LG-L1");
    count(&mut conn, l1, 7);
    assert_eq!(
        item_row(&conn, l1).2,
        7,
        "L は保存時の在庫（作成時の 10 でない）"
    );
    // header 2 の残りの legacy を数え直す。LG-MEAS は完了済みの header 1 にも legacy を持つ
    for code in ["LG-MEAS", "LG-ODD", "LG-A35", "LG-A05", "LG-A33"] {
        let current = stock(&conn, code).0;
        let item = item_of(&conn, 2, code);
        count(&mut conn, item, current);
    }
    complete(&mut conn, 2, true).unwrap();
    assert_eq!(header_state(&conn, 2).2, 1);
    assert_eq!(stock(&conn, "LG-L1").0, 7, "作成時の L を使う誤りでは 4");
    assert_eq!(
        header_state(&conn, 1),
        ("completed".to_string(), Some(150), 0)
    );
}

#[test]
fn test_save_stocktake_count_req205_c17_supersedes_legacy_basis() {
    // REQ-205 / ADR D6 / C17: legacy が基準の商品に新しい適用済み実測を作る（legacy の取消の保留の解除先）
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-L", 3);
    conn.execute_batch(
        "INSERT INTO stocktakes (id, started_at, completed_at, status, total_cost, reconciliation_version)
            VALUES (5, '2026-03-01T09:00:00', '2026-03-01T18:00:00', 'completed', 300, 0);
         INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at,
            observation_kind) VALUES (5, 'TE-L', 3, 3, '2026-03-01T10:00:00', 'legacy');",
    )
    .unwrap();
    let legacy = item_of(&conn, 5, "TE-L");
    let latest = |conn: &DbConnection| {
        find_latest_effective_observation(conn, "TE-L")
            .unwrap()
            .unwrap()
    };
    assert_eq!(latest(&conn).kind, ObservationKind::Legacy);

    let recount_id = recount(&mut conn, legacy, 3).recount_id.unwrap();
    let observation = latest(&conn);
    assert_eq!(observation.owner, ObservationOwner::Recount(recount_id));
    assert!(matches!(observation.kind, ObservationKind::Measured { .. }));

    let id = start(&mut conn);
    let active = item_of(&conn, id, "TE-L");
    count(&mut conn, active, 3);
    let observation = latest(&conn);
    assert_eq!(observation.owner, ObservationOwner::ActiveItem(active));
    assert!(matches!(observation.kind, ObservationKind::Measured { .. }));
}

#[test]
fn test_complete_stocktake_req205_req401_c18_late_receipt_recount() {
    // REQ-205 / REQ-401 / SPEC-STK-TIME-D4 / ② Matrix G1b / C18: 保存の後に受領した資料の flag は数え直しで解消
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 10);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    let (_, ctx) = begin(&mut conn, item, CountPurpose::InProgress);
    assert_eq!(ctx.source_cursor, 0);
    save(&mut conn, &ctx, 10).unwrap();
    let s1 = source(&conn, "hash-1");
    move_stock(&conn, "TE-A", -2, MovementType::SaleAuto);
    flag(&conn, "TE-A", s1, "sale_order_unknown");
    let before = snapshot(&conn);
    let (code, _, _) = guard_of(complete(&mut conn, id, true));
    assert_eq!(code, RecoveryCode::RecountRequired);
    assert_eq!(snapshot(&conn), before);

    let (_, ctx) = begin(&mut conn, item, CountPurpose::InProgress);
    assert_eq!(ctx.source_cursor, s1);
    save(&mut conn, &ctx, 8).unwrap();
    assert!(flags(&conn, "TE-A").is_empty());
    complete(&mut conn, id, true).unwrap();
    assert_eq!(stock(&conn, "TE-A").0, 8);
}

#[test]
fn test_save_stocktake_count_req205_req401_c19_completed_late_import_recount() {
    // REQ-205 / REQ-401 / SPEC-STK-TIME-D4 / D7 / ② Matrix G2b / C19: 確定済みの商品の flag は独立再実測で解消
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 8);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    count(&mut conn, item, 8);
    complete(&mut conn, id, false).unwrap();
    let s1 = source(&conn, "hash-1");
    move_stock(&conn, "TE-A", -2, MovementType::SaleAuto);
    flag(&conn, "TE-A", s1, "sale_order_unknown");
    assert_eq!(stock(&conn, "TE-A").0, 6, "数え直すまでは 6");
    assert_eq!(flags(&conn, "TE-A"), vec![s1]);

    let (_, ctx) = begin(&mut conn, item, CountPurpose::IndependentRecount);
    assert!(ctx.source_cursor >= s1);
    let result = save(&mut conn, &ctx, 8).unwrap();
    assert_eq!(
        (result.system_stock, result.actual_count, result.stock_after),
        (6, 8, 8)
    );
    assert_eq!(stock(&conn, "TE-A").0, 8);
    assert!(flags(&conn, "TE-A").is_empty());
}

#[test]
fn test_complete_stocktake_req205_c20_tx_failure_rolls_back() {
    // REQ-205 / SPEC-STK-TIME-D8 / C20: 補正の後の header の UPDATE の失敗で、全 table が確定の前と一致
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-1", 10);
    product(&conn, "TE-2", 5);
    product(&conn, "TE-3", 4);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-1");
    count(&mut conn, item, 12);
    let item = item_of(&conn, id, "TE-2");
    count(&mut conn, item, 3);
    let before = snapshot(&conn);
    conn.execute_batch(
        "CREATE TEMP TRIGGER fail_complete BEFORE UPDATE ON stocktakes WHEN NEW.status = 'completed'
         BEGIN SELECT RAISE(ABORT, 'synthetic failure'); END;",
    )
    .unwrap();
    assert!(matches!(
        complete(&mut conn, id, true),
        Err(CountError::Biz(BizError::DatabaseError(_)))
    ));
    assert_eq!(snapshot(&conn), before);
}

#[test]
fn test_complete_stocktake_req205_c21_adjusted_stock_range() {
    // REQ-205 / SPEC-STK-TIME-D8 / ADR D8 / C21: 補正後の在庫か補正量が安全な整数を外れる確定は書込み 0 の ValidationFailed
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 10);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    count(&mut conn, item, 11);
    conn.execute(
        "UPDATE products SET stock_quantity = ?1 WHERE product_code = 'TE-A'",
        [MAX_SAFE],
    )
    .unwrap();
    let before = snapshot(&conn);
    assert!(matches!(
        complete(&mut conn, id, false),
        Err(CountError::Biz(BizError::ValidationFailed(_)))
    ));
    assert_eq!(snapshot(&conn), before);

    // 補正後の在庫 2 が安全でも、補正量 N − L = 2^53 + 1 が範囲外（L = 在庫 = -(2^53-1)、N = 2。生の SQL）
    let (_dir, mut conn) = setup_time_evidence_db();
    product(&conn, "TE-A", 0);
    let id = start(&mut conn);
    let item = item_of(&conn, id, "TE-A");
    conn.execute(
        "UPDATE products SET stock_quantity = ?1 WHERE product_code = 'TE-A'",
        [-MAX_SAFE],
    )
    .unwrap();
    conn.execute(
        "UPDATE stocktake_items SET observation_kind = 'measured', actual_count = 2, system_stock = ?1,
            count_started_at = ?2, counted_at = ?2, ledger_cursor = 0, source_cursor = 0,
            observation_revision = 1, request_id = 'req-out-of-range' WHERE id = ?3",
        rusqlite::params![-MAX_SAFE, T_SAVE, item],
    )
    .unwrap();
    let before = snapshot(&conn);
    assert!(matches!(
        complete(&mut conn, id, false),
        Err(CountError::Biz(BizError::ValidationFailed(_)))
    ));
    assert_eq!(snapshot(&conn), before);
}
