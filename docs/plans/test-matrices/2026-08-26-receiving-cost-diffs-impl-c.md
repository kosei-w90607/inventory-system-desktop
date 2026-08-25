# Test Design Matrix — 実装 PR C: 入庫時原価差分検出 cost_diffs

対応 packet: [../2026-08-26-receiving-cost-diffs-impl-c.md](../2026-08-26-receiving-cost-diffs-impl-c.md)

test 名 4 本（T1〜T4）は archived Matrix [2026-08-22-price-revision-design.md](../../archive/plans/test-matrices/2026-08-22-price-revision-design.md)「実装 PR への予約 → 実装 C」の予約を継承する。oracle の期待値はすべて本 Matrix に独立転記し、production 定数から導出しない（D-052 の oracle 独立性と同じ規律）。mock / fixture 値は設計既定値と区別できる distinguishable 値を使う。

## Rust（`src-tauri/src/biz/inventory_service/receiving.rs`、REQ-209 / SPEC-PRV-D8）

| ID | Test 名 | 入力 / 状態 | Oracle（独立転記） | Would fail if |
|---|---|---|---|---|
| T1 | `test_create_receiving_req209_detects_cost_diff` | 商品 A（マスタ原価 500）へ実原価 501、商品 B（マスタ原価 500）へ実原価 499 の 2 明細で入庫保存 | `cost_diffs` が 2 行。A 行 = `{ product_code: A, product_name: A の登録名, master_cost_price: 500, received_cost_price: 501 }`、B 行 = 同型で 499。`created=true` / 保存 record 実在 / 在庫 +quantity 反映 | 検出 skip（常時空）/ 比較が片方向（+1 のみ or −1 のみ検出）/ master と received の field 取違え / product_name 未設定 |
| T2 | `test_create_receiving_req209_no_diff_when_cost_matches` | 商品 A（マスタ原価 500）へ実原価 500 で入庫保存 | `cost_diffs` が空配列。`created=true` | 常時 diff 生成 mutant（比較の許容幅 mutant は diff=0 入力の本行では検出不能のため T1 / M3 が担当） |
| T3 | `test_create_receiving_req209_empty_on_idempotent_replay` | T1 と同条件で保存後、同一 `idempotency_key` + 同一内容を再送（マスタ原価との不一致は残存したまま） | 再送応答 = `created=false` / `idempotent_replay=true` / `cost_diffs` 空配列 | replay 経路で検出が実行される / replay 応答の invariant 崩れ |
| T4 | `test_create_receiving_req209_cost_diff_detection_does_not_affect_save_tx` | 差分あり（マスタ 500 / 実原価 501）の入庫保存 | `cost_diffs` 非空でも保存成果物が完全: receiving record 実在 + receiving_item 実在 + 在庫反映 + operation_log `receiving_create` 実在。応答 `created=true` | 検出が保存 TX 内に入り検出結果で rollback / 検出起因で保存が失敗する |

- T3 は空集合期待だが、非空期待の T1 が同一検出経路を握るため empty-set oracle collision（bind 交差 mutant の素通し）は成立しない。T2 も同様に T1 と対 oracle を成す。
- T4 の「検出読取り失敗を注入して保存が生き残る」形は同一 conn 上で失敗注入手段がなく非現実的のため、保存成果物の完全性検証 + 検出失敗時 warn log 実装の review 確認（Ledger 行参照）で防御する。

## RTL（`src/features/receiving/ReceivingPage.test.tsx`、REQ-209 / UI-02-D15）

mock 値の独立転記: マスタ原価 500 / 実原価 501 / 現売価 1200（`getProduct` mock）/ 商品コード `P-901` / 商品名 `テスト毛糸`。

