//! ㉘ ②: 資料の受領・精算の同一性・前後の分類（SPEC-STK-TIME-D2〜D4、Matrix T11〜T23）。
//! 時点証拠 schema を当てた試験 DB（`setup_time_evidence_db`）の上で、合成値だけを使う。
//! 期待値は ADR の判定表と 32 proposed 節から決め、実装の分岐を写さない。

use crate::biz::csv_import_service::test_support::{create_test_product_with_jan, make_z004_bytes};
use crate::biz::csv_import_service::time_evidence::*;
use crate::biz::csv_import_service::{parse, CsvParseAndValidateRequest};
use crate::biz::BizError;
use crate::db::sales_repo::time_evidence::{
    get_pos_import_source, max_pos_import_source_id, record_identity_rejection,
    upsert_pos_import_source, IdentityRejectionCode, NewPosImportSource,
};
use crate::db::test_support::setup_time_evidence_db;
use crate::db::{DbConnection, DbError};
use crate::io::z004_parser::parse_z004;
use IdentityRejectionCode::{IdentityConflict, MissingIdentity};

const DATE: &str = "2026-03-20";
const KIND: &str = "Z004_SYNTH";

/// (report_kind, machine_no, settlement_no)
type Meta<'a> = (Option<&'a str>, Option<&'a str>, Option<&'a str>);
/// DB に観測を作り、分類する source ID を返す
type BuildCase = fn(&DbConnection) -> i64;

fn layout_a_bytes(machine_no: &str, settlement_no: &str, jan: &str) -> Vec<u8> {
    let text = [
        format!("\"マシンNo.   \",\"{machine_no}\""),
        format!("\"ファイル    \",\"{KIND}\""),
        "\"モード      \",\"SYNTH\"".to_string(),
        format!("\"精算回数    \",\"{settlement_no}\""),
        format!("\"日付        \",\"{DATE}\""),
        "\"時刻        \",\"18:30\"".to_string(),
        String::new(),
        "\"レコード    \",\"ｽｷｬﾆﾝｸﾞｺｰﾄﾞ \",\"キャラクター\",\"個数        \",\"金額        \""
            .to_string(),
        format!("\"1\",\"{jan}\",\"合成商品\",\"1\",\"100\""),
    ]
    .join("\r\n");
    encoding_rs::SHIFT_JIS.encode(&text).0.into_owned()
}

/// 受領 source を直接作る（meta = (report_kind, machine_no, settlement_no)）
fn source(conn: &DbConnection, hash: &str, date: &str, meta: Meta) -> i64 {
    upsert_pos_import_source(
        conn,
        &NewPosImportSource {
            file_hash: hash.to_string(),
            received_at: "2026-03-20T21:00:00".to_string(),
            settlement_date: date.to_string(),
            report_kind: meta.0.map(str::to_string),
            machine_no: meta.1.map(str::to_string),
            settlement_no: meta.2.map(str::to_string),
            settled_at: None,
        },
    )
    .unwrap()
    .id
}

fn full(settlement_no: &str) -> Meta<'_> {
    (Some(KIND), Some("0001"), Some(settlement_no))
}

/// 旧形の import 行を生の SQL で作る（source なしは None）
fn import(conn: &DbConnection, date: &str, status: &str, source_id: Option<i64>) -> i64 {
    conn.execute(
        "INSERT INTO csv_imports (filename, settlement_date, file_hash, total_items, total_amount,
            skipped_count, status, imported_at, source_id)
         VALUES ('Z004_SYNTH.CSV', ?1, 'import-hash-' || (SELECT COUNT(*) FROM csv_imports), 1, 100,
            0, ?2, '2026-03-20T22:00:00', ?3)",
        rusqlite::params![date, status, source_id],
    )
    .unwrap();
    conn.last_insert_rowid()
}

fn business_counts(conn: &DbConnection) -> Vec<i64> {
    [
        "products",
        "sale_records",
        "inventory_movements",
        "csv_imports",
    ]
    .iter()
    .map(|table| {
        conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |r| r.get(0))
            .unwrap()
    })
    .collect()
}

fn inspect(conn: &DbConnection, source_id: i64) -> Option<IdentityRejectionCode> {
    inspect_settlement_identity(conn, source_id).unwrap()
}

