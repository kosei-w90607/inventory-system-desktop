// src/features/csv-import/components/StepIndicator.test.tsx
//
// SPEC-COLOR-EMPHASIS-RT-1 / D-CE8: 取込みの手順の表示。いまのステップだけを進行中の段 2
// （線 + 薄い地 + 文字）と太字で示し、済んだステップと先のステップは同じ段 0 で、
// 位置と aria-current="step" で分ける（塗り〈段 4〉は押すボタンだけ）。

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StepIndicator, type StepNumber } from "./StepIndicator";

const LABELS = ["ファイル選択", "プレビュー", "結果"] as const;

describe("UI-07 StepIndicator 色と強調 (D-CE8)", () => {
  it.each([1, 2, 3] as const)(
    "currentStep %i: only the current step is ongoing and bold; the others stay muted",
    (currentStep: StepNumber) => {
      render(<StepIndicator currentStep={currentStep} />);
      const nav = screen.getByRole("navigation", { name: "取込みステップ" });
      const current = nav.querySelectorAll('[aria-current="step"]');
      expect(current).toHaveLength(1);
      expect(current[0]).toHaveTextContent(String(currentStep));

      LABELS.forEach((label, idx) => {
        const num = screen.getByText(String(idx + 1));
        const name = screen.getByText(label);
        if (idx + 1 === currentStep) {
          expect(num).toHaveClass(
            "border-ongoing-border",
            "bg-ongoing-soft",
            "text-ongoing-strong",
            "font-semibold",
          );
          expect(name).toHaveClass("font-semibold", "text-foreground");
        } else {
          // 済んだステップも先のステップも同じ段 0（位置で分ける）。
          expect(num).toHaveClass("border-muted-foreground/30", "text-muted-foreground");
          expect(num).not.toHaveClass("bg-ongoing-soft");
          expect(num.className).not.toMatch(/primary/);
          expect(name).toHaveClass("text-muted-foreground");
          expect(name).not.toHaveClass("font-semibold");
        }
      });
    },
  );
});
