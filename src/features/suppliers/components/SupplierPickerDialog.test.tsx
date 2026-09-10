import { useState } from "react";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, expect, it, vi } from "vitest";
import { commands, type Supplier } from "@/lib/bindings";
import { SupplierPickerDialog } from "./SupplierPickerDialog";

vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/bindings", () => ({ commands: { createSupplier: vi.fn() } }));
const suppliers: Supplier[] = [
  { id: 1, name: "か商店", created_at: "2026-09-10" },
  { id: 2, name: "あ商店", created_at: "2026-09-10" },
];
function setup(overrides: Partial<React.ComponentProps<typeof SupplierPickerDialog>> = {}) {
  const onSelect = vi.fn();
  const onCreated = vi.fn(() => Promise.resolve());
  const onRetry = vi.fn();
  function Harness() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button
          onClick={() => {
            setOpen(true);
          }}
        >
          起動
        </button>
        <SupplierPickerDialog
          open={open}
          onOpenChange={setOpen}
          suppliers={suppliers}
          selected={1}
          leadingLabel="取引先なし"
          isLoading={false}
          isError={false}
          onSelect={onSelect}
          onCreated={onCreated}
          onRetry={onRetry}
          {...overrides}
        />
      </>
    );
  }
  const view = render(<Harness />);
  return { ...view, onSelect, onCreated, onRetry, user: userEvent.setup() };
}
beforeEach(() => vi.clearAllMocks());

