# Test Design Matrix: デザインの決まり runtime lane A（色と強調）

Plan Packet: [2026-09-27-design-color-emphasis](../2026-09-27-design-color-emphasis.md)。D-CE 番号・S 番号・AC 番号は packet のもの。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-COLOR-EMPHASIS-RT-1: 00 の色の役割・強調の段階・迷いやすい場面（試しは owner の L3 の答え）が token・部品・画面へ反映され、今の赤・琥珀・緑の割り当てと文言・role・accessible name は変わらない。
- 00 のカラーパレット表・セマンティックカラー表の HEX と `src/styles/globals.css` の `:root` が一致する（DS3）。
- DSR-08: 非中立の Alert は icon を持ち、色だけで意味を伝えない。
- DSR-22 / 02 ⑫: 現在行と詳細を開いた行は左端のバー + 薄い地 + 文言（または開いた詳細）で示し、選択欄を開いた入力行は進行中にしない。

## Failure Modes

- F1 `--primary` の値だけが変わり、`--ring` が琥珀のまま残る（focus ring と押すボタンの色が割れる）。
- F2 進行中の token が `@theme inline` に無く、`bg-ongoing-soft` 等の class が生成されない（見た目が消えるが test の class assert は通る）。
- F3 部品が icon を描くのに site の明示の icon が残り、Alert に三角が 2 つ出る。
- F4 部品が `warning` / `default` にも icon を描き、既存の warning の site で二重になる、または中立のお知らせに icon が付く。
- F5 badge の `default` variant を削った後も variant 無指定の `<Badge>` が残り、塗りの無い pill に黙って変わる。
- F6 詳細を開いた行の上書きを素の `bg-ongoing-soft` で書き、`table.tsx` の variant 付きの既定（`data-[state=selected]:bg-muted` / `has-aria-expanded:bg-muted/50`）に負けて stone のまま。
- F7 `table.tsx` の既定を進行中へ変え、選択欄を開いた入力行（廃棄・返品交換）まで進行中になる。
- F8 部門比率の棒まで進行中の色になる（比率はふつう・補足）。
- F9 `--row-current` / `--rank-top-*` を消したのに参照が残り、class が生成されず地が消える。
- F10 在庫状態・取消済み・増減・注意の既存の色が変わる（owner 決定 2026-09-06 の割り当ての破壊）。
- F11 L3 で採らなかった試しの docs の戻しが一部だけ行われ、00 と 01 / 02 / 04 / review-checklist が食い違う。
- F12 新しい FE test file に REQ / UI の ID が無く、traceability T4 が ERROR になる。

## Test Matrix

