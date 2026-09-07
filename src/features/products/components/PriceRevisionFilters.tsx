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
import { CreateSupplierDialog } from "./CreateSupplierDialog";

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
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar
          value={search.q ?? ""}
          debounceMs={200}
          placeholder="商品コード・商品名・JAN・メーカー品番で検索"
          onSearchChange={(value) => {
            onPatch({ q: value === "" ? undefined : value });
          }}
        />
        {/* Gated Amendment 2（owner L3 run 1 AC-L3-3）: 取引先の label/Select/追加ボタンは
            DOM 順序自体は既に隣接していたが、他項目と同じ flex-wrap + 一様 gap-3 のため
            群化されず離れて見えた。表示件数ブロック（下記）と同型の共通 wrapper で 1 unit にし、
            flex-wrap でも 3 要素が常に同じ行に留まるようにする。 */}
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground" htmlFor="price-revision-supplier">
            取引先
          </label>
          <Select
            disabled={suppliersQuery.isLoading}
            value={normalized.supplier === undefined ? "all" : String(normalized.supplier)}
            onValueChange={(value) => {
              onPatch({ supplier: value === "all" ? null : Number(value) });
            }}
          >
            <SelectTrigger id="price-revision-supplier" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべての取引先</SelectItem>
              {(suppliersQuery.data ?? []).map((supplier) => (
                <SelectItem key={supplier.id} value={String(supplier.id)}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setDialogOpen(true);
            }}
          >
            新しい取引先を追加
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
      {suppliersQuery.isError ? (
        <p role="alert" className="text-sm text-destructive">
          取引先一覧を取得できませんでした。{" "}
          <Button
            type="button"
            variant="link"
            className="h-auto p-0"
            onClick={() => void suppliersQuery.refetch()}
          >
            再試行
          </Button>
        </p>
      ) : null}
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
      <CreateSupplierDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreated={async (supplier) => {
          await suppliersQuery.refetch();
          onPatch({ supplier: supplier.id });
        }}
      />
    </div>
  );
}
