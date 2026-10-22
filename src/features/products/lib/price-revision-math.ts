// 77 の新原価（案）と現掛率（Y8）。原価は 1/100 円、売価は円の整数。
// 積は 999999 × 99999999 以下で安全な整数の範囲（共通規則 (b)）。

/** 新原価（案）= floor(新売価 × 現原価 ÷ (現売価 × 100)) × 100（1/100 円。1 円未満を出さない）。現売価 0 は現原価 */
export function deriveProposedCost(
  newSellingPrice: number,
  currentCostPriceCenti: number,
  currentSellingPrice: number,
): number {
  return currentSellingPrice === 0
    ? currentCostPriceCenti
    : Math.floor((newSellingPrice * currentCostPriceCenti) / (currentSellingPrice * 100)) * 100;
}

/** 現掛率 = 現原価(1/100 円) ÷ (現売価 × 100) を % の小数 1 桁。現売価 0 は `—` */
export function formatMarkupRate(costPriceCenti: number, sellingPrice: number): string {
  return sellingPrice === 0
    ? "—"
    : (Math.round((costPriceCenti * 10) / sellingPrice) / 10).toFixed(1);
}

export function isRevisedToday(changedAt: string | undefined, todayYmd: string): boolean {
  return changedAt?.slice(0, 10) === todayYmd;
}
