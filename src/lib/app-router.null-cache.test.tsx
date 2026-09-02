import { describe, expect, it } from "vitest";

const sessionStorageDescriptor = Object.getOwnPropertyDescriptor(window, "sessionStorage");
Object.defineProperty(window, "sessionStorage", {
  configurable: true,
  get() {
    throw new Error("sessionStorage disabled");
  },
});

const { scrollRestorationCache } = await import("@tanstack/router-core");
const { createAppRouter, pruneScrollRestorationEntries } = await import("./app-router");

if (sessionStorageDescriptor !== undefined) {
  Object.defineProperty(window, "sessionStorage", sessionStorageDescriptor);
}

describe("UI-12 / DSR-17 null scroll restoration cache", () => {
  it("SP4: prune is a no-op when scrollRestorationCache is null", () => {
    // DSR-17 (j) / D-G: sessionStorage-unavailable environments remain fail-safe.
    expect(scrollRestorationCache).toBeNull();
    expect(() => createAppRouter()).not.toThrow();
    expect(() => {
      pruneScrollRestorationEntries();
    }).not.toThrow();
    expect(() => {
      pruneScrollRestorationEntries("/stock");
    }).not.toThrow();
  });
});
