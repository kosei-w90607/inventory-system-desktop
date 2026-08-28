# Test Design Matrix: 入出庫履歴 6 種対称化 実装（65 slice 4d）— PR B

Plan Packet: [../2026-08-29-records-six-symmetry-impl.md](../2026-08-29-records-six-symmetry-impl.md)

## Risk

Risk: R3

## Contracts Under Test

- 65 §65.10 slice 4d: record_type 6 種横断（all = 6 種）、専用一覧 runway 残置
- 65 §65.6.1: status 正規化写像（csv: completed / completed_partial → active、rolled_back → canceled。stocktake: completed → active、in_progress → in_progress）
- 65 §65.4.1: status filter 4 値の外側 derived table 1 回適用 + in_progress の商品 / 部門 filter 構造的非 hit（既知の制約）
- 21-io §10.5: RecordSpec 拡張契約（status_expr / item_count_expr / date_expr / created_at_col / filter_item_extra_where）、status 早期リターン gate 4 値、空ページ挙動
- 21-io §10.5 / 65 slice 4d: created_at_col 写像（csv=`imported_at` / stocktake=`started_at`、両 table に created_at 列なし — disposal_repo.rs L433 ハードコードの置換）
- 65 slice 4d / D-d: csv の item_count / representative_item は is_voided 行を含む明細行数（TRACE-D6 履歴保持、filter 句なし = 既定 template 継続。gated Amendment 1）
- 44-cmd §23.7 / §23.10: record_type 6 種・status 4 値、BIZ 公開シグネチャ不変（内部 allowlist のみ拡張）
- 65 §65.8.1: hub UI — options 6 種 + 4 値、母集団差注記の確定文言、in_progress 両列「-」+「進行中」badge、completed × 差異 0 件の「差異なし」、明細数の種別別意味
- D-052 拡張: csvImportCommit / stocktakeStart へ `inventoryRecords.root()` 追加、stocktakeComplete は `stocktakeDetailRoot()` → `root()` 置換、productCreate / productImport 非変更 + 独立転記 oracle
- D-e: 拒否 test の oracle 意味追随（csv_import → unknown_type、test 名不変）
- rally r5 P3: filter 母集団と item_count 母集団の同一集合保証（重複条件の意図的保持）

## Failure Modes

