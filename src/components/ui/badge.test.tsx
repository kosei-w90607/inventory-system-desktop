// src/components/ui/badge.test.tsx
//
// SC2（Lane 5 S3、L5-D1）: variant="outline" は border-border-strong を持ち、
// 比べる相手（variant="secondary"）は誤って持たない（空集合 oracle 禁止の趣旨、過剰適用の対照 case）。
// runtime lane A（D-CE3）で default variant を削ったため、対照を secondary に替えた。
// Badge は input 系コンポーネントでないため border-input でなく直接 utility を使う。

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Badge } from "./badge";

describe("Badge (Lane 5 SC2)", () => {
  it('SC2: variant="outline" has border-border-strong; variant="secondary" does not', () => {
    render(
      <>
        <Badge variant="outline">枠あり</Badge>
        <Badge variant="secondary">分類</Badge>
      </>,
    );

    const outlineBadge = screen.getByText("枠あり");
    const secondaryBadge = screen.getByText("分類");

    expect(outlineBadge).toHaveClass("border-border-strong");
    expect(secondaryBadge).not.toHaveClass("border-border-strong");
  });
});

describe("UI conventions runtime: Badge", () => {
  it.each([
    ["warning", "border-warning-border", "bg-warning-soft", "text-warning-strong"],
    ["success", "border-success-border", "bg-success-soft", "text-success-strong"],
    ["destructive", "border-destructive-border", "bg-destructive-soft", "text-destructive-strong"],
  ] as const)(
    "SC1 / DSR-22: %s tone has its independent three-class contract",
    (tone, border, background, foreground) => {
      render(
        <Badge variant="outline" tone={tone}>
          状態
        </Badge>,
      );
      const badge = screen.getByText("状態");
      expect(badge).toHaveAttribute("data-slot", "badge");
      expect(badge).toHaveAttribute("data-variant", "outline");
      expect(badge).toHaveAttribute("data-tone", tone);
      expect(badge).toHaveClass(border, background, foreground);
      expect(badge).not.toHaveClass("border-border-strong");
    },
  );

  it("SC2 / DSR-22: classification has a border and no state tone", () => {
    render(<Badge variant="secondary">分類</Badge>);
    expect(screen.getByText("分類")).toHaveAttribute("data-variant", "secondary");
    expect(screen.getByText("分類")).toHaveClass(
      "border-border",
      "bg-secondary",
      "text-secondary-foreground",
    );
    expect(screen.getByText("分類")).not.toHaveAttribute("data-tone");
  });

  // SPEC-COLOR-EMPHASIS-RT-1 / D-CE3: 塗り（段 4）は押すボタンだけ。badge の既定の塗りを無くす。
  it("D-CE3: an unspecified variant does not paint the operation fill", () => {
    render(<Badge>強調</Badge>);
    const badge = screen.getByText("強調");
    expect(badge).not.toHaveClass("bg-primary");
    expect(badge).not.toHaveClass("text-primary-foreground");
    expect(badge).not.toHaveAttribute("data-variant", "default");
    expect(badge).not.toHaveAttribute("data-tone");
  });
});
