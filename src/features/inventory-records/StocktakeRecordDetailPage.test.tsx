import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MovementRecord, StocktakeRecordDetail } from "@/lib/bindings";
import { commands } from "@/lib/bindings";
import { routeTree } from "@/routeTree.gen";
import { renderWithRouter } from "@/test/render-with-router";
import { StocktakeRecordDetailPage } from "./StocktakeRecordDetailPage";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ setTitle: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("@/features/stock-movements/StockMovementsPage", async () => {
  const { MovementTable } = await vi.importActual<
    typeof import("@/features/stock-movements/components/MovementTable")
  >("@/features/stock-movements/components/MovementTable");
  return { StockMovementsPage: () => <MovementTable movements={[makeMovement()]} /> };
});

vi.mock("@/lib/bindings", () => ({
  commands: { getStocktakeRecord: vi.fn() },
}));

const mockGetStocktakeRecord = vi.mocked(commands.getStocktakeRecord);

function makeMovement(): MovementRecord {
  return {
    id: 701,
    product_code: "SRD-001",
    movement_type: "stocktake",
    quantity: -2,
    stock_after: 8,
    reference_type: "stocktake",
    reference_id: 51,
    source: { label: "棚卸し #51", route: "/stocktake/records/51" },
    note: "synthetic correction",
    created_at: "2026-08-27T18:00:00",
  };
}

function makeDetail(overrides: Partial<StocktakeRecordDetail> = {}): StocktakeRecordDetail {
  return {
    id: 51,
    started_at: "2026-08-27T09:00:00",
    completed_at: "2026-08-27T18:00:00",
    status: "completed",
    total_cost: 2400,
    item_count: 3,
    corrected_count: 1,
    items: [
      {
        product_code: "SRD-001",
        product_name: "合成棚卸し商品",
        department_name: "テスト部門",
        stock_unit: "pcs",
        system_stock: 10,
        actual_count: 8,
        counted_at: "2026-08-27T17:30:00",
        valuation_cost_price: 300,
        adjustment_quantity: -2,
        stock_after: 8,
      },
    ],
    movements: [makeMovement()],
    ...overrides,
  };
}

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
  });
}

function renderWithClient(ui: ReactNode) {
  return renderWithRouter(
    <QueryClientProvider client={makeQueryClient()}>{ui}</QueryClientProvider>,
  );
}

beforeEach(() => mockGetStocktakeRecord.mockReset());

describe("StocktakeRecordDetailPage (REQ-206 / REQ-207)", () => {
  it("REQ-206: completed のヘッダ・補正明細・movement・商品リンクを表示する", async () => {
    mockGetStocktakeRecord.mockResolvedValue({ status: "ok", data: makeDetail() });

    renderWithClient(<StocktakeRecordDetailPage stocktakeId={51} />);

    expect(await screen.findByRole("heading", { name: "棚卸し #51" })).toBeInTheDocument();
    expect(screen.getByText("完了")).toBeInTheDocument();
    expect(screen.getByText("2026-08-27 09:00:00")).toBeInTheDocument();
    expect(screen.getAllByText("2026-08-27 18:00:00")).toHaveLength(2);
    expect(screen.getByText("3 件")).toBeInTheDocument();
    expect(screen.getByText("1 件")).toBeInTheDocument();
    expect(screen.getByText("¥2,400")).toBeInTheDocument();
    const row = screen.getByRole("row", { name: /SRD-001 合成棚卸し商品/ });
    expect(within(row).getByText("テスト部門")).toBeInTheDocument();
    expect(within(row).getByText("10 pcs")).toBeInTheDocument();
    expect(within(row).getByText("8 pcs")).toBeInTheDocument();
    expect(within(row).getByText("-2 pcs")).toBeInTheDocument();
    expect(within(row).getByText("¥300")).toBeInTheDocument();
    expect(within(row).getByText("¥600")).toBeInTheDocument();
    expect(within(row).getByRole("link", { name: "SRD-001 の在庫変動履歴" })).toHaveAttribute(
      "href",
      "/stock/SRD-001/movements",
    );
    expect(screen.queryByRole("button", { name: /取消|訂正/ })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "棚卸し #51" })).toBeInTheDocument();
  });

  it("REQ-207: movement の元記録をクリックすると棚卸し詳細 route を描画する", async () => {
    mockGetStocktakeRecord.mockResolvedValue({ status: "ok", data: makeDetail() });
    const user = userEvent.setup();
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ["/stock/SRD-001/movements"] }),
    });
    render(
      <QueryClientProvider client={makeQueryClient()}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    await user.click(await screen.findByRole("link", { name: "棚卸し #51" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/stocktake/records/51");
    });
    await waitFor(() => {
      expect(mockGetStocktakeRecord).toHaveBeenCalledWith(51);
    });
    expect(await screen.findByRole("heading", { name: "棚卸し #51" })).toBeInTheDocument();
  });

  it("REQ-206: NotFound を利用者向け日本語で表示する", async () => {
    mockGetStocktakeRecord.mockResolvedValue({
      status: "error",
      error: {
        kind: "not_found",
        message: "棚卸し記録が見つかりません: 404",
        field: null,
        error_id: null,
      },
    });

    renderWithClient(<StocktakeRecordDetailPage stocktakeId={404} />);

    expect(await screen.findByText("棚卸し記録が見つかりません: 404")).toBeInTheDocument();
  });

  it("REQ-206: in_progress を空の補正記録と算定前原価で正常表示する", async () => {
    mockGetStocktakeRecord.mockResolvedValue({
      status: "ok",
      data: makeDetail({
        completed_at: null,
        status: "in_progress",
        total_cost: null,
        corrected_count: 0,
        items: [],
        movements: [],
      }),
    });

    renderWithClient(<StocktakeRecordDetailPage stocktakeId={51} />);

    expect(await screen.findByText("進行中")).toBeInTheDocument();
    expect(screen.getByText("補正明細はありません")).toBeInTheDocument();
    expect(screen.getByText("関連する在庫変動がありません")).toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThanOrEqual(2);
  });

  it.each([
    [
      "/stock/SRD-001/movements?type=stocktake&page=2",
      "/stock/SRD-001/movements?type=stocktake&page=2",
    ],
    ["https://example.invalid/escape", "/inventory/records"],
    ["//example.invalid/escape", "/inventory/records"],
  ])("REQ-207: returnTo %s を安全に %s へ正規化する", async (returnTo, expected) => {
    mockGetStocktakeRecord.mockResolvedValue({ status: "ok", data: makeDetail() });

    renderWithClient(<StocktakeRecordDetailPage stocktakeId={51} returnTo={returnTo} />);

    expect(await screen.findByRole("link", { name: "前の画面へ戻る" })).toHaveAttribute(
      "href",
      expected,
    );
  });
});
