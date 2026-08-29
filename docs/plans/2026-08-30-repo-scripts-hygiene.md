# Plan Packet: repo・scripts 衛生 batch — 退役 Docker 資材削除 + protected-paths 補完 + probe script 負 glob 是正（wave 7 lane 2）

## Workflow State

- Phase: implementing
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: 1957458
- Amendments: e618470
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
developer workflow のみに影響する repo 衛生（退役資材削除 / .gitignore 補完。旧 S3 の script 是正は gated amendment で descope 済み）。runtime・契約・画面に不接触。

## Goal

Goal Invariant:

### 最小完了条件

- 退役済み `Dockerfile` / `docker-compose.yml` が repo から消え、現行手順 docs に Docker 前提の現行指示が残らない。
- `.gitignore` protected-paths block に `.claude/hooks` / `.claude/loop.md` が登録され、sandbox device mask による git status DIRTY 化が tracked 設定で防止される。

### 失敗定義

- 歴史記録（`docs/DOCKER_REPAIR_LOG.md`、DEV_SETUP_CHECKLIST §A.1 の退役履歴）を書き換える。

### 非目的

- Docker 環境の再導入・代替手順の新設（退役方針 2026-04-03 の維持）。
- `.git/info/exclude` の暫定 2 行の削除（untracked local 設定。merge 後に owner 端末 or 次 session で削除して二重管理を解消、closeout メモに残す）。
- **旧 S3（probe script 負 glob 是正）— gated amendment で descope**: 前提の「負 glob 起因 silent no-op」が三重実測（Writer Codex: rg 15.2.0 / linuxbrew 15.1.0 で mutant 検知 exit 1、Coordinator: linuxbrew rg 15.1.0 で literal 負 glob・wildcard 負 glob・明示 file 引数のいずれも正常動作）で不成立と確定（owner 裁定 2026-08-30、介入 2/3）。現行 script は正しく動作しており是正対象が実在しない。rally round 1〜3 で確立した書換え時の技術知見（path 単独照合 / 変数捕捉 / 境界アンカー）は Plan Gate 記録に保存。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

起草時実査 2026-08-30（Coordinator が rg / eza で実在確認済み）:

**S1. 退役 Docker 資材の削除**

1. repo root の `Dockerfile`（L1 `FROM rust:1.94-bookworm`、現運用 pin と乖離）と `docker-compose.yml` を `git rm` で削除。起草時実査: src / src-tauri / .github / scripts からの参照 0、docs 参照は `DEV_SETUP_CHECKLIST.md` / `PROJECT_HANDOFF.md` / `Plans.md` / `DOCKER_REPAIR_LOG.md` の 4 file のみ。
2. `docs/DEV_SETUP_CHECKLIST.md` / `docs/PROJECT_HANDOFF.md` の参照箇所を実読し、現行手順として Docker を指示する記述が残る場合のみ「退役・削除済み（履歴は git 履歴と DOCKER_REPAIR_LOG.md）」へ整合。§A.1 の退役履歴記録と `DOCKER_REPAIR_LOG.md` は歴史記録として無改変。`Plans.md` は Coordinator 管理（closeout で同期）。

**S2. .gitignore protected-paths block の補完**

3. `.gitignore` L107-120 の protected-paths 実体リストへ `.claude/hooks` / `.claude/loop.md` の 2 行を既存の辞書順配置に合わせて追加。

**旧 S3. check-phase1-probe-removed.sh の負 glob 是正 — descope（gated amendment 2026-08-30）**

前提としていた「負 glob 起因の silent no-op」が実装フェーズの Writer 実測（fail-closed 停止）と Coordinator 追実測の三重実証で不成立と確定したため、S3 全体（旧 4・5 項）を scope から除去（詳細は Goal 非目的と Plan Gate 記録の amendment 経緯を参照）。`scripts/check-phase1-probe-removed.sh` は無改変。

## Non-scope

- docs/function-design / spec / decision-log 側の編集（wave 7 lane 1 の footprint、file 非重複）。
- CI workflow（.github/）・local-ci.sh・pre-push.sh の変更。
- Node / Rust の version pin 変更。

## Acceptance Criteria

