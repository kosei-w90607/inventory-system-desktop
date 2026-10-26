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
    rollbackResult: null,
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

  it("U16 stocktake and z004 writes are enabled", async () => {
    // 停止の案内が無く、Z004 の「取り込む」が押せる（SPEC-STOP-D6 で 5 つの入口を一度に外した）
    const user = userEvent.setup();
    const confirmImport = vi.fn();
    const previewFlow = flow({
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
          settlement_gaps: [],
          settlement_date_after_today: false,
          preview_created_at: "2026-03-21T10:00:00",
        },
        previewToken: "token-1",
        filename: "Z004_0001.CSV",
      },
      confirmImport,
    });
    vi.mocked(useCsvImportFlow).mockImplementation(() => previewFlow);
    render(<CsvImportPage />);

    await user.click(screen.getByRole("tab", { name: "商品別CSV取込み（Z004）" }));

    expect(screen.queryByText(/停止中/)).not.toBeInTheDocument();
    expect(screen.getByText("紐付け結果")).toBeInTheDocument();
    const importButton = screen.getByRole("button", { name: "取り込む" });
    expect(importButton).toBeEnabled();
    await user.click(importButton);
    expect(confirmImport).toHaveBeenCalledTimes(1);
  });
});
