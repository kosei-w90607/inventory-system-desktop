# Plan Packet: UI 一覧の背骨 D — Lane 2（共有部品 PageShell / ListShell + token 実装 + ページ送り文言移行 + Lane 1b mockup 同乗、R3 runtime）

Lane 1a（PR #31、squash `9f90964`、2026-09-03）で正本化した規範（04-backbone 原則 13〜16 / DSR-22 / catalog ⑯ + ⑩）を runtime に履行する最初の実装 lane。Lane 1a archived packet「Lane 1a / 1b 分割」「Lane 2 への申し送り」節（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md:122-131` / `:274-278`）の裁定に従い、`ListShell` より先に `PageShell` を出し、未実装 token を `globals.css` へ実装した時点で canonical docs に正式登録する。画面群への展開（識別列固定・現在行 3 点・perPage `Select` の各画面適用・棚卸し A'+器 / C）は Lane 3〜5 の別 packet とし、本 lane は共有部品 + pilot 1 画面（商品一覧）+ 全 caller のページ送り文言一括移行に限定する。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

If a state-only commit materializes multiple phases, list the complete adjacent forward sequence and the pre-existing evidence for every intermediate transition in an append-only review/evidence record. Recording compression never permits a gate skip.

- Phase: plan-gate
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（runtime code + design docs + mockup HTML、worktree isolation、TDD）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Opus 5 デザイン面レビュー（発注書駆動・read-only・§5.4 低制約 profile、D-056 準拠）+ Fable 裁定
- Final Reviewer: Codex（GPT-5.6、ロジック・整合面、PR review 1 回 = relay 1/2）+ Opus 5 デザイン面レビュー（read-only）+ Claude Sonnet 5 subagent mutation 独立再実測（隔離 worktree、Writer とは別 fresh context）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（商品一覧 pilot の器・sticky header・範囲付き文言・PageShell 余白・`--border` 濃化の render oracle + DSR-22 低視力 L3 (a)(b)）+ Lane 1b mockup 5 file の視認

役割配分の記録（D-079 Impact「実装 code の Writer 割当ては change ごとに Coordinator 判断」に基づく 1 行）: 本 lane は UI 視覚系の runtime change であり、owner 所感「UI 視覚系は Claude が触る方が良い結果」（2026-09-03、D-079 Why）を実装 code にも適用して Writer を Sonnet subagent とする。`AGENT_OPERATING_MANUAL` §3 の独立性（Writer ≠ Plan Reviewer / Writer ≠ Final Reviewer / Final Reviewer は fresh context）は、Plan Reviewer 一次・mutation 独立再実測を Writer とは別の Sonnet fresh context、Final Review を Codex が担うことで維持する。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者可視に何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-03 会話「進めよう」、消費済み）。2 回目 = Windows native L3（AC-L3-1〜5）+ Lane 1b mockup 5 file の視認（同一セッション内、複数往復は同一 gate 内）。3 回目 = Ready 後の承認の一言（Ready・merge は Coordinator 代行、runtime PR のため hosted final は Ready で自動起動し owner dispatch 不要）。

## Consultation Relay

§5.5 は使わない。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
route/search state の変更（商品一覧 `perPage` 既定 50 → 100、`src/features/products/search.ts` の正規化）+ operator workflow の見た目変更（全 page root の `PageShell` 化で section 間余白が 16px / 20px → 24px に統一、`--border` 濃化が全画面の構造線に波及、商品一覧の器が ListShell 構成へ）。DB / POS CSV / PLU TSV / Tauri command DTO / report CSV の変更はない（`search_products` の `per_page` は backend clamp 200 の範囲内、`src-tauri/src/constants.rs:6`）。DEV_WORKFLOW Risk Tiers の R3「route/search state, operator workflow」に該当し、Plan Packet + Test Design Matrix + targeted gates + mutation 独立再実測 + Windows native L3 を必須とする。視覚系 UI change の教訓（PR #15 / #28: render oracle は owner の目のみ、CSS 詳細度は全 gate 素通り）に従い、L3 の確認対象を「旧 root 3 系統から 1 画面ずつ」+ pilot 画面に明示する。

## 起票時実測（2026-09-03、HEAD `31c069d`）

