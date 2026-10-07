# Plan Packet: SD を直接読む設計（毎日の売上データの入力元をレジの SD にする）

wave に属さない単独の lane（design-first、docs だけ。runtime は後続の lane）。owner の lane 選択は 2026-10-06（TD-117、repo 外の回答台帳）。起票時の並走のうち `agent/z001-display`（PR #145）と `agent/stocktake-p1`（PR #148）は merge 済みで、本 branch は origin/main の取込みでその変更を含む。ほかの並走は `agent/plu-clear`（2026-10-06 起票）、`agent/npm-audit-1006`（npm の開発用依存の high、D-108）。本 lane の branch は `agent/sd-direct-read`。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（subagent_type: writer）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/sd-direct-read

遷移の記録:

1. kickoff → spec-check（2026-10-06、起草役）: owner 決定（2026-10-06「毎日の売上データ〈Z001/Z002/Z004/Z005 と EJ〉は CV17 を開かずにアプリが SD から直接読む。CV17 は PLU の書込みだけ」、Coordinator の発注で受領）を Scope にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-06、起草役）: 標準手順の正本（`docs/project-memory.md` の決めた運用、`docs/function-design/55-ui-csv-import.md` UI-07-D12、`29-io-daily-report-parser.md` §29.4.1）が「SD → CV17 取込み → `EcrDatas` から選ぶ」で、SD を読む IO・候補の規則・二重取込みの照合が無い。同じ commit で設計正本を更新した（下の Design Readiness）。
3. design のまま止める（起草の時点）: owner の判断事項 1〜5 が残り、design → plan-draft の条件「未解決の設計の問いが無い」を満たさなかった。
4. design（owner の決定の反映、2026-10-06、起草役、本 commit）: owner の判断 1〜5 の決定（下の「owner の判断事項」）を D-111・設計正本・本 packet・Matrix に反映し、写しの設計（IO-10、BIZ-08-D5）を足した。Phase は design のまま。理由: 決定 1（SD は動かさない）の前提 P2・P3（Contract Probe）を Plan Gate の前に店の経験で確かめる。写しの細部の未決 A・B は Non-scope にしたので design → plan-draft を止める問いではない。
5. design → plan-draft（2026-10-07、起草役、本 commit）: 条件「設計の出力が正本にある」は、IO-09・IO-10・IO-07-D5・BIZ-08-D3〜D5・CMD-12-D1・UI-07-D12〜D14・`daily_report_imports.settlement_no`・D-111 が下の Design Readiness の引く正本にあることで満たす。条件「未解決の設計の問いが無い」は、owner の判断 1〜5 が 2026-10-06 に決まり、決定 1 の前提 P2・P3 の扱いが 2026-10-07 に決まったことで満たす（P3 は店の実績〈TD-139〉で合格。P2 は試しを行わず〈owner 決定、TD-176〉、owner の承認した代わりの扱いと運用の制約〈D-111〉で閉じた。下の Contract Probe）。残る P1 は設計に依らず runtime の lane の L3 の前に確かめるもの、`XZ` の file が数千本になったときのレジの振舞いは (b) の lane の前提（D-111 の Revisit）、写しの未決 A・B は Non-scope で、どれも本 lane の設計の問いではない。
6. plan-draft → plan-gate（2026-10-07、Coordinator、本 commit）: packet と Matrix（`docs/plans/test-matrices/2026-10-06-sd-direct-read.md`）が揃い commit されている（`docs/DEV_WORKFLOW.md` Workflow State の表）。Draft PR #150 で Plan Review（fresh Opus + Codex）に出す。
7. plan-gate のまま是正（round 1、2026-10-07、Coordinator）: round 1 の reject を起草役が `d14cfacc` で直した（下の Review Response）。Scope と設計の方向は変えないので plan-gate に留め、round 2 で再 review する（`docs/DEV_WORKFLOW.md` Workflow State「a plan-gate rejection corrected in place stays at plan-gate」）。遷移の記録 5 の「UI-07-D12〜D14」は round 1 の番号の振り直し（UI-07-D15・D16）より前の記録。

## Owner Effort Budget

- 介入回数上限: 10（既定 6 から上げる。理由: 製品の振舞いの判断が 5 点〈owner の判断事項 1〜5〉と、店の経験の確認が 2 点〈Contract Probe の P2・P3〉ある。1 回の問い合わせにまとめても decision point の数で数える）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 10 | 9（2026-10-06: 判断 1〜5 の 5。2026-10-07: 移す操作を後続の lane にする判断〈TD-142〉1、P3 の店の経験〈TD-139〉1、P2 の店の経験〈TD-152・TD-175〉1、P2 の試しを行わず代わりの扱いと運用の制約を承認〈TD-176〉1） | 2（Ready 1、merge 1）。写しの残る 2 点（A・B）は本 lane で諮らない（Non-scope） | 0 | 11 = 9 + 2 + 0（上限を 1 超える見込み。上限の改定は Ready の問い合わせと同じ 1 回で諮る） |

## Risk

Risk: R3

Reason:
operator の毎日の取込みの操作列、POS の file の入力経路、Tauri command と DTO（足す）、DB の列（足す）、重複取込みの判定を変える設計。本 lane は docs だけだが、契約を決めるので R3。データの破壊・実店舗データの露出は無い（SD に書かない設計。採取した事実は名前・形・hash の質的な要約だけを書く）ので R4 ではない。classifier の workflow の一覧（AGENTS・CLAUDE・DEV_WORKFLOW・MANUAL・code_review・project-profile・agent-guidance・templates・`.agents`・`.claude/{rules,commands,skills}`・PR template）に当たる file を Scope に持たないので Final Review Minimum 1。required gate の green / red は変わらない（docs だけ。function-design の新しい file を作らないので `design_compliance_test` の未登録の文書も生じない）。

## Goal

Goal Invariant:

### 最小完了条件

