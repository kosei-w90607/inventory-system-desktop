# Plan Packet — 取引先管理（追加・改名・統合）design-first

## Workflow State

- Phase: archive
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 6de67dfa7f3264b6e8413d6b479abfa094f6a62e
- Amendments: 5c67a5e6ccc732fcbeb75f323c8609e323dae0b8
- Coordinator: Claude Fable 5（main session）
- Writer: Codex（GPT-5.6、発注書駆動）
- Plan Reviewer: Claude Sonnet 5（独立 fresh context）
- Final Reviewer: Claude Sonnet 5（独立 fresh context）
- Reviewed Content HEAD: 5c67a5e6ccc732fcbeb75f323c8609e323dae0b8
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: none（Plan Gate 承認・Ready 承認・merge すべて 2026-08-25 完了、narrative 参照）

append-only narrative: kickoff → spec-check → design → plan-draft は本 packet の plan-first content commit に同乗する（recording compression）。evidence = task scope と Risk 分類は本 packet Risk 節、in-scope source docs の特定は Design Sources 節、設計上の未解決問題なし（owner 裁定 2026-08-25 = 改名 + 統合を採用・削除は非採用・配置は `/settings/suppliers` システム管理エリア・schema 追加は updated_at のみ。D-078 として正本化予定）。

Plan Review round 1（Sonnet 独立 fresh context、2026-08-25）: P1 2 / P2 2 / P3 2 — ①30-biz §4.7.3/4 の枝番衝突（§4.7.3 = list_price_history 使用済み → §4.7.4/§4.7.5 へ全 sweep 是正）②AC-1/2/8 と M-D1/2/9 の negative oracle が packet/Matrix の逐語引用に自己参照 hit する構造欠陥（`--glob '!docs/plans/**'` 追加で是正）③§52.4 項目数の off-by-one（21 → 22、stale 表記同期を Scope 化）④SPEC-SUP-D7 の invalidate 対象 3 系統の明示列挙⑤AC-4 と M-D11 の対象 file 数整合⑥transaction-tables.md への cross-reference 追加。全 6 件採用・是正済み（Coordinator が P1×2 / P2-1 を rg で実証再現のうえ採用）。

Plan Review round 2（Sonnet 独立 fresh context、2026-08-25、HEAD acbc70e）: round 1 是正 6 件は全 CLOSED（oracle 実行・算術再現・実在確認で実証）。新規 P1 1 / P2 1 / P3 1 — ①M-D6 が SPEC-SUP-D8 の 3 command 目（`list_suppliers_with_usage`）を未検査（PR #159 miss class）→ M-D6 拡張 + AC-10 新設 + 名称 3 層統一 ②SPEC-PRVA-D5 の逆引用（正 = DTO は BIZ 所有・CMD は qualified path 参照。Coordinator が archive 実読で裏取り）→ Boundary / Wire Contract を是正 ③M-D3 の section 境界が非機械的 → awk section slice oracle へ変更。全 3 件採用・是正済み。

owner 裁定 2026-08-25（Plan Gate、rally 収束後）: 追加導線も UI-15 に置く（既存 `create_supplier` command 流用・wire 無改変・REQ-106 の対応 UI へ UI-15 追加）。rally 3 round 収束後の owner-directed contract 追加のため、既収束 findings の再 round ではなく独立 fresh context による delta 検証を別途実施して plan-gate evidence を更新する。

delta 検証（Sonnet 独立 fresh context、2026-08-25、対象 = 追加導線反映 commit）: P1 0 / P2 0 / P3 2 / verdict pass。反映の一貫性・wire 凍結との無矛盾・UI-01b-D21 引用の正確性・M-D5 新 oracle の機械実行可能性を確認。P3 2 件（packet / Matrix の H1 表題「改名・統合」→「追加・改名・統合」追随、Manual verification lens 行への追加導線反映）は採用・是正済み。

owner Plan Gate 承認（2026-08-25、介入 1/3）: 採否 7 点すべて承認 + 追加導線の scope 化を裁定。関連裁定 = UI-01a 商品検索への取引先 filter 露出は本 change に含めず backlog へ（「あとで。まず UI-15 を済ませる」、Plans.md backlog 起票済み）。Plan Reviewer evidence = rally 3 round 収束（P1+P2: 4 → 3 → 0）+ owner-directed delta 検証 pass。

state-only 遷移（2026-08-25）: plan-draft -> plan-gate -> plan-approved -> implementing を単一 state-only commit で実体化（recording compression）。evidence = plan-draft -> plan-gate: packet + Matrix が plan-first commit 6de67df で committed 済み / plan-gate -> plan-approved: 独立 Plan Reviewer（Sonnet）rally round 3 で P1/P2 = 0 + owner-directed delta 検証 pass、Plan Commit 記入 = 本 commit、plan-first commit は本 branch の全 content commit の祖先 / plan-approved -> implementing: Codex Writer への発注直前遷移（Coordinator が発注前に遷移を完了する運用）。