- csv / stocktake 行が hub 一覧に出ない、または既存 4 種の行・件数・順序に回帰が出る
- status filter が no-op のまま（外側 WHERE 未設）/ gate 4 値拡張漏れで canceled・in_progress 検索が常に 0 件
- status 正規化 CASE の分岐落ち（completed_partial が canceled 化、rolled_back が active 化等）
- stocktake item_count が stocktake_items 全件数になる / is_voided 行・同一数値 id の他種別 movement を巻き込んで誤カウント
- dept / keyword filter・representative_item が cross-type id 衝突で他種別 movement に誤ヒット
- date_expr の DATE() ラップ欠落で単日検索（date_to 境界）から stocktake が消える / completed_at NULL で SQL エラー・誤日付
- created_at_col 欠落（csv_imports / stocktakes に created_at 列なし）で `no such column` 即クラッシュ
- created_at_col の値取り違え（date_expr との混同・誤列名の流用）で記録日時列がサイレントに誤表示される
- csv の item_count / representative_item へ is_voided filter が誤って追加され（stocktake 用パターンの copy-paste 等）、rolled_back csv の明細数・代表商品が履歴事実から欠落する
- in_progress 行が「明細なし」「商品なし」等で誤読される / 「差異なし」が汎用 fallback「明細なし」と取り違えられる
- 注記文言が §65.8.1 確定文言から drift する
- csvImportCommit / stocktakeStart / stocktakeComplete 後に hub 一覧が stale のまま（invalidation 欠落）/ productCreate 等へ過剰追加で無関係 query が refetch され続ける
- 拒否 test が旧 oracle（csv_import）のまま fail する / 差し替えで拒否機能自体の検証が消える
- BIZ 公開シグネチャ・bindings が変わり既存 consumer が壊れる

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- Test Name は実装時に確定するが、REQ token（REQ-206 / REQ-207）を含める既存規約に従う。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| slice 4d 6 種横断 + 順序 | csv / stocktake 行欠落・順序崩れ | unit (Rust) | T1 `test_list_inventory_records_req206_six_types`（6 種 seed 混在で all 検索、business_date 降順 assert） | SPECS 追加漏れ・UNION 列不整合・date_expr 誤り |
| §65.6.1 写像 | CASE 分岐落ち | unit (Rust) | T2 `test_list_inventory_records_req206_status_normalization`（csv 3 値 + stocktake 2 値の全 5 分岐を個別 seed。completed_partial は completed と区別した独立 seed） | 分岐を固定値化 / completed_partial を canceled 側へ倒す mutant |
| §65.4.1 外側 WHERE（active） | 取消済み・進行中が「有効」に混入 | unit (Rust) | T3 `test_list_inventory_records_req206_filter_active_excludes`（rolled_back csv + in_progress stocktake seed 込みで filter=active、非空期待 + total_count 整合） | WHERE 未設（no-op 継続）・count_sql 側の適用漏れ |
| §65.4.1 filter=in_progress | 進行中単独絞り込み不能 | unit (Rust) | T4 `test_list_inventory_records_req206_filter_in_progress`（stocktake のみ hit の非空期待） | gate 短絡・WHERE 値誤り |
| §65.4.1 filter=canceled | 取消済み単独絞り込み不能 | unit (Rust) | T5 `test_list_inventory_records_req206_filter_canceled`（csv rolled_back のみ hit・他 5 種除外の非空期待） | gate 短絡・rolled_back 写像誤り |
| 21-io §10.5 gate 4 値 | canceled / in_progress が空ページ短絡 | unit (Rust) | T6 `test_list_inventory_records_req206_status_gate_four_values`（canceled / in_progress 指定で結果が返る + 未知 status で空ページ） | gate の matches! 拡張漏れ（T4 / T5 の上流を独立検証） |
| D-b 差異件数 | 全件数化・is_voided 混入 | unit (Rust) | T7 `test_list_inventory_records_req206_stocktake_item_count_diff_only`（差異 2 件 + is_voided 1 件 seed で item_count=2 の数値検証。stocktake_items は対象商品 5 件以上 seed し全件数化を弁別） | item_count_expr の is_voided / reference_type 条件除去・stocktake_items COUNT 化 |
| D-f cross-type 衝突 | 同一数値 id の他種別誤ヒット | unit (Rust) | T8 `test_list_inventory_records_req206_cross_type_id_collision`（disposal_record と stocktake を同一数値 id で意図的 seed。dept filter / keyword filter / representative_item / item_count の 4 観点を非空期待 + 数値検証） | filter_item_extra_where の 3 テンプレート適用漏れ・item_count_expr の絞り込み欠落 |
| D-c csv business_date | imported_at で検索される | unit (Rust) | T9 `test_list_inventory_records_req206_csv_business_date_settlement`（settlement_date と imported_at を別日に seed し settlement_date 側で hit / imported_at 側で非 hit の対 oracle） | date_expr を imported_at へ倒す mutant |
| D-c stocktake COALESCE | in_progress の日付欠落・NULL エラー | unit (Rust) | T10 `test_list_inventory_records_req206_stocktake_date_fallback`（completed_at NULL の in_progress が started_at 日で検索 hit） | COALESCE 除去（completed_at 単独化） |
| D-c DATE() 境界 | 単日検索で完了棚卸しが消える | unit (Rust) | T11 `test_list_inventory_records_req206_stocktake_single_day_boundary`（completed_at = 検索日の 18:00 台で seed し date_from = date_to = 完了日で hit の非空期待） | DATE() ラップ除去（datetime と date-only の BINARY 比較退行） |
| rally r5 P3 母集団同一 | filter 母集団と item_count 母集団の片側 drift | unit (Rust) | T12 `test_list_inventory_records_req206_filter_and_count_same_population`（同一 fixture で keyword filter hit 行の item_count が filter 母集団と同じ movements 集合から算出されている regression。重複条件保持の code comment 明示は review で確認） | filter_item_extra_where と item_count_expr の条件が乖離する将来変更 |
| D-i 構造的非 hit | in_progress が dept/keyword filter に混入 / filter 無指定でも消える | unit (Rust) | T13 `test_list_inventory_records_req206_in_progress_filter_exclusion`（対象商品を持つ in_progress seed: dept / keyword filter 指定で非 hit + filter 無指定で hit の対 oracle） | EXISTS 母集団の変更・例外ロジック混入 |
| 既存 4 種 regression | 既定値継承の破れ | unit (Rust) | T14 `test_list_inventory_records_req206_existing_four_types_unchanged`（既存 4 種 seed の一覧・filter・件数・status='active' が従来と同一） | RecordSpec 既定値の指定漏れ・literal 'active' 置換の誤り |
| D-e oracle 差し替え | csv_import 正当化後に test fail / 拒否検証消失 | unit (Rust) | T15 = 既存 `test_list_inventory_records_req206_rejects_unknown_record_type`（oracle を `unknown_type` へ差し替え、test 名・意図不変） | allowlist が未知種別を通す実装 |
| 44-cmd §23.10 allowlist | 6 種・4 値の受理漏れ / 未知値素通し | unit (Rust) | T16 `test_list_inventory_records_req206_allowlist_six_types_four_statuses`（csv_import / stocktake 受理 + 未知 record_type / 未知 status の ValidationFailed 日本語文言） | BIZ allowlist 拡張漏れ・拒否文言喪失 |
| §65.8.1 options | 種別 / 状態 options の欠落・label drift | RTL | T17 = 既存 options oracle test を 6 種 + 4 値へ拡張し test 名「4種」→「6種」改名（label「CSV取込み」「棚卸し」は resolve_movement_source と独立転記で一致 assert） | options 追加漏れ・label 不一致 |
| §65.8.1 注記 | 確定文言 drift・非常設 | RTL | T18 注記 exact 文言 test（「商品・部門での絞り込みは、CSV取込みでは取込み明細、棚卸しでは差異のあった商品が対象です。」の独立転記 oracle、filter 部に常時表示） | 文言改変・条件付き表示化 |
| §65.8.1 in_progress 表示 | 「明細なし」誤読・badge 欠落 | RTL | T19 in_progress fixture で代表商品・明細数の両列「-」+「進行中」label text assert（色のみ判定は不可） | 「-」分岐欠落・STATUS_OPTIONS 拡張漏れ |
| §65.8.1 差異 0 表示 | 「明細なし」との取り違え | RTL | T20 completed × item_count 0 fixture で代表商品「差異なし」+ 明細数 `0` の独立 test | 汎用 fallback へ倒す実装 |
| formatRecordStatus | in_progress raw 表示 | unit (TS) | T21 `formatRecordStatus("in_progress")` = 「進行中」+ 既存値 regression | STATUS_OPTIONS 拡張漏れ（formatRecordStatus は options 先行検索で解決、if 分岐は追加しない） |
| created_at_col 写像 | 記録日時の値取り違え | unit (Rust) | T24 `test_list_inventory_records_req206_created_at_col_mapping`（csv / stocktake seed の imported_at / started_at を business_date と別日時に置き、記録日時値が imported_at / started_at と一致し business_date と異なることを assert） | created_at_col を date_expr と混同・誤列名流用する mutant |
| D-d csv is_voided 行含む | rolled_back csv の明細数・代表商品欠落 | unit (Rust) | T25 `test_list_inventory_records_req206_csv_item_count_includes_voided`（is_voided=1 明細 1 件 + is_voided=0 明細 1 件を持つ rolled_back csv seed で item_count=2 + representative_item が実商品名〈「明細なし」でない〉の非空期待 assert） | csv の item_count / representative_item サブクエリへ `is_voided=0` filter を追加する mutant |
| REQ-207 遷移 | href だけ正しく実遷移が壊れる | RTL + userEvent.click | T22 csv / stocktake 行の詳細ボタン click → SPA 遷移後の詳細 render assert（href assert 単独は不可 — batch A X3 survivor 教訓） | route path 誤り・link 非活性 |
| D-052 拡張 | invalidation 欠落・過剰 | unit (TS、独立転記 oracle、production SSOT 非 import) | T23 csvImportCommit / stocktakeStart / stocktakeComplete 新集合の順序非依存・重複検出付き完全一致（stocktakeComplete の root() 置換で stocktakeDetailRoot() が集合から消えること、productCreate / productImport の非変更も集合一致で担保） | SSOT から root() を削る / productCreate へ root() を足す / stocktakeComplete に stocktakeDetailRoot() が残る mutant |

