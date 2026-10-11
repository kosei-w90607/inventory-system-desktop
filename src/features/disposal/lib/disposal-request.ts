import type { DisposalCreateRequest } from "@/lib/bindings";
import { createPrefixedIdempotencyKey, parseRequiredSafeInteger } from "@/lib/request-helpers";
import {
  ITEM_QUANTITY_FIELD,
  MAX_COST_PRICE,
  parseQuantityInput,
  priceBasisQuantity,
} from "@/lib/unit-quantity";
import type { DisposalFormErrors, DisposalFormValues, DisposalRow, DisposalType } from "../types";

export { getLocalDateString } from "@/lib/request-helpers";

export interface BuildDisposalRequestResult {
  request: DisposalCreateRequest | null;
  errors: DisposalFormErrors;
  signature: string;
}

const DISPOSAL_TYPES: readonly DisposalType[] = ["disposal", "damage", "other"];

export function createDisposalIdempotencyKey(): string {
  return createPrefixedIdempotencyKey("disposal");
}

function normalizeRows(rows: DisposalRow[]) {
  return rows.map((row) => ({
    product_code: row.productCode,
    disposal_type: row.disposalType,
    quantity: row.quantity.trim(),
    cost_price: row.costPrice.trim(),
    reason: row.reason.trim(),
  }));
}

export function buildDisposalSignature(values: DisposalFormValues): string {
  return JSON.stringify({
    disposal_date: values.disposalDate.trim(),
    items: normalizeRows(values.rows),
  });
}

/**
 * ロス原価合計（円）の twin（Rust の `cost_line_centi`・`cost_total_yen` と同じ golden。SPEC-UNIT-D6・D9）。
 * 行を 1/100 円で四捨五入してから足し、合計を円未満で四捨五入する。`BigInt` で求め、
 * 安全な整数の範囲を外れたら null（画面は `—`）。入力の error の行は 0 として数える。
 */
export function calculateLossTotal(rows: DisposalRow[]): number | null {
  let totalCenti = 0n;
  for (const row of rows) {
    const quantity = parseQuantityInput(row.quantity, row.stockUnit, ITEM_QUANTITY_FIELD).value;
    const costPrice = parseRequiredSafeInteger(row.costPrice, 0);
    if (quantity === null || costPrice === null) continue;
    const basis = BigInt(priceBasisQuantity(row.stockUnit));
    const exact = BigInt(costPrice) * 100n * BigInt(quantity);
    totalCenti += exact / basis + (2n * (exact % basis) >= basis ? 1n : 0n);
  }
  const yen = totalCenti / 100n + (totalCenti % 100n >= 50n ? 1n : 0n);
  return yen <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(yen) : null;
}

export function buildDisposalRequest(
  values: DisposalFormValues,
  idempotencyKey: string,
): BuildDisposalRequestResult {
  const errors: DisposalFormErrors = {};
  const rowErrors: Record<string, string> = {};
  const disposalDate = values.disposalDate.trim();

  if (disposalDate === "") {
    errors.disposalDate = "廃棄日は必須です";
  }
  if (values.rows.length === 0) {
    errors.items = "明細が1件以上必要です";
  }

  const items = values.rows.map((row) => {
    const quantity = parseQuantityInput(row.quantity, row.stockUnit, ITEM_QUANTITY_FIELD);
    const costPrice = parseRequiredSafeInteger(row.costPrice, 0);
    const reason = row.reason.trim();
    const messages = [];
    if (!DISPOSAL_TYPES.includes(row.disposalType)) {
      messages.push("種別を選択してください");
    }
    if (quantity.error !== null) messages.push(quantity.error);
    if (costPrice === null) messages.push("原価は0以上の整数で入力してください");
    else if (costPrice > MAX_COST_PRICE) messages.push("原価が大きすぎます");
    if (reason === "") messages.push("理由は必須です");
    if (messages.length > 0) rowErrors[row.rowId] = messages.join(" / ");

    return {
      product_code: row.productCode,
      disposal_type: row.disposalType,
      quantity: quantity.value ?? 0,
      cost_price: costPrice ?? 0,
      reason,
    };
  });

  if (Object.keys(rowErrors).length > 0) errors.rows = rowErrors;

  const signature = buildDisposalSignature(values);
  if (Object.keys(errors).length > 0) {
    return { request: null, errors, signature };
  }

  return {
    request: {
      idempotency_key: idempotencyKey,
      disposal_date: disposalDate,
      items,
    },
    errors,
    signature,
  };
}
