# Plan Packet: UI 表示磨き batch 第 2 弾

## Workflow State

- Phase: human-confirm
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: 316cd094011071985174f16b0107978520350798
- Amendments: none
- Coordinator: Fable（Claude Code session、conductor）
- Writer: Codex（本 session）
- Plan Reviewer: Sonnet subagent（fresh context）一次 + Fable 裁定（round 1 = P1 0 / P2 1 / P3 2 全件 accept、是正 commit fe0e76c2bf2fa442aef7cf4d1b94cbe34b28fa1d、条件付き round 2 で P1/P2 = 0 成立）
- Final Reviewer: Sonnet subagent（fresh context、Plan Reviewer とは別個体）+ Fable 裁定（2026-08-30、P1/P2 = 0・P3 = 1〈evidence 記録改善、本 narrative で反映〉、Goal Invariant 充足 = yes。監査は再生成 commit 9a26d97 まで延長済み）
- Reviewed Content HEAD: 9a26d977f7372ce81ea18d0bd7c3748aa9cd2a71
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Plan Review、L3、Ready、merge

Phase 遷移記録（本 plan-first content commit に同乗）: `kickoff -> spec-check -> design -> plan-draft -> plan-gate`。kickoff で発注書の 6 件、branch、R2、停止点を固定した。spec-check で対象 component、既存 RTL、`src-tauri/src/db/product_repo.rs::merge_suppliers` の `products` / `receiving_records` 更新後の source `DELETE`、および Design Sources の実在節を `rg` と直接読取で確認した。design で文言契約 3 件を `50 §50.6 / §50.8`、`61 §61.1 UI-02-D15 / §61.5 / §61.9`、`78 §78.7 / §78.11` へ同期し、scroll と構造是正は既存 `UI-11b-D11 / D12`、`DSR-16 / DSR-17` で十分と判定した。plan-draft で本 Packet と Matrix を作成し、両者を同一 plan-first commit に載せて plan-gate を materialize する。実装は Coordinator の `plan-approved` 合図まで開始しない。

2026-08-30: Plan Review round 2 の再確認内容（Final Review P3 の記録改善提案を反映して明記）: (1) fe0e76c の P2-1 是正が処方どおり L100 の `REQ-103`→`REQ-907` 1 token 置換のみで同行他要素が不変であること (2) Trace 3 行が行別一択処方（該当 REQ なし〈QR-05 起点〉/ REQ-209 / REQ-904）と一致すること (3) Matrix へ L3 目視行が追加されたこと — を Coordinator が実 diff で検証し、Plan Reviewer の条件付き round 2 判定（処方 verbatim 適用時に P1/P2 = 0）の成立条件を確認した。

2026-08-30: 実装 candidate c832077 の L1 full は traceability gate T1 で FAIL（RTL の REQ token 追加に伴う 90-traceability.md 生成結果不一致 — PR #72 と同型の既知 gap、発注書の品質 gate に再生成を明記しなかった Coordinator 起因）。機械的是正として Haiku subagent が generate_traceability を再実行し 9a26d97 を commit（diff = 生成 file 1 file・件数 bump 2 箇所のみ）。Final Reviewer が監査を 9a26d97 まで延長し、生成器由来であること・`--check` ERROR 0 を独立再現、P1/P2 = 0 と Goal Invariant 充足を維持と判定。L1 full は 9a26d97 で RESULT=PASS（evidence は PR body を正とする）。この state-only commit は既評価の `implementing -> local-verified -> independent-review -> human-confirm` を materialize する。残る Human Gate は Windows native L3、Ready、merge。

この state-only commit は `plan-gate -> plan-approved -> implementing` を materialize する。Plan Commit `316cd09` は全実装 commit に先行し PK5 ancestry を充足する。

## Owner Effort Budget

- 介入回数上限: 4
- 実働時間上限: 45分
- relay 往復上限: 2
- Plan Review round 天井: 3

承認依頼は `この change での介入 N 回目 / 予算 4 回` と、承認後に利用者から見て完了する内容を 1 文で示す。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
日本語の説明文、既存 helper の条件付き呼出し、既存 markup / class の構造是正だけを扱う。route、search state、Tauri command wire / DTO、generated bindings、DB、transaction は変更しない。Home scroll は新規方針ではなく、確定済み UI-11b-D12 / DSR-17 分類③を既存 mount effect に結線する実装である。operator-facing の表示契約は RTL と Windows native L3 で検証し、R3 の境界変更やデータ意味論変更には達しない。

## Goal

Goal Invariant:

### 最小完了条件

