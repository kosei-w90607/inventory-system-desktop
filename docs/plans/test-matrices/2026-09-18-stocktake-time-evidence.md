# Test Design Matrix: 棚卸しと後着売上の時点証拠

## Risk

Risk: R3（対象契約のimpact）。現在の作業はdesign-only。以下のruntime検証は未実施であり、設計モデルのPASSを代用しない。

## Contracts Under Test

- REQ-205 / REQ-401、[時点証拠ADR](../../adr/2026-09-18-stocktake-time-evidence.md) SPEC-STK-TIME-D1〜D9。
- D-D1 / D-D2: snapshot差分でカウント後の移動を保存する。
- INV-2 / D-051: 現在庫と有効movement合計を維持する。

## Failure Modes

- 不明な始端、保存時刻だけ、任意の時間幅で誤った前後を確定する。
- 古い入力、同秒操作、ABA、再送を新しい実測として適用する。
- 受領済み資料と取込み済み売上、資料の欠落と現在庫復旧を混同する。
- 取消が実測で吸収された数量を二重に戻す。
- 旧snapshotを新方式へ無検証で流す。

## Test Matrix

名前はruntimeで追加する予定名。既存の実装テストとして存在・成功を主張しない。

| Contract | Failure Mode | Test Type | Test Name / oracle | Would fail if... |
|---|---|---|---|---|
| D1 | 計数中の移動、減算後加算で同じ数量 | state / TX | `req205_count_revision_aba` / 書込み0で拒否、新contextなら保存可 | 数量だけを比較する、60分を過ぎると許可する |
| D1 | 画面切替・再起動・sleep・時刻変更・監視登録失敗 | UI / state / native | `count_context_invalidation` / generation不一致、時計経過差の許容差超過、通知登録失敗で保存不可 | 商品revisionだけで検出できると思う、Instantだけでsleepを検知する、stale値を新時刻で再送する |
| D1 | 応答喪失と同じ保存の再送 | integration | `req205_count_save_idempotency` / 補正と実測は一度だけ | 同じ要求で新たな補正を作る |
| D2 | 受領と計数開始の順序 | boundary | `req401_receipt_before_count_start` / 開始前だけスキップ証拠になる | source_cursorを保存時に取得する |
| D2 | 時計異常・時刻なし・初回 | recovery | `req401_recount_after_received_source` / 受領→新実測→commitで現在庫不変 | 時計修正だけで古い日時を信用する、復旧不能にする |
| D3 | 初回の開始不明 | negative | `req401_unknown_start_no_midnight` / before証拠がなければunknown | 前日0時を補完する |
| D3 | 逆順・欠番・reset・同じ分の精算 | compatibility | `req401_settlement_series_uncertainty` / 証拠のある境界だけ使用 | 受領順を精算順にする、同時刻を即正常/即異常と断定する |
| D3 | 同じ精算の別hash | duplicate | `req401_settlement_identity_conflict` / 自動追加を拒否 | hashが違えば同じ精算を二重計上する |
| D3 | 0売上・取消済み資料 | persistence | `req401_source_survives_zero_and_rollback` / 受領事実を維持 | 0件guard/取消で境界の事実を失う |
| D4 | 実測窓と精算区間の接触・包含 | boundary / model | `check_bounds` / before・afterと断定した全組がoracleと一致 | SでなくEでbeforeを判定する、接触を確定扱いする |
| D4 | 日跨ぎ・精算後販売 | regression | `req401_sale_after_settlement_before_count` / unknown→再実測 | 日付が翌日なので通常適用する |
| D4 | 日計0、実測前販売・実測後返品 | regression | `req401_zero_net_nonzero_after_count` / 現物との差を残さない | ゼロ行を判定前に捨てる |
| D4 | 共有JAN、未実測と実測済み・在庫非連動候補の混在 | negative / model / integration | `check_counterexamples`、runtime `req401_shared_jan_all_candidates` / 一意でない在庫の自動配賦を正しい扱いにしない | 先頭候補だけで再確認を閉じる、在庫連動候補が一つなら共有を見逃す |
| D4 / D5 | 共有JANや時計/EJ未検証を本番準備済みと表示 | state / UI | `pos_stock_readiness_preflight` / 自動連動できない条件を有効化前に表示し、値の無断変更なし | 恒久的に保留する設定を通常利用可能と扱う |
| D4 | flag残存とforce_fill | state | `req205_recount_flag_blocks_complete` / 確定拒否 | 補完で未解決を隠す |
| D4 | preview→commitで新実測・取消・資料追加 | TX | `req401_commit_rechecks_evidence` / 現在の証拠で再判定 | preview結果を確定値として使う |
| D5 | EJの先頭・末尾・中間・続きの欠落 | parser / integration | `req401_ej_coverage_boundaries` / 不完全な自動分割は拒否 | 存在するfileだけで完全とする |
| D5 | 相殺する読み落とし、未知形式、名称変更/衝突 | parser / negative | `req401_ej_per_receipt_validation` / 判定不能を残す | 日計純数量だけで検算する、未知行を無視する |
| D6 | 同秒のimport→countとcount→import | sequence / model | `check_lifecycle`、runtime `req401_rollback_count_cursor` | timestampの不等号だけで先後を決める |
| D6 | 反復count、複数再実測、後続active | regression / model | `check_lifecycle`、runtime `req205_req401_rollback_first_absorber` | supersededなpendingを使う、複数の観測へ重ねて補償する |
| D6 / D8 | legacyの吸収不明を通常取消へ落とす、旧pendingの証拠を残す | regression / model | `check_legacy_recovery` / migration時点でpendingだった場合も、取消前write0、再確認後の取消とactive確定で二重補正なし。後着fileは新しいRの時点窓で判定 | legacyを吸収なしと扱う、復旧時にactiveの古い差異やS/E/source_cursorを残す |
| D7 | 過去の記録詳細からactiveを迂回 | negative | `req205_recount_active_owner_guard` / active明細へ案内 | 現在庫だけ補正し古いpending差異を残す |
| D7 | 同秒の確定・取消補償・再実測 | report | `req205_stocktake_movement_kind` / 確定差異件数は不変 | created_atで補正区分を推定する |
| D8 | 旧active snapshot、旧completed、NULL証拠、自動補完との区別 | migration | `req205_legacy_count_requires_recount` / kindで分類、歴史保持・旧activeの確定拒否 | 開始時snapshotを計数時snapshotへ読み替える、NULLからautoとlegacyを同一視する |
| D9 | 保留→一部保存→中断→再開 | native / integration | L3: 未保存だけ再確認、保存済み在庫を再適用しない | 全体commitまで値を寝かせる |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 計数context | なし | 開始・数量未保存 | 1商品TX | 商品/画面/版/時計変化 | stale入力を戻さない | 新context | 未保存は失効 | 書込み0 | 再計数 | D1、runtime未実施 |
| 独立再実測 | なし | 計数中 | 記録と補正が同時保存 | import取消で消えない | DBが正 | 記録詳細から新実測 | 保存済み保持 | TX rollback | 保存要求の重複防止 | D7、runtime未実施 |
| 資料受領 | 未受領 | 構文検証 | hash一意の受領記録 | 時刻証拠だけ失効可 | 受領と売上を区別 | 同hashは同ID | 保持 | 不正形式は証拠にしない | 同hash冪等 | D2/D3、runtime未実施 |
| import | 未取込み | preview/保留 | 売上と許可された在庫 | 新状態で再判定 | flag/保留を再取得 | 重複拒否 | preview再作成 | 業務write0 | 再実測後commit | D4、runtime未実施 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 商品単位のcount、IME、Enter | 73 UI-10-D2、stocktake_service/update_count | 通常計数・保留解除・記録詳細の訂正 | 新しい装飾/共有widgetは不要 | runtimeとnative L3は未実施 |
| import TXと重複検査 | csv_import_service/commit.rs、rollback.rs、32 §15.4/15.5 | 時点判定の直前・TX内 | 日報bundleは在庫を動かさないため不変 | runtime未実施 |

