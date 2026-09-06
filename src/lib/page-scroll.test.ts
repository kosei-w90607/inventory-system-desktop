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

// GA3b-8（Lane 4 Gated Amendment 3、旧 GA1c の拡張）: 商品一覧は表自身が縦横 scroll 箱
// （data-list-scroll-container）を持つが、GA3b で <main> の page scroll も併存するため、
// scrollPageToTop() は箱と main の両方が存在すれば両方へ scrollTo する（旧 GA1 の `??`
// 択一は片方しか戻さなかった。他 23 箇所の既存呼出し元は箱が無いため main のみで
// 従来どおり無改修で恩恵を受ける）。
describe("GA3b-8: scrollPageToTop targets both main and the list scroll container when both are present", () => {
  it("scrolls both the data-list-scroll-container box and main when both are present", () => {
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
    expect(mainScrollTo).toHaveBeenCalledWith({ top: 0, left: 0, behavior: "smooth" });
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
