import { getElementScrollRestorationEntry, scrollRestorationCache } from "@tanstack/router-core";
import { createRouter, type ParsedLocation, type RouterHistory } from "@tanstack/react-router";

import { RouteErrorFallback } from "@/components/patterns/RouteErrorFallback";
import { routeTree } from "@/routeTree.gen";

import { consumeMainNavScroll } from "./main-nav-scroll";
import { consumeForceScrollTop } from "./page-scroll";

const MAIN_SCROLL_SELECTOR = '[data-scroll-restoration-id="main"]';
// 商品一覧は表自身が縦横 scroll 箱（data-list-scroll-container）を持つ（DSR-17 例外）。
// Lane 4 Gated Amendment 3 GA3b（2026-09-07）で <main> の page scroll も併存するように
// なった（約 50 行以下は main、51 行超の縦・横は常に箱、詳細は resolveScrollTargets/
// onRendered 参照）。allowlist / scrollToTopSelectors は起動時 sweep・router constructor
// option として一度だけ評価されるため、resolver 化せず main/products-list の静的
// 2-selector 配列のまま保つ（round 2 是正、Opus P2 — resolver 化すると箱がまだ DOM に
// 無い起動直後に main 単独へ退行し、products-list の cache entry を消してしまう）。
const PRODUCTS_LIST_SCROLL_SELECTOR = '[data-scroll-restoration-id="products-list"]';
const LIST_SCROLL_CONTAINER_SELECTOR = "[data-list-scroll-container]";
const SCROLL_RESTORATION_ALLOWLIST = [MAIN_SCROLL_SELECTOR, PRODUCTS_LIST_SCROLL_SELECTOR];

