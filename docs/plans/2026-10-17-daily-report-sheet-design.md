# Plan Packet: 日報の紙（1 日 1 枚）と日報の意味づけを設計正本へ置く

2026-10-17 に同時に起票した 6 本の lane（repo 外の回答台帳 TD-304「動かせるだけ動かす」、TD-295「並列にできるものは並列に」）の 1 本で、wave の名前は持たない（design lane、docs だけ。runtime は後続の lane）。並走の lane は、売上の SD からの一括取込みと EJ の控えの閲覧（branch `agent/sd-bulk-import-design`、D-121）、単位の語の直し（`agent/stock-unit-relabel`）、JAN を直した商品の前の JAN（`agent/jan-alias-design`、D-122）、SD 直読みの runtime（`agent/sd-direct-read-runtime`）、MSI の配布の手順（`agent/msi-distribution-docs`）。本 lane の branch は `agent/daily-report-sheet-design`（起点 main `f5d7aaf4`）。

規模と手法（起票の最初に数えた。file の数は `git diff --name-only f5d7aaf4 HEAD -- docs ':(exclude)docs/plans'` の 12 file）: 触る設計正本は 8 file（function-design の 24・29・34・42・56、db-design の pos-tables、`SCREEN_DESIGN.md`、`UI_TECH_STACK.md`）と `architecture/ui-task-specs.md`・`plu-export-and-real-csv-verification.md`（印刷の要否の古い記述の追随）・decision-log・backlog。画面 1（日次売上の `ExportBar` と、画面に出さない印刷用の紙の内容）。migration 0（DB の列・制約は変えない）。wire の型は後続で 1 つ増える（`get_daily_report_sheet` の `DailyReportSheet`。既存の DTO は変えない）。横断の約束がかかる経路は 2 つ（同じ日の取込みをまたいで足す鍵〈日次売上の支払集計と日報の紙の 2 か所〉、紙の切替えの時期〈店の運用とアプリの導入の順〉）。**1 lane のまま進める**。足す鍵は 34 SALES-SHEET-D2 の 1 か所に置き、24 §14.21 手順 3 と pos-tables §12d はそこを引く。分ける案（意味づけの見直しを別の lane にする）は採らない。理由: 紙の足し方と支払集計の鍵は同じ規則で、分けると 2 本が同じ規則を取り合う。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（本 run の起草役）
- Plan Reviewer: fresh Opus 5.5 + Codex（GPT-6.1 Sol / high。`.local` の model の選び方の「R3 で複数の層にまたがる契約の初回」の行）
- Final Reviewer: Fable 5.1（Claude 側、R3・design lane）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/daily-report-sheet-design

遷移の記録:

1. kickoff → spec-check（2026-10-17、起草役）: owner の決定（repo 外の回答台帳 TD-260・TD-280・TD-296 の 15）と店主の答え（TD-279・TD-305）、2026-10 の見直しの突き合わせ O-18（repo 外）を Scope にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-17、起草役）: 触る正本（34 §19.3、24 §14.21、29 IO-07-D4・§29.4.1、56 UI-09a-D13・ExportBar・非目的、pos-tables §12d、SCREEN_DESIGN の日次売上、UI_TECH_STACK §6.5）が印刷を「仕様未定」とし、紙の用途を「外部提出帳票ではなく」と事実に合わない形で書き、支払の合算を並び順の鍵で持つ。同じ commit で設計正本を更新した（下の Design Readiness）。
3. design → plan-draft（2026-10-17、起草役、同じ commit）: 条件「設計の出力が正本にある」は Design Readiness の引く正本と D-120 で満たす。条件「未解決の設計の問いが無い」は、owner に聞く見た目の問い（紙の並びの案、切替えの日）に答えが無い間の既定を正本（UI-09a-D17・D19）に書いたことで満たす。残る外部前提（Contract Probe の P1・P2・P5）は runtime の lane の実装の前と L3 で確かめるもので、設計の問いではない。plan-gate への遷移は Coordinator。
4. plan-draft → plan-gate（2026-10-17、Coordinator）: packet・Matrix と正本は起草役の commit（`2a615820`）にある。Coordinator は D-120 の全文と、29 §29.4.1・56 UI-09a-D13・D17・D19・34 SALES-SHEET-D2 の追加の行を読み、owner の決定（TD-260・TD-280・TD-296 の 15）と店主の答え（TD-279・TD-305）の写しに食い違いが無いこと、手元の資料の数に版の時点が付いていること、追加の行に実値・実ラベルが無いこと、37・45・55（並走の 364・367 の所有）に触れていないことを確かめた。owner に聞く 2 つ（紙の並びの案、切替えの日）は既定（案 a）で進められ、並びは runtime の lane の L3 で実機の印刷で並べて決める形を採る。Plan Review round 1 へ出す。

## Owner Effort Budget

- 介入回数上限: 9（既定の 6 から owner が改定、repo 外の回答台帳 TD-296 の 5a）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 9（owner の改定、TD-296） | 0（起票時点。TD-260・TD-280・TD-296・TD-279・TD-305 は起票の前の決定と答えで、本 lane の介入に数えない） | 4（Open Questions の Q1・Q2 を 1 回で聞いて 2、Ready 1、merge 1） | 5 | 9 = 0 + 4 + 5 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
report output（日報の紙の内容と並び）、Tauri command DTO（`get_daily_report_sheet` と `DailyReportSheet` を足す）、operator workflow（締めの後の印刷と、Excel から紙への切替え）の契約を決める設計で、`docs/DEV_WORKFLOW.md` の Risk Tiers の R3 の行（report CSV・Tauri command DTO・operator workflow）に当たる。本 lane は docs だけだが、後続の runtime が写す契約を決めるので R3。R4 ではない: 紙は読み取りだけで、DB の列・migration・データの寿命に触れず、実データを公開しない。この変更で required gate の green / red は変わらない: docs だけで、REQ の参照を増減していない。設計書の code block に足した関数（`get_daily_report_sheet`・`get_daily_report_sheet_lines`・`get_active_z004_import_totals`）は code に無い関数として設計照合 test の INFO になり、失敗にならない（下の AC12 で確かめる）。Scope の予定 path を `scripts/ci/classify-changes.sh` の workflow の一覧（`AGENTS.md`・`CLAUDE.md`・`docs/DEV_WORKFLOW.md`・`docs/ci.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/code_review.md`・`docs/quality/review-checklist.md`・`docs/project-profile.md`・`docs/agent-guidance/*`・`docs/templates/*`・`.agents/*`・`.claude/{rules,commands,skills}/*`・PR template と、full に倒す `scripts/*`・`.github/*`）に当てて、当たる file は無い。Final Review Minimum 1。

