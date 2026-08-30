import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryHistory, createRouter, RouterProvider } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { commands, type ReceivingRecordDetail } from "@/lib/bindings";
import { routeTree } from "@/routeTree.gen";

vi.mock("@tauri-apps/api/window", () => ({
  getCurrentWindow: () => ({ setTitle: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("@tauri-apps/api/webview", () => ({
  getCurrentWebview: () => ({ setZoom: vi.fn().mockResolvedValue(undefined) }),
}));

vi.mock("@/lib/bindings", () => ({
  commands: {
    listLogs: vi.fn(),
    listLogOperationTypes: vi.fn(),
    getReceivingRecord: vi.fn(),
  },
}));

const listLogs = vi.mocked(commands.listLogs);
const listLogOperationTypes = vi.mocked(commands.listLogOperationTypes);
const getReceivingRecord = vi.mocked(commands.getReceivingRecord);

function receivingDetail(): ReceivingRecordDetail {
  return {
    id: 12,
    receiving_date: "2026-07-15",
    supplier_id: null,
    supplier_name: null,
    note: "synthetic",
    status: "active",
    created_at: "2026-07-15T10:00:00",
    total_cost: 120,
    items: [
      {
        id: 1,
        product_code: "SYN-001",
        product_name: "合成テスト商品",
        department_name: "テスト部門",
        stock_unit: "pcs",
        quantity: 1,
        cost_price: 120,
        line_cost: 120,
      },
    ],
    movements: [],
  };
}

beforeEach(() => {
  listLogs.mockReset();
  listLogOperationTypes.mockReset();
  getReceivingRecord.mockReset();
  listLogOperationTypes.mockResolvedValue({ status: "ok", data: ["backup_create"] });
  listLogs.mockResolvedValue({
    status: "ok",
    data: {
      items: [
        {
          id: 1,
          operation_type: "backup_create",
          summary: "合成調査ログ",
          detail_json: '{"record_type":"receiving_record","record_id":12}',
          created_at: "2026-07-15T10:00:00",
        },
      ],
      total_count: 61,
      page: 4,
      per_page: 20,
    },
  });
  getReceivingRecord.mockResolvedValue({ status: "ok", data: receivingDetail() });
});

describe("REQ-207 / UI-11c-D16 / DSR-18 returnTo route flow", () => {
  it("T10 TRACE-D11: pushes from filtered logs to detail and back to the exact source href", async () => {
    const sourceHref =
      "/settings/logs?start_date=2026-07-01&end_date=2026-07-31&operation_type=backup_create&page=4";
    const history = createMemoryHistory({ initialEntries: [sourceHref] });
    const router = createRouter({ routeTree, history });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: "詳細を表示" }));
    await user.click(screen.getByRole("link", { name: "関連記録を見る" }));

    await waitFor(() => {
      expect(router.state.location.href).toBe(
        "/inventory/receiving/records/12?returnTo=%2Fsettings%2Flogs%3Fstart_date%3D2026-07-01%26end_date%3D2026-07-31%26operation_type%3Dbackup_create%26page%3D4",
      );
    });
    expect(history.length).toBe(2);
    expect(await screen.findByRole("heading", { name: "入庫記録 #12" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "前の画面へ戻る" }));

    await waitFor(() => {
      expect(router.state.location.href).toBe(sourceHref);
    });
    expect(history.length).toBe(3);
    expect(await screen.findByText("合成調査ログ")).toBeInTheDocument();
  });
});
