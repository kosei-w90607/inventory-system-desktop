//! 単位・数量・金額の共通規則（10-common-rules.md「単位・数量・金額の共通規則」SPEC-UNIT-D1〜D11）
//!
//! 数量の種類・価格の基準数量・原価 × 数量の金額と丸めを 1 か所に置き、棚卸し・入出庫・売上が共有する。
//! 浮動小数を使わない。

use crate::biz::BizError;
use crate::constants::MAX_SAFE_INTEGER;
use crate::db::product_repo::ProductStockUnit;

/// 数量の種類（SPEC-UNIT-D1）
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum StockUnitKind {
    Count,
    Length,
}

/// 単位の数量の種類（SPEC-UNIT-D1）。単位を足したら compile error で種類を決めさせるため wildcard を置かない
pub fn stock_unit_kind(unit: ProductStockUnit) -> StockUnitKind {
    match unit {
        ProductStockUnit::Pcs => StockUnitKind::Count,
        ProductStockUnit::Cm => StockUnitKind::Length,
    }
}

/// 価格の基準数量（SPEC-UNIT-D4 / SPEC-STK-VAL-D1）。個数は 1、長さは 100（1 m あたり）
pub fn price_basis_quantity(unit: ProductStockUnit) -> i64 {
    match stock_unit_kind(unit) {
        StockUnitKind::Count => 1,
        StockUnitKind::Length => 100,
    }
}

fn amount_overflow() -> BizError {
    BizError::ValidationFailed("仕入原価総額の計算でオーバーフローが発生しました".to_string())
}

/// 非負の `numerator ÷ basis` を四捨五入する（余り r で `2r >= basis` なら切り上げ）
fn div_round_half_up(numerator: i128, basis: i64) -> i128 {
    let basis = i128::from(basis);
    let (quotient, remainder) = (numerator / basis, numerator % basis);
    // r < basis ≤ i64::MAX なので 2r は溢れない
    if 2 * remainder >= basis {
        quotient + 1
    } else {
        quotient
    }
}

/// 行（商品別）の金額（1/100 円）。`原価(1/100 円) × 数量 ÷ 基準数量` を四捨五入する（SPEC-UNIT-D6）
///
/// 原価が円の整数の間は、呼ぶ側が `i128::from(原価(円)) * 100` を渡す。
pub fn cost_line_centi(
    cost_price_centi: i128,
    quantity: i64,
    basis: i64,
    product_code: &str,
) -> Result<i128, BizError> {
    if cost_price_centi < 0 || quantity < 0 {
        return Err(BizError::ValidationFailed(format!(
            "評価額を計算できません。原価か数量が負の値です（商品 {product_code}）"
        )));
    }
    let centi_times_basis = cost_price_centi
        .checked_mul(i128::from(quantity))
        .ok_or_else(amount_overflow)?;
    Ok(div_round_half_up(centi_times_basis, basis))
}

/// 合計（円）。行の金額（1/100 円）の和を円未満で四捨五入する（SPEC-UNIT-D6）
pub fn cost_total_yen(lines: &[i128]) -> Result<i64, BizError> {
    let total = lines
        .iter()
        .try_fold(0_i128, |sum, &line| sum.checked_add(line))
        .ok_or_else(amount_overflow)?;
    let (yen, centi) = (total / 100, total % 100);
    let yen = if centi >= 50 { yen + 1 } else { yen };
    i64::try_from(yen).map_err(|_| amount_overflow())
}

/// 売価 × 数量の金額（円）。`売価 × 数量 ÷ 基準数量` を円未満で四捨五入する（SPEC-UNIT-D7）
pub fn sale_amount_yen(selling_price: i64, quantity: i64, basis: i64) -> Result<i64, BizError> {
    if selling_price < 0 || quantity < 0 {
        return Err(BizError::ValidationFailed(
            "金額を計算できません。売価か数量が負の値です".to_string(),
        ));
    }
    // i64 × i64 の積は i128 に必ず収まるので検査しない
    let amount = div_round_half_up(i128::from(selling_price) * i128::from(quantity), basis);
    i64::try_from(amount).map_err(|_| amount_overflow())
}

/// 円の合計の保存の前の検査。`±9007199254740991` の外は `ValidationFailed`（`{what}が大きすぎます`）
pub fn check_safe_integer(value: i128, what: &str) -> Result<i64, BizError> {
    let max = i128::from(MAX_SAFE_INTEGER);
    match i64::try_from(value) {
        Ok(v) if (-max..=max).contains(&value) => Ok(v),
        _ => Err(BizError::ValidationFailed(format!("{what}が大きすぎます"))),
    }
}

