# Test Design Matrix: 取引先管理 実装 PR（UI-15 + migration v6 + supplier 3 command + D-052 C21/C22）

Plan Packet: `docs/plans/2026-08-25-supplier-management-impl.md`。予約元: `docs/archive/plans/test-matrices/2026-08-25-supplier-management-design.md`「実装 PR への予約」R-1〜R-10（Rust 予約名 R-1〜R-5 を確定し、R-6 到達 / R-7 RTL / R-8 既存凍結 / R-9 wire / R-10 requirements を本 Matrix と packet AC で消化する）。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-SUP-D5 / SPEC-SUPI-D1: migration v6 = `suppliers.updated_at` nullable 追加 + `created_at` backfill + 同一 TX 内検証 + 再実行非重複、kind = `MigrationKind::Custom`（22-mnt §14 是正込み）。
- SPEC-SUP-D3: rename = trim / 空文字 `validation` / 他行と同名 `validation` / 不存在 `not_found` / 同値 no-op 成功（updated_at・operation_log 非更新）/ 実改名時 `updated_at` + operation_log `supplier_rename`。
- SPEC-SUP-D4: merge = source≠target・両者実在の検証後、1 TX で products UPDATE → receiving_records UPDATE → source DELETE → operation_log `supplier_merge`（ID・名称・2 件数）。途中失敗は全 rollback。再実行は `not_found`。
- SPEC-SUP-D8: `list_suppliers_with_usage` = 2 参照表の独立集約（同時 JOIN の件数水増しなし）、0 件取引先も列挙、name 昇順全件。wire = 新規 3 command + `SupplierMergeResult` / `SupplierWithUsage` のみ追加、既存 `list_suppliers` / `create_supplier` 凍結、`Supplier` model 不変（SPEC-SUPI-D7）。
- SPEC-SUP-D2 / D6: UI-15 一覧（列 / `N件` / `0件` / name 昇順）+ 追加 dialog + インライン改名（Enter / Escape / pending 行単位 / 同名文言 / 失敗保持）+ 統合 dialog 2 段階（段階 1 選択必須 / 段階 2 影響件数文言 + 不可逆文言 / 完了通知件数一致 / 失敗保持）。
- SPEC-SUP-D7 / SPEC-SUPI-D2: C21（rename）/ C22（merge）= 8 key 集合の invalidate、oracle 独立転記、meta 22。
- SPEC-SUP-D1 / D10: 単独削除 action 不在。
- SPEC-SUP-D9 / SPEC-SUPI-D5: 到達導線（navigation `ui-15` + route + icon `Building2`）。
- SPEC-SUPI-D6: `SupplierManagementPage` = `EXCLUDED_PAGES`（UI-USW-D3 (c)）。
- 登録・生成: bindings / 90-traceability / routeTree.gen.ts（gitignore）/ REQ-107 昇格。

## Failure Modes