実装・検証記録（2026-08-25）: Codex Writer が発注 1 本で Scope 1〜14 を実装（content candidate = 実装 2 commit 目、AC-1〜10 / M-D1〜11 / 完了 gate 全 PASS を報告、Coordinator が scope・凍結境界・主要 oracle を独立再実測して一致確認）。L1 full は content candidate と gated amendment 後 HEAD の双方で PASS / CLEAN / MERGE_EVIDENCE_VALID=true（evidence = `.local/ci-evidence/`、exact SHA は PR body 正本）。Final Review（Sonnet 独立 fresh context、Contract Audit）: Ledger 13/13 適合・M-D/AC 全 oracle 独立再現・機械 gate 全 PASS・既存節無改変を hunk 単位確認・docs 契約内容の不整合なし。P2 2 件（M-D11 の section-scope 欠如 / M-D5 の不可逆・件数文言 oracle 欠如 — いずれも Matrix 頑健性）→ Coordinator 両採用、gated amendment 1（Amendments 行の SHA、Matrix 2 行のみ）で是正、独立 delta 再検証 P1/P2/P3 = 0 / verdict pass。Findings Freeze: frozen after Broad Audit; post-freeze exceptions: none。

state-only 遷移（2026-08-25）: implementing -> local-verified -> independent-review -> human-confirm を単一 state-only commit で実体化（recording compression）。evidence = implementing -> local-verified: content candidate の L1 full CLEAN（上記記録、PR body に SHA 記載）/ local-verified -> independent-review: 独立 Final Reviewer（Sonnet）の Contract Audit 実施 / independent-review -> human-confirm: findings 裁定完了・P1/P2 = 0（P2 2 件は gated amendment 1 で是正済み + delta 再検証 pass）、Reviewed Content HEAD = gated amendment commit を設定。

owner Ready 承認（2026-08-25、介入 2/3）: Draft PR #3 の Human Gate 提示に対し承認。human-confirm -> ready-hosted-final の state-only 遷移を Draft のまま作成し、この exact HEAD で L1 full を再実行して PR body を更新、owner が Ready 化を実施した（hosted CI は Ready event で発火、本 PR は Rust test file を含むため event-filtered ではない）。

merge / closeout（2026-08-25）: hosted run success で PR HEAD = L1 evidence SHA = hosted headSha の三点一致成立（run URL / headSha は PR #3 body 正本）。owner merge（merge commit `ff08a6b`、PR #3 @ inventory-system-desktop）。Post-Merge Closeout で packet / Matrix を docs/archive/plans/ へ移動、Phase を archive とし Plans.md を同期。実績 = 介入 2/3・relay 1/2・forward state-only 3/3（すべて予算内）。remote branch `agent/supplier-management-design` の削除と local branch 掃除は owner 端末操作として残置。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
本 PR の diff は docs + `design_compliance_test.rs` SKIP_DOCS 1 行（PR #93 と同型）だが、正本化する契約は DB schema（migration v6 = `suppliers.updated_at`）・Tauri command DTO（`rename_supplier` / `merge_suppliers` / `list_suppliers_with_usage`）・route/search state（`/settings/suppliers` 新設）・operator workflow（不可逆な統合操作）に及ぶ。DEV_WORKFLOW Risk Tiers の R3 定義（stable contract / command wire shape / UI route）に該当。

## Goal

Goal Invariant:

### 最小完了条件

- 取引先（メーカー/ブランド）の追加・改名・重複統合を UI-15 取引先管理画面（`/settings/suppliers`）で提供するための設計契約が source docs に正本化され、後続の実装 PR が本 packet と source docs のみから着手できる。

### 失敗定義

- Deferred 解除が部分的で、旧「改名・統合 UI や専用管理画面は扱わない」系記述が live docs のいずれかに残存する。
- merge の参照付替え対象が不完全なまま正本化される（`receiving_records.supplier_id` の欠落 = FK 違反で DELETE 不能になる設計欠陥）。
- 採番衝突（UI-15 / REQ-107 / D-078 / D-052 C21・C22 / migration v6 / function-design 78 番）のいずれかが発生する。

### 非目的

- 実装コードの変更（migration・repo/biz/cmd 実装・bindings・UI 実装・invalidation-contract.ts・navigation.ts は後続実装 PR）。
- 取引先の削除機能（統合で代替。Deferred 維持を明文化する）。
- 問屋（発注チャネル）管理・約 80 社の事前一括投入・取引先の検索/並び替え高度化。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

docs-only design-first PR。以下を Codex Writer が発注書に従って正本化する:

1. `docs/function-design/78-ui-supplier-management.md` 新設 — UI-15 取引先管理画面の function design（SPEC-SUP-D1〜D10 の正本、画面契約・一覧・新規追加導線・インライン改名・統合 dialog・エラー/空/確認 UI・日本語文言。追加導線は既存 `create_supplier` command 流用で wire 無改変、owner 裁定 2026-08-25 Plan Gate）。
2. `docs/function-design/20-io-product-repo.md` — `rename_supplier` / `merge_suppliers`（products + receiving_records の 2 UPDATE + DELETE、付替え件数返却）/ `list_suppliers_with_usage`（products / receiving_records の COUNT を伴う一覧取得。名称は 3 層で統一し `count_supplier_usage` 等の別名は使わない、round 2 P1-1）の IO 契約追記。
3. `docs/function-design/30-biz-product-service.md` — §4.7.4 `rename_supplier` / §4.7.5 `merge_suppliers`（validation・1 TX・`insert_operation_log(operation_type = "supplier_rename" / "supplier_merge")`）/ §4.7.6 `list_suppliers_with_usage`（BIZ wrapper）。§4.7.3 は list_price_history が使用済み、2026-08-25 実測。
4. `docs/function-design/40-cmd-product.md` — `rename_supplier` / `merge_suppliers` / `list_suppliers_with_usage` の command wire contract（既存 `list_suppliers` / `create_supplier` は無改変）。
5. `docs/db-design/master-tables.md` — suppliers 節へ `updated_at` 列追加・rename/merge 契約・参照テーブル 2 件（products / receiving_records）の明記・migration v6 参照。加えて `docs/db-design/transaction-tables.md` の receiving_records 節へ「`supplier_id` は取引先統合（SPEC-SUP-D4）で付け替わり得る」cross-reference を 1 行追記（値の所有 doc 側からの参照、round 1 P3-2）。
6. `docs/function-design/22-mnt-migration.md` — §14 として migration v6（`suppliers.updated_at` 追加 + 既存行 backfill）を追記。
7. `docs/function-design/77-ui-bulk-price-revision.md` §77.9 — Deferred 行の改訂（改名・統合・専用管理画面を UI-15 として解除。取引先の削除・問屋チャネル・約 80 社の事前一括投入は Deferred 維持）。
8. `docs/function-design/51-ui-product-form.md` — UI-01b-D21 の 3 箇所（36 行決定表 / 149-154 行実装節 / 209 行 Test Focus）の「改名・統合 UI は扱わない」を「改名・統合は UI-15（78 doc）で扱う」参照へ改訂。
9. `docs/function-design/52-ui-shared-layout.md` — §52.3 ルーティング表へ UI-15 行（`/settings/suppliers` / `src/routes/settings/suppliers.tsx` / システム管理 / ○）、§52.4 の項目数表記を 4 エリア × 22 項目へ更新（システム管理 4 → 5。現行実装は既に 21 項目〈`rg -c '\bid: "ui-' src/config/navigation.ts` = 21、2026-08-25 実測〉のため、30 行 / 130 行の「20 項目」stale 表記と商品管理の項目数 stale も同一 diff で実態へ同期する）。
10. `docs/SCREEN_DESIGN.md` — §1 画面一覧表へ # 21 行（取引先管理）、個別画面詳細節の追加、301 行付近の取引先候補記述への UI-15 参照追記、§2 遷移の該当箇所。
11. `docs/spec/requirements.md` — REQ-107 新設（取引先の名称変更・重複統合、対応 UI-15 / BIZ-01、`coverage=deferred`。実装 PR で `required` へ昇格する予約を注記）。あわせて REQ-106（取引先の追加登録）の対応 UI 列へ UI-15 を追加（追加導線の要求正本は REQ-106 を継続使用し新 REQ は起こさない）。
12. `docs/function-design/90-traceability.md` — `cd src-tauri && cargo run --bin generate_traceability` で再生成（手動編集禁止のまま）。
13. `docs/decision-log.md` — D-078 新設（owner 裁定事実 2026-08-25: Deferred 解除の範囲 = 改名 + 統合、削除は非採用〈統合で代替〉、配置 = `/settings/suppliers` システム管理エリア、schema 追加は updated_at のみ〈speculative column は追加しない〉。追加導線も UI-15 に置く〈既存 create_supplier 流用〉を裁定事実に含める。D-052 C21〈rename〉/ C22〈merge〉の番号予約もここに明記し、invalidate 対象を `productForm.suppliers()` / `priceRevision.suppliers()` / UI-15 新設 key の 3 系統として明示列挙する〈一部のみ対象化して他画面 cache が stale 化する実装を防ぐ、round 1 P2-2〉。merge はさらに products 系 root を含む。D-052 本文の C 一覧更新と `invalidation-contract.ts` は実装 PR）。
14. `src-tauri/tests/design_compliance_test.rs` — SKIP_DOCS へ `78-ui-supplier-management.md` 1 行追加（UI 専用 doc、PR #93 同型）。

## Non-scope

- 実装 PR の全内容: migration v6 実装（schema_v6.rs + migration.rs 登録 + mod 宣言）、`db::product_repo` / `biz::product_service` / `cmd::product_cmd` 実装、`collect_commands!` 登録、bindings 再生成、`/settings/suppliers` route + page + `navigation.ts` entry + `navigation.test.ts` 到達テスト、`invalidation-contract.ts` C21/C22、RTL / Rust tests、`requirements.md` REQ-107 の `required` 昇格。
- 取引先の削除機能・問屋チャネル・約 80 社事前一括投入（Deferred 維持）。
- 既存 `CreateSupplierDialog` / `ProductForm` インライン追加 UI の挙動変更。

## Acceptance Criteria

