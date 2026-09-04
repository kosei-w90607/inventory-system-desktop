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
