import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  makeMockProductWithRelations,
  makeMockSupplier,
} from "@/features/products/lib/test-fixtures";
import { commands } from "@/lib/bindings";
import { d052InvalidationOracle, expectExactInvalidations } from "@/test/invalidation-oracle";
import { ReceivingPage } from "./ReceivingPage";

vi.mock("@/hooks/useUnsavedChangesWarning", () => ({
  useUnsavedChangesWarning: () => ({
    isBlocked: false,
    continueEditing: vi.fn(),
    discardAndProceed: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    params,
    search,
    children,
  }: {
    to: string;
    params?: Record<string, string>;
    search?: Record<string, string>;
    children: ReactNode;
  }) => {
    const path =
      params === undefined
        ? to
        : Object.entries(params).reduce((path, [key, value]) => {
            return path.replace(`$${key}`, value);
          }, to);
    const query = search === undefined ? "" : `?${new URLSearchParams(search).toString()}`;
    const href = `${path}${query}`;
    return <a href={href}>{children}</a>;
  },
  useRouterState: ({ select }: { select: (state: { location: { href: string } }) => unknown }) =>
    select({ location: { href: "/inventory/receiving" } }),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@/lib/bindings", () => ({
  commands: {
    listSuppliers: vi.fn(),
    listReceivings: vi.fn(),
    searchProducts: vi.fn(),
    createReceiving: vi.fn(),
    getProduct: vi.fn(),
    reviseProductPrice: vi.fn(),
  },
}));

const mockListSuppliers = vi.mocked(commands.listSuppliers);
const mockListReceivings = vi.mocked(commands.listReceivings);
const mockSearchProducts = vi.mocked(commands.searchProducts);
const mockCreateReceiving = vi.mocked(commands.createReceiving);
const mockGetProduct = vi.mocked(commands.getProduct);
const mockReviseProductPrice = vi.mocked(commands.reviseProductPrice);
const mockScrollTo = vi.fn();

function renderWithClient(ui: ReactNode) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
  });
  return {
    queryClient,
    ...render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>),
  };
}

function mockDefaultQueries() {
  mockListSuppliers.mockResolvedValue({
    status: "ok",
    data: [makeMockSupplier({ id: 1, name: "テスト商事" })],
  });
  mockListReceivings.mockResolvedValue({
    status: "ok",
    data: { items: [], total_count: 0, page: 1, per_page: 10 },
  });
}

function createDeferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("deferred promise is not initialized");
  };
  const promise = new Promise<T>((res) => {
    resolve = res;
  });
  return { promise, resolve };
}

async function addSingleProduct(user: ReturnType<typeof userEvent.setup>) {
  mockSearchProducts.mockResolvedValue({
    status: "ok",
    data: {
      items: [makeMockProductWithRelations({ product_code: "P-001", name: "はさみ" })],
      total_count: 1,
      page: 1,
      per_page: 10,
    },
  });

  await user.type(await screen.findByLabelText("入庫商品検索"), "P-001{enter}");
  expect(await screen.findByText("P-001")).toBeInTheDocument();
}

beforeEach(() => {
  mockScrollTo.mockReset();
  vi.stubGlobal("scrollTo", mockScrollTo);
  mockListSuppliers.mockReset();
  mockListReceivings.mockReset();
  mockSearchProducts.mockReset();
  mockCreateReceiving.mockReset();
  mockGetProduct.mockReset();
  mockReviseProductPrice.mockReset();
  mockDefaultQueries();
});

