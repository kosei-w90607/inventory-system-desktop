// 一時 probe、L3 round 3 用、Ready 前に撤去（packet Scope 8 / AC9）。
//
// owner L3 round 2 要請: 追加観察（sidebar recenter / 入庫・廃棄間 loop / 商品検索への誤遷移）の
// 機序確定用。有力候補 H2 = TanStack `scrollRestoration: true`
// (`@tanstack/router-core` scroll-restoration.js) が document capture で任意要素
// （sidebar の ScrollArea viewport を含む）を CSS selector で cache し、遷移後に
// querySelector + scrollTo で復元するため、route ごとに sidebar 位置が異なる履歴があると
// 遷移直後に sidebar が跳ぶ、という仮説を pointer / focus / scroll / router event の
// 時系列 log で裏取りする。H2 の是正（router option 変更）は本 lane の scope 外（R3）。
//
// 制約: UI 文言・layout・既存 component の class / 挙動を変えない、既存 test を改変しない、
// 依存追加なし、console 出力は行わない。
import { router as appRouter } from "@/lib/app-router";

const SIDEBAR_NAV_SELECTOR = 'nav[aria-label="メインナビゲーション"]';
const SIDEBAR_VIEWPORT_SELECTOR = "[data-radix-scroll-area-viewport]";
const RING_BUFFER_LIMIT = 500;

type PointerRecordKind = "pointerdown" | "pointerup" | "click" | "focusin";

interface BaseRecord {
  t: number;
  kind: string;
}

interface PointerFocusRecord extends BaseRecord {
  kind: PointerRecordKind;
  targetLinkLabel: string | null;
  targetLinkHref: string | null;
  activeElementLinkLabel: string | null;
  activeElementLinkHref: string | null;
  sidebarScrollTop: number | null;
  clientX: number | null;
  clientY: number | null;
  pointLinkLabel: string | null;
  pathname: string;
  search: string;
}

interface ScrollRecord extends BaseRecord {
  kind: "scroll";
  scrollTop: number;
  delta: number;
}

interface RouterRecord extends BaseRecord {
  kind: "onBeforeLoad" | "onRendered";
  pathname: string;
  search: string;
  sidebarScrollTop: number | null;
}

type ProbeRecord = PointerFocusRecord | ScrollRecord | RouterRecord;

function getSidebarViewport(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const nav = document.querySelector(SIDEBAR_NAV_SELECTOR);
  if (nav === null) return null;
  return nav.closest<HTMLElement>(SIDEBAR_VIEWPORT_SELECTOR);
}

function nearestLinkInfo(el: Element | null): { label: string | null; href: string | null } {
  if (el === null) return { label: null, href: null };
  const link = el.closest<HTMLElement>("a, [role='link']");
  if (link === null) return { label: null, href: null };
  return {
    label: link.textContent?.trim() ?? null,
    href: link.getAttribute("href"),
  };
}

function noop(): void {
  // no-op cleanup for environments without document (SSR guard)
}

