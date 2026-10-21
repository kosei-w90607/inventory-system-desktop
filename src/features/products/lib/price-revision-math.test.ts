import { describe, expect, it } from "vitest";

import { deriveProposedCost, formatMarkupRate, isRevisedToday } from "./price-revision-math";

describe("price revision math UI-14 / REQ-105", () => {
  // 原価は 1/100 円（Y8）。円の golden の各行の原価を ×100、案を ×100 にした値（Matrix T5）
  it("deriveProposedCost は 1 円未満を切り捨てる", () => {
    expect(deriveProposedCost(1200, 70000, 1000)).toBe(84000);
    expect(deriveProposedCost(1250, 33300, 1000)).toBe(41600);
    expect(deriveProposedCost(999, 70000, 1000)).toBe(69900);
    expect(deriveProposedCost(1001, 99900, 1000)).toBe(99900);
  });

  it("Matrix C15: 77 の例（現原価 83.33 円・現売価 100・新売価 110 → 91 円）と、原価を円に丸めない例", () => {
    expect(deriveProposedCost(110, 8333, 100)).toBe(9100);
    expect(deriveProposedCost(110, 8500, 100)).toBe(9300);
    // 原価を円に丸めてから掛けると 9900 になる
    expect(deriveProposedCost(120, 8349, 100)).toBe(10000);
    expect(formatMarkupRate(8333, 100)).toBe("83.3");
    expect(formatMarkupRate(8500, 100)).toBe("85.0");
  });

  it("deriveProposedCost は現売価 0 で現原価を返す", () => {
    expect(deriveProposedCost(1200, 70000, 0)).toBe(70000);
    expect(deriveProposedCost(110, 8333, 0)).toBe(8333);
  });

  it("deriveProposedCost は上限の積（999999 × 99999999）でも exact に計算する", () => {
    expect(deriveProposedCost(999_999, 99_999_999, 1)).toBe(99_999_899_000_000);
  });

  it("formatMarkupRate は小数 1 桁に四捨五入する", () => {
    expect(formatMarkupRate(70000, 1000)).toBe("70.0");
    expect(formatMarkupRate(33300, 1000)).toBe("33.3");
    expect(formatMarkupRate(100, 16)).toBe("6.3");
    expect(formatMarkupRate(200, 3)).toBe("66.7");
    expect(formatMarkupRate(2300, 80)).toBe("28.8");
  });

  it("formatMarkupRate は現売価 0 で — を返す", () => {
    expect(formatMarkupRate(70000, 0)).toBe("—");
  });

  it("isRevisedToday は changed_at の日付部分と today の一致で判定する", () => {
    expect(isRevisedToday("2026-08-23T09:15:00", "2026-08-23")).toBe(true);
    expect(isRevisedToday("2026-08-22T23:59:59", "2026-08-23")).toBe(false);
    expect(isRevisedToday(undefined, "2026-08-23")).toBe(false);
  });
});
