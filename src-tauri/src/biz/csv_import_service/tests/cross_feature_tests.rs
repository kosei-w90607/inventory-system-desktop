//! docs/diagrams/cross-feature-verification.md XFA-D1〜D5。
//! 実BIZを有限の操作列で実行する。期待値は合成業務イベントだけから更新する。

use crate::biz::csv_import_service::test_support::*;
use crate::biz::csv_import_service::*;
use crate::biz::{
    integrity_service, inventory_service, sales_service, stocktake_service, BizError,
};
use crate::db::inventory_repo::{self, MovementType, NewMovement};
use crate::db::{self, DbConnection};
use rusqlite::types::Value;
use serde_json::json;

const DATE: &str = "2026-09-16";
const CODES: [&str; 2] = ["XFA-SYNC", "XFA-NOSYNC"];
const JANS: [&str; 2] = ["2900000000018", "2900000000025"];
const INITIAL: [i64; 2] = [10, 20];

#[derive(Clone, Copy, Debug)]
enum Operation {
    Receive,
    ManualSale,
    Dispose,
    Return,
    RegisterProcessedReturn,
    CsvSale,
    CsvReturn,
    CsvNoSync,
    Reopen,
}

const OPERATIONS: [Operation; 9] = [
    Operation::Receive,
    Operation::ManualSale,
    Operation::Dispose,
    Operation::Return,
    Operation::RegisterProcessedReturn,
    Operation::CsvSale,
    Operation::CsvReturn,
    Operation::CsvNoSync,
    Operation::Reopen,
];

#[derive(Debug)]
struct Model {
    stock: [i64; 2],
    // 商品 × source（auto / manual）ごとの (数量, 金額)。
    sales: [[(i64, i64); 2]; 2],
}

impl Model {
    fn sale(&mut self, sku: usize, source: usize, quantity: i64, amount: i64) {
        self.sales[sku][source].0 += quantity;
        self.sales[sku][source].1 += amount;
    }

    fn csv(&mut self, sku: usize, quantity: i64, amount: i64) {
        self.sale(sku, 0, quantity, amount);
        if sku == 0 {
            self.stock[sku] -= quantity;
        }
    }
}

#[derive(Clone)]
struct Import {
    id: i64,
    sku: usize,
    quantity: i32,
    amount: i32,
    bytes: Vec<u8>,
    active: bool,
}

struct World {
    // 接続を先にdropしてから一時directoryを消す（Windowsのopen-file制約にも従う）。
    conn: Option<DbConnection>,
    dir: tempfile::TempDir,
    model: Model,
    imports: Vec<Import>,
    receiving: Option<inventory_service::ReceivingCreateRequest>,
    trace: Vec<String>,
}

impl World {
    fn new() -> Self {
        let (dir, conn) = db::test_support::setup_test_db();
        for sku in 0..CODES.len() {
            create_test_product_with_jan(&conn, CODES[sku], JANS[sku], INITIAL[sku], sku == 0);
            inventory_repo::insert_movement(
                &conn,
                &NewMovement {
                    product_code: CODES[sku].into(),
                    movement_type: MovementType::Receiving,
                    quantity: INITIAL[sku],
                    stock_after: INITIAL[sku],
                    reference_type: None,
                    reference_id: None,
                    note: Some("合成初期在庫".into()),
                },
            )
            .unwrap();
        }
        Self {
            dir,
            conn: Some(conn),
            model: Model {
                stock: INITIAL,
                sales: [[(0, 0); 2]; 2],
            },
            imports: Vec::new(),
            receiving: None,
            trace: Vec::new(),
        }
    }

    fn conn(&self) -> &DbConnection {
        self.conn.as_ref().unwrap()
    }
    fn conn_mut(&mut self) -> &mut DbConnection {
        self.conn.as_mut().unwrap()
    }

