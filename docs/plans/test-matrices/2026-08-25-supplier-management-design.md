# Test Design Matrix — 取引先管理（改名・統合）design-first

対象 packet: [2026-08-25-supplier-management-design.md](../2026-08-25-supplier-management-design.md)

docs-only design-first PR のため、oracle は「新文言 exact 存在 + 旧文言 0 hit」の対 + 機械 gate（doc-consistency / design_compliance / traceability）で構成する（PR #85 L3 起源の文言表 presence oracle 規律に準拠）。実装挙動の test は「実装 PR への予約」節に test 名で予約し、本 PR では実行しない。

## 本 PR の Matrix（M-D1〜M-D11）

| ID | 対象契約 | Oracle（機械検証手順） | Would fail if |
|---|---|---|---|
| M-D1 | SPEC-SUP-D1 / D10（Deferred 解除範囲と境界） | `rg -F '取引先の改名・統合・専用管理画面、問屋チャネル、約 80 社の事前一括投入' docs/ --glob '!docs/archive/**'` = 0 hit、かつ `rg -F '取引先の削除（統合で代替）、問屋チャネル、約 80 社の事前一括投入' docs/function-design/77-ui-bulk-price-revision.md` ≥ 1 hit | 旧 Deferred 行が残存する / 削除・問屋・80 社が誤って解除される（新行から欠落する） |
| M-D2 | UI-01b-D21 の 3 箇所改訂 sweep | `rg -F '改名・統合 UI や約 80 社の事前一括投入は扱わない' docs/ --glob '!docs/archive/**'` = 0 hit、かつ `rg -c 'UI-15' docs/function-design/51-ui-product-form.md` ≥ 1 | 3 箇所のうちいずれかが旧文言のまま残る（36 行決定表 / 149-154 実装節 / 209 Test Focus） |
| M-D3 | SPEC-SUP-D5（updated_at 列定義） | `rg -n 'updated_at' docs/db-design/master-tables.md` の hit が suppliers 節（§3）内に存在し、nullable + backfill = created_at の記述を含む | updated_at が表定義に載らない / NOT NULL と誤記される（SQLite ALTER TABLE 制約違反の設計） |
| M-D4 | SPEC-SUP-D5（migration v6 節） | `rg -n 'migration v6|v6' docs/function-design/22-mnt-migration.md` で §14 節見出しと MIGRATIONS 登録順（v1→…→v6）の記述が存在 | 22-mnt に v6 節がない / 登録順記述が v5 止まりのまま |
| M-D5 | SPEC-SUP-D2 / D6（78 doc の画面契約） | `docs/function-design/78-ui-supplier-management.md` が存在し、`rg -o 'SPEC-SUP-D[0-9]+' <同 file> \| sort -u` が D1〜D10 の 10 ID、統合確認 dialog の影響件数文言（「付け替わります」）と不可逆明記を含む | doc 欠落 / SPEC ID の一部欠落 / 確認 dialog 契約の欠落 |
| M-D6 | SPEC-SUP-D3 / D4 / D8（backend 3 層の契約） | `rg -c 'rename_supplier' docs/function-design/20-io-product-repo.md docs/function-design/30-biz-product-service.md docs/function-design/40-cmd-product.md` 各 ≥ 1、`merge_suppliers` も同様 | いずれかの層 doc に関数契約が欠落し、実装 PR が層責務を推測で書くことになる |
| M-D7 | SPEC-SUP-D2 / D9（到達導線の正本登録） | `rg -c 'UI-15' docs/SCREEN_DESIGN.md docs/function-design/52-ui-shared-layout.md` 各 ≥ 1、52 §52.3 表に `/settings/suppliers` 行、§52.4 が 21 項目表記 | 画面表・ルーティング表・navigation 契約のいずれかに UI-15 が未登録（UI-13 Amendment 4 の到達導線 failure class） |
| M-D8 | REQ-107（要求正本 + traceability） | `rg -n 'REQ-107' docs/spec/requirements.md` ≥ 1（coverage=deferred 明記）、`cd src-tauri && cargo run --bin generate_traceability -- --check` PASS | REQ 未採番のまま SPEC だけ進む / 90-traceability drift（T1 ERROR） |
| M-D9 | SKIP_DOCS 登録 + 削除不在 | `cd src-tauri && cargo test --test design_compliance_test` PASS、`rg -i 'delete_supplier' docs/ --glob '!docs/archive/**'` = 0 hit | SKIP_DOCS 漏れで CI fail（PR #93 WER 教訓）/ 削除機能が紛れ込む |
| M-D10 | SPEC-SUP-D7（C21/C22 予約） | `rg -n 'C21|C22' docs/decision-log.md` で D-078 内に予約記述が存在し、D-052 本文の C1〜C20 列挙（391-395 行）は無改変 | 予約なしで実装 PR が採番し衝突（PR #86 C18 二重割当の同族）/ D-052 本文を先行改変して doc↔実装 SSOT が乖離 |
| M-D11 | SPEC-SUP-D4（merge 参照全数） | `rg -c 'receiving_records' docs/function-design/78-ui-supplier-management.md docs/function-design/30-biz-product-service.md docs/db-design/master-tables.md` 各 ≥ 1（merge 契約文脈で products と併記） | receiving_records が契約から欠落し、実装が products のみ付替え → DELETE 時 FK 違反の設計欠陥が正本化される |