- 既存 test の引用は `rg` で実在を確かめた（2026-09-27）: `src/styles/globals.test.ts:20,28`、`src/components/ui/badge.test.tsx:64`、`src/components/ui/alert.test.tsx:8,34`、`src/features/suppliers/components/SupplierPickerDialog.test.tsx:61,65,66`、`src/components/layout/SidebarLink.test.tsx:149,166`、`src/features/home/components/ActionButton.test.tsx:40-44,80`、`src/features/stock-inquiry/components/ProductListTable.test.tsx:123`、`src/features/monthly-sales/components/ProductRankingTable.test.tsx:76-99`。StepIndicator と ImportingStep の test file は無い（`rg -l 'StepIndicator|ImportingStep' src --glob '*.test.*'` の出力なし）。
- 部品の test は `render` で実 DOM を通す（mock なし）。画面の test は各 file の既存の render helper を使う。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| 00 カラーパレット / D-CE1 | F1 / F2 / F9 | unit（fs literal） | `globals.test.ts` の token の describe を更新: `--ongoing*` 4 行、`@theme` の `--color-ongoing*` 4 行、`--primary: #1d5c63;`、`--ring: #1d5c63;` を literal で、`--row-current` の不在 | `--ring` を変え忘れる、`@theme` の行が無い、`--row-current` が残る |
| 00 と `globals.css` の HEX | F2 / F9 | CLI | `bash scripts/doc-consistency-check.sh`（DS3） | 00 に足した `--ongoing*` の HEX が `:root` と違う、00 に消した token が残る |
| D-CE2 / DSR-08 | F3 | unit | `alert.test.tsx` に「destructive は soft の 4 点の class と svg 1 つを持つ」 | 部品が icon を描かない、class が旧 `bg-card text-destructive` のまま |
| D-CE2 | F4 | unit | `alert.test.tsx` に「warning と default は部品が svg を描かない」（子に icon を渡さない render で `svg` 0 個） | 部品が全 variant に icon を描く |
| D-CE2（main wiring） | F3 | integration | `HomePage`（または `BackupRestorePage`）の既存 test に、前日分の知らせの Alert 内の `svg` が 1 つ | 明示の icon を外し忘れて 2 つ |
| D-CE3 | F5 | unit | `badge.test.tsx:64` を「variant 無指定で `bg-primary` を出さない」へ | `default` variant か `defaultVariants` が残る |
| D-CE3（③強調） | F5 / F10 | integration | `BackupRestorePage.test.tsx` の「最新」が `bg-warning-emphasis` と `border-warning`（試しを採れば `font-semibold` と stone の class） | 移し先を `--warning`（3.05:1）にする、塗りを失う |
| D-CE4 | F8 | unit | `progress` の test（新規は既存の近い test file に足す）: 既定の棒は `bg-ongoing`、`indicatorClassName` で上書きされる | 棒の色が固定で上書きできない |
| D-CE4 | F8 | integration | `DepartmentTable.test.tsx` に比率の棒が `bg-muted-foreground` | 比率の棒が進行中の色 |
| D-CE6 | F9 | integration | `SupplierPickerDialog.test.tsx:61,65,66` を `bg-ongoing-soft` / `border-l-ongoing` へ（「選択中」の文言と `Check` icon の assert は保つ） | 現在行が旧 token のまま、文言を失う |
| D-CE7 | F6 | integration | `ProductListTable.test.tsx` に「選択行と展開行が `bg-ongoing-soft` と `border-l-ongoing`、別の行を選ぶと元の行から外れる」 | 素の class で書いて負ける（jsdom は CSS の詳細度を計算しないため、class 名が `data-[state=selected]:bg-ongoing-soft` であることを assert し、見え方は AC-L3-9） |
| D-CE7 | F7 | unit | `table.test` 相当の既存 test が無ければ AC7 の `rg`（`table.tsx` の既定の 1 行が不変） | `table.tsx` の既定を進行中へ変える |
| D-CE7 | F6 | integration | `OperationLogsPage.test.tsx` に「詳細を表示で開いた行が `has-aria-expanded:bg-ongoing-soft`、閉じると詳細の行が消える」 | 開いた行が stone のまま |
| D-CE8 | — | unit（新 file、describe に `UI-07`） | StepIndicator: `currentStep` 1 / 2 / 3 で `aria-current="step"` の丸だけが `bg-ongoing-soft` と太字、他は muted | いまのステップが塗り（段 4）のまま、済んだステップが操作の色 |
| D-CE9 | F10 | integration | `ProductRankingTable.test.tsx` または `DepartmentTable.test.tsx` に前月比 +1.0% / −1.0% / 0 / 比較不可の 4 値で文言（`+1.0%` 等）と `text-success-strong` / `text-destructive-strong` / `text-muted-foreground` | 閾値の分岐が入れ替わる、地の class が残る |
| D-CE10 | F10 | integration | 移動制限: `CsvImportPage` の既存 test か ImportingStep の新 test（describe に `UI-07`）で Alert が `data-variant="warning"` と文言。未保存の案内: 入力 4 画面の既存 test のうち 1 つで文言の要素が `text-warning-emphasis` | 赤のまま |
| D-CE13 | F9 | integration | `ProductRankingTable.test.tsx:76-99` の「1 位」の追従 test を保ち、1 位の要素が `font-semibold`、行に `bg-rank-top-bg` が無い | 1 位が色の pill のまま、sort 後に太字が追従しない |
| 割り当て不変 | F10 | regression | `StockStatusBadge` / `ProductListTable`（在庫数セル）/ `SummaryCards` / `CsvImportRecordDetailPage` の既存 test が無変更で PASS | 赤・琥珀・緑の class が変わる |
| docs の移行の印 | F11 | CLI | AC12 の `rg`（0 行）と、Final Review が 00 の迷いやすい場面の移行列を直読み | 採らなかった試しの戻しが一部だけ |
| traceability | F12 | CLI | `cd src-tauri && cargo run --bin generate_traceability -- --check` | 新 test file に ID が無い |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 在庫照会の詳細を開いた行（URL の `selected`） | 選択なし: どの行もバー無し・stone | 行を押す → 選択行と展開行が進行中、詳細は取得中の表示 | 詳細が出る。進行中のまま | 一覧の再取得でも `selected` が URL にあれば同じ行が進行中 | 同左 | 在庫変動履歴から `returnTo` で戻ると同じ行が進行中で開く（NAV-1 の既存の往復） | 再起動は URL を保たず選択なし | 詳細の取得失敗: 行は進行中のまま、展開行に失敗の表示 | 再試行しても行の状態は不変 | `ProductListTable.test.tsx`、AC-L3-9 |
| 操作ログの開いた行（local state `expanded`） | 閉じた状態 | — | 「詳細を表示」で開いた行と詳細の行が進行中 | page を移ると `expanded` の行が一覧に無く、どれも進行中でない | 一覧の再取得で同じ id があれば開いたまま | — | 再起動で閉じる | 一覧の取得失敗は危険・失敗の Alert（行なし） | — | `OperationLogsPage.test.tsx`、AC-L3-9 |
| 取引先の picker の現在行 | dialog を開いた時点の選択が現在行 | — | 別の行を押すと現在行が移る | — | — | 閉じて開き直すと確定済みの選択が現在行 | — | 取得失敗は dialog 内の危険・失敗の Alert | — | `SupplierPickerDialog.test.tsx`、AC-L3-8 |
| 取込みの手順の表示（`computeCurrentStep`） | idle / parsing = 1 が進行中 | preview = 2 が進行中 | importing / result = 3 が進行中 | — | — | 画面を離れて戻ると idle（1） | — | error は呼出し側で直前の status に展開、直接来れば 1 | 再選択で 1 から | StepIndicator の新 test、AC-L3-10 |
| 取込み中の表示（Z004 の spinner・移動制限の知らせ。確定が停止中〈SPEC-STOP-D4〉のため画面では出ず、test だけ。日報取込みの spinner は画面で出る） | — | importing: spinner（進行中）と注意・確認の Alert | result へ移り両方消える | — | — | — | — | commit 失敗は ErrorState の危険・失敗の Alert | 再試行 | 移動制限の test、AC-L3-13 |
| Home の前日分の知らせと入口 card | 前日分が未取込みなら知らせが出る | — | 取込み後に Home へ戻ると知らせが消える | 取込みの成功で関連 query が無効化される（既存） | Home の再取得 | — | 起動時に再判定 | 取得失敗はカード内の危険・失敗の Alert | 再試行 | 既存の Home の test、AC-L3-4 / 6 |

