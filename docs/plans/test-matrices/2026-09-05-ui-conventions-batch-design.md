# Test Design Matrix: UI 規約補強 design batch

## Risk

Risk: R2（Coordinator 判断で Test Design Matrix を必須化。理由は Plan Packet「Risk」節参照）

Plan Review round 1（Opus reject / Sonnet approve-with-P2 / owner v2 mockup 決定〈batch 1・2・3〉→ 全件 accept）是正を反映済み。詳細は Plan Packet「Review Response」節。

## Contracts Under Test

- UICONV-D1: `02-component-catalog.md` ⑬ に badge 3 種構成（04-backbone 原則 4 の反映）+ ①状態 tone family マッピング表（owner culling 列つき、実在 Badge のみ file:line 明記）を追加し、新規 DSR は起草しない。
- UICONV-D2: `00-foundations.md` に `--success-border`（`#bbf7d0`）/ `--success-strong`（`#14532d`）を**無条件で**登録する（DSR-22 narrow 化により badge の枠は 3:1 を要求されないため conditional 化は不要）。既存 `--success-soft`/`--success`/`--success-emphasis` は色の値を変更しない（用途セルのみ repoint）。
- UICONV-D3: `01-decision-rules.md` DSR-08 に増減数値の色規則（+ success-strong / − destructive-strong / 0 muted-foreground）を追記し、`00-foundations.md` の `--success`/`--success-emphasis` 用途セルを DSR-08 参照へ repoint する。
- UICONV-D4: badge.tsx の②分類枠線欠落（`--border` 追加が正、`--border-strong` ではない）・①/③種類取り違え・solid pill 2 箇所を runtime gap として記録する。`ProductTable.tsx:84`「反映済み」は owner 承認済み現状として gap から除外する。
- UICONV-D5: `01-decision-rules.md` DSR-01 に primary/secondary（`--secondary` 塗り + `--border` 枠）/outline の 3 段 CTA 階層を追記し、`02-component-catalog.md` ① を同期する。
- UICONV-D6: `02-component-catalog.md` ⑨ の live 型 SearchBar を「可視 Label 必須（既定文言『商品を検索』）+ `aria-label` 廃止（WCAG 2.5.3）」へ書き換える。
- UICONV-D7: `02-component-catalog.md` ⑥ に `Alert` `warning` variant（`bg-card` 据え置き + border `--warning` 確定 + `AlertTriangle`）を規範化する。text 色は候補 (a)/(b)/(c)/(d)（既定候補 c: soft 塗り + border/icon --warning + text --warning-strong、①状態 badge と同じ 4 点構造）を併記し owner v4 決定待ちと明記する。
- UICONV-D9: DSR-23 は lane ⑧（`agent/ui-select-unify`）が登録する。本 packet は新規 DSR を起草しない。
- UICONV-D10: `01-decision-rules.md` DSR-22 の枠 3:1 要件を interactive な操作枠のみへ narrow 化し、`04-backbone.md:20` 原則4②・`review-checklist.md:86` を同期する。

## Failure Modes

