# Test Design Matrix: ㉗ 時点証拠 ADR の改訂

## Risk

Risk: R3（対象契約の impact）。本 lane は design-only。以下の本 lane の検証は docs の検索 oracle、doc check、合成モデルであり、runtime の test は ㉘ の packet が持つ。合成モデルの PASS を runtime の実装証拠にしない。

## Contracts Under Test

- [Plan Packet](../2026-09-23-stocktake-time-evidence-adr-revision.md) の Spec Contract SPEC-STK-TIME-REV-2026-09-23 R1〜R10。
- [時点証拠 ADR](../../adr/2026-09-18-stocktake-time-evidence.md) SPEC-STK-TIME-D1〜D9（改訂後）。
- 維持する既存契約: D-D1 / D-D2 の snapshot 補正 N-L、D6 の商品別純量の取消補償、D2 の受領順による実測前、確定済み評価額の非遡及、INV-2、D-051。

## Failure Modes

- 撤去した機構（OS 監視、PC 時計 epoch、POS 時刻基準、legacy 専用復旧）が ㉘ の契約として source に残り、実装者が作ってしまう。
- 撤去の巻き添えで、安全性に効く検査（revision・所有者・DB 世代・受領上限・ledger_cursor）まで消える。
- 一本化で、進行中の確定が未解消の要再確認を素通りする、在庫が現物へ収束しない、共有 JAN 行の保留が消える。
- legacy 取消の保留に、到達できる解除の経路がなくなる。
- 但し書きを消した結果、既存リンクが切れる、次の design lane が決めることが読めなくなる。
- 要求 token の増減で traceability の再生成が必要になる、runtime code に差分が入る。

## Test Matrix

