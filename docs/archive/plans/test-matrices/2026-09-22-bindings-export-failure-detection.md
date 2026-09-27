# Test Design Matrix: 型生成（TS bindings）の失敗を失敗として検出する

[Plan Packet](../2026-09-22-bindings-export-failure-detection.md)（Gated Amendment 2 で追加）

## Risk

Risk: R3

## Contracts Under Test

- SPEC-BINDINGS-EXPORT-2026-09-22 C1〜C6（packet の Spec Contract）
- D-054（`docs/decision-log.md`）: L1 の bindings clean diff 検査が cross-language 同期の機械検査を兼ねる

## Failure Modes

- FM1: 生成のどこかの段が失敗したのに CLI が 0 で終了し、古い `src/lib/bindings.ts` のまま gate が green になる（起票の出典）
- FM2: 失敗した生成が既存の `bindings.ts` を壊す、または一時 file を作業 tree に残す
- FM3: 成功時の生成内容が変わる
- FM4: 並走する 2 つの生成が一時 file を取り合い、成功 exit のまま不完全な bindings を公開する（Final Review round 1 で実発生）
- FM5: 生成の失敗が `tauri dev` の起動を止める
- FM6: test の失敗条件が現物で成立しない（GA1 で実発生: 親 directory が無いだけでは export は失敗しない）

## Test Matrix

test 名は `rg -n 'fn export_bindings_to_|fn normalize_generated_bindings_fails|fn append_generated_constants_fails' src-tauri/src/lib.rs` で実在を確認した（2026-09-22）。すべて `src-tauri/src/lib.rs` の `bindings_generation_tests`。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C2 / C3 | FM3 / FM2 | unit | `export_bindings_to_succeeds_and_leaves_no_temp_file`（T1） | 定数追記や整形が抜ける、成功後に一時 file が残る |
| C1 | FM1 / FM6 | unit | `export_bindings_to_fails_when_parent_directory_cannot_be_created`（T2） | 一時 file 確保段の `Err` を握りつぶす、message から出力先 path が消える（closeout で訂正: 一意な一時 file 名の是正後はこの条件は specta export ではなく `acquire_temp_path` で落ちる、D12） |
| C1 / C3 | FM1 / FM2 | unit | `export_bindings_to_fails_when_target_is_a_directory`（T3） | 置換段の `Err` を握りつぶす、失敗時に一時 file を消さない |
| C3 | FM2 | unit（unix） | `export_bindings_to_preserves_existing_content_when_directory_is_read_only`（T4） | 一時 file を経由せず出力先へ直接書く、失敗時に既存内容を変える |
| C1 | FM1 | unit | `normalize_generated_bindings_fails_for_missing_path`（T5） | 整形が読めない file を成功扱いにする |
| C1 | FM1 | unit | `append_generated_constants_fails_for_missing_path`（T6） | 定数追記が読めない file を成功扱いにする |
| C4 | FM4 | regression | `export_bindings_to_is_safe_under_concurrent_calls_to_the_same_target`（T7） | 一時 file 名が呼出し間で共有される（固定名へ戻すと 10/10 red、Writer 実測）、`create_new` を外す、`AlreadyExists` で継続せず即 `Err` にする、`MAX_ATTEMPTS` を 1 にする（closure の mutant 実測でいずれも red、D6） |
| C4 | FM4 | unit | `export_bindings_to_skips_a_temp_candidate_already_claimed_by_someone_else`（T8、closeout で追加、D5） | 最初の候補（counter=0）を確保済みの他者の一時 file を残さず消す、または生成が確保済み候補へ書き込む |
| C1 | FM1 | CLI（手動実測） | AC2: `chmod a-w src/lib` で `cargo run --bin generate_bindings` | CLI が `Err` でも 0 で終了する、完了 message を出す |
| C2 / C6 | FM3 | integration | local CI `generated-bindings` / `generated-bindings-diff` | 成功時の生成内容が変わる |

## State Lifecycle Matrix

not applicable: UI・DB・cache・route state を持たない。生成 file の状態は「成功で完成物に置換 / 失敗で不変」の 2 つだけで、T1 / T3 / T4 / T7 / T8 が見る。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 生成 CLI の失敗を終了コードへ伝える | `src-tauri/src/bin/generate_bindings.rs`、`src-tauri/src/bin/generate_traceability.rs` | `generate_bindings.rs` | `generate_traceability.rs` は `fn main() -> ExitCode`（`:56`）で `Err` を既に `ExitCode::FAILURE` へ変換済み（`:89-91`、`:100-102`）、移植不要（closeout で訂正、D9。pass B P3-5） | AC2 |
| `export_specta_bindings` の呼出し側 | `src-tauri/src/lib.rs` `run()`、`src-tauri/src/bin/generate_bindings.rs`（`rg -n 'export_specta_bindings' -g '!target' .`） | 2 箇所とも `Result` を受ける | なし | compile、AC2、review |

## Negative Paths

