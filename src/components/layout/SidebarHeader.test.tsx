import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";

import { consumeMainNavScroll } from "@/lib/main-nav-scroll";
import { renderWithRouter } from "@/test/render-with-router";

import { SidebarHeader } from "./SidebarHeader";

describe("UI-12 / DSR-17 SidebarHeader main navigation scroll marker", () => {
  beforeEach(() => {
    consumeMainNavScroll();
  });

  it("T3: marks the home href when the store-name logo is clicked", async () => {
    const user = userEvent.setup();
    renderWithRouter(<SidebarHeader />);

    await user.click(await screen.findByRole("link", { name: "在庫管理システム" }));

    expect(consumeMainNavScroll()).toBe("/");
  });
});
