import { createFileRoute } from "@tanstack/react-router";

import { SupplierManagementPage } from "@/features/suppliers/SupplierManagementPage";

export const Route = createFileRoute("/settings/suppliers")({
  component: SupplierManagementPage,
});
