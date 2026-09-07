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
