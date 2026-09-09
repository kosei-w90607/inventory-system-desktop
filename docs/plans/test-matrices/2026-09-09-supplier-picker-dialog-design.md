# Test Design Matrix: 取引先ピッカー統合 dialog（design-first）

## Risk

Risk: R2（Coordinator 判断で Test Design Matrix を必須化。理由は Plan Packet「Risk」節参照）

## Contracts Under Test

- SPD-D1: `01-decision-rules.md` に DSR-24（追加導線を伴う master 参照は picker dialog に統一、DSR-23 の例外条項）を新設し、title を「DSR-01〜24」へ更新する。
- SPD-D2: `02-component-catalog.md` ⑧ Dialog / 確認に「picker dialog」小節（構成・動作・dialog 重ね契約 (A) 推奨 / (B) fallback）を追加する。
- SPD-D3: `docs/design-system/reference/mockup-f-supplier-picker.html`（5 状態）を新規追加し、`reference/README.md` に 1 行追加する。
- SPD-D4: `77-ui-bulk-price-revision.md`（REQ-105）に取引先ピッカー dialog 経由の記述を追記する。
- SPD-D5: `51-ui-product-form.md`（UI-01b-D21）に取引先ピッカー dialog + `CreateSupplierDialog` 統合の記述を追記し、`ProductForm.tsx` の独立 3 つ目の inline 実装の撤去を明記する。
- SPD-D6: `78-ui-supplier-management.md`（SPEC-SUP-D2）に名前検索 + scroll 一覧の追加を明記し、§78.12 Deferred から「検索」を外す。
- SPD-D7: `61-ui-receiving.md`（UI-02-D3）は Human Gate (2) 回答待ちのため本 commit・次の実装 commit いずれの対象にもしない。
- SPD-D8: `CreateSupplierDialog` 3 実装（`products/` 版・`suppliers/` 版・`ProductForm.tsx` 内 inline）の統合契約（`(supplier: Supplier) => Promise<void>`）を runtime lane へ申し送る。

## Failure Modes

