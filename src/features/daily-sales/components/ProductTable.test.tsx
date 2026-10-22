// src/features/daily-sales/components/ProductTable.test.tsx
//
// REQ-501: H-6 feedback で商品コードが小さいと確認されたため、
// 日次売上の商品コード列は最小級 text-xs に戻さない。
// 設計: docs/plans/2026-06-07-display-scale-readability.md

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { makeMockItem } from "../lib/test-fixtures";
import type { GroupedSection } from "../types";
import { ProductTable } from "./ProductTable";

const EXPECTED_SORT_HEADERS = [
  { value: "product_code", label: "商品コード" },
  { value: "name", label: "商品名" },
  { value: "quantity", label: "数量" },
  { value: "unit_price", label: "単価" },
  { value: "amount", label: "金額" },
] as const;

describe("ProductTable (REQ-501 商品コード readability)", () => {
  it("REQ-501: product code cell uses readable table text size", () => {
    const item = makeMockItem({ product_code: "HZ-0047", name: "生成り布" });
    const grouped: GroupedSection[] = [
      {
        departmentId: 1,
        departmentName: "布",
        items: [item],
        subtotal: {
          department_id: 1,
          department_name: "布",
          count_points: 1,
          length_cm: 0,
          amount: 100,
        },
      },
    ];

    render(
      <ProductTable
        grouped={grouped}
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
        grandTotal={null}
      />,
    );

    const cell = screen.getByText("HZ-0047").closest("td");
    expect(cell?.className).toContain("text-sm");
    expect(cell?.className).not.toContain("text-xs");
  });

  it("UI-09a: 5 sortable headers preserve click payload, ARIA, indicator, and alignment", () => {
    const onSortChange = vi.fn();
    const item = makeMockItem({ product_code: "HZ-0047", name: "生成り布" });
    const grouped: GroupedSection[] = [
      {
        departmentId: 1,
        departmentName: "布",
        items: [item],
        subtotal: {
          department_id: 1,
          department_name: "布",
          count_points: 1,
          length_cm: 0,
          amount: 100,
        },
      },
    ];

    render(
      <ProductTable
        grouped={grouped}
        sortBy="product_code"
        sortDir="asc"
        onSortChange={onSortChange}
        grandTotal={null}
      />,
    );

    for (const { label } of EXPECTED_SORT_HEADERS) {
      fireEvent.click(screen.getByRole("button", { name: label }));
    }

    expect(onSortChange).toHaveBeenCalledTimes(EXPECTED_SORT_HEADERS.length);
    EXPECTED_SORT_HEADERS.forEach(({ value }, index) => {
      expect(onSortChange).toHaveBeenNthCalledWith(index + 1, value);
    });

    const productCodeButton = screen.getByRole("button", { name: "商品コード" });
    const productCodeHeader = productCodeButton.closest("th");
    const nameHeader = screen.getByRole("button", { name: "商品名" }).closest("th");
    const quantityHeader = screen.getByRole("button", { name: "数量" }).closest("th");

    expect(productCodeHeader).toHaveAttribute("aria-sort", "ascending");
    expect(nameHeader).toHaveAttribute("aria-sort", "none");
    expect(productCodeButton.querySelector('span[aria-hidden="true"]')).toHaveTextContent("▲");
    expect(screen.getByRole("button", { name: "商品名" })).not.toHaveTextContent(/[▲▼]/);
    expect(quantityHeader).toHaveClass("text-right");
    expect(nameHeader).not.toHaveClass("text-right");
  });
});

// B0 characterization: 空結果の EmptyState DOM 固定（意図的差分③）
// bare div → EmptyState 標準 UI に置換。title(h3) + description の 2 要素に分割される。
describe("ProductTable (B0 empty-state characterization)", () => {
  it("B0-daily-empty: grouped=[] のとき EmptyState の title と description が表示される", () => {
    render(
      <ProductTable
        grouped={[]}
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
        grandTotal={null}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "該当する売上明細がありません" }),
    ).toBeInTheDocument();
    expect(screen.getByText("日付や部門を変更してお試しください")).toBeInTheDocument();
  });
});

