# Plan Packet: product_service failpoint の並列 test race 是正（thread-local 化）

## Workflow State

- Phase: plan-draft
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable (Claude Code)
- Writer: Codex
- Plan Reviewer: Sonnet subagent (independent)
- Final Reviewer: Sonnet subagent (independent)
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Ready 承認（視覚確認なし — operator 画面変更を含まない test infra change）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 20分
- relay 往復上限: 2（発注 lane 単位で計上）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
変更は `src-tauri/src/biz/product_service.rs` の `#[cfg(test)]` failpoint module（起草時実査: L120 `#[cfg(test)]` を確認済み）とその参照箇所に閉じる test infrastructure の是正。release / debug いずれの production binary にも failpoint code は含まれず、runtime 契約・DTO・DB・画面のいずれにも触れない。ただし CI の安定性（merge gate の信頼性）に影響する developer workflow 変更のため R2。

## Goal

Goal Invariant:

### 最小完了条件

- REQ-101 rollback 系 test が failpoint を武装している間に、並列実行中の別 test の `create_product` 等が武装済み failpoint を踏んで偽 FAIL する race（PR #6 / PR #8 の L1・hosted で実発生した main 既存 flake）が、機構レベルで再発不能になる（thread-local 化により他 thread から武装が不可視になる）。
- 既存の failpoint 使用 test（rollback 検証）は assert 無改変のまま green を維持する（同一 thread 内の発火は等価）。

### 失敗定義

- 是正後も武装状態が thread 間で共有される経路が残る（新 regression test が検出できない形も含む）。
- 既存 rollback test の検証力が落ちる（failpoint が発火しなくなり Err 期待が意味を失う等）。
- production code path（`#[cfg(test)]` 外）に変更が及ぶ。

### 非目的

- `mnt/restore.rs` / `db/mod.rs` の failpoint 系（per-instance 注入の別機構で global 可変状態を持たず race 非該当 — Non-scope 参照）。
- failpoint 機構の他 module への一般化・共通 crate 化。
- test の並列度設定（`--test-threads`）や CI 側の変更。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

対象は `src-tauri/src/biz/product_service.rs` のみ（起草時実査 2026-08-28）:

1. **failpoint module の thread-local 化**（L120-140 相当）: `pub static X: AtomicBool` 4 本（`CREATE_PRODUCT_AFTER_INSERT` / `CREATE_PRODUCT_AFTER_MOVEMENT` / `UPDATE_PRODUCT_AFTER_PRICE_HISTORY` / `BULK_SET_PLU_TARGET_AFTER_SECOND_UPDATE`）を `thread_local!` の `Cell<bool>` へ置換する。flag 名は維持。`arm()` は `&'static LocalKey<Cell<bool>>` を受けて現 thread の flag を立て、`FailpointGuard` の `Drop` で現 thread の flag を降ろす（RAII 契約維持）。`#[cfg(test)]` gate は維持。
   - 設計根拠: 各 `#[test]` は libtest が専用 thread で実行し、BIZ 関数は同期関数（起草時実査: `pub fn create_product`、`thread::spawn` の使用は同 file に 0 hit）のため、武装 test と発火点は常に同一 thread。thread-local 化で「同一 test 内の発火」は等価のまま「他 test への漏れ」だけが構造的に消える。
   - 代替案（不採用）: `arm()` への global Mutex 導入は、武装 test 同士しか直列化できず、非武装 test が `create_product` を呼ぶ経路の race を塞げないため不採用（Plans.md backlog entry の第 2 候補「failpoint 使用 test と create_product 系 test の排他」も、対象 test の全数列挙が壊れやすい运用契約になるため不採用）。
