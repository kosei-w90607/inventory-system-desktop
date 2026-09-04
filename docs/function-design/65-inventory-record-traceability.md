# 65. 入出庫記録・在庫変動追跡 完成形

> 対応仕様: REQ-201 / REQ-202 / REQ-203 / REQ-204 / REQ-205 / REQ-303 / REQ-902 / REQ-206 / REQ-207 / REQ-208
>
> 入力ドキュメント: `docs/spec/requirements.md`、`docs/spec/requirements-coverage.md`、`docs/db-design/transaction-tables.md`、`docs/db-design/tracking-system-tables.md`、`docs/function-design/21-io-inventory-repo.md`、`docs/function-design/31-biz-inventory-service.md`、`docs/function-design/44-cmd-inventory.md`、`docs/function-design/55-ui-csv-import.md`、`docs/function-design/61-ui-receiving.md`、`docs/function-design/62-ui-manual-sale.md`、`docs/function-design/63-ui-return-exchange.md`、`docs/function-design/64-ui-disposal.md`、`docs/function-design/72-mnt-log-manager.md`、`docs/SCREEN_DESIGN.md`

本書は、入庫、返品・交換、手動販売出庫、廃棄・破損、CSV取込み、棚卸し補正を「あとから追跡できる」商業用在庫管理の完成形を定義する。各作業画面の下部にある recent list は保存直後の確認 UI であり、業務記録の閲覧・追跡機能の代替ではない。

整合性補正（BIZ-07 fix_integrity）は movement を作らないため在庫変動履歴には現れない。補正の追跡は operation_logs（operation_type='integrity_fix'、old/new 付き、UI-11c 操作ログ画面）で行う（[D-051](../decision-log.md)、36-biz-integrity-check.md §21.4）。

## 65.0 関数要求 / シグネチャ / 処理ステップの扱い

**関数要求**: 本書は単一関数ではなく、入出庫系の業務記録一覧・詳細、在庫変動履歴、操作ログ連携、取消/訂正をまたぐ完成形 contract を定義する。後続実装では本書の route、query、status、movement reference、cancel/correct 方針を個別 command / BIZ / IO / UI へ分割する。

**シグネチャ**: 完成形の境界は `listInventoryRecords(query)`、`get*Record(id)`、`getCsvImportRecord(id)`、`getStocktakeRecord(id)`、`listMovements(query)`、`resolveMovementReference(referenceType, referenceId)`、`cancel*Record(id, reason, idempotencyKey)`、`correct*Record(id, reason, replacementReq, idempotencyKey)` を基準にする。実装 PR では既存 command 名との互換と生成 binding の具体型を確定する。

**処理ステップ**: §65.1 で役割を分け、§65.2 で設計判断を固定し、§65.3〜§65.5 で route / 一覧 / 詳細を定義し、§65.6〜§65.7 で DB / CMD / BIZ contract を置き、§65.8〜§65.10 で UI / 出力 / 実装スライスへ落とす。

## 65.1 役割分担

| 層 / 記録 | 役割 | 正本か | 主な利用場面 |
|---|---|---:|---|
| 業務記録 | `receiving_records`、`return_records`、`manual_sales`、`disposal_records`、`csv_imports`、`stocktakes` と各明細 | はい | 記録IDごとの詳細確認、取消/訂正、CSV出力、印刷、月末確認 |
| 在庫変動履歴 | `inventory_movements` | 在庫推移の台帳 | 商品別に「いつ、何で、何個増減したか」を追う。各行から元業務記録へ戻る |
| 操作ログ | `operation_logs` | 監査・保守ログ | 誰がどの操作をしたか、エラー、バックアップ、ログ削除などを確認する。業務記録の代替にしない |

操作ログは必要だが、在庫がなぜ変わったかを説明する主画面ではない。在庫変動の説明は `inventory_movements` と各業務記録詳細が担う。操作ログは業務記録IDを参照してよいが、在庫の正本にはしない。

## 65.2 設計判断

