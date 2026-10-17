# Plan Packet: SD 直読みの runtime（毎日の売上データをレジの SD から読む、D-111 の実装）

wave に属さない単独の lane（2026-10-17 起票。owner の「動かせるだけ動かす」〈repo 外の回答台帳 TD-304〉で Coordinator が同時に起票した 6 本の 1 本）。設計は merge 済み（PR #150、[decision-log](../decision-log.md) D-111。設計 lane の packet と Matrix は `docs/archive/plans/2026-10-06-sd-direct-read.md`・`docs/archive/plans/test-matrices/2026-10-06-sd-direct-read.md`）で、本 lane はその既決の契約を実装する。branch は `agent/sd-direct-read-runtime`（main `f5d7aaf4` から）。同時に起票した並走は `agent/daily-report-sheet-design`（日報の紙と意味づけ、D-120）・`agent/sd-bulk-import-design`（売上の SD からの一括取込みと EJ の控えの閲覧、D-121）・`agent/stock-unit-relabel`（単位の語の直し）・`agent/jan-alias-design`（D-122）・`agent/msi-distribution-docs`。本 lane は新しい決定の番号を使わない（下の Design Readiness）。

**規模と手法（1 lane のまま。実装の順を S1〜S6 に固定する）**: 2026-10-17 に本 worktree（HEAD `f5d7aaf4`）で数えた。形の変わる型を作る・読む既存の Rust は 19 file（`rg -l 'AppState \{|NewDailyReportImport \{|DailyReportInputFile \{|DailyReportSourceFileRequest \{|CachedDailyReportPreview \{|commit_daily_report_import\(|DailyReportParseResult \{|enum BizError|impl From<BizError> for CmdError|collect_commands!|daily_report_imports \(' src-tauri/src src-tauri/tests | sort | wc -l` → `20`。うち `db/schema_v4.rs` は CREATE 文の hit で変えない）に、登録の 3 file（`io/mod.rs`・`db/mod.rs`・`tests/design_compliance_test.rs`）と新設 3〜4 file（`io/register_sd.rs`・`io/pos_source_copy.rs`・`db/schema_v9.rs`〈番号は 22 §17〉、scan を分けるなら `biz/daily_report_import_service/scan.rs`）。frontend は `src/features/daily-report-import/` の 7 file（`rg -l 'daily-report-import|DailyReportSourceFileRequest' src --glob '!src/lib/bindings.ts' | sort | wc -l` → `7`）と新設の test 2 file、生成物の `src/lib/bindings.ts`。wire の型は新しい command 2 つと DTO 4 つ、既存の DTO への省略可の field 1 つ（`DailyReportSourceFileRequest.source_path`）。DB は NULL を許す列 1 つ（migration 1 つ）。画面は既存の日報取込みタブ 1 つ（新しい route・画面は無い）。横断の約束（範囲・0・失敗の時点と順序・種類の混在）がかかる経路は、`settlement_no`（IO-07 → cache → DB、wire に出さない）と、写しの失敗の順序（TX の前）と、SD から来た失敗の戻り先（UI の `sd_list`）の 3 つで、どれも 1 つの正本の節が持つので、別の横断の表は作らない（下の「新しい契約の文と境界の 4 観点」で一巡した）。
- 分けない理由: backend（IO-09・IO-10・BIZ-08・CMD-12・migration）だけを先に入れる切れ目は、画面から呼ばれない command と、写しの規則の効く手で選ぶ経路（UI-07-D16 の `source_path`）の片側だけの main を作り、L3 が 2 回になる（owner は 2026-10-20 から手が使いにくい。介入の上限 9、TD-296）。1 lane で順に積み、L3 を 1 回にする。
- 実装の順: S1 IO（IO-07-D5・IO-09・IO-10）→ S2 DB（migration・`sales_repo`）→ S3 BIZ（scan・D4・D5・D6・手順 1a・手順 9）→ S4 CMD と登録・bindings → S5 frontend → S6 設計正本の「未実装」の注記を現行の記述へ直す。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（subagent_type: writer）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める。Codex が起動できない日は座組表の Codex 停止中の列）
- Final Reviewer: Fable 5.1（Claude 側、R3）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge,manual
- Branch: agent/sd-direct-read-runtime

遷移の記録:

1. kickoff → spec-check（2026-10-17、起草役）: Coordinator の発注 367（D-111 の既決の契約の実装。D-117・D-118 の runtime は入れない）を Scope にし、規模を数えて 1 lane のままと決め、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-17、起草役）: 対象の正本は 29 §29.2（IO-07-D5）・§29.7・§29.8、37 §37.3・§37.4・§37.9、45 §45.2〜§45.8、55 UI-07-D12・D15・D16、24 §14.14・§14.18a、pos-tables §12b、22。設計 lane の fresh Final broad の P3 4 件（`docs/backlog.md` の「SD 直読みの runtime」）と、起票で見つけた正本の穴（migration の手順が 22 に無い、IO-07-D5 の `i64` の範囲、UI-07-D16 の選択の一覧の細部と文言、37 §37.9 手順 10・45 §45.6a 手順 2a〈D-117〉の実装の lane）を、本 packet と同じ commit で正本に入れた（下の Design Readiness）。
3. design → plan-draft（2026-10-17、起草役）: 上の更新は正本にあり、D-111 の決定の向きを変えない。未解決の設計の問いは無い。残る P1・P4（Contract Probe）は設計の問いではなく、L3 の前に確かめる未確認の前提（下の Contract Probe）。plan-gate へは Coordinator が進める。

## Owner Effort Budget

- 介入回数上限: 9（repo 外の回答台帳 TD-296 の 5a。既定 6 から上げた）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 9 | 0（2026-10-17 起票時。plan-approved は Coordinator が進める〈TD-296 の 4a〉ので数えない） | 4（L3 の 1 round 1、L3-4 を導入の時へ送る残余の受容 1、Ready 1、merge 1） | 5（L3 の 2 round 目 1、P1 が不一致のときの設計の見直しの判断 1、P4 で規則外の名前の file が増えたときの判断 1、その他 2） | 9 = 0 + 4 + 5 |

既定値・数え方は `docs/DEV_WORKFLOW.md` `Owner Effort Budget`。承認依頼は `この change での介入 N 回目 / 予算 9 回` と「承認すると、売上データ取込み画面でレジの SD を読み、精算を選んで日報を取り込めるようになる」の 1 文。owner は 2026-10-20 から手が使いにくいので（TD-296 の 1a）、問いは記号か短文で答えられる形にし、L3 は Draft のまま溜めて他の lane とまとめて 1 回の session で行う（`.local/reports/autonomy-2026-10/map.md` §7.3 の (ii)・(iii)）。

## Risk

