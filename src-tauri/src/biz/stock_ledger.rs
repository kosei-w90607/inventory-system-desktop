//! BIZ-02: 在庫数の求め直し（記録が正、`products.stock_quantity` ほかは写し）
//!
//! docs/function-design/31-biz-inventory-service.md「計数の置き場と在庫の求め直しの契約」と
//! ADR SPEC-STK-CNT-D2・D3 に基づく実装。D-118 の runtime の (a) は、計数・入出庫・初期在庫の窓
//! （判定表の「入出庫の movement」「初期在庫の movement」の行と「計数どうし」、要再確認の理由 2・3）を持つ。
//! 「精算 k」の行と理由 1 は (b) で足す。それまで `phase = 1` の movement は誤りで止まる。

use crate::biz::inventory_service::check_stock_range;
use crate::biz::BizError;
use crate::db::inventory_repo::{self, LedgerMovementRow, StockCountRow};
use crate::db::{DbConnection, DbError};

/// 要再確認の理由（ADR D3。(b) が `UndeterminedSettlement` を足す）
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub(crate) enum RecheckReason {
    /// 理由 2: 効く計数にとって決まらない入出庫の movement がある
    SameDateMovement,
    /// 理由 3: 効く計数の候補が重なり、値が違う
    ConflictingCounts,
}

/// 記録から求め直した在庫（写しの値・要再確認のときの最小と最大・理由）
#[derive(Debug, Clone, PartialEq, Eq)]
pub(crate) struct DerivedStock {
    pub stock: i64,
    pub range: Option<(i64, i64)>,
    pub recheck_reasons: Vec<RecheckReason>,
}

fn overflow() -> BizError {
    BizError::ValidationFailed("在庫数計算オーバーフロー".to_string())
}

fn add(a: i64, b: i64) -> Result<i64, BizError> {
    a.checked_add(b).ok_or_else(overflow)
}

/// 計数 `a` の窓が `b` の窓より完全に後か（ADR D3 の「計数どうし」）
fn is_after(a: &StockCountRow, b: &StockCountRow) -> bool {
    match (a.fresh, b.fresh) {
        // fresh はそれより先に保存された全ての計数より後。後に保存された fresh には負ける
        (true, true) => a.id > b.id,
        // fresh の後に保存された既定の計数（日付 D、fresh の今日 T）: D < T なら fresh が後
        (true, false) => b.id < a.id || b.business_date < a.business_date,
        (false, true) => b.id < a.id && a.business_date > b.business_date,
        // 既定どうしは日付で決め、同じ日付は重なる
        (false, false) => a.business_date > b.business_date,
    }
}

/// 計数 `count` に対する movement の判定（ADR D3 の判定表）
enum Window {
    Included,
    Undetermined,
    NotIncluded,
}

fn judge(count: &StockCountRow, movement: &LedgerMovementRow) -> Window {
    // 初期在庫は窓を持たない申告で、どの計数よりも前
    if movement.initial_stock {
        return Window::Included;
    }
    if count.fresh && movement.id <= count.seen_movement_id.unwrap_or(0) {
        return Window::Included;
    }
    match movement
        .business_date
        .as_str()
        .cmp(count.business_date.as_str())
    {
        std::cmp::Ordering::Less => Window::Included,
        std::cmp::Ordering::Equal => Window::Undetermined,
        std::cmp::Ordering::Greater => Window::NotIncluded,
    }
}

/// 1 つの計数を土台にした (写しの値, 最小, 最大, 決まらない記録があるか)
fn from_count(
    count: &StockCountRow,
    movements: &[LedgerMovementRow],
) -> Result<(i64, i64, i64, bool), BizError> {
    let mut base = count.count_value;
    let (mut positive, mut negative, mut undetermined) = (0_i64, 0_i64, false);
    for movement in movements {
        match judge(count, movement) {
            Window::Included => {}
            Window::NotIncluded => base = add(base, movement.quantity)?,
            Window::Undetermined => {
                undetermined = true;
                if movement.quantity >= 0 {
                    positive = add(positive, movement.quantity)?;
                } else {
                    negative = add(negative, movement.quantity)?;
                }
            }
        }
    }
    let low = add(base, negative)?;
    let high = add(base, positive)?;
    Ok((add(low, positive)?, low, high, undetermined))
}