## Goal

Goal Invariant:

### 最小完了条件

- 後続の runtime の lane の Writer が、チャットの履歴と repo 外の資料を見ずに、source docs だけで次を実装できる: 日次売上の `日報を印刷` で、その日の完了した日報の取込みを位置と名称の組で足した 1 日 1 枚の紙を、A4 縦・文字 9 pt 以上・色なし・今の Excel の横長の並びを写さない形で印刷する（34 §19.3a SALES-SHEET-D1〜D6、24 §14.21a・§14.21b、42 `get_daily_report_sheet`、56 UI-09a-D17・D18、UI_TECH_STACK §6.5.5）。PLU の売上は売れた行だけが紙に載る（SALES-SHEET-D4）。
- 日報の意味づけのうち実データで効いていない所が事実に合う: 同じ日の取込みをまたぐ支払の合算の鍵が位置と名称の組になり（24 §14.21 手順 3）、`credit` の規則を外し、半角カナの正規化を入れない理由が書かれている（29 IO-07-D4a）。
- 紙の切替えの時期と、それまで店がすること、切り替える前の確かめが正本（UI-09a-D19）にある。
- owner に聞く見た目の問い（紙の並びの案 3 つ、切替えの日）が、答えが無い間の既定とともに packet の Open Questions と正本にあり、案の比べ方（実機の印刷で並べる）が runtime の lane の L3 の項目になっている（Matrix の Manual）。
- D-120 が decision-log にあり、後続の runtime の lane の範囲と Risk が backlog にある。

### 失敗定義

- 紙が精算ごとに分かれる、または今の Excel の横長の並び（4 つの帳票を横に並べて縮小する形）を写す。
- 足す鍵が並び順だけか名称だけで、名称の変わった日に別の行を足すか、1 本の中の同じ文字を含む行を 1 つにまとめる。
- 収まらないときに 9 pt を割って縮める契約になる。
- 半角カナを正規化して `credit` を効かせる（4 つの行が同じ鍵になる）。
- 紙の値がレジスターツールの日報と同じであることを確かめたように書く（未確認の前提を確かめた事実として書く）。
- 並走の lane（D-121）が所有する取込みの経路（37、45、55、29 §29.7・§29.8、pos-tables §12b・B-2、D-071 の日報の側）を書き換える。
- 公開 repo に店の運用の細部・金額・商品名・JAN・部門名・発言の原文・実データの値を書く。

### 非目的

- code・bindings・test の変更（runtime の lane）。
- 取込みの経路・同日追加の確認・SD の読取り（D-121 と D-111）。
- 日次売上の画面の Z001 を 1 つの表に足すこと（D-096 のまま。Revisit の条件は D-120）。
- 月次の印刷（月次の印刷ボタンは disabled のまま）。
- 紙の並びの最終の決定（owner が実機の印刷で選ぶ。既定だけを置く）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので、締めの日と切替えの前後の操作列を置く。本 lane は docs だけで、表の通常運用は後続の runtime の lane の後に成り立つ。**この文書を完了できる**（設計正本がそろう）ことと、**通常運用を達成できる**（店が締めの後にアプリから日報の紙を印刷し、Excel への貼付けをやめる）ことは別で、後者は本 lane では未達。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| runtime の lane を入れた版。切替えの前。店は今の Excel への貼付けを続けている | 締めの後に日報を取り込み（今の取込みの画面）、日次売上を開く | 印刷ボタン `日報を印刷` が押せる（その日の完了した取込みがある） | — | — |
| 同じ | `日報を印刷` を押す | 紙の内容を読み直し、OS の印刷の dialog が出る。プレビューに A4 縦の 1 枚（上に日付、左に日計と部門、右に支払、下に PLU） | 印刷先を選んで印刷 | P1（WebView2 の印刷） |
| 同じ日に 2 回精算して 2 回取り込んだ日 | `日報を印刷` | 2 回分を位置と名称の組で足した 1 枚。上に `2回の取込みを合算` | — | P2（レジスターツールの日報と同じ値か） |
| まだ取り込んでいない日 | 日次売上を開く | ボタンは押せず、下に `この日のレジ日報は未取込みのため、印刷できません。` | 取り込む | — |
| Z004 の取込みが止まっている間（停止 ADR） | `日報を印刷` | PLU の部分は `この日の PLU の売上は取り込まれていません。` の 1 行。日報の部分は出る | — | P6 |
| runtime の lane の L3 | owner が並びの案 a・b・c を実機のプリンタで印刷して並べる | 案を選ぶ（答えが無ければ a） | 選んだ案が既定と違えば Gated Amendment で UI-09a-D17 を直す | P5（1 枚に収まるか） |
| 店のアプリの運用が始まった後の実際の 1 日 | アプリの紙と今の Excel の紙を並べる（同じ日に 2 回以上精算した日があればその日も） | 値が同じことを確かめる（UI-09a-D13 の受入と一緒） | 同じなら切替えの日を決める | P2 |
| 切替えの日（月の初め、12 月にかかるなら元日。Q2） | 締めの後に `日報を印刷` で印刷して綴じる。Excel への貼付けをやめる | 手で写す作業が無くなる（TD-260） | — | — |
| 切替えの後、紙に不都合が見つかった | 翌日から Excel の貼付けに戻す | アプリの側は何も変わらない。過去の日の紙はいつでも印刷し直せる | 原因を直した版で切り替え直す | — |

