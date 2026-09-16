// UI-00 D-H1 / D-H2: navigation の説明・強調と pending 保護。
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  createRootRoute,
  createRoute,
  createRouter,
  createMemoryHistory,
  RouterProvider,
} from "@tanstack/react-router";
import { describe, expect, it } from "vitest";
import { TooltipProvider } from "@/components/ui/tooltip";
import { navigation } from "@/config/navigation";
import { ActionButton } from "./ActionButton";
import type { ActionButtonProps } from "./ActionButton";

function renderAction(props: ActionButtonProps) {
  const root = createRootRoute({
    component: () => (
      <TooltipProvider>
        <ActionButton {...props} />
      </TooltipProvider>
    ),
  });
  const index = createRoute({ getParentRoute: () => root, path: "/", component: () => null });
  const router = createRouter({
    routeTree: root.addChildren([index]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
  return render(<RouterProvider router={router} />);
}

describe("UI-00 ActionButton", () => {
  it("D-H1: 題名と navigation の説明文を描画する", async () => {
    renderAction({ navItemId: "ui-07" });
    expect(await screen.findByText("売上データ取込み")).toBeInTheDocument();
    expect(screen.getByText("レジの日報CSVを読み込み、当日の売上を記録します")).toBeInTheDocument();
  });

  it("D-H2: primary は枠・背景・icon を強調する", async () => {
    renderAction({ navItemId: "ui-07", variant: "primary" });
    const link = await screen.findByRole("link", { name: /売上データ取込み/ });
    expect(link).toHaveClass("border-primary", "bg-warning-soft");
    expect(link.querySelector("svg")).toHaveClass("h-6", "w-6", "text-primary");
  });

  it("D-H6: card の上下余白と icon の位置揃えを持つ（GA4）", async () => {
    renderAction({ navItemId: "ui-07" });
    const link = await screen.findByRole("link", { name: /売上データ取込み/ });
    expect(link).toHaveClass("py-3.5");
    expect(link.querySelector("svg")).toHaveClass("mt-0.5");
  });

  it("D-2: pending は Tooltip trigger と aria-disabled を維持してクリックを抑止する", async () => {
    const item = navigation.flatMap((area) => area.items).find((item) => item.id === "ui-07");
    if (!item) throw new Error("ui-07 navigation item is required");
    const original = item.status;
    item.status = "pending";
    try {
      renderAction({ navItemId: "ui-07" });
      const button = await screen.findByRole("button", { name: /売上データ取込み/ });
      expect(button).toHaveAttribute("aria-disabled", "true");
      expect(button).toHaveAttribute("data-slot", "tooltip-trigger");
      expect(button).toHaveClass("cursor-not-allowed", "opacity-60");
      expect(fireEvent.click(button)).toBe(false);
      await userEvent.setup().hover(button);
      expect(await screen.findByRole("tooltip")).toHaveTextContent("後続フェーズで着手予定");
      expect(
        screen.getByText("レジの日報CSVを読み込み、当日の売上を記録します"),
      ).toBeInTheDocument();
    } finally {
      item.status = original;
    }
  });

  it("D-H1: description のない item は題名だけで描画する", async () => {
    renderAction({ navItemId: "ui-00" });
    const link = await screen.findByRole("link", { name: "ホーム" });
    expect(link).toHaveTextContent(/^ホーム$/);
    expect(link).not.toHaveClass("border-primary", "bg-warning-soft");
  });
});
