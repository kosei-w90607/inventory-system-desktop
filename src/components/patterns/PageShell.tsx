// src/components/patterns/PageShell.tsx
//
// 全画面共通の page root（04 原則 6、D-1）。space-y-6 p-6 を唯一の page root とし、
// className を渡しても base class（space-y-6 p-6）は tailwind-merge の後勝ちで残る。
// min-h-screen は持たない（<main> が min-h-0 overflow-auto の grid cell であり
// content の最小高は不要、Probe 1 で 9 画面の依存不在を確認済み）。overlay を持つ
// 画面は className="relative" で補う。
// 設計: docs/function-design/59-ui-shared-patterns.md §59.1
// catalog: docs/design-system/04-backbone.md 原則 6

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export interface PageShellProps {
  className?: string;
  children: ReactNode;
}

export function PageShell({ className, children }: PageShellProps) {
  return <div className={cn(className, "space-y-6 p-6")}>{children}</div>;
}