## State Lifecycle Matrix

対象 state: hub 一覧 query（`queryKeys.inventoryRecords.list(query)`）+ 画面表示 + filter search state

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| hub 一覧 query / 画面 | 未 fetch（直接 URL 進入含む） | loading 表示（既存機構） | 6 種混在表示（T1 / T17-T21） | 既存 4 種 mutation の root()（従来どおり）に加え csvImportCommit / stocktakeStart / stocktakeComplete が root() 経由で stale 化（T23） | stocktakeComplete 後の再表示で in_progress → active + item_count「-」→ 差異件数へ更新（T2 / T7 / T23 の組） | filter search state（種別 / 状態 / 日付）は URL search param で保持（既存機構、T14 が回帰固定） | アプリ再起動後も直接 URL + filter param で再現（既存機構） | 未知 filter 値は BIZ 拒否 → describeError 表示（T16） | TanStack Query 既定 retry（既存設定） | Matrix + PR body |

- workflow-state 行（本 packet の遷移運用）:
  - content candidate → L1 / independent review → state-only human-confirm commit（STATECAP 3/PR、correction ループ時は content commit 同乗を優先）
  - owner authorization → Draft state-only Ready commit → exact-HEAD L1 → PR body → Ready/dispatch → merge（三点一致）
  - state-only violation: file allowlist + zero-context hunk の両検査
  - hosted failure: product/gate failure は implementing へ返す。既知の failpoint 並列 race flake が再発した場合は単独実行 PASS 確認 + PR body disposition 記録（PR #8 先例）

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| RecordSpec filter テンプレート（`{item_fk_col} = {header_alias}.id` 型） | dept EXISTS（disposal_repo.rs L363-379）/ keyword EXISTS（L380-403）/ representative_item（L416-426）/ item_count COUNT（L427-431）の 4 箇所全列挙 | stocktake は 3 テンプレートへ filter_item_extra_where 適用 + item_count は自己完結 expr 化 | item_count のみ extra_where 非依存の自己完結 SQL（rally r4 P1: 3 箇所適用だけでは COUNT が衝突・is_voided を巻き込む） | T7 / T8 |
| status 表示 label（formatRecordStatus） | types.ts L83-91（options 先行検索 + canceled / corrected の fallback if 既存） | STATUS_OPTIONS 4 値化のみ（formatRecordStatus は options 先行検索の既存実装で in_progress / canceled とも自動解決 — if 分岐追加なし、Plan Review round 1 P3-1） | corrected は slice 5 の将来軸で今回追加しない（§65.4.1 の区別記載どおり） | T21 |
| 種別 label の正本（resolve_movement_source） | list.rs L225-226（「CSV取込み」/「棚卸し」） | types.ts options label | — | T17（独立転記で一致 assert） |
| 一覧 → 詳細の href / 遷移機構 | InventoryRecordsPage.tsx 既存 4 種の詳細ボタン + 既存 disposal 遷移 test | csv / stocktake 行（詳細 route は slice 4b / 4c 実装済み） | 専用一覧 route は runway 残置で非対象 | T22 |
| D-052 root() invalidation | receiving / returnExchange / manualSale / disposal / csvImportRollback / supplierRename / supplierMerge（invalidation-contract.ts 実読 7 site） | csvImportCommit / stocktakeStart / stocktakeComplete | productCreate / productImport は hub 行と読取り交差なし（in_progress 両列「-」）で非追加。dailyReportImport は csv_imports 非書込みで非対象（実査済み） | T23 |
| 空集合 oracle 衝突回避（順22 X2） | 既存 Matrix 慣行 | T4 / T5 / T8 / T11 / T13 は非空期待が主 oracle | T13 の非 hit 側は hit 側との対 oracle で単独空集合期待にしない | 各 test |

