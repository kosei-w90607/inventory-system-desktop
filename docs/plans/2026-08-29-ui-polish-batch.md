# Plan Packet: UI 表示磨き batch 第 1 弾（10 件）

Plans.md「次の行動」③（UI backlog の表示磨き batch）の第 1 弾。PR #80 / PR #5 / UI-15 / PR #14 の各 L3 owner 所感に起源を持つ非阻害 P3 の表示磨きを 1 PR に束ねる。本 change は新編成の初運用でもある: Writer = Claude Sonnet 5（worktree isolation）、実装後レビューに Opus 5 の修正案 claims-producer round（D-056 の確定 role のまま、§5.4 低制約 profile）+ Codex cross review を置く。

対象外の裁定（owner 相談 2026-08-29 の座組決定に基づく Coordinator 整理、Plan Gate 承認で確定）:
- 「戻り先の検索維持」— 既存 backlog「前の画面へ戻る」導線契約 design-first 候補の所管（owner 裁定要のため本 batch から除外)
- 「状態表現の統一」（hub 3 値 vs 詳細 raw 粒度）— 65 §65.6.1 L134 が「completed_partial は一覧では『有効』に含め、詳細は詳細画面が担う」と**意図的乖離を明文化済み**（PR #13/#14 で確定した設計）。磨き PR で触らず design-first 裁定候補として backlog 残置
- UI-08 prepare failure Alert — CMD/BIZ 契約拡張を要するため既存 backlog どおり別件

## Workflow State

- Phase: implementing
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: b3ca503
- Amendments: none
- Coordinator: Claude Fable 5 (main session)
- Writer: Claude Sonnet 5 (subagent、worktree isolation、§5.6 従来型発注書駆動)
- Plan Reviewer: Claude Sonnet 5 (independent fresh context、Writer とは別 context)
- Final Reviewer: Claude Sonnet 5 (independent fresh context) + Opus 5 修正案 claims-producer round（§5.4 低制約、read-only）+ Codex cross review + Coordinator 裁定
  - Opus 投入の例外記録（manual §3 L36「通常レビューは既存分業を維持」に対する例外、Plan Review round 1 P2-1）: owner 明示の座組決定（2026-08-29「その座組でやってみたいね」）による pilot 投入。目的 = ①保留中の Opus×Sonnet 並走レビュー実験（Plans.md 記録）の「簡単 backlog 水準」較正 ②operator-facing UI 磨きにおける修正案 claims-producer 型の実務検証。read-only・§5.4 低制約・Writer 非割当の D-056 機構は不変。本例外の最終確定は Plan Gate 承認に含める
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner 目視（operator 画面の表示変更 10 件の視認確認、L3-lite 1 回）+ Ready 承認 + merge

Phase 遷移記録（kickoff → spec-check → plan-draft → plan-gate、本 plan-first commit に同乗）: task scope と R2 判定は本 packet に記録。spec-check では表示磨き 10 件の規定 doc 節を全数実査（Coordinator 発注の read-only 調査で file:line / 節番号 / 契約接触の有無を確認）し、既存 docs は「4 件の軽微 doc 追記（Scope 8）を Writer が同 PR で行う」前提で実装十分と判定 — 未解決の設計問題はないため spec-check → plan-draft の許可された skip を適用。編成規律の適合は Coordinator が正本実読で確認済み: D-062 (c) の別 vendor Plan Reviewer 義務は Writer が Codex の packet 限定で本 packet 非適用、manual §2 の Writer ≠ Plan/Final Reviewer + fresh context 独立は別 context 起用で充足、manual §3 L35（希少・高コスト slot を通常実装 Writer に充てない）に Sonnet は非該当、L36 により Opus 5 は read-only Reviewer 発注書ロールのまま（Writer 割り当てなし）。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2（Codex は cross review のみ。Sonnet Writer は subagent のため relay 不要）
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
契約非変更の表示磨きが中心（文言・レイアウト・通知・スクロールの表示挙動）。route/search state・Tauri command DTO・bindings・DB schema・CSV format・merge gate に触れない。backend 変更なし（frontend のみ + 設計 doc の軽微追記 4 箇所）。operator-facing 画面の変更のため owner 目視を Human Gate に置く（Plans.md 注意リストの慣行）。R3 該当行（route/search state / operator workflow の実挙動変更）には至らない — filter・遷移・データ意味論は不変で、見た目と通知の磨きに限定。tie-break の反証（Plan Review round 1 P3-1）: Scope 7(b) の先頭スクロールは SCREEN_DESIGN L263/283/417/419 で既に文書化済みの 4 画面パターンの 5 画面目への水平展開であり新規 workflow 意味論を持ち込まない。Scope 5(a) のマスタ原価反映は既存 mutation（`revisePrice`）へ渡した値の表示反映のみで新規 command / route を要しない。いずれも「不確実なら R3」の不確実性に該当しない。

