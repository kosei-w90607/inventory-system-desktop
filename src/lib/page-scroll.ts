const PAGE_TOP_SCROLL_OPTIONS: ScrollToOptions = { top: 0, left: 0, behavior: "smooth" };

// Lane 4 Gated Amendment 3 GA3b（2026-09-07）: 商品一覧は表自身が縦横 scroll 箱になる
// （旧 Gated Amendment 1）が、GA3b で <main> の page scroll も復活した（約 50 行以下）。
// 箱と main の両方が存在すれば両方へ scrollTo する（他 23 箇所の scrollPageToTop()
// 呼出し元は箱が無いため main のみで従来どおり）。data-list-scroll-container は
// 「この要素が scroller」というマーカーで、復元 cache を安定識別する
// data-scroll-restoration-id とは役割が異なる（app-router.ts 参照）。
const LIST_SCROLL_CONTAINER_SELECTOR = "[data-list-scroll-container]";

// Gated Amendment 3 (A3-a): TanStack Router 内蔵の scroll restoration は
// createAppRouter() の独自 onRendered より先に subscribe され、page reset 後の href に
// 復元 cache の entry があれば main.scrollTop を同期で直接代入する。scrollPageToTop() の
// smooth scrollTo() はその代入で中断され得るため、「次の render は強制的に先頭」flag を
// 立てて独自 onRendered 側に後勝ちさせる（詳細は docs/plans 該当 lane packet Gated
// Amendment 3 節）。flag は有効期限付き: navigate を伴わない呼出し（保存後の DSR-03 型）
// で立った flag が、無関係な後続の正規の「戻り」復元（DSR-17 ②）を壊さないようにする。
//
// Final Review round 3 P2: navigate を伴わない呼出し（24 箇所中 14 箇所）で立った flag は
// 次の href 変更まで消費されない。TTL 内に利用者が別画面（復元 cache を持つ）へ移ると、
// その画面の正規の「戻り」復元（DSR-17 ②）が flag に潰される。flag を「立てた時の
// pathname」に束縛し、遷移先の pathname が一致する場合（= search だけが変わる perPage
// 変更）のみ有効とすることで、別画面への遷移（pathname 不一致）では無視されるようにする。
const FORCE_SCROLL_TOP_TTL_MS = 1_000;

let forceScrollTopDeadline: number | undefined;
let forceScrollTopPathname: string | undefined;

/** scrollPageToTop() が内部で呼ぶ。次に onRendered が発火した際に main.scrollTop を
 * 強制的に 0 にする flag を、有効期限 + 現在の pathname 束縛つきで立てる。 */
function markForceScrollTop(): void {
  forceScrollTopDeadline = Date.now() + FORCE_SCROLL_TOP_TTL_MS;
  forceScrollTopPathname = window.location.pathname;
}

/** app-router.ts の onRendered から呼ぶ。flag を消費（クリア）し、期限内 かつ
 * 遷移先の pathname が flag を立てた時の pathname と一致する場合のみ true を返す。 */
export function consumeForceScrollTop(currentPathname: string): boolean {
  const deadline = forceScrollTopDeadline;
  const pathname = forceScrollTopPathname;
  forceScrollTopDeadline = undefined;
  forceScrollTopPathname = undefined;
  return (
    deadline !== undefined &&
    Date.now() <= deadline &&
    pathname !== undefined &&
    pathname === currentPathname
  );
}

export function scrollPageToTop(): void {
  markForceScrollTop();
  // Lane 4 Gated Amendment 3 GA3b: 商品一覧では <main>（約 50 行以下で page scroll）と
  // 箱（横は常に、51 行超で縦も）の両方が scroller になり得るため、どちらも存在すれば
  // 両方へ scrollTo する（旧 GA1 の `??` 択一は片方しか戻さなかった）。
  const box = document.querySelector(LIST_SCROLL_CONTAINER_SELECTOR);
  const main = document.querySelector("main");
  let scrolled = false;
  if (box instanceof HTMLElement && typeof box.scrollTo === "function") {
    box.scrollTo(PAGE_TOP_SCROLL_OPTIONS);
    scrolled = true;
  }
  if (main instanceof HTMLElement && typeof main.scrollTo === "function") {
    main.scrollTo(PAGE_TOP_SCROLL_OPTIONS);
    scrolled = true;
  }
  if (!scrolled) window.scrollTo(PAGE_TOP_SCROLL_OPTIONS);
}
