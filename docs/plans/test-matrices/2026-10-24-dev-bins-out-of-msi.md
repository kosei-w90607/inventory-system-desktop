# Test Design Matrix: 開発用の bin を MSI から外す（導入の前の関門 5）

Plan Packet: [2026-10-24-dev-bins-out-of-msi](../2026-10-24-dev-bins-out-of-msi.md)。oracle は [decision-log](../../decision-log.md) D-137 と、tauri-cli 2.11.1 の `get_binaries`・tauri-bundler の `generate_binaries_data`（packet の Contract Probe P1・P2）。下の期待値は D-137 の文から直接書く（manifest から読んだ値どうしを比べない）。

## Risk

Risk: R3

## Contracts Under Test

- D-137 (1): tauri の crate（`src-tauri/`）は `src/bin/` も main 以外の `[[bin]]` も持たず、3 つの開発用の bin は `src-tauri/dev-tools/src/bin/` にある。bundle（MSI・deb）の実行 file は main の 1 つだけ。
- D-137 (2): `default-members` に dev-tools があり、`cargo run --bin <name>`・`cargo test`・`cargo clippy --all-targets --all-features`・`cargo fmt --check` の command のまま、移した bin とその test を含む。`default-run` が main を指し、`--bin` の無い `cargo run`（`npm run tauri dev`）が main を起動する。
- D-137 (3): `generate_traceability` の repo の root が dev-tools の `CARGO_MANIFEST_DIR` から 2 つ上で、再生成と `--check` の結果が変わらない。
- D-137 (4): (1)(2) が崩れると test が赤になる。

## Failure Modes

- 誰かが tauri の crate に `src/bin/*.rs` か `[[bin]]` を戻し、次の MSI に開発用の exe が入って店の PC へ配られる（`seed_demo_data.exe` が作業フォルダーに DB を作り、22 §12 で取り込まれる経路が戻る）。
- `default-members` から dev-tools が外れ、CI の `cargo run --bin generate_bindings` が失敗する（大きな音で落ちる）、または `cargo test` が generator の test を黙って回さなくなる・clippy が移した file を見なくなる（音なしで gate が弱まる。`cargo fmt --check` は `default-members` に依らず workspace の member を全部見る: packet の Contract Probe P3）。
- `src-tauri/src` だけを走査する検査（I-G1 の sweep、doc-consistency の R0・R1）が、移した bin を黙って見なくなる（packet の Contract Probe P10）。
- generator の repo の root が 1 つずれ、`90-traceability.md` を src-tauri の下に書く・`--check` が全 REQ を見失う。
- workspace の形で `tauri build` が通らない、または main の検出を誤って MSI のショートカットが起動しない。
- `default-run` が外れ、`npm run tauri dev` の `cargo run` が 2 つの package の bin を候補にして止まる。
- dev-tools の bin が tauri-build の Windows の resource（icon・版の情報・Common Controls v6 の manifest）を受けず、Windows で起動しない（手順書の予行演習の準備の `seed_demo_data` が止まる）。
- `Cargo.lock` に外部の crate が増える（新しい依存を名指しなしで入れる）。

## Test Matrix

