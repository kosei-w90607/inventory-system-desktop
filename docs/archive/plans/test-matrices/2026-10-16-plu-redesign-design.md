# Test Design Matrix: PLU の書出しの見直しの結果を設計正本へ置き換える

本 lane は docs だけで、自動 test を足さない。下の行は後続の runtime の lane（backlog「PLU の書出しの見直しの runtime」）が実装する test の設計で、設計正本の節と D-117 から導いた。本 lane が自分で回す検査は packet の AC10（docs の検査、traceability の検査、設計照合 test）だけ。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-PLS-D1: `plu_slots` の status 4 値、partial UNIQUE（`reserved` / `active` だけ）、migration（既存の `release_pending` → `external`、`released_at` を外す、`plu_register_snapshot_summary` の key を消す）
- SPEC-PLS-D2 / BIZ-04-D3: 照合の表（33 §16.3）、照合に使う Z004 の選び方（精算回数が最大）、gate（`register_snapshot_required`）、summary は `snapshot_at` だけ
- SPEC-PLS-D3 / BIZ-04-D4: prepare の sticky の再利用、external の採用、Full は対象の JAN だけ、clear 行なし
- SPEC-PLS-D4 / BIZ-04-D5・D6: confirm は product 行だけ、商品の状態の変化で枠を変えない、JAN の変更で `plu_dirty=1`
- SPEC-PLS-D5 / IO-04: clear 行を出力しない（IO-04-D3 の撤去）
- SPEC-PLS-D6・D7: 一括の対象化・移行状態の列と絞り込み・memory No. の表示の撤去
- BIZ-08 §37.9 手順 10 / CMD-12 §45.6a 手順 2a: SD の読取りから照合への配線、照合の失敗で scan を失敗にしない
- 33 §16.6: JAN を直した商品の前の JAN の枠で売れた分は、その JAN を持つ商品が無ければ `unmatched_product` の行エラーで知らせる（32 §15.3 手順 4 b は変えない。同じ商品へたどるのは TD-284 の lane）
- 33 §16.3 手順 2: key 以下の精算回数（小さい = 古い SD、等しい = 既に写した観測）を照合しない
- UI-08-D11・D5・D7: 最終照合日時の表示、未照合の導線、件数の要約と上限の警告の撤去、復帰状態の旧形

## Failure Modes