fn derive(
    counts: &[StockCountRow],
    movements: &[LedgerMovementRow],
) -> Result<DerivedStock, BizError> {
    if movements.iter().any(|movement| movement.phase != 0) {
        return Err(BizError::DatabaseError(DbError::QueryFailed(
            "精算の記録の求め直しはまだ入っていません".to_string(),
        )));
    }
    // 効く計数: ほかのどの計数よりも前でない計数
    let mut effective: Vec<&StockCountRow> = counts
        .iter()
        .filter(|count| !counts.iter().any(|other| is_after(other, count)))
        .collect();
    if effective.is_empty() {
        let mut stock = 0_i64;
        for movement in movements {
            stock = add(stock, movement.quantity)?;
        }
        return Ok(DerivedStock {
            stock,
            range: None,
            recheck_reasons: Vec::new(),
        });
    }
    // 値の小さい順。同じ値なら fresh を先にする（重なる同値の代表、衝突の写しの土台）
    effective.sort_by_key(|count| (count.count_value, !count.fresh, count.id));
    let conflicting = effective
        .iter()
        .any(|count| count.count_value != effective[0].count_value);
    if !conflicting {
        effective.truncate(1);
    }
    let mut result: Option<(i64, i64, i64)> = None;
    let mut undetermined = false;
    for count in &effective {
        let (stock, low, high, has_undetermined) = from_count(count, movements)?;
        undetermined |= has_undetermined;
        result = Some(match result {
            None => (stock, low, high),
            Some((first, lo, hi)) => (first, lo.min(low), hi.max(high)),
        });
    }
    let (stock, low, high) = result.ok_or_else(overflow)?;
    let mut recheck_reasons = Vec::new();
    if undetermined {
        recheck_reasons.push(RecheckReason::SameDateMovement);
    }
    if conflicting {
        recheck_reasons.push(RecheckReason::ConflictingCounts);
    }
    Ok(DerivedStock {
        stock,
        range: (!recheck_reasons.is_empty()).then_some((low, high)),
        recheck_reasons,
    })
}

/// 記録から在庫を求める（読取りだけ。整合性の検査が使う。31）
pub(crate) fn derive_stock(
    conn: &DbConnection,
    product_code: &str,
) -> Result<DerivedStock, BizError> {
    let counts = inventory_repo::list_stock_counts_for_product(conn, product_code)?;
    let movements = inventory_repo::list_ledger_movements_for_product(conn, product_code)?;
    derive(&counts, &movements)
}

/// `derive_stock` と同じ規則で求め、写しの 4 項目を同じ TX で書く。
/// 上限の検査は書く直前のここだけ（求めた値と範囲の両端。Y2・Y3）。外れたら呼出し元の TX 全体が戻る
pub(crate) fn recompute_stock(
    tx: &rusqlite::Transaction<'_>,
    product_code: &str,
) -> Result<DerivedStock, BizError> {
    let derived = derive_stock(tx, product_code)?;
    check_stock_range(derived.stock)?;
    if let Some((low, high)) = derived.range {
        check_stock_range(low)?;
        check_stock_range(high)?;
    }
    if !inventory_repo::update_stock_quantity(tx, product_code, derived.stock, derived.range)? {
        return Err(BizError::NotFound(format!(
            "商品が見つかりません: {product_code}"
        )));
    }
    Ok(derived)
}

#[cfg(test)]
pub(crate) mod test_support {
    use crate::db::DbConnection;

    /// 計数を直に入れる（(a) には保存の経路が無い。test だけ）。fresh なら `seen` を持つ
    pub(crate) fn insert_count(
        conn: &DbConnection,
        product_code: &str,
        value: i64,
        date: &str,
        fresh_seen: Option<i64>,
    ) -> i64 {
        conn.execute(
            "INSERT INTO stock_counts (product_code, count_value, count_kind, business_date,
                 seen_movement_id, counted_at)
             VALUES (?1, ?2, ?3, ?4, ?5, '2026-04-01T10:00:00')",
            rusqlite::params![
                product_code,
                value,
                if fresh_seen.is_some() {
                    "fresh"
                } else {
                    "default"
                },
                date,
                fresh_seen
            ],
        )
        .unwrap();
        conn.last_insert_rowid()
    }
}

#[cfg(test)]
mod tests {
    use super::test_support::insert_count;
    use super::*;
    use crate::db::test_support::{seed_product, setup_test_db};

    const D: &str = "2026-05-10";

