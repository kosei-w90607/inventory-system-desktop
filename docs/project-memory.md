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
- Local field-check reference materials are kept outside the repo at `/home/kosei/Downloads/inventory-field-check` (`\\wsl.localhost\Ubuntu-22.04\home\kosei\Downloads\inventory-field-check` from Windows). Use `summaries/` and `approved-readable/ECRCV17.pdf` for CV17/register-tool facts when needed, but do not commit real CSV/XLSX/PDF outputs, screenshots, register backups, JANs, product names, prices, or store-specific sales/cost data.
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

## Store Premises Facts（現場の前提、owner確認 2026-09-19）

店の実態を前提にする設計・レビュー・移行の判断をする前に、まずここを引く。載っていない事実が判断に要るときは owner に 1 問だけ尋ね、答えを確認日つきで同じ commit へ足す（backlog の該当 entry を参照）。本番開始後に変わる前提（PLU 段階移行、印刷要否など）は、変わった時点で開始日とともに更新する。

起票の背景: 2026-09-19、Plan Review round 3 で「実店舗に本番データが在る」という誤った前提のまま移行設計を議論し、owner へ escalation する事態が発生した。本節はその再発防止として、散らばった記録から拾った事実と owner の 2026-09-19 回答を 1 枚に統合したもの。種類 1・3〜7（下記）は owner の直接確認欄が未記入のため、出典を現物確認できたものだけを「記録済み（出典つき）」として収載している。種類 2「無いもの」と 15 問の owner 回答は 2026-09-19 に直接確認済み。

### 在るもの