fn evidence(
    conn: &DbConnection,
    source_id: i64,
) -> (Option<IdentityRejectionCode>, Option<String>) {
    let source = get_pos_import_source(conn, source_id).unwrap().unwrap();
    (source.identity_rejection_code, source.identity_rejected_at)
}

// ---------------------------------------------------------------------------
// T11・T12 受領（SPEC-STK-TIME-D2）
// ---------------------------------------------------------------------------

#[test]
fn test_receive_source_req401_t11_same_hash_keeps_first_id() {
    // REQ-401 / SPEC-STK-TIME-D2 / T11: 同じ hash は最初の ID と受領時刻、別 hash は新しい大きい ID
    let (_dir, mut conn) = setup_time_evidence_db();
    assert_eq!(max_pos_import_source_id(&conn).unwrap(), 0);

    let parsed = parse_z004(&layout_a_bytes("0001", "0042", "2900000020001")).unwrap();
    let first = receive_source(&mut conn, &parsed, "2026-03-20T21:00:00").unwrap();
    let again = receive_source(&mut conn, &parsed, "2026-03-21T09:00:00").unwrap();
    assert_eq!(again, first);
    let stored = get_pos_import_source(&conn, first).unwrap().unwrap();
    assert_eq!(stored.received_at, "2026-03-20T21:00:00");
    // IO の識別メタ（T24 と同じ形）が文字列のまま保存される
    assert_eq!(stored.machine_no.as_deref(), Some("0001"));
    assert_eq!(stored.settlement_no.as_deref(), Some("0042"));
    assert_eq!(stored.report_kind.as_deref(), Some(KIND));
    assert_eq!(stored.settled_at.as_deref(), Some("2026-03-20T18:30"));
    assert_eq!(stored.settlement_date, DATE);

    let other = parse_z004(&layout_a_bytes("0001", "0043", "2900000020001")).unwrap();
    let second = receive_source(&mut conn, &other, "2026-03-21T21:00:00").unwrap();
    assert!(second > first);
    assert_eq!(max_pos_import_source_id(&conn).unwrap(), second);
}

#[test]
fn test_receive_source_req401_t12_survives_business_rollback() {
    // REQ-401 / SPEC-STK-TIME-D2 / T12: 受領の後に別 TX の業務 write を rollback しても受領は残る
    let (_dir, mut conn) = setup_time_evidence_db();
    let parsed = parse_z004(&layout_a_bytes("0001", "0042", "2900000020001")).unwrap();
    let id = receive_source(&mut conn, &parsed, "2026-03-20T21:00:00").unwrap();

    let tx = conn.transaction().unwrap();
    import(&tx, DATE, "completed", Some(id));
    tx.rollback().unwrap();

    assert!(get_pos_import_source(&conn, id).unwrap().is_some());
    assert_eq!(max_pos_import_source_id(&conn).unwrap(), id);
    assert_eq!(business_counts(&conn)[3], 0);
}

// ---------------------------------------------------------------------------
// T13〜T16 精算の同一性（SPEC-STK-TIME-D3）
// ---------------------------------------------------------------------------

#[test]
fn test_check_settlement_identity_req401_t13_conflict_with_any_received_source() {
    // REQ-401 / SPEC-STK-TIME-D3 / T13: 同じ帳票種別・machine_no・settlement_no の別 hash は、
    // 相手が未取込み / 取消済み / active のどれでも業務 write の前に拒否する
    for partner_status in [None, Some("rolled_back"), Some("completed")] {
        let (_dir, mut conn) = setup_time_evidence_db();
        let partner = source(&conn, "hash-a", DATE, full("0042"));
        if let Some(status) = partner_status {
            import(&conn, DATE, status, Some(partner));
        }
        let target = source(&conn, "hash-b", DATE, full("0042"));
        let before = business_counts(&conn);
        match check_settlement_identity(&mut conn, target, "2026-03-20T22:00:00") {
            Err(IdentityGuardError::Rejected(code)) => {
                assert_eq!(code, IdentityConflict, "{partner_status:?}")
            }
            other => panic!("拒否を期待 {partner_status:?}: {other:?}"),
        }
        assert_eq!(business_counts(&conn), before);
    }

    // 対照: NULL どうし・report_kind だけ None・帳票種別の違いは衝突にしない（同日の active なし）
    let (_dir, mut conn) = setup_time_evidence_db();
    source(&conn, "hash-n1", DATE, (Some(KIND), None, None));
    let nulls = source(&conn, "hash-n2", DATE, (Some(KIND), None, None));
    assert!(check_settlement_identity(&mut conn, nulls, "t").is_ok());
    source(&conn, "hash-k1", DATE, (None, Some("0001"), Some("0050")));
    let no_kind = source(&conn, "hash-k2", DATE, (None, Some("0001"), Some("0050")));
    assert!(check_settlement_identity(&mut conn, no_kind, "t").is_ok());
    source(
        &conn,
        "hash-r1",
        DATE,
        (Some("Z004_OTHER"), Some("0001"), Some("0060")),
    );
    let other_kind = source(&conn, "hash-r2", DATE, full("0060"));
    assert!(check_settlement_identity(&mut conn, other_kind, "t").is_ok());

    // 存在しない source
    assert!(matches!(
        inspect_settlement_identity(&conn, 999_999),
        Err(BizError::DatabaseError(DbError::NotFound))
    ));
}