Risk: R3

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R3 の行のうち「DB」（`daily_report_imports.settlement_no` の migration）、「POS CSV」（SD の Z の読取りの経路と同じ精算の二重取込みの拒否）、「Tauri command DTO」（新しい 2 command と DTO 4 つ、`DailyReportSourceFileRequest.source_path`）、「operator workflow」（日報取込みの標準の手順を SD から読む形にする）に当たる。R4 ではない: migration は NULL を許す列を足すだけで既存の値を変えず（22 §17）、SD へは書かない（IO-09-D3。許可の列の API だけで、source の検査 test が固定する）、写しはアプリの data の folder に上書きせずに書き（IO-10）、実店舗のデータを repo に入れない（test は合成の tree）。backup・restore・破壊的な操作を変えない。
required gate の green / red は変わらない（製品の code と test と docs だけで、gate の定義・helper・classifier・CI・workflow の正本に触らない）。Scope の予定 path は `scripts/ci/classify-changes.sh` の workflow の一覧（AGENTS・CLAUDE・DEV_WORKFLOW・MANUAL・code_review・project-profile・agent-guidance・templates・`.agents`・`.claude/{rules,commands,skills}`・PR template）に当たらないので Final Review Minimum 1。operator に見える状態の lifecycle（scan → 一覧 → preview → 写し → 結果）を変えるので、Contract Audit の 2 本目は推奨（`docs/DEV_WORKFLOW.md` Contract Audit の Double audit。採るかは Coordinator）。Windows の実機の確認があるので Human Gate に `manual`。

## Goal

Goal Invariant:

### 最小完了条件

- 店の PC で、売上データ取込み画面の日報取込みタブの「SD から読む」を押すと、取外し可能な drive の `CASIO\SR500_550_4000` を探して `XZ`・`XZ_BKUP` の Z001 / Z002 / Z005 を読み、精算ごとの一覧（取り込めます / 取込み済み / 同じ精算を取込み済み / ファイルがそろっていません / 読めません）と SD を戻す案内を出す。「取り込めます」の行から既存のプレビュー・取込みへ進め、取り込むと読んだ 3 本の写しが `pos-sources/casio-sr-s4000/sd/` に残り、`daily_report_imports.settlement_no` に精算回数が入る（IO-09・IO-10・IO-07-D5・BIZ-08-D3〜D6・CMD-12-D1・UI-07-D12・D15・D16、22 §17）。
- 予備の「ファイルを選んで取り込む」で 1 つずつ選び足し・外せ、選んだ file がレジの SD の上なら SD の入力として扱われる（写し・精算回数の検査が効く）。
- 同じ精算を別の bytes で 2 回取り込めない（BIZ-08-D4）。SD の経路で精算回数の読めない束は取り込めない（BIZ-08-D6）。

### 失敗定義

- SD に書く・file を動かす経路がある、または root の外を読む（IO-09-D3）。
- 同じ精算が追加確認だけで 2 回保存される、または同じ日の正常な 2 回目の精算が止まる。
- 写しの無い SD の取込みができる、または写しの失敗の後に同じ preview で再試行できない。
- 既存の手で選ぶ経路（PC 上の file）の取込み・同日追加の確認・取消が変わる。
- CMD が IO を直接呼ぶ、規則が CMD・UI にある（`src-tauri/tests/architecture_test.rs`）。

### 非目的

