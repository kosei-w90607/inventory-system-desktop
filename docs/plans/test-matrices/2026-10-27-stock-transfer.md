# Test Design Matrix: 在庫の振替（詰め替え・切り分け。導入の前の関門 9）

Plan Packet: [2026-10-27-stock-transfer](../2026-10-27-stock-transfer.md)。期待値は設計正本（D-143、ADR SPEC-STK-CNT-D1〜D3・D9 と横断の約束の表、tracking §14、transaction §11a-11b、10 SPEC-UNIT-D2・D3 と「入力の上限と安全な整数の範囲」(a)、21 §10.5a、22 §21、31 §12.6b・§12.8、44 §23.7・§23.7a、65 TRACE-D11・D14、66 の Filters、74 UI-11c-D7、79）から写し、実装から写さない。test の名前は実装の Writer が決め、行の ID を test の名前か comment に入れる。fixture は合成の商品と値だけ。

## Risk

Risk: R4

## Contracts Under Test

- vT が `inventory_movements` を全行・全列・id・`sqlite_sequence` のまま作り直し、2 つの CHECK に `transfer`・`transfer_record` を足し、`transfer_records`・`transfer_items` を作る。どの DB でも止まらない（22 §21）。
- `create_transfer` が 1 つの TX で、減らす明細に負・増やす明細に正の `transfer` の movement を明細ごとに 1 つ作り、業務日はヘッダの日付、phase 0、記録を指す参照を持ち、各商品を求め直す。検証は全て書く前で、失敗は何も残さない。冪等の再送を 1 つにする。原価を変えない（31 §12.6b）。
- 振替の movement は D-118 の求め直しで入出庫の movement と同じに扱われる（ADR D3 の判定表、D9 の初期在庫の印に当たらない）。
- 振替の記録は入出庫履歴の種別・商品の絞り込み・件数、記録の詳細、在庫変動履歴の元記録、操作ログの関連記録で追える（65 TRACE-D14、74 UI-11c-D7）。
- 作成画面は 2 つの表で入力し、同じ商品を両方に入れさせず、長さの商品を m で受けて cm で送り、保存結果と recent list から詳細へ `returnTo` 付きで進め、C23 で query を無効化する（79）。
- enum の wire の値と DB の CHECK の値の集合が同じ（D-061・D-064）。

## Failure Modes

- vT が列を取り違えて写す（`quantity` と `stock_after` の入れ替え等）、id を振り直す、`sqlite_sequence` を戻さない、index を作り直さない、値のある DB で止まる。
- 減らす明細の movement が正、または片方の明細だけが movement を作る。途中の失敗で記録・明細・movement・操作ログが残る。
- 業務日が保存の日、phase が 1、`reference_type` が NULL（初期在庫とみなされ計数の前に置かれる）。
- 同じ日付の既定の計数のある商品が要再確認にならない、計数より前の振替が計数に足される。
- 同じ商品を減らして増やす記録が保存される、片側 0 行が保存される、数量 0・負・上限越えが通る、m の入力が cm に直らない。
- 商品の原価が変わる。
- 入出庫履歴で振替が出ない、増やす側の商品で検索して当たらない、件数が明細の数でない。在庫変動履歴の元記録が無い・違う route。
- 片方の表の検索の結果が保存の後に行を足す。key の扱いの誤りで二重の記録。
- C23 の集合が oracle と違う（過不足）。

