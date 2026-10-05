# Test Design Matrix: 小口のまとめ（商品修正の操作ログ・docs の古い参照）

Packet: [2026-10-06-small-batch.md](../2026-10-06-small-batch.md)

## Risk

Risk: R3

## Contracts Under Test

- BIZ-01-D7（`docs/function-design/30-biz-product-service.md` §4.4）: 商品修正の detail_json は、変えた field ごとに `{"old","new"}` を持つ JSON object。値を持っても更新前と同じ field は書かない。変えた field が無ければ NULL。serde_json で組む。
- PRODUCT-PATCH-D1（同 §4.4）: clear 可能 field（`supplier_id`・`maker_code`）の JSON null は clear で、detail では `new: null`。
- 30 §4.4 step 4・4b・3・7（隣接、変えない）: price_history・plu_dirty・PLU の解放・TX の rollback。
- UI-11c-D6（74 §74.8、読む側、owner の決定 Q1 = A で変えない）: 未知 key は key のまま、object の値は JSON 文字列で出す。
- docs: `docs/TOOLING_SKILL_COMMANDS.md` の見出しの参照先、`.codex/README.md` の撤去済みの mode の句。

## Failure Modes

- 売価・原価以外だけの変更で detail_json が NULL のまま（今の振舞い。`src-tauri/src/biz/product_service.rs:394` の `if selling_changed || cost_changed`）。
- field を 1 つ書き漏らす（9 field のどれか）。
- old と new を入れ違える。
- clear（`Some(None)`）を「変更なし」と扱って書かない、または `null` でなく空文字にする。
- 値を持つが同じ field を書く（`is_some()` だけで判定）。
- 文字列を `format!` で連結して、`"`・`\` を含む名前で壊れた JSON を作る。
- 変更なしの request で `{}`（空の object）を書く（契約は NULL）。
- detail の組み替えのついでに price_history・plu_dirty・PLU の解放・rollback を壊す。
- detail の組み替えのついでに操作ログの INSERT を COMMIT の後へ動かし、ログの INSERT が失敗しても商品の変更と price_history が残る（既存の rollback の test は検出しない）。

## Test Matrix

既存の test の実在は `rg -n 'fn test_update_product' src-tauri/src/biz/product_service.rs` で確かめた（`:2206`・`:2239`・`:2284`・`:2346`・`:2359`・`:2382`・`:2421`・`:2522`）。T1〜T5 は新規。T1〜T4 は実装の前に red になり、T5 は今の実装でも通る guard（M7 で red）。T1〜T5 はすべて `init_database` の実 DB（`setup_test_db`、`:1453`）に `update_product` を通す。T1〜T4 は `SELECT detail_json FROM operation_logs WHERE operation_type = 'product_update' ORDER BY id DESC LIMIT 1` を `serde_json::Value` に parse して key ごとに `assert_eq!` する（文字列の `contains` にしない）。商品は `default_create_request`（`:1553`、名前「テスト商品」・部門 2・売価 500・原価 300・税率 10・在庫連動 true・PLU 対象 false・取引先とメーカー品番は無し・`jan_code: None`〈`:1555`〉）を元に、既存の `test_update_product_req102_detail_json_recorded`（`:2425`〜`:2427`）と同じく合成の JAN（`2000000000…` の形で、既存の test の値と重ならない値）を付けて作り、商品コード = JAN で更新する。JAN 無しで部門 3 にすると、部門 3 は接頭辞が無く（`src-tauri/src/db/schema_v1.rs:269` の `code_prefix` が NULL）`generate_custom_code` が `ValidationFailed` を返す（`:163`〜`:165`）ので、作成で落ちて想定と別の理由の red になる。oracle の値は fixture の既定と違う値を選ぶ。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| BIZ-01-D7 非価格の 5 field | NULL のまま・書き漏らし・old/new の入れ違い | integration（実 DB） | T1 `test_update_product_req102_detail_json_non_price_fields` | 名前「テスト商品」→「改名後の商品」、部門 3 → 4（JAN を付けて部門 3 で作る。部門 4 は `schema_v1.rs:270`）、税率 `"10"` → `"8"`、在庫連動 true → false、PLU 対象 false → true を 1 回で送り、5 key それぞれの `old`・`new` が一致し、`selling_price`・`cost_price`・`supplier_id`・`maker_code` の key が無いこと。今の実装は detail が NULL で `unwrap` が落ちる。field を 1 つ外す・old と new を入れ違えると該当の `assert_eq!` が落ちる |
| BIZ-01-D7・PRODUCT-PATCH-D1 clear 可能 field | clear を書かない・null 以外にする・null → 値を書かない | integration（実 DB） | T2 `test_update_product_req102_detail_json_clearable_fields` | (i) 取引先を `seed_named_supplier`（`:1460`）で作り、取引先無し・メーカー品番無しの商品へ `supplier_id: Some(Some(id))`・`maker_code: Some(Some("MK-T2"))` を送ると `old: null`・`new: id` / `"MK-T2"`。(ii) 続けて `Some(None)` を 2 つ送ると `old: id` / `"MK-T2"`・`new: null`。今の実装は両方 NULL で落ちる。clear を「変更なし」と扱うと (ii) の key が無く落ちる |
| BIZ-01-D7・30 §4.4 step 6 同じ値は書かない・無ければ NULL | `is_some()` だけで判定・空 object を書く | integration（実 DB） | T3 `test_update_product_req102_detail_json_unchanged_fields_omitted` | (i) `selling_price: Some(500)`（同じ）と `cost_price: Some(320)`（違う）と `name: Some("テスト商品")`（同じ）を送ると、key は `cost_price` だけで `{"old":300,"new":320}`。今の実装は `selling_price` も書くので落ちる。(ii) 全 field を更新前と同じ値で送ると detail_json が NULL（`{}` を書くと落ちる）。clear できる field は更新前が無しなので `supplier_id: Some(None)`・`maker_code: Some(None)` を含めて送る（`None` で送ると M8 を検出しない）。(ii) は今も通る guard |
| BIZ-01-D7 serde_json で組む | `format!` 連結で壊れた JSON | integration（実 DB） | T4 `test_update_product_req102_detail_json_escapes_name` | 名前を `改名"引用\逆斜線` に変えると、detail が `serde_json::from_str` で parse でき、`name.new` がその文字列と一致する。今の実装は NULL で落ちる。文字列を `format!("\"{}\"", name)` で入れると parse が落ちる |
| 30 §4.4 step 6 売価の前後（REQ-102、既存） | 売価の old/new が消える | integration（既存） | `test_update_product_req102_detail_json_recorded`（`:2421`） | 売価 500 → 999 の `"old":500`・`"new":999` が出なくなると落ちる。消さず弱めない |
| 30 §4.4 step 4・4b（隣接、既存） | detail の組み替えで price_history・plu_dirty を壊す | integration（既存） | `test_update_product_req102_price_change`（`:2206`）・`test_update_product_req102_cost_only_no_plu_dirty`（`:2239`）・`test_update_product_req102_sets_plu_dirty_when_plu_target_turns_on`（`:2284`） | price_history の行・plu_dirty の値が変わると落ちる |
| 30 §4.4 step 3・7 TX（隣接、既存） | price_history の後の失敗で行が残る | integration（既存） | `test_update_product_req102_rollback_after_price_history`（`:2522`） | failpoint（`:361`、products の UPDATE と操作ログより前）の後に price_history か売価が残ると落ちる。操作ログの INSERT（`:407`）の失敗と、ログを COMMIT（`:409`）の後へ動かすことは検出しない（T5 が受け持つ） |
| 30 §4.4 step 6・7 操作ログは TX の中（隣接、新規） | ログの INSERT が失敗しても商品の変更が残る・ログを COMMIT の後へ動かす | integration（実 DB） | T5 `test_update_product_req102_log_failure_rolls_back_all` | 作成の後に `CREATE TRIGGER … BEFORE INSERT ON operation_logs WHEN NEW.operation_type = 'product_update' BEGIN SELECT RAISE(ABORT, …); END;` を張る（先例 `fail_supplier_rename_log`、`:4127`〜`:4129`。作成の `product_create` のログには効かない条件にする）。(i) 売価 500 → 999 と名前の変更を送ると `update_product` が Err で、売価 500・名前「テスト商品」・price_history の件数が更新前と同じ・`product_update` のログ 0 件。(ii) 価格を変えず名前だけを送ると Err で、名前は「テスト商品」のまま・`product_update` のログ 0 件。今の実装は通る。ログの INSERT を COMMIT の後へ動かす（M7）と、Err を返しても (i) で売価 999・(ii) で名前の変更が残って落ちる |
| UI-11c-D6 未知 key の raw 表示（読む側、既存） | 画面が未知 key を隠す | component（既存） | `OperationLogsPage.test.tsx` の `:661`「expands one row, labels known fields, and renders hostile JSON as text」（既知 key の label と文字列の値を text で出す）、`:83`「⑰ SC2/SC6 / UIDISP-D2/D6: 長い JSON 要約の祖先で折り返し、日時は等幅にする」（配列の値を `JSON.stringify` で出す）、`:746` `test_operation_logs_req902_t11_keeps_generic_detail_for_other_operation_types`（未知 key `adjustments` を key のまま、配列の値を `JSON.stringify` で出す） | 画面を変えない（owner の決定 Q1 = A）ので、既存の test が通り続けることだけを確かめる |
| 候補 3 見出しの参照先 | 実在しない参照が残る | docs sweep | AC6 の ``rg -n 'CLAUDE.md` で推奨' docs/TOOLING_SKILL_COMMANDS.md`` | 旧い見出しが残ると一致する（起票時は `:44` で一致 1 行） |
| 候補 4 撤去済みの mode の句 | 撤去済みの語が残る・helper の使い方まで消す | docs sweep | AC7 の `rg -n 'github mode\|state-only\|三点一致' .codex/README.md` と `rg -c 'pr-gate.py status' .codex/README.md` | 旧い句が残ると前者が一致する（起票時は `:246` の 1 行）。行ごと消すと後者が 0 になる |

