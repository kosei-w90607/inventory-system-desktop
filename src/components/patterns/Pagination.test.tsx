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
  it("page 11 of perPage 100 total 1234 → 1,001〜1,100 件を表示", () => {
    render(<Pagination page={11} perPage={100} totalCount={1234} onPageChange={vi.fn()} />);
    expect(
      screen.getByText("全 1,234 件のうち 1,001〜1,100 件を表示（11 / 13 ページ）"),
    ).toBeInTheDocument();
  });

  it("page 13（最終ページ、端数）of perPage 100 total 1234 → 1,201〜1,234 件を表示（to は clamp）", () => {
    render(<Pagination page={13} perPage={100} totalCount={1234} onPageChange={vi.fn()} />);
    expect(
      screen.getByText("全 1,234 件のうち 1,201〜1,234 件を表示（13 / 13 ページ）"),
    ).toBeInTheDocument();
  });

  it("page 3 of perPage 50 total 101（最終ページ 1 件のみ）→ 101〜101 件を表示", () => {
    render(<Pagination page={3} perPage={50} totalCount={101} onPageChange={vi.fn()} />);
    expect(
      screen.getByText("全 101 件のうち 101〜101 件を表示（3 / 3 ページ）"),
    ).toBeInTheDocument();
  });
});

describe("SC3b/SC1a: Pagination の totalPages<=1 契約（AC2、S2 で仕様変更: 0 件は null）", () => {
  it("totalCount 0 のとき何も描画しない（旧: 「0 件」表示 → 新: null、S2）", () => {
    const { container } = render(
      <Pagination page={1} perPage={50} totalCount={0} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });
});

describe("SC1a/SC1b: Pagination totalPages<=1 null 化の対照 oracle", () => {
  it("SC1a: totalPages 1（totalCount<=perPage）のとき null を描画する", () => {
    const { container } = render(
      <Pagination page={1} perPage={50} totalCount={30} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("SC1b: totalPages>1 のときは従来どおり summary + 前へ/次へ を描画する（空集合 oracle 対）", () => {
    render(<Pagination page={1} perPage={50} totalCount={101} onPageChange={vi.fn()} />);
    expect(screen.getByText("全 101 件のうち 1〜50 件を表示（1 / 3 ページ）")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "前のページ" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "次のページ" })).toBeInTheDocument();
  });
});

describe("SC1c: 51 件 / perPage 50 の 2 ページ目 edge", () => {
  it("2 ページ目（最終ページ）で「前へ」が有効表示される", () => {
    render(<Pagination page={2} perPage={50} totalCount={51} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "前のページ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "次のページ" })).toBeDisabled();
  });

  it("page > totalPages では pager を描画し 前へ が有効（範囲外 page の pre-lane 挙動を維持）", () => {
    render(<Pagination page={5} perPage={50} totalCount={3} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "前のページ" })).toBeEnabled();
  });
});

describe("SC2/SC3c: PaginationSummary is text-only, text-sm text-muted-foreground (S2)", () => {
  it("同じ範囲付き文言を text のみで描画し button を含まない", () => {
    render(<PaginationSummary page={11} perPage={100} totalCount={1234} />);
    const text = screen.getByText("全 1,234 件のうち 1,001〜1,100 件を表示（11 / 13 ページ）");
    expect(text).toBeInTheDocument();
    expect(text).toHaveClass("text-sm", "text-muted-foreground", "tabular-nums");
    expect(text).not.toHaveClass("text-base", "text-foreground");
    expect(text).not.toHaveClass("font-semibold");
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("totalCount 0 のとき「0 件」のみ（PaginationSummary 自体はゲートしない、L4-D9 keep）", () => {
    render(<PaginationSummary page={1} perPage={50} totalCount={0} />);
    expect(screen.getByText("0 件")).toBeInTheDocument();
  });
});
