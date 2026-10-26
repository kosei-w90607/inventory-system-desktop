//! rollback_csv_import — CSV取込みのロールバック（論理無効化 + 求め直し）

use crate::biz::csv_import_service::RollbackResult;
use crate::biz::stock_ledger::recompute_for_settlement_change;
use crate::biz::stocktake_service::recheck_targets;
use crate::biz::BizError;
use crate::db::sales_repo;
use crate::db::system_repo::{self, NewOperationLog};
use crate::db::{DbConnection, DbError};

/// 指定 csv_import の売上と movement を無効にし、求め直す（補償の movement は作らない。計数は消さない。ADR D7）
///
/// 冪等（既に rolled_back なら何もせず成功を返す）。
///
/// docs/function-design/32-biz-csv-import-service.md §15.5 と「計数の置き場と在庫の求め直しの契約」の取消
pub fn rollback_csv_import(
    conn: &mut DbConnection,
    csv_import_id: i64,
) -> Result<RollbackResult, BizError> {
    // 1. 対象確認
    let import = sales_repo::find_csv_import_by_id(conn, csv_import_id)?.ok_or_else(|| {
        BizError::NotFound(format!(
            "CSV取込み記録が見つかりません: ID {}",
            csv_import_id
        ))
    })?;

    // 冪等: 既に rolled_back なら何もせず成功
    if import.status == sales_repo::CsvImportStatus::RolledBack {
        return Ok(RollbackResult {
            success: true,
            voided_sale_count: 0,
            voided_movement_count: 0,
            recheck_targets: Vec::new(),
        });
    }

    let tx = conn.transaction().map_err(DbError::from)?;

    // 2. 売上と movement の無効化、取込みの状態
    let voided_sale_count = sales_repo::void_sale_records_by_import(&tx, csv_import_id)?;
    let voided_movement_count =
        sales_repo::void_movements_by_reference(&tx, "csv_import", csv_import_id)?.len();
    sales_repo::update_csv_import_status(
        &tx,
        csv_import_id,
        sales_repo::CsvImportStatus::RolledBack.as_str(),
    )?;

    // 3. 精算の一覧が変わるので、計数を持つ全ての商品とこの取込みの商品を求め直す（ADR D2）
    let codes: Vec<String> = recompute_for_settlement_change(&tx, csv_import_id)?
        .into_iter()
        .map(|(code, _)| code)
        .collect();
    let targets = recheck_targets(&tx, &codes)?;

    tx.commit().map_err(DbError::from)?;

    // 4. TX外: 操作ログ記録（best-effort）
    let detail = serde_json::json!({
        "csv_import_id": csv_import_id,
        "voided_sale_count": voided_sale_count,
        "voided_movement_count": voided_movement_count,
    })
    .to_string();
    let log = NewOperationLog {
        operation_type: "csv_rollback".to_string(),
        summary: format!("CSV取込みを取消しました: ID {}", csv_import_id),
        detail_json: Some(detail),
    };
    if let Err(e) = system_repo::insert_operation_log(conn, &log) {
        tracing::warn!(error = %e, "操作ログ記録に失敗");
    }

    Ok(RollbackResult {
        success: true,
        voided_sale_count,
        voided_movement_count,
        recheck_targets: targets,
    })
}
