# Test Design Matrix: 棚卸しの P1（STK-1 / STK-2）を直す ㉘ ② 受領・判定・保存の基盤

packet: [2026-10-06-stocktake-p1](../2026-10-06-stocktake-p1.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-STK-TIME-D8 / D-109 (2)(4): 時点証拠 schema（列・表・CHECK・UNIQUE・FK、旧明細の分類、legacy 上限、失敗で全部戻す、`observation_kind` に恒久の DEFAULT なし、旧 import を backfill しない）を test の helper だけが当て、通常の `migrate()` の後に新しい表・列が無い。
- SPEC-STK-TIME-D1: 数量と `stock_revision` の不可分な checked 増分、数量を変えない版の増分。
- SPEC-STK-TIME-D2: 受領は hash で一意、最初の ID と時刻、業務 TX と独立。
- SPEC-STK-TIME-D3: 同一精算の別 hash と、同じ精算日の active import があるときの識別メタの欠けを、業務 write の前に拒否し、拒否の初回の証拠を独立 TX で残す。
- SPEC-STK-TIME-D4: 前後の分類（非連動・NeverObserved・LegacyObserved・Before・Unknown と理由）、共有 JAN の held、時刻を入力にしない。
- SPEC-STK-TIME-D4 / IO-02（23:9）: 0/0 行を在庫判定の行に残し、売上の行に入れない。
- IO-02（23:5）: Z004 の識別メタの抽出（文字列のまま）。
- D-109 (3): S1・S2・S4 の新しい関数・型・module は `#[cfg(test)]` の中にあり、production から呼ぶと compile error になる。

## Failure Modes

- FM1 通常の起動で新しい schema が当たる（中間版が生まれる）。
- FM2 `observation_kind` を省いた旧 writer の INSERT が通る（恒久の DEFAULT）。
- FM3 旧明細を現在の廃番 flag や時刻から推測して auto_filled / uncounted にする、矛盾形を安全な側へ落とす。
- FM4 migration の途中の失敗で一部の列・表・key が残る。
- FM5 版が同じ数量で進まない（ABA を見逃す）、上限で REAL に化ける、数量だけ書かれる。
- FM6 同じ hash の再受領で ID が変わる、業務 TX の rollback で受領が消える。
- FM7 同一精算の別 hash を、未取込み・取消済みの source が相手のときに見逃す。識別メタの欠けを候補 0 件として通す。拒否の証拠が業務 rollback で消える、2 回目で上書きされる。
- FM8 計数を始めた後に受領した資料を Before にする（`<` と `<=` の取り違え、保存時の cursor を使う）。LegacyObserved を NeverObserved に落とす。auto_filled が前の観測を隠す。時刻・精算日時で分類する。
- FM9 共有 JAN の行で一部の候補だけ Before のときに先頭商品へ適用する。
- FM10 0/0 行が在庫判定から落ちる、または売上の行に入る。
- FM11 識別メタの先頭の 0 が落ちる、従来 shape で偽のメタを作る。
- FM12 S1・S2・S4 の新しい関数・型を `#[cfg(test)]` の外に置き、production から呼べてしまう（根だけの expect では根の下の repo 関数の直接呼出しを検出できない）。cfg(test) の中の code が `test_support` を参照して ⑤ で compile できない。
- FM13 既存の診断・停止の test を変えて green にする。

## Test Matrix

引用した既存 test は起票時 `def86e19` で `rg` により実在を確認した: `diagnostic_cross_feature_req205_count_then_movement`（`src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs:582`）、`diagnostic_cross_feature_req205_req401_late_import`（同 `:609`）、F1（`src-tauri/src/biz/csv_import_service/tests/legacy_stop_tests.rs:188`）、F2（同 `:212`）、F3（同 `:303`）、`test_parse_and_validate_req401_empty_records_excluded`（`src-tauri/src/biz/csv_import_service/tests/parse_tests.rs:115`）。新規 test の名前は Writer が repo の命名（`test_<対象>_req205_*` / `test_<対象>_req401_*`）で決め、PR body に T 番号と対応させて列挙する。helper と mock: 本 lane の test は実 SQLite（`setup_test_db` の tempfile DB）を使い、mock は無い。 helper の注意: `test_support` の helper は時点証拠 schema を当てて `schema_versions` に `app_max_version()+1` を書くので、その DB を `init_database`（`src-tauri/src/db/mod.rs:175`）で開き直さない（MNT-03-D11 の `SchemaNewerThanApp` で拒否される）。T12・T14 の「別 TX」は同じ接続で TX を分けて書き、再接続で書かない。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D8 | FM2 | schema | T1: 当てた後の `sqlite_master` / `PRAGMA table_info` / `PRAGMA foreign_key_list` を tracking / pos / master / transaction の proposed 節の列・制約と照合（列名・型・NOT NULL・DEFAULT の有無・CHECK の値の集合） | 列や CHECK を落とす、`observation_kind` に DEFAULT を付ける |
| D8 / D1 | FM5 | schema | T2: `stock_revision` を i64 上限にして SQL で +1 → CHECK で失敗、値は上限のまま | CHECK を落とし REAL に化ける |
| D8 | FM2 | schema | T3: `observation_kind` を省いた `stocktake_items` の INSERT が失敗する（bundled SQLite で P2 を固定） | DEFAULT を付けて旧 writer を通す |
| D-109 (2) | FM1 | integration | T4: 通常の `migrate()` の後に、新しい表（`pos_import_sources`・`stocktake_recounts`・`stocktake_recount_flags`）が `sqlite_master` に無く、新しい列（`products.stock_revision`・`products.pos_sync_disabled_revision`・`stocktakes.reconciliation_version`・`stocktake_items.observation_kind`・`csv_imports.source_id`・`inventory_movements.stocktake_adjustment_kind`）が `PRAGMA table_info` に無く、`schema_versions` の最大 = `app_max_version()`（版の literal を持たない） | registry に登録する、`migrate()` から呼ぶ |
| D8 | FM3 | integration | T5: v7 の上で旧明細を作り当てる: 両 NULL → uncounted、actual 0・system 0・時刻 NULL → auto_filled、数量と時刻あり → legacy、矛盾形（数量 NULL・時刻あり）→ legacy、数量あり・時刻 NULL で 0・0 でない 3 形（actual 3・system 5、actual 0・system 5、actual 3・system 3）→ どれも legacy。廃番の商品の明細を含め、廃番 flag を変えても結果が同じ。旧明細の行がある表で当てるので、`observation_kind` を NOT NULL・DEFAULT 無しの ALTER で足す誤り（空の表なら通る、P2）と「table 再構築」の書き方をここで pin する（T6・T7 も行あり） | 廃番から逆算する、矛盾形を uncounted にする、「actual = system なら auto_filled」「時刻 NULL なら auto_filled」、空表でしか通らない ALTER |
| D8 | FM3 | integration | T6: 旧 header が `reconciliation_version=0`、`stocktake_legacy_movement_ceiling` が当てる前の movement 最大 ID（movement 0 件の DB では 0）。products の数量・movement・sale_records・csv_imports・stocktakes の行が当てる前後で一致 | 上限を現在値で取り直す、既存の行を書き換える |
| D8 / D-109 (4) | FM4 | integration | T7: 当てる途中で失敗を注入（例: 既存の `pos_import_sources` 同名の表を先に作る）→ 新しい列・表・key・`schema_versions` の行が残らない。成功時、旧 `csv_imports` の `source_id` は NULL で `pos_import_sources` は 0 行 | 部分 commit、旧 import から source を作る |
| D1 | FM5 | unit（repo） | T8: `update_stock_quantity_with_revision` で同じ数量を指定 → true、版 +1 | 同量で版を進めない |
| D1 | FM5 | unit（repo） | T9: 版が上限 → error、数量も版も不変。対象なし → false で何も変えない | 数量だけ書く、上限を検査しない |
| D1 | FM5 | integration | T10: 呼出し側 TX で数量更新 + `bump_stock_revision` の後に rollback → 両方戻る。`bump_stock_revision` は増分後の値を返す（連続 2 回で +1 ずつ） | 自分で commit する、返す値が増分前 |
| D2 | FM6 | integration | T11: 同じ hash を 2 回受領 → 同じ ID と最初の受領時刻。別 hash → 新しい大きい ID。空の DB の最大 ID = 0 | REPLACE で再採番、0 以外を空に返す |
| D2 | FM6 | integration | T12: 受領の後に別 TX の業務 write を rollback → 受領は残る | 受領を業務 TX に入れる |
| D3 | FM7 | integration | T13: 同じ帳票種別・machine_no・settlement_no で別 hash（相手が未取込み / 取消済み import の source の 2 通り）→ `IdentityGuardError::Rejected(IdentityConflict)`、業務 write 0（products / sale_records / movements / csv_imports の件数不変）。対照: machine_no・settlement_no が両方 NULL の source どうしは衝突にしない、同じ machine_no・settlement_no でも report_kind が違えば衝突にしない | active import だけと照合する、NULL = NULL を一致にする、report_kind を見ない |
| D3 | FM7 | integration | T14: `check_settlement_identity(&mut conn, …)` が拒否の Err を返した後に、対象 source に初回の code と時刻があり、業務表（products / sale_records / movements / csv_imports）の件数が呼ぶ前と同じ。同じ source で 2 回目の拒否 → 時刻は 1 回目のまま（`record_identity_rejection` は false） | 証拠を業務 TX に入れて一緒に戻す、上書き |
| D3 | FM7 | integration | T15: 同じ精算日の active import がある状態で、(a) 取込み対象のメタ両方欠け、(b) machine_no だけ欠け、(c) settlement_no だけ欠け、(d) 比較先の import に source が無い、(e) 比較先の source の machine_no だけ NULL / settlement_no だけ NULL、(f) 同日の active が 2 件で 2 件目だけメタが欠ける → いずれも拒否（`MissingIdentity`） | 欠けを候補 0 件として通す、INNER JOIN で落とす、比較先のメタを見ない、先頭の 1 件だけを見る |
| D3 | FM7 | integration | T16: 同じ精算日の active が無い（初回 / 他日だけ / 同日は取消済みだけ）→ メタが欠けてもこの追加の拒否はしない。ただし T13 の別 hash の衝突は検査する。(d) 取込み対象・比較先ともメタが揃い settlement_no が違う → 拒否しない（ADR D3 の別精算の追加） | 同日 active の無い場合も拒否する、衝突の検査まで省く、メタが揃った同日の別精算を拒否する |
| D4 | FM8 | unit（BIZ） | T17: `pos_stock_sync=false` → 売上のみ（在庫の分類なし） | 非連動を在庫連動へ昇格 |
| D4 | FM8 | integration | T18: 実測の履歴なし → After | 未実測を Unknown にする |
| D4 | FM8 | integration | T19: legacy の明細だけ → Unknown（理由 `legacy_basis`、数量 0 の行でも）。legacy の後に auto_filled → なお Unknown（auto_filled が隠さない）。(c) legacy の明細の後に新方式の measured（`source_cursor = k`）→ source k は Before（版を持つ観測が legacy より優先） | legacy を未実測へ、auto_filled を基準に、legacy があれば常に LegacyObserved |
| D4 | FM8 | integration | T20: measured の `source_cursor = k` で source ID `k` → Before、`k+1` → Unknown（境界の対）。同じ入力で、明細の `count_started_at` / `counted_at` と source の `settled_at` を前後に入れ替えても結果が同じ。最新の有効な観測は明細 ∪ recount の `max(observation_revision)`（recount 行と版は test の SQL で入れる）: (a) 完了済みの明細 版 2・cursor k → 後の recount 版 3・cursor k+1 → source k+1 は Before。(b) (a) の時刻の順と版の順を逆にした形（recount の時刻が明細より前、版は recount が大きい）→ 同じく Before。(d) measured の明細 cursor 3 → recount cursor 10（版が大きい）→ source 7 は Before。(e) recount 版 3・cursor k → 後の新しい棚卸しの measured 明細 版 5・cursor k+1 → source k+1 は Before。(f) measured（cursor k）→ 後の棚卸しの auto_filled → source k は Before | `<` と `<=` の取り違え、時刻で分類、recount を読まない、時刻順で選ぶ、recount があれば常に recount、auto_filled を最新にする |
| D4 | FM8 | unit（BIZ） | T21: Unknown の理由: 数量 2・金額 200 → `sale_order_unknown`、数量 0・金額 100 → `offset_lines_present`、0/0 → 相殺の判定が要る印（flag の理由を決めない） | 0/0 を flag なしにする、理由の取り違え |
| D4 | FM9 | integration | T22: 共有 JAN（在庫連動 2 候補）で両方 Before → commit 可・在庫は全スキップ。片方だけ Before → file 全体 held。Before + NeverObserved（After）→ held。在庫連動 1 + 非連動 1 で連動側が Unknown → held。全候補が非連動 → 在庫の分類なし | 先頭商品へ適用、非連動との共有を除外、After を Before と同じに扱う |
| D4 / IO-02 | FM10 | integration | T23: 正常 JAN の 0/0 行と数量のある行を含む合成 Z004 → 在庫判定の行に 0/0 行が全候補と `pos_stock_sync` 付きで入る。同じ file の `parse_and_validate` の `matched_rows` には 0/0 行が無い | 0/0 を捨てる、売上の行に入れる |
| IO-02 | FM11 | unit（IO） | T24: 合成 layout A のメタ行（マシンNo. `0001` 形・ファイル・モード・精算回数 `0123` 形・日付・時刻 `HH:MM`）→ machine_no・settlement_no を文字列のまま（先頭の 0 を保つ）、report_kind = 「ファイル」行の値、settled_at = `YYYY-MM-DDTHH:MM`。時刻行の値を壊した形 → settled_at だけ `None` で日付は返る | 数値に変換して 0 を落とす、report_kind を「モード」から作る、秒や 0 時を補う |
| IO-02 | FM11 | unit（IO） | T25: 従来 shape → `settlement_metadata` の各項目が `None`（日付は従来どおり） | 偽のメタを作る |
| D-109 (3) | FM12 | CLI | T26: `cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings` が exit 0。Writer が一時の変更で production の関数から S2 の新関数 1 つを呼ぶと `cargo build` が `E0425` / `E0433` で失敗することを 1 回確かめ、戻して `git diff --exit-code` が exit 0（PR body に command と結果を書く。commit しない） | 新しい関数・型を `#[cfg(test)]` の外に置く |
| 停止 ADR D3 / D5 | FM13 | regression | AC11: 診断 2 本は今と同じく FAIL、`#[ignore` 2 行、`legacy_stop_tests.rs` と ignored を含めない `cargo test` は PASS | 診断を変えて green にする |

## STK-1 / STK-2 の green の条件

既存の診断 2 本（`#[ignore]`、旧本体を呼ぶ）を、どの lane のどの条件で正規の回帰にするか。② では変えない（AC11）。⑤ で新しい入口を呼ぶ形へ移し、`#[ignore]` を外す（ADR の改訂 Matrix の申し送り `docs/archive/plans/test-matrices/2026-09-18-stocktake-time-evidence.md` の「既存テストの移行先」の最後の項目: ignore を外すだけで時刻証拠を捏造しない）。baseline は起票時 `def86e19` で `cd src-tauri && cargo test --offline --lib cross_feature_tests -- --ignored --nocapture`（exit 101、2 failed）の出力。

| 行 | 再現（既存） | baseline | green の条件（新しい入口の操作列と期待） | 作る lane | ② の寄与 | owner 判断 |
|---|---|---|---|---|---|---|
| G1 STK-1 | `diagnostic_cross_feature_req205_count_then_movement` の `[Start, Count, Move(op), Complete]` 4 本（F1 と同形） | 期待 13 / 8 / 9 / 11 に対し 4 本とも在庫 10 | 計数の保存で L = 保存時の帳簿、確定で現在庫へ N − L を加える（ADR :56、35 proposed :34）。入庫 3 → 13、手動販売 2 → 8、廃棄 1 → 9、返品 1 → 11。保存後の移動は保存済みの実測を失効させない（失効は未保存の context だけ、ADR :49） | ③（計数・確定）、⑤（診断の移行） | 版の関数（T8〜T10）、schema の証拠の列（T1） | なし |
| G1b STK-1 の後着 | 同 test の `[Start, Count, PosSale, ImportPending, Complete]` | 期待 8 に対し 10 | 資料は計数を始めた後に受領 → Unknown → 通常適用で 8 + `sale_order_unknown` の flag（ADR :110・:112）→ この flag がある間は確定を force_fill でも拒否（ADR :117）→ 数え直し（begin の cursor が資料の受領 ID 以上、N = 8、L = 8）で flag 解消 → 確定で 8。操作列は Recount を挟んだ形に書き換え、「数え直しなしの Complete は拒否」を別の assert にする | ③ + ④、⑤ | 受領の ID と cursor（T11）、Unknown と理由（T20・T21） | なし |
| G2a STK-2（受領が計数より前） | `diagnostic_cross_feature_req205_req401_late_import` の操作列で、販売 2 の Z004 を計数の開始より前に受領（preview）だけしておく形（新規の操作列） | 旧本体では受領の概念が無く再現できない | 計数の保存（N = 8、L = 10）→ 確定で 8 → 同じ file の commit は Before で在庫を動かさず、売上 2 を一度だけ記録 → 8（ADR :101、:120 は数え直しの例） | ④、⑤ | Before の境界（T20） | なし |
| G2b STK-2（受領が計数より後、診断の操作列のまま） | 同 test の `[Start, PosSale, Count, Complete, ImportPending]`（F2 と同形） | 期待 8 に対し 6 | 受領が計数の開始より後 → Unknown → 通常適用で 6 + flag（確定済みの明細なので `recount_after_import` の準備 issue）→ 独立再実測（N = 8、L = 6、補正 +2）→ 8（ADR :120 の数値例「実測前に2個販売」）。green = 「数え直しの後に 8」と「数え直すまでは 6 で flag が残る」の 2 つの assert（owner 決定 Q3 = (i)、2026-10-06）。数え直しなしでの 8 は求めない（取引単位の前後判定〈design lane〉が入った後に、その lane が数え直しを減らす追加の条件として扱う） | ④ + ③、⑤ | Unknown（T20） | 決定済み（Q3 = (i)、owner 2026-10-06） |

G 行の期待は ADR の判定表と数値例から転記し、診断の oracle（`temporal_trace` の `physical`）とは独立に決めた。⑤ で移すときは、`stock = 有効 movement の合計` だけでなく操作列から決めた現物の数も assert する（今の `temporal_trace` の比較を保つ）。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 時点証拠 schema（試験 DB） | v7 | 当てる TX の中 | 列・表・key・分類・`schema_versions` が一度に入る | 該当なし | 該当なし | 該当なし | 通常起動は新しい表・列なし（T4） | 全部戻る（T7） | 同じ helper で当て直す | T1〜T7 |
| 資料の受領 | 未受領 | 構文と種別の検証 | hash で一意の行、最初の ID | 消えない（業務 rollback でも、T12） | 同じ hash は同じ ID（T11） | 同上 | DB に残る | 検証に通らない資料は受領しない | 同じ hash の再選択 | T11・T12 |
| 同一性の拒否の証拠 | なし | 照合 | 該当なし | 消えない | 該当なし | 2 回目は上書きしない（T14） | 残る | 業務 write 0（T13） | 拒否が続く | T13〜T16 |
| 商品の版 | 0 | 呼出し側 TX | +1（同量でも） | 該当なし | 該当なし | 該当なし | DB に残る | rollback で戻る、上限で書かない | 該当なし | T8〜T10 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 数量の更新 `update_stock_quantity` | `rg -n 'update_stock_quantity\(' src-tauri/src`: `inventory_service/common.rs:64`、`csv_import_service/commit.rs:274`、`stocktake_service.rs:571`、`integrity_service.rs:173`、`inventory_repo.rs:151`（定義）と同 file の test | 新関数 `update_stock_quantity_with_revision`（並べて置く） | 既存 4 caller は ⑤ で切り替える（通常起動の DB に `stock_revision` が無いため、② では呼べない） | T8〜T10 |
| 汎用の数量 UPDATE `ProductUpdates.stock_quantity` | `product_repo.rs:166`・`:1040` | なし | ⑤ で撤去（20 proposed） | なし |
| test だけが呼ぶ仕組み（旧本体の `#[cfg_attr(not(test), expect(dead_code))]` と `#[cfg(test)]` の module） | `rg -n 'expect\(dead_code\)' src-tauri/src`: `commit.rs:39`、`rollback.rs:25`、`stocktake_service.rs:295`・`:348`・`:493`。`#[cfg(test)] pub(crate) mod test_support`（`db/mod.rs:30-31`）。module 単位の `#[allow(dead_code)]`（`lib.rs:2-14`） | S1・S2・S4 は `#[cfg(test)]` の module（expect の形は採らない） | 根だけの expect は根の下の関数の直接呼出しを検出しない（packet の P1 の A1） | T26 |
| Custom 種別の migration（TX を関数が持つ） | `migration.rs:27`・`:66-74`、`schema_v2`〜`schema_v7` | `schema_time_evidence.rs` | registry へ登録しない | T4・T7 |
| 0/0 行の除外 | `csv_import_service/parse.rs:94` | 在庫判定の行の集合は別の関数で 0/0 を残す | 売上の行の除外（`parse.rs:94`）は維持（23:9） | T23 |

## Negative Paths

- missing input: 識別メタの欠け（T15 の (a)〜(f)）、`observation_kind` の省略（T3）。
- invalid input: 旧明細の矛盾形（T5）、版の上限（T2・T9）。
- duplicate/ambiguous input: 同じ hash（T11）、同一精算の別 hash（T13）、共有 JAN（T22）。
- unknown reference: 対象商品なし（T9）、比較先 import に source なし（T15 (d)）。
- dependency missing: 該当なし（EJ の証拠は ④）。
- permission/write failure: schema の途中の失敗（T7）、呼出し側 TX の rollback（T10・T12・T14）。
- dry-run side effect: 同一性の拒否で業務 write 0（T13）。

## Boundary Checks

- threshold: `source.id` と `source_cursor` の `<=`（T20 の k と k+1）。
- null/default: 識別メタの NULL（T15）、cursor 0 = 空集合（T11 の空の DB）、旧 import の `source_id` NULL（T7）。
- empty/non-empty: movement 0 件の DB の legacy 上限 0（T6）。
- min/max: 版の i64 上限（T2・T9）。
- status/policy enum: `observation_kind` の 4 値、flag の理由の 5 値の CHECK（T1）。
- wire type: 該当なし。
- internal type: 番号は文字列（T24）。
- producer/consumer: IO の `settlement_metadata` → BIZ の受領（T24 と T11 を同じ合成 file で）。
- round-trip token: 該当なし。
- precision/range: 版・cursor の非負 INTEGER の CHECK（T1・T2）。
- cross-language parse: 該当なし。

## Compatibility Checks

- old schema/input: v7 の DB と旧明細の各形・旧 import（T5〜T7）。通常の `migrate()` の後に新しい表・列が無い（T4）。
- new schema/input: 時点証拠 schema（T1）。
- output order: 該当なし。
- optional field behavior: 従来 shape の `settlement_metadata` は各 `None`（T25）。既存の z004 parser の test は変えずに PASS（AC9）。

## Data Safety Checks

- source-derived data: なし（合成のみ）。
- generated outputs: `docs/function-design/90-traceability.md` の再生成だけ。
- secrets: なし。
- local-only files: `.local/` の集計を写さない。
- synthetic sample boundaries: JAN は `29000000…` の店内コード形、名称・金額は合成。

## Main Wiring / Integration Checks

- helper connected to main path: 接続しないことが契約（T4・T26）。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- `source.id <= source_cursor` を `<` にすると T20 の k が Unknown になり落ちる。`source_cursor` を保存時の最大 ID に差し替える mutant は ② に保存の経路が無いので検出しない（③ の計数の保存の test へ申し送る: begin の後に受領した資料が、保存の後も Unknown のまま）。
- 版の増分を「数量が変わったときだけ」にすると T8 が落ちる。Rust の checked を外しても、S1 の CHECK（`typeof='integer' AND >=0`）が上限の加算を先に止めるので T9 は落ちない。T9 は error の種別（Rust 側の上限の error か、SQLite の CHECK の error か）を assert して区別する。
- 同一性の照合を active import だけにすると T13 の取消済みの相手が落ちる。候補の取得を INNER JOIN にすると T15 (d) が落ちる。
- 拒否の証拠を業務 TX に入れると T14 が落ちる。
- 共有 JAN で先頭の候補だけを見ると T22 の「片方だけ Before」が落ちる。
- 0/0 の除外を在庫判定の関数にも入れると T23 が落ちる。
- 旧明細の分類で廃番 flag を見ると T5 の「廃番 flag を変えても同じ」が落ちる。
- registry に登録すると T4 が落ちる。新しい関数を `#[cfg(test)]` の外に出すと T26 の一時の確認（compile error が出ない）で検出する。recount を読まない・時刻順で選ぶ・recount を常に優先する読取りは T20 (a)(b)(e) が落とす。
- 各組合せに非空の期待を置く: T11（ID が返る）、T13（拒否が返る）、T22（commit 可 / held の両方）、T23（0/0 行が 1 件入る）。

## Residual Test Gaps

- ③〜⑤ の契約（計数 context、確定補正、flag の作成と解消、相殺の判定、取消補償、準備照会、在庫連動の有効化の拒否、切替後の通し筋書き）は本 lane で test しない。G 行が申し送る。
- bundled SQLite と Python の SQLite の版の差は T2・T3 が bundled で固定する。
- 実ファイルの Z004 のメタ行は合成で代用する（観測は 23:130）。
