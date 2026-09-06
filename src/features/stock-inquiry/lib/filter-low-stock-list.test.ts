// src/features/stock-inquiry/lib/filter-low-stock-list.test.ts
//
// REQ-302: filterAndSortLowStockList の status / q / dept sub-filter + sort 検証。
// 設計: docs/function-design/58-ui-stock-inquiry.md §58.6

import { describe, it, expect } from "vitest";
import { filterAndSortLowStockList } from "./filter-low-stock-list";
import { makeMockProductWithRelations } from "./test-fixtures";

const items = [
  makeMockProductWithRelations({
    product_code: "A-001",
    name: "毛糸 赤",
    jan_code: "4900000000001",
    department_id: 1,
    stock_quantity: 0,
  }),
  makeMockProductWithRelations({
    product_code: "A-002",
    name: "毛糸 青",
    jan_code: "4900000000002",
    department_id: 1,
    stock_quantity: 2,
  }),
  makeMockProductWithRelations({
    product_code: "B-001",
    name: "布 白",
    jan_code: null,
    department_id: 2,
    stock_quantity: 0,
  }),
  makeMockProductWithRelations({
    product_code: "B-002",
    name: "布 黒",
    jan_code: "4900000000004",
    department_id: 2,
    stock_quantity: 5,
  }),
];

describe("filterAndSortLowStockList (REQ-302 sub-filter)", () => {
  it("REQ-302: status=stockout は stock<=0 のみ（取引先はいずれも null のため在庫数→商品名でソートされる）", () => {
    const result = filterAndSortLowStockList(items, "", null, "stockout");
    // A-001/B-001 とも stock=0・supplier_name=null のため tie-break は商品名（localeCompare）。
    // "布 白" < "毛糸 赤" のため入力順とは逆順になる。
    expect(result.map((p) => p.product_code)).toEqual(["B-001", "A-001"]);
  });

  it("REQ-302: status=low_stock は stock>0 のみ", () => {
    const result = filterAndSortLowStockList(items, "", null, "low_stock");
    expect(result.map((p) => p.product_code)).toEqual(["A-002", "B-002"]);
  });

  it("REQ-302: dept 絞り込み（department_id 一致）", () => {
    const result = filterAndSortLowStockList(items, "", 2, "stockout");
    expect(result.map((p) => p.product_code)).toEqual(["B-001"]);
  });

  it("REQ-302: q 部分一致（商品名）", () => {
    const result = filterAndSortLowStockList(items, "毛糸", null, "low_stock");
    expect(result.map((p) => p.product_code)).toEqual(["A-002"]);
  });

  it("REQ-302: q 部分一致（商品コード、大文字小文字非依存）", () => {
    const result = filterAndSortLowStockList(items, "b-00", null, "stockout");
    expect(result.map((p) => p.product_code)).toEqual(["B-001"]);
  });

  it("REQ-302: q 部分一致（JAN、null jan_code は除外）", () => {
    const result = filterAndSortLowStockList(items, "4900000000002", null, "low_stock");
    expect(result.map((p) => p.product_code)).toEqual(["A-002"]);
  });

  it("REQ-302: status + dept + q 複合条件", () => {
    const result = filterAndSortLowStockList(items, "毛糸", 1, "low_stock");
    expect(result.map((p) => p.product_code)).toEqual(["A-002"]);
  });

  it("REQ-302: 該当なしは空配列", () => {
    expect(filterAndSortLowStockList(items, "存在しない", null, "low_stock")).toEqual([]);
    expect(filterAndSortLowStockList([], "", null, "stockout")).toEqual([]);
  });
});

describe("filterAndSortLowStockList (UI-06a-D4 取引先名優先ソート)", () => {
  // SC1: 取引先名昇順（null 最後）→ 在庫数昇順 → 商品名昇順。
  // 期待順序は production のソート関数から独立に手で転記する。
  const sortItems = [
    makeMockProductWithRelations({
      product_code: "S-001",
      name: "いち",
      department_id: 1,
      supplier_name: "取引先B",
      stock_quantity: 5,
    }),
    makeMockProductWithRelations({
      product_code: "S-002",
      name: "あ",
      department_id: 1,
      supplier_name: "取引先A",
      stock_quantity: 10,
    }),
    makeMockProductWithRelations({
      product_code: "S-003",
      name: "さん",
      department_id: 1,
      supplier_name: "取引先A",
      stock_quantity: 3,
    }),
    makeMockProductWithRelations({
      product_code: "S-004",
      name: "よん",
      department_id: 1,
      supplier_name: null,
      stock_quantity: 1,
    }),
    makeMockProductWithRelations({
      product_code: "S-005",
      name: "た",
      department_id: 1,
      supplier_name: "取引先A",
      stock_quantity: 1,
    }),
  ];

  it("SC1: 取引先名昇順（null 最後）→ 在庫数昇順 → 商品名昇順で安定ソートする", () => {
    const result = filterAndSortLowStockList(sortItems, "", null, "low_stock");
    // 取引先A 内は在庫数昇順で S-005(1) < S-003(3) < S-002(10)。
    // 商品名は「あ」(S-002) < 「さん」(S-003) < 「た」(S-005) と逆順になるよう意図的に
    // 在庫数と商品名の大小関係を食い違わせてあり、比較優先順位を
    // 入れ替える mutant（商品名優先）ではこの期待順にならない。
    // → 取引先B（S-001）→ 取引先なし（S-004、null は最後）
    expect(result.map((p) => p.product_code)).toEqual([
      "S-005",
      "S-003",
      "S-002",
      "S-001",
      "S-004",
    ]);
  });
});
