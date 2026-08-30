# Plan Packet: DSR-17 分類② scroll 位置復元 + 分類④主ナビ先頭の実装（scrollRestoration 導入）

Design Phase は PR #21（squash `22504af`、2026-08-30 merge）で完了済み。DSR-17 の 3+1 分類と分類②の実装方式契約 (a)〜(h) は design-system 01 に正本化済み。本 packet はその runtime 是正 R3（owner 裁定 2026-08-30: R3 キュー ① DSR-18〈PR #23 完了〉→ ② 本 packet → ③ DSR-19/20 runtime）。(g) が「後続 R3 spike で選定」とした分類④の採用機構は、起票時 spike（本 packet「起票時実測 + spike」節)で確定した。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Claude Fable 5 (main session)
- Writer: Codex (GPT-5.6、発注書駆動)
- Plan Reviewer: Claude Sonnet 5 (independent fresh context)
- Final Reviewer: Claude Sonnet 5 (independent fresh context) + Coordinator mutation 独立再実測
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（WebView2 の sessionStorage 実機挙動 + cache hit/miss + smooth scroll 干渉 + 主ナビ先頭。DSR-17 (f) の revisit trigger 判定を含む）

Phase 遷移記録（kickoff → spec-check → design → plan-draft → plan-gate、本 plan-first commit に同乗）: task scope と R3 判定は本 packet に記録。spec-check では DSR-17 (a)〜(h) が方式正本として実装十分、ただし (g) の採用機構のみ「R3 spike で選定」の宿題であったため、design phase として起票時 spike（router-core 1.168.15 実読 + 順序保証実測）を実施し機構を確定（設計判断 D-C）。spike 判明事実の DSR-17 (g) への追記は本 packet の Scope 4（PR #21 Final Review P3 裁定の注記 1 文を含む）。packet + Test Design Matrix を同 commit で commit し plan-gate に至る。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
Risk Tiers R3 行のうち route/search state（全 route 遷移の scroll 位置決めに関与する router option の導入）、operator workflow（一覧→詳細→戻りの位置連続性・主ナビの初期表示という全画面横断の操作感変更）に該当。DB / POS CSV / Tauri command DTO / bindings / merge gate は変更しない（frontend router 層のみ、AC で bindings 差分ゼロを機械確認）。

## 起票時実測 + spike（2026-08-31、HEAD 696e3e7）

前提の現況実測（すべて Coordinator 実読・実行）:

- `scrollRestoration` 未設定: `rg -l "scrollRestoration" src/` hit 0。`main.tsx` の `createRouter` は routeTree / defaultPreload / defaultErrorComponent のみ。
- installed 実版数: `@tanstack/react-router` **1.168.23** / `@tanstack/router-core` **1.168.15**（`node_modules/*/package.json` 実読）。DSR-17 Why の観測事実（`__TSR_key` 既定 key、`scrollToTopSelectors` 既定 `['window']`、storage key `tsr-scroll-restoration-v1_3`）は同版数で有効。
- `<main className="min-h-0 min-w-0 overflow-auto">` は `RootLayout.tsx:65` の唯一 scroll container、`data-scroll-restoration-id` 未付与。
- `scrollPageToTop()`（`src/lib/page-scroll.ts`）は `document.querySelector("main")` + smooth scroll。分類①③の正本実装として存置対象（(e)）。
- HomePage one-shot（UI-11b-D11、`HomePage.tsx:32-40`）と negative test（`HomePage.test.tsx` 「flag なしの通常 mount では scroll しない」）実在 — (h) の AC 対象。
- 主ナビは **3 経路**（Plan Review round 1 P1-1 で 1 経路追加）: `SidebarLink.tsx` の `<Link>` 直接 + `ActiveMatchSidebarLink`（`useLinkProps`）+ `SidebarHeader.tsx:12-17` の店名ロゴ `<Link to="/">`（52 §52.1 が SidebarLink と並記する主ナビ要素）。layout 層の他 file（Sidebar / SidebarArea / RootLayout / DisplayScaleControl）に Link なしを rg で全数確認済み。分類④の発火契機はこの 3 経路。
- test 環境は **happy-dom**（`vitest.config.ts:11`、Plan Review round 1 P1-2 是正）: happy-dom の `Element.scrollTo()` は非 smooth 時に `scrollTop`/`scrollLeft` を同期セットし、`sessionStorage` も機能する。T10 harness の自動化範囲はこの実挙動を前提に判定する（jsdom の「scrollTo 未実装」制約は本 repo に当てはまらない）。
- **同一 href への遷移では `onRendered` が発火しない**（`react-router/dist/esm/Match.js:113-114` — emit 条件は `prevHrefRef.current !== currentHref`、`currentHref = router.latestLocation.href`。effect deps の `__TSR_key` が変わっても href 不変なら emit されない）。active な主ナビ項目の再クリックで flag が消費されず残留し得るため、D-C は target href 付き one-shot とする（Plan Review round 1 P2-1 対策）。

