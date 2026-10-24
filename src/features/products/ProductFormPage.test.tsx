// src/features/products/ProductFormPage.test.tsx

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { commands } from "@/lib/bindings";
import { d052InvalidationOracle, expectExactInvalidations } from "@/test/invalidation-oracle";
import { toast } from "sonner";
import {
  makeMockDepartment,
  makeMockProductWithRelations,
  makeMockSupplier,
} from "./lib/test-fixtures";
import { ProductFormPage } from "./ProductFormPage";

vi.mock("@/hooks/useUnsavedChangesWarning", () => ({
  useUnsavedChangesWarning: () => ({
    isBlocked: false,
    continueEditing: vi.fn(),
    discardAndProceed: vi.fn(),
  }),
}));

vi.mock("@/lib/bindings", () => ({
  commands: {
    listDepartments: vi.fn(),
    listSuppliers: vi.fn(),
    getProduct: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    toggleDiscontinue: vi.fn(),
  },
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

const mockToastSuccess = vi.mocked(toast.success);

const mockListDepartments = vi.mocked(commands.listDepartments);
const mockListSuppliers = vi.mocked(commands.listSuppliers);
const mockGetProduct = vi.mocked(commands.getProduct);
const mockCreateProduct = vi.mocked(commands.createProduct);
const mockUpdateProduct = vi.mocked(commands.updateProduct);
const mockToggleDiscontinue = vi.mocked(commands.toggleDiscontinue);

function renderWithClient(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
  });
  return {
    queryClient: qc,
    ...render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>),
  };
}

beforeEach(() => {
  mockListDepartments.mockReset();
  mockListSuppliers.mockReset();
  mockGetProduct.mockReset();
  mockCreateProduct.mockReset();
  mockUpdateProduct.mockReset();
  mockToggleDiscontinue.mockReset();
  mockToastSuccess.mockReset();
});

