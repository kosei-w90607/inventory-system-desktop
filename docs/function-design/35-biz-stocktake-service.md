## 20. BIZ-06: 棚卸しロジック

### 計数の置き場と在庫の求め直しの契約（proposed・未実装、D-118）

[棚卸しの数の置き場と在庫の求め直しの ADR](../adr/2026-10-16-stocktake-count-placement.md)（SPEC-STK-CNT-D3・D5・D6）の BIZ-06 の側。以下の §20.2〜§20.5 の現行の update_count と在庫への上書きの確定、§20.6a の差異の定義、§20.7 の動的差異、§20.8 の INV-2 / INV-3、§20.9 の旧保存型は、runtime の切替で本節に置き換える。旧 ADR（時点証拠）の計数 context（begin・token・版・DB 世代・source_cursor・再送の照会・abandon）・独立再実測の表・明細の kind（uncounted / measured / auto_filled / legacy）・force_fill・legacy の取消の保留・非連動化の回復・拒否の回復型の表（SPEC-STK-TIME-D1-R1）は持たない（置き換えた。D-109 で `#[cfg(test)]` に置いた `stocktake_service/time_evidence.rs` は runtime の lane が外す）。

#### 計数の保存（SPEC-STK-CNT-D5）

`save_stock_count(tx, SaveStockCountRequest) -> Result<StockCountSaveResult, BizError>`。

- 入力: `product_code`、`count_value`（0 以上の整数。長さの商品は cm。上限は [共通規則](10-common-rules.md) の在庫の上限 `999999999`）、`fresh: bool`（「入れ直す」なら true、「数を保存」なら false）、`business_date`（YYYY-MM-DD。`fresh=false` のとき使う。UI の既定は PC の今日、「前の日の分を入れる」で選んだ日。`fresh=true` では today を使い、入力の値と違えば `ValidationFailed`）、`stocktake_item_id: Option<i64>`（棚卸しの画面から保存したとき）、`today`（CMD が渡す PC の今日。BIZ は時計を読まない）。
- 保存の形（[tracking](../db-design/tracking-system-tables.md) の `stock_counts`）: `fresh=false` は `count_kind='default'`。`fresh=true` は `count_kind='fresh'`、`business_date=today`、`settlement_no` = 同じ TX で読んだ active な Z004 の取込みの最大の精算回数（取込みが無ければ NULL。0 は実在しうる精算回数なので使わない）、`seen_movement_id` = 同じ TX で読んだ `MAX(inventory_movements.id)`（無ければ 0）。`business_date` が today より後なら `ValidationFailed`（「未来の日付には保存できません」）。
- 1 商品 1 TX で `stock_counts` へ INSERT し、[31](31-biz-inventory-service.md) の `recompute_stock` で写しを書き、`stocktake_item_id` があれば明細の `actual_count`・`counted_at`（表示用の写し）を効く計数に合わせる。明細が進行中の棚卸しのものでないとき、明細の商品が `product_code` と違うとき（同じ TX で確かめる）は、書く前に `ValidationFailed`（「この明細は別の商品です」）。
- 結果: 保存した計数の id・種類、求め直しの後の在庫（写しの値と範囲）、要再確認の理由（[40](40-cmd-product.md) の `recount_reasons` と同じ enum）、`later_count_exists: bool`。
- 後入力の確認（ADR D5）: 既定の計数の保存の前に UI が `preview_stock_count_placement(conn, product_code, business_date, today) -> CountPlacementPreview`（読取りだけ）を呼び、ADR D3 の「計数どうし」でその計数より後の計数が既にあるか（`later_count_exists`）を受ける（「後の数が既にあり、そちらが効きます」。保存は拒まない）。
- 計数は消さない・書き換えない（誤った数は「入れ直す」で直す。fresh な計数は、それより先に保存された計数を全て置き換える。ADR D3）。再送の照会・冪等の key は持たない（同じ値の既定の計数がもう 1 行入っても、重なる計数で値が同じなら 1 つとみなす）。

#### 開始と明細

- `start_stocktake` は今のまま進行中の棚卸しが無ければ header と明細（全ての商品。`system_stock` は作成時の帳簿、`actual_count` は NULL）を作る。棚卸し中の商品登録・商品一括 import は明細を足す（今のまま）。進行中があれば `StocktakeInProgress`、対象 0 件は `ValidationFailed`（今の文言）。
- 明細の「計数済み」は、その明細を参照する計数（`stock_counts.stocktake_item_id`）があること。

#### 完了（SPEC-STK-CNT-D6）

`complete_stocktake(tx, CompleteStocktakeRequest { stocktake_id, today })` は、TX の中で次を検査し、1 つでも当たれば何も書かずに `StocktakeGuard`（[40](40-cmd-product.md) の code `completion_blocked`、明細ごとの target と `block_reason`）を返す。

| block_reason | 条件 |
|---|---|
| `settlement_pending` | 明細の効く計数（日付 X。fresh なら保存の時点の精算回数 n）について、(i) 精算日が X 以上の取り込み済みの精算が無い、または (ii) 取り込まれていない精算回数 k（fresh で n が NULL でなければ k > n）で、隣の取り込み済みの精算 a < k < b の精算日が d_a ≤ X ≤ d_b のものがある、または (iii) 既定の計数（と n が NULL の fresh な計数）で、精算日が X より前の取り込み済みの精算が無い |
| `recheck` | 明細の商品の写しが要再確認（`stock_recheck=1`） |
| `uncounted` | 明細を参照する計数が無い。ただし、その時点で廃番かつ在庫（写し）が 0 の商品は対象外 |

