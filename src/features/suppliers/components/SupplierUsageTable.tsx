import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { SupplierWithUsage } from "@/lib/bindings";
import { RenameSupplierRow } from "./RenameSupplierRow";

export function SupplierUsageTable({
  suppliers,
  onMerge,
  onStale,
}: {
  suppliers: SupplierWithUsage[];
  onMerge: (supplier: SupplierWithUsage) => void;
  onStale: () => void;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>取引先名</TableHead>
            <TableHead>関連商品数</TableHead>
            <TableHead>入庫記録数</TableHead>
            <TableHead>操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {suppliers.map((supplier) => (
            <RenameSupplierRow
              key={supplier.id}
              supplier={supplier}
              onMerge={() => {
                onMerge(supplier);
              }}
              onStale={onStale}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
