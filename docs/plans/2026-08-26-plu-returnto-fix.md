# Plan Packet: 商品一覧 plu filter の returnTo 脱落 fix

## Workflow State

- Phase: ready-hosted-final
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 8dd5164a242014b48261c6238b3f1c2e1c1a96c8
- Amendments: 900c774 4e440cd
- Coordinator: Claude Fable 5（main session）
- Writer: Codex（GPT-5.6、発注書駆動）
- Plan Reviewer: Claude Sonnet 5（独立 fresh context）
- Final Reviewer: Claude Sonnet 5（独立 fresh context）
- Reviewed Content HEAD: f0eacdcdccaa4428e6d163f4bafe521e6772be8c
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: pending merge

### 遷移記録（append-only）

- 2026-08-26 plan-first commit: `kickoff -> spec-check -> plan-draft -> plan-gate` を本 content commit に相乗りで具現化。証跡: task scope と Risk 判定は本 packet `Risk` 節（kickoff -> spec-check）、Design Readiness が既存設計書の十分性を引用し design phase を skip（spec-check -> plan-draft の許可された唯一の skip）、packet + Test Design Matrix 完備・commit（plan-draft -> plan-gate）。
- forward state-only 予算 3 本の設計: ① plan-approved entry（`plan-gate -> plan-approved -> implementing`）② `independent-review -> human-confirm` ③ `human-confirm -> ready-hosted-final`。`local-verified` への遷移は実装 content commit に相乗り。
- 2026-08-26 gated amendment 1: Writer（Codex）の fail-closed 停止起源。`plu` serialize 追加により、既定 search でも returnTo に `plu=all` が含まれるようになり（正規化済み object の既定値明示 serialize という既存 pattern への合流 = 設計適合）、`ProductListPage.test.tsx` の returnTo 期待 literal 2 箇所（integration test）が要同期と判明。Scope へ同 file の literal 追記を追加し AC9 を新設。原 `Plan Commit` は不変。amendment commit SHA の `Amendments` 行への追記は後続 commit で行う（tracked file は自 SHA を持てない、D-035）。独立 delta review は本節の Review Response に記録。
- 2026-08-26 state-only 遷移 commit（予算 ①）: `plan-gate -> plan-approved -> implementing` を具現化。証跡: 独立 Plan Reviewer round 1 が P1/P2 = 0 を報告（本 packet Review Response 参照、記録 commit `dcaf6b9`）、owner が Plan Gate を承認（介入 1 回目 / 予算 3 回）、`Plan Commit` = plan-first commit `8dd5164a242014b48261c6238b3f1c2e1c1a96c8` は実装 commit 未着手のため全実装 commit に先行する。
- 2026-08-26 implementation / local verification: `implementing -> local-verified` を Implementation Results 記録の content commit に相乗りで具現化。証跡: gated amendment 1 を含む Scope の実装、AC1〜AC9 の自己検証、build / parse 両 mutant の red と復元後 green、L1 full の start / end CLEAN。gated amendment 1 と補強 commit を `Amendments` に確定追記した。
- 2026-08-26 state-only 遷移 commit（予算 ②）: `local-verified -> independent-review -> human-confirm` を具現化。証跡: 独立 Sonnet Final Reviewer が Contract Audit を source docs 起点で実行（Ledger 8 param 全数突合 / negative-space 欠落なし / adjacent pattern で第二の脱落 site なし / mutation 2 種の実注入で red・復元 green / AC1〜AC9 独立再検証全 PASS / PR body 整合）、P1/P2 = 0・P3 = 1 を報告し findings は裁定済み（Review Response 参照）。`Reviewed Content HEAD` を監査対象 content commit `f0eacdc` に設定した。
- 2026-08-26 state-only 遷移 commit（予算 ③）: `human-confirm -> ready-hosted-final` を具現化。証跡: owner が視覚確認（dev 画面で plu filter「未反映」設定 → 商品修正 → 保存 → 一覧復帰で filter 維持）を PASS と報告し Ready を承認（介入 2 回目 / 予算 3 回）。本 commit は Draft のまま作成し、この結果 HEAD で L1 full を実行して PR body を全面 refresh 後、Ready 化（hosted CI 発火）は owner 操作で行う。

## Owner Effort Budget

