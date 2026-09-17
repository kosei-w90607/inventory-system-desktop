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
    listInventoryRecords: vi.fn(),
    listDepartments: vi.fn(),
  },
}));

const listLogs = vi.mocked(commands.listLogs);
const listLogOperationTypes = vi.mocked(commands.listLogOperationTypes);
const getReceivingRecord = vi.mocked(commands.getReceivingRecord);
const listInventoryRecords = vi.mocked(commands.listInventoryRecords);
const listDepartments = vi.mocked(commands.listDepartments);

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
  listInventoryRecords.mockReset();
  listDepartments.mockReset();
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
  listDepartments.mockResolvedValue({ status: "ok", data: [] });
  listInventoryRecords.mockResolvedValue({
    status: "ok",
    data: {
      items: [
        {
          record_type: "receiving_record",
          record_id: 12,
          business_date: "2026-07-15",
          representative_item: "合成テスト商品",
          item_count: 1,
          status: "active",
          created_at: "2026-07-15T10:00:00",
          detail_route: "/inventory/receiving/records/12",
        },
      ],
      total_count: 1,
      page: 1,
      per_page: 50,
    },
  });
});

describe("REQ-207 / UI-11c-D16 / DSR-18 returnTo route flow", () => {
  it("T9 REQ-207 / DSR-15: 解析不能になる returnTo でも業務記録詳細が描画され、前の画面へ戻る が既定 hub を指す", async () => {
    const history = createMemoryHistory({
      initialEntries: ["/inventory/receiving/records/12?returnTo=%2Fa%2F..%2F%2F%5B"],
    });
    const router = createRouter({ routeTree, history });
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "入庫記録 #12" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "前の画面へ戻る" })).toHaveAttribute(
      "href",
      "/inventory/records",
    );
  });

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

  it("T8 REQ-207 / REQ-303: 入出庫履歴（数字だけの検索語）→ 詳細 → 前の画面へ戻る で検索語が残り、戻った先の location.href が出発時の href と文字列一致する", async () => {
    // S5: SearchBar → navigate({search}) が作る href を模す。数字だけの q は JSON-quote
    // されるため url は q=%222099000000019%22 になる（起票時実測 Probe 2）。
    const sourceHref = "/inventory/records?q=%222099000000019%22";
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

    await user.click(await screen.findByRole("link", { name: "詳細を見る" }));

    await waitFor(() => {
      expect(router.state.location.pathname).toBe("/inventory/receiving/records/12");
    });
    expect(await screen.findByRole("heading", { name: "入庫記録 #12" })).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "前の画面へ戻る" }));

    await waitFor(() => {
      expect(router.state.location.href).toBe(sourceHref);
    });
    expect(router.state.location.search).toEqual({ q: "2099000000019" });
    expect(await screen.findByText("合成テスト商品")).toBeInTheDocument();
  });
});
