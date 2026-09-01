# Plan Packet: 棚卸しカウントの数量空欄ガード（空欄 Enter / 保存で actual_count=0 がサイレント保存される欠陥の是正）

UI ガッツリ整えターン（owner 宣言 2026-09-02）の wave 8 lane 2。棚卸し UX audit（2026-09-02）の C5 = 機能欠陥級。`src/features/stocktake/StocktakePage.tsx` `saveCount()` は `Number(quantity)` で空文字を `0` に変換し、検証 `Number.isInteger(actualCount) && actualCount >= 0` を素通りして `update_count(itemId, 0)` を送る。保存ボタンの disabled 条件（`disabled || updateMutation.isPending`）も数量空欄を見ない。backend `stocktake_service.rs::update_count` は負数のみ拒否（`actual_count` は `i64`、空欄の概念なし）。結果、数量未入力のまま Enter または保存操作をすると実数 0 が記録され、確定時に在庫 0 補正へ至る実害経路がある。本 packet はこの空欄経路を送信前 FieldError で止め、73 doc の入力契約を同期する。棚卸し UX audit の他候補（C1〜C4、C6〜C10）は別 design packet。

## Workflow State

- Phase: human-confirm
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: b2c333fdc8da012c47f8376065d93e1b56b52f49
- Amendments: none
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Codex（GPT-5.6、発注書駆動、worktree isolation）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Fable 裁定
- Final Reviewer: Claude Sonnet 5 subagent（fresh context、Plan Reviewer とは別個体）+ Coordinator mutation 独立再実測 + Fable 裁定
- Reviewed Content HEAD: f293f1856f5080fc9deda071a878c5d703f13f85
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: L3（Windows native、AC6 (i)〜(v)）、Ready、merge

Phase 遷移記録（kickoff → spec-check → plan-draft → plan-gate、本 plan-first commit に同乗）: kickoff で C5 単独 R3、branch、停止点を固定。spec-check で `StocktakePage.tsx` L490-517 / L619-650、`useUpdateCount.ts` L11-19、`stocktake_service.rs` L260-269、`73-ui-stocktake.md` §73.5 L201-202 / エラー表 L269、既存 test T8（`StocktakePage.test.tsx` L391-405）を Coordinator 発注の read-only 調査 + 直接読取で確認。73 doc は負数規則のみで空欄規則を持たないが、是正は「空欄を送信前に止める」1 規則の追記で足り、既存の負数規則・toast なし規則・IME guard と衝突しないため、spec-check → plan-draft の許可された skip（Design Readiness が既存 docs 充足 + Writer による同 PR 軽微追記を引用）を適用。packet + Test Design Matrix を同 commit で commit し plan-gate に至る。実装は Coordinator の `plan-approved` 合図まで開始しない。

2026-09-02: Plan Review round 1（Sonnet subagent fresh context、既存 suite 28/28 green を独立確認）= P1 0 / P2 2 / P3 1、全件 accept、是正 commit `2caea99`。round 2（同 reviewer の条件付き再確認、diff 実読）= P1/P2 = 0。この state-only commit は `plan-gate -> plan-approved -> implementing` を materialize する。Plan Commit `b2c333f` は全実装 commit に先行し PK5 ancestry を充足する。

2026-09-02: Writer（Codex）が Draft PR #27 を作成（content commit `5686764` + 層名訂正 `f293f18`、L1 full RESULT=PASS / CLEAN、exact SHA と evidence は PR body を正とする）。Writer 透明申告 2 件を Coordinator が accept: (1) 新規 test の画面待機不足を新規 test 側のみ補正（既存 test 無改変、Final Review lens 3 で `git show` 比較により確認）(2) 73 doc 追記の負数検証責務層を packet Scope 2 の字面「CMD 側」から live source（`src-tauri/src/biz/stocktake_service.rs`）どおり「BIZ 側」へ訂正 — packet 側の字面誤りであり Scope 意図は不変、amendment 不要と裁定。独立 Final Review（Sonnet subagent fresh context、Plan Reviewer とは別個体）= P1/P2/P3 = 0、Goal Invariant 充足 = yes、Ledger 6 行全て HEAD で一致、`updateCount` の迂回経路なし（`useUpdateCount.ts` 経由 1 箇所のみ）。Coordinator 発注の mutation 独立再実測（隔離 worktree、X1〜X4 自己注入）= 全 kill・survivor なし。X4 は Matrix 期待列（T-C5-1）より広く T-C5-2 / T-C5-3 も red（Matrix の保守的過少見積もり、感度上の問題なし、P3 記録のみ）。追加探査 X5（ガードを整数検査の後へ移動）は生存するが `Number("")` / `Number("  ")` が 0 で整数検査を通過し空欄検査へ落ちるため観測挙動が同値の等価変異であり検出 gap ではない。この state-only commit は既評価の `implementing -> local-verified -> independent-review -> human-confirm` を materialize する。残る Human Gate は owner Windows native L3（AC6）、Ready、merge。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 3 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
Risk Tiers R3 行のうち operator workflow（棚卸しカウント保存の入力契約変更 = 空欄を拒否する新規 validation、Enter 経路と保存ボタン経路の両方の実挙動が変わる）に該当。DB schema / Tauri command DTO / bindings / POS CSV / route state / merge gate は変更しない（frontend validation + 73 doc 同期のみ、AC で bindings 差分ゼロを機械確認）。データ整合性に直結する欠陥（誤 0 記録 → 在庫 0 補正）の是正であり、逆方向の退行（正当な明示 0 が保存できなくなる）を Matrix で必ず塞ぐ。

