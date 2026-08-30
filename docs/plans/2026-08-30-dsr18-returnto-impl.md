# Plan Packet: DSR-18 戻り導線 returnTo 8 site + 共通 helper 実装

Design Phase は PR #20（squash `0d5f73c`、2026-08-30 merge）で完了済み。DSR-18「詳細画面の戻り導線契約」/ TRACE-D11 遷移元横断化 / 送信側契約 5 件（UI-02-D16 / UI-03-D22 / UI-04-D17 / UI-05-D17 / UI-11c-D16)は source docs に正本化済み。本 packet はその runtime 是正 R3（owner 裁定 2026-08-30: R3 キュー ① → ② scroll 復元 → ③ DSR-19/20 runtime の先頭）。

## Workflow State

- Phase: implementing
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 08333ce
- Amendments: none
- Coordinator: Claude Fable 5 (main session)
- Writer: Codex (GPT-5.6、発注書駆動)
- Plan Reviewer: Claude Sonnet 5 (independent fresh context)
- Final Reviewer: Claude Sonnet 5 (independent fresh context) + Coordinator mutation 独立再実測
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（8 site 往復 + fallback + 操作ログ state 復元。synthetic fixture は Ready 依頼と同時に提示）

Phase 遷移記録（kickoff → spec-check → plan-draft → plan-gate、本 plan-first commit に同乗）: task scope と R3 判定は本 packet に記録。spec-check では in-scope source docs（design-system 01 DSR-15/17/18、65、61〜64、74）が PR #20/#21 で改訂済み・実装十分と判定し、spec-check → plan-draft の許可された skip（Design Readiness が既存 docs 充足を引用）を適用。packet + Test Design Matrix を同 commit で commit し plan-gate に至る。

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
Risk Tiers R3 行のうち route/search state（8 site への `returnTo` search param 付与 + 詳細 6 page の戻り先解決変更）、operator workflow（詳細確認後の戻り先が hub 固定から遷移元復元へ変わる）に該当。DB / POS CSV / Tauri command DTO / bindings / merge gate は変更しない（UI 層内のみ、AC で bindings 差分ゼロを機械確認）。

## Goal

Goal Invariant:

### 最小完了条件

gap 8 site（入庫・返品交換・手動販売の保存結果 3 + 入庫・返品交換・手動販売・廃棄の recent list 4 + 操作ログ関連記録 1）のすべてから業務記録詳細へ遷移したとき、詳細の「前の画面へ戻る」が search state を含む遷移元 URL へ戻し、`returnTo` 欠落・不正時は従来どおり `/inventory/records` へフォールバックする。detail 6 page の `normalizeReturnTo` 3 行コピーは共通 helper（DSR-15 prefix 検証 + fallback 引数化）1 箇所へ集約される。

### 失敗定義

- 8 site のいずれかが `returnTo` を送らない、または詳細の戻り先が hub 固定のまま残る。
- `//` 始まり・絶対 URL 等が検証を素通りして戻り先になる（DSR-15 最低基準の毀損）。
- 既存 producer 2 site（`InventoryRecordsPage` / `MovementTable`）・products flow（`src/features/products/lib/return-to.ts` の exact-allowlist）に regression が出る。
- 操作ログの調査 state（期間・種別・page）が返り先 URL から欠落する。

### 非目的

- scroll 位置復元（DSR-17 分類② — 後続 ② scroll 復元 R3。本 PR は `<Link>` push 戻りの維持のみ、DSR-17 (a) 前提を壊さない）。
- CsvImport / Stocktake 詳細への静的入口の新設（backlog 管理のまま）。
- products 専用 `return-to.ts` の共通 helper への緩和・統合（DSR-18 本文が存置を明記）。
- toast / destructive dialog の runtime 是正（③ DSR-19/20 R3）。
- 操作ログ RELATED_ROUTES への csv / stocktake 種別追加（現行 4 種のまま）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