#[test]
fn test_check_settlement_identity_req401_t14_first_evidence_kept() {
    // REQ-401 / SPEC-STK-TIME-D3 / T14: 拒否の初回の code と時刻を 2 列とも残し、2 回目で上書きしない
    let (_dir, mut conn) = setup_time_evidence_db();
    source(&conn, "hash-a", DATE, full("0042"));
    let target = source(&conn, "hash-b", DATE, full("0042"));
    let before = business_counts(&conn);

    assert!(matches!(
        check_settlement_identity(&mut conn, target, "2026-03-20T22:00:00"),
        Err(IdentityGuardError::Rejected(IdentityConflict))
    ));
    assert_eq!(
        evidence(&conn, target),
        (
            Some(IdentityConflict),
            Some("2026-03-20T22:00:00".to_string())
        )
    );
    assert_eq!(business_counts(&conn), before);

    assert!(matches!(
        check_settlement_identity(&mut conn, target, "2026-03-21T09:00:00"),
        Err(IdentityGuardError::Rejected(IdentityConflict))
    ));
    assert!(
        !record_identity_rejection(&conn, target, MissingIdentity, "2026-03-22T09:00:00").unwrap()
    );
    assert_eq!(
        evidence(&conn, target),
        (
            Some(IdentityConflict),
            Some("2026-03-20T22:00:00".to_string())
        )
    );
}

#[test]
fn test_inspect_settlement_identity_req401_t14b_caller_tx_rolls_back_before_evidence() {
    // REQ-401 / SPEC-STK-TIME-D3 / T14b（④ の caller の形）: caller の TX で業務の行を書いた後に core が拒否
    // → rollback → 自分で TX を開く証拠。業務の行は残らず、証拠は 2 列とも残る
    let (_dir, mut conn) = setup_time_evidence_db();
    source(&conn, "hash-a", DATE, full("0042"));
    let target = source(&conn, "hash-b", DATE, full("0042"));

    let tx = conn.transaction().unwrap();
    let written = import(&tx, "2026-03-25", "completed", Some(target));
    let code = inspect_settlement_identity(&tx, target).unwrap().unwrap();
    tx.rollback().unwrap();
    assert!(
        record_identity_rejection_evidence(&mut conn, target, code, "2026-03-20T22:00:00").unwrap()
    );

    let remaining: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM csv_imports WHERE id = ?1",
            [written],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(remaining, 0);
    assert_eq!(
        evidence(&conn, target),
        (
            Some(IdentityConflict),
            Some("2026-03-20T22:00:00".to_string())
        )
    );

    // 通過側: core が None なら同じ TX の書込みが commit される
    let fine = source(&conn, "hash-c", DATE, full("0043"));
    let tx = conn.transaction().unwrap();
    let written = import(&tx, "2026-03-25", "completed", Some(fine));
    assert_eq!(inspect_settlement_identity(&tx, fine).unwrap(), None);
    tx.commit().unwrap();
    let kept: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM csv_imports WHERE id = ?1",
            [written],
            |r| r.get(0),
        )
        .unwrap();
    assert_eq!(kept, 1);
    assert_eq!(evidence(&conn, fine), (None, None));
}

