// src/features/products/ProductListPage.tsx
//
// UI-01a 商品検索・一覧 page。

import { PackagePlus, PackageSearch } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/patterns/PageHeader";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/patterns/EmptyState";
import { SearchBar } from "@/components/patterns/SearchBar";
import { DepartmentFilter } from "@/components/patterns/DepartmentFilter";
import { ListShell } from "@/components/patterns/ListShell";
import { PageShell } from "@/components/patterns/PageShell";
import { LIST_PER_PAGE_OPTIONS } from "@/components/patterns/list-per-page";
import { ProductTable } from "./components/ProductTable";
import { PluBulkTargetConfirmDialog } from "./components/PluBulkTargetConfirmDialog";
import { useProductList } from "./hooks/useProductList";
import { buildProductListReturnTo } from "./lib/return-to";
import {
  PRODUCT_DISCONTINUED_OPTIONS,
  PRODUCT_PLU_OPTIONS,
  PRODUCT_SORT_DIRECTION_OPTIONS,
  PRODUCT_SORT_OPTIONS,
  updateProductListSearch,
  buildProductBulkFilter,
  type ProductListSearch,
} from "./search";
import { commands } from "@/lib/bindings";
import { unwrapResult } from "@/lib/invoke";
import { invalidateByContract, invalidationContract } from "@/lib/invalidation-contract";
import { scrollPageToTop } from "@/lib/page-scroll";

export interface ProductListPageProps {
  search: ProductListSearch;
  onSearchChange: (updater: (prev: ProductListSearch) => ProductListSearch) => void;
}

