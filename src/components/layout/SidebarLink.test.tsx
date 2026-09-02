// src/components/layout/SidebarLink.test.tsx
//
// PR-1 (B1 nav fix, Codex P2-1): SidebarLink は全画面共通サイドバーの 1 リンクで、
// B1「全画面サイドバー active 消失」の核心バグ。TabsHeader だけでは共有 nav の退行を
// CI で取り逃がす (includeSearch を戻しても緑のまま通る) ため SidebarLink 単体で検証する。
// 設計: docs/plans/2026-05-22-tone-and-nav-fix.md PR-1
//
// 回帰検出力のため initialEntries に search params を必ず載せる (R2-1):
// activeOptions.includeSearch:false により search params 付き URL でも path 一致のみで
// active 判定されることを data-status="active" 属性で検証する (クラス hardcode は脆い)。

import { beforeEach, describe, it, expect } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { Search } from "lucide-react";

import { SidebarLink } from "./SidebarLink";
import { SidebarArea } from "./SidebarArea";
import { navigation } from "@/config/navigation";
import type { NavItem } from "@/config/navigation";
import { consumeMainNavScroll } from "@/lib/main-nav-scroll";

beforeEach(() => {
  consumeMainNavScroll();
});

// navigation.ts の在庫照会 NavItem (to: "/stock") 相当。単一 NavItem で十分 (20 項目は不要)。
const stockItem: NavItem = {
  id: "ui-06a",
  label: "在庫照会",
  title: "在庫照会",
  to: "/stock",
  icon: Search,
  status: "active",
};

const stockNavigationAreas = navigation.filter(
  (area) => area.id === "daily" || area.id === "inventory",
);
if (stockNavigationAreas.length !== 2) {
  throw new Error("daily and inventory navigation areas are required for SidebarLink tests");
}

function renderAt(initialPath: string, content = <SidebarLink item={stockItem} />) {
  const rootRoute = createRootRoute({
    component: () => content,
  });
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => null,
  });
  const stockRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/stock",
    component: () => null,
  });
  const routeTree = rootRoute.addChildren([indexRoute, stockRoute]);
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
  return { router, ...render(<RouterProvider router={router} />) };
}

function renderStockNavigationAt(initialPath: string) {
  return renderAt(
    initialPath,
    <>
      {stockNavigationAreas.map((area) => (
        <SidebarArea key={area.id} area={area} />
      ))}
    </>,
  );
}

function expectOnlyActive(activeLabel: string, inactiveLabel: string) {
  expect(screen.getByRole("link", { name: activeLabel })).toHaveAttribute("aria-current", "page");
  expect(screen.getByRole("link", { name: inactiveLabel })).not.toHaveAttribute("aria-current");
}

describe("SidebarLink (PR-1 B1: search params 付き URL の active 維持)", () => {
  it("REQ-301: /stock?q=abc でもサイドバーリンクの active が維持される", async () => {
    renderAt("/stock?q=abc");

    const link = await screen.findByRole("link", { name: "在庫照会" });
    expect(link).toHaveAttribute("data-status", "active");
  });
});

