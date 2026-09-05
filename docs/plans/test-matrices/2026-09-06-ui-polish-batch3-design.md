# Test Design Matrix: UI 磨き batch 3 design

## Risk

Risk: R2（Coordinator 判断で Test Design Matrix を必須化。理由は Plan Packet「Risk」節参照）

## Contracts Under Test

- UIB3-D1: `02-component-catalog.md` ① に説明セクション使用パターン（`space-y-1` wrapper、`actions` と併存可能）を追加し、`docs/function-design/60,67,68` に説明文 3 案（owner culling）を追加する。
- UIB3-D2: `01-decision-rules.md` DSR-22 に記録 ID 表示方針（3 案、owner culling、推奨 (b)）を注記として追加する。
- UIB3-D3: `02-component-catalog.md` ③「直近実績サマリテーブル」に備考列規則（必須列・空欄表示 owner culling〈推奨「—」〉・truncate+title、`MovementTable.tsx` 共有 7 画面を含む）と A1(a)(b)(c) 統合（文言統一・列見出し・囲み是正）を追記する。
- UIB3-D4: `ManualSalePage.tsx:739` の記録状態を既存 5 箇所と揃える runtime gap を記録する（design 側の記述変更なし。tone は ⑦ 決定済み、枠色トークンは Lane 5→⑦ の間で移行中）。
- UIB3-D5: `SupplierManagementPage.tsx` に加え `ReceivingPage.tsx` / `ManualSalePage.tsx` / `ReturnExchangePage.tsx` / `DisposalPage.tsx` の計 5 画面の間隔・`subtitle` 消失 runtime gap を記録し、`PageHeader.tsx:29-36` の root-cause fix（`actions` 分岐内で `<h1>`+`<p>` を `space-y-1` にまとめる、`PageHeader.test.tsx:61-73` は green のまま）を推奨案として catalog ① に明記する。
- UIB3-D6: `02-component-catalog.md` ③ の使用トークン行に、共通 formatter（`formatStockDisplay`/`formatStockUnitLabel`）使用ルールを 1 文追記する。

## Failure Modes