- owner 確定仕様（`docs/Plans.md` Backlog entry）の内容が変えて書かれる、または未確定の owner culling 対象（自動選択 A/B・入庫記録適用・取引先管理見た目）が owner 回答なしに確定事項として書かれる。
- `CreateSupplierDialog` の並存が「2 実装」のまま記録され、`ProductForm.tsx` の独立 3 つ目の inline 実装が見落とされる。
- dialog 重ねの (A)/(B) tradeoff が書かれず、(A) のみが未検証のまま既定として断定される。WebView2 実機確認義務が runtime lane へ申し送られない。
- DSR-24 の適用条件が曖昧で、部門フィルタ等の非対象候補にまで誤って拡大解釈される、または DSR-01/DSR-23 と矛盾する。
- 入庫記録（61）が Human Gate (2) 未回答のまま「適用する」「適用しない」のどちらかに確定して書かれる。
- `src/**` / `docs/decision-log.md` / `docs/design-system/**` / `docs/function-design/**` の file が本 commit に混入する。
- `docs/Plans.md` の active link が本 packet の basename と一致しない。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPD-D1 | DSR-24 本文・title 更新の欠落 | doc-oracle | `rg -c "^## DSR-24" docs/design-system/01-decision-rules.md` ≥ 1 かつ `rg -Fc "DSR-01〜24" docs/design-system/01-decision-rules.md` ≥ 1（baseline 0 確認済み） | DSR-24 が新設されていない、または title が更新されていない場合に検出 |
| SPD-D1 | 新規 DSR-25 の誤起草 | doc-oracle | `rg -c "^## DSR-25" docs/design-system/01-decision-rules.md` = 0 | DSR-24 の例外条項ではなく独立 DSR を複数作った場合に検出 |
| SPD-D1 | DSR-01/DSR-23 との矛盾 | reviewer 実読 | DSR-24 が「DSR-23 の Select 統一の例外条項」であり「DSR-01 は dialog 内主動線 = 追加の確定 で維持される」ことを明記し、適用条件（追加導線の有無）が判定可能な粒度で書かれていることを確認 | DSR-24 が DSR-23 を無条件に上書きするような書き方、または DSR-01 との整合説明が欠落した場合に検出（automated では検出困難、Residual Test Gaps 参照） |
| SPD-D2 | picker dialog 小節の欠落 | doc-oracle | `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md \| rg -Fc "picker dialog"` ≥ 1（baseline 0 確認済み、更新履歴表の同一文言に釣られないよう本文範囲に限定） | picker dialog 小節が catalog ⑧ に追加されていない場合に検出 |
| SPD-D2 | dialog 重ね契約の (A)/(B) 両論併記漏れ、または WebView2 実機確認義務の申し送り漏れ | doc-oracle + reviewer 実読 | `awk '/^## 更新履歴/{exit}{print}' docs/design-system/02-component-catalog.md \| rg -Fc "focus trap"` ≥ 1（baseline 0 確認済み）かつ reviewer が (A) 推奨・(B) fallback の両方と、(A) の WebView2 実機確認義務（runtime lane AC-L3）が明記されていることを確認 | (A) のみが断定的に書かれ (B) が欠落した場合、または実機未検証である旨が消えた場合に検出（automated では断定/両論の区別まで検出困難、Residual Test Gaps 参照） |
| SPD-D3 | mockup-f 追加・README 同期の欠落 | doc-oracle | `rg -Fc "mockup-f-supplier-picker.html" docs/design-system/reference/README.md` ≥ 1（baseline 0 確認済み） | mockup file が追加されない、または README の一覧表に追記されない場合に検出 |
| SPD-D3 | mockup 内容仕様（5 状態）の記述漏れ | reviewer 実読 | 本 packet「設計判断」節の mockup 内容仕様（一括価格改定・商品登録/修正・取引先管理・自動選択あり・自動選択なしの 5 状態）が次の実装 commit の diff（mockup HTML 本体）と対応していることを確認 | mockup HTML が 5 状態の一部を欠いたまま作られた場合に検出（automated では検出困難、Residual Test Gaps 参照） |
| SPD-D4 | REQ-105 改訂の欠落 | doc-oracle | `rg -Fc "取引先ピッカー" docs/function-design/77-ui-bulk-price-revision.md` ≥ 1（baseline 0 確認済み） | 一括価格改定 filter の取引先選択が picker dialog 経由と明記されていない場合に検出 |
| SPD-D4 | 「取引先未設定の商品も含める」toggle の誤移動 | reviewer 実読 | `77-ui-bulk-price-revision.md` 追記箇所が toggle をフィルタ列に残置する（dialog 内へ移動しない）と明記していることを確認 | toggle が dialog 内へ移動する記述に変わった場合に検出（owner 確定仕様からの逸脱） |
| SPD-D5 | UI-01b-D21 改訂の欠落 | doc-oracle | `rg -Fc "取引先ピッカー" docs/function-design/51-ui-product-form.md` ≥ 1（baseline 0 確認済み） | 商品登録/修正 form の取引先選択が picker dialog 経由と明記されていない場合に検出 |
| SPD-D5 | `ProductForm.tsx` の独立 3 つ目の inline 実装の撤去記述漏れ | reviewer 実読 | `51-ui-product-form.md` 追記箇所が現行 inline 常設パネル（`showSupplierInput` state）の撤去と、validation の `CreateSupplierDialog` への委譲を明記していることを確認 | 「2 実装の統合」としか書かれず `ProductForm.tsx` 独自実装への言及が欠落した場合に検出（発注前提の誤りをそのまま引き継いだ場合の検出） |
| SPD-D6 | SPEC-SUP-D2 改訂の欠落 | doc-oracle | `rg -Fc "名前検索" docs/function-design/78-ui-supplier-management.md` ≥ 1（baseline 0 確認済み） | 取引先管理への名前検索追加が明記されていない場合に検出 |
| SPD-D6 | §78.12 Deferred の「検索」除去漏れ | doc-oracle | `rg -Fc "検索、任意並び替え、paging、bulk rename" docs/function-design/78-ui-supplier-management.md` = 0（現状 baseline 1、改訂後は消えているはずの negative oracle） | 「検索」が Deferred のまま残された場合に検出 |
| SPD-D7 | 入庫記録（61）の owner culling 未回答のまま確定される | reviewer 実読 | `61-ui-receiving.md` が本 commit・次の実装 commit いずれでも変更されておらず（`rg -Fc "取引先ピッカー" docs/function-design/61-ui-receiving.md` = 0）、UI-02-D3 の defer 文言が本 commit の diff hunk に含まれないことを確認 | Human Gate (2) 未回答のまま 61 が改訂された場合に検出 |
| SPD-D8 | `CreateSupplierDialog` 統合契約の記述漏れ | doc-oracle + reviewer 実読 | `rg -Fc "(supplier: Supplier) => Promise<void>" docs/plans/2026-09-09-supplier-picker-dialog-design.md` ≥ 1 かつ reviewer が「3 実装」（`products/`・`suppliers/`・`ProductForm.tsx` inline）を明示的に列挙していることを確認 | 統合契約の宛先が曖昧なまま runtime lane へ渡された場合に検出 |
| 全体 | `src/**` / docs-only 除外領域の混入 | repo-oracle | `git diff --name-only c8e1409..HEAD -- src docs/decision-log.md docs/design-system docs/function-design` の出力が空 | runtime file または編集禁止 docs file が 1 件でも混入した場合に検出 |
| 全体 | doc gate 未通過 | CLI | `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-09-09-supplier-picker-dialog-design.md` および `bash scripts/doc-consistency-check.sh` | ERROR が 1 件でもあれば検出 |
| 全体 | ⑰ との merge 順序記録漏れ | doc-oracle | `rg -Fc "merge 順は ⑰ 先を前提に書く" docs/plans/2026-09-09-supplier-picker-dialog-design.md` ≥ 1 | ⑰ と同じ catalog ⑧ Dialog 節を編集する旨と merge 順の申し送りが Non-scope に記録されていない場合に検出 |
| Plans.md 同期 | active link 欠落・basename 不一致 | doc-oracle | `rg -Fc "2026-09-09-supplier-picker-dialog-design.md" docs/Plans.md` ≥ 1 | リンクが無い、または basename が違う場合に検出 |
| Non-scope 遵守 | 入庫記録・自動選択・取引先管理見た目の owner culling 対象が Scope へ確定混入 | reviewer 実読 | 本 packet の Scope/Acceptance Criteria 節で、上記 3 項目が「owner culling」「Human Gate」の語を伴う未確定表現になっていることを確認 | owner culling 対象が確定事項として Scope へ混入した場合に検出 |

