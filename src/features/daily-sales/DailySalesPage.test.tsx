// src/features/daily-sales/DailySalesPage.test.tsx

import { render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { commands } from "@/lib/bindings";
import type {
  DailySalesReport,
  OfficialDailyReportSummary,
  OfficialDailySummaryImport,
  OfficialDailySummaryLine,
} from "@/lib/bindings";

import { DailySalesPage } from "./DailySalesPage";

vi.mock("@/components/sales/TabsHeader", () => ({
  TabsHeader: () => null,
}));

vi.mock("./hooks/useExportDailySalesCsv", () => ({
  useExportDailySalesCsv: () => ({ exportCsv: vi.fn(), isExporting: false }),
}));

vi.mock("@/lib/bindings", () => ({
  commands: {
    getDailySales: vi.fn(),
  },
}));

const mockGetDailySales = vi.mocked(commands.getDailySales);

function buildReport(overrides: Partial<DailySalesReport> = {}): DailySalesReport {
  return {
    date: "2026-03-21",
    items: [],
    department_subtotals: [],
    grand_total: { quantity: 0, amount: 0 },
    official_daily_report: null,
    ...overrides,
  };
}

function renderPage() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Number.POSITIVE_INFINITY } },
  });
  return render(
    <QueryClientProvider client={qc}>
      <DailySalesPage search={{ date: "2026-03-21" }} onSearchChange={vi.fn()} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockGetDailySales.mockResolvedValue({ status: "ok", data: buildReport() });
});

it("SPEC-FILTER-LABEL-RT-1 D-RT8: 日付と部門フィルタの下辺を揃える", () => {
  renderPage();

  expect(screen.getByRole("combobox", { name: "部門" }).closest(".items-end.gap-4")).not.toBeNull();
});

