import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RootLayout } from "./RootLayout";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ setTitle: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtools: () => null,
}));

vi.mock("./Sidebar", () => ({
  Sidebar: () => <nav aria-label="test-sidebar" />,
}));

vi.mock("@/components/ui/sonner", () => ({
  Toaster: () => null,
}));

vi.mock("@/components/ui/tooltip", () => ({
  TooltipProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/features/shortcuts", () => ({
  ShortcutsDialog: () => null,
  useShortcutsDialog: () => ({ open: false, setOpen: vi.fn() }),
}));

describe("DSR-17 RootLayout scroll container", () => {
  it("T6: gives the persistent main element its restoration id", async () => {
    const outerRoute = createRootRoute({ component: () => <Outlet /> });
    const layoutRoute = createRoute({
      getParentRoute: () => outerRoute,
      id: "layout",
      component: RootLayout,
    });
    const indexRoute = createRoute({
      getParentRoute: () => layoutRoute,
      path: "/",
      component: () => <p>test outlet</p>,
    });
    const router = createRouter({
      routeTree: outerRoute.addChildren([layoutRoute.addChildren([indexRoute])]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    const { container } = render(<RouterProvider router={router} />);

    await screen.findByText("test outlet");
    expect(container.querySelector("main")).toHaveAttribute("data-scroll-restoration-id", "main");
  });
});
