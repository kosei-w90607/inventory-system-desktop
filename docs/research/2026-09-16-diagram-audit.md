# 現行図面の同期・設計点検（2026-09-16）

> **入口**: [現行構造・画面遷移・業務フロー](../diagrams/current-system.md)、[ER図](../inventory_system_erd.html)、[追加の横断業務検証](../diagrams/cross-feature-verification.md)
> **調査対象**: `9d6799ffb3dbe9f394c3e35858875c3baee685d5` の製品コード。図面・説明文書だけを更新し、製品挙動は変更していない。

## 判定と範囲

ERの欠落を補うだけでなく、画面の戻りとデータの時間軸を実装まで追った結果、棚卸しの時点整合に実害を再現できる問題が見つかった。DB内部の数値が一致することと、実在庫を正しく表すことは別である。この調査を根拠にアプリ全体を安全と判定することはできない。

| ID | 分類 | 結果 | 扱い |
|---|---|---|---|
| STK-1 | 設計上の問題、P1 | カウント後の販売を確定が打ち消す。実BIZ関数と合成DBで再現 | 製品の設計・修正判断が必要。図は現在の動作を明示 |
| STK-2 | 設計上の問題、P1候補（数量不一致は再現済み） | カウントに織り込まれた過去販売を、確定後の遅いCSVが再度減算する | A-1追加検証のXFA-T2。基準時点と取込み済み境界の設計が必要 |
| NAV-1 | 隣接契約の不整合、P2 | 戻り先のselectedを在庫照会が解除する。実装・既存テストで確認 | route/searchの修正候補。今回runtimeは変更しない |
| DATA-2 | 採用済み設計の限界 | 共有JANの売上を先頭SKUへ割当てる。実装は現行仕様どおり | 店舗で必要な粒度に対する再検討候補。新たな仕様変更を決定しない |
| DOC-1 | 文書の更新漏れ | ER、冪等性列、navigation一覧、個別図の転記不一致 | この変更で同期 |
| DOC-2 | 文書同士の意味の不一致 | 棚卸しsystem_stockの時点、CSV失敗時の説明 | 本文の一方を追認せず、下記に残す |

実店舗DB・CSV・レシート・バックアップは参照していない。Windows native UI、レジ、復元の実機動作の再検証は対象外。既存の全業務テストを実行したという主張もしない。

## STK-1 カウント後の入出庫を棚卸し確定が打ち消す

**P1 / confirmed（合成DBの実処理で再現）。**

棚卸し中に在庫が動くことを許可する設計なのに、`actual_count` は数えた時点のまま保存され、確定時に現在在庫をその過去値へ置換する。

| 順序 | 操作 | 実在庫の想定 | 保存済みactual_count | アプリ在庫 |
|---|---|---:|---:|---:|
| 1 | 合成商品を初期在庫10で用意、初期movementも記録 | 10 | 未入力 | 10 |
| 2 | `start_stocktake` → `update_count(10)` | 10 | 10 | 10 |
| 3 | `create_manual_sale` で2個販売 | 8 | 10 | 8 |
| 4 | 再カウントせず `complete_stocktake(force_fill=false)` | 8 | 10 | **10** |

実測出力（テスト件数ではなく合成シナリオの観測値）:

```text
count=10, later_sale=2, stock_before_complete=8,
stock_after_complete=10, stocktake_correction=2,
integrity_mismatches=0; physical_expected=8
```

**根拠**:

- [棚卸しBIZ設計 §20.4/20.5](../function-design/35-biz-stocktake-service.md) は棚卸し中のCSV取込みを許し、現在在庫と保存済み実数の差を使って確定する。
- [update_count / complete_stocktake](../../src-tauri/src/biz/stocktake_service.rs) は `counted_at` を記録するが、確定時にその後の増減を実数へ加味しない。`actual_count - product.stock_quantity` を新たなmovementとして追加する。
- [stocktake_repo](../../src-tauri/src/db/stocktake_repo.rs) の `get_stocktake_items_for_complete` は確定用にid・商品・actual_countを取得する。時点を合わせるためのmovement境界を使っていない。
- このため、販売後の8を10に戻す補正movementが加わり、在庫数とmovement合計は両方10になる。[整合性チェック](../../src-tauri/src/biz/integrity_service.rs) では検出できない。