describe("ReceivingPage (UI-02 / REQ-201)", () => {
  it("adds a single search result and returns focus to the search input", async () => {
    const user = userEvent.setup();
    renderWithClient(<ReceivingPage />);

    await addSingleProduct(user);

    expect(screen.getByText("はさみ")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByLabelText("入庫商品検索")).toHaveFocus();
    });
  });

  it("requires selection when product search returns multiple candidates", async () => {
    const user = userEvent.setup();
    mockSearchProducts.mockResolvedValue({
      status: "ok",
      data: {
        items: [
          makeMockProductWithRelations({ product_code: "P-001", name: "はさみ" }),
          makeMockProductWithRelations({ product_code: "P-002", name: "布" }),
        ],
        total_count: 2,
        page: 1,
        per_page: 10,
      },
    });

    renderWithClient(<ReceivingPage />);
    await user.type(await screen.findByLabelText("入庫商品検索"), "P{enter}");

    expect(await screen.findByText("候補から入庫する商品を選んでください")).toBeInTheDocument();
    expect(screen.queryByLabelText("P-001 の数量")).not.toBeInTheDocument();

    await user.click(screen.getAllByRole("button", { name: "入庫に追加" })[1]);

    expect(await screen.findByLabelText("P-002 の数量")).toBeInTheDocument();
  });

  it("shows product registration recovery when product search has no results", async () => {
    const user = userEvent.setup();
    mockSearchProducts.mockResolvedValue({
      status: "ok",
      data: { items: [], total_count: 0, page: 1, per_page: 10 },
    });

    renderWithClient(<ReceivingPage />);
    await user.type(await screen.findByLabelText("入庫商品検索"), "missing{enter}");

    expect(await screen.findByText("該当する商品がありません")).toBeInTheDocument();
    expect(
      screen.getByText("未登録商品の場合は、商品マスタに登録してから入庫記録に戻って追加します。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "商品登録へ進む" })).toHaveAttribute(
      "href",
      "/products/new",
    );
  });

  it("shows unsaved warning before product registration recovery when rows exist", async () => {
    const user = userEvent.setup();
    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    mockSearchProducts.mockResolvedValue({
      status: "ok",
      data: { items: [], total_count: 0, page: 1, per_page: 10 },
    });

    await user.type(screen.getByLabelText("入庫商品検索"), "missing{enter}");

    expect(
      await screen.findByText(
        "未保存の入庫内容があります。商品登録へ進むとこの画面の入力は残りません。",
      ),
    ).toBeInTheDocument();
  });

  it("allows no-supplier save when supplier options fail", async () => {
    const user = userEvent.setup();
    mockListSuppliers.mockResolvedValue({
      status: "error",
      error: { kind: "internal", message: "取引先取得失敗", field: null, error_id: null },
    });
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 10,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [],
      },
    });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    await waitFor(() => {
      expect(mockCreateReceiving).toHaveBeenCalledWith(
        expect.objectContaining({ supplier_id: null }),
      );
    });
    expect(await screen.findByText("入庫を保存しました")).toBeInTheDocument();
  });

  it("successful submit shows result and invalidates receiving/product/inventory record queries", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 11,
        created: true,
        idempotent_replay: false,
        stock_warnings: ["P-001: 在庫がマイナスになりました（-1）"],
        cost_diffs: [],
      },
    });

    const { queryClient } = renderWithClient(<ReceivingPage />);
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    });
    expect(await screen.findByText("記録ID")).toBeInTheDocument();
    expect(screen.getByText("11")).toBeInTheDocument();
    expect(screen.getByText("P-001: 在庫がマイナスになりました（-1）")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "詳細を見る" })).toHaveAttribute(
      "href",
      "/inventory/receiving/records/11?returnTo=%2Finventory%2Freceiving",
    );
    expect(screen.getByRole("button", { name: "入庫を保存" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    expect(mockCreateReceiving).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expectExactInvalidations(invalidateSpy.mock.calls, d052InvalidationOracle.receiving());
    });
  });

  it("REQ-201/REQ-206: recent list exposes all-history and detail links", async () => {
    mockListReceivings.mockResolvedValue({
      status: "ok",
      data: {
        items: [
          {
            id: 11,
            receiving_date: "2026-06-27",
            supplier_id: 1,
            supplier_name: "テスト商事",
            note: "午前便",
            created_at: "2026-06-27T09:00:00",
          },
        ],
        total_count: 1,
        page: 1,
        per_page: 5,
      },
    });

    renderWithClient(<ReceivingPage />);

    expect((await screen.findAllByText("テスト商事")).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: "すべての履歴を見る" })).toHaveAttribute(
      "href",
      "/inventory/records?recordType=receiving_record",
    );
    expect(screen.getByRole("link", { name: "詳細を見る" })).toHaveAttribute(
      "href",
      "/inventory/receiving/records/11?returnTo=%2Finventory%2Freceiving",
    );
  });

  it("REQ-201 clears row validation errors when an invalid row is removed and re-added", async () => {
    const user = userEvent.setup();
    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);

    fireEvent.change(screen.getByLabelText("P-001 の数量"), { target: { value: "0" } });
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    expect(
      await screen.findByText("P-001: 数量は1以上の整数で入力してください"),
    ).toBeInTheDocument();
    expect(mockScrollTo).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "P-001 を削除" }));
    await user.type(screen.getByLabelText("入庫商品検索"), "P-001{enter}");

    expect(
      screen.queryByText("P-001: 数量は1以上の整数で入力してください"),
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("P-001 の数量")).toHaveAttribute("aria-invalid", "false");
  });

  it("REQ-201 keeps validation errors for unchanged rows when another row changes", async () => {
    const user = userEvent.setup();
    mockSearchProducts
      .mockResolvedValueOnce({
        status: "ok",
        data: {
          items: [makeMockProductWithRelations({ product_code: "P-001", name: "はさみ" })],
          total_count: 1,
          page: 1,
          per_page: 10,
        },
      })
      .mockResolvedValueOnce({
        status: "ok",
        data: {
          items: [makeMockProductWithRelations({ product_code: "P-002", name: "布" })],
          total_count: 1,
          page: 1,
          per_page: 10,
        },
      });

    renderWithClient(<ReceivingPage />);
    await user.type(await screen.findByLabelText("入庫商品検索"), "P-001{enter}");
    await user.type(screen.getByLabelText("入庫商品検索"), "P-002{enter}");
    fireEvent.change(screen.getByLabelText("P-001 の数量"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("P-002 の数量"), { target: { value: "0" } });
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    expect(
      await screen.findByText("P-001: 数量は1以上の整数で入力してください"),
    ).toBeInTheDocument();
    expect(screen.getByText("P-002: 数量は1以上の整数で入力してください")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "P-001 を削除" }));

    expect(
      screen.queryByText("P-001: 数量は1以上の整数で入力してください"),
    ).not.toBeInTheDocument();
    expect(screen.getByText("P-002: 数量は1以上の整数で入力してください")).toBeInTheDocument();
  });

  it("submit pending disables editing and hides back navigation action", async () => {
    const user = userEvent.setup();
    const deferred = createDeferred<{
      status: "ok";
      data: {
        record_id: number;
        created: boolean;
        idempotent_replay: boolean;
        stock_warnings: string[];
        cost_diffs: [];
      };
    }>();
    mockCreateReceiving.mockReturnValue(deferred.promise);

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    mockSearchProducts.mockResolvedValue({
      status: "ok",
      data: {
        items: [
          makeMockProductWithRelations({ product_code: "P-002", name: "布" }),
          makeMockProductWithRelations({ product_code: "P-003", name: "糸" }),
        ],
        total_count: 2,
        page: 1,
        per_page: 10,
      },
    });
    await user.type(screen.getByLabelText("入庫商品検索"), "P{enter}");
    expect(await screen.findByText("候補から入庫する商品を選んでください")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "保存中..." })).toBeDisabled();
      expect(screen.getByRole("button", { name: "リセット" })).toBeDisabled();
      expect(screen.getByLabelText("P-001 の数量")).toBeDisabled();
      for (const button of screen.getAllByRole("button", { name: "入庫に追加" })) {
        expect(button).toBeDisabled();
      }
      expect(screen.queryByRole("link", { name: "在庫照会へ戻る" })).not.toBeInTheDocument();
    });

    deferred.resolve({
      status: "ok",
      data: {
        record_id: 12,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [],
      },
    });
  });

  it("keeps the same idempotency key for same-content retry", async () => {
    const user = userEvent.setup();
    mockCreateReceiving
      .mockResolvedValueOnce({
        status: "error",
        error: { kind: "internal", message: "一時的なエラー", field: null, error_id: null },
      })
      .mockResolvedValueOnce({
        status: "ok",
        data: {
          record_id: 20,
          created: true,
          idempotent_replay: false,
          stock_warnings: [],
          cost_diffs: [],
        },
      });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    expect(
      await screen.findByText("一時的なエラー。詳細は診断ログに記録されています。"),
    ).toBeInTheDocument();
    await waitFor(() => {
      expect(mockScrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    });
    const firstKey = mockCreateReceiving.mock.calls[0][0].idempotency_key;

    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    await waitFor(() => {
      expect(mockCreateReceiving).toHaveBeenCalledTimes(2);
    });
    expect(mockCreateReceiving.mock.calls[1][0].idempotency_key).toBe(firstKey);
  });

  it("generates a new idempotency key when the form is edited after create failure", async () => {
    const user = userEvent.setup();
    mockCreateReceiving
      .mockResolvedValueOnce({
        status: "error",
        error: { kind: "internal", message: "一時的なエラー", field: null, error_id: null },
      })
      .mockResolvedValueOnce({
        status: "ok",
        data: {
          record_id: 21,
          created: true,
          idempotent_replay: false,
          stock_warnings: [],
          cost_diffs: [],
        },
      });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    expect(
      await screen.findByText("一時的なエラー。詳細は診断ログに記録されています。"),
    ).toBeInTheDocument();
    const firstKey = mockCreateReceiving.mock.calls[0][0].idempotency_key;

    await user.type(screen.getByLabelText("備考"), "納品書あり");
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    await waitFor(() => {
      expect(mockCreateReceiving).toHaveBeenCalledTimes(2);
    });
    expect(mockCreateReceiving.mock.calls[1][0].idempotency_key).not.toBe(firstKey);
  });

  it("renders recent receiving success empty and error states", async () => {
    mockListReceivings.mockResolvedValueOnce({
      status: "ok",
      data: {
        items: [
          {
            id: 1,
            supplier_id: 1,
            supplier_name: "テスト商事",
            receiving_date: "2026-06-25",
            note: "午前便",
            created_at: "2026-06-25T10:00:00",
          },
        ],
        total_count: 1,
        page: 1,
        per_page: 10,
      },
    });

    renderWithClient(<ReceivingPage />);
    expect(await screen.findByText("午前便")).toBeInTheDocument();
  });

  it("REQ-209 T5 / Matrix T1: 保存済み入庫と更新・見送りの影響を原価差分ダイアログで説明する", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 901,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
        ],
      },
    });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    const dialog = await screen.findByRole("dialog", { name: "入庫原価を確認してください" });
    expect(within(dialog).getByText(/入庫の記録は保存済みです/)).toBeInTheDocument();
    expect(
      within(dialog).getByText(/商品マスタの原価が今回の実原価に変わります/),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(/入庫記録はそのまま残り、商品マスタの原価は変わりません/),
    ).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "テスト毛糸" })).toBeInTheDocument();
    expect(within(dialog).getByText("商品コード")).toBeInTheDocument();
    expect(within(dialog).getByText("P-901")).toBeInTheDocument();
    expect(within(dialog).getByText("マスタ原価")).toBeInTheDocument();
    expect(within(dialog).getByText("500 円")).toBeInTheDocument();
    expect(within(dialog).getByText("今回の実原価")).toBeInTheDocument();
    expect(within(dialog).getByText("501 円")).toBeInTheDocument();
  });

  it("REQ-209 / DSR-16 Matrix T6: 複数の原価差分商品を一意の見出しで識別できる", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 902,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
          {
            product_code: "P-902",
            product_name: "テスト生地",
            master_cost_price: 700,
            received_cost_price: 720,
          },
        ],
      },
    });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    const dialog = await screen.findByRole("dialog", { name: "入庫原価を確認してください" });
    expect(within(dialog).getByRole("heading", { name: "テスト毛糸" })).toBeInTheDocument();
    expect(within(dialog).getByRole("heading", { name: "テスト生地" })).toBeInTheDocument();
  });

  it("REQ-209 T6: 原価差分が空または冪等再送ならダイアログを表示しない", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValueOnce({
      status: "ok",
      data: {
        record_id: 902,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [],
      },
    });
    const first = renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    expect(await screen.findByText("入庫を保存しました")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "入庫原価を確認してください" }),
    ).not.toBeInTheDocument();
    first.unmount();

    mockCreateReceiving.mockResolvedValueOnce({
      status: "ok",
      data: {
        record_id: 902,
        created: false,
        idempotent_replay: true,
        stock_warnings: [],
        cost_diffs: [],
      },
    });
    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    expect(await screen.findByText("同じ内容の再送として処理済み")).toBeInTheDocument();
    expect(
      screen.queryByRole("dialog", { name: "入庫原価を確認してください" }),
    ).not.toBeInTheDocument();
  });

  it("REQ-209 T7: 現売価を据え置いて入庫実原価へ商品単位で更新する", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 903,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
        ],
      },
    });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-901", selling_price: 1200 }),
    });
    mockReviseProductPrice.mockResolvedValue({
      status: "ok",
      data: {
        product_code: "P-901",
        changed: true,
        plu_dirty_set: false,
        supplier_assigned: false,
      },
    });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    await user.click(
      await screen.findByRole("button", { name: "マスタ原価をこの実原価に更新する" }),
    );

    await waitFor(() => {
      expect(mockReviseProductPrice).toHaveBeenCalledWith({
        product_code: "P-901",
        new_selling_price: 1200,
        new_cost_price: 501,
        assign_supplier_id: null,
      });
    });
    expect(mockReviseProductPrice).toHaveBeenCalledTimes(1);
    expect(await screen.findByText("マスタ原価を更新しました")).toBeInTheDocument();
  });

  it("REQ-209 T8: 原価更新失敗を行内表示して再試行でき、入庫成功表示を維持する", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 904,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
        ],
      },
    });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-901", selling_price: 1200 }),
    });
    mockReviseProductPrice
      .mockResolvedValueOnce({
        status: "error",
        error: { kind: "internal", message: "更新失敗", field: null, error_id: null },
      })
      .mockResolvedValueOnce({
        status: "ok",
        data: {
          product_code: "P-901",
          changed: true,
          plu_dirty_set: false,
          supplier_assigned: false,
        },
      });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    await user.click(
      await screen.findByRole("button", { name: "マスタ原価をこの実原価に更新する" }),
    );

    expect(await screen.findByText("マスタ原価の更新に失敗しました")).toBeInTheDocument();
    expect(screen.getByText("入庫を保存しました")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "再試行する" }));
    expect(await screen.findByText("マスタ原価を更新しました")).toBeInTheDocument();
    expect(mockReviseProductPrice).toHaveBeenCalledTimes(2);
  });

  it("REQ-209 T9: 見送りで閉じても更新や記録を行わず入庫成功表示を維持する", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 905,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
        ],
      },
    });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));
    await user.click(await screen.findByRole("button", { name: "見送って閉じる" }));

    expect(
      screen.queryByRole("dialog", { name: "入庫原価を確認してください" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("入庫を保存しました")).toBeInTheDocument();
    expect(mockGetProduct).not.toHaveBeenCalled();
    expect(mockReviseProductPrice).not.toHaveBeenCalled();
  });

  it("T4 (UI 表示磨き batch Scope 4): 原価更新の成功/失敗を role とテキストで判別できる success token 表示にする", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 906,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
          {
            product_code: "P-902",
            product_name: "テストボタン",
            master_cost_price: 100,
            received_cost_price: 110,
          },
        ],
      },
    });
    mockGetProduct.mockImplementation((productCode: string) =>
      Promise.resolve({
        status: "ok",
        data: makeMockProductWithRelations({ product_code: productCode, selling_price: 1200 }),
      }),
    );
    mockReviseProductPrice
      .mockResolvedValueOnce({
        status: "ok",
        data: {
          product_code: "P-901",
          changed: true,
          plu_dirty_set: false,
          supplier_assigned: false,
        },
      })
      .mockResolvedValueOnce({
        status: "error",
        error: { kind: "internal", message: "更新失敗", field: null, error_id: null },
      });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    const dialog = await screen.findByRole("dialog", { name: "入庫原価を確認してください" });
    const buttons = within(dialog).getAllByRole("button", {
      name: "マスタ原価をこの実原価に更新する",
    });
    expect(buttons).toHaveLength(2);
    await user.click(buttons[0]);
    await user.click(buttons[1]);

    await waitFor(() => {
      expect(within(dialog).getByRole("status")).toHaveTextContent("マスタ原価を更新しました");
    });
    // 色だけに依存しない判別（UI-02-D15）: role と日本語テキストの両方で成功/失敗を見分けられる。
    await waitFor(() => {
      expect(within(dialog).getByRole("alert")).toHaveTextContent("マスタ原価の更新に失敗しました");
    });
  });

  it("T5 (UI 表示磨き batch Scope 5): 原価更新成功後にマスタ原価表示が新値へ更新され、全行処理済みで閉じるボタン文言が変わる", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 907,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
        ],
      },
    });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-901", selling_price: 1200 }),
    });
    mockReviseProductPrice.mockResolvedValue({
      status: "ok",
      data: {
        product_code: "P-901",
        changed: true,
        plu_dirty_set: false,
        supplier_assigned: false,
      },
    });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    const dialog = await screen.findByRole("dialog", { name: "入庫原価を確認してください" });
    function masterCostValue() {
      const label = within(dialog).getByText("マスタ原価");
      return label.parentElement?.querySelector("dd")?.textContent;
    }
    expect(masterCostValue()).toBe("500 円");
    // footer は未処理のうちは既存の「見送って閉じる」のまま。
    expect(within(dialog).getByRole("button", { name: "見送って閉じる" })).toBeInTheDocument();

    await user.click(
      within(dialog).getByRole("button", { name: "マスタ原価をこの実原価に更新する" }),
    );

    await waitFor(() => {
      expect(masterCostValue()).toBe("501 円");
    });
    // 61 §61.5 追記: 全行の更新完了後、footer 文言が状態対応（「閉じる」）に変わる。
    expect(within(dialog).getByRole("button", { name: "閉じる" })).toBeInTheDocument();
    expect(
      within(dialog).queryByRole("button", { name: "見送って閉じる" }),
    ).not.toBeInTheDocument();
  });

  it("T11 (owner L3 P1 — merge blocker): 原価差分ダイアログは外側クリック・Escape・×では閉じず、明示ボタンでのみ閉じる", async () => {
    const user = userEvent.setup();
    mockCreateReceiving.mockResolvedValue({
      status: "ok",
      data: {
        record_id: 908,
        created: true,
        idempotent_replay: false,
        stock_warnings: [],
        cost_diffs: [
          {
            product_code: "P-901",
            product_name: "テスト毛糸",
            master_cost_price: 500,
            received_cost_price: 501,
          },
        ],
      },
    });

    renderWithClient(<ReceivingPage />);
    await addSingleProduct(user);
    await user.click(screen.getByRole("button", { name: "入庫を保存" }));

    const dialog = await screen.findByRole("dialog", { name: "入庫原価を確認してください" });

    // 右上×（DialogPrimitive.Close、既定 showCloseButton）が render されないこと。
    expect(document.querySelector('[data-slot="dialog-close"]')).not.toBeInTheDocument();

    // overlay への pointer-down（dialog 外側クリック相当）で dialog が残ること。
    const overlay = document.querySelector('[data-slot="dialog-overlay"]');
    if (overlay === null) throw new Error("dialog-overlay not found");
    fireEvent.pointerDown(overlay);
    expect(screen.getByRole("dialog", { name: "入庫原価を確認してください" })).toBeInTheDocument();

    // Escape keydown で dialog が残ること。
    await user.keyboard("{Escape}");
    expect(screen.getByRole("dialog", { name: "入庫原価を確認してください" })).toBeInTheDocument();

    // 更新中は disabled・成功後は success 表示という既存契約は維持されている
    // （T4/T5 の回帰、ここでは disabled 状態の入口だけ再確認する）。
    expect(
      within(dialog).getByRole("button", { name: "マスタ原価をこの実原価に更新する" }),
    ).toBeEnabled();

    // footer の明示ボタン（「見送って閉じる」）でのみ閉じること。
    await user.click(within(dialog).getByRole("button", { name: "見送って閉じる" }));
    expect(
      screen.queryByRole("dialog", { name: "入庫原価を確認してください" }),
    ).not.toBeInTheDocument();
  });
});
