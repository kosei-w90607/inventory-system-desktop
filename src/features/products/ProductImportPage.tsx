import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileSpreadsheet } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageShell } from "@/components/patterns/PageShell";
import { describeError } from "@/lib/describe-error";
import { ProductImportDropzone } from "./import/ProductImportDropzone";
import { ProductImportPreview } from "./import/ProductImportPreview";
import { useProductImportFlow } from "./import/useProductImportFlow";

export function ProductImportPage() {
  const flow = useProductImportFlow();
  const { state } = flow;
  const isCommitting = state.status === "committing";

  return (
    <PageShell>
      <PageHeader
        title="商品一括インポート"
        description="CSVファイルから複数の商品をまとめて登録・更新するページです。ファイルを選ぶと新規登録候補・既存商品との重複・エラー行の3つに分けて内容を確認でき、重複行は初期状態でスキップされるので上書きする行だけ個別に選んで取り込みます。取り込みを実行すると、新規登録・上書き更新・スキップの件数が画面に表示されます。"
        actions={
          isCommitting ? undefined : (
            <Button type="button" variant="outline" asChild>
              <Link to="/products">
                <ArrowLeft aria-hidden="true" />
                商品一覧へ戻る
              </Link>
            </Button>
          )
        }
      />

      {state.status === "idle" || state.status === "previewing" ? (
        <ProductImportDropzone
          onFileSelect={(file) => {
            flow.selectFile(file);
          }}
          disabled={flow.isPreviewing}
        />
      ) : null}

      {state.status === "previewing" ? (
        <p className="text-sm text-muted-foreground">CSVを確認しています...</p>
      ) : null}

      {state.status === "preview" ? (
        <ProductImportPreview
          filename={state.filename}
          preview={state.preview}
          overwriteCodes={state.overwriteCodes}
          targetCount={flow.targetRows.length}
          isCommitting={flow.isCommitting}
          onToggleOverwrite={flow.toggleOverwrite}
          onCommit={flow.confirmImport}
          onReselect={(file) => {
            flow.selectFile(file);
          }}
        />
      ) : null}

      {state.status === "committing" ? (
        <ProductImportPreview
          filename={state.filename}
          preview={state.preview}
          overwriteCodes={state.overwriteCodes}
          targetCount={state.targetRows.length}
          isCommitting
          onToggleOverwrite={flow.toggleOverwrite}
          onCommit={flow.confirmImport}
          onReselect={(file) => {
            flow.selectFile(file);
          }}
        />
      ) : null}

      {state.status === "result" ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="size-5" aria-hidden="true" />
              インポート完了
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 md:grid-cols-3">
              <ResultCount label="新規登録" value={state.result.created_count} />
              <ResultCount label="上書き更新" value={state.result.updated_count} />
              <ResultCount label="スキップ" value={state.result.skipped_count} />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button type="button" onClick={flow.reset}>
                続けてインポート
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/products">商品一覧を確認</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {state.status === "error" ? (
        <Alert variant="destructive">
          <AlertTitle>インポートに失敗しました</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{describeError(state.error)}</p>
            <Button type="button" variant="outline" onClick={flow.dismissError}>
              戻る
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}
    </PageShell>
  );
}

function ResultCount({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-semibold">{value.toLocaleString()} 件</p>
    </div>
  );
}