- 後続の runtime lane の Writer が、チャットの履歴を見ずに source docs だけで「レジの SD を探す → 売上の file を列挙して読む → 精算ごとの束を取込み済みと照らす → 利用者が選んで preview → commit → SD をレジへ戻す」を実装できる（IO-09・BIZ-08-D3 / D4 / D6・CMD-12-D1・UI-07-D12・D15・D16・IO-07-D5・`daily_report_imports.settlement_no`）。
- 旧い標準手順（`SD → CV17 取込み → EcrDatas から選ぶ` を通常の手順とする記述）の live な残りが 0（`rg` の結果を AC に書く）。
- owner の判断（2026-10-06 決定）が設計正本に反映され、SD は動かさず、取り込んだ原本の写しが PC に残る設計がある（IO-10、BIZ-08-D5）。残る未決（写しの保持・backup）は D-111 と packet に `未決（owner）` で並んでいる。

### 失敗定義

- runtime の Writer が、SD の場所・読む file・取込み済みの見分け・形の外れた file の扱い・SD を書き換えない保証のどれかを推測しないと書けない。
- 設計が、同じ精算を別の bytes で二重に取り込む経路（追加確認だけで通る）を残す、または SD に書く API を許す。
- source docs に `EcrDatas` を標準の入力元とする live な記述が残る。

### 非目的

