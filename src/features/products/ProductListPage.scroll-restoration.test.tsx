// src/features/products/ProductListPage.scroll-restoration.test.tsx
//
// Gated Amendment 1 (GA1d): 商品一覧の識別列固定は data grid 型 scroll 箱
// （data-list-scroll-container / data-scroll-restoration-id="products-list"）を新しい
// scrolling ancestor にする。本番と同じ createAppRouter（src/lib/app-router.ts）+ 実
// routeTree を mount し、箱の scrollTop / scrollLeft が一覧→詳細→戻りで復元されることを
// 確認する（縦横同時 / 縦のみ / 横のみ）。
//
// 箱は <main> と異なり ProductListPage 自体の JSX の一部のため、他画面へ遷移すると
// unmount され、戻ると新しい箱が mount される（<main> は RootLayout が持つ persistent
// element で route 遷移を跨いで unmount されない、DSR-17 前提）。したがって
// src/lib/app-router.test.tsx の installNativeScrollClamp（main 1 個への直接
// Object.defineProperty）はそのまま再利用できず、`data-list-scroll-container` を持つ
// 要素であれば新旧どちらの mount にも効く HTMLElement.prototype 単位の geometry stub に
// 拡張する（round 2/3 是正 Opus P1/P2 の意図——happy-dom 20.10.6 の scrollLeft は無制限の
// raw property で、router-core 内蔵の復元（scroll-restoration.js:147）が先に
// element.scrollLeft = scrollX を代入してしまうため、幅の clamp が無いとアプリ層の
// scrollLeft 復元行を削除しても test が pass する生存 mutant になる）。

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createAppRouter } from "@/lib/app-router";
import { commands } from "@/lib/bindings";
import { makeMockProductWithRelations } from "./lib/test-fixtures";

vi.mock("@/lib/bindings", () => ({
  commands: {
    searchProducts: vi.fn(),
    listDepartments: vi.fn(),
    listSuppliers: vi.fn(),
    bulkSetPluTarget: vi.fn(),
  },
}));
vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ setTitle: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({ setZoom: vi.fn().mockResolvedValue(undefined) }),
}));
vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => null,
}));

const searchProducts = vi.mocked(commands.searchProducts);
const listDepartments = vi.mocked(commands.listDepartments);

const BOX_SELECTOR = '[data-scroll-restoration-id="products-list"]';

/**
 * data-list-scroll-container を持つ要素だけに効く geometry stub（HTMLElement.prototype
 * 単位）。箱は route 遷移のたびに unmount/remount されるため、特定要素への
 * Object.defineProperty ではなく属性ベースで判定する。`revealContent(false)` の間は
 * scrollHeight/Width が clientHeight/Width と等しく（scroll 不可）、
 * `revealContent(true)` で十分な大きさへ切り替わる（app-router.ts の
 * MutationObserver が拾えるよう、切替え後は呼出し側が実際に子要素を追加する）。
 */
