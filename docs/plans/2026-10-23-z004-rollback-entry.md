# Plan Packet: Z004 の取込みを取り消す入口（結果の画面を離れた後にも誤った版を取り消せるようにする）

wave に属さない単独の lane。導入の前の関門の項目（owner の決定、repo 外の回答台帳 TD-380〈2026-10-22〉で関門の項目になった。起票は TD-402〈2026-10-23〉）。棚卸しの runtime b1（PR #188、branch `agent/stocktake-count-runtime-b`）の上に積む lane で、merge は #188 の後。本 commit は Plan Packet と Test Design Matrix の起票と、b1 が書き換えない節への plan-first の正本の追記だけで、実装は plan-approved の後の別の run。branch は `agent/z004-rollback-entry`（main `eed07d37` から）。新しい決定の番号（予約の D-134）と migration の番号（予約の 22 §24・MNT-03-D22）は使わない（決めたことは各正本の節の ID〈BIZ-03-D2・UI-07-D18・TRACE-D13〉に置き、DB の列を足さない）。

## b1 との関係（stacked、b1 の後に merge）

- b1 の契約の正本は、b1 の Plan Commit `aba17e2e2422695b2ffff6bcd3fd9bebebf24339` と、その後の Gated Amendment 2 本: `5b53294040ff38d2aeb8366aefd02142ffb2c764`（fresh な計数の判定の n と完了の時点の精算の n を取込み ID のカーソル〈`seen_import_id`・`cutoff_import_id`〉から求める。owner の決定、repo 外の回答台帳 TD-400）と `bc0bf2f5d5a6a573bd76cf14e11380d8c407ddbe`（取り込み直した取込みは判定の n の算出に入らず、その精算 k は k ≤ 判定の n なら数に入る。日付で判定するのは、取り込み直した精算が判定の n だった場合だけ。ADR D3・D7）。本 packet の正本の読みは最後の版を基準にした（`git show bc0bf2f5:<path>`）。
- 実装の名前は、b1 の branch の実装の 1 段目（`agent/stocktake-count-runtime-b`、`a7912eea`。起票の途中で push された）で確かめた（`src-tauri/src/biz/csv_import_service/rollback.rs` の `rollback_csv_import`、`src/features/csv-import/components/ResultStep.tsx` の `RollbackResultCard`、`src/features/stocktake/components/RecheckTargetList.tsx`）。b1 の merge の後の版で名前・形が変われば、同期で本 packet・Matrix・正本の追記を当て直す（下の「b1 への依存」の各行が当て直しの対象）。
- 本 lane の branch は main から作り、b1 の merge の後に `origin/main` を単段で取り込む（`git -c merge.directoryRenames=false merge origin/main`。`docs/DEV_WORKFLOW.md` Stacked train）。plan-gate へは Coordinator が進める（b1 の merge の前に Plan Review を回すかは Coordinator が決める。b2〈PR #193〉は owner の決定 TD-402 で前倒しした）。
- 本 commit の正本の追記は、b1 の branch（`40ee8de4` と `a7912eea`）が変える hunk と重ならない位置に、新しい節として置いた（下の「本 commit で変えた正本」。merge の衝突を作らないため。重なる節の書き換えは「b1 の merge の後に同期する節」）。

## 規模と手法

2026-10-23 に本 worktree（HEAD `eed07d37`）で数えた（command は逐語、出力を写した）:

| 区分 | 数 | command と出力 |
|---|---|---|
| 新しい Tauri command | 1（`preview_rollback_csv_import`）。CMD-07 の今の command は 5 | `rg -n 'cmd::csv_import_cmd::' src-tauri/src/lib.rs` → 10 行（Specta の登録〈`export_bindings_to` の `collect_commands!`、316〜320 行〉と runtime の登録〈`run` の `tauri::generate_handler!`、1531〜1535 行〉に 5 つずつ: `parse_and_validate_csv`・`commit_csv_import`・`rollback_csv_import`・`list_csv_imports`・`get_csv_import_record`） |
| 新しい wire の型 | 2（`RollbackPreview`・`AffectedStocktake`）。形の変わる今の型は 0（`RollbackResult`・`CsvImportRecordDetail` は変えない） | `rg -c '^export type RollbackPreview =' src/lib/bindings.ts` → exit 1（無い） |
| 取消を呼ぶ画面の code | 1 file（`commands.rollbackCsvImport` は Z004 の取込みの hook だけ） | `rg -l 'commands.rollbackCsvImport' src --glob '!src/lib/bindings.ts' --glob '!*.test.*'` → `src/features/csv-import/hooks/useCsvImportFlow.ts` |
| destructive の確認 dialog の今の置き場 | 11 file（`AlertDialogAction` を使う production の file） | `rg -l 'AlertDialogAction' src -g '!*.test.*'` → 11（下の Matrix の Adjacent Pattern Audit） |
| 画面 | 3（CSV取込みの詳細〈65〉、Z004 タブの結果の画面と上の導線〈55〉、`/csv-import` の search） | 下の Scope の S3 |
| migration・DB の列 | 0（取消の本体と列は b1。preview は書かない） | — |
| 予定 path | 39（Rust 10・TS 16・docs 13〈packet と Matrix を含む〉。下の「予定 path の一覧」） | 下の一覧の行数 |

手法: **1 lane・1 PR のまま S1〜S4 の段に積む。** 理由: 新しい書く経路は無く（取消の本体は b1）、足すのは読取り 1 つ（取消を TX の中で当てて戻す preview）と、順 4 の拒否の文、入口・確認・導線の画面だけで、39 path は 1 回の L3（10 分の見込み）で確かめられる。段は検証の単位で切る（S1 BIZ・IO と S2 CMD・wire は 1 つの Rust の検証の単位、S3 画面は frontend の検証の単位、S4 は docs と生成物）。b1 の後に merge するので、実装は b1 の merge と同期の後に着手する（b1 の取消の本体と `RollbackResult.recheck_targets`・要再確認の一覧の部品に依る）。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票。実装の Writer は plan-approved の後に Coordinator が発注で決める）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）。座組表どおり
- Final Reviewer: Fable 5.1（Claude 側、R3 以上）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge,manual
- Branch: agent/z004-rollback-entry

遷移の記録:

1. kickoff → spec-check（2026-10-23、起草役）: Coordinator の発注（TD-380 の関門の項目、TD-402 の起票）を範囲にし、規模を数えて 1 lane にした（上の「規模と手法」）。Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-23、起草役）: 対象の設計正本は ADR SPEC-STK-CNT-D2・D3・D6・D7（Gated Amendment の版）、[32](../function-design/32-biz-csv-import-service.md) の取消と §15.5・§15.6a、[41](../function-design/41-cmd-pos.md) §17.5、[55](../function-design/55-ui-csv-import.md) の冒頭の D-118 の表・UI-07-D14・§55.4 の手順 18・§55.9、[65](../function-design/65-inventory-record-traceability.md) §65.5・§65.8.1・§65.10 の 4b、[35](../function-design/35-biz-stocktake-service.md) の完了の後の比較の範囲、design-system の DSR-07・DSR-08・DSR-20。設計の更新が要る点が 3 つあった（取消の前の読取りの関数と wire、CSV取込みの詳細の取消の入口、2 つの入口に共通の確認と導線。下の Design Readiness）。
3. design → plan-draft（2026-10-23、起草役、本 commit）: 上の 3 つを 32・41・55・65 の新しい節（BIZ-03-D2・CMD-07 の command・UI-07-D18・TRACE-D13）に本 packet と同じ commit で置いた。b1 が書き換える節（55 §55.4 の手順 18、65 §65.10 の 4b、32 の順 4 の message ほか）は main の版で先に直さず、b1 の merge の後の同期で直す節として Scope に挙げた。製品の振舞いで owner の判断が要る問いは 3 つ（下の「owner の判断事項」）で、推奨を既定に書き進めた（owner の方針、repo 外の回答台帳 TD-401）。plan-gate へは Coordinator が進める。
4. plan-draft → plan-gate（2026-10-24、Coordinator、本 commit）: owner の判断事項は owner の方針（repo 外の回答台帳 TD-401）で推奨を既定にした（TD-404。後で owner に見せ、答えが変われば plan-gate のまま直す）。packet と Matrix が揃い commit されている。main（`843c4938`、PR #191・#200 の後）を単段で取り込んだ（衝突: なし）。Plan Review round 1（fresh Opus 5.5 + Codex）に出す。
5. plan-gate のまま是正（round 1、2026-10-24、Coordinator、本 commit）: round 1（Claude 側 fresh Opus 5.5 と Codex）の reject を起草役が `fd2c1f8c` で直した（下の Review Response）。設計の方向は変えないので plan-gate に留め、round 2（fresh Opus 5.5 + Codex）で再 review する。
6. plan-gate のまま是正（round 2、2026-10-24、Coordinator の代行、本 commit）: round 2（Claude 側 fresh Opus 5.5 と Codex）の reject を Coordinator の裁定に沿って直した（下の Review Response）。設計の方向は変えないので plan-gate に留め、round 3（fresh Opus 5.5 + Codex。Plan Review round 天井の 3 回目）で再 review する。

## Owner Effort Budget

- 介入回数上限: 7（既定の 6 を上げた理由: owner の判断事項 3 つは推奨を既定にして書き進め、後で 1 回の問い合わせに束ねても decision point の数で数える〈`docs/DEV_WORKFLOW.md` Owner Effort Budget〉。L3 の 2 round 目の予備に 1）
- 実働時間上限: 30 分（既定。L3 は見込み 10 分）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 7 | 0（2026-10-23） | 6（owner の判断事項 (i)〜(iii) の 3、L3 と画面の確かめ 1、Ready 1、merge 1） | 1（L3 の 2 round 目） | 7 = 0 + 6 + 1 |

owner の操作の回数を減らす工夫: (1) owner の判断事項は推奨つきで返事が記号 1 つの形にし、b1・b2 の L3 か Ready の依頼と同じ問い合わせに束ねてよい（decision point は数える）。答えが推奨と違えば plan-gate のまま Scope を改める（遷移 4。下の各項の「答えで変わる所」）。(2) L3 の入力物は b1 の L3 の fixture の生成（b1 の S9 の `src-tauri/src/io/l3_fixtures.rs`）が作る `products-new.csv`・`z004-0101.csv`・`z004-0102.csv` だけで、本 lane は fixture を足さない。Coordinator が L3 を頼む日に作り、Windows の path を省略せずに渡す（owner は file を作らない）。(3) L3 の DB は Coordinator が b1 の L3 の「差し替え」と同じ手順（22 §16 の作り直しの手順 2〜4 で data の folder を消さずに移す）で空の DB にする（owner は起動と終了だけ）。(4) L3 は 1 本の通しの台本で、各段の PASS / FAIL だけを返してもらい、画面の確かめ（Human Visual Confirmation）を同じ 1 回に含める。(5) Ready と merge は owner が 1 回の返事で「Ready にして hosted が緑なら merge」と委ねられる（decision point は 2 で数える）。

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason（行ごとの判定。発注の「R3 か R4」を行ごとに当てた）:

| 変更 | Risk Tiers の行 | 判定 |
|---|---|---|
| CSV取込みの詳細に取消の入口を足す | R3 の「operator workflow」（取消の画面の入口が 1 つから 2 つになる） | R3 |
| 取消の前の読取り `preview_rollback_csv_import`（新しい Tauri command と DTO・bindings） | R3 の「Tauri command DTO」 | R3 |
| preview が取消を TX の中で当てて戻す（BIZ-03-D2） | R4 の「Destructive data lifecycle」に当たるかを確かめた: 何も残さない（明示の rollback。Contract Probe P1）。戻しの失敗は TX の外へ書きを出さない（SQLite の TX の原子性）。当たらない。誤って COMMIT した場合の害は「確認なしの取消」で、取消そのものは論理の無効化（`is_voided`）で行を消さず、正しい版の取り込み直し（ADR D7）で戻せる | R3（Matrix の RB2 が何も書かないことを止める） |
| `/csv-import` の search に `tab` | R3 の「route/search state」 | R3 |
| 取消の本体（無効化・求め直し） | 変えない（b1。b1 の packet が R4 で扱った） | 対象外 |

R4 の行（破壊的なデータの寿命・backup の復元・実データの露出・secret・不可逆な git の操作）には当たらない: migration も DB の列の追加も無く、取消は今の論理の無効化のままで、本番の DB は無い（`docs/project-memory.md`）。workflow の file（`.github/`・`scripts/`）に触れないので classifier の `workflow=true` にならず Final Review Minimum は 1。operator に見える状態（取消済みの表示と要再確認の一覧）の lifecycle を扱うので、Contract Audit の 2 本目は任意の推奨（`docs/DEV_WORKFLOW.md` Contract Audit の Double audit）として Coordinator が決める。

Rollback / recovery notes: DB を変えないので、merge の後に戻すのは revert の PR で足りる（入口・確認・preview の command が戻る）。取消した取込みは、今と同じく正しい版の取り込み直しで戻る（ADR D7）。

required gate の green / red: gate の定義は変えない。bindings と traceability の再生成を落とすと既存の required gate（bindings・traceability）が red になる（下の Registration / Generation Obligations）。

## Goal

Goal Invariant:

### 最小完了条件