it("DSR-24: renders title, description, search, current-selection band and fixed footer outside the scroll box", async () => {
  const { user } = setup();
  await user.click(screen.getByText("起動"));
  const dialog = screen.getByRole("dialog", { name: "取引先を選択" });
  expect(dialog).toHaveAccessibleDescription("名前で検索して選ぶか、取引先を新規登録します。");
  expect(screen.getByRole("searchbox", { name: "取引先名で検索" })).toBeInTheDocument();
  const table = screen.getByRole("table");
  const scrollBox = table.parentElement;
  expect(scrollBox).toHaveClass("max-h-[50vh]", "overflow-auto");
  expect(scrollBox).not.toContainElement(screen.getByText("現在の選択"));
  expect(screen.getByRole("columnheader", { name: "選択" })).toHaveClass("sr-only");
  const current = screen.getByRole("row", { name: /選択中.*か商店/ });
  expect(current).toHaveClass("bg-row-current");
  expect(current).toHaveClass("border-l-primary");
  expect(current.querySelector("svg")).toBeInTheDocument();
  const add = screen.getByRole("button", { name: "新しい取引先を追加" });
  const close = screen.getByRole("button", { name: "閉じる" });
  expect(scrollBox).not.toContainElement(add);
  expect(scrollBox).not.toContainElement(close);
  expect(add).toHaveAttribute("data-variant", "default");
  expect(close).toHaveAttribute("data-variant", "outline");
});
it("DSR-24: lists leading row first and suppliers sorted by name", async () => {
  const { user } = setup();
  await user.click(screen.getByText("起動"));
  expect(
    within(screen.getByRole("table"))
      .getAllByRole("button")
      .map((x) => x.textContent),
  ).toEqual(["取引先なし", "あ商店", "か商店"]);
});
it("DSR-24: filters rows by search text and shows EmptyState when nothing matches", async () => {
  const { user } = setup();
  await user.click(screen.getByText("起動"));
  const search = screen.getByRole("searchbox");
  await user.type(search, " あ ");
  expect(screen.getByRole("button", { name: "あ商店" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "か商店" })).not.toBeInTheDocument();
  await user.clear(search);
  await user.type(search, "なしなし");
  expect(screen.getByText("該当する取引先はありません")).toBeInTheDocument();
  await user.clear(search);
  expect(screen.getByRole("button", { name: "か商店" })).toBeInTheDocument();
});
it("DSR-24: selecting a row calls onSelect once and closes", async () => {
  const { user, onSelect } = setup();
  await user.click(screen.getByText("起動"));
  await user.type(screen.getByRole("searchbox"), "あ");
  await user.click(screen.getByRole("button", { name: "あ商店" }));
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(2);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  await user.click(screen.getByText("起動"));
  expect(screen.getByRole("searchbox")).toHaveValue("");
  await user.click(screen.getByRole("button", { name: "取引先なし" }));
  expect(onSelect).toHaveBeenLastCalledWith(null);
});
it("DSR-24: escape and close button do not change selection", async () => {
  const { user, onSelect } = setup();
  for (const close of [
    async () => user.keyboard("{Escape}"),
    async () => user.click(screen.getByRole("button", { name: "閉じる" })),
    () => {
      const overlay = document.querySelector('[data-slot="dialog-overlay"]');
      if (!overlay) throw new Error("Dialog overlay missing");
      fireEvent.pointerDown(overlay);
      return Promise.resolve();
    },
  ]) {
    await user.click(screen.getByText("起動"));
    await close();
    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
  }
  expect(onSelect).not.toHaveBeenCalled();
});
it("UI-01b-D21: auto-selects the created supplier and closes both dialogs", async () => {
  const created = { id: 3, name: "新取引先", created_at: "2026-09-10" };
  vi.mocked(commands.createSupplier).mockResolvedValue({ status: "ok", data: created });
  let finish!: () => void;
  const refreshed = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const onCreated = vi.fn(() => refreshed);
  const { user, onSelect } = setup({ onCreated });
  await user.click(screen.getByText("起動"));
  await user.click(screen.getByRole("button", { name: "新しい取引先を追加" }));
  await user.type(screen.getByLabelText("取引先名"), "新取引先");
  await user.click(screen.getByRole("button", { name: "追加する" }));
  expect(onCreated).toHaveBeenCalledExactlyOnceWith(created);
  expect(onSelect).not.toHaveBeenCalled();
  await act(async () => {
    finish();
    await refreshed;
  });
  await waitFor(() => {
    expect(screen.queryByRole("dialog", { hidden: true })).not.toBeInTheDocument();
  });
  expect(onSelect).toHaveBeenCalledExactlyOnceWith(3);
});
it("DSR-24: shows skeleton while loading and alert with retry on error", async () => {
  const loading = setup({ isLoading: true });
  await loading.user.click(screen.getByText("起動"));
  expect(screen.getByRole("status", { name: "一覧を読み込み中" })).toBeInTheDocument();
  expect(screen.queryByRole("row")).not.toBeInTheDocument();
  loading.unmount();
  const { user, onRetry } = setup({ isError: true });
  await user.click(screen.getByText("起動"));
  expect(screen.getByRole("alert")).toHaveTextContent("取引先一覧を取得できませんでした");
  expect(screen.queryByRole("row")).not.toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "再試行" }));
  expect(onRetry).toHaveBeenCalledTimes(1);
});
it("DSR-24: focuses search input on open, returns focus to search after inner dialog closes, and to the trigger after picker closes", async () => {
  const { user } = setup();
  const trigger = screen.getByText("起動");
  await user.click(trigger);
  const search = screen.getByRole("searchbox");
  expect(search).toHaveFocus();
  await user.click(screen.getByRole("button", { name: "新しい取引先を追加" }));
  await user.click(screen.getByRole("button", { name: "キャンセル" }));
  await waitFor(() => {
    expect(search).toHaveFocus();
  });
  await user.click(screen.getByRole("button", { name: "閉じる" }));
  await waitFor(() => {
    expect(trigger).toHaveFocus();
  });
});
it("DSR-24: escape closes only the inner create dialog", async () => {
  const { user } = setup();
  await user.click(screen.getByText("起動"));
  await user.click(screen.getByRole("button", { name: "新しい取引先を追加" }));
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog", { name: "新しい取引先を追加" })).not.toBeInTheDocument();
  expect(screen.getByRole("dialog", { name: "取引先を選択" })).toBeInTheDocument();
  await waitFor(() => {
    expect(screen.getByRole("searchbox")).toHaveFocus();
  });
});
it("DSR-24: shows the leading label when selected is null and permits an empty master", async () => {
  const { user } = setup({ suppliers: [], selected: null });
  await user.click(screen.getByText("起動"));
  expect(screen.getByText("現在の選択").parentElement).toHaveTextContent("取引先なし");
  expect(within(screen.getByRole("table")).getAllByRole("button")).toHaveLength(1);
});

it("DSR-24: shows an unresolved current-selection label for a missing selected id", async () => {
  const { user } = setup({ selected: 999 });
  await user.click(screen.getByText("起動"));
  expect(screen.getByText("現在の選択").parentElement).toHaveTextContent("取引先を確認できません");
});
