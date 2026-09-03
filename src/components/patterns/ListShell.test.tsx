// src/components/patterns/ListShell.test.tsx
//
// SC4a〜SC4e: 一覧の器（catalog ⑯、D-2 / D-5）の契約 test。Lane 2 時点の唯一の実採用画面は
// 商品一覧（UI-01a pilot、ProductListPage.tsx）。
// 共有部品の contract test。traceability 上は Lane 2 pilot = UI-01a へ紐付け（Gated Amendment 1）。
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

// Final Review round 1 P1（Sonnet mutation 独立再実測 X16 survivor 是正）: class 属性の
// 部分文字列一致（`toContain` on a raw string）は "[&_tbody_td]:border-b" が
// "[&_tbody_td]:border-border" の前方一致になり X16（td の border-b 削除）を素通りさせた。
// class 属性を空白区切りトークンへ分解し、配列の完全一致（`toContain` on an array）で
// 検証することでトークン単位の存在確認にする。
function classTokens(el: Element | null | undefined): string[] {
  return (el?.className ?? "").split(/\s+/).filter(Boolean);
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
    const tokens = classTokens(box);
    expect(tokens).toContain("rounded-lg");
    expect(tokens).toContain("border");
    expect(tokens).toContain("bg-card");
    expect(tokens).toContain("p-4");
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
    const summaryTokens = classTokens(summary);
    expect(summaryTokens).toContain("text-base");
    expect(summaryTokens).toContain("font-semibold");
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

    // summary band 自体（ListShell が直接描画する要素）は実クラスで検証する（token 完全一致）。
    const summaryBand = container.querySelector(".sticky.top-0.z-20");
    expect(summaryBand).not.toBeNull();
    const bandTokens = classTokens(summaryBand);
    expect(bandTokens).toContain("sticky");
    expect(bandTokens).toContain("top-0");
    expect(bandTokens).toContain("z-20");
    expect(bandTokens).toContain("flex");
    expect(bandTokens).toContain("h-10");
    expect(bandTokens).toContain("items-center");
    expect(bandTokens).toContain("w-full");
    // Gated Amendment 2 S11（owner L3 FAIL-3）: summary 帯と thead を同一 surface
    // （--list-head）にし、bg-muted は残さない。
    expect(bandTokens).toContain("bg-list-head");
    expect(bandTokens).not.toContain("bg-muted");
    // Final Review round 1 P2（帯の文言が長いとき「…」で切れるようにする）:
    // truncate は overflow-hidden + text-ellipsis + whitespace-nowrap の shorthand。
    expect(bandTokens).toContain("truncate");

    // table 内部（th / td / table-container / table）への上書きは caller の
    // children（Table primitive）に className を渡さず、ListShell root の
    // descendant variant（`[&_...]:`）のみで行う契約（D-2）。実 CSS カスケードは
    // happy-dom では計算されないため、root の class トークン一覧に含まれることをオラクルとする。
    // Final Review round 1 P1（X16 survivor 是正）: 部分文字列一致（`rootClass.toContain(...)`）
    // は "[&_tbody_td]:border-b" が "[&_tbody_td]:border-border" に前方一致してしまうため、
    // トークン配列の完全一致（`classTokens(root).toContain(...)`）へ全面置換する。
    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens).toContain("[&_thead_th]:sticky");
    expect(rootTokens).toContain("[&_thead_th]:z-10");
    expect(rootTokens).toContain("[&_thead_th]:bg-list-head");
    expect(rootTokens).toContain("[&_thead_tr]:bg-list-head");
    expect(rootTokens).not.toContain("[&_thead_th]:bg-muted");
    expect(rootTokens).toContain("[&_thead_th]:border-b-2");
    expect(rootTokens).toContain("[&_thead_th]:border-border");
    expect(rootTokens).toContain("[&_thead_th]:top-10");
    expect(rootTokens).toContain("[&_[data-slot=table-container]]:overflow-visible");
    expect(rootTokens).toContain("[&_[data-slot=table]]:border-separate");
    expect(rootTokens).toContain("[&_[data-slot=table]]:border-spacing-0");
    expect(rootTokens).toContain("[&_tbody_td]:border-b");
    expect(rootTokens).toContain("[&_tbody_td]:border-border");
    expect(rootTokens).toContain("[&_tbody_tr:last-child_td]:border-b-0");

    // children 側の Table には className が渡っていないこと（caller className 方式への逸脱防止）。
    const th = container.querySelector("thead th");
    const table = container.querySelector('[data-slot="table"]');
    const tableContainer = container.querySelector('[data-slot="table-container"]');
    expect(classTokens(th)).not.toContain("sticky");
    expect(classTokens(table)).not.toContain("border-separate");
    expect(classTokens(tableContainer)).not.toContain("overflow-visible");
  });

  it("uses top-0 on th when the summary band is not rendered (topSummary false)", () => {
    const { container } = render(
      <ListShell stickyHeader pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens).toContain("[&_thead_th]:top-0");
    expect(rootTokens).not.toContain("[&_thead_th]:top-10");
  });

  it("applies none of the sticky/border/overflow classes when stickyHeader is false", () => {
    const { container } = render(
      <ListShell topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens).not.toContain("[&_thead_th]:sticky");
    expect(rootTokens).not.toContain("[&_thead_th]:border-b-2");
    expect(rootTokens).not.toContain("[&_thead_th]:border-b");
    expect(rootTokens).not.toContain("[&_thead_th]:border-border");
    expect(rootTokens).not.toContain("[&_thead_th]:bg-list-head");
    expect(rootTokens).not.toContain("[&_thead_tr]:bg-list-head");
    expect(rootTokens).not.toContain("[&_[data-slot=table-container]]:overflow-visible");
    expect(rootTokens).not.toContain("[&_[data-slot=table]]:border-separate");
    expect(rootTokens).not.toContain("[&_[data-slot=table]]:border-spacing-0");
    expect(rootTokens).not.toContain("[&_tbody_td]:border-b");
    expect(rootTokens).not.toContain("[&_tbody_td]:border-border");
    expect(rootTokens).not.toContain("[&_tbody_tr:last-child_td]:border-b-0");

    const th = container.querySelector("thead th");
    const tableContainer = container.querySelector('[data-slot="table-container"]');
    const table = container.querySelector('[data-slot="table"]');
    expect(classTokens(th)).not.toContain("sticky");
    expect(classTokens(th)).not.toContain("border-b-2");
    expect(classTokens(tableContainer)).not.toContain("overflow-visible");
    expect(classTokens(table)).not.toContain("border-separate");
    const summaryBand = container.querySelector(".sticky");
    expect(summaryBand).toBeNull();
  });
});

