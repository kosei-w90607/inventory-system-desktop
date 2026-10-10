## 3. MNT-03: スキーママイグレーション

### 3.1 モジュール構成

```
src-tauri/src/
  db/
    migration.rs  -- マイグレーション管理
    schema_v1.rs  -- 初期スキーマ
    schema_v2.rs  -- 冪等性カラム追加（4テーブル再作成）
    schema_v3.rs  -- PLU対象フラグ追加
    schema_v4.rs  -- 日報取込みテーブル追加
    schema_v5.rs  -- PLU slot 永続割当テーブル追加
    schema_v6.rs  -- suppliers.updated_at 追加
    schema_v7.rs  -- 日報の個数を100倍の整数へ（quantity → quantity_hundredths）
```

### 3.2 migrate

**関数要求**: schema_versionsテーブルを確認し、未適用のマイグレーションを順番に実行する

**シグネチャ**:
```
fn migrate(conn: &DbConnection) -> Result<(), DbError>
```

**処理ステップ**:
1. 渡された同じ接続で、DDL を発行せずに版を読む（MNT-03-D11）: schema_versionsテーブルの存在チェック（SELECT EXISTS(SELECT 1 FROM sqlite_master WHERE type='table' AND name='schema_versions')）。存在しない → current_version = 0。存在する → SELECT MAX(version) FROM schema_versions → current_version（NULLなら0）。存在確認・読取りのその他の失敗 → DbError::MigrationFailed（版 0 に倒さない）
2. current_version をコード内のマイグレーションリストの最大 version（app_max。リストから導き、数値を別に書かない）と比べ、current_version > app_max → DbError::SchemaNewerThanApp { db_version: current_version, app_max } を返す。DDL もどの migration も始めない（MNT-03-D11）
3. schema_versionsテーブルを確保（CREATE TABLE IF NOT EXISTS）
4. コード内のマイグレーションリスト（MIGRATIONS定数）からcurrent_versionより大きいものを取得
5. 各マイグレーションについて順番に:
   a. BEGIN
   b. SQLを実行
   c. INSERT INTO schema_versions (version, applied_at) VALUES (?, 現在日時)
   d. COMMIT
   e. いずれかのステップで失敗 → ROLLBACK → DbError::MigrationFailed(詳細)を返す（詳細にはバージョン番号と失敗SQLの概要を含める）
6. 全て成功 → Ok(())

**エラーハンドリング**:
- DB の版がアプリの最大より新しい → DbError::SchemaNewerThanApp（step 2、論理的な書込みの前。MNT-03-D11）
- 版の読取り失敗（schema_versions が無い場合を除く）→ DbError::MigrationFailed
- 個々のマイグレーションSQL失敗 → そのバージョンのROLLBACK。それ以降は実行しない
- エラーメッセージにはバージョン番号と失敗したSQLの概要を含める
- ROLLBACK 自体が失敗した場合の契約は **MNT-03-D1**（下記）に従う。`conn.execute_batch("ROLLBACK;").ok()` のような失敗の無言破棄は禁止

**MNT-03-D1: ROLLBACK / COMMIT 失敗の記録と併合**

- 決定: SQL 実行・バージョン記録・FK 検査の失敗後に実行する ROLLBACK が自身も失敗した場合、(1) `tracing::error!` で記録し、(2) 返す `DbError::MigrationFailed` のメッセージへ元エラーと ROLLBACK エラーを併合し、「transaction 状態不明」であることを明示する（例: `v{n} SQL実行失敗: {e}（ROLLBACK も失敗: {e2}、transaction 状態不明）`）。migration.rs / schema_v2.rs / schema_v3.rs（以降の schema_vN も同様）の全 ROLLBACK 箇所に共通ヘルパーで適用し、個別再実装をしない
- **COMMIT 失敗も本契約の対象とする（PR #14 Codex P2-3）**: SQLite は SQLITE_BUSY での COMMIT 失敗時に transaction を active のまま残す。COMMIT の Err を直接返す現行実装は transaction/lock 状態不明のままエラーを返す。契約: COMMIT 失敗時は `Connection::is_autocommit()` で transaction 状態を確認し、transaction 中なら ROLLBACK を試行して結果を上記の併合規則で報告する
- **PRAGMA foreign_keys 復元との関係**: `PRAGMA foreign_keys` は transaction 中は no-op のため、v2 の復元保証（scopeguard）は transaction が閉じた後にのみ有効。COMMIT 失敗で transaction が残ったまま復元 PRAGMA を実行しても効かない — 上記の状態確認 + ROLLBACK が復元保証の前提条件であることを明記する。復元は `is_autocommit()` で transaction が閉じたことを確認してから実行し、**`PRAGMA foreign_keys` の再読取で復元後の値が元値と一致することを検証する** — transaction 中の PRAGMA は成功を返しつつ no-op になり得るため、実行結果の記録だけでは復元を確認できない（PR #14 Codex 再レビュー P2）。transaction を閉じられない（ROLLBACK も失敗した）場合は復元を試みず、**接続の破棄を必須とする**構造化された致命エラーとして返す。復元 PRAGMA・再読取の失敗も本契約の記録対象とし、無言で握りつぶさない（現行実装は inner Err 時の復元失敗を無記録で通す）
- Why: ROLLBACK 失敗を `.ok()` で破棄すると、呼び出し元は transaction が閉じたと誤認する。接続が transaction 中または lock 保持のままなら後続処理が二次エラーを出し、最初の応答だけでは復旧不能状態を診断できない（監査 P3-1 系列の P3-3）。`.claude/rules/implementation-quality.md` の Result 握りつぶし禁止の適用でもある
- Rejected alternatives: ROLLBACK 失敗時の自動再試行（lock 起因では悪化するだけで、migration は起動時実行のため再起動が最短復旧）/ ROLLBACK 失敗を独立エラーとして元エラーを差し替える（一次原因を隠す）
- 見直し契機: migration を起動時以外から呼ぶ経路（例: 実行中の restore 後再初期化）を追加するとき

**MNT-03-D11: アプリより新しい版の DB を論理的な書込みの前に拒否する（2026-09-25）**