## Goal

Goal Invariant:

### 最小完了条件

- L3 owner 所感起源の表示磨き 10 件（下記 Scope 1-7 + doc 追記 3 件対応分）が実装され、owner 目視で「磨かれた」と確認できる。既存の画面挙動・データ表示の意味・遷移に回帰がない。

### 失敗定義

- 磨き対象の既存機能（取込み・取消・原価更新・改名・hub 検索）のいずれかに挙動回帰が出る
- summary 構造化で UI-07-D13/D14 の規定項目集合（ID / 日付 / filename / 件数・金額等）から項目が欠落する
- CostDiffDialog の成功表示が「色だけに依存」する形になる（UI-02-D15 違反）
- 追記した doc 文言と実装が不一致になる（doc-code drift の新規持ち込み）

### 非目的

- 「状態表現の統一」「戻り先の検索維持」「UI-08 Alert 改善」（冒頭の対象外裁定どおり）
- 通知基盤（Toaster 設定）の全画面的変更 — 個別通知の改善に留める
- backend / wire / route / filter 意味論の変更（なし）
- 新規 component 依存の追加（既存 shadcn/ui + success token の範囲）

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

1. **日報完了画面の action ボタン行の構造化**: `src/features/daily-report-import/DailyReportImportPage.tsx` L305-345 の `DailyReportResultStep` — 現況は `CardContent className="space-y-4"` 配下に「日次売上を見る」Button と rollback AlertDialog が別々の block 要素として縦積み（flex 行が存在しない）。これを Z004 側 `src/features/csv-import/components/ResultStep.tsx` L67-112 の `flex flex-wrap gap-2` パターンへ**初めて構造化して統一**する（Plan Review round 1 P3-3: 「間隔調整」ではなく構造化）
2. **rollback summary のラベル付き構造化（両 tab）**: `ResultStep.tsx` L91-96 と `DailyReportImportPage.tsx` L332-337 の文字列連結 summary を、ラベル付きの構造化表示（definition list 等）+ 適切な改行へ。**UI-07-D14 の規定項目集合（Z004: ID / 精算日 / filename / 件数 / 金額、日報: ID / 対象日 / source filenames / 総売上 / 純売上）を欠落なく維持**
3. **追加確認 summary の構造化・折返し回避**: `src/features/csv-import/components/AdditionalImportConfirmDialog.tsx` L57-68（両 tab 共有）— **UI-07-D13 の規定項目（import ID / filename(s) / 金額 / 取込み日時）+ scroll 可能一覧 + 省略禁止を維持**したままラベル付き構造化 + 任意位置折返しの回避
4. **CostDiffDialog の成功・エラー表示の Alert 化**: `src/features/receiving/CostDiffDialog.tsx` L113-131 — 手組み `<p>` を既存 success token パターン（`IntegrityCheckPage` の成功 Alert と同型）へ統一。**UI-02-D15（色だけに依存しない・成功/失敗を同じ行で判別）を維持**（role="status" / テキスト判別を保持）
5. **CostDiffDialog の更新成功後表示**: (a) マスタ原価表示（L104-105、prop 固定値）を更新成功後に新値へ反映 (b) footer 文言（L148-159、常時「見送って閉じる」）を全行処理済み時は「閉じる」等の状態対応文言へ
6. **UI-15 改名成功 toast**: `src/features/suppliers/components/RenameSupplierRow.tsx` L33-48 の成功時に `toast.success`（統合 `MergeSupplierDialog.tsx` L63-64 と対称の完了通知）
7. **hub 系 2 件**: (a) 取込み取消の成功通知の視認性改善 — `useCsvImportFlow.ts` L128 / `useDailyReportImportFlow.ts` L136 の `toast.success` について、視認性の改善形（duration 延長・文言強化・ページ内 Alert 併用等）は Writer 提案 + Opus 修正案 round で確定（Toaster 全体設定は変更しない） (b) `InventoryRecordsPage.tsx` へ復元・rollback 完了後の先頭スクロール追加（SCREEN_DESIGN 既存 4 画面パターン〈例 L419「保存成功または command 失敗時はページ先頭へスクロールする」〉の踏襲）
8. **設計 doc の軽微追記 4 箇所（Writer が同 PR で実施、referent 実査済み）**: (a) `61-ui-receiving.md` §61.5 へ「更新成功後はカードのマスタ原価表示を更新後の値へ反映する」1 文 (b) `78-ui-supplier-management.md` §78.6 へ改名成功時の完了通知規定 1 文（§78.7 統合の完了通知規定と対称化） (c) `SCREEN_DESIGN.md` 入出庫履歴節（L236-250）へ既存 4 画面（L263/283/417/419）と同型の先頭スクロール 1 文 (d) `75-ui-integrity-check.md` へ PageHeader title の正式文言を明記
9. **整合性検証の名称統一**: `IntegrityCheckPage.tsx` L185-186 の PageHeader title「在庫整合性チェック」→「**在庫整合性検証**」へ（doc 正本〈75 doc 見出し「在庫整合性検証画面」/ SCREEN_DESIGN L42・62・426「在庫整合性検証」〉に一致させる。サイドバー「整合性検証」〈52 §52.3 メニュー正本表と一致〉は幅制約もあり不変。**統一先の最終確定は Plan Gate 承認に含める**）
10. FE test: 各磨き項目の RTL oracle（Test Design Matrix 参照）。既存 test の削除・無効化・skip 禁止。summary 構造化に伴う既存 assert の文言追随は意味不変の範囲で可
11. commit 分割: 磨き実装（画面群ごとに 1-2 commit）→ doc 追記 → test の順は Writer 裁量、ただし doc 追記と対応実装は同 PR 必須

