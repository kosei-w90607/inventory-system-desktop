// 両取込みタブで共有する同日追加確認ダイアログ。
// shadcn AlertDialog を使用、Esc は Radix 標準 (cancel として動作)。
// 設計: docs/function-design/55-ui-csv-import.md §55.1 / §55.4 step 9 / §55.7

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ExistingImportSummary {
  id: number;
  filenames: string;
  amount: string;
  importedAt: string;
}

export interface AdditionalImportConfirmDialogProps {
  open: boolean;
  existingImports: ExistingImportSummary[];
  incomingImport: Omit<ExistingImportSummary, "id">;
  onConfirm: () => void;
  onCancel: () => void;
}

/// open は parent state、open=false にする経路は (1) onConfirm (2) onCancel (Esc / 外側クリック / キャンセルボタン)。
/// Radix の onOpenChange を onCancel にブリッジする。
export function AdditionalImportConfirmDialog({
  open,
  existingImports,
  incomingImport,
  onConfirm,
  onCancel,
}: AdditionalImportConfirmDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onCancel();
      }}
    >
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto">
        <AlertDialogHeader>
          <AlertDialogTitle>同じ日のデータを追加で取り込みますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は既存の取込みを置き換えません。対象日の売上に今回分を追加します。復旧用に書き出した同内容のファイルを選んでいないか確認してください。
          </AlertDialogDescription>
          <div className="space-y-2 text-sm">
            <p className="font-medium">
              既存分（{existingImports.length.toLocaleString("ja-JP")}回）
            </p>
            <ul className="space-y-2">
              {existingImports.map((item) => (
                <li key={item.id} className="rounded-md border p-3">
                  <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                    <div>
                      <dt className="text-muted-foreground">ID</dt>
                      <dd className="font-medium">{item.id}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">ファイル名</dt>
                      <dd className="font-medium break-all">{item.filenames}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">金額</dt>
                      <dd className="font-medium">{item.amount}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">取込み日時</dt>
                      <dd className="font-medium">{item.importedAt}</dd>
                    </div>
                  </dl>
                </li>
              ))}
            </ul>
            <p className="font-medium">今回分</p>
            <div className="rounded-md border p-3">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                <div className="col-span-2">
                  <dt className="text-muted-foreground">ファイル名</dt>
                  <dd className="font-medium break-all">{incomingImport.filenames}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">金額</dt>
                  <dd className="font-medium">{incomingImport.amount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">取込み日時</dt>
                  <dd className="font-medium">{incomingImport.importedAt}</dd>
                </div>
              </dl>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>キャンセル</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>追加で取り込む</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
