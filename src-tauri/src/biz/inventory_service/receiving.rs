//! 入庫記録（create_receiving）

use crate::biz::BizError;
use crate::db::inventory_repo::{MovementType, ReferenceType};
use crate::db::product_repo;
use crate::db::receiving_repo;
use crate::db::system_repo;
use crate::db::{DbConnection, DbError};

use std::collections::BTreeMap;

use super::common::{apply_stock_change, compute_fingerprint, IDEMPOTENCY_KEY_MAX_LEN};

/// 入庫記録リクエスト（31-biz-inventory-service.md §12.3）
#[derive(Debug, Clone, serde::Deserialize, specta::Type)]
pub struct ReceivingCreateRequest {
    pub idempotency_key: String,
    pub supplier_id: Option<i64>,
    pub receiving_date: String,
    pub note: Option<String>,
    pub items: Vec<ReceivingItemInput>,
}

#[derive(Debug, Clone, serde::Deserialize, specta::Type)]
pub struct ReceivingItemInput {
    pub product_code: String,
    pub quantity: i64,
    pub cost_price: i64,
}

/// 入庫記録の結果
#[derive(Debug, serde::Serialize, specta::Type)]
pub struct ReceivingCreateResult {
    pub record_id: i64,
    pub created: bool,
    pub idempotent_replay: bool,
    pub stock_warnings: Vec<String>,
    pub cost_diffs: Vec<CostDiff>,
}

/// 入庫実原価と商品マスタ原価の差分（SPEC-PRV-D8 / REQ-209）
#[derive(Debug, serde::Serialize, specta::Type)]
pub struct CostDiff {
    pub product_code: String,
    pub product_name: String,
    pub master_cost_price: i64,
    pub received_cost_price: i64,
}