## Goal

Goal Invariant: 数量を入力していない状態で Enter または保存操作をしても実数 0 は記録されず、利用者は「数量を入力してください」と表示で気付ける。明示的に `0` と入力した実数 0 は従来どおり保存できる。

### 最小完了条件

- 数量欄が空欄または空白のみのとき、Enter / 保存ボタンのどちらでも `update_count` が呼ばれず FieldError「数量を入力してください」が出る
- `0` を明示入力したときは従来どおり `update_count(itemId, 0)` が呼ばれる（退行なし）
- 73 §73.5 に空欄規則が追記され、エラー表に行が増える

### 失敗定義

- 空欄 Enter で 0 が保存される経路が残る（RTL または L3 で検出）
- 明示 0 の保存が拒否される、または負数 FieldError（既存 T8）が壊れる
- IME 変換確定 Enter の guard（`isComposing`）を崩す

### 非目的

- リアルタイム検証（入力中の即時エラー表示、audit C6）
- 保存ボタンの disabled 制御の追加（「なぜ押せないか」を説明しない UI になるため不採用、決定 ST-C5-D1）
- 数量欄の単位表記（C10）、未入力 Badge の色（C9）、確定処理中 feedback（C7）
- backend `update_count` の validation 変更

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。

## Scope

1. **`src/features/stocktake/StocktakePage.tsx` `saveCount()`**: `Number(quantity)` の前に `quantity.trim() === ""` を判定し、該当時は `setFieldError("数量を入力してください")` で return（`update_count` 未呼出）。既存の負数 / 非整数 FieldError「0以上の数値を入力してください」は不変。Enter 経路（`onKeyDown`、`isComposing` guard 不変）と保存ボタン経路の両方が同一 `saveCount()` を通るため、ガードは 1 箇所。
2. **`docs/function-design/73-ui-stocktake.md`**: §73.5 step 4（L201）に「空欄・空白のみは送信前に FieldError『数量を入力してください』で止める（`Number("")` が 0 になる経路を塞ぐ、CMD 側は負数のみ検証）」を追記。エラー表（L269 付近）に UI 送信前ガード行（`actual_count` 空欄 → FieldError「数量を入力してください」）を追加。既存 `validation` 行と異なり backend には到達しない（wire は `i64` で空欄の概念なし）ことを行内に明記し、backend `kind` を暗示しない文言にする。更新履歴 dated 行。
3. **tests `src/features/stocktake/StocktakePage.test.tsx`**（既存 test 無改変、新規 test 追加のみ）:
   - T-C5-1: 数量空欄で Enter → FieldError「数量を入力してください」表示、`commands.updateCount` 未呼出
   - T-C5-2: 数量空欄で保存ボタン click → 同上
   - T-C5-3: 空白のみ（`"  "`）で Enter → 同上
   - T-C5-4: `"0"` 入力で Enter → `commands.updateCount(itemId, 0)` が呼ばれ FieldError なし（退行防御、非空期待の oracle）
   - REQ token: 既存 test file の慣行に合わせる（file 内に REQ token があれば `REQ-205` を付与し 90-traceability を再生成、無ければ付与しない）
4. **gate**: `cargo run --bin generate_traceability -- --check` ERROR 0（token 追加時は再生成 commit を含める）、`bash scripts/doc-consistency-check.sh` PASS、`npx vitest run src/features/stocktake/` green、bindings 差分ゼロ。
5. **Writer 完了条件**: L3 を含むため `cargo check --release`（CI gate ではない）。

## Non-scope