**影響**: カウント後に入出庫がある長期棚卸しで在庫数・評価額を誤る。再カウントが確定直前まで行われ、以後の在庫変動がなければ、この例は発生しない。現場で既に誤差が発生しているかは未調査。

**是正候補（candidate）**: カウントの基準時点とその後の入出庫を確定時へ繰り越す方式、またはカウント後に動いた商品を再カウント必須にする方式を比較する。取込み日時と実際の販売日が異なるCSV、同日の追加取込み・rollback、再カウント、評価日時を含めて設計する必要がある。単に `system_stock` との差へ式を置換するだけでは、開始時点とカウント時点の差を解消しない。ownerの業務判断と別の製品変更計画を経て是正する。

### 再現の方法

一時的な `#[cfg(test)]` moduleを `stocktake_service.rs` に置き、次の経路で現行BIZ関数を実行した。最初のintegration test形式はBIZがprivateのためコンパイルできず、crate内のunit test形式へ変更した。製品moduleの公開範囲は変更していない。検証後、一時moduleを除いて元ファイルとのbyte一致を確認した。

```bash
cargo test --offline --lib diagram_audit_probe -- --nocapture
```

以下は**現行の不正な結果の再現用**。望ましい仕様を固定する回帰テストではなく、製品の通常テストには追加していない。再調査時は隔離checkoutに置き、製品の修正には別途期待値8を守る回帰テストを用意する。

```rust
#[cfg(test)]
mod diagram_audit_probe {
    use crate::{biz::{inventory_service, stocktake_service}, db};

    #[test]
    fn diagram_audit_req205_count_then_sale_then_complete() {
        let dir = tempfile::tempdir().unwrap();
        let mut conn = db::init_database(
            dir.path().join("synthetic.db").to_str().unwrap()
        ).unwrap();
        conn.execute_batch("INSERT INTO products
            (product_code,name,department_id,selling_price,cost_price,
             stock_quantity,created_at,updated_at)
            VALUES ('AUDIT-COUNT','合成商品',1,100,50,10,
                    '2026-09-16T00:00:00','2026-09-16T00:00:00');
            INSERT INTO inventory_movements
            (product_code,movement_type,quantity,stock_after,created_at)
            VALUES ('AUDIT-COUNT','receiving',10,10,'2026-09-16T00:00:00');"
        ).unwrap();
        let started = stocktake_service::start_stocktake(&mut conn).unwrap();
        let item_id = conn.query_row(
            "SELECT id FROM stocktake_items WHERE product_code='AUDIT-COUNT'",
            [], |r| r.get(0)
        ).unwrap();
        stocktake_service::update_count(&conn,
            &stocktake_service::UpdateCountRequest {
                stocktake_item_id: item_id, actual_count: 10
            }
        ).unwrap();
        let sale = serde_json::from_value::<inventory_service::ManualSaleCreateRequest>(
            serde_json::json!({
                "idempotency_key":"diagram-audit-sale", "sale_date":"2026-09-16",
                "reason":"other", "note":"合成データのみ",
                "items":[{"product_code":"AUDIT-COUNT","quantity":2,"amount":200}],
                "confirmation_token":null
            })
        ).unwrap();
        assert!(inventory_service::create_manual_sale(&mut conn, sale).unwrap().created);
        let before: i64 = conn.query_row(
            "SELECT stock_quantity FROM products WHERE product_code='AUDIT-COUNT'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(before, 8);
        let result = stocktake_service::complete_stocktake(&mut conn,
            &stocktake_service::CompleteStocktakeRequest {
                stocktake_id: started.stocktake_id, force_fill: false
            }
        ).unwrap();
        let after: i64 = conn.query_row(
            "SELECT stock_quantity FROM products WHERE product_code='AUDIT-COUNT'",
            [], |r| r.get(0)
        ).unwrap();
        let correction: i64 = conn.query_row(
            "SELECT quantity FROM inventory_movements
             WHERE product_code='AUDIT-COUNT' AND movement_type='stocktake'",
            [], |r| r.get(0)
        ).unwrap();
        assert_eq!(after, 10); // 観測した不正な結果。望ましい実在庫は8。
        assert_eq!(correction, 2);
        assert_eq!(result.integrity_result.unwrap().mismatch_count, 0);
        println!("before={before}, after={after}, correction={correction}; expected=8");
    }
}
```

