import type { ProductStockUnit, ProductWithRelations } from "@/lib/bindings";

export interface ReceivingRow {
  productCode: string;
  productName: string;
  stockUnit: ProductStockUnit;
  quantity: string;
  costPrice: string;
}

export type ReceivingFormErrors = Partial<{
  receivingDate: string;
  items: string;
  supplierId: string;
  note: string;
  rows: Record<string, string>;
}>;

export interface ReceivingFormValues {
  supplierId: number | null;
  receivingDate: string;
  note: string;
  rows: ReceivingRow[];
}

export type ProductCandidate = ProductWithRelations;
