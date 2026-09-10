import { Building2, Plus } from "lucide-react";
import { useState } from "react";

import { EmptyState } from "@/components/patterns/EmptyState";
import { ListSkeleton } from "@/components/patterns/ListSkeleton";
import { PageHeader } from "@/components/patterns/PageHeader";
import { PageShell } from "@/components/patterns/PageShell";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { SupplierWithUsage } from "@/lib/bindings";
import { CreateSupplierDialog } from "./components/CreateSupplierDialog";
import { MergeSupplierDialog } from "./components/MergeSupplierDialog";
import { SupplierUsageTable } from "./components/SupplierUsageTable";
import { useSuppliersWithUsage } from "./hooks/useSuppliersWithUsage";

export function SupplierManagementPage() {
  const suppliersQuery = useSuppliersWithUsage();
  const [query, setQuery] = useState("");
  const filtered = (suppliersQuery.data ?? []).filter((s) => s.name.includes(query.trim()));
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
    <PageShell>
      <PageHeader
        title="取引先管理"
        actions={addButton}
        subtitle="メーカー・ブランドの追加、名称変更、重複した取引先の統合を行います。"
      />

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
        <>
          <div className="grid gap-1">
            <Label htmlFor="supplier-management-search">取引先名で検索</Label>
            <Input
              id="supplier-management-search"
              type="search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
          </div>
          {filtered.length === 0 ? (
            <EmptyState title="該当する取引先はありません" />
          ) : (
            <div className="max-h-[50vh] overflow-auto">
              <SupplierUsageTable
                suppliers={filtered}
                onMerge={setMergeSource}
                onStale={() => void suppliersQuery.refetch()}
              />
            </div>
          )}
        </>
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
    </PageShell>
  );
}
