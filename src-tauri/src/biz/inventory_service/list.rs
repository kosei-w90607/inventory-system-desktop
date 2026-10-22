//! 入庫・返品・廃棄の一覧取得（repo直呼び防止ラッパー）
//!
//! 44-cmd-inventory.md §23.10 に基づく実装。
//! BIZ層でper_page上限バリデーションを行い、IO層のリポジトリに委譲する。

use crate::biz::unit_amount::{cost_line_centi, cost_total_yen, price_basis_quantity};
use crate::biz::BizError;
use crate::db::disposal_repo::{
    self, DisposalRecordDetail, DisposalRecordSummary, InventoryRecordQuery, InventoryRecordSummary,
};
use crate::db::inventory_common::ListQuery;
use crate::db::inventory_repo::{
    self, MovementQuery, MovementRecord, MovementSourceLink, ReferenceType,
};
use crate::db::manual_sale_repo::{self, ManualSaleRecordDetail};
use crate::db::receiving_repo::ReceivingRecordDetail;
use crate::db::receiving_repo::{self, ReceivingRecordWithSupplier};
use crate::db::return_repo::{self, ReturnRecordDetail, ReturnRecordSummary};
use crate::db::{DbConnection, DbError, PaginatedResult};

/// per_page の上限
const MAX_PER_PAGE: u32 = 200;

/// ページパラメータのバリデーション
fn validate_page_params(query: &ListQuery) -> Result<(), BizError> {
    if query.page < 1 || query.per_page < 1 || query.per_page > MAX_PER_PAGE {
        return Err(BizError::ValidationFailed(
            "ページパラメータが不正です".to_string(),
        ));
    }
    Ok(())
}

/// 入庫記録一覧を返す
///
/// 44-cmd-inventory.md §23.2
pub fn list_receivings(
    conn: &DbConnection,
    query: &ListQuery,
) -> Result<PaginatedResult<ReceivingRecordWithSupplier>, BizError> {
    validate_page_params(query)?;
    Ok(receiving_repo::list_receiving_records(conn, query)?)
}

/// 返品記録一覧を返す
///
/// 44-cmd-inventory.md §23.5
pub fn list_returns(
    conn: &DbConnection,
    query: &ListQuery,
) -> Result<PaginatedResult<ReturnRecordSummary>, BizError> {
    validate_page_params(query)?;
    Ok(return_repo::list_return_records(conn, query)?)
}

/// 廃棄記録一覧を返す
///
/// 44-cmd-inventory.md §23.7
pub fn list_disposals(
    conn: &DbConnection,
    query: &ListQuery,
) -> Result<PaginatedResult<DisposalRecordSummary>, BizError> {
    validate_page_params(query)?;
    Ok(disposal_repo::list_disposal_records(conn, query)?)
}

/// 入出庫履歴ハブ用に業務記録一覧を返す。
///
/// 65-inventory-record-traceability.md §65.4 / TRACE-D1
pub fn list_inventory_records(
    conn: &DbConnection,
    query: &InventoryRecordQuery,
) -> Result<PaginatedResult<InventoryRecordSummary>, BizError> {
    let page_query = ListQuery {
        page: query.page,
        per_page: query.per_page,
        date_from: None,
        date_to: None,
    };
    validate_page_params(&page_query)?;

    if !matches!(
        query.record_type.as_deref(),
        None | Some("all")
            | Some("receiving_record")
            | Some("return_record")
            | Some("manual_sale")
            | Some("disposal_record")
            | Some("csv_import")
            | Some("stocktake")
    ) {
        return Err(BizError::ValidationFailed(
            "未対応の記録種別です".to_string(),
        ));
    }
    if !matches!(
        query.status.as_deref(),
        None | Some("all") | Some("active") | Some("canceled") | Some("in_progress")
    ) {
        return Err(BizError::ValidationFailed("未対応の状態です".to_string()));
    }

    Ok(disposal_repo::list_inventory_records(conn, query)?)
}

