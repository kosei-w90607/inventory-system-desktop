# Test Design Matrix: Z001 / Z002 / Z005 の取り込み情報を画面で見られるようにする

対象 packet: [2026-09-27-daily-report-z-display](../2026-09-27-daily-report-z-display.md)。改訂前の基準版は `e7c22f8f`（main）。本 lane は設計文書だけの変更で、T 行（本 lane の検査、`rg` / `git diff` / doc-consistency-check の oracle）を持つ。R 行は後続 runtime lane が使う test の設計で、runtime lane の Plan Packet がこの行を起点に自分の Matrix を作る（本 lane では実行しない）。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-DRZ-D1 / UI-09a-D16 画面: 置き場所（metric の下、2 表の上、`official_daily_report` がある日だけ）・列（名称 / 個数/件数 / 金額）・見出し「日計（Z001）」・行の順（`sort_order`）・0 の行を出す・「—」の意味・ラベルを言い換えない
- SPEC-DRZ-D2 複数取込み: 取込みごとの表を古い順、「N回目の取込み（取込み日時 YYYY-MM-DD HH:mm）」の見出し、1 回の日は見出しなし、合算しない、2 回以上の日の文
- SPEC-DRZ-D3 既存表示の不変: metric・支払集計・部門別集計の合算、未取込みの note、warning、UI-09a-D12 / D15、見出しの出どころ（Z002 / Z005）
- SPEC-DRZ-D4 BIZ-05 の返り値: `summary_imports`、件数 = `source_import_count`、`line_key` を返さない
- SPEC-DRZ-D5 IO の読み出し: 1 query、親 `imported_at ASC, id ASC`・行 `sort_order ASC, id ASC`、`rolled_back` を読まない、合算しない、行の無い親を残す
- SPEC-DRZ-D6 command: `get_daily_sales` の名前・引数不変、bindings の再生成
- SPEC-DRZ-D7 / D-096 決定の記録

## Failure Modes

- F1 Z001 の総売・純売以外の行が、正本の上でも画面に出る経路を持たない（AC1 / AC2 が落ちる）。
- F2 正本の答えが 2 つになる: 56 の既存の `N回の取込みを合算` の文や D15 の「加算済み」が D16 と食い違う。24 §14.24 の「additive read」が Z001 にも掛かって読める。
- F3 rename 済みの旧 symbol の義務が 24 に残る。
- F4 実店舗の値・ラベル・CSV 本文が tracked file に入る（29 §29.4.1・packet の Contract Probe）。
- F5 runtime の file に触れる、または traceability が生成と食い違う。
- F6（runtime）同日 2 回の取込みの Z001 を合算する、最新 1 回だけ出す、取込みの並びが逆になる。
- F7（runtime）`rolled_back` の親の Z001 行が出る、取消後の再取得で消えない。
- F8（runtime）行の順が `sort_order` と違う、0 の行を隠す、NULL を 0 や「未取得」と出す、`quantity` と `count` を取り違える。
- F9（runtime）未取込みの日に日計の見出しや空の表が出る。行の無い取込みで取込み自体が落ち、`summary_imports` の件数が `source_import_count` と食い違う。
- F10（runtime）既存の metric・支払集計・部門別集計の合算や warning が変わる、1 回の日の `N回の取込みを合算` の文が変わる。
- F11（runtime）bindings を再生成せず、型に `summary_imports` が無いまま UI が別の場所から値を作る。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。helper 名だけで実 router / integration と分類しない。
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。状態 reset なら初回 mount に加え同値再選択等の別経路を確認し、対象契約が行使されるものを選ぶ。