- operator が原価差分、取引先統合、PLU 一括の各 dialog で、選択が何を変え何を変えないか、および直前操作の状態を文言から読み取れる。
- 復元成功 Alert は Home 先頭で必ず視認でき、flag なしの通常 Home 到達は scroll 位置を変更しない。
- 原価差分の複数商品を見出しで識別でき、整合性検証の補正結果を行区切りで読める。

### 失敗定義

- 新文言が本 Packet の Design Intent Trace と source function-design の契約に一致しない。
- one-shot flag なしの Home 到達で scroll が発火する。
- 既存 test が削除、無効化、skip される。
- route、command wire、generated bindings、DB / Rust 実装に diff がある。

### 非目的

- CostDiffDialog の再表示ボタン。
- 取消 toast と Alert の併用。
- hub の位置復元。
- dialog の既存 `aria-describedby` 制約の是正。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。

## Scope

1. `src/features/receiving/CostDiffDialog.tsx`: 入庫保存済み、更新の効果、見送りの非効果を説明文に明記する。
2. `src/features/suppliers/components/MergeSupplierDialog.tsx`: stage 2 に source が一覧から削除され、商品・入庫記録が target へ引き継がれる旨を追加する。
3. `src/features/products/components/PluBulkTargetConfirmDialog.tsx`: 現在の絞り込みに一致しない商品は変更されない旨を追加する。
4. `src/features/home/HomePage.tsx`: UI-11b-D11 の mount effect で flag を consume した場合だけ `scrollPageToTop()` を呼ぶ。flag あり / なしの RTL を追加する。
5. `src/features/receiving/CostDiffDialog.tsx`: 商品名を `dd` から明示見出しへ格上げし、複数の一意見出し付き summary card とする。
6. `src/features/integrity-check/IntegrityCheckPage.tsx`: fix summary の `ul` を `divide-y` にし、per-item の rounded border を除く。
7. 対応 RTL と presence oracle を追加し、既存 suite を維持する。
8. Phase A で文言 3 件の source function-design を同期し、Packet / Matrix / `Plans.md` と独立 plan-first commit にする。

## Non-scope

- route、URL search params、navigation、command registration、DTO、bindings、Rust、DB schema / query / transaction の変更。
- CostDiffDialog の dismiss / retry / update state、PLU bulk 対象計算、supplier merge の実処理、復元 success flag の生成・寿命の変更。
- 共通 Dialog primitive、共通 Alert、共通 scroll helper、OperationLogsPage の変更。
- Goal の「非目的」4 件。

## Acceptance Criteria

- AC1: 文言 3 件が source function-design と実装で一致し、Matrix の `rg -F -c` presence oracle は各要素句が `>= 1`、置換する CostDiffDialog 旧説明全文が `0` になる。
- AC2: CostDiffDialog の 3 契約点と複数商品の見出し、MergeSupplierDialog の削除 + 引き継ぎ、PLU 一括の filter 外非変更が RTL で観測できる。
- AC3: UI-11b-D12 の flag あり mount で `scrollPageToTop()` が 1 回発火し、flag なし mount では 0 回である。D11 の StrictMode、同一 mount 表示寿命、再訪時消失の既存 tests は green のまま。
- AC4: IntegrityCheckPage の補正結果が 1 つの `divide-y` list と行 padding で render され、各 `li` に per-item `rounded-md border` がない。
- AC5: 追加 / 更新 RTL と既存 frontend tests が green。既存 test の削除、無効化、skip は 0 件。
- AC6: `npm run lint`、`cargo fmt --check`、`bash scripts/doc-consistency-check.sh` が exit 0。check と commit は別実行し、doc checker は file 直書き出力と exit を明示確認する。
- AC7: `git diff --stat` の対象外 file は 0。`git add` は明示パスだけを使い、commit 前の `git diff --cached --name-only` と Scope を突合する。Rust / route / wire / DB diff は 0。
- AC8: push 後の `git ls-remote` が local commit と同じ remote branch ref を返し、Draft PR body に local / hosted evidence と未完 Human Gate を更新する。
- AC9: Writer は Phase B 完了前に `cargo check --release` を通し、その後の Final Review / Windows native L3 / Ready / merge は Coordinator 側へ停止して引き渡す。

## Design Sources

