# Plan Packet: 日報（Z001 / Z002 / Z005）取込みの穴（小数の個数、別の精算の混在、レコード列の対応）（R3）

2026-10-04 起草。起点は `76de30d8`（main）。出典は owner の lane の選択（TD-104、2026-10-04: A〈Z004 取込みの穴〉・D〈EJ 文法〉・E〈独自コード採番〉を並走、B〈本 lane〉→ C〈Z001 の表〉は直列）と、持ち帰りデータの見落としチェック（2026-10-04、repo 外の報告。設計正本との突合せの H2、Z 帳票の N2・N3）、`docs/backlog.md` の既存の項目「部門キーで小数の数量を売った日は、日報の取込みがその日全体で失敗する」。

本 lane は wave（2026-10-04 起票、lane A〜E）の lane B。並走の A・D・E と file の所有を分ける（下の「共有 file の所有」）。後続の lane C（Z001 の表、設計は PR #114 で済み）は本 lane の merge の後に同じ file（`daily_report_parser.rs`・sales 系・bindings）を触る。C の前提（`docs/function-design/56-ui-daily-sales.md` の UI-09a-D16）を本 lane で壊さない。D16 の補正（`—` が出ない、2 枚目がほぼ 0、99 行）は C の持ち場で、本 lane は触らない。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

実装後の状態はPR native state / 専用record / CIが所有し、trackedに書かない。

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（`subagent_type: writer`、worktree は本 lane のもの、branch `agent/daily-report-import-gaps`）
- Plan Reviewer: Opus 5.5（fresh `subagent_type: reviewer`）+ Codex（GPT-6 Astra。`.local/codex-orders/MODEL-SELECTION.md` の表の「データの安全〈migration〉」の行）。互いに独立で Writer と別 context
- Final Reviewer: Fable 5.1（fresh subagent）+ Codex（GPT-6.1 Sol）。互いに独立で Writer・Plan Reviewer と別 context。後の reviewer に先の結果を見せない
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/daily-report-import-gaps

Final Review Minimum は規則どおり 1: R4 でなく、予定の path に `scripts/ci/classify-changes.sh` が `workflow=true` と判定する path が無い（下の Risk の classifier の出力）。Final Reviewer は運用で 2 本（Claude 側 + Codex）を回す。Human Gate に manual を足さない理由: 画面の code（`src/**`）を変えず、利用者に新しく見えるのは既存のエラーの表示枠に出る 1 つの文（BIZ-08-D2、自動 test で文字列を固定）と、小数の日に既存の表に出る `1.3` の形の値（既存の `toLocaleString` を通るだけ）で、L3 Eligibility の (1)「Windows / Tauri native でしか観測できない」に当たる項目が無い。

遷移記録（各遷移の条件はその commit より前に揃っている。遷移の key を重複させない）:

- kickoff → spec-check（2026-10-04、起草役）: owner の lane の選択（TD-104）。Risk = R3 を記録（下の Risk）。
- spec-check → design（2026-10-04、起草役）: 設計正本（IO-07 §29.2〜§29.5、BIZ-08 §37.2〜§37.7、pos-tables §12c・§12e・B-2、BIZ-05 §19.2、IO の repo §14.21・§14.22、MNT-03）が小数の個数・精算回数の照合・「レコード」列の意味を決めておらず、実物と食い違う（§29.4.1 の行コード）。`docs/DEV_WORKFLOW.md` Design artifact selection の「BIZ / IO の振舞い」「table / column / migration」「CSV の形の互換」「durable な選択（decision-log）」の行に当たるので design を通す。
- design → plan-draft（2026-10-04、起草役、本 commit）: design の出力 = IO-07-D2〜D4、BIZ-08-D2、MNT-03-D12、[D-104](../decision-log.md#d-104-日報の小数の個数別の精算の混在レコード列の対応2026-10-04) と、各正本の型・手順・表の更新（下の Design Readiness）。同じ plan-first の commit に置く。未解決の設計の問いは無い（owner の判断を待つ事項も無い。下の「判断点」）。packet と Test Design Matrix を同じ commit に置く。
- plan-draft → plan-gate（2026-10-04、Coordinator）: packet と Test Design Matrix は plan-first commit `ffb42112` で揃い、doc check（`--target plan` と full）は Coordinator の再実行でも exit 0。Plan Reviewer の Codex を表の当てはめ（migration v7 を含む）で GPT-6 Astra に直した。
- plan-gate（round 1 の是正、2026-10-04、起草役、本 commit）: Plan Review round 1 は Opus reject（P2 1・P3 4）・Codex reject（P1 1・P2 7）。Coordinator の裁定、相談役の反例探し、owner 決定 TD-110・TD-111 を反映した。Plan Commit は pending のまま。
- plan-gate（round 2 の是正、2026-10-04、起草役、本 commit）: round 2 の是正（Review Response 参照）。Plan Commit は pending のまま。

## Owner Effort Budget

- 介入回数上限: 6（既定、D-098）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 3（2026-10-04: 起票の判断〈TD-104、本 lane を含む lane の選択〉、Plan Review round 1 の精算回数の扱い〈TD-110: 精算回数を読めたファイルどうしは比べ、読めないファイルの出所は確かめない。TD-111: 読めないファイルを含む束での別の精算の混入の見逃しを受容リスクとする〉。予備 2 のうち「Plan Review で owner の製品判断が要る指摘」を使った） | 3（plan-approved 1、Ready 1、merge 1） | 0（Final Review の指摘の裁定で owner が要ると上限を超える。`docs/DEV_WORKFLOW.md` `Owner Effort Budget` の上限に届くときの扱いに従う） | 6 = 3 + 3 + 0 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。介入は decision point 単位で数え、1 回の問い合わせで複数を得てもその数だけ数える。relay（Codex の起動の往復）は上限に数えない。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
owner の実働の見込みは、plan-approved の依頼の読み 5 分、Ready と merge の判断 5 分（未実測）。

## Risk

Risk: R3

Reason:
POS の日報 CSV（Z001 / Z002 / Z005）の受理の契約（小数の個数、精算回数の照合、「レコード」列の扱い）、DB の列（`quantity` → `quantity_hundredths` の改名と既存値の 100 倍、migration v7）、Tauri command の DTO の field の型（`quantity` を `i64` → `f64`）を変える。`docs/DEV_WORKFLOW.md` Risk Tiers の「DB, POS CSV, Tauri command DTO」に当たる。R4 でない理由: migration は値を捨てず（100 倍は ÷100 で戻せる）、表を作り直さず、backup / restore・実データの公開・secret に触れない（先例: migration v6 の backfill は R3、`docs/archive/plans/2026-08-25-supplier-management-impl.md`）。
classifier の出力（2026-10-04、起草役）: `printf '%s\n' docs/function-design/29-io-daily-report-parser.md docs/db-design/pos-tables.md docs/architecture/io-task-specs.md docs/decision-log.md docs/plans/2026-10-04-daily-report-import-gaps.md src-tauri/src/io/daily_report_parser.rs src-tauri/src/db/schema_v7.rs docs/inventory_system_erd.html src/lib/bindings.ts | bash scripts/ci/classify-changes.sh --files-from-stdin` → `rust=true`・`rust_drift=true`・`frontend=true`・`docs=true`・`env=false`・`generated=true`・`traceability=true`・`workflow=false`・`unknown=false`。required gate の green / red の判定式が変わるか: 変わらない（gate の定義・classifier・helper を触らない。製品の code と test が変わるだけ）。

## Goal

Goal Invariant:

### 最小完了条件

- 部門キーで小数の数量（小数 2 桁まで）を打った日の Z001 / Z002 / Z005 を選ぶと、その日の日報が取り込め、日次売上の公式の部門別集計と月次の公式の部門集計に、レジと同じ小数の個数（例 `1.3`）が出る。整数の日の取込みと表示は今までと同じ値になる。
- 3 本とも精算回数を読める束（通常の layout A）で、同じ日の別の精算の Z001 / Z002 / Z005 を混ぜて選ぶと、取込みが止まり、選び直し方が分かる文（BIZ-08-D2）が出る。同じ精算の 3 つを選び直せば取り込める。読めないファイルの出所は確かめない（TD-110・TD-111 の受容リスク）。
- 「レコード」列（行の位置）の値で支払・総売・純売の鍵が決まらない。Z002 の 3 行目（`0003`）がクレジットでない行は `credit` にならない。
- 既存の DB の日報の個数は、migration v7 の後も画面で同じ値に見える。

### 失敗定義

- 小数の日の取込みが失敗したままか、個数が丸められた・NULL になった値で保存される。
- 3 本とも精算回数を読める束（通常の layout A）で別の精算のファイルの混在が黙って取り込まれる、または同じ精算の正しい 3 ファイル（layout A の束、layout B の束）が止まる。読めないファイル（layout B の Z002 / Z005 のように精算回数の行を持たないファイル）を含む束での別の精算の混入の見逃しは失敗に数えない（読めないファイルの出所は確かめない。TD-110・TD-111 の受容リスク）。
- 既存の日報の個数が migration の後に 100 倍・1/100 で見える。月次の部門集計の個数に浮動小数の誤差が出る。
- 後続の lane C の前提（UI-09a-D16: 数は `toLocaleString`、Z001 の行は合算しない、`quantity` か `count` の一方）が崩れる。
- `src/**` の画面の code、Z004 / EJ の parser、S4 / S7 で列挙した型（wire の DTO `DailyReportDepartmentLinePreview`・`OfficialDailyDepartmentLine`・`OfficialMonthlyDepartmentTotal` と cache の型 `CachedDailyReportSummaryLine`・`CachedDailyReportDepartmentLine`・`CachedDailyReportPreview`）と S1 / S6 の IO の型（`DailyReportSummaryLine`・`DailyReportDepartmentLine`・`NewDailyReportSummaryLine`・`NewDailyReportDepartmentLine` と日次・月次の DB DTO）以外の DTO に diff が出る。

### 非目的

- 精算回数を保存・表示すること（backlog「layout A のプリアンブル（精算回数…）」）。日計（Z001）の表（lane C）。
- Z004・EJ の小数の数量（単位の拡張の lane、lane D）。在庫の単位の換算。
- 既存の支払集計（Z002）の合算の潜在バグ（backlog の独立の項目）。日付の不一致だけの文の改善。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| その日、部門キーで `1.3` の数量を打って精算した。精算の後に SD → CV17 → `EcrDatas` へ取り込んだ（通常の手順） | 日報取込みで同じ精算の Z001 / Z002 / Z005 を選び、プレビューを見て取り込む | 取込みが完了する。日次売上の「部門別集計（Z005）」のその部門の数量が `1.3 点`、月次の公式の部門集計の数量に `1.3` が足される | 次の日も同じ手順 | 今の parser では失敗する（Contract Probe P1）。小数の形は 1 桁（P4）、レジは 2 桁まで（取扱説明書 p.25・p.154） |
| 同じ日に 2 回精算した。`EcrDatas` に `Z001_{日} _0001` と `Z001_{日}A_0002` 等が並ぶ（3 本とも layout A で、精算回数を読める） | 1 回目の Z001 と 2 回目の Z002 / Z005 を混ぜて選ぶ | プレビューに進まず、BIZ-08-D2 の文が出る。何も保存されない | ファイル名の `Z00k_` より後ろがそろった 3 つを選び直すと取り込める（2 回目は既存の同日追加の確認、SPEC-SDI。名前の後ろが同じ 3 本は手元の全期間で同じ精算、P5） | 今は黙って取り込める（P2）。同じ精算の 3 本は精算回数が一致し、3 帳票の精算回数は一緒に進む（P3、手元の全期間は Coordinator が確認、D-104 Guarantee range）。読めないファイルを含む束の混入は止めない（TD-110・TD-111 の受容リスク） |
| 整数だけの日 | 今までどおり取り込む | 今までと同じ値で取り込まれ、同じ表示になる | — | — |
| 本 lane の版へ更新する前に日報を取り込んだ DB | アプリを起動する | 起動時に migration v7 が走り、日次・月次の部門の数量は更新前と同じ値で見える | — | SQLite の `RENAME COLUMN` が同梱の版で使える（P7） |
| layout B（エクスポート機能）の束 | 取り込む | 今までどおり取り込める（精算回数を読めるのが Z001 だけなら比べない、IO-07-D3） | — | layout B のメタの精算回数は未確認（P9） |

本 lane で利用者の目的（毎日の日報の束を、実データの形で失敗させず、3 本とも精算回数を読める束〈通常の layout A〉では別の精算を混ぜずに取り込む）は閉じる。読めないファイルの出所は確かめない（TD-110・TD-111 の受容リスク）。精算回数を画面に出すこと、日計（Z001）の表は別 lane。

## 起票時実測（2026-10-04、`76de30d8`）

| # | 対象 | command | 出力 | 扱い |
|---|---|---|---|---|
| 1 | 行コードの比較 | `rg -n 'code == "(101\|201\|01\|03)"' src-tauri/src/io/daily_report_parser.rs` | 4 行（`:495`・`:497`・`:505`・`:507`）、exit 0 | S3 で 0 行にする（AC3） |
| 2 | 旧い列名を読む SQL | `rg -n 'l\.quantity\b' src-tauri/src/db/sales_repo.rs`（`\b` で `l.quantity_hundredths` に当たらない。round 1 の是正で式を直し、2026-10-04 に `d37767a8` で測り直した） | 2 行（`:1104`・`:1239`）、exit 0 | S6 で 0 行にする（AC5） |
| 3 | migration v7 の登録 | `rg -c 'schema_v7' src-tauri/src/db/migration.rs` | 出力なし、exit 1 | S5 で登録する（AC5） |
| 4 | 精算回数の照合 | `rg -n 'settlement_mismatch' src-tauri/src` | 出力なし、exit 1 | S2 で足す（AC2） |
| 5 | 新しい文の衝突 | `rg -F '別の精算' src src-tauri` | 出力なし、exit 1 | 衝突なし |
| 6 | 汎用の文を見る FE test | `rg -n '日報ファイルの解析に失敗しました' src --glob '*.test.*'` | 出力なし、exit 1 | FE の test は変えない |
| 7 | 既存の targeted test | `CARGO_TARGET_DIR=$TMPDIR/laneb-target cargo test --manifest-path src-tauri/Cargo.toml --lib daily_report` | 下の「targeted test の baseline」 | AC6 |

targeted test の baseline: 起票時に実行した要約行を [Matrix](test-matrices/2026-10-04-daily-report-import-gaps.md) の「Baseline」に貼る（本数は AC にしない）。

## 設計判断（Plan Review で覆せる。正本は IO-07-D2〜D4・BIZ-08-D2・MNT-03-D12・D-104）

- 個数の表し方: 100 倍の整数（`quantity_hundredths`）を IO・BIZ・DB で運び、wire だけ単位の数（`f64`）にする。却下: REAL（`SUM` の誤差）、TEXT（`SUM` できない）、四捨五入、NULL、wire も 100 倍（D16 と既存の表示が壊れる）、列名を変えない（古い SQL が黙って 100 倍）。理由と全文は IO-07-D2・D-104。
- 件数の列は整数のまま（小数は `invalid_number`）。Z001 の第3列は総売の行だけ個数、他は件数という既存の振り分け（§29.4.1）を変えない。
- 精算回数: 読めたファイルが 2 本以上なら一致を求める。1 本以下なら比べない（layout B の束を止めない）。読めないファイルの出所は確かめず、それを含む束での別の精算の混入の見逃しは受容リスク（owner 決定 TD-110・TD-111）。精算回数は保存しない（IO-07-D3）。
- 利用者向けの文: `settlement_mismatch` があるときだけ固定の文（BIZ-08-D2）。raw detail は出さない（BIZ-08-D1）。
- 鍵はラベルだけで決め、コードの比較を消す（IO-07-D4）。
- migration v7 は Custom の 1 transaction で範囲検査 + 改名 + 100 倍 + 件数・型・合計（÷100 の合計と余り）の検証（MNT-03-D12、22 §15）。v4 の CREATE 文は書き換えない。

## 判断点

- owner の判断を待つ事項: なし。小数の表し方・精算回数の比べ方・鍵の決め方・文の言い回しは技術と設計の選択として本 packet と正本で決め、却下案を正本に書いた。Plan Review で製品の振舞いに当たると判定されたら、予備の介入で owner に諮る。
- 参考（owner の判断にしない、follow-up）: 部門別集計の数量の単位の字 `点` が長さの部門の `1.3` に付く（`1.3 点`）。既存の表示の言葉で、本 lane は変えない（下の follow-up）。

## Scope

実装の PR（plan-approved の後、Writer）で変える file と目的。設計正本は本 plan-first の commit で更新済み。

- S1 IO-07 の小数の個数（IO-07-D2）: `src-tauri/src/io/daily_report_parser.rs` — Z001 の総売の行の第3列と Z005 の第3列を小数 2 桁までの 100 倍の整数で読む関数、`DailyReportSummaryLine` / `DailyReportDepartmentLine` の `quantity` → `quantity_hundredths`、件数は整数のまま、`quantity_hundredths_to_units` を足す。
- S2 IO-07 の精算回数（IO-07-D3）: 同 file — ヘッダより前の「精算回数」の行を読み、読めたファイルが 2 本以上で違えば `settlement_mismatch`。日付の判定は変えない。
- S3 IO-07 の鍵（IO-07-D4）: 同 file — `summary_line_key` / `payment_key` からコードの比較を消し、ラベルだけで決める（関数の引数の `code` も消してよい）。
- S4 BIZ-08（BIZ-08-D2、§37.2）: `src-tauri/src/biz/daily_report_import_service/mod.rs`（`DailyReportDepartmentLinePreview.quantity: Option<f64>`、`CachedDailyReportSummaryLine.quantity_hundredths`、`CachedDailyReportDepartmentLine` を新設し `CachedDailyReportPreview.department_lines` の型にする）、`parse.rs`（preview は `quantity_hundredths_to_units` で、cache は 100 倍のまま。`settlement_mismatch` があれば BIZ-08-D2 の文を message と `operation_logs.summary` に）、`commit.rs`（cache の 100 倍をそのまま保存）。
- S5 migration v7（MNT-03-D12）: `src-tauri/src/db/schema_v7.rs`（新設、`apply_v7_daily_report_quantity_hundredths`。22 §15 の手順 1 の範囲検査、手順 2 の件数と合計、手順 6 の検証 (a)〜(c)）、`src-tauri/src/db/migration.rs`（登録と migration の test。v6 までを数える既存の test の期待値の追従）、`src-tauri/src/db/mod.rs`（`mod schema_v7;`）。
- S6 IO の repo（24 §14.15・§14.21・§14.22）: `src-tauri/src/db/sales_repo.rs` — `NewDailyReportSummaryLine` / `NewDailyReportDepartmentLine` の field と INSERT 文、日次の部門の aggregate の SELECT と DB DTO、月次の `SUM(l.quantity_hundredths)` と DB DTO。値は 100 倍のまま返す。
- S7 BIZ-05（34 §19.2）: `src-tauri/src/biz/sales_service.rs` — `OfficialDailyDepartmentLine.quantity` / `OfficialMonthlyDepartmentTotal.quantity` を `Option<f64>` にし、写像で `quantity_hundredths_to_units` を呼ぶ。
- S8 呼出し側と test の追従: `src-tauri/src/cmd/sales_cmd.rs`（test の INSERT の field 名）、`src-tauri/src/cmd/daily_report_import_cmd.rs`（test の `CachedDailyReportPreview` の組立て。型が変わるときだけ）、`src-tauri/src/biz/daily_report_import_service/tests.rs`、`sales_repo.rs` / `sales_service.rs` / `migration.rs` / `daily_report_parser.rs` の test（新しい test は Matrix、既存 test の追従の範囲は Matrix の Compatibility Checks）。`src-tauri/tests/import_internal_contract_test.rs`（`test_import_internal_contract_req401_is_minimal` の IO-07-D2 の遷移 pin。plan 側の commit〈round 1 の是正〉で Rust の field = `quantity`、29 §29.2 の Markdown = `quantity_hundredths` を別々に pin した〈先例 `f7b0e1cf` → `1f5c1afd`〉。実装 PR で Rust の改名と同時に単一 pin `quantity_hundredths` へ戻す）。`src-tauri/src/db/schema_v2.rs` の test（`:378`・`:586`・`:596`・`:601` の最新版・版件数 6 の固定を v7 に追従させる）。
- S9 生成物・図: `src/lib/bindings.ts`（`cd src-tauri && cargo run --bin generate_bindings` で再生成。型は `number` のままで diff 0 の見込み）、`docs/function-design/90-traceability.md`（REQ 付きの test を足すので `cargo run --bin generate_traceability` で再生成）、`docs/inventory_system_erd.html`（2 表の `quantity` → `quantity_hundredths`。現行 schema の図のため実装の PR で直す）。

呼出し側の確認（2026-10-04、起草役）: `rg -n "daily_report_(summary|department)_lines" src-tauri/src` の SQL の読み手は `sales_repo.rs` の INSERT 2 つ・日次の aggregate・月次の集計と test、`migration.rs` の test だけ。`seed_demo` は日報の行を作らない（`rg -n daily_report src-tauri/src/seed_demo.rs` 出力なし）。FE は `quantity` を `toLocaleString` で出すだけ（`src/features/daily-sales/DailySalesPage.tsx:221`、`src/features/monthly-sales/MonthlySalesPage.tsx:194`）で、取込みの画面は部門の数量を出さない（`rg -n quantity src/features/daily-report-import --glob '!*.test.*'` 出力なし）。

### 共有 file の所有（wave の 4 lane 並走、D-055）

| file | 本 lane（B）の持ち場 | 他 lane | 衝突の解き方 |
|---|---|---|---|
| `docs/decision-log.md` | 末尾に D-104 の 1 件だけ | A = D-103、D = D-105、E = D-106 を末尾に追記 | 末尾への追記は merge 順で両方を残す |
| `docs/db-design/pos-tables.md` | §12c・§12e（日報の数量の列）と B-2（日報取込み） | A は Z004 の clear 行・空スロットの節だけ。D・E は触らない | 節が分かれる |
| `docs/function-design/22-mnt-migration.md`・`src-tauri/src/db/migration.rs`・`src-tauri/src/db/mod.rs` | §3.1 の一覧の 1 行と末尾の §15、migration v7 の登録 | 起票時点で他 lane の migration の予定は無い（本 lane が **schema version 7 と MNT-03-D12 を予約**する） | 他 lane が migration を足すなら v8 以降・MNT-03-D13 以降で採番する（`docs/DEV_WORKFLOW.md` Review Rules の連番 registry） |
| `src/lib/bindings.ts`・`docs/function-design/90-traceability.md` | 再生成（bindings は diff 0 の見込み） | 他 lane も再生成しうる | 手で解かず、取り込んだ後に再生成する（D-098） |
| `src-tauri/src/io/daily_report_parser.rs`・`sales_repo.rs`・`sales_service.rs`・`docs/function-design/34-biz-sales-service.md`・`24-io-csv-import-repo.md` | 本 lane | lane C が本 lane の merge の後に触る（TD-104 の直列） | C は本 lane の merge 後の main から始める。34 §19.2 の `OfficialDailySummaryLine.quantity: Option<f64>` と 24 §14.21 手順 6 の `quantity_hundredths` は本 lane が書き、C が実装する |
| `docs/adr/` の stocktake / EJ の ADR、`docs/project-memory.md`、`docs/backlog.md`、`Plans.md`、`docs/PROJECT_HANDOFF.md` | 触らない | どの lane も触らない | backlog の該当項目は closeout で消す。PM:246 の「Z002 と Z004 には出ない」の古さは follow-up |

## Non-scope

- 精算回数の保存と表示、ファイル名の表示（backlog「layout A のプリアンブル」の項）。
- 日計（Z001）の表と UI-09a-D16 の補正（lane C）。`src/**` の画面の code。
- Z004（`z004_parser.rs`、lane A と単位の拡張の lane）と EJ（`ej_parser.rs`、lane D）の小数。
- 既存の支払集計（Z002）の合算の潜在バグ（backlog の独立の項目。鍵の決め方の変更は本 lane の S3 の範囲〈コードの比較を消す〉に限る）。
- 半角の `ｸﾚｼﾞｯﾄ` を `credit` にすること（IO-07-D4 に理由。実データの Z002 では半角の `ｸﾚｼﾞｯﾄ` を含む行が 1 本に複数あり、`credit` にすると支払の集約が別の行を 1 行に足す。`credit` を読む業務の処理は無く、今の `payment_N` のままなら合算は起きない。鍵の作り直しは上の Z002 の合算の項目と一緒に行う）。
- 日付の不一致だけの文（`invalid_date`）の改善、Excel で保存し直した形の文書化。
- 部門別集計の数量の単位の字（`点`）の見直し。
- `docs/project-memory.md`・`docs/backlog.md`・ADR の更新（closeout と follow-up）。

## Acceptance Criteria

baseline は main `76de30d8`（本 branch の plan 側の親）で、同じ command を 2026-10-04 に起草役が実行した実測（上の「起票時実測」）。test は全 PASS を求め、本数を AC にしない。

- AC1（S1、IO-07-D2）: Matrix の T1〜T5 が PASS（`cd src-tauri && cargo test --lib daily_report`）。小数 1 桁・2 桁・負・カンマ付きが 100 倍の整数になり、3 桁・`.5`・`1.` と件数の小数が `invalid_number`。`quantity_hundredths_to_units(130)` が `1.3`。
- AC2（S2、IO-07-D3）: Matrix の T6〜T9 が PASS。精算回数の違う束が `settlement_mismatch`、同じ束と layout B の束（`test_parse_daily_report_req401_layout_b_concatenated_shape_supported`、assert の意味を変えず field 名と値の 100 倍だけ直して PASS）が通る。`rg -n 'settlement_mismatch' src-tauri/src` が 1 行以上（baseline: 出力なし、exit 1）。
- AC3（S3、IO-07-D4）: `rg -n 'code == "(101|201|01|03)"' src-tauri/src/io/daily_report_parser.rs` が出力なし・exit 1（baseline: 4 行、exit 0）。Matrix の T10・T11 が PASS。
- AC4（S4、BIZ-08-D2）: Matrix の T12〜T14 が PASS。`settlement_mismatch` の束で `BizError::ImportError` の message と `operation_logs.summary` が BIZ-08-D2 の文と完全一致し、`daily_report_imports` が 0 行。既存の `test_daily_report_req401_parse_error_logs_parse_failed`（汎用の文）が変えずに PASS。
- AC5（S5・S6、MNT-03-D12、pos-tables §12c・§12e）: Matrix の T15〜T18（T15b を含む）が PASS。`rg -n 'l\.quantity\b' src-tauri/src/db/sales_repo.rs` が出力なし・exit 1（baseline: 2 行、exit 0。`l.quantity_hundredths` / `SUM(l.quantity_hundredths)` には当たらないことを置換した写しで確かめた）。`rg -c 'schema_v7' src-tauri/src/db/migration.rs` が 1 以上（baseline: 出力なし、exit 1）。
- AC6（S7、§19.2）: Matrix の T19・T20 が PASS（日次・月次の wire の `quantity` が `Some(1.3)`、整数の日が `Some(4.0)`）。`cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test` が exit 0。
- AC7（S9、wire の互換）: `cd src-tauri && cargo run --bin generate_bindings` の後 `git diff --exit-code -- ':(top)src/lib/bindings.ts'` が exit 0（`src-tauri` を cwd にしても repo の root から引く）（`quantity: number | null` のまま）。差分が出たら Boundary の範囲（field の型が `number` のまま）か確かめ、外れるなら止めて Gated Amendment。`cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0。
- AC8（FE の回帰なし）: `npm run generate:routes && npm run typecheck && npm run lint && npm test` が exit 0（FE の file を変えない）。先頭の `generate:routes` は、`.npmrc` の `ignore-scripts=true` で `pretypecheck` が走らず、fresh checkout に `routeTree.gen.ts` が無いと typecheck が失敗するため。CI と同じ順（`.github/workflows/ci.yml:350` の `npm run generate:routes` → `:353` typecheck → `:356` lint → `:364` `npm test`、`scripts/local-ci.sh:227`〜`:231` も同じ順）。
- AC9（Goal の実データの確かめ、local-only）: Contract Probe の P1・P2 の scratch の probe を、実装後の `daily_report_parser.rs` の写しで再実行し、2026-09-29・09-30 の束が `ok=true`、P2 の混在の束が `settlement_mismatch` で止まり、9 月の他の束が `ok=true` のまま（出力は束の鍵・成否・error_type・行番号だけ。tracked に入れない。PR body に結果の行だけを書く）。baseline: 09-29・09-30 が `ok=false`（`invalid_number:Some(Z001):lineSome(9)`・`invalid_number:Some(Z005):lineSome(12)`）、混在の束が `parser_ok=true`。
- AC10（docs）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が exit 0。

## Design Readiness

- 引用する設計正本（節まで）: `docs/function-design/29-io-daily-report-parser.md` §29.2（型）・IO-07-D1〜D4・§29.3 手順 6・§29.4.1・§29.5、`docs/function-design/37-biz-daily-report-import-service.md` §37.2・§37.3 手順 3〜4（BIZ-08-D1・D2）・§37.7、`docs/db-design/pos-tables.md` §12c・§12e・B-2 Stage 2、`docs/function-design/34-biz-sales-service.md` §19.2、`docs/function-design/24-io-csv-import-repo.md` §14.21 手順 4・6、§14.22 手順 2、`docs/function-design/22-mnt-migration.md` §3.1・§15（MNT-03-D12）、`docs/architecture/io-task-specs.md` §IO-07、`docs/architecture/biz-task-specs.md` §BIZ-08、`docs/decision-log.md` D-104。
- 必要な設計成果物: BIZ / IO の振舞い = updated in this PR（IO-07、BIZ-08、BIZ-05、IO の repo）。DTO / wire = updated in this PR（§37.2・§19.2 と Boundary）。table / column / migration = updated in this PR（pos-tables・MNT-03）。CSV の形の互換 = updated in this PR（§29.4.1・Boundary）。durable な選択 = updated in this PR（D-104）。画面 = existing sufficient（UI-09a-D16 と既存の部門別集計は `toLocaleString` で数を出し、型は `number` のまま）。
- plan にしかない durable な判断の昇格先: なし（上の「設計判断」はすべて正本と D-104 にある）。
- 前提・制約と、延期した design gap の follow-up: layout B のメタの精算回数は未確認（IO-07-D3 の「1 本以下なら比べない」で止めない側に倒した。Revisit は D-104）。精算回数の保存・表示、`点` の字、PM:246 の古さ、日付の不一致の文は follow-up（下の Review Focus の後の follow-up）。
- 絶対保証の自己点検: 「混在は止まる」は 3 本とも精算回数を読める束（通常の layout A）に限り、読めないファイルの出所は確かめない（owner 決定 TD-110・TD-111 の受容リスク）と Goal・失敗定義・IO-07-D3・D-104 Guarantee range・BIZ-08-D2 に書いた。「既存の値は同じに見える」は v7 の範囲検査（100 倍で `i64` を溢れる値は変換前に止める）と、件数・型・÷100 の合計と余りの検証で、NULL と負を含めて確かめる（MNT-03-D12、T15〜T17）。「件数は整数」は件数の小数で止まる（黙って通さない）。
- 判定: ready。未解決の設計の問い・owner 判断待ちは無い。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 | 本 lane |
|---|---|---|
| Tauri command の DTO の field の型 | `cargo run --bin generate_bindings` で再生成し diff を確かめる | S9・AC7（diff 0 の見込み） |
| migration の追加 | `migration.rs` の migrations() に v7 を登録、`db/mod.rs` に `mod schema_v7;`、22 §3.1 の一覧と §15 | S5（22 は本 commit で済み） |
| IO-07 に `pub fn` を足す | `src-tauri/tests/design_compliance_test.rs` は `29-io-daily-report-parser.md` と `io::daily_report_parser` を対応づける。新しい `pub fn quantity_hundredths_to_units` のシグネチャは §29.2 の IO-07-D2 に記載済み | S1 |
| REQ 付きの test の追加 | `cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成 | S9・AC7 |
| 現行 schema の図 | `docs/inventory_system_erd.html` の 2 表の列名 | S9 |
| route・operator 画面・function-design doc の新設 | 該当なし | — |

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 当たる。精算回数・「レコード」列・小数の書式は CASIO adapter（IO-07）の中で閉じ、app core には 100 倍の整数の個数と `settlement_mismatch` の error_type だけを出す。wire は単位の数 | IO-07-D2〜D4 |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 当たる。事実 = 小数 1 桁の形、精算回数の行、ファイル名の形、「レコード」列は行の位置（Contract Probe）。決定 = 100 倍の整数、比べ方、鍵（D-104） | Contract Probe、D-104 |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 当たる。混在で止まった後は選び直して再試行（何も保存しない）。migration は 1 transaction で失敗時は rollback、再起動で再試行。既存の同日追加・bundle_hash の重複判定は変えない | MNT-03-D12、Matrix T13・T15〜T18 |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 当たる。`EcrDatas` から 3 つ選ぶ通常の手順のまま。選び間違えたときの文だけが増える | BIZ-08-D2、Ordinary Operation |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 当たる。レジが変われば IO-07 を差し替え、`quantity_hundredths` と `settlement_mismatch` の契約は残る | IO-07-D2・D3 |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 当たる。実データは scratch の probe で成否・行種・行番号だけを出し、tracked に件数・値を書かない。fixture は合成 | Data Safety、AC9 |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 当たる。小数の個数は部門売りで在庫に効かない（換算しない）。月次の `SUM` は 100 倍の整数で誤差なし。別の精算の混在は総売・支払・部門の不一致の行を作るので止める | pos-tables §12e、Matrix T18・T20 |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 該当なし。画面の code を変えず、Windows native でしか見えない項目が無い。実データの確かめは AC9（local-only の probe） | — |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 当たる（小）。`RENAME COLUMN` は同梱の SQLite（`libsqlite3-sys` 0.28.0 = 3.45.0、`rusqlite` の `bundled`）に依り、OS の SQLite に依らない | Contract Probe P7 |

## Boundary / Wire Contract

- producer: IO-07（CP932 の Z001 / Z002 / Z005）→ BIZ-08 / BIZ-05 → CMD（Tauri command の DTO）。
- consumer: 日報取込みの画面（preview の `department_summary`、数量は出さない）、日次売上の公式セクション（`OfficialDailyDepartmentLine.quantity`）、月次売上の公式の部門集計（`OfficialMonthlyDepartmentTotal.quantity`）、後続 lane C の `OfficialDailySummaryLine.quantity`。
- wire type: `quantity: number | null`（TypeScript、変わらない）。Rust の DTO の field は `Option<i64>` → `Option<f64>`。JSON は `1.3`、整数は `4.0`（JS では `4`）。
- internal type: IO・BIZ の cache・DB の DTO は `quantity_hundredths: Option<i64>`。DB の列は `quantity_hundredths INTEGER`（2 表）。
- precision/range: 入力は小数 2 桁まで（レジは 0.01〜9999.99）。100 倍の整数は `i64`、月次の `SUM` も `i64`。wire の `f64` は 100 倍の整数 ÷ 100 の最近接値で、表示の `toLocaleString`（既定の小数の最大桁 3）で `1.3` / `1.25` と出る。
- round-trip path: CSV の文字列 → 100 倍の整数（IO）→ cache → DB → 100 倍の整数（IO の DB DTO）→ `f64`（BIZ の写像）→ JSON → UI。wire の `f64` から 100 倍へ戻す経路は持たない（commit は cache の整数を使う）。
- invalid input: 個数の小数 3 桁以上・`.5`・`1.`、件数の小数 → `invalid_number`（取込み全体を止める、今までと同じ扱い）。精算回数の不一致 → `settlement_mismatch`（BIZ-08-D2 の文）。精算回数の行が無い・数字でない → そのファイルは「読めない」として比べる対象から外す。
- compatibility: 整数の日の CSV は今までと同じ値で取り込まれる。layout B の束（Z001 だけが精算回数を持つ）は今までどおり通る。既存の DB は v7 で列の改名と 100 倍。v7 の DB は旧版のアプリで開けない（MNT-03-D11）。`bindings.ts` の型は変わらない見込み（AC7）。

## Test Plan

[Test Design Matrix](test-matrices/2026-10-04-daily-report-import-gaps.md)。

- targeted tests: `cd src-tauri && cargo test --lib daily_report`、`cargo test --lib sales_`、`cargo test --lib migration`。
- negative tests: 小数 3 桁・`.5`・`1.`・件数の小数・精算回数の不一致・コード `0003` の非クレジット行・`101` のコードで総売でないラベル（Matrix）。
- compatibility checks: 既存の parser・BIZ-08・sales・migration の test は assert の意味を変えずに PASS（日報の個数を持つ test は field 名・列名と値の 100 倍だけ直す。範囲と現時点の一覧は Matrix の Compatibility Checks、layout B の test を含む）。AC7 の bindings の diff 0。
- data safety checks: fixture は合成だけ。AC9 の probe の出力は成否・error_type・行番号だけ。
- main wiring/integration checks: BIZ-08 の parse → commit → BIZ-05 の日次・月次の取得を通す test で、小数の個数が DB を経て wire の `1.3` になる（Matrix T20）。

## Review Focus

- Plan Review の冒頭の問い（`docs/DEV_WORKFLOW.md` Review Rules）: Ordinary Operation の操作列が目的を達成できるか（成立 / 具体的な反例あり / 外部前提が未確認）。「混在を止める」と「正しい束（layout A・layout B・同日 2 回目）を止めない」を別々に。
- IO-07-D4 で半角の `ｸﾚｼﾞｯﾄ` を `credit` にしない判断（Non-scope）が、対象 3（行の対応）の取りこぼしでなく、合算を避ける選択として妥当か。
- IO-07-D3 の「読めたのが 1 本以下なら比べない」が混在を見逃す経路（layout A と layout B を混ぜた束）は owner 決定 TD-110・TD-111 で受容リスクとした。Goal・失敗定義・Ordinary Operation・IO-07-D3・BIZ-08-D2・D-104 の保証の範囲が「3 本とも精算回数を読める束」でそろっているか。
- 100 倍の整数と wire の `f64` の境界（cache と wire の型の分け方、`SUM` の後の変換、`toLocaleString` の出力）。
- migration v7 の範囲検査（`i64::MAX / 100`）と検証（件数・型・÷100 の合計と余り、NULL・負、範囲の境界、実際の v7 経由の rollback）、v4 の CREATE を書き換えない方針、v6 以前の backup の復元。
- BIZ-08-D2 の文の言い回し（利用者が次に何をすればよいか分かるか）と、Human Gate に manual を足さない判断。
- lane C の前提（UI-09a-D16、34 §19.2 の `OfficialDailySummaryLine`）を壊していないか。共有 file の所有と schema version 7 の予約。

follow-up（本 lane では直さない。closeout で backlog へ）: (1) 精算回数の保存・表示（既存の項目に IO-07-D3 の読み方を足す）。(2) 部門別集計の数量の字 `点` を長さの部門でどう出すか。(3) `docs/project-memory.md:246` の「Z002 と Z004 には出ない」の Z004 の部分が古い（9/30 の PLU の試し）。(4) 日付の不一致だけの文。(5) layout B の実物のメタに精算回数があるかの確認（D-104 Revisit）。(6) 単位の拡張の lane が 100 倍の整数の読み方の helper を Z004 と共有するか。(7) backlog の Z002 の合算の項目に、半角の `ｸﾚｼﾞｯﾄ` を含む行が 1 本に複数あり全角の `クレジット` の行が無いこと（`credit` の鍵は実データで作られない）を足す。

## Contract Ledger

R3 の必須の表。触る設計正本の節の契約・設計判断 ID を行にし、adjacent-contract sweep で除外を明記する。新しい test の名前は Matrix にある（ここでは T 番号で引く）。

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| IO-07-D2 個数は小数 2 桁までを 100 倍の整数、件数は整数、`quantity_hundredths_to_units` | 29 IO-07-D2、§29.4.1、§29.5 | S1 | Matrix T1〜T5 | — |
| IO-07-D3 精算回数を読めたファイルが 2 本以上で違えば `settlement_mismatch`、1 本以下なら比べない（読めないファイルの出所は確かめない、TD-110・TD-111） | 29 IO-07-D3、§29.3 手順 6、§29.5、pos-tables B-2 Stage 2 | S2 | Matrix T6〜T9、`test_parse_daily_report_req401_layout_b_concatenated_shape_supported`（assert の意味を変えない） | — |
| IO-07-D4 鍵はラベルだけ、「レコード」列を使わない | 29 IO-07-D4、§29.4.1 | S3 | Matrix T10・T11、`test_parse_daily_report_req401_happy_path`（assert の意味を変えない。個数は field 名と値の 100 倍だけ直す） | — |
| IO-07-D1 診断の境界（parse error の 5 項目、unknown file の filename） | 29 IO-07-D1 | 変えない（`settlement_mismatch` も同じ 5 項目で返す） | Matrix T8 | — |
| §29.3 手順 6 の日付の一致（`invalid_date`） | 29 §29.3、§29.5 | 変えない | `test_parse_daily_report_req401_date_mismatch`（変えない） | — |
| BIZ-08-D1 利用者向けの文と operation log に raw detail を出さない | 37 §37.3 手順 3 | 変えない | `test_daily_report_req401_parse_error_logs_parse_failed`（変えない）、Matrix T12 | — |
| BIZ-08-D2 `settlement_mismatch` の固定の文（message と `operation_logs.summary`） | 37 §37.3 手順 3、§37.7 | S4 | Matrix T12・T13 | — |
| §37.2 preview の `quantity: Option<f64>`、cache の `quantity_hundredths`、`CachedDailyReportDepartmentLine` | 37 §37.2 | S4 | Matrix T14 | — |
| §37.3 手順 8 / §37.4 の重複判定・同日追加・TX 内の再検査・insert-only | 37 §37.3〜§37.4、SPEC-SDI-D1〜D8 | 変えない | 既存の BIZ-08 の test（変えない） | — |
| pos-tables §12c・§12e の `quantity_hundredths` | pos-tables §12c・§12e | S5・S6 | Matrix T15〜T18 | — |
| MNT-03-D12 migration v7（範囲検査 + 改名 + 100 倍 + 件数・型・÷100 の合計と余りの検証、1 transaction） | 22 §15 | S5 | Matrix T15・T15b・T16・T17 | — |
| MNT-03-D11 新しすぎる版を開かない、MNT-03-D1 の rollback | 22 §3.2 | 変えない | 既存の migration の test（v7 の数に追従） | — |
| 24 §14.21 手順 4・§14.22 手順 2 の 100 倍の整数での集約 | 24 §14.21・§14.22 | S6 | Matrix T18 | — |
| 24 §14.21 手順 6（Z001 の取込みごとの行、lane C） | 24 §14.21 手順 6 | 列名だけ本 lane が書く。実装は lane C | 非対象（lane C） | — |
| §19.2 wire の `quantity: Option<f64>`（日次・月次の部門） | 34 §19.2 | S7 | Matrix T19・T20 | — |
| §19.2 `OfficialDailySummaryLine.quantity: Option<f64>`（lane C） | 34 §19.2 | 型だけ本 lane が書く。実装は lane C | 非対象（lane C） | — |
| SALES2-D5（未対応部門の warning）・§19.3 の NULL 伝播・代表の行 | 34 §19.3 | 変えない | 既存の sales の test（assert の意味を変えない。日報の個数は Matrix の Compatibility Checks の追従だけ） | — |
| UI-09a-D16 数は `toLocaleString`、Z001 は合算しない（lane C の前提） | 56 UI-09a-D16、D-096 | 変えない（wire が単位の数なので前提を保つ） | 非対象（lane C） | — |
| UI-09b-D10 同日の複数取込みを月次で加算 | 57 UI-09b-D10 | 変えない | 既存の月次の test（assert の意味を変えない。日報の個数は Matrix の Compatibility Checks の追従だけ）、Matrix T18 | — |

adjacent-contract sweep: 触る節で上表に無い契約は、§29.4.1 layout B の 4 列反復と `invalid_format`（変えない）、CP932 strict と改行の正規化（変えない）、§37.5 rollback・§37.6 list（変えない）、pos-tables §12b `daily_report_imports` の列（変えない。精算回数を保存しない）、B-2 の Z004 との関係（変えない）、34 §19.5 CSV 出力（日報の行を出さない、変えない）。

## Contract Probe

R3 の外部前提。実データは `~/downloads/inventory-field-check/approved-readable/` だけを読み（同 `AGENTS.md` の approved-readable の例外）、script は scratchpad（repo 外）に置いた。出力は束の鍵（日・接尾字・連番）・成否・error_type・行番号・真偽だけで、金額・ラベル・行を出していない。確認日 2026-10-04。

- P1「今の parser は小数の日の束を `invalid_number` で落とす」: `src-tauri/src/io/daily_report_parser.rs` を test 部分と specta の derive だけ外して scratch の crate に写し（`cargo build --offline`）、`approved-readable/z/2026/09` の Z001 / Z002 / Z005 を `Z00k_` より後ろで束ねて `parse_daily_report_bundle` に通した → `29__0001.CSV files=3 ok=false date=Some("2026-09-29") errors=["invalid_number:Some(Z001):lineSome(9)", "invalid_number:Some(Z005):lineSome(12)"]`、`30__0001.CSV` も同じ形。26〜28 日の束は `ok=true` → 成立（S1 の根拠。Z001 の 9 行目 = データの 1 行目 = 総売、Z005 の 12 行目 = データの 4 行目）。
- P2「同じ日の別の精算の束を混ぜても通る」: 同じ probe で `Z001_28 _0001.CSV` と `Z002_28A_0002.CSV`・`Z005_28A_0002.CSV` を束ねた → `mixed bundle: parser_ok=true date=Some("2026-09-28") settlement_present_all=true settlement_equal=false` → 成立（S2 の根拠）。
- P3「同じ精算の 3 本は精算回数の行を持ち、値が一致する」: 同じ probe で 9 月の束ごとに、ヘッダより前で第1列が `精算回数` の行の第2列を整数で読んだ → 手元の 9 月分の束はすべて 3 本とも読め、一致した（`settlement_present_in_all_3` と `settlement_equal_in_all_3` が束の数と同じ）→ 成立（IO-07-D3 の読み方の根拠）。
- P4「小数の形」: Python 標準ライブラリで 09-29・09-30 の Z001 / Z005 の小数のセルの小数部の桁数と符号だけを出した → Z001 の 9 行目第3列、Z005 の 12 行目第3列で `frac_digits 1 neg False` → 成立（IO-07-D2 の正規表現が受ける形）。2 桁の実例は無い（取扱説明書の上限で受ける）。
- P5「ファイル名の形」: `ls approved-readable/z/2026/09` → `Z00k_{日 2 桁}{接尾字: 空白か A}_{連番 4 桁}.CSV`（例の形 `Z001_28A_0002.CSV`、`Z001_28 _0003.CSV`）。名前の文字列の並びでは `28 _0003` が `28A_0002` より前に来る。名前の後ろで組んだ 3 本が同じ精算か（round 2 の是正、2026-10-04、Coordinator の probe6。持ち帰りデータの全期間、手元の整理の年/月 folder を外し、中身の日付 + ファイル名の `Z00k_` より後ろで組んだ。出力は件数・日数だけ）: 426 ファイル・142 組で、142 組すべてで Z001 / Z002 / Z005 の 3 本がそろい、3 本の精算回数が一致。同じ日に 2 回以上精算した日は 19 日・42 組で、42 組すべて一致。名前だけで組んだ probe1 で 3 本がそろわなかった 2 組は、手元の整理で `日付不明` の folder に分かれた同じ 1 精算（後ろの名前は同じ）で、店の PC の `EcrDatas`（1 つの folder）では起きない → 成立（BIZ-08-D2 の文が「`Z00k_` より後ろが同じ 3 つ」を案内する根拠。名前の後ろが同じ 3 本は手元の全期間で同じ精算だった。名前は利用者が変えうるので、判定は中身の精算回数〈IO-07-D3〉で行う）。
- P6「Excel で保存し直した形も精算回数の行を持つ」: `approved-readable/z/_日付不明` の Z001・Z002（引用符なし）で、先頭 8 行に第1列が `精算回数` の行が 4 行目にあり、第2列が数字だけ → 成立（IO-07-D3 の読み方が引用符の有無に依らない根拠）。
- P7「同梱の SQLite で `RENAME COLUMN` と 100 倍の UPDATE が通る」: `src-tauri/Cargo.lock` の `libsqlite3-sys` は `0.28.0`、`~/.cargo/registry/src/*/libsqlite3-sys-0.28.0/sqlite3/sqlite3.h` の `SQLITE_VERSION` は `"3.45.0"`（3.25 以降）。Python の sqlite3（3.51.3）で FK と index のある表に `ALTER TABLE … RENAME COLUMN quantity TO quantity_hundredths` と `UPDATE … * 100 WHERE … IS NOT NULL` を 1 transaction で流し、`[(1, 700), (2, None), (3, -200)]`、`CREATE TABLE` の文の列名が置き換わった → 成立（MNT-03-D12 の根拠。rusqlite 上の実行は実装の T15 で確かめる）。
- P8「specta は `f64` を `number` にする」: 未実測。既存の DTO に `f64` の field は無い（`rg -n "pub [a-z_]+: (Option<)?f64" src-tauri/src` 出力なし）。実装の AC7（bindings の diff 0）で確かめ、型が `number` 以外になれば止めて Gated Amendment。
- P9「layout B のエクスポートのメタに精算回数があるか」: 未確認。手元の approved-readable は layout A だけで、layout B の実物は 2026-07 の L3 の後に残っていない（`docs/archive/plans/2026-07-04-req401-sales-daily-report-implementation.md:237` は一時 probe を削除済み）。IO-07-D3 は読めた 1 本以下なら比べない側に倒し、D-104 Revisit に置いた。
- P10「Z002 の `credit` の鍵は実データで作られない。半角の `ｸﾚｼﾞｯﾄ` を含む行は 1 本に複数ある」: 独立の数え直し（2026-10-04、repo 外の報告の「新しく見つけた事実」1。Python 標準ライブラリ、出力は位置と本数だけ）→ 全角の `クレジット` を含むラベルは無く、半角の `ｸﾚｼﾞｯﾄ` を含むラベルが Z002 の複数の位置にある。3 行目は含まない。実装の `payment_key` は全角だけを見る（`rg -n 'クレジット|payment_key' src-tauri/src` → `daily_report_parser.rs:504`・`:507`）。`credit` を業務で読む処理は無い（`rg -n '"credit"' src-tauri/src src --glob '!**/*.test.*'` の一致は parser の `:509` と `sales_repo.rs` の test だけ）→ 成立（IO-07-D4 の半角を `credit` にしない判断の根拠）。
- P11「v7 の範囲検査と検証の前提」（round 1 の是正、2026-10-04、起草役。Python の sqlite3 3.51.3、合成の値だけ）: `SELECT 100000000000000001*100` → `1e+19`・`real`（100 倍の溢れは error でなく REAL になる）。範囲内の最大 `i64::MAX / 100` を 2 行入れた表で、100 倍した後の `SUM` → `integer overflow` の error（合計の 100 倍では比べられない）。改名前の列名 `quantity` で書いた `AFTER UPDATE` trigger は `RENAME COLUMN` で本文が `quantity_hundredths` に書き換わり、100 倍の UPDATE の後に各行へ +1 すると `SUM(quantity_hundredths % 100)` が 0 でなくなり、rollback で列名・値・trigger が元に戻る → 成立（22 §15 手順 1・2・6、Matrix T15b・T16 の根拠。同梱の SQLite 3.45.0 での実行は実装の T15b・T16 で確かめる）。
- P12「行が 0 の表と全行が NULL の表の `SUM`」（round 2 の是正、2026-10-04、起草役。Python の sqlite3 3.51.3、合成の値だけ）: 行 0 の表と `NULL` 2 行の表のどちらでも `SUM(q % 100) = 0` → `None`、`COALESCE(SUM(q / 100), 0)` → `0`、`COALESCE(SUM(q % 100), 0) = 0` → `1`、`COALESCE(SUM(q), 0)` → `0`、`COUNT(q)` → `0` → 成立（22 §15 手順 2・6 (c) の `COALESCE`、Matrix T17 の根拠。同梱の SQLite での実行は実装の T17 で確かめる）。

## Data Safety

- commit しないもの: 実 POS / 店舗データ（Z001 / Z002 / Z005 の実ファイル・値・ラベル）、DB、backup、log、receipt、secret、`.env*`、`.local/`。持ち帰りデータの件数（数え直し前）を tracked に書かない。
- local-only paths: scratchpad の probe の crate と出力（AC9 の再実行も同じ場所）、`$TMPDIR` の cargo の target。
- synthetic-only paths: `src-tauri/src/io/daily_report_parser.rs`・`src-tauri/src/biz/daily_report_import_service/tests.rs`・`sales_repo.rs`・`sales_service.rs`・`migration.rs` の test の文字列の fixture（合成の部門名・金額・精算回数）。`tests/fixtures/daily-report/` は変えない。
- 証拠に書くもの: command と exit code、probe の出力の行（成否・error_type・行番号・真偽）、PR 番号。

## Implementation Results

実装の後に書く。

## Review Response

Review の後に書く。
