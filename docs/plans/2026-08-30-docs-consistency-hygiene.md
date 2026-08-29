# Plan Packet: docs 整合性衛生 batch — REQ-901 採番是正 + 表記同期 + 棚卸し母集団明記（wave 7 lane 1）

## Workflow State

- Phase: plan-draft
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable (Claude Code)
- Writer: Sonnet subagent (worker, fresh context)（docs + traceability comment 同期の lane のため §3.1「投入しない場合: … docs 同期」に従い希少 slot を Writer に充てない。Plan Reviewer / Final Reviewer とはそれぞれ別の fresh context で独立性を維持）
- Plan Reviewer: Sonnet subagent (independent)
- Final Reviewer: Sonnet subagent (independent)
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: pending Ready 承認（画面挙動・runtime 契約に不接触のため視覚確認・L3 は非該当）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 15分
- relay 往復上限: 2（本 lane は Codex 発注なしのため実消費 0 見込み）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs の採番・表記・理由記述の現況同期 + test file の REQ traceability comment 差替え + 90-traceability 再生成。runtime 挙動・wire 契約・画面挙動のいずれにも触れないが、REQ 採番と design doc の記述は将来の判断トリガーと traceability 集計を規定するため、semantic な docs change として R2（R0 の non-semantic cleanup には該当しない）。

## Goal

Goal Invariant:

### 最小完了条件

- backup-restore の UI-11b 文脈（live docs / frontend test comment）の対応 REQ が REQ-901 に統一され、REQ-905 は設定管理（CMD-11 / UI-11a。D-036 承認済みの CMD-11 backup/restore 系 test タグを含む）のみを指す。90-traceability は再生成済みで `--check` PASS。
- 78 §78.4 の `SupplierWithUsage` field 表記が実 wire（snake_case）と一致する。
- ARCHITECTURE.md の CMD-11 依存行が cmd 層の実 import 実査と一致する。
- decision-log D-052 に E1 語義注記が入り、D-052-E1 が UI_TECH_STACK §2.5 除外表の一意な意味に確定する。
- 35-biz / 73-ui に棚卸しカウント除外の母集団（issue #91 owner 回答）が明記される。
- 70-mnt の起動サンプル・説明が実コード（`run_startup_step` 方式）と同期する。

### 失敗定義

- UI-11b（BackupRestorePage 関連の live docs / frontend test comment）文脈の REQ-905 が 1 箇所でも残る。CMD-11 backup/restore コマンド群の既存 REQ-905 タグ（`src-tauri/src/cmd/settings_cmd.rs` 等、D-036 前例）は対象外で無改変が正。
- 是正で書く新文言が正本（requirements.md / issue #91 owner 回答 / lib.rs 実装 / 40-cmd-product.md）と食い違う。
- 90-traceability を再生成以外の方法（手編集）で更新する。

### 非目的

- REQ-905（設定管理）側の定義・使用箇所の変更。
- 棚卸し除外品のシステム表現追加（除外品は商品マスタ外で表現しない owner 方針の維持）。
- 70-mnt の他節整理・診断ログ実装の変更。
- Backlog の他項目。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

起草時実査 2026-08-30（各 anchor は Coordinator が `rg` で実在確認済み）:

**S1. REQ-905 → REQ-901 採番是正（backup-restore 文脈のみ、Backlog「REQ-905 の採番 drift」の owner 裁定 = 案 a）**