function installBoxGeometryStub() {
  // happy-dom（node_modules/happy-dom/lib/nodes/element/Element.js:133-174）は
  // scrollTop/scrollLeft/scrollHeight/scrollWidth を Element.prototype の accessor として
  // 定義し、clientHeight/clientWidth は HTMLElement.prototype（html-element/HTMLElement.js:460,468）
  // に定義する。class の own accessor に上書きするには対応する prototype を個別に指定する。
  const elementProto = Element.prototype;
  const htmlElementProto = HTMLElement.prototype;
  const original = {
    scrollTop: Object.getOwnPropertyDescriptor(elementProto, "scrollTop"),
    scrollLeft: Object.getOwnPropertyDescriptor(elementProto, "scrollLeft"),
    scrollHeight: Object.getOwnPropertyDescriptor(elementProto, "scrollHeight"),
    scrollWidth: Object.getOwnPropertyDescriptor(elementProto, "scrollWidth"),
    clientHeight: Object.getOwnPropertyDescriptor(htmlElementProto, "clientHeight"),
    clientWidth: Object.getOwnPropertyDescriptor(htmlElementProto, "clientWidth"),
  };
  const positions = new WeakMap<Element, { top: number; left: number }>();
  let revealed = true;

  function isBox(el: unknown): el is HTMLElement {
    return el instanceof HTMLElement && el.hasAttribute("data-list-scroll-container");
  }

  Object.defineProperty(htmlElementProto, "clientHeight", {
    configurable: true,
    get(this: HTMLElement) {
      return isBox(this) ? 400 : (original.clientHeight?.get?.call(this) as number);
    },
  });
  Object.defineProperty(htmlElementProto, "clientWidth", {
    configurable: true,
    get(this: HTMLElement) {
      return isBox(this) ? 600 : (original.clientWidth?.get?.call(this) as number);
    },
  });
  Object.defineProperty(elementProto, "scrollHeight", {
    configurable: true,
    get(this: HTMLElement) {
      if (!isBox(this)) return original.scrollHeight?.get?.call(this) as number;
      return revealed ? 1_000 : this.clientHeight;
    },
  });
  Object.defineProperty(elementProto, "scrollWidth", {
    configurable: true,
    get(this: HTMLElement) {
      if (!isBox(this)) return original.scrollWidth?.get?.call(this) as number;
      return revealed ? 1_200 : this.clientWidth;
    },
  });
  Object.defineProperty(elementProto, "scrollTop", {
    configurable: true,
    get(this: HTMLElement) {
      if (!isBox(this)) return original.scrollTop?.get?.call(this) as number;
      return positions.get(this)?.top ?? 0;
    },
    set(this: HTMLElement, value: number) {
      if (!isBox(this)) {
        original.scrollTop?.set?.call(this, value);
        return;
      }
      const pos = positions.get(this) ?? { top: 0, left: 0 };
      const max = Math.max(0, this.scrollHeight - this.clientHeight);
      pos.top = Math.min(Math.max(0, value), max);
      positions.set(this, pos);
    },
  });
  Object.defineProperty(elementProto, "scrollLeft", {
    configurable: true,
    get(this: HTMLElement) {
      if (!isBox(this)) return original.scrollLeft?.get?.call(this) as number;
      return positions.get(this)?.left ?? 0;
    },
    set(this: HTMLElement, value: number) {
      if (!isBox(this)) {
        original.scrollLeft?.set?.call(this, value);
        return;
      }
      const pos = positions.get(this) ?? { top: 0, left: 0 };
      const max = Math.max(0, this.scrollWidth - this.clientWidth);
      pos.left = Math.min(Math.max(0, value), max);
      positions.set(this, pos);
    },
  });

  return {
    setRevealed: (value: boolean) => {
      revealed = value;
    },
    restore: () => {
      if (original.scrollTop) Object.defineProperty(elementProto, "scrollTop", original.scrollTop);
      if (original.scrollLeft)
        Object.defineProperty(elementProto, "scrollLeft", original.scrollLeft);
      if (original.scrollHeight)
        Object.defineProperty(elementProto, "scrollHeight", original.scrollHeight);
      if (original.scrollWidth)
        Object.defineProperty(elementProto, "scrollWidth", original.scrollWidth);
      if (original.clientHeight)
        Object.defineProperty(htmlElementProto, "clientHeight", original.clientHeight);
      if (original.clientWidth)
        Object.defineProperty(htmlElementProto, "clientWidth", original.clientWidth);
    },
  };
}

function trackScroll(el: HTMLElement, top: number, left: number) {
  el.scrollTop = top;
  el.scrollLeft = left;
  el.dispatchEvent(new Event("scroll", { bubbles: true }));
}

async function renderProductsAt(initialHref: string) {
  window.history.pushState(null, "", initialHref);
  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: [initialHref] }),
  });
  // Final Review round 3 P2 先例（app-router.test.tsx）: scrollPageToTop() の flag は
  // window.location.pathname に束縛される。createMemoryHistory は window.location を
  // 更新しないため、pathname 判定を実挙動に近づけるよう明示的に同期する。
  router.subscribe("onBeforeLoad", () => {
    window.history.pushState(null, "", router.latestLocation.href);
  });
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  await waitFor(() => {
    expect(router.stores.resolvedLocation.get()?.href).toBe(initialHref);
  });
  const box = document.querySelector<HTMLElement>(BOX_SELECTOR);
  if (box === null) throw new Error("products-list scroll container is required");
  return { router, box };
}

