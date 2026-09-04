import { describe, expect, it } from "vitest";

import { LIST_PER_PAGE_OPTIONS } from "./list-per-page";

describe("SC1 UI-01a: shared list per-page options", () => {
  it("equals [50, 100, 200] from an independently transcribed oracle", () => {
    expect(LIST_PER_PAGE_OPTIONS).toEqual([50, 100, 200]);
  });
});
