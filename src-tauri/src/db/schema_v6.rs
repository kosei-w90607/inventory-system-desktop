//! migration v6: 取引先の最終改名日時
//!
//! docs/function-design/22-mnt-migration.md §14 / SPEC-SUPI-D1 に基づく実装。

use super::{migration_tx, DbError};
use rusqlite::{params, Connection};

pub(crate) fn apply_v6_supplier_updated_at(conn: &Connection, version: i64) -> Result<(), DbError> {
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    conn.execute_batch("BEGIN;")
        .map_err(|error| DbError::MigrationFailed(format!("v{version} BEGIN失敗: {error}")))?;

    let result = (|| -> Result<(), DbError> {
        conn.execute_batch("ALTER TABLE suppliers ADD COLUMN updated_at TEXT;")
            .map_err(|error| {
                DbError::MigrationFailed(format!(
                    "v{version} suppliers.updated_at追加失敗: {error}"
                ))
            })?;
        conn.execute(
            "UPDATE suppliers SET updated_at = created_at WHERE updated_at IS NULL",
            [],
        )?;

        let invalid_count: i64 = conn.query_row(
            "SELECT COUNT(*) FROM suppliers
             WHERE updated_at IS NULL OR updated_at <> created_at",
            [],
            |row| row.get(0),
        )?;
        if invalid_count != 0 {
            return Err(DbError::MigrationFailed(format!(
                "v{version} suppliers.updated_at backfill検証失敗: invalid_count={invalid_count}"
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
            format!("v{version} supplier updated_at migration失敗: {error}"),
        ));
    }
    migration_tx::commit_transaction(conn, &format!("v{version} COMMIT失敗"))
}