## State Lifecycle Matrix

not applicable: detail_json は 1 回の保存で 1 回書く追記のみのログで、画面の状態・cache・retry の遷移を変えない（操作ログ画面は変えない、owner の決定 Q1 = A）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| detail_json を `serde_json::json!` で組み、文字列を連結しない | `rg -n 'detail_json: Some\(format!' src-tauri/src/biz/product_service.rs` → `:494`（`revise_product_price` の `product_price_revise`。価格 4 値の整数だけ）。`serde_json::json!` を使う所は `:654`・`:761`・`:800`・`:1419` | `update_product` step 6（`:394`）を json に替える | `:494` は別の種別で本 lane の Non-scope（値が整数だけなので escape の問題は起きない。触らない） | T4 |
| clear 可能 field の `Option<Option<T>>`（PRODUCT-PATCH-D1） | `ProductUpdateRequest`（`:50`〜`:64`）の `supplier_id`・`maker_code`、repo の `ProductUpdates`（`src-tauri/src/db/product_repo.rs:157`〜`:173`） | detail の判定に同じ区別を使う | `jan_code`（`ProductUpdates` にだけあり、`update_product` の request に無い） | T2 |
| 「変えた」の判定（`req.x.is_some() && req.x != Some(existing.x)`） | `selling_changed`・`cost_changed`（`:344`〜`:347`）、`plu_target_enabled`（`:368`） | 9 field に同じ形で使う | なし | T1・T3 |