- 発注前提の誤り（`PageHeader` の `description` prop、原則 8、囲みの実態）がそのまま正として書かれる。
- 記録 ID・説明文・備考空欄表示の owner culling 対象が、owner 回答なしに確定事項として書かれる。
- DSR-12 / DSR-16 / `04-backbone.md` 原則 9 の既存ルール本文が変更される（具体例の追加ではなく規則自体の書き換えになる）。
- `ManualSalePage.tsx` の状態表示是正に、既存 5 箇所と異なる新しい tone / 表示形式が提案される。
- L8-2 / L8-4 / L8-5 が Scope へ混入する、または L8-4 が Backlog へ誤って起票される。
- 廃棄・破損記録が備考規則の対象に誤って含まれる（note フィールドが存在しないため矛盾する）。
- `src/**` の file が本 commit に混入する。
- `docs/Plans.md` の active link が本 packet の basename と一致しない。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| UIB3-D1 | 説明セクションパターンの欠落 | doc-oracle | `rg -Fc "説明セクション" docs/design-system/02-component-catalog.md` ≥ 1 | catalog ① に使用パターンが追加されていない場合に検出 |
| UIB3-D1 | 説明文3画面の欠落 | doc-oracle | `rg -Fc "CSVファイルから複数の商品をまとめて登録・更新するページです" docs/function-design/60-ui-product-import.md` ≥ 1、`rg -Fc "レジのPLU登録状況を書き出すページです" docs/function-design/67-ui-plu-export.md` ≥ 1、`rg -Fc "アプリのデータ全体をまとめて保存し" docs/function-design/68-ui-backup-restore.md` ≥ 1（Plan Review round 1 是正 P1 — 旧 anchor `レジ登録状況を読み込む`/`未反映から外す` は `67-ui-plu-export.md` に既に 3 件/6 件存在する false oracle だったため、baseline 0 確認済みの新規文へ差替え） | いずれかの画面の説明文が本文に追加されていない場合に検出 |
| UIB3-D2 | 記録ID方針が断定的に確定事項として書かれる | doc-oracle + reviewer 実読 | `rg -Fc "owner culling" docs/design-system/01-decision-rules.md` ≥ 1 かつ reviewer が DSR-22 該当箇所を実読し「決定」ではなく「案」の書き方になっていることを確認 | owner culling の体裁が無く既決事項として書かれた場合に検出 |
| UIB3-D2 | 新規 DSR-23 の誤起草 | doc-oracle | `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 0 | DSR-22 拡張ではなく独立 DSR を作った場合に検出 |
| UIB3-D3 | 備考規則・A1統合の欠落 | doc-oracle | `rg -Fc "備考は" docs/design-system/02-component-catalog.md` ≥ 1、`rg -F "truncate + \`title\`" docs/design-system/02-component-catalog.md` の hit ≥ 1、`rg -Fc "直近 {N} 件の" docs/design-system/02-component-catalog.md` ≥ 1（Plan Review round 1 是正 P2 — 素の「備考」「truncate」「直近」は catalog に既存 baseline 非 0〈`truncate`=2、`直近`=3〉の false oracle だったため、baseline 0 確認済みの複合文字列へ差替え） | 備考列規則・A1 統合が catalog ③ に追加されていない場合に検出 |
| UIB3-D3 | `MovementTable.tsx` 共有 7 画面の記録漏れ | reviewer 実読 | catalog ③ 追記箇所が `MovementTable.tsx:57,92-94`（`"—"` + truncate のみ、`title` 欠落）を現存 gap として引用していることを確認 | 7 画面共有の既存箇所が起票時実測から漏れていた場合に検出 |
| UIB3-D3 | 囲み是正方向の誤り（他画面へ箱を追加する記述） | reviewer 実読 | catalog ③ 追記箇所を実読し、「`ManualSalePage.tsx` の内側の枠を外す」方向で書かれていること（「他 3 画面に箱を足す」になっていないこと）を確認 | DSR-16 の明文と矛盾する是正方向が書かれた場合に検出（automated では検出困難、Residual Test Gaps 参照） |
| UIB3-D3 | 廃棄・破損が誤って備考規則の対象に含まれる | reviewer 実読 | catalog ③ 追記箇所に廃棄・破損が対象外（Non-scope）と明記されていることを確認 | 廃棄・破損が備考列必須の対象に誤って含まれた場合に検出 |
| UIB3-D4 | 新しい tone / 表示形式の誤提案 | doc-oracle | `rg -Fc "variant=\"outline\"" docs/design-system/02-component-catalog.md docs/design-system/01-decision-rules.md` の新規 hit が本 packet の diff に無いこと（本 packet は catalog/DSR 本文を変更しない contract） | design 側に新しい記述が追加された場合に検出 |
| UIB3-D4 | Lane5→⑦ 枠色移行の記録漏れ | reviewer 実読 | 「起票時実測」節が `badge.tsx:16` の `outline` variant について main（`border-border`）と `agent/ui-list-backbone-d-lane5`（`border-border-strong`）の差分、および ⑦ の DSR-22 narrow 化（`--border` 方向）との逆行を明記していることを確認 | Lane 5 と ⑦ の枠色方向の矛盾が記録されず「既存 5 箇所は完成形」と誤って断定された場合に検出 |
| UIB3-D5 | 4 追加画面（subtitle 消失）の記録漏れ | doc-oracle | `rg -Fc "ReceivingPage.tsx:288" docs/plans/2026-09-06-ui-polish-batch3-design.md` ≥ 1、`rg -Fc "ManualSalePage.tsx:303" docs/plans/2026-09-06-ui-polish-batch3-design.md` ≥ 1、`rg -Fc "ReturnExchangePage.tsx:411" docs/plans/2026-09-06-ui-polish-batch3-design.md` ≥ 1、`rg -Fc "DisposalPage.tsx:278" docs/plans/2026-09-06-ui-polish-batch3-design.md` ≥ 1 | multiline sweep で見つかった 4 画面のいずれかが packet 本文から漏れた場合に検出（本 packet 自身に対する self-check） |
| UIB3-D5 | PageHeader component gap の記録漏れ・是正方向の反転漏れ | doc-oracle + reviewer 実読 | `rg -Fc "PageHeader.test.tsx:61-73" docs/plans/2026-09-06-ui-polish-batch3-design.md` ≥ 1 かつ reviewer が catalog ① 追記箇所の推奨が (b) root-cause fix 一本化になっていることを確認（(a) 使用パターン単独推奨のままになっていないか） | component gap の記録漏れ、または (a)/(b) 併記のまま反転されていない場合に検出（automated では反転の有無までは検出困難、Residual Test Gaps 参照） |
| UIB3-D6 | 単位表示ルールの欠落 | doc-oracle | `rg -Fc "formatStockDisplay" docs/design-system/02-component-catalog.md` ≥ 1 | 共通 formatter 使用ルールが catalog ③ に追加されていない場合に検出 |
| 全体 | `src/**` 混入 | repo-oracle | `git diff --name-only 07302b5..HEAD \| rg "^src/"` の出力が空 | runtime file が 1 件でも混入した場合に検出 |
| 全体 | doc gate 未通過 | CLI | `bash scripts/doc-consistency-check.sh --target plan` | ERROR が 1 件でもあれば検出 |
| 全体 | ⑦ との merge 順序記録漏れ | doc-oracle | `rg -Fc "先に merge した側が勝ち" docs/plans/2026-09-06-ui-polish-batch3-design.md` ≥ 1 | ⑦ と同じ 2 file（catalog、DSR-22）+ 更新履歴表を編集する旨と再実行手順が Workflow State に記録されていない場合に検出 |
| Plans.md 同期 | active link 欠落・basename 不一致 | doc-oracle | `rg -Fc "2026-09-06-ui-polish-batch3-design.md" docs/Plans.md` ≥ 1 | リンクが無い、または basename が違う場合に検出 |
| Non-scope 遵守 | L8-2/L8-4/L8-5 の混入 | reviewer 実読 | 本 packet の Scope/Non-scope 節に L8-2/L8-4/L8-5 への言及が「参照のみ」であり Scope に含まれていないことを確認 | 対象外項目が Scope へ混入した場合に検出 |

## State Lifecycle Matrix

not applicable — 本 change に UI 状態遷移・data lifecycle・cache・route/search・import/export・retry の実装は無い（docs-only、canonical 文言と使用パターンの追記のみ）。Workflow State 自体のライフサイクルは `docs/DEV_WORKFLOW.md` の既存契約に従う（本 packet は plan-draft 止まりで、state-only 遷移はまだ発生していない）。

## Adjacent Pattern Audit

借用パターン = 「既存の単一実装を canonical とし、他の重複・不整合箇所を横展開で揃える」。備考規則（`ReturnExchangePage.tsx` の `hasNote`/`formatNote`）・記録状態Badge（既存 5 箇所の `<Badge variant="outline">`）・単位表示（`formatStockDisplay`/`formatStockUnitLabel`）の 3 件がこの形。

| Source pattern / contract | Repository sites inspected | Ported sites（正しい実装） | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 備考の空欄表示（`?? "—"` / `"—"` リテラル） | `ReceivingPage.tsx` / `ReturnExchangePage.tsx` / `ManualSalePage.tsx` / `DisposalPage.tsx` / `MovementTable.tsx`（7 画面共有）の note 関連コード全件 + アプリ全体の `"—"` 空値リテラル 27 箇所 | `MovementTable.tsx:92-94`（`"—"`、7 画面共有、canonical 候補。Plan Review round 1 是正 P1 — 当初は少数派の `ReturnExchangePage.tsx` 薄字「備考なし」を canonical 候補としていたが、`?? "—"` 5 箇所/4 file・`"—"` 27 箇所/16 file の多数派へ反転） | `ReceivingPage.tsx:689`（素の空文字、runtime gap）、`ManualSalePage.tsx:715-745`（備考列自体が無い、runtime gap）、`DisposalPage.tsx`（note フィールド無し、対象外）、`ReturnExchangePage.tsx:103-110,963-969`（薄字「備考なし」、少数派だが owner culling の対抗案として残す） | 起票時実測（本 packet「起票時実測」節）、runtime lane で `rg` 再実行し是正状況を確認 |
| 記録状態 Badge（`<Badge variant="outline">{formatRecordStatus(...)}</Badge>`） | `rg -n "formatRecordStatus" src/features` 全件 | `InventoryRecordsPage.tsx:369`、`ManualSaleRecordDetailPage.tsx:123`、`ReceivingRecordDetailPage.tsx:115`、`DisposalRecordDetailPage.tsx:117`、`ReturnRecordDetailPage.tsx:144` | `ManualSalePage.tsx:739`（plain text、runtime gap） | `ManualSalePage.tsx:739` 実読 |
| 単位表示（`formatStockDisplay`/`formatStockUnitLabel`） | `rg -n "stock_unit" src/features --glob '!*.test.*'` 全件 | `ProductTable.tsx:70`、`ProductListTable.tsx:86`、`StockMovementsPage.tsx:126-129`、`StockDetailContent.tsx:81-84` | 9 箇所の重複 local `formatQuantity`（`DisposalPage.tsx:84` 他、起票時実測節にリスト、runtime gap） | 起票時実測（本 packet「起票時実測」節）、runtime lane で `rg` 再実行し是正状況を確認 |

## Negative Paths

- missing input: not applicable（フォーム入力なし）。
- invalid input: not applicable。
- duplicate/ambiguous input: 記録 ID が種別ごとに重複しうる（一意でない）こと自体が L8-9 の起点であり、一覧列削除案 (b) はこの negative path への対応そのもの（表への強制表示をしないことをテストする — AC4 の owner culling 存在オラクルで代替）。
- unknown reference: not applicable。
- dependency missing: not applicable。
- permission/write failure: not applicable。
- dry-run side effect: not applicable（docs-only、副作用のある実行コマンドを含まない）。

## Boundary Checks

- threshold: 備考欄の truncate 文字数しきい値は本 packet では確定しない（`max-w-*` クラスの具体値は runtime lane、`title` 属性による全文確認を必須条件として明記するのみ）。
- null/default: 備考が `null`/空文字のときの表示が owner culling 対象（本 packet では 2 択のいずれかに確定しない）。
- empty/non-empty: 記録 ID 一覧の「0 件表示」等は既存 EmptyState 契約のまま変更しない。
- min/max: not applicable。
- status/policy enum: `formatRecordStatus` の 3 値（有効/取消済み/進行中）が本 packet で増減しないこと（Badge 化は表示形式のみの変更）。
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: not applicable（wire 契約なし）。

## Compatibility Checks

- old schema/input: `04-backbone.md` 原則 9 本文、DSR-12/DSR-16 本文、`formatRecordStatus` の 3 値定義、廃棄・破損記録のデータモデル（note フィールド無し）— いずれも本 PR の diff hunk に含まれないこと。
- new schema/input: 新規追加は catalog ①/③ の使用パターン段落と DSR-22 の注記、function-design 3 doc の説明文候補のみ。
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
- effective config reaches runtime: not applicable（formatter 参照ルールは本 packet では注記のみ、runtime 反映は別 packet）。
- CLI arg reaches implementation: not applicable。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? — 該当なし（docs-only、runtime assertion なし）。代わりに: 記録 ID 方針の推奨案 (b) の理由づけ（記録詳細ページが ID を表示しない実測）を削除・改変したら、どの oracle が落ちるか？ → automated では検出できず reviewer 実読に依存する（Residual Test Gaps 参照）。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? — not applicable。
- If a key branch is inverted, which test fails? — 囲み是正方向を「他 3 画面に箱を足す」へ逆転させたら、AC5 の rg オラクル（「備考は」「truncate + `title`」「直近 {N} 件の」の存在）は通ったままになる → reviewer 実読で DSR-16 整合性を確認する（Residual Test Gaps 参照）。空欄表示の推奨（「—」）を「備考なし」へ無断で戻したら、Plan Review round 1 の反転根拠（`?? "—"` 5 箇所/4 file 対 1 file）が消え、reviewer 実読でのみ検出できる。
- If a threshold comparison changes, which test fails? — not applicable（数値しきい値の実装コードなし）。
- If a guard is removed, which test fails? — 「owner culling」という体裁の文言（AC4 のオラクル文字列）が DSR-22 追記から削除されたら AC4 が 0 になり検出。
- If an output field is omitted, which test fails? — 説明文 3 案の表から 1 画面分の行が丸ごと欠落したら、AC2a/b/c は画面ごとに個別 anchor を持つため該当画面の AC のみ落ちる（Plan Review round 1 是正で 3 画面個別オラクル化、旧 AC2 の PLU 単独検証から改善済み）。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? — 本 packet の Workflow State は `Reviewed Content HEAD: pending` のままで PR HEAD を書かない（D-035 準拠）。
- If a hosted URL/headSha is committed after the run, does the merge three-point check fail because PR HEAD changed? — 該当は Ready 化以降（本 packet は plan-draft、非該当）。
- If a state-only commit edits Scope/AC in the same packet file, does hunk-level review reject it even though the filename is allowlisted? — 該当は独立レビュー以降（本 commit は plan-first content commit であり state-only ではない）。
- If output order changes, which test fails? — not applicable。
- If dry-run performs a side effect, which test fails? — not applicable。
- If a JSON number crosses JavaScript safe integer range, which test fails? — not applicable。
- If a state token is round-tripped through browser/client code, which test fails? — not applicable。

## Residual Test Gaps

- 囲み是正方向（`ManualSalePage.tsx` 側を外す vs 他 3 画面へ足す）が DSR-16 と整合しているかは rg presence oracle だけでは保証できない — Plan Review / Final Review の reviewer 実読に依存する。
- 説明文 3 案の各文が file:line 根拠と正しく対応しているか（根拠の引用そのものが正確か）は reviewer 実読に依存する（AC2a/b/c は文が存在することのみを検証し、根拠表の正確性までは検証しない）。
- `PageHeader.tsx` の `actions`/`subtitle` 排他という component gap が catalog ① の記述に正確に反映されているかは reviewer 実読に依存する（automated では「gap の記述がある」ことの内容までは検証できない）。
- 記録 ID 方針・備考空欄表示・説明文 3 案が owner culling 完了後に実際に catalog / DSR / function-design 本文へ反映されるかは本 packet のスコープ外（次の Plan Gate 通過 Writer が行う別 commit に依存する運用上のギャップ）。
