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
    sd_relative_path: Option<String>, // SD から読んだ file だけ Some（IO-09 の relative_path）。写しの保存に使う（BIZ-08-D5）
}

struct CachedDailyReportPreview {
    created_at: Instant,
    preview_data: DailyReportPreviewData,
    settlement_no: Option<i64>, // IO-07-D5。commit で保存し、TX 内の再検査に使う（BIZ-08-D4）。SD の経路では Some だけ（BIZ-08-D6）
    sd_source_files: Vec<SdSourceFileForCopy>, // SD から読んだ束の 3 本（手で選んだ束は空）。commit で写しを書く（BIZ-08-D5）
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
```

**処理ステップ**:

1. ファイルサイズ上限を検証する。
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
   - **BIZ-08-D4**: `settlement_no`（IO-07-D5）が `Some` で、`report_date` と `settlement_no` が同じで `bundle_hash` が違う `completed` importあり → `BizError::ImportError` で止める（追加確認で通さない）。文は固定で `同じ精算の日報が、別のファイルからすでに取り込まれています。二重に数えないため、取り込みません。取り込み直すときは、前の取込みを取り消してから読み直してください。`（raw detail を含めない。BIZ-08-D1）。`operation_logs.operation_type='daily_report_parse_failed'` を best-effort で記録する。`settlement_no` が `None` の束（layout B を含む）と、`settlement_no` が NULL の既存 import（D-111 より前の取込み）は照合しない。
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
1a. **BIZ-08-D6** の再検査: `sd_source_files` が空でない（SD の経路）のに `settlement_no` が `None` なら、写しを書かず DB を変えずに §37.3 手順 4 と同じ文の `BizError::ImportError` を返す（preview を経ずに作られた cache でも通さない。DB の状態に依らない検査なので、写しを書く手順 2a と TX の前に置く）。
2a. **BIZ-08-D5**: `sd_source_files` が空でなければ、TX の前に 3 本の写しを IO-10 `save_pos_source_copy(app_data_dir, sd_relative_path, bytes)` で書く（[29 §29.8](29-io-daily-report-parser.md#298-io-10-sd-から読んだ原本の写しの保存d-111)）。1 本でも失敗したら DB を変えずに `BizError::ImportError("SD から読んだファイルの写しを PC に保存できなかったため、取り込みませんでした。PC の空き容量を確かめて、もう一度取り込んでください。")` を返す（preview token は残し、同じ preview で再試行できる。診断 WARN に io error の種類を記録）。書けた写しの相対 path を手順 6 の `source_files_json` に入れる。
3. トランザクション開始。
4. TX内で `bundle_hash` のactive一致を最初に再検査する。一致があれば `BizError::IdempotencyConflict` として副作用なしで止める。
4a. TX内で BIZ-08-D4 の照合（同じ `report_date`・同じ `settlement_no`・別 `bundle_hash` の `completed`）を再検査する。一致があれば副作用なしで §37.3 手順 8 と同じ文の `BizError::ImportError` を返す。
5. TX内で同一report_dateのactive import IDを `imported_at DESC, id DESC` で再取得し、cached snapshotと完全一致することを確認する。不一致なら副作用なしで止め、`BizError::ImportError("同日の取込み状況が変わりました。再度プレビューしてください")` を返す。
6. 既存importを変更せず、`daily_report_imports` にINSERTする（`settlement_no` を含む。`None` は NULL）。`source_files_json` の各要素に、SD から読んだ束なら `sd_relative_path` と `copy_path`（IO-10 の app_data_dir からの相対 path）を足す（手で選んだ束は持たない。読む側は無い field を許す）。
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
- SD への書込み（CV17 と同じく `XZ_BKUP` へ移すこと。owner 決定で SD は動かさない、IO-09-D3）。
- 写しの保持期間・削除と、PC の外への backup（D-111 の未決 A・B）。
- `Z006`（グループ）、`Z009`（時間帯別）、`Z011`（担当者）の保存・集計。個人店の初期運用では使わない前提とし、必要性が確認された場合は後続設計で追加する。

### 37.9 scan_register_sd_daily_reports（SD から読む候補、BIZ-08-D3）

**関数要求**: レジの SD（IO-09、[29 §29.7](29-io-daily-report-parser.md#297-io-09-レジの-sd-の列挙と読取りd-111)）から Z001 / Z002 / Z005 を読み、精算ごとの束を取込みの候補として、取込み済みかの状態つきで返す。読んだ bytes は返り値の snapshot に持ち、preview はその snapshot から作る（SD を読み終えたら抜いてよい。SD-18）。DB へは書かない。

**シグネチャ**:

```rust
fn scan_register_sd_daily_reports(
    conn: &DbConnection,
    selection: RegisterSdSelection, // IO-09
    today: NaiveDate,
) -> Result<DailyReportSdScanResult, BizError>
```

**型**:

```rust
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
    candidate_key: String,                 // 束の識別。読めた束は bundle_hash、読めない・そろわない束は "sd:" + Z001 の相対 path 等の名前由来の値
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
}
```

**処理ステップ**:

1. root を決める。`Auto` は IO-09 `find_register_sd_roots`。0 件は `BizError::ImportError("SD が見つかりません。レジの SD をこの PC に差してから、もう一度読んでください。")`、2 件以上は `BizError::ImportError("SD が 2 枚以上見つかりました。売上を読む SD だけを差してください。")`。`Selected` は IO-09 `resolve_register_sd_root`、`NotRegisterSd` は `BizError::ImportError("選んだ場所はレジの SD ではありません。SD の中の CASIO の folder か、SD そのものを選んでください。")`。`MissingSalesArea` は `BizError::ImportError("SD に売上の folder（XZ）がありません。レジの SD か確かめてください。")`。
2. 読む範囲（窓）の始まり `from` を決める: `completed` の日報取込みがあれば、その `report_date` の最大と `today` − 30 日の早い方、無ければ `today` − 30 日。30 日は店の EJ の取込みの間隔の実績（月 1 回、最大 31 日の遅れ）を覆う値で、日報の取込みを 1 か月空けても窓は最後の取込みの日まで戻る。窓より前の分は候補に出ない（過去の分はファイルを選ぶ経路、UI-07-D16）。
3. IO-09 `list_register_sd_entries(root, from)`。`Io` は `BizError::ImportError("SD を読めませんでした。SD を差し直して、もう一度読んでください。")` にし、途中までの候補を返さない（以下の手順 5 の読取りも同じ）。
4. Z001 / Z002 / Z005 の entry を (area、相対 folder、日、接尾字、連番) が同じものごとに組にする（`Z00k_` より後ろが同じ 3 本は同じ精算だった。IO-07-D3。名前は組分けにだけ使い、同じ精算かは手順 5 の中身で決める）。3 系列が 1 本ずつそろわない組は `Incomplete`（読まない）。Z004・Z006 等の系列と EJ はここでは使わない（Z004 は BIZ-03、EJ は EJ の取込みの lane。§37.9 の末尾。写しの規則 BIZ-08-D5 もそれぞれの lane が同じ IO-10 で引き継ぐ）。`Unknown` は数えるだけ。
5. そろった組ごとに IO-09 `read_register_sd_file` で 3 本を読む（上限は CMD-12 の 1 file 20MB と同じ値）。1 本でも `TooLarge`、または形が CP932 strict・BOM 無し・CRLF だけ・最終改行ありのどれかを外れたら `Unreadable`（IO-09-D4。推測で読まない）。そろえば IO-07 `parse_daily_report_bundle` を呼び、`parse_errors` があれば `Unreadable`（BIZ-08-D1 の診断 WARN を記録。利用者向けには出さない）。無ければ §37.3 手順 5 と同じ式で `bundle_hash` を作る。
6. 同じ `bundle_hash` の組（`XZ` と `XZ_BKUP` に同じ bytes がある等）は 1 つの候補にまとめる。
7. 状態を決める: 同じ `bundle_hash` の `completed` があれば `Imported`。無く、`settlement_no` が `None` なら `Unreadable`（BIZ-08-D6。snapshot に入れない）。`Some` で同じ `report_date`・`settlement_no` の別 `bundle_hash` の `completed` があれば `SameSettlementImported`。それ以外は `NotImported`。`rolled_back` だけの束は `NotImported`（取消の後の取り込み直しを今どおり許す）。
8. 候補を `path_date` の新しい順、同じ日は精算回数の大きい順（読めない束は後ろ、その中は相対 path の順）に並べる。
9. `NotImported` の束の 3 本の bytes を `snapshot.files_by_candidate` に入れて返す。

**preview への接続**: 利用者が `NotImported` の候補を選ぶと、CMD-12 が snapshot の 3 本を §37.3 `parse_and_validate_daily_report` に渡す。preview・commit・同日追加の確認・BIZ-08-D4 は手でファイルを選んだ経路と同じで、SD の経路だけに足す規則は BIZ-08-D6（精算回数のある束だけ）と BIZ-08-D5（写し）の 2 つ。同じ scan の中で同じ精算の別の bytes の束が 2 つ `NotImported` になる場合（SD-23 が不一致で、CV17 の取込みも使った場合）、先に取り込んだ方の後のもう一方は §37.3 手順 8 の BIZ-08-D4 で止まる。

**BIZ-08-D3（SD の候補の規則）**:

- 決定: SD の `XZ` と `XZ_BKUP` の両方を窓の範囲で読み、精算ごとの束を中身の hash と精算回数で取込み済みと照らす。形の外れた file・そろわない束・名前の規則に合わない file は候補にしない（読まない、または読んでも取り込めない状態で示す）。
- 理由: アプリは SD を書き換えず（IO-09-D3）、CV17 の取込みを誰かが続けても精算の分は `XZ` か `XZ_BKUP` のどちらかにある。`XZ_BKUP` の file は `EcrDatas` と同じ bytes（SD-22）なので、`EcrDatas` から取り込み済みの分は hash で `Imported` になる。SD から取り込む束は 3 本とも精算回数が読めてそろう束だけなので（BIZ-08-D6）、取込み前の原本と取込み後の file が違う bytes でも（SD-23 が未確認）、後から来た方は同じ精算回数の照合（BIZ-08-D4）で止まる。
- 棄却案: file 名・接尾字・連番で取込み済みを決める（SD-08、IO-09-D2）、`XZ` だけを読む（CV17 の取込みを使った日の分を落とす）、窓を設けず全期間を読む（毎回全期間の Z を読む）、選んだ候補を preview の時にもう一度 SD から読む（SD を preview の間ずっと差しておく必要があり、読み終えたらレジへ戻せない）。
- 再検討: CV17 の日次の取込みを店がやめたと確かめられたとき（`XZ_BKUP` の窓を狭められる）。SD-23 の結果（R-50）が出たとき。

**BIZ-08-D6（SD の経路は精算回数のある束だけを取り込む）**:

- 決定: SD の経路（scan の候補と、そこから入る preview・commit）では、3 本とも精算回数が読めて値がそろう束（`settlement_no` が `Some`）だけを取り込める。`None` の束は scan で `Unreadable`、preview（§37.3 手順 4）と commit（§37.4 手順 1a）で `ImportError`（固定の文）にする。手で選んだ束の扱い（`None` も取り込める）は変えない。
- 理由: `None` の束を SD から取り込むと DB の `settlement_no` が NULL になり、後で CV17 が移した別の bytes・精算回数ありの同じ精算が、hash でも BIZ-08-D4 でも止まらず、同日追加の確認だけで二重に保存される。SD にあるのはレジの原本で CV17 の書出し（layout B）ではなく、`XZ_BKUP` の Z は全件が layout A の形だった（SD-24）ので、正規の SD の束は止まらない見込み（取込み前の `XZ` の原本は P1〈SD-23〉で確かめる）。
- 棄却案: `None` の束も SD から取り込み、後の照合を対象日と合計の一致で行う（同じ日の 0 円の精算などで誤る）、`None` の束を警告つきで取り込む（利用者が確認すると二重になりうる）、scan だけで止める（preview・commit に別の経路で来た cache を通す）。
- 保証の範囲: 手で選んだ `None` の束（layout B、D-111 より前の取込み）は照合されないので、同じ精算の SD の束と別の bytes なら同日追加の確認で通りうる（D-111 の Guarantee range。layout B は CV17 の明示書出しだけが作り、店は基本使わない）。
- 再検討: P1（SD-23）で、取込み前の `XZ` の原本の 3 本のどれかで精算回数が読めない、または取込み後の file と値が違うと分かったとき（runtime の lane の L3 の前に BIZ-08-D4 と本 guard を見直す）。

**BIZ-08-D5（読んだ原本の写しを PC に残す、owner 決定 2026-10-06）**:

- 決定: SD から読んで取り込む束の 3 本を、commit の TX の前にアプリのデータ folder の `pos-sources/casio-sr-s4000/sd/` の下へ SD の相対 path を保った名前で書く（IO-10）。書くのは取り込む束だけで、scan の時には書かない。写しを書けなければ取り込まない。
- 理由: SD は動かさないので SD にも原本は残るが、SD は静電気等で消えることがあり、CV17 をやめると PC 側に写しが無くなる。取り込んだ精算ごとに PC 側に原本の bytes があれば、日報の行の根拠を後から確かめられる。写しの無い取込みを作らないため、写しの失敗で止める（SD は動かしていないので、直してから同じ preview かもう一度読んで取り込める）。TX が失敗して写しだけが残っても、同じ bytes の写しなので害は無く、次の commit では `written: false` になる。
- 棄却案: scan の時に読んだ全部を書く（取り込まない束・読めない file まで残る）、写しの失敗を警告にして取り込む（写しの無い取込みができ、利用者が警告を見落とすと気づけない）、commit の TX の後に書く（DB は取込み済みなのに写しが無い状態ができる）。
- 保証の範囲: 写しは D-111 の後に SD から取り込んだ束だけ。手で選んだ束（`EcrDatas` 等、すでに PC にある file）は写さない。写しは DB の backup（[71](71-mnt-backup.md) の `VACUUM INTO`、DB の 1 file だけ）に入らず、restore は写しを変えない（レシート画像と同じ扱い）。restore で DB が戻ると、DB に無い取込みの写しが残ることがあるが、写しは原本の bytes で、取込みの状態は DB が正本。

**Z004 と EJ への引継ぎ**: Z004（BIZ-03）と EJ の取込みの lane は IO-09 の列挙と読取り、同じ窓と scan の snapshot の形を使う。取込み済みの見分けは、Z004 は file の hash と ADR SPEC-STK-TIME の精算同一性 guard（[32](32-biz-csv-import-service.md) の時点証拠契約、machine_no・settlement_no）、EJ は記録の番号（IO-08 の `number_prefix` + `number`）で行い、EJ を file の hash では見分けない（`XZ` 直下の EJ は精算をまたいで伸びる。SD-09、[IO-08.10](29-io-ej-parser.md#io-0810-日次取込みとの接続io-08-d10設計の申し送り)）。

### 更新履歴

| 日付 | PR | 内容 |
|---|---|---|
| 2026-08-16 | PR #79 | SPEC-SDI-D1〜D8: AlreadyImportedを維持しつつ同日別bundleを追加取込みとし、全件summary、TX内snapshot再検証、insert-only commit、per-import rollbackを正本化。 |
| 2026-10-04 | daily-report-import-gaps（plan-first） | BIZ-08-D2: 精算回数の不一致の文。個数を 100 倍の整数で運ぶ cache の型（`CachedDailyReportDepartmentLine`）と wire の `quantity: Option<f64>`（IO-07-D2〜D4、D-104）。 |
| 2026-10-06 | sd-direct-read（design、D-111） | BIZ-08-D3: SD から読む候補（§37.9）。BIZ-08-D4: 同じ精算を別の bytes で取り込まない照合と `settlement_no` の保存。BIZ-08-D5: 読んだ原本の写しを commit の前に PC に残す。 |
| 2026-10-07 | sd-direct-read（Plan Review round 1 の是正） | BIZ-08-D6: SD の経路は精算回数のある束だけを取り込む（scan・preview・commit）。§37.3 手順 4 の精算回数の保存の文を IO-07-D5 → cache → DB の契約に直した。 |
