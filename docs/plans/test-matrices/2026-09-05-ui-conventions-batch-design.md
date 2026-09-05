# Test Design Matrix: UI 規約補強 design batch

## Risk

Risk: R2（Coordinator 判断で Test Design Matrix を必須化。理由は Plan Packet「Risk」節参照）

## Contracts Under Test

- UICONV-D1: `02-component-catalog.md` ⑬ に badge 3 種構成（04-backbone 原則 4 の反映）+ ①状態 tone family マッピング表（owner culling 列つき）を追加し、新規 DSR は起草しない。
- UICONV-D2: `00-foundations.md` に `--success-border`（`#bbf7d0`）/ `--success-strong`（`#14532d`）を登録し、既存 `--success-soft`/`--success`/`--success-emphasis` は変更しない。
- UICONV-D3: `01-decision-rules.md` DSR-08 に増減数値の色規則（+ success-strong / − destructive-strong / 0 muted-foreground）を追記する。
- UICONV-D4: badge.tsx の②分類枠線欠落・①状態/③強調の種類取り違え（`ProductTable.tsx`/`BackupRestorePage.tsx`）を runtime gap として記録し、design 側の規約は変更しない。
- UICONV-D5: `01-decision-rules.md` DSR-01 に primary/secondary/outline の 3 段 CTA 階層を追記し、`02-component-catalog.md` ① を同期する。
- UICONV-D6: `02-component-catalog.md` ⑨ の live 型 SearchBar を「可視 Label 必須（既定文言『商品を検索』）」へ書き換える。
- UICONV-D7: `02-component-catalog.md` ⑥ に `Alert` `warning` variant（`bg-card` 据え置き + text/icon 着色）を規範化する。
- S9: `04-backbone.md`「foundations への追記分」表の該当備考欄に反映記録を追記する（原則本文は不変）。

## Failure Modes