| Spec | Decision ID | 決定 | 理由 / 不採用案 |
|---|---|---|---|
| REQ-206 / all | TRACE-D1 | 入出庫系の全記録は、作成画面内の直近表示だけでなく、一覧・詳細画面で後から参照できるようにする。 | 商業用在庫管理では月末確認、棚卸し、原因調査、入力ミス確認が必要。recent list だけでは過去記録を追えない。 |
| REQ-207 / movement | TRACE-D2 | 在庫変動履歴の各行は `reference_type + reference_id` から元業務記録の詳細へ遷移できる。元業務記録詳細からも関連 `inventory_movements` を表示する。 | 片方向リンクだけでは「この在庫変動の根拠」と「この記録が動かした在庫」の相互確認ができない。 |
| REQ-902 / logs | TRACE-D3 | 操作ログは監査・保守ログとして残し、業務記録・在庫変動履歴とは役割を分ける。 | operation_logs は柔軟な JSON ログであり、明細・金額・取消/訂正の正本にすると業務仕様が曖昧になる。 |
| REQ-208 / cancel | TRACE-D4 | 業務記録の取消は物理削除しない。ヘッダを取消状態にし、取消理由を必須にし、逆方向の在庫変動を追加する。 | 在庫数だけ戻して元記録を消すと、なぜ在庫が戻ったか追えない。既存 movement を消す案は監査性が弱い。 |
| REQ-208 / correction | TRACE-D5 | 訂正は「元記録を取消して新記録を作る」形にする。可能なら BIZ command で取消 + 新規作成を単一 TX にする。 | 既存明細を上書き更新すると、元の入力内容・在庫変動・帳面の根拠が失われる。 |
| REQ-303 / ledger | TRACE-D6 | 取消/訂正に伴う在庫戻しは `inventory_movements` に追加行として残し、元 movement との関係を構造化する。 | `is_voided=1` は CSV rollback など「取込みを無効化する」用途に限定し、通常の業務取消は履歴を見せる。 |
| REQ-206 / UI | TRACE-D7 | Sidebar には作業画面とは別に「入出庫履歴」を置く。各作業画面の recent list には「すべての履歴を見る」導線を置く。 | 作成作業と調査作業は利用タイミングが違う。作成画面に検索・詳細・取消を詰め込むと日常入力が重くなる。 |
| REQ-206 / export | TRACE-D8 | 業務記録一覧と詳細は、月末確認・会計・棚卸し確認用に CSV 出力と印刷/控えを持つ。 | 廃棄・破損のロス原価、入庫実績、手動販売、返品交換は店外説明や紙確認が必要になる。 |
| REQ-206 / image | TRACE-D9 | 画像添付は返品・交換のレシート画像に限らず、廃棄・破損の破損品写真・廃棄根拠写真にも拡張できる設計にする。 | 画像は業務記録の補助証跡。操作ログや在庫変動履歴に直接持たせない。 |
| REQ-206 / duplicate | TRACE-D10 | 同日・同商品・同数量・同理由/同金額に近い記録がある場合、保存前に注意表示する。ブロックではなく確認制にする。 | 二重登録は防ぎたいが、同じ商品が同日に複数回入庫・廃棄されることはあり得る。 |
| REQ-206 / return | TRACE-D11 | 業務記録詳細へ遷移する一覧、作業画面の recent list、保存結果、操作ログの各 link は、search state を含む遷移元 URL を `returnTo` として送る。詳細画面の「前の画面へ戻る」はその遷移元へ戻し、欠落・不正な値は遷移先の既定 hub（現行の業務記録詳細では `/inventory/records`）へフォールバックする（DSR-18）。 | 月末確認、保存直後確認、操作ログ調査では、詳細確認後に元の作業・検索状態へ戻れないと文脈を組み直す必要がある。`returnTo` は URL 由来の入力なので、DSR-15/18 の検証を通し、外部 URL や想定外 path をそのまま使わない。 |
| REQ-206 / search | TRACE-D12 | 入出庫履歴の商品検索欄は共有 `SearchBar` の live 型（`debounceMs=200`）を使い、raw の URL `q` と結線する。Enter は debounce を待たず即時反映し、IME 変換確定中の Enter は検索確定と取り違えない。 | 商品一覧・在庫照会との操作一貫性を保ち、自前の draft / IME guard による挙動 drift をなくす。commit 型や画面固有実装を残す案は、一覧 filter 間で確定方法が分裂するため採用しない。 |

## 65.3 完成形ルート

作成画面は既存 route を維持する。履歴・詳細・追跡は別 route に分ける。

