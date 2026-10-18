// src/features/products/components/StockUnitField.tsx
//
// UI-01b-D6 / UI-01b-D22: 単位は 12 個の表示の語から選ぶ。長さの単位（m・cm）を選ぶと
// POS 在庫同期 off を提案するが、利用者 override を保持する。
// 自動提案は onPosStockSyncSuggest（touched を立てない）、利用者の checkbox 操作は
// onPosStockSyncChange（touched を立てる）を使い、2 つの経路を分離する。
// UI-01b-D23: edit の個数の単位の商品は個数の単位だけを候補にして変えられ、select の下に 1 文を出す。
// 長さの単位の商品は readOnly（disabled）で今の語を読ませる。

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STOCK_UNIT_LABELS } from "@/features/stock-inquiry/lib/format-stock-display";
import { isLengthUnit } from "@/lib/unit-quantity";
import type { ProductStockUnit } from "../lib/product-form-request";

export interface StockUnitFieldProps {
  mode: "create" | "edit";
  stockUnit: ProductStockUnit;
  posStockSync: boolean;
  posSyncTouched: boolean;
  onStockUnitChange: (stockUnit: ProductStockUnit) => void;
  /** 利用者の checkbox 操作（touched を立てる経路） */
  onPosStockSyncChange: (checked: boolean) => void;
  /** 自動提案専用（touched を立てない経路）。未操作時に長さの単位で false、個数の単位で true を渡す */
  onPosStockSyncSuggest: (checked: boolean) => void;
  readOnly?: boolean;
}

export function StockUnitField({
  mode,
  stockUnit,
  posStockSync,
  posSyncTouched,
  onStockUnitChange,
  onPosStockSyncChange,
  onPosStockSyncSuggest,
  readOnly = false,
}: StockUnitFieldProps) {
  const handleUnitChange = (next: ProductStockUnit) => {
    onStockUnitChange(next);
    // create mode かつ checkbox 未操作（posSyncTouched=false）のときだけ自動提案する。
    // 長さの単位（m・cm）で false を提案、個数の単位で既定値 true を復元する。
    // touched を立てる onPosStockSyncChange は呼ばない（利用者 override と区別するため）。
    if (mode === "create" && !posSyncTouched) {
      onPosStockSyncSuggest(!isLengthUnit(next));
    }
  };

  // edit で押せる select は個数の単位の商品だけ（呼ぶ側が長さの単位の商品を readOnly にする）
  const editableInEdit = mode === "edit" && !readOnly;
  const unitOptions = Object.entries(STOCK_UNIT_LABELS).filter(
    ([code]) => !editableInEdit || !isLengthUnit(code as ProductStockUnit),
  );

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="space-y-1">
        <Label htmlFor="stock-unit">数量単位</Label>
        <Select
          value={stockUnit}
          disabled={readOnly}
          onValueChange={(value) => {
            // 値は下の SelectItem からしか来ない
            handleUnitChange(value as ProductStockUnit);
          }}
        >
          <SelectTrigger id="stock-unit" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {unitOptions.map(([code, label]) => (
              <SelectItem key={code} value={code}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {editableInEdit ? (
          <p className="text-xs text-muted-foreground">
            単位の語だけが変わり、在庫の数は変わりません。過去の記録も新しい語で表示されます。
          </p>
        ) : null}
      </div>
      <div className="space-y-1">
        <Label htmlFor="pos-stock-sync">POS販売で在庫を減らす</Label>
        <label className="flex h-9 items-center gap-2 rounded-md border px-3 text-sm">
          <input
            id="pos-stock-sync"
            type="checkbox"
            className="accent-primary"
            checked={posStockSync}
            onChange={(event) => {
              onPosStockSyncChange(event.target.checked);
            }}
          />
          <span>{posStockSync ? "減らす" : "減らさない"}</span>
        </label>
        {mode === "create" && isLengthUnit(stockUnit) ? (
          <p className="text-xs text-muted-foreground">
            長さ（m・cm）の商品は在庫同期しない設定を提案します。必要なら変更できます。
          </p>
        ) : null}
      </div>
    </div>
  );
}
