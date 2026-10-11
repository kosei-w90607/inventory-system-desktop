// src/features/daily-sales/lib/calculate-unit-price.ts
//
// 実績単価派生計算純関数（user Option 1.5、Round 2 β-2 採用）。
// 設計: docs/function-design/56-ui-daily-sales.md §56.10 単価派生

import type { DailySaleItem } from "@/lib/bindings";
import { divideRoundHalfUp, priceBasisQuantity } from "@/lib/unit-quantity";

/// 売上明細の実績単価を計算する。
///
/// 商品マスタの販売単価ではなく、売上記録の `|金額| × 基準数量 ÷ |数量|` で求めた派生値
/// （長さの商品は 1 m あたり。SPEC-UNIT-D3 の単価）。
/// 返品行（quantity<0 + amount<0）では絶対値で「単価の大きさ」として正数表示。
/// quantity=0 の場合は null（表示側で「—」placeholder + ソート時末尾配置）。
/// 端数は整数の演算で円未満を四捨五入する。
export function calculateEffectiveUnitPrice(item: DailySaleItem): number | null {
  if (item.quantity === 0) return null;
  return divideRoundHalfUp(
    Math.abs(item.amount) * priceBasisQuantity(item.stock_unit),
    Math.abs(item.quantity),
  );
}