1. **共通 helper 新設** `src/lib/return-to.ts`: `normalizeReturnTo(value: string | null | undefined, fallback: string): string`。判定は DSR-18 判定フローどおり「`/` 始まり かつ `//` 非始まり → 採用、それ以外（欠落含む）→ fallback」。unit test 同梱。
2. **detail 6 page の集約**: `ReceivingRecordDetailPage` / `ReturnRecordDetailPage` / `ManualSaleRecordDetailPage` / `DisposalRecordDetailPage` / `CsvImportRecordDetailPage` / `StocktakeRecordDetailPage` のローカル `normalizeReturnTo` 定義を削除し、共通 helper 呼出し（fallback `/inventory/records` を明示引数）へ置換。戻りラベル「前の画面へ戻る」と挙動は不変。
3. **入庫 2 site**（UI-02-D16）: `ReceivingPage` の保存結果 + recent list「詳細を見る」`<Link>` に `search={{ returnTo }}` を付与。`returnTo` は現在 location の href（設計判断 D-B）。
4. **返品・交換 2 site**（UI-03-D22)：`ReturnExchangePage` 同上。
5. **手動販売 2 site**（UI-04-D17）: `ManualSalePage` 同上（保存結果は sale_id 非 null 条件付き link のまま）。
6. **廃棄・破損 1 site**（UI-05-D17）: `DisposalPage` recent list 同上。保存結果には詳細 link を追加しない（doc が明記する producer 範囲）。
7. **操作ログ 1 site**（UI-11c-D16）: `OperationLogsPage` の「関連記録を見る」`<Link>` に、現在の `/settings/logs` URL（`start_date` / `end_date` / `operation_type` / `page` の search state 込み）を `returnTo` として付与。link は UI-11c-D5 の展開行内操作のまま（行展開 toggle を発火させない）。
8. **契約 test 追加**: Matrix T1〜T13。既存 test の削除・無効化なし。ただし Scope 3〜7 の対象 producer の既存 test にある「詳細を見る」/「関連記録を見る」の href 固定値アサート 9 箇所（`ReceivingPage.test.tsx:258,297` / `ReturnExchangePage.test.tsx:158,197` / `ManualSalePage.test.tsx:165,477` / `DisposalPage.test.tsx:390` / `OperationLogsPage.test.tsx:835,874` — 2026-08-30 実測）は、href に `?returnTo=…` が付くため実装に伴う**正当な更新対象**であり、T13 の「無変更 green」対象に含まれない（アサート更新であり test の削除・無効化ではない — Plan Review round 1 P2 採用 + Coordinator 全 sweep で一般化）。

## Non-scope

- 業務 4 route（`/inventory/receiving` 等）への search schema 新設（現状 search state なし。D-B の location 由来直列化により、将来 search 追加時も producer 側の追随不要）。
- `InventoryRecordsPage` / `StockMovementsPage` の既存手組み直列化の D-B 方式への書換え（動作不変のため触らない。regression test でのみ保護）。
- Tauri command / DTO / bindings / DB / CSV format の変更。

## 設計判断（実装方式の確定）

- **D-A（helper の置き場と API）**: 共通 helper は `src/lib/return-to.ts` に置く。products 専用 `src/features/products/lib/return-to.ts`（exact-allowlist 型）は DSR-18 本文どおり上位互換として存置し、import しない・されない独立関係とする。同 basename だが層（`lib` 汎用 vs feature typed）で役割が分かれる。関数名は既存 6 コピーと同じ `normalizeReturnTo` とし diff を最小化、fallback は引数必須（既定値なし — 呼出し側に fallback 先の明示を強制するのが DSR-18「遷移先ごとの既定 hub」の趣旨）。
- **D-B（producer 直列化方式）**: 8 site の `returnTo` は TanStack Router の現在 location（`useRouterState` select による `location.href` = pathname + searchStr）を用いる。`URLSearchParams` 手組み再構築（既存 2 producer の方式）は、route への search schema 追加時に producer 側の追随漏れで drift するため新規 site には採らない。main は browser history / test は `createMemoryHistory` でともに href は `/` 始まりの app 内 path になる。
- **D-C（受信側 schema）**: 操作ログ発の遷移先 4 route（receiving / return / manual-sale / disposal の records.$recordId）は `returnTo: z.string().max(500).optional().catch(undefined)` 済みで schema 変更不要。max(500) は現実の search state 規模で十分（Boundary Checks 参照）。

## Acceptance Criteria

- AC1: 8 site すべての詳細遷移 `<Link>` が `search={{ returnTo }}` を持ち、値が現在 location の href である（Matrix T2〜T9）。
- AC2: detail 6 page の戻り先が「returnTo 有効 → その URL / 欠落・不正 → `/inventory/records`」で、ローカル `normalizeReturnTo` 定義が 0 件（`rg -c 'function normalizeReturnTo' src/features/` = 0、共通 helper のみ）。
- AC3: 共通 helper が DSR-15 最低基準（`/` 始まり + `//` 拒否）を満たし、fallback 引数が実効（T1）。
- AC4: `src/lib/bindings.ts` の diff ゼロ（`cargo run --bin generate_bindings` 後に clean）。
- AC5: 既存 producer 2 site・products return-to.ts の既存 test が無変更で green（regression）。
- AC6: 操作ログの returnTo が `start_date` / `end_date` / `operation_type` / `page` を含み、詳細から戻ると同じ調査 state が復元される（T9 / T10）。
- AC7: frontend gate（`npm run typecheck` / `npm run lint` / `npm run format:check` / `npm test` / `npm run build`）green + `cargo check --release` PASS。

