# 「前の画面へ戻る」導線契約の規範化 Design Phase

## Workflow State

- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable（Claude Code session、conductor）
- Writer: Codex（外部端末、発注書 relay。§3.1 により Fable は docs Writer に投入しない）
- Plan Reviewer: Sonnet subagent（fresh context）一次 + Fable 裁定（2026-08-30、round 1 = P1×1〈DSR-15 未調整〉/ P3×2、全件 Fable 実読裏取りの上 accept → 是正 commit、round 2 独立再検証は pending）
- Final Reviewer: Sonnet subagent（fresh context、Plan Reviewer とは別個体）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Codex 発注 relay、Ready（docs-only のため Ready 後の owner `workflow_dispatch` を含む、CI-TRIGGER-D1 / PR #16 逸脱の教訓）、merge

この plan-first commit は `kickoff -> spec-check -> design -> plan-draft -> plan-gate` を materialize する。task scope / Risk は本 packet、design の必要性は「起票時実測」節（gap 8 件全件実在 + owner 裁定 A'）、design 出力（DSR-18 / TRACE-D11 改訂ほか）は plan-approved 後の Writer content commit で追加する。Plan Reviewer の独立性は Claude 側で充足するため、Plan Review を pending のまま Draft PR checkpoint で停止する。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 1 回目は起票時の owner 裁定（2026-08-30、A' 採択）で消費済み。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only の Design Phase PR。後続実装が従う戻り導線の durable contract（DSR-18 / TRACE-D11 改訂 / 送信側義務）を source docs に固定するが、本 PR は runtime code、test、route/search state、command wire shape、DB、generated bindings を変更しない。runtime 是正は別 R3 packet とする。

## Goal

Goal Invariant:

### 最小完了条件

- 「前の画面へ戻る」導線の戻り先契約（遷移元本則 + 詳細 route への link の returnTo 送信義務 + fallback 契約 + returnTo helper 共通化方針）が source docs（DSR-18 / TRACE-D11 改訂 / 74 §74.9 / 61〜64 の各 Dn）だけで後続 R3 実装可能な粒度で確定し、owner 裁定 A'（遷移元本則 + 共通化同梱、2026-08-30）が `Plans.md` へ反映される。

### 失敗定義

- 後続実装者が chat・archive packet を読まないと gap 8 site の是正範囲・fallback 仕様・共通 helper 契約を復元できない状態、または runtime code に diff がある状態。

### 非目的

- runtime 実装・test の追加、scroll 位置復元（DSR-17 分類②）の設計、CsvImport / Stocktake detail の静的入口整備、操作ログ関連記録 producer 0 件の是正。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- `docs/design-system/01-decision-rules.md` に DSR-18「詳細画面の戻り導線契約」を新設する（番号 18 は本 packet で予約）。内容: (1) 「前の画面へ戻る」ラベルの導線は遷移元の URL（search state 含む）へ戻ることを本則とする、(2) 業務記録詳細 route へ遷移する link は returnTo を送信する義務を負う、(3) returnTo 欠落・不正時の fallback は遷移先ごとの既定 hub（安全側、現行挙動を fallback として温存）、(4) returnTo sanitize の共通 helper 方針: DSR-18 は既存 DSR-15「returnTo 等のリダイレクト系 param は検証してから使う」を supersede せず **extend** する。共通 helper の正は DSR-15 の prefix 検証（`/` 始まりかつ `//` 始まりでない）+ fallback 先の parameter 化（遷移先ごとの既定 hub を引数で受ける）とし、DSR-15 が「共通 util 抽出は別 PR」と残した宿題をここで契約化する。products 専用 `return-to.ts` の exact-allowlist（`pathname === "/products"` 限定）は typed parse-back 用途の上位互換として存置し、DSR-18 本文に両者の関係（最低基準 = DSR-15 prefix 検証、typed 復元が必要な場合のみ exact 型へ強化）を明記して矛盾を排除する。
- `docs/function-design/65-inventory-record-traceability.md` の TRACE-D11 を「入出庫履歴一覧発」限定から遷移元横断（一覧発 / recent list 発 / 保存結果発 / 操作ログ発）へ改訂し、決定表・本文（§65 遷移契約）・実装方針・受入基準の 4 箇所を同期する。TRACE の新番号は増やさず、送信側義務の画面横断正本は DSR-18 に置く。
- `docs/function-design/74-ui-operation-logs.md` §74.9 の「関連記録を見る」に returnTo 送信契約（操作ログの検索 state = 期間・種別・page の直列化と戻り時復元）を UI-11c-D 次番として追記する。既存 UI-11c-D5（click 競合回避）と矛盾しないこと。
- `docs/function-design/61-ui-receiving.md` / `62-ui-manual-sale.md` / `63-ui-return-exchange.md` / `64-ui-disposal.md` の該当節（recent list 導線 4 doc + 保存結果導線 3 doc、64 は保存結果に詳細 link なし）へ returnTo 送信契約を各 doc の次番 Dn として追記する（各 doc の実 ID root と次番は Writer が rg で確定）。
- `docs/quality/review-checklist.md` に DSR-18 対応行を追加する（DSR-17 行の先例と同型）。
- `Plans.md`: backlog「前の画面へ戻る」導線行を design 確定済みへ更新し実装 R3 を後続候補として記録、CsvImport / Stocktake detail page の静的入口未整備（hub 経由のみ到達可能）を新規観察点として backlog へ追記する。
- 本 Plan Packet の作成・commit（plan-first）。