## Non-scope

- 「状態表現の統一」（§65.6.1 の意図的乖離 — design-first 裁定候補として backlog 残置）
- 「戻り先の検索維持」（導線契約 design-first の所管）
- UI-08 prepare failure Alert（CMD/BIZ 契約拡張要）
- Toaster（`RootLayout.tsx` L69）の position / richColors / duration 等の全画面設定変更
- backend / bindings / route / filter / DB の変更（なし）
- UI-07-D13/D14 の規定項目集合の変更（構造化のみ、集合不変）

## Acceptance Criteria

- AC1: `npm test` green（Matrix T1-T10 の新規・更新 RTL test + 既存 suite）
- AC2: `npm run typecheck` / `lint` / `format:check` / `build` green
- AC3: `cd src-tauri && cargo test` green（backend 無変更の regression 確認）+ `git diff --exit-code src/lib/bindings.ts`（差分ゼロ）
- AC4: UI-07-D13/D14 の項目集合維持 — 構造化後の summary に規定項目の全 token が render される RTL assert（T2 / T3）
- AC5: `rg -c "在庫整合性チェック" src/ --glob '!src/lib/bindings.ts'` = 0（exit 1、旧見出しの全滅。`src/lib/bindings.ts` L290 の 1 件は `integrity_cmd.rs` L10 の Rust doc comment 由来の生成 JSDoc で operator 非可視・backend 非接触の Non-scope により許容 — Plan Review round 1 P1-1）+ `rg -c "在庫整合性検証" src/features/integrity-check/IntegrityCheckPage.tsx` ≥ 1
- AC6: doc 追記 4 箇所（Scope 8）の diff が存在し `bash scripts/doc-consistency-check.sh` ERROR 0
- AC7: `bash scripts/local-ci.sh full` CLEAN（L1、exact-HEAD evidence は PR body 所管）
- AC8: Human Gate に owner 目視を含むため Writer 完了条件に `cargo check --release`（CI gate ではない）