## Negative Paths

- missing / invalid input: 数量なし・負数、失効context、商品/親の不一致は書込み0。
- duplicate / ambiguous input: 同じ保存要求、同じhash、同じ精算の別hash、共有JANを別々に検証。
- unknown reference / dependency: legacy証拠、時計/EJ不明は通常適用に補完しない。未実測商品との区別を検証。
- permission / write failure: count記録・補正・flag・revisionの各段で故障を注入しTX全体が戻る。
- dry-run side effect: previewは資料受領の証拠だけを保存し、売上・在庫を変更しない。UIも取込み完了と表示しない。

## Boundary Checks

- threshold / precision: 境界接触、POSの分精度、検証済み時計誤差幅、同秒のアプリ操作。
- null / default: 始端なし・終端なし・時計未検証・旧実測を別々に扱う。
- empty / non-empty: 売上0でも判定対象あり、解消後の対象0、対象も証拠用途もないfile。
- min / max: 非負actual_count、加減算overflow、revision/cursorの範囲、wireに生の巨大整数を渡さない。
- status / token: superseded pending / active / completed / recount。clientがcursorを改竄しても採用しない。

## Compatibility Checks

- 既存帳票の構文受理と正規化は維持。精算メタなしは時刻証拠なしとして復旧可能。共有JANの先頭商品へ在庫を自動配賦する動作は意図的に変わる。自動在庫連動の本番前preflightで検出し、未対応の解除を可能と表示しない。
- 旧DBは履歴・評価額を保持。未検証metadataを補完して自動で有効化しない。
- 本番移行preflightはlegacy基準の在庫連動商品を件数・一覧で示す。実際の対象件数は未実測。再実測の作業量を隠して自動連動を有効化しない。
- 日報取込み、PLU書出し、商品単位でない売上の意味は変えない。

## Data Safety Checks

- 合成値のみ。実JAN・商品名・数量・金額・rawファイルをfixtureへ転記しない。
- source受領表にはhashと必要なメタ情報だけ。実データの原本を監査用に複製しない。
- DB/backup/secretを読み書きするprobeは禁止。本モデルは外部ファイル入力なし。

## Main Wiring / Integration Checks

- previewとcommitが同じBIZ判定を使い、commitのTX内再検証を省略しない。
- 通常計数・再実測・記録詳細が同じcontext検査を通る。
- 取消がcursor・flag・revisionへ接続され、結果と履歴がUIまで届く。
- bindings / traceability / command登録はruntime laneで同期する。

## Mutation-style Adequacy Questions

- SをEへ置換、未知の始端へ仮値挿入、境界 `<` を `<=` に変更、受領cursorを保存時に更新するとモデルの対応assertが落ちるか。
- snapshotの取消補正を削除、最初の吸収先を最後へ変更、全観測へ補償するとライフサイクル検証が落ちるか。
- 数量だけで版を比較、同秒で区分を推定、0行を除外、共有JANを先頭だけに縮退するとruntimeの該当検証が落ちるか。

## Residual Test Gaps

モデルは数学と順序の限定検証。Rust/SQLite/Tauri/Reactの配線、migration故障注入、実機の精算系列・EJ・時計、物理的な計数、Windows native L3は未実施。Plan Gate前に外部前提のprobeを確認し、runtime完了前に対応する検証を実施する。
