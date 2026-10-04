# Test Design Matrix: 独自コードの自動採番が既存の番号と衝突して止まる

Plan Packet: [2026-10-04-custom-code-seq](../2026-10-04-custom-code-seq.md)。T / R の番号と S 番号・AC 番号は packet のもの。

## Risk

Risk: R3

## Contracts Under Test

- BIZ-01-D6（30-biz §4.3）: 独自コードの発番は、同じ接頭辞の既存の独自コードの番号の最大 + 1 と next_seq の大きい方を使う。取り込んだ番号の間の抜けは使わない。番号として数えるのは `{接頭辞}-` の後ろが 1 文字以上の ASCII 数字だけで i64 として読めるコード（全商品、部門を問わない、大文字・小文字を区別）。最大 + 1 が i64 を超えれば `ValidationFailed`。
- 30-biz §4.2 / §4.3 の注: 番号の読み書きは `create_product` の TX の中で、登録の失敗で next_seq の引上げも戻る。
- 30-biz §4.9 step 2c: 商品 CSV の取込みは next_seq を進めない（振舞いは不変）。
- 20-io §2.3 `list_product_codes_by_prefix`: `substr` の一致で、大文字・小文字を区別し `%` `_` を特殊文字にしない。廃番を含む全商品。
- 20-io §2.4 `raise_next_seq`: next_seq を下げない。部門が無ければ `NotFound`。
- master-tables departments.next_seq: 次に発番する連番の下限。

## Failure Modes

- F1 取込みの後の登録が、取り込んだ番号の重複で止まり続ける（今の不具合。Probe P1・P2）。
- F2 空き番号を 1 つずつ探す実装（BIZ-01-D6 の却下 (a)）で、取り込んだ番号の抜けを新しい商品に振る。
- F3 next_seq を最大 + 1 で上書きして下げる（next_seq が最大より大きいときに、以前に振った番号の範囲へ戻る）。
- F4 next_seq の引上げが TX の外で行われ、登録の失敗の後に引上げだけが残る。
- F5 `LIKE` で一致を取り、`hz-0009` を数える（次の番号が不要に跳ぶ）か、接頭辞の `%` `_` が wildcard になる。
- F6 番号の読み取りが数字以外の文字を含むコード（`HZ-00A1`、`HZ-0009X`）や空（`HZ-`）を数える、または前方一致だけで `HZX-0009` を数える。
- F7 部門で絞って数え、別の部門の ID で取り込んだ `HZ-...` に当たる。
- F8 i64 を超える桁のコードで parse が panic する、または最大 + 1 が overflow する。
- F9 取込みの無い部門の番号が変わる（既存の発番の回帰）。
- F10 既存の test の前提（既存のコードがあると `DuplicateProductCode`）を直さず残し、新しい設計と食い違う、または理由なく消す。
- F11 新しい pub 関数が 20-io に載らず、`design_compliance_test` が落ちる。新しい test の REQ が traceability に載らない。

## Test Matrix

