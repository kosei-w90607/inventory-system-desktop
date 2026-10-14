// src/features/monthly-sales/components/DepartmentTable.test.tsx
//
// REQ-502 P2-2: DepartmentTable の SortableHeader 結線テスト (4 列: name/quantity/amount/
// prev_month_diff の click → onSortChange call、aria-sort 属性 active 検証、
// 構成比列はソート対象外)。数量の列は点と長さの 2 本を出し、`(count_points, length_cm)` の
// 順に並べ替えられる（SPEC-UNIT-D3 の集計の規則）。
// 設計: docs/plans/2026-05-19-pr-66-codex-r1-p2-fixes.md §2 commit 2

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

import { DepartmentTable } from "./DepartmentTable";
import { sortMonthlyItems } from "../lib/sort-items";
import { makeMockDeptCompositionRow } from "../lib/test-fixtures";
import type { SortColumn } from "../types";

const EXPECTED_DEPARTMENT_SORT_HEADERS = [
  { value: "name", label: "部門" },
  { value: "quantity", label: "数量" },
  { value: "amount", label: "売上" },
  { value: "prev_month_diff", label: "前月比" },
] as const;

const sampleRows = [
  makeMockDeptCompositionRow({ key: "1", label: "毛糸", amount: 5000, ratio: 0.5 }),
  makeMockDeptCompositionRow({ key: "2", label: "布", amount: 3000, ratio: 0.3 }),
];

// B0 characterization: 空結果の EmptyState DOM 固定（意図的差分③）
// bare div → EmptyState 標準 UI に置換。title(h3) + description の 2 要素に分割される。
// plan B0 reachability 注記: page 経由（MonthlySalesPage の query empty mock）では
// page が先に月度メッセージを出すため、このテーブル内空分岐には到達不能。
// 必ず rows=[] の直接 render で characterization する（R3 P2-B）。
describe("DepartmentTable (B0 empty-state characterization)", () => {
  it("B0-dept-empty: rows=[] のとき EmptyState の title と description が表示される", () => {
    render(
      <DepartmentTable
        rows={[]}
        comparisonMap={new Map()}
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("heading", { name: "該当する売上明細がありません" }),
    ).toBeInTheDocument();
    expect(screen.getByText("月や部門を変更してお試しください")).toBeInTheDocument();
  });
});

describe("DepartmentTable (REQ-502 sort 結線)", () => {
  it("REQ-502: SortableHeader 4 列 click で onSortChange が name/quantity/amount/prev_month_diff を順に call、構成比列はソート対象外", () => {
    const onSortChange = vi.fn<(column: SortColumn) => void>();
    render(
      <DepartmentTable
        rows={sampleRows}
        comparisonMap={new Map()}
        sortBy={null}
        sortDir="asc"
        onSortChange={onSortChange}
      />,
    );

    for (const { label } of EXPECTED_DEPARTMENT_SORT_HEADERS) {
      fireEvent.click(screen.getByRole("button", { name: label }));
    }

    expect(onSortChange).toHaveBeenCalledTimes(EXPECTED_DEPARTMENT_SORT_HEADERS.length);
    EXPECTED_DEPARTMENT_SORT_HEADERS.forEach(({ value }, index) => {
      expect(onSortChange).toHaveBeenNthCalledWith(index + 1, value);
    });
    // 構成比列はソート対象外 = button ではなく plain TableHead
    expect(screen.queryByRole("button", { name: /構成比/ })).toBeNull();
  });

  it("REQ-502: aria-sort 属性は active 列のみ ascending/descending、他列は none", () => {
    render(
      <DepartmentTable
        rows={sampleRows}
        comparisonMap={new Map()}
        sortBy="amount"
        sortDir="desc"
        onSortChange={vi.fn()}
      />,
    );
    const headers = screen.getAllByRole("columnheader");
    const amountHeader = headers.find((h) => h.textContent?.includes("売上"));
    const nameHeader = headers.find((h) => h.textContent?.includes("部門"));
    const ratioHeader = headers.find((h) => h.textContent?.includes("構成比"));
    expect(amountHeader?.getAttribute("aria-sort")).toBe("descending");
    expect(nameHeader?.getAttribute("aria-sort")).toBe("none");
    expect(amountHeader).toHaveClass("text-right");
    expect(nameHeader).not.toHaveClass("text-right");
    const amountButton = screen.getByRole("button", { name: "売上" });
    const amountIndicator = amountButton.querySelector('span[aria-hidden="true"]');
    expect(amountIndicator).toHaveTextContent("▼");
    expect(screen.getByRole("button", { name: "部門" })).not.toHaveTextContent(/[▲▼]/);
    expect(amountButton).toHaveAttribute("type", "button");
    expect(amountButton).toHaveAttribute("data-variant", "ghost");
    expect(amountButton).toHaveAttribute("data-size", "sm");
    expect(amountButton).toHaveClass(
      "-mx-3",
      "h-auto",
      "gap-1",
      "px-3",
      "py-0",
      "font-medium",
      "hover:bg-transparent",
      "hover:text-foreground",
    );
    // 構成比列はソート対象外、aria-sort は null or "none" のいずれか (実装依存だが破綻しないこと)
    expect(["none", null]).toContain(ratioHeader?.getAttribute("aria-sort") ?? null);
  });

  it("REQ-502: sortBy='quantity'（URL `?sortBy=quantity&mode=by_department`）は (count_points, length_cm) の順に並び、表が壊れない", () => {
    // 部門別の行が数量（点と長さの 2 本）を持つので、数量の列は並べ替えの対象になる。
    // page（hook）が並べた行を表がその順で出すことを、同じ sort 関数を通して確かめる。
    const rows = sortMonthlyItems(
      [
        makeMockDeptCompositionRow({ key: "1", label: "毛糸", count_points: 5, length_cm: 250 }),
        makeMockDeptCompositionRow({ key: "2", label: "布", count_points: 3, length_cm: 0 }),
        makeMockDeptCompositionRow({ key: "3", label: "反物", count_points: 0, length_cm: 130 }),
      ],
      "quantity",
      "asc",
    );
    render(
      <DepartmentTable
        rows={rows}
        comparisonMap={new Map()}
        sortBy="quantity"
        sortDir="asc"
        onSortChange={vi.fn()}
      />,
    );
    const bodyRows = screen.getAllByRole("row").slice(1);
    expect(bodyRows.map((row) => row.querySelector("td")?.textContent)).toEqual([
      "反物",
      "布",
      "毛糸",
    ]);
    const quantityHeader = screen.getByRole("button", { name: "数量" }).closest("th");
    expect(quantityHeader).toHaveAttribute("aria-sort", "ascending");
  });

  it("REQ-502: 数量の列は部門ごとの点と長さの 2 本を出す（5 列: 部門・数量・売上・構成比・前月比）", () => {
    render(
      <DepartmentTable
        rows={[
          makeMockDeptCompositionRow({ key: "1", label: "毛糸", count_points: 5, length_cm: 250 }),
          makeMockDeptCompositionRow({ key: "2", label: "布", count_points: 3, length_cm: 0 }),
          makeMockDeptCompositionRow({ key: "3", label: "反物", count_points: 0, length_cm: 130 }),
          makeMockDeptCompositionRow({ key: "4", label: "相殺", count_points: 0, length_cm: 0 }),
          makeMockDeptCompositionRow({ key: "5", label: "大口", count_points: 1234, length_cm: 0 }),
        ]}
        comparisonMap={new Map()}
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
      />,
    );
    expect(screen.getAllByRole("columnheader").map((header) => header.textContent?.trim())).toEqual(
      ["部門", "数量", "売上", "構成比", "前月比"],
    );
    const quantities = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => row.querySelectorAll("td")[1].textContent);
    expect(quantities).toEqual(["5 点・2.5 m", "3 点", "1.3 m", "0 点", "1,234 点"]);
  });
});