    fn perform(&mut self, operation: Operation) {
        self.trace.push(format!("{operation:?}"));
        let key = format!("xfa-{}", self.trace.len());
        match operation {
            Operation::Receive => {
                let request = serde_json::from_value::<inventory_service::ReceivingCreateRequest>(json!({
                    "idempotency_key":key, "supplier_id":null, "receiving_date":DATE, "note":null,
                    "items":[{"product_code":CODES[0],"quantity":3,"cost_price":50}]
                })).unwrap();
                let result =
                    inventory_service::create_receiving(self.conn_mut(), request.clone()).unwrap();
                assert!(result.created);
                self.receiving = Some(request);
                self.model.stock[0] += 3;
            }
            Operation::ManualSale => {
                let request = serde_json::from_value(json!({
                    "idempotency_key":key, "sale_date":DATE, "reason":"other", "note":null,
                    "items":[{"product_code":CODES[0],"quantity":2,"amount":246}],
                    "confirmation_token":null
                }))
                .unwrap();
                let result =
                    inventory_service::create_manual_sale(self.conn_mut(), request).unwrap();
                assert!(result.created && !result.needs_confirmation);
                self.model.stock[0] -= 2;
                self.model.sale(0, 1, 2, 246);
            }
            Operation::Dispose => {
                let request = serde_json::from_value(json!({
                    "idempotency_key":key, "disposal_date":DATE,
                    "items":[{"product_code":CODES[0],"disposal_type":"disposal",
                        "quantity":1,"cost_price":50,"reason":"合成検証"}]
                }))
                .unwrap();
                assert!(
                    inventory_service::create_disposal(self.conn_mut(), request)
                        .unwrap()
                        .created
                );
                self.model.stock[0] -= 1;
            }
            Operation::Return | Operation::RegisterProcessedReturn => {
                let register_processed = matches!(operation, Operation::RegisterProcessedReturn);
                let request = serde_json::from_value(json!({
                    "idempotency_key":key, "return_type":"return", "return_date":DATE,
                    "register_processed":register_processed, "receipt_image_path":null, "note":null,
                    "items":[{"product_code":CODES[0],"direction":"in","quantity":1}]
                }))
                .unwrap();
                assert!(
                    inventory_service::create_return(self.conn_mut(), request)
                        .unwrap()
                        .created
                );
                if !register_processed {
                    self.model.stock[0] += 1;
                }
            }
            Operation::CsvSale => {
                self.import_new(0, 2, 198);
            }
            Operation::CsvReturn => {
                self.import_new(0, -1, -73);
            }
            Operation::CsvNoSync => {
                self.import_new(1, 2, 164);
            }
            Operation::Reopen => {
                drop(self.conn.take());
                self.conn = Some(
                    db::init_database(self.dir.path().join("test.db").to_str().unwrap()).unwrap(),
                );
            }
        }
    }

    fn import_new(&mut self, sku: usize, quantity: i32, amount: i32) -> usize {
        // 合成の商品名を変え、同日でも別hashのファイルを作る。oracleはparse結果を使わない。
        let label = format!("合成{}-{}", self.trace.len(), self.imports.len());
        let bytes = make_z004_bytes(DATE, &[(JANS[sku], &label, quantity, amount)]);
        self.commit_bytes(sku, quantity, amount, bytes)
    }

    fn commit_bytes(&mut self, sku: usize, quantity: i32, amount: i32, bytes: Vec<u8>) -> usize {
        let preview = parse_and_build_cache(self.conn(), bytes.clone(), "XFA-synthetic.csv");
        let confirmed = matches!(
            preview.preview_data.duplicate_check.status,
            DuplicateStatus::AdditionalImportConfirmationRequired
        );
        let result = commit_csv_import(
            self.conn_mut(),
            CommitRequest {
                additional_import_confirmed: confirmed,
                cached_data: build_cached(preview),
            },
        )
        .unwrap();
        self.model.csv(sku, i64::from(quantity), i64::from(amount));
        self.imports.push(Import {
            id: result.csv_import_id,
            sku,
            quantity,
            amount,
            bytes,
            active: true,
        });
        self.imports.len() - 1
    }