## Test Matrix

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| M1 | 22 §21 手順 3・4 | 列の取り違え・id の振り直し | schema（Rust） | vT 空の DB と直前の版の DB で成功し、全 movement の全列と id が同じ | 写す列の並びを 1 つずらす、`id` を写さない |
| M2 | 22 §21 手順 4 | `sqlite_sequence` を戻さない | schema | 末尾の行を消した fixture で vT の後の次の INSERT の id が前の `sqlite_sequence` + 1 | 手順 4 の `sqlite_sequence` の書き戻しを外す |
| M3 | 22 §21 手順 3・4 | CHECK・index の欠け | schema | vT の後に `transfer`・`transfer_record` の行が入り、`convert` が拒まれ、3 つの index と 2 つの表の index がある | CHECK に値を足さない、index を作り直さない |
| M4 | transaction §11a-11b | 表の CHECK の欠け | schema | `transfer_items` の `direction='x'`・`quantity=0`・同じ記録の同じ商品の 2 行目、`transfer_records` の空の key と形の違う日付が拒まれる | CHECK か UNIQUE を書き落とす |
| M5 | 22 §21 手順 5 | 確かめの失敗で中途半端に残る | schema | 手順 5 の確かめが失敗する状態（test の中で作る）で schema・値・版が何も変わらず `MigrationFailed` | 確かめを外す、ROLLBACK しない |
| M6 | 22 §21 手順 1 | 値のある DB で止まる | schema | 入庫・返品交換・手動販売・廃棄・初期在庫・Z004（`phase = 1`）の movement と計数・棚卸しを持つ DB で成功し、写しが vT の前と同じ | 止める検査を足す、値を変える |
| B1 | 31 §12.6b 手順 8 | 符号・参照・業務日の誤り | integration（Rust、in-memory DB） | 元 A（個）3・先 B（個）6 で、A に -3・B に +6 の `transfer` の movement、`reference_type='transfer_record'`、`reference_id=record_id`、`business_date=transfer_date`、`phase=0`、写しが A -3・B +6 | 符号を逆にする、業務日に今日を入れる、参照を外す |
| B2 | D-143 (1)、31 §12.6b | 複数行の明細の扱い | integration | 元 2 行・先 1 行の記録で 3 つの movement と 3 つの明細、`stock_after` が各商品の求め直しの値 | 最初の行だけ処理する |
| B3 | 31 §12.6b 手順 1 | 片側 0 行が通る | integration | 減らす明細だけ・増やす明細だけ・空の items が `ValidationFailed`（各文）で、4 つの表の行数が変わらない | 手順 1 の検査を外す |
| B4 | 31 §12.6b 手順 5 | 同じ商品の 2 回目が通る | integration | 同じ商品を減らす側と増やす側に入れる、同じ側に 2 回入れる、のそれぞれが `明細{n}: 同じ商品が2回入っています（{code}）` で何も書かない | 重複の検査を外す（DB の UNIQUE が先に当たると別の error になる） |
| B5 | 10 (a)、31 §12.6b 手順 5 | 上限と 0・負 | integration | 数量 `9999999` は通り、`10000000`・0・-1 は各文で止まる（減らす側と増やす側の両方で） | 片側だけに上限を掛ける |
| B6 | SPEC-UNIT-D2 | 長さの商品の数量の単位 | integration | 長さの商品 300（cm）を減らすと写しが 300 減る（m への換算を BIZ でしない） | BIZ で 100 倍・100 分の 1 にする |
| B7 | 31 §12.6b 手順 2 | 日付の形と暦 | integration | `2026-4-7`・`2026-02-30` が各文で止まる | `validate_business_date` を呼ばない |
| B8 | 31 §12.6b 手順 5 | 無い商品 | integration | 無い商品コードで `NotFound`、何も書かない | TX の中で見つけて一部を書く |
| B9 | 31 §12.6b 手順 8・D-118 | TX の中の失敗で一部が残る | integration | 増やす商品の在庫が上限を越える記録（先に元の movement を書く順）で `在庫数が大きすぎます`、4 つの表の行数と元の商品の写しが呼ぶ前と同じ | TX を明細ごとに分ける |
| B10 | 31 §12.6b 手順 0 | 冪等キーの検査 | integration | 空・空白だけ・256 文字の key が各文で止まる | key の検査を外す |
| B11 | 31 §12.6b 手順 3・4、§12.8 | 冪等の再送と衝突 | integration | 同じ key・同じ内容（明細の順を入れ替えたものを含む）で `idempotent_replay: true` と同じ `record_id`、行が増えない。同じ key・違う内容で `IdempotencyConflict` | fingerprint に向きを入れない（向きだけ違う内容が replay になる） |
| B12 | 31 §12.6b 手順 8・9 | 警告と操作ログ | integration | 元の在庫が負になると `stock_warnings` に商品コードの昇順・重複なしで入る。操作ログが `transfer_create` の 1 行で detail_json に `record_type: "transfer_record"` と `record_id` | 警告を落とす、detail に 2 field を書かない |
| B13 | D-143 (4) | 原価が変わる | integration | 保存の前後で元と先の `products.cost_price_centi` と `price_history` の行数が同じ | 先の原価を書く |
| B14 | 44 §23.7a | CMD の error の写像 | unit（CMD） | `ValidationFailed`→`validation`、`NotFound`→`not_found`、`IdempotencyConflict`→`idempotency_conflict` | 写像を落とす |
| L1 | ADR D3 の理由 2 | 同じ日付の計数で要再確認にならない | integration | 先に B に日付 D の既定の計数 5、日付 D の振替（B を減らす 1）で B が要再確認（範囲 4〜5）、A は要再確認でない | 振替の movement を求め直しで落とす |
| L2 | ADR D3 の判定表（入出庫の行） | 計数より前・後の日付の扱い | integration | 計数の日付 D、振替の日付 D-1 は計数に入り（写し = 計数値）、D+1 は入らない（写し = 計数値 + 振替） | 業務日でなく保存の時刻で判定する |
| L3 | ADR D3（fresh な計数） | fresh な計数との前後 | integration | 振替の後に「入れ直す」（fresh）を保存すると、同じ日付の振替は入る（要再確認でない） | movement の id のカーソルの比べを振替だけ外す |
| L4 | ADR D9 | 初期在庫とみなされる | integration | 振替の movement を持つ商品の求め直しで、振替の movement が `INITIAL_STOCK_SQL` に当たらない（初期在庫の印が偽）。`biz::stock_ledger` の diff が空（AC3） | `reference_type` を NULL で書く |
| R1 | 21 §10.5a、44 §23.7 | 種別で出ない | integration | `list_inventory_records` の `record_type: "transfer_record"` で振替だけ、`"all"` に含まれる、件数（`item_count`）は明細の数、`detail_route` が `/inventory/transfer/records/{id}` | `SPECS` に行を足さない、許可の `matches!` に足さない |
| R2 | 65 TRACE-D14 | 増やす側の商品で当たらない | integration | 商品の絞り込みに先の商品のコードで当たる、部門の絞り込みも同じ | 明細の片側だけを検索の母集団にする |
| R3 | 21 §10.5a | 詳細の形 | integration | `get_transfer_record` が減らす明細を先、明細の id の順、単位つき、関連 movement 2 つ（`source` が補われる） | 並びを id だけにする、source を補わない |
| R4 | 21 §10.5a、44 §23.7 | 無い id・未対応の種別 | integration | 無い id で `not_found`、`record_type: "unknown_type"` は今のまま `validation` | NotFound の変換を落とす |
| R5 | 65 TRACE-D2・D14 | 元記録の link | unit | `resolve_movement_source(TransferRecord, 7)` が label `詰め替え・切り分け #7`・route `/inventory/transfer/records/7` | arm を足さない |
| E1 | D-061・D-064 | wire と CHECK の値の集合のずれ | unit（`finite_enum_contract_tests.rs`） | `MovementType::Transfer`・`ReferenceType::TransferRecord`・`TransferDirection` の 2 値が wire の文字列と DB の CHECK の値と一致 | CHECK か enum の片方だけに値を足す |
| U1 | 79 UI-16-D1、C-NAV | 到達できない | integration（frontend、router） | サイドバーの入出庫の廃棄・破損の次に「詰め替え・切り分け」、`/inventory/transfer` で題と active | navigation に足さない、順を違える |
| U2 | 79 UI-16-D2 | ad hoc invoke | unit | `commands.createTransfer`・`commands.getTransferRecord` の mock だけを通る | `invoke` を直に呼ぶ |
| U3 | 79 UI-16-D3 | 表の扱い | component | 2 つの表に Enter で足せ、同じ表の再追加で数量 +1、もう片方の表にある商品は足されず案内が出る、payload の `direction` が表に対応し items の順が減らす → 増やす | 片方の表の追加を他方に入れる、案内を出さない |
| U4 | 79 UI-16-D4 | 片側 0 行で保存できる | component | どちらかの表が 0 行で保存ボタンが disabled、理由の文が出る | disabled の条件を片側だけにする |
| U5 | 79 UI-16-D4 | 数量の検証と単位 | unit（`transfer-request.ts`） | 0・負・形の誤り・上限越えを止め、`m` の商品の `1.5` を `150` で送る、個数の商品の小数を止める | 換算の純関数を通さない |
| U6 | 79 UI-16-D6 | key の扱い | component | 失敗の後の同内容の再試行で key を再利用し、成功・リセット・編集の後は新しい key | 再試行のたびに key を作る |
| U7 | 79 UI-16-D7 | 保存中の検索の結果 | component | 保存中は 2 つの追加欄が disabled、保存 event と競合して完了した検索の結果を反映しない | lock を片方の欄だけで読む |
| U8 | 79 UI-16-D8 | 保存結果の欠け | component | record_id、減らした・増やした一覧（数量と単位）、warning、replay が読め、ページ先頭へスクロールする | 一覧の片方を出さない |
| U9 | 79 UI-16-D9 | recent list | component | `listInventoryRecords` を `record_type: "transfer_record"`・page 1・per_page 10 で呼び、空・失敗・成功を出す、「すべての履歴を見る」が `/inventory/records?recordType=transfer_record` | 種別を渡さない |
| U10 | 79 UI-16-D10、D-052 | invalidation の過不足 | integration（`invalidation-contract.meta.test.ts`） | 保存成功の実呼出しの集合が独立に写した C23 の oracle と完全一致（順は問わない、重複を検出） | `disposals.root()` を含める、`stocktake.recheckList()` を落とす |
| U11 | 79 UI-16-D11、TRACE-D11 | 戻り先 | integration（router） | 保存結果と recent list の「詳細を見る」が `?returnTo=%2Finventory%2Ftransfer` を付けて詳細へ進む | returnTo を付けない |
| U12 | 79 §79.8 | 詳細の欠け | component | 詳細に 2 つの表（単位つき）、関連在庫変動、取消の代わりの案内、戻り先の fallback `/inventory/records` | 片方の表を出さない、案内を出さない |
| U13 | 66、65 TRACE-D14 | 種別の label | unit（`movement-formatters.test.ts`） | `formatMovementType("transfer")` が「詰め替え・切り分け」 | label を足さない（型の error にもなる） |
| U14 | 66 Filters、65 TRACE-D14 | 選択肢の欠け・順 | unit（`search.test.ts`、`StockMovementsPage.test.tsx`） | `MOVEMENT_TYPE_OPTIONS` と `INVENTORY_RECORD_TYPE_OPTIONS` の廃棄・破損の次に「詰め替え・切り分け」、選ぶと `type=transfer` / `recordType=transfer_record` | 選択肢を足さない、順を違える |
| U15 | 74 registry | 操作ログの label | unit（`operation-type-labels.test.ts`） | `transfer_create` が入出庫の「詰め替え・切り分け記録」 | label を足さない |
| U16 | 74 UI-11c-D7 | 関連記録の link | component（`OperationLogsPage.test.tsx`） | detail_json の `record_type: "transfer_record"`・`record_id: 7` で `/inventory/transfer/records/7` へ進む link | 許可リストに足さない |

