// src/features/products/components/PriceRevisionFilters.test.tsx
//
// Gated Amendment 2（owner L3 run 1 AC-L3-3）: 一括価格改定で「新しい取引先を追加」ボタンが
// 取引先 Select の隣から離れて見えた。DOM 順序自体は既に隣接していた（起票時実測）ため、
// 原因は flex-wrap による折り返し分離および一様 gap-3 による群化の欠如。取引先の
// label/Select/追加ボタンを表示件数ブロックと同型の共通 wrapper（flex items-center gap-2）
// で 1 unit にすることで検証する。
//
// 画面非依存の shared UI primitive の class 契約 test（Lane 5 L5-D6 先例）につき REQ/UI ID は
// 付けない。新規 test file 追加に伴い generate_traceability.rs の FE_UNREFERENCED_BASELINE を
// 更新した（packet Registration/Generation Obligations 参照）。

import type { UseQueryResult } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { Department, Supplier } from "@/lib/bindings";
import { PriceRevisionFilters } from "./PriceRevisionFilters";
import type { NormalizedPriceRevisionSearch, PriceRevisionSearch } from "../priceRevisionSearch";

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

describe("GA2: 取引先 label/Select/追加ボタンの群化（Gated Amendment 2）", () => {
  it("取引先の label・Select・追加ボタンが共通の flex wrapper 1 つを共有する", () => {
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
    const select = screen.getByRole("combobox", { name: "取引先" });
    const button = screen.getByRole("button", { name: "新しい取引先を追加" });

    const wrapper = label.closest(".flex.items-center.gap-2");
    expect(wrapper).not.toBeNull();
    expect(wrapper).toContainElement(select);
    expect(wrapper).toContainElement(button);
  });

  it("DOM 順序（取引先 Select → 追加ボタン → … → 表示件数 Select）は不変（回帰ガード）", () => {
    renderFilters();

    const select = screen.getByRole("combobox", { name: "取引先" });
    const button = screen.getByRole("button", { name: "新しい取引先を追加" });
    const perPageSelect = screen.getByRole("combobox", { name: "表示件数" });

    expect(select.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(
      button.compareDocumentPosition(perPageSelect) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