    fn rollback(&mut self, index: usize) {
        self.trace.push(format!("Rollback(import={index})"));
        let import = self.imports[index].clone();
        let result = rollback_csv_import(self.conn_mut(), import.id).unwrap();
        assert!(result.success);
        if import.active {
            self.model.csv(
                import.sku,
                -i64::from(import.quantity),
                -i64::from(import.amount),
            );
            self.imports[index].active = false;
        } else {
            assert_eq!(result.voided_sale_count, 0);
            assert_eq!(result.voided_movement_count, 0);
        }
    }

    fn repeat_import(&mut self, index: usize) {
        self.trace.push(format!("RepeatImport(import={index})"));
        let import = self.imports[index].clone();
        if self
            .imports
            .iter()
            .any(|entry| entry.active && entry.bytes == import.bytes)
        {
            let before = self.business_snapshot();
            let result = parse_and_validate(
                self.conn(),
                CsvParseAndValidateRequest {
                    file_bytes: import.bytes,
                    filename: "same-hash.csv".into(),
                },
            );
            assert!(matches!(result, Err(BizError::ImportError(_))));
            assert_eq!(before, self.business_snapshot(), "prefix={:?}", self.trace);
        } else {
            self.commit_bytes(import.sku, import.quantity, import.amount, import.bytes);
        }
    }

    fn repeat_receiving(&mut self, conflict: bool) {
        self.trace
            .push(format!("RepeatReceiving(conflict={conflict})"));
        let before = self.business_snapshot();
        let mut request = self.receiving.as_ref().unwrap().clone();
        if conflict {
            request.items[0].quantity += 1;
        }
        let result = inventory_service::create_receiving(self.conn_mut(), request);
        if conflict {
            assert!(matches!(result, Err(BizError::IdempotencyConflict(_))));
        } else {
            let result = result.unwrap();
            assert!(result.idempotent_replay && !result.created);
        }
        assert_eq!(before, self.business_snapshot(), "prefix={:?}", self.trace);
    }

    fn stock(&self, sku: usize) -> i64 {
        self.conn()
            .query_row(
                "SELECT stock_quantity FROM products WHERE product_code=?1",
                [CODES[sku]],
                |row| row.get(0),
            )
            .unwrap()
    }

    fn mismatch(&self) -> Option<String> {
        let stocks = [self.stock(0), self.stock(1)];
        let sums: Vec<i64> = CODES.iter().map(|code| {
            self.conn().query_row("SELECT COALESCE(SUM(quantity),0) FROM inventory_movements WHERE product_code=?1 AND is_voided=0", [code], |r| r.get(0)).unwrap()
        }).collect();
        let report = sales_service::get_daily_sales(self.conn(), DATE).unwrap();
        let mut sales = [[(0, 0); 2]; 2];
        for item in report.items {
            let Some(sku) = CODES.iter().position(|code| *code == item.product_code) else {
                return Some(format!("unexpected product {}", item.product_code));
            };
            let source = match item.source {
                sales_service::DailySaleSource::Auto => 0,
                sales_service::DailySaleSource::Manual => 1,
            };
            sales[sku][source].0 += item.quantity;
            sales[sku][source].1 += item.amount;
        }
        let expected_total = self
            .model
            .sales
            .iter()
            .flatten()
            .fold((0, 0), |sum, value| (sum.0 + value.0, sum.1 + value.1));
        let total = (report.grand_total.quantity, report.grand_total.amount);
        if stocks != self.model.stock
            || sums != self.model.stock
            || sales != self.model.sales
            || total != expected_total
        {
            Some(format!("expected={:?}; actual stock={stocks:?}, ledger={sums:?}, sales={sales:?}, total={total:?}", self.model))
        } else {
            None
        }
    }

    fn check(&self) {
        if let Some(error) = self.mismatch() {
            panic!("prefix={:?}\n{error}", self.trace);
        }
    }

    fn business_snapshot(&self) -> Vec<Vec<Vec<Value>>> {
        // 操作ログは拒否理由を記録してよい。業務データは全列比較し、件数だけにしない。
        [
            "products",
            "receiving_records",
            "receiving_items",
            "return_records",
            "return_items",
            "manual_sales",
            "manual_sale_items",
            "disposal_records",
            "disposal_items",
            "csv_imports",
            "csv_import_errors",
            "sale_records",
            "inventory_movements",
        ]
        .iter()
        .map(|table| {
            let mut stmt = self
                .conn()
                .prepare(&format!("SELECT * FROM {table} ORDER BY 1"))
                .unwrap();
            let width = stmt.column_count();
            stmt.query_map([], |row| (0..width).map(|col| row.get(col)).collect())
                .unwrap()
                .collect::<Result<Vec<_>, _>>()
                .unwrap()
        })
        .collect()
    }
}

