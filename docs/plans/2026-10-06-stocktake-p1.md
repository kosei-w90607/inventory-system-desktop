# Plan Packet: 棚卸しの P1（STK-1 / STK-2）を直す ㉘ ② 受領・判定・保存の基盤

wave に属さない単独の lane。owner の lane 選択（2026-10-06）で起票した。並走は `agent/z001-display`（PR #145、Final Review 中）、本日起票の `agent/sd-direct-read`・`agent/stocktake-p1`（本 lane）・`agent/plu-clear`、`agent/npm-audit-1006`（npm の開発用依存）。

本 lane は [停止 ADR](../adr/2026-09-23-legacy-stocktake-z004-write-stop.md) が定める ㉘ の runtime の列（① 停止と再現 fixture〈PR #95 で完了〉→ ② 受領・判定・保存の基盤 → ③ 計数と補正 → ④ 取込み・取消・回復 → ⑤ 一括切替、出典は `docs/archive/plans/2026-09-23-legacy-stocktake-z004-write-stop.md:3`）の ② だけを扱う（Wave Operation の 1 是正単位 = 1 packet）。③〜⑤ と、ADR が名指しする design lane「実測と POS 系列の対応を取得・保存する」は `docs/backlog.md` の entry が持つ。lane の選び方は [decision-log](../decision-log.md) の D-109。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（subagent_type: writer）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/stocktake-p1

遷移の記録（append-only）:

1. kickoff → spec-check（2026-10-06、起草役）: 依頼を ㉘ ② に絞り、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-06、起草役）: 設計正本（ADR D1〜D4 / D8、35 / 32 / 20 / 21 / 23 / 24 の proposed 節、db-design の tracking / pos / master の proposed 節）は ② の中身を定めているが、② の未配線の入れ方（registry に登録しない schema 関数、test だけが呼ぶことの機械検査、旧 writer と並ぶ新関数）と、旧 import から受領記録を backfill するかが正本に無い。
3. design → plan-draft（2026-10-06、起草役、本 commit）: 同じ plan-first の commit で D-109 を足し、`docs/db-design/pos-tables.md` の proposed 節に backfill しないことを 1 文足した。② の実装に残る設計の問いは無い。owner の判断事項（下の「owner の判断事項」Q1〜Q3）は ② の Scope を変えないが、Q2 は ADR の Status の扱い、Q3 は Matrix の ⑤ の行の期待を決めるので、Plan Gate の前に owner へ諮る。Phase は plan-draft で止める。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0 | 4（Q2 ADR の Status、Q3 STK-2 の green の定義、Ready、merge） | 2 | 6 = 0 + 4 + 2 |

Q1（design lane の着手条件 (4)）は design lane の判断で、本 change の介入に数えない（同じ問い合わせで得る場合も本 lane には計上しない）。manual（L3）は無い。

## Risk

Risk: R3

Reason:
DB の schema（新しい列・表・CHECK・旧明細の分類）、POS CSV（Z004 の parser の出力型に精算の識別メタを足す）、在庫の数量と版の不可分更新、取込みの前後の判定を作る（`docs/DEV_WORKFLOW.md` Risk Tiers の R3 の行）。R4 に当たらない: 新しい schema 関数は migration の registry に登録せず、通常起動の DB を変えない（D-109 (2)）。既存の行・売上・在庫を削除・書換えする処理は無く、test の DB だけに適用する。この変更で required gate の green / red は変わらない（診断 2 本は `#[ignore]` のまま、新しい test は通常の `cargo test` に加わる）。Scope の path は `scripts/ci/classify-changes.sh:55-65` の workflow の一覧に当たらない（`src-tauri/**` と `docs/**` の製品の文書だけ）ので Final Review Minimum は 1。

## Goal

Goal Invariant:

### 最小完了条件

- 時点証拠の新しい schema・受領・精算の同一性の検査・前後の分類が、試験 DB の上で ADR どおりに動くことを自動 test が示し、③（計数と補正）と ④（取込み・取消・回復）がこの基盤の上に作れる状態で main に入る。
- 通常の起動・画面・command の振舞いは ① の停止のまま変わらない（通常の起動で DB の schema が変わらず、旧本体と停止の入口はそのまま）。

### 失敗定義

- 通常の起動の DB に新しい列・表が入る、または旧 writer が新しい schema の上で動く中間版が生まれる（D-109 (2)、`docs/db-design/tracking-system-tables.md` の「移行と保存TX」の 1 項目め）。
- 受領済みでない資料・計数を始めた後に受領した資料を「実測前」と分類する、legacy の実測を未実測へ読み替える、識別メタの欠けた同日の追加を通す（ADR D2〜D4）。
- 新しい関数が production から呼ばれても検査で止まらない（D-109 (3) の機械検査が効かない）。
- 既存 test を削除・skip・弱体化する。診断 2 本を ignore を外すだけで green にする。

