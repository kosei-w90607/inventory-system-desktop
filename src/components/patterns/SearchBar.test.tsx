// src/components/patterns/SearchBar.test.tsx
//
// SearchBar 共通 component の unit test。
// commit 型（debounceMs 未指定）と live 型（debounceMs 指定）の両モードを検証。
// 移管元:
//   - src/features/products/components/ProductSearchBar.test.tsx（commit 型）
//   - src/features/stock-inquiry/components/SearchBar.test.tsx（live 型）
// 設計: docs/function-design/59-ui-shared-patterns.md §59.5

import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SearchBar } from "./SearchBar";

afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// commit 型（debounceMs 未指定）— products 現実装から移管
// ---------------------------------------------------------------------------

describe("SearchBar commit 型（debounceMs 未指定、REQ-103 商品検索の入力欄）", () => {
  it("初期表示時に検索 input へ focus する", () => {
    render(<SearchBar value="" onSearchChange={vi.fn()} />);
    expect(screen.getByLabelText("商品検索")).toHaveFocus();
    // SC15: aria-label とは別に、commit 型の可視 Label と input の結線を固定する。
    const input = screen.getByRole("textbox", { name: "商品検索" });
    const label = screen.getByText("検索", { selector: "label" });
    expect(screen.getByLabelText("検索")).toBe(input);
    expect(label.getAttribute("for")).toBe(input.id);
    expect(screen.getByRole("textbox", { name: "商品検索" })).toHaveAttribute(
      "aria-label",
      "商品検索",
    );
  });

  it("DSR-17 T15: commit 型の mount focus は native scroll を抑止する", () => {
    const focus = vi.spyOn(HTMLInputElement.prototype, "focus");

    render(<SearchBar value="" onSearchChange={vi.fn()} />);

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("D-7 例外: 検索ボタンは border-border-strong を持つ（入力枠 3.53:1 との段差防止）", () => {
    render(<SearchBar value="" onSearchChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "検索" })).toHaveClass("border-border-strong");
  });

  it("Enter で確定値（trim 済み）を onSearchChange に渡す", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onSearchChange={onSearchChange} />);

    await user.type(screen.getByLabelText("商品検索"), "HZ-0047");
    await user.keyboard("{Enter}");

    expect(onSearchChange).toHaveBeenCalledWith("HZ-0047");
  });

  it("Enter で commit 時に trim される（前後空白除去）", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onSearchChange={onSearchChange} />);

    await user.type(screen.getByLabelText("商品検索"), "  はさみ  ");
    await user.keyboard("{Enter}");

    expect(onSearchChange).toHaveBeenCalledWith("はさみ");
  });

  it("IME 合成中（isComposing: true）の Enter で onSearchChange を呼ばない（commit 型）", () => {
    const onSearchChange = vi.fn();
    render(<SearchBar value="" onSearchChange={onSearchChange} />);

    const input = screen.getByLabelText("商品検索");
    input.focus();

    // IME 変換中（isComposing: true）の KeyboardEvent を dispatch
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(enterEvent, "isComposing", { value: true, configurable: true });
    input.dispatchEvent(enterEvent);

    expect(onSearchChange).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// live 型（debounceMs 指定）— stock-inquiry 現実装から移管
// ---------------------------------------------------------------------------

describe("SearchBar live 型（debounceMs 指定、REQ-301 在庫照会の検索欄）", () => {
  it("初期表示時に検索 input へ focus する", () => {
    render(<SearchBar value="" onSearchChange={vi.fn()} debounceMs={200} />);
    expect(screen.getByLabelText("商品を検索")).toHaveFocus();
    // SC15 / DSR-08: 可視ラベルを唯一の名前にし、既存の検索roleとfocusを維持する。
    const input = screen.getByRole("searchbox", { name: "商品を検索" });
    expect(input).not.toHaveAttribute("aria-label");
    expect(input).toHaveAttribute("id");
    expect(screen.getByText("商品を検索", { selector: "label" })).toHaveAttribute("for", input.id);
    expect(input).toHaveClass("max-w-md");
    // SC15 / AC-L3-3: live 型は他フィルタと同じ Label 上置き。
    const label = screen.getByText("商品を検索", { selector: "label" });
    expect(label.parentElement).toHaveClass("grid", "gap-1");
    expect(label.parentElement).not.toHaveClass("items-center");
    expect(label).not.toHaveClass("shrink-0");
  });

  it("SC15: live 型は inputClassName の指定で既定幅を上書きする", () => {
    render(<SearchBar value="" onSearchChange={vi.fn()} debounceMs={200} inputClassName="w-40" />);
    const input = screen.getByLabelText("商品を検索");
    expect(input).toHaveClass("w-40");
    expect(input).not.toHaveClass("max-w-md");
  });

  it("SC15: live 型は指定した可視 Label と id を結線する", () => {
    render(
      <SearchBar
        value=""
        onSearchChange={vi.fn()}
        debounceMs={200}
        label="コード検索"
        id="code-search"
      />,
    );
    const input = screen.getByRole("searchbox", { name: "コード検索" });
    const label = screen.getByText("コード検索", { selector: "label" });
    expect(screen.getByLabelText("コード検索")).toBe(input);
    expect(input).toHaveAttribute("id", "code-search");
    expect(label.getAttribute("for")).toBe(input.id);
    expect(input).not.toHaveAttribute("aria-label");
  });

  it("DSR-17 T15: live 型の mount focus は native scroll を抑止する", () => {
    const focus = vi.spyOn(HTMLInputElement.prototype, "focus");

    render(<SearchBar value="" onSearchChange={vi.fn()} debounceMs={200} />);

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it("Enter で debounce を待たず即時に onSearchChange を呼ぶ", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onSearchChange={onSearchChange} debounceMs={200} />);

    const input = screen.getByLabelText("商品を検索");
    await user.type(input, "はさみ");
    await user.keyboard("{Enter}");

    // Enter 押下時に確定値で即時発火（debounce 待ちなし）
    expect(onSearchChange).toHaveBeenCalledWith("はさみ");
  });

  it("live 型の Enter は trim しない（値をそのまま渡す）", async () => {
    const onSearchChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchBar value="" onSearchChange={onSearchChange} debounceMs={200} />);

    const input = screen.getByLabelText("商品を検索");
    await user.type(input, "  はさみ  ");
    await user.keyboard("{Enter}");

    // live 型は trim なし
    expect(onSearchChange).toHaveBeenCalledWith("  はさみ  ");
  });

  it("IME 合成中（isComposing: true）の Enter で onSearchChange を呼ばない（live 型）", () => {
    const onSearchChange = vi.fn();
    render(<SearchBar value="" onSearchChange={onSearchChange} debounceMs={200} />);

    const input = screen.getByLabelText("商品を検索");
    input.focus();

    // IME 変換中（isComposing: true）の KeyboardEvent を dispatch
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(enterEvent, "isComposing", { value: true, configurable: true });
    input.dispatchEvent(enterEvent);

    expect(onSearchChange).not.toHaveBeenCalled();
  });
});