/// 入庫記録ヘッダと明細を登録し、各明細について在庫を増加させる
///
/// 31-biz-inventory-service.md §12.3
pub fn create_receiving(
    conn: &mut DbConnection,
    req: ReceivingCreateRequest,
) -> Result<ReceivingCreateResult, BizError> {
    // idempotency_key 正規化 + 長さ制限
    let normalized_key = req.idempotency_key.trim().to_string();
    if normalized_key.is_empty() {
        return Err(BizError::ValidationFailed(
            "冪等性キーは必須です".to_string(),
        ));
    }
    if normalized_key.len() > IDEMPOTENCY_KEY_MAX_LEN {
        return Err(BizError::ValidationFailed(format!(
            "冪等性キーは{}文字以内です",
            IDEMPOTENCY_KEY_MAX_LEN
        )));
    }

    // 明細空チェック（fingerprint 計算より先に実行）
    if req.items.is_empty() {
        return Err(BizError::ValidationFailed(
            "明細が1件以上必要です".to_string(),
        ));
    }

    // fingerprint 算出（リクエストフィールドのみ使用、DB参照不要）
    let supplier_str = req
        .supplier_id
        .map(|id| id.to_string())
        .unwrap_or_else(|| "null".to_string());
    let header = format!("{}|{}", supplier_str, req.receiving_date);
    let item_lines: Vec<String> = req
        .items
        .iter()
        .map(|i| format!("{}|{}|{}", i.product_code, i.quantity, i.cost_price))
        .collect();
    let fingerprint = compute_fingerprint(&header, &item_lines);

    // 冪等性チェック（楽観パス — バリデーションより先に実行）
    if let Some((existing_id, existing_fp)) =
        receiving_repo::find_receiving_by_idempotency_key(conn, &normalized_key)?
    {
        if existing_fp == fingerprint {
            return Ok(ReceivingCreateResult {
                record_id: existing_id,
                created: false,
                idempotent_replay: true,
                stock_warnings: vec![],
                cost_diffs: vec![],
            });
        } else {
            return Err(BizError::IdempotencyConflict(
                "同じ冪等キーで異なる内容のリクエストです".to_string(),
            ));
        }
    }

    // バリデーション（DB参照あり）
    for (i, item) in req.items.iter().enumerate() {
        if item.quantity <= 0 {
            return Err(BizError::ValidationFailed(format!(
                "明細{}: 数量は1以上必要です",
                i + 1
            )));
        }
        if item.cost_price < 0 {
            return Err(BizError::ValidationFailed(format!(
                "明細{}: 原価は0以上必要です",
                i + 1
            )));
        }
        if product_repo::find_by_product_code(conn, &item.product_code)?.is_none() {
            return Err(BizError::NotFound(format!(
                "商品が見つかりません: {}",
                item.product_code
            )));
        }
    }
    if let Some(sid) = req.supplier_id {
        if product_repo::find_supplier_by_id(conn, sid)?.is_none() {
            return Err(BizError::NotFound(format!(
                "取引先が見つかりません: {}",
                sid
            )));
        }
    }

    // トランザクション
    let tx = conn
        .transaction()
        .map_err(|e| BizError::DatabaseError(DbError::from(e)))?;

    // ヘッダ INSERT（race condition 対策: DuplicateKey ハンドリング）
    let record_id = match receiving_repo::insert_receiving_record(
        &tx,
        &crate::db::receiving_repo::NewReceivingRecord {
            supplier_id: req.supplier_id,
            receiving_date: req.receiving_date.clone(),
            note: req.note.clone(),
            idempotency_key: normalized_key.clone(),
            request_fingerprint: fingerprint.clone(),
        },
    ) {
        Ok(id) => id,
        Err(DbError::DuplicateKey(_)) => {
            // Race condition: 別スレッドが先に INSERT した
            let (existing_id, existing_fp) =
                receiving_repo::find_receiving_by_idempotency_key(&tx, &normalized_key)?
                    .ok_or_else(|| {
                        BizError::DatabaseError(DbError::QueryFailed(
                            "DuplicateKey後にレコードが見つかりません".to_string(),
                        ))
                    })?;
            if existing_fp == fingerprint {
                // TX 自動ロールバック（副作用なし）
                return Ok(ReceivingCreateResult {
                    record_id: existing_id,
                    created: false,
                    idempotent_replay: true,
                    stock_warnings: vec![],
                    cost_diffs: vec![],
                });
            } else {
                return Err(BizError::IdempotencyConflict(
                    "同じ冪等キーで異なる内容のリクエストです".to_string(),
                ));
            }
        }
        Err(e) => return Err(BizError::DatabaseError(e)),
    };

    // 明細 INSERT + 在庫変動
    let mut stock_warnings_map: BTreeMap<String, String> = BTreeMap::new();
    for item in &req.items {
        receiving_repo::insert_receiving_item(
            &tx,
            &crate::db::receiving_repo::NewReceivingItem {
                receiving_record_id: record_id,
                product_code: item.product_code.clone(),
                quantity: item.quantity,
                cost_price: item.cost_price,
            },
        )?;
        let outcome = apply_stock_change(
            &tx,
            &item.product_code,
            item.quantity,
            MovementType::Receiving,
            ReferenceType::ReceivingRecord,
            record_id,
            None,
        )?;
        if outcome.negative_stock_warning {
            stock_warnings_map.insert(
                item.product_code.clone(),
                format!(
                    "{}: 在庫がマイナスになりました（{}）",
                    item.product_code, outcome.stock_after
                ),
            );
        }
    }

    // BTreeMap → Vec（product_code 昇順・重複排除済み）
    let stock_warnings: Vec<String> = stock_warnings_map.into_values().collect();

    // 操作ログ
    let detail = serde_json::json!({
        "record_type": "receiving_record",
        "record_id": record_id,
        "item_count": req.items.len(),
        "warning_count": stock_warnings.len(),
        "idempotency_key": normalized_key,
    });
    system_repo::insert_operation_log(
        &tx,
        &crate::db::system_repo::NewOperationLog {
            operation_type: "receiving_create".to_string(),
            summary: format!("入庫記録作成（{}明細）", req.items.len()),
            detail_json: Some(detail.to_string()),
        },
    )?;

    tx.commit()
        .map_err(|e| BizError::DatabaseError(DbError::from(e)))?;

    // SPEC-PRV-D8 / REQ-209: 保存済み入庫に影響させない COMMIT 後の差分検出。
    // 1 件でも読取りに失敗した場合は部分結果を返さず、警告を記録して空配列にする。
    let mut detected_cost_diffs = Vec::new();
    let mut detection_failed = false;
    for item in &req.items {
        match product_repo::find_by_product_code(conn, &item.product_code) {
            Ok(Some(product)) => {
                if item.cost_price != product.product.cost_price {
                    detected_cost_diffs.push(CostDiff {
                        product_code: item.product_code.clone(),
                        product_name: product.product.name,
                        master_cost_price: product.product.cost_price,
                        received_cost_price: item.cost_price,
                    });
                }
            }
            Ok(None) => {
                tracing::warn!(
                    product_code = %item.product_code,
                    record_id,
                    "入庫保存後の原価差分検出で商品が見つかりませんでした"
                );
                detection_failed = true;
                break;
            }
            Err(error) => {
                tracing::warn!(
                    ?error,
                    product_code = %item.product_code,
                    record_id,
                    "入庫保存後の原価差分検出に失敗しました"
                );
                detection_failed = true;
                break;
            }
        }
    }
    let cost_diffs = if detection_failed {
        vec![]
    } else {
        detected_cost_diffs
    };

    Ok(ReceivingCreateResult {
        record_id,
        created: true,
        idempotent_replay: false,
        stock_warnings,
        cost_diffs,
    })
}