- FM1: 枠が解放されて別の JAN に使い回され、レジの前の登録と食い違う（clear の撤去の後に解放の経路が残る）
- FM2: 一度も照合していないのに prepare が空きを仮定して予約する
- FM3: 照合が古い・別の Z004 を選び（古い SD を後から読んだときを含む）、レジ側の登録の枠をアプリが予約して上書きする
- FM4: アプリの JAN を別の枠で観測したとき、UNIQUE 違反で照合の TX 全体が失敗する（`external` の重複を保存できない）
- FM5: 売るのをやめた商品・前の JAN の枠が Full に出て、レジの前の登録を書き直す
- FM6: JAN を変えた商品が未反映にならず、新しい JAN がレジに書かれない
- FM7: 照合の失敗や Z004 の読取りの失敗（`Io`）で SD の読取り（日報の候補）まで失敗し、締めの取込みが止まる
- FM11: JAN を直した商品の前の JAN の枠で売れた分が、黙って誤った商品へ付く（前の JAN を持つ商品が無いのに、どれかの商品へ付ける）
- FM12: 対象の商品を持たない JAN の active な枠にレジ側の別のコードを観測しても active を保ち、後でその JAN を再び持つ商品の書出しがレジ側の登録を上書きする
- FM13: 照合が何日も止まっているのに UI-08 で見えない
- FM8: migration が `release_pending` の行を落とし、再対象化で別の枠を予約する
- FM9: 撤去した DTO の field・command が UI に残り、型の不一致で画面が壊れる
- FM10: 予約中の枠に別のコードが入ったのに予約を保ち、次の書出しでレジ側の登録を上書きする

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPEC-PLS-D4 / §16.6 | FM1 | unit（BIZ-01 + BIZ-04、試験 DB） | `test_plu_target_off_keeps_slot_req907` | `plu_target` 1→0 の後に、その JAN の枠の status か `scanning_code` が変わる（解放・free 化）。期待: active / reserved のまま、Diff / Full に出ない |
| SPEC-PLS-D4 / §16.6 | FM1 | unit | `test_discontinue_keeps_slot_and_retarget_reuses_req907` | 廃番化 → 解除 → 再対象化で、前と違う memory No. を予約する。期待: 同じ memory No.、`plu_dirty=1` |
| SPEC-PLS-D4 / §16.6 | FM6 | unit | `test_jan_change_sets_dirty_and_keeps_old_slot_req907` | `plu_target=1` の商品の JAN の変更（CSV の上書き）で `plu_dirty` が 1 にならない、または前の JAN の枠が変わる。期待: 新しい JAN は次の prepare で別の枠、前の枠はそのまま |
| SPEC-PLS-D3 / §16.4 step 6 | FM5 | unit | `test_full_excludes_slots_without_target_product_req907` | 対象の商品を持たない JAN の active な枠が Full の行に入る。期待: 対象の JAN の枠だけ |
| SPEC-PLS-D5 / IO-04 | FM1 | golden（IO-04） | `test_generate_plu_tsv_has_no_clear_row` | 出力に 14 桁ゼロのコードの行が現れる。期待: product 行だけ（`row_kind` の入力が無い） |
| SPEC-PLS-D2 / §16.3 | FM2 | unit | `test_prepare_rejects_without_snapshot_req907` | `plu_register_snapshot_at` が無い DB で prepare が Ok を返すか予約する。期待: `register_snapshot_required`、slot は全部 free のまま |
| SPEC-PLS-D2 / §16.3 | FM3 | unit | `test_refresh_snapshot_picks_max_settlement_no_req907` | 精算回数の違う合成 Z004 を 3 本（file の順と精算回数の順を変えて）渡すと、最大でない 1 本で照合する。期待: 最大の 1 本の占有。精算回数の読めない bytes だけなら `Ok(None)` で何も変えない |
| SPEC-PLS-D2 / §16.3 手順 2 | FM3 | unit | `test_refresh_snapshot_rejects_older_settlement_after_newer_req907` | 精算回数 N の Z004 で照合した後に N − 1 だけの Z004 を渡すと照合する（往復の回帰）。期待: `Ok(None)`、`plu_slots` と 2 つの key が N の照合の後のまま。N を再び渡しても `Ok(None)`（等しい精算回数は照合しない。confirm したばかりの枠を `missing_on_register` に戻さない）。N + 1 なら照合する。key が整数として読めなければ照合しない |
| SPEC-PLS-D2 / §16.3 | FM12 | unit | `test_snapshot_orphan_active_other_code_becomes_external_req907` | 対象の商品を持たない JAN の active な枠に別のコードを観測しても active のまま。期待: external、観測コード、`slot_released_on_register` を log。対象の商品がある JAN の active は conflict のまま（非空の対照） |
| 33 §16.6 / 32 §15.3 手順 4 b | FM11 | unit（BIZ-03、既存） | `test_parse_and_validate_req401_unmatched_product` | JAN を持つ商品が無い行が `unmatched_product` にならない（既存の test。D-117 で変えない） |
| SPEC-PLS-D2 / §16.3 | FM3 | unit | `test_refresh_snapshot_skips_conflicting_same_settlement_req907` | 最大の精算回数の bytes が 2 本で違うのに照合する。期待: 照合しない（前回を保つ） |
| SPEC-PLS-D2 / §16.3 | FM4 | unit | `test_snapshot_duplicate_jan_on_register_is_external_req907` | アプリが active で持つ JAN を空きの枠で観測したとき、TX が UNIQUE 違反で失敗するか、アプリの枠の memory No. が変わる。期待: 観測した枠は external（コードを保持）、アプリの枠は不変、`duplicate_on_register` を log |
| SPEC-PLS-D2 / §16.3 | FM10 | unit | `test_snapshot_reserved_other_code_drops_reservation_req907` | 予約中の枠に別のコードを観測しても reserved を保つ。期待: external + `reservation_dropped`、次の prepare で別の最小の空き枠 |
| SPEC-PLS-D2・D3・D4 / §16.3・§16.4・§16.5 | FM10 | unit（BIZ-04、試験 DB） | `test_confirm_rejects_rows_of_dropped_reservation_req907` | 予約した枠が照合で `reservation_dropped` になった後、再 prepare が同じ JAN に外れた枠の memory No. を返す、前の `prepared_rows`（外れた枠の memory No.）での confirm が通る（一部でも）、または `plu_dirty` が 0 になる。期待: 再 prepare は別の枠を返し、前の `prepared_rows` での confirm は全体を拒み、`plu_dirty` は 1 のまま |
| SPEC-PLS-D2 / §16.3 | FM10 | unit | `test_snapshot_active_other_code_marks_dirty_req907` | 反映済みの枠に別のコード・空を観測しても商品が dirty にならない。期待: active を保ち、`plu_target=1` の商品だけ dirty |
| SPEC-PLS-D2 / §16.3 | — | unit | `test_snapshot_same_input_is_idempotent_req907` | 同じ Z004 を BIZ の `import_plu_register_snapshot` へ 2 回直接渡すと状態が変わる。期待: 2 回目の後の `plu_slots` が 1 回目の後と同じ（照合の本体の性質。`refresh_plu_register_snapshot_from_sd` は等しい精算回数を照合しないので、この経路では 2 回目は呼ばれない） |
| SPEC-PLS-D2 / §16.8 | FM3 | integration（MNT の restore + BIZ-04） | `test_restore_clears_plu_snapshot_keys_and_blocks_prepare_req907` | restore の後に `plu_register_snapshot_at`・`plu_register_snapshot_settlement_no` が残り、prepare が `register_snapshot_required` で止まらない（runtime の lane が 71 §71.7 `restore_backup` に足すまで red の期待）。期待: 2 つの key が無く、次の SD の読取りの照合で戻る |
| SPEC-PLS-D1 | FM4 | schema（migration） | `test_plu_slots_unique_only_reserved_active` | 同じコードの external を 2 行入れると拒否される、または reserved / active を同じコードで 2 行入れられる |
| SPEC-PLS-D1 | FM8 | migration | `test_migration_release_pending_becomes_external` | migration の後に `release_pending` の行が消える・`scanning_code` が変わる・status の CHECK が 5 値のまま。期待: external、`released_at` の列が無い、`plu_register_snapshot_summary` の key が無い |
| BIZ-08 §37.9 手順 10 / CMD-12 §45.6a | FM7 | integration（CMD-12 + 合成の SD の tree） | `test_scan_register_sd_refreshes_plu_snapshot` | SD の読取りの後に `plu_register_snapshot_at` が更新されない、または Z004 の形が外れているとき scan が Err になる。期待: 照合の失敗でも日報の候補が返り、前回の照合を保つ |
| BIZ-08 §37.9 手順 10 | FM7 | unit（BIZ-08 + 合成の SD の tree） | `test_scan_skips_unreadable_z004_and_continues` | Z004 の 1 本の読取りが `Io` で失敗すると scan 全体が Err になる。期待: その file を除いて続け、日報の候補と残りの Z004 を返す（Z001・Z002・Z005 の `Io` は今どおり scan を止める） |
| BIZ-08 §37.9 | — | unit | `test_scan_snapshot_does_not_write_db` | BIZ-08 の scan の中で DB に書く（照合は CMD-12 の後の BIZ-04 の TX だけ） |
| CMD-08-D5 | FM9 | unit（CMD） | `test_get_plu_slot_summary_returns_snapshot_at_only` | summary に件数の field が残る |
| SPEC-PLS-D6・D7 | FM9 | 削除の確かめ（frontend + backend） | 撤去の lane の検索式（packet の AC の形） | `bulk_set_plu_target`・`import_plu_register_snapshot`・`over_limit_warning`・`plu_memory_no`・`PluMigrationFilter` が bindings と src に残る |
| UI-08-D11 | FM2 | RTL（UI-08） | `PluExportPage.test.tsx` の「未照合の導線」 | `snapshot_at` が null のとき売上データ取込みへの導線と warning が出ない、または FilePicker の step が出る |
| UI-08-D7 | — | RTL | `PluExportPage.test.tsx` の「旧形の復帰状態」 | `overLimitWarning` を持つ旧形の復帰状態で画面が壊れる。期待: 消して通常の画面 |
| UI-08-D11 | FM13 | RTL | `PluExportPage.test.tsx` の「照合が古い」 | 今日と `snapshot_at` の暦日の差が 4 で警告の見た目と 1 文が出ない、差が 3 で出る、書出しが拒まれる |
| UI-08-D4・D10・§67.9 | FM3 | RTL | `PluExportPage.test.tsx` の「取込みに失敗したときの案内」 | 独立の warning Alert と restored pending の Alert のどちらかで、failure note が「差分または全件を書き出し直す」と「前に保存したファイルは取り込まない」を出さない、または保存した file の入れ直しを案内する |
| UI-08-D5 | — | RTL | `PluExportPage.test.tsx` の「SD 設定書込みの案内」 | 案内の Alert が Full だけに出て Diff に出ない |
| UI-08-D11 | — | RTL | `PluExportPage.test.tsx` の「Diff の件数」 | Diff の件数が `listPluDirty` の件数と違う（解除待ちを足す） |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 占有の照合（`plu_register_snapshot_at`・`plu_register_snapshot_settlement_no`） | 未照合（gate で書出しを拒む） | SD の読取りの後の BIZ-04 の TX | 日時を書き、UI-08 に出る | SD の読取りの成功で slot summary と未反映一覧を stale（D-052 の C17 の置換え） | UI-08 の再表示 | 画面を開き直しても最終照合日時 | 再起動の後も DB の値 | Z004 が読めない・形が外れた・精算回数が key より小さい → 前回を保ち scan は成功。3 日を超えると UI-08 で警告 | 次の締めの読取り（精算回数が戻ったときは開発者が key を消す） | `test_scan_register_sd_refreshes_plu_snapshot`、`test_refresh_snapshot_picks_max_settlement_no_req907` |
| 枠（`plu_slots` の 1 行） | free / external | reserved（prepare） | active（confirm か照合） | 照合でレジ側の変化 → external（予約中）／dirty（反映済み） | prepare の再実行 | 対象外化・廃番でも残る | — | prepare の TX の失敗 → 予約しない | 同じ mode の再 prepare で同じ番号 | 上の §16.3・§16.6 の行 |
| 書出しの 2 段（`plu_dirty`） | dirty（新商品・値段の変更・再対象化・JAN の変更） | 保存済みで未確認（復帰状態） | confirm で 0 | 照合の missing・conflict で 1 | `listPluDirty` | 復帰状態の Alert | 再起動の後も復帰状態 | 保存のキャンセル・失敗 → dirty のまま | 再保存・再書出し | 既存の UI-08 の test（変えない）と `test_jan_change_sets_dirty_and_keeps_old_slot_req907` |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 枠の解放（`release_pending`・clear 行・解放の trigger） | `rg -n 'release_pending|PLU_CLEAR_ROW_ENABLED|clear 行|release_plu_slot' docs --glob '!docs/archive/**'` の全 hit（33・plu-tables・25・30・20・67・41・biz / ui / io の task spec・DB_DESIGN・diagrams・ERD・ADR・32・tracking・decision-log・22） | 33・plu-tables・25・30・20・67・41・task spec・DB_DESIGN・22 | 時点証拠 ADR・32・tracking-system-tables（取込み側の clear 行の段。レジで手で消す経路で残る）、`docs/diagrams/current-system.md`・`docs/inventory_system_erd.html`（現行の実装の図。runtime の lane）、decision-log の D-072・D-103（履歴） | packet の AC1 |
| 占有の読込み（Z004 を選ぶ step） | `rg -n 'import_plu_register_snapshot|importPluRegisterSnapshot|Z004を選んで|レジ登録状況を読み込む' docs --glob '!docs/archive/**'` | 33・41・67・23・cmd / ui の task spec・D-052 の扱い（67 §67.10） | 74（操作ログの種類 `plu_register_snapshot_import` は照合の log として残る）、D-052 の Contract 行（runtime の lane） | packet の AC3 |
| 段階導入の道具 | `rg -n 'bulk_set_plu_target|PluMigrationFilter|段階移行|bulk onboarding|PLU 対象にする' docs --glob '!docs/archive/**'` | 30・40・20・50・requirements・coverage・project-memory・PLUV・cmd / ui の task spec・backlog | 74 の `product_bulk_plu_target`（既存の log の表示）、design-system の reference（owner の所感の原文と mockup） | packet の AC2 |
| 件数の要約・上限の警告・memory No. の表示 | `rg -n 'free_count|release_pending_count|over_limit_warning|overLimitWarning|plu_memory_no|レジメモリ' docs --glob '!docs/archive/**'` | 33・41・67・51・40・20・cmd / ui の task spec | research の drift 監査（履歴）、design-system の reference | packet の AC4 |