- 既存 test の引用は `rg -n` で実在を確かめた（2026-10-04、base `76de30d8`）: `src-tauri/src/biz/product_service.rs` の `test_generate_custom_code_req101_normal`（:1543）・`_no_prefix`（:1555）・`_sequential`（:1570）・`_requires_borrowed_transaction`（:1603）、`test_create_product_req101_duplicate_jan`（:1869）、`test_create_product_req101_duplicate_key_from_insert`（:1887）、`test_create_product_req101_rollback_after_insert`（:1925）、`src-tauri/src/db/product_repo.rs` の `test_increment_next_seq_req101_normal`（:1327）・`_nonexistent_department`（:1344）、`src-tauri/tests/design_compliance_test.rs`。
- test は実 DB（`setup_test_db` の tempdir、`init_database` で schema と部門の初期データ）を通し、mock を使わない。既存のコードは `product_repo::insert_product` で直接入れる（T1 だけ `preview_import` → `commit_import` を通す）。値は合成。部門は初期データの 1（接頭辞 KM）・2（接頭辞 HZ）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| BIZ-01-D6、30-biz §4.9 step 2c（Goal） | F1 | integration（BIZ） | T1 `test_create_product_req101_custom_code_after_csv_import`: UTF-8 BOM 付きの合成 CSV（`HZ-0001`・`HZ-0002`、部門 ID 2）を `preview_import` → `commit_import`。直後の部門 2 の next_seq が 1。`create_product`（JAN なし、部門 2）が `HZ-0003`、続けて `HZ-0004`。その後の next_seq が 5 | 今の実装（`DuplicateProductCode("HZ-0001")`）、取込みで next_seq を進める実装（直後の next_seq が 1 でない） |
| BIZ-01-D6（抜けを使わない） | F2 | unit（BIZ、TX 内） | T2 `test_generate_custom_code_req101_skips_gap_after_max`: 既存 `HZ-0001`・`HZ-0005` → `generate_custom_code(&tx, 2)` が `HZ-0006` | 空き番号を探す実装（`HZ-0002`）、今の実装（`DuplicateProductCode`） |
| BIZ-01-D6（next_seq の方が大きい） | F3 | unit（BIZ） | T3 `test_generate_custom_code_req101_keeps_next_seq_above_max`: 部門 2 の next_seq を 10 に（test の中の `UPDATE`）、既存 `HZ-0003` → `HZ-0010`、その後の next_seq が 11 | next_seq を最大 + 1 で上書きする実装（`HZ-0004`） |
| BIZ-01-D6（数えるコードの規則） | F5 / F6 | unit（BIZ） | T4 `test_generate_custom_code_req101_ignores_non_numbered_codes`: 既存 `HZ-00A1`・`HZ-0009X`・`HZ-`・`hz-0009`・`HZX-0009`・`SY-0009`・`HZ-99999999999999999999`（i64 を超える）→ `HZ-0001`。panic しない | 数字以外を除いて読む、前方一致だけ、`LIKE`、i64 の parse で panic / unwrap |
| BIZ-01-D6（部門を問わない） | F7 | unit（BIZ） | T5 `test_generate_custom_code_req101_counts_codes_in_other_departments`: 既存 `HZ-0007` を部門 1 で入れる → `generate_custom_code(&tx, 2)` が `HZ-0008` | 部門で絞って数える実装（`HZ-0001`） |
| 30-biz §4.2 / §4.3 の注（TX） | F4 | integration（BIZ、failpoint） | T6 `test_create_product_req101_rollback_restores_raised_next_seq`: 既存 `HZ-0003`、`CREATE_PRODUCT_AFTER_INSERT` を arm して `create_product` → Err、部門 2 の next_seq が 1 のまま。guard を外して再び `create_product` → `HZ-0004` | 引上げを別の接続・別の TX で行う実装（next_seq が 5 のまま残る） |
| BIZ-01-D6（i64 の上限） | F8 | unit（BIZ） | T7 `test_generate_custom_code_req101_rejects_seq_overflow`: 既存 `HZ-9223372036854775807` → `Err(BizError::ValidationFailed(_))`、文言が「この部門の独自コードの番号を振れません」 | `+ 1` が overflow で panic（debug）/ 負の値へ wrap（release）、別の文言 |
| 30-biz §4.2 エラーハンドリング、BIZ-01-D6（S2 の改名） | F10 | integration（BIZ） | 既存 `test_create_product_req101_duplicate_key_from_insert` を `test_create_product_req101_skips_directly_inserted_custom_code` に改名して書き換え: 既存 `HZ-0001`（直接 INSERT）→ `create_product`（JAN なし、部門 2）が `HZ-0002`。comment に「旧前提は BIZ-01-D6 で廃止。INSERT 時の `DuplicateKey` の正規化には元から届いていなかった」の 1 行 | 旧前提のまま残す（新しい実装で red）、理由なく消す（AC1 で名前が出ない） |
| 20-io §2.3 | F5 | unit（IO） | R1 `test_list_product_codes_by_prefix_req101_exact_prefix`: 既存 `HZ-0001`・`HZ-0002`（廃番）・`hz-0009`・`HZX-0009`・`H%-0001` → `"HZ-"` で `HZ-0001`・`HZ-0002` の 2 件（順は問わない）。`"H%-"` で `H%-0001` だけ。`"QQ-"` で空 | `LIKE` を使う（`hz-0009` が入る、`"H%-"` が `HZ-...` を返す）、廃番を除く |
| 20-io §2.4 | F3 | unit（IO） | R2 `test_raise_next_seq_req101_raises_only`: 部門 2（next_seq 1）に `raise_next_seq(2, 5)` → 5、続けて `raise_next_seq(2, 3)` → 5 のまま、`raise_next_seq(9999, 5)` → `Err(DbError::NotFound)` | 下げる（`SET next_seq = ?2`）、存在しない部門で Ok |
| 取込みの無い部門の発番（回帰） | F9 | unit（BIZ、既存） | `test_generate_custom_code_req101_normal`・`_sequential`（既存、不変） | 既存のコードが無いのに番号が 1 から始まらない、連番が飛ぶ |
| 30-biz §4.3 step 1〜2、signature | — | unit（既存） | `test_generate_custom_code_req101_no_prefix`・`_requires_borrowed_transaction`（既存、不変） | 接頭辞の無い部門で発番する、signature を通常の接続に戻す |
| 30-biz §4.2（JAN の重複） | — | integration（既存） | `test_create_product_req101_duplicate_jan`（既存、不変） | JAN の重複の判定を消す |
| 30-biz §4.2 step 2（TX、取込みの無い場合） | F4 | integration（既存） | `test_create_product_req101_rollback_after_insert`（既存、不変） | 発番の TX の境界を変える |
| 20-io §2.4 `increment_next_seq`（不変） | — | unit（既存） | `test_increment_next_seq_req101_normal`・`_nonexistent_department`（既存、不変） | `increment_next_seq` を変える |
| 設計と実装の突合 | F11 | CLI | `cargo test --test design_compliance_test`（AC3）、`cargo run --bin generate_traceability -- --check`（AC4） | 新しい pub 関数が 20-io に無い、`90-traceability.md` の再生成忘れ |

## Mutation / anti-tautology check

Writer は実装の後、次の仮の mutation をそれぞれ当てて対象の test が red になることを確かめ、結果を PR の本文に書く（mutation は commit しない）。

- M1 `generate_custom_code` を「next_seq から 1 つずつ進めて空きを探す」（却下 (a)）に置き換える → T2（`HZ-0002`）・T5（`HZ-0001`）が red。T1・T3 は green のままでよい。
- M2 `list_product_codes_by_prefix` の SQL を `product_code LIKE ?1 || '%'` にする → R1 が red。
- M3 `raise_next_seq` を `SET next_seq = ?2` にする → R2・T3 が red。
- M4 番号の読み取りで ASCII 数字の判定を外し、数字だけを取り出して読む → T4 が red。
- M5 `raise_next_seq` の呼び出しを外す（今の実装へ戻す）→ T1・T2・T5・T6・改名した test が red。

## State Lifecycle

画面の状態は変えない。DB の next_seq の遷移は: 初期（1）→ 取込み（不変、T1）→ 発番（最大 + 1 と next_seq の大きい方 + 1、T1〜T3）→ 失敗（引上げも戻る、T6）→ 再試行（同じ番号、T6）→ 再起動（状態は DB だけ。test 不要）。

## Manual Verification

なし（Human Gate は ready,merge。画面・文言・command は変えない）。