#[cfg(test)]
mod tests {
    use super::super::test_support::*;
    use super::*;
    use crate::db::product_repo;

    fn make_receiving_req(key: &str, items: Vec<ReceivingItemInput>) -> ReceivingCreateRequest {
        ReceivingCreateRequest {
            idempotency_key: key.to_string(),
            supplier_id: None,
            receiving_date: "2026-04-07".to_string(),
            note: None,
            items,
        }
    }

    fn receiving_item(code: &str, qty: i64, cost: i64) -> ReceivingItemInput {
        ReceivingItemInput {
            product_code: code.to_string(),
            quantity: qty,
            cost_price: cost,
        }
    }

    #[test]
    fn test_create_receiving_req201_normal() {
        // REQ-201: 入庫記録 — 正常な入庫記録作成
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-001", 10);
        let supplier_id = create_test_supplier(&conn);

        let mut req = make_receiving_req("recv-key-1", vec![receiving_item("RCV-001", 5, 300)]);
        req.supplier_id = Some(supplier_id);

        let result = create_receiving(&mut conn, req).unwrap();
        assert!(result.created);
        assert!(!result.idempotent_replay);
        assert!(result.stock_warnings.is_empty());
        assert!(result.record_id > 0);

        // 在庫増加確認
        let p = product_repo::find_by_product_code(&conn, "RCV-001")
            .unwrap()
            .unwrap();
        assert_eq!(p.product.stock_quantity, 15);
    }

    #[test]
    fn test_create_receiving_req201_idempotent_replay() {
        // REQ-201: 入庫記録 — 同じキー+同じ内容 → replay（副作用ゼロ）
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-002", 10);

        let req = make_receiving_req("recv-key-2", vec![receiving_item("RCV-002", 3, 200)]);
        let r1 = create_receiving(&mut conn, req.clone()).unwrap();
        assert!(r1.created);

        // 操作ログ数を記録
        let log_count_before: i64 = conn
            .query_row("SELECT COUNT(*) FROM operation_logs", [], |r| r.get(0))
            .unwrap();

        let r2 = create_receiving(&mut conn, req).unwrap();
        assert!(!r2.created);
        assert!(r2.idempotent_replay);
        assert_eq!(r2.record_id, r1.record_id);
        assert!(r2.stock_warnings.is_empty());

        // 副作用ゼロ: 在庫は1回目の+3のみ
        let p = product_repo::find_by_product_code(&conn, "RCV-002")
            .unwrap()
            .unwrap();
        assert_eq!(p.product.stock_quantity, 13);

        // 副作用ゼロ: operation_logs 増えていないこと
        let log_count_after: i64 = conn
            .query_row("SELECT COUNT(*) FROM operation_logs", [], |r| r.get(0))
            .unwrap();
        assert_eq!(log_count_before, log_count_after);
    }