| 目的 | Route | 備考 |
|---|---|---|
| 入出庫履歴ハブ | `/inventory/records` | Sidebar「入出庫履歴」。全種別横断検索、または種別タブへの入口 |
| 入庫履歴一覧 | `/inventory/receiving/records` | 日付範囲、記録ID、商品、取引先、状態で検索 |
| 入庫記録詳細 | `/inventory/receiving/records/$recordId` | 明細、原価、関連 movements、取消/訂正、CSV/印刷 |
| 返品・交換履歴一覧 | `/inventory/return/records` | 種別、レジ戻し済み、商品、画像有無、状態で検索 |
| 返品・交換詳細 | `/inventory/return/records/$recordId` | 明細、レシート画像、在庫反映有無、関連 movements |
| 手動販売履歴一覧 | `/inventory/manual-sale/records` | 日付、商品、理由、状態で検索 |
| 手動販売詳細 | `/inventory/manual-sale/records/$recordId` | 明細、売上金額、日次売上へのリンク、関連 movements |
| 廃棄・破損履歴一覧 | `/inventory/disposal/records` | 日付、記録ID、商品、部門、種別、理由、状態で検索 |
| 廃棄・破損詳細 | `/inventory/disposal/records/$recordId` | 明細、ロス原価、画像、関連 movements、取消/訂正 |
| CSV取込み履歴一覧 | `/csv-import/records` | 精算日、取込み日時、取込みID、ファイル名、状態で検索 |
| CSV取込み詳細 | `/csv-import/records/$importId` | 取込みサマリ、sale_records、エラー行、関連 movements、rollback 状態 |
| 棚卸し履歴一覧 | `/stocktake/records` | 棚卸し日、棚卸しID、状態、差異件数、ロス/増加原価で検索 |
| 棚卸し詳細 | `/stocktake/records/$stocktakeId` | stocktake_items、差異、関連 movements、確定/取消/再開状態 |
| 在庫変動履歴 | `/stock/$code/movements` | 商品別。各 movement から元業務記録へリンク |
| 操作ログ | `/settings/logs` | 監査・保守ログ。業務記録詳細への任意リンクを持てる |

作成 route は `/inventory/receiving`、`/inventory/return`、`/inventory/manual-sale`、`/inventory/disposal`、`/csv-import`、`/stocktake` のままにする。recent list は保存直後の確認に限定し、一覧検索・詳細・取消・訂正は上記 records route へ逃がす。`/inventory/records` は CSV取込みと棚卸しも横断検索に含め、詳細遷移先だけ各 route へ分ける。

## 65.4 一覧検索

### 65.4.1 共通フィルタ

| フィルタ | 対象 | 備考 |
|---|---|---|
| 日付範囲 | 全業務記録 | 業務日付で検索。created_at ではない |
| 記録ID | 全業務記録 | ID exact match |
| 商品コード / JAN / 商品名 | 全業務記録 | 明細 JOIN。商品名は部分一致。商品検索欄は共有 `SearchBar` の live 型（TRACE-D12）を使う。CSV取込みは `sale_records`（rollback 後の `is_voided=1` 行も履歴保持のため対象）、棚卸しは `reference_type='stocktake' AND is_voided=0` の差異 `inventory_movements` を検索母集団とする。進行中の棚卸しは差異 movement がまだないため、この filter には構造的に hit しない |
| 部門 | 全業務記録 | 商品 master JOIN。完全な部門 master を選択肢に使う。CSV取込みは `sale_records`、棚卸しは `reference_type='stocktake' AND is_voided=0` の差異 `inventory_movements` から商品 master へ JOIN する。進行中の棚卸しは差異 movement がまだないため、この filter には構造的に hit しない |
| 状態 | 全業務記録 | slice 4d の現行正規化値は `active` / `canceled` / `in_progress`、filter は `all` / `active` / `canceled` / `in_progress`（表示は「すべて / 有効 / 取消済み / 進行中」）。条件は各 SELECT へ重複実装せず、`UNION ALL` 後の外側 derived table へ 1 回適用して WHERE に実反映する。`corrected` は slice 5 の将来完成形で使う取消/訂正の別軸であり、`in_progress` は CSV取込み / 棚卸しの正規化契約にのみ属する現行実装値（現行写像で実際に返すのは棚卸しのみ）として区別する |
| 種別 | return / disposal / movement | return/exchange、disposal/damage/other、movement_type |
| 理由キーワード | manual_sale / disposal / cancel | reason / note / cancel_reason |

### 65.4.2 並び替え / ページング

- 一覧は `page` 1 始まり、`per_page` 上限 200。
- 既定 sort は業務日付 DESC、記録ID DESC。
- sort は `business_date`、`record_id`、`created_at`、`product_name`、`department_name`、`loss_cost_total` の範囲に限定する。各画面で対象外の列は非表示にし、sort key としても受け付けない。
- 検索対象が明細 JOIN を含む場合でも、返却単位は業務記録ヘッダ単位にする。明細単位 CSV は export command に分ける。

## 65.5 詳細表示

詳細画面は読み取りを主とする。取消/訂正 CTA は、`status === "active"` かつ対象記録種別の cancel / correct command が実装済みの場合だけ表示する。