## Adjacent Pattern Audit

起票時（`e7c22f8f`）の全 hit を分類した。「追従」= site は編集せず token の値の変更で新しい役割の色になる、「移す」= site を編集する、「不変」= 役割も見た目も変わらない、「除外」= 本 lane で扱わない（理由つき）。

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `primary`（`rg -n 'primary' src --glob '!*.test.*'` = 35 行） | 記録詳細 6 画面と在庫変動のリンク 8 行（`CsvImportRecordDetailPage.tsx:223`、`ManualSaleRecordDetailPage.tsx:141,178`、`ReceivingRecordDetailPage.tsx:167`、`DisposalRecordDetailPage.tsx:174`、`StocktakeRecordDetailPage.tsx:208`、`ReturnRecordDetailPage.tsx:211`、`MovementTable.tsx:84`）/ 待ちの spinner 5 行 / `StepIndicator.tsx:31,33` / `globals.css:16,17,82,83` / `ActionButton.tsx:22,39,43`・`QuickActionGrid.tsx:11` / `ReturnExchangePage.tsx:151` / `FilePicker.tsx:134` / `SupplierPickerDialog.tsx:137` / `badge.tsx:12,21` / `checkbox.tsx:12` / `input.tsx:11` / `button.tsx:12,21` / `selection-tone.ts:6` / コメント 2 行（`BackupRestorePage.tsx:292`、`SidebarLink.tsx:20`） | 移す: spinner 5（S7）、`StepIndicator` 2（S10）、`SupplierPickerDialog` 1（S8）、`badge.tsx:12`（削除、S4）、`globals.css:82`（値、S1） | 追従: リンク 8、`ActionButton` 3（PR head。試しを採れば `:39` の地だけ移す）、`QuickActionGrid` 1（prop 名）、`ReturnExchangePage.tsx:151`（owner への質問）、`FilePicker` 1、`badge.tsx:21`、`checkbox` 1、`input` 1、`button` 2、`selection-tone` 1、`globals.css:16,17,83`。コメント 2 は色の token ではない | AC1、`SidebarLink.test.tsx`、AC-L3-1 |
| `--ring`（`rg -n -e '-ring\b' src --glob '!*.test.*'` = 19 行、16 file） | `globals.css` 3、`ui/` の accordion・badge・button・checkbox・dialog・input・scroll-area・segmented-control・select・tabs・toggle 各 1、`SidebarLink.tsx` 1、`DateNavigator.tsx` 1、`MonthNavigator.tsx` 1、`ReturnExchangePage.tsx` 2 | `globals.css` の `--ring` の値（S1） | 追従: 他の 18 行（`ring-ring` / `border-ring` / `outline-ring` / `var(--ring)` の読み取り 17 行と、`globals.css:108` のコメント 1 行） | AC1 |
| `warning-emphasis`（非 test 5 行） | `globals.css:38,94`、`SummaryCards.tsx:79`、`ProductImportPreview.tsx:288`、`ProductListTable.tsx:38` | なし（S5 と S13 で使う site が増える） | 不変: 5 行とも注意・確認の文字か token 定義。値は不変 | AC4 / AC10 |
| `rank-top`（8 行、test 0） | `globals.css` 6、`ProductRankingTable.tsx:77,80` | 試しを採れば 8 行とも削除（S1 / S11） | 採らなければ不変 | AC1 |
| `row-current`（非 test 3、test 6） | `globals.css:28,70`、`SupplierPickerDialog.tsx:137`、test は `globals.test.ts` と `SupplierPickerDialog.test.tsx` | 全削除・進行中へ（S1 / S8 / S16） | なし | AC1、`globals.test.ts` |
| `toast.info`（0） | なし | — | 00「お知らせ一般」どおり使わない | 起票時実測 #6 |
| `variant="destructive"`（非 test 63 行） | `<Alert` 53（全 site 1 行形式、`rg -c '<Alert variant="destructive"' src --glob '!*.test.*'` の合計）、`AlertDialogAction` 9（`DailyReportImportPage.tsx:396`、`DiscontinueConfirmDialog.tsx:52`、`ResultStep.tsx:124`、`UnsavedChangesDialog.tsx:37`、`AdditionalImportConfirmDialog.tsx:143`、`StocktakePage.tsx:966`、`IntegrityCheckPage.tsx:473`、`ProductImportPreview.tsx:220`、`BackupRestorePage.tsx:658`）、`Button` 1（`MergeSupplierDialog.tsx:193`） | Alert 52 は `alert.tsx`（S2）で移る。うち明示の icon を持つ 6 site は icon を外す（S3）。`ImportingStep.tsx:29` は注意・確認へ（S13） | 不変: dialog の実行ボタン 10（DSR-20、段 4 の危険の塗り） | AC3 |
| badge の塗り（`<Badge variant="default"`、variant 無指定、`variant: "destructive"`） | `BackupRestorePage.tsx:520`、`ProductImportPreview.tsx:76`、`ProductRankingTable.tsx:80`（無指定）、`formatErrorRow.ts:22`（`ErrorRowsTable.tsx:68` が使う） | 520 / 76（S5）、80（S11） | 除外: `formatErrorRow.ts:22`「フォーマット異常」の危険の塗り（②分類か①状態かが正本に無い。backlog へ） | AC4 |
| 現在行の形（DSR-22 の 3 点） | `SupplierPickerDialog.tsx:137`（canonical）、`PriceRevisionTable.tsx:104`「入力中」（badge 1 点） | `SupplierPickerDialog`（S8） | 除外: `PriceRevisionTable.tsx:104`（3 点へ足すかは backlog の lane A の対象一覧に無い。backlog へ） | AC6 |
| `data-[state=selected]` / `has-aria-expanded`（非 test 2 行） | `table.tsx:48`（既定）、`ProductListTable.tsx:96`（コメント） | 詳細を開いた行の site 側の上書き（S9: `ProductListTable.tsx`、`OperationLogsPage.tsx`）。コメント `:95-96` は新しい形へ直す | 不変: `table.tsx:48`（選択欄を開いた入力行に当たるため stone のまま） | AC7 |
| 進み具合の棒（`<Progress` 3 site） | `StocktakePage.tsx:430`、`DepartmentTable.tsx:95`、`IntegrityCheckPage.tsx:495` | 3 site とも（S6: 棚卸し・確認中は進行中、比率はふつう・補足） | なし | AC5 |
| 00 に無い token（`warning-foreground` / `info-*`） | `IntegrityCheckPage.tsx:272`、`PluExportPage.tsx:366` | 2 site（S14） | なし | AC11 |
| 失敗ではない赤（`text-destructive` の案内、`ImportingStep` の Alert） | 入力 4 画面の未保存の案内 4、`ImportingStep.tsx:29` | 5 site（S13） | 他の `text-destructive`（`FieldError` 等の入力エラー、在庫切れのセル）は危険・失敗のまま不変 | AC10 |

