// DSR-15 / DSR-18: route-provided return targets must remain app-internal.
export function normalizeReturnTo(value: string | null | undefined, fallback: string): string {
  if (value?.startsWith("/") && !value.startsWith("//")) return value;
  return fallback;
}