## Design Sources

- Requirements / spec: REQ-206（return 契約 root、65 決定表 TRACE-D11）
- Architecture: 変更なし（UI 層内）
- Function / command / DTO: `docs/function-design/61-ui-receiving.md`（UI-02-D16）/ `62-ui-manual-sale.md`（UI-04-D17）/ `63-ui-return-exchange.md`（UI-03-D22）/ `64-ui-disposal.md`（UI-05-D17）/ `65-inventory-record-traceability.md`（TRACE-D11）/ `74-ui-operation-logs.md` §74.9（UI-11c-D16 / UI-11c-D5 / UI-11c-D7）
- DB: 変更なし
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-18（判定フロー・共通 helper 契約）/ DSR-15（prefix 検証最低基準）/ DSR-17 分類② (a)（push 戻り維持）
- Decision log / ADR: 変更なし（durable 決定は PR #20 で promote 済み）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし（AC4 で差分ゼロ機械確認） | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | DSR-18 / TRACE-D11 / UI-02-D16 / UI-03-D22 / UI-04-D17 / UI-05-D17 / UI-11c-D16 | existing sufficient（PR #20 で改訂済み） |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | 変更なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| 新規 util `src/lib/return-to.ts` | — | test 同梱（T1）。route / command / REQ token / doc 新設なし |
| REQ coverage | 既存 REQ-206 の test 参照追加のみで新規 REQ token なし。Writer 作業中に REQ token 追加が必要になった場合は `generate_traceability` 再生成を同 commit で行う | 条件付き |
| route / operator 画面 / Tauri command | — | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-206 / return | 65 決定表・§65.8 実装方針 | TRACE-D11 | 一覧発限定だった returnTo 送信を遷移元横断（recent list / 保存結果 / 操作ログ）へ。hub 固定戻りはラベル「前の画面へ戻る」と実挙動の乖離（owner 裁定 A' で棄却済みの現状） | Scope 3〜7 | T2〜T9 |
| DSR-18 共通 helper | design-system 01 DSR-18 | D-A / D-B | prefix 検証 + fallback 引数化の 1 箇所集約。6 箇所コピー温存案は同型契約 drift の再演で棄却（DSR-18 本文）。fallback 既定値付き案は「遷移先ごとの既定 hub」の明示を失うため棄却 | Scope 1〜2 | T1 / T10 / T11 |
| DSR-15 最低基準 | design-system 01 DSR-15 | — | `/` 始まり + `//` 拒否は open redirect 型の混入を閉じる既存正本。products exact-allowlist は上位互換で存置 | Scope 1 | T1 / T13 |
| UI-02-D16 / UI-03-D22 / UI-04-D17 / UI-05-D17 | 61〜64 各決定表 | 各 Dn | 保存結果 / recent list の producer 義務を doc 契約どおり実装。disposal 保存結果は producer 外（link 自体なし） | Scope 3〜6 | T2〜T8 |
| UI-11c-D16 | 74 §74.9 | UI-11c-D16 | 調査 state（期間・種別・page）を往復保持。復帰導線なしの現状は調査 flow を破壊。UI-11c-D5 の行展開 toggle 非発火は隣接契約として維持 | Scope 7 | T9 / T12 |
| DSR-17 分類② (a) | design-system 01 DSR-17 | — | 戻り導線は `<Link>` push のまま（`history.back()` 化しない）。② scroll R3 の href key 復元と相互補完 | Scope 2（挙動不変の確認） | T10 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: DSR-18 + TRACE-D11 + 送信側契約 5 件で成立（PR #20 完了済み）。
- Plan-only durable decisions found and promoted to source docs: なし。D-A / D-B は実装方式の選択で、契約本体は DSR-18 が既に保持。D-B（location 由来直列化）が将来 durable 化に値すると判明したら DSR-18 追記を follow-up 起票する。
- Assumptions and constraints: 業務 4 route は search state なし（起票時実測、validateSearch 未定義）。location.href 方式なら search 追加時も producer 不変。
- Deferred design gaps: CsvImport / Stocktake 静的入口、操作ログ RELATED_ROUTES の 2 種追加、scroll 復元 — いずれも backlog / ② で管理。
- Test Design Matrix can cite design decision IDs: DSR-18 / DSR-15 / TRACE-D11 / UI-02-D16 / UI-03-D22 / UI-04-D17 / UI-05-D17 / UI-11c-D16 / D-A / D-B を cite。
- Absolute guarantee / escape hatch self-check: fallback `/inventory/records` が escape hatch（従来挙動と同値）。検証は allowlist 型（prefix）で閉じ、互換は「returnTo なしの既存 deep link → 従来どおり hub」で担保。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — UI 層内の導線のみ、外部 adapter 非接触 | — |
| Fact check / design decision split | gap 8 site・normalizeReturnTo 6 コピー・detail 4 route の returnTo schema 済み・業務 4 route の search state なし・router history 方式は 2026-08-30 の起票時実測（HEAD 626f70b）で確認済みの観測事実。戻り先本則は DSR-18（owner 裁定 A'）の design decision | 本 packet |
| Lifecycle / retry | 戻り先画面の再 render で recent list / 一覧の件数変化は許容（TRACE-D11 既存契約踏襲）。returnTo は URL のみで stale データを持たない | — |
| Operator workflow | 保存直後確認・月末調査・操作ログ調査の「詳細を見て戻る」が組み直しなしで連続する。fallback 時は従来と同一挙動で操作感の断絶なし | Matrix + L3 |
| Replacement path | not applicable（外部システム非接触） | — |
| Data safety / evidence | synthetic fixture のみ。実店舗データ非 commit | Data Safety 節 |
| Reporting / accounting semantics | not applicable（表示導線のみ、集計非接触） | — |
| Manual verification | WebView2 実機での往復挙動（特に browser history と returnTo の併存、操作ログ state 復元）は L3 | Human Gate |
| 環境・再現性 | 新設の環境依存なし（router history は main 既存設定のまま） | — |

