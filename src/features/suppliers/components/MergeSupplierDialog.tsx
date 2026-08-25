import { useEffect, useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SupplierWithUsage } from "@/lib/bindings";
import { describeError } from "@/lib/describe-error";
import { isInvokeError } from "@/lib/invoke";
import { useMergeSuppliers } from "../hooks/useMergeSuppliers";

export function MergeSupplierDialog({
  source,
  suppliers,
  open,
  onOpenChange,
  onStale,
}: {
  source: SupplierWithUsage | null;
  suppliers: SupplierWithUsage[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStale: () => void;
}) {
  const mutation = useMergeSuppliers();
  const [stage, setStage] = useState<1 | 2>(1);
  const [targetId, setTargetId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (open) {
      setStage(1);
      setTargetId(null);
      setError(null);
      setNotFound(false);
    }
  }, [open, source?.id]);

  if (source === null) return null;
  const target = suppliers.find((supplier) => supplier.id === targetId);
  const submit = async () => {
    if (targetId === null || mutation.isPending) return;
    setError(null);
    setNotFound(false);
    try {
      const result = await mutation.mutateAsync({ sourceId: source.id, targetId });
      toast.success(
        `取引先を統合しました（${String(result.products_updated)}件の商品 / ${String(result.receiving_records_updated)}件の入庫記録）`,
      );
      onOpenChange(false);
    } catch (caught) {
      setNotFound(isInvokeError(caught) && caught.cmdError.kind === "not_found");
      setError(describeError(caught, "取引先を統合できませんでした"));
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!mutation.isPending) onOpenChange(next);
      }}
    >
      <DialogContent showCloseButton={!mutation.isPending}>
        <DialogHeader>
          <DialogTitle>取引先を統合</DialogTitle>
          <DialogDescription>
            {stage === 1
              ? `「${source.name}」を統合します。残す取引先を選んでください。`
              : `「${source.name}」を「${target?.name ?? ""}」に統合します。`}
          </DialogDescription>
        </DialogHeader>

        {stage === 1 ? (
          <div className="space-y-2">
            <Label htmlFor="merge-supplier-target">残す取引先</Label>
            <Select
              value={targetId?.toString()}
              onValueChange={(value) => {
                setTargetId(Number(value));
              }}
            >
              <SelectTrigger id="merge-supplier-target" className="w-full">
                <SelectValue placeholder="残す取引先を選んでください" />
              </SelectTrigger>
              <SelectContent>
                {suppliers
                  .filter((supplier) => supplier.id !== source.id)
                  .map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id.toString()}>
                      {supplier.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-base font-medium">
              {source.product_count}件の商品 / {source.receiving_record_count}
              件の入庫記録が付け替わります
            </p>
            <Alert variant="destructive" role="alert">
              <AlertDescription>
                この操作は元に戻せません。別の取引先を誤って統合しないよう、名称と件数を確認してください。
              </AlertDescription>
            </Alert>
            {error !== null ? (
              <Alert variant="destructive" role="alert">
                <AlertTitle>統合できませんでした</AlertTitle>
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
        )}

        <DialogFooter>
          {stage === 1 ? (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                disabled={targetId === null}
                onClick={() => {
                  setStage(2);
                }}
              >
                次へ
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  setStage(1);
                }}
              >
                残す取引先を選び直す
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={mutation.isPending}
                onClick={() => {
                  onOpenChange(false);
                }}
              >
                キャンセル
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={mutation.isPending}
                onClick={() => void submit()}
              >
                {mutation.isPending ? "統合中" : error === null ? "統合する" : "再試行"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
