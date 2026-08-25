import { Building2, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/patterns/EmptyState";
import { ListSkeleton } from "@/components/patterns/ListSkeleton";
import { PageHeader } from "@/components/patterns/PageHeader";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { SupplierWithUsage } from "@/lib/bindings";
import { CreateSupplierDialog } from "./components/CreateSupplierDialog";
import { MergeSupplierDialog } from "./components/MergeSupplierDialog";
import { SupplierUsageTable } from "./components/SupplierUsageTable";
import { useSuppliersWithUsage } from "./hooks/useSuppliersWithUsage";

export function SupplierManagementPage() {
  const suppliersQuery = useSuppliersWithUsage();
  const [createOpen, setCreateOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState<SupplierWithUsage | null>(null);

  const addButton = (
    <Button
      type="button"
      onClick={() => {
        setCreateOpen(true);
      }}
    >
      <Plus aria-hidden="true" />
      新しい取引先を追加
    </Button>
  );

  return (
    <div className="space-y-4 p-6">
      <PageHeader title="取引先管理" actions={addButton} />
      <p className="text-sm text-muted-foreground">
        メーカー・ブランドの追加、名称変更、重複した取引先の統合を行います。
      </p>

      {suppliersQuery.isLoading ? (
        <ListSkeleton rows={6} columns={4} />
      ) : suppliersQuery.isError ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>取引先を読み込めませんでした</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>しばらくしてから、もう一度お試しください。</p>
            <Button type="button" variant="outline" onClick={() => void suppliersQuery.refetch()}>
              再試行
            </Button>
          </AlertDescription>
        </Alert>
      ) : suppliersQuery.data?.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="取引先はまだ登録されていません"
          description="メーカー名またはブランド名を追加してください。"
          action={addButton}
        />
      ) : suppliersQuery.data ? (
        <SupplierUsageTable
          suppliers={suppliersQuery.data}
          onMerge={setMergeSource}
          onStale={() => void suppliersQuery.refetch()}
        />
      ) : null}

      <CreateSupplierDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={async () => {
          await suppliersQuery.refetch();
        }}
      />
      <MergeSupplierDialog
        source={mergeSource}
        suppliers={suppliersQuery.data ?? []}
        open={mergeSource !== null}
        onOpenChange={(open) => {
          if (!open) setMergeSource(null);
        }}
        onStale={() => void suppliersQuery.refetch()}
      />
    </div>
  );
}