- 取り込んだ後に結果の画面を離れても、入出庫履歴（種別「CSV取込み」）か Z004 タブの「取り込んだ記録を見る」から CSV取込みの詳細を開き、「この取込みを取り消す」で取り消せる（[65](../function-design/65-inventory-record-traceability.md) §65.5a）。取消は今の取消と同じ経路（ADR SPEC-STK-CNT-D7、b1 の新しい経路）で、売上と movement を無効にし、在庫を記録から求め直す。
- 取り消す前の確認が、取り消した後に要再確認である商品（商品・範囲・理由。取り消す前から要再確認の商品を含む）、取り込み直す精算の番号、記録の詳細の差異・ロス原価・参考の差が変わることがある完了した棚卸し（この取込みの精算が完了の後の比較の範囲に入る棚卸し）を名指し、取込みの結果の画面の「取り消す」も同じ確認になる（[55](../function-design/55-ui-csv-import.md) UI-07-D18、[32](../function-design/32-biz-csv-import-service.md) §15.6b）。
- 取り消した後に、その画面で要再確認の一覧（入れ直しへの導線）と、正しい版を取り込む導線（Z004 タブを直接開く）が出る。

### 失敗定義

- 結果の画面を離れた後に、アプリの中で取込みを取り消す操作が無い、または取消済みの取込みに取消の入口が出る。
- 確認が名指す要再確認の商品が、同じ状態で取り消したときの `RollbackResult.recheck_targets` と違う。確認の読取り（preview）が売上・movement・写し・取込みの状態・操作ログのどれかを変える。
- 確認の読取りが終わる前か失敗したときに「取り消す」を押せる（何が起きるかを示さないまま取り消させる）。
- 2 つの入口で確認の中身・取消の後の処理（Toast・再取得・失敗の再試行）が違う。
- 取消の後に詳細・入出庫履歴・在庫・要再確認の一覧が古いまま残る（D-052 の C9 の再取得が当たらない）。
- 要再確認を色だけで示す。

### 非目的

- 取消の本体（無効化・求め直し・要再確認の判定）を変えること（b1）。日報の取込みの取消の入口（日報には CSV取込みの詳細のような記録の詳細の画面が無い。日報の取消は今の結果の画面のまま）。
- 入庫・返品交換・手動販売・廃棄の業務記録の取消（REQ-208、[65](../function-design/65-inventory-record-traceability.md) §65.7.2。`coverage=deferred`）。
- 専用一覧 `/csv-import/records`（§65.3 の完成形。横断検索で探せるので runway のまま）。
- 取り込み直したときに数え直しが要る見込みの商品を、取り消す前に並べること（下の「owner の判断事項」の (ii)。推奨は並べない）。
- 照合の基準（32 の順 2 の machine_no）を入れ替える操作（b1 の残りの危険。owner の決定 TD-388 で作らない）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更（operator の操作と command の契約）なので、店の通常の操作列を置く。例の数・日付は説明用の合成の値（下の L3 の台本と同じ形）。本 lane の merge の後に下の列が成り立つ。**この文書を完了できる**ことと、**結果の画面を離れた後に誤った版を取り消して取り込み直す通常運用を達成できる**ことは同じ（b1 の取消の経路に、入口と確認が揃う）。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 精算 101（10-01、商品 B と C の売上）と 102（10-02、商品 A の売上）を取り込み、結果の画面を離れた。A は 10-01 の日付で数 10 を保存した（既定の計数。10-01 に精算 101 があるので 102 は数に入らず、A の在庫 9、要再確認でない） | 101 が別の日の版だったと気づき、Z004 タブの「取り込んだ記録を見る」を押す | 入出庫履歴が種別「CSV取込み」で開き、取込みの行が並ぶ | 行の「詳細」で CSV取込みの詳細へ進める | 65 §65.8.1、55 UI-07-D18 |
| 同じ | 101 の詳細の「この取込みを取り消す」 | 確認に、取込みID・精算日 10-01・「精算 101」・ファイル名・件数・金額、「取り消した後、次の商品は数え直しが必要です（今すでに必要な商品を含みます）」と A・範囲「9〜10」・理由、取り込み直しの文（精算 101）。完了した棚卸しは無いので、その文は出ない。読み終わるまで「取り消す」は押せない | 「取り消す」かキャンセル | ADR D3 の A1（10-01 に精算が無くなると 102 が最初の 1 本で決まらない）。32 §15.6b、Contract Probe P1 |
| 同じ | 「取り消す」 | Toast「取込みを取り消しました」。詳細は「この取込みは取消済みです」になり、取消の入口が消える。同じ画面に取消の結果（取り消した件数、A の要再確認と「棚卸しの画面で入れ直す」）と「商品別CSV取込み（Z004）を開く」 | — | 65 §65.5a、b1 の `RollbackResultCard` |
| 同じ | 「商品別CSV取込み（Z004）を開く」→ 正しい版の 101 を取り込む | Z004 タブが直接開き、取り込める（取り消した取込みは同じ精算の比べる先にならない。ADR D7）。10-01 に精算が戻り 102 は数に入らない側に決まり、A の要再確認が解ける | — | 55 UI-07-D18 の `tab`、32 の順 3〜5 |
| 10-02 の取込みの結果の画面にいる | 「取り消す」 | 上と同じ確認（読取り・名指し・押せる条件が同じ） | — | 55 UI-07-D18 |
| 年末の棚卸しを 12-31 に完了した後、12-30 の取込みが誤った版だったと気づいた | 詳細の「この取込みを取り消す」 | 確認に「完了した棚卸し（12-31）の評価額は変わりません。棚卸しの記録の詳細の「差異」「ロス原価」と「完了の後に入った記録による差（参考）」が変わることがあります。」（名指すのは、12-30 の精算が完了の後の比較の範囲に入るから。12-31 の計数で完了したので 12-30 の精算は計数に入り、取り消すと 12-30 に売れた明細の商品の差異〈計数 − 帳簿〉とロス原価が変わり、参考の差〈完了の時点の在庫 = 計数〉は変わらない。記録の詳細は差異とロス原価を今 active な精算から求め直すため〈b1 の `stocktake_service.rs` の 720 行の `ledger_at_cutoff` と 724 行のロス原価〉。その精算が明細の商品を売っていなければどれも変わらないが、同じく名指す） | 取り消して正しい版を取り込み直す | ADR D6 の非遡及、35 の完了の後の比較の範囲 |

失敗と再試行: 確認の読取りの失敗は dialog の中の文で、「取り消す」を押せない（閉じて開き直すと読み直す）。取消済みの取込みを古い画面から開いた確認は、BIZ の文（「この取込みは取り消し済みです」）で「取り消す」を押せない。取消の失敗は Toast で、同じ取込みID のまま再試行できる（55 §55.9）。

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項

入口の置き場と取り消せる範囲は正本で一意に決まる（下の「起票時に確かめた 3 つ」）。正本で一意に決まらず、owner の判断が要る問いは次の 3 つ（推奨は candidate）。owner の方針（repo 外の回答台帳 TD-401）で owner に今は聞かず、推奨を既定に書き進めた。

(i) 売上データ取込みの Z004 タブに、過去の取込みへの導線を置くか。

- A（推奨）: Z004 タブの上に「取り込んだ記録を見る（取り消すときはここから）」を置き、入出庫履歴を種別「CSV取込み」で開く（55 UI-07-D18）。理由: 誤った版に気づくのは Z004 の取込みの最中（preview の拒否「同じ精算と思われる別の資料が既に取り込まれています」）か、結果の後に Z004 タブへ戻ったときが多く、その画面から取消の入口へ行ける（AGENTS.md の「使い手に押しつけない」）。部品は既存の link 1 つで、新しい一覧を作らない。
- B: 置かない（入出庫履歴は Sidebar から開ける）。
- C: Z004 タブに取込みの履歴の一覧を足し、行から取り消す（65 §65.8.1 の「行内に取消/訂正ボタンは置かず」と合わず、入出庫履歴と同じ検索を 2 つ持つ）。
- 答えで変わる所: B なら、S3 の Z004 タブの link（`CsvImportPage.tsx` の link。`tab` の search は取消の結果の導線が使うので残す）、Matrix の U8 の link の case、AC3 の `rg -c 'recordType: "csv_import"' src/features/csv-import/CsvImportPage.tsx` とその baseline、55 §55.11 の「取り込んだ記録への導線」の項、65 §65.5a の「到達」の Z004 タブの導線、Goal の最小完了条件の 1 つ目と Ordinary Operation の 1 行目の「取り込んだ記録を見る」（入出庫履歴を Sidebar から開く操作に）、L3 の R-3 と R-8（同じく Sidebar から入出庫履歴を開き、種別「CSV取込み」で絞る操作に）、S4 の SCREEN_DESIGN の同期の行の導線を外す。C なら design へ戻る（65 の改訂が要る）。

(ii) 取り消す前の確認に、取り込み直したときに数え直しが要る見込みの商品を並べるか（ADR D3・D7 の Gated Amendment 2 本の版: 取り込み直した取込みは判定の n の算出に入らず、その精算 k は k ≤ 判定の n なら数に入る。日付で判定されるのは取り込み直した精算が判定の n だった場合〈取り消すと n が下がり k > n になる〉だけで、そのとき精算日が計数の日なら、その精算に行のある商品は要再確認になる。owner の決定 TD-400）。

- A: 並べる（取り消す版の行と、その精算日の計数から見込みを求める。BIZ の読取りが増える）。
- B（推奨）: 並べず、「取り込み直した結果に、数え直しが必要な商品が出ることがあります」と書く。どの商品かは取り込み直した取込みの結果の要再確認の一覧（b1 の `ImportResult.recheck_targets`）で名指す。理由: 見込みは取り消す誤った版の行から求めるので、取り込み直す正しい版の行で外れうる（誤った版と正しい版で売れた商品が違うことが、取り消す理由そのもの）。確かな一覧は取り込み直した結果にあり、その画面で入れ直しへ進める。
- 答えで変わる所: A なら S1 に読取り、`RollbackPreview` に field（32 §15.6b の field と処理ステップ、41 の出力型、Boundary の wire type、AC2 の型の rg）、55 §55.11 の「取り込み直し」の項の文、Matrix の RB と U3 に行が加わり、Goal の非目的と Non-scope と残りの危険の 4 つ目から外す。

(iii) 記録の詳細の差異・ロス原価・参考の差が変わることがある完了した棚卸しを、確認で名指すか（ADR D6 の非遡及。取り消しても完了した評価額は変わらず、記録の詳細の明細の差異・ロス原価と参考の差が変わることがある）。

- A（推奨）: 名指す（`RollbackPreview.affected_stocktakes`、35 の完了の後の比較の範囲の規則で決める）。名指すのは範囲の判定による候補で、記録の詳細のどの数が実際に変わるかは見ない（例: 精算 101・102 が明細の商品を売っておらず、全商品を fresh に数えて 12-31 に完了した後に 101 を取り消すと、101 は範囲に入るので名指すが、差異・ロス原価・参考の差のどれも変わらない）。だから文は「変わることがあります」と書く。理由: 年末の棚卸しの後に年末の取込みの誤りに気づく場面で、取り消すと棚卸しの評価額が変わるのかを利用者が心配せずに済み、記録の詳細のどの数（「差異」「ロス原価」と参考の差）が変わりうるかを確認の画面で知れる。範囲の規則は BIZ-06 の共有の関数を使い、写さない。
- B: 名指さず、確認に常に「完了した棚卸しの評価額は変わりません」と書く（読取りは要らないが、棚卸しの無い店の毎回の確認に要らない文が出る）。
- C: 何も書かない。
- 答えで変わる所: B・C なら、S1 の stocktake_repo の読取りと BIZ-06 の共有の関数の公開、`AffectedStocktake` と `RollbackPreview.affected_stocktakes`（Boundary の wire type、41 の出力型）、AC2 の `rg -c '^export type AffectedStocktake =' src/lib/bindings.ts`、32 §15.6b の `affected_stocktakes` の field と処理ステップの手順 3、65 §65.5a の「確認」の項の名指し、Matrix の RB6 と U3 の棚卸しの case、「b1 の merge の後に同期する節」の 35・20 の行、予定 path の `src-tauri/src/biz/stocktake_service.rs`・`src-tauri/src/db/stocktake_repo.rs`・`docs/function-design/35-biz-stocktake-service.md`・`docs/function-design/20-io-product-repo.md`（20・35 は所有表の行も）、Goal の最小完了条件の 2 つ目と Ordinary Operation の最後の行、Contract Ledger の `affected_stocktakes` の行を外す。55 §55.11 の「完了した棚卸し」の項は、B なら常に出す 1 文（「完了した棚卸しの評価額は変わりません」）に、C なら外す（U3 の期待も同じに）。

店主に新しく聞く必要がある事項: 無い。

## 起票時に確かめた 3 つ（Coordinator が確定した事実と、発注の「正本で一意に決まらなければ」）

1. 入口の場所: **正本で一意に決まる**。[65](../function-design/65-inventory-record-traceability.md) §65.5「取消/訂正 CTA は、`status === "active"` かつ対象記録種別の cancel / correct command が実装済みの場合だけ表示する」と、同節の表の「取消/訂正情報」の行の CSV取込みの列「rollback」、§65.8.1「行内に取消/訂正ボタンは置かず、詳細画面で確認してから行う」。CSV取込みの取消 command は `rollback_csv_import`（実装済み、b1 で新しい経路）なので、§65.5 の条件は CSV取込みの詳細に CTA を出すことを求める。§65.10 の 4b の「rollback CTA は置かず（取込み画面 UI-07 の責務のまま）」は詳細の画面を足したスライスの範囲の記録で、置き場の決定ではない（本 lane の同期で「このスライスでは置かなかった」に直す）。b1 の packet の Non-scope の「正本は決めていない」は、§55.0 の停止の節の「取消の画面入口は結果 step だけ」（b1 が停止の節ごと外す。b1 の `c2ca5aad` で外れた）と 4b の文を読んだもので、§65.5 の条件を当てると一意に決まる。
2. 取り消せる範囲: **正本で一意に決まる**。どの active な取込みでも取り消せる。[32](../function-design/32-biz-csv-import-service.md) §15.5 は指定した ID だけを無効にし（同じ日の他の取込みを残す）、ADR D7 は対象の取込みに条件を置かず、取消の後の求め直しは精算の一覧の今の状態から決まる（ADR D2・D3。直近の取込みかどうかに依らない）。§65.5 の表示条件は「active」（取消済みには出さない）。
3. 確定の後の期間の制限: **正本で一意に決まる**。制限しない。ADR D6 は完了した評価額を後の記録で変えず（非遡及）差を示し、Gated Amendment 2 本目（`bc0bf2f5`）の版の ADR の Consequences は「完了の時点の精算の n の精算を完了の後に取り消して取り込み直すと、…その精算で在庫が動いた明細の記録の詳細の参考の差の、確定の差に出る（評価額と在庫は変わらない。挙動は D6 のまま）」と、完了の後の取消を前提に書く。35 の完了の後の比較の範囲は今の記録（取り消した取込みを除く）から求める。

