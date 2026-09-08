// src/components/ui/badge.test.tsx
//
// SC2（Lane 5 S3、L5-D1）: variant="outline" は border-border-strong を持ち、
// variant="default" は誤って持たない（空集合 oracle 禁止の趣旨、過剰適用の対照 case）。
// Badge は input 系コンポーネントでないため border-input でなく直接 utility を使う。

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Badge } from "./badge";

describe("Badge (Lane 5 SC2)", () => {
  it('SC2: variant="outline" has border-border-strong; variant="default" does not', () => {
    render(
      <>
        <Badge variant="outline">枠あり</Badge>
        <Badge variant="default">既定</Badge>
      </>,
    );

    const outlineBadge = screen.getByText("枠あり");
    const defaultBadge = screen.getByText("既定");

    expect(outlineBadge).toHaveClass("border-border-strong");
    expect(defaultBadge).not.toHaveClass("border-border-strong");
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

  it("SC1 / DSR-22: the untoned default retains the emphasis appearance", () => {
    render(<Badge>強調</Badge>);
    expect(screen.getByText("強調")).toHaveClass("bg-primary", "text-primary-foreground");
    expect(screen.getByText("強調")).not.toHaveAttribute("data-tone");
  });
});
