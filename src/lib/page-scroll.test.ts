import { afterEach, describe, expect, it, vi } from "vitest";

import { scrollPageToTop } from "./page-scroll";

afterEach(() => {
  vi.unstubAllGlobals();
  document.body.innerHTML = "";
});

describe("REQ-201/REQ-202/REQ-203/REQ-204 save result page scroll", () => {
  it("scrolls the RootLayout main container when present", () => {
    const main = document.createElement("main");
    const mainScrollTo = vi.fn();
    main.scrollTo = mainScrollTo;
    document.body.append(main);
    const windowScrollTo = vi.fn();
    vi.stubGlobal("scrollTo", windowScrollTo);

    scrollPageToTop();

    expect(mainScrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
    expect(windowScrollTo).not.toHaveBeenCalled();
  });

  it("falls back to window scrolling outside RootLayout", () => {
    const windowScrollTo = vi.fn();
    vi.stubGlobal("scrollTo", windowScrollTo);

    scrollPageToTop();

    expect(windowScrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
  });
});

// GA1c（Gated Amendment 1）: 商品一覧は表自身が縦横 scroll 箱（data-list-scroll-container）
// になり、<main> はこの画面で scroll しない。scrollPageToTop() は箱があればそれを、無ければ
// 従来どおり main を対象にする（他 23 箇所の既存呼出し元は無改修で恩恵を受ける）。
describe("GA1c: scrollPageToTop targets the list scroll container when present", () => {
  it("scrolls the data-list-scroll-container box instead of main when both are present", () => {
    const main = document.createElement("main");
    const mainScrollTo = vi.fn();
    main.scrollTo = mainScrollTo;
    const box = document.createElement("div");
    box.setAttribute("data-list-scroll-container", "");
    const boxScrollTo = vi.fn();
    box.scrollTo = boxScrollTo;
    main.append(box);
    document.body.append(main);
    const windowScrollTo = vi.fn();
    vi.stubGlobal("scrollTo", windowScrollTo);

    scrollPageToTop();

    expect(boxScrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
    expect(mainScrollTo).not.toHaveBeenCalled();
    expect(windowScrollTo).not.toHaveBeenCalled();
  });

  it("falls back to main when no list scroll container exists", () => {
    const main = document.createElement("main");
    const mainScrollTo = vi.fn();
    main.scrollTo = mainScrollTo;
    document.body.append(main);
    const windowScrollTo = vi.fn();
    vi.stubGlobal("scrollTo", windowScrollTo);

    scrollPageToTop();

    expect(mainScrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
    expect(windowScrollTo).not.toHaveBeenCalled();
  });
});