| 詳細項目 | 入庫 | 返品・交換 | 手動販売 | 廃棄・破損 | CSV取込み | 棚卸し |
|---|---:|---:|---:|---:|---:|---:|
| 記録ID / 業務日付 / 作成日時 / 状態 | yes | yes | yes | yes | yes | yes |
| 明細数 | yes | yes | yes | yes | yes | yes |
| 商品コード / 商品名 / 部門 | yes | yes | yes | yes | yes | yes |
| JAN | no | no | no | no | no | no |
| 数量 / 単位 | yes | yes | yes | yes | yes | yes |
| 原価 / ロス原価 | yes | no | no | yes | no | yes |
| 金額 | no | no | yes | no | yes | no |
| 種別 / 方向 / 理由 | no | yes | yes | yes | no | no |
| 備考 | optional | yes | optional | optional | optional | optional |
| 画像 | optional | receipt | no | optional | no | no |
| 関連 inventory_movements | yes | register_processed=false のみ | yes | yes | yes | yes |
| 取消/訂正情報 | yes | yes | yes | yes | rollback | yes |

返品・交換詳細の備考は返品理由、交換理由、顧客対応メモの確認に使うため、レシート画像の補足文に混ぜず、独立した `備考` 領域で表示する。本文は通常本文色で読み、入力なしの場合は `備考なし` を muted 表示する。

詳細画面からは在庫照会の商品詳細へ遷移できる。商品別在庫変動履歴から来た場合は、戻り先として movement list の検索条件を保持する。

業務記録詳細への遷移元は、入出庫履歴・在庫変動履歴などの一覧、作業画面の recent list、保存結果、操作ログのいずれでもよい。詳細画面の「前の画面へ戻る」は `returnTo` が表す遷移元 URL へ戻し、遷移元が search state を持つ場合はその条件と page も復元する。`returnTo` の送信・検証・fallback は DSR-18 を正とし、欠落、不正、外部 URL、`//` で始まる URL は遷移先の既定 hub（現行の業務記録詳細では `/inventory/records`）へフォールバックする。戻った一覧は保持した検索条件で再取得するため、記録の取消・訂正・新規追加などで結果件数が変わることは許容する。

## 65.6 DB 完成形

既存スキーマは業務記録と movement の土台を持つが、取消/訂正/相互追跡には追加設計が必要である。

### 65.6.1 業務記録ヘッダ共通フィールド

`receiving_records`、`return_records`、`manual_sales`、`disposal_records` は次の共通フィールドを持つ完成形にする。`csv_imports.status` と `stocktakes.status` は既存 status を尊重し、同じ意味へ正規化して UI 表示する。

slice 4d の現行実装では、追加 2 種の status を次のように正規化する。

| 種別 | 元 status | 正規化 status |
|---|---|---|
| CSV取込み | `completed` | `active` |
| CSV取込み | `completed_partial` | `active` |
| CSV取込み | `rolled_back` | `canceled` |
| 棚卸し | `completed` | `active` |
| 棚卸し | `in_progress` | `in_progress` |

`completed_partial` は一覧では「有効」に含め、`skipped_count` を含む部分取込みの詳細は詳細画面が担う。

| フィールド | 型 | 意味 |
|---|---|---|
| status | TEXT | `active` / `canceled` / `corrected` |
| canceled_at | TEXT NULL | 取消日時 |
| cancel_reason | TEXT NULL | 取消理由。取消時は必須 |
| correction_of_record_id | INTEGER NULL | この記録が訂正後なら元記録ID |
| corrected_by_record_id | INTEGER NULL | この記録が訂正元なら訂正後記録ID |

訂正は同一記録種別内で行う。たとえば入庫記録の訂正後は新しい入庫記録を作り、元入庫記録に `status='corrected'` と `corrected_by_record_id` を入れる。

### 65.6.2 inventory_movements 拡張

`inventory_movements` は在庫推移の台帳として、通常作成と取消戻しを区別できる構造を持つ。

| フィールド | 型 | 意味 |
|---|---|---|
| movement_kind | TEXT | `create` / `cancel`。既定は `create` |
| reversal_of_movement_id | INTEGER NULL | 取消戻し movement の場合、元 movement ID |

取消時は元 movement を消さず、逆符号の movement を `movement_kind='cancel'` で追加する。`is_voided` は CSV rollback のように「取込み自体を無効化して通常履歴から隠す」用途に限定し、通常の業務取消には使わない。

### 65.6.3 画像添付

画像添付を返品・交換だけに閉じないため、完成形では共通 `record_attachments` を検討する。

| フィールド | 型 | 意味 |
|---|---|---|
| id | INTEGER | 添付ID |
| record_type | TEXT | `return_record` / `disposal_record` など |
| record_id | INTEGER | 業務記録ID |
| attachment_type | TEXT | `receipt` / `damage_photo` / `disposal_evidence` |
| relative_path | TEXT | アプリデータ配下の相対パス |
| created_at | TEXT | 作成日時 |