    #[test]
    fn test_create_receiving_req201_idempotency_conflict() {
        // REQ-201: 入庫記録 — 同じキー+異なる内容 → IdempotencyConflict
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-003", 10);

        let req1 = make_receiving_req("recv-key-3", vec![receiving_item("RCV-003", 3, 200)]);
        create_receiving(&mut conn, req1).unwrap();

        let req2 = make_receiving_req("recv-key-3", vec![receiving_item("RCV-003", 5, 200)]);
        let result = create_receiving(&mut conn, req2);
        assert!(matches!(result, Err(BizError::IdempotencyConflict(_))));
    }

    #[test]
    fn test_create_receiving_req201_validation_empty_key() {
        // REQ-201: 入庫記録 — バリデーション: 空白のみの冪等性キー → エラー
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-004", 10);

        let req = make_receiving_req("   ", vec![receiving_item("RCV-004", 1, 100)]);
        let result = create_receiving(&mut conn, req);
        assert!(matches!(result, Err(BizError::ValidationFailed(_))));
    }

    #[test]
    fn test_create_receiving_req201_validation_empty_items() {
        // REQ-201: 入庫記録 — バリデーション: 空の明細 → エラー
        let (_dir, mut conn) = setup_test_db();

        let req = make_receiving_req("recv-key-5", vec![]);
        let result = create_receiving(&mut conn, req);
        assert!(matches!(result, Err(BizError::ValidationFailed(_))));
    }

    #[test]
    fn test_create_receiving_req201_validation_quantity_zero() {
        // REQ-201: 入庫記録 — バリデーション: 数量 <= 0 → エラー
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-006", 10);

        let req = make_receiving_req("recv-key-6", vec![receiving_item("RCV-006", 0, 100)]);
        let result = create_receiving(&mut conn, req);
        assert!(matches!(result, Err(BizError::ValidationFailed(_))));
    }

    #[test]
    fn test_create_receiving_req201_validation_negative_cost() {
        // REQ-201: 入庫記録 — バリデーション: 原価 < 0 → エラー
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-007", 10);

        let req = make_receiving_req("recv-key-7", vec![receiving_item("RCV-007", 1, -1)]);
        let result = create_receiving(&mut conn, req);
        assert!(matches!(result, Err(BizError::ValidationFailed(_))));
    }

    #[test]
    fn test_create_receiving_req201_validation_product_not_found() {
        // REQ-201: 入庫記録 — バリデーション: 存在しない商品 → NotFound
        let (_dir, mut conn) = setup_test_db();

        let req = make_receiving_req("recv-key-8", vec![receiving_item("NONEXIST", 1, 100)]);
        let result = create_receiving(&mut conn, req);
        assert!(matches!(result, Err(BizError::NotFound(_))));
    }

    #[test]
    fn test_create_receiving_req201_validation_supplier_not_found() {
        // REQ-201: 入庫記録 — バリデーション: 存在しない取引先 → NotFound
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-009", 10);

        let mut req = make_receiving_req("recv-key-9", vec![receiving_item("RCV-009", 1, 100)]);
        req.supplier_id = Some(99999);
        let result = create_receiving(&mut conn, req);
        assert!(matches!(result, Err(BizError::NotFound(_))));
    }