## 起票時に起草役が決めたこと

設計の値を変えない技術の判断と配布の細部。Coordinator が覆せる。32・41・55・65 の新しい節に置いた（1〜5）か、実装の PR で正本へ置く（6・7）。

1. 取消の前の読取りは、取消の本体を同じ TX の中で当てて明示の rollback で戻す（32 BIZ-03-D2）。理由と棄却案は 32 §15.6b。b1 の `rollback_csv_import`（`a7912eea`）の手順 2〜3（無効化・状態・`recompute_for_settlement_change`・`recheck_targets`）を TX を受ける 1 つの関数に切り出し、取消と preview がそれを呼ぶ（同じ規則を 2 つ持たない）。
2. preview の wire は `RollbackPreview { csv_import_id, settlement_no, recheck_targets, affected_stocktakes }`。取込みID・精算日・ファイル名・件数・金額は呼ぶ側が既に持つ（結果の画面は `ImportResult` と preview の file 名、詳細は `CsvImportRecordDetail`）ので preview に写さない。精算回数は今の 2 つの型に無いので preview が返す（`CsvImport`・`CsvImportRecordDetail` は新しい列を読まない b1 の決定を変えない）。
3. 取消済みの取込みの preview は `ValidationFailed`（「この取込みは取り消し済みです」）にする。取消の本体の冪等の Ok（取消済みには 0 件で成功）は変えない（2 つの画面の間の競合で、押した側を失敗にしないため）。
4. 確認の部品は 1 つ（`src/features/csv-import/components/RollbackConfirmDialog.tsx`）で、取込みの結果の画面と CSV取込みの詳細が使う。取消の mutation（成功の Toast の表示時間 8 秒・D-052 C9 の再取得・失敗の Toast）は `src/features/csv-import/hooks/useRollbackCsvImport.ts` の 1 つにし、`useCsvImportFlow` は成功の後の reducer の dispatch と b1 の `rollbackResult` の保持だけを持つ。
5. Z004 タブを直接開く search `tab`（`daily-report` | `z004`）の値の集合は、feature の `src/features/csv-import/types.ts` が readonly tuple `CSV_IMPORT_TAB_VALUES` と Zod schema `csvImportSearchSchema`（`tab: z.enum(CSV_IMPORT_TAB_VALUES).optional().catch(undefined)`）と型 `CsvImportSearch` で持つ（UI_TECH_STACK UI-STATE-D2〈`docs/UI_TECH_STACK.md` の 316〜320 行〉。同じ形の先例は `src/features/daily-sales/types.ts` の `dailySalesSearchSchema` と `src/routes/reports/daily.tsx` の import）。`src/routes/csv-import/index.tsx` はその schema を import して `validateSearch` に渡すだけで、値の集合を持たない。`CsvImportPage` の `Tabs` の `value` と取消の結果の link の `tab` も同じ tuple・型から取る。`tab` は `Tabs` の `defaultValue` にだけ使う（初期選択だけ。タブの切替で URL を書き換えず、同じ mount の間に戻る・進むで search が変わってもタブの状態を保つ）。route の新設は無い。
6. 32 の順 4 の拒否の文に取込みID を足す（「同じ精算と思われる別の資料が既に取り込まれています（精算 {n}、取込みID: {id}）」。取込みID の書き方は順 2 の文と同じ）。理由: 誤った版に気づくのはこの拒否のときが多く、入出庫履歴の「記録ID」の絞り込み（§65.4.1）でその取込みを開ける（順 2 の拒否の文は取込みID を名指す。b1 の closure の是正と同じ形）。文を作るのは b1 の `src-tauri/src/biz/csv_import_service/parse.rs` の `check_settlement_rules`（`c667d52c` の 95〜98 行は「精算 {}」だけ）で、preview（`parse_and_validate`）と確定の TX の取り直しの両方がこの関数を通る。名指す ID は `sales_repo::find_active_imports_for_settlement`（`c667d52c` の 328 行。`(id, file_hash)` を id の昇順で返す）の先頭の行の id（順 4 があるので同じ精算の active な取込みは通常 1 つ）。b1 の file と b1 が持つ表の文なので、b1 の merge の後に本 lane の S1 で code・既存 test の期待・32 の表を直す（Scope の S1、Matrix の RB7）。
7. preview の query key は `queryKeys.inventoryRecords.csvImportRollbackPreview(importId)`（`inventoryRecords.root()` の下）。D-052 の C9（`csvImportRollback`）は `inventoryRecords.root()` を含むので、SSOT の entry を変えずに取消の後に残らない（`src/lib/invalidation-contract.ts` は変えない）。

## b1 への依存

b1 の Plan Commit と Gated Amendment の版の名前で書き、b1 の `a7912eea`で確かめた名前を添える。b1 の merge の後の版で名前・形が変われば、同期で本 packet・Matrix・正本の追記を当て直す。

1. 取消の本体: b1 の `rollback_csv_import`（32 の取消、b1 の S5）。売上と movement の無効化、取込みの状態、ADR D2 の求め直す商品（`a7912eea` では `biz::stock_ledger::recompute_for_settlement_change`）、要再確認の一覧（`a7912eea` では `biz::stocktake_service::recheck_targets`）。`c667d52c` の `rollback.rs` の 51〜55 行は求め直した全ての商品（計数を持つ全ての商品とこの取込みの商品）を `recheck_targets` に通し、`stocktake_service.rs` の 372 行の `recheck_targets` は写しが要再確認の商品を全部返すので、一覧には取り消す前から要再確認の商品も入る（確認の文はこれに合わせて因果を言わない。55 UI-07-D18）。本 lane はこれを TX を受ける関数に切り出すだけで、規則を変えない。
2. `RollbackResult.recheck_targets` と `CountRecoveryTarget`（40、b1 の S7）。preview の `recheck_targets` は同じ型。
3. 要再確認の一覧の部品: `src/features/stocktake/components/RecheckTargetList.tsx`（`c667d52c` の 25 行で `renderAction` は必須。36 行の「棚の数を確かめて入れ直してください。」と 43 行の「操作」列を常に出す。呼出し元は `ResultStep.tsx` の `RecheckTargets` と `StocktakePage.tsx` の 2 つ）と、`src/features/csv-import/components/ResultStep.tsx` の `RollbackResultCard`（取消の結果）。確認の中の一覧のために、本 lane は b1 の file の `RecheckTargetList` を変え、`renderAction` を任意にして、省略したときは「操作」列と入れ直しの文を出さない（S3。2 つの呼出し元は `renderAction` を渡したままで、表示と操作を変えない）。詳細の取消の結果は `RollbackResultCard` をそのまま使う。
4. 精算回数: 24 の「active な Z004 の精算の一覧」（import ID・`settlement_no`。b1 の S2）。
5. 完了の後の比較の範囲: 35 の `get_stocktake_record` の範囲の規則と、完了の時点のカーソル（Gated Amendment の版の `cutoff_import_id`・完了日）。BIZ-06 の中の判定を `pub(crate)` の関数にして BIZ-03 から呼ぶ（規則を写さない）。完了した棚卸しの一覧の読取りは stocktake_repo に足す（20 に置く。b1 が触る 20 の D-118 の節の外）。
6. 取消の再取得: D-052 の `csvImportRollback`（b1 の S8 で要再確認の一覧の key を足した版）。本 lane は entry を変えない。
7. 取込みの結果の画面: b1 の S8 が `ResultStep.tsx`・`useCsvImportFlow.ts`（`rollbackResult` の保持）・`CsvImportPage.tsx`（停止の Alert を外し、取消の結果を出す）を変える。本 lane は確認の中身と mutation の置き場だけを変える。
8. `CmdError` の形: b1 が `stocktake_recovery` を足す。本 lane の TS の mock は同期の後の形に合わせる。
9. 生成物: `src/lib/bindings.ts` と `docs/function-design/90-traceability.md` は b1 の merge の後に本 lane の head で再生成する（手で解かない。D-098）。
10. L3 の fixture: b1 の S9 の `src-tauri/src/io/l3_fixtures.rs` が作る `products-new.csv`・`z004-0101.csv`・`z004-0102.csv`（b1 の packet の「L3 の fixture の表」）。

## この変更で不要になるもの

- 記述（b1 の merge の後の同期で置き換える）: [65](../function-design/65-inventory-record-traceability.md) §65.10 の 4b の「rollback CTA は置かず（取込み画面 UI-07 の責務のまま）」（「このスライスでは置かなかった。取消の入口は §65.5a」に）。[ui-task-specs](../architecture/ui-task-specs.md) の UI-07 の「Z004商品別CSV完了取消し → CMD-07 rollback_csv_import（既存トラック）」（入口 2 つと preview に）。[55](../function-design/55-ui-csv-import.md) §55.4 の手順 18 の確認の文（UI-07-D18 を引く形に）。32・41・55・65 の本 commit の新しい節の「proposed・未実装」。
- code: `src/features/csv-import/hooks/useCsvImportFlow.ts` の `rollbackMutation` の本体（Toast・再取得・失敗の Toast）を共有の hook へ移して外す。`src/features/csv-import/components/ResultStep.tsx` の確認の `AlertDialog` の中身（今の文と dl）を共有の確認へ置き換えて外す。`src-tauri/src/biz/csv_import_service/parse.rs` の順 4 の文の「（精算 {}）」だけの形と、それを固定の文で見る既存の test の期待 3 件（取込みID を入れた文へ置き換える。Matrix の T5）。
- 確かめるだけ（b1 が外す）: 55 §55.0 の「取消の画面入口は結果 step だけ」（b1 が停止の節ごと外す。AC5 の `rg` で 0 を確かめる）。
- 不要にならないと確かめたもの: 取消の本体の冪等の Ok（2 つの入口の間の競合で要る。上の「起票時に起草役が決めたこと」の 3）、b1 の `RollbackResultCard`（詳細でもそのまま使う）、§65.8.1 の「行内に取消/訂正ボタンは置かず」（入口を詳細に置く根拠）、日報の取消の確認（`src/features/daily-report-import/DailyReportImportPage.tsx`。日報は在庫を動かさず要再確認が出ないので、Z004 の確認の部品に寄せない）。

## Scope

本 lane が変える file と目的。実装は S1 → S4 の順に積む。S1〜S2 は 1 つの Rust の検証の単位（S2 の wire の変更は S3 の画面と bindings で揃う）、S3 は frontend の検証の単位、S4 は docs と生成物。既存の test の移し方は Matrix の「既存の test の移し方」（T1〜T5）を引く。

### 本 commit で変えた正本（plan-first）

- [32](../function-design/32-biz-csv-import-service.md) §15.6b（新設、BIZ-03-D2）: `preview_rollback_csv_import` の関数要求・シグネチャ・`RollbackPreview`・処理ステップ・設計判断（同じ TX で当てて戻す理由と棄却案）。
- [41](../function-design/41-cmd-pos.md) §17.5 の `preview_rollback_csv_import`（新設）: CMD の薄い command と error の kind。
- [55](../function-design/55-ui-csv-import.md) §55.11（新設、UI-07-D18）: 2 つの入口に共通の確認の中身・押せる条件・読取りの cache の扱い、取消の mutation の共有、Z004 タブの「取り込んだ記録を見る」、`/csv-import` の `tab`（初期選択だけ。値の集合は feature の `types.ts` が持つ。UI-STATE-D2）。
- [65](../function-design/65-inventory-record-traceability.md) §65.5a（新設、TRACE-D13）: CSV取込みの詳細の取消の入口（表示条件・確認・成功と失敗・到達・理由と棄却案）。

### b1 の merge の後に同期する節（本 commit では直さない）

b1 の branch が書き換えた節か、その隣の節。本 lane の実装の PR で、b1 の merge の後の版を起点に直す。

- [65](../function-design/65-inventory-record-traceability.md): §65.10 の 4b の文（上の「この変更で不要になるもの」。b1 の `a7912eea` の hunk が 4b の 2 行後から始まる）、§65.5a の「proposed・未実装」。
- [55](../function-design/55-ui-csv-import.md): §55.4 の手順 18（b1 の `a7912eea` が手順 15〜19 の付近を書き換える）を UI-07-D18 を引く形に。§55.1 の module の表に `RollbackConfirmDialog.tsx`・`useRollbackCsvImport.ts`。§55.3 の `rollbackMutation` の行（共有の hook）。更新履歴の行。§55.11 の「proposed・未実装」。
- [32](../function-design/32-biz-csv-import-service.md): 冒頭の D-118 の節の表の順 4 の message（上の「起票時に起草役が決めたこと」の 6）、§15.1 の module の表、§15.6b の「proposed・未実装」。
- [41](../function-design/41-cmd-pos.md): §17.9 の登録の一覧、`preview_rollback_csv_import` の「proposed・未実装」、更新履歴の行。
- [35](../function-design/35-biz-stocktake-service.md): 完了の後の比較の範囲の判定を BIZ-03 が呼ぶ共有の関数として書く（規則は変えない。b1 への依存の 5）。
- [20](../function-design/20-io-product-repo.md): stocktake_repo の完了した棚卸しの一覧の読取り（id・`completed_at`・完了の時点のカーソル）。
- [SCREEN_DESIGN](../SCREEN_DESIGN.md): 売上データ取込み画面の節に Z004 タブの「取り込んだ記録を見る」と、取消の確認の名指し（b1 が同じ節の停止の行を外す）。
- [FUNCTION_DESIGN](../FUNCTION_DESIGN.md)・[cmd-task-specs](../architecture/cmd-task-specs.md)・[ui-task-specs](../architecture/ui-task-specs.md): BIZ-03 の関数の一覧、CMD-07 の command の表の行、UI-07 の取消の行。

