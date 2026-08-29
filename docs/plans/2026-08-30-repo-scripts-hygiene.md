# Plan Packet: repo・scripts 衛生 batch — 退役 Docker 資材削除 + protected-paths 補完 + probe script 負 glob 是正（wave 7 lane 2）

## Workflow State

- Phase: plan-draft
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable (Claude Code)
- Writer: Codex（発注書駆動の実装者。発注 prompt は Coordinator が作成し owner が relay）
- Plan Reviewer: Sonnet subagent (independent)（Writer = Codex のため D-062 の非同一 vendor 要件を満たす）
- Final Reviewer: Sonnet subagent (independent)
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: pending Ready 承認（画面非接触のため視覚確認・L3 は非該当。Dockerfile / docker-compose.yml の削除対象は本 packet で明名済み）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 15分
- relay 往復上限: 2（Codex 発注 1 + 予備 1）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
developer workflow のみに影響する repo 衛生（退役資材削除 / .gitignore 補完 / 運用補助 script の既知 bug 同型是正）。`check-phase1-probe-removed.sh` は local-ci / pre-push / CI のいずれからも呼ばれない運用補助スクリプト（起草時実査: 参照元は `docs/project-profile.md` のみ）で、merge gate・workflow gate には該当しない。runtime・契約・画面に不接触。

## Goal

Goal Invariant:

### 最小完了条件

- 退役済み `Dockerfile` / `docker-compose.yml` が repo から消え、現行手順 docs に Docker 前提の現行指示が残らない。
- `.gitignore` protected-paths block に `.claude/hooks` / `.claude/loop.md` が登録され、sandbox device mask による git status DIRTY 化が tracked 設定で防止される。
- `scripts/check-phase1-probe-removed.sh` の src/ 検索が実際に機能する（負 glob 起因の silent no-op が解消し、greet 残留を検知できる）。

### 失敗定義

- 歴史記録（`docs/DOCKER_REPAIR_LOG.md`、DEV_SETUP_CHECKLIST §A.1 の退役履歴）を書き換える。
- probe script の是正後も mutant（greet 仮挿入）を検知できない。
- 除外対象（routeTree.gen.ts / lib/bindings.ts）の greet 偽陽性が新たに発生する構造にする。

### 非目的

- Docker 環境の再導入・代替手順の新設（退役方針 2026-04-03 の維持）。
- `.git/info/exclude` の暫定 2 行の削除（untracked local 設定。merge 後に owner 端末 or 次 session で削除して二重管理を解消、closeout メモに残す）。
- 他 script への負 glob sweep（doc-consistency-check.sh 側は PR #39 是正済み、本件で全 scripts を `rg -- '--glob'` で sweep し、hit があれば backlog 起票のみ行い本 PR では触らない）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

起草時実査 2026-08-30（Coordinator が rg / eza で実在確認済み）:

**S1. 退役 Docker 資材の削除**

1. repo root の `Dockerfile`（L1 `FROM rust:1.94-bookworm`、現運用 pin と乖離）と `docker-compose.yml` を `git rm` で削除。起草時実査: src / src-tauri / .github / scripts からの参照 0、docs 参照は `DEV_SETUP_CHECKLIST.md` / `PROJECT_HANDOFF.md` / `Plans.md` / `DOCKER_REPAIR_LOG.md` の 4 file のみ。
2. `docs/DEV_SETUP_CHECKLIST.md` / `docs/PROJECT_HANDOFF.md` の参照箇所を実読し、現行手順として Docker を指示する記述が残る場合のみ「退役・削除済み（履歴は git 履歴と DOCKER_REPAIR_LOG.md）」へ整合。§A.1 の退役履歴記録と `DOCKER_REPAIR_LOG.md` は歴史記録として無改変。`Plans.md` は Coordinator 管理（closeout で同期）。

**S2. .gitignore protected-paths block の補完**

3. `.gitignore` L107-120 の protected-paths 実体リストへ `.claude/hooks` / `.claude/loop.md` の 2 行を既存の辞書順配置に合わせて追加。

