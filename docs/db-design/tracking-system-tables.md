# テーブル定義（在庫追跡・棚卸し・システム）

## 時点証拠契約（proposed・未実装）

SPEC-STK-TIME-D1 / D6〜D8の追加予定。以下はmigration設計の論理カラムと制約であり、現在のschemaに存在するとの記述ではない。migration番号・index名はruntimeのregistryと照合して採番する。既存の数量・評価額・日時を修正するmigrationは作らない。

### 実測の保存形

| 保存先 | 追加・拡張する項目 | 制約と意味 |
|---|---|---|
| stocktakes | reconciliation_version INTEGER | NOT NULL、0/1のCHECK。移行済み旧headerは0、新規headerは1。旧activeは再確認を終えて新式で確定するTXで1へ変更。完了済み0は変更しない |
| stocktake_items | observation_kind TEXT | NOT NULL、DEFAULTなし、uncounted / measured / auto_filled / legacyのCHECK。最新の入力を上書きする。N=actual_count、L=system_stock、E=counted_atは既存列を利用 |
| stocktake_items | count_started_at TEXT、observation_revision INTEGER、ledger_cursor INTEGER、source_cursor INTEGER、request_id TEXT | measuredは一式必須。日時は既存のJST形式、版/cursorは非負整数、request_idはUNIQUE。source_cursorは開始時、ledger_cursorは保存TXのsnapshotと同時点 |
| stocktake_recounts（新設） | id INTEGER PK AUTOINCREMENT、stocktake_item_id INTEGER FK、system_stock INTEGER、actual_count INTEGER、count_started_at TEXT、counted_at TEXT、ledger_cursor INTEGER、source_cursor INTEGER、observation_revision INTEGER、request_id TEXT | 参照明細・N/L・時点証拠・版・要求IDはNOT NULL。request_idはUNIQUE。値はappend-only、actual_countは非負。importへのFKは置かない |
| stocktake_recount_flags（新設） | product_code TEXT FK、source_id INTEGER FK → pos_import_sources.id、csv_import_id INTEGER FK、reason TEXT | 全てNOT NULL。未解消のflagを(product_code, source_id)で一意にする。csv_import_idはflagを作成したimport。reasonはsale_order_unknown（計数と前後不明の販売）/ offset_lines_present（相殺の行あり）/ offset_check_pending（相殺の確認待ち）/ legacy_basis（旧記録の実測）のCHECK。解消で行を削除し、解消の根拠は実測行・取消の記録に残る |

要再確認flagの規則（[ADR D4](../adr/2026-09-18-stocktake-time-evidence.md)）:

- 一意の商品の判定不能は、最新の実測の所属（進行中の棚卸し・確定済みの棚卸し・独立再実測・legacy）によらず通常適用し、同じ業務TXで(商品, 資料)単位のflagを保存する。flagの保存失敗は取込みTX全体を戻す。
- 進行中の棚卸しに最新の実測がある商品は、未解消のflagがある間、force_fillでも確定できない。確定済みの棚卸し・独立再実測に属する商品のflagは取込みを止めず、商品単位の準備issueとして残る（回復先はactive明細、なければ独立再実測）。
- 解消は、当該資料を計数開始前に受領していた新しい実測の保存（active明細へのmeasured保存、または独立再実測。`source_id <= source_cursor`）か、作成importの取消に限る。
- file全体の保留は、在庫連動の候補が複数ある共有JAN行で全候補の実測前を証明できない場合だけで、保留は永続しない（flagを作らない）。
- 理由の決め方: 数量が0でない行は計数と前後不明の販売、LegacyObservedの行は数量によらず旧記録の実測、数量0で金額が0でない行は相殺の行あり。数量・金額とも0の行は同じ精算区間のEJで分ける。完全なEJに当該商品の行がなければflagを作らず、行があれば相殺の行あり、EJがない・不完全（前回のZ004からスロットと名称の対応が変わった区間と、前回のZ004がない最初の区間を含む）・名称を一意に特定できない場合は相殺の確認待ちとして確定を止める。相殺の確認待ちは、その区間の完全なEJが後から取り込まれた時点でBIZが再評価し、行がなければ解消（行を削除）、あればreasonを相殺の行ありへ変える。数え直しでも解消する。名称の対応が変わった区間はEJでは完全にならず、数え直しでだけ解消する。