- AC-1: `git ls-files Dockerfile docker-compose.yml` の出力 0 行。
- AC-2: `rg -F -c ".claude/hooks" .gitignore` ≥ 1 かつ `rg -F -c ".claude/loop.md" .gitignore` ≥ 1、かつ `git check-ignore -v .claude/hooks .claude/loop.md` が exit 0（ignore の機能的効果の確認）、かつ `bash scripts/check-env-safety.sh` PASS。
- AC-3 / AC-4: S3 descope（gated amendment 2026-08-30）により削除。`scripts/check-phase1-probe-removed.sh` が無改変であることを Final Review で確認する。
- AC-5: `bash scripts/doc-consistency-check.sh` PASS（ERROR 0）。
- AC-6: `docs/DEV_SETUP_CHECKLIST.md` / `docs/PROJECT_HANDOFF.md` に Docker を現行手順として指示する記述が残らない（歴史記録は残存可 — Final Review 実読突合。Plan Review round 1 の悉皆実査では現行手順指示 0 件のため、S1-2 は無変更・AC-6 即 PASS の見込み）。

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
| Phase 1 probe 検知 | check-phase1-probe-removed.sh 冒頭コメント | descope（amendment 2026-08-30） | 前提の silent no-op が三重実測で不成立と確定し scope から除去。script 無改変 | 旧 S3（削除） | Final Review の無改変確認 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（退役は §A.1、負 glob 事象は Plans.md backlog と PR #39 経緯に記録済み）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: 歴史記録（DOCKER_REPAIR_LOG / §A.1 履歴）は無改変
- Deferred design gaps, risk, and follow-up target: `.git/info/exclude` 暫定 2 行の削除（closeout メモ）/ 全 scripts の負 glob sweep で hit が出た場合の backlog 起票
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix は R2 optional 判定で省略（oracle は AC-1/2/5/6 に機械化済み。旧 AC-4 は descope で削除）
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

**amendment 更新（2026-08-30）**: 起草時に依拠した「rg 15.1.0 の負 glob リテラル解釈で全マッチ 0 件」（Plans.md 旧 backlog 記録）は、実装フェーズの実測で**不成立**と確定した。実測: Writer（Codex）が rg 15.2.0 / linuxbrew 15.1.0 の双方で greet mutant を検知（exit 1）、Coordinator が linuxbrew rg 15.1.0 で literal 負 glob（`rg -n '\bgreet\b' <dir> --glob '!routeTree.gen.ts'` = 検知 + 除外正常）・wildcard 負 glob・明示 file 引数 + 負 glob のすべてで正常動作を確認。教訓 = 記録済み claim も packet 前提化する前に起草時実測すること（Contract Probe の Writer 後置は不可）。

## Contract Coverage Ledger

R2 簡易版（触れる契約行のみ）:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| Docker 退役（§A.1 既決） | S1 | AC-1/AC-6 | non-scope |
| protected-paths 補完 | S2 | AC-2（check-env-safety 含む） | non-scope |
| probe script 実効性 | descope（amendment 2026-08-30、実測で非欠陥確定） | Final Review の無改変確認 | non-scope |

## Test Plan

Test Design Matrix は R2 optional 判定で省略（理由: docs + 設定 file の削除・追記のみで oracle は AC-1/2/5/6 に機械化済み。旧 S3 の mutant 実証は descope に伴い削除）。

- targeted tests: なし（script 無改変）
- negative tests: 不要
- compatibility checks: `bash scripts/doc-consistency-check.sh`（AC-5）/ `bash scripts/check-env-safety.sh`（AC-2）
- data safety checks: 削除対象は `Dockerfile` / `docker-compose.yml` の 2 file のみ（git 管理下、復元可能）。他の削除なし
- main wiring/integration checks: L1 full（Ready 前の exact HEAD で実行）

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない。

## Review Focus

- 削除が明名 2 file に限定され、歴史記録が無改変であること
- `scripts/check-phase1-probe-removed.sh` が無改変であること（descope の遵守確認）
- .gitignore 追加 2 行が protected-paths block の既存構造・並びに整合すること
- docs 参照整合が「現行手順としての Docker 指示」のみを対象にし、履歴記述へ波及していないこと

## Spec Contract

N/A（R2。触れる契約は Contract Coverage Ledger 参照）。

## Trace Matrix

N/A（R2、Design Intent Trace 参照）。

## Data Safety

削除対象は退役済み `Dockerfile` / `docker-compose.yml` の 2 file のみ（本 packet と owner 起票承認で明名済み、git 履歴から復元可能）。実データ・secrets への接触なし。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.

