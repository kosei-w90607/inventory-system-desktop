# Plan Packet: 開発用の bin を MSI から外す（導入の前の関門 5）

wave に属さない単独の lane。導入の前の関門 5（[Plans の導入の前の関門](../Plans.md#導入の前の関門)）と [backlog](../backlog.md) の「初回の導入の前に開発用の bin を bundle から外す」を扱う。owner の決定は repo 外の回答台帳 TD-417（2026-10-24: 関門 5 にした）。出所は PR #191 の Final Review の Claude 側 P3（[MSI の固定の packet](../archive/plans/2026-10-23-msi-fix.md) の Review Response）。外し方の決定は [decision-log](../decision-log.md) D-137（本 commit）。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票と design の段。実装の Writer は Coordinator が発注で決める）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5（Claude 側、owner の決定 2026-10-24）+ Codex（GPT-6.1 Sol 既定）
- Final Review Minimum: 2
- Human Gate: ready,merge,manual
- Branch: agent/dev-bins-out-of-msi

遷移の記録:

1. kickoff → spec-check（2026-10-24、Writer、本 commit）: Coordinator の発注（TD-417）を Scope にし、Risk を R3・Final Review Minimum 2 と記録した（下の Risk）。
2. spec-check → design（2026-10-24、Writer、本 commit）: 外し方は crate の形（`src-tauri/Cargo.toml`）と gate が build する範囲を決める durable な選択で、正本が無い。decision-log に置く（`docs/DEV_WORKFLOW.md` Design artifact selection の「Durable cross-cutting choice, workflow gate change」の行）。tauri-cli と cargo の振舞いを Contract Probe P1〜P5 で確かめた。
3. design → plan-draft（2026-10-24、Writer、本 commit）: 外し方を D-137 として decision-log に置いた（下の「本 commit で変えた正本」）。owner に聞く判断事項は無い（下の「owner の判断事項」）。未確認の外部前提は P6（実物の build で開発用の bin が bundle に入らない）で、plan-approved の前に owner の手の要らない Linux の deb の build で確かめる。plan-gate へは Coordinator が進める。
4. plan-draft → plan-gate（2026-10-24、Coordinator、本 commit）: owner の判断事項は無い（外し方は技術の選択で、製品の振舞いは変わらない）。packet と Matrix が揃い commit されている。Contract Probe P6（Linux の deb の build で開発用の bin が bundle に入らないことの実物の確かめ）は plan-approved の前に Coordinator が行う。Plan Review round 1（fresh Opus 5.5 + Codex）に出す。
5. plan-gate のまま是正（round 1、2026-10-24、Coordinator、本 commit）: round 1 は Claude 側 fresh Opus 5.5 だけ（Codex は owner の席外しで起動できず、`docs/AGENT_OPERATING_MANUAL.md` §3.3 の Codex を使えない間の扱い〈SD 直読みの lane の round 1 の先例〉で Claude 側だけで進めた）。reject を起草役が `0c324191` で直した（下の Review Response）。設計の方向は変えないので plan-gate に留め、round 2（fresh Opus 5.5 + Codex）で再 review する。
6. plan-gate のまま是正（round 2、2026-10-24、Coordinator、本 commit）: round 2 の是正（Review Response 参照）と Contract Probe P6 の実測の記録。設計の方向は変えないので plan-gate に留め、round 3（Plan Review round の天井）で再 review する。

本 commit で変えた正本（plan-first）:

- `docs/decision-log.md` に D-137 を足した: 3 つの bin を workspace の member `src-tauri/dev-tools/` へ移し `default-members` に入れる、`default-run` を残して command の形を変えない、generator の repo の root の求め方、test で固定すること。Why・棄却案（`required-features`・examples・Tauri の設定・`-p`・消す）・Guarantee range・Compatibility（D-099 (D10)・D-132・dev-tools の bin が受けない Windows の resource）・Revisit（tauri-cli を上げるとき）。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定。L3 の見込みは 20 分ほど〈build の 1 行と導入の操作を貼り、入った folder の一覧を見て起動し、開発用の bin を 1 つ debug の `cargo run` で `--help` まで動かす。build の待ちは数えない〉。未実測）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（2026-10-24。TD-417 は lane を選ぶ前の決定で本 lane に数えない） | 3（L3 1〈L3-1〜L3-3 を同じ回で〉、Ready 1、merge 1） | 3（L3 の 2 回目 1〈L3-1 の FAIL、または L3-3 の FAIL の後の是正の確かめ直し〉、実装の head の AC11 が外れたときの owner escalation 1〈外し方の変更と天井の改定を同じ 1 回で諮る〉、Plan Review の天井の disposition 1） | 6 = 0 + 3 + 3 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。L3 は Claude Code の sandbox から Windows の PowerShell を呼べないので、Coordinator が貼り付ける command の一覧を返答の本文に inline で渡し、owner は貼って PASS / FAIL と見えた名を返す（CLAUDE.md の D-127 の項）。

## Risk

Risk: R3

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R2 と R3 の迷いの規則の「workflow gate」に当たる: 変更は CI・pre-push・local-ci の command を変えないが、それらの command が build・test・lint する crate の形（`src-tauri/Cargo.toml` の workspace）を変える。`default-members` を誤ると、`cargo test` が generator の test を黙って回さなくなり、clippy が移した file を見なくなる（gate の合否が見えないまま弱まる。`cargo fmt --check` は `default-members` に依らず workspace の member を全部見るので弱まらない: Contract Probe P3）。同じ規則の「data safety boundary」にも当たる: 外す目的は、店の PC に開発用の bin が置かれる経路を消すこと。`seed_demo_data.exe` が置かれると、作業フォルダーの `inventory.db` が次の起動で取り込まれる経路（[22 §12](../function-design/22-mnt-migration.md)）ができる（今の版で 3 つのどれが入るかは列挙の順に依る: Contract Probe P1）。管理者が MSI を入れる流れ（[手順書](../msi-distribution-runbook.md) の流れ 2）の中身も変わる。

R4 でない理由: データの削除・復元・実データの露出・不可逆な git の操作を含まない。DB・migration・command の wire・画面を変えない。

この変更でどれかの required gate の green / red が変わるか: 変えない設計（command と required の名前は同じで、移した bin とその test を今までどおり含む。AC5・AC6・AC7 で確かめる）。classifier: 予定の file を `bash scripts/ci/classify-changes.sh --files-from-stdin` に通すと、code と手順書の file だけでは `workflow=false`、`docs/project-profile.md`（S2 で `src-tauri/src/bin/` の path を直す）が `workflow=true` にする（2026-10-24 に実行。出力は下の Contract Probe P7）。`docs/DEV_WORKFLOW.md` Workflow State の「workflow gate changes (classifier `workflow=true`) require 2」と、crate の形が全ての Rust の gate に掛かることから、Final Review Minimum 2。

並走: 本 lane は helper・checker・gate の command を変えないが、全ての Rust の gate が build する crate の形を変える。crate の形（`src-tauri/Cargo.toml` の bin・workspace・package の節、`src-tauri/Cargo.lock`、`src-tauri/src/bin/`、generator）を変える lane とは直列にする。2026-10-24 の open な PR（#202・#198・#197・#196・#194・#193・#190・#188・#172）のうち、#172 が `src-tauri/Cargo.toml` の windows-sys の features の 1 行を変えるが、crate の形は変えない（下の Scope の「並走との重なり」）。

## Goal

Goal Invariant:

### 最小完了条件

- 開発用の Windows で作った MSI を入れると、入った folder（`C:\Program Files\在庫管理システム\`）の実行 file は main の 1 つだけで、`generate_bindings.exe`・`generate_traceability.exe`・`seed_demo_data.exe` が無い。入れたアプリは今までどおり起動する（L3）。
- 開発者・CI・script・docs の `cargo run --bin generate_bindings` / `generate_traceability` / `seed_demo_data` の呼び出しは、書き換えずに今までどおり動く。
- `cargo test`・clippy・fmt の gate は、移した 3 つの bin とその test を今までどおり含む。
- 外し方と理由が D-137 にあり、tauri の crate に開発用の bin を戻すと test が赤になる。

### 失敗定義

- MSI（または同じ binary の一覧を使う Linux の deb）に開発用の bin のどれかが入る。
- MSI が build できない、または入れたアプリが起動しない。
- `cargo run --bin <開発用の bin>` が CI・pre-push・local-ci・手順書のどこかで失敗する。`npm run tauri dev` が main を起動しない。
- generator の test が `cargo test` で回らなくなる、clippy・fmt が移した file を見なくなる（gate が黙って弱まる）。
- `generate_traceability` が repo の root を取り違え、`90-traceability.md` の再生成や `--check` の結果が変わる。

### 非目的

- 開発用の bin の中身・CLI の引数・出力の変更。
- 開発用の PC の `src-tauri/target/` の掃除、前の MSI（PR #191 の版）で開発用の Windows に既に入っている開発用の exe の扱い（店の PC は初回から本 lane の後の版で入る）。
- tauri-cli・tauri の版の更新。CI に Windows の build を足すこと。
- 履歴の文書（`docs/archive/**`・`docs/research/**`・decision-log の過去の D・`docs/DEV_SETUP_CHECKLIST.md` の完了の記録）の path の書き換え。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更（管理者が作って入れる MSI の中身と、開発者・CI が開発用の bin を呼ぶ列を決める）なので、列を置く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 開発用の Windows の clone、配布する commit | 管理者が手順書の流れ 1 で `npm run tauri build` | `bundle\msi\` に MSI が 1 つ（D-132 のまま） | MSI の SHA-256 を配布の記録へ | P6（Linux の deb で代わりに確かめた）、L3-1 |
| 店の PC にアプリが無い | 管理者が MSI を入れる（流れ 2） | 入った folder の実行 file は main の 1 つだけ。スタートメニューから起動できる | 流れ 2 の手順 3〜5 | L3-1・L3-2 |
| 開発者が画面を確かめる | `npm run tauri dev` | 今までどおり main が起動する（tauri-cli は `--bin` の無い `cargo run` を打ち、`default-run` が main を選ぶ） | — | P3、T2 |
| 開発者が Rust の DTO を変えた | `cd src-tauri && cargo run --bin generate_bindings` | 今までどおり `src/lib/bindings.ts` が再生成される | CI の drift check が通る | P3 |
| push する | pre-push が `cargo run --bin generate_traceability -- --check`、CI が fmt・clippy・test・bindings・traceability の段を回す | 今までどおりの段が同じ名前で回り、移した bin とその test を含む | `Merge gate` | P3、AC5〜AC7 |
| L3 の準備 | 管理者・Coordinator が手順書の予行演習の準備で `cargo run --bin seed_demo_data -- --db …`（Linux から、または開発用の Windows の PowerShell で） | 今までどおり試験用のデータが入る | — | AC6（Linux）、L3-3（Windows の debug の `cargo run`） |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項

無い。外し方は技術の選択で、下の Contract Probe の比較と D-137 の推奨で足りる（owner に技術の正しさの承認を求めない）。製品の振舞いで owner が決めることは無い: 店の PC から開発用の bin が無くなるだけで、店主・管理者の操作・画面・データは変わらない。L3 を置くことは Goal の確かめに要るので起草役の判断で置いた（下の Test Plan）。

店主に聞く事項: 無い。

## Scope

### 外し方の比較（D-137 の根拠。数は 2026-10-24 の本 worktree で数えた。command と出力は Contract Probe）

| 案 | MSI から外れるか | `cargo run --bin` の形 | 書き換える呼び出し | gate の command | 黙って弱まる所 |
|---|---|---|---|---|---|
| (a) workspace の member `src-tauri/dev-tools/` へ移し `default-members` に入れる（**推奨・D-137**） | 外れる（P1: tauri-cli は workspace の他の member を見ない） | 変わらない（P3） | 0（path を書く comment・文書だけ直す: S2 の表） | 変わらない | 無い（`cargo test`・clippy・fmt が member を含む。P3。`default-members` の崩れは AC4 の test が止める） |
| (a') workspace の member にして `default-members` に入れない | 外れる | `-p inventory-system-dev-tools` が要る（P3 の [1]） | archive と research を除く live の呼び出し全部（P8） | 変わる（CI・pre-push・local-ci） | `cargo test` が member の test を回さず、clippy が member を見ない（`cargo fmt` は member を見る。P3） |
| (b0) `src/bin/` に置いたまま `required-features` | 外れない（P1: tauri-cli が `src/bin/` を読み直して足し、MSI が build されない file を引く） | `--features` が要る | live の呼び出し全部 | 変わる | — |
| (b) `src/bin/` の外へ移し `[[bin]]` + `required-features` | 外れる（P1） | `--features dev-tools` が要る（P5） | live の呼び出し全部と `cargo test` の行 | 変わる | `cargo test` に付け忘れると generator の test が回らない（P5） |
| (c) Tauri の設定で bundle する binary を絞る | 設定が無い（P1・P2）。WiX の template の差し替えは `main.wxs` の写しを持ち続ける | 変わらない | 0 | 変わらない | template の写しが tauri の更新から外れる |
| (d) `src-tauri/examples/` へ移す | 外れる（P1: examples を見ない） | `--example` に変わる（P4） | live の呼び出し全部 | 変わる | `[[example]] test = true` が無いと generator の test が回らない（P4） |

(a) の費用: crate の manifest が 1 つ増え、`Cargo.lock` に dev-tools の package の行が増え（外部の crate は増えない）、build の量は変わらない: `tauri build` は今も tauri-cli 2.11.1 の `build_options` が足す `--bins` で 3 つの開発用の bin を release で build しており（P6 の `--verbose` の `cargo build --bins --features tauri/custom-protocol --release`）、移した後は package が変わるだけ（bundle には入らない）。dev-tools の bin は tauri の crate の build script が入れる Windows の resource（icon・版の情報・Common Controls v6 を求める manifest）を受けない（D-137 の Compatibility。Windows で debug の `cargo run` から起動するかを L3-3 で確かめ、起動しなければ manifest を入れる）。

### S1: design（本 commit で済み）

上の「本 commit で変えた正本」。

### S2: 実装（plan-approved の後）

| file | 変更 |
|---|---|
| `src-tauri/src/bin/generate_bindings.rs`・`generate_traceability.rs`・`seed_demo_data.rs` | `src-tauri/dev-tools/src/bin/` へ同じ名で移す（`git mv`）。中身は変えない。ただし `generate_traceability.rs` の repo の root の式（`PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..")`）を 2 つ上（`join("../..")` か `.parent()` を 2 回）にし、冒頭の doc comment の「CARGO_MANIFEST_DIR + 親ディレクトリ」を合わせる（D-137 (3)）。出力の文（`cd src-tauri && cargo run --bin generate_traceability`）は変えない |
| `src-tauri/dev-tools/Cargo.toml`（新設） | `[package] name = "inventory-system-dev-tools"`・`version = "0.1.0"`・`edition = "2021"`・`publish = false`。`[dependencies]` に `inventory-system-tauri-scaffold = { path = ".." }`・`regex = "1"`、`[dev-dependencies]` に `tempfile = "3"`（どれも `src-tauri/Cargo.toml` と同じ版の指定で、`Cargo.lock` の外部の crate を増やさない） |
| `src-tauri/Cargo.toml` | `[workspace]`（`members = ["dev-tools"]`、`default-members = [".", "dev-tools"]`）を足す。`default-run = "inventory-system-tauri-scaffold"` は残す（D-137 (2)）。その上の comment（「`src/bin/generate_bindings.rs` 追加で bin が 2 つ」）を今の理由に直す: `default-members` に 2 つの package があり、`--bin` の無い `cargo run`（`npm run tauri dev` で tauri-cli が打つ）が両方の package の bin を候補にして止まるので、main を明示する（P3） |
| `src-tauri/Cargo.lock` | `cargo` が書く dev-tools の package の行だけ（AC8） |
| `src-tauri/tests/bundle_identity_test.rs` | D-137 の test を 2 本足す: `bundled_binaries_are_main_only_d137`（`CARGO_MANIFEST_DIR/src/bin` が無い、`src/main.rs` がある、`Cargo.toml` に `[[bin]]` の行が無い）と `default_members_and_default_run_d137`（`Cargo.toml` の `default-members` に `"dev-tools"` があり、`default-run` が `"inventory-system-tauri-scaffold"`）。失敗の文で D-137 を引き、`src/bin/` か `[[bin]]` の bin は MSI に入って店の PC へ配られること、`default-members` から外すと `cargo run --bin` と `cargo test` が移した bin を見なくなること、`default-run` を外すと `npm run tauri dev` の `cargo run` が止まることを名指す。file 冒頭の doc comment に D-137 を足す |
| `src-tauri/src/lib.rs` | comment の 3 か所（`pub mod db` の上の「dev bin (src/bin/seed_demo_data.rs)」、`pub mod seed_demo` の上の「src/bin/seed_demo_data.rs と」、`export_specta_bindings` の doc の「`bin/generate_bindings` 経由」）を新しい path（`dev-tools` の crate）に。code は変えない |
| `src-tauri/src/seed_demo.rs` | 冒頭の doc comment の `src/bin/seed_demo_data.rs` を新しい path に |
| `src-tauri/tests/design_compliance_test.rs` | allowlist の comment の `src/bin/seed_demo_data.rs` を新しい path に（allowlist の中身は変えない） |
| `src-tauri/tests/import_internal_contract_test.rs` | `test_active_sales_import_vocabulary_sweep_i_g1`（REQ-401 の I-G1）の走査の target `["src-tauri/src", "src-tauri/tests", "src"]`（`:313`）に `"src-tauri/dev-tools/src"` を足す（test の file だけ）。移した bin を旧い取込みの契約の語の sweep に残す（P10、Matrix の T10）。3 つの bin の移動と同じ commit で足す（走査の `sweep_dir_for_tokens` は target の dir が無いと `read_dir` で panic する: 同 file の `sweep_dir_for_tokens` を実読） |
| `tests/fixtures/z004/README.md` | `seed_demo_data` の source を引く 2 か所（`--db` の受付と `confirm_reset`）の path を新しい path にし、行番号の引用を symbol に替える（D-125）。`cargo run --manifest-path src-tauri/Cargo.toml --bin seed_demo_data` の 3 行は変えない |
| `docs/project-profile.md` | 「Demo seed data generated by `src-tauri/src/bin/seed_demo_data.rs`.」の path を新しい path に |
| `docs/msi-distribution-runbook.md` | 「今の事実」の表に 1 行を足す: 「MSI に入る実行 file」= main の 1 つだけ。開発用の bin は workspace の member `src-tauri/dev-tools` にあり、tauri-bundler は tauri の crate の bin だけを入れる（D-137）。出所の列は tauri-cli 2.11.1 の `get_binaries` と tauri-bundler の `generate_binaries_data`。確かめた日は L3 の後の closeout で足す |

S2 の終わりに `cd src-tauri && cargo check --release` を通す（`docs/DEV_WORKFLOW.md` Implementation Rules、L3 の前の Writer の完了条件。AC9）。

### S3: L3（下の Test Plan）

### closeout（merge の後）

- 手順書の「今の事実」の「MSI に入る実行 file」の行に L3 で確かめた日を足す。
- `docs/backlog.md` の「初回の導入の前に開発用の bin を bundle から外す」を閉じる。`docs/Plans.md` の関門 5 を済みにする。

### 書き換えない呼び出し（D-137 (2)。2026-10-24 の Contract Probe P8 の一覧）

`.github/workflows/ci.yml`・`scripts/local-ci.sh`・`scripts/pre-push.sh`・`scripts/tests/pre-push.test.sh`・`.gitignore` の comment・`docs/DEV_WORKFLOW.md`・`docs/ci.md`・`docs/quality/review-checklist.md`・`docs/templates/plan-packet.md`・`docs/FUNCTION_DESIGN.md`・`docs/UI_TECH_STACK.md`・`docs/spec/requirements.md`・`docs/DEV_SETUP_CHECKLIST.md`・`docs/msi-distribution-runbook.md` の予行演習の準備・`docs/function-design/42`・`78`・`90-traceability.md`（生成物）・`tests/fixtures/z004/README.md` の 3 行・移す bin の中の usage の文。どれも `cargo run --bin <name>` の形で、(a) の後も同じ command で動く（P3）。

### 並走との重なり（予定の path の突き合わせ）

2026-10-24 に、本 lane の予定の path（`docs/Plans.md`・`docs/backlog.md`・`docs/decision-log.md`・`docs/msi-distribution-runbook.md`・`docs/project-profile.md`・`src-tauri/Cargo.lock`・`src-tauri/Cargo.toml`・`src-tauri/src/bin/` の 3 file・`src-tauri/src/lib.rs`・`src-tauri/src/seed_demo.rs`・`src-tauri/tests/bundle_identity_test.rs`・`src-tauri/tests/design_compliance_test.rs`・`src-tauri/tests/import_internal_contract_test.rs`・`tests/fixtures/z004/README.md`）と、open な各 PR の `git diff --name-only --no-renames origin/main...origin/agent/{branch}` を `comm -12` で突き合わせた（`src-tauri/dev-tools/` は新設で、どの branch にも無い）:

| 相手 | 共有する path | 行・節の所有 |
|---|---|---|
| PR #188（`agent/stocktake-count-runtime-b`） | `docs/Plans.md`・`docs/decision-log.md`・`src-tauri/src/lib.rs`・`src-tauri/src/seed_demo.rs`・`src-tauri/tests/import_internal_contract_test.rs`・`tests/fixtures/z004/README.md` | 本 lane は lib.rs の comment 3 か所（`pub mod db`・`pub mod seed_demo` の上と `export_specta_bindings` の doc）・seed_demo.rs の冒頭の doc・I-G1 の sweep の target の 1 行（`:313`）・README の `seed_demo_data` の source を引く 2 か所だけ。#188 の hunk は lib.rs の `show_pre_window_fatal` 以降・seed_demo.rs の `delete_all`・import_internal_contract_test.rs の `test_import_internal_contract_req401_is_minimal`（120〜132 行）・README の冒頭と test の節で、行は重ならない（`git diff -U0` の hunk の見出し、2026-10-24）。decision-log は末尾への追記どうし、Plans は本 lane は closeout だけ |
| PR #190（`agent/backup-offsite-runtime`） | `docs/Plans.md`・`docs/backlog.md`・`docs/msi-distribution-runbook.md` | 手順書: 本 lane は「今の事実」の表に 1 行を足すだけ。backlog・Plans は closeout だけ |
| PR #198（`agent/oplog-retention`） | `docs/backlog.md`・`docs/decision-log.md` | decision-log は末尾への追記どうし（merge の順で両方を残す）。backlog は closeout だけ |
| PR #194（`agent/backup-offsite-runtime-b`） | `docs/decision-log.md` | 同上 |
| PR #172（`agent/sd-direct-read-runtime`） | `docs/backlog.md`・`src-tauri/Cargo.toml`・`src-tauri/src/lib.rs`・`src-tauri/tests/design_compliance_test.rs` | Cargo.toml: #172 は `[target.'cfg(windows)'.dependencies]` の windows-sys の features の 1 行だけで、本 lane の `default-run` の上の comment と末尾の `[workspace]` の追記と行が重ならず、`Cargo.lock` を変えない（`git diff --name-only` に無い）。lib.rs: #172 の hunk は `export_bindings_to` の後・`bindings_generation_tests`・`run()` で、本 lane の comment 3 か所と重ならない。design_compliance_test.rs: #172 の hunk は `build_doc_to_modules_map` の中で、本 lane の allowlist の comment と重ならない（`git diff -U0` の hunk の見出し、2026-10-24、#172 の head `8fd5b875`）。backlog は closeout だけ |
| PR #196（`agent/initial-load-procedure`） | `docs/backlog.md` | closeout だけ |
| PR #197・PR #193・PR #202 | 無い | — |

crate の形（`src-tauri/Cargo.toml` の bin・workspace・package の節、`src-tauri/Cargo.lock`、`src-tauri/src/bin/`、generator）を変える open な PR は無い。並走の lane が `cargo run --bin <開発用の bin>` の呼び出しを足しても、(a) の後もそのまま動く。

## Non-scope

- 上の Goal の非目的の全部。
- 書き換えない呼び出し（上の表）。
- `docs/DEV_SETUP_CHECKLIST.md` の 7-9 の完了の記録・`docs/research/**`・decision-log の D-099 (D10) の path（履歴。D-099 (D10) の分類は D-137 の Compatibility のとおり変わらない）。
- doc-consistency の R0・R1 の走査の範囲（`scripts` を変えない: AC7。移した bin が走査から外れる件は Contract Probe P10 と [backlog](../backlog.md) の項目）。

## Acceptance Criteria

baseline は 2026-10-24 に本 worktree（`origin/main` `843c4938`）で、各 AC の command を逐語で実行した出力。

- AC1: `ls src-tauri/src/bin` が `No such file or directory` で終わる（exit 2）。baseline:
  ```
  $ ls src-tauri/src/bin
  generate_bindings.rs
  generate_traceability.rs
  seed_demo_data.rs
  exit=0
  ```
- AC2: `ls src-tauri/dev-tools/src/bin` が `generate_bindings.rs`・`generate_traceability.rs`・`seed_demo_data.rs` の 3 つ。`git diff -M --stat origin/main` で 3 つとも rename（`generate_traceability.rs` は repo の root の式と doc comment の差分だけ）。baseline: `ls src-tauri/dev-tools` が `"src-tauri/dev-tools": No such file or directory (os error 2)`、exit 2。
- AC3: `rg -n '^\[\[bin\]\]' src-tauri/Cargo.toml` が hit なし（exit 1）、`rg -n '^default-members = \[".", "dev-tools"\]' src-tauri/Cargo.toml` が 1 行。baseline: `rg -n '^\[\[bin\]\]|^\[workspace\]|^default-members|^members' src-tauri/Cargo.toml` が hit なしで exit 1。
- AC4: `cd src-tauri && cargo test --test bundle_identity_test` が PASS（D-132 の 4 本と D-137 の 2 本）。Matrix の T1・T2 の mutation がそれぞれ red。`rg -n '^default-run = "inventory-system-tauri-scaffold"$' src-tauri/Cargo.toml` が 1 行（baseline: 同じ command が `9:default-run = "inventory-system-tauri-scaffold"`、exit 0）。
- AC5: 移した bin とその test が gate に残る: `cd src-tauri && cargo test --bin generate_traceability -- --list` の test の名の集合が、移す前（Plan Commit の版で Writer が実装の前に取る）と同じ。`cd src-tauri && cargo test` の出力に dev-tools の package の `Running unittests src/bin/generate_traceability.rs` の行があり、その結果が ok。Matrix の T3（dev-tools の file に fmt の違反を入れると `cargo fmt --check` が red）と T4（clippy の違反で `cargo clippy --all-targets --all-features -- -D warnings` が red）、T10（dev-tools の bin に旧い取込みの契約の語を入れると I-G1 の sweep が red）。
- AC6: command の形が変わらない。どれも repo の root で打つ（`git diff` の pathspec は cwd から解くので、`src-tauri` で打つと存在しない path になり常に exit 0 になる）: `cargo run --manifest-path src-tauri/Cargo.toml --bin seed_demo_data -- --db "$TMPDIR/seed-ac6.db"` が exit 0。`(cd src-tauri && cargo run --bin generate_bindings) && git diff --exit-code -- src/lib/bindings.ts` が exit 0。`(cd src-tauri && cargo run --bin generate_traceability) && git diff --exit-code -- docs/function-design/90-traceability.md` が exit 0、`(cd src-tauri && cargo run --bin generate_traceability -- --check)` が exit 0（T1・T2・T4 の ERROR 0。T3 の WARN は前と同じ）。
- AC7: gate の command を変えない: `git diff --exit-code origin/main -- .github scripts .gitignore` が exit 0。
- AC8: `git diff origin/main -- src-tauri/Cargo.lock` の追加が `name = "inventory-system-dev-tools"` の `[[package]]` の塊だけで、他の package の行の増減が無い。
- AC9: `cd src-tauri && cargo check --release` が exit 0（L3 の前）。
- AC10: live の path の引用: 本 packet の Contract Probe P9 の command（新しい path `dev-tools/src/bin/` を含む行を `rg -v` で除く）の hit が次の所だけ: `docs/DEV_SETUP_CHECKLIST.md` の 7-9 の完了の記録、decision-log の D-099 (D10) と D-137 の Context・Decision、`docs/backlog.md` の本 lane の項目（closeout で閉じる）、`src-tauri/tests/bundle_identity_test.rs` の D-137 の test（`src/bin/` が無いことを確かめる所と失敗の文）。baseline は P9 の 9 file・14 行（本 branch の `864bd013` で実行。D-137 の 2 行を含む。S2 の表の 6 file・9 行がその差。残る 5 行は CHECKLIST 1・backlog 1・decision-log 3）。
- AC11: Linux の deb の中身（P6 の command を実装の head で）: `usr/bin/` に main の 1 つだけがあり、`generate_bindings`・`generate_traceability`・`seed_demo_data` が無い。
- AC12: `python3 scripts/pr-gate.py status --pr {PR}` が示す manual の record に L3-1・L3-2・L3-3 の `PASS`。L3-3 が FAIL なら、D-137 の Compatibility の是正（dev-tools に manifest を入れる。外し方は変えない）を本 lane に足し、その是正の head で L3-1〜L3-3 を確かめ直した `PASS`（L3 の 2 回目）。
- AC13: `bash scripts/doc-consistency-check.sh` と `--target plan docs/plans/2026-10-24-dev-bins-out-of-msi.md` が ERROR 0、`bash scripts/check-workflow-git.sh` が exit 0。

## Design Readiness

- 引用する設計正本（節まで）: [decision-log](../decision-log.md) D-137（本 commit）、D-132（MSI の 4 つの値。変えない）、D-099 (D10)（生成器の分類）。[手順書](../msi-distribution-runbook.md) の「今の事実」と流れ 1・2、予行演習の準備の seed の段。[22 §12](../function-design/22-mnt-migration.md)（作業フォルダーの DB の取込み。外す理由）。`docs/DEV_WORKFLOW.md` Verification Gates（gate の command。変えない）。
- 必要な設計成果物: Durable cross-cutting choice / workflow gate change → D-137（本 commit で済み）。手順書の「今の事実」の 1 行は S2（code の形の事実なので code と同じ commit）。BIZ・CMD・DB・画面・CSV は変えない（該当の行なし）。
- plan にしかない durable な判断の昇格先: 外し方・command の形・test の固定 → D-137。L3 の手順 → 本 packet（lane の運用で durable でない）。
- 前提・制約と、延期した design gap の follow-up: P6（実物の build で開発用の bin が bundle に入らない）は 2026-10-24 に Linux の deb で確かめた（成立。Contract Probe P6）。Windows の MSI そのものと dev-tools の bin の Windows での起動は L3。`src-tauri/src` だけを走査する doc-consistency の R0・R1 の範囲は backlog（P10）。tauri-cli を上げたときの再確認は D-137 の Revisit。
- 絶対保証の自己点検: 「MSI に入る実行 file は main の 1 つだけ」は tauri-cli 2.11.1 の `get_binaries` に依り、例外は (1) tauri の crate に `src/bin/` か main 以外の `[[bin]]` を誰かが戻す（AC4 の test が止める）、(2) `bundle.externalBin` を足す（今は無い。足すのは別の決定）、(3) tauri-cli を上げて `get_binaries` が workspace の member を読む（D-137 の Revisit。test は止めない）。「command の形が変わらない」は `default-members` と `default-run` に依り、例外は `-p` で別の package を選ぶ呼び出し（今は無い。P8）と、`default-members` か `default-run` を外す変更（AC4 の test が止める）。
- 判定: ready。外し方は P1〜P5 で決まり、P6 で実物の deb を owner の手なしで確かめた。実装の head の AC11 が外れたら（deb に開発用の bin が残る、build が通らない）、design に戻って比較の表の次の案を採り、外し方の変更を owner escalation の 1 回で諮る（Owner Effort Budget の予備）。

## Registration / Generation Obligations

- Tauri command・function-design doc・REQ・route・画面: 該当なし。
- 生成物: bindings（`src/lib/bindings.ts`）と traceability（`docs/function-design/90-traceability.md`）は変わらないことを AC6 で確かめる（generator の場所が変わるので、再生成の結果が同じことを義務にする）。generator は `src-tauri/src`・`src-tauri/tests` の Rust の file から行頭の `fn test_…` の名だけを集め（`generate_traceability.rs` の `collect` の走査の root と、`rust_test_fn_names` の式 `(?m)^\s*fn\s+(test_[a-z0-9_]+)\s*\(`）、その名の `_reqNNN` を数える。3 つの bin にこの形の fn は無い（`rg -n '^\s*fn\s+test_[a-z0-9_]+\s*\(' src-tauri/src/bin/` が hit なしで exit 1、2026-10-24。bin の unit test は `fn test_` で始まらない）ので、bin が `src-tauri/src` の外へ出ても traceability の結果は変わらない見込み（AC6 で確かめる）。
- 新しい crate: `src-tauri/Cargo.toml` の `members` と `default-members` への登録（S2）。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 当たる: bundle する binary を決めるのは外部の道具（tauri-cli）の規則で、アプリの契約は「店の PC に入る実行 file は main だけ」 | D-137 |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 当たる: 事実 = P1〜P10（source・toy の probe・実物の deb・repo の実測）、未確認 = L3（Windows の MSI と dev-tools の bin の起動）。決定 = D-137 | Contract Probe、D-137 |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 当たる（狭い）: 初回の導入だけを見る。前の MSI の上への更新で開発用の exe が消えるかは非目的（店の PC は初回から新しい版） | — |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 当たる: 管理者の流れ 1・2 は手順が変わらず、入る file が減るだけ。店主の操作は変わらない | Ordinary Operation |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 当たる: tauri-cli を上げたときに P1 を確かめ直す（D-137 の Revisit） | D-137 |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 当たる: 外す目的が 22 §12 の取込みの経路を消すこと。L3 は file の名の一覧と起動だけで、データを使わない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 当たらない: 業務の数・帳票を変えない | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 当たる: MSI は Windows でしか作れず CI に Windows の build は無い（手順書の「今の事実」）。入った folder の中身と起動は L3-1・L3-2 | Test Plan |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 当たる: crate の形は `src-tauri/Cargo.toml` と AC4 の test で固定する。tauri-cli の版は `package-lock.json` の `@tauri-apps/cli` 2.11.1 が pin する。CI に Windows の build を足すのは defer（非目的） | — |

## Boundary / Wire Contract

- producer: `src-tauri/Cargo.toml`（tauri の crate の bin の構成と `[workspace]`）、`src-tauri/dev-tools/Cargo.toml`。
- consumer: tauri-cli 2.11.1 の `get_binaries`（bundle の binary の一覧）、tauri-bundler の MSI（main 以外を全部入れる）と deb（全部入れる）、cargo の package の選び方（`default-members`）、CI・pre-push・local-ci の command。
- wire type: Cargo の manifest（TOML）。
- internal type: tauri-bundler の `Settings::binaries()`。
- precision/range: 該当なし。
- round-trip path: manifest → `tauri build` → MSI → 入った folder の file の一覧。manifest → `cargo run --bin` / `cargo test`。
- invalid input: tauri の crate に `src/bin/` か `[[bin]]` を戻す変更、`default-members` から dev-tools を外す変更、`default-run` を外す変更は AC4 の test が拒む。
- compatibility: 呼び出しの command は同じ（D-137 (2)）。`Cargo.lock` に dev-tools の行が増える。`bundle.externalBin` は使わない。

## Test Plan

Test Design Matrix: [2026-10-24-dev-bins-out-of-msi](test-matrices/2026-10-24-dev-bins-out-of-msi.md)。

- targeted tests: `cd src-tauri && cargo test --test bundle_identity_test`、`cargo test --bin generate_traceability`、`cargo test --test import_internal_contract_test test_active_sales_import_vocabulary_sweep_i_g1`。
- negative tests: Matrix の T1〜T4・T10 の mutation。
- compatibility checks: AC6（3 つの `cargo run --bin` と生成物が変わらない）、AC7（gate の command）。
- data safety checks: L3 は file の名と起動だけ。開発のデータの folder は触らない（下の L3 の前提）。
- main wiring/integration checks: `cargo check --release`（AC9）、Linux の deb（AC11、P6）、Windows の `npm run tauri build`（L3-1）。

### L3（Windows の実機）

L3 Eligibility: (1) MSI は Windows でしか作れず、入った folder の中身は Windows の実機でしか見られない。dev-tools の bin が Windows の resource 無しで起動するかも Windows でしか見られない（L3-3）。(2) 新しい道具は要らない（手順書の流れ 1・2 と PowerShell の `Get-ChildItem`）。(3) 故障を注入する手順は無い。

到達経路と用意（Coordinator が用意し、owner に貼り付ける command の一覧を返答の本文に inline で渡す。Claude Code の sandbox から Windows の PowerShell を呼べないので、build と導入は owner が貼る）:

1. 開発用の Windows の clone（手順書の流れ 1）で、train の先頭で最新の `origin/main` を取り込んだ PR の head を checkout し（D-124）、`git status --porcelain` が空で `Test-Path src-tauri\src\bin` が `False` であることを確かめ、`npm ci --ignore-scripts` の後、既にある `src-tauri\target\release\bundle\` を repo の外の日付の付いた folder へ丸ごと移す（前の build の MSI で合否を決めない。[MSI の固定の packet](../archive/plans/2026-10-23-msi-fix.md) の L3 の用意 1 と同じ形の、`-ErrorAction Stop` と build の後の `if (-not $? -or $LASTEXITCODE) { throw … }` を持つ 1 行）。`npm run tauri build` の後、`bundle\msi\` の MSI を同じ folder の下へ移して SHA-256 を控える。
2. 「設定 → アプリ」に「在庫管理システム」が入っていれば外す（アンインストールの後もデータの folder は残る。手順書の M7）。前の版の入った folder の開発用の exe を新しい版の結果に混ぜないため。
3. 依存する既知の backlog: 無い。開発のデータの folder（`%APPDATA%\com.inventory-system.desktop`）は触らない。L3-2 の起動は開発のデータの DB を開く（本 lane は migration を足さないので DB の版は変わらない）。

| ID | 画面・到達手順 | 観測できる合格基準 | merge の条件 |
|---|---|---|---|
| L3-1 | 用意 1 の MSI を入れ、PowerShell で `Get-ChildItem "C:\Program Files\在庫管理システム" -Recurse -File -Filter *.exe \| Select-Object -ExpandProperty Name` を貼る | 出力が 1 行（main の実行 file）だけで、`generate_bindings.exe`・`generate_traceability.exe`・`seed_demo_data.exe` が無い。用意 1 の build がエラーで止まらずに MSI と SHA-256 を控えてある | はい |
| L3-2 | スタートメニューの「在庫管理システム」から起動する | アプリの窓が開き、ホームの画面が出る。見終わったら閉じる | はい |
| L3-3 | 用意 1 の clone の root で `cargo run --manifest-path src-tauri\Cargo.toml --bin seed_demo_data -- --help; "exit=$LASTEXITCODE"` を貼る（手順書の予行演習の準備・z004 の README の Windows の行と同じ debug の `cargo run` の形。debug の build が走る。`--help` は DB を開く前に使い方を出して終わる〈`seed_demo_data.rs` の `parse_args`〉） | 使い方の文が出て `exit=0`。Windows の loader のエラー（例「エントリ ポイントが見つかりません」、`STATUS_ENTRYPOINT_NOT_FOUND`）で止まらない（D-137 の Compatibility: dev-tools の bin は tauri-build の Windows の resource を受けない） | はい。FAIL なら D-137 の Compatibility の是正（dev-tools に manifest を入れる。外し方は変えない）を本 lane に足し、L3 を確かめ直して PASS するまで merge しない（AC12） |

順: 用意 1 → 用意 2 → L3-1 → L3-2 → L3-3。L3-1 が FAIL なら L3-2 を行わずに見えた名を控えて Coordinator に戻す（L3 の 2 回目。原因が外し方なら design に戻る）。L3-3 が FAIL なら出た文と exit を控えて Coordinator に戻す（是正の後に L3 の 2 回目）。

## Review Focus

- 外し方の比較（Scope の表）の事実と推奨: (a) が `default-members` で command の形を保ちつつ、gate を黙って弱めないか（P3・AC5）。
- generator の repo の root の式の変更（D-137 (3)）が、`90-traceability.md` の再生成・`--check`・generator の test（`TempDir` の root）を変えないか。
- P6（Linux の deb の build の実測）と AC11 が、MSI の確かめの代わりとして足りるか（deb と MSI が同じ `settings.binaries()` を使う。P2）。足りない所は L3 で見る。
- L3 の範囲（初回の導入だけ。前の MSI の上への更新は非目的）が店の PC の初回の導入に足りるか。
- この変更で不要になる記述・条件（D-127）: `src-tauri/Cargo.toml` の `default-run` の comment（理由が変わる。行は残す: S2 の表・P3）、P9 の hit の残す・直すの分け方。
- dev-tools の bin が tauri-build の Windows の resource を受けないこと（D-137 の Compatibility）を、L3-3（手順書と同じ debug の `cargo run`）の PASS を merge の条件にし、FAIL なら manifest の是正と確かめ直しを完了条件にする形で足りるか。
- `src-tauri/src` だけを走査する検査（P10）のうち、I-G1 の sweep を S2 で dev-tools へ広げ、doc-consistency の R0・R1 を backlog に送る分け方が足りるか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-137 (1) 開発用の bin は workspace の member、tauri の crate は main だけ | decision-log D-137 | S2 の移動・`src-tauri/Cargo.toml`・`dev-tools/Cargo.toml` | `bundle_identity_test::bundled_binaries_are_main_only_d137`（T1）、AC11 の deb | L3-1 |
| D-137 (2) command の形と gate の範囲を変えない | 同上、`docs/DEV_WORKFLOW.md` Verification Gates | S2 の `default-members` と `default-run` | `bundle_identity_test::default_members_and_default_run_d137`（T2）、AC5〜AC7、Matrix の T3・T4・T10 | L3-3（Windows で dev-tools の bin が debug の `cargo run` で起動する。merge の条件） |
| D-137 (3) generator の repo の root | 同上 | S2 の `generate_traceability.rs` の式 | generator の既存の test（`TempDir` の root）、AC6 の再生成と `--check` | 非対象 |
| D-137 (4) test で固定 | 同上 | S2 の `bundle_identity_test.rs` | Matrix の T1・T2 の mutation | — |
| D-132 (1)〜(5) | decision-log D-132 | 変えない | `bundle_identity_test` の既存の 4 本 | 非対象 |
| D-099 (D10) 生成器の分類 | decision-log D-099 | 変えない（`src-tauri/*` が dev-tools を含む） | P7 の classifier の実行 | 非対象 |
| 22 §12 作業フォルダーの DB の取込み | 22 §12 | 変えない（店の PC に `seed_demo_data.exe` が無くなり、その経路の入口が消える） | — | L3-1 |
| 手順書の「今の事実」・流れ 1・2・予行演習の seed | 手順書 | S2 で「今の事実」に 1 行。流れと seed の command は変えない | — | L3-1・L3-2 |

## Contract Probe

確認日はどれも 2026-10-24。toy の probe の script は repo の外（scratchpad）に置き、command と出力の要旨をここに書く。

- P1 tauri-cli 2.11.1 が bundle の binary をどう集めるか: [`crates/tauri-cli/src/interface/rust.rs`](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.1/crates/tauri-cli/src/interface/rust.rs) の `get_binaries` を読んだ（`~/.cargo/registry/src/*/tauri-bundler-*` は local に無い。tauri-cli は npm の `@tauri-apps/cli` `2.11.1`〈`package-lock.json`〉）→ tauri の crate の `cargo_settings.bin`（`required-features` が `options.features` に全部無い物は `continue` で飛ばし、記録しない）と `tauri_dir.join("src/bin")` の file の stem と `src/main.rs` だけを集める。`src/bin` の file（と `src/main.rs`）は、既に集めた binary と名が同じか `path.ends_with(bin.src_path().unwrap_or(&"".to_string()))` が真なら足さない。`src/bin` から足す binary は `BundleBinary::new` で path を持たず、空の path との `ends_with` は真になる（rustc `1.99.1` で `Path::new("/a/src/bin/x.rs").ends_with("")` が `true`）ので、`[[bin]]` の無い今の crate では `read_dir` の順の最初の 1 つだけが入り、`src/main.rs` も飛ばされて main は `default-run` の名で足される。P6 の実測（Linux の deb に開発用の bin が 1 つ）と合う。どの 1 つが入るか（Linux の deb で `generate_traceability`、PR #191 の Windows の MSI の記録に `generate_bindings.exe`）は列挙の順に依る見込みだが、Linux の `ls -f` の順（`generate_bindings` が先）と合わない理由は分かっていない。飛ばした `[[bin]]` は名も path も持ち込まないので、`required-features` の案でも `src/bin` の file は 1 つ入る。examples・workspace の他の member（file の監視にだけ使う）・`autobins` は見ず、bundle する binary を絞る設定は無い。desktop の build は `--bins` を渡す。
- P2 MSI と deb が何を入れるか: [`crates/tauri-bundler/src/bundle/windows/msi/mod.rs`](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.1/crates/tauri-bundler/src/bundle/windows/msi/mod.rs) の `generate_binaries_data` は `settings.binaries()` の `!bin.main()` の全部を MSI の file にし、他の条件で外さない（file の有無を確かめない）。[`crates/tauri-bundler/src/bundle/linux/debian.rs`](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.1/crates/tauri-bundler/src/bundle/linux/debian.rs) の `generate_data` は `settings.binaries()` の全部を `usr/bin` へ写す → deb の `usr/bin` は MSI と同じ一覧（main を含む）を映す。P6 の実測（Linux の deb に開発用の bin は `generate_traceability` の 1 つ）と PR #191 の L3 の記録（Windows の MSI の入った folder に `generate_bindings.exe`。他の 2 つの名は記録に無い。repo 外の L3 の結果の控え）は、どちらも P1 の「1 つだけ入る」筋と合う（どの 1 つかは確かめていない）。
- P3 cargo `1.99.1` の workspace（root が package、`members = ["dev-tools"]`）の toy: `default-members` 無しで root の dir から `cargo run --bin <member の bin>` は `error: no bin target named ... in default-run packages`（exit `101`）、`-p dev-tools` で動く（[1]・[2]）。`default-members = [".", "dev-tools"]` で、`cargo run --bin <member の bin>` が動き（`CARGO_MANIFEST_DIR` は member の dir）、`cargo run`（`--bin` 無し）は `default-run` の main を起動し（[5]）、`default-run` を外すと `` error: `cargo run` could not determine which binary to run `` で両方の package の bin を候補に挙げて止まり（同じ形の toy で再現）、`cargo test` が member の bin の unit test を回し、`cargo test --bin <member の bin> -- --list` が member の test を出し、`cargo clippy --all-targets --all-features -- -D warnings` が member だけに入れた `len_zero` で exit `101`、`cargo fmt --check` が member の file の `Diff in` を出し、`cargo build --release --bins` と `cargo check --release` が両方の package を build する。tauri-cli 2.11.1 の [`crates/tauri-cli/src/interface/rust/desktop.rs`](https://github.com/tauri-apps/tauri/blob/tauri-cli-v2.11.1/crates/tauri-cli/src/interface/rust/desktop.rs) の `cargo_command` は、dev（`npm run tauri dev`）で `--bin` を付けずに `cargo run` を打つ → `default-run` は残す（D-137 (2)）。
- P4 examples の toy: `cargo test` は `[[example]] test = true` の example の test だけを回し、書かない example の test は回さない。`cargo build --release --bins` は examples を build しない。`cargo run --example <name>` で動く。
- P5 `required-features` の toy（`[[bin]] path = "dev-bin/…"`）: `cargo run --bin <name>` は `error: target ... requires the features: dev-tools`（exit `101`）、`--features dev-tools` で動く。`cargo build --release --bins` は build せず、`--all-features` で build する（feature を渡さない `cargo test` は回さない）。
- P6 実物の build で開発用の bin が bundle に入らないか（2026-10-24 に Coordinator の subagent が本 machine の Linux〈`webkit2gtk-4.1` `2.52.6`、`dpkg-deb`〉で実行。共有の `CARGO_TARGET_DIR`）: (i) 感度: head `eed5c92e`（Plan Commit の候補の版）で `npm ci --ignore-scripts`（exit 0）の後 `npm run tauri build -- --bundles deb`（exit 0。`--verbose` の cargo の command は `cargo build --bins --features tauri/custom-protocol --release`）、`dpkg-deb -c <deb> | grep usr/bin/` → `usr/bin/inventory-system-tauri-scaffold` と `usr/bin/generate_traceability` の 2 行（開発用の bin が 1 つ以上出る、の条件を満たす。`generate_bindings`・`seed_demo_data` は `target/release/` にあるが deb に無い。2 回目の build も同じ。理由は P1）。(ii) 使い捨ての worktree に S2 の移動（`git mv`、`generate_traceability.rs` の root の式、`[workspace]`、dev-tools の `Cargo.toml`。他の S2 の file は当てない）を仮に当てて `npm run tauri build -- --bundles deb --verbose`（exit 0）→ `usr/bin/inventory-system-tauri-scaffold` の 1 行だけ（3 つの開発用の bin は `target/release/` に build されるが deb に入らない）。`Cargo.lock` は dev-tools の package だけが増えた（外部の crate の増減なし）。判定: 成立（(ii) が AC11 の期待と同じ）。仮に当てた worktree は push せず消した。実装の Writer は Plan Commit から S2 を書く。
- P7 classifier: `printf '%s\n' src-tauri/Cargo.toml src-tauri/Cargo.lock src-tauri/dev-tools/Cargo.toml src-tauri/dev-tools/src/bin/generate_bindings.rs src-tauri/src/bin/generate_bindings.rs src-tauri/src/lib.rs src-tauri/tests/bundle_identity_test.rs docs/decision-log.md docs/msi-distribution-runbook.md tests/fixtures/z004/README.md docs/plans/2026-10-24-dev-bins-out-of-msi.md | bash scripts/ci/classify-changes.sh --files-from-stdin` → `rust=true`・`generated=true`・`traceability=true`・`docs=true`・`workflow=false`・`unknown=false`。`printf '%s\n' docs/project-profile.md | bash scripts/ci/classify-changes.sh --files-from-stdin` → `workflow=true`。
- P8 書き換えない呼び出しの数（(a') (b) (d) が書き換える量）: `rg -c --hidden --glob '!.git/**' --glob '!docs/archive/**' 'cargo run[^`]*--bin (generate_bindings|generate_traceability|seed_demo_data)' .` → `24` file・`44` 行（うち `docs/research/**` の `3` file・`3` 行は履歴、移す bin の中の usage の文が `3` file・`12` 行）。ほかに `scripts/tests/pre-push.test.sh` の `FAKE_CARGO_FAIL_ON="run --bin generate_traceability -- --check"` の `2` 行が同じ形を持つ。`-p` で package を選ぶ呼び出しは無い（`rg -n 'cargo (run|test)[^`]* -p ' .` が archive を含めて hit なし、exit `1`）。
- P9 live の path の引用: `rg -n --hidden --glob '!.git/**' --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/research/**' 'src-tauri/src/bin|src/bin/(generate_bindings|generate_traceability|seed_demo_data)|bin/(generate_bindings|generate_traceability|seed_demo_data)' . | rg -v 'dev-tools/src/bin/'`（後ろの `rg -v` は、S2 の後の新しい path `src-tauri/dev-tools/src/bin/…` の file と引用が前の式の `src/bin/(…)` に当たるのを除く）→ `9` file・`14` 行: `docs/project-profile.md` `1`、`docs/DEV_SETUP_CHECKLIST.md` `1`（7-9 の完了の記録）、`docs/backlog.md` `1`（本 lane の項目）、`tests/fixtures/z004/README.md` `2`、`docs/decision-log.md` `3`（D-099 (D10) の 1 と D-137 の Context・Decision の 2）、`src-tauri/src/seed_demo.rs` `1`、`src-tauri/Cargo.toml` `1`、`src-tauri/tests/design_compliance_test.rs` `1`、`src-tauri/src/lib.rs` `3`。
- P10 移す bin が他の test・検査の対象か（`src-tauri/src` を名指しで走査する所）: `rg -n 'CARGO_BIN_EXE|CARGO_BIN_NAME' .` は hit なし。`design_compliance_test` は `src-tauri/src` の全 `.rs` の `pub fn` を集めるが、3 つの bin に `pub fn` は無い（`grep -n '^\s*pub fn' src-tauri/src/bin/*.rs` が hit なし）ので結果は変わらない。`architecture_test` は層の dir だけを読み（`:136`・`:520` の `src` の下の `biz`・`mnt` ほか）、`src/bin` を読まない。`scripts/check-command-drift.sh` は `src-tauri/src` の `#[tauri::command]` を集める（`:15`）が、3 つの bin に command は無い（`rg -n 'tauri::command|collect_commands|generate_handler' src-tauri/src/bin/` が hit なし、exit 1）。移すと黙って対象から外れる所が 3 つある: (1) I-G1 の sweep `test_active_sales_import_vocabulary_sweep_i_g1`（REQ-401）の target `["src-tauri/src", "src-tauri/tests", "src"]`（`src-tauri/tests/import_internal_contract_test.rs:313`）→ S2 で `"src-tauri/dev-tools/src"` を足す（Matrix の T10）。(2) doc-consistency の R0（親文書の直接参照、`scripts/doc-consistency-check.sh:1484`）と (3) R1（code の中の文書の参照の path、`:1523`）は `src_dir="src-tauri/src"` だけを見る → 本 lane は `scripts` を変えない（AC7）ので、移した bin は R0・R1 の走査から外れ（今 R1 が見ている `generate_traceability.rs` の `function-design/…md` の参照〈`:30`・`:831`〜`:833` ほか〉が切れても R1 は黙る）、R0 の除外 `generate_traceability\.rs`（`:1496`）は空振りになる。scripts を触る次の lane で、R1 の走査に dev-tools を足し、R0 の空振りの除外を消す（[backlog](../backlog.md)）。3 つの bin が使う crate は `inventory_system_tauri_scaffold_lib`・`regex`・test の `tempfile` だけ（`use` の `rg`）。

## Data Safety

- commit しない物: MSI・deb・SHA-256 の控え・`target/` の出力・AC6 の `$TMPDIR/seed-ac6.db`（demo の seed）。
- local だけの path: 開発用の Windows の `C:\Program Files\在庫管理システム\` と退避した `bundle\`、開発のデータの folder（`%APPDATA%\com.inventory-system.desktop`。L3 は触らない）。
- 合成だけ: toy の probe の crate（scratchpad）。店のデータは使わない。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。

round 1（`864bd013`）: Claude 側 fresh Opus 5.5 = reject（P1 0 / P2 2 / P3 4）。Codex 側は owner の席外しで起動できず、round 2 で足す。Coordinator は全 6 件を採用した。是正は起草役の `0c324191`。

- P2: `default-run` を残す（外すと `default-members` の下で `cargo run` と `npm run tauri dev` が曖昧で止まる。toy で再現、tauri-cli の `desktop.rs` の `cargo_command` は `--bin` を渡さない）。AC10 の式で新しい path を除く。
- P3: traceability が変わらない根拠を走査の式に、AC6 の `git diff` を root 起点の形に、`docs/Plans.md` の lane の行を消して関門 5 に 1 句、dev-tools の bin が Windows の resource（manifest）を受けない件を D-137 の Compatibility に書き L3-3（観測）で `seed_demo_data` を 1 回動かす。

round 2（`eed5c92e`）: Codex（発注 548、GPT-6.1 Sol high）= reject（P1 0 / P2 1 / P3 1）、Claude 側 fresh Opus 5.5 = reject（P1 0 / P2 1 / P3 2）、Contract Probe P6（Claude subagent、Linux の deb の build）= 成立、ただし head の deb に開発用の bin が 3 つでなく 1 つ。Coordinator は 5 件の finding の全部（Codex #1 と Opus #2 は同じ件として 1 つに）と P6 の食い違いを採用した。是正は Coordinator の代行の本 commit。round 3 は Plan Review round の天井。

- P2（Codex #1 と Opus #2 を 1 つに）: L3-3 が観測だけで FAIL を受けられ、command も release の `--help` だけだった → L3-3 を手順書と同じ debug の `cargo run --manifest-path src-tauri\Cargo.toml --bin seed_demo_data -- --help` にし、PASS を merge の条件、FAIL なら D-137 の是正（manifest）と確かめ直しを完了条件にした（Test Plan の L3-3 と順の行、AC12、Contract Ledger、Owner Effort Budget の予備、Review Focus、Matrix の L3-3・Residual Test Gaps）。D-137 の Compatibility に `STATUS_ENTRYPOINT_NOT_FOUND` の先例（`docs/archive/plans/2026-08-18-plu-slot-core-implementation.md:448`・`:461`）を引いた。
- P2（Opus #1）: `src-tauri/src` だけを走査する検査が移した bin を黙って外す → S2 の表に `import_internal_contract_test.rs` の I-G1 の sweep の target を足す行（Matrix の T10、AC5）。R0・R1 は AC7 を保ち、P10・Non-scope・Design Readiness・Review Focus・Matrix の Failure Modes・Adjacent Pattern Audit・Residual Test Gaps に明記し、`docs/backlog.md` に項目を足した。並走の表に同じ file を触る #188（行は重ならない）と、新しい #202（重なり無し）を足した。
- P3（Codex #2）: `default-members` から外したときの検査漏れの説明を test・clippy に限り、fmt は member を全部見ると直した（Risk、Scope の (a') の行、Matrix の Failure Modes、D-137 (2)）。fmt の根拠は Codex 548 の toy（`default-members = ["."]` と設定なしの両方で member の整形違反を exit 1）。clippy・test が member を見ないのは、package を選ばない command が `default-members` だけを対象にする cargo の workspace の規則（P3 の [1] の `cargo run --bin` の失敗と同じ筋）で、この是正では toy を回していない。
- P3（Opus #3）: Scope の (a) の費用の「build の時間の増えは未実測」を、今も `--bins` で build していて package が変わるだけ、に置き換えた（D-137 の Compatibility も同じ）。
- P6 の実測との食い違い: P1 の「`src/bin` の stem を全部集める」を、tauri-cli 2.11.1 の重複判定（`path.ends_with("")` が真）で最初の 1 つだけが入る筋に直し（どの 1 つかは確かめていない）、P2・P6・Matrix の T8・D-137 の Context を合わせた。P6 を command と出力つきの実測として記録した（D-062）。AC11（main の 1 つだけ）と Goal は変えない。
- 是正の中で見つけた並走の変化（finding でない）: open な PR を突き合わせ直すと、PR #172 が `src-tauri/Cargo.toml`（windows-sys の features の 1 行）・`src-tauri/src/lib.rs`・`src-tauri/tests/design_compliance_test.rs` を触るようになっていた。行は重ならず `Cargo.lock` も変えないので、Risk の並走の文を「crate の形を変える lane と直列」に絞り、並走の表の #172 の行を事実に合わせた（直列にしない判断の当否は round 3 と Coordinator が見る）。