- Register is `CASIO SR-S4000` — 2026-06-30 field-check — `docs/project-memory.md`（本文書 POS Facts）
- Store has `カシオレジスターツール for SR-S500/SR-C550/SR-S4000/SR-S200`（CV-17 1.1.1.0）installed on the PC — 2026-06 field-check — `docs/project-memory.md`
- SD card → CV17 import is the existing data-recovery route from register to PC — 2026-08-01 owner判断 — `docs/plu-export-and-real-csv-verification.md`
- Store also uses CASIO ECR+（スマホアプリ）daily, but it will not be the long-term primary POS integration because it has a planned service end — 2026-06-30 field-check — `docs/plu-export-and-real-csv-verification.md`（decision-log D-022 でも同じ懸念を記録）
- Daily report files (Z001/Z002/Z005) are pasted into an Excel file group almost as-is and overwritten/printed each day; printed pages are filed in a binder — 2026-06-30 field-check — `docs/project-memory.md`
- Developer is a family member of the store owner with a software background — （記録済み） — `docs/project-memory.md`
- Price-revision notices for handicraft goods all pass through one main wholesaler（メーカー兼業）; non-handicraft categories get no such notice and learn price changes only from reorder slips — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- About 80 supplier relationships total: ~5 direct wholesalers/makers, ~43 handicraft makers via wholesaler, ~31 others; the set shrinks over time as suppliers close or merge — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- Slip retention duty was 5 years, is now 7 years; about 4 years ago a tax accountant's cost inquiry required checking every retained slip individually — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- Register numeric keypad has a decimal point, so quantity × unit price with one decimal digit (e.g. 1.3 × 70円/m) can be entered — 2026-09-15 owner伝聞 — `docs/evidence/hearing-2026-09-14-stock-units.sanitized.md`（追記）
- Excluded long-dormant items（単品コードなし）are sold via department key + amount, tracked only in the owner's memory — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- Current register lease has about 2 years remaining; at expiry the register is returned and a replacement is sought — 2026-09-08 owner原文要旨 — `docs/backlog.md`（D-023 POS adapter boundary 項）
- Of 216 normal PLU slots, only 2 have real store-entered data; the remaining 214 are factory-default `PLU####` placeholders — see also「レジ・レジスターツール」節の訂正事実 — 2026-08-17 実機機械抽出 — `docs/plu-export-and-real-csv-verification.md`
- 10 existing products use an 8-digit custom code + `EEEEEE` padding scheme (non-handicraft goods) — 2026-08-17 実機機械抽出 — `docs/plu-export-and-real-csv-verification.md`
- Fabric/ribbon/string receiving slips record quantity in `m`; the store's counting vocabulary covers all 12 unit words in use (個・枚・本・袋・箱・巻・組・セット・玉・丁・m・cm) — 2026-09-14 owner原文 — `docs/evidence/hearing-2026-09-14-stock-units.sanitized.md`
- Some items are received boxed and sold individually after unboxing (e.g. one sewing-notion item) — 2026-09-14 owner原文 — `docs/evidence/hearing-2026-09-14-stock-units.sanitized.md`
- Purchase orders are written on one sheet per wholesaler, grouped by wholesaler — 2026-09-05 owner原文 — `docs/evidence/hearing-2026-09-05-stock-inquiry.sanitized.md`
- Owner already knows almost all discontinued items and defunct suppliers from memory — 2026-09-05 owner原文 — `docs/evidence/hearing-2026-09-05-stock-inquiry.sanitized.md`
- Counting words differ by category: 毛糸=玉, 布=枚, ファスナー=本, はさみ=丁, スナップ=枚, 刺繍糸=本, otherwise mostly 個 — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- The store never sources the same product from two different suppliers — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- Maker package renewals can change the maker's product code — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- Color numbers are commonly used to find/order color-variant products — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- Price-revision notices always carry barcode / product name / maker code / old & new price; one maker's notices lack catalog page references and renewals can confuse identification — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- 「約定」: the owner can negotiate a lower cost directly with a sales rep on bulk orders, below the standard reference cost — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- Some hair-accessory items have no reference list price; the store sets cost itself for those — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`

### 無いもの（owner回答 2026-09-19、種類2 全13件）

- No production DB / production import history exists yet in the real store; only dev/demo/test DBs exist — owner回答2026-09-19
- Everything outside the register is currently paper operation; this app is close to a from-scratch (greenfield) introduction — owner回答2026-09-19。owner原文: 「今間に合わせでexcelシート作って渡した。データの初期投入にも使えるから良いかと思って」（ただし owner 自身は運用が続くか不安、原文「あんま運用できる気せんし俺もどう導けばいいかわからん」）
- No prior electronic stock record exists; the Excel sheet the owner just handed the store is still being filled in — owner回答2026-09-19「ないと言っていい」
- No electronic purchasing/ordering record; paper slips/lists are the base, though some vendor documents arrive as PDF/email — owner回答2026-09-19「たまにPDFで送られるケースもあるけど結局紙でやってるのが基本」
- No sales-record system other than the register; daily reports are register → Excel transcription → print only — owner回答2026-09-19
- Single store, not multiple locations — owner回答2026-09-19
- No multi-user/employee-account concept; effectively single-operator, low concurrency — owner回答2026-09-19
- No network backup destination in use now; owner is unsure how to fit one to a store this size — owner回答2026-09-19「あったほうがいいんやろなと思いつつ…セキュリティとかそっち方面に不安が残る」
- No accounting/bookkeeping software; the Excel sheet above is the closest thing, and the owner doubts it will stick — owner回答2026-09-19
- No barcode label printer in the store; rejected earlier as impractical for a non-IT elderly-adjacent operator and because some items have no JAN — owner回答2026-09-19「そもそもJANコードない商品もあるのに実用的じゃない」
- No wheeled/mobile work table in the store — owner回答2026-09-19
- `suppliers` table intentionally holds maker/brand only, not the wholesaler order channel — owner回答2026-09-19「その質問と回答が全てやと思う」
- Only a single PC is in use; more than one PC would only happen if the PC itself is replaced — owner回答2026-09-19「単一だよ、単一じゃなくなるとしたらＰＣ変えるとき」

### いまの手作業

- Daily: SD card recovery → CV17 import to PC → paste Z001/Z002/Z005 into Excel → overwrite → print → file in a binder — 2026-06-30 field-check — `docs/project-memory.md`
- Product lookup: check name on the shelf first; if absent, search the name on PC to find the maker, check the catalog, or call the supplier; product code is the final tie-breaker — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- Year-end stocktake: use a paper list in shelf order; blank entries mean not-yet-counted; newly added items are hand-written onto the paper list — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- During stocktake, items received but not yet billed are excluded from the count; discarded items are subtracted from the count — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- Price revision: hand-correct the paper prior-year list's cost/price, re-tag the shelf price, then correct the PC copy of the prior-year list afterward — 2026-08-15 owner原文 — `docs/evidence/issue-76/form-response-2026-08-15.sanitized.md`
- Price-revision notices: lists up to ~400 lines are worked through over several days, prioritizing high-volume items, without waiting for any listed effective date — 2026-08-21/22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- A heavy stocktake year took about 1 week to transcribe onto the paper list, then 2-3 more days to transcribe into the PC — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- Old stock with no item code that sells is tracked from memory only and rung up on a department key — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`
- Rounding: maker markup ratios are usually truncated; the store's own cut-sale fractions are rounded up — 2026-08-21 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`

