// src/components/patterns/ListShell.tsx
//
// 一覧の器（catalog ⑯、D-2 / D-5）。toolbar・上部件数・table・下部 pager・skeleton を
// まとめる共通 container。stickyHeader 時、table 内部（table-container / table / thead
// th / tbody td）の class は ListShell root の descendant variant（`[&_...]:`）のみで
// 上書きし、children（Table primitive）に className を渡さない。
// components/patterns は features を import しない（D-9、AC4）。
// 設計: docs/design-system/02-component-catalog.md ⑯ 一覧の器（ListShell）
//       docs/design-system/01-decision-rules.md DSR-22
//
// Lane 4 Gated Amendment 3 GA3b（2026-09-07）: stickyHeader の箱は行数基準の
// max-h-[171rem] overflow-auto で自立し、page root からの高さ継承（旧 Gated
// Amendment 1 の flex h-full min-h-0 flex-col 一式）は不要になった。約 50 行以下は
// box が content-fit のまま <main> が page scroll、51 行超で box が内部縦 scroll に
// 切り替わる（境界は近似値、docs/plans 該当 lane packet「行高の近似値」参照）。回帰は
// src/test/page-root-pageshell-sweep.test.ts の fs scan（GA3b-5、旧 GA1e を反転:
// 高さ継承 class を持たないことを確認する）。

import type { ReactNode } from "react";

import { cn } from "@/lib/utils";
import { ListSkeleton } from "./ListSkeleton";
import { Pagination, PaginationSummary } from "./Pagination";

