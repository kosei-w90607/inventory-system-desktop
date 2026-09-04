const PAGE_TOP_SCROLL_OPTIONS: ScrollToOptions = { top: 0, behavior: "smooth" };

// Gated Amendment 3 (A3-a): TanStack Router 内蔵の scroll restoration は
// createAppRouter() の独自 onRendered より先に subscribe され、page reset 後の href に
// 復元 cache の entry があれば main.scrollTop を同期で直接代入する。scrollPageToTop() の
// smooth scrollTo() はその代入で中断され得るため、「次の render は強制的に先頭」flag を
// 立てて独自 onRendered 側に後勝ちさせる（詳細は docs/plans 該当 lane packet Gated
// Amendment 3 節）。flag は有効期限付き: navigate を伴わない呼出し（保存後の DSR-03 型）
// で立った flag が、無関係な後続の正規の「戻り」復元（DSR-17 ②）を壊さないようにする。
const FORCE_SCROLL_TOP_TTL_MS = 1_000;

let forceScrollTopDeadline: number | undefined;

/** scrollPageToTop() が内部で呼ぶ。次に onRendered が発火した際に main.scrollTop を
 * 強制的に 0 にする flag を、有効期限つきで立てる。 */
function markForceScrollTop(): void {
  forceScrollTopDeadline = Date.now() + FORCE_SCROLL_TOP_TTL_MS;
}

/** app-router.ts の onRendered から呼ぶ。flag を消費（クリア）し、期限内であれば true を返す。 */
export function consumeForceScrollTop(): boolean {
  const deadline = forceScrollTopDeadline;
  forceScrollTopDeadline = undefined;
  return deadline !== undefined && Date.now() <= deadline;
}

export function scrollPageToTop(): void {
  markForceScrollTop();
  const main = document.querySelector("main");
  if (main instanceof HTMLElement && typeof main.scrollTo === "function") {
    main.scrollTo(PAGE_TOP_SCROLL_OPTIONS);
    return;
  }

  window.scrollTo(PAGE_TOP_SCROLL_OPTIONS);
}