oracle の anchor: U14 の期待は 66 の Filters と 65 TRACE-D14 の語（「詰め替え・切り分け」）から写す。U10 の oracle は 79 UI-16-D10 の 8 つの key の列から写し、production の `invalidation-contract.ts` を import しない。M1 の期待の列は 22 §21 の手順 3 の「今の 13 列」を `PRAGMA table_info` の結果と比べ、vT の前の版の表から写す。

## 既存の test の移し方

| ID | 既存の test | 移し方 |
|---|---|---|
| T1 | 既存の movement・記録の一覧・在庫変動履歴・migration の test（`rg -n 'fn test_list_inventory_records\|fn test_list_movements\|fn test_v11' src-tauri/src` で数える） | 期待を変えない。最新の版を期待する test は `app_max_version()` と比べる形（22 §21 の「テスト」） |
| T2 | `src/features/products/search.test.ts` の `MOVEMENT_TYPE_OPTIONS`・`INVENTORY_RECORD_TYPE_OPTIONS` の `toEqual`、`StockMovementsPage.test.tsx` の `REMAINING_MOVEMENT_TYPE_OPTIONS`、`operation-type-labels.test.ts`、`invalidation-contract.meta.test.ts` の entry の一覧、`unsaved-changes-guard-sweep.test.ts` の画面の一覧、`navigation.test.ts` | 振替の 1 項目を正本の位置に足す（ほかの項目と順は変えない） |
| T3 | `src-tauri/src/db/inventory_repo.rs` の `as_str` の test、`finite_enum_contract_tests.rs` | 新しい値の 1 行を足す |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 作成画面の form | 日付は今日、2 つの表は空、保存は disabled | 保存中は入力と 2 つの追加欄が disabled | 保存結果、form は操作不可 | C23 の query | 最近の記録と在庫の画面の query | 「続けて」で空の form と新しい key | アプリの再起動で空の form | Alert、入力と key を保持 | 同内容は同じ key、編集の後は新しい key | U3〜U9 |
| 振替の記録 | 無い | 1 つの TX | 記録・明細・movement・操作ログ | — | 詳細と一覧が読む | 詳細を開き直すと同じ内容 | 再起動の後も同じ | 何も残らない | 冪等の再送は同じ記録 | B1〜B12、R3 |
| 商品の写し（在庫・要再確認） | 振替の前の値 | — | 求め直した値 | 商品の画面・在庫変動履歴の query | — | — | — | 呼ぶ前の値 | — | B1・B9・L1〜L4 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 作成画面の商品追加（Enter・候補・フォーカス戻し・async lock、UI-05-D5・D6・D15・D16） | `src/features/disposal/DisposalPage.tsx`・`receiving`・`manual-sale`・`return-exchange` の各 page | `StockTransferPage` の 2 つの追加欄（lock は 1 つを共有） | 種別・理由・原価の列は持たない（D-143 (4)） | U3・U7 |
| 冪等キー（UI-05-D9） | 4 つの作成画面 | `StockTransferPage` | — | U6 |
| recent list と returnTo（UI-05-D12・D17、DSR-18） | 4 つの作成画面と記録の詳細 6 画面 | `StockTransferPage`・`TransferRecordDetailPage` | 一覧は `listInventoryRecords` で読む（種類ごとの一覧の command を作らない） | U9・U11・U12 |
| 未保存の離脱ガード（UI_TECH_STACK §6.11） | `unsaved-changes-guard-sweep.test.ts` の一覧 | `StockTransferPage` | — | T2 |
| 種別の label の表（`Record<MovementType, string>`） | `movement-formatters.ts`（`MovementTable` と `StockHistoryTable` が共有） | 1 行 | — | U13 |
| 記録の種別の一覧（`RecordSpec`） | `disposal_repo.rs` の `SPECS` 6 行 | 1 行 | — | R1・R2 |
| 操作ログの関連記録の許可リスト | `OperationLogsPage.tsx` の表、74 | 1 行 | — | U16 |
| `inventory_movements` の作り直し（vZ） | `schema_v11.rs` | `schema_v13.rs` | 止める検査は持たない（22 §21 手順 1） | M1〜M6 |