**S3. check-phase1-probe-removed.sh の負 glob 是正**

4. `scripts/check-phase1-probe-removed.sh` L39 の `--glob '!routeTree.gen.ts' --glob '!lib/bindings.ts'` を除去し、除外を負 glob に依存しない方式（例: `rg -n '\bgreet\b' "$REPO_ROOT/src" | rg -v -F 'routeTree.gen.ts' | rg -v -F 'lib/bindings.ts'` の pipe filter、または個別 path 除外の実在検証付き代替）へ置換。exit code 設計（0/1/2）と if 節の非 set -e 前提は維持。
5. 是正の前後で挙動を実証し PR body へ記録: (a) 是正前に src 配下へ `greet` token を仮挿入して現行 script が検知しない（silent no-op）ことを確認、(b) 是正後に同じ mutant で exit 1 になることを確認、(c) mutant 除去後のクリーン状態で exit 0、(d) 除外対象 file 名を含む path で偽陽性が出ないこと。仮挿入は検証後に必ず除去し、commit に含めない。

前提（既知実測）: 当環境の linuxbrew ripgrep 15.1.0 は `--glob '!...'` をリテラル解釈し全マッチ 0 件を返す（PR #39 で doc-consistency-check.sh 側は是正済み。本 script は同型残存）。

## Non-scope

- docs/function-design / spec / decision-log 側の編集（wave 7 lane 1 の footprint、file 非重複）。
- CI workflow（.github/）・local-ci.sh・pre-push.sh の変更。
- Node / Rust の version pin 変更。

## Acceptance Criteria

- AC-1: `git ls-files Dockerfile docker-compose.yml` の出力 0 行。
- AC-2: `rg -F -c ".claude/hooks" .gitignore` ≥ 1 かつ `rg -F -c ".claude/loop.md" .gitignore` ≥ 1、かつ `bash scripts/check-env-safety.sh` PASS。
- AC-3: `rg -c -- "--glob" scripts/check-phase1-probe-removed.sh` hit 0（exit 1）。
- AC-4: mutant 実証（Scope S3-5 の (a)〜(d)）が PR body に記録され、是正後 script がクリーン状態で exit 0・mutant 状態で exit 1。
- AC-5: `bash scripts/doc-consistency-check.sh` PASS（ERROR 0）。
- AC-6: `docs/DEV_SETUP_CHECKLIST.md` / `docs/PROJECT_HANDOFF.md` に Docker を現行手順として指示する記述が残らない（歴史記録は残存可 — Final Review 実読突合）。

## Design Sources

- Requirements / spec: 変更なし（REQ 非接触）
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: 変更なし
- Decision log / ADR: 変更なし（Docker 退役は DEV_SETUP_CHECKLIST §A.1 2026-04-03 記録済みの既決。本 PR はその物理的完遂）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | なし（既決の物理的完遂） | existing sufficient |

## Registration / Generation Obligations

該当なし（route / command / doc 新設・REQ token 変更なし。生成物再生成なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| DEV_SETUP §A.1 | Docker 退役記録 2026-04-03 | 既決の物理的完遂 | 退役済み資材の残置は pin 乖離（rust:1.94 / Node 20 vs 現運用）の誤誘導源。再同期は退役方針と矛盾するため削除 | S1 | AC-1/AC-6 |
| protected-paths block | .gitignore L104-120 | sandbox device mask 既知事象 | `.git/info/exclude` の暫定対処を tracked 設定へ昇格 | S2 | AC-2 |
| Phase 1 probe 検知 | check-phase1-probe-removed.sh 冒頭コメント | PR #39 同型（rg 15.1.0 負 glob） | 負 glob 依存の除外は当環境で silent no-op。pipe filter へ置換 | S3 | AC-3/AC-4 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（退役は §A.1、負 glob 事象は Plans.md backlog と PR #39 経緯に記録済み）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: 歴史記録（DOCKER_REPAIR_LOG / §A.1 履歴）は無改変
- Deferred design gaps, risk, and follow-up target: `.git/info/exclude` 暫定 2 行の削除（closeout メモ）/ 全 scripts の負 glob sweep で hit が出た場合の backlog 起票
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix は R2 optional 判定で省略（mutant 実証 AC-4 が実効 oracle）
- Absolute guarantee / escape hatch self-check completed: 該当なし

