# Codex / OpenAI Agent Guidance

This directory adapts current OpenAI guidance to this repository without changing the workflow contracts in [DEV_WORKFLOW.md](../DEV_WORKFLOW.md).

## Reading route

1. Read the [Shared Contract](shared.md), which applies to Codex/OpenAI sessions across model generations.
2. Read the slot-neutral profile assigned through [AGENT_OPERATING_MANUAL.md §3.4](../AGENT_OPERATING_MANUAL.md#34-model-slot-対応表):
   - [frontier](profiles/frontier.md)
   - [balanced](profiles/balanced.md)
   - [high-throughput](profiles/high-throughput.md)
3. If runtime identity or assignment is unavailable, use `frontier`.
4. Read [model notes](model-notes.md) when they match the explicitly identified runtime model. Unknown or unmatched models use the shared contract and task-fit profile without importing another generation's assumptions.
5. Continue to the task-specific design document selected by root [AGENTS.md](../../AGENTS.md) `Session Start`.

Profiles describe task fit and response economy only. They must not change approval boundaries, autonomy, validation, workflow phases, Human Gates, or stop conditions from the shared contract and repository source docs.

Personal response style belongs in an ignored root `AGENTS.override.md`, not in tracked guidance. Because a root override replaces the root instruction file during discovery, it must load `./AGENTS.md` before applying any local extension.

The public, extension-neutral regression fixture is [Decision Gate Fixture](evals/decision-gate-fixture.md). Prompts, outputs, scores, and local extensions used in an actual comparison remain local-only.

## Model updates

モデル名は起動設定、仕事の契約は `shared.md`、世代固有の調整根拠は `model-notes.md` が所有する。モデル選択の正本と一時 override は [.codex/README.md](../../.codex/README.md) を参照。

更新時は公式の移行・prompting guidance を確認し、モデル差分メモの対象・確認日・根拠を更新する。共通契約は実際の矛盾や作業上の問題が見つかった場合だけ変更する。既存の [Decision Gate Fixture](evals/decision-gate-fixture.md) と次の実作業で、承認済み作業の継続・未承認 gate の停止・検証範囲を確認する。未知のモデルを自動で「最新」に読み替えない。

## Sources

- OpenAI: [Custom instructions with AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