### S1 BIZ と IO（`csv_import_service`・`stocktake_service`・`stocktake_repo`）

| 対象 | 変更 | 作る所 | 読む所・test |
|---|---|---|---|
| 取消の本体の切り出し | b1 の `rollback_csv_import` の TX の中の手順（無効化・状態・求め直し・`recheck_targets`）を、`&Transaction` を受ける `pub(crate)` の関数 1 つに切り出す。`rollback_csv_import` はそれを呼んで COMMIT と操作ログ（今のまま） | `src-tauri/src/biz/csv_import_service/rollback.rs` | Matrix の T1（今の取消の test は期待を変えない） |
| preview | `pub fn preview_rollback_csv_import(conn: &mut DbConnection, csv_import_id: i64) -> Result<RollbackPreview, BizError>`（32 §15.6b の手順 1〜6。手順 4 は上の切り出した関数、手順 5 は `tx.rollback()`） | `rollback.rs`、`src-tauri/src/biz/csv_import_service/mod.rs`（`RollbackPreview`・`AffectedStocktake` の型と re-export） | Matrix の RB1〜RB6 |
| 記録の詳細の差異・ロス原価・参考の差が変わることがある完了した棚卸し | 35 の完了の後の比較の範囲の判定（その取込みの精算が範囲に入るか。範囲による候補で、どの数が実際に変わるかは見ない）を `pub(crate)` の関数にし、完了した棚卸しの一覧の読取りを足す | `src-tauri/src/biz/stocktake_service.rs`、`src-tauri/src/db/stocktake_repo.rs` | Matrix の RB6 |
| test | Matrix の RB1〜RB6 | `src-tauri/src/biz/csv_import_service/tests/rollback_tests.rs` | 既存の test の fixture（b1 の `make_z004_bytes` ほか）を使う |
| 順 4 の拒否の文（b1 の file を本 lane で変える） | `check_settlement_rules` の順 4 の文を「同じ精算と思われる別の資料が既に取り込まれています（精算 {n}、取込みID: {id}）」に（`find_active_imports_for_settlement` の先頭の行の id。上の「起票時に起草役が決めたこと」の 6）。既存の test の期待を、固定の文から実際の取込みID を入れた文へ当て直し、3 test とも順 4 が名指す取込みの ID が 1 以外になるように、その取込みの前に別の取込みを 1 件入れる（b1 の 3 test は名指す取込みが DB の最初の取込み〈ID 1〉なので、ID を固定値 1 にする誤実装が通る。形は Matrix の RB7）（preview の経路: `parse_tests.rs` の `test_parse_req401_rejects_other_version_of_same_settlement_and_allows_after_rollback`〈`c667d52c` の 664 行〉。確定の経路: `commit_tests.rs` の `test_commit_req401_rejects_shared_or_newly_matched_jan_and_rechecks_settlement_from_cache`〈682 行〉と `csv_import_cmd.rs` の `test_csv_cmd_req401_commit_keeps_token_on_rejection_and_removes_on_success`〈341 行〉） | `src-tauri/src/biz/csv_import_service/parse.rs`、`tests/parse_tests.rs`・`tests/commit_tests.rs`、`src-tauri/src/cmd/csv_import_cmd.rs` | Matrix の RB7（契約の変更: 32 の表の順 4。期待を変える理由は Matrix の T5） |

### S2 CMD と wire

| 対象 | 変更 | 作る所 | 読む所・test |
|---|---|---|---|
| command | `preview_rollback_csv_import(state, csv_import_id)`（41。`#[tauri::command]` と `#[specta::specta]` の対） | `src-tauri/src/cmd/csv_import_cmd.rs` | Matrix の W1 |
| 登録 | Specta の登録（`export_bindings_to` の `collect_commands!`）と runtime の登録（`run` の `tauri::generate_handler!`）に 1 つずつ | `src-tauri/src/lib.rs` | Matrix の W2（`scripts/check-command-drift.sh`）、AC2 |
| bindings | `cd src-tauri && cargo run --bin generate_bindings` で再生成 | `src/lib/bindings.ts`（生成物） | AC2 |

### S3 画面

| 対象 | 変更 | 作る所 | 読む所・test |
|---|---|---|---|
| 確認の部品 | 55 UI-07-D18 の確認（開いたときに preview を読む useQuery〈`enabled` は開いている間、`staleTime: 0`・`gcTime: 0`・`retry: 0`〉、対象の項目と精算回数、要再確認の一覧〈下の行で `renderAction` を任意にした `RecheckTargetList` を `renderAction` を渡さずに〉か無いときの文、取り込み直しの文、完了した棚卸しの文、読取りの間と失敗と取消済みのときに「取り消す」を押せない、DSR-20 の destructive の配置） | `src/features/csv-import/components/RollbackConfirmDialog.tsx`（新設） | Matrix の U2〜U4・U10 |
| 要再確認の一覧の部品（b1 の file を本 lane で変える） | `RecheckTargetListProps.renderAction` を任意にする。省略したときは「操作」列（見出しと各行の cell）と「棚の数を確かめて入れ直してください。」を出さない（確認の中では入れ直しへ進めないため。55 UI-07-D18）。渡したときの表示は今のまま。今の 2 つの呼出し元（`ResultStep.tsx` の `RecheckTargets`、`StocktakePage.tsx`）は変えない | `src/features/stocktake/components/RecheckTargetList.tsx` | Matrix の U3（省略の形）。渡す形の回帰は b1 の今の test（`ResultStep.test.tsx` の 143〜148 行の入れ直しの文と link、`StocktakePage.test.tsx` の 1667〜1671 行の「入れ直す」）を期待を変えずに通す |
| 取消の mutation | `useRollbackCsvImport({ onSuccess })`: `commands.rollbackCsvImport`、成功の Toast（8 秒）、`invalidateByContract(queryClient, invalidationContract.csvImportRollback())`、失敗の Toast | `src/features/csv-import/hooks/useRollbackCsvImport.ts`（新設）、`src/features/csv-import/hooks/useCsvImportFlow.ts`（共有の hook を使い、成功で dispatch と `rollbackResult`） | Matrix の U5・U6・U9 |
| 取込みの結果の画面 | 「取り消す」の確認を共有の部品に（中身の文と dl を外す） | `src/features/csv-import/components/ResultStep.tsx` | Matrix の U7 |
| Z004 タブ | 上に「取り込んだ記録を見る（取り消すときはここから）」（`/inventory/records` へ `recordType: "csv_import"`）、`tab` の search を `Tabs` の `defaultValue` に（初期選択だけ） | `src/features/csv-import/CsvImportPage.tsx` | Matrix の U8 |
| `tab` の値の集合（UI-STATE-D2） | feature が readonly tuple `CSV_IMPORT_TAB_VALUES`・Zod schema `csvImportSearchSchema`・型 `CsvImportSearch` を持ち（上の「起票時に起草役が決めたこと」の 5）、route は schema を import して `validateSearch` に渡すだけ（route に `z.enum` を書かない）。`Tabs` の値と取消の結果の link の `tab` も同じ tuple・型から取る | `src/features/csv-import/types.ts`（b1 の file を本 lane で変える）、`src/routes/csv-import/index.tsx` | Matrix の U8、AC3 の 3 つの `rg` |
| CSV取込みの詳細 | header の操作に「この取込みを取り消す」（状態が `completed`・`completed_partial` のときだけ）、確認、成功の後に取消の結果（b1 の `RollbackResultCard`）と「商品別CSV取込み（Z004）を開く」（`/csv-import` へ `tab: "z004"`） | `src/features/inventory-records/CsvImportRecordDetailPage.tsx` | Matrix の U1・U5・U6 |
| query key | `queryKeys.inventoryRecords.csvImportRollbackPreview(importId)` | `src/lib/query-keys.ts` | Matrix の U10 |
| test | Matrix の U1〜U10 | `CsvImportRecordDetailPage.test.tsx`・`RollbackConfirmDialog.test.tsx`（新設）・`ResultStep.test.tsx`・`useCsvImportFlow.test.tsx`・`CsvImportPage.test.tsx` | 既存の test は Matrix の T2〜T4 |

### S4 docs・生成物

- 上の「b1 の merge の後に同期する節」の全部と、本 commit の新しい節の「proposed・未実装」を現行に。
- 生成物: `src/lib/bindings.ts`（S2）、`docs/function-design/90-traceability.md`（test の REQ の参照が増えるので `cd src-tauri && cargo run --bin generate_traceability`。手で直さない）。

### 節の所有表（並走の lane と重なる file）

`comm -12` の結果（2026-10-24、Plan Review round 1 の是正で予定 path が 38 になったので取り直した。round 2 の是正で足した `src/features/csv-import/types.ts` の 1 path は下の b1 の行に足し、ほかの lane の差分に無いことを 2026-10-24 の remote-tracking の head〈`git diff --name-only origin/main...origin/<branch>`〉で確かめた。本 packet の予定 path 39 と次の各 path の集合を `LC_ALL=C sort -u` して突き合わせた。差分は `gh pr diff <番号> --name-only`、括弧の中は remote-tracking の head）:

- b1（PR #188、`agent/stocktake-count-runtime-b`、`c667d52c`）: 差分（176）とは 32: `docs/FUNCTION_DESIGN.md`・`docs/SCREEN_DESIGN.md`・`docs/architecture/cmd-task-specs.md`・`docs/architecture/ui-task-specs.md`・`docs/function-design/20-io-product-repo.md`・`docs/function-design/32-biz-csv-import-service.md`・`docs/function-design/35-biz-stocktake-service.md`・`docs/function-design/41-cmd-pos.md`・`docs/function-design/55-ui-csv-import.md`・`docs/function-design/65-inventory-record-traceability.md`・`docs/function-design/90-traceability.md`・`src-tauri/src/biz/csv_import_service/mod.rs`・`src-tauri/src/biz/csv_import_service/parse.rs`・`src-tauri/src/biz/csv_import_service/rollback.rs`・`src-tauri/src/biz/csv_import_service/tests/commit_tests.rs`・`src-tauri/src/biz/csv_import_service/tests/parse_tests.rs`・`src-tauri/src/biz/csv_import_service/tests/rollback_tests.rs`・`src-tauri/src/biz/stocktake_service.rs`・`src-tauri/src/cmd/csv_import_cmd.rs`・`src-tauri/src/db/stocktake_repo.rs`・`src-tauri/src/lib.rs`・`src/features/csv-import/CsvImportPage.test.tsx`・`src/features/csv-import/CsvImportPage.tsx`・`src/features/csv-import/components/ResultStep.test.tsx`・`src/features/csv-import/components/ResultStep.tsx`・`src/features/csv-import/hooks/useCsvImportFlow.test.tsx`・`src/features/csv-import/hooks/useCsvImportFlow.ts`・`src/features/csv-import/types.ts`・`src/features/inventory-records/CsvImportRecordDetailPage.test.tsx`・`src/features/stocktake/components/RecheckTargetList.tsx`・`src/lib/bindings.ts`・`src/lib/query-keys.ts`。round 1 の是正で足した 4 path（`parse.rs`・`parse_tests.rs`・`commit_tests.rs`・`RecheckTargetList.tsx`）は全部 b1 の差分にある（b1 の file を本 lane で変える。下の表）。round 2 の是正で足した `types.ts` も b1 の差分と b1 の packet の予定 path〈b1 の packet の 484 行〉にある。b1 の packet の「予定 path の一覧」（148）とは 30（上の 32 から `CsvImportRecordDetailPage.test.tsx` と `RecheckTargetList.tsx` を除いたもの）。
- PR #172（`agent/sd-direct-read-runtime`、`f140526b`、差分 9）: 差分とは 1（`docs/function-design/55-ui-csv-import.md`。#172 は UI-07-D16 と更新履歴）。packet が名を挙げる path を足すと 5（ほかは `docs/SCREEN_DESIGN.md`・`90-traceability.md`・`src-tauri/src/lib.rs`・`src/lib/bindings.ts`）。
- PR #190（`agent/backup-offsite-runtime`、`000345f1`、差分 7）: 差分とは 0。packet が名を挙げる path とは 4（`docs/FUNCTION_DESIGN.md`・`90-traceability.md`・`src-tauri/src/lib.rs`・`src/lib/bindings.ts`）。
- PR #193（b2、`agent/stocktake-count-runtime-b2`、`abec3f50`、差分 5）: 差分とは 0。packet の「予定 path の一覧」を含む名を挙げる path とは 8（`docs/FUNCTION_DESIGN.md`・`docs/SCREEN_DESIGN.md`・`cmd-task-specs.md`・`20-io-product-repo.md`・`65-inventory-record-traceability.md`・`90-traceability.md`・`src-tauri/src/lib.rs`・`src/lib/bindings.ts`）。
- PR #194（`agent/backup-offsite-runtime-b`、`f508537f`、差分 7）: 差分とは 0。packet が名を挙げる path とは 5（`docs/FUNCTION_DESIGN.md`・`90-traceability.md`・`src-tauri/src/lib.rs`・`src/lib/bindings.ts`・`src/lib/query-keys.ts`）。
- PR #196（`agent/initial-load-procedure`、`fac7575b`、差分 5）: 差分とも、packet が名を挙げる path とも 0。
- PR #198（`agent/oplog-retention`、`879a4495`、差分 10）: 差分とは 0。packet が名を挙げる path とは 2（`90-traceability.md`・`src-tauri/src/lib.rs`）。
- PR #201（`agent/dev-bins-out-of-msi`、`864bd013`、差分 4）: 差分とは 0。packet が名を挙げる path とは 4（`docs/FUNCTION_DESIGN.md`・`90-traceability.md`・`src-tauri/src/lib.rs`・`src/lib/bindings.ts`）。
- PR #202（`agent/screen-elements-redesign`、`0f100fec`、差分 1）: 差分とは 0。packet が名を挙げる path とは 1（`docs/SCREEN_DESIGN.md`）。
- 起票の時点の表にあった PR #191・#192 は main に merge 済み（本 branch は `843c4938` を取り込んだ）なので外した。

