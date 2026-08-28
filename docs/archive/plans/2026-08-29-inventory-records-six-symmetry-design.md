# 入出庫履歴 6 種対称化 Design Phase

## Workflow State

- Phase: archive
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: c2d38a2201269e2110035ca40e63f792c24b310a
- Amendments: none
- Coordinator: Fable（Claude Code session、conductor）
- Writer: Codex（本 session）
- Plan Reviewer: Sonnet subagent（fresh context）一次 + Fable 裁定（2026-08-29、P1/P2 = 0。P2-1 は 58c7667cfec1217e8a6ea29e739dab95f1ef0509 で是正済み）
- Final Reviewer: Sonnet subagent（fresh context、Plan Reviewer とは別個体）+ Fable 裁定（2026-08-29、P1/P2 = 0）
- Reviewed Content HEAD: 58c7667cfec1217e8a6ea29e739dab95f1ef0509
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Plan Review、Ready、merge

この content commit は `kickoff -> spec-check -> design -> plan-draft -> plan-gate` を materialize する。task scope / Risk は本 packet、design の必要性と出力は指定 5 source docs、packet 完備と commit は本 change を evidence とする。Plan Reviewer の独立性が未充足のため `plan-approved` へは進めない。

2026-08-29: Fable window 内で Plan Review を実施（Sonnet subagent 一次 + Fable 裁定、11 節照合・実 schema 突合・P2-1 是正確認）。独立性制約（Writer = Codex ≠ Reviewer = Claude 側）を充足し、plan-approved の evidence が成立した。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only の Design Phase PR。後続 PR B が変更する backend / UI の durable contract を source docs に固定するが、本 PR は runtime code、DB schema、command wire shape、route、generated bindings、tests を変更しない。後続実装は R3 の別 packet とする。

## Goal

Goal Invariant:

### 最小完了条件

- `/inventory/records` の 6 種横断母集団、status 正規化・filter、日付・件数・検索母集団、operator 表示、専用一覧 runway が指定 5 source docs だけで実装可能な粒度に確定する。

### 失敗定義

- CSV取込み / 棚卸しの status、日付、明細数、商品・部門 filter のいずれかを後続実装者が chat や本 packet から補完しなければならない状態、または実コードを変更した状態。

### 非目的

- 6 種対称化の runtime 実装、専用 CSV取込み / 棚卸し一覧、取消・訂正、CSV出力・印刷を本 PR へ取り込まない。

## Scope

- `docs/function-design/65-inventory-record-traceability.md` §65.4.1 / §65.6.1 / §65.8.1 / §65.10 / §65.12。
- `docs/function-design/21-io-inventory-repo.md` §10.5 `list_inventory_records`。
- `docs/function-design/44-cmd-inventory.md` §23.7 / §23.10。
- `docs/function-design/73-ui-stocktake.md` UI-10-D5 / §73.14。
- `docs/function-design/55-ui-csv-import.md` §55.3。
- 本 packet と `Plans.md` の workflow routing。

## Non-scope

- `src/` / `src-tauri/` の全 runtime code、tests、generated bindings。
- `docs/SCREEN_DESIGN.md`（主要遷移 §2 が 6 種を記載済み）。
- `docs/function-design/90-traceability.md`（新規 REQ なし。checker が要求した場合だけ再生成を再判断）。
- `/csv-import/records` / `/stocktake/records` 専用一覧と `listCsvImportRecords` / `listStocktakeRecords` の実装。

## Acceptance Criteria

- 指定 5 docs・11 節が発注仕様を満たし、`src/` / `src-tauri/` / `SCREEN_DESIGN.md` / `90-traceability.md` に diff がない。
- status は `completed_partial -> active` を含む写像と `all / active / canceled / in_progress` の外側 WHERE 契約を持つ。
- CSV取込みは void 済み `sale_records` も履歴母集団へ含め、棚卸しは非 void の stocktake movement だけを差異件数・代表商品・検索母集団に使う。
- operator 文言「商品・部門での絞り込みは、CSV取込みでは取込み明細、棚卸しでは差異のあった商品が対象です。」が source doc に固定される。
- `bash scripts/doc-consistency-check.sh`、新文言 `rg -F -c`、旧文言 0 hit、`git diff --check` が pass する。
- 変更を 1 commit に集約し、Draft PR を open して Ready / merge 前で停止する。
- 実績は Plan Review P2-1 是正（58c7667cfec1217e8a6ea29e739dab95f1ef0509）を含む 2 content commit。是正 commit はレビュー過程の正当な産物として Final Review P3 裁定で容認（2026-08-29）。

## Design Sources