describe("GA1d: 商品一覧 scroll restoration（Gated Amendment 1、data grid 型 scroll 箱）", () => {
  let stub: ReturnType<typeof installBoxGeometryStub>;

  beforeEach(() => {
    searchProducts.mockReset();
    listDepartments.mockReset();
    listDepartments.mockResolvedValue({ status: "ok", data: [] });
    searchProducts.mockResolvedValue({
      status: "ok",
      data: {
        items: [makeMockProductWithRelations({ product_code: "P-GA1D" })],
        total_count: 1,
        page: 1,
        per_page: 100,
      },
    });
    stub = installBoxGeometryStub();
  });

  afterEach(() => {
    stub.restore();
    document.body.replaceChildren();
  });

  it("box の scrollTop と scrollLeft が両方復元される（main.scrollTop ではなく箱が対象）", async () => {
    const { router, box } = await renderProductsAt("/products?case=ga1d-both");
    await screen.findByText("P-GA1D");

    trackScroll(box, 240, 180);
    await act(async () => {
      await router.navigate({ to: "/products/new" });
    });
    await waitFor(() => {
      expect(router.stores.resolvedLocation.get()?.href).toBe("/products/new");
    });

    // 戻り先の箱は新規 mount のため、いったん幅・高さ不足（scroll 不可）にして built-in
    // 内蔵復元の raw 代入が clamp で 0 に落ちることを確認する（round 2 是正 Opus P1 の
    // 生存 mutant シナリオそのもの）。
    stub.setRevealed(false);
    await act(async () => {
      await router.navigate({ to: "/products?case=ga1d-both" });
    });
    await waitFor(() => {
      expect(router.stores.resolvedLocation.get()?.href).toBe("/products?case=ga1d-both");
    });
    const restoredBox = document.querySelector<HTMLElement>(BOX_SELECTOR);
    if (restoredBox === null) throw new Error("products-list scroll container is required");
    expect(restoredBox.scrollTop).toBe(0);
    expect(restoredBox.scrollLeft).toBe(0);

    // コンテンツが「後から」広がる（商品一覧が実際には既に描画済みだが、幾何は本 test の
    // stub が管理するため、DOM 変異の発生 = MutationObserver 発火のトリガーとして
    // 子要素の追加を模す）。
    stub.setRevealed(true);
    await act(async () => {
      restoredBox.append(document.createElement("div"));
      await Promise.resolve();
    });

    expect(restoredBox.scrollTop).toBe(240);
    expect(restoredBox.scrollLeft).toBe(180);
  });

  it("縦のみ保存（scrollX=0）のときは縦だけ復元し、横は 0 のまま", async () => {
    const { router, box } = await renderProductsAt("/products?case=ga1d-vertical-only");
    await screen.findByText("P-GA1D");

    trackScroll(box, 260, 0);
    await act(async () => {
      await router.navigate({ to: "/products/new" });
    });
    await waitFor(() => {
      expect(router.stores.resolvedLocation.get()?.href).toBe("/products/new");
    });

    stub.setRevealed(true);
    await act(async () => {
      await router.navigate({ to: "/products?case=ga1d-vertical-only" });
    });
    await waitFor(() => {
      expect(router.stores.resolvedLocation.get()?.href).toBe("/products?case=ga1d-vertical-only");
    });
    const restoredBox = document.querySelector<HTMLElement>(BOX_SELECTOR);
    if (restoredBox === null) throw new Error("products-list scroll container is required");

    await waitFor(() => {
      expect(restoredBox.scrollTop).toBe(260);
    });
    expect(restoredBox.scrollLeft).toBe(0);
  });

  it("横のみ保存（scrollY=0）のときは横だけ復元し、縦は 0 のまま", async () => {
    const { router, box } = await renderProductsAt("/products?case=ga1d-horizontal-only");
    await screen.findByText("P-GA1D");

    trackScroll(box, 0, 320);
    await act(async () => {
      await router.navigate({ to: "/products/new" });
    });
    await waitFor(() => {
      expect(router.stores.resolvedLocation.get()?.href).toBe("/products/new");
    });

    stub.setRevealed(true);
    await act(async () => {
      await router.navigate({ to: "/products?case=ga1d-horizontal-only" });
    });
    await waitFor(() => {
      expect(router.stores.resolvedLocation.get()?.href).toBe(
        "/products?case=ga1d-horizontal-only",
      );
    });
    const restoredBox = document.querySelector<HTMLElement>(BOX_SELECTOR);
    if (restoredBox === null) throw new Error("products-list scroll container is required");

    await waitFor(() => {
      expect(restoredBox.scrollLeft).toBe(320);
    });
    expect(restoredBox.scrollTop).toBe(0);
  });
});