- 決定: `migrate` は最初の処理として、渡された同じ接続で DDL を発行せずに版を読み（step 1）、`migrations()` の最大 version より新しければ `DbError::SchemaNewerThanApp { db_version, app_max }` を返す（step 2）。比較は DB に論理的な書込みをする処理（`schema_versions` の `CREATE TABLE IF NOT EXISTS` 等の DDL、migration の BEGIN、`schema_versions` の INSERT）よりも前に置く。`configure_database` の PRAGMA（`journal_mode = WAL` を含む）の順は変えず、読取りをその前へ動かさない
- 何を書かないか: DB の論理内容（表・行）・`schema_versions`・操作ログ・自動バックアップ。起動では操作ログの削除・起動時の自動バックアップ・復元後処理の補完が `prepare_database` の後にあるため、拒否すればどれも走らない。起こり得る物理的な書込みは SQLite の open / close によるもの（残った `-wal` の取込みと `-wal` / `-shm` の消去〈checkpoint〉と、rollback-journal mode の file〈`VACUUM INTO` で作った backup を復元した直後、legacy 移行の出力〉の `journal_mode` の header の書換え）で、どちらも論理内容を変えない
- 同じ接続で DDL の前に読む理由: 別の read-only 接続は DB file が無い初回起動で開けない。同じ接続なら `schema_versions` が無い DB を版 0 と読み、最新版まで migrate できる。`schema_versions` が無いときだけ版 0 とし、その他の読取り失敗を版 0 に倒さない（新しすぎる DB を空の DB と誤認して書き込まないため）
- 起動の文言: lib.rs は `SchemaNewerThanApp` だけを `StartupDatabaseError::SchemaNewerThanApp` へ写し、§12.4 の固有の文言で dialog を出して setup を Err で終える。`DatabaseInit` の「再起動してもう一度」は再起動で直らないため文言を分ける。他の init 失敗は `DatabaseInit` のまま
- 復元への波及: 復元は差し替えた file を `open_existing_database`（= `configure_database` → `migrate`）で開くため、新しすぎる版の backup は差し替え後の open で拒否され、既存の「開けなければ現在の DB に戻す」経路で `RestoreError::Recovered` になる（71 §71.7）。restore に版の事前検査は足さない（同じ判定の二重化）
- 回復: 新しい版のアプリを入れ直せば、拒否された DB はそのまま開ける（論理内容は不変）
- Why: 旧版のアプリが新しい DB に書くと、旧版の知らない列・表・制約を無視した書込みでデータを傷める。書込みの前に止めるのが最も安全
- Rejected alternatives: 読み取り専用で起動（画面ごとの書込み禁止が要り範囲が大きい）/ 警告して続行（書込みが起きる）/ 別の read-only 接続で先に版を読む（初回起動で開けない）
- 見直し契機: SQLite の版を上げて旧版の SQLite が読めない構文を使うとき（旧版では `sqlite_master` の読取りで失敗し `DatabaseInit` に落ちる）、または古い版のアプリで新しい DB を読む互換を設けるとき

### 3.3 get_initial_schema

**関数要求**: バージョン1の初期スキーマ（18テーブルのCREATE TABLE文）を返す

**シグネチャ**:
```
fn get_initial_schema() -> &'static str
```

**処理ステップ**:
1. DB_DESIGN.mdの全18テーブル定義に基づくCREATE TABLE文を文字列定数として返す
2. CHECK制約、INDEX、初期データINSERT（departments 21件、app_settings初期値）も含む

---

## 9. MNT-03 追加: migration v2（冪等性カラム）

migration v2 を schema_versions に追加。対象テーブル: receiving_records, return_records, manual_sales, disposal_records

**追加カラム（4テーブル共通）**:
- idempotency_key TEXT NOT NULL CHECK(length(idempotency_key) > 0)
- request_fingerprint TEXT NOT NULL CHECK(length(request_fingerprint) > 0)

**手順（テーブル再作成方式）**:
SQLite の UNIQUE は NULL を複数許容するため、ALTER TABLE ADD COLUMN（NULLABLE）では冪等性保証が破綻する。テーブル再作成で NOT NULL を正しく担保する。

```
PRAGMA foreign_keys = OFF
BEGIN
  -- 4テーブルそれぞれについて:
  1. CREATE TABLE {table}_new（完全DDL: 列順・CHECK・DEFAULT・FK を全て明示。省略禁止）
  2. INSERT INTO {table}_new (列一覧) SELECT (列一覧), '__legacy__:' || id, '__legacy__' FROM {table}
     - SELECT * 禁止。列マッピングを明示
  3. DROP TABLE {table}
  4. ALTER TABLE {table}_new RENAME TO {table}
  5. CREATE UNIQUE INDEX idx_{table}_idempotency ON {table}(idempotency_key)

  -- 全4テーブル完了後:
  PRAGMA foreign_key_check
  - 結果件数 > 0 → ROLLBACK → DbError::MigrationFailed で中断
  - （foreign_key_check は結果行を返すだけで自動failしないため、コード側で件数チェック必須）
COMMIT
PRAGMA foreign_keys = ON
```

**FK制御の理由**: foreign_keys=ON のまま DROP TABLE すると子テーブル参照が壊れるリスクがある

**foreign_keys=ON の復元保証**: COMMIT 後だけでなく、ROLLBACK やエラー時も PRAGMA foreign_keys=ON の復元を行う。ただし復元は MNT-03-D1（§3.2）の契約に従う: `is_autocommit()` で transaction が閉じたことを確認してから実行し、再読取で復元値を検証する。transaction を閉じられない場合は復元を試みず接続破棄必須の致命エラーとする — Drop トレイト / scopeguard で finally 相当を実装する場合も、この is_autocommit ゲートと検証を省略した無条件実行にしてはならない（transaction 中の PRAGMA は成功を返す no-op になり得るため）

**完全DDLの構築**: 各テーブルの DDL は schema_v1.rs の定義 + 新カラム2列で構築する。実装時に schema_v1.rs と不整合がないことを確認する

## 10. MNT-03 追加: migration v3（plu_target カラム）

migration v3 を schema_versions に追加。対象テーブル: products（D-028 JANなし商品のPLU対象扱い）

**追加カラム**:
- plu_target BOOLEAN NOT NULL DEFAULT 0

**手順（ALTER TABLE 方式）**:
v2 がテーブル再作成を要した理由（UNIQUE NOT NULL は ALTER TABLE ADD COLUMN で担保できない）は plu_target に該当しない。UNIQUE 制約のない NOT NULL DEFAULT 付きカラムは ALTER TABLE で追加できる。

```
BEGIN
  1. ALTER TABLE products ADD COLUMN plu_target BOOLEAN NOT NULL DEFAULT 0
  2. backfill 更新文を実行:
     - is_discontinued=0 かつ jan_code が 13 桁数字の行 → plu_target=1
     - 13 桁数字の条件: `jan_code IS NOT NULL AND length(jan_code) = 13 AND jan_code NOT GLOB '*[^0-9]*'`（sqlite3 実機で検証済み: 有効13桁JAN=1、独自コード/英字混在/12桁=0）
     - それ以外（jan_code NULL / 13桁数字でない / 廃番）→ DEFAULT 0 のまま
  3. schema_versions に v3 を INSERT
COMMIT
```

**backfill の判定範囲**: JAN/EAN-13 チェックディジット検証は SQL で行わない。チェックディジット不正は BIZ-04 prepare の「要修正」バケット（PluExcludedReason::InvalidCheckDigit）がアプリ側で捕捉する。

