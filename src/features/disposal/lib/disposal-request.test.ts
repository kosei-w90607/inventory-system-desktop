// src/features/disposal/lib/disposal-request.test.ts
//
// REQ-204 / UI-05-D8 / SPEC-UNIT-D6・D9: 廃棄の画面のロス原価合計の twin と、数量・原価の入力の検証。
// golden の値は Rust の `cost_line_centi`・`cost_total_yen` の test と同じ例を独立に写している。

import { describe, expect, it } from "vitest";

import type { ProductStockUnit } from "@/lib/bindings";
import type { DisposalRow } from "../types";
import { buildDisposalRequest, calculateLossTotal } from "./disposal-request";

function row(
  stockUnit: ProductStockUnit,
  quantity: string,
  costPrice: string,
  index = 0,
): DisposalRow {
  return {
    rowId: `row-${String(index)}`,
    productCode: `DSP-${String(index)}`,
    productName: "合成商品",
    departmentName: "部門",
    stockUnit,
    currentStockQuantity: 0,
    defaultCostPrice: 0,
    disposalType: "damage",
    quantity,
    costPrice,
    reason: "破損",
  };
}

describe("calculateLossTotal (REQ-204 / SPEC-UNIT-D6 の twin)", () => {
  it("REQ-204: 行を 1/100 円にしてから足し、合計を円未満で四捨五入する（m・cm・pcs の伝票 → 173 円）", () => {
    // 0.5 m × 333 円/m = 166.50、50 cm × 1 円/m = 0.50、3 個 × 2 円 = 6.00 → 173.00 円
    // （行ごとに円へ丸めてから足すと 167 + 1 + 6 = 174 円）
    expect(
      calculateLossTotal([row("m", "0.5", "333"), row("cm", "50", "1"), row("pcs", "3", "2")]),
    ).toBe(173);
  });

  it("REQ-204: 長さの商品は 1 m あたりの原価で求める（0.5 m × 333 円 → 167 円、2.5 m × 333 円 → 833 円）", () => {
    expect(calculateLossTotal([row("m", "0.5", "333")])).toBe(167);
    expect(calculateLossTotal([row("m", "2.5", "333")])).toBe(833);
    expect(calculateLossTotal([row("cm", "250", "333")])).toBe(833);
  });

  it("REQ-204: 個数の商品は今と同じ額（2 × 120 = 240 円）で、入力の error の行は数えない", () => {
    expect(calculateLossTotal([row("pcs", "2", "120")])).toBe(240);
    expect(
      calculateLossTotal([
        row("pcs", "2", "120"),
        row("pcs", "abc", "50"),
        row("m", "1.234", "50"),
      ]),
    ).toBe(240);
    expect(calculateLossTotal([])).toBe(0);
  });

  it("REQ-204: 行の丸めの境界（1 円 × 1 cm ÷ 100 = 0.01 円、0.5 銭は切り上げ）", () => {
    // 1 円/m × 1 cm = 1/100 円 → 1 centi。合計 0.01 円 → 0 円
    expect(calculateLossTotal([row("cm", "1", "1")])).toBe(0);
    // 1 円/m × 50 cm = 50 centi → 0.50 円 → 1 円
    expect(calculateLossTotal([row("cm", "50", "1")])).toBe(1);
    expect(calculateLossTotal([row("cm", "49", "1")])).toBe(0);
  });

  it("REQ-204: 上限の明細 900 行は安全な整数の中、901 行は範囲外で null（X8、number で足さない）", () => {
    const rows = (count: number) =>
      Array.from({ length: count }, (_, index) => row("pcs", "9999999", "999999", index));
    expect(calculateLossTotal(rows(900))).toBe(8999990100000900);
    expect(calculateLossTotal(rows(901))).toBeNull();
  });
});

describe("buildDisposalRequest (REQ-204 / UI-05-D8 の数量と原価の検証)", () => {
  const build = (rows: DisposalRow[]) =>
    buildDisposalRequest({ disposalDate: "2026-07-29", rows }, "disposal-key");

  it("REQ-204: m の商品の数量は cm の整数にして送る（0.5 → 50）", () => {
    const result = build([row("m", "0.5", "333")]);
    expect(result.errors).toEqual({});
    expect(result.request?.items).toEqual([
      {
        product_code: "DSP-0",
        disposal_type: "damage",
        quantity: 50,
        cost_price: 333,
        reason: "破損",
      },
    ]);
  });

  it("REQ-204: 数量と原価の上限の端は送れ、1 つ外は入力の error（X1・X6）", () => {
    expect(build([row("pcs", "9999999", "999999")]).request?.items[0]).toMatchObject({
      quantity: 9999999,
      cost_price: 999999,
    });
    expect(build([row("m", "99999.99", "0")]).request?.items[0]).toMatchObject({
      quantity: 9999999,
    });
    expect(build([row("pcs", "10000000", "1")]).errors.rows?.["row-0"]).toBe("数量が大きすぎます");
    expect(build([row("cm", "10000000", "1")]).errors.rows?.["row-0"]).toBe("数量が大きすぎます");
    expect(build([row("m", "100000", "1")]).errors.rows?.["row-0"]).toBe("数量が大きすぎます");
    expect(build([row("pcs", "1", "1000000")]).errors.rows?.["row-0"]).toBe("原価が大きすぎます");
    expect(build([row("pcs", "1", "1000000")]).request).toBeNull();
  });

  it("REQ-204: 形式の error の文は単位で決まる（m は m の文、個数と cm は今の文）", () => {
    expect(build([row("m", "1.234", "1")]).errors.rows?.["row-0"]).toBe(
      "数量は0.01以上で、小数は2桁までの m で入力してください",
    );
    expect(build([row("m", "0", "1")]).errors.rows?.["row-0"]).toBe(
      "数量は0.01以上で、小数は2桁までの m で入力してください",
    );
    expect(build([row("cm", "1.5", "1")]).errors.rows?.["row-0"]).toBe(
      "数量は1以上の整数で入力してください",
    );
    expect(build([row("pcs", "0", "-1")]).errors.rows?.["row-0"]).toBe(
      "数量は1以上の整数で入力してください / 原価は0以上の整数で入力してください",
    );
  });
});
