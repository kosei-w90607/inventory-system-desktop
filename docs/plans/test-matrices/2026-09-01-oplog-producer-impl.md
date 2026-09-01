# Test Design Matrix: 操作ログ producer 実効化（record_type / record_id 4 producer 書込み）

Plan Packet: [../2026-09-01-oplog-producer-impl.md](../2026-09-01-oplog-producer-impl.md)

## Risk

Risk: R3

## Contracts Under Test

- UI-11c-D7（74 §74.9）: 「関連記録を見る」は detail_json に許可リスト内 `record_type` と positive safe integer `record_id` が両方揃う場合だけ表示。producer は当該操作の正値を書く。
- D-1: record_type は §74.9 許可リスト literal と完全一致（`receiving_record` / `return_record` / `disposal_record` / `manual_sale`）、record_id は各詳細 route が query する PK と同値。
- D-2: manual_sale の新規ログ detail key は `record_id` へ一本化（`sale_id` key を書かない）。
- 隣接（冪等）: 冪等再送の早期 return はログを書かない（既存挙動不変）。
- 隣接（rollback）: 業務記録 insert と操作ログは同一 tx — 失敗時は両方消える（既存挙動不変）。
- 隣接（消費側 fail-closed）: `record_type` なしの過去ログ・欠落 field では link を出さない（既存 frontend test 無変更 green）。
- 隣接（DTO）: `ManualSaleCreateResult.sale_id` / bindings は非接触。

## Failure Modes

- 4 site のうち一部だけ `record_type` を追加し、残りが漏れる（combined test では 1 site 漏れを検出できない）。
- 許可リスト内だが当該操作の正値でない `record_type` を書く（guard は通るが遷移先が誤る — 例: returns に `manual_sale`）。
- manual_sale の `record_id` に `manual_sales.id` 以外の値を書き、詳細 route の query と不整合になる。
- manual_sale で `sale_id` key が残り、一本化（D-2）が成立しない。
- key 追加のついでに既存 key（item_count / return_type 等）や summary / operation_type を壊す。
- 冪等再送・失敗 rollback の経路でログ書込み挙動が変わる。
- doc 是正の sweep 漏れで live docs に「producer 0 件 / 3 producer」の旧前提が残る。

## Test Matrix

| ID | 対象 | 種別 | 検証内容 / oracle | Cite |
|---|---|---|---|---|
| T1 | receiving 操作ログ契約 | 新規 or 既存拡張 | 入庫作成成功 → 最新 operation_logs row の detail_json を JSON parse → `record_type == "receiving_record"`（literal は §74.9 表から test へ独立転記）+ `record_id` == 当該 test で作成された入庫記録の実 PK（作成結果から取得して突合、固定値 assert にしない）+ 既存 key（item_count / warning_count / idempotency_key）残存 | UI-11c-D7 / D-1 |
| T2 | returns 操作ログ契約 | 新規 or 既存拡張 | T1 同型で `record_type == "return_record"` + 実 PK 突合 + 既存 key（return_type / register_processed 含む）残存 | UI-11c-D7 / D-1 |
| T3 | disposal 操作ログ契約 | 新規 or 既存拡張 | T1 同型で `record_type == "disposal_record"` + 実 PK 突合 | UI-11c-D7 / D-1 |
| T4 | manual_sale 操作ログ契約 | 新規 or 既存拡張 | T1 同型で `record_type == "manual_sale"` + `record_id` == 作成結果の `sale_id`（= `manual_sales.id`）**+ parse 済み JSON object に `"sale_id"` key が存在しない**（object key 検査による対 oracle — 文字列 contains 判定は不可） | UI-11c-D7 / D-1 / D-2 |
| T5 | 冪等再送・rollback 既存保護 | 既存 | 4 service の冪等再送 test（operation_logs COUNT 非増加）と失敗系 test が**無変更で** green | 冪等・rollback 隣接 |
| T6 | 消費側既存保護 | 既存 | frontend の OperationLogsPage test（positive fixture + negative 8 種）が**無変更で** green + frontend diff 0 file / bindings diff ゼロ（AC4 機械確認） | 消費側 fail-closed 隣接 |

T1〜T4 は 4 producer を**個別の test（または個別 case）**とし、1 loop の combined assert にしない。既存 test に detail_json の key 構成 assert がある場合（receiving の最新ログ検査 test）は key 追加への追随のみ正当更新とし、Writer が PR body に file:line を列挙する（アサート弱体化不可）。