- 取込み済みの Z・EJ を `XZ_BKUP` へ移す操作（D-111 (1) の (b)、`docs/backlog.md` の別項目）。CV17 の取込みは (b) まで店が今の運用で続ける（D-111 の運用の制約）。
- PLU の占有の照合（37 §37.9 手順 10、45 §45.6a 手順 2a、D-117）と、Z004・EJ の取込み・計数の置き場（D-118）。Z004・日報・EJ の一括取込みと EJ の閲覧（D-121 の design lane）。
- 写しの保持期間・削除・backup への同梱（D-111 の未決 A・B。既定は消さない・backup に入れない）。窓より前の未取込みの検知。
- 画面のデザインの刷新（TD-296 の 11c。UI-07-D16 の置き場所はひとまず）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので毎日の取込みの操作列を置く。**この lane を完了できる**（merge）と、**通常運用を達成できる**（店で毎日 SD から取り込む）は別で、後者は本番の DB を店に入れた後（`docs/project-memory.md` の「無いもの」）。(b) の lane まで店は CV17 の取込みも続ける（D-111 の運用の制約）。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| その日の精算の後 | 精算する（ECR+ かレジ） | レジが SD の `XZ\yyyy\mm\` に Z001/Z002/Z004/Z005、`XZ` 直下の EJ に記録を書く | SD に精算の file がある | 2026-10-06 版での SD の採取（29 §29.7.2 SD-02・SD-03） |
| SD がレジにある | SD を抜いて PC に差し、CV17 の取込みをいつもどおり済ませる（(b) の lane まで） | Z・EJ が `XZ_BKUP` へ移る | 取込みが終わった | D-111 の運用の制約。アプリは `XZ` と `XZ_BKUP` の両方を読むので、CV17 の前でも後でも取り込める |
| 日報取込みタブ | 「SD から読む」 | 「読み終わりました。いつもの取込みが済んでいれば、SD はレジに戻してください（次の精算に要ります）。」と精算の一覧（UI-07-D15） | 「取り込めます」の行がある（無ければ (b)・(c) の文） | 自動の発見は L3-1 |
| 一覧が出た | SD をレジへ戻す | 次の精算ができる | 読んだ内容はアプリが 30 分持つ（CMD-12-D1） | — |
| 「取り込めます」の行 | 「確認する」 | 既存のプレビュー（同日追加の確認を含む） | プレビューが出る | 取込み前の原本の精算回数が読めること（P1） |
| プレビュー | 「取り込む」 | 日報が保存され、3 本の写しが `pos-sources/` に残る。「日次売上を見る」へ進める | 結果が出る | 写しの失敗は preview に戻って同じ token で再試行（55 の日報取込みの利用者フロー手順 2） |
| 同じ日に 2 回目の精算をした | 同じ操作 | 1 回目は「取込み済み」、2 回目は「取り込めます」 | — | 同じ日の複数の Z（SD-08、2026-10-06 版での観測） |
| SD が読めない・過去の分 | 「ファイルを選んで取り込む」で 1 つずつ選ぶ | 3 つそろうと「確認する」。SD の上の file なら SD の入力として扱う | 3 つそろう | UI-07-D16 |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える。

## owner の判断事項

本 lane で新しく owner に諮る製品の判断は無い。D-111 の判断 1〜5 は 2026-10-06 に、P2・P3 の扱いは 2026-10-07 に決まっている（D-111）。owner に諮るのは L3（manual）・L3-4 を導入の時へ送る残余の受容・Ready・merge だけ（Owner Effort Budget）。P1 が不一致なら設計の見直し（BIZ-08-D4・D6）を owner に諮る（予備）。

## Scope

### S1 IO（`io::daily_report_parser`・`io::register_sd`・`io::pos_source_copy`）

- IO-07-D5: `DailyReportParseResult.settlement_no: Option<i64>`（29 §29.2）。作る所は `src-tauri/src/io/daily_report_parser.rs:79` の 1 か所。今の `settlement_number` は `u64` を返し、D3 の一致の判定はその値で行う（変えない）。そろった値を `i64::try_from` し、収まらなければ `None`（29 IO-07-D5 に 2026-10-17 に足した文）。読む所: `biz/daily_report_import_service/parse.rs`（cache へ）、同 file の test の helper。
- IO-09（新設 `src-tauri/src/io/register_sd.rs`、`io/mod.rs` に `pub mod register_sd;`）: 29 §29.7.3 の型と §29.7.4〜§29.7.6 の 6 関数（`find_register_sd_roots`・`resolve_register_sd_root`・`locate_in_register_sd_roots`・`check_selected_file_present`・`list_register_sd_entries`・`read_register_sd_file`）。Windows の drive の列挙は既存の `windows-sys`（`Win32_Storage_FileSystem`、`src-tauri/Cargo.toml:48`）で、新しい crate を足さない。許可の列の外の API を使わない（IO-09-D3）。`RegisterSdError::Io.relative_path` の意味は 29 §29.7.3 の注記（2026-10-17）。
- IO-10（新設 `src-tauri/src/io/pos_source_copy.rs`、`io/mod.rs`）: 29 §29.8.2 の `save_pos_source_copy` と §29.8.3 の手順（path を決める → `create_dir_all` → 一時 file → rename、上書きしない、同じ bytes は書かない、違う bytes は `~` + SHA-256 の先頭 12 桁）。SHA-256 は既存の `sha2`。
- 設計照合: `src-tauri/tests/design_compliance_test.rs:157` の `29-io-daily-report-parser.md` の行に `io::register_sd` と `io::pos_source_copy` を足す。新しい `pub fn` は 29 にシグネチャのあるものに限る（無い `pub fn` は設計照合の警告になる）。

### S2 DB（migration・`sales_repo`）

- migration（22 §17 MNT-03-D15）: 新設 `src-tauri/src/db/schema_v9.rs`（番号は merge の時点の次。先に別の migration が merge したら取り直す）、`db/mod.rs:29` の後に `mod schema_v9;`、`db/migration.rs` の `migrations()`（v8 の後）に `MigrationKind::Sql` で登録。
- `NewDailyReportImport.settlement_no: Option<i64>`（24 §14.14）: 定義 `db/sales_repo.rs:198`、INSERT `:597`。構築: `biz/daily_report_import_service/commit.rs:102`（本番）、test の構築 `db/sales_repo.rs:2230`（helper）・`:2517`・`:2526`、`biz/daily_report_import_service/tests.rs:293`、`biz/sales_service.rs:749`、`cmd/sales_cmd.rs:293`、`cmd/daily_report_import_cmd.rs:410`（どれにも `settlement_no` を足す。既存の test は `None` で、意味を変えない）。
- 新しい repository 関数 `find_same_settlement_daily_report_import`（24 §14.18a、id だけを返す）。`DailyReportImport`（list の DTO、`sales_repo.rs:181` 付近）と既存の SELECT・`row_to_daily_report_import` は変えない（24 §14.14 の後の注記）。
- 変えない: `db/migration.rs:949`・`:985`・`:994`・`:1046` の test の INSERT（列を名指しするので新しい列は NULL になる）。`db/schema_v4.rs` の CREATE 文。

### S3 BIZ（`biz::daily_report_import_service`、`biz::mod`）

- `scan_register_sd_daily_reports`（37 §37.9 の手順 1〜9。手順 10 と snapshot の `plu_register_z004s` は作らない〈D-117、PLU の書出しの見直しの runtime の lane〉）、型 `DailyReportSdSelection`・`DailyReportSdScanResult`・`DailyReportSdScan`・`DailyReportSdCandidate`・`DailyReportSdCandidateStatus`・`DailyReportSdScanSnapshot`（wire の 3 つに `specta::Type`）。
- `DailyReportInputFile` に `sd_relative_path: Option<String>`・`source_path: Option<PathBuf>`（37 §37.2）: 定義 `mod.rs:32`、本番の構築 `cmd/daily_report_import_cmd.rs:43`、test の構築 `tests.rs:15`（helper `source_file`。`:27`〜`:65` と `:850` の helper はこれを呼ぶ）、`biz/sales_service.rs:1286`（helper `file`）・`:1471`。
- `CachedDailyReportPreview` に `settlement_no`・`sd_source_files`（37 §37.2）、`SdSourceFileForCopy`: 定義 `mod.rs:121`、構築 `parse.rs:216`、test の構築 `cmd/daily_report_import_cmd.rs:250`（helper `cached`。`:281` はそれを呼ぶ）。`sd_source_files` は §37.3 手順 9 の文（2026-10-17）どおり詰める。
- §37.3 手順 1a（`parse_and_validate_daily_report_with_sd_lookup`、root を取る closure）、手順 4 の BIZ-08-D6、手順 8 の BIZ-08-D4。
- §37.4: `commit_daily_report_import` に `app_data_dir: &Path`（定義 `commit.rs:14`。呼出し: `cmd/daily_report_import_cmd.rs:114`、`biz/sales_service.rs:1310`・`:1478`、`tests.rs` の 29 か所〈`rg -c 'commit_daily_report_import\(' src-tauri/src/biz/daily_report_import_service/tests.rs` → `29`〉。test は一時 directory を渡す）、手順 2a（D6）・2b（D5）・4a（D4）・6（`settlement_no` と `source_files_json` の `sd_relative_path`・`copy_path`。`commit.rs:83` の wire 型の serialize を内部の serialize 用の型に替え、既存の 4 key は変えない）。読む側 `parse.rs:236` の `source_filenames` は無い field を許す（変えない）。
- `BizError::SourceCopyFailed(std::io::ErrorKind)`: `src-tauri/src/biz/mod.rs:57` の enum と `:80` の `Display`。網羅の match は `Display` と `cmd/mod.rs:130` の `From<BizError> for CmdError` の 2 か所（`rg -ln 'BizError::IdempotencyConflict\(.*\) =>' src-tauri/src` → `src-tauri/src/biz/mod.rs`・`src-tauri/src/cmd/mod.rs`）。

### S4 CMD・登録・bindings

- `AppState.register_sd_scan_cache`（45 §45.2）: 定義 `cmd/mod.rs:34`。literal の構築 15 か所すべてに field を足す（`rg -n 'AppState \{' src-tauri/src` から定義の行と `-> AppState {` の signature の行を除く）: 本番 `lib.rs:1264`、test `cmd/product_cmd.rs:273`・`:293`、`cmd/settings_cmd.rs:358`、`cmd/plu_export_cmd.rs:235`、`cmd/stocktake_cmd.rs:201`、`cmd/csv_import_cmd.rs:308`・`:362`・`:438`・`:489`、`cmd/integrity_cmd.rs:56`、`cmd/daily_report_import_cmd.rs:291`、`cmd/sales_cmd.rs:117`・`:333`・`:352`。
- `scan_register_sd`（§45.6a の手順 1・2・3・4。手順 2a は作らない）と `parse_and_validate_daily_report_from_sd`（§45.6b）、`RegisterSdScanResponse`。`DailyReportSourceFileRequest.source_path`（`#[serde(default)]`、§45.3。定義 `cmd/daily_report_import_cmd.rs:17`、test の helper `:243`）。commit に `app: tauri::AppHandle` と手順 3a、test 用の `commit_daily_report_import_with_state` に `app_data_dir`。`From<BizError> for CmdError` に `SourceCopyFailed` → `CmdError::internal`（§45.7 の固定の文）。
- 登録: `lib.rs:277` の `collect_commands!` と `:1272` の `tauri::generate_handler!` の両方に 2 command（45 §45.8。`scripts/check-command-drift.sh` の 4 集合の一致）。`cd src-tauri && cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成（手で編集しない）。

### S5 frontend（`src/features/daily-report-import/`）

- `types.ts`: `DailyReportErrorRecoverTo` に `"sd_list"`（今は `types.ts:4` の `"idle" | "preview"`）、状態に `scanning`・`sd_list`（UI-07-D15 (5)）。`reducer.ts` の遷移（`import_failed`〈`:56`〉・`dismiss_error`〈`:77`〉は変えない）。
- `hooks/useDailyReportImportFlow.ts`: `scanRegisterSd`・`parseAndValidateDailyReportFromSd` の mutation、SD から来た parse の失敗はすべて recoverTo `sd_list`（kind・message で分岐しない）、`decideRecoverTo`（`:35`）は変えない（写しの失敗は `internal` で preview に戻る）。予備の経路は UI-07-D16 の選択の一覧（55 の (a)〜(f)、2026-10-17）で、dialog の path を各要素の `source_path` に入れる（今は `:207` で `extractFilename` だけを送る）。`selectFiles`（`:173`）は外す。「場所を選ぶ」は `@tauri-apps/plugin-dialog` の `open({ directory: true })`（capability は既存の `dialog:allow-open`、変えない）。
- `DailyReportImportPage.tsx`: 「SD から読む」・「場所を選ぶ」・一覧（状態の label と icon、上の文の (a)〜(c)、読まなかった file の件数）・SD を戻す案内・「ファイルを選んで取り込む」の補助のリンクと選択の一覧・置き換えの確認の dialog（`src/components/ui/alert-dialog.tsx`）。
- 既存 test の書換え（assert は弱めない）: `hooks/useDailyReportImportFlow.test.tsx` の `selectFiles` を使う 6 か所（`:212`・`:412`・`:459`・`:491`・`:558`・`:615`）を `chooseFiles` と dialog の mock に、3 つ一度の件数の検査の test（`:232`〜`:387` の `chooseFiles` の test）を 1 つずつの選択に、期待の payload（`:395`〜`:397`）と `DailyReportImportPage.flow.test.tsx:136`〜`:138` に `source_path` を足す。`DailyReportImportPage.test.tsx` の hook の mock の `selectFiles`（`:15`・`:98`・`:247`）を外す。`reducer.test.ts` に遷移を足す。新設: `DailyReportImportPage.sd.test.tsx`・`DailyReportImportPage.files.test.tsx`（Matrix）。
- 文言の衝突: 新しい label を `rg -F '<語>' src --glob '*.test.*'` で当てた（2026-10-17）。「取込み済み」は `DailyReportImportPage.test.tsx:413` の preview の badge の matcher と同じ語だが、一覧（`sd_list`）と preview は同時に描かれない状態なので衝突しない（SD の一覧の test は `within` で行を絞る）。「確認する」「外す」は他の画面の test にだけある。ほかの新しい語（「SD から読む」「場所を選ぶ」「取り込めます」「同じ精算を取込み済み」「ファイルがそろっていません」「読めません」「新しい精算はありません」「読み終わりました」「置き換える」「読まなかったファイル」「ファイルを選んで取り込む」）は 0 件。

### S6 設計正本の「未実装」の注記を現行の記述へ直す（実装と同じ PR）

- 29 §29.7.1（`:216` の「未実装」と `:218` の登録の義務の文）・§29.8.1（`:399`）、45 §45.4 の「今の実装は…」（`:93`）、55 §55.0 の手順 2 の行番号の参照と §55.1 の `DailyReportImportPage.tsx`（`:99`）・`types.ts`（`:100`）の行、37 §37.4 手順 6 の「今の `commit.rs:83-85` は…」、pos-tables §12b の `settlement_no` の行の「SD 直読みの runtime の lane」、22 §17 の版の番号（merge の時点の番号に）。
- 37 §37.9 手順 10・45 §45.6a 手順 2a の「SD 直読みの runtime の lane は…」の文は残す（PLU の runtime の lane が実装の後に外す）。
- `docs/spec/requirements.md` の REQ-401 の部品の列（今は `UI-07, IO-07, BIZ-08, CMD-12, BIZ-03`）に `IO-09`・`IO-10` を足すなら `cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成する（足すかは Writer。足さなくても test の REQ-401 は今どおり当たる）。

### 本 commit（plan-first）で変えた正本

| file | 変更 |
|---|---|
| `docs/function-design/37-biz-daily-report-import-service.md` | §37.3 手順 9 に `sd_source_files` を詰める手順（P3 (1)）、BIZ-08-D5 の保証の範囲に TX の中で拒んだ束の写し（P3 (2)）、§37.4 手順 2b の行番号の参照を外した、§37.9 手順 10 の実装の lane、更新履歴 |
| `docs/function-design/29-io-daily-report-parser.md` | §29.7.3 の `RegisterSdError::Io` の `relative_path` の意味（P3 (3)）、IO-07-D5 の `i64` の範囲と `0000` |
| `docs/function-design/45-cmd-daily-report-import.md` | §45.6a 手順 2a の実装の lane、更新履歴 |
| `docs/function-design/55-ui-csv-import.md` | UI-07-D16 の選択の一覧の細部と文言、`selectFiles` を外す、更新履歴 |
| `docs/function-design/22-mnt-migration.md` | §17（MNT-03-D15、`settlement_no` の migration、番号の決め方、DB の作り直しとの関係） |
| `docs/db-design/pos-tables.md` | §12b の `settlement_no` の行から 22 §17 へ、更新履歴 |
| `docs/backlog.md` | 「SD 直読みの runtime」の P3 4 件を直した旨と、P1・P4 の採取の見込み |

P3 (4) は archive の packet の記述の誤りで、IO-10 の task spec は `docs/architecture/io-task-specs.md:288` に既にあった。本 packet の Contract Ledger は IO-07-D5 の位置を 29 §29.2 の末尾と書く。

### 節の所有表（並走の lane と重なる file）

| file | 本 lane が所有する節 | 他の lane |
|---|---|---|
| `docs/function-design/37-biz-daily-report-import-service.md` | §37.2 の `DailyReportInputFile`・`CachedDailyReportPreview`・`SdSourceFileForCopy`、§37.3 手順 1a・4（BIZ-08-D6）・8（BIZ-08-D4）・9、§37.4 手順 2a・2b・4a・6、§37.7 の D-111 の行、§37.8 の D-111 の行、§37.9 の手順 1〜10 と BIZ-08-D3〜D6・preview への接続 | 363（日報の紙と意味づけ）は部門・総売・支払の意味（§37.3 手順 6・7 等）。364（一括取込み）は §37.9 の「Z004 と EJ への引継ぎ」の段落と新しい節。本 lane は引継ぎの段落を触らない |
| `docs/function-design/29-io-daily-report-parser.md` | §29.2 の `settlement_no` と IO-07-D5、§29.7（IO-09）、§29.8（IO-10） | 363 は IO-07-D4（鍵）と §29.4（項目の意味）。364 は §29.7 の上に載る新しい契約を書くが D-111 の契約を変えない（発注 364） |
| `docs/function-design/45-cmd-daily-report-import.md` | §45.2・§45.3 の `source_path`・§45.4・§45.6a・§45.6b・§45.7 の `SourceCopyFailed`・§45.8 | 364 が一括取込みの command を足すなら新しい節 |
| `docs/function-design/55-ui-csv-import.md` | §55.0 の日報の行と「日報取込みの利用者フロー」、UI-07-D12・D15・D16、§55.1 の日報の 3 行、更新履歴の本 lane の行 | 364 の EJ の閲覧の画面は新しい節。363 の紙の印刷は別の文書か新しい節 |
| `docs/db-design/pos-tables.md` | §12b の `settlement_no` の行と冪等性の行、更新履歴の本 lane の行 | 363 は §12c〜§12e。364 は Z004・EJ の節 |
| `docs/function-design/22-mnt-migration.md` | §17 | 原価の lane（vB）・棚卸しの runtime は §16 と自分の新しい節 |
| `docs/backlog.md` | 「SD 直読みの runtime」の項目 | 各 lane が自分の項目だけ |
| `src/lib/bindings.ts`（生成物） | 本 lane の 2 command と DTO | 365（単位の語の直し）も再生成する。衝突は手で解かず、取り込んだ後に再生成する（D-098） |
| `src-tauri/src/cmd/mod.rs` ほか `AppState` の 15 か所 | `register_sd_scan_cache` の field | 他の lane が `AppState` に field を足すなら merge の順で両方を残す |

## Non-scope

- 37 §37.9 手順 10・`plu_register_z004s`・45 §45.6a 手順 2a・BIZ-04 `refresh_plu_register_snapshot_from_sd`（D-117、PLU の書出しの見直しの runtime）。
- Z004 の SD からの取込み（BIZ-03、D-118 の 32 の新契約）、EJ の取込み・閲覧、一括取込み（D-121）。
- `XZ_BKUP` へ移す操作（(b) の lane）。`io::register_sd` に書込みの API を足さない。
- 写しの保持・削除・backup（未決 A・B）、`docs/function-design/71-mnt-backup.md` の変更（backup は DB の 1 file のまま）。
- `docs/Plans.md`（D-097）、`docs/decision-log.md`（新しい決定は無い）。

## Acceptance Criteria

baseline は 2026-10-17 の HEAD `f5d7aaf4` + 本 commit の docs で、各 command を逐語で実行した。

- AC1（IO の test）: `cd src-tauri && cargo test --lib -- io::register_sd io::pos_source_copy` が exit 0 で、Matrix の `register_sd::*`・`pos_source_copy::*` の行の test がすべて PASS。baseline: `test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 1239 filtered out`（module が無い）。
- AC2（SD に書かない）: Matrix の `register_sd::module_uses_only_allowed_fs_api` と `register_sd::scan_leaves_tree_unchanged` が PASS し、Matrix に挙げた mutant（`File::create`・`fs::copy`・`OpenOptions::new()`・`use std::io::Write;`・`set_modified` のどれかを module に足す）で red になることを Final Review で実注入して確かめる。
- AC3（BIZ・DB・CMD の契約）: `cd src-tauri && cargo test` が exit 0 で、Matrix の `daily_report_parser::settlement_no_*`・`scan::*`・`daily_report_import_service::*`（D4・D5・D6・手順 1a・手順 9）・`sales_repo::*settlement*`・`migration::adds_daily_report_settlement_no_nullable`・`daily_report_import_cmd::*` の行の test が PASS。
- AC4（層）: `cd src-tauri && cargo test --test architecture_test` が exit 0（baseline: `test result: ok. 3 passed; 0 failed`）。`cmd` が `io::register_sd` を use しない。
- AC5（command と bindings）: `rg -n 'scanRegisterSd|parseAndValidateDailyReportFromSd' src/lib/bindings.ts` が 2 つの command を返す（baseline: hit 0、exit 1）。`cd src-tauri && cargo run --bin generate_bindings` の後に `git diff --exit-code -- src/lib/bindings.ts` が exit 0（生成物と一致）。
- AC6（登録と設計照合）: `rg -n 'io::register_sd|io::pos_source_copy' src-tauri/tests/design_compliance_test.rs` が 2 つの module を返す（baseline: hit 0、exit 1）。`cd src-tauri && cargo test --test design_compliance_test` が exit 0（baseline: `test design_code_compliance_phase_a ... ok`）。`cd src-tauri && cargo run --bin generate_traceability -- --check` が `ERROR 0 件`（baseline: `traceability check: OK（ERROR 0 件 / WARN 0 件）`）。
- AC7（frontend）: `npx vitest run src/features/daily-report-import` が全 PASS で、`DailyReportImportPage.sd.test.tsx`・`DailyReportImportPage.files.test.tsx` を含む（baseline: `Test Files  4 passed (4)`）。`npm run typecheck && npm run lint && npm run format:check && npm run build` が exit 0。
- AC8（docs）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0（command registry の drift を含む。WARN は報告）。
- AC9（未実装の注記の sweep）: `rg -n 'io::register_sd`、未実装|io::pos_source_copy`、未実装|UI-07-D15、未実装' docs/function-design` が hit 0（baseline: 3 件 = `29-io-daily-report-parser.md:216`・`:399`、`55-ui-csv-import.md:99`）。
- AC10（L3 の前）: Human Gate の L3 の前に Writer が `cd src-tauri && cargo check --release` を通し、Contract Probe の P1・P4 の結果を本 packet に書く（P1 が不一致なら L3 に進まず design へ戻す）。
- AC11（hosted）: Ready の後の run の `Merge gate` が success（`docs/ci.md`）。

## Design Readiness

- 引用する設計正本（節まで）: 29 §29.2（IO-07-D5、`DailyReportParseResult`）・§29.7.1〜§29.7.8（IO-09-D1〜D4）・§29.8（IO-10）／37 §37.1・§37.2・§37.3 手順 1a・4・8・9・§37.4 手順 2a・2b・4a・6・§37.7・§37.9（BIZ-08-D3〜D6）／45 §45.2・§45.3・§45.4 手順 3a・7・§45.6a・§45.6b（CMD-12-D1）・§45.7・§45.8／55 §55.0 の日報取込みの利用者フロー・UI-07-D12・D15・D16・§55.1／24 §14.14・§14.18a／pos-tables §12b／22 §17（MNT-03-D15）・§16 の「DB の作り直しを 1 回にまとめる順」／`docs/architecture/io-task-specs.md` IO-09・IO-10／`docs/decision-log.md` D-111。
- 必要な設計成果物: function-design（IO-09・IO-10・BIZ-08・CMD-12・UI-07） = existing sufficient、ただし P3 の 3 件・IO-07-D5 の範囲・UI-07-D16 の細部・手順 10 と 2a の実装の lane は updated in this PR／DB（migration） = updated in this PR（22 §17）／SCREEN_DESIGN = existing sufficient（PR #150 で同期済み）／decision-log = 足さない（下）。
- plan にしかない durable な判断の昇格先: 無い。足した文は D-111 の下の正本の細部（22 §17・29・37・45・55）に置き、cross-cutting な新しい決定を作らないので D-124 は使わない。
- 前提・制約と延期した design gap: P1（SD-23、取込み前の原本の形・精算回数・bytes。2026-10-06 版での採取では `XZ_BKUP` の分だけを観測）と P4 は未確認の前提で L3 の前に確かめる（Contract Probe）。窓・写しの未決 A・B・(b) の lane・D-117 の照合は延期で、どれも本 lane の取込みを止めない（SD を読むだけで、CV17 の取込みが続く間 `XZ` の file の数は今と変わらない）。
- 絶対保証の自己点検: 「SD に書かない」の例外は Windows の FAT の最終アクセス日と `System Volume Information`（IO-09-D3 に明記）。「二重に数えない」の例外は手で選んだ `None` の束（layout B）と NULL の既存行だけ（D-111 の Guarantee range）。「写しの無い SD の取込みは無い」は §37.4 手順 2b が TX の前に書き、失敗で止めるので成り立つ。逆向き（写しがあるのに取り込んでいない）はありうると BIZ-08-D5 に書いた（2026-10-17）。
- 判定: ready。上の正本で実装の何を・なぜ・何を棄てたかが答えられ、未解決の設計の問いは無い。

## Registration / Generation Obligations

| 変更対象 | 義務（本 lane） |
|---|---|
| Tauri command | `scan_register_sd`・`parse_and_validate_daily_report_from_sd` に `#[tauri::command]` + `#[specta::specta]`、`lib.rs:277` の `collect_commands!` と `:1272` の `generate_handler!` の両方、`cargo run --bin generate_bindings` |
| function-design doc 新設 | 該当なし（新しい doc を作らない）。既存の `29-io-daily-report-parser.md` の map の行に `io::register_sd`・`io::pos_source_copy` を足す（`design_compliance_test.rs:157`） |
| source / workflow doc 新設・改名・削除 | 該当なし |
| REQ / coverage | REQ-401 の部品の列に IO-09・IO-10 を足すなら `generate_traceability` で 90 を再生成（S6） |
| route | 該当なし（新しい route は無い） |
| operator 画面新設 | 該当なし（既存の日報取込みタブを変える。到達導線は変わらない） |
| migration | `db/schema_v9.rs`・`db/mod.rs`・`migration.rs` の `migrations()`、22 §17 の版の番号 |

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | SD の配置・名前・形は IO-09。core は精算ごとの束・取込み済み・同じ精算の拒否（D-111 の Compatibility のまま） | — |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 事実は 29 §29.7.2（2026-10-06 版での SD の採取）。SD-23・SD-24 の原本の分は未確認の前提（TD-278、P1） | Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 読取りの途中の失敗は全体の失敗、scan は 30 分、写しの失敗は preview に戻る、TX の中で拒んだ束の写しは残りうる（`copy_path` が正本） | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | Ordinary Operation の表。(b) まで CV17 の取込みも続く | L3 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | `io::register_sd`・§37.9 の組分けを取り替える | — |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | test は合成の tree。P1・P4 は hash と名前の一覧だけ | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 二重計上を D4・D6 で止める。日報は在庫を動かさない（D-025、変えない） | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 取外し可能な drive の自動の発見、実 SD の写しを読む、写しが置き場にできる、画面の目視 | 下の Test Plan の L3 |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | drive の列挙は Windows だけ（既存の `windows-sys` の pin）。Windows 以外は空の列で、test は `resolve_register_sd_root` | — |

## Boundary / Wire Contract

- producer: BIZ-08 §37.9（`DailyReportSdScan`）、CMD-12 §45.6a・§45.6b
- consumer: UI-07（`scanRegisterSd`・`parseAndValidateDailyReportFromSd`、予備の `parseAndValidateDailyReport` の `source_path`）
- wire type: `RegisterSdScanResponse { scan, scan_token }`、`DailyReportSdScan { volume_label, scanned_from, candidates, skipped_unknown_count }`、`DailyReportSdCandidate { candidate_key, path_date, report_date?, source_filenames, status }`、`DailyReportSdCandidateStatus`（5 値の string union）、`DailyReportSourceFileRequest.source_path?`。既存の `DailyReportPreviewResponse` を返す
- internal type: `DailyReportSdScanSnapshot`（AppState）、`settlement_no: Option<i64>`（IO-07 → cache → DB。wire に出さない）、IO-09 の型（BIZ の中だけ）、`source_files_json` の内部の serialize 用の型
- precision/range: `settlement_no` は `i64`（収まらない値は `None`、29 IO-07-D5）。`skipped_unknown_count` は `i64` で、SD の file の数なので JavaScript の安全な整数の範囲を出ない。日付は YYYY-MM-DD
- round-trip path: scan → candidate_key → snapshot の 3 本 → 既存の preview → commit（DB に `settlement_no`、写しに `copy_path`）
- invalid input: 空の `selected_path` は validation、期限切れの scan_token は import_error（固定の文）、snapshot に無い candidate_key は validation、UUID でない token は validation
- compatibility: 既存の command と DTO の wire は `source_path`（省略可、`#[serde(default)]`）のほかは変えない。`daily_report_imports` の既存行は NULL

## Test Plan

Test Design Matrix: [2026-10-17-sd-direct-read-runtime](test-matrices/2026-10-17-sd-direct-read-runtime.md)。

- targeted tests: AC1〜AC7 の command。実装中は `bash scripts/local-ci.sh changed`。
- negative tests: Matrix の Negative Paths。
- compatibility checks: 既存の手で選ぶ経路・同日追加の確認・取消の既存 test（`biz/daily_report_import_service/tests.rs`、`DailyReportImportPage*.test.tsx`）を回帰で回す。
- data safety checks: 実 SD・`EcrDatas` の file の中身、実の名前の一覧、hash の値を repo に入れない。
- main wiring/integration checks: `scan_register_sd` → BIZ-08 §37.9 → IO-09、`parse_and_validate_daily_report_from_sd` → §37.3、commit → IO-10、`lib.rs` の 2 つの登録。
- Human Gate に L3 があるので、Writer は L3 の前に `cargo check --release` を通す（AC10）。

**L3（Windows の実機、owner の目視と PASS / FAIL。Draft のまま溜め、他の lane とまとめて 1 回の session で行う）**:

| # | 確かめること（観測できる合格の基準） | 到達経路 | 入力物 | 依存する既知の backlog・前提 |
|---|---|---|---|---|
| L3-1 | 取外し可能な drive の SD（か USB メモリ）を差して「SD から読む」を押すと、自動で見つかり、SD を戻す案内と一覧が出る | 売上データ取込み → 日報取込みタブ →「SD から読む」 | 合成の SD の tree（`CASIO\SR500_550_4000\XZ\yyyy\mm\` に合成の Z001/Z002/Z005 の 1 組。Matrix の fixture と同じ生成で Coordinator が作り、Ready の依頼と同時に渡す）を入れた USB メモリ | 無い |
| L3-2 | 「場所を選ぶ」で SD の写しの folder を選ぶと一覧が出て、「取り込めます」の行から取り込め、`%APPDATA%\com.kosei.inventory\pos-sources\casio-sr-s4000\sd\XZ\…` に 3 本ができる。同じ精算をもう一度読むと「取込み済み」 | 同上 →「場所を選ぶ」→ 写しの folder | 2026-10-18 版での SD の写し（owner の手元、`.local/reports/visit-2026-10-19/sd-copy.md` の出力。repo に入れない）。開発の DB はその精算を取り込んでいないこと | P1（取込み前の原本の精算回数が読める）。写しが無いときは合成の tree で代える |
| L3-3 | 一覧の状態の label と icon、上の文、予備の経路の 1 つずつの選択・「外す」・置き換えの確認の dialog の見え方 | 同上 | L3-1 の tree に、Z002 の無い組と BOM 付きの組を足した合成の tree | 無い |
| L3-4 | 店の PC で読んだ後に SD をレジへ戻し、次の精算ができる | 店 | 店の SD | 本番の DB が無い今は店の運用に載らない（`docs/project-memory.md`）。導入の時の確認へ送るかを Ready の依頼と同じ回で owner に諮る（既定: 送る。残余は IO-09-D3 の source の検査と読取り専用の open で抑える） |

L3 Eligibility: L3-1〜L3-3 は Windows の実機でしか観測できず（drive の種類・native dialog・app data の folder）、新しい道具を要さず、故障の注入を含まない。故障の系（読めない file・写しの失敗・SD を抜いた後）は自動 test（Matrix）。

## Review Focus

- Ordinary Operation が正常な条件で目的を達成できるか、危険な結果を出さないか（別々に）。
- 37 §37.9 手順 10・45 §45.6a 手順 2a を作らないことが、PLU の runtime の lane の後付けを妨げないか（snapshot の型に field を足すだけで載るか）。
- IO-09-D3 の許可の列の source の検査が、別名の import・glob の import を拾うか。
- BIZ-08-D4・D6 が P1 の前提が外れた場合も取り込む順に依らず二重取込みを止めるか。
- UI-07-D16 の 2026-10-17 の細部（一覧の寿命、重複の拒否、置き換えの確認）が既存の選択の記憶と矛盾しないか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-111 | `docs/decision-log.md` D-111 | S1〜S5 | Matrix 全体 | L3-1〜L3-3 |
| IO-07-D5 | 29 §29.2 の末尾（IO-07-D5、2026-10-17 の `i64` の範囲） | S1 `daily_report_parser.rs` | `settlement_no_*` の 4 行 | 非対象 |
| IO-09-D1 | 29 §29.7.4 | S1 `register_sd.rs` | `resolve_*` | L3-1 |
| §29.7.4 手順 4・5 | 29 §29.7.4（`locate_in_register_sd_roots`・`check_selected_file_present`、§29.7.3 の `Io` の注記） | S1 | `locate_in_roots_maps_paths`・`check_selected_file_present_rejects_missing_and_dirs` | 非対象 |
| IO-09-D2 | 29 §29.7.5 | S1 | `list_*` | 非対象 |
| IO-09-D3 | 29 §29.7.6 | S1 | `module_uses_only_allowed_fs_api`・`scan_leaves_tree_unchanged`・`read_rejects_escaping_paths`・`read_stops_at_limit` | L3-4（導入の時へ送る候補） |
| IO-09-D4 | 29 §29.7.6 | S1 | `read_measures_shape` | 非対象 |
| IO-10 | 29 §29.8、`docs/architecture/io-task-specs.md` IO-10 | S1 `pos_source_copy.rs` | `pos_source_copy::*` | L3-2 |
| MNT-03-D15 | 22 §17、pos-tables §12b | S2 | `migration::adds_daily_report_settlement_no_nullable` | 非対象 |
| 24 §14.14・§14.18a | 24 §14.14・§14.18a | S2 `sales_repo.rs` | `sales_repo::*settlement*` | 非対象 |
| BIZ-08-D3 | 37 §37.9 手順 1〜9 | S3 | `scan::*` | L3-1〜L3-3 |
| BIZ-08-D4 | 37 §37.3 手順 8・§37.4 手順 4a・6、pos-tables §12b | S2・S3 | D4 の行 | 非対象 |
| BIZ-08-D5 | 37 §37.4 手順 2b・6、BIZ-08-D5（保証の範囲の 2026-10-17 の文を含む）、45 §45.7 | S3・S4 | D5 の行・`rejected_in_tx_leaves_copy_but_no_copy_path` | L3-2 |
| BIZ-08-D6 | 37 §37.3 手順 4・§37.4 手順 2a・§37.9 手順 7 | S3 | D6 の行 | 非対象 |
| §37.3 手順 1a・9 | 37 §37.3 | S3 | 手順 1a の行・`cached_preview_holds_only_sd_files` | 非対象 |
| CMD-12-D1 | 45 §45.2・§45.3・§45.4 手順 3a・§45.6a（手順 1〜4）・§45.6b・§45.7・§45.8 | S4 | `daily_report_import_cmd::*`、`architecture_test` | 非対象 |
| UI-07-D12 | 55 UI 判断 ID | S5 | UI の行 | 目視（L3-3） |
| UI-07-D15 | 55 UI 判断 ID、55 の利用者フロー手順 2 | S5 | `DailyReportImportPage.sd.test.tsx`・`reducer.test.ts` | L3-1・L3-3 |
| UI-07-D16 | 55 UI 判断 ID（2026-10-17 の (a)〜(f)） | S5 | `DailyReportImportPage.files.test.tsx`・hook の payload | L3-3 |
| 既存 BIZ-08-D1・D2、IO-07-D3、SPEC-SDI（同日追加・insert-only・per-import rollback）、UI-07-D13・D14 | 37 §37.3〜§37.5、55 | 変えない | 既存の test（回帰） | 非対象 |
| 隣接の除外: 37 §37.9 手順 10・45 §45.6a 手順 2a（D-117） | 37・45 | PLU の書出しの見直しの runtime | 非対象 | 非対象 |
| 隣接の除外: Z004 の識別（D-118、32 の新契約）・Z004 タブの一時停止（SPEC-STOP-D4） | 32、55 §55.0 | 変えない | 非対象 | 非対象 |
| 隣接の除外: backup の対象（71 §71.1 の注記） | 71 | 変えない（写しは backup に入らない） | 非対象 | 非対象 |

## Contract Probe

起票の時点で実験していない。以下の 2 つは設計 lane（PR #150）から引き継いだ未確認の前提で、どちらも「危険な結果を出さないか」には効かない（前提が外れても BIZ-08-D4・D6 が安全側に止める）ので Plan Gate を止めず、「正常な条件で目的を達成できるか」に効くので L3 の前に確かめる（AC10。発注 367）。

- P1（SD-23・SD-24 の原本の分。取込み前の `XZ` の原本は 3 本とも精算回数が読め、取込みの後の `XZ_BKUP` の同じ file と同じ bytes か）: **未確認（結果は無い）**。手順: (a) 2026-10-18 版での SD の写し（owner が精算の後、CV17 の取込みをせずに預かる道 1、repo 外の回答台帳 TD-304）の `XZ` の Z001/Z002/Z005 の 1 組を、合成の tree と同じ読み方（IO-09 の形の検査と IO-07 の精算回数）で手元で読み、形の flag と「精算回数が 3 本とも読めてそろうか」だけを出す（中身は出さない）。(b) 次の預かり（か店 PC の `EcrDatas` の同じ file の写し）の `XZ_BKUP` の同じ file の SHA-256 と、(a) の file の SHA-256 を manifest どうしで比べる。合否: (a) が読めて (b) が一致なら合格。(a) が読めない、または (b) が不一致なら L3 に進まず、BIZ-08-D4・D6 を見直しに design へ戻す（owner に諮る、予備の介入）。(a) だけ取れて (b) がまだのときは、L3-2 は (a) の結果で進め、(b) は取れた時点で本 packet に書く（D4 の照合は bytes が違っても精算回数で止まる）。手引き: `.local/reports/visit-2026-10-19/sd-copy.md` の 6。
- P4（スマホへの送信の失敗のときにレジが「SD カードへバックアップ」した file が、規則に合わない名前の file として増えるか）: **未確認（結果は無い）**。2026-10-18 版での SD の写しの `p4-other-names.txt`（名前の一覧だけ）で、2026-10-06 版での採取に無かった規則外の名前が増えたかだけを見る。設計は分岐しない（`Unknown` として数え、読まない。IO-09-D2）。規則どおりの名前で増えたなら通常の候補になり、同じ bytes は 1 つにまとまる。増えたものが Z の名前の規則に近い別物なら owner に諮る（予備）。
- 観測済みで probe の要らない前提: SD は取外し可能な drive として見える（SD-25）、`XZ_BKUP` = `EcrDatas`（SD-22）、名前の形・大文字の `EJ`・同じ日の複数の Z・未知の名前の file（SD-02・03・07・08）。どれも 2026-10-06 版での SD の採取。`windows-sys` の `Win32_Storage_FileSystem` は `src-tauri/Cargo.toml:48` で確かめた（2026-10-17）。

## Data Safety

- tracked に書かない: 実 SD・`EcrDatas` の file の中身、実の file 名の一覧、hash の値、実 JAN・商品名・金額、店主の発言の原文。P1・P4 の結果は合否と質的な要約だけを本 packet に書く。
- local-only: 2026-10-18 版での SD の写し（owner の手元と `~/downloads/inventory-field-check/approved-readable/raw-private/`）、回答台帳、開発の DB と `pos-sources/`。
- synthetic-only: test と L3-1・L3-3 の SD の tree（名前の形だけを 2026-10-06 版での採取に合わせ、中身は合成）。

## 新しい契約の文と境界の 4 観点

本 commit で足した文を、安全な整数の範囲・0 の表示・失敗の時点と順序・単位や種類の混在で一巡した。

| 文 | 範囲 | 0 | 失敗の時点と順序 | 混在 |
|---|---|---|---|---|
| IO-07-D5 の `i64` に収まらない値は `None`、`0000` は `Some(0)` | `u64` → `i64` の境で `None`（Matrix に `i64::MAX` と + 1） | 0 を値として保つ（表示はしない） | parse の中（D3 の判定の後） | 型は整数だけ |
| §37.3 手順 9 の `sd_source_files` | — | 3 本とも PC なら空（commit は写さない） | 手順 1a の後 | SD と PC の混ざった束は SD の分だけ |
| BIZ-08-D5 の拒んだ束の写し | — | — | 2b（写し）→ 4・4a・5（TX の中の拒否）。正本は `copy_path` | — |
| 22 §17 の migration | 列は NULL を許す INTEGER | 既存行は NULL（0 で埋めない） | 実行器の TX。失敗で版を記録しない。vB・棚卸しの migration とどちらが先でも止めない | — |
| UI-07-D16 (a)〜(f) | 一覧は系列ごとに 1 つ（最大 3） | 0 件で「確認する」は押せない | 読めない・大きすぎる file は足す前に止める。preview へ進むと一覧は空 | 系列の決まらない名前・同じ系列の重複を拒む |
| 37 §37.9 手順 10・45 §45.6a 手順 2a の実装の lane | — | — | 本 lane の scan は手順 9 の後に返す | — |

## Open Questions

- owner 向け（今は無い。L3 の回で諮る）: L3-4 を導入の時へ送るか（a 送る〈推奨〉／b 今の L3 で店で行う。答えが無ければ a）。
- agent 側: migration の番号（merge の順で決める。22 §17）。Contract Audit の 2 本目を採るか（Coordinator）。REQ-401 の部品の列に IO-09・IO-10 を足すか（Writer、S6）。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
