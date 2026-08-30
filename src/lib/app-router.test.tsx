import { createMemoryHistory, RouterProvider, type ParsedLocation } from "@tanstack/react-router";
import { getElementScrollRestorationEntry } from "@tanstack/router-core";
import { act, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { applyMainNavScroll, createAppRouter, getAppScrollRestorationKey } from "./app-router";
import { consumeMainNavScroll, markMainNavScroll } from "./main-nav-scroll";

const MAIN_SELECTOR = '[data-scroll-restoration-id="main"]';

type AppRouter = ReturnType<typeof createAppRouter>;

interface DeferredRouteRender {
  promise: Promise<void>;
  resolve: () => void;
}

const inventoryRecordsRouteStub = vi.hoisted(() => ({
  deferredRender: undefined as DeferredRouteRender | undefined,
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

vi.mock("@/features/inventory-records/InventoryRecordsPage", async () => {
  const { useEffect, useState } = await import("react");

  return {
    InventoryRecordsPage: () => {
      const deferredRender = inventoryRecordsRouteStub.deferredRender;
      const [isReady, setIsReady] = useState(deferredRender === undefined);

      useEffect(() => {
        if (deferredRender === undefined) return;

        let isMounted = true;
        void deferredRender.promise.then(() => {
          if (isMounted) setIsReady(true);
        });
        return () => {
          isMounted = false;
        };
      }, [deferredRender]);

      return (
        <div>
          {isReady ? (
            <div data-testid="inventory-records-content">inventory records route</div>
          ) : (
            <span data-testid="inventory-records-loading">loading inventory records</span>
          )}
        </div>
      );
    },
  };
});

vi.mock("@/features/inventory-records/ReceivingRecordDetailPage", () => ({
  ReceivingRecordDetailPage: () => <div>receiving record detail route</div>,
}));

function locationWith(href: string, historyKey: string): ParsedLocation {
  return {
    href,
    pathname: href.split("?")[0] ?? href,
    search: {},
    searchStr: href.includes("?") ? `?${href.split("?")[1]}` : "",
    state: { __TSR_key: historyKey },
    hash: "",
    maskedLocation: undefined,
    unmaskOnReload: undefined,
    publicHref: href,
  } as ParsedLocation;
}

async function navigateAndRender(router: AppRouter, to: string) {
  await act(async () => {
    await router.navigate({ href: to });
  });
  await waitFor(() => {
    expect(router.stores.resolvedLocation.get()?.href).toBe(to);
  });
}

function installMainScroller(initialTop = 0) {
  const main = document.createElement("main");
  main.setAttribute("data-scroll-restoration-id", "main");
  main.scrollTop = initialTop;
  document.body.append(main);
  return main;
}

function trackScroll(main: HTMLElement, top: number) {
  main.scrollTop = top;
  main.dispatchEvent(new Event("scroll", { bubbles: true }));
}

function delayNextInventoryRecordsRender(): DeferredRouteRender {
  let resolve: () => void = () => undefined;
  const promise = new Promise<void>((resolvePromise) => {
    resolve = resolvePromise;
  });
  const deferredRender = { promise, resolve };
  inventoryRecordsRouteStub.deferredRender = deferredRender;
  return deferredRender;
}

function installNativeScrollClamp(main: HTMLElement) {
  let actualTop = main.scrollTop;
  let forcedScrollHeight: number | undefined;
  const requestedTops: number[] = [];

  Object.defineProperty(main, "clientHeight", {
    configurable: true,
    get: () => 500,
  });
  Object.defineProperty(main, "scrollHeight", {
    configurable: true,
    get: () =>
      forcedScrollHeight ??
      (main.querySelector('[data-testid="inventory-records-content"]') === null ? 500 : 1_000),
  });
  Object.defineProperty(main, "scrollTop", {
    configurable: true,
    get: () => actualTop,
    set: (requestedTop: number) => {
      requestedTops.push(requestedTop);
      const maximumTop = Math.max(0, main.scrollHeight - main.clientHeight);
      actualTop = Math.min(Math.max(0, requestedTop), maximumTop);
    },
  });

  return {
    requestedTops,
    setScrollHeight: (scrollHeight: number) => {
      forcedScrollHeight = scrollHeight;
      const maximumTop = Math.max(0, scrollHeight - main.clientHeight);
      actualTop = Math.min(actualTop, maximumTop);
    },
  };
}

async function renderAppRouterAt(initialHref: string) {
  const router = createAppRouter({
    history: createMemoryHistory({ initialEntries: [initialHref] }),
  });
  render(<RouterProvider router={router} />);
  await waitFor(() => {
    expect(router.stores.resolvedLocation.get()?.href).toBe(initialHref);
  });
  const main = document.querySelector<HTMLElement>(MAIN_SELECTOR);
  if (main === null) throw new Error("RootLayout main scroll container is required");
  return { router, main };
}

describe("UI-12 / DSR-17 app router configuration", () => {
  beforeEach(() => {
    consumeMainNavScroll();
    sessionStorage.clear();
    inventoryRecordsRouteStub.deferredRender = undefined;
  });

  afterEach(() => {
    document.body.replaceChildren();
  });

  it("T1: uses the complete href instead of the history-entry key", () => {
    expect(getAppScrollRestorationKey(locationWith("/stock", "entry-a"))).toBe("/stock");
    expect(getAppScrollRestorationKey(locationWith("/stock?status=low_stock", "entry-b"))).toBe(
      "/stock?status=low_stock",
    );
  });

  it("T9: wires restoration, the main selector, and the href key into the router", () => {
    const router = createAppRouter({
      history: createMemoryHistory({ initialEntries: ["/stock?status=low_stock"] }),
    });

    expect(router.options.scrollRestoration).toBe(true);
    expect(router.options.scrollToTopSelectors).toEqual([MAIN_SELECTOR]);
    expect(
      router.options.getScrollRestorationKey?.(
        locationWith("/inventory/records?page=3", "unrelated-entry-key"),
      ),
    ).toBe("/inventory/records?page=3");
  });

  it("T4: consumes a matching flag and instantly scrolls main to the top", () => {
    const main = installMainScroller(240);
    const scrollTo = vi.spyOn(main, "scrollTo");
    markMainNavScroll("/products?q=thread");

    applyMainNavScroll("/products?q=thread");

    expect(scrollTo).toHaveBeenCalledOnce();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, left: 0 });
    expect(consumeMainNavScroll()).toBeUndefined();
  });

  it("T4: consumes a mismatched flag without scrolling", () => {
    const main = installMainScroller(240);
    const scrollTo = vi.spyOn(main, "scrollTo");
    markMainNavScroll("/products?q=thread");

    applyMainNavScroll("/inventory/records?page=3");

    expect(scrollTo).not.toHaveBeenCalled();
    expect(consumeMainNavScroll()).toBeUndefined();
  });

  it("T4: leaves scroll untouched when no flag is present", () => {
    const main = installMainScroller(240);
    const scrollTo = vi.spyOn(main, "scrollTo");

    applyMainNavScroll("/products?q=thread");

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("T10: restores a saved main position on a returnTo push and resets an uncached href", async () => {
    const sourceHref = "/inventory/records?recordType=receiving_record&page=2";
    const detailHref =
      "/inventory/receiving/records/12?returnTo=%2Finventory%2Frecords%3FrecordType%3Dreceiving_record%26page%3D2";
    const { router, main } = await renderAppRouterAt(sourceHref);
    installNativeScrollClamp(main);
    expect(router.isScrollRestoring).toBe(true);
    expect(router.isScrollRestorationSetup).toBe(true);

    trackScroll(main, 360);
    await navigateAndRender(router, detailHref);
    expect(main.scrollTop).toBe(0);

    window.dispatchEvent(new Event("pagehide"));
    expect(JSON.parse(sessionStorage.getItem("tsr-scroll-restoration-v1_3") ?? "{}")).toEqual(
      expect.objectContaining({
        [sourceHref]: {
          [MAIN_SELECTOR]: { scrollX: 0, scrollY: 360 },
        },
      }),
    );

    const deferredRender = delayNextInventoryRecordsRender();
    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(0);

    await act(async () => {
      deferredRender.resolve();
      await deferredRender.promise;
    });
    await waitFor(() => {
      expect(main.querySelector('[data-testid="inventory-records-content"]')).not.toBeNull();
      expect(main.scrollTop).toBe(360);
    });

    trackScroll(main, 225);
    await navigateAndRender(router, "/products/new");
    expect(main.scrollTop).toBe(0);

    window.dispatchEvent(new Event("pagehide"));
    expect(sessionStorage.getItem("tsr-scroll-restoration-v1_3")).toContain(sourceHref);
  });

  it("T5: lets a main-navigation flag override a proven cache hit", async () => {
    const sourceHref = "/inventory/records?page=4";
    const detailHref = "/inventory/receiving/records/12";
    const { router, main } = await renderAppRouterAt(sourceHref);

    trackScroll(main, 410);
    await navigateAndRender(router, detailHref);
    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(410);

    trackScroll(main, 515);
    await navigateAndRender(router, detailHref);
    markMainNavScroll(sourceHref);
    await navigateAndRender(router, sourceHref);

    expect(main.scrollTop).toBe(0);
    expect(main.scrollTop).not.toBe(515);
  });

  it("T11: consumes a stale same-href flag on the next href change without breaking return restoration", async () => {
    const sourceHref = "/inventory/records?page=5";
    const detailHref = "/inventory/receiving/records/12";
    const { router, main } = await renderAppRouterAt(sourceHref);

    trackScroll(main, 310);
    await navigateAndRender(router, detailHref);
    trackScroll(main, 190);
    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(310);

    markMainNavScroll(sourceHref);
    trackScroll(main, 470);
    await navigateAndRender(router, detailHref);
    expect(main.scrollTop).toBe(190);
    expect(consumeMainNavScroll()).toBeUndefined();

    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(470);
  });

  it("T12: reapplies a clamped saved position once after delayed content expands", async () => {
    const sourceHref = "/inventory/records?recordType=receiving_record&page=12";
    const detailHref = "/inventory/receiving/records/12?case=delayed-reapply";
    const { router, main } = await renderAppRouterAt(sourceHref);
    const clamp = installNativeScrollClamp(main);

    trackScroll(main, 360);
    await navigateAndRender(router, detailHref);
    const deferredRender = delayNextInventoryRecordsRender();
    clamp.requestedTops.length = 0;

    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(0);
    expect(
      getElementScrollRestorationEntry(router, {
        id: "main",
        getKey: (location) => location.href,
      }),
    ).toEqual({ scrollX: 0, scrollY: 360 });
    expect(clamp.requestedTops.filter((top) => top === 360)).toHaveLength(1);

    await act(async () => {
      deferredRender.resolve();
      await deferredRender.promise;
    });
    await waitFor(() => {
      expect(main.scrollTop).toBe(360);
    });
    expect(clamp.requestedTops.filter((top) => top === 360)).toHaveLength(2);

    await act(async () => {
      main
        .querySelector('[data-testid="inventory-records-content"]')
        ?.append(document.createElement("div"));
      await Promise.resolve();
    });
    expect(clamp.requestedTops.filter((top) => top === 360)).toHaveLength(2);
  });

  it.each(["wheel", "pointerdown", "keydown"])(
    "T12: cancels a delayed reapply after %s user input",
    async (eventType) => {
      const sourceHref = `/inventory/records?recordType=receiving_record&cancel=${eventType}`;
      const detailHref = `/inventory/receiving/records/12?cancel=${eventType}`;
      const { router, main } = await renderAppRouterAt(sourceHref);
      const clamp = installNativeScrollClamp(main);

      trackScroll(main, 340);
      await navigateAndRender(router, detailHref);
      const deferredRender = delayNextInventoryRecordsRender();
      clamp.requestedTops.length = 0;

      await navigateAndRender(router, sourceHref);
      expect(main.scrollTop).toBe(0);
      main.dispatchEvent(new Event(eventType, { bubbles: true }));

      await act(async () => {
        deferredRender.resolve();
        await deferredRender.promise;
      });
      await waitFor(() => {
        expect(main.querySelector('[data-testid="inventory-records-content"]')).not.toBeNull();
      });
      expect(main.scrollTop).toBe(0);
      expect(clamp.requestedTops.filter((top) => top === 340)).toHaveLength(1);
    },
  );

  it("T12: cancels a delayed reapply on the next navigation", async () => {
    const sourceHref = "/inventory/records?recordType=receiving_record&cancel=navigation";
    const detailHref = "/inventory/receiving/records/12?cancel=navigation";
    const { router, main } = await renderAppRouterAt(sourceHref);
    const clamp = installNativeScrollClamp(main);

    trackScroll(main, 320);
    await navigateAndRender(router, detailHref);
    delayNextInventoryRecordsRender();
    clamp.requestedTops.length = 0;

    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(0);
    await navigateAndRender(router, "/products/new?from=delayed-restoration-test");

    clamp.setScrollHeight(1_000);
    await act(async () => {
      main.append(document.createElement("div"));
      await Promise.resolve();
    });
    expect(clamp.requestedTops.filter((top) => top === 320)).toHaveLength(1);
    expect(main.scrollTop).toBe(0);
  });

  it("T13: does not arm delayed restoration after a matching main-navigation flag", async () => {
    const sourceHref = "/inventory/records?recordType=receiving_record&page=13";
    const detailHref = "/inventory/receiving/records/12?case=main-navigation";
    const { router, main } = await renderAppRouterAt(sourceHref);
    const clamp = installNativeScrollClamp(main);

    trackScroll(main, 390);
    await navigateAndRender(router, detailHref);
    const deferredRender = delayNextInventoryRecordsRender();
    clamp.requestedTops.length = 0;
    markMainNavScroll(sourceHref);

    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(0);

    await act(async () => {
      deferredRender.resolve();
      await deferredRender.promise;
    });
    await waitFor(() => {
      expect(main.querySelector('[data-testid="inventory-records-content"]')).not.toBeNull();
    });
    expect(main.scrollTop).toBe(0);
    expect(clamp.requestedTops.filter((top) => top === 390)).toHaveLength(1);
  });

  it("T14: rearms after an initially successful restoration and reapplies after native loss", async () => {
    const sourceHref = "/inventory/records?recordType=receiving_record&page=14";
    const detailHref = "/inventory/receiving/records/12?case=successful-then-lost";
    const { router, main } = await renderAppRouterAt(sourceHref);
    const clamp = installNativeScrollClamp(main);

    trackScroll(main, 360);
    await navigateAndRender(router, detailHref);
    clamp.requestedTops.length = 0;

    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(360);
    expect(clamp.requestedTops.filter((top) => top === 360)).toHaveLength(1);

    clamp.setScrollHeight(500);
    expect(main.scrollTop).toBe(0);
    clamp.setScrollHeight(1_000);
    await act(async () => {
      main
        .querySelector('[data-testid="inventory-records-content"]')
        ?.append(document.createElement("div"));
      await Promise.resolve();
    });

    expect(main.scrollTop).toBe(360);
    expect(clamp.requestedTops.filter((top) => top === 360)).toHaveLength(2);
  });

  it("T14: does not reapply after the successful-restoration recovery limit is reached", async () => {
    const sourceHref = "/inventory/records?recordType=receiving_record&page=15";
    const detailHref = "/inventory/receiving/records/12?case=reapply-limit";
    const { router, main } = await renderAppRouterAt(sourceHref);
    const clamp = installNativeScrollClamp(main);

    trackScroll(main, 370);
    await navigateAndRender(router, detailHref);
    clamp.requestedTops.length = 0;
    await navigateAndRender(router, sourceHref);

    clamp.setScrollHeight(500);
    clamp.setScrollHeight(1_000);
    await act(async () => {
      main
        .querySelector('[data-testid="inventory-records-content"]')
        ?.append(document.createElement("div"));
      await Promise.resolve();
    });
    expect(main.scrollTop).toBe(370);

    clamp.setScrollHeight(500);
    expect(main.scrollTop).toBe(0);
    clamp.setScrollHeight(1_000);
    await act(async () => {
      main
        .querySelector('[data-testid="inventory-records-content"]')
        ?.append(document.createElement("div"));
      await Promise.resolve();
    });

    expect(main.scrollTop).toBe(0);
    expect(clamp.requestedTops.filter((top) => top === 370)).toHaveLength(2);
  });

  it("T14: does not recover a successful restoration lost after user input", async () => {
    const sourceHref = "/inventory/records?recordType=receiving_record&page=16";
    const detailHref = "/inventory/receiving/records/12?case=successful-user-cancel";
    const { router, main } = await renderAppRouterAt(sourceHref);
    const clamp = installNativeScrollClamp(main);

    trackScroll(main, 380);
    await navigateAndRender(router, detailHref);
    clamp.requestedTops.length = 0;
    await navigateAndRender(router, sourceHref);
    expect(main.scrollTop).toBe(380);

    main.dispatchEvent(new Event("wheel", { bubbles: true }));
    clamp.setScrollHeight(500);
    clamp.setScrollHeight(1_000);
    await act(async () => {
      main
        .querySelector('[data-testid="inventory-records-content"]')
        ?.append(document.createElement("div"));
      await Promise.resolve();
    });

    expect(main.scrollTop).toBe(0);
    expect(clamp.requestedTops.filter((top) => top === 380)).toHaveLength(1);
  });
});