- runtime の code・test・fixture・bindings・migration（後続の lane）。
- EJ の取込みの BIZ・DB の設計（入力の経路と取込み済みの見分けの規則だけを引き継ぐ）。Z004 の取込みの再開（一時停止中、ADR の停止）。
- 窓より前の未取込みの精算の検知（欠けの検知）。Excel 印刷の代替の判定（backlog の別項目）。ECR+ の終了後の精算の経路。
- CV17 で PLU を書き込む経路の変更。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので、取込みの毎日の操作列を置く。本 lane は docs だけで、表の通常運用は runtime の lane の後に成り立つ。**この文書を完了できる**（設計正本がそろう）ことと、**通常運用を達成できる**（店で SD から取り込める）ことは別で、後者は本 lane では未達。取込み済みを `XZ_BKUP` へ移す操作（D-111 (1) の (b)、後続の lane）ができるまで、店は CV17 の取込みを今の運用のまま続ける（日々の売上の Z は毎日、EJ は毎月末日。D-111 の運用の制約、owner 2026-10-07）。下の表はその間の列で、CV17 を開かずに済む運用は (b) の後に成り立つ。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 店は開いたまま、その日の精算前 | ECR+ かレジで精算する | レジが SD の `XZ\yyyy\mm\` に Z001/Z002/Z004/Z005、`XZ` 直下の EJ に記録を書く | SD に精算の file がある | 書込みの契機は精算の操作（説明書）。保存の設定は有効（`docs/project-memory.md` のレジの節） |
| SD がレジに入っている | SD を抜いて PC に差す | Windows が SD を取外し可能な drive として見せる | drive が見える | 店の PC で観測済み（29 §29.7.2 SD-25） |
| 売上データ取込み画面・日報取込みタブ | 「SD から読む」 | アプリが SD を探して読み、「読み終わりました。SD はレジに戻してください」と精算の一覧を出す | 一覧に「取り込めます」の行がある（無ければ「新しい精算はありません」） | owner 決定 3: 自動で探し、見つからなければ選ぶ（UI-07-D15） |
| 一覧が出た | SD をレジへ戻す | 次の精算ができる（SD が無いと精算できない） | 読んだ内容はアプリが 30 分持つ | CMD-12-D1 |
| 一覧に「取り込めます」がある | その行の「確認する」 | 既存のプレビュー（対象日・総売上・支払・部門・警告・同日追加の確認） | プレビューが出る | — |
| プレビュー | 「取り込む」（同日追加なら確認） | 日報が保存され、「日次売上を見る」へ進める | 結果が出る | 同じ精算の別の bytes は BIZ-08-D4 で止まる |
| 「取り込む」の中で | — | アプリが読んだ 3 本の写しを PC のアプリの folder に残す（利用者の操作なし）。残せないと取り込まずに固定の文を出す | 写しが書けた | BIZ-08-D5 |
| 同じ日に 2 回目の精算をした | 同じ操作を繰り返す | 1 回目は「取込み済み」、2 回目は「取り込めます」 | — | 同じ日の複数の Z は観測済み（SD-08） |
| CV17 の日次の取込みも続けている（(b) の lane まで。D-111 の運用の制約） | 「SD から読む」 | `XZ_BKUP` の分も読み、取込み済みは hash で「取込み済み」になる | — | `XZ_BKUP` = `EcrDatas`（SD-22）。取込み前の原本 = 取込み後かは未確認（P1）。SD から取り込む束は精算回数のある束だけ（BIZ-08-D6）なので、bytes が違っても後から来た方は BIZ-08-D4 で止まる |
| 翌日 | 精算する（前日までの Z は CV17 の毎日の取込みで `XZ_BKUP` へ移っている） | レジは精算を続け、その日の Z を `XZ` に書く。EJ は毎月末日の CV17 の取込みまで `XZ` 直下で伸びる | 精算できる | Z の名前は日付で決まり、別の日の Z とぶつからない（SD-02・SD-08）。Z が `XZ` に何日も溜まる状態は (b) まで生じない（P2 の扱い）。EJ の約 1 か月は店の実績（P3 合格） |
| SD が読めない・過去の分 | 「ファイルを選んで取り込む」で 1 つずつ選ぶ | 既存の 3 ファイルの経路でプレビューへ | 3 つそろう | owner 決定 4: 補助のリンク（UI-07-D16） |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項（2026-10-06 決定）

確認済み事実: `XZ_BKUP` と PC の `EcrDatas` は全件で同じ bytes（29 §29.7.2 SD-22）。SD は店の PC で取外し可能な drive として見える（SD-25）。SD が無いとレジは精算できない（SD-18）。

| # | 判断事項 | 決定（owner 2026-10-06） | 設計への反映 |
|---|---|---|---|
| 1 | SD を読むだけにするか、`XZ_BKUP` へ移すか | 動かさない（読むだけ） | IO-09-D3（29 §29.7.6）、D-111 (8)。前提 P2・P3 は 2026-10-07 に扱いを決めた（P3 合格、P2 は D-111 の運用の制約。Contract Probe） |
| 2 | 読んだ原本の写しを PC に残すか | 残す | IO-10（29 §29.8）、BIZ-08-D5（37 §37.4 手順 2a、§37.9 の BIZ-08-D5）、pos-tables §12b の `source_files_json`、71 §71.1 の後の注記 |
| 3 | SD の場所を自動で探すか、利用者が選ぶか | 自動で探し、見つからなければ利用者が選ぶ | IO-09-D1、UI-07-D15 |
| 4 | ファイルを選ぶ経路の置き場所 | 同じ取込み画面の小さな補助のリンク（ひとまず。デザインの刷新で見直す） | UI-07-D16、D-111 の Revisit |
| 5 | backlog「Z004 layout B 対応」の重み | 下げる（layout B は CV17 の明示書出しだけが作り、店は基本もう使わない） | `docs/backlog.md` の当該 entry の注記 |

owner の方向（D-111 の Context）: アプリが気を利かせて、CV17 での作業を利用者から隠す。

残る未決（owner）: A 写しの保持期間と削除（既定は消さずに残す）。B 写しを backup に含めるか・PC の外へ出すか（今の backup は DB の 1 file だけ。backup の設計 lane の論点と一緒に決める）。どちらも本 lane の Non-scope で、runtime の既定（消さない・backup に入れない）で通常運用は成り立つ。

## Scope

本 lane は docs だけを変える（予定 file の全部。所有の列は並走 lane との重なり）。

| file | 変更 | 他 lane・#145 との重なり |
|---|---|---|
| `docs/function-design/29-io-daily-report-parser.md` | IO-07-D5（`settlement_no`）、§29.4.1 の標準経路の文、IO-07-D3 の「通常の手順」の文、§29.7 IO-09 の新設、§29.8 IO-10（写し）の新設 | なし |
| `docs/function-design/37-biz-daily-report-import-service.md` | §37.1 の入力、`DailyReportInputFile.sd_relative_path`、`CachedDailyReportPreview.settlement_no`・`sd_source_files`、§37.4 の signature（`app_data_dir`）と手順 2a（BIZ-08-D5）、§37.3 手順 8 の BIZ-08-D4、§37.3 手順 4・§37.4 手順 1a・§37.9 手順 7 の BIZ-08-D6、§37.4 手順 4a・6、§37.7 の行、§37.8 の非目的、§37.9 の新設（BIZ-08-D3）、更新履歴 | なし |
| `docs/function-design/45-cmd-daily-report-import.md` | AppState の scan cache、§45.4 の commit の `AppHandle` と `app_data_dir`、§45.6a・§45.6b（CMD-12-D1）、§45.8、更新履歴 | なし |
| `docs/function-design/55-ui-csv-import.md` | §55.0 の表の CMD、日報取込みの利用者フローの手順 2・4、UI-07-D12 の改訂、UI-07-D15・D16 の新設、§55.1 の `DailyReportImportPage.tsx` の行 | `agent/stocktake-p1` は PR #148 で merge 済みで、本 file を触らなかった。本 lane の所有は §55.0 の「画面構成」の表の日報の行・「日報取込みの利用者フロー」・「UI判断 ID」の D12・D15・D16・§55.1 の `DailyReportImportPage.tsx` の行だけ |
| `docs/function-design/29-io-ej-parser.md` | IO-08.10 の事実・入力の経路・取込み済みの見分け・後続が決めること | なし |
| `docs/architecture/io-task-specs.md` | IO-07 の出力に `settlement_no?`、IO-09 の task spec の新設（末尾） | なし |
| `docs/architecture/biz-task-specs.md` | BIZ-08 の入力・段階間データ・Stage 2 手順 5・Stage 4 手順 2 | `agent/stocktake-p1` は PR #148 で merge 済みで、本 file を触らなかった。本 lane は BIZ-08 の節だけ |
| `docs/architecture/cmd-task-specs.md` | CMD-12 の表と責務境界 | なし |
| `docs/architecture/ui-task-specs.md` | UI-07 の利用者操作フロー 1・4 | なし |
| `docs/ARCHITECTURE.md` | adapter の表の行、IO の task 一覧の IO-09、依存の行、IO-01〜IO-09 | なし |
| `docs/FUNCTION_DESIGN.md` | IO 一覧と索引の IO-07・BIZ-08・CMD-12 の行 | なし |
| `docs/SCREEN_DESIGN.md` | 1 日の動線、売上データ取込み画面の節 | なし |
| `docs/db-design/pos-tables.md` | §12b の `settlement_no` の列と冪等性の行、B-2 の入力単位、更新履歴 | #145 は本 file を触らずに merge 済み。PR #148（stocktake-p1）は本 file の別の節を変えて merge 済みで、origin/main の取込みで解決した |
| `docs/DB_DESIGN.md` | POS 日報の境界の文 | なし |
| `docs/project-memory.md` | POS Facts の layout の行、在るものの CV17 の行、決めた運用の標準手順の行、レジの節の SD の配置の行 | A だけが SD→CV17 の標準手順の行を直す（発注どおり） |
| `docs/plu-export-and-real-csv-verification.md` | SDカード / PCツール保存領域の節、スマホアプリの扱いの文 | `agent/plu-clear` が PLU の節を触る可能性。本 lane は「SDカード / PCツール保存領域」の節と「スマホアプリの扱い」の最初の段落だけ |
| `docs/decision-log.md` | 末尾に D-111 だけを追記 | 全 lane が末尾に追記（A = D-111、B = D-109、C = D-110、`agent/npm-audit-1006` = D-108）。merge 順で両方を残す |
| `docs/backlog.md` | 着手対象に「SD 直読みの runtime」の entry を 1 つ足す。「Z004 layout B 対応」の entry に重みを下げる注記を 1 つ足す（owner 決定 5、Coordinator の許可） | 全 lane が自 lane の entry だけ |
| `docs/function-design/71-mnt-backup.md` | §71.1 の後に、backup の対象が DB だけで写し・画像を含まない注記を 1 段落 | なし |
| `docs/plans/2026-10-06-sd-direct-read.md`、`docs/plans/test-matrices/2026-10-06-sd-direct-read.md` | 新設 | なし |

触らない: `docs/Plans.md`（D-097）、`docs/function-design/90-traceability.md`（生成物）、`docs/spec/requirements.md`（REQ-401 の行の部品の列に IO-09 を足すのは runtime の lane。traceability の再生成が要るため）、`docs/design-system/reference/mockup-d-import-export.html`（参照の mockup で正本でない。131 行の「CV17取込み後の PC 側 EcrDatas フォルダ」は残す）。

### runtime の lane への申し送り（形が変わる型と、作る所・読む所）

本 lane は code を書かない。形を変える型の producer / consumer を `rg` で全件挙げる（2026-10-07 に `6b765f75` の現物で数え直した。行番号は literal の構築・定義・呼出しの行）。runtime の lane はこの一覧を Scope の出発点にする。

| 型・関数 | 変更 | 作る所 | 読む所・test |
|---|---|---|---|
| `DailyReportParseResult`（`settlement_no` を足す） | IO-07-D5 | `src-tauri/src/io/daily_report_parser.rs:69`（定義）・`:79`（構築は 1 か所） | `src-tauri/src/biz/daily_report_import_service/parse.rs`、同 file の test の helper（`daily_report_parser.rs:701`・`:713`） |
| `CachedDailyReportPreview`（`settlement_no`） | BIZ-08-D4 | `biz/daily_report_import_service/mod.rs:121`（定義）・`parse.rs:216`（構築） | `commit.rs`、`cmd/daily_report_import_cmd.rs:250`（test の literal の構築は 1 か所。`:249` の helper `cached` の中で、`:281` の `cached_with_status` 等はその helper を呼ぶ） |
| `NewDailyReportImport`（`settlement_no`） | BIZ-08-D4 | `db/sales_repo.rs:197`（定義）・`:596`（INSERT） | 構築: `biz/daily_report_import_service/commit.rs:102`、test: `db/sales_repo.rs:2222`（helper）・`:2509`・`:2518`、`biz/daily_report_import_service/tests.rs:293`、`biz/sales_service.rs:645`、`cmd/sales_cmd.rs:293`、`cmd/daily_report_import_cmd.rs:410` |
| `daily_report_imports` の列 | migration（次の番号。v7 の次だが並走 lane の migration と番号を runtime の lane が決める） | `db/migration.rs`、新しい `db/schema_vN.rs` | `db/migration.rs:937`・`:973`・`:982`・`:1034`（INSERT の test）、`docs/function-design/22-mnt-migration.md` |
| `DailyReportImport`（list の DTO） | 変えない（wire に出さない） | `db/sales_repo.rs:181`・`:888` | — |
| 新 command 2 つと DTO 4 つ | CMD-12-D1 | `cmd/daily_report_import_cmd.rs`、`lib.rs` の `collect_commands` | `src/lib/bindings.ts`（再生成）、`src/features/daily-report-import/` |
| `DailyReportInputFile`（`sd_relative_path`） | BIZ-08-D5 | `biz/daily_report_import_service/mod.rs:32`（定義）、`cmd/daily_report_import_cmd.rs:43`（構築） | test の構築: `biz/daily_report_import_service/tests.rs:15`（helper `source_file`）、`biz/sales_service.rs:1175`（helper `file` の中）・`:1360` |
| `commit_daily_report_import`（`app_data_dir` を足す） | BIZ-08-D5 | `biz/daily_report_import_service/commit.rs:14` | 呼出し: `cmd/daily_report_import_cmd.rs:114`（1。`:70` は同名の CMD の定義）、`biz/sales_service.rs:1199`・`:1367`（2）、`biz/daily_report_import_service/tests.rs`（29 行） |
| `source_files_json` の要素（`sd_relative_path`・`copy_path` を足す） | BIZ-08-D5 | `biz/daily_report_import_service/commit.rs:83` | 読む所: `parse.rs:236`（`source_filenames`。無い field を許す） |
| 新 module `io::pos_source_copy` | IO-10 | `src-tauri/src/io/pos_source_copy.rs`、`io/mod.rs` | `design_compliance_test.rs` の map の同じ行に `io::pos_source_copy` |
| （後続の lane）`XZ_BKUP` へ移す操作 | D-111 (1) の (b)、TD-142 | 本 lane も SD 直読みの runtime の lane も作らない。`io::register_sd` に書込みの API を足さず、別の module に置く（IO-09-D3 の source の検査を保つ） | 後続の lane が起票時に Scope を決める |
| 新 module `io::register_sd` | IO-09 | `src-tauri/src/io/register_sd.rs`、`io/mod.rs` | `src-tauri/tests/design_compliance_test.rs` の `build_doc_to_modules_map()` の `29-io-daily-report-parser.md` の行に `io::register_sd` を足す |

注: `sales_service.rs`・`sales_cmd.rs`・`sales_repo.rs` の test を触った #145 は merge 済みで、上の行番号はその後の現物。runtime の lane は起票時の現物で数え直し、所有表を書く。

## Non-scope

- runtime の code・test・fixture・bindings・migration・`90-traceability.md`。
- SD の file を移す設計（owner 決定 1 で本 lane では採らない）。アプリの「取り込み済みの Z・EJ を `XZ_BKUP` へ移す（片付ける）」操作は後続の lane（owner 2026-10-07 決定、TD-142）。まず読むだけを作り、その後に移す操作を作る。SD への書込みの設計（CV17 と同じ `_nnnn` の改名、途中の失敗、CV17 の取込みとの両立）はその lane で行う（D-111 の Decision (1)）。その lane は起票時に、`XZ` の file が数千本になったときのレジの振舞い（P2 の残り）を前提として確かめる（D-111 の Revisit）。写しの保持期間・削除と、写しの backup・PC の外への持出し（未決 A・B）。
- EJ の取込みの BIZ・DB・画面、Z004 の取込みの再開、欠けの検知、Excel 印刷の代替。
- backlog の「日報取込み標準手順の残設計」の entry の書換え（他 entry。closeout に回す）。「Z004 layout B 対応」は注記を 1 つ足すだけで、本文は変えない。
- 日報の手でのファイル選択で「1 つずつ選び足し・個別に外す」の backlog 化（#145 の closeout〈PR #147〉で済んだ。設計の要件としては UI-07-D16 に入れた）。

## Acceptance Criteria

- AC1（旧い標準手順の live な残り 0）: `rg -n "EcrDatas" docs --glob '!docs/archive/**' --glob '!docs/research/**'` の hit が、すべて「事実（`XZ_BKUP` と同じ bytes・layout A の観測）」「予備の経路」「2026-10-06 に置き換えた旨の履歴」「D-111」「参照の mockup 1 行（`docs/design-system/reference/mockup-d-import-export.html:131`）」のどれかで、`EcrDatas` を通常の入力元とする文が 0。`rg -n "所定フォルダ|CV17取込み後のPC側" docs --glob '!docs/archive/**' --glob '!docs/research/**'` の hit は、`55-ui-csv-import.md` の UI-07-D12 の「旧版（2026-08-01）の…は置き換えた」の履歴の 1 行と本 AC の行だけ（起草時の実測で 2 件）。
- AC2（IO-09 の契約がある）: `docs/function-design/29-io-daily-report-parser.md` に `find_register_sd_roots`・`resolve_register_sd_root`・`list_register_sd_entries`・`read_register_sd_file` のシグネチャ（`rg -n "^fn (find|resolve|list|read)_register_sd" docs/function-design/29-io-daily-report-parser.md` が 4 行）と IO-09-D1〜D4 がある。
- AC3（候補の規則と二重取込みの拒否）: `37-biz-daily-report-import-service.md` に §37.9（BIZ-08-D3）と §37.3 手順 8 の BIZ-08-D4、§37.4 手順 4a、§37.3 手順 4・§37.4 手順 1a・§37.9 手順 7 の BIZ-08-D6 がある。`pos-tables.md` §12b に `settlement_no` の列がある。
- AC4（command と画面）: `45-cmd-daily-report-import.md` に §45.6a・§45.6b（CMD-12-D1）、`55-ui-csv-import.md` に UI-07-D12（改訂）・D15・D16 がある。
- AC5（決定の記録）: `docs/decision-log.md` の末尾に `## D-111` があり、owner の決定 1〜5・Context（CV17 の作業を利用者から隠す）・未決 A・B を挙げる。
- AC6（検査）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/doc-consistency-check.sh` が ERROR 0（WARN は報告）。
- AC7（写し）: `29-io-daily-report-parser.md` に `fn save_pos_source_copy` のシグネチャと §29.8 があり、37 に BIZ-08-D5（§37.4 手順 2a）がある。`rg -n '\bD-108\b' docs --glob '!docs/archive/**' --glob '!docs/plans/2026-10-06-sd-direct-read.md'` の hit が 0（本 packet は並走 lane の D-108 を前文と Scope で名指しするので除く。2026-10-07 の実測で 0 件。`agent/npm-audit-1006` が先に merge したときの hit はその lane の D-108 で、本 lane の記述ではない）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/function-design/29-io-daily-report-parser.md` IO-07-D3・D5、§29.4.1、§29.7（IO-09-D1〜D4）／`37-biz-daily-report-import-service.md` §37.3 手順 4・5・8、§37.4、§37.9（BIZ-08-D3・D4・D6）／`45-cmd-daily-report-import.md` §45.2・§45.6a・§45.6b（CMD-12-D1）／`55-ui-csv-import.md` §55.0、UI-07-D12・D15・D16／`29-io-ej-parser.md` IO-08.10／`db-design/pos-tables.md` §12b・B-2／`ARCHITECTURE.md` POS Adapter Boundary・レイヤー間の呼び出し原則／`docs/adr/2026-09-18-stocktake-time-evidence.md`（Z004 の精算同一性 guard、変えない）。
- 必要な設計成果物: function-design（IO-09・BIZ-08・CMD-12・UI-07） = updated in this PR／DB（`settlement_no`） = updated in this PR（migration の番号は runtime）／SCREEN_DESIGN = updated in this PR／decision-log = D-111 を追加。
- plan にしかない durable な判断の昇格先: すべて D-111 と上の正本へ置いた。packet にだけある判断は無い（owner の判断事項は D-111 の「未決」にも書いた）。
- 前提・制約と、延期した design gap: SD-23（取込み前の原本と取込み後の bytes、P1）は未確認で、runtime の lane の L3 の前に確かめる。設計は bytes の一致に依らない（同じ bytes なら hash で、違えば精算回数で照らす。SD から取り込む束は 3 本とも精算回数が読めてそろう束だけにする BIZ-08-D6 があるので、どちらを先に取り込んでも後の方は BIZ-08-D4 で止まる）。依るのは「取込み前の原本の 3 本とも精算回数が読め、取込み後の file と同じ値」であることで、これを P1 の合否に入れ、満たさなければ runtime の lane の L3 の前に BIZ-08-D4・D6 を見直す。owner の判断 1（SD は動かさない）の前提は 2026-10-07 に閉じた: P3（EJ を移さずに長く置いたときの追記）は店の実績で合格（TD-139）。P2（Z を `XZ` に溜めたときの精算）は試さず（TD-176）、Z の名前が日付で決まり別の日の Z とぶつからないこと（SD-02・SD-08）と、(b) の lane まで店が CV17 の取込みを今の運用のまま続ける制約（D-111）で扱う。制約の間、Z が `XZ` に何日も溜まる状態と、EJ が 1 か月を超えて `XZ` に残る状態は生じない。延期: `XZ` の file が数千本になったときのレジの振舞い（精算のときの処理時間、FAT32 の 1 directory の entry 数の上限）は (b) の lane（または CV17 の毎日の取込みをやめる時点）の前提に送る（D-111 の Revisit）。延期が安全な理由: 本 lane と runtime の lane は SD を読むだけで、CV17 の取込みが続く間 `XZ` の file の数は今と変わらない。欠けの検知・写しの保持と backup（未決 A・B）・移す設計も延期（Non-scope）。
- 絶対保証の自己点検: 「SD に書かない」の例外は Windows の FAT の最終アクセス日と `System Volume Information`（アプリでは止められない。IO-09-D3 に明記）。「二重に数えない」の例外は、手で選んだ `settlement_no` が None の束（layout B）と、NULL の既存の取込み（D-111 より前）だけ。SD の経路の束は None を取り込まない（BIZ-08-D6、scan・preview・commit の各段）ので、SD の束を先に取り込んで後から CV17 の移した別の bytes が来ても、逆の順でも照合で止まる。D-111 より前の取込みは `EcrDatas` からで SD の `XZ_BKUP` と同じ bytes なので hash で止まる。手で選んだ layout B の束と同じ精算の SD の束は同日追加の確認で通りうる（layout B は店が基本使わない。D-111 の Guarantee range）。精算回数が戻った場合は誤って拒む（安全側）。
- 判定: ready（plan-draft に進める）。理由: 設計の出力（IO-09・IO-10・IO-07-D5・BIZ-08-D3〜D6・CMD-12-D1・UI-07-D12・D15・D16・`settlement_no`・D-111）が上の正本にあり、owner の判断 1〜5 は 2026-10-06 に決まり、決定 1 の前提 P2・P3 は 2026-10-07 に扱いを決めた（Contract Probe）。残る P1・`XZ` の多数の file・未決 A・B は、上のとおりどれも本 lane の設計の問いではない。