1. `docs/function-design/68-ui-backup-restore.md` L4 `> 対応REQ: QR-05 / REQ-905` → `QR-05 / REQ-901`
2. `docs/FUNCTION_DESIGN.md` L51 / L148 の `QR-05 / REQ-905` → `QR-05 / REQ-901`
3. `docs/SCREEN_DESIGN.md` L136 `**対応仕様**: QR-05 / REQ-905（バックアップ・復元、設定・ログ・バックアップ系 CMD）` → REQ-901 へ差替え（括弧内説明はバックアップ・復元の実態に合わせて簡潔化可）
4. `src/features/backup-restore/BackupRestorePage.test.tsx` の REQ-905 token（起草時実査 `rg -c` = 14）→ REQ-901（comment / traceability ID のみ、assert・挙動は無改変）
5. `docs/spec/requirements.md` L38 REQ-901 行の対応列 `MNT-01` → `MNT-01, UI-11b`（test が実在する layer への最小追記。REQ-905 行 L42 は無改変）
6. `cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成（手編集禁止）

※ src-tauri 側の REQ-905 参照（settings_cmd.rs 10 / system_service.rs 2 / cmd/mod.rs 7 / system_repo.rs 5 hit、起草時実査 `rg -c`）は設定管理の正当な使用のため無改変。

**S2. 78 §78.4 field 表記是正**

7. `docs/function-design/78-ui-supplier-management.md` L67 の `productCount` / `receivingRecordCount` → `product_count` / `receiving_record_count`（正 = `docs/function-design/40-cmd-product.md` L234 の `SupplierWithUsage` 定義および実 wire〈Rust struct / specta 生成 TS〉、起草時実査で一致確認済み）

**S3. ARCHITECTURE CMD-11 依存行の実査是正**

8. Writer は `docs/architecture/cmd-task-specs.md` CMD-11 表の既存 mapping（`list_logs → BIZ-09` 等、MNT-02 は全 command に不登場 — Plan Review round 1 予備実査済み）を一次証拠とし、`rg -n "mnt" src-tauri/src/cmd/` 等の実 import 実査を補強証拠として cmd 層の MNT consumption を確定する（`biz::system_service` 経由の間接呼び出しを MNT 直接消費と誤認しないこと）。CMD-11 配下 command に MNT-02（操作ログ管理）の直接消費が無ければ `docs/ARCHITECTURE.md` L153 依存列から MNT-02 を削除し、L228 の flow 行 `MNT-02 → CMD-11 → …` を実態へ是正する。直接消費が有れば逆に `docs/architecture/cmd-task-specs.md` CMD-11 節（L111-128 付近）へ mapping を追記する。いずれの分岐でも実査証跡（rg 出力要旨）を PR body へ記録する。L187 の MNT-02 定義行・L305 の履歴行は無改変。

**S4. D-052 E1 語義注記**

9. `docs/decision-log.md` D-052 節へ注記 1〜2 行を追加: D-052-E1 は `docs/UI_TECH_STACK.md` §2.5 除外表の E1（operation_logs 系 invalidation 除外）を指す一意 ID とし、旧 `src/lib/query-keys.ts` の literal 例外容認を指した用法は PR #29（2026-07-28）でコード側から撤去済みの歴史的用法である旨。archive 文書は無改変。

**S5. 棚卸しカウント除外の母集団明記（owner 同意 2026-08-30、issue #91 close の残作業）**

10. `docs/function-design/35-biz-stocktake-service.md`（`## 20. BIZ-06: 棚卸しロジック` 配下）と `docs/function-design/73-ui-stocktake.md` のカウント対象記述箇所へ、issue #91 owner 回答（2026-08-22）を明記: 除外基準は年数でなく原価根拠の有無（伝票保管義務範囲外で廃棄済み・取引先データなし・バーコードなし・販売に適さない見た目）、規模は例年 1〜2 点・多い年で 4〜5 点。システムでは除外品を表現しない（単品コード非付与 = 商品マスタ外、部門キーで商品非連動販売、復活時は新規登録）。挿入節は Writer が両 doc の対象定義の実在節を特定して選び、Final Review が配置妥当性を突合する。

**S6. 70-mnt 起動サンプル同期**

11. `docs/function-design/70-mnt-diagnostic-log.md` L174-229 付近の起動サンプル・説明を実コード `src-tauri/src/lib.rs`（`run_startup_step` L84 定義、起草時実査）と突合し、乖離箇所のみ同期する（一律の `.expect` 排除ではなく実装準拠。`app_data_dir取得失敗` の `.expect` サンプルは失効確定、tauri boilerplate の `.expect` は実装と一致すれば残置可）。

