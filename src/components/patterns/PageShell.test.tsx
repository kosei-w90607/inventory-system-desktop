// src/components/patterns/PageShell.test.tsx
//
// SC2a: PageShell の単一 root 契約（04 原則 6、D-1）。
// Plan Packet: docs/plans/2026-09-03-ui-list-backbone-d-lane2.md S2 / D-1

import { render } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { PageShell } from "./PageShell";

describe("SC2a: PageShell renders a single root with space-y-6 p-6", () => {
  it("root は space-y-6 と p-6 の両方を持つ単一 div", () => {
    const { container } = render(
      <PageShell>
        <div>子要素</div>
      </PageShell>,
    );
    expect(container.children).toHaveLength(1);
    const root = container.firstElementChild;
    expect(root?.tagName).toBe("DIV");
    expect(root).toHaveClass("space-y-6", "p-6");
  });

  it("children を描画する", () => {
    const { getByText } = render(
      <PageShell>
        <div>子要素</div>
      </PageShell>,
    );
    expect(getByText("子要素")).toBeInTheDocument();
  });

  it("className='relative' を渡すと relative が追加される（overlay 画面）", () => {
    const { container } = render(
      <PageShell className="relative">
        <div>子要素</div>
      </PageShell>,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass("relative", "space-y-6", "p-6");
  });

  it("className='space-y-4' を渡しても space-y-6 が残る（base が後勝ち）", () => {
    const { container } = render(
      <PageShell className="space-y-4">
        <div>子要素</div>
      </PageShell>,
    );
    const root = container.firstElementChild;
    expect(root).toHaveClass("space-y-6");
    expect(root?.className).not.toContain("space-y-4");
  });

  it("min-h-screen を持たない", () => {
    const { container } = render(
      <PageShell>
        <div>子要素</div>
      </PageShell>,
    );
    const root = container.firstElementChild;
    expect(root?.className).not.toContain("min-h-screen");
  });
});