### 最終 sweep の式（AC13）

merge 直前に `origin/main` を 1 回 merge した後、次の 9 本を実行し、全 hit が上の表のどれかの分類に当たることを PR body に記録する。

1. `rg -n 'primary' src --glob '!*.test.*'`
2. `rg -n -e '-ring\b' src --glob '!*.test.*'`
3. `rg -n 'warning-emphasis' src --glob '!*.test.*'`
4. `rg -n 'rank-top' src`
5. `rg -n 'row-current' src`
6. `rg -n 'toast\.info' src`
7. `rg -n 'variant="destructive"' src --glob '!*.test.*'`
8. `rg -n 'data-\[state=selected\]' src --glob '!*.test.*'`
9. `rg -n 'has-aria-expanded' src --glob '!*.test.*'`

本 lane の変更で増える hit（例: 8 の `ProductListTable.tsx` の `data-[state=selected]:bg-ongoing-soft`、9 の `OperationLogsPage.tsx` の `has-aria-expanded:bg-ongoing-soft`、3 の S5 / S13 の `warning-emphasis`）は「移す」の結果として分類する。base の同期で入った他 lane の hit は、00 の役割表で分類してから記録する。

## Negative Paths

- missing input: variant 無指定の `<Badge>` は塗りを持たない（F5）
- invalid input: 00 に無い token の class（生成されない）を使わない（AC11、review-checklist カテゴリ 9）
- duplicate/ambiguous input: destructive Alert の icon が 2 つにならない（F3）。warning の site は部品が icon を描かない（F4）
- unknown reference: 消した token（`--row-current`、試しを採った `--rank-top-*`）の参照が 0（AC1）
- dependency missing: not applicable（依存の追加なし）
- permission/write failure: not applicable
- dry-run side effect: not applicable