## Non-scope

- `src/` / `src-tauri/` の runtime code、test、generated file（是正実装は別 R3 packet。8 site への returnTo 付与・共通 helper 実装・契約 test はそちらで実施）。
- 詳細戻り scroll 位置復元の設計・実装（DSR-17 分類②、別 change）。
- CsvImport / Stocktake detail の静的入口整備の設計（backlog 追記のみ）。
- 操作ログ関連記録 producer 0 件の是正（backlog 別項のまま）。
- 本 Scope 外の `Plans.md` backlog / 次の行動④⑤。

## 起票時実測（gap 8 件、2026-08-30、HEAD afe1cc9）

Explore subagent による実読検証（静的 link は `rg 'to="/(inventory|stocktake|csv-import)' src/` 全数走査、動的 route 式は `to={...}` 形の別 sweep で補完 — gap #8 の `to={relatedRoute}` は後者で捕捉 — + 各 site 実読）。実在 8/8、消滅 0、記録外の同型 gap 0。

| # | 発生源 | file:line | ラベル | returnTo | fallback |
|---|---|---|---|---|---|
| 1 | 直近の入庫 | `src/features/receiving/ReceivingPage.tsx:689-695` | 詳細を見る | 無 | `/inventory/records` 無絞り込み |
| 2 | 直近の返品・交換 | `src/features/return-exchange/ReturnExchangePage.tsx:969-975` | 詳細を見る | 無 | 同上 |
| 3 | 直近の手動販売出庫 | `src/features/manual-sale/ManualSalePage.tsx:741-747` | 詳細を見る | 無 | 同上 |
| 4 | 直近の廃棄・破損 | `src/features/disposal/DisposalPage.tsx:684-690` | 詳細を見る | 無 | 同上 |
| 5 | 入庫 保存結果 | `ReceivingPage.tsx:350-356` | 詳細を見る | 無 | 同上 |
| 6 | 返品・交換 保存結果 | `ReturnExchangePage.tsx:481-487` | 詳細を見る | 無 | 同上 |
| 7 | 手動販売 保存結果 | `ManualSalePage.tsx:376-382`（sale_id 非 null 条件付き） | 詳細を見る | 無 | 同上 |
| 8 | 操作ログ 関連記録 | `src/features/operation-logs/OperationLogsPage.tsx:187-188`（route map は同 file :44-47） | 関連記録を見る | 無 | 同上 + 操作ログ側の期間・種別・page も喪失 |

補足実測:

- 遷移先の業務記録詳細 6 page はいずれも returnTo prop の受け口実装済み（`ReceivingRecordDetailPage.tsx:39` ほか、3 行 `normalizeReturnTo` の 6 箇所コピー）。戻りラベルは 6 page とも exact「前の画面へ戻る」。
- returnTo 送信済みの現行 producer は `InventoryRecordsPage.tsx:66-68,340` と `MovementTable.tsx:41-44,85` の 2 site のみ（TRACE-D11 の一覧発契約どおり）。
- returnTo build/sanitize 実装は products 専用 `src/features/products/lib/return-to.ts`（exact-allowlist 型: origin 検証 + `pathname === "/products"` 限定、sanitize :7 / build :30 / parse :44、regression test あり）と records 側個別実装（`InventoryRecordsPage.tsx:57` / `StockMovementsPage.tsx:60-68`、DSR-15 prefix 型）に分裂。
- 旧記録の「契約乖離 4 hop（plu 脱落）」は PR #8 で是正済み・消滅。棚卸し詳細 404 も PR #9 で route 実在。CsvImport / Stocktake detail は静的入口なし（hub 経由のみ）— backlog 追記対象。