- **page root は 3 系統 + 個別 2 = 43 root**: `rg -n --glob '*Page.tsx' --glob '!*.test.tsx' 'className="[^"]*\bp-6\b[^"]*"' src/features` = 45 hit、内訳 `space-y-4 p-6` 21 / `space-y-5 p-6` 13 / `min-h-screen space-y-6 p-6` 8 / `relative min-h-screen space-y-6 p-6` 1（absolute overlay を持つ画面）/ 非 root 2（`w-full max-w-md ... p-6` の card、`absolute inset-0 ... p-6` の overlay）。`PageShell` は `rg -n "PageShell" src` 0 件（旧分析 doc §1-6「規範化済み・未履行」のまま）。`StocktakePage.tsx:215` / `:926` の 2 root は Lane 1a 申し送りどおり現存。
- **`<main>` が唯一の縦 scroll container**: `src/components/layout/RootLayout.tsx:65` `<main data-scroll-restoration-id="main" className="min-h-0 min-w-0 overflow-auto">`。shadcn `Table` は `src/components/ui/table.tsx:9` で `<div data-slot="table-container" className="relative w-full overflow-x-auto">` に包まれるため、`overflow-x-auto` が縦方向にも scroll container を成立させ（`overflow-y` は `auto` に計算される）、`thead` の `position: sticky` は wrapper 内でしか効かず `<main>` の scroll に追従しない。sticky header を `<main>` 相対で効かせるには ListShell が table-container の overflow を `visible` に上書きする必要があり、その状態では横 overflow 時の識別列固定（wrapper を横 scroll container とする前提）と両立しない。→ 本 lane は sticky header（`<main>` 相対）を実装し、識別列固定は API の予約（prop 名の確保）に留め、両立方式の probe を Lane 3〜5 へ申し送る（設計判断 D-2）。
- **backend per_page 上限は 2 系統**: `PAGINATION_MAX_PER_PAGE = 200`（`src-tauri/src/constants.rs:6`、`search_products` / `get_stocktake_items` / `list_logs` は超過を silent clamp）と `inventory_service::list.rs:21` `MAX_PER_PAGE: u32 = 100`（`list_inventory_records` / `list_movements` は超過で `BizError::ValidationFailed`、docs `21-io-inventory-repo.md:7` に契約明記）。**入出庫履歴・在庫変動履歴に perPage 200 を選択肢として出すには backend 契約変更（DTO/validation、docs 21 + tests `list.rs:322,504,515`）が必要** → 本 lane では per-screen `Select` を追加しないため非該当、Plans.md ④ へ申し送る（Scope S8）。整合性チェックは `run_integrity_check` 全件取得 + client-side slice（`IntegrityCheckPage.tsx:95-96`）で上限なし。
- **ページ送り現行文言の caller / test**: `ProductPagination`（`src/features/products/components/ProductPagination.tsx:16`、props `{page, perPage, totalCount, onPageChange}`、文言 `:29` `{totalCount.toLocaleString("ja-JP")} 件中 {page} / {totalPages} ページ`）の caller は 8 画面（IntegrityCheck `:375` / InventoryRecords `:351` / StockInquiry `:197` / OperationLogs `:519` / ProductList `:290` / StockMovements `:204` / Stocktake `:852` / PriceRevision `:128`、すべて下部 1 箇所）。現行文言を assert する test は 4 file 6 箇所（`IntegrityCheckPage.test.tsx:410` / `StockInquiryPage.test.tsx:491` / `OperationLogsPage.test.tsx:257,269,396,408` / `ProductPagination.test.tsx`）。
- **perPage 既定の現状**: 商品一覧 `search.ts:63` `perPage` は `PRODUCT_PER_PAGE_OPTIONS = [50, 100, 200]`（`:7`）で正規化、既定 50。棚卸しは PR #30 で既定 50（`StocktakePage.tsx:123`、test T2/T3 が `per_page: 50` を固定）。DSR-22 裁定（商品一覧 100 / 棚卸し 50、owner 了承 2026-09-03）との差分は商品一覧の 1 箇所のみ。
- **token 候補値**: `docs/design-system/reference/2026-08-23-current-design-analysis.md:104-116` §8 — `--border-strong` `#8a8480`（対 `--background` 3.53:1 / 対 `--card` 3.38:1）、`--row-current` `#fff8e6`（対 `--foreground` 16.5:1）、`--border` 値変更案 `#cdc8c4`（1.66:1）。`src/styles/globals.css` `:root` は `:52-93`、`@theme inline` は `:9-50`、dark block なし。`rg -n "border-strong|row-current" src` = 0。
- **Lane 1b mockup 5 file の所在**: 旧 branch tip `20c4600` に `docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html` が存在（`git ls-tree 20c4600` 実測）。main には `mockup-d-lists.html` / `mockup-d-stocktake.html` のみ。
- **shared patterns 設計書**: `docs/function-design/59-ui-shared-patterns.md:16-24` §59.1 は `ファイル | 契約（props） | 採用画面 | catalog` の 4 列表。`generate_traceability` は frontend `src/**/*.test.{ts,tsx}` の `REQ-nnn` / `UI-nn` token のみ走査（`src-tauri/src/bin/generate_traceability.rs:290,509,546`、SPEC- は非対象）。

## Goal

Goal Invariant: 一覧画面の器と page root が共有部品に集約され、規範（04 原則 6 / 13〜16、DSR-22、catalog ⑯ ⑩）の canonical 記載が「Lane 2 で新設予定」から実 path へ置き換わり、DS1 / DS3 の突合対象に入る。

### 最小完了条件

(a) `globals.css` に `--border-strong` / `--row-current` を実装し `--border` を一段濃くし、00-foundations.md のカラーパレット表へ HEX 付きで正式登録する。(b) `src/components/patterns/PageShell.tsx` を新設し、`src/features/**/*Page.tsx` の page root 43 箇所を `PageShell` へ置換する（`p-6` 直書き root が 0 になる）。(c) `ProductPagination` の文言を範囲付き統一形へ移行し、8 caller + 4 test file を一括更新、上部 text-only の `PaginationSummary` を同 file から export する。(d) `src/components/patterns/ListShell.tsx` を新設し（toolbar 枠 / 上部 summary opt-in / sticky header opt-in / 下部 pager / `ListSkeleton`）、商品一覧を pilot として採用する（既定 perPage 100）。(e) catalog ⑯ ⑩ / DSR-22 / 04 / 59.1 / design-system README / review-checklist の「Lane 2 移行対象」「新設予定」表記を実装済み表記へ更新する。(f) Lane 1b mockup 5 file を現行規範に同期して追加し reference README 表を更新する。(g) Plans.md ④ を Lane 2 完了 + Lane 3〜5 申し送り（backend 上限 / sticky × 識別列 probe / A' 帯 contrast）へ更新する。

### 失敗定義

- `PageShell` 化で page root の余白が画面ごとに異なるまま残る（`p-6` 直書き root が 1 つでも残る、または `PageShell` が className で `space-y` を上書きされる）。
- 範囲付き文言が component / caller / test のいずれかで不整合（catalog ⑯ Don't「部分導入」に該当）。
- sticky header が happy-dom の class oracle では green だが Windows native で `<main>` scroll に追従しない（L3 で検出、失敗時は state-backtrack + Gated Amendment）。
- token 実装後も 00-foundations.md の表に未登録、または catalog ⑯ の canonical が「なし」のまま（DS1 / DS3 false-green の温床、Lane 1a Codex P2-2 の再発）。
- 商品一覧の URL `perPage` 既定変更で既存の `perPage=50` URL や `returnTo` 復元が壊れる。

