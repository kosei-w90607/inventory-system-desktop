> **親文書**: [FUNCTION_DESIGN.md](../FUNCTION_DESIGN.md)
> **入力ドキュメント**: [ARCHITECTURE.md](../ARCHITECTURE.md), [architecture/biz-task-specs.md §BIZ-08](../architecture/biz-task-specs.md), [DB_DESIGN.md](../DB_DESIGN.md), [db-design/pos-tables.md §12b-12e/B-2](../db-design/pos-tables.md), [29-io-daily-report-parser.md](29-io-daily-report-parser.md)

## 37. BIZ-08: 日報取込みロジック

### 37.1 目的

`daily_report_import_service` は、Z001/Z002/Z005 の日報bundleを `Parse -> Validate -> Preview -> Commit` で取り込むBIZ層サービスである。

入力の束は、レジの SD から読んだ候補（§37.9、標準の経路。D-111）か、利用者が選んだ 3 ファイル（UI-07-D16）。どちらも同じ §37.3〜§37.4 を通る。

日報取込みは、日報サマリ・支払集計・部門別売上の正本を作る。商品別売上や在庫引落しは作らない。Z004商品別CSV取込みはBIZ-03の責務として残す。

### 37.2 型定義

```rust
struct DailyReportPreviewData {
    file_info: DailyReportFileInfo,
    totals: DailyReportTotals,
    payment_summary: Vec<DailyReportPaymentLinePreview>,
    department_summary: Vec<DailyReportDepartmentLinePreview>,
    warnings: Vec<DailyReportWarning>,
    duplicate_check: DailyReportDuplicateCheck,
    preview_created_at: String,
}

struct DailyReportFileInfo {
    report_date: String,
    bundle_hash: String,
    source_files: Vec<DailyReportSourceFileInfo>,
}

struct DailyReportSourceFileInfo {
    source: DailyReportSourceKind, // IO-07で定義
    filename: String,
    file_hash: String,
    size_bytes: usize,
}

struct DailyReportTotals {
    gross_amount: Option<i64>,
    net_amount: Option<i64>,
}

struct DailyReportPaymentLinePreview {
    payment_key: String,
    label: String,
    amount: Option<i64>,
    count: Option<i64>,
    sort_order: i64,
}

struct DailyReportDepartmentLinePreview {
    department_id: Option<i64>,
    raw_department_name: String,
    normalized_department_name: Option<String>,
    amount: i64,
    quantity: Option<f64>, // 単位の数（1.3 等）。IO-07 の quantity_hundredths を quantity_hundredths_to_units で戻した値
    count: Option<i64>,
    sort_order: i64,
}

struct DailyReportWarning {
    code: String,
    message: String,
    source_file: Option<DailyReportSourceKind>,
    line_no: Option<i64>,
}

enum DailyReportDuplicateStatus {
    NoDuplicate,
    AlreadyImported,
    AdditionalImportConfirmationRequired,
}

struct DailyReportDuplicateCheck {
    status: DailyReportDuplicateStatus,
    same_date_imports: Vec<SameDateDailyReportImportSummary>,
}

struct SameDateDailyReportImportSummary {
    id: i64,
    source_filenames: Vec<String>,
    gross_amount: Option<i64>,
    net_amount: Option<i64>,
    imported_at: String,
}

struct DailyReportImportResult {
    daily_report_import_id: i64,
    status: String, // "completed"
    report_date: String,
    gross_amount: Option<i64>,
    net_amount: Option<i64>,
    warning_count: i64,
}

struct DailyReportParseValidateResult {
    preview_data: DailyReportPreviewData,
    cached_preview: CachedDailyReportPreview,
}

struct DailyReportInputFile {
    filename: String,
    bytes: Vec<u8>,
    sd_relative_path: Option<String>, // SD の file だけ Some（IO-09 の relative_path）。写しの保存（BIZ-08-D5）と精算回数の検査（BIZ-08-D6）に使う
    source_path: Option<PathBuf>,     // 手でファイルを選ぶ経路の dialog の path（UI-07-D16、CMD-12 §45.3）。§37.3 手順 1a で SD 上かを確かめる。SD の候補から作る入力は None
}

struct CachedDailyReportPreview {
    created_at: Instant,
    preview_data: DailyReportPreviewData,
    settlement_no: Option<i64>, // IO-07-D5。commit で保存し、TX 内の再検査に使う（BIZ-08-D4）。SD の経路では Some だけ（BIZ-08-D6）
    sd_source_files: Vec<SdSourceFileForCopy>, // `sd_relative_path` が Some の file（SD の候補の 3 本と、手で選んだ SD 上の file〈§37.3 手順 1a〉）。PC 上の file は入れない。commit で写しを書く（BIZ-08-D5）
    active_same_date_import_ids: Vec<i64>,
    summary_lines: Vec<CachedDailyReportSummaryLine>,
    payment_lines: Vec<DailyReportPaymentLinePreview>,
    department_lines: Vec<CachedDailyReportDepartmentLine>,
}

struct SdSourceFileForCopy {
    source: DailyReportSourceKind,
    sd_relative_path: String,
    bytes: Vec<u8>,
}

struct CachedDailyReportSummaryLine {
    line_key: String,
    label: String,
    amount: Option<i64>,
    quantity_hundredths: Option<i64>,
    count: Option<i64>,
    sort_order: i64,
}

struct CachedDailyReportDepartmentLine {
    department_id: Option<i64>,
    raw_department_name: String,
    normalized_department_name: Option<String>,
    amount: i64,
    quantity_hundredths: Option<i64>,
    count: Option<i64>,
    sort_order: i64,
}

struct DailyReportRollbackResult {
    daily_report_import_id: i64,
    status: String, // "rolled_back"
    rolled_back_at: Option<String>,
}

struct ListDailyReportImportsQuery {
    page: i64,
    per_page: i64,
    date_from: Option<String>,
    date_to: Option<String>,
    status: Option<String>,
}

struct DailyReportImport {
    id: i64,
    report_date: String,
    source_adapter: String,
    bundle_hash: String,
    gross_amount: Option<i64>,
    net_amount: Option<i64>,
    status: String,
    imported_at: String,
    rolled_back_at: Option<String>,
    source_files_json: String,
}
```

`DailyReportSourceKind` と `DailyReportSourceFile` は IO-07（§29.2）を所有元とする。CMD-12 はこの節のDTOを `specta::Type` 付きwire contractとして実装する。

個数は commit まで 100 倍の整数（`quantity_hundredths`、IO-07-D2）で運び、wire DTO（`DailyReportDepartmentLinePreview.quantity`）だけを単位の数にする。commit は `CachedDailyReportPreview` の 100 倍の整数をそのまま保存し、wire の `f64` から戻さない（往復の丸めを作らない）。`DailyReportDepartmentLinePreview.quantity` の TypeScript の型は `number | null` のまま変わらない（specta は `i64` も `f64` も `number` にする）。

### 37.3 parse_and_validate_daily_report

**関数要求**: 日報bundleをparse/validateし、commit前のpreviewを返す。

**シグネチャ**:

```rust
fn parse_and_validate_daily_report(
    conn: &DbConnection,
    files: Vec<DailyReportInputFile>,
) -> Result<DailyReportParseValidateResult, BizError>

// 内部関数。手順 1a で root の列を取る処理を引数で受ける。公開の関数は IO-09 `find_register_sd_roots` を渡してこれを呼ぶ。
// test は一時 directory の root を返す closure か、失敗を返す closure を渡す（root を取る処理の失敗を注入できる）
fn parse_and_validate_daily_report_with_sd_lookup(
    conn: &DbConnection,
    files: Vec<DailyReportInputFile>,
    find_sd_roots: impl FnOnce() -> Result<Vec<RegisterSdRoot>, RegisterSdError>,
) -> Result<DailyReportParseValidateResult, BizError>
```

**処理ステップ**:

1. ファイルサイズ上限を検証する。
1a. 手で選んだ file の出所を決める（D-111、UI-07-D16）。判定は preview のこの手順の 1 回だけで、commit では確かめ直さない（commit は cache の bytes と `sd_relative_path` を使い、SD を読まない）。`source_path` が `None` の file（SD の候補から作る入力。`sd_relative_path` はすでに `Some`）は確かめない。`sd_relative_path` が `None` で `source_path` が `Some` の file が 1 本でもあれば:
   - (i) `find_sd_roots` を 1 回呼ぶ（公開の関数では IO-09 `find_register_sd_roots`）。失敗は、SD 上かを確かめられないので `BizError::ImportError("選んだファイルがレジの SD の上にあるかを確かめられませんでした。もう一度選んでください。")` で止める（PC の file として通さない）。
   - (ii) 各 file を IO-09 `locate_in_register_sd_roots(roots, source_path)`（29 §29.7.4 手順 4）で確かめる。`Some` ならその `relative_path` を `sd_relative_path` に入れ、以降はその file を SD の file として扱う（写し BIZ-08-D5、精算回数の検査 BIZ-08-D6）。
   - (iii) `None` の file は、IO-09 `check_selected_file_present(source_path)`（29 §29.7.4 手順 5）でその時点で在り通常の file かを確かめる。`Ok` なら今どおり PC 上の file（`EcrDatas` の写し等）。`Err` なら `BizError::ImportError("選んだファイルが見つからなくなりました。SD から選んだときは、SD をこの PC に差したまま、もう一度選んでください。")` で止める。理由: SD の上の file を選んで読んだ後、この手順の前に SD を抜くと、(i) の root の列が空になって (ii) が `None` を返す。そのまま PC 上の file にすると、写し（BIZ-08-D5）と精算回数の検査（BIZ-08-D6）が黙って外れるため。
