# Project Memory

## Purpose

Durable memory for the inventory management project.
Use this to survive context loss, handoffs, and long-running work.
Keep it factual and stable.

## Stable Facts

- Product: inventory management system for a single physical handicraft store
- Users:
  - developer: family member with software background
  - operator: non-IT store owner using Excel and CASIO ECR+ daily
- Method: USDM-driven requirements and design process
- Stack: `Tauri 2.x + React + TypeScript + SQLite`
- Architecture layers: `UI / CMD / BIZ / IO / MNT`
- Public requirements source: `docs/spec/requirements.md` + `docs/spec/requirements-coverage.md` + linked design docs. Owner-retained source material stays outside the repository.

## Business Boundaries

- Single-store local desktop application
- Low concurrency, mostly one operator
- File-based POS integration, not API-based
- CSV workflows are first-class product behavior
- POS integration should preserve a replaceable adapter boundary: register-specific formats/procedures stay in the adapter, while app-internal sales, report, inventory, import lifecycle, and operator concepts stay in the core model.

## POS Facts

- Register family: `CASIO SR-S4000`
- Known CSV families: `Z001`, `Z002`, `Z004`, `Z005`
- Field-check 2026-06-30: current daily report operation uses CASIO PC tool / SD-card `Z001`, `Z002`, and `Z005` as the main report inputs. `Z004` is a PLU/product track and must not be treated as the only current sales import source without a follow-up SALES redesign.
- Field-check 2026-07-06: `Z004` is a confirmed CV17 PLU-by-product sales report, not a future file candidate or PLU master. It has `memory No. / code / name / quantity / amount`, dumps all 5000 slots, and the controlled one-product sale appeared as the only non-zero quantity row in that sample. CV17 presents Z001/Z002/Z004/Z005 in the same report screen family and can write them together; app-core semantics remain split between official aggregates (`Z001/Z002/Z005`) and product-level sales/inventory (`Z004`).
- Confirmed `Z004` characteristics for the existing parser / field-layout enablement:
  - encoding: `CP932`
  - line separators may include `NEL`
  - returns can appear as negative values
- Installed field PC tool observed in 2026-06 field-check is `カシオレジスターツール for SR-S500/SR-C550/SR-S4000/SR-S200`, ProductName `CV-17`, FileVersion/ProductVersion `1.1.1.0`.
- Local field-check reference materials are kept outside the repo at `/home/kosei/downloads/inventory-field-check` (`\\wsl.localhost\Ubuntu-22.04\home\kosei\downloads\inventory-field-check` from Windows). Use `summaries/` and `approved-readable/ECRCV17.pdf` for CV17/register-tool facts when needed, but do not commit real CSV/XLSX/PDF outputs, screenshots, register backups, JANs, product names, prices, or store-specific sales/cost data.
- CV17 1.1.1 daily report profiles observed in 2026-07 L3: files that persist in the PC-side `EcrDatas` directory after SD import are layout A, while register-tool explicit export output is layout B. Owner set the standard store procedure on 2026-08-01 to `SD -> CV17 import -> select files from EcrDatas`; direct SD backup access and explicit export are recovery/investigation paths, not normal operator choices. REQ-401 parser compatibility should accept both layouts without exposing a layout/source choice in the normal UI. First use follows the store manual to the prescribed folder; later use reopens the remembered folder. Layout A is CP932/CRLF with 7-row preamble, 1 header row, then 4-column data rows (`record code`, `label`, `quantity/count`, `amount`). Layout B is a concatenated export shape with leading meta fields, a header, then 4-column repeated rows. `Z001` / `Z002` dates may be `YYYY/M/D`; `Z005` and some export outputs may use `YYYY-MM-DD`.
- The current Excel report files are overwrite targets, not source data, a daily archive, or external/tax submissions. Each day the Z001/Z002/Z005 content is pasted almost as-is into the same Excel file group, which is overwritten before printing; prior daily states do not remain in Excel. The printed pages filed in a binder are therefore the store's only current per-day history. Whether the app's daily/monthly history fully replaces that operator function remains a go-live acceptance check.
- Owner rollout intent confirmed 2026-08-01: when the inventory app enters real operation, product sales will move to PLU gradually rather than in a one-day all-product conversion. Fixed PLU slot allocation, bulk onboarding, Z004 layout A/B enablement, and end-to-end validation of the existing inventory pipeline therefore need go-live planning; unmigrated department-key sales and migrated PLU sales will coexist during transition.
- CV17 1.1.1 scanning PLU import/apply profile observed in 2026-07 field gate: use tab-delimited CP932/CRLF `.txt`; 11 columns `メモリNo.` / `ｽｷｬﾆﾝｸﾞｺｰﾄﾞ` / `名称` / `単価` / `課税方式` / `単品売り` / `負単価` / `品番PLU` / `ゼロ単価` / `入力桁制限` / `部門リンク`; PLU total memory is 5000 shared by normal PLU and scanning PLU; scanning PLU starts at normal PLU SD/CV17 write count + 1; UI-08 does not add an operator setting for this count and currently records the observed code-side profile of normal PLU 216 slots used, so scanning range is `217..=5000`; `入力桁制限` is `無し`; `単品売り` must be `いいえ` (2026-08-19 Windows native L3: `はい` makes SR-S4000 auto-settle as exact cash and print a receipt on scan-call alone, confirmed by switching T1 to `いいえ` on CV17); scanning code must be a valid 13-digit JAN/EAN-13 code and must not fall back to `product_code`; the practical external gate is `CV17 TXT import -> PC tool SD settings write -> SR-S4000 設定読み -> barcode/register behavior confirmation`.
- PLU export is app-to-register only; reflection cannot be auto-confirmed. UI-08 design splits PLU file generation from app-side exported confirmation so `plu_dirty` remains set until the operator explicitly marks the saved PLU file as exported after CV17 import, SD-card write, SR-S4000 read, and representative register call succeed.
- 2026-07-03 field gate: the store-laptop/register-side flow succeeded for the confirmed CV17 `.txt` shape. Treat CV17 import success alone as insufficient. For PR #122, the owner accepted structural equivalence to that confirmed shape as the external gate because the approved-readable file has the same CV17 1.1.1 11-column profile as the app formatter; latest app-generated `.txt` CV17 / SD-card / SR-S4000 / representative barcode recheck remains a Post-UI-08 follow-up, not a PR #122 blocker.