**廃番商品の扱い**: backfill は廃番商品を plu_target=0 にする（レジ登録対象に戻さない）。廃番切替時に plu_target を自動で 0 にするかは、スロット解放と不可分のため PLUスロット永続割当の設計（Plans.md backlog）で決める。

## 11. MNT-03 追加: migration v4（日報取込みテーブル）

migration v4 を schema_versions に追加。対象は REQ-401 の Z001 / Z002 / Z005 日報取込み用新規テーブル 4 件。テーブル定義の正本は [../db-design/pos-tables.md](../db-design/pos-tables.md) §12b〜§12e とし、本節は migration 固有の適用方式・登録順・復旧方針を記録する。

**追加テーブル / CHECK制約 / index**:

| テーブル | CHECK制約 | index |
|---|---|---|
| daily_report_imports | `source_adapter IN ('casio_sr_s4000')`, `status IN ('completed','rolled_back')` | `idx_daily_report_imports_report_date` on `(report_date)`, `idx_daily_report_imports_bundle_hash` on `(bundle_hash)` |
| daily_report_summary_lines | `source_file IN ('Z001')` | `idx_daily_report_summary_lines_import_id` on `(daily_report_import_id)` |
| daily_report_payment_lines | `source_file IN ('Z002')` | `idx_daily_report_payment_lines_import_id` on `(daily_report_import_id)` |
| daily_report_department_lines | `source_file IN ('Z005')` | `idx_daily_report_department_lines_import_department` on `(daily_report_import_id, department_id)` |

各 line テーブルは `daily_report_import_id` で daily_report_imports を参照する。daily_report_department_lines の `department_id` は departments 参照で、DB design §12e の通り NULL を許容する。列定義や業務上の意味は db-design 側に集約し、ここでは重複記述しない。

**手順（新規 CREATE TABLE 方式）**:
v4 は既存テーブルを変更せず、`schema_v4::get_v4_daily_report_schema()` の SQL を `MigrationKind::Sql` として実行する。新規 `CREATE TABLE` 4 件と `CREATE INDEX` 5 件のみで、ALTER TABLE やテーブル再作成は伴わない。

v2 の判断基準では、既存データを保持したまま NOT NULL / UNIQUE 等の制約を後付けする場合にテーブル再作成が必要だった。v4 は既存行へ制約を追加せず、日報取込み用の空テーブルを追加するだけなので、v2 の foreign_keys OFF + 再作成パターンではなく通常の SQL migration で足りる。

```
BEGIN
  1. CREATE TABLE daily_report_imports
  2. CREATE TABLE daily_report_summary_lines
  3. CREATE TABLE daily_report_payment_lines
  4. CREATE TABLE daily_report_department_lines
  5. CREATE INDEX idx_daily_report_imports_report_date
  6. CREATE INDEX idx_daily_report_imports_bundle_hash
  7. CREATE INDEX idx_daily_report_summary_lines_import_id
  8. CREATE INDEX idx_daily_report_payment_lines_import_id
  9. CREATE INDEX idx_daily_report_department_lines_import_department
  10. schema_versions に v4 を INSERT
COMMIT
```

**MIGRATIONS 登録順**: `migration.rs` の migrations() は v1 → v2 → v3 → v4 の順に登録する。v4 の description は「日報取込みテーブル追加（daily_report_imports + lines）」で、kind は `MigrationKind::Sql(schema_v4::get_v4_daily_report_schema())`。v3 適用済みDBでは schema_versions の最大値が 3 から 4 へ進み、新規DBでは v1〜v4 が順に適用され schema_versions に4件記録される。

**backfill**: 不要。v4 は新規テーブルのみを追加し、既存の products / sale_records / inventory_movements / csv_imports 等を更新しない。日報取込みデータは migration 後の BIZ-08 commit で初めて daily_report_* テーブルに保存される。

**PRAGMA foreign_keys の扱い**: v4 は PRAGMA foreign_keys を変更しない。既存テーブルの DROP / RENAME を伴わないため、v2 のような OFF / foreign_key_check / ON 復元保証は不要。外部キー制約は接続側の通常設定に従い、migration SQL 内では daily_report_imports / departments への参照を定義するだけに留める。

## 12. MNT-03 追加: legacy path 移行（migrate_legacy_db）

旧実装が相対パス `inventory.db`（CWD）を使っていたため、起動時に CWD の旧 DB を `app_data_dir` 配下へ移行するフォールバック。従来この契約はコードコメント（PR #25 起源の「3ファイルセット」）にしか存在しなかったため、本節を正本とする（2026-07 監査 P3b-1 / P8b-3 起源）。

### 12.1 シグネチャ

```
fn migrate_legacy_db(
    old_dir: &std::path::Path,
    new_dir: &std::path::Path,
) -> Result<bool, std::io::Error>
```

戻り値: `Ok(true)` = 移行実行、`Ok(false)` = 移行不要（旧 DB 無し or 新 DB 既存）。シグネチャは現行と同一（`std::io::Error` に SQLite エラーを `std::io::Error::other` 相当で包む実装差し替えは可、実装 PR で決める）。

### 12.2 処理ステップ

1. `new_dir/inventory.db` の存在を確認。**既存なら `Ok(false)`**（この判定に旧 DB 側の情報は不要）。存在確認の metadata error はステップ 2 と同じく「無い」に潰さず `Err` として返す
2. 旧 DB の存在を確認する。**存在判定は metadata error を「無い」に潰さない**（`try_exists` 相当。error は `Err` として返す）。旧 DB が確実に無い → `Ok(false)`
3. 旧 DB を **create 能力なしで開く**（`SQLITE_OPEN_READ_WRITE` のみ、`SQLITE_OPEN_CREATE` を含めない `open_with_flags`。read-only にしないのは open 時の WAL recovery を SQLite に委ねるため、CREATE を外すのは存在確認後に旧 DB が消える TOCTOU で空の旧 DB を作らないため）。open 失敗 → `Err`
4. `VACUUM INTO '{new_dir}/inventory.db.migrating'` を実行（一時ファイル名。パスのシングルクォートは 71 §71.4 と同じ規約でエスケープ）
5. 旧 DB 接続を閉じる
6. `{new_dir}/inventory.db.migrating` → `{new_dir}/inventory.db` へ publish。**publish は no-clobber**: publish 直前に destination 不在を再確認し、既存 destination を置換しない手段を用いる。**実装 PR1 確定形**: 同一 directory の `std::fs::hard_link(staging, destination)` で destination 名を作成し、成功後に staging 名を unlink する（native Windows / Unix とも既存 destination は `AlreadyExists` で内容非置換。Rust std `rename` は採用しない）。destination が出現していた場合は一時ファイルを削除して `Err`（同時二重起動の直列化は single-instance ガードが担う — 71 §71.7 MNT-01-D5 の前提条件。no-clobber はガード障害時の defense-in-depth）
7. `Ok(true)` を返す。旧 3 ファイル（main/-wal/-shm）は削除しない（現行どおり手動削除の運用）

