import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { commands } from "@/lib/bindings";
import { expectExactInvalidations } from "@/test/invalidation-oracle";
import { useMergeSuppliers } from "./useMergeSuppliers";
import { useRenameSupplier } from "./useRenameSupplier";

vi.mock("@/lib/bindings", () => ({
  commands: {
    renameSupplier: vi.fn(),
    mergeSuppliers: vi.fn(),
  },
}));

const mockRename = vi.mocked(commands.renameSupplier);
const mockMerge = vi.mocked(commands.mergeSuppliers);
const C21_KEYS = [
  ["product-form"],
  ["price-revision"],
  ["suppliers"],
  ["product-list"],
  ["products", "low-stock", { includeDiscontinued: false }],
  ["stock-inquiry"],
  ["receivings"],
  ["inventory-records"],
] as const;
const C22_KEYS = [
  ["product-form"],
  ["price-revision"],
  ["suppliers"],
  ["product-list"],
  ["products", "low-stock", { includeDiscontinued: false }],
  ["stock-inquiry"],
  ["receivings"],
  ["inventory-records"],
] as const;

function setup() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  const invalidate = vi.spyOn(client, "invalidateQueries").mockResolvedValue();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  return { client, invalidate, wrapper };
}

beforeEach(() => vi.clearAllMocks());

describe("UI-15 / REQ-107 supplier invalidation", () => {
  it("改名成功後に D-052-C21 の独立 oracle 集合を invalidate する", async () => {
    mockRename.mockResolvedValue({
      status: "ok",
      data: { id: 1, name: "新取引先", created_at: "2026-08-25T10:00:00" },
    });
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useRenameSupplier(), { wrapper });
    result.current.mutate({ supplierId: 1, name: "新取引先" });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expectExactInvalidations(invalidate.mock.calls, C21_KEYS);
  });

  it("統合成功後に D-052-C22 の独立 oracle 集合を invalidate する", async () => {
    mockMerge.mockResolvedValue({
      status: "ok",
      data: { products_updated: 2, receiving_records_updated: 1 },
    });
    const { wrapper, invalidate } = setup();
    const { result } = renderHook(() => useMergeSuppliers(), { wrapper });
    result.current.mutate({ sourceId: 1, targetId: 2 });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
    expectExactInvalidations(invalidate.mock.calls, C22_KEYS);
  });
});