本 lane（T 行、本 lane の AC）:

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1 / D2 / D3 | F1・F2 | CLI | T1（AC1）: `rg -n 'UI-09a-D16' docs/function-design/56-ui-daily-sales.md` | 出力なし（D16 が無い） |
| D4 / D5 | F1 | CLI | T2（AC2）: `rg -n 'summary_imports' docs/function-design/34-biz-sales-service.md docs/function-design/24-io-csv-import-repo.md docs/function-design/56-ui-daily-sales.md` | 3 file のどれかに 1 件も無い |
| D5 | F3 | CLI | T3（AC3）: `rg -c 'get_latest_completed_daily_report' docs/function-design/24-io-csv-import-repo.md` | 出力がある（exit 0） |
| D7 | F1 | CLI | T4（AC4）: `rg -c '^## D-096' docs/decision-log.md` | `1` でない |
| D3 | F2・F10 | review | T5（AC5）: `git diff e7c22f8f -- docs/function-design/56-ui-daily-sales.md` の `-` 行 | UI-09a-D12 / D13 の行、§56.13 の印刷の行が削除行に含まれる |
| D6 | F5 | CLI | T6（AC6）: `git diff --name-only e7c22f8f -- src src-tauri tests` | 出力がある |
| Data Safety | F4 | review | T7（AC7）: packet の Contract Probe と 29 §29.4.1 の追記を読む | 実値・実ラベル・金額・CSV 本文がある |
| S7 | F1 | CLI | T8（AC8）: `rg -n 'plans/2026-09-27-daily-report-z-display' docs/backlog.md` | 出力なし |
| 全体 | F2・F5 | CLI | T9（AC9）: `bash scripts/doc-consistency-check.sh` と `--target plan` | exit 0 でない |
| 全体 | F5 | CLI | T10（AC10）: `git diff --quiet e7c22f8f -- docs/function-design/90-traceability.md` | exit 1（REQ の参照を増減せずに生成物がずれた、または再生成が要るのに無い） |
| D2 / D3 | F2 | review | T11: 56 の REQ-401 第2スライス表示詳細の `N回の取込みを合算` の行、UI-09a-D15、D16 と、24 §14.21 手順 6・§14.24 の D-071 の行を並べて読む | 2 回以上の日の文、Z001 を合算するか、`rolled_back` を読むかのどれかで答えが 2 つになる |
| D5 / D4 | F2 | CLI | T12（AC11）: `rg -c 'Option<OfficialDailyReportSummary>, DbError' docs/function-design/24-io-csv-import-repo.md` と `rg -c 'get_completed_daily_report_aggregate\(conn, date\) → Option<OfficialDailyReportSummary>' docs/function-design/34-biz-sales-service.md` | どちらかに出力がある（IO が BIZ の型を返すと読める） |
| D6 | F11 | CLI | T13（AC12）: `rg -c 'import_internal_contract_test' docs/plans/test-matrices/2026-09-27-daily-report-z-display.md` | 出力なし（Rust の wire 契約 test の更新義務が申し送りから落ちる） |

