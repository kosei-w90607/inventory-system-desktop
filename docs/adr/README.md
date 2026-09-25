# ADR Index

New durable architecture decisions should use [../templates/adr.md](../templates/adr.md) and live in this directory.

## Existing Decision Records

- [棚卸しと後着売上の時点証拠（proposed）](2026-09-18-stocktake-time-evidence.md): 計数窓、資料受領、判定不能からの再実測、取消と移行。㉗のdesign出力であり未実装。
- [旧棚卸しとZ004業務commit・取消の一時停止](2026-09-23-legacy-stocktake-z004-write-stop.md): 5 つの BIZ 入口の停止、既存 kind の停止 error、旧本体の保持、画面の案内と無効化、再現 fixture。㉘ runtime ①、解除は ⑤。

The project already has ADR-like records under `docs/research/`. They remain valid and are linked here instead of moved in this workflow retrofit.

| Decision | Existing record |
|---|---|
| Router selection | [../research/2026-04-20-router-adr.md](../research/2026-04-20-router-adr.md) |
| Invoke type generation | [../research/2026-04-20-invoke-type-adr.md](../research/2026-04-20-invoke-type-adr.md) |
| Invoke wrapper | [../research/2026-04-20-invoke-wrapper-adr.md](../research/2026-04-20-invoke-wrapper-adr.md) |
| Query cache strategy | [../research/2026-04-20-query-cache-adr.md](../research/2026-04-20-query-cache-adr.md) |

## Rules

- Create a new ADR when a decision changes architecture, workflow gates, data safety, UI framework direction, command wire shape, persistence strategy, or external integration policy.
- Do not move existing research ADRs as part of unrelated implementation work.
- If a research ADR is promoted later, keep redirects or links so old plan evidence remains readable.
- Reference ADRs from Plan Packets and source docs when a change depends on the decision.