- Requirements / spec: REQ-907 / UI-01a-D11、REQ-209 / UI-02-D15、REQ-107 / SPEC-SUP-D4 / D6、REQ-904 / UI-13-D5、UI-11b-D11 / D12。
- Architecture: [ARCHITECTURE.md](../ARCHITECTURE.md)（UI -> CMD -> BIZ -> IO/MNT。今回は UI のみ）。
- Function / command / DTO: [50-ui-product-list.md](../function-design/50-ui-product-list.md) §50.2 UI-01a-D11 / §50.6 / §50.8、[61-ui-receiving.md](../function-design/61-ui-receiving.md) §61.1 UI-02-D15 / §61.5 / §61.9、[68-ui-backup-restore.md](../function-design/68-ui-backup-restore.md) §68.5 UI-11b-D11 / D12、[75-ui-integrity-check.md](../function-design/75-ui-integrity-check.md) §75.2 UI-13-D5 / §75.5、[78-ui-supplier-management.md](../function-design/78-ui-supplier-management.md) §78.2 SPEC-SUP-D4 / D6 / §78.7 / §78.11。
- DB: `src-tauri/src/db/product_repo.rs::merge_suppliers`（fact check のみ。products / receiving_records の参照更新後に source supplier を DELETE。変更対象外）。
- Screen / UI: [SCREEN_DESIGN.md](../SCREEN_DESIGN.md)、[UI_TECH_STACK.md](../UI_TECH_STACK.md)、[01-decision-rules.md](../design-system/01-decision-rules.md) DSR-16 / DSR-17、[02-component-catalog.md](../design-system/02-component-catalog.md) Dialog。
- Decision log / ADR: DSR-16、DSR-17。新規 durable decision なし。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 78 §78.2 D4 + `product_repo.rs` | existing sufficient / fact check only |
| Command / DTO / generated binding / wire shape | 既存 generated bindings | existing sufficient / intentionally untouched |
| DB / transaction / audit / rollback / migration | SPEC-SUP-D4 | existing sufficient / intentionally untouched |
| Screen / UI / route state / Japanese wording | 50 §50.6、61 §61.5、68 §68.5、75 §75.5、78 §78.7、DSR-16 / DSR-17 | wording 3 件は updated in this plan-first commit、その他 existing sufficient |
| CSV / TSV / report / import / export format | — | not applicable |
| Durable decision / ADR | DSR-16 / DSR-17 | existing sufficient、新規決定なし |

## Registration / Generation Obligations

該当なし。新規 command、route、operator 画面、function-design doc、REQ coverage は追加しない。bindings / route tree / traceability の生成義務を発生させない。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-209 / SPEC-PRV-D8 | 61 §61.1 / §61.5 / §61.9 | UI-02-D15 | 保存済み入庫と任意のマスタ更新を混同させない。自動更新、見送り時の入庫取消、再表示ボタンは採用しない | `CostDiffDialog.tsx` | Matrix T1 / T6 |
| REQ-107 | 78 §78.2 / §78.7 / §78.11 | SPEC-SUP-D4 / D6 | backend の source DELETE と参照付替えを最終確認前に明示する。不可逆性だけの抽象警告では削除対象が読めない | `MergeSupplierDialog.tsx` | Matrix T2 |
| REQ-907 | 50 §50.2 / §50.6 / §50.8 | UI-01a-D11 | 件数だけでなく filter 外が非対象である境界を明示する。page 内だけの更新や filter 意味論変更は採用しない | `PluBulkTargetConfirmDialog.tsx` | Matrix T3 |
| 復元成功 Alert | 68 §68.5 | 該当 REQ なし（QR-05 / UI-11b-D11・D12 起点。REQ-905 は requirements.md の定義と drift があるため引用しない） | one-shot consume 時だけ先頭表示する。mount 一律 scroll は詳細戻り UX を壊すため禁止 | `HomePage.tsx` | Matrix T4 / T5 |
| 原価差分の複数商品 | 61 §61.5 | REQ-209 | 固有操作を持つ反復は一意見出し付き summary card にする。商品名 `dd` のみでは見出し移動で識別できない | `CostDiffDialog.tsx` | Matrix T6 |
| 整合性補正結果 | 75 §75.2 / §75.5 | REQ-904 | 同一 summary 内の反復は per-item box ではなく行区切りにする。OperationLogsPage と同型 | `IntegrityCheckPage.tsx` | Matrix T7 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Packet: yes。上記の実在節へ 6 件を trace した。
- Plan-only durable decisions found and promoted: 文言 3 件を 50 / 61 / 78 の source function-design へ plan-first commit で反映する。新規 DSR はない。
- Assumptions and constraints: `scrollPageToTop()` は既存 helper、Home の one-shot state 寿命は D11 のまま、supplier source 削除は Rust 実装で確認済み。
- Deferred design gaps: 非目的 4 件。いずれも本 Goal の前提ではない。
- Matrix can cite IDs / sections: yes。
- Absolute guarantee / escape hatch self-check: 「必ず視認」は D12 の flag consume 時の先頭 scroll に限定し、通常到達の例外を negative test で固定する。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | UI のみ。CMD / BIZ / IO/MNT 非接触 | AC7 diff audit |
| Fact check / design decision split | supplier DELETE と参照更新は Rust 実装で fact check。表示文言だけを source doc に決定として同期 | 78 §78.7 |
| Lifecycle / retry | D11 one-shot の mount / rerender / revisit 契約を維持 | Matrix State Lifecycle |
| Operator workflow | 操作手順は不変、判断前の説明と結果の視認性を改善 | Windows native L3 |
| Replacement path | not applicable | — |
| Data safety / evidence | DB 操作・fixture 変更なし、synthetic test data のみ | PR body |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 3 dialog、Home scroll、複数商品見出し、補正結果を Windows native で確認 | Human Gate L3 |
| 環境・再現性 | 新規依存・toolchain 変更なし | existing repo pins |

