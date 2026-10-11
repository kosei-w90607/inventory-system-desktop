// src/lib/unit-quantity.test.ts
//
// SPEC-UNIT-D3（m の入力と加算）・D7（売価 × 数量の twin）・「入力の上限」の TS 側。
// 期待は正本の例と整数の計算から独立に写している（実装の出力から作らない）。

import { describe, expect, it } from "vitest";

import {
  ITEM_QUANTITY_FIELD,
  MAX_COST_PRICE,
  MAX_ITEM_QUANTITY,
  MAX_SELLING_PRICE,
  MAX_STOCK_QUANTITY,
  addSafeInteger,
  addToQuantityInput,
  compareQuantityPair,
  divideRoundHalfUp,
  entryQuantityStep,
  formatQuantityInput,
  isLengthUnit,
  parsePriceInput,
  parseQuantityInput,
  priceBasisQuantity,
  quantityInputAttributes,
  saleAmountYen,
  sumQuantityInputs,
  type QuantityField,
} from "./unit-quantity";

const M_ERROR = "数量は0.01以上で、小数は2桁までの m で入力してください";
const M_ERROR_ZERO_OK = "数量は0以上で、小数は2桁までの m で入力してください";
const INTEGER_ERROR = "数量は1以上の整数で入力してください";

// 0 を受ける欄（商品登録の初期在庫）
const STOCK_FIELD: QuantityField = {
  min: 0,
  max: MAX_STOCK_QUANTITY,
  tooLarge: "在庫数が大きすぎます",
  integerError: "初期在庫は0以上の整数で入力してください",
};

describe("上限の定数と単位の種類（REQ-201 / SPEC-UNIT-D1・D11）", () => {
  it("REQ-201: 上限の 4 つの値は共通規則 (a) の表と同じ", () => {
    expect(MAX_ITEM_QUANTITY).toBe(9999999);
    expect(MAX_STOCK_QUANTITY).toBe(999999999);
    expect(MAX_SELLING_PRICE).toBe(999999);
    expect(MAX_COST_PRICE).toBe(999999);
  });

  it("REQ-201: 価格の基準数量は個数の 10 単位が 1、m・cm が 100", () => {
    for (const unit of [
      "pcs",
      "sheet",
      "hon",
      "bag",
      "box",
      "roll",
      "kumi",
      "set",
      "ball",
      "cho",
    ] as const) {
      expect(priceBasisQuantity(unit)).toBe(1);
      expect(isLengthUnit(unit)).toBe(false);
    }
    expect(priceBasisQuantity("m")).toBe(100);
    expect(priceBasisQuantity("cm")).toBe(100);
    expect(isLengthUnit("m")).toBe(true);
    expect(isLengthUnit("cm")).toBe(true);
  });

  it("REQ-201: 入庫・返品・廃棄の追加と再追加の量は m が 1 m、cm と個数は 1", () => {
    expect(entryQuantityStep("m")).toBe(100);
    expect(entryQuantityStep("cm")).toBe(1);
    expect(entryQuantityStep("ball")).toBe(1);
  });
});