spike（router-core 1.168.15 dist 実読、file:line は `node_modules/@tanstack/router-core/dist/esm/` 基準）:

- 復元は `onRendered` event subscriber で実行（`scroll-restoration.js:113`）。処理順序は `resetNextScroll` gate → `scrollRestoration` function gate → cache 復元試行 → `restored === false` のときのみ top scroll + `scrollToTopSelectors`（`:118-171`）。
- **`resetScroll` は分類④に不成立（確定）**: `resetScroll` は `router.resetNextScroll`（`router.js:415`）に写され、「scroll 処理を丸ごと skip するか」の binary gate のみ。`true`（既定）でも cache hit の復元が先に走り、先頭 scroll は cache miss 時の fallback に過ぎない。PR #21 Final Review P3 の懸念は実装コードで確定した。
- **`scrollRestoration` function 化も分類④に不成立**: `(opts) => false` は早期 return =「scroll を一切触らない」で、前画面の stale scroll が残る。先頭表示にはならない（`:122`）。ただし (h) の分類③ route 適用除外（router を関与させない）用途には成立する。
- **「主ナビ目印 + 一意 key」も不成立**: `getScrollRestorationKey` は set 側（`onBeforeLoad` で fromLocation、`:106`）と get 側（toLocation、`:114`）の双方に使われるため、主ナビ由来 entry の位置が一意 key で保存されると、returnTo push 戻り（href key）と一致せず分類②が崩れる。また getKey は setup 時に closure 捕捉され動的差し替え不可（`:73`）。
- **採用機構（D-C）の成立根拠**: `router.subscribe` / `emit` は公開 API で、subscribers は `Set` の挿入順 `forEach`（同期、`router.js:146-160`）。`setupScrollRestoration(this)` は router constructor（`router.js:118`）で先に登録されるため、app が後から subscribe した `onRendered` handler は**必ず復元の後**に実行される。emit は react-router の `useLayoutEffect`（paint 前、`Match.js:112-125`）から呼ばれるため、復元 → 先頭上書きの 2 段 scroll は同一 frame 内で flash を生まない。
- sessionStorage 書込みは `pagehide` の `cache.persist()` のみ、走行中は in-memory（`:104-112`）。WebView2 実機挙動は L3。

## Goal

Goal Invariant:

### 最小完了条件

一覧→詳細→「前の画面へ戻る」（returnTo push 戻り、PR #23 実装済み）で、遷移元一覧の scroll 位置が復元される（DSR-17 分類②）。sidebar 主ナビゲーション操作による遷移は、同一 href の復元 cache が残っていても常に遷移先を先頭表示する（分類④）。復元 cache miss 時は `<main>` が先頭表示になる。既存の分類①③（`scrollPageToTop()` event-driven / HomePage one-shot）は無変更で動作する。

### 失敗定義

- 詳細から戻ったときに一覧の位置が復元されない（既定 `__TSR_key` のままの導入 = push 戻りで常に miss）。
- 主ナビ再訪で前回の scroll 位置に飛ぶ（分類④違反 — cache hit が残る同一 href への主ナビ再訪が必須検証、PR #21 P3 裁定）。
- 復元 miss 時に `<main>` でなく `window` にだけ先頭 scroll が作用し、実際の表示が先頭にならない。
- `HomePage.test.tsx` の negative test（UI-11b-D12）が regression する、または既存 `scrollPageToTop()` 経路が router 機構へ吸収・破壊される。
- `history.back()` 化など DSR-17 (a) / DSR-18 の push 戻り契約を壊す変更。