## Negative Paths

- missing input: 片側 0 行（B3・U4）、空の key（B10）。
- invalid input: 数量 0・負・上限越え・形の誤り（B5・U5）、日付の形と暦（B7）、`direction` の一覧外（serde の拒否、E1）。
- duplicate/ambiguous input: 同じ商品の 2 回目（B4・U3）、同じ key の違う内容（B11）。
- unknown reference: 無い商品（B8）、無い記録の id（R4）、未対応の種別（R4）。
- dependency missing: not applicable（外部の依存なし）。
- permission/write failure: TX の中の失敗（B9）、vT の確かめの失敗（M5）。
- dry-run side effect: not applicable。

## Boundary Checks

- threshold: 数量 `9999999` / `10000000`（B5）、在庫の上限（B9）。
- null/default: 日付の既定は今日（U3 の初期状態）、`settlement_no` は NULL（B1）。
- empty/non-empty: 片側 0 行（B3）、items が空（B3）。
- min/max: 数量 1（B5）。
- status/policy enum: `direction` の 2 値（E1）、詳細の `status` は `active`（R3）。
- wire type: `TransferDirection` の union、`MovementType`・`ReferenceType` の union の広がり（AC4）。
- internal type: DB の `direction` TEXT と CHECK（M4）。
- producer/consumer: `list_inventory_records` → 入出庫履歴、`list_movements` → 在庫変動履歴（R1・U14）。
- round-trip token: `/inventory/records?recordType=transfer_record`（U9・U14）、`returnTo`（U11）。
- precision/range: m の小数 2 桁 → cm（U5）。
- cross-language parse: `"transfer"` の label が TS の `Record` の全 variant を網羅（U13）。

## Compatibility Checks

- old schema/input: vT の前の版の DB の全行（M1・M6）。
- new schema/input: `transfer` の行（M3）。
- output order: 既存の選択肢の順は変えず、廃棄・破損の次に足す（U14）。
- optional field behavior: not applicable（新しい optional の field は無い）。

## Data Safety Checks

- fixture は合成の商品コードと値だけで、店の実値・実 DB を含まない。
