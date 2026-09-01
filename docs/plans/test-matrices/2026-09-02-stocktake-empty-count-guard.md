# Test Design Matrix: 棚卸しカウントの数量空欄ガード

Packet: [2026-09-02-stocktake-empty-count-guard.md](../2026-09-02-stocktake-empty-count-guard.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-ST-C5-1: 数量欄が空欄または空白のみのとき、Enter / 保存操作は `update_count` を呼ばず FieldError「数量を入力してください」を表示する
- SPEC-ST-C5-2: 数量欄に `0` を明示入力したとき `update_count(itemId, 0)` が呼ばれ FieldError は出ない
- SPEC-ST-C5-3: 負数 / 非整数の既存 FieldError「0以上の数値を入力してください」は不変
- SPEC-ST-C5-4: `update_count` の wire shape（`stocktake_item_id: i64, actual_count: i64`）と backend validation は不変

## Failure Modes

- FM1: 空欄 Enter で `Number("")===0` が検証を素通りし `update_count(itemId, 0)` が送られる（現行欠陥）
- FM2: 空欄で保存ボタン click が同じ経路で 0 を送る（現行欠陥）
- FM3: 空白のみ（`"  "`）が `Number("  ")===0` で素通りする（現行欠陥）
- FM4: ガードを `Number(quantity) === 0` や `!quantity` で誤実装し、明示 `0` の保存を拒否する（退行）
- FM5: ガード追加時に負数 FieldError の分岐や文言を壊す（退行）
- FM6: Enter 経路のみ / click 経路のみにガードを置き、片方が素通りする
- FM7: `isComposing` guard を壊し IME 確定 Enter が保存を発火する（退行）
- FM8: 73 doc の文言と実装 literal が不一致（doc drift）

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPEC-ST-C5-1 | FM1 | unit (RTL) | T-C5-1 `empty quantity + Enter shows FieldError and does not call updateCount` | ガードなし / ガードが `Number` 後 / Enter 経路にガードなし |
| SPEC-ST-C5-1 | FM2, FM6 | unit (RTL) | T-C5-2 `empty quantity + save click shows FieldError and does not call updateCount` | click 経路にガードなし |
| SPEC-ST-C5-1 | FM3 | unit (RTL) | T-C5-3 `whitespace-only quantity + Enter shows FieldError and does not call updateCount` | `trim()` なしの空判定（`quantity === ""`） |
| SPEC-ST-C5-2 | FM4 | unit (RTL) | T-C5-4 `explicit "0" + Enter calls updateCount with 0 and shows no FieldError` | ガードが 0 を拒否 / `!quantity` 判定 |
| SPEC-ST-C5-3 | FM5 | regression (既存) | T8 `negative actual_count shows FieldError and is not sent`（`StocktakePage.test.tsx` L391-405、rg で実在確認済み） | 負数分岐や文言の破壊 |
| SPEC-ST-C5-4 | — | schema | AC5 `git diff --name-only -- src/lib/bindings.ts` 空 + `stocktake_service.rs` diff なし | wire / backend を触った |
| 73 §73.5 追記 | FM8 | doc presence | AC4 `rg -n "数量を入力してください"` src + doc 各 ≥1 hit | 文言 drift |

T-C5-1〜4 の名前は Writer が既存 test の命名慣行（`T8 ...` 型）に合わせて `T-C5-n` prefix を保ったまま最終決定する。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 数量欄 `quantity`（空欄） | `""` | ガードで mutation 未発火 | — | なし（mutation 未発火） | なし | 候補選択で `""` にリセット（既存） | 既存 | FieldError 表示 | 数値入力で再 Enter → 保存 | T-C5-1 / T-C5-4 |
| 数量欄 `quantity`（明示 0） | `"0"` | `updateMutation.isPending` | `onUpdated()` → 一覧 invalidate（既存） | 既存 | 既存 | 既存 | 既存 | 既存 mutation error 経路 | 既存 | T-C5-4 |
| FieldError | なし | — | 次の保存成功で消える（既存挙動、Writer が実読確認） | — | — | — | — | 表示 | 再入力 | T-C5-1〜3 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 数量入力の空欄ガード | `StocktakePage.tsx` `saveCount()`（対象）。同型の「数量 + Enter 保存」= 入庫 / 出庫 / 返品交換 / 廃棄破損の行内数量欄 — Writer が `rg -n 'Number\(' src/features/{receiving,shipping,return-exchange,disposal}` で空欄経路の有無を確認し、結果を Implementation Results に列挙する | 本 packet は棚卸しのみ | 他 4 画面は Scope 外（同型欠陥があれば backlog 起票、本 packet で是正しない） | Writer 報告 |
| Enter handling + IME `isComposing` guard | `StocktakePage.tsx` L628-634 | 不変 | — | 既存 test 実在を Writer が rg 確認、未被覆なら「契約不変・未被覆」と本表に記録 |
| FieldError 表示 | `setFieldError` 既存経路 | 文言追加のみ | — | T-C5-1 |

## Negative Paths

- missing input: 空欄 → FieldError、mutation なし（T-C5-1 / T-C5-2）
- invalid input: 空白のみ（T-C5-3）、負数（T8）、非整数 `"1.5"` / `"abc"`（既存分岐、`Number.isInteger` false）
- duplicate/ambiguous input: not applicable
- unknown reference: not applicable（itemId は選択済み行）
- dependency missing: not applicable
- permission/write failure: 既存 mutation error 経路不変
- dry-run side effect: not applicable

## Boundary Checks

- threshold: 0（含む、保存可）/ -1（拒否、既存）
- null/default: `quantity` 初期値 `""`（拒否、新規）
- empty/non-empty: `""` / `"  "` 拒否、`"0"` 受理
- min/max: 0 以上の整数（上限は既存どおり未規定）
- status/policy enum: not applicable
- wire type: `actual_count: i64`（不変）
- internal type: `quantity: string` → `Number`
- producer/consumer: `saveCount()` → `commands.updateCount`
- round-trip token: not applicable
- precision/range: 整数のみ（既存）
- cross-language parse: 空欄は wire に到達しないため Rust 側 parse は不変

## Compatibility Checks

- old schema/input: 既存の数値入力はすべて従来どおり
- new schema/input: 空欄 / 空白のみが新たに拒否される
- output order: not applicable
- optional field behavior: not applicable

## Data Safety Checks

- source-derived data: なし
- generated outputs: REQ token 追加時のみ `90-traceability.md` 再生成
- secrets: なし
- local-only files: 実 DB / backup
- synthetic sample boundaries: RTL mock fixture のみ

## Main Wiring / Integration Checks

- helper connected to main path: ガードは `saveCount()` 内（Enter / click の共通経路）
- output reaches manifest/report: not applicable
- effective config reaches runtime: not applicable
- CLI arg reaches implementation: not applicable

## Mutation-style Adequacy Questions

- If a guard is removed（空欄ガード削除）: T-C5-1 / T-C5-2 / T-C5-3 が red（`updateCount` が `0` で呼ばれる）
- If a key branch is inverted（ガード条件反転）: T-C5-4 が red（明示 0 が拒否）、T-C5-1 も red
- If a threshold comparison changes（`trim()` 除去）: T-C5-3 が red
- If a guard is placed only on one path（Enter のみ）: T-C5-2 が red
- If a mock value is changed: T-C5-4 は `updateCount` の呼出し引数 `0` を assert するため mock 定数に依存しない
- If an output field is omitted: not applicable
- If invalidate/refetch changes: 既存経路不変、本 packet で新規 assert なし
- 残りの workflow-state / JSON 系質問: not applicable（wire 不変）

## 必須 mutation 注入（Final Review で Coordinator が clean tree 上で独立再実測、`docs/archive/plans/test-matrices/2026-08-31-dsr17-scroll-restoration-impl.md` の様式）

| # | Mutant | 期待 red | 期待 green |
|---|---|---|---|
| X1 | 空欄ガード行を削除 | T-C5-1 / T-C5-2 / T-C5-3 | T-C5-4 / T8 |
| X2 | ガード条件を `Number(quantity) === 0` に置換 | T-C5-4 | T8 |
| X3 | ガード条件を `quantity === ""`（trim なし）に置換 | T-C5-3 | T-C5-1 / T-C5-4 |
| X4 | FieldError 文言を「0以上の数値を入力してください」に流用 | T-C5-1（文言 assert） | T8 |

## Residual Test Gaps

- jsdom は Windows native WebView2 の IME 挙動を再現しない → L3 AC6 (v)
- 他 4 画面の同型空欄経路は本 packet で是正しない（Adjacent Pattern Audit で有無のみ記録）
