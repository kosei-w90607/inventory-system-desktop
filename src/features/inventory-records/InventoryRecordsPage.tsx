// src/features/inventory-records/InventoryRecordsPage.tsx
//
// REQ-206: 入出庫履歴ハブ。初回実装は廃棄・破損記録を具体例にする。

import { Eye, PackageSearch } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { useState } from "react";

import { LIST_PER_PAGE_OPTIONS } from "@/components/patterns/list-per-page";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/patterns/EmptyState";
import { PageHeader } from "@/components/patterns/PageHeader";
import { SearchBar } from "@/components/patterns/SearchBar";
import { PageShell } from "@/components/patterns/PageShell";
import { Pagination } from "@/components/patterns/Pagination";
import { commands } from "@/lib/bindings";
import { unwrapResult } from "@/lib/invoke";
import { scrollPageToTop } from "@/lib/page-scroll";
import { queryKeys } from "@/lib/query-keys";
import {
  INVENTORY_RECORD_STATUS_OPTIONS,
  INVENTORY_RECORD_TYPE_OPTIONS,
  formatDateTime,
  formatRecordStatus,
  formatRecordType,
  normalizeInventoryRecordsSearch,
  type InventoryRecordsSearch,
} from "./types";

export interface InventoryRecordsPageProps {
  search: InventoryRecordsSearch;
  onSearchChange: (updater: (prev: InventoryRecordsSearch) => InventoryRecordsSearch) => void;
}

function buildInventoryRecordsReturnTo(search: ReturnType<typeof normalizeInventoryRecordsSearch>) {
  const params = new URLSearchParams();
  if (search.recordType !== "all") params.set("recordType", search.recordType);
  if (search.dateFrom) params.set("dateFrom", search.dateFrom);
  if (search.dateTo) params.set("dateTo", search.dateTo);
  if (search.q) params.set("q", search.q);
  if (search.recordId !== undefined) params.set("recordId", String(search.recordId));
  if (search.departmentId !== undefined) params.set("departmentId", String(search.departmentId));
  if (search.status !== "all") params.set("status", search.status);
  if (search.page > 1) params.set("page", String(search.page));

  const query = params.toString();
  return query ? `/inventory/records?${query}` : "/inventory/records";
}

// detail_route は DTO 由来の runtime 文字列 (compile-time に既知の route union ではない)。
// batch A packet P2-2 の採用案どおり <Link to={string}> で SPA 遷移のみ保証し、
// to は pathname のみ・returnTo は search object 経由で付与する
// (buildLocation は to をパス解決専用に扱うため文字列へ直接 query を埋め込まない)。
function buildDetailLinkProps(
  detailRoute: string,
  returnTo: string,
): { to: string; search: { returnTo: string } } {
  return { to: detailRoute, search: { returnTo } };
}