// Lane 4 Gated Amendment 3 GA3b（2026-09-07）: 商品一覧では <main>（縦、約 50 行以下で
// page scroll）と箱（横は常に、51 行超のときは縦も）の両方が独立した scroller になる
// （旧 Gated Amendment 1 の「箱があれば箱、無ければ main」という択一は撤回）。
// onRendered ごとに動的解決する 3 箇所専用。
function resolveScrollTargets(): {
  main: HTMLElement | null;
  box: HTMLElement | null;
} {
  return {
    main: document.querySelector<HTMLElement>(MAIN_SCROLL_SELECTOR),
    box: document.querySelector<HTMLElement>(LIST_SCROLL_CONTAINER_SELECTOR),
  };
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

  // GA3b: main（縦）と箱（横 + 51 行超時は縦）の両方をリセットする。box が無い画面では
  // main だけが存在し従来どおり（GA1c 旧「箱優先」は撤回、両方存在すれば両方リセット）。
  const { main, box } = resolveScrollTargets();
  main?.scrollTo({ top: 0, left: 0 });
  box?.scrollTo({ top: 0, left: 0 });
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

    // Lane 4 Gated Amendment 3 GA3b: main（縦）と箱（横は常に、51 行超のときは縦も）を
    // 独立した 2 target として復元・先頭化する（旧 GA1 の「箱があれば箱のみ」択一は撤回、
    // packet「Scroll restoration の再設計」armed/disarm 条件表を参照）。
    const { main, box } = resolveScrollTargets();
    if (forceScrollTop) {
      main?.scrollTo({ top: 0, left: 0 });
      box?.scrollTo({ top: 0, left: 0 });
      return;
    }

    const mainEntry = getElementScrollRestorationEntry(appRouter, {
      id: "main",
      getKey: getAppScrollRestorationKey,
    });
    const boxEntry = getElementScrollRestorationEntry(appRouter, {
      id: "products-list",
      getKey: getAppScrollRestorationKey,
    });

    // round 2/3 是正の踏襲: armed 条件は各 target・各軸ごとに独立して判定する。箱の縦は
    // 51 行以下では scrollHeight が clientHeight を超えないため、適用条件
    // （applyWhenScrollable の scrollHeight >= target + clientHeight）が構造的に満たされず
    // 常に unarmed のまま——box.scrollHeight > box.clientHeight を armed 条件の時点で
    // 前もって確認すると、box がまだ内容未読込みで一時的に非 scroll 状態のときに armed
    // 判定そのものを握り潰してしまう（content が後から伸びる場合を見逃す）ため、ここでは
    // 事前条件にしない。
    const mainVerticalTarget =
      main !== null &&
      mainEntry?.scrollY !== undefined &&
      Number.isFinite(mainEntry.scrollY) &&
      mainEntry.scrollY > 0 &&
      main.scrollTop < mainEntry.scrollY
        ? mainEntry.scrollY
        : undefined;
    const boxHorizontalTarget =
      box !== null &&
      boxEntry?.scrollX !== undefined &&
      Number.isFinite(boxEntry.scrollX) &&
      boxEntry.scrollX > 0 &&
      box.scrollLeft < boxEntry.scrollX
        ? boxEntry.scrollX
        : undefined;
    // 境界（Final Review round 3 P3、Opus）: 箱が最後まで縦 scroll 可能にならない場合
    // （51 行以下のまま）でも armed な observer/listener は無期限には残らない——次の
    // wheel/pointerdown/keydown（stop）か次の route 遷移（onBeforeLoad の
    // cancelDelayedRestoration 呼出し）のいずれか早い方で必ず解除される。
    const boxVerticalTarget =
      box !== null &&
      boxEntry?.scrollY !== undefined &&
      Number.isFinite(boxEntry.scrollY) &&
      boxEntry.scrollY > 0 &&
      box.scrollTop < boxEntry.scrollY
        ? boxEntry.scrollY
        : undefined;

    if (
      mainVerticalTarget === undefined &&
      boxHorizontalTarget === undefined &&
      boxVerticalTarget === undefined
    ) {
      return;
    }

    const userInputEvents = ["wheel", "pointerdown", "keydown"] as const;
    // 単一 slot の合成（packet 参照）: main 用・箱用それぞれの MutationObserver を個別の
    // stop() にせず、両方の disconnect をまとめて実行する 1 つの合成 stop を
    // cancelDelayedRestoration に代入する（2 つ目の stop で上書きすると 1 つ目の observer
    // が解除されずリークする）。
    const stop = () => {
      mainObserver?.disconnect();
      boxObserver?.disconnect();
      for (const eventName of userInputEvents) {
        document.removeEventListener(eventName, stop, true);
      }
      if (cancelDelayedRestoration === stop) cancelDelayedRestoration = undefined;
    };
    let mainVerticalDone = mainVerticalTarget === undefined;
    let boxHorizontalDone = boxHorizontalTarget === undefined;
    let boxVerticalDone = boxVerticalTarget === undefined;
    const applyWhenScrollable = () => {
      if (
        !mainVerticalDone &&
        mainVerticalTarget !== undefined &&
        main !== null &&
        main.scrollHeight >= mainVerticalTarget + main.clientHeight
      ) {
        main.scrollTop = mainVerticalTarget;
        mainVerticalDone = true;
      }
      if (
        !boxHorizontalDone &&
        boxHorizontalTarget !== undefined &&
        box !== null &&
        box.scrollWidth >= boxHorizontalTarget + box.clientWidth
      ) {
        box.scrollLeft = boxHorizontalTarget;
        boxHorizontalDone = true;
      }
      if (
        !boxVerticalDone &&
        boxVerticalTarget !== undefined &&
        box !== null &&
        box.scrollHeight >= boxVerticalTarget + box.clientHeight
      ) {
        box.scrollTop = boxVerticalTarget;
        boxVerticalDone = true;
      }
      // (i) 是正の踏襲: 解除（stop）は armed だった軸をすべて適用し終えてから一括で行う。
      if (mainVerticalDone && boxHorizontalDone && boxVerticalDone) stop();
    };

    let mainObserver: MutationObserver | undefined;
    let boxObserver: MutationObserver | undefined;
    if (main !== null && mainVerticalTarget !== undefined) {
      mainObserver = new MutationObserver(applyWhenScrollable);
      mainObserver.observe(main, { childList: true, subtree: true });
    }
    if (box !== null && (boxHorizontalTarget !== undefined || boxVerticalTarget !== undefined)) {
      boxObserver = new MutationObserver(applyWhenScrollable);
      boxObserver.observe(box, { childList: true, subtree: true });
    }
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