2. IO-07 `parse_daily_report_bundle(files)` を呼ぶ。
3. `parse_errors` がある場合は `BizError::ImportError` として返す。
   - **BIZ-08-D1**: 各errorの `source_file` / `filename` / `line_no` / `error_type` / `error_message` を開発者向けdiagnostic WARNへ構造化して記録する。filenameはunknown sourceを含む入力識別用で、diagnostic専用とする。
   - 利用者向けerror messageと `operation_logs.summary` は汎用文言を維持し、raw parse detailをwireまたは `operation_logs.detail_json` へ載せない。
   - **BIZ-08-D2**: ただし `parse_errors` に `settlement_mismatch`（IO-07-D3）が 1 件でもあれば、利用者向けの message と `operation_logs.summary` を次の文にする（他の error が同時にあってもこの文を優先する。選び直せば直る失敗で、汎用文では利用者が同じ 3 ファイルを選び直してしまう）: `別の精算の日報ファイルが混ざっています。ファイル名の「Z001」「Z002」「Z005」より後ろが同じ 3 つを選び直してください。` 文は error_type だけから作り、ファイル名・精算回数・行番号などの raw detail を含めない（BIZ-08-D1 は維持）。日付の不一致だけ（`invalid_date`）の文は変えない（3 本とも精算回数を読める束〈通常の layout A〉では、同じ日に 2 回以上精算した日の混在は精算回数で止まり、別の日の混在も精算回数が違えばこの文になる。読めないファイルの出所は確かめない〈TD-110・TD-111 の受容リスク、IO-07-D3〉）。
   - 返却前に `operation_logs.operation_type='daily_report_parse_failed'` を best-effort で記録する。
4. `report_date` を検証する。
   - IO-07はCV17出力上の `YYYY/M/D` / `YYYY-MM-DD` を `YYYY-MM-DD` へ正規化する。BIZ-08では正規化後の日付がYYYY-MM-DD形式でない、暦日として不正、3 sourceで不一致ならエラー。
   - 同じ精算の 3 ファイルか（精算回数の一致）は IO-07 が判定し（IO-07-D3）、手順 3 の `settlement_mismatch` で止まる。束の精算回数は IO-07 が返し（IO-07-D5）、BIZ-08 は `CachedDailyReportPreview.settlement_no` に持って commit で `daily_report_imports.settlement_no` に保存する（§37.4 手順 6。`None` は NULL）。保存した値は BIZ-08-D4 の照合に使う。
   - **BIZ-08-D6**（SD の経路は精算回数のある束だけ）: 入力の 1 本でも `sd_relative_path` が `Some`（SD の経路）で、`settlement_no` が `None`（3 本のどれかで精算回数が読めない。値がそろわない束は手順 3 で止まっている）なら `BizError::ImportError` で止める。文は固定で `この精算の日報は、SD のファイルから精算回数を確かめられないため、SD からは取り込めません。`（raw detail を含めない。BIZ-08-D1）。`operation_logs.operation_type='daily_report_parse_failed'` を best-effort で記録する。手で選んだ束（3 本とも `sd_relative_path` が `None`）は今どおり `None` でも取り込める（D-111 の Guarantee range）。
5. bundle_hashを作る。
   - source順（Z001→Z002→Z005）に `source:file_hash:size` を連結してSHA-256化する。
6. 必須サマリを検証する。
   - adapterが `gross_sales` と `net_sales` の両方を導出できない場合はcommit不可。
7. Z005部門名を `departments.name` と照合する。
   - 一致した行は `department_id` を付与する。
   - 一致しない行はwarningにし、`source_file=Z005`、`department_id=None` のままpreview可能にする。IO line側へ重複したsource fieldは要求しない（IO-07-D1）。
8. 冪等性と同日追加判定を行う。
   - `bundle_hash` が同じ `completed` importあり → AlreadyImported。
   - **BIZ-08-D4**: `settlement_no`（IO-07-D5）が `Some` で、`report_date` と `settlement_no` が同じで `bundle_hash` が違う `completed` importあり（IO の `find_same_settlement_daily_report_import`、[24](24-io-csv-import-repo.md) §14.18a）→ `BizError::ImportError` で止める（追加確認で通さない）。文は固定で `同じ精算の日報が、別のファイルからすでに取り込まれています。二重に数えないため、取り込みません。取り込み直すときは、前の取込みを取り消してから読み直してください。`（raw detail を含めない。BIZ-08-D1）。`operation_logs.operation_type='daily_report_parse_failed'` を best-effort で記録する。`settlement_no` が `None` の束（layout B を含む）と、`settlement_no` が NULL の既存 import（D-111 より前の取込み）は照合しない。
   - `report_date` が同じ別 `completed` importあり → AdditionalImportConfirmationRequired。
   - それ以外 → NoDuplicate。
   - 同日active importは `imported_at DESC, id DESC` で全件取得し、`same_date_imports` に写像する。`source_files_json` はBIZで安全に解析して `source_filenames` を取り出し、欠損・破損時はfilenameを捏造せずparse failureとして安全側に止める。hashはwireへ返さない。
   - 同じ順序の全IDを `CachedDailyReportPreview.active_same_date_import_ids` に保持する。
9. `DailyReportParseValidateResult` を返す。
   - `preview_data` はUI表示用のwire DTO。
   - `cached_preview` はcommit用に、summary/payment/department明細の正規化済みsnapshotを保持する。

### 37.4 commit_daily_report_import

**関数要求**: preview済み日報bundleを確定保存する。

**シグネチャ**:

```rust
fn commit_daily_report_import(
    conn: &mut DbConnection,
    cached_preview: CachedDailyReportPreview,
    additional_import_confirmed: bool,
    app_data_dir: &Path, // 写しの置き場所（BIZ-08-D5、IO-10）
) -> Result<DailyReportImportResult, BizError>
```

**処理ステップ**:

1. previewの有効期限を確認する。30分超は `BizError::ImportError`。
2. cached duplicate status と確認flagの組合せを検証する。
   - AlreadyImported → `BizError::IdempotencyConflict`。
   - NoDuplicate は `additional_import_confirmed=false`、AdditionalImportConfirmationRequired は `true` のみ許可し、不一致は `BizError::ValidationFailed`。
