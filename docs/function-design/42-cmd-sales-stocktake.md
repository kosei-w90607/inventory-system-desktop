## 22. CMD-09: 売上集計コマンド群 / CMD-10: 棚卸しコマンド群 / CMD-01 追加: 一括インポート / CMD-11 部分: 整合性チェック

### 時点証拠契約（proposed・未実装）

本節のPC時計epochの受渡し・一致検証・必須保存は、[ADRの適用範囲の但し書き](../adr/2026-09-18-stocktake-time-evidence.md#適用範囲の但し書き)により㉘のruntime実装対象外とし、次のdesign laneで置き換える。計数中のOS監視・generation・wall-clock / Instantの経過差によるcontext失効は実装対象として維持する。

SPEC-STK-TIME-D1 / D7〜D9。以下の現行update_count登録は新schema migration・全writerのkind対応・context必須UIと同じruntime変更で外し、tokenなしで書ける公開入口を残さない。schemaだけが新しく無検査commandが到達可能な中間版を稼働/出荷しない。通常計数・保留解除・記録詳細からの訂正は同じAPIを使う。

| command | wire入力 | wire出力 |
|---|---|---|
| begin_stocktake_count | request: BeginStocktakeCountRequest | Result<BeginStocktakeCountResult, CmdError> |
| save_stocktake_count | count_token: String、actual_count: i64 | Result<StocktakeCountSaveResult, CmdError> |
| abandon_stocktake_count | count_token: String | Result<(), CmdError>。保存済み実測の取消は行わない |

BeginStocktakeCountRequestはstocktake_item_idとpurpose。purposeはtagged enumで `kind=in_progress` / `kind=independent_recount` / `kind=legacy_rollback_recheck`（最後だけcsv_import_id必須）。不正な組合せはdeserializeまたはBIZで拒否し、用途の値だけで所有者guardを迂回させない。

BeginStocktakeCountResultはcount_token / stocktake_item_id / product_code / product_name / stock_unit / book_at_start / purposeを持つ。StocktakeCountSaveResultはstatus（saved / replayed）/ stocktake_item_id / recount_id（通常計数はnull）/ system_stock / actual_count / difference / stock_afterを持つ。difference=L-N、補正の符号N-Lと混同しない。active保存時は現在庫を変えず、独立再実測では即時補正後のstock_afterを返す。内部のS/E・revision・両cursor・世代・time_basis_id（PC時計epoch）はwire入力に追加しない。

#### 保管・ロック・失効

CMDのAppStateにtoken→BIZが生成したCountContextの保管場所を置く。BIZはAppState/cacheを参照しない。beginはDB lockでBIZに生成させ、DB lockを解放後に保管する。saveはcontextを短くlookupして保管lockを解放し、その後DB lockでBIZへ渡す。lookup失敗でも保存済みrequestの照会を先にできるよう、OptionとしてBIZへ渡す。DBとcontext/cacheのlockを同時保持しない。

contextの有効性を決めるのはBIZの用途・世代・所有者・版・時計検査であり、CMDのcacheに存在するだけでは書込み権限にならない。abandonはBIZの失効処理を通して未保存contextを破棄する。saveの応答喪失後は同tokenで再送し、commit済みならBIZのDB照会でreplayedになる。再起動で未保存tokenを復元しない。

Windowsのsuspend/resume・時計変更通知はMNTが受け、count_platform_generationを進め、ADR D1に従ってPC時計epochのUUIDも更新する。CMDはMNTの時刻・generation・epochをCountEnvironmentとしてBIZへ渡す。BIZ-06がbeginでepochを固定し、save TXと保存直前に再検証してitem/recountへ保存する。POS基準の数や認定状態を実測epochの選択に使わない。登録失敗時はBIZへ環境不成立を渡す。保存前/直前のgenerationとwall/Instant検査をUIの時計申告で代替しない。DB接続交換でも全contextを失効させ、既にlookupされた内部contextも古いDB世代として拒否する。非Windows製品実行で監視成立を確認できない場合は計数不可、test/dev providerの成功はnative証拠ではない。

監視不成立では新しい実測のbegin/未保存saveをcount_environment_unavailableで拒否し、既存の保存データを変えない。保存済みrequestの副作用なし照会は維持する。PC時計epochの欠落をtime_basis_id=NULLとして新measuredへ保存することは許可しない。POS基準が未認定でも、監視成立下の実測epochは必須である。UIに停止理由を表示し、再起動で監視を再登録、復旧しなければ担当者によるnative診断/修正版確認へ進む。監視成立後に新beginからやり直し、旧tokenは復活させない。

#### エラー・読取り・登録

拒否のwireは[40の回復型](40-cmd-product.md)に統一する。get_stocktake_items / find_stocktake_item / get_stocktake_recordへ、kind・flag・保存先・補正区分・recountをBIZから透過する。完了済みitemの読取りを利用し、差0の商品にも訂正入口を用意する。fix_integrityのcommand署名は変更せず、BIZ/repoの版更新失敗を既存DBエラーへ変換する。

get_stocktake_recordのheader.reconciliation_versionも生成wireへ透過し、UIが旧完了記録の表示契約と新方式を区別できるようにする。CMDが版を再推定しない。

runtimeでは新commandのtauri/specta属性、collect_commands登録、旧update_countの公開登録削除、bindings生成と全caller/mockの切替を一緒に行う。native自動probeで通知登録失敗・保存直前時計変更・DB置換時の拒否を検証する。ownerのWindows L3は通常計数、変更通知後の数え直し、再起動後の保留再開、完了後の訂正の可視結果に限定し、手動のDB故障注入を要求しない。

### 22.1 モジュール構成

```
src-tauri/src/
  cmd/
    mod.rs               -- pub mod sales_cmd, stocktake_cmd, integrity_cmd を追加
    product_cmd.rs       -- CMD-01（既存スタブ → 5.4節の実装 + import追加）
    sales_cmd.rs         -- 売上集計関連のTauriコマンド（CMD-09）
    stocktake_cmd.rs     -- 棚卸し関連のTauriコマンド（CMD-10）
    integrity_cmd.rs     -- 整合性チェックのTauriコマンド（CMD-11部分）
    csv_import_cmd.rs    -- 既存（CMD-07）
    plu_export_cmd.rs    -- 既存（CMD-08）
```

---

### 22.2 CMD層の原則（17.2節を継承）

17.2節（41-cmd-pos.md）の原則をそのまま適用:
- 薄いラッパー: state.db.lock() → BIZ呼出し → BizError→CmdError変換
- 業務バリデーション、ビジネスロジックは持たない
- wire の有限文字列を内部 enum へ変換する境界処理はCMD責務とする。変換後の値に対する業務条件はBIZだけが判定する

**Phase 5 追加コマンドでのキャッシュ**: CMD-09/10/整合性コマンドは preview_cache を使用しない。DB接続のみ。

---

### 22.3 BizError → CmdError 変換（Phase 5 追加分）

40-cmd-product.md 5.3節 と 41-cmd-pos.md 17.4節 の既存変換ルールに以下を追加:

| BizError | CmdError.kind | CmdError.message |
|----------|--------------|------------------|
| ValidationFailedAt { message, field } | "validation" | message をそのまま使用し、field も保持 |
| StocktakeInProgress(msg) | "stocktake_in_progress" | msg をそのまま使用 |
| StocktakeNotInProgress(msg) | "stocktake_not_in_progress" | msg をそのまま使用 |

**stocktake_in_progress を新設した理由**: 棚卸し開始時の「既に進行中」は一般的なバリデーションエラーとは性質が異なる。UI側で「進行中の棚卸しに移動」等の案内を出すために種別を分ける。

**未入力商品の警告**: BIZ-06 は未入力時に `ValidationFailed` を返す（メッセージに件数含む）。CMD層は既存の `ValidationFailed → "validation"` 変換で対応。

---

### 22.4 CMD-09 コマンド

#### get_daily_sales

**関数要求**: 指定日の売上レポートを取得する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn get_daily_sales(
    state: State<AppState>,
    date: String,
) -> Result<DailySalesReport, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::sales_service::get_daily_sales(&conn, &date) を呼ぶ
3. Ok → DailySalesReport をそのまま返す
4. Err(BizError) → CmdError に変換して返す

#### get_monthly_sales

**関数要求**: 指定月の売上レポートを取得する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn get_monthly_sales(
    state: State<AppState>,
    month: String,
    mode: String,
) -> Result<MonthlySalesReport, CmdError>
```

**処理ステップ**:
1. mode を SalesMode に変換: "by_product" → ByProduct, "by_department" → ByDepartment, その他 → CmdError { kind: "validation", message: "不正な集計モードです" }
2. state.db.lock() でDB接続を取得
3. biz::sales_service::get_monthly_sales(&conn, &month, mode) を呼ぶ
4. Ok → MonthlySalesReport をそのまま返す
5. Err(BizError) → CmdError に変換して返す

**設計判断 — mode の受け方（CMD-09-CONV-D1、D-061 で改訂）**: wire→内部型変換は業務 validation ではなく CMD 境界の責務である。`SalesMode` を generated enum で直受けし、旧手動変換の validation 文言（「不正な集計モードです」）は wire 契約から除去した。不正値は serde deserialize 拒否となるが、UI は固定 toggle からのみ mode を送るため利用者到達不能（D-061 (b)）。

#### export_sales_csv

**関数要求**: 指定日または指定月の売上データをCSVファイルとしてエクスポートする

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
#[specta::specta]
fn export_sales_csv(
    state: State<AppState>,
    report_type: SalesReportType,
    target: String,
) -> Result<SalesExportResponse, CmdError>
```

**SalesExportResponse構造体**:
```
struct SalesExportResponse {
    bytes_base64: String,        // UTF-8 BOM付きCSVバイト列のbase64エンコード
    suggested_filename: String,  // 推奨ファイル名
    content_type: String,        // "text/csv"
    encoding: String,            // "UTF-8"
    record_count: usize,         // エクスポート件数
}
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得（`report_type` は serde で `SalesReportType` enum に deserialize 済、CMD 層手動 validation 不要）
2. biz::sales_service::export_sales_csv(&conn, &report_type, &target) を呼ぶ
3. csv_bytes を base64 エンコード
4. SalesExportResponse を構築して返す
5. Err(BizError) → CmdError に変換して返す

**設計判断 — report_type を `SalesReportType` 直受けにする理由**（PR #66 Q-6 A 案、Codex R1 P3 由来）: `SalesReportType` は `#[derive(specta::Type, serde::Deserialize)]` + `#[serde(rename_all = "snake_case")]` で snake_case literal union (`"daily" | "monthly_by_product" | "monthly_by_department"`) として bindings.ts に export される。フロントエンドは bindings 由来の `SalesReportType` を直接渡し、serde が deserialize 段階で不正値を拒否する（CMD 層の手動 String → enum 変換不要、型安全性最大化）。

**設計判断 — get_monthly_sales の mode（H-1 の解消、D-061）**: 旧判断（commit `daa4fef` 時点で mode のみ String 据え置き）は D-061 で解消し、`get_monthly_sales` は `SalesMode` generated enum を直受けする。`SalesMode` に serde::Deserialize + specta::Type / Serialize を揃え、frontend も bindings 由来の同型 enum を共有する。

---

### 22.5 CMD-10 コマンド

#### get_active_stocktake

**関数要求**: 進行中の棚卸しを取得する（読み取り専用）

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn get_active_stocktake(
    state: State<AppState>,
) -> Result<Option<Stocktake>, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::stocktake_service::get_active_stocktake(&conn) を呼ぶ（IO層 stocktake_repo::find_active_stocktake の薄いラッパー）
3. 進行中の棚卸しがなければ None を返す

#### start_stocktake

**関数要求**: 新しい棚卸しを開始する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn start_stocktake(
    state: State<AppState>,
) -> Result<StartStocktakeResult, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::stocktake_service::start_stocktake(&mut conn) を呼ぶ
3. Ok → StartStocktakeResult を返す
4. Err(BizError::StocktakeInProgress(msg)) → CmdError { kind: "stocktake_in_progress", message: msg }
5. Err(other) → CmdError に通常変換

#### get_stocktake_items

**関数要求**: 棚卸しアイテム一覧を取得する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn get_stocktake_items(
    state: State<AppState>,
    stocktake_id: i64,
    department_id: Option<i64>,
    counted_only: Option<bool>,
    page: u32,
    per_page: u32,  // 下限はBIZが検証。上限はBIZ経由のIO層でD-031共有定数により200クランプ
) -> Result<StocktakeItemListResponse, CmdError>
```

**StocktakeItemListResponse構造体**:
```
struct StocktakeItemListResponse {
    items: Vec<StocktakeItemDetail>,   // 商品名・部門名付きのアイテム一覧
    progress: StocktakeProgress,        // 進捗（counted/total）
    total_count: u32,                   // ページング用の総件数
    page: u32,
    per_page: u32,
}
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::stocktake_service::get_stocktake_items(conn, stocktake_id, department_id, counted_only, page, per_page) を呼ぶ
3. BIZ層が page / per_page の下限を検証し、stocktake_repo::list_stocktake_items と stocktake_repo::get_stocktake_progress を呼んで items と progress をまとめる
4. 結果を StocktakeItemListResponse に組み立てて返す。BIZの field 付き validation は `CmdError.field` を保持する

**設計判断**: 現行実装の get_stocktake_items は BIZ 層（stocktake_service）を経由する。初期設計では読み取り専用のため CMD から stocktake_repo 直呼びとしていたが、2026-04-13 commit 882cec6 で BIZ wrapper が追加され、CMD は UI -> CMD -> BIZ -> IO の境界を保つ。

**pagination 実態**: stocktake_repo::list_stocktake_items は per_page を D-031 の `PAGINATION_MAX_PER_PAGE = 200` でクランプし、レスポンスの per_page もクランプ後の値を返す。

#### find_stocktake_item

**関数要求**: 商品コードまたはJANコードで棚卸しアイテムを取得する（読み取り専用）

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn find_stocktake_item(
    state: State<AppState>,
    stocktake_id: i64,
    code: String,
) -> Result<Option<StocktakeItemDetail>, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::stocktake_service::find_stocktake_item(&conn, stocktake_id, &code) を呼ぶ（IO層 stocktake_repo::find_stocktake_item_by_code の薄いラッパー）
3. 該当アイテムがなければ None を返す

#### update_count

**関数要求**: 棚卸しアイテムのカウントを更新する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn update_count(
    state: State<AppState>,
    stocktake_item_id: i64,
    actual_count: i64,
) -> Result<UpdateCountResult, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. UpdateCountRequest { stocktake_item_id, actual_count } を構築
3. biz::stocktake_service::update_count(&conn, req) を呼ぶ
4. BIZ層が actual_count < 0 を `ValidationFailed("カウント数は0以上で入力してください")` として拒否する
5. Ok → UpdateCountResult を返す
6. Err(BizError) → CmdError に変換

#### complete_stocktake

**関数要求**: 棚卸しを確定する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn complete_stocktake(
    state: State<AppState>,
    stocktake_id: i64,
    force_fill: bool,
) -> Result<StocktakeResult, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. CompleteStocktakeRequest { stocktake_id, force_fill } を構築
3. biz::stocktake_service::complete_stocktake(&mut conn, req) を呼ぶ
4. Ok → StocktakeResult を返す（整合性チェック結果を含む。PR-5 で BIZ-07 統合後）
5. Err(BizError::StocktakeNotInProgress(msg)) → CmdError { kind: "stocktake_not_in_progress" }
6. Err(other) → CmdError に通常変換（ValidationFailed → "validation" で未入力警告を含む）

#### get_last_completed_stocktake

**関数要求**: 最後に完了した棚卸しを取得する（読み取り専用、UI-10-D5 前回比較用）

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn get_last_completed_stocktake(
    state: State<AppState>,
) -> Result<Option<LastStocktakeSummary>, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::stocktake_service::get_last_completed_stocktake(&conn) を呼ぶ（IO層 stocktake_repo::find_last_completed_stocktake の薄いラッパー）
3. 完了済み棚卸しがなければ None を返す

#### get_stocktake_record

（2026-08-27 追加、[65-inventory-record-traceability.md](65-inventory-record-traceability.md) §65.10 slice 4c）

**関数要求**: 棚卸し記録詳細を取得する（棚卸し詳細画面 `/stocktake/records/$stocktakeId` 用の read-only コマンド）

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn get_stocktake_record(
    state: State<AppState>,
    stocktake_id: i64,
) -> Result<StocktakeRecordDetail, CmdError>
```

**出力型**: [35-biz-stocktake-service.md](35-biz-stocktake-service.md) §20.6a の StocktakeRecordDetail（BIZ 所有 wire DTO）

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::stocktake_service::get_stocktake_record(&conn, stocktake_id) を呼ぶ
3. Ok → StocktakeRecordDetail を返す
4. Err(BizError::NotFound(msg)) → CmdError { kind: "not_found", message: msg }
5. Err(other) → CmdError に通常変換（§22.3）

read-only であり、preview_cache / 冪等キー / 操作ログ記録には関与しない（[41-cmd-pos.md](41-cmd-pos.md) §17.5 get_csv_import_record と同型）。

---

### 22.6 CMD-01 追加: 一括インポートコマンド

40-cmd-product.md（5.4節）に以下のコマンドを追加する。

#### preview_import

**関数要求**: 商品マスタCSVのプレビューを返す

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn preview_import(
    state: State<AppState>,
    file_bytes: Vec<u8>,
) -> Result<ImportPreview, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::product_service::preview_import(&conn, &file_bytes) を呼ぶ
3. BIZ層が空ファイルを `ValidationFailed("ファイルが空です")` として拒否する
4. Ok → ImportPreview を返す
5. Err(BizError) → CmdError に変換

#### commit_import

**関数要求**: プレビュー済みの一括インポートを確定する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn commit_import(
    state: State<AppState>,
    valid_rows: Vec<ImportRow>,
    overwrite_codes: Vec<String>,
) -> Result<ImportResult, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::product_service::commit_import(&mut conn, valid_rows, overwrite_codes) を呼ぶ
3. Ok → ImportResult を返す
4. Err(BizError) → CmdError に変換

---

### 22.7 CMD-11 部分: 整合性チェックコマンド

CMD-11 のうち、BIZ-07 に対応する2コマンドのみ Phase 5 スコープ。
設定・ログ・バックアップコマンドは Phase 6（MNT-01/MNT-02 依存）。

#### run_integrity_check

**関数要求**: 在庫整合性チェックを実行する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn run_integrity_check(
    state: State<AppState>,
) -> Result<IntegrityResult, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::integrity_service::run_integrity_check(&conn) を呼ぶ
3. Ok → IntegrityResult を返す
4. Err(BizError) → CmdError に変換

#### fix_integrity

**関数要求**: 指定商品の在庫を整合性チェック結果に基づいて補正する

**シグネチャ（Tauriコマンド）**:
```
#[tauri::command]
fn fix_integrity(
    state: State<AppState>,
    product_codes: Vec<String>,
) -> Result<IntegrityFixResult, CmdError>
```

**処理ステップ**:
1. state.db.lock() でDB接続を取得
2. biz::integrity_service::fix_integrity(&mut conn, &product_codes) を呼ぶ
3. BIZ層が空の product_codes を `ValidationFailed("補正対象の商品が指定されていません")` として拒否する
4. Ok → IntegrityFixResult を返す
5. Err(BizError) → CmdError に変換

---

### 22.8 lib.rs コマンド登録

Phase 5 で以下のコマンドを invoke_handler に追加登録:

```
// CMD-01 追加（product_cmd.rs — 5.4節の既存設計 + import）
create_product, update_product, toggle_discontinue, search_products, get_product,
preview_import, commit_import,

// CMD-09（sales_cmd.rs）
get_daily_sales, get_monthly_sales, export_sales_csv,

// CMD-10（stocktake_cmd.rs）
start_stocktake, get_stocktake_items, update_count, complete_stocktake,

// CMD-11 部分（integrity_cmd.rs）
run_integrity_check, fix_integrity,
```

合計 16 コマンド（CMD-01: 7, CMD-09: 3, CMD-10: 4, CMD-11部分: 2）。

2026-08-27 追記（65 slice 4c）: CMD-10 に `get_stocktake_record` を追加登録する。lib.rs の登録は `export_specta_bindings()` 内 `collect_commands![...]`（bindings 生成用）と `.invoke_handler(tauri::generate_handler![...])`（実行時 dispatch 用）の 2 箇所が必要（[41-cmd-pos.md](41-cmd-pos.md) §17.9 と同契約。collect_commands のみでは bindings は生成されるが IPC 実呼出しが「command not found」になる）。

---

### 22.9 非目的

| やらないこと | 理由 | 責務を持つモジュール |
|------------|------|-----------------|
| CMD-11 設定・ログ・バックアップ | MNT-01/MNT-02 依存（Phase 6） | Phase 6 で追加 |
| preview_cache 操作 | Phase 5 コマンドは DB のみ | CMD-07（既存） |
| 業務バリデーション | BIZ層の責務 | 各BIZサービス |

---

### 22.10 validation test contract

CMD-01 `preview_import`、CMD-09 `get_monthly_sales`、CMD-10
`get_stocktake_items` / `update_count`、CMD-11 `fix_integrity` のvalidation / conversion
testは、`tauri::test::mock_builder`でmanaged `AppState`を構築し、対象のproduction
command関数を呼ぶ。test内で `is_empty()`、閾値比較、mode変換、`CmdError`構築を
再実装してはならない。

error期待値はproduction定数・helperからimportせず、source designから独立転記した
`kind` / `message` / `field` を完全一致比較する。productionの各guard / mappingを
削除または反転したとき、対応testがredになることをmutationで確認する。