### 非目的

- 8 画面それぞれへの perPage `Select` 追加と既定値の個別最適化（Lane 3〜5。入出庫履歴 / 在庫変動履歴は backend `MAX_PER_PAGE` 100 → 200 の契約変更を伴うため Codex 適性、Scope S8 で申し送る）。
- 識別列固定（DSR-22 mapping）の実装、現在行 3 点の各画面適用、棚卸し A'+器 / C の実装、secondary Badge sweep（Lane 3〜5）。
- `ProductPagination` の `src/components/patterns/` への移設（catalog ⑩ canonical path の変更は DS1 churn を生むため据え置き、旧分析 doc §1-11 の移行コスト判断と同型）。
- dark mode token の追加（`@custom-variant dark` は未使用の下地のまま）。

## 設計判断

| # | 内容 | 裁定 | 採用先・理由 |
|---|---|---|---|
| D-1 | `PageShell` の契約 | `<div className={cn("space-y-6 p-6", className)}>` の単一 root。`min-h-screen` は持たない（`<main>` が `min-h-0 overflow-auto` の grid cell であり、content の最小高は不要。overlay を持つ 1 画面は `className="relative"` で補う） | 04 原則 6「p-6 / space-y-6 を唯一の page root」。`space-y-4` / `space-y-5` の 34 画面は 24px へ揃える（規範化済み・未履行の履行、旧分析 doc §1-6）。Writer は Contract Probe で `min-h-screen` 依存（footer 固定・中央寄せ）が無いことを 9 画面で確認する |
| D-2 | sticky header と識別列固定の両立 | 本 lane は sticky header のみ実装（ListShell が `[&_[data-slot=table-container]]:overflow-visible` で wrapper の scroll container 化を解き、`thead` に `sticky top-0 z-10 bg-background` を付ける）。識別列固定は `identityColumns?: number` prop を予約するだけで描画に影響しない（未指定と同一）。両立方式（wrapper を横 scroll container に戻すと sticky header が死ぬ / `<main>` を両軸 scroller にすると page 全体が横 scroll する / 二重 table）は Lane 3〜5 で横 overflow が実発生する画面（DSR-22 発動条件）を確認してから probe する | 起票時実測 2 点目。DSR-22 は識別列固定を「横 overflow が実際に生じるときにだけ opt-in」と pin しており、pilot の商品一覧で overflow 実発生の証拠がない段階で方式を固定しない |
| D-3 | 範囲付き文言の 0 件・端数契約 | `from = (page-1)*perPage+1`、`to = min(page*perPage, totalCount)`。`totalCount === 0` のときは `0 件` のみ表示し前後ボタンは両方 disabled、`totalPages` は 1 扱い。`toLocaleString("ja-JP")` は n / from / to すべてに適用 | catalog ⑩「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」を pin しつつ、0 件で「0 件中 0〜0 件目」と読ませない。既存 caller の 0 件時の表示（pagination を隠すか）は Writer が probe し、隠している caller は現状維持 |
| D-4 | 上部 variant の形 | 同 file から `PaginationSummary`（text-only、`text-sm font-medium text-foreground`、ボタンなし）を export。ListShell の `topSummary?: boolean` が描画を制御し、pilot の商品一覧のみ `true` | catalog ⑩ Don't「上部 variant に下部と同じボタン群を無条件で重ねる」/ DSR-22「上部は text 必須・pager ボタン任意」。ボタン付き上部 variant は要望が出た画面で Lane 3〜5 が判断 |
| D-5 | ListShell の props | `{ toolbar: ReactNode; toolbarSecondary?: ReactNode; pagination?: {page, perPage, totalCount, onPageChange}; topSummary?: boolean; stickyHeader?: boolean; identityColumns?: number; isLoading?: boolean; skeleton?: ReactNode; children }`。toolbar 枠は `rounded-md border p-4` の 1 箱に 2 段（`toolbarSecondary` 省略時は 1 段）。`pagination` 省略時は上下とも描画しない | catalog ⑯ 必須構成 6 項目のうち 1〜3・6 を本 lane で満たし、4（識別列）は予約、5（現在行 3 点）は token 提供のみ（各画面適用は Lane 3〜5） |
| D-6 | 商品一覧 pilot の範囲 | `ProductListPage.tsx:103` / `:150` の 2 段 toolbar を ListShell の `toolbar` / `toolbarSecondary` へ移し、table を children に、`:290` の pager を `pagination` prop へ。`topSummary` / `stickyHeader` を `true`。既定 perPage を 100 へ（`search.ts` 正規化の既定値。URL に `perPage` がある場合はそれを優先する現行挙動を維持） | DSR-22 判定フロー「商品一覧は 1 件探索が主動線のため既定 100」。他 7 caller は文言移行のみで ListShell 化しない（Lane 3〜5） |
| D-7 | `--border` 濃化の扱い | `#e7e5e4` → `#cdc8c4` を本 lane に含める（token 1 行）。L3 で旧 root 3 系統から 1 画面ずつ + 商品一覧で「構造線が主張しすぎないか」を owner が判定し、否なら Gated Amendment で値のみ戻す | DSR-22「構造線は現行 `--border` の実測 ≈1.20:1 より一段濃くする」。token 単位の可逆変更であり、別 lane に分けると DS3 突合で 00-foundations の値が二度動く |
| D-8 | Lane 1b の同乗と descope 経路 | Writer は runtime（S1〜S6）→ docs（S6, S8）→ mockup（S7）の順で積む。Plan Review round 天井または relay 上限に達した時点で S7 が未着手なら、Coordinator は S7 を Non-scope へ移し Plans.md ④ に「Lane 1b は次 lane 同乗」と戻す（Gated Amendment として記録） | Lane 1a 申し送り「Lane 1b は Lane 2 実装 PR に同乗」を守りつつ、runtime 本体の収束を優先する |