#[test]
fn test_inspect_settlement_identity_req401_t15_missing_identity_with_same_day_active() {
    // REQ-401 / SPEC-STK-TIME-D3 / T15: 同じ精算日の active import があり、取込み対象か比較先（全件）で
    // machine_no / settlement_no が欠ければ拒否する。欠けを候補 0 件として通さない
    let target_cases: [(&str, Meta); 3] = [
        ("(a) 両方欠け", (Some(KIND), None, None)),
        ("(b) machine_no 欠け", (Some(KIND), None, Some("0050"))),
        ("(c) settlement_no 欠け", (Some(KIND), Some("0001"), None)),
    ];
    for (case, meta) in target_cases {
        let (_dir, conn) = setup_time_evidence_db();
        let existing = source(&conn, "hash-a", DATE, full("0042"));
        import(&conn, DATE, "completed", Some(existing));
        let target = source(&conn, "hash-b", DATE, meta);
        assert_eq!(inspect(&conn, target), Some(MissingIdentity), "{case}");
    }

    // (d) 比較先の import に source が無い（旧 import）
    let (_dir, conn) = setup_time_evidence_db();
    import(&conn, DATE, "completed", None);
    let target = source(&conn, "hash-b", DATE, full("0050"));
    assert_eq!(inspect(&conn, target), Some(MissingIdentity), "(d)");

    // (e) 比較先の source の machine_no だけ NULL / settlement_no だけ NULL
    for meta in [
        (Some(KIND), None, Some("0042")),
        (Some(KIND), Some("0001"), None),
    ] {
        let (_dir, conn) = setup_time_evidence_db();
        let existing = source(&conn, "hash-a", DATE, meta);
        import(&conn, DATE, "completed_partial", Some(existing));
        let target = source(&conn, "hash-b", DATE, full("0050"));
        assert_eq!(
            inspect(&conn, target),
            Some(MissingIdentity),
            "(e) {meta:?}"
        );
    }

    // (f) 同日の active が 2 件で 2 件目だけ欠ける
    let (_dir, conn) = setup_time_evidence_db();
    let first = source(&conn, "hash-a", DATE, full("0042"));
    import(&conn, DATE, "completed", Some(first));
    let second = source(&conn, "hash-c", DATE, (Some(KIND), Some("0001"), None));
    import(&conn, DATE, "completed", Some(second));
    let target = source(&conn, "hash-b", DATE, full("0050"));
    assert_eq!(inspect(&conn, target), Some(MissingIdentity), "(f)");

    // (g) 別 hash の衝突とメタ不足の両方に当たる → 衝突を先に返す
    let (_dir, conn) = setup_time_evidence_db();
    import(&conn, DATE, "completed", None);
    source(&conn, "hash-a", DATE, full("0050"));
    let target = source(&conn, "hash-b", DATE, full("0050"));
    assert_eq!(inspect(&conn, target), Some(IdentityConflict), "(g)");

    // 対照: 取込み対象自身の source の active import（取消後の再取込み）は比較先に入れない
    let (_dir, conn) = setup_time_evidence_db();
    let target = source(&conn, "hash-b", DATE, (Some(KIND), None, None));
    import(&conn, DATE, "rolled_back", Some(target));
    import(&conn, DATE, "completed", Some(target));
    assert_eq!(inspect(&conn, target), None, "自己除外");
}

#[test]
fn test_inspect_settlement_identity_req401_t16_no_same_day_active_skips_missing_check() {
    // REQ-401 / SPEC-STK-TIME-D3 / T16: 同じ精算日の active が無ければメタが欠けてもこの追加の拒否はしない。
    // 別 hash の衝突の検査は続ける。メタが揃い settlement_no が違う同日の別精算は通す
    let missing = (Some(KIND), None, None);

    let (_dir, conn) = setup_time_evidence_db();
    let target = source(&conn, "hash-b", DATE, missing);
    assert_eq!(inspect(&conn, target), None, "初回");

    let (_dir, conn) = setup_time_evidence_db();
    import(&conn, "2026-03-19", "completed", None);
    let target = source(&conn, "hash-b", DATE, missing);
    assert_eq!(inspect(&conn, target), None, "他日だけ");

    let (_dir, conn) = setup_time_evidence_db();
    import(&conn, DATE, "rolled_back", None);
    let target = source(&conn, "hash-b", DATE, missing);
    assert_eq!(inspect(&conn, target), None, "同日は取消済みだけ");

    let (_dir, conn) = setup_time_evidence_db();
    source(&conn, "hash-a", "2026-03-19", full("0042"));
    let target = source(&conn, "hash-b", DATE, full("0042"));
    assert_eq!(
        inspect(&conn, target),
        Some(IdentityConflict),
        "衝突は検査する"
    );

    let (_dir, conn) = setup_time_evidence_db();
    let existing = source(&conn, "hash-a", DATE, full("0042"));
    import(&conn, DATE, "completed", Some(existing));
    let target = source(&conn, "hash-b", DATE, full("0043"));
    assert_eq!(inspect(&conn, target), None, "(d) 同日の別精算");
}