## Registration / Generation Obligations

本 lane（docs だけ）は該当なし（function-design の新しい file・REQ の増減・route・画面の新設をしない）。runtime の lane の義務: `lib.rs` の `collect_commands` に 2 command と `#[tauri::command]` + `#[specta::specta]`、`cargo run --bin generate_bindings`、`design_compliance_test.rs` の map に `io::register_sd`、`docs/spec/requirements.md` の REQ-401 の部品の列に IO-09 を足すなら `cargo run --bin generate_traceability`、migration と `22-mnt-migration.md`。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | SD の配置・名前・形は adapter（IO-09）。core は「精算ごとの束」「取込み済みの状態」「同じ精算の二重取込みを拒む」。BIZ-08-D3 の組分けは Z00k の名前に依るので CASIO 固有で、BIZ に置くのは日報の束の規則が BIZ-08 にあるため（D-023 の範囲内、D-111 Compatibility） | レジが替わったら IO-09 と §37.9 の組分けを取り替える |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 事実は 29 §29.7.2 の表（観測 / 状態 / 未確認の分類）。判断は D-111・IO-09-D1〜D4・BIZ-08-D3 / D4 / D6・CMD-12-D1・UI-07-D12・D15・D16 | — |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 読取りの途中の失敗は全体の失敗（IO-09・§37.9 手順 3）。scan の snapshot は 30 分で、切れたら読み直し。取込み済みの再読みは「取込み済み」。取消の後は「取り込めます」に戻る。同じ精算の別の bytes は拒む | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 精算 → SD を PC → 読む → SD を戻す → 選ぶ → 取り込む。CV17 は PLU の書込みだけ（(b) の lane までは今の CV17 の取込みも続ける。D-111 の運用の制約）。Excel 印刷の代替は別項目 | runtime の lane の L3 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | `io::register_sd`・29 §29.7・§37.9 の組分けを取り替え、preview / commit / 照合は残る | — |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 事実は名前・形・hash の照合の質的な要約だけ（件数・実データは tracked に書かない）。SD に書かない（IO-09-D3） | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 日報の二重計上を BIZ-08-D4 と BIZ-08-D6（SD の経路は精算回数のある束だけ）で止める。日報は在庫を動かさない（D-025、変えない） | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 実 SD の自動の発見（`DRIVE_REMOVABLE`）、取込み前の原本の読取り、読んだ後に SD を戻して精算できること | runtime の lane の L3 |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | drive の列挙は Windows だけ（既存の `windows-sys` の feature `Win32_Storage_FileSystem`。`src-tauri/Cargo.toml` の `[target.'cfg(windows)'.dependencies]`）。Windows 以外は空の列で、test は `resolve_register_sd_root` で一時 directory を使う | runtime の lane |

