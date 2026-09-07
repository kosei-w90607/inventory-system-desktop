// src/components/ui/button.test.tsx
//
// SC1（Lane 5 S2）: variant="outline" は border-input（--border-strong）を持ち、
// variant="default" は誤って持たない（空集合 oracle 禁止の趣旨、過剰適用の対照 case）。

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";

import { Button } from "./button";

describe("Button (Lane 5 SC1)", () => {
  it('SC1: variant="outline" has border-input; variant="default" does not', () => {
    render(
      <>
        <Button variant="outline">枠あり</Button>
        <Button variant="default">既定</Button>
      </>,
    );

    const outlineButton = screen.getByRole("button", { name: "枠あり" });
    const defaultButton = screen.getByRole("button", { name: "既定" });

    expect(outlineButton).toHaveClass("border-input");
    expect(defaultButton).not.toHaveClass("border-input");
  });
});

it("SC11 / DSR-01: secondary action has the middle-level fill and border", () => {
  render(<Button variant="secondary">補助操作</Button>);
  const button = screen.getByRole("button", { name: "補助操作" });
  expect(button).toHaveAttribute("data-slot", "button");
  expect(button).toHaveAttribute("data-variant", "secondary");
  expect(button).toHaveClass(
    "border",
    "border-border",
    "bg-secondary",
    "text-secondary-foreground",
  );
});
