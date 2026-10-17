# Test Design Matrix: 日報の紙（1 日 1 枚）と日報の意味づけ

Plan Packet: [2026-10-17-daily-report-sheet-design](../2026-10-17-daily-report-sheet-design.md)。本 lane は docs だけで、下の test は後続の「日報の紙の runtime」の lane が実装する（本 lane が走らせるのは AC12 の docs の検査だけ）。既存の test を引くときは、runtime の lane の起票の時に `rg` で在ることを確かめ直す。

## Risk

Risk: R3

## Contracts Under Test

- SALES-SHEET-D1〜D6（[34](../../function-design/34-biz-sales-service.md) §19.3a）
- 24 §14.21 手順 3（支払の合算の鍵）、§14.21a・§14.21b（[24](../../function-design/24-io-csv-import-repo.md)）
- CMD `get_daily_report_sheet`（[42](../../function-design/42-cmd-sales-stocktake.md)）
- IO-07-D4a（[29](../../function-design/29-io-daily-report-parser.md)）
- UI-09a-D17・D18・D19（[56](../../function-design/56-ui-daily-sales.md)）、UI_TECH_STACK §6.5.5

## Failure Modes

- 同じ日の 2 取込みを足さず、精算ごとの紙になる（D1）。
- 並び順だけで足し、名称の変わった日に別の行を足す。名称だけで足し、1 本の中の同じ文字の行をまとめる（D2）。
- NULL を 0 として足し、未取得を 0 に見せる（D2）。
- 個数を倍精度で足して誤差が出る（D2、IO-07-D2）。
- 名称の空の枠（値 0）を載せる、または名称が空で値のある行を落とす（D3）。
- 手動販売の行や数量・金額とも 0 の行が PLU の部分に出る。取り込んでいない日を「売れなかった」と出す（D4）。
- 溢れで一部だけの紙を返す（D5）。取消した取込みが紙に入る（D1・D6）。
- 支払集計の鍵の変更で、名称の変わらない日の値や行が変わる（14.21）。
- `credit` の規則を外すときに、`cash`・`gross_sales`・`net_sales` の鍵も変わる（D4a）。
- 印刷ボタンが取込みの無い日に押せる、押せない理由が Tooltip だけ（D17）。
- 紙の上の文字が 9 pt を割る、色を使う、画面に紙の内容が出る（D17）。
- 印刷を押したときに古い内容で印刷する（D6・D17）。

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SALES-SHEET-D1 | 精算ごとの紙 | integration（実 DB、`sales_service.rs` の test） | `test_daily_report_sheet_sums_all_completed_imports_of_the_day` | 同じ日の合成の束 2 つ（総売の金額 1000 と 500）を取り込んだ日に、総売の行が 1 行で 1500 にならない。`import_count` が 2 でない |
| SALES-SHEET-D1・D6 | 取消した取込みが入る | integration | `test_daily_report_sheet_excludes_rolled_back_import` | 2 取込みの片方を取り消した後に、取り消した側の値が足される |
| SALES-SHEET-D2 | 名称の変わった日に別の行を足す | unit（BIZ の足し算の関数） | `test_sheet_rows_keep_same_position_different_label_separate` | 位置 4 の名称が取込みで違う 2 行が 1 行になる。`label_changed_sources` に Z002 が入らない |
| SALES-SHEET-D2 | 名称だけで足す | unit | `test_sheet_rows_do_not_merge_same_label_at_different_positions` | 1 本の中の位置 7 と位置 33 の同じ名称の 2 行が 1 行になる |
| SALES-SHEET-D2 | NULL を 0 として足す | unit | `test_sheet_rows_propagate_null` | 片方の取込みで金額が NULL の組が NULL でなく、もう片方の値になる |
| SALES-SHEET-D2 | 個数の誤差 | unit | `test_sheet_rows_sum_quantity_in_hundredths` | 総売の個数 130 と 200（100 倍の整数）の和が `3.3` でない |
| SALES-SHEET-D2 | 並び | unit | `test_sheet_rows_order_by_position_then_first_seen_import` | 同じ位置の 2 つの名称が、名称が最初に現れた取込みの古い順に並ばない |
| SALES-SHEET-D2・D5 | 溢れ | unit | `test_sheet_rows_overflow_is_validation_failed` | 金額 `i64::MAX` と `1` の組で `ValidationFailed` にならず、紙の内容を返す |
| SALES-SHEET-D3 | 名称の空の行 | unit | `test_sheet_rows_drop_blank_label_zero_rows_only` | 名称が空で値が 0 の行が残る、または名称が空で金額 5 の行が落ちる |
| SALES-SHEET-D4 | PLU の部分の選び方 | integration | `test_daily_report_sheet_plu_rows_are_auto_nonzero_only` | 手動販売の行、または Z004 の数量・金額とも 0 の行が `plu_rows` に入る |
| SALES-SHEET-D4 | 取り込んでいない日 | integration | `test_daily_report_sheet_plu_import_counts` | Z004 の取込みが無い日に `plu_import.import_count` が 0 でない。`completed_partial` の取込みの `skipped_count` が和に入らない。`rolled_back` の取込みが数に入る |
| SALES-SHEET-D5 | 空の日 | integration | `test_daily_report_sheet_empty_day_returns_zero_imports` | 取込みの無い日に error になる、または行が空でない |
| SALES-SHEET-D5 | 日付の誤り | unit | `test_daily_report_sheet_rejects_invalid_date` | `2026-02-30` で §19.3 と同じ文言の `ValidationFailed` にならない |
| 24 §14.21a | 読む範囲 | integration（`sales_repo.rs` の test） | `test_get_daily_report_sheet_lines_reads_completed_only_in_order` | `rolled_back` の親の行を読む、または帳票・取込み・位置の順に並ばない |
| 24 §14.21 手順 3 | 名称の変わらない日の互換 | integration | `test_payment_aggregate_unchanged_when_labels_stable` | 名称が同じ 2 取込みの支払集計の行の数・値・並びが、鍵の変更の前（同じ fixture の今の期待）と違う |
| 24 §14.21 手順 3 | 名称の変わった日 | integration | `test_payment_aggregate_splits_rows_when_label_changes` | 同じ位置で名称の違う 2 取込みの行が 1 行に足される |
| IO-07-D4a | `credit` の規則を外す | unit（`daily_report_parser.rs` の test） | `test_payment_key_has_no_credit_rule` | 全角の `クレジット` を含む名称の行の `payment_key` が `credit` になる。`現金` の行が `cash` でない。総売・純売の `line_key` が変わる |
| CMD | 登録 | drift / bindings | `scripts/check-command-drift.sh`、bindings の clean diff | `get_daily_report_sheet` が `collect_commands` か `invoke_handler` に無い、bindings が再生成されていない |
| UI-09a-D17 | 押せない状態 | component（Vitest + RTL、`ExportBar` の test） | `ExportBar disables print with reason when no imports (UI-09a)` | `import_count` 0 で `日報を印刷` が押せる、または `この日のレジ日報は未取込みのため、印刷できません。` が文で出ない |
| UI-09a-D17・SALES-SHEET-D6 | 古い内容で印刷 | component | `print refetches sheet before window.print (UI-09a)` | 押したときに `getDailyReportSheet` を呼び直す前に `window.print` が呼ばれる（`window.print` は spy） |
| UI-09a-D17 | 紙の文と表 | component | `DailyReportSheet renders tables, notices and no yen sign (UI-09a)` | 見出しが `日計（Z001）` / `支払集計（Z002）` / `部門別集計（Z005）` / `PLU の売上（Z004）` でない、`label_changed_sources` の知らせが出ない、金額に `¥` が付く、名称が空の行が `（名前なし）` でない |
| UI-09a-D17 | PLU の知らせ | component | `DailyReportSheet PLU notices by import state (UI-09a)` | `plu_import.import_count` 0 で `この日の PLU の売上は取り込まれていません。` が出ない、取込みがあって行が無い日に `この日に売れた PLU の商品はありません。` が出ない、`skipped_count` 3 で `商品に当たらず数えていない PLU の行が 3 行あります（売上データ取込みの記録で見られます）。` が出ない |
| UI-09a-D17 | 画面に出さない・下限 | component（class の検査） | `DailyReportSheet is print-only and min 9pt (UI-09a)` | 紙の root に画面で隠す class（`hidden print:block` 相当）が無い、文字の大きさの class が 9 pt を割る |