## Design Sources

- Requirements / spec: REQ-105（原価改定系）/ REQ-107（取引先）/ REQ-206（記録追跡）— 表示磨きのため要求追加なし
- Function / command / DTO: [55-ui-csv-import.md](../function-design/55-ui-csv-import.md) §55.2 UI-07-D13（L176-189）/ UI-07-D14（L191-195）、[61-ui-receiving.md](../function-design/61-ui-receiving.md) §61.5 UI-02-D15（L118）、[78-ui-supplier-management.md](../function-design/78-ui-supplier-management.md) §78.6 / §78.7（L110 完了通知）、[65-inventory-record-traceability.md](../function-design/65-inventory-record-traceability.md) §65.6.1（L134 意図的乖離 — 非接触の根拠）、[75-ui-integrity-check.md](../function-design/75-ui-integrity-check.md)、[52-ui-shared-layout.md](../function-design/52-ui-shared-layout.md) §52.3
- Screen / UI: `docs/SCREEN_DESIGN.md` L263 / L283 / L417 / L419（先頭スクロール既存パターン）・L42 / L62 / L426（在庫整合性検証）、`docs/design-system/README.md`
- Decision log / ADR: D-056（Opus role — 本編成の遵守対象）、D-062（Plan Reviewer vendor 規則の適用判定）、manual §2 / §3 / §5.4 / §5.6

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | — | 触らない |
| Command / DTO / generated binding / wire shape | — | 触らない（AC3 で差分ゼロ確認） |
| DB / transaction / audit / rollback / migration | — | 触らない |
| Screen / UI / route state / Japanese wording | 55 §55.2 / 61 §61.5 / 78 §78.6 / SCREEN_DESIGN / 75 doc | existing sufficient + Scope 8 の軽微追記 4 箇所を updated in this PR（Writer 実施） |
| CSV / TSV / report / import / export format | — | 触らない |
| Durable decision / ADR | — | 新規 durable decision なし（名称統一は既存 doc 正本への実装追随） |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| Tauri command / route / 画面 / doc 新設 | — | 該当なし（既存画面の表示磨きのみ） |
| REQ coverage 追加 | — | 該当なし（新規 REQ token なし。既存 test の文言追随のみで token 集合不変。万一 Writer が REQ token 付き test を新設する場合は `generate_traceability` 再生成を完了条件に含める — §5.6） |
| Consultation Relay | — | 不使用 |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| UI-07-D13 / D14 | 55 §55.2 | — | 項目集合は契約、フォーマットは未規定 → 構造化は純表示改善。項目削減は失敗定義 | Scope 2 / 3 | T2 / T3 |
| UI-02-D15 | 61 §61.5 | — | 色だけに依存しない契約を維持したまま success token で視覚統一（IntegrityCheckPage 既存パターン踏襲） | Scope 4 | T4 |
| マスタ原価表示の正確性 | 61 §61.5 + Scope 8(a) 追記 | — | doc は更新後反映を未規定 → 追記で契約化し drift 防止 | Scope 5(a) | T5 |
| 統合との通知対称性 | 78 §78.7 L110（統合の完了通知規定）+ Scope 8(b) 追記 | — | 改名非通知は現行 doc 適合だが、owner 所感の非対称解消には §78.6 追記が正道（無断実装は doc-code drift） | Scope 6 | T6 |
| 先頭スクロール既存パターン | SCREEN_DESIGN L263/283/417/419 + Scope 8(c) 追記 | — | 4 画面既存契約の hub への水平展開。hub 節のみ規定欠落だった | Scope 7(b) | T8 |
| 名称の doc-code 一致 | 75 doc 見出し / SCREEN_DESIGN L42・62・426 / 52 §52.3 | — | doc 正本は「(在庫)整合性検証」で一貫、PageHeader「在庫整合性チェック」のみ逸脱 → 実装側を doc へ寄せる（doc 側を変える案は 3 doc + D1-D10 表現の広域改訂になり不採用） | Scope 9 | T10 |
| §65.6.1 意図的乖離の非接触 | 65 §65.6.1 L134 | PR #13 設計 | 状態表現統一は本 batch 非対象（Non-scope 明記） | — | 既存 test 凍結 |