名前の付いた check は本 lane の Writer が実行する。`req...` の名前は ㉘ で追加する予定名で、本 lane では存在も成功も主張しない。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| M1 R1 | OS 監視・環境の世代・時計差の検査が source に残る | docs search | packet AC2 (i) | 35 / 42 / 43 / 73 / MNT task のどれかに通知・世代・wall-clock の契約が残る |
| M1 R1 | 撤去の巻き添えで revision・所有者・DB 世代の失効が消える | Contract Audit | ADR D1 と 35 / 42 / 43 / 73 の読取り | DB 接続交換での全 context 失効、保存 TX の revision 再検査、abandon の記述のどれかが欠ける |
| M1 R1 | S/E を前後判定・失効に使う記述が残る | Contract Audit | ADR D1 / D4 の読取り | D4 の分類表に S/E との比較行が残る |
| M2 R2 | PC 時計 epoch・POS 時刻基準・時刻境界が残る | docs search | packet AC2 (i) | pos / tracking / 20 / 24 / 32 / 41 / 42 のどれかに基準・epoch・境界の列や API が残る |
| M2 R2 | 精算同一性 guard や settled_at まで消す | Contract Audit | ADR D3 と pos / 23 / 24 / 32 の読取り | 同一精算の別 hash の拒否、識別メタ不足の同日追加の拒否、settled_at の抽出・保存のどれかが欠ける |
| M2 R2 | 系列の証明がないのに同番の別 hash を別系列として通す | Contract Audit | ADR D3 / 32 の読取り | 「系列を証明する手段は本 ADR にない。同じ machine_no・settlement_no の別 hash は衝突として拒否」の趣旨が欠ける |
| M3 R3 | 実測後販売・実測前販売・数え直し前後の取消で在庫が現物へ収束しない | model | `check_unknown_apply_recheck`（新設） | 判定不能の行へ通常適用しない、または補正 N-L の計算が変わる（AC5 の mutation (i) で red） |
| M3 R3 | 要再確認 flag を保存しない、取消で消さない | model | `check_unknown_apply_recheck` | flag を保存しない mutation（AC5 (ii)）で red、取消後に flag が残る |
| M3 R3 | 進行中の確定が未解消の flag を素通りする | model / Contract Audit | `check_unknown_apply_recheck`、ADR D4 と 35 の読取り | 数え直し前の確定が通る |
| M3 R3 | 所属で保留へ分ける旧規則が残る | docs search | packet AC3 の検索 | ADR :132 相当か 32 の step 5 相当の文が残る |
| M3 R3 | 共有 JAN 行の保留が消える、非連動化の記録を残す理由が消える | Contract Audit | ADR D4 と 32 / 55 の読取り | 共有 JAN 行の file 全体保留、または `pos_sync_disabled_revision` の理由の記述が欠ける |
| M3 R3 | 確定済みに属する商品の flag が、どこにも表示されない | Contract Audit | 32 / 41 / 55 / 73 の読取り | 商品単位の準備 issue と回復先（active 明細、なければ独立再実測）が欠ける |
| M4 R4 | legacy の取消を保留せず通常の戻しへ落とす | model | `check_legacy_recovery`（改訂） | 保留しない mutation（AC5 (iii)）で red |
| M4 R4 | 保留の解除の経路がない、または active を迂回する | model / Contract Audit | `check_legacy_recovery`（改訂）、ADR D6 / D7 と 35 の読取り | active 明細がある商品で、計数と確定の後に取消の再試行が成功しない、または独立再実測で active を迂回できる |
| M4 R4 | 専用復旧の語が残る | docs search | packet AC2 (i) / (ii) | legacy 用 purpose・reason・action、N/N の再基準化、`rebase:` が残る |
| M4 R4 | legacy 分類・上限・reconciliation_version まで消す | docs search / Contract Audit | packet AC4 | tracking / 35 / ADR から上限か版の記述が消える |
| M5 D5 | EJ の完全性契約と外部 probe 表の EJ 行が消える | Contract Audit | ADR D5 と 32 の外部 probe 表の読取り | EJ 完全性・EJ 復元・商品同定の行、または D5 の箇条が欠ける |
| M6 R6 | layout B の現状を誤って書く | Contract Audit / git diff | ADR D3、project-memory :40 / :190 と 23 / backlog の照合、packet AC6 | Z004 の layout B を受理済みと書く、または対応時の同一性 guard との衝突を書かない |
| M7 R5 / R7 | 但し書きが source に残る、anchor が切れる | docs search / doc check | packet AC1、AC7 | source に但し書きの行が残る、または Plans / backlog / archive のリンク先の見出しがない |
| M9 R9 | 計数前の販売と計数後の返品が同じ精算で相殺し、帳簿が現物より 1 少ないまま残る | model | `check_unknown_apply_recheck`（R9 の場合） | 数量 0 の行を EJ の条件なしに flag なしとする mutation（AC5 (iv)）で red |
| M9 R9 | EJ が無いのに数量 0 の行を flag なしで通す、確認待ちで確定を通す | model / Contract Audit | 同 check の (c)、ADR D4 と 35 の読取り | 確認待ちで確定が通る、または EJ が無いのに flag が付かない |
| M9 R9 | 帰属できない行・商品別合計の不一致・別の精算の EJ を完全とみなし、名称変更後の商品を「行なし」にする | model / Contract Audit | 同 check の (d)、mutation (v)、ADR D5 と R9 の照合 | 帰属できない行があるのに区間の 0 行へ flag が付かない、照合に今のマスタ名を使う |
| M9 R9 | 数量 0 で金額が 0 でない行を EJ 待ちにする、または見落とす | model | 同 check の (e) | その行が相殺の行ありにならない |
| M9 R9 | 後から取り込んだ EJ で確認待ちを再評価しない、行ありを見落とす | Contract Audit | ADR D4 / D5 と 32 の読取り | 確認待ちが数え直しでしか解消しない、または行ありの EJ で解消してしまう |
| M9 R9 | 活動のない商品の行を相殺とみなして全商品に付ける | Contract Audit | packet Contract Probe（Z004 は全スロットを出力）と ADR D4 の照合 | 数量 0 の行そのものを flag の条件にする |
| M10 R10 | EJ の取込みと R9 がないまま在庫連動を有効にでき、複数日の棚卸しが確定に届かない | Contract Audit / docs search | packet AC10、ADR D4 と 30 / 32 の読取り | `ej_unverified` の間に create / update / 商品一括 import で在庫連動を有効にできる、checkbox や設定 key で `ej_unverified` が消える |
| M10 R10 | ㉘ 単体の状態を Ordinary Operation が正しく描かない | Plan Review | packet Ordinary Operation | ㉘ 単体の行で Z004 が在庫を動かす、または EJ ありの行で確定に届かない |
| M8 R8 | 台帳の owner 回答の理由が ADR から読めない、原文を公開 repository へ置く | Contract Audit | ADR Context / Rejected Options と台帳 L-054 / L-095〜L-099 の照合 | 6 件のどれかが欠ける、Rejected と Context を取り違える、発言の原文を引用する |
| M7 R7 | ㉘ が archive の旧申し送りを正として読む | docs search | packet AC8 | archive の 2 か所に差替えの注記とリンクがない |
| 全体 | runtime・生成物・要求 token に差分が入る | git diff | packet AC6 | `src` / `src-tauri` / 90-traceability に差分、または変更 docs の `REQ-nnn` の多重集合が変わる |

### ㉗ の archive Matrix の行の扱い（㉘ への申し送り）