    #[test]
    fn test_create_receiving_req201_operation_log() {
        // REQ-201 / UI-11c-D7: 入庫記録の operation_log が関連記録 contract を満たすこと
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-010", 10);

        let req = make_receiving_req("recv-key-10", vec![receiving_item("RCV-010", 3, 200)]);
        let result = create_receiving(&mut conn, req).unwrap();

        let (op_type, detail_str): (String, String) = conn
            .query_row(
                "SELECT operation_type, detail_json FROM operation_logs ORDER BY id DESC LIMIT 1",
                [],
                |r| Ok((r.get(0)?, r.get(1)?)),
            )
            .unwrap();
        assert_eq!(op_type, "receiving_create");

        let detail: serde_json::Value = serde_json::from_str(&detail_str).unwrap();
        assert_eq!(detail["record_type"], "receiving_record");
        assert!(detail["record_id"].is_number());
        assert_eq!(detail["record_id"].as_i64(), Some(result.record_id));
        assert_eq!(detail["item_count"], 1);
        assert_eq!(detail["warning_count"], 0);
        assert_eq!(detail["idempotency_key"], "recv-key-10");
    }

    #[test]
    fn test_create_receiving_req201_idempotent_replay_after_product_change() {
        // REQ-201: 入庫記録 — P2-1回帰: 初回成功後にマスタが変わっても冪等リプレイが成立する
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "REPLAY-P1", 10);
        let supplier_id = create_test_supplier(&conn);

        let mut req = make_receiving_req(
            "replay-after-change",
            vec![receiving_item("REPLAY-P1", 5, 200)],
        );
        req.supplier_id = Some(supplier_id);

        // 初回成功
        let r1 = create_receiving(&mut conn, req.clone()).unwrap();
        assert!(r1.created);

        // 子テーブルから順に削除して find_by_product_code が None を返す状態を作る
        // 順序が正しくなければ NotFound エラーになるため、回帰検知が確実
        conn.execute(
            "DELETE FROM inventory_movements WHERE product_code = ?1",
            rusqlite::params!["REPLAY-P1"],
        )
        .unwrap();
        conn.execute(
            "DELETE FROM receiving_items WHERE product_code = ?1",
            rusqlite::params!["REPLAY-P1"],
        )
        .unwrap();
        let deleted = conn
            .execute(
                "DELETE FROM products WHERE product_code = ?1",
                rusqlite::params!["REPLAY-P1"],
            )
            .unwrap();
        assert_eq!(deleted, 1);
        assert!(product_repo::find_by_product_code(&conn, "REPLAY-P1")
            .unwrap()
            .is_none());

