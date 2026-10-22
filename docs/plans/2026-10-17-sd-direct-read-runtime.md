# Plan Packet: SD 直読みの runtime（毎日の売上データをレジの SD から読む、D-111 の実装）

wave に属さない単独の lane（2026-10-17 起票。owner の「動かせるだけ動かす」〈repo 外の回答台帳 TD-304〉で Coordinator が同時に起票した 6 本の 1 本）。設計は merge 済み（PR #150、[decision-log](../decision-log.md) D-111。設計 lane の packet と Matrix は `docs/archive/plans/2026-10-06-sd-direct-read.md`・`docs/archive/plans/test-matrices/2026-10-06-sd-direct-read.md`）で、本 lane はその既決の契約を実装する。branch は `agent/sd-direct-read-runtime`（main `f5d7aaf4` から起票し、2026-10-23 に main `eed07d37` を取り込んで本 packet を今の code と migration の版に当て直した）。2026-10-23 の並走は `agent/stocktake-count-runtime-b`（PR #188、棚卸しの runtime の b1、migration vZ）と `agent/backup-offsite-runtime`（PC の外の控えの runtime、D-114）で、owner の決定（repo 外の回答台帳 TD-384）で本 lane は並走の候補。本 lane は新しい決定の番号を使わない（下の Design Readiness）。

**規模と手法（1 lane のまま。実装の順を S1〜S6 に固定する）**: 2026-10-17 に本 worktree（HEAD `f5d7aaf4`）で数え、2026-10-23 に main `eed07d37` を取り込んだ head で同じ command を数え直して同じ件数だった（原価 vB・棚卸し (a) は下の構築の箇所を増やさず、行の位置だけを動かした）。形の変わる型を作る・読む既存の Rust は 19 file（`rg -l 'AppState \{|NewDailyReportImport \{|DailyReportInputFile \{|DailyReportSourceFileRequest \{|CachedDailyReportPreview \{|commit_daily_report_import\(|DailyReportParseResult \{|enum BizError|impl From<BizError> for CmdError|collect_commands!|daily_report_imports \(' src-tauri/src src-tauri/tests | sort | wc -l` → `20`。うち `db/schema_v4.rs` は CREATE 文の hit で変えない）に、登録の 3 file（`io/mod.rs`・`db/mod.rs`・`tests/design_compliance_test.rs`）と新設 3〜4 file（`io/register_sd.rs`・`io/pos_source_copy.rs`・`db/schema_v11.rs`〈番号は 22 §17。merge の順で取り直す〉、scan を分けるなら `biz/daily_report_import_service/scan.rs`）と、版の期待を持つ既存の test の 3 file（下の S2）。frontend は `src/features/daily-report-import/` の 8 file（`find src/features/daily-report-import -type f | sort | wc -l` → `8`。2026-10-23 の Plan Review round 1 の是正で数え直した。前に書いた `rg -l 'daily-report-import|DailyReportSourceFileRequest' src --glob '!src/lib/bindings.ts'` の `7` は、この directory の外の file〈import の path の文字列を含む `csv-import`・`query-keys.ts` 等〉を数えていて、directory の 8 file を数えていなかった）と新設の test 2 file、生成物の `src/lib/bindings.ts`。wire の型は新しい command 2 つと DTO 4 つ、既存の DTO への省略可の field 1 つ（`DailyReportSourceFileRequest.source_path`）。DB は NULL を許す列 1 つ（migration 1 つ）。画面は既存の日報取込みタブ 1 つ（新しい route・画面は無い）。横断の約束（範囲・0・失敗の時点と順序・種類の混在）がかかる経路は、`settlement_no`（IO-07 → cache → DB、wire に出さない）と、写しの失敗の順序（TX の前）と、SD から来た失敗の戻り先（UI の `sd_list`）の 3 つで、どれも 1 つの正本の節が持つので、別の横断の表は作らない（下の「新しい契約の文と境界の 4 観点」で一巡した）。
- 分けない理由: backend（IO-09・IO-10・BIZ-08・CMD-12・migration）だけを先に入れる切れ目は、画面から呼ばれない command と、写しの規則の効く手で選ぶ経路（UI-07-D16 の `source_path`）の片側だけの main を作り、L3 が 2 回になる（owner は 2026-10-20 から手が使いにくい。介入の上限 9、TD-296）。1 lane で順に積み、L3 を 1 回にする。
- 実装の順: S1 IO（IO-07-D5・IO-09・IO-10）→ S2 DB（migration・`sales_repo`）→ S3 BIZ（scan・D4・D5・D6・手順 1a・手順 9）→ S4 CMD と登録・bindings → S5 frontend → S6 設計正本の「未実装」の注記を現行の記述へ直す。

## Workflow State

- Phase: plan-gate
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
4. plan-draft → plan-gate（2026-10-23、Coordinator、本 commit）: main（`eed07d37`）への同期と、Scope・AC を今の code と migration の版へ当て直した（D-114 の 71 MNT-01-D10・§71.11.3 を前提として 29 §29.7.4 と IO-09-D3 を直した）。Contract Probe P1 (a)・P4 は合格（下の Contract Probe）、P1 (b) は未確認のまま。owner の判断事項は無い。Plan Review round 1 に出す。Codex は利用上限で 2026-10-24 まで使えないので、round 1 は fresh Opus 5.5 で始め、Codex が戻った時点で同じ round の Codex 分を足す（`docs/AGENT_OPERATING_MANUAL.md` §3.3）。
5. plan-gate のまま是正（round 1、2026-10-23、Coordinator、本 commit）: round 1（Claude 側 fresh Opus 5.5 だけ。Codex は利用上限で 2026-10-24 まで使えず、`docs/AGENT_OPERATING_MANUAL.md` §3.3）の reject を起草役が `881700ca` で直した（下の Review Response）。設計の方向は変えないので plan-gate に留め、round 2（fresh Opus 5.5 + Codex）で再 review する（`docs/DEV_WORKFLOW.md` Workflow State「a plan-gate rejection corrected in place stays at plan-gate」）。

## Owner Effort Budget

- 介入回数上限: 9（repo 外の回答台帳 TD-296 の 5a。既定 6 から上げた）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 9 | 0（2026-10-17 起票時。plan-approved は Coordinator が進める〈TD-296 の 4a〉ので数えない） | 4（L3 の 1 round 1、L3-4 を導入の時へ送る残余の受容 1、Ready 1、merge 1） | 5（L3 の 2 round 目 1、P1 が不一致のときの設計の見直しの判断 1、P4 で規則外の名前の file が増えたときの判断 1、その他 2） | 9 = 0 + 4 + 5 |

既定値・数え方は `docs/DEV_WORKFLOW.md` `Owner Effort Budget`。承認依頼は `この change での介入 N 回目 / 予算 9 回` と「承認すると、売上データ取込み画面でレジの SD を読み、精算を選んで日報を取り込めるようになる」の 1 文。owner は 2026-10-20 から手が使いにくいので（TD-296 の 1a）、問いは記号か短文で答えられる形にする。L3 は D-124 のとおり、本 PR が merge の train の先頭に来て最新の `origin/main` を取り込んだ head で頼む。他の PR と 1 回の依頼に束ねるのは `docs/DEV_WORKFLOW.md` `## Wave Operation` の条件（先に merge する全ての PR と path を共有しない）を満たすときだけで、#188 とは `lib.rs`・`db/migration.rs`・`src/lib/bindings.ts` 等を共有する見込み（下の節の所有表）なので、#188 の後に束ねずに頼む見込み。

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
- 既存の手で選ぶ経路（PC 上の file）の取込み・同日追加の確認・取消が変わる。ただし、同じ対象日・同じ精算回数で別の bytes の束を BIZ-08-D4 で拒むのは D-111 の意図した変更で、ここに当たらない（精算回数の違う同じ日の束の追加確認と、精算回数の読めない束〈`None`〉の扱いは変わらない。既存の test の fixture の扱いは S3）。
- CMD が IO を直接呼ぶ、規則が CMD・UI にある（`src-tauri/tests/architecture_test.rs`）。

### 非目的

- 取込み済みの Z・EJ を `XZ_BKUP` へ移す操作（D-111 (1) の (b)、`docs/backlog.md` の別項目）。CV17 の取込みは (b) まで店が今の運用で続ける（D-111 の運用の制約）。
- PLU の占有の照合（37 §37.9 手順 10、45 §45.6a 手順 2a、D-117）と、Z004・EJ の取込み・計数の置き場（D-118）。Z004・日報・EJ の一括取込みと EJ の閲覧（D-121 の design lane）。
- 写しの保持期間・削除（D-111 の未決 A。既定は消さない）。backup・PC の外の控えには写しを入れない（未決 B、D-114 で決まった。71 の冒頭）。窓より前の未取込みの検知。
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
| 「取り込めます」の行 | 「確認する」 | 既存のプレビュー（同日追加の確認を含む） | プレビューが出る | 取込み前の原本の精算回数が読めること（P1 の (a)。2026-10-23 に 2026-10-18 版での SD の写しで合格） |
| プレビュー | 「取り込む」 | 日報が保存され、3 本の写しが `pos-sources/` に残る。「日次売上を見る」へ進める | 結果が出る | 写しの失敗は preview に戻って同じ token で再試行（55 の日報取込みの利用者フロー手順 2） |
| 同じ日に 2 回目の精算をした | 同じ操作 | 1 回目は「取込み済み」、2 回目は「取り込めます」 | — | 同じ日の複数の Z（SD-08、2026-10-06 版での観測） |
| SD が読めない・過去の分 | 「ファイルを選んで取り込む」で 1 つずつ選ぶ | 3 つそろうと「確認する」。SD の上の file なら SD の入力として扱う | 3 つそろう | UI-07-D16 |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える。

## owner の判断事項

本 lane で新しく owner に諮る製品の判断は無い。D-111 の判断 1〜5 は 2026-10-06 に、P2・P3 の扱いは 2026-10-07 に決まっている（D-111）。owner に諮るのは L3（manual）・L3-4 を導入の時へ送る残余の受容・Ready・merge だけ（Owner Effort Budget）。P1 が不一致なら設計の見直し（BIZ-08-D4・D6）を owner に諮る（予備）。