// ---------------------------------------------------------------------------
// T17〜T22 前後の分類（SPEC-STK-TIME-D4）
// ---------------------------------------------------------------------------

fn header(conn: &DbConnection, status: &str) -> i64 {
    conn.execute(
        "INSERT INTO stocktakes (started_at, status, reconciliation_version)
         VALUES ('2026-03-01T09:00:00', ?1, 1)",
        [status],
    )
    .unwrap();
    conn.last_insert_rowid()
}

/// 明細を生の SQL で作る。measured は (source_cursor, observation_revision, count_started_at, counted_at)
fn item(
    conn: &DbConnection,
    stocktake_id: i64,
    product_code: &str,
    kind: &str,
    measured: Option<(i64, i64, &str, &str)>,
) -> i64 {
    let (cursor, revision, started, counted) = match measured {
        Some((c, r, s, e)) => (Some(c), Some(r), Some(s), Some(e)),
        None => (None, None, None, None),
    };
    let (actual, legacy_counted) = match kind {
        "legacy" => (Some(3), Some("2026-02-01T10:00:00")),
        "auto_filled" => (Some(0), None),
        "measured" => (Some(3), counted),
        _ => (None, None),
    };
    conn.execute(
        "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at,
            observation_kind, count_started_at, observation_revision, ledger_cursor, source_cursor, request_id)
         VALUES (?1, ?2, 0, ?3, ?4, ?5, ?6, ?7, ?8, ?9,
            CASE WHEN ?5 = 'measured' THEN 'req-' || (SELECT COUNT(*) FROM stocktake_items) END)",
        rusqlite::params![
            stocktake_id,
            product_code,
            actual,
            legacy_counted,
            kind,
            started,
            revision,
            cursor.map(|_| 0),
            cursor
        ],
    )
    .unwrap();
    conn.last_insert_rowid()
}

fn measured(
    conn: &DbConnection,
    stocktake_id: i64,
    product_code: &str,
    cursor: i64,
    revision: i64,
) -> i64 {
    item(
        conn,
        stocktake_id,
        product_code,
        "measured",
        Some((
            cursor,
            revision,
            "2026-03-01T10:00:00",
            "2026-03-01T10:05:00",
        )),
    )
}

fn recount(conn: &DbConnection, item_id: i64, cursor: i64, revision: i64, counted_at: &str) {
    conn.execute(
        "INSERT INTO stocktake_recounts (stocktake_item_id, system_stock, actual_count, count_started_at,
            counted_at, ledger_cursor, source_cursor, observation_revision, request_id)
         VALUES (?1, 0, 3, ?2, ?2, 0, ?3, ?4, 'rc-' || (SELECT COUNT(*) FROM stocktake_recounts))",
        rusqlite::params![item_id, counted_at, cursor, revision],
    )
    .unwrap();
}

fn row(
    line_no: usize,
    quantity: i32,
    amount: i32,
    candidates: &[(&str, bool)],
) -> StockEvidenceRow {
    StockEvidenceRow {
        line_no,
        normalized_jan: "2900000030001".to_string(),
        quantity,
        amount,
        candidates: candidates
            .iter()
            .map(|(p, s)| (p.to_string(), *s))
            .collect(),
    }
}

/// 一意の商品 1 行の分類結果
fn effect(
    conn: &DbConnection,
    source_id: i64,
    product: &str,
    quantity: i32,
    amount: i32,
) -> StockEffect {
    match classify_stock_rows(
        conn,
        source_id,
        &[row(1, quantity, amount, &[(product, true)])],
    )
    .unwrap()
    {
        StockClassification::Committable(decisions) => {
            assert_eq!(decisions.len(), 1);
            decisions[0].effect
        }
        held => panic!("一意の商品は held にならない: {held:?}"),
    }
}