describe("SC8: sticky band surface uses --list-head, not bg-muted (Gated Amendment 2 S11 / owner L3 FAIL-3)", () => {
  it("applies bg-list-head to the summary band, thead th and thead tr; no bg-muted remains on them", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const summaryBand = container.querySelector(".sticky.top-0.z-20");
    const bandTokens = classTokens(summaryBand);
    expect(bandTokens).toContain("bg-list-head");
    expect(bandTokens).not.toContain("bg-muted");

    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens).toContain("[&_thead_th]:bg-list-head");
    expect(rootTokens).toContain("[&_thead_tr]:bg-list-head");
    expect(rootTokens).not.toContain("[&_thead_th]:bg-muted");
    expect(rootTokens).not.toContain("[&_thead_tr]:bg-muted");
  });
});

describe("SC10: 帯の隣接 + inset（Gated Amendment 3 S13、owner L3 run 2 FAIL / AC-L3-2）", () => {
  it("wraps the sticky summary band and the table together with px-2 inset, keeping root's space-y-3 outside the wrapper", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );

    const root = container.firstElementChild;
    expect(classTokens(root)).toContain("space-y-3");

    const summaryBand = container.querySelector(".sticky.top-0.z-20");
    expect(summaryBand).not.toBeNull();
    expect(classTokens(summaryBand)).toContain("px-2");

    const wrapper = summaryBand?.parentElement ?? null;
    expect(wrapper).not.toBeNull();
    expect(wrapper).not.toBe(root);
    const wrapperTokens = classTokens(wrapper);
    const spacingPrefixes = ["space-y-", "gap-", "mt-", "mb-", "pt-", "pb-"];
    expect(
      wrapperTokens.some((token) => spacingPrefixes.some((prefix) => token.startsWith(prefix))),
    ).toBe(false);

    const tableContainer = container.querySelector('[data-slot="table-container"]');
    expect(tableContainer).not.toBeNull();
    expect(summaryBand?.nextElementSibling).toBe(tableContainer);
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
