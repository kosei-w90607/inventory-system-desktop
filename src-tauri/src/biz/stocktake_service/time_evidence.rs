//! 新方式の棚卸し: 開始・計数 context・保存・確定（SPEC-STK-TIME-D1 / D4 / D7 / D8、D1-R1）
//!
//! 35-biz-stocktake-service.md「時点証拠契約（proposed）」。⑤ まで test だけが呼ぶ
//! （`stocktake_service.rs` で `#[cfg(test)]`、D-109 (3)）。TX の外の操作ログ・整合性検査と、
//! token の保管・DB 世代の採番は ⑤ の公開の入口（CMD）が持つ。時刻は引数で受ける。

use super::{
    price_basis_quantity, valuation_line_centi, valuation_total_yen, StartStocktakeResult,
};
use crate::biz::BizError;
use crate::db::inventory_repo::time_evidence::{
    bump_stock_revision, insert_stocktake_movement, max_movement_id,
    update_stock_quantity_with_revision,
};
use crate::db::inventory_repo::{MovementType, NewMovement, ReferenceType};
use crate::db::product_repo::{self, ProductStockUnit, ProductWithRelations};
use crate::db::sales_repo::time_evidence::max_pos_import_source_id;
use crate::db::stocktake_repo::time_evidence::{self as repo, MeasuredEvidence};
use crate::db::stocktake_repo::{self, update_stocktake_item_valuation};
use crate::db::{DbConnection, DbError};

/// JavaScript の安全な整数の上限（2^53 - 1）
const MAX_SAFE_INTEGER: i64 = 9_007_199_254_740_991;

const MSG_TARGET_CHANGED: &str = "数える対象の棚卸しが変わりました。表示し直してから数えてください";
const MSG_CHECK_LATEST: &str = "最新の記録を確認してください";
const MSG_RECORD_CHANGED: &str = "数えている間に記録が変わりました。もう一度数えてください";
const MSG_RECOUNT_FLAGS: &str = "取り込んだ後に数の再確認が必要です";
const MSG_RECOUNT_LEGACY: &str = "更新前の記録です。今の数を確認してください";

// ---------------------------------------------------------------------------
// 型（⑤ で wire の型へ移す）
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CountPurpose {
    InProgress,
    IndependentRecount,
}

#[derive(Debug, Clone, Copy)]
pub(crate) struct BeginCountRequest {
    pub stocktake_item_id: i64,
    pub purpose: CountPurpose,
}

/// BIZ が作り CMD が保管する計数 context（UI へは token だけを返す）
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct CountContext {
    pub count_token: String,
    pub purpose: CountPurpose,
    pub stocktake_item_id: i64,
    pub stocktake_id: i64,
    pub product_code: String,
    pub count_started_at: String,
    pub stock_revision: i64,
    pub source_cursor: i64,
    pub db_generation: u64,
}

