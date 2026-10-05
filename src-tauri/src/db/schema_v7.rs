//! migration v7: 日報の個数を100倍の整数へ
//!
//! docs/function-design/22-mnt-migration.md §15 / MNT-03-D12 / IO-07-D2 に基づく実装。

use super::{migration_tx, DbError};
use rusqlite::{params, Connection};

const TABLES: [&str; 2] = [
    "daily_report_summary_lines",
    "daily_report_department_lines",
];

pub(crate) fn apply_v7_daily_report_quantity_hundredths(
    conn: &Connection,
    version: i64,
) -> Result<(), DbError> {
    let now = chrono::Local::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    conn.execute_batch("BEGIN;")
        .map_err(|error| DbError::MigrationFailed(format!("v{version} BEGIN失敗: {error}")))?;

    let result = (|| -> Result<(), DbError> {
        // 1. 範囲検査（100 倍が i64 を溢れる値は REAL になって黙って続くため、変換の前に止める）
        let limit = i64::MAX / 100;
        for table in TABLES {
            let out_of_range: bool = conn.query_row(
                &format!(
                    "SELECT EXISTS(SELECT 1 FROM {table} WHERE quantity > ?1 OR quantity < -?1)"
                ),
                [limit],
                |row| row.get(0),
            )?;
            if out_of_range {
                return Err(DbError::MigrationFailed(format!(
                    "v{version} 範囲検査失敗: {table}.quantity に ±{limit} の範囲外の値があります"
                )));
            }
        }

        // 2. 変換前の件数と合計（行 0・全行 NULL では SUM が NULL なので COALESCE）
        let mut before = Vec::new();
        for table in TABLES {
            let counts: (i64, i64) = conn.query_row(
                &format!("SELECT COUNT(quantity), COALESCE(SUM(quantity), 0) FROM {table}"),
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )?;
            before.push(counts);
        }

        // 3〜5. 改名と 100 倍（NULL は NULL のまま）
        conn.execute_batch(
            "ALTER TABLE daily_report_summary_lines RENAME COLUMN quantity TO quantity_hundredths;
             ALTER TABLE daily_report_department_lines RENAME COLUMN quantity TO quantity_hundredths;
             UPDATE daily_report_summary_lines SET quantity_hundredths = quantity_hundredths * 100
                 WHERE quantity_hundredths IS NOT NULL;
             UPDATE daily_report_department_lines SET quantity_hundredths = quantity_hundredths * 100
                 WHERE quantity_hundredths IS NOT NULL;",
        )?;

        // 6. 検証: (a) 件数 (b) 型 (c) ÷100 の合計と、余りが 0 でない行が無いこと
        for (table, (count, sum)) in TABLES.into_iter().zip(before) {
            let (after_count, all_integer): (i64, bool) = conn.query_row(
                &format!(
                    "SELECT COUNT(quantity_hundredths),
                            NOT EXISTS(SELECT 1 FROM {table}
                                       WHERE quantity_hundredths IS NOT NULL
                                         AND typeof(quantity_hundredths) <> 'integer')
                     FROM {table}"
                ),
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )?;
            if after_count != count || !all_integer {
                return Err(DbError::MigrationFailed(format!(
                    "v{version} {table} 検証失敗: count={count}->{after_count} integer={all_integer}"
                )));
            }
            let (after_sum, no_remainder): (i64, bool) = conn.query_row(
                &format!(
                    "SELECT COALESCE(SUM(quantity_hundredths / 100), 0),
                            NOT EXISTS (SELECT 1 FROM {table} WHERE quantity_hundredths % 100 <> 0)
                     FROM {table}"
                ),
                [],
                |row| Ok((row.get(0)?, row.get(1)?)),
            )?;
            if after_sum != sum || !no_remainder {
                return Err(DbError::MigrationFailed(format!(
                    "v{version} {table} 検証失敗: sum={sum}->{after_sum} no_remainder={no_remainder}"
                )));
            }
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
            format!("v{version} daily report quantity_hundredths migration失敗: {error}"),
        ));
    }
    migration_tx::commit_transaction(conn, &format!("v{version} COMMIT失敗"))
}