- (a) が独立した新規 DSR として起草され、`04-backbone.md:44`「DSR 新設なし」と矛盾する。
- `--success-soft`（既存）が新規登録として重複記載される、または `--success-border`/`--success-strong` の値が `04-backbone.md` の既定値（`#bbf7d0`/`#14532d`）と異なる。
- DSR-08 の増減数値の色規則が catalog ⑬ にも重複して書かれ、diff が UICONV-D3 の想定より大きくなる。
- badge.tsx runtime gap の記述が「design を緩める」書き方になり、原則 4 の②分類枠線要件と矛盾する。
- DSR-01 の 3 段階層追記が「1 画面 1 primary」の既存原則を弱める書き方になる。
- SearchBar live 型 Label 反転が commit 型の既存記述（Label あり）を巻き込んで変更してしまう。
- Alert warning variant が Badge の soft 背景 3 点セットをそのまま持ち込み、`default`/`destructive` の `bg-card` 共通性を崩す。
- `src/**` の file が本 commit に混入する。
- Plans.md ⑦ の active link が本 packet の basename と一致しない、または R2-4（条件待ち）が誤って Backlog へ起票される。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| UICONV-D1 | 新規 DSR 起草 | doc-oracle | `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 0 | Writer が独立 DSR-23 を作った場合に非ゼロになり検出 |
| UICONV-D1 | tone family 表の欠落 / 誤配置 | doc-oracle | `rg -Fc "owner culling（残す/外す/追加、原文回答）" docs/design-system/02-component-catalog.md` ≥ 1 かつ同文字列が `01-decision-rules.md` に 0 | 表が catalog 側に無い、または DSR 側に誤って置かれた場合に検出 |
| UICONV-D2 | success token 値の誤り・重複登録 | doc-oracle | `rg -Fc "#bbf7d0" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "#14532d" docs/design-system/00-foundations.md` ≥ 1、`rg -c "^| Success Soft " docs/design-system/00-foundations.md` = 1 | 値が異なる、または Success Soft 行が 2 行になった場合に検出 |
| UICONV-D3 | 増減数値の色規則の欠落・重複記載 | doc-oracle | `rg -Fc "text-success-strong" docs/design-system/01-decision-rules.md` ≥ 1 かつ `rg -Fc "text-success-strong" docs/design-system/02-component-catalog.md` = 0 | DSR-08 に無い、または catalog ⑬ に重複記載された場合に検出 |
| UICONV-D4 | design 側の②分類定義が緩められる | doc-oracle | `rg -Fc "枠線（隣接背景に対し 3:1" docs/design-system/04-backbone.md` ≥ 1（原則 4 本文の枠線要件が残っている） | Writer が原則 4 本文を誤って書き換えた場合に検出（本 packet は本文不変が契約） |
| UICONV-D5 | DSR-01 3 段階層の欠落・旧文言残存 | doc-oracle | `rg -Fc "それ以外の CTA は 3 段で降格する" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fc "それ以外の CTA は outline / ghost へ降格する。" docs/design-system/01-decision-rules.md` = 0 | 追記漏れ、または旧文言が残った場合に検出 |
| UICONV-D5 | catalog ① Do bullet 未同期 | doc-oracle | `rg -Fc "残りは 3 段（\`secondary\` 中間段 → \`outline\` / \`ghost\`）で降格する" docs/design-system/02-component-catalog.md` ≥ 1 | catalog ① が DSR-01 と食い違ったままの場合に検出 |
| UICONV-D6 | live 型 Label 反転の欠落・commit 型巻き込み | doc-oracle | `rg -Fc "live 型も可視" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "live 型は可視 Label を持たない設計" docs/design-system/02-component-catalog.md` = 0、commit 型の `rg -Fc "検索欄（commit 型" docs/design-system/02-component-catalog.md`（見出し想定文言）の該当箇所に diff hunk が無いこと（reviewer 目視） | 反転漏れ、または commit 型記述が誤って変更された場合に検出 |
| UICONV-D7 | Alert warning variant 未記述・soft 背景形の誤採用 | doc-oracle | `rg -Fc 'variant="warning"' docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "bg-warning-soft" docs/design-system/02-component-catalog.md` の新規 hit が warning variant 定義行に含まれないこと（reviewer 目視、既存 Badge 引用行との区別） | variant 未記述、または Alert に Badge 形の soft 背景を誤って採用した場合に検出 |
| 全体 | `src/**` 混入 | repo-oracle | `git diff --name-only 07302b5..HEAD \| rg "^src/"` の出力が空 | runtime file が 1 件でも混入した場合に検出 |
| 全体 | doc gate 未通過 | CLI | `bash scripts/doc-consistency-check.sh --target plan` | ERROR が 1 件でもあれば検出 |
| Plans.md 同期 | active link 欠落・basename 不一致 | doc-oracle | `rg -Fc "2026-09-05-ui-conventions-batch-design.md" docs/Plans.md` ≥ 1 | リンクが無い、または basename が違う場合に検出 |

## State Lifecycle Matrix

not applicable — 本 change に UI 状態遷移・data lifecycle・cache・route/search・import/export・retry の実装は無い（docs-only、canonical 文言と token 表の改訂のみ）。Workflow State 自体のライフサイクルは `docs/DEV_WORKFLOW.md` の既存契約に従う（本 packet は plan-draft 止まりで、state-only 遷移はまだ発生していない）。

## Adjacent Pattern Audit

借用パターン = 「`variant="outline"` + icon + soft tone の 3 点セット」（①状態 badge）。canonical `StockStatusBadge.tsx` から全 `<Badge>` 使用箇所へ横展開する前提のため、全件を実測列挙する（runtime lane への申し送り、本 packet では変更しない）。

| Source pattern / contract | Repository sites inspected | Ported sites（正しい実装） | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| ①状態 = outline + icon + soft tone | `rg -n "<Badge" src/features src/components --glob '!*.test.*'` 全件（約 35 箇所、features 配下） | `StockStatusBadge.tsx:25,34,42`（stockout/low/ok）、`StocktakePage.tsx:396-401`（未入力 N、warning）、`PreviewStep.tsx:75-80`（同日データあり、warning、Gated Amendment 5 先例）、`DailyReportImportPage.tsx:163-172` の `requiresAdditionalConfirm` 分岐（warning） | `ProductTable.tsx:74`「対象外」（outline だが tone class なし、owner culling 対象）、`ProductTable.tsx:79`「未反映」（`variant="secondary"` に取り違え、runtime gap）、`ProductTable.tsx:84`「反映済み」（`variant="default"` に取り違え、runtime gap）、`IntegrityCheckPage.tsx:381`（差異ラベル、tone family 表に含めず owner culling） | 起票時実測（本 packet「起票時実測」節）、runtime lane で `rg` 再実行し是正状況を確認 |
| ②分類 = secondary pill + 枠線 3:1 | 同上 sweep | `ProductImportPreview.tsx:74`（ファイル名）、`PriceRevisionTable.tsx:98`（最近改定、Clock3 icon） | `ProductTable.tsx:56`「廃番」（`variant="secondary"` だが `badge.tsx` の secondary variant に枠色が無く枠線要件を満たさない、runtime gap） | `badge.tsx:8,13` 実読（境界色の有無） |
| ③強調 = 琥珀 pill（`variant="default"`） | 同上 sweep | `ProductImportPreview.tsx:76`（上書き N 件） | `BackupRestorePage.tsx:533`「最新」（`variant="secondary"` に取り違え、原則 4 の例示「最新」と食い違う、runtime gap） | `BackupRestorePage.tsx:533` 実読 |

## Negative Paths

- missing input: not applicable（フォーム入力なし）。
- invalid input: not applicable。
- duplicate/ambiguous input: `IntegrityCheckPage.tsx:381` の差異ラベル（複数 tone family に読める）を tone family 表へ機械的に押し込まず owner culling へ回すこと自体が negative path 対応（表への強制当てはめをしないことをテストする — AC1 の owner culling 列存在オラクルで代替）。
- unknown reference: not applicable。
- dependency missing: not applicable。
- permission/write failure: not applicable。
- dry-run side effect: not applicable（docs-only、副作用のある実行コマンドを含まない）。

## Boundary Checks

- threshold: `--success-strong` 対 `--success-soft` の contrast 4.5:1 境界 — 実測 8.71:1 で余裕を持って上回ることを WCAG 相対輝度公式で確認済み（本 packet「設計判断」節）。
- null/default: not applicable。
- empty/non-empty: not applicable。
- min/max: not applicable。
- status/policy enum: ①状態 tone family マッピング表の各行が warning/success/destructive/中立の 4 分類のいずれかに属し、5 分類目を作らないこと（catalog ⑬ 本文の reviewer 目視）。
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: not applicable（wire 契約なし）。

## Compatibility Checks

- old schema/input: `04-backbone.md` 原則 2/4 本文、DSR-04/16/21/22 本文、SearchBar commit 型記述、`--success-soft`/`--success`/`--success-emphasis` の既存値 — いずれも本 PR の diff hunk に含まれないこと（`git diff` で該当行番号にハンクが無いことを reviewer が確認）。
- new schema/input: 新規追加は `--success-border`/`--success-strong` の 2 token 行と、catalog/DSR/checklist/04-backbone の追記段落のみ。
- output order: not applicable。
- optional field behavior: not applicable。

## Data Safety Checks

- source-derived data: not applicable。
- generated outputs: not applicable（`generate_traceability` 等の生成物に触れない）。
- secrets: not applicable。
- local-only files: not applicable。
- synthetic sample boundaries: not applicable。

## Main Wiring / Integration Checks

- helper connected to main path: not applicable（docs-only）。
- output reaches manifest/report: not applicable。
- effective config reaches runtime: not applicable（token 値は本 packet では登録のみ、runtime 反映は別 packet）。
- CLI arg reaches implementation: not applicable。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? — 該当なし（docs-only、runtime assertion なし）。代わりに: `--success-border`/`--success-strong` の値を `04-backbone.md` の既定値と異なる値へ書き換えたら、どの oracle が落ちるか？ → AC3 の `#bbf7d0`/`#14532d` exact-match oracle。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? — not applicable。
- If a key branch is inverted, which test fails? — DSR-08 の増減数値色規則で `+`/`−` の色指定を入れ替えたら、reviewer 実読（AC4 は文字列存在のみを見るため symbol-to-color 対応の逆転automatedでは検出しない。Review Focus に明記し reviewer 実読で担保する — Residual Test Gaps 参照）。
- If a threshold comparison changes, which test fails? — not applicable（数値しきい値の実装コードなし）。
- If a guard is removed, which test fails? — DSR-01 の「1 画面 1 primary」文言自体を誤って削除したら `rg -Fc "1 画面の主動線（Primary button）は 1 個に絞る" docs/design-system/01-decision-rules.md` が 0 になり検出（AC5 の compatibility check に含める）。
- If an output field is omitted, which test fails? — tone family 表の 1 行（例: destructive）が丸ごと欠落したら AC1 の表存在オラクルは通るが行数までは見ない → reviewer 実読で 4 行（warning/success/destructive/中立）の存在を確認する（Residual Test Gaps 参照）。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? — 本 packet の Workflow State は `Reviewed Content HEAD: pending` のままで PR HEAD を書かない（D-035 準拠）。
- If a hosted URL/headSha is committed after the run, does the merge three-point check fail because PR HEAD changed? — 該当は Ready 化以降（本 packet は plan-draft、非該当）。
- If a state-only commit edits Scope/AC in the same packet file, does hunk-level review reject it even though the filename is allowlisted? — 該当は独立レビュー以降（本 commit は plan-first content commit であり state-only ではない）。
- If output order changes, which test fails? — not applicable。
- If dry-run performs a side effect, which test fails? — not applicable。
- If a JSON number crosses JavaScript safe integer range, which test fails? — not applicable。
- If a state token is round-tripped through browser/client code, which test fails? — not applicable。

## Residual Test Gaps

- tone family 表の行数（4 行: warning/success/destructive/中立）と各セルの文言網羅性は rg presence oracle だけでは保証できない — Plan Review / Final Review の reviewer 実読に依存する。
- DSR-08 増減数値色規則の `+`/`−`/`0` と `success-strong`/`destructive-strong`/`muted-foreground` の対応が入れ替わっていないかは文字列存在オラクルでは検出できない（reviewer 実読）。
- badge.tsx runtime gap の記述が実際に runtime lane で拾われるかは本 packet のスコープ外（Plans.md ⑦ の申し送り文言が次 lane 起票時に読まれることに依存する運用上のギャップ）。
