import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import dateTimeSource from "./PriceHistorySection.tsx?raw";
import { commands } from "@/lib/bindings";
import { PriceHistorySection } from "./PriceHistorySection";

vi.mock("@/lib/bindings", () => ({ commands: { listPriceHistory: vi.fn() } }));

describe("PriceHistorySection UI-01b / UIDISP-D6", () => {
  it("⑰ SC6 / UIDISP-D6: 変更日時は時差変換せず等幅の表セルに表示する", async () => {
    vi.mocked(commands.listPriceHistory).mockResolvedValue({
      status: "ok",
      data: [
        {
          id: 1,
          changed_at: "2026-09-09T23:45:06",
          old_selling_price: 100,
          new_selling_price: 120,
          old_cost_price: 60,
          new_cost_price: 70,
        },
      ],
    });
    render(<PriceHistorySection productCode="SYN-PRICE" />);
    expect(await screen.findByRole("cell", { name: "2026-09-09 23:45:06" })).toHaveClass(
      "font-mono",
      "tabular-nums",
    );
  });
});

it("⑰ SC6 / UIDISP-D6: 共有 formatDateTime を import しローカル定義を持たない", () => {
  expect(dateTimeSource).toMatch(
    /import\s*\{[^}]*\bformatDateTime\b[^}]*\}\s*from\s*"@\/features\/inventory-records\/types"/,
  );
  expect(dateTimeSource).not.toMatch(/function\s+(?:formatDateTime|formatCheckedAt)\s*\(/);
  expect(dateTimeSource).not.toContain("formatCheckedAt");
});