## Boundary / Wire Contract

- producer: BIZ-08 §37.9（`DailyReportSdScan`）、CMD-12 §45.6a・§45.6b
- consumer: UI-07（`scanRegisterSd`・`parseAndValidateDailyReportFromSd`）
- wire type: `RegisterSdScanResponse { scan: DailyReportSdScan, scan_token: String }`、`DailyReportSdCandidate { candidate_key, path_date, report_date?, source_filenames, status }`、`DailyReportSdCandidateStatus`（5 値）。既存の `DailyReportPreviewResponse` を返す
- internal type: `DailyReportSdScanSnapshot`（AppState、wire にしない）、`settlement_no: Option<i64>`（IO-07 → cache → DB。wire に出さない）、IO-09 の型
- precision/range: `settlement_no` は i64（先頭 0 を落とした整数、IO-07-D3）。日付は YYYY-MM-DD
- round-trip path: scan → candidate_key → snapshot の 3 本 → 既存の preview → commit（DB に `settlement_no`）
- invalid input: 空の `selected_path` は validation。期限切れの scan_token は import_error。取り込めない candidate_key は validation
- compatibility: 既存の command と DTO の wire は変えない。`daily_report_imports` に nullable の列を足し、既存行は NULL

## Test Plan

Test Design Matrix: [2026-10-06-sd-direct-read](test-matrices/2026-10-06-sd-direct-read.md)（runtime の lane が実装する test の設計。本 lane は docs の検査だけ）。