| ID | 契約 | 種別 | test / 確かめ方 | red になる条件（mutation） |
|---|---|---|---|---|
| T1 | D-137 (1)(4) | unit（manifest と dir の読取り） | `bundle_identity_test::bundled_binaries_are_main_only_d137` | `src-tauri/src/bin/x.rs`（中身は `fn main() {}`）を足す → red。`src-tauri/Cargo.toml` に `[[bin]]` の塊を足す → red（各 1 回、戻す） |
| T2 | D-137 (2)(4) | unit（manifest の読取り） | `bundle_identity_test::default_members_and_default_run_d137` | `default-members` から `"dev-tools"` を外す → red。`default-run` の行を外すか値を変える → red（各 1 回、戻す） |
| T3 | D-137 (2) fmt の範囲 | gate の感度 | `cd src-tauri && cargo fmt --check` | `src-tauri/dev-tools/src/bin/seed_demo_data.rs` に整形の崩れ（例 `fn  x( ) {}`）を入れる → exit 非 0 で `Diff in` にその file（戻す） |
| T4 | D-137 (2) clippy の範囲 | gate の感度 | `cd src-tauri && cargo clippy --all-targets --all-features -- -D warnings` | dev-tools の bin に `len_zero` に当たる行を入れる → exit 非 0（戻す） |
| T5 | D-137 (2) test の範囲 | gate の感度 | `cd src-tauri && cargo test --bin generate_traceability -- --list` の名の集合を、Plan Commit の版（移す前）と比べる。`cd src-tauri && cargo test` の出力に dev-tools の `Running unittests src/bin/generate_traceability.rs` | 名の集合が違う・行が無い → AC5 の不合格 |
| T6 | D-137 (2) command の形 | CLI | packet の AC6 の 3 つを repo の root で（`seed_demo_data` を `--manifest-path` で、`(cd src-tauri && cargo run --bin generate_bindings) && git diff --exit-code -- src/lib/bindings.ts`、`(cd src-tauri && cargo run --bin generate_traceability) && git diff --exit-code -- docs/function-design/90-traceability.md` と `--check`。`src-tauri` で `git diff` を打つと pathspec が存在しない path になり常に exit 0） | どれかが非 0 → AC6 の不合格 |
| T7 | D-137 (3) | 既存の unit と CLI | generator の既存の test（`TempDir` を root にする）と T6 の再生成 | root の式を 1 つ上のままにする → T6 の再生成で `docs/function-design/` の外に書くか `--check` が ERROR（Writer が実装の前の版で 1 回だけ確かめてよい。必須にしない: 期待は T6 が持つ） |
| T8 | D-137 (1) 実物の bundle | build（Linux） | packet の Contract Probe P6 と AC11（`npm run tauri build -- --bundles deb` の後 `dpkg-deb -c … \| grep usr/bin/`） | Plan Commit の版で開発用の bin が 1 つ以上出る（感度。P6 の実測は `generate_traceability` の 1 つ）。実装の head で main 以外が出る → AC11 の不合格 |
| T9 | 依存を増やさない | 差分の確かめ | packet の AC8 | `Cargo.lock` に dev-tools の外の `[[package]]` の増減 → 不合格 |
| T10 | D-137 (2) の隣（I-G1 の sweep の範囲） | gate の感度 | `cd src-tauri && cargo test --test import_internal_contract_test test_active_sales_import_vocabulary_sweep_i_g1` | `src-tauri/dev-tools/src/bin/seed_demo_data.rs` の comment に旧い取込みの契約の語（`existing` と `_import_id` を連結した語）を書く → red（戻す） |
| L3-1 | D-137 (1)、22 §12 の入口 | L3 | packet の Test Plan の L3-1 | 入った folder の `.exe` が 2 つ以上、または 3 つの名のどれかがある |
| L3-2 | main の起動 | L3 | packet の Test Plan の L3-2 | スタートメニューから起動しない・ホームの画面が出ない |
| L3-3 | D-137 の Compatibility（dev-tools の bin の Windows の resource） | L3（merge の条件） | packet の Test Plan の L3-3（手順書と同じ debug の `cargo run --manifest-path src-tauri\Cargo.toml --bin seed_demo_data -- --help`） | loader のエラー（`STATUS_ENTRYPOINT_NOT_FOUND` ほか）で止まる・`exit=0` でない → manifest の是正を本 lane に足して確かめ直す（packet の AC12） |

## State Lifecycle Matrix

not applicable: 画面・DB・cache・route の状態を変えない（build の構成と bundle の中身だけ）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `cargo run --bin <開発用の bin>` の呼び出し | packet の Contract Probe P8 の `24` file | なし（書き換えない） | 全部。`default-members` で同じ command が動く | T6、AC7 |
| 開発用の bin の source の path の引用 | packet の Contract Probe P9 の `9` file | S2 の表の 6 file | `docs/DEV_SETUP_CHECKLIST.md` の完了の記録・decision-log の D-099 (D10)・`docs/backlog.md`（closeout）・`docs/research/**`・archive（履歴） | AC10 |
| `src-tauri/src` を名指しで走査する検査 | packet の Contract Probe P10（`design_compliance_test`・`architecture_test`・`scripts/check-command-drift.sh`・I-G1 の sweep・doc-consistency の R0・R1） | I-G1 の sweep（S2 で target に `src-tauri/dev-tools/src`） | doc-consistency の R0・R1（`scripts` を変えない: packet の AC7。移した bin は R0・R1 の走査から外れ、R0 の除外 `generate_traceability\.rs` は空振りになる。scripts を触る次の lane で直す: backlog）。`design_compliance_test`・`architecture_test`・`check-command-drift.sh` は 3 つの bin に当たる物が無い | T10 |
| `CARGO_MANIFEST_DIR` から repo の root を求める所 | `generate_traceability.rs`、`src-tauri/src/lib.rs` の `export_specta_bindings` | `generate_traceability.rs` だけ | lib の式は lib の crate（`src-tauri/`）の dir を使い、bin の場所に依らない | T6・T7 |