fn product(conn: &DbConnection, code: &str, sync: bool) {
    create_test_product_with_jan(conn, code, "2900000030001", 10, sync);
}

#[test]
fn test_classify_stock_rows_req401_t17_non_sync_is_sales_only() {
    // REQ-401 / SPEC-STK-TIME-D4 / T17: pos_stock_sync=false は売上のみ（実測があっても在庫連動へ昇格しない）
    let (_dir, conn) = setup_time_evidence_db();
    product(&conn, "P-OFF", false);
    let active = header(&conn, "in_progress");
    measured(&conn, active, "P-OFF", 1, 1);
    let rows = [row(1, 2, 200, &[("P-OFF", false)])];
    assert_eq!(
        classify_stock_rows(&conn, 5, &rows).unwrap(),
        StockClassification::Committable(vec![RowDecision {
            line_no: 1,
            product_code: "P-OFF".to_string(),
            effect: StockEffect::SalesOnly,
        }])
    );
}

#[test]
fn test_classify_stock_rows_req205_req401_t18_never_observed_is_after() {
    // REQ-205 / REQ-401 / SPEC-STK-TIME-D4 / T18: 実測の履歴なし → After（uncounted の明細は観測でない）
    let (_dir, conn) = setup_time_evidence_db();
    product(&conn, "P-1", true);
    let active = header(&conn, "in_progress");
    item(&conn, active, "P-1", "uncounted", None);
    assert_eq!(effect(&conn, 1, "P-1", 2, 200), StockEffect::After);
}

#[test]
fn test_classify_stock_rows_req205_req401_t19_legacy_basis() {
    // REQ-205 / REQ-401 / SPEC-STK-TIME-D4 / T19: legacy は未実測へ落とさず Unknown（legacy_basis）
    let (_dir, conn) = setup_time_evidence_db();
    product(&conn, "P-1", true);
    let completed = header(&conn, "completed");
    item(&conn, completed, "P-1", "legacy", None);
    let legacy = StockEffect::Unknown(UnknownReason::LegacyBasis);
    assert_eq!(effect(&conn, 1, "P-1", 2, 200), legacy);
    assert_eq!(effect(&conn, 1, "P-1", 0, 0), legacy, "数量 0 の行でも");

    // legacy の後の auto_filled は前の観測を隠さない
    let later = header(&conn, "in_progress");
    item(&conn, later, "P-1", "auto_filled", None);
    assert_eq!(effect(&conn, 1, "P-1", 2, 200), legacy);

    // (c) legacy の後に新方式の measured（cursor = 4）→ source 4 は Before
    let measured_item = measured(&conn, later, "P-1", 4, 1);
    assert_eq!(effect(&conn, 4, "P-1", 2, 200), StockEffect::Before);

    // measured の source_cursor が NULL（データ破損）→ QueryFailed（Legacy・未実測に落とさない）
    conn.execute(
        "UPDATE stocktake_items SET source_cursor = NULL WHERE id = ?1",
        [measured_item],
    )
    .unwrap();
    assert!(matches!(
        classify_stock_rows(&conn, 4, &[row(1, 2, 200, &[("P-1", true)])]),
        Err(BizError::DatabaseError(DbError::QueryFailed(_)))
    ));
}

