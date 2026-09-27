# Code Review Overlay

Use this alongside [quality/review-checklist.md](quality/review-checklist.md). The checklist defines the inventory-specific categories; this file defines review discipline and escalation.

## Source Order

関係する設計正本から契約を確認し、live code・diff・tests・生成物と照合する。対象に応じて ARCHITECTURE / FUNCTION_DESIGN / DB_DESIGN / SCREEN_DESIGN / UI_TECH_STACK の該当節を選び、無関係な設計書の全文を読む順序にはしない。

Risk / workflow が関係する場合は project-profile / DEV_WORKFLOW、R2+ は対象packetの Design Sources / Design Readiness を確認する。作者の説明・validation log・AIコメントは現物で検証するclaimであり、sourceの代用にしない。durableな設計判断がPlanだけにある場合は、明示されたdesign-only scopeや具体的なfollow-upがなければdriftとして扱う。

店の事実を前提にする判断は、`docs/project-memory.md` の「Store Premises Facts（現場の前提）」と照合する。載っていない事実は owner へ 1 問にして送る。

## Blocking Review Focus

- Bugs, behavioral regressions, data loss, unsafe defaults, or broken runtime paths.
- Drift from `UI -> CMD -> BIZ -> IO/MNT`.
- CMD gaining business rules, UI duplicating BIZ rules, or IO/MNT leaking higher-layer error types.
- SQLite schema, migration, FK/CHECK/index, transaction, or stock consistency drift.
- POS CSV parsing, CP932/NEL handling, JAN normalization, negative return handling, duplicate import, or rollback drift.
- PLU file format, encoding, dirty/exported state, register workflow messaging, or 5000 PLU limit drift.
- Tauri command argument/return shape, `CmdError`, tauri-specta registration, or `src/lib/bindings.ts` drift.
- Report CSV schema, BOM/encoding, filename, or export UX contract drift.
- UI route/search state, daily operator workflow, Japanese labels, query invalidation, import/unsaved guards, or Windows native behavior drift.
- Missing tests for changed contracts, negative paths, compatibility, data safety, or main wiring.
- 保守者として読めるか（命名、理由の comment、賢い圧縮より退屈な構造、関数の長さ）。読めない変更は P2（owner 2026-09-07）。

## Finding Severity

| Severity | Use when |
|---|---|
| P1 | Data loss, destructive behavior, committed secret/store data, broken default runtime, unsafe schema/runtime break. |
| P2 | Contract violation, missing critical test, misleading UI/report/output, layer-boundary drift, data safety gap, compatibility break. |
| P3 | Non-blocking robustness, docs/status drift, maintainability, small test clarity issue. 保守者が読めない変更は P2（Blocking Review Focus）。 |

Risk tier describes the change. Severity describes each finding.

## Verification Rules

実装後の状態は helper status と [MG-D5〜D8](agent-guidance/merge-evidence.md) の server record・CI で確認し、record の対象 head/base、broad/closure、manual/R4、実効 rules を検査する。reviewer は専用 record を編集しない。

Review entry follows `AGENTS.md` `Session Start`. Initial review reads the touched source contracts directly. Closure starts from prior findings, correction diff, and affected contracts/tests; expand for newly affected behavior or concrete defect evidence. Do not impose a second full startup reading route. Existing Contract Audit / Double Audit, Findings Freeze, and gate evidence remain required.

- P1 must include direct evidence: file/line, command output, schema contract, or reproducible path.
- Split the problem claim from the suggested fix. A weak fix idea does not weaken a real finding.
- Search for drift before final review when renaming or changing a contract:
  `rg -n "<old-term>|<new-term>|<related-term>" docs src src-tauri scripts`.
- Check generated bindings after command or DTO changes.
- Check active plans with `bash scripts/doc-consistency-check.sh --target plan` when workflow artifacts changed.
- For R2+ work, check whether Design Phase completed before implementation: source design docs are cited as sufficient or updated in the same PR.
- For R3/R4 work, check `Design Intent Trace`: spec IDs, design decision IDs, source design sections, implementation targets, and test targets should be connected.
- Treat Plan Packet-only design rationale as drift when it is durable and absent from source design docs, `docs/decision-log.md`, or ADRs.
- For UI changes affecting operator flow, state whether Windows native L3 verification is required.
- data safety の review では `git status --short` を見て、実 POS / 店舗の成果物が ignored のままかを確かめる。

## Same PR vs Follow-up

Fix in the same PR:

- Broken behavior introduced by the PR.
- Source-of-truth or generated-file drift created by the PR.
- Missing tests for the changed contract.
- Data safety or layer-boundary gaps.
- Review findings that block a correct merge.

Track as follow-up:

- Existing unrelated debt.
- New feature expansion outside the Plan Packet.
- Optional polish that does not affect the changed contract.
- Tooling improvements discovered while reviewing but not needed for this merge.

## Review-only Sub-agent Protocol

- Use [templates/subagent-review-packet.md](templates/subagent-review-packet.md) for R3/R4 before PR/external review.
- The sub-agent is read-only and findings-only.
- The implementer verifies every finding independently before fixing, rejecting, or deferring.
- For R3 skip, record `Review-only skipped because:` in the Plan Packet or PR body.
- R4 review-only is required.

## External PR Review Request

外部 reviewer（Codex 等）へ PR review を依頼するときは、次を渡す。

- PR context: Repo / PR / Title / Branch / Commit。
- In scope と Non-scope。
- Critical Contracts（対象 PR で壊してはならない契約）。
- 作者の検証結果。reviewer はそれを claim として扱い、現物で確かめる。

reviewer は実装しない。findings first で返し、style・命名・将来の拡張・明示された non-scope で block しない。重大度・closure・出力形式はこの文書の他の節に従う。

## Output Shape

Lead with findings. finding ごとに確信度を添える。

```md
## Findings
- P2 - path:line - issue / impact / smallest safe fix

## Verification Performed
- command -> result

## Residual Risks
- risk or test gap
```

If no blocking issue is found, say `No blocking findings.` and list remaining test gaps or residual risks. 必要な時だけ unresolved questions / verification gaps / merge-split judgment を付け、findings を複数の要約節で繰り返さない。
