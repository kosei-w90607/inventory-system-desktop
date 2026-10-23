# Test Design Matrix: 操作ログの保持を 7 年程度に延ばす

oracle の正本は [72](../../function-design/72-mnt-log-manager.md) MNT-02-D1 と §72.4 の手順 3・4、[decision-log](../../decision-log.md) D-136。期待の値（2557、0 と読めない値で飛ばす、範囲の外で 0 件）は正本から写し、実装の定数から写さない。test は全て `src-tauri/src/mnt/log_manager.rs` と `src-tauri/src/db/system_repo.rs` の `mod tests`（`setup_test_db` は `db::init_database` で v1 から最新の版までを当てた本物の DB を使い、mock は無い）。

## Risk

Risk: R3

## Contracts Under Test

- C1 新しい DB の `log_retention_days` は `'2557'`（MNT-02-D1、D-136 (1)、`schema_v1.rs` の初期データ）
- C2 保持日数が 2557 日のとき、今日から 2557 日前の記録は残り、2558 日前の記録は消える（§72.4 の手順 4 の cutoff は今日から日数を引いた日の 0 時）
- C3 設定の行が無いときは 2557 日で消す（§72.4 の手順 3 の `None`）
- C4 設定の値が整数として読めない（`"abc"`・`"-1"`）か 0 のときは、何も消さず、`log_last_cleanup_date` も更新しない（§72.4 の手順 3、MNT-02-D1）
- C5 日付の範囲の外になる値（`"4294967295"`）では panic せず、何も消さない（§72.4 の手順 4）
- C6 1 日 1 回・`log_cleanup` の記録・日付の更新（変えない。§72.4 の手順 1・2・5・6）

## Failure Modes

- FM1: 初期データが 365 のまま（または 2555）で、7 年に足りずに記録が消える（C1・C2）
- FM2: cutoff の境が 1 日ずれ、2557 日前の記録を消す（C2）
- FM3: 設定の行が無い DB で旧い既定（365）で消す（C3）
- FM4: 読めない値・0 を既定へ置き換えて消す、または 0 で今日より前の全てを消す（C4）
- FM5: 飛ばしたのに `log_last_cleanup_date` を更新し、同じ日に直した設定が次の起動まで効かない、または飛ばしたことが記録に残らない（C4）
- FM6: 大きな値で `NaiveDate` の引き算が panic し、setup の中で起動が止まる（C5）
- FM7: 直した test が値の境を外し、何も確かめなくなる（C2、mutation で見る）

## Test Matrix

- 既存の test の名前は 2026-10-23 に `rg -n 'fn test_cleanup_old_logs_req902_|fn test_delete_old_logs_req902_' src-tauri/src` で実在を確かめた。新しい test の名前は実装で決め、下の「足す」の行に対応させる。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | FM1 | unit（本物の DB） | 足す: 新しい DB の `log_retention_days` が `"2557"`（`system_repo::get_setting`） | `schema_v1.rs` の初期データが `'365'`・`'2555'` のまま |
| C2 | FM1・FM2・FM7 | unit | 直す: `test_cleanup_old_logs_req902_keeps_recent`（今日から 2557 日前の 10:00 の記録が残る） | 初期データか cutoff が 2557 日より短い（2556 以下）、cutoff が 1 日早い |
| C2 | FM2・FM7 | unit | 直す: `test_cleanup_old_logs_req902_deletes_expired`（2558 日前の 10:00 の記録が消える） | 初期データか cutoff が 2558 日以上、掃除が何も消さない |
| C3 | FM3 | unit | 足す: 設定の行を DELETE した DB で 2558 日前が消え、2557 日前が残る | `DEFAULT_RETENTION_DAYS` が 2557 でない |
| C4 | FM4・FM5 | unit（値ごとの 3 case: `"abc"`・`"-1"`・`"0"`） | 足す: 値を UPDATE した DB で、今日から 2558 日前と 1 日前の記録が両方残り、`log_last_cleanup_date` が呼ぶ前と同じ（無い）で、`log_cleanup` の記録が無い | 読めない値・0 を既定か 0 のまま使って消す、飛ばしたのに日付を更新する |
| C5 | FM6 | unit | 足す: 値が `"4294967295"` の DB で `cleanup_old_logs` が `Ok(())` を返し、2558 日前の記録が残る | `NaiveDate - Duration` の panic、範囲の外を別の日付に丸めて消す |
| C5 | FM6 | unit | 足す: `delete_old_logs(&conn, u32::MAX)` が `Ok(0)` を返し、2558 日前の記録が残る | 同上（`system_repo` の側だけで確かめる） |
| C6 | — | unit（既存、古いログの日付を 2558 日前の相対に直す） | `test_cleanup_old_logs_req902_first_run`・`test_cleanup_old_logs_req902_same_day_skip`・`test_cleanup_old_logs_req902_records_cleanup`、既存 `test_cleanup_old_logs_req902_updates_date` | 1 日 1 回・記録・日付の更新が壊れる（期待は変えない） |
| C6 | — | unit（既存、変えない） | `test_delete_old_logs_req902_*` 2 本（引数 365） | `delete_old_logs` の cutoff の比べ方が変わる |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `log_last_cleanup_date` と操作ログ | 行が無い（新しい DB）か前の日 | 起動の setup | 2557 日より前を消し、`log_cleanup` を記録し、今日にする | — | — | 同じ日の 2 回目の起動は飛ばす（C6） | 次の日の起動でもう一度 | 読めない値・0・範囲の外 → 消さず、日付を変えない（C4・C5） | 設定を直した後の起動で掃除する（C4 の日付が変わらないこと） | Test Matrix の C4〜C6 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 読めない保持日数で消さない（71 MNT-01-D3） | `src-tauri/src/mnt/backup.rs` の保持日数の読取り（parse の失敗で cleanup を飛ばす） | `log_manager.rs` の `cleanup_old_logs` | backup の側の 0 の扱い（受ける）は変えない（backup の保持は画面で選ぶ値で、本 lane の範囲の外） | C4 |
| 日付の引き算 | `rg -n "Duration::days" src-tauri/src --type rust` の production の箇所のうち、設定の値を引くのは `delete_old_logs` と `cleanup_old_logs` の summary の日付 | `delete_old_logs`（checked）。summary の日付は削除が 1 件以上のときだけ求め、そのときは引ける日付 | 他の `Duration::days` は定数か範囲を確かめた値（本 lane の範囲の外） | C5 |

