//! 時点証拠 schema（SPEC-STK-TIME-D8、D-109 (2)(4)）
//!
//! docs/db-design の master / tracking / pos / transaction の「時点証拠契約（proposed）」節を当てる。
//! ⑤ まで migration の registry に登録せず、test の helper だけが呼ぶ（`db/mod.rs` で `#[cfg(test)]`）。
//! 形は `MigrationKind::Custom` と同じで、TX・`schema_versions` の記録・foreign_keys の復元まで持つ。
//! `observation_kind` と `reconciliation_version` は恒久の DEFAULT を付けないため table 再構築で埋める
//! （ALTER は行のある表へ NOT NULL・DEFAULT なしの列を足せない。packet の Contract Probe P2）。

use super::{migration_tx, DbError};
use rusqlite::{params, Connection};

/// 非負の INTEGER（REAL への化けを CHECK で拒否する。packet の Contract Probe P3）
macro_rules! nonneg_int {
    ($col:literal) => {
        concat!("typeof(", $col, ") = 'integer' AND ", $col, " >= 0")
    };
}

/// 実測の証拠の 5 項目が全て NULL（SPEC-STK-TIME-D8-K1）
macro_rules! no_evidence {
    () => {
        "count_started_at IS NULL AND observation_revision IS NULL AND ledger_cursor IS NULL
            AND source_cursor IS NULL AND request_id IS NULL"
    };
}

const SCHEMA_SQL: &str = concat!(
    "
CREATE TABLE pos_import_sources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    file_hash TEXT NOT NULL UNIQUE,
    received_at TEXT NOT NULL,
    settlement_date TEXT NOT NULL,
    machine_no TEXT,
    report_kind TEXT,
    settlement_no TEXT,
    settled_at TEXT,
    identity_rejection_code TEXT
        CHECK(identity_rejection_code IN ('identity_conflict','missing_identity')),
    identity_rejected_at TEXT,
    CHECK((identity_rejection_code IS NULL) = (identity_rejected_at IS NULL))
);