[㉗ の Matrix](../../archive/plans/test-matrices/2026-09-18-stocktake-time-evidence.md) は ㉘ の runtime 検証の入力のまま残る。下表の行だけ、本 lane の改訂で置き換える。表にない行は変更しない。

| ㉗ Matrix の行（test 名） | ㉘ での扱い |
|---|---|
| `count_context_invalidation` | 画面切替・再起動・DB 交換・revision の失効だけを残す。sleep・時刻変更・監視登録失敗・時計差の条件を外す |
| `req205_count_monitor_unavailable` | 削除（計数環境の不成立という状態がなくなる） |
| `req205_count_context_db_generation` | 維持 |
| `req401_recount_after_received_source` | 維持（「時計異常」を「時刻を使わない」に読み替える） |
| D3 の時刻経路の行（`req401_unknown_start_no_midnight`、`req401_settlement_series_uncertainty`、`req401_time_evidence_*`、`req401_file_bounds_*`、`req401_clock_invalidation_survives_rollback` 相当、`check_bounds` の runtime 対応、PC 時計 epoch の行） | ㉘ の対象外として削除。時刻区間の合成モデルは次の design lane の入力として残す |
| `req401_settlement_identity_conflict` | 維持。「検証済み別 reset 系列は区別」を「系列の証明手段がないため同番の別 hash は常に衝突」へ置き換える |
| `req401_zero_net_nonzero_after_count` | R9 の 3 分岐（EJ に行なし → flag なし、行あり → 要再確認、EJ なし → 確認待ちで確定を拒否）へ置き換える。EJ の取引単位の前後で純数量を分ける部分は次の design lane |
| `pos_stock_readiness_*`（共有 JAN・時計/EJ 未検証の表示） | 時計の issue を外し、商品単位の要再確認 issue を加える |
| `req205_recount_flag_blocks_complete` | 維持。flag の key を (商品, 資料) に変える |
| `req401_active_legacy_import_recheck` | 所属によらず通常適用 + flag に一般化する（完了済み所属の file 全体保留の oracle を外す） |
| `req401_sync_disable_retains_recovery` | 維持。held の前提を共有 JAN 行に限る |
| D6 の legacy 行（`check_legacy_recovery`、legacy 取消の専用再確認） | 保留と、通常の適用済み実測の後の再試行へ置き換える。N/N 再基準化と `rebase:` の oracle を削除 |
| D9 の「保留 → 一部保存 → 中断 → 再開」（L3） | 共有 JAN 行の保留に限る。通常の L3 (c) は「取込み後の要再確認 → 再起動 → 数え直しで解消」 |
| State Lifecycle の「PC 時計 epoch」「時刻基準 / file 境界」の行 | 削除 |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 計数 context | なし | 開始・数量未保存 | 1 商品 TX で保存 | 商品切替・離脱・abandon・DB 交換・revision / 所有者の不一致。sleep と時刻変更では失効しない | 保存済みは DB が正 | 新しい begin | 未保存 token を失う | 書込み 0 | 新しい begin | M1 |
| 要再確認 flag（(商品, 資料)、理由 4 値） | なし | — | 取込みの業務 TX で保存 | 当該資料を開始前に受領した新しい実測の保存、当該 import の取消。確認待ちは R9 を満たす EJ の取込みでも再評価 | 準備照会・棚卸し一覧 | 準備表示に残る | DB に残る | 取込み TX 全体を戻す | 数え直し | M3 |
| 共有 JAN 行の保留 | 未取込み | preview で held | 全候補を数えて再 preview → commit | 保留集合は永続しない | 同じ file の再選択 | 再選択が要る | 再選択が要る | 業務 write なし | 再 preview | M3 |
| legacy 取消の保留 | 取消要求 | void 前に停止 | 新しい適用済み実測の後の再試行で取消 | — | 対象商品の回復先 | 同じ | 同じ | 業務 write なし | 計数と確定、または独立再実測 → 再試行 | M4 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 「時点証拠契約（proposed・未実装）」節 | `rg -l '時点証拠契約' docs --glob '!docs/archive/**'` の 32 file（main `3148347b`） | packet Scope S2〜S7 の 25 file | master-tables / transaction-tables / 31 / 36 / 51 / 60 / 65 は撤去対象の語を含まず、維持する契約だけを書いている（節を読んで確認） | packet AC1 / AC2 |
| 但し書きへのリンク `#適用範囲の但し書き` | `rg -o 'stocktake-time-evidence\.md#[^)]*'` の非 archive 23、archive 2 | source の 21 行を削除 | Plans / backlog / archive は編集対象外。見出しを残して着地させる | packet AC1 / AC7 |
| 回復の code・action・purpose の列挙 | 40 :9-11、42 :15、55 :24、73 :27、ADR D8 | 同じ語の全出現を同時に変える | — | packet AC2 |

