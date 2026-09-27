# Test Design Matrix

## Risk

Risk: <R2|R3|R4>

## Contracts Under Test

- <contract>

## Failure Modes

- <failure mode>

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。helper 名だけで実 router / integration と分類しない。
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。状態 reset なら初回 mount に加え同値再選択等の別経路を確認し、対象契約が行使されるものを選ぶ。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| <contract> | <failure mode> | unit / integration / CLI / schema / data safety / regression | <test name> | <what broken implementation this catches> |

## State Lifecycle Matrix

Required when the change has UI, data, cache, route/search, import/export, retry, or persisted state. Use `not applicable` with a reason only when the change has no state lifecycle.

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
|  |  |  |  |  |  |  |  |  |  |  |

For workflow-state changes, cover capture/server races, stale head/base, broad/closure, manual/R4 and hosted gate.

## Adjacent Pattern Audit

Enumerate every site of each borrowed pattern; do not sample only the nearest file. Patterns include IME composition, Enter handling, focus order, formatter, query invalidation, error-kind mapping, route/search state, and accessibility.

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
|  |  |  |  |  |

## Negative Paths

- missing input:
- invalid input:
- duplicate/ambiguous input:
- unknown reference:
- dependency missing:
- permission/write failure:
- dry-run side effect:

## Boundary Checks

- threshold:
- null/default:
- empty/non-empty:
- min/max:
- status/policy enum:
- wire type:
- internal type:
- producer/consumer:
- round-trip token:
- precision/range:
- cross-language parse:

route / search の往復では href 生成だけで完了とせず、受信側 parse 後の型と検索・選択の復元を確認する。数字だけの識別子等、wire 上の表現で解釈が変わる入力を選ぶ。

## Compatibility Checks

- old schema/input:
- new schema/input:
- output order:
- optional field behavior:

## Data Safety Checks

- source-derived data:
- generated outputs:
- secrets:
- local-only files:
- synthetic sample boundaries:

## Main Wiring / Integration Checks

- helper connected to main path:
- output reaches manifest/report:
- effective config reaches runtime:
- CLI arg reaches implementation:

## Mutation-style Adequacy Questions

mutation は対象経路の観測結果を変えるものを選び、既存の適用条件に従って実注入で red を確認する。effect 等が変化を打ち消す場合は別経路で単独に効くか調べる。観測不能な mutant の kill を固定 AC にせず、承認済み AC の訂正は Coordinator へ返す。

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant?
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct?
- If a key branch is inverted, which test fails?
- If a threshold comparison changes, which test fails?
- If a guard is removed, which test fails?
- If an output field is omitted, which test fails?
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? The accepted design must keep current exact-HEAD evidence in PR metadata.
- If output order changes, which test fails?
- If dry-run performs a side effect, which test fails?
- If a JSON number crosses JavaScript safe integer range, which test fails?
- If a state token is round-tripped through browser/client code, which test fails?

## Residual Test Gaps

- <gap>
