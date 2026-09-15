import { render, screen } from "@testing-library/react";
import { AlertTriangle } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Alert, AlertDescription, AlertTitle } from "./alert";

describe("UI-12 conventions runtime: Alert", () => {
  it("SC18 / DSR-08: warning uses the independent catalog class contract", () => {
    render(
      <Alert variant="warning" role="note">
        <AlertTriangle aria-hidden="true" />
        <AlertTitle>ご注意</AlertTitle>
        <AlertDescription>保存前に確認してください。</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("note");
    expect(alert).toHaveAttribute("data-slot", "alert");
    expect(alert).toHaveAttribute("data-variant", "warning");
    expect(alert).toHaveClass(
      "bg-warning-soft",
      "border-warning",
      "text-warning-strong",
      "[&>svg]:text-warning",
      "*:data-[slot=alert-description]:text-warning-strong/90",
    );
    expect(alert.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(alert).toHaveTextContent("ご注意");
    // SPEC-DISP-B2-1 / D-B2: 本文より強い共通タイトル。
    expect(screen.getByText("ご注意")).toHaveClass("font-semibold");
    expect(screen.getByText("ご注意")).not.toHaveClass("font-medium");
    expect(alert).toHaveTextContent("保存前に確認してください。");
  });

  it.each(["default", "destructive"] as const)(
    "SC18: %s does not acquire warning styling",
    (variant) => {
      render(<Alert variant={variant}>既存の通知</Alert>);
      expect(screen.getByRole("alert")).toHaveAttribute("data-variant", variant);
      expect(screen.getByRole("alert")).toHaveClass("bg-card");
      expect(screen.getByRole("alert")).not.toHaveClass("bg-warning-soft");
    },
  );
});