## Design Readiness

DSR-18 が判定フロー・共通 helper 契約・fallback・products 存置を、TRACE-D11 + 送信側契約 5 件が producer 範囲を、それぞれ実装可能な粒度で確定済み（PR #20/#21）。未解決の design 問題なし。実装方式の残余自由度（helper 置き場・直列化方式・schema 変更要否）は本 packet の D-A / D-B / D-C で確定した。

## Contract Probe

是正仮適用の end-to-end: Writer は実装後、`render-with-router`（memory history）で「search state 付き遷移元 → 詳細 → 前の画面へ戻る click → 遷移元 URL（search 込み）復元」の往復を T10 で通し、returnTo 不正値（`//` 始まり）が fallback に落ちることを T11 で通す。probe が既存 route 挙動（detail の searchSchema catch(undefined)）と衝突した場合は実装を止めて Coordinator へ報告する。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-18 判定フロー（`/` 採用・`//` 拒否・欠落 fallback） | `src/lib/return-to.ts` | T1 / T11 | L3-2 |
| DSR-18 共通 helper（fallback 引数化・6 page 集約） | Scope 2 | T1 / T10 + AC2 機械確認 | — |
| DSR-18 products 存置（exact-allowlist 非緩和） | 変更なし | T13（既存 regression 無変更 green） | — |
| DSR-15 prefix 検証最低基準 | `src/lib/return-to.ts` | T1 | — |
| TRACE-D11 遷移元横断送信義務 | Scope 3〜7 | T2〜T9 | L3-1 |
| UI-02-D16（入庫 保存結果 + recent list） | ReceivingPage | T2 / T3 | L3-1 |
| UI-03-D22（返品・交換 保存結果 + recent list） | ReturnExchangePage | T4 / T5 | L3-1 |
| UI-04-D17（手動販売 保存結果 + recent list、sale_id 条件付き） | ManualSalePage | T6 / T7 | L3-1 |
| UI-05-D17（廃棄 recent list のみ、保存結果 link なし維持) | DisposalPage | T8 + 保存結果に link 非追加（実装 diff review） | L3-1 |
| UI-11c-D16（操作ログ state 込み往復） | OperationLogsPage | T9 / T10 | L3-3 |
| 隣接: UI-11c-D5（関連記録 link が行展開 toggle を発火させない） | OperationLogsPage（既存挙動維持） | T12 | — |
| 隣接: UI-11c-D7（RELATED_ROUTES 4 種、非対応種別は link なし） | 変更なし | 既存 test regression | — |
| 隣接: 61〜63 の保存成功 scroll 契約（ページ先頭 scroll） | 変更なし | 既存 test regression | — |
| 隣接: DSR-17 分類② (a) push 戻り維持（`history.back()` 化しない） | Scope 2 | T10（`<Link>` 遷移で検証） | ② R3 |
| 隣接: TRACE-D11 一覧発既存 producer（InventoryRecordsPage / MovementTable） | 変更なし | 既存 test regression（AC5） | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-08-30-dsr18-returnto-impl.md](test-matrices/2026-08-30-dsr18-returnto-impl.md)

