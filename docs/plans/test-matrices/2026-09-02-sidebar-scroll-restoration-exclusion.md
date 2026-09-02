# Test Design Matrix: sidebar viewport の scroll restoration 除外

Plan Packet: [../2026-09-02-sidebar-scroll-restoration-exclusion.md](../2026-09-02-sidebar-scroll-restoration-exclusion.md)

## Risk

Risk: R3

## Contracts Under Test

- DSR-17 (j) / D-G: router 生成直後（全 key）と各 `onBeforeLoad`（`fromLocation` key のみ）で、`scrollRestorationCache` から `[data-scroll-restoration-id="main"]` 以外の selector entry を削除する。
- DSR-17 (j) / D-G: `scrollRestorationCache` が `null`（sessionStorage 不可環境）の場合、prune は no-op で例外を投げない。
- DSR-17 (b)(c)(d)(g)(i)（既存契約の非破壊）: prune 導入後も `<main>` の href key 復元・主ナビ先頭表示・clamp 遅延再適用が無変更で動作する。
- DSR-17 (h) / UI-11b-D12（既存契約の非破壊）: HomePage one-shot の negative 契約が regression しない。

## Failure Modes

- allowlist が全 selector を admit してしまい prune が実質 no-op になる（main 以外も残る）。
- 起動時 sweep の呼出しが削除・コメントアウトされ、汚染済み cache が起動直後は除染されない。
- `onBeforeLoad` prune が `event.fromLocation` ではなく `event.toLocation`（または `router.latestLocation`）の key を対象にし、意図した key と異なる場所を削除・非削除にする。
- prune が `[data-scroll-restoration-id="main"]` 自体まで削除し、`<main>` の復元契約（分類②④・D-E）を壊す。
- `onBeforeLoad` 購読への追加行が削除・欠落し、継続的な prune が機能しなくなる（起動時 sweep だけでは 2 回目以降の遷移で再汚染される）。
- `scrollRestorationCache` が `null` の環境で prune が `.state` や `.set` へアクセスして例外を投げ、router 生成自体が失敗する。

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| DSR-17 (j) 起動時 sweep | sweep 呼出し欠落・allowlist no-op | unit | SP1: startup sweep prunes non-main entries across all keys | `createAppRouter()` 呼出し後も positional selector entry が残る、または main entry ごと消える |
| DSR-17 (j) onBeforeLoad prune（fromLocation 限定） | 対象 key の取り違え・購読欠落 | unit/integration | SP2: onBeforeLoad prunes only the fromLocation key | 遷移元 key の positional entry が消えない、または遷移元以外の key が意図せず消える |
| DSR-17 (j) main entry 保存（regression） | main entry の誤削除 | unit | SP3: main entry survives prune | prune 後に main entry の値が変化・消失する |
| DSR-17 (j) null-safety | null cache での例外 | unit | SP4: prune is a no-op when scrollRestorationCache is null | 別 test file（`app-router.null-cache.test.tsx`）で `window.sessionStorage` の access を throw させ、`scrollRestorationCache === null` の precondition assert 後に `pruneScrollRestorationEntries()` / `createAppRouter()` が例外を投げる、または precondition assert 自体が silent pass する |
| DSR-17 (a)〜(i) 既存契約 | prune 導入による既存動作の破壊 | regression | SP5: existing app-router / HomePage / page-scroll suites unchanged green | `app-router.test.tsx`（T1/T4/T5/T9/T10/T11/T12/T13）/ `HomePage.test.tsx` / `page-scroll.test.ts` のいずれかが fail する |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `scrollRestorationCache.state[key]` | 起動時に sessionStorage から読込み（汚染分含み得る） | — | 起動時 sweep で non-main entry 削除 | 各 `onBeforeLoad` で `fromLocation` key を prune | — | 同一 key への再訪でも main entry のみ復元対象 | app 再起動（module 再 import）で sessionStorage から再読込み → 起動時 sweep が再度除染 | `scrollRestorationCache` が `null` なら prune は no-op のまま library の復元も動作しない（既存契約） | prune は idempotent（何度実行しても main entry のみが残る状態に収束） | SP1 / SP2 / SP4 |

## Adjacent Pattern Audit

- `applyMainNavScroll`（分類④ one-shot flag 消費、`app-router.ts:15-21`）は prune と独立した既存処理。prune が `<main>` entry を残す前提と衝突しないことを SP3 + SP5（既存 T4/T5/T13）で確認する。
- D-E 遅延再適用（`onRendered` handler 内の `MutationObserver` 経路、`app-router.ts:44-83`）は `getElementScrollRestorationEntry(... id: "main" ...)` で main entry を直接読むため、prune が main entry を保存し続ける限り無変更で動作する（SP5 = 既存 T12 で確認）。
- library の `onRendered` 自体の復元ロジック（`scroll-restoration.js:113-171`）は変更しない。prune は「復元対象になる前の cache 内容」を減らすだけの前段フィルタであり、復元ロジックへ手を入れない設計であることを Scope / Non-scope に明記済み。

## Negative Paths

- missing input: `event.fromLocation` が `undefined`（初回 load）→ prune 呼出し自体をスキップ（SP2 の初回 load ケースで確認、または実装 diff review）。
- invalid input: `scrollRestorationCache.state[key]` が未定義 → prune は no-op（例外なし、SP2/SP4）。
- duplicate/ambiguous input: 同一 key に対する複数回の prune 呼出し（起動時 sweep + 直後の `onBeforeLoad`）が idempotent であること（SP1 + SP2 の連続実行で確認）。
- unknown reference: 存在しない selector を明示的に消そうとしても no-op（実装は allowlist 方式のため該当ケースは構造的に発生しない）。
- dependency missing: `scrollRestorationCache` が `null`（SP4、別 test file で `window.sessionStorage` の access を throw させ isolated module 評価下で再現。`scrollRestorationCache === null` の precondition assert が前提）。
- permission/write failure: sessionStorage 書込み失敗は library 側の既存 safe-catch（`persist()` 内、非接触）。
- dry-run side effect: 該当なし（prune に dry-run モードはない）。

