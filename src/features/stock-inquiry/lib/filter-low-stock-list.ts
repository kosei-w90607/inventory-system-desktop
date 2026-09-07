// src/features/stock-inquiry/lib/filter-low-stock-list.ts
//
// list_low_stock 結果の frontend sub-filter + sort 純関数（§設計判断 C / Q-1、UI-06a-D4）。
// stockout/low の分岐 + q（商品コード/商品名/JAN 部分一致）+ dept 絞り込み。
// list_low_stock 返り値は 100 件以下想定で frontend filter/sort で高速。
// フィルタ後、取引先名昇順（null 最後）→ 在庫数昇順 → 商品名昇順で安定ソートする。
//
// 設計: docs/function-design/58-ui-stock-inquiry.md §58.6

import type { ProductWithRelations } from "@/lib/bindings";

/**
 * list_low_stock 結果を status / q / dept で sub-filter し、取引先名優先で並べる。
 *
 * @param items list_low_stock(false) の戻り値（廃番除外済み）
 * @param q     検索キーワード（空文字は無視）
 * @param dept  部門 ID（null は全部門）
 * @param status "stockout"（在庫切れ）または "low_stock"（在庫少）
 */
export function filterAndSortLowStockList(
  items: ProductWithRelations[],
  q: string,
  dept: number | null,
  status: "stockout" | "low_stock",
): ProductWithRelations[] {
  const keyword = q.trim().toLowerCase();
  const filtered = items.filter((item) => {
    // status 分岐: stockout = 在庫 0 以下、low_stock = 在庫あり
    if (status === "stockout" && item.stock_quantity > 0) {
      return false;
    }
    if (status === "low_stock" && item.stock_quantity <= 0) {
      return false;
    }
    // 部門絞り込み
    if (dept !== null && item.department_id !== dept) {
      return false;
    }
    // キーワード部分一致（商品コード / 商品名 / JAN）
    if (keyword !== "") {
      const haystack = [item.product_code, item.name, item.jan_code ?? ""].join(" ").toLowerCase();
      if (!haystack.includes(keyword)) {
        return false;
      }
    }
    return true;
  });
  // 取引先名昇順（null 最後）→ 在庫数昇順 → 商品名昇順
  return [...filtered].sort((a, b) => {
    if (a.supplier_name === null && b.supplier_name !== null) {
      return 1;
    }
    if (a.supplier_name !== null && b.supplier_name === null) {
      return -1;
    }
    if (a.supplier_name !== null && b.supplier_name !== null) {
      const supplierCmp = a.supplier_name.localeCompare(b.supplier_name, "ja");
      if (supplierCmp !== 0) {
        return supplierCmp;
      }
    }
    if (a.stock_quantity !== b.stock_quantity) {
      return a.stock_quantity - b.stock_quantity;
    }
    return a.name.localeCompare(b.name, "ja");
  });
}
