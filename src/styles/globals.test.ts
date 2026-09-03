// src/styles/globals.test.ts
//
// SC1: token 4 件（--border-strong / --row-current / --border / --input）+ @theme map 2 件の
// fs literal oracle。値は独立転記（production 定数を import しない）。
// 共有部品の contract test。traceability 上は Lane 2 pilot = UI-01a へ紐付け（Gated Amendment 1）。
// Plan Packet: docs/plans/2026-09-03-ui-list-backbone-d-lane2.md S1 / D-7

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "../..");
const GLOBALS_CSS = readFileSync(join(REPO_ROOT, "src/styles/globals.css"), "utf8");

describe("SC1: globals.css declares border-strong / row-current / border / input tokens (UI-01a pilot / 共有 token)", () => {
  it("declares the four :root token literals", () => {
    expect(GLOBALS_CSS).toContain("--border-strong: #8a8480;");
    expect(GLOBALS_CSS).toContain("--row-current: #fff8e6;");
    expect(GLOBALS_CSS).toContain("--border: #cdc8c4;");
    expect(GLOBALS_CSS).toContain("--input: var(--border-strong);");
  });

  it("maps the two new tokens in @theme inline", () => {
    expect(GLOBALS_CSS).toContain("--color-border-strong: var(--border-strong);");
    expect(GLOBALS_CSS).toContain("--color-row-current: var(--row-current);");
  });
});