UI-03 の既存 `return_records.receipt_image_path` は互換維持し、共通添付へ移す場合は migration と表示互換を設計する。

## 65.7 CMD / BIZ 完成形

### 65.7.1 一覧・詳細

既存 `listReceivings` / `listReturns` / `listDisposals` は recent list も兼ねる簡易一覧である。完成形では検索条件を構造化した query DTO を持つ。

| Command | 目的 |
|---|---|
| `listInventoryRecords(query)` | `/inventory/records` 横断一覧。record_type、日付範囲、商品、部門、状態で検索 |
| `listReceivingRecords(query)` / `getReceivingRecord(id)` | 入庫一覧・詳細 |
| `listReturnRecords(query)` / `getReturnRecord(id)` | 返品・交換一覧・詳細 |
| `listManualSaleRecords(query)` / `getManualSaleRecord(id)` | 手動販売一覧・詳細 |
| `listDisposalRecords(query)` / `getDisposalRecord(id)` | 廃棄・破損一覧・詳細 |
| `listCsvImportRecords(query)` / `getCsvImportRecord(id)` | CSV取込み一覧・詳細。既存 `list_csv_imports` は recent/latest 用の互換 command として残せる |
| `listStocktakeRecords(query)` / `getStocktakeRecord(id)` | 棚卸し一覧・詳細。既存 stocktake command は進行中棚卸し操作用として残す |
| `listMovements(query)` | 商品別 movement。既存 contract を拡張し、元記録リンクに必要な `source: { label, route }` を返す |
| `resolveMovementReference(referenceType, referenceId)` | movement の参照先がどの route / label へ行くかを返す |

### 65.7.2 取消 / 訂正

取消 command は業務記録ごとに分ける。BIZ 層が同一 TX で status 更新、逆 movement 作成、operation log 記録を行う。

| Command | 処理 |
|---|---|
| `cancelReceivingRecord(id, reason, idempotencyKey)` | 入庫の在庫加算を逆方向に戻す |
| `cancelReturnRecord(id, reason, idempotencyKey)` | register_processed=false の movement だけ逆方向に戻す。true は帳面取消のみ |
| `cancelManualSaleRecord(id, reason, idempotencyKey)` | 在庫戻し + 手動 sale_records の取消扱い |
| `cancelDisposalRecord(id, reason, idempotencyKey)` | 廃棄で減った在庫を戻す |
| `correct*Record(id, reason, replacementReq, idempotencyKey)` | 元記録を `status='corrected'` にし、逆方向 movement と replacement の新規作成を同一 TX で行う |

取消済み・訂正済み記録の再取消は validation error にする。純粋な取消は `status='canceled'`、訂正は元記録を `status='corrected'` にして訂正先の有効記録を作る。訂正後記録の取消は許可するが、元記録との関係を詳細画面に表示する。

## 65.8 UI 完成形

### 65.8.1 入出庫履歴ハブ

`/inventory/records` は調査用画面である。作成導線ではなく、過去記録の検索・詳細確認・出力への入口とする。

- 上部: 日付範囲、種別、記録ID、商品検索、部門、状態（すべて / 有効 / 取消済み / 進行中）。商品検索は共有 `SearchBar` の live 型（`debounceMs=200`、TRACE-D12）とし、URL `q` の変更時は `page` を既定へ戻す。
- 検索欄の近くに「商品・部門での絞り込みは、CSV取込みでは取込み明細、棚卸しでは差異のあった商品が対象です。」と常時表示する。
- 結果: 記録種別、記録ID、業務日付、代表商品、明細数、状態、記録日時、詳細ボタン。状態列は「有効」「取消済み」に加えて「進行中」badge を表示し、色だけに依存しない。
- 明細数は棚卸し以外の 5 種では明細行数、棚卸しでは `reference_type='stocktake' AND is_voided=0` の差異件数を表す。進行中の棚卸しは代表商品・明細数とも「-」を表示する。完了した棚卸しで差異 0 件の場合は、明細数を `0` のまま、代表商品を「差異なし」と表示し、汎用 fallback の「明細なし」は使わない。
- 各行は詳細 route へ遷移する。行内に取消/訂正ボタンは置かず、詳細画面で確認してから行う。
- 詳細 route へ遷移するリンクは DSR-18 / TRACE-D11 に従い、search state を含む遷移元 URL を `returnTo` に含める。この hub では現在の `/inventory/records` search state を送り、同じ送信義務を作業画面の recent list、保存結果、操作ログの関連記録 link にも適用する。詳細画面から戻ると各遷移元の状態を復元する。
- **filter-empty reset action**（2026-08-03 batch B、[02-component-catalog.md](../design-system/02-component-catalog.md) ⑥）: §65.4.1 の検索条件（recordType / dateFrom / dateTo / q / recordId / departmentId / status）が既定値以外、かつ結果 0 件のときは EmptyState に「絞り込みを解除」ボタンを表示する。押下で上記検索条件と `page` をすべて既定値へ戻す。既定値のまま 0 件（記録が実在しない）のときは表示しない。