## Scope

本 lane は docs だけ。下の file の、下の節を書き換えた（全部 plan-first の commit）。

1. 紙の内容と足し方（Scope の 1、発注の Scope 1）: [34](../function-design/34-biz-sales-service.md) に §19.3a `get_daily_report_sheet`（SALES-SHEET-D1〜D6、型 `DailyReportSheet`・`DailyReportSheetRow`・`DailyReportSheetPluImport`、処理ステップ、エラー、runtime の lane のテスト）を足し、§19.3 の手順 3 の支払の集約の鍵と「設計判断」の Z001 の段に紙の例外を書いた。[24](../function-design/24-io-csv-import-repo.md) の §14.21 手順 3 を位置と名称の組にし、§14.21a `get_daily_report_sheet_lines`・§14.21b `get_active_z004_import_totals` を足した。[42](../function-design/42-cmd-sales-stocktake.md) に CMD `get_daily_report_sheet` を足した。
2. 紙の並びと印刷の手段（発注の Scope 1）: [56](../function-design/56-ui-daily-sales.md) に「日報の紙」の節（UI-09a-D17 = 印刷ボタンと押せない状態の文、並びの既定、表と値の書き方、紙の上の知らせ、文字の大きさの下限 9 pt、色なし、画面に出さない。UI-09a-D18 = WebView の印刷と代わりの道）を足し、ファイル構成の `ExportBar` の行・component の `Tooltip` の行・非目的の「印刷ボタンの本実装」の行・更新履歴を直した。[UI_TECH_STACK](../UI_TECH_STACK.md) に §6.5.5 印刷、[SCREEN_DESIGN](../SCREEN_DESIGN.md) の日次売上の利用者配慮に 1 行、[ui-task-specs](../architecture/ui-task-specs.md) の UI-09a の印刷ボタンの行に設計の参照を足した。
3. 意味づけの見直し（発注の Scope 2）: [29](../function-design/29-io-daily-report-parser.md) に IO-07-D4a（意味の鍵は `gross_sales`・`net_sales`・`cash` だけ、`credit` の規則を外す、半角カナの正規化を入れない、`payment_key`・`line_key` は足す鍵に使わない。根拠は手元の Z 帳票の 2026-09-30 版での集計の数と位置だけ）を足し、§29.4.1 の layout A の表の Z002 の行と「行の構成と性質」の段に紙の扱いを書いた。[pos-tables](../db-design/pos-tables.md) §12d の設計意図に足す鍵の段を足した（列・制約は変えない）。
4. 紙の切替えの時期（発注の Scope 3）: 56 の UI-09a-D19（切替えまで店は今の Excel を続ける、切り替える前の 2 つの確かめ、月の初めか元日、既定、戻し方）を足し、UI-09a-D13 の紙の用途を事実（店の控えと店の外へ渡す用を兼ねる、`docs/project-memory.md` の日報の紙の行）に直して受入を D19 と一緒にした。[plu-export-and-real-csv-verification](../plu-export-and-real-csv-verification.md) の「印刷機能の要否はこの受入結果で決め」に D-120 の決定を足した。
5. 後続と決定（発注の Scope 4）: [backlog](../backlog.md) の「日報の紙と意味づけ」に設計 lane の起票と決めたことを足し、その下に「日報の紙の runtime」（R3、範囲・L3・依存）を足した。「日報画面の Excel 印刷・バインダー代替受入判定」と「既存の支払集計（Z002）で異なる項目が 1 行に合算されうる」に D-120 の決定を足した。[decision-log](../decision-log.md) の末尾に D-120 を足し、D-096 の Revisit の後に紙の行を 1 行足した（D-096 の本文は変えていない）。
6. owner に聞く見た目の問い（発注の Scope 5）: 下の Open Questions と、Matrix の Manual の L3 の項目。

ついでに直したもの: 無し。

対象を使う呼出し側・隣接 test・helper / mock・生成物（後続の runtime の lane が触る。本 lane は変えない。`rg` で 2026-10-17 に確かめた）:

- 支払の合算の鍵（24 §14.21 手順 3）を作る所: `src-tauri/src/db/sales_repo.rs` の `get_completed_daily_report_aggregate`（`:1039`、支払の集約は `:1075` の query と `:1113` の group）。読む所: `src-tauri/src/biz/sales_service.rs`（`:584` の写像）、`src/features/daily-sales/DailySalesPage.tsx`（`:223` の行の key に `payment_key` を使う。鍵を変えると同じ `payment_key` の 2 行が出うるので、行の key を位置と名称から作る）。test の fixture・呼び方: `src-tauri/src/biz/sales_service.rs` の test（`:769`・`:892` の `payment_key: "cash"`）、`src-tauri/src/db/sales_repo.rs` の test（`:2291` 付近）、`src/features/daily-sales/DailySalesPage.test.tsx`（`:99`・`:225`）。
- `credit` の規則（29 IO-07-D4a）: `src-tauri/src/io/daily_report_parser.rs` の `payment_key`（`:582`〜`:590`）とその test。`credit` を読む処理は無い（`rg -n '"credit"' src src-tauri/src` は parser の中だけ）。
- 紙の新しい関数と型: IO = `src-tauri/src/db/sales_repo.rs`（24 の設計書は `db::csv_import_repo` と `db::sales_repo` の 2 つに対応づけられている。`src-tauri/tests/design_compliance_test.rs:151`）、BIZ = `src-tauri/src/biz/sales_service.rs`、CMD = `src-tauri/src/cmd/sales_cmd.rs` と `src-tauri/src/lib.rs` の登録、`src/lib/bindings.ts`（再生成）、UI = `src/features/daily-sales/components/ExportBar.tsx`（今の印刷ボタンは `aria-disabled`、`:3`〜`:4` と `:44`）・`DailySalesPage.tsx`・新しい紙の component と hook。日次売上の取込み・取消の後の invalidate の所（56 の主動線、`["daily-sales"]`）。
- 新しい表示文言の test との衝突: `rg -F '日報を印刷' src --glob '*.test.*'` は 0 件、`rg -n '印刷' src` は 2 つの `ExportBar.tsx` だけ（2026-10-17）。