（「packet が名を挙げる path」は各 packet の本文の path の形の語を全部拾った集合で、予定 path より広い。重なりを少なく見積もらないために使った。）

本 commit の 4 つの正本の追記は、b1・#172 が変える hunk の外に置いた。本 commit を作った後に `git merge-tree --write-tree --name-only HEAD <branch>` を b1（`a7912eea`）・#172（`origin/agent/sd-direct-read-runtime`）・b2（`origin/agent/stocktake-count-runtime-b2`）に当て、3 つとも衝突の file 名を出さずに tree の id だけを返した（衝突なし）。b1 とは stacked で、本 lane は b1 の merge の後に `origin/main` を単段で取り込み、b1 の版を起点に直す。生成物（`src/lib/bindings.ts`・`docs/function-design/90-traceability.md`）は取り込んだ後に再生成する（D-098）。

| file | 並走の lane が所有する節 | 本 lane が触る所 | merge の後に揃える所 |
|---|---|---|---|
| `src-tauri/src/biz/csv_import_service/rollback.rs`・`mod.rs`・`tests/rollback_tests.rs` | b1: 取消の新しい経路と `RollbackResult` | 本体の切り出し・preview・型・test | b1 の版を起点に切り出す（b1 への依存の 1） |
| `src-tauri/src/biz/stocktake_service.rs`・`src-tauri/src/db/stocktake_repo.rs` | b1: 計数・完了・記録の詳細 | 完了の後の比較の範囲の判定の公開、完了した棚卸しの一覧の読取り | 別の関数（b1 への依存の 5） |
| `src-tauri/src/biz/csv_import_service/parse.rs`・`tests/parse_tests.rs`・`tests/commit_tests.rs`（b1 の file を本 lane で変える） | b1: 順 1〜5 の拒否（`check_settlement_rules`）と、その test | 順 4 の拒否の文に取込みID を入れ、既存の test の期待を当て直す（S1 の順 4 の行） | b1 の版を起点に順 4 の文と期待だけを直す（起票時に起草役が決めたことの 6） |
| `src-tauri/src/cmd/csv_import_cmd.rs`・`src-tauri/src/lib.rs` | b1: Z004 の command の入出力と、その test（順 4 の文の期待を含む）。#172・#190・#194・#198・#201: 各 lane の packet が名指す `lib.rs` の変更 | preview の command と登録の 2 行、`csv_import_cmd.rs` の test の順 4 の文の期待 | 一覧の行は両方を残す |
| `src/features/csv-import/*`（`CsvImportPage`・`ResultStep`・`useCsvImportFlow`・`types.ts` と test） | b1: 停止の Alert を外す、取消の結果、`confirmImport` の引数、`rollbackResult`、`types.ts` の state と action の型（`additionalImportConfirmed` を外す） | 確認の部品・mutation の共有・Z004 タブの導線・`tab`（`types.ts` には `tab` の tuple・schema・型を足すだけ） | b1 の版を起点に直す（b1 への依存の 3・7） |
| `src/features/stocktake/components/RecheckTargetList.tsx`（b1 の file を本 lane で変える） | b1: 要再確認の一覧の部品（棚卸しの画面と取込み・取消の結果が `renderAction` を渡して使う） | `renderAction` を任意にし、省略したときは「操作」列と入れ直しの文を出さない | b1 の版を起点に props の 1 つと省略の分岐だけを足す。今の 2 つの呼出し元は変えない（b1 への依存の 3） |
| `src/lib/query-keys.ts` | b1: `stocktake.recheckList`。#194: backup の key | `inventoryRecords.csvImportRollbackPreview` | 別の key |
| 32・41・55・65 | b1: D-118 の節・停止の節・取消と確定の手順。#172: 55 の UI-07-D16 と更新履歴 | 本 commit の新しい節と、上の「b1 の merge の後に同期する節」 | 新しい節は hunk が重ならない。同期する節は b1 の版を起点に本 lane の分だけ直す |
| 20・35・SCREEN_DESIGN・FUNCTION_DESIGN・cmd-task-specs・ui-task-specs | b1: D-118 の節と停止の記述。b2: 20・65・SCREEN_DESIGN の b2 の分。#192: task-specs の注記 | 上の「b1 の merge の後に同期する節」 | b1・b2 の版を起点に本 lane の分だけ直す |
| `src/lib/bindings.ts`・`docs/function-design/90-traceability.md` | 生成物 | 生成物 | 取り込んだ後に再生成 |

### 予定 path の一覧（`comm -12` の入力）

39 path（Rust 10・TS 16・docs 13）。所有表の突き合わせは L3 を頼む時点の head で取り直す（D-124）。

```
docs/FUNCTION_DESIGN.md
docs/SCREEN_DESIGN.md
docs/architecture/cmd-task-specs.md
docs/architecture/ui-task-specs.md
docs/function-design/20-io-product-repo.md
docs/function-design/32-biz-csv-import-service.md
docs/function-design/35-biz-stocktake-service.md
docs/function-design/41-cmd-pos.md
docs/function-design/55-ui-csv-import.md
docs/function-design/65-inventory-record-traceability.md
docs/function-design/90-traceability.md
docs/plans/2026-10-23-z004-rollback-entry.md
docs/plans/test-matrices/2026-10-23-z004-rollback-entry.md
src-tauri/src/biz/csv_import_service/mod.rs
src-tauri/src/biz/csv_import_service/parse.rs
src-tauri/src/biz/csv_import_service/rollback.rs
src-tauri/src/biz/csv_import_service/tests/commit_tests.rs
src-tauri/src/biz/csv_import_service/tests/parse_tests.rs
src-tauri/src/biz/csv_import_service/tests/rollback_tests.rs
src-tauri/src/biz/stocktake_service.rs
src-tauri/src/cmd/csv_import_cmd.rs
src-tauri/src/db/stocktake_repo.rs
src-tauri/src/lib.rs
src/features/csv-import/CsvImportPage.test.tsx
src/features/csv-import/CsvImportPage.tsx
src/features/csv-import/components/ResultStep.test.tsx
src/features/csv-import/components/ResultStep.tsx
src/features/csv-import/components/RollbackConfirmDialog.test.tsx
src/features/csv-import/components/RollbackConfirmDialog.tsx
src/features/csv-import/hooks/useCsvImportFlow.test.tsx
src/features/csv-import/hooks/useCsvImportFlow.ts
src/features/csv-import/hooks/useRollbackCsvImport.ts
src/features/csv-import/types.ts
src/features/inventory-records/CsvImportRecordDetailPage.test.tsx
src/features/inventory-records/CsvImportRecordDetailPage.tsx
src/features/stocktake/components/RecheckTargetList.tsx
src/lib/bindings.ts
src/lib/query-keys.ts
src/routes/csv-import/index.tsx
```

## Non-scope

- 上の Goal の「非目的」の全部（取消の本体、日報の取消の入口、業務記録の取消〈REQ-208〉、専用一覧、取り込み直しの見込みの一覧、照合の基準の入替）。
- 入出庫履歴の一覧（§65.8.1）の行の取消の操作（§65.8.1 で置かない）と、一覧の表示列の変更（精算回数・ファイル名を行に出すこと。今は業務日付・代表商品・状態で探す。「起票時に起草役が決めたこと」の 6 の取込みID の名指しと「記録ID」の絞り込みで足りる）。
- 操作ログ（`csv_rollback`）の形と、操作ログの画面の関連記録の link（65 §65.8.3 で `csv_import` は許可リストの外のまま）。
- 取消の後の要再確認の一覧の文と部品（b1）。
- 店に確かめる問い: 無い。

## Acceptance Criteria

