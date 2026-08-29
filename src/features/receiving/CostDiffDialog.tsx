import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { useState } from "react";

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
import { useReviseProductPrice } from "@/features/products/hooks/useReviseProductPrice";
import { commands, type CostDiff } from "@/lib/bindings";
import { describeError } from "@/lib/describe-error";
import { unwrapResult } from "@/lib/invoke";

type UpdateState =
  | { status: "idle" }
  | { status: "updating" }
  | { status: "success"; newCostPrice: number }
  | { status: "error"; detail: string };

function formatYen(value: number): string {
  return `${value.toLocaleString("ja-JP")} 円`;
}

export function CostDiffDialog({
  costDiffs,
  open,
  onOpenChange,
}: {
  costDiffs: CostDiff[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [rowStates, setRowStates] = useState<Record<string, UpdateState>>({});
  const revisePrice = useReviseProductPrice();
  const allProcessed =
    costDiffs.length > 0 &&
    costDiffs.every(
      (diff) => (rowStates[diff.product_code] ?? { status: "idle" as const }).status === "success",
    );

  async function updateMasterCost(diff: CostDiff) {
    setRowStates((current) => ({
      ...current,
      [diff.product_code]: { status: "updating" },
    }));
    try {
      const product = await unwrapResult(commands.getProduct(diff.product_code), {
        source: "commands",
        cmd: "get_product",
      });
      await revisePrice.mutateAsync({
        product_code: diff.product_code,
        new_selling_price: product.selling_price,
        new_cost_price: diff.received_cost_price,
        assign_supplier_id: null,
      });
      setRowStates((current) => ({
        ...current,
        [diff.product_code]: { status: "success", newCostPrice: diff.received_cost_price },
      }));
    } catch (error) {
      setRowStates((current) => ({
        ...current,
        [diff.product_code]: { status: "error", detail: describeError(error) },
      }));
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen && revisePrice.isPending) return;
        onOpenChange(nextOpen);
      }}
    >
      {/* gated Amendment 5（owner L3 P1 — merge blocker）: 商品ごとの確認を必須にする
          61 §61.5 契約に反し、外側クリック・Escape・右上×での暗黙 dismiss が入庫記録の
          二重加算を誘発した実機不具合の是正。終了経路は footer の明示ボタンのみに限定する
          （共通 dialog.tsx は無変更、showCloseButton / onPointerDownOutside /
          onEscapeKeyDown はいずれも既存 prop）。 */}
      <DialogContent
        className="max-h-[80vh] overflow-y-auto sm:max-w-2xl"
        showCloseButton={false}
        onPointerDownOutside={(e) => {
          e.preventDefault();
        }}
        onEscapeKeyDown={(e) => {
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle>入庫原価を確認してください</DialogTitle>
          <DialogDescription>
            今回の実原価が商品マスタと異なります。更新する商品を1件ずつ確認してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {costDiffs.map((diff) => {
            const state = rowStates[diff.product_code] ?? { status: "idle" as const };
            return (
              <section
                key={diff.product_code}
                className="space-y-3 rounded-md border p-4"
                aria-label={`${diff.product_name}の原価差分`}
              >
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">商品名</dt>
                    <dd className="font-semibold">{diff.product_name}</dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">商品コード</dt>
                    <dd className="font-medium">{diff.product_code}</dd>
                  </div>
                </dl>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-muted-foreground">マスタ原価</dt>
                    <dd className="font-medium">
                      {formatYen(
                        state.status === "success" ? state.newCostPrice : diff.master_cost_price,
                      )}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-muted-foreground">今回の実原価</dt>
                    <dd className="font-medium">{formatYen(diff.received_cost_price)}</dd>
                  </div>
                </dl>

                {state.status === "success" ? (
                  <Alert role="status" className="border-success bg-success-soft text-success">
                    <CheckCircle2 aria-hidden="true" className="text-success" />
                    <AlertTitle>マスタ原価を更新しました</AlertTitle>
                  </Alert>
                ) : state.status === "error" ? (
                  <Alert variant="destructive" role="alert">
                    <AlertTriangle aria-hidden="true" />
                    <AlertTitle>マスタ原価の更新に失敗しました</AlertTitle>
                    <AlertDescription className="space-y-2">
                      <p>{state.detail}</p>
                      <Button
                        type="button"
                        variant="outline"
                        disabled={revisePrice.isPending}
                        onClick={() => void updateMasterCost(diff)}
                      >
                        再試行する
                      </Button>
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Button
                    type="button"
                    disabled={revisePrice.isPending}
                    onClick={() => void updateMasterCost(diff)}
                  >
                    {state.status === "updating"
                      ? "マスタ原価を更新しています"
                      : "マスタ原価をこの実原価に更新する"}
                  </Button>
                )}
              </section>
            );
          })}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={revisePrice.isPending}
            onClick={() => {
              onOpenChange(false);
            }}
          >
            {allProcessed ? "閉じる" : "見送って閉じる"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