oracle（期待値）は 34・56 の正本の文と数から転記し、production の定数を import しない。文字列の anchor は 56 の表の完全一致の文。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 紙の内容（query `["daily-report-sheet", date]`） | 日次売上を開くと読む | ボタン disabled | `import_count` 1 以上で押せる | 日報・Z004 の取込みと取消の成功 | 押したときに読み直す | 日付を変えると別の key | アプリを開き直すと読み直す（保存しない） | ボタン disabled と CmdError の文 | 日付を選び直す | component test、L3 |
| 印刷の dialog | — | dialog 表示中 | 印刷される | — | — | 何度でも印刷できる | — | dialog の取消は何も残さない | もう一度押す | L3（P1） |
| 紙の切替え | 店は Excel を続ける | 並びの決定と実際の 1 日の確かめ | 切替えの日から紙を印刷 | — | — | — | — | 不都合が見つかる | 翌日から Excel に戻す | 運用（UI-09a-D19） |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 同じ日の取込みを足す（NULL の伝播、checked add） | 24 §14.21 手順 2〜4・7、34 §19.3 | 34 SALES-SHEET-D2 | 24 §14.22（月次は `SUM`、部門ごと。変えない） | 上の D2 の行 |
| 個数の 100 倍の整数（IO-07-D2） | 29 IO-07-D2、34 §19.2、24 §14.21 手順 4 | SALES-SHEET-D2 | — | `test_sheet_rows_sum_quantity_in_hundredths` |
| 日次売上の文字列の書き方（`toLocaleString`、`—`、負の数） | 56 UI-09a-D16 | UI-09a-D17 | 金額の `¥` だけ付けない（紙の列の幅） | component test |
| 取込み・取消の後の invalidate | 56 の主動線（`["daily-sales"]`） | `["daily-report-sheet", date]` | — | component test |
| 押せない状態の表示（`aria-disabled`） | 両方の `ExportBar.tsx`（今は Tooltip） | 日次の `ExportBar` は理由を文でも出す | 月次の `ExportBar` の印刷は disabled のまま（範囲外） | component test |