- AC-1: 旧 Deferred 文言の live 0 hit — `rg -F '取引先の改名・統合・専用管理画面、問屋チャネル、約 80 社の事前一括投入' docs/ --glob '!docs/archive/**' --glob '!docs/plans/**'` が 0 hit（exit 1）。新 Deferred 行（取引先の削除・問屋チャネル・約 80 社の事前一括投入）が 77 §77.9 に exact 存在。（`!docs/plans/**` は本 packet / Matrix が pattern を逐語引用することによる自己参照 hit の除外、round 1 P1-2）
- AC-2: 51-ui 旧文言の live 0 hit — `rg -F '改名・統合 UI や約 80 社の事前一括投入は扱わない' docs/ --glob '!docs/archive/**' --glob '!docs/plans/**'` が 0 hit、UI-01b-D21 の 3 箇所すべてに UI-15 参照が存在（`rg -c 'UI-15' docs/function-design/51-ui-product-form.md` ≥ 1）。
- AC-3: `docs/function-design/78-ui-supplier-management.md` が存在し、SPEC-SUP-D1〜D10 の全 ID を含む（`rg -o 'SPEC-SUP-D[0-9]+' docs/function-design/78-ui-supplier-management.md | sort -u` が D1〜D10 の 10 ID）。
- AC-4: merge 参照全数の契約化 — 30-biz / 78 doc / master-tables の merge 契約文すべてに `receiving_records` が明記（`rg -c 'receiving_records' <3 file>` 各 ≥ 1、M-D11 と同一対象。round 1 P3-1）。
- AC-5: `cd src-tauri && cargo test --test design_compliance_test` PASS（SKIP_DOCS 追加後）。
- AC-6: `cd src-tauri && cargo run --bin generate_traceability -- --check` PASS（REQ-107 は `coverage=deferred` のため T3 対象外、T1 drift なし）。
- AC-7: `bash scripts/doc-consistency-check.sh` PASS（ERROR 0）。
- AC-8: 削除機能を規定する文言が新規 docs に存在しない — `rg -i 'delete_supplier' docs/ --glob '!docs/archive/**' --glob '!docs/plans/**'` 0 hit（`!docs/plans/**` は自己参照除外、round 1 P1-2）。
- AC-9: SCREEN_DESIGN §1 に # 21 取引先管理行、52-ui §52.3 に UI-15 行が存在（`rg -c 'UI-15' docs/SCREEN_DESIGN.md docs/function-design/52-ui-shared-layout.md` 各 ≥ 1）。
- AC-10: usage 付き一覧契約の 3 層記載 — `rg -c 'list_suppliers_with_usage' docs/function-design/20-io-product-repo.md docs/function-design/30-biz-product-service.md docs/function-design/40-cmd-product.md` 各 ≥ 1（SPEC-SUP-D8 の 3 command 目の欠落防止、round 2 P1-1）。

## Design Sources