## Scope

**S1 token 実装 + 00-foundations 正式登録**: `src/styles/globals.css` `:root` に `--border-strong: #8a8480;` / `--row-current: #fff8e6;` を追加し `--border` を `#cdc8c4` へ変更、`@theme inline` に `--color-border-strong: var(--border-strong);` / `--color-row-current: var(--row-current);` を追加（Tailwind 4 で `border-border-strong` / `bg-row-current` utility が生える）。`docs/design-system/00-foundations.md:12-18` のカラーパレット表へ「操作枠 / `--border-strong` / — / #8a8480 / 対 `--background` 3.53:1・対 `--card` 3.38:1（DSR-22、2026-09-03 提案値の実装）」「現在行背景 / `--row-current` / — / #fff8e6 / 対 `--foreground` 16.5:1（DSR-22）」の 2 行を追加し、`--border` 行を `#cdc8c4`（実測 1.66:1、DSR-22「構造線を一段濃く」）へ更新。`reference/2026-08-23-current-design-analysis.md` §8 に「Lane 2 で実装済み（globals.css）」の 1 行を追記。

**S2 `PageShell` 新設 + page root 43 箇所の置換**: `src/components/patterns/PageShell.tsx`（D-1）+ `PageShell.test.tsx`。`src/features/**/*Page.tsx`（test 除外）の root `<div className="space-y-4 p-6">` / `"space-y-5 p-6"` / `"min-h-screen space-y-6 p-6"` / `"relative min-h-screen space-y-6 p-6"` の 43 箇所を `<PageShell>`（overlay 画面は `<PageShell className="relative">`）へ置換。非 root 2 箇所（card / overlay の `p-6`）は対象外。Writer は before/after 表を機械抽出（`rg -n ... | sort` の出力を貼る、手動転記禁止）で Implementation Results に置く。既存 page test の root class を assert する箇所があれば `PageShell` 経由の class へ更新する（削除・skip 不可）。

**S3 ページ送り文言の一括移行 + `PaginationSummary`**: `ProductPagination.tsx` の文言を D-3 の範囲付き統一形へ、同 file から `PaginationSummary` を export（D-4）。8 caller は props 不変のため import 変更なし。test 4 file 6 箇所の期待文言を新形へ更新（例: `IntegrityCheckPage.test.tsx:410` `"101 件中 1 / 2 ページ"` → `"101 件中 1〜100 件目 · 1 / 2 ページ"`）。

**S4 `ListShell` 新設**: `src/components/patterns/ListShell.tsx`（D-2 / D-5）+ `ListShell.test.tsx`。sticky header は `stickyHeader` 時に table-container の overflow 上書き + `thead` への `sticky top-0 z-10 bg-background` 付与を class oracle で保証し、実追従は L3（AC-L3-2）。

**S5 商品一覧 pilot**: D-6。`search.ts` の perPage 既定を 100 へ（`normalizePerPage` の fallback）。`ProductListPage.test.tsx` の `per_page` 期待 50 → 100 を更新、`returnTo` / URL `perPage=50` 明示時の挙動 test は現状維持で regression。

**S6 canonical docs 同期**: catalog ⑯ canonical を `` `src/components/patterns/ListShell.tsx` `` へ（「Lane 2 で新設予定」撤去、必須構成 4 は「API 予約のみ、実装は Lane 3〜5」と明記）、catalog ⑩ の件数文言 pin を範囲付き統一形へ・上部 variant canonical を `` `PaginationSummary`（同 file） `` へ・「Lane 2 移行対象」表記を撤去、DSR-22 の「範囲付き統一形は Lane 2 移行対象」文と「Lane 2 で globals.css に実装した時点で」文を実装済み表記へ、04-backbone 原則 6 の履行状態（`:40` 表「現行 3 系統を 1 つへ」→ 実装済み）と原則 13〜15 の token 参照を実 token 名へ、`59-ui-shared-patterns.md` §59.1 に `PageShell` / `ListShell` の 2 行追加（採用画面は `rg` 実測式で記載、D-050 準拠）、`docs/design-system/README.md` の実装状況表記があれば同期、`docs/quality/review-checklist.md` カテゴリ 9 に「page root は `PageShell`、一覧の器は `ListShell`」の確認行を追加、`docs/UI_TECH_STACK.md:403` の「DSR-01〜13」stale を「DSR-01〜22」へ是正（backlog `Plans.md:93` 消化、小口同乗）。

**S7 Lane 1b mockup 5 file の現状同期**: `git show 20c4600:docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html` を起点に、CSS 変数を S1 の実装値（`--border` #cdc8c4 / `--border-strong` #8a8480 / `--row-current` #fff8e6）へ揃え、04 原則 13〜16 / DSR-22（Badge 3:1・当たり判定 24×24・低視力注記）/ `mockup-d-lists.html` と同一 token 系統に同期して追加。各 file に「これを採ると何が変わるか」1 行 note + 番号付き未決項目（Lane 1a と同型）。`reference/README.md:12-13` の表へ 5 行追加、`:18` の「2 つの mockup-d」を「7 つ」へ。描かないもの = sidebar / PageHeader / ボタンの見た目（旧 SPEC-UILB-D6 継続）。

