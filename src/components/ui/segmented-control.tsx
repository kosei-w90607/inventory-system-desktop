import * as React from "react";

import { cn } from "@/lib/utils";
import { SELECTION_TONE_ACTIVE } from "./selection-tone";

// 群 wrapper（DSR-22 `:443`、操作枠 3:1、Gated Amendment 2 S9 / owner L3 FAIL-1）:
// 旧 stone 系直書きの構造線（対 --background 1.43:1）を撤去し border-border-strong
// （対 --background 3.53:1）の 1 枠へ。Primary 色は使わない。
export const segmentedControlListClass =
  "inline-flex h-9 w-fit items-center justify-center rounded-md border border-border-strong bg-background p-0.5 text-muted-foreground";

export const segmentedControlItemClass =
  "relative inline-flex h-[calc(100%-1px)] flex-none appearance-none items-center justify-center gap-1.5 rounded-md border border-transparent px-3 py-1 text-sm font-medium whitespace-nowrap transition-all focus-visible:border-border-strong focus-visible:ring-2 focus-visible:ring-ring/25 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50";

// 選択中の stone 塗り + bold は不変。SidebarLink と同じ共有 tone
// （selection-tone.ts の SELECTION_TONE_ACTIVE）を参照し、旧 stone 系直書きの
// literal はこの file から撤去する（DRY、値そのものは変えない）。
export const segmentedControlActiveClass = SELECTION_TONE_ACTIVE;

export const segmentedControlInactiveClass = "text-foreground/60 hover:text-foreground";

export type SegmentedControlOption<TValue extends string> = Readonly<{
  value: TValue;
  label: React.ReactNode;
  disabled?: boolean;
}>;

export interface SegmentedControlProps<TValue extends string> {
  ariaLabel: string;
  value: TValue;
  options: readonly SegmentedControlOption<TValue>[];
  onValueChange: (value: TValue) => void;
  className?: string;
  itemClassName?: string;
}

export function SegmentedControl<TValue extends string>({
  ariaLabel,
  value,
  options,
  onValueChange,
  className,
  itemClassName,
}: SegmentedControlProps<TValue>) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn(segmentedControlListClass, className)}>
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isActive}
            data-state={isActive ? "active" : "inactive"}
            disabled={option.disabled}
            className={cn(
              segmentedControlItemClass,
              isActive ? segmentedControlActiveClass : segmentedControlInactiveClass,
              itemClassName,
            )}
            onClick={() => {
              if (!isActive && !option.disabled) {
                onValueChange(option.value);
              }
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
