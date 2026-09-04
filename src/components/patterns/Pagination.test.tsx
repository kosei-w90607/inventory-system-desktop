// src/components/patterns/Pagination.test.tsx
//
// D-3 / D-4 / D-9: 範囲付き文言のページ送り（下部 Pagination）+ text-only の上部
// PaginationSummary。旧 ProductPagination（UI-01a-D4）の移設先。
// Plan Packet: docs/plans/2026-09-03-ui-list-backbone-d-lane2.md S3
// Test Design Matrix: docs/plans/test-matrices/2026-09-03-ui-list-backbone-d-lane2.md SC3a〜c

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { Pagination, PaginationSummary } from "./Pagination";

describe("Pagination (UI-01a-D4 移設)", () => {
  it("disables previous on first page and computes total pages", () => {
    render(<Pagination page={1} perPage={50} totalCount={101} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "前のページ" })).toBeDisabled();
    expect(screen.getByText("1 / 3 ページ")).toBeInTheDocument();
  });

  it("emits next page while preserving filters in caller", async () => {
    const onPageChange = vi.fn();
    const user = userEvent.setup();
    render(<Pagination page={2} perPage={50} totalCount={151} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "次のページ" }));

    expect(onPageChange).toHaveBeenCalledWith(3);
  });
});

describe("SC3a: Pagination shows range-qualified count text", () => {
  it("page 11 of perPage 100 total 1234 → 1,001〜1,100 件目", () => {
    render(<Pagination page={11} perPage={100} totalCount={1234} onPageChange={vi.fn()} />);
    expect(screen.getByText("1,234 件中 1,001〜1,100 件目 · 11 / 13 ページ")).toBeInTheDocument();
  });

  it("page 13（最終ページ、端数）of perPage 100 total 1234 → 1,201〜1,234 件目（to は clamp）", () => {
    render(<Pagination page={13} perPage={100} totalCount={1234} onPageChange={vi.fn()} />);
    expect(screen.getByText("1,234 件中 1,201〜1,234 件目 · 13 / 13 ページ")).toBeInTheDocument();
  });

  it("page 3 of perPage 50 total 101（最終ページ 1 件のみ）→ 101〜101 件目", () => {
    render(<Pagination page={3} perPage={50} totalCount={101} onPageChange={vi.fn()} />);
    expect(screen.getByText("101 件中 101〜101 件目 · 3 / 3 ページ")).toBeInTheDocument();
  });
});

describe("SC3b: Pagination の 0 件契約", () => {
  it("totalCount 0 のとき「0 件」のみを表示し前後ボタンは両方 disabled", () => {
    render(<Pagination page={1} perPage={50} totalCount={0} onPageChange={vi.fn()} />);
    expect(screen.getByText("0 件")).toBeInTheDocument();
    expect(screen.queryByText(/件目/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "前のページ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "次のページ" })).toBeDisabled();
  });
});

describe("SC3c: PaginationSummary is text-only with 16px semibold typography", () => {
  it("同じ範囲付き文言を text のみで描画し button を含まない", () => {
    render(<PaginationSummary page={11} perPage={100} totalCount={1234} />);
    const text = screen.getByText("1,234 件中 1,001〜1,100 件目 · 11 / 13 ページ");
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass("text-base", "font-semibold", "tabular-nums");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("totalCount 0 のとき「0 件」のみ", () => {
    render(<PaginationSummary page={1} perPage={50} totalCount={0} />);
    expect(screen.getByText("0 件")).toBeInTheDocument();
  });
});