| ID | Test 内容 | 入力 / 状態 | Oracle（独立転記） | Would fail if |
|---|---|---|---|---|
| T5 | 保存成功 + `cost_diffs` 非空でダイアログ表示 | `createReceiving` mock が `cost_diffs: [{ product_code: "P-901", product_name: "テスト毛糸", master_cost_price: 500, received_cost_price: 501 }]` を返す | ダイアログが開き、`テスト毛糸` / `P-901` / マスタ原価 500 / 実原価 501 が日本語ラベル付きで表示される | 表示条件の破壊 / field 取違え表示 / ラベル欠落 |
| T6 | 空・replay で非表示 | (a) `cost_diffs: []` で保存成功 (b) `created=false, idempotent_replay=true, cost_diffs: []` | いずれもダイアログ非表示。(b) は既存の replay 表示（「同じ内容の再送として処理済み」）が維持される | 常時表示 mutant（`length > 0` → `true`）/ replay 表示の退行 |
| T7 | 行更新の call args exact | T5 状態で「マスタ原価をこの実原価に更新する」を click。`getProduct` mock が `selling_price: 1200` を返す | `reviseProductPrice` が `{ product_code: "P-901", new_selling_price: 1200, new_cost_price: 501, assign_supplier_id: null }` で 1 回呼ばれ、成功後に該当行が成功表示になる | master/received swap（new_cost_price: 500）/ 据え置き破り（new_selling_price: 501 等）/ assign_supplier_id 非 null |
| T8 | 行単位失敗 + 再試行 + 保存成功表示維持 | T5 状態で `reviseProductPrice` mock を reject（または `getProduct` reject） | 該当行のみ失敗表示 + 再試行操作が可能。入庫保存の成功表示（result panel）は維持される | 失敗が全行 / 画面全体へ伝搬 / result panel が消える |
| T9 | 見送り無記録 | T5 状態でダイアログを閉じる | `reviseProductPrice` 未呼出し（0 回）。追加の記録系 command 呼出しなし。result panel 維持 | 見送りで何らかの command が発火する |

- T7 の args oracle は本 Matrix の転記値と完全一致比較（`toHaveBeenCalledWith` の全 field 指定）。部分一致にしない。
- hook 非経由の直接 `invalidateQueries` 置換 mutant は T7 の oracle（call args + 行表示）では検出されない。この mutant の防御は AC-7（D-052 静的回帰 test = success-path 直接 `invalidateQueries` 拒否）に一本化する（Plan Review round 1 P2-1）。
- 既存 test 凍結: `ReceivingPage.test.tsx` / `ReceivingPage.suggest.test.tsx` / `ReceivingPage.unsaved-guard.test.tsx` の既存 test は改変禁止。唯一の例外 = `createReceiving` mock result literal への `cost_diffs: []` field 追加（SPEC-PRVC-D4 の class 全数 3 file、rg 実測 2026-08-26）。

## Mutation 予約（Final Review で独立再実測）

| ID | 注入 mutant | Red になるべき test |
|---|---|---|
| M1 | step 10 の検出を skip し常時 `cost_diffs: vec![]` | T1 |
| M2 | 比較を片方向化（`received > master` のみ差分） | T1（B 行 = 499 側が欠落） |
| M3 | 完全一致を ±1 円許容（`abs(diff) > 1` のみ差分） | T1（501/499 が差分扱いされない） |
| M4 | replay 分岐（step 1）でも検出を実行して非空を返す | T3 |
| M5 | ダイアログ表示条件を常時 true 化 | T6 |
| M6 | T7 の args で master_cost_price を送る（swap） | T7 |
| M7 | new_selling_price に received_cost_price を送る（据え置き破り） | T7 |

- M1〜M4 は Rust 実装への実注入、M5〜M7 は frontend 実装への実注入で red を確認し、revert 後全緑を確認する（構造的推論のみは不可 — Contract Audit の mutation adequacy）。
- 検証は commit 後の clean tree 上で行う（mutation test on clean tree only）。

## 実行 gate

- 実装反復: `bash scripts/local-ci.sh changed`
- Rust targeted: `cd src-tauri && cargo test req209`
- RTL targeted: `npm test -- ReceivingPage`
- 生成系: `cargo run --bin generate_bindings`（AC-2 diff 確認）+ `cargo run --bin generate_traceability -- --check`（AC-3）
- merge 前: `bash scripts/local-ci.sh full`（L1、exact HEAD）