## Negative Paths

- missing input: 精算の識別メタの欠落は従来どおり同日追加の拒否（維持の確認、M2）。
- invalid input: 旧 purpose（legacy 用）は enum から消える（proposed wire、packet Boundary / Wire Contract）。
- duplicate/ambiguous input: 共有 JAN 行は保留を維持（M3）。同番の別 hash は衝突（M2）。
- unknown reference: 参照できる明細のない共有 JAN 候補は解除できない既知の制限を維持。
- dependency missing: OS の通知機構への依存がなくなる（M1）。
- permission/write failure: flag の保存失敗は取込み TX 全体を戻す（M3）。
- dry-run side effect: preview は受領の記録だけを保存し、売上・在庫・flag を commit しない（維持）。

## Boundary Checks

- threshold: 解消条件 `source.id <= source_cursor`（開始前の受領）。
- null/default: flag の作成 import の参照は必須。
- empty/non-empty: 数量 0 の行は R9 の EJ の条件で分かれる（TD-024）。全行 0 の資料も EJ が無ければ数えた商品が確認待ちになる。
- min/max: 変更なし。
- status/policy enum: begin の purpose 2 値、stock_review.status の held は共有 JAN 行だけ、準備 issue の code の増減（時計を外し、商品単位の要再確認を加える）。
- wire type: proposed の DTO だけ。現行 bindings は不変。
- internal type: CountContext から OS 世代・epoch・monotonic 開始を外す。
- producer/consumer: flag の producer = BIZ-03 の commit、consumer = BIZ-06 の確定・保存、準備照会、UI-07 / UI-10。
- round-trip token: count_token は不変。
- precision/range: 精算時刻の精度の保存を外す。
- cross-language parse: 変更なし。

## Compatibility Checks

- old schema/input: 旧 DB の legacy 分類・上限・reconciliation_version は維持（M4）。
- new schema/input: 撤去した列・表を ㉘ の migration が作らない（M2 / M4）。
- output order: 準備 issue の順序規則（source ID 昇順）は維持。
- optional field behavior: `StocktakeRecovery.csv_import_id` は legacy 取消の保留で引き続き使う。

## Data Safety Checks

- source-derived data: なし。店の事実は台帳の番号と要旨だけを引く。
- generated outputs: なし。
- secrets: 触れない。
- local-only files: `.local/` の台帳・相談・レビュー記録を commit しない。
- synthetic sample boundaries: 合成モデルの値だけ。

## Main Wiring / Integration Checks

- helper connected to main path: flag の key の変更が tracking → 20 → 32 / 35 → 41 / 42 → 55 / 73 の全段で同じか（Contract Audit）。
- output reaches manifest/report: 取込み結果と準備照会の両方に商品単位の要再確認が出るか。
- effective config reaches runtime: 該当なし（設定 key の追加なし）。
- CLI arg reaches implementation: `python3 scripts/probes/stocktake_time_model.py` の `__main__` が新しい check を呼ぶか。

## Mutation-style Adequacy Questions

- 帰属できない行があっても区間を完全とみなすと、どの assert が落ちるか: `check_unknown_apply_recheck` の (d)。
- 判定不能の行へ通常適用しない（在庫を動かさない）と、どの assert が落ちるか: `check_unknown_apply_recheck` の実測後販売の場合（数え直し前の帳簿が 10 のまま）。
- flag を保存しないと、どの assert が落ちるか: 同 check の進行中の確定拒否。
- 取消で flag を消さないと、どの assert が落ちるか: 同 check の取消後の flag 不在。
- legacy の取消を保留しないと、どの assert が落ちるか: `check_legacy_recovery` の保留の assert。
- 一つの規則を外すと必ず落ちるとは限らない（複数の規則が同じ結果を支える場合がある）。Writer は実注入で red を確かめた mutation だけを報告する。

## Residual Test Gaps

- runtime の実装・Windows L3 は ㉘ で行う。本 lane の Contract Audit は文書の読取りによる確認。
- 「開始してから数える」の物理的な成立は agent では検証できない（owner の見立てでは成り立つ、TD-025）。
- R9 の EJ の外部前提（戻・訂正・取消の行の形、精算区間の対応、名称からの商品の特定、締めでの取得）は実機と承認済みサンプルで確かめる。EJ の日次取込みが ㉘ に入るまでは、数量 0 の行が全て確認待ちになる負担は未実測。
- 時刻区間の合成モデル（`check_bounds` 等）は残るが、現行の ADR の契約を検証するものではなくなる。次の design lane で扱いを決める。