- targeted tests: 本 lane は `bash scripts/doc-consistency-check.sh --target plan` と full。
- negative tests: Matrix の Negative Paths（runtime）。
- compatibility checks: 既存の CMD-12 の wire と既存の取込みの経路（Matrix）。
- data safety checks: 本 lane の差分に実データ（JAN・商品名・金額・件数の細部・ファイルの中身）を入れない。
- main wiring/integration checks: runtime の lane。

## Review Focus

- Ordinary Operation の列が、正常な条件で目的（アプリが SD から毎日取り込み、SD をレジへ戻す。CV17 の取込みは (b) の lane まで並行して続く）を達成できるか。
- BIZ-08-D4・D6 が SD-23 の不一致の場合も、取り込む順に依らず二重取込みを止めるか、正常な同じ日の 2 回目の精算を誤って止めないか。
- IO-09 の名前の規則（`XZ` は連番なし、`XZ_BKUP` は連番あり、大文字小文字を区別しない）が観測した場合をすべて覆い、未知の名前を読まないか。
- 窓（最後の取込みの日と 30 日前の早い方）で、普段の運用の精算が候補から落ちないか。
- 層: CMD が IO-09 を呼ばない、規則が BIZ にある。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-111 | `docs/decision-log.md` D-111 | 本 lane は設計の記録。runtime は後続 | runtime（Matrix） | — |
| IO-07-D5 | 29 IO-07-D5（§29.2 の後） | runtime: `daily_report_parser.rs` | Matrix の IO-07-D5 の行 | 非対象 |
| IO-09-D1 | 29 §29.7.4 | runtime: `io/register_sd.rs` | Matrix | L3: 店の PC で自動で見つかる |
| IO-09-D2 | 29 §29.7.5 | 同上 | Matrix | 非対象 |
| IO-09-D3 | 29 §29.7.6 | 同上 | Matrix（source の検査と前後の一覧の比較） | L3: 読んだ後に SD をレジへ戻して精算できる |
| IO-09-D4 | 29 §29.7.6 | 同上 | Matrix | 非対象 |
| BIZ-08-D3 | 37 §37.9 | runtime: `biz/daily_report_import_service` | Matrix | 非対象 |
| BIZ-08-D4 | 37 §37.3 手順 8・§37.4 手順 4a・6、pos-tables §12b | runtime: BIZ-08・`sales_repo.rs`・migration | Matrix | 非対象 |
| BIZ-08-D6 | 37 §37.3 手順 4・§37.4 手順 1a・§37.9 手順 7 | runtime: BIZ-08 の parse・commit・scan | Matrix | 非対象 |
| CMD-12-D1 | 45 §45.2・§45.6a・§45.6b | runtime: `daily_report_import_cmd.rs`・`lib.rs` | Matrix | 非対象 |
| IO-10 | 29 §29.8 | runtime: `io/pos_source_copy.rs` | Matrix | 非対象 |
| BIZ-08-D5 | 37 §37.4 手順 2a・6、§37.9 の BIZ-08-D5、pos-tables §12b、71 §71.1 の注記 | runtime: BIZ-08 commit | Matrix | L3: 取り込んだ後に `pos-sources/` に 3 本がある |
| UI-07-D12 | 55 UI-判断 ID | runtime: `features/daily-report-import` | Matrix | 目視の確認 |
| UI-07-D15 | 55 UI-判断 ID | 同上 | Matrix | L3: 一覧の状態の文言と icon、SD を戻す案内 |
| UI-07-D16 | 55 UI-判断 ID | 同上 | Matrix | 目視の確認 |
| IO-08-D10（改訂） | 29-io-ej-parser IO-08.10 | EJ の取込みの lane | 非対象（本 lane・runtime の SD lane とも） | 非対象 |
| 既存 BIZ-08-D1・D2、IO-07-D3、SPEC-SDI（同日追加の確認・insert-only・per-import rollback） | 37 §37.3〜§37.5、pos-tables §12b | 変えない（SD の経路も同じ §37.3〜§37.4 を通る） | 既存の test（runtime が回帰で回す） | 非対象 |
| 隣接の除外: Z004 の精算同一性 guard（ADR SPEC-STK-TIME、32 の時点証拠契約） | 32 §15 冒頭 | 変えない。§37.9 の引継ぎで参照だけ | 非対象 | 非対象 |
| 隣接の除外: UI-07 の Z004 タブの一時停止（SPEC-STOP-D4） | 55 §現行buildの一時停止 | 変えない | 非対象 | 非対象 |

