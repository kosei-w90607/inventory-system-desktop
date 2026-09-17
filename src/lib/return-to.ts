// DSR-15 / DSR-18: route-provided return targets must remain app-internal.
import { defaultParseSearch } from "@tanstack/react-router";

const BASE_ORIGIN = "http://inventory.local";

export function normalizeReturnTo(value: string | null | undefined, fallback: string): string {
  if (!value?.startsWith("/")) return fallback;
  let url: URL;
  try {
    url = new URL(value, BASE_ORIGIN);
  } catch {
    return fallback;
  }
  if (url.origin !== BASE_ORIGIN) return fallback;
  // hash は app が使わないため落とす。
  return `${url.pathname}${url.search}`;
}

// DSR-18: 戻り link は文字列 `to` に query を埋め込まず、`to`(pathname) / `search`(object) へ
// 分解する（先例: products/lib/return-to.ts、InventoryRecordsPage.tsx buildDetailLinkProps）。
// options.pathname を渡すと、解決した pathname がそれと一致しない場合も不正値として扱う
// （呼出側の fallback へ、例: StockMovementsPage の「在庫照会へ戻る」pin）。
function decompose(input: string): { to: string; search: Record<string, unknown> } {
  if (input === "") return { to: "", search: {} };
  const url = new URL(input, BASE_ORIGIN);
  return { to: url.pathname, search: defaultParseSearch(url.search) };
}

export function returnToLinkProps(
  value: string | null | undefined,
  fallback: string,
  options?: { pathname?: string },
): { to: string; search: Record<string, unknown> } {
  const decomposed = decompose(normalizeReturnTo(value, fallback));
  if (options?.pathname !== undefined && decomposed.to !== options.pathname) {
    return decompose(fallback);
  }
  return decomposed;
}