### 65.8.2 在庫変動履歴

`/stock/$code/movements` は商品別在庫照会から開く。各行は次を表示する。

- 日時
- 変動種別
- 増減数量
- 変動後在庫
- 元記録ラベル（例: 入庫記録 #42、廃棄・破損 #7、CSV取込み #12）
- 詳細リンク
- 取消戻しの場合は `取消` ラベルと元 movement への関係

初期在庫や legacy/corrupt row など `reference_type/reference_id` が欠ける movement は、行自体を表示し、元記録リンクだけを非表示にする。

### 65.8.3 操作ログ

`/settings/logs` はシステム管理領域に置く。業務記録詳細と違い、明細表示や取消/訂正は持たない。

- operation_type
- summary
- created_at
- detail_json の要約表示
- 関連 record_type / record_id がある場合だけ詳細リンク

詳細な route/URL state、期間・種別 filter、pagination、detail_json 安全設計、関連記録リンクの許可リスト・ルートマッピング、Windows native L3 は [function-design/74-ui-operation-logs.md](74-ui-operation-logs.md)（UI-11c Design Phase、2026-07-11）を正とする。関連記録リンクは `record_type`（`receiving_record` / `return_record` / `manual_sale` / `disposal_record` のいずれか）と正の整数 `record_id` が detail_json に両方揃う場合だけ表示する明示 contract とする。入庫・返品交換・手動販売・廃棄の作成 producer は、許可リストに対応する `record_type` と当該業務記録 PK の `record_id` を格納し、新規ログを実データでリンク可能にする。`csv_import` と `stocktake` の詳細 route はいずれも実装済みだが、2026-09-01 の producer 実効化 R3 では両種を据置とし、許可リストからの除外を維持する。csv_import / stocktake producer への `record_type` 採用と許可リスト追加は、それぞれ別 follow-up で行う。

## 65.9 出力

| 出力 | 対象 | 用途 |
|---|---|---|
| 一覧CSV | 入出庫履歴、種別別履歴 | 月末確認、会計、棚卸し準備 |
| 明細CSV | 廃棄・破損、入庫、手動販売、返品・交換 | ロス原因、仕入実績、手動販売補完の説明 |
| 詳細印刷 | 各記録詳細 | 店舗控え、税理士・棚卸し確認 |

CSV は UTF-8 BOM 付きとし、既存 report export 方針に合わせる。出力は検索条件を反映する。

## 65.10 実装スライス

完成形は一度に実装しない。source docs は完成形を保持し、実装 PR は次の順で小さく切る。

1. DB / BIZ / CMD traceability foundation: record status、detail query、movement_kind、reference resolution。
2. UI-06c 在庫変動履歴: 商品別 movement 表示と元記録リンク。
3. 入出庫履歴ハブ + 廃棄・破損 detail: REQ-204 のロス追跡を最初の具体例にする。
4. 入庫 / 返品・交換 / 手動販売の詳細画面を横展開。
   - `listInventoryRecords(query)` は `receiving_record` / `return_record` / `manual_sale` / `disposal_record` を同じヘッダ列で返し、`all` では4種を業務日付 DESC、記録ID DESC で横断表示する。
   - `getReceivingRecord(id)` / `getReturnRecord(id)` / `getManualSaleRecord(id)` を追加し、各詳細は read-only で header、明細、業務サマリ、関連 movements、商品別 movement への導線を表示する。
   - UI-02 / UI-03 / UI-04 の recent list には「すべての履歴を見る」と detail 導線を置く。UI-04 は PR #115 時点では保存結果からの detail 導線のみだったが、作業画面間の一貫性のため後続 follow-up で recent list を追加する。履歴検索は `/inventory/records` に集約し、作成画面内に検索・取消・訂正を持ち込まない。
   - 返品・交換 detail の保存済み receipt image は初回横展開では添付有無と相対パス表示までとし、asset 表示・削除は画像添付 slice で扱う。