並走の lane と重なる file と行・節の所有（D-055 の所有表。並走の lane の packet はそれぞれの branch にあり、本 lane は引かない）:

| file | 本 lane が触る所 | 売上の SD からの一括取込みの lane（D-121）が所有する所 | merge の後に揃える所 |
|---|---|---|---|
| `docs/function-design/29-io-daily-report-parser.md` | §29.2 の IO-07-D4 の下に足した IO-07-D4a、§29.4.1 の layout A の表の Z002 の行と「行の構成と性質」の段 | §29.7（IO-09）・§29.8（IO-10）と取込みの経路の記述 | 無し |
| `docs/function-design/37-biz-daily-report-import-service.md` | 触らない（§37.3 手順 6 の必須サマリを IO-07-D4a から引くだけ） | 全体（取込みの経路、BIZ-08-D4 の同日追加の照合、§37.9） | 無し |
| `docs/function-design/24-io-csv-import-repo.md` | §14.21 手順 3、§14.21a・§14.21b（新設） | §14.18a など取込みの側の関数 | 無し |
| `docs/function-design/34-biz-sales-service.md` | §19.3 手順 3・設計判断、§19.3a（新設）、更新履歴の 1 行 | 触らない見込み（EJ の閲覧が日次売上に出るなら §19.2 に field を足しうる） | 両方が §19.2 を触ったら field を両方残す |
| `docs/db-design/pos-tables.md` | §12d の設計意図の 1 段 | §12b（同日追加・精算回数）と B-2 | 無し |
| `docs/SCREEN_DESIGN.md` | 日次売上画面の利用者配慮の 1 行 | 売上データ取込み画面の節 | 無し |
| `docs/decision-log.md` | D-096 の Revisit の後の 1 行、末尾の D-120 | 末尾の D-121、D-071・D-111 への追記 | 末尾は両方を残す（番号の順） |
| `docs/backlog.md` | 「日報の紙と意味づけ」の項と、その下に足した「日報の紙の runtime」、受入判定の項と Z002 の合算の項の末尾 | 「売上の SD からの一括取込みと EJ の控えの閲覧」の項 | 無し |

SD 直読みの runtime の lane は D-111 の既決の契約の実装で、本 lane はその契約（29 §29.7・§29.8、37 の BIZ-08-D3〜D6、45、55）を変えない。他の 3 本（単位の語の直し、JAN の別名、MSI）とは file が重ならない見込み（decision-log・backlog の末尾の追記を除く）。

## Non-scope

- code・bindings・test（日報の紙の runtime の lane。backlog の項）。
- 取込みの経路・同日追加の確認（D-071 の日報の側）・SD の読取り（D-121、D-111）。37・45・55 の正本。
- 日次売上の画面の Z001 の表示（D-096 のまま）、部門の照合と月次の部門集計（変えない）。
- 月次の印刷、プリンタの設定の画面。
- Z004 の取込みの再開（停止 ADR と D-118・D-121 の後続）。
- `docs/Plans.md`（lane の行を足さない。D-097）、`docs/project-memory.md`（紙の用途の行はすでに事実どおり）。

## Acceptance Criteria

数は開始 HEAD `f5d7aaf4`（`git archive f5d7aaf4 docs` を `$TMPDIR/old` に展開した版）と起票後の版を同じ数え方（その file の中で式に当たる行の数、`rg -c -F`）で測った。出力が無いのは 0。

