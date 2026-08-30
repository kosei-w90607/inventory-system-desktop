# Test Design Matrix: DSR-17 分類② scroll 位置復元 + 分類④主ナビ先頭の実装

Plan Packet: [../2026-08-31-dsr17-scroll-restoration-impl.md](../2026-08-31-dsr17-scroll-restoration-impl.md)

## Risk

Risk: R3

## Contracts Under Test

- DSR-17 (b): `getScrollRestorationKey` が `location.href` を返す（`__TSR_key` 既定に依存しない）。
- DSR-17 (c): `<main>` が `data-scroll-restoration-id="main"` で安定識別される。
- DSR-17 (d): `scrollToTopSelectors` が `[data-scroll-restoration-id="main"]` を含み、miss fallback が実 container に作用する。
- DSR-17 (g) / packet D-C: 主ナビ操作の one-shot flag が `onRendered` 購読（復元より後）で消費され、cache hit があっても `<main>` を先頭 scroll する。flag は両経路（`<Link>` / `ActiveMatchSidebarLink`）から set され、1 回で消費される。
- DSR-17 (e): `scrollPageToTop()` 経路が無変更で併存する。
- DSR-17 (h) / UI-11b-D12: HomePage one-shot の negative 契約が regression しない。
- DSR-17 禁止行: route component mount 契機の無条件 scroll を追加しない。
- DSR-17 分類②: 一覧 → 詳細 → returnTo 戻りで `<main>` scroll 位置が復元される（end-to-end）。

## Failure Modes

- `getScrollRestorationKey` 未設定・削除で既定 `__TSR_key` に落ち、push 戻りが常に cache miss → 復元が silent に不成立。
- `data-scroll-restoration-id` 欠落で cache selector が不安定化 / `scrollToTopSelectors` 不一致で miss fallback が `window` にしか効かない。
- 主ナビ flag の片経路配線漏れ（`ActiveMatchSidebarLink` 側だけ漏れる等）で、一部の主ナビだけ位置に飛ぶ。
- flag が消費されず残留し、次の無関係な遷移（returnTo 戻り等）で誤って先頭 scroll → 分類②を壊す。
- onRendered handler が復元より先に実行される配線（subscribe が setup より前）で、先頭 scroll が復元に上書きされ分類④不成立。
- handler の scroll が smooth になり、復元との二段 scroll が視認される。
- HomePage one-shot が router 復元に吸収・二重発火する（(h) 毀損）。
- route component に mount scroll が紛れ込む（PR #15 Amendment 2 の再演）。
- T10 harness が `setupScrollRestoration` を通らず mock で復元を偽装し、mutation 感度が自壊する。

## Test Matrix

| ID | 対象 | 種別 | 検証内容 / oracle | Cite |
|---|---|---|---|---|
| T1 | getScrollRestorationKey unit | 新規 | `state.__TSR_key` を持つ location を与えても戻り値が `location.href` と完全一致（literal 期待値）。href が異なる 2 location で異なる key | DSR-17 (b) / D-A |
| T2 | main-nav-scroll module unit | 新規 | `markMainNavScroll()` 後の `consumeMainNavScroll()` が true を 1 回だけ返し、2 回目以降と未 mark 時は false（one-shot 消費） | D-C |
| T3 | SidebarLink flag 配線 | 新規 | `<Link>` 経路と `ActiveMatchSidebarLink` 経路それぞれの click で flag が set される（**2 経路を個別 test に分ける** — 片側漏れ mutation の検出） | D-C / (g) |
| T4 | onRendered handler | 新規 | flag 消費時に `[data-scroll-restoration-id="main"]` 要素へ先頭 scroll（scrollTo spy: top 0 / behavior が smooth でない）。flag なしで handler が scroll を呼ばない（negative） | D-C |
| T5 | 分類④ cache hit 上書き | 新規 | T10 harness 上で、cache hit が成立する href へ主ナビ flag 経由で再訪 → `<main>` scrollTop が 0（復元値でない）。**cache hit が実在すること自体を前段 assert する**（hit なしで green になる空検証の排除） | (g) / PR #21 P3 |
| T6 | RootLayout 属性 | 新規 | render した `<main>` が `data-scroll-restoration-id="main"` 属性を持つ | DSR-17 (c) |
| T7 | HomePage negative regression | 既存 | `HomePage.test.tsx`（UI-11b-D12 negative「flag なし mount で scroll しない」含む）が**無変更で** green | DSR-17 (h) |
| T8 | page-scroll regression | 既存 | `page-scroll.test.ts` が**無変更で** green（(e) 併存） | DSR-17 (e) |
| T9 | router options 配線 | 新規 | `app-router.ts` が export する router の `options.scrollRestoration` 有効 / `scrollToTopSelectors` に `[data-scroll-restoration-id="main"]` / `getScrollRestorationKey` が href を返す（文字列 source 比較でなく挙動で検証） | DSR-17 (b)(d) |
| T10 | 分類② end-to-end（Contract Probe 兼務） | 新規 | 実 routeTree + memory history + 実 `setupScrollRestoration` harness。一覧の `<main>` に scrollTop を与え scroll event を dispatch → 詳細へ push → returnTo で戻る → scrollTop 復元。cache 未保存 href への遷移 → 先頭（miss fallback）。jsdom 制約で成立しない検証点は mock で偽装せず Residual Gaps へ記録して L3 へ振替 | 分類② / (a)(b)(c)(d) |