## Design Intent Audit

- Source docs can answer what/why without chat history: yes — 各磨き項目の規定節・規定の粒度（項目集合 vs フォーマット）を spec-check で全数実査済み
- Plan-only durable decisions promoted: Scope 8 の 4 追記が表示挙動を doc 契約化（Writer 実施、同 PR）
- Assumptions: success token・Alert・toast の既存パターンが design-system に実在（IntegrityCheckPage / MergeSupplierDialog / ResultStep で実査済み）
- Deferred gaps: 状態表現統一・戻り先検索維持・UI-08 Alert（Non-scope、backlog 追跡）
- Test Design Matrix cites decision IDs: yes
- Absolute guarantee self-check: 「項目集合不変」は D13/D14 の規定項目列挙（55 §55.2 実文言）に依存 — Explore 実査で引用済み、Writer は referent を再確認する

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 表示層のみ、adapter 非接触 | — |
| Fact check / design decision split | 全 10 項目の実装 file:line・規定 doc 節・契約接触の有無を read-only 調査で実査（引用は本 packet に転記）。状態表現統一の除外は 65 §65.6.1 L134 実文言に基づく | 本 packet |
| Lifecycle / retry | CostDiffDialog の更新成功 → 表示反映（T5）、toast 表示 → 消滅は既存 Toaster 挙動 | Matrix |
| Operator workflow | 表示磨きのみ、operation 手順不変。L3-lite で視認確認 | Human Gate |
| Replacement path | not applicable | — |
| Data safety / evidence | synthetic のみ | Data Safety 節 |
| Reporting / accounting semantics | 金額・件数の表示値は不変（表示形式のみ） | T2 / T3 |
| Manual verification | owner 目視 1 回（10 件まとめて） | Human Gate |
| 環境・再現性 | 新設の環境依存なし | — |

## Design Readiness

- Existing design docs are sufficient because: 磨き 10 件のうち 7 件は規定 doc がフォーマット未規定（= 純表示改善の余地）で contract 適合のまま実装可能。残り 3 件（マスタ原価反映 / 改名通知 / 先頭スクロール）+ 名称明記は Scope 8 の軽微追記 4 箇所で doc 契約化してから実装（同 PR、未解決の設計問題なし）
- Source docs updated in this PR: 61 §61.5 / 78 §78.6 / SCREEN_DESIGN 入出庫履歴節 / 75 doc（いずれも 1 文級、Writer 実施）
- Design gaps intentionally deferred: Non-scope 3 件
- Durable decisions discovered and promoted: なし（新規 Decision 不要）

Minimum design checks:

- Layer ownership: UI 層のみ（CMD/BIZ/IO 非接触、AC3 で機械確認）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし（bindings 差分ゼロ）
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese wording: 追記 doc 文言と実装文言の一致を review で突合
- Error / empty / retry / recovery: CostDiffDialog の成功/失敗/部分成功の表示分岐を T4 / T5 で固定
- Testability / traceability: 既存 REQ token 集合不変

## Contract Probe

N/A — 未検証の外部前提なし。依存する前提（規定 doc の文言・既存パターンの実在・実装 anchor 行）はすべて spec-check の read-only 調査で実査済み（Impact Review Lenses Fact check 行）。

## Contract Coverage Ledger