export function ProductListPage({ search, onSearchChange }: ProductListPageProps) {
  const { productsQuery, departmentsQuery, departmentOptions, normalizedSearch } = useProductList({
    search,
  });
  const queryClient = useQueryClient();
  // Gated Amendment 2 S12（owner L3 FAIL-4）: open/closed と「最後に選んだ target」を別 state に
  // 分離する。旧実装は bulkTarget: boolean | null の 1 state で兼用し、close 時に null へ戻すと
  // pluTarget={bulkTarget ?? true} の fallback で退出アニメーション中に反対文言へ反転していた
  // （b2389b19 起源の latent bug）。close は setBulkDialogOpen(false) のみで target を触らない。
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkTarget, setBulkTarget] = useState<boolean>(true);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const bulkMutation = useMutation({
    mutationFn: (pluTarget: boolean) =>
      unwrapResult(commands.bulkSetPluTarget(buildProductBulkFilter(normalizedSearch), pluTarget), {
        source: "commands",
        cmd: "bulk_set_plu_target",
      }),
    onSuccess: async (result) => {
      toast.success(
        `${result.updated_count.toLocaleString("ja-JP")} 件を更新しました（JAN 不備 ${result.invalid_jan_skipped_count.toLocaleString("ja-JP")} 件 / 廃番 ${result.discontinued_skipped_count.toLocaleString("ja-JP")} 件は対象外）`,
      );
      setBulkError(null);
      setBulkDialogOpen(false);
      await invalidateByContract(queryClient, invalidationContract.pluBulkTarget());
    },
    onError: () => {
      setBulkError("PLU対象の一括更新に失敗しました。内容を確認して、もう一度お試しください。");
    },
  });

  const updateSearch = (patch: Parameters<typeof updateProductListSearch>[1]) => {
    onSearchChange((prev) => updateProductListSearch(prev, patch));
  };
  const returnTo = buildProductListReturnTo(normalizedSearch);
  // filter-empty reset action（catalog ⑥、SPEC-UIBB-1/2）: q / dept / discontinued が既定値以外か。
  // sort / dir / perPage は結果集合を狭めないため対象外（分類軸どおり）。
  const isFilterDefault =
    normalizedSearch.q === undefined &&
    normalizedSearch.dept === undefined &&
    normalizedSearch.discontinued === "active" &&
    normalizedSearch.plu === "all";
  const totalCount = productsQuery.data?.total_count ?? 0;
  // Gated Amendment 3 S14（owner L3 run 2 懸念付き PASS、AC-L3-6 前段）: PLU 一括操作の
  // 説明文を実件数入りの 3 分岐にする。totalCount だけでは (b) 0 件と (c) 読込中を区別できない
  // ため productsQuery.data の有無で分岐する。
  const pluBulkCaptionDescription =
    productsQuery.data === undefined
      ? "件数を読み込んでいます。読み込みが終わると操作できます。"
      : totalCount > 0
        ? `絞り込みに一致する ${totalCount.toLocaleString("ja-JP")} 件すべてが対象です。他のページの商品も含みます。押すと確認画面が開きます。`
        : "絞り込みに一致する商品がないため実行できません。";

  const toolbar = (
    <div className="flex flex-wrap items-center gap-3">
      {/* live 型（UI-01a-D9、owner L3 2026-08-03）。controlled value は raw search.q — trim 済みの
          normalizedSearch.q を結線すると live 反映のたびに trim 済み値が書き戻され「trim なし」契約が破れる。
          trim は CMD query 変換（buildProductSearchQuery）でのみ行う。page reset は updateSearch の
          pageOnlyChange 機構が担う。 */}
      <SearchBar
        value={search.q ?? ""}
        placeholder="商品コード・商品名・JAN・メーカー品番で検索"
        debounceMs={200}
        onSearchChange={(value) => {
          updateSearch({ q: value === "" ? undefined : value });
        }}
      />
      <DepartmentFilter
        options={departmentOptions}
        selected={normalizedSearch.dept ?? null}
        disabled={departmentsQuery.isLoading}
        onChange={(dept) => {
          updateSearch({ dept });
        }}
        allLabel="すべての部門"
        widthClass="w-[11rem]"
        idPrefix="product-dept-filter"
      />
      {departmentsQuery.isError ? (
        <p className="text-sm text-destructive" role="alert">
          部門一覧の取得に失敗しました
        </p>
      ) : null}
      <SegmentedControl
        ariaLabel="廃番表示"
        value={normalizedSearch.discontinued}
        options={PRODUCT_DISCONTINUED_OPTIONS}
        onValueChange={(value) => {
          updateSearch({ discontinued: value });
        }}
      />
      <SegmentedControl
        ariaLabel="PLU表示"
        value={normalizedSearch.plu}
        options={PRODUCT_PLU_OPTIONS}
        onValueChange={(value) => {
          updateSearch({ plu: value });
        }}
      />
    </div>
  );

  const toolbarSecondary = (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="product-sort">
          並び替え
        </label>
        <Select
          value={normalizedSearch.sort}
          onValueChange={(value) => {
            const sort = PRODUCT_SORT_OPTIONS.find((option) => option.value === value)?.value;
            if (sort !== undefined) updateSearch({ sort });
          }}
        >
          <SelectTrigger id="product-sort" className="w-[10rem]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRODUCT_SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <SegmentedControl
        ariaLabel="並び順"
        value={normalizedSearch.dir}
        options={PRODUCT_SORT_DIRECTION_OPTIONS}
        onValueChange={(value) => {
          updateSearch({ dir: value });
        }}
      />
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground" htmlFor="product-per-page">
          表示件数
        </label>
        <Select
          value={String(normalizedSearch.perPage)}
          onValueChange={(value) => {
            const perPage = LIST_PER_PAGE_OPTIONS.find((option) => String(option) === value);
            if (perPage !== undefined) {
              updateSearch({ perPage });
              scrollPageToTop();
            }
          }}
        >
          <SelectTrigger id="product-per-page" className="w-[7rem]">
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
      <div className="flex basis-full flex-col items-start gap-1">
        <p id="plu-bulk-caption" className="text-sm font-medium text-foreground">
          PLU 一括操作
        </p>
        <p id="plu-bulk-description" className="text-sm text-muted-foreground">
          {pluBulkCaptionDescription}
        </p>
        <div
          role="group"
          aria-labelledby="plu-bulk-caption"
          aria-describedby="plu-bulk-description"
          className="flex flex-wrap items-center gap-2"
        >
          <Button
            type="button"
            variant="outline"
            disabled={totalCount === 0 || bulkMutation.isPending}
            onClick={() => {
              setBulkTarget(true);
              setBulkDialogOpen(true);
            }}
          >
            PLU 対象にする
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={totalCount === 0 || bulkMutation.isPending}
            onClick={() => {
              setBulkTarget(false);
              setBulkDialogOpen(true);
            }}
          >
            PLU 対象から外す
          </Button>
        </div>
      </div>
      {bulkError !== null ? (
        <Alert variant="destructive">
          <AlertTitle>PLU対象の一括更新に失敗しました</AlertTitle>
          <AlertDescription>{bulkError}</AlertDescription>
        </Alert>
      ) : null}
    </div>
  );

  return (
    <PageShell>
      <PageHeader
        title="商品検索・一覧"
        actions={
          <Button type="button" asChild>
            <Link to="/products/new" search={{ returnTo }}>
              <PackagePlus aria-hidden="true" />
              商品登録
            </Link>
          </Button>
        }
      />

      <ListShell
        toolbar={toolbar}
        toolbarSecondary={toolbarSecondary}
        pagination={{
          page: productsQuery.data?.page ?? normalizedSearch.page,
          perPage: productsQuery.data?.per_page ?? normalizedSearch.perPage,
          totalCount,
          onPageChange: (page) => {
            updateSearch({ page });
          },
        }}
        topSummary
        stickyHeader
        identityColumns={2}
        isLoading={productsQuery.isLoading}
      >
        {productsQuery.isError ? (
          <Alert variant="destructive">
            <AlertTitle>商品一覧の取得に失敗しました</AlertTitle>
            <AlertDescription>
              検索条件を変えるか、しばらくしてからもう一度お試しください。
            </AlertDescription>
          </Alert>
        ) : productsQuery.data?.items.length === 0 ? (
          // 意図的差分③: bare div → EmptyState 標準 UI（catalog ⑥）
          // filter-empty reset action（catalog ⑥、SPEC-UIBB-1/2）: 既存「商品を登録する」action は
          // 常設のまま維持し、絞り込みが非既定（q / dept / discontinued のいずれか）のときだけ
          // reset ボタンを横並びで併置する（既存 action が先、reset ボタンが後）。
          // sort / dir / perPage は結果集合を狭めないため reset 対象外（変更しない）。
          <EmptyState
            icon={PackageSearch}
            title="該当する商品がありません"
            description="検索条件を変更するか、新しい商品を登録してください"
            action={
              // 複数ボタンは中央揃え（catalog ⑥、owner L3 2026-08-03 是正、SPEC-UIBB-11）
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button type="button" asChild variant="outline">
                  <Link to="/products/new" search={{ returnTo }}>
                    商品を登録する
                  </Link>
                </Button>
                {!isFilterDefault && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      updateSearch({
                        q: undefined,
                        dept: undefined,
                        discontinued: undefined,
                        plu: undefined,
                        page: undefined,
                      });
                    }}
                  >
                    絞り込みを解除
                  </Button>
                )}
              </div>
            }
          />
        ) : productsQuery.data ? (
          <ProductTable items={productsQuery.data.items} returnTo={returnTo} />
        ) : null}
      </ListShell>
      <PluBulkTargetConfirmDialog
        open={bulkDialogOpen}
        pluTarget={bulkTarget}
        count={totalCount}
        isPending={bulkMutation.isPending}
        onOpenChange={(open) => {
          if (!open && !bulkMutation.isPending) setBulkDialogOpen(false);
        }}
        onConfirm={() => {
          if (totalCount > 0) bulkMutation.mutate(bulkTarget);
        }}
      />
    </PageShell>
  );
}
