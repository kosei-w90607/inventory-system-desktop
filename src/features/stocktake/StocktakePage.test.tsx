// src/features/stocktake/StocktakePage.test.tsx
//
// REQ-205 / UI-10 Test Design Matrix T1〜T16（UI-10-D10）+ T17（UI-10-D11）+ T18〜T20（契約監査）+ T21（UI-10-D10 差異符号、受入台本 L3 起源）

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { makeMockProductWithRelations } from "@/features/products/lib/test-fixtures";
import { commands } from "@/lib/bindings";
import type { CmdErrorKind, Department, Stocktake, StocktakeItemDetail } from "@/lib/bindings";
import { scrollPageToTop } from "@/lib/page-scroll";
import { d052InvalidationOracle, expectExactInvalidations } from "@/test/invalidation-oracle";

import { StocktakePage, StocktakeProgressHeader } from "./StocktakePage";
import type { StocktakeSearch } from "./types";

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@/lib/bindings", () => ({
  commands: {
    listDepartments: vi.fn(),
    getActiveStocktake: vi.fn(),
    getLastCompletedStocktake: vi.fn(),
    startStocktake: vi.fn(),
    getStocktakeItems: vi.fn(),
    findStocktakeItem: vi.fn(),
    updateCount: vi.fn(),
    completeStocktake: vi.fn(),
    searchProducts: vi.fn(),
  },
}));
vi.mock("@/lib/page-scroll", () => ({ scrollPageToTop: vi.fn() }));

const mockListDepartments = vi.mocked(commands.listDepartments);
const mockSearchProducts = vi.mocked(commands.searchProducts);
const mockGetActive = vi.mocked(commands.getActiveStocktake);
const mockGetLast = vi.mocked(commands.getLastCompletedStocktake);
const mockStart = vi.mocked(commands.startStocktake);
const mockGetItems = vi.mocked(commands.getStocktakeItems);
const mockFindItem = vi.mocked(commands.findStocktakeItem);
const mockUpdateCount = vi.mocked(commands.updateCount);
const mockComplete = vi.mocked(commands.completeStocktake);
const mockScrollPageToTop = vi.mocked(scrollPageToTop);

function ok<T>(data: T) {
  return { status: "ok" as const, data };
}

function cmdError(kind: CmdErrorKind, message: string) {
  return {
    status: "error" as const,
    error: { kind, message, field: null, error_id: null },
  };
}

function stocktakeItem(overrides: Partial<StocktakeItemDetail> = {}): StocktakeItemDetail {
  return { ...baseStocktakeItem(), ...overrides };
}

function activeStocktake(overrides: Partial<Stocktake> = {}): Stocktake {
  return {
    id: 77,
    started_at: "2026-10-01T09:00:00",
    completed_at: null,
    status: "in_progress",
    total_cost: null,
    ...overrides,
  };
}

function baseStocktakeItem(): StocktakeItemDetail {
  return {
    id: 501,
    stocktake_id: 77,
    product_code: "P-001",
    name: "赤い糸",
    department_name: "毛糸",
    system_stock: 10,
    actual_count: null,
    counted_at: null,
    current_stock: 10,
  };
}

function listResponse(overrides: Partial<Awaited<ReturnType<typeof baseListResponse>>> = {}) {
  return ok({ ...baseListResponse(), ...overrides });
}

function baseListResponse() {
  return {
    items: [baseStocktakeItem(), stocktakeItem({ id: 502, product_code: "P-002", name: "青い糸" })],
    progress: { total_items: 2, counted_items: 1, uncounted_items: 1 },
    total_count: 2,
    page: 1,
    per_page: 200,
  };
}