### 非目的

- DSR-18 returnTo 導線自体の変更（PR #23 完了、本 packet は位置復元の重ね掛けのみ）。
- 分類①③の実装変更（`scrollPageToTop()` / HomePage one-shot は (e) により正本のまま存置。干渉が Probe / L3 で観測された場合のみ (h) の function 化除外を適用する条件付き対応が Scope 5）。
- WebView2 以外（browser / モバイル）の scroll 挙動保証。
- `@tanstack/react-router` の版上げ（現行 1.168.23 のまま。版数依存の観測事実は DSR-17 Why と本 packet spike 節に記録済み、更新時は (f) の再検証 trigger）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

1. **router 生成の test 可能化**: `main.tsx` の `createRouter` 呼出しを `src/lib/app-router.ts`（新設）へ切り出し、`main.tsx` は import + render のみにする。router options の契約 test（T9）と onRendered 購読の配線を同 module に置くため。
2. **scrollRestoration 導入**（(b)(d)）: `app-router.ts` の `createRouter` へ `scrollRestoration: true`、`getScrollRestorationKey: (location) => location.href`、`scrollToTopSelectors: ['[data-scroll-restoration-id="main"]']` を設定。
3. **container の安定識別**（(c)）: `RootLayout.tsx` の `<main>` へ `data-scroll-restoration-id="main"` を付与。
4. **分類④ one-shot 機構**（D-C、(g)）: `src/lib/main-nav-scroll.ts` 新設 — `markMainNavScroll(targetPath)`（遷移先識別子付き flag set、再 mark は上書き）と `consumeMainNavScroll()`（one-shot 消費、戻り値は記録した識別子）の in-memory module（UI-11b-D11 と同型 + target 記録）。`app-router.ts` で router 生成直後に `router.subscribe("onRendered", ...)` を登録し、**flag を消費（残留させない）した上で、記録識別子が現 location と一致する時のみ** `<main>`（`[data-scroll-restoration-id="main"]`）を instant（behavior 指定なし）で先頭 scroll する。不一致時は消費のみ行い scroll しない（同一 href 再クリックの残留 flag が後続の無関係な遷移で誤発火しない — P2-1 対策）。mark は主ナビ **3 経路**（`SidebarLink.tsx` の `<Link>` onClick / `ActiveMatchSidebarLink` の click handler / `SidebarHeader.tsx` の店名ロゴ `<Link to="/">` onClick）で呼ぶ。
5. **DSR-17 (g) への spike 結果追記**（docs、PR #21 Final Review P3 裁定の履行）: `resetScroll` 候補の不成立確定（cache hit 復元が常に先行する実装順序、版数 1.168.15）、function 化の「④には不成立 / (h) 除外には可」、目印 + 一意 key の set/get 非対称による不成立、採用機構 = app 層 one-shot flag + `onRendered` 購読（subscriber 挿入順保証が根拠）を、実現候補 3 行の置換 + 注記として追記。review-checklist 対応行の変更は不要（カテゴリ 9 既存行が 3+1 分類を既に参照）。
6. **契約 test 追加**: Matrix T1〜T10。既存 test の削除・無効化なし（(h) の HomePage negative / page-scroll 既存 test は無変更 green が AC）。

## Non-scope

- 分類③ route の `scrollRestoration` function 化除外の**先行適用**（既定は除外しない。Probe / L3 で smooth scroll 干渉・one-shot 誤発火が観測された場合のみ Scope 5 相当の条件付き対応として gated amendment で追加 — (h) の機構候補として DSR-17 に記載済み）。
- `useElementScrollRestoration` / 複数 container 対応（scroll container は `<main>` 唯一が 52-ui §52.1 の正本）。
- Tauri command / DTO / bindings / DB の変更。

## 設計判断（実装方式の確定）

