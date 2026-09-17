# Plan Packet: ㉙ returnTo 衛生（guard の origin 判定 / 戻り link の search object 化 / 数字だけの検索語の往復、R3）

2026-09-17 起草。出典は Backlog「やると決めたもの（順番未定）」の [returnTo 衛生](../backlog.md) 行（NAV-1〈PR #75〉Final Review round 1 pass B / round 2 pass B の P3 5 件）。owner 2026-09-17「returnTo 衛生やろうか」で着手。起票時の現物調査で同じ failure class の実害 1 件（S5、入出庫履歴の数字だけの検索語が戻りで消える）を見つけ、同 lane に含める。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Evidence Mode: github
- Phase: implementing
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 5ceb30addb87dbb40e24a9332426f08946cb2b54
- Amendments: none
- Coordinator: Fable 5.1
- Writer: Sonnet subagent（worktree 分離、Plan Reviewer / Final Reviewer とは別 fresh context）
- Plan Reviewer: Sonnet（独立 fresh context）
- Final Reviewer: Sonnet + Opus（独立 fresh context）
- Final Review Minimum: 2
- Human Gate: ready,merge,manual

manual = owner Windows native L3 1 往復（AC-L3-1）。route/search state の変更で、NAV-1 では自動 test が全 pass のまま L3 で欠陥（数字だけの商品コード）が出た実績があるため省略しない。

遷移記録（append-only）:

- kickoff → spec-check → design → plan-draft → plan-gate（本 commit、plan-first）: 設計正本の改訂点（DSR-15 / DSR-18 / 66 UI-06c-D9 / 60 系の入出庫履歴 returnTo）は Scope S6 に列挙し、実装と同じ PR で同期する。owner の設計判断を要する論点なし（挙動は「戻り先が同じ画面・同じ条件のまま」で不変、不正値の拒否範囲が広がるだけ）
- plan-gate → plan-approved → implementing（本 commit、state-only）: Plan Review round 1（Sonnet、P1/P2 = 0、P3 3）→ in-place 是正 `5ceb30ad`。P3 のみのため reviewer 再投入なし。Plan Commit = `5ceb30ad`（plan-first `b5cc6b5e` → 是正を含む確定版）。実装は Sonnet subagent の worktree run で本 commit を起点にする

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 10分
- relay 往復上限: 0（Writer / Reviewer とも subagent、Codex relay なし）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
route/search state（`returnTo` の検証と、戻り link が router へ渡す `to` / `search` の形）を変える。DB / command DTO / bindings は不変。

## Goal

Goal Invariant:

### 最小完了条件

- 「前の画面へ戻る」「在庫照会へ戻る」は、これまで戻れていた遷移元（pathname + 検索条件）へ同じように戻る
- 入出庫履歴で数字だけの語（JAN・商品コード）を検索 → 詳細 → 「前の画面へ戻る」で、検索語が残った一覧へ戻る（現状は消える）
- `returnTo` に `/\host` や tab 入りの値が来ても app 外の origin を指す link を描画せず、既定 hub へ fallback する

### 失敗定義

- 既存の戻り導線（業務記録詳細 6 画面 / 在庫変動履歴 / 商品 form）のどれかで、戻り先の pathname か検索条件が変わる・失われる
- 「在庫照会へ戻る」が `/stock` 以外へ着地する
- guard を強めた結果、正当な `returnTo`（入れ子の `returnTo` を含む 3 段往復）が fallback へ落ちる

### 非目的

- 商品一覧の typed parse-back（`src/features/products/lib/return-to.ts`）の変更。DSR-18 が exact-allowlist として存置を決めている
- `returnTo` の送信側 site の追加・削除、label 文言の変更、`history.back()` 化（DSR-17 (a) で不採用）
- `returnTo` の長さ上限（`max(500)`）と入れ子の深さの再設計

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-17、`d49913e7`）

