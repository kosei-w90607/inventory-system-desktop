// src/components/patterns/ListShell.tsx
//
// 一覧の器（catalog ⑯、D-2 / D-5）。toolbar・上部件数・table・下部 pager・skeleton を
// まとめる共通 container。stickyHeader 時、table 内部（table-container / table / thead
// th / tbody td）の class は ListShell root の descendant variant（`[&_...]:`）のみで
// 上書きし、children（Table primitive）に className を渡さない。
// components/patterns は features を import しない（D-9、AC4）。
// 設計: docs/design-system/02-component-catalog.md ⑯ 一覧の器（ListShell）
//       docs/design-system/01-decision-rules.md DSR-22

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ListSkeleton } from "./ListSkeleton";
import { Pagination, PaginationSummary } from "./Pagination";

export interface ListShellPagination {
  page: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export interface ListShellProps {
  toolbar?: ReactNode;
  toolbarSecondary?: ReactNode;
  pagination?: ListShellPagination;
  topSummary?: boolean;
  stickyHeader?: boolean;
  /**
   * 識別列固定（DSR-22 mapping）。固定する先頭列の本数（1 or 2）。Lane 4 で商品一覧
   * のみ活性化（`identityColumns={2}`）。値ごとのリテラル class 配列で実装し
   * （Tailwind JIT は実行時テンプレートリテラルを拾えないため）、任意 N 列の
   * generator は作らない（YAGNI、DSR-22 mapping 表の最大値は 2）。
   */
  identityColumns?: number;
  isLoading?: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
}

const STICKY_TABLE_CLASSES = [
  "[&_[data-slot=table-container]]:overflow-visible",
  "[&_[data-slot=table]]:border-separate",
  "[&_[data-slot=table]]:border-spacing-0",
  "[&_thead_th]:sticky",
  "[&_thead_th]:z-10",
  // Gated Amendment 2 S11（owner L3 FAIL-3）: summary 帯と thead を同一 surface
  // （--list-head）にする。
  "[&_thead_th]:bg-list-head",
  // Gated Amendment 7 S48（owner run 6「最小幅で部門と売価の間に白い細線」）: Gated
  // Amendment 6 S43 で外した tr 背景を復活。border-separate + 最小幅の fractional
  // layout では th 同士の境界に subpixel の隙間が生じ page 地が透けるため、tr 背景で
  // 塞ぐ（角丸は下記 corner mask + globals.css の list-shell-sticky hook で維持）。
  "[&_thead_tr]:bg-list-head",
  "[&_thead_th]:border-b-2",
  "[&_thead_th]:border-border",
  // Gated Amendment 6 S43（owner run 5「列見出しの左右上を丸く」）: th 単体の角丸
  // （border-separate + spacing 0 では th だけで端まで埋まる）。
  "[&_thead_th:first-child]:rounded-tl-md",
  "[&_thead_th:last-child]:rounded-tr-md",
  "[&_tbody_td]:border-b",
  "[&_tbody_td]:border-border",
  "[&_tbody_tr:last-child_td]:border-b-0",
];

// S9（識別列固定）: 列 1・2 のリテラル class 配列。DSR-22 mapping 表の固定列数は
// 全行が 1 か 2 のため、この 2 パターンのみで足りる（ponytail: 汎用 N 列 generator
// は作らない）。列 2 の left-[7rem] は ProductTable.tsx 商品コード列の固定幅
// w-28（7rem）と一致させる。
const IDENTITY_COLUMN_CLASSES: Record<number, string[]> = {
  1: [
    "[&_thead_th:nth-child(1)]:sticky",
    "[&_thead_th:nth-child(1)]:left-0",
    "[&_thead_th:nth-child(1)]:z-[11]",
    "[&_tbody_td:nth-child(1)]:sticky",
    "[&_tbody_td:nth-child(1)]:left-0",
    "[&_tbody_td:nth-child(1)]:bg-background",
    "[&_tbody_td:nth-child(1)]:z-[1]",
    "[&_tbody_td:nth-child(1)]:shadow-[inset_-1px_0_0_var(--border)]",
    "[&_tbody_td:nth-child(1)]:forced-colors:border-r",
  ],
  2: [
    "[&_thead_th:nth-child(1)]:sticky",
    "[&_thead_th:nth-child(1)]:left-0",
    "[&_thead_th:nth-child(1)]:z-[11]",
    "[&_thead_th:nth-child(2)]:sticky",
    "[&_thead_th:nth-child(2)]:left-[7rem]",
    "[&_thead_th:nth-child(2)]:z-[11]",
    "[&_tbody_td:nth-child(1)]:sticky",
    "[&_tbody_td:nth-child(1)]:left-0",
    "[&_tbody_td:nth-child(1)]:bg-background",
    "[&_tbody_td:nth-child(1)]:z-[1]",
    "[&_tbody_td:nth-child(1)]:shadow-[inset_-1px_0_0_var(--border)]",
    "[&_tbody_td:nth-child(1)]:forced-colors:border-r",
    "[&_tbody_td:nth-child(2)]:sticky",
    "[&_tbody_td:nth-child(2)]:left-[7rem]",
    "[&_tbody_td:nth-child(2)]:bg-background",
    "[&_tbody_td:nth-child(2)]:z-[1]",
    "[&_tbody_td:nth-child(2)]:shadow-[inset_-1px_0_0_var(--border)]",
    "[&_tbody_td:nth-child(2)]:forced-colors:border-r",
  ],
};

export function ListShell({
  toolbar,
  toolbarSecondary,
  pagination,
  topSummary = false,
  stickyHeader = false,
  identityColumns,
  isLoading = false,
  skeleton,
  children,
}: ListShellProps) {
  const hasResults = (pagination?.totalCount ?? 0) > 0;
  const showTopSummary = topSummary && hasResults;

  return (
    <div
      className={cn(
        "space-y-3",
        stickyHeader && "list-shell-sticky",
        stickyHeader && STICKY_TABLE_CLASSES,
        stickyHeader && (showTopSummary ? "[&_thead_th]:top-10" : "[&_thead_th]:top-0"),
        identityColumns !== undefined && IDENTITY_COLUMN_CLASSES[identityColumns],
      )}
    >
      {toolbar !== undefined && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          {toolbar}
          {toolbarSecondary !== undefined && toolbarSecondary}
        </div>
      )}

      {stickyHeader && showTopSummary && pagination ? (
        // Gated Amendment 3 S13（owner L3 run 2 FAIL、AC-L3-2）: summary 帯と
        // table を spacing utility を持たない 1 つの wrapper に包み、root の
        // space-y-3 が toolbar /（帯 + table）/ 下部 Pagination の間だけに
        // 効くようにする（帯と table の間に page 地を挟まない）。
        <div className="w-min min-w-full">
          {/* 追補 S17（Opus P1-2 / P2-2 / P2-3、AC-L3-2 / AC-L3-4）: 帯自体は overflow-hidden
              にし、子（PaginationSummary root）を min-w-0 + truncate で ellipsis させる
              （flex item への直接 truncate は min-width:auto で hard clip になる）。
              Gated Amendment 5 S39（owner L3 run 4「灰色の塊に入れ込んだのがミス、角が角、
              下に線を引く程度」）: 件数行は page 地色（bg-background）。灰色面（--list-head）
              は列見出しのみに限定する。Gated Amendment 7 S47（owner run 6「上端の線だけ
              外そう」）: 件数行の下線（border-b border-border）を撤去。 */}
          <div className="sticky top-0 z-20 flex h-10 w-full items-center overflow-hidden bg-background px-2 [&>div]:min-w-0 [&>div]:truncate">
            <PaginationSummary
              page={pagination.page}
              perPage={pagination.perPage}
              totalCount={pagination.totalCount}
            />
          </div>
          {isLoading ? (skeleton ?? <ListSkeleton />) : children}
        </div>
      ) : (
        <>
          {showTopSummary && pagination ? (
            <PaginationSummary
              page={pagination.page}
              perPage={pagination.perPage}
              totalCount={pagination.totalCount}
            />
          ) : null}
          {isLoading ? (skeleton ?? <ListSkeleton />) : children}
        </>
      )}

      {hasResults && pagination && (
        <Pagination
          page={pagination.page}
          perPage={pagination.perPage}
          totalCount={pagination.totalCount}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