## Negative Paths

- missing input: 全 field が None の request → detail_json は NULL、ログの行は書く（T3 (ii) と同じ契約。画面の通常の「何も変えずに保存」）。
- invalid input: validation で落ちる request（名前が空・部門が無い・取引先が無い）はログを書かない（既存の `test_update_product_req102_validation_department_not_found`〈`:2359`〉・`test_update_product_req102_validation_supplier_not_found`〈`:2382`〉。本 lane は step 2 を変えない）。
- duplicate/ambiguous input: 同じ値の field（T3）。
- unknown reference: 存在しない商品 → NotFound でログを書かない（既存 `test_update_product_req102_not_found`〈`:2346`〉）。
- dependency missing: 該当なし（外部の依存を足さない。serde_json は既存の依存）。
- permission/write failure: 操作ログの INSERT の失敗は TX ごと rollback し、商品・price_history・operation_logs が残らない（T5。価格を変える更新と、価格以外だけの更新の 2 case）。price_history の後の失敗は既存 `test_update_product_req102_rollback_after_price_history`。
- dry-run side effect: 該当なし（dry-run の経路が無い）。

## Boundary Checks

- threshold: 該当なし。
- null/default: clear 可能 field の null（T2）、変更なしの NULL（T3 (ii)）。
- empty/non-empty: 空の object を書かない（T3 (ii)）。
- min/max: 価格の 0（validation は 0 以上を許す）。0 への変更も「変えた」に入る（T3 の形で Writer が 1 assertion を足してよい。必須にしない）。
- status/policy enum: `tax_rate` は DB と同じ `"10"`・`"8"`・`"0"` の文字列（T1）。
- wire type: detail_json は TEXT の JSON object か NULL。
- internal type: `serde_json::Value`。
- producer/consumer: producer は `update_product` だけ、consumer は操作ログ画面だけ（packet の Scope の表）。
- round-trip token: T4（escape を含む名前が parse 後に一致）。
- precision/range: i64 の価格・ID は JSON の数。2^53 を超える値の画面の丸めは既存の形と同じで、本 lane は test を足さない（Residual Test Gaps）。
- cross-language parse: Rust の `to_string` → JS の `JSON.parse`。T4 は Rust の `from_str` で確かめ、JS 側は既存の UI-11c の test が任意の object を受けることに依る。