R2 のため必須ではないが、契約接触点を明示する（磨きが契約を壊さない方向の検査が主）:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| UI-07-D14: rollback summary の規定項目集合（両 tab） | Scope 2 構造化 | T2（全項目 token render assert） | L3 視認 |
| UI-07-D13: 追加確認の項目 + scroll 一覧 + 省略禁止 | Scope 3 構造化 | T3 | L3 視認 |
| UI-02-D15: 色だけに依存しない成功/失敗判別 | Scope 4 Alert 化 | T4（role="status" + テキスト判別維持） | L3 視認 |
| 61 §61.5 追記: 更新成功後のマスタ原価反映 | Scope 5(a) | T5（更新成功 → 新値 render） | L3 視認 |
| footer 状態対応文言 | Scope 5(b) | T5（全行処理済みで「閉じる」系） | L3 視認 |
| 78 §78.6 追記: 改名完了通知（§78.7 と対称） | Scope 6 | T6（toast.success 呼出し assert） | L3 視認 |
| 取消成功通知の視認性 | Scope 7(a) | T7（改善形確定後に oracle 具体化 — 確定時は**無条件で gated Amendment として Amendments 行へ SHA 記録**する。Plan Gate 後の Matrix 変更に「軽微なら記録不要」の経路は存在しない — Plan Review round 1 P1-2） | L3 視認 |
| SCREEN_DESIGN 追記: hub 先頭スクロール | Scope 7(b) | T8（rollback 完了後 scroll 呼出し assert） | L3 視認 |
| ボタン行 flex パターン統一 | Scope 1 | T1（wrapper 存在 or snapshot 級 assert、形骸化しない範囲で） | L3 視認 |
| 名称 doc-code 一致（在庫整合性検証） | Scope 9 | T10 + AC5（rg 全滅検査） | L3 視認 |
| 65 §65.6.1 意図的乖離の非接触 | — | 既存 test 凍結（AC1 / AC3） | non-scope |

## Test Plan

Test Design Matrix: [test-matrices/2026-08-29-ui-polish-batch.md](test-matrices/2026-08-29-ui-polish-batch.md)（tricky R2 判定: 10 項目 × 契約維持 oracle のため添付）

- targeted tests: T1-T10（RTL、項目集合維持・表示分岐・通知・スクロール・名称）
- negative tests: CostDiffDialog 失敗行の表示維持（T4）、summary 項目欠落の検出（T2/T3 の全 token assert）
- compatibility checks: 既存 suite green（AC1）、backend 無変更（AC3）
- data safety checks: synthetic のみ
- main wiring/integration checks: なし（表示層のみ）
- Human Gate に owner 目視を含むため Writer 完了条件に `cargo check --release`（AC8）

## Boundary / Wire Contract

N/A — JSON / browser state / CSV / config / DTO / bindings / DB 互換のいずれにも非接触（AC3 で bindings 差分ゼロを機械確認）。

## Review Focus

- 項目集合の欠落（D13/D14）— 構造化で 1 項目でも落ちれば P1
- doc 追記文言と実装の一致（Scope 8 の 4 箇所）
- 既存 test の意味を変える改変が「文言追随」を超えていないか
- Opus 修正案 round: UI 磨きの質（間隔・構造・視認性・アクセシビリティ）を `inventory-operator-ui` の観点で — 非 IT の高齢 operator に対する可読性優先、色のみの状態符号化禁止
- toast 追加が既存の通知パターン（文言スタイル・件数情報）と整合するか

## Spec Contract

Contract ID: SPEC-UI-POLISH-BATCH1-2026-08-29

- rollback / 追加確認 summary は UI-07-D13/D14 の規定項目集合を欠落なくラベル付き構造化で表示する
- CostDiffDialog は成功を success token の Alert 系表示 + テキストで示し、更新成功後はマスタ原価の新値と状態対応 footer 文言を表示する
- 取引先改名成功時に完了通知を出す（§78.6 追記と同文言レベル）
- hub は rollback / 復元完了後にページ先頭へスクロールする（SCREEN_DESIGN 既存 4 画面と同型）
- 整合性検証画面の PageHeader title は「在庫整合性検証」（doc 正本一致）

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| UI-07-D13/D14 | Scope 2/3 | T2/T3 | 項目集合欠落 | Matrix |
| UI-02-D15 | Scope 4/5 | T4/T5 | 色非依存維持 | Matrix |
| §78.6 追記 | Scope 6/8(b) | T6 | doc-実装一致 | PR body |
| SCREEN_DESIGN 追記 | Scope 7(b)/8(c) | T8 | 既存 4 画面パターン整合 | PR body |
| 名称一致 | Scope 9/8(d) | T10/AC5 | rg 全滅 | PR body |

