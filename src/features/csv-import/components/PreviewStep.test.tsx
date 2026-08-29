import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { PreviewData } from "@/lib/bindings";
import { PreviewStep } from "./PreviewStep";

const preview: PreviewData = {
  file_info: {
    filename: "Z004_0002.CSV",
    settlement_date: "2026-03-21",
    file_hash: "a".repeat(64),
  },
  matched_summary: { count: 2, total_amount: 900, warnings: [] },
  error_summary: { count: 0, items: [] },
  duplicate_check: {
    status: "AdditionalImportConfirmationRequired",
    same_date_imports: [
      {
        id: 12,
        filename: "Z004_0001.CSV",
        total_items: 3,
        total_amount: 1200,
        imported_at: "2026-03-21T09:00:00",
      },
      {
        id: 11,
        filename: "Z004_0000.CSV",
        total_items: 1,
        total_amount: -300,
        imported_at: "2026-03-21T08:00:00",
      },
    ],
  },
  preview_created_at: "2026-03-21T10:00:00",
};

describe("PreviewStep REQ-401 same-day addition", () => {
  it("test_additional_import_req401_alert_dialog_lists_all_cancel_then_confirms_once", async () => {
    // REQ-401 / I-U1 / I-U2 / I-U5 / I-U6 / SPEC-SDI-D5: exact UI、全summary、cancel/Esc、single submit。
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <PreviewStep
        preview={preview}
        filename="Z004_0002.CSV"
        onConfirm={onConfirm}
        onReselect={vi.fn()}
        isImporting={false}
      />,
    );

    // DSR-03 gated Amendment 4: 同日追加確認は画面上部の Alert 帯専用スロットに置き、
    // 紐付け結果カードより DOM 順で先行する（owner L3-lite round 2 裁定）。
    const alertBanner = screen.getByRole("alert");
    expect(alertBanner).toHaveTextContent("同じ日の取込みがあります");
    expect(alertBanner).toHaveTextContent(
      "既存分を残したまま今回分を追加します。内容を確認してください。",
    );
    const matchingResultHeading = screen.getByText("紐付け結果");
    expect(
      alertBanner.compareDocumentPosition(matchingResultHeading) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    // Badge は主情報を上部 Alert に譲り、補助的な状態表示へ改名（gated Amendment 4）。
    expect(screen.getByText("同日データあり")).toBeInTheDocument();
    expect(screen.queryByText("追加確認")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "取り込む" }));
    expect(screen.getByText("同じ日のデータを追加で取り込みますか？")).toBeInTheDocument();
    const dialog = screen.getByRole("alertdialog");
    expect(dialog).toHaveTextContent("既存分（2回）");
    // UI-07-D13 の規定項目（import ID / filename(s) / 金額 / 取込み日時）が省略なく
    // 全件表示されることを確認する（T3 項目完全性 oracle、gated Amendment 3/4 でも不変）。
    // DSR-16 構造 assert: 既存分・今回分とも同一の列を揃えた表（比較目的の structured
    // list）で render される（gated Amendment 4: 今回分の definition list 分離を廃止）。
    const table = within(dialog).getByRole("table");
    expect(within(table).getByRole("columnheader", { name: "取込み ID" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "ファイル名" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "合計金額" })).toBeInTheDocument();
    expect(within(table).getByRole("columnheader", { name: "取込み日時" })).toBeInTheDocument();
    // ヘッダ行 + 既存分2件 + 今回分1行 = 4行。per-card の反復ではなく1つの表に全件が並ぶ。
    expect(within(table).getAllByRole("row")).toHaveLength(4);
    expect(within(table).getByText("12")).toBeInTheDocument();
    expect(table).toHaveTextContent("Z004_0001.CSV");
    expect(table).toHaveTextContent("¥1,200 / 3件");
    // 取込み日時は人間向け表示（既存 formatDateTime 慣行: ISOの"T"を空白へ）。
    expect(table).toHaveTextContent("2026-03-21 09:00:00");
    expect(within(table).getByText("11")).toBeInTheDocument();
    expect(table).toHaveTextContent("Z004_0000.CSV");
    expect(table).toHaveTextContent("¥-300 / 1件");
    // 今回分は同一 table の最終行（ID 列に「今回」Badge、既存分と同列位置）。
    expect(within(table).getByText("今回")).toBeInTheDocument();
    expect(table).toHaveTextContent("Z004_0002.CSV");
    expect(table).toHaveTextContent("¥900 / 2件");
    expect(table).toHaveTextContent("2026-03-21 10:00:00");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
    expect(screen.getByText("精算日:")).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "取り込む" }));
    await user.click(screen.getByRole("button", { name: "キャンセル" }));
    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "取り込む" }));
    await user.click(screen.getByRole("button", { name: "追加で取り込む" }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm).toHaveBeenCalledWith(true);
  });

  it("test_additional_import_req401_importing_disables_confirmation", async () => {
    // REQ-401 / I-U6 / SPEC-SDI-D5: importing中は追加確認commandを開始できない。
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    render(
      <PreviewStep
        preview={preview}
        filename="Z004_0002.CSV"
        onConfirm={onConfirm}
        onReselect={vi.fn()}
        isImporting
      />,
    );

    const importButton = screen.getByRole("button", { name: "取り込む" });
    expect(importButton).toBeDisabled();
    await user.click(importButton);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(screen.queryByRole("alertdialog")).not.toBeInTheDocument();
  });
});