- Requirements / spec: `docs/spec/requirements.md`（REQ-105 / REQ-106 の取引先語彙、REQ-107 新設）
- Architecture: `docs/ARCHITECTURE.md`（UI → CMD → BIZ → IO 一方向）
- Function / command / DTO: `docs/function-design/20-io-product-repo.md` / `30-biz-product-service.md` / `40-cmd-product.md` / `77-ui-bulk-price-revision.md` / `51-ui-product-form.md` / `52-ui-shared-layout.md`
- DB: `docs/db-design/master-tables.md` §3 suppliers / `docs/db-design/transaction-tables.md`（receiving_records の正本、round 1 P3-2）/ `docs/function-design/22-mnt-migration.md`
- Screen / UI: `docs/SCREEN_DESIGN.md` / `docs/design-system/04-backbone.md`（一覧の器の規範が Lane 1 で正本化された場合は追随）
- Decision log / ADR: D-075（suppliers = メーカー/ブランド意味論）/ D-052（invalidation registry）/ D-078 新設

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 20-io / 30-biz / 40-cmd の rename・merge・usage 追記 | updated in this PR |
| Command / DTO / generated binding / wire shape | 40-cmd wire contract + 本 packet Boundary / Wire Contract | updated in this PR（bindings 再生成は実装 PR） |
| DB / transaction / audit / rollback / migration | master-tables suppliers 節 + 22-mnt §14 migration v6 | updated in this PR（migration 実装は実装 PR） |
| Screen / UI / route state / Japanese wording | 78-ui 新設 + SCREEN_DESIGN + 52-ui | updated in this PR |
| CSV / TSV / report / import / export format | 該当なし（取込み・出力形式に変更なし） | existing sufficient |
| Durable decision / ADR | decision-log D-078 | updated in this PR |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| function-design doc 新設（78-ui） | `design_compliance_test.rs` の SKIP_DOCS へ 1 行追加（UI 専用 doc のため doc-map ではなく SKIP_DOCS。本 PR で実施、AC-5 で検証） |
| REQ-107 追加 | `cargo run --bin generate_traceability` で 90-traceability 再生成（本 PR で実施、AC-6 で検証） |
| Tauri command 3 件（rename / merge / usage 付き一覧） | `collect_commands!` 登録 + `#[tauri::command]` / `#[specta::specta]` 対 + bindings 再生成 — **実装 PR の義務として 78 doc に予約明記** |
| route 新設（`/settings/suppliers`） | `npm run generate:routes` — 実装 PR の義務として予約 |
| operator 画面新設（UI-15） | `navigation.ts` の system エリアへ entry 追加 + `navigation.test.ts` に REQ 番号入り到達テスト（ui-11c パターン）— 実装 PR の義務として予約。Contract Coverage Ledger の到達導線行参照 |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-107 | 77 §77.9 / 78 doc | SPEC-SUP-D1 | 漸進補完運用では typo・重複が蓄積し是正手段皆無が運用矛盾。削除単体は参照処理の設計コストと危険に対し場面の大半が統合で代替可能なため非採用（商品側 `toggle_discontinue` の非削除方針とも整合） | 77 Deferred 行改訂 + D-078 | Matrix M-D1 |
| REQ-107 / REQ-106 | 78 doc / SCREEN_DESIGN / 52-ui | SPEC-SUP-D2 | 改名・統合は保守作業でありシステム管理エリア（`/settings/*`）が既存 4 画面と整合。商品管理エリア配置は日常業務との混在で不採用。追加導線も同画面に置く（owner 裁定 2026-08-25、既存 command 流用で wire 無改変） | 78 doc 画面契約 | Matrix M-D5 / M-D7 |
| REQ-107 | 30-biz / 40-cmd | SPEC-SUP-D3 | 改名 = trim・空文字拒否・同名衝突は validation error（統合へ誘導する文言）。UNIQUE 制約と create_supplier の trim 規律を継承 | 30-biz §4.7.4 | Matrix M-D6 |
| REQ-107 | 20-io / 30-biz / master-tables | SPEC-SUP-D4 | 統合 = 1 TX で products / receiving_records の supplier_id を残す側へ付替え → 参照 0 の消す側を DELETE。参照残存の削除は設計しない（FK 安全） | 30-biz §4.7.5 + master-tables | Matrix M-D6 / M-D11 |
| REQ-107 | master-tables / 22-mnt | SPEC-SUP-D5 | `updated_at` を nullable TEXT で追加し backfill = created_at。改名時のみ更新。他の speculative column は追加しない（owner 裁定 2026-08-25、防災バッグは構造判断に限る） | 22-mnt §14 | Matrix M-D3 / M-D4 |
| REQ-107 | 78 doc | SPEC-SUP-D6 | 統合は不可逆のため 2 段階（残す側の選択 → 影響件数提示 + 確認 dialog）。非 IT operator 向けに件数を「◯件の商品 / ◯件の入庫記録が付け替わります」形で提示 | 78 doc UI 契約 | Matrix M-D5 |
| REQ-107 | decision-log D-078 / 78 doc | SPEC-SUP-D7 | invalidation は D-052 C21（rename）/ C22（merge）を予約。merge は products 系 query にも波及するため products root を含む | D-078 予約記述 | Matrix M-D10 |
| REQ-107 | 40-cmd | SPEC-SUP-D8 | wire = `rename_supplier(supplier_id, name) -> Supplier` / `merge_suppliers(source_id, target_id) -> SupplierMergeResult{products_updated, receiving_records_updated}` / `list_suppliers_with_usage() -> Vec<SupplierWithUsage>`。既存 `list_suppliers` / `create_supplier` は凍結 | 40-cmd 追記 | Matrix M-D6 |
| REQ-107 | 52-ui / SCREEN_DESIGN | SPEC-SUP-D9 | 到達導線 = navigation system エリア `ui-15`。SCREEN_DESIGN #21 / 52 §52.3 1 行。実装 PR で navigation.test.ts 到達テスト | 52-ui / SCREEN_DESIGN | Matrix M-D7 |
| REQ-107 | 77 §77.9 | SPEC-SUP-D10 | 削除は Deferred 維持を明文化（「取引先の削除（統合で代替）」を新 Deferred 行に残す）— 解除範囲の境界を機械可読に | 77 Deferred 行 | Matrix M-D1 / M-D9 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 78 doc + D-078 + 各層追記で成立（owner 裁定事実は D-078 に正本化）。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: Deferred 解除の範囲と削除非採用の理由 → D-078。
- Assumptions and constraints: suppliers への FK 参照は products / receiving_records の 2 テーブルで全数（Contract Probe P-1 で機械列挙済み）。SQLite の `ALTER TABLE ADD COLUMN` は NOT NULL + 非定数 DEFAULT を許さないため updated_at は nullable + backfill 方式（Contract Probe P-3）。
- Deferred design gaps, risk, and follow-up target: 削除機能・問屋チャネル・80 社一括投入は Deferred 維持（77 §77.9 に明文）。取引先の並び順・検索は一覧規模（漸進補完で高々数十件）から name 昇順のみとし、高度化は要望発生時。
- Test Design Matrix can cite design decision IDs or source doc sections: M-D1〜M-D11 が SPEC-SUP-D1〜D10 を引用。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「参照 0 にしてから DELETE するため FK 違反は起きない」の例外 = merge TX 外で並行書込みがある場合だが、本アプリは単一 operator・単一 window で並行系実装なし（既存 BIZ TX 群と同じ前提）。source ID = target ID は入口で拒否。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — 外部 adapter（POS / CSV）に接点なし、app-core master data のみ | — |
| Fact check / design decision split | 観測事実 = FK 参照 2 テーブル（rg 実測、Contract Probe P-1）/ 設計判断 = 削除非採用・統合方式（D-078） | Contract Probe / D-078 |
| Lifecycle / retry | merge は 1 TX 原子。成功後の再実行は source 不在で not_found エラー（冪等 replay は設計しない = 2 回目が黙って成功しない安全側）。rename の同値 no-op は成功扱い | 30-biz §4.7.4 / §4.7.5 / Matrix 実装 PR 予約 |
| Operator workflow | 統合は不可逆 → 2 段階確認 + 影響件数提示。改名はインライン編集 + Enter/保存確定（既存 pattern 準拠） | 78 doc |
| Replacement path | not applicable — 外部システム非依存 | — |
| Data safety / evidence | docs-only PR。実店舗 DB・実取引先名は不使用（設計例示は synthetic 名のみ） | Data Safety 節 |
| Reporting / accounting semantics | merge 後、過去の入庫記録の取引先表示は残す側の名称になる。統合 = 同一実体の重複解消であり履歴の意味は保存される（別実体を誤統合した場合の復元手段はないことを 78 doc の確認 dialog 文言根拠に明記） | 78 doc |
| Manual verification | 本 PR は docs-only で L3 なし。実装 PR で human visual confirmation（UI-15 到達・追加・改名・統合 happy path + 確認 dialog 文言）を予約 | 78 doc の実装 PR 予約節 |
| 環境・再現性 | not applicable — toolchain / CI 環境の変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: 不十分（Deferred 明文が現行正本）。本 PR がその改訂そのもの。
- Source docs updated in this PR: Scope 1〜14 の全件。
- Design gaps intentionally deferred: 削除・問屋・80 社一括投入・並び順/検索高度化。
- Durable decisions discovered in this plan and promoted to source docs: D-078（owner 裁定 2026-08-25）。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI-15 → CMD 3 件 → BIZ-01（product_service 継続所有）→ IO（product_repo）。CMD は薄く、validation / TX / operation_log は BIZ。
- Backend function design: 30-biz §4.7.4 / §4.7.5 / §4.7.6 + 20-io 追記で全数。
- Command / DTO / data contract: 40-cmd + Boundary / Wire Contract 節。
- Persistence / transaction / audit impact: 1 TX（2 UPDATE + 1 DELETE + operation_log）、migration v6、audit = operation_log 2 種。
- Operator workflow / Japanese UI wording: 78 doc に正本化（画面名「取引先管理」、統合確認文言）。
- Error, empty, retry, and recovery behavior: 空一覧表示 / validation・duplicate・not_found の CmdError kind 対応 / 失敗時は入力保持（51-ui D21 と同規律）。
- Testability and traceability IDs: REQ-107 / SPEC-SUP-D1〜D10、実装 PR の test 名予約は Matrix に記載。

