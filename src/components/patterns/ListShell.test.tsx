// src/components/patterns/ListShell.test.tsx
//
// SC4a〜SC4e: 一覧の器（catalog ⑯、D-2 / D-5）の契約 test。
// Plan Packet: docs/plans/2026-09-03-ui-list-backbone-d-lane2.md S4
// Test Design Matrix: docs/plans/test-matrices/2026-09-03-ui-list-backbone-d-lane2.md SC4a〜SC4e

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ListShell } from "./ListShell";

function SampleTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>列</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>行1</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>行2</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

const pagination = (totalCount: number) => ({
  page: 1,
  perPage: 10,
  totalCount,
  onPageChange: vi.fn(),
});

describe("SC4a: toolbar box", () => {
  it("wraps toolbar and toolbarSecondary in one rounded-lg border bg-card p-4 box as two rows", () => {
    const { container } = render(
      <ListShell toolbar={<div>検索行</div>} toolbarSecondary={<div>並び替え行</div>}>
        <div>content</div>
      </ListShell>,
    );
    const box = container.querySelector(".rounded-lg.border.bg-card.p-4");
    expect(box).not.toBeNull();
    expect(box).toHaveClass("rounded-lg", "border", "bg-card", "p-4");
    expect(box).toContainElement(screen.getByText("検索行"));
    expect(box).toContainElement(screen.getByText("並び替え行"));
  });

  it("renders no box when toolbar is omitted", () => {
    const { container } = render(
      <ListShell>
        <div>content</div>
      </ListShell>,
    );
    expect(container.querySelector(".rounded-lg.border.bg-card.p-4")).toBeNull();
  });
});