- `useUpdateCount.ts` / `commands.updateCount` / `stocktake_service.rs` の変更
- 保存成功 toast の追加（73 §73.5 L202「1 件保存ごとの toast は出さない」は不変）
- 数量 `Input` の `type` / `inputMode` / `min` 属性変更（HTML 側 validation への切替は別判断）
- 棚卸し UX audit の他候補（C1〜C4、C6〜C10）

## Acceptance Criteria

- AC1: `npx vitest run src/features/stocktake/StocktakePage.test.tsx -t "C5"` で T-C5-1〜4 が green。既存 T8 を含む同 file の既存 test に diff なし（`git diff` で test 削除・改変ゼロ）
- AC2（mutation 感度、Final Review で Coordinator が clean tree 上で独立再実測）: Scope 1 の空欄ガードを除去した mutant で `npx vitest run src/features/stocktake/StocktakePage.test.tsx` の T-C5-1 / T-C5-2 / T-C5-3 が red、T-C5-4 と T8 は green のまま
- AC3（退行防御）: 空欄ガードを `Number(quantity) === 0` 判定に誤実装した mutant で T-C5-4 が red（明示 0 を拒否してはならない）
- AC4: `rg -n "数量を入力してください" src/features/stocktake/StocktakePage.tsx docs/function-design/73-ui-stocktake.md` が各 file ≥1 hit、`rg -n "0以上の数値を入力してください" src/features/stocktake/StocktakePage.tsx` ≥1 hit（既存文言維持）
- AC5: `bash scripts/doc-consistency-check.sh` PASS、`cargo run --bin generate_traceability -- --check` ERROR 0、`git diff --name-only -- src/lib/bindings.ts` が空
- AC6（L3、owner Windows native）: (i) 数量空欄で Enter → エラー表示、一覧の実数が変わらない (ii) 数量空欄で保存ボタン → 同上 (iii) `0` 入力で Enter → 実数 0 として保存される (iv) 負数 → 従来のエラー (v) スキャン / 候補選択の流れ（`StocktakePage.suggest.test.tsx` の W 系）が体感で変わらない

## Design Sources

- Requirements / spec: `docs/function-design/73-ui-stocktake.md` §73.5 L201-202（数量入力 → `update_count`、負数 FieldError、toast なし）、エラー表 L269
- Architecture: `docs/ARCHITECTURE.md` UI → CMD → BIZ（frontend validation は防御的二重チェックの UI 側）
- Function / command / DTO: `src/features/stocktake/hooks/useUpdateCount.ts`（`commands.updateCount(stocktakeItemId, actualCount)`、wire 不変）、`src-tauri/src/biz/stocktake_service.rs` L260-269（負数のみ拒否、不変）
- DB: 不変（`actual_count` i64）
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-05（read-only vs disabled の使い分け — disabled は「なぜ触れないのか」を誤解させる）、DSR-19（保存成功 feedback 規約、本 packet では toast なし契約を維持）
- Decision log / ADR: UI-10 系裁定（棚卸し中止 Reject、差異列色分け Reject — 本 packet は非接触）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | `stocktake_service.rs::update_count` 負数検証 | existing sufficient（不変） |
| Command / DTO / generated binding / wire shape | `update_count(stocktake_item_id, actual_count: i64)` | existing sufficient（不変、AC5 で差分ゼロ） |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | `73-ui-stocktake.md` §73.5 step 4 + エラー表 | updated in this PR |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| Durable decision / ADR | ST-C5-D1（disabled 化不採用、FieldError 一本化）は 73 §73.5 追記文に理由込みで吸収 | updated in this PR |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| REQ coverage 追加（test に `REQ-205` token を付与する場合） | `cargo run --bin generate_traceability` で `90-traceability.md` 再生成（PR #72 / PR #17 と同型の T1 drift を Writer 側で先回り） |