**S8 Plans.md ④ + 申し送り**: ④ を「Lane 2 完了、次 = Lane 3〜5」へ更新し、sub-bullet に (i) 入出庫履歴 / 在庫変動履歴の perPage 200 は backend `inventory_service::list.rs:21` `MAX_PER_PAGE` 100 → 200 の契約変更（docs 21 + tests）を伴う（Codex 適性）(ii) sticky header × 識別列固定 × DSR-17 `<main>` 単一 scroll の両立 probe は横 overflow 実発生画面で行う（D-2）(iii) 棚卸し A' 帯ラベルの contrast 是正（Lane 1a 申し送り、`--muted-foreground` 対 `--card` 4.40:1）は棚卸し lane で、を記録。`Plans.md:93` の UI_TECH_STACK stale 行を消化済みへ。

## Non-scope

- 商品一覧以外 7 画面の ListShell 化・perPage `Select`・既定値変更（Lane 3〜5）。
- backend `MAX_PER_PAGE` の引き上げ（Rust + docs 21 / 24 / 32、Lane 3〜5 の履歴系 lane で Codex 発注）。
- 識別列固定の描画実装、現在行 3 点（`bg-row-current` + 左バー + badge）の各画面適用、棚卸し header A'+器 / 完了画面 C、secondary Badge の 3:1 sweep。
- `ProductPagination` の file 移設、dark mode token、E2E / visual regression の再評価（④ 完了時、UI_TECH_STACK §7.2）。
- decision-log の新規 D 採番（座組は D-079 の Impact 条項で足り、設計判断は本 packet と DSR-22 追記で正本化する。Plan Review が D 化を求めた場合のみ追加）。

## Acceptance Criteria

- AC1（S1）: `rg -n -- "--border-strong: #8a8480|--row-current: #fff8e6|--border: #cdc8c4" src/styles/globals.css` = 3 hit、`rg -n -- "--color-border-strong|--color-row-current" src/styles/globals.css` = 2 hit。`rg -c "border-strong" docs/design-system/00-foundations.md` ≥ 1、`rg -c "#e7e5e4" docs/design-system/00-foundations.md` = 0。`SC1` green。
- AC2（S2）: `rg -n --glob '*Page.tsx' --glob '!*.test.tsx' 'className="[^"]*\bp-6\b' src/features` の hit が非 root 2 箇所（card / overlay）のみ。`rg -l "<PageShell" src/features --glob '!*.test.tsx'` = 43 file 相当（file 数は Writer が機械抽出で記録）。`SC2a` / `SC2b` green。
- AC3（S3）: `rg -n "件中 [0-9,]+〜[0-9,]+ 件目 · " src --glob '*.test.tsx'` ≥ 4 file、旧形 `rg -n '件中 [0-9]+ / [0-9]+ ページ"' src --glob '*.test.tsx'` = 0。`SC3a` / `SC3b` / `SC3c` green。
- AC4（S4）: `SC4a`〜`SC4e` green。`rg -n "identityColumns" src/components/patterns/ListShell.tsx` ≥ 1 かつ描画分岐なし（Review Focus で確認）。
- AC5（S5）: `SC5a` / `SC5b` green、`StocktakePage.test.tsx` の `per_page: 50` 期待は無変更（`git diff --stat -- src/features/stocktake/StocktakePage.test.tsx` = 0 行）。
- AC-L3-1（S2 / D-7、render oracle）: 旧 root 3 系統から 1 画面ずつ（`space-y-4` 系 = 入庫、`space-y-5` 系 = Writer が機械抽出表から 1 画面指定、`min-h-screen` 系 = 棚卸しカウント）+ ホームを開き、section 間余白が揃っていること・構造線（表罫線 / card 枠）が濃くなりすぎていないことを owner が判定。否の場合は D-7 の可逆 amendment。
- AC-L3-2（S4 / S5、render oracle）: 商品一覧で perPage 100 の一覧を縦 scroll し、table header が `<main>` の上端に留まること、toolbar が 1 枚の枠に 2 段で入っていること、上部に「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」text のみ（ボタンなし）、下部に同文言 + 前へ / 次へがあることを確認。
- AC-L3-3（S5、route/search state）: 商品一覧を URL 指定なしで開くと 100 件表示、`?perPage=50` 付きで開くと 50 件、`Select` で 200 へ変えて商品詳細 → 戻る（`returnTo`）で 200 が保たれることを確認。
- AC-L3-4（DSR-22 低視力 L3 (a)(b)、`ProductListPage.tsx` の render oracle）: 商品一覧を Windows ハイコントラスト（forced-colors）で開き、枠・focus・sticky header が消えないこと。DPI 125% / 150% で toolbar 枠と pager が崩れないこと。
- AC-L3-5（S7、mockup 視認）: `docs/design-system/reference/mockup-d-{forms-a,forms-b,history,home-sales-admin,import-export}.html` 5 file をブラウザで開き、番号付き未決項目に「n 番だけ嫌」形式で回答。
- AC6（S6）: `rg -c "Lane 2 で新設予定|Lane 2 移行対象|Lane 2 で globals.css" docs/design-system/*.md` = 0、`rg -c "src/components/patterns/ListShell.tsx" docs/design-system/02-component-catalog.md` ≥ 1、`rg -c "DSR-01〜22" docs/UI_TECH_STACK.md` ≥ 1 かつ `rg -c "DSR-01〜13" docs/UI_TECH_STACK.md` = 0、`rg -c "PageShell|ListShell" docs/function-design/59-ui-shared-patterns.md` ≥ 2。
- AC7（S7）: `fd -I 'mockup-d-' docs/design-system/reference` = 7 file、`rg -c "mockup-d-" docs/design-system/reference/README.md` ≥ 7、各 file に外部資源参照なし（`rg -n 'https?://' <file>` = 0）。
- AC8（S8）: `rg -c "MAX_PER_PAGE" docs/Plans.md` ≥ 1、`Plans.md:93` 相当の UI_TECH_STACK stale 行が消化済み表記。
- AC9（gate）: `bash scripts/doc-consistency-check.sh` ERROR 0（DS1 / DS3 の実在件数増を記録）、`bash scripts/doc-consistency-check.sh --target plan`、`npm run typecheck` / `npm run lint` / `npm run test` / `npm run format:check` clean、`cd src-tauri && cargo run --bin generate_traceability -- --check` clean、`git diff --stat -- src/lib/bindings.ts src-tauri` = 0 行。
- AC10（mutation）: Matrix「必須 mutation 注入」X1〜X12 を Final Review で Sonnet subagent（隔離 worktree、clean tree）が `npm run test` で独立再実測し全 kill（survivor 0）。