- receiving_records 側 UPDATE が欠落し DELETE が FK 違反、または products のみ付け替わり過去入庫の取引先表示が欠落する（failure 定義筆頭）。
- merge が TX でなく途中失敗で片側付替えだけ残る / operation_log が TX 外で失敗時にも残る。
- 統合後の再実行が黙って成功する / source==target が通る。
- rename の同値 no-op で updated_at・operation_log が更新される / 実改名で updated_at が更新されない。
- migration v6 の backfill 欠落（既存行 NULL のまま）/ 再実行で v6 重複適用 / NOT NULL で追加して SQLite 制約違反。
- usage 件数が同時 JOIN で水増しされる / 0 件取引先が一覧から落ちる / 昇順が崩れる。
- C21/C22 の key 欠落で受入一覧・受入詳細・商品検索・在庫詳細・在庫少の `supplier_name` が stale のまま残る / consumer ゼロの key を含み過剰 invalidation 違反。
- 統合 dialog が段階 1 を飛ばして実行できる / 件数文言・不可逆文言が省略される / pending 中に二重送信・dialog 閉鎖ができる。
- 失敗時に入力・選択が消える / 1 操作の失敗が他行・一覧全体を隠す。
- bindings diff が既存 export を変える / `Supplier` 型に updated_at が漏れる。
- navigation entry が未登録で route だけ存在する（UI-13 Amendment 4 の到達導線 failure class）/ sweep test T17 が未分類 Page で落ちる。
- REQ-107 が deferred のまま / requirements 補足文が旧状態のまま / 90-traceability 未再生成で T1 drift。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- 既存 test（無改変で PASS を要求、rg で実在確認済み 2026-08-25）: `test_list_suppliers_req101_empty` / `test_find_or_create_supplier_req101_creates_new` / `test_find_or_create_supplier_req101_finds_existing`（product_repo.rs）、`test_navigation_all_items_no_pending_status`（navigation.test.ts）、`invalidation-contract.static.test.ts`（ALLOWED 2 list 無改変）。既存 test case（fn / it / assertion / manifest）の改変は 4 例外のみ: `unsaved-changes-guard-sweep.test.ts` `EXCLUDED_PAGES` 1 entry / `invalidation-contract.meta.test.ts` 件数 literal 20 → 22 / `src/test/invalidation-oracle.ts` への C21/C22 独立転記追記 / 既存 migration 系 test（`migration.rs` + `schema_v2.rs`、repo 全体 sweep で全数確定）の version・件数期待 literal 5 → 6 と対応説明文言の機械的追従（gated amendment 2 + 3、検証意味不変）。いずれも上記以外の既存 assertion は不変。既存 test file への新規 test fn の追加は改変に当たらず、packet Scope が名指しする追加先（`navigation.test.ts` の R-6 / `product_repo.rs`・`product_service.rs`・migration 系の R-1〜R-5）に限り許容する（gated amendment 1、Codex fail-closed 起源）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPEC-SUPI-D1 backfill | 既存行 NULL 残存 | unit (Rust, R-1) | `test_migration_v6_adds_updated_at_with_backfill` | v5 適用済み DB に synthetic 取引先 2 行を入れて v6 適用後、`SELECT updated_at FROM suppliers` が `created_at` と exact 一致しない、または新規 INSERT 行（updated_at 未指定）が NULL で保存できない |
| SPEC-SUPI-D1 再実行 | v6 重複適用 | unit (R-1 内) | 同上 | migrate を 2 回呼ぶと schema_versions の v6 行が 2 行になる、または 2 回目が error になる |
| SPEC-SUP-D3 trim / 空文字 | 空白名で更新 | unit (Rust, R-2) | `test_rename_supplier_trims_and_rejects_empty` | `"  新名  "` が trim されず保存される、`""` / `"   "` が `ValidationFailed` にならない |
| SPEC-SUP-D3 同名衝突 | UNIQUE error 露出 | unit (R-2) | `test_rename_supplier_conflict_returns_validation` | 他行と同名への改名が `ValidationFailed` 以外（DB error 素通し等）になる |
| SPEC-SUP-D3 同値 no-op | no-op で副作用 | unit (R-2) | `test_rename_supplier_same_name_noop` | 同値改名が error になる、または `updated_at` が変わる / operation_logs 行数が増える（改名前後の SELECT で exact 比較） |
| SPEC-SUP-D3 / D5 実改名 | updated_at / log 欠落 | unit (R-2) | `test_rename_supplier_updates_updated_at_and_logs` | 実改名後の `updated_at` が改名前と同値のまま、operation_logs に `supplier_rename` 行がない、不存在 ID が `NotFound` にならない |
| SPEC-SUP-D4 参照全数 | receiving_records 欠落 | unit (Rust, R-3) | `test_merge_suppliers_repoints_products_and_receiving_records_then_deletes` | fixture（source に商品 2 + 入庫 1、target に商品 1）で merge 後、products の source 参照が 0 / target 3 にならない、receiving_records の source 参照が 0 / target 1 にならない、source 行が残る、返却が `(2, 1)` でない。**mutation 予約: IO `merge_suppliers` から receiving_records 側 UPDATE を欠落させた mutant で本 test が red になること（FK 違反 or 件数不一致で検出。二次条件を同居させない専用 test、PR #94 WER (2) 規律）** |
| SPEC-SUP-D4 source==target | 自己統合 | unit (R-3) | `test_merge_suppliers_rejects_same_id` | 同一 ID で `ValidationFailed` にならず行が消える |
| SPEC-SUP-D4 不存在 / 再実行 | 黙って成功 | unit (R-3) | `test_merge_suppliers_not_found` | source または target 不存在で `NotFound` にならない、merge 成功後の同引数再実行が `NotFound` にならない |
| SPEC-SUP-D4 rollback | 片側付替え残存 | unit (R-3) | `test_merge_suppliers_single_tx_rollback_on_failure` | receiving_records 側 UPDATE を一時 trigger（`BEFORE UPDATE ... RAISE(ABORT)`）等で失敗させたとき、products の付替え・source DELETE・operation_logs 行のいずれかが残る |
| SPEC-SUP-D4 audit | log 内容不備 | unit (Rust, R-4) | `test_merge_suppliers_writes_operation_log` | operation_logs の `supplier_merge` 行に source / target の ID・名称・2 件数のいずれかが欠ける |
| SPEC-SUP-D8 usage 件数 | 水増し / 0 件欠落 | unit (Rust, R-5) | `test_list_suppliers_with_usage_counts` | fixture（取引先 A = 商品 2 + 入庫 2〈同 supplier で複数行〉、B = 商品 1 + 入庫 0、C = 0 + 0）で `(2,2)` / `(1,0)` / `(0,0)` の exact 一致にならない（同時 JOIN なら A が 4 件等に水増し）、C が一覧から落ちる、name 昇順でない。**空集合 oracle 単独禁止: 非空期待 case（A / B）を必ず含める（順22 X2 教訓）** |
| SPEC-SUP-D8 wire | 既存 export 変化 | CLI + 既存 test (R-8 / R-9) | `cd src-tauri && cargo run --bin generate_bindings && git diff --stat src/lib/bindings.ts` 空 + diff 内容検分 + 既存 supplier 3 test 無改変 PASS | bindings stale、新規 3 command + 2 DTO 以外の diff、`Supplier` 型行の変更、既存 test の改変 |
| SPEC-SUP-D2 一覧 | 件数・順序・0件 | RTL (SupplierManagementPage.test.tsx) | `REQ-107 一覧は name 昇順で取引先名・関連商品数・入庫記録数を N件 表示し 0 件も 0件 と明示する` | mock 3 件（独立転記 oracle: あ=2件/1件、か=1件/0件、さ=0件/0件）で行順・`2件` `0件` の exact text が出ない、0 件行が空欄になる |
| SPEC-SUP-D2 / REQ-106 追加 | wire 逸脱 / 過剰 invalidate | RTL | `新しい取引先を追加は trim して createSupplier を呼び成功後に usage 一覧だけを再取得する` | `createSupplier` 引数が trim 後でない、成功後に `listSuppliersWithUsage` が再取得されない、`invalidateQueries` が呼ばれる（追加は D-052 entry 外 = 78 §78.9） |
| SPEC-SUP-D2 追加 validation | 空白で CMD | RTL | `取引先名が空白のみなら createSupplier を呼ばず field error を出す` | 空白のみで `createSupplier` が呼ばれる、`取引先名を入力してください` が出ない、失敗 reject 後に dialog / 入力が消える |
| SPEC-SUP-D3 改名 UI | 確定 / 取消 | RTL | `名前を変更で行が入力欄になり保存で renameSupplier を呼び Escape で現在名に戻す` | 入力欄の初期値が現在名でない、保存 / Enter で `renameSupplier(supplierId, 新名)` が呼ばれない、Escape 後に CMD が呼ばれる・表示が現在名に戻らない |
| SPEC-SUP-D3 同名文言 | 統合誘導欠落 | RTL | `他行と同名の改名は統合案内の validation 文言を表示し入力を保持する` | `同じ名前の取引先があります。重複している場合は「統合」を使ってください。` の exact text が出ない、入力が消える |
| SPEC-SUP-D3 失敗保持 | 入力消失 / 他行巻込み | RTL | `改名失敗時は行の編集状態と入力を保持し再試行を出す` | reject 後に編集状態が閉じる / 入力 value が消える / `再試行` がない / 他行の表示・操作が変わる |
| SPEC-SUP-D3 pending | 全行 disabled | RTL | `改名 pending 中は同じ行だけ無効化する` | 未解決 promise 中に同行の入力・保存・キャンセルが disabled でない、他行の `名前を変更` まで disabled になる |
| SPEC-SUP-D6 段階 1 | 段階 skip | RTL | `統合は残す側を選ぶ段階 1 を経ないと実行できない` | source 行自身が残す側候補に出る、未選択で `次へ` が進める、段階 1 に `統合する` 実行 button が出る |
| SPEC-SUP-D6 段階 2 文言 | 件数・不可逆欠落 | RTL | `段階 2 は source の usage 件数で「◯件の商品 / ◯件の入庫記録が付け替わります」と「元に戻せません」を表示する` | `2件の商品 / 1件の入庫記録が付け替わります`（mock source の独立転記件数）の exact text がない、`この操作は元に戻せません` を含む文言がない、`残す取引先を選び直す` で段階 1 に戻れない |
| SPEC-SUP-D4 / D6 実行 | 二重送信 / 通知不一致 | RTL | `統合するは mergeSuppliers を 1 回だけ呼び成功で dialog を閉じ結果件数と一致する完了通知を出す` | `mergeSuppliers(sourceId, targetId)` が 2 回以上呼ばれる、pending 中に dialog が閉じられる、完了通知の件数が `SupplierMergeResult` mock（独立転記）と不一致、一覧再取得されない |
| SPEC-SUP-D6 失敗保持 | 選択消失 | RTL | `統合失敗時は段階 2 と選択・件数表示を保持し統合できませんでしたと再試行を出す` | reject 後に dialog が閉じる / 段階 1 に戻る / source・target・件数表示が消える / `統合できませんでした` + 再試行導線がない |
| SPEC-SUPI-D2 C21 | 集合不一致 | RTL | `改名成功後に D-052-C21 の独立 oracle 集合を invalidate する` | `invalidateQueries` spy の key 集合が test 側 literal oracle（`["product-form"]` / `["price-revision"]` / `["suppliers"]` / `["product-list"]` / `["products","low-stock",{includeDiscontinued:false}]` / `["stock-inquiry"]` / `["receivings"]` / `["inventory-records"]`）と順序非依存・重複なしで完全一致しない |
| SPEC-SUPI-D2 C22 | 集合不一致 | RTL | `統合成功後に D-052-C22 の独立 oracle 集合を invalidate する` | 同上（C22 oracle。C21 と同集合だが entry・handler は別で、hook 取り違えを検出） |
| SPEC-SUP-D1 / D10 | 削除 action 混入 | RTL + CLI | 一覧 RTL 内で操作列 button が `名前を変更` / `統合` のみであることを assert + `rg -i 'delete_supplier' src/ src-tauri/src/` = 0 hit | 削除 button / 削除 command が存在する |
| 78 §78.8 Loading / Empty / Error | 0 件誤認 | RTL | `一覧取得失敗は取引先を読み込めませんでしたと再試行を出し 0 件と誤認させない` / `0 件は取引先はまだ登録されていませんと追加導線を出す` / `not-found 失敗時は一覧が古い可能性の文言と再取得 action を出す` | reject で Empty 文言が出る、`再試行` 押下で `listSuppliersWithUsage` が再呼出しされない、0 件時に追加導線がない、rename / merge の `not_found` 後に一覧再取得導線がない |
| SPEC-SUP-D9 到達 | 未登録 / pending | unit (navigation.test.ts, R-6) | `test_navigation_req107_ui15_active_at_settings_suppliers` | `ui-15` entry がない、`to !== "/settings/suppliers"`、`status !== "active"`、システム管理エリア外にある |
| SPEC-SUPI-D6 分類 | T17 FAIL | unit 既存 + CLI | 既存 T17 PASS + `rg -c "SupplierManagementPage" src/hooks/unsaved-changes-guard-sweep.test.ts` = 1 + `rg -c "UI-USW-D3" docs/function-design/78-ui-supplier-management.md` ≥ 1 | 未分類 / `APPLIED_PAGES` 側 / 78 doc に非適用 1 文がない |
| D-052 登録 | 件数 / oracle 不一致 | unit + CLI | `invalidation-contract.meta.test.ts`（`toHaveLength(22)`）PASS + `invalidation-contract.static.test.ts` PASS + `rg -c "C21|C22" docs/decision-log.md docs/UI_TECH_STACK.md` 各 ≥ 1 | entry 20 のまま、oracle 未転記、success handler が `invalidateByContract` 以外、docs 未追記 |
| C21/C22 正本同期（P1-1） | 非対称の旧記述残存 | CLI | packet AC-11 — `rg -F 'UI-15 新設 key の 3 系統'` / `rg -F '上記 3 系統 + products 系 root'` が 78 doc で各 0 hit + `rg -F -c '同一の 8 key 集合に確定' docs/function-design/78-ui-supplier-management.md docs/decision-log.md` 各 ≥ 1 | 78 §78.9 / D-078 が予約時の非対称列挙のまま残り、実装 SSOT（8 key 対称）と正本が食い違う |
| REQ-107 / 登録生成 | 昇格漏れ / drift | CLI (R-10) | `rg -n 'REQ-107' docs/spec/requirements.md` の全 hit に deferred 残存なし + `cd src-tauri && cargo run --bin generate_traceability -- --check` exit 0 + `npm run generate:routes && npm run typecheck` PASS + `git ls-files src/routeTree.gen.ts` 空 | deferred 残存、traceability drift、route 未生成、生成物 commit |
| SPEC-SUPI-D1 kind 是正 | doc↔実装乖離 | CLI | `rg -c "MigrationKind::Custom\(schema_v6::apply_v6_supplier_updated_at\)" src-tauri/src/db/migration.rs docs/function-design/22-mnt-migration.md` 各 = 1 + `rg -c "get_v6_supplier_updated_at_schema" docs/ src-tauri/` = 0 | 旧 Sql 表記の残存、doc と実装の kind 不一致 |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| UI-15 一覧 | 到達時 `listSuppliersWithUsage` | `ListSkeleton`（列構造維持） | name 昇順 + `N件` | C21 / C22 の `suppliers.root` 配下 | 同 key 再取得 | 再訪で再取得（URL state なし） | アプリ再起動で同じ | Alert `取引先を読み込めませんでした` + 再試行、0 件と誤認させない | 再試行で refetch | RTL 一覧 / Empty / Error |
| 追加 dialog | 閉 | 入力 + 送信中 disabled | `createSupplier` → usage 一覧のみ再取得 → 行が見える | —（D-052 entry 外） | 自画面のみ | 開閉 state は一覧再取得で失わない | — | dialog / 入力保持 + field error or Alert | 再送信 | RTL 追加 |
| 改名行 | 表示（現在名） | 編集（初期値 = 現在名）→ pending（同行のみ disabled） | 同値 no-op 含め成功 → 編集閉じ → C21 → 再取得の name が正 | C21（8 key） | usage 一覧 + 他画面 consumer | 再訪で DB 値 | 同左 | 行内 error + 入力保持 + 再試行、他行不変 | 同行再確定 | RTL 改名 4 件 |
| 統合 dialog | 段階 1（source 除外候補、未選択） | 段階 2 → 実行 pending（閉鎖・二重送信不可） | dialog 閉 → 完了通知（2 件数一致） → C22 | C22（8 key） | usage 一覧 + 受入系 + 商品系 | 再訪で source 不在 | 同左 | 段階 2 + 選択 + 件数保持 + `統合できませんでした` + 再試行 | 再実行（source 消失後は `not_found` → 一覧再取得導線） | RTL 統合 4 件 |
| suppliers / products / receiving_records / operation_logs（DB） | 現値 | BIZ 1 TX | 2 UPDATE + DELETE + log commit | — | — | — | migration v6 済み DB として起動 | TX rollback で全不残存 | 再操作 | R-3 / R-4 |
| schema_versions | v5 | v6 適用中 TX | v6 1 行 | — | — | — | 再起動時に v6 重複適用しない | rollback で v5 のまま | 再 migrate | R-1 |
| Workflow State（packet） | plan-draft | plan-gate | plan-approved → implementing | content candidate → L1 | independent-review | human-confirm（Reviewed Content HEAD） | Ready state-only → exact-HEAD L1 → PR body | state-only violation → implementing へ戻す | state-backtrack | `check-workflow-git.sh` |

