import type { ProductWithRelations } from "@/lib/bindings";
import { addToQuantityInput, entryQuantityStep } from "@/lib/unit-quantity";
import type { ReceivingRow } from "../types";

// 再追加は在庫の数量の整数で足す（`m` は +1 m）。規則に合わない文字列は初期値（SPEC-UNIT-D3）
function nextQuantity(row: ReceivingRow): string {
  return addToQuantityInput(row.quantity, row.stockUnit, entryQuantityStep(row.stockUnit)) ?? "1";
}

export function productToReceivingRow(product: ProductWithRelations): ReceivingRow {
  return {
    productCode: product.product_code,
    productName: product.name,
    stockUnit: product.stock_unit,
    quantity: "1",
    costPrice: String(product.cost_price),
  };
}

export function addProductToRows(
  rows: ReceivingRow[],
  product: ProductWithRelations,
): ReceivingRow[] {
  const existingIndex = rows.findIndex((row) => row.productCode === product.product_code);
  if (existingIndex === -1) return [...rows, productToReceivingRow(product)];

  return rows.map((row, index) =>
    index === existingIndex ? { ...row, quantity: nextQuantity(row) } : row,
  );
}

export function updateReceivingRow(
  rows: ReceivingRow[],
  productCode: string,
  patch: Partial<Pick<ReceivingRow, "quantity" | "costPrice">>,
): ReceivingRow[] {
  return rows.map((row) => (row.productCode === productCode ? { ...row, ...patch } : row));
}

export function removeReceivingRow(rows: ReceivingRow[], productCode: string): ReceivingRow[] {
  return rows.filter((row) => row.productCode !== productCode);
}