他は該当なし（command / doc file / route / 画面の新設なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-205 / 73 §73.5 step 4 | 数量入力 → `update_count`、負数は送信前 FieldError | ST-C5-D1（2026-09-02） | 空欄は「未入力」であり 0 ではない。`Number("")===0` は言語仕様の罠で業務意図と乖離。保存ボタン disabled 化は理由が見えず操作者が止まる（DSR-05: disabled は「なぜ触れないのか」を誤解させる）→ FieldError 一本化、Enter / click 両経路を同一関数で塞ぐ | `saveCount()` 冒頭の trim 空判定 | T-C5-1〜3 |
| 73 §73.5 step 4（負数） | 既存 FieldError「0以上の数値を入力してください」 | — | 不変。明示 0 は正当な棚卸し実数（欠品確認） | 不変 | T-C5-4 / T8 |
| 73 §73.5 L202 | 1 件保存ごとの toast なし | — | 不変。FieldError は inline 表示で toast 契約に触れない | 不変 | 既存 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（73 §73.5 追記に `Number("")` の機序と disabled 不採用理由を 1 文で残す）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: ST-C5-D1 → 73 §73.5
- Assumptions and constraints: 数量 `Input` は `type` 未指定（text）+ `inputMode="numeric"` のため空文字が state に入る（Coordinator 発注調査で確認、L619-635）。Windows native WebView2 でも同じ（HTML 標準）
- Deferred design gaps, risk, and follow-up target: リアルタイム検証（C6）は別 design packet。HTML `type="number"` 化は挙動差（IME / スピンボタン）を伴うため不採用のまま凍結
- Test Design Matrix can cite design decision IDs or source doc sections: [Matrix](test-matrices/2026-09-02-stocktake-empty-count-guard.md)
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外なし。明示 0 の保存可能性を T-C5-4 で保証

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable（UI 層の validation、wire 不変） | — |
| Fact check / design decision split | 事実 = `Number("")===0` 素通り + backend 負数のみ検証（Coordinator 実読）。判断 = ST-C5-D1 | 本 packet |
| Lifecycle / retry | 保存失敗時の既存 FieldError 経路不変。空欄ガードは mutation 前で完結 | Matrix State Lifecycle |
| Operator workflow | 空欄で保存しようとした操作者が即座に理由を読める。明示 0 は従来どおり | L3 AC6 |
| Replacement path | not applicable | — |
| Data safety / evidence | 誤 0 記録の防止そのものが目的。既存 DB の過去誤記録は本 packet で遡及修正しない（非目的） | — |
| Reporting / accounting semantics | 棚卸し確定 → 在庫補正の入力品質向上。集計意味論は不変 | — |
| Manual verification | owner Windows native L3 で AC6 (i)-(v) | PR body |
| 環境・再現性 | 新設の環境依存なし | — |

## Design Readiness

- Existing design docs are sufficient because: 73 §73.5 が入力 → `update_count` の流れと負数 FieldError を規定済み。空欄規則の追記 1 文 + エラー表 1 行で契約が閉じる
- Source docs updated in this PR: `73-ui-stocktake.md` §73.5 / エラー表 / 更新履歴
- Design gaps intentionally deferred: リアルタイム検証（C6）、`type="number"` 化
- Durable decisions discovered in this plan and promoted to source docs: ST-C5-D1

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI 層 validation のみ。BIZ の負数検証は不変（防御的二重チェックの片側強化）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし（AC5）
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 新文言「数量を入力してください」（既存「0以上の数値を入力してください」と対にする）
- Error, empty, retry, and recovery behavior: 空欄 = FieldError、修正入力で再試行可。既存 mutation error 経路不変
- Testability and traceability IDs: T-C5-1〜4、REQ-205

## Contract Probe

- N/A: 外部 library / OS 依存の未検証前提なし。`Number("")===0` は ECMAScript 仕様（ToNumber of empty string = +0）で確定、Coordinator が `node -e 'console.log(Number(""), Number("  "), Number.isInteger(Number("")))'` 相当で再確認済み（0 0 true）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| 73 §73.5 step 4 新規: 空欄 / 空白のみは送信前 FieldError | `saveCount()` trim 空判定 | T-C5-1（Enter）/ T-C5-2（click）/ T-C5-3（空白） | L3 AC6 (i)(ii) |
| 73 §73.5 step 4 既存: 負数は送信前 FieldError | 不変 | T8 既存 | L3 AC6 (iv) |
| 明示 0 は正当な実数として保存 | 不変（ガードが 0 を拒否しない） | T-C5-4 | L3 AC6 (iii) |
| 73 §73.5 L202: 1 件保存ごとの toast なし | 不変 | 既存（Writer が `rg "toast" StocktakePage.test.tsx` で被覆有無を確認、無ければ契約不変につき追加不要） | — |
| Enter の `isComposing` guard（IME） | 不変 | 既存 test 実在を Writer が rg 確認、無ければ Matrix Adjacent Pattern Audit に「未被覆・契約不変」と記録 | L3 AC6 (v) |
| `update_count` wire（itemId, i64） | 不変 | AC5 bindings 差分ゼロ | — |

## Test Plan

- Test Design Matrix: [test-matrices/2026-09-02-stocktake-empty-count-guard.md](test-matrices/2026-09-02-stocktake-empty-count-guard.md)
- targeted tests: `npx vitest run src/features/stocktake/`
- negative tests: 空欄 / 空白 / 負数（既存）
- compatibility checks: 明示 0（T-C5-4）、既存 test 無改変、`cargo run --bin generate_traceability -- --check`
- data safety checks: fixture は synthetic のみ（既存 mock 流用）
- main wiring/integration checks: `cargo check --release`（L3 前、CI gate ではない）

