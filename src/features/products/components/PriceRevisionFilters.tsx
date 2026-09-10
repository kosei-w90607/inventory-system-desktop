import { useState } from "react";

import { DepartmentFilter } from "@/components/patterns/DepartmentFilter";
import { LIST_PER_PAGE_OPTIONS } from "@/components/patterns/list-per-page";
import { SearchBar } from "@/components/patterns/SearchBar";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Department, Supplier } from "@/lib/bindings";
import type { UseQueryResult } from "@tanstack/react-query";
import type {
  NormalizedPriceRevisionSearch,
  PriceRevisionSearch,
  PriceRevisionSearchPatch,
} from "../priceRevisionSearch";
import {
  SupplierPickerDialog,
  supplierCurrentLabel,
} from "@/features/suppliers/components/SupplierPickerDialog";

export function PriceRevisionFilters({
  search,
  normalized,
  suppliersQuery,
  departmentsQuery,
  onPatch,
  perPage,
  onPerPageChange,
}: {
  search: PriceRevisionSearch;
  normalized: NormalizedPriceRevisionSearch;
  suppliersQuery: UseQueryResult<Supplier[]>;
  departmentsQuery: UseQueryResult<Department[]>;
  onPatch: (patch: PriceRevisionSearchPatch) => void;
  perPage: (typeof LIST_PER_PAGE_OPTIONS)[number];
  onPerPageChange: (value: (typeof LIST_PER_PAGE_OPTIONS)[number]) => void;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const departments = (departmentsQuery.data ?? []).map(({ id, name }) => ({ id, name }));

  return (
    <div className="space-y-3 rounded-lg border bg-card p-4">
      {/* items-end で上置き Label の検索欄と隣接 control の下辺を揃える。 */}
      <div className="flex flex-wrap items-end gap-3">
        <SearchBar
          value={search.q ?? ""}
          debounceMs={200}
          placeholder="商品コード・商品名・JAN・メーカー品番で検索"
          onSearchChange={(value) => {
            onPatch({ q: value === "" ? undefined : value });
          }}
        />
        {/* GA2: owner L3 run 1 AC-L3-3 で flex-wrap の折り返しにより Label と trigger が分離し、
            一様 gap-3 では群化が欠けたため、同じ wrapper に置いて群化を維持する。 */}
        <div className="flex items-center gap-2">
          <label
            id="price-revision-supplier-label"
            className="text-sm text-muted-foreground"
            htmlFor="price-revision-supplier"
          >
            取引先
          </label>
          <Button
            type="button"
            variant="outline"
            id="price-revision-supplier"
            className="w-48 justify-between bg-control-surface"
            aria-haspopup="dialog"
            aria-labelledby="price-revision-supplier-label price-revision-supplier"
            disabled={suppliersQuery.isLoading}
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            {supplierCurrentLabel(
              suppliersQuery.data ?? [],
              normalized.supplier ?? null,
              "すべての取引先",
            )}
          </Button>
        </div>
        <DepartmentFilter
          options={departments}
          selected={normalized.dept ?? null}
          disabled={departmentsQuery.isLoading}
          idPrefix="price-revision-department"
          widthClass="w-[11rem]"
          onChange={(dept) => {
            onPatch({ dept });
          }}
        />
        <label htmlFor="price-revision-discontinued" className="flex items-center gap-2 text-sm">
          <Checkbox
            id="price-revision-discontinued"
            checked={normalized.discontinued}
            onCheckedChange={(checked) => {
              onPatch({ discontinued: checked === true ? true : undefined });
            }}
          />
          廃番を含む
        </label>
        <div className="flex items-center gap-2">
          <label
            id="price-revision-per-page-label"
            htmlFor="price-revision-per-page"
            className="text-sm text-muted-foreground"
          >
            表示件数
          </label>
          <Select
            value={String(perPage)}
            onValueChange={(value) => {
              const next = LIST_PER_PAGE_OPTIONS.find((option) => String(option) === value);
              if (next !== undefined) {
                onPerPageChange(next);
              }
            }}
          >
            <SelectTrigger id="price-revision-per-page" className="w-[7rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIST_PER_PAGE_OPTIONS.map((option) => (
                <SelectItem key={option} value={String(option)}>
                  {option} 件
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      {normalized.supplier !== undefined ? (
        <label
          htmlFor="price-revision-include-unassigned"
          className="flex items-center gap-2 text-sm"
        >
          <Checkbox
            id="price-revision-include-unassigned"
            checked={normalized.includeUnassigned}
            onCheckedChange={(checked) => {
              onPatch({ includeUnassigned: checked === true });
            }}
          />
          取引先未設定の商品も含める
        </label>
      ) : null}
      {/* 取引先の取得失敗と再試行は picker 内へ集約する。 */}
      {departmentsQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          部門一覧を取得できませんでした。{" "}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => void departmentsQuery.refetch()}
          >
            再試行
          </Button>
        </p>
      ) : null}
      <SupplierPickerDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        suppliers={suppliersQuery.data ?? []}
        isLoading={suppliersQuery.isLoading}
        isError={suppliersQuery.isError}
        onRetry={() => void suppliersQuery.refetch()}
        leadingLabel="すべての取引先"
        selected={normalized.supplier ?? null}
        onSelect={(id) => {
          onPatch({ supplier: id });
        }}
        onCreated={async () => {
          await suppliersQuery.refetch();
        }}
      />
    </div>
  );
}
