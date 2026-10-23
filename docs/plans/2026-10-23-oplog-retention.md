# Plan Packet: 操作ログの保持を 7 年程度に延ばす

wave に属さない単独の lane（2026-10-23 に同時に起票した 2 本の 1 本。もう 1 本は初期投入の手順の lane `docs/plans/2026-10-23-initial-load-procedure.md`〈別の branch〉）。導入の前の関門の candidate「操作ログの保持を 7 年程度へ」（[Plans の導入の前の関門](../Plans.md#導入の前の関門)、`docs/backlog.md` の「操作ログの保持を 7 年程度に延ばす」、owner の決定 repo 外の回答台帳 TD-348）を、関門に足す前提で起票する（owner の決定 repo 外の回答台帳 TD-402、2026-10-23）。

規模と手法（起票の最初に数えた）: 実装で触る code は 3 file（`src-tauri/src/db/schema_v1.rs` の `app_settings` の初期データ 1 行、`src-tauri/src/mnt/log_manager.rs` の `cleanup_old_logs` と test、`src-tauri/src/db/system_repo.rs` の `delete_old_logs` と test）と生成物 1（`docs/function-design/90-traceability.md`）。正本は本 commit（plan-first）で 8 file を直した（72・74・tracking-system-tables・DB_DESIGN・ARCHITECTURE・REQ-700・decision-log〈D-136 と D-051 の Superseded in part の行〉・backlog）。command・DTO・bindings・画面・migration は 0。関数の形（`cleanup_old_logs(conn) -> Result<(), DbError>`、`delete_old_logs(conn, retention_days: u32) -> Result<usize, DbError>`）は変えない。手法: 1 lane のまま（既定の値と掃除の守りは同じ関数の同じ段で、分けると同じ test を 2 回直す）。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: 起票は Opus 5.5 subagent（本 run の起草役）。実装の Writer は座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）の Writer 行から Coordinator が発注時に決める
- Plan Reviewer: fresh Opus 5.5 + Codex（座組表どおり）
- Final Reviewer: Fable 5.1（Claude 側。座組表の「R3 以上と design lane で Fable 5.1」）+ Codex（座組表どおり）
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/oplog-retention

遷移の記録:

1. kickoff → spec-check（2026-10-23、起草役）: 発注書の範囲（保持の既定の値の変更だけか、掃除の仕組みも変えるか、既存の設定値を持つ DB の扱い、7 年分の大きさの見積り）を範囲にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-23、起草役）: 72 §72.4 の保持日数の取得（読めない値は既定 365 日で消す）と、DB_DESIGN の D-5・tracking-system-tables の初期データ・ARCHITECTURE の MNT-02 の行・74 の 365 日の記述・D-051 の Retention を変える必要がある。
3. design → plan-draft（2026-10-23、起草役、同じ commit）: 設計の出力（72 MNT-02-D1、decision-log D-136、上の各文書の直し）は本 commit に置いた。未解決の設計の問いは無い（owner の判断事項 1 問は推奨を既定にした。下の Review Focus。owner の方針、repo 外の回答台帳 TD-401）。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（起票の時点） | 2（Ready 1、merge 1） | 4 | 6 = 0 + 2 + 4 |

owner の判断事項 K1 は既定で進め、本 lane の完了に答えを要らないので見込みに数えない。L3 は無い（下の Risk の L3 の段）。

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R3「DB ... changes」に当たる: DB を作るときの初期データ（`app_settings` の key `log_retention_days`）と、操作ログの物理削除の条件（audit / log の persistence の振舞い）を変える。R4 にしない理由: 新しい削除の経路を足さず、消す範囲を狭める向きだけの変更（保持を 365 日から 2557 日へ延ばし、保持日数を確定できない値では今の「既定 365 日で消す」をやめて消さない）。backup・restore・migration・店の実データに触れない（本番の DB は無い、`docs/project-memory.md` の「無いもの」）。R3 の要件: Contract Ledger・Data Safety・Contract Probe・Test Design Matrix・Design Readiness を置いた。required gate: 実装の PR は Rust を変えるので `rust=true`（classify-changes）。Final Review Minimum は 1、Human Gate は `ready,merge`（R3 の既定）。

L3 について: L3 の条件（`docs/DEV_WORKFLOW.md` Human Visual Confirmation の L3 Eligibility）の (1)「Windows/Tauri native でしか観測できない」に当たる項目が無い。掃除は起動時の setup で DB に対して行い、振舞いは全て自動 test で示せる（Matrix）。7 年の経過は実機で見られない。画面の文言・route は変えない。owner の操作の回数を減らす工夫: L3 の round を作らず、初回の導入の版の MSI の予行演習（`docs/msi-distribution-runbook.md` の確かめる項目）で操作ログの画面を開いたときに記録が出ることを見るだけで足りる（追加の操作は無い）。Human Gate に manual を入れないので、`cargo check --release` の Writer の完了条件は当たらない。

## Goal

Goal Invariant:

### 最小完了条件

- 初回の導入の版で作られる店の DB では、操作ログが 7 年以上（2557 日）消えずに残り、それより古いものだけが起動時に消える。
- 保持日数の設定が読めない値・0 になっても、操作ログは消えない（記録が溜まる側に倒れる）。

### 失敗定義

- 新しい DB の `log_retention_days` が 2557 でない、または掃除が 2557 日より新しい記録を消す。
- 設定の値が読めない・0 のときに記録を消す、または大きな値で起動時に panic する（setup の中で起動が止まる）。
- 既にある開発・試験 DB の値を書き換える migration を足す（本 lane は足さない。D-136 (4)）。
- 操作ログの画面・command・wire が変わる。

### 非目的

- 保持日数を画面で変えられるようにする（69 UI-11a-D1 のまま）。
- 操作ログの archive・CSV 出力・手動削除（74 の Non-scope のまま）。
- backup の保持日数（3 日）を変える。
- `operation_logs` に index を足す（合成の 7 年分で一覧の取得が約 0.07 秒。Contract Probe）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 初回の導入の版で DB が空から作られた（`log_retention_days` = 2557） | 毎日アプリを起動する | 7 年以上前の操作ログだけが 1 日 1 回消え、それより新しい記録は操作ログの画面で見える | — | なし |
| 設定の値が壊れた（数でない・0。画面からは変えられないので、DB を手で触った場合だけ） | 起動する | 操作ログは消えず、診断ログに warn が残る。アプリは起動する | 値を直せば次の起動から掃除が戻る | なし |
| 既にある開発・試験 DB（`log_retention_days` = 365） | 起動する | 今と同じく 365 日で消す。22 §16 の作り直しで新しい既定になる | — | なし |

## Scope

決めたこと（発注書の「決めること」）:

- 既定の値の変更と、掃除の守りの小さな変更の両方。掃除の仕組み（起動時に 1 日 1 回、物理削除、`log_cleanup` の記録）は変えない。守りの変更は、保持日数を確定できない値（数でない・0）で既定に置き換えて消すのをやめて消さないことと、日付の範囲の外の値で panic しないこと（72 MNT-02-D1。backup の 71 MNT-01-D3 と同じ形）。
- 既存の設定値を持つ DB: migration は足さない。新しい DB の値は DB を作るときの初期データ（`schema_v1.rs`）で決まる。既にある DB は開発・試験 DB だけで、今の値（365）のまま、作り直せば 2557（D-123 (1)、D-136 (4)）。予約の 22 §25・MNT-03-D23 は使わない（PR #188 が migration v11 を足す予定で、足すと番号も後ろにずれる）。
- 7 年分の大きさ: 合成の測定（下の Contract Probe）。店の 1 日の行数は未実測。

実装（plan-approved の後）:

- `src-tauri/src/db/schema_v1.rs`: `app_settings` の初期データの `('log_retention_days', '365', …)` を `'2557'` にする（他の行は変えない）。
- `src-tauri/src/mnt/log_manager.rs`: `DEFAULT_RETENTION_DAYS` を 2557 にする（設定の行が無いときの値）。設定の値が `u32` として読めないか 0 のときは、`tracing::warn!` を記録して削除も `log_last_cleanup_date` の更新もせず `Ok(())` を返す（72 §72.4 の手順 3）。doc comment の「デフォルト365日」を直す。
- `src-tauri/src/db/system_repo.rs`: `delete_old_logs` の cutoff を `checked_sub_days`（`chrono::Days`）で求め、日付の範囲の外なら何も消さず `Ok(0)` を返す（72 §72.4 の手順 4）。
- test（同じ 2 file の `mod tests`）:
  - 直す: `test_cleanup_old_logs_req902_deletes_expired`（366 日前 → 2558 日前）、`test_cleanup_old_logs_req902_keeps_recent`（364 日前 → 2557 日前。初期データの値の境）、固定の日付 `2025-01-01T10:00:00` を古いログに使う `test_cleanup_old_logs_req902_first_run`・`test_cleanup_old_logs_req902_same_day_skip`・`test_cleanup_old_logs_req902_records_cleanup`（今日から 2558 日前の相対の日付にする。365 日より古いだけでは 2557 日の保持で消えない）。期待（消える・残る・記録される・飛ばす）は変えない。誤った test ではなく、設計正本の値（72 MNT-02-D1）が変わったための直し（AGENTS.md の Working Rules）。
  - 足す（名前は実装で決め、REQ-902 を付ける）: 新しい DB の `log_retention_days` が `"2557"`。設定の行を消した DB で 2558 日前が消え 2557 日前が残る。値が `"abc"`・`"-1"`・`"0"` の DB で何も消えず `log_last_cleanup_date` が変わらない。値が `"4294967295"` の DB で panic せず何も消えない（`cleanup_old_logs` と `delete_old_logs` の両方）。
- 生成物: `docs/function-design/90-traceability.md`（`cd src-tauri && cargo run --bin generate_traceability`。REQ-902 の test の数が変わる。手で直さない）。

作る所・読む所の全件（`rg -n "log_retention_days|DEFAULT_RETENTION_DAYS|delete_old_logs|cleanup_old_logs" src-tauri/src src` で確かめた、2026-10-23）: 作る所は `schema_v1.rs` の初期データ 1 行だけ（画面と command から書く所は無い。`src/` に hit 無し）。読む所は `log_manager.rs` の `cleanup_old_logs` だけ。`delete_old_logs` の呼び出し元は `cleanup_old_logs` と `system_repo.rs` の test 2 本（`test_delete_old_logs_req902_*`、引数に 365 を直接渡すので変えない）。`cleanup_old_logs` の呼び出し元は `src-tauri/src/lib.rs` の `run` の setup（失敗を warn して続ける、変えない）と `log_manager.rs` の test。`system_repo.rs` の `log_retention_days` の key の存在を見る test は変えない。`backup.rs` の `DEFAULT_RETENTION_DAYS`（3、backup の保持）は別の定数で変えない。

正本（本 commit、plan-first）:

- `docs/function-design/72-mnt-log-manager.md`: §72.4 の手順 3・4、MNT-02-D1 の新設、§72.6 の test の表（名前を実在の `_req902_` に直し、MNT-02-D1 の test を足す）。
- `docs/decision-log.md`: D-136 の新設（末尾）、D-051 の `Superseded in part by: D-136` の行。
- `docs/DB_DESIGN.md` の D-5、`docs/db-design/tracking-system-tables.md` の app_settings の初期データ例、`docs/ARCHITECTURE.md` の MNT-02 の行、`docs/REQ-700_diagnostic_log.md` の比較の表、`docs/function-design/74-ui-operation-logs.md` の 365 日の記述 6 か所（UI-11c-D10・D13・D14、§74.6 の 2 か所、Non-scope の表）。
- `docs/backlog.md`: 「操作ログの保持を 7 年程度に延ばす」の項目に起票の行。

他の lane との所有（`docs/DEV_WORKFLOW.md` Wave Operation。open の PR #172・#188・#190・#191・#192・#193・#194 の差分〈#188 は packet の Scope〉と本 lane の予定の path を `comm -12` で突き合わせた。下の AC の実測）:

| file | 節 | 所有 |
|---|---|---|
| `docs/decision-log.md` | D-136（末尾に足す）と D-051 の Superseded in part の行 | 本 lane。#188（D-109 の Superseded の行と新しい決定）・#191・#194 の新しい決定は別の節。末尾への追記は merge の順で両方を残す |
| `docs/DB_DESIGN.md` | D-5 の節 | 本 lane（#188 の Scope は別の節） |
| `docs/ARCHITECTURE.md` | MNT-02 の行 | 本 lane（#188 の Scope は D-118 の記述） |
| `docs/db-design/tracking-system-tables.md` | §19 app_settings の初期データ例の `log_retention_days` の行 | 本 lane（#188 は inventory_movements ほか） |
| `docs/backlog.md` | 「操作ログの保持を 7 年程度に延ばす」の項目とその下の箇条 | 本 lane（#172・#188・#190・#192 は別の項目） |
| `docs/function-design/90-traceability.md` | 生成物（REQ-902 の行） | 生成物。衝突したら手で解かず、取り込んだ後に再生成する（D-098。#188 も再生成する） |
| `src-tauri/src/db/schema_v1.rs` | `app_settings` の初期データの `log_retention_days` の行 | 本 lane。#188 は読むだけ（L3 の手順で初期の部門を引く）。#192 が backlog に足す後続の lane（部門 12 の `code_prefix`）は同じ file の `departments` の初期データの行で、別の行 |
| 72・74・REQ-700・`log_manager.rs`・`system_repo.rs`・本 packet・Matrix | 全体 | 本 lane（他の PR の差分と Scope に無い） |

この変更で不要になる記述・条件・code（D-127 の問い）: DB_DESIGN の D-5 の「1年以上前のログが必要な場合はバックアップから復元」は backup の保持（3 日）と合わず誤っていたので置き換えた。72 の「パース失敗 → デフォルト365日」の fallback は消す側の既定で、MNT-02-D1 で外す（既定は設定の行が無いときだけ）。74 の「365日 cleanup」の 6 か所は日数を書かずに「保持日数の cleanup」にし、日数の正本を 72 MNT-02-D1 の 1 か所にした。`docs/DEV_SETUP_CHECKLIST.md` の「MNT-02 log_manager: cleanup_old_logs（起動時自動削除、365 日超）」は済んだ作業の記録の行で、変えない。decision-log の D-051 の本文は append-only で、Superseded in part の行だけを足した。

## Non-scope

- 保持日数の画面（69 UI-11a-D1）、操作ログの画面・command・wire・bindings。
- migration（22 §25・MNT-03-D23 の予約は使わない）、既にある開発・試験 DB の値の書換え。
- backup の保持日数、`operation_logs` の index、診断ログ（MNT-04、30 日）。
- `docs/Plans.md`（D-097）。

## Acceptance Criteria

- AC1: `bash scripts/doc-consistency-check.sh` が exit 0（ERROR なし）。baseline（2026-10-23、起点 `eed07d37`）: exit 0、`結果: WARN 12 件（ERROR なし）`。
- AC2: `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-23-oplog-retention.md` が exit 0。
- AC3（正本の旧い文）: `rg -n 'log_retention_days \| 365|デフォルト365日|365日 cleanup|365日自動削除|365日超|\| 保持期間 \| 365日' docs/ARCHITECTURE.md docs/DB_DESIGN.md docs/REQ-700_diagnostic_log.md docs/db-design/tracking-system-tables.md docs/function-design/72-mnt-log-manager.md docs/function-design/74-ui-operation-logs.md` が何も出さない（exit 1）。baseline（`git grep` で `eed07d37`）: 10 行（ARCHITECTURE 208、REQ-700 90、tracking 228、72 の 47、74 の 60・63・64・272・297・568）。本 commit の後: exit 1。
- AC4（初期データ）: `rg -n "'log_retention_days',\s+'2557'" src-tauri/src/db/schema_v1.rs` が 1 行。baseline（`eed07d37`）: exit 1（値は `'365'`）。
- AC5（既定の定数）: `rg -c 'DEFAULT_RETENTION_DAYS: u32 = 2557' src-tauri/src/mnt/log_manager.rs` が `1`。baseline: exit 1（`= 365`）。
- AC6（test）: `cd src-tauri && cargo test --lib log_manager` と `cd src-tauri && cargo test --lib system_repo` が全 PASS で、Scope の「足す」の 4 群の test が含まれる（test の名前と本数は PR の runner の出力で示す）。baseline: 未実測（本 run は cargo を回さない。発注書の条件）。
- AC7（mutation）: 実装の後、`schema_v1.rs` の値を `'2555'` に戻すと 2557 日前が残る test が red、`log_manager.rs` の 0 と読めない値の分岐を外す（既定で消す）と読めない値・0 の test が red、`delete_old_logs` の `checked_sub_days` を `-` に戻すと大きな値の test が panic で red になる（Matrix の Mutation-style Adequacy Questions。実注入の結果を PR に書く）。
- AC8（生成物）: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0。
- AC9: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings` が exit 0。
- AC10: `bash scripts/check-workflow-git.sh` が exit 0。

実測（本 commit の前、2026-10-23。逐語で実行した。AC4〜AC9 は実装の後）:

```text
AC1  bash scripts/doc-consistency-check.sh   → 起票の前 exit=0、結果: WARN 12 件（ERROR なし）
AC3  baseline: git grep -n -E '<AC3 の式>' eed07d37 -- <AC3 の 6 file> → 10 行 / 本 commit の後: rg exit=1
AC4  baseline: src-tauri/src/db/schema_v1.rs:302 ('log_retention_days', '365', ...)
AC5  baseline: src-tauri/src/mnt/log_manager.rs:10 const DEFAULT_RETENTION_DAYS: u32 = 365;
```

## Design Readiness

- 引く設計正本（節まで）: 72 §72.4（手順 1〜7）・§72.5・§72.6、71 MNT-01-D3（読めない保持日数で消さない）、69 UI-11a-D1（保持日数を画面で変えない）、74 UI-11c-D10・D13・D14 と §74.6・Non-scope、tracking-system-tables §19 app_settings、DB_DESIGN の D-5、ARCHITECTURE の MNT-02、D-051（Retention）、D-123 (1)、22 §3.2 MNT-03-D11、REQ-902（`docs/spec/requirements.md`）、QR-06。
- 必要な設計成果物: Design artifact selection の「audit/log ... persistence behavior」の行 → DB_DESIGN と db-design（updated in this PR）、「New or changed ... MNT ... behavior」の行 → 72（updated in this PR、MNT-02-D1）、「Durable cross-cutting choice」の行 → decision-log D-136（updated in this PR）。
- plan にしかない durable な判断の昇格先: 無い（全て 72 MNT-02-D1 と D-136 に置いた）。
- 前提・制約と延期した gap: 店の 1 日の行数は未実測（導入の後に操作ログの件数で分かる。D-136 の Revisit）。延期しても安全な理由: 合成の 1 日 200 行の 7 年分で 210006016 byte、一覧は約 0.07 秒で、運用に障る大きさではない見込み（店の PC では測っていない）。
- 絶対保証の自己点検: 「7 年以上残る」は、設定が既定のまま（画面から変えない）で、DB と backup が残る限りに限って書いた。保持日数の内でも DB を失えば backup（3 日）と PC の外の控えの範囲だけが戻る。「消えない」（読めない値）は削除を飛ばす分岐だけを指し、他の削除の経路（無い。`operation_logs` の DELETE は `delete_old_logs` だけ。`rg -n "DELETE FROM operation_logs" src-tauri/src` で 1 か所）を含めて確かめた。
- 判定: ready。

## Contract Audit（新しく足す契約の文の境界の一巡）

| 観点 | 契約の文（72 MNT-02-D1、§72.4） | 確かめたこと |
|---|---|---|
| 安全な整数の範囲 | 「日付の範囲の外になる大きな値は、消す対象が無いとして 0 件」 | 値は `u32`（最大 4294967295）で読み、`chrono` の `NaiveDate` から引くと範囲の外で panic する（今の `date_naive() - Duration::days(..)`）。setup の中の panic は起動を止めるので、`checked_sub_days` の `None` を 0 件にする。`i64` の幅の問題は無い（`u32` → `Days`）。JavaScript の安全な整数の範囲は当たらない（wire に出ない） |
| 0 の表示 | 「0 のときは削除を飛ばす」 | 0 を受けると cutoff が今日の 0 時になり、今日より前の全ての記録を消す。0 は既定（2557）とも「消さない」とも区別して、読めない値と同じく飛ばす。負の値は `u32` で読めないので同じ分岐 |
| 失敗の時点と順序 | 「削除も日付の更新もせず Ok(()) を返す」 | 飛ばすときは `log_last_cleanup_date` を更新しないので、同じ日の次の起動でも同じ判断になる（設定を直せば次の起動で掃除する）。DB の読取りの失敗は今のまま `Err` で返り、呼び出し元が warn して起動を続ける（§72.4 のエラーハンドリング）。削除と `log_cleanup` の記録と日付の更新の順は変えない |
| 単位や種類の混在 | 「既定は 2557 日」 | 単位は日で、年を持たない（7 年をどの 7 年にも足りる日数に直した）。cutoff は今日から日数を引いた日の 0 時（ローカル時刻）で、`created_at` の文字列と比べる今の形を変えない。設定は TEXT で、数は文字列 `'2557'` |

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| REQ / coverage の追加・変更 | `cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成 | REQ-902 の test を足すので再生成する（Scope の生成物、AC8） |

ほかの行（Tauri command、function-design doc 新設、route、operator 画面、source / workflow doc 新設）は該当なし。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | 外部の adapter と app-core の境 | — | 不該当: 外部の系に触れない | なし |
| Fact check / design decision split | 観測した事実とアプリの判断の分け | Contract Probe、D-136 | 当たる: 大きさは合成の測定（事実）、店の行数は未実測、保持の長さは owner の決定 | D-136 の Revisit |
| Lifecycle / retry | 前・中・後・失敗の後 | 72 §72.4、Contract Audit | 当たる: 読めない値で飛ばし、日付を更新しないので次の起動で同じ判断。設定を直せば戻る | なし |
| Operator workflow | 実際の順序 | — | 不該当: 店の操作は変わらない（起動するだけ） | なし |
| Replacement path | 外部の系が変わったとき | — | 不該当 | なし |
| Data safety / evidence | 店のデータを repo に入れない | Data Safety | 当たる: 測定は合成のデータだけ（scratch の DB、commit しない） | なし |
| Reporting / accounting semantics | 集計の意味 | — | 不該当: 集計に触れない | なし |
| Manual verification | 自動 test で示せない主張 | Risk の L3 の段 | 当たる（L3 無し）: 全て自動 test で示せる | なし |
| 環境・再現性 | 新しい環境依存の pin | — | 不該当: 新しい依存を足さない（`chrono` の `Days` は既存の依存） | なし |

## Boundary / Wire Contract

- producer: `schema_v1.rs` の初期データ（DB を作るとき）。画面と command からは書かない
- consumer: `cleanup_old_logs`（起動時）。`get_settings` は全ての key を返すが、frontend は `log_retention_days` を読まない（`rg -n log_retention src` で hit 無し）
- wire type: 変えない（`app_settings.value` は TEXT）
- internal type: `u32` の日数（今と同じ）
- precision/range: 1〜`u32` の最大。0 と読めない値は飛ばす。日付の範囲の外は 0 件
- round-trip path: 該当なし
- invalid input: 数でない・負・0 → 飛ばす（warn）
- compatibility: 既にある開発・試験 DB の値（365）はそのまま働く。前の版のアプリは同じ DB を今と同じく扱う（migration を足さないので DB の版は変わらない）

## Test Plan

Test Design Matrix: [2026-10-23-oplog-retention](test-matrices/2026-10-23-oplog-retention.md)。

- targeted tests: `cd src-tauri && cargo test --lib log_manager`、`cd src-tauri && cargo test --lib system_repo`。
- negative tests: 読めない値・0・大きな値（Scope の「足す」）。
- compatibility checks: 設定の行が無い DB（既定）、既にある DB の値を変えないこと（migration が無いこと: `rg -n "log_retention_days" src-tauri/src/db/schema_v*.rs` が `schema_v1.rs` の 1 行だけ）。
- data safety checks: 合成のデータだけ。
- main wiring/integration checks: `lib.rs` の `run` の setup が `cleanup_old_logs` を呼ぶ形を変えない（既存の起動の test）。

## Review Focus

- 72 MNT-02-D1 と D-136 が 71 MNT-01-D3 と同じ形で、読めない値・0 で消さず、`log_last_cleanup_date` を更新しない順が正しいか。設定の行が無いときだけ既定を使う形の当否。
- migration を足さない判断（D-136 (4)）と、`schema_v1.rs` の初期データを直す形の当否（D-123 (1)。リリースの前に v1 の初期データを直す先例は #192 が backlog に足す部門 12 の後続の lane）。
- 既存の test の直し（Scope の「直す」）が期待を変えずに値の境だけを直しているか。弱めていないか。
- この変更で不要になる記述・条件・code が他に無いか（Scope の D-127 の段）。
- owner の判断事項（owner の方針 TD-401 のとおり、推奨を既定にして書き進めた）:
  - K1 保持の長さ: a 2557 日（どの 7 年にも足りる）/ b 2555 日（365 × 7）/ c 消さない（掃除を外す）。推奨 a（candidate: TD-348 の「7 年程度」を必ず満たす最小の日数。c は D-127 の素直な形だが DB と backup の大きさに上限が無くなり、owner は 7 年程度と決めた）。変わる所: `schema_v1.rs` の初期データと `DEFAULT_RETENTION_DAYS` の値、72 MNT-02-D1・D-136・DB_DESIGN の D-5・tracking の初期データ例・ARCHITECTURE・REQ-700 の日数、Scope の test の境の日数（c なら `cleanup_old_logs` と起動の呼出しを外す別の形になり、Scope を作り直す）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| MNT-02-D1（既定 2557 日、設定の行が無いときも 2557 日） | 72 §72.4 の手順 3、MNT-02-D1、tracking §19、DB_DESIGN の D-5、D-136 (1) | `schema_v1.rs` の初期データ、`log_manager.rs` の `DEFAULT_RETENTION_DAYS` | 直す `test_cleanup_old_logs_req902_deletes_expired`・`test_cleanup_old_logs_req902_keeps_recent`、足す「新しい DB の値」「設定の行が無い DB」 | 非対象 |
| MNT-02-D1（読めない値・0 で消さず、日付を更新しない） | 72 §72.4 の手順 3、MNT-02-D1、D-136 (2) | `log_manager.rs` の `cleanup_old_logs` | 足す「読めない値・0」 | 非対象 |
| MNT-02-D1（日付の範囲の外は 0 件、panic しない） | 72 §72.4 の手順 4、D-136 (2) | `system_repo.rs` の `delete_old_logs` | 足す「大きな値」（`cleanup_old_logs` と `delete_old_logs`） | 非対象 |
| §72.4 の 1 日 1 回・`log_cleanup` の記録・日付の更新（変えない） | 72 §72.4 の手順 1・2・5・6 | 変えない | 既存 `test_cleanup_old_logs_req902_same_day_skip`・`test_cleanup_old_logs_req902_records_cleanup`・`test_cleanup_old_logs_req902_updates_date`・`test_cleanup_old_logs_req902_first_run`（古いログの日付だけを直す） | 非対象 |
| `delete_old_logs` の cutoff（今日から日数を引いた日の 0 時より前を消す。変えない） | 72 §72.1（system_repo の §2.8 拡張の `delete_old_logs`） | `system_repo.rs`（求め方を checked にするだけ） | 既存 `test_delete_old_logs_req902_*` 2 本（引数 365 のまま） | 非対象 |
| §72.5 の起動の順と、失敗を warn して起動を続けること（変えない） | 72 §72.5 | 変えない | 既存の起動の test | 非対象 |
| 保持日数を画面で変えない（変えない） | 69 UI-11a-D1 | 変えない | 非対象 | 非対象 |
| 隣接の除外: backup の保持日数と MNT-01-D3 | 71 §71.5・MNT-01-D3 | 変えない（形だけを借りる） | 既存 | 非対象 |
| 隣接の除外: D-051 の `integrity_fix` の監査の痕跡（同じ TX、ログに残す） | D-051、36 BIZ-07-D3、74 UI-11c-D14 | 変えない（残る期間だけが延びる。D-051 の Superseded in part の行） | 既存 | 非対象 |
| 隣接の除外: migration の版と前の版の拒否 | 22 §3.2 MNT-03-D11 | migration を足さない | 非対象 | 非対象 |

## Contract Probe

R3 の Contract Probe は外部の前提に頼る計画で Plan Gate の前に最小の実験を求める。本 lane の前提で外部のものは 2 つで、どちらも本 run で確かめた。

- P1 7 年分の操作ログの大きさと一覧の速さ: 合成の DB（`operation_logs` は `schema_v1.rs` と同じ定義、index 無し）に 1 日 200 行 × 2557 日 = 511400 行（summary は日本語 40 字、detail_json は約 300 byte）を入れ、`sqlite3 "$TMPDIR/oplog-size.db" < oplog-size.sql`（scratch の script、commit しない）→ 結果（2026-10-23、開発用の PC の WSL、sqlite3 3.51.3）: `rows|511400`、`bytes|210006016`、1 か月の範囲の `COUNT(*)` が `Run Time: real 0.072777`、同じ範囲の `ORDER BY created_at DESC, id DESC LIMIT 50 OFFSET 0` が `Run Time: real 0.067429`。`VACUUM INTO`（backup の作り方、71 §71.4）が `Run Time: real 0.461897` で写しは 210006016 byte。店の PC と店の 1 日の行数では測っていない（未実測）。
- P2 `chrono` の `NaiveDate` から範囲の外の日数を引くと panic し、`checked_sub_days` は `None` を返す: 実装の test（Scope の「大きな値」）で確かめる → 未実施（本 run は cargo を回さない）。外れても、`u32` の最大で `checked_sub_days` が `Some` を返すなら消す対象が無い（2557 日より古い記録しか消さないのと同じ向き）。

## Data Safety

- commit しない: 合成の測定の DB と script（scratch に置き、測った後に消した）。店の DB・backup・ログ。
- local-only: 無い。
- 試験用だけ: 測定と test は合成のデータだけ。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