## Scope

### S1 IO（`io::daily_report_parser`・`io::register_sd`・`io::pos_source_copy`）

- IO-07-D5: `DailyReportParseResult.settlement_no: Option<i64>`（29 §29.2）。作る所は `src-tauri/src/io/daily_report_parser.rs` の `parse_daily_report_bundle` の `DailyReportParseResult` の構築の 1 か所。今の `settlement_number` は `u64` を返し、D3 の一致の判定はその値で行う（変えない）。そろった値を `i64::try_from` し、収まらなければ `None`（29 IO-07-D5 に 2026-10-17 に足した文）。読む所: `biz/daily_report_import_service/parse.rs`（cache へ）、同 file の test の helper。
- IO-09（新設 `src-tauri/src/io/register_sd.rs`、`io/mod.rs` に `pub mod register_sd;`）: 29 §29.7.3 の型と §29.7.4〜§29.7.6 の 6 関数（`find_register_sd_roots`・`resolve_register_sd_root`・`locate_in_register_sd_roots`・`check_selected_file_present`・`list_register_sd_entries`・`read_register_sd_file`）。Windows の drive の列挙は既存の `windows-sys`（`src-tauri/Cargo.toml` の `[target.'cfg(windows)'.dependencies]`、`=0.61.2`）で、新しい crate を足さない。使う項目と feature（29 §29.7.4 手順 1。2026-10-23 に cargo の cache の windows-sys 0.61.2 の source で置き場を確かめた）: `GetLogicalDrives`・`GetDriveTypeW` は既にある `Win32_Storage_FileSystem`、定数 `DRIVE_REMOVABLE` は `Win32::System::WindowsProgramming` にあるので feature `Win32_System_WindowsProgramming` を足す、`SetThreadErrorMode`・`SEM_FAILCRITICALERRORS`・型 `THREAD_ERROR_MODE` は feature `Win32_System_Diagnostics_Debug` を足す（PC の外の控えの runtime も同じ feature を足すので、先に merge した lane が足し、後の lane は足さない）。drive を見る間は thread の error mode を `SEM_FAILCRITICALERRORS` にして戻す。`CASIO\SR500_550_4000` の folder 名は 1 つの定数にし、71 MNT-01-D10（`mnt::backup`・`mnt::offsite`）と共有する（D-114）。置き場は merge の順に依らず `src-tauri/src/io/mod.rs` の `pub(crate) const`（29 §29.7.4 手順 1。PC の外の控えの runtime (a) の packet〈PR #190〉の所有表の `io/mod.rs` の行と同じ所。本 lane が先なら本 lane が置き、(a) が先なら (a) が置いた定数を `io::register_sd` が使う）。`io::register_sd` の module の中に置かない（置くと MNT が register_sd の module に依存し、(a) が先のときと置き場が変わる）。許可の列の外の API を使わない（IO-09-D3。許可の列に型 `THREAD_ERROR_MODE` を 2026-10-23 の round 1 の是正で足した。`BOOL`・`PCWSTR` は名指しせず推論で書く）。`cfg(windows)` の本体は hosted CI（ubuntu）でも WSL の `cargo check --release` でも compile されない（下の Residual Risk）。`RegisterSdError::Io.relative_path` の意味は 29 §29.7.3 の注記（2026-10-17）。
- IO-10（新設 `src-tauri/src/io/pos_source_copy.rs`、`io/mod.rs`）: 29 §29.8.2 の `save_pos_source_copy` と §29.8.3 の手順（path を決める → `create_dir_all` → 一時 file → rename、上書きしない、同じ bytes は書かない、違う bytes は `~` + SHA-256 の先頭 12 桁）。SHA-256 は既存の `sha2`。
- 設計照合: `src-tauri/tests/design_compliance_test.rs` の `build_doc_to_modules_map()` の `29-io-daily-report-parser.md` の行に `io::register_sd` と `io::pos_source_copy` を足す。新しい `pub fn` は 29 にシグネチャのあるものに限る（無い `pub fn` は設計照合の警告になる）。

### S2 DB（migration・`sales_repo`）

- migration（22 §17 MNT-03-D15）: 新設 `src-tauri/src/db/schema_v11.rs`（番号は merge の時点の次。2026-10-23 の main の最大は v10〈v9 は棚卸し (a)、v10 は原価 vB〉。#188 b1 の vZ も次の版を取るので、先に merge した側が若い番号を取り、後の側が取り直す）、`db/mod.rs` の `mod schema_v10;` の後（`mod` の並びは名前の順）に `mod schema_v11;`、`db/migration.rs` の `migrations()` の最後（v10 の後）に `MigrationKind::Sql` で登録。取り直しの対象（版が 1 つ増えるたびに直す）: file 名と `mod` の行、`migrations()` の登録、最新の版を `10` と期待する既存の test（`db/migration.rs` の `test_migration_req903_is_idempotent`〈3 か所: 1 回目と 2 回目の `MAX(version)`、`schema_versions` の行数〉・`test_migration_req401_v4_creates_daily_report_tables_and_indexes`・`test_migration_req907_v5_seeds_all_plu_slots`・`test_migration_req907_upgrades_v4_database_and_seeds_all_plu_slots`・`test_migration_req903_v8_fresh_database_and_empty_tables`・`test_migration_req903_v8_commit_and_fk_restore_failures`、`db/schema_v9.rs` の `test_migration_req903_vl_fresh_database_has_keys_counts_and_copy_columns`、`db/schema_v2.rs` の `test_v2_req903_applied_on_fresh_db`。`rg -n '\b10\b' src-tauri/src/db/migration.rs` と `rg -n '\(10, 10\)|max_version, 10' src-tauri/src` で 2026-10-23 に挙げた）。vS は `MigrationKind::Sql` なので、`Custom` の migration の source の helper の数を数える `db/migration.rs` の test には足さない。
- `NewDailyReportImport.settlement_no: Option<i64>`（24 §14.14）: 定義は `db/sales_repo.rs` の `NewDailyReportImport`、INSERT は同 file の `insert_daily_report_import`。構築 8 か所（`rg -n 'NewDailyReportImport \{' src-tauri/src` から定義と `-> NewDailyReportImport {` の signature の行を除く。2026-10-23）: 本番 `biz/daily_report_import_service/commit.rs` の `execute_commit`、test は `db/sales_repo.rs` の helper `new_daily_report_import` と `test_get_completed_daily_report_aggregate_req501_propagates_parent_and_line_nulls` の 2 か所、`biz/daily_report_import_service/tests.rs` の `test_daily_report_req401_corrupt_same_date_source_files_metadata_fails_safe`、`biz/sales_service.rs` の helper `seed_daily_report`、`cmd/sales_cmd.rs` の `test_get_daily_sales_cmd_passes_official_report_req501`、`cmd/daily_report_import_cmd.rs` の `test_daily_report_cmd_req401_snapshot_mismatch_deletes_preview_token`（どれにも `settlement_no` を足す。既存の test は `None` で、意味を変えない）。
- 新しい repository 関数 `find_same_settlement_daily_report_import`（24 §14.18a、id だけを返す）。`DailyReportImport`（list の DTO、`db/sales_repo.rs`）と既存の SELECT・`row_to_daily_report_import` は変えない（24 §14.14 の後の注記）。
- 変えない: `db/migration.rs` の `test_migration_req401_v4_daily_report_constraints` の 3 つの INSERT と helper `seed_v6_daily_report_lines` の INSERT（列を名指しするので新しい列は NULL になる）。`db/schema_v4.rs` の CREATE 文。

### S3 BIZ（`biz::daily_report_import_service`、`biz::mod`）