        // 同一キーで再送 → replay が成立する（NotFound にならない）
        let r2 = create_receiving(&mut conn, req).unwrap();
        assert!(!r2.created);
        assert!(r2.idempotent_replay);
        assert_eq!(r2.record_id, r1.record_id);
    }

    #[test]
    fn test_create_receiving_req201_stock_increase_multiple_items() {
        // REQ-201: 入庫記録 — 複数明細の在庫増加が正しく反映されること
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "RCV-011A", 5);
        create_test_product(&conn, "RCV-011B", 3);

        let req = make_receiving_req(
            "recv-key-11",
            vec![
                receiving_item("RCV-011A", 10, 100),
                receiving_item("RCV-011B", 7, 200),
            ],
        );
        let result = create_receiving(&mut conn, req).unwrap();
        assert!(result.created);

        let pa = product_repo::find_by_product_code(&conn, "RCV-011A")
            .unwrap()
            .unwrap();
        assert_eq!(pa.product.stock_quantity, 15);

        let pb = product_repo::find_by_product_code(&conn, "RCV-011B")
            .unwrap()
            .unwrap();
        assert_eq!(pb.product.stock_quantity, 10);
    }

    #[test]
    fn test_create_receiving_req209_detects_cost_diff() {
        // REQ-209 / SPEC-PRV-D8: マスタ原価との差を完全一致比較で検出する
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "PRVC-A", 10);
        create_test_product(&conn, "PRVC-B", 20);
        conn.execute(
            "UPDATE products SET cost_price = 500 WHERE product_code IN ('PRVC-A', 'PRVC-B')",
            [],
        )
        .unwrap();

        let req = make_receiving_req(
            "req209-detect",
            vec![
                receiving_item("PRVC-A", 2, 501),
                receiving_item("PRVC-B", 3, 499),
            ],
        );
        let result = create_receiving(&mut conn, req).unwrap();

        assert!(result.created);
        assert!(!result.idempotent_replay);
        assert_eq!(result.cost_diffs.len(), 2);
        assert_eq!(result.cost_diffs[0].product_code, "PRVC-A");
        assert_eq!(result.cost_diffs[0].product_name, "テスト商品 PRVC-A");
        assert_eq!(result.cost_diffs[0].master_cost_price, 500);
        assert_eq!(result.cost_diffs[0].received_cost_price, 501);
        assert_eq!(result.cost_diffs[1].product_code, "PRVC-B");
        assert_eq!(result.cost_diffs[1].product_name, "テスト商品 PRVC-B");
        assert_eq!(result.cost_diffs[1].master_cost_price, 500);
        assert_eq!(result.cost_diffs[1].received_cost_price, 499);

        let record_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM receiving_records WHERE id = ?1",
                [result.record_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(record_count, 1);
        assert_eq!(
            product_repo::find_by_product_code(&conn, "PRVC-A")
                .unwrap()
                .unwrap()
                .product
                .stock_quantity,
            12
        );
        assert_eq!(
            product_repo::find_by_product_code(&conn, "PRVC-B")
                .unwrap()
                .unwrap()
                .product
                .stock_quantity,
            23
        );
    }

    #[test]
    fn test_create_receiving_req209_no_diff_when_cost_matches() {
        // REQ-209 / SPEC-PRV-D8: 原価が完全一致する商品は差分に含めない
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "PRVC-MATCH", 10);
        conn.execute(
            "UPDATE products SET cost_price = 500 WHERE product_code = 'PRVC-MATCH'",
            [],
        )
        .unwrap();

        let result = create_receiving(
            &mut conn,
            make_receiving_req("req209-match", vec![receiving_item("PRVC-MATCH", 1, 500)]),
        )
        .unwrap();

        assert!(result.created);
        assert!(result.cost_diffs.is_empty());
    }

    #[test]
    fn test_create_receiving_req209_empty_on_idempotent_replay() {
        // REQ-209 / SPEC-PRV-D8: 冪等 replay では原価差分を再提示しない
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "PRVC-REPLAY", 10);
        conn.execute(
            "UPDATE products SET cost_price = 500 WHERE product_code = 'PRVC-REPLAY'",
            [],
        )
        .unwrap();
        let req = make_receiving_req("req209-replay", vec![receiving_item("PRVC-REPLAY", 1, 501)]);

        let created = create_receiving(&mut conn, req.clone()).unwrap();
        assert!(created.created);
        assert_eq!(created.cost_diffs.len(), 1);

        let replay = create_receiving(&mut conn, req).unwrap();
        assert!(!replay.created);
        assert!(replay.idempotent_replay);
        assert!(replay.cost_diffs.is_empty());
    }

    #[test]
    fn test_create_receiving_req209_cost_diff_detection_does_not_affect_save_tx() {
        // REQ-209 / SPEC-PRV-D8: 差分があっても入庫保存の成果物はすべて確定する
        let (_dir, mut conn) = setup_test_db();
        create_test_product(&conn, "PRVC-TX", 10);
        conn.execute(
            "UPDATE products SET cost_price = 500 WHERE product_code = 'PRVC-TX'",
            [],
        )
        .unwrap();

        let result = create_receiving(
            &mut conn,
            make_receiving_req("req209-tx", vec![receiving_item("PRVC-TX", 4, 501)]),
        )
        .unwrap();

        assert!(result.created);
        assert_eq!(result.cost_diffs.len(), 1);
        let record_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM receiving_records WHERE id = ?1",
                [result.record_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(record_count, 1);
        let item_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM receiving_items WHERE receiving_record_id = ?1 AND product_code = 'PRVC-TX' AND quantity = 4 AND cost_price = 501",
                [result.record_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(item_count, 1);
        assert_eq!(
            product_repo::find_by_product_code(&conn, "PRVC-TX")
                .unwrap()
                .unwrap()
                .product
                .stock_quantity,
            14
        );
        let log_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM operation_logs WHERE operation_type = 'receiving_create'",
                [],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(log_count, 1);
    }
}
