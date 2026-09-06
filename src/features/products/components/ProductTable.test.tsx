// src/features/products/components/ProductTable.test.tsx
//
// UI-01a-D6: 単位付き在庫表示と廃番状態の非色シグナル。

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { render, screen, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";

import { makeMockProductWithRelations } from "../lib/test-fixtures";
import { ProductTable } from "./ProductTable";

const REPO_ROOT = join(__dirname, "../../../..");
const PRODUCT_TABLE_SOURCE = readFileSync(
  join(REPO_ROOT, "src/features/products/components/ProductTable.tsx"),
  "utf8",
);
const DISPOSAL_PAGE_SOURCE = readFileSync(
  join(REPO_ROOT, "src/features/disposal/DisposalPage.tsx"),
  "utf8",
);
const INVENTORY_RECORDS_PAGE_SOURCE = readFileSync(
  join(REPO_ROOT, "src/features/inventory-records/InventoryRecordsPage.tsx"),
  "utf8",
);
const RECEIVING_PAGE_SOURCE = readFileSync(
  join(REPO_ROOT, "src/features/receiving/ReceivingPage.tsx"),
  "utf8",
);
const INTEGRITY_CHECK_PAGE_SOURCE = readFileSync(
  join(REPO_ROOT, "src/features/integrity-check/IntegrityCheckPage.tsx"),
  "utf8",
);

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

describe("ProductTable (UI-01a-D6 / UI-01a-D8)", () => {
  it("REQ-907 B-V1: shows the independent PLU column with three text and icon states", () => {
    render(
      <ProductTable
        items={[
          makeMockProductWithRelations({
            product_code: "PLU-0",
            plu_target: false,
            plu_dirty: false,
          }),
          makeMockProductWithRelations({
            product_code: "PLU-1",
            plu_target: true,
            plu_dirty: true,
          }),
          makeMockProductWithRelations({
            product_code: "PLU-2",
            plu_target: true,
            plu_dirty: false,
          }),
        ]}
      />,
    );
    expect(screen.getByRole("columnheader", { name: "PLU" })).toBeInTheDocument();
    for (const [code, label] of [
      ["PLU-0", "対象外"],
      ["PLU-1", "未反映"],
      ["PLU-2", "反映済み"],
    ] as const) {
      const row = screen.getByText(code).closest("tr");
      if (row === null) throw new Error("row not found");
      expect(within(row).getByText(label)).toBeInTheDocument();
      expect(row.querySelector("svg[aria-hidden='true']")).not.toBeNull();
      expect(row.className).not.toContain("text-muted-foreground");
    }
  });

  it("discontinued text badge and no state column", () => {
    render(
      <ProductTable
        items={[
          makeMockProductWithRelations({
            product_code: "F-0001",
            name: "生成り布",
            stock_quantity: 350,
            stock_unit: "cm",
            is_discontinued: true,
          }),
        ]}
      />,
    );

    const row = screen.getByText("F-0001").closest("tr");
    if (row === null) throw new Error("row not found");

    expect(within(row).getByText("350 cm")).toBeInTheDocument();
    // UI-01a-D8: 廃番は商品名セル内の text badge で示す（専用状態列なし）
    expect(within(row).getByText("廃番")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "状態" })).not.toBeInTheDocument();
    expect(screen.queryByText("cm/m切替")).not.toBeInTheDocument();
  });

  it("active product has no badge and no muted row", () => {
    render(
      <ProductTable
        items={[
          makeMockProductWithRelations({
            product_code: "P-100",
            name: "はさみ",
            is_discontinued: false,
          }),
        ]}
      />,
    );

    const row = screen.getByText("P-100").closest("tr");
    if (row === null) throw new Error("row not found");

    expect(within(row).queryByText("廃番")).not.toBeInTheDocument();
    expect(within(row).queryByText("表示中")).not.toBeInTheDocument();
    expect(row.className).not.toContain("text-muted-foreground");
  });

  it("GA3a-1: product code td's inner div carries w-32/whitespace-normal/break-all; outer td carries min-w-36 (belt), no w-28", () => {
    render(<ProductTable items={[makeMockProductWithRelations({ product_code: "P-090" })]} />);
    const cell = screen.getByText("P-090").closest("td");
    if (cell === null) throw new Error("cell not found");
    const cellTokens = cell.className.split(/\s+/);
    expect(cellTokens).toContain("min-w-36");
    expect(cellTokens).not.toContain("w-28");
    expect(cellTokens).not.toContain("max-w-36");
    const wrapper = screen.getByText("P-090");
    const wrapperTokens = wrapper.className.split(/\s+/);
    expect(wrapperTokens).toContain("w-32");
    expect(wrapperTokens).toContain("whitespace-normal");
    expect(wrapperTokens).toContain("break-all");
  });

  it("GA3a-4: w-28 消滅チェックは ProductTable.tsx に限定され、他 4 file の正当な w-28 は残る（空集合 oracle 衝突の回避、対 oracle）", () => {
    expect(PRODUCT_TABLE_SOURCE).not.toContain("w-28");
    expect(DISPOSAL_PAGE_SOURCE).toContain("w-28");
    expect(INVENTORY_RECORDS_PAGE_SOURCE).toContain("w-28");
    expect(RECEIVING_PAGE_SOURCE).toContain("w-28");
    expect(INTEGRITY_CHECK_PAGE_SOURCE).toContain("w-28");
  });

  it("GA3a-1: product code th's inner div carries w-32; outer th carries min-w-36 (belt), no max-w-36", () => {
    render(<ProductTable items={[makeMockProductWithRelations({ product_code: "P-090" })]} />);
    const headerCell = screen.getByText("商品コード").closest("th");
    if (headerCell === null) throw new Error("header cell not found");
    const headerCellTokens = headerCell.className.split(/\s+/);
    expect(headerCellTokens).toContain("min-w-36");
    expect(headerCellTokens).not.toContain("max-w-36");
    const headerWrapperTokens = screen.getByText("商品コード").className.split(/\s+/);
    expect(headerWrapperTokens).toContain("w-32");
  });

  it("REQ-105 UI-01a-D13 places cost immediately after selling price and renders the value", () => {
    render(
      <ProductTable
        items={[
          makeMockProductWithRelations({
            product_code: "PRICE-001",
            selling_price: 1234,
            cost_price: 567,
          }),
        ]}
      />,
    );
    const headers = screen.getAllByRole("columnheader").map((header) => header.textContent);
    expect(headers).toEqual([
      "商品コード",
      "商品名",
      "部門",
      "売価",
      "原価",
      "在庫数",
      "PLU",
      "操作",
    ]);
    const row = screen.getByText("PRICE-001").closest("tr");
    if (row === null) throw new Error("row not found");
    expect(within(row).getByText("￥567")).toBeInTheDocument();
  });

  it("SC16 (Gated Amendment 6 S45): renders stock quantity with the Japanese unit label, no raw unit code", () => {
    render(
      <ProductTable
        items={[
          makeMockProductWithRelations({
            product_code: "UNIT-001",
            stock_quantity: 18,
            stock_unit: "pcs",
          }),
        ]}
      />,
    );
    const row = screen.getByText("UNIT-001").closest("tr");
    if (row === null) throw new Error("row not found");
    expect(within(row).getByText("18 個")).toBeInTheDocument();
    expect(within(row).queryByText(/pcs/)).not.toBeInTheDocument();
  });
});