- Requirements / spec: `docs/spec/requirements.md` REQ-206 / REQ-207 / REQ-208 / REQ-303 / REQ-401。
- Architecture: `docs/ARCHITECTURE.md` の `UI -> CMD -> BIZ -> IO/MNT` 境界。
- Function / command / DTO: 本 Scope の 65 / 21 / 44 / 73 / 55。
- DB: `docs/db-design/pos-tables.md`（`csv_imports` / `sale_records`）、`docs/db-design/tracking-system-tables.md`（`inventory_movements` / `stocktakes`）。
- Screen / UI: `docs/SCREEN_DESIGN.md` §2 / §3、`docs/UI_TECH_STACK.md` 業務 status、`docs/quality/review-checklist.md` §9。
- Decision log / ADR: owner 裁定 2026-08-27/28（本 PR では新規 decision ID / REQ を採番しない）。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend repository / validation | 21 §10.5、65 §65.10 slice 4d | updated in this PR |
| Command / DTO / generated binding | 44 §23.7 / §23.10 | updated in this PR。公開 signature 不変 |
| DB / audit / rollback | 65 §65.4.1 / §65.6.1、既存 DB docs | updated in this PR。schema / rollback 挙動不変 |
| Screen / route state / Japanese wording | 65 §65.8.1、73、55 | updated in this PR |
| CSV / import semantics | 65 / 21、既存 `pos-tables.md` | updated in this PR。format 変更なし |
| Durable decision | 65 slice 4d | updated in this PR。新規 global decision ID なし |

## Registration / Generation Obligations

該当なし。本 PR は既存 function-design doc の改訂だけで、新規 doc / command / route / REQ coverage を追加しない。後続 PR B は command registration、bindings、route、traceability を R3 packet で列挙する。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-206 | 65 §65.10 | slice 4d | 4 種 hub を CSV取込み / 棚卸しまで対称化。専用一覧削除は却下し runway 維持。 | future IO/BIZ/CMD/UI | future 6 種 list tests |
| REQ-206 / REQ-401 | 65 §65.4.1 / §65.6.1、21 §10.5 | slice 4d status | source status を 3 表示値へ正規化し、外側 WHERE 1 回で filter drift を防ぐ。 | future repository query / BIZ allowlist | future status map/filter tests |
| REQ-206 / REQ-303 | 65 §65.8.1、21 §10.5 | slice 4d population | CSV は取込み明細、棚卸しは非 void 差異 movement を母集団とする。 | future repository/UI | future item_count/filter tests |
| operator UI | 65 §65.8.1 | slice 4d wording | 母集団差を常時 1 行で説明し、進行中・差異なしを曖昧にしない。 | future hub UI | future RTL text/value assertions + L3 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes。写像、SQL式、WHERE位置、表示文言、runway を source docs へ置く。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 全て 65 / 21 / 44 / 73 / 55 へ昇格。新規 cross-cutting decision ID は不要。
- Assumptions and constraints: 既存 4 種は現行 schema で `active` 固定。CSV取込みと棚卸しの table column は DB docs で突合済み。
- Deferred design gaps, risk, and follow-up target: runtime wiring、tests、generated bindings、Windows native L3 は後続 PR B（R3）。専用一覧は runway。
- Test Design Matrix can cite design decision IDs or source doc sections: yes。後続 Matrix は slice 4d と §65.4.1 / §65.6.1 / §65.8.1 を引用する。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: `is_voided` の CSV履歴保持と棚卸し差異除外を意図的に非対称化し、両方を source docs に明記した。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | CSV file formatは変更せず、app-core の履歴表示だけを拡張。 | 65 / 21 |
| Fact check / design decision split | table column / status は DB docs の事実、正規化・表示は owner 裁定。 | 65 / 21 / 44 |
| Lifecycle / retry | CSV rollback は canceled 表示、棚卸し in_progress は進行中表示。書込み lifecycle は変更なし。 | 65 §65.6.1 / §65.8.1 |
| Operator workflow | status 4 値、進行中 badge、母集団差の常時注記、差異なし表示を固定。 | 65 §65.8.1 |
| Replacement path | POS adapter 非依存の `csv_import` app-core record として表示。 | 65 / 21 |
| Data safety / evidence | docs-only。実店舗データ / CSV / DB を扱わない。 | PR evidence |
| Reporting / accounting semantics | `sale_records` と stocktake 差異 movement を混同せず、item_count 意味を種別別に固定。 | 65 / 21 |
| Manual verification | 本 PR は表示実装なし。後続 PR B で Windows native L3 を設計する。 | future R3 packet / Matrix |
| 環境・再現性 | 新規環境依存なし。repo-owned docs checker のみ。 | validation log |