describe("parseQuantityInput（REQ-201 / UI-04-D18 / SPEC-UNIT-D3 の m の入力）", () => {
  it.each([
    ["1.3", 130],
    [" 1.3 ", 130],
    ["1.27", 127],
    ["2", 200],
    ["0.01", 1],
    ["0.29", 29],
    ["1.15", 115],
    ["4.35", 435],
    ["99999.99", 9999999],
  ])("REQ-201: m の数量欄 %j は %s cm（浮動小数を通さない）", (text, expected) => {
    expect(parseQuantityInput(text, "m", ITEM_QUANTITY_FIELD)).toEqual({
      value: expected,
      error: null,
    });
  });

  it.each(["0", "0.00", "1.300", "1e2", "-1", ".5", "", "1.", "abc", "1,5", "+1"])(
    "REQ-201: m の数量欄 %j は形式の error（丸めない・符号を受けない・0 を通さない）",
    (text) => {
      expect(parseQuantityInput(text, "m", ITEM_QUANTITY_FIELD)).toEqual({
        value: null,
        error: M_ERROR,
      });
    },
  );

  it.each(["100000", "100000.00", "99999999999999999999999"])(
    "REQ-201: m の数量欄 %j は上限超え（X1）",
    (text) => {
      expect(parseQuantityInput(text, "m", ITEM_QUANTITY_FIELD)).toEqual({
        value: null,
        error: "数量が大きすぎます",
      });
    },
  );

  it("REQ-101: 0 を受ける欄（初期在庫）は 0 を受け、上限は在庫の上限（X3）", () => {
    expect(parseQuantityInput("0", "m", STOCK_FIELD)).toEqual({ value: 0, error: null });
    expect(parseQuantityInput("0.00", "m", STOCK_FIELD)).toEqual({ value: 0, error: null });
    expect(parseQuantityInput("25", "m", STOCK_FIELD)).toEqual({ value: 2500, error: null });
    expect(parseQuantityInput("9999999.99", "m", STOCK_FIELD)).toEqual({
      value: 999999999,
      error: null,
    });
    expect(parseQuantityInput("10000000", "m", STOCK_FIELD)).toEqual({
      value: null,
      error: "在庫数が大きすぎます",
    });
    expect(parseQuantityInput("0.005", "m", STOCK_FIELD)).toEqual({
      value: null,
      error: M_ERROR_ZERO_OK,
    });
    expect(parseQuantityInput("999999999", "pcs", STOCK_FIELD)).toEqual({
      value: 999999999,
      error: null,
    });
    expect(parseQuantityInput("1000000000", "pcs", STOCK_FIELD)).toEqual({
      value: null,
      error: "在庫数が大きすぎます",
    });
    expect(parseQuantityInput("1.5", "pcs", STOCK_FIELD)).toEqual({
      value: null,
      error: "初期在庫は0以上の整数で入力してください",
    });
  });

  it.each(["pcs", "cm", "ball"] as const)(
    "REQ-201: %s の数量欄は今の整数の規則のままで、同じ上限を掛ける（X1）",
    (unit) => {
      expect(parseQuantityInput("9999999", unit, ITEM_QUANTITY_FIELD)).toEqual({
        value: 9999999,
        error: null,
      });
      expect(parseQuantityInput(" 3 ", unit, ITEM_QUANTITY_FIELD)).toEqual({
        value: 3,
        error: null,
      });
      expect(parseQuantityInput("10000000", unit, ITEM_QUANTITY_FIELD)).toEqual({
        value: null,
        error: "数量が大きすぎます",
      });
      for (const text of ["0", "1.3", "", "-1", "1e2"]) {
        expect(parseQuantityInput(text, unit, ITEM_QUANTITY_FIELD)).toEqual({
          value: null,
          error: INTEGER_ERROR,
        });
      }
    },
  );
});

describe("入力の行の数量の加算（REQ-201 / SPEC-UNIT-D3）", () => {
  it("REQ-201: cm の整数で足して入力の形に戻す（round-trip: 127 cm ↔ 1.27）", () => {
    expect(formatQuantityInput(130, "m")).toBe("1.3");
    expect(formatQuantityInput(127, "m")).toBe("1.27");
    expect(formatQuantityInput(200, "m")).toBe("2");
    expect(formatQuantityInput(5, "m")).toBe("0.05");
    expect(formatQuantityInput(123456, "m")).toBe("1234.56");
    expect(formatQuantityInput(130, "cm")).toBe("130");
    expect(formatQuantityInput(3, "pcs")).toBe("3");
  });

  it("REQ-201: 再追加は m が 1.3 → 2.3、1.27 → 2.27、個数が 3 → 4、cm が 130 → 131", () => {
    expect(addToQuantityInput("1.3", "m", 100)).toBe("2.3");
    expect(addToQuantityInput("1.27", "m", 100)).toBe("2.27");
    expect(addToQuantityInput("3", "pcs", 1)).toBe("4");
    expect(addToQuantityInput("130", "cm", 1)).toBe("131");
    expect(addToQuantityInput("130", "cm", 100)).toBe("230");
  });

  it("REQ-201: 規則に合わない文字列は null（呼ぶ側が fallback を当てる）", () => {
    expect(addToQuantityInput("abc", "m", 100)).toBeNull();
    expect(addToQuantityInput("1.3", "pcs", 1)).toBeNull();
    expect(addToQuantityInput("0", "m", 100)).toBeNull();
    expect(addToQuantityInput("", "cm", 1)).toBeNull();
  });

  it("REQ-204: 行の統合は浮動小数で足さない（0.1 + 0.2 → 0.3）", () => {
    expect(sumQuantityInputs("0.5", "0.3", "m")).toBe("0.8");
    expect(sumQuantityInputs("0.1", "0.2", "m")).toBe("0.3");
    expect(sumQuantityInputs("2", "3", "pcs")).toBe("5");
    expect(sumQuantityInputs("5", "abc", "pcs")).toBeNull();
    expect(sumQuantityInputs("abc", "5", "pcs")).toBeNull();
  });

  it("REQ-201: 数量欄の属性は m の商品の行だけ小数の入力", () => {
    expect(quantityInputAttributes("m")).toEqual({
      inputMode: "decimal",
      min: "0.01",
      step: "0.01",
    });
    expect(quantityInputAttributes("cm")).toEqual({ inputMode: "numeric", min: "1" });
    expect(quantityInputAttributes("pcs")).toEqual({ inputMode: "numeric", min: "1" });
  });
});