### 非目的

- STK-1 / STK-2 を ② で解消すること（解消は ③〜⑤。Matrix の「STK-1 / STK-2 の green の条件」の行）。
- 停止の解除・migration の registry 登録・旧 writer の切替・command / bindings / 画面（⑤）。
- 計数 context・確定補正・独立再実測（③）、取込みへの判定の配線・要再確認 flag の作成と解消・取消補償・準備照会・在庫連動の有効化の拒否（④）。
- 時刻・番号印字・EJ による前後判定、精算系列の比較方法（design lane「実測と POS 系列の対応を取得・保存する」）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

本 lane は data の契約（schema・受領・分類）を作るが、通常の起動へ配線しない。operator の操作は ① の停止のまま変わらない。通常運用の列は「店が営業し、締めで Z004 を取り込み、棚卸しで数える」で、その達成は ⑤ と design lane の後。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 店: アプリ未導入（本番 DB なし、`docs/project-memory.md` の初導入の行） | いつもどおり営業・精算・Excel | 本 lane の影響なし | ⑤ と design lane の後に導入 | なし |
| 開発・demo DB（schema v7） | アプリを起動する | 起動時の migration は v7 まで。新しい列・表は入らない（D-109 (2)） | ⑤ で registry に登録 | なし（AC2 の test で固定） |
| 同 DB | 棚卸し画面・Z004 タブを開く | ① の停止の案内のまま（`docs/adr/2026-09-23-legacy-stocktake-z004-write-stop.md` SPEC-STOP-D4） | ⑤ で解除 | なし |
| 同 DB | Z004 を選んでプレビューする | 今と同じプレビュー。精算の識別メタは parser が抽出するが、画面には出さない | ④ で受領と分類へ配線 | P4（layout A のメタ行） |
| 開発者・reviewer の試験 DB | test の helper で v7 の上に時点証拠 schema を当てる | 旧明細が uncounted / auto_filled / legacy に分かれ、受領・同一性の拒否・前後の分類を test から呼べる | ③ / ④ がこの helper の上に作る | P2・P3 |
| アプリ再起動・翌日 | 同じ操作 | 状態を持たないので同じ結果 | ⑤ | なし |

この packet を完了できること（③ / ④ の基盤が test で確かめられた形で main にある）と、通常運用を達成できること（棚卸しと Z004 の取込みを再開し、日次で在庫を自動で合わせる）は別である。前者だけが本 lane の完了条件。

## Scope

予定 file（本 lane が書く全件。生成物を含む）:

