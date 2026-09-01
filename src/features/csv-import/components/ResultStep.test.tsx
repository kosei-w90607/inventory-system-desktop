import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it, vi } from "vitest";
import { renderWithRouter } from "@/test/render-with-router";
import { ResultStep } from "./ResultStep";

it("test_import_result_req401_rollback_dialog_identifies_exact_import_and_sibling_survival", async () => {
  // REQ-401 / I-U7 / SPEC-SDI-D7: rollback対象ID/date/amountとsibling残存をexact表示する。
  const user = userEvent.setup();
  const onRollback = vi.fn();
  renderWithRouter(
    <ResultStep
      result={{
        csv_import_id: 42,
        status: "completed",
        total_items: 2,
        total_amount: -300,
        skipped_count: 0,
      }}
      settlementDate="2026-03-21"
      filename="Z004_0002.CSV"
      onRollback={onRollback}
      isRollingBack={false}
    />,
  );
  expect(await screen.findByText("2026-03-21")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: "取り消す" }));
  const dialog = screen.getByRole("alertdialog");
  expect(dialog).toHaveTextContent(
    "この取込みだけを取り消します。同じ日の他の取込みは残ります。この取込みによる在庫数も元に戻ります。",
  );
  // UI-07-D14 の規定項目（Scope 2 構造化: ID / 精算日 / filename / 件数 / 金額）が
  // ラベル付きで全て残っていることを確認する（T2）。
  expect(within(dialog).getByText("取込み ID")).toBeInTheDocument();
  expect(within(dialog).getByText("42")).toBeInTheDocument();
  expect(within(dialog).getByText("精算日")).toBeInTheDocument();
  expect(within(dialog).getByText("2026-03-21")).toBeInTheDocument();
  expect(dialog).toHaveTextContent("Z004_0002.CSV");
  expect(within(dialog).getByText("取込み件数")).toBeInTheDocument();
  expect(dialog).toHaveTextContent("2 件");
  expect(within(dialog).getByText("合計金額")).toBeInTheDocument();
  expect(dialog).toHaveTextContent("¥-300");
  expect(within(dialog).getByRole("button", { name: "取り消す" })).toHaveAttribute(
    "data-variant",
    "destructive",
  );
  await user.click(screen.getByRole("button", { name: "取り消す" }));
  expect(onRollback).toHaveBeenCalledTimes(1);
});
