import { describe, expect, it } from "vitest";

import { makeMockProductWithRelations } from "@/features/products/lib/test-fixtures";
import {
  addProductToReturnRows,
  changeReturnRowDirection,
  productToReturnRow,
} from "./return-exchange-row-utils";

describe("return exchange row utils (UI-03 / REQ-202)", () => {
  it("REQ-202 maps a product to a return row with direction and current stock", () => {
    const row = productToReturnRow(
      makeMockProductWithRelations({
        product_code: "RT-001",
        name: "交換商品",
        department_name: "布",
        stock_quantity: 12,
        stock_unit: "m",
      }),
      "out",
    );

    expect(row).toMatchObject({
      productCode: "RT-001",
      productName: "交換商品",
      departmentName: "布",
      stockUnit: "m",
      currentStockQuantity: 12,
      direction: "out",
      quantity: "1",
    });
  });

  it("REQ-202 increments duplicate product by product code and direction", () => {
    const product = makeMockProductWithRelations({ product_code: "RT-001" });
    const rows = addProductToReturnRows(
      addProductToReturnRows(addProductToReturnRows([], product, "in"), product, "out"),
      product,
      "in",
    );

    expect(rows).toHaveLength(2);
    expect(rows.find((row) => row.direction === "in")).toMatchObject({
      productCode: "RT-001",
      quantity: "2",
    });
    expect(rows.find((row) => row.direction === "out")).toMatchObject({
      productCode: "RT-001",
      quantity: "1",
    });
  });

  it("REQ-202 merges quantities when direction change collides with an existing product direction", () => {
    const product = makeMockProductWithRelations({ product_code: "RT-001" });
    const rows = addProductToReturnRows(addProductToReturnRows([], product, "in"), product, "out");

    const changed = changeReturnRowDirection(rows, "RT-001", "out", "in");

    expect(changed).toHaveLength(1);
    expect(changed[0]).toMatchObject({ productCode: "RT-001", direction: "in", quantity: "2" });
  });
});

describe("return exchange row utils の単位ごとの数量（REQ-202 / UI-03-D12 / SPEC-UNIT-D3）", () => {
  const meter = makeMockProductWithRelations({ product_code: "RT-M", stock_unit: "m" });
  const pieces = makeMockProductWithRelations({ product_code: "RT-PCS", stock_unit: "pcs" });

  it("REQ-202: 再追加は m が +1 m（1.3 → 2.3）、個数は +1（3 → 4）", () => {
    const readd = (product: typeof meter, quantity: string) =>
      addProductToReturnRows([{ ...productToReturnRow(product, "in"), quantity }], product, "in")[0]
        ?.quantity;
    expect(productToReturnRow(meter, "in").quantity).toBe("1");
    expect(readd(meter, "1.3")).toBe("2.3");
    expect(readd(pieces, "3")).toBe("4");
    expect(readd(meter, "abc")).toBe("1");
  });

  it("REQ-202: 方向の切替えの合算は cm の整数で足す（0.5 + 0.3 → 0.8、0.1 + 0.2 → 0.3）", () => {
    const merge = (left: string, right: string) =>
      changeReturnRowDirection(
        [
          { ...productToReturnRow(meter, "in"), quantity: left },
          { ...productToReturnRow(meter, "out"), quantity: right },
        ],
        "RT-M",
        "out",
        "in",
      );
    expect(merge("0.5", "0.3")).toMatchObject([{ direction: "in", quantity: "0.8" }]);
    expect(merge("0.1", "0.2")).toMatchObject([{ direction: "in", quantity: "0.3" }]);
    // 規則に合わない文字列の合算は今どおり "1"
    expect(merge("0.5", "abc")).toMatchObject([{ direction: "in", quantity: "1" }]);
  });
});
