// src/features/monthly-sales/lib/compute-summary.ts
//
// 月間売上合計 / 販売点数集計（純関数）。
// 設計: docs/function-design/57-ui-monthly-sales.md §57.6 compute-summary

import { addSafeInteger } from "@/lib/unit-quantity";
import type { MonthlySaleItem, MonthlySummary } from "../types";

/// items から totalAmount と、数量の種類ごとの 2 本（点・cm）を集計する。
/// 空配列 → { totalAmount: 0, totalCountPoints: 0, totalLengthCm: 0 }。
/// 数量の和が安全な整数を外れた欄は null（SPEC-UNIT-D3 の集計の規則）。
/// 負数 amount（返品超過月）はそのまま合計する（業務判断は呼出側）。
export function computeMonthlySummary(items: readonly MonthlySaleItem[]): MonthlySummary {
  let totalAmount = 0;
  let totalCountPoints: number | null = 0;
  let totalLengthCm: number | null = 0;
  for (const item of items) {
    totalAmount += item.amount;
    totalCountPoints = addSafeInteger(totalCountPoints, item.count_points);
    totalLengthCm = addSafeInteger(totalLengthCm, item.length_cm);
  }
  return { totalAmount, totalCountPoints, totalLengthCm };
}
