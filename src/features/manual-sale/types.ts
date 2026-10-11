import type { ManualSaleReason, ProductStockUnit, ProductWithRelations } from "@/lib/bindings";

export type { ManualSaleReason };

export interface ManualSaleRow {
  productCode: string;
  productName: string;
  departmentName: string;
  stockUnit: ProductStockUnit;
  currentStockQuantity: number;
  unitPrice: number;
  quantity: string;
  amount: string;
  /** 金額欄を利用者が直したか。直した後は数量に合わせて求め直さない（UI-04-D18） */
  amountEdited: boolean;
}

export type ManualSaleFormErrors = Partial<{
  saleDate: string;
  reason: string;
  items: string;
  note: string;
  rows: Record<string, string>;
}>;

export interface ManualSaleFormValues {
  saleDate: string;
  reason: ManualSaleReason;
  note: string;
  rows: ManualSaleRow[];
}

export interface PluConfirmationState {
  token: string;
  warnings: string[];
}

export type ProductCandidate = ProductWithRelations;
