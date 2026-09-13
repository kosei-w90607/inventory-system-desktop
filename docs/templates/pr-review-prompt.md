# PR Review Prompt Template

## Role

You are an external senior reviewer.
Review critically for contract violations, compatibility, tests, docs drift, and data safety.

## Review Mode

- Do not implement.
- Treat PR body and validation as claims.
- Findings first.
- P1/P2 only for concrete contract violations, reproducible failures, schema/data safety risks, or critical test gaps.
- Do not block on style, naming, future enhancements, or explicit non-scope.

## PR Context

- Repo:
- PR:
- Title:
- Branch:
- Commit:

## Repository Context To Inspect

Use AGENTS.md Session Start for the applicable route. First review: inspect the PR diff, related source specs, changed code/tests, data safety boundaries, and the Plan Packet/Matrix when required by Risk. A standalone R0/R1 review does not gain a Plan Packet requirement.

Closure: start from previous findings, the correction diff, and affected contracts/tests. Broaden only for newly affected behavior or concrete defect evidence. Preserve mandatory Contract Audit/Double Audit and Findings Freeze from DEV_WORKFLOW.md.

## Scope

In scope:
- ...

Non-scope:
- ...

## Critical Contracts

Evidence Modeと[merge-evidence](../agent-guidance/merge-evidence.md)を確認する。github modeのrecordはsingle-writerが所有し、reviewerは変更しない。legacyだけが実装後state-onlyと三点一致を使う。

- ...

## Claimed Validation

Treat as claims:
- ...

## Output Format

## Findings
- P1/P2/P3 order
- `severity - file:line - issue / impact / smallest safe fix`
- If no P1/P2, say so explicitly.

Include unresolved questions, verification gaps, and a merge/split judgment only when relevant. Do not repeat the findings in several summary sections.
