import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { routeTree } from "@/routeTree.gen";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ setTitle: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("@/features/stocktake/StocktakePage", () => ({
  StocktakePage: ({
    search,
    onSearchChange,
  }: {
    search: object;
    onSearchChange: (updater: (value: object) => object) => void;
  }) => (
    <div>
      <h1>棚卸し作業画面</h1>
      <output>{JSON.stringify(search)}</output>
      <button
        type="button"
        onClick={() => {
          onSearchChange((previous) => ({ ...previous, page: 3 }));
        }}
      >
        ページ変更
      </button>
    </div>
  ),
}));

describe("stocktake route layout regression (REQ-206 / REQ-207)", () => {
  it("REQ-206: /stocktake で index を描画し検索条件と navigate を維持する", async () => {
    const user = userEvent.setup();
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({
        initialEntries: ["/stocktake?dept=3&counted_only=true&page=2"],
      }),
    });
    render(
      <QueryClientProvider client={new QueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "棚卸し作業画面" })).toBeInTheDocument();
    expect(screen.getByText('{"dept":3,"counted_only":true,"page":2}')).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "ページ変更" }));
    expect(router.state.location.search).toMatchObject({ dept: 3, counted_only: true, page: 3 });
  });
});