it("SC26 / REQ-501: manual is a neutral classification rather than a warning", () => {
  const item = makeMockItem({ source: "manual" });
  render(
    <ProductTable
      grouped={[
        {
          departmentId: 1,
          departmentName: "布",
          items: [item],
          subtotal: {
            department_id: 1,
            department_name: "布",
            count_points: 1,
            length_cm: 0,
            amount: 100,
          },
        },
      ]}
      sortBy={null}
      sortDir="asc"
      onSortChange={vi.fn()}
      grandTotal={null}
    />,
  );
  const badge = screen.getByText("手動");
  expect(badge).toHaveAttribute("data-variant", "secondary");
  expect(badge).toHaveClass("border-border");
  expect(badge).not.toHaveAttribute("data-tone");
  expect(badge).not.toHaveClass("bg-warning-soft");
  expect(badge).not.toHaveClass("text-warning-strong");
});

// REQ-501 / SPEC-UNIT-D3 の表の 2・3: 明細は数量を単位つき・単価は 1 m あたり、小計と合計は点と長さの 2 本
describe("ProductTable の数量と単価（REQ-501 / SPEC-UNIT-D3）", () => {
  const cells = (name: RegExp) =>
    Array.from(screen.getByRole("row", { name }).querySelectorAll("td")).map(
      (cell) => cell.textContent,
    );

  it("REQ-501: m の商品は 1.3 m・¥700/m、個数の商品は 3 個・¥700、小計と合計は 5 点・1.8 m", () => {
    const items = [
      makeMockItem({ product_code: "M-1", stock_unit: "m", quantity: 130, amount: 910 }),
      makeMockItem({ product_code: "CM-1", stock_unit: "m", quantity: 50, amount: 350 }),
      makeMockItem({ product_code: "PCS-1", stock_unit: "pcs", quantity: 3, amount: 2100 }),
      makeMockItem({ product_code: "SHEET-1", stock_unit: "sheet", quantity: 2, amount: 400 }),
      makeMockItem({ product_code: "RET-1", stock_unit: "m", quantity: -130, amount: -910 }),
      makeMockItem({ product_code: "ZERO-1", stock_unit: "m", quantity: 0, amount: 0 }),
    ];
    render(
      <ProductTable
        grouped={[
          {
            departmentId: 1,
            departmentName: "布",
            items,
            subtotal: {
              department_id: 1,
              department_name: "布",
              count_points: 5,
              length_cm: 180,
              amount: 2850,
            },
          },
        ]}
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
        grandTotal={{ count_points: 1234, length_cm: 180, amount: 2850 }}
      />,
    );

    expect(cells(/^M-1/).slice(3)).toEqual(["1.3 m", "¥700/m", "¥910"]);
    expect(cells(/^CM-1/).slice(3)).toEqual(["0.5 m", "¥700/m", "¥350"]);
    expect(cells(/^PCS-1/).slice(3)).toEqual(["3 個", "¥700", "¥2,100"]);
    expect(cells(/^SHEET-1/).slice(3)).toEqual(["2 枚", "¥200", "¥400"]);
    expect(cells(/^RET-1/).slice(3)).toEqual(["-1.3 m", "¥700/m", "¥-910"]);
    expect(cells(/^ZERO-1/).slice(3)).toEqual(["0 m", "—", "¥0"]);
    expect(cells(/^布/)).toEqual(["布", "5 点・1.8 m", "", "¥2,850"]);
    expect(cells(/^合計/)).toEqual(["合計", "1,234 点・1.8 m", "", "¥2,850"]);
  });

  it("REQ-501: 個数の商品だけの部門は N 点、和が安全な整数を外れた小計は —", () => {
    const section = (departmentId: number, count_points: number | null, length_cm: number) => ({
      departmentId,
      departmentName: `部門${String(departmentId)}`,
      items: [makeMockItem({ product_code: `P-${String(departmentId)}` })],
      subtotal: {
        department_id: departmentId,
        department_name: `部門${String(departmentId)}`,
        count_points,
        length_cm,
        amount: 100,
      },
    });
    render(
      <ProductTable
        grouped={[section(1, 5, 0), section(2, 0, 130), section(3, null, 0)]}
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
        grandTotal={{ count_points: 0, length_cm: 0, amount: 0 }}
      />,
    );
    expect(cells(/^部門1/)[1]).toBe("5 点");
    expect(cells(/^部門2/)[1]).toBe("1.3 m");
    expect(cells(/^部門3/)[1]).toBe("—");
    expect(cells(/^合計/)[1]).toBe("0 点");
  });
});