## Contract Probe

- P-1（FK 参照全数）: `rg -n 'REFERENCES suppliers' src-tauri/src/db/schema_v*.rs` → 3 hit = schema_v1.rs:34（products）/ schema_v1.rs:56（receiving_records 初版）/ schema_v2.rs:141（receiving_records_new 再構築、FK 維持）。現行 DB で suppliers を参照するのは products / receiving_records の 2 テーブルで全数。
- P-2（SKIP_DOCS 方式）: 新設 UI doc の design_compliance 対応は SKIP_DOCS 1 行で成立 — PR #93（77-ui 新設）の同型実績あり。`design_compliance_test.rs:25-49` の既存 UI doc 列挙を確認済み。
- P-3（SQLite ALTER TABLE 制約）: SQLite は `ALTER TABLE ADD COLUMN` で NOT NULL + 非定数 DEFAULT を許さない（SQLite 公式仕様）。updated_at は nullable TEXT で追加し `UPDATE suppliers SET updated_at = created_at` で backfill、NOT NULL 化の table rebuild はしない。実証 test（migration v6 の up + backfill 検証）は実装 PR の Matrix に予約。
- P-4（採番衝突なし）: SPEC-SUP prefix は docs/（archive 除く）で 0 hit、UI-15 / REQ-107 / D-078 / migration v6 / function-design 78 番 / D-052 C21・C22 はいずれも現行未使用（2026-08-25 rg 実測。C 最新は C20 = decision-log 395 行）。トップレベル ID のみの検査では doc 内部の枝番衝突を検出できない（round 1 P1-1 の教訓）ため、30-biz §4.7.x も実測 — 最終は §4.7.3（list_price_history）で、rename = §4.7.4 / merge = §4.7.5 を予約。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| SPEC-SUP-D1（Deferred 解除範囲） | 77 §77.9 改訂 + D-078 | M-D1（旧行 0 hit + 新行 exact） | non-scope（docs PR） |
| SPEC-SUP-D2（UI-15 配置） | 78 doc + SCREEN_DESIGN #21 + 52 §52.3/§52.4 | M-D5 / M-D7 | non-scope |
| SPEC-SUP-D3（rename 契約） | 30-biz §4.7.4 + 40-cmd | M-D6 | non-scope |
| SPEC-SUP-D4（merge 契約 = 2 UPDATE + DELETE） | 30-biz §4.7.5 + 20-io + master-tables + transaction-tables cross-reference | M-D6 / M-D11 | non-scope |
| SPEC-SUP-D5（updated_at + migration v6） | master-tables + 22-mnt §14 | M-D3 / M-D4 | non-scope |
| SPEC-SUP-D6（統合 2 段階確認 UI） | 78 doc | M-D5 | non-scope |
| SPEC-SUP-D7（invalidation C21/C22 予約） | D-078 | M-D10 | non-scope |
| SPEC-SUP-D8（wire contract 3 command） | 40-cmd | M-D6 | non-scope |
| SPEC-SUP-D9（到達導線） | 52-ui + SCREEN_DESIGN | M-D7 | non-scope |
| SPEC-SUP-D10（削除 Deferred 維持明文） | 77 §77.9 | M-D1 / M-D9 | non-scope |
| REQ-107（要求正本） | requirements.md + 90-traceability 再生成 | M-D8 | non-scope |
| UI-01b-D21 改訂（3 箇所 sweep） | 51-ui | M-D2 | non-scope |
| SKIP_DOCS 登録 | design_compliance_test.rs | M-D9（cargo test PASS） | non-scope |