## Negative Paths

- missing input: query 全項目 None = all 検索（T1 が 6 種横断を固定）
- invalid input: 未知 record_type / 未知 status → BIZ ValidationFailed 日本語文言（T15 / T16）、IO 単独では空ページ（T6 の未知 status case）
- duplicate/ambiguous input: cross-type id 衝突（T8 — 多態 FK の常態的重複を弁別）
- unknown reference: 差異 movement が product 欠損を持つ異常は既存 JOIN 方針を継承（既存挙動、変更なし）
- dependency missing: completed_at NULL（T10）
- permission/write failure: read-only のため該当なし
- dry-run side effect: 該当なし（書込みなし）

## Boundary Checks

- threshold: なし（page / per_page 機構は不変 — Non-scope）
- null/default: completed_at NULL の COALESCE fallback（T10）、RecordSpec 新 field の既定値（T14）
- empty/non-empty: filter=canceled / in_progress の非空期待（T4 / T5）、差異 0 件の item_count=0 表示（T20）、in_progress の「-」（T19）
- min/max: 単日検索の date_to 境界（T11 — 完了時刻を同日遅い時刻に置く fixture が oracle の核）
- status/policy enum: 正規化写像の全 5 分岐（T2）+ query status 4 値 allowlist（T6 / T16）
- wire type: InventoryRecordQuery / InventoryRecordSummary 型不変（AC4 差分ゼロ）
- internal type: RecordSpec 5 field 追加（IO 内部、wire 非露出）
- producer/consumer: 既存 CMD → Page 単一経路（変更なし）
- round-trip token: 該当なし（read-only）
- precision/range: i64 件数・id、JS safe integer 内（既存と同等）
- cross-language parse: bindings 差分ゼロのため新規 parse 面なし（AC4）

