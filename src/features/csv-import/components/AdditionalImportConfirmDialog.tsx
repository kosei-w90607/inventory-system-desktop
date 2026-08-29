// 両取込みタブで共有する同日追加確認ダイアログ。
// shadcn AlertDialog を使用、Esc は Radix 標準 (cancel として動作)。
// 設計: docs/function-design/55-ui-csv-import.md §55.1 / §55.4 step 9 / §55.7
//
// DSR-16 canonical 実例（gated Amendment 3、2026-08-29 owner L3-lite 可読性 FAIL の是正）:
// 既存分は「比較が目的」の同型レコード群のため per-card の dl 反復を廃し、列を揃えた
// structured list（Table）へ再構成した。今回分は単一レコードのため definition list のまま
// 「今回分」ラベル付き独立領域として分離する。docs/design-system/01-decision-rules.md DSR-16 参照。

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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface ExistingImportSummary {
  id: number;
  filenames: string[];
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

/// 複数ファイル名は " / " 連結ではなく個別行で示す（任意位置での折返しを避けるため、
/// Scope 3 是正: Codex/Opus 実装後レビュー round 1）。
function FilenameList({ filenames }: { filenames: string[] }) {
  return (
    <ul className="space-y-0.5">
      {filenames.map((filename) => (
        <li key={filename} className="break-words">
          {filename}
        </li>
      ))}
    </ul>
  );
}

/// 既存 formatter 慣行（`src/features/inventory-records/types.ts` 他、各 feature で
/// ローカル複製されている established pattern）に従い、ISO の "T" 区切りを空白へ置換する。
function formatDateTime(value: string): string {
  return value.replace("T", " ");
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
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>同じ日のデータを追加で取り込みますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は既存の取込みを置き換えません。対象日の売上に今回分を追加します。復旧用に書き出した同内容のファイルを選んでいないか確認してください。
          </AlertDialogDescription>
          <div className="space-y-3 text-sm">
            <div className="space-y-2">
              <p className="font-medium">
                既存分（{existingImports.length.toLocaleString("ja-JP")}回）
              </p>
              {/* DSR-16: 同型レコードの比較が目的のため、per-card の囲み反復ではなく
                  列を揃えた表（行区切りは border-b、囲みは表全体で 1 つ）で示す。 */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>取込み ID</TableHead>
                    <TableHead>ファイル名</TableHead>
                    <TableHead>合計金額</TableHead>
                    <TableHead>取込み日時</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {existingImports.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.id}</TableCell>
                      <TableCell>
                        <FilenameList filenames={item.filenames} />
                      </TableCell>
                      <TableCell>{item.amount}</TableCell>
                      <TableCell>{formatDateTime(item.importedAt)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* DSR-16: 今回分は単一レコードの確認のため definition list のままとし、
                「今回分」ラベル + border-t の行区切りだけで既存分と分離する
                （独立した box border は持たせず、囲み階層を 1 つに保つ）。 */}
            <div className="space-y-2 border-t pt-3">
              <p className="font-medium">今回分</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <div className="col-span-2">
                  <dt className="text-muted-foreground">ファイル名</dt>
                  <dd className="font-medium">
                    <FilenameList filenames={incomingImport.filenames} />
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">合計金額</dt>
                  <dd className="font-medium">{incomingImport.amount}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">取込み日時</dt>
                  <dd className="font-medium">{formatDateTime(incomingImport.importedAt)}</dd>
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
