import { TriangleAlert } from "lucide-react";

import type { UnsavedChangesWarning } from "@/hooks/useUnsavedChangesWarning";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export function UnsavedChangesDialog({ warning }: { warning: UnsavedChangesWarning }) {
  return (
    <AlertDialog open={warning.isBlocked}>
      {/* DSR-20 硬化条件 (b): 未保存内容を破棄するか継続するかを明示選択させる。
          外側クリックは Radix AlertDialog primitive 既定で非 dismiss（handler 非提供）。 */}
      <AlertDialogContent
        onEscapeKeyDown={(event) => {
          event.preventDefault();
        }}
      >
        <AlertDialogHeader>
          <AlertDialogMedia>
            <TriangleAlert aria-hidden="true" />
          </AlertDialogMedia>
          <AlertDialogTitle>編集内容が保存されていません</AlertDialogTitle>
          <AlertDialogDescription>
            このまま移動すると、入力した内容は破棄されます。
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={warning.continueEditing}>編集を続ける</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={warning.discardAndProceed}>
            破棄して移動
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
