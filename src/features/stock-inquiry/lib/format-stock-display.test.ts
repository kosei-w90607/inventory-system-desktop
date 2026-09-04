// src/features/stock-inquiry/lib/format-stock-display.test.ts
//
// REQ-301: formatStockDisplay の単位付き表示 + fallback 検証（Q-4 網羅）。
// 設計: docs/function-design/58-ui-stock-inquiry.md §58.6 / §58.12

import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, it, expect } from "vitest";
import { formatStockDisplay, formatStockUnitLabel } from "./format-stock-display";

describe("formatStockDisplay (REQ-301 単位表示)", () => {
  it("REQ-301: pcs は「個」付き表示", () => {
    expect(formatStockDisplay(10, "pcs")).toBe("10 個");
  });

  it("REQ-301: cm は「cm」付き表示（生地）", () => {
    expect(formatStockDisplay(300, "cm")).toBe("300 cm");
  });

  it("REQ-301: 在庫 0 でも単位付きで表示する", () => {
    expect(formatStockDisplay(0, "cm")).toBe("0 cm");
  });

  it("REQ-301: 想定外の単位は fallback「—」（Q-4）", () => {
    expect(formatStockDisplay(5, "kg")).toBe("—");
    expect(formatStockDisplay(5, "")).toBe("—");
  });
});

// SC16（Gated Amendment 6 S45、owner run 5 bug）: unit code の生表示（`pcs`）を
// 日本語ラベルへ変換する helper。数量を持たない単位列（入庫 / 廃棄 / 返品交換 /
// 手動販売の行データ）向け。
describe("formatStockUnitLabel (Gated Amendment 6 S45)", () => {
  it("pcs は「個」", () => {
    expect(formatStockUnitLabel("pcs")).toBe("個");
  });

  it("cm はそのまま「cm」", () => {
    expect(formatStockUnitLabel("cm")).toBe("cm");
  });

  it("想定外の単位は fallback「—」", () => {
    expect(formatStockUnitLabel("kg")).toBe("—");
    expect(formatStockUnitLabel("")).toBe("—");
  });
});

// SC16 fs literal（Gated Amendment 6 S45）: 単位列の unit code 生表示（`{row.stockUnit}`）が
// src 全体（test file 除く）に残っていないことを sweep する。
describe("SC16 fs literal: no raw {row.stockUnit} interpolation remains in src", () => {
  it("0 hit（入庫 / 廃棄 / 返品交換 / 手動販売 sweep 済み、formatStockUnitLabel 経由に統一）", () => {
    const REPO_ROOT = join(__dirname, "../../../..");
    const SRC_ROOT = join(REPO_ROOT, "src");
    const literal = "{row.stockUnit}";

    function collectTsxFiles(dir: string): string[] {
      const entries = readdirSync(dir, { withFileTypes: true });
      const files: string[] = [];
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...collectTsxFiles(fullPath));
        } else if (
          entry.isFile() &&
          extname(entry.name) === ".tsx" &&
          !entry.name.endsWith(".test.tsx")
        ) {
          files.push(fullPath);
        }
      }
      return files;
    }

    const hits: string[] = [];
    for (const file of collectTsxFiles(SRC_ROOT)) {
      const source = readFileSync(file, "utf8");
      if (source.includes(literal)) {
        hits.push(relative(REPO_ROOT, file));
      }
    }

    expect(hits).toEqual([]);
  });
});
