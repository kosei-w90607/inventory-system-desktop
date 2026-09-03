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
   * 識別列固定（DSR-22 mapping）の予約 prop。Lane 2 では描画に影響しない
   * （Lane 3〜5 で横 overflow 実発生画面を確認してから実装、D-2）。
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
  // （--list-head）にし、bg-muted は残さない。左右端を揃えるため tr にも敷く。
  "[&_thead_th]:bg-list-head",
  "[&_thead_tr]:bg-list-head",
  "[&_thead_th]:border-b-2",
  "[&_thead_th]:border-border",
  "[&_tbody_td]:border-b",
  "[&_tbody_td]:border-border",
  "[&_tbody_tr:last-child_td]:border-b-0",
];

export function ListShell({
  toolbar,
  toolbarSecondary,
  pagination,
  topSummary = false,
  stickyHeader = false,
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
        stickyHeader && STICKY_TABLE_CLASSES,
        stickyHeader && (showTopSummary ? "[&_thead_th]:top-10" : "[&_thead_th]:top-0"),
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
        <div>
          <div className="sticky top-0 z-20 flex h-10 w-full items-center truncate bg-list-head px-2">
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
