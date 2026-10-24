// src/features/csv-import/hooks/useRollbackCsvImport.ts
//
// Z004 の取込みの取消の mutation（取込みの結果の画面と CSV取込みの詳細が同じものを使う）。
// 設計: docs/function-design/55-ui-csv-import.md §55.11 UI-07-D18 / §55.9

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { commands, type RollbackResult } from "@/lib/bindings";
import { invalidateByContract, invalidationContract } from "@/lib/invalidation-contract";
import { unwrapResult } from "@/lib/invoke";

export function useRollbackCsvImport({
  onSuccess,
}: {
  onSuccess: (result: RollbackResult) => void;
}) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (csvImportId: number) =>
      unwrapResult(commands.rollbackCsvImport(csvImportId), {
        source: "commands",
        cmd: "rollback_csv_import",
      }),
    retry: 0,
    onSuccess: async (result) => {
      onSuccess(result);
      // 取消は破壊的操作の完了通知で、既定 3 秒（RootLayout.tsx の Toaster duration）では非IT高齢operatorが
      // 読み切れないおそれがあるため、この通知だけ長く表示する（Toaster 全体設定は不変）。
      toast.success("取込みを取り消しました", { duration: 8000 });
      await invalidateByContract(queryClient, invalidationContract.csvImportRollback());
    },
    onError: () => {
      // §55.9 取消の失敗: トーストだけで画面の状態は据え置き（同じ取込みID のまま再試行できる）
      toast.error("取り消しに失敗しました。もう一度お試しください");
    },
  });
}