4b. CSV取込み詳細: `getCsvImportRecord(id)` と `/csv-import/records/$importId` 詳細画面を追加し、在庫変動履歴「CSV取込み #n」元記録 link の 404（UI-06c-D7 の未実装 route 表示契約により operator へ露出）を解消する。既存4記録種別の詳細画面と同構造・read-only とし、rollback CTA は置かず（取込み画面 UI-07 の責務のまま）、一覧 `/csv-import/records` と `listCsvImportRecords(query)`、棚卸し詳細 route はこのスライスに含めない。横断検索は slice 4d で充足済み、専用一覧は runway 残置とする。backend 設計は [24-io-csv-import-repo.md](24-io-csv-import-repo.md) §14.13a / [32-biz-csv-import-service.md](32-biz-csv-import-service.md) §15.6a / [41-cmd-pos.md](41-cmd-pos.md) §17.5 を正とする。
4c. 棚卸し詳細: `getStocktakeRecord(id)` と `/stocktake/records/$stocktakeId` 詳細画面を追加し、在庫変動履歴「棚卸し #n」元記録 link の 404（UI-06c-D7 の未実装 route 表示契約により operator へ露出。2026-08-26 遷移契約 sweep 起源、owner 裁定 2026-08-27 = slice 4b 同型の詳細先行実装）を解消する。既存 5 記録種別の詳細画面と同構造・read-only とし、取消/訂正 CTA は置かない（§65.5 の表示条件どおり、棚卸しの cancel / correct command は未実装のため非表示）。明細（差異）は補正 movement（確定時 live 在庫基準、[35-biz-stocktake-service.md](35-biz-stocktake-service.md) §20.5 / §20.6a 設計ノート）を正として表示し、`system_stock - actual_count` の snapshot 差では定義しない。status は既存 2 値（in_progress / completed）の正規化表示とし、§65.3 の「確定/取消/再開状態」のうち取消・再開は該当機能未実装のため表示対象外。一覧 `/stocktake/records` と `listStocktakeRecords(query)` はこのスライスに含めない。横断検索は slice 4d で充足済み、専用一覧は runway 残置とする。backend 設計は [20-io-product-repo.md](20-io-product-repo.md) §2.11a / [35-biz-stocktake-service.md](35-biz-stocktake-service.md) §20.6a / [42-cmd-sales-stocktake.md](42-cmd-sales-stocktake.md) §22.5 を正とする。
4d. `listInventoryRecords` 6 種対称化: 本 slice は step 4（「4種を業務日付 DESC、記録ID DESC で横断表示する」の記述）の `record_type` 母集団を 6 種へ拡張し、当該記述を supersede する。
   - `record_type` に `csv_import` / `stocktake` を加え、`all` は入庫 / 返品・交換 / 手動販売 / 廃棄・破損 / CSV取込み / 棚卸しの 6 種を横断する。
   - status は §65.6.1 の写像で `active` / `canceled` / `in_progress` に正規化する。filter は「すべて / 有効 / 取消済み / 進行中」の 4 値とし、条件を `UNION ALL` 後の外側 derived table へ 1 回だけ適用して WHERE に実反映する。
   - CSV取込みの明細母集団は `sale_records` とし、TRACE-D6 の履歴保持方針により rollback 後の `is_voided=1` 行も `item_count` / 代表商品へ含める。棚卸しの `item_count` は差異件数であり、`inventory_movements.reference_type='stocktake' AND is_voided=0` に必ず絞る。進行中の棚卸しは UI 上の代表商品・明細数をともに「-」とする。
     進行中の棚卸しは差異 movement が未発生のため、商品 / 部門 filter には構造的に hit しない（§65.4.1 の既知の制約と同旨）。
   - `business_date` は CSV取込みが `settlement_date`、棚卸しが `DATE(COALESCE(completed_at, started_at))`、記録日時は CSV取込みが `imported_at`、棚卸しが `started_at` を使う。
   - `/csv-import/records` / `/stocktake/records` の専用一覧 route と `listCsvImportRecords` / `listStocktakeRecords` は完成形契約のまま runway 残置とし、横断検索の充足を理由に削除しない。
5. 取消 / 訂正 command と UI。
6. CSV出力 / 印刷 / 廃棄・破損画像添付。
7. 操作ログ UI と業務記録リンク。

各実装 PR は R3 とし、Plan Packet、Test Matrix、review-only sub-agent、必要な Windows native L3 を使う。

## 65.11 Test Focus

