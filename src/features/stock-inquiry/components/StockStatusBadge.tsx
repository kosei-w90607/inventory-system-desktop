// src/features/stock-inquiry/components/StockStatusBadge.tsx
//
// 在庫状態を色だけに依存せず、日本語ラベル + アイコン + Badge で表示する。
// 閾値判定は持たず、ProductListTable で派生済みの StockStatus だけを受け取る。
// 設計: docs/function-design/58-ui-stock-inquiry.md §58.7 / §58.10

import { CircleAlertIcon, TriangleAlertIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { StockStatus } from "../types";

export interface StockStatusBadgeProps {
  status: StockStatus;
}

export function StockStatusBadge({ status }: StockStatusBadgeProps) {
  if (status === "stockout") {
    return (
      <Badge variant="outline" tone="destructive" className="font-medium">
        <CircleAlertIcon aria-hidden="true" />
        在庫切れ
      </Badge>
    );
  }

  if (status === "low") {
    return (
      <Badge variant="outline" tone="warning" className="font-medium">
        <TriangleAlertIcon aria-hidden="true" />
        在庫少
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="border-stone-200 bg-stone-50 font-medium text-stone-600">
      通常
    </Badge>
  );
}