2. **check site の追随**（起草時実査で 5 箇所: L229 / L250 / L325 / L438〈`&&` 複合〉/ L612-613〈行跨ぎ〉。`rg -n "\.load\(std::sync" src-tauri/src/biz/product_service.rs` で全数確認済み）: `failpoint::X.load(Ordering::SeqCst)` → `failpoint::X.with(|f| f.get())` 形へ置換。判定位置・エラー文言（`"failpoint: ..."`）は無改変。
3. **arm call site**（起草時実査で 5 箇所: L1900 / L1924 / L2272 / L3267 / L3660 相当）: `thread_local!` 生成の `LocalKey` static は `&failpoint::X` の参照形をそのまま受けられるため、原則 literal 無改変を維持する（変更が必要になった場合は機構置換に必然の最小差分に限る）。
4. **race regression test の追加 1 本**: 現 thread で `arm()` を保持したまま、`std::thread::spawn` した別 thread から同 flag の非可視（未武装）を直接 assert する決定的 test。flaky の確率的再現に依存しない機序 test とする。新規 REQ token は付与しない（test infra であり要件契約ではない。既存 REQ token の削除・改変もしない）。

## Non-scope

実査で確認し、意図的に除外した同型 class（reviewed-and-excluded）:

- `src-tauri/src/mnt/restore.rs` / `src-tauri/src/db/mod.rs` の failpoint 系: enum（例: `LegacyFailpoint`）を対象 instance へ引数注入する per-instance 機構で、process-global 可変状態を持たないため並列 race 非該当（起草時実測: `rg -n "AtomicBool"` は restore.rs hit 0、db/mod.rs は L449/L457 の 2 hit だが test 内でその場生成される per-instance struct の field であり `static` ではない — global 武装状態に該当せず結論不変）。
- 既存 rollback test の期待値・assert の変更（機構置換に必然の行以外は無改変）。
- CI / local-ci script・test 並列度の変更。

## Acceptance Criteria

- AC-1: `rg -c "AtomicBool" src-tauri/src/biz/product_service.rs` が hit 0（機構置換の完了確認。起草時実測 7 hit = use 文 1 + static 宣言 4 + struct field 1 + fn 引数 1）。
- AC-2: `rg -F -c 'thread_local!' src-tauri/src/biz/product_service.rs` ≥ 1、かつ `rg -F -c 'LocalKey' src-tauri/src/biz/product_service.rs` ≥ 1。
- AC-3: 追加した race regression test（別 thread からの非可視 assert）が green。test 名を PR body に記録する。
- AC-4: 既存 failpoint 使用 test（arm 5 call site を含む test）の assert・期待値が無改変で green（`git diff` 上、既存 test の変更が機構置換に必然の行に限られることを確認）。
- AC-5: `cd src-tauri && cargo test` を連続 5 回実行し全回 PASS（設計値 5 回の stress。従来 flaky の非再現確認 — 決定的証明は AC-3 が担い、本 AC は退行検知の補助）。
- AC-6: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings` PASS。
- AC-7: `cargo run --bin generate_traceability -- --check` drift 0（REQ token 非接触の確認を機械化。新規 REQ token を追加しないこと）。
- AC-8: L1 `bash scripts/local-ci.sh full` CLEAN PASS（Ready 前の exact HEAD で実行、evidence は PR body へ）。

## Design Sources

- Requirements / spec: 変更なし（REQ 非接触。既存 test の REQ-101 等 token は無改変）
- Architecture: 変更なし（`UI -> CMD -> BIZ -> IO/MNT` 境界に触れない）
- Function / command / DTO: 変更なし（failpoint は function design docs の契約対象外の test 専用機構 — 起草時実査で `docs/function-design/` に product_service failpoint 機構の記述なし）
- DB: 変更なし
- Screen / UI: 変更なし
- Decision log / ADR: 変更なし（test infra の局所判断。durable 判断は packet の設計根拠記述で足りる）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし（`#[cfg(test)]` 内のみ） | existing sufficient |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | なし | existing sufficient |

## Registration / Generation Obligations