- `scan_register_sd_daily_reports`（37 §37.9 の手順 1〜9。手順 10 と snapshot の `plu_register_z004s` は作らない〈D-117、PLU の書出しの見直しの runtime の lane〉）、型 `DailyReportSdSelection`・`DailyReportSdScanResult`・`DailyReportSdScan`・`DailyReportSdCandidate`・`DailyReportSdCandidateStatus`・`DailyReportSdScanSnapshot`（wire の 3 つに `specta::Type`）。
- `DailyReportInputFile` に `sd_relative_path: Option<String>`・`source_path: Option<PathBuf>`（37 §37.2）: 定義 `biz/daily_report_import_service/mod.rs` の `DailyReportInputFile`、本番の構築 `cmd/daily_report_import_cmd.rs` の `parse_and_validate_daily_report`、test の構築 `biz/daily_report_import_service/tests.rs` の helper `source_file`（helper `z001_with_lines`〜`z005` と `with_settlement` はこれを呼ぶ）、`biz/sales_service.rs` の `test_get_monthly_sales_req502_official_quantity_in_units` の中の helper `file` と `test_get_daily_sales_req501_summary_imports_from_fixture_bundles` の構築。
- `CachedDailyReportPreview` に `settlement_no`・`sd_source_files`（37 §37.2）、`SdSourceFileForCopy`: 定義 `biz/daily_report_import_service/mod.rs` の `CachedDailyReportPreview`、構築 `parse.rs` の `parse_and_validate_daily_report`、test の構築 `cmd/daily_report_import_cmd.rs` の helper `cached`（helper `cached_with_status` はそれを呼ぶ）。`sd_source_files` は §37.3 手順 9 の文（2026-10-17）どおり詰める。
- §37.3 手順 1a（`parse_and_validate_daily_report_with_sd_lookup`、root を取る closure）、手順 4 の BIZ-08-D6、手順 8 の BIZ-08-D4。
- §37.4: `commit_daily_report_import` に `app_data_dir: &Path`（定義 `commit.rs` の `commit_daily_report_import`。呼出し: `cmd/daily_report_import_cmd.rs` の `commit_daily_report_import`、`biz/sales_service.rs` の上の 2 つの test、`tests.rs` の 29 か所〈`rg -c 'commit_daily_report_import\(' src-tauri/src/biz/daily_report_import_service/tests.rs` → `29`〉。test は一時 directory を渡す）、手順 2a（D6）・2b（D5）・4a（D4）・6（`settlement_no` と `source_files_json` の `sd_relative_path`・`copy_path`。`commit.rs` の `execute_commit` の `source_files_json` の wire 型の serialize を内部の serialize 用の型に替え、既存の 4 key は変えない）。読む側 `parse.rs` の `source_filenames` は無い field を許す（変えない）。
- `BizError::SourceCopyFailed(std::io::ErrorKind)`: `src-tauri/src/biz/mod.rs` の `BizError` と `impl fmt::Display for BizError`。網羅の match は `Display` と `cmd/mod.rs` の `impl From<BizError> for CmdError` の 2 か所（`rg -ln 'BizError::IdempotencyConflict\(.*\) =>' src-tauri/src` → `src-tauri/src/biz/mod.rs`・`src-tauri/src/cmd/mod.rs`）。
- 既存の BIZ の test の fixture（Plan Review round 1、2026-10-23）: `biz/daily_report_import_service/tests.rs` の合成の束は Z001・Z002・Z005 とも精算回数 `0001`（helper `daily_report_preamble` と `z005_with_department`）で、BIZ-08-D4（§37.3 手順 8・§37.4 手順 4a）は手で選ぶ経路でも `settlement_no` が `Some` なら効く。同じ日に別の bytes の束を取り込む次の 8 本は、そのままだと 2 本目以降が D4 の `ImportError` になる: `test_daily_report_req401_additional_confirmation_for_same_date_different_bundle`・`test_daily_report_req401_commit_same_date_is_insert_only`・`test_daily_report_req401_commit_additional_unconfirmed_validation_failed`・`test_daily_report_req401_stale_additional_preview_same_bundle_conflicts`・`test_daily_report_req401_snapshot_change_requires_repreview_without_side_effects`・`test_daily_report_req401_snapshot_replace_requires_repreview_without_side_effects`・`test_daily_report_req401_rollback_keeps_same_date_sibling`・`test_daily_report_rollback_req401_logs_exact_selected_id_and_survives_log_failure`（`rg -n 'z001_with_lines\(' src-tauri/src/biz/daily_report_import_service/tests.rs` の hit のうち、同じ test で `valid_files()` の束を先に commit するもの。2026-10-23）。各 test の中で bytes の違う束ごとに別の精算回数を与える（1 本目は `0001` のまま、2 本目 `0002`、3 本目 `0003`。同じ bytes の束〈`stale_additional_preview_same_bundle_conflicts` の 2 つの preview〉は同じ番号）。Z001・Z002・Z005 の 3 本とも既存の helper `with_settlement` で替える（1 本だけ替えると `settlement_mismatch`）。assert は変えない（D4 が手順 5 の snapshot の再検査や同日追加の確認より先に止めるのを避けるためで、各 test が確かめる振舞いはそのまま）。`biz/sales_service.rs` の 2 つの test（別の日、または fixture の `260324_0001`・`_0002` で精算回数が別）と CMD の test（直接作った cache で `None`）は当たらない。
- L3 の合成の SD の tree の生成（Plan Review round 1）: scan の test の tree を作る helper を使い、出力先を環境変数 `INVENTORY_L3_SD_TREE_OUT` で受ける `#[ignore = "…"]` の test 1 本（`scan::write_l3_register_sd_tree`。既存の例は `io/ej_parser.rs` の `INVENTORY_EJ_PROBE_DIR` の `#[ignore]` の test）を置く。出力: `CASIO\SR500_550_4000\XZ\yyyy\mm\` に L3-1 の 1 組（3 本そろい、精算回数あり）、L3-3 の Z002 の無い組と Z005 だけ BOM 付きの組。実行は `cd src-tauri && INVENTORY_L3_SD_TREE_OUT=<出力先> cargo test --lib -- --ignored write_l3_register_sd_tree`。環境変数が無いときは何も書かずに panic の文で出力先を求める。中身は合成で、名前の形だけを 29 §29.7.2 に合わせる（Matrix の Data Safety Checks）。

### S4 CMD・登録・bindings

- `AppState.register_sd_scan_cache`（45 §45.2）: 定義 `cmd/mod.rs` の `AppState`。literal の構築 15 か所すべてに field を足す（`rg -n 'AppState \{' src-tauri/src` から定義の行と `-> AppState {` の signature の行を除く。2026-10-23 も 15 か所）: 本番 `lib.rs` の `run` の `app.manage(AppState {`、test は `cmd/product_cmd.rs` 2・`cmd/settings_cmd.rs` 1（`app_state_for_test`）・`cmd/plu_export_cmd.rs` 1・`cmd/stocktake_cmd.rs` 1（`app_state_for_test`）・`cmd/csv_import_cmd.rs` 4・`cmd/integrity_cmd.rs` 1（`app_state_for_test`）・`cmd/daily_report_import_cmd.rs` 1・`cmd/sales_cmd.rs` 3（`app_state_for_test` と 2 つの `let state = AppState {`）。
- `scan_register_sd`（§45.6a の手順 1・2・3・4。手順 2a は作らない）と `parse_and_validate_daily_report_from_sd`（§45.6b）、`RegisterSdScanResponse`。`DailyReportSourceFileRequest.source_path`（`#[serde(default)]`、§45.3。定義 `cmd/daily_report_import_cmd.rs` の `DailyReportSourceFileRequest`、test の helper `request`）。commit に `app: tauri::AppHandle` と手順 3a、test 用の `commit_daily_report_import_with_state` に `app_data_dir`。`From<BizError> for CmdError` に `SourceCopyFailed` → `CmdError::internal`（§45.7 の固定の文）。
- 登録: `lib.rs` の `export_bindings_to` の `collect_commands!` と `run` の `tauri::generate_handler!` の両方に 2 command（45 §45.8。`scripts/check-command-drift.sh` の 4 集合の一致）。`cd src-tauri && cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成（手で編集しない）。

### S5 frontend（`src/features/daily-report-import/`）

本節の行番号は 2026-10-17 の観測で、2026-10-23 の main でも同じ（`git diff --stat f5d7aaf4 eed07d37 -- src/features/daily-report-import` は `DailyReportImportPage.test.tsx` の comment の 1 行の置き換えだけ）。

- `types.ts`・`reducer.ts`（UI-07-D15 (4)(5)。2026-10-23 の Plan Review round 1 で 55 UI-07-D15 (5) に足した文）: `DailyReportErrorRecoverTo` に `"sd_list"`（今は `types.ts:4` の `"idle" | "preview"`）。状態に `{ status: "scanning" }` と `{ status: "sd_list"; scan: DailyReportSdScan; scanToken: string }`。`parsing`・`preview`・`importing` に省略可の `sdOrigin?: { scan; scanToken }`（SD から来たときだけ持つ。手で選んだ経路は持たない）。action を足す: scan の開始・成功（scan と scanToken）・失敗（`idle` へ。文は hook の 1 スロット〈UI-07-D15 の「SD から読む」の直下〉が持ち、`error` の状態にしない）、`sd_list` の「確認する」（`parsing` へ `sdOrigin` つき）、preview の「ファイルを選び直す」で一覧へ戻る（`sdOrigin` のある `preview` → `sd_list`）。名前は Writer が決める。reducer の遷移を次のとおり変える（写しの失敗の分岐〈hook の `decideRecoverTo` と recoverTo `preview`〉は変えない）:
  - `parse_succeeded`・`confirm_import` は `sdOrigin` を持ち越す。`select_files`（手で選ぶ）は `sdOrigin` を持たない `parsing` を作る。
  - `parse_failed`: `parsing` が `sdOrigin` を持てば recoverTo `sd_list`・previousState は `sdOrigin` から作った `sd_list`（error の kind・message に依らない）、持たなければ今どおり recoverTo `idle`。recoverTo を hook でなく reducer が状態から決める（action の形は変えない）。
  - `import_failed`（今の `reducer.ts` の `case "importing"`）: recoverTo `preview` で preview を作り直すとき `sdOrigin` を引き継ぐ。recoverTo `idle`（`import_error`、preview の期限切れ等）は今どおり。
  - `dismiss_error`（今の `case "error"`。recoverTo `preview` のときだけ previousState へ戻し、ほかは `idle`）: recoverTo `sd_list` で previousState が `sd_list` なら previousState を返す分岐を足す。
  - 作る所・読む所（`rg -n 'state\.status|status: "|dailyReportImportReducer\(|DailyReportImportState|DailyReportErrorRecoverTo' src/features/daily-report-import`、2026-10-23）: 作る所は `reducer.ts` の全分岐と hook の `INITIAL_STATE`（`:14`）。読む所は hook の `useBlocker`（`:77`・`:78`、`importing` だけ block。`scanning` は block しない）・`confirmImport`（`:222`）・`rollback`（`:235`）・`decideRecoverTo`（`:35`、型だけ）、Page の `switch (state.status)`（`DailyReportImportPage.tsx:29`、`scanning`・`sd_list` の分岐を足す）と `:34`。test の fixture は `reducer.test.ts`（`:13`・`:35`・`:58`・`:70`・`:78` の state の literal）と `DailyReportImportPage.test.tsx` の `setFlow`（`:95`）に渡す state の literal（`:121`・`:134`・`:155`・`:232`・`:257`・`:276`・`:294`・`:347`・`:368`・`:390`・`:433`・`:468`）。test の呼び方は `reducer.test.ts` の `dailyReportImportReducer(` の 6 か所（`:20`・`:43`・`:48`・`:64`・`:72`・`:85`。`:48` が `dismiss_error`）で、hook の test（`useDailyReportImportFlow.test.tsx`）は hook の API を通すので reducer の action を直接呼ばない。足すものは省略可の field と新しい状態・action なので、既存の literal と呼び方は書き換えない（型の網羅で Page の `switch` に分岐が要る）。
- `hooks/useDailyReportImportFlow.ts`: `scanRegisterSd`・`parseAndValidateDailyReportFromSd` の mutation。SD から来た parse の失敗の recoverTo `sd_list` は上の reducer が決める（hook は kind・message で分岐しない）。`decideRecoverTo`（`:35`）は変えない（写しの失敗は `internal` で preview に戻る）。予備の経路は UI-07-D16 の選択の一覧（55 の (a)〜(f)、2026-10-17）で、dialog の path を各要素の `source_path` に入れる（今は `:207` で `extractFilename` だけを送る）。`selectFiles`（`:173`）は外す。「場所を選ぶ」は `@tauri-apps/plugin-dialog` の `open({ directory: true })`（capability は既存の `dialog:allow-open`、変えない）。
- `DailyReportImportPage.tsx`: 「SD から読む」・「場所を選ぶ」・一覧（状態の label と icon、上の文の (a)〜(c)、読まなかった file の件数）・SD を戻す案内・「ファイルを選んで取り込む」の補助のリンクと選択の一覧・置き換えの確認の dialog（`src/components/ui/alert-dialog.tsx`）。preview の「ファイルを選び直す」（今は `onChooseFiles`）は、`sdOrigin` があれば一覧へ戻す action、無ければ今どおり file の dialog（UI-07-D15 (4)）。
- 既存 test の書換え（assert は弱めない）: `hooks/useDailyReportImportFlow.test.tsx` の `selectFiles` を使う 6 か所（`:212`・`:412`・`:459`・`:491`・`:558`・`:615`）を `chooseFiles` と dialog の mock に、3 つ一度の件数の検査の test（`:232`〜`:387` の `chooseFiles` の test）を 1 つずつの選択に、期待の payload（`:395`〜`:397`）と `DailyReportImportPage.flow.test.tsx:136`〜`:138` に `source_path` を足す。`DailyReportImportPage.test.tsx` の hook の mock の `selectFiles`（`:15`・`:98`・`:247`）を外す。`reducer.test.ts` に遷移を足す（Matrix の UI-07-D15 の reducer の行。SD の preview → 写しの失敗 → 戻る → 一覧へ戻る、SD から来た parse の失敗 → 戻る → 一覧、手で選んだ parse の失敗は今どおり `idle`）。新設: `DailyReportImportPage.sd.test.tsx`・`DailyReportImportPage.files.test.tsx`（Matrix）。
- 文言の衝突: 新しい label を `rg -F '<語>' src --glob '*.test.*'` で当てた（2026-10-17）。「取込み済み」は `DailyReportImportPage.test.tsx:413` の preview の badge の matcher と同じ語だが、一覧（`sd_list`）と preview は同時に描かれない状態なので衝突しない（SD の一覧の test は `within` で行を絞る）。「確認する」「外す」は他の画面の test にだけある。ほかの新しい語（「SD から読む」「場所を選ぶ」「取り込めます」「同じ精算を取込み済み」「ファイルがそろっていません」「読めません」「新しい精算はありません」「読み終わりました」「置き換える」「読まなかったファイル」「ファイルを選んで取り込む」）は 0 件。

### S6 設計正本の「未実装」の注記を現行の記述へ直す（実装と同じ PR）

- 29 §29.7.1 の「`io::register_sd`、未実装」と登録の義務の文・§29.8.1 の「`io::pos_source_copy`、未実装」と登録の文、45 §45.3 の「今の構築…に field を足す」と §45.4 の「今の実装（…）は `State<AppState>` だけを受ける」、55 §55.0 の reducer の状態の文の「今の `DailyReportErrorRecoverTo` は…」と UI-07-D16 の「今の `useDailyReportImportFlow.ts` は path を…捨てて…」、§55.1 の `DailyReportImportPage.tsx`（「UI-07-D15、未実装」）・`types.ts`・`useDailyReportImportFlow.ts`（「D-111 の runtime で」）の行、37 §37.4 手順 6 の「今の … `execute_commit` の `source_files_json` は…」、45 §45.8 の「D-111 の runtime では」、pos-tables §12b の `settlement_no` の行の「〈SD 直読みの runtime の lane〉」、22 §17 の版の番号（merge の時点の番号に）。
- 設計正本の外の「runtime は未実装」の注記（Plan Review round 1 で足した。2026-10-23 の `rg -n 'Draft PR #172|runtime は未実装' docs …`〈AC9 の 1 つ目〉の 14 行）: `docs/ARCHITECTURE.md` の POS Adapter Boundary の「Register SD source」の行・IO-09 と IO-10 の部品の行・データの流れの IO-09 と IO-10 の 2 行、`docs/architecture/io-task-specs.md` の IO-09 と IO-10 の「理由」、`docs/architecture/biz-task-specs.md` の BIZ-08 の入力の行、`docs/SCREEN_DESIGN.md` の 1 日の流れの売上データ取込みと日報取込みの行、`docs/DB_DESIGN.md` の `daily_report_imports` の行、`docs/project-memory.md` の D-111 の 3 行（CV17 の layout の観測の行・SD card → CV17 の行・毎日の売上データの行）。「今の build は利用者が選ぶ file から」を外し、SD から読むのを今の形として書く（予備の手で選ぶ経路は残す）。
- 対象外: `docs/backlog.md`・`docs/Plans.md` の「Draft の PR #172」の文（Post-Merge Closeout が本 lane の項目を移すときに直す。Plans は本 lane の Non-scope、D-097）、`docs/decision-log.md`（append-only の本文）、D-117・D-114・D-121 の lane の「今の build は」「runtime の lane で」の文（それぞれの lane が持つ）、`docs/project-memory.md` の D-117 の行。
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

### 2026-10-23 の当て直し（main `eed07d37` への同期）で変えた正本

main に入った D-114（#155、PC の外の控え）・D-121・D-123・D-125 が本 lane の節の前提を変えた所だけを直した。

| file | 変更 | 理由 |
|---|---|---|
| `docs/function-design/22-mnt-migration.md` | §17 の版の番号の文（main の最大 v10、先に merge する migration が無ければ v11、#188 b1 の vZ と先に merge した側が若い番号）、DB の作り直しとの関係の文（§16 の「DB の作り直しと順」、vB・v9・vZ の止まる検査は `daily_report_imports` を見ない）、登録の順（merge の時点の最後の版の後） | v9（§19）・v10（§16 の vB）が main に入り、D-123 が「作り直しを 1 回にまとめる順」を置き換えた |
| `docs/function-design/29-io-daily-report-parser.md` | §29.7.4 手順 1 に、drive を見る間の thread の error mode（`SEM_FAILCRITICALERRORS`）と、folder 名の定数を 71 MNT-01-D10 と共有すること。IO-09-D3 の許可の列に `SetThreadErrorMode`・`SEM_FAILCRITICALERRORS` | D-114 の設計（71 §71.11.3）が、空の読取り機の口を見ると Windows が error の dialog を出しうる前提を見つけて設計で外した。SD をレジに差したままの日は PC の読取り機の口が空なので、IO-09-D1 の drive の列挙にも同じ前提が当たる。71 MNT-01-D10 は folder 名の定数を IO-09 と共有すると決めた |
| `docs/function-design/37-biz-daily-report-import-service.md` | §37.8 の写しの行を、D-114 で決まった D-111 の B（backup と PC の外の控えに写しを入れない）に合わせた | D-111 の Superseded in part（D-114） |
| `docs/backlog.md` | 「SD 直読みの runtime」の D-111 の B（D-114 で決まった）と、Contract Probe の P1 (a)・P4 の結果 | 同上と下の Contract Probe |

直さないと判断したもの: D-117（PLU の占有の照合。本 lane の Non-scope のまま）、D-118（Z004 の精算回数の新契約。日報の側は変えないと D-118 の Compatibility に書いてある）、D-119・D-128（原価と単位。日報の束と `daily_report_imports` に触れない）、D-121 の BIZ-08-D8（同日追加の確認を精算回数で外すのは runtime (A) で、本 lane の Ordinary Operation の「同日追加の確認を含む」は (A) の merge まで正しい）、#155 の 43・53（PC の外の控えの command と画面。IO-09 の契約を引かない）。

P3 (4) は archive の packet の記述の誤りで、IO-10 の task spec は `docs/architecture/io-task-specs.md` の IO-10 に既にあった。本 packet の Contract Ledger は IO-07-D5 の位置を 29 §29.2 の末尾と書く。

### Plan Review round 1 の是正（2026-10-23）で変えた正本

round 1（fresh Opus 5.5、reject P1 0 / P2 3 / P3 8）の指摘を Coordinator が全件採用した。設計の向き（D-111）は変えない。

| file | 変更 | 指摘 |
|---|---|---|
| `docs/function-design/55-ui-csv-import.md` | UI-07-D15 (5) に、SD から来たこと（scan と scan_token）を `parsing`・`preview`・`importing` が持ち続けること、`import_failed` が preview を作り直すときに引き継ぐこと、`parse_failed` の recoverTo `sd_list` を reducer が状態で決めること、「戻る」（`dismiss_error`）が recoverTo `sd_list` で一覧へ戻ること。更新履歴 | #1 |
| `docs/function-design/29-io-daily-report-parser.md` | §29.7.4 手順 1 の folder 名の定数の置き場（`crate::io` の `pub(crate) const`、merge の順に依らない）と `DRIVE_REMOVABLE` の feature（`Win32_System_WindowsProgramming`）。手順 4 の path の判定を文字列の規則にした（`\` と `/` の両方で区切る、絶対 path の形）。IO-09-D3 の許可の列に型 `THREAD_ERROR_MODE`、source の検査の red に `as` の改名のすべての形と書く module への参照 | #5・#6・#8・#11 |
| `docs/backlog.md` | 「日報取込み標準手順の残設計」の取消の導線に、BIZ-08-D4 の文がその導線を前提にすること（AI review 由来） | #9 |

### 節の所有表（並走の lane と重なる file）

2026-10-23 に当て直し、同じ日の Plan Review round 1 の是正で数え直した。Scope の予定 path は 57 本（新設を含む。round 1 の前の 51 本に、S6 に足した設計正本の外の 6 本〈`docs/ARCHITECTURE.md`・`docs/architecture/io-task-specs.md`・`docs/architecture/biz-task-specs.md`・`docs/SCREEN_DESIGN.md`・`docs/DB_DESIGN.md`・`docs/project-memory.md`〉を足した。内訳: 冒頭の型の `rg -l` の 19〈`schema_v4.rs` を除く〉、登録 3、新設 4〈`scan.rs` を含む〉、版の期待の test の 2〈`schema_v9.rs`・`schema_v2.rs`。`migration.rs` は 19 に入る〉、`Cargo.toml` 1、frontend 8 と新設の test 2、`bindings.ts` 1、設計正本と backlog 7、`requirements.md`・`90-traceability.md` 2、packet と Matrix 2、S6 の 6。この列を `sort -u` した file の `wc -l` → `57`）。並走の branch の差分（`git diff --name-only --no-renames origin/main...origin/<branch>`）と `comm -12` で突き合わせた結果（2026-10-23）は、`origin/agent/stocktake-count-runtime-b`（#188 b1、head `40ee8de4`、plan-gate で docs だけ）と `docs/db-design/pos-tables.md`・`docs/function-design/22-mnt-migration.md` の 2 本、`origin/agent/backup-offsite-runtime`（PC の外の控えの runtime (a)、PR #190、head `a899a1f1`、plan-gate で docs だけ）と `docs/backlog.md` の 1 本（項目が別）。code と S6 の 6 本の重なりは #188 の packet の予定 path（S6 の 6 本はどれも #188 の予定 path にある）と、#190 の packet の所有表（`io/mod.rs` の folder 名の定数、`windows-sys` の feature、command の登録）から見込んだ（下の表）。

| file | 本 lane が所有する節 | 他の lane |
|---|---|---|
| `docs/function-design/37-biz-daily-report-import-service.md` | §37.2 の `DailyReportInputFile`・`CachedDailyReportPreview`・`SdSourceFileForCopy`、§37.3 手順 1a・4（BIZ-08-D6）・8（BIZ-08-D4）・9、§37.4 手順 2a・2b・4a・6、§37.7 の D-111 の行、§37.8 の D-111 の行、§37.9 の手順 1〜10 と BIZ-08-D3〜D6・preview への接続 | §37.10・§37.11（D-121、main の設計。runtime (A) は本 lane の merge の後に §37.9 の snapshot と応答に field を足す）と §37.9 の「Z004 と EJ への引継ぎ」の段落は触らない。§37.3 手順 6・7 の部門・総売・支払の意味は D-120 の設計（main） |
| `docs/function-design/29-io-daily-report-parser.md` | §29.2 の `settlement_no` と IO-07-D5、§29.7（IO-09）、§29.8（IO-10） | §29.7.4 手順 3 の SD の写しの置き場の文は D-114（main、71 MNT-01-D10）が足した文のまま。PC の外の控えの runtime と、folder 名の定数（置き場は `src-tauri/src/io/mod.rs`、§29.7.4 手順 1）と feature `Win32_System_Diagnostics_Debug` を共有する（feature は先に merge した lane が足す） |
| `docs/function-design/45-cmd-daily-report-import.md` | §45.2・§45.3 の `source_path`・§45.4・§45.6a・§45.6b・§45.7 の `SourceCopyFailed`・§45.8 | §45.6c（CMD-12-D2、D-121 の一括取込み）は runtime (A) |
| `docs/function-design/55-ui-csv-import.md` | §55.0 の日報の行と「日報取込みの利用者フロー」、UI-07-D12・D15・D16、§55.1 の日報の 3 行、更新履歴の本 lane の行 | UI-07-D17（D-121）は runtime (A) |
| `docs/db-design/pos-tables.md` | §12b の `settlement_no` の行と冪等性の行、更新履歴の本 lane の行 | #188 は冒頭の「計数の置き場と在庫の求め直しの契約」（Z004 の取込みの精算回数・機械の番号の列と在庫の movement の鍵。Z004 の側）。§12c〜§12e は D-120、「SD の一括取込みと EJ の控えの契約」は D-121 |
| `docs/function-design/22-mnt-migration.md` | §17 | #188 は §20（vZ）を足す。番号は先に merge した側が若い番号を取る（§17・§20 の両方に同じ文） |
| `docs/backlog.md` | 「SD 直読みの runtime」の項目と、「日報取込み標準手順の残設計」の取消の導線の文（round 1 の #9） | 各 lane が自分の項目だけ。#190 は PC の外の控えの項目 |
| `docs/ARCHITECTURE.md`・`docs/architecture/io-task-specs.md`・`docs/architecture/biz-task-specs.md`・`docs/SCREEN_DESIGN.md`・`docs/DB_DESIGN.md`・`docs/project-memory.md`（S6） | D-111 の「runtime は未実装〈Draft PR #172〉」「今の build は利用者が選ぶ file から」の注記の文だけ（S6 の 14 行） | #188 も予定 path に持つ（棚卸しの数の置き場の節）。文が別なので merge の順で両方を残す |
| `src/lib/bindings.ts`（生成物） | 本 lane の 2 command と DTO | #188・PC の外の控えの runtime も再生成する。衝突は手で解かず、取り込んだ後に再生成する（D-098） |
| `src-tauri/src/lib.rs` の `collect_commands!`・`generate_handler!` | 本 lane の 2 command | #188（command の変更）・PC の外の控えの runtime（6 command）。merge の順で両方を残す |
| `src-tauri/src/db/migration.rs`・`db/mod.rs`・版の期待の test（`db/schema_v9.rs`・`db/schema_v2.rs`） | vS の登録と版の期待 | #188 の vZ。後から merge する側が file 名・登録・版の期待を取り直す（22 §17） |
| `src-tauri/Cargo.toml` の `windows-sys` の feature | `Win32_System_Diagnostics_Debug`・`Win32_System_WindowsProgramming`（`DRIVE_REMOVABLE`） | PC の外の控えの runtime も `Win32_System_Diagnostics_Debug` を足す（先に merge した lane が足す） |
| `src-tauri/src/io/mod.rs` | `pub mod register_sd`・`pub mod pos_source_copy` と、レジの SD の folder 名の `pub(crate) const`（本 lane が先に merge するとき） | #190 の packet の所有表の `io/mod.rs` の行と同じ置き場（#190 が先なら #190 が置き、本 lane は使う） |
| `src-tauri/src/cmd/mod.rs` ほか `AppState` の 15 か所、`biz/mod.rs`・`db/sales_repo.rs`・`cmd/csv_import_cmd.rs`・`cmd/stocktake_cmd.rs` | `register_sd_scan_cache` の field、`BizError::SourceCopyFailed`、`settlement_no` の INSERT と照合の関数 | #188 の packet もこれらの file を触る予定。違う symbol なので merge の順で両方を残す |

## Non-scope

- 37 §37.9 手順 10・`plu_register_z004s`・45 §45.6a 手順 2a・BIZ-04 `refresh_plu_register_snapshot_from_sd`（D-117、PLU の書出しの見直しの runtime）。
- Z004 の SD からの取込み（BIZ-03、D-118 の 32 の新契約）、EJ の取込み・閲覧、一括取込み（D-121）。
- `XZ_BKUP` へ移す操作（(b) の lane）。`io::register_sd` に書込みの API を足さない。
- 写しの保持・削除（未決 A）、`docs/function-design/71-mnt-backup.md` の変更（backup は DB の 1 file のまま。写しを入れないのは D-114 の未決 B）。
- `docs/Plans.md`（D-097）、`docs/decision-log.md`（新しい決定は無い）。

## Acceptance Criteria

baseline は 2026-10-23 の head（main `eed07d37` を取り込んだ merge と当て直しの docs）で、各 command を逐語で実行し直した（2026-10-17 の HEAD `f5d7aaf4` の値から変わったのは AC1 の filtered の数と AC9 の位置だけ）。AC9 は同じ日の Plan Review round 1 の是正で範囲を広げ、baseline を取り直した。

- AC1（IO の test）: `cd src-tauri && cargo test --lib -- io::register_sd io::pos_source_copy` が exit 0 で、Matrix の `register_sd::*`・`pos_source_copy::*` の行の test がすべて PASS。baseline: `test result: ok. 0 passed; 0 failed; 0 ignored; 0 measured; 1315 filtered out; finished in 0.00s`（module が無い）。
- AC2（SD に書かない）: Matrix の `register_sd::module_uses_only_allowed_fs_api` と `register_sd::scan_leaves_tree_unchanged` が PASS し、Matrix に挙げた mutant（`File::create`・`fs::copy`・`OpenOptions::new()`・`use std::io::Write;`・`set_modified` のどれかを module に足す）で red になることを Final Review で実注入して確かめる。
- AC3（BIZ・DB・CMD の契約）: `cd src-tauri && cargo test` が exit 0 で、Matrix の `daily_report_parser::settlement_no_*`・`scan::*`・`daily_report_import_service::*`（D4・D5・D6・手順 1a・手順 9）・`sales_repo::*settlement*`・`migration::adds_daily_report_settlement_no_nullable`・`daily_report_import_cmd::*` の行の test が PASS。
- AC4（層）: `cd src-tauri && cargo test --test architecture_test` が exit 0（baseline: `test result: ok. 3 passed; 0 failed; 0 ignored; 0 measured; 0 filtered out; finished in 0.11s`）。`cmd` が `io::register_sd` を use しない。
- AC5（command と bindings）: `rg -n 'scanRegisterSd|parseAndValidateDailyReportFromSd' src/lib/bindings.ts` が 2 つの command を返す（baseline: hit 0、exit 1）。`cd src-tauri && cargo run --bin generate_bindings` の後に `git diff --exit-code -- src/lib/bindings.ts` が exit 0（生成物と一致）。
- AC6（登録と設計照合）: `rg -n 'io::register_sd|io::pos_source_copy' src-tauri/tests/design_compliance_test.rs` が 2 つの module を返す（baseline: hit 0、exit 1）。`cd src-tauri && cargo test --test design_compliance_test` が exit 0（baseline: `test design_code_compliance_phase_a ... ok`）。`cd src-tauri && cargo run --bin generate_traceability -- --check` が `ERROR 0 件`（baseline: `traceability check: OK（ERROR 0 件 / WARN 0 件）`）。
- AC7（frontend）: `npx vitest run src/features/daily-report-import` が全 PASS で、`DailyReportImportPage.sd.test.tsx`・`DailyReportImportPage.files.test.tsx` を含む（baseline: `Test Files  4 passed (4)`、`Tests  34 passed (34)`）。`npm run typecheck && npm run lint && npm run format:check && npm run build` が exit 0。
- AC8（docs）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0（command registry の drift を含む。WARN は報告）。
- AC9（未実装の注記の sweep、S6）: 次の 2 つの command が hit 0（exit 1）。(1) `rg -n 'Draft PR #172|runtime は未実装' docs -g '!docs/plans/**' -g '!docs/archive/**' -g '!docs/Plans.md' -g '!docs/backlog.md' -g '!docs/decision-log.md'`（baseline: 14 件 = `docs/ARCHITECTURE.md` 5・`docs/architecture/io-task-specs.md` 2・`docs/architecture/biz-task-specs.md` 1・`docs/SCREEN_DESIGN.md` 2・`docs/DB_DESIGN.md` 1・`docs/project-memory.md` 3）。(2) `rg -n 'io::register_sd`、未実装|io::pos_source_copy`、未実装|UI-07-D15、未実装|D-111 の runtime で|runtime の lane で' docs/function-design/29-io-daily-report-parser.md docs/function-design/37-biz-daily-report-import-service.md docs/function-design/45-cmd-daily-report-import.md docs/function-design/55-ui-csv-import.md`（baseline: 10 件 = 29 §29.7.1・§29.8.1、37 §37.4 手順 6、45 §45.4・§45.8、55 §55.0 の利用者フロー手順 2・UI-07-D16・§55.1 の Page・`types.ts`・hook の行。37 §37.9 手順 10・45 §45.6a 手順 2a の「SD 直読みの runtime の lane は」は当たらず、残す）。
- AC10（L3 の前）: Human Gate の L3 の前に Writer が `cd src-tauri && cargo check --release` を通し（Linux の WSL では `cfg(windows)` の本体を compile しないので、FFI の型と feature はこれで確かめられない。下の Test Plan と Residual Risk）、Contract Probe の P1・P4 の結果を本 packet に書く（P1 が不一致なら L3 に進まず design へ戻す）。P1 の (a) と P4 は 2026-10-23 に書いた（どちらも合格）。P1 の (b) は取れた時点で書く（下の Contract Probe の分岐）。
- AC11（hosted）: Ready の後の run の `Merge gate` が success（`docs/ci.md`）。

## Design Readiness

- 引用する設計正本（節まで）: 29 §29.2（IO-07-D5、`DailyReportParseResult`）・§29.7.1〜§29.7.8（IO-09-D1〜D4）・§29.8（IO-10）／37 §37.1・§37.2・§37.3 手順 1a・4・8・9・§37.4 手順 2a・2b・4a・6・§37.7・§37.9（BIZ-08-D3〜D6）／45 §45.2・§45.3・§45.4 手順 3a・7・§45.6a・§45.6b（CMD-12-D1）・§45.7・§45.8／55 §55.0 の日報取込みの利用者フロー・UI-07-D12・D15・D16・§55.1／24 §14.14・§14.18a／pos-tables §12b／22 §17（MNT-03-D15）・§16 の「DB の作り直しと順」と「作り直しの手順」／71 MNT-01-D10（folder 名の定数の共有）・§71.11.3 の「error の dialog を出さない」／`docs/architecture/io-task-specs.md` IO-09・IO-10／`docs/decision-log.md` D-111・D-114。
- 必要な設計成果物: function-design（IO-09・IO-10・BIZ-08・CMD-12・UI-07） = existing sufficient、ただし P3 の 3 件・IO-07-D5 の範囲・UI-07-D16 の細部・手順 10 と 2a の実装の lane、Plan Review round 1 の UI-07-D15 (5) の状態の持ち越しと 29 §29.7.4 手順 1・4・IO-09-D3 は updated in this PR／DB（migration） = updated in this PR（22 §17）／SCREEN_DESIGN = existing sufficient（PR #150 で同期済み）／decision-log = 足さない（下）。
- plan にしかない durable な判断の昇格先: 無い。足した文は D-111 の下の正本の細部（22 §17・29・37・45・55）に置き、cross-cutting な新しい決定を作らないので D-124 は使わない。
- 前提・制約と延期した design gap: P1（SD-23、取込み前の原本の形・精算回数・bytes。2026-10-06 版での採取では `XZ_BKUP` の分だけを観測）と P4 は L3 の前に確かめる前提で、P1 の (a) と P4 は 2026-10-23 に合格、P1 の (b)（bytes の比較）は未確認（Contract Probe）。窓・写しの未決 A・(b) の lane・D-117 の照合は延期で（未決 B は D-114 で決まった）、どれも本 lane の取込みを止めない（SD を読むだけで、CV17 の取込みが続く間 `XZ` の file の数は今と変わらない）。
- 絶対保証の自己点検: 「SD に書かない」の例外は Windows の FAT の最終アクセス日と `System Volume Information`（IO-09-D3 に明記）。「二重に数えない」の例外は手で選んだ `None` の束（layout B）と NULL の既存行だけ（D-111 の Guarantee range）。「写しの無い SD の取込みは無い」は §37.4 手順 2b が TX の前に書き、失敗で止めるので成り立つ。逆向き（写しがあるのに取り込んでいない）はありうると BIZ-08-D5 に書いた（2026-10-17）。
- 判定: ready。上の正本で実装の何を・なぜ・何を棄てたかが答えられ、未解決の設計の問いは無い。

## Registration / Generation Obligations

| 変更対象 | 義務（本 lane） |
|---|---|
| Tauri command | `scan_register_sd`・`parse_and_validate_daily_report_from_sd` に `#[tauri::command]` + `#[specta::specta]`、`lib.rs` の `collect_commands!`（`export_bindings_to`）と `generate_handler!`（`run`）の両方、`cargo run --bin generate_bindings` |
| function-design doc 新設 | 該当なし（新しい doc を作らない）。既存の `29-io-daily-report-parser.md` の map の行に `io::register_sd`・`io::pos_source_copy` を足す（`design_compliance_test.rs` の `build_doc_to_modules_map()`） |
| source / workflow doc 新設・改名・削除 | 該当なし |
| REQ / coverage | REQ-401 の部品の列に IO-09・IO-10 を足すなら `generate_traceability` で 90 を再生成（S6） |
| route | 該当なし（新しい route は無い） |
| operator 画面新設 | 該当なし（既存の日報取込みタブを変える。到達導線は変わらない） |
| migration | `db/schema_v11.rs`（番号は 22 §17）・`db/mod.rs`・`migration.rs` の `migrations()`、最新の版を期待する既存の test（S2）、22 §17 の版の番号 |

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
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | drive の列挙は Windows だけ（既存の `windows-sys` の pin。feature `Win32_System_Diagnostics_Debug`〈`SetThreadErrorMode`。PC の外の控えの runtime と共有〉と `Win32_System_WindowsProgramming`〈`DRIVE_REMOVABLE`〉を足す）。Windows 以外は空の列で、test は `resolve_register_sd_root`。`cfg(windows)` の本体は hosted CI（ubuntu）と WSL の check で compile されず、初めて compile されるのは L3 の build | Test Plan の FFI の読み、Residual Risk |

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
- compatibility checks: 既存の手で選ぶ経路・同日追加の確認・取消の既存 test（`biz/daily_report_import_service/tests.rs`、`DailyReportImportPage*.test.tsx`）を回帰で回す。`tests.rs` の 8 本は S3 のとおり束ごとに精算回数を分ける（assert は変えない。同じ精算回数で別の bytes の束を D4 で拒むのは D-111 の意図した変更で、その振舞いは Matrix の D4 の行が確かめる）。
- data safety checks: 実 SD・`EcrDatas` の file の中身、実の名前の一覧、hash の値を repo に入れない。
- main wiring/integration checks: `scan_register_sd` → BIZ-08 §37.9 → IO-09、`parse_and_validate_daily_report_from_sd` → §37.3、commit → IO-10、`lib.rs` の 2 つの登録。
- Human Gate に L3 があるので、Writer は L3 の前に `cargo check --release` を通す（AC10）。
- `cfg(windows)` の FFI（Plan Review round 1）: `find_register_sd_roots` の Windows の本体（`GetLogicalDrives`・`GetDriveTypeW`・`DRIVE_REMOVABLE`・`SetThreadErrorMode`・`SEM_FAILCRITICALERRORS`・`THREAD_ERROR_MODE`、元の error mode へ戻す処理）は hosted CI（全 job が ubuntu）でも、WSL の `cargo check --release` でも compile されない（Windows の target はこの環境に入れない。`rustup target add` をしない）。代わりに (1) Final Review で、各項目の module の path・引数と戻りの型・feature を windows-sys 0.61.2 の source と照らして読み（2026-10-23 の確認: `GetLogicalDrives() -> u32`・`GetDriveTypeW(PCWSTR) -> u32` は `Win32::Storage::FileSystem`、`DRIVE_REMOVABLE: u32` は `Win32::System::WindowsProgramming`、`SetThreadErrorMode(THREAD_ERROR_MODE, *mut THREAD_ERROR_MODE) -> BOOL`・`SEM_FAILCRITICALERRORS: THREAD_ERROR_MODE`・`THREAD_ERROR_MODE = u32` は `Win32::System::Diagnostics::Debug`）、途中で返る経路を含めて元の値へ戻すことを確かめる。(2) L3 の build を owner に頼む前に、Coordinator が同じ照合を merge の train の head の source で行う（owner の build で初めて compile の誤りが出て、介入を 1 回使うのを避ける）。

**L3（Windows の実機、owner の目視と PASS / FAIL。D-124 のとおり merge の train の先頭で最新の main を取り込んだ head で頼む。束ねる条件は上の Owner Effort Budget）**:

| # | 確かめること（観測できる合格の基準） | 到達経路 | 入力物 | 依存する既知の backlog・前提 |
|---|---|---|---|---|
| L3-1 | 取外し可能な drive の SD（か USB メモリ）を差して「SD から読む」を押すと、自動で見つかり、SD を戻す案内と一覧が出る。PC に SD の読取り機があるなら、その口を空のまま（USB メモリだけ差して）押しても Windows の error の dialog が出ない（29 §29.7.4 手順 1） | 売上データ取込み → 日報取込みタブ →「SD から読む」 | 合成の SD の tree（`CASIO\SR500_550_4000\XZ\yyyy\mm\` に合成の Z001/Z002/Z005 の 1 組。S3 の `scan::write_l3_register_sd_tree`〈`#[ignore]`、出力先 `INVENTORY_L3_SD_TREE_OUT`〉で Coordinator が作り、Ready の依頼と同時に渡す）を入れた USB メモリ | 無い |
| L3-2 | 「場所を選ぶ」で SD の写しの folder を選ぶと一覧が出て、「取り込めます」の行から取り込め、`%APPDATA%\com.kosei.inventory\pos-sources\casio-sr-s4000\sd\XZ\…` に 3 本ができる。同じ精算をもう一度読むと「取込み済み」 | 同上 →「場所を選ぶ」→ 写しの folder | 2026-10-18 版での SD の写し（owner の手元、`.local/reports/visit-2026-10-19/sd-copy.md` の出力。repo に入れない）。開発の DB はその精算を取り込んでいないこと | P1 の (a)（取込み前の原本の精算回数が読める。2026-10-23 に合格）。写しが無いときは合成の tree で代える |
| L3-3 | 一覧の状態の label と icon、上の文、予備の経路の 1 つずつの選択・「外す」・置き換えの確認の dialog の見え方 | 同上 | L3-1 の tree に、Z002 の無い組と BOM 付きの組を足した合成の tree（同じ `scan::write_l3_register_sd_tree` が 1 回で書く） | 無い |
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
| IO-09-D1 | 29 §29.7.4（手順 1 の error mode、2026-10-23） | S1 `register_sd.rs` | `resolve_*` | L3-1 |
| MNT-01-D10 の folder 名の定数の共有（D-114） | 71 MNT-01-D10、29 §29.7.4 手順 1 | S1（`src-tauri/src/io/mod.rs` の `pub(crate) const`。merge の順に依らない） | `register_sd::register_sd_folder_name_has_one_definition` | 非対象 |
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
| 既存 BIZ-08-D1・D2、IO-07-D3、SPEC-SDI（同日追加・insert-only・per-import rollback）、UI-07-D13・D14 | 37 §37.3〜§37.5、55 | 変えない | 既存の test（回帰。`tests.rs` の 8 本は束ごとに精算回数を分け、assert は変えない。S3） | 非対象 |
| 隣接の除外: 37 §37.9 手順 10・45 §45.6a 手順 2a（D-117） | 37・45 | PLU の書出しの見直しの runtime | 非対象 | 非対象 |
| 隣接の除外: Z004 の識別（D-118、32 の新契約）・Z004 タブの一時停止（SPEC-STOP-D4） | 32、55 §55.0 | 変えない | 非対象 | 非対象 |
| 隣接の除外: backup の対象（71 §71.1 の注記） | 71 | 変えない（写しは backup に入らない） | 非対象 | 非対象 |

## Contract Probe

起票の時点で実験していない。以下の 2 つは設計 lane（PR #150）から引き継いだ未確認の前提で、「正常な条件で目的を達成できるか」に効くので L3 の前に確かめる（AC10。発注 367）。「危険な結果を出さないか」への効き方は P1 の (b) の下に限定して書き、Plan Gate は止めない。

- P1（SD-23・SD-24 の原本の分。取込み前の `XZ` の原本は 3 本とも精算回数が読め、取込みの後の `XZ_BKUP` の同じ file と同じ bytes か）: **(a) 合格、(b) 未確認**（2026-10-23、入力は 2026-10-18 版での SD の写し）。(a): 精算の後・CV17 の取込みの前の `XZ` にあった同じ日の複数の精算の束（各束の Z001・Z002・Z005）を、今の `io::daily_report_parser` の source を写した一時の program（repo の外）で読んだ。どちらの束も 3 本とも CP932 strict・BOM 無し・CRLF だけ・最終改行ありで（IO-09-D4 の形の flag は全部「外れ無し」）、精算回数は 3 本とも読めてそろい、`i64` に収まり（IO-07-D5 で `Some`）、`parse_daily_report_bundle` の `parse_errors` は空だった。束どうしの精算回数は互いに違った（SD-08 の同じ日の 2 回の精算が 2 つの候補になる前提と合う）。(b) は次の預かりか店 PC の `EcrDatas` の写しで取る。手順: (a) 2026-10-18 版での SD の写し（owner が精算の後、CV17 の取込みをせずに預かる道 1、repo 外の回答台帳 TD-304）の `XZ` の Z001/Z002/Z005 の 1 組を、合成の tree と同じ読み方（IO-09 の形の検査と IO-07 の精算回数）で手元で読み、形の flag と「精算回数が 3 本とも読めてそろうか」だけを出す（中身は出さない）。(b) 次の預かり（か店 PC の `EcrDatas` の同じ file の写し）の `XZ_BKUP` の同じ file の SHA-256 と、(a) の file の SHA-256 を manifest どうしで比べる。合否: (a) が読めて (b) が一致なら合格。(a) が読めない、または (b) が不一致なら L3 に進まず、BIZ-08-D4・D6 を見直しに design へ戻す（owner に諮る、予備の介入）。(a) だけ取れて (b) がまだのときは、L3-2 は (a) の結果で進め、(b) は取れた時点で本 packet に書く。(b) を merge の前提にしない: 安全の主張は「CV17 の取込みの前後で、file の対象日と精算回数の行が保たれる限り」に限り（D4 の照合は bytes が違っても対象日と精算回数で止まる）、(b) が bytes の不一致でもこの限りでは D4 が止める。対象日か精算回数の行が取込みの後に読めない・変わる場合は、SD の経路は D6 で止まるが、手で選ぶ `EcrDatas` の束（精算回数が `None`）は照合されず、同日追加の確認だけが残る（D-111 の Guarantee range の内側で、本 lane の前と同じ）。(b) が merge の後に不一致と分かったとき: Coordinator が backlog に BIZ-08-D4・D6 の見直しの項目（観測した差の種類だけ。中身・hash は書かない）を足し、行が保たれたかを owner に諮る（予備の介入「P1 が不一致のときの設計の見直しの判断」。merge の後なら次の lane の起票の判断として使う）。手引き: `.local/reports/visit-2026-10-19/sd-copy.md` の 6。
- P4（スマホへの送信の失敗のときにレジが「SD カードへバックアップ」した file が、規則に合わない名前の file として増えるか）: **合格**（2026-10-23、入力は 2026-10-18 版での SD の写しの `p4-other-names.txt` と、その前の採取の写しの名前）。規則外の名前は、前の採取にもあった `CASIO` 直下の PLU の text と、新しく増えた `BACKUP` の下の数字だけの名前の file だけだった。増えた file は `XZ`・`XZ_BKUP` の外にあり、Z の名前の規則（`Znnn_dda`・`.CSV`）に近い形でもないので、IO-09 は列挙しない（`Unknown` にも数えない）。`XZ`・`XZ_BKUP` の Z は全部、置き場の連番の規則（`XZ` は連番なし・`XZ_BKUP` は `_nnnn`）に合っていた。2026-10-18 版での SD の写しの `p4-other-names.txt`（名前の一覧だけ）で、2026-10-06 版での採取に無かった規則外の名前が増えたかだけを見る。設計は分岐しない（`Unknown` として数え、読まない。IO-09-D2）。規則どおりの名前で増えたなら通常の候補になり、同じ bytes は 1 つにまとまる。増えたものが Z の名前の規則に近い別物なら owner に諮る（予備）。
- 観測済みで probe の要らない前提: SD は取外し可能な drive として見える（SD-25）、`XZ_BKUP` = `EcrDatas`（SD-22）、名前の形・大文字の `EJ`・同じ日の複数の Z・未知の名前の file（SD-02・03・07・08）。どれも 2026-10-06 版での SD の採取。`windows-sys` の `Win32_Storage_FileSystem` は `src-tauri/Cargo.toml` の `[target.'cfg(windows)'.dependencies]` で確かめた（2026-10-17。2026-10-23 の main も同じ）。

## Data Safety

- tracked に書かない: 実 SD・`EcrDatas` の file の中身、実の file 名の一覧、hash の値、実 JAN・商品名・金額、店主の発言の原文。P1・P4 の結果は合否と質的な要約だけを本 packet に書く。
- local-only: 2026-10-18 版での SD の写し（owner の手元と `~/downloads/inventory-field-check/approved-readable/raw-private/`）、回答台帳、開発の DB と `pos-sources/`。
- synthetic-only: test と L3-1・L3-3 の SD の tree（名前の形だけを 2026-10-06 版での採取に合わせ、中身は合成）。

## Residual Risk

Plan Review round 1（2026-10-23）で残すと決めたもの。どれも Plan Gate を止めない。

- `cfg(windows)` の FFI が CI と WSL で compile されない（#5）: 初めて compile されるのは owner の L3 の build。Test Plan の FFI の読み（Final Review と、L3 の build の前の Coordinator の照合）で抑える。Linux の `cargo check --release`（AC10）はこれを確かめない。2026-10-23 に windows-sys 0.61.2 の source で、`DRIVE_REMOVABLE` が packet の前の版の feature（`Win32_Storage_FileSystem`）でなく `Win32_System_WindowsProgramming` にあることを見つけ、S1・29 §29.7.4 手順 1 を直した。
- P1 の (b) は merge の前提にしない（#7）: 安全の主張の限定と、merge の後に不一致と分かったときの扱いは Contract Probe の P1。
- 使い手への押しつけ（#9、AI review から出た要件。owner の確認の前に Human Gate の必須にしない〈AGENTS.md の Working Rules〉）: (a) BIZ-08-D4 の文（37 §37.3 手順 8）と「同じ精算を取込み済み」の行は「前の取込みを取り消してから読み直してください」と案内するが、取消の導線は取込みの直後の結果の画面にしか無い（完了画面を離れた後の取消の導線は `docs/backlog.md` の「日報取込み標準手順の残設計」で未着手。正常な前提では D4 はまず出ない端の場合）。(b) 一覧の「読めません」「ファイルがそろっていません」の行は原因の種類を示すだけで、直し方を名指ししない。(a) は backlog の取消の導線の項目に結んだ。(b) の文を足すかは下の Open Questions で owner に諮る。

## 新しい契約の文と境界の 4 観点

起票の commit（2026-10-17）と当て直し（2026-10-23）と Plan Review round 1 の是正（2026-10-23）で足した文を、安全な整数の範囲・0 の表示・失敗の時点と順序・単位や種類の混在で一巡した。

| 文 | 範囲 | 0 | 失敗の時点と順序 | 混在 |
|---|---|---|---|---|
| IO-07-D5 の `i64` に収まらない値は `None`、`0000` は `Some(0)` | `u64` → `i64` の境で `None`（Matrix に `i64::MAX` と + 1） | 0 を値として保つ（表示はしない） | parse の中（D3 の判定の後） | 型は整数だけ |
| §37.3 手順 9 の `sd_source_files` | — | 3 本とも PC なら空（commit は写さない） | 手順 1a の後 | SD と PC の混ざった束は SD の分だけ |
| BIZ-08-D5 の拒んだ束の写し | — | — | 2b（写し）→ 4・4a・5（TX の中の拒否）。正本は `copy_path` | — |
| 22 §17 の migration | 列は NULL を許す INTEGER | 既存行は NULL（0 で埋めない） | 実行器の TX。失敗で版を記録しない。vB・v9・vZ とどちらが先でも止めない（どれも `daily_report_imports` を見ない、2026-10-23） | — |
| UI-07-D16 (a)〜(f) | 一覧は系列ごとに 1 つ（最大 3） | 0 件で「確認する」は押せない | 読めない・大きすぎる file は足す前に止める。preview へ進むと一覧は空 | 系列の決まらない名前・同じ系列の重複を拒む |
| 37 §37.9 手順 10・45 §45.6a 手順 2a の実装の lane | — | — | 本 lane の scan は手順 9 の後に返す | — |
| 29 §29.7.4 手順 1 の thread の error mode（2026-10-23） | — | 空の読取り機の口は root にしない。root が 0 件なら BIZ-08 §37.9 手順 1 の「SD が見つかりません」 | drive を見る前に設定し、返る前（途中で返る場合を含む）に元の値へ戻す。設定は呼んだ thread だけで、他の command の thread に効かない | 見るのは取外し可能な drive だけ（固定 disk・network は今のまま見ない） |
| 29 §29.7.4 手順 1 の folder 名の定数の共有（2026-10-23。置き場は round 1 で `crate::io` の `pub(crate) const` に決めた） | — | — | 置き場は merge の順に依らない（先に merge した lane が `io/mod.rs` に置き、後の lane は使う）。MNT → IO の参照で、IO → MNT の参照は作らない | 共有は文字列だけ。IO-09 の自動の発見（drive の root の直下）・`resolve_register_sd_root`（選んだ path から下へ）と、71 MNT-01-D10 の祖先の判定は判定の仕方が違うので関数は共有しない |
| 22 §17 の版の番号（2026-10-23） | 次の版（先に merge する migration が無ければ v11） | — | 後から merge する側が file 名・登録・版の期待を取り直す。取り直しを忘れると、同じ版の 2 つの登録か版の期待の test の失敗で CI が止まる | — |
| 37 §37.8 の写しの行（D-114 で決まった D-111 の B、2026-10-23） | — | — | — | backup・PC の外の控えは DB の 1 file、写しはアプリの data の folder の `pos-sources/` で、混ぜない |
| 55 UI-07-D15 (5) の SD から来たことの持ち越しと recoverTo `sd_list`（round 1、#1） | 持つのは直前の scan の 1 つだけ（新しい scan で置き換え） | 候補 0 件の一覧でも `sd_list` に戻る（(3) の (c) の文） | parse の失敗は `parsing` の時点で決め、commit の失敗は今の `decideRecoverTo` の後に `import_failed` が preview を作り直すときに引き継ぐ。scan_token の期限は CMD だけが見る（UI は確かめない） | SD から来た状態と手で選んだ状態を同じ variant の省略可の field で分ける（手で選んだ経路は field を持たず、今どおり `idle` へ戻る） |
| 29 §29.7.4 手順 4 の path の文字列の判定（round 1、#6） | — | 空の root の列は `None` | file system を見ない純関数（SD を抜いた後の判定は手順 5） | `\` と `/` の区切り、drive 文字の絶対 path と `/` の絶対 path を同じ規則で扱う。要素ごとの一致で、前方一致（`SR500_550_4000X`）を root の下にしない |
| 29 §29.7.4 手順 1 の feature と型（round 1、#5） | `THREAD_ERROR_MODE` と `DRIVE_REMOVABLE` は `u32`（windows-sys 0.61.2） | — | compile は Windows の build が初めて（Residual Risk） | `DRIVE_REMOVABLE` は `Win32_System_WindowsProgramming`、error mode は `Win32_System_Diagnostics_Debug` で、feature が別 |
| IO-09-D3 の source の検査の red（round 1、#11） | — | — | test の時点（source の文字列。`#[cfg(test)]` より前） | `std` の項目の `as` の改名のすべての形と、書く module（`pos_source_copy`・`mnt`）への参照を red にする |
| 失敗定義の D4 の例外と、既存の 8 本の fixture の精算回数（round 1、#2） | 精算回数は 4 桁の合成の値（`0001`〜`0003`） | — | D4（§37.3 手順 8・§37.4 手順 4a）は手順 5 の snapshot の再検査と同日追加の確認より先に止めるので、test ごとに束の番号を分ける | 同じ bytes の束は同じ番号、違う bytes の束は違う番号 |
| Contract Probe P1 の安全の主張の限定（round 1、#7） | — | — | (b) は merge の前提にしない。merge の後の不一致は backlog と owner への問い | 手で選ぶ `None` の束は照合しない（D-111 の Guarantee range） |
| L3 の合成の tree の生成（round 1、#10） | 1 組・Z002 の無い組・BOM 付きの組の 3 組 | 環境変数が無ければ何も書かない | `#[ignore]` で CI では回らない | 中身は合成、名前の形だけ 29 §29.7.2 |

## Open Questions

- owner 向け（今は無い。L3 の回で諮る）: L3-4 を導入の時へ送るか（a 送る〈推奨〉／b 今の L3 で店で行う。答えが無ければ a）。
- owner 向けの候補（AI review 由来〈Plan Review round 1 の #9 (b)〉。L3 の回に同じ依頼へ束ね、介入を増やさない。確認の前に gate にしない）: SD の一覧の「読めません」「ファイルがそろっていません」の行に、直し方の 1 文を添えるか。a 添える（例: 「SD を差し直してもう一度読むか、「ファイルを選んで取り込む」で選んでください」。本 lane の中で 55 UI-07-D15 (3) と 37 §37.9 を直す）／b 今のまま（label と icon だけ。直し方は店の手順書に書く）／c 後の lane（画面のデザインの刷新、TD-296 の 11c）で見直す。条件付きの推奨: a（使い手に押しつけない〈D-127〉に合う。ただし L3-3 で見た owner の所感を先に聞く。precondition-dependent）。答えが無ければ c。
- agent 側: migration の番号（merge の順で決める。22 §17。#188 b1 の vZ と、先に merge した側が若い番号を取る）。Contract Audit の 2 本目を採るか（Coordinator）。REQ-401 の部品の列に IO-09・IO-10 を足すか（Writer、S6）。

## Implementation Results

Fill after implementation.

## Review Response

先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。

round 1（`3d7c0111`）: Claude 側 fresh Opus 5.5 = reject（P1 0 / P2 3 / P3 8）。Codex は利用上限で使えず、§3.3 に従い Claude 側だけで round 1 とした。Coordinator が P2 3 件を現物で確かめ（`src/features/daily-report-import/reducer.ts` の `dismiss_error`、`src-tauri/src/biz/daily_report_import_service/tests.rs` の fixture の精算回数、S6 の外の注記）、11 件を全部採用した。相談役は省いた（R3、指摘が Scope の漏れ・fixture・注記で筋が明確）。是正は起草役の `881700ca`。

- P2: 一覧へ戻る経路（`sd_list` と `sdOrigin` の持ち越し、`dismiss_error` の分岐、写しの失敗の分岐は変えない）、既存の BIZ test 8 本の束を別の精算回数に（assert は変えず、D4 の拒否は意図した変更と失敗定義に添えた）、S6 の外の注記と AC9 の広げ。
- P3: 版の assert は 3 か所、`cfg(windows)` の FFI を Final Review と L3 の build の前の照合で見る（`THREAD_ERROR_MODE` を許可の列に。起草役が `DRIVE_REMOVABLE` の feature が `Win32_System_WindowsProgramming` にあることを見つけて足した）、path の判定を文字列の規則に、P1 の安全の主張を前提つきに、folder 名の定数を `io/mod.rs` に固定（PR #190 の所有表の文と同じ所）、取消の導線と行の直し方を Residual Risk と Open Questions に（AI review 由来で gate にしない）、L3 の合成の SD の tree を `#[ignore]` の生成の test で、source の検査の red の形を広げた。
- 起草役が発注の外で直したもの: frontend の file の数（directory の中は 8）、上の feature。
