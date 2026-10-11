import type { ProductWithRelations } from "@/lib/bindings";
import {
  ITEM_QUANTITY_FIELD,
  addToQuantityInput,
  formatQuantityInput,
  isLengthUnit,
  parseQuantityInput,
  priceBasisQuantity,
  saleAmountYen,
} from "@/lib/unit-quantity";
import type { ManualSaleRow } from "../types";

// 追加したときの数量の初期値は価格の基準数量ぶん（個数 1、`m` は 1 m、`cm` は 100 cm。UI-04-D18）
function initialQuantity(row: Pick<ManualSaleRow, "stockUnit">): string {
  return formatQuantityInput(priceBasisQuantity(row.stockUnit), row.stockUnit);
}

function nextAmount(currentAmount: string, unitPrice: number): string {
  const parsed = Number(currentAmount);
  const base = Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
  return String(base + unitPrice);
}

// 金額の初期値 = 売価 × 数量 ÷ 基準数量を円未満で四捨五入（SPEC-UNIT-D7）。
// 数量が入力の error（空・0・規則に合わない・上限超え）の間は求めず空にする
function derivedAmount(row: ManualSaleRow, quantity: string, unitPrice: number): string {
  const parsed = parseQuantityInput(quantity, row.stockUnit, ITEM_QUANTITY_FIELD);
  if (parsed.value === null) return "";
  return String(saleAmountYen(unitPrice, parsed.value, priceBasisQuantity(row.stockUnit)));
}

// 数量に合わせて金額を求め直すのは、金額を直していない長さの商品だけ
function followsQuantity(row: ManualSaleRow): boolean {
  return isLengthUnit(row.stockUnit) && !row.amountEdited;
}

export function productToManualSaleRow(product: ProductWithRelations): ManualSaleRow {
  return {
    productCode: product.product_code,
    productName: product.name,
    departmentName: product.department_name,
    stockUnit: product.stock_unit,
    currentStockQuantity: product.stock_quantity,
    unitPrice: product.selling_price,
    quantity: initialQuantity({ stockUnit: product.stock_unit }),
    amount: String(product.selling_price),
    amountEdited: false,
  };
}

export function addProductToManualSaleRows(
  rows: ManualSaleRow[],
  product: ProductWithRelations,
): ManualSaleRow[] {
  const existingIndex = rows.findIndex((row) => row.productCode === product.product_code);
  if (existingIndex === -1) return [...rows, productToManualSaleRow(product)];

  return rows.map((row, index) => {
    if (index !== existingIndex) return row;
    const quantity =
      addToQuantityInput(row.quantity, row.stockUnit, priceBasisQuantity(row.stockUnit)) ??
      initialQuantity(row);
    return {
      ...row,
      quantity,
      amount: followsQuantity(row)
        ? derivedAmount(row, quantity, product.selling_price)
        : nextAmount(row.amount, product.selling_price),
    };
  });
}

export function updateManualSaleRow(
  rows: ManualSaleRow[],
  productCode: string,
  patch: Partial<Pick<ManualSaleRow, "quantity" | "amount">>,
): ManualSaleRow[] {
  return rows.map((row) => {
    if (row.productCode !== productCode) return row;
    if (patch.amount !== undefined) return { ...row, ...patch, amountEdited: true };
    if (patch.quantity !== undefined && followsQuantity(row)) {
      return { ...row, ...patch, amount: derivedAmount(row, patch.quantity, row.unitPrice) };
    }
    return { ...row, ...patch };
  });
}

export function removeManualSaleRow(rows: ManualSaleRow[], productCode: string): ManualSaleRow[] {
  return rows.filter((row) => row.productCode !== productCode);
}
