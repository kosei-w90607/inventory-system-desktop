// src/test/page-root-pageshell-sweep.test.ts
//
// SC2b: page root 全置換（04 原則 6、D-1）。src/features/**/*Page.tsx（test 除外）の
// root class として p-6 を直書きする箇所が PageShell 経由以外に残っていないことを
// fs scan で保証する。許容 2 箇所（非 root: overlay / card、IntegrityCheckPage.tsx）のみ許す。
// Plan Packet: docs/plans/2026-09-03-ui-list-backbone-d-lane2.md S2
// 共有部品の contract test。traceability 上は Lane 2 pilot = UI-01a へ紐付け（Gated Amendment 1）。

import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const REPO_ROOT = join(__dirname, "../..");
const FEATURES_ROOT = join(REPO_ROOT, "src/features");

// 許容される非 root p-6 direct className（root ではないため PageShell 化の対象外）
const ALLOWED_NON_ROOT_HITS = 2;

function collectPageFiles(dir: string): string[] {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectPageFiles(fullPath));
    } else if (
      entry.isFile() &&
      extname(entry.name) === ".tsx" &&
      entry.name.endsWith("Page.tsx") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

describe("SC2b: no feature page file declares a p-6 root className outside PageShell (UI-01a pilot / 共有 page root)", () => {
  it("p-6 直書き className の hit は非 root 2 箇所のみ", () => {
    const pageFiles = collectPageFiles(FEATURES_ROOT);
    const rootClassPattern = /className="[^"]*\bp-6\b[^"]*"/g;
    let hitCount = 0;
    const hits: string[] = [];

    for (const file of pageFiles) {
      const source = readFileSync(file, "utf8");
      const matches = source.match(rootClassPattern);
      if (matches) {
        hitCount += matches.length;
        for (const match of matches) {
          hits.push(`${relative(REPO_ROOT, file)}: ${match}`);
        }
      }
    }

    expect(hitCount, hits.join("\n")).toBe(ALLOWED_NON_ROOT_HITS);
  });

  it("28 file が PageShell を import して page root に使う", () => {
    const pageFiles = collectPageFiles(FEATURES_ROOT);
    const filesUsingPageShell = pageFiles.filter((file) =>
      readFileSync(file, "utf8").includes("<PageShell"),
    );
    expect(filesUsingPageShell.length).toBe(28);
  });
});
