// src/features/home/components/MiscActionRow.tsx
//
// 「その他」3 card（2 列折返し）（棚卸し / バックアップ / 閾値設定）。
// 設計: docs/function-design/53-ui-home.md §53.1
// 全項目 active（各 route 実装済み）。

import { ActionButton } from "./ActionButton";

export function MiscActionRow() {
  return (
    <div className="grid grid-cols-2 gap-4">
      <ActionButton navItemId="ui-10" />
      <ActionButton navItemId="ui-11b" />
      <ActionButton navItemId="ui-11a" />
    </div>
  );
}