## Design Readiness

- Existing design docs are sufficient because: DB schema / status / timestamp column は既存 DB docs で確定済み。
- Source docs updated in this PR: Scope の 5 function-design docs。
- Design gaps intentionally deferred: runtime implementation / tests / L3 / dedicated list runway。
- Durable decisions discovered in this plan and promoted to source docs: status map、date/item/search semantics、operator wording、runway。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): SQL母集団と式は IO、allowlist validation は BIZ、CMD signature 不変、表示は UI。
- Backend function design: 21 §10.5 に 6 branch / status外側WHERE / date式を記載。
- Command / DTO / data contract: `InventoryRecordQuery` の literal allowlist だけを拡張。公開 signature / summary shape 不変。
- Persistence / transaction / audit impact: read-only list。schema / TX / rollback書込み変更なし。
- Operator workflow / Japanese UI wording: 65 §65.8.1 に確定文言と 4 status 表示を記載。
- Error, empty, retry, and recovery behavior: 未対応 literal は既存どおり BIZ validation、IO direct は空 page。filter-empty reset 既存契約不変。
- Testability and traceability IDs: 新規 REQなし。後続 R3 tests は REQ-206 / slice 4d を引用可能。

## Contract Probe

- N/A: 外部 library / OS / hardware の未検証 premise を使わない docs-only design。

## Contract Coverage Ledger

R2 docs-only: not required。後続 PR B（R3）の Matrix / Ledger で本 PR の touched contracts を全行化する。

## Test Plan

- targeted tests: `bash scripts/doc-consistency-check.sh` を直接 log file へ保存し、exit code / RESULT を確認。
- negative tests: 指定旧文言 0 hit、`src/` / `src-tauri/` / 非対象 docs の diff 0。
- compatibility checks: `rg -F -c` で新文言と 11 節の実在を確認、`git diff --check`。
- data safety checks: tracked diff に実店舗 artifact がないことを `git status --short` で確認。
- main wiring/integration checks: docs-only のため runtime gate なし。R2 exact-HEAD は `local-ci.sh full` を PR evidence に記録する。

## Boundary / Wire Contract

- producer: future `list_inventory_records` IO/BIZ/CMD。
- consumer: future `/inventory/records` hub UI。
- wire type: `InventoryRecordQuery` / `InventoryRecordSummary`（shape 不変、literal 集合だけ拡張）。
- internal type: DB source status -> normalized `active / canceled / in_progress`。
- precision/range: page / per_page 既存契約不変。item_count は i64、UI の進行中表示だけ `-`。
- round-trip path: UI filter -> CMD -> BIZ allowlist -> IO derived table -> summary -> UI badge / table。
- invalid input: 未対応 record_type / status は BIZ validation error、IO direct call は空 page。
- compatibility: 既存 4 種の status は `active` 固定を継続し、signature / field は変更しない。

## Review Focus

- 6 種で status / date / created_at / item_count / representative_item / filter 母集団が対称に閉じているか。
- CSV `is_voided` を含める TRACE-D6 と stocktake `is_voided=0` 差異だけを数える非対称が意図どおりか。
- `corrected` 将来軸と `in_progress` 現行軸を混同していないか。
- 専用一覧 runway の Rejected / Non-scope が撤回されたように読めないか。

## Spec Contract

R2 docs-only: not required。後続 PR B は本 source docs から R3 Spec Contract を作成する。

## Trace Matrix

R2 docs-only: not required（Design Intent Trace を参照）。

## Data Safety

R2 docs-only: runtime / store data 非接触。実 CSV、DB、JAN、価格、log、backup を commit しない。

## Implementation Results

docs-only Design Phase。runtime 実装は後続 PR B（R3）。

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none。
- Plan Reviewer は current `codex-only` session では Writer と別 vendor を満たせないため pending。Draft PR は owner の明示発注による early checkpoint として open し、Plan Gate を通過したとは扱わない。
- Review-only skipped because: narrow R2 docs-only Design Phase で runtime mutation がなく、指定の機械検証と owner / external review を Draft PR 上で行うため。

2026-08-29: Final Review 完了（Sonnet 独立 fresh context、Plan Reviewer とは別 subagent）。監査対象 content commit 58c7667cfec1217e8a6ea29e739dab95f1ef0509、P1/P2 = 0、Goal Invariant 充足 = yes、P3 1 件（上記 Acceptance Criteria 注記で解消）。

2026-08-29: PR #13 squash merge 6c688fe（hosted run 33198223058 success、三点一致成立）。closeout で archive へ移動。
