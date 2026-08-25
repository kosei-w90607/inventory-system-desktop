import { useMutation, useQueryClient } from "@tanstack/react-query";

import { commands } from "@/lib/bindings";
import { invalidateByContract, invalidationContract } from "@/lib/invalidation-contract";
import { unwrapResult } from "@/lib/invoke";

export function useRenameSupplier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ supplierId, name }: { supplierId: number; name: string }) =>
      unwrapResult(commands.renameSupplier(supplierId, name), {
        source: "commands",
        cmd: "rename_supplier",
      }),
    onSuccess: async () => {
      await invalidateByContract(queryClient, invalidationContract.supplierRename());
    },
  });
}