後続 runtime lane（R 行、runtime lane で実装・実行する）:

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D5 | F6・F8 | unit（repo、実 SQLite） | R1: 同日 2 親（`imported_at` を逆順に INSERT、各親に Z001 3 行を `sort_order` 逆順で INSERT）の aggregate | 親が `imported_at ASC, id ASC` でない、行が `sort_order ASC, id ASC` でない、行が合算される |
| D5 | F6 | unit（repo） | R2: 同日 2 親で `imported_at` が同値、id が違う | 同値のとき id の昇順にならない |
| D5 | F7 | unit（repo） | R3: 3 親のうち 1 親を `rolled_back` にした後の aggregate（既存 `test_completed_daily_report_aggregate_after_per_import_rollback_req501` に Z001 の assert を足す） | 取り消した親の Z001 行が出る、残りの親の行が欠ける |
| D5 / D4 | F9 | unit（repo） | R4: Z001 行の無い completed 親（DB へ直接 INSERT）を含む日 | その親が `summary_imports` から落ちる、件数が `source_import_count` と違う |
| D5 | F9 | unit（repo） | R5: 親が 0 件の日 | `Ok(None)` でない |
| D5 | F8 | unit（repo） | R6: `quantity` だけの行・`count` だけの行・`amount` NULL の行・値 0 の行 | NULL が 0 になる、0 の行が落ちる、`quantity` と `count` が入れ替わる |
| D4 | F6・F11 | unit（BIZ） | R7: `get_daily_sales` が 2 親の日に `summary_imports` を 2 件、repo と同じ順・同じ値で返す（既存 `test_get_daily_sales_includes_official_report_req501` の隣） | map で並びが変わる、`imported_at` / id が落ちる、`line_key` が DTO に出る |
| D6 / D4 | F11 | CLI + integration（Rust） | R8: bindings drift 検査（L1）と、`src-tauri/tests/import_internal_contract_test.rs` の `test_wire_contract_req401_i_w1_i_w2_i_w3_i_w5_generated_binding_is_atomic`（`:222-232`、`OfficialDailyReportSummary` の field 列の完全一致）を `summary_imports` を足した 8 field へ更新 | `src/lib/bindings.ts` に `summary_imports` / `OfficialDailySummaryImport` / `OfficialDailySummaryLine` が無い、生成と差分がある。field 列が 8 field と一致しない、または既存の禁止事項（単一 parent ID を返さない、旧取込み契約の語を bindings に残さない）の assert が消える |
| D1 | F8 | unit（UI、`DailySalesPage.test.tsx`） | R9: 1 取込みの日。Z001 に 0 の行と NULL の欄を含む 4 行 | 見出し「日計（Z001）」が無い、行の順が返された順と違う、0 の行が無い、NULL が「—」でない（「未取得」や 0 になる）、ラベルが言い換えられる、数に単位の文字が付く |
| D1 | F9 | unit（UI） | R10: 未取込みの日（`official_daily_report: null`、既存 `test_daily_sales_page_no_official_note_req501`） | 「日計（Z001）」の見出しや表が出る |
| D2 | F6 | unit（UI） | R11: 2 取込みの日 | 取込みごとの表が 2 つでない、「1回目の取込み（取込み日時 …）」「2回目の取込み（取込み日時 …）」が返された順でない、日時が `YYYY-MM-DD HH:mm` でない、合算した表が出る、2 回以上の日の文が出ない |
| D2 | F10 | unit（UI） | R12: 1 取込みの日（`source_import_count: 1` の既存 `test_daily_sales_page_official_warnings_note_req501` の拡張か新規 test。`summary_imports` 1 件を持たせる） | 取込みごとの見出しが出る、`1回の取込みを合算` の文が変わる |
| D1 | F9 | unit（UI） | R13: `lines` が空の取込み | 「この取込みの日計（Z001）の行はありません。」が出ない、取込みの見出しごと落ちる |
| D3 | F10 | unit（UI） | R14: 既存 `test_daily_sales_page_req501_shows_source_import_count_without_cross_series_sum`（`source_import_count: 2`）の 3 つの完全一致の assert（`2回の取込みを合算`・`支払集計`・`部門別集計`）を、D16 の 2 回以上の日の文と「支払集計（Z002）」「部門別集計（Z005）」へ更新する（意図した変更）。同じ test の金額・「未取得」・series 分離（`¥14,000` が無い）の assert と、warnings・未取込みの test は変えずに PASS（mock に `summary_imports` を足すだけ） | 既存の metric・合算・warning の表示が変わる、見出しに出どころが無い、2 回以上の日の文が出ない |
| D1 / D2 / D3 | F10 | L3（Windows native、manual） | R15: 実機 before / after（DPI 125% / 150%、合成 fixture の 1 回分と 2 回分） | owner が表の長さ・「—」と 0 の行・合算と取込みごとの違い・Z002 の見出しの語を読み取れない、「N回目の取込み」を精算の回数と読み違える |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 日次売上の日計（Z001） | 未取込みの日: note のみ、日計なし（R10） | 既存の Skeleton のまま（変更なし） | 1 回: 表 1 つ（R9 / R12）。2 回: 取込みごとの表（R11） | 取込み・取消の後、既存の `invalidationContract.dailyReportImport()` のまま（変更なし） | 取消後の再取得で残りの取込みだけ（R3 を repo で、UI は返り値を描くだけ） | 前日 / 日付入力で過去日を開くと同じ規則（query key は日付、変更なし） | DB から読むだけで state を持たない | 取得失敗は既存の上部 Alert と再試行（変更なし、既存 `shows describeError output on query error…`） | 同左 | R1〜R15 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `OfficialDailyReportSummary` の型の消費者 | `rg -n 'official_daily_report' src --glob '!src/lib/bindings.ts'`: `DailySalesPage.tsx`、`DailySalesPage.test.tsx`（非 null の object 2 か所、`:82` `:153`）、null だけの mock 5 file（`BackupRestorePage.flow.test.tsx` / `SummaryCardsBar.test.tsx` / `HomePage.test.tsx` / `useHomeSummary.test.tsx` / `SummaryCards.test.tsx`） | runtime lane: `DailySalesPage.tsx` と `DailySalesPage.test.tsx` の非 null object 2 か所（`source_import_count: 2` の test は文と見出しの 3 つの assert も更新、R14） | null だけの mock は型が変わっても通るため直さない | R14、`npm run typecheck` |
| wire の field 列を固定する Rust の契約 test | `rg -n 'OfficialDailyReportSummary' src-tauri/tests`: `import_internal_contract_test.rs:222-232`（`typescript_type_fields` で field 列を完全一致） | runtime lane: 期待列に `summary_imports` を足して 8 field へ | 禁止事項（単一 parent ID を返さない、旧取込み契約の語を残さない）の assert は保つ | R8 |
| 公式セクションの表（`OfficialLinesTable`） | `DailySalesPage.tsx` の支払集計・部門別集計 | runtime lane: 日計の表を同じ 3 列・右寄せの形で作る（部品を共有するかは runtime lane の実装判断） | 列見出し・単位の文字は Z001 だけ D16 に従う（既存 2 表の「N 件」「N 点」は変えない） | R9 / R14 |
| repo の aggregate の親の読み出し | `sales_repo.rs::get_completed_daily_report_aggregate`（親は `imported_at DESC, id DESC`）、payment / department の join query | runtime lane: Z001 の join query を足す | 既存の親の並び（DESC）は支払・部門の代表の選び方に影響しないが、Z001 は ASC で返すため親の並びを流用しない | R1 / R2 |
| 日時の表示 | `src/features/inventory-records/types.ts::formatDateTime`（`T` を空白にするだけで秒を残す） | runtime lane: 日計の見出しは秒を落とす（D16） | `formatDateTime` をそのまま使うと秒が出るため、使う場合は秒を落とす形で足すか別に整形する（runtime lane の判断） | R11 |