- guard 現物: `src/lib/return-to.ts` の `normalizeReturnTo` は `value?.startsWith("/") && !value.startsWith("//")` のみ
- Contract Probe 1（node、`new URL(v, "http://inventory.local")`）: `"/\\evil.example"` → 現 guard 通過・origin `http://evil.example` / `"/\t/evil.example"` → 現 guard 通過・origin `http://evil.example` / `"/%09/evil.example"`（percent 表記のまま）→ origin は local で pathname `/%09/evil.example`（無害。backlog の `/%09/` は decode 後の tab を指す）/ `"//evil.example"`・`"https://evil.example"` → 現 guard で拒否済み / `"/a/../b?x=1#h"` → local、pathname `/b`、search `?x=1`、hash `#h`
- 文字列 `to` の site: `rg -n '<Link to=\{(backHref|safeReturnTo)\}>' src/features` = 13 hit（業務記録詳細 6 画面 × 2 + `StockMovementsPage.tsx:94`）。詳細 6 画面の label は「前の画面へ戻る」、在庫変動履歴だけ「在庫照会へ戻る」
- canonical（`to` = pathname、`search` = object）: `InventoryRecordsPage.tsx:69-78` `buildDetailLinkProps` / `MovementTable.tsx:38-45` `sourceLinkProps`
- router の search 直列化は既定（`rg -n 'parseSearch|stringifySearch' src --glob '!routeTree.gen.ts'` = 0 hit）。`@tanstack/react-router` 1.168.23
- Contract Probe 2（node）: `defaultStringifySearch({q:"123",selected:"BT0002",page:2,returnTo:"/stock?q=%22123%22"})` = `?q=%22123%22&selected=BT0002&page=2&returnTo=%2Fstock%3Fq%3D%2522123%2522`、これを `defaultParseSearch` すると `{"q":"123","selected":"BT0002","page":2,"returnTo":"/stock?q=%22123%22"}` に戻る（router が作った href は往復する）
- Contract Probe 3（node、S5 の実害）: `defaultParseSearch("?q=2099000000019&page=2")` = `{"q":2099000000019,"page":2}`、`typeof q` = `number`、`z.string().max(100).optional().catch(undefined).parse(q)` = `undefined`。`InventoryRecordsPage.tsx:54-67` `buildInventoryRecordsReturnTo` は `URLSearchParams` で手組みするため `q=2099000000019`（引用符なし）を作る。route schema は `src/features/inventory-records/types.ts:43` `q: z.string().max(100)`。NAV-1 GA5 と同じ機序
- 他の手組み site: `StockMovementsPage.tsx:75-85` `detailReturnTo`（値は日付 / enum / page / 入れ子 `returnTo` のみで、数字だけの string 値を持たない）/ `src/features/products/lib/return-to.ts` `buildProductListReturnTo`（受け側が `parseProductListSearchFromReturnTo` の typed parse-back で router の `parseSearch` を通らない）
- `selected` 上限: `src/features/stock-inquiry/types.ts:37` `selected: z.string().min(1).max(20)`、同 `:31` `q` は `max(100)`。商品コードの長さ上限は DB（`schema_v1.rs:30` `product_code TEXT PRIMARY KEY`）にも BIZ（`product_service.rs:1067` は空判定のみ）にも無い。20 文字超の商品コードでは `selected` だけ落ちて fallback の選択が外れる
- T2-num 現物: `StockMovementsPage.test.tsx:419-433`。href の `q` / `selected` を `JSON.parse` して string を確認するだけで、`stockInquirySearchSchema` までは通していない

## Scope

