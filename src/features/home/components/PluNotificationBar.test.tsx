import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderWithRouter } from "@/test/render-with-router";
import { PluNotificationBar, type PluNotificationBarProps } from "./PluNotificationBar";

function makePluDirtyQuery(
  state: Pick<PluNotificationBarProps["pluDirty"], "isSuccess" | "isLoading" | "isError">,
): PluNotificationBarProps["pluDirty"] {
  return state as PluNotificationBarProps["pluDirty"];
}

function renderBar(
  query: Pick<PluNotificationBarProps["pluDirty"], "isSuccess" | "isLoading" | "isError">,
  count: number,
) {
  return renderWithRouter(
    <PluNotificationBar pluDirty={makePluDirtyQuery(query)} pluDirtyCount={count} />,
  );
}

describe("PluNotificationBar UI-00 / DSR-08 warning icon", () => {
  it("成功かつ未反映ありでは alert 内に icon を 1 つ表示する", async () => {
    renderBar({ isSuccess: true, isLoading: false, isError: false }, 1);

    expect((await screen.findByRole("alert")).querySelectorAll("svg")).toHaveLength(1);
  });

  it.each([
    ["loading", { isSuccess: false, isLoading: true, isError: false }, 1],
    ["error", { isSuccess: false, isLoading: false, isError: true }, 1],
    ["count 0", { isSuccess: true, isLoading: false, isError: false }, 0],
  ] as const)("%s では通知バーを表示しない", (_label, query, count) => {
    renderBar(query, count);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });
});
