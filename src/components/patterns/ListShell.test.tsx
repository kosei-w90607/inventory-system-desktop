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
import { ListShell, PRODUCT_CODE_CELL_WRAPPER_WIDTH_CLASS } from "./ListShell";

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
    // PaginationSummary（上部、S2）は text-sm/text-muted-foreground/tabular-nums の
    // 3 class を 1 要素に同時に持つ点で一意に特定できる（下部 Pagination は
    // text-sm/text-muted-foreground を外側 div、tabular-nums を内側 div に分離する
    // ため 3 class 同時一致は上部のみ）。
    const summaries = container.querySelectorAll(".text-sm.text-muted-foreground.tabular-nums");
    expect(summaries).toHaveLength(1);
    const summary = summaries.item(0);
    const table = screen.getByText("列").closest("table");
    expect(summary).not.toBeNull();
    expect(table).not.toBeNull();
    if (table === null) {
      throw new Error("unreachable: asserted not null above");
    }
    const summaryTokens = classTokens(summary);
    expect(summaryTokens).toContain("text-sm");
    expect(summaryTokens).toContain("text-muted-foreground");
    expect(summaryTokens).not.toContain("text-base");
    expect(summaryTokens).not.toContain("font-semibold");
    expect(summary).toHaveTextContent("全 25 件のうち 1〜10 件を表示（1 / 3 ページ）");
    expect(summary.compareDocumentPosition(table) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("does not render the summary when topSummary is omitted (defaults false)", () => {
    const { container } = render(
      <ListShell pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    expect(container.querySelector(".text-sm.text-muted-foreground.tabular-nums")).toBeNull();
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
    // Lane 4 Gated Amendment 4 GA4a: 帯は box の外・root 直下へ移り sticky/top-0/left-0 を
    // 失う（`z-20`/`h-10` は不変のため代替 selector として一意に一致する）。
    const summaryBand = container.querySelector(".z-20.h-10");
    expect(summaryBand).not.toBeNull();
    const bandTokens = classTokens(summaryBand);
    expect(bandTokens).not.toContain("sticky");
    expect(bandTokens).not.toContain("top-0");
    expect(bandTokens).not.toContain("left-0");
    expect(bandTokens).toContain("mb-0!");
    expect(bandTokens).toContain("z-20");
    expect(bandTokens).toContain("flex");
    expect(bandTokens).toContain("h-10");
    expect(bandTokens).toContain("items-center");
    expect(bandTokens).toContain("w-full");
    // Gated Amendment 5 S39（owner run 4「灰色の塊に入れ込んだのがミス、角が角、
    // 下に線を引く程度」、AC-L3-2 の翻意）: 件数行は page 地色 + 1px 下線、
    // 灰色面（--list-head）は列見出しのみに限定する。
    expect(bandTokens).toContain("bg-background");
    expect(bandTokens).not.toContain("bg-list-head");
    expect(bandTokens).not.toContain("bg-muted");
    // 追補 S17（Opus P1-2 / P2-2 / P2-3、AC-L3-2 / AC-L3-4）: flex item の直接
    // truncate は min-width:auto により hard clip になるため、帯自体は overflow-hidden
    // にし、子（PaginationSummary root）を min-w-0 + truncate にして ellipsis させる。
    // Gated Amendment 7 S47（owner run 6「上端の線だけ外そう」）: 件数行の下線を撤去、
    // 帯は bg-background のみ（列見出し帯の上端に線が無い状態）。
    expect(bandTokens).toContain("overflow-hidden");
    expect(bandTokens).toContain("[&>div]:min-w-0");
    expect(bandTokens).toContain("[&>div]:truncate");
    expect(bandTokens).not.toContain("border-b");
    expect(bandTokens).not.toContain("border-border");
    expect(bandTokens).not.toContain("forced-colors:border-b");
    expect(bandTokens).not.toContain("truncate");

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
    // Gated Amendment 6 S43（owner run 5「列見出しの左右上を丸く」）で tr 背景を削除したが、
    // Gated Amendment 7 S48（owner run 6「最小幅で部門と売価の間に白い細線」）で復活。
    // border-separate + 最小幅の fractional layout で th 間に subpixel の seam が出るため塞ぐ。
    // 角丸は corner mask（globals.css の list-shell-sticky hook、SC17）で維持する。
    expect(rootTokens).toContain("[&_thead_tr]:bg-list-head");
    expect(rootTokens).toContain("[&_thead_th:first-child]:rounded-tl-md");
    expect(rootTokens).toContain("[&_thead_th:last-child]:rounded-tr-md");
    expect(rootTokens).not.toContain("[&_thead_th]:bg-muted");
    expect(rootTokens).toContain("[&_thead_th]:border-b-2");
    expect(rootTokens).toContain("[&_thead_th]:border-border");
    // Lane 4 Gated Amendment 4 GA4a-3: 帯が box の外に出たため box 内オフセットは
    // topSummary の有無に関わらず常に top-0。
    expect(rootTokens).toContain("[&_thead_th]:top-0");
    expect(rootTokens).not.toContain("[&_thead_th]:top-10");
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

  it("uses top-0 on th when the summary band is not rendered (topSummary false); GA4a-4: no band element and box never carries mt-0", () => {
    const { container } = render(
      <ListShell stickyHeader pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens).toContain("[&_thead_th]:top-0");
    expect(rootTokens).not.toContain("[&_thead_th]:top-10");
    // Lane 4 Gated Amendment 4 GA4a-4（負側 oracle）: topSummary false のとき帯は
    // 存在せず、box は却下済み代替案（box 側 mt-0 で隙間を相殺）への先祖返りを起こさない。
    expect(container.querySelector(".z-20.h-10")).toBeNull();
    const box = container.querySelector("[data-list-scroll-container]");
    expect(classTokens(box)).not.toContain("mt-0");
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
    expect(rootTokens).not.toContain("[&_thead_th:first-child]:rounded-tl-md");
    expect(rootTokens).not.toContain("[&_thead_th:last-child]:rounded-tr-md");
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
    // Lane 4 Gated Amendment 4 GA4a: 帯は sticky/top-0/left-0 を失うため .sticky は
    // stickyHeader true の場合でも vacuous に真になる（GA4a-1 参照）。.z-20.h-10 で判定する。
    const summaryBand = container.querySelector(".z-20.h-10");
    expect(summaryBand).toBeNull();
  });
});

describe("SC8: sticky band uses bg-background (no underline), thead keeps --list-head (Gated Amendment 5 S39 / Amendment 7 S47〜S48)", () => {
  it("applies bg-background (no border-b) to the summary band, bg-list-head to thead th and thead tr; band carries no bg-list-head/bg-muted/forced-colors:border-b", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const summaryBand = container.querySelector(".z-20.h-10");
    const bandTokens = classTokens(summaryBand);
    expect(bandTokens).toContain("bg-background");
    // Gated Amendment 7 S47（owner run 6「上端の線だけ外そう」）: 件数行の下線を撤去。
    expect(bandTokens).not.toContain("border-b");
    expect(bandTokens).not.toContain("border-border");
    expect(bandTokens).not.toContain("bg-list-head");
    expect(bandTokens).not.toContain("bg-muted");
    expect(bandTokens).not.toContain("forced-colors:border-b");

    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens).toContain("[&_thead_th]:bg-list-head");
    // Gated Amendment 7 S48（owner run 6「最小幅で部門と売価の間に白い細線」）: S43 で外した
    // tr 背景を seam 対策として復活（角丸は corner mask で維持、SC17）。
    expect(rootTokens).toContain("[&_thead_tr]:bg-list-head");
    expect(rootTokens).not.toContain("[&_thead_th]:bg-muted");
    expect(rootTokens).not.toContain("[&_thead_tr]:bg-muted");
  });
});

