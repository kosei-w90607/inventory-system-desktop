import { createRouter, type ParsedLocation, type RouterHistory } from "@tanstack/react-router";

import { RouteErrorFallback } from "@/components/patterns/RouteErrorFallback";
import { routeTree } from "@/routeTree.gen";

import { consumeMainNavScroll } from "./main-nav-scroll";

const MAIN_SCROLL_SELECTOR = '[data-scroll-restoration-id="main"]';

export function getAppScrollRestorationKey(location: ParsedLocation): string {
  return location.href;
}

export function applyMainNavScroll(locationHref: string): void {
  const targetHref = consumeMainNavScroll();
  if (targetHref !== locationHref) return;

  document.querySelector<HTMLElement>(MAIN_SCROLL_SELECTOR)?.scrollTo({ top: 0, left: 0 });
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

  appRouter.subscribe("onRendered", () => {
    applyMainNavScroll(appRouter.latestLocation.href);
  });

  return appRouter;
}

export const router = createAppRouter();

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