## Boundary Checks

- threshold: 前月比の ±1.0%（`THRESHOLD = 0.01`）の分岐は不変。+1.0% ちょうど・−1.0% ちょうど・0・比較不可の 4 値で文字色を assert（D-CE9）
- null/default: `Badge` の variant 無指定、`Progress` の `indicatorClassName` 無指定（既定の進行中の棒）
- empty/non-empty: ランキングが 0 行のとき EmptyState（既存 test、不変）
- min/max: not applicable
- status/policy enum: `computeCurrentStep` の 5 status → 3 step（State Lifecycle Matrix）
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: not applicable（wire 非接触）

## Compatibility Checks

- old schema/input: not applicable
- new schema/input: not applicable
- output order: not applicable
- optional field behavior: `indicatorClassName?` を渡さない既存の 2 site（棚卸し・確認中）は既定の棒で描く

## Data Safety Checks

- source-derived data: なし
- generated outputs: なし（bindings・routeTree・90-traceability を再生成しない）
- secrets: なし
- local-only files: L3 の fixture と build は `.local/` と owner の手元
- synthetic sample boundaries: L3 の日報・CSV は合成、CP932

## Main Wiring / Integration Checks

- helper connected to main path: `alert.tsx` の icon が実画面（Home の前日分の知らせ）に 1 つだけ出る（integration test）
- output reaches manifest/report: not applicable
- effective config reaches runtime: `@theme inline` の `--color-ongoing*` が class を生成する（`globals.test.ts` の literal と AC-L3 の見え方）
- CLI arg reaches implementation: not applicable