## Negative Paths

- missing input: 照合の記録が無い → prepare が `register_snapshot_required`。SD の窓に Z004 が無い → `Ok(None)` で何も変えない
- invalid input: 精算回数の読めない Z004 は使わない。Z004 の形が外れた（行数が 5,000 でない等）→ IO-02 の `ImportError`、前回を保つ
- duplicate/ambiguous input: 同じ精算回数で bytes の違う Z004 → 照合しない。同じ bytes が `XZ` と `XZ_BKUP` にある → 1 つにまとめる。アプリの JAN を別の枠で観測 → external
- unknown reference: 対象の商品を持たない JAN の枠 → 出力しない、状態を変えない
- dependency missing: SD が見つからない → 既存の scan のエラー（照合も行わない）
- permission/write failure: 照合の TX の失敗 → rollback、scan は成功で返す（`tracing::warn!`）
- dry-run side effect: BIZ-08 の scan は DB に書かない（照合は CMD-12 の後の BIZ-04）

## Boundary Checks

- threshold: memory No. 217〜5000（変えない）
- null/default: `snapshot_at` が null → 未照合の導線
- empty/non-empty: Diff の対象 0 → 「差分はありません」、Full は選べる
- min/max: 照合に使う Z004 は精算回数の最大
- status/policy enum: `PluSlotStatus` は 4 値
- wire type: 撤去した field・enum・command（packet の Boundary / Wire Contract）
- internal type: `plu_register_z004s: Vec<Vec<u8>>` は wire に出さない
- producer/consumer: CMD-12 が BIZ-04 を呼ぶ（BIZ-08 は bytes を返すだけ）
- round-trip token: confirm の `prepared_rows` は `memory_no` と `target_product_codes` だけ
- precision/range: 変えない
- cross-language parse: bindings の再生成で撤去した型が UI に残らない