- 介入回数上限: 3（① Plan Gate 承認 ② 視覚確認 + Ready 承認 ③ merge）
- 実働時間上限: 30分
- relay 往復上限: 2（Codex 発注 relay / 完了確認）
- Plan Review round 天井: 3

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
`returnTo` は商品一覧の URL search state を build / parse する route/search state 挙動そのもの。DEV_WORKFLOW Risk Tiers は R3 の対象に `route/search state` を明記し、R2/R3 境界規則も「UI route/search behavior に触れる場合は R3 を選ぶ」と定める。diff は小さいが、影響が operator の filter 状態保持という runtime contract に及ぶため R3。実査正本（[2026-08-26 遷移契約 sweep](../archive/plans/2026-08-26-transition-contract-sweep.md) Lane A）の「小 R2」下馬評は、packet 起草時判定でこの表により R3 へ上方修正した。

## Goal

Goal Invariant:

### 最小完了条件

- 商品一覧で `plu` filter を既定値以外（`target` / `pending` / `synced` / `excluded`）に設定し、新規登録または商品修正を開いて保存・一覧へ戻ったとき、`plu` filter が維持される。

### 失敗定義

- 戻り後に `plu` が `all` へ落ちる。または既存 7 param（`q` / `dept` / `discontinued` / `sort` / `dir` / `page` / `perPage`）の往復保持・UI-01b-D2 の sanitize 契約のいずれかが退行する。

### 非目的

- 戻る導線の設計未定義 gap 8 件（別 packet「戻る導線契約の規範化」で扱う）。
- returnTo 許可 route の拡大、`productListSearchSchema` の変更、consumer hop 側 file（ProductListPage.tsx / ProductTable.tsx / routes/products/new.tsx / routes/products/$code.edit.tsx）の改変。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。

## Scope

- `src/features/products/lib/return-to.ts`: `buildProductListReturnTo` へ `plu` の serialize を追加（`undefined` 時は emit しない、既存 7 param と同型）。`parseProductListSearchFromReturnTo` へ `plu` の復元を追加（既存 `discontinued` / `sort` / `dir` と同型の cast。enum 妥当性は `/products` route の `productListSearchSchema` `.catch` 正規化が所有 — `src/routes/products/index.tsx:12` で結線済みを実読確認）。
- `src/features/products/lib/return-to.test.ts`: plu 用 regression test の追加（Test Design Matrix T1〜T3）。既存 3 test は無改変で維持する（seed 追加は新規 test 内へ隔離）。
- `src/features/products/ProductListPage.test.tsx`（gated amendment 1 で追加）: returnTo 期待 literal 2 箇所への `plu=all` 追記のみ。機序 = ProductListPage は `normalizeProductListSearch` 済み object（既定値がすべて明示 serialize される既存 pattern）を build へ渡すため、`plu` 追加後は既定状態でも `plu=all` が returnTo に含まれる。これは §50.4 既定値 `all` の明示 serialize であり `discontinued=active` 等の既存挙動と同型（設計適合）。test 構造・他 assertion は無改変。
- REQ / UI ID token を含む test 変更のため、`cd src-tauri && cargo run --bin generate_traceability -- --check` を実行し、drift があれば再生成を同 PR に含める。

## Non-scope

- 戻る導線設計未定義 gap 8 件（sweep 正本 Lane A の別区分）、Plans.md backlog の他 entry。
- consumer hop 5 site（ProductListPage.tsx:95 / :263、ProductTable.tsx:94、new.tsx:27、$code.edit.tsx:29）の改変 — root cause 修正で自動享受。
- `search.ts`（schema / normalize）と backend の変更。

## Acceptance Criteria

