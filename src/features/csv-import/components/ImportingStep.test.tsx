// src/features/csv-import/components/ImportingStep.test.tsx
//
// SPEC-COLOR-EMPHASIS-RT-1 / D-CE10 / D-CE5: 取込み中の移動制限は失敗ではなく待ってほしい知らせのため
// 注意・確認（warning + 三角 icon + 文言）。待ちの spinner は進行中の色。
// Z004 の確定は停止中（SPEC-STOP-D4）で画面に出ないため、見え方はこの test だけで固定する。

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ImportingStep } from "./ImportingStep";

describe("UI-07 ImportingStep 色と強調 (D-CE10 / D-CE5)", () => {
  it("shows the navigation lock as a caution alert with an icon, not a failure", () => {
    render(<ImportingStep filename="sales.csv" />);
    const title = screen.getByText("取込み完了まで他画面に移れません");
    const alert = title.closest('[data-slot="alert"]');
    expect(alert).toHaveAttribute("data-variant", "warning");
    expect(alert).toHaveClass("bg-warning-soft", "border-warning", "text-warning-strong");
    expect(alert).not.toHaveClass("bg-destructive-soft");
    expect(alert?.querySelectorAll("svg")).toHaveLength(1);
    expect(alert?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("paints the waiting spinner with the ongoing color", () => {
    render(<ImportingStep filename="sales.csv" />);
    const spinner = screen.getByRole("status").querySelector("svg");
    expect(spinner).toHaveClass("animate-spin", "text-ongoing");
    expect(spinner).not.toHaveClass("text-primary");
  });
});
