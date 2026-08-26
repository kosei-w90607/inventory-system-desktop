# Plan Packet: 商品一覧 plu filter の returnTo 脱落 fix

## Workflow State

- Phase: plan-gate
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Claude Fable 5（main session）
- Writer: Codex（GPT-5.6、発注書駆動）
- Plan Reviewer: Claude Sonnet 5（独立 fresh context）
- Final Reviewer: Claude Sonnet 5（独立 fresh context）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: pending Plan Gate 承認 / 視覚確認（plu filter 保持 1 項目）+ Ready 承認 / merge

### 遷移記録（append-only）

- 2026-08-26 plan-first commit: `kickoff -> spec-check -> plan-draft -> plan-gate` を本 content commit に相乗りで具現化。証跡: task scope と Risk 判定は本 packet `Risk` 節（kickoff -> spec-check）、Design Readiness が既存設計書の十分性を引用し design phase を skip（spec-check -> plan-draft の許可された唯一の skip）、packet + Test Design Matrix 完備・commit（plan-draft -> plan-gate）。
- forward state-only 予算 3 本の設計: ① plan-approved entry（`plan-gate -> plan-approved -> implementing`）② `independent-review -> human-confirm` ③ `human-confirm -> ready-hosted-final`。`local-verified` への遷移は実装 content commit に相乗り。

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
| REQ-101 / REQ-102 | 51-ui Design Intent Trace | UI-01b-D2 | 保存後の戻りは `/products` + search params のみ許可。search params の完全往復が契約の前提 | return-to.ts（sanitize 無改変） | 既存 sanitize test + T2 / T3 |

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

実装後に記入。exact-HEAD SHA / test 件数は記載しない（D-035 / D-038）。

## Review Response

レビュー後に記入。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