// SPEC-COLOR-EMPHASIS-RT-1: 構成比の棒はふつう・補足（D-CE4）。前月比は地の無い役割色の文字 +
// 記号（D-CE9、±1.0% の閾値は不変）。
describe("DepartmentTable (REQ-502 色と強調)", () => {
  const cmp = (ratio: number | null, isComparable = true) => ({
    prevAmount: isComparable ? 1000 : null,
    diff: ratio === null ? null : ratio * 1000,
    ratio,
    isComparable,
  });

  it("REQ-502 D-CE4: the composition ratio bar uses the neutral muted color, not the ongoing color", () => {
    const { container } = render(
      <DepartmentTable
        rows={sampleRows}
        comparisonMap={new Map()}
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
      />,
    );
    const bars = container.querySelectorAll('[data-slot="progress-indicator"]');
    expect(bars).toHaveLength(2);
    for (const bar of bars) {
      expect(bar).toHaveClass("bg-muted-foreground");
      expect(bar).not.toHaveClass("bg-ongoing");
    }
  });

  it("REQ-502 D-CE9: month-over-month shows role-colored text without a soft chip at the ±1.0% boundary", () => {
    const rows = [
      makeMockDeptCompositionRow({ key: "up", label: "増", amount: 1, ratio: 0.25 }),
      makeMockDeptCompositionRow({ key: "down", label: "減", amount: 1, ratio: 0.25 }),
      makeMockDeptCompositionRow({ key: "flat", label: "横", amount: 1, ratio: 0.25 }),
      makeMockDeptCompositionRow({ key: "na", label: "無", amount: 1, ratio: 0.25 }),
    ];
    render(
      <DepartmentTable
        rows={rows}
        comparisonMap={
          new Map([
            ["up", cmp(0.01)],
            ["down", cmp(-0.01)],
            ["flat", cmp(0)],
            ["na", cmp(null, false)],
          ])
        }
        sortBy={null}
        sortDir="asc"
        onSortChange={vi.fn()}
      />,
    );
    const up = screen.getByText("+1.0%");
    const down = screen.getByText("-1.0%");
    const flat = screen.getByText("+0.0%");
    const na = screen.getByText("—");
    expect(up).toHaveClass("text-success-strong", "text-sm");
    expect(down).toHaveClass("text-destructive-strong", "text-sm");
    expect(flat).toHaveClass("text-muted-foreground");
    expect(na).toHaveClass("text-muted-foreground");
    for (const cell of [up, down, flat, na]) {
      expect(cell.className.split(/\s+/).filter((c) => c.startsWith("bg-"))).toEqual([]);
    }
  });
});