## Negative Paths

- missing input: 取込みの無い日 → `import_count` 0、ボタン disabled。
- invalid input: 日付の誤り → `ValidationFailed`。
- duplicate/ambiguous input: 同じ位置に 2 つの名称 → 別の行と知らせ。同じ精算の二重の取込み（精算回数の読めない束）→ 二重に足す（D-120 の Guarantee range、test は「足される」ことを固定しない）。
- unknown reference: 商品に当たらない Z004 の行 → `skipped_count` の文。
- dependency missing: Z004 の取込みが止まっている → 「取り込まれていません」。
- permission/write failure: 不該当（書かない）。代わりの道（UI-09a-D18）を使うときだけ HTML の書込みの失敗 → 印刷しない旨の CmdError（runtime の lane が代わりの道を採るときに足す）。
- dry-run side effect: 読み取りだけで、DB を変えない（`get_daily_report_sheet` の後に表の行数が変わらない）。

## Boundary Checks

- threshold: 文字の大きさの下限 9 pt。
- null/default: NULL の伝播、`—` の表示。
- empty/non-empty: 取込み 0・行 0・PLU 0。
- min/max: 金額の和の `i64` の溢れ。
- status/policy enum: `completed` だけ（日報）、`completed`・`completed_partial`（Z004）。
- wire type: `DailyReportSheet` の number は i64 由来。1 日の数回の取込みの和で安全な整数を越えない（拒否の検査は持たない）。
- internal type: 個数は 100 倍の `i64`。
- producer/consumer: BIZ が足し、UI は描くだけ。
- round-trip token: 不該当（保存も往復もしない）。
- precision/range: 個数は小数 2 桁まで。
- cross-language parse: 不該当。