## Settled Design Facts

- DB design is materially complete for implemented backend with 18 original tables; REQ-401 redesign adds planned daily report tables (`daily_report_imports`, `daily_report_*_lines`) before SALES implementation
- Import rollback uses logical invalidation, not physical delete
- CSV import pipeline is `Parse -> Validate -> Preview -> Commit`
- Parse failures are logged to `operation_logs`, not persisted in `csv_imports`
- Multiple `jan_code` matches resolve by `ORDER BY product_code ASC`
- `pos_stock_sync` is an explicit business flag
- `plu_dirty` and `plu_exported_at` track app-side PLU sync state; `plu_exported_at` is not proof of PC-tool acceptance or register reflection
- D-072 / REQ-907 settles PLU gradual onboarding: free-slot authority is the Z004 full-slot snapshot, allocation is sticky by JAN with a persistent memory No., and both Diff and Full are importable after slot persistence.
- PLU export real-device confirmation and Z004 field-layout enablement belong to one go-live verification flow, while `Z001`/`Z002`/`Z005` remain the official daily-report aggregate track; checklist source: `docs/plu-export-and-real-csv-verification.md`
- POS adapter boundary is a settled architecture constraint (`D-023`): CASIO `Z001`/`Z002`/`Z004`/`Z005`, CV17, SD-card, and PC tool details are adapter facts unless a source design doc explicitly promotes a concept to the app core.
- REQ-401 daily report redesign is a settled design direction (`D-025`): `Z001`/`Z002`/`Z005` create app-internal daily report aggregates, while `Z004` remains item-level product-sales/inventory track after PLU verification. Daily reports must not be expanded into fake `sale_records` or `inventory_movements`.
- `stocktake_items.valuation_cost_price` freezes stocktake valuation
- Stocktake may proceed while CSV import remains allowed

## Key Domain Rules

- Products can use JAN-based codes or department-prefix custom codes
- Fabric may be managed in `cm`
- Some products must not auto-decrement stock from POS sales import
- Register-processed returns are reflected through CSV import
- Manual return/exchange exists for non-register cases
- Price-revision notices for handicraft goods arrive via one main wholesaler, one notice per maker, as printed/PDF lists carrying barcode / product name / maker code / old & new price
- Non-handicraft categories (hair accessories, aprons, bags, etc.) learn price changes only from receiving slips at reorder, not from wholesaler notices
- Markup ratio (掛率) varies per product and is a derived value (current cost ÷ current selling price), not persisted in a dedicated column
- Cost is set by the wholesaler/maker, not chosen by the store, except occasional seller-negotiated discounts (約定) on bulk orders
- Selling price is the tax-inclusive reference list price (`selling_price` is tax-inclusive); some categories have no reference list price and the store sets price from cost instead
- `suppliers` means maker/brand (the price-revision notice originator), not the wholesaler order channel
- Stock-take valuation population = products registered in the product master only
- A small number of very old items per year (about 1-5) are kept outside the product master (no product code), sold via department key with no item-level sales tracking, and re-registered with a new code/price if reordered
- The operator PC screen is not customer-visible during normal operation
- Price revisions are applied promptly without waiting for any notice-listed effective date; large lists (up to ~400 lines, including non-stocked items) can take several days to work through

## Current Work and History

現在のphase・blocker・次の行動は [Plans.md](Plans.md)、未了候補は [Backlog](backlog.md)。この文書には進行状態を複製しない。

旧Progress SnapshotとOpen Itemsは [移送前のmemory](archive/harness-context/2026-09-14-project-memory.md) に保存した。未決記録の本文は [過去memoryの未決記録](backlog.md#過去memoryの未決記録) に残し、関係する作業で成立・解消状況を確認する。

重要な判断と理由は [decision-log](decision-log.md) と該当design docを参照する。