## Acceptance Criteria

- DSR-18 が新設され、遷移元本則・送信義務・fallback・共通 helper 方針の 4 要素が後続 R3 で chat 非依存に実装可能な粒度で記述されている。
- TRACE-D11 改訂が 65 の決定表 / 本文 / 実装方針 / 受入基準の 4 箇所で同期している（旧「一覧発限定」文言の残存 0）。
- 74 §74.9 / 61〜64 の該当節に送信側契約が各 doc の実 ID root + 次番 Dn で追記されている。
- review-checklist に DSR-18 対応行が存在する。
- `Plans.md` 再編が owner 裁定 A' と一致し、CsvImport / Stocktake 静的入口の観察点が backlog に存在する。
- 本 packet の gap 8 site 全てが DSR-18 + 各 doc 契約のいずれかで被覆されている（Plan Review / Final Review で突合）。

## Design Sources

- Requirements / spec: REQ-206（return 契約 root、`docs/function-design/65-inventory-record-traceability.md` 決定表）
- Architecture: 変更なし（UI 層内の導線契約のみ）
- Function / command / DTO: `docs/function-design/61-ui-receiving.md` / `62-ui-manual-sale.md` / `63-ui-return-exchange.md` / `64-ui-disposal.md` / `65-inventory-record-traceability.md` / `74-ui-operation-logs.md`
- DB: 変更なし
- Screen / UI: `docs/SCREEN_DESIGN.md`、`docs/design-system/01-decision-rules.md`（DSR-16 / DSR-17 先例）
- Decision log / ADR: DSR-15（returnTo 検証契約 — DSR-18 が extend する既存正本、`docs/design-system/01-decision-rules.md`）/ DSR-17（詳細戻りは位置復元本則 — 本件の戻り先契約と整合させる）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | 61〜65 / 74 / design-system 01 / review-checklist | updated in this PR |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | DSR-18 新設（design-system 01 が durable home） | updated in this PR |

## Registration / Generation Obligations

該当なし（既存 doc の節追記のみ。新規 doc・route・command・REQ token の追加なし）。万一 Writer 作業中に新規 REQ token 追加が必要になった場合は `cargo run --bin generate_traceability` の再生成を同 commit で行う（PR #84 教訓）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-206 / return | 65 決定表・本文・実装方針・受入 | TRACE-D11（改訂） | 一覧発限定の戻り契約を遷移元横断へ拡張。hub 正 + ラベル変更案（B 案）は owner 裁定（2026-08-30）で棄却 — 作業画面へ戻れない不便と操作ログ state 喪失を仕様として固定化するため | 後続 R3 packet | 後続 R3 Matrix |
| DSR-18（本 packet で番号予約、DSR-15 を extend） | design-system/01-decision-rules.md | DSR-18 | 送信義務・fallback・共通 helper 方針の画面横断正本。DSR-15 の prefix 検証を最低基準として継承し「共通 util 抽出は別 PR」の宿題を契約化。各 doc 分散のみの案は同型契約 drift（normalizeReturnTo 6 箇所コピーの再演）リスクで棄却 | 後続 R3 packet | 後続 R3 Matrix |
| UI-11c | 74 §74.9 | UI-11c-D 次番 | 関連記録遷移で操作ログの調査 state（期間・種別・page）を保持。復帰導線なしの現状は調査 flow を破壊 | 後続 R3 packet | 後続 R3 Matrix |
| 61〜64 の実 ID root（61 は UI-02 系、他は Writer が rg で確定） | 各 doc の導線該当節 | 各 doc 次番 Dn | recent list 発 / 保存結果発の returnTo 送信義務を doc 側にも固定（DSR-18 を cite） | 後続 R3 packet | 後続 R3 Matrix |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 PR 完了後、DSR-18 + TRACE-D11 改訂 + 各 doc Dn で成立する。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: owner 裁定 A'（遷移元本則 + 共通化）を DSR-18 として promote する。
- Assumptions and constraints: 現行 fallback（無絞り込み hub）は安全側として温存し、fallback 発生を減らす方向（送信義務）で是正する。ラベル文言「前の画面へ戻る」は維持（挙動をラベルへ合わせるのが A' の趣旨）。
- Deferred design gaps, risk, and follow-up target: scroll 位置復元（DSR-17 分類②）、CsvImport / Stocktake 静的入口、producer 0 件是正 — いずれも backlog 管理。
- Test Design Matrix can cite design decision IDs or source doc sections: 後続 R3 Matrix が DSR-18 / TRACE-D11 / 各 Dn を cite できる粒度で書く。
- Absolute guarantee / escape hatch self-check completed: fallback 契約が escape hatch（不正 returnTo → hub）。例外は allowlist 型 sanitize で閉じ、互換は現行挙動の温存で担保。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — 外部 adapter に触れない UI 層内契約 | — |
| Fact check / design decision split | gap 8 件は起票時実測（本 packet 記録）で観測事実、戻り先本則は owner 裁定 A' の design decision | 本 packet / DSR-18 |
| Lifecycle / retry | 戻り先一覧の再取得で件数変化は許容（TRACE-D11 既存契約を踏襲） | 65 |
| Operator workflow | 調査 flow（絞り込み一覧・操作ログ filter からの詳細往復）で状態を失わないことが業務価値 | DSR-18 / 74 §74.9 |
| Replacement path | not applicable — 外部システム非依存 | — |
| Data safety / evidence | 実 store データ不要、file:line 実測のみ | 本 packet |
| Reporting / accounting semantics | not applicable — 集計語義に触れない | — |
| Manual verification | 戻り挙動の実機確認は後続 R3 の L3 で実施、本 PR は docs のみ | 後続 R3 packet |
| 環境・再現性 | not applicable — 環境依存の新設なし | — |