**呼び出し元の存在確認契約（PR #14 Codex P1-3）**: lib.rs は `std::env::current_dir()` の失敗を `if let Ok(cwd)` で無言 skip してはならない。ステップ 1 の「新 DB 既存 → skip」は CWD に依存しないため先に判定し、新 DB が無い場合の CWD 解決失敗・存在確認 error・その他の「旧 DB の有無を確定できない」状態はすべて `Err` として MNT-03-D4（fail-closed 起動中止）へ流す。「旧 DB が無い」と「有無を確認できない」を同じ skip に潰すと、P3b-1 の空 DB 隠蔽経路が discovery failure の形で残る

**MNT-03-D2: VACUUM INTO 方式の採用**

- 決定: 3 ファイル（main / -wal / -shm）の個別 file copy を廃止し、旧 DB を開いて `VACUUM INTO` で単一完全ファイルを生成する方式にする。WAL に残る commit 済み変更の取込みが SQLite の保証になる
- Why: 個別 copy 方式は「本体成功 + WAL 失敗」の部分状態を作り得る。WAL にのみ存在する commit 済み在庫・売上更新を欠いた DB が起動対象になり、新 DB 本体が既存になるため次回起動も移行を skip し欠落を自動回復できない（P3b-1）。WAL/SHM の意味論を自前で守る必要をなくすのが最短の構造的解決で、`VACUUM INTO` は 71 §71.4 create_backup で確立済みの慣用
- Rejected alternatives: 3 ファイル copy + WAL 失敗を致命扱い + 失敗時の部分削除（可能だが、SHM の要否・copy 順序・live WAL の整合など自前で守る意味論が残り続ける）
- 見直し契機: 旧 DB が SQLite として open 不能な破損個体への移行要求が実際に発生したとき（その場合 copy でも結局 init_database で開けないため、現時点では想定しない）

**MNT-03-D3: 「完成品しか存在しない」不変条件**

- 決定: `new_dir` の `inventory.db` は完成した移行結果としてのみ出現する。生成は一時名（`.migrating` 接尾辞）で行い、成功時のみ no-clobber publish（hard-link 作成 → staging unlink）する。publish/link までのステップ 3〜6 のいずれかが失敗した場合は一時ファイルを削除して `Err` を返し、部分状態を残さない（次回起動で再試行可能）
- Why: 部分状態が最終名で残ると、次回起動の「新 DB 既存 → skip」判定が部分 DB を正当な移行結果として確定してしまう（P3b-1 の恒久 skip 経路）。一時ファイルの削除自体が失敗した場合は `.migrating` のまま残り、最終名判定に影響しない
- Rejected alternatives: 最終名へ直接生成 + 失敗時削除（削除自体の失敗で部分 DB が最終名に残る窓が閉じない）

### 12.3 エラーハンドリング

- 旧 DB open 失敗 / VACUUM INTO 失敗 / publish/link 失敗 → 一時ファイルを削除（削除失敗は `tracing::warn!` 記録）して `Err`
- publish/link 成功後の staging unlink 失敗も `Err`（fail-closed）を返す。最終名は完成済み snapshot のため保持し、次回起動は「新 DB 既存 → 移行 skip」で通常起動する
- `Err` 時の呼び出し元（lib.rs）の挙動は **MNT-03-D4** に従う

### 12.4 lib.rs 起動契約（MNT-03-D4）

- 決定: lib.rs setup hook は `migrate_legacy_db` の `Err` で起動を中止する（fail-closed）。中止時は operator へ可視のエラーダイアログで「旧データは無事であること・アプリ再起動で再試行されること・繰り返し失敗する場合の連絡誘導」を表示し、**表示完了（または表示不能の確定）後にのみ**終了する。詳細は診断ログに記録する
- **表示機構の制約（PR #14 Codex P2-2）**: `tauri_plugin_dialog` の `blocking_show` は公式 API doc が「main thread context で使用してはならない」と明記しており（vendored source lib.rs:355-356 で確認済み）、setup hook（main thread）での同期表示を機構として指定しない。**実装 PR1 確定形**: Windows は専用 worker thread で Win32 `MessageBoxW` を表示し、setup thread が `join` で表示完了を待ってから `Err` を返す。Contract Probe の native pre-window 表示で可視性を確認済み。thread panic / API 表示不能時も診断ログを残して fail-closed 起動中止を維持する（`blocking_show` worker は main-thread dispatch との相互待ち、callback は pre-window 可視化不能のため不採用）
- Why: 現行の「`tracing::error!` + 続行」は、直後の `init_database` が新パスに**空 DB を新規作成**するため、以後の起動は「新 DB 既存」で移行を永久 skip し、旧データが空 DB に隠蔽される（operator にはデータ全損に見え、空 DB への誤入力も進行する）。可視の起動失敗（データ無傷 + 再試行可能）の方が安全側
- Rejected alternatives: 現行の「警告して続行」（上記の隠蔽経路そのもの）/ 移行 skip して旧パスの DB をそのまま使う（パス二重管理が恒久化し、app_data 移行の目的に反する）

MNT-03-D4 の fail-closed + `show_pre_window_fatal`（Windows は `MessageBoxW` worker thread + `join`、非 Windows は既存の `eprintln!` fallback）を、release build で operator から見えなかった起動失敗へ次のとおり拡張する。

| 22 側 decision ID | Plan Packet | 契約 |
|---|---|---|
| MNT-03-D5 | SPEC-SFV-D1 | `app_data_dir` 取得・保存場所作成・`DatabaseInit`・Tauri `.run()` の各失敗は、固有の operator 文言と raw detail を dialog 表示してから Err 伝搬または非 0 終了する。`.run().expect(...)` は使用しない |
| MNT-03-D6 | SPEC-SFV-D2 | 診断ログ初期化前の `app_data_dir` 取得 / 保存場所作成失敗は dialog のみを許容し、ログ初期化の再試行を行わない。当該文言に診断ログ誘導を含めない |
| MNT-03-D7 | SPEC-SFV-D3 | `StartupDatabaseError::DatabaseInit` は具体的な operator 文言を `Some` で返す。`operator_message()` の `Option<String>` signature と将来 variant 用の defensive fallback は維持する |
| MNT-03-D8 | SPEC-SFV-D4 | `.run()` Err 後の dialog 経路を Windows L3 で確認できる debug 限定 hook を設ける。`INVENTORY_SIMULATE_RUN_FAILURE=1` は plugin setup を失敗させて実際の `.run()` Result を Err にし、handler の直接呼出しで代替しない。hook は `#[cfg(debug_assertions)]` により release から排除する |

operator 文言の固定部は次のとおりで、いずれも末尾に改行と raw error detail（`\n{details}`）を付ける。