cursorの0は空集合であり、source/movement IDへのFKにはしない。実測側のFKは親明細・再実測・商品・資料・importに張り、親は業務取消で物理削除しない。auto_filled / uncountedには開始・両cursor・observation_revision・実測request IDを付けない。legacyのNULLを有効なmeasured証拠へ補完しない。公開request IDはUUIDとする。

実測順序の一意性は、商品別のchecked stock_revisionを進めて記録するBIZの単一TXで保証する。recountとitemのrequest IDを両方照会し、同じ公開IDが両方に見つかる異常は拒否する。検索用indexはitemの(product_code, observation_revision)、recountの(stocktake_item_id, observation_revision)、flagのcsv_import_idとする。indexは証拠の代わりではない。

count_started_at / counted_atはアプリの時計で記録する操作の時刻で、前後判定・context失効に使わない。DB置換によるcontext失効は[CMDの新契約](../function-design/42-cmd-sales-stocktake.md)に従い、保存済みの実測と未保存tokenの有効性を分離する。

### movementと記録詳細

inventory_movementsへ `stocktake_adjustment_kind TEXT NULL`（completion / rollback_compensation / recountのCHECK）と `stocktake_recount_id INTEGER NULL REFERENCES stocktake_recounts(id)` を追加する。新しいstocktake補正は区分を必須とし、非stocktake movementには設定しない。再実測由来の補正はrecountを参照し、reference_type='stocktake' / reference_idは参照明細の親headerを指す。補償が独立再実測を吸収先とする場合もそのrecountを関連付ける。旧movementのNULL区分をtimestampやnoteの推測で書き換えない。

差0は実測行だけを保存し0数量movementを作らない。新方式の確定差異件数はcompletionだけから算出する。旧headerの既存NULL区分の集計は旧表示契約を保持し、新しいrecount/rollback_compensationを混ぜない。確定済みtotal_cost・valuation_cost_price・N/Lを、後から現在庫を直すために上書きしない。

### 移行と保存TX

旧header/item/movementがあるDBのための互換規則を以下に示す。[初導入の本番](../project-memory.md)に旧履歴が存在するという意味ではなく、開発・試験/将来の更新の合成テストも維持する。初導入という理由で存在する行を削除・無検査にせず、DB作り直しはADR D8の別作業へ分離する。

- このschema migration、全item writerのkind/証拠対応、無検査update_countの公開登録撤去、context必須command/UIの切替は同じruntime変更・配布単位にする。DB laneだけを先行出荷し旧writerで稼働する中間版は作らない。実装commitを分けても、完成前の組合せを起動/配布可能なreleaseとして扱わない。
- observation_kindのALTERにuncounted等の恒久DEFAULTを付けない。既存行は同一migration TX内で下記CASE分類を明示的に埋め、最終schemaをNOT NULL/CHECK/DEFAULTなしにする（必要なら一時列・table再構築を使う）。kindを省略したINSERTは失敗させる。新方式のstart、商品登録中の明細追加、商品一括import、force_fill、実測/再実測の全writerがkindと対応する証拠列を明示する。旧数量だけのUPDATEを有効な書込み経路として残さない。

- migrationの同じTXで、移行前movementの最大ID（空なら0）を内部app_settings key `stocktake_legacy_movement_ceiling`へ一度だけ保存する。通常設定APIの書込み対象にしない。これは吸収済みcursorではなく移行時上限で、再起動・再実行で現在値へ更新しない。
- 旧itemは、actual_count/count時刻が両NULLならuncounted、actual_count=0・system_stock=0・count時刻NULLならauto_filled、両方ありならlegacy。その他の矛盾形もlegacyとして移行異常を示す。旧force_fillは日時付きなのでlegacy。現在の廃番フラグから逆算しない。
- measured保存はN/L/S/E・両cursor・版・request ID・flag解消を1商品1TXにする。独立再実測はN-L補正を同じTXに加え、部分保存しない。legacyの取消の保留は業務write前に全体を止め、対象商品に新しい適用済み実測（active明細があればその計数と確定、なければ独立再実測）ができた後の取消の再試行で解除する。
- migration失敗は新列・新表・内部上限・schema versionの記録をまとめて戻す。旧header・数量・movementを消すこと、旧日時からcursorを作ることは禁止。起動時移行失敗を無視して新commandを有効化しない。

---

