// src/features/monthly-sales/lib/compute-composition.test.ts

import { describe, it, expect } from "vitest";
import { computeDeptComposition } from "./compute-composition";
import { makeMockMonthlyItem } from "./test-fixtures";

describe("computeDeptComposition", () => {
  it("returns empty array for empty input", () => {
    expect(computeDeptComposition([])).toEqual([]);
  });

  it("computes ratio 1.0 for a single item", () => {
    const items = [makeMockMonthlyItem({ key: "1", label: "毛糸", amount: 1000 })];
    const rows = computeDeptComposition(items);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.ratio).toBe(1);
  });

  it("computes ratios summing to 1.0", () => {
    const items = [
      makeMockMonthlyItem({ key: "1", amount: 400 }),
      makeMockMonthlyItem({ key: "2", amount: 600 }),
    ];
    const rows = computeDeptComposition(items);
    expect(rows.map((r) => r.ratio)).toEqual([0.4, 0.6]);
  });

  it("handles fractional ratios accurately", () => {
    const items = [
      makeMockMonthlyItem({ key: "1", amount: 333 }),
      makeMockMonthlyItem({ key: "2", amount: 333 }),
      makeMockMonthlyItem({ key: "3", amount: 334 }),
    ];
    const rows = computeDeptComposition(items);
    const total = rows.reduce((acc, r) => acc + r.ratio, 0);
    expect(total).toBeCloseTo(1, 5);
  });

  it("returns ratio: 0 for all items when grand_total === 0 (除算ガード)", () => {
    const items = [
      makeMockMonthlyItem({ key: "1", amount: 0 }),
      makeMockMonthlyItem({ key: "2", amount: 0 }),
    ];
    const rows = computeDeptComposition(items);
    expect(rows.every((r) => r.ratio === 0)).toBe(true);
  });

  it("attaches prev_month_diff from comparisonMap when isComparable", () => {
    const items = [makeMockMonthlyItem({ key: "1", amount: 1000 })];
    const map = new Map([["1", { prevAmount: 800, diff: 200, ratio: 0.25, isComparable: true }]]);
    const rows = computeDeptComposition(items, map);
    expect(rows[0]?.prev_month_diff).toBe(200);
  });

  it("sets prev_month_diff to null when comparisonMap entry isComparable: false", () => {
    const items = [makeMockMonthlyItem({ key: "1", amount: 1000 })];
    const map = new Map([
      ["1", { prevAmount: -500, diff: null, ratio: null, isComparable: false }],
    ]);
    const rows = computeDeptComposition(items, map);
    expect(rows[0]?.prev_month_diff).toBe(null);
  });
});

describe("computeDeptComposition の数量（SPEC-UNIT-D3）", () => {
  it("SPEC-UNIT-D3: 部門の点と長さの 2 本を行へ運ぶ（数量を捨てない）", () => {
    const rows = computeDeptComposition([
      makeMockMonthlyItem({ key: "1", count_points: 5, length_cm: 250, stock_unit: null }),
      makeMockMonthlyItem({ key: "2", count_points: 0, length_cm: 130, stock_unit: null }),
    ]);
    expect(rows.map(({ count_points, length_cm }) => ({ count_points, length_cm }))).toEqual([
      { count_points: 5, length_cm: 250 },
      { count_points: 0, length_cm: 130 },
    ]);
  });
});
