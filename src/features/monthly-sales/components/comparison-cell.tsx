// src/features/monthly-sales/components/comparison-cell.tsx
//
// 前月比セル描画 helper（F-15 ±1.0% 閾値 + Q-7 prev <= 0 「—」灰）。
// 設計: docs/function-design/57-ui-monthly-sales.md §57.7 + §57.10

import type { ComparisonInfo } from "../types";

const THRESHOLD = 0.01; // ±1.0%

// D-CE9: 00「役割色の文字だけの表示」。地の chip を持たず、記号と % の文言が意味を担う。
const GREEN_CLASS = "text-success-strong";
const RED_CLASS = "text-destructive-strong";
const NEUTRAL_CLASS = "text-muted-foreground";
const INCOMPARABLE_CLASS = "text-muted-foreground";

const CELL_BASE = "text-sm font-medium tabular-nums";

export interface ComparisonCellProps {
  info: ComparisonInfo | undefined;
}

export function ComparisonCell({ info }: ComparisonCellProps) {
  if (!info || !info.isComparable || info.ratio === null) {
    return <span className={`${CELL_BASE} ${INCOMPARABLE_CLASS}`}>—</span>;
  }
  const colorClass =
    info.ratio >= THRESHOLD ? GREEN_CLASS : info.ratio <= -THRESHOLD ? RED_CLASS : NEUTRAL_CLASS;
  const sign = info.ratio >= 0 ? "+" : "";
  const pct = (info.ratio * 100).toFixed(1);
  return <span className={`${CELL_BASE} ${colorClass}`}>{`${sign}${pct}%`}</span>;
}