| 失敗区分 | 固定部 |
|---|---|
| `app_data_dir` | アプリのデータ保存場所を確認できなかったため、起動を中止しました。パソコンを再起動してもう一度お試しください。繰り返し失敗する場合は管理者へ連絡してください。 |
| 保存場所作成 | アプリのデータ保存場所を作成できなかったため、起動を中止しました。ディスクの空き容量を確認し、パソコンを再起動してもう一度お試しください。繰り返し失敗する場合は管理者へ連絡してください。 |
| `DatabaseInit` | データベースの準備に失敗したため、起動を中止しました。アプリを再起動してもう一度お試しください。繰り返し失敗する場合は診断ログ（アプリのデータフォルダ内）を添えて管理者へ連絡してください。 |
| `SchemaNewerThanApp`（MNT-03-D11） | このデータは、より新しい版のアプリで使われています。この版のアプリで書き込むとデータを傷めるおそれがあるため、起動を中止しました（データは変更していません）。新しい版のアプリを入れ直してから起動してください。わからない場合は管理者へ連絡してください。 |
| `.run()` | アプリを起動できませんでした。アプリを再起動してもう一度お試しください。繰り返し失敗する場合は管理者へ連絡してください。 |

- 正常起動では fatal 文言生成・dialog 表示を呼ばない。既存 RestoreReconcile / LegacyMigration の MNT-03-D4 文言と順序は変更しない
- Why: `windows_subsystem = "windows"` の release build では console がなく、dialog のない setup / `.run()` 失敗は operator に原因と対処を伝えられない。既存の app handle 非依存 helper へ合流させ、起動続行や自動回復を追加せず可視性だけを補う
- Rejected alternatives: `tauri_plugin_dialog` の同期表示（上記 main-thread 制約）/ 診断ログ初期化前のログ再試行（filesystem 失敗を再帰させる）/ `.run()` の panic 維持（release で不可視）/ L3 hook から handler を直接呼ぶ低忠実度 simulation（実 `.run()` Err 後の process 状態を検証できない）
- 見直し契機: 非 Windows の配布対象化、起動失敗の自動回復・リトライ、または pre-window dialog 機構自体を置換するとき

### 12.5 テスト方針（実装 PR1 の完了条件、P8b-3）

fixture / 注入の必須条件は 71 §71.10「fixture / 注入の必須条件」に従う（実 WAL fixture は `wal_autocheckpoint=0` または作成側接続の保持 + 実行前の WAL frame 存在 assert、ファイル操作失敗は注入可能な file-ops 抽象で決定論的に起こす。clean close は WAL を checkpoint・削除するため「書いて閉じただけ」の fixture は WAL を持たない — PR #14 Codex P2-4）。

| テスト | 検証内容 |
|---|---|
| 実 WAL fixture 移行 | 上記条件を満たす実 SQLite DB（WAL frame 存在を事前 assert 済み）を移行し、新パスの DB を再 open して WAL 内 row を含む全データを検証する |
| VACUUM INTO 失敗注入 | failpoint で失敗させ、`Err` が返り、`new_dir` に `inventory.db`（最終名）が存在しないこと・再実行で移行が成功することを検証する |
| publish/link 失敗注入 | 一時ファイルから最終名を作る hard-link publish を failpoint で失敗させ、同上の不変条件を検証する |
| post-link staging unlink 失敗注入 | 完成済み最終名を保持したまま `Err` になり、次回起動が「新 DB 既存 → 移行 skip」で通常起動することを検証する |
| no-clobber publish | publish 直前に destination を出現させ、既存 destination が置換されず `Err` になることを検証する（MNT-03-D2 ステップ 6） |
| 存在確認エラーの分離 | 旧 DB の存在確認 error（try_exists の Err 相当）と CWD 解決失敗を注入し、skip（`Ok(false)`）ではなく `Err` → MNT-03-D4 経路に入ることを検証する |
| NO_CREATE open | 存在確認後に旧 DB を削除（TOCTOU 相当）し、空の旧 DB が作成されず `Err` が返ることを検証する |
| 既存 skip 判定の回帰 | 新 DB 既存 / 旧 DB が確実に無い場合の `Ok(false)` 経路（既存テスト維持） |

エラーダイアログの pre-window（setup hook 内、webview マウント前）表示が Windows 実機で動作することの確認（表示機構の選定を含む、MNT-03-D4 の Contract Probe）も実装 PR1 の完了条件に含める（自動化不能なら L3 相当の手動確認として実装 packet に記録）。

実 WAL fixture 移行テストは MNT-03-D2 の前提（新規接続で開いた旧 DB への `VACUUM INTO` が WAL 内 commit を取り込む）の経験的検証を兼ねる。このテストが fail する場合は実装の不具合と決めつけず、MNT-03-D2 の設計自体を再検討する。

## 13. MNT-03 追加: migration v5（plu_slots）

**MNT-03-D9 / SPEC-PLS-D1**: migration v5 を schema_versions に追加する。実装と migration map 登録は後続実装 A の義務であり、本 design-first PR では schema を変更しない。

**手順**:

1. `plu_slots` を [db-design/plu-tables.md](../db-design/plu-tables.md) の完全 DDL（memory_no の 217..5000 CHECK、status の 5 値 CHECK、timestamp 列）で作成する。
2. `status IN ('external','reserved','active')` を条件とする `scanning_code` partial UNIQUE index を作成する（`release_pending` は対象外。[db-design/plu-tables.md](../db-design/plu-tables.md) §25 の gated amendment 2）。
3. memory No. 217〜5000 の **4,784 行**を `free` として事前投入する。範囲は既存の開始番号・範囲サイズ定数から導出し、重複した magic number を実装へ増やさない。
4. row count、範囲端、既定 status を同一 transaction 内で検証し、失敗時は §3.2 / MNT-03-D1 に従って rollback する。
5. schema_versions に v5 を記録して commit する。v3 の `plu_target` backfill と v4 の日報 table は変更しない。

## 14. MNT-03 追加: migration v6（suppliers.updated_at）

**MNT-03-D10 / SPEC-SUP-D5**: migration v6 を schema_versions に追加し、`suppliers.updated_at` を改名日時として導入する。実装と migration map 登録は後続実装 PR の義務であり、本 design-first PR では schema を変更しない。

**手順**:

1. `ALTER TABLE suppliers ADD COLUMN updated_at TEXT` で NULLABLE 列を追加する
2. `UPDATE suppliers SET updated_at = created_at` で既存行を backfill する
3. 既存行の `updated_at` が `created_at` と一致することを同一 transaction 内で検証する
4. schema_versions に v6 を記録して commit する

SQLite の `ALTER TABLE ADD COLUMN` 制約により、NOT NULL + 非定数 default を直接追加しない。table rebuild による NOT NULL 化も行わず、列は NULLABLE のまま維持する。新規作成行は改名前なら NULL を許容し、BIZ-01 `rename_supplier` が実際の改名時だけ現在日時へ更新する。