- S1（新規）`src-tauri/src/db/schema_time_evidence.rs`: 時点証拠 schema を当てる関数 `apply_time_evidence_schema(conn: &Connection, version: i64) -> Result<(), DbError>`（`MigrationKind::Custom` と同じ signature、`src-tauri/src/db/migration.rs:27`）。中身は `docs/db-design/master-tables.md`・`tracking-system-tables.md`・`pos-tables.md`・`transaction-tables.md` の proposed 節: `products.stock_revision`（NOT NULL DEFAULT 0、非負 INTEGER の CHECK）と `pos_sync_disabled_revision`、`stocktakes.reconciliation_version`（旧 header 0）、`stocktake_items` の `observation_kind`（DEFAULT なし、table 再構築で既存行を分類して埋める）と証拠の列、新表 `stocktake_recounts`・`stocktake_recount_flags`・`pos_import_sources`、`csv_imports.source_id`（旧 import は NULL のまま。backfill しない、D-109 (4)）、`inventory_movements.stocktake_adjustment_kind` / `stocktake_recount_id`、`app_settings` の `stocktake_legacy_movement_ceiling`。1 つの TX で当て、失敗は全部戻す。`schema_versions` には呼出し側が渡す `version` を記録する。`migrations()` には登録しない（⑤）。
- S1（変更）`src-tauri/src/db/mod.rs`: `mod schema_time_evidence;` を足す（`schema_v1`〜`v7` と同じ private mod、`src-tauri/src/db/mod.rs:22-28`）。
- S1（変更）`src-tauri/src/db/test_support.rs`: 時点証拠 schema を当てた試験 DB を作る helper（`setup_test_db` の後に `apply_time_evidence_schema(conn, migration::app_max_version() + 1)` を呼ぶ）。旧明細の 4 形と旧 import を v7 の上で作ってから当てる fixture の helper もここに置く（形は `src-tauri/src/biz/csv_import_service/tests/legacy_stop_tests.rs:303` の F3 と同じ）。
- S2（変更）`src-tauri/src/db/inventory_repo.rs`: 新関数 `update_stock_quantity_with_revision(conn, product_code, new_quantity) -> Result<bool, DbError>`（数量と `stock_revision` の checked 増分を 1 つの UPDATE で。`docs/function-design/21-io-inventory-repo.md` の proposed 節）と `bump_stock_revision(conn, product_code) -> Result<i64, DbError>`。既存の `update_stock_quantity`（`inventory_repo.rs:151`）とその caller 4 か所（`inventory_service/common.rs:64`、`csv_import_service/commit.rs:274`、`stocktake_service.rs:571`、`integrity_service.rs:173`）は変えない（⑤ で置き換える）。
- S2（変更）`src-tauri/src/db/sales_repo.rs`: `pos_import_sources` の受領の upsert（hash が既にあれば最初の ID と時刻を返す）、最大 source ID（空なら 0）、精算の同一性の照合候補（同じ帳票種別で machine_no / settlement_no が一致する全受領 source、未取込み・取消済みを含む）、active import の識別メタの取得（`csv_imports` を起点に source なし・メタ欠けの行も残す）、同一性の拒否の初回記録と照会（`docs/function-design/24-io-csv-import-repo.md` の proposed 節の表の 1〜5 行）。
- S2（変更）`src-tauri/src/db/stocktake_repo.rs`: 商品の最新の有効な観測の読取り（kind・所属・`source_cursor`・`observation_revision`。superseded な旧 pending を除き、legacy を未実測へ落とさない。`docs/function-design/20-io-product-repo.md` の proposed 節「有効観測の列挙」）。
- S3（変更）`src-tauri/src/io/z004_parser.rs`: `ParseResult` に `settlement_metadata: Option<SettlementMetadata>`（machine_no / report_kind / settlement_no / settled_at の各 `Option<String>`、番号は文字列のまま）を足し、layout A のメタ行から抽出する（`docs/function-design/23-io-z004-parser.md:5`、メタ行の並びは同 `:130`）。従来 shape は `None` の項目を持つ。`ParseResult` を作る所は `z004_parser.rs:210` だけ、読む所は `src-tauri/src/biz/csv_import_service/parse.rs:34` だけ（`rg -n 'ParseResult \{' src-tauri/src` と `rg -l 'parse_z004\(' src-tauri` で確認）。struct literal で `ParseResult` を作る test は無いので、既存の test の呼び方は変わらない。
- S4（新規）`src-tauri/src/biz/csv_import_service/time_evidence.rs`: (a) 資料の受領（構文と種別を検証した後の短い独立 TX、ADR D2）、(b) 精算の同一性の検査と拒否の記録（同一精算の別 hash と、同じ精算日の active import があるときの識別メタの欠け。拒否は業務 write の前、拒否の証拠は独立 TX、ADR D3、`docs/function-design/32-biz-csv-import-service.md` の proposed 節「一つの分類関数とcommit」の後半 3 段落）、(c) 前後の分類（同節の 1〜5。`pos_stock_sync=false` は売上のみ、NeverObserved は After、LegacyObserved は Unknown、`source.id <= source_cursor` は Before、それ以外は Unknown。Unknown の flag の理由は数量が 0 でない行 = `sale_order_unknown`、数量 0・金額が 0 でない行 = `offset_lines_present`、LegacyObserved = `legacy_basis`、数量・金額とも 0 の行 = 「相殺の判定が要る」という印だけ返す〈判定は ④〉。共有 JAN の行は全在庫連動候補が Before のときだけ commit 可、他は file 全体を held）、(d) 在庫判定の行の集合（正常 JAN の全行を 0/0 行も含めて全候補と `pos_stock_sync` 付きで集める。売上の行の集合〈`parse.rs:94` の 0/0 除外〉は変えない、`23-io-z004-parser.md:9`）。時刻・精算日時を入力にしない。
- S4（変更）`src-tauri/src/biz/csv_import_service/mod.rs`: `mod time_evidence;` を足す。
- S5（test）上の各 file の `#[cfg(test)]` の test と、`src-tauri/src/biz/csv_import_service/tests/` に `time_evidence_tests.rs` を新設して `tests/mod.rs` に登録する（Matrix の T 行）。既存 test は変えない。
- S6（生成物）`docs/function-design/90-traceability.md`: 新しい test の REQ 参照で `cargo run --bin generate_traceability` が再生成する（手で編集しない。他 lane と衝突したら取り込んだ後に再生成、D-098）。
- S7（docs、本 commit）`docs/decision-log.md` の末尾に D-109、`docs/db-design/pos-tables.md` の proposed 節に backfill しない 1 文、`docs/backlog.md` の本 lane の entry（STK-1 / STK-2、design lane の着手条件の状態、診断 2 本、0/0 行、③〜⑤ の申し送り）。

