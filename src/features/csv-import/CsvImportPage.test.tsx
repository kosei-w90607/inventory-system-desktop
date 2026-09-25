import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CsvImportPage } from "./CsvImportPage";
import { useCsvImportFlow } from "./hooks/useCsvImportFlow";

vi.mock("@/features/daily-report-import/DailyReportImportPage", () => ({
  DailyReportImportPage: () => <div>daily report req401 content</div>,
}));

vi.mock("./hooks/useCsvImportFlow", () => ({ useCsvImportFlow: vi.fn() }));

type Flow = ReturnType<typeof useCsvImportFlow>;

function flow(overrides: Partial<Flow> = {}): Flow {
  return {
    state: { status: "idle" },
    selectFile: vi.fn(),
    confirmImport: vi.fn(),
    rollback: vi.fn(),
    dismissError: vi.fn(),
    isParsing: false,
    isImporting: false,
    isRollingBack: false,
    ...overrides,
  } as Flow;
}

beforeEach(() => {
  vi.mocked(useCsvImportFlow).mockReset();
  vi.mocked(useCsvImportFlow).mockImplementation(() => flow());
});

describe("CsvImportPage_req401", () => {
  it("REQ-401: opens as sales import with daily report default tab and Z004 tab label", () => {
    render(<CsvImportPage />);

    expect(screen.getByRole("heading", { name: "売上データ取込み" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "日報取込み" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "商品別CSV取込み（Z004）" })).toBeInTheDocument();
    expect(screen.getByText("daily report req401 content")).toBeInTheDocument();
  });

  it("test_csv_import_page_req401_suspended_z004_tab_shows_notice_and_blocks_confirm", async () => {
    // SPEC-STOP-D4 / 55 §55.0: 文言は 55 の正本から転記する。
    const user = userEvent.setup();
    const confirmImport = vi.fn();
    const suspendedFlow = flow({
      state: {
        status: "preview",
        preview: {
          file_info: {
            filename: "Z004_0001.CSV",
            settlement_date: "2026-03-21",
            file_hash: "b".repeat(64),
          },
          matched_summary: { count: 1, total_amount: 500, warnings: [] },
          error_summary: { count: 0, items: [] },
          duplicate_check: { status: "NoDuplicate", same_date_imports: [] },
          preview_created_at: "2026-03-21T10:00:00",
        },
        previewToken: "token-1",
        filename: "Z004_0001.CSV",
      },
      confirmImport,
    });
    vi.mocked(useCsvImportFlow).mockImplementation(() => suspendedFlow);
    render(<CsvImportPage />);

    await user.click(screen.getByRole("tab", { name: "商品別CSV取込み（Z004）" }));

    const title = screen.getByText("商品別CSV（Z004）の取込みは一時停止中です");
    const notice = title.closest('[data-slot="alert"]');
    expect(notice).toHaveAttribute("data-variant", "warning");
    expect(notice).toHaveTextContent(
      "取込みや取消で在庫が二重に減ったり戻ったりする不具合を直しています。直るまで、取込みの確定と取消はできません。ファイルの内容確認（プレビュー）と日報の取込みはできます。",
    );
    expect(notice?.querySelector('svg.lucide-triangle-alert[aria-hidden="true"]')).not.toBeNull();

    expect(screen.getByText("紐付け結果")).toBeInTheDocument();
    const importButton = screen.getByRole("button", { name: "取り込む" });
    expect(importButton).toBeDisabled();
    await user.click(importButton);
    expect(confirmImport).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "ファイルを選び直す（商品別CSV）" })).toBeEnabled();
  });
});