- AC1（BIZ）: `cd src-tauri && cargo test --lib biz::csv_import_service` が全 PASS し、Matrix の RB1〜RB6 の test 名が `rg -n 'fn <名前>' src-tauri/src/biz/csv_import_service` で 1 件ずつ見つかる。`rg -c 'pub fn preview_rollback_csv_import\(' src-tauri/src/biz/csv_import_service` が 1、`rg -c 'tx.rollback\(\)' src-tauri/src/biz/csv_import_service/rollback.rs` が 1（preview が明示の rollback で戻す）。b1 の取消の test（Matrix の T1）が期待を変えずに PASS する。順 4 の拒否の文: `rg -c '既に取り込まれています（精算 \{\}、取込みID: \{\}）' src-tauri/src/biz/csv_import_service/parse.rs` が 1、`rg -c '既に取り込まれています（精算 \{\}）' src-tauri/src/biz/csv_import_service/parse.rs` が 0（exit 1）で、Matrix の RB7 の 3 つの test が PASS する（preview と確定の両方の経路で実際の取込みID が文に出る）。
- AC2（CMD と wire）: `rg -c 'preview_rollback_csv_import' src-tauri/src/lib.rs` が 2（2 つの一覧に 1 つずつ）、`rg -c '^export type RollbackPreview =' src/lib/bindings.ts` が 1、`rg -c '^export type AffectedStocktake =' src/lib/bindings.ts` が 1。`cd src-tauri && cargo test --lib cmd::csv_import_cmd` が全 PASS し、Matrix の W1 の test 名が見つかる。`bash scripts/check-command-drift.sh` が exit 0（宣言・runtime の登録・Specta の登録・bindings の wire 名の 4 面が一致。Matrix の W2）。
- AC3（画面）: `npm test -- src/features/csv-import src/features/inventory-records src/lib` が全 PASS し、Matrix の U1〜U10 の test 名が見つかる。`rg -c 'この取込みを取り消す' src/features/inventory-records/CsvImportRecordDetailPage.tsx` が 1 以上、`rg -l 'commands.rollbackCsvImport' src --glob '!src/lib/bindings.ts' --glob '!*.test.*'` が `src/features/csv-import/hooks/useRollbackCsvImport.ts` の 1 行だけ（取消の mutation を 2 つ持たない）、`rg -c 'validateSearch: csvImportSearchSchema' src/routes/csv-import/index.tsx` が 1、`rg -c 'export const CSV_IMPORT_TAB_VALUES = \[' src/features/csv-import/types.ts` が 1、`rg -c 'z\.enum\(' src/routes/csv-import/index.tsx` が 0（exit 1。route が値の集合を持たない。UI-STATE-D2）、`rg -c 'renderAction\?: ' src/features/stocktake/components/RecheckTargetList.tsx` が 1（`renderAction` が任意）、`rg -c 'recordType: "csv_import"' src/features/csv-import/CsvImportPage.tsx` が 1 以上。
- AC4（gate）: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test`、`cargo run --bin generate_bindings` の後に `git diff --exit-code src/lib/bindings.ts`、`cargo run --bin generate_traceability -- --check`、`cargo test --test design_compliance_test`、`npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`（`src/routeTree.gen.ts` は `.gitignore` の 33 行で追跡外なので diff を AC にしない。`tab` の search の型は typecheck と Matrix の U8 で見る）、`bash scripts/doc-consistency-check.sh` と `--target plan` が exit 0。L3 を含むので Writer は `cd src-tauri && cargo check --release` を通す。
- AC5（正本）: `rg -c 'rollback CTA は置かず' docs/function-design/65-inventory-record-traceability.md` が 0（exit 1）、`rg -c 'TRACE-D13、proposed・未実装|UI-07-D18、proposed・未実装|BIZ-03-D2、proposed・未実装' docs/function-design` が 0（exit 1）、`rg -c 'preview_rollback_csv_import（proposed・未実装）' docs/function-design/41-cmd-pos.md` が 0（exit 1）、`rg -l '取消の画面入口は結果 step だけ' docs --glob '!docs/archive/**' --glob '!docs/plans/**'` が 0 件（exit 1。b1 が外す記述が残っていない）。`rg -c '既に取り込まれています（精算 \{n\}、取込みID: \{id\}）' docs/function-design/32-biz-csv-import-service.md` が 1（順 4 の拒否の文）。

AC の数は AC1〜AC5 の 5。

AC の数の baseline（2026-10-23、本 worktree の HEAD `eed07d37` に本 commit の docs の差分。code は main と同じ。scratch の script〈repo の外〉で逐語に回した）:

```
$ rg -c 'preview_rollback_csv_import' src-tauri/src/lib.rs
exit=1
$ rg -c '^export type RollbackPreview =' src/lib/bindings.ts
exit=1
$ rg -c 'この取込みを取り消す' src/features/inventory-records/CsvImportRecordDetailPage.tsx
exit=1
$ rg -l 'commands.rollbackCsvImport' src --glob '!src/lib/bindings.ts' --glob '!*.test.*'
src/features/csv-import/hooks/useCsvImportFlow.ts
exit=0
$ rg -c 'validateSearch' src/routes/csv-import/index.tsx
exit=1
$ rg -c 'tx.rollback\(\)' src-tauri/src/biz/csv_import_service/rollback.rs
exit=1
$ rg -c 'rollback CTA は置かず' docs/function-design/65-inventory-record-traceability.md
1
exit=0
$ rg -c 'recordType: "csv_import"' src/features/csv-import/CsvImportPage.tsx
exit=1
$ rg -c 'pub fn preview_rollback_csv_import\(' src-tauri/src/biz/csv_import_service
exit=1
```

Plan Review round 1 の是正で足した AC の baseline（2026-10-24、本 worktree の HEAD `d4183273`。b1 の file は b1 の remote-tracking の head `c667d52c` の版も `git show` で回した。scratch の script〈repo の外〉で逐語に回した）:

```
$ rg -c '既に取り込まれています（精算 \{\}、取込みID: \{\}）' src-tauri/src/biz/csv_import_service/parse.rs
exit=1
$ rg -c '既に取り込まれています（精算 \{\}）' src-tauri/src/biz/csv_import_service/parse.rs
exit=1
$ git show origin/agent/stocktake-count-runtime-b:src-tauri/src/biz/csv_import_service/parse.rs | rg -c '既に取り込まれています（精算 \{\}）'
1
exit=0
$ rg -c 'renderAction\?: ' src/features/stocktake/components/RecheckTargetList.tsx
rg: src/features/stocktake/components/RecheckTargetList.tsx: IO error for operation on src/features/stocktake/components/RecheckTargetList.tsx: No such file or directory (os error 2)
exit=2
$ git show origin/agent/stocktake-count-runtime-b:src/features/stocktake/components/RecheckTargetList.tsx | rg -c 'renderAction\?: '
exit=1
$ bash scripts/check-command-drift.sh
D=68 H=68 S=68 T=68
exit=0
```

（main の版の `parse.rs` には順 4 の文が無く〈b1 が足す〉、`RecheckTargetList.tsx` は b1 が作る。どちらも b1 の merge の後に本 lane の head で 1・0 と 1 になる。）

Plan Review round 2 の是正で足した AC3 の baseline（2026-10-24、本 worktree の HEAD `fe7d10fd`。scratch の shell〈repo の外〉で逐語に回した）:

```
$ rg -c 'export const CSV_IMPORT_TAB_VALUES = \[' src/features/csv-import/types.ts
exit=1
$ rg -c 'validateSearch: csvImportSearchSchema' src/routes/csv-import/index.tsx
exit=1
$ rg -c 'z\.enum\(' src/routes/csv-import/index.tsx
exit=1
```

（`z.enum(` の 0 は今の route が `validateSearch` を持たないことによる。完了の時点の 0 は route が feature の schema を import して値の集合を持たないことを示す。AC3 の `validateSearch` の数は `validateSearch: csvImportSearchSchema` の数に置き換えた。上の起票の baseline の `rg -c 'validateSearch'` はその前の式の記録。）

AC5 の baseline（同じ日、本 commit の docs の差分を当てた作業木で逐語に回した）:

```
$ rg -c 'TRACE-D13、proposed・未実装|UI-07-D18、proposed・未実装|BIZ-03-D2、proposed・未実装' docs/function-design
docs/function-design/32-biz-csv-import-service.md:1
docs/function-design/65-inventory-record-traceability.md:1
docs/function-design/55-ui-csv-import.md:1
exit=0
$ rg -c 'preview_rollback_csv_import（proposed・未実装）' docs/function-design/41-cmd-pos.md
1
exit=0
$ rg -l '取消の画面入口は結果 step だけ' docs --glob '!docs/archive/**' --glob '!docs/plans/**'
docs/function-design/55-ui-csv-import.md
exit=0
$ rg -c '既に取り込まれています（精算 \{n\}、取込みID: \{id\}）' docs/function-design/32-biz-csv-import-service.md
exit=1
```

（`rg -c 'rollback CTA は置かず'` は上の baseline で 1。`取消の画面入口は結果 step だけ` の 1 件は §55.0 の停止の節で、b1 が節ごと外す。）

完了時の期待: AC1 の 2 つの数が 1 と 1。AC2 が 2・1・1。AC1 の順 4 の文が新しい形 1・古い形 0（exit 1）。AC2 の `check-command-drift.sh` が exit 0。AC3 の詳細の文が 1 以上、取消の mutation の file が `useRollbackCsvImport.ts` の 1 つ、`validateSearch: csvImportSearchSchema` が 1、`CSV_IMPORT_TAB_VALUES` の定義が 1、route の `z.enum(` が 0（exit 1）、`renderAction?: ` が 1、`recordType` が 1 以上。AC5 の「置かず」・「proposed・未実装」の 2 本・「結果 step だけ」が exit 1、順 4 の文が 1。test の本数は AC にしない（PR と runner の出力を参照）。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: ADR SPEC-STK-CNT-D2（求め直す商品）・D3（判定の n、A1、「D に精算があるか」「最初の 1 本」）・D6（非遡及と完了の後の差）・D7（取消と取り込み直し）と Consequences（Gated Amendment の版）、[32](../function-design/32-biz-csv-import-service.md) の冒頭の D-118 の節の取消と表の順 2〜5・§15.5・§15.6a・§15.6b（本 commit）、[41](../function-design/41-cmd-pos.md) §17.4・§17.5、[55](../function-design/55-ui-csv-import.md) 冒頭の D-118 の表の「取消の結果」・UI-07-D14・§55.4 の手順 18・§55.5・§55.9・§55.11（本 commit）、[65](../function-design/65-inventory-record-traceability.md) §65.4.1・§65.5・§65.5a（本 commit）・§65.8.1・§65.8.2・§65.10 の 4b、[35](../function-design/35-biz-stocktake-service.md) の D-118 の節の「完了」の後半（完了の後の比較の範囲）、[40](../function-design/40-cmd-product.md) の CountRecoveryTarget、design-system [01](../design-system/01-decision-rules.md) の DSR-07・DSR-08・DSR-15・DSR-18・DSR-20、[04](../design-system/04-backbone.md) の「同じ操作は同じ顔と挙動」、D-052（C9）、[UI_TECH_STACK](../UI_TECH_STACK.md) の UI-STATE-D2（有限 URL search 値の feature-local SSOT）、D-127。
- 必要な設計成果物（状態）: (1) 取消の前の読取りの関数と wire（Design artifact selection の「New or changed BIZ … behavior」と「Tauri command, DTO」の行）= updated in this PR（32 §15.6b、41）。(2) CSV取込みの詳細の取消の入口（「operator workflow」の行）= updated in this PR（65 §65.5a）。(3) 2 つの入口に共通の確認・取消の mutation の共有・Z004 タブの導線・`/csv-import` の `tab`（「operator workflow, route/search state, Japanese wording」の行）= updated in this PR（55 §55.11）。(4) 35・20 の共有の判定と読取り、SCREEN_DESIGN の画面の行 = 実装の PR で同期（b1 の版を起点に。規則は変えない）。
- plan にしかない durable な判断の昇格先: 上の (1)〜(3) は正本に置いた。packet にだけあるのは、規模と手法、S1〜S4 の順、所有表、既存の test の移し方（Matrix の T1〜T5）、L3 の台本、「起票時に起草役が決めたこと」の 6・7（実装の PR で 32・55 へ）。
- 前提・制約と、延期した design gap の follow-up: owner の判断事項 (i)〜(iii) は推奨を既定にした（答えで変わる所を各項に書いた）。取消の本体は b1 に依る（b1 への依存）。日報の取消の入口と業務記録の取消は非目的。
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: 「preview は何も書かない」は明示の `tx.rollback()` と、TX の外で書かない（操作ログを書かない）ことで守る。例外: SQLite の TX が rollback の前に COMMIT される経路は無い（preview の関数は COMMIT を呼ばない。Matrix の RB2 が DB の全ての関係する表と `operation_logs` の行数で止める）。「確認と取消が同じ商品を名指す」は同じ関数と同じ DB の状態のときに限る（間に記録が入れば取消の結果が正。32 §15.6b の制約）。「取消済みには入口が出ない」は詳細の表示条件と、古い画面から開いた確認の preview の `ValidationFailed` の 2 重で守る。
- 判定: ready。本 lane の Scope の全ての振舞いが正本（本 commit の新しい節を含む）か本 packet の Boundary・S3 から決まる。owner の判断事項 (i) が C なら design へ戻す。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | `preview_rollback_csv_import` を `src-tauri/src/lib.rs` の Specta の登録（`export_bindings_to` の `collect_commands!`）と runtime の登録（`run` の `tauri::generate_handler!`）に足す。2 面と宣言・bindings の一致は `bash scripts/check-command-drift.sh` が静的に確かめる（`scripts/doc-consistency-check.sh` も同じ script を呼ぶ）。command 関数に `#[tauri::command]` と `#[specta::specta]` の対。`cd src-tauri && cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成（S2） |
| function-design doc 新設 | 該当なし（新しい doc は無い。`preview_rollback_csv_import` は `pub fn` で 32 §15.6b の code block にシグネチャを置いた。`src-tauri/tests/design_compliance_test.rs` の 32 の行の module は `csv_import_service` のまま） |
| source / workflow doc 新設・改名・削除 | 該当なし（既存の 32・41・55・65 に節を足しただけ） |
| REQ / coverage の追加・変更・削除 | test 名・comment に REQ-401・REQ-206・REQ-207 を付ける（REQ-208 は業務記録の取消で `coverage=deferred` のまま。CSV の取消は REQ-401 の範囲）。`cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成（S4） |
| route 新設・改名・削除 | 該当なし（`/csv-import/` の search に `tab` を足すだけ。`src/routeTree.gen.ts` は追跡外の生成物で、search の型は AC4 の `npm run typecheck` と Matrix の U8 で見る） |
| operator 画面新設・改名・削除 | 該当なし（CSV取込みの詳細・Z004 タブ・結果の画面の中身だけ。到達の導線は入出庫履歴と在庫変動履歴の今の link と、Z004 タブの新しい link） |

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 当たらない。Z004 の形（IO-02）に触れず、取消は app-core の記録の無効化と求め直し | — |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 当たる。SQLite の TX の rollback の振舞いは観測（Contract Probe P1）。入口の置き場・範囲・期間は正本の読み（上の「起票時に確かめた 3 つ」）。確認の中身と導線は起草役の判断で正本へ置いた | 32 §15.6b、55 §55.11、65 §65.5a |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 当たる。確認を開く（preview の読取り）→ キャンセル（何も起きない）/ 取り消す（取消の本体）→ 取消の結果 → 取り込み直し（ADR D7）。preview の失敗は押せない、取消の失敗は同じ ID で再試行、取消済みへの重ねた取消は冪等の Ok、取消済みの preview は拒否 | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 当たる。締め → SD → Z004 の取込み → 結果の画面を離れる → 誤りに気づく（preview の拒否・売上レポート・棚卸し）→ Z004 タブの「取り込んだ記録を見る」か入出庫履歴 → 詳細 → 確認 → 取消 → 入れ直し → 正しい版の取り込み直し | L3 の台本 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 当たらない。レジが替わっても取消は取込みの単位の無効化のまま | — |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 当たる。fixture は全部合成（b1 の L3 の fixture と Rust・TS の test）。L3 の DB は Coordinator が空の DB に差し替え、owner の今の DB は消さずに移して残す | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 当たる。取消は売上と movement を無効にし（補償の movement を作らない）、完了した評価額を変えない（非遡及）。確認は「評価額は変わらず、記録の詳細の「差異」「ロス原価」と参考の差が変わることがある」と分けて書く（名指すのは比較の範囲による候補） | RB6、55 §55.11 |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 当たる。Windows native の dialog の見た目と destructive の配置、通しの操作列（下の L3 の台本）。完了した棚卸しの名指しは台本を長くしないために自動 test と画面の写しで見る | Test Plan の L3 |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 当たらない。新しい依存は無い（TX の rollback は同梱の SQLite と rusqlite 0.31 の今の振舞い。`src-tauri/Cargo.toml` の `rusqlite = { version = "0.31", features = ["bundled"] }`） | — |

## Boundary / Wire Contract

- producer: BIZ-03 `preview_rollback_csv_import`（32 §15.6b）、CMD-07 `preview_rollback_csv_import`（41）。取消の `rollback_csv_import` と `RollbackResult` は b1 のまま。
- consumer: 確認の部品 `RollbackConfirmDialog`（取込みの結果の画面と CSV取込みの詳細）、`describeError`（preview の失敗の文）。
- wire type（新しい型）: `RollbackPreview { csv_import_id: number, settlement_no: number, recheck_targets: CountRecoveryTarget[], affected_stocktakes: AffectedStocktake[] }`、`AffectedStocktake { stocktake_id: number, completed_at: string }`。command `previewRollbackCsvImport(csvImportId: number)`。error は今の `CmdError`（kind `not_found` / `validation` / `internal`）。
- internal type: Rust の `RollbackPreview`・`AffectedStocktake`（`specta::Type`、`csv_import_service` の型）。取消の本体を切り出した `pub(crate)` の関数（TX を受け、無効にした件数と `recheck_targets` を返す）。
- route / search: `/csv-import/` の `tab?: "daily-report" | "z004"`（zod の `.catch(undefined)`。欠落・ほかの値は既定の日報取込み）。値の集合は `src/features/csv-import/types.ts` の `CSV_IMPORT_TAB_VALUES` と `csvImportSearchSchema` が持ち、route は import する（UI-STATE-D2）。`/inventory/records` へは今の search の `recordType: "csv_import"` を渡すだけ（search の型は変えない）。
- precision/range: `settlement_no` は精算回数の範囲（b1 の 32 の順 1: 0 以上 `9007199254740991` 以下）で wire の number で正確。`csv_import_id`・`stocktake_id` は SQLite の id。`recheck_targets` の数は b1 の `CountRecoveryTarget` の範囲（b1 の packet の Z4・Z18）。`completed_at` は棚卸しの完了の日時の文字列（今の `Stocktake.completed_at` と同じ形）で、確認は日付の部分を出す。
- round-trip path: DB → BIZ（TX で当てて戻す）→ specta → bindings → 確認の部品。search: 取消の結果の link `{ to: "/csv-import", search: { tab: "z004" } }` → route の `validateSearch` → `Tabs` の `defaultValue`。
- invalid input: 無い取込みID は `not_found`（「CSV取込み記録が見つかりません: ID {id}」）、取消済みは `validation`（「この取込みは取り消し済みです」）。確認はどちらも「取り消す」を押せない。不正な `tab` は既定に落ちる（拒否の画面を出さない）。
- compatibility: `RollbackResult`・`ImportResult`・`CsvImportRecordDetail`・`CsvImport` の形は変えない。今の command の名前・引数は変えない。操作ログは preview で書かない（取消の `csv_rollback` は今のまま）。

## Test Plan

Test Design Matrix: [2026-10-23-z004-rollback-entry](test-matrices/2026-10-23-z004-rollback-entry.md)。

- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate.
- Human Gate に manual（L3）を含むときは、L3 の項目ごとに到達経路・必要な入力物（DB のデータ・import する file・CSV・scan）・依存する既知 backlog を並べ、受理される fixture を Ready の依頼と同時に渡す（`docs/DEV_WORKFLOW.md` Human Visual Confirmation）。

- targeted tests: `cd src-tauri && cargo test --lib biz::csv_import_service` / `cargo test --lib biz::stocktake_service` / `cargo test --lib cmd::csv_import_cmd`、`npm test -- src/features/csv-import src/features/inventory-records src/lib`。
- negative tests: Matrix の RB3（無い ID・取消済み）、RB2（何も書かない）、U4（preview の失敗・取消済みで押せない）、U6（取消の失敗と再試行）、U8（不正な `tab`）。
- compatibility checks: b1 の取消の test を期待を変えずに通す（Matrix の T1）。今の結果の画面の取消の flow の test は確認の中身の case だけを契約の変更（55 UI-07-D18）として直す（T2）。
- data safety checks: fixture は全部合成。
- mutation の確かめ: RB7 は 3 test とも順 4 が名指す取込みの ID が 1 以外になる fixture で、production の側で ID を固定値 1 にする mutant を当て、3 test とも red になることを確かめる（b1 の今の fixture は名指す取込みが ID 1 なので、この mutant でも 3 test とも GREEN になる）。
- main wiring/integration checks: W2（command の登録）、RB1（preview と取消が同じ商品を名指す）、U5（詳細の取消の後の D-052 C9 の再取得）、U7（結果の画面が同じ確認を使う）。

L3（Human Gate `manual`。owner は 2026-10-21 から数日、手が使いにくい〈左手だけ〉。1 回の通しの台本で、各段の PASS / FAIL を返してもらう。起動は今の L3 と同じく Windows native の `npm run tauri dev`）。L3 の日を T と書く（PC の今日）。入力物は b1 の S9 の生成の test が T から作る合成の file（**Coordinator** が L3 を頼む日に `cd src-tauri && INVENTORY_L3_DAY=その日 INVENTORY_L3_OUT=repo の外の folder CARGO_TARGET_DIR=/tmp/shared-cargo-target cargo test --lib -- --ignored io::l3_fixtures` で作り、Windows の path を省略せずに渡す）。

L3 の DB（Coordinator、L3 を頼む前）: owner がアプリを止めた状態で、b1 の packet の Test Plan の「L3 の DB の用意と差し替え」の 3. と同じ手順（22 §16 の作り直しの手順 2〜4）で、data の folder を日付の付いた folder（例 `%USERPROFILE%\inventory-db-moved\{L3 の日}-z004-rollback-before\`。前の lane の folder は上書きしない）へ消さずに移す。次の起動で空の DB が作られて最新の版まで当たり、初期の部門だけがある。b1・b2 の L3 の後の DB は移した folder に残る。

使う fixture（b1 の packet の「L3 の fixture の表」の行。売価・原価・初期在庫はその表のとおり）: `products-new.csv`（P1〜P6）、`z004-0101.csv`（精算 101、精算日 T−3、P3 × 1〈1000〉・P5 × 1〈1000〉）、`z004-0102.csv`（精算 102、精算日 T−2、P1 × 1〈1000〉）。

| # | 前の状態 | 操作 | 入力物 | 観測可能な合格基準 | 後の状態 |
|---|---|---|---|---|---|
| R-1 | 差し替えた空の DB | 起動する → 商品一括 import で `products-new.csv` を取り込む → Z004 タブで `z004-0101.csv`、続けて `z004-0102.csv` を取り込む（どちらも結果の画面の「ホームに戻る」で離れる） | 3 file | 2 つとも取り込め、結果に要再確認の一覧が出ない（数えた商品が無い） | 取り込み済み 101・102。P1 の在庫 9 |
| R-2 | 同じ | 棚卸しの画面で「棚卸しを開始する」→ P1 を「前の日の分を入れる」で日付 T−3、数 10 で保存 | 画面の入力 | P1 の数 10（日付 T−3）が出て、「数え直しが必要な商品」に P1 が出ない（T−3 に精算 101 があるので、102 は数に入らない側に決まる。ADR D3 の A1） | P1 の効く計数 10（T−3）、在庫 9 |
| R-3 | 同じ | 売上データ取込みの Z004 タブの「取り込んだ記録を見る（取り消すときはここから）」を押す | — | 入出庫履歴が種別「CSV取込み」で開き、取込みの行が 2 つ（業務日付 T−3 と T−2、どちらも「有効」） | 同じ |
| R-4 | 同じ | T−3 の行の「詳細」→「この取込みを取り消す」→ 確認を読む →「キャンセル」→ もう一度「この取込みを取り消す」 | — | 確認に、取込みID・精算日 T−3・「精算 101」・ファイル名 `z004-0101.csv`・件数 2 件・金額 ¥2,000、「取り消した後、次の商品は数え直しが必要です（今すでに必要な商品を含みます）」と P1・範囲「9〜10」・理由の文（文字と icon）。一覧に「操作」列と「棚卸しの画面で入れ直す」は無い、取り込み直しの文（精算 101）。完了した棚卸しの文は無い。読み終わるまで「取り消す」は押せない。「取り消す」は destructive の見た目で、「キャンセル」で何も起きない（詳細は「有効」のまま） | 同じ |
| R-5 | 同じ | 確認の「取り消す」 | — | Toast「取込みを取り消しました」。詳細が「この取込みは取消済みです」になり、「この取込みを取り消す」が消える。同じ画面に「取込みを取り消しました」（取り消した売上 2 件、取り消した在庫の変動 1 件）、「数え直しが必要な商品」に P1 と範囲「9〜10」と「棚卸しの画面で入れ直す」、「商品別CSV取込み（Z004）を開く」 | 101 は取消済み。P1 は要再確認 |
| R-6 | 同じ | 「商品別CSV取込み（Z004）を開く」→ `z004-0101.csv` をもう一度取り込む | `z004-0101.csv` | 売上データ取込みが「商品別CSV取込み（Z004）」のタブで開く。preview に拒否が無く取り込め、結果に要再確認の一覧が出ない。棚卸しの画面の「数え直しが必要な商品」から P1 が消えている | 取り込み済み 101（2 回目の取込み）・102 |
| R-7 | 同じ（2 回目の 101 の結果の画面） | 結果の画面の「取り消す」→ 確認を読む →「キャンセル」 | — | R-4 と同じ形の確認（取込みID は 2 回目の取込みの ID、精算 101、P1・範囲「9〜10」）が出て、「キャンセル」で何も起きない | 同じ |
| R-8 | 同じ | Z004 タブの「取り込んだ記録を見る」→ 取消済みの行の「詳細」 | — | 入出庫履歴の CSV取込みの行が 3 つ（101 の取消済み 1・有効 1、102 の有効 1）。取消済みの詳細に「この取込みを取り消す」が無い | 同じ |

- L3 に入れないもの（Windows native でなくても見られるもの、または台本を長くするもの）: 完了した棚卸しの名指し（完了まで進めると台本が倍になる。自動 test の RB6・U3 と、Coordinator が Ready の依頼と同時に渡す画面の写し〈frontend の test の render か Vite の dev の画面〉で見る）、preview の失敗と取消の失敗（DB の手での改変が要る。L3 Eligibility の (3)。U4・U6）。写しを作れなければ、その残りの危険を PR の本文に書き、受け入れを Ready の判断に含める。
- fixture: b1 の生成の test の 3 file だけ（本 lane は fixture を足さない）。owner の今の DB は消さずに移して残す（Data Safety）。

## Review Focus

- 「起票時に確かめた 3 つ」の読み（65 §65.5 の表示条件が CSV取込みの詳細に CTA を求めること、取り消せる範囲と期間が正本で一意に決まること）が正しいか。owner の判断事項を正本で決まる問いに混ぜていないか、逆に owner の判断が要る問いを起草役が決めていないか。
- preview が取消と同じ関数を同じ TX で当てて戻す形（BIZ-03-D2）が、何も残さず（RB2）、取消と同じ商品を名指すか（RB1）。preview が書込みの TX を開くことが、他の command（取込みの確定・計数の保存）と交わらないか（`AppState.db` の Mutex）。
- 確認の「取り消す」を押せる条件（読取りの間・失敗・取消済みで押せない）と、2 つの入口が同じ部品・同じ mutation を使うこと。
- 取消の後の再取得（D-052 C9 の `inventoryRecords.root()` が preview の key と詳細を含むこと）と、詳細の表示の切替（取消済みで CTA が消える）。
- **この変更で不要になる記述・条件・code が、ほかに残っていないか**（例: 「取消は結果の画面だけ」と読める文、`useCsvImportFlow` の取消の本体、ResultStep の今の確認の文、65 §65.10 の 4b）。
- L3 の台本の各段が、前の段の後の状態から ADR D3 の判定で 1 通りに決まるか（とくに R-2 の P1 が要再確認でないこと、R-4 の P1 の範囲「9〜10」、R-6 で解けること）。
- 公開 repo に実データを書いていないか。並走の lane の節を触っていないか（所有表）。

## Contract Ledger

触る設計正本の節の契約を行にした（隣接の契約の sweep: ADR D2・D3・D6・D7、32 の D-118 の節の取消と順 2〜5・§15.5・§15.6a・§15.6b、41 §17.4・§17.5、55 の D-118 の表・UI-07-D13・D14・§55.4 の手順 18・§55.5・§55.7・§55.9・§55.11、65 §65.4.1・§65.5・§65.5a・§65.7.2・§65.8.1・§65.8.2・§65.8.3・§65.10、35 の完了の後の比較の範囲、DSR-07・08・15・18・20、UI_TECH_STACK の UI-STATE-D2、D-052 C9 を当て、本 lane の Scope が触り得ないものは下の「除外」に理由つきで書いた）。

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| BIZ-03-D2（preview は取消を同じ TX で当てて戻す、何も書かない） | 32 §15.6b | S1 | RB1・RB2 | — |
| 32 §15.6b の手順 1（無い ID・取消済み） | 32 §15.6b | S1 | RB3 | — |
| 32 §15.6b の `settlement_no`（取り込み直す精算） | 32 §15.6b、24 の active な精算の一覧 | S1 | RB4 | R-4 |
| 32 §15.6b の `affected_stocktakes`（35 の完了の後の比較の範囲） | 32 §15.6b、35、ADR D6 | S1 | RB6 | 非対象: L3（台本を長くしない。画面の写し） |
| SPEC-STK-CNT-D2・D3（取消の後の求め直しと要再確認。A1・最初の 1 本） | ADR D2・D3、32 の取消 | S1（b1 の本体を切り出すだけ） | RB5・T1 | R-2・R-4・R-5 |
| SPEC-STK-CNT-D7（取消と取り込み直し） | ADR D7、32 の順 3〜5 | 変えない（b1） | T1 | R-6 |
| 32 §15.5 の冪等（取消済みへの取消は 0 件の成功） | 32 §15.5 | 変えない | T1 | — |
| 41 の `preview_rollback_csv_import`（薄い command、error の kind） | 41 §17.4・§17.5 | S2 | W1 | — |
| 41 §17.9（command の登録） | 41 §17.9 | S2 | W2 | — |
| TRACE-D13（詳細の取消の入口: active だけ、成功と失敗、到達） | 65 §65.5a、§65.5 | S3 | U1・U5・U6 | R-3〜R-5・R-8 |
| §65.8.1（一覧の行に取消を置かない） | 65 §65.8.1 | 変えない | U1（行に無い） | R-3 |
| §65.5・DSR-18（詳細の戻り導線 `returnTo`） | 65 §65.5、DSR-18 | 変えない | T4（今の test） | — |
| UI-07-D18（共通の確認の中身と押せる条件、読取りの cache） | 55 §55.11 | S3 | U2〜U4・U7・U10 | R-4・R-7 |
| UI-07-D18（取消の mutation を 1 つに） | 55 §55.11、§55.9 | S3 | U5・U6・U9 | R-5 |
| UI-07-D18（Z004 タブの導線と `tab`。`tab` は初期選択だけ） | 55 §55.11、DSR-15 | S3 | U8 | R-3・R-6 |
| UI-STATE-D2（有限 URL search 値は feature の `types.ts` が tuple と schema を持ち、route は import する） | UI_TECH_STACK の UI-STATE-D2、55 §55.11 | S3（`src/features/csv-import/types.ts`・`src/routes/csv-import/index.tsx`） | U8、AC3 の 3 つの `rg` | — |
| UI-07-D14（正確な import ID、確認の項目、失敗で同じ ID の再試行） | 55 UI-07-D14 | S3 | U3・U6 | R-4 |
| §55.5・§55.9（取消の失敗は Toast だけ、state を変えない） | 55 §55.5・§55.9 | S3 | U6・T2 | — |
| 55 冒頭の表の「取消の結果」（取消の完了と要再確認の一覧） | 55 の D-118 の表 | 変えない（b1 の部品を詳細でも使う） | U5 | R-5 |
| D-052 C9（取消の再取得） | decision-log D-052、`src/lib/invalidation-contract.ts` | 変えない（共有の hook が呼ぶ） | U5 | — |
| 32 の表の順 4 の文（取込みID を名指す） | 32 の冒頭の D-118 の節の表 | S1（b1 の `parse.rs`） | RB7 | — |
| 要再確認の一覧の部品の操作の省略（確認の中で入れ直しへ進めない） | 55 §55.11 | S3（b1 の `RecheckTargetList.tsx`） | U3 | R-4 |
| DSR-07・DSR-20（destructive の確認） | 01 | S3 | U2 | R-4 |
| DSR-08（色だけで示さない） | 01、55 の D-118 の節 | S3（b1 の部品） | U3 | R-4 |

除外（触らない契約と理由）: 32 の順 1〜5 の判定と知らせ（取り込み直しは今の経路。変えるのは順 4 の文だけで、上の 32 の表の順 4 の行）。55 の UI-07-D13（同じ日の追加の確認。Z004 では b1 で外れる）。65 §65.7.2（業務記録の取消。REQ-208、非目的）。65 §65.8.3（操作ログの関連記録の許可リスト。`csv_import` は外のまま）。55 §55.7（`useBlocker` は importing の間だけで、取消と preview は block しない今のまま）。

## Contract Audit（起票の時点の一巡）

新しく足す契約の文（本 commit の 32 §15.6b・41・55 §55.11・65 §65.5a と、上の Boundary・「起票時に起草役が決めたこと」）を、境界の 4 観点で一巡した。

- 安全な整数の範囲: 新しい wire の数は `settlement_no`（b1 の 32 の順 1 で 0 以上 `9007199254740991` 以下に限った値で、number で正確）と、SQLite の id 2 つ（`csv_import_id`・`stocktake_id`）だけ。範囲を持つ数（`recheck_targets` の在庫と範囲）は b1 の `CountRecoveryTarget` の型をそのまま使う。→ 不足は無かった。
- 0 の表示: 精算回数 0 は「精算 0」と出す（0 を「無い」の印にしない。b1 の Z5 と同じ）。`recheck_targets` が空なら「取り消しても、数え直しが必要になる商品はありません」と言い切り、空の一覧を出さない。`affected_stocktakes` が空なら文を出さない。取消の結果の件数 0（取消済みへの冪等の Ok）は「0 件」と出る（下の残りの危険）。→ 正本の不足は 55 の空の一覧の文で、本 commit の §55.11 に書いた。
- 失敗の時点と順序: preview は TX の前に対象を確かめ（無い・取消済みは何も開かずに拒否）、TX の中で取消を当て、明示の rollback で戻す。戻しの失敗は `DatabaseError` で、TX の外に何も書いていない。確認は読取りが成功するまで「取り消す」を押せない。取消は今の 1 TX（b1）で、失敗は Toast と同じ ID の再試行。preview と取消の間に記録が入れば取消の結果が正（確認の名指しは読んだ時点のもの）。→ 正本の不足は 2 か所（preview の戻し方と、押せる条件）で、本 commit の 32 §15.6b と 55 §55.11 に書いた。
- 単位や種類の混在: 確認の範囲は商品の在庫の単位（長さは cm を `stock_unit` で m に。b1 の部品）。日付は 3 種類を語で分ける: 精算日（`settlement_date`、レジの日付）、取込み日時（`imported_at`、PC の日時。詳細の「記録日時」）、完了の日付（`completed_at` の日付の部分）。番号も 2 種類を分ける: 取込みID（記録の番号）と精算回数（「精算 {n}」）。→ 不足は無かった。

この起票で、DB の列・migration・既存の wire の型の形は変えていない（新しい型は `RollbackPreview`・`AffectedStocktake` の 2 つ）。消した記述: 無し（置き換える記述は b1 の merge の後の同期で消す。上の「この変更で不要になるもの」）。

## Contract Probe

本 lane が依る外部の前提を、2026-10-23 に確かめた。

- P1 SQLite の TX の中の書込みは同じ TX の読取りに見え、ROLLBACK で全部戻り、AUTOINCREMENT の連番も動かない（preview が取消を当てて読み、戻す前提）: repo の外の scratch の python の script（`sqlite3` の版 3.51.3。commit しない）で、movement の表（AUTOINCREMENT）と商品の表を作り、`BEGIN` → movement の `is_voided` の UPDATE → 商品の在庫を movement の和から UPDATE → 同じ TX で読む → `ROLLBACK` → 読む、を当てた -> 出力 `sqlite 3.51.3 in_tx 9 after 7 voided_after 0 seq (2,) (2,)`（TX の中で 9、戻した後に元の 7、無効の行 0、連番 2 のまま）。同梱の SQLite（`libsqlite3-sys` 0.28.0 の 3.45.0。b1 の packet の環境・再現性の lens）でも TX の意味は同じ（SQLite の TX の契約）。
- P2 rusqlite 0.31.0 の `Transaction` は明示の `rollback()` を持ち、drop の既定も rollback: `~/.cargo/registry/src/*/rusqlite-0.31.0/src/transaction.rs` の `drop_behavior: DropBehavior::Rollback`（`new_unchecked`）と `DropBehavior::Rollback => self.rollback_()` を読んだ。preview は drop に頼らず明示の `tx.rollback()` を呼ぶ（32 §15.6b の手順 5）。repo の中の明示の rollback の先例は `src-tauri/src/biz/csv_import_service/time_evidence.rs` の `check_settlement_identity`（b1 が撤去する）と `src-tauri/src/db/inventory_repo.rs`・`src-tauri/src/db/plu_slot_repo.rs` の test。
- P3 preview の TX は他の command と交わらない: `src-tauri/src/cmd/mod.rs` の `AppState` は `pub db: Mutex<DbConnection>` の 1 本の接続で、CMD は `state.db.lock()` の後に BIZ を呼ぶ（41 §17.5 の各 command の手順 1）。

## Data Safety

- commit しない物: 実 POS / 店舗データ、DB、backup、log、receipt。fixture は全部合成（b1 の L3 の fixture と、Rust・TS の test の値）。
- local だけの場所: owner の PC のアプリの data の folder（名前は `src-tauri/tauri.conf.json` の `identifier`、今は `com.inventory-system.desktop`。Windows は `%APPDATA%` と `%LOCALAPPDATA%` の下の同じ名前の folder）、起動の作業フォルダの旧 DB 一式、設定した backup の保存先。保全の対象の一覧の正本は [22](../function-design/22-mnt-migration.md) §16 の「作り直しの手順」の「アプリの data の folder」と「folder の外でアプリが読む場所」で、L3 を頼む日にその版で確かめる。
- L3 の DB の差し替え（Test Plan の「L3 の DB」。D-123 でリリースの前まで開発・試験 DB の作り直しは包括で承認済み）: L3 の前に 1 回、owner の L3 用の data の folder を 22 §16 の作り直しの手順のとおり日付の付いた folder の下へ**消さずに移す**（backup の保存先の file は動かさない）。実行は owner の L3 の依頼の範囲で Coordinator（WSL の `/mnt/c/Users/...` から。消す command を使わない）。L3 の後は戻さず、移した folder は残す（消すかは owner の判断）。
- 合成だけの場所: Rust と TS の test の fixture、b1 の生成の test が作る L3 の file（repo の外の folder）。

## 残りの危険（起票の時点）

- 確認の名指しは確認を開いた時点の状態で、開いたまま別の画面で記録を入れてから取り消すと、名指しと取消の結果が違うことがある（単店舗の 1 台の PC で、取消の結果の一覧が正。32 §15.6b の制約）。
- 2 つの画面（取込みの結果の画面と CSV取込みの詳細）で同じ取込みを続けて取り消すと、後の側は取消の本体の冪等の Ok で「取り消した売上 0 件」と要再確認の無い結果を出す（詳細の再取得で「取消済み」に変わる。黙って在庫を動かしはしない）。
- preview は取消と同じ求め直し（計数を持つ全ての商品）を当てるので、商品と計数が増えると確認を開いてから読み終わるまでの時間が延びる（その間は「取り消す」を押せず、spinner と文を出す。32 §15.6b の見直しの契機）。
- 取り込み直したときに数え直しが要る商品は、取り込み直した結果で初めて名指される（owner の判断事項 (ii) の推奨。確認は「出ることがあります」と書く）。
- 32 の順 4 の拒否の文に取込みID を足すのは b1 の merge の後の本 lane の S1（b1 の merge から本 lane の merge までは、b1 の文のとおり精算回数だけを名指す）。

## Implementation Results

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

（実装の後に書く。）

## Review Response

先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。

（Plan Review の後に書く。）

round 1（`d4183273`）: Claude 側 fresh Opus 5.5 = reject（P1 0 / P2 1 / P3 7）、Codex = reject（P1 0 / P2 4 / P3 1）。重なりは 2 件（`RecheckTargetList` の `renderAction`、「参考の差が変わります」の言い切り）。Coordinator は全 11 件を採用した。是正は起草役の `fd2c1f8c`。

- P2: `RecheckTargetList` の `renderAction` を任意にして省略時は操作の列と入れ直しの文を出さない（b1 の file を本 lane で変える）、名指す棚卸しを比較の範囲の候補と定義し「変わることがあります」に、確認の文を因果を言わない形に（取消の前から要再確認の商品を含む）、順 4 の拒否で取込み ID を名指す実装と既存 test の期待の更新を Scope・Matrix（RB7）に、L3 の保全の path を `tauri.conf.json` の identifier と 22 §16 を引く形に。
- P3: Specta と runtime の登録の 2 面と W2 を command drift の静的な検証に、正本の読みの基準に Gated Amendment `bc0bf2f5` を、routeTree の AC を外す、判断事項の答えで変わる所の列挙、RB1 の mutant の帰属を RB5 へ、U10 に 2 回目の読取りの間の disabled。
- 起草役の見送り（Coordinator が受理）: 32 §15.6b の求め直しの理由の文（取消の前に要再確認でなかった商品にも出る）は、確認の文の因果の言い切りとは別なので残す。

round 2（`fe7d10fd`）: Claude 側 fresh Opus 5.5 = reject（P1 0 / P2 1 / P3 1）、Codex = reject（P1 0 / P2 2 / P3 2）。重なりは 1 件（S3 の query key の行の崩れ）。Coordinator は全 5 件（重なりを 1 件に数えて）を受理し、最小の修正案に沿って是正した（是正は Coordinator の代行の Opus 5.5 subagent、本 commit）。

- P2（Opus #1）完了した棚卸しの確認の文が、取消で変わりうる記録の詳細の「差異」「ロス原価」を名指さない（b1 の `stocktake_service.rs` の 720 行の `ledger_at_cutoff` と 724 行のロス原価で確かめた）: 文を「完了した棚卸し（{完了の日付}）の評価額は変わりません。棚卸しの記録の詳細の「差異」「ロス原価」と「完了の後に入った記録による差（参考）」が変わることがあります。」に。反映: 55 §55.11 の「完了した棚卸し」の項と理由、65 §65.5a の「確認」、32 §15.6b の関数要求・`affected_stocktakes`・手順 3、packet の Goal の最小完了条件の 2 つ目・Ordinary Operation の最後の行・owner の判断事項 (iii) の問いと A の説明・S1 の行・Reporting の lens、Matrix の Contracts Under Test・Failure Modes・RB6（範囲が差異・ロス原価の使う精算を含む理由の 1 行）・U3（新しい文の exact と旧い文の 0）。名指す集合（35 の範囲）は変えない。owner の判断事項 (iii) は推奨 A の中身（範囲で名指す）を変えず、起草役が書いた問いと説明の語だけを揃えた。
- P2（Codex #1）RB7 の固定 `1` の mutant が b1 の今の fixture では red にならない（3 test とも名指す取込みが ID 1）: 3 test とも名指す取込みの前に別の取込みを 1 件入れて ID を 1 以外にし、ID が 1 でないことを assert し、固定 `1` の mutant で 3 test とも red を求める。反映: Matrix の RB7・T5・Mutation-style の 1 つ目、packet の S1 の順 4 の行・Test Plan の「mutation の確かめ」。
- P2（Codex #2）`tab` の値の集合の所有が UI-STATE-D2 に繋がらない: feature の `src/features/csv-import/types.ts` が tuple `CSV_IMPORT_TAB_VALUES`・schema `csvImportSearchSchema`・型 `CsvImportSearch` を持ち、route は import する形に（先例 `src/features/daily-sales/types.ts` と `src/routes/reports/daily.tsx`）。反映: 55 §55.11 の `tab` の項、packet の「起票時に起草役が決めたこと」の 5・S3 の新しい行・Boundary の route / search・Contract Ledger の UI-STATE-D2 の行と sweep の一覧・Design Readiness の引用・AC3 の 3 つの `rg` と round 2 の baseline・予定 path（39。`types.ts` は b1 の差分と b1 の packet の予定 path にある）と所有表、Matrix の Contracts Under Test・Failure Modes・U8・Adjacent Pattern Audit。
- P3（Opus #2・Codex #3、重なり）S3 の query key の行に `RecheckTargetList` の所有表の行が混ざった: query key を `src/lib/query-keys.ts`・U10 の 1 行に戻し、`RecheckTargetList.tsx` の行を「節の所有表」へ移した。
- P3（Codex #4）Matrix の「戻る・進むで search のとおり」が、`defaultValue` の初期選択だけという正本と合わない: Matrix の State Lifecycle の Revisit を「再 mount 時は search のとおり、同じ mount の間はタブの状態を保つ」に。55 §55.11 の `tab` の項と packet の「起票時に起草役が決めたこと」の 5 にも初期選択だけであることを書いた。
- Gated Amendment: 無し（plan-gate のままの是正で、Plan Commit は pending）。