describe("DailySalesPage REQ-501 official daily report", () => {
  it("test_daily_sales_page_req501_shows_source_import_count_without_cross_series_sum", async () => {
    // REQ-501 / I-R5 / SPEC-SDI-D6: count、NULL、official/product分離を表示する。
    mockGetDailySales.mockResolvedValue({
      status: "ok",
      data: buildReport({
        items: [
          {
            product_code: "P001",
            name: "商品別だけの売上",
            department_name: "その他小物",
            department_id: 1,
            quantity: 2,
            amount: 3000,
            source: "auto",
          },
        ],
        department_subtotals: [
          { department_id: 1, department_name: "その他小物", quantity: 2, amount: 3000 },
        ],
        grand_total: { quantity: 2, amount: 3000 },
        official_daily_report: {
          source_import_count: 2,
          report_date: "2026-03-21",
          gross_amount: null,
          net_amount: 11000,
          payment_lines: [{ payment_key: "cash", label: "現金", amount: 11000, count: 7 }],
          department_lines: [
            {
              department_id: 1,
              raw_department_name: "その他小物",
              normalized_department_name: "その他小物",
              amount: 11000,
              quantity: 7,
              count: 3,
            },
          ],
          warnings: [],
          summary_imports: [
            {
              daily_report_import_id: 21,
              imported_at: "2026-03-21T18:05:30",
              lines: [{ label: "総売", quantity: 1, count: null, amount: 500 }],
            },
            {
              daily_report_import_id: 22,
              imported_at: "2026-03-21T19:00:00",
              lines: [{ label: "純売", quantity: null, count: 1, amount: 500 }],
            },
          ],
        },
      }),
    });

    renderPage();

    expect(await screen.findByRole("heading", { name: "レジ日報（公式）" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "総売上・純売上・支払集計・部門別集計は2回の取込みを合算しています。日計（Z001）は取込みごとに表示します。",
      ),
    ).toBeInTheDocument();
    expect(await screen.findByText("総売上")).toBeInTheDocument();
    expect(screen.getByText("未取得")).toBeInTheDocument();
    expect(screen.getAllByText("¥11,000").length).toBeGreaterThan(0);
    expect(screen.getByText("支払集計（Z002）")).toBeInTheDocument();
    expect(screen.getByText("部門別集計（Z005）")).toBeInTheDocument();
    expect(screen.getByText("商品別だけの売上")).toBeInTheDocument();
    expect(screen.getAllByText("¥3,000").length).toBeGreaterThan(0);
    expect(screen.queryByText("¥14,000")).not.toBeInTheDocument();
  });

  it("test_daily_sales_page_no_official_note_req501", async () => {
    renderPage();

    expect(await screen.findByText("この日付のレジ日報は未取込みです。")).toBeInTheDocument();
    // ⑰ SC3 / UIDISP-D3: 対象 warning 内だけで Z004 との対比を検証する。
    const warning = screen.getByRole("status");
    expect(within(warning).getByText("この日付のレジ日報は未取込みです。")).toBeInTheDocument();
    expect(within(warning).getByText("商品別売上 CSV（Z004）の取込みとは別です。")).toHaveAttribute(
      "data-slot",
      "alert-description",
    );
    // SC20 / DSR-08: 既存文言・roleを保ってwarning variantへ移行する。
    expect(
      screen.getByText("この日付のレジ日報は未取込みです。").closest('[data-slot="alert"]'),
    ).toHaveAttribute("data-variant", "warning");
    expect(
      screen.getByText("この日付のレジ日報は未取込みです。").closest('[data-slot="alert"]'),
    ).toHaveAttribute("role", "status");
    // SC22: 元の文をAlertTitleとして保持する。
    expect(screen.getByText("この日付のレジ日報は未取込みです。")).toHaveAttribute(
      "data-slot",
      "alert-title",
    );
    expect(
      screen
        .getByText("この日付のレジ日報は未取込みです。")
        .closest('[data-slot="alert"]')
        ?.querySelector('svg[aria-hidden="true"]'),
    ).toBeInTheDocument();
    expect(screen.getByText("該当する売上明細がありません")).toBeInTheDocument();
  });

  it("test_daily_sales_page_official_warnings_note_req501", async () => {
    mockGetDailySales.mockResolvedValue({
      status: "ok",
      data: buildReport({
        official_daily_report: {
          source_import_count: 1,
          report_date: "2026-03-21",
          gross_amount: 12000,
          net_amount: 11000,
          payment_lines: [],
          department_lines: [],
          warnings: ["部門マスタと対応していない部門が 1 件あります（部門名のまま表示しています）"],
          summary_imports: [
            {
              daily_report_import_id: 31,
              imported_at: "2026-03-21T18:05:30",
              lines: [{ label: "総売", quantity: 1, count: null, amount: 12000 }],
            },
          ],
        },
      }),
    });

    renderPage();

    expect(await screen.findByText("日報の部門確認が必要です")).toBeInTheDocument();
    // SC20 / DSR-08: 既存文言・roleを保ってwarning variantへ移行する。
    expect(
      screen.getByText("日報の部門確認が必要です").closest('[data-slot="alert"]'),
    ).toHaveAttribute("data-variant", "warning");
    expect(
      screen.getByText("日報の部門確認が必要です").closest('[data-slot="alert"]'),
    ).toHaveAttribute("role", "alert");
    expect(
      screen.getByText(
        "部門マスタと対応していない部門が 1 件あります（部門名のまま表示しています）",
      ),
    ).toBeInTheDocument();
  });
});

// UI-09a-D16 日計（Z001）の表示。期待の文字列は 56 UI-09a-D16 の文字列の表から転記する。
function buildOfficial(summaryImports: OfficialDailySummaryImport[]): OfficialDailyReportSummary {
  return {
    source_import_count: summaryImports.length,
    report_date: "2026-03-21",
    gross_amount: 15800,
    net_amount: 14600,
    payment_lines: [{ payment_key: "cash", label: "現金", amount: 12600, count: 12 }],
    department_lines: [],
    warnings: [],
    summary_imports: summaryImports,
  };
}

function mockOfficial(summaryImports: OfficialDailySummaryImport[]) {
  mockGetDailySales.mockResolvedValue({
    status: "ok",
    data: buildReport({ official_daily_report: buildOfficial(summaryImports) }),
  });
}

function z001Import(
  id: number,
  importedAt: string,
  lines: OfficialDailySummaryLine[],
): OfficialDailySummaryImport {
  return { daily_report_import_id: id, imported_at: importedAt, lines };
}

function tableCells(table: HTMLElement) {
  return within(table)
    .getAllByRole("row")
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    );
}