各 doc に更新履歴節が存在する場合は dated 形式で要旨 1 行を追記する（自 PR 番号は plan-first commit 時点では割当前のため非転記。既存の「（本 PR）」プレースホルダ慣習に合わせる）。

## Non-scope

- REQ-905（設定管理）の定義・使用箇所の変更 / `docs/spec/requirements-coverage.md`（QR-05 行は現況適合、起草時実査）。
- 90-traceability の手編集。
- runtime code・test assert の変更（S1-4 は comment token のみ）。
- Dockerfile / .gitignore / scripts（wave 7 lane 2 の footprint、file 非重複）。
- Plans.md（Coordinator 管理、closeout で同期）。

## Acceptance Criteria

- AC-1: `rg -c "REQ-905" docs/function-design/68-ui-backup-restore.md docs/FUNCTION_DESIGN.md docs/SCREEN_DESIGN.md src/features/backup-restore/BackupRestorePage.test.tsx` が全 file hit 0（exit 1）。
- AC-2: `rg -F -c "REQ-901" src/features/backup-restore/BackupRestorePage.test.tsx` ≥ 1、`rg -F -c "REQ-901" docs/function-design/68-ui-backup-restore.md` ≥ 1、`rg -F -c "REQ-901" docs/FUNCTION_DESIGN.md` ≥ 2、`rg -F -c "REQ-901" docs/SCREEN_DESIGN.md` ≥ 1（新採番 exact presence の対 oracle、AC-1 の全 4 file をカバー）。
- AC-3: `cd src-tauri && cargo run --bin generate_traceability -- --check` PASS。
- AC-11: `rg -F -c "MNT-01, UI-11b" docs/spec/requirements.md` ≥ 1（S1-5 の対応列追記の oracle）。
- AC-4: `rg -c "productCount|receivingRecordCount" docs/function-design/78-ui-supplier-management.md` hit 0（exit 1）かつ `rg -F -c "product_count" docs/function-design/78-ui-supplier-management.md` ≥ 1。
- AC-5: `rg -F -c "run_startup_step" docs/function-design/70-mnt-diagnostic-log.md` ≥ 1 かつ `rg -F -c "app_data_dir取得失敗" docs/function-design/70-mnt-diagnostic-log.md` hit 0。
- AC-6: `rg -F -c "原価根拠" docs/function-design/35-biz-stocktake-service.md` ≥ 1 かつ `rg -F -c "原価根拠" docs/function-design/73-ui-stocktake.md` ≥ 1。
- AC-7: `rg -F -c "D-052-E1" docs/decision-log.md` ≥ 1（注記の存在。語義の正しさは Final Review が UI_TECH_STACK §2.5 / 75-ui L47 と突合）。
- AC-8: `bash scripts/doc-consistency-check.sh` PASS（ERROR 0）。
- AC-9: `npm test` の BackupRestorePage.test.tsx が PASS（comment 変更のみで挙動不変の確認）。
- AC-10: S3 是正後の `rg -n "MNT-02" docs/ARCHITECTURE.md` 残 hit がすべて実査結果と整合（Final Review が実査証跡と突合。L187 定義行・L305 履歴行は残存想定）。

## Design Sources

- Requirements / spec: `docs/spec/requirements.md`（REQ-901 / REQ-905 定義の正本。L38 対応列のみ最小追記）
- Architecture: `docs/ARCHITECTURE.md`（本 PR で実査同期）/ `docs/architecture/cmd-task-specs.md`（S3 分岐時のみ）
- Function / command / DTO: `docs/function-design/40-cmd-product.md` L234（正本・無改変）/ 68-ui / 78-ui / 70-mnt / 35-biz / 73-ui（本 PR で同期）
- DB: 変更なし
- Screen / UI: `docs/SCREEN_DESIGN.md` L136（本 PR で同期。画面挙動は不変）
- Decision log / ADR: `docs/decision-log.md` D-052（E1 語義注記を本 PR で追加）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし（doc 表記のみ） | existing sufficient |
| Command / DTO / generated binding / wire shape | なし（wire 実体無改変、78 doc を wire に合わせる） | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | SCREEN_DESIGN L136 / 73-ui 母集団明記（画面挙動不変） | updated in this PR |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | decision-log D-052 E1 語義注記 | updated in this PR |