2a. **BIZ-08-D6** の再検査: `sd_source_files` が空でない（SD の経路）のに `settlement_no` が `None` なら、写しを書かず DB を変えずに §37.3 手順 4 と同じ文の `BizError::ImportError` を返す（preview を経ずに作られた cache でも通さない。DB の状態に依らない検査なので、写しを書く手順 2b と TX の前に置く）。
2b. **BIZ-08-D5**: `sd_source_files` が空でなければ、TX の前に 3 本の写しを IO-10 `save_pos_source_copy(app_data_dir, sd_relative_path, bytes)` で書く（[29 §29.8](29-io-daily-report-parser.md#298-io-10-sd-から読んだ原本の写しの保存d-111)）。1 本でも失敗したら DB を変えずに `BizError::SourceCopyFailed(std::io::ErrorKind)` を返す（BIZ-08 が `BizError`〈`src-tauri/src/biz/mod.rs:54`〉に足す variant。wire に出さない。CMD-12 は 45 §45.7 で `CmdError` の kind `internal`・固定の文 `SD から読んだファイルの写しを PC に保存できなかったため、取り込みませんでした。PC の空き容量を確かめて、もう一度取り込んでください。` に変える。`import_error` にしないのは、UI が `import_error` を最初へ戻す扱い〈`useDailyReportImportFlow.ts:35` の `decideRecoverTo`〉にしているため。preview token は CMD の cache に残り〈45 §45.4 手順 7〉、UI は preview に戻って同じ token で再試行できる〈55 の日報取込みの利用者フローの手順 2〉。診断 WARN に io error の種類を記録）。書けた写しの相対 path を手順 6 の `source_files_json` に入れる。
3. トランザクション開始。
4. TX内で `bundle_hash` のactive一致を最初に再検査する。一致があれば `BizError::IdempotencyConflict` として副作用なしで止める。
4a. TX内で BIZ-08-D4 の照合（同じ `report_date`・同じ `settlement_no`・別 `bundle_hash` の `completed`、24 §14.18a `find_same_settlement_daily_report_import`）を再検査する。`settlement_no` が `None` なら照合しない。一致があれば副作用なしで §37.3 手順 8 と同じ文の `BizError::ImportError` を返す。
5. TX内で同一report_dateのactive import IDを `imported_at DESC, id DESC` で再取得し、cached snapshotと完全一致することを確認する。不一致なら副作用なしで止め、`BizError::ImportError("同日の取込み状況が変わりました。再度プレビューしてください")` を返す。
6. 既存importを変更せず、`daily_report_imports` にINSERTする（`settlement_no` を含む。`None` は NULL。24 §14.14 の `NewDailyReportImport.settlement_no`）。`source_files_json` の各要素に、SD の file（`sd_relative_path` が `Some`。SD の候補からの束と、手で選んだ SD 上の file〈§37.3 手順 1a〉の両方）なら `sd_relative_path` と `copy_path`（IO-10 の app_data_dir からの相対 path）を足す（PC 上の file は持たない。読む側〈`parse.rs` の `source_filenames`〉は `filename` だけを読み、無い field を許す）。`source_files_json` は BIZ-08 の内部の serialize 用の型（`source`・`filename`・`file_hash`・`size_bytes` と、省略可の `sd_relative_path`・`copy_path`。既存の 4 つの key の名前と値の形は変えない）で書き、wire 型 `DailyReportSourceFileInfo`（`specta::Type`、`src/lib/bindings.ts:558`）に field を足さない（今の `commit.rs:83-85` は wire 型の列をそのまま serialize しているので、runtime の lane で内部の型に替える。§45.8 の wire を変えない契約と同じ）。
7. `daily_report_summary_lines` にZ001由来行をINSERTする。
8. `daily_report_payment_lines` にZ002由来行をINSERTする。
9. `daily_report_department_lines` にZ005由来行をINSERTする。
10. COMMIT。
11. `operation_logs` に `daily_report_import` を記録する。
12. operation log 記録に失敗した場合は取込み自体をROLLBACKせず、診断ログまたは後続確認対象として扱う。
13. `DailyReportImportResult` を返す。

commitはinsert-onlyであり、既存の同日parentや配下明細を無効化しない。通常のcommit失敗は同じpreview tokenで再試行できるが、active snapshot不一致は新しいpreviewとtokenを必須とする。

### 37.5 rollback_daily_report_import

**関数要求**: 指定した日報取込みIDだけを論理取消する。同一report_dateの他のcompleted importは残す。

**シグネチャ**:

```rust
fn rollback_daily_report_import(
    conn: &mut DbConnection,
    daily_report_import_id: i64,
) -> Result<DailyReportRollbackResult, BizError>
```

**処理ステップ**:

1. `daily_report_imports.id` で対象を取得する。
2. 存在しない場合は `BizError::NotFound`。
3. すでに `rolled_back` の場合は冪等成功として返す。
4. トランザクション開始。
5. `status='rolled_back'`, `rolled_back_at=now` に更新する。
6. COMMIT。
7. `operation_logs` に `daily_report_rollback` を記録する。
8. operation log 記録に失敗した場合はrollback済み状態を戻さず、診断ログまたは後続確認対象として扱う。

**重要**: 更新条件は指定IDだけとし、同日の他importは変更しない。rollbackしても `sale_records`、`inventory_movements`、`products.stock_quantity` は変更しない。日報取込みは在庫変動を作らないため、補正対象が存在しない。operation logには対象IDを必ず記録する。

### 37.6 list_daily_report_imports

**関数要求**: 日報取込み履歴をページング取得する。

**シグネチャ**:

```rust
fn list_daily_report_imports(
    conn: &DbConnection,
    query: ListDailyReportImportsQuery,
) -> Result<PaginatedResult<DailyReportImport>, BizError>
```

**検索条件**:
- page / per_page
- date_from / date_to（任意）
- status（任意。既定は全状態）

履歴はimport単位の行を維持し、日付単位にcollapseしない。順序は `report_date DESC, imported_at DESC, id DESC` とする。

**入力ガード**:
- page < 1 → `BizError::ValidationFailed`
- per_page < 1 → `BizError::ValidationFailed`
- per_page > 100 → `BizError::ValidationFailed`

### 37.7 エラー表示に渡す意味

| 条件 | BizError | UI案内 |
|---|---|---|
| Z001/Z002/Z005欠損 | ImportError | 必要な3ファイルを選び直す |
| CP932 decode失敗 | ImportError | PCツールから出力した元ファイルを確認する |
| report_date不一致 | ImportError | 同じ営業日の3ファイルを選ぶ |
| 精算回数不一致（`settlement_mismatch`） | ImportError（BIZ-08-D2 の文） | ファイル名の「Z001」「Z002」「Z005」より後ろが同じ 3 つを選び直す |
| 同一bundle取込み済み | IdempotencyConflict | 取込み済みのため二重取込みしない |
| 同じ精算（同じ対象日・同じ精算回数）を別の bytes で取込み済み（BIZ-08-D4） | ImportError（固定の文） | 二重に数えない。取り込み直すなら前の取込みを取り消してから |
| 手で選んだ file が SD 上かを確かめられない（§37.3 手順 1a (i)） | ImportError（固定の文） | もう一度選ぶ |
| 手で選んだ file が preview の時に見つからない（SD を抜いた等、§37.3 手順 1a (iii)） | ImportError（固定の文） | SD を差したまま、もう一度選ぶ |
| 写しを PC に保存できない（BIZ-08-D5） | SourceCopyFailed（CMD で `internal`・固定の文、45 §45.7） | preview に戻り、同じ token でもう一度取り込む |
| SD の束で精算回数を確かめられない（BIZ-08-D6） | ImportError（固定の文） | SD からは取り込まない（一覧では「読めません」） |
| SD が見つからない・2 つ以上・`XZ` が無い・読めない（BIZ-08-D3） | ImportError（固定の文、§37.9） | SD を差し直す・売上の SD だけを差す・場所を選ぶ |
| 同日別bundleで追加確認なし / 不要なのに確認あり | ValidationFailed | previewの状態に従って追加確認をやり直す |
| 同日active snapshot変更 | ImportError | 同日の取込み状況が変わったため再度previewする |
| 部門未対応 | warning | 取込み可能。部門マスタ対応は後続で確認 |

### 37.8 非目的

- Z004商品別売上のparse/commit/rollback。
- 在庫引落し。
- 商品別ランキングの生成。
- Excel帳票のparse。
- ECR+や他レジ形式の直接取込み。
- (a) の段階（本書の SD 直読み）での SD への書込み（CV17 と同じく `XZ_BKUP` へ移すこと。owner 決定 2026-10-06 でこの段階では SD は動かさない、IO-09-D3。移す操作は D-111 (1) の (b) の後続の lane）。
- 写しの保持期間・削除と、PC の外への backup（D-111 の未決 A・B）。
- `Z006`（グループ）、`Z009`（時間帯別）、`Z011`（担当者）の保存・集計。個人店の初期運用では使わない前提とし、必要性が確認された場合は後続設計で追加する。

### 37.9 scan_register_sd_daily_reports（SD から読む候補、BIZ-08-D3）

**関数要求**: レジの SD（IO-09、[29 §29.7](29-io-daily-report-parser.md#297-io-09-レジの-sd-の列挙と読取りd-111)）から Z001 / Z002 / Z005 を読み、精算ごとの束を取込みの候補として、取込み済みかの状態つきで返す。読んだ bytes は返り値の snapshot に持ち、preview はその snapshot から作る（SD を読み終えたら抜いてよい。SD-18）。窓の中の Z004 も読み、PLU の占有の照合のために snapshot に持つ（手順 10、D-117 (3)）。DB へは書かない。

**シグネチャ**:

```rust
fn scan_register_sd_daily_reports(
    conn: &DbConnection,
    selection: DailyReportSdSelection, // BIZ-08 の型（下）。IO-09 の型にしない
    today: NaiveDate,
) -> Result<DailyReportSdScanResult, BizError>
```

**型**:

```rust
enum DailyReportSdSelection {      // BIZ-08 が持つ。CMD-12 が作って渡す（cmd → io は LAYER_RULES で禁止のため、IO の型にしない）
    Auto,                          // 取外し可能な drive から探す（手順 1 で IO-09 find_register_sd_roots を呼ぶ）
    Selected(PathBuf),             // 利用者が folder の選択で選んだ path（手順 1 で IO-09 resolve_register_sd_root を呼ぶ）
}

struct DailyReportSdScanResult {
    scan: DailyReportSdScan,               // wire（CMD-12 が specta で公開）
    snapshot: DailyReportSdScanSnapshot,   // 内部専用。CMD-12 の scan cache に置く
}

struct DailyReportSdScan {
    volume_label: String,
    scanned_from: String,                  // YYYY-MM-DD（手順 2 の窓の始まり）
    candidates: Vec<DailyReportSdCandidate>,
    skipped_unknown_count: i64,            // 名前の規則に合わず読まなかった file の数（IO-09-D2）
}

struct DailyReportSdCandidate {
    candidate_key: String,                 // 束の識別（scan の中で一意）。手順 5 で bundle_hash を作れた束（`NotImported`・`Imported`・`SameSettlementImported` と、精算回数の無い `Unreadable`）は bundle_hash（64 桁の hex）。作れなかった束（`Incomplete` と、形・大きさ・parse で外れた `Unreadable`）は "sd:" + その組に在る最初の系列（Z001 → Z002 → Z005 の順）の file の root からの相対 path（IO-09 の `relative_path`、区切りは `\`。area の folder 名を含むので `XZ` と `XZ_BKUP` の組はぶつからない）
    path_date: String,                     // folder と名前の日付（YYYY-MM-DD）
    report_date: Option<String>,           // 中身の日付（読めた束だけ）
    source_filenames: Vec<String>,         // 3 本の file 名（Z001→Z002→Z005。そろわない束はある分）
    status: DailyReportSdCandidateStatus,
}

enum DailyReportSdCandidateStatus {
    NotImported,             // 取り込める
    Imported,                // 同じ bundle_hash の completed がある
    SameSettlementImported,  // 同じ report_date・settlement_no の別 bundle_hash の completed がある（BIZ-08-D4）
    Incomplete,              // Z001 / Z002 / Z005 の 3 本がそろわない
    Unreadable,              // 形が外れた（IO-09-D4）・大きすぎる・parse_errors がある・精算回数が読めない（BIZ-08-D6）
}

struct DailyReportSdScanSnapshot {
    created_at: Instant,
    files_by_candidate: HashMap<String, Vec<DailyReportInputFile>>, // NotImported の束だけ
    plu_register_z004s: Vec<Vec<u8>>, // 窓の中の Z004 の bytes（PLU の占有の照合へ渡す。D-117 (3)）
}
```

**処理ステップ**:

1. root を決める。`Auto` は IO-09 `find_register_sd_roots`。0 件は `BizError::ImportError("SD が見つかりません。レジの SD をこの PC に差してから、もう一度読んでください。")`、2 件以上は `BizError::ImportError("SD が 2 枚以上見つかりました。売上を読む SD だけを差してください。")`。`Selected` は IO-09 `resolve_register_sd_root`、`NotRegisterSd` は `BizError::ImportError("選んだ場所はレジの SD ではありません。SD の中の CASIO の folder か、SD そのものを選んでください。")`。`MissingSalesArea` は `BizError::ImportError("SD に売上の folder（XZ）がありません。レジの SD か確かめてください。")`。
2. 読む範囲（窓）の始まり `from` を決める: `completed` の日報取込みがあれば、その `report_date` の最大と `today` − 30 日の早い方、無ければ `today` − 30 日。30 日は店の EJ の取込みの間隔（店の回答は月 1 回）を目安にした値で、日報の取込みを 1 か月以上空けても窓は最後の取込みの日まで戻るので、日報の候補は落ちない（2026-10 の見直しの事実の一覧の訂正: CV17 の EJ の取込みのログでは遅れの最大は 31 日で 30 日を 1 日越え、32 日以上空いた間隔が 2 回あった。以前の「最大 31 日の遅れを覆う」は数として合わなかった。窓の始まりの規則は変えない）。窓より前の分は候補に出ない（過去の分はファイルを選ぶ経路、UI-07-D16）。
3. IO-09 `list_register_sd_entries(root, from)`。`Io` は `BizError::ImportError("SD を読めませんでした。SD を差し直して、もう一度読んでください。")` にし、途中までの候補を返さない（以下の手順 5 の読取りも同じ）。
4. Z001 / Z002 / Z005 の entry を (area、相対 folder、日、接尾字、連番) が同じものごとに組にする（`Z00k_` より後ろが同じ 3 本は同じ精算だった。IO-07-D3。名前は組分けにだけ使い、同じ精算かは手順 5 の中身で決める）。3 系列が 1 本ずつそろわない組は `Incomplete`（読まない）。Z004・Z006 等の系列と EJ は組にしない（Z004 の業務の取込みは BIZ-03、EJ は EJ の取込みの lane。Z004 は PLU の占有の照合のためだけに手順 10 で読む。§37.9 の末尾。写しの規則 BIZ-08-D5 もそれぞれの lane が同じ IO-10 で引き継ぐ）。`Unknown` は数えるだけ。
5. そろった組ごとに IO-09 `read_register_sd_file` で 3 本を読む（上限は CMD-12 の 1 file 20MB と同じ値）。1 本でも `TooLarge`、または形が CP932 strict・BOM 無し・CRLF だけ・最終改行ありのどれかを外れたら `Unreadable`（IO-09-D4。推測で読まない）。そろえば IO-07 `parse_daily_report_bundle` を呼び、`parse_errors` があれば `Unreadable`（BIZ-08-D1 の診断 WARN を記録。利用者向けには出さない）。無ければ §37.3 手順 5 と同じ式で `bundle_hash` を作る。
6. 同じ `bundle_hash` の組（`XZ` と `XZ_BKUP` に同じ bytes がある等）は 1 つの候補にまとめる。まとめた候補の 3 本の `sd_relative_path`（写しの path、BIZ-08-D5）と `source_filenames` は、`XZ` の組を優先し、同じ area に 2 つ以上あれば Z001 の相対 path の辞書順で最初の組のものにする。理由: `XZ` はレジが書いた原本の置き場所と名前で、`XZ_BKUP` の名前は CV17 が付けた連番つき（SD-02）。写しの path を CV17 の改名に依らせず、同じ bytes を何度読んでも同じ path にする（IO-10 の `written: false` が効く）。
7. 状態を決める: 同じ `bundle_hash` の `completed` があれば `Imported`。無く、`settlement_no` が `None` なら `Unreadable`（BIZ-08-D6。snapshot に入れない）。`Some` で同じ `report_date`・`settlement_no` の別 `bundle_hash` の `completed` があれば（24 §14.18a）`SameSettlementImported`。それ以外は `NotImported`。`rolled_back` だけの束は `NotImported`（取消の後の取り込み直しを今どおり許す）。
8. 候補を `path_date` の新しい順、同じ日は精算回数の大きい順（読めない束は後ろ、その中は相対 path の順）に並べる。
9. `NotImported` の束の 3 本の bytes を `snapshot.files_by_candidate` に入れる。
10. 窓の中の Z004（`XZ` と `XZ_BKUP`。名前の規則に合うもの）を IO-09 `read_register_sd_file` で読み（上限は手順 5 と同じ）、`Io`・`TooLarge` の file と、手順 5 と同じ形の検査（IO-09-D4）で外れた file を除いて続け、残りの bytes を `snapshot.plu_register_z004s` に入れて返す（同じ bytes は 1 つにまとめる）。行数と中身の検査は BIZ-04 が IO-02 `parse_plu_register_snapshot` で行い、`ImportError` なら照合しない（前回を保つ。33 §16.3）。Z004 の中身の解釈と選択は BIZ-04（[33 §16.3](33-biz-plu-export-service.md)）が行い、ここでは読まない。CMD-12 は scan の成功の後に BIZ-04 `refresh_plu_register_snapshot_from_sd` へ渡す（[45 §45.6a](45-cmd-daily-report-import.md)）。DB への書込みはその BIZ-04 の TX で、本関数は DB へ書かない（D-117 (3)。Z004 の業務の取込み〈BIZ-03〉とは別）。

**preview への接続**: 利用者が `NotImported` の候補を選ぶと、CMD-12 が snapshot の 3 本を §37.3 `parse_and_validate_daily_report` に渡す。preview・commit・同日追加の確認・BIZ-08-D4 は手でファイルを選んだ経路と同じで、SD の経路だけに足す規則は BIZ-08-D6（精算回数のある束だけ）と BIZ-08-D5（写し）の 2 つ。同じ scan の中で同じ精算の別の bytes の束が 2 つ `NotImported` になる場合（SD-23 の未確認の前提〈原本と取込み後の file は同じ bytes〉が外れ、CV17 の取込みも使った場合）、先に取り込んだ方の後のもう一方は §37.3 手順 8 の BIZ-08-D4 で止まる。

**BIZ-08-D3（SD の候補の規則）**:

- 決定: SD の `XZ` と `XZ_BKUP` の両方を窓の範囲で読み、精算ごとの束を中身の hash と精算回数で取込み済みと照らす。形の外れた file・そろわない束・名前の規則に合わない file は候補にしない（読まない、または読んでも取り込めない状態で示す）。
- 理由: アプリは SD を書き換えず（IO-09-D3）、CV17 の取込みを誰かが続けても精算の分は `XZ` か `XZ_BKUP` のどちらかにある。`XZ_BKUP` の file は `EcrDatas` と同じ bytes（SD-22）なので、`EcrDatas` から取り込み済みの分は hash で `Imported` になる。SD から取り込む束は 3 本とも精算回数が読めてそろう束だけなので（BIZ-08-D6）、取込み前の原本と取込み後の file が同じ bytes であることは未確認の前提（SD-23）で、前提が外れて違う bytes でも、後から来た方は同じ精算回数の照合（BIZ-08-D4）で止まる。
- 棄却案: file 名・接尾字・連番で取込み済みを決める（SD-08、IO-09-D2）、`XZ` だけを読む（CV17 の取込みを使った日の分を落とす）、窓を設けず全期間を読む（毎回全期間の Z を読む）、選んだ候補を preview の時にもう一度 SD から読む（SD を preview の間ずっと差しておく必要があり、読み終えたらレジへ戻せない）。
- 再検討: CV17 の日次の取込みを店がやめたと確かめられたとき（`XZ_BKUP` の窓を狭められる）。SD-23 の実機の前後比較（R-50、runtime の lane の L3 の前）が前提と違ったとき。

**BIZ-08-D6（SD の経路は精算回数のある束だけを取り込む）**:

- 決定: SD の経路（scan の候補と、そこから入る preview・commit）では、3 本とも精算回数が読めて値がそろう束（`settlement_no` が `Some`）だけを取り込める。`None` の束は scan で `Unreadable`、preview（§37.3 手順 4）と commit（§37.4 手順 2a）で `ImportError`（固定の文）にする。手で選んだ束の扱い（`None` も取り込める）は変えない。
- 理由: `None` の束を SD から取り込むと DB の `settlement_no` が NULL になり、後で CV17 が移した別の bytes・精算回数ありの同じ精算が、hash でも BIZ-08-D4 でも止まらず、同日追加の確認だけで二重に保存される。SD にあるのはレジの原本で CV17 の書出し（layout B）ではなく、`XZ_BKUP` の Z は全件が layout A の形だった（SD-24）ので、正規の SD の束は止まらない見込み（取込み前の `XZ` の原本も、CV17 が移して複製するだけなので `EcrDatas` の file と同じ bytes・同じ形・同じ精算回数であることは未確認の前提。29 §29.7.2 の SD-23）。
- 棄却案: `None` の束も SD から取り込み、後の照合を対象日と合計の一致で行う（同じ日の 0 円の精算などで誤る）、`None` の束を警告つきで取り込む（利用者が確認すると二重になりうる）、scan だけで止める（preview・commit に別の経路で来た cache を通す）。
- 保証の範囲: 手で選んだ `None` の束（layout B、D-111 より前の取込み）は照合されないので、同じ精算の SD の束と別の bytes なら同日追加の確認で通りうる（D-111 の Guarantee range。layout B は CV17 の明示書出しだけが作り、店は基本使わない）。
- 再検討: 実機の前後比較（packet の Contract Probe P1、runtime の lane の L3 の前）で、取込み前の `XZ` の原本が取込み後の file と違う bytes だと分かったとき（原本の精算回数が読めない・値が違う可能性があるので、L3 の前に BIZ-08-D4 と本 guard を見直す）。店の CV17 の取込みが原本の中身を書き換えると分かったときも同じ。

**BIZ-08-D5（読んだ原本の写しを PC に残す、owner 決定 2026-10-06）**:

- 決定: SD から読んで取り込む束の 3 本を、commit の TX の前にアプリのデータ folder の `pos-sources/casio-sr-s4000/sd/` の下へ SD の相対 path を保った名前で書く（IO-10）。書くのは取り込む束だけで、scan の時には書かない。写しを書けなければ取り込まない。
- 理由: (a) の段階では SD は動かさないので SD にも原本は残るが、SD は静電気等で消えることがあり、CV17 をやめると PC 側に写しが無くなる。取り込んだ精算ごとに PC 側に原本の bytes があれば、日報の行の根拠を後から確かめられる。写しの無い取込みを作らないため、写しの失敗で止める（SD は動かしていないので、直してから同じ preview かもう一度読んで取り込める）。TX が失敗して写しだけが残っても、同じ bytes の写しなので害は無く、次の commit では `written: false` になる。
- 棄却案: scan の時に読んだ全部を書く（取り込まない束・読めない file まで残る）、写しの失敗を警告にして取り込む（写しの無い取込みができ、利用者が警告を見落とすと気づけない）、commit の TX の後に書く（DB は取込み済みなのに写しが無い状態ができる）。
- 保証の範囲: 写しは D-111 の後に取り込んだ SD の file だけ（SD の候補からの束と、手で選んだ file のうち自動で見つけた SD の root の下にあるもの〈§37.3 手順 1a〉）。PC 上の file を手で選んだ束（`EcrDatas` 等、すでに PC にある file）は写さない。SD が固定 disk として見える reader では自動で root を見つけないので、その SD の file を手で選ぶと PC 上の file として扱われ、写しも BIZ-08-D6 も効かない（SD を読む経路は「場所を選ぶ」で使える。UI-07-D15）。SD の上の file を選んだ後、preview の前に SD を抜いたときは、その file が見つからないので §37.3 手順 1a (iii) で止まり、PC 上の file としては通らない。preview の後に SD を抜いても、cache の bytes と `sd_relative_path` で写しを書くので外れない。写しは DB の backup（[71](71-mnt-backup.md) の `VACUUM INTO`、DB の 1 file だけ）に入らず、restore は写しを変えない（レシート画像と同じ扱い）。restore で DB が戻ると、DB に無い取込みの写しが残ることがあるが、写しは原本の bytes で、取込みの状態は DB が正本。

**Z004 と EJ への引継ぎ**（2026-10-16 に D-118 で改めた）: Z004（BIZ-03）と EJ の取込みの lane は IO-09 の列挙と読取り、同じ窓と scan の snapshot の形を使う。取込み済みの見分けは、Z004 は file の hash と、machine_no・精算回数の照合（[32](32-biz-csv-import-service.md) の「計数の置き場と在庫の求め直しの契約」。同じ精算の別の版は取り込まず、精算回数の無い file は取り込まない）、EJ は記録の番号（IO-08 の `number_prefix` + `number`）で行い、EJ を file の hash では見分けない（`XZ` 直下の EJ は精算をまたいで伸びる。SD-09、[IO-08.10](29-io-ej-parser.md#io-0810-日次取込みとの接続io-08-d10設計の申し送り)）。D-116 の全数読取り（`pos_source_scans`・`first_scan_id`・置き場の識別子・読取りの排他）は D-118 で置き換えたので作らない。Z004・日報・EJ を SD から一度に取り込む形（repo 外の回答台帳 TD-265）と EJ の控えの閲覧（TD-264）の設計は後続の lane（[backlog](../backlog.md) の「売上の SD からの一括取込みと EJ の控えの閲覧」）が決める。

### 37.10 SD の締めの一括取込み（BIZ-08-D7・D8・D10、D-121、proposed・未実装）

本節と §37.11 は D-121 の設計で、runtime は後続の lane（[backlog](../backlog.md) の「SD の一括取込みと EJ の控えの runtime（A）」「Z004 を SD の一括取込みに入れる runtime（B）」）。§37.3〜§37.9 の D-111 の契約（SD 直読みの runtime が実装する）は書き換えない。後続の runtime が §37.9 の snapshot と CMD-12 の scan に足すものは下の「§37.9 に足すもの」に置く（SD 直読みの runtime の merge の後に足す）。

**関数要求**: 1 回の SD の読取り（§37.9 の scan）で見つけた取り込める日報の束・Z004・EJ を、利用者の 1 回の操作でまとめて取り込む（CV17 の代替、repo 外の回答台帳 TD-265）。各項目は今の取込みの関数（日報は §37.3・§37.4、Z004 は [32](32-biz-csv-import-service.md) の D-118 の新契約、EJ は §37.11）をそのまま順に呼び、項目ごとの結果を返す。

**シグネチャ**:

```rust
fn commit_register_sd_bulk_import(
    conn: &mut DbConnection,
    snapshot: &DailyReportSdScanSnapshot, // §37.9 の snapshot（下の「§37.9 に足すもの」を含む）
    app_data_dir: &Path,                  // 写しの置き場所（BIZ-08-D5、IO-10）
) -> Result<RegisterSdBulkResult, BizError>
```

**型**:

```rust
// §37.9 に足すもの（後続の runtime。SD 直読みの runtime の契約は変えず、その merge の後に足す）
// (A) §37.9 の scan は手順 10 の後に、IO-09 で EJ を読む（`XZ` 直下は全部、`XZ_BKUP` は窓の中。上限は手順 5 と同じ）。
//     形の検査（IO-09-D4）で外れた file と `Io`・`TooLarge` の file は ej_files に入れず数えるだけにし、残りで §37.11 plan_ej_records を呼ぶ
// DailyReportSdScan（wire）に足す field:
//   ej: Option<RegisterSdEjSummary>, // (A) EJ の file が 1 本も無ければ None
// DailyReportSdScanSnapshot に足す field:
//   ej_files: Vec<SdSourceFile>,    // (A) 上で読んだ形の検査を通った EJ
//   z004_files: Vec<SdSourceFile>,  // (B) 手順 10 で読んだ Z004 を相対 path つきで持つ（PLU の照合の後も残す）
struct RegisterSdEjSummary {
    new_count: i64,             // plan_ej_records の new_records の数
    conflict_count: i64,        // 同じ番号で文の違う記録の数
    unreadable_file_count: i64, // 読めなかった EJ の file の数（形・大きさ・読取り・parse の致命的エラー）
}
struct SdSourceFile {
    sd_relative_path: String, // IO-09 の RegisterSdEntry.relative_path
    bytes: Vec<u8>,
}

struct RegisterSdBulkResult {
    items: Vec<RegisterSdBulkItem>, // 処理の順（日報 → Z004 → EJ）
    ej: Option<EjImportResult>,     // §37.11。EJ の段に着かなかった（手前で止まった）・EJ の file が無いときは None
    stopped: bool,                  // Failed で止まったか
}

struct RegisterSdBulkItem {
    source: RegisterSdBulkSource,
    outcome: RegisterSdBulkOutcome,
}

enum RegisterSdBulkSource {
    DailyReport { candidate_key: String, report_date: Option<String> },
    Z004 { sd_relative_path: String },  // (B)
}

enum RegisterSdBulkOutcome {
    ImportedDailyReport(DailyReportImportResult),
    ImportedZ004(ImportResult),          // (B)。32 の新契約の知らせと要再確認の一覧を含む
    Skipped { message: String },         // 業務の検査で取り込まない。message は各 BIZ の固定の文のまま
    NeedsIndividualConfirmation,         // 日報の同日追加の確認が要る（BIZ-08-D8 の外）
    Failed { message: String },          // 確定の段の失敗。ここで止まる
    NotAttempted,                        // 止まった後の項目
}
```

**処理ステップ**:

1. 項目を並べる。(a) 日報: `snapshot.files_by_candidate` の束（§37.9 の `NotImported`）を、中身の `report_date` の昇順、同じ日は精算回数の昇順にする（SD の束は精算回数を持つ。BIZ-08-D6）。(b) Z004（runtime B）: `snapshot.z004_files` を IO-02 の精算の識別メタの精算回数の昇順（メタの読めない file は先頭に置き、手順 3 の preview で Skipped になる）。(c) EJ: `snapshot.ej_files` の全部を 1 項目。順は (a) → (b) → (c)。
2. 日報の各束: §37.3 `parse_and_validate_daily_report`（3 本を `sd_relative_path` つき・`source_path` 無しで渡す）を呼ぶ。`Err(BizError::DatabaseError)` は Failed にして止める。ほかの `Err`（`ImportError`・`IdempotencyConflict`・`ValidationFailed`）は Skipped（message は BIZ の文のまま）にして次へ進む。`Ok` で `AlreadyImported` は Skipped（`取込み済みです`）、`AdditionalImportConfirmationRequired` は NeedsIndividualConfirmation にして次へ進む。`NoDuplicate` は §37.4 `commit_daily_report_import(conn, cached_preview, false, app_data_dir)` を呼び、`Ok` は ImportedDailyReport、`Err` は Failed にして止める。
3. Z004 の各 file（runtime B）: [32](32-biz-csv-import-service.md) の `parse_and_validate`（`CsvParseAndValidateRequest { file_bytes, filename: 相対 path の最後の要素 }`）を呼ぶ。32 の新契約の表の拒否と重複の拒否は Skipped（message は表の文）。`DatabaseError` は Failed にして止める。通れば IO-10 `save_pos_source_copy(app_data_dir, sd_relative_path, bytes)` で写しを書き（BIZ-08-D5 の引継ぎ。失敗は `SourceCopyFailed` の Failed で止め、DB を変えない）、32 の確定（D-118 の新契約）を呼ぶ。`Ok` は ImportedZ004、`Err` は Failed にして止める。
4. EJ: §37.11 `import_ej_records(conn, files, app_data_dir)`（各 file を `EjSourceFile { filename, sd_relative_path: Some(..), bytes }` にする）。`Ok` は `ej` に入れる。`Err` は Failed（`source` は持たず `stopped = true`、`ej` は None）。
5. 止まったら、残りの項目を NotAttempted にして返す。`Err` を返すのは snapshot の形の内部の誤りだけで、項目の失敗は `Ok` の中の outcome で返す。
6. 各項目の操作ログは呼んだ関数が今どおり書く（日報の `daily_report_import`、Z004 の取込みのログ、EJ の `ej_import`）。一括の操作そのもののログは足さない。

**BIZ-08-D7（締めの一括取込みの順・TX・失敗）**:

- 決定: 項目ごとに今の関数の TX で確定し、全体を 1 つの TX にしない。順は日報 → Z004 → EJ、それぞれの中は精算の順（古い方から）。業務の検査で取り込めない項目（拒否・取込み済み・同日追加の確認が要る）は飛ばして続け、確定の段の失敗（DB の失敗・写しの失敗・TX の中の再検査で状況が変わった）で止める。止まる前に確定した項目は残る。
- 理由: 日報・Z004・EJ は互いに依らない記録で、どれも今の関数が 1 項目 1 TX で確定し、項目ごとに取り消せる（日報は D-071 の per-import の取消、Z004 は D-118 の SPEC-STK-CNT-D7、EJ は取り消すものが無い）。全体を 1 TX にすると、写し（TX の前に書く、BIZ-08-D5）と Z004 の求め直しを 1 つの TX へ組み直すことになり、1 項目の拒否でその日の全部が入らない。飛ばして続けるのは、拒否が次の読取りでも同じに起きる種類（同じ精算の別の版、レジの番号が合わない、日付と番号の順が合わない）で、止めると以後の項目と EJ が毎回入らなくなるため。確定の段の失敗で止めるのは、同じ原因（容量不足・DB）で続く項目も失敗するため。古い精算から入れるのは、Z004 の欠けの知らせと順の検査（32 の新契約の表の 5）が、取り込み済みの精算との比べで決まるため（新しい方から入れると、入れ終わるまで欠けの知らせが途中で出る）。
- 棄却案: 全体を 1 TX にする（上の理由）。どの失敗でも続ける（容量不足で全項目が同じに失敗し、結果が長くなるだけ）。業務の拒否でも止める（拒否される項目が 1 つ残ると、以後の項目と EJ が毎回入らない）。同じ精算の日報と Z004 を名前で組にして並べる（Z004 の精算回数は日報と別に進み〈backlog の実測と POS 系列の対応の入力 3〉、Z004 と日報の名前の組は確かめていない）。
- 保証の範囲: 確定した項目は、それぞれの今の取込みと同じ記録・同じ取消の経路を持つ。項目の中の途中の状態は残らない（各関数の TX）。TX の前に書いた写しが残っても、同じ bytes の写しで害は無い（次は `written: false`）。やり直しは、同じ scan（30 分以内、CMD-12 の scan cache）か SD の読み直しで同じ操作をする。確定済みの項目は日報が `AlreadyImported`、Z004 が同じ hash の拒否、EJ が記録の番号で、飛ばすか数えるだけになる。TX の中の再検査で拒まれた項目は、読み直すと一覧で取り込めない状態に出る。
- 再検討: 同じ精算の日報と Z004 を 1 つの単位で扱う要件が出たとき。1 回の締めで項目が多くなり、1 項目ずつの確定が遅いと分かったとき。

**BIZ-08-D8（日報の同日追加の確認を精算回数の照合で置き換える）**:

- 決定: §37.3 手順 8 の「`report_date` が同じ別 completed import あり → AdditionalImportConfirmationRequired」を次に置き換える。この束の `settlement_no` が `Some` で、同じ `report_date` の active な completed import（手順 8 の同日の全件）が全て `settlement_no` を持つなら `NoDuplicate`（追加の確認なし）。値の等しいものは同じ手順 8 の BIZ-08-D4 で先に止まっている。それ以外（この束の `settlement_no` が `None`、または同じ日に `settlement_no` が NULL の import が 1 件でもある）は今どおり `AdditionalImportConfirmationRequired`。SD の経路と手で選んだ経路で同じ規則（値の有無で決め、経路で分けない）。`same_date_imports`・`active_same_date_import_ids` と §37.4 手順 5 の TX の中の同日の再検査は変えない（preview の後に同じ日の取込みが増えたら止まる）。
- 理由: D-071 の確認は、bytes の違う同じ内容の file（復旧用の書出し等）の二重の計上を利用者が見つけるための残りの守りだった。精算回数がそろう束どうしなら、同じ精算の別の bytes は BIZ-08-D4 が拒み、精算回数の違う束は別の精算である（Z001 / Z002 / Z005 の精算回数は一緒に進み〈D-104〉、日計明細の精算票の題の末尾と 1 対 1 で、使い始めの後は重複が無い〈backlog の実測と POS 系列の対応の入力 1・3・5〉）。確認を残すと、締めの後に売ってもう一度精算した日（店で月に数回、repo 外の回答台帳 TD-279）に、一括取込みが毎回止まる。Z004 の側は D-118 が同じ形に置き換えた。
- 棄却案: 確認を全部残す（上の理由）。確認を全部外す（`settlement_no` が NULL の取込み〈D-111 より前・layout B〉とは別の精算かを決められない）。精算回数の大小で順を検査する（日報は在庫に効かず、順の食い違いを拒む理由が無い。レジの初期化は BIZ-08-D4 と Z004 の側の検査が拾う）。
- 保証の範囲: 精算回数が戻り、同じ日に同じ回数の別の精算が起きた場合は BIZ-08-D4 が拒む（安全側）。別の日に同じ回数が出ても、別の精算として入る（正しい）。`settlement_no` が NULL の取込みが同じ日にある間は確認が残る。
- 後続の runtime が直す所: §37.3 手順 8、pos-tables §12b の「冪等性・同日追加方針」の 2 行目、[55](55-ui-csv-import.md) UI-07-D13（日報の側は状態が `AdditionalImportConfirmationRequired` のときだけ）、`src-tauri/src/biz/daily_report_import_service/parse.rs:159` の分岐、`tests.rs:275`・`:481`・`:536` の期待（精算回数のそろう束どうしなら `NoDuplicate`。起票時に `rg -n 'AdditionalImportConfirmationRequired' src-tauri/src/biz/daily_report_import_service` で数え直す）。wire の enum `DailyReportDuplicateStatus` は変えない。
- 再検討: 精算回数を読めない日報が SD に現れたとき。日報の精算回数の重複が観測されたとき。

**BIZ-08-D10（CV17 の取込みとの併存と、`XZ_BKUP` へ移す lane を妨げない約束）**:

- 決定: `XZ_BKUP` へ移すアプリの操作（D-111 (1) の (b)）ができるまで店は CV17 の取込みを続ける（D-111 の運用の制約）。その間、同じ精算を CV17 とアプリの両方が読む前提で、次の表のとおり二重に数えない。一括取込みは SD に書かない（IO-09-D3 のまま）。

| 資料 | CV17 が先に移した後に読む（今の順） | アプリが先に読み、後で CV17 が移す | 守り |
|---|---|---|---|
| 日報 | `XZ_BKUP` の束を読む。前日までに入れた分は同じ hash で `Imported` | 次の読取りで `XZ_BKUP` の同じ束が同じ hash で `Imported` | hash と BIZ-08-D4（SD-23 が外れて bytes が違っても精算回数で止まる） |
| Z004（runtime B） | 同じ | 同じ | hash と 32 の新契約の表の 4（同じ machine_no・精算回数の別の hash を拒む） |
| EJ | 月末までは `XZ` 直下の伸びる file、月末の CV17 の取込みの後は `XZ_BKUP` の file を読む | 同じ記録が `XZ` と `XZ_BKUP` の両方に出る | 記録の番号（§37.11）。file の hash・名前では見分けない |

- (b) の lane への約束: 取込み済みかは中身（日報の束の hash と各 file の hash〈`source_files_json`〉、Z004 の hash、EJ の記録の番号）で決め、SD の上の名前・置き場所に依らないので、(b) が file を移しても見分けは変わらない。(b) は、移す file が取込み済みかをこの記録で決められる（EJ の file は、その file の全ての記録の番号が保存済みのときだけ移す）。EJ の取込み（§37.11）が入る前に (b) を入れるなら、EJ の file は移さない（移すと CV17 と違い、アプリが控えを持たないまま `XZ` から消える）。
- 理由: CV17 の取込みの有無・順でアプリの結果が変わらないようにする。D-111 の運用の制約と (b) の lane の設計（`_nnnn` の改名・途中の失敗）を本 lane で先取りしない。
- 保証の範囲: アプリが先に読み、CV17 の取込みで原本の bytes が変わった場合（SD-23 の前提が外れた場合）も、日報・Z004 は精算回数で止まり、EJ は記録の文が違えば保存済みを上書きせず知らせる（§37.11 の conflict）。

### 37.11 EJ の記録の取込みと閲覧（BIZ-08-D9、D-121、proposed・未実装）

**関数要求**: EJ の file（SD の `XZ` 直下・`XZ_BKUP`、または利用者が選んだ file）を IO-08 `parse_ej` で記録に分け、まだ保存していない記録の文を `ej_records`（[pos-tables](../db-design/pos-tables.md) の「SD の一括取込みと EJ の控えの契約」）に保存する。保存した記録を日付と記録の番号で引き、レシートの控えとして見せる（UI-09c、[SCREEN_DESIGN](../SCREEN_DESIGN.md) の「レシートの控え画面」）。EJ は在庫に使わない（ADR SPEC-STK-CNT-D11）。

**シグネチャ**:

```rust
fn import_ej_records(
    conn: &mut DbConnection,
    files: Vec<EjSourceFile>,
    app_data_dir: &Path,
) -> Result<EjImportResult, BizError>

fn plan_ej_records(conn: &DbConnection, files: &[EjSourceFile]) -> Result<EjImportPlan, BizError> // DB へ書かない。scan の数え（「新しい控え N 件」）と import の手順 1〜3

fn list_ej_records(conn: &DbConnection, date: Option<String>) -> Result<EjRecordDay, BizError>

fn find_ej_records_by_no(conn: &DbConnection, record_no: String) -> Result<Vec<EjRecordRef>, BizError>

fn get_ej_record(conn: &DbConnection, id: i64) -> Result<EjRecordDetail, BizError>
```

**型**:

```rust
struct EjSourceFile {
    filename: String,                 // 表示用（file 名だけ）
    sd_relative_path: Option<String>, // SD から読んだ file だけ Some（写しを書く）
    bytes: Vec<u8>,
}

struct EjImportPlan {
    new_records: Vec<NewEjRecord>,    // まだ保存していない記録（24 の insert の入力）
    files_with_new: Vec<usize>,       // new_records を 1 つ以上持つ file の添字（写しを書く file）
    already_count: i64,               // 同じ番号・同じ文で保存済み
    conflict_count: i64,              // 同じ番号で文の違う記録（保存しない）
    unreadable_files: Vec<String>,    // 形の検査か parse の致命的エラーで読まなかった file の名前
}

struct EjImportResult {
    inserted_count: i64,
    already_count: i64,
    conflict_count: i64,
    unreadable_files: Vec<String>,
    gaps: Vec<EjNumberGap>,           // 保存の後の欠け（手順 7）
}

struct EjNumberGap {
    machine_prefix: String, // 4 桁の欄
    from_no: String,        // 6 桁（先頭 0 を保つ）
    to_no: String,          // 6 桁。from_no と同じなら 1 つの番号
}

struct EjRecordSummary {
    id: i64,
    machine_prefix: String,
    record_no: String,          // 6 桁
    printed_at: String,         // `YYYY-MM-DD HH:MM`（記録のまま）
    kind: String,               // ej_records.kind の code
    mode: String,               // ej_records.mode の code
    total_amount: Option<i64>,  // 円。復元できた取引だけ（手順 2）
}

struct EjRecordDay {
    date: Option<String>,       // 見せる日（YYYY-MM-DD）。記録が 1 件も無ければ None
    prev_date: Option<String>,  // 記録のある前の日
    next_date: Option<String>,  // 記録のある次の日
    records: Vec<EjRecordSummary>, // 記録の番号の順
    truncated: bool,            // 1 日 1000 件を超えた（先頭 1000 件だけを返した）
    gaps: Vec<EjNumberGap>,     // 全期間の欠け
}

struct EjRecordRef { id: i64, date: String }

struct EjRecordDetail {
    summary: EjRecordSummary,
    body_text: String,          // 見出し 2 行と本文の行（decode したまま、行末の空白を保つ）を "\n" でつないだもの
}
```

**処理ステップ（`plan_ej_records`・`import_ej_records`）**:

1. 各 file の形を確かめる: CP932 strict・BOM 無し・CRLF だけ・最終改行あり（IO-09-D4 と同じ。SD の file は IO-09 の `RegisterSdShape`、手で選んだ file は同じ検査を bytes に当てる）。外れた file は `unreadable_files` に入れ、読まない（途中で切れた file の最後の記録を保存しない）。IO-08 `parse_ej` の `Err`（`Empty`・`DecodeFailed`・`NoRecords`）も `unreadable_files` に入れ、BIZ-08-D1 と同じく診断 WARN に code だけを記録する。
2. 各記録（`EjParseResult.records`。先頭断片は記録に入らないので保存しない）を `NewEjRecord` にする: `machine_prefix` = `number_prefix`、`record_no` = `number`、`printed_at`、`mode`・`kind`（`EjMode`・`EjRecordKind` を pos-tables の code にする。精算票は `settlement_report`・`settlement_completed` も）、`body_text`（`EjRecordDetail.body_text` と同じ作り方）、`total_amount` = 種類が `Sale` で `Restored` のときだけ、`items` の金額の和 + `adjustments` の金額の和（IO-08-D6c の照合の金額と同じ値。照合が合わない記録は `Restored` にならない）。安全な整数の範囲（絶対値 2^53 − 1 以下）を外れたら NULL。それ以外の記録（復元できない取引と、取引以外の全ての種類）は NULL。復元できない記録も文は保存する（控えを見るのに明細の復元は要らない。小数の数量の取引もこれに当たる）。
3. 番号（`machine_prefix`, `record_no`）で比べる: 同じ呼出しの中で同じ番号が複数の file に出たとき（`XZ` と `XZ_BKUP`）、`body_text` が同じなら 1 つにし、違えば conflict に数えてどちらも保存しない。保存済み（24 §14.25 `find_ej_record_texts`）と比べ、無ければ `new_records`、同じ文なら `already_count`、違う文なら `conflict_count`（保存済みを上書きしない）。conflict は診断 WARN に番号だけを記録する（文を載せない）。
4. （`import_ej_records` だけ）`files_with_new` の file のうち `sd_relative_path` が `Some` のものを、IO-10 `save_pos_source_copy` で TX の前に書く。1 本でも失敗したら DB を変えずに `BizError::SourceCopyFailed` を返す（BIZ-08-D5 と同じ）。手で選んだ file は写さない。
5. TX を始め、手順 3 の DB との比べを TX の中でやり直し（plan の後に別の取込みが入った場合）、まだ無い記録を 24 §14.25 `insert_ej_record` で入れる。COMMIT。
6. 操作ログ `ej_import` を best-effort で書く（件数だけ。番号・文・file 名を載せない）。
7. 欠けを 24 §14.25 `list_ej_number_gaps` で求めて返す。

**処理ステップ（閲覧）**:

- `list_ej_records`: `date` が `None` なら記録のある最も新しい日（無ければ `date: None`・空の一覧）。`Some` は `YYYY-MM-DD` の暦日でなければ `BizError::ValidationFailed("日付の形が正しくありません")`。その日（`printed_at` の先頭 10 文字）の記録を記録の番号の順に最大 1000 件返し、超えたら `truncated = true`。`prev_date`・`next_date` は記録のある隣の日。`gaps` は手順 7 と同じ。
- `find_ej_records_by_no`: 1〜6 桁の ASCII 数字でなければ `BizError::ValidationFailed("記録の番号は 6 桁までの数字で入れてください")`。先頭を 0 で埋めて 6 桁にし、同じ番号の記録を全ての 4 桁の欄から返す（レジが 1 台なら 0 件か 1 件）。
- `get_ej_record`: 無ければ `BizError::NotFound`。

**BIZ-08-D9（EJ の記録の取込みと閲覧）**:

- 決定: EJ は記録の番号（4 桁の欄 + 6 桁の番号）を鍵に、記録の文（見出しと本文の行）をそのまま保存し、レシートの控えとして見せる。明細の復元の結果は保存せず、取引の合計だけを一覧の手がかりに持つ。同じ番号で文の違う記録は保存済みを上書きせず知らせる。欠けは番号の連続で決め、区間で知らせる。EJ を在庫・売上の集計・Z004 との照合に使わない。
- 理由: 店が見たいのはレシートの控え（repo 外の回答台帳 TD-162・TD-264）で、明細の復元が要るのは在庫に使うときだけだった。文を保存すれば、復元できない形（小数の数量、未知の行）の取引も控えとして見える。番号は記録ごとに +1 で、file と精算をまたいで戻らず（IO-08 の構造所見）、`XZ` 直下の file は伸び同じ記録が `XZ` と `XZ_BKUP` に入りうるので、file の hash では見分けられない（IO-08.10）。EJ を在庫に使わないのは、D-118（ADR SPEC-STK-CNT-D11、owner の決定 TD-265 の Q2 = A＋B）で在庫を記録の窓と精算の並びで決めることにしたからで、EJ は商品コードを持たず、名称だけでは PLU の販売と部門キーの販売を分けられない（backlog の実測と POS 系列の対応の入力 4 の (d)）。
- 棄却案: 明細（名称・数量・金額）を表に分けて保存する（控えを見るだけなら文で足り、復元できない取引が見えなくなる）。EJ の file を丸ごと DB に入れて見るときに parse する（伸びる file の同じ記録が重複し、番号で引けない）。同じ番号の新しい文で上書きする（レジの記録は変わらないはずで、違いは読み違いか異常の印。上書きすると前の控えが消える）。欠けを file の有無・名前の日付で決める（精算の後の販売は次の精算の file に入る。IO-08.10）。
- 保証の範囲: 保存するのは形の検査を通った file の、見出しのある記録だけ。先頭断片（最初の file の見出しの形に当たらない記録）は保存しない。欠けの知らせは保存した番号の最小から最大の間だけで、アプリを使い始める前の記録は欠けに数えない。窓（§37.9 手順 2）より前の `XZ_BKUP` の file は読まないので、アプリを 30 日より長く使わなかった後は欠けとして出る（手で file を選んで埋める。UI-09c）。同じ番号の記録が別の 4 桁の欄（別のレジ）にあれば別の記録として持つ。
- 再検討: レジの設定で記録の番号が精算ごとに戻るようになったとき（鍵に日付か精算を足す）。控えを金額・商品名で探す要望が出たとき（repo 外の回答台帳の問い。UI-09c の Open Questions）。レジの機種が変わるとき（IO-08 を取り替え、`ej_records` の鍵を見直す）。

### 更新履歴

| 日付 | PR | 内容 |
|---|---|---|
| 2026-08-16 | PR #79 | SPEC-SDI-D1〜D8: AlreadyImportedを維持しつつ同日別bundleを追加取込みとし、全件summary、TX内snapshot再検証、insert-only commit、per-import rollbackを正本化。 |
| 2026-10-04 | daily-report-import-gaps（plan-first） | BIZ-08-D2: 精算回数の不一致の文。個数を 100 倍の整数で運ぶ cache の型（`CachedDailyReportDepartmentLine`）と wire の `quantity: Option<f64>`（IO-07-D2〜D4、D-104）。 |
| 2026-10-06 | sd-direct-read（design、D-111） | BIZ-08-D3: SD から読む候補（§37.9）。BIZ-08-D4: 同じ精算を別の bytes で取り込まない照合と `settlement_no` の保存。BIZ-08-D5: 読んだ原本の写しを commit の前に PC に残す。 |
| 2026-10-07 | sd-direct-read（Final Review の P3 の是正） | `DailyReportSdCandidate.candidate_key` の bundle_hash を作れない束の値を、組に在る最初の系列（Z001 → Z002 → Z005）の相対 path に固定した。 |
| 2026-10-07 | sd-direct-read（Plan Review round 3 の後の同型指摘の一括是正） | §37.3 手順 1a に SD を抜いた後の file の在否の確認（(iii)）と、root を取る処理を受ける内部関数 `_with_sd_lookup`。写しの失敗を `BizError::SourceCopyFailed` にして UI が preview に戻れる形にした。§37.8 と D5 の「動かさない」を (a) の段階に限った。 |
| 2026-10-07 | sd-direct-read（Plan Review round 2 の是正） | 選択の enum を BIZ-08 の `DailyReportSdSelection` にした（cmd → io の禁止）。手で選んだ SD 上の file を SD の入力にする §37.3 手順 1a。BIZ-08-D4 の照合の repository 関数（24 §14.18a）。§37.4 の手順を 2a（D6）・2b（D5）の順に直した。`source_files_json` を内部の serialize 用の型で書く。同じ bytes の組で `XZ` の path を残す。 |
| 2026-10-07 | sd-direct-read（Plan Review round 1 の是正） | BIZ-08-D6: SD の経路は精算回数のある束だけを取り込む（scan・preview・commit）。§37.3 手順 4 の精算回数の保存の文を IO-07-D5 → cache → DB の契約に直した。 |
| 2026-10-17 | sd-bulk-import-design（design、D-121） | §37.10（BIZ-08-D7 締めの一括取込みの順・TX・失敗、BIZ-08-D8 日報の同日追加の確認を精算回数の照合で置き換える、BIZ-08-D10 CV17 との併存と (b) を妨げない約束）と §37.11（BIZ-08-D9 EJ の記録の取込みと閲覧）を proposed で足した。§37.3〜§37.9 は変えていない。 |