## Data Safety

- 実データ・実 DB file は commit しない。test fixture は synthetic のみ
- L3-lite 手順（各画面の表示確認、synthetic seed は最小限）は Ready 依頼と同時に PR body へ記載
- `.local/ci-evidence/` はローカルのみ

## Implementation Results

Scope 1-7, 9 の表示磨きと Scope 8 の doc 追記 4 箇所を実装し、Matrix T1-T8/T10 の RTL oracle を追加した（既存 test の削除・無効化なし、文言追随のみ）。ResultStep / DailyReportResultStep の rollback 確認 summary と AdditionalImportConfirmDialog の追加確認 summary は 3 site 共通のラベル付き `<dl>` 構造化様式に統一し、UI-07-D13/D14 の規定項目集合は維持した。CostDiffDialog は IntegrityCheckPage 踏襲の success token Alert へ統一し、更新成功後のマスタ原価反映と footer 状態対応文言を追加した。RenameSupplierRow に統合と対称の完了 toast を追加、取消完了 toast は個別 duration 延長（T7 gated Amendment、選定根拠は PR body）、InventoryRecordsPage は表示時の先頭スクロールを追加（Scope 7(b) の解釈は PR body に明記）。IntegrityCheckPage の PageHeader title を doc 正本「在庫整合性検証」へ統一。

ローカル gate（typecheck / lint / format:check / npm test / build / cargo test / cargo check --release / bindings.ts 差分ゼロ / doc-consistency-check.sh ERROR 0 / local-ci.sh full）は全て CLEAN。

Draft PR: https://github.com/kosei-w90607/inventory-system-desktop/pull/15

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### Plan Review rally 記録（2026-08-29、append-only）

- round 1（Claude Sonnet 5 独立 fresh context、対象 = plan-first commit `e865aec`）: P1×2（AC5 の rg 対象が生成物 bindings.ts L290〈integrity_cmd.rs L10 の Rust doc comment 由来 JSDoc〉を含み AC3 / Non-scope と自己矛盾 / T7 の「gated Amendment 不要の範囲」に規約根拠なし — Plan Gate 後の packet / Matrix 変更に materiality 閾値の第三経路は存在しない）/ P2×1（Opus round が D-056・manual §3 L36 の投入基準〈難所限定・通常レビューは既存分業維持〉に未適合 — packet の編成検証が vendor 制約のみで投入基準を未検証）/ P3×3（Risk tie-break 反証の明示不足 / SCREEN_DESIGN L34→L42 誤引用 / Scope 1 の「間隔調整」表現が実態〈flex 行の新規構造化〉を過小表現）。Coordinator が P1-1 / P3-2 を rg 実測で独立裏取り（bindings.ts:290 と integrity_cmd.rs:10 の実在、L34 = 入出庫履歴行・L42 = 在庫整合性検証行）し**全 6 件 accept**。是正 = AC5 glob 除外 + 許容差分の根拠明記、T7 の無条件 gated Amendment 化（packet / Matrix 両方 sweep）、Opus 投入の例外記録 1 行（owner 座組決定 2026-08-29 起点、並走実験の簡単水準較正目的、Plan Gate 承認で最終確定）、Risk 反証 2 文、L34→L42 訂正 2 箇所、Scope 1 表現補正

### Plan Gate 承認と implementing 遷移（2026-08-29、append-only）