## Registration / Generation Obligations

- 90-traceability 再生成（S1-6）: REQ token を触る変更の完了条件（PR #72 教訓・T1 drift 検査対象）。
- 他の生成物（bindings / routeTree）は非接触。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-901 / QR-05 | requirements.md L38（正本） | owner 裁定 2026-08-30 = 案 a | backup-restore 文脈を REQ-901 へ是正。requirements.md 側の定義変更（案 b）は設定管理定義と衝突するため却下 | S1（4 doc + test comment + 再生成） | AC-1/2/3/AC-11 |
| UI-15 / SupplierWithUsage | 40-cmd-product.md L234（正本） | PR #4 Final Review P3-1 起源 | doc 側 camelCase が実 wire と乖離 | S2 | AC-4 |
| CMD-11 | ARCHITECTURE.md L153/L228 | 順12 Final Review P3-1 起源 | 実 import 実査に基づく表記一致（削除 or mapping 追記の実査分岐） | S3 | AC-10 |
| D-052-E1 | UI_TECH_STACK §2.5（正本） | 順17 plan-gate round 1 P3 起源 | 歴史的 ID 衝突の語義確定（新 ID 分離は衝突相手が撤去済みのため不要） | S4 | AC-7 |
| BIZ-06 / UI-10 | issue #91 owner 回答 2026-08-22 | owner 同意 2026-08-30 で close 残作業 | 母集団を doc へ明記、システム表現追加は不採用（owner 方針） | S5 | AC-6 |
| MNT-04 | src-tauri/src/lib.rs（実装正） | PR 系 Plan Review P3-1 起源 | サンプルの `.expect` 前提が `run_startup_step` 実装と乖離 | S6 | AC-5 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（各是正の正本は requirements.md / 40-cmd / UI_TECH_STACK / issue #91 回答 / lib.rs に既在し、本 PR は同期のみ）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: S4（E1 語義）を decision-log へ、S5（母集団）を 35-biz / 73-ui へ本 PR で昇格
- Assumptions and constraints: 90-traceability は生成物であり手編集しない
- Deferred design gaps, risk, and follow-up target: 操作ログ producer 0 件（既存 backlog、本 lane 非接触）
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix は R2 optional 判定で省略（機械 oracle は AC-1〜AC-10）
- Absolute guarantee / escape hatch self-check completed: 該当なし（保証文言の新設なし）

## Impact Review Lenses

not applicable — 起点はすべて repo 内実査（PR #17 Plan Review round 2 発見の採番 drift、および backlog 起票済み項目）であり、実地調査・実機・外部 tool・POS 連携・format 変更のいずれにも該当しない。

## Design Readiness

- Existing design docs are sufficient because: 各是正の正本（requirements.md / 40-cmd-product.md / UI_TECH_STACK §2.5 / issue #91 owner 回答 / lib.rs 実装）が確立済みで、本 PR はそれらへの同期のみ。新規設計判断は含まない
- Source docs updated in this PR: Scope S1〜S6 の列挙どおり
- Design gaps intentionally deferred: なし
- Durable decisions discovered in this plan and promoted to source docs: S4 / S5（上記 Audit 参照）

Minimum design checks:

- Layer ownership: 非該当（docs + comment 同期）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし（doc 表記を wire に合わせるのみ）
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 画面文言は不変（design doc の記述のみ）
- Error, empty, retry, and recovery behavior: 変更なし
- Testability and traceability IDs: REQ token 変更は S1 のみ、再生成 + `--check` で担保

## Contract Probe

