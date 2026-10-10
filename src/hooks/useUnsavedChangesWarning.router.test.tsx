import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { UnsavedChangesDialog } from "@/components/patterns/UnsavedChangesDialog";
import { useUnsavedChangesWarning } from "./useUnsavedChangesWarning";

function DirtyPage() {
  const warning = useUnsavedChangesWarning(true);
  return (
    <>
      <Link to={"/next" as never}>移動する</Link>
      <UnsavedChangesDialog warning={warning} />
    </>
  );
}

// useUnsavedChangesWarning.test.tsx は useBlocker を mock する hook の分岐の unit test。
// ここでは実 router と memory history で library の離脱防止そのものを確かめる。
describe("useUnsavedChangesWarning with a real router (UI-12/UI-USW-D1/D2)", () => {
  it("UI-USW-D1/D2 T18: 実 router と memory history で dirty の遷移を保留し、取消で留まり、続行で移動する", async () => {
    const user = userEvent.setup();
    const rootRoute = createRootRoute();
    const router = createRouter({
      routeTree: rootRoute.addChildren([
        createRoute({ getParentRoute: () => rootRoute, path: "/", component: DirtyPage }),
        createRoute({
          getParentRoute: () => rootRoute,
          path: "/next",
          component: () => <h1>移動先</h1>,
        }),
      ]),
      history: createMemoryHistory({ initialEntries: ["/"] }),
    });
    render(<RouterProvider router={router} />);

    await user.click(await screen.findByRole("link", { name: "移動する" }));
    expect(await screen.findByText("編集内容が保存されていません")).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/");

    await user.click(screen.getByRole("button", { name: "編集を続ける" }));
    await waitFor(() => {
      expect(screen.queryByText("編集内容が保存されていません")).not.toBeInTheDocument();
    });
    expect(router.state.location.pathname).toBe("/");

    await user.click(screen.getByRole("link", { name: "移動する" }));
    await user.click(await screen.findByRole("button", { name: "破棄して移動" }));
    expect(await screen.findByRole("heading", { name: "移動先" })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe("/next");
  });
});