- **D-A（href key）**: `getScrollRestorationKey` は `location.href` を返す（DSR-17 (b) の契約どおり）。PR #23 の returnTo が遷移元 href を再現するため、set 側（離脱時保存）と get 側（戻り時参照）が同一 key で一致し、push 戻り復元が成立する。既定 `__TSR_key` は push ごとに新規発行で戻り復元不成立（DSR-17 Why + spike 確認）。
- **D-B（selector）**: cache selector と先頭 scroll 対象の両方を `[data-scroll-restoration-id="main"]` に統一（(c)(d)）。CSS class・DOM 階層に依存しない。
- **D-C（分類④機構）**: spike の結論により、DSR-17 (g) の実現候補 3 つはいずれも単独不成立。採用は第 4 の機構「app 層 one-shot flag + `router.subscribe("onRendered")` 購読で、復元後に `<main>` を先頭 scroll」。根拠は spike 節（順序保証・同一 frame・公開 API のみ使用・UI-11b-D11 同型の repo 先例）。flag は主ナビ 3 経路の click でのみ set し、onRendered で 1 回だけ消費する。**flag は遷移先識別子を保持し、handler は消費を必ず行った上で現 location 一致時のみ scroll する** — 同一 href への遷移では `onRendered` が発火しない（`Match.js:113-114` の href gate）ため、識別子なしの単純 flag では active 項目再クリックの残留 flag が後続遷移で誤発火し分類②を壊す（Plan Review round 1 P2-1）。復元機構への内部介入（cache 直接操作・private API）は版数脆弱のため不採用。
- **D-D（(h) 機構分離の既定）**: HomePage one-shot は `scrollPageToTop()`（smooth）専有契約のまま。router 復元（layoutEffect、paint 前）→ HomePage effect（mount 後）の順で実行されるため干渉は理論上限定的だが、実機の smooth scroll 干渉は (f) どおり L3 で検証し、fail 時は DSR-17 の revisit trigger（方式選定へ戻る）とする。

## Acceptance Criteria

- AC1: `app-router.ts` の router options に `scrollRestoration` / `getScrollRestorationKey`（href 返却）/ `scrollToTopSelectors`（`[data-scroll-restoration-id="main"]`）が設定されている（T9 + T1）。
- AC2: `RootLayout` の `<main>` が `data-scroll-restoration-id="main"` を持つ（T6）。
- AC3: 一覧 scroll → 詳細 → returnTo 戻りで `<main>` の scroll 位置が復元される（Contract Probe = T10 end-to-end）。
- AC4: cache hit が残る同一 href への主ナビ再訪で `<main>` が先頭表示される（T5、PR #21 P3 の必須検証）。mark 配線は主ナビ 3 経路（SidebarLink 2 + SidebarHeader 店名ロゴ）すべて（T3）。
- AC9: active な主ナビ項目の再クリック（同一 href、`onRendered` 非発火）で残留した flag が、直後の `returnTo` 戻りの位置復元を壊さない（T11）。
- AC5: 既存 `HomePage.test.tsx` の negative test（UI-11b-D12）と `page-scroll.test.ts` が**無変更で** green（(h) / (e)）。
- AC6: `src/lib/bindings.ts` の diff ゼロ。
- AC7: frontend gate（`npm run typecheck` / `npm run lint` / `npm run format:check` / `npm test` / `npm run build`）green + `cargo check --release` PASS。
- AC8: DSR-17 (g) に spike 結果（resetScroll 不成立確定 + 採用機構）が追記され、`bash scripts/doc-consistency-check.sh` clean（Scope 5）。

## Design Sources