## Compatibility Checks

- old schema/input: migration v5 の DB（`release_pending` の行あり）→ migration の後 `external`、`plu_register_snapshot_settlement_no` は無い（次の照合で書く）。旧形の復帰状態（`overLimitWarning`）→ 消して通常の画面
- new schema/input: status 4 値、partial UNIQUE は `reserved` / `active`
- output order: PLU の file の行の順は今のまま（memory No. の順を変えない）
- optional field behavior: 古い URL の `plu` の search param は絞り込みに使わない

## Data Safety Checks

- source-derived data: test は合成の Z004（5,000 行の合成）だけ。実 Z004 の bytes を fixture にしない
- generated outputs: bindings の再生成の差分だけ
- secrets: 無し
- local-only files: 持ち帰りデータは使わない
- synthetic sample boundaries: 合成の JAN は検査数字の正しい架空の値

## Main Wiring / Integration Checks

- helper connected to main path: SD の読取り（`scan_register_sd`）の後に `refresh_plu_register_snapshot_from_sd` が呼ばれる（integration）
- output reaches manifest/report: 照合の件数が operation_logs（`plu_register_snapshot_import`）に入る
- effective config reaches runtime: `PLU_CLEAR_ROW_ENABLED` が残らない
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → 合成 Z004 の精算回数を file の並びと逆にした `test_refresh_snapshot_picks_max_settlement_no_req907`
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → D-052 の oracle（SD の読取りの成功で slot summary を stale）。runtime の lane が独立 oracle を直す
- If a key branch is inverted, which test fails? → `test_snapshot_reserved_other_code_drops_reservation_req907`（reserved と active の枝の入替え）
- If a threshold comparison changes, which test fails? → 精算回数の最大を最小にすると `test_refresh_snapshot_picks_max_settlement_no_req907`
- If a guard is removed, which test fails? → gate を外すと `test_prepare_rejects_without_snapshot_req907`
- If an output field is omitted, which test fails? → Full の対象の JAN の枠の行を落とすと `test_full_excludes_slots_without_target_product_req907` の非空の期待
- If output order changes, which test fails? → IO-04 の golden
- If dry-run performs a side effect, which test fails? → `test_scan_snapshot_does_not_write_db`
- If a JSON number crosses JavaScript safe integer range, which test fails? → 該当なし（memory No. は 5000 まで）
- If a state token is round-tripped through browser/client code, which test fails? → 旧形の復帰状態の RTL

## Residual Test Gaps

- Diff の部分取込みでレジの他の枠が保たれること（P1、PLU-21）と、取込みの失敗からの回復（P2、PLU-25）は自動 test で確かめられない。runtime の lane の Windows native L3（CV17 / SR-S4000、D-073）で記録を取る。
- レジで手で登録した枠は次の締めの照合まで分からない（照合は精算の時点のレジを写す）。設計の限界（D-117 の Guarantee range）で、test にしない。
- 精算回数がレジの初期化で戻る列は資料に例が無い（D-117 の Revisit）。
