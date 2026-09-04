// src/styles/globals.test.ts
//
// SC1: token 5 件（--border-strong / --row-current / --border / --input / --list-head）+
// @theme map 3 件の fs literal oracle。値は独立転記（production 定数を import しない）。
// 共有部品の contract test。traceability 上は Lane 2 pilot = UI-01a へ紐付け（Gated Amendment 1）。
// Plan Packet: docs/plans/2026-09-03-ui-list-backbone-d-lane2.md S1 / D-7

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "../..");
const GLOBALS_CSS = readFileSync(join(REPO_ROOT, "src/styles/globals.css"), "utf8");
const INPUT_TSX = readFileSync(join(REPO_ROOT, "src/components/ui/input.tsx"), "utf8");
const SELECT_TSX = readFileSync(join(REPO_ROOT, "src/components/ui/select.tsx"), "utf8");

describe("SC1: globals.css declares border-strong / row-current / border / input tokens (UI-01a pilot / 共有 token)", () => {
  it("declares the five :root token literals", () => {
    expect(GLOBALS_CSS).toContain("--border-strong: #8a8480;");
    expect(GLOBALS_CSS).toContain("--row-current: #fff8e6;");
    expect(GLOBALS_CSS).toContain("--border: #cdc8c4;");
    expect(GLOBALS_CSS).toContain("--input: var(--border-strong);");
    expect(GLOBALS_CSS).toContain("--list-head: #e7e5e4;");
  });

  it("maps the three new tokens in @theme inline", () => {
    expect(GLOBALS_CSS).toContain("--color-border-strong: var(--border-strong);");
    expect(GLOBALS_CSS).toContain("--color-row-current: var(--row-current);");
    expect(GLOBALS_CSS).toContain("--color-list-head: var(--list-head);");
  });
});

// SC13（Gated Amendment 3 追補 S16、Opus P1-1 / AC-L3-4）: forced-colors では box-shadow が
// 無効化され border 色も system color に置換されるため、`outline-none` + `focus-visible:border-ring`
// だけでは focus が消える。`@layer` 外（unlayered）の `:focus-visible` outline で
// `@layer utilities` の `outline-none` に勝つ。
// closure round 2 S20（Opus P2-1）: 「`@layer base {` より前」という位置プロキシは
// `@layer base { ... }` の出現位置に依存し揺れる。block 開始位置までの file 文字列で
// `{` / `}` の対応数が 0（nesting depth 0 = どの block にも入っていない）ことを直接検査する
// 形に替え、`outline: 2px solid Highlight` を literal で pin する
// （`outline: 0 solid Highlight` のような値差し替えを素通ししない）。
describe("SC13: globals.css declares an unlayered forced-colors focus outline (Gated Amendment 3 追補 S16 / AC-L3-4 / closure round 2 S20)", () => {
  it("declares exactly one forced-colors media block at brace nesting depth 0, pinning the Highlight outline literal", () => {
    const mediaLiteral = "@media (forced-colors: active)";
    const occurrences = GLOBALS_CSS.split(mediaLiteral).length - 1;
    expect(occurrences).toBe(1);

    const mediaIndex = GLOBALS_CSS.indexOf(mediaLiteral);
    expect(mediaIndex).toBeGreaterThan(-1);

    // block 開始位置までの file 文字列で `{` / `}` の対応数を数え、0（nesting depth 0）
    // であることを直接検査する（どの @layer / block にも入っていない）。
    const beforeMedia = GLOBALS_CSS.slice(0, mediaIndex);
    const opensBefore = (beforeMedia.match(/{/g) ?? []).length;
    const closesBefore = (beforeMedia.match(/}/g) ?? []).length;
    expect(opensBefore - closesBefore).toBe(0);

    // block は `{` から対応する `}` まで（prettier の折返しで複数行になり得るため
    // 改行ではなく波括弧の対応を数えて block の終端を求める）。
    const openIndex = GLOBALS_CSS.indexOf("{", mediaIndex);
    expect(openIndex).toBeGreaterThan(-1);
    let depth = 0;
    let closeIndex = -1;
    for (let i = openIndex; i < GLOBALS_CSS.length; i += 1) {
      if (GLOBALS_CSS[i] === "{") depth += 1;
      else if (GLOBALS_CSS[i] === "}") {
        depth -= 1;
        if (depth === 0) {
          closeIndex = i;
          break;
        }
      }
    }
    expect(closeIndex).toBeGreaterThan(-1);
    const block = GLOBALS_CSS.slice(mediaIndex, closeIndex + 1);
    expect(block).toContain(":focus-visible");
    // `outline: 2px solid Highlight` を literal で pin する（prettier の空白差には
    // robust にしつつ、`2px solid Highlight` の値は literal 固定で「0」等への
    // 差し替えを素通ししない）。
    expect(block).toMatch(/outline:\s*2px solid Highlight/);
  });
});

// SC15（Gated Amendment 6 S44、owner run 2 所感の要望化。Gated Amendment 7 S46 で
// owner run 6「検索欄と Select の色は FAFAF9 で」により #ffffff → #fafaf9 へ更新）:
// 入力欄・Select の操作面を独立 token（--background と同値だが分離）にする。
// file:bg-transparent（input の file-selector-button 疑似要素）
// は対象外の別 utility のため不変、base の bg-transparent（border-input と対になる面）のみ置換する。
describe("SC15: control-surface token + input/select surface (Gated Amendment 6 S44 / Amendment 7 S46)", () => {
  it("declares --control-surface: #fafaf9 in :root and maps it in @theme inline", () => {
    expect(GLOBALS_CSS).toContain("--control-surface: #fafaf9;");
    expect(GLOBALS_CSS).toContain("--color-control-surface: var(--control-surface);");
  });

  it("input.tsx uses bg-control-surface for the base surface, keeps file:bg-transparent and dark:bg-input/30", () => {
    expect(INPUT_TSX).toContain("border-input bg-control-surface");
    expect(INPUT_TSX).not.toContain("border-input bg-transparent");
    expect(INPUT_TSX).toContain("file:bg-transparent");
    expect(INPUT_TSX).toContain("dark:bg-input/30");
  });

  it("select.tsx SelectTrigger uses bg-control-surface for the base surface, keeps dark:bg-input/30", () => {
    expect(SELECT_TSX).toContain("border-input bg-control-surface");
    expect(SELECT_TSX).not.toContain("border-input bg-transparent");
    expect(SELECT_TSX).toContain("dark:bg-input/30");
  });
});