#[test]
fn test_cross_feature_req201_req202_req203_req204_req401_model() {
    // REQ-201 / REQ-202 / REQ-203 / REQ-204 / REQ-401: XFA-D1,D3。
    let mut traces = 0;
    for first in OPERATIONS {
        for second in OPERATIONS {
            let mut world = World::new();
            world.check();
            for operation in [first, second, Operation::Receive, Operation::Reopen] {
                world.perform(operation);
                world.check();
            }
            world.repeat_receiving(false);
            world.check();
            world.repeat_receiving(true);
            world.check();
            world.trace.push("AdditionalSale".into());
            let sale = world.import_new(0, 3, 357);
            world.check();
            world.trace.push("AdditionalReturn".into());
            world.import_new(0, -2, -222);
            world.check();
            world.repeat_import(sale);
            world.check();
            world.rollback(sale);
            world.check();
            world.rollback(sale);
            world.check();
            world.repeat_import(sale);
            world.check();
            world.repeat_import(sale);
            world.check();
            world.rollback(sale);
            world.check();
            world.perform(Operation::Reopen);
            world.check();
            traces += 1;
        }
    }
    println!("XFA_NORMAL traces={traces}; model comparisons after every operation: PASS");
}

#[derive(Clone, Copy, Debug)]
enum Temporal {
    Start,
    Count,
    Move(Operation),
    PosSale,
    ImportPending,
    Complete,
}

fn temporal_trace(actions: &[Temporal]) -> Option<String> {
    let mut world = World::new();
    let mut physical = INITIAL[0];
    let mut pending = 0;
    let mut stocktake = None;
    let mut completed = false;
    for (index, action) in actions.iter().enumerate() {
        match action {
            Temporal::Start => {
                stocktake = Some(
                    stocktake_service::start_stocktake(world.conn_mut())
                        .unwrap()
                        .stocktake_id,
                );
            }
            Temporal::Count => {
                let id = world
                    .conn()
                    .query_row(
                        "SELECT id FROM stocktake_items WHERE stocktake_id=?1 AND product_code=?2",
                        (stocktake.unwrap(), CODES[0]),
                        |r| r.get(0),
                    )
                    .unwrap();
                stocktake_service::update_count(
                    world.conn(),
                    &stocktake_service::UpdateCountRequest {
                        stocktake_item_id: id,
                        actual_count: physical,
                    },
                )
                .unwrap();
            }
            Temporal::Move(operation) => {
                physical += match operation {
                    Operation::Receive => 3,
                    Operation::ManualSale => -2,
                    Operation::Dispose => -1,
                    Operation::Return => 1,
                    _ => panic!("not a physical-movement diagnostic action"),
                };
                world.perform(*operation);
            }
            Temporal::PosSale => {
                physical -= 2;
                pending += 2;
            }
            Temporal::ImportPending => {
                assert!(pending > 0, "fixture must contain an unimported sale");
                world.import_new(0, pending, pending * 99);
                pending = 0;
            }
            Temporal::Complete => {
                // 対象外のSKUはforce_fill。確定失敗を時点問題の再現として数えない。
                stocktake_service::complete_stocktake(
                    world.conn_mut(),
                    &stocktake_service::CompleteStocktakeRequest {
                        stocktake_id: stocktake.unwrap(),
                        force_fill: true,
                    },
                )
                .expect("fixture/BIZ completion error, not a temporal model mismatch");
                completed = true;
            }
        }
        // 未取込みがある間の差は許す。確定後、反映が揃った時点だけを物理oracleと比較。
        if completed && pending == 0 && world.stock(0) != physical {
            let internal = integrity_service::run_integrity_check(world.conn()).unwrap();
            return Some(format!("prefix={:?}; expected physical={physical}, actual stock={}, internal mismatches={}", &actions[..=index], world.stock(0), internal.mismatch_count));
        }
    }
    assert!(
        completed && pending == 0,
        "fixture must reach the comparison checkpoint"
    );
    None
}