計画中の改訂: [時点証拠ADR](../adr/2026-09-18-stocktake-time-evidence.md) D1 / D6〜D8（proposed）。実測の窓・cursor・版、独立再実測、明示的な補正区分、旧DBの再確認を定める。以下は現行スキーマであり、新列・新表は未実装。

> **親文書**: [DB_DESIGN.md](../DB_DESIGN.md)

---

## 14. inventory_movements（在庫変動履歴）

### 役割
全ての在庫増減を時系列で記録する。在庫変動履歴画面（REQ-303）のデータソース。「在庫がおかしいとき、なぜそうなったかを追跡する」ためのテーブル。

### カラム定義

| カラム名 | 型 | 制約 | 説明 |
|---------|---|----|------|
| id | INTEGER | PK AUTOINCREMENT | 変動ID |
| product_code | TEXT | FK → products.product_code, NOT NULL | 商品コード |
| movement_type | TEXT | NOT NULL, CHECK(movement_type IN ('sale_auto','sale_manual','receiving','return','disposal','stocktake')) | 変動種別 |
| quantity | INTEGER | NOT NULL | 変動数量。在庫視点で常にプラス=増加、マイナス=減少 |
| stock_after | INTEGER | NOT NULL | 変動後の在庫数 |
| reference_type | TEXT | NULLABLE, CHECK(reference_type IN ('csv_import','manual_sale','receiving_record','return_record','disposal_record','stocktake') OR reference_type IS NULL) | 参照先テーブル名 |
| reference_id | INTEGER | NULLABLE | 参照先レコードID |
| note | TEXT | NULLABLE | 備考 |
| is_voided | BOOLEAN | NOT NULL, DEFAULT 0 | 論理無効化フラグ。ロールバック時に1 |
| created_at | TEXT | NOT NULL | 作成日時（YYYY-MM-DDTHH:MM:SS） |

### 符号規約（指摘#2対応、2026-03-28 確定）

sale_recordsとinventory_movementsで符号の意味が異なる。混同防止のため明文化する。

| テーブル | 視点 | プラスの意味 | マイナスの意味 |
|---------|------|-----------|------------|
| sale_records | 売上帳票視点 | 販売（売上増） | 返品（売上減） |
| inventory_movements | 在庫視点 | 在庫増加（入庫/返品戻り） | 在庫減少（販売/廃棄） |

例: Z004で返品1個（マイナス）を取り込んだ場合
- sale_records: quantity=-1, amount=-385（売上がマイナス）
- inventory_movements: quantity=+1（在庫が1個戻る）, movement_type='sale_auto'

### movement_typeの値

| 値 | 意味 | quantityの符号 | 発生元 |
|---|------|---------|--------|
| sale_auto | CSV取込みによる販売 | マイナス（返品時はプラス） | REQ-401 |
| sale_manual | 手動販売出庫 | マイナス | REQ-203 |
| receiving | 仕入入庫 | プラス | REQ-201 |
| return | 返品・交換（レジ未処理分のみ） | プラス（戻り） or マイナス（渡し） | REQ-202 |
| disposal | 廃棄・破損 | マイナス | REQ-204 |
| stocktake | 棚卸し補正 | プラス or マイナス | REQ-205 |

### 設計意図
- **全ての在庫変動を1テーブルに集約した理由**: 在庫変動履歴画面で「この商品に何が起きたか」を時系列で表示するため。入庫・販売・返品・廃棄・棚卸しの全てがここに入る
- **reference_type + reference_idの理由（ポリモーフィック関連）**: 「この変動の元の操作」を追跡する。例えばreference_type="receiving_record", reference_id=42なら、入庫記録ID:42が原因。SQLiteでは外部キー制約で強制できないため、アプリケーション側で整合性を担保
- **reference_typeの許容値をCHECK制約で固定した理由（指摘#11対応）**: ポリモーフィック関連のリスク軽減。アプリが想定外の値を書き込むのを防ぐ
- **stock_afterの理由**: 変動後の在庫数を記録しておくと、在庫推移のグラフ表示が高速になる。毎回前のレコードからの累積計算が不要
- **is_voidedの理由（指摘#3対応）**: CSVロールバック時に物理削除ではなく論理無効化で統一。操作ログとの整合性を保つ
- **通常取消と is_voided の使い分け（2026-06-27 追加）**: 業務記録の通常取消は元 movement を隠さず、逆方向 movement を追加して追跡可能にする。`is_voided=1` は CSV取込み rollback のように取込み自体を通常履歴から外す用途に限定する。完成形では `movement_kind` / `reversal_of_movement_id` の追加を検討する（[65-inventory-record-traceability.md](../function-design/65-inventory-record-traceability.md) §65.6）。

