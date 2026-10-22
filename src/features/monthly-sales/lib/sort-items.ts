// src/features/monthly-sales/lib/sort-items.ts
//
// 列ソート + null 末尾配置（4 列、ranking バッジ追従 G-3）。
// 設計: docs/function-design/57-ui-monthly-sales.md §57.6 sort-items

import { compareQuantityPair } from "@/lib/unit-quantity";
import type { SortColumn, SortDirection } from "../types";

/// 4 列 (name / quantity / amount / prev_month_diff) のいずれかでソートする汎用 sort。
/// 数量は `(count_points, length_cm)` の辞書順（商品別・部門別とも。SPEC-UNIT-D3 の集計の規則）。
/// `by === null` の場合は入力順を維持（BIZ-05 row_number/department_id 由来の順序を尊重）。
/// `prev_month_diff: null` は asc/desc 共通で末尾配置。
/// 同値タイブレークは入力順保持（安定ソート）。
export function sortMonthlyItems<
  T extends {
    name?: string;
    label: string;
    count_points: number;
    length_cm: number;
    amount: number;
    prev_month_diff?: number | null;
  },
>(items: readonly T[], by: SortColumn | null, dir: SortDirection): T[] {
  if (by === null) return items.slice();

  const factor = dir === "asc" ? 1 : -1;
  const indexed = items.map((item, idx) => ({ item, idx }));

  indexed.sort((a, b) => {
    if (by === "quantity") {
      const diff = compareQuantityPair(a.item, b.item);
      return diff !== 0 ? diff * factor : a.idx - b.idx;
    }
    const av = extractValue(a.item, by);
    const bv = extractValue(b.item, by);

    if (av === null && bv === null) return a.idx - b.idx;
    if (av === null) return 1;
    if (bv === null) return -1;

    if (typeof av === "number" && typeof bv === "number") {
      const diff = av - bv;
      if (diff !== 0) return diff * factor;
    } else {
      const cmp = String(av).localeCompare(String(bv), "ja");
      if (cmp !== 0) return cmp * factor;
    }
    return a.idx - b.idx;
  });

  return indexed.map((x) => x.item);
}

function extractValue(
  item: {
    name?: string;
    label: string;
    amount: number;
    prev_month_diff?: number | null;
  },
  by: Exclude<SortColumn, "quantity">,
): string | number | null {
  switch (by) {
    case "name":
      // ProductRankingRow/DeptCompositionRow とも label を表示名として使用する。
      return item.name ?? item.label;
    case "amount":
      return item.amount;
    case "prev_month_diff":
      return item.prev_month_diff ?? null;
  }
}