- round 2 closure（別 Sonnet fresh context、対象 = 是正 commit `b3ca503`）: 6/6 CLOSED（AC5 glob 除外の実測動作確認、例外記録と manual §3 L36 / D-056 実文の literal 突合、SCREEN_DESIGN L42 実文確認を含む）、旧前提 sweep 実質 0（rally 記録内の意図的引用のみ）、delta 起因の新規 findings 0。**P1/P2 残 0**
- owner Plan Gate 承認（2026-08-29、介入 1/3）。承認に含まれる確定 2 点: ①Opus 5 投入の例外適用（manual §3 L36 に対する例外、Workflow State 記載の根拠どおり）②名称統一先 = PageHeader「在庫整合性検証」（サイドバー不変）
- plan-gate → plan-approved → implementing の materialize evidence: 上記 P1/P2=0、plan-first commit `e865aec` + rally 是正 `b3ca503` = Plan Commit が全実装 commit に先行（実装 commit 未作成）、Writer は Claude Sonnet 5 subagent（worktree isolation、発注書駆動）

### 実装後レビュー round 1 記録（Opus 修正案 + Codex cross、2026-08-29、append-only）

- Opus 5 修正案 claims-producer round（§5.4 低制約、対象 = `c88c814..c5298c2`）: P1×2（hub の mount 一律 `scrollPageToTop` が詳細 returnTo 戻りのスクロール位置を毎回失わせる — 既存 5 site は mutation handler 内の event-driven で mount 契機は本 hub のみの新規パターン / 追加確認 dialog 既存分の「ファイル名」に col-span-2 欠落 — 半幅 + break-all で Scope 3 が排除対象とした任意位置折返しを再生産）/ P2×2（T7 の gated Amendment 未記録 / 3 site の dl gap トークン・ラベル語彙の不統一）/ P3×2（duration 延長のみの視認性改善は L3 所感次第で Alert 併用検討余地 / dl が aria-describedby に含まれない既存同型制約）
- Codex cross review: P2×5 / P3×1 + mutation 抜き取り 6 件実測（**survivor 1 = 日報 D14 の filenames を先頭 1 件化しても T2 が GREEN**）。P2-1 = Opus P1-1 同型（mount scroll、T8 は mount 時呼出しのみ固定で回帰未検出）/ P2-2（T2 oracle 弱 — 上記 survivor）/ P2-3 = Opus P2-1 同型（T7 の事前 Amendment 不在）/ P2-4（PR body の L1 evidence が HEAD `c88c814` + TREE_STATE=DIRTY で `c5298c2` の clean exact-content 証跡でない + 遷移 commit subject 非 canonical — local-verified 判定の根拠喪失）/ P2-5（break-all は「任意位置折返し回避」と逆方向、4 箇所）/ P3-1（SCREEN_DESIGN 追記自身による既存例参照の行ずれ）
- Coordinator 裁定（実証: scrollPageToTop の mount effect L82-84 と col-span-2 非対称を worktree 実読で確認、L1 evidence の DIRTY は Codex 実測引用を採用）: **全件 accept**。
  1. Scope 7(b) は本 batch から**除外**（gated Amendment 2）— persistent `<main>` による stale scroll は hub 固有でなく画面横断の事象であり、mount 一律は最基本動線（一覧→詳細→戻る）を壊す。rollback 起点の one-shot 遷移情報は rollback 画面と hub が別 route のため自然な伝搬経路がなく、scroll 復元方針は design-first 裁定候補として closeout で backlog 起票。実装 revert（mount effect + T8 + SCREEN_DESIGN 追記）
  2. T7 は gated Amendment 2 で確定記録（取込み取消 2 toast の duration 8000ms）
  3. T2 を日報 filenames 全件の個別 assert へ強化（Codex mutation survivor の是正）
  4. break-all を break-words へ置換し filenames は full-width / リスト表示化（4 箇所）+ dl gap・ラベル語彙（ID / 金額系）の 3 site 統一（Opus P2-2 併合）
  5. local-verified 判定を取り下げ implementing へ backtrack。是正後の clean exact HEAD で L1 full を再取得し、canonical な state-only 遷移で再実体化
  6. Opus P3-1 は owner L3-lite 所感待ちの disposition、P3-2 はアクセシビリティ磨き候補として closeout で backlog、Codex P3-1 は 7(b) revert により行ずれが自己解消（撤回後に参照先の実位置を再確認）
- 是正のため implementing へ backtrack（本 commit）
