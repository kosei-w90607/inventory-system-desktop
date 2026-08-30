// REQ-206 / REQ-207: 棚卸し記録詳細。

import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, ClipboardList, PackageSearch } from "lucide-react";

import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MovementTable } from "@/features/stock-movements/components/MovementTable";
import type { StocktakeStatus } from "@/lib/bindings";
import { commands } from "@/lib/bindings";
import { describeError } from "@/lib/describe-error";
import { unwrapResult } from "@/lib/invoke";
import { queryKeys } from "@/lib/query-keys";
import { normalizeReturnTo } from "@/lib/return-to";
import { formatDateTime, formatYen } from "./types";

export interface StocktakeRecordDetailPageProps {
  stocktakeId: number;
  returnTo?: string;
}

const STATUS_LABELS: Record<StocktakeStatus, string> = {
  in_progress: "進行中",
  completed: "完了",
};

function formatQuantity(value: number, unit: string): string {
  return `${value.toLocaleString("ja-JP")} ${unit}`;
}

function formatSignedQuantity(value: number, unit: string): string {
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("ja-JP")} ${unit}`;
}

function formatOptionalQuantity(value: number | null, unit: string): string {
  return value === null ? "—" : formatQuantity(value, unit);
}

export function StocktakeRecordDetailPage({
  stocktakeId,
  returnTo,
}: StocktakeRecordDetailPageProps) {
  const backHref = normalizeReturnTo(returnTo, "/inventory/records");
  const detailQuery = useQuery({
    queryKey: queryKeys.inventoryRecords.stocktakeDetail(stocktakeId),
    queryFn: () =>
      unwrapResult(commands.getStocktakeRecord(stocktakeId), {
        source: "commands",
        cmd: "get_stocktake_record",
      }),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 0,
  });

  if (detailQuery.isLoading) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (detailQuery.isError) {
    return (
      <div className="space-y-4 p-6">
        <PageHeader title="棚卸し詳細" />
        <Alert variant="destructive">
          <AlertTitle>
            {describeError(detailQuery.error, "棚卸し記録を読み込めませんでした")}
          </AlertTitle>
          <AlertDescription>
            記録IDを確認するか、在庫変動履歴から開き直してください。
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline">
          <Link to={backHref}>
            <ArrowLeft aria-hidden="true" />
            前の画面へ戻る
          </Link>
        </Button>
      </div>
    );
  }

  const detail = detailQuery.data;
  if (!detail) return null;

  return (
    <div className="space-y-5 p-6">
      <PageHeader
        title={`棚卸し #${String(detail.id)}`}
        actions={
          <Button asChild variant="outline">
            <Link to={backHref}>
              <ArrowLeft aria-hidden="true" />
              前の画面へ戻る
            </Link>
          </Button>
        }
      />

      <section className="rounded-md border p-4">
        <div className="grid gap-3 text-sm sm:grid-cols-4 lg:grid-cols-7">
          <div>
            <span className="text-muted-foreground">開始日時</span>
            <div className="font-mono font-medium tabular-nums">
              {formatDateTime(detail.started_at)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">完了日時</span>
            <div className="font-mono font-medium tabular-nums">
              {detail.completed_at === null ? "—" : formatDateTime(detail.completed_at)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">状態</span>
            <div>
              <Badge variant="outline">{STATUS_LABELS[detail.status]}</Badge>
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">対象商品数</span>
            <div className="font-medium">{detail.item_count.toLocaleString("ja-JP")} 件</div>
          </div>
          <div>
            <span className="text-muted-foreground">補正件数</span>
            <div className="font-medium">{detail.corrected_count.toLocaleString("ja-JP")} 件</div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-muted-foreground">仕入原価総額</span>
            <div className="font-medium">
              {detail.total_cost === null ? "—" : formatYen(detail.total_cost)}
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3 rounded-md border p-4">
        <h2 className="text-lg font-semibold">補正明細</h2>
        {detail.items.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="補正明細はありません"
            description="この棚卸しで在庫数の補正は記録されていません"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>商品コード</TableHead>
                <TableHead>商品名</TableHead>
                <TableHead>部門</TableHead>
                <TableHead className="text-right">開始時在庫</TableHead>
                <TableHead className="text-right">実カウント</TableHead>
                <TableHead className="text-right">補正差異</TableHead>
                <TableHead className="text-right">評価原価</TableHead>
                <TableHead className="text-right">ロス原価</TableHead>
                <TableHead>在庫変動</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {detail.items.map((item) => {
                const lossCost =
                  item.adjustment_quantity < 0 && item.valuation_cost_price !== null
                    ? Math.abs(item.adjustment_quantity) * item.valuation_cost_price
                    : 0;
                return (
                  <TableRow key={item.product_code}>
                    <TableCell className="font-mono font-medium">{item.product_code}</TableCell>
                    <TableCell className="min-w-[12rem] whitespace-normal">
                      {item.product_name}
                    </TableCell>
                    <TableCell>{item.department_name}</TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatQuantity(item.system_stock, item.stock_unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatOptionalQuantity(item.actual_count, item.stock_unit)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatSignedQuantity(item.adjustment_quantity, item.stock_unit)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.valuation_cost_price === null
                        ? "—"
                        : formatYen(item.valuation_cost_price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{formatYen(lossCost)}</TableCell>
                    <TableCell>
                      <Link
                        className="font-medium text-primary underline-offset-4 hover:underline"
                        to="/stock/$code/movements"
                        params={{ code: item.product_code }}
                      >
                        {item.product_code} の在庫変動履歴
                      </Link>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-3 rounded-md border p-4">
        <h2 className="text-lg font-semibold">関連する在庫変動</h2>
        {detail.movements.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="関連する在庫変動がありません"
            description="この記録に紐づく有効な在庫変動は見つかりません"
          />
        ) : (
          <MovementTable movements={detail.movements} />
        )}
      </section>
    </div>
  );
}
