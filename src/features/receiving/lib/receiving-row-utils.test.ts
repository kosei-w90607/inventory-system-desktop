import { describe, expect, it } from "vitest";

import { makeMockProductWithRelations } from "@/features/products/lib/test-fixtures";
import { addProductToRows } from "./receiving-row-utils";

describe("receiving-row-utils (UI-02-D6 / REQ-201)", () => {
  it("adds a new product row with quantity 1 and product cost", () => {
    const rows = addProductToRows(
      [],
      makeMockProductWithRelations({
        product_code: "P-001",
        name: "はさみ",
        cost_price_centi: 12000,
      }),
    );

    expect(rows).toEqual([
      {
        productCode: "P-001",
        productName: "はさみ",
        stockUnit: "pcs",
        quantity: "1",
        costPrice: "120",
      },
    ]);
  });

  it("increments quantity when the same product is added again", () => {
    const product = makeMockProductWithRelations({ product_code: "P-001" });
    const once = addProductToRows([], product);
    const twice = addProductToRows(once, product);

    expect(twice).toHaveLength(1);
    expect(twice[0].quantity).toBe("2");
  });
});

describe("receiving-row-utils の単位ごとの数量（REQ-201 / UI-02-D7 / SPEC-UNIT-D3）", () => {
  const readd = (stockUnit: "m" | "pcs", quantity: string) => {
    const product = makeMockProductWithRelations({ product_code: "P-U", stock_unit: stockUnit });
    const [row] = addProductToRows([], product);
    expect(row.quantity).toBe("1");
    return addProductToRows([{ ...row, quantity }], product)[0]?.quantity;
  };

  it("REQ-201: 再追加は m が +1 m（1.3 → 2.3、1.27 → 2.27）、個数は +1", () => {
    expect(readd("m", "1.3")).toBe("2.3");
    expect(readd("m", "1.27")).toBe("2.27");
    expect(readd("pcs", "3")).toBe("4");
  });

  it("REQ-201: 規則に合わない文字列の再追加は初期値の 1", () => {
    expect(readd("m", "abc")).toBe("1");
    expect(readd("m", "1.234")).toBe("1");
    expect(readd("pcs", "1.3")).toBe("1");
  });
});