describe("SC10: 帯の隣接 + inset（Gated Amendment 3 S13、owner L3 run 2 FAIL / AC-L3-2。Lane 4 Gated Amendment 4 GA4a-2 で是正: 帯は box の外・root 直下へ移った）", () => {
  it("GA4a-2: the band's parent is the ListShell root (not the box), its nextElementSibling is the box directly, it carries mb-0!, and the table wrapper (reached via tableContainer.parentElement) stays exactly w-min min-w-full", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );

    const root = container.firstElementChild;
    expect(classTokens(root)).toContain("space-y-3");

    const summaryBand = container.querySelector(".z-20.h-10");
    expect(summaryBand).not.toBeNull();
    expect(classTokens(summaryBand)).toContain("px-2");

    // GA4a-2 (1): 帯の親は ListShell root（box の子孫ではない）。
    expect(summaryBand?.parentElement).toBe(root);
    // GA4a-2 (3): box `mt-0` ではなく帯自身の `mb-0!` が帯–box 間の隙間を相殺する
    // （round 2 是正、Opus P1: Tailwind v4 の space-y-3 は margin を先行 sibling
    // 〈帯〉側の margin-bottom として乗せるため box mt-0 は no-op）。
    expect(classTokens(summaryBand)).toContain("mb-0!");

    const box = container.querySelector("[data-list-scroll-container]");
    expect(box).not.toBeNull();
    // GA4a-2 (2): 帯の nextElementSibling は box そのもの。
    expect(summaryBand?.nextElementSibling).toBe(box);

    // GA4a-2 (4)（round 2 是正、Opus P2）: summaryBand.parentElement はもう wrapper
    // ではなく root になるため、wrapper の完全一致契約は table 側から辿る。
    const tableContainer = container.querySelector('[data-slot="table-container"]');
    expect(tableContainer).not.toBeNull();
    const wrapper = tableContainer?.parentElement ?? null;
    expect(wrapper).not.toBeNull();
    expect(wrapper).not.toBe(root);
    // 追補 S17（Opus P1-2、AC-L3-2）: wrapper は w-min min-w-full に完全一致（他 class を足さない）。
    // min-content = table の最小幅。overflow 時は wrapper = table 幅となる。
    expect(wrapper?.className).toBe("w-min min-w-full");
    const wrapperTokens = classTokens(wrapper);
    const spacingPrefixes = ["space-y-", "gap-", "mt-", "mb-", "pt-", "pb-"];
    expect(
      wrapperTokens.some((token) => spacingPrefixes.some((prefix) => token.startsWith(prefix))),
    ).toBe(false);
  });
});