- Requirements / spec: DSR-17 分類②④（scroll 契約 root）
- Architecture: 変更なし（UI 層内、router 設定と layout attribute のみ）
- Function / command / DTO: `docs/function-design/52-ui-shared-layout.md` §52.1（`<main>` 唯一 scroll container の正本）
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-17（(a)〜(h) 方式正本）/ DSR-18（returnTo push 戻り、PR #23 実装済み）/ DSR-03（分類①の正本、非接触）
- Decision log / ADR: 変更なし（spike 結果の durable home は DSR-17 (g) 追記 — Scope 5）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし（AC6 で差分ゼロ機械確認） | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | DSR-17 (a)〜(h) + 52 §52.1 | existing sufficient（(g) 採用機構の追記は本 PR Scope 5） |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | DSR-17 (g) 追記（spike 結果の正本化） | updated in this PR |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| 新規 util `src/lib/app-router.ts` / `src/lib/main-nav-scroll.ts` | — | test 同梱（T2 / T9）。route / command / doc 新設なし |
| REQ coverage | 新規 REQ token なし想定。Writer 作業中に必要になった場合は `generate_traceability` 再生成を同 commit で行う | 条件付き |
| route / operator 画面 / Tauri command | — | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| DSR-17 分類②（戻り位置復元） | 01 DSR-17 (a)(b) | D-A | href key で set/get 一致。既定 `__TSR_key` は push 戻り miss で棄却（spike 確認） | Scope 1-2 | T1 / T9 / T10 |
| DSR-17 (c)(d)（container 識別 + 先頭対象） | 01 DSR-17 | D-B | data 属性で階層非依存。既定 selector `['window']` は `<main>` に無効 | Scope 2-3 | T6 / T9 / T10 |
| DSR-17 分類④（主ナビ先頭） | 01 DSR-17 (g) | D-C | 候補 3 つ全て単独不成立（spike 確定）。onRendered 購読 + one-shot flag を採用。cache 内部操作は版数脆弱で棄却 | Scope 4 | T2 / T3 / T4 / T5 |
| DSR-17 (e)(h)（既存経路併存・機構分離） | 01 DSR-17 / UI-11b-D11/D12 | D-D | smooth 経路の専有契約維持。先行除外はせず観測駆動で gated amendment | 変更なし + AC5 | T7 / T8 |
| DSR-17 (f)（実機前提検証） | 01 DSR-17 | — | WebView2 sessionStorage / 干渉は自動 test 不能、fail 時は方式 revisit | L3 | Human Gate |
| DSR-17 (g) spike 結果の正本化 | 01 DSR-17 (g) | Scope 5 | PR #21 Final Review P3 裁定の履行 + 採用機構の durable 記録 | Scope 5 | AC8 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history: DSR-17 (a)〜(h) + Scope 5 の (g) 追記で成立。
- Plan-only durable decisions found and promoted to source docs: D-C（採用機構）と spike 判明事実を Scope 5 で DSR-17 (g) へ promote する。D-A/D-B/D-D は既存 (b)(c)(d)(e)(h) の実装で契約本体は DSR-17 が保持。
- Assumptions and constraints: 版数 1.168.23/1.168.15 の実装観測に依存する部分（処理順序・subscriber 順序）は spike 節に file:line 付きで記録し、router 更新時の (f) 再検証対象とする。
- Deferred design gaps: 分類③ route の function 化除外（観測駆動）、`useElementScrollRestoration` 複数 container（実需なし）。
- Test Design Matrix can cite design decision IDs: DSR-17 (a)〜(h) / D-A〜D-D を cite。
- Absolute guarantee / escape hatch self-check: 導入が全滅しても既存挙動（復元なし・stale scroll）へは戻るだけで操作不能にはならない。(f) の revisit trigger が方式レベルの escape hatch。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — frontend router 層のみ | — |
| Fact check / design decision split | 現況実測 + spike（file:line 付き、2026-08-31、HEAD 696e3e7）は観測事実。分類④の機構採用は D-C の design decision | 本 packet + Scope 5 |
| Lifecycle / retry | cache は sessionStorage（pagehide 書出し）。app 再起動での cache 残存/消滅は WebView2 実機依存 — L3 | Human Gate |
| Operator workflow | 一覧→詳細→戻りの位置連続性（月末確認・調査 flow）と主ナビの予測可能な初期表示の両立 | Matrix + L3 |
| Replacement path | not applicable（外部システム非接触） | — |
| Data safety / evidence | scroll 位置座標のみ。業務データ非接触 | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | WebView2 sessionStorage 実機挙動と smooth scroll 干渉の視認品質は自動 test で判別不能 — L3 必須（(f)） | Human Gate |
| 環境・再現性 | test 環境は happy-dom（`vitest.config.ts:11`）: `Element.scrollTo()` は非 smooth 時に scrollTop/scrollLeft を同期セット、sessionStorage も機能する。T10 の cache 保存→復元・miss fallback は自動 test で成立見込み。視認干渉（smooth のがたつき）と WebView2 実機挙動のみ L3 | Matrix Residual Gaps |

