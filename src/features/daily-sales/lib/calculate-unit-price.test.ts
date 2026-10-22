// src/features/daily-sales/lib/calculate-unit-price.test.ts
//
// calculateEffectiveUnitPrice 純関数の unit test (5 ケース、user Option 1.5)。
// 設計: docs/function-design/56-ui-daily-sales.md §56.9 + §56.10 単価派生

import { describe, it, expect } from "vitest";
import { calculateEffectiveUnitPrice } from "./calculate-unit-price";
import { makeMockItem } from "./test-fixtures";

describe("calculateEffectiveUnitPrice", () => {
  it("returns 594 for amount=2376, quantity=4", () => {
    expect(calculateEffectiveUnitPrice(makeMockItem({ amount: 2376, quantity: 4 }))).toBe(594);
  });

  it("returns 594 for return row (amount=-594, quantity=-1, abs values)", () => {
    expect(calculateEffectiveUnitPrice(makeMockItem({ amount: -594, quantity: -1 }))).toBe(594);
  });

  it("returns 1001 for amount=2002, quantity=2", () => {
    expect(calculateEffectiveUnitPrice(makeMockItem({ amount: 2002, quantity: 2 }))).toBe(1001);
  });

  it("rounds 1000/3 to 333 (Math.round, 0.333... → 333)", () => {
    expect(calculateEffectiveUnitPrice(makeMockItem({ amount: 1000, quantity: 3 }))).toBe(333);
  });

  it("returns null when quantity is 0 (displays as «—» placeholder)", () => {
    expect(calculateEffectiveUnitPrice(makeMockItem({ quantity: 0 }))).toBeNull();
  });
});

// SPEC-UNIT-D3 の単価: |金額| × 基準数量 ÷ |数量| を円未満で四捨五入（長さは 1 m あたり）
describe("calculateEffectiveUnitPrice の単位（SPEC-UNIT-D3）", () => {
  it("SPEC-UNIT-D3: 長さの商品は 1 m あたり（910 円 ÷ 130 cm → 700）", () => {
    const price = (stock_unit: "m" | "pcs", amount: number, quantity: number) =>
      calculateEffectiveUnitPrice(makeMockItem({ stock_unit, amount, quantity }));
    expect(price("m", 910, 130)).toBe(700);
    expect(price("m", -910, -130)).toBe(700);
    expect(price("m", 1000, 130)).toBe(769);
    expect(price("m", 1, 200)).toBe(1);
    expect(price("pcs", 2100, 3)).toBe(700);
    expect(price("m", 910, 0)).toBeNull();
  });
});