- targeted tests: 共通 helper unit（T1）、producer 8 site の returnTo 送信（T2〜T9）、往復 end-to-end + fallback（T10 / T11）
- negative tests: `//` protocol-relative・絶対 URL・欠落の fallback（T1 / T11）、sale_id null の link 非表示（T7）、廃棄保存結果の link 非存在（T8）
- compatibility checks: 既存 producer 2 site + products return-to.ts の既存 test 無変更 green（T13 / AC5）、bindings 差分ゼロ（AC4）
- data safety checks: synthetic fixture のみ
- main wiring/integration checks: render-with-router 実配線の往復（T10）、ローカル normalizeReturnTo 0 件の機械確認（AC2）
- Human Gate に L3 を含むため、Writer 完了条件に `cargo check --release` を含める（CI gate ではない — release build blind spot 対策）

## Boundary / Wire Contract

- producer / consumer / wire type: 変更なし。Tauri command / DTO / generated bindings / JSON wire shape に非接触（AC4 で `bindings.ts` diff ゼロを機械確認）
- route search contract: detail 6 route の `returnTo: z.string().max(500).optional().catch(undefined)` は既存のまま変更しない。max(500) 超過・不正型は `catch(undefined)` → helper fallback の既存経路
- precision/range: 操作ログ最長 URL（`/settings/logs?start_date=…&end_date=…&operation_type=…&page=…`）は 100 文字未満 < 500 で余裕十分
- invalid input: `//` 始まり・絶対 URL・空文字 → 共通 helper が fallback（DSR-15 最低基準）
- compatibility: returnTo なしの既存 deep link / bookmark は従来どおり `/inventory/records` fallback（挙動不変）

## Review Focus

- helper 検証条件の完全性（`/` 採用 + `//` 拒否の両方 — 片側だけの実装は open redirect 型を残す。T1 / T11 の弁別性）
- fallback 引数の実効性（固定文字列化 mutation を T1 の 2 値 fallback case が kill できるか — 空集合 oracle 衝突回避）
- 8 site の付与漏れ（特に保存結果 3 site は conditional render 内 — result panel 表示状態での assert になっているか）
- 操作ログ直列化の 4 param 個別 assert（1 param 落ち mutation の検出 — combined 文字列比較 1 本にしない）
- detail 6 page の集約完全性（AC2 の機械確認 + import 元が `src/lib/return-to.ts` であり products 版でないこと）
- test oracle の独立転記（returnTo 期待値を production の直列化関数から導出しない — SSOT 共有の mutation 感度自壊の型）
- 既存 test の削除・改変ゼロ（T13 は既存 test の無変更 green が oracle）。ただし Scope 8 に列挙した producer test の href 固定値アサート 9 箇所のみ実装に伴う正当な更新対象（T13 対象外）。更新は record path 検証を保つこと（returnTo 付き完全一致 or path + returnTo の個別 assert、`toContain` への安易な弱体化不可）

## Spec Contract

Contract ID: SPEC-DSR18-RETURNTO-2026-08-30