## Design Readiness

DSR-17 (a)〜(h) が方式契約を、52 §52.1 が container 前提を確定済み。(g) の唯一の未確定（採用機構）は起票時 spike で D-C として確定した。未解決の design 問題なし。

## Contract Probe

是正仮適用の end-to-end（T10）: Writer は実装後、実 routeTree + memory history + 実 `setupScrollRestoration` の harness で「一覧で `<main>` に scroll 値を与える（`scrollTop` 直接設定 + scroll event dispatch）→ 詳細へ push → returnTo で戻る → `<main>.scrollTop` が復元される」を通し、「cache 未保存の href へ遷移 → 先頭」「主ナビ flag 経由の再訪 → cache hit があっても先頭」を同 harness で通す。happy-dom（`vitest.config.ts:11`）は `Element.scrollTo()` の同期セットと sessionStorage をサポートするため、これらは自動 test で成立する前提で組む。happy-dom でも成立しない検証点が出た場合のみ、mock で偽装せず Residual Gaps へ記録して L3 項目に振り替え、Coordinator へ報告する（RTL で判別不能な race を green で塗り潰さない — Matrix 記載の規律）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-17 (a) push 戻り維持（`history.back()` 化しない） | 変更なし（PR #23 の `<Link>` 維持） | T10（push 遷移 harness） | — |
| DSR-17 (b) href key 明示 | `app-router.ts` getScrollRestorationKey | T1 / T9 | — |
| DSR-17 (c) container 安定識別 | RootLayout `<main>` data 属性 | T6 | — |
| DSR-17 (d) `<main>` 先頭 scroll 対象 | scrollToTopSelectors | T9 / T10（miss fallback） | L3-2 |
| DSR-17 (e) event-driven 併存 | 変更なし | T8（page-scroll 既存 test 無変更 green） | — |
| DSR-17 (f) 実機前提検証 | — | —（自動 test 対象外） | L3-1〜L3-4 + revisit trigger |
| DSR-17 (g) 分類④優先（D-C 機構） | main-nav-scroll.ts + 主ナビ 3 経路（SidebarLink 2 + SidebarHeader）+ onRendered 購読 | T2 / T3 / T4 / T5 / T11 | L3-3 |
| DSR-17 (h) 分類③機構分離 | 変更なし（既定は除外しない — D-D） | T7（HomePage negative 無変更 green） | L3-4 |
| DSR-17 禁止（mount 一律 scroll 再導入禁止） | 全 Scope | T7 + 実装 diff review（route component への scroll 追加なし） | — |
| 52 §52.1 `<main>` 唯一 container | RootLayout（属性追加のみ） | T6 | — |
| UI-11b-D11/D12（分類③ one-shot 専有） | 変更なし | T7 | L3-4 |

## Test Plan

Test Design Matrix: [test-matrices/2026-08-31-dsr17-scroll-restoration-impl.md](test-matrices/2026-08-31-dsr17-scroll-restoration-impl.md)

- targeted tests: getKey unit（T1）、one-shot module unit（T2）、主ナビ 3 経路の flag 配線（T3）、onRendered handler の消費時 scroll / 非消費時無動作（T4）、主ナビ cache hit 上書き（T5）、`<main>` 属性（T6）、router options 配線（T9）、flag 残留の無害化（T11）
- negative tests: flag 未 set で先頭 scroll しない（T4）、HomePage flag なし mount で scroll しない（T7 既存）
- compatibility checks: HomePage.test.tsx / page-scroll.test.ts 無変更 green（T7/T8、AC5）、bindings 差分ゼロ（AC6）
- data safety checks: 業務データ非接触
- main wiring/integration checks: Contract Probe の end-to-end（T10）、`main.tsx` → `app-router.ts` 切出し後の起動配線（build green で担保）
- Human Gate に L3 を含めるため、Writer 完了条件に `cargo check --release` を含める（CI gate ではない — release build blind spot 対策）