## STK-2 棚卸し確定後に届く過去販売を二重に減算する

A-1の [横断モデル検証 XFA-T2](../diagrams/cross-feature-verification.md#xfa-t2-棚卸しに含まれた過去の販売を遅いcsvが再度減算する) で追記した所見。初期10 → POSで2販売（現物8、DB10）→ 8をカウント → 確定でDB8 → その販売CSVを取り込むとDB6になる。内部整合性は不整合0。

STK-1の候補にある「確定直前の再カウント」だけでは、既にカウントに含まれた販売の遅い反映を防げない。したがってSTK-1と独立した是正条件・反例を保持し、一方の解消を他方の解消に読み替えない。候補はカウントの基準時点と取込み済み/未取込みイベントの境界を明確にすること。方式は未採用であり、実店舗での発生は未調査。

## NAV-1 在庫変動履歴からの戻りで商品選択が失われる

**P2 / confirmed（生成URL・受け側の実装・既存テストの照合）。**

`StockMovementsPage` の「在庫照会へ戻る」は `/stock?selected=<productCode>` を作る。`q` や `status` は送らない。在庫照会は未指定の `status` を `all`、`q` を空として扱い、この組合せを検索前と判定するため、検索も詳細取得もせず `selected` を解除する。

- 出口: [StockMovementsPage](../../src/features/stock-movements/StockMovementsPage.tsx) の `Link to="/stock" search={{ selected: productCode }}`。
- 入口: [StockInquiryPage](../../src/features/stock-inquiry/StockInquiryPage.tsx) のsearch既定値と [useStockInquiry](../../src/features/stock-inquiry/hooks/useStockInquiry.ts) の `isAllEmpty` / detail enabled / selected clear。
- 設計の交差: [66 §66.5](../function-design/66-ui-stock-movements.md) は上記戻り先、[58 §58.3/58.5](../function-design/58-ui-stock-inquiry.md) は検索前の取得抑止を指定している。各局所仕様を守っても両者を接続すると復帰できない。
- 既存テスト `REQ-301: 検索前（status=all + q 空）に selected 付き URL → clear + detail 走らせない` を実行し、現在の受け側動作を確認した。

```bash
npm exec --offline -- vitest run \
  src/features/stock-inquiry/hooks/useStockInquiry.test.tsx \
  -t '検索前.*selected'
```

**影響**: 戻った利用者が検索と商品選択をやり直す。データの破壊ではない。Windows UIで実際にクリックする往復は今回未検証。

**是正候補（candidate）**: 元の在庫照会条件を保持して戻す。直接アクセス時には商品コードで検索可能なfallbackを設計する。受け側の検索前ガードだけを撤去せず、戻りの意図と契約を合わせてからroute/searchの変更として検証する。

## DATA-2 共有JANの売上は個別SKUを識別できない

**設計限界 / confirmed（仕様どおり）。現時点で新規不具合としては扱わない。**

ERで `products.jan_code` がUNIQUEではなく、PLU slotと商品の関係も単一商品へのFKでないことが見える。[master定義](../db-design/master-tables.md) は色・サイズで同じJANを共有する業務を認めている。

[商品別CSV設計](../function-design/32-biz-csv-import-service.md) と [parse実装](../../src-tauri/src/biz/csv_import_service/parse.rs) は複数一致時に `product_code ASC` の先頭を採用しwarningを出す。選ばれた商品の `pos_stock_sync` がtrueなら、その商品だけの在庫を減らす。falseでも商品別売上の帰属先は先頭商品となる。

**再検討条件**: グループJANの商品について色・サイズ別の在庫や売上をPOSから正確に把握したい場合。入力データに区別がないため、DBや図の線を増やすだけでは解決しない。現在の運用がどの粒度までを要求するか、単位拡張・POS運用の設計時に再確認する候補とする。

## DOC-1 この変更で同期した文書

- ER: 日報系・CSVエラー・PLU slot・migration管理表、全カラム、FKとNULL許容、CHECK値の転記、重複線を同期した。現在ない取消・訂正用列は描かない。
- テーブル定義: 業務記録ヘッダの冪等性列をmigration設計と同期した。
- 画面: 旧mockupを初期提案資料と明示し、現行のnavigation・page route・記録詳細・戻りを別の図にした。専用一覧や結果画面からのリンクを、実在しないまま描かなかった。
- 上位設計: 一括価格改定・取引先管理・入出庫履歴の一覧漏れと現行図の入口を同期した。
- 個別図: CSV reducerの全stateからのreset、日次/月次hookの返却形・派生値名を同期した。

## DOC-2 残る文書の意味の不一致

| 対象 | 不一致 | 今回の扱い |
|---|---|---|
| `stocktake_items.system_stock` | [DB定義](../db-design/tracking-system-tables.md) は「カウント時点」、[BIZ設計](../function-design/35-biz-stocktake-service.md) と実装は明細作成時の参考値。カウント更新はactual_countとcounted_atのみ | ERには実挙動を記載。STK-1の時点設計と一緒に正本を整理する候補 |
| CSV commit失敗 | [55 §55.5](../function-design/55-ui-csv-import.md) の表はinternalをtoast＋state据置とするが、同書の遷移図・[hook](../../src/features/csv-import/hooks/useCsvImportFlow.ts) はerrorへ移りpreviewへ復帰できる | 相反する説明を黙って一方に揃えない。エラー時の採用契約を確認する候補 |
| PLU slotのactivated_at | [slot定義](../db-design/plu-tables.md) のカラム説明は「レジ反映確認日時」だが、[confirm実装](../../src-tauri/src/biz/plu_export_service.rs) はapp側の保存済み確認でも設定する | 図はレジ反映の証明にならないことを明記。外部確認の意味を正本で統一する候補 |

## 問題としなかった境界

- 日報系テーブルが商品別売上から独立しているのは意図された設計。日報を商品別売上へ擬似展開しない。
- `reference_type + reference_id` とJANによるPLU結合は論理参照。DBのFKがないことだけを欠陥とは判定しない。全書込み経路・復元後の論理孤児まで監査済みとはしない。
- 操作ログは業務記録を代替しない。整合性補正だけはmovementを増やさず、old/newの操作ログを同一TXで記録する例外が設計・実装で一致する。
- 取消・訂正、種別専用の一覧、業務記録のCSV/印刷には [既存の残余計画](../backlog.md) がある。図の欠落ではなく未実装能力として扱う。
- 在庫照会・在庫変動履歴・操作ログ・整合性検証の個別データ取得図は、主要なcommand呼出し先と実装が一致している。これを全ての失敗経路の検証済みという意味には広げない。

## 照合と維持

| 成果物 | 比較する現物 | 確認方法 |
|---|---|---|
| ER | migration登録、各schemaのproduction DDL | DDLをメモリ内SQLiteへ適用し、table_info / foreign_key_listとERソースを比較。管理表は含み、SQLite内部表は除く |
| navigationとroute | navigation.ts、createFileRouteとpage component | concrete page routeの集合照合、layout/indexの正規化 |
| 矢印と戻り | Link / navigate / returnTo helper / 受け側search | 入口と出口の両方を確認。未保存フォーム・単なるquery引渡し・検索条件復元を区別 |
| 在庫・日報・PLU・棚卸し | 各BIZとrepository、関数設計 | TX範囲、在庫を動かさない条件、取消、再試行、外部確認の境界を照合 |
| 図の表示 | ERのHTML、現行図のMermaid | browserでrenderし、図形・文字・図全体へのアクセスを確認 |
| 文書参照 | 親文書・新規文書・旧mockup注記 | doc-consistency、変更分類に沿うlocal gate、独立レビュー |

`doc-consistency-check.sh` のDB検査はMarkdown内の参照をDB設計へ照合する仕組みで、ERと実schemaを比較する検査ではない。今回のメモリ内DDL比較は新しいCI必須gateにしていない。migrationの失敗回復処理そのものをPythonで再現したとも主張しない。

図を更新するたびにこの履歴snapshotを書き換える必要はない。図の読み方・更新箇所は [現行図の入口](../diagrams/current-system.md#更新するとき)、製品変更の採用・優先順位は `Plans.md` / owner判断が所有する。