未配線の機械検査（D-109 (3)）: S1〜S4 の新しい関数の根（test 以外から呼ばれない入口）に `#[cfg_attr(not(test), expect(dead_code))]` を置く。`db` は `src-tauri/src/lib.rs:9` で `pub mod` なので、`db` の新しい関数は `pub(crate)` にする（`pub` だと公開 API として dead_code の対象外になり、production からの呼出しを検出できない。Contract Probe P1）。`biz`・`io` は private mod（`lib.rs:3`・`:13`）なので `pub` でよい。S3 の `settlement_metadata` は S4 の受領が読む（S4 の根の expect で live 扱い）。

型・関数の形を変える所の全件（kickoff の最終項目）: 形が変わる既存の型は `z004_parser::ParseResult` だけ（作る所 `z004_parser.rs:210`、読む所 `parse.rs:34`、struct literal の test なし）。既存の関数の signature は変えない。新しい関数は呼出し元が test だけ。wire（command・DTO・bindings）は変えない。

他 lane と重なる file: `src-tauri/src/io/z004_parser.rs` と `docs/function-design/23-io-z004-parser.md`（本 lane は 23 を編集しない）は `agent/plu-clear` が触る可能性がある（未確認）。本 lane は `ParseResult` に field を 1 つ足し、メタ行の抽出の関数を足すだけで、データ行の分類（`parse_data_line`・`normalize_jan`、SPEC-Z4A-D8）には触らない。`docs/decision-log.md`（末尾に D-109 だけ）・`docs/backlog.md`（本 lane の entry だけ）・`docs/function-design/90-traceability.md`（生成物）は全 lane と共有。#145 が触る `24-io-csv-import-repo.md`・`34-biz-sales-service.md`・`56-ui-daily-sales.md` は本 lane が引用するだけで編集しない（`sales_repo.rs` は S2 で触るが、#145 の `OfficialDailyReportRow` 周辺〈`sales_repo.rs:1019-1023`〉には触れず、新しい関数は既存の関数の後〈`#[cfg(test)]` の module の前〉に足す）。

| 共有 file | 本 lane の範囲 | 他 lane の範囲 |
|---|---|---|
| `src-tauri/src/db/sales_repo.rs` | `pos_import_sources` と active import の識別メタの新関数（既存の関数の後に追加） | #145: 日報の公式の行の aggregate |
| `src-tauri/src/io/z004_parser.rs` | `ParseResult` の field とメタ行の抽出 | `agent/plu-clear`（触るなら）: データ行の分類 |
| `docs/decision-log.md` | 末尾の D-109 | A = D-108（`agent/npm-audit-1006` が D-108 を予約したと Coordinator の補足にあり、番号の割当ては報告で確認）、C = D-110 |
| `docs/backlog.md` | STK-1 / STK-2、design lane の項、診断 2 本、0/0 行、③〜⑤ | 各 lane の項 |

## Non-scope

- `docs/Plans.md`（D-097）、`docs/project-memory.md`（SD の行は lane A、本 lane は触らない）、ADR 2 本の本文と Status（Q2 の owner 判断の後に扱う）、`docs/function-design/` の 20 / 21 / 23 / 24 / 32 / 35 の proposed 節（② の範囲では既存で足りる。Design Readiness）。
- 通常起動の migration の registry 登録、`update_stock_quantity` と `ProductUpdates.stock_quantity`（`product_repo.rs:166`・`:1040`）の置換、旧 writer の kind 対応、`legacy_*` と停止の撤去、command / bindings / UI（⑤）。
- 計数 context・保存・確定・独立再実測・flag の解消（③）、受領と分類の preview / commit への配線・flag の作成・相殺の判定・取消補償・legacy の取消の保留・準備照会・`ej_unverified`・在庫連動の有効化の拒否（④）。
- EJ の日次取込みと相殺の判定、精算系列・番号 reset・同一性の比較方法の見直し（design lane / EJ の日次取込みの lane）。
- 実機・実データでの確認（本 lane は合成データだけ）。

## Acceptance Criteria

