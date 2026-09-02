import { Link, useLinkProps, useRouterState } from "@tanstack/react-router";

import type { NavItem } from "@/config/navigation";
import { cn } from "@/lib/utils";
import { markMainNavScroll } from "@/lib/main-nav-scroll";
import {
  CURRENT_LOCATION_ACCENT,
  SELECTION_TONE_ACTIVE,
  SELECTION_TONE_ACTIVE_ICON,
} from "@/components/ui/selection-tone";

interface SidebarLinkProps {
  item: NavItem;
}

// TanStack <Link> は base className と activeProps/inactiveProps.className を連結する
// のみで merge しない（tailwind-merge 非経由）。base 側に border 色 class を置くと、
// active/inactive どちらの経路でも同一 CSS property（border-* の色）が二重に出力され、
// 生成 CSS の定義順に応じて後勝ちする tailwind の cascade で色が不可視化しうる
// （2026-09-02 wave 8 lane 1 是正: border-l-transparent が border-l-primary を
// 打ち消し Windows で Primary バーが見えなくなっていた／round 3: plain <Link> 連結経路と
// ActiveMatchSidebarLink 単一 cn() 経路で active の全周枠 border-stone-400 の有無が
// 分岐していた、L3 round 2 (iv) FAIL）。base は border 色 class を一切持たず
// `border border-l-[3px]`（幅のみ）に留める。色は active 側（SELECTION_TONE_ACTIVE /
// CURRENT_LOCATION_ACCENT）と inactive 側（inactiveClass の border-transparent）でのみ持つ。
const baseClass =
  "flex items-center gap-2 rounded-md border border-l-[3px] px-2 py-1.5 text-sm transition-colors";

// UI_TECH_STACK.md §5.4 系統① focus ring（52 §52.1 規定）。focusable な link（active /
// inactive）のみに適用し、pending の tabIndex={-1} span には付与しない（batch A packet、2026-08-03）。
const focusRingClass =
  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

const inactiveClass = cn(
  "border-transparent text-foreground hover:bg-stone-200/60",
  "[&_svg]:text-stone-500",
);

interface ActiveMatchSidebarLinkProps {
  item: NavItem & { to: string; activeMatch: NonNullable<NavItem["activeMatch"]> };
}

function ActiveMatchSidebarLink({ item }: ActiveMatchSidebarLinkProps) {
  const location = useRouterState({ select: (state) => state.location });
  const currentValue = (location.search as Record<string, unknown>)[item.activeMatch.searchKey];
  const matchesIs = item.activeMatch.is === undefined || currentValue === item.activeMatch.is;
  const matchesIsNot =
    item.activeMatch.isNot === undefined || currentValue !== item.activeMatch.isNot;
  const isActive = location.pathname === item.to && matchesIs && matchesIsNot;
  const linkProps = useLinkProps({
    to: item.to,
    ...(item.search === undefined ? {} : { search: item.search }),
  });
  const Icon = item.icon;

  return (
    // useLinkProps で SPA 遷移を維持しつつ、同一 pathname の標準 active 属性は
    // UI-12-D1 の search predicate に基づく値で上書きする。
    <a
      {...linkProps}
      href={linkProps.href}
      onClick={(event) => {
        const targetHref = event.currentTarget.getAttribute("href");
        if (targetHref !== null) markMainNavScroll(targetHref);
        linkProps.onClick?.(event);
      }}
      className={cn(
        baseClass,
        focusRingClass,
        isActive
          ? cn(SELECTION_TONE_ACTIVE, SELECTION_TONE_ACTIVE_ICON, CURRENT_LOCATION_ACCENT)
          : inactiveClass,
      )}
      aria-current={isActive ? "page" : undefined}
      data-status={isActive ? "active" : undefined}
    >
      <Icon className="size-4 stroke-[1.5]" aria-hidden="true" />
      <span>{item.label}</span>
    </a>
  );
}

/// UI-12 サイドバーの 1 リンク。status で描画分岐する。
/// 設計: docs/function-design/52-ui-shared-layout.md §52.1 / §52.6
/// - status === "active" && to !== null: <Link> + activeOptions={{ exact: true, includeSearch: false }} + activeProps で active 時 shared stone selection tone
///   includeSearch:false は search params 付き URL (例: /stock?q=abc) でも path 一致のみで active 判定する (TanStack デフォルト includeSearch:true は search 完全一致を要求し active が外れる)
/// - activeMatch あり: useRouterState の pathname + search で排他的に active 判定し、useLinkProps で Link と同じ SPA 遷移を維持する
/// - status === "pending" or to === null: <span role="link" aria-disabled="true" tabIndex={-1}> + sr-only "（未実装）"
/// アイコン色は Tailwind 4 arbitrary variant ([&_svg]:text-...) で active/inactive を制御する。
export function SidebarLink({ item }: SidebarLinkProps) {
  const Icon = item.icon;

  if (item.status === "pending" || item.to === null) {
    return (
      <span
        role="link"
        aria-disabled="true"
        tabIndex={-1}
        className={cn(baseClass, "cursor-not-allowed border-transparent text-stone-500 opacity-60")}
      >
        <Icon className="size-4 stroke-[1.5] text-stone-500" aria-hidden="true" />
        <span>{item.label}</span>
        <span className="sr-only">（未実装）</span>
      </span>
    );
  }

  if (item.activeMatch !== undefined) {
    return (
      <ActiveMatchSidebarLink item={{ ...item, to: item.to, activeMatch: item.activeMatch }} />
    );
  }

  return (
    <Link
      to={item.to}
      {...(item.search === undefined ? {} : { search: item.search })}
      onClick={(event) => {
        const targetHref = event.currentTarget.getAttribute("href");
        if (targetHref !== null) markMainNavScroll(targetHref);
      }}
      activeOptions={{ exact: true, includeSearch: false }}
      className={cn(baseClass, focusRingClass)}
      activeProps={{
        className: cn(SELECTION_TONE_ACTIVE, SELECTION_TONE_ACTIVE_ICON, CURRENT_LOCATION_ACCENT),
      }}
      inactiveProps={{
        className: inactiveClass,
      }}
    >
      <Icon className="size-4 stroke-[1.5]" aria-hidden="true" />
      <span>{item.label}</span>
    </Link>
  );
}