- AC1（build presence）: `rg -F -c 'params.set("plu"' src/features/products/lib/return-to.ts` が 1 以上。
- AC2（parse presence）: `rg -F -c 'searchParams.get("plu")' src/features/products/lib/return-to.ts` が 1 以上。
- AC3（test presence + green）: `rg -F -c 'plu' src/features/products/lib/return-to.test.ts` が 1 以上、かつ `npx vitest run src/features/products/lib/return-to.test.ts` が exit 0。
- AC4（scope containment / absence）: `git diff --name-only main` の出力に `src/features/products/ProductListPage.tsx`、`src/features/products/components/ProductTable.tsx`、`src/routes/products/new.tsx`、`src/routes/products/$code.edit.tsx`、`src/features/products/search.ts` が含まれない。
- AC5（既存 test 無改変）: `git diff main -- src/features/products/lib/return-to.test.ts` に既存 3 test（`allows only product list route` / `rejects product form/import` / `round-trips product list search params`）の削除・改変 hunk がない（追加 hunk のみ）。
- AC6（frontend gate）: `npm run typecheck` / `npm run lint` / `npm test` がすべて exit 0。
- AC7（traceability）: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0。
- AC8（mutation 感度）: build の `plu` serialize を削除した mutant で T1 / T2 が red になることを Final Review が clean tree 上で実注入・独立再現する（構造推論のみは不可）。
- AC9（gated amendment 1）: `rg -F -c 'plu%3Dall' src/features/products/ProductListPage.test.tsx` が 2（returnTo 期待 literal 2 箇所。fix 未適用時 0 / 適用後 2 の弁別を delta review が実測済み — 裸の `plu` は同 file の一括対象機能 test 由来で fix 前から 7 hit あり非弁別）、かつ `git diff main -- src/features/products/ProductListPage.test.tsx` の hunk が returnTo 期待 literal への `plu` 追記のみ（他 assertion・test 構造の改変なし、review 検分）。

## Design Sources

- Requirements / spec: REQ-907 / SPEC-PLS-D7（plu filter・URL param）、REQ-101 / REQ-102（保存後の一覧復帰）
- Architecture: 触れない（frontend URL state のみ、layer 越境なし）
- Function / command / DTO: [50-ui-product-list.md](../function-design/50-ui-product-list.md) §50.4（URL param 表の `plu` 行 L55、UI-01a-D9 追補）/ §50.8（UI-01a-D10「`plu` URL 復元」）、[51-ui-product-form.md](../function-design/51-ui-product-form.md) UI-01b-D2（returnTo 許可契約）
- DB: 触れない
- Screen / UI: 同上（50-ui / 51-ui）
- Decision log / ADR: なし（確定契約の履行、新規 durable 判断なし）
- 実査正本: [2026-08-26 遷移契約 sweep](../archive/plans/2026-08-26-transition-contract-sweep.md) Lane A「契約乖離 4 hop」

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | — |
| Command / DTO / generated binding / wire shape | 該当なし（bindings 不変） | — |
| DB / transaction / audit / rollback / migration | 該当なし | — |
| Screen / UI / route state / Japanese wording | 50-ui §50.4 / §50.8、51-ui UI-01b-D2 | existing sufficient（確定契約の履行、設計変更なし） |
| CSV / TSV / report / import / export format | 該当なし | — |
| Durable decision / ADR | 該当なし | — |

## Registration / Generation Obligations

- REQ coverage 行のみ該当: REQ / UI ID token を含む test 変更のため `cargo run --bin generate_traceability` の drift 確認・必要時再生成を Scope に含めた（AC7）。
- 他の行（Tauri command / function-design doc / route 新設 / operator 画面新設 / consultation relay）は該当なし。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-907 / SPEC-PLS-D7 | 50-ui §50.4 L55 / §50.2 | UI-01a-D10 | `plu` は URL state 契約 8 param の一員。returnTo だけ 7 param 対応なのは契約乖離であり、schema 側変更（非目的）でなく return-to 側追加で履行する | return-to.ts build / parse | T1 / T2 |
| REQ-101 / REQ-102 | 51-ui §7.1 設計判断 | UI-01b-D2 | 保存後の戻りは `/products` + search params のみ許可。search params の完全往復が契約の前提 | return-to.ts（sanitize 無改変） | 既存 sanitize test + T2 / T3 |

## Design Intent Audit

- Source docs can answer what/why without chat history: 可。50-ui §50.4 L55 が `plu` の値域・既定値・無効値正規化を、51-ui UI-01b-D2 が returnTo 復元を契約済み。
- Plan-only durable decisions found and promoted: なし。parse の cast 方式は既存 pattern の踏襲であり、「無効値は `all` へ正規化」の所有者は §50.4 L55 が既に正本（route 境界の zod `.catch` + `normalizeProductListSearch`）。
- Assumptions and constraints: `/products` route が `productListSearchSchema` を `validateSearch` に結線済み（`src/routes/products/index.tsx:12` 実読確認済み）。
- Deferred design gaps: 戻る導線設計未定義 gap 8 件は別 packet（Plans.md backlog 起票済み）。
- Test Design Matrix cites decision IDs: 可（UI-01a-D10 / UI-01b-D2 / SPEC-PLURT C1〜C4）。
- Absolute guarantee / escape hatch self-check: 「plu が維持される」の例外は無効値投入時の `all` 正規化のみで、§50.4 L55 の既存契約と両立（T3 + route schema が所有）。

