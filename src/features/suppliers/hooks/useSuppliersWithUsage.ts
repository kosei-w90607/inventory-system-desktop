import { useQuery } from "@tanstack/react-query";

import { commands } from "@/lib/bindings";
import { unwrapResult } from "@/lib/invoke";
import { queryKeys } from "@/lib/query-keys";

export function useSuppliersWithUsage() {
  return useQuery({
    queryKey: queryKeys.suppliers.withUsage(),
    queryFn: () =>
      unwrapResult(commands.listSuppliersWithUsage(), {
        source: "commands",
        cmd: "list_suppliers_with_usage",
      }),
    staleTime: 0,
    gcTime: 5 * 60_000,
    retry: 1,
  });
}