/// 長さの数量（cm）を m の表示にする（SPEC-UNIT-D3。-30 → "-0.3 m"、123456 → "1,234.56 m"）
pub fn format_length_m(quantity_cm: i64) -> String {
    let abs = quantity_cm.unsigned_abs();
    let digits = (abs / 100).to_string();
    let mut whole = String::new();
    for (i, c) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i) % 3 == 0 {
            whole.push(',');
        }
        whole.push(c);
    }
    let sign = if quantity_cm < 0 { "-" } else { "" };
    let fraction = match abs % 100 {
        0 => String::new(),
        f if f % 10 == 0 => format!(".{}", f / 10),
        f => format!(".{f:02}"),
    };
    format!("{sign}{whole}{fraction} m")
}

#[cfg(test)]
mod tests {
    use super::*;

    fn is_overflow<T: std::fmt::Debug>(result: &Result<T, BizError>) -> bool {
        matches!(result, Err(BizError::ValidationFailed(msg)) if msg.contains("オーバーフロー"))
    }

    /// 円の原価を 1/100 円にして渡す（原価が円の整数の間の呼び方）
    fn line(cost_yen: i64, quantity: i64, basis: i64) -> Result<i128, BizError> {
        cost_line_centi(i128::from(cost_yen) * 100, quantity, basis, "L")
    }

    #[test]
    fn test_valuation_req205_price_basis_by_unit() {
        // REQ-205 / SPEC-STK-VAL-D1 / SPEC-UNIT-D1: 種類と基準数量は在庫単位で決まる
        assert_eq!(stock_unit_kind(ProductStockUnit::Pcs), StockUnitKind::Count);
        assert_eq!(stock_unit_kind(ProductStockUnit::Cm), StockUnitKind::Length);
        assert_eq!(price_basis_quantity(ProductStockUnit::Pcs), 1);
        assert_eq!(price_basis_quantity(ProductStockUnit::Cm), 100);
    }

    #[test]
    fn test_valuation_req205_line_rounds_half_up() {
        // REQ-205 / SPEC-STK-VAL-D3: 正確な値を 1/100 円で四捨五入する
        assert_eq!(line(1000, 5, 12).unwrap(), 41667); // 416.666… 円
        assert_eq!(line(385, 153, 100).unwrap(), 58905); // 589.05 円
        assert_eq!(line(1, 1, 200).unwrap(), 1); // 0.005 円（境界ちょうど）
        assert_eq!(line(1, 1, 201).unwrap(), 0); // 0.004975… 円
        assert_eq!(line(300, 5, 1).unwrap(), 150000);
        assert_eq!(line(385, 0, 100).unwrap(), 0);
    }

    #[test]
    fn test_valuation_req205_total_rounds_half_up_to_yen() {
        // REQ-205 / SPEC-STK-VAL-D4: 合計を円未満で四捨五入する（50・250 で偶数丸めと区別）
        assert_eq!(cost_total_yen(&[58950]).unwrap(), 590);
        assert_eq!(cost_total_yen(&[58949]).unwrap(), 589);
        assert_eq!(cost_total_yen(&[50]).unwrap(), 1);
        assert_eq!(cost_total_yen(&[250]).unwrap(), 3);
        assert_eq!(cost_total_yen(&[0]).unwrap(), 0);
    }

    #[test]
    fn test_valuation_req205_two_stage_rounding() {
        // REQ-205 / SPEC-STK-VAL-D3・D4: 丸めは商品別と最終合計の 2 段
        let line = line(1, 1, 250).unwrap(); // 0.004 円
        assert_eq!(line, 0);
        // 合計してから丸めると 0.8 円 → 1 円になる。商品別に丸めるので 0 円
        assert_eq!(cost_total_yen(&[line; 200]).unwrap(), 0);
    }

    #[test]
    fn test_valuation_req205_negative_input_rejected() {
        // REQ-205 / SPEC-STK-VAL-D5: 負の原価・数量は商品コード入りの ValidationFailed
        for result in [
            cost_line_centi(-100, 1, 1, "NEG-001"),
            cost_line_centi(100, -1, 1, "NEG-001"),
        ] {
            assert!(
                matches!(result, Err(BizError::ValidationFailed(ref msg)) if msg.contains("NEG-001")),
                "負の入力は ValidationFailed（商品コード入り）: {:?}",
                result
            );
        }
    }

    #[test]
    fn test_valuation_req205_line_overflow_rejected() {
        // REQ-205 / SPEC-STK-VAL-D2・D5: × 100 の i128 の桁あふれは error、旧式が通る最大付近は通す
        let result = line(1 << 62, 737_869_762_948_382_065, 100);
        assert!(is_overflow(&result), "× 100 の桁あふれ: {:?}", result);
        assert_eq!(line(i64::MAX, 1, 1).unwrap(), i128::from(i64::MAX) * 100);
        assert_eq!(line(i64::MAX, 1, 100).unwrap(), i128::from(i64::MAX));
    }