該当なし（command / route / doc / REQ 新設なし。bindings / routes / traceability の再生成なし — AC-7 で drift 0 を機械確認）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| （test infra、spec ID 非接触） | Plans.md backlog entry（PR #8 L1 初回 FAIL 起源） | 本 packet Scope 1 設計根拠 | thread-local 化 / global Mutex 排他 / test 列挙排他の 3 案から、非武装 test 経路も構造的に塞げる唯一の案を採用 | `product_service.rs` failpoint module | AC-3 race regression test |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（test 専用機構で design doc 対象外。機序と採用理由は本 packet + 新 test の comment に残る）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: 「各 `#[test]` は専用 thread、BIZ 呼び出しは同期・同 thread」が成立前提。起草時実査 = `pub fn create_product`（同期）/ `thread::spawn` 同 file 0 hit。Writer は着手時に arm 使用 5 test が thread を跨いで BIZ を呼ばないことを再確認する
- Deferred design gaps, risk, and follow-up target: なし（restore.rs / db 側は非該当を実査済み）
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix は R2 optional 判定で省略（機序 test AC-3 + 機械 oracle AC-1〜AC-8）
- Absolute guarantee / escape hatch self-check completed: 「機構レベルで再発不能」の主張は thread-local の言語保証に依拠。escape hatch = test 内で明示 `thread::spawn` して BIZ を呼ぶ将来 test は武装が届かない（意図どおり武装したい場合は spawn 先で arm する）。この性質は failpoint module の comment に 1 行明記する

## Impact Review Lenses

not applicable — 起点は repo 内の CI flake 実測（PR #6 / PR #8）であり、実地調査・実機・外部 tool・POS 連携・format 変更のいずれにも該当しない。

## Design Readiness

- Existing design docs are sufficient because: failpoint は test 専用機構で design doc の契約対象外（起草時実査で function-design に記述なし）。設計判断は本 packet に完結
- Source docs updated in this PR: なし
- Design gaps intentionally deferred: なし
- Durable decisions discovered in this plan and promoted to source docs: なし

Minimum design checks:

- Layer ownership: BIZ 層 test infra のみ
- Backend function design: runtime 変更なし
- Command / DTO / data contract: 変更なし
- Persistence / transaction / audit impact: なし（rollback test の検証対象自体は無改変）
- Operator workflow / Japanese UI wording: 変更なし
- Error, empty, retry, and recovery behavior: 変更なし（failpoint エラー文言は維持）
- Testability and traceability IDs: 既存 REQ token 無改変、新規 token なし（AC-7）

## Contract Probe

N/A — R2。外部前提は「libtest が各 `#[test]` を専用 thread で実行する」という Rust 標準 test harness の既定挙動のみで、これは新 regression test（AC-3）自身が同一機序を直接検証する。

## Contract Coverage Ledger

R2 簡易版:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| 武装の他 thread 非可視（race 構造排除） | failpoint module thread-local 化 | AC-3 race regression test | non-scope |
| 同一 thread 発火の等価性（rollback 検証力維持） | check site 5 箇所の置換 | 既存 rollback test 無改変 green（AC-4） | non-scope |
| RAII 自動 reset（guard Drop） | `FailpointGuard` | 既存 test の連続実行（AC-5） | non-scope |

## Test Plan

Test Design Matrix は R2 optional 判定で省略（理由: 検証核心は AC-3 の決定的機序 test 1 本に集約でき、mutation 相当の感度は「thread-local 化を AtomicBool に戻すと AC-3 が red になる」ことで自明に担保される。Writer は AC-3 実装後、この逆置換 1 mutant で red を実証して PR body に記録する）。

- targeted tests: AC-3 race regression test + 既存 failpoint 使用 test（AC-4）
- negative tests: AC-3 が negative（非可視）assert そのもの
- compatibility checks: AC-1/AC-2/AC-7（機構置換の完了と REQ 非接触）
- data safety checks: N/A
- main wiring/integration checks: AC-5 stress + AC-8 L1 full

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない（`#[cfg(test)]` 内のみ）。

## Review Focus

- thread-local 化の前提（同期・同 thread 実行）が arm 使用 5 test すべてで成立していることの実読確認
- AC-3 の regression test が「機構を AtomicBool に戻したら red になる」感度を持つこと（tautology でないこと）
- 既存 rollback test の検証力が維持されること（failpoint 発火が同一 thread で従来どおり起きること）
- production code path（`#[cfg(test)]` 外）への変更が 1 行もないこと

## Spec Contract

N/A（R2。触れる契約は Contract Coverage Ledger 参照）。

## Trace Matrix

N/A（R2、Design Intent Trace 参照）。

## Data Safety

N/A — 実データ・secrets・破壊的操作なし。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
