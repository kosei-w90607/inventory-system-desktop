// src/features/disposal/lib/disposal-row-utils.test.ts
//
// REQ-204 / UI-05-D8 / SPEC-UNIT-D3: 廃棄の入力の行の再追加と統合（在庫の数量の整数で足す）。

import { describe, expect, it } from "vitest";

import { makeMockProductWithRelations } from "@/features/products/lib/test-fixtures";
import {
  addProductToDisposalRows,
  productToDisposalRow,
  updateDisposalRow,
} from "./disposal-row-utils";

const meter = makeMockProductWithRelations({ product_code: "DSP-M", stock_unit: "m" });
const centi = makeMockProductWithRelations({ product_code: "DSP-CM", stock_unit: "cm" });
const piece = makeMockProductWithRelations({ product_code: "DSP-PCS", stock_unit: "pcs" });

describe("disposal row utils (REQ-204 / UI-05-D8)", () => {
  it("REQ-204: 追加したときの数量の初期値はどの単位も 1（m は 1 m、cm は 1 cm）", () => {
    for (const product of [meter, centi, piece]) {
      expect(productToDisposalRow(product)).toMatchObject({
        stockUnit: product.stock_unit,
        quantity: "1",
      });
    }
  });

  it("REQ-204: 再追加は m が +1 m（1.3 → 2.3、1.27 → 2.27）、cm と個数は +1", () => {
    const readd = (product: typeof meter, quantity: string) => {
      const [row] = addProductToDisposalRows([], product);
      return addProductToDisposalRows([{ ...row, quantity }], product)[0]?.quantity;
    };
    expect(readd(meter, "1.3")).toBe("2.3");
    expect(readd(meter, "1.27")).toBe("2.27");
    expect(readd(centi, "130")).toBe("131");
    expect(readd(piece, "3")).toBe("4");
    // 規則に合わない文字列は初期値に戻す
    expect(readd(meter, "abc")).toBe("1");
    expect(readd(piece, "1.3")).toBe("1");
  });

  it("REQ-204: 種別と理由が同じ行の統合は cm の整数で足す（0.5 + 0.3 → 0.8、0.1 + 0.2 → 0.3）", () => {
    const merge = (product: typeof meter, base: string, addition: string) => {
      const first = { ...productToDisposalRow(product), rowId: "a", quantity: base };
      const second = {
        ...productToDisposalRow(product),
        rowId: "b",
        quantity: addition,
        reason: "汚れ",
      };
      const merged = updateDisposalRow([first, second], "b", { reason: "破損" });
      expect(merged).toHaveLength(1);
      return merged[0]?.quantity;
    };
    expect(merge(meter, "0.5", "0.3")).toBe("0.8");
    expect(merge(meter, "0.1", "0.2")).toBe("0.3");
    expect(merge(piece, "5", "2")).toBe("7");
    // 規則に合わない文字列の統合は統合先の元の値
    expect(merge(piece, "5", "abc")).toBe("5");
    expect(merge(meter, "0.5", "1.234")).toBe("0.5");
  });
});
