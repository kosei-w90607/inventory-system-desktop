// src/components/patterns/PageHeader.tsx
//
// 全画面共通ページヘッダー。3 variant を props 組合せで統合する。
// 設計: docs/function-design/59-ui-shared-patterns.md §59.1
// catalog: docs/design-system/02-component-catalog.md ① ページヘッダ

import type { ReactNode } from "react";

export interface PageHeaderProps {
  /** ページタイトル。h1 要素として描画される */
  title: string;
  /** 副題。text-sm text-muted-foreground で h1 直下に描画される（省略可） */
  subtitle?: string;
  /** このページで行う操作の説明。副題の下に描画する（省略可） */
  description?: string;
  /** ヘッダー右端に配置するアクション要素（省略可）。存在時は flex justify-between レイアウトになる */
  actions?: ReactNode;
}

/**
 * ページヘッダーの 3 variant:
 *   (a) title のみ         → `<header className="space-y-1">` + `<h1>`
 *   (b) title + subtitle  → `<header className="space-y-1">` + `<h1>` + `<p>`
 *   (c) title + actions   → `<header className="flex flex-wrap items-start justify-between gap-3">` + `<h1>` + actions slot
 *
 * actions があっても副題・説明をタイトルと同じグループに保つ。
 * actions は右上に置き、副題・説明は左グループ内で折り返す。
 */
export function PageHeader({ title, subtitle, description, actions }: PageHeaderProps) {
  // items-start + min-w-0 flex-1 で長い説明を左列内で折り返し、actions を右上に留める。
  if (actions !== undefined) {
    return (
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <h1 className="text-2xl font-semibold">{title}</h1>
          {subtitle !== undefined && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          {description !== undefined && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="shrink-0">{actions}</div>
      </header>
    );
  }

  // subtitle がある場合、または title のみの場合は space-y-1 レイアウト
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold">{title}</h1>
      {subtitle !== undefined && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      {description !== undefined && <p className="text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}