## Design Sources

- Requirements: `docs/REQUIREMENTS.md`（UI 群、既存 REQ-105 / REQ-907 等の一覧画面要件）
- Architecture: `docs/ARCHITECTURE.md`（UI 層 / patterns 配置）
- Function design: `docs/function-design/59-ui-shared-patterns.md` §59.1 / `docs/function-design/58-ui-stock-inquiry.md:80,561`（200 clamp 記述）/ `docs/function-design/21-io-inventory-repo.md:7`（100 上限）
- Screen design: `docs/SCREEN_DESIGN.md`（商品一覧）
- Design system: `docs/design-system/00-foundations.md` / `01-decision-rules.md` DSR-17・DSR-22 / `02-component-catalog.md` ⑩ ⑯ / `04-backbone.md` 原則 6・13〜16 / `reference/2026-08-23-current-design-analysis.md` §8
- Decision log: D-056 / D-079

## Required Design Artifacts

| Area | Required source doc | Status |
|---|---|---|
| token | 00-foundations.md カラーパレット表 | S1 で 2 行追加 + `--border` 更新 |
| shared patterns | 59-ui-shared-patterns.md §59.1 | S6 で `PageShell` / `ListShell` 行追加 |
| catalog | 02-component-catalog.md ⑯ ⑩ | S6 で canonical path / 文言 pin 更新 |
| DSR | 01-decision-rules.md DSR-22 | S6 で実装済み表記 + D-2 の両立 probe 申し送り追記 |
| backbone | 04-backbone.md 原則 6 履行表 `:40` | S6 |
| mockup | reference/README.md + 5 HTML | S7 |
| checklist | quality/review-checklist.md カテゴリ 9 | S6 |
| plans | Plans.md ④ | S8 |

## Registration / Generation Obligations

新規 Tauri command / route / function-design doc / operator 画面の追加はない。

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| `src/components/patterns/PageShell.tsx` | 59-ui-shared-patterns.md §59.1 行追加 / catalog（04 原則 6 の canonical 参照）/ test 同梱 | S2 + S6 |
| `src/components/patterns/ListShell.tsx` | 59-ui-shared-patterns.md §59.1 行追加 / catalog ⑯ canonical 記載（DS1 対象化）/ test 同梱 | S4 + S6 |
| `PaginationSummary`（`ProductPagination.tsx` 内 export） | catalog ⑩ 上部 variant の canonical 記載 | S3 + S6 |
| token 3 件 | 00-foundations.md 表（DS3 対象化） | S1 |
| mockup 5 file | reference/README.md 表 | S7 |
| REQ coverage | 新規 REQ 追加なし。既存 test の REQ token は文言更新のみで保持（`generate_traceability --check` で確認） | AC9 |

## Design Intent Trace

| Spec/requirement ID | Source design doc section | Decision ID | Why | Implementation target | Test target |
|---|---|---|---|---|---|
| 04 原則 6 | 04-backbone.md:22,40 | D-1 | page root 3 系統を 1 つへ | `PageShell` + 43 root | SC2a / SC2b / AC-L3-1 |
| 04 原則 13 / DSR-22 操作枠 3:1 | 01-decision-rules.md DSR-22 | D-7 | 操作枠 3:1・構造線一段濃く | `--border-strong` / `--border` | SC1 / AC-L3-1 |
| 04 原則 14 / catalog ⑯ 1〜3・6 | 02-component-catalog.md ⑯ | D-2 / D-5 | 一覧の器の共通化 | `ListShell` | SC4a〜e / AC-L3-2 |
| 04 原則 15 / DSR-22 現在行 | 01-decision-rules.md DSR-22 | — | 現在行専用 tone | `--row-current` token のみ | SC1 |
| catalog ⑩ 件数文言 | 02-component-catalog.md:644 | D-3 / D-4 | 範囲付き統一形 + 上部 text-only | `ProductPagination` / `PaginationSummary` | SC3a〜c |
| DSR-22 perPage 既定 | 01-decision-rules.md DSR-22 判定フロー | D-6 | 商品一覧 100 / 棚卸し 50 | `search.ts` | SC5a / AC-L3-3 |
| DSR-17 (c) `<main>` scroll | 01-decision-rules.md DSR-17 | D-2 | sticky header を `<main>` 相対に | `ListShell` overflow 上書き | SC4d / AC-L3-2 |
| DSR-22 低視力 L3 | 01-decision-rules.md DSR-22 末尾 | — | forced-colors / DPI | — | AC-L3-4 |
| Lane 1a 申し送り（token 正式登録・canonical 復元） | archived packet :274-278 | — | DS1 / DS3 false-green 回避 | 00 / ⑯ 記載 | AC1 / AC6 |

## Design Intent Audit