## State Lifecycle Matrix

not applicable — 本 change に UI 状態遷移・data lifecycle・cache・route/search・import/export・retry の実装は無い（docs-only、DSR / catalog / mockup / function-design の draft 記録のみ）。Workflow State 自体のライフサイクルは `docs/DEV_WORKFLOW.md` の既存契約に従う（本 packet は plan-draft 止まりで、state-only 遷移はまだ発生していない）。

## Adjacent Pattern Audit

借用パターン = 「既存の単一実装を canonical とし、他の重複・不整合箇所を横展開で揃える」。`CreateSupplierDialog` の 3 実装統合と、picker dialog パターンの適用先探索がこの形。

| Source pattern / contract | Repository sites inspected | Ported sites（正しい実装／統合の受け皿） | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `CreateSupplierDialog`（取引先追加 dialog） | `rg -n "CreateSupplierDialog" src/features` 全件 + `ProductForm.tsx` の `commands.createSupplier` 直呼び箇所 | `src/features/products/components/CreateSupplierDialog.tsx`（`onCreated: (supplier) => Promise<void>`、統合先として採用） | `src/features/suppliers/components/CreateSupplierDialog.tsx`（`onCreated: () => Promise<void>`、契約拡張が必要）、`ProductForm.tsx:333-389`（独立 3 つ目の inline 実装、撤去対象、発注前提の「2 実装」を訂正） | 起票時実測（本 packet「起票時実測」節）、runtime lane で `rg` 再実行し統合状況を確認 |
| 取引先選択 UI（`Select` + 追加導線） | `ReceivingPage.tsx:399-421`（追加導線なし）、`PriceRevisionFilters.tsx:60-92`、`ProductForm.tsx:302-332`、`SupplierManagementPage.tsx`（選択概念なし、一覧のみ） | `PriceRevisionFilters.tsx` / `ProductForm.tsx` の Select + 追加ボタンを picker dialog へ置換（DSR-24 適用） | `ReceivingPage.tsx`（UI-02-D3 defer、Human Gate (2) 未回答のため現状 Select 維持を Coordinator 推奨） | 起票時実測（本 packet「起票時実測」節）、Human Gate 回答後に runtime lane で再確認 |
| dialog-in-dialog（picker dialog → `CreateSupplierDialog`） | `<Dialog` 使用 5 file 全件（`rg -n "<Dialog[^R]" src --glob '!*.test.*'`）、`MergeSupplierDialog.tsx`（単一 dialog 2-stage、dialog-in-dialog ではない） | 該当なし（先例が無いため runtime lane が新規実装） | 該当なし | Contract Probe（本 packet「Contract Probe」節）、runtime lane AC-L3（Windows WebView2 実機） |

## Negative Paths

- missing input: not applicable（フォーム入力なし、本 packet は draft のみ）。
- invalid input: not applicable。
- duplicate/ambiguous input: `CreateSupplierDialog` 2 file が同名 export で並存すること自体が SPD-D8 の起点であり、統合契約（`(supplier) => Promise<void>` へ 1 本化）はこの negative path への対応そのもの（AC-oracle は「統合契約が記録されている」ことの存在確認で代替、実装は runtime lane）。
- unknown reference: not applicable。
- dependency missing: not applicable。
- permission/write failure: not applicable。
- dry-run side effect: not applicable（docs-only、副作用のある実行コマンドを含まない）。

## Boundary Checks