adjacent-contract sweep: 77 §77.9 の他 Deferred 項目（問屋チャネル / 80 社一括投入）は本 Scope で解除しない（M-D1 の新行 exact oracle が維持を拘束）。51-ui の D21 以外の決定（D7 候補取得等）は無改変。master-tables suppliers 節の「問屋を保持しない」方針（179 行）は維持。20-io / 30-biz / 40-cmd の既存 supplier 3 関数（list / create / find_or_create）は無改変（AC 側は実装 PR の既存 test 凍結で拘束）。

## Test Plan

Test Design Matrix: [test-matrices/2026-08-25-supplier-management-design.md](test-matrices/2026-08-25-supplier-management-design.md)

- targeted tests: `bash scripts/doc-consistency-check.sh` / `cd src-tauri && cargo test --test design_compliance_test` / `cargo run --bin generate_traceability -- --check`
- negative tests: 旧文言 0 hit sweep（M-D1 / M-D2）、`delete_supplier` 不在（M-D9）
- compatibility checks: 既存 supplier 3 関数の doc 記述無改変（git diff で 20-io / 30-biz / 40-cmd の既存節に変更なしを検分）
- data safety checks: 実店舗データ・実取引先名の不使用（synthetic 例のみ）
- main wiring/integration checks: 本 PR は docs-only のため配線なし。実装 PR の義務予約が 78 doc に存在すること（M-D5）

## Boundary / Wire Contract

実装 PR で確定する wire の設計正本（本 PR では 40-cmd に記載、bindings 生成は実装 PR）:

- producer: UI-15 page（`/settings/suppliers`）→ `commands.renameSupplier` / `commands.mergeSuppliers` / `commands.listSuppliersWithUsage`
- consumer: CMD → BIZ-01 → IO（product_repo）
- wire type: specta 生成 bindings（snake_case JSON）。`rename_supplier(supplier_id: i64, name: String) -> Result<Supplier, CmdError>` / `merge_suppliers(source_id: i64, target_id: i64) -> Result<SupplierMergeResult, CmdError>`（`SupplierMergeResult { products_updated: i64, receiving_records_updated: i64 }`）/ `list_suppliers_with_usage() -> Result<Vec<SupplierWithUsage>, CmdError>`（`SupplierWithUsage { id, name, product_count, receiving_record_count }`）
- internal type: BIZ は既存 `Supplier` model を継続使用。新 DTO 2 種（`SupplierMergeResult` / `SupplierWithUsage`）は BIZ 所有（`src-tauri/src/biz/product_service.rs` に置き、CMD は qualified path 参照 — SPEC-PRVA-D5 準拠。round 2 P2-1 で逆引用を是正）
- precision/range: 件数は i64（SQLite COUNT の自然型）。name は create_supplier と同一の trim / 空文字拒否
- round-trip path: UI 入力 → trim（BIZ）→ DB → 一覧再取得で表示
- invalid input: 空文字 name → validation / 同名衝突 → duplicate / 不存在 ID・source==target → not_found / validation（40-cmd で kind を確定）
- compatibility: 既存 `list_suppliers` / `create_supplier` の wire 無改変。bindings.ts の既存 export に破壊的変更なし（実装 PR で diff 検分）

## Review Focus

