import { useState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TableCell, TableRow } from "@/components/ui/table";
import type { SupplierWithUsage } from "@/lib/bindings";
import { describeError } from "@/lib/describe-error";
import { isInvokeError } from "@/lib/invoke";
import { useRenameSupplier } from "../hooks/useRenameSupplier";

export function RenameSupplierRow({
  supplier,
  onMerge,
  onStale,
}: {
  supplier: SupplierWithUsage;
  onMerge: () => void;
  onStale: () => void;
}) {
  const mutation = useRenameSupplier();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(supplier.name);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  const cancel = () => {
    setEditing(false);
    setName(supplier.name);
    setError(null);
    setNotFound(false);
  };
  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed === "") {
      setError("取引先名を入力してください");
      return;
    }
    setError(null);
    setNotFound(false);
    try {
      await mutation.mutateAsync({ supplierId: supplier.id, name: trimmed });
      setEditing(false);
    } catch (caught) {
      setNotFound(isInvokeError(caught) && caught.cmdError.kind === "not_found");
      setError(describeError(caught, "取引先名を変更できませんでした"));
    }
  };

  return (
    <TableRow data-testid={`supplier-row-${String(supplier.id)}`}>
      <TableCell className="min-w-64 align-top">
        {editing ? (
          <div className="space-y-2">
            <Input
              aria-label={`${supplier.name}の新しい取引先名`}
              value={name}
              disabled={mutation.isPending}
              onChange={(event) => {
                setName(event.target.value);
                setError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Escape" && !mutation.isPending) {
                  event.preventDefault();
                  cancel();
                }
                if (event.key === "Enter" && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void submit();
                }
              }}
            />
            {error !== null ? (
              <Alert variant="destructive" role="alert">
                <AlertDescription className="space-y-2">
                  <p>{error}</p>
                  {notFound ? (
                    <div>
                      <p>一覧が古い可能性があります。</p>
                      <Button type="button" variant="outline" size="sm" onClick={onStale}>
                        一覧を再取得
                      </Button>
                    </div>
                  ) : null}
                </AlertDescription>
              </Alert>
            ) : null}
          </div>
        ) : (
          supplier.name
        )}
      </TableCell>
      <TableCell>{supplier.product_count}件</TableCell>
      <TableCell>{supplier.receiving_record_count}件</TableCell>
      <TableCell className="align-top">
        {editing ? (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              disabled={mutation.isPending}
              onClick={() => void submit()}
            >
              {mutation.isPending ? "保存中" : error === null ? "保存" : "再試行"}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={mutation.isPending}
              onClick={cancel}
            >
              キャンセル
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setName(supplier.name);
                setEditing(true);
              }}
            >
              名前を変更
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onMerge}>
              統合
            </Button>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