### 営業中の作業と中断（owner原文、2026-09-19、旧記録の訂正）

旧記録「営業中はレジで販売のみ、システム操作なし」は誤り。owner が同日の会話で明確に訂正した。

- 「PCを触ることもあるよ、作業とかあるやろし」— 営業中でも PC 作業がある
- 「営業中は仕入れた商品開けて商品登録とかも当然やるだろうしな」— 入荷時の商品登録は営業中に発生し得る
- 「編集も登録も廃番も、営業中はなんでもやるよたぶん」— 商品編集・新規登録・廃番のいずれも営業中に起こり得る、接客で中断されながら
- 上記はいずれも owner回答2026-09-19 が基準。設計・レビューで「営業中はシステム操作が発生しない」という前提を置かない。

### 決めた運用（このアプリの使い方について owner が決めたこと）

- Product sales move to PLU gradually after go-live, not in a one-day all-product conversion — 2026-08-01 owner原文 — `docs/project-memory.md`
- Standard daily-report intake procedure is fixed to `SD → CV17 import → pick a file from EcrDatas`; direct SD access or explicit CV17 export are recovery/investigation paths only, not normal choices — 2026-08-01 owner原文（判断） — `docs/project-memory.md` / `docs/plu-export-and-real-csv-verification.md`
- v1.0 gates on including the Z004 automatic-inventory-sync path; the app will not ship v1.0 unfinished in that respect — 2026-08-16 owner裁定 — `docs/decision-log.md`（D-070）
- Long-dormant no-code excluded items are not modeled as a system feature; they stay outside the product master and are re-registered at new price/cost if they come back — 2026-08-22 owner同意 — `docs/decision-log.md`（D-076）
- The ~80 suppliers are not bulk pre-loaded; they get linked incrementally when chosen in flows like bulk price revision — 2026-08-21/22 owner同意 — `docs/decision-log.md`（D-075）
- Weight-based units（g・kg）are not used in this app — 2026-09-13 owner原文 — `docs/backlog.md`（単位の拡張 項）
- Length items use a minimum 10 cm increment; remaining stock, purchasing, and price tags are all expressed in `m`（値札は 1 m あたり） — 2026-09-14 owner回答 — `docs/evidence/hearing-2026-09-14-stock-units.sanitized.md`
- Scanning-PLU の「単品売り」setting must always be `いいえ`; setting it to `はい` was confirmed on real hardware to make the register auto-settle and print a receipt on scan-call alone — 2026-08-19 Windows native L3実機確認 — `docs/project-memory.md`

### 利用者