- missing input: 親 directory が無い場合は `export_to` が作成するため失敗しない（GA1、Contract Probe）
- invalid input: 出力先が directory（T3）、親の位置を file が塞ぐ（T2）
- duplicate/ambiguous input: 同じ出力先への並走（T7）、最初の候補を他者が既に確保している（T8）
- unknown reference: 該当なし
- dependency missing: 該当なし（新しい依存なし）
- permission/write failure: directory が書込み不可（T4、AC2）
- dry-run side effect: 該当なし

## Boundary Checks

- wire type / internal type / producer / consumer: packet の Boundary / Wire Contract のとおり、生成内容は不変
- その他の項目: 該当なし（閾値・enum・数値範囲を持たない）

## Compatibility Checks

- old schema/input: 該当なし
- new schema/input: 該当なし
- output order: 成功時の出力は byte 不変（AC1、T1）
- optional field behavior: 該当なし

## Data Safety Checks

- source-derived data: 実データに触れない
- generated outputs: `src/lib/bindings.ts` は成功時に同じ内容で置換されるだけ。一時 file は tracked にならない（AC1 の `git status --short -- src/lib` が空）
- secrets: 該当なし
- local-only files: `.local/ci-evidence/**`、`src-tauri/target/**`
- synthetic sample boundaries: test は `tempfile::tempdir()` 上のみ

## Main Wiring / Integration Checks

- helper connected to main path: `export_specta_bindings()` は `export_bindings_to` を実物の path で呼ぶだけ。AC1 が実物の経路を通す
- output reaches manifest/report: CLI の終了コードが `scripts/local-ci.sh` の `run_required generated-bindings` と hosted CI の step に届く（どちらも非 0 を失敗として扱う、編集なし）
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし（引数なし）

## Mutation-style Adequacy Questions

Final Review round 1（Codex、head `355a647d`）が mutant 7 本、closure（Opus、head `a7981300`、closeout で追加、D7）が mutant 8 本を実測した。結果は PR #88 の review と local-only closure 記録にある。

- guard を外すと落ちる test: rename の `Err` を握りつぶす → T3 が red。失敗時の `remove_file` を消す → T3 が red。一時 file を経由せず直接出力する → T4 / T7 が red。一時 file 名を固定へ戻す → T7 が red（Writer 実測 10/10）。`create_new` を `create` へ戻す / `AlreadyExists` で継続せず `Err` にする / `MAX_ATTEMPTS` を 1 にする → いずれも T7 と新規回帰 test（T8）が red（closure 実測）。
- 自動 test で生存した mutant: CLI の `std::process::exit(1)` を消す（AC2 の手動実測で検出）、`run()` が警告後に `return` する、合成関数内の整形 / 定数追記の `?` を `.ok()` にする、specta export の `?` を握りつぶす、失敗時 cleanup を自分が確保していない候補にも掛ける、T4 の probe 判定を反転する（`is_err` → `is_ok`）。現行 code はこれらの mutant が変える挙動を正しく実装しており、生存は自動 test の oracle 不足。Residual Test Gaps に残す。

## Residual Test Gaps

- 合成関数 `export_bindings_to` の中の整形・定数追記の失敗伝播、CLI の終了コード、`run()` が起動を続けることを固定する自動 test は無い。合成関数の途中へ失敗を注入する seam を production に足さない判断（packet 非目的、Codex round 1 finding #3 も seam を要求していない）。現行 code は Codex の一時 fault probe で 3 点とも正しいことを実測済み。oracle は AC2 の手動実測と review。再実行可能な smoke check として残すかは backlog で扱う。
- Windows native での rename による置換は未実測（packet の Contract Probe）。次に owner が Windows native で `tauri dev` を起動したとき、起動 log に「TS bindings の置換に失敗しました」の警告が出ないことを見れば足りる。Human Gate にはしない（失敗しても起動は続き、CLI と CI は非 0 で検出する）。
- 別 process 間の並走は自動 test にしていない（T7 は同一 process の thread）。process id は PID namespace 間で一意でないため単独では分離できず（broad pass A で実測）、候補を `create_new` で排他確保することで分離する（closeout で訂正、D4。旧記述「一時 file 名に process id を含めることで分離し」は否定された機序）。別 process・別 PID namespace 間の並走は broad pass A の再現手順（PR #88 review）と Coordinator の独立実測で確認した。
- 異常終了で残った orphan の一時 file は best-effort の後始末の対象外で累積し得る。同一 pid の orphan が候補 32 個を埋めると一時 file の確保が `Err` になり CLI は非 0 で終わる（誤 green にはならない）。検出は local CI の `END_TREE_STATE` と `git status`（closeout で追加、D10）。
- T4 は unix 限定（`#[cfg(unix)]`）。Windows では既存内容の保護を T3 が部分的に見る。書込み拒否が成立しない環境（root 実行など）では production 呼出しの前に probe file で書込み可否を判定し、書けてしまう場合は test を対象外として skip する（closeout で追記、D8）。
