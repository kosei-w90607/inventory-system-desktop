// src/lib/unit-quantity.ts
//
// 単位・数量の共通規則の TS 側（SPEC-UNIT-D3・D9、「入力の上限と安全な整数の範囲」）。
// 上限の 4 つの値はここだけに置く（Rust は src-tauri/src/constants.rs）。
// 設計: docs/function-design/10-common-rules.md 「単位・数量・金額の共通規則」

import type { ProductStockUnit } from "@/lib/bindings";

/** 1 明細の数量の上限（在庫の数量の単位。長さは cm = 99999.99 m） */
export const MAX_ITEM_QUANTITY = 9_999_999;
/** 在庫の絶対値の上限（長さは cm = 9999999.99 m） */
export const MAX_STOCK_QUANTITY = 999_999_999;
/** 売価（円）の上限 */
export const MAX_SELLING_PRICE = 999_999;
/** 原価（円）の上限 */
export const MAX_COST_PRICE = 999_999;

/** 価格の基準数量（個数は 1、長さは 100 = 1 m あたり。SPEC-UNIT-D4） */
export function priceBasisQuantity(unit: ProductStockUnit): 1 | 100 {
  switch (unit) {
    case "pcs":
    case "sheet":
    case "hon":
    case "bag":
    case "box":
    case "roll":
    case "kumi":
    case "set":
    case "ball":
    case "cho":
      return 1;
    case "m":
    case "cm":
      return 100;
  }
}

/** 数量の種類が長さ（`m`・`cm`）か */
export function isLengthUnit(unit: ProductStockUnit): boolean {
  return priceBasisQuantity(unit) === 100;
}

/** 入庫・返品・廃棄で商品を追加・再追加したときの数量（`m` は 1 m、ほかは 1） */
export function entryQuantityStep(unit: ProductStockUnit): number {
  return unit === "m" ? 100 : 1;
}

/** 数量欄ごとの下限・上限と文 */
export interface QuantityField {
  /** 0 を受ける欄（商品登録の初期在庫）は 0、数量欄は 1 */
  min: 0 | 1;
  max: number;
  tooLarge: string;
  /** 個数と `cm` の欄の形式の error の文（今の文） */
  integerError: string;
}

/** 入庫・返品・手動販売・廃棄の数量欄（X1） */
export const ITEM_QUANTITY_FIELD: QuantityField = {
  min: 1,
  max: MAX_ITEM_QUANTITY,
  tooLarge: "数量が大きすぎます",
  integerError: "数量は1以上の整数で入力してください",
};

export type QuantityInputResult = { value: number; error: null } | { value: null; error: string };

// 入力の文字列を在庫の数量の整数にする（`m` は cm）。形式に合わなければ null。
// 小数の number の掛け算を通さない（`0.29` → 29）。桁の多い整数部は上限より大きい数になる。
function readQuantity(text: string, unit: ProductStockUnit): number | null {
  const normalized = text.trim();
  if (unit !== "m") return /^\d+$/.test(normalized) ? Number(normalized) : null;
  const match = /^([0-9]+)(?:\.([0-9]{1,2}))?$/.exec(normalized);
  if (match === null) return null;
  const [, whole, fraction = ""] = match;
  return Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
}

/**
 * 数量欄の文字列を検証して在庫の数量の整数にする（SPEC-UNIT-D3 の入力）。
 * `m` の商品は m の小数 2 桁まで、個数と `cm` は整数。0 と上限は欄ごと。
 */
export function parseQuantityInput(
  text: string,
  unit: ProductStockUnit,
  field: QuantityField,
): QuantityInputResult {
  const value = readQuantity(text, unit);
  if (value === null || value < field.min) {
    const error =
      unit === "m"
        ? `数量は${field.min === 0 ? "0" : "0.01"}以上で、小数は2桁までの m で入力してください`
        : field.integerError;
    return { value: null, error };
  }
  if (value > field.max) return { value: null, error: field.tooLarge };
  return { value, error: null };
}

/** 在庫の数量の整数を入力欄の文字列にする（`m` は 130 → `1.3`。3 桁区切りなし） */
export function formatQuantityInput(quantity: number, unit: ProductStockUnit): string {
  if (unit !== "m") return String(quantity);
  const whole = Math.floor(quantity / 100);
  const fraction = quantity % 100;
  if (fraction === 0) return String(whole);
  return `${String(whole)}.${fraction % 10 === 0 ? String(fraction / 10) : String(fraction).padStart(2, "0")}`;
}

/**
 * 入力の行の数量に、在庫の数量の整数で足す（SPEC-UNIT-D3 の加算）。
 * 文字列が規則に合わない（1 未満を含む）ときは null（呼ぶ側が今の fallback を当てる）。
 */
export function addToQuantityInput(
  text: string,
  unit: ProductStockUnit,
  addend: number,
): string | null {
  const current = readQuantity(text, unit);
  if (current === null || current < 1 || !Number.isSafeInteger(current + addend)) return null;
  return formatQuantityInput(current + addend, unit);
}

/** 2 つの入力の行の数量を足す（行の統合）。どちらかが規則に合わなければ null */
export function sumQuantityInputs(
  left: string,
  right: string,
  unit: ProductStockUnit,
): string | null {
  const addend = readQuantity(right, unit);
  if (addend === null || addend < 1) return null;
  return addToQuantityInput(left, unit, addend);
}

/** 価格の欄（売価・原価の円の整数）を検証する。形式の error は null、上限超えは "too_large" */
export function parsePriceInput(text: string, max: number): number | "too_large" | null {
  const normalized = text.trim();
  if (!/^\d+$/.test(normalized)) return null;
  const value = Number(normalized);
  return value > max ? "too_large" : value;
}

/** 非負の整数の割り算を四捨五入する（商 q・余り r で `2r >= d` なら q + 1。SPEC-UNIT-D6・D7） */
export function divideRoundHalfUp(numerator: number, denominator: number): number {
  const remainder = numerator % denominator;
  return (numerator - remainder) / denominator + (2 * remainder >= denominator ? 1 : 0);
}

/** 売価 × 数量 ÷ 基準数量を円未満で四捨五入する（Rust の `sale_amount_yen` の twin。非負だけ） */
export function saleAmountYen(sellingPrice: number, quantity: number, basis: number): number {
  return divideRoundHalfUp(sellingPrice * quantity, basis);
}

/** 画面の再集計の加算。安全な整数を外れたら null（その欄は `—`。SPEC-UNIT-D3 の集計の規則） */
export function addSafeInteger(total: number | null, value: number): number | null {
  if (total === null) return null;
  const sum = total + value;
  return Number.isSafeInteger(sum) ? sum : null;
}

/** 数量欄（`type="number"`）の属性。`m` の商品の行だけ小数 2 桁の入力にする（値の検証は純関数が持つ） */
export function quantityInputAttributes(unit: ProductStockUnit) {
  return unit === "m"
    ? ({ inputMode: "decimal", min: "0.01", step: "0.01" } as const)
    : ({ inputMode: "numeric", min: "1" } as const);
}

/** 数量の並べ替え: `(count_points, length_cm)` の辞書順（SPEC-UNIT-D3 の集計の規則） */
export function compareQuantityPair(
  left: { count_points: number; length_cm: number },
  right: { count_points: number; length_cm: number },
): number {
  return left.count_points - right.count_points || left.length_cm - right.length_cm;
}