## Impact Review Lenses

実査（遷移契約 sweep）起点の change のため記入する。

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | N/A — 外部 adapter なし、frontend 内 URL state のみ | — |
| Fact check / design decision split | 乖離は Coordinator 実読で確認済みの観測事実。契約は確定済み（§50.4 L55 / UI-01b-D2）で新規設計判断なし | 本 packet Risk / Design Sources |
| Lifecycle / retry | 往復 1 周（build -> Link -> 保存 -> parse -> navigate -> schema 正規化）。失敗分岐なし、旧 returnTo（plu なし）は既定値へ | Boundary / Wire Contract、T3 |
| Operator workflow | filter 設定 -> 商品登録/修正 -> 戻りの実順序で絞り込み文脈が維持される（現状は plu だけ喪失） | 視覚確認 1 項目 |
| Replacement path | N/A — 外部システム依存なし | — |
| Data safety / evidence | 合成 fixture のみ。実店舗データ不使用 | Data Safety |
| Reporting / accounting semantics | N/A — 集計・会計に非関与 | — |
| Manual verification | URL state 往復は自動 test で証明可。目視は「filter 保持の体感確認」1 項目のみ、Windows native L3 不要（dev 画面で観測可能） | 視覚確認 slot |
| 環境・再現性 | N/A — 新規環境依存なし | — |

## Design Readiness

- Existing design docs are sufficient because: 50-ui §50.4 L55 が `plu` param（値域 / 既定値 / 無効値正規化）を、§50.8 が「`plu` URL 復元」の test 観点を、51-ui UI-01b-D2 が returnTo の許可契約を既に確定している。本 change はその履行であり設計変更なし。
- Source docs updated in this PR: なし。
- Design gaps intentionally deferred: 戻る導線設計未定義 gap 8 件（別 packet）。
- Durable decisions discovered: なし。

Minimum design checks:

- Layer ownership: UI 層内で完結。CMD/BIZ/IO 不変。
- Backend function design: 触れない。
- Command / DTO / data contract: bindings 不変（AC4 で機械確認）。
- Persistence / transaction / audit impact: なし。
- Operator workflow / Japanese UI wording: 文言変更なし。filter 保持の挙動のみ。
- Error, empty, retry, and recovery behavior: 無効値は route schema の既存正規化が所有、新規 error path なし。
- Testability and traceability IDs: T1〜T3 に UI-01a-D10 / UI-01b-D2 / SPEC-PLURT ID を付与。

## Contract Probe

- N/A — 未検証の外部前提なし。`URL` / `URLSearchParams` は同 file の既存実装で使用実績があり、新規 library / OS 挙動に依存しない。route schema 結線は実読で確認済み（外部前提でなく repo 内実装）。

## Contract Coverage Ledger

touched source-doc sections: 50-ui §50.4（URL State）、§50.8 の関連行、51-ui UI-01b-D2。隣接契約 sweep 済み（§50.4 全 param 行 + 追補、§50.8 の UI-01a-D10 行、51-ui の returnTo 関連は D2 のみ）。

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| 50-ui §50.4 L55 `plu` param（値域・既定値・無効値は `all` へ正規化） | return-to.ts build / parse 追加。無効値正規化は route 側 `productListSearchSchema` `.catch` + `normalizeProductListSearch`（既存・無改変） | T1 / T2 / T3 | 視覚確認 1 項目（filter 保持） |
| 50-ui §50.4 の他 7 param（`q` / `dept` / `discontinued` / `sort` / `dir` / `page` / `perPage`）往復 | return-to.ts 既存実装（無改変） | 既存 test `round-trips product list search params for navigation`（無改変、AC5） | non-scope（退行防止のみ） |
| 50-ui §50.4「filter 変更時 page=1 リセット」 | 触れない — build/parse は param 転記のみで reset 判断を持たない（reset は `updateProductListSearch` 所有、無改変） | — | non-scope（除外） |
| 50-ui §50.4 追補 UI-01a-D9（`normalizedSearch.q` は returnTo 導出専用） | 触れない — 呼び出し側 ProductListPage.tsx:79 は無改変（AC4） | — | non-scope（除外） |
| 50-ui §50.8 UI-01a-D10「`plu` URL 復元」 | returnTo 経由の復元（本 change の主対象） | T2 | 視覚確認 1 項目 |
| 51-ui UI-01b-D2（returnTo は `/products` + search params のみ許可） | sanitizeProductListReturnTo 無改変。parse は sanitize 通過後の値のみ扱う（既存構造維持） | 既存 sanitize 2 test（`allows only...` / `rejects...`、無改変、AC5）+ T2 / T3 | non-scope |