## Compatibility Checks

- old schema/input: DB の列を変えない。既存の取込み（`payment_key` が `cash`・`payment_N`）もそのまま足せる（鍵に使わない）。
- new schema/input: 無し。
- output order: 支払集計は名称の変わらない日は今と同じ並び。
- optional field behavior: 既存の DTO に field を足さない。

## Data Safety Checks

- source-derived data: test の fixture は合成の束だけ。実データの名称の値・金額を写さない。
- generated outputs: 印刷の結果・代わりの道の HTML を commit しない。
- secrets: 不該当。
- local-only files: 店の実際の日の紙の写真・PDF。
- synthetic sample boundaries: 名称は `項目A` のような合成の語。

## Main Wiring / Integration Checks

- helper connected to main path: 日次売上の `ExportBar` → `getDailyReportSheet` → CMD → BIZ → IO。
- output reaches manifest/report: 紙の内容が `@media print` の印刷に出る（L3）。
- effective config reaches runtime: `@page` の A4 縦（L3、P1）。
- CLI arg reaches implementation: 不該当。

## Manual（runtime の lane の L3。Human Gate に manual）

| 項目 | 到達経路 | 入力物 | 依存する既知の backlog | 確かめること |
|---|---|---|---|---|
| L3-1 印刷の手段（P1） | Windows の開発の build → 日次売上 → `日報を印刷` | 合成の束を取り込んだ開発の DB | 無し | OS の印刷の dialog が出て、プレビューが A4 縦で余白 10 mm。効かなければ代わりの道で同じことを確かめる |
| L3-2 並びの案の比較（Q1、P5） | 同じ | 合成の束 2 つを同じ日に取り込んだ日と、PLU の行を数行持つ日（Z004 の取込みが止まっている間は PLU の行の無い紙と、test 用に PLU の行を入れた紙） | Z004 の取込みの再開（停止 ADR） | owner が案 a・b・c を実機のプリンタで印刷して並べ、読みやすさで選ぶ。既定の a が 9 pt で 1 枚に収まるか |
| L3-3 値の一致（P2） | 店のアプリの運用の後の実際の 1 日 → 日次売上 → `日報を印刷` | 店の実際の日の取込み（同じ日に 2 回以上精算した日があればその日も） | 店のアプリの運用の開始 | アプリの紙とレジスターツールの日報（今の Excel の紙）の値が行ごとに同じ |

L3 の前に Writer が `cargo check --release` を通す（`docs/DEV_WORKFLOW.md` Implementation Rules）。

## Mutation-style Adequacy Questions

- 足す鍵から名称を外したら: `test_sheet_rows_keep_same_position_different_label_separate` が落ちる。
- 足す鍵から位置を外したら: `test_sheet_rows_do_not_merge_same_label_at_different_positions` が落ちる。
- NULL の伝播を外したら: `test_sheet_rows_propagate_null` が落ちる。
- `status='completed'` の条件を外したら: `test_daily_report_sheet_excludes_rolled_back_import` が落ちる。
- PLU の `source='auto'` の絞り込みを外したら: `test_daily_report_sheet_plu_rows_are_auto_nonzero_only` が落ちる。
- 押したときの読み直しを外したら: `print refetches sheet before window.print (UI-09a)` が落ちる。
- 押せない状態の条件を反転したら: `ExportBar disables print with reason when no imports (UI-09a)` が落ちる。

## Residual Test Gaps

- 実機のプリンタの見え方・字の読みやすさ・1 枚に収まるかは自動 test に乗らない（L3-2）。
- レジスターツールの日報との値の一致は実際の日でしか確かめられない（L3-3）。
- WebView2 の印刷の dialog は自動 test に乗らない（L3-1。`window.print` の呼出しだけを spy で確かめる）。