function renderWithClient(
  ui: ReactNode,
  {
    onSearchChange = vi.fn(),
  }: { onSearchChange?: (updater: (prev: StocktakeSearch) => StocktakeSearch) => void } = {},
) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  return {
    queryClient,
    invalidateSpy,
    onSearchChange,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

async function renderPage(search: StocktakeSearch = {}) {
  const onSearchChange = vi.fn();
  const utils = renderWithClient(
    <StocktakePage search={search} onSearchChange={onSearchChange} />,
    {
      onSearchChange,
    },
  );
  await screen.findByRole("heading", { name: "棚卸し" });
  return utils;
}

beforeEach(() => {
  mockListDepartments.mockReset();
  mockGetActive.mockReset();
  mockGetLast.mockReset();
  mockStart.mockReset();
  mockGetItems.mockReset();
  mockFindItem.mockReset();
  mockUpdateCount.mockReset();
  mockComplete.mockReset();
  mockSearchProducts.mockReset();
  mockScrollPageToTop.mockReset();
  mockSearchProducts.mockResolvedValue(ok({ items: [], total_count: 0, page: 1, per_page: 10 }));

  const departments: Department[] = [
    {
      id: 1,
      name: "毛糸",
      z005_name: null,
      code_prefix: null,
      next_seq: 1,
      created_at: "2026-01-01T00:00:00",
    },
  ];
  mockListDepartments.mockResolvedValue(ok(departments));
  mockGetActive.mockResolvedValue(ok(null));
  mockGetLast.mockResolvedValue(
    ok({
      stocktake_id: 10,
      completed_at: "2026-09-30T18:00:00",
      total_cost: 2000,
    }),
  );
  mockStart.mockResolvedValue(ok({ stocktake_id: 77, item_count: 2, auto_filled_count: 0 }));
  mockGetItems.mockResolvedValue(listResponse());
  mockFindItem.mockResolvedValue(ok(baseStocktakeItem()));
  mockUpdateCount.mockResolvedValue(ok({ success: true, current_difference: 2 }));
  mockComplete.mockResolvedValue(
    ok({
      total_cost: 2500,
      adjusted_items: [
        {
          product_code: "P-001",
          product_name: "赤い糸",
          system_stock: 10,
          actual_count: 8,
          difference: 2,
          stock_after: 8,
        },
      ],
      total_items: 2,
      integrity_result: { mismatches: [], mismatch_count: 0, checked_count: 2 },
    }),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("StocktakePage (UI-10)", () => {
  it("T1 not-started shows start CTA and last summary; active CMD state shows counting display", async () => {
    const first = await renderPage();

    expect(await screen.findByRole("button", { name: "棚卸しを開始する" })).toBeInTheDocument();
    expect(
      await screen.findByText("前回の棚卸し（2026-09-30 18:00:00）: 仕入原価総額 ¥2,000"),
    ).toBeInTheDocument();
    first.unmount();

    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();

    expect(await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）")).toBeInTheDocument();
    expect(await screen.findByText("入力済み 1 / 全 2")).toBeInTheDocument();
  });

  it("T2 start CTA calls startStocktake once and enters counting screen", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValueOnce(ok(null)).mockResolvedValue(ok(activeStocktake()));
    const { invalidateSpy } = await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを開始する" }));

    await waitFor(() => {
      expect(mockStart).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）")).toBeInTheDocument();
    expect(mockGetItems).toHaveBeenCalledWith(77, null, null, 1, 50);
    expectExactInvalidations(invalidateSpy.mock.calls, d052InvalidationOracle.stocktakeStart());
  });

  it("T3 department filter and uncounted toggle change getStocktakeItems params", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.click(screen.getByRole("combobox", { name: "部門" }));
    await user.click(screen.getByRole("option", { name: "毛糸" }));
    await user.click(screen.getByLabelText("未入力のみ表示"));

    await waitFor(() => {
      expect(mockGetItems).toHaveBeenLastCalledWith(77, 1, false, 1, 50);
    });
  });

  it("SC8 (AC13): changing the department filter resets page to 1 even after totalCount shrinks below the current page (existing reset handler, page-reset oracle)", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    // 開始時は総件数が多く page 3 でも範囲内、フィルタ変更後は総件数が減る想定でも
    // 既存 handler が page を 1 へリセットするため page > totalPages のまま描画されない。
    mockGetItems
      .mockResolvedValueOnce(listResponse({ total_count: 250, page: 3, per_page: 50 }))
      .mockResolvedValue(listResponse({ total_count: 1, page: 1, per_page: 50 }));
    await renderPage({ page: 3 });
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.click(screen.getByRole("combobox", { name: "部門" }));
    await user.click(screen.getByRole("option", { name: "毛糸" }));

    await waitFor(() => {
      expect(mockGetItems).toHaveBeenLastCalledWith(77, 1, null, 1, 50);
    });
  });

  it("T4 code/JAN resolve then quantity saves with found item id", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "4900000000001");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));
    await user.clear(await screen.findByLabelText("実際の数"));
    await user.type(screen.getByLabelText("実際の数"), "8");
    await user.click(screen.getByRole("button", { name: "数を保存" }));

    expect(mockFindItem).toHaveBeenCalledWith(77, "4900000000001");
    await waitFor(() => {
      expect(mockUpdateCount).toHaveBeenCalledTimes(1);
    });
    expect(mockUpdateCount).toHaveBeenCalledWith(501, 8);
  });

  it("DSR-17 T15: StocktakeCountEntry mount focus prevents native scroll", async () => {
    const focus = vi.spyOn(HTMLInputElement.prototype, "focus");
    mockGetActive.mockResolvedValue(ok(activeStocktake()));

    await renderPage();
    const codeInput = await screen.findByLabelText("商品を検索・スキャン");
    const callIndex = focus.mock.contexts.findIndex((context) => context === codeInput);

    expect(callIndex).toBeGreaterThanOrEqual(0);
    expect(focus.mock.calls[callIndex]).toEqual([{ preventScroll: true }]);
  });

  it("T17 focus moves code→quantity→code across scan cycle for continuous HID scanning (UI-10-D11)", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await waitFor(() => {
      expect(screen.getByLabelText("商品を検索・スキャン")).toHaveFocus();
    });

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "4900000000001{Enter}");
    await screen.findByLabelText("実際の数");

    await waitFor(() => {
      expect(screen.getByLabelText("実際の数")).toHaveFocus();
    });

    await user.clear(screen.getByLabelText("実際の数"));
    await user.type(screen.getByLabelText("実際の数"), "8{Enter}");

    await waitFor(() => {
      expect(mockUpdateCount).toHaveBeenCalledWith(501, 8);
    });
    await waitFor(() => {
      expect(screen.getByLabelText("商品を検索・スキャン")).toHaveFocus();
    });
  });

  it("T5 target none shows recovery text and does not update count", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem.mockResolvedValueOnce(ok(null));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "NOPE");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));

    expect(
      await screen.findByText(
        "この商品は棚卸しの対象にありません。商品コードまたはJANを確認してください。新しく登録した商品は自動で追加されます",
      ),
    ).toBeInTheDocument();
    expect(mockUpdateCount).not.toHaveBeenCalled();
  });

  it("T6 counted item can be overwritten without confirmation", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem.mockResolvedValueOnce(ok(stocktakeItem({ actual_count: 5 })));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));

    expect(await screen.findByText("入力済みの数を上書きできます")).toBeInTheDocument();
    await user.clear(screen.getByLabelText("実際の数"));
    await user.type(screen.getByLabelText("実際の数"), "6");
    await user.click(screen.getByRole("button", { name: "数を保存" }));

    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    await waitFor(() => {
      expect(mockUpdateCount).toHaveBeenCalledWith(501, 6);
    });
  });

  it("T7 progress display matches progress payload", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValueOnce(
      listResponse({ progress: { total_items: 10, counted_items: 7, uncounted_items: 3 } }),
    );
    await renderPage();

    expect(await screen.findByText("入力済み 7 / 全 10")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: "棚卸し進捗" })).toHaveAttribute(
      "aria-valuenow",
      "70",
    );
  });

  it("T16 list shows difference and last counted columns, blank for uncounted items (UI-10-D10)", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValueOnce(
      listResponse({
        items: [
          stocktakeItem({
            id: 601,
            product_code: "P-901",
            name: "差異あり商品",
            system_stock: 10,
            current_stock: 12,
            actual_count: 9,
            counted_at: "2026-10-01T09:05:00",
          }),
          stocktakeItem({
            id: 602,
            product_code: "P-902",
            name: "未入力商品",
            current_stock: 5,
            actual_count: null,
            counted_at: null,
          }),
        ],
      }),
    );
    await renderPage();

    const table = await screen.findByRole("table");
    const row = within(table).getByText("差異あり商品").closest("tr");
    if (row === null) throw new Error("row not found");
    // 表示される在庫値は差異の計算根拠と同じ current_stock（12）であり、
    // system_stock（10）ではないことを検証する（Codex レビュー P2 是正）。
    expect(within(row).getByText("12")).toBeInTheDocument();
    expect(within(row).queryByText("10")).not.toBeInTheDocument();
    expect(within(row).getByText("+3")).toBeInTheDocument();
    expect(within(row).getByText("2026-10-01 09:05:00")).toBeInTheDocument();

    const uncountedRow = within(table).getByText("未入力商品").closest("tr");
    if (uncountedRow === null) throw new Error("uncounted row not found");
    const dashes = within(uncountedRow).getAllByText("—");
    expect(dashes).toHaveLength(2);
  });

  it("T8 negative actual_count shows FieldError and is not sent", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));
    await user.clear(await screen.findByLabelText("実際の数"));
    await user.type(screen.getByLabelText("実際の数"), "-1");
    await user.click(screen.getByRole("button", { name: "数を保存" }));

    expect(await screen.findByText("0以上の数値を入力してください")).toBeInTheDocument();
    expect(mockUpdateCount).not.toHaveBeenCalled();
  });

  it("T-C5-1 empty quantity + Enter shows FieldError and does not call updateCount", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001{Enter}");
    const quantityInput = await screen.findByLabelText("実際の数");
    await user.clear(quantityInput);
    await user.type(quantityInput, "{Enter}");

    expect(await screen.findByText("数量を入力してください")).toBeInTheDocument();
    expect(mockUpdateCount).not.toHaveBeenCalled();
  });

  it("T-C5-2 empty quantity + save click shows FieldError and does not call updateCount", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001{Enter}");
    await user.clear(await screen.findByLabelText("実際の数"));
    await user.click(screen.getByRole("button", { name: "数を保存" }));

    expect(await screen.findByText("数量を入力してください")).toBeInTheDocument();
    expect(mockUpdateCount).not.toHaveBeenCalled();
  });

  it("T-C5-3 whitespace-only quantity + Enter shows FieldError and does not call updateCount", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001{Enter}");
    const quantityInput = await screen.findByLabelText("実際の数");
    await user.clear(quantityInput);
    await user.type(quantityInput, "  {Enter}");

    expect(await screen.findByText("数量を入力してください")).toBeInTheDocument();
    expect(mockUpdateCount).not.toHaveBeenCalled();
  });

  it('T-C5-4 explicit "0" + Enter calls updateCount with 0 and shows no FieldError', async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001{Enter}");
    const quantityInput = await screen.findByLabelText("実際の数");
    await user.clear(quantityInput);
    await user.type(quantityInput, "0{Enter}");

    await waitFor(() => {
      expect(mockUpdateCount).toHaveBeenCalledWith(501, 0);
    });
    expect(screen.queryByText("数量を入力してください")).not.toBeInTheDocument();
  });

  it("T9 complete with no uncounted always confirms and sends force_fill false", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValueOnce(
      listResponse({ progress: { total_items: 2, counted_items: 2, uncounted_items: 0 } }),
    );
    const { invalidateSpy } = await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    expect(await screen.findByRole("heading", { name: "棚卸しの確定" })).toBeInTheDocument();
    const noUncountedAlert = screen.getByRole("alert");
    expect(within(noUncountedAlert).getByText("確定すると取り消せません")).toBeInTheDocument();
    expect(
      within(noUncountedAlert).getByText("入力した内容で棚卸しを確定します。"),
    ).toBeInTheDocument();
    // sr-only description にも不可逆性の警告 title が含まれることを検証（Codex レビュー P2 是正）
    const noUncountedDialog = screen.getByRole("alertdialog");
    const noUncountedDescribedBy = noUncountedDialog.getAttribute("aria-describedby");
    expect(document.getElementById(noUncountedDescribedBy ?? "")).toHaveTextContent(
      "確定すると取り消せません。入力した内容で棚卸しを確定します。",
    );
    expect(screen.getByRole("button", { name: "確定する" })).toHaveAttribute(
      "data-variant",
      "destructive",
    );
    await user.click(screen.getByRole("button", { name: "確定する" }));

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(77, false);
      expectExactInvalidations(
        invalidateSpy.mock.calls,
        d052InvalidationOracle.stocktakeComplete(),
      );
    });
  });

  it("T10 complete with uncounted confirms force_fill true", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    expect(
      await screen.findByRole("heading", { name: "未入力の商品があります" }),
    ).toBeInTheDocument();
    const uncountedAlert = screen.getByRole("alert");
    expect(within(uncountedAlert).getByText("確定すると取り消せません")).toBeInTheDocument();
    expect(
      within(uncountedAlert).getByText(
        "1件が未入力のまま残っています。確定すると、この1件は現在の在庫数で棚卸しされます。",
      ),
    ).toBeInTheDocument();
    // sr-only description にも不可逆性の警告 title が含まれることを検証（Codex レビュー P2 是正）
    const uncountedDialog = screen.getByRole("alertdialog");
    const uncountedDescribedBy = uncountedDialog.getAttribute("aria-describedby");
    expect(document.getElementById(uncountedDescribedBy ?? "")).toHaveTextContent(
      "確定すると取り消せません。1件が未入力のまま残っています。確定すると、この1件は現在の在庫数で棚卸しされます。",
    );
    await user.click(screen.getByRole("button", { name: "確定する" }));

    await waitFor(() => {
      expect(mockComplete).toHaveBeenCalledWith(77, true);
    });
  });

  it("T11 result shows total_cost, adjusted_items, and last comparison", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    await user.click(screen.getByRole("button", { name: "確定する" }));

    expect(await screen.findByRole("heading", { name: "棚卸し結果" })).toBeInTheDocument();
    expect(screen.getByText("仕入原価総額")).toBeInTheDocument();
    expect(screen.getByText("¥2,500")).toBeInTheDocument();
    expect(screen.getByText("赤い糸")).toBeInTheDocument();
    expect(screen.getByText("前回の棚卸し（2026-09-30 18:00:00）")).toBeInTheDocument();
    expect(screen.getByText("仕入原価総額 ¥2,000")).toBeInTheDocument();
  });

  it("T21 result shows signed difference via formatListDifference (+N / -N, UI-10-D10)", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockComplete.mockResolvedValueOnce(
      ok({
        total_cost: 2500,
        adjusted_items: [
          {
            product_code: "P-001",
            product_name: "赤い糸",
            system_stock: 10,
            actual_count: 8,
            difference: 2,
            stock_after: 8,
          },
          {
            product_code: "P-002",
            product_name: "青い糸",
            system_stock: 5,
            actual_count: 8,
            difference: -3,
            stock_after: 8,
          },
        ],
        total_items: 2,
        integrity_result: { mismatches: [], mismatch_count: 0, checked_count: 2 },
      }),
    );
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    await user.click(screen.getByRole("button", { name: "確定する" }));

    expect(await screen.findByRole("heading", { name: "棚卸し結果" })).toBeInTheDocument();
    // 正差異は「+2」、負差異は「-3」の符号付きプレーンテキスト（進行中一覧と表現統一）
    expect(screen.getByText("+2")).toBeInTheDocument();
    expect(screen.getByText("-3")).toBeInTheDocument();
    expect(screen.queryByText(/^2$/)).not.toBeInTheDocument();
  });

  it("T19 result page keeps pre-complete last-stocktake snapshot after lastCompleted invalidation (Codex contract audit P2)", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    // invalidate 前は前回棚卸し、invalidate 後は「今確定した棚卸し自身」が返ってくる状況を再現する
    mockGetLast.mockResolvedValueOnce(
      ok({ stocktake_id: 10, completed_at: "2026-09-30T18:00:00", total_cost: 2000 }),
    );
    mockGetLast.mockResolvedValue(
      ok({ stocktake_id: 77, completed_at: "2026-10-08T10:00:00", total_cost: 2500 }),
    );
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    await user.click(screen.getByRole("button", { name: "確定する" }));

    expect(await screen.findByRole("heading", { name: "棚卸し結果" })).toBeInTheDocument();
    // 確定直前にスナップショットした前回棚卸し（2026-09-30）を表示し続け、
    // invalidate 後の再取得値（今確定した棚卸し自身、2026-10-08）には差し替わらない
    expect(screen.getByText("前回の棚卸し（2026-09-30 18:00:00）")).toBeInTheDocument();
    expect(screen.getByText("仕入原価総額 ¥2,000")).toBeInTheDocument();
    await waitFor(() => {
      expect(mockGetLast).toHaveBeenCalledTimes(2);
    });
    expect(screen.queryByText("前回の棚卸し（2026-10-08 10:00:00）")).not.toBeInTheDocument();
  });

  it("T12 result shows integrity fallback when integrity_result is null", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockComplete.mockResolvedValueOnce(
      ok({ total_cost: 2500, adjusted_items: [], total_items: 2, integrity_result: null }),
    );
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    await user.click(screen.getByRole("button", { name: "確定する" }));

    expect(await screen.findByText("整合性チェックは実行できませんでした")).toBeInTheDocument();
  });

  it("T13 stocktake error kinds recover with operator-facing messages", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValueOnce(ok(null)).mockResolvedValueOnce(ok(activeStocktake()));
    mockStart.mockResolvedValueOnce(cmdError("stocktake_in_progress", "進行中の棚卸しがあります"));
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを開始する" }));
    expect(await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）")).toBeInTheDocument();
    expect(mockGetActive).toHaveBeenCalledTimes(2);

    mockGetActive.mockResolvedValue(ok(null));
    mockUpdateCount.mockResolvedValueOnce(
      cmdError("stocktake_not_in_progress", "この棚卸しは既に完了しています"),
    );
    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));
    await user.clear(await screen.findByLabelText("実際の数"));
    await user.type(screen.getByLabelText("実際の数"), "8");
    await user.click(screen.getByRole("button", { name: "数を保存" }));

    expect(await screen.findByText("この棚卸しは既に完了しています")).toBeInTheDocument();
    // stocktake_not_in_progress は状態 query を invalidate/再取得し、not_started 表示へ切り替わる（73 §73.9）
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "棚卸しを開始する" })).toBeInTheDocument();
    });
  });

  it("T18 complete_stocktake stocktake_not_in_progress recovers with operator-facing message (73 §73.9 contract audit)", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValueOnce(
      listResponse({ progress: { total_items: 2, counted_items: 2, uncounted_items: 0 } }),
    );
    mockComplete.mockResolvedValueOnce(
      cmdError("stocktake_not_in_progress", "他端末での並行操作による完了済みメッセージ"),
    );
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    mockGetActive.mockResolvedValue(ok(null));
    await user.click(await screen.findByRole("button", { name: "確定する" }));

    expect(await screen.findByText("この棚卸しは既に完了しています")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "棚卸しを開始する" })).toBeInTheDocument();
    });
  });

  it("T20 complete_stocktake validation error (force_fill 未入力超過) invalidates item list for retry", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValueOnce(
      listResponse({ progress: { total_items: 2, counted_items: 2, uncounted_items: 0 } }),
    );
    mockComplete.mockResolvedValueOnce(
      cmdError(
        "validation",
        "未入力の商品が1件あります。全商品のカウントを完了するか、force_fill=true で未入力をシステム在庫と同じとみなしてください",
      ),
    );
    await renderPage();

    const getItemsCallsBeforeConfirm = mockGetItems.mock.calls.length;
    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    await user.click(await screen.findByRole("button", { name: "確定する" }));

    expect(
      await screen.findByText(
        "未入力の商品が1件あります。全商品のカウントを完了するか、force_fill=true で未入力をシステム在庫と同じとみなしてください",
      ),
    ).toBeInTheDocument();
    // 一覧を invalidate/再取得し、次回の確定操作で最新の uncounted_items に基づいた判定ができるようにする
    await waitFor(() => {
      expect(mockGetItems.mock.calls.length).toBeGreaterThan(getItemsCallsBeforeConfirm);
    });
  });

  it("T21 product name search fallback resolves item when a single candidate matches (owner L3 finding)", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem.mockResolvedValueOnce(ok(null)).mockResolvedValueOnce(ok(baseStocktakeItem()));
    mockSearchProducts.mockResolvedValueOnce(
      ok({
        items: [makeMockProductWithRelations({ product_code: "P-001", name: "新商品テスト" })],
        total_count: 1,
        page: 1,
        per_page: 10,
      }),
    );
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "新商品テスト");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));

    expect(mockFindItem).toHaveBeenNthCalledWith(1, 77, "新商品テスト");
    expect(mockFindItem).toHaveBeenNthCalledWith(2, 77, "P-001");
    await waitFor(() => {
      expect(screen.getByLabelText("実際の数")).toHaveFocus();
    });
  });

  it("T22 product name search fallback shows candidate list when multiple products match", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem.mockResolvedValueOnce(ok(null)).mockResolvedValueOnce(ok(baseStocktakeItem()));
    mockSearchProducts.mockResolvedValueOnce(
      ok({
        items: [
          makeMockProductWithRelations({ product_code: "P-001", name: "赤い糸セット" }),
          makeMockProductWithRelations({ product_code: "P-002", name: "青い糸セット" }),
        ],
        total_count: 2,
        page: 1,
        per_page: 10,
      }),
    );
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "糸セット");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));

    expect(await screen.findByText("候補から商品を選んでください")).toBeInTheDocument();
    expect(screen.getByText("赤い糸セット")).toBeInTheDocument();
    expect(screen.getByText("青い糸セット")).toBeInTheDocument();

    const targetRow = screen.getByRole("row", { name: /赤い糸セット/ });
    await user.click(within(targetRow).getByRole("button", { name: "選択" }));

    expect(mockFindItem).toHaveBeenNthCalledWith(2, 77, "P-001");
    await waitFor(() => {
      expect(screen.getByLabelText("実際の数")).toHaveFocus();
    });
    expect(screen.queryByText("候補から商品を選んでください")).not.toBeInTheDocument();
  });

  it("T23 IME composition Enter does not trigger search/save (Codex review P2)", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    const codeInput = screen.getByLabelText("商品を検索・スキャン");
    fireEvent.change(codeInput, { target: { value: "しんしょうひん" } });
    fireEvent.keyDown(codeInput, { key: "Enter", isComposing: true });

    expect(mockFindItem).not.toHaveBeenCalled();

    fireEvent.change(codeInput, { target: { value: "P-001" } });
    fireEvent.keyDown(codeInput, { key: "Enter" });

    const quantityInput = await screen.findByLabelText("実際の数");
    fireEvent.change(quantityInput, { target: { value: "8" } });
    fireEvent.keyDown(quantityInput, { key: "Enter", isComposing: true });

    expect(mockUpdateCount).not.toHaveBeenCalled();
  });

  it("T14 complete pending shows spinner text and disables operations", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockComplete.mockImplementationOnce(() => new Promise(() => undefined));
    await renderPage();

    await user.click(await screen.findByRole("button", { name: "棚卸しを確定する" }));
    await user.click(screen.getByRole("button", { name: "確定する" }));

    expect(await screen.findByText("確定しています")).toBeInTheDocument();
    expect(screen.getByLabelText("商品を検索・スキャン")).toBeDisabled();
    expect(screen.getByRole("button", { name: "棚卸しを確定する" })).toBeDisabled();
  });

  it("T15 update success invalidates list so auto-added item appears without dedicated notification", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    const { invalidateSpy } = await renderPage();
    await screen.findByText("棚卸し中（開始日: 2026-10-01 09:00:00）");

    await user.type(screen.getByLabelText("商品を検索・スキャン"), "P-001");
    await user.click(screen.getByRole("button", { name: "対象を確認" }));
    await user.clear(await screen.findByLabelText("実際の数"));
    await user.type(screen.getByLabelText("実際の数"), "8");
    await user.click(screen.getByRole("button", { name: "数を保存" }));

    await waitFor(() => {
      expectExactInvalidations(
        invalidateSpy.mock.calls,
        d052InvalidationOracle.stocktakeCountUpdate(),
      );
    });
    expect(screen.queryByText("新しい商品を追加しました")).not.toBeInTheDocument();
    expect(within(screen.getByRole("table")).getByText("青い糸")).toBeInTheDocument();
  });

  it("SC1: counting screen has exactly one primary-styled button while a selected item and a candidate table coexist", async () => {
    const user = userEvent.setup();
    const candidates = [
      makeMockProductWithRelations({ product_code: "P-101", name: "候補の糸A" }),
      makeMockProductWithRelations({ product_code: "P-102", name: "候補の糸B" }),
    ];
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem
      .mockResolvedValueOnce(ok(null))
      .mockResolvedValueOnce(ok(stocktakeItem({ product_code: "P-101", name: "候補の糸A" })))
      .mockResolvedValueOnce(ok(null));
    mockSearchProducts
      .mockResolvedValueOnce(ok({ items: candidates, total_count: 2, page: 1, per_page: 10 }))
      .mockResolvedValueOnce(ok({ items: candidates, total_count: 2, page: 1, per_page: 10 }));
    await renderPage();

    const codeInput = await screen.findByLabelText("商品を検索・スキャン");
    await user.type(codeInput, "候補{Enter}");
    await screen.findByText("候補から商品を選んでください");
    expect(
      screen
        .getAllByRole("button")
        .filter((button) => button.className.includes("bg-primary text-primary-foreground")),
    ).toHaveLength(0);

    await user.click(within(screen.getByRole("row", { name: /候補の糸A/ })).getByRole("button"));
    expect(await screen.findByText("候補の糸A")).toBeInTheDocument();
    await user.clear(codeInput);
    await user.type(codeInput, "別候補{Enter}");
    await screen.findByText("候補から商品を選んでください");

    const primaryButtons = screen
      .getAllByRole("button")
      .filter((button) => button.className.includes("bg-primary text-primary-foreground"));
    expect(primaryButtons).toHaveLength(1);
    expect(primaryButtons[0]).toHaveAccessibleName("数を保存");
  });

  it("SC2: switching target via candidate selection clears previous FieldError", async () => {
    const user = userEvent.setup();
    const nextCandidates = [
      makeMockProductWithRelations({ product_code: "P-201", name: "切替先商品A" }),
      makeMockProductWithRelations({ product_code: "P-202", name: "切替先商品B" }),
    ];
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem
      .mockResolvedValueOnce(ok(baseStocktakeItem()))
      .mockResolvedValueOnce(ok(stocktakeItem({ product_code: "P-201", name: "切替先商品A" })));
    mockSearchProducts.mockResolvedValueOnce(
      ok({ items: nextCandidates, total_count: 2, page: 1, per_page: 10 }),
    );
    await renderPage();

    const codeInput = await screen.findByLabelText("商品を検索・スキャン");
    await user.type(codeInput, "P-001{Enter}");
    const quantityInput = await screen.findByLabelText("実際の数");
    await user.clear(quantityInput);
    await user.type(quantityInput, "-1{Enter}");
    expect(await screen.findByText("0以上の数値を入力してください")).toBeInTheDocument();

    await user.clear(codeInput);
    await user.type(codeInput, "切替先");
    await user.click(
      within(await screen.findByRole("listbox")).getByRole("option", { name: /切替先商品A/ }),
    );

    expect(await screen.findByText("切替先商品A")).toBeInTheDocument();
    expect(screen.queryByText("0以上の数値を入力してください")).not.toBeInTheDocument();
  });

  it("SC3: FieldError slot renders at fixed height with and without an error", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await user.type(await screen.findByLabelText("商品を検索・スキャン"), "P-001{Enter}");

    const quantityInput = await screen.findByLabelText("実際の数");
    const slot = quantityInput.parentElement?.querySelector(".min-h-5");
    expect(slot).toBeInTheDocument();
    expect(slot).toHaveAttribute("aria-live", "polite");

    await user.clear(quantityInput);
    await user.type(quantityInput, "-1{Enter}");
    expect(await screen.findByRole("alert")).toHaveTextContent("0以上の数値を入力してください");
    expect(quantityInput.parentElement?.querySelector(".min-h-5")).toBe(slot);
  });

  it("SC3b: save button top edge stays aligned with the quantity input's top edge regardless of FieldError", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await user.type(await screen.findByLabelText("商品を検索・スキャン"), "P-001{Enter}");

    const saveButton = await screen.findByRole("button", { name: "数を保存" });
    const buttonColumn = saveButton.closest(".flex");
    // 案(a) 採用: button column に min-h-5 相当の予約 slot（Label 高さ分の spacer を含む）を持たせ、
    // items-end ではなく items-start へ切り替えて入力欄の上端と揃える。
    expect(buttonColumn).toHaveClass("items-start");
    expect(buttonColumn?.querySelector(".min-h-5")).toBeInTheDocument();
    // mutation X3b-iii 是正: spacer 撤去（items-start と min-h-5 slot だけ残す）を kill するため、
    // ボタン直前に invisible + aria-hidden の spacer が実在することも独立に assert する。
    const spacer = buttonColumn?.firstElementChild;
    expect(spacer).toHaveAttribute("aria-hidden", "true");
    expect(spacer).toHaveClass("invisible");
    expect(spacer?.nextElementSibling).toBe(saveButton);

    // FieldError の出入りでこの構造が崩れないことも確認する。
    const quantityInput = await screen.findByLabelText("実際の数");
    await user.clear(quantityInput);
    await user.type(quantityInput, "-1{Enter}");
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    const saveButtonAfterError = await screen.findByRole("button", { name: "数を保存" });
    const buttonColumnAfterError = saveButtonAfterError.closest(".flex");
    expect(buttonColumnAfterError).toHaveClass("items-start");
    expect(buttonColumnAfterError?.querySelector(".min-h-5")).toBeInTheDocument();
    const spacerAfterError = buttonColumnAfterError?.firstElementChild;
    expect(spacerAfterError).toHaveAttribute("aria-hidden", "true");
    expect(spacerAfterError).toHaveClass("invisible");
    expect(spacerAfterError?.nextElementSibling).toBe(saveButtonAfterError);
  });

  it("SC4: target-not-found message renders as status info, not an alert", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem.mockResolvedValueOnce(ok(null));
    await renderPage();
    await user.type(await screen.findByLabelText("商品を検索・スキャン"), "NOPE{Enter}");

    const status = await screen.findByRole("status");
    expect(status).toHaveTextContent("この商品は棚卸しの対象にありません");
    expect(status).toHaveClass("text-muted-foreground");
    expect(status).not.toHaveClass("text-destructive");
    expect(status.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("SC5: uncounted badge tone switches between warning and success", () => {
    const { rerender } = render(
      <StocktakeProgressHeader
        startedAt="2026-10-01T09:00:00"
        progress={{ total_items: 1, counted_items: 0, uncounted_items: 1 }}
      />,
    );
    const warningBadge = screen.getByText("未入力 1").closest('[data-slot="badge"]');
    expect(warningBadge).toHaveClass(
      "border-warning-border",
      "bg-warning-soft",
      "text-warning-strong",
    );
    expect(warningBadge?.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();

    rerender(
      <StocktakeProgressHeader
        startedAt="2026-10-01T09:00:00"
        progress={{ total_items: 1, counted_items: 1, uncounted_items: 0 }}
      />,
    );
    const successBadge = screen.getByText("未入力 0").closest('[data-slot="badge"]');
    expect(successBadge).toHaveClass("bg-success", "text-primary-foreground");
    expect(successBadge?.querySelector('svg[aria-hidden="true"]')).toBeInTheDocument();
  });

  it("SC6: product-name search fallback query includes discontinued products and marks them", async () => {
    const user = userEvent.setup();
    const discontinued = makeMockProductWithRelations({
      product_code: "D-001",
      name: "廃番の糸",
      is_discontinued: true,
    });
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockFindItem.mockResolvedValueOnce(ok(null));
    mockSearchProducts.mockResolvedValueOnce(
      ok({
        items: [discontinued, makeMockProductWithRelations({ product_code: "P-002" })],
        total_count: 2,
        page: 1,
        per_page: 10,
      }),
    );
    await renderPage();
    await user.type(await screen.findByLabelText("商品を検索・スキャン"), "廃番{Enter}");

    expect(mockSearchProducts).toHaveBeenCalledWith({
      department_id: null,
      is_discontinued: null,
      sort_key: "ProductCode",
      sort_order: "Asc",
      page: 1,
      per_page: 10,
      keyword: "廃番",
    });
    const row = await screen.findByRole("row", { name: /廃番の糸/ });
    expect(within(row).getByText("廃番")).toBeInTheDocument();
  });

  it("SC8a: default per_page in the initial items query is 50", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();
    await waitFor(() => {
      expect(mockGetItems).toHaveBeenCalledWith(77, null, null, 1, 50);
    });
  });

  it("SC8b: changing per_page resets page to 1", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage({ page: 3 });
    await user.click(await screen.findByRole("combobox", { name: "表示件数" }));
    await user.click(screen.getByRole("option", { name: "100 件" }));

    await waitFor(() => {
      expect(mockGetItems).toHaveBeenLastCalledWith(77, null, null, 1, 100);
    });
  });

  it("SC8c': list pagination uses the canonical ProductPagination component", async () => {
    const user = userEvent.setup();
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    // AC7（round 1/3 是正）: Pagination は totalPages<=1 で null を返す（S2）ため、
    // ボタンの存在を確認するには total_count を per_page 超へ上げて totalPages>1 にする。
    mockGetItems.mockResolvedValue(listResponse({ total_count: 250 }));
    await renderPage();

    expect(await screen.findByRole("button", { name: "前のページ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次のページ" })).toBeInTheDocument();
    await user.click(screen.getByRole("combobox", { name: "表示件数" }));
    expect(screen.getByRole("option", { name: "50 件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "100 件" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "200 件" })).toBeInTheDocument();
  });

  it("SC10 (S4a rewrite): filter row lists department filter, then uncounted-only checkbox, then per-page select in that DOM order", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage();

    const departmentTrigger = await screen.findByRole("combobox", { name: "部門" });
    const perPageTrigger = screen.getByRole("combobox", { name: "表示件数" });
    const uncountedCheckbox = screen.getByRole("checkbox", { name: "未入力のみ表示" });

    // S4a（round 1 是正）: 部門 → 未入力のみ表示 → 表示件数 の順で DOM 上に並ぶことを
    // compareDocumentPosition で assert する（表示件数 Select を枠内の最後尾へ移動）。
    expect(
      departmentTrigger.compareDocumentPosition(uncountedCheckbox) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      uncountedCheckbox.compareDocumentPosition(perPageTrigger) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("SC4a: filter row root has rounded-lg border bg-card p-4 (old borderless frame removed)", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValue(listResponse());
    const { container } = await renderPage();
    await screen.findByRole("combobox", { name: "部門" });
    expect(container.querySelector(".rounded-lg.border.bg-card.p-4")).not.toBeNull();
    // 旧 frame（枠なし、`flex flex-wrap items-center gap-4` のみ）が残っていないこと。
    const oldFrame = Array.from(container.querySelectorAll("div")).find(
      (el) => el.className === "flex flex-wrap items-center gap-4",
    );
    expect(oldFrame).toBeUndefined();
  });

  it("SC3a: renders the top PaginationSummary above the results table when totalCount > 0", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValue(listResponse({ total_count: 2, per_page: 200 }));
    await renderPage();
    expect(
      await screen.findByText("全 2 件のうち 1〜2 件を表示（1 / 1 ページ）"),
    ).toBeInTheDocument();
  });

  it("SC6: the fieldset wrapping the bottom Pagination is absent when totalPages<=1", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValue(listResponse({ total_count: 2, per_page: 200 }));
    const { container } = await renderPage();
    await screen.findByText("全 2 件のうち 1〜2 件を表示（1 / 1 ページ）");
    // 「カウント入力」の fieldset（disabled 制御、常設）以外に一覧側の fieldset が
    // 残っていないこと（単一ページで空 <fieldset> を残さない、S5）。
    expect(container.querySelectorAll("fieldset")).toHaveLength(1);
    expect(screen.queryByRole("button", { name: "前のページ" })).not.toBeInTheDocument();
  });
});

describe("StocktakePage SPEC-UIBB-1/2（filter-empty reset action、73 §73.6）", () => {
  function emptyListResponse() {
    return listResponse({
      items: [],
      progress: { total_items: 0, counted_items: 0, uncounted_items: 0 },
      total_count: 0,
    });
  }

  it("SPEC-UIBB-1 絞り込み該当なしで解除ボタンを表示する", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValue(emptyListResponse());
    await renderPage({ dept: 1 });
    expect(await screen.findByRole("button", { name: "絞り込みを解除" })).toBeInTheDocument();
  });

  it("SPEC-UIBB-1 既定条件の0件では解除ボタンを出さない", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValue(emptyListResponse());
    await renderPage({});
    expect(await screen.findByText("この条件に一致する商品がありません")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "絞り込みを解除" })).not.toBeInTheDocument();
  });

  it("SPEC-UIBB-2 解除で部門フィルタ・未入力のみ・pageが既定値に戻る", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    mockGetItems.mockResolvedValue(emptyListResponse());
    const { onSearchChange } = await renderPage({ dept: 1, counted_only: false, page: 3 });

    const resetButton = await screen.findByRole("button", { name: "絞り込みを解除" });
    await userEvent.setup().click(resetButton);

    const mockedOnSearchChange = vi.mocked(onSearchChange);
    const updater = mockedOnSearchChange.mock.calls[
      mockedOnSearchChange.mock.calls.length - 1
    ]?.[0] as (prev: StocktakeSearch) => StocktakeSearch;
    const result = updater({ dept: 1, counted_only: false, page: 3 });
    expect(result.dept).toBeUndefined();
    expect(result.counted_only).toBeUndefined();
    expect(result.page).toBeUndefined();
  });
});

describe("StocktakePage perPage scroll（UI-10）", () => {
  it("SC9a: 表示件数変更で画面を先頭へ戻す", async () => {
    mockGetActive.mockResolvedValue(ok(activeStocktake()));
    await renderPage({ page: 3 });

    const user = userEvent.setup();
    await user.click(await screen.findByRole("combobox", { name: "表示件数" }));
    await user.click(screen.getByRole("option", { name: "100 件" }));

    expect(mockScrollPageToTop).toHaveBeenCalledTimes(1);
  });
});
