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
describe("SC13: globals.css declares an unlayered forced-colors focus outline (Gated Amendment 3 追補 S16 / AC-L3-4)", () => {
  it("declares exactly one forced-colors media block, positioned before @layer base, giving :focus-visible a Highlight outline", () => {
    const mediaLiteral = "@media (forced-colors: active)";
    const occurrences = GLOBALS_CSS.split(mediaLiteral).length - 1;
    expect(occurrences).toBe(1);

    const mediaIndex = GLOBALS_CSS.indexOf(mediaLiteral);
    const layerBaseIndex = GLOBALS_CSS.indexOf("@layer base {");
    expect(mediaIndex).toBeGreaterThan(-1);
    expect(layerBaseIndex).toBeGreaterThan(-1);
    expect(mediaIndex).toBeLessThan(layerBaseIndex);

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
    expect(block).toContain("Highlight");
  });
});