describe("ProductFormPage (UI-01b)", () => {
  it("REQ-907 shows the assigned register memory number as read-only", async () => {
    mockListDepartments.mockResolvedValue({
      status: "ok",
      data: [makeMockDepartment()],
    });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ plu_memory_no: 217 }),
    });

    renderWithClient(
      <ProductFormPage mode="edit" productCode="P-001" onNavigateToList={vi.fn()} />,
    );
    const memory = await screen.findByLabelText("レジメモリNo.");
    expect(memory).toHaveValue("217");
    expect(memory).toHaveAttribute("readonly");
  });

  it("REQ-907 shows unassigned for a product without a register slot", async () => {
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ plu_memory_no: null }),
    });
    renderWithClient(
      <ProductFormPage mode="edit" productCode="P-001" onNavigateToList={vi.fn()} />,
    );
    expect(await screen.findByLabelText("レジメモリNo.")).toHaveValue("未割当");
  });

  it("blocks create submit when JAN is blank and department has no code_prefix", async () => {
    const user = userEvent.setup();
    mockListDepartments.mockResolvedValue({
      status: "ok",
      data: [makeMockDepartment({ id: 2, name: "通常部門", code_prefix: null })],
    });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });

    renderWithClient(<ProductFormPage mode="create" onNavigateToList={vi.fn()} />);

    await user.type(await screen.findByLabelText(/^商品名/), "テスト商品");
    await user.click(screen.getByLabelText(/^部門/));
    await user.click(await screen.findByRole("option", { name: "通常部門" }));
    await user.clear(screen.getByLabelText(/^売価/));
    await user.type(screen.getByLabelText(/^売価/), "500");
    await user.clear(screen.getByLabelText(/^原価/));
    await user.type(screen.getByLabelText(/^原価/), "300");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    expect(await screen.findByText(/独自コード発番対象/)).toBeInTheDocument();
    expect(mockCreateProduct).not.toHaveBeenCalled();
  });

  it("allows no-supplier create when supplier options fail", async () => {
    const user = userEvent.setup();
    const onNavigateToList = vi.fn();
    mockListDepartments.mockResolvedValue({
      status: "ok",
      data: [makeMockDepartment({ id: 1, code_prefix: "Y" })],
    });
    mockListSuppliers.mockResolvedValue({
      status: "error",
      error: {
        kind: "internal",
        message: "取引先取得失敗",
        field: null,
        error_id: null,
        stocktake_recovery: null,
      },
    });
    mockCreateProduct.mockResolvedValue({
      status: "ok",
      data: { product_code: "Y-0001", warnings: [] },
    });

    const { queryClient } = renderWithClient(
      <ProductFormPage
        mode="create"
        returnTo="/products?q=布"
        onNavigateToList={onNavigateToList}
      />,
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.type(await screen.findByLabelText(/^商品名/), "テスト商品");
    await user.click(screen.getByLabelText(/^部門/));
    await user.click(await screen.findByRole("option", { name: "毛糸（独自コード可）" }));
    await user.clear(screen.getByLabelText(/^売価/));
    await user.type(screen.getByLabelText(/^売価/), "500");
    await user.clear(screen.getByLabelText(/^原価/));
    await user.type(screen.getByLabelText(/^原価/), "300");
    await user.click(screen.getByRole("button", { name: "登録する" }));

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledWith(
        expect.objectContaining({ supplier_id: null }),
      );
    });
    await waitFor(() => {
      expect(onNavigateToList).toHaveBeenCalledWith("/products?q=%E5%B8%83");
    });
    // UI-01b-D14: 保存成功 toast（id 固定）
    expect(mockToastSuccess).toHaveBeenCalledWith(
      expect.stringContaining("Y-0001"),
      expect.objectContaining({ id: "product-save-success" }),
    );
    expectExactInvalidations(invalidateSpy.mock.calls, d052InvalidationOracle.productCreate());
  });

  it("blocks save when department options fail", async () => {
    mockListDepartments.mockResolvedValue({
      status: "error",
      error: {
        kind: "internal",
        message: "部門取得失敗",
        field: null,
        error_id: null,
        stocktake_recovery: null,
      },
    });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });

    renderWithClient(<ProductFormPage mode="create" onNavigateToList={vi.fn()} />);

    expect(await screen.findByText("部門候補を取得できませんでした")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "登録する" })).toBeDisabled();
  });

  it("shows recovery when edit target is not found", async () => {
    const user = userEvent.setup();
    const onNavigateToList = vi.fn();
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "error",
      error: {
        kind: "not_found",
        message: "商品が見つかりません",
        field: null,
        error_id: null,
        stocktake_recovery: null,
      },
    });

    renderWithClient(
      <ProductFormPage
        mode="edit"
        productCode="P-MISSING"
        returnTo="/products?page=2"
        onNavigateToList={onNavigateToList}
      />,
    );

    expect(await screen.findByText("商品が見つかりません")).toBeInTheDocument();
    expect(screen.getByText("商品一覧へ戻って、もう一度選択してください。")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "一覧へ戻る" }));

    expect(onNavigateToList).toHaveBeenCalledWith("/products?page=2");
  });

  it("edit save sends only supported changed fields and preserves form on duplicate error", async () => {
    const user = userEvent.setup();
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [makeMockSupplier({ id: 1 })] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-001", name: "変更前" }),
    });
    mockUpdateProduct.mockResolvedValue({
      status: "error",
      error: {
        kind: "duplicate",
        message: "この商品コードは既に使用されています",
        field: null,
        error_id: null,
        stocktake_recovery: null,
      },
    });

    const { queryClient } = renderWithClient(
      <ProductFormPage mode="edit" productCode="P-001" onNavigateToList={vi.fn()} />,
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const name = await screen.findByLabelText(/^商品名/);
    await user.clear(name);
    await user.type(name, "変更後");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(mockUpdateProduct).toHaveBeenCalledWith("P-001", { name: "変更後" });
    });
    expect(await screen.findByText("この商品コードは既に使用されています")).toBeInTheDocument();
    expect(screen.getByDisplayValue("変更後")).toBeInTheDocument();
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("UI-01b-D23: 単位を変えて保存すると stock_unit を送り、拒否は保存の error に出る", async () => {
    const user = userEvent.setup();
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-001", stock_unit: "pcs" }),
    });
    mockUpdateProduct.mockResolvedValue({
      status: "error",
      error: {
        kind: "validation",
        message: "在庫単位は個数の単位どうしでだけ変えられます",
        field: null,
        error_id: null,
        stocktake_recovery: null,
      },
    });

    renderWithClient(
      <ProductFormPage mode="edit" productCode="P-001" onNavigateToList={vi.fn()} />,
    );

    await user.click(await screen.findByLabelText("数量単位"));
    await user.click(await screen.findByRole("option", { name: "玉" }));
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(mockUpdateProduct).toHaveBeenCalledWith("P-001", { stock_unit: "ball" });
    });
    expect(
      await screen.findByText("在庫単位は個数の単位どうしでだけ変えられます"),
    ).toBeInTheDocument();
  });

  it("D-052-C2a update success invalidates the exact independent oracle set", async () => {
    const user = userEvent.setup();
    const onNavigateToList = vi.fn();
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-001", name: "変更前" }),
    });
    mockUpdateProduct.mockResolvedValue({ status: "ok", data: { warnings: [] } });

    const { queryClient } = renderWithClient(
      <ProductFormPage mode="edit" productCode="P-001" onNavigateToList={onNavigateToList} />,
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    const name = await screen.findByLabelText(/^商品名/);
    await user.clear(name);
    await user.type(name, "変更後");
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(onNavigateToList).toHaveBeenCalled();
      expectExactInvalidations(
        invalidateSpy.mock.calls,
        d052InvalidationOracle.productUpdate("P-001"),
      );
    });
  });

  it("D-052-C2b discontinue toggle invalidates the same exact update oracle set", async () => {
    const user = userEvent.setup();
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-001", name: "廃番対象" }),
    });
    mockToggleDiscontinue.mockResolvedValue({ status: "ok", data: true });

    const { queryClient } = renderWithClient(
      <ProductFormPage mode="edit" productCode="P-001" onNavigateToList={vi.fn()} />,
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(await screen.findByRole("button", { name: "廃番にする" }));
    await user.click(screen.getByRole("button", { name: "廃番にする" }));

    await waitFor(() => {
      expect(mockToggleDiscontinue).toHaveBeenCalledWith("P-001");
      expectExactInvalidations(
        invalidateSpy.mock.calls,
        d052InvalidationOracle.productUpdate("P-001"),
      );
    });
  });

  it("D-052-C2b restore toggle invalidates the same exact update oracle set", async () => {
    const user = userEvent.setup();
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({
        product_code: "P-001",
        name: "復帰対象",
        is_discontinued: true,
      }),
    });
    mockToggleDiscontinue.mockResolvedValue({ status: "ok", data: false });

    const { queryClient } = renderWithClient(
      <ProductFormPage mode="edit" productCode="P-001" onNavigateToList={vi.fn()} />,
    );
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");

    await user.click(await screen.findByRole("button", { name: "表示に戻す" }));

    await waitFor(() => {
      expect(mockToggleDiscontinue).toHaveBeenCalledWith("P-001");
      expectExactInvalidations(
        invalidateSpy.mock.calls,
        d052InvalidationOracle.productUpdate("P-001"),
      );
    });
  });

  it("U12 stock link start rejection shows recovery link", async () => {
    // 51 の D-118 の節: recount_required は文と「今の数を入れる」の導線。入力を保ち、toast・遷移をしない
    const user = userEvent.setup();
    const onNavigateToList = vi.fn();
    const onNavigateToStocktake = vi.fn();
    mockListDepartments.mockResolvedValue({ status: "ok", data: [makeMockDepartment()] });
    mockListSuppliers.mockResolvedValue({ status: "ok", data: [] });
    mockGetProduct.mockResolvedValue({
      status: "ok",
      data: makeMockProductWithRelations({ product_code: "P-005", pos_stock_sync: false }),
    });
    mockUpdateProduct.mockResolvedValue({
      status: "error",
      error: {
        kind: "stocktake_guard",
        message: "連動しない間の売上があります。今の数を入れてから在庫連動にしてください",
        field: null,
        error_id: null,
        stocktake_recovery: {
          code: "recount_required",
          targets: [
            {
              product_code: "P-005",
              product_name: "連動なしの糸",
              stock_unit: "pcs",
              stock: 7,
              stock_range_low: null,
              stock_range_high: null,
              stocktake_item_id: null,
              stocktake_id: null,
              action: "count_now",
              block_reason: null,
              recount_reasons: [],
            },
          ],
          settlement_pending: null,
        },
      },
    });

    renderWithClient(
      <ProductFormPage
        mode="edit"
        productCode="P-005"
        onNavigateToList={onNavigateToList}
        onNavigateToStocktake={onNavigateToStocktake}
      />,
    );

    const checkbox = await screen.findByLabelText("POS販売で在庫を減らす");
    expect(checkbox).not.toBeChecked();
    await user.click(checkbox);
    await user.click(screen.getByRole("button", { name: "保存する" }));

    await waitFor(() => {
      expect(mockUpdateProduct).toHaveBeenCalledWith("P-005", { pos_stock_sync: true });
    });
    const notice = await screen.findByRole("alert", { name: "在庫連動にできません" });
    expect(
      within(notice).getByText(
        "連動しない間の売上があります。今の数を入れてから在庫連動にしてください",
      ),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("POS販売で在庫を減らす")).toBeChecked();
    expect(mockToastSuccess).not.toHaveBeenCalled();
    expect(onNavigateToList).not.toHaveBeenCalled();

    await user.click(within(notice).getByRole("button", { name: "今の数を入れる" }));
    expect(onNavigateToStocktake).toHaveBeenCalledWith({
      product: "P-005",
      returnTo: "/products/P-005/edit",
    });
  });
});