describe("GA3b-1〜GA3b-4: 箱の高さ方針を行数基準 max-h へ（Lane 4 Gated Amendment 3、旧 GA1a/GA1b の逆転）", () => {
  it("GA3b-2/GA3b-3/GA3b-4: box carries max-h-[calc(100vh-6.75rem)] overflow-auto (not min-h-[12rem]/flex-1) + data-list-scroll-container + data-scroll-restoration-id=products-list; toolbar has no shrink-0; bottom Pagination is a sibling after the box (not inside it); root has none of flex/flex-1/min-h-0/flex-col (space-y-3/list-shell-sticky/STICKY_TABLE_CLASSES/identityColumns tokens unchanged)", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary identityColumns={2} pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );

    const root = container.firstElementChild;
    const rootTokens = classTokens(root);
    expect(rootTokens).not.toContain("flex");
    expect(rootTokens).not.toContain("flex-1");
    expect(rootTokens).not.toContain("min-h-0");
    expect(rootTokens).not.toContain("flex-col");
    // 巻き添え削除が無いことの確認（無関係な token は不変）
    expect(rootTokens).toContain("space-y-3");
    expect(rootTokens).toContain("list-shell-sticky");
    expect(rootTokens).toContain("[&_thead_th]:sticky");
    expect(rootTokens).toContain("[&_thead_th:nth-child(2)]:left-[9rem]");

    const box = container.querySelector("[data-list-scroll-container]");
    expect(box).not.toBeNull();
    const boxTokens = classTokens(box);
    // Lane 4 Gated Amendment 4 GA4b-1: 箱の高さを行数基準から viewport 基準へ
    // （既存 it 内の assertion のみ差し替え）。
    expect(boxTokens).toContain("max-h-[calc(100vh-6.75rem)]");
    expect(boxTokens).toContain("overflow-auto");
    expect(boxTokens).not.toContain("min-h-[12rem]");
    expect(boxTokens).not.toContain("flex-1");
    expect(box?.getAttribute("data-scroll-restoration-id")).toBe("products-list");

    const pagerButton = screen.getByRole("button", { name: "次のページ" });
    const paginationRoot = pagerButton.closest(
      ".flex.flex-wrap.items-center.justify-between.gap-3.text-sm.text-muted-foreground",
    );
    expect(paginationRoot).not.toBeNull();
    expect(box?.contains(paginationRoot)).toBe(false);
    expect(box?.nextElementSibling).toBe(paginationRoot);
  });

  it("GA3b-4: toolbar element does not carry shrink-0", () => {
    const { container } = render(
      <ListShell stickyHeader toolbar={<div>toolbar</div>} pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    const toolbar = container.querySelector(".rounded-lg.border.bg-card.p-4");
    expect(toolbar).not.toBeNull();
    expect(classTokens(toolbar)).not.toContain("shrink-0");
  });

  it("without stickyHeader, no scroll-container box is rendered (paired oracle: box count is exactly 0)", () => {
    const { container } = render(
      <ListShell topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    expect(container.querySelectorAll("[data-list-scroll-container]")).toHaveLength(0);
  });

  it("with stickyHeader, exactly one scroll-container box is rendered (paired oracle: count is exactly 1)", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    expect(container.querySelectorAll("[data-list-scroll-container]")).toHaveLength(1);
  });
});

