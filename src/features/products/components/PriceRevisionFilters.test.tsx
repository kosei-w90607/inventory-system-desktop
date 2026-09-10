// GA2: 取引先 Label と picker trigger の群化・DOM 順序を維持する。
// REQ/UI ID を付けない既存 test file として FE_UNREFERENCED_BASELINE に計上済み。
// この分類を維持し、仕様は SPEC 接頭辞で示す。
import type { UseQueryResult } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { commands, type Department, type Supplier } from "@/lib/bindings";
import { PriceRevisionFilters } from "./PriceRevisionFilters";
import type { NormalizedPriceRevisionSearch, PriceRevisionSearch } from "../priceRevisionSearch";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/bindings", () => ({ commands: { createSupplier: vi.fn() } }));

function fakeQuery<T>(data: T): UseQueryResult<T> {
  return {
    data,
    isLoading: false,
    isError: false,
    refetch: vi.fn(),
  } as unknown as UseQueryResult<T>;
}

const search: PriceRevisionSearch = {};
const normalized: NormalizedPriceRevisionSearch = {
  q: undefined,
  supplier: undefined,
  dept: undefined,
  discontinued: false,
  includeUnassigned: false,
  sort: "product_code",
  page: 1,
  perPage: 50,
};

function renderFilters() {
  return render(
    <PriceRevisionFilters
      search={search}
      normalized={normalized}
      suppliersQuery={fakeQuery<Supplier[]>([])}
      departmentsQuery={fakeQuery<Department[]>([])}
      onPatch={vi.fn()}
      perPage={50}
      onPerPageChange={vi.fn()}
    />,
  );
}

describe("GA2: 取引先 label/triggerの群化（Gated Amendment 2）", () => {
  it("取引先の label・triggerが共通の flex wrapper 1 つを共有する", () => {
    render(
      <PriceRevisionFilters
        search={search}
        normalized={normalized}
        suppliersQuery={fakeQuery<Supplier[]>([])}
        departmentsQuery={fakeQuery<Department[]>([])}
        onPatch={vi.fn()}
        perPage={50}
        onPerPageChange={vi.fn()}
      />,
    );

    const label = screen.getByText("取引先");
    const button = screen.getByRole("button", { name: /取引先/ });

    const wrapper = label.closest(".flex.items-center.gap-2");
    expect(wrapper).not.toBeNull();
    expect(wrapper).toContainElement(button);
  });

  it("DOM 順序（取引先 Label → trigger → 部門 → … → 表示件数 Select）は不変（回帰ガード）", () => {
    renderFilters();

    const button = screen.getByRole("button", { name: /取引先/ });
    const perPageSelect = screen.getByRole("combobox", { name: "表示件数" });

    const label = screen.getByText("取引先");
    const department = screen.getByRole("combobox", { name: "部門" });
    expect(label.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      button.compareDocumentPosition(department) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(
      button.compareDocumentPosition(perPageSelect) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});

function pickerFilters(isError = false) {
  const onPatch = vi.fn();
  const suppliersQuery = fakeQuery<Supplier[]>([
    { id: 1, name: "テスト取引先", created_at: "2026-09-10" },
  ]);
  suppliersQuery.isError = isError;
  render(
    <PriceRevisionFilters
      search={{ supplier: 1 }}
      normalized={{ ...normalized, supplier: 1, includeUnassigned: true }}
      suppliersQuery={suppliersQuery}
      departmentsQuery={fakeQuery<Department[]>([])}
      onPatch={onPatch}
      perPage={50}
      onPerPageChange={vi.fn()}
    />,
  );
  return { onPatch, suppliersQuery, user: userEvent.setup() };
}
it("SPEC-PRV-D6: opens supplier picker from trigger and patches supplier on select", async () => {
  const { user, onPatch, suppliersQuery } = pickerFilters();
  const trigger = screen.getByRole("button", { name: /取引先/ });
  expect(trigger).toHaveTextContent("テスト取引先");
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "すべての取引先" }));
  expect(onPatch).toHaveBeenCalledExactlyOnceWith({ supplier: null });
  onPatch.mockClear();
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "テスト取引先" }));
  expect(onPatch).toHaveBeenCalledExactlyOnceWith({ supplier: 1 });
  onPatch.mockClear();
  vi.mocked(commands.createSupplier).mockResolvedValue({
    status: "ok",
    data: { id: 2, name: "新規", created_at: "2026-09-10" },
  });
  await user.click(trigger);
  await user.click(screen.getByRole("button", { name: "新しい取引先を追加" }));
  await user.type(screen.getByLabelText("取引先名"), "新規");
  await user.click(screen.getByRole("button", { name: "追加する" }));
  await waitFor(() => {
    expect(onPatch).toHaveBeenCalledExactlyOnceWith({ supplier: 2 });
  });
  expect(suppliersQuery.refetch).toHaveBeenCalledTimes(1);
});
it("SPEC-PRV-D3: shows 取引先未設定の商品も含める in the filter row, checked by default, when a supplier is selected", async () => {
  const { user } = pickerFilters();
  const toggle = screen.getByRole("checkbox", { name: "取引先未設定の商品も含める" });
  expect(toggle).toBeChecked();
  await user.click(screen.getByRole("button", { name: /取引先/ }));
  expect(screen.getByRole("dialog")).not.toContainElement(toggle);
});
it("SPEC-PRV-D6: surfaces the fetch error inside the picker and retries through suppliersQuery.refetch", async () => {
  const { user, suppliersQuery } = pickerFilters(true);
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /取引先/ }));
  expect(screen.getByRole("alert")).toHaveTextContent("取引先一覧を取得できませんでした");
  await user.click(screen.getByRole("button", { name: "再試行" }));
  expect(suppliersQuery.refetch).toHaveBeenCalledTimes(1);
});

it("SPEC-PRV-D6: shows an unresolved trigger for a selected supplier when fetching fails without data and opens retry", async () => {
  const user = userEvent.setup();
  const suppliersQuery = {
    ...fakeQuery<Supplier[]>([]),
    data: undefined,
    isError: true,
  } as UseQueryResult<Supplier[]>;
  render(
    <PriceRevisionFilters
      search={{ supplier: 1 }}
      normalized={{ ...normalized, supplier: 1, includeUnassigned: true }}
      suppliersQuery={suppliersQuery}
      departmentsQuery={fakeQuery<Department[]>([])}
      onPatch={vi.fn()}
      perPage={50}
      onPerPageChange={vi.fn()}
    />,
  );
  const trigger = screen.getByRole("button", { name: /取引先/ });
  expect(trigger).toHaveTextContent("取引先を確認できません");
  expect(trigger).toBeEnabled();
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  await user.click(trigger);
  expect(screen.getByRole("alert")).toHaveTextContent("取引先一覧を取得できませんでした");
  await user.click(screen.getByRole("button", { name: "再試行" }));
  expect(suppliersQuery.refetch).toHaveBeenCalledTimes(1);
});