ALTER TABLE products ADD COLUMN stock_revision INTEGER NOT NULL DEFAULT 0
    CHECK(",
    nonneg_int!("stock_revision"),
    ");
ALTER TABLE products ADD COLUMN pos_sync_disabled_revision INTEGER
    CHECK(pos_sync_disabled_revision IS NULL OR (",
    nonneg_int!("pos_sync_disabled_revision"),
    " AND pos_sync_disabled_revision <= stock_revision));

CREATE TABLE stocktakes_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    status TEXT NOT NULL DEFAULT 'in_progress' CHECK(status IN ('in_progress','completed')),
    total_cost INTEGER,
    reconciliation_version INTEGER NOT NULL CHECK(reconciliation_version IN (0, 1))
);
INSERT INTO stocktakes_new (id, started_at, completed_at, status, total_cost, reconciliation_version)
SELECT id, started_at, completed_at, status, total_cost, 0 FROM stocktakes;
DROP TABLE stocktakes;
ALTER TABLE stocktakes_new RENAME TO stocktakes;

CREATE TABLE stocktake_items_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stocktake_id INTEGER NOT NULL REFERENCES stocktakes(id),
    product_code TEXT NOT NULL REFERENCES products(product_code),
    system_stock INTEGER NOT NULL,
    actual_count INTEGER,
    valuation_cost_price INTEGER,
    counted_at TEXT,
    observation_kind TEXT NOT NULL
        CHECK(observation_kind IN ('uncounted','measured','auto_filled','legacy')),
    count_started_at TEXT,
    observation_revision INTEGER CHECK(observation_revision IS NULL OR (",
    nonneg_int!("observation_revision"),
    ")),
    ledger_cursor INTEGER CHECK(ledger_cursor IS NULL OR (",
    nonneg_int!("ledger_cursor"),
    ")),
    source_cursor INTEGER CHECK(source_cursor IS NULL OR (",
    nonneg_int!("source_cursor"),
    ")),
    request_id TEXT UNIQUE,
    -- SPEC-STK-TIME-D8-K1: kind と証拠の組。4 値の外の kind は列の CHECK だけで落とす（ELSE 1）
    CHECK (CASE observation_kind
        WHEN 'measured' THEN actual_count IS NOT NULL AND counted_at IS NOT NULL
            AND count_started_at IS NOT NULL AND observation_revision IS NOT NULL
            AND ledger_cursor IS NOT NULL AND source_cursor IS NOT NULL AND request_id IS NOT NULL
        WHEN 'uncounted' THEN actual_count IS NULL AND counted_at IS NULL AND ",
    no_evidence!(),
    "
        WHEN 'auto_filled' THEN actual_count IS NOT NULL AND counted_at IS NULL AND ",
    no_evidence!(),
    "
        WHEN 'legacy' THEN ",
    no_evidence!(),
    "
        ELSE 1 END)
);
-- 旧明細の分類（tracking「移行と保存TX」）。現在の廃番フラグから逆算しない
INSERT INTO stocktake_items_new
    (id, stocktake_id, product_code, system_stock, actual_count, valuation_cost_price, counted_at,
     observation_kind)
SELECT id, stocktake_id, product_code, system_stock, actual_count, valuation_cost_price, counted_at,
    CASE
        WHEN actual_count IS NULL AND counted_at IS NULL THEN 'uncounted'
        WHEN actual_count = 0 AND system_stock = 0 AND counted_at IS NULL THEN 'auto_filled'
        ELSE 'legacy'
    END
FROM stocktake_items;
DROP TABLE stocktake_items;
ALTER TABLE stocktake_items_new RENAME TO stocktake_items;
CREATE INDEX idx_stocktake_items_stocktake_product ON stocktake_items(stocktake_id, product_code);
CREATE INDEX idx_stocktake_items_product_revision
    ON stocktake_items(product_code, observation_revision);

CREATE TABLE stocktake_recounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    stocktake_item_id INTEGER NOT NULL REFERENCES stocktake_items(id),
    system_stock INTEGER NOT NULL,
    actual_count INTEGER NOT NULL CHECK(actual_count >= 0),
    count_started_at TEXT NOT NULL,
    counted_at TEXT NOT NULL,
    ledger_cursor INTEGER NOT NULL CHECK(",
    nonneg_int!("ledger_cursor"),
    "),
    source_cursor INTEGER NOT NULL CHECK(",
    nonneg_int!("source_cursor"),
    "),
    observation_revision INTEGER NOT NULL CHECK(",
    nonneg_int!("observation_revision"),
    "),
    request_id TEXT NOT NULL UNIQUE
);
CREATE INDEX idx_stocktake_recounts_item_revision
    ON stocktake_recounts(stocktake_item_id, observation_revision);

CREATE TABLE stocktake_recount_flags (
    product_code TEXT NOT NULL REFERENCES products(product_code),
    source_id INTEGER NOT NULL REFERENCES pos_import_sources(id),
    csv_import_id INTEGER NOT NULL REFERENCES csv_imports(id),
    reason TEXT NOT NULL CHECK(reason IN ('sale_order_unknown','offset_lines_present',
        'offset_check_pending','offset_mapping_changed','legacy_basis')),
    previous_recheck_pending INTEGER NOT NULL CHECK(previous_recheck_pending IN (0, 1)),
    CHECK(previous_recheck_pending = 0 OR reason = 'offset_mapping_changed'),
    UNIQUE(product_code, source_id)
);
CREATE INDEX idx_stocktake_recount_flags_csv_import ON stocktake_recount_flags(csv_import_id);

-- 旧 import は NULL のまま。受領を backfill しない（D-109 (4)）
ALTER TABLE csv_imports ADD COLUMN source_id INTEGER REFERENCES pos_import_sources(id);

ALTER TABLE inventory_movements ADD COLUMN stocktake_adjustment_kind TEXT
    CHECK(stocktake_adjustment_kind IS NULL
          OR stocktake_adjustment_kind IN ('completion','rollback_compensation','recount'));
ALTER TABLE inventory_movements ADD COLUMN stocktake_recount_id INTEGER
    REFERENCES stocktake_recounts(id);
"
);

/// 時点証拠 schema を 1 TX で当て、`schema_versions` に `version` を記録する。失敗は全部戻す。
pub(crate) fn apply_time_evidence_schema(conn: &Connection, version: i64) -> Result<(), DbError> {
    // 再構築で親表を DROP するので foreign_keys を TX の外で OFF にし、後で戻す（schema_v2 と同じ形）
    let original_fk: i64 = conn
        .query_row("PRAGMA foreign_keys", [], |row| row.get(0))
        .map_err(|e| DbError::MigrationFailed(format!("v{version} foreign_keys読取失敗: {e}")))?;
    conn.execute_batch("PRAGMA foreign_keys = OFF;")
        .map_err(|e| DbError::MigrationFailed(format!("v{version} foreign_keys=OFF失敗: {e}")))?;

    let result = apply_inner(conn, version);

    if !conn.is_autocommit() {
        let original = result.err().map(|e| e.to_string()).unwrap_or_default();
        return Err(DbError::MigrationFailed(format!(
            "v{version} 時点証拠 migration失敗: {original}（transaction 状態不明のためforeign_keysを復元せず、接続破棄必須）"
        )));
    }
    let restored = migration_tx::restore_foreign_keys(conn, version, original_fk);
    result.and(restored)
}

fn apply_inner(conn: &Connection, version: i64) -> Result<(), DbError> {
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    conn.execute_batch("BEGIN IMMEDIATE;")
        .map_err(|e| DbError::MigrationFailed(format!("v{version} BEGIN失敗: {e}")))?;

    let result = (|| -> Result<(), DbError> {
        // 移行前の movement の最大 ID（空なら 0）。吸収済み cursor ではなく移行時の上限
        conn.execute(
            "INSERT INTO app_settings (key, value, updated_at)
             SELECT 'stocktake_legacy_movement_ceiling', COALESCE(MAX(id), 0), ?1
             FROM inventory_movements",
            [&now],
        )?;
        conn.execute_batch(SCHEMA_SQL)?;
        let fk_errors: i64 =
            conn.query_row("SELECT COUNT(*) FROM pragma_foreign_key_check", [], |row| {
                row.get(0)
            })?;
        if fk_errors != 0 {
            return Err(DbError::MigrationFailed(format!(
                "FK整合性エラー: {fk_errors}件の違反を検出"
            )));
        }
        conn.execute(
            "INSERT INTO schema_versions (version, applied_at) VALUES (?1, ?2)",
            params![version, now],
        )?;
        Ok(())
    })();

    if let Err(error) = result {
        return Err(migration_tx::rollback_after_error(
            conn,
            format!("v{version} 時点証拠 migration失敗: {error}"),
        ));
    }
    migration_tx::commit_transaction(conn, &format!("v{version} COMMIT失敗"))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::migration::app_max_version;
    use crate::db::migration_tx::{fail_operations, FailurePoint};
    use crate::db::test_support::*;
    use rusqlite::types::Value;

    /// (列名, 型, NOT NULL, DEFAULT)
    type Column = (String, String, bool, Option<String>);

    fn columns(conn: &Connection, table: &str) -> Vec<Column> {
        conn.prepare(&format!("PRAGMA table_info({table})"))
            .unwrap()
            .query_map([], |r| Ok((r.get(1)?, r.get(2)?, r.get(3)?, r.get(4)?)))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap()
    }

    fn column(conn: &Connection, table: &str, name: &str) -> Option<Column> {
        columns(conn, table).into_iter().find(|c| c.0 == name)
    }

    fn col(name: &str, ty: &str, not_null: bool, default: Option<&str>) -> Option<Column> {
        Some((
            name.to_string(),
            ty.to_string(),
            not_null,
            default.map(str::to_string),
        ))
    }

    fn strings(conn: &Connection, sql: &str) -> Vec<String> {
        conn.prepare(sql)
            .unwrap()
            .query_map([], |r| r.get(0))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap()
    }

    fn int(conn: &Connection, sql: &str) -> i64 {
        conn.query_row(sql, [], |r| r.get(0)).unwrap()
    }

    fn rows(conn: &Connection, sql: &str) -> Vec<Vec<Value>> {
        let mut stmt = conn.prepare(sql).unwrap();
        let width = stmt.column_count();
        stmt.query_map([], |r| (0..width).map(|i| r.get(i)).collect())
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap()
    }

    fn fails(conn: &Connection, sql: &str) -> String {
        conn.execute_batch(sql)
            .expect_err(&format!("失敗するはず: {sql}"))
            .to_string()
    }

    /// (from 列, 親表, 親列)
    fn foreign_keys(conn: &Connection, table: &str) -> Vec<(String, String, String)> {
        conn.prepare(&format!("PRAGMA foreign_key_list({table})"))
            .unwrap()
            .query_map([], |r| Ok((r.get(3)?, r.get(2)?, r.get(4)?)))
            .unwrap()
            .collect::<Result<_, _>>()
            .unwrap()
    }

    fn fk(from: &str, table: &str, to: &str) -> (String, String, String) {
        (from.to_string(), table.to_string(), to.to_string())
    }

    fn index_columns(conn: &Connection, index: &str) -> Vec<String> {
        strings(
            conn,
            &format!("SELECT name FROM pragma_index_info('{index}') ORDER BY seqno"),
        )
    }

    /// 当てる前後で変わってはいけない旧の行（元の列だけ）
    fn legacy_snapshot(conn: &Connection) -> Vec<Vec<Vec<Value>>> {
        [
            "SELECT product_code, stock_quantity, is_discontinued FROM products ORDER BY product_code",
            "SELECT id, product_code, movement_type, quantity, stock_after, reference_type, reference_id,
                    is_voided, created_at FROM inventory_movements ORDER BY id",
            "SELECT * FROM sale_records ORDER BY id",
            "SELECT id, filename, settlement_date, file_hash, total_items, total_amount, skipped_count,
                    status, imported_at FROM csv_imports ORDER BY id",
            "SELECT id, started_at, completed_at, status, total_cost FROM stocktakes ORDER BY id",
            "SELECT id, stocktake_id, product_code, system_stock, actual_count, valuation_cost_price,
                    counted_at FROM stocktake_items ORDER BY id",
        ]
        .iter()
        .map(|sql| rows(conn, sql))
        .collect()
    }

    fn legacy_db() -> (tempfile::TempDir, Connection) {
        let (dir, conn) = setup_test_db();
        seed_legacy_fixture(&conn);
        (dir, conn)
    }

    #[test]
    fn test_time_evidence_schema_req205_t1_columns_constraints_indexes() {
        // REQ-205 / SPEC-STK-TIME-D8 / T1: master / tracking / pos / transaction の proposed 節との照合
        let (_dir, conn) = legacy_db();
        apply_time_evidence(&conn);

        assert_eq!(
            column(&conn, "products", "stock_revision"),
            col("stock_revision", "INTEGER", true, Some("0"))
        );
        assert_eq!(
            column(&conn, "products", "pos_sync_disabled_revision"),
            col("pos_sync_disabled_revision", "INTEGER", false, None)
        );
        // 2 列とも恒久の DEFAULT なし
        assert_eq!(
            column(&conn, "stocktakes", "reconciliation_version"),
            col("reconciliation_version", "INTEGER", true, None)
        );
        assert_eq!(
            column(&conn, "stocktake_items", "observation_kind"),
            col("observation_kind", "TEXT", true, None)
        );
        for (name, ty) in [
            ("count_started_at", "TEXT"),
            ("observation_revision", "INTEGER"),
            ("ledger_cursor", "INTEGER"),
            ("source_cursor", "INTEGER"),
            ("request_id", "TEXT"),
        ] {
            assert_eq!(
                column(&conn, "stocktake_items", name),
                col(name, ty, false, None)
            );
        }
        let recount: Vec<(String, String, bool)> = columns(&conn, "stocktake_recounts")
            .into_iter()
            .map(|c| (c.0, c.1, c.2))
            .collect();
        let expected: Vec<(String, String, bool)> = [
            ("id", "INTEGER", false),
            ("stocktake_item_id", "INTEGER", true),
            ("system_stock", "INTEGER", true),
            ("actual_count", "INTEGER", true),
            ("count_started_at", "TEXT", true),
            ("counted_at", "TEXT", true),
            ("ledger_cursor", "INTEGER", true),
            ("source_cursor", "INTEGER", true),
            ("observation_revision", "INTEGER", true),
            ("request_id", "TEXT", true),
        ]
        .iter()
        .map(|(n, t, nn)| (n.to_string(), t.to_string(), *nn))
        .collect();
        assert_eq!(recount, expected);
        let flag_cols: Vec<(String, bool)> = columns(&conn, "stocktake_recount_flags")
            .into_iter()
            .map(|c| (c.0, c.2))
            .collect();
        assert_eq!(
            flag_cols,
            [
                ("product_code", true),
                ("source_id", true),
                ("csv_import_id", true),
                ("reason", true),
                ("previous_recheck_pending", true)
            ]
            .map(|(n, nn)| (n.to_string(), nn))
            .to_vec()
        );
        let source_cols: Vec<(String, bool)> = columns(&conn, "pos_import_sources")
            .into_iter()
            .map(|c| (c.0, c.2))
            .collect();
        assert_eq!(
            source_cols,
            [
                ("id", false),
                ("file_hash", true),
                ("received_at", true),
                ("settlement_date", true),
                ("machine_no", false),
                ("report_kind", false),
                ("settlement_no", false),
                ("settled_at", false),
                ("identity_rejection_code", false),
                ("identity_rejected_at", false)
            ]
            .map(|(n, nn)| (n.to_string(), nn))
            .to_vec()
        );
        assert_eq!(
            column(&conn, "csv_imports", "source_id"),
            col("source_id", "INTEGER", false, None)
        );
        assert_eq!(
            column(&conn, "inventory_movements", "stocktake_adjustment_kind"),
            col("stocktake_adjustment_kind", "TEXT", false, None)
        );
        assert_eq!(
            column(&conn, "inventory_movements", "stocktake_recount_id"),
            col("stocktake_recount_id", "INTEGER", false, None)
        );

        // FK: 再構築した子の FK は同じ親表を指す
        let item_fks = foreign_keys(&conn, "stocktake_items");
        assert!(item_fks.contains(&fk("stocktake_id", "stocktakes", "id")));
        assert!(item_fks.contains(&fk("product_code", "products", "product_code")));
        assert_eq!(
            foreign_keys(&conn, "stocktake_recounts"),
            vec![fk("stocktake_item_id", "stocktake_items", "id")]
        );
        let flag_fks = foreign_keys(&conn, "stocktake_recount_flags");
        for expected in [
            fk("product_code", "products", "product_code"),
            fk("source_id", "pos_import_sources", "id"),
            fk("csv_import_id", "csv_imports", "id"),
        ] {
            assert!(flag_fks.contains(&expected), "{expected:?}");
        }
        assert!(foreign_keys(&conn, "csv_imports").contains(&fk(
            "source_id",
            "pos_import_sources",
            "id"
        )));
        assert!(foreign_keys(&conn, "inventory_movements").contains(&fk(
            "stocktake_recount_id",
            "stocktake_recounts",
            "id"
        )));
        assert_eq!(
            int(&conn, "SELECT COUNT(*) FROM pragma_foreign_key_check"),
            0
        );
        assert_eq!(int(&conn, "PRAGMA foreign_keys"), 1);

        // index: 再構築で作り直したものと新しい 3 本
        assert_eq!(
            index_columns(&conn, "idx_stocktake_items_stocktake_product"),
            ["stocktake_id", "product_code"]
        );
        assert_eq!(
            index_columns(&conn, "idx_stocktake_items_product_revision"),
            ["product_code", "observation_revision"]
        );
        assert_eq!(
            index_columns(&conn, "idx_stocktake_recounts_item_revision"),
            ["stocktake_item_id", "observation_revision"]
        );
        assert_eq!(
            index_columns(&conn, "idx_stocktake_recount_flags_csv_import"),
            ["csv_import_id"]
        );

        // CHECK の値の集合と UNIQUE（各 kind は SPEC-STK-TIME-D8-K1 を満たす形で入れる）
        for (kind, actual, counted) in [
            ("uncounted", None, None),
            ("measured", Some(0), Some("2026-03-02T10:05:00")),
            ("auto_filled", Some(0), None),
            ("legacy", None, None),
        ] {
            let measured = kind == "measured";
            conn.execute(
                "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count,
                    counted_at, observation_kind, count_started_at, observation_revision, ledger_cursor,
                    source_cursor, request_id)
                 VALUES (2, 'LG-UNC', 0, ?1, ?2, ?3, ?4, ?5, ?5, ?5, ?6)",
                rusqlite::params![
                    actual,
                    counted,
                    kind,
                    measured.then_some("2026-03-02T10:00:00"),
                    measured.then_some(1),
                    measured.then_some("req-loop")
                ],
            )
            .unwrap();
        }
        let error = fails(
            &conn,
            "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, observation_kind)
             VALUES (2, 'LG-UNC', 0, 'other')",
        );
        assert!(
            error.contains("CHECK constraint failed") && error.contains("observation_kind IN"),
            "{error}"
        );
        // 他の 6 項目を揃え source_cursor だけ負（K1 を通り、列の非負の CHECK だけで落ちる形）
        let error = fails(
            &conn,
            "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at,
                observation_kind, count_started_at, observation_revision, ledger_cursor, source_cursor, request_id)
             VALUES (2, 'LG-UNC', 0, 0, '2026-03-02T10:05:00', 'measured', '2026-03-02T10:00:00', 1, 0, -1,
                'req-neg')",
        );
        assert!(
            error.contains("CHECK constraint failed") && error.contains("source_cursor IS NULL OR"),
            "{error}"
        );
        assert!(fails(
            &conn,
            "INSERT INTO stocktakes (started_at, status, reconciliation_version)
             VALUES ('2026-03-03T09:00:00', 'completed', 2)"
        )
        .contains("CHECK constraint failed"));
        conn.execute_batch(
            "INSERT INTO pos_import_sources (file_hash, received_at, settlement_date)
             VALUES ('h1', '2026-03-20T21:00:00', '2026-03-20');
             INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at,
                observation_kind, count_started_at, observation_revision, ledger_cursor, source_cursor, request_id)
             VALUES (2, 'LG-UNC', 0, 0, '2026-03-02T10:05:00', 'measured', '2026-03-02T10:00:00', 1, 0, 0,
                'req-1');",
        )
        .unwrap();
        assert!(fails(
            &conn,
            "INSERT INTO pos_import_sources (file_hash, received_at, settlement_date)
             VALUES ('h1', '2026-03-21T21:00:00', '2026-03-21')"
        )
        .contains("UNIQUE"));
        assert!(fails(
            &conn,
            "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at,
                observation_kind, count_started_at, observation_revision, ledger_cursor, source_cursor, request_id)
             VALUES (2, 'LG-UNC', 0, 0, '2026-03-02T10:05:00', 'measured', '2026-03-02T10:00:00', 1, 0, 0,
                'req-1')"
        )
        .contains("UNIQUE"));
        // 拒否の証拠は 2 列とも NULL か 2 列とも必須
        assert!(fails(
            &conn,
            "UPDATE pos_import_sources SET identity_rejection_code = 'identity_conflict' WHERE file_hash = 'h1'"
        )
        .contains("CHECK constraint failed"));
        assert!(fails(
            &conn,
            "UPDATE pos_import_sources SET identity_rejection_code = 'other',
                identity_rejected_at = '2026-03-20T21:00:00' WHERE file_hash = 'h1'"
        )
        .contains("CHECK constraint failed"));
        for code in ["identity_conflict", "missing_identity"] {
            conn.execute(
                "UPDATE pos_import_sources SET identity_rejection_code = ?1,
                    identity_rejected_at = '2026-03-20T21:00:00' WHERE file_hash = 'h1'",
                [code],
            )
            .unwrap();
        }
        for (i, reason) in [
            "sale_order_unknown",
            "offset_lines_present",
            "offset_check_pending",
            "offset_mapping_changed",
            "legacy_basis",
        ]
        .iter()
        .enumerate()
        {
            let product = LEGACY_ITEM_KINDS[i + 1].0;
            conn.execute(
                "INSERT INTO stocktake_recount_flags
                    (product_code, source_id, csv_import_id, reason, previous_recheck_pending)
                 VALUES (?1, 1, 1, ?2, 0)",
                [product, reason],
            )
            .unwrap();
        }
        assert!(fails(
            &conn,
            "INSERT INTO stocktake_recount_flags
                (product_code, source_id, csv_import_id, reason, previous_recheck_pending)
             VALUES ('LG-A33', 1, 1, 'other', 0)"
        )
        .contains("CHECK constraint failed"));
        // previous_recheck_pending=1 は offset_mapping_changed だけ
        assert!(fails(
            &conn,
            "INSERT INTO stocktake_recount_flags
                (product_code, source_id, csv_import_id, reason, previous_recheck_pending)
             VALUES ('LG-A33', 1, 1, 'offset_check_pending', 1)"
        )
        .contains("CHECK constraint failed"));
        conn.execute(
            "INSERT INTO stocktake_recount_flags
                (product_code, source_id, csv_import_id, reason, previous_recheck_pending)
             VALUES ('LG-A33', 1, 1, 'offset_mapping_changed', 1)",
            [],
        )
        .unwrap();
        assert!(fails(
            &conn,
            "INSERT INTO stocktake_recount_flags
                (product_code, source_id, csv_import_id, reason, previous_recheck_pending)
             VALUES ('LG-A33', 1, 1, 'legacy_basis', 0)"
        )
        .contains("UNIQUE"));
        for kind in ["completion", "rollback_compensation", "recount"] {
            conn.execute(
                "INSERT INTO inventory_movements (product_code, movement_type, quantity, stock_after,
                    created_at, stocktake_adjustment_kind)
                 VALUES ('LG-A33', 'stocktake', 0, 3, '2026-03-03T09:00:00', ?1)",
                [kind],
            )
            .unwrap();
        }
        assert!(fails(
            &conn,
            "INSERT INTO inventory_movements (product_code, movement_type, quantity, stock_after,
                created_at, stocktake_adjustment_kind)
             VALUES ('LG-A33', 'stocktake', 0, 3, '2026-03-03T09:00:00', 'other')"
        )
        .contains("CHECK constraint failed"));
        // pos_sync_disabled_revision は stock_revision 以下
        assert!(fails(
            &conn,
            "UPDATE products SET pos_sync_disabled_revision = 1 WHERE product_code = 'LG-A33'"
        )
        .contains("CHECK constraint failed"));
        assert!(fails(
            &conn,
            "INSERT INTO stocktake_recounts (stocktake_item_id, system_stock, actual_count,
                count_started_at, counted_at, ledger_cursor, source_cursor, observation_revision, request_id)
             VALUES (1, 3, -1, 't', 't', 0, 0, 1, 'rc-neg')"
        )
        .contains("CHECK constraint failed"));
    }

    #[test]
    fn test_time_evidence_schema_req205_t2_stock_revision_overflow_rejected() {
        // REQ-205 / SPEC-STK-TIME-D1・D8 / T2: i64 上限から増やせず REAL に化けない（Contract Probe P3）
        let (_dir, conn) = legacy_db();
        apply_time_evidence(&conn);
        conn.execute(
            "UPDATE products SET stock_revision = ?1 WHERE product_code = 'LG-A33'",
            [i64::MAX],
        )
        .unwrap();
        let error = fails(
            &conn,
            "UPDATE products SET stock_revision = stock_revision + 1 WHERE product_code = 'LG-A33'",
        );
        assert!(error.contains("CHECK constraint failed"), "{error}");
        let (value, ty): (i64, String) = conn
            .query_row(
                "SELECT stock_revision, typeof(stock_revision) FROM products WHERE product_code = 'LG-A33'",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!((value, ty.as_str()), (i64::MAX, "integer"));
    }

    #[test]
    fn test_time_evidence_schema_req205_t3_insert_without_kind_or_version_fails() {
        // REQ-205 / SPEC-STK-TIME-D8 / T3: ⑤ まで残る旧 writer の INSERT（stocktake_repo の形）が通らない
        let (_dir, conn) = legacy_db();
        apply_time_evidence(&conn);
        let error = fails(
            &conn,
            "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, actual_count, counted_at)
             VALUES (2, 'LG-A33', 3, NULL, NULL)",
        );
        assert!(
            error.contains("NOT NULL constraint failed: stocktake_items.observation_kind"),
            "{error}"
        );
        let error = fails(
            &conn,
            "INSERT INTO stocktakes (started_at, status) VALUES ('2026-03-03T09:00:00', 'in_progress')",
        );
        assert!(
            error.contains("NOT NULL constraint failed: stocktakes.reconciliation_version"),
            "{error}"
        );
    }

    #[test]
    fn test_time_evidence_schema_req205_t4_normal_migrate_has_no_new_schema() {
        // REQ-205 / SPEC-STOP-D6 / D-109 (2) / T4: 通常の migrate() の後の DB に新しい表・列が無い
        let (_dir, conn) = setup_test_db();
        for table in [
            "pos_import_sources",
            "stocktake_recounts",
            "stocktake_recount_flags",
        ] {
            assert_eq!(
                int(
                    &conn,
                    &format!("SELECT COUNT(*) FROM sqlite_master WHERE name = '{table}'")
                ),
                0,
                "{table}"
            );
        }
        for (table, name) in [
            ("products", "stock_revision"),
            ("products", "pos_sync_disabled_revision"),
            ("stocktakes", "reconciliation_version"),
            ("stocktake_items", "observation_kind"),
            ("stocktake_items", "count_started_at"),
            ("stocktake_items", "observation_revision"),
            ("stocktake_items", "ledger_cursor"),
            ("stocktake_items", "source_cursor"),
            ("stocktake_items", "request_id"),
            ("csv_imports", "source_id"),
            ("inventory_movements", "stocktake_adjustment_kind"),
            ("inventory_movements", "stocktake_recount_id"),
        ] {
            assert_eq!(column(&conn, table, name), None, "{table}.{name}");
        }
        assert_eq!(
            int(
                &conn,
                "SELECT COUNT(*) FROM app_settings WHERE key = 'stocktake_legacy_movement_ceiling'"
            ),
            0
        );
        assert_eq!(
            int(&conn, "SELECT MAX(version) FROM schema_versions"),
            app_max_version()
        );
    }

    fn kinds(conn: &Connection) -> Vec<(String, i64, String)> {
        conn.prepare(
            "SELECT product_code, stocktake_id, observation_kind FROM stocktake_items ORDER BY id",
        )
        .unwrap()
        .query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))
        .unwrap()
        .collect::<Result<_, _>>()
        .unwrap()
    }

    #[test]
    fn test_time_evidence_schema_req205_t5_legacy_items_classified() {
        // REQ-205 / SPEC-STK-TIME-D8 / T5: 旧明細の分類（行のある表に当てる。P2）。廃番 flag に依らない
        let expected: Vec<(String, i64, String)> = LEGACY_ITEM_KINDS
            .iter()
            .map(|(p, s, k)| (p.to_string(), *s, k.to_string()))
            .collect();
        let (_dir, conn) = legacy_db();
        apply_time_evidence(&conn);
        assert_eq!(kinds(&conn), expected);

        // 廃番 flag を全商品で反転してから当てても同じ
        let (_dir2, flipped) = legacy_db();
        flipped
            .execute(
                "UPDATE products SET is_discontinued = 1 - is_discontinued",
                [],
            )
            .unwrap();
        apply_time_evidence(&flipped);
        assert_eq!(kinds(&flipped), expected);
    }

    /// measured の 7 項目（列, SQL の値）
    const MEASURED_EVIDENCE: [(&str, &str); 7] = [
        ("actual_count", "3"),
        ("counted_at", "'2026-03-02T10:05:00'"),
        ("count_started_at", "'2026-03-02T10:00:00'"),
        ("observation_revision", "1"),
        ("ledger_cursor", "0"),
        ("source_cursor", "0"),
        ("request_id", "'req-c1'"),
    ];

    /// (ラベル, kind, 入れる列)
    type RejectedCase = (String, &'static str, Vec<(&'static str, &'static str)>);

    fn insert_item(conn: &Connection, kind: &str, cols: &[(&str, &str)]) -> rusqlite::Result<()> {
        let names: String = cols.iter().map(|(c, _)| format!(", {c}")).collect();
        let values: String = cols.iter().map(|(_, v)| format!(", {v}")).collect();
        conn.execute_batch(&format!(
            "INSERT INTO stocktake_items (stocktake_id, product_code, system_stock, observation_kind{names})
             VALUES (2, 'LG-UNC', 0, '{kind}'{values})"
        ))
    }

    #[test]
    fn test_apply_time_evidence_schema_req205_c1_kind_evidence_check() {
        // REQ-205 / SPEC-STK-TIME-D8-K1 / C1: kind と証拠の組を table の CHECK が拒否し、旧明細の分類は変わらない
        let (_dir, conn) = legacy_db();
        apply_time_evidence(&conn);
        let expected: Vec<(String, i64, String)> = LEGACY_ITEM_KINDS
            .iter()
            .map(|(p, s, k)| (p.to_string(), *s, k.to_string()))
            .collect();
        assert_eq!(kinds(&conn), expected, "② の T5 と同じ分類");

        let mut rejected: Vec<RejectedCase> = (0..MEASURED_EVIDENCE.len())
            .map(|skip| {
                let mut cols = MEASURED_EVIDENCE.to_vec();
                let (missing, _) = cols.remove(skip);
                (format!("measured の {missing} 欠け"), "measured", cols)
            })
            .collect();
        let uncounted_time = vec![("counted_at", "'2026-03-02T10:05:00'")];
        let auto_time = vec![
            ("actual_count", "0"),
            ("counted_at", "'2026-03-02T10:05:00'"),
        ];
        let auto_cursor = vec![("actual_count", "0"), ("source_cursor", "0")];
        let legacy_revision = vec![("actual_count", "3"), ("observation_revision", "1")];
        rejected.extend([
            (
                "uncounted の数量".to_string(),
                "uncounted",
                vec![("actual_count", "0")],
            ),
            ("uncounted の時刻".to_string(), "uncounted", uncounted_time),
            ("auto_filled の時刻".to_string(), "auto_filled", auto_time),
            (
                "auto_filled の cursor".to_string(),
                "auto_filled",
                auto_cursor,
            ),
            ("auto_filled の数量 NULL".to_string(), "auto_filled", vec![]),
            ("legacy の版".to_string(), "legacy", legacy_revision),
        ]);
        for (label, kind, cols) in &rejected {
            let error = insert_item(&conn, kind, cols).expect_err(label).to_string();
            assert!(
                error.contains("CHECK constraint failed"),
                "{label}: {error}"
            );
        }

        let before = int(&conn, "SELECT COUNT(*) FROM stocktake_items");
        insert_item(&conn, "measured", &MEASURED_EVIDENCE).unwrap();
        insert_item(&conn, "auto_filled", &[("actual_count", "2")]).unwrap();
        insert_item(&conn, "legacy", &[("counted_at", "'2026-03-02T10:05:00'")]).unwrap();
        insert_item(&conn, "uncounted", &[]).unwrap();
        assert_eq!(
            int(&conn, "SELECT COUNT(*) FROM stocktake_items"),
            before + 4
        );
    }

    #[test]
    fn test_time_evidence_schema_req205_t6_headers_ceiling_and_rows_preserved() {
        // REQ-205 / SPEC-STK-TIME-D8 / T6: 旧 header は版 0、legacy 上限は当てる前の movement 最大 ID、旧の行は不変
        let (_dir, conn) = legacy_db();
        let before = legacy_snapshot(&conn);
        let max_movement = int(&conn, "SELECT MAX(id) FROM inventory_movements");
        apply_time_evidence(&conn);

        assert_eq!(
            int(
                &conn,
                "SELECT COUNT(*) FROM stocktakes WHERE reconciliation_version <> 0"
            ),
            0
        );
        assert_eq!(int(&conn, "SELECT COUNT(*) FROM stocktakes"), 2);
        let ceiling: String = conn
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'stocktake_legacy_movement_ceiling'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(ceiling, max_movement.to_string());
        assert_eq!(legacy_snapshot(&conn), before);

        // movement 0 件の DB では 0
        let (_dir2, empty) = setup_time_evidence_db();
        let ceiling: String = empty
            .query_row(
                "SELECT value FROM app_settings WHERE key = 'stocktake_legacy_movement_ceiling'",
                [],
                |r| r.get(0),
            )
            .unwrap();
        assert_eq!(ceiling, "0");
    }

    #[test]
    fn test_time_evidence_schema_req205_t7_commit_failure_rolls_back_everything() {
        // REQ-205 / SPEC-STK-TIME-D8 / D-109 (4) / T7: COMMIT の失敗で全部戻り、foreign_keys も戻る
        let (_dir, conn) = legacy_db();
        let master_before = rows(
            &conn,
            "SELECT type, name, sql FROM sqlite_master ORDER BY name",
        );
        let data_before = legacy_snapshot(&conn);
        let settings_before = rows(&conn, "SELECT * FROM app_settings ORDER BY key");
        let versions_before = rows(&conn, "SELECT * FROM schema_versions ORDER BY version");
        {
            let _guard = fail_operations(&[FailurePoint::Commit]);
            let result = apply_time_evidence_schema(&conn, app_max_version() + 1);
            assert!(
                matches!(result, Err(DbError::MigrationFailed(_))),
                "{result:?}"
            );
        }
        assert_eq!(
            rows(
                &conn,
                "SELECT type, name, sql FROM sqlite_master ORDER BY name"
            ),
            master_before
        );
        assert_eq!(legacy_snapshot(&conn), data_before);
        assert_eq!(
            rows(&conn, "SELECT * FROM app_settings ORDER BY key"),
            settings_before
        );
        assert_eq!(
            rows(&conn, "SELECT * FROM schema_versions ORDER BY version"),
            versions_before
        );
        assert_eq!(int(&conn, "PRAGMA foreign_keys"), 1);

        // 成功時: 旧 import から受領を作らない
        apply_time_evidence(&conn);
        assert_eq!(
            int(
                &conn,
                "SELECT COUNT(*) FROM csv_imports WHERE source_id IS NOT NULL"
            ),
            0
        );
        assert_eq!(int(&conn, "SELECT COUNT(*) FROM csv_imports"), 2);
        assert_eq!(int(&conn, "SELECT COUNT(*) FROM pos_import_sources"), 0);
        assert_eq!(
            int(&conn, "SELECT MAX(version) FROM schema_versions"),
            app_max_version() + 1
        );
    }
}
