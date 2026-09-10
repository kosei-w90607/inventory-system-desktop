import { Check, Plus } from "lucide-react";
import { useRef, useState } from "react";

import { EmptyState } from "@/components/patterns/EmptyState";
import { ListSkeleton } from "@/components/patterns/ListSkeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Supplier } from "@/lib/bindings";
import { CreateSupplierDialog } from "./CreateSupplierDialog";

export function supplierCurrentLabel(
  suppliers: Supplier[],
  selected: number | null,
  leadingLabel: string,
): string {
  return selected === null
    ? leadingLabel
    : (suppliers.find((s) => s.id === selected)?.name ?? "取引先を確認できません");
}

export function SupplierPickerDialog({
  open,
  onOpenChange,
  suppliers,
  isLoading,
  isError,
  onRetry,
  leadingLabel,
  selected,
  onSelect,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suppliers: Supplier[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  leadingLabel: string;
  selected: number | null;
  onSelect: (id: number | null) => void;
  onCreated: (supplier: Supplier) => Promise<void>;
}) {
  const [query, setQuery] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  // backend は id 順のまま、名前で目視走査できるよう picker 内だけ並べ替える。
  const filtered = [...suppliers]
    .sort((a, b) => a.name.localeCompare(b.name, "ja"))
    .filter((s) => s.name.includes(query.trim()));
  const currentName = supplierCurrentLabel(suppliers, selected, leadingLabel);
  const select = (id: number | null) => {
    onSelect(id);
    onOpenChange(false);
  };
  const rows = [{ id: null, name: leadingLabel }, ...filtered];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] flex-col"
        // 内側 CreateSupplierDialog の submit が React portal 経由で host の <form>
        // (ProductForm) へ bubble し、商品保存を誤発火するのを止める。
        onSubmit={(event) => {
          event.stopPropagation();
        }}
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current =
            document.activeElement instanceof HTMLElement ? document.activeElement : null;
          setQuery("");
          searchRef.current?.focus();
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          triggerRef.current?.focus();
        }}
      >
        <DialogHeader>
          <DialogTitle>取引先を選択</DialogTitle>
          <DialogDescription>名前で検索して選ぶか、取引先を新規登録します。</DialogDescription>
        </DialogHeader>
        <div className="grid gap-1">
          <Label htmlFor="supplier-picker-search">取引先名で検索</Label>
          <Input
            id="supplier-picker-search"
            type="search"
            ref={searchRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
            }}
          />
        </div>
        {/* GA4 AC15 の class 順序を保持する（Tailwind formatter の並べ替え対象外）。 */}
        {/* prettier-ignore */}
        <div className="flex shrink-0 items-center gap-3 rounded-md border border-border-strong border-l-4 border-l-primary bg-row-current px-4 py-3">
          <span className="text-xs text-muted-foreground">現在の選択</span>
          <span>{currentName}</span>
        </div>
        {isLoading ? (
          <ListSkeleton rows={5} columns={2} />
        ) : isError ? (
          <Alert variant="destructive">
            <AlertDescription>
              取引先一覧を取得できませんでした。
              <Button type="button" variant="outline" onClick={onRetry}>
                再試行
              </Button>
            </AlertDescription>
          </Alert>
        ) : query.trim() !== "" && filtered.length === 0 ? (
          <EmptyState title="該当する取引先はありません" />
        ) : (
          <div className="max-h-[50vh] overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="sr-only">選択</th>
                  <th className="sr-only">取引先名</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id ?? "none"}
                    className={
                      row.id === selected
                        ? "border-l-4 border-l-primary bg-row-current"
                        : "border-l-4 border-l-transparent"
                    }
                    onClick={() => {
                      select(row.id);
                    }}
                  >
                    <td className="w-28 px-3 py-2">
                      {row.id === selected ? (
                        <span className="flex items-center gap-1">
                          <Check aria-hidden="true" className="size-4" />
                          <Badge variant="outline">選択中</Badge>
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <Button
                        type="button"
                        variant="ghost"
                        className="h-auto w-full justify-start rounded-none px-3 py-2 text-left whitespace-normal"
                        onClick={(event) => {
                          event.stopPropagation();
                          select(row.id);
                        }}
                      >
                        {row.name}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex shrink-0 items-center justify-between gap-2">
          <Button
            type="button"
            onClick={() => {
              setCreateOpen(true);
            }}
          >
            <Plus aria-hidden="true" />
            新しい取引先を追加
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              onOpenChange(false);
            }}
          >
            閉じる
          </Button>
        </div>
        <CreateSupplierDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            searchRef.current?.focus();
          }}
          onCreated={async (supplier) => {
            await onCreated(supplier);
            onSelect(supplier.id);
            setCreateOpen(false);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