### 困りそうなケース
- **レジ戻し処理済みの返品**: register_processed=1の返品は、CSV取込み時にZ004のマイナス値を読んで、sale_recordsにはquantity=-1（売上帳票視点）、inventory_movementsにはquantity=+1（在庫視点: 在庫が1個戻る）として記録される。return_recordsは帳面記録のみで、独自のinventory_movementsは作らない。これにより二重計上を防ぐ

---

## 15. price_history（価格変更履歴）

### 役割
商品の売価・原価の変更履歴。商品修正画面の「価格履歴」セクション（REQ-102）のデータソース。

### カラム定義

| カラム名 | 型 | 制約 | 説明 |
|---------|---|----|------|
| id | INTEGER | PK AUTOINCREMENT | 履歴ID |
| product_code | TEXT | FK → products.product_code, NOT NULL | 商品コード |
| old_selling | INTEGER | NOT NULL | 変更前売価 |
| new_selling | INTEGER | NOT NULL | 変更後売価 |
| old_cost | INTEGER | NOT NULL | 変更前原価 |
| new_cost | INTEGER | NOT NULL | 変更後原価 |
| changed_at | TEXT | NOT NULL | 変更日時 |

### 設計意図
- **inventory_movementsとは別テーブルにした理由**: 価格変更は在庫の増減を伴わない。在庫変動履歴テーブルに混ぜると変動種別が増えて複雑になる
- **書込み契機（SPEC-PRV-D9）**: UI-01b の手動修正、UI-14 の一括改定、UI-02 の入庫原価差分承諾の 3 種で、売価または原価が変わったときに old/new 4 値を記録する
- **契機カラムは設けない**: 現 schema の履歴値と `changed_at` だけでは 3 契機を確実に導出できず、価格履歴閲覧にも契機表示を要求しないため schema 変更は行わない

---

## 16-17. stocktakes + stocktake_items（棚卸し）

### 役割
年末棚卸しの記録。10月〜大晦日の長期作業に対応する中断・再開機能付き。

### stocktakes カラム定義

| カラム名 | 型 | 制約 | 説明 |
|---------|---|----|------|
| id | INTEGER | PK AUTOINCREMENT | 棚卸しID |
| started_at | TEXT | NOT NULL | 開始日時 |
| completed_at | TEXT | NULLABLE | 完了日時。NULLなら作業中 |
| status | TEXT | NOT NULL, DEFAULT 'in_progress' | 状態。'in_progress' / 'completed' |
| total_cost | INTEGER | NULLABLE | 仕入原価総額（税理士報告用）。確定時に計算 |

### stocktake_items カラム定義

| カラム名 | 型 | 制約 | 説明 |
|---------|---|----|------|
| id | INTEGER | PK AUTOINCREMENT | 明細ID |
| stocktake_id | INTEGER | FK → stocktakes.id, NOT NULL | 親ヘッダ |
| product_code | TEXT | FK → products.product_code, NOT NULL | 商品コード |
| system_stock | INTEGER | NOT NULL | カウント時点のシステム在庫 |
| actual_count | INTEGER | NULLABLE | 実カウント数。NULLなら未入力 |
| valuation_cost_price | INTEGER | NULLABLE | 確定時の評価原価（円）。total_costはこの値×actual_countの合計 |
| counted_at | TEXT | NULLABLE | カウント日時（YYYY-MM-DDTHH:MM:SS）。NULLなら未入力 |

### 設計意図
- **system_stockを明細に持つ理由**: 棚卸し中もCSV取込みで在庫が動く（SP-205-09修正）。差異の表示は「現在のproducts.stock_quantity - actual_count」で動的計算。system_stockは「カウントした時点のシステム在庫」を参考値として記録
- **actual_countがNULLABLE**: 4000商品中、まだカウントしていない商品はNULL。NULLの件数が「未入力」の件数として進捗バーに使われる
- **valuation_cost_priceの理由（指摘#4対応）**: 棚卸し確定時の原価を固定保存。商品マスタの原価が後から変わってもtotal_costがブレない。棚卸し確定時にproducts.cost_priceの値をコピーしてくる
- **total_costの理由**: 棚卸し確定時に「全商品のvaluation_cost_price×actual_count」を合計した仕入原価総額を算出（SP-205-08、税理士報告用）