- 業務記録詳細へ遷移する 8 site（入庫・返品交換・手動販売の保存結果 + recent list、廃棄の recent list、操作ログの関連記録）は、search state を含む現在の遷移元 URL を `returnTo` として送る
- 詳細 6 page の「前の画面へ戻る」は共通 helper `normalizeReturnTo(value, fallback)` を通し、`/` 始まりかつ `//` 非始まりの値のみ採用、それ以外は `/inventory/records` へフォールバックする
- 共通 helper は `src/lib/return-to.ts` に置き、fallback を必須引数とする。products 専用 `src/features/products/lib/return-to.ts` は exact-allowlist のまま存置し相互に import しない
- 操作ログの `returnTo` は `start_date` / `end_date` / `operation_type` / `page` を含み、詳細から戻ると同じ調査 state が復元される
- 廃棄の保存結果には詳細 link を追加しない（UI-05-D17）
- 戻り導線は `<Link>` push 遷移のまま維持する（DSR-17 分類② (a)、`history.back()` 化しない）

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| TRACE-D11（遷移元横断送信） | Scope 3〜7 | T2〜T9 | 付与漏れ・conditional render | Matrix |
| DSR-18（判定フロー + helper） | Scope 1〜2 | T1 / T10 / T11 | 検証条件完全性・fallback 実効 | Matrix |
| DSR-15（prefix 最低基準） | Scope 1 | T1 / T11 | open redirect 型 | Matrix |
| UI-02-D16 / UI-03-D22 / UI-04-D17 | Scope 3〜5 | T2〜T7 | 保存結果の表示状態 assert | Matrix |
| UI-05-D17（廃棄 producer 範囲） | Scope 6 | T8 | link 非存在の対 oracle | Matrix |
| UI-11c-D16（調査 state 往復） | Scope 7 | T9 / T10 | 4 param 個別 assert | Matrix |
| UI-11c-D5（行展開独立） | Scope 7 | T12 | 既存挙動維持 | Matrix |
| DSR-17② (a)（push 戻り維持） | Scope 2 | T10 | 遷移方式の検証 | Matrix |
| products 存置 regression | 変更なし | T13 | 既存 test 無変更 green | PR body |

## Review Response

Plan Review / Final Review の記録は本節へ append-only で追記する。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### Plan Review rally 記録（2026-08-30、append-only）

- round 1（Sonnet 独立 reviewer、対象 = plan-first commit `08333ce`）: P1 0 / P2 1 / P3 0。観点 1〜6（契約整合 / 前提事実 / 実装可能性 / Matrix 質 / scope 境界 / 形式）は指摘なし。P2-1「`OperationLogsPage.test.tsx` の既存 href 固定値アサートが Scope 7 実装で fail するため、T13 の無変更対象から明示除外しないと Writer が誤読し relay を浪費する」— Coordinator が :835 / :874 を実読裏取りのうえ**採用**。さらに同型を repo 全体 sweep し、4 作業画面 test の「詳細を見る」href 固定値アサート 7 箇所を追加検出、是正を 9 箇所へ一般化して Scope 8 / Review Focus / Matrix T13・Adjacent Pattern Audit へ明記（是正 commit `0fe9d78`）。D-B の保存結果 panel 懸念は reviewer が `setResult` 非 navigate を実読確認し問題なしと判定。
- round 2（同 reviewer、対象 = 是正 commit `0fe9d78`）: P1 0 / P2 0 / P3 0。9 箇所の file:line 実在・全数性（`InventoryRecordsPage.test.tsx:314-316` は returnTo 済み・T13 保護対象として正しく除外）・文言整合（「無変更」系記述と 9 箇所例外の対象集合が排他的で矛盾なし）を独立再 sweep で確認。plan-approved 判断へ異論なし。

Phase 遷移記録（本 content commit に同乗）: `plan-gate -> plan-approved -> implementing`。Plan Review rally は round 2 で新規指摘 0 に収束（P1/P2 = 0）。Plan Commit を `08333ce` で確定。次は Codex 発注（Writer content commit）。

## Data Safety

synthetic fixture のみ使用（test は既存 mock command 応答、L3 は owner 手元の開発 DB）。実店舗の商品・取引データを test にも docs にも commit しない。

## Human Gate（owner Windows native L3）

L3 項目（synthetic fixture: 入庫・返品交換・手動販売・廃棄の記録各 1 件以上 + 操作ログエントリ数件。既存開発 DB に不足があれば Ready 依頼時に投入手順を添付）:

- L3-1: 4 作業画面の recent list / 保存結果から「詳細を見る」→「前の画面へ戻る」で元の作業画面へ戻る（8 site 代表往復）。
- L3-2: 詳細 URL を returnTo なしで直接開き「前の画面へ戻る」→ `/inventory/records` へ fallback。
- L3-3: 操作ログで期間・種別・page を設定 →「関連記録を見る」→ 戻りで同じ調査 state（期間・種別・page）が復元される。

## 発注・レビュー段取り

- Writer: Codex（発注書は plan-approved 後に Coordinator が作成、worktree isolation）。
- Plan Reviewer: Sonnet subagent（fresh context、P1/P2 = 0 で plan-approved）。
- Final Reviewer: Sonnet subagent 別個体 + Coordinator が Matrix 記載の mutation 5 件を clean tree で独立再実測。
- hosted final: non-doc R3 のため Ready 化で自動 run。
