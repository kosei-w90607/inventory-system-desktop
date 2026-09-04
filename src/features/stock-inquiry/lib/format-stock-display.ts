// src/features/stock-inquiry/lib/format-stock-display.ts
//
// 在庫数 + 単位の表示文字列を生成する純関数（Q-4 `"pcs"` / `"cm"` の 2 値 + fallback）。
// 生地は「300 cm」と単位付き表示（SCREEN_DESIGN.md L131）。
//
// 設計: docs/function-design/58-ui-stock-inquiry.md §58.6 / §58.12

/**
 * 在庫数を単位付き文字列に整形する。
 *
 * - unit="pcs" → 「10 個」
 * - unit="cm"  → 「300 cm」（生地）
 * - 上記以外（unexpected）→ 「—」（fallback、Q-4 網羅）
 */
export function formatStockDisplay(quantity: number, unit: string): string {
  switch (unit) {
    case "pcs":
      return `${String(quantity)} 個`;
    case "cm":
      return `${String(quantity)} cm`;
    default:
      return "—";
  }
}

/**
 * 数量を伴わない単位列（入庫 / 廃棄 / 返品交換 / 手動販売の行データ等）の unit code
 * を日本語ラベルへ変換する（Gated Amendment 6 S45、owner run 5 bug: `pcs` 生表示）。
 *
 * - unit="pcs" → 「個」
 * - unit="cm"  → 「cm」（生地、単位そのまま）
 * - 上記以外（unexpected）→ 「—」（fallback、Q-4 網羅）
 */
export function formatStockUnitLabel(unit: string): string {
  switch (unit) {
    case "pcs":
      return "個";
    case "cm":
      return "cm";
    default:
      return "—";
  }
}
