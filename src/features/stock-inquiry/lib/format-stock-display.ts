// src/features/stock-inquiry/lib/format-stock-display.ts
//
// 数量と単位の表示の純関数（SPEC-UNIT-D3 の表示・D9 の formatter）。
// 個数の単位は「10 個」、長さの単位（`m`・`cm`）はどちらも m の形「1.3 m」で出す。
// 単位は `ProductStockUnit` で受け、全 variant を型で網羅する（fallback を置かない）。
//
// 設計: docs/function-design/10-common-rules.md SPEC-UNIT-D3 / 58-ui-stock-inquiry.md §58.6

import type { ProductStockUnit } from "@/lib/bindings";
import { isLengthUnit } from "@/lib/unit-quantity";

/** 単位の表示の語（SPEC-UNIT-D1 の表の順。select の並びもこの順） */
export const STOCK_UNIT_LABELS: Record<ProductStockUnit, string> = {
  pcs: "個",
  sheet: "枚",
  hon: "本",
  bag: "袋",
  box: "箱",
  roll: "巻",
  kumi: "組",
  set: "セット",
  ball: "玉",
  cho: "丁",
  m: "m",
  cm: "cm",
};

/**
 * 長さの数量（cm の整数）を m で表す（Rust の `format_length_m` の twin）。
 * 符号・整数部（3 桁区切り）・小数部 2 桁を整数の演算で作り、末尾の 0 を落とす。
 */
export function formatLengthM(quantityCm: number): string {
  const abs = Math.abs(quantityCm);
  const fraction = abs % 100;
  const whole = ((abs - fraction) / 100).toLocaleString("ja-JP");
  const decimals =
    fraction === 0
      ? ""
      : `.${fraction % 10 === 0 ? String(fraction / 10) : String(fraction).padStart(2, "0")}`;
  return `${quantityCm < 0 ? "-" : ""}${whole}${decimals} m`;
}

/** 数量を単位つきの文字列にする（`10 個`・`3 玉`・`1.3 m`。`cm` の商品も m の形） */
export function formatStockDisplay(quantity: number, unit: ProductStockUnit): string {
  return isLengthUnit(unit)
    ? formatLengthM(quantity)
    : `${quantity.toLocaleString("ja-JP")} ${STOCK_UNIT_LABELS[unit]}`;
}

/** 数量を伴わない単位の表示（入力の行の単位欄。`cm` の商品は入力の単位の `cm`） */
export function formatStockUnitLabel(unit: ProductStockUnit): string {
  return STOCK_UNIT_LABELS[unit];
}

/**
 * 単位をまたぐ数量の集計を `5 点・1.8 m` の形にする（SPEC-UNIT-D3 の集計の規則、X9）。
 * `N 点` の `N` は 3 桁区切り。再集計が安全な整数を外れた欄（null）は `—`。
 * 両方が 0 でない組は Rust の `csv_total_quantity` と同じ golden。
 */
export function formatQuantityTotal(countPoints: number | null, lengthCm: number | null): string {
  if (countPoints === null || lengthCm === null) return "—";
  const points = `${countPoints.toLocaleString("ja-JP")} 点`;
  if (lengthCm === 0) return points;
  return countPoints === 0 ? formatLengthM(lengthCm) : `${points}・${formatLengthM(lengthCm)}`;
}

/**
 * 月次の商品別の行の数量。種類は行の単位で決める（相殺して 0 でも `0 m`・`0 点`）。
 * 単位を持たない行（部門別）は集計の形。
 */
export function formatUnitQuantityTotal(
  countPoints: number,
  lengthCm: number,
  unit: ProductStockUnit | null,
): string {
  if (unit === null) return formatQuantityTotal(countPoints, lengthCm);
  return isLengthUnit(unit) ? formatLengthM(lengthCm) : formatQuantityTotal(countPoints, 0);
}

/** 単価の表示（長さの商品は 1 m あたり `¥700/m`、個数の商品は `¥700`） */
export function formatUnitPrice(unitPriceYen: number, unit: ProductStockUnit): string {
  return `¥${unitPriceYen.toLocaleString("ja-JP")}${isLengthUnit(unit) ? "/m" : ""}`;
}

/**
 * 行の金額（1/100 円の整数の十進の文字列）を `832.50 円` の形にする（SPEC-UNIT-D6、X7）。
 * 文字列のまま整数部に 3 桁区切りを入れ、number に直さない。`^[0-9]+$` に合わない入力は `—`。
 */
export function formatCentiYen(centi: string): string {
  if (!/^[0-9]+$/.test(centi)) return "—";
  const padded = centi.padStart(3, "0");
  const whole = padded
    .slice(0, -2)
    .replace(/^0+(?=\d)/, "")
    .replace(/\B(?=(\d{3})+$)/g, ",");
  return `${whole}.${padded.slice(-2)} 円`;
}

/**
 * 長さの商品の数量だけ m の形にし、個数の商品と単位の分からない行は今どおり語を付けない数で出す
 * （SPEC-UNIT-D3 の表の 6・8・9・11・12。個数の数の形は画面ごとの今の形を `plain` で渡す）。
 */
export function formatLengthOrPlain(
  quantity: number,
  unit: ProductStockUnit | undefined,
  plain: (quantity: number) => string = String,
): string {
  return unit !== undefined && isLengthUnit(unit) ? formatLengthM(quantity) : plain(quantity);
}