## Contract Probe

- P1 SD-23（取込み前の `XZ` の原本と CV17 の取込み後の file が同じ bytes か）: 手元の資料では決まらない（説明書は「移動」とだけ書く）。設計は bytes の一致に依らない（同じ bytes なら hash、違えば精算回数で照らす。BIZ-08-D4・D6）。ただし、取込み前の原本の 3 本とも精算回数が読めて、取込み後の file と同じ値であることに依る。**runtime の lane の L3 の前に要る**（Plan Gate の前には要らない）。手順: 精算の後、CV17 を開く前に SD の `XZ` の Z の size・SHA-256 を読取り専用で採り、Z001 / Z002 / Z005 の精算回数が読めるかとその値の一致を IO-07-D3 の規則で確かめる（記録するのは「読めた・そろった・取込み後と同じ」の可否だけで、値や中身は書かない）。CV17 で取り込んだ後の `XZ_BKUP` と `EcrDatas` の同じ file と比べる。合否: (1) bytes が全件一致なら「同じ bytes」、1 件でも違えば「作り直す」（設計は変えず、Guarantee range の記録を更新）。(2) 原本の 3 本とも精算回数が読めて値がそろい、取込み後の file と同じ値なら合格。満たさなければ、runtime の lane の L3 の前に BIZ-08-D4 と BIZ-08-D6 を見直す（正規の SD の束が取り込めない、または二重取込みの照合が効かないため）。誰が: Codex が店の PC で metadata だけを採る（店の R-50。SD の採取は owner の別承認）。
- P2 SD-14（Z を `XZ` に何日も残したとき、レジの精算と SD の保存が続くか）: **扱いを決めた（2026-10-07）**。結果: 店は日々の売上（Z001 等）の CV17 の取込みを休んだ経験が無い（repo 外の回答台帳 TD-152・TD-175）。起票時の代わりの手順（普段どおりの精算を 2 日続ける間に取込みをしない試し）は行わない（owner 決定 2026-10-07、TD-176。取込みを止めることは店の業務を止めるため）。代わりの扱い（owner 承認 2026-10-07）: Z は精算のときだけ SD に書かれ、名前は日付と、同じ日の精算ごとの接尾字の 1 文字で決まる（SD-02・SD-08、説明書 C p.16）ので、別の日の Z と名前はぶつからない。同じ日の 2 回目以降の Z が、1 回目の Z を `XZ` に残したまま別の名前で書かれることは観測済み（SD-08）。EJ は約 1 か月 `XZ` に残っても精算が続いている（SD-09、P3）。運用の制約: 取込み済みを `XZ_BKUP` へ移す操作（D-111 (1) の (b)、TD-142、後続の lane）ができるまで、店は CV17 の取込みを今の運用のまま続ける（D-111）。よって Z が `XZ` に何日も溜まる状態は、本 lane と SD 直読みの runtime の lane では生じない。残る未確認（名前の衝突ではない）: `XZ` の file が数千本になったときのレジの振舞い（精算のときに既存の file を見て名前を決めるとみられることによる処理時間、FAT32 の 1 directory の entry 数の上限）。owner の見立て（要旨）は、名前は年月日と回数で決まり中身も同じなので、何千本でも衝突しない。これは (b) の lane（または CV17 の毎日の取込みをやめる時点）の前提に引き継ぐ（D-111 の Revisit）。
- P3 EJ を CV17 で移さずに長く置いたとき（店の実績の約 1 か月を超えて）、レジが `XZ` 直下の EJ への追記を続けるか: **合格（2026-10-07）**。結果: 店の EJ の取込みは毎月末日で、1 か月を超えて空けたことはなく、その間の異常は無い（repo 外の回答台帳 TD-139）。起票時の合否「経験上の異常が無ければ前提を受け入れ、runtime の lane の L3 の後の運用で `XZ` の EJ の size を見る」に当てて合格とする。扱い: (b) の lane まで店は CV17 の EJ の取込み（毎月末日）を続けるので（D-111 の運用の制約）、EJ が 1 か月を超えて `XZ` に残る状態は生じない。runtime の lane の L3 の後の運用で `XZ` の EJ の size を見る。
- P4 精算のときのスマホへの送信の失敗で、レジが「SD カードへバックアップ」した file（2026-10-07 にレジ本体の日計明細の精算で、レシートに「データは SD カードへバックアップしました。次回の精算時に自動送信されます」と出た。repo 外の回答台帳 TD-179）: その「バックアップ」が `XZ` の通常の Z・EJ を指すのか、別の file かは**未確認**。Plan Gate の前提ではない。設計は分岐しない: 名前の規則に合わない file は IO-09 が中身を読まずに数えるだけで（IO-09-D2、29 §29.7.5。未知の名前の file は SD-07 で観測済み）、規則どおりの名前の Z なら通常の候補になり、同じ精算の同じ bytes は hash で 1 つの候補にまとまり（§37.9 手順 6）、別の bytes でも精算回数で止まる（BIZ-08-D4・D6）。手順: runtime の lane の L3 の前に、送信の失敗が起きた日の後の SD の `XZ`・`XZ_BKUP` の名前の一覧を読取り専用で見て、規則に合わない名前の file が増えたかだけを確かめる（中身は読まない）。誰が: Codex が店の PC で名前の一覧だけを採る（SD の採取は owner の別承認）。
- 観測済みで probe の要らない前提: SD が取外し可能な drive として見える（SD-25）、`XZ_BKUP` = `EcrDatas`（SD-22）、名前の形・大文字の `EJ`・同じ日の複数の Z・未知の名前の file（SD-02・03・07・08）、`windows-sys` に `Win32_Storage_FileSystem` の feature がある（`src-tauri/Cargo.toml`）。