## Boundary / Wire Contract

- producer: `StocktakePage.tsx` `saveCount()` → `useUpdateCount` → `commands.updateCount`
- consumer: `src-tauri` `update_count` command → `stocktake_service::update_count`
- wire type: `stocktake_item_id: i64`, `actual_count: i64`（不変）
- internal type: frontend `quantity: string` → `Number` → integer check
- precision/range: 0 以上の整数。空欄は wire に到達しない（新規）
- round-trip path: 保存 → 一覧 invalidate → 実数表示（不変）
- invalid input: 空欄 / 空白 → FieldError（新規）、負数 / 非整数 → FieldError（既存）、backend 負数 → `ValidationFailed`（既存）
- compatibility: wire 不変、bindings 差分ゼロ

## Review Focus

- ガードが `Number(quantity)` より前に置かれ、`trim()` 空判定であること（`=== "0"` や `!quantity` の誤判定でないこと）
- Enter 経路と click 経路の両方が同一ガードを通ること（`onKeyDown` の `isComposing` guard 不変）
- T-C5-4（明示 0）が非空期待の oracle として `updateCount` 呼出し引数 `0` を assert していること
- 既存 test の無改変、73 doc 追記の文言が実装 literal と一致（AC4）
- REQ token 追加時の 90-traceability 再生成同乗

## Spec Contract

Contract ID: SPEC-ST-C5

- SPEC-ST-C5-1: 数量欄が空欄または空白のみのとき、Enter / 保存操作は `update_count` を呼ばず FieldError「数量を入力してください」を表示する — Test: T-C5-1 / T-C5-2 / T-C5-3
- SPEC-ST-C5-2: 数量欄に `0` を明示入力したとき、`update_count(itemId, 0)` が呼ばれる — Test: T-C5-4
- SPEC-ST-C5-3: 負数 / 非整数の既存 FieldError「0以上の数値を入力してください」は不変 — Test: T8（既存）
- SPEC-ST-C5-4: `update_count` の wire shape と backend validation は不変 — Evidence: AC5 bindings 差分ゼロ、`stocktake_service.rs` に diff なし

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-ST-C5-1 | Scope 1 | T-C5-1 / T-C5-2 / T-C5-3 | ガード位置・両経路 | AC1 / AC2 / L3 (i)(ii) |
| SPEC-ST-C5-2 | Scope 1（拒否しない） | T-C5-4 | 非空期待 oracle | AC3 / L3 (iii) |
| SPEC-ST-C5-3 | 不変 | T8 | 既存 test 無改変 | AC1 / L3 (iv) |
| SPEC-ST-C5-4 | 不変 | — | wire 不変 | AC5 |
| 73 §73.5 追記 | Scope 2 | — | 文言一致 | AC4 / AC5 doc check |

## Data Safety

- 実店舗の棚卸し DB / backup / receipt image は commit しない
- local-only: `src-tauri/target/`、実 DB file
- synthetic-only: RTL の `vi.mock("@/lib/bindings")` fixture のみ

## Implementation Results

PR #27（`agent/stocktake-empty-count-guard`）。`saveCount()` 冒頭に `quantity.trim() === ""` ガード 4 行を追加し FieldError「数量を入力してください」で return、既存の負数 / 非整数分岐・`isComposing` guard・保存ボタン disabled 条件は不変。73 §73.5 step 4 に空欄規則 + ST-C5-D1 の理由を追記、§73.9 に UI 送信前ガード行（backend 不到達を明記）、更新履歴 dated 行。T-C5-1〜4 を追加（既存 test 無改変）。Adjacent Pattern Audit: 入庫 / 手動売上 / 返品交換 / 廃棄破損は `parseRequiredSafeInteger` で空欄拒否済み、同型の未ガード送信経路なし。REQ-205 は file-level token で足り traceability drift なし。exact SHA / test 件数 / evidence path は PR body を正とする。

## Review Response

- Final Review（Sonnet subagent fresh context、Plan Reviewer とは別個体）: P1/P2/P3 = 0、Goal Invariant 充足 = yes。Review-only sub-agent は実施済み（skip なし）。
- mutation 独立再実測（Coordinator 発注、隔離 worktree）: X1〜X4 全 kill、survivor なし。X4 の Matrix 期待列過少（P3、記録のみ）。追加探査 X5 は等価変異。
- Findings Freeze: frozen after Broad Audit; post-freeze exceptions: none.