## Negative Paths

- missing input: dev-tools の `Cargo.toml` が無い・`members` に無い → cargo が workspace を読めず全 gate が落ちる（大きな音。T6）。
- invalid input: `default-members` から外れる → T2。
- duplicate/ambiguous input: tauri の crate と dev-tools に同じ名の bin → T1（tauri の crate の側に bin を置かせない）。
- unknown reference: 該当なし。
- dependency missing: dev-tools が `regex`・`tempfile` を書き忘れる → build が落ちる（T5・T6）。
- permission/write failure: 該当なし。
- dry-run side effect: `generate_traceability -- --check` が書かない（既存の契約のまま。T6 の `git diff --exit-code`）。

## Boundary Checks

- threshold / null/default / min/max / precision/range / round-trip token / cross-language parse: 該当なし。
- empty/non-empty: L3-1 の `.exe` の一覧は 1 行だけ（0 行も不合格: main が入っていない）。T8 の `usr/bin/` も main の 1 つ。
- producer/consumer: manifest → tauri-cli の `get_binaries` → MSI・deb（T8・L3-1）、manifest → cargo の package の選び方（T2〜T6）。

## Compatibility Checks

- old schema/input: 前の版の command（`cargo run --bin …`）がそのまま動く（T6）。
- new schema/input: `Cargo.lock` の dev-tools の行（T9）。
- output order / optional field behavior: 該当なし。

## Data Safety Checks

- source-derived data: 使わない。
- generated outputs: MSI・deb・`$TMPDIR` の seed の DB は commit しない。
- secrets / local-only files: 開発のデータの folder を L3 で触らない。
- synthetic sample boundaries: toy の probe と demo の seed だけ。

## Main Wiring / Integration Checks

- helper connected to main path: `default-members` が CI・pre-push・local-ci の command に届く（T5・T6、hosted の `Merge gate`）。
- output reaches manifest/report: bundle の binary の一覧（T8・L3-1）。
- effective config reaches runtime: MSI のショートカットが main を起動する（L3-2）。
- CLI arg reaches implementation: `seed_demo_data -- --db` が届く（T6）。

## Mutation-style Adequacy Questions

T1〜T4・T10 は Writer が実装の後に 1 つずつ注入して red を確かめて戻す（Final Reviewer が独立に 1 つ以上を再実測する）。T1 と T2 の期待は D-137 の文から直接書く（「`src/bin` が無い」「`[[bin]]` が無い」「`default-members` に `dev-tools`」「`default-run` が `inventory-system-tauri-scaffold`」）。

- If a guard is removed, which test fails?: tauri の crate に bin を戻す → T1。`default-members` か `default-run` を外す → T2。I-G1 の sweep の target から dev-tools を外す → T10。
- If a key branch is inverted, which test fails?: generator の root の式 → T6。
- If an output field is omitted, which test fails?: 移した bin の test が回らない → T5。
- 他の問い（mock の値・invalidate/refetch・閾値・順序・dry-run・JS の安全な整数・状態の往復）: 該当なし（manifest と build の構成だけで、値の計算・状態・wire が無い）。

## Residual Test Gaps

- tauri-cli を上げて `get_binaries` が workspace の member を読むように変わったとき、T1・T2 は止めない（crate の形だけを見る）。D-137 の Revisit で tauri-cli の更新のたびに P1 を確かめ直す。T8（deb）を CI に足すのは非目的。
- 前の MSI（PR #191 の版）の上への更新で開発用の exe が消えるかは見ない（非目的。店の PC は初回から新しい版）。
- dev-tools の bin が Windows の resource 無しで起動するかは、L3-3 で `seed_demo_data` の 1 つを debug の `cargo run` で `--help` まで 1 回見るだけ（`generate_bindings`・`generate_traceability` は CI の Linux で回り、Windows native では見ない。`generate_bindings` は lib の `export_specta_bindings` の `collect_commands!` で command の code まで引くので、Windows で止まる見込みは `seed_demo_data` より高い。L3-3 が FAIL して manifest を入れれば dev-tools の bin の全部に効く）。自動の test は無い（CI に Windows の build が無い）。
- 移した bin は doc-consistency の R0・R1 の走査から外れる（`scripts` を変えない: packet の AC7）。R0 の除外 `generate_traceability\.rs` は空振りになり、scripts を触る次の lane で R1 の走査に dev-tools を足し、その除外を消す（backlog）。