describe("SC4b: topSummary + totalCount > 0 gating", () => {
  it("renders PaginationSummary above the table only when topSummary is true and totalCount > 0", () => {
    const { container } = render(
      <ListShell topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    // PaginationSummary（上部）は text-base font-semibold で一意に特定できる
    // （下部 Pagination の同文言は text-sm text-muted-foreground 内の tabular-nums div）。
    const summary = container.querySelector(".text-base.font-semibold");
    const table = screen.getByText("列").closest("table");
    expect(summary).not.toBeNull();
    expect(table).not.toBeNull();
    if (summary === null || table === null) {
      throw new Error("unreachable: asserted not null above");
    }
    expect(summary).toHaveTextContent("25 件中 1〜10 件目 · 1 / 3 ページ");
    expect(summary.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not render the summary when topSummary is omitted (defaults false)", () => {
    const { container } = render(
      <ListShell pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    expect(container.querySelector(".text-base.font-semibold")).toBeNull();
  });

  it("renders neither summary nor bottom pager when totalCount is 0", () => {
    render(
      <ListShell topSummary pagination={pagination(0)}>
        <SampleTable />
      </ListShell>,
    );
    expect(screen.queryByText(/件/)).toBeNull();
    expect(screen.queryByRole("button", { name: "前のページ" })).toBeNull();
    expect(screen.queryByRole("button", { name: "次のページ" })).toBeNull();
  });

  it("renders the bottom pager when totalCount > 0 even without topSummary", () => {
    render(
      <ListShell pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    expect(screen.getByRole("button", { name: "次のページ" })).toBeInTheDocument();
  });
});

describe("SC4c: skeleton while isLoading", () => {
  it("renders ListSkeleton instead of children while isLoading", () => {
    render(
      <ListShell isLoading>
        <div data-testid="real-content">content</div>
      </ListShell>,
    );
    expect(screen.queryByTestId("real-content")).toBeNull();
    expect(screen.getByLabelText("一覧を読み込み中")).toBeInTheDocument();
  });

  it("renders a given skeleton override instead of the default ListSkeleton", () => {
    render(
      <ListShell isLoading skeleton={<div data-testid="custom-skeleton" />}>
        <div data-testid="real-content">content</div>
      </ListShell>,
    );
    expect(screen.getByTestId("custom-skeleton")).toBeInTheDocument();
    expect(screen.queryByTestId("real-content")).toBeNull();
    expect(screen.queryByLabelText("一覧を読み込み中")).toBeNull();
  });

  it("renders children when isLoading is false", () => {
    render(
      <ListShell>
        <div data-testid="real-content">content</div>
      </ListShell>,
    );
    expect(screen.getByTestId("real-content")).toBeInTheDocument();
  });
});

describe("SC4d: sticky band (summary + th) + cell 罫線 + overflow 上書き", () => {
  it("applies sticky/border/overflow classes via ListShell root when stickyHeader is true and the summary band is rendered", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );

    // summary band 自体（ListShell が直接描画する要素）は実クラスで検証する。
    const summaryBand = container.querySelector(".sticky.top-0.z-20");
    expect(summaryBand).not.toBeNull();
    expect(summaryBand).toHaveClass(
      "sticky",
      "top-0",
      "z-20",
      "flex",
      "h-10",
      "items-center",
      "whitespace-nowrap",
      "overflow-hidden",
      "bg-muted",
    );

    // table 内部（th / td / table-container / table）への上書きは caller の
    // children（Table primitive）に className を渡さず、ListShell root の
    // descendant variant（`[&_...]:`）のみで行う契約（D-2）。実 CSS カスケードは
    // happy-dom では計算されないため、root の class 文字列に token が載っている
    // ことをオラクルとする。
    const root = container.firstElementChild;
    const rootClass = root?.className ?? "";
    expect(rootClass).toContain("[&_thead_th]:sticky");
    expect(rootClass).toContain("[&_thead_th]:z-10");
    expect(rootClass).toContain("[&_thead_th]:bg-muted");
    expect(rootClass).toContain("[&_thead_th]:border-b-2");
    expect(rootClass).toContain("[&_thead_th]:border-border");
    expect(rootClass).toContain("[&_thead_th]:top-10");
    expect(rootClass).toContain("[&_[data-slot=table-container]]:overflow-visible");
    expect(rootClass).toContain("[&_[data-slot=table]]:border-separate");
    expect(rootClass).toContain("[&_[data-slot=table]]:border-spacing-0");
    expect(rootClass).toContain("[&_tbody_td]:border-b");
    expect(rootClass).toContain("[&_tbody_td]:border-border");
    expect(rootClass).toContain("[&_tbody_tr:last-child_td]:border-b-0");

    // children 側の Table には className が渡っていないこと（caller className 方式への逸脱防止）。
    const th = container.querySelector("thead th");
    const table = container.querySelector('[data-slot="table"]');
    const tableContainer = container.querySelector('[data-slot="table-container"]');
    expect(th?.className).not.toMatch(/\bsticky\b/);
    expect(table?.className).not.toMatch(/\bborder-separate\b/);
    expect(tableContainer?.className).not.toMatch(/\boverflow-visible\b/);
  });

  it("uses top-0 on th when the summary band is not rendered (topSummary false)", () => {
    const { container } = render(
      <ListShell stickyHeader pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const root = container.firstElementChild;
    expect(root?.className ?? "").toContain("[&_thead_th]:top-0");
    expect(root?.className ?? "").not.toContain("[&_thead_th]:top-10");
  });

  it("applies none of the sticky/border/overflow classes when stickyHeader is false", () => {
    const { container } = render(
      <ListShell topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const root = container.firstElementChild;
    const rootClass = root?.className ?? "";
    expect(rootClass).not.toContain("[&_thead_th]:sticky");
    expect(rootClass).not.toContain("[&_thead_th]:border-b-2");
    expect(rootClass).not.toContain("[&_[data-slot=table-container]]:overflow-visible");
    expect(rootClass).not.toContain("[&_[data-slot=table]]:border-separate");
    const th = container.querySelector("thead th");
    const tableContainer = container.querySelector('[data-slot="table-container"]');
    const table = container.querySelector('[data-slot="table"]');
    expect(th?.className).not.toContain("sticky");
    expect(th?.className).not.toContain("border-b-2");
    expect(tableContainer?.className).not.toContain("overflow-visible");
    expect(table?.className).not.toContain("border-separate");
    const summaryBand = container.querySelector(".sticky");
    expect(summaryBand).toBeNull();
  });
});

describe("SC4e: bottom pager onPageChange wiring", () => {
  it("clicking 次のページ calls pagination.onPageChange with page+1", async () => {
    const onPageChange = vi.fn();
    render(
      <ListShell pagination={{ page: 1, perPage: 10, totalCount: 25, onPageChange }}>
        <SampleTable />
      </ListShell>,
    );
    await userEvent.setup().click(screen.getByRole("button", { name: "次のページ" }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });
});

describe("identityColumns: reserved prop with no rendering effect", () => {
  it("has no effect on rendered output", () => {
    const { container: withProp } = render(
      <ListShell identityColumns={2}>
        <div>x</div>
      </ListShell>,
    );
    const { container: withoutProp } = render(
      <ListShell>
        <div>x</div>
      </ListShell>,
    );
    expect(withProp.innerHTML).toBe(withoutProp.innerHTML);
  });
});