- AC1（紙の BIZ）: `rg -c -F 'SALES-SHEET-D' docs/function-design/34-biz-sales-service.md` が 12（開始 0）、`rg -c -F 'fn get_daily_report_sheet(' docs/function-design/34-biz-sales-service.md` が 1（開始 0）、`rg -c -F '日報の紙は §19.3a で Z001 も足す' docs/function-design/34-biz-sales-service.md` が 1（開始 0）。
- AC2（紙の IO と支払の合算の鍵）: `rg -c -F 'fn get_daily_report_sheet_lines(' docs/function-design/24-io-csv-import-repo.md` と `rg -c -F 'fn get_active_z004_import_totals(' docs/function-design/24-io-csv-import-repo.md` がどちらも 1（開始 0）。`rg -c -F 'は `payment_key` で集約する' docs/function-design/24-io-csv-import-repo.md` が 0（開始 1）。
- AC3（CMD）: `rg -c -F 'fn get_daily_report_sheet(' docs/function-design/42-cmd-sales-stocktake.md` が 1（開始 0）。
- AC4（紙の画面と印刷）: `docs/function-design/56-ui-daily-sales.md` で `rg -c -F 'UI-09a-D17'` が 6、`'UI-09a-D18'` が 2、`'UI-09a-D19'` が 2、``'`日報を印刷`'`` が 3、`'9 pt 以上'` が 1（開始はどれも 0）。`rg -c -F '#### 6.5.5 印刷' docs/UI_TECH_STACK.md` が 1、`rg -c -F 'UI-09a-D17〜D19' docs/SCREEN_DESIGN.md` が 1（開始 0）。
- AC5（古い記述の撤去）: `rg -c -F 'バインダーは外部提出帳票ではなく' docs/function-design/56-ui-daily-sales.md` が 0（開始 1）、`rg -c -F '印刷機能は受入結果から必要性を決め、' docs/function-design/56-ui-daily-sales.md` が 0（開始 1）。
- AC6（意味づけ）: `rg -c -F 'IO-07-D4a' docs/function-design/29-io-daily-report-parser.md` が 2（開始 0）、`rg -c -F 'TD-305' docs/function-design/29-io-daily-report-parser.md` が 1（開始 0）、`rg -c -F '同じ日の取込みをまたいで足す鍵' docs/db-design/pos-tables.md` が 1（開始 0）。
- AC7（決定の記録）: `rg -c -F '## D-120: ' docs/decision-log.md` が 1、`rg -c -F -- '- 紙（2026-10-17、D-120）' docs/decision-log.md` が 1（開始 0）。D-096 の本文が変わっていない: `awk '/^## D-096/,/^- Revisit/'` を開始の版と今の版の `docs/decision-log.md` に当てた出力を `cmp` して同じ。
- AC8（backlog）: `rg -c -F -- '- **日報の紙の runtime**' docs/backlog.md`、`rg -c -F '2026-10-17: D-120 で直し方を決めた' docs/backlog.md`、`rg -c -F '→ 2026-10-17: 印刷機能は作ると決めた（D-120' docs/backlog.md` がどれも 1（開始 0）。
- AC9（並走の lane の節を触らない）: `git diff --name-only f5d7aaf4 HEAD -- docs/function-design/37-biz-daily-report-import-service.md docs/function-design/45-cmd-daily-report-import.md docs/function-design/55-ui-csv-import.md` の出力が空。`git diff -U0 f5d7aaf4 HEAD -- docs/function-design/29-io-daily-report-parser.md | grep '^@@'` の hunk がどれも 212 行目（§29.7 の見出し）より前。`git diff -U0 f5d7aaf4 HEAD -- docs/db-design/pos-tables.md | grep '^@@'` の hunk が §12d の設計意図（開始の版の 201〜203 行目の直後）だけ。
- AC10（docs だけ）: `git diff --name-only f5d7aaf4 HEAD -- src src-tauri scripts package.json package-lock.json` の出力が空。
- AC11（公開してよい形）: `git diff -U0 f5d7aaf4 HEAD -- docs` の追加の行に、店の金額・商品名・JAN・部門名・発言の原文・実データの名称の値が無い（数・位置・帳票の名前と、レジの帳票の総称〈総売・純売・現金・クレジット〉だけ）。Plan Review で差分を読んで確かめる。
- AC12（検査）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0・WARN 0（開始 HEAD の full は WARN 0。開始 HEAD には active packet が無く `--target plan` は対象なしで exit 2）。`cd src-tauri && cargo run --bin generate_traceability -- --check` が OK。`cd src-tauri && cargo test --test design_compliance_test` が pass。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: 34 §19.2・§19.3（手順 2・3、設計判断）・§19.3a（SALES-SHEET-D1〜D6）／24 §14.21（手順 3）・§14.21a・§14.21b／42 §22.4 の `get_daily_report_sheet`／29 §29.2 の IO-07-D2・D4・D4a・D5、§29.4.1／56 §56.1 の UI-09a-D12・D13・D15・D16・D17・D18・D19、§56.7、§56.13／pos-tables §12c・§12d・§12e／SCREEN_DESIGN の日次売上画面／UI_TECH_STACK §6.4・§6.5.1・§6.5.5／D-022・D-025・D-096・D-104・D-111・D-120、停止 ADR（`docs/adr/2026-09-23-legacy-stocktake-z004-write-stop.md`）と 32 §15.0・35 §20.0 の「現行buildの一時停止」（PLU の部分が出ない理由としてだけ引く）。
- 必要な設計成果物（Design artifact selection の当たる行）: BIZ・IO の振舞い = updated in this PR（34、24、29）／command・DTO = updated in this PR（42、34 の型。wire の変更は後続、下の Boundary / Wire Contract）／report の形 = updated in this PR（34 SALES-SHEET-D3・D4、56 UI-09a-D17）／operator workflow・文言 = updated in this PR（56 UI-09a-D17・D19、SCREEN_DESIGN、UI_TECH_STACK §6.5.5）／表・migration = existing sufficient（列・制約を変えない。pos-tables §12d に足す鍵の段だけ）／durable な判断 = updated in this PR（D-120、D-096 の 1 行）。
- plan にしかない durable な判断の昇格先: 決めたことは全て正本と D-120 に置いた。packet にだけあるのは、規模と手法の数え、後続の lane への file の申し送り（Scope の末尾）、所有表、AC の数、Open Questions の文面。
- 前提・制約と、延期した design gap の follow-up: WebView2 の印刷（P1）は runtime の lane の実装の前、紙の値とレジスターツールの日報の一致（P2）と 1 枚に収まるか（P5）は runtime の lane の L3。紙の並びの案と切替えの日は owner の答え待ちで、答えが無い間の既定を正本に書いた。延期が安全な理由: どれも今の code の振舞いを変えず、既定は今の画面を変えない（印刷ボタンが disabled から押せるに変わるのは runtime の lane）。
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: 「紙は 1 日 1 枚」は精算ごとに分けないことを指し、行が多い日の 2 枚目は許す（UI-09a-D17 に書いた）。「名称の変わった日に別の行を足さない」は位置と名称の組の鍵で成り立ち、例外は 1 回の精算の中で同じ位置に 2 つの行がある場合で、位置は行の番号なので起きない。「取り消した取込みは紙に入らない」は読取りが `status='completed'` だけを読む（24 §14.21a）ことに依る。「同じ精算を二重に足さない」は保証しない: 精算回数の読めない束を手で選んだ場合（BIZ-08-D4 が照合しない）は二重に足しうる（D-120 の Guarantee range に書いた）。「Z005 は部門マスタと照合しない」は紙だけで、画面と月次は照合を続ける。
- 判定（ready / not ready）と理由: ready（plan-draft に進める）。理由: 設計の出力が上の正本と D-120 にあり、owner の判断事項（1 日 1 枚・並びの方針）は TD-280・TD-296 で決まり、見た目の細部と切替えの日は答えが無い間の既定を持つ問いとして正本と Open Questions にあり、残る外部前提は runtime の lane の実装の前と L3 で確かめるもので設計の問いではない。

## Registration / Generation Obligations