## Impact Review Lenses

not applicable — 起点は repo 内実査（backlog 起票済み項目 3 件）であり、実地調査・実機・外部 tool・POS 連携・format 変更のいずれにも該当しない。

## Design Readiness

- Existing design docs are sufficient because: 3 件とも既決事項（Docker 退役 2026-04-03 / protected-paths 補完 backlog / PR #39 同型是正）の物理的完遂で、新規設計判断を含まない
- Source docs updated in this PR: DEV_SETUP_CHECKLIST / PROJECT_HANDOFF の参照整合のみ（条件付き、Scope S1-2）
- Design gaps intentionally deferred: Non-scope 参照
- Durable decisions discovered in this plan and promoted to source docs: なし

Minimum design checks:

- Layer ownership: 非該当（repo 衛生）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 変更なし
- Error, empty, retry, and recovery behavior: script の exit code 設計（0/1/2）を維持
- Testability and traceability IDs: REQ 非接触。oracle は AC-1〜AC-6

## Contract Probe

rg 15.1.0 の負 glob リテラル解釈は既知実測（Plans.md backlog 記録 + 当環境 `rg --version` = ripgrep 15.1.0、起草時実査 2026-08-30）。現行 script の silent no-op 実証（Scope S3-5 (a)）を是正前に実施し、結果 1 行を PR body へ記録する。

## Contract Coverage Ledger

R2 簡易版（触れる契約行のみ）:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| Docker 退役（§A.1 既決） | S1 | AC-1/AC-6 | non-scope |
| protected-paths 補完 | S2 | AC-2（check-env-safety 含む） | non-scope |
| probe script 実効性 | S3 | AC-3/AC-4（mutant 実証） | non-scope |

## Test Plan

Test Design Matrix は R2 optional 判定で省略（理由: 挙動 oracle は AC-4 の mutant 実証に機械化済み）。

- targeted tests: `bash scripts/check-phase1-probe-removed.sh`（クリーン exit 0 / mutant exit 1）
- negative tests: AC-4 (d) 除外対象の偽陽性なし
- compatibility checks: `bash scripts/doc-consistency-check.sh`（AC-5）/ `bash scripts/check-env-safety.sh`（AC-2）
- data safety checks: 削除対象は `Dockerfile` / `docker-compose.yml` の 2 file のみ（git 管理下、復元可能）。他の削除なし
- main wiring/integration checks: L1 full（Ready 前の exact HEAD で実行）

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない。

## Review Focus

- 削除が明名 2 file に限定され、歴史記録が無改変であること
- probe script 是正の除外方式が偽陽性・偽陰性双方に対して実証されていること（AC-4 の 4 象限）
- .gitignore 追加 2 行が protected-paths block の既存構造・並びに整合すること
- docs 参照整合が「現行手順としての Docker 指示」のみを対象にし、履歴記述へ波及していないこと

## Spec Contract

N/A（R2。触れる契約は Contract Coverage Ledger 参照）。

## Trace Matrix

N/A（R2、Design Intent Trace 参照）。

## Data Safety

削除対象は退役済み `Dockerfile` / `docker-compose.yml` の 2 file のみ（本 packet と owner 起票承認で明名済み、git 履歴から復元可能）。実データ・secrets への接触なし。mutant 仮挿入は検証後に除去し commit へ含めない（AC-4）。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.

### Plan Gate 記録（append-only）

- owner 起票承認 2026-08-30（wave 7 衛生 batch 起票の会話にて。2 lane 編成の owner 裁定を含む。本 lane 介入 1/3）。