- AC1（schema の内容）: `apply_time_evidence_schema` を当てた試験 DB で、master / tracking / pos / transaction の proposed 節の列・表・CHECK・UNIQUE・FK がある（`PRAGMA table_info` / `sqlite_master` を test が照合する）。`stocktake_items.observation_kind` を省いた INSERT が失敗する。`products.stock_revision` が i64 上限から増やせず、REAL にならない（P3）。test 名は Matrix T1〜T3。
- AC2（未配線）: 通常の `migrate()` の後の DB に新しい表・列が無く、`app_max_version()` は 7 のまま（baseline: `rg -c 'version: [0-9]+,' src-tauri/src/db/migration.rs` が `7`、起票時 `def86e19` で実行）。T4。
- AC3（旧明細の分類と保全）: v7 の上で作った旧明細の 4 形（両 NULL / 0・0・時刻 NULL / 数量と時刻あり / 矛盾形）が uncounted / auto_filled / legacy / legacy になり、旧 header は `reconciliation_version=0`、`stocktake_legacy_movement_ceiling` が当てる前の movement 最大 ID（空なら 0）、在庫・movement・売上・取込みの行が当てる前後で一致する。途中で失敗させると新しい列・表・key・`schema_versions` の行が残らない。T5〜T7。
- AC4（数量と版）: `update_stock_quantity_with_revision` が同じ数量でも版を 1 進め、対象なしは false で版を変えず、上限では数量も版も書かない。`bump_stock_revision` は増分後の版を返す。呼出し側の TX を rollback すると両方戻る。T8〜T10。
- AC5（受領）: 同じ hash の受領は最初の ID と時刻を返し、別 hash は新しい ID。業務 TX を rollback しても受領は残る。最大 source ID は空で 0。T11・T12（`src-tauri/src/biz/csv_import_service/tests/time_evidence_tests.rs`）。
- AC6（精算の同一性）: 同じ帳票種別で machine_no / settlement_no が一致する別 hash は、未取込み・取消済みの source が相手でも `source_identity_conflict` で業務 write の前に拒否し、拒否の初回の code と時刻を独立 TX で残す（2 回目で上書きしない）。同じ精算日の active import があり、どちらかの machine_no / settlement_no が欠けると拒否する（両方欠け・片方欠け・比較先の source なしの 3 形）。同日の active が無ければこの追加の拒否はしない。T13〜T16。
- AC7（前後の分類）: 非連動 = 売上のみ、NeverObserved = After、LegacyObserved = Unknown（理由 `legacy_basis`）、`source.id <= source_cursor` = Before、`source.id > source_cursor` = Unknown（数量 ≠ 0 は `sale_order_unknown`、数量 0・金額 ≠ 0 は `offset_lines_present`、0/0 は相殺の判定が要る印）。auto_filled はそれより前の有効な観測を隠さない。分類の入力に時刻・精算日時が無い（関数の signature）。共有 JAN の行は全在庫連動候補が Before のときだけ commit 可、1 つでも Before でなければ file 全体が held。T17〜T22。
- AC8（在庫判定の行）: 正常 JAN の 0/0 行が在庫判定の行の集合に全候補付きで入り、売上の行の集合（`parse_and_validate` の `matched_rows`）には入らない。既存の `test_parse_and_validate_req401_empty_records_excluded` は変えずに PASS。T23。
- AC9（Z004 の識別メタ）: 合成の layout A で machine_no / settlement_no / settled_at / report_kind を文字列のまま（先頭の 0 を保って）返し、従来 shape は各項目 `None`。既存の z004 parser の test は変えずに PASS。T24・T25。
- AC10（未配線の機械検査）: `cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings` が exit 0。新しい根を production から呼ぶ一時の変更で `unfulfilled_lint_expectations` が出ることを Writer が 1 回確かめて PR body に書く（commit しない）。T26。
- AC11（既存の保護）: `rg -c '#\[ignore' src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs` が `2`（baseline `2`）。`cd src-tauri && cargo test --offline --lib cross_feature_tests -- --ignored --nocapture` は今と同じく 2 本 FAIL し、出力に `XFA_TEMPORAL_FAIL` と `XFA_LATE_IMPORT_FAIL` が出る（baseline: 起票時に同 command で exit 101、2 failed）。ignored を含めない `cargo test` は全 PASS。`legacy_stop_tests.rs` は変えずに PASS。
- AC12（docs と生成物）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/doc-consistency-check.sh` が ERROR 0。traceability を再生成し、生成物の検査（L1 full の traceability）が通る。

## Design Readiness

- 引用する設計正本（節まで）: ADR `docs/adr/2026-09-18-stocktake-time-evidence.md` の SPEC-STK-TIME-D1（版の規則、:46-54）・D2（:62-68）・D3（:72-86）・D4（判定表 :96-102、判定不能の理由 :111-116、共有 JAN :140-141）・D8（:261-324）と「㉘ への引継ぎ」（:388-414）。停止 ADR SPEC-STOP-D3・D6。`docs/function-design/32-biz-csv-import-service.md` の proposed 節「一つの分類関数とcommit」（:27-52）。`35-biz-stocktake-service.md` の proposed 節（:3-48）。`20-io-product-repo.md`・`21-io-inventory-repo.md`・`23-io-z004-parser.md`・`24-io-csv-import-repo.md` の proposed 節。`docs/db-design/master-tables.md`・`tracking-system-tables.md`（「移行と保存TX」を含む）・`pos-tables.md`・`transaction-tables.md` の proposed 節。
- 必要な設計成果物: BIZ / IO / repo の振舞い = existing sufficient（上の proposed 節）。DB = existing sufficient + updated in this PR（`pos-tables.md` に backfill しない 1 文）。durable な判断 = updated in this PR（D-109: lane の選び方、未配線の入れ方、機械検査、backfill しない）。command / DTO / UI = 該当なし（⑤）。
- plan にしかない durable な判断の昇格先: D-109。
- 前提・制約と、延期した design gap の follow-up: 相殺の判定（0/0 行）・EJ の interface・準備照会・在庫連動の有効化の拒否は ④、計数と補正は ③、切替は ⑤（`docs/backlog.md` の ③〜⑤ の申し送り）。精算系列・同一性の比較方法は design lane が見直し得るが、ADR D3 の保守的な拒否のまま作り、見直しは追加の変更になる（ADR :20、D-109 の Revisit）。
- 絶対保証の自己点検: 「通常の起動で schema が変わらない」は registry に登録しないことと AC2 の test で守る。例外は test の helper だけ。「production から新関数を呼べない」は AC10 の clippy の expect で守る。`db` の `pub` 関数を足すと検出できない（P1）ので `pub(crate)` を AC10 と Review Focus で確かめる。
- 判定: ready（② の実装に設計の問いは無い。owner の判断 Q1〜Q3 は ② の Scope を変えない）。

## Registration / Generation Obligations

| 変更対象 | 本 lane の義務 |
|---|---|
| Tauri command | 該当なし（⑤） |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名・削除 | 該当なし |
| REQ / coverage の追加 | 新しい test の REQ-205 / REQ-401 の参照で `cargo run --bin generate_traceability` を実行し `docs/function-design/90-traceability.md` を再生成（S6） |
| route / operator 画面 | 該当なし |
| Rust の module 登録（本 lane 固有） | `db/mod.rs` の `mod schema_time_evidence;`、`csv_import_service/mod.rs` の `mod time_evidence;`、`csv_import_service/tests/mod.rs` の `mod time_evidence_tests;`。migration の registry（`migration.rs` の `migrations()`）には登録しない（D-109 (2)） |

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | 置き換えうる adapter と core の契約は | ARCHITECTURE、23、32 | 当たる。Z004 のメタ行の読み方は IO（CASIO 固有）、同一性・前後の判断は BIZ。IO は番号を解釈せず文字列で渡す（23:5） | なし |
| Fact check / design decision split | 観測した事実とアプリの決定は | project-memory、backlog、ADR | 当たる。Z004 のメタ行の並び（23:130、2026-08-17 実ファイル抽出）は観測済みの事実。精算系列の意味（backlog:26、project-memory:239）は design lane の入力で、本 lane は判断に使わない | design lane（backlog） |
| Lifecycle / retry | 受領・拒否・失敗・再試行は | 32、pos-tables | 当たる。受領は業務 TX と独立で rollback でも残る、同 hash は最初の ID、拒否の証拠は初回だけ（AC5・AC6） | なし |
| Operator workflow | 実際の操作列は | Ordinary Operation | 操作は変わらない（① の停止のまま） | ⑤ |
| Replacement path | 外部が変わったら何を替えるか | 23、D-023 | Z004 のメタ行の抽出だけが CASIO 固有 | なし |
| Data safety / evidence | 実データを commit しないか | Data Safety | 当たる。合成 fixture だけ | なし |
| Reporting / accounting semantics | 売上・在庫・棚卸しを混ぜていないか | 32、tracking | 当たる。在庫判定の行の集合と売上の行の集合を分ける（AC8）。0/0 行は売上も movement も作らない | ④ |
| Manual verification | 自動 test で示せないものは | Test Plan | 無い（通常起動へ配線しない）。L3 は ⑤ | ⑤ |
| 環境・再現性 | 新しい環境依存は | Contract Probe | SQLite の版（bundled、`Cargo.toml:32` の rusqlite 0.31）に依る ALTER・overflow の挙動を test で固定（P2・P3） | なし |

## Boundary / Wire Contract

- producer: IO-02 `parse_z004`（`settlement_metadata`）、BIZ の受領・同一性・分類（crate 内部）、DB の schema 関数（test の helper だけが呼ぶ）。
- consumer: 本 lane の test。③ / ④ の BIZ。wire（command・DTO・bindings）は無い。
- wire type: 該当なし。
- internal type: `SettlementMetadata { machine_no, report_kind, settlement_no, settled_at: Option<String> }`、分類の結果（Before / After / Unknown と理由、売上のみ、held）、source ID と cursor は `i64`（0 = 空集合）。
- precision/range: 版・cursor・ID は非負 `i64`、増分は checked。番号は文字列（先頭の 0 を保つ）。
- round-trip path: 該当なし（DB と BIZ の内部）。
- invalid input: 識別メタの欠け = 同日の active があれば拒否、無ければ通す（AC6）。版の上限 = 書かずにエラー（AC4）。
- compatibility: 通常起動の DB は v7 のまま。`ParseResult` への field の追加は既存の呼出しを壊さない。

## Test Plan

[Test Design Matrix](test-matrices/2026-10-06-stocktake-p1.md)。

- targeted tests: `cd src-tauri && cargo test --offline --lib time_evidence`、`... --lib z004_parser`、`... --lib inventory_repo`、`... --lib sales_repo`、`... --lib stocktake_repo`、`... --lib db::`。
- negative tests: 版の上限、kind を省いた INSERT、同一精算の別 hash、識別メタの欠け 3 形、migration の途中の失敗、共有 JAN の held。
- compatibility checks: 通常の `migrate()` が v7 のまま（AC2）。既存の z004 parser・`parse_and_validate`・`legacy_stop_tests`・cross feature の通常 test が変えずに PASS（AC8・AC9・AC11）。
- data safety checks: 合成 fixture だけ（Data Safety）。
- main wiring/integration checks: 本 lane は配線しないことが契約（AC2・AC10）。

## Review Focus

- 通常の起動の DB を変えないこと（registry に登録していない、`test_support` 以外から schema 関数を呼んでいない）と、`db` の新関数が `pub(crate)` で根に expect があること（P1）。
- 分類の関数が時刻・精算日時を入力に持たず、`source.id <= source_cursor` だけで Before を決めること。LegacyObserved を未実測に落とさないこと。auto_filled が前の観測を隠さないこと。
- 受領と拒否の証拠が業務 TX の rollback で消えないこと。同一性の照合が未取込み・取消済みを含むこと、識別メタの欠けを候補 0 件へ落とさないこと。
- `observation_kind` に恒久の DEFAULT を付けていないこと（table 再構築）。旧明細の分類が `tracking-system-tables.md` の表どおりで、現在の廃番 flag から逆算していないこと。
- 0/0 行が在庫判定の行に入り、売上の行に入らないこと。
- 普通の一日の操作列で、③ / ④ がこの基盤の上に Matrix の「STK-1 / STK-2 の green の条件」を満たせるか（本 lane の関数の形がそれを妨げないか）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| SPEC-STK-TIME-D1（版の不可分な増分、checked、同量でも進める） | ADR :46-54、21 proposed、master-tables proposed | S2 `update_stock_quantity_with_revision` / `bump_stock_revision` | T8〜T10 | 既存 writer の切替は ⑤ |
| SPEC-STK-TIME-D2（受領は hash で一意、最初の ID、業務と独立） | ADR :62-68、pos-tables proposed、24 proposed 1〜2 行 | S2 sales_repo、S4 (a) | T11・T12 | preview への配線は ④ |
| SPEC-STK-TIME-D3（同一精算の別 hash の拒否、識別メタの欠けの拒否、拒否の証拠） | ADR :72-86、32 proposed :40-46、24 proposed 3〜5 行 | S2 sales_repo、S4 (b) | T13〜T16 | commit TX での再検査の配線は ④、準備照会の `settlement_missing` は ④ |
| SPEC-STK-TIME-D4（判定表、理由、共有 JAN の held） | ADR :96-102 / :111-116 / :140-141、32 proposed :29-35 | S4 (c)、S2 stocktake_repo | T17〜T22 | 相殺の判定（0/0）・flag の保存は ④ |
| SPEC-STK-TIME-D4 / IO-02（0/0 行を在庫判定に残す） | 23:9、32 proposed :23、ADR :106 | S4 (d) | T23 | CachedPreview への配線は ④ |
| SPEC-STK-TIME-D3 / IO-02（識別メタの抽出） | 23:5・:130 | S3 | T24・T25 | 画面に出さない |
| SPEC-STK-TIME-D8（schema・旧明細の分類・legacy 上限・失敗で全部戻す・恒久 DEFAULT なし） | ADR :261-324、tracking / pos / master / transaction の proposed 節 | S1 | T1〜T3・T5〜T7 | registry 登録は ⑤ |
| SPEC-STOP-D6 / D-109 (2)（⑤ まで通常起動へ入れない） | 停止 ADR D6、tracking「移行と保存TX」 | S1（registry に登録しない） | T4 | ⑤ |
| D-109 (3)（test だけが呼ぶことの機械検査） | D-109、停止 ADR D3 の同じ仕組み | S1〜S4 の根の expect、`db` は `pub(crate)` | T26（clippy） | なし |
| D-109 (4)（旧 import から受領を backfill しない） | pos-tables proposed（本 PR の 1 文）、32 proposed :15 | S1 | T7 | なし |
| 隣接: 既存の診断と停止 | 停止 ADR D3・D5、cross-feature-verification | 変えない | AC11 | 正規回帰への移行は ⑤ |

adjacent-contract sweep: `update_stock_quantity` の既存 caller 4 か所（Scope S2）と `ProductUpdates.stock_quantity`（`product_repo.rs:166`・`:1040`）は ⑤ の置換対象で本 lane は触らない（除外を Non-scope に明記）。`pos_stock_sync` の共通書込み経路と `pos_sync_disabled_revision` の記録（20 proposed）は ④ / ⑤（列だけ S1 で作る）。

## Contract Probe

- P1 `pub mod db` の `pub` 関数は dead_code の対象外: scratchpad の最小 crate（rustc 1.94.1、`pub mod db { pub(crate) fn …; pub fn …; #[cfg_attr(not(test), expect(dead_code))] pub(crate) fn root() { helper() } }` と private mod の `pub fn`）で `cargo clippy --offline --all-targets -- -D warnings` -> lib の build で `pub(crate)` の未使用と private mod の `pub fn` の未使用は error、`pub mod` の `pub fn` は報告なし、expect を置いた根とその根だけが使う helper は報告なし。根を `pub fn` から呼ぶと `this lint expectation is unfulfilled` で error。よって `db` の新関数は `pub(crate)`、根に expect（AC10）。
- P2 SQLite は NOT NULL で DEFAULT の無い列を ALTER で足せない: Python の sqlite3（SQLite 3.51.3）で `ALTER TABLE t ADD COLUMN k TEXT NOT NULL` -> `Cannot add a NOT NULL column with default value NULL`。`observation_kind` は table 再構築で埋める（tracking「移行と保存TX」の 2 項目め）。bundled の SQLite（rusqlite 0.31）での同じ挙動は T3 が固定する。
- P3 整数の上限を越える加算: 同じ環境で CHECK の無い INTEGER 列に `v=v+1`（v = i64 上限）-> `9.223372036854776e+18`（REAL）に化ける。`CHECK(typeof(v)='integer' AND v>=0)` があれば `CHECK constraint failed`。版の増分は Rust の checked 演算で上限を先に検査し、CHECK を併せて置く（T2・T9）。
- P4 Z004 layout A のメタ行: 既存の観測（`23-io-z004-parser.md:130`、2026-08-17 の実ファイルの機械抽出: マシンNo. / ファイル / モード / 精算回数 / 日付 / 時刻）。本 lane は合成のメタ行で test し、実ファイルは使わない。新しい外部の probe は要らない。
- Plan Gate の前に要る probe: なし。

## Data Safety

- 実 POS の Z004 / EJ、店の DB、backup、log を commit しない。fixture は合成（JAN は `29000000…` の店内コード形、金額・名称は合成）。
- local-only: `.local/` の持ち帰りデータの集計は読むだけで、件数・実値を tracked に写さない。
- synthetic-only: 本 lane の全 test。

## owner の判断事項

本 lane の Scope を変えない。Plan Gate の前に Coordinator が owner へ諮る（報告に選択肢と推奨）。

- Q1 未決（owner）: design lane「実測と POS 系列の対応を取得・保存する」の着手条件 (4)（棚卸し → アプリ終了 → OS 再起動 → 翌日の遅延取込み）を外すか。本 lane には影響しない。
- Q2 未決（owner）: 時点証拠 ADR（Status proposed）を、② 〜 ④ の実装の間どう扱うか（proposed のまま ⑤ で accepted / ② の Plan Gate で accepted / 本 lane で改訂）。
- Q3 未決（owner）: STK-2 の診断（`XFA_LATE_IMPORT_FAIL`）の green を、⑤ の時点で「計数を始めた後に受領した資料は、要再確認 → 数え直しで現物に戻る」と定義するか、「数え直しなしで現物に一致」まで求めて ⑤ を design lane の後にするか（Matrix の G2 の行）。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
