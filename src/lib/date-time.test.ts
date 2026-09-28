import { readFileSync, readdirSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { formatDateTime } from "@/lib/date-time";

const SOURCE_ROOT = join(process.cwd(), "src");
const DEFINITION_PATTERN = /\bfunction\s+formatDateTime\b|\b(?:const|let|var)\s+formatDateTime\s*=/;
const SHARED_IMPORT_PATTERN =
  /import\s*\{[^}]*\bformatDateTime\b[^}]*\}\s*from\s*["']@\/lib\/date-time["']/;

function productionSources(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) return productionSources(path);
    if (!/\.tsx?$/.test(extname(entry.name)) || /\.test\.tsx?$/.test(entry.name)) return [];
    return [path];
  });
}

describe("formatDateTime REQ-206 / 74 §74.7", () => {
  it("REQ-206 ⑰ UIDISP-D6: DB の YYYY-MM-DDTHH:MM:SS の T を半角スペースへ置くだけで時差変換しない", () => {
    expect(formatDateTime("2026-09-27T08:05:09")).toBe("2026-09-27 08:05:09");
    expect(formatDateTime("")).toBe("");
  });

  it("REQ-206 ⑰ UIDISP-D6: formatDateTime の定義は src/lib/date-time.ts だけで、使う file はすべて @/lib/date-time から import する", () => {
    const sources = productionSources(SOURCE_ROOT).map((path) => ({
      repoPath: relative(SOURCE_ROOT, path).split("\\").join("/"),
      source: readFileSync(path, "utf8"),
    }));
    const definers = sources
      .filter(({ source }) => DEFINITION_PATTERN.test(source))
      .map(({ repoPath }) => repoPath);
    const users = sources.filter(
      ({ repoPath, source }) => !definers.includes(repoPath) && /\bformatDateTime\b/.test(source),
    );

    expect(definers).toEqual(["lib/date-time.ts"]);
    expect(
      users
        .filter(({ source }) => !SHARED_IMPORT_PATTERN.test(source))
        .map(({ repoPath }) => repoPath),
    ).toEqual([]);
    // 走査の誤りで空集合のまま green にならないこと
    expect(users.length).toBeGreaterThan(0);
  });
});