## State Lifecycle Matrix

| 状態 | 遷移 | 検証 |
|---|---|---|
| 業務記録なし | 作成成功 → 記録 + 操作ログ（2 field 付き）同時 commit | T1〜T4 |
| 作成済み（同一 idempotency key） | 再送 → 早期 return、ログ非増加 | T5 |
| 作成失敗（validation / DB error） | rollback → 記録もログも残らない | T5（既存失敗系） |
| 過去ログ（record_type なし） | 表示 → link 非表示のまま（遡及なし） | T6 + L3 併せて確認 |

## Adjacent Pattern Audit

- `insert_operation_log` 呼出しは 18 file・約 30 site あるが、§74.9 の対象は業務記録 4 操作の作成 site のみ。他 site（設定変更・保守系等）への `record_type` 追加は Non-scope — 対象 4 site 以外の diff が出ないことを review で確認。
- 4 操作の取消・訂正系に追加の書込み site はない（起票時実測: 各操作とも作成 site 単一）。
- `record_id` 既書込みの 3 site と manual_sale の書式差（`sale_id`）は本 change で解消 — 対称性は T1〜T4 の同型 oracle で固定。

## Negative Paths

- manual_sale の新規 detail に `sale_id` key なし（T4 対 oracle）。
- 冪等再送でログ非増加（T5）。
- 過去ログ・欠落 field で link 非表示（T6 既存 negative 8 種）。

## Boundary Checks

- `record_id` は serde_json `json!` で i64 → JSON number になり、§74.9 guard（`typeof number` / `Number.isSafeInteger` / `> 0`）を満たす — 既存 `record_id` 書込み 3 site と同型で新規変換なし。
- 文字列化（`"record_id": "31"` 型の誤実装）は guard が拒否して link 不発火になる — T1〜T4 の parse 後型検査（number であること）で検出。

## Compatibility Checks

- 既存 detail key・summary・operation_type は全 site 不変（T1〜T4 の残存 assert + T5/T6）。
- DTO / bindings / frontend / schema / migration は非接触（AC4 機械確認）。

## Data Safety Checks

- fixture は in-memory / temp SQLite の合成データのみ。実店舗データ非使用。

## Main Wiring / Integration Checks

- T1〜T4 は実 SQLite 上で service 関数（create 系）を呼び、operation_logs の実 row を SELECT して parse する end-to-end（detail 構築だけの unit 切り出しにしない — 書込み経路の wiring まで固定）。

## Mutation-style Adequacy Questions

- 1 site だけ `record_type` を消したら？ → 当該 site の T のみ fail（per-producer 個別性）。
- returns の `record_type` を許可リスト内の別値 `"manual_sale"` にしたら？ → T2 の literal 完全一致が fail。
- manual_sale の `record_id` を `sale_id + 1` にしたら？ → T4 の実 PK 突合が fail。
- manual_sale に `sale_id` key を残したら？ → T4 の対 oracle が fail。
- record_id を文字列で書いたら？ → T1〜T4 の型検査が fail。
- doc 是正を 1 箇所漏らしたら？ → AC5 の rg sweep（live docs 0 hit）が fail。

## 必須 mutation 注入（Final Review で clean tree 独立再実測、5 件）

| # | 注入 | kill 期待 |
|---|---|---|
| M1 | receiving.rs の `"record_type"` 行を削除 | T1 のみ fail（T2〜T4 green = per-producer 個別性確認） |
| M2 | returns.rs の `record_type` 値を `"manual_sale"` へ置換（許可リスト内誤値） | T2（literal 完全一致） |
| M3 | manual_sale.rs の `record_id` 値を `sale_id + 1` へ置換 | T4（実 PK 突合） |
| M4 | manual_sale.rs に `"sale_id": sale_id` を再追加 | T4（対 oracle） |
| M5 | disposal.rs の `record_type` 値を `"disposal"` へ置換（許可リスト外） | T3（literal 完全一致） |

## Residual Test Gaps

- 実データでの link 発火 → 詳細到達 → returnTo 調査 state 復元は automated test の fixture 経路では代替不能（producer → DB → UI の全経路 + Windows native の実挙動）— L3-1〜L3-5 で被覆（L3-5 は PR #23 L3-3 waiver の引き継ぎ義務）。
- 過去ログ（record_type なし）の実データ fail-closed は L3 の任意確認項目。