- REQ-206 / TRACE-D1: recent list とは別に、過去記録を検索・詳細表示できる。
- REQ-207 / TRACE-D2: movement から元記録へ、元記録から movement へ相互遷移できる。
- REQ-902 / TRACE-D3: operation_logs は業務記録の代替ではなく、関連記録リンク付き監査ログとして表示される。
- REQ-208 / TRACE-D4/D5: 取消/訂正は物理削除せず、理由と状態と逆 movement を残す。
- REQ-303 / TRACE-D6: 取消戻し movement は通常作成 movement と区別して表示できる。
- REQ-206 / TRACE-D8/D9: CSV出力、印刷、画像添付は業務記録に紐づく。
- REQ-206 / TRACE-D11: 一覧、作業画面の recent list、保存結果、操作ログの各 link が遷移元 URL を `returnTo` として送り、詳細から戻ると search state を含む各遷移元が復元される。欠落・不正な戻り先は遷移先の既定 hub（現行の業務記録詳細では `/inventory/records`）にフォールバックする。
- REQ-206 / TRACE-D12: 商品検索欄は `debounceMs=200` の live 型で raw `q` と結線し、Enter 即時反映、IME 変換確定 Enter の誤発火防止、`q` 変更時の page reset を維持する。

## 65.12 変更履歴

| 日付 | 版 | 内容 |
|---|---|---|
| 2026-08-30 | PR #20 / DSR-18 | TRACE-D11 を一覧限定から、一覧 / recent list / 保存結果 / 操作ログの遷移元横断契約へ改訂。決定表、詳細表示、UI 実装方針、Test Focus を同期。 |
| 2026-06-27 | Design Phase | 入出庫記録・在庫変動追跡の完成形、操作ログとの役割分担、取消/訂正、出力、実装スライスを定義。 |
| 2026-06-27 | PR #114 L3 feedback | 旧 TRACE-D11 として検索条件付き戻り導線と、不正な `returnTo` のフォールバック方針を追加。 |
| 2026-06-27 | Detail expansion Design Phase | §65.10 slice 4 として入庫 / 返品・交換 / 手動販売 detail、`listInventoryRecords` 4種横断、UI-02/03 recent detail 導線、UI-04 保存結果 detail 導線、返品画像 asset 表示の非 scope を明記。 |
| 2026-06-28 | Manual sale recent follow-up | UI-04 手動販売出庫にも保存直後確認用の recent list と `すべての履歴を見る` / detail 導線を置く方針へ更新。 |
| 2026-06-30 | UI-03 note visibility follow-up | 返品・交換詳細の備考を独立表示し、入力なしの場合も `備考なし` として確認できる方針を追加。 |
| 2026-07-11 | UI-11c Design Phase | §65.8.3 に [74-ui-operation-logs.md](74-ui-operation-logs.md) への正典リンクと、関連記録リンクの明示 contract（許可リスト・record_type未対応。record_idはreceiving/disposal/returnsの3 producerが書き込み済み）を追記。 |
| 2026-08-03 | CSV取込み詳細 Design Phase | §65.10 に slice 4b（CSV取込み詳細 route + `getCsvImportRecord(id)`。PR #57 owner L3 の 404 backlog 起源）を追記。詳細表示項目・route・command 契約は既存 §65.3 / §65.5 / §65.7.1 を変更せず正とする。 |
| 2026-08-03 | ui-polish-batch-b（本 PR） | §65.8.1 に入出庫履歴ハブの filter-empty reset action（catalog ⑥、絞り込み非既定 + 0 件時の「絞り込みを解除」）を追記。 |
| 2026-08-04 | ui-consistency-batch | TRACE-D12 として商品検索欄を共有 `SearchBar` live 型へ統一。§65.5 は owner 裁定の選択肢 A（実態同期）に従い、「商品コード / 商品名 / 部門」を全列 yes のまま維持し、JAN を全列 no の独立行へ分割した。5 詳細画面への JAN 列追加（選択肢 B）は業務上の必要性が生じた場合に再検討する。 |
| 2026-08-27 | 棚卸し詳細 Design Phase | §65.10 に slice 4c（棚卸し詳細 route + `getStocktakeRecord(id)`。2026-08-26 遷移契約 sweep の 404 起票起源、owner 裁定 = 詳細先行実装）を追記し、§65.8.3 の `stocktake` 除外理由を「route 未実装」から「`record_type` producer 0 件」（csv_import と同型）へ差し替え。差異は補正 movement を正とする定義を明記。詳細表示項目・route・command 契約は既存 §65.3 / §65.5 / §65.7.1 を変更せず正とする。 |
| 2026-08-28 | 6 種対称化 Design Phase | owner 裁定 2026-08-27/28 に基づき、§65.10 slice 4d として `/inventory/records` の CSV取込み / 棚卸し横断合流、status 4 値 filter、検索母集団差の operator 注記、棚卸し差異件数表示を確定。 |
