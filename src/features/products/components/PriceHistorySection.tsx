import { useCallback, useEffect, useState } from "react";

import { FormSection } from "@/components/patterns/FormSection";
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { commands, type PriceHistoryEntry } from "@/lib/bindings";
import { formatDateTime } from "@/features/inventory-records/types";
import { describeError } from "@/lib/describe-error";
import { unwrapResult } from "@/lib/invoke";

const yenFormatter = new Intl.NumberFormat("ja-JP", {
  style: "currency",
  currency: "JPY",
  maximumFractionDigits: 0,
});

export function PriceHistorySection({ productCode }: { productCode: string }) {
  const [limit, setLimit] = useState(10);
  const [entries, setEntries] = useState<PriceHistoryEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await unwrapResult(commands.listPriceHistory(productCode, limit), {
        source: "commands",
        cmd: "list_price_history",
      });
      setEntries(result);
    } catch (loadError) {
      setError(describeError(loadError));
    } finally {
      setIsLoading(false);
    }
  }, [limit, productCode]);

  useEffect(() => {
    void load();
  }, [load, retryKey]);

  return (
    <FormSection
      title="価格履歴"
      description={`直近 ${String(limit)} 件の売価・原価の変更を新しい順に表示します。`}
    >
      {isLoading ? <p>読み込み中…</p> : null}
      {!isLoading && error !== null ? (
        <div className="space-y-2">
          <p className="text-sm text-destructive" role="alert">
            価格履歴を取得できませんでした: {error}
          </p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setRetryKey((value) => value + 1);
            }}
          >
            再試行
          </Button>
        </div>
      ) : null}
      {!isLoading && error === null && entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">価格履歴はまだありません</p>
      ) : null}
      {!isLoading && error === null && entries.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>変更日時</TableHead>
              <TableHead>売価</TableHead>
              <TableHead>原価</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell className="font-mono tabular-nums">
                  {formatDateTime(entry.changed_at)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {yenFormatter.format(entry.old_selling_price)} →{" "}
                  {yenFormatter.format(entry.new_selling_price)}
                </TableCell>
                <TableCell className="tabular-nums">
                  {yenFormatter.format(entry.old_cost_price)} →{" "}
                  {yenFormatter.format(entry.new_cost_price)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : null}
      {limit === 10 && !isLoading && error === null ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setLimit(100);
          }}
        >
          すべて表示
        </Button>
      ) : null}
    </FormSection>
  );
}