本 lane: REQ の参照を増減していないので `docs/function-design/90-traceability.md` を再生成しない（`cargo run --bin generate_traceability -- --check` で確かめる、AC12）。function-design の file の新設・改名・削除は無い。後続の義務（runtime の lane）: Tauri command `get_daily_report_sheet` を `lib.rs` の specta `collect_commands` と `invoke_handler` に登録し、`#[tauri::command]` と `#[specta::specta]` の対を付け、`cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成する（42 §22.8）。route は足さない（印刷は日次売上の画面の中で行う）ので `npm run generate:routes` は要らない。operator 画面の新設は無い（到達導線は既存の日次売上）。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 当たる。帳票の行の位置・名称・`credit` の鍵の導き方はレジの adapter（IO-07）の事実。紙の足し方（位置と名称の組）と紙の並びは app-core（BIZ-05・UI）。レジが変わると IO-07 が行を作り直し、紙の規則は残る | 29 IO-07-D4a、34 SALES-SHEET-D2 |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 当たる。事実 = 店主の答え（1 日 1 枚、合算の表示、縦の印刷は字が小さい、時期を選ぶ）、手元の Z 帳票の 2026-09-30 版での数と位置。未確認の前提 = 合算がレジスターツールの仕様か・行ごとに同じ値か、WebView2 の印刷。決定 = 足す鍵・並び・下限・切替えの既定 | Contract Probe、D-120 |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 当たる。紙は保存せず印刷のたびに作る（取消・追加の後は次の紙が変わる、印刷日時で見分ける）。読込みの失敗は印刷を止める。印刷の dialog の取消は何も残さない | 34 SALES-SHEET-D5・D6、56 UI-09a-D17、Matrix |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 当たる。締め → 取込み → 日次売上 → `日報を印刷` → 綴じる。切替えまでは今の Excel を続け、切り替えた後も戻せる | Ordinary Operation、56 UI-09a-D19 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 当たる（小）。レジが変わると IO-07 と帳票の見出しの語（`Z001` 等）が変わる。紙の足し方と並びの規則は残る | D-120 の Revisit |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 当たる。tracked には数・位置・帳票の名前だけを書き、名称の値・金額・部門名を書いていない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 当たる。紙は日報（レジの集計）と PLU の商品別売上を別の表に置き、互いに足さない（D-025）。手動販売は紙に載せない。NULL は 0 に見せない | 34 SALES-SHEET-D2・D4 |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 当たる（後続）。WebView2 の印刷、実機のプリンタでの見え方と 1 枚に収まるか、レジスターツールの日報との値の一致は runtime の lane の L3。本 lane は docs だけで L3 は無い | Matrix の Manual |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 当たる（小）。印刷は OS のプリンタと WebView2 に依る。新しい依存は足さず、代わりの道も導入済みの plugin で作る。CI では印刷を試さない（L3） | UI_TECH_STACK §6.5.5 |

## Boundary / Wire Contract

本 lane は wire を変えない（bindings も変えない）。後続の lane が足す wire の契約を正本に書いた。

- producer: CMD-09 `get_daily_report_sheet`（42）、BIZ-05 `get_daily_report_sheet`（34 §19.3a）
- consumer: UI-09a（日次売上の `ExportBar` と紙の内容の描画）
- wire type: `DailyReportSheet { date: string, import_count: number, summary_rows / payment_rows / department_rows: DailyReportSheetRow[], label_changed_sources: DailyReportSourceKind[], plu_rows: DailySaleItem[], plu_import: { import_count: number, skipped_count: number } }`、`DailyReportSheetRow { position: number, label: string, quantity: number | null, count: number | null, amount: number | null }`。`DailyReportSourceKind` と `DailySaleItem` は既存の wire の型を使う
- internal type: IO の DB DTO `DailyReportSheetLinesRow`・`DailyReportSheetLineRow`（個数は `quantity_hundredths: Option<i64>`）。BIZ が 100 倍の整数で足してから単位の数（`f64`）に戻す（IO-07-D2）
- precision/range: 金額・件数は i64 を checked で足し、溢れは `ValidationFailed`。安全な整数の範囲での拒否はしない（1 日の取込みは数回で、1 行の金額はレジの桁に収まる。34 冒頭の「数量と単位」の (d) と同じ考え）。個数は小数 2 桁まで
- round-trip path: 取込み（`daily_report_*_lines`）→ IO の読取り → BIZ の足し算 → CMD → UI の描画 → `window.print()`。保存も往復もしない（片道）
- invalid input: 日付の形式・暦の誤り → `ValidationFailed`（§19.3 と同じ文言）。取込みが 0 件の日は error でなく `import_count = 0`
- compatibility: 新しい command を足すだけで、既存の command・DTO・DB は変えない。支払集計の合算の鍵の変更は、名称が変わらない日は今と同じ行と値。`payment_key` の列は残す

## Test Plan

Test Design Matrix: [2026-10-17-daily-report-sheet-design](test-matrices/2026-10-17-daily-report-sheet-design.md)（後続の lane が実装する test の設計。本 lane は docs の検査だけ）。

- targeted tests: 本 lane は `bash scripts/doc-consistency-check.sh` と `--target plan`、`cargo run --bin generate_traceability -- --check`、`cargo test --test design_compliance_test`（AC12）。
- negative tests: Matrix の Negative Paths（後続）。
- compatibility checks: Matrix の Compatibility Checks（名称の変わらない日の支払集計が今と同じ）。
- data safety checks: 本 lane の差分に実データ（金額・商品名・JAN・部門名・名称の値・発言の原文）を入れない（AC11）。
- main wiring/integration checks: 後続の lane（日次売上 → CMD → BIZ → IO、印刷の dialog）。
- L3（後続の runtime の lane の Human Gate の manual）: 項目ごとの到達経路・入力物・依存は Matrix の Manual。受理される入力物は、日報の取込みを済ませた開発の DB（合成の Z001/Z002/Z005 の束 2 つを同じ日に取り込んだ日を含む）と、店の実際の 1 日（店のアプリの運用の後）。

## Review Focus

- Ordinary Operation の列が、正常な条件で目的（締めの後にアプリから 1 日 1 枚の紙を印刷し、手で写す作業を無くす）を達成できるか。切替えの前後で店が迷わず、戻せるか。
- 位置と名称の組の鍵が、名称の変わった日と 1 本の中の同じ文字を含む行の両方で正しく足すか。画面の支払集計の鍵の変更が、名称の変わらない日の値を変えないか。
- 紙の行の選び方（SALES-SHEET-D3）と PLU の部分（D4）が、取り込んでいない日・売れなかった日・数えていない行を取り違えずに出すか。手動販売を載せないことが妥当か。
- 未確認の前提（P1・P2・P5）を確かめた事実のように書いていないか。手元の資料の数に版の時点が付いているか。
- 並走の lane（D-121）の節を触っていないか（AC9、所有表）。D-096・D-111・D-025 と矛盾しないか。

## Open Questions

owner に聞く見た目の問い（owner は記号か短文で答える。介入は 1 回で 2 つの decision point）。比べ方は runtime の lane の L3 で、案を実機のプリンタで印刷して並べる（owner のデザインの好み: 新案は実機で並べて見せる、色は意味がある時だけ）。答えが無い間は既定で runtime の lane を進め、L3 で並べた後に答えをもらう。

- Q1 紙の並び（UI-09a-D17）:
  - a = A4 縦 1 枚。上に日付、左の段に日計と部門、右の段に支払、下に PLU。全部の行を載せ、文字は 9 pt 以上（既定）
  - b = A4 縦 1 段。値が全部 0 の行を外し（総売・純売・現金の行は残す）、文字を 12 pt 以上に大きくする
  - c = A4 縦 2 枚。1 枚目に日計と支払、2 枚目に部門と PLU。全部の行を載せ、文字は 12 pt 以上
  - 推奨: a（confirmed ではなく candidate。行を減らさず今の紙の項目を全部残せる。字の大きさが足りなければ b か c）。答えが無いときの安全側の既定: a（紙は店の外へ渡す用も兼ねるので、行を黙って減らさない）
- Q2 紙の切替えの日（UI-09a-D19）:
  - a = 店のアプリの運用が始まり、アプリの紙と今の Excel の紙を並べて確かめた後の最初の月の初め（12 月にかかるなら元日）（既定）
  - b = 元日（次の 1 月 1 日）まで待つ
  - 推奨: a（precondition-dependent: アプリの運用の開始と並べた確かめの後）。答えが無いときの既定: a。どちらでも、切り替える日は owner が店と決める

店に聞くこと（答えが無い間は既定で進める。owner が次に店へ行くときにまとめてよい）:

- S1 紙を渡す先が、紙の並びや項目を気にするか。既定: 気にしない前提で進め、切り替える前に新しい紙を 1 枚見せて確かめる（D-120 の Revisit）。

agent 側で解く問い（設計の問いではない。runtime の lane で確かめる）: Contract Probe の P1・P2・P5。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| SALES-SHEET-D1（1 日 1 枚、完了した取込みを全部） | 34 §19.3a | runtime: `sales_service.rs`・`sales_repo.rs` | runtime（Matrix の D1 の行） | 非対象 |
| SALES-SHEET-D2（位置と名称の組で足す、NULL の伝播、100 倍の整数で足す、溢れ、並び、`label_changed_sources`、Z005 を照合しない） | 34 §19.3a、24 §14.21a | runtime: BIZ の足し算 | runtime（Matrix の D2 の行） | L3: レジスターツールの日報と値を比べる（P2） |
| SALES-SHEET-D3（載せる行、名称の空の行） | 34 §19.3a | runtime: BIZ | runtime（Matrix の D3 の行） | L3: 並びの案の比較（Q1） |
| SALES-SHEET-D4（PLU は売れた行だけ、手動販売を載せない、`plu_import`） | 34 §19.3a、24 §14.21b | runtime: BIZ・IO | runtime（Matrix の D4 の行） | 非対象 |
| SALES-SHEET-D5（失敗の順、空の日） | 34 §19.3a | runtime: BIZ | runtime（Matrix の D5 の行） | 非対象 |
| SALES-SHEET-D6（保存しない、押したときに読み直す） | 34 §19.3a、56 UI-09a-D17 | runtime: BIZ・UI | runtime（Matrix の D6 の行） | 非対象 |
| CMD `get_daily_report_sheet`（登録と bindings） | 42 §22.4・§22.8 | runtime: `sales_cmd.rs`・`lib.rs`・`bindings.ts` | runtime（command registry drift の検査、bindings の clean diff） | 非対象 |
| 24 §14.21 手順 3（支払の合算の鍵を位置と名称の組に） | 24 §14.21、34 §19.3 手順 3、pos-tables §12d | runtime: `sales_repo.rs`・`DailySalesPage.tsx` の行の key | runtime（Matrix の 14.21 の行） | 非対象 |
| IO-07-D4a（`credit` の規則を外す、正規化しない） | 29 §29.2 | runtime: `daily_report_parser.rs` | runtime（Matrix の D4a の行） | 非対象 |
| UI-09a-D17（印刷ボタンと押せない状態の文、並びの既定、表と値、知らせ、9 pt、色なし、画面に出さない） | 56 §56.1 | runtime: `ExportBar.tsx`・紙の component・hook | runtime（Matrix の D17 の行） | L3: 実機の印刷で並びと字の大きさ（Q1、P5） |
| UI-09a-D18（WebView の印刷、代わりの道） | 56 §56.1、UI_TECH_STACK §6.5.5 | runtime: 印刷の呼出しと `@media print` | 非対象（印刷の dialog は自動 test に乗らない。呼出しは spy で確かめる） | L3: Windows で dialog と A4 縦（P1） |
| UI-09a-D19（切替えの時期と確かめ） | 56 §56.1 | 運用（Coordinator と owner） | 非対象 | L3 の後の実際の 1 日（P2）と Q2 |
| UI-09a-D13（紙の用途の訂正、受入を D19 と一緒に） | 56 §56.1 | 本 lane | AC5 | 非対象 |
| D-120、D-096 の紙の行 | decision-log | 本 lane | AC7 | 非対象 |
| 隣接の除外: UI-09a-D12・D15・D16（画面の Z001・合算の表示）、D-096 の本文、24 §14.21 手順 4（部門の集約）・§14.22（月次） | 56、24、decision-log | 変えない | 既存 | 非対象 |
| 隣接の除外: 取込みの経路（37 全体、BIZ-08-D4 の同日追加の照合、45、55、29 §29.7・§29.8、pos-tables §12b・B-2、D-071 の日報の側） | D-121 の lane の正本 | 変えない（所有表） | 非対象 | 非対象 |

## Contract Probe

本 run は手元の資料の新しい集計を行っていない。前提ごとに、出典（repo 外の集計の出力、台帳、tracked の記録、code）を確かめた結果と、確かめた時点を書く。手元の資料の時点は repo 外の版の表で引いた（Z 帳票は 2026-10-14 までの写しが手元にあるが、下の数は 2026-10-04 に 2026-09-30 までの Z を数えた出力から引いた）。

- P1（Windows の WebView2 で `window.print()` が OS の印刷の dialog を出し、`@page` の A4 縦と余白が効く）: 未確認（本 run は Windows で動かしていない。出所は起草役の推測）。→ runtime の lane が実装の前に開発の build で確かめる。効かなければ UI-09a-D18 の代わりの道（HTML を既定のブラウザで開く。`tauri-plugin-opener` は導入済み: `src-tauri/Cargo.toml:25`、`src-tauri/src/lib.rs:1209`、`src-tauri/capabilities/default.json:14`、2026-10-17 に `rg` で確かめた）。
- P2（Z001・Z002・Z005 をその日の精算で足した値が、行ごとにレジスターツールの日報の値と同じ）: 店主の答えで、複数回精算してもレジスターツールの日報は合算で表示される（repo 外の回答台帳 TD-280・TD-305、2026-10-16〜17）。足すことがレジスターツールの仕様か、行ごとに同じ値かは未確認の前提（owner は「多分仕様」と述べた。推測）。取扱説明書は日計明細の精算が集計をクリアすると書く（29 §29.4.1、tracked の記録）。→ 行ごとの照合は未実測。runtime の lane の L3 で、同じ日に 2 回以上精算した日を含む実際の日に比べる。違えば D-120 の Revisit。
- P3（同じ位置の名称が同じ日の精算の間で変わるのは稀）: 手元の Z 帳票の 2026-09-30 版での集計（2026-10-04 に数えた repo 外の出力 `recount-2026-10-04/z_rc.out` の N3・N8 の行、日の数は同じ数え直しの報告の z N2、2026-10-17 に読んだ）で、Z002 の名称の並びは全期間で 3 種類（139 本・2 本・1 本。1 本は Excel で保存し直した形）、Z005 は 2 種類（140 本・2 本）。変わったのは 2022 年の 1 日の精算の間（Z002 の 3 つの位置、Z005 の 4 つの位置）だけで、同じ日に 2 回以上精算した 19 日のうち 1 日。→ 観測（数と位置だけ）。並び順だけの鍵では、その日に別の行を足す。
- P4（意味の鍵の実データの当たり方）: 同じ集計で、`総売` を含む名称は Z001 の 1 行目だけ（142/142 本）、`純売` は 2 行目だけ、`現金` は Z002 の 1 行目だけ（142/142）、全角の `クレジット` は 0 行、半角の `ｸﾚｼﾞｯﾄ` を含む名称は Z002 の 4 つの位置に全本（ほかに 2022 年の 2 本で 1 つの位置）。Z002 の 39〜50 行目は全本で名称が空で値が 0。→ 観測。`credit` の規則を外しても実データの鍵は変わらず、正規化すると 1 本の中の 4 行が同じ鍵になる。
- P5（既定の並び〈案 a〉が、PLU の行が少ない日に A4 縦 1 枚に 9 pt で収まる）: 未実測（出所は起草役の見積り: 名称のある行は Z001 28・Z002 38・Z005 21〈2026-09-29 版の店の Excel の写しでの数。repo 外の事実の一覧 F-158、`docs/project-memory.md` の締めの Excel の行も同じ数〉で、左の段 49 行・右の段 38 行）。→ runtime の lane の L3 で実機の印刷で確かめる。収まらなくても字を小さくせず次の紙へ続ける（UI-09a-D17）。
- P6（Z004 の取込みは停止 ADR が止めている）: `docs/adr/2026-09-23-legacy-stocktake-z004-write-stop.md`、32 §15.0・35 §20.0 の「現行buildの一時停止」の見出し（2026-10-17 に `rg` で在ることを確かめた。本文の読みは 2026-10 の見直しの突き合わせ O-19 の引用に依る）。→ 記録。PLU の部分は停止を外す lane までは「取り込まれていません」と出る。
- P7（紙は店の控えと店の外へ渡す用を兼ねる）: `docs/project-memory.md` の日報の紙の行（店主の回答 2026-09-29）。→ 回答。UI-09a-D13 の旧い記述を直した根拠。

## Data Safety

- tracked に書かない: Z 帳票・日報・EJ の中身、名称の値（帳票の総称〈総売・純売・現金・クレジット〉は IO-07 がすでに鍵の導き方として書いている語だけ）、金額・商品名・JAN・部門名、店主・owner の発言の原文、repo 外の台帳・突き合わせの本文。数・位置・帳票の名前と、台帳の ID だけを書いた。
- local-only: repo 外の回答台帳、2026-10 の見直しの事実の一覧と突き合わせ、手元の Z 帳票とその集計の出力、版の表。
- synthetic-only: 後続の lane の test は合成の Z001/Z002/Z005 の束と合成の商品だけを使う。L3 の店の実際の日の紙の写真・PDF を commit しない。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。
