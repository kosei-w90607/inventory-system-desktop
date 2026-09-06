import { getElementScrollRestorationEntry, scrollRestorationCache } from "@tanstack/router-core";
import { createRouter, type ParsedLocation, type RouterHistory } from "@tanstack/react-router";

import { RouteErrorFallback } from "@/components/patterns/RouteErrorFallback";
import { routeTree } from "@/routeTree.gen";

import { consumeMainNavScroll } from "./main-nav-scroll";
import { consumeForceScrollTop } from "./page-scroll";

const MAIN_SCROLL_SELECTOR = '[data-scroll-restoration-id="main"]';
// Gated Amendment 1（2026-09-06）: 商品一覧は表自身が縦横 scroll 箱（data-list-scroll-container）
// になり、<main> はこの画面で scroll しない（DSR-17 例外）。allowlist / scrollToTopSelectors は
// 起動時 sweep・router constructor option として一度だけ評価されるため、resolver 化せず
// main/products-list の静的 2-selector 配列のまま保つ（round 2 是正、Opus P2 — resolver 化すると
// 箱がまだ DOM に無い起動直後に main 単独へ退行し、products-list の cache entry を消してしまう）。
const PRODUCTS_LIST_SCROLL_SELECTOR = '[data-scroll-restoration-id="products-list"]';
const LIST_SCROLL_CONTAINER_SELECTOR = "[data-list-scroll-container]";
const SCROLL_RESTORATION_ALLOWLIST = [MAIN_SCROLL_SELECTOR, PRODUCTS_LIST_SCROLL_SELECTOR];

/** onRendered ごとに動的解決する 3 箇所専用。箱があれば箱を、無ければ <main> を返す。 */
function resolveScrollTarget(): { element: HTMLElement | null; id: "main" | "products-list" } {
  const box = document.querySelector<HTMLElement>(LIST_SCROLL_CONTAINER_SELECTOR);
  if (box !== null) return { element: box, id: "products-list" };
  return { element: document.querySelector<HTMLElement>(MAIN_SCROLL_SELECTOR), id: "main" };
}

export function getAppScrollRestorationKey(location: ParsedLocation): string {
  return location.href;
}

/** DSR-17 (j): allowlist（main/products-list）以外の selector entry を cache から除去する
 * （key 未指定 = 全 key） */
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
        if (!SCROLL_RESTORATION_ALLOWLIST.includes(selector))
          Reflect.deleteProperty(entry, selector);
      }
    }
    return state;
  });
}

export function applyMainNavScroll(locationHref: string): boolean {
  const targetHref = consumeMainNavScroll();
  if (targetHref !== locationHref) return false;

  resolveScrollTarget().element?.scrollTo({ top: 0, left: 0 });
  return true;
}

export function createAppRouter(options: { history?: RouterHistory } = {}) {
  const appRouter = createRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: RouteErrorFallback,
    scrollRestoration: true,
    getScrollRestorationKey: getAppScrollRestorationKey,
    scrollToTopSelectors: SCROLL_RESTORATION_ALLOWLIST,
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
    // Gated Amendment 3 (A3-a): 内蔵 scroll restoration の subscriber はこの subscribe より
    // 先に登録され、同じ onRendered イベントで main.scrollTop を直接代入し得る。ここで flag を
    // 消費し、有効なら後勝ちで先頭へ戻す（applyMainNavScroll と同じ位置で判定する）。
    // Final Review round 3 P2: flag は立てた時の pathname に束縛されており、遷移先の
    // pathname が一致しない場合（別画面への遷移）は無視される。
    const forceScrollTop = consumeForceScrollTop(appRouter.latestLocation.pathname);
    if (applyMainNavScroll(appRouter.latestLocation.href)) return;

    const { element: main, id: scrollId } = resolveScrollTarget();
    if (forceScrollTop) {
      main?.scrollTo({ top: 0, left: 0 });
      return;
    }

    const entry = getElementScrollRestorationEntry(appRouter, {
      id: scrollId,
      getKey: getAppScrollRestorationKey,
    });
    const savedScrollTop = entry?.scrollY;
    const savedScrollLeft = entry?.scrollX;

    // round 2/3 是正: armed 条件は縦・横いずれかが未到達なら成立する（縦のみの early return は
    // 横だけスクロールした状態からの復元を握り潰していた）。各軸の「今回適用する目標値」を
    // 局所 const に確定させ、以降はこの const だけを参照する（クロージャ内で
    // number | undefined の narrowing が失われるのを避ける、round 3 P3）。
    const verticalTarget =
      main !== null &&
      savedScrollTop !== undefined &&
      Number.isFinite(savedScrollTop) &&
      savedScrollTop > 0 &&
      main.scrollTop < savedScrollTop
        ? savedScrollTop
        : undefined;
    const horizontalTarget =
      main !== null &&
      savedScrollLeft !== undefined &&
      Number.isFinite(savedScrollLeft) &&
      savedScrollLeft > 0 &&
      main.scrollLeft < savedScrollLeft
        ? savedScrollLeft
        : undefined;

    if (main === null || (verticalTarget === undefined && horizontalTarget === undefined)) {
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
    let verticalDone = verticalTarget === undefined;
    let horizontalDone = horizontalTarget === undefined;
    const applyWhenScrollable = () => {
      if (
        !verticalDone &&
        verticalTarget !== undefined &&
        main.scrollHeight >= verticalTarget + main.clientHeight
      ) {
        main.scrollTop = verticalTarget;
        verticalDone = true;
      }
      if (
        !horizontalDone &&
        horizontalTarget !== undefined &&
        main.scrollWidth >= horizontalTarget + main.clientWidth
      ) {
        main.scrollLeft = horizontalTarget;
        horizontalDone = true;
      }
      // (i) 是正: 解除（stop）は armed だった軸をすべて適用し終えてから一括で行う。
      if (verticalDone && horizontalDone) stop();
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