### 困りそうなケースと対応方針（2026-03-28 確定）

**ケース1: 棚卸し中に商品が新規登録された**
- 問題: stocktake_itemsに対応する行がなく、棚卸し一覧に表示されない。total_cost（仕入原価総額）が過小になり税理士報告に影響
- 対応方針: **案A（商品登録時に自動追加）を採用**。商品新規登録（REQ-101）の処理で、status='in_progress'のstocktakesがあれば、stocktake_itemsに自動INSERT（actual_count=NULL, system_stock=登録時の在庫数）。棚卸し画面に「未入力」として自動的に現れる
- 不採用案: 案B（棚卸し画面を開いたときに差分チェック）は、画面を開かないまま確定するフローがあると漏れるリスクがあるため不採用

**ケース2: 年に2回棚卸しをしたい**
- 対応方針: status='in_progress'のstocktakesが1件でもあれば、新しい棚卸しの開始をブロック。「進行中の棚卸しを完了してから新しい棚卸しを始めてください」と案内。完了後は新規作成可能
- チェック箇所: 棚卸し画面の「新規棚卸し開始」ボタン押下時にアプリ側でチェック

**ケース3: 棚卸し中に商品が廃番になった**
- 問題: 既にstocktake_itemsに行があるが、商品が廃番になった。カウント対象にすべきか
- 対応方針: 在庫が0になっている廃番商品はカウント不要。actual_count=0として自動入力。在庫が残っている廃番商品はカウント対象（実際に棚に残っている可能性がある）

---

## 18. operation_logs（操作ログ）

### 役割
システムの主要操作を日時付きで記録。トラブル時の追跡用。

### カラム定義

| カラム名 | 型 | 制約 | 説明 |
|---------|---|----|------|
| id | INTEGER | PK AUTOINCREMENT | ログID |
| operation_type | TEXT | NOT NULL | 操作種別（例: product_create, csv_import, backup等） |
| summary | TEXT | NOT NULL | 概要（1行。操作ログ画面のテーブルに表示） |
| detail_json | TEXT | NULLABLE | 詳細情報（JSON文字列。例: 変更前後の値等） |
| created_at | TEXT | NOT NULL | 操作日時 |

### 設計意図
- **detail_jsonの理由**: 操作の種類によって保持したい情報が違う。CSV取込みならファイル名・件数・金額、商品修正なら変更前後のフィールド名・値。カラムをいちいち追加するよりJSON文字列で柔軟に格納する
- **業務記録との役割分担（2026-06-27 追加）**: operation_logs は監査・保守ログであり、入出庫の明細・金額・取消/訂正の正本ではない。関連 record_type / record_id を detail_json に含めてもよいが、在庫変動の根拠表示は業務記録詳細と inventory_movements が担う。

---

## 19. app_settings（アプリ設定）

### 役割
システム全体の設定値をキー・バリューで格納。

### カラム定義

| カラム名 | 型 | 制約 | 説明 |
|---------|---|----|------|
| key | TEXT | PK | 設定キー |
| value | TEXT | NOT NULL | 設定値 |
| updated_at | TEXT | NOT NULL | 更新日時 |

### 初期データ例

| key | value | 説明 |
|-----|-------|------|
| stock_low_threshold | 3 | 在庫少の閾値（個） |
| stock_low_threshold_fabric | 500 | 在庫少の閾値（cm、生地用） |
| backup_enabled | 1 | 自動バックアップON/OFF |
| backup_time | 23:00 | バックアップ時刻 |
| backup_path | C:\在庫管理\backup\ | バックアップ保存先 |
| backup_retention_days | 3 | バックアップ保持日数 |
| tax_rate_standard | 10 | 標準税率 |
| tax_rate_reduced | 8 | 軽減税率 |
| last_plu_export_at | 2026-03-21T15:00:00 | 最後のPLU書出し日時 |
| log_retention_days | 365 | 操作ログ保持日数 |
| log_last_cleanup_date | 2026-03-29 | 最後にログ削除チェックした日付 |
