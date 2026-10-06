> **親文書**: [FUNCTION_DESIGN.md](../FUNCTION_DESIGN.md)
> **入力ドキュメント**: [architecture/cmd-task-specs.md §CMD-12](../architecture/cmd-task-specs.md), [37-biz-daily-report-import-service.md](37-biz-daily-report-import-service.md)

## 45. CMD-12: 日報取込みコマンド群

### 45.1 モジュール構成

```text
src-tauri/src/
  cmd/
    daily_report_import_cmd.rs
```

CMD-12 は薄いラッパーであり、Z001/Z002/Z005のsource判定、部門照合、重複判定、日報保存判断はBIZ-08へ委譲する。

### 45.2 AppState

既存のCSV preview cacheと同じAppState内に、型を分けた日報preview cacheを追加する。

```rust
struct AppState {
    db: Mutex<Connection>,
    preview_cache: Mutex<HashMap<String, CachedPreview>>,
    daily_report_preview_cache: Mutex<HashMap<String, CachedDailyReportPreview>>,
    register_sd_scan_cache: Mutex<HashMap<String, DailyReportSdScanSnapshot>>, // CMD-12-D1
}
```

DB Mutex と cache Mutex は同時に長時間保持しない。CMD-07と同じく、cache取得/更新は短時間で分ける。

### 45.3 parse_and_validate_daily_report

**関数要求**: フロントエンドから渡された3ファイルをBIZ-08へ渡し、previewとpreview_tokenを返す。

**シグネチャ**:

```rust
#[tauri::command]
fn parse_and_validate_daily_report(
    state: State<AppState>,
    files: Vec<DailyReportSourceFileRequest>,
) -> Result<DailyReportPreviewResponse, CmdError>
```

**入力型**:

```rust
struct DailyReportSourceFileRequest {
    filename: String,
    file_bytes: Vec<u8>,
}
```

**出力型**:

```rust
struct DailyReportPreviewResponse {
    preview_data: DailyReportPreviewData,
    preview_token: String,
}
```

