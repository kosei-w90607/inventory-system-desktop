// src/components/patterns/PageHeader.tsx
//
// 全画面共通ページヘッダー。4 variant を props 組合せで統合する。
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
  /** ヘッダー右端に配置するアクション要素（省略可）。存在時は見出し行 + 説明行の 2 段になる */
  actions?: ReactNode;
}

/**
 * ページヘッダーの 4 variant:
 *   (a) title のみ         → `<header className="space-y-1">` + `<h1>`
 *   (b) title + subtitle  → `<header className="space-y-1">` + `<h1>` + `<p>`
 *   (c) title + actions   → `<header className="space-y-1">` + 見出し行（h1 + actions）+ 説明行
 *   (d) title + description → space-y-1 + h1 + p
 *
 * actions があっても副題・説明をタイトルと同じグループに保つ。
 * actions は見出し行の右上に置き、副題・説明はその下の全幅の説明行に置く。
 */
export function PageHeader({ title, subtitle, description, actions }: PageHeaderProps) {
  // 見出し行と全幅の説明行を分け、actions を見出しの右上に留める。
  if (actions !== undefined) {
    return (
      <header className="space-y-1">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="min-w-0 flex-1 text-2xl font-semibold">{title}</h1>
          <div className="shrink-0">{actions}</div>
        </div>
        {subtitle !== undefined && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        {description !== undefined && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
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
