// src/components/patterns/Pagination.tsx
//
// D-3 / D-4 / D-9: 範囲付き文言のページ送り（下部 Pagination）+ text-only の上部
// PaginationSummary。旧 features/products 配下の ProductPagination（UI-01a-D4）を
// patterns へ移設し、8 caller・catalog ⑩・DSR-22 の canonical を更新
// （components/patterns は features を import しない、Sonnet P2-4）。
// 設計: docs/design-system/02-component-catalog.md ⑩ ページネーション

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PaginationProps {
  page: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

interface PaginationRange {
  totalPages: number;
  from: number;
  to: number;
}

function computeRange(page: number, perPage: number, totalCount: number): PaginationRange {
  const totalPages = Math.max(1, Math.ceil(totalCount / perPage));
  const from = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const to = totalCount === 0 ? 0 : Math.min(page * perPage, totalCount);
  return { totalPages, from, to };
}

function rangeText(
  totalCount: number,
  from: number,
  to: number,
  page: number,
  totalPages: number,
): string {
  if (totalCount === 0) {
    return "0 件";
  }
  return `全 ${totalCount.toLocaleString("ja-JP")} 件のうち ${from.toLocaleString("ja-JP")}〜${to.toLocaleString("ja-JP")} 件を表示（${String(page)} / ${String(totalPages)} ページ）`;
}

export function Pagination({ page, perPage, totalCount, onPageChange }: PaginationProps) {
  const { totalPages, from, to } = computeRange(page, perPage, totalCount);
  if (totalPages <= 1) {
    return null;
  }
  const canPrev = totalCount > 0 && page > 1;
  const canNext = totalCount > 0 && page < totalPages;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="tabular-nums">{rangeText(totalCount, from, to, page, totalPages)}</div>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canPrev}
          aria-label="前のページ"
          onClick={() => {
            onPageChange(page - 1);
          }}
        >
          <ChevronLeft aria-hidden="true" />
          前へ
        </Button>
        <span className="min-w-20 text-center font-medium text-foreground tabular-nums">
          {page} / {totalPages} ページ
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!canNext}
          aria-label="次のページ"
          onClick={() => {
            onPageChange(page + 1);
          }}
        >
          次へ
          <ChevronRight aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

export interface PaginationSummaryProps {
  page: number;
  perPage: number;
  totalCount: number;
}

export function PaginationSummary({ page, perPage, totalCount }: PaginationSummaryProps) {
  const { totalPages, from, to } = computeRange(page, perPage, totalCount);

  return (
    <div className="text-sm text-muted-foreground tabular-nums">
      {rangeText(totalCount, from, to, page, totalPages)}
    </div>
  );
}
