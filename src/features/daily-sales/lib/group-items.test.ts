// src/features/daily-sales/lib/group-items.test.ts
//
// groupItemsByDepartment 純関数の unit test (5 ケース)。
// 設計: docs/function-design/56-ui-daily-sales.md §56.9

import { describe, it, expect } from "vitest";
import { groupItemsByDepartment } from "./group-items";
import { makeMockItem } from "./test-fixtures";

describe("groupItemsByDepartment", () => {
  it("returns empty array for empty input", () => {
    expect(groupItemsByDepartment([])).toEqual([]);
  });

  it("groups single department correctly with subtotal", () => {
    const items = [
      makeMockItem({ department_id: 1, department_name: "毛糸", quantity: 2, amount: 200 }),
      makeMockItem({ department_id: 1, department_name: "毛糸", quantity: 3, amount: 300 }),
    ];
    const groups = groupItemsByDepartment(items);
    expect(groups).toHaveLength(1);
    expect(groups[0]?.departmentId).toBe(1);
    expect(groups[0]?.subtotal.count_points).toBe(5);
    expect(groups[0]?.subtotal.length_cm).toBe(0);
    expect(groups[0]?.subtotal.amount).toBe(500);
  });

  it("groups multiple departments with separate subtotals", () => {
    const items = [
      makeMockItem({ department_id: 1, department_name: "毛糸", quantity: 1, amount: 100 }),
      makeMockItem({ department_id: 2, department_name: "ボタン", quantity: 5, amount: 500 }),
    ];
    const groups = groupItemsByDepartment(items);
    expect(groups).toHaveLength(2);
    expect(groups[0]?.subtotal.amount).toBe(100);
    expect(groups[1]?.subtotal.amount).toBe(500);
  });

  it("sorts groups by department_id ascending (BIZ-05 order)", () => {
    const items = [
      makeMockItem({ department_id: 3, department_name: "C" }),
      makeMockItem({ department_id: 1, department_name: "A" }),
      makeMockItem({ department_id: 2, department_name: "B" }),
    ];
    const groups = groupItemsByDepartment(items);
    expect(groups.map((g) => g.departmentId)).toEqual([1, 2, 3]);
  });

  it("preserves item order within a section (no reordering)", () => {
    const items = [
      makeMockItem({ product_code: "P1", department_id: 1 }),
      makeMockItem({ product_code: "P2", department_id: 1 }),
      makeMockItem({ product_code: "P3", department_id: 1 }),
    ];
    const groups = groupItemsByDepartment(items);
    expect(groups[0]?.items.map((i) => i.product_code)).toEqual(["P1", "P2", "P3"]);
  });
});

// SPEC-UNIT-D3 の集計の規則（TD-206/207、X9）: 個数は点、長さは cm の 2 本
describe("groupItemsByDepartment の数量の種類ごとの小計（SPEC-UNIT-D3）", () => {
  it("SPEC-UNIT-D3: pcs 3・sheet 2・m 130・m 50 の部門は 5 点と 180 cm（長さを点に足さない）", () => {
    const [section] = groupItemsByDepartment([
      makeMockItem({ stock_unit: "pcs", quantity: 3 }),
      makeMockItem({ stock_unit: "sheet", quantity: 2 }),
      makeMockItem({ stock_unit: "m", quantity: 130 }),
      makeMockItem({ stock_unit: "m", quantity: 50 }),
    ]);
    expect(section.subtotal).toMatchObject({ count_points: 5, length_cm: 180 });
  });

  it("SPEC-UNIT-D3: 個数だけの部門は長さ 0、長さだけの部門は点 0", () => {
    const sections = groupItemsByDepartment([
      makeMockItem({ department_id: 1, stock_unit: "pcs", quantity: 3 }),
      makeMockItem({ department_id: 1, stock_unit: "ball", quantity: 2 }),
      makeMockItem({ department_id: 2, stock_unit: "m", quantity: 130 }),
    ]);
    expect(sections[0]?.subtotal).toMatchObject({ count_points: 5, length_cm: 0 });
    expect(sections[1]?.subtotal).toMatchObject({ count_points: 0, length_cm: 130 });
  });

  it("SPEC-UNIT-D3: 和が安全な整数を外れた欄だけ null（9007199254740991 + 2）、端は通す", () => {
    const [over] = groupItemsByDepartment([
      makeMockItem({ stock_unit: "pcs", quantity: 9007199254740991 }),
      makeMockItem({ stock_unit: "pcs", quantity: 2 }),
      makeMockItem({ stock_unit: "m", quantity: 130 }),
    ]);
    expect(over.subtotal).toMatchObject({ count_points: null, length_cm: 130 });
    const [edge] = groupItemsByDepartment([
      makeMockItem({ stock_unit: "m", quantity: 9007199254740990 }),
      makeMockItem({ stock_unit: "m", quantity: 1 }),
    ]);
    expect(edge.subtotal).toMatchObject({ count_points: 0, length_cm: 9007199254740991 });
  });
});
