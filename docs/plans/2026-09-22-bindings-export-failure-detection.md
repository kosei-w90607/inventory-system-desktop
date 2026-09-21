# Plan Packet: 型生成（TS bindings）の失敗を失敗として検出する（R2）

2026-09-22 起草。出典は Backlog「やると決めたもの（順番未定）」の [型生成の失敗が成功扱いになる](../backlog.md#やると決めたもの順番未定) entry（2026-09-22 の外部設計相談で指摘、Coordinator が現物で確認）。owner 決定 2026-09-22「次に着手する最初の小変更」で着手。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Evidence Mode: github
- Phase: implementing
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: c9d7d02883d9d18d5c208d9f32b06860a8d8578b
- Amendments: none
- Coordinator: Fable 5.1
- Writer: Sonnet subagent（worktree run）
- Plan Reviewer: Sonnet（独立 fresh context）
- Final Reviewer: Codex（独立 fresh context、Writer が Claude 系のため別 vendor を 1 本）
- Final Review Minimum: 1
- Human Gate: ready,merge

manual なし: 画面・operator workflow・配布物に変化がなく、debug build 専用の開発ツールの終了コードと失敗経路だけが変わる。

遷移記録（append-only）:

- kickoff → spec-check → design → plan-draft → plan-gate（本 commit、plan-first）: 設計正本に型生成の失敗時の振舞いを定める節は無く、既存の利用契約（`docs/DEV_WORKFLOW.md` Verification Gates「generate_bindings の後に `src/lib/bindings.ts` の diff を見る」、D-054 の「L1 の bindings clean diff 検査が cross-language 同期の機械検査を兼ねる」）が暗黙に前提とする「生成が失敗したら検査も失敗する」を実装が満たしていない、という実装側の欠陥。owner の設計判断を要する論点なし
- plan-gate → plan-approved → implementing（本 commit、state-only）: Plan Review round 1（Sonnet、P1 0 / P2 2 / P3 2）→ 是正 `9f68abdc` → round 2 closure（同 reviewer、P1/P2 = 0、P3 1）→ P3 を in-place 是正。Plan Commit = `c9d7d028`（plan-first `41b1ad89` → 是正を含む確定版）。実装は Sonnet subagent の worktree run で本 commit を起点にする
- Gated Amendment 1（本 commit）: Writer の初回実装 run（`368dec36`）の報告で、Test Plan T2 の失敗条件「存在しない親 directory」が現物と合わないと判明（`specta-typescript 0.0.11` `src/exporter.rs` の `export_to` が `create_dir_all(parent)` を実行、Coordinator が registry の source で確認）。T2 の条件を「親 directory を作れない」へ訂正し、T4 を既存 file の保護を直接見る独立 test に改める。Goal Invariant / Scope / AC / Risk / Final Review Minimum / Human Gate は不変。旧前提の sweep: `rg -n '存在しない親' ` で packet・Plans.md に残存なし

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 10分
- relay 往復上限: 2（Final Review の Codex pass 1 往復を見込む）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
開発者向けの生成ツール（debug build 専用）の失敗経路と終了コードを変える local developer workflow の変更。runtime の契約（Tauri command DTO、`src/lib/bindings.ts` の生成内容、DB、operator 画面）は変えない。CI / local CI の定義 file（`.github/workflows/ci.yml`、`scripts/local-ci.sh`）は編集せず、既存の「生成 + `git diff --exit-code`」がそのまま fail-closed になる。gate の定義自体を変えないため R3 の workflow gate change には当たらない。

## Goal

Goal Invariant:

### 最小完了条件

- 型生成のどの段（specta export / 整形 / 定数追記 / 置換）が失敗しても、`cargo run --bin generate_bindings` が非 0 で終了し、完了 message を出さない。これにより local CI と hosted CI の bindings 検査が、古い `src/lib/bindings.ts` を残したまま green にならない。

### 失敗定義

- 生成のいずれかの段が失敗したのに CLI が 0 で終了する経路が残る。
- 成功時の `src/lib/bindings.ts` の内容が現行と 1 byte でも変わる。
- 生成の失敗が `tauri dev`（`run()` の debug 自動生成）の起動を止めるようになる。

### 非目的

- 生成内容・整形規則・定数の追加や変更。
- CI / local CI の step 定義の変更、新しい gate の追加。
- error 型の体系化（専用 enum の新設、`thiserror` の導入）。失敗した段が message で分かれば足りる。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- S1 `src-tauri/src/lib.rs`: `export_specta_bindings()`（debug build 専用）が `Result` を返すようにする。specta export / `normalize_generated_bindings` / `append_generated_constants` / 置換のどの段の失敗も `Err` で返し、message から失敗した段と対象 path が分かるようにする。関数内の `eprintln!` による握りつぶしは無くす。
- S2 `src-tauri/src/lib.rs`: 生成は同じ directory 内の一時 file へ出力し、整形と定数追記まで完成させてから `src/lib/bindings.ts` へ rename で置換する。失敗時は既存の `bindings.ts` に触れず、一時 file は best-effort で消す。path を引数に取る内部関数へ分け、test が tempdir に対して同じ経路を通せるようにする（公開 API は `export_specta_bindings()` のまま）。
- S3 `src-tauri/src/lib.rs` `run()`: 呼出し側で `Err` を受け、現行どおり警告を `eprintln!` して起動を続ける（`tauri dev` を止めない）。
- S4 `src-tauri/src/bin/generate_bindings.rs`: `Err` なら message を stderr へ出して `std::process::exit(1)`、`Ok` のときだけ完了 message を print する。冒頭の doc comment を実態に合わせる。
- S5 `src-tauri/src/lib.rs` の `bindings_generation_tests`: 下記 Test Plan の test を追加する。この module は起動失敗表示・DB 初期化の test も同居しているが、既存 test はどれも変更しない。
- S6 closeout（merge 後の別 PR）: `docs/backlog.md` の当該 entry の消し込みと `docs/Plans.md` の更新。

呼出し側の確認（2026-09-22、`git grep -n 'export_specta_bindings\|generate_bindings' origin/main -- src-tauri scripts .github`）: `export_specta_bindings` の呼出しは `src-tauri/src/lib.rs` の `run()` と `src-tauri/src/bin/generate_bindings.rs` の 2 箇所だけ。CLI の利用者は `.github/workflows/ci.yml:235` と `scripts/local-ci.sh:214`（`run_required`）で、どちらも非 0 終了を失敗として扱うため編集不要。

許容する書込み: `src-tauri/target/**`（build）、`.local/ci-evidence/**`（`scripts/local-ci.sh` の出力）、成功時に再生成される `src/lib/bindings.ts`（差分 0 が期待値）。

## Non-scope

- `.github/workflows/**`、`scripts/**`、`docs/DEV_WORKFLOW.md`、`docs/project-profile.md`、`docs/ci.md` ほか policy 文書の編集。
- `src/lib/bindings.ts` の内容変更、`src-tauri/src/bin/generate_traceability.rs` の同種の見直し。
- 新しい依存の追加（`tempfile` は既存の dev-dependency を使う）。
- Writer による本 packet の編集（不整合を見つけたら編集せず停止して報告する）。

## Acceptance Criteria

- AC1 `cd src-tauri && cargo run --bin generate_bindings` が exit 0 で完了 message を出し、`git diff --exit-code -- src/lib/bindings.ts` が差分 0（成功時の生成内容が不変）で、`git status --short -- src/lib` が空（一時 file が残らない）。
- AC2 失敗の実測（Writer が 1 回行い PR 本文へ command と exit code を記録）: `src/lib` を一時的に書込み不可にして（`chmod a-w src/lib`）`cargo run --bin generate_bindings` を実行すると、非 0 で終了し、完了 message `TS bindings exported` を出さず、stderr に失敗した段と path が出る。実行後に権限を戻し（`chmod u+w src/lib`）、`git status --short` が clean で、`src/lib` に一時 file が残っていない。この条件では一時 file の作成自体が失敗するため、作成後の後始末は T3 が担う。
- AC3 Test Plan の T1〜T6 が全 PASS し、`cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test` が成功する。
- AC4 `export_specta_bindings()` とその内部関数に `eprintln!` が残らず、bindings 生成の警告は `run()` の 1 箇所だけになる。baseline（origin/main `54ed8990`、`rg -n 'eprintln!' src-tauri/src/lib.rs`）= 223 / 348 / 354 / 361 / 908 行の 5 件で、うち 348 / 354 / 361 の 3 件が `export_specta_bindings()` 内。223（起動失敗の表示）と 908（診断ログ初期化の警告）は対象外で残す。
- AC5 `bash scripts/local-ci.sh changed` が成功する。

## Design Sources

- Requirements / spec: REQ-104 / D-054（`docs/decision-log.md`、bindings 生成が cross-language 定数同期の機械検査を兼ねる）
- Architecture: 該当なし（layer 境界に触れない）
- Function / command / DTO: 該当なし（command と DTO は不変）
- DB: 該当なし
- Screen / UI: 該当なし
- Decision log / ADR: D-054、`docs/DEV_WORKFLOW.md` Verification Gates の `Tauri command DTOs` 行

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | なし（開発ツールの失敗経路） | existing sufficient |
| Command / DTO / generated binding / wire shape | D-054、Verification Gates | existing sufficient（生成内容は不変） |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | 該当なし | existing sufficient |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| Durable decision / ADR | 該当なし（新しい決定を作らない） | existing sufficient |

## Registration / Generation Obligations

該当なし（command / doc / REQ / route / 画面の追加・改名・削除を含まない。追加 test は既存の REQ-104 を参照するか、`test_` prefix なしの WF 系 meta-test 命名にする。REQ-104 参照の test を増やす場合は `cargo run --bin generate_traceability -- --check` を通し、drift が出たら `docs/function-design/90-traceability.md` の再生成を同じ commit に含める）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-104 | `docs/decision-log.md` D-054 | D-054 | bindings の clean diff 検査を同期の機械検査として信用するには、生成の失敗が検査の失敗になる必要がある。却下: CI 側で stderr を grep する（生成側の終了コードが正しければ不要な二重化） | `export_specta_bindings()` / `generate_bindings` の `main` | T1〜T6、AC2 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: はい（D-054 と backlog entry）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: `std::fs::rename` は同じ directory 内なら同一 filesystem で置換できる。debug build 専用（`cfg(debug_assertions)`）のまま
- Deferred design gaps, risk, and follow-up target: `generate_traceability` の失敗経路は未確認で本 change の対象外
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix は作らない（R2、Test Plan で足りる）
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: `run()` だけは失敗を警告に落として続行する。理由は開発中の起動を止めないためで、gate としての検査は CLI 経路が担う

## Impact Review Lenses

not applicable: 実機調査・外部 tool の挙動・POS 連携・operator workflow の発見を起点にしない、開発ツール内部の失敗伝播の修正。

## Design Readiness

- Existing design docs are sufficient because: 生成内容と利用手順は変わらず、失敗時に失敗を返すという既存手順の暗黙の前提を実装が満たすだけ
- Source docs updated in this PR: なし
- Design gaps intentionally deferred: なし
- Durable decisions discovered in this plan and promoted to source docs: なし

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 触れない
- Backend function design: 触れない
- Command / DTO / data contract: 不変（AC1 で生成物の差分 0 を確認）
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: なし
- Error, empty, retry, and recovery behavior: 失敗時は既存の `bindings.ts` を保ち、再実行で回復する
- Testability and traceability IDs: REQ-104 / D-054

## Contract Probe

N/A: R2。外部 library の未検証の前提に依らない（`tauri_specta::Builder::export` が `Result` を返すことは現行 code が既に `if let Err(e)` で受けている）。

## Contract Coverage Ledger

N/A（R2）。

## Test Plan

test は実装と同じ commit に入れてよい。すべて `tempfile::tempdir()` 上で path を引数に取る内部関数を通し、実物の `src/lib/bindings.ts` に触れない。

- targeted tests:
  - T1 成功経路: tempdir 内の出力先へ生成すると `Ok`、出力 file が存在し、`export const CSV_IMPORT_FILE_SIZE_LIMIT` の行を 1 つ含み、行末空白が無く、一時 file が残らない。
- negative tests:
  - T2 export の失敗: 出力先の親 directory を作れない条件（親の位置を同名の file が塞ぐ）にすると `Err`、message に出力先 path を含む。親 directory が存在しないだけでは失敗しない（`specta-typescript 0.0.11` の `export_to` は書込み前に `create_dir_all` を実行する、GA1）。
  - T3 置換の失敗: 出力先 path に directory を置いておくと `Err`、その directory は残り、一時 file が残らない。
  - T4 既存 file の保護: 出力先に既存内容の file を置き、一時 file の path を directory で塞いで export を失敗させると `Err`、出力先の既存内容が変わらない（GA1: T2 の条件では出力先 file を置けず、T3 の条件では出力先が directory になるため、既存 file の保護を直接見る独立の test にする）。
  - T5 整形の失敗: 存在しない path で `normalize_generated_bindings` が `Err`。
  - T6 定数追記の失敗: 存在しない path で `append_generated_constants` が `Err`。
- compatibility checks: AC1（実物の生成結果が差分 0）。
- data safety checks: 該当なし（実データ・DB に触れない）。
- main wiring/integration checks: AC2（CLI の終了コードの実測）。整形・定数追記の段は T5 / T6 で各関数が `Err` を返すことを固定し、合成関数がそれを `?` で伝播することは review で確認する（合成関数の途中へ失敗を注入する seam は足さない）。

## Boundary / Wire Contract

generated bindings に触れるが内容は不変。

- producer: `export_specta_bindings()`
- consumer: frontend の `src/lib/bindings.ts` import、CI / local CI の drift 検査
- wire type: 変更なし
- internal type: 関数の戻り値が `()` から `Result` へ
- precision/range: 該当なし
- round-trip path: 該当なし
- invalid input: 出力不能な path は `Err`
- compatibility: 成功時の出力は byte 単位で不変（AC1）

## Review Focus

- どの段の失敗も CLI の非 0 終了へ届くか（`?` の伝播に抜けがないか、`Ok` を返す早期 return が残っていないか）。
- 失敗時に既存の `bindings.ts` と作業 tree を汚さないか（一時 file の後始末）。
- `run()` が失敗で起動を止めないか。
- 成功時の生成内容が不変か。
- 保守者が読んで意図が分かるか、seam や error 型を過剰に足していないか。

## Spec Contract

N/A（R2）。

## Trace Matrix

N/A（R2）。

## Data Safety

N/A（R2）。実データ・DB・backup に触れない。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
