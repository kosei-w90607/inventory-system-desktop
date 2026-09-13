---
name: implementation
description: Implement a scoped change using the generic AI Quality Workflow Pack when the repository has no dedicated implementation workflow.
---

# Implementation

repo 固有の入口・実装 Skill がある場合はそちらを使う。inventory-system では `inventory-workflow-start` / `inventory-implementation` に渡し、この汎用手順を重ねない。

汎用 pack を採用する repo では `docs/project-profile.md` と必要な `docs/ai-workflow/` の概念、該当仕様を確認する。Risk に応じた計画・検証・独立レビューを選び、承認された範囲を実装する。

対象テストで失敗を確認し、修正後に必要な gate を通す。レビュー指摘は現物で検証する。実データや秘密をcommitせず、仕様判断と次の行動をrepoの正本へ残す。適用条件・成果物・停止条件はproject側が所有する。