describe("金額の twin と再集計（REQ-203 / UI-04-D18 / SPEC-UNIT-D7・D9）", () => {
  // Rust の `sale_amount_yen` の test と同じ golden を独立に写したもの
  it.each([
    [700, 130, 100, 910],
    [333, 130, 100, 433],
    [333, 125, 100, 416],
    [333, 100, 100, 333],
    [1, 50, 100, 1],
    [1, 49, 100, 0],
    [999999, 9999999, 1, 9999989000001],
    [999999, 9999999, 100, 99999890000],
  ])("UI-04-D18: 売価 %s × 数量 %s ÷ 基準 %s = %s 円（四捨五入）", (price, qty, basis, yen) => {
    expect(saleAmountYen(price, qty, basis)).toBe(yen);
  });

  it("REQ-501: 単価の割り算の境界（2r = d は切り上げ、2r < d は切り捨て）", () => {
    expect(divideRoundHalfUp(910 * 100, 130)).toBe(700);
    expect(divideRoundHalfUp(1000 * 100, 130)).toBe(769);
    expect(divideRoundHalfUp(1 * 100, 200)).toBe(1);
    expect(divideRoundHalfUp(1 * 100, 201)).toBe(0);
  });

  it("REQ-102: 価格の欄は 0 以上の整数で、上限超えを形式の error と区別する（X5・X6）", () => {
    expect(parsePriceInput("999999", MAX_SELLING_PRICE)).toBe(999999);
    expect(parsePriceInput(" 0 ", MAX_SELLING_PRICE)).toBe(0);
    expect(parsePriceInput("1000000", MAX_SELLING_PRICE)).toBe("too_large");
    expect(parsePriceInput("-1", MAX_COST_PRICE)).toBeNull();
    expect(parsePriceInput("1.5", MAX_COST_PRICE)).toBeNull();
    expect(parsePriceInput("", MAX_COST_PRICE)).toBeNull();
  });

  it("REQ-501: 再集計の和が安全な整数を外れたら null（X9）", () => {
    expect(addSafeInteger(9007199254740990, 1)).toBe(9007199254740991);
    expect(addSafeInteger(9007199254740991, 2)).toBeNull();
    expect(addSafeInteger(null, 1)).toBeNull();
    expect(addSafeInteger(-9007199254740991, -1)).toBeNull();
  });

  it("REQ-502: 数量の並べ替えは (count_points, length_cm) の辞書順", () => {
    const rows = [
      { count_points: 5, length_cm: 250 },
      { count_points: 3, length_cm: 0 },
      { count_points: 0, length_cm: 130 },
    ];
    expect([...rows].sort(compareQuantityPair)).toEqual([
      { count_points: 0, length_cm: 130 },
      { count_points: 3, length_cm: 0 },
      { count_points: 5, length_cm: 250 },
    ]);
  });
});