Workflow-state rows:

- content candidate -> L1 / independent review -> state-only human-confirm commit: Writer の content commit 後に L1 full、独立 Sonnet Final Review、P1/P2 = 0 で human-confirm 遷移 commit 内に `Reviewed Content HEAD` を設定。
- owner authorization -> Draft state-only Ready commit -> exact-HEAD L1 -> PR body -> Ready/dispatch -> merge with no later tracked commit: L3 PASS + Ready 承認 → state-only `human-confirm->ready-hosted-final` → exact-HEAD L1 → PR body → Ready（CI-TRIGGER-D1 自動 run）→ 三点一致 → merge。
- state-only violation: file allowlist と `git diff --unified=0` hunk の両方で検査。Scope / AC / Ledger / test / bindings に触れた state-only commit は implementing へ戻す。
- hosted-not-required incidental failure: 該当なし（Hosted CI Requirement = required）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| migration Custom pattern（BEGIN → 変更 → 検証 → schema_versions → COMMIT） | `schema_v2::apply_v2_idempotency` / `schema_v3::apply_v3_plu_target` / `schema_v5::apply_v5_plu_slots` | `schema_v6::apply_v6_supplier_updated_at` | `MigrationKind::Sql`（v1 / v4）は TX 内検証を挟めないため不採用（SPEC-SUPI-D1） | R-1 + AC-7 rg |
| BIZ 1 TX + operation_log | `revise_product_price`（`conn.transaction()` + `insert_operation_log`、product_service.rs） | `rename_supplier` / `merge_suppliers` | — | R-2 / R-3 / R-4 |
| BIZ 所有 DTO + CMD qualified path（SPEC-PRVA-D5） | `PriceRevisionResult` 等（product_service.rs、`#[derive(Debug, serde::Serialize, specta::Type)]`） | `SupplierMergeResult` / `SupplierWithUsage` | CMD 側再定義は禁止（40-cmd 正本） | AC-2 bindings diff |
| CMD 3 行 pattern | `create_supplier`（product_cmd.rs: DB lock → BIZ → `map_err(CmdError::from)`） | 新設 3 command | 新規 error 変換なし（既存 `From<BizError>` で validation / not_found / duplicate を網羅） | design_compliance + AC |
| mutation 成功時 invalidation（D-052） | `useReviseProductPrice` → C20（`invalidateByContract`） | `useRenameSupplier` → C21 / `useMergeSuppliers` → C22 | 追加（create）は 78 §78.9 で entry 外（既存 inline 追加と同型）。stockMovements / stocktake / 売上系は supplier 列の consumer 0 hit で除外（過剰 invalidation 禁止） | RTL oracle + meta 22 + static |
| navigation active entry + 到達テスト | `ui-13`（`test_navigation_req904_ui13_active_at_settings_integrity`） | `ui-15` + `test_navigation_req107_ui15_active_at_settings_suppliers` | — | R-6 |
| settings route 構成 | `settings/backup.tsx` / `logs.tsx` / `integrity.tsx`（layout なし並列配置） | `settings/suppliers.tsx` | URL search state は持たない（78 §78.3）ため `validateSearch` なし | route + typecheck |
| 取引先追加 dialog（trim / 空文字 / IME） | `features/products/components/CreateSupplierDialog.tsx`（実装 A UI-01b-D21） | `features/suppliers/components/CreateSupplierDialog.tsx` 新設（SPEC-SUPI-D4） | cross-feature import と共通昇格は不採用（成功時挙動が画面文脈で異なる） | RTL 追加 + L3 item 2 |
| 未保存編集の離脱ガード分類（UI-USW-D3） | `unsaved-changes-guard-sweep.test.ts` manifest（`StocktakePage` / `PriceRevisionPage` = (c)） | `SupplierManagementPage` を `EXCLUDED_PAGES` へ（(c) 行単位即時保存 + dialog 完結） | `APPLIED_PAGES` 配線は 78 doc 契約外 | T17 PASS + 78 doc 1 文 |
| 一覧 Loading / Empty | `ListSkeleton`（PR #95 新設）/ `EmptyState` | UI-15 一覧 | — | RTL |
| 行内 error + 再試行 | `PriceHistorySection` / UI-14 行確定 error | 改名行 error / 統合 dialog error | — | RTL 失敗保持 2 件 |
| IME 合成中 Enter の無視 | `SearchBar`（UI-01a-D9）/ products 版 CreateSupplierDialog | 追加 dialog + 改名行の Enter 確定 | RTL で判別不能な native IME 挙動は L3 へ | L3 item 2 / 3 |

