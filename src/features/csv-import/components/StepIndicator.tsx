// src/features/csv-import/components/StepIndicator.tsx
//
// CSV 取込みフローの 3 step 視覚インジケータ。
// 設計: docs/function-design/55-ui-csv-import.md §55.1 / §55.4

import { cn } from "@/lib/utils";

const STEPS = [
  { num: 1, label: "ファイル選択" },
  { num: 2, label: "プレビュー" },
  { num: 3, label: "結果" },
] as const;

export type StepNumber = 1 | 2 | 3;

export interface StepIndicatorProps {
  currentStep: StepNumber;
}

/// state.status から派生した currentStep (1/2/3) を受け、active step を強調表示。
/// CsvImportPage.tsx 側で computeCurrentStep により導出 (idle/parsing → 1、preview → 2、importing/result → 3)。
/// いまのステップは進行中の段 2 + 太字、済んだ・先のステップは同じ段 0 で位置と aria-current で分ける（D-CE8）。
export function StepIndicator({ currentStep }: StepIndicatorProps) {
  return (
    <nav aria-label="取込みステップ" className="flex items-center gap-2 text-sm">
      {STEPS.map((step, idx) => (
        <div key={step.num} className="flex items-center gap-2">
          <div
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full border text-xs",
              currentStep === step.num
                ? "border-ongoing-border bg-ongoing-soft font-semibold text-ongoing-strong"
                : "border-muted-foreground/30 font-medium text-muted-foreground",
            )}
            aria-current={currentStep === step.num ? "step" : undefined}
          >
            {step.num}
          </div>
          <span
            className={cn(
              currentStep === step.num ? "font-semibold text-foreground" : "text-muted-foreground",
            )}
          >
            {step.label}
          </span>
          {idx < STEPS.length - 1 && (
            <span className="text-muted-foreground/40" aria-hidden="true">
              ›
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}