    #[test]
    fn test_valuation_req205_total_bounds() {
        // REQ-205 / SPEC-STK-VAL-D2・D5: i64 の上限付近の丸め、合計の桁あふれ、旧式が確定できた値
        let max_centi = i128::from(i64::MAX) * 100;
        assert_eq!(cost_total_yen(&[max_centi + 49]).unwrap(), i64::MAX);
        let result = cost_total_yen(&[max_centi + 50]);
        assert!(is_overflow(&result), "円額が i64 を越える: {:?}", result);
        assert_eq!(cost_total_yen(&[]).unwrap(), 0);
        // 中間を i64 に限ると × 100 で桁あふれする値。pcs では旧式と一致する
        let one = line(92_233_720_368_547_759, 1, 1).unwrap();
        assert_eq!(cost_total_yen(&[one]).unwrap(), 92_233_720_368_547_759);
        // 合計の i128 の桁あふれ（2 本では wrap が負になり変換の error に紛れるため 3 本）
        let big = line(1 << 60, 983_826_350_597_842_753, 1).unwrap();
        let result = cost_total_yen(&[big, big, big]);
        assert!(is_overflow(&result), "合計の桁あふれ: {:?}", result);
    }

    #[test]
    fn test_cost_line_and_total_req201_length_and_mixed_units() {
        // REQ-201 / REQ-204 / SPEC-UNIT-D6: 長さの商品は基準数量で割り、合計は 1/100 円で足してから丸める
        assert_eq!(line(333, 250, 100).unwrap(), 83250);
        assert_eq!(cost_total_yen(&[83250]).unwrap(), 833);
        assert_eq!(line(333, 50, 100).unwrap(), 16650);
        assert_eq!(cost_total_yen(&[16650]).unwrap(), 167);
        // m 0.5 m × 333 円・cm 50 cm × 1 円/m・pcs 3 × 2 円
        let lines = [
            line(333, 50, 100).unwrap(),
            line(1, 50, 100).unwrap(),
            line(2, 3, 1).unwrap(),
        ];
        assert_eq!(lines, [16650, 50, 600]);
        // 行ごとに円へ丸めて足すと 174 円になる
        assert_eq!(cost_total_yen(&lines).unwrap(), 173);
        // 上限の明細（原価 999999 円・数量 9999999）
        assert_eq!(line(999_999, 9_999_999, 1).unwrap(), 999_998_900_000_100);
    }

    #[test]
    fn test_sale_amount_yen_req203_rounds_half_up() {
        // REQ-203 / SPEC-UNIT-D7: 売価 × 数量 ÷ 基準数量を円未満で四捨五入する（golden。TS の twin と同じ表）
        for (price, quantity, basis, expected) in [
            (700, 130, 100, 910),
            (333, 130, 100, 433), // 432.9
            (333, 125, 100, 416), // 416.25
            (333, 100, 100, 333),
            (1, 50, 100, 1), // 0.5（境界）
            (999_999, 9_999_999, 1, 9_999_989_000_001),
            (999_999, 9_999_999, 100, 99_999_890_000),
            (700, 3, 1, 2100),
        ] {
            assert_eq!(
                sale_amount_yen(price, quantity, basis).unwrap(),
                expected,
                "{price} × {quantity} ÷ {basis}"
            );
        }
        for result in [sale_amount_yen(-1, 1, 1), sale_amount_yen(1, -1, 1)] {
            assert!(matches!(result, Err(BizError::ValidationFailed(_))));
        }
        assert!(is_overflow(&sale_amount_yen(i64::MAX, 2, 1)));
    }

    #[test]
    fn test_check_safe_integer_req201_bounds() {
        // REQ-201 / REQ-204 / SPEC-UNIT-D11（X8）: ±9007199254740991 の外は ValidationFailed
        assert_eq!(
            check_safe_integer(9_007_199_254_740_991, "合計金額").unwrap(),
            9_007_199_254_740_991
        );
        assert_eq!(
            check_safe_integer(-9_007_199_254_740_991, "合計金額").unwrap(),
            -9_007_199_254_740_991
        );
        for value in [9_007_199_254_740_992_i128, -9_007_199_254_740_992] {
            let result = check_safe_integer(value, "合計金額");
            assert!(
                matches!(result, Err(BizError::ValidationFailed(ref msg)) if msg == "合計金額が大きすぎます"),
                "{value}: {result:?}"
            );
        }
    }

    #[test]
    fn test_format_length_m_req301_golden() {
        // REQ-301 / SPEC-UNIT-D3・D9: cm → m の表示（golden。TS の formatter と同じ表）
        for (cm, expected) in [
            (130, "1.3 m"),
            (127, "1.27 m"),
            (200, "2 m"),
            (-30, "-0.3 m"),
            (123_456, "1,234.56 m"),
            (0, "0 m"),
            (300, "3 m"),
            (5, "0.05 m"),
            (-135, "-1.35 m"),
            (2750, "27.5 m"),
            (999_999_999, "9,999,999.99 m"),
            (100_000_000, "1,000,000 m"),
        ] {
            assert_eq!(format_length_m(cm), expected, "{cm}");
        }
    }
}
