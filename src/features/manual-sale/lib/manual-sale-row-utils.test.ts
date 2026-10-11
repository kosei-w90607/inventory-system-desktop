import { describe, expect, it } from "vitest";

import { makeMockProductWithRelations } from "@/features/products/lib/test-fixtures";
import type { ProductStockUnit } from "@/lib/bindings";
import {
  addProductToManualSaleRows,
  productToManualSaleRow,
  updateManualSaleRow,
} from "./manual-sale-row-utils";

describe("manual sale row utils (UI-04 / REQ-203)", () => {
  it("REQ-203 maps a product to a manual sale row with selling price as initial amount", () => {
    const row = productToManualSaleRow(
      makeMockProductWithRelations({
        product_code: "MS-001",
        name: "新商品",
        department_name: "布",
        selling_price: 120,
        stock_quantity: 3,
        stock_unit: "cm",
      }),
    );

    expect(row).toMatchObject({
      productCode: "MS-001",
      productName: "新商品",
      departmentName: "布",
      stockUnit: "cm",
      currentStockQuantity: 3,
      unitPrice: 120,
      quantity: "100",
      amount: "120",
    });
  });

  it("REQ-203 merges duplicate product codes by incrementing quantity and amount", () => {
    const product = makeMockProductWithRelations({
      product_code: "MS-001",
      selling_price: 150,
    });

    const rows = addProductToManualSaleRows(addProductToManualSaleRows([], product), product);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ productCode: "MS-001", quantity: "2", amount: "300" });
  });
});

// UI-04-D18 / SPEC-UNIT-D7（X11）: 数量の初期値は価格の基準数量ぶん、金額は式で求め、
// 長さの商品は未編集の間だけ数量に追従する。期待は 700 円の商品の例を正本から写したもの。
describe("manual sale row utils の数量と金額（UI-04-D18 / REQ-203）", () => {
  const product = (stockUnit: ProductStockUnit) =>
    makeMockProductWithRelations({
      product_code: "MS-U",
      selling_price: 700,
      stock_unit: stockUnit,
    });
  const added = (stockUnit: ProductStockUnit) => addProductToManualSaleRows([], product(stockUnit));
  const setQuantity = (rows: ReturnType<typeof added>, quantity: string) =>
    updateManualSaleRow(rows, "MS-U", { quantity });
  const setAmount = (rows: ReturnType<typeof added>, amount: string) =>
    updateManualSaleRow(rows, "MS-U", { amount });
  const readd = (rows: ReturnType<typeof added>, stockUnit: ProductStockUnit) =>
    addProductToManualSaleRows(rows, product(stockUnit));

  it("UI-04-D18 (1): 追加したときの数量は個数 1・m 1・cm 100、金額は 700", () => {
    expect(added("pcs")[0]).toMatchObject({ quantity: "1", amount: "700", amountEdited: false });
    expect(added("m")[0]).toMatchObject({ quantity: "1", amount: "700", amountEdited: false });
    expect(added("cm")[0]).toMatchObject({ quantity: "100", amount: "700", amountEdited: false });
  });

  it("UI-04-D18 (2): 未編集の長さの商品は数量に合わせて金額を求め直し、個数の商品は変えない", () => {
    expect(setQuantity(added("m"), "1.3")[0]).toMatchObject({ quantity: "1.3", amount: "910" });
    expect(setQuantity(added("cm"), "130")[0]).toMatchObject({ quantity: "130", amount: "910" });
    expect(setQuantity(added("pcs"), "3")[0]).toMatchObject({ quantity: "3", amount: "700" });
  });

  it("UI-04-D18 (2): 金額は円未満を四捨五入する（333 円 × 1.3 m → 433、× 1.25 m → 416）", () => {
    const rows = addProductToManualSaleRows(
      [],
      makeMockProductWithRelations({ product_code: "MS-U", selling_price: 333, stock_unit: "m" }),
    );
    expect(setQuantity(rows, "1.3")[0]?.amount).toBe("433");
    expect(setQuantity(rows, "1.25")[0]?.amount).toBe("416");
    expect(setQuantity(rows, "0.01")[0]?.amount).toBe("3");
  });

  it("UI-04-D18 (3): 金額を編集した後は数量を変えても金額を変えない", () => {
    const edited = setAmount(added("m"), "800");
    expect(edited[0]).toMatchObject({ amount: "800", amountEdited: true });
    expect(setQuantity(edited, "2")[0]).toMatchObject({ quantity: "2", amount: "800" });
  });

  it("UI-04-D18 (4): 未編集の長さの商品の再追加は数量に基準数量ぶんを足し、金額を式で求め直す", () => {
    expect(readd(setQuantity(added("m"), "1.3"), "m")[0]).toMatchObject({
      quantity: "2.3",
      amount: "1610",
    });
    expect(readd(setQuantity(added("cm"), "130"), "cm")[0]).toMatchObject({
      quantity: "230",
      amount: "1610",
    });
  });

  it("UI-04-D18 (5): 個数の商品の再追加は今どおり +1 と売価の加算", () => {
    expect(readd(added("pcs"), "pcs")[0]).toMatchObject({ quantity: "2", amount: "1400" });
  });

  it("UI-04-D18 (6): 金額を編集した長さの商品の再追加は数量に基準数量ぶん、金額は売価を足す", () => {
    const edited = setAmount(setQuantity(added("m"), "1.3"), "800");
    expect(readd(edited, "m")[0]).toMatchObject({ quantity: "2.3", amount: "1500" });
  });

  it("UI-04-D18 (7): 数量が入力の error の間、未編集の長さの商品の金額欄は空で、直せば式の値に戻る", () => {
    for (const quantity of ["", "0", "1.234", "100000"]) {
      const broken = setQuantity(added("m"), quantity);
      expect(broken[0]).toMatchObject({ quantity, amount: "" });
      expect(setQuantity(broken, "1.3")[0]?.amount).toBe("910");
    }
    // 金額を編集済みの行は数量が error でも金額を変えない
    expect(setQuantity(setAmount(added("m"), "800"), "")[0]?.amount).toBe("800");
  });

  it("UI-04-D18: 規則に合わない数量の再追加はその画面の初期値（cm は 100）", () => {
    expect(readd(setQuantity(added("cm"), "abc"), "cm")[0]).toMatchObject({
      quantity: "100",
      amount: "700",
    });
    expect(readd(setQuantity(added("pcs"), "abc"), "pcs")[0]).toMatchObject({ quantity: "1" });
  });
});
