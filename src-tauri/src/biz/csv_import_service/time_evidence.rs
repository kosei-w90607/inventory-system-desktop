//! 資料の受領・精算の同一性・前後の分類（SPEC-STK-TIME-D2〜D4）
//!
//! 32-biz-csv-import-service.md「時点証拠契約（proposed）」。⑤ まで test だけが呼ぶ
//! （`csv_import_service/mod.rs` で `#[cfg(test)]`、D-109 (3)）。preview / commit への配線は ④。
//! 分類は時刻・精算日時を入力にせず、`source.id <= source_cursor` だけで Before を決める。

use crate::biz::BizError;
use crate::db::product_repo;
use crate::db::sales_repo::time_evidence::{
    self as sources, IdentityRejectionCode, NewPosImportSource,
};
use crate::db::stocktake_repo::time_evidence::{
    find_latest_effective_observation, ObservationKind,
};
use crate::db::{DbConnection, DbError};
use crate::io::z004_parser::ParseResult;
use rusqlite::Connection;

fn db_error(error: rusqlite::Error) -> BizError {
    BizError::DatabaseError(DbError::from(error))
}

/// 資料を受領し source ID を返す。構文と種別を検証した後（`ParseResult` がある）の短い独立 TX（ADR D2）。
/// 同じ hash は最初の ID を返す
/// caller は行数の上限の検査（`parse.rs:80`）の後に呼ぶ
pub(crate) fn receive_source(
    conn: &mut DbConnection,
    parsed: &ParseResult,
    received_at: &str,
) -> Result<i64, BizError> {
    let metadata = parsed.settlement_metadata.clone().unwrap_or_default();
    let tx = conn.transaction().map_err(db_error)?;
    let source = sources::upsert_pos_import_source(
        &tx,
        &NewPosImportSource {
            file_hash: parsed.file_hash.clone(),
            received_at: received_at.to_string(),
            settlement_date: parsed.settlement_date.clone(),
            machine_no: metadata.machine_no,
            report_kind: metadata.report_kind,
            settlement_no: metadata.settlement_no,
            settled_at: metadata.settled_at,
        },
    )?;
    tx.commit().map_err(db_error)?;
    Ok(source.id)
}

/// 精算の同一性の判定（書込みなし。caller の TX の中から `&tx` で呼べる）。
/// 同一精算の別 hash を先に、同日 active があるときの識別メタの欠けを次に見る（32 proposed の順）
pub(crate) fn inspect_settlement_identity(
    conn: &Connection,
    source_id: i64,
) -> Result<Option<IdentityRejectionCode>, BizError> {
    let source = sources::get_pos_import_source(conn, source_id)?
        .ok_or(BizError::DatabaseError(DbError::NotFound))?;

    // 衝突は 3 つの識別が揃うときだけ（NULL どうしは衝突にしない）。未取込み・取消済みの source も相手にする
    if let (Some(report_kind), Some(machine_no), Some(settlement_no)) = (
        &source.report_kind,
        &source.machine_no,
        &source.settlement_no,
    ) {
        if !sources::find_settlement_identity_candidates(
            conn,
            report_kind,
            machine_no,
            settlement_no,
            source.id,
        )?
        .is_empty()
        {
            return Ok(Some(IdentityRejectionCode::IdentityConflict));
        }
    }

    // 取込み対象自身の source の active import は比較先に入れない。
    // `source_id IS NULL OR source_id <> target` と同じ（`<>` だけだと source の無い旧 import が落ちる）
    let others: Vec<_> = sources::list_active_import_identities(conn, &source.settlement_date)?
        .into_iter()
        .filter(|active| active.source_id != Some(source.id))
        .collect();
    if others.is_empty() {
        return Ok(None);
    }
    let missing = source.machine_no.is_none()
        || source.settlement_no.is_none()
        || others
            .iter()
            .any(|active| active.machine_no.is_none() || active.settlement_no.is_none());
    Ok(missing.then_some(IdentityRejectionCode::MissingIdentity))
}

/// 拒否の証拠を自分で開いた TX で初回だけ保存する（業務 TX の rollback の後に呼ぶ）
pub(crate) fn record_identity_rejection_evidence(
    conn: &mut DbConnection,
    source_id: i64,
    code: IdentityRejectionCode,
    rejected_at: &str,
) -> Result<bool, BizError> {
    let tx = conn.transaction().map_err(db_error)?;
    let recorded = sources::record_identity_rejection(&tx, source_id, code, rejected_at)?;
    tx.commit().map_err(db_error)?;
    Ok(recorded)
}

/// `check_settlement_identity` 専用の error。wire の `source_identity_conflict` への変換は ④
#[derive(Debug)]
pub(crate) enum IdentityGuardError {
    Rejected(IdentityRejectionCode),
    Db(BizError),
}