- threshold: picker dialog の一覧の scroll しきい値（何件から scroll 箱になるか）は本 packet では確定しない（`max-height` 等の具体値は runtime lane）。
- null/default: 取引先選択の sentinel（フィルタ文脈「すべての取引先」/ 入力文脈「取引先なし」）は既存 2 パターンをそのまま picker dialog の先頭行として維持することを明記（catalog:draft 参照、AC5 の reviewer 実読対象）。
- empty/non-empty: 取引先 0 件時の picker dialog 内表示（EmptyState 相当）は本 packet では確定しない（runtime lane、既存 EmptyState 契約を再利用する想定）。
- min/max: not applicable。
- status/policy enum: not applicable（`Supplier`/`SupplierWithUsage` の field 増減なし）。
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: not applicable（`list_suppliers`/`createSupplier` の wire 契約は不変）。

## Compatibility Checks

- old schema/input: DSR-23 本文、`list_suppliers`/`createSupplier` の wire、UI-02-D3 本文（Human Gate (2) が (a) を選ばない限り）— いずれも本 PR の diff hunk に含まれないこと。
- new schema/input: 新規追加は DSR-24・catalog picker dialog 小節・mockup-f・function-design 3 doc（77/51/78）の draft のみ（本 commit では packet 内記述のみ、canonical docs 本体は次の実装 commit）。
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
- effective config reaches runtime: not applicable（picker dialog の draft は本 packet の記録のみ、runtime 反映は別 packet）。
- CLI arg reaches implementation: not applicable。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? — 該当なし（docs-only、runtime assertion なし）。代わりに: `CreateSupplierDialog` の実装数を「3」から「2」へ書き換える改変をしたら、どの oracle が落ちるか？ → automated では検出できず reviewer 実読（AC8 の reviewer 実読対象）に依存する（Residual Test Gaps 参照）。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? — not applicable。
- If a key branch is inverted, which test fails? — dialog 重ね契約を「(B) 推奨・(A) fallback」へ反転させたら、AC5 の rg オラクル（`focus trap` の存在）は通ったままになる → reviewer 実読で (A)/(B) の推奨順を確認する（Residual Test Gaps 参照）。§78.12 の「検索」除去（AC9a）を無断で書き戻したら AC9a が復活し検出できる。
- If a threshold comparison changes, which test fails? — not applicable（数値しきい値の実装コードなし）。
- If a guard is removed, which test fails? — DSR-24 の「適用条件」段落（追加導線の有無）を削除したら、AC1 の rg オラクルは通ったままになる → reviewer 実読で適用条件の有無を確認する必要がある（Residual Test Gaps 参照）。
- If an output field is omitted, which test fails? — function-design 3 doc（77/51/78）の draft から 1 doc 分の記述が丸ごと欠落したら、AC7/AC8/AC9a/AC9b は doc ごとに個別 anchor を持つため該当 doc の AC のみ落ちる。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? — 本 packet の Workflow State は `Reviewed Content HEAD: pending` のままで PR HEAD を書かない（D-035 準拠）。
- If a hosted URL/headSha is committed after the run, does the merge three-point check fail because PR HEAD changed? — 該当は Ready 化以降（本 packet は plan-draft、非該当）。
- If a state-only commit edits Scope/AC in the same packet file, does hunk-level review reject it even though the filename is allowlisted? — 該当は独立レビュー以降（本 commit は plan-first content commit であり state-only ではない）。
- If output order changes, which test fails? — not applicable。
- If dry-run performs a side effect, which test fails? — not applicable。
- If a JSON number crosses JavaScript safe integer range, which test fails? — not applicable。
- If a state token is round-tripped through browser/client code, which test fails? — not applicable。

## Residual Test Gaps

- dialog 重ね契約が DSR-01/DSR-23 と矛盾していないか、(A) 推奨・(B) fallback の順序が正しいか、DSR-24 の適用条件が過不足なく書かれているかは rg presence oracle だけでは保証できない — Plan Review / Final Review の reviewer 実読に依存する。
- mockup-f の 5 状態がすべて実装されているか（README への 1 行追加のみでは内容の網羅性は検証できない）は reviewer 実読に依存する。
- `CreateSupplierDialog` の「3 実装」という事実訂正が function-design doc（51）へ正確に転記されるかは reviewer 実読に依存する（automated では「言及がある」ことの内容までは検証できない）。
- 入庫記録（61）の owner culling は Human Gate (2) の回答を待つ必要があり、本 packet の docs-only lane では機械 oracle 化できない（回答後、別 commit または gated amendment で反映）。
- dialog-in-dialog の実機挙動（focus trap / ESC / 外クリック伝播）は本 packet の範囲外（runtime lane 実装後の Windows native L3、AC-L3）。