Adjacent Pattern Audit: `productListSearchSchema` の 8 param と build/parse の対応を全数突合 — 欠落は `plu` のみ（実読確認済み）。consumer 5 site（ProductListPage.tsx:95 / :263、ProductTable.tsx:94、new.tsx:27、$code.edit.tsx:29）は returnTo 文字列を素通しするだけで、root cause 修正で自動享受・無改変。

## Test Plan

Test Design Matrix: [test-matrices/2026-08-26-plu-returnto-fix.md](test-matrices/2026-08-26-plu-returnto-fix.md)

- targeted tests: `npx vitest run src/features/products/lib/return-to.test.ts`（T1〜T3 + 既存 3 test）
- negative tests: T3（plu 欠落の旧 returnTo 互換）。無効 enum 値は route schema の既存所有（Matrix に検出境界を明記）
- compatibility checks: plu を含まない旧 returnTo で従来どおり既定値へ（T3）
- data safety checks: 合成 fixture のみ
- main wiring/integration checks: AC4（consumer hop 無改変）+ 視覚確認 1 項目

## Boundary / Wire Contract

- producer: `buildProductListReturnTo`（ProductListPage.tsx:79 で導出、Link search.returnTo として :95 / :263、ProductTable.tsx:94 が送出）
- consumer: `parseProductListSearchFromReturnTo`（routes/products/new.tsx:27、routes/products/$code.edit.tsx:29）→ `navigate` search → `/products` route の `productListSearchSchema`
- wire type: returnTo 文字列内の URL query `plu=all|target|pending|synced|excluded`
- internal type: `ProductListSearch["plu"]`（enum 5 値 | undefined）
- precision/range: enum 5 値のみ。数値・自由文字列なし
- round-trip path: 一覧 → build → Link → form route `search.returnTo` → 保存 → parse → navigate → schema 正規化 → 一覧
- invalid input: parse は既存 pattern どおり cast 素通し。route 境界の zod `.catch(undefined)` → `normalizeProductListSearch` が `all` へ（§50.4 L55 を route 側が所有）
- compatibility: `plu` を含まない旧 returnTo は `plu: undefined` → 既定 `all`。migration 不要

## Review Focus

- schema 8 param と build/parse の全数突合の完全性（第 2 の脱落 param がないこと）
- 既存 3 test 無改変（AC5）での退行防止と、新規 test の oracle 独立性（production 定数から導出しない literal 転記）
- parse の cast 素通し方式が既存 pattern・§50.4 L55 の正規化所有と整合すること
- T1 / T2 の mutation 感度（AC8）

## Spec Contract

Contract ID: SPEC-PLURT-2026-08-26

- C1: `buildProductListReturnTo` は `plu` が undefined でない場合 `plu=<値>` を serialize し、undefined の場合は emit しない。
- C2: `parseProductListSearchFromReturnTo` は `plu` param を `ProductListSearch["plu"]` として復元し、欠落時は undefined を返す。
- C3: sanitize 契約（UI-01b-D2: `/products` 一覧 route と search params のみ許可）は無改変で維持される。
- C4: 既存 7 param の往復挙動は無改変で維持される。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-PLURT C1 | build へ serialize 追加 | T1 / T2 | serialize 条件の同型性 | vitest output + AC1 |
| SPEC-PLURT C2 | parse へ復元追加 | T2 / T3 | cast の既存 pattern 整合 | vitest output + AC2 |
| SPEC-PLURT C3 | sanitize 無改変 | 既存 sanitize 2 test | diff 検分 | AC5 + vitest output |
| SPEC-PLURT C4 | 既存 7 param 無改変 | 既存 round-trip test | diff 検分 | AC5 + vitest output |

## Data Safety

- 実店舗データ・実 DB・実 CSV を commit しない（本 change はそもそも使用しない）。
- `.local/` 配下の evidence は commit しない。
- test fixture は合成値のみ（既存 test の「はさみ」「布」と同型）。

