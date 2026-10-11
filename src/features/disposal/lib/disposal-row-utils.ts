import type { ProductWithRelations } from "@/lib/bindings";
import { addToQuantityInput, entryQuantityStep, sumQuantityInputs } from "@/lib/unit-quantity";
import type { DisposalRow } from "../types";

function makeDisposalKey(productCode: string, disposalType: string, reason: string): string {
  return `${productCode}::${disposalType}::${reason.trim()}`;
}

function getDisposalKey(row: DisposalRow): string {
  return makeDisposalKey(row.productCode, row.disposalType, row.reason);
}

function makeUniqueRowId(rows: DisposalRow[], baseId: string): string {
  let candidate = baseId;
  let suffix = 2;
  while (rows.some((row) => row.rowId === candidate)) {
    candidate = `${baseId}::${String(suffix)}`;
    suffix += 1;
  }
  return candidate;
}

// 再追加と統合は在庫の数量の整数で足す（SPEC-UNIT-D3）。規則に合わない文字列は、
// 再追加が初期値、統合が統合先の元の値
function nextQuantity(row: DisposalRow): string {
  return addToQuantityInput(row.quantity, row.stockUnit, entryQuantityStep(row.stockUnit)) ?? "1";
}

export function productToDisposalRow(product: ProductWithRelations): DisposalRow {
  const reason = "破損";
  return {
    rowId: makeDisposalKey(product.product_code, "damage", reason),
    productCode: product.product_code,
    productName: product.name,
    departmentName: product.department_name,
    stockUnit: product.stock_unit,
    currentStockQuantity: product.stock_quantity,
    defaultCostPrice: product.cost_price,
    disposalType: "damage",
    quantity: "1",
    costPrice: String(product.cost_price),
    reason,
  };
}

export function addProductToDisposalRows(
  rows: DisposalRow[],
  product: ProductWithRelations,
): DisposalRow[] {
  const nextRow = productToDisposalRow(product);
  const existingIndex = rows.findIndex((row) => getDisposalKey(row) === getDisposalKey(nextRow));
  if (existingIndex === -1) {
    return [...rows, { ...nextRow, rowId: makeUniqueRowId(rows, nextRow.rowId) }];
  }

  return rows.map((row, index) =>
    index === existingIndex ? { ...row, quantity: nextQuantity(row) } : row,
  );
}

export function updateDisposalRow(
  rows: DisposalRow[],
  rowId: string,
  patch: Partial<Pick<DisposalRow, "disposalType" | "quantity" | "costPrice" | "reason">>,
): DisposalRow[] {
  const target = rows.find((row) => row.rowId === rowId);
  if (target === undefined) return rows;

  const nextRow = { ...target, ...patch };
  const existingIndex = rows.findIndex(
    (row) => getDisposalKey(row) === getDisposalKey(nextRow) && row.rowId !== rowId,
  );

  if (existingIndex === -1) {
    return rows.map((row) => (row.rowId === rowId ? nextRow : row));
  }

  return rows
    .filter((row) => row.rowId !== rowId)
    .map((row) =>
      getDisposalKey(row) === getDisposalKey(nextRow)
        ? {
            ...row,
            quantity:
              sumQuantityInputs(row.quantity, nextRow.quantity, row.stockUnit) ?? row.quantity,
          }
        : row,
    );
}

export function removeDisposalRow(rows: DisposalRow[], rowId: string): DisposalRow[] {
  return rows.filter((row) => row.rowId !== rowId);
}