## Compatibility Checks

- old schema/input: schema 変更なし。既存の csv_imports / stocktakes 行（過去データ）がそのまま hub に現れる（T2 の写像が過去 status 値を全カバー）
- new schema/input: なし
- output order: business_date 降順の 6 種混在順序（T1）
- optional field behavior: representative_item の種別別表示（「-」/「差異なし」/ 既存 fallback — T19 / T20）
- 既存 wire: 既存 4 種の行の record_type / status 値・列構成不変（T14 + AC4）

## Data Safety Checks

- source-derived data: test fixture は synthetic のみ（実 POS / 実棚卸しデータの転記禁止)
- generated outputs: bindings.ts / 90-traceability.md は生成コマンド経由のみ（手動編集禁止）
- secrets: 該当なし
- local-only files: `.local/ci-evidence/`
- synthetic sample boundaries: L3 fixture は backup → synthetic 6 種 seed → 確認 → restore の往復。手順は Ready 依頼と同時に PR body へ記載

## Main Wiring / Integration Checks

- helper connected to main path: SPECS 追加 → UNION ALL 生成 → 既存 CMD 経由で FE 表示（T1 + T22 で end-to-end）
- output reaches manifest/report: 90-traceability 再生成に REQ-206/207 新規 test 行（AC11）
- effective config reaches runtime: D-052 SSOT → invalidateByContract 経由（T23 + 既存静的 gate）
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- mock 値と設計期待値の弁別: T17 / T18 / T20 の label・文言・「差異なし」は独立転記 exact 比較で production 定数を import しない（順6 教訓）。T23 の oracle も SSOT 非 import（D-052 既存 gate 継承）
- invalidate/refetch 順序: stocktakeComplete → stale → 再表示で in_progress 行が active + 差異件数へ変わる lifecycle を T2 / T7 / T23 の組で固定
- key branch 反転: status CASE 分岐（T2）、gate matches!（T6）、in_progress 表示分岐（T19 / T20）
- threshold 変更: 該当なし
- guard 除去: filter_item_extra_where 除去（T8）、is_voided 条件除去（T7）、DATE() 除去（T11）、COALESCE 除去（T10）
- output field 省略: options 欠落（T17）、注記非表示（T18）
- 出力順序変更: T1
- JSON safe integer: 既存 wire と同等のため既存検査を継承
- 空集合 oracle: T4 / T5 / T8 / T11 の主 oracle は非空期待（順22 X2 の素通し防止）