## Negative Paths

- missing input: 追加・改名の空文字 / 空白のみ → field error `取引先名を入力してください`、CMD なし。統合の残す側未選択 → `次へ` 不能。
- invalid input: source==target（UI では候補から除外 + CMD `validation` の二重防御）。
- duplicate/ambiguous input: 追加の同名 → 既存行返却（既存契約維持）。改名の同名 → 統合案内 validation。統合実行の連打 → pending disabled。
- unknown reference: 改名・統合対象が他所で消えていた場合 → CMD `not_found` → 一覧が古い可能性の文言 + 再取得 action（78 §78.8、失敗を成功扱いにしない）。
- dependency missing: 一覧取得失敗 → Alert + 再試行、0 件と誤認させない。
- permission/write failure: merge 途中失敗 → TX rollback で全不残存（R-3）。
- dry-run side effect: 該当なし。

## Boundary Checks

- threshold: paging なし（全件一覧、78 §78.3。利用規模は漸進補完の数十件想定 = 設計正本の契約値）。
- null/default: `updated_at` NULL = 改名前として全経路許容（新規作成時 NULL）。`receiving_records.supplier_id` NULL 行は merge の UPDATE 対象外（WHERE supplier_id = source のみ）。
- empty/non-empty: 0 件一覧 → Empty 文言 + 追加導線。usage 0 件 → `0件` 明示。R-5 は非空期待 case 必須。
- min/max: 件数 i64（SQLite COUNT 自然型）。name は trim 後 1 文字以上 + UNIQUE。
- status/policy enum: 行状態（表示 / 編集 / pending / error）は UI local。新 `CmdErrorKind` なし。
- wire type: 新規 3 command + `SupplierMergeResult { products_updated, receiving_records_updated }` / `SupplierWithUsage { id, name, product_count, receiving_record_count }`（snake_case JSON）。
- internal type: IO `SupplierUsageRow`（非公開）→ BIZ 変換。`Supplier` model 不変。
- producer/consumer: product_cmd → bindings.ts → UI-15 のみ。既存画面は新 command を呼ばない。
- round-trip token: なし（URL search state なし）。
- cross-language parse: `updated_at` は `%Y-%m-%dT%H:%M:%S`（Local）の TEXT。wire に載せない（SPEC-SUPI-D7）。