- 実装対象の各要素は上表の設計 doc 節へ遡れる。
- 設計 doc に存在しない新規契約（`ListShell` props、0 件文言）は本 packet の設計判断で決め、S6 で catalog へ転記する。
- Lane 3〜5 へ送る項目は Non-scope と S8 に明示し、暗黙の scope 縮小をしない。
- 旧 Lane 1 branch の成果は mockup 5 file の起点としてのみ使い、規範文は main の Lane 1a 正本を優先する。
- 「Lane 2 で〜予定」表記は S6 で全 sweep（AC6 = 0 hit）し、宙ぶらりん参照を残さない。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| operator workflow | 商品一覧の既定表示件数 50 → 100、全画面の section 余白統一 | AC-L3-1 / AC-L3-3 |
| route/search state | `perPage` 既定の正規化変更（URL 明示値は優先維持） | SC5a / AC-L3-3 |
| scroll restoration（DSR-17） | ListShell の overflow 上書きは `<main>` scroll を変えない。table-container が scroll container でなくなるため横 overflow 時は page 幅を超えて `<main>` が横 scroll する（pilot で overflow 実発生なしを Writer が確認） | Contract Probe 2 |
| accessibility | sticky thead に `bg-background` 必須（透過で行が透ける）、forced-colors で枠が消えない | AC-L3-4 |
| DS1 / DS3 gate | canonical path・token HEX の実在件数が増える | AC9 記録 |
| test suite | 文言 assert 6 箇所 + `per_page` 期待 1 箇所の更新、削除・skip なし | Review Focus |
| backend | 変更なし。`per_page: 100` は clamp 200 内 | AC9 bindings 0 行 |
| Lane 3〜5 | backend 上限 / 識別列 probe / A' contrast を申し送り | S8 |
| npm | 新規依存なし | — |

## Design Readiness

- 規範文は Lane 1a で確定済み（DSR-22 / ⑯ / ⑩ / 04）。
- token 値は reference §8 に実測付きで確定済み。
- `ListShell` API は本 packet D-5 で提案、Plan Review（Opus デザイン面）で critique を受ける。
- L3 手順は AC-L3-1〜5 に固定。

Minimum design checks for business-app work:
- 日本語文言は catalog ⑩ の pin と一字一句一致（「〜」は U+301C、「·」は U+00B7）。
- 色のみで状態を伝えない（sticky header は位置、現在行 token は本 lane で未使用）。
- 既定件数変更で操作者の待ち時間が増えないこと（`search_products` 100 件は既存 `Select` 選択肢で実運用済み）。
- 余白統一で情報密度が下がりすぎないこと（L3）。
- 既存 test の削除・skip なし。
- docs の「予定」表記を残さない。
- 機械抽出の before/after 表。

## Contract Probe

- **Probe 1（S2、`min-h-screen` 依存）**: 9 画面（`min-h-screen` 系 8 + `relative` 1）で root の `min-h-screen` を外しても footer 固定・中央寄せ・overlay 位置が変わらないことを Writer が実装前に確認する（`rg -n "min-h-screen|sticky bottom|absolute inset" <各 file>`）。`relative` 依存 1 画面は `className="relative"` を渡す。依存が見つかった場合は当該画面だけ `className` で補い、`PageShell` 本体に `min-h-screen` を入れない。
- **Probe 2（S4、overflow 上書き）**: pilot の商品一覧を perPage 200 + 最長商品名の合成データで描画し、table 幅が `<main>` 幅を超えないこと（横 overflow が実発生しないこと）を happy-dom ではなく Writer の dev 起動（`npm run dev` 相当、Tauri なしの Vite）で目視 or 幅計測し、結果を Implementation Results に記録する。超える場合は D-2 の probe を本 lane に前倒しせず、`stickyHeader` を pilot で `false` にして AC-L3-2 の sticky 項目を L3 から外す Gated Amendment を起票する。
- **Probe 3（S3、0 件表示）**: 8 caller のうち 0 件時に `ProductPagination` を描画しない caller を `rg -n "totalCount|total_count" <各 Page>` で確認し、描画する caller のみ D-3 の `0 件` 契約が見える。結果を Implementation Results に列挙する。
- 登録漏れ是正を含む probe は是正を仮適用した状態で end-to-end に実行する — 本 packet は登録漏れ型ではないため非該当。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| S1 token 3 件 | globals.css / 00-foundations | SC1（fs literal oracle） | AC-L3-1（濃化の視認） |
| D-1 PageShell | PageShell.tsx / 43 root | SC2a / SC2b | AC-L3-1 |
| D-3 範囲付き文言 | ProductPagination.tsx | SC3a / SC3b | AC-L3-2 |
| D-4 PaginationSummary | 同 file | SC3c | AC-L3-2 |
| D-5 ListShell toolbar 枠 | ListShell.tsx | SC4a | AC-L3-2 |
| D-5 topSummary opt-in | ListShell.tsx | SC4b | AC-L3-2 |
| D-5 skeleton | ListShell.tsx | SC4c | — |
| D-2 sticky header class | ListShell.tsx | SC4d | AC-L3-2（実追従） |
| D-5 pager 配線 | ListShell.tsx | SC4e | — |
| D-6 既定 100 | search.ts | SC5a | AC-L3-3 |
| D-6 pilot 構成 | ProductListPage.tsx | SC5b | AC-L3-2 |
| DSR-22 低視力 | — | — | AC-L3-4 |
| S6 docs | design-system / 59 / checklist / UI_TECH_STACK | AC6（rg oracle） | — |
| S7 mockup | reference | AC7 | AC-L3-5 |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-03-ui-list-backbone-d-lane2.md](test-matrices/2026-09-03-ui-list-backbone-d-lane2.md)