#[test]
fn test_cross_feature_req205_controls() {
    // REQ-205 / REQ-401: XFA-D2。正しい順序まで診断がFAILにしない対照。
    use Temporal::*;
    for actions in [
        vec![Start, Count, Complete],
        vec![Start, Count, Move(Operation::ManualSale), Count, Complete],
        vec![Start, PosSale, Count, ImportPending, Complete],
        vec![Start, Count, PosSale, Complete, ImportPending],
    ] {
        assert!(temporal_trace(&actions).is_none(), "{actions:?}");
    }
}

#[test]
fn test_cross_feature_req205_model_detects_consistent_corruption() {
    // REQ-205 / REQ-904 / REQ-203: XFA-D1,D3。台帳も同時に誤らせる実mutation。
    let world = World::new();
    world.check();
    world
        .conn()
        .execute(
            "UPDATE products SET stock_quantity=stock_quantity+1 WHERE product_code=?1",
            [CODES[0]],
        )
        .unwrap();
    inventory_repo::insert_movement(
        world.conn(),
        &NewMovement {
            product_code: CODES[0].into(),
            movement_type: MovementType::Receiving,
            quantity: 1,
            stock_after: INITIAL[0] + 1,
            reference_type: None,
            reference_id: None,
            note: Some("合成mutation".into()),
        },
    )
    .unwrap();
    assert_eq!(
        integrity_service::run_integrity_check(world.conn())
            .unwrap()
            .mismatch_count,
        0
    );
    assert!(
        world.mismatch().is_some(),
        "independent model must reject coherent wrong data"
    );

    let mut world = World::new();
    world.perform(Operation::ManualSale);
    world.check();
    let before = sales_service::get_daily_sales(world.conn(), DATE).unwrap();
    world
        .conn()
        .execute(
            "UPDATE sale_records SET source='auto' WHERE source='manual'",
            [],
        )
        .unwrap();
    let after = sales_service::get_daily_sales(world.conn(), DATE).unwrap();
    assert_eq!(
        (before.grand_total.quantity, before.grand_total.amount),
        (after.grand_total.quantity, after.grand_total.amount)
    );
    assert!(
        world.mismatch().is_some(),
        "source mismatch must fail even when totals agree"
    );
}

#[test]
#[ignore = "XFA: explicit diagnostic; known stocktake temporal contract conflict"]
fn diagnostic_cross_feature_req205_count_then_movement() {
    // REQ-205 / REQ-201 / REQ-202 / REQ-203 / REQ-204 / REQ-401: XFA-D2,D4。
    // diagnostic_は既知FAILをREQ coverageへ計上しないための意図的な接頭辞。
    use Temporal::*;
    let mut failures = Vec::new();
    for operation in [
        Operation::Receive,
        Operation::ManualSale,
        Operation::Dispose,
        Operation::Return,
    ] {
        if let Some(failure) = temporal_trace(&[Start, Count, Move(operation), Complete]) {
            failures.push(failure);
        }
    }
    if let Some(failure) = temporal_trace(&[Start, Count, PosSale, ImportPending, Complete]) {
        failures.push(failure);
    }
    assert!(
        failures.is_empty(),
        "XFA_TEMPORAL_FAIL\n{}",
        failures.join("\n")
    );
}

#[test]
#[ignore = "XFA: explicit diagnostic; known stocktake temporal contract conflict"]
fn diagnostic_cross_feature_req205_req401_late_import() {
    // REQ-205 / REQ-401: XFA-D2,D4。現物で一度だけ起きた販売の遅い記録。
    use Temporal::*;
    let failure = temporal_trace(&[Start, PosSale, Count, Complete, ImportPending]);
    assert!(
        failure.is_none(),
        "XFA_LATE_IMPORT_FAIL: {}",
        failure.unwrap()
    );
}
