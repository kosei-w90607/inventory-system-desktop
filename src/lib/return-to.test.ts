import { describe, expect, expectTypeOf, it } from "vitest";

import { normalizeReturnTo, returnToLinkProps } from "./return-to";

describe("normalizeReturnTo (REQ-207 / DSR-15 / DSR-18 / SPEC-RETURNTO-HYGIENE-2026-09-17 T1)", () => {
  it.each([
    ["/inventory/receiving", "/inventory/records", "/inventory/receiving"],
    ["/", "/inventory/records", "/"],
    [undefined, "/inventory/records", "/inventory/records"],
    [null, "/inventory/records", "/inventory/records"],
    ["", "/inventory/records", "/inventory/records"],
    ["//evil.example", "/inventory/records", "/inventory/records"],
    ["https://evil.example", "/inventory/records", "/inventory/records"],
    [undefined, "/settings/logs", "/settings/logs"],
    // C1: `/\` と tab 入りは base 以外の origin へ解決される（Probe 1）ため fallback。
    ["/\\evil.example", "/inventory/records", "/inventory/records"],
    ["/\t/evil.example", "/inventory/records", "/inventory/records"],
    ["/..//evil.example", "/inventory/records", "/inventory/records"],
    ["/./\\evil.example", "/inventory/records", "/inventory/records"],
    ["/a/..//[", "/inventory/records", "/inventory/records"],
    // hash は app が使わないため落とす。
    ["/ok#frag", "/inventory/records", "/ok"],
    // 入れ子 returnTo つきの値は同値で通す（3 段往復を壊さない）。
    [
      "/stock/BT0002/movements?type=disposal&returnTo=%2Fstock%3Fq%3DBT%26selected%3DBT0002",
      "/inventory/records",
      "/stock/BT0002/movements?type=disposal&returnTo=%2Fstock%3Fq%3DBT%26selected%3DBT0002",
    ],
    [
      "/inventory/records?q=%22123%22&page=2",
      "/inventory/records",
      "/inventory/records?q=%22123%22&page=2",
    ],
  ] as const)("normalizes %s with fallback %s", (value, fallback, expected) => {
    expect(normalizeReturnTo(value, fallback)).toBe(expected);
  });

  it.each([
    "/inventory/records?q=%22123%22&page=2",
    "/ok#frag",
    "/..//evil.example",
    "/./\\evil.example",
    "/a/..//[",
    "https://evil.example",
  ])("normalizes %s idempotently", (value) => {
    const fallback = "/inventory/records";
    const normalized = normalizeReturnTo(value, fallback);
    expect(normalizeReturnTo(normalized, fallback)).toBe(normalized);
  });
});

describe("returnToLinkProps (REQ-207 / DSR-18 / SPEC-RETURNTO-HYGIENE-2026-09-17 T2 / SPEC-NAV-RETURN-TYPES-2026-09-25 C1・C2)", () => {
  it("T3 decomposes a valid returnTo into to (pathname) and search (object)", () => {
    expect(
      returnToLinkProps(
        "/inventory/records?recordType=receiving_record&page=2&q=%222099000000019%22",
      ),
    ).toEqual({
      to: "/inventory/records",
      search: { recordType: "receiving_record", page: 2, q: "2099000000019" },
    });
  });

  it.each([
    undefined,
    null,
    "",
    "relative",
    "https://evil.example",
    "/\\evil.example",
    "/a/..//[",
    "//[",
  ])("T1 returns null for a missing or invalid returnTo %s without throwing", (value) => {
    expect(returnToLinkProps(value)).toBeNull();
  });

  it.each(["/inventory/records?page=2", "/stocktake?page=2"])(
    "T2 returns null on an options.pathname mismatch (%s)",
    (value) => {
      expect(returnToLinkProps(value, { pathname: "/stock" })).toBeNull();
    },
  );

  it("T2 keeps a value that matches options.pathname", () => {
    expect(returnToLinkProps("/stock?q=BT0002&selected=BT0002", { pathname: "/stock" })).toEqual({
      to: "/stock",
      search: { q: "BT0002", selected: "BT0002" },
    });
  });

  it("T4 forces callers to handle null through the return type", () => {
    expectTypeOf(returnToLinkProps("/x")).toEqualTypeOf<{
      to: string;
      search: Record<string, unknown>;
    } | null>();
  });
});