- Developer is a family member of the store owner, with a software background — （記録済み） — `docs/project-memory.md`
- Operator is the store owner (non-IT); they are the one who operates the PC. Owner also operates it on occasion; nobody else does — 2026-09-19 owner回答「店主自身が操作するから店主想定で懇切丁寧に作らなあかんで、マジで全部説明してあげなあかん。俺が触るケースはある、他のケースはない」
- Design must assume a non-IT, possibly elderly, low-vision-adjacent user; readability and distinguishability are treated as functional requirements — （記録済み） — `docs/SCREEN_DESIGN.md`
- One real user has glaucoma; this shaped the accessibility baseline (forced-colors, target size, contrast) — PR #95 Windows native L3 owner所見 — `docs/archive/plans/2026-08-23-ui-list-backbone-d.md`
- The PC screen is not customer-visible during normal operation (operator's back faces the screen); it is shown to customers only for maker-site catalogs — 2026-08-22 owner原文 — `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md`

### レジ・レジスターツール

- Register model: `CASIO SR-S4000`; main daily inputs are Z001/Z002/Z005, with Z004 as the item-level PLU track — 2026-06-30/2026-07-06 field-check — `docs/project-memory.md`
- Normal PLU occupies slots 1-216 (barcode-less, dial-in); scanning PLU is 217+ — 2026-07 field gate — `docs/project-memory.md`
- Of the 216 normal PLU slots, only 2 hold real store data; the rest are unused factory defaults. The old record "existing PLU ~929 items" is stale and does not match the current store (that count traces to an old handoff doc describing a since-superseded state) — 2026-08-17 実機機械抽出、旧記載は `docs/archive/harness-context/2026-09-14-PROJECT_HANDOFF.md` 参照 — 2026-09-19 owner回答「テスト用に試しに登録しただけやね」で確認済み — `docs/plu-export-and-real-csv-verification.md`
- PLU export is app-to-register only; the app cannot auto-confirm register-side reflection — （記録済み） — `docs/project-memory.md`
- CV17 shows Z001/Z002/Z004/Z005 in one report-screen family and can write them together — 2026-07-06 field-check — `docs/project-memory.md`
- Files left in PC-side `EcrDatas` after SD import are "layout A"; CV17's explicit export is "layout B" — 2026-07 L3 — `docs/project-memory.md`
- Z004 returns appear as negative quantity/amount — 2026-08-15 issue #76 実機バッチ — `docs/plu-export-and-real-csv-verification.md`
- Non-JAN custom-code items are currently all sold via department key; there is no item-level register sale or automatic stock decrement for them — 2026-07-23 owner確認 — `docs/plu-export-and-real-csv-verification.md`
- CASIO ECR+（スマホアプリ）has a planned service end and is not the long-term primary integration — 2026-09-19 owner の既存認識「アプリってもうサービス終了間近とかじゃなかった？これもいつだか言った気がするな」に対応する記録あり — `docs/plu-export-and-real-csv-verification.md`（"サービス終了予定があるため長期の primary integration にはしない"）/ `docs/decision-log.md`（D-022 "despite service-end risk"）

### 未確認

- Whether the daily/monthly report screens can fully replace the current Excel-print-binder record has not been accepted; this is planned as a go-live side-by-side check on one real day, not yet done — `docs/backlog.md`（日報画面のExcel印刷・バインダー代替受入判定 項） / `docs/function-design/56-ui-daily-sales.md`
- CSV export and print behavior have not been end-to-end verified in real use; owner's own characterization is "まともにテストしたことがない" / "印刷は中身を作っていない" — `docs/backlog.md`（CSV出力・印刷の実挙動確認 項）
- Whether the store will want a network (UNC/NAS) backup destination is still open; current handling is low priority pending an explicit need — `docs/backlog.md`（バックアップ保存先のUNC/ネットワークパス対応 項）

owner が「前に言った気がする」と答えた 2 件は、記録を探索した結果、以下のとおり見つかった（未確認へは回さない）。

- ECR+のサービス終了予定 → 見つかった。`docs/plu-export-and-real-csv-verification.md`「ECR+ は店舗で利用中だが、サービス終了予定があるため長期の primary integration にはしない」/ `docs/decision-log.md` D-022 の Alternatives considered「make ECR+ the primary integration despite service-end risk」
- 部門キー（現行レジ最大20程度）の構成は聞き取りで決めた → 見つかった。`docs/db-design/master-tables.md`「初期データ（全21部門、C-1/C-3 2026-03-29 確定）」は同じ 2026-03-29 の「廃番特価の対応方針（利用者ヒアリングで確定）」と同日の店舗ヒアリングに基づく
