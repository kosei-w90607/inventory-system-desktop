import type { ProductWithRelations } from "@/lib/bindings";
import { addToQuantityInput, entryQuantityStep, sumQuantityInputs } from "@/lib/unit-quantity";
import type { ReturnDirection, ReturnExchangeRow } from "../types";

// 再追加と方向の切替えの合算は在庫の数量の整数で足す。規則に合わない文字列は "1"（SPEC-UNIT-D3）
function nextQuantity(row: ReturnExchangeRow): string {
  return addToQuantityInput(row.quantity, row.stockUnit, entryQuantityStep(row.stockUnit)) ?? "1";
}

export function productToReturnRow(
  product: ProductWithRelations,
  direction: ReturnDirection,
): ReturnExchangeRow {
  return {
    productCode: product.product_code,
    productName: product.name,
    departmentName: product.department_name,
    stockUnit: product.stock_unit,
    currentStockQuantity: product.stock_quantity,
    direction,
    quantity: "1",
  };
}

export function addProductToReturnRows(
  rows: ReturnExchangeRow[],
  product: ProductWithRelations,
  direction: ReturnDirection,
): ReturnExchangeRow[] {
  const existingIndex = rows.findIndex(
    (row) => row.productCode === product.product_code && row.direction === direction,
  );
  if (existingIndex === -1) return [...rows, productToReturnRow(product, direction)];

  return rows.map((row, index) =>
    index === existingIndex ? { ...row, quantity: nextQuantity(row) } : row,
  );
}

export function updateReturnRow(
  rows: ReturnExchangeRow[],
  productCode: string,
  direction: ReturnDirection,
  patch: Partial<Pick<ReturnExchangeRow, "quantity" | "direction">>,
): ReturnExchangeRow[] {
  return rows.map((row) =>
    row.productCode === productCode && row.direction === direction ? { ...row, ...patch } : row,
  );
}

export function changeReturnRowDirection(
  rows: ReturnExchangeRow[],
  productCode: string,
  fromDirection: ReturnDirection,
  toDirection: ReturnDirection,
): ReturnExchangeRow[] {
  if (fromDirection === toDirection) return rows;

  const sourceRow = rows.find(
    (row) => row.productCode === productCode && row.direction === fromDirection,
  );
  if (sourceRow === undefined) return rows;

  const targetRow = rows.find(
    (row) => row.productCode === productCode && row.direction === toDirection,
  );
  if (targetRow === undefined) {
    return rows.map((row) =>
      row.productCode === productCode && row.direction === fromDirection
        ? { ...row, direction: toDirection }
        : row,
    );
  }

  return rows
    .map((row) =>
      row.productCode === productCode && row.direction === toDirection
        ? {
            ...row,
            quantity: sumQuantityInputs(row.quantity, sourceRow.quantity, row.stockUnit) ?? "1",
          }
        : row,
    )
    .filter((row) => row.productCode !== productCode || row.direction !== fromDirection);
}

export function removeReturnRow(
  rows: ReturnExchangeRow[],
  productCode: string,
  direction: ReturnDirection,
): ReturnExchangeRow[] {
  return rows.filter((row) => row.productCode !== productCode || row.direction !== direction);
}