/// 42 proposed の開始応答と同じ項目
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct BeginCountResult {
    pub count_token: String,
    pub stocktake_item_id: i64,
    pub product_code: String,
    pub product_name: String,
    pub stock_unit: ProductStockUnit,
    pub book_at_start: i64,
    pub purpose: CountPurpose,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum CountSaveStatus {
    Saved,
    Replayed,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct CountSaveResult {
    pub status: CountSaveStatus,
    pub stocktake_item_id: i64,
    pub recount_id: Option<i64>,
    pub system_stock: i64,
    pub actual_count: i64,
    /// L − N
    pub difference: i64,
    pub stock_after: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct CompletionCorrection {
    pub product_code: String,
    pub system_stock: i64,
    pub actual_count: i64,
    /// N − L（0 以外だけ）
    pub adjustment: i64,
    pub stock_after: i64,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct CompletionResult {
    pub total_cost: i64,
    pub corrections: Vec<CompletionCorrection>,
}

/// 40 proposed の 8 値のうち ③ が使う 3 つ（④ が足す）
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RecoveryCode {
    CountContextInvalid,
    CountTargetChanged,
    RecountRequired,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RecoveryAction {
    ActiveCount,
    IndependentRecount,
    NoCountTarget,
}

/// tracking の 5 理由。並びは 40 の順（derive の Ord で並べる）
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord)]
pub(crate) enum RecountReason {
    SaleOrderUnknown,
    OffsetLinesPresent,
    OffsetCheckPending,
    OffsetMappingChanged,
    LegacyBasis,
}

impl RecountReason {
    fn parse(value: &str) -> Result<Self, BizError> {
        Ok(match value {
            "sale_order_unknown" => Self::SaleOrderUnknown,
            "offset_lines_present" => Self::OffsetLinesPresent,
            "offset_check_pending" => Self::OffsetCheckPending,
            "offset_mapping_changed" => Self::OffsetMappingChanged,
            "legacy_basis" => Self::LegacyBasis,
            other => {
                return Err(BizError::DatabaseError(DbError::QueryFailed(format!(
                    "未知の再確認理由: {other}"
                ))))
            }
        })
    }
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct CountRecoveryTarget {
    pub product_code: String,
    pub product_name: String,
    pub stocktake_item_id: Option<i64>,
    pub stocktake_id: Option<i64>,
    pub action: RecoveryAction,
    pub recount_reasons: Vec<RecountReason>,
}

/// `csv_import_id`（legacy の取消の保留だけ Some）は ④ が足す
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct StocktakeRecovery {
    pub code: RecoveryCode,
    pub targets: Vec<CountRecoveryTarget>,
}

/// 40 proposed の `BizError::StocktakeGuard` を ⑤ まで BizError の外に置く
#[derive(Debug)]
pub(crate) enum CountError {
    Guard {
        message: String,
        recovery: StocktakeRecovery,
    },
    Biz(BizError),
}

impl From<BizError> for CountError {
    fn from(error: BizError) -> Self {
        Self::Biz(error)
    }
}

impl From<DbError> for CountError {
    fn from(error: DbError) -> Self {
        Self::Biz(BizError::DatabaseError(error))
    }
}

impl From<rusqlite::Error> for CountError {
    fn from(error: rusqlite::Error) -> Self {
        Self::Biz(BizError::DatabaseError(DbError::from(error)))
    }
}

fn guard(code: RecoveryCode, message: &str, targets: Vec<CountRecoveryTarget>) -> CountError {
    CountError::Guard {
        message: message.to_string(),
        recovery: StocktakeRecovery { code, targets },
    }
}

fn find_product(conn: &DbConnection, product_code: &str) -> Result<ProductWithRelations, BizError> {
    product_repo::find_by_product_code(conn, product_code)?
        .ok_or_else(|| BizError::NotFound(format!("商品が見つかりません: {product_code}")))
}

/// 商品の回復先 1 件（R1: active 明細 → 最新の完了済み明細 → no_count_target）
fn recovery_target(
    conn: &DbConnection,
    product_code: &str,
) -> Result<CountRecoveryTarget, BizError> {
    let product = find_product(conn, product_code)?;
    let (item, stocktake, action) = match repo::find_recovery_item(conn, product_code)? {
        Some((item, stocktake, true)) => (Some(item), Some(stocktake), RecoveryAction::ActiveCount),
        Some((item, stocktake, false)) => (
            Some(item),
            Some(stocktake),
            RecoveryAction::IndependentRecount,
        ),
        None => (None, None, RecoveryAction::NoCountTarget),
    };
    Ok(CountRecoveryTarget {
        product_code: product_code.to_string(),
        product_name: product.product.name,
        stocktake_item_id: item,
        stocktake_id: stocktake,
        action,
        recount_reasons: Vec::new(),
    })
}

fn guard_for(
    conn: &DbConnection,
    code: RecoveryCode,
    message: &str,
    product_code: &str,
) -> CountError {
    match recovery_target(conn, product_code) {
        Ok(target) => guard(code, message, vec![target]),
        Err(error) => error.into(),
    }
}

/// 用途と所有者が合うか（begin と save の 4 で同じ規則）
fn owner_matches(
    conn: &DbConnection,
    purpose: CountPurpose,
    target: &repo::CountTarget,
) -> Result<bool, BizError> {
    let active_parent = target.parent_status == "in_progress";
    Ok(match purpose {
        CountPurpose::InProgress => active_parent,
        // 同じ商品に active 明細があれば独立再実測しない（その明細へ案内する）
        CountPurpose::IndependentRecount => {
            !active_parent
                && !matches!(
                    repo::find_recovery_item(conn, &target.product_code)?,
                    Some((_, _, true))
                )
        }
    })
}

/// 差異・補正量・補正後の在庫は JavaScript の安全な整数（±2^53-1）に収める（ADR D8）。i64 の overflow（None）も同じ拒否
fn safe(value: Option<i64>) -> Result<i64, BizError> {
    value
        .filter(|v| (-MAX_SAFE_INTEGER..=MAX_SAFE_INTEGER).contains(v))
        .ok_or_else(|| {
            BizError::ValidationFailed(
                "差異・補正量・補正後の在庫が扱える範囲を超えます".to_string(),
            )
        })
}

/// 利用者へ返す数（ID・在庫・N・L・差異・補正量・総額）は全て `safe` の範囲に収める
fn safe_all(values: &[i64]) -> Result<(), BizError> {
    values.iter().try_for_each(|v| safe(Some(*v)).map(drop))
}

/// 保存・再送の結果の全ての数を検査する（保存は commit の前に呼び、範囲外は TX ごと戻す）
fn checked_save_result(result: CountSaveResult) -> Result<CountSaveResult, BizError> {
    safe_all(&[
        result.stocktake_item_id,
        result.recount_id.unwrap_or(0),
        result.system_stock,
        result.actual_count,
        result.difference,
        result.stock_after,
    ])?;
    Ok(result)
}

// ---------------------------------------------------------------------------
// 開始
// ---------------------------------------------------------------------------

/// 新方式の開始（35 proposed「新方式の開始と明細のkind」）。1 TX
pub(crate) fn start_stocktake(
    conn: &mut DbConnection,
    started_at: &str,
) -> Result<StartStocktakeResult, BizError> {
    let tx = conn
        .transaction()
        .map_err(|e| BizError::DatabaseError(DbError::from(e)))?;
    if let Some(existing) = stocktake_repo::find_active_stocktake(&tx)? {
        return Err(BizError::StocktakeInProgress(format!(
            "進行中の棚卸しがあります（ID: {}、開始日: {}）。完了してから新しい棚卸しを開始してください",
            existing.id, existing.started_at
        )));
    }
    let products = stocktake_repo::find_stocktake_eligible_products(&tx)?;
    if products.is_empty() {
        return Err(BizError::ValidationFailed(
            "棚卸し対象の商品がありません".to_string(),
        ));
    }
    let stocktake_id = repo::insert_stocktake_v1(&tx, started_at)?;
    let mut auto_filled_count = 0usize;
    for product in &products {
        if product.is_discontinued && product.stock_quantity == 0 {
            repo::insert_item_with_kind(
                &tx,
                stocktake_id,
                &product.product_code,
                0,
                Some(0),
                "auto_filled",
            )?;
            auto_filled_count += 1;
        } else {
            repo::insert_item_with_kind(
                &tx,
                stocktake_id,
                &product.product_code,
                product.stock_quantity,
                None,
                "uncounted",
            )?;
        }
    }
    tx.commit()
        .map_err(|e| BizError::DatabaseError(DbError::from(e)))?;
    Ok(StartStocktakeResult {
        stocktake_id,
        item_count: products.len(),
        auto_filled_count,
    })
}

// ---------------------------------------------------------------------------
// begin（35 proposed「beginとsaveの処理」1〜2。DB を書かない）
// ---------------------------------------------------------------------------

pub(crate) fn begin_stocktake_count(
    conn: &mut DbConnection,
    req: &BeginCountRequest,
    db_generation: u64,
    started_at: &str,
) -> Result<(BeginCountResult, CountContext), CountError> {
    // 読取りの TX（同じ snapshot）。書かないので commit せず drop で閉じる
    let tx = conn.transaction()?;
    let target = repo::find_count_target(&tx, req.stocktake_item_id)?.ok_or_else(|| {
        BizError::NotFound(format!(
            "棚卸し明細が見つかりません: ID {}",
            req.stocktake_item_id
        ))
    })?;
    if !owner_matches(&tx, req.purpose, &target)? {
        return Err(guard_for(
            &tx,
            RecoveryCode::CountTargetChanged,
            MSG_TARGET_CHANGED,
            &target.product_code,
        ));
    }
    let product = find_product(&tx, &target.product_code)?;
    let source_cursor = max_pos_import_source_id(&tx)?;
    let count_token = uuid::Uuid::new_v4().to_string();
    let context = CountContext {
        count_token: count_token.clone(),
        purpose: req.purpose,
        stocktake_item_id: target.item_id,
        stocktake_id: target.stocktake_id,
        product_code: target.product_code.clone(),
        count_started_at: started_at.to_string(),
        stock_revision: target.stock_revision,
        source_cursor,
        db_generation,
    };
    safe_all(&[target.item_id, target.stock_quantity])?;
    let result = BeginCountResult {
        count_token,
        stocktake_item_id: target.item_id,
        product_code: target.product_code,
        product_name: product.product.name,
        stock_unit: product.product.stock_unit,
        book_at_start: target.stock_quantity,
        purpose: req.purpose,
    };
    Ok((result, context))
}

// ---------------------------------------------------------------------------
// save（35 proposed 3〜8、SPEC-STK-TIME-D1-R1）
// ---------------------------------------------------------------------------

pub(crate) fn save_stocktake_count(
    conn: &mut DbConnection,
    count_token: &str,
    actual_count: i64,
    context: Option<&CountContext>,
    db_generation: u64,
    counted_at: &str,
) -> Result<CountSaveResult, CountError> {
    // 1. 保存済み要求の照会を context の検査より先に（再起動後の再送も Replayed）
    if let Some(saved) = repo::find_saved_request(conn, count_token)? {
        if saved.actual_count != actual_count {
            return Err(BizError::IdempotencyConflict(
                "同じ保存要求で違う数が送られました".to_string(),
            )
            .into());
        }
        return Ok(checked_save_result(CountSaveResult {
            status: CountSaveStatus::Replayed,
            stocktake_item_id: saved.item_id,
            recount_id: saved.recount_id,
            system_stock: saved.system_stock,
            actual_count: saved.actual_count,
            difference: safe(saved.system_stock.checked_sub(saved.actual_count))?,
            stock_after: if saved.recount_id.is_some() {
                saved.actual_count
            } else {
                saved.stock_quantity
            },
        })?);
    }

    // 2. context・token・DB 世代
    let Some(ctx) = context else {
        return Err(guard(
            RecoveryCode::CountContextInvalid,
            MSG_CHECK_LATEST,
            Vec::new(),
        ));
    };
    if ctx.count_token != count_token || ctx.db_generation != db_generation {
        return Err(guard_for(
            conn,
            RecoveryCode::CountContextInvalid,
            MSG_CHECK_LATEST,
            &ctx.product_code,
        ));
    }

    // 3. N の範囲
    if !(0..=MAX_SAFE_INTEGER).contains(&actual_count) {
        return Err(BizError::ValidationFailed(format!(
            "カウント数は0以上{MAX_SAFE_INTEGER}以下で入力してください"
        ))
        .into());
    }

    // 4. 業務 TX で所有者 → 置き換わった古い要求 → 版（どれも書込み 0）
    let tx = conn.transaction()?;
    let target = repo::find_count_target(&tx, ctx.stocktake_item_id)?.ok_or_else(|| {
        BizError::NotFound(format!(
            "棚卸し明細が見つかりません: ID {}",
            ctx.stocktake_item_id
        ))
    })?;
    if target.stocktake_id != ctx.stocktake_id
        || target.product_code != ctx.product_code
        || !owner_matches(&tx, ctx.purpose, &target)?
    {
        return Err(guard_for(
            &tx,
            RecoveryCode::CountTargetChanged,
            MSG_TARGET_CHANGED,
            &ctx.product_code,
        ));
    }
    // 進行中の明細が、この context の begin より後に別の要求で保存されている（ADR D8 の置き換わった古い要求）。
    // begin の後の保存の版は context の版より大きい。begin より前の保存を数え直すのは通常の保存
    let superseded = ctx.purpose == CountPurpose::InProgress
        && target.kind == "measured"
        && target.request_id.as_deref() != Some(count_token)
        && target
            .observation_revision
            .is_some_and(|revision| revision > ctx.stock_revision);
    if superseded {
        return Err(guard_for(
            &tx,
            RecoveryCode::CountContextInvalid,
            MSG_CHECK_LATEST,
            &ctx.product_code,
        ));
    }
    if target.stock_revision != ctx.stock_revision {
        return Err(guard_for(
            &tx,
            RecoveryCode::CountContextInvalid,
            MSG_RECORD_CHANGED,
            &ctx.product_code,
        ));
    }

    // 5. L と ledger の上限（補正の INSERT より前）
    let system_stock = target.stock_quantity;
    let ledger_cursor = max_movement_id(&tx, &ctx.product_code)?;
    let adjustment = safe(actual_count.checked_sub(system_stock))?;
    let difference = safe(system_stock.checked_sub(actual_count))?;
    let evidence = |observation_revision| MeasuredEvidence {
        actual_count,
        system_stock,
        count_started_at: &ctx.count_started_at,
        counted_at,
        ledger_cursor,
        source_cursor: ctx.source_cursor,
        observation_revision,
        request_id: count_token,
    };

    let (recount_id, stock_after) = match ctx.purpose {
        // 6. 進行中: flag → 版 → 明細（在庫は変えない）
        CountPurpose::InProgress => {
            repo::delete_resolved_flags(&tx, &ctx.product_code, ctx.source_cursor)?;
            let revision = bump_stock_revision(&tx, &ctx.product_code)?;
            if repo::save_measured_item(&tx, target.item_id, &evidence(revision))? == 0 {
                return Err(guard_for(
                    &tx,
                    RecoveryCode::CountTargetChanged,
                    MSG_TARGET_CHANGED,
                    &ctx.product_code,
                ));
            }
            (None, system_stock)
        }
        // 7. 独立再実測: 補正 → flag → 版 → recount → movement（確定済みの header・明細は変えない）
        CountPurpose::IndependentRecount => {
            if adjustment != 0 {
                update_stock_quantity_with_revision(&tx, &ctx.product_code, actual_count)?;
            }
            repo::delete_resolved_flags(&tx, &ctx.product_code, ctx.source_cursor)?;
            let revision = bump_stock_revision(&tx, &ctx.product_code)?;
            let recount_id = repo::insert_recount(&tx, target.item_id, &evidence(revision))?;
            if adjustment != 0 {
                insert_stocktake_movement(
                    &tx,
                    &NewMovement {
                        product_code: ctx.product_code.clone(),
                        movement_type: MovementType::Stocktake,
                        quantity: adjustment,
                        stock_after: actual_count,
                        reference_type: Some(ReferenceType::Stocktake),
                        reference_id: Some(target.stocktake_id),
                        note: Some(format!(
                            "棚卸しの再実測: 帳簿{system_stock} → 実数{actual_count}"
                        )),
                    },
                    "recount",
                    Some(recount_id),
                )?;
            }
            (Some(recount_id), actual_count)
        }
    };

    // 8. 返す数を検査してから commit（L が範囲外なら差異が安全でもここで TX ごと戻す）
    let result = checked_save_result(CountSaveResult {
        status: CountSaveStatus::Saved,
        stocktake_item_id: target.item_id,
        recount_id,
        system_stock,
        actual_count,
        difference,
        stock_after,
    })?;
    tx.commit()?;
    Ok(result)
}

// ---------------------------------------------------------------------------
// 確定（35 proposed「確定・legacyの取消の保留」）
// ---------------------------------------------------------------------------

pub(crate) fn complete_stocktake(
    conn: &mut DbConnection,
    stocktake_id: i64,
    force_fill: bool,
    completed_at: &str,
) -> Result<CompletionResult, CountError> {
    // 1. header
    let tx = conn.transaction()?;
    let header = stocktake_repo::find_stocktake_by_id(&tx, stocktake_id)?
        .ok_or_else(|| BizError::NotFound(format!("棚卸しが見つかりません: ID {stocktake_id}")))?;
    if header.status != "in_progress" {
        return Err(
            BizError::StocktakeNotInProgress("この棚卸しは既に完了しています".to_string()).into(),
        );
    }

    // 2. 未解消の flag・確定対象の棚卸しの legacy は force_fill によらず拒否
    let items = repo::list_items_for_completion(&tx, stocktake_id)?;
    let flags = repo::list_unresolved_flags(&tx, stocktake_id)?;
    let mut targets = Vec::new();
    for item in &items {
        let mut reasons = flags
            .iter()
            .filter(|(id, _)| *id == item.id)
            .map(|(_, reason)| RecountReason::parse(reason))
            .collect::<Result<Vec<_>, _>>()?;
        if reasons.is_empty() && item.kind != "legacy" {
            continue;
        }
        reasons.sort();
        reasons.dedup();
        targets.push(CountRecoveryTarget {
            product_code: item.product_code.clone(),
            product_name: item.product_name.clone(),
            stocktake_item_id: Some(item.id),
            stocktake_id: Some(stocktake_id),
            action: RecoveryAction::ActiveCount,
            recount_reasons: reasons,
        });
    }
    if !targets.is_empty() {
        let message = if flags.is_empty() {
            MSG_RECOUNT_LEGACY
        } else {
            MSG_RECOUNT_FLAGS
        };
        return Err(guard(RecoveryCode::RecountRequired, message, targets));
    }

    // 3. 未計数
    let uncounted = items.iter().filter(|i| i.kind == "uncounted").count();
    if uncounted > 0 && !force_fill {
        return Err(BizError::ValidationFailed(format!(
            "未入力の商品が{uncounted}件あります。全商品のカウントを完了するか、force_fill=true で未入力をシステム在庫と同じとみなしてください"
        ))
        .into());
    }

    // 4. 明細ごとの補正・版・評価（商品ごとに commit しない）
    let mut line_centis: Vec<i128> = Vec::with_capacity(items.len());
    let mut corrections = Vec::new();
    for item in &items {
        let product = find_product(&tx, &item.product_code)?.product;
        let current = product.stock_quantity;
        let stock_after = match item.kind.as_str() {
            "measured" => {
                let n = item.actual_count.ok_or_else(|| {
                    DbError::QueryFailed(format!("measured の明細 {} に数量がありません", item.id))
                })?;
                safe_all(&[item.system_stock, n])?;
                let adjustment = safe(n.checked_sub(item.system_stock))?;
                let after = safe(current.checked_add(adjustment))?;
                if adjustment != 0 {
                    update_stock_quantity_with_revision(&tx, &item.product_code, after)?;
                    insert_stocktake_movement(
                        &tx,
                        &NewMovement {
                            product_code: item.product_code.clone(),
                            movement_type: MovementType::Stocktake,
                            quantity: adjustment,
                            stock_after: after,
                            reference_type: Some(ReferenceType::Stocktake),
                            reference_id: Some(stocktake_id),
                            note: Some(format!(
                                "棚卸し補正: 実数{n} − 保存時の帳簿{}",
                                item.system_stock
                            )),
                        },
                        "completion",
                        None,
                    )?;
                    corrections.push(CompletionCorrection {
                        product_code: item.product_code.clone(),
                        system_stock: item.system_stock,
                        actual_count: n,
                        adjustment,
                        stock_after: after,
                    });
                }
                after
            }
            "uncounted" => {
                // force_fill: N=L=max(現在の在庫,0)。負の在庫を 0 へ書き換えない
                repo::fill_uncounted_item(&tx, item.id, current.max(0))?;
                current
            }
            "auto_filled" => current,
            other => {
                return Err(DbError::QueryFailed(format!(
                    "確定できない明細の kind: {other}（明細 {}）",
                    item.id
                ))
                .into())
            }
        };
        safe(Some(stock_after))?;
        // 差 0 の商品も版を進めて古い context を失効させる
        bump_stock_revision(&tx, &item.product_code)?;
        update_stocktake_item_valuation(&tx, item.id, product.cost_price)?;
        line_centis.push(valuation_line_centi(
            product.cost_price,
            stock_after.max(0),
            price_basis_quantity(product.stock_unit),
            &item.product_code,
        )?);
    }

    // 5. header を completed・版 1 に
    let total_cost = safe(Some(valuation_total_yen(&line_centis)?))?;
    repo::complete_stocktake_v1(&tx, stocktake_id, total_cost, completed_at)?;
    tx.commit()?;
    Ok(CompletionResult {
        total_cost,
        corrections,
    })
}