## Negative Paths

- missing input: 未取込みの日（R5 / R10）。
- invalid input: 日付の形式不正は既存の `ValidationFailed` のまま（変更なし）。
- duplicate/ambiguous input: 同日 2 取込み（R1 / R11）、`imported_at` 同値（R2）。
- unknown reference: 該当なし（読み出しだけ）。
- dependency missing: Z001 行の無い親（R4 / R13）。
- permission/write failure: 該当なし（書込みなし）。
- dry-run side effect: 該当なし。

## Boundary Checks

- threshold: 取込み 1 件と 2 件の境（R11 / R12）。
- null/default: `quantity` / `count` / `amount` の NULL は「—」（R6 / R9）。
- empty/non-empty: `summary_imports` 0 件は `official_daily_report` が None の日だけ（R5）。`lines` 空（R4 / R13）。
- min/max: 値 0 の行を出す（R6 / R9）。
- status/policy enum: `status='rolled_back'` の除外（R3）。
- wire type: `summary_imports: OfficialDailySummaryImport[]`（R8）。
- internal type: `sales_repo::OfficialDailyReportRow` に同じ形の行（R1）。
- producer/consumer: BIZ `get_daily_sales` → `useDailySalesReport`（当日と前日）/ `useHomeSummary`（`official_daily_report` を使わない）。
- round-trip token: 該当なし。
- precision/range: 数は i64。店の日計の値は `Number.MAX_SAFE_INTEGER` に届かない想定で、既存の支払・部門の金額と同じ扱い（変更なし）。
- cross-language parse: `imported_at` は文字列のまま渡し、UI で整形するだけ。

## Compatibility Checks

- old schema/input: schema 不変。既存の取込み済みの日も `daily_report_summary_lines` を持つため、そのまま表示される。
- new schema/input: 該当なし。
- output order: R1 / R2 / R9 / R11。
- optional field behavior: 追加 field だけで既存 field は不変。

## Data Safety Checks

- source-derived data: packet の Contract Probe と 29 §29.4.1 は行数の範囲・欄の種類・帳票仕様の頁だけを書く（T7）。
- generated outputs: bindings は runtime lane で再生成（R8）。
- secrets: なし。
- local-only files: repo 外の匿名化要約・帳票仕様 PDF は読むだけで commit しない。
- synthetic sample boundaries: runtime lane の fixture は合成（CP932、Z001 は総売・純売以外の行を含める）。

## Main Wiring / Integration Checks

- helper connected to main path: repo の Z001 読み出しが `get_completed_daily_report_aggregate` の中にあり、BIZ の map が `summary_imports` へ写す（R7）。
- output reaches manifest/report: 画面の公式セクションに届く（R9 / R11）。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value: R9 / R11 は mock の `lines` の label と値を text で照合するため、UI が別の値を作れば落ちる。
- If invalidate/refetch changes the value before versus after the operation: R3（repo の取消後）。UI の invalidation は既存のまま。
- If a key branch is inverted: `summary_imports.length >= 2` の分岐を反転すると R11 / R12 が落ちる。
- If a threshold comparison changes: 同上。
- If a guard is removed: `status='completed'` の条件を外すと R3 が落ちる。
- If an output field is omitted: `imported_at` を落とすと R7 / R11 が落ちる。
- If tracked Workflow State stores the current PR HEAD: 該当なし（本 lane は Plan Commit を pending のまま Coordinator へ返す）。
- If output order changes: R1 / R2 / R9 / R11。
- If dry-run performs a side effect: 該当なし。
- If a JSON number crosses JavaScript safe integer range: 既存の支払・部門と同じ扱いで本 lane では新しい検査を足さない（Residual）。
- If a state token is round-tripped through browser/client code: 該当なし。

## Residual Test Gaps

- 実物の同日 2 回精算の Z001 / Z002 で行の集合と並びが同じかは未確認（backlog の「実物の同日 2 回精算の Z001 / Z002 の確認」）。D-096 で Z001 は合算しないため、本 lane と runtime lane の正しさはこれに依らない。
- Z002 の見出しの語が行の中身に合うかは、行の名前を照合していないため runtime lane の L3 で owner が決める（R15）。
- 既存の支払集計（Z002）は、1 取込みの中でも `code=01` / `現金` や `code=03` / `クレジット` に当たる行が 2 行以上あると同じ `payment_key` で 1 行に合算される。本 lane・runtime lane の Scope 外で、実ラベルでの発生は backlog の確認項目で数だけ確かめる。
- i64 の値が JS の安全な整数を超える場合は既存の支払・部門と同じく扱わない。
