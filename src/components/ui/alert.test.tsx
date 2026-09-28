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
      expect(screen.getByRole("alert")).not.toHaveClass("bg-warning-soft");
      expect(screen.getByRole("alert")).not.toHaveClass("text-warning-strong");
    },
  );

  it("SC18: default keeps the neutral card surface", () => {
    render(<Alert>既存の通知</Alert>);
    expect(screen.getByRole("alert")).toHaveClass("bg-card", "text-card-foreground");
  });

  // SPEC-COLOR-EMPHASIS-RT-1 / D-CE2: 危険・失敗の Alert は段 2（薄い地 + 線 + 三角 icon + 文言）。
  // icon は部品が描き、site は icon を書かない。
  it("D-CE2 / DSR-08: destructive has the soft four-class contract and draws exactly one hidden icon", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>取得に失敗しました</AlertTitle>
        <AlertDescription>再試行してください。</AlertDescription>
      </Alert>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveClass(
      "bg-destructive-soft",
      "border-destructive",
      "text-destructive-strong",
      "[&>svg]:text-destructive",
      "*:data-[slot=alert-description]:text-destructive-strong/90",
    );
    expect(alert).not.toHaveClass("bg-card");
    const icons = alert.querySelectorAll("svg");
    expect(icons).toHaveLength(1);
    expect(icons[0]).toHaveAttribute("aria-hidden", "true");
    expect(alert.firstElementChild).toBe(icons[0]);
    // 読み上げは文言だけ（icon は aria-hidden）。
    expect(alert).toHaveTextContent("取得に失敗しました再試行してください。");
  });

  it.each(["default", "warning"] as const)(
    "D-CE2: %s does not draw an icon by itself",
    (variant) => {
      render(
        <Alert variant={variant}>
          <AlertTitle>お知らせ</AlertTitle>
        </Alert>,
      );
      expect(screen.getByRole("alert").querySelectorAll("svg")).toHaveLength(0);
    },
  );
});
