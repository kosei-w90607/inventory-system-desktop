// src/features/products/ProductListPage.bulk-dialog-target.test.tsx
//
// SC9（Gated Amendment 2 S12 / owner L3 FAIL-4、PR #32 comment 5526295095）: PLU 一括確認
// dialog を閉じる（cancel）とき、`bulkTarget` を null へ戻すと `pluTarget={bulkTarget ?? true}`
// の fallback で退出アニメーション中に反対文言へ反転する latent bug があった
// （`ProductListPage.tsx:303-309`、`b2389b19` 起源）。本 file は
// `PluBulkTargetConfirmDialog` を mock に差し替えて実際に渡される props を記録し、
// 「対象から外す」→ cancel 後の最終 render で `open === false` かつ `pluTarget === false`
// のまま保持されることを検証する。既存の bulk 系 test（ProductListPage.test.tsx、実 dialog
// を使う REQ-907 B-V3 系）を壊さないよう、dialog mock はこの file 専用に隔離する。

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { commands } from "@/lib/bindings";
import { makeMockProductWithRelations } from "./lib/test-fixtures";
import { ProductListPage } from "./ProductListPage";

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
    const resolvedTo = params?.code !== undefined ? to.replace("$code", params.code) : to;
    const query =
      search?.returnTo !== undefined ? `?returnTo=${encodeURIComponent(search.returnTo)}` : "";
    return <a href={`${resolvedTo}${query}`}>{children}</a>;
  },
}));

vi.mock("@/lib/bindings", () => ({
  commands: {
    searchProducts: vi.fn(),
    listDepartments: vi.fn(),
    listSuppliers: vi.fn(),
    bulkSetPluTarget: vi.fn(),
  },
}));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

interface MockDialogRender {
  open: boolean;
  pluTarget: boolean;
  count: number;
  isPending: boolean;
}

const pluDialogRenders = vi.hoisted(() => [] as MockDialogRender[]);

vi.mock("./components/PluBulkTargetConfirmDialog", () => ({
  PluBulkTargetConfirmDialog: (props: {
    open: boolean;
    pluTarget: boolean;
    count: number;
    isPending: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
  }) => {
    pluDialogRenders.push({
      open: props.open,
      pluTarget: props.pluTarget,
      count: props.count,
      isPending: props.isPending,
    });
    if (!props.open) return null;
    return (
      <div data-testid="mock-plu-dialog">
        <button
          type="button"
          onClick={() => {
            props.onOpenChange(false);
          }}
        >
          mock-cancel
        </button>
      </div>
    );
  },
}));

const mockSearchProducts = vi.mocked(commands.searchProducts);
const mockListDepartments = vi.mocked(commands.listDepartments);

function renderWithClient(ui: ReactNode) {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
  });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
}

function lastDialogRender(): MockDialogRender {
  if (pluDialogRenders.length === 0) {
    throw new Error("PluBulkTargetConfirmDialog mock has not rendered yet");
  }
  return pluDialogRenders[pluDialogRenders.length - 1];
}

beforeEach(() => {
  mockSearchProducts.mockReset();
  mockListDepartments.mockReset();
  pluDialogRenders.length = 0;
});

describe("ProductListPage SC9: dialog target 保持（Gated Amendment 2 S12 / owner L3 FAIL-4）", () => {
  it("「PLU 対象から外す」を開いて cancel した後の最終 render で pluTarget が false のまま open が false になる", async () => {
    mockSearchProducts.mockResolvedValue({
      status: "ok",
      data: {
        items: [makeMockProductWithRelations({ product_code: "P-SC9" })],
        total_count: 1,
        page: 1,
        per_page: 100,
      },
    });
    mockListDepartments.mockResolvedValue({ status: "ok", data: [] });

    renderWithClient(<ProductListPage search={{}} onSearchChange={vi.fn()} />);
    await screen.findByText("P-SC9");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "PLU 対象から外す" }));

    // dialog が開いた直後の render は open: true / pluTarget: false であること。
    const openedRenderCount = pluDialogRenders.length;
    expect(lastDialogRender()).toEqual({
      open: true,
      pluTarget: false,
      count: 1,
      isPending: false,
    });

    await user.click(screen.getByRole("button", { name: "mock-cancel" }));

    // cancel 後の最終 render で open が false になり、かつ pluTarget は反転せず false のまま。
    expect(lastDialogRender()).toEqual({
      open: false,
      pluTarget: false,
      count: 1,
      isPending: false,
    });

    // dialog を開いてから最終 render までの全 render で、pluTarget が true へ反転した瞬間が
    // 無いこと（旧実装は bulkTarget を null に戻し pluTarget={bulkTarget ?? true} で true へ
    // 反転していた）。
    const rendersSinceOpen = pluDialogRenders.slice(openedRenderCount - 1);
    for (const dialogRender of rendersSinceOpen) {
      expect(dialogRender.pluTarget).toBe(false);
    }
  });

  it("「PLU 対象にする」を開いて cancel した後は pluTarget が true のまま open が false になる（対称確認）", async () => {
    mockSearchProducts.mockResolvedValue({
      status: "ok",
      data: {
        items: [makeMockProductWithRelations({ product_code: "P-SC9B" })],
        total_count: 1,
        page: 1,
        per_page: 100,
      },
    });
    mockListDepartments.mockResolvedValue({ status: "ok", data: [] });

    renderWithClient(<ProductListPage search={{}} onSearchChange={vi.fn()} />);
    await screen.findByText("P-SC9B");

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "PLU 対象にする" }));
    expect(lastDialogRender()).toEqual({
      open: true,
      pluTarget: true,
      count: 1,
      isPending: false,
    });

    await user.click(screen.getByRole("button", { name: "mock-cancel" }));
    expect(lastDialogRender()).toEqual({
      open: false,
      pluTarget: true,
      count: 1,
      isPending: false,
    });
  });
});