describe("SC17: list-shell-sticky hook class (Gated Amendment 7 S48 corner mask)", () => {
  it("adds list-shell-sticky to root classList only when stickyHeader is true", () => {
    const { container: sticky } = render(
      <ListShell stickyHeader topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    expect(classTokens(sticky.firstElementChild)).toContain("list-shell-sticky");

    const { container: notSticky } = render(
      <ListShell topSummary pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    expect(classTokens(notSticky.firstElementChild)).not.toContain("list-shell-sticky");
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

describe("SC9a/SC9b: identityColumns activates root class tokens for the first N columns", () => {
  it("SC9a: with stickyHeader + identityColumns={2}, root carries sticky/left/background/z-index/edge tokens for columns 1-2 (thead th + tbody td), and no nth-child(3)+ variant", () => {
    const { container } = render(
      <ListShell stickyHeader identityColumns={2}>
        <SampleTable />
      </ListShell>,
    );
    const rootTokens = classTokens(container.firstElementChild);
    // 列 1
    expect(rootTokens).toContain("[&_thead_th:nth-child(1)]:sticky");
    expect(rootTokens).toContain("[&_thead_th:nth-child(1)]:left-0");
    expect(rootTokens).toContain("[&_thead_th:nth-child(1)]:z-[11]");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(1)]:sticky");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(1)]:left-0");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(1)]:bg-background");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(1)]:z-[1]");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(1)]:shadow-[inset_-1px_0_0_var(--border)]");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(1)]:forced-colors:border-r");
    // 列 2
    expect(rootTokens).toContain("[&_thead_th:nth-child(2)]:sticky");
    expect(rootTokens).toContain("[&_thead_th:nth-child(2)]:left-[9rem]");
    expect(rootTokens).toContain("[&_thead_th:nth-child(2)]:z-[11]");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(2)]:sticky");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(2)]:left-[9rem]");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(2)]:bg-background");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(2)]:z-[1]");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(2)]:shadow-[inset_-1px_0_0_var(--border)]");
    expect(rootTokens).toContain("[&_tbody_td:nth-child(2)]:forced-colors:border-r");
    // 列 3 以降には一切付かない
    expect(rootTokens.some((token) => token.includes("nth-child(3)"))).toBe(false);
  });

  it("SC9b: without identityColumns, root carries none of the identity-specific tokens (空集合 oracle 対)", () => {
    const { container } = render(
      <ListShell stickyHeader>
        <SampleTable />
      </ListShell>,
    );
    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens.some((token) => token.includes("nth-child"))).toBe(false);
    expect(rootTokens).not.toContain("[&_thead_th:nth-child(1)]:z-[11]");
    expect(rootTokens).not.toContain("[&_tbody_td:nth-child(1)]:forced-colors:border-r");
  });

  it("SC9b続き: identityColumns があっても stickyHeader が false なら識別列 token を付けない（thead th の bg-list-head が無く識別列だけ浮くのを防ぐ）", () => {
    const { container } = render(
      <ListShell identityColumns={2}>
        <SampleTable />
      </ListShell>,
    );
    const rootTokens = classTokens(container.firstElementChild);
    expect(rootTokens.some((token) => token.includes("nth-child"))).toBe(false);
  });
});

