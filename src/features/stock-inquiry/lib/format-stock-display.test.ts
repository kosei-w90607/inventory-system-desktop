// src/features/stock-inquiry/lib/format-stock-display.test.ts
//
// REQ-301 / SPEC-UNIT-D3・D9: 数量と単位の表示の formatter（10 個の単位、長さは m の形）。
// golden の表は Rust の `format_length_m`・`csv_total_quantity` の test と独立に写している。
// 設計: docs/function-design/10-common-rules.md SPEC-UNIT-D3 / 58-ui-stock-inquiry.md §58.6

import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, it, expect } from "vitest";
import type { ProductStockUnit } from "@/lib/bindings";
import {
  STOCK_UNIT_LABELS,
  formatCentiYen,
  formatCostYen,
  formatLengthM,
  formatLengthOrPlain,
  formatQuantityTotal,
  formatStockDisplay,
  formatStockUnitLabel,
  formatUnitPrice,
  formatUnitQuantityTotal,
} from "./format-stock-display";

// SPEC-UNIT-D1 の表（code・表示の語）を正本から独立に写したもの
const UNIT_TABLE: readonly (readonly [ProductStockUnit, string])[] = [
  ["pcs", "個"],
  ["sheet", "枚"],
  ["hon", "本"],
  ["bag", "袋"],
  ["box", "箱"],
  ["kumi", "組"],
  ["set", "セット"],
  ["ball", "玉"],
  ["cho", "丁"],
  ["m", "m"],
];

describe("formatStockDisplay (REQ-301 単位表示)", () => {
  it("REQ-301: pcs は「個」付き表示", () => {
    expect(formatStockDisplay(10, "pcs")).toBe("10 個");
  });

  it("REQ-301: 長さの商品は m の形で出す（生地、SPEC-UNIT-D3）", () => {
    expect(formatStockDisplay(300, "m")).toBe("3 m");
  });

  it("REQ-301: 在庫 0 でも単位付きで表示する", () => {
    expect(formatStockDisplay(0, "m")).toBe("0 m");
  });

  it("REQ-301 / SPEC-UNIT-D9: 10 個の単位をすべて表示の語で出す（— を出す単位が無い）", () => {
    expect(Object.keys(STOCK_UNIT_LABELS)).toEqual(UNIT_TABLE.map(([code]) => code));
    for (const [code, label] of UNIT_TABLE) {
      expect(formatStockUnitLabel(code)).toBe(label);
      expect(formatStockDisplay(3, code)).toBe(code === "m" ? "0.03 m" : `3 ${label}`);
    }
    expect(formatStockDisplay(3, "ball")).toBe("3 玉");
    expect(formatStockDisplay(1234, "pcs")).toBe("1,234 個");
  });

  it.each([
    [130, "1.3 m"],
    [127, "1.27 m"],
    [200, "2 m"],
    [-30, "-0.3 m"],
    [123456, "1,234.56 m"],
    [0, "0 m"],
    [5, "0.05 m"],
    [-123456, "-1,234.56 m"],
    [999999999, "9,999,999.99 m"],
  ])("REQ-301 / SPEC-UNIT-D3: 長さ %s cm は %s（golden）", (cm, expected) => {
    expect(formatLengthM(cm)).toBe(expected);
    expect(formatStockDisplay(cm, "m")).toBe(expected);
  });
});

