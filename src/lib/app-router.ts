import { getElementScrollRestorationEntry, scrollRestorationCache } from "@tanstack/router-core";
import { createRouter, type ParsedLocation, type RouterHistory } from "@tanstack/react-router";

import { RouteErrorFallback } from "@/components/patterns/RouteErrorFallback";
import { routeTree } from "@/routeTree.gen";

import { consumeMainNavScroll } from "./main-nav-scroll";

const MAIN_SCROLL_SELECTOR = '[data-scroll-restoration-id="main"]';

export function getAppScrollRestorationKey(location: ParsedLocation): string {
  return location.href;
}

/** DSR-17 (j): <main> 以外の selector entry を cache から除去する（key 未指定 = 全 key） */
export function pruneScrollRestorationEntries(
  key?: string,
  cache: typeof scrollRestorationCache = scrollRestorationCache,
): void {
  if (!cache) return;
  cache.set((state) => {
    const keys = key === undefined ? Object.keys(state) : [key];
    for (const k of keys) {
      const entry = state[k] as (typeof state)[string] | undefined;
      if (!entry) continue;
      for (const selector of Object.keys(entry)) {
        if (selector !== MAIN_SCROLL_SELECTOR) Reflect.deleteProperty(entry, selector);
      }
    }
    return state;
  });
}

export function applyMainNavScroll(locationHref: string): boolean {
  const targetHref = consumeMainNavScroll();
  if (targetHref !== locationHref) return false;

  document.querySelector<HTMLElement>(MAIN_SCROLL_SELECTOR)?.scrollTo({ top: 0, left: 0 });
  return true;
}

export function createAppRouter(options: { history?: RouterHistory } = {}) {
  const appRouter = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: RouteErrorFallback,
    scrollRestoration: true,
    getScrollRestorationKey: getAppScrollRestorationKey,
    scrollToTopSelectors: [MAIN_SCROLL_SELECTOR],
    ...(options.history === undefined ? {} : { history: options.history }),
  });
  pruneScrollRestorationEntries();

  let cancelDelayedRestoration: (() => void) | undefined;

  appRouter.subscribe("onBeforeLoad", (event) => {
    cancelDelayedRestoration?.();
    if (event.fromLocation) {
      pruneScrollRestorationEntries(getAppScrollRestorationKey(event.fromLocation));
    }
  });

  appRouter.subscribe("onRendered", () => {
    cancelDelayedRestoration?.();
    if (applyMainNavScroll(appRouter.latestLocation.href)) return;

    const main = document.querySelector<HTMLElement>(MAIN_SCROLL_SELECTOR);
    const entry = getElementScrollRestorationEntry(appRouter, {
      id: "main",
      getKey: getAppScrollRestorationKey,
    });
    const savedScrollTop = entry?.scrollY;

    if (
      main === null ||
      savedScrollTop === undefined ||
      !Number.isFinite(savedScrollTop) ||
      savedScrollTop <= 0 ||
      main.scrollTop >= savedScrollTop
    ) {
      return;
    }

    const userInputEvents = ["wheel", "pointerdown", "keydown"] as const;
    const stop = () => {
      observer.disconnect();
      for (const eventName of userInputEvents) {
        document.removeEventListener(eventName, stop, true);
      }
      if (cancelDelayedRestoration === stop) cancelDelayedRestoration = undefined;
    };
    const applyWhenScrollable = () => {
      if (main.scrollHeight < savedScrollTop + main.clientHeight) return;

      main.scrollTop = savedScrollTop;
      stop();
    };

    const observer = new MutationObserver(applyWhenScrollable);
    observer.observe(main, { childList: true, subtree: true });
    for (const eventName of userInputEvents) {
      document.addEventListener(eventName, stop, true);
    }
    cancelDelayedRestoration = stop;
    applyWhenScrollable();
  });

  return appRouter;
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