## 必須 mutation 注入（Final Review で clean tree 独立再実測、5 件級以上）

| ID | 注入 | red になるべき test |
|---|---|---|
| X1 | csv status_expr の rolled_back arm を 'active' 化 | T2 / T5 |
| X2 | 外側 derived table の WHERE status 条件を除去（no-op 復帰） | T3 / T4 / T5 |
| X3 | status 早期リターン gate を 3 値（active まで）へ戻す | T4 / T5 / T6 |
| X4 | stocktake item_count_expr の `is_voided=0` 条件除去 | T7 |
| X5 | stocktake filter_item_extra_where の `reference_type='stocktake'` 除去 | T8 |
| X6 | stocktake date_expr の DATE() ラップ除去 | T11 |
| X7 | date_expr の COALESCE を completed_at 単独化 | T10 |
| X8 | invalidation-contract の csvImportCommit から inventoryRecords.root() 除去 | T23 |
| X9 | InventoryRecordsPage の「差異なし」を汎用「明細なし」へ改変 | T20 |
| X10 | 注記文言の一部改変（例: 「差異のあった商品」→「対象商品」） | T18 |
| X11 | stocktake の created_at_col を `date_expr` 側の値（`DATE(COALESCE(completed_at, started_at))`）へ混同差し替え | T24 |
| X12 | csv の item_count / representative_item サブクエリへ `AND {item_alias}.is_voided = 0` を追加（stocktake 用絞り込みの誤 copy-paste 型） | T25 |

- 注入は commit 済み clean tree 上でのみ実施（未 commit 是正の消失防止 — PR #19 教訓）
- Writer の kill 主張は Final Review / Coordinator が Matrix どおりの実注入で独立再現する（順6 X3 / PR #27 X7 / 順22 X2 の教訓）

## Residual Test Gaps

- L3 視認（6 種混在の実表示・日本語 wording・filter 操作感・badge 視認性）は自動 test で代替不能 → Human Gate
- 実データ規模（数千行規模の UNION 6 種）での一覧性能は測定しない（LIMIT/OFFSET 機構不変・種別数 +2 の線形増のため既存と同等と推定、`未実測`）
- 専用一覧 / CSV 出力 / 印刷 / slice 5 取消・訂正は後続スライスへ deferred
- 旧 FE × 新 backend の中間状態互換は formatRecordStatus の未知値 fallback（既存実装）に依存し、desktop 同梱配布では発生しないため test 追加しない
