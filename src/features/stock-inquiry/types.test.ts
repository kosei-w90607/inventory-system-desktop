// src/features/stock-inquiry/types.test.ts
//
// SPEC-UIBB-3: 在庫照会 `page` search param の検証契約（>=1、invalid catch → 1）。
// 設計: docs/function-design/58-ui-stock-inquiry.md §58.4

import { describe, expect, it } from "vitest";
import { stockInquirySearchSchema } from "./types";

describe("stockInquirySearchSchema (REQ-301 / SPEC-UIBB-3)", () => {
  it.each([
    ["0", { page: 0 }],
    ["負数", { page: -1 }],
    ["小数", { page: 1.5 }],
    ["非数値文字列", { page: "abc" }],
    ["欠落", {}],
  ])("SPEC-UIBB-3 pageの不正値は既定1に落ちる（%s）", (_label, input) => {
    const result = stockInquirySearchSchema.parse(input);
    // schema は catch(undefined) で吸収する。呼び出し側（StockInquiryPage）は
    // `page ?? 1` で既定 1 に落とす（58 §58.4 / 50 §50.4 と同型）。
    expect(result.page).toBeUndefined();
    expect(result.page ?? 1).toBe(1);
  });

  it("SPEC-UIBB-3 正の整数はそのまま通す", () => {
    expect(stockInquirySearchSchema.parse({ page: 3 }).page).toBe(3);
  });
});

describe("stockInquirySearchSchema.selected (REQ-301 / SPEC-RETURNTO-HYGIENE-2026-09-17 T7)", () => {
  it("21文字以上の商品コードを落とさない", () => {
    const code21 = "A".repeat(21);
    expect(stockInquirySearchSchema.parse({ selected: code21 }).selected).toBe(code21);
  });

  it("101文字以上はundefinedへ落ちる", () => {
    const code101 = "A".repeat(101);
    expect(stockInquirySearchSchema.parse({ selected: code101 }).selected).toBeUndefined();
  });

  it("100文字はそのまま通す", () => {
    const code100 = "A".repeat(100);
    expect(stockInquirySearchSchema.parse({ selected: code100 }).selected).toBe(code100);
  });
});
