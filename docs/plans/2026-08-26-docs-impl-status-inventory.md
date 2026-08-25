# Plan Packet — docs 実装状況表記の一括棚卸し（stale 表記の是正 + REQ-206/207 coverage 昇格）

## Workflow State

- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Claude Fable 5
- Writer: Codex（GPT-5.6 系、発注書駆動）
- Plan Reviewer: Claude Sonnet 5（独立 fresh context、D-062）
- Final Reviewer: Claude Sonnet 5（独立 fresh context）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: pending = ① Plan Gate 承認 ② Ready 承認（操作画面の挙動変更なしのため human visual confirmation は非該当）

Hosted CI 判定根拠: ci.md の R2 行「source contract 影響がある場合だけ必須」— 「source contract」に設計書 prose を含むかの明文定義は repo になく、本 change が設計正本（SCREEN_DESIGN / function-design 4 doc / spec/requirements.md）+ traceability gate 入力（coverage 列）を編集することから **required は安全側の Coordinator 判断**である。docs-only は `paths-ignore` で Ready event の自動 run が発生しないため、owner Ready 後の `workflow_dispatch` で 1 run を取得する（rehome PR #1 @ inventory-system-desktop と同型の経路）。

## Owner Effort Budget

- 介入回数上限: 2（Plan Gate / Ready）
- 実働時間上限: 15分
- relay 往復上限: 2（発注 lane 単位）
- Plan Review round 天井: 3（既定 3）

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only の表記整理 + requirements.md の coverage 列変更（REQ-206/207 の deferred → required）+ 生成物 90-traceability の再生成。runtime code / test / bindings / DB / wire に非接触。coverage 列は traceability gate の入力だが、昇格 2 件は test 実在を実測済みで WARN を生まない（下記実査）。挙動契約・workflow gate の変更なし。

## Goal

Goal Invariant:

### 最小完了条件

- docs の実装状況表記が実装の実態と一致する: 実装完了済みの画面・機能に「実装予定 / Phase n 実装予定 / 未実装 / Design Phase 追加（のみ）」系の stale 表記が残らず、REQ-206/207 が `coverage=required` として traceability に正しく反映される。

### 失敗定義

- stale 表記の是正が挙動契約の文言まで書き換えてしまう（表記整理を超えた設計変更の混入）。
- REQ-208 を昇格して T3 WARN を発生させる、または REQ-206/207 昇格で traceability gate が fail する。
- 本当に未実装の項目（stocktake 詳細 route / REQ-208 取消・訂正 / 在庫照会 disabled CTA の実コード）を「実装済み」と書き換える。

### 非目的