## Negative Paths

- missing input: 設定の行が無い → 既定（C3）
- invalid input: `"abc"`・`"-1"` → 飛ばす（C4）
- duplicate/ambiguous input: 該当なし（key は PK）
- unknown reference: 該当なし
- dependency missing: DB の読取りの失敗 → `Err`（今のまま。呼び出し元が warn）
- permission/write failure: DELETE の失敗 → `Err`（今のまま）
- dry-run side effect: 飛ばすときは DB を変えない（C4）

## Boundary Checks

- threshold: 2557 日前は残る・2558 日前は消える（C2）
- null/default: 行が無い → 2557（C3）
- empty/non-empty: 空文字 → 読めない値と同じく飛ばす（`u32` の parse の失敗）
- min/max: 0 → 飛ばす、1 → 掃除する（既存の形）、`u32::MAX` → 0 件（C5）
- status/policy enum: 該当なし
- wire type: 変えない
- internal type: `u32`
- producer/consumer: `schema_v1.rs` → `cleanup_old_logs`
- round-trip token: 該当なし
- precision/range: 日の単位
- cross-language parse: 該当なし（frontend は読まない）

## Compatibility Checks

- old schema/input: 既にある開発・試験 DB の `'365'` はそのまま働く（既存 `test_delete_old_logs_req902_*` の引数 365 と同じ式）
- new schema/input: 新しい DB は `'2557'`（C1）
- output order: 該当なし
- optional field behavior: 行が無い DB（C3）

## Data Safety Checks

- source-derived data: 無い（合成だけ）
- generated outputs: `docs/function-design/90-traceability.md`（再生成）
- secrets: 該当なし
- local-only files: 大きさの測定の scratch の DB（commit しない）
- synthetic sample boundaries: test の記録は `insert_log_with_date` の合成の行

## Main Wiring / Integration Checks

- helper connected to main path: `src-tauri/src/lib.rs` の `run` の setup が `cleanup_old_logs` を呼ぶ（変えない）
- output reaches manifest/report: 該当なし
- effective config reaches runtime: 初期データの値が `cleanup_old_logs` に届く（C1 と C2 を同じ `setup_test_db` の DB で見る）
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

実装の後に実注入して red を確かめ、結果を PR に書く（packet の AC7）。

- 初期データを `'2555'` に戻すと C2 の 2557 日前が残る test が red。`'2558'` にすると C2 の 2558 日前が消える test が red。
- `DEFAULT_RETENTION_DAYS` を 365 に戻すと C3 が red。
- 0 と読めない値の分岐を外して既定で掃除すると C4 が red（2558 日前が消える）。分岐で日付を更新すると C4 の日付の assert が red。
- `delete_old_logs` の `checked_sub_days` を `- Duration::days` に戻すと C5 の 2 本が panic で red。
- 期待が空集合だけの case は無い（C4・C5 は「残る」記録を 1 件以上置き、C2・C3 は消える 1 件と残る 1 件の組）。

## Residual Test Gaps

- 店の PC での 7 年分の大きさと一覧の速さは測っていない（合成の測定は packet の Contract Probe P1）。
- 起動の setup の中の panic が起動を止めることの end-to-end の test は足さない（C5 は関数の単位で panic しないことを確かめ、setup は既存の起動の test が通る）。
