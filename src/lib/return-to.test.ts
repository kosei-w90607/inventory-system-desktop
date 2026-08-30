import { describe, expect, it } from "vitest";

import { normalizeReturnTo } from "./return-to";

describe("normalizeReturnTo (REQ-207 / DSR-15 / DSR-18 / SPEC-DSR18-RETURNTO-2026-08-30 T1)", () => {
  it.each([
    ["/inventory/receiving", "/inventory/records", "/inventory/receiving"],
    ["/", "/inventory/records", "/"],
    [undefined, "/inventory/records", "/inventory/records"],
    [null, "/inventory/records", "/inventory/records"],
    ["", "/inventory/records", "/inventory/records"],
    ["//evil.example", "/inventory/records", "/inventory/records"],
    ["https://evil.example", "/inventory/records", "/inventory/records"],
    [undefined, "/settings/logs", "/settings/logs"],
  ] as const)("normalizes %s with fallback %s", (value, fallback, expected) => {
    expect(normalizeReturnTo(value, fallback)).toBe(expected);
  });
});
