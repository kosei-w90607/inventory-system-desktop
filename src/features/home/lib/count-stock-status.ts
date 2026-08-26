// src/features/home/lib/count-stock-status.ts
//
// 在庫切れ / 在庫少のカウント純関数。
// 設計: docs/function-design/53-ui-home.md §53.2 / D-1
// テスト容易性のため純関数として分離（unit test 実装済み）。

import type { ProductWithRelations } from "@/lib/bindings";

export interface StockStatusCounts {
  outOfStock: number;
  lowStock: number;
}

export function countStockStatus(items: ProductWithRelations[]): StockStatusCounts {
  return {
    outOfStock: items.filter((p) => p.stock_quantity <= 0).length,
    lowStock: items.filter((p) => p.stock_quantity > 0).length,
  };
}
