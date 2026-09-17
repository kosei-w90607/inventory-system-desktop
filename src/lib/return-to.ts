// DSR-15 / DSR-18: route-provided return targets must remain app-internal.
import { defaultParseSearch } from "@tanstack/react-router";

const BASE_ORIGIN = "http://inventory.local";

function parseReturnTo(value: string | null | undefined): URL | null {
  if (!value?.startsWith("/")) return null;
  let url: URL;
  try {
    url = new URL(value, BASE_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== BASE_ORIGIN || url.pathname.startsWith("//")) return null;
  return url;
}

export function normalizeReturnTo(value: string | null | undefined, fallback: string): string {
  const url = parseReturnTo(value);
  // hash は app が使わないため落とす。
  return url ? `${url.pathname}${url.search}` : fallback;
}

// DSR-18: 戻り link は文字列 `to` に query を埋め込まず、`to`(pathname) / `search`(object) へ
// 分解する（先例: products/lib/return-to.ts、InventoryRecordsPage.tsx buildDetailLinkProps）。
// options.pathname を渡すと、解決した pathname がそれと一致しない場合も不正値として扱う
// （呼出側の fallback へ、例: StockMovementsPage の「在庫照会へ戻る」pin）。
export function returnToLinkProps(
  value: string | null | undefined,
  fallback: string,
  options?: { pathname?: string },
): { to: string; search: Record<string, unknown> } {
  let url = parseReturnTo(value);
  if (!url || (options?.pathname !== undefined && url.pathname !== options.pathname)) {
    url = parseReturnTo(fallback);
  }
  // 空 fallback の to: "" は、呼出側で既定の戻り先を組むための「値なし」の印。
  return url
    ? { to: url.pathname, search: defaultParseSearch(url.search) }
    : { to: "", search: {} };
}