N/A — 外部前提なし（rg 実査と repo 内正本のみの R2 docs + comment 同期）。

## Contract Coverage Ledger

R2 簡易版（触れる契約行のみ）:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| REQ-901 対応表記（backup-restore） | S1 | AC-1/AC-2/AC-3/AC-11 | non-scope（画面不変） |
| SupplierWithUsage wire 表記 | S2 | AC-4 | non-scope |
| CMD-11 依存表記 | S3 | AC-10（実査突合） | non-scope |
| D-052-E1 語義 | S4 | AC-7 | non-scope |
| 棚卸しカウント母集団 | S5 | AC-6 | non-scope |
| 起動 failure 可視化サンプル | S6 | AC-5 | non-scope |

## Test Plan

Test Design Matrix は R2 optional 判定で省略（理由: docs + comment 同期で oracle は AC-1〜AC-10 に機械化済み。挙動変更なし）。

- targeted tests: `npm test`（BackupRestorePage.test.tsx、AC-9）
- negative tests: 不要
- compatibility checks: `bash scripts/doc-consistency-check.sh`（AC-8）/ `cargo run --bin generate_traceability -- --check`（AC-3）
- data safety checks: N/A
- main wiring/integration checks: L1 full（Ready 前の exact HEAD で実行）

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない（wire 型実体は無改変、doc 表記を実 wire に合わせるのみ）。

## Review Focus

- 新文言の事実正確性（REQ-901 定義・issue #91 回答・lib.rs 実装・40-cmd L234 との突合）
- S1 の sweep 境界: 設定管理側 REQ-905（src-tauri 4 file + requirements.md L42）を巻き込んでいないこと
- S3 の実査分岐の判断が rg 証跡付きで正しいこと
- 90-traceability が再生成物であり手編集痕がないこと
- 更新履歴 dated 行が既存行無改変で追記されていること

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

### Plan Gate 記録（append-only）

- owner 起票承認 2026-08-30（wave 7 衛生 batch 起票の会話にて。B-6 = 案 a / B-5 同意 / 2 lane 編成の owner 裁定を含む。本 lane 介入 1/3）。
- Plan Gate rally round 1（独立 Sonnet Plan Reviewer、2026-08-30）: P1: 1 / P2: 2 / P3: 2。P1-1 = AC-2 の対 oracle が AC-1 対象 4 file 中 2 file しかカバーせず「REQ-905 を削るだけ」mutant を素通し → AC-2 を全 4 file へ拡張。P2-1 = 失敗定義が D-036 承認済みの CMD-11 backup/restore 系 REQ-905 タグ（settings_cmd.rs、Coordinator 実証確認済み）と字面衝突 → UI-11b 文脈へ限定。P2-2 = S1-5（requirements.md 対応列）に oracle なし → AC-11 追加。P3-1 = S3 の一次証拠を cmd-task-specs 表へ変更（reviewer 予備実査で「MNT-02 削除」分岐が正と確認済み）。P3-2 = D-050 帰属の不正確な引用を実務根拠の文言へ差替え。全採用、in-place 是正（plan-draft 中の pre-gate 是正）。round 2 の delta 再検証で新規指摘 0 を確認して plan-gate 通過とする。
- Plan Gate rally round 2（独立 Sonnet Plan Reviewer delta 検証、2026-08-30）: round 1 の 5 findings 反映を 1 対 1 で全件確認。oracle 構文の実測検証（reviewer 実測: AC-1 の `rg -c "REQ-905"` は対象 file 全てで hit あり = 未達成側、AC-2・AC-11 の `rg -F -c "REQ-901"` / `rg -F -c "MNT-01, UI-11b"` は hit なし = 未達成側。実装後に充足へ反転する対構造）健全。新規 P1/P2 = 0、新規 P3 = 1（Design Intent Trace / Ledger の Test target 欄に AC-11 未反映の cross-reference 漏れ）→ reviewer 修正案どおり in-place 反映（本記録と同 commit）。rally 収束、plan-gate 通過。