## Boundary Checks

- threshold: 該当なし（数値閾値を扱わない）。
- null/default: `scrollRestorationCache` が `null` のとき（SP4）。`state[key]` が `undefined` のとき（SP2 の未セット key）。
- empty/non-empty: SP1/SP2 は「main entry は残る（non-empty）」「positional entry は消える（empty）」の両方を同一 test 内で assert する（empty-set oracle collision 回避 — 削除できていないだけで green になる空検証を排除）。
- min/max: 該当なし。
- status/policy enum: 該当なし。
- wire type: sessionStorage の JSON 形状（`Record<string, Record<string, {scrollX, scrollY}>>`）。
- internal type: `scrollRestorationCache.state` の実行時形状（SP1〜SP4 で直接 assert）。
- producer/consumer: library（producer）→ 本 packet の prune（consumer）→ library の復元ロジック（consumer）。
- round-trip token: なし。
- precision/range: 該当なし（座標値は変更しない、削除のみ）。
- cross-language parse: 該当なし。

## Compatibility Checks

- old schema/input: 是正前バージョンで sessionStorage に永続化された sidebar entry（旧汚染分）は起動時 sweep で除染される（SP1 が起動時 seed データとして模擬）。
- new schema/input: 本 packet導入後に新規保存される entry も同じ prune 経路を通る（SP2）。
- output order: 該当なし。
- optional field behavior: `event.fromLocation` が `undefined` の場合の分岐（初回 load、negative path 節）。

## Data Safety Checks

- source-derived data: 該当なし。
- generated outputs: 該当なし。
- secrets: 該当なし。
- local-only files: sessionStorage のみ（WebView プロセス内、DB 非接触）。
- synthetic sample boundaries: test の seed href / selector 文字列はすべて synthetic。

## Main Wiring / Integration Checks

- helper connected to main path: `pruneScrollRestorationEntries` が `createAppRouter` 内（起動時）と `onBeforeLoad` 購読内（継続的）の両方から実際に呼ばれていることを SP1 + SP2 で確認する（helper 単体の unit test だけでなく配線ごと検証）。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 該当なし（router option の変更なし）。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- allowlist 判定を「main 以外を削除」から「常に何も削除しない」に劣化させたら？ → SP1 と SP2 が fail（positional entry が残る）。
- 起動時 sweep の呼出し行を削除したら？ → SP1 が fail（`createAppRouter()` 直後に positional entry が残る）。
- `onBeforeLoad` prune の対象 key を `event.fromLocation` から `event.toLocation` / `router.latestLocation` に変えたら？ → SP2 が fail（意図した key が prune されず、無関係な key が prune される）。
- allowlist 判定を反転させて main entry まで消すようにしたら？ → SP3 が fail（main entry が消失する）。
- `onBeforeLoad` 購読への prune 追加行を削除したら？ → SP2 が fail（2 回目以降の遷移で positional entry が再蓄積する）。
- `scrollRestorationCache` null guard を外したら？ → SP4 が fail（null mock 下で例外が投げられる）。

## 必須 mutation 注入（Final Review で clean tree 独立再実測）

| # | 注入 | kill 期待 |
|---|---|---|
| X1 | allowlist 判定を「常に true（何も削除しない）」に劣化させる | SP1 / SP2 |
| X2 | `createAppRouter` 内の起動時 sweep 呼出しを削除する | SP1 |
| X3 | `onBeforeLoad` prune の対象 key を `event.fromLocation` から `event.toLocation` に差し替える | SP2 |
| X4 | allowlist 判定を反転し main entry も削除対象にする | SP3 |
| X5 | `onBeforeLoad` 購読内の prune 追加行を削除する | SP2 |

## Residual Test Gaps

- WebView2 実機での sidebar 跳び解消の視認確認は自動 test 対象外（happy-dom は実 CSS レイアウト・実 scroll 挙動の完全再現ではない）— AC-L3（owner Windows native）で被覆する。
- `vi.resetModules()` による外部 npm package singleton の再評価は本 repo の vitest 設定では機能しない（Contract Probe P1b で実証済み、node_modules 配下は resetModules の対象外）。このため SP1 は「sessionStorage からの起動時再読込み」自体ではなく「`createAppRouter()` 呼出し時点で `scrollRestorationCache.state` に何が入っているかを prune するか」を検証する設計とする — 本番の module 初期化順序（sessionStorage 読込みは import 時に 1 回、以降は同一 singleton）と整合するため、これで起動時 sweep の契約は十分に検証できる。
- SP4（null cache）は `app-router.test.tsx` と同一 file では検証できない（`vi.mock("@tanstack/router-core")` の file scope 適用が同一 file 内の real-cache regression test〈T10/T12/T13〉を壊す）。別 test file（`src/lib/app-router.null-cache.test.tsx`）で `window.sessionStorage` の access を throw させ isolated module 評価下で `scrollRestorationCache` を `null` にする方式を採用し、`scrollRestorationCache === null` の precondition assert で isolation の成立を証明する。この precondition が成立しない場合の fallback（cache 注入可能な helper signature への変更）は本 Matrix ではなく packet Scope 4 に規定する。