describe("SidebarLink UI-12-D1: 同一 route の排他 active", () => {
  it("test_sidebarlink_ui12d1_low_stock_search_only_low_stock_entry_active", async () => {
    renderStockNavigationAt("/stock?status=low_stock");

    await screen.findByRole("link", { name: "在庫少一覧" });
    expectOnlyActive("在庫少一覧", "在庫照会");
  });

  it.each(["/stock", "/stock?status=all"])(
    "test_sidebarlink_ui12d1_plain_stock_only_inquiry_entry_active: %s",
    async (initialPath) => {
      renderStockNavigationAt(initialPath);

      await screen.findByRole("link", { name: "在庫照会" });
      expectOnlyActive("在庫照会", "在庫少一覧");
    },
  );

  it("test_sidebarlink_ui12d1_stockout_search_only_inquiry_entry_active", async () => {
    renderStockNavigationAt("/stock?status=stockout");

    await screen.findByRole("link", { name: "在庫照会" });
    expectOnlyActive("在庫照会", "在庫少一覧");
  });

  it("test_sidebarlink_ui12d1_low_stock_with_extra_search_params_only_low_stock_entry_active", async () => {
    renderStockNavigationAt("/stock?status=low_stock&q=%E6%AF%9B%E7%B3%B8");

    await screen.findByRole("link", { name: "在庫少一覧" });
    expectOnlyActive("在庫少一覧", "在庫照会");
  });

  it("test_sidebarlink_ui12d1_navigates_with_status_low_stock_search_only", async () => {
    const user = userEvent.setup();
    const { router } = renderStockNavigationAt("/");

    await user.click(await screen.findByRole("link", { name: "在庫少一覧" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/stock");
      expect(router.state.location.search).toEqual({ status: "low_stock" });
    });
  });
});

describe("SidebarLink DSR-21: 現在地アクセント", () => {
  // 一般の見た目 class hardcode は脆いが、border-l-primary は DSR-21 が名指しする
  // 契約 token であり、その存在自体を独立した contract oracle とする。
  it("plain Link は active のみ Primary 左端バーを持つ", async () => {
    const active = renderAt("/stock");
    const activeLink = await screen.findByRole("link", { name: "在庫照会" });
    expect(activeLink).toHaveClass("border-l-primary");
    // TanStack <Link> は base className と activeProps.className を merge せず連結するため、
    // base 側に border-l-transparent が残っていると active 時に border-l-primary と共存し
    // cascade 後勝ちで Primary バーが不可視化しうる（2026-09-02 wave 8 lane 1 是正）。
    expect(activeLink).not.toHaveClass("border-l-transparent");
    active.unmount();

    renderAt("/");
    expect(await screen.findByRole("link", { name: "在庫照会" })).not.toHaveClass(
      "border-l-primary",
    );
  });

  it("ActiveMatchSidebarLink は active のみ Primary 左端バーを持つ", async () => {
    renderStockNavigationAt("/stock?status=low_stock");

    const activeLink = await screen.findByRole("link", { name: "在庫少一覧" });
    expect(activeLink).toHaveClass("border-l-primary");
    // ActiveMatchSidebarLink は単一 cn() で merge するため元々安全だが、base の
    // border-l-transparent 撤去を回帰させないよう同じ negative assertion で固定する。
    expect(activeLink).not.toHaveClass("border-l-transparent");
    expect(screen.getByRole("link", { name: "在庫照会" })).not.toHaveClass("border-l-primary");
  });
});

// L3 round 2 (iv) FAIL 是正（gated amendment Scope 7 / AC8）: plain <Link> 連結経路と
// ActiveMatchSidebarLink 単一 cn() 経路で active の全周枠 border-stone-400 の有無が
// 分岐していた（在庫照会は全周枠あり、月次売上は全周枠なし）。base から border 色 class を
// 完全に除き、色は active/inactive 側にのみ置くことで両経路の class 集合を一致させる。
describe("SidebarLink Scope 7: active 全周枠の経路 parity", () => {
  it("(a) plain Link は active で border-stone-400 を持ち border-transparent を持たない", async () => {
    renderAt("/stock");
    const activeLink = await screen.findByRole("link", { name: "在庫照会" });
    expect(activeLink).toHaveClass("border-stone-400");
    expect(activeLink).not.toHaveClass("border-transparent");
  });

  it("(b) plain Link は inactive で border-transparent を持つ", async () => {
    renderAt("/");
    const inactiveLink = await screen.findByRole("link", { name: "在庫照会" });
    expect(inactiveLink).toHaveClass("border-transparent");
  });

  it("(c) parity oracle: plain Link active と ActiveMatchSidebarLink active の border class 集合が一致する", async () => {
    // TanStack <Link> は base + activeProps.className を連結するだけ、ActiveMatchSidebarLink は
    // 単一 cn() で merge する。生成 CSS 順に依存せず両経路が同一結果になることを、
    // border- で始まる class 集合の完全一致で確認する（L3 round 2 (iv) FAIL の再発防止）。
    const plainRender = renderAt("/stock");
    const plainActiveLink = await screen.findByRole("link", { name: "在庫照会" });
    const plainBorderClasses = plainActiveLink.className
      .split(/\s+/)
      .filter((c) => c.startsWith("border"))
      .sort();
    plainRender.unmount();

    renderStockNavigationAt("/stock?status=low_stock");
    const activeMatchLink = await screen.findByRole("link", { name: "在庫少一覧" });
    const activeMatchBorderClasses = activeMatchLink.className
      .split(/\s+/)
      .filter((c) => c.startsWith("border"))
      .sort();

    expect(plainBorderClasses).toEqual(activeMatchBorderClasses);
  });
});

describe("DSR-17 D-C main navigation scroll marker", () => {
  it("T3: marks the plain Link destination href", async () => {
    const user = userEvent.setup();
    renderAt("/");

    await user.click(await screen.findByRole("link", { name: "在庫照会" }));

    expect(consumeMainNavScroll()).toBe("/stock");
  });

  it("T3: marks the ActiveMatchSidebarLink destination including search", async () => {
    const user = userEvent.setup();
    renderStockNavigationAt("/");

    await user.click(await screen.findByRole("link", { name: "在庫少一覧" }));

    expect(consumeMainNavScroll()).toBe("/stock?status=low_stock");
  });
});

// UI backlog batch A (SPEC-UIPOLA-D3 / Matrix C1): UI_TECH_STACK.md §5.4 系統① focus ring
// (52 §52.1) を focusable link (active/inactive) へ付与し、pending は非 focusable のまま。
describe("SidebarLink UI-11b batch A: focus ring (UI_TECH_STACK §5.4 系統①)", () => {
  const focusRingClasses = [
    "focus-visible:border-ring",
    "focus-visible:ring-[3px]",
    "focus-visible:ring-ring/50",
  ];

  it("test_sidebarlink_batcha_activematch_active_entry_has_focus_ring", async () => {
    renderStockNavigationAt("/stock?status=low_stock");

    const link = await screen.findByRole("link", { name: "在庫少一覧" });
    expect(link).toHaveAttribute("data-status", "active");
    focusRingClasses.forEach((className) => {
      expect(link).toHaveClass(className);
    });
  });

  it("test_sidebarlink_batcha_activematch_inactive_entry_has_focus_ring", async () => {
    renderStockNavigationAt("/stock?status=low_stock");

    const link = await screen.findByRole("link", { name: "在庫照会" });
    expect(link).not.toHaveAttribute("data-status", "active");
    focusRingClasses.forEach((className) => {
      expect(link).toHaveClass(className);
    });
  });

  it("test_sidebarlink_batcha_plain_link_active_entry_has_focus_ring", async () => {
    renderAt("/stock?q=abc");

    const link = await screen.findByRole("link", { name: "在庫照会" });
    expect(link).toHaveAttribute("data-status", "active");
    focusRingClasses.forEach((className) => {
      expect(link).toHaveClass(className);
    });
  });

  it("test_sidebarlink_batcha_plain_link_inactive_entry_has_focus_ring", async () => {
    renderAt("/");

    const link = await screen.findByRole("link", { name: "在庫照会" });
    expect(link).not.toHaveAttribute("data-status", "active");
    focusRingClasses.forEach((className) => {
      expect(link).toHaveClass(className);
    });
  });

  it("test_sidebarlink_batcha_pending_entry_stays_non_focusable_without_focus_ring", () => {
    const pendingItem: NavItem = {
      id: "ui-batcha-pending-synthetic",
      label: "未実装機能",
      title: "未実装機能",
      to: null,
      icon: Search,
      status: "pending",
    };
    render(<SidebarLink item={pendingItem} />);

    const pendingLink = screen.getByRole("link", { name: /未実装機能/ });
    expect(pendingLink).toHaveAttribute("tabindex", "-1");
    expect(pendingLink).toHaveAttribute("aria-disabled", "true");
    focusRingClasses.forEach((className) => {
      expect(pendingLink).not.toHaveClass(className);
    });
  });
});