### Plan Gate 記録（append-only）

- owner 起票承認 2026-08-30（wave 7 衛生 batch 起票の会話にて。2 lane 編成の owner 裁定を含む。本 lane 介入 1/3）。
- Plan Gate rally round 1（独立 Sonnet Plan Reviewer、2026-08-30）: P1: 1 / P2: 1 / P3: 2。P1-1 = Scope S3-4 例示の行全体一致 pipe filter が content 側衝突で genuine hit を握りつぶす構造的欠陥（Coordinator が最小再現で実証確認: pipe 版 exit 1・awk path 単独照合版は検知維持）→ 是正方式を path 単独照合に限定し AC-4 へ (e) を追加。P2-1 = AC-2 に `git check-ignore -v` の機能的効果確認を追加。P3-1 = AC-4(d) の文言を path/content 両側の誤マッチ検査へ拡張。P3-2 = S1-2 は現行手順指示 0 件のため実質 no-op 見込みを AC-6 へ注記。全採用、in-place 是正（plan-draft 中の pre-gate 是正）。round 2 の delta 再検証で新規指摘 0 を確認して plan-gate 通過とする。
- Plan Gate rally round 2（独立 Sonnet Plan Reviewer delta 検証、2026-08-30）: round 1 の 4 findings 反映は全件確認。新規 P1: 1 / P2: 1 / P3: 1 — いずれも round 1 是正例自体の欠陥。P1 = pipeline を `if` へ直結すると awk の exit 0 により 0 hit でも真になる（Coordinator が 0 hit 条件で再現確定）→ 変数捕捉 + 非空判定へ Scope 例を差替え。P2 = 末尾一致 regex の境界アンカー欠如で `somelib/bindings.ts` 型の誤除外（Coordinator 再現確定）→ `(^|\/)` アンカー必須化。P3 = Test Plan の negative tests 行が (e) 未反映 → 反映。全採用、in-place 是正。round 3（rally 天井）の delta 再検証で新規 P1/P2 = 0 を確認して plan-gate 通過、超過時は DEV_WORKFLOW Review Rules の disposition route へ。
- Plan Gate rally round 3（独立 Sonnet Plan Reviewer delta 検証、2026-08-30）: round 2 の 3 findings 反映を 1 対 1 で全件確認。修正版例示コードの 5 象限 empirical 検証（0 hit クリーン偽 / mutant 検知 / 除外対象の除外 / somelib 型の非誤除外 / content 側衝突の検知維持）すべて期待どおり。旧方式（行全体一致 / if 直結 / アンカーなし regex）の残存 0。新規 P1/P2/P3 = 0 で rally 収束、plan-gate 通過。非 blocking 観察 1 件（`2>/dev/null` が rg exit 2 を 0 hit と区別不能にする既存同型構造）は既存構造のため見送り記録のみ。
- state-only 遷移 `plan-draft->plan-gate->plan-approved->implementing` の根拠: packet 完成・commit 済み〈plan-first `1957458` + pre-gate 是正 `7122965` / `01acbe8`〉（plan-draft->plan-gate）/ 独立 Plan Reviewer rally 3 round 収束 P1/P2 = 0 + Plan Commit 記入 + plan-first commit が全実装 commit に先行（plan-gate->plan-approved）/ Writer = Codex への実装開始許可・発注書 relay（plan-approved->implementing）。
- **gated amendment 経緯（2026-08-30）**: Writer（Codex）が実装前の AC-4(a) 実証で「mutant を検知し exit 1、silent no-op 前提と矛盾」の fail-closed 停止（branch 98c43b8、rg 15.2.0 / linuxbrew 15.1.0 双方で再現）。Coordinator が linuxbrew rg 15.1.0 の scratch 実測で追認（literal 負 glob / wildcard 負 glob / 明示 file 引数のすべてで正常動作、「全マッチ 0 件」はどの形でも再現せず）→ S3 の前提欠陥は実在しないと確定。owner 裁定（介入 2/3）= S3 descope。rally は round 3 天井到達済みのため追加 round は開始せず、disposition = owner escalation で処置。本 amendment の監査は Final Review（independent-review phase）が S1/S2 diff + script 無改変確認として実施する。原 `Plan Commit` は不変、amendment SHA は Workflow State `Amendments` 行に記帳。
