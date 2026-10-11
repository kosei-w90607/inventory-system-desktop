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
                    i128::from(item.cost_price) * 100,
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
                    i128::from(item.cost_price) * 100,
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
            cost_price: 300,
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
             (product_code, movement_type, quantity, stock_after, reference_type, reference_id, is_voided, created_at) \
             VALUES ('MV-SRC', 'receiving', 5, 15, 'receiving_record', 42, 0, '2026-03-15T10:00:00')",
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
             (product_code, movement_type, quantity, stock_after, is_voided, created_at) \
             VALUES ('MV-NULL', 'receiving', 5, 15, 0, '2026-03-15T10:00:00')",
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
                serde_json::json!({"product_code": code, "quantity": quantity, "cost_price": cost})
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
                    "cost_price": cost, "reason": "合成の理由",
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
        seed_product_with_stock(conn, "AM-CM", 100_000, "cm");
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
            &[("AM-M", 50, 333), ("AM-CM", 50, 1), ("AM-PCS", 3, 2)],
        );
        let lines: Vec<&str> = mixed
            .items
            .iter()
            .map(|item| item.line_cost_centi.as_str())
            .collect();
        assert_eq!(lines, vec!["16650", "50", "600"]);
        assert_eq!(mixed.total_cost, 173);
        assert_eq!(mixed.items[0].stock_unit, ProductStockUnit::M);

        // 長さの商品 2.5 m・原価 333
        let length = receive(&mut conn, "am-length", &[("AM-M", 250, 333)]);
        assert_eq!(length.items[0].line_cost_centi, "83250");
        assert_eq!(length.total_cost, 833);

        // 個数の商品（数量 4・原価 250）は今と同じ額
        let count = receive(&mut conn, "am-count", &[("AM-PCS", 4, 250)]);
        assert_eq!(count.items[0].line_cost_centi, "100000");
        assert_eq!(count.total_cost, 1000);

        // 上限の明細
        let limit = receive(&mut conn, "am-limit", &[("AM-PCS", 9_999_999, 999_999)]);
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
            &[("AM-M", 50, 333), ("AM-CM", 50, 1), ("AM-PCS2", 3, 2)],
        );
        let lines: Vec<&str> = mixed
            .items
            .iter()
            .map(|item| item.line_loss_cost_centi.as_str())
            .collect();
        assert_eq!(lines, vec!["16650", "50", "600"]);
        assert_eq!(mixed.total_loss_cost, 173);

        // 長さの商品 0.5 m・原価 333
        let length = dispose(&mut conn, "am-length", &[("AM-M", 50, 333)]);
        assert_eq!(length.items[0].line_loss_cost_centi, "16650");
        assert_eq!(length.total_loss_cost, 167);

        // 個数の商品（数量 2・原価 120 と数量 3・原価 80）は今と同じ額
        let count = dispose(
            &mut conn,
            "am-count",
            &[("AM-PCS2", 2, 120), ("AM-PCS2", 3, 80)],
        );
        let lines: Vec<&str> = count
            .items
            .iter()
            .map(|item| item.line_loss_cost_centi.as_str())
            .collect();
        assert_eq!(lines, vec!["24000", "24000"]);
        assert_eq!(count.total_loss_cost, 480);

        let limit = dispose(&mut conn, "am-limit", &[("AM-PCS", 9_999_999, 999_999)]);
        assert_eq!(limit.items[0].line_loss_cost_centi, "999998900000100");
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