function isBefore(first: Element, second: Element) {
  return Boolean(first.compareDocumentPosition(second) & Node.DOCUMENT_POSITION_FOLLOWING);
}

const multiImportSentence = (n: number) =>
  `総売上・純売上・支払集計・部門別集計は${String(n)}回の取込みを合算しています。日計（Z001）は取込みごとに表示します。`;

describe("DailySalesPage REQ-501 UI-09a-D16 z001", () => {
  it("test_daily_sales_page_req501_z001_table_single_import", async () => {
    mockOfficial([
      z001Import(41, "2026-03-21T19:05:10", [
        { label: "総売", quantity: 12.5, count: null, amount: 15800 },
        { label: "合成個数ゼロ", quantity: 0, count: null, amount: 0 },
        { label: "純売", quantity: null, count: 14, amount: 14600 },
        { label: "部門03", quantity: null, count: 0, amount: 0 },
        { label: "税額", quantity: null, count: null, amount: 1327 },
        { label: "部門11", quantity: null, count: null, amount: null },
        { label: "戻モード", quantity: null, count: -1, amount: -1200 },
      ]),
    ]);

    renderPage();

    const heading = await screen.findByRole("heading", { level: 3, name: "日計（Z001）" });
    const table = screen.getByRole("table", { name: "日計（Z001）" });
    expect(
      within(table)
        .getAllByRole("columnheader")
        .map((th) => th.textContent),
    ).toEqual(["名称", "個数/件数", "金額"]);
    expect(tableCells(table)).toEqual([
      ["総売", "12.5", "¥15,800"],
      ["合成個数ゼロ", "0", "¥0"],
      ["純売", "14", "¥14,600"],
      ["部門03", "0", "¥0"],
      ["税額", "—", "¥1,327"],
      ["部門11", "—", "—"],
      ["戻モード", "-1", "¥-1,200"],
    ]);
    // 置き場所: metric の下、支払集計（Z002）の上
    expect(isBefore(screen.getByText("純売上"), heading)).toBe(true);
    expect(isBefore(table, screen.getByRole("heading", { name: "支払集計（Z002）" }))).toBe(true);
    // R12: 1 回の日は取込みごとの見出しを出さず、文は既存のまま
    expect(screen.queryAllByRole("heading", { level: 4 })).toHaveLength(0);
    expect(screen.getByText("1回の取込みを合算")).toBeInTheDocument();
  });

  it("test_daily_sales_page_req501_z001_hidden_without_official", async () => {
    renderPage();

    expect(await screen.findByText("この日付のレジ日報は未取込みです。")).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "日計（Z001）" })).not.toBeInTheDocument();
    expect(screen.queryByText("日計（Z001）")).not.toBeInTheDocument();
    expect(screen.queryAllByRole("table", { name: /日計|取込み/ })).toHaveLength(0);
  });

  it("test_daily_sales_page_req501_z001_per_import_tables", async () => {
    const states: { imports: [number, string, string][]; headings: string[] }[] = [
      {
        imports: [
          [11, "2026-03-21T18:05:30", "取込み十一の行"],
          [13, "2026-03-21T19:00:00", "取込み十三の行"],
          [17, "2026-03-21T20:10:00", "取込み十七の行"],
        ],
        headings: [
          "1回目の取込み（取込み日時 2026-03-21 18:05）",
          "2回目の取込み（取込み日時 2026-03-21 19:00）",
          "3回目の取込み（取込み日時 2026-03-21 20:10）",
        ],
      },
      {
        imports: [
          [11, "2026-03-21T18:05:30", "取込み十一の行"],
          [17, "2026-03-21T20:10:00", "取込み十七の行"],
        ],
        headings: [
          "1回目の取込み（取込み日時 2026-03-21 18:05）",
          "2回目の取込み（取込み日時 2026-03-21 20:10）",
        ],
      },
      {
        imports: [
          [11, "2026-03-21T18:05:30", "取込み十一の行"],
          [17, "2026-03-21T20:10:00", "取込み十七の行"],
          [19, "2026-03-21T21:30:00", "取込み十九の行"],
        ],
        headings: [
          "1回目の取込み（取込み日時 2026-03-21 18:05）",
          "2回目の取込み（取込み日時 2026-03-21 20:10）",
          "3回目の取込み（取込み日時 2026-03-21 21:30）",
        ],
      },
    ];

    for (const state of states) {
      mockOfficial(
        state.imports.map(([id, at, label]) =>
          z001Import(id, at, [{ label, quantity: null, count: id, amount: id * 100 }]),
        ),
      );
      const { unmount } = renderPage();

      const h3 = await screen.findByRole("heading", { level: 3, name: "日計（Z001）" });
      const h4s = screen.getAllByRole("heading", { level: 4 });
      expect(h4s.map((h) => h.textContent)).toEqual(state.headings);
      expect(isBefore(h3, h4s[0])).toBe(true);
      expect(screen.getByText(multiImportSentence(state.imports.length))).toBeInTheDocument();
      expect(screen.queryByRole("table", { name: "日計（Z001）" })).not.toBeInTheDocument();
      expect(screen.getAllByRole("table", { name: /回目の取込み/ })).toHaveLength(
        state.imports.length,
      );
      state.imports.forEach(([, , label], index) => {
        const table = screen.getByRole("table", { name: state.headings[index] });
        expect(isBefore(h4s[index], table)).toBe(true);
        expect(tableCells(table).map((row) => row[0])).toEqual([label]);
      });
      unmount();
    }
  });

  it("test_daily_sales_page_req501_z001_import_without_lines", async () => {
    const empty = "この取込みの日計（Z001）の行はありません。";

    // (a) 1 回の日
    mockOfficial([z001Import(51, "2026-03-21T18:05:30", [])]);
    const { unmount } = renderPage();
    const h3 = await screen.findByRole("heading", { level: 3, name: "日計（Z001）" });
    expect(isBefore(h3, screen.getByText(empty))).toBe(true);
    expect(screen.queryByRole("table", { name: "日計（Z001）" })).not.toBeInTheDocument();
    unmount();

    // (b) 2 回の日で 1 件目に行が無い
    mockOfficial([
      z001Import(52, "2026-03-21T18:05:30", []),
      z001Import(53, "2026-03-21T19:00:00", [
        { label: "総売", quantity: 1, count: null, amount: 500 },
      ]),
    ]);
    renderPage();
    const h4s = await screen.findAllByRole("heading", { level: 4 });
    expect(h4s.map((h) => h.textContent)).toEqual([
      "1回目の取込み（取込み日時 2026-03-21 18:05）",
      "2回目の取込み（取込み日時 2026-03-21 19:00）",
    ]);
    const message = screen.getByText(empty);
    expect(isBefore(h4s[0], message) && isBefore(message, h4s[1])).toBe(true);
    expect(
      screen.queryByRole("table", { name: "1回目の取込み（取込み日時 2026-03-21 18:05）" }),
    ).not.toBeInTheDocument();
    const second = screen.getByRole("table", {
      name: "2回目の取込み（取込み日時 2026-03-21 19:00）",
    });
    expect(tableCells(second)).toEqual([["総売", "1", "¥500"]]);
  });
});