- 実装 code の変更（在庫照会 disabled CTA の stale tooltip は実コード側の課題 — backlog 起票で扱い、本 change では触れない）。
- 設計契約そのものの改訂・新設計。
- docs/archive/** / docs/plans/**（過去 packet）の遡及修正（非遡及原則）。
- REQ-208 の実装または昇格。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。

## Scope

実査 inventory（2026-08-26、read-only agent による rg 全数 sweep + 実装突合。総 hit 54 / stale 14 / 要裁定 18 / 非該当 22）に基づく編集対象:

1. `docs/SCREEN_DESIGN.md`: §1 画面表の状態列 8 箇所（「Design Phase 追加」「Phase 4 実装予定」→「実装済み」表記へ統一）+「18 操作ログ」行の「Draft / Phase implementing」残骸 + Phase 4 節（L424 付近）の「v1.0.0 タグ目標」未達列挙を「Phase 4（完了）」実績記録へ改題 + 最終更新ヘッダ。
2. `docs/FUNCTION_DESIGN.md`: UI-11b/11a/10/11c/13 の「Design Phase 追加済み」10 箇所へ「（実装済み）」を追記（履歴文言は削除しない — 当時の改訂記録として正、実装完了の明示欠落だけを埋める）。
3. `docs/function-design/52-ui-shared-layout.md`: L161「残り 18 項目（route 未実装、Phase 2 以降で順次 active 化）」と付随する pending 前提の a11y 説明を、実態（navigation 全 22 項目 active・pending 0 件。pending 機構は将来 route 追加時の予備実装）へ修正。L229 の activeMatch 契約行の「残り 18 項目」は実測 20 項目（22 − activeMatch 2）と不一致のため、数値非依存の表現（例:「`activeMatch` を持たない残りの項目」）へ是正する — 挙動契約（既存 `<Link>` 経路の無変更維持）は不変、数値表記のみ。
4. `docs/function-design/65-inventory-record-traceability.md` L228（1 箇所。L252 は決定 ID 名の参照であり無変更）/ `74-ui-operation-logs.md` L57・L243・L564（3 箇所。L564 は §74.16 非目的表の row で、csv_import / stocktake の両 route を「未実装」と束ねているため csv_import 側だけ実態へ分離する）: `csv_import` の許可リスト除外理由を「詳細 route が未実装のため」から「詳細 route は実装済み。ただし csv_import 系 `record_type` を書き込む producer が 0 件のため、allow-list への追加は producer 側 record_type 採用（既存 follow-up）と併せて行う」へ差し替え（PR 番号は転記しない）。`stocktake` は「詳細 route 未実装のため除外」のまま維持（実態どおり）。除外契約そのものは不変で、trigger 記述の是正のみ（この点は Review Focus で確認）。`66-ui-stock-movements.md` は csv_import 固有記述が存在しない（rg 0 hit 実測）ため編集対象外 — L67 の UI-06c-D7「元記録 route がまだ未実装でも…」は csv_import / stocktake 双方に適用される汎用契約であり無編集維持。
5. `docs/function-design/68-ui-backup-restore.md`: `checkAutoBackup` 60 秒 interval の「frontend 未実装」2 箇所 → 実装済み（`BackupRestorePage.tsx` の interval + invalidate + toast）の契約説明へ更新。
6. `docs/spec/requirements.md`: REQ-206 / REQ-207 の coverage を `deferred` → `required` へ昇格。REQ-208 は `deferred` 維持（理由 = 取消・訂正は未実装・test 0 件、実査で確定）。あわせて L51 の脚注「REQ-206〜208 は実装着手まで `coverage=deferred` とする。」を「REQ-208 は実装着手まで `coverage=deferred` とする。」へ書き換える（表本体との新規矛盾を作らないため）。
7. `docs/function-design/90-traceability.md`: `cargo run --bin generate_traceability` で再生成（coverage 変更の追随、同 commit）。

表記規約（Writer 向け、SPEC-DSI-D3）: **新規に書く**状態表記は「実装済み」とし、PR 番号の転記はしない（証跡は Plans.md / archive が正本。repo rehome により旧 repo と新 repo で PR 番号空間が重複しており、裸の PR 番号引用は曖昧になるため）。**既存の PR 番号記載**（SCREEN_DESIGN「18 操作ログ」行の「PR #164で実装済み」等）は履歴として据え置き、削除しない — Scope 1 の「統一」は「実装済みであることが状態列から読める」ことの統一であり、文字列の完全同一化ではない。

## Non-scope

- 在庫照会 `StockDetailContent.tsx` の disabled CTA tooltip「Phase 3 で実装予定」（実コードの UX stale — 利用者に誤情報表示中）: 実装 change として backlog 起票し、対応する 58-ui L505-506 の記述も現行 code の記述として本 change では無改変（code と doc を同時に直す別 change の scope）。
- DEV_SETUP_CHECKLIST.md のバージョンタグ時点履歴 / Plans.md の完了ログ / 監査 findings（p6/p7）/ spec 汎用定義: 実査で非該当と判定済み、無改変。
- PROJECT_HANDOFF.md（直近更新済み、実査でも stale 検出なし）。
- 実装 code / test / bindings / routes / navigation の変更。

## Acceptance Criteria

- AC-1: `rg -c -F "Phase 4 実装予定" docs/SCREEN_DESIGN.md` と `rg -c -F "Design Phase 追加" docs/SCREEN_DESIGN.md` がともに file 全体で 0（実査で全 hit が §1 表・L5 ヘッダ・Phase 4 節の編集対象内にあることを確認済み。免除枠なしの完全一致 oracle）。
- AC-2: `rg -c -F "route 未実装、Phase 2 以降で順次 active 化" docs/function-design/52-ui-shared-layout.md` が 0（編集前 1）かつ `rg -c -F "残り 18 項目" docs/function-design/52-ui-shared-layout.md` が 0（編集前 2 — L161 は実態修正、L229 は数値非依存化で解消。文言は半角スペース入り「残り 18 項目」が正 — スペース抜き「残り18項目」は 0 hit の別文字列）。
- AC-3: `rg -c -F "未実装" docs/function-design/68-ui-backup-restore.md` が 0。
- AC-4: 65 / 74 の 2 doc（65 L228 / 74 L57・L243・L564）で、csv_import を「詳細 route が未実装」とする旧理由文言が 0 hit（L564 の非目的表 row を含む — `rg -n "csv-import/records" docs/function-design/74-ui-operation-logs.md` の各 hit 行で csv_import が未実装主張されていないこと）、新理由（producer record_type 0 件由来）文言が各該当箇所に存在（対 oracle: 新 ≥1 / 旧 0）。stocktake の「詳細 route 未実装のため除外」記述は維持。`66-ui-stock-movements.md` は `git diff` 無変更。
- AC-5: `docs/spec/requirements.md` の REQ-206 / REQ-207 行が `required`、REQ-208 行が `deferred`（rg で 3 行を提示）、かつ L51 脚注が「REQ-208 は実装着手まで `coverage=deferred` とする。」であること（旧文言「REQ-206〜208 は…」は 0 hit）。
- AC-6: `cd src-tauri && cargo run --bin generate_traceability -- --check` PASS（T1 drift 0、REQ-206 / REQ-207 の T3 WARN 非出現、REQ-208 は deferred のため T3 対象外のまま）。
- AC-7: `bash scripts/doc-consistency-check.sh` ERROR 0 かつ新規 WARN 0（起草時 baseline は WARN 5 件 — 2026-08-26 実測、いずれも本 change 非関連の既存）。
- AC-8: `git diff --stat` の変更 file が Scope 列挙の docs 7 点 + `docs/Plans.md`（entry 同期）のみ（src / src-tauri / 設定 file の変更 0）。

## Design Sources

- Requirements / spec: `docs/spec/requirements.md`（REQ-206〜208、coverage 定義は同 doc L6）
- Architecture: 変更なし
- Function / command / DTO: 表記整理のみ（52 / 65 / 66 / 68 / 74 の該当節。挙動契約は無改変）
- DB: 変更なし
- Screen / UI: `docs/SCREEN_DESIGN.md` §1 / Phase 4 節（状態表記のみ）
- Decision log / ADR: D-050（volatile 転記回避 — PR 番号非転記の表記規約の根拠）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし（表記のみ） | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | SCREEN_DESIGN §1 の状態表記（挙動契約非接触） | updated in this PR（表記のみ） |
| CSV / TSV / report / import / export format | 該当なし | 該当なし |
| Durable decision / ADR | 不要（表記規約は本 packet の適用裁定、durable design ではない） | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| 新規 command / doc / route / 画面 | 該当なし |
| REQ coverage 変更（REQ-206/207 昇格） | `cargo run --bin generate_traceability` で `90-traceability.md` 再生成（AC-6、同 commit） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-206 / REQ-207 | requirements.md coverage 列 | SPEC-DSI-D1 | test 実在（12 file / 4 file、rg 実測）で昇格可、WARN なし | coverage 列 + 90-traceability 再生成 | AC-5 / AC-6 |
| REQ-208 | requirements.md coverage 列 | SPEC-DSI-D2 | 未実装・test 0 のため昇格は T3 WARN を確実発火 → deferred 維持 | 無改変 | AC-5 / AC-6 |
| — | SCREEN_DESIGN §1 ほか stale 表記 | SPEC-DSI-D3 | 状態列は「実装済み」統一・PR 番号非転記（rehome による番号空間重複 + D-050） | Scope 1〜5 | AC-1〜AC-4 |

## packet-local 決定（SPEC-DSI-D1〜D4）

- **SPEC-DSI-D1**: REQ-206 / REQ-207 を `required` へ昇格する。根拠 = 対応 UI（入出庫記録一覧・5 種詳細 route / 在庫変動履歴の相互参照）実在 + test 参照実測（REQ-206 = 12 test file / 31 hit、REQ-207 = 4 test file / 8 hit、`rg -n "REQ-20n" src src-tauri --glob '*test*'` 2026-08-26 実測）。昇格後も T3 WARN なし見込み。
- **SPEC-DSI-D2**: REQ-208（取消・訂正）は `deferred` 維持。根拠 = 実装参照・test 参照とも 0 件（rg 実測）、`is_voided` カラムは未使用プレースホルダ。昇格には機能実装（別 R3 change）が先行条件。
- **SPEC-DSI-D3**: 状態表記の規約 = 新規に書く表記は「実装済み」とし裸 PR 番号を転記しない（rehome で旧 repo / 新 repo の PR 番号空間が重複、かつ D-050 の volatile 転記回避）。既存の PR 番号記載と「Design Phase 追加済み」等の改訂履歴文言は削除せず据え置き、実装完了の明示だけを追記する（非遡及・履歴保全。「統一」は実装済みと読めることの統一であり文字列の完全同一化ではない）。
- **SPEC-DSI-D4**: 在庫照会 disabled CTA（実コード stale）は本 change の Non-scope とし、backlog 起票で code + 58-ui doc を同時に直す別 change へ委ねる。docs-only の本 change で 58-ui だけ先に直すと doc と実 code が乖離するため。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable（docs 表記のみ） | — |
| Fact check / design decision split | applicable — 実査 inventory（54 hit の実装突合、REQ-206〜208 の test 実測）が観測事実、SPEC-DSI-D1〜D4 が裁定 | 本 packet Scope / packet-local 決定 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | not applicable（画面挙動変更なし。実コード stale は backlog へ） | Non-scope |
| Replacement path | not applicable | — |
| Data safety / evidence | 実店舗データ非接触（docs のみ） | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 不要（機械 oracle で全 AC 検証可能） | — |
| 環境・再現性 | not applicable | — |

## Design Readiness

- Existing design docs are sufficient because: 本 change は設計の新設・改訂ではなく、実装状況の表記を実態（navigation active 全 22 項目 / routes 実在 / traceability covered）に同期させる整理。挙動契約の文言は無改変。
- Source docs updated in this PR: Scope 1〜6 の表記のみ。
- Design gaps intentionally deferred: 在庫照会 disabled CTA（SPEC-DSI-D4、backlog）/ stocktake 詳細 route（実態どおり未実装のまま記載維持）/ REQ-208。
- Durable decisions discovered in this plan and promoted to source docs: なし。

## Contract Probe

（R2 のため必須ではないが、実査の観測事実を記録する。いずれも 2026-08-26 実測）

- navigation 全項目 active: nav item は 22 項目すべて `"active"`・pending 0 件・`activeMatch` 保持 2 項目（`rg -c 'status: "active"' src/config/navigation.ts` = 22、activeMatch の item 使用 = L91/L203 の 2 箇所、file 自身の comment L54「4 エリア × 22 項目」とも一致。2026-08-26 構造カウントで実測 — 実査 agent の「20」と round 1 是正の「24」は、型定義行と `search.status` field を含む naive `rg -c 'status:'` の誤カウントだった）。
- csv_import 詳細 route 実在: `src/routes/csv-import.records.$importId.tsx`（PR #58）。stocktake 詳細 route 不在。
- `checkAutoBackup` interval 実装済み: `BackupRestorePage.tsx` L169-183。
- REQ-206/207/208 の test 参照: 12 file / 4 file / 0 file（SPEC-DSI-D1/D2 の実測コマンド参照）。
- doc check baseline: `bash scripts/doc-consistency-check.sh` を 2026-08-26 に実行し「結果: WARN 5 件（ERROR なし）」を実測（PR C closeout 時の stash 比較で merge 済み main と同数 = 本 change 非関連の既存）。

## Contract Coverage Ledger

R2 docs-only のため簡易形（挙動契約の変更なし）。編集対象 7 点 × 対応 AC の対照は Scope / AC 節が正本。挙動契約行の凍結（旧文言の意味変更禁止）は Review Focus と AC-8 で防御する。

| 対象 | 変更の性質 | 検証 |
|---|---|---|
| SCREEN_DESIGN §1 / Phase 4 節 / ヘッダ | 状態表記のみ | AC-1 |
| FUNCTION_DESIGN 10 箇所 | 実装完了の追記のみ | Review Focus（追記形式） |
| 52 / 65 / 66 / 68 / 74 | 実態同期（挙動契約文言は不変） | AC-2〜AC-4 |
| requirements.md + 90-traceability | coverage 列 2 件昇格 + 再生成 | AC-5 / AC-6 |

## Test Plan

- Test Design Matrix: R2 docs-only につき省略（Risk Tiers の optional 判定。機械 oracle は AC-1〜AC-8 に集約、手動確認項目なし）。
- targeted tests: `bash scripts/doc-consistency-check.sh`（AC-7）+ `generate_traceability -- --check`（AC-6）。
- negative tests: AC-4 の対 oracle（新文言 ≥1 / 旧文言 0）、AC-5 の REQ-208 deferred 維持。
- compatibility checks: AC-8（docs 外変更 0）。
- main wiring/integration checks: `bash scripts/local-ci.sh changed` → merge 前 L1 full。

## Boundary / Wire Contract

not applicable（JSON / CSV / DTO / bindings / DB 非接触。90-traceability は生成物の再生成のみ）。

## Review Focus

- 表記整理が挙動契約の文言を書き換えていないか（特に 52 の pending 機構説明、65/74/66 の除外契約 — 除外自体は維持で理由だけ差し替え）。
- 「実装済み」へ倒してよい根拠が実在するか（navigation / route の実在と突合。stocktake 詳細 route と REQ-208 を誤って「実装済み」化していないか）。
- FUNCTION_DESIGN の追記が履歴文言を消していないか（SPEC-DSI-D3）。
- 90-traceability 再生成が同 commit に含まれ、T3 WARN の増減が SPEC-DSI-D1/D2 の予測どおりか。

## Spec Contract

Contract ID: SPEC-DSI

- SPEC-DSI-C1: 実装完了済みの画面・機能について、対象 7 doc に「実装予定 / Phase n 実装予定 / 未実装」系の stale 表記が残らない（AC-1〜AC-4）。
- SPEC-DSI-C2: REQ-206 / REQ-207 = required、REQ-208 = deferred（AC-5 / AC-6）。
- SPEC-DSI-C3: 変更は docs のみで、挙動契約・実装・test に影響しない（AC-7 / AC-8）。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-DSI-C1 | Scope 1〜5 | AC-1〜AC-4 | 実在突合・契約文言凍結 | rg 出力（PR body） |
| SPEC-DSI-C2 | Scope 6〜7 | AC-5 / AC-6 | WARN 予測どおり | generate_traceability 出力 |
| SPEC-DSI-C3 | 全体 | AC-7 / AC-8 | docs 外変更 0 | git diff --stat |

## Data Safety

- 実店舗データ非接触（docs のみ）。commit 禁止対象の新規発生なし。
- local-only paths: `.local/ci-evidence/`。
- synthetic-only paths: 該当なし。

## Implementation Results

（実装後に記入。exact-HEAD SHA / test 件数は PR body 側に置く — D-035/D-038）

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

## 遷移・レビュー記録（append-only）

- 2026-08-26: kickoff → spec-check（task scoped: Plans.md「次の行動」docs 棚卸し entry、owner 選定 2026-08-26。Risk R2 判定・記録）→ plan-draft（唯一許可の skip: Design Readiness — 設計新設なしの表記整理で既存正本が十分）→ plan-gate（packet を plan-first commit として本 commit で commit。Test Matrix は R2 optional 判定で省略）。本 commit がこの隣接 3 遷移を materialize する（recording compression、evidence は本 packet の該当節）。
- 2026-08-26 Plan Review round 1（独立 Sonnet fresh context）: P1 4 / P2 2 / P3 2。P1-1 = AC-2 のリテラル半角スペース抜けで vacuous pass（実文言は「残り 18 項目」）、P1-2 = requirements.md L51 脚注の書換え漏れで新規矛盾を作る構図、P1-3 = 66-ui に csv_import 記述が存在しない（Scope 対象誤り）、P1-4 = PR 番号転記の自己矛盾（Scope 4 の「PR #58」vs 表記規約）。P2 = AC-1 の実在しない免除節 / 58-ui 行番号誤り。P3 = Hosted CI 判定根拠の明示 / 65 L252 の無変更明記。全件採用のうえ Coordinator が再実測し、追加是正 2 件を実施: L229「残り 18 項目」は activeMatch 契約の数値も実測 21 で stale（数値非依存化を Scope 3 へ）/ Contract Probe の navigation「20 項目」は誤カウント（実測 24、activeMatch 3）。plan-gate に留まったまま是正、round 2 は closure 確認。
- 2026-08-26 Plan Review round 2（独立 Sonnet fresh context）: round 1 是正 7 点は全適用 OK。新規 P1 2 / P2 1 — いずれも round 1 是正が同一欠陥 class を再生産した指摘: P1-1 = navigation 項目数「24」も naive `rg -c 'status:'` の誤カウント（型定義行 + `search.status` 混入）で真値 22・activeMatch 2（file comment L54 と構造カウントで Coordinator 三たび実測し確定）、P1-2 = 74-ui L564 非目的表の csv_import「未実装」主張が Scope 4 の列挙漏れ、P2-1 = Design Readiness の「20 項目」残存（packet 内 20/24 併存）。全件採用し packet 内の数値を 22 / activeMatch 2 へ全数統一 + Scope 4 / AC-4 へ L564 追加。round 3 は closure 確認（天井 3 到達）。
- 2026-08-26 Plan Review round 3（独立 Sonnet fresh context、最終 closure）: round 2 是正 3 点すべて適用確認 OK（navigation 22 / activeMatch 2 の構造カウント・74-ui L564・packet 内数値統一を独立再実測で確認）、新規 findings なし。P1 0 / P2 0 / P3 0、**converged**（round 実績 3 / 天井 3）。owner Plan Gate 承認待ち。
