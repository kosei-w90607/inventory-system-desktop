import { useMutation, useQueryClient } from "@tanstack/react-query";

import { commands } from "@/lib/bindings";
import { invalidateByContract, invalidationContract } from "@/lib/invalidation-contract";
import { unwrapResult } from "@/lib/invoke";

export function useMergeSuppliers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sourceId, targetId }: { sourceId: number; targetId: number }) =>
      unwrapResult(commands.mergeSuppliers(sourceId, targetId), {
        source: "commands",
        cmd: "merge_suppliers",
      }),
    onSuccess: async () => {
      await invalidateByContract(queryClient, invalidationContract.supplierMerge());
    },
  });
}