## Data Safety

- tracked に書かない: 実 SD・`EcrDatas` の file の中身、実 JAN・商品名・金額、実データの件数の細部、店主の発言の原文、repo 外の調査の path の詳細。本 lane の docs は名前の形・形の分類・照合の結果を質的に書いた。
- local-only: repo 外の SD の調査（2026-10-06 run01 / run02）と回答台帳。
- synthetic-only: runtime の lane の test は一時 directory に合成の SD の tree（合成の Z・EJ の bytes）を作る。

## Implementation Results

Fill after implementation.

## Review Response

round 1（`3ea4d25c`）: Claude 側 fresh Opus 5.5 = reject（P2 2 / P3 5）、Codex GPT-6.1 Sol（発注 235）= reject（P1 1 / P2 2 / P3 3）。Coordinator が現物で裏取りし、全件を採用した。是正は起草役の `d14cfacc`。

- P1（Codex #1、Opus #1 と同じ筋）SD の経路で精算回数の読めない束（`settlement_no = None`）を取り込めると、CV17 が後で書いた別 bytes・精算回数ありの同じ精算が hash と BIZ-08-D4 をすり抜け、追加確認だけで二重に保存される。重大度は P1 とした（運用の制約で CV17 の取込みが毎日続くので、この筋は毎日開く）。是正: BIZ-08-D6 を新設し、SD の経路は 3 本とも精算回数が読め値がそろう束だけを scan・preview・commit で受ける。予備の「ファイルを選んで取り込む」の扱いは変えない（D-111 の Guarantee range）。P1（SD-23）の合否に「原本の 3 本とも精算回数が読め、取込み後と同じ値」を足した。正規の SD の束はレジの原本で、CV17 の書出し（layout B）ではないので、本 guard で止まらない見込み（runtime の L3 の前の P1 で確かめる）。
- P2（両者）画面と手順の正本が CV17 の取込みを無条件に「要らない」としていた。是正: D-111 の運用の制約（(b) まで CV17 の取込みを今の運用のまま続ける）を 55・SCREEN_DESIGN・ARCHITECTURE・io-task-specs・plu-export・project-memory に条件付きで同期した。
- P2（Codex #3）新設の UI-07-D13 / D14 が既存の同日追加確認（UI-07-D13）・per-import 取消（UI-07-D14）と衝突していた（55:229・:244 で裏取り）。是正: 新設の 2 つを未使用の UI-07-D15・D16 に振り直し、本 lane の参照を同期した。
- P3: 申し送りの表の file:line と site 数を `6b765f75` で数え直し、merge 済みの lane を並走と書く文を直した（Opus #3・Codex #5）。`RegisterSdError` の使われない variant を消した（Opus #4）。§45.4 の commit の signature に `AppHandle` を足した（Opus #5）。Matrix に 3 行を足した（Opus #6）。D-111 の Decision の番号と AC の並びを直した（Opus #7）。AC7 の検索に除外と実測の期待を足した（Codex #6）。37 の「BIZ-08 は精算回数を保存しない」を保存の契約の文に置き換えた（Codex #4）。
- 起草役の判断で Coordinator が受けたもの: D6 の commit の検査を TX の前（手順 1a）と写しの前に置いた（束だけで決まる検査で DB の状態に依らないため、TX の中と同値で、拒む束の写しを先に書かない）。D6 で止めたとき予備の経路へ案内しない（同じ SD の file を手で選び直して穴を開け直さないため）。
- round 1 の後に足した事実: 2026-10-07 にレジ本体で精算した際のスマホ送信の失敗と SD への「バックアップ」（repo 外の回答台帳 TD-179）を Contract Probe の P4 に足した（Plan Gate の前提ではない）。