export function installSidebarDiagnosticProbe(): () => void {
  if (typeof document === "undefined") return noop;

  const records: ProbeRecord[] = [];
  const push = (record: ProbeRecord) => {
    records.push(record);
    if (records.length > RING_BUFFER_LIMIT) records.shift();
  };

  let previousScrollTop: number | null = null;

  const handlePointerOrFocus = (kind: PointerRecordKind) => (event: Event) => {
    const target = nearestLinkInfo(event.target instanceof Element ? event.target : null);
    const active = nearestLinkInfo(document.activeElement);
    const viewport = getSidebarViewport();
    let clientX: number | null = null;
    let clientY: number | null = null;
    let pointLinkLabel: string | null = null;
    if (event instanceof PointerEvent || event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
      try {
        const atPoint =
          typeof document.elementFromPoint === "function"
            ? document.elementFromPoint(clientX, clientY)
            : null;
        pointLinkLabel = nearestLinkInfo(atPoint).label;
      } catch {
        pointLinkLabel = null;
      }
    }
    push({
      t: performance.now(),
      kind,
      targetLinkLabel: target.label,
      targetLinkHref: target.href,
      activeElementLinkLabel: active.label,
      activeElementLinkHref: active.href,
      sidebarScrollTop: viewport?.scrollTop ?? null,
      clientX,
      clientY,
      pointLinkLabel,
      pathname: location.pathname,
      search: location.search,
    });
  };

  const handlers: Record<PointerRecordKind, (event: Event) => void> = {
    pointerdown: handlePointerOrFocus("pointerdown"),
    pointerup: handlePointerOrFocus("pointerup"),
    click: handlePointerOrFocus("click"),
    focusin: handlePointerOrFocus("focusin"),
  };

  for (const [eventName, handler] of Object.entries(handlers)) {
    document.addEventListener(eventName, handler, true);
  }

  const handleScroll = (event: Event) => {
    const viewport = getSidebarViewport();
    if (viewport === null || event.target !== viewport) return;
    const scrollTop = viewport.scrollTop;
    const delta = previousScrollTop === null ? 0 : scrollTop - previousScrollTop;
    previousScrollTop = scrollTop;
    push({ t: performance.now(), kind: "scroll", scrollTop, delta });
  };
  document.addEventListener("scroll", handleScroll, true);

  const unsubscribeBeforeLoad = appRouter.subscribe("onBeforeLoad", () => {
    const viewport = getSidebarViewport();
    push({
      t: performance.now(),
      kind: "onBeforeLoad",
      pathname: appRouter.latestLocation.pathname,
      search: JSON.stringify(appRouter.latestLocation.search),
      sidebarScrollTop: viewport?.scrollTop ?? null,
    });
  });
  const unsubscribeRendered = appRouter.subscribe("onRendered", () => {
    const viewport = getSidebarViewport();
    push({
      t: performance.now(),
      kind: "onRendered",
      pathname: appRouter.latestLocation.pathname,
      search: JSON.stringify(appRouter.latestLocation.search),
      sidebarScrollTop: viewport?.scrollTop ?? null,
    });
  });

  let overlay: HTMLPreElement | null = null;
  const ensureOverlay = (): HTMLPreElement => {
    if (overlay !== null) return overlay;
    const pre = document.createElement("pre");
    pre.style.position = "fixed";
    pre.style.right = "8px";
    pre.style.bottom = "8px";
    pre.style.width = "60vw";
    pre.style.maxHeight = "45vh";
    pre.style.overflow = "auto";
    pre.style.font = "11px/1.3 monospace";
    pre.style.background = "rgba(0,0,0,.85)";
    pre.style.color = "#fff";
    pre.style.padding = "8px";
    pre.style.zIndex = "2147483647";
    pre.style.userSelect = "text";
    pre.style.whiteSpace = "pre-wrap";
    pre.style.display = "none";
    document.body.appendChild(pre);
    overlay = pre;
    return pre;
  };

  const recordToLine = (record: ProbeRecord): string => {
    const fields: string[] = [record.t.toFixed(1), record.kind];
    for (const [key, value] of Object.entries(record)) {
      if (key === "t" || key === "kind") continue;
      fields.push(`${key}=${String(value)}`);
    }
    return fields.join("\t");
  };

  const renderOverlay = () => {
    const pre = ensureOverlay();
    pre.textContent = records.map(recordToLine).join("\n");
  };

  const handleKeydown = (event: KeyboardEvent) => {
    if (!event.ctrlKey || !event.shiftKey) return;
    if (event.key === "D" || event.key === "d") {
      const pre = ensureOverlay();
      if (pre.style.display === "none") {
        renderOverlay();
        pre.style.display = "block";
      } else {
        pre.style.display = "none";
      }
    } else if (event.key === "C" || event.key === "c") {
      const pre = ensureOverlay();
      renderOverlay();
      const text = pre.textContent ?? "";
      try {
        void navigator.clipboard.writeText(text).catch(() => {
          pre.textContent = `${text}\nclipboard unavailable`;
        });
      } catch {
        pre.textContent = `${text}\nclipboard unavailable`;
      }
    }
  };
  document.addEventListener("keydown", handleKeydown);

  return () => {
    for (const [eventName, handler] of Object.entries(handlers)) {
      document.removeEventListener(eventName, handler, true);
    }
    document.removeEventListener("scroll", handleScroll, true);
    document.removeEventListener("keydown", handleKeydown);
    unsubscribeBeforeLoad();
    unsubscribeRendered();
    overlay?.remove();
    overlay = null;
  };
}
