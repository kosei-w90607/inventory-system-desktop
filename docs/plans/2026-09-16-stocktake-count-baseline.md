# Plan Packet: ㉗ 棚卸しの基準時点を「各商品の最終カウント時点」にする（STK-1 / STK-2、design-first、docs-only、R2）

2026-09-16 起草。出典は [監査 STK-1](../research/2026-09-16-diagram-audit.md#stk-1-カウント後の入出庫を棚卸し確定が打ち消す)（P1 / confirmed）、[STK-2](../research/2026-09-16-diagram-audit.md#stk-2-棚卸し確定後に届く過去販売を二重に減算する)、[DOC-2](../research/2026-09-16-diagram-audit.md#doc-2-残る文書の意味の不一致) の `system_stock` 行、[横断検証 XFA-T1 / XFA-T2](../diagrams/cross-feature-verification.md#xfa-t1-保存した実数が後続の現物移動を打ち消す)。Plans.md「製品の未決判断」の「是正方式が owner 判断待ち」を本 packet の Human Gate で回収する。owner 2026-09-16「次何やるかふたつとって早速始めよう」で Coordinator が wave 12 の lane 2 に選定（lane 1 = ㉖ `docs/plans/2026-09-16-stock-movements-return-selected.md`、file footprint 互いに素）。file:line は origin/main `c6167c4d` で実測（Coordinator 2026-09-16）。本 lane は source docs の設計確定だけを行い、runtime は後続 lane ㉘（R3）に分ける。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Evidence Mode: github
- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1
- Writer: Codex（発注書 61、owner 起動。owner 2026-09-16「Codex に回したほうが質良い」。設計判断は本 packet の D-D1〜D-D6 と owner 回答で確定済みのものを source docs へ書く役。relay 上限到達時のみ Sonnet subagent）
- Plan Reviewer: Sonnet + Opus（独立 fresh context。R2 だが BIZ の在庫補正契約を定める設計のため 2 pass）
- Final Reviewer: Sonnet + Opus（独立 fresh context）
- Final Review Minimum: 2
- Human Gate: ready,merge

owner の設計判断 3 問（下記「owner への設問」Q1〜Q3）。これは Phase `design → plan-draft` の遷移条件（未解決の設計質問なし）であり、tracked の Human Gate 欄には置かない。回答は 2026-09-16 に揃い、反映済み（「owner への設問と回答」節）。manual（L3）は docs-only のため不要。runtime lane ㉘ の L3 で実機確認する。

遷移記録（append-only）:
- kickoff → spec-check → design（`24294ec4`）: Risk R2（docs-only。BIZ-06 / BIZ-03 / UI-10 の設計正本と decision-log を更新し、runtime 契約はこの lane では変えない）。Design Phase = 本 packet で方式を比較し Coordinator 既定案を置く。owner 回答待ちのため plan-draft へは進めない（DEV_WORKFLOW「design → plan-draft: no unresolved design questions」）。
- design → plan-draft → plan-gate（本 commit）: owner 回答（Q1 / Q3 candidate 採用、反例 2 件）と Opus 設計レビュー round 0 を `fd28766d` で反映、Q2 は店の回答「時間帯は関係なし、売れたらその場で訂正」で (b) `<=` に確定（未解決の設計質問なし）。docs-only R2 のため Test Matrix は本 packet の AC1〜AC9。Plan Review は Sonnet + Opus の独立 fresh context。

## Owner Effort Budget

- 介入回数上限: 3（設計判断 1 回 + Ready 1 回 + merge 1 回）
- 実働時間上限: 20分（設問 3 問の読了と回答を含む）
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（function-design 35 / 32 / 42 / 20、db-design tracking、architecture biz-task-specs、UI 73、decision-log、diagrams）。runtime 契約・DB schema・DTO・test は変えない。後続 runtime lane ㉘ の前提となる BIZ 契約を書くため Plan Packet は必要。Test Matrix は rg oracle 中心の軽量版（本 packet の AC）とし、別 file を置かない（Risk Tiers: R2 は optional）。

## Goal

Goal Invariant（owner 2026-09-16 の言い方を正とする）: 棚卸しは「**いつ数えても、年末（確定）時点へ数量を繰り越せる**」ことを中心に設計する。商品別に記録できた入出庫は自動で反映し、記録できない部分（Z004 が届くまでの POS 販売など）だけ店の訂正を受ける。その二つを**重ねて減算しない**契約を source docs に置く。評価額（`total_cost`）は各商品の古い実測数ではなく、繰り越し後の年末時点の数量で合計する。具体的には (a) カウント後の入出庫を確定が打ち消さない（STK-1）、(b) 確定後に届く過去販売の Z004 取込みが在庫を二重に減らさない（STK-2）、(c) `stocktake_items.system_stock` の意味が DB / BIZ / UI の文書で一致する（DOC-2）、(d) `total_cost` が確定時点（年末）の数量で計算される、を実装者が chat や本 packet を読まずに source docs だけで実装・テストできる。日報（Z001/Z002/Z005）は既存の置換方針（D-071、37）を完成させる別系統で、本 lane では触らない。

### 最小完了条件

- (1) decision-log D-090 が「基準時点 = 各商品の最終カウント時点、確定の補正量 = `actual_count − system_stock`（カウント時点差異）」と、その理由・棄却案・再訪条件を持つ
- (2) 35 §20.4 / §20.5 / §20.7 / §20.8 と 20 §2.11 / 42 `update_count` が新しい契約（カウント時の `system_stock` snapshot、確定式、`apply_stock_change` 経由の補正、`current_difference` の意味）で書き換わり、旧「差異は動的計算」の記述が残らない
- (3) 32 §15.4 / §15.5 / §15.8 に Z004 取込みの「カウント時点境界」（STK-2）と、取消時の snapshot 補正（D-D5）が書かれている
- (4) 73 で UI-10-D2 の Rejected「自動織り込み」が D-090 で再訪されたことが分かり、UI-10-D14 が差異列の式・「現在在庫」列の扱い・運用ルール（Q2 の回答）を持つ
- (5) tracking-system-tables.md の `system_stock` 説明が BIZ と一致する（DOC-2 の 1 行目を解消）
- (6) runtime lane ㉘ の Scope（file / test / 生成物）が本 packet の「後続 runtime lane への申し送り」に file:line で記録されている
- (7) `total_cost` の評価数量が「確定時点の在庫（繰り越し後）」で定義され、35 / tracking / 73 / D-090 で一致している（D-D7）

### 失敗定義

runtime code（`src-tauri/**`、`src/**`）の変更、DB migration の追加、`inventory_movements` へ業務日付列を足す設計への拡張（Non-scope）、owner の設問に回答が無いまま既定案を確定扱いして plan-draft へ進むこと、旧記述（35 `:435` / biz-task-specs `:482` の「差異は動的計算」）の残存。

### 非目的

`inventory_movements` に業務日付列を追加する schema 変更（created_at のまま、Z004 は `sale_records.sale_date` で日付を持つ）、棚卸しの中止・確定取消 API（UI-10-D1 / D4 の Rejected を維持）、DATA-2（共有 JAN）、単位の拡張（別 design lane。Z004 の小数数量は本 lane で扱わない）、日報（Z001/Z002/Z005）取込み（在庫を動かさない、D-025）、現場で既に誤差が生じているかの調査。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（origin/main `c6167c4d`、Coordinator 計測 2026-09-16。Sonnet subagent の事実収集を Coordinator が実物で再確認）

- `src-tauri/src/db/schema_v1.rs:179-190` `inventory_movements` = id / product_code / movement_type / quantity / stock_after / reference_type / reference_id / note / is_voided / created_at。業務日付列は無く、`created_at` は `inventory_repo.rs:123-141` `insert_movement` 内の `chrono::Local::now()`（アプリ時計）。後続 schema（v2〜v6）に `inventory_movements` の ALTER は無い
- `schema_v1.rs:208-225` `stocktakes`（started_at / completed_at / status / total_cost）と `stocktake_items`（system_stock NOT NULL / actual_count NULL / valuation_cost_price NULL / counted_at NULL）
- `src-tauri/src/biz/stocktake_service.rs:260-306` `update_count`: step 3 `:286-292` で `update_stocktake_item_count(conn, id, actual_count, &now)`（`system_stock` は書かない）/ step 4 `:295-301` `current_difference = product.stock_quantity - actual_count`（動的）。`:400` `complete_stocktake`: `:441` force_fill は `fill_value = stock_quantity.max(0)` を actual_count に / 明細 loop `:481` `difference = product.stock_quantity - item.actual_count`、`:483` `adjustment_quantity = actual_count - stock_quantity`、`:484` `update_stock_quantity(.., actual_count)`、`:491` `stock_after: actual_count`、`:503` `AdjustedItem.system_stock = product.stock_quantity`（確定時点の live 値、カウント時点ではない）
- `src-tauri/src/db/stocktake_repo.rs:268-279` `update_stocktake_item_count` = `UPDATE stocktake_items SET actual_count = ?1, counted_at = ?2 WHERE id = ?3` / `:406-427` `get_stocktake_items_for_complete` = `SELECT id, product_code, actual_count ... WHERE actual_count IS NOT NULL`（`system_stock` / `counted_at` を返さない）。商品ごとの最新 `counted_at` を引く関数は無い
- `src-tauri/src/biz/csv_import_service/commit.rs:136-147` step 6b: `pos_stock_sync` 行だけ `apply_stock_change(.., -(quantity), SaleAuto, CsvImport, import_id, None)`。CSV の `settlement_date` は `sale_records.sale_date` にのみ保存（`:122-133`）。`:229` `apply_void_stock_corrections`（`rollback.rs:51` から呼ばれ、void した movement を商品ごとに合算して在庫を戻す）
- `src-tauri/src/biz/inventory_service/common.rs:41-90` `apply_stock_change(conn, product_code, quantity, movement_type, reference_type, reference_id, note)` = 商品取得 → `stock_after = stock_quantity + quantity`（INV-2）→ 負在庫 warning → `update_stock_quantity` → `insert_movement`
- `src-tauri/src/biz/daily_report_import_service/commit.rs`（Z001/Z002/Z005）は在庫・movement を触らない（`tests.rs:444-460` が `inventory_movements` 0 件を固定、37 `:11-13`、D-025）。監査の STK-2 が言う「日報取込み」は Z004 商品別 CSV 取込み（BIZ-03）を指す
- `src-tauri/src/biz/integrity_service.rs:58-79` は `stock_quantity` と `SUM(quantity) WHERE is_voided=0` の突合のみ（時点の問題は検出できない）
- 診断 test: `src-tauri/src/biz/csv_import_service/tests/cross_feature_tests.rs:581-582` `diagnostic_cross_feature_req205_count_then_movement`（`XFA_TEMPORAL_FAIL`）/ `:608-609` `diagnostic_cross_feature_req205_req401_late_import`（`XFA_LATE_IMPORT_FAIL`）、いずれも `#[ignore]`。実行 = `cargo test --offline --lib cross_feature_tests -- --ignored --nocapture`（`docs/diagrams/cross-feature-verification.md:133`）
- frontend: `src/features/stocktake/lib/stocktake-formatters.ts:13-16` `computeListDifference = current_stock - actual_count` / `StocktakePage.tsx:842` 「現在在庫」列・`:844` 「差異」列 / `src/lib/bindings.ts:255,258` `StocktakeItemDetail` は `system_stock` と `current_stock` の両方を持つ（DTO 変更なしで式を差し替え可能）
- docs: 35 `:203` 「counted_at = 現在日時」/ `:218-219` 設計判断「差異は `system_stock` ではなく現在の `stock_quantity`」「`system_stock` は『開始時点の参考値』」/ `:283` step 5f / `:315` 「`apply_stock_change` を使わない理由」/ `:425` §20.6a 設計ノート（詳細画面の「差異」は補正 movement の quantity を正とし、`system_stock - actual_count` の snapshot 差は採用しない）/ `:435` §20.7「差異は動的計算で吸収」/ `:450` §20.8 INV-2「stock_after = actual_count を直接使用」/ `:512` 更新履歴。`rg -c '差異は動的計算'` = 1、`rg -c '開始時点の参考値'` = 1、`rg -c 'apply_stock_change を使わない理由'` = 1、`rg -c 'BIZ-06-D'` = 0
- docs: 73 `:41` UI-10-D2 Rejected「BIZ 確定ロジック側で `counted_at` 以降の在庫変動を自動織り込む（現運用では織り込むべき商品単位データ自体が存在しないため実装不能。将来 Z004/PLU 運用が始まったら再検討）」+ `:42` Revisit trigger / `:97` UI-10-D10（差異 = `current_stock - actual_count`、「システム在庫」列を「現在在庫」列へ改称）/ `:125` UI-10-D13（最終 ID）/ `:378` §73.14 の out-of-scope「BIZ-06 確定ロジックの変更（… UI-10-D2）」/ `:408-409` 変更履歴。`rg -c 'UI-10-D14'` = 0、`rg -c '実装不能'` = 1
- docs: `db-design/tracking-system-tables.md:110` 「カウント時点のシステム在庫」/ `:116` 「差異の表示は『現在の products.stock_quantity - actual_count』で動的計算。system_stock は『カウントした時点のシステム在庫』を参考値として記録」（`rg -c '動的計算'` = 1）。`architecture/biz-task-specs.md:465` / `:482`（`rg -c '動的計算'` = 2）。`32-biz-csv-import-service.md` `:285` step 6b（INV-1 符号反転）/ `:336` §15.5 / `:471` §15.8（`rg -c '棚卸し'` = 0）。`42-cmd-sales-stocktake.md:224` `#### update_count`。`20-io-product-repo.md` §2.11（stocktake_repo、`stocktake_repo.rs:267,405` の doc comment が参照）
- Z004 取込みの warning 経路: preview / parse 結果（`csv_import_service/mod.rs:83` `warnings: Vec<String>`、`parse.rs:89,122,212`）にだけあり、commit 結果 `ImportResult`（`mod.rs:173-180`: csv_import_id / status / total_items / total_amount / skipped_count）には無い。`skipped_count` は error 行数（`commit.rs:172`）。`csv_imports.imported_at`（`schema_v1.rs:141`）が取込みの commit 時刻で、1 取込みの movement は同一 TX のため `created_at` が揃う。`VoidedMovement`（`sales_repo.rs:168-171`）は product_code / quantity のみ
- 既存 test で新契約と衝突するもの: `stocktake_service.rs:869-872`（`current_difference` = 3、「system_stock(10) ではなく現在値」）/ `:1218`（`stock_quantity = actual_count`）/ `:1221` `test_complete_req205_force_fill_sets_actual_to_system_stock` / `stocktake-formatters.test.ts`（`current_stock: 10, actual_count: 7 → 3`）。廃番 stock=0 の自動入力（`stocktake_service.rs:345-353`）は開始時に `actual_count = Some(0)` / `system_stock = 0` / `counted_at` NULL
- decision-log の最終 ID = D-089（`:730`）。`rg -c 'D-090' docs/decision-log.md` = 0
- diagrams `cross-feature-verification.md:150` XFA-T1 / `:164` XFA-T2 / `:187` 未検証範囲（棚卸しと CSV 取消の時点関係）。`rg -c '方式は採用していない'` = 1

## 問題の構造（設計の前提）

- 棚卸しは 10 月〜大晦日の長期作業で、カウント後も入出庫が続く（35 §20.5 force_fill の設計判断、SP-205-09）。現行は「差異を動的に計算する」ことで棚卸し中の在庫変動を許容したが、確定時に `stock = actual_count` へ置換するため、カウント後の入出庫が全部打ち消される（STK-1、XFA-T1 は入庫 / 手動販売 / 廃棄 / 返品 / POS 販売の 5 入口すべてで再現）
- 手動の入出庫（入庫・手動販売・廃棄・返品交換）は今日の運用で既に起きる。UI-10-D2 が「自動織り込みは実装不能」とした根拠（商品単位の販売データが無い、D-025）は POS 販売にだけ当てはまり、手動 movement には当てはまらない。したがって STK-1 は Z004 運用開始を待たずに現実の問題
- movement の `created_at` はアプリ時計であり、Z004 の販売日（`sale_records.sale_date`）とは別。Z004 は 1 日分をまとめて翌日以降に取り込むため、「カウントより前に売れたが、カウントより後に取り込まれた」販売が必ず生じる（STK-2）。時刻は分からず日付だけが分かる

## 設計判断（Coordinator adjudication、Plan Review と owner 回答で覆せる）

- **D-D1 基準時点 = 各明細の最終カウント時点（`counted_at`）**: `update_count` は `actual_count` / `counted_at` と同時に `system_stock = そのときの products.stock_quantity` を書く（再カウントは全部上書き）。force_fill の自動補完は `system_stock = actual_count = 現在庫`（差異 0）とし、**`counted_at` は NULL のまま**（実測ではないため基準時点を作らない。owner 反例 (a) / Opus F1。開始時の廃番 stock=0 自動入力〈`counted_at` NULL〉と同じ扱い）。これで DB 定義「カウント時点のシステム在庫」（tracking `:110`）に実装を合わせ、DOC-2 の 1 行目を「DB 定義が正、BIZ / 実装を追従」で解消する。棄却: 新列 `counted_system_stock` を足す（開始時点の値を使う設計が無く、列を増やす理由が無い）
- **D-D2 確定の補正量 = `actual_count − system_stock`（カウント時点差異）、`stock_after = 現在庫 + 補正量`**: カウント後の入出庫は現在庫に含まれたまま残る（STK-1 解消。例: カウント 10 / snapshot 10 → 2 販売で現在庫 8 → 確定: 補正 0、在庫 8）。補正は `apply_stock_change(MovementType::Stocktake, ReferenceType::Stocktake, stocktake_id)` を使う（INV-2 の通常式に戻るため、35 `:317` の「`apply_stock_change` を使わない理由」は撤回。二重 lookup は 4000 件でも確定 1 回限りで問題にしない）。差異 0 の明細は movement を作らない（現行同様）。`AdjustedItem.system_stock` はカウント時点の snapshot、`stock_after` は補正後の現在庫にする。確定後の在庫はカウント後の入出庫分だけ「数えた数」と一致しなくなる（owner の例: 帳簿 10・実測 8、その後入庫 5・販売 2 → 確定 13 + (8 − 10) = 11）。補正後の在庫は負になり得る（例: snapshot 10 / 実測 3 → その後 5 販売 → 3 − 5 = −2）。処理は止めず（INV-3 と同じ方針）、`apply_stock_change` の負在庫 warning は別欄を作らず、結果一覧の既存 `stock_after` 列で負値をそのまま見せる（Opus F6）。`total_cost` の評価数量は D-D7 で確定時点の在庫にする（実測数のままにしない）。棄却: 確定時に `counted_at` 以降の movement を SUM して繰り越す（`inventory_repo` に期間 SUM が無く、snapshot 差分と数学的に同値〈P + (live − S) − live = P − S〉で snapshot の方が小さい）/ カウント後に動いた商品の再カウント必須（4000 件・3 か月の作業で毎日売れる商品が再カウント対象になり運用不能）/ 運用ルールだけで回避（長期棚卸しでは守れない）
- **D-D3 差異表示 = `system_stock − actual_count`（カウント時点差異）**: `update_count` の `current_difference`、一覧の差異列（UI-10-D10、`computeListDifference`）、確定結果の `AdjustedItem.difference` を同じ式にする。「現在在庫」列は情報として残す（カウント後に動いた事実が見える）。動的差異（`current_stock − actual_count`）は D-D2 の下では「これから補正される量」を意味しなくなるため表示しない。棄却: 両方の差異を出す（非 IT operator に 2 種類の差異を説明できない、UI-10-D10 の「数値矛盾を防ぐ」趣旨に反する）
- **D-D4 Z004 取込みの「カウント時点境界」（STK-2）**: BIZ-03 commit step 6b で `pos_stock_sync` 行の在庫減算の前に、その商品の最新 `counted_at`（進行中・完了済みを問わず `stocktake_items` の最新 1 件、未カウント = NULL）を引き、CSV 行の `settlement_date` が「カウント日以前」（`settlement_date <= substr(counted_at, 1, 10)`、同日を含む。Q2 = 店の運用「売れたらその場で訂正」により同日分はカウントに含まれている）なら在庫減算をスキップする。`sale_records` は作る（売上は正）。movement は作らない。境界判定は実測カウント（`counted_at` NOT NULL）だけを基準にし、force_fill / 廃番自動入力の明細（`counted_at` NULL）は基準にしない。判定形: 対象 product_code 群について `stocktake_items` から `MAX(counted_at)` を 1 回の query で map として引き、`settlement_date`（`YYYY-MM-DD`）と `substr(counted_at, 1, 10)` を比較する（Opus F14 / F17）。operator への通知は preview / parse 段階の既存 `warnings`（`mod.rs:83`）に「棚卸しで計上済みのため在庫を変更しない行 N 件」を載せ、commit 結果 `ImportResult` の wire 型は変えない（Opus F3。preview と commit の間にカウントが入れば件数は変わり得るが、在庫を守る規則は commit 時の判定が正）。不変条件（32 §15.8 / 35 §20.8 に置く）: 「カウント前に発生した販売の movement は、カウント後に作られない」。これにより D-D4（日付比較）と D-D5（時刻比較）が整合する（Opus F16）。棄却: 取込みを拒否（売上記録まで失う）/ movement を quantity 0 で残す（整合性チェックと履歴を汚す）/ Z004 運用開始まで境界を設計しない（UI-10-D2 の再訪条件がまさに Z004 運用開始で、設計は今しておく方が実装が 1 回で済む）
- **D-D5 取込み取消（rollback）で、カウントが既に現物で確認済みの分を二重に戻さない**: `rollback_csv_import` が void する movement の商品について、その取込みの `csv_imports.imported_at`（1 取込みの movement は同一 TX で `created_at` が揃うため、この 1 点で比較する。`VoidedMovement` の拡張は不要、Opus F8）より後の実測カウント（`counted_at` NOT NULL）のうち最も早いものを探す。(i) それが進行中の棚卸しなら、その明細の `system_stock` から void した quantity 分を戻す（`system_stock -= movement.quantity`。販売 −2 を void → snapshot +2。例: 開始 10、誤 CSV −2 で 8、カウント 10 / snapshot 8 → 取消で現在庫 10、snapshot 10 → 確定で補正 0 → 10）。(ii) それが完了済みの棚卸しなら、在庫戻しと同額を打ち消す `stocktake` movement（quantity = void した movement の quantity、reference = その棚卸し、note「取込み取消 #id に伴う棚卸し補正の打ち消し」）を同 TX で追加する（owner 反例 (b) / Opus F2: 誤 CSV −2 で 8 → 実測 10 → 確定で +2 → 10 → 取消で +2 → 12 になるのを、打ち消し −2 で 10 に保つ。stock = SUM(movement) も保たれる）。より後のカウントが無ければ現行どおり在庫を戻すだけ。理由: 実測カウントはそれ以前の記録誤りを現物で上書きしており、取消による在庫戻しはその上書きと二重になる。日報取込み（Z001/Z002/Z005）は在庫を動かさないため対象外。手動記録の取消機能は現行に無い（DOC-1）ため対象外、将来追加時に同じ規則を適用する。BIZ-07 `fix_integrity`（movement を作らず在庫を直接書く、D-051 / BIZ-07-D2）は本 lane の対象外とし、35 §20.8 に「棚卸し進行中の fix_integrity は snapshot 前提を外れ得る（mismatch 0 が通常で発火しない）」を 1 行残す（Opus F18）。棄却: 棚卸し中の rollback を禁止（UI-10-D1 の「偽の状態を作らない」に反し、誤取込みの是正手段を 3 か月止める）/ 完了済みを対象外にする（二重戻しが残る）
- **D-D7 評価額は年末（確定）時点の数量で合計する**: `total_cost = Σ max(確定時点の在庫〈補正後の stock_after、= 年末数量〉, 0) × valuation_cost_price`。現行の「`actual_count × valuation_cost_price`」は、10 月に数えた実測数で 12 月末の資産評価を出すことになり、繰り越し（D-D2）が正しくても年末時点の要求（SP-205-08、税理士報告）とは別物になる（owner 2026-09-16）。負在庫の行は評価 0 とし、結果一覧の `stock_after` 列で負値を見せる（D-D2）。明細ごとの確定時点在庫は新しい列に保存しない（`total_cost` は header に保存済み、記録詳細は差異と補正 movement の `stock_after` を既に持つ。明細単位の評価額一覧が要求されたら列を足す = D-090 Revisit）。運用ルール（73 UI-10-D14）: 「確定は年内最後の Z004 を取り込んだ後に行う」（確定後に届く年内販売は在庫には反映されるが `total_cost` には入らない）。棄却: 実測数 × 原価の据え置き（年末時点にならない）/ 明細に `closing_stock` 列を足す（現時点で読む画面が無い）
- **D-D6 決定の置き場**: durable な横断判断は decision-log D-090（D-025 / SP-205-09 / UI-10-D2 を引く）。BIZ 契約は 35（BIZ-06）と 32（BIZ-03）、repo 契約は 20 §2.11 / §2.11a、CMD は 42、DB 意味は tracking、UI は 73 UI-10-D14、記録詳細の差異定義は 65 slice 4c。UI-10-D2 の Rejected 本文は書き換えず、行末に「→ 2026-09-16 D-090 で再訪（UI-10-D14）」を追記する（非遡及）。biz-task-specs.md `:465` / `:482` は要約層として同期

## owner への設問（design → plan-draft の遷移条件）と回答

owner 回答 2026-09-16（原文の要点）: **Q1 = (a) snapshot 方式を推す（candidate）**「棚卸しで直したいのは数えた時点の帳簿と現物のずれ。その差だけ現在庫に加減するのが自然。帳簿 10・実測 8、その後入庫 5・販売 2 なら確定時は 13 + (8 − 10) = 11」/ **Q3 = (a) 含める（candidate）**「実測数に反映済みの販売を後着の Z004 で再び引かないことまで含めて①が成立する。対象は Z004 で、在庫を動かさない日報とは分けてよい」/ **Q2 = 店の運用を確認して決める（precondition-dependent）**「開店前に数えるなら同日 = カウント後、閉店後なら同日 = カウント前。営業中に数えるなら日付だけではどちらも正確にならない。確認すべきは『開店前に数え、その場で保存する運用を守れるか』。数えた翌日に入力する場合も、保存日時をカウント時点にする設計とはずれる。営業中なら誤差承知で既定案、を無言で採用できる前提にしない」。加えて反例 2 件（force_fill の自動補完は実測ではない / 確定後の CSV 取消で二重に戻る）→ D-D1 / D-D5 に反映済み。「商品単位で記録されていない販売まで自動補正できるわけではない」という UI-10-D2 の元の制約は残す（UI-10-D14 / D-090 に明記）。

三つまとめて「既定でよい」とはしない。**Q2 は店の回答 2026-09-16（owner 伝聞）で確定**: 「棚卸しの時間帯は決まっていない（開店前・営業中・閉店後のどれでもある）。カウント済みの商品が売れたら、その場でカウントの数量を訂正する」。

- **Q1 方式**: (a) **owner candidate 採用** = D-D1〜D-D3（カウント時に snapshot、確定はカウント時点差異で補正、差異表示もカウント時点差異）。確定後の在庫はカウント後の入出庫分だけ「数えた数」と一致しなくなり、`total_cost`（実測 × 原価）と確定直後の在庫数も一致しない（Opus F20、UI-10-D14 で operator 向けに説明）。(b) 再カウント必須方式 / (c) 現状維持 + 運用ルール は棄却
- **Q2 同日の POS 販売の扱い（STK-2 の境界）= (b) カウント前扱い（`settlement_date <= カウント日` をスキップ）で確定**: 店は時間帯を決めずに数え、売れたらその場でカウントを訂正する（UI-10-D2 の上書き再入力がそのまま運用）。したがって「その商品の最終カウント」は、その日の販売を訂正時点まで既に含む実測値であり、同日の Z004 行を後から減算すると二重になる（例: カウント 10 → 1 個売れて 9 に訂正〈snapshot は DB の 10〉→ 翌日 Z004 が届く → skip → 確定で 9 − 10 = −1 → 9 = 現物）。(a) カウント後扱い（`<`）は棄却: 訂正済みの販売を再び引く。残る誤差 = 売れたのに訂正し忘れた同日分（在庫が現物より多く出る。次の訂正・次のカウントで消える）。翌日まとめて入力する場合も同じ規則で、訂正の遅れ分だけが誤差になる。運用ルール（73 UI-10-D14）: 「カウント済みの商品が売れたら、その場で数量を訂正する」= 現行の運用を明文化するだけで、新しい手順は足さない。前日分の Z004 を取り込んでからカウントすることは必要条件ではない（Opus F15）

- **Q3 STK-2 の境界（D-D4 / D-D5）を runtime lane ㉘ に含めるか**: (a) **owner candidate 採用** = 含める（境界判定は商品群の `MAX(counted_at)` map を 1 query で引いて日付比較、取消側は取込み時刻 1 点との比較 + 明細 1 UPDATE または打ち消し movement 1 本。Z004 運用開始時に再設計しなくて済む）。(b) 先送り は棄却

## Scope

docs-only。Writer は Codex（発注書 61）。

- **S1 `docs/decision-log.md`**: D-090「棚卸しの基準時点は各商品の最終カウント時点とし、確定はカウント時点差異で年末時点へ繰り越す。評価額は確定時点の数量で合計する（2026-09-16）」。Decision に owner の言い方（いつ数えても年末時点へ繰り越せる / 記録できた入出庫は自動反映、記録できない分だけ店の訂正 / 二つを重ねて減算しない / 評価は年末数量）を置く= Decision / Status accepted / Why（STK-1 / STK-2 / DOC-2、UI-10-D2 の根拠が手動 movement に当てはまらない）/ Impact（BIZ-06 / BIZ-03 / UI-10 / IO stocktake_repo、runtime lane ㉘）/ Alternatives（D-D2 / D-D4 / D-D5 の棄却案）/ Revisit（`inventory_movements` に業務日付を持つ設計へ移る場合、POS が時刻付き明細を出せるようになった場合）。Q2 の回答（同日規則）を Decision 本文に含める
- **S2 `docs/function-design/35-biz-stocktake-service.md`**: §20.4 step 3 に `system_stock = 現在の stock_quantity` の書込みを追加、step 4 を `current_difference = system_stock − actual_count` に、`:218-219` の設計判断を D-D1 / D-D3 へ書き換え / §20.5 step 3a（force_fill）を `system_stock = actual_count = 現在庫` に、step 4 の `StocktakeItemForComplete` に `system_stock` を追加、step 5e の `total_cost += valuation_cost_price × actual_count` を D-D7（`× max(確定時点の在庫, 0)`。補正後の在庫 = `stock_after`、補正なしの明細は現在庫）に、step 5 f/g を D-D2（`adjustment = actual_count − system_stock`、`apply_stock_change` 経由、`AdjustedItem` の意味）に、§20.5 の「total_cost のオーバーフロー対策」の例も評価数量で書き直し、`:317` の「`apply_stock_change` を使わない理由」を撤回し理由を残す / §20.6a `:425` 設計ノートを「詳細画面の差異 = 補正 movement の quantity = `actual_count − system_stock`（D-090 で snapshot 差と一致）」へ / §20.7 `:435` を「棚卸し中も CSV 取込みは許可。実測カウント済み商品はカウント時点境界で在庫減算をスキップ（BIZ-03 §15.4、D-090）」に / §20.8 INV-2 行を「`apply_stock_change` の通常式」に、INV-3 行 `:451`「棚卸し補正で stock_after < 0 にはならない」を「補正後の在庫は負になり得る（D-D2）、評価は 0 で扱う（D-D7）」に（Sonnet round 1 P3）、不変条件「カウント前に発生した販売の movement はカウント後に作られない」と「fix_integrity は対象外」を各 1 行追加、確定後在庫が負になり得る方針（D-D2）を明記 / 更新履歴 1 行。`BIZ-06-D1`〜`D3` の子 ID を D-D1〜D-D3 に対応させて置く
- **S3 `docs/function-design/32-biz-csv-import-service.md`**: §15.3 parse / preview に境界判定の warning（既存 `warnings` に「棚卸しで計上済みのため在庫を変更しない行 N 件」）/ §15.4 step 6b にカウント時点境界（D-D4、Q2 の規則、`ImportResult` は不変）/ §15.5 に取消時の二重戻し防止（D-D5 (i) / (ii)、`imported_at` との比較）/ §15.8 に不変条件 2 行（「実測カウント済み商品の在庫は、カウント日より前の販売を取り込んでも減らない」「カウント前に発生した販売の movement はカウント後に作られない」）/ 更新履歴 1 行。`BIZ-03-D` の子 ID を置く
- **S4 `docs/function-design/73-ui-stocktake.md`**: `:41` UI-10-D2 Rejected 行末に再訪注記（D-D6）/ UI-10-D4 の「`total_cost`（税理士報告値）」に「確定時点の数量 × 評価原価（D-D7）」を添える / UI-10-D14 新設（差異列 = `system_stock − actual_count`、「現在在庫」列は維持、カウント入力欄の選択商品情報も同じ、確定結果の `adjusted_items` の意味と `total_cost` の評価数量、運用ルール 2 つ = 「カウント済みの商品が売れたらその場で数量を訂正する」「確定は年内最後の Z004 を取り込んだ後」、「商品単位で記録されない販売は自動補正できない」制約の維持、Why / Rejected / Revisit）/ `:378` §73.14 の out-of-scope 行を「D-090 で再訪、runtime lane ㉘」に / 変更履歴 1 行
- **S5 `docs/db-design/tracking-system-tables.md`**: `:110` `system_stock` = 「最終カウント時点のシステム在庫（未カウント・廃番自動入力は開始時点の値、force_fill は確定時点の値。いずれも `counted_at` NULL）」/ `:112` `valuation_cost_price` の「total_costはこの値×actual_countの合計」と `:119` total_cost の理由を「× 確定時点の在庫（繰り越し後、負は 0）」に（D-D7）/ `:116` 設計意図を D-D1 / D-D2 / D-D5 に合わせて書き換え
- **S6 `docs/architecture/biz-task-specs.md`**: `:465` / `:482` の「動的計算」を D-D2 / D-D3 の要約に
- **S7 `docs/function-design/42-cmd-sales-stocktake.md`** `:224` `update_count` の `current_difference` の意味 / **`docs/function-design/20-io-product-repo.md`** §2.11 `update_stocktake_item_count`（`system_stock` 引数追加）、`get_stocktake_items_for_complete`（`system_stock` を返す）、新規 `find_latest_counted_at_by_products(conn, &[product_code]) -> HashMap<String, String>`（D-D4 用、`counted_at IS NOT NULL` の `MAX(counted_at)`、比較は `substr(counted_at, 1, 10)` と `YYYY-MM-DD`）、rollback 用 `find_first_count_after(conn, product_code, imported_at) -> Option<(stocktake_id, status, item_id)>` と `adjust_counted_system_stock(tx, item_id, delta)`（D-D5 用）の契約。`24-io-csv-import-repo.md` は `csv_imports.imported_at` を取消側が読むことを 1 行追記（`VoidedMovement` は不変）。**20 §2.11a `:878`** の「`system_stock`: 棚卸し開始時システム在庫の snapshot」を「最終カウント時点（D-090）」に、同節の「差異は補正 movement の quantity で定義し snapshot 差では定義しない」趣旨の文を「両者は D-090 で同値（符号違い）」に書き換え（Sonnet round 1 P2）
- **S8a `docs/function-design/65-inventory-record-traceability.md` `:267`**（slice 4c 棚卸し詳細の差異定義）: 「補正 movement の quantity を正とし、`system_stock - actual_count` の snapshot 差では定義しない」を D-090 参照（同値）に書き換え（Sonnet round 1 P2）
- **S8 `docs/diagrams/cross-feature-verification.md`**: XFA-T1 / XFA-T2 末尾と `:187` に「2026-09-16 D-090 で方式を採用。回帰 test 化は runtime lane ㉘」を 1 行ずつ（診断結果の記録は非遡及で残す）
- **S9（Coordinator、plan-first commit）**: Plans.md / backlog.md の登録、本 packet

## Non-scope

- `src-tauri/**`、`src/**`、`migrations`、`bindings.ts`、`90-traceability.md`（runtime lane ㉘）
- `docs/research/2026-09-16-diagram-audit.md`（監査記録、非遡及）、`docs/function-design/37-biz-daily-report-import-service.md`（日報は在庫を動かさない）、`docs/spec/**`（REQ 追加なし）
- DATA-2、単位の拡張、棚卸しの中止・確定取消 API

## Acceptance Criteria

rg oracle は出力空 = 0 件。baseline は起票時実測（origin/main `c6167c4d`）。

- **AC1** `rg -c '^## D-090' docs/decision-log.md` = 1（baseline 0）/ `rg -c 'UI-10-D2' docs/decision-log.md` ≥ 1
- **AC2** `rg -c '差異は動的計算' docs/function-design/35-biz-stocktake-service.md` = 0（baseline 1）/ `rg -c '開始時点の参考値' 同` = 0（baseline 1）/ `rg -c 'apply_stock_change を使わない理由' 同` = 0（baseline 1。撤回の記録は別の見出し語にする）/ `rg -c 'BIZ-06-D' 同` ≥ 3（baseline 0）/ `rg -c 'D-090' 同` ≥ 1
- **AC2b** `rg -c 'stock_after < 0 にはならない' docs/function-design/35-biz-stocktake-service.md` = 0（baseline 1、`:451`）/ `rg -c '× actual_count|×actual_count' docs/db-design/tracking-system-tables.md` = 0（baseline 2、`:112` `:119`）/ `rg -c '開始時システム在庫' docs/function-design/20-io-product-repo.md` = 0（baseline 1、`:878`）/ `rg -c 'snapshot 差では定義しない|snapshot差では定義しない' docs/function-design/20-io-product-repo.md docs/function-design/65-inventory-record-traceability.md docs/function-design/35-biz-stocktake-service.md` = 各 file 0
- **AC3** `rg -c '棚卸し' docs/function-design/32-biz-csv-import-service.md` ≥ 3（baseline 0: §15.4 / §15.5 / §15.8）/ `rg -c 'D-090' 同` ≥ 1
- **AC4** `rg -c 'UI-10-D14' docs/function-design/73-ui-stocktake.md` ≥ 3（baseline 0: 見出し + §73.14 + 変更履歴）/ `rg -c 'D-090' 同` ≥ 2（baseline 0: UI-10-D2 の再訪注記 + UI-10-D14）/ `rg -c '実装不能' 同` = 1（baseline 1、UI-10-D2 本文は非遡及で残す）
- **AC5** `rg -c '動的計算' docs/db-design/tracking-system-tables.md` = 0（baseline 1）/ `rg -c '動的計算' docs/architecture/biz-task-specs.md` = 0（baseline 2）
- **AC6** `rg -c 'D-090' docs/function-design/42-cmd-sales-stocktake.md docs/function-design/20-io-product-repo.md docs/function-design/24-io-csv-import-repo.md docs/diagrams/cross-feature-verification.md` の各 file ≥ 1（baseline 0）
- **AC7**（負の oracle）`git diff --name-only origin/main..HEAD -- src-tauri src migrations docs/research docs/spec docs/function-design/37-biz-daily-report-import-service.md docs/function-design/90-traceability.md | wc -l` = 0
- **AC8** `bash scripts/doc-consistency-check.sh --target plan` ERROR 0 / `bash scripts/check-workflow-git.sh` PASS / `bash scripts/doc-consistency-check.sh`（full、docs 変更のため）ERROR 0。35 / 32 の必須セクション（関数要求 / シグネチャ / 処理ステップ / エラー）は `doc-consistency-check.sh` full の `check_template_conformance` が要求する（`--target plan` では走らない）ため full を回す。`cargo test --offline --test design_compliance_test` は doc と `pub fn` の関数名突合で、新規関数名を 20 §2.11 に書く場合に PASS を確認する（Opus F4）
- **AC9** 一貫性: packet の D-D1〜D-D5 の数値例（10 / 8 / 12 の例）が 35 / 32 の本文に例として写され、Q2 の回答（`<` か `<=`）が D-090 / 32 §15.4 / 73 UI-10-D14 の 3 箇所で同じ記号で書かれている（`rg -c 'settlement_date <=' <3 file>` と `rg -c 'settlement_date <[^=]' <3 file>` の 2 本で、`<=` が各 file ≥ 1、`<[^=]` が 0）

## Design Sources

- Requirements / spec: REQ-205（棚卸しによる在庫数の補正）、REQ-401（Z004 商品別売上取込み）、SP-205-09（棚卸し中の CSV 取込み許可）
- Architecture: `docs/architecture/biz-task-specs.md` BIZ-06（`:434-486`）、D-025（日報と Z004 の分離）
- Function / command / DTO: 35 §20.2 / §20.4 / §20.5 / §20.7 / §20.8、32 §15.4 / §15.5 / §15.8、31 INV-2（`apply_stock_change`）、42 `update_count`、20 §2.11
- DB: `docs/db-design/tracking-system-tables.md` §16-17（stocktakes / stocktake_items）、`inventory_movements`（`:9-25`）
- Screen / UI: 73 UI-10-D2 / UI-10-D4 / UI-10-D10、§73.7 確定フロー
- Decision log / ADR: D-025、D-051（integrity の operation_log）、新設 D-090

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 35 §20.4 / §20.5 / §20.7 / §20.8、32 §15.4 / §15.5 / §15.8、20 §2.11、42 `update_count` | updated in this PR（S2 / S3 / S7） |
| Command / DTO / generated binding / wire shape | `UpdateCountResult.current_difference` の意味（型不変）、`AdjustedItem` の意味（型不変）、`StocktakeItemForComplete` は BIZ 内部型 | updated in this PR（S2 / S7、wire 型は不変） |
| DB / transaction / audit / rollback / migration | tracking §16-17（`system_stock` の意味、schema 不変）、32 §15.5（rollback の snapshot 補正） | updated in this PR（S5 / S3） |
| Screen / UI / route state / Japanese wording | 73 UI-10-D14（差異列の式、運用ルール） | updated in this PR（S4） |
| CSV / TSV / report / import / export format | 32 §15.4（取込み結果 warning の 1 種類追加、CSV format は不変） | updated in this PR（S3） |
| Durable decision / ADR | decision-log D-090 | updated in this PR（S1） |

## Registration / Generation Obligations

該当なし（本 lane は docs-only。function-design の新設なし、REQ 追加なし）。runtime lane ㉘ では `90-traceability.md` の再生成（REQ-205 / REQ-401 の test 追加）が該当するため申し送りに記す。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-205 / SP-205-09 | 35 §20.4、tracking §16-17 | BIZ-06-D1（D-D1）、D-090 | カウント時点の snapshot で基準時点を固定。棄却: 新列 | ㉘ `update_count` / repo | ㉘ unit（snapshot 値） |
| REQ-205 | 35 §20.5 / §20.8 | BIZ-06-D2（D-D2）、D-090 | カウント時点差異で補正、`apply_stock_change` 経由。棄却: SUM 繰り越し / 再カウント必須 / 運用のみ | ㉘ `complete_stocktake` | ㉘ XFA-T1 の 5 入口を回帰化（期待 = 現物） |
| REQ-205 | 73 UI-10-D14、42 `update_count` | UI-10-D14（D-D3） | 差異表示を 1 種類に。棄却: 2 種類併記 | ㉘ `computeListDifference` / `current_difference` | ㉘ unit |
| REQ-401 / REQ-205 | 32 §15.4 / §15.8 | BIZ-03-D（D-D4）、D-090 | カウント日より前の販売は在庫を減らさない。棄却: 拒否 / 0 movement / 先送り | ㉘ commit 6b + repo | ㉘ XFA-T2 の回帰化（期待 = 8） |
| REQ-401 / REQ-205 | 32 §15.5、tracking | BIZ-03-D（D-D5）、D-090 | 取消で snapshot を戻す。棄却: 棚卸し中 rollback 禁止 | ㉘ rollback + repo | ㉘ unit（誤 CSV → カウント → 取消 → 確定 = 現物） |
| — | 73 UI-10-D2 | D-D6 | Rejected を非遡及で残し再訪注記 | S4 | AC4 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（D-090 + 35 / 32 / 73 の決定 ID に理由・棄却案・数値例を置く）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: D-D1〜D-D5 → D-090 と各 source doc（S1〜S7）
- Assumptions and constraints: Z004 は日付粒度（時刻なし）。`counted_at` はアプリ時計、`settlement_date` は POS の営業日で、時計のずれは日単位比較で吸収する。Z004 運用は未開始（D-025）だが手動 movement で STK-1 は今日起きる。snapshot 方式は「カウント後の入出庫は現在庫に正しく反映されている」ことを前提にし、その反映自体の誤りは本 lane の対象外
- Deferred design gaps, risk, and follow-up target: 同日販売の誤差（Q2 で規則を決めても営業中カウントでは残る。運用ルールで縮める）/ 手動記録の取消機能が将来できたら D-D5 を適用 / `inventory_movements` の業務日付列は Revisit 条件に置く
- Test Design Matrix can cite design decision IDs or source doc sections: runtime lane ㉘ の Matrix が D-090 / BIZ-06-D1〜D3 / BIZ-03-D / UI-10-D14 を引ける
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「カウント後の入出庫を打ち消さない」の例外 = 取消（rollback、D-D5 (i)/(ii) で補正）と force_fill / 廃番自動入力（snapshot = 現在庫で差異 0、`counted_at` NULL で境界にならない）と BIZ-07 fix_integrity（対象外、1 行で明記）。「過去販売を二重に減らさない」の例外 = 同日販売（Q2 の規則、店の運用）と未カウント・force_fill 商品（境界なし、通常減算）。部門売り（非 PLU）の販売は商品単位で記録されないため、繰り越し対象は記録された movement だけで、現物との差はカウントで吸収する（UI-10-D2 の元の制約は残す、owner 2026-09-16）。整合性チェック（BIZ-07）は `stock_quantity = SUM(movement)` を維持する（補正は movement 経由、スキップは movement を作らない）

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | Z004 parser（IO-04）は不変。境界判定は BIZ-03 commit に置き、CSV の shape に依存しない | 32 §15.4 |
| Fact check / design decision split | 事実 = 起票時実測（`created_at` はアプリ時計、`system_stock` は開始時点、`for_complete` は snapshot を返さない、日報は在庫を動かさない）。判断 = D-D1〜D-D6、owner Q1〜Q3 | 本 packet |
| Lifecycle / retry | カウント → 再カウント（上書き）→ 取込み → 取消 → force_fill → 確定、の各段で snapshot がどう変わるかを 35 / 32 の数値例に置く | S2 / S3 |
| Operator workflow | 開店前カウント + 前日分取込み（Q2 の運用ルール）。確定前に全件再カウントは要求しない | 73 UI-10-D14 |
| Replacement path | POS が時刻付き明細を出せるようになれば `created_at` ではなく販売時刻で境界判定に移れる（D-090 Revisit） | S1 |
| Data safety / evidence | docs-only。数値例は合成値 | — |
| Reporting / accounting semantics | 売上（`sale_records`）と在庫（movement）を分けたまま、スキップ行は売上だけ記録する。`total_cost` は `actual_count × 原価` のまま（カウント時点評価） | 32 §15.4 / 35 §20.5 |
| Manual verification | docs-only のため L3 なし。runtime lane ㉘ で「カウント → 販売 → 確定」の実機往復 | ㉘ |
| 環境・再現性 | not applicable | — |

## Design Readiness

- Existing design docs are sufficient because: 不十分。35 / 73 / tracking / biz-task-specs が「差異は動的計算」「確定は actual_count へ置換」を契約として固定しており、STK-1 / STK-2 を解消する設計が無い。本 lane がその設計出力
- Source docs updated in this PR: S1〜S8
- Design gaps intentionally deferred: 同日販売の時刻精度（POS の制約）、手動記録の取消機能
- Durable decisions discovered in this plan and promoted to source docs: D-090、BIZ-06-D1〜D3、BIZ-03-D、UI-10-D14

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 境界判定と補正式は BIZ（stocktake_service / csv_import_service）、snapshot 書込みと最新 `counted_at` 取得は IO（stocktake_repo）、UI は式の差し替えのみ、CMD は不変
- Backend function design: `update_count` / `complete_stocktake` / `commit_csv_import` / `rollback_csv_import` の処理ステップを S2 / S3 で改稿
- Command / DTO / data contract: wire 型は不変（`current_difference` / `AdjustedItem` の意味だけ変わる）。bindings 再生成なし
- Persistence / transaction / audit impact: schema 不変。`update_count` は autocommit のまま 1 UPDATE に列を 1 つ足す。rollback の snapshot 補正は同 TX 内。operation_log は不変
- Operator workflow / Japanese UI wording: 差異列の意味が「カウント時点差異」になる（label は「差異」のまま）。取込み結果 warning 文言は S3 で定める
- Error, empty, retry, and recovery behavior: 未カウント商品は境界なし。再カウントで snapshot も更新。取消は D-D5
- Testability and traceability IDs: REQ-205 / REQ-401 / SP-205-09、BIZ-06-D1〜D3 / BIZ-03-D / UI-10-D14 / D-090

## Contract Probe

N/A: 外部前提なし（docs-only。数値例は snapshot 差分の恒等式 `P + (live − S) − live = P − S` で検算済み。XFA-T1 / T2 の合成 DB 再現は監査で実施済み）。

## Contract Coverage Ledger

R2 のため任意。runtime lane ㉘ の Ledger の種として、契約 ID と行を置く。

| Design contract / decision ID | Implementation target（㉘） | Automated test（㉘） | L3 or non-scope |
|---|---|---|---|
| BIZ-06-D1（カウント時 snapshot、再カウント上書き、force_fill） | `update_count` / `complete_stocktake` step 3a / repo | unit: snapshot 値、再カウント後の値 | — |
| BIZ-06-D2（確定 = カウント時点差異、`apply_stock_change`） | `complete_stocktake` step 5 | XFA-T1 5 入口の回帰（期待 = 現物）、差異 0 で movement なし | ㉘ L3 |
| UI-10-D14（差異表示） | `current_difference` / `computeListDifference` | unit | ㉘ L3 |
| BIZ-03-D（境界、Q2 の記号） | commit 6b + repo | XFA-T2 回帰、同日境界の両側 1 本ずつ、未カウント商品は通常減算 | — |
| BIZ-03-D（rollback snapshot 補正） | rollback + repo | 誤 CSV → カウント → 取消 → 確定 = 現物 | — |
| INV（integrity: stock = SUM(movement)） | 不変 | 既存 `integrity_service` test + 上記各 test で `run_integrity_check` 0 件 | — |

## Test Plan

R2 docs-only。本 packet の AC1〜AC9（rg oracle + doc check + design_compliance_test）。runtime の test は ㉘ の Matrix で設計する。

- targeted tests: AC8 の doc check / design_compliance_test
- negative tests: AC7（runtime 非接触）、AC4 の「実装不能」= 1（非遡及）
- compatibility checks: 35 / 32 の必須セクション見出しを維持（AC8）
- data safety checks: 合成値のみ
- main wiring/integration checks: not applicable

## Boundary / Wire Contract

not applicable（docs-only。runtime lane ㉘ で `UpdateCountResult.current_difference` の意味変更を wire 契約として記入する。型は不変）。

## Review Focus

- D-D2 の恒等式と数値例が正しいか（開始 10 → カウント 10 → 販売 2 → 確定で 8 / 誤 CSV −2 → カウント 10 → 取消 → 確定で 10 / POS 2 販売未取込み → カウント 8 → 確定 8 → 遅い取込みでスキップ → 8 / owner の例: 帳簿 10・実測 8・入庫 5・販売 2 → 11 / 反例 (a): 未カウント 10 を force_fill → 後着の販売 2 で 8 になるか〈`counted_at` NULL で境界にならない〉/ 反例 (b): 誤 CSV → 実測 10 → 確定 → 取消 → 10 のまま〈打ち消し movement〉）。D-D5 の補正方向（(i) `system_stock -= voided.quantity`、販売 −2 の void で +2 / (ii) 打ち消し movement の quantity = void した quantity）。Q2 の記号が 3 箇所で揃うか。UI-10-D2 の再訪を非遡及で書けているか。35 の必須セクション構造。runtime lane ㉘ への申し送りが file:line で足りるか

## 後続 runtime lane ㉘ への申し送り（本 lane の成果物の一部、file:line は `c6167c4d`）

- `src-tauri/src/db/stocktake_repo.rs:268-279` `update_stocktake_item_count` に `system_stock` 引数（force_fill 用は `counted_at` を書かない別引数か別関数）/ `:406-427` `get_stocktake_items_for_complete` に `system_stock` 列 / 新規 `find_latest_counted_at_by_products` / `find_first_count_after` / `adjust_counted_system_stock`。IO 設計 20 §2.11 に契約（本 lane S7）。`stocktake_service.rs:441-447` の force_fill は `counted_at` を書かない経路へ
- `src-tauri/src/biz/stocktake_service.rs:286-301` `update_count` step 3 / 4、`:441` force_fill、`:481-506` 確定 loop を `apply_stock_change` へ（`inventory_service/common.rs:41`、`pub(crate)`）
- `src-tauri/src/biz/csv_import_service/commit.rs:136-147` step 6b に境界、`:229` `apply_void_stock_corrections` + `rollback.rs:51` に snapshot 補正
- `src/features/stocktake/lib/stocktake-formatters.ts:13-16` `computeListDifference` を `system_stock - actual_count` に（`bindings.ts:255,258` の両 field は既存）、`StocktakePage.tsx:842-844` の列は維持、対応 test
- test: `cross_feature_tests.rs:581-618` の 2 診断を `#[ignore]` 解除して期待値を現物に反転（XFA-T1 5 入口 + XFA-T2）、`stocktake_service.rs` の unit（snapshot / 再カウント / force_fill / 差異 0）、`csv_import_service` の unit（境界両側 / 未カウント / rollback 補正）。REQ-205 / REQ-401 の test 追加で `cargo run --bin generate_traceability` を実行し `90-traceability.md` を再生成（生成 file の再生成は ㉘ だけ）
- docs 同期: 35 / 32 の疑似コードを実装に合わせて最終化、`cross-feature-verification.md` の期待値、32 §15.3 の preview warning 文言（取込み結果の wire は不変）
- 既存 test の反転（新規追加ではない）: `stocktake_service.rs:869-872`（`current_difference` 3 → −2 相当、snapshot 基準へ）/ `:1218`（`stock_quantity = actual_count` → `現在庫 + 補正`）/ `:1221` `test_complete_req205_force_fill_sets_actual_to_system_stock`（`counted_at` NULL のまま）/ `stocktake-formatters.test.ts`（`system_stock − actual_count`）
- rollback: `rollback.rs:51` の前後で `csv_imports.imported_at` を読み、商品ごとに「それより後の最初の実測カウント」を引く。進行中なら snapshot 補正、完了済みなら打ち消し `stocktake` movement を同 TX で 1 本
- Risk R3（BIZ 在庫補正 + POS CSV 取込み + operator workflow）、Final Review 2 pass、owner L3 = カウント → 手動販売 → 確定 → 在庫が販売後の値のまま、の 1 往復

## Spec Contract

R2 のため簡略。Contract ID: SPEC-STK-BASELINE-R1

- 棚卸しの基準時点は各商品の最終カウント時点で、`system_stock` はその時点の在庫を保持する（evidence: AC2 / AC5）
- 確定の補正量は `actual_count − system_stock`、`stock_after` は現在庫 + 補正量（evidence: AC2）
- カウント済み商品について、カウント日より前（Q2 の規則）の Z004 販売は在庫を減らさず売上だけ記録する（evidence: AC3）
- 取込み取消で void した movement がカウント時点より前なら `system_stock` を戻す（evidence: AC3 / AC5）
- 差異表示はカウント時点差異 1 種類（evidence: AC4）

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-STK-BASELINE-R1（snapshot） | S2 / S5 / S7 | AC2 / AC5 / AC6 | D-D1 | rg oracle |
| SPEC-STK-BASELINE-R1（補正式） | S2 / S6 | AC2 / AC5 | 恒等式・数値例 | rg oracle |
| SPEC-STK-BASELINE-R1（境界） | S3 / S1 / S4 | AC3 / AC9 | Q2 の記号 | rg oracle |
| SPEC-STK-BASELINE-R1（取消補正） | S3 / S5 | AC3 | 補正方向 | rg oracle |
| SPEC-STK-BASELINE-R1（差異表示） | S4 / S7 | AC4 / AC6 | 非遡及 | rg oracle |

## Data Safety

- 実店舗データ・実商品名・実 JAN を packet / docs / PR に含めない（数値例は合成値）
- local-only / synthetic-only path の追加なし

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### owner 回答（2026-09-16、design）

- Q1 = (a) candidate 採用 / Q3 = (a) candidate 採用 / Q2 = precondition-dependent（店の聞き取り待ち）。反例 2 件（force_fill は実測でない / 確定後の CSV 取消で二重に戻る）→ D-D1 / D-D5 を改訂。UI-10-D2 の「商品単位で記録されていない販売は自動補正できない」制約は残す。Writer は Codex（owner「Codex に回したほうが質良い」）

### Design Review round 0（2026-09-16、design、Opus、裁定 Coordinator。Plan Review round には数えない）

- P1 F1（force_fill が `counted_at` を書き D-D4 の境界になる → 後着販売を skip して過大）= accept → D-D1（`counted_at` NULL）、F13 の廃番自動入力も同じ扱い
- P2 F2（完了済み棚卸し後の取消で void 分が二重に戻る）= accept → D-D5 (ii) 打ち消し movement / F3（commit 結果に warning 欄が無い）= accept → preview 段階の既存 `warnings` に載せ wire 不変、S3 に §15.3 / F4（AC8 の帰属）= accept → `check_template_conformance`（full）へ / F5（73 §73.9 の参照誤り）= accept → 32 §15.3 へ / F6（確定後の負在庫）= accept → D-D2 に方針を明記、`stock_after` 既存列で表示 / F7（既存 green test の反転漏れ）= accept → 申し送りに 4 件 / F8（`VoidedMovement` に `created_at` が無い）= accept → `csv_imports.imported_at` 1 点で比較 / F9（Plans.md の「Human Gate に置く」表記）= accept → 本 commit で Plans.md を是正
- Q2 確定（2026-09-16、店の回答 owner 伝聞「時間帯関係なし、カウント済みでも売れたらそこで数量訂正」）= (b) `<=`。Coordinator の一時案「(a) 誤差が目に見える向き」は、訂正運用の下では訂正済み販売を二重に引くため撤回
- P3 F10（行番号 2 件）/ F11（AC9 の regex）/ F12（AC7 の pathspec）/ F14（Q3 の「1 query」表現）/ F15（Q2 の「前日分取込み」前提を外す）/ F16（日付 / 時刻の橋渡し不変条件）/ F17（SQL の比較形）/ F18（fix_integrity 対象外 1 行）/ F19（backlog の「日報取込み」表記）/ F20（Q1 に「確定後の在庫は数えた数と一致しない」）/ F21（35 §20.6a の設計ノート）= すべて accept、本 commit で反映
- 反例なし（F0）: 恒等式と数値例 3 本、順列 7 系列。壊れたのは F1 のみ
- 判定: owner 回答と本 review を反映した改訂版で、Q2 の聞き取り後に plan-draft → plan-gate（Sonnet + Opus の Plan Review）へ

### owner 追加指示（2026-09-16、plan-gate 中）

- 「日報は既存の置換方針を完成させる。棚卸しは『いつ数えても年末時点へ数量を繰り越せる』ことを中心に設計する。商品別に記録できた入出庫は自動反映し、記録できない部分だけ店の訂正を受ける。その二つを重ねて減算しない契約を作る。在庫の snapshot 補正が正しくても、評価額を各商品の古い実測数のまま合計すると年末時点の要求とは別物になる」→ Goal Invariant を言い直し、D-D7（評価数量 = 確定時点在庫）を新設、`total_cost` 据え置きの記述を撤回。日報は Non-scope に明記

### Plan Review round 1（2026-09-16、plan-gate、Sonnet、裁定 Coordinator）

- reviewer 実施: 起票時実測の file:line / `rg -c` を全数実物と突合し一致、AC7 の diff 3 file を確認、doc check（plan / full）ERROR 0 と check-workflow-git PASS を実行、D-D1〜D-D5 の算術と Q2 `<=` の反例を独立再現、INV-3 が一般方針であることを `10-common-rules.md:24` で確認
- P2（20 §2.11a `:878` と 65 `:267` が「差異は補正 movement の quantity、snapshot 差では定義しない」「開始時システム在庫」の旧契約のままで Scope 外、AC も検出しない）= accept → S7 / S8a に追加、AC2b を新設
- P3（35 §20.8 INV-3 行 `:451`「stock_after < 0 にはならない」が D-D2 と矛盾するのに S2 が名指ししていない）= accept → S2 に明記、AC2b に oracle
- 判定: round 1 は通過不可（P2 1）。本 commit で是正し、Opus round 1 と Sonnet closure で確認する