negative rg の判定は「肯定文 0 hit」を基準とし、否認文脈（「〜は扱わない」等の残置が意図されるもの）は M-D1 / M-D2 の新行 exact oracle 側で拘束する（PR #93 WER (3) の書き分け規律）。

## 共通 gate

- `bash scripts/doc-consistency-check.sh` ERROR 0（active plan があるため `--target plan` も実行）
- `cd src-tauri && cargo fmt --check`（SKIP_DOCS 1 行変更の整形確認）

## 実装 PR への予約（本 PR では実行しない）

実装 packet 起草時に本節を Ledger へ継承する。test 名は予約であり、実装 PR の Matrix で確定する。

| 予約 ID | 対象 | 予約 test 名 / 検証形 |
|---|---|---|
| R-1 | migration v6 up + backfill | `test_migration_v6_adds_updated_at_with_backfill`（既存行の updated_at = created_at、新規行は NULL 許容） |
| R-2 | rename 契約 | `test_rename_supplier_trims_and_rejects_empty` / `test_rename_supplier_conflict_returns_validation` / `test_rename_supplier_same_name_noop` / `test_rename_supplier_updates_updated_at_and_logs` |
| R-3 | merge 契約（参照全数） | `test_merge_suppliers_repoints_products_and_receiving_records_then_deletes` / `test_merge_suppliers_rejects_same_id` / `test_merge_suppliers_not_found` / `test_merge_suppliers_single_tx_rollback_on_failure`。**mutation 予約: receiving_records 側 UPDATE を欠落させた mutant が red になること（片側付替えの survivor 防止、二次条件は専用 test 行に分離する PR #94 WER (2) 規律）** |
| R-4 | operation_log | `test_merge_suppliers_writes_operation_log`（source/target 名 + 件数）/ rename 側は R-2 に含む |
| R-5 | usage 件数 | `test_list_suppliers_with_usage_counts`（products / receiving_records の COUNT が実データと一致、0 件取引先も列挙）。**空集合 oracle 単独禁止: 非空期待 case を必ず含める（順22 X2 教訓）** |
| R-6 | 到達導線 | `navigation.test.ts` に REQ-107 入り到達テスト（ui-11c パターン） |
| R-7 | UI 挙動 | RTL: 一覧表示 / インライン改名の確定・キャンセル / 統合 dialog の 2 段階と影響件数表示 / エラー文言表示。invalidation C21/C22 の発火 assert |
| R-8 | 既存凍結 | 既存 supplier 3 関数（list / create / find_or_create）の既存 test 無改変 + bindings diff で既存 export 不変 |
| R-9 | wire | bindings 再生成 diff が新規 3 command + 2 DTO の追加のみであること |
| R-10 | requirements | REQ-107 を coverage=required へ昇格 + 90-traceability 再生成 |
