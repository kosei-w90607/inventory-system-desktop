import { useQuery } from "@tanstack/react-query";

import { commands } from "@/lib/bindings";
import { unwrapResult } from "@/lib/invoke";
import { queryKeys } from "@/lib/query-keys";

import type { StocktakeSearch } from "../types";

export function useStocktakeItems(
  stocktakeId: number | null,
  search: StocktakeSearch,
  perPage: number,
) {
  const departmentId = search.dept ?? null;
  const countedOnly = search.counted_only ?? null;
  const page = search.page ?? 1;

  return useQuery({
    queryKey:
      stocktakeId === null
        ? queryKeys.stocktake.itemsRoot()
        : queryKeys.stocktake.items(stocktakeId, {
            departmentId,
            countedOnly,
            page,
            perPage,
          }),
    enabled: stocktakeId !== null,
    staleTime: 0,
    queryFn: () =>
      unwrapResult(
        commands.getStocktakeItems(stocktakeId ?? 0, departmentId, countedOnly, page, perPage),
        { source: "commands", cmd: "get_stocktake_items" },
      ),
  });
}