## Implementation Results

- `buildProductListReturnTo` が `plu` を URL param 表の順序で serialize し、`undefined` は emit しないようにした。`parseProductListSearchFromReturnTo` は既存 enum param と同型の cast で `plu` を復元する。
- Matrix T1〜T3 の独立 literal oracle を追加し、既存 sanitize / 7 param round-trip test は無改変で維持した。gated amendment 1 の T4 として、既定 search の returnTo 期待 literal だけを `plu=all` へ同期した。
- test-first の red を確認後に最小実装で green 化した。Writer 事前 mutation では build の serialize 削除と parse の復元削除を個別に実注入し、対象 regression test の red と復元後 green を確認した。
- frontend gate、traceability check、AC1〜AC9、L1 full はすべて通過した。traceability 生成物、bindings、source design docs に drift はなかった。

## Review Response

- Plan Review round 1（2026-08-26、独立 Sonnet Plan Reviewer、fresh context）: P1: 0 / P2: 0 / P3: 2。総合判定 = 承認可。全引用の実在・8 param 全数突合・consumer 5 site の漏れなし・Ledger 隣接契約 sweep の完全性を reviewer が独立実読で確認。
  - P3-1（sweep archive の hop 行番号が要素開始行 `:91` を指し packet は属性行 `:94` を指す表記ずれ）: 裁定 = 記録のみ。archived doc は非遡及（D-038）、packet 側の `:94` 引用が実体と一致することは Coordinator 実読で確認済み。次回 sweep 系 doc 作成時の表記慣習メモとして本行に残す。
  - P3-2（Design Intent Trace の出典見出し表記 `51-ui Design Intent Trace` が実見出し `§7.1 設計判断` と不一致）: 裁定 = accept、同 commit で是正済み。Coordinator が `rg` で 51-ui の実見出しを裏取りした。
- Plan Review rally は round 1 で P1/P2 = 0 収束（天井 3 に対し 1 round）。
- gated amendment 1 delta review（2026-08-26、独立 Sonnet、差分限定）: P1: 0 / P2: 1 / P3: 1。総合判定 = amendment 妥当。機序主張（正規化済み object の既定値明示 serialize）と既存 3 enum との同型性を reviewer が実測で確認、「build 側で既定値を emit しない」代替案は既存 pattern からの逸脱として棄却。
  - P2-1（AC9 の grep `plu` が fix 未適用でも 7 hit で非弁別）: 裁定 = accept。Coordinator 実測で再現（`plu` 7 hit / `plu%3Dall` 0 hit）。AC9 を弁別 literal `plu%3Dall`（fix 後 2 hit）へ差し替え済み。
  - P3-1（Matrix が amendment 1 の scope 拡張に未追随）: 裁定 = accept。Matrix の対象行・T4 行・実行節を追補済み。
- Final Review（2026-08-26、独立 Sonnet、worktree 隔離、Contract Audit）: P1: 0 / P2: 0 / P3: 1。総合判定 = 承認可。Ledger 全行の実装照合・negative-space 欠落なし・adjacent pattern 第二脱落なし・mutation 2 種実注入（AC8 充足、red test 名と復元 green の証跡付き）・AC 全数独立再検証 PASS・PR body 整合。
  - Final Review P3-1（evidence quality: `.npmrc` `ignore-scripts=true` が `pretypecheck` / `prelint` / `pretest` の `tsr generate` を抑止し、fresh checkout では AC6 コマンド実行前に `npm run generate:routes` が必要）: 裁定 = accept・backlog 候補。Coordinator が package.json / .npmrc の前提を実測確認。repo 全体の既存条件で本 PR の欠陥ではない。Post-Merge Closeout で Plans.md backlog へ起票する。
- 第 2 回 Contract Audit（operator-visible state lifecycle 接触時の推奨）は不実施と判断: 実装 diff は `git diff main..HEAD --stat -- src/features/products/lib/return-to.ts` 実測で `2 insertions(+)` に限定され、独立 fresh context のレビュー（本節に記録済みの Plan Review round 1 / gated amendment delta review / Final Review）と Coordinator 実測検分が既に通過しており、negative-space・adjacent pattern とも欠落の指摘がないため比例原則で見送る。
- Findings Freeze: frozen after Broad Audit（Final Review 1 pass 完了時点、2026-08-26）; post-freeze exceptions: none.