/// 業務 TX → core → 拒否なら rollback → 証拠 → Err。rollback の失敗は証拠を書かずに Db
pub(crate) fn check_settlement_identity(
    conn: &mut DbConnection,
    source_id: i64,
    rejected_at: &str,
) -> Result<(), IdentityGuardError> {
    let tx = conn
        .transaction()
        .map_err(|e| IdentityGuardError::Db(db_error(e)))?;
    let Some(code) = inspect_settlement_identity(&tx, source_id).map_err(IdentityGuardError::Db)?
    else {
        return tx.commit().map_err(|e| IdentityGuardError::Db(db_error(e)));
    };
    tx.rollback()
        .map_err(|e| IdentityGuardError::Db(db_error(e)))?;
    record_identity_rejection_evidence(conn, source_id, code, rejected_at)
        .map_err(IdentityGuardError::Db)?;
    Err(IdentityGuardError::Rejected(code))
}

/// 在庫判定の 1 行。candidates は (product_code, pos_stock_sync) の全候補
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct StockEvidenceRow {
    pub line_no: usize,
    pub normalized_jan: String,
    pub quantity: i32,
    pub amount: i32,
    pub candidates: Vec<(String, bool)>,
}

/// 正常 JAN の全行（0/0 行を含む）を全候補付きで集める。候補 0 件の行は入れない
/// （未登録は既存の preview の規則のまま）。売上の行の集合（parse.rs の 0/0 除外）は変えない
pub(crate) fn collect_stock_evidence_rows(
    conn: &Connection,
    parsed: &ParseResult,
) -> Result<Vec<StockEvidenceRow>, BizError> {
    let mut rows = Vec::new();
    for row in &parsed.parsed_rows {
        let candidates: Vec<(String, bool)> =
            product_repo::find_by_jan_code(conn, &row.normalized_jan)?
                .into_iter()
                .map(|product| (product.product_code, product.pos_stock_sync))
                .collect();
        if candidates.is_empty() {
            continue;
        }
        rows.push(StockEvidenceRow {
            line_no: row.line_no,
            normalized_jan: row.normalized_jan.clone(),
            quantity: row.quantity,
            amount: row.amount,
            candidates,
        });
    }
    Ok(rows)
}

/// 判定不能の理由。OffsetCheckRequired は 0/0 行の「相殺の判定が要る」印で flag の理由ではない（判定は ④）
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum UnknownReason {
    SaleOrderUnknown,
    OffsetLinesPresent,
    LegacyBasis,
    OffsetCheckRequired,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum StockEffect {
    SalesOnly,
    Before,
    After,
    Unknown(UnknownReason),
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct RowDecision {
    pub line_no: usize,
    pub product_code: String,
    pub effect: StockEffect,
}

#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) enum StockClassification {
    Committable(Vec<RowDecision>),
    /// 共有 JAN の行で全在庫連動候補の実測前を証明できない。file 全体を保留する
    Held {
        line_nos: Vec<usize>,
    },
}

/// 1 商品の在庫連動の分類（ADR D4 の判定表）
fn classify_product(
    conn: &Connection,
    source_id: i64,
    product_code: &str,
    row: &StockEvidenceRow,
) -> Result<StockEffect, BizError> {
    Ok(
        match find_latest_effective_observation(conn, product_code)?.map(|o| o.kind) {
            None => StockEffect::After,
            Some(ObservationKind::Legacy) => StockEffect::Unknown(UnknownReason::LegacyBasis),
            Some(ObservationKind::Measured { source_cursor, .. }) if source_id <= source_cursor => {
                StockEffect::Before
            }
            Some(ObservationKind::Measured { .. }) => StockEffect::Unknown(match row {
                r if r.quantity != 0 => UnknownReason::SaleOrderUnknown,
                r if r.amount != 0 => UnknownReason::OffsetLinesPresent,
                _ => UnknownReason::OffsetCheckRequired,
            }),
        },
    )
}

/// 前後の分類（32 proposed「一つの分類関数とcommit」の 2〜5）。時刻・精算日時を引数に持たない
pub(crate) fn classify_stock_rows(
    conn: &Connection,
    source_id: i64,
    rows: &[StockEvidenceRow],
) -> Result<StockClassification, BizError> {
    let mut decisions = Vec::new();
    let mut held = Vec::new();
    for row in rows {
        let shared = row.candidates.len() > 1;
        let mut row_decisions = Vec::new();
        for (product_code, pos_stock_sync) in &row.candidates {
            let effect = if *pos_stock_sync {
                classify_product(conn, source_id, product_code, row)?
            } else {
                StockEffect::SalesOnly
            };
            row_decisions.push(RowDecision {
                line_no: row.line_no,
                product_code: product_code.clone(),
                effect,
            });
        }
        // 共有 JAN は全在庫連動候補が Before のときだけ commit 可（非連動との共有を含む）
        if shared
            && row_decisions
                .iter()
                .any(|d| !matches!(d.effect, StockEffect::Before | StockEffect::SalesOnly))
        {
            held.push(row.line_no);
        }
        decisions.extend(row_decisions);
    }
    Ok(if held.is_empty() {
        StockClassification::Committable(decisions)
    } else {
        StockClassification::Held { line_nos: held }
    })
}