- message: 「棚卸しを完了できません。数え直し・未計数・取り込んでいない精算のある商品があります」。UI は `block_reason` ごとに一覧を出す。その日の最後の精算を取り込んでいないことは判定できない（ADR D6 の H2）ので、UI の完了の確認の文で確かめる（[73](73-ui-stocktake.md)）。
- 未計数を片付ける操作: 「数を入れる」は通常の計数の保存。「0 にする」は `count_value=0`・`fresh=false` の計数の保存で、`business_date` は UI が選んだ日（既定は今日、今日より後は `ValidationFailed`。ADR D6）（`zero_uncounted_items(tx, stocktake_id, product_codes, business_date, today)` でまとめて保存できる。1 TX、商品ごとに求め直す）。帳簿の数とみなす操作（force_fill）は持たない。
- 通れば、各明細の `valuation_cost_price` にその時点の原価を、`valuation_quantity` に評価数量 `max(写しの在庫, 0)` を固定し、[§20.5a](#205a-評価額の計算価格の基準数量と店の丸め) の関数（SPEC-STK-VAL-D1〜D6）で `total_cost` を求め、stocktakes の完了の時点のカーソル（`cutoff_settlement_no`〈取込みが無ければ NULL〉・`cutoff_count_id`）を保存し、header を completed にする。完了は在庫を動かさず、movement を作らない。数量と積和は checked 演算。
- 完了した評価額は、後から入った記録（棚卸しの期間の日付を選んだ入出庫・後入力の計数・遅れて取り込んだ Z004）で変えない（非遡及）。差は示す（ADR SPEC-STK-CNT-D6、owner の決定 TD-296）: `get_stocktake_record` が、明細ごとに「完了の時点の在庫」を [31](31-biz-inventory-service.md) の `derive_stock` と同じ規則で今の記録から求め直す（計数は id ≤ `cutoff_count_id`、入出庫の movement は業務日 ≤ 完了日の全て〈カーソルで切らない。完了の前に保存した完了日の記録は `valuation_quantity` にも入っているので差に効かず、完了の後に入れた完了日以前の日付の記録が差になる〉、精算は精算日 < 完了日のものと、精算日 = 完了日で精算回数 ≤ `cutoff_settlement_no` のもの。完了日より後の日付の記録は入れない）。その `max(…, 0)` と `valuation_quantity` を、凍結した `valuation_cost_price` でそれぞれ §20.5a の関数で評価し、丸めた後の総額を差し引いて参考の差とする（負の数量を関数に渡さない。読取りで求め、保存しない）。求め直した完了の時点の在庫が要再確認（範囲 lo〜hi）の明細は、差を確定の差と分け、「要再確認」の印と差の範囲（`max(lo,0)` と `max(hi,0)` をそれぞれ `valuation_quantity` と比べた幅、評価額も同じ 2 端で評価した幅）で示し、確定の差の合計に入れない（決まらない記録による差を確定の数として出さない）。差のある明細の一覧（確定の差と要再確認の差を分ける）と確定の差の合計を返す。完了した `total_cost`・`valuation_cost_price`・`valuation_quantity` は書き換えない。

#### 読取り

- 明細の一覧は、明細ごとに効く計数の値・種類・日付、写しの在庫と範囲、要再確認の理由、差異（効く計数の値 − その計数に入っている記録だけから求めた帳簿。計数が無ければ NULL）を返す。差異は表示用で、在庫を動かさない。
- 要再確認の一覧 `list_recheck_products(conn) -> Vec<CountRecoveryTarget>`（`stock_recheck=1` の商品。進行中の棚卸しに明細があれば action `active_count` と `stocktake_item_id`、なければ `count_now`）。棚卸しが無いときも読める（取込みの結果と同じ一覧を棚卸しの画面に出す。[73](73-ui-stocktake.md)）。一覧からの保存は fresh な計数で、`stocktake_item_id` があれば渡す（明細の `actual_count`・`counted_at` を置き換わった計数に揃える）。

### 20.0 現行buildの一時停止

現行 build では、棚卸しの開始・数の保存・確定は一時停止中である（[停止 ADR](../adr/2026-09-23-legacy-stocktake-z004-write-stop.md) SPEC-STOP-D1〜D3）。公開関数 `start_stocktake` / `update_count` / `complete_stocktake` は、関数の最初の文で次の error を返す。DB を読まず、TX を開かず、operation log を書かない。引数の検査（`actual_count < 0` 等）や明細・棚卸しの存在確認より停止が先で、どの入力でも同じ error になる。

- BIZ-06 停止文言: `棚卸しの開始・数の保存・確定は一時停止中です。数えた後の入出庫が確定で打ち消される不具合を直すまで使えません。`
- variant: `BizError::ValidationFailed(<BIZ-06 停止文言>)`。CMD の既存変換で kind = `validation`、field = null、error_id = null。

以下の §20.3〜§20.5 の処理ステップは旧本体 `legacy_start_stocktake` / `legacy_update_count` / `legacy_complete_stocktake`（`pub(crate)`、呼出し元は `#[cfg(test)]` の test・診断・fixture だけ）の記述である。読取り関数（§20.3.1、§20.6、§20.6a 等）は停止しない。停止の解除は ⑤ だけで行う（SPEC-STOP-D6）。

### 20.1 モジュール構成

```
src-tauri/src/
  biz/
    mod.rs                   -- pub mod stocktake_service を追加
    product_service.rs       -- 既存（BIZ-01）
    inventory_service/       -- 既存（BIZ-02、ディレクトリモジュール）
    csv_import_service.rs    -- 既存（BIZ-03）
    plu_export_service.rs    -- 既存（BIZ-04）
    stocktake_service.rs     -- 棚卸しの業務ロジック（本セクション）
```

単一ファイルで開始。棚卸し確定処理が大きくなった場合のみディレクトリ分割を検討する。

---

### 20.2 型定義

#### StartStocktakeResult構造体

- stocktake_id: i64（生成された棚卸しID）
- item_count: usize（生成された棚卸し明細件数。廃番自動入力分含む）
- auto_filled_count: usize（廃番かつ在庫0で actual_count=0 を自動入力した件数）

#### UpdateCountRequest構造体

- stocktake_item_id: i64
- actual_count: i64（0以上の整数）

#### UpdateCountResult構造体

- success: bool
- current_difference: i64（動的計算: products.stock_quantity - actual_count。正=システム在庫が多い、負=実在庫が多い）

#### CompleteStocktakeRequest構造体

- stocktake_id: i64
- force_fill: bool（true=未入力の商品を「システム在庫と同じ」とみなして自動入力。false=未入力があればエラー）

#### StocktakeResult構造体

- total_cost: i64（仕入原価総額、円。商品別の金額〈valuation_cost_price・評価数量〈現行の旧本体は actual_count、新方式は `max(補正後現在庫,0)`〉・価格の基準数量から1/100円で求める〉の合計を円未満で四捨五入した値。§20.5a。税理士報告用）
- adjusted_items: Vec\<AdjustedItem\>（差異があった商品のリスト）
- total_items: usize（棚卸し対象の総商品数）
- integrity_result: Option\<IntegrityResult\>（D-2: 確定後の整合性チェック結果。失敗時はNone）

#### AdjustedItem構造体

- product_code: String
- product_name: String
- system_stock: i64（確定時点のシステム在庫 = products.stock_quantity）
- actual_count: i64（実カウント数）
- difference: i64（system_stock - actual_count。正=過剰、負=不足）
- stock_after: i64（確定後の在庫数 = actual_count）

#### StocktakeProgress構造体

- stocktake_id: i64
- status: String（"in_progress" / "completed"）
- total_items: usize（棚卸し明細の総件数）
- counted_items: usize（actual_count IS NOT NULL の件数）
- uncounted_items: usize（actual_count IS NULL の件数）

#### StocktakeItemWithProduct構造体（棚卸し明細+商品情報。一覧表示用）

- stocktake_item_id: i64
- product_code: String
- product_name: String
- department_name: String
- system_stock: i64（stocktake_items.system_stock。明細を作った時点〈棚卸しの開始時〉の参考値。D-118 の新方式でも同じ。時点の正本は [tracking §16-17](../db-design/tracking-system-tables.md) の「system_stockの時点」）
- current_stock: i64（現在のシステム在庫。products.stock_quantity。CSV取込み等で変動している可能性あり）
- actual_count: Option\<i64\>（NULLなら未入力）
- counted_at: Option\<String\>（YYYY-MM-DDTHH:MM:SS）

---

### 20.3 start_stocktake

**関数要求**: 新しい棚卸しを開始し、全対象商品の棚卸し明細を自動生成する

**シグネチャ**:
```
fn start_stocktake(
    conn: &mut DbConnection,
) -> Result<StartStocktakeResult, BizError>
```

**処理ステップ**:

1. **進行中チェック**（TX外）
   - stocktake_repo::find_active_stocktake(conn)
   - Some → BizError::StocktakeInProgress("進行中の棚卸しがあります（ID: {id}、開始日: {started_at}）。完了してから新しい棚卸しを開始してください")
2. **対象商品の取得**（TX外）
   - stocktake_repo::find_stocktake_eligible_products(conn) を呼び出し（全商品を返す。IO層ではフィルタなし）
   - 0件 → BizError::ValidationFailed("棚卸し対象の商品がありません")
   - 戻り値: Vec\<ProductForStocktake\> { product_code, stock_quantity, cost_price, is_discontinued }
3. **TX開始**（conn.transaction()。RAII Drop で自動 ROLLBACK）
4. **棚卸しヘッダINSERT**
   - stocktake_repo::insert_stocktake(&tx, now) → stocktake_id
   - started_at = 現在日時、status = "in_progress"
5. **棚卸し明細の一括生成**
   - auto_filled_count = 0
   - 各商品について:
     a. is_discontinued == true かつ stock_quantity == 0 の場合:
        - stocktake_repo::insert_stocktake_item(&tx, &NewStocktakeItem { stocktake_id, product_code, system_stock: 0, actual_count: Some(0) })
        - auto_filled_count += 1
     b. それ以外:
        - stocktake_repo::insert_stocktake_item(&tx, &NewStocktakeItem { stocktake_id, product_code, system_stock: product.stock_quantity, actual_count: None })
6. **COMMIT**（tx.commit()）
7. **TX外: 操作ログ記録**
   - system_repo::insert_operation_log(conn, &NewOperationLog { operation_type: "stocktake_start", summary: "棚卸しを開始しました（対象: {item_count}件）", detail_json: Some(detail_json) })
   - detail_json: { "stocktake_id": stocktake_id, "item_count": item_count, "auto_filled_count": auto_filled_count }
   - 操作ログ記録失敗は警告のみ（業務処理のcommitは完了済み）
8. StartStocktakeResult { stocktake_id, item_count, auto_filled_count } を返す（item_count = 対象商品の件数）

**エラーハンドリング**:
- 進行中の棚卸しが存在 → BizError::StocktakeInProgress
- 対象商品0件 → BizError::ValidationFailed
- DB操作失敗 → RAII自動ROLLBACK → BizError::DatabaseError(DbError)

**設計判断 — 棚卸しカウント対象の母集団（issue #91 owner 回答 2026-08-22）**:
- `find_stocktake_eligible_products` が返す母集団は商品マスタに登録済みの全商品である（`is_discontinued` を問わない）。実店舗の除外基準は年数ではなく原価根拠の有無で、伝票保管義務範囲外で廃棄済み・取引先データなし・バーコードなし・販売に適さない見た目という原価根拠を欠く現物は、単品コードを付与しない = 商品マスタへ登録しないことで自然に母集団から外れる。規模は例年 1〜2 点、多い年で 4〜5 点。
- システム側で除外品を表現する専用フラグや状態は追加しない（owner 方針）。部門キーで商品非連動販売として扱い、現物が再流通する場合は新規商品として改めて登録する。

**設計判断 — 廃番在庫0の自動入力**:
- is_discontinued=1 かつ stock_quantity=0 の商品は、棚に存在しないことが確実（廃番で在庫ゼロ）。カウント入力の手間を省くため、actual_count=0 を自動入力する
- is_discontinued=1 かつ stock_quantity>0 の商品は対象に含める（棚に残っている可能性があるためカウント必要）

**設計判断 — 明細一括生成のパフォーマンス**:
- 最大4000件の INSERT を1TX内で実行する。SQLite の WAL モード + 単一接続で十分高速（数百ms以内）
- 一括INSERT文（VALUES多値）は SQLite の SQL長制限とデバッグ困難性のため不採用。1件ずつ insert_stocktake_item を呼ぶ方式

**入力例**: なし（引数なし）

**出力例**:
```
Ok(StartStocktakeResult {
    stocktake_id: 1,
    item_count: 3847,
    auto_filled_count: 23,
})
```

---

### 20.3.1 get_stocktake_items

**関数要求**: 棚卸し明細一覧と進捗を取得する。pagination の下限条件は
BIZ層が所有し、CMD層は引数をそのまま渡す
（**BIZ-06-VAL-D1**）

**シグネチャ**:
```
fn get_stocktake_items(
    conn: &DbConnection,
    stocktake_id: i64,
    department_id: Option<i64>,
    counted_only: Option<bool>,
    page: u32,
    per_page: u32,
) -> Result<(PaginatedResult<StocktakeItemDetail>, StocktakeProgress), BizError>
```

**処理ステップ**:
1. page < 1 → `BizError::ValidationFailedAt { message: "ページ番号は1以上で指定してください", field: "page" }`
2. per_page < 1 → `BizError::ValidationFailedAt { message: "1ページあたりの件数は1以上で指定してください", field: "per_page" }`
3. `stocktake_repo::list_stocktake_items` と `stocktake_repo::get_stocktake_progress` を呼ぶ
4. 明細一覧と進捗を返す

per_page の上限は既存どおりIO層が D-031
`PAGINATION_MAX_PER_PAGE = 200` でクランプする。下限 validation の移設で
上限・クランプ意味論は変更しない。

---

### 20.4 update_count

**関数要求**: 棚卸し明細の実カウント数を1件更新する。中断・再開に対応するため1件ずつ即保存

**シグネチャ**:
```
fn update_count(
    conn: &DbConnection,
    req: UpdateCountRequest,
) -> Result<UpdateCountResult, BizError>
```

**前提条件**: トランザクション不要。1件のUPDATEのみで、複数テーブルに跨がらない。autocommit で実行する

**処理ステップ**:

1. **入力バリデーション**
   - req.actual_count < 0 → BizError::ValidationFailed("カウント数は0以上で入力してください")
2. **棚卸し明細の存在確認と親棚卸しの状態チェック**
   - stocktake_repo::find_stocktake_item_with_parent_status(conn, req.stocktake_item_id) → Option\<(StocktakeItem, String)\>（明細 + 親stocktakes.status）
   - None → BizError::NotFound("棚卸し明細が見つかりません: ID {stocktake_item_id}")
   - status != "in_progress" → BizError::StocktakeNotInProgress("この棚卸しは既に完了しています")
3. **actual_count の更新**
   - stocktake_repo::update_stocktake_item_count(conn, req.stocktake_item_id, req.actual_count, now)
   - counted_at = 現在日時
4. **動的差異の計算**
   - product_repo::find_by_product_code(conn, &item.product_code) → product
   - None → BizError::NotFound（通常はFK制約で起きないが安全策）
   - current_difference = product.stock_quantity - req.actual_count
5. UpdateCountResult { success: true, current_difference } を返す

**エラーハンドリング**:
- actual_count < 0 → BizError::ValidationFailed
- 明細が見つからない → BizError::NotFound
- 棚卸しが完了済み → BizError::StocktakeNotInProgress
- 商品が見つからない → BizError::NotFound
- DB更新失敗 → BizError::DatabaseError(DbError)

**設計判断 — 差異の動的計算**:
- architecture/biz-task-specs.md BIZ-06「棚卸し中もCSV取込みで在庫が動くため」（SP-205-09修正）に基づき、差異は stocktake_items.system_stock ではなく現在の products.stock_quantity を使って動的に計算する
- 旧本体の system_stock は明細を作った時点の参考値として記録するのみで、カウント時に更新しない。差異表示に使うのは常に最新の stock_quantity。D-118 の新方式でも system_stock は更新せず、差異は本書冒頭の新契約の「読取り」で求める（時点の正本は [tracking §16-17](../db-design/tracking-system-tables.md) の「system_stockの時点」）

**設計判断 — 操作ログなし**:
- カウント入力は1件ずつ頻繁に行われる操作（4000件の商品を順次カウント）。毎回 operation_log を記録すると大量のログが生成され、有用な操作ログが埋もれる。棚卸しの開始と確定のみ記録する

**入力例**:
```
UpdateCountRequest { stocktake_item_id: 42, actual_count: 8 }
```

**出力例**:
```
Ok(UpdateCountResult {
    success: true,
    current_difference: 2,  // システム在庫10 - 実カウント8 = 2（システムの方が2個多い）
})
```

---

### 20.5 complete_stocktake

**関数要求**: 棚卸しを確定する。全商品の評価原価を記録し、差異がある商品の在庫を補正し、仕入原価総額を算出する

**シグネチャ**:
```
fn complete_stocktake(
    conn: &mut DbConnection,
    req: CompleteStocktakeRequest,
) -> Result<StocktakeResult, BizError>
```

**処理ステップ**:

1. **棚卸しの存在確認と状態チェック**（TX外）
   - stocktake_repo::find_stocktake_by_id(conn, req.stocktake_id)
   - None → BizError::NotFound("棚卸しが見つかりません: ID {stocktake_id}")
   - status != "in_progress" → BizError::StocktakeNotInProgress("この棚卸しは既に完了しています")
2. **未入力チェック**（TX外）
   - stocktake_repo::count_uncounted_items(conn, req.stocktake_id) → uncounted_count
   - uncounted_count > 0 かつ req.force_fill == false → BizError::ValidationFailed("未入力の商品が{uncounted_count}件あります。全商品のカウントを完了するか、force_fill=true で未入力をシステム在庫と同じとみなしてください")
   - uncounted_count > 0 かつ req.force_fill == true → ステップ3で自動入力
3. **TX開始**（conn.transaction()。RAII Drop で自動 ROLLBACK）
3a. **force_fill: 未入力の自動補完**（force_fill == true かつ uncounted_count > 0 の場合のみ）
   - stocktake_repo::list_uncounted_items(&tx, req.stocktake_id) → Vec\<UncountedItem\> { stocktake_item_id, product_code }
   - 各未入力明細について:
     - product_repo::find_by_product_code(&tx, &product_code) → product
     - stocktake_repo::update_stocktake_item_count(&tx, stocktake_item_id, product.stock_quantity, now)
     - ※ 現在のシステム在庫をそのまま actual_count にセット（差異なし扱い）
4. **全棚卸し明細の取得**
   - stocktake_repo::get_stocktake_items_for_complete(&tx, req.stocktake_id) → Vec\<StocktakeItemForComplete\>
   - StocktakeItemForComplete: { id, product_code, actual_count }
   - actual_count が NULL の行は存在しないはず（ステップ2またはステップ3aで保証）
5. **各明細の処理**（adjusted_items, line_centis を蓄積）
   - let mut line_centis: Vec\<i128\> = Vec::new()（商品別の金額、1/100 円）
   - let mut adjusted_items: Vec\<AdjustedItem\> = Vec::new()
   - 各 stocktake_item について:
     a. product_repo::find_by_product_code(&tx, &item.product_code) → product
        - None → BizError::NotFound（FK制約で通常起きないが安全策。INV-8: products物理DELETE禁止により理論上不到達）
     b. let actual_count = item.actual_count（ステップ2/3aで NULL なしを保証済み）
     c. let valuation_cost_price = product.cost_price
     d. stocktake_repo::update_stocktake_item_valuation(&tx, item.id, valuation_cost_price)
     e. line_centis.push(valuation_line_centi(valuation_cost_price, actual_count, price_basis_quantity(product.stock_unit), &item.product_code)?)（§20.5a）
        - ※ 負の原価・数量、中間（× 100）の i128 の桁あふれ → BizError::ValidationFailed（検査と文言は関数の中、§20.5a SPEC-STK-VAL-D5）
     f. let difference = product.stock_quantity - actual_count
     g. difference != 0 の場合:
        - let adjustment_quantity = actual_count - product.stock_quantity（在庫視点: 正=増加、負=減少）
        - inventory_repo::update_stock_quantity(&tx, &item.product_code, actual_count)
        - inventory_repo::insert_movement(&tx, &NewMovement { product_code: item.product_code, movement_type: MovementType::Stocktake, quantity: adjustment_quantity, stock_after: actual_count, reference_type: Some(ReferenceType::Stocktake), reference_id: Some(req.stocktake_id), note: Some(format!("棚卸し補正: システム在庫{} → 実カウント{}", product.stock_quantity, actual_count)) })
        - adjusted_items.push(AdjustedItem { product_code: item.product_code, product_name: product.name, system_stock: product.stock_quantity, actual_count, difference, stock_after: actual_count })
6. **棚卸しヘッダの確定**
   - let total_cost = valuation_total_yen(&line_centis)?（§20.5a。i128 で合計し、円未満を四捨五入して i64 へ検査付きで変換する。合計の桁あふれ・i64 を越える円額 → BizError::ValidationFailed("仕入原価総額の計算でオーバーフローが発生しました")）
   - stocktake_repo::complete_stocktake(&tx, req.stocktake_id, total_cost, now)
   - status = "completed", completed_at = 現在日時
7. **COMMIT**（tx.commit()）
8. **TX外: 操作ログ記録**
   - system_repo::insert_operation_log(conn, &NewOperationLog { operation_type: "stocktake_complete", summary: "棚卸しを確定しました（差異: {adjusted_count}件、仕入原価総額: ¥{total_cost}）", detail_json: Some(detail_json) })
   - detail_json: { "stocktake_id": req.stocktake_id, "total_cost": total_cost, "total_items": all_items.len(), "adjusted_count": adjusted_items.len(), "force_fill_used": req.force_fill && uncounted_count > 0 }
   - 操作ログ記録失敗は警告のみ（業務処理のcommitは完了済み）
9. **TX外: 整合性チェック自動実行（D-2統合）**
   - integrity_service::run_integrity_check(conn) を呼出し
   - 成功 → integrity_result = Some(result)
   - 失敗 → integrity_result = None + eprintln! 警告（整合性チェック失敗で棚卸し確定をロールバックしない）
10. StocktakeResult { total_cost, adjusted_items, total_items: all_items.len(), integrity_result } を返す

**TX境界**: ステップ3〜7が1TX。操作ログ記録（ステップ8）・整合性チェック（ステップ9）はTX外。

**設計判断 — operation_log TX外（architecture/biz-task-specs.md との差異）**: architecture/biz-task-specs.md BIZ-06「棚卸し確定」は operation_log をTX内に記載しているが、第4段階の先決事項D-6「operation_log TX境界: 全てTX外」を BIZ-05/06/07 でも継承する。理由: ログ記録失敗で業務TXがロールバックするのは過剰。BIZ-03/BIZ-04 と同じ方針。例外: BIZ-07 の fix_integrity のみ D-6 の明示例外として操作ログをTX内必須とする（movement を残さないため操作ログが唯一の監査痕跡になる — BIZ-07-D3 / [D-051](../decision-log.md)、36-biz-integrity-check.md §21.4）。run_integrity_check 側は D-6 継承のまま。BIZ-06 自身のTX外方針は不変。

**エラーハンドリング**:
- 棚卸しが見つからない → BizError::NotFound
- 棚卸しが完了済み → BizError::StocktakeNotInProgress
- 未入力ありかつforce_fill=false → BizError::ValidationFailed
- 商品が見つからない（FK違反の異常事態）→ BizError::NotFound
- 仕入原価総額オーバーフロー → BizError::ValidationFailed
- 評価額の計算に負の原価・数量 → BizError::ValidationFailed（§20.5a SPEC-STK-VAL-D5）
- DB操作失敗 → RAII自動ROLLBACK → BizError::DatabaseError(DbError)

**設計判断 — apply_stock_change を使わない理由**:
- 棚卸し確定は「差異補正」であり、通常の在庫変動（入庫/出庫/販売）とは性質が異なる。apply_stock_change は find_by_product_code → stock計算 → update_stock_quantity → insert_movement の4ステップを内部で実行するが、complete_stocktake では既に product を取得済み（ステップ5a）であり、stock_after も actual_count として確定済み。apply_stock_change を使うと同じ商品を2回 find_by_product_code する無駄が生じる
- また、棚卸し補正の stock_after は「actual_count そのもの」であり、「現在在庫 + 変動量」の計算ではない。apply_stock_change の stock_after 算出ロジック（INV-2）とは意味が異なる
- よって、inventory_repo::update_stock_quantity + inventory_repo::insert_movement を直接呼び出す

**設計判断 — total_cost のオーバーフロー対策**:
- worst case: 4000商品 × 原価999,999円 × 在庫9,999個 = 約40兆円。中間（原価 × 数量 × 100）と1/100円の合計は i128 で checked に計算し、最後の円額だけを i64 へ検査付きで変換する（§20.5a SPEC-STK-VAL-D2 / D5）。worst case は i64 の上限（約9.2 × 10^18）に収まるが、万一の不正データに備えて検査する
- 実運用では原価平均500円 × 在庫平均20個 × 4000商品 = 4,000万円程度（i64で余裕）

**設計判断 — force_fill パラメータ**:
- 年末棚卸しは10月〜大晦日の長期作業。全4000商品のカウントが現実的に完了しない場合がある（特に端切れ布やボタンの小物）
- force_fill=true で「未入力の商品は現在のシステム在庫をそのまま確定」を許可する。差異なしとして処理されるため、カウント漏れがあっても棚卸しを完了できる
- force_fill=false がデフォルト（CMD層が渡す）。UI-10の確定ボタンで未入力がある場合に確認ダイアログを表示し、利用者が「未入力をシステム在庫と同じとみなす」を選択した場合のみ force_fill=true で再呼出し

**設計判断 — valuation_cost_price のタイミング**:
- 確定時の products.cost_price を使用する。棚卸し開始時ではない。理由: 棚卸しは数ヶ月に及ぶ長期作業であり、その間に原価が変わることがある。税理士報告用の仕入原価総額は「確定時点の原価」が正しい
- DB_DESIGN.md に「確定時にproducts.cost_priceの値をコピーしてくる」と明記済み

**入力例**:
```
CompleteStocktakeRequest { stocktake_id: 1, force_fill: false }
```

**出力例**:
```
Ok(StocktakeResult {
    total_cost: 42350000,  // ¥42,350,000
    adjusted_items: [
        AdjustedItem {
            product_code: "4976383262108",
            product_name: "ﾊﾏﾅｶ ｱﾐｱﾐ極太 col.42",
            system_stock: 15,
            actual_count: 12,
            difference: 3,
            stock_after: 12,
        },
        AdjustedItem {
            product_code: "HZ-0012",
            product_name: "ヘアゴム ブラック M",
            system_stock: 5,
            actual_count: 7,
            difference: -2,
            stock_after: 7,
        },
    ],
    total_items: 3847,
})
```

---

### 20.5a 評価額の計算（価格の基準数量と店の丸め）

契約 ID: SPEC-STK-VAL-D1〜D6（2026-09-25。Backlog「棚卸しの評価額が価格の基準数量を持たない」「評価額の丸めを店の規則に合わせる」起源）。旧本体の確定（§20.5 ステップ5〜6）と新方式の確定（上の「確定・legacyの取消の保留」）は、同じ関数で評価額を求める。関数は `stocktake_service` の非公開関数とする。

**シグネチャ**:
```
fn price_basis_quantity(unit: ProductStockUnit) -> i64
fn valuation_line_centi(cost_price: i64, quantity: i64, basis: i64, product_code: &str) -> Result<i128, BizError>
fn valuation_total_yen(lines: &[i128]) -> Result<i64, BizError>
```

**処理ステップ**:

1. 各明細で、確定時評価原価（valuation_cost_price）・評価数量・商品の在庫単位の基準数量から、商品別の金額（1/100 円、i128）を `valuation_line_centi` で求める
2. `valuation_total_yen` が商品別の金額を i128 の checked_add で合計する
3. 同じ関数が合計を円未満で四捨五入し、円額を i64 へ検査付きで変換して total_cost（円）とする

- **SPEC-STK-VAL-D1 価格の基準数量**: 商品の selling_price / cost_price は、在庫数量で「価格の基準数量」ぶんに対する円の価格である。基準数量は在庫単位で決まる: `pcs` = 1（1 個あたり）、`cm` = 100（1 m あたり）。商品ごとの列は持たない。`price_basis_quantity` は `ProductStockUnit` の全 variant を網羅する match とし、wildcard arm を置かない（単位を足すと compile error になり、基準数量を決めずに単位を足せない）。
  - 理由: 店は長さ商品の残り・仕入れ伝票・値札をすべて m で扱い、値札は 1 m あたりである。レジでも数量 1 = 1 m で打てる（未運用）。出典は [project-memory](../project-memory.md) の Store Premises Facts（2026-09-14 / 2026-09-15）。在庫は cm の整数で持つ（[31](31-biz-inventory-service.md) の整数契約）。基準数量が単位で決まるため、利用者が商品ごとに基準数量を入力して誤る入口を作らない。
  - 不採用: 商品ごとの基準数量の列（migration・DTO・商品フォーム・商品 CSV の追加が要り、長さ商品ごとに 100 を入れる操作を利用者に任せる。今ある単位では単位と基準数量が一対一）。原価を 1 cm あたりの小数で持つ（伝票・値札の m 単価と食い違い、原価の列に小数の型が要る）。
  - 見直す条件: 単位の拡張で、単位だけでは基準数量が決まらない商品（箱で仕入れて 1 個ずつ売る商品の原価を箱あたりで記録する等）が店の回答で確かめられたとき。
- **SPEC-STK-VAL-D2 金額の表現**: 中間（原価 × 数量 × 100、商、余り）・商品別の金額（1/100 円）・その合計は i128 で計算し、最後の円額だけを i64 へ検査付きで変換する。原価と数量は i64 のため、その積は i128 に必ず収まる（第 1 段の乗算は plain の `*` とし、その旨の comment を 1 行置く）。× 100 と合計の加算は checked とする。負の値を含まない入力で旧式（原価 × 数量の i64 の積和）が確定できたものは、新式でも確定できる。`pcs` だけなら総額は旧式と一致する（商品別の金額が `原価 × 数量 × 100` で、合計が旧式の総額 × 100 になるため）。`cm` を含めば総額は旧式より小さい。中間を i64 に限る案は、旧式が確定できた値（`pcs` の原価 92,233,720,368,547,759 円・数量 1 等）を × 100 で桁あふれさせるため採らない。浮動小数（f32 / f64）を使わない。理由: 2 進の浮動小数は 0.005 の境界を正確に表せず、四捨五入を誤る（例: 1.005 は 1.00499… として保持され、小数第 2 位への四捨五入が 1.00 になる）。10 進小数の crate は追加しない（整数の分子と分母で正確に計算できる）。
- **SPEC-STK-VAL-D3 商品別の金額**: `valuation_line_centi` は `cost_price × quantity × 100 ÷ basis` を 1/100 円未満で四捨五入した値を返す。四捨五入は割り算の正確な値に対して行う（商 q・余り r で `2r >= basis` なら q + 1）。これは店の「商品別の金額を小数第 3 位で四捨五入して小数第 2 位まで持つ」と同じ値になる。quantity は旧本体では actual_count、新方式では `max(補正後現在庫, 0)`。今ある単位（基準数量 1 と 100）では割り切れるため実際の丸めは起きないが、段として持つ。
- **SPEC-STK-VAL-D4 総額**: `valuation_total_yen` は商品別の金額の合計（1/100 円）を円未満で四捨五入した円の整数を返す。`stocktakes.total_cost`（INTEGER、円）・StocktakeResult.total_cost（i64）・操作ログの「仕入原価総額: ¥{total_cost}」の型と表示は変えない。
- **SPEC-STK-VAL-D5 入力の検査**: cost_price か quantity が負なら、`valuation_line_centi` が評価額を求めず `BizError::ValidationFailed("評価額を計算できません。原価か数量が負の値です（商品 {product_code}）")` を返す（検査と文言は関数の中の 1 か所。呼出し側は商品コードを渡すだけ）。中間の × 100 か合計の加算が i128 を越える場合、または四捨五入した円額が i64 を越える場合は、既存の `BizError::ValidationFailed("仕入原価総額の計算でオーバーフローが発生しました")` を返す（i64 への変換の失敗もこの文言に固定する。既存の overflow test〈原価 `i64::MAX / 2 + 1`・数量 2〉は新式では変換で初めて error になる）。どちらも確定の TX を ROLLBACK し、header・明細・在庫を変えない。呼出し元は `price_basis_quantity` の値（1 以上）を basis に渡す。
- **SPEC-STK-VAL-D6 非遡及**: 確定済みの total_cost と valuation_cost_price は再計算しない（[棚卸しの数の置き場と在庫の求め直しの ADR](../adr/2026-10-16-stocktake-count-placement.md) SPEC-STK-CNT-D6 と同じ）。本契約より前に確定した記録の total_cost は旧式（原価 × 数量の整数積和）のまま残る。本契約は本番開始前に入るため、本番の記録に旧式は現れない（[初導入の前提](../project-memory.md)）。

**範囲の外（既知の不整合、Backlog）**: 棚卸し記録詳細のロス原価（画面が補正差異の絶対値に評価原価を掛ける）は基準数量をまだ入れていない。長さ商品では 100 倍になる（BIZ へ移すのは棚卸しの再開〈⑤〉）。入庫の原価小計・原価合計、廃棄のロス原価、手動販売の金額の初期値は [共通規則](10-common-rules.md) SPEC-UNIT-D6・D7 が基準数量で割る。確定後に商品の在庫単位を変えると、記録詳細の数量表示とロス原価は現在の単位で計算される。

**単位の拡張（D-113）**: 単位が 12 種でも基準数量は単位から決まる（個数の 10 種 = 1、`m`・`cm` = 100。[共通規則](10-common-rules.md) SPEC-UNIT-D1・D4）。本節の `price_basis_quantity`・`valuation_line_centi`・`valuation_total_yen` の計算は、`biz::unit_amount` の `price_basis_quantity`・`cost_line_centi`・`cost_total_yen` が同じ値で持つ（SPEC-UNIT-D6。原価の引数は 1/100 円で、呼ぶ側が `i128::from(円) * 100` を渡す）。原価が 1/100 円になった後（proposed・未実装、原価の lane、D-113。`決定（owner、D-113 J2）`）は確定時評価原価も 1/100 円（`valuation_cost_price_centi`）で、商品別の金額は `原価(1/100 円) × 数量 ÷ 基準数量` を 1/100 円未満で四捨五入する（円の原価なら今と同じ値）。棚卸し記録詳細のロス原価は同じ関数を使う（BIZ へ移すのは棚卸しの再開〈⑤〉）。棚卸しの実数の入力は、m の商品では m で受けて cm に直す（SPEC-UNIT-D3。棚卸しの再開〈⑤〉）。今の評価額の呼出しと確定の結果（`AdjustedItem`）の構築は旧本体 `legacy_complete_stocktake`（test だけが呼ぶ）の中にあり、棚卸しは停止中（§20.0 SPEC-STOP-D1）なので、新方式の確定は棚卸しの再開（⑤、SPEC-STOP-D6）が `biz::unit_amount` の関数と商品の `stock_unit` で作る（確定の結果の数量を m で出す〈SPEC-UNIT-D3 の表示する所の表の 7〉、補正の note を D3 の形で書く）。

---

### 20.6 get_stocktake_progress

**関数要求**: 現在の棚卸しの進捗状況を返す。棚卸し画面の進捗バー表示用

**シグネチャ**:
```
fn get_stocktake_progress(
    conn: &DbConnection,
    stocktake_id: i64,
) -> Result<StocktakeProgress, BizError>
```

**処理ステップ**:

1. **棚卸しの存在確認**
   - stocktake_repo::find_stocktake_by_id(conn, stocktake_id)
   - None → BizError::NotFound("棚卸しが見つかりません: ID {stocktake_id}")
2. **進捗集計**
   - stocktake_repo::get_stocktake_progress(conn, stocktake_id) → StocktakeProgress { total_items, counted_items, uncounted_items }
3. StocktakeProgress { stocktake_id, total_items, counted_items, uncounted_items } を返す（status は stocktake から取得して付与）

**エラーハンドリング**:
- 棚卸しが見つからない → BizError::NotFound
- DB読み取り失敗 → BizError::DatabaseError(DbError)

---

### 20.6a get_stocktake_record

以下のlive在庫基準・開始時snapshotの説明は、現行実装の表示用。D-118 の新方式では完了が補正の movement を作らず、差異は本書冒頭の新契約の「読取り」の定義（効く計数の値 − その計数に入っている記録だけから求めた帳簿）で返す。

D-118 の新方式は旧 header を持たない（棚卸しのある DB は作り直す。ADR SPEC-STK-CNT-D10）ので、header に移行の版を足さない。過去評価額を再算出しない。

**関数要求**: 棚卸し記録詳細を wire DTO として返す。[31-biz-inventory-service.md](31-biz-inventory-service.md) §12.6a 業務記録詳細 read 関数と同じ read-only パターンで、movements への source link 補完と NotFound 変換を BIZ が担う。棚卸し詳細画面（`/stocktake/records/$stocktakeId`、[65-inventory-record-traceability.md](65-inventory-record-traceability.md) §65.3 / §65.5 / §65.10 slice 4c）用

**シグネチャ**:
```
fn get_stocktake_record(
    conn: &DbConnection,
    stocktake_id: i64,
) -> Result<StocktakeRecordDetail, BizError>
```

**StocktakeStatus enum**（新設、BIZ-06 所有。D-061 有限 IPC 値の generated union）:
- InProgress（`in_progress`）/ Completed（`completed`）の 2 値。DB CHECK（[tracking-system-tables.md](../db-design/tracking-system-tables.md) 16-17）により 2 値保証
- 既存 `Stocktake` wire 型の `status: String` は既存 command の wire 互換のため変更しない（本 DTO のみ enum を用いる）

**StocktakeRecordDetail構造体**（wire DTO。BIZ-06 が所有する）:
- id: i64, started_at: String, completed_at: Option\<String\>, status: StocktakeStatus, total_cost: Option\<i64\>（棚卸し時原価総額。in_progress は None）
- item_count: i64（対象商品数）, corrected_count: i64（補正明細数）
- items: Vec\<StocktakeRecordDetailItem\>（IO 型を再利用、[20-io-product-repo.md](20-io-product-repo.md) §2.11a）
- movements: Vec\<MovementRecord\>（source 補完済み）

**処理ステップ**:
1. stocktake_repo::get_stocktake_record_detail(conn, stocktake_id) を呼ぶ。IO 層の NotFound は「棚卸し記録が見つかりません」を含む BizError::NotFound、その他の IO エラーは BizError::DatabaseError に変換する
2. header.status の raw TEXT を StocktakeStatus へ変換する（DB CHECK により 2 値保証のため、想定外値は BizError::DatabaseError で fail-fast）
3. movements の各行に `biz::inventory_service` の共有関数 `resolve_movement_source`（[32-biz-csv-import-service.md](32-biz-csv-import-service.md) §15.6a で導入済みの `pub(crate)` re-export 経由）で source(label, route) を補完する（label/route 規則の独自複製を作らない）
4. corrected_count = items の件数を設定し、StocktakeRecordDetail を構成して返す

**エラーハンドリング**:
- 棚卸し不存在 → BizError::NotFound（「棚卸し記録が見つかりません」）
- DB 読み取り失敗 / 想定外 status 値 → BizError::DatabaseError

**設計ノート（差異の定義）**: 詳細画面の「差異」は補正 movement の quantity（§20.5 の adjustment_quantity = actual_count - 確定時 stock_quantity）を正とする。`system_stock - actual_count` の snapshot 差は、棚卸し中の CSV取込み等（SP-205-09、§20.4 の動的差異と同じ理由）で補正実績と乖離し得るため、表示上の差異として採用しない。

---

### 20.7 非目的

このモジュールが**やらないこと**を明示する。責務境界の誤解を防ぐため。

| やらないこと | 理由 | 責務を持つモジュール |
|------------|------|-----------------|
| 棚卸し中のCSV取込み処理 | 棚卸し中もCSV取込みは許可（SP-205-09）。差異は動的計算で吸収 | BIZ-03 |
| 棚卸し中の新規商品登録時のstocktake_items自動追加 | 商品登録のTX内で実施済み | BIZ-01（create_product ステップ6） |
| 整合性チェック（stock_quantity突合） | 棚卸し確定後の自動実行は第5段階で統合 | BIZ-07（PR-5で実装） |
| 棚卸し画面の表示・フィルタ・ページング | UI層の責務 | UI-10 |
| 物理DELETE | 棚卸しの削除はサポートしない。completedのまま保持 | — |
| 棚卸しの「中止」（途中破棄） | 初期バージョンでは不要。中断→再開で対応 | 将来拡張 |
| 操作ログのカウント入力ごとの記録 | 頻度が高すぎて有用なログが埋もれる | — |
| 棚卸し明細の一覧取得の業務ルール | 一覧取得はBIZ層の `get_stocktake_items` が `stocktake_repo::list_stocktake_items` + 進捗集計を束ねる薄いwrapperとして提供（2026-04-13 `882cec6` でCMD直ラップからBIZ経由に変更、[42-cmd-sales-stocktake.md](42-cmd-sales-stocktake.md) §22.5 参照）。フィルタ・ページングの実体はIO層 | BIZ-06 wrapper + stocktake_repo |

---

### 20.8 対応不変条件

現行実装と新方式で算式を区別する。新方式のactual_count非負は補正後現在庫の非負を保証しない。

| 不変条件 | 本モジュールでの対応 |
|---------|-----------------|
| INV-2: stock_after算出責任 | 現行はステップ5gでstock_after=actual_count。新方式はBIZが補正量N-Lとstock_after=確定直前現在庫+(N-L)をchecked算出し、IOへ渡す。後続移動なしの場合だけstock_after=Nになる |
| INV-3: 負在庫ポリシー | 現行はactual_count非負へ上書きする。D-118 の新方式は計数（0 以上）の後の記録で在庫が負になり得る。負在庫を許して表示し、評価数量だけ `max(在庫, 0)` とする |
| INV-8: products物理DELETE禁止 | 本モジュールは products を UPDATE のみ（stock_quantity）。DELETE 操作なし。find_stocktake_eligible_products は is_discontinued フラグで絞り込む |
| INV-1a: 入力値は常に正数 | update_count で actual_count >= 0 を検証。complete_stocktake の adjustment_quantity は正負どちらもあり得る（棚卸し補正は INV-1a の対象外。INV-1a は Request 構造体の quantity フィールドに適用され、棚卸し補正の adjustment_quantity はBIZ層内部で算出される値） |

---

### 20.9 stocktake_repo への依存（新規関数）

以下は現行依存型の記録。新方式では冒頭の入出力と20のproposed節へ切り替え、Nだけの確定型や数量/時刻だけの保存型を流用しない。L・kind・flag・証拠・request ID・版のproducer/consumerを同一runtime変更で揃える。

BIZ-06 が使用するIO関数のうち、既存の find_active_stocktake / insert_stocktake_item 以外に必要な新規関数:

| 関数 | 用途 | シグネチャ |
|------|------|---------|
| insert_stocktake | 棚卸しヘッダINSERT | `fn insert_stocktake(conn: &DbConnection, started_at: &str) -> Result<i64, DbError>` |
| find_stocktake_by_id | 棚卸しIDで取得 | `fn find_stocktake_by_id(conn: &DbConnection, id: i64) -> Result<Option<Stocktake>, DbError>` |
| find_stocktake_eligible_products | 棚卸し対象商品の取得 | `fn find_stocktake_eligible_products(conn: &DbConnection) -> Result<Vec<ProductForStocktake>, DbError>` |
| find_stocktake_item_with_parent_status | 明細+親ステータス取得 | `fn find_stocktake_item_with_parent_status(conn: &DbConnection, item_id: i64) -> Result<Option<(StocktakeItem, String)>, DbError>` |
| update_stocktake_item_count | カウント更新 | `fn update_stocktake_item_count(conn: &DbConnection, item_id: i64, actual_count: i64, counted_at: &str) -> Result<bool, DbError>` |
| count_uncounted_items | 未入力件数 | `fn count_uncounted_items(conn: &DbConnection, stocktake_id: i64) -> Result<i64, DbError>` |
| get_stocktake_progress | 進捗集計 | `fn get_stocktake_progress(conn: &DbConnection, stocktake_id: i64) -> Result<StocktakeProgress, DbError>` |
| list_uncounted_items | 未入力明細の一覧 | `fn list_uncounted_items(conn: &DbConnection, stocktake_id: i64) -> Result<Vec<UncountedItem>, DbError>` |
| get_stocktake_items_for_complete | 全明細取得（確定用） | `fn get_stocktake_items_for_complete(conn: &DbConnection, stocktake_id: i64) -> Result<Vec<StocktakeItemForComplete>, DbError>` |
| update_stocktake_item_valuation | 評価原価記録 | `fn update_stocktake_item_valuation(conn: &DbConnection, item_id: i64, valuation_cost_price: i64) -> Result<(), DbError>` |
| complete_stocktake | ヘッダ確定更新 | `fn complete_stocktake(conn: &DbConnection, stocktake_id: i64, total_cost: i64, completed_at: &str) -> Result<(), DbError>` |

**ProductForStocktake構造体**: product_code: String, stock_quantity: i64, cost_price: i64, is_discontinued: bool

**StocktakeItem構造体**: id: i64, stocktake_id: i64, product_code: String, system_stock: i64, actual_count: Option\<i64\>, counted_at: Option\<String\>

**UncountedItem構造体**: stocktake_item_id: i64, product_code: String

**StocktakeItemForComplete構造体**: id: i64, product_code: String, actual_count: i64（force_fill後はNULLなしを保証。i64で直接取得）

---

### 20.10 BizError 追加バリアント

BIZ-06 で新たに使用する BizError バリアント:

```
enum BizError {
    ValidationFailed(String),     // 既存
    ValidationFailedAt { message: String, field: String }, // pagination field を保持するBIZ validation
    NotFound(String),             // 既存 — 棚卸し/明細/商品の不存在
    DuplicateProductCode(String), // 既存（本モジュールでは不使用）
    DatabaseError(DbError),       // 既存
    ImportError(String),          // 既存（本モジュールでは不使用）
    IdempotencyConflict(String),  // 既存（本モジュールでは不使用）
    StocktakeInProgress(String),  // ← 新規追加: 進行中の棚卸しが既に存在
    StocktakeNotInProgress(String), // ← 新規追加: 棚卸しが既に完了済み
}
```

**StocktakeInProgress**: start_stocktake で進行中チェック失敗時。CMD層では CmdError { kind: "stocktake_in_progress" } に変換

**StocktakeNotInProgress**: update_count / complete_stocktake で完了済み棚卸しへの操作時。CMD層では CmdError { kind: "stocktake_not_in_progress" } に変換

**ValidationFailedAt**: get_stocktake_items の page / per_page 下限違反時。
CMD層では `kind="validation"` と BIZ の message / field をそのまま保持する。

---

### 更新履歴

| 日付 | PR | 内容 |
|------|-----|------|
| 2026-04-12 | PR #21 | 初版作成（BIZ-06 stocktake_service 4関数 + stocktake_repo 12関数） |
| 2026-04-12 | PR #21 | StocktakeItemForComplete を 5フィールド（IO設計書版）→ 3フィールド（id/product_code/actual_count）に統一。BIZ設計書を採用した理由: complete_stocktake の処理ステップ5で必要なのは更新対象IDと商品コードと実カウントのみで、system_stock や counted_at は product_repo::find_by_product_code から取得する方が責務分離として正しい |
| 2026-08-27 | （本 PR） | §20.6a get_stocktake_record（棚卸し記録詳細 read、65 slice 4c）+ StocktakeStatus enum 新設 + 差異定義（補正 movement 正）の設計ノートを追加 |
| 2026-08-30 | docs 整合性衛生 batch（本 PR） | §20.3 に棚卸しカウント対象の母集団（issue #91 owner 回答 2026-08-22）を設計判断として追加 |
| 2026-09-24 | ㉘ runtime ①（本 PR） | §20.0 現行buildの一時停止（SPEC-STOP-D1〜D3、BIZ-06 停止文言の正本）を追加。§20.3〜§20.5 は旧本体 `legacy_*` の記述と明記 |
| 2026-09-25 | 棚卸しの評価額（本 PR） | §20.5a 評価額の計算（SPEC-STK-VAL-D1〜D6: 価格の基準数量、1/100 円の商品別の金額、円未満を四捨五入した総額）を追加。§20.2 / §20.5 と新方式の total_cost の式を §20.5a へ寄せる |
