// src/features/products/lib/return-to.test.ts

import { describe, expect, it } from "vitest";

import {
  buildProductListReturnTo,
  parseProductListSearchFromReturnTo,
  sanitizeProductListReturnTo,
} from "./return-to";

describe("sanitizeProductListReturnTo (UI-01b-D2)", () => {
  it("allows only product list route with search params", () => {
    expect(sanitizeProductListReturnTo("/products?q=布&page=2")).toBe(
      "/products?q=%E5%B8%83&page=2",
    );
    expect(sanitizeProductListReturnTo("/products/")).toBe("/products");
  });

  it("rejects product form/import, external URL, and unrelated routes", () => {
    expect(sanitizeProductListReturnTo("/products/new")).toBe("/products");
    expect(sanitizeProductListReturnTo("/products/ABC/edit")).toBe("/products");
    expect(sanitizeProductListReturnTo("/products/import")).toBe("/products");
    expect(sanitizeProductListReturnTo("https://example.com/products?q=布")).toBe("/products");
    expect(sanitizeProductListReturnTo("/reports/daily")).toBe("/products");
  });

  it("round-trips product list search params for navigation", () => {
    const returnTo = buildProductListReturnTo({
      q: "はさみ",
      dept: 2,
      discontinued: "all",
      sort: "selling_price",
      dir: "desc",
      page: 3,
      perPage: 100,
    });

    expect(returnTo).toBe(
      "/products?q=%E3%81%AF%E3%81%95%E3%81%BF&dept=2&discontinued=all&sort=selling_price&dir=desc&page=3&perPage=100",
    );
    expect(parseProductListSearchFromReturnTo(returnTo)).toEqual({
      q: "はさみ",
      dept: 2,
      discontinued: "all",
      sort: "selling_price",
      dir: "desc",
      page: 3,
      perPage: 100,
    });
  });

  it("serializes the PLU filter into returnTo (SPEC-PLURT C1 / UI-01a-D10)", () => {
    expect(
      buildProductListReturnTo({
        q: "毛糸",
        plu: "pending",
        page: 2,
      }),
    ).toBe("/products?q=%E6%AF%9B%E7%B3%B8&plu=pending&page=2");
  });

  it("round-trips all eight product list search params (SPEC-PLURT C1+C2 / UI-01a-D10)", () => {
    const returnTo = buildProductListReturnTo({
      q: "リボン",
      dept: 3,
      discontinued: "all",
      plu: "synced",
      sort: "name",
      dir: "desc",
      page: 4,
      perPage: 200,
    });

    expect(parseProductListSearchFromReturnTo(returnTo)).toEqual({
      q: "リボン",
      dept: 3,
      discontinued: "all",
      plu: "synced",
      sort: "name",
      dir: "desc",
      page: 4,
      perPage: 200,
    });
  });

  it("keeps PLU undefined for legacy returnTo values (SPEC-PLURT C2)", () => {
    expect(parseProductListSearchFromReturnTo("/products?q=%E5%B8%83&page=2")).toEqual({
      q: "布",
      dept: undefined,
      discontinued: undefined,
      plu: undefined,
      sort: undefined,
      dir: undefined,
      page: 2,
      perPage: undefined,
    });
  });
});