## Boundary / Wire Contract

- producer / consumer / wire type: 変更なし。Tauri command / DTO / generated bindings / JSON wire shape に非接触（AC6 で機械確認）
- 新規依存: なし（`@tanstack/react-router` 1.168.23 既存のまま。npm install 不要）
- sessionStorage: router-core が `tsr-scroll-restoration-v1_3` key を pagehide 時のみ書く（library 挙動、app からは非操作）。既存 app の sessionStorage 使用との key 衝突なし（`rg -l sessionStorage src/` で Writer が確認）
- invalid input: cache 破損 / 欠落は library 内 safe parse（miss 扱い → 先頭 fallback）。app 側に新規入力面なし
- compatibility: 導入前の挙動（復元なし）に対し、復元 miss 時は「`<main>` 先頭」で従来の「stale scroll 残存」より予測可能な側へ変わる（DSR-17 が契約化済みの意図された変更）

## Review Focus

- 既定 key への依存混入（`getScrollRestorationKey` 欠落・`__TSR_key` fallback の残存 — 戻り復元が silent に不成立になる型。T1/T9 の弁別性）
- 分類④ one-shot の 3 経路配線（SidebarLink の `<Link>` / `ActiveMatchSidebarLink` / SidebarHeader 店名ロゴの漏れ — T3 が 3 経路を個別 assert しているか)
- flag の target 一致契約（消費が必ず先行し、不一致時に scroll しない — 単純 boolean flag への劣化は同一 href 再クリックの残留で分類②を壊す。T11 の弁別性）
- onRendered handler の instant scroll（smooth にすると復元との干渉が視認される — behavior 未指定 / `"instant"` を確認）
- flag のリーク（消費されない flag が次の無関係な遷移で誤発火 — T4 の消費一回性）
- T10 harness の実効性（`setupScrollRestoration` を実際に通しているか、mock で復元を偽装していないか。happy-dom でも不成立の検証点が green に偽装されず Residual Gaps に記録されているか）
- DSR-17 (g) 追記の正確性（spike の file:line・版数・不成立理由が本 packet spike 節と一致し、誇張・省略がないか）
- mount 一律 scroll の再導入がないか（route component への scroll 呼出し追加ゼロ — DSR-17 禁止行）

## Spec Contract

Contract ID: SPEC-DSR17-SCROLL-RESTORATION-2026-08-31

- router は `scrollRestoration` 有効 + `location.href` key + `[data-scroll-restoration-id="main"]` の先頭 scroll 対象で構成する
- `<main>`（唯一の scroll container）は `data-scroll-restoration-id="main"` で安定識別する
- returnTo push 戻り（DSR-18）で遷移元の `<main>` scroll 位置が復元される。cache miss 時は `<main>` 先頭
- sidebar 主ナビゲーション操作（SidebarLink 2 経路 + SidebarHeader 店名ロゴの 3 経路）による遷移は、同一 href の cache hit が残っていても常に先頭表示する（app 層の遷移先識別子付き one-shot flag + `onRendered` 購読、復元より後に実行。flag は消費が必ず先行し、識別子不一致時は scroll しない）
- `scrollPageToTop()`（分類①③）と HomePage one-shot（UI-11b-D11/D12）は無変更で併存する
- route component の mount を契機とする無条件 scroll は追加しない

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| DSR-17 (b) href key | Scope 1-2 | T1 / T9 | 既定 key 依存混入 | Matrix |
| DSR-17 (c)(d) container | Scope 2-3 | T6 / T9 / T10 | selector 統一 | Matrix |
| DSR-17 (g) 分類④ D-C | Scope 4 | T2〜T5 / T11 | 3 経路配線・消費一回性・target 一致 | Matrix |
| DSR-17 (e)(h) 併存分離 | 変更なし | T7 / T8 | 既存 test 無変更 green | PR body |
| DSR-17 分類② end-to-end | Scope 1-4 | T10 | harness 実効性 | Matrix |
| DSR-17 (f) 実機 | — | — | — | L3 + PR body |
| DSR-17 (g) 追記 | Scope 5 | AC8 | 追記の正確性 | doc check + diff |