**MIGRATIONS 登録順**: `migration.rs` の migrations() は v1 → v2 → v3 → v4 → v5 → v6 の順に登録する。v6 の description は `suppliers.updated_at 追加` とし、kind は `MigrationKind::Custom(schema_v6::apply_v6_supplier_updated_at)` とする。実装は既存行の backfill、新規行の NULL 許容、再実行時に v6 を重複適用しないことを検証する。

## 15. MNT-03 追加: migration v7（日報の個数を100倍の整数へ）

**MNT-03-D12 / IO-07-D2 / D-104**: migration v7 を schema_versions に追加し、`daily_report_summary_lines` と `daily_report_department_lines` の `quantity` 列を `quantity_hundredths`（個数の100倍の整数）へ改名して既存値を100倍する。列の意味の正本は [db-design/pos-tables.md](../db-design/pos-tables.md) §12c・§12e。実装と migration map 登録は後続実装 PR の義務であり、本 design-first の変更では schema を変更しない。

**手順**（`MigrationKind::Custom`、1 つの transaction）:

1. 範囲検査: 2 表それぞれについて、NULL でない `quantity` のうち `quantity > ?1 OR quantity < -?1`（`?1 = i64::MAX / 100`）の行が 1 件でもあれば、何も変えず v7 も記録せず `DbError::MigrationFailed` を返す。その message には `範囲検査` と表名を含める（手順 6 の検証の失敗と区別できるようにする）。100 倍が `i64` を溢れると SQLite は値を REAL にして黙って続け、件数と合計では気づけないため、変換の前に止める。手順 6 (b) の `typeof` の検証と重なる防御で、(b) は変換の後に REAL を捕まえて rollback するが、範囲検査は変換の前に止め、範囲外の値があることを原因として示す。Rust の `abs()` で比べない（`i64::MIN` で溢れる）。この検査は手順 2 の合計より前に置く。行の範囲検査は集約の溢れを防がない（範囲内の値でも 2 行の和は溢れうる）。日次の集約は [24 §14.21](24-io-csv-import-repo.md#1421-get_completed_daily_report_aggregate) 手順 7 の溢れを検査する加算で、月次は §14.22 の `SUM` の `integer overflow` で、どちらも `DbError` で止まる
2. 2 表の `quantity` が NULL でない行の件数と合計（`COUNT(quantity)`・`COALESCE(SUM(quantity), 0)`）を読む（検証用）。行が 0 の表と全行が NULL の表では `SUM` が NULL を返すので、`COALESCE` で 0 にする（`COUNT` は 0 を返すのでそのまま）。`SUM` が溢れると SQLite は `integer overflow` の error を返すので、それも `DbError::MigrationFailed`（何も変えない）にする
3. `ALTER TABLE daily_report_summary_lines RENAME COLUMN quantity TO quantity_hundredths`
4. `ALTER TABLE daily_report_department_lines RENAME COLUMN quantity TO quantity_hundredths`
5. 2 表とも `UPDATE … SET quantity_hundredths = quantity_hundredths * 100 WHERE quantity_hundredths IS NOT NULL`
6. 同じ transaction 内で、2 表それぞれについて次の 3 つを確かめる。合計の 100 倍とは比べない（範囲内の最大の値が 2 行あると 100 倍の `SUM` が溢れる）。違うか、検証の SQL が error（溢れを含む）を返せば、§3.2 / MNT-03-D1 に従って rollback し `DbError::MigrationFailed` を返す
   - (a) `COUNT(quantity_hundredths)` が手順 2 の件数と同じ
   - (b) NULL でない全行で `typeof(quantity_hundredths) = 'integer'`
   - (c) `COALESCE(SUM(quantity_hundredths / 100), 0)` が手順 2 の合計と同じで、かつ `NOT EXISTS (SELECT 1 FROM <表> WHERE quantity_hundredths % 100 <> 0)`（NULL の行は `<>` が真にならないので除かれる）。余りを `SUM` で足して 0 と比べない（符号の違う余り、例えば `101` と `-201` が打ち消し合って通る）。前半の `COALESCE` を外すと、行が 0 の表（日報を 1 件も取り込んでいない DB、新規 DB）と全行が NULL の表で `SUM` が NULL になって比較が成り立たず、v7 が `MigrationFailed` になる
7. schema_versions に v7 を記録して commit する

`RENAME COLUMN` は SQLite 3.25 以降で使える（同梱の SQLite は 3.45.0、`libsqlite3-sys` 0.28.0）。index は `quantity` を含まないので作り直さない。CHECK・FK・NULL 許容は変えない。v4 の CREATE 文（`schema_v4.rs`）は書き換えず、新規 DB も v4 で `quantity` を作ってから v7 で改名する（migration の履歴を変えない）。表を作り直さないので v2 の foreign_keys OFF の手順は要らない。

既存の DB の日報の個数は今まで整数でしか保存できなかった（小数の日は取込み自体が失敗していた）ので、100 倍は値を変えずに単位だけを変える。v7 を適用した DB は v7 を知らない旧版のアプリでは開けない（MNT-03-D11 の `SchemaNewerThanApp`）。v6 以前の backup を復元すると、open の migrate が v7 を適用する。

**MIGRATIONS 登録順**: `migration.rs` の migrations() は v1 → … → v6 → v7 の順に登録する。v7 の description は `日報の個数を100倍の整数へ` とし、kind は `MigrationKind::Custom(schema_v7::apply_v7_daily_report_quantity_hundredths)` とする。実装は、既存行の 100 倍（NULL は NULL のまま、負の値も 100 倍）、改名後の列名、再実行時に v7 を重複適用しないこと、v6 の DB に日報の行がある状態からの適用、範囲の境界（範囲内の最大 `i64::MAX / 100` の 2 行は成功、範囲外の 1 行は範囲検査の message で失敗して何も変わらず v7 が記録されない）、行が 0 の表と全行が NULL の表で v7 が成功すること、手順 6 の検証の失敗（符号の違う余りが打ち消し合う形を含む）で 2 表・値・版が rollback されることを検証する。

## 16. MNT-03 追加: 単位の拡張と原価の 1/100 円の migration（proposed・未実装、D-113）

**MNT-03-D13 / D-113**: 単位を 12 個の code へ広げる migration（以下 vU）と、原価を 1/100 円へ改名する migration（以下 vC）を足す。意味の正本は [共通規則](10-common-rules.md) SPEC-UNIT-D1・D5 と [db-design/master-tables.md](../db-design/master-tables.md) の「単位と原価の精度の契約」。vU は単位の runtime の lane、vC は原価の runtime の lane（`決定（owner、D-113 J2）`）が実装し、番号はそれぞれの lane が起票時に決める（並走の lane〈時点証拠の migration 等〉と番号・順序を合わせる）。本 design-first の変更では schema を変えない。

**vU の手順**（`MigrationKind::Custom`、表の作り直し。SQLite は CHECK を ALTER で変えられない）:

1. TX の外で `PRAGMA foreign_keys` の値を読み、OFF にする（v2・時点証拠の migration と同じ形。TX の中の `PRAGMA foreign_keys` は no-op）
2. BEGIN。`products` の行数を読む。続けて下の「vU の上限の検査」を行う（読取りだけ）。上限の外の値が 1 件でもあれば ROLLBACK し、`PRAGMA foreign_keys` を手順 1 の値に戻して、何も変えず版も記録せず `DbError::MigrationFailed`（message に `上限の検査` と表名・列名）
3. `products_new` を、vU を適用する時点の `products` と同じ列・同じ順・同じ制約で作り、`stock_unit` の CHECK だけを 12 個の code（`pcs` `sheet` `hon` `bag` `box` `roll` `kumi` `set` `ball` `cho` `m` `cm`）にする。既定値 `'pcs'` は変えない。列の並びは vU の直前の版の schema から写す（先に時点証拠の migration が `products` に列を足していれば、その列も含める）
4. 全列を列名で並べて `INSERT INTO products_new (…) SELECT … FROM products`。値は変えない
5. `DROP TABLE products`、`ALTER TABLE products_new RENAME TO products`、`idx_products_jan_code`・`idx_products_department_id`・`idx_products_is_discontinued`（と vU の時点で `products` にあるほかの index）を作り直す
6. 同じ TX の中で確かめる: (a) 行数が手順 2 と同じ、(b) `PRAGMA foreign_key_check` が 0 行、(c) `stock_unit` の値ごとの件数が作り直しの前と同じ。違えば rollback して `DbError::MigrationFailed`
7. schema_versions に記録して COMMIT。TX が閉じた後に `PRAGMA foreign_keys` を手順 1 の値に戻す（MNT-03-D1 の COMMIT 失敗の扱いに従う）

**vU の上限の検査**（手順 2。[共通規則](10-common-rules.md) の「入力の上限と安全な整数の範囲」）: 単位の lane は BIZ の入口に数量・在庫・売価の上限を入れる。今の BIZ はどれにも上限を持たない（数量は 1 以上、初期在庫・売価は 0 以上、在庫の計算は i64 の溢れだけ）ので、上限の外の値は今の DB にありうる。vU は、何かを変える前に、保存済みの値が上限に入っているかを 1 回確かめる。通して以後の書込みだけを縛る案は採らない: 本番の DB はまだ無い（`docs/project-memory.md` の「無いもの」、owner 回答 2026-09-19）ので止めても失うものが無く、通った DB では「数量・在庫・売価・円の合計の全値が上限の中」が初日からの不変条件になる（通すと、共通規則の「上限から導ける範囲」に旧データの例外が付く）。対象は次の表で全部（列名は `schema_v1.rs` の CREATE 文と `docs/db-design/` の各表のカラム定義で確かめた、2026-10-11）。

| 上限（絶対値で比べる。NULL の行は除く） | 列 |
|---|---|
| 1 明細の数量 `9999999` | `receiving_items.quantity`、`return_items.quantity`、`manual_sale_items.quantity`、`disposal_items.quantity`、`sale_records.quantity` |
| 在庫 `999999999` | `products.stock_quantity`、`inventory_movements.stock_after`、`stocktake_items.system_stock`・`actual_count` |
| 変動の数量 `1999999998`（在庫の上限の 2 倍） | `inventory_movements.quantity`（棚卸しの補正の変動は実数と在庫の差で、初期在庫の変動は在庫の上限まである〈`product_service.rs:272`〜`:282`〉ので、1 明細の数量の上限では比べない） |
| 売価 `999999` | `products.selling_price`、`price_history.old_selling`・`new_selling` |
| 円の合計 `9007199254740991` | `stocktakes.total_cost`、入庫の記録ごと・廃棄の記録ごとの明細の `quantity × cost_price` の和（`receiving_items` を `receiving_record_id`、`disposal_items` を `disposal_record_id` でまとめる） |

- 記録ごとの和は、基準数量で割る前の値で比べる（[共通規則](10-common-rules.md) SPEC-UNIT-D6 の合計はこの値以下なので、通った記録の合計は必ず範囲内。長さの商品の記録は実際の合計の 100 倍まで厳しく止まる）。積か和が i64 を溢れる記録も上限の外にする（SQLite は整数の積の溢れを REAL にし、整数の `SUM` の溢れを error にする。python の sqlite3 で確かめた、2026-10-11）。
- 原価の 6 列は、vC の範囲検査（下の手順 1）が同じ形で確かめる。
- vU を適用する時点で、時点証拠の migration が数量の列を足していれば（`stocktake_recounts.system_stock`・`actual_count`。`schema_time_evidence.rs:97`〜`:101`）、同じ在庫の上限で含める（手順 3 と同じ扱いで、後に入る lane の義務）。
- 止まった後の進め方は、vC の範囲検査で止まったときと同じ（下の手順 1 と回復）。vU がその起動の最初の migration なら DB の版は変わらず、旧版のアプリでそのまま開ける。

**vC の手順**（`MigrationKind::Custom`、1 つの transaction、§15 の v7 と同じ形）: 対象は 6 列（`products.cost_price`、`receiving_items.cost_price`、`disposal_items.cost_price`、`stocktake_items.valuation_cost_price`、`price_history.old_cost`・`new_cost`）。

1. 範囲検査: 各列で NULL でない値のうち `> ?1 OR < -?1`（`?1 = 999999`。100 倍の後が [共通規則](10-common-rules.md) SPEC-UNIT-D5 の原価の上限 `99999999`〈`999999.99` 円〉の中に入る最大の円: `999999 × 100 = 99999900` は上限の中、`1000000 × 100 = 100000000` は外）が 1 件でもあれば、何も変えず版も記録せず `DbError::MigrationFailed`（message に `範囲検査` と表名・列名）。原価の lane の前の BIZ は原価に上限を持たない（負だけを拒む。`product_service.rs:952` ほか）ので、範囲外の値は今の DB にありうる。範囲検査で止まると戻るのは vC の TX だけで、同じ起動で先に COMMIT した migration（vU ほか）の版は残る（下の回復）。範囲外の値はアプリの画面では消せない: 商品の原価を直しても、価格の履歴（`price_history.old_cost`）と入庫・廃棄・棚卸しの明細の原価に範囲外の値が残り（記録は書き換えない契約）、vC は毎回同じ列で止まる。よって範囲検査で止まったら、更新を保留して新しい版を起動しない（起動のたびに同じ所で止まる）、下の回復の手順で更新の前の版と backup に戻して DB の原本を保全する、管理者が対応を決める（範囲外の行の数と列は message にあるので、値を直す SQL を当てるか、vC の範囲の契約を見直すか。どちらも R4 の判断で owner に諮る）、の順に進む。原価の lane は起票時に、更新の前に範囲外の値を見つける手段（例: 先の版で原価の上限を BIZ に入れる、更新の前に件数を数える）を決める
2. 各列の NULL でない行の件数と合計（`COUNT`・`COALESCE(SUM(…), 0)`）を読む。`SUM` の溢れも `MigrationFailed`
3. 各列を `ALTER TABLE … RENAME COLUMN … TO …_centi`（master-tables の表の名前）にし、`UPDATE … SET … = … * 100 WHERE … IS NOT NULL`
4. 各列で §15 手順 6 の (a)〜(c) と同じ 3 つを確かめる（件数・`typeof = 'integer'`・`SUM(… / 100)` が手順 2 の合計と同じで余りの行が無い）。違えば rollback して `MigrationFailed`
5. schema_versions に記録して COMMIT

列は改名だけで表を作り直さないので foreign_keys の手順は要らない（同梱の SQLite 3.45.0 の `RENAME COLUMN`）。時点証拠の migration（`schema_time_evidence.rs`、未配線）は `stocktake_items` を作り直して `valuation_cost_price` を列名で写すので、vC と後に適用される方が、その時点の列名で SQL を書く（後に入る lane の義務）。

**回復**（R4）: vU・vC はそれぞれ 1 つの transaction で、失敗すれば失敗した migration の変更と版だけが戻る。`migrate` は migration ごとに COMMIT する（§3 の処理ステップ 5、`migration.rs` の `migrate`）ので、同じ起動で先に成功した migration の版は残る。例: v7 の DB に U と C を含む版を入れて vU（仮に 8）が COMMIT し、vC（仮に 9）が範囲検査で止まると、DB は版 8 になり、v7 までのアプリ（app_max 7）は `SchemaNewerThanApp` で開けない。旧版でそのまま開けるのは、残った版が旧版のアプリの最大以下のとき（その起動の最初の migration で止まったとき）だけで、それ以外は下の手順で更新の前の backup に戻す。成功した後に旧版へ戻す経路も、アプリの中の復元（[71](71-mnt-backup.md) §71.7）では作れない: 旧版のアプリは vU・vC を適用した DB で起動を中止し（MNT-03-D11、§12.4 の文言）、復元の画面に届かない。新しい版のアプリで更新の前の backup を復元すると、open の migrate が vU・vC を適用し直す（71 §71.7 のとおり。これは新しい版のまま古い時点のデータへ戻す経路で、旧版へ戻す経路ではない）。旧版へ戻すのは、管理者がアプリの外で行う次の手順だけにする（店の利用者の操作にしない。runtime の lane が L3 の前に手順書へ写す）。71 の restore の契約（退避・manifest・reconcile）は変えず、この手順はアプリが止まっている間の file の置き換えで、71 の遺物を作らない。

1. 更新の前に、旧版のアプリで backup を作っておく（71 §71.4）。起動時の自動の backup は migrate の後に作られるので（71 §71.9）、新しい版で作った backup は旧版で使えない
2. アプリを止める（窓を全部閉じ、プロセスが残っていないことを確かめる）
3. 何も動かす前に、復元の中断の遺物が無いことを確かめる: `{db_path}.restore_manifest`・`{db_path}.restore_manifest.tmp`・`*.restore_backup` のどれかがあれば手順を止める（起動の reconcile〈71 MNT-01-D5〉が扱う状態。手で消さず、file も動かさない）
4. 何も動かす前に、戻す backup を確かめる: backup の写しを別の場所に作り、写しを読み取りだけで開いて、`SELECT MAX(version) FROM schema_versions` が旧版のアプリの最大の版以下（vU・vC の前の版）で、`PRAGMA integrity_check` が `ok`。違えば別の backup で確かめ直し、合う backup が無ければ手順を止める（ここまでは `{db_path}` と `-wal`・`-shm` を動かさない）
5. 今の DB を保全する: `{db_path}` と、あれば `{db_path}-wal`・`{db_path}-shm` を、消さずに日付の付いた別の folder へ移す（更新の後に入れたデータはここにだけ残る）
6. 手順 4 で確かめた backup の写しを `{db_path}` に置く（backup は `VACUUM INTO` の 1 file なので `-wal`・`-shm` は置かない）
7. 旧版のアプリを入れて起動する。遺物が無いので reconcile は何もせず、版が旧版の最大以下なので migrate は開ける

更新の後に入れたデータは戻らない（手順 5 で保全した file にだけ残る）。値の変換は vC の 100 倍だけで、逆変換の migration は作らない。

**テスト**（runtime の lane の完了条件）: vU は、12 個の code がすべて入り一覧に無い値（`kg`）が CHECK で拒まれること、作り直しの前後で全列の値・index・FK が同じこと、手順 6 の失敗で表・版が戻り foreign_keys が元の値に戻ること。vU の上限の検査: 各列が端の値（数量 `9999999`・`-9999999`〈`sale_records.quantity`〉、在庫 `999999999`・`-999999999`、変動 `1999999998`、売価 `999999`、`stocktakes.total_cost` `9007199254740991`、記録ごとの和が `9007199254740991` ちょうど）の旧 DB は通って vU が成功し、どれか 1 列が 1 つ外（`10000000`、`1000000000`、`1999999999`、`1000000`、`9007199254740992`）の旧 DB は、表・値・版・foreign_keys が何も変わらず `MigrationFailed`（message に表名・列名）。上限の外が明細・履歴の列（`inventory_movements.stock_after`、`price_history.old_selling`）だけにある DB も同じく止まる。記録ごとの和: 1 行の入庫（数量 1、原価 `9007199254740992` 円）は止まり、積が i64 を溢れる明細（数量 `9999999`、原価 `i64::MAX`）も止まる。行 0 の表で成功。回復の手順（管理者の手順書を合成の DB で 1 度通す）: 手順 3 で遺物（`.restore_manifest` か `.restore_backup`）がある状態、手順 4 で版が新しすぎる backup・`integrity_check` が `ok` でない backup しか無い状態のどちらで止まっても、元の名前の `{db_path}`・`-wal`・`-shm` と遺物の file は中身も名前も変わらない（手順 5 の移動の前に止まる）。連続適用の失敗: v7 の DB の `price_history.old_cost` に範囲外の原価（`1000000`）を置き（vU の上限の検査は原価の列を見ないので通る）、vU と vC を同じ `migrate` で当てる → vU の版が記録されて vC の変更と版は戻り、`migrate` は `MigrationFailed`、DB の版は vU、app_max が 7 の `migrate` は `SchemaNewerThanApp`。vC は §15 の v7 のテストの観点（NULL は NULL、負の値も 100 倍、範囲の境界〈`999999` と `-999999` は成功して `99999900`・`-99999900`、`1000000` と `-1000000` の 1 行は範囲検査で失敗して何も変わらない〉、行 0 の表、全行 NULL の `valuation_cost_price_centi`、手順 4 の失敗での rollback、再実行で重複適用しない）。
