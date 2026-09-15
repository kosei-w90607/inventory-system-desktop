// src/components/patterns/PageHeader.test.tsx
//
// PageHeader 3 variant の DOM 構造 assert。
// 設計: docs/function-design/59-ui-shared-patterns.md §59.1

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  describe("(a) title のみ", () => {
    it("h1 としてタイトルを描画し subtitle は出力しない", () => {
      render(<PageHeader title="在庫照会" />);
      expect(screen.getByRole("heading", { level: 1, name: "在庫照会" })).toBeInTheDocument();
      expect(screen.queryByRole("paragraph")).toBeNull();
    });

    it("header 要素に space-y-1 class が付く", () => {
      const { container } = render(<PageHeader title="在庫照会" />);
      const header = container.querySelector("header");
      expect(header).toHaveClass("space-y-1");
    });
  });

  describe("(b) title + subtitle", () => {
    it("h1 と subtitle 文言を両方描画する", () => {
      render(<PageHeader title="ホーム" subtitle="2026年6月12日（金）" />);
      expect(screen.getByRole("heading", { level: 1, name: "ホーム" })).toBeInTheDocument();
      expect(screen.getByText("2026年6月12日（金）")).toBeInTheDocument();
    });

    it("subtitle は p.text-sm.text-muted-foreground で描画される", () => {
      const { container } = render(<PageHeader title="ホーム" subtitle="2026年6月12日（金）" />);
      const p = container.querySelector("p");
      expect(p).toHaveClass("text-sm", "text-muted-foreground");
      expect(p).toHaveTextContent("2026年6月12日（金）");
    });

    it("header 要素に space-y-1 class が付く", () => {
      const { container } = render(<PageHeader title="ホーム" subtitle="副題" />);
      const header = container.querySelector("header");
      expect(header).toHaveClass("space-y-1");
    });
  });

  describe("(c) title + actions", () => {
    it("h1 と actions slot を両方描画する", () => {
      render(<PageHeader title="商品検索・一覧" actions={<a href="/products/new">商品登録</a>} />);
      expect(screen.getByRole("heading", { level: 1, name: "商品検索・一覧" })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: "商品登録" })).toBeInTheDocument();
    });

    it("SPEC-FILTER-LABEL-RT-1 D-RT3: 見出し行と header の配置を分ける", () => {
      const { container } = render(
        <PageHeader title="商品検索・一覧" actions={<button type="button">操作</button>} />,
      );
      const header = container.querySelector("header");
      expect(header).toHaveClass("space-y-1");
      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading.parentElement).toHaveClass(
        "flex",
        "flex-wrap",
        "items-start",
        "justify-between",
        "gap-3",
      );
      expect(heading).toHaveClass("min-w-0", "flex-1");
    });

    it("SPEC-FILTER-LABEL-RT-1 D-RT3: subtitle は見出し行の下に置く", () => {
      // actions と subtitle の両方を見出し行 + 説明行で描画する
      const { container } = render(
        <PageHeader
          title="タイトル"
          subtitle="副題"
          actions={<button type="button">操作</button>}
        />,
      );
      const header = container.querySelector("header");
      expect(header).toHaveClass("space-y-1");
      expect(screen.getByText("副題").parentElement).toBe(header);
    });
  });
});

// ⑮ SC1/SC2: actions の有無で副題・操作説明を失わない。
it("SPEC-FILTER-LABEL-RT-1 D-RT3 / ⑮ SC1: actions と副題と説明を2段で表示する", () => {
  render(
    <PageHeader
      title="タイトル"
      subtitle="副題"
      description="操作説明"
      actions={<button>操作</button>}
    />,
  );
  const subtitle = screen.getByText("副題");
  const header = subtitle.closest("header");
  expect(subtitle.tagName).toBe("P");
  expect(subtitle.parentElement).toBe(header);
  expect(header).toHaveClass("space-y-1");
  const heading = screen.getByRole("heading", { level: 1 });
  expect(heading).toHaveClass("min-w-0", "flex-1");
  expect(heading.parentElement?.parentElement).toBe(header);
  expect(heading.parentElement).toHaveClass(
    "flex",
    "flex-wrap",
    "items-start",
    "justify-between",
    "gap-3",
  );
  expect(screen.getByText("操作説明").parentElement).toBe(subtitle.parentElement);
  expect(screen.getByText("操作説明").tagName).toBe("P");
  expect(subtitle.closest("header")).not.toHaveClass("items-center");
  expect(screen.getByRole("button", { name: "操作" }).parentElement).toHaveClass("shrink-0");
});
it.each([undefined, "副題"])("⑮ SC2: actions なしで説明を描画する（副題=%s）", (subtitle) => {
  render(<PageHeader title="タイトル" subtitle={subtitle} description="操作説明" />);
  expect(screen.getByText("操作説明").closest("header")).toHaveClass("space-y-1");
  if (subtitle !== undefined) expect(screen.getByText("副題")).toBeInTheDocument();
});

// SPEC-FILTER-LABEL-RT-1 D-RT3: actions なしの既存 DOM を実装前に固定する。
describe("actions なしの DOM 不変", () => {
  it("title のみ", () => {
    const { container } = render(<PageHeader title="タイトル" />);
    expect(container.innerHTML).toMatchInlineSnapshot(
      `"<header class="space-y-1"><h1 class="text-2xl font-semibold">タイトル</h1></header>"`,
    );
  });
  it("title + subtitle", () => {
    const { container } = render(<PageHeader title="タイトル" subtitle="副題" />);
    expect(container.innerHTML).toMatchInlineSnapshot(
      `"<header class="space-y-1"><h1 class="text-2xl font-semibold">タイトル</h1><p class="text-sm text-muted-foreground">副題</p></header>"`,
    );
  });
  it("title + subtitle + description", () => {
    const { container } = render(
      <PageHeader title="タイトル" subtitle="副題" description="操作説明" />,
    );
    expect(container.innerHTML).toMatchInlineSnapshot(
      `"<header class="space-y-1"><h1 class="text-2xl font-semibold">タイトル</h1><p class="text-sm text-muted-foreground">副題</p><p class="text-sm text-muted-foreground">操作説明</p></header>"`,
    );
  });
});