## Compatibility Checks

- old schema/input: この形より前の記録（売価・原価の両方を持つ）は書き換えない。画面は区別せずに出す。
- new schema/input: BIZ-01-D7 の形。
- output order: key の順は契約にしない（serde_json の既定は辞書順、packet の Contract Probe P2）。test は key で引き、順を比べない。
- optional field behavior: 変えていない field の key は無い（T1・T3）。

## Data Safety Checks

- source-derived data: 使わない。
- generated outputs: `docs/function-design/90-traceability.md`（生成物。手で編集しない）。
- secrets: 触らない。
- local-only files: 該当なし。
- synthetic sample boundaries: 合成の商品・取引先（`default_create_request`・`seed_named_supplier`）だけ。

## Main Wiring / Integration Checks

- helper connected to main path: detail を組む処理は `update_product` の step 6 の中か、そこから呼ぶ関数に置き、T1〜T5 は `update_product` を通して確かめる（組む関数だけの unit test で済ませない）。
- output reaches manifest/report: `operation_logs` の行を SQL で読む（T1〜T5）。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

実装の後に Writer が production 側だけに注入し、red を確かめて戻す。command は AC2 の `cd src-tauri && cargo test --lib test_update_product_req102`（T1〜T4 の `test_update_product_req102_detail_json_*` と T5 の `test_update_product_req102_log_failure_rolls_back_all` の両方を選ぶ。AC1 の filter は T5 を選ばない）。

- M1 detail の組み立てから `tax_rate` を外す → T1 が red。
- M2 old と new を入れ違える → T1・T2 が red。
- M3 「変えた」の判定を `is_some()` だけにする → T3 (i) が red。
- M4 clear（`Some(None)`）を「変更なし」と扱う → T2 (ii) が red。
- M5 変更なしでも `Some("{}")` を書く → T3 (ii) が red。
- M6 名前を `format!` の文字列連結で入れる → T4 が red。
- M8 clear できる field（`supplier_id`・`maker_code`）だけ「変えた」を `is_some()` で判定する → T3 (ii) が red（`Some(None)` を送り、更新前も無しなのに key が出る）。
- M7 操作ログの INSERT（`:407`）を COMMIT（`:409`）の後へ動かす → T5 が red（trigger でログが失敗しても商品の UPDATE と price_history が既に COMMIT 済みで、(i) の売価 999・(ii) の名前の変更が残る）。既存の `test_update_product_req102_rollback_after_price_history` は failpoint がログより前（`:361`）にあり、この mutant を検出しない（Plan Review round 1 の是正、Review Response 参照）。
- mock の値: mock を使わない（実 DB）。oracle の値は fixture の既定（名前「テスト商品」・売価 500・原価 300）と違う値を new に選ぶ。
- invalidate/refetch・state token の往復・JSON の数の 2^53 超え・dry-run: 該当なし（Residual Test Gaps）。

## Residual Test Gaps

- 2^53 を超える価格の画面での丸め: 既存の形と同じ残りで、本 lane は扱わない。
- 操作ログ画面に商品修正の detail が実際にどう見えるかの component test: 画面を変えないので足さない（owner の決定 Q1 = A）。見せ方を変える `docs/backlog.md` の design-first の lane が足す。
- `:494` の `format!` で組む別の種別の detail_json: Non-scope（Adjacent Pattern Audit）。
