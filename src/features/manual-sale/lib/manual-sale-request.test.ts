import { describe, expect, it } from "vitest";

import type { ManualSaleFormValues } from "../types";
import { buildManualSaleRequest, buildManualSaleSignature } from "./manual-sale-request";

function createValues(overrides: Partial<ManualSaleFormValues> = {}): ManualSaleFormValues {
  return {
    saleDate: "2026-06-26",
    reason: "plu_unregistered",
    note: "",
    rows: [
      {
        productCode: "MS-001",
        productName: "新商品",
        departmentName: "布",
        stockUnit: "pcs",
        currentStockQuantity: 5,
        unitPrice: 120,
        quantity: "2",
        amount: "240",
        amountEdited: false,
      },
    ],
    ...overrides,
  };
}

describe("manual sale request builder (UI-04 / REQ-203)", () => {
  it("REQ-203 builds the generated createManualSale request shape", () => {
    const built = buildManualSaleRequest(createValues({ note: "店頭販売" }), "ms-key-1", null);

    expect(built.errors).toEqual({});
    expect(built.request).toEqual({
      idempotency_key: "ms-key-1",
      sale_date: "2026-06-26",
      reason: "plu_unregistered",
      note: "店頭販売",
      items: [{ product_code: "MS-001", quantity: 2, amount: 240 }],
      confirmation_token: null,
    });
  });

  it("REQ-203 blocks empty rows and invalid numeric fields before submit", () => {
    const built = buildManualSaleRequest(
      createValues({
        saleDate: "",
        rows: [
          {
            productCode: "MS-001",
            productName: "新商品",
            departmentName: "布",
            stockUnit: "pcs",
            currentStockQuantity: 5,
            unitPrice: 120,
            quantity: "1.5",
            amount: "-1",
            amountEdited: false,
          },
        ],
      }),
      "ms-key-1",
      null,
    );

    expect(built.request).toBeNull();
    expect(built.errors.saleDate).toBe("販売日は必須です");
    expect(built.errors.rows?.["MS-001"]).toBe(
      "数量は1以上の整数で入力してください / 販売金額は0以上の整数で入力してください",
    );
  });

  it("REQ-203 includes note in the UI signature so note edits create a new attempt", () => {
    const before = buildManualSaleSignature(createValues({ note: "" }));
    const after = buildManualSaleSignature(createValues({ note: "メモ変更" }));

    expect(after).not.toBe(before);
  });
});

describe("manual sale request の単位と上限（REQ-203 / UI-04-D18 / SPEC-UNIT-D3、X1）", () => {
  const build = (stockUnit: "m" | "cm" | "pcs", quantity: string, amount = "910") => {
    const base = createValues().rows[0];
    return buildManualSaleRequest(
      createValues({ rows: [{ ...base, stockUnit, quantity, amount }] }),
      "ms-key-u",
      null,
    );
  };

  it("UI-04-D18 (8): payload の数量は cm の整数（m の 1.3 は 130、cm の 130 は 130）", () => {
    expect(build("m", "1.3").request?.items).toEqual([
      { product_code: "MS-001", quantity: 130, amount: 910 },
    ]);
    expect(build("cm", "130").request?.items[0]?.quantity).toBe(130);
  });

  it("REQ-203: 数量は上限の端まで送れ、1 つ外と形式の error は request を作らない", () => {
    expect(build("pcs", "9999999").request?.items[0]?.quantity).toBe(9999999);
    expect(build("m", "99999.99").request?.items[0]?.quantity).toBe(9999999);
    expect(build("pcs", "10000000").errors.rows?.["MS-001"]).toBe("数量が大きすぎます");
    expect(build("m", "100000").errors.rows?.["MS-001"]).toBe("数量が大きすぎます");
    expect(build("m", "").errors.rows?.["MS-001"]).toBe(
      "数量は0.01以上で、小数は2桁までの m で入力してください",
    );
    // 数量が error の間、未編集の金額欄は空になる（保存は数量の error で止まる）
    expect(build("m", "", "").request).toBeNull();
  });
});