export function InventoryRecordsPage({ search, onSearchChange }: InventoryRecordsPageProps) {
  const normalized = normalizeInventoryRecordsSearch(search);
  const returnTo = buildInventoryRecordsReturnTo(normalized);
  const [perPage, setPerPage] = useState<(typeof LIST_PER_PAGE_OPTIONS)[number]>(50);

  const departmentsQuery = useQuery({
    queryKey: queryKeys.inventoryRecords.departments(),
    queryFn: () =>
      unwrapResult(commands.listDepartments(), {
        source: "commands",
        cmd: "list_departments",
      }),
    staleTime: 10 * 60_000,
    gcTime: 30 * 60_000,
    retry: 0,
  });
  const recordsQuery = useQuery({
    queryKey: queryKeys.inventoryRecords.list({ ...normalized, perPage }),
    queryFn: () =>
      unwrapResult(
        commands.listInventoryRecords({
          record_type: normalized.recordType === "all" ? null : normalized.recordType,
          date_from: normalized.dateFrom ?? null,
          date_to: normalized.dateTo ?? null,
          record_id: normalized.recordId ?? null,
          product_keyword: normalized.q ?? null,
          department_id: normalized.departmentId ?? null,
          status: normalized.status === "all" ? null : normalized.status,
          page: normalized.page,
          per_page: perPage,
        }),
        { source: "commands", cmd: "list_inventory_records" },
      ),
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: 0,
  });

  const updateSearch = (patch: Partial<InventoryRecordsSearch>, resetPage = false) => {
    onSearchChange((prev) => ({
      ...prev,
      ...patch,
      page: resetPage ? 1 : (patch.page ?? prev.page),
    }));
  };
  const updateKeywordSearch = (value: string) => {
    updateSearch({ q: value || undefined }, true);
  };
  // filter-empty reset action（catalog ⑥、SPEC-UIBB-1/2）: 65 §65.4.1 の検索条件のいずれかが
  // 既定値以外か。
  const isFilterDefault =
    normalized.recordType === "all" &&
    normalized.dateFrom === undefined &&
    normalized.dateTo === undefined &&
    normalized.q === undefined &&
    normalized.recordId === undefined &&
    normalized.departmentId === undefined &&
    normalized.status === "all";
  const resetFilters = () => {
    onSearchChange((prev) => ({
      ...prev,
      recordType: undefined,
      dateFrom: undefined,
      dateTo: undefined,
      q: undefined,
      recordId: undefined,
      departmentId: undefined,
      status: undefined,
      page: undefined,
    }));
  };

  return (
    <PageShell>
      <PageHeader
        title="入出庫履歴"
        subtitle="入庫・返品・販売出庫・廃棄などの業務記録を後から確認します"
      />

      <section className="space-y-3 rounded-md border p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground" htmlFor="records-type">
              記録種別
            </label>
            <Select
              value={normalized.recordType}
              onValueChange={(value) => {
                const recordType = INVENTORY_RECORD_TYPE_OPTIONS.find(
                  (option) => option.value === value,
                )?.value;
                if (recordType !== undefined) updateSearch({ recordType }, true);
              }}
            >
              <SelectTrigger id="records-type" className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVENTORY_RECORD_TYPE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground" htmlFor="records-date-from">
              開始日
            </label>
            <input
              id="records-date-from"
              className="h-9 rounded-md border border-input bg-control-surface px-3 text-sm"
              type="date"
              value={normalized.dateFrom ?? ""}
              onChange={(event) => {
                updateSearch({ dateFrom: event.currentTarget.value || undefined }, true);
              }}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground" htmlFor="records-date-to">
              終了日
            </label>
            <input
              id="records-date-to"
              className="h-9 rounded-md border border-input bg-control-surface px-3 text-sm"
              type="date"
              value={normalized.dateTo ?? ""}
              onChange={(event) => {
                updateSearch({ dateTo: event.currentTarget.value || undefined }, true);
              }}
            />
          </div>
          <SearchBar value={search.q ?? ""} debounceMs={200} onSearchChange={updateKeywordSearch} />
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground" htmlFor="records-id">
              記録ID
            </label>
            <input
              id="records-id"
              className="h-9 w-28 rounded-md border border-input bg-control-surface px-3 text-sm"
              type="number"
              min="1"
              value={normalized.recordId ?? ""}
              onChange={(event) => {
                const value = event.currentTarget.value;
                updateSearch({ recordId: value ? Number(value) : undefined }, true);
              }}
            />
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground" htmlFor="records-department">
              部門
            </label>
            <Select
              value={normalized.departmentId == null ? "all" : String(normalized.departmentId)}
              disabled={departmentsQuery.isLoading || departmentsQuery.isError}
              onValueChange={(value) => {
                updateSearch({ departmentId: value === "all" ? undefined : Number(value) }, true);
              }}
            >
              <SelectTrigger id="records-department" className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">すべて</SelectItem>
                {(departmentsQuery.data ?? []).map((department) => (
                  <SelectItem key={department.id} value={String(department.id)}>
                    {department.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground" htmlFor="records-status">
              状態
            </label>
            <Select
              value={normalized.status}
              onValueChange={(value) => {
                const status = INVENTORY_RECORD_STATUS_OPTIONS.find(
                  (option) => option.value === value,
                )?.value;
                if (status !== undefined) updateSearch({ status }, true);
              }}
            >
              <SelectTrigger id="records-status" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {INVENTORY_RECORD_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-1">
            <label className="text-sm text-muted-foreground" htmlFor="inventory-records-per-page">
              表示件数
            </label>
            <Select
              value={String(perPage)}
              onValueChange={(value) => {
                const next = LIST_PER_PAGE_OPTIONS.find((option) => String(option) === value);
                if (next === undefined) return;
                setPerPage(next);
                updateSearch({}, true);
                scrollPageToTop();
              }}
            >
              <SelectTrigger id="inventory-records-per-page" className="w-[7rem]">
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
        <p className="text-sm text-muted-foreground">
          商品・部門での絞り込みは、CSV取込みでは取込み明細、棚卸しでは差異のあった商品が対象です。
        </p>
      </section>

      {recordsQuery.isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : recordsQuery.isError ? (
        <Alert variant="destructive">
          <AlertTitle>入出庫履歴の取得に失敗しました</AlertTitle>
          <AlertDescription>
            検索条件を変えるか、しばらくしてからもう一度お試しください。
          </AlertDescription>
        </Alert>
      ) : recordsQuery.data?.items.length === 0 ? (
        <EmptyState
          icon={PackageSearch}
          title="入出庫履歴がありません"
          description="検索条件に該当する業務記録はありません"
          // 絞り込みが既定値以外のときだけ reset action を出す（catalog ⑥、SPEC-UIBB-1/2）。
          action={
            !isFilterDefault ? (
              <Button type="button" variant="outline" onClick={resetFilters}>
                絞り込みを解除
              </Button>
            ) : undefined
          }
        />
      ) : recordsQuery.data ? (
        <div className="space-y-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>種別</TableHead>
                <TableHead>記録ID</TableHead>
                <TableHead>業務日付</TableHead>
                <TableHead>代表商品</TableHead>
                <TableHead className="text-right">明細数</TableHead>
                <TableHead>状態</TableHead>
                <TableHead>記録日時</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordsQuery.data.items.map((record) => {
                const isInProgressStocktake =
                  record.record_type === "stocktake" && record.status === "in_progress";
                const representativeItem = isInProgressStocktake
                  ? "-"
                  : record.record_type === "stocktake" && record.item_count === 0
                    ? "差異なし"
                    : record.representative_item;
                return (
                  <TableRow key={`${record.record_type}-${String(record.record_id)}`}>
                    <TableCell>{formatRecordType(record.record_type)}</TableCell>
                    <TableCell className="font-mono tabular-nums">
                      #{String(record.record_id)}
                    </TableCell>
                    <TableCell>{record.business_date}</TableCell>
                    <TableCell className="min-w-[12rem] whitespace-normal">
                      {representativeItem}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {isInProgressStocktake ? "-" : record.item_count}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{formatRecordStatus(record.status)}</Badge>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums">
                      {formatDateTime(record.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button asChild variant="outline" size="sm">
                        <Link {...buildDetailLinkProps(record.detail_route, returnTo)}>
                          <Eye aria-hidden="true" />
                          詳細を見る
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          <Pagination
            page={recordsQuery.data.page}
            perPage={recordsQuery.data.per_page}
            totalCount={recordsQuery.data.total_count}
            onPageChange={(page) => {
              updateSearch({ page });
            }}
          />
        </div>
      ) : null}
    </PageShell>
  );
}