- (a) が独立した新規 DSR として起草される、または DSR-23 の番号を本 packet が消費する。
- tone family 表に非実在文言（`差異あり` 等）が残る、または `入力中`/`対象外`/`有効`/`未処理` の誤分類が是正されない。
- `--success-strong`/`--success-border` の値が誤る、`--success-soft` が重複登録される、または `--success-border` が owner v2 決定（無条件登録）に反して conditional のまま残る。
- DSR-08 の増減数値の色規則が catalog ⑬ にも重複して書かれる、または `00-foundations.md` の用途セル repoint が漏れる。
- badge.tsx / button.tsx の runtime gap 記述で枠 token が `--border-strong` のまま残る（owner v2 決定は `--border`）。`反映済み`が誤って runtime gap に戻される。
- DSR-01 の 3 段階層追記で `secondary` の枠が `--border-strong` のまま残る、または「1 画面 1 primary」原則が弱められる。
- SearchBar live 型 Label 反転が commit 型を巻き込む、または `aria-label` 廃止が runtime lane へ先送りされる。
- Alert warning が border 着色（`--warning`）を欠く、または text 色が両論併記されず一方に確定してしまう（v3 owner 決定を先取りする）。
- DSR-22 の badge 3:1 要件が narrow 化されないまま残る、または `04-backbone.md`/`review-checklist.md` との同期が漏れる。
- `src/**` の file が本 commit に混入する。
- Plans.md ⑦ の active link が本 packet の basename と一致しない、または R2-4（条件待ち）が誤って Backlog へ起票される。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| UICONV-D1/D9 | 新規 DSR 起草 | doc-oracle | `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 0 | Writer が独立 DSR-23 を作った場合に非ゼロになり検出 |
| UICONV-D1 | tone family 表の欠落 / 誤配置 | doc-oracle | `rg -Fc "owner culling（残す/外す/追加、原文回答）" docs/design-system/02-component-catalog.md` ≥ 1 かつ同文字列が `01-decision-rules.md` に 0 | 表が catalog 側に無い、または DSR 側に誤って置かれた場合に検出 |
| UICONV-D1 | 非実在文言・誤分類の残存 | doc-oracle | `rg -Fc "差異あり" docs/design-system/02-component-catalog.md` = 0（tone table 内、負のオラクル） | 非実在文言が残る場合に検出 |
| UICONV-D2 | success token 値誤り・conditional 化残存 | doc-oracle | `rg -Fc "#bbf7d0" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "#14532d" docs/design-system/00-foundations.md` ≥ 1、`rg -c "^| Success Soft " docs/design-system/00-foundations.md` = 1 | 値が異なる、Success Soft 行が 2 行になった、または `--success-border` が未登録のままの場合に検出（owner v2 決定は無条件登録） |
| UICONV-D3 | 増減数値の色規則の欠落・重複記載 | doc-oracle | `rg -Fc "増減数値の色は補助シグナルとして重ねる" docs/design-system/01-decision-rules.md` ≥ 1 かつ同一文字列が `docs/design-system/02-component-catalog.md` に 0 | DSR-08 に無い、または catalog ⑬ に重複記載された場合に検出 |
| UICONV-D3 | foundations 用途セル repoint 漏れ | doc-oracle | `rg -Fc "DSR-08 の増減数値色規則を参照" docs/design-system/00-foundations.md` ≥ 2 | `--success`/`--success-emphasis` いずれかの用途セルが repoint されていない場合に検出 |
| UICONV-D4 | badge.tsx 枠 token の誤り | doc-oracle | `rg -Fc "border-border" docs/design-system/02-component-catalog.md` の記述が②分類の runtime gap 文脈にあること（reviewer 目視）。`rg -Fc "border-border-strong" docs/design-system/02-component-catalog.md` が②分類 gap の文脈に無いこと | ②分類の枠 gap 記述が `--border-strong` のまま残っている場合に検出 |
| UICONV-D4 | 反映済みが誤って gap 扱いに戻る | doc-oracle | `rg -Fc "反映済み" docs/design-system/02-component-catalog.md` の周辺に `runtime gap` 文言が付かないこと（reviewer 目視） | `反映済み` が再び runtime gap として記述された場合に検出 |
| UICONV-D5 | DSR-01 3 段階層の欠落・旧文言残存 | doc-oracle | `rg -Fc "それ以外の CTA は 3 段で降格する" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fc "それ以外の CTA は outline / ghost へ降格する。" docs/design-system/01-decision-rules.md` = 0 | 追記漏れ、または旧文言が残った場合に検出 |
| UICONV-D5 | secondary の枠 token 誤り | doc-oracle | `rg -Fc "\`--secondary\` stone-200 塗り + \`--border\` 枠" docs/design-system/01-decision-rules.md` ≥ 1 | `secondary` の枠が `--border-strong` のまま、または枠記述自体が無い場合に検出 |
| UICONV-D5 | catalog ① Do bullet 未同期 | doc-oracle | `rg -Fc "残りは 3 段（\`secondary\` 中間段 → \`outline\` / \`ghost\`）で降格する" docs/design-system/02-component-catalog.md` ≥ 1 | catalog ① が DSR-01 と食い違ったままの場合に検出 |
| UICONV-D6 | live 型 Label 反転の欠落・commit 型巻き込み | doc-oracle | `rg -Fc "live 型も可視" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "live 型は可視 Label を持たない設計" docs/design-system/02-component-catalog.md` = 0 | 反転漏れ、または旧文言が残った場合に検出 |
| UICONV-D6 | aria-label 廃止が runtime lane へ先送りされる | doc-oracle | `rg -Fc "aria-label は廃止する" docs/design-system/02-component-catalog.md` ≥ 1 | catalog 本文で確定せず先送り文言のままの場合に検出 |
| UICONV-D7 | Alert warning variant 未記述・border 未着色 | doc-oracle | `rg -Fc 'variant="warning"' docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "border-warning bg-card" docs/design-system/02-component-catalog.md` ≥ 1 | variant 未記述、または border 着色が漏れた場合に検出 |
| UICONV-D7 | text 色の未決事項が勝手に確定される | doc-oracle | `rg -Fc "owner決定待ち（v4）" docs/design-system/02-component-catalog.md` ≥ 1、4 候補（a/b/c/d）の記述が揃って存在すること（reviewer 目視） | 一方の候補だけが残り決定済みのように書かれた場合に検出 |
| UICONV-D9 | DSR-23 帰属の明記漏れ | doc-oracle | `rg -Fc "DSR-23 の番号は ⑧ が登録する" docs/plans/2026-09-05-ui-conventions-batch-design.md` ≥ 1 | Workflow State 補足からこの取り決めが消えた場合に検出 |
| UICONV-D10 | DSR-22 narrow 化の欠落・旧文言残存 | doc-oracle | `rg -Fc "badge（状態/分類/強調）は 3:1 の対象外" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fc "Badge / outline chip も対象" docs/design-system/01-decision-rules.md` = 0 | narrow 化文言が無い、または旧文言が残る場合に検出 |
| UICONV-D10 | 04-backbone / review-checklist の同期漏れ | doc-oracle | `rg -Fc "枠線（\`--border\`、DSR-22" docs/design-system/04-backbone.md` ≥ 1、`rg -Fc "枠線（隣接背景に対し 3:1、DSR-22）" docs/design-system/04-backbone.md` = 0、`rg -Fc "操作枠 3:1 は interactive 部品限定" docs/quality/review-checklist.md` ≥ 1 | いずれかの file が narrow 化前の旧文言のまま残っている場合に検出 |
| 全体 | `src/**` 混入 | repo-oracle | `git diff --name-only 07302b5..HEAD \| rg "^src/"` の出力が空 | runtime file が 1 件でも混入した場合に検出 |
| 全体 | doc gate 未通過 | CLI | `bash scripts/doc-consistency-check.sh --target plan` | ERROR が 1 件でもあれば検出 |
| Plans.md 同期 | active link 欠落・basename 不一致 | doc-oracle | `rg -Fc "2026-09-05-ui-conventions-batch-design.md" docs/Plans.md` ≥ 1 | リンクが無い、または basename が違う場合に検出 |

## State Lifecycle Matrix

not applicable — 本 change に UI 状態遷移・data lifecycle・cache・route/search・import/export・retry の実装は無い（docs-only、canonical 文言と token 表の改訂のみ）。Workflow State 自体のライフサイクルは `docs/DEV_WORKFLOW.md` の既存契約に従う（本 packet は plan-draft 止まりで、state-only 遷移はまだ発生していない）。

## Adjacent Pattern Audit

借用パターン = 「`variant="outline"` + icon + soft tone の 3 点セット」（①状態 badge）。canonical `StockStatusBadge.tsx` から全 `<Badge>` 使用箇所へ横展開する前提のため、全件を実測列挙する（runtime lane への申し送り、本 packet では変更しない）。

| Source pattern / contract | Repository sites inspected | Ported sites（正しい実装 / owner 承認済み） | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| ①状態 = outline + icon + soft tone（枠は tone 色、3:1 不要） | `rg -n "<Badge" src/features src/components --glob '!*.test.*'` 全件（約 35 箇所） | `StockStatusBadge.tsx:25,34,42`（stockout/low/ok）、`StocktakePage.tsx:396-401`（未入力 N、warning）、`PreviewStep.tsx:75-80`（同日データあり、warning）、`DailyReportImportPage.tsx:164,183`（同日データあり、warning）、`ProductTable.tsx:84`「反映済み」（owner 承認済み現状） | `ProductTable.tsx:79`「未反映」（`variant="secondary"` 取り違え、runtime gap）、`ResultStep.tsx:47`「部分成功」「成功」（tone なし、runtime gap）、`CsvImportRecordDetailPage.tsx:140,192`「取消済み」「明細取消済み」（tone なし、runtime gap）、`DailyReportImportPage.tsx:179`「取込み済み」（`variant="destructive"` 塗り、runtime gap 候補）、`StocktakePage.tsx:404`/`IntegrityCheckPage.tsx:387`「補正済み」（`bg-success` 直接塗り、4種目相当、要移行）、`IntegrityCheckPage.tsx:381`（差異ラベル、owner culling） | 起票時実測、runtime lane で `rg` 再実行し是正状況を確認 |
| ②分類 = secondary pill + `--border` 枠（3:1 不要、owner v2 決定） | 同上 sweep | `ProductImportPreview.tsx:74`（ファイル名）、`PriceRevisionTable.tsx:98`（最近改定） | `ProductTable.tsx:56`「廃番」（`badge.tsx` の secondary variant に枠色が無い、runtime gap: `border-border` 追加）、`ProductTable.tsx:74`「対象外」（`variant="outline"` だが②分類の secondary pill 形ではない、runtime gap） | `badge.tsx:8,13` 実読 |
| ③強調 = 琥珀 pill + `border-warning`（枠 `--warning`、owner v3 決定済み） | 同上 sweep | `ProductImportPreview.tsx:76`（上書き N 件、枠追加 runtime gap）、`ProductRankingTable.tsx:80`（1 位、枠追加 runtime gap） | `BackupRestorePage.tsx:533`「最新」（`variant="secondary"` に取り違え + 枠追加、runtime gap） | `BackupRestorePage.tsx:533`、`ProductRankingTable.tsx:80` 実読 |
| 非 Badge 除外 | 同上 sweep | 該当なし（tone table 対象外） | `PriceRevisionTable.tsx:104`「入力中」（原則15 現在行3点、tone family 対象外）、`CsvImportRecordDetailPage.tsx:194`「有効」（plain span）、`ReturnExchangePage.tsx:90,592`「レジ未処理」（plain text radio ラベル、隣接 Badge「この保存で反映」は owner 承認済みで Non-scope） | `04-backbone.md:31` 原則15、各 file 実読 |
| CTA secondary（Button） | `rg -n 'variant="secondary"' src --glob '!*.test.*'` | 該当なし（0 件） | 全 8 件が `Badge`（上記参照）、`Button variant="secondary"` の既存使用は無い — `--border` 枠追加は既存画面へ無影響 | `rg` 実測（起票時実測節） |

## Negative Paths

- missing input: not applicable（フォーム入力なし）。
- invalid input: not applicable。
- duplicate/ambiguous input: `IntegrityCheckPage.tsx:381` の差異ラベル（複数 tone family に読める）を tone family 表へ機械的に押し込まず owner culling へ回すこと自体が negative path 対応。
- unknown reference: not applicable。
- dependency missing: not applicable。
- permission/write failure: not applicable。
- dry-run side effect: not applicable（docs-only、副作用のある実行コマンドを含まない）。

## Boundary Checks

- threshold: `--success-strong` 対 `--success-soft` の contrast 4.5:1 境界 — 実測 8.71:1 で余裕を持って上回る。`--success-border` 対 `--background` は 1.16:1 で 3:1 に届かないが、DSR-22 narrow 化により badge の枠は 3:1 対象外のため登録の妨げにならない（この論理の整合性が本 change の核心の 1 つ、reviewer 実読で確認）。`--border-strong` 対 `--secondary` は ≈2.94:1 だが owner は `--border` を選んだため 3:1 到達可否は無関係（記録のみ）。
- null/default: not applicable。
- empty/non-empty: not applicable。
- min/max: not applicable。
- status/policy enum: ①状態 tone family マッピング表の各行が warning/success/destructive/中立の 4 分類のいずれかに属し、5 分類目を作らないこと。②分類・③強調・非Badge除外の 3 note が tone family 表とは別建てで存在すること。
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: not applicable（wire 契約なし）。

## Compatibility Checks

- old schema/input: `04-backbone.md` 原則 2/4 の 3 種/4 段という構成、DSR-04/16/21 本文、SearchBar commit 型記述、`--success-soft`/`--success`/`--success-emphasis` の色の値 — いずれも本 PR の diff hunk に含まれないこと（用途セルの文言 repoint は許可、値は不変）。
- new schema/input: 新規追加は `--success-strong`/`--success-border`（両方無条件）の token 行と、catalog/DSR/checklist/04-backbone の追記・narrow 化段落のみ。
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

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? — 該当なし（docs-only）。代わりに: `--success-strong`/`--success-border` の値を `04-backbone.md` の既定値と異なる値へ書き換えたら、どの oracle が落ちるか？ → UICONV-D2 の exact-match oracle。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? — not applicable。
- If a key branch is inverted, which test fails? — DSR-08 の増減数値色規則で `+`/`−` の色指定を入れ替えたら、reviewer 実読でのみ検出（機械オラクルは文の存在のみを見る）。
- If a threshold comparison changes, which test fails? — not applicable（数値しきい値の実装コードなし）。
- If a guard is removed, which test fails? — DSR-01 の「1 画面の主動線（Primary button）は 1 個に絞る」文言を誤って削除したら `rg -Fc "1 画面の主動線（Primary button）は 1 個に絞る" docs/design-system/01-decision-rules.md` が 0 になり検出。
- If an output field is omitted, which test fails? — tone family 表の 1 行（例: destructive）が丸ごと欠落したら AC1 相当のオラクルは通るが行数までは見ない → reviewer 実読で 4 行 + 別建て 3 note の存在を確認する（Residual Test Gaps 参照）。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? — 本 packet の Workflow State は `Reviewed Content HEAD: pending` のままで PR HEAD を書かない（D-035 準拠）。
- If a hosted URL/headSha is committed after the run, does the merge three-point check fail because PR HEAD changed? — 該当は Ready 化以降（本 packet は plan-draft、非該当）。
- If a state-only commit edits Scope/AC in the same packet file, does hunk-level review reject it even though the filename is allowlisted? — 該当は独立レビュー以降（本 commit は plan-draft の是正 content commit であり state-only ではない）。
- If output order changes, which test fails? — not applicable。
- If dry-run performs a side effect, which test fails? — not applicable。
- If a JSON number crosses JavaScript safe integer range, which test fails? — not applicable。
- If a state token is round-tripped through browser/client code, which test fails? — not applicable。

## Residual Test Gaps

- tone family 表の行数と各セルの文言網羅性、②分類/③強調/非Badge除外 note の存在は rg presence oracle だけでは保証できない — reviewer 実読に依存する。
- DSR-08 増減数値色規則の `+`/`−`/`0` と色クラスの対応が入れ替わっていないかは文字列存在オラクルでは検出できない。
- Alert warning の text 色が「両論併記」のまま残っているか（一方だけが確定表現になっていないか）は reviewer 目視に依存する。
- Alert text 色の 4 候補（a/b/c/d）がいずれも catalog に併記され、一方だけが確定表現になっていないかは reviewer 目視に依存する（③強調 pill の枠は v3 で `--warning` に確定済み、この gap は解消済み）。
- badge.tsx/button.tsx の runtime gap 記述が実際に runtime lane で拾われるかは本 packet のスコープ外。
- `formatRecordStatus`/`STATUS_LABELS` 系の残り call site は個別に file:line 検証していない — owner culling で追加候補として扱う。