#[test]
fn test_classify_stock_rows_req205_req401_t20_source_cursor_boundary_and_latest() {
    // REQ-205 / REQ-401 / SPEC-STK-TIME-D4 / T20: source.id <= source_cursor が Before、時刻に依らない
    let (_dir, conn) = setup_time_evidence_db();
    product(&conn, "P-1", true);
    let active = header(&conn, "in_progress");
    let measured_item = measured(&conn, active, "P-1", 5, 1);
    let unknown = StockEffect::Unknown(UnknownReason::SaleOrderUnknown);
    assert_eq!(effect(&conn, 5, "P-1", 2, 200), StockEffect::Before);
    assert_eq!(effect(&conn, 6, "P-1", 2, 200), unknown);

    // 明細の時刻と source の settled_at を前後に入れ替えても同じ（分類の入力は source ID だけ）
    conn.execute(
        "UPDATE stocktake_items SET count_started_at = '2099-12-31T23:00:00', counted_at = '2000-01-01T00:00:00'
         WHERE id = ?1",
        [measured_item],
    )
    .unwrap();
    for (n, settled_at) in [(1, "1999-01-01T00:00"), (2, "2099-01-01T00:00")] {
        upsert_pos_import_source(
            &conn,
            &NewPosImportSource {
                file_hash: format!("hash-t{n}"),
                received_at: "2026-03-20T21:00:00".to_string(),
                settlement_date: DATE.to_string(),
                machine_no: None,
                report_kind: None,
                settlement_no: None,
                settled_at: Some(settled_at.to_string()),
            },
        )
        .unwrap();
    }
    assert_eq!(effect(&conn, 5, "P-1", 2, 200), StockEffect::Before);
    assert_eq!(effect(&conn, 6, "P-1", 2, 200), unknown);

    let latest_cases: [(&str, BuildCase); 5] = [
        // (a) 完了済みの明細 版 2・cursor 7 → 後の recount 版 3・cursor 8 → source 8 は Before
        ("(a)", |conn| {
            let done = header(conn, "completed");
            let it = measured(conn, done, "P-1", 7, 2);
            recount(conn, it, 8, 3, "2026-03-05T10:00:00");
            8
        }),
        // (b) recount の時刻が明細より前でも版が大きい recount を選ぶ
        ("(b)", |conn| {
            let done = header(conn, "completed");
            let it = item(
                conn,
                done,
                "P-1",
                "measured",
                Some((7, 2, "2026-03-09T10:00:00", "2026-03-09T10:05:00")),
            );
            recount(conn, it, 8, 3, "2026-03-01T10:00:00");
            8
        }),
        // (d) measured の明細 cursor 3 → recount cursor 10（版が大きい）→ source 7 は Before
        ("(d)", |conn| {
            let done = header(conn, "completed");
            let it = measured(conn, done, "P-1", 3, 2);
            recount(conn, it, 10, 3, "2026-03-05T10:00:00");
            7
        }),
        // (e) recount 版 3・cursor 7 → 後の棚卸しの measured 明細 版 5・cursor 8 → source 8 は Before
        ("(e)", |conn| {
            let done = header(conn, "completed");
            let it = measured(conn, done, "P-1", 6, 2);
            recount(conn, it, 7, 3, "2026-03-05T10:00:00");
            let next = header(conn, "in_progress");
            measured(conn, next, "P-1", 8, 5);
            8
        }),
        // (f) measured（cursor 7）→ 後の棚卸しの auto_filled → source 7 は Before
        ("(f)", |conn| {
            let done = header(conn, "completed");
            measured(conn, done, "P-1", 7, 2);
            let next = header(conn, "in_progress");
            item(conn, next, "P-1", "auto_filled", None);
            7
        }),
    ];
    for (case, build) in latest_cases {
        let (_dir, conn) = setup_time_evidence_db();
        product(&conn, "P-1", true);
        let source_id = build(&conn);
        assert_eq!(
            effect(&conn, source_id, "P-1", 2, 200),
            StockEffect::Before,
            "{case}"
        );
    }
}

#[test]
fn test_classify_stock_rows_req401_t21_unknown_reasons() {
    // REQ-401 / SPEC-STK-TIME-D4 / T21: Unknown の理由。0/0 は flag の理由でなく相殺の判定が要る印
    let (_dir, conn) = setup_time_evidence_db();
    product(&conn, "P-1", true);
    let active = header(&conn, "in_progress");
    measured(&conn, active, "P-1", 1, 1);
    assert_eq!(
        effect(&conn, 2, "P-1", 2, 200),
        StockEffect::Unknown(UnknownReason::SaleOrderUnknown)
    );
    assert_eq!(
        effect(&conn, 2, "P-1", -1, -100),
        StockEffect::Unknown(UnknownReason::SaleOrderUnknown)
    );
    assert_eq!(
        effect(&conn, 2, "P-1", 0, 100),
        StockEffect::Unknown(UnknownReason::OffsetLinesPresent)
    );
    assert_eq!(
        effect(&conn, 2, "P-1", 0, 0),
        StockEffect::Unknown(UnknownReason::OffsetCheckRequired)
    );
}

