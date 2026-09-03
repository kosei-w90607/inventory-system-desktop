// src/components/ui/segmented-control.test.tsx
//
// UI-WF-2026-05-22: app-wide two-choice controls share the same segmented
// visual primitive while exposing a non-color selected state.
// SC6（Gated Amendment 2 S9、Final Review round 1 owner L3 FAIL-1）: 操作群の
// affordance として群 wrapper に border-border-strong の 1 枠を持つこと（DSR-22
// `:443` の segmented 対象化）と、file から stone-300 直書きが 0 になっていること。

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { SegmentedControl } from "./segmented-control";

const REPO_ROOT = join(__dirname, "../../..");
const SOURCE = readFileSync(join(REPO_ROOT, "src/components/ui/segmented-control.tsx"), "utf8");

describe("SegmentedControl (UI-WF-2026-05-22 shared two-choice control)", () => {
  const options = [
    { value: "daily", label: "日次" },
    { value: "monthly", label: "月次" },
  ] as const;

  it("exposes the selected option through aria-pressed, data-state, and shared active tone", () => {
    render(
      <SegmentedControl
        ariaLabel="売上レポート切替"
        value="daily"
        options={options}
        onValueChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("group", { name: "売上レポート切替" })).toBeInTheDocument();

    const activeButton = screen.getByRole("button", { name: "日次", pressed: true });
    const inactiveButton = screen.getByRole("button", { name: "月次", pressed: false });

    expect(activeButton).toHaveAttribute("data-state", "active");
    // SidebarLink と同じ共有 tone（selection-tone.ts の SELECTION_TONE_ACTIVE）。
    // border は stone-400（旧: 群 wrapper 撤去前は stone-300 だったが、共有 tone の
    // border 色は stone-400、bg は stone-300 のまま不変）。
    expect(activeButton).toHaveClass(
      "border-stone-400",
      "bg-stone-300",
      "font-semibold",
      "text-stone-950",
    );
    expect(inactiveButton).toHaveAttribute("data-state", "inactive");
    expect(inactiveButton).toHaveClass("text-foreground/60", "hover:text-foreground");
  });

  it("emits only direct changes to a different option", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="売上レポート切替"
        value="daily"
        options={options}
        onValueChange={onValueChange}
      />,
    );

    await user.click(screen.getByRole("button", { name: "日次", pressed: true }));
    await user.click(screen.getByRole("button", { name: "月次", pressed: false }));

    expect(onValueChange).toHaveBeenCalledTimes(1);
    expect(onValueChange).toHaveBeenCalledWith("monthly");
  });
});

describe("SC6: SegmentedControl group wrapper has border-border-strong and the source contains no stone-300 literal", () => {
  it("group wrapper（role=group）は border-border-strong の 1 枠を持つ", () => {
    const options = [
      { value: "active", label: "表示中" },
      { value: "all", label: "すべて" },
    ] as const;
    render(
      <SegmentedControl
        ariaLabel="廃番表示"
        value="active"
        options={options}
        onValueChange={vi.fn()}
      />,
    );
    const group = screen.getByRole("group", { name: "廃番表示" });
    expect(group).toHaveClass(
      "rounded-md",
      "border",
      "border-border-strong",
      "bg-background",
      "p-0.5",
    );
  });

  it("未選択肢は button のまま border-transparent を保つ", () => {
    const options = [
      { value: "active", label: "表示中" },
      { value: "all", label: "すべて" },
    ] as const;
    render(
      <SegmentedControl
        ariaLabel="廃番表示"
        value="active"
        options={options}
        onValueChange={vi.fn()}
      />,
    );
    const inactiveButton = screen.getByRole("button", { name: "すべて", pressed: false });
    expect(inactiveButton.tagName).toBe("BUTTON");
    expect(inactiveButton).toHaveClass("border-transparent");
  });

  it("fs literal oracle: segmented-control.tsx に stone-300 の直書きが残らない", () => {
    expect(SOURCE).not.toContain("stone-300");
  });
});