## Compatibility Checks

- old schema/input: v5 適用済み DB に v6 適用で既存 suppliers 行が backfill される（R-1）。既存 supplier command の入出力不変（既存 test 無改変 PASS）。
- new schema/input: 新規 DB は v1→…→v6 を連続適用。updated_at NULL の新規行を全経路が許容。
- output order: `list_suppliers_with_usage` は `ORDER BY suppliers.name ASC`。既存 `list_suppliers` の順序不変。
- optional field behavior: 該当なし（新 command は必須引数のみ）。

## Data Safety Checks

- source-derived data: 実店舗の取引先名・商品・入庫実績を fixture に使わない。
- generated outputs: `bindings.ts` / `90-traceability.md` は generator 出力をそのまま commit。`routeTree.gen.ts` は commit しない。
- secrets: 該当なし。
- local-only files: owner の local DB とその backup（L3 用、repo 外）。
- synthetic sample boundaries: Rust test は temp DB、RTL は mock `commands`、L3 は synthetic 投入 → backup 復元。

## Main Wiring / Integration Checks

- helper connected to main path: `useSuppliersWithUsage` が `commands.listSuppliersWithUsage` を `queryKeys.suppliers.withUsage()` で呼ぶ、`useRenameSupplier` / `useMergeSuppliers` が成功時に `invalidateByContract(..., supplierRename() / supplierMerge())` を呼ぶ（static test + RTL oracle）。
- output reaches manifest/report: `bindings.ts` に 3 command + 2 DTO、`navigation.ts` に `ui-15`、`routeTree.gen.ts`（生成）に `/settings/suppliers`、`90-traceability.md` に REQ-107 の test 参照、`migrations()` に v6 entry。
- effective config reaches runtime: `migration.rs` の v6 登録が起動時 migrate で実行される（R-1 は `migrations()` 経由で適用して検証する）。
- CLI arg reaches implementation: `generate_traceability` が新設 FE test の `REQ-107` / `UI-15` 参照を拾い、T4 baseline 22 を変えない（--check exit 0）。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant?: RTL の件数・文言 oracle は mock 入力と期待値を test 内 literal で独立転記する（`2件の商品 / 1件の入庫記録が付け替わります` は mock source の usage 値から test 側で組む）。C21/C22 oracle は literal key 配列で `invalidationContract` を import しない（D-052-S1）。Rust の usage 件数は fixture の実 INSERT 行数から独立に期待値を書く。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct?: 改名 RTL は `renameSupplier` 解決 → C21 invalidate → 再取得 mock の新名称表示の順を `mock.calls` と `findByText` で検証。統合 RTL は解決 → C22 → 一覧から source 消失を検証。
- If a key branch is inverted, which test fails?: 同値 no-op 判定の反転 → `_same_name_noop`（log 行数増で検出）。`include` 判定はなし。source==target guard 除去 → `_rejects_same_id`。統合段階判定の反転（段階 1 で実行可）→ RTL 段階 1 test。
- If a threshold comparison changes, which test fails?: 該当 threshold なし（paging / 上限なし）。trim 後空文字判定を `len() > 1` に変える → 1 文字名の追加・改名が落ちる（R-2 trim test に 1 文字 case を含める）。
- If a guard is removed, which test fails?: receiving_records UPDATE 除去 → R-3 主 test（mutation 予約）。DELETE 前の参照 0 化を外し DELETE を先行 → FK 違反で R-3 主 test。空文字 guard 除去 → R-2 / RTL。pending disabled 除去 → RTL pending。段階 2 の不可逆文言削除 → RTL 段階 2 test（exact text）。
- If an output field is omitted, which test fails?: `SupplierMergeResult` の片件数省略 → R-3 返却 assert + RTL 完了通知。`SupplierWithUsage` の件数省略 → R-5 + RTL 一覧。operation_log の名称・件数省略 → R-4。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately?: `Reviewed Content HEAD` は human-confirm 遷移 commit 内でのみ設定し、exact-HEAD evidence は PR body に置く。
- If a hosted URL/headSha is committed after the run, does the merge three-point check fail because PR HEAD changed?: hosted URL / headSha は packet に commit しない。Ready 後の tracked commit を作らない。
- If a state-only commit edits Scope/AC in the same packet file, does hunk-level review reject it even though the filename is allowlisted?: `git diff --unified=0` で hunk を検査し、Workflow State と遷移記録以外の hunk があれば implementing へ戻す。
- If output order changes, which test fails?: `ORDER BY suppliers.name ASC` を DESC / id 順に変える → R-5 の昇順 assert + RTL 一覧の行順 assert。
- If dry-run performs a side effect, which test fails?: 該当なし。
- If a JSON number crosses JavaScript safe integer range, which test fails?: 件数は店舗規模で 2^53 に到達しない（設計正本の規模前提）。到達防御 test は置かない。
- If a state token is round-tripped through browser/client code, which test fails?: 該当なし（URL search state なし）。
- 追加（SPEC-SUPI-D1）: backfill UPDATE を除去 → R-1（既存行 NULL）。TX 内検証を除去し backfill を壊す → R-1 の exact 比較。schema_versions INSERT を TX 外に出す → R-1 再実行 case。
- 追加（SPEC-SUPI-D2）: C21/C22 から `["receivings"]` を落とす / `["stock-movements"]` を足す → RTL oracle 完全一致（欠落・過剰の両方向）。
- 追加（SPEC-SUP-D3）: no-op でも updated_at を更新する mutant → `_same_name_noop` の updated_at exact 比較。
- Final Reviewer は上記のうち最低、① receiving_records UPDATE 除去（R-3）② DELETE 先行（R-3）③ backfill 除去（R-1）④ no-op で updated_at 更新（R-2)⑤ C21 oracle から 1 key 除去（RTL）⑥ 段階 2 件数文言の変数取り違え（RTL）⑦ ORDER BY 反転（R-5）の 7 mutant を clean tree で実注入し、対応 test が落ちることを独立再現する（feedback: Mutation kill claims need reproduction。実測は commit 後の clean tree で行う）。

## Residual Test Gaps

- Windows native の IME 合成中 Enter（追加 dialog / 改名行）は RTL で判別不能なため L3 item 2 / 3 に依存。
- 実 DB（v5 適用済み・実データあり）への migration v6 適用は R-1 の synthetic fixture で代理し、実機は L3 到達（起動 = migrate 実行）で間接確認する。
- 統合の操作性（段階 2 の文言が非 IT operator に伝わるか）は L3 item 4 の目視に依存。
- suppliers.name の UNIQUE collation（大文字小文字 / 全半角の同一視なし = SQLite 既定 BINARY）は既存 `find_or_create_supplier` の挙動を変えない。表記揺れの同一視は統合機能そのものが対処手段であり、自動 test は既定 collation の exact 一致のみを拘束する。