## Design Readiness

- Existing design docs are sufficient because: scroll は UI-11b-D11 / D12 + DSR-17、構造は DSR-16、各画面の状態と操作は 61 / 75 で確定済み。
- Source docs updated in this PR: 50 §50.6 / §50.8、61 §61.1 / §61.5 / §61.9、78 §78.7 / §78.11。
- Design gaps intentionally deferred: 非目的 4 件。
- Durable decisions discovered in this plan and promoted: dialog 文言 3 件のみ。上記 source docs へ昇格済み。
- Layer ownership: UI のみ。business rule は変更しない。
- Backend function design: 変更なし。supplier merge の DELETE / 引き継ぎ fact のみ確認。
- Command / DTO / data contract: 変更なし。
- Persistence / transaction / audit impact: 変更なし。
- Operator workflow / Japanese wording: 3 dialog の契約文言を source doc へ同期済み。
- Error, empty, retry, recovery behavior: 全て既存挙動を維持。
- Testability and traceability IDs: UI-01a-D11、UI-02-D15、UI-11b-D11/D12、UI-13-D5、SPEC-SUP-D4/D6 と Matrix T1-T9。

## Contract Probe

N/A — 外部 library / OS / hardware の未検証 premise に依存しない。使用する helper と markup pattern は repo 内実装を直接確認済み。

## Contract Coverage Ledger

R2 のため必須ではないが、6 件の表示契約は Design Intent Trace と Matrix T1-T9 で全数対応させる。

## Test Plan

Test Design Matrix: [test-matrices/2026-08-30-ui-polish-batch-2.md](test-matrices/2026-08-30-ui-polish-batch-2.md)

- targeted tests: Matrix T1-T7（dialog 文言、scroll 正負、見出し、divide-y）。
- negative tests: T5 flag なし scroll 0 回、T8 replaced old text 0 hit、T9 skip / diff boundary。
- compatibility checks: 既存 receiving / suppliers / products / backup-restore / home / integrity suites、lint、cargo fmt、doc consistency。
- data safety checks: synthetic fixtures のみ。DB / Rust 非変更。
- main wiring/integration checks: Home の実 mount effect が consume result と scroll helper を結線すること、既存 D11 flow tests が green であること。
- Human Gate に Windows native L3 を含むため、Writer 完了条件に `cargo check --release` を含める。

## Boundary / Wire Contract

N/A — JSON、browser route/search state、CSV、config、manifest、cache schema、Tauri DTO、generated bindings、DB-backed compatibilityを変更しない。AC7 で差分ゼロを確認する。

## Review Focus

- 3 dialog の文言が「変わるもの / 変わらないもの / 直前操作の状態」を source doc と同じ意味で示すか。
- Home effect が flag true branch 内だけで scroll し、D11 の state lifetime を変えていないか。
- heading level と accessible name で複数商品を一意に辿れるか。
- `divide-y` が summary 全体に 1 回だけ置かれ、per-item border を残していないか。
- route / wire / DB / Rust への scope drift、既存 test の削除・skip がないか。

## Spec Contract

R2 のため formal Spec Contract は任意。Design Intent Trace を契約一覧として使用する。

## Trace Matrix

R2 のため formal Trace Matrix は任意。Matrix T1-T9 と Design Intent Trace の 6 行で対応する。

## Data Safety

- 実店舗 DB、POS / CSV、backup、credential、`.env` を読取・変更・commit しない。
- test は synthetic fixture のみ。
- exact-HEAD SHA、test count、hosted run URL は tracked docs ではなく PR body に置く。

## Implementation Results

Phase A のみ完了。Phase B は Plan Review pending のため未着手。Draft PR は plan-first commit 後に開き、URL と gate 状態は PR body を正本とする。

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none。
- Plan Reviewer / Fable 裁定待ち。Plan Gate 後の Scope / AC / Design / Matrix 変更は gated Amendment として扱う。
