// src/features/monthly-sales/lib/compute-summary.test.ts

import { describe, it, expect } from "vitest";
import { computeMonthlySummary } from "./compute-summary";
import { makeMockMonthlyItem } from "./test-fixtures";

describe("computeMonthlySummary", () => {
  it("returns zeros for empty input", () => {
    expect(computeMonthlySummary([])).toEqual({
      totalAmount: 0,
      totalCountPoints: 0,
      totalLengthCm: 0,
    });
  });

  it("sums a single item", () => {
    const items = [makeMockMonthlyItem({ amount: 1234, count_points: 5 })];
    expect(computeMonthlySummary(items)).toEqual({
      totalAmount: 1234,
      totalCountPoints: 5,
      totalLengthCm: 0,
    });
  });

  it("sums multiple items", () => {
    const items = [
      makeMockMonthlyItem({ key: "A", amount: 1000, count_points: 2 }),
      makeMockMonthlyItem({ key: "B", amount: 2500, count_points: 5 }),
      makeMockMonthlyItem({ key: "C", amount: 500, count_points: 1 }),
    ];
    expect(computeMonthlySummary(items)).toEqual({
      totalAmount: 4000,
      totalCountPoints: 8,
      totalLengthCm: 0,
    });
  });

  it("accepts negative amount (返品超過月)", () => {
    const items = [
      makeMockMonthlyItem({ key: "A", amount: 1000, count_points: 2 }),
      makeMockMonthlyItem({ key: "B", amount: -500, count_points: -1 }),
    ];
    expect(computeMonthlySummary(items)).toEqual({
      totalAmount: 500,
      totalCountPoints: 1,
      totalLengthCm: 0,
    });
  });

  it("handles large item count", () => {
    const items = Array.from({ length: 500 }, (_, i) =>
      makeMockMonthlyItem({ key: `K${String(i)}`, amount: 10, count_points: 1 }),
    );
    expect(computeMonthlySummary(items)).toEqual({
      totalAmount: 5000,
      totalCountPoints: 500,
      totalLengthCm: 0,
    });
  });
});

// SPEC-UNIT-D3 の集計の規則（X9）: 月間販売点数は点と長さの 2 本
describe("computeMonthlySummary の数量の種類ごとの合計（SPEC-UNIT-D3）", () => {
  it("SPEC-UNIT-D3: 点と長さを別々に足す（長さを点に足さない）", () => {
    const items = [
      makeMockMonthlyItem({ key: "A", count_points: 3, length_cm: 0, stock_unit: "pcs" }),
      makeMockMonthlyItem({ key: "B", count_points: 2, length_cm: 0, stock_unit: "sheet" }),
      makeMockMonthlyItem({ key: "C", count_points: 0, length_cm: 130, stock_unit: "m" }),
      makeMockMonthlyItem({ key: "D", count_points: 0, length_cm: 50, stock_unit: "m" }),
    ];
    expect(computeMonthlySummary(items)).toMatchObject({ totalCountPoints: 5, totalLengthCm: 180 });
  });

  it("SPEC-UNIT-D3: 和が安全な整数を外れた欄だけ null、端は通す", () => {
    const item = (count_points: number, length_cm: number) =>
      makeMockMonthlyItem({
        key: `${String(count_points)}-${String(length_cm)}`,
        count_points,
        length_cm,
      });
    expect(computeMonthlySummary([item(9007199254740991, 0), item(2, 130)])).toMatchObject({
      totalCountPoints: null,
      totalLengthCm: 130,
    });
    expect(computeMonthlySummary([item(9007199254740990, 0), item(1, 0)])).toMatchObject({
      totalCountPoints: 9007199254740991,
      totalLengthCm: 0,
    });
  });
});