- targeted: `npm run test -- src/components/patterns src/features/products src/features/integrity-check src/features/stock-inquiry src/features/operation-logs`（SC1〜SC5 + 文言 regression）
- negative: 0 件 / 端数ページ / `perPage` URL 明示 / `topSummary` false / `stickyHeader` false
- compatibility: 8 caller の props 不変、`StocktakePage.test.tsx` 無変更、`returnTo` regression
- data safety: synthetic のみ
- main wiring: `ListShell.pagination.onPageChange` → `ProductListPage` の search state 更新（SC5b で mock 呼び出しを検証）
- L3: AC-L3-1〜5（Windows native、owner）

## Boundary / Wire Contract

- producer / consumer: frontend 内のみ。`search_products` の `per_page` 引数値が既定で 100 になる（wire type 不変、`src/lib/bindings.ts` diff 0 行）。
- backend clamp: `PAGINATION_MAX_PER_PAGE = 200` 内。
- route/search state: `ProductSearch` schema の `perPage` 既定値のみ変更、URL 明示値・`returnTo` 復元は現行挙動。
- CSS token: 新規 2 + 値変更 1。消費者は utility 経由（`border-border-strong` / `bg-row-current`）、本 lane では ListShell / sticky thead 以外で未使用。
- compatibility: `ProductPagination` props 不変、`PaginationSummary` は追加 export。

## Review Focus

- `PageShell` に `min-h-screen` / `space-y` 上書きが紛れていないか（D-1）。
- 43 root の置換漏れ・過剰置換（card / overlay の `p-6` を触っていないか）— 機械抽出表と `rg` 実測の突合。
- 範囲付き文言の from / to 計算と 0 件契約（D-3）、`toLocaleString` の適用漏れ。
- `PaginationSummary` にボタンが無いこと、`ListShell` の `topSummary` 既定 false。
- sticky header の overflow 上書きが `<main>` の scroll / DSR-17 復元に副作用を持たないこと（`data-scroll-restoration-id` を触らない）。
- `identityColumns` が描画に影響しない予約 prop であること。
- 既存 test の削除・skip・弱体化がないこと（文言更新は期待値の置換のみ）。
- S6 の「予定」表記 sweep（AC6 = 0）と DS1 / DS3 件数の増加が実在物と一致すること。
- mockup 5 file が Lane 1a の token 系統と一致し、外部資源を持たないこと。
- Sonnet Writer の mutation 自己申告は採用せず、Final Review の独立再実測のみを kill 証跡とする。

## Spec Contract

Contract ID: SPEC-UILB-D-LANE2-2026-09-03

- `src/styles/globals.css` `:root` は `--border-strong: #8a8480` / `--row-current: #fff8e6` / `--border: #cdc8c4` を宣言し、`@theme inline` が `--color-border-strong` / `--color-row-current` を map する。
- `PageShell` は `space-y-6 p-6` を持つ単一 `div` root を描画し、`className` は追加のみ（`space-y-6` / `p-6` を除去しない）。`src/features/**/*Page.tsx` の page root は全て `PageShell`。
- `ProductPagination` の件数文言は `{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ`（n / from / to は `ja-JP` locale）。`totalCount === 0` では `0 件` のみを表示し前後ボタンは disabled。
- `PaginationSummary` は同文言の text のみを描画し、`button` 要素を含まない。
- `ListShell` は toolbar を `rounded-md border p-4` の枠に描画し、`topSummary` が true のときだけ `PaginationSummary` を table の上に描画し、`pagination` があるとき table の下に `ProductPagination` を描画し、`isLoading` のとき children の代わりに skeleton（既定 `ListSkeleton`）を描画し、`stickyHeader` のとき `thead` に `sticky top-0` を付与し table-container の overflow を visible に上書きする。`identityColumns` は描画に影響しない。
- 商品一覧の `perPage` 既定は 100、URL 明示値が優先。棚卸しの既定 50 は不変。
- canonical docs の `--border-strong` / `--row-current` / `ListShell.tsx` / `PaginationSummary` 記載は実在 path / 実装値と一致し、「Lane 2 で〜予定」「Lane 2 移行対象」表記は 0。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| token 3 件 | S1 | SC1 | 値の一致 | Matrix / AC1 |
| PageShell 単一 root | S2 | SC2a | `min-h-screen` 不在 | Matrix |
| page root 全置換 | S2 | SC2b | 機械抽出表 | Matrix / AC2 |
| 範囲付き文言 | S3 | SC3a | from / to 計算 | Matrix / AC3 |
| 0 件契約 | S3 | SC3b | disabled | Matrix |
| Summary text-only | S3 | SC3c | button 0 | Matrix |
| toolbar 枠 | S4 | SC4a | class | Matrix |
| topSummary opt-in | S4 | SC4b | 既定 false | Matrix |
| skeleton | S4 | SC4c | children 非描画 | Matrix |
| sticky class + overflow 上書き | S4 | SC4d | DSR-17 副作用なし | Matrix / AC-L3-2 |
| pager 配線 | S4 | SC4e | onPageChange | Matrix |
| 既定 100 | S5 | SC5a | URL 優先 | Matrix / AC-L3-3 |
| pilot 構成 | S5 | SC5b | ListShell 経由 | Matrix / AC-L3-2 |
| docs 同期 | S6 | AC6 | 「予定」0 | AC6 / AC9 |
| mockup 5 file | S7 | AC7 | token 系統 | AC7 / AC-L3-5 |
| Plans 申し送り | S8 | AC8 | 3 件 | AC8 |

## Data Safety

- 業務データ・実店舗データに非接触。CSS token・page root class・件数文言・検索 state の既定値のみを扱う。
- local-only: `perPage` は URL search state（既存機構）、永続化の追加なし。
- synthetic-only: test / probe の seed は合成の商品名・コード・件数。mockup も合成データ。

## Implementation Results

（Writer が記入。S2 の before/after 表は機械抽出、Probe 1〜3 の結果を列挙）

## Review Response

（Plan Review / Final Review の round ごとに追記）

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
