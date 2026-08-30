import { beforeEach, describe, expect, it } from "vitest";

import { consumeMainNavScroll, markMainNavScroll } from "./main-nav-scroll";

describe("DSR-17 D-C main navigation scroll marker", () => {
  beforeEach(() => {
    consumeMainNavScroll();
  });

  it("T2: consumes the marked full href exactly once", () => {
    markMainNavScroll("/stock?status=low_stock");

    expect(consumeMainNavScroll()).toBe("/stock?status=low_stock");
    expect(consumeMainNavScroll()).toBeUndefined();
  });

  it("T2: keeps pathname-identical hrefs distinct and lets the latest mark win", () => {
    markMainNavScroll("/stock");
    markMainNavScroll("/stock?status=low_stock");

    expect(consumeMainNavScroll()).toBe("/stock?status=low_stock");
    expect(consumeMainNavScroll()).toBeUndefined();
  });
});