`DailyReportPreviewData`、`DailyReportImportResult`、`DailyReportRollbackResult`、`DailyReportImport` は [37.2](37-biz-daily-report-import-service.md#372-型定義) / `sales_repo` のDTOを所有元とする。CMD-12実装では、UIに返すDTOに `specta::Type` を付けてTauri wire型として公開する。`CachedDailyReportPreview` はAppState内部専用であり、wire型にはしない。

`DailyReportPreviewData.duplicate_check` のwire形状は `status: DailyReportDuplicateStatus` と `same_date_imports: Vec<SameDateDailyReportImportSummary>` で固定する。summaryは `id / source_filenames / gross_amount / net_amount / imported_at` を持ち、順序は `imported_at DESC, id DESC`。hashと単一parent fieldは公開しない。

**処理ステップ**:
1. `files.len()` が3以外なら `CmdError.kind="validation"`。
2. 各ファイルが20MBを超える場合は `CmdError.kind="validation"`。
3. DB接続を取得する。
4. BIZ-08 `parse_and_validate_daily_report` を呼ぶ。
5. 成功時、UUID preview_tokenを生成し `daily_report_preview_cache` に保存する。
6. preview responseを返す。

### 45.4 commit_daily_report_import

**シグネチャ**:

```rust
#[tauri::command]
fn commit_daily_report_import(
    state: State<AppState>,
    preview_token: String,
    additional_import_confirmed: bool,
) -> Result<DailyReportImportResult, CmdError>
```

**処理ステップ**:
1. preview_tokenのUUID形式を検証する。
2. `daily_report_preview_cache` からcached previewを取得する。
3. cache miss / 期限切れは `CmdError.kind="import_error"`。
4. DB接続を取得する。
5. `additional_import_confirmed` をBIZ-08 `commit_daily_report_import` へ渡す。Rust wire名はこのsnake_case、TypeScript生成名は `additionalImportConfirmed` とする。
6. 成功時、cacheからtokenを削除する。
7. 通常の失敗時はcacheを残して再試行可能にする。ただしBIZが `同日の取込み状況が変わりました。再度プレビューしてください` を返した場合はtokenを削除し、新しいpreview/tokenを要求する。

### 45.5 rollback_daily_report_import

```rust
#[tauri::command]
fn rollback_daily_report_import(
    state: State<AppState>,
    daily_report_import_id: i64,
) -> Result<DailyReportRollbackResult, CmdError>
```

BIZ-08 `rollback_daily_report_import` を呼ぶ。指定IDだけを取消し、同日の他importは残す。成功時の frontend query invalidation は [D-052](../decision-log.md) C10 と `src/lib/invalidation-contract.ts` を正本とする。sale_records / inventory_movements / products は変わらない。

### 45.6 list_daily_report_imports

```rust
#[tauri::command]
fn list_daily_report_imports(
    state: State<AppState>,
    page: i64,
    per_page: i64,
    date_from: Option<String>,
    date_to: Option<String>,
) -> Result<PaginatedResult<DailyReportImport>, CmdError>
```

**入力ガード**:
- page < 1 → `CmdError.kind="validation"`
- per_page < 1 → `CmdError.kind="validation"`
- per_page > 100 → `CmdError.kind="validation"`

status filter は第1スライスでは公開しない。BIZ-08のquery型には内部拡張用に `status` を残し、CMD-12からは `None` を渡す。

### 45.6a scan_register_sd（CMD-12-D1、D-111）

**関数要求**: レジの SD を BIZ-08 §37.9 で読み、候補の一覧と scan_token を返す。

```rust
#[tauri::command]
fn scan_register_sd(
    state: State<AppState>,
    selected_path: Option<String>, // None = 自動で探す。Some = 利用者が folder の選択で選んだ path
) -> Result<RegisterSdScanResponse, CmdError>

struct RegisterSdScanResponse {
    scan: DailyReportSdScan, // 37 §37.9
    scan_token: String,
}
```

**処理ステップ**:
1. `selected_path` を `RegisterSdSelection`（`None` → `Auto`、`Some` → `Selected(PathBuf)`）にする。空文字は `CmdError.kind="validation"`。
2. DB接続を取得し、BIZ-08 `scan_register_sd_daily_reports(conn, selection, PC の今日の日付)` を呼ぶ。SD を読む間（窓の範囲の小さな file と照合。利用者は 1 人）は DB の Mutex を持ったままでよい。
3. 成功時、UUID の scan_token を作り、`register_sd_scan_cache` を空にしてから snapshot を入れる（同時に持つ scan は最新の 1 つだけ）。
4. response を返す。

### 45.6b parse_and_validate_daily_report_from_sd（CMD-12-D1）

```rust
#[tauri::command]
fn parse_and_validate_daily_report_from_sd(
    state: State<AppState>,
    scan_token: String,
    candidate_key: String,
) -> Result<DailyReportPreviewResponse, CmdError>
```

**処理ステップ**:
1. scan_token の UUID 形式を検証する。
2. `register_sd_scan_cache` から snapshot を取得する。miss または作成から 30 分超は `CmdError.kind="import_error"`、message `SD を読んでから時間がたちました。もう一度 SD を読んでください。`。
3. `files_by_candidate[candidate_key]` が無ければ `CmdError.kind="validation"`（取り込めない候補）。
4. 以降は §45.3 の手順 3〜6 と同じ（BIZ-08 `parse_and_validate_daily_report` に 3 本を渡し、preview_token を返す）。snapshot は消さない（同じ scan から別の候補を続けて取り込める）。

**CMD-12-D1**: CMD は scan の snapshot を AppState に置いて渡すだけで、SD の探し方・候補の規則・状態の判定を持たない（BIZ-08-D3）。CMD は IO-09 を直接呼ばない（ARCHITECTURE のレイヤー間の呼び出し原則、`src-tauri/tests/architecture_test.rs`）。snapshot を AppState に置くのは、SD を読み終えたらすぐレジへ戻せるようにするため（SD-18）。棄却案: scan の結果の bytes を UI へ返して UI から §45.3 を呼ぶ（取り込まない Z004 等は持たないが、日報だけでも wire に生バイトを往復させ、UI が束を組める余地を作る）、preview のたびに SD を読み直す（SD を差したままにする必要がある）。

### 45.7 CmdError変換

| BIZ-08 error | CmdError.kind | message |
|---|---|---|
| ImportError(msg) | import_error | msgをそのまま使用 |
| IdempotencyConflict(msg) | idempotency_conflict | msgをそのまま使用 |
| ValidationFailed(msg) | validation | msgをそのまま使用 |
| NotFound(msg) | not_found | msgをそのまま使用 |
| DatabaseError(_) | internal | データベースエラーが発生しました。もう一度お試しください |

### 45.8 生成bindings

SPEC-SDI-D3を実装する同一commitでは `#[specta::specta]` と `specta::Type` deriveを維持し、`DailyReportDuplicateStatus` / `DailyReportDuplicateCheck` / `SameDateDailyReportImportSummary` / commit引数を含む `src/lib/bindings.ts` をgeneratorで再生成する。生成物の手編集は禁止する。D-111 の runtime では `scan_register_sd` / `parse_and_validate_daily_report_from_sd` を `lib.rs` の specta `collect_commands` に登録し、`DailyReportSdScan` / `DailyReportSdCandidate` / `DailyReportSdCandidateStatus` / `RegisterSdScanResponse` を含めて再生成する。既存の command と DTO の wire は変えない（`settlement_no` は内部の cache と DB だけで、wire に出さない）。

対象:
- `parse_and_validate_daily_report`
- `commit_daily_report_import`
- `rollback_daily_report_import`
- `list_daily_report_imports`

### 更新履歴

| 日付 | PR | 内容 |
|---|---|---|
| 2026-08-16 | PR #79 | SPEC-SDI-D3/D4: same-date summary DTO、`additional_import_confirmed`、snapshot mismatch時のtoken破棄、per-import rollback、bindings再生成義務を正本化。 |
| 2026-10-06 | sd-direct-read（design、D-111） | CMD-12-D1: `scan_register_sd` と `parse_and_validate_daily_report_from_sd`、AppState の scan cache。 |