// describe-error-adoption packet（2026-08-04）AC2 / B1 是正: query error 時に
// InvokeError のデバッグ文字列（`[commands: ...]`）が表示に漏れず、describeError 出力が
// 表示されることを assert する（UI-ERR-D2）。
describe("DailySalesPage describeError adoption (B1, UI-ERR-D2)", () => {
  it("shows describeError output on query error without leaking the InvokeError debug message", async () => {
    mockGetDailySales.mockResolvedValue({
      status: "error",
      error: {
        kind: "internal",
        message: "日次売上の取得に失敗しました",
        field: null,
        error_id: "E-20260321-090000-syn1",
      },
    });

    renderPage();

    expect(
      await screen.findByText(
        "日次売上の取得に失敗しました（エラーID: E-20260321-090000-syn1）。詳細は診断ログに記録されています。",
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/\[commands:/)).not.toBeInTheDocument();
  });
});

describe("DailySalesPage native input tokens（Lane 5 SC4k）", () => {
  it("SC4k: 日付inputがbg-control-surfaceでbg-backgroundを持たない", async () => {
    renderPage();

    const dateInput = await screen.findByLabelText("日付を選択");
    expect(dateInput).toHaveClass("bg-control-surface");
    expect(dateInput).not.toHaveClass("bg-background");
  });
});
