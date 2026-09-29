---
name: inventory-code-review
description: Use this skill when reviewing implementation in this inventory management system, specifically to check alignment with architecture, function design, and database design. Combines with the engineering-review skill for general review philosophy.
allowed-tools: Read, Grep, Glob, Bash
---

# Inventory Code Review（在庫システム固有）

汎用レビュー哲学（bug 優先・scope 規律・実証防御・指摘応答）は `engineering-review` スキルを参照。重大度・出力形式は `docs/code_review.md`。このスキルは在庫システム固有の観点に特化する。

## Review Goals（在庫固有）

Prioritize:

1. Drift from `docs/ARCHITECTURE.md`, `docs/FUNCTION_DESIGN.md`, and `docs/DB_DESIGN.md`
2. Layer boundary violations（UI→IO 直接呼び出し禁止 / CMD 層に業務ルール混入禁止）
3. Inventory invariants（在庫不変条件: 在庫数の整合性 / movements 記録の一貫性）

Report findings before summaries.

## Start Here

Read only the docs relevant to the review target.

- Always start with `AGENTS.md`
- For workflow and risk routing: `docs/DEV_WORKFLOW.md`
- For review discipline: `docs/code_review.md`
- For implementation structure: `docs/ARCHITECTURE.md`
- For function behavior and errors: `docs/FUNCTION_DESIGN.md`
- For schema and persistence behavior: `docs/DB_DESIGN.md`
- For UI-facing review: `docs/SCREEN_DESIGN.md`
- For environment-specific review: `docs/DEV_SETUP_CHECKLIST.md`

If the review touches multiple layers, read the relevant sections from multiple docs instead of only one.

## Core Review Workflow（設計書突合手順）

1. 変更対象のファイルとレイヤーを特定する。
2. `references/source-map.md` で読むべき設計書を確認し、該当箇所を読む。
3. 実装が設計書の関数シグネチャ・処理ステップ・エラーハンドリングと一致するか照合する。
4. レイヤー境界（UI→CMD→BIZ→IO 一方向）が守られているか確認する。
5. findings を severity 順に報告する。
6. findings がない場合はその旨を明示し、残存リスクを挙げる。

## What To Check

See `references/review-checklist.md` for the detailed checklist.
See `references/source-map.md` for which design doc to read for each review target.

## Contract Audit Mode (R3/R4)

When the review is the independent review for R3/R4, run `docs/DEV_WORKFLOW.md` `Contract Audit (R3/R4)` directly from the touched source design docs, not from the Writer's summary.

1. Re-verify every Contract Ledger row (old packets: Contract Coverage Ledger) against the actual implementation, automated tests, and L3/non-scope disposition; a populated row is not proof of compliance.
2. Perform the negative-space audit: report every touched source-doc contract that is absent from the ledger, implementation, or tests.
3. Check the State Lifecycle Matrix across initial, pending, success, invalidate, refetch, revisit, restart, failure, and retry where state exists.
4. Re-run the Adjacent Pattern Audit for every source pattern and verify each site is ported or explicitly excluded.
5. Apply mutation/anti-tautology checks: inject a real mutation and confirm the relevant test fails; mock values must differ from design expectations, and tests must fail when mock values or invalidate/refetch order changes.
6. Confirm every non-automatable assertion has an L3 item with screen, reachability steps, and observable pass criteria.
7. Before Ready, compare the complete PR body with the final diff, current Workflow State, helper status and the dedicated records, manual gates, and residual risks; report stale text as a finding.

For workflow gate changes and R4, require the independent double-audit defined by `docs/DEV_WORKFLOW.md`. Final Review results remain claims until the coordinator verifies each finding in the repository.

## Output Format

findings・重大度・指摘なしの返し方は `docs/code_review.md` の `## Output Shape` と `## Finding Severity` に従う（指摘なしは `No blocking findings.`）。

## Review Biases To Avoid

- Do not focus on style before correctness.
- Do not assume implementation intent; compare against docs.
- Do not treat partial verification as proof.
- Do not ask for extra user context until the code and docs have been inspected.

## GitHub PR Comment Posting (Reliable Workflow)

投稿してよい範囲は `AGENTS.md` Decision and Approval Boundaries。

When posting review results to GitHub in this repository, use the following stable path.

1. Prefer GitHub app tools first. If they return 404 for this repo, switch to `gh` CLI.
2. For top-level PR comments, use issue-comments endpoints:
   - Post: `POST /repos/{owner}/{repo}/issues/{pr_number}/comments`
   - Update: `PATCH /repos/{owner}/{repo}/issues/comments/{comment_id}`
3. For Japanese + multiline comments, avoid quoting and encoding issues:
   - Build a JSON payload file in UTF-8 without BOM.
   - Send with `gh api ... --input <payload.json>`.
4. Verify the final body after posting/updating:
   - `gh api repos/{owner}/{repo}/issues/comments/{comment_id} --jq ".body"`
5. If test comments were created during troubleshooting, delete them before finalizing:
   - `DELETE /repos/{owner}/{repo}/issues/comments/{comment_id}`