    /// 業務日 `date` の入出庫の movement（初期在庫なら reference_type NULL）を入れ、id を返す
    fn movement(conn: &DbConnection, code: &str, quantity: i64, date: &str) -> i64 {
        conn.execute(
            "INSERT INTO inventory_movements (product_code, movement_type, quantity, stock_after,
                 reference_type, reference_id, created_at, business_date, phase)
             VALUES (?1, 'receiving', ?2, 0, 'receiving_record', 1, '2026-05-20T10:00:00', ?3, 0)",
            rusqlite::params![code, quantity, date],
        )
        .unwrap();
        conn.last_insert_rowid()
    }

    fn initial(conn: &DbConnection, code: &str, quantity: i64, date: &str) {
        conn.execute(
            "INSERT INTO inventory_movements (product_code, movement_type, quantity, stock_after,
                 created_at, business_date, phase)
             VALUES (?1, 'receiving', ?2, ?2, '2026-05-20T10:00:00', ?3, 0)",
            rusqlite::params![code, quantity, date],
        )
        .unwrap();
    }

    fn derived(stock: i64, range: Option<(i64, i64)>, reasons: &[RecheckReason]) -> DerivedStock {
        DerivedStock {
            stock,
            range,
            recheck_reasons: reasons.to_vec(),
        }
    }

    fn copy_of(conn: &DbConnection, code: &str) -> (i64, bool, Option<i64>, Option<i64>) {
        conn.query_row(
            "SELECT stock_quantity, stock_recheck, stock_range_low, stock_range_high
             FROM products WHERE product_code = ?1",
            [code],
            |row| Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?)),
        )
        .unwrap()
    }

    #[test]
    fn test_stock_ledger_req201_no_counts_equals_sum_of_valid_movements() {
        // REQ-201 / SPEC-STK-CNT-D2（効く計数が無ければ全ての有効な movement の和）/ Matrix L1・T6
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L1");
        seed_product(&conn, "L1-EMPTY");
        initial(&conn, "L1", 6, "2026-05-01");
        movement(&conn, "L1", -2, "2026-05-02");
        movement(&conn, "L1", 9, "2026-05-03");
        let voided = movement(&conn, "L1", 40, "2026-05-04");
        conn.execute(
            "UPDATE inventory_movements SET is_voided = 1 WHERE id = ?1",
            [voided],
        )
        .unwrap();
        assert_eq!(derive_stock(&conn, "L1").unwrap(), derived(13, None, &[]));
        // movement なし → 0
        assert_eq!(
            derive_stock(&conn, "L1-EMPTY").unwrap(),
            derived(0, None, &[])
        );
    }

    #[test]
    fn test_stock_ledger_req205_default_count_vs_movement_dates() {
        // REQ-205 / SPEC-STK-CNT-D3（既定の計数 × 入出庫: E < D 入る、E = D 決まらない、E > D 入らない）/ Matrix L2
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L2");
        movement(&conn, "L2", 3, "2026-05-09");
        movement(&conn, "L2", -2, "2026-05-11");
        insert_count(&conn, "L2", 10, D, None);
        movement(&conn, "L2", 4, D);
        assert_eq!(
            derive_stock(&conn, "L2").unwrap(),
            derived(12, Some((8, 12)), &[RecheckReason::SameDateMovement])
        );
    }

    #[test]
    fn test_stock_ledger_req205_fresh_count_cursor_boundary() {
        // REQ-205 / SPEC-STK-CNT-D3（fresh の計数 × 入出庫: i ≤ m 入る、i > m は日付で）/ Matrix L3
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L3");
        // id m（カーソル）の movement は日付が T でも入る
        let m = movement(&conn, "L3", 5, D);
        insert_count(&conn, "L3", 20, D, Some(m));
        assert_eq!(derive_stock(&conn, "L3").unwrap(), derived(20, None, &[]));
        // id m+1 で業務日 T−1 は入る
        movement(&conn, "L3", 7, "2026-05-09");
        assert_eq!(derive_stock(&conn, "L3").unwrap(), derived(20, None, &[]));
        // 業務日 T+1 は入らない（足す）
        movement(&conn, "L3", -3, "2026-05-11");
        assert_eq!(derive_stock(&conn, "L3").unwrap(), derived(17, None, &[]));
        // id m+1 以降で業務日 T は決まらない（写しで足し、範囲を持つ）
        movement(&conn, "L3", 2, D);
        assert_eq!(
            derive_stock(&conn, "L3").unwrap(),
            derived(19, Some((17, 19)), &[RecheckReason::SameDateMovement])
        );

        // カーソル 0（movement の無い時点の fresh）: どの movement も日付で決まる
        seed_product(&conn, "L3-0");
        insert_count(&conn, "L3-0", 4, D, Some(0));
        movement(&conn, "L3-0", 1, "2026-05-09");
        assert_eq!(derive_stock(&conn, "L3-0").unwrap(), derived(4, None, &[]));
        movement(&conn, "L3-0", 6, D);
        assert_eq!(
            derive_stock(&conn, "L3-0").unwrap(),
            derived(10, Some((4, 10)), &[RecheckReason::SameDateMovement])
        );
    }

    #[test]
    fn test_stock_ledger_req205_initial_stock_always_included() {
        // REQ-205 / SPEC-STK-CNT-D3（初期在庫はどの計数にも入る）/ Matrix L4
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L4");
        insert_count(&conn, "L4", 3, D, None);
        insert_count(&conn, "L4", 3, "2026-05-09", Some(0));
        // 計数の日付より後に登録した初期在庫
        initial(&conn, "L4", 8, "2026-05-15");
        assert_eq!(derive_stock(&conn, "L4").unwrap(), derived(3, None, &[]));
        seed_product(&conn, "L4-F");
        insert_count(&conn, "L4-F", 2, D, Some(0));
        initial(&conn, "L4-F", 8, D);
        assert_eq!(derive_stock(&conn, "L4-F").unwrap(), derived(2, None, &[]));
    }

    #[test]
    fn test_stock_ledger_req205_later_default_count_wins() {
        // REQ-205 / SPEC-STK-CNT-D3（既定どうしは日付で決める）/ Matrix L5
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L5");
        // 後の日付の計数を先に保存しても、日付の後の計数が効く
        insert_count(&conn, "L5", 9, "2026-05-12", None);
        insert_count(&conn, "L5", 30, "2026-05-08", None);
        assert_eq!(derive_stock(&conn, "L5").unwrap(), derived(9, None, &[]));
    }

    #[test]
    fn test_stock_ledger_req205_fresh_replaces_earlier_counts() {
        // REQ-205 / SPEC-STK-CNT-D3（fresh はそれより先に保存された全ての計数より後）/ Matrix L6
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L6");
        insert_count(&conn, "L6", 12, D, None);
        insert_count(&conn, "L6", 12, "2026-05-11", None);
        insert_count(&conn, "L6", 5, D, Some(0));
        assert_eq!(derive_stock(&conn, "L6").unwrap(), derived(5, None, &[]));
        // fresh どうしは保存の順
        insert_count(&conn, "L6", 6, D, Some(0));
        assert_eq!(derive_stock(&conn, "L6").unwrap(), derived(6, None, &[]));
    }

    #[test]
    fn test_stock_ledger_req205_default_after_fresh_three_cases() {
        // REQ-205 / SPEC-STK-CNT-D3（fresh の後に保存した既定の計数: D < T / D = T / D > T）/ Matrix L7
        let (_dir, conn) = setup_test_db();
        // D < T: fresh が後で、既定は効かない
        seed_product(&conn, "L7-LT");
        insert_count(&conn, "L7-LT", 5, D, Some(0));
        insert_count(&conn, "L7-LT", 9, "2026-05-09", None);
        assert_eq!(derive_stock(&conn, "L7-LT").unwrap(), derived(5, None, &[]));
        // D > T: 既定が後
        seed_product(&conn, "L7-GT");
        insert_count(&conn, "L7-GT", 5, D, Some(0));
        insert_count(&conn, "L7-GT", 9, "2026-05-11", None);
        assert_eq!(derive_stock(&conn, "L7-GT").unwrap(), derived(9, None, &[]));
        // D = T: 重なる。値が違えば衝突
        seed_product(&conn, "L7-EQ");
        insert_count(&conn, "L7-EQ", 5, D, Some(0));
        insert_count(&conn, "L7-EQ", 9, D, None);
        assert_eq!(
            derive_stock(&conn, "L7-EQ").unwrap(),
            derived(5, Some((5, 9)), &[RecheckReason::ConflictingCounts])
        );
        // D = T で同値: fresh を代表にし、その窓とカーソルで判定する（カーソル以前の同じ日付の記録は入る）
        seed_product(&conn, "L7-SAME");
        let m = movement(&conn, "L7-SAME", 4, D);
        insert_count(&conn, "L7-SAME", 7, D, Some(m));
        insert_count(&conn, "L7-SAME", 7, D, None);
        assert_eq!(
            derive_stock(&conn, "L7-SAME").unwrap(),
            derived(7, None, &[])
        );
    }

    #[test]
    fn test_stock_ledger_req205_conflicting_counts_range_and_min_base() {
        // REQ-205 / SPEC-STK-CNT-D2・D3 の理由 3（衝突は各土台の範囲を合わせ、最小の値を写しの土台）/ Matrix L8
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L8");
        insert_count(&conn, "L8", 11, D, None);
        insert_count(&conn, "L8", 8, D, None);
        movement(&conn, "L8", -1, "2026-05-12");
        assert_eq!(
            derive_stock(&conn, "L8").unwrap(),
            derived(7, Some((7, 10)), &[RecheckReason::ConflictingCounts])
        );
    }

    #[test]
    fn test_stock_ledger_req205_equal_overlapping_counts_not_conflict() {
        // REQ-205 / SPEC-STK-CNT-D3（重なる同値は 1 つとみなす）/ Matrix L9
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L9");
        insert_count(&conn, "L9", 9, D, None);
        insert_count(&conn, "L9", 9, D, None);
        assert_eq!(derive_stock(&conn, "L9").unwrap(), derived(9, None, &[]));
    }

    #[test]
    fn test_stock_ledger_req205_range_with_positive_and_negative_undetermined() {
        // REQ-205 / SPEC-STK-CNT-D2（範囲は決まらない記録を適用する・しないの最小と最大）/ Matrix L10
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L10");
        insert_count(&conn, "L10", 10, D, None);
        movement(&conn, "L10", 3, D);
        movement(&conn, "L10", -2, D);
        assert_eq!(
            derive_stock(&conn, "L10").unwrap(),
            derived(11, Some((8, 13)), &[RecheckReason::SameDateMovement])
        );
    }

    #[test]
    fn test_stock_ledger_req205_reasons_dedup_and_order() {
        // REQ-205 / SPEC-STK-CNT-D3（理由は重複なし、same_date_movement → conflicting_counts の順）/ Matrix L11
        let (_dir, conn) = setup_test_db();
        seed_product(&conn, "L11");
        insert_count(&conn, "L11", 6, D, None);
        insert_count(&conn, "L11", 4, D, None);
        movement(&conn, "L11", 1, D);
        movement(&conn, "L11", 2, D);
        assert_eq!(
            derive_stock(&conn, "L11").unwrap(),
            derived(
                7,
                Some((4, 9)),
                &[
                    RecheckReason::SameDateMovement,
                    RecheckReason::ConflictingCounts
                ]
            )
        );
    }

    #[test]
    fn test_stock_ledger_req401_phase_one_movement_is_error_until_b() {
        // REQ-401 / Y8 / SPEC-STK-CNT-D12（(a) の間は phase = 1 を誤りで止める）/ Matrix L12
        let (_dir, mut conn) = setup_test_db();
        seed_product(&conn, "L12");
        movement(&conn, "L12", 5, D);
        conn.execute(
            "INSERT INTO inventory_movements (product_code, movement_type, quantity, stock_after,
                 reference_type, reference_id, created_at, business_date, phase, settlement_no)
             VALUES ('L12', 'sale_auto', -1, 0, 'csv_import', 1, '2026-05-20T10:00:00', ?1, 1, 3)",
            [D],
        )
        .unwrap();
        let expect_error = |result: Result<DerivedStock, BizError>| match result {
            Err(BizError::DatabaseError(DbError::QueryFailed(message))) => {
                assert_eq!(message, "精算の記録の求め直しはまだ入っていません")
            }
            other => panic!("QueryFailed を期待: {other:?}"),
        };
        expect_error(derive_stock(&conn, "L12"));
        let tx = conn.transaction().unwrap();
        expect_error(recompute_stock(&tx, "L12"));
        drop(tx);
        assert_eq!(copy_of(&conn, "L12"), (0, false, None, None));
    }

    #[test]
    fn test_stock_ledger_req903_recompute_rejects_out_of_range_value_and_range_end() {
        // REQ-903 / Y2・Y3（上限は写しを書く直前、値と範囲の両端）/ Matrix L13
        let (_dir, mut conn) = setup_test_db();
        let expect_rejected = |conn: &mut DbConnection, code: &str| {
            let tx = conn.transaction().unwrap();
            match recompute_stock(&tx, code) {
                Err(BizError::ValidationFailed(message)) => {
                    assert_eq!(message, "在庫数が大きすぎます", "{code}")
                }
                other => panic!("{code}: ValidationFailed を期待: {other:?}"),
            }
            drop(tx);
            assert_eq!(copy_of(conn, code), (0, false, None, None), "{code}");
        };
        seed_product(&conn, "L13-V");
        initial(&conn, "L13-V", 999_999_999, "2026-05-01");
        movement(&conn, "L13-V", 1, "2026-05-02");
        expect_rejected(&mut conn, "L13-V");
        // 範囲の上の端だけが外れる（写しは上限の中）
        seed_product(&conn, "L13-R");
        insert_count(&conn, "L13-R", 0, D, None);
        movement(&conn, "L13-R", 1_000_000_000, D);
        movement(&conn, "L13-R", -1, D);
        assert_eq!(
            derive_stock(&conn, "L13-R").unwrap(),
            derived(
                999_999_999,
                Some((-1, 1_000_000_000)),
                &[RecheckReason::SameDateMovement]
            )
        );
        expect_rejected(&mut conn, "L13-R");
        // 範囲の下の端だけが外れる
        seed_product(&conn, "L13-LOW");
        insert_count(&conn, "L13-LOW", 0, D, None);
        movement(&conn, "L13-LOW", -1_000_000_000, D);
        movement(&conn, "L13-LOW", 1, D);
        assert_eq!(
            derive_stock(&conn, "L13-LOW").unwrap(),
            derived(
                -999_999_999,
                Some((-1_000_000_000, 1)),
                &[RecheckReason::SameDateMovement]
            )
        );
        expect_rejected(&mut conn, "L13-LOW");
        // 端の 999999999・−999999999 は通る
        seed_product(&conn, "L13-OK");
        insert_count(&conn, "L13-OK", 0, D, None);
        movement(&conn, "L13-OK", -999_999_999, D);
        movement(&conn, "L13-OK", 999_999_999, D);
        let tx = conn.transaction().unwrap();
        recompute_stock(&tx, "L13-OK").unwrap();
        tx.commit().unwrap();
        assert_eq!(
            copy_of(&conn, "L13-OK"),
            (0, true, Some(-999_999_999), Some(999_999_999))
        );
        // i64 の和の溢れも書かずに止まる
        seed_product(&conn, "L13-OVF");
        initial(&conn, "L13-OVF", i64::MAX, "2026-05-01");
        initial(&conn, "L13-OVF", 1, "2026-05-01");
        assert!(matches!(
            derive_stock(&conn, "L13-OVF"),
            Err(BizError::ValidationFailed(message)) if message == "在庫数計算オーバーフロー"
        ));
    }

    #[test]
    fn test_stock_ledger_req205_recompute_writes_quantity_flag_and_range() {
        // REQ-205 / SPEC-STK-CNT-D2（recompute_stock が写しの 4 項目を書く）/ Matrix L14
        let (_dir, mut conn) = setup_test_db();
        seed_product(&conn, "L14");
        insert_count(&conn, "L14", 8, D, None);
        insert_count(&conn, "L14", 11, D, None);
        let tx = conn.transaction().unwrap();
        let result = recompute_stock(&tx, "L14").unwrap();
        tx.commit().unwrap();
        assert_eq!(
            result,
            derived(8, Some((8, 11)), &[RecheckReason::ConflictingCounts])
        );
        assert_eq!(copy_of(&conn, "L14"), (8, true, Some(8), Some(11)));
        // 「入れ直す」で解けたら 0・NULL に戻る
        insert_count(&conn, "L14", 10, D, Some(0));
        let tx = conn.transaction().unwrap();
        recompute_stock(&tx, "L14").unwrap();
        tx.commit().unwrap();
        assert_eq!(copy_of(&conn, "L14"), (10, false, None, None));
        // 対象の無い商品は NotFound
        let tx = conn.transaction().unwrap();
        assert!(matches!(
            recompute_stock(&tx, "L14-NONE"),
            Err(BizError::NotFound(_))
        ));
    }
}