## Mutation-style Adequacy Questions

実注入で red を確かめる mutant（Writer が実装後に 1 つずつ入れて戻す。結果は PR body に記録）:

- M1 `globals.css` の `--ring` を `#b45309` に戻す → `globals.test.ts` の `--ring` の literal が red。
- M2 `@theme inline` の `--color-ongoing-soft` の行を消す → `globals.test.ts` が red（jsdom は class の生成を見ないため、class 名の assert では拾えない。literal の test が唯一の自動検出）。
- M3 `alert.tsx` の icon の描画を `variant` に関わらず行う → `alert.test.tsx` の warning / default の svg 0 個が red。
- M4 S3 の 1 site（`HomePage.tsx`）に明示の icon を戻す → Home の integration test の svg 1 つが red。
- M5 `badge.tsx` に `defaultVariants: { variant: "default" }` と `default` を戻す → `badge.test.tsx` が red。
- M6 `ProductListTable.tsx` の上書きを素の `bg-ongoing-soft` へ変える → `ProductListTable.test.tsx` の `data-[state=selected]:bg-ongoing-soft` の assert が red。
- M7 `comparison-cell.tsx` の +/− の class を入れ替える → 前月比の test が red。
- M8 `DepartmentTable.tsx` の `indicatorClassName` を外す → `DepartmentTable.test.tsx` が red。
- M9 StepIndicator の `currentStep === step.num` を `>=` にする → StepIndicator の test（済んだステップが muted）が red。

## Residual Test Gaps

- 色の見え方・受け取り方（操作と完了の言い分け、進行中の緑寄りの違和感、琥珀 pill と②分類の見分け）は自動 test で測れず、L3 だけが oracle（AC-L3-1〜13）。
- jsdom は CSS の詳細度と tailwind の class 生成を評価しないため、F2 / F6 の実描画は L3 と Contract Probe（tailwind-merge の出力）で補う。
- muted の文字が進行中の地の上で 4.13:1 になる点は、owner の答えまで残る（packet の Non-scope）。