describe("SC9c: identityColumns does not touch the w-min min-w-full wrapper (Lane 4 Gated Amendment 4 GA4a で是正: wrapper は table 側から辿る)", () => {
  it("keeps the summary+table wrapper className exactly w-min min-w-full after identityColumns is activated", () => {
    const { container } = render(
      <ListShell stickyHeader topSummary identityColumns={2} pagination={pagination(25)}>
        <SampleTable />
      </ListShell>,
    );
    // round 2 是正、Opus P2: summaryBand.parentElement は GA4a 後は root になるため、
    // wrapper は table container 側から辿る（SC10 と同じ理由）。
    const tableContainer = container.querySelector('[data-slot="table-container"]');
    const wrapper = tableContainer?.parentElement ?? null;
    expect(wrapper?.className).toBe("w-min min-w-full");
  });
});

describe("GA3a-3: 商品コード div 幅と識別列 offset の parity oracle（Lane 4 Gated Amendment 3）", () => {
  it("PRODUCT_CODE_CELL_WRAPPER_WIDTH_CLASS の rem 値 + td/th padding(1rem) が IDENTITY_COLUMN_CLASSES[2] の left-[9rem] の rem 値と一致する", () => {
    const widthRemMatch = /^w-(\d+)$/.exec(PRODUCT_CODE_CELL_WRAPPER_WIDTH_CLASS);
    if (widthRemMatch?.[1] === undefined) {
      throw new Error(`unexpected width class shape: ${PRODUCT_CODE_CELL_WRAPPER_WIDTH_CLASS}`);
    }
    // Tailwind の w-<n> は 0.25rem 単位（w-32 = 32 * 0.25rem = 8rem）
    const wrapperWidthRem = Number(widthRemMatch[1]) * 0.25;
    const tdThPaddingRem = 1; // px-2/p-2 = 0.5rem * 2 辺 = 1rem

    const { container } = render(
      <ListShell stickyHeader identityColumns={2}>
        <SampleTable />
      </ListShell>,
    );
    const rootTokens = classTokens(container.firstElementChild);
    const offsetToken = rootTokens.find((token) =>
      token.startsWith("[&_thead_th:nth-child(2)]:left-["),
    );
    if (offsetToken === undefined) throw new Error("offset token not found");
    const offsetRemMatch = /left-\[(\d+(?:\.\d+)?)rem\]/.exec(offsetToken);
    if (offsetRemMatch?.[1] === undefined) {
      throw new Error(`unexpected offset token shape: ${offsetToken}`);
    }
    const offsetRem = Number(offsetRemMatch[1]);

    expect(wrapperWidthRem + tdThPaddingRem).toBe(offsetRem);
  });
});