## Data Safety

scroll 位置座標と href のみを扱う。業務データ・実店舗データに非接触。

## Human Gate（owner Windows native L3）

fixture: 追加投入不要（PR #23 L3 で使用した既存開発 DB の記録で一覧 scroll が発生する行数があれば足りる。一覧が 1 画面に収まり scroll が発生しない場合のみ、任意の記録を数件追加して行数を確保する — 事前に Ready 依頼時へ現況目安を添える）。

- L3-1（分類② 復元）: 入出庫履歴 hub で下へ scroll → 「詳細を見る」→「前の画面へ戻る」→ 同じ位置に復元される。
- L3-2（miss fallback）: 初回訪問の画面へ遷移 → 先頭表示される（stale scroll が残らない）。
- L3-3（分類④）: 一覧で scroll → 詳細 → 戻り（cache 生成）→ sidebar で別画面 → sidebar で同じ一覧へ再訪 → **先頭表示される**（位置に飛ばない — PR #21 P3 の必須検証）。店名ロゴ → Home でも同様に先頭表示（3 経路目）。
- L3-3b（flag 残留なし）: active な主ナビ項目をそのまま再クリック → その後、一覧 scroll → 詳細 → 戻りの位置復元が壊れない（AC9 の実機確認）。
- L3-4（分類③干渉なし）: バックアップ復元成功 → Home が先頭表示（既存 one-shot）+ 通常の Home 再訪では scroll しない。smooth scroll と復元の視認干渉（がたつき・二段 scroll）がないか。
- L3-5（sessionStorage 実機）: アプリを閉じて再起動 → 直前の scroll cache の残存/消滅いずれでも操作破綻がない（(f)）。

いずれかの fail は DSR-17 (f) の revisit trigger（方式選定へ戻る）— fail 時は merge せず Coordinator へ差し戻す。

## Review Response

Plan Review / Final Review の記録は本節へ append-only で追記する。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### Plan Review rally 記録（2026-08-31、append-only）

- round 1（Sonnet 独立 reviewer、対象 = plan-first commit `4b90108`）: P1 2 / P2 1 / P3 0。spike の file:line 引用は全数実読一致（resetScroll 不成立・順序保証・D-C 成立根拠は正確と判定）。
  - P1-1 **採用**: 主ナビに `SidebarHeader.tsx:12-17` の店名ロゴ `<Link to="/">`（3 経路目）が漏れていた。Coordinator が実読 + layout 層全 file の rg で 3 経路全数を確定し、Scope 4 / AC4 / Spec Contract / Ledger / Review Focus / L3-3 / Matrix T3 へ反映。
  - P1-2 **採用**: test 環境を jsdom と誤記（実際は happy-dom、`vitest.config.ts:11` — Coordinator 実読確認）。happy-dom は `Element.scrollTo()` 同期セットと sessionStorage をサポートするため、T10 の自動化範囲を拡大し Residual Gaps を視認干渉 + WebView2 実機に絞る再判定を実施。
  - P2-1 **採用**: 同一 href への遷移では `onRendered` が発火しない（`Match.js:113-114` の href gate — Coordinator 実読確認）ため、単純 boolean flag では active 項目再クリックの残留 flag が後続遷移で誤発火する。D-C を「遷移先識別子付き one-shot（消費先行 + target 一致時のみ scroll）」へ改訂し、AC9 / T11 / M6 / L3-3b を追加。

## 発注・レビュー段取り

- Writer: Codex（発注書は plan-approved 後に Coordinator が作成）。
- Plan Reviewer: Sonnet subagent（fresh context、P1/P2 = 0 で plan-approved）。
- Final Reviewer: Sonnet subagent 別個体 + Coordinator が Matrix 記載の mutation を clean tree で独立再実測。
- hosted final: non-doc R3 のため Ready 化で自動 run。