#[test]
fn test_classify_stock_rows_req401_t22_shared_jan_held_unless_all_before() {
    // REQ-401 / SPEC-STK-TIME-D4 / T22: 共有 JAN は全在庫連動候補が Before のときだけ commit 可
    let (_dir, conn) = setup_time_evidence_db();
    for code in ["S-A", "S-B", "S-NEW", "S-UNK"] {
        product(&conn, code, true);
    }
    product(&conn, "S-OFF", false);
    product(&conn, "S-OFF2", false);
    let active = header(&conn, "in_progress");
    measured(&conn, active, "S-A", 5, 1);
    measured(&conn, active, "S-B", 5, 1);
    measured(&conn, active, "S-UNK", 3, 1);

    // 両方 Before → commit 可・在庫は全スキップ
    match classify_stock_rows(&conn, 5, &[row(7, 2, 200, &[("S-A", true), ("S-B", true)])]).unwrap()
    {
        StockClassification::Committable(decisions) => {
            assert_eq!(decisions.len(), 2);
            assert!(decisions
                .iter()
                .all(|d| d.effect == StockEffect::Before && d.line_no == 7));
        }
        held => panic!("commit 可を期待: {held:?}"),
    }

    let held_cases: [(&str, Vec<(&str, bool)>); 3] = [
        ("片方だけ Before", vec![("S-A", true), ("S-UNK", true)]),
        (
            "Before + NeverObserved",
            vec![("S-A", true), ("S-NEW", true)],
        ),
        (
            "連動 1 + 非連動 1 で連動側が Unknown",
            vec![("S-UNK", true), ("S-OFF", false)],
        ),
    ];
    for (case, candidates) in held_cases {
        let rows = [
            row(3, 1, 100, &[("S-A", true)]),
            row(7, 2, 200, &candidates),
        ];
        assert_eq!(
            classify_stock_rows(&conn, 5, &rows).unwrap(),
            StockClassification::Held { line_nos: vec![7] },
            "{case}"
        );
    }

    // 全候補が非連動 → 在庫の分類なし（売上のみ）
    match classify_stock_rows(
        &conn,
        5,
        &[row(7, 2, 200, &[("S-OFF", false), ("S-OFF2", false)])],
    )
    .unwrap()
    {
        StockClassification::Committable(decisions) => {
            assert!(decisions.iter().all(|d| d.effect == StockEffect::SalesOnly));
        }
        held => panic!("commit 可を期待: {held:?}"),
    }
}

// ---------------------------------------------------------------------------
// T23 在庫判定の行（SPEC-STK-TIME-D4 / IO-02）
// ---------------------------------------------------------------------------

#[test]
fn test_collect_stock_evidence_rows_req401_t23_zero_rows_kept_for_stock_only() {
    // REQ-401 / SPEC-STK-TIME-D4 / IO-02 / T23: 正常 JAN の 0/0 行は在庫判定の行に全候補付きで入り、
    // 売上の行（matched_rows）には入らない。候補 0 件の行は在庫判定の行に入れない
    let (_dir, conn) = setup_time_evidence_db();
    create_test_product_with_jan(&conn, "Z-SALE", "2900000040001", 10, true);
    create_test_product_with_jan(&conn, "Z-ZERO-A", "2900000040002", 4, true);
    create_test_product_with_jan(&conn, "Z-ZERO-B", "2900000040002", 4, false);
    let bytes = make_z004_bytes(
        DATE,
        &[
            ("2900000040001", "合成販売", 2, 200),
            ("2900000040002", "合成相殺", 0, 0),
            ("2900000040019", "合成未登録", 0, 0),
        ],
    );

    let parsed = parse_z004(&bytes).unwrap();
    let rows = collect_stock_evidence_rows(&conn, &parsed).unwrap();
    assert_eq!(
        rows,
        vec![
            StockEvidenceRow {
                line_no: 3,
                normalized_jan: "2900000040001".to_string(),
                quantity: 2,
                amount: 200,
                candidates: vec![("Z-SALE".to_string(), true)],
            },
            StockEvidenceRow {
                line_no: 4,
                normalized_jan: "2900000040002".to_string(),
                quantity: 0,
                amount: 0,
                candidates: vec![
                    ("Z-ZERO-A".to_string(), true),
                    ("Z-ZERO-B".to_string(), false)
                ],
            },
        ]
    );

    let result = parse::parse_and_validate(
        &conn,
        CsvParseAndValidateRequest {
            file_bytes: bytes,
            filename: "Z004_SYNTH.CSV".to_string(),
        },
    )
    .unwrap();
    let matched: Vec<usize> = result.matched_rows.iter().map(|r| r.line_no).collect();
    assert_eq!(matched, vec![3]);
}
