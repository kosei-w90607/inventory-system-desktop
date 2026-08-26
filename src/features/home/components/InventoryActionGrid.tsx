// src/features/home/components/InventoryActionGrid.tsx
//
// 「入庫・出庫」2×2 グリッド（入庫記録 / 返品・交換 / 手動販売出庫 / 廃棄・破損）。
// 設計: docs/function-design/53-ui-home.md §53.1
// 全項目 active（各 route 実装済み）。

import { ActionButton } from "./ActionButton";

export function InventoryActionGrid() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ActionButton navItemId="ui-02" />
      <ActionButton navItemId="ui-03" />
      <ActionButton navItemId="ui-04" />
      <ActionButton navItemId="ui-05" />
    </div>
  );
}