/// 入庫記録詳細を返す。
///
/// 65-inventory-record-traceability.md §65.5
pub fn get_receiving_record(
    conn: &DbConnection,
    record_id: i64,
) -> Result<ReceivingRecordDetail, BizError> {
    match receiving_repo::get_receiving_record_detail(conn, record_id) {
        Ok(mut detail) => {
            // 行の金額と合計は BIZ が共通関数で求める（SPEC-UNIT-D6、X7）
            let mut line_centis = Vec::with_capacity(detail.items.len());
            for item in &mut detail.items {
                let centi = cost_line_centi(
                    i128::from(item.cost_price_centi),
                    item.quantity,
                    price_basis_quantity(item.stock_unit),
                    &item.product_code,
                )?;
                item.line_cost_centi = centi.to_string();
                line_centis.push(centi);
            }
            detail.total_cost = cost_total_yen(&line_centis)?;
            for movement in &mut detail.movements {
                movement.source =
                    resolve_movement_source(&movement.reference_type, &movement.reference_id);
            }
            Ok(detail)
        }
        Err(DbError::NotFound) => Err(BizError::NotFound(format!(
            "入庫記録が見つかりません: {}",
            record_id
        ))),
        Err(err) => Err(BizError::DatabaseError(err)),
    }
}

/// 返品・交換記録詳細を返す。
///
/// 65-inventory-record-traceability.md §65.5
pub fn get_return_record(
    conn: &DbConnection,
    record_id: i64,
) -> Result<ReturnRecordDetail, BizError> {
    match return_repo::get_return_record_detail(conn, record_id) {
        Ok(mut detail) => {
            for movement in &mut detail.movements {
                movement.source =
                    resolve_movement_source(&movement.reference_type, &movement.reference_id);
            }
            Ok(detail)
        }
        Err(DbError::NotFound) => Err(BizError::NotFound(format!(
            "返品・交換記録が見つかりません: {}",
            record_id
        ))),
        Err(err) => Err(BizError::DatabaseError(err)),
    }
}

/// 手動販売記録詳細を返す。
///
/// 65-inventory-record-traceability.md §65.5
pub fn get_manual_sale_record(
    conn: &DbConnection,
    record_id: i64,
) -> Result<ManualSaleRecordDetail, BizError> {
    match manual_sale_repo::get_manual_sale_record_detail(conn, record_id) {
        Ok(mut detail) => {
            for movement in &mut detail.movements {
                movement.source =
                    resolve_movement_source(&movement.reference_type, &movement.reference_id);
            }
            Ok(detail)
        }
        Err(DbError::NotFound) => Err(BizError::NotFound(format!(
            "手動販売記録が見つかりません: {}",
            record_id
        ))),
        Err(err) => Err(BizError::DatabaseError(err)),
    }
}

/// 廃棄・破損記録詳細を返す。
///
/// 65-inventory-record-traceability.md §65.5
pub fn get_disposal_record(
    conn: &DbConnection,
    record_id: i64,
) -> Result<DisposalRecordDetail, BizError> {
    match disposal_repo::get_disposal_record_detail(conn, record_id) {
        Ok(mut detail) => {
            // 行のロス原価と合計は BIZ が共通関数で求める（SPEC-UNIT-D6、X7）
            let mut line_centis = Vec::with_capacity(detail.items.len());
            for item in &mut detail.items {
                let centi = cost_line_centi(
                    i128::from(item.cost_price_centi),
                    item.quantity,
                    price_basis_quantity(item.stock_unit),
                    &item.product_code,
                )?;
                item.line_loss_cost_centi = centi.to_string();
                line_centis.push(centi);
            }
            detail.total_loss_cost = cost_total_yen(&line_centis)?;
            for movement in &mut detail.movements {
                movement.source =
                    resolve_movement_source(&movement.reference_type, &movement.reference_id);
            }
            Ok(detail)
        }
        Err(DbError::NotFound) => Err(BizError::NotFound(format!(
            "廃棄・破損記録が見つかりません: {}",
            record_id
        ))),
        Err(err) => Err(BizError::DatabaseError(err)),
    }
}

/// 在庫変動履歴を返す
///
/// 44-cmd-inventory.md §23.10
pub fn list_movements(
    conn: &DbConnection,
    query: &MovementQuery,
) -> Result<PaginatedResult<MovementRecord>, BizError> {
    if query.page < 1 || query.per_page < 1 || query.per_page > MAX_PER_PAGE {
        return Err(BizError::ValidationFailed(
            "ページパラメータが不正です".to_string(),
        ));
    }
    let mut result = inventory_repo::list_movements(conn, query)?;
    for item in &mut result.items {
        item.source = resolve_movement_source(&item.reference_type, &item.reference_id);
    }
    Ok(result)
}