- merge 契約の参照全数（products + receiving_records）が全 doc（20-io / 30-biz / master-tables / 78）で一貫しているか — 片側欠落は failure 定義該当。
- Deferred 解除の境界: 削除・問屋・80 社一括投入が誤って解除されていないか。
- 採番（UI-15 / REQ-107 / D-078 / C21・C22 / v6 / 78）の衝突と、既存 supplier 3 関数の凍結。
- 51-ui D21 の 3 箇所 sweep 漏れ。
- SQLite ALTER TABLE 制約（P-3）と 22-mnt §14 の整合。

## Spec Contract

Contract ID: SPEC-SUP

- SPEC-SUP-D1: 取引先の改名・統合・専用管理画面は Deferred から解除し UI-15 で提供する。削除は Deferred 維持（統合で代替）。
- SPEC-SUP-D2: UI-15 取引先管理は `/settings/suppliers`、サイドバー「システム管理」エリア。一覧（name 昇順）+ 各行に関連商品数・入庫記録数を表示し、一覧上部に「新しい取引先を追加」導線を置く（既存 `create_supplier` command 流用・wire 無改変、trim / 空文字拒否 / 同名は既存行返却の挙動は UI-01b-D21 と同一。成功時は自画面一覧の再取得のみで D-052 対象外 = 既存 inline 追加と同型。owner 裁定 2026-08-25）。
- SPEC-SUP-D3: 改名は trim・空文字拒否・同値 no-op 成功・他行と同名衝突は validation error（統合へ誘導する日本語文言）。成功時 `updated_at` 更新 + operation_log `supplier_rename`。
- SPEC-SUP-D4: 統合は source ≠ target・両者実在を検証し、1 TX で products / receiving_records の `supplier_id` を target へ付替え → source 行を DELETE → operation_log `supplier_merge`（source/target 名 + 付替え件数）。参照が残った状態の DELETE 経路は設計しない。
- SPEC-SUP-D5: `suppliers.updated_at`（TEXT、nullable）を migration v6 で追加し既存行は created_at で backfill。改名時のみ更新。他カラムの投機的追加はしない。
- SPEC-SUP-D6: 統合 UI は 2 段階（残す側の選択 → 影響件数提示「◯件の商品 / ◯件の入庫記録が付け替わります」+ 確認）。不可逆であることを dialog に明記。
- SPEC-SUP-D7: invalidation は D-052 C21（rename）/ C22（merge）を予約。suppliers 系 query は `productForm.suppliers()` / `priceRevision.suppliers()` / UI-15 新設 key の 3 系統を明示列挙し、C22 はさらに products 系 root を含む。registry 本文と実装は実装 PR。
- SPEC-SUP-D8: command wire は Boundary / Wire Contract 節のとおり。既存 `list_suppliers` / `create_supplier` は凍結。
- SPEC-SUP-D9: 到達導線 = navigation system エリア `ui-15`（`to: "/settings/suppliers"`、`status: "active"` は実装 PR）。SCREEN_DESIGN #21 / 52 §52.3 に登録。
- SPEC-SUP-D10: 77 §77.9 の新 Deferred 行は「取引先の削除（統合で代替）、問屋チャネル、約 80 社の事前一括投入」とし、解除範囲の境界を明文維持する。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-SUP-D1 / D10 | Scope 7 / 13 | M-D1 | Deferred 境界 | rg 旧行 0 hit + 新行 exact |
| SPEC-SUP-D2 / D9 | Scope 1 / 9 / 10 | M-D5 / M-D7 | 配置・到達導線 | rg UI-15 各 doc ≥1 |
| SPEC-SUP-D3 | Scope 3 / 4 | M-D6 | rename 契約 | 30-biz / 40-cmd 節存在 |
| SPEC-SUP-D4 | Scope 2 / 3 / 5 | M-D6 / M-D11 | 参照全数一貫 | receiving_records 明記 rg |
| SPEC-SUP-D5 | Scope 5 / 6 | M-D3 / M-D4 | migration 方式 | updated_at 行 + §14 存在 |
| SPEC-SUP-D6 | Scope 1 | M-D5 | 確認 dialog 契約 | 78 doc 文言節 |
| SPEC-SUP-D7 | Scope 13 | M-D10 | C21/C22 予約 | D-078 記述 |
| SPEC-SUP-D8 | Scope 4 | M-D6 | wire 凍結境界 | 40-cmd 追記 + 既存節無改変 |
| REQ-107 | Scope 11 / 12 | M-D8 | traceability | generate_traceability --check PASS |

## Data Safety

- 実店舗 DB・実取引先名・実 POS データを docs に書かない（設計例示は「テスト取引先A」等の synthetic 名のみ）。
- local-only paths: なし（docs-only）。
- synthetic-only paths: docs 内の例示すべて。

## Implementation Results

Scope 1〜14 を source docs へ正本化した。UI-15 の operator workflow、IO / BIZ / CMD 境界、migration v6、REQ-107、navigation、D-078 の C21 / C22 予約を同期し、90-traceability を再生成して design compliance の SKIP_DOCS を 1 行追加した。実装コード、generated bindings、route、navigation 実装、invalidation contract は変更していない。AC-1〜AC-10、M-D1〜M-D11 と本 packet が指定する local gate は PASS。PR は本発注の指示に従い作成していない。

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

確定前の空欄（レビュー後に記入）。
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