- **S1 guard を origin 判定へ**（`src/lib/return-to.ts`）: `normalizeReturnTo(value, fallback)` は `new URL(value, "http://inventory.local")` が throw せず、`value` が `/` 始まりで、origin が base と一致するときだけ通す。返す値は `pathname + search`（hash は落とす。app は hash を使わない）。先例 = `src/features/products/lib/return-to.ts:12-21`。署名と既存 8 case の期待値は不変
- **S2 戻り link の props helper**（同 file）: `returnToLinkProps(value, fallback, options?)` を追加し `{ to: string; search: Record<string, unknown> }` を返す。`to` = pathname、`search` = `defaultParseSearch(url.search)`。fallback も同じ経路で分解する。`options.pathname` を渡した場合、解決した pathname がそれと一致しなければ不正値として扱う（S3 の pin）
- **S3 consumer 7 file の置換**: 業務記録詳細 6 画面（`Receiving` / `Return` / `ManualSale` / `Disposal` / `CsvImport` / `Stocktake` `RecordDetailPage.tsx`）の `<Link to={backHref}>` 12 箇所を `<Link {...returnToLinkProps(returnTo, "/inventory/records")}>` 相当へ。`StockMovementsPage.tsx:74,93-103` は `options.pathname = "/stock"` で pin し、不一致・欠落・不正は現行の `<Link to="/stock" search={{ q, selected }}>` fallback へ
- **S4 `selected` 上限を `q` と揃える**（`src/features/stock-inquiry/types.ts:37`）: `max(20)` → `max(100)`
- **S5 入出庫履歴の returnTo を router の href から取る**（`InventoryRecordsPage.tsx`）: `buildInventoryRecordsReturnTo` の手組みをやめ、他の送信側 8 site と同じ `useRouterState({ select: (s) => s.location.href })` にする（DSR-18「現在の pathname + search state を returnTo に直列化」の本則どおり。手組み関数は削除）
- **S6 設計正本の同期**（同 PR、docs commit は分けてよい）: `docs/design-system/01-decision-rules.md` DSR-15（判定を origin 一致へ、`/\` と制御文字の例）/ DSR-18（helper の最低基準、`to` は pathname・`search` は object、送信側は router の href）/ 改訂履歴 1 行。`docs/function-design/66-*.md` UI-06c-D9（pathname pin、`<Link to={safeReturnTo}>` の記述を置換）。入出庫履歴の function-design に returnTo の生成方法の記述があれば同期（Writer が `rg -n 'buildInventoryRecordsReturnTo|returnTo' docs/function-design` で特定し、無ければ追記しない）
- **S7 test**: Test Design Matrix の T1〜T8。REQ 付き test 名を追加・変更するため `cargo run --bin generate_traceability` で `90-traceability.md` を再生成する

## Non-scope

- `src/features/products/**` の returnTo（typed parse-back、DSR-18 で存置）
- `StockMovementsPage.tsx` の `detailReturnTo` 手組み（起票時実測のとおり数字だけの string 値を持たない。S5 と同じ href 化は入れ子の形が変わるため別判断）
- route schema の `returnTo: z.string().max(500)` の見直し、`src/routes/**` の変更
- 送信側 8 site（`useRouterState` の href を送る既存 site）
- Backlog 同行の closeout 以外の `Plans.md` / `backlog.md` 編集（closeout PR で行う）

## Acceptance Criteria

- **AC1** `npx vitest run src/lib/return-to.test.ts` が pass し、T1 の新 case（`/\evil.example` / `/\t/evil.example` / `/ok#frag` → hash なし）と T2（`returnToLinkProps`）を含む
- **AC2** `rg -c '<Link to=\{(backHref|safeReturnTo)\}>' src/features` の合計が 0（baseline 13、逐語実行で確認: `rg -n '<Link to=\{(backHref|safeReturnTo)\}>' src/features | wc -l` = 13）
- **AC3** `rg -n 'buildInventoryRecordsReturnTo' src` = 0 hit（baseline: 2 hit、`InventoryRecordsPage.tsx:54,82`）
- **AC4** `npx vitest run src/features/inventory-records src/features/stock-movements src/features/stock-inquiry src/lib` が pass。既存 test の期待 href を変える場合は、変更前後の href を `defaultParseSearch` した結果が deep-equal であることを PR body に 1 行ずつ示す（percent-encoding の差だけを許す。router が作った href を入力にした case は文字列一致を要求する、T3 / T8）
- **AC5** mutant（Writer が注入 → FAIL を確認 → 復元、Final Reviewer が独立に再注入）: (1) S1 の origin 判定を旧 `startsWith` に戻す → T1 の `/\` case が FAIL (2) S2 の `options.pathname` 判定を外す → T4 が FAIL (3) S5 を手組みへ戻す → T6 が FAIL (4) S4 を `max(20)` へ戻す → T7 が FAIL (5) S2 の `search` を `{}` 固定にする → T3（検索条件つき returnTo）が FAIL
- **AC6** `bash scripts/local-ci.sh full` が pass（traceability 再生成を含む生成系検査が clean）
- **AC7** `bash scripts/doc-consistency-check.sh` が ERROR 0
- **AC-L3-1**（owner、Windows native）: 結果は `python3 scripts/pr-gate.py record` の manual record に残す。(a) 入出庫履歴で数字だけの語（13 桁 JAN か数字だけの商品コード）を検索 → 任意の行の詳細 → 「前の画面へ戻る」→ 検索語と結果が残っている (b) 在庫照会で検索 → 商品を選択 → 在庫変動履歴 → 元記録の詳細 → 「前の画面へ戻る」→ 「在庫照会へ戻る」で、検索条件と選択行が戻る（NAV-1 の 3 段往復が壊れていない）

## Design Sources

- Requirements / spec: REQ-207（業務記録の参照と戻り導線）/ REQ-303（在庫変動履歴）/ REQ-301（在庫照会）
- Architecture: `docs/ARCHITECTURE.md`（UI 層のみ。CMD / BIZ / IO 不変）
- Function / command / DTO: `docs/function-design/66-*.md` UI-06c-D2 / UI-06c-D9
- DB: 該当なし
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-15 / DSR-17 (a) / DSR-18
- Decision log / ADR: 新規 D-xxx なし（DSR の extend で足りる）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし（bindings 不変） | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | DSR-15 / DSR-18 / 66 UI-06c-D9 | updated in this PR（S6） |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| Durable decision / ADR | DSR 改訂履歴 1 行 | updated in this PR |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| REQ coverage 追加（設計書・テスト追加） | `cargo run --bin generate_traceability` で `90-traceability.md` 再生成（S7） |

他の行（command / function-design doc 新設 / route 新設 / operator 画面新設 / consultation relay）は該当なし。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-207 | 01-decision-rules DSR-15 | DSR-15（改訂） | prefix 判定は `/\` と tab を通す（Probe 1）。URL 解析後の origin 一致は products 側で確立済みの形。棄却: 拒否文字の列挙（漏れる） | S1 | T1 |
| REQ-207 | 01-decision-rules DSR-18 | DSR-18（改訂） | 文字列 `to` は規約外（`InventoryRecordsPage.tsx:69-71`）。helper 1 つで guard と分解を同時に行い、site ごとの複製を作らない | S2 / S3 | T2 / T3 / T5 |
| REQ-303 | 66 UI-06c-D9 | UI-06c-D9（改訂） | label「在庫照会へ戻る」と行き先の一致。棄却: label を「前の画面へ戻る」へ変える（NAV-1 で不採用済み） | S3 | T4 |
| REQ-301 | 66 / stock-inquiry types | UI-06c-D9 | 商品コードに長さ上限が無いのに `selected` だけ 20。`q` と同じ 100 に揃える。棄却: 商品コードに上限を新設（DB / import の契約変更で別 lane） | S4 | T7 |
| REQ-207 | 01-decision-rules DSR-18 | DSR-18（改訂） | 送信側は router の href（引用符付き直列化）を使う本則。手組みは数字だけの string を number にする（Probe 3） | S5 | T6 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: S6 の改訂後は yes（DSR-15 / DSR-18 / UI-06c-D9 に判定方法・理由・例が入る）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 「hash は落とす」「送信側は router の href」を DSR-18 へ
- Assumptions and constraints: router の search 直列化は既定のまま（起票時実測）。custom `parseSearch` を入れる change は本 helper を同時に見直す
- Deferred design gaps, risk, and follow-up target: `detailReturnTo` の手組み（Non-scope、現状は無害）/ 商品コードの長さ上限の不在（backlog 候補、Coordinator が closeout で起票）
- Test Design Matrix can cite design decision IDs or source doc sections: yes
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「app 外 origin を描画しない」は T1 の拒否 case と AC5 (1) で検査。escape hatch = 呼出側 fallback（不変）。products の exact-allowlist は非接触

## Impact Review Lenses

Fact check / design decision split lens のみ該当: 外部 library（TanStack Router 1.168.23）の search 直列化の挙動を Contract Probe 1〜3 で事実確認し、設計判断（S1〜S5）と分けて記録した。他の lens は not applicable（field 調査・実機・POS / CSV 起点ではない）。

## Design Readiness

- Existing design docs are sufficient because: 挙動の本則（遷移元へ戻る、不正は fallback）は DSR-18 で確定済み。本 lane は検証強度と組み方の是正
- Source docs updated in this PR: DSR-15 / DSR-18 / 66 UI-06c-D9（S6）
- Design gaps intentionally deferred: `detailReturnTo` 手組み / 商品コード長の上限
- Durable decisions discovered in this plan and promoted to source docs: hash を落とす / 送信側は router の href

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI のみ
- Backend function design: 該当なし
- Command / DTO / data contract: 不変
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言不変
- Error, empty, retry, and recovery behavior: 不正 `returnTo` は既定 hub へ fallback（不変、拒否範囲のみ拡大）
- Testability and traceability IDs: REQ-207 / REQ-301 / REQ-303、SPEC-RETURNTO-HYGIENE-2026-09-17

## Contract Probe

- `new URL` が `/\host` と tab 入りを外部 origin に解決する: node で 9 値を解析 -> 起票時実測 Probe 1 のとおり（現 guard は 2 値を通す）
- router が作った href は `defaultParseSearch` → `<Link search>` で同じ search に戻る: node で stringify → parse -> Probe 2 のとおり往復
- 手組みの `q=<数字だけ>` は route schema で落ちる: node で parse → zod -> Probe 3 のとおり `undefined`
- 未実測（Writer が実装時に確認し PR body へ記録）: `<Link to={pathname} search={parsed}>` の描画 href が、既存 test の期待 href と `defaultParseSearch` 後に deep-equal であること（AC4）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-15 不正 returnTo は fallback（外部 URL / `//` / `/\` / 制御文字） | S1 | T1 | — |
| DSR-18 遷移元の pathname + search へ戻る（業務記録詳細 6 画面） | S2 / S3 | T3 / T5、既存 T11 系（6 file の `returnTo %s を安全に %s へ正規化する`） | AC-L3-1 (a) |
| DSR-18 送信側は現在の pathname + search state を直列化 | S5 | T6 | AC-L3-1 (a) |
| DSR-18 products の exact-allowlist は存置 | 非接触 | 既存 `src/features/products/lib/return-to.test.ts` | non-scope |
| DSR-17 (a) / (b) 戻り先の href が遷移元の href を再現する（href key の scroll 復元と相互補完） | S2 / S3（router が作った href を `returnTo` にした場合、戻り link の href は元の href と文字列一致） | T3 / T8（文字列一致の assertion） | AC-L3-1 (a) |
| DSR-17 (a) 戻りは `<Link>` push のまま | S3（`history.back()` にしない） | 既存 `app-router.test.tsx` T10 | — |
| UI-06c-D9 「在庫照会へ戻る」は `/stock` に着地、欠落・不正は `q` / `selected` fallback | S3 | T4、既存 `SPEC-UI06C-D9-R1` 4 case + T2-num | AC-L3-1 (b) |
| UI-06c-D9 入れ子 `returnTo` の 3 段往復 | S1（入れ子を壊さない） | T1（入れ子 `returnTo` つきの値が guard を通る case）、既存 `StockMovementsPage.test.tsx:435`（href に `%26returnTo%3D` を含む静的 assertion） | AC-L3-1 (b)（実クリックの 3 段往復） |
| UI-06c-D2 `returnTo` は検索 query に渡さない | 非接触 | 既存 | — |
| stock-inquiry `selected` は商品コードを落とさない | S4 | T7 | — |

## Test Plan

[Test Design Matrix](test-matrices/2026-09-17-return-to-hygiene.md)。

- targeted tests: T1〜T8
- negative tests: T1（拒否 case）/ T4（pathname 不一致）
- compatibility checks: 既存の期待 href（AC4）、products 側 test 非接触
- data safety checks: 該当なし（synthetic 値のみ）
- main wiring/integration checks: T8（実 routeTree + memory history。既存 `ReturnToFlow.test.tsx` の harness〈現状は T10 の 2 段往復 1 本〉を再利用して入出庫履歴の往復を足す。在庫照会起点の 3 段往復の実クリックは自動 test に無く、AC-L3-1 (b) が受け持つ）
- commit 構成: test と実装は同 commit でよい。docs（S6）と `90-traceability.md` 再生成は別 commit でよい。packet / Matrix / `Plans.md` は Writer が編集しない

## Boundary / Wire Contract

- producer: 送信側 site（`useRouterState` の `location.href`。S5 で入出庫履歴も同じ形）
- consumer: `returnToLinkProps` / `normalizeReturnTo`（業務記録詳細 6 画面、在庫変動履歴）
- wire type: URL search param `returnTo`（string、route schema `max(500)`、不変）
- internal type: `{ to: string; search: Record<string, unknown> }`
- precision/range: pathname + search のみ（hash は落とす）。origin は `http://inventory.local` 基準で一致必須
- round-trip path: 一覧 href → `returnTo` → 詳細の戻り link（`to` + `search`）→ router stringify → 一覧 route の `validateSearch`
- invalid input: 欠落 / 空 / `/` 始まりでない / 外部 origin に解決される / URL として解析不能 / `options.pathname` 不一致 → fallback
- compatibility: 既存の bookmark 相当（手組み形式の `returnTo`）は引き続き受理する（数字だけの値が落ちる既存挙動は受信側では直さない。送信側 S5 で発生源を止める）

## Review Focus

- guard を強めて正当な入れ子 `returnTo` を落としていないか（T8）
- 既存 test の期待 href を書き換えた箇所が encoding 差だけか（AC4）
- helper が 1 箇所に収まり、site ごとの分解ロジックの複製が無いか（保守者可読性）
- 戻り link の href が元の一覧 href と文字列一致するか（DSR-17 (b) の scroll 復元 key は `location.href`。AC4 が許す percent-encoding 差は手組み形式の旧 `returnTo` に限り、router が作った href では差を許さない。差が出た場合の影響は scroll 位置が先頭へ落ちるだけで Goal Invariant 外）
- S5 で href を使うことで `returnTo` に既定値の search（`recordType=all` 等）が乗る場合、戻り先の表示が変わらないか

## Spec Contract

Contract ID: SPEC-RETURNTO-HYGIENE-2026-09-17

- C1: `normalizeReturnTo` は base origin に解決される `/` 始まりの値だけを `pathname + search` で返し、それ以外は fallback を返す
- C2: `returnToLinkProps` は C1 を通った値を `to`（pathname）と `search`（`defaultParseSearch`）へ分解し、`options.pathname` 不一致は不正値として扱う
- C3: 業務記録詳細 6 画面と在庫変動履歴の戻り link は文字列 `to` に query を含めない
- C4: 「在庫照会へ戻る」は常に `/stock` に着地する
- C5: 入出庫履歴が送る `returnTo` は、数字だけの `q` を string のまま往復させる
- C6: `stockInquirySearchSchema.selected` は 100 文字まで受理する

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| C1 | S1 | T1 | 拒否範囲と既存 8 case 不変 | AC1 / AC5 (1) |
| C2 | S2 | T2 / T3 | search の分解 | AC1 / AC5 (5) |
| C3 | S3 | T5 | 複製なし | AC2 |
| C4 | S3 | T4 | pin | AC5 (2) / AC-L3-1 (b) |
| C5 | S5 | T6 | 既定値 search の混入 | AC3 / AC5 (3) / AC-L3-1 (a) |
| C6 | S4 | T7 | — | AC5 (4) |
| C1〜C5 | S1〜S5 | T8 | 3 段往復 | AC4 / AC-L3-1 (b) |

## Data Safety

- 実店舗の JAN・商品名・金額を test / docs / PR に入れない。数字だけの検索語は既存 fixture の `2099000000019`（synthetic）を使う
- local-only paths: なし
- synthetic-only paths: `src/**/*.test.tsx` の fixture

## Implementation Results

Fill after implementation.

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### Plan Review round 1（2026-09-17、Sonnet、独立 fresh context、read-only、対象 `b5cc6b5e`）

- P1 0 / P2 0 / P3 3 → Plan Gate 通過可。Contract Probe 1〜3 と AC2 / AC3 の baseline を逐語再実行で一致確認、router-core の source で `to` に埋めた query が path として echo されるだけで `search` props 側が状態遷移に使われることを確認、引用した既存 test の実在を確認
- P3（DSR-17 (b) の scroll 復元 key = `location.href` との交差契約が Ledger に無い）= accept → Ledger に DSR-17 (a) / (b) 行、Review Focus、AC4、Matrix T3 / T8 に「router が作った href は文字列一致」を追加
- P3（Matrix T8 / Test Plan の「既存の 3 段往復 case」が実態より強い表現。実在は T10 の 2 段往復 1 本と `StockMovementsPage.test.tsx:435` の静的 assertion）= accept → 表現を実態へ、T1 に入れ子 `returnTo` つきの通過 case を追加、3 段往復の実クリックは AC-L3-1 (b) が受け持つと明記
- P3（Impact Review Lenses の not applicable が簡略）= accept → Fact check / design decision split lens を Contract Probe で実施と明記
- P3 のみのため reviewer 再投入なし（Subagent Budget）

Fill the rest after review.
