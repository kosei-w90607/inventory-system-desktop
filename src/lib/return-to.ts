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
// （例: StockMovementsPage の「在庫照会へ戻る」pin）。
// 欠落・不正・解析不能・pin 不一致は null を返す。既定の戻り先は遷移先ごとに呼出側が
// `?? { to, search }` か分岐で組む（戻り値の型が null を含むため、書かないと typecheck が落ちる）。
export function returnToLinkProps(
  value: string | null | undefined,
  options?: { pathname?: string },
): { to: string; search: Record<string, unknown> } | null {
  const url = parseReturnTo(value);
  if (!url || (options?.pathname !== undefined && url.pathname !== options.pathname)) return null;
  return { to: url.pathname, search: defaultParseSearch(url.search) };
}
