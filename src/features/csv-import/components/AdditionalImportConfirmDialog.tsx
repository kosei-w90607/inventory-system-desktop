// 両取込みタブで共有する同日追加確認ダイアログ。
// shadcn AlertDialog を使用、Esc は Radix 標準 (cancel として動作)。
// 設計: docs/function-design/55-ui-csv-import.md §55.1 / §55.4 step 9 / §55.7
//
// DSR-16 canonical 実例（gated Amendment 3/4、owner L3-lite round 1/2 の是正）:
// 既存分・今回分とも「比較が目的」の同型レコードのため、per-card の dl 反復ではなく
// 列を揃えた同一 Table で示す（今回分は最終行、gated Amendment 4 で definition list
// 分離を廃止）。table-fixed + 列ごとの折返し設計で 1024×720 相当の横スクロールを避ける
// （gated Amendment 4、共通 src/components/ui/table.tsx は変更せず利用側 className で
// whitespace-nowrap 既定を override）。docs/design-system/01-decision-rules.md DSR-16 参照。

import { Badge } from "@/components/ui/badge";
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
      <AlertDialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>同じ日のデータを追加で取り込みますか？</AlertDialogTitle>
          <AlertDialogDescription>
            この操作は既存の取込みを置き換えません。対象日の売上に今回分を追加します。復旧用に書き出した同内容のファイルを選んでいないか確認してください。
          </AlertDialogDescription>
          {/* gated Amendment 4: grid/container の子が意図せず伸びて横 overflow を招かない
              よう min-w-0 を明示する（grid item の既定 min-width: auto 対策）。 */}
          <div className="min-w-0 space-y-2 text-sm">
            <p className="font-medium">
              既存分（{existingImports.length.toLocaleString("ja-JP")}回）
            </p>
            {/* DSR-16: 同型レコードの比較が目的のため、per-card の囲み反復ではなく
                列を揃えた同一表（行区切りは border-b、囲みは表全体で 1 つ）で示す。
                今回分も独立領域に分離せず同じ列位置の最終行にする（gated Amendment 4）。
                table-fixed + 列ごとの幅配分（列幅の合計 = 100%）で横スクロールを避ける。 */}
            <Table className="table-fixed">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[10%]">取込み ID</TableHead>
                  <TableHead className="w-[40%]">ファイル名</TableHead>
                  <TableHead className="w-[25%]">合計金額</TableHead>
                  <TableHead className="w-[25%]">取込み日時</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {existingImports.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.id}</TableCell>
                    <TableCell className="break-words whitespace-normal">
                      <FilenameList filenames={item.filenames} />
                    </TableCell>
                    <TableCell className="whitespace-normal">{item.amount}</TableCell>
                    <TableCell className="whitespace-normal">
                      {formatDateTime(item.importedAt)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              {/* 今回分: 別 tbody の最終行として同一 table・同一列位置に配置する
                  （definition list 分離は gated Amendment 4 で廃止）。ID 列は「今回」
                  Badge（テキストで色非依存判別）+ 行の淡背景（bg-muted、二次シグナル）。 */}
              <TableBody>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-medium">
                    <Badge variant="outline">今回</Badge>
                  </TableCell>
                  <TableCell className="break-words whitespace-normal">
                    <FilenameList filenames={incomingImport.filenames} />
                  </TableCell>
                  <TableCell className="whitespace-normal">{incomingImport.amount}</TableCell>
                  <TableCell className="whitespace-normal">
                    {formatDateTime(incomingImport.importedAt)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
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