## State Lifecycle Matrix

| 状態 | 遷移 | 検証 |
|---|---|---|
| cache なし（初回訪問） | 遷移 | T10（先頭 fallback） |
| cache あり + returnTo push 戻り | 戻り | T10（位置復元） |
| cache あり + 主ナビ flag | 再訪 | T5（先頭が復元に勝つ） |
| flag 残留なし | 通常遷移 | T4 negative（誤発火なし） |
| 分類③ one-shot | 復元成功 navigate | T7（既存契約無変更） |

## Adjacent Pattern Audit

- `scrollPageToTop()` の呼出し元（分類①の保存系 + 分類③ HomePage）は非接触 — T7/T8 で保護。
- PR #23 の returnTo 導線（8 site + 共通 helper）は非接触 — 既存 test suite green で保護。
- `main.tsx` → `app-router.ts` 切出しは `src/test/render-with-router.tsx` / `route-error-fallback.test.tsx` の独自 createRouter に影響しない（それらは独自生成のまま）ことを Writer が確認。

## Negative Paths

- flag 未 set の onRendered → scroll 呼出しなし（T4）。
- HomePage flag なし mount → scroll なし（T7 既存）。
- cache 破損 / 欠落 → library 内 safe parse で miss 扱い → 先頭 fallback（T10 の miss case が代表）。

## Boundary Checks

- 同一 href に query 差がある場合は別 key（href 完全一致）— T1 の 2 location case が代表。
- scroll 位置 0 の保存 → 復元 0（先頭と区別不能だが挙動同一のため問題なし — 検証不要と明記）。

## Compatibility Checks

- 導入前の「復元なし・stale scroll 残存」から「miss 時 `<main>` 先頭」への変更は DSR-17 が契約化済みの意図された変更（regression 扱いしない）。
- 既存 sessionStorage 使用との key 衝突なし（Writer が `rg -l sessionStorage src/` で確認し PR body に記録）。

## Data Safety Checks

- scroll 座標と href のみ。業務データ非接触。

## Main Wiring / Integration Checks

- T10 が実 routeTree + 実 `setupScrollRestoration` の実配線を通す（mock 復元の偽装禁止）。
- `app-router.ts` 切出し後の起動配線は `npm run build` green + T9 で担保。

## Mutation-style Adequacy Questions

- getScrollRestorationKey を削除（既定 key に戻す）したら？ → T10 の復元 case が fail（push 戻りが miss になる）。
- `<main>` の data 属性を外したら？ → T6 が fail、T10 の復元 / miss fallback も fail。
- scrollToTopSelectors を外したら？ → T10 の miss fallback case（`<main>` scrollTop 0 確認）が fail。
- SidebarLink 片経路の mark を外したら？ → T3 の該当経路 test が fail。
- consume を常に false / 常に true にしたら？ → T2（one-shot 消費）と T4（negative）が fail。
- onRendered 購読を外したら？ → T4 / T5 が fail。

## 必須 mutation 注入（Final Review で clean tree 独立再実測、5 件）

| # | 注入 | kill 期待 |
|---|---|---|
| M1 | `app-router.ts` の `getScrollRestorationKey` 設定を削除（既定 `__TSR_key` に戻す） | T10（復元 case）/ T9 |
| M2 | RootLayout の `data-scroll-restoration-id` 属性を削除 | T6 / T10 |
| M3 | `scrollToTopSelectors` 設定を削除 | T10（miss fallback case）/ T9 |
| M4 | `ActiveMatchSidebarLink` 経路の `markMainNavScroll()` 呼出しを削除 | T3（該当経路） |
| M5 | onRendered handler の flag 消費分岐を常に false 化 | T4 / T5 |

## Residual Test Gaps

- jsdom は `window.scrollTo` 未実装・実 scroll 座標の視覚検証不能。smooth scroll と復元の視認干渉（がたつき）、WebView2 の sessionStorage 実機挙動（pagehide 発火・再起動時の残存）は自動 test 対象外 — L3-1〜L3-5 で被覆（DSR-17 (f)）。
- T10 harness が jsdom 制約で成立しない検証点が出た場合、Writer は mock 偽装せず本節へ追記して L3 へ振り替える（fail-closed）。