describe("集計・単価・行の金額の formatter（REQ-501 / REQ-502 / SPEC-UNIT-D3・D6）", () => {
  it.each([
    [0, 0, "0 点"],
    [5, 0, "5 点"],
    [999, 0, "999 点"],
    [1000, 0, "1,000 点"],
    [1234, 0, "1,234 点"],
    [5, 180, "5 点・1.8 m"],
    [1234, 180, "1,234 点・1.8 m"],
    [-5, 0, "-5 点"],
    [-999, 0, "-999 点"],
    [-1000, 0, "-1,000 点"],
    [-1234, 0, "-1,234 点"],
    [-1234, 180, "-1,234 点・1.8 m"],
    [0, 130, "1.3 m"],
    [0, 123456, "1,234.56 m"],
    [5, 250, "5 点・2.5 m"],
  ])("REQ-501: 集計 (%s 点, %s cm) は %s（X9 の golden）", (points, cm, expected) => {
    expect(formatQuantityTotal(points, cm)).toBe(expected);
  });

  it("REQ-501: 再集計が安全な整数を外れた欄（null）は —", () => {
    expect(formatQuantityTotal(null, 0)).toBe("—");
    expect(formatQuantityTotal(5, null)).toBe("—");
  });

  it("REQ-502: 月次の商品別の行は単位で種類を決め、相殺して 0 でも種類を失わない", () => {
    expect(formatUnitQuantityTotal(0, 130, "m")).toBe("1.3 m");
    expect(formatUnitQuantityTotal(3, 0, "pcs")).toBe("3 点");
    expect(formatUnitQuantityTotal(1234, 0, "pcs")).toBe("1,234 点");
    expect(formatUnitQuantityTotal(0, 0, "m")).toBe("0 m");
    expect(formatUnitQuantityTotal(0, 0, "pcs")).toBe("0 点");
    expect(formatUnitQuantityTotal(5, 250, null)).toBe("5 点・2.5 m");
    expect(formatUnitQuantityTotal(0, 0, null)).toBe("0 点");
  });

  it("REQ-501: 単価は長さの商品が 1 m あたり、個数の商品は今どおり", () => {
    expect(formatUnitPrice(700, "m")).toBe("¥700/m");
    expect(formatUnitPrice(1700, "pcs")).toBe("¥1,700");
  });

  it.each([
    ["83250", "832.50 円"],
    ["16650", "166.50 円"],
    ["5", "0.05 円"],
    ["0", "0.00 円"],
    ["100000", "1,000.00 円"],
    ["999998900000100", "9,999,989,000,001.00 円"],
    ["99999998900000001", "999,999,989,000,000.01 円"],
    ["", "—"],
    ["12a", "—"],
    ["-5", "—"],
    ["1.5", "—"],
  ])("REQ-201 / SPEC-UNIT-D6: 行の金額 %j は %s（number を通さない）", (centi, expected) => {
    expect(formatCentiYen(centi)).toBe(expected);
  });

  it.each([
    [100000, "¥1,000"],
    [8333, "¥83.33"],
    [5, "¥0.05"],
    [10, "¥0.10"],
    [0, "¥0"],
    [99999999, "¥999,999.99"],
  ])("Matrix C11 / SPEC-UNIT-D5: 原価 %s（1/100 円）は %s（半角の ¥）", (centi, expected) => {
    expect(formatCostYen(centi)).toBe(expected);
  });

  it("REQ-303: 長さの商品だけ m にし、個数と単位の分からない行は語を付けない数", () => {
    expect(formatLengthOrPlain(2750, "m")).toBe("27.5 m");
    expect(formatLengthOrPlain(-50, "m")).toBe("-0.5 m");
    expect(formatLengthOrPlain(13, "pcs")).toBe("13");
    expect(formatLengthOrPlain(2750, undefined)).toBe("2750");
    expect(formatLengthOrPlain(2750, "ball", (q) => q.toLocaleString("ja-JP"))).toBe("2,750");
  });
});

// SC16（Gated Amendment 6 S45、owner run 5 bug）: unit code の生表示（`pcs`）を
// 日本語ラベルへ変換する helper。数量を持たない単位列（入庫 / 廃棄 / 返品交換 /
// 手動販売の行データ）向け。
describe("formatStockUnitLabel (Gated Amendment 6 S45)", () => {
  it("pcs は「個」", () => {
    expect(formatStockUnitLabel("pcs")).toBe("個");
  });

  it("m はそのまま「m」（入力の単位を示す）", () => {
    expect(formatStockUnitLabel("m")).toBe("m");
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

it.each([
  [1234, "pcs", "1,234 個"],
  [1234, "m", "12.34 m"],
  [10, "pcs", "10 個"],
  [300, "m", "3 m"],
  [-1234, "pcs", "-1,234 個"],
] as const)("⑮ SC22: 数量 %s %s の桁区切り表示", (quantity, unit, expected) => {
  expect(formatStockDisplay(quantity, unit)).toBe(expected);
});