## Design Readiness

- Existing design docs are sufficient because: 不十分 — TRACE-D11 が一覧発限定で、recent list 発 / 保存結果発 / 操作ログ発の戻り契約が未定義（本 PR で是正）。
- Source docs updated in this PR: design-system 01（DSR-18）/ 65 / 74 / 61〜64 / review-checklist / Plans.md。
- Design gaps intentionally deferred: scroll 位置復元、CsvImport / Stocktake 静的入口、producer 0 件。
- Durable decisions discovered in this plan and promoted to source docs: owner 裁定 A' → DSR-18。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI 層内のみ、境界変更なし。
- Backend function design: 変更なし。
- Command / DTO / data contract: 変更なし（returnTo は URL search の UI 内契約）。
- Persistence / transaction / audit impact: なし。
- Operator workflow / Japanese UI wording: ラベル「前の画面へ戻る」維持、挙動側を規範化。
- Error, empty, retry, and recovery behavior: 不正 returnTo の fallback 契約を DSR-18 で明文化。
- Testability and traceability IDs: DSR-18 / TRACE-D11 / 各 doc Dn を後続 R3 の Matrix が cite。

## Contract Probe

N/A — 外部 library / OS 前提なし。起票時実測は上記「起票時実測」節を正とする。

## Contract Coverage Ledger

N/A — R2 docs-only。後続 R3 packet で 8 site × 契約行の Ledger を必須とする。

## Test Plan

- targeted tests: docs-only のため L1 full の docs 系 gate（doc-consistency-check、link checker）を evidence とする。
- negative tests: N/A（runtime 変更なし）。
- compatibility checks: 旧「一覧発限定」文言の残存 0 を rg presence oracle で確認（新文言 exact 存在 + 旧文言 0 hit の対 oracle）。
- data safety checks: 実 store データなし。
- main wiring/integration checks: N/A。

## Boundary / Wire Contract

本 PR は docs-only で wire 変更なし。後続 R3 で以下を Ledger 化する予告のみ記す:

- producer: 送信側 8 site の `<Link search={{ returnTo }}>`
- consumer: 業務記録詳細 6 page + 操作ログ復帰
- wire type: URL search string（`z.string().max(500).optional().catch(undefined)` の既存 route schema）
- invalid input: allowlist 型 sanitize で既定 hub へ fallback
- compatibility: returnTo 欠落時は現行挙動（無絞り込み hub）を維持

## Review Focus

- gap 8 site の全被覆: 各 site が DSR-18 + どの doc 契約に対応するかの突合。
- TRACE-D11 改訂の 4 箇所同期と旧文言残存 0。
- 74 §74.9 追記が UI-11c-D5（click 競合回避）と矛盾しないこと。
- DSR-18 と DSR-15 の整合: DSR-18 が DSR-15 を extend する関係（最低基準 = prefix 検証、supersede しない）が本文で明示され、両 DSR が同一トピックで矛盾しないこと。
- DSR-18 の共通 helper 方針が products 側 `return-to.ts` の exact-allowlist 型（typed parse-back 用途）と矛盾しないこと。
- Plans.md 再編が owner 裁定 A' と一致すること。

## Spec Contract

N/A — R2。

## Trace Matrix

N/A — R2（Design Intent Trace を参照）。

## Data Safety

N/A — R2 docs-only、実 store データ非関与。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