/// movement の reference から元業務記録の表示情報を解決する。
///
/// 65-inventory-record-traceability.md TRACE-D2 / §65.3 / §65.8.2
pub(crate) fn resolve_movement_source(
    reference_type: &Option<ReferenceType>,
    reference_id: &Option<i64>,
) -> Option<MovementSourceLink> {
    let reference_type = reference_type.as_ref()?;
    let reference_id = (*reference_id)?;
    let (label_prefix, route_prefix) = match reference_type {
        ReferenceType::ReceivingRecord => ("入庫記録", "/inventory/receiving/records"),
        ReferenceType::ReturnRecord => ("返品・交換", "/inventory/return/records"),
        ReferenceType::ManualSale => ("手動販売出庫", "/inventory/manual-sale/records"),
        ReferenceType::DisposalRecord => ("廃棄・破損", "/inventory/disposal/records"),
        ReferenceType::CsvImport => ("CSV取込み", "/csv-import/records"),
        ReferenceType::Stocktake => ("棚卸し", "/stocktake/records"),
    };

    Some(MovementSourceLink {
        label: format!("{} #{}", label_prefix, reference_id),
        route: format!("{}/{}", route_prefix, reference_id),
    })
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db;

    fn setup_db() -> DbConnection {
        let conn = db::init_database(":memory:").unwrap();
        db::migration::migrate(&conn).unwrap();
        conn
    }

    fn seed_product_with_stock(conn: &DbConnection, code: &str, stock: i64, unit: &str) {
        let product = crate::db::product_repo::NewProduct {
            product_code: code.to_string(),
            jan_code: None,
            name: format!("テスト商品_{}", code),
            department_id: 1,
            supplier_id: None,
            selling_price: 500,
            cost_price_centi: 300,
            tax_rate: "10".to_string(),
            maker_code: None,
            stock_quantity: stock,
            stock_unit: unit.to_string(),
            is_discontinued: false,
            plu_dirty: true,
            plu_exported_at: None,
            plu_target: true,
            pos_stock_sync: true,
        };
        crate::db::product_repo::insert_product(conn, &product).unwrap();
    }

    #[test]
    fn test_list_receivings_req201_empty_table() {
        // REQ-201: 入庫記録 — 入庫記録一覧: 空テーブル → 0件
        let conn = setup_db();
        let query = ListQuery {
            page: 1,
            per_page: 10,
            date_from: None,
            date_to: None,
        };
        let result = list_receivings(&conn, &query).unwrap();
        assert_eq!(result.total_count, 0);
        assert!(result.items.is_empty());
        assert_eq!(result.page, 1);
        assert_eq!(result.per_page, 10);
    }

    #[test]
    fn test_list_returns_req202_empty_table() {
        // REQ-202: 返品・交換記録 — 返品記録一覧: 空テーブル → 0件
        let conn = setup_db();
        let query = ListQuery {
            page: 1,
            per_page: 10,
            date_from: None,
            date_to: None,
        };
        let result = list_returns(&conn, &query).unwrap();
        assert_eq!(result.total_count, 0);
        assert!(result.items.is_empty());
    }

    #[test]
    fn test_list_disposals_req204_empty_table() {
        // REQ-204: 廃棄・破損記録 — 廃棄記録一覧: 空テーブル → 0件
        let conn = setup_db();
        let query = ListQuery {
            page: 1,
            per_page: 10,
            date_from: None,
            date_to: None,
        };
        let result = list_disposals(&conn, &query).unwrap();
        assert_eq!(result.total_count, 0);
        assert!(result.items.is_empty());
    }

    #[test]
    fn test_list_receivings_req201_per_page_exceeds_max() {
        // REQ-201: 入庫記録 — 入庫記録一覧: per_page 上限超え → バリデーションエラー
        let conn = setup_db();
        let query = ListQuery {
            page: 1,
            per_page: 201,
            date_from: None,
            date_to: None,
        };
        let err = list_receivings(&conn, &query).unwrap_err();
        match err {
            BizError::ValidationFailed(msg) => {
                assert!(msg.contains("ページパラメータ"));
            }
            _ => panic!("expected ValidationFailed, got {:?}", err),
        }
    }

    #[test]
    fn test_list_returns_req202_page_zero() {
        // REQ-202: 返品・交換記録 — 返品記録一覧: page=0 → バリデーションエラー
        let conn = setup_db();
        let query = ListQuery {
            page: 0,
            per_page: 10,
            date_from: None,
            date_to: None,
        };
        let err = list_returns(&conn, &query).unwrap_err();
        match err {
            BizError::ValidationFailed(_) => {}
            _ => panic!("expected ValidationFailed, got {:?}", err),
        }
    }

    #[test]
    fn test_list_disposals_req204_per_page_zero() {
        // REQ-204: 廃棄・破損記録 — 廃棄記録一覧: per_page=0 → バリデーションエラー
        let conn = setup_db();
        let query = ListQuery {
            page: 1,
            per_page: 0,
            date_from: None,
            date_to: None,
        };
        let err = list_disposals(&conn, &query).unwrap_err();
        match err {
            BizError::ValidationFailed(_) => {}
            _ => panic!("expected ValidationFailed, got {:?}", err),
        }
    }

    #[test]
    fn test_list_movements_req303_valid_movement_type() {
        // REQ-303: 在庫変動履歴 — 有効な movement_type → バリデーション通過（空結果OK）
        let conn = setup_db();
        let query = MovementQuery {
            product_code: "TEST-001".to_string(),
            date_from: None,
            date_to: None,
            movement_type: Some(crate::db::inventory_repo::MovementType::Receiving),
            page: 1,
            per_page: 10,
        };
        // 有効な movement_type ならバリデーションを通過（空結果OK）
        let result = list_movements(&conn, &query).unwrap();
        assert_eq!(result.total_count, 0);
    }

    #[test]
    fn test_list_movements_accepts_per_page_200() {
        let conn = setup_db();
        let query = MovementQuery {
            product_code: "TEST-001".to_string(),
            date_from: None,
            date_to: None,
            movement_type: None,
            page: 1,
            per_page: 200,
        };

        let result = list_movements(&conn, &query).unwrap();

        assert_eq!(result.per_page, 200);
    }

    #[test]
    fn test_resolve_movement_source_req207_known_references() {
        // REQ-207 / TRACE-D2: movement reference から元業務記録 link を解決する
        let cases = [
            (
                ReferenceType::ReceivingRecord,
                42,
                "入庫記録 #42",
                "/inventory/receiving/records/42",
            ),
            (
                ReferenceType::ReturnRecord,
                7,
                "返品・交換 #7",
                "/inventory/return/records/7",
            ),
            (
                ReferenceType::ManualSale,
                9,
                "手動販売出庫 #9",
                "/inventory/manual-sale/records/9",
            ),
            (
                ReferenceType::DisposalRecord,
                11,
                "廃棄・破損 #11",
                "/inventory/disposal/records/11",
            ),
            (
                ReferenceType::CsvImport,
                3,
                "CSV取込み #3",
                "/csv-import/records/3",
            ),
            (
                ReferenceType::Stocktake,
                5,
                "棚卸し #5",
                "/stocktake/records/5",
            ),
        ];

        for (reference_type, reference_id, expected_label, expected_route) in cases {
            let source = resolve_movement_source(&Some(reference_type), &Some(reference_id))
                .expect("known reference should resolve");
            assert_eq!(source.label, expected_label);
            assert_eq!(source.route, expected_route);
        }
    }

    #[test]
    fn test_resolve_movement_source_req303_null_reference() {
        // REQ-303: 初期在庫など NULL reference の movement は source なしで表示可能
        assert!(resolve_movement_source(&None, &Some(1)).is_none());
        assert!(resolve_movement_source(&Some(ReferenceType::ReceivingRecord), &None).is_none());
    }

    #[test]
    fn test_list_movements_req303_includes_source_link() {
        // REQ-303 / TRACE-D2: list_movements は既存 reference に加えて source link を返す
        let conn = setup_db();
        seed_product_with_stock(&conn, "MV-SRC", 10, "pcs");
        conn.execute(
            "INSERT INTO inventory_movements \
             (product_code, movement_type, quantity, stock_after, reference_type, reference_id, is_voided, created_at, business_date, phase) \
             VALUES ('MV-SRC', 'receiving', 5, 15, 'receiving_record', 42, 0, '2026-03-15T10:00:00', '2026-04-01', 0)",
            [],
        )
        .unwrap();

        let query = MovementQuery {
            product_code: "MV-SRC".to_string(),
            date_from: None,
            date_to: None,
            movement_type: None,
            page: 1,
            per_page: 50,
        };
        let result = list_movements(&conn, &query).unwrap();

        let source = result.items[0].source.as_ref().expect("source link");
        assert_eq!(source.label, "入庫記録 #42");
        assert_eq!(source.route, "/inventory/receiving/records/42");
    }

    #[test]
    fn test_list_movements_req303_null_reference_has_no_source() {
        // REQ-303: reference_type/reference_id が NULL の既存行も source=None で残す
        let conn = setup_db();
        seed_product_with_stock(&conn, "MV-NULL", 10, "pcs");
        conn.execute(
            "INSERT INTO inventory_movements \
             (product_code, movement_type, quantity, stock_after, is_voided, created_at, business_date, phase) \
             VALUES ('MV-NULL', 'receiving', 5, 15, 0, '2026-03-15T10:00:00', '2026-04-01', 0)",
            [],
        )
        .unwrap();

        let query = MovementQuery {
            product_code: "MV-NULL".to_string(),
            date_from: None,
            date_to: None,
            movement_type: None,
            page: 1,
            per_page: 50,
        };
        let result = list_movements(&conn, &query).unwrap();

        assert_eq!(result.total_count, 1);
        assert!(result.items[0].source.is_none());
    }

    #[test]
    fn test_list_inventory_records_req206_rejects_invalid_page_params() {
        // REQ-206 / TRACE-D1: 入出庫履歴ハブは per_page 上限200をBIZで検証する
        let conn = setup_db();
        let query = crate::db::disposal_repo::InventoryRecordQuery {
            record_type: Some("disposal_record".to_string()),
            date_from: None,
            date_to: None,
            record_id: None,
            product_keyword: None,
            department_id: None,
            status: None,
            page: 1,
            per_page: 201,
        };

        let err = list_inventory_records(&conn, &query).unwrap_err();

        assert!(matches!(err, BizError::ValidationFailed(_)));
    }

    #[test]
    fn test_list_inventory_records_accepts_per_page_200() {
        let conn = setup_db();
        let query = crate::db::disposal_repo::InventoryRecordQuery {
            record_type: None,
            date_from: None,
            date_to: None,
            record_id: None,
            product_keyword: None,
            department_id: None,
            status: None,
            page: 1,
            per_page: 200,
        };

        let result = list_inventory_records(&conn, &query).unwrap();

        assert_eq!(result.per_page, 200);
    }

    #[test]
    fn test_list_inventory_records_req206_rejects_unknown_record_type() {
        // REQ-206: 未対応のrecord_typeはBIZ validationとして拒否する
        let conn = setup_db();
        let query = crate::db::disposal_repo::InventoryRecordQuery {
            record_type: Some("unknown_type".to_string()),
            date_from: None,
            date_to: None,
            record_id: None,
            product_keyword: None,
            department_id: None,
            status: None,
            page: 1,
            per_page: 20,
        };

        let err = list_inventory_records(&conn, &query).unwrap_err();

        assert!(matches!(err, BizError::ValidationFailed(msg) if msg.contains("記録種別")));
    }

    #[test]
    fn test_list_inventory_records_req206_allowlist_six_types_four_statuses() {
        // REQ-206 / 44-cmd §23.10: 値域だけを6種・4値へ拡張し未知値は拒否する
        let conn = setup_db();
        for record_type in ["csv_import", "stocktake"] {
            let query = crate::db::disposal_repo::InventoryRecordQuery {
                record_type: Some(record_type.to_string()),
                date_from: None,
                date_to: None,
                record_id: None,
                product_keyword: None,
                department_id: None,
                status: None,
                page: 1,
                per_page: 20,
            };
            assert!(list_inventory_records(&conn, &query).is_ok());
        }
        for status in ["all", "active", "canceled", "in_progress"] {
            let query = crate::db::disposal_repo::InventoryRecordQuery {
                record_type: Some("all".to_string()),
                date_from: None,
                date_to: None,
                record_id: None,
                product_keyword: None,
                department_id: None,
                status: Some(status.to_string()),
                page: 1,
                per_page: 20,
            };
            assert!(list_inventory_records(&conn, &query).is_ok());
        }

        let query = crate::db::disposal_repo::InventoryRecordQuery {
            record_type: Some("all".to_string()),
            date_from: None,
            date_to: None,
            record_id: None,
            product_keyword: None,
            department_id: None,
            status: Some("unknown_status".to_string()),
            page: 1,
            per_page: 20,
        };
        let error = list_inventory_records(&conn, &query).unwrap_err();
        assert!(matches!(error, BizError::ValidationFailed(msg) if msg.contains("状態")));
    }

    #[test]
    fn test_get_disposal_record_req204_maps_missing_to_not_found() {
        // REQ-204 / REQ-206: 廃棄・破損詳細の未存在IDはBIZ NotFoundに変換する
        let conn = setup_db();

        let err = get_disposal_record(&conn, 404).unwrap_err();

        assert!(matches!(err, BizError::NotFound(msg) if msg.contains("廃棄・破損")));
    }

    // -----------------------------------------------------------------------
    // 記録詳細の行の金額と合計（SPEC-UNIT-D6、X7）と wire の単位（SPEC-UNIT-D11）
    // -----------------------------------------------------------------------

    use crate::biz::inventory_service::{
        create_disposal, create_receiving, DisposalCreateRequest, ReceivingCreateRequest,
    };
    use crate::db::product_repo::ProductStockUnit;

    /// (商品コード, 数量, 原価) の明細で入庫して記録詳細を返す
    fn receive(
        conn: &mut DbConnection,
        key: &str,
        lines: &[(&str, i64, i64)],
    ) -> ReceivingRecordDetail {
        let items = serde_json::json!(lines
            .iter()
            .map(|(code, quantity, cost)| {
                serde_json::json!({"product_code": code, "quantity": quantity, "cost_price_centi": cost})
            })
            .collect::<Vec<_>>());
        let req: ReceivingCreateRequest = serde_json::from_value(serde_json::json!({
            "idempotency_key": key,
            "supplier_id": null,
            "receiving_date": "2026-10-01",
            "note": null,
            "items": items,
        }))
        .unwrap();
        let result = create_receiving(conn, req).unwrap();
        get_receiving_record(conn, result.record_id).unwrap()
    }

    fn dispose(
        conn: &mut DbConnection,
        key: &str,
        lines: &[(&str, i64, i64)],
    ) -> DisposalRecordDetail {
        let items = serde_json::json!(lines
            .iter()
            .map(|(code, quantity, cost)| {
                serde_json::json!({
                    "product_code": code, "disposal_type": "damage", "quantity": quantity,
                    "cost_price_centi": cost, "reason": "合成の理由",
                })
            })
            .collect::<Vec<_>>());
        let req: DisposalCreateRequest = serde_json::from_value(serde_json::json!({
            "idempotency_key": key,
            "disposal_date": "2026-10-01",
            "items": items,
        }))
        .unwrap();
        let result = create_disposal(conn, req).unwrap();
        get_disposal_record(conn, result.record_id).unwrap()
    }

    fn seed_amount_products(conn: &DbConnection) {
        seed_product_with_stock(conn, "AM-M", 100_000, "m");
        seed_product_with_stock(conn, "AM-CM", 100_000, "m");
        seed_product_with_stock(conn, "AM-PCS", 0, "pcs");
        seed_product_with_stock(conn, "AM-PCS2", 100, "pcs");
    }

    #[test]
    fn test_get_receiving_record_req201_line_cost_centi_from_biz() {
        // REQ-201 / REQ-206 / SPEC-UNIT-D6（X7）: 行の金額は BIZ が基準数量で割って求め、1/100 円の文字列で返す
        let mut conn = setup_db();
        seed_amount_products(&conn);

        // 単位の混ざった伝票: 行ごとに基準数量で割り、合計は 1/100 円で足してから丸める（174 ではない）
        let mixed = receive(
            &mut conn,
            "am-mixed",
            &[("AM-M", 50, 33_300), ("AM-CM", 50, 100), ("AM-PCS", 3, 200)],
        );
        let lines: Vec<&str> = mixed
            .items
            .iter()
            .map(|item| item.line_cost_centi.as_str())
            .collect();
        assert_eq!(lines, vec!["16650", "50", "600"]);
        assert_eq!(mixed.total_cost, 173);
        assert_eq!(mixed.items[0].stock_unit, ProductStockUnit::M);

        // 長さの商品 2.5 m・原価 333 円（33300）
        let length = receive(&mut conn, "am-length", &[("AM-M", 250, 33_300)]);
        assert_eq!(length.items[0].line_cost_centi, "83250");
        assert_eq!(length.total_cost, 833);

        // 個数の商品（数量 4・原価 250 円〈25000〉）は今と同じ額
        let count = receive(&mut conn, "am-count", &[("AM-PCS", 4, 25_000)]);
        assert_eq!(count.items[0].line_cost_centi, "100000");
        assert_eq!(count.total_cost, 1000);

        // 上限の明細
        let limit = receive(&mut conn, "am-limit", &[("AM-PCS", 9_999_999, 99_999_900)]);
        assert_eq!(limit.items[0].line_cost_centi, "999998900000100");
        assert_eq!(limit.total_cost, 9_999_989_000_001);
    }

    #[test]
    fn test_get_disposal_record_req204_line_loss_cost_centi_from_biz() {
        // REQ-204 / REQ-206 / SPEC-UNIT-D6（X7）: 廃棄のロス原価も同じ関数で求める
        let mut conn = setup_db();
        seed_amount_products(&conn);

        let mixed = dispose(
            &mut conn,
            "am-mixed",
            &[
                ("AM-M", 50, 33_300),
                ("AM-CM", 50, 100),
                ("AM-PCS2", 3, 200),
            ],
        );
        let lines: Vec<&str> = mixed
            .items
            .iter()
            .map(|item| item.line_loss_cost_centi.as_str())
            .collect();
        assert_eq!(lines, vec!["16650", "50", "600"]);
        assert_eq!(mixed.total_loss_cost, 173);

        // 長さの商品 0.5 m・原価 333 円（33300）
        let length = dispose(&mut conn, "am-length", &[("AM-M", 50, 33_300)]);
        assert_eq!(length.items[0].line_loss_cost_centi, "16650");
        assert_eq!(length.total_loss_cost, 167);

        // 個数の商品（数量 2・原価 120 円 と数量 3・原価 80 円）は今と同じ額
        let count = dispose(
            &mut conn,
            "am-count",
            &[("AM-PCS2", 2, 12_000), ("AM-PCS2", 3, 8_000)],
        );
        let lines: Vec<&str> = count
            .items
            .iter()
            .map(|item| item.line_loss_cost_centi.as_str())
            .collect();
        assert_eq!(lines, vec!["24000", "24000"]);
        assert_eq!(count.total_loss_cost, 480);

        let limit = dispose(&mut conn, "am-limit", &[("AM-PCS", 9_999_999, 99_999_900)]);
        assert_eq!(limit.items[0].line_loss_cost_centi, "999998900000100");
    }

    #[test]
    fn test_receiving_req201_line_cost_uses_centi_directly() {
        // REQ-201 / SPEC-UNIT-D5・D6 / Matrix C4: 1/100 円の原価をそのまま行の金額に使う（* 100 が残れば 100 倍）
        let mut conn = setup_db();
        seed_amount_products(&conn);
        let count = receive(&mut conn, "c4-count", &[("AM-PCS", 3, 8333)]);
        assert_eq!(count.items[0].cost_price_centi, 8333);
        assert_eq!(count.items[0].line_cost_centi, "24999");
        assert_eq!(count.total_cost, 250);
        // 1 m あたり 83.33 円の m の商品 1.3 m
        let length = receive(&mut conn, "c4-length", &[("AM-M", 130, 8333)]);
        assert_eq!(length.items[0].line_cost_centi, "10833");
        assert_eq!(length.total_cost, 108);
    }

    #[test]
    fn test_record_detail_req206_line_amounts_from_centi() {
        // REQ-204 / REQ-206 / SPEC-UNIT-D6 / Matrix C5: 廃棄の記録詳細も 1/100 円の原価から C4 と同じ値
        let mut conn = setup_db();
        seed_amount_products(&conn);
        let count = dispose(&mut conn, "c5-count", &[("AM-PCS2", 3, 8333)]);
        assert_eq!(count.items[0].cost_price_centi, 8333);
        assert_eq!(count.items[0].line_loss_cost_centi, "24999");
        assert_eq!(count.total_loss_cost, 250);
        let length = dispose(&mut conn, "c5-length", &[("AM-M", 130, 8333)]);
        assert_eq!(length.items[0].line_loss_cost_centi, "10833");
        assert_eq!(length.total_loss_cost, 108);
    }

    /// (商品コード, 数量, 原価) の明細の入庫・廃棄の要求（結果をそのまま返す）
    fn receiving_req(key: &str, lines: &[(String, i64, i64)]) -> ReceivingCreateRequest {
        serde_json::from_value(serde_json::json!({
            "idempotency_key": key,
            "supplier_id": null,
            "receiving_date": "2026-10-01",
            "note": null,
            "items": lines.iter().map(|(code, quantity, cost)| serde_json::json!({
                "product_code": code, "quantity": quantity, "cost_price_centi": cost,
            })).collect::<Vec<_>>(),
        }))
        .unwrap()
    }

    fn disposal_req(key: &str, lines: &[(String, i64, i64)]) -> DisposalCreateRequest {
        serde_json::from_value(serde_json::json!({
            "idempotency_key": key,
            "disposal_date": "2026-10-01",
            "items": lines.iter().map(|(code, quantity, cost)| serde_json::json!({
                "product_code": code, "disposal_type": "damage", "quantity": quantity,
                "cost_price_centi": cost, "reason": "合成の理由",
            })).collect::<Vec<_>>(),
        }))
        .unwrap()
    }

    fn table_counts(conn: &DbConnection) -> Vec<i64> {
        [
            "receiving_records",
            "receiving_items",
            "disposal_records",
            "disposal_items",
            "inventory_movements",
            "operation_logs",
        ]
        .iter()
        .map(|table| {
            conn.query_row(&format!("SELECT COUNT(*) FROM {table}"), [], |row| {
                row.get(0)
            })
            .unwrap()
        })
        .collect()
    }

    #[test]
    fn test_receiving_disposal_req903_total_safe_integer_with_centi_limits() {
        // REQ-201 / REQ-204 / REQ-903 / 共通規則 (c) / Matrix C6: 上限の明細（数量 9999999・原価 99999999）
        // 900 行は通り（合計 8999999010000009 円）、901 行（9009999008900009 円）は合計金額が大きすぎます
        let limit_lines = |rows: usize| -> Vec<(String, i64, i64)> {
            (0..rows)
                .map(|i| (format!("C6-A{}", i / 100 + 1), 9_999_999, 99_999_999))
                .collect()
        };
        let mut conn = setup_db();
        for product in 1..=10 {
            seed_product_with_stock(&conn, &format!("C6-A{product}"), 0, "pcs");
        }
        let created =
            create_receiving(&mut conn, receiving_req("c6-r-900", &limit_lines(900))).unwrap();
        let detail = get_receiving_record(&conn, created.record_id).unwrap();
        assert_eq!(detail.total_cost, 8_999_999_010_000_009);
        let created =
            create_disposal(&mut conn, disposal_req("c6-d-900", &limit_lines(900))).unwrap();
        let detail = get_disposal_record(&conn, created.record_id).unwrap();
        assert_eq!(detail.total_loss_cost, 8_999_999_010_000_009);

        let before = table_counts(&conn);
        let receiving = create_receiving(&mut conn, receiving_req("c6-r-901", &limit_lines(901)));
        let disposal = create_disposal(&mut conn, disposal_req("c6-d-901", &limit_lines(901)));
        for result in [receiving.map(|_| ()), disposal.map(|_| ())] {
            assert!(
                matches!(result, Err(BizError::ValidationFailed(ref m)) if m == "合計金額が大きすぎます"),
                "{result:?}"
            );
        }
        assert_eq!(table_counts(&conn), before);
    }

    #[test]
    fn test_receiving_disposal_req201_req204_idempotency_precedes_cost_limit() {
        // REQ-201 / REQ-204 / 31 の処理ステップ 0・1 / Matrix C22: 保存済みの冪等キーで原価だけ上限の外に変えた要求は
        // 原価の検査より先に IdempotencyConflict で止まり、何も書かない
        let mut conn = setup_db();
        seed_product_with_stock(&conn, "C22-A", 10, "pcs");
        let line = |cost: i64| vec![("C22-A".to_string(), 1, cost)];
        create_receiving(&mut conn, receiving_req("c22-r", &line(8333))).unwrap();
        create_disposal(&mut conn, disposal_req("c22-d", &line(8333))).unwrap();
        let before = table_counts(&conn);
        let receiving = create_receiving(&mut conn, receiving_req("c22-r", &line(100_000_000)));
        assert!(
            matches!(receiving, Err(BizError::IdempotencyConflict(_))),
            "{receiving:?}"
        );
        let disposal = create_disposal(&mut conn, disposal_req("c22-d", &line(100_000_000)));
        assert!(
            matches!(disposal, Err(BizError::IdempotencyConflict(_))),
            "{disposal:?}"
        );
        assert_eq!(table_counts(&conn), before);
    }

    #[test]
    fn test_get_record_req206_unknown_stock_unit_is_read_error() {
        // REQ-206 / SPEC-UNIT-D11: DB に一覧に無い単位がある記録の詳細の読取りは error
        let mut conn = setup_db();
        seed_amount_products(&conn);
        let detail = receive(&mut conn, "am-unknown", &[("AM-PCS", 1, 100)]);
        conn.execute_batch(
            "PRAGMA ignore_check_constraints = ON;
             UPDATE products SET stock_unit = 'kg' WHERE product_code = 'AM-PCS';
             PRAGMA ignore_check_constraints = OFF;",
        )
        .unwrap();

        let result = get_receiving_record(&conn, detail.id);
        assert!(
            matches!(result, Err(BizError::DatabaseError(_))),
            "{result:?}"
        );
    }
}