export interface ListShellPagination {
  page: number;
  perPage: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export interface ListShellProps {
  toolbar?: ReactNode;
  toolbarSecondary?: ReactNode;
  pagination?: ListShellPagination;
  topSummary?: boolean;
  stickyHeader?: boolean;
  /**
   * 識別列固定（DSR-22 mapping）。固定する先頭列の本数（1 or 2）。Lane 4 で商品一覧
   * のみ活性化（`identityColumns={2}`）。値ごとのリテラル class 配列で実装し
   * （Tailwind JIT は実行時テンプレートリテラルを拾えないため）、任意 N 列の
   * generator は作らない（YAGNI、DSR-22 mapping 表の最大値は 2）。
   */
  identityColumns?: 1 | 2;
  isLoading?: boolean;
  skeleton?: ReactNode;
  children: ReactNode;
}

const STICKY_TABLE_CLASSES = [
  "[&_[data-slot=table-container]]:overflow-visible",
  "[&_[data-slot=table]]:border-separate",
  "[&_[data-slot=table]]:border-spacing-0",
  "[&_thead_th]:sticky",
  "[&_thead_th]:z-10",
  // Gated Amendment 2 S11（owner L3 FAIL-3）: summary 帯と thead を同一 surface
  // （--list-head）にする。
  "[&_thead_th]:bg-list-head",
  // Gated Amendment 7 S48（owner run 6「最小幅で部門と売価の間に白い細線」）: Gated
  // Amendment 6 S43 で外した tr 背景を復活。border-separate + 最小幅の fractional
  // layout では th 同士の境界に subpixel の隙間が生じ page 地が透けるため、tr 背景で
  // 塞ぐ（角丸は下記 corner mask + globals.css の list-shell-sticky hook で維持）。
  "[&_thead_tr]:bg-list-head",
  "[&_thead_th]:border-b-2",
  "[&_thead_th]:border-border",
  // Gated Amendment 6 S43（owner run 5「列見出しの左右上を丸く」）: th 単体の角丸
  // （border-separate + spacing 0 では th だけで端まで埋まる）。
  "[&_thead_th:first-child]:rounded-tl-md",
  "[&_thead_th:last-child]:rounded-tr-md",
  "[&_tbody_td]:border-b",
  "[&_tbody_td]:border-border",
  "[&_tbody_tr:last-child_td]:border-b-0",
];

// Lane 4 Gated Amendment 3 GA3a（2026-09-07、owner L3 run 2 実機観測で機序確定）:
// 商品コード td/th 内側 div の固定幅。8rem + td/th padding 1rem（px-2/p-2）= 9rem。
// 単一 source（Tailwind JIT は実行時テンプレートリテラルを拾えないため、幅と
// offset は別 literal のまま co-locate する）——ProductTable.tsx の th/td 内 div が
// この class を import する。rem 値の一致は ListShell.test.tsx の parity oracle が
// 機械的に保証する（片方だけ変更する mutant を検出）。
export const PRODUCT_CODE_CELL_WRAPPER_WIDTH_CLASS = "w-32";

// S9（識別列固定）: 列 1・2 のリテラル class 配列。DSR-22 mapping 表の固定列数は
// 全行が 1 か 2 のため、この 2 パターンのみで足りる（ponytail: 汎用 N 列 generator
// は作らない）。列 2 の left-[9rem] は PRODUCT_CODE_CELL_WRAPPER_WIDTH_CLASS
// （w-32 = 8rem）+ td/th padding（1rem）= 9rem と一致させる（Lane 4 Gated
// Amendment 3 GA3a、旧オフセット 7rem 決め打ちは商品コード列の実効幅と一致する
// 保証が無く FAIL した——経緯は docs/plans 該当 lane packet 参照）。
const IDENTITY_COLUMN_CLASSES: Record<1 | 2, string[]> = {
  1: [
    "[&_thead_th:nth-child(1)]:sticky",
    "[&_thead_th:nth-child(1)]:left-0",
    "[&_thead_th:nth-child(1)]:z-[11]",
    "[&_tbody_td:nth-child(1)]:sticky",
    "[&_tbody_td:nth-child(1)]:left-0",
    "[&_tbody_td:nth-child(1)]:bg-background",
    "[&_tbody_td:nth-child(1)]:z-[1]",
    "[&_tbody_td:nth-child(1)]:shadow-[inset_-1px_0_0_var(--border)]",
    "[&_tbody_td:nth-child(1)]:forced-colors:border-r",
  ],
  2: [
    "[&_thead_th:nth-child(1)]:sticky",
    "[&_thead_th:nth-child(1)]:left-0",
    "[&_thead_th:nth-child(1)]:z-[11]",
    "[&_thead_th:nth-child(2)]:sticky",
    "[&_thead_th:nth-child(2)]:left-[9rem]",
    "[&_thead_th:nth-child(2)]:z-[11]",
    "[&_tbody_td:nth-child(1)]:sticky",
    "[&_tbody_td:nth-child(1)]:left-0",
    "[&_tbody_td:nth-child(1)]:bg-background",
    "[&_tbody_td:nth-child(1)]:z-[1]",
    "[&_tbody_td:nth-child(1)]:shadow-[inset_-1px_0_0_var(--border)]",
    "[&_tbody_td:nth-child(1)]:forced-colors:border-r",
    "[&_tbody_td:nth-child(2)]:sticky",
    "[&_tbody_td:nth-child(2)]:left-[9rem]",
    "[&_tbody_td:nth-child(2)]:bg-background",
    "[&_tbody_td:nth-child(2)]:z-[1]",
    "[&_tbody_td:nth-child(2)]:shadow-[inset_-1px_0_0_var(--border)]",
    "[&_tbody_td:nth-child(2)]:forced-colors:border-r",
  ],
};

export function ListShell({
  toolbar,
  toolbarSecondary,
  pagination,
  topSummary = false,
  stickyHeader = false,
  identityColumns,
  isLoading = false,
  skeleton,
  children,
}: ListShellProps) {
  const hasResults = (pagination?.totalCount ?? 0) > 0;
  const showTopSummary = topSummary && hasResults;

  // Gated Amendment 1（2026-09-06、owner 案 X）: table wrapper を専用の縦横 scroll 箱で
  // 包む。<main> ではなく箱自身が scrolling ancestor になるため、sticky thead / 識別列の
  // left-* はそのまま箱基準で機能する（コード変更不要）。stickyHeader を渡すのは商品一覧のみ
  // （identityColumns の症状画面と同一）のため、他 7 画面には影響しない。
  const bandAndTable =
    stickyHeader && showTopSummary && pagination ? (
      // Gated Amendment 3 S13（owner L3 run 2 FAIL、AC-L3-2）: table を spacing
      // utility を持たない wrapper に包み、root の space-y-3 が toolbar / 帯 / box /
      // 下部 Pagination の間だけに効くようにする（帯と table の間に page 地を挟まない）。
      // Lane 4 Gated Amendment 4 GA4a: 帯自体は box の外・root 直下へ移した（下記
      // stickyBand 参照）ため、wrapper は table のみを包む。
      <div className="w-min min-w-full">
        {isLoading ? (skeleton ?? <ListSkeleton />) : children}
      </div>
    ) : (
      <>
        {showTopSummary && pagination ? (
          <PaginationSummary
            page={pagination.page}
            perPage={pagination.perPage}
            totalCount={pagination.totalCount}
          />
        ) : null}
        {isLoading ? (skeleton ?? <ListSkeleton />) : children}
      </>
    );

  // Lane 4 Gated Amendment 4 GA4a（2026-09-07、owner L3 run 3 新規要望「件数帯を横にも
  // 固定してほしい」）: `position: sticky` は自身の containing block の内側でしか動けない
  // ため、帯を box の子（`w-full` block）に置いたまま `sticky left-0`/`top-0` を足しても
  // 横方向の余地はゼロ（no-op）、縦方向も box の可視高が containing block になり box を
  // 1 画面分 scroll した時点で帯が box の外へ流れる（既存 PASS 済みの縦張り付きの
  // regression）。帯を box の scrolling ancestor 自体から外す——box の外・ListShell root
  // 直下（box の直前の兄弟）に置くことで、縦横どちらの scroll にも構造的に追従しない
  // （新しい CSS 機構は導入しない、ponytail: sticky/overflow への依存を無くすほうが
  // left-0/top-0 の当てはめより単純）。`mb-0!`（important）は Tailwind v4 の
  // `space-y-3` が margin を先行 sibling（帯）側の margin-bottom として乗せる実装のため、
  // 帯と box の間の隙間はここで相殺する（box 側に mt-0 を足しても no-op）。
  const stickyBand =
    stickyHeader && showTopSummary && pagination ? (
      // 追補 S17（Opus P1-2 / P2-2 / P2-3、AC-L3-2 / AC-L3-4）: 帯自体は overflow-hidden
      // にし、子（PaginationSummary root）を min-w-0 + truncate で ellipsis させる
      // （flex item への直接 truncate は min-width:auto で hard clip になる）。
      // Gated Amendment 5 S39（owner L3 run 4「灰色の塊に入れ込んだのがミス、角が角、
      // 下に線を引く程度」）: 件数行は page 地色（bg-background）。灰色面（--list-head）
      // は列見出しのみに限定する。Gated Amendment 7 S47（owner run 6「上端の線だけ
      // 外そう」）: 件数行の下線（border-b border-border）を撤去。
      <div className="z-20 mb-0! flex h-10 w-full items-center overflow-hidden bg-background px-2 [&>div]:min-w-0 [&>div]:truncate">
        <PaginationSummary
          page={pagination.page}
          perPage={pagination.perPage}
          totalCount={pagination.totalCount}
        />
      </div>
    ) : null;

  return (
    <div
      className={cn(
        "space-y-3",
        stickyHeader && "list-shell-sticky",
        stickyHeader && STICKY_TABLE_CLASSES,
        // Lane 4 Gated Amendment 4 GA4a: 帯が box の外に出たため box 内に帯は無くなり、
        // thead の sticky offset は topSummary の有無に関わらず常に top-0 でよい。
        stickyHeader && "[&_thead_th]:top-0",
        stickyHeader && identityColumns !== undefined && IDENTITY_COLUMN_CLASSES[identityColumns],
      )}
    >
      {toolbar !== undefined && (
        <div className="space-y-3 rounded-lg border bg-card p-4">
          {toolbar}
          {toolbarSecondary !== undefined && toolbarSecondary}
        </div>
      )}

      {stickyHeader ? (
        <>
          {stickyBand}
          {/* Gated Amendment 1: 新規 scroll 容器を作らない <main> 基準 sticky-left は owner
              L3 run 1 FAIL（AC-L3-1）。表自身を縦横 scroll 箱にし（DSR-17 例外、
              data-scroll-restoration-id="products-list" は復元 cache の安定 selector）。
              Lane 4 Gated Amendment 4 GA4b: 箱の高さは viewport 基準の max-h
              （owner決定 (c) の変形、toolbar は式に含めない——toolbar は <main> の
              page scroll で隠す対象のため）。 */}
          <div
            className="max-h-[calc(100vh-6.75rem)] overflow-auto"
            data-list-scroll-container
            data-scroll-restoration-id="products-list"
          >
            {bandAndTable}
          </div>
        </>
      ) : (
        bandAndTable
      )}

      {hasResults && pagination && (
        <Pagination
          page={pagination.page}
          perPage={pagination.perPage}
          totalCount={pagination.totalCount}
          onPageChange={pagination.onPageChange}
        />
      )}
    </div>
  );
}
