# Plan Packet: 操作ログ producer 実効化（record_type / record_id 4 producer 書込み + 関連記録 link 実データ発火）

UI-11c（PR #164）で操作ログ画面の「関連記録を見る」link UI（§74.9 契約）は実装済みだが、`record_type` を書き込む producer が 0 件のため実データでの発火は 0 件のままである。本 packet は R3 キュー最終（①②③は PR #23 / #24 / #25 で完了、owner 選定 2026-09-01）として、入庫・返品交換・手動販売・廃棄の 4 BIZ producer の操作ログ書込みへ `record_type` / `record_id` を記録し、link を実データ発火可能にする。PR #23 L3-3 waiver（実データの関連記録 link → 詳細 → 調査 state 復元）の義務 L3 を Human Gate に含む。

## Workflow State

- Phase: ready-hosted-final
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: ef9a8df
- Amendments: none
- Coordinator: Claude Fable 5 (main session)
- Writer: Codex (GPT-5.6、発注書駆動)
- Plan Reviewer: Claude Sonnet 5 (independent fresh context)
- Final Reviewer: Claude Sonnet 5 (independent fresh context) + Coordinator mutation 独立再実測
- Reviewed Content HEAD: 0e17087
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: none（owner Windows native L3 全件 PASS + Ready 承認済み 2026-09-01 — 下記 L3 記録参照。残る owner 操作は PR #26 の Ready 化と merge のみ）

Phase 遷移記録（kickoff → spec-check → plan-draft → plan-gate、本 plan-first commit に同乗）: task scope と R3 判定は本 packet に記録。spec-check では in-scope source docs（74 §74.9 / UI-11c-D7 / UI-11c-D16、65 §65.3、db-design tracking-system-tables）が実装十分と判定し、spec-check → plan-draft の許可された skip（Design Readiness が既存 docs 充足を引用）を適用。source docs の producer 記述 drift（下記 D-3）は新規設計ではなく事実状態の追随であり、実装と同一 PR の doc sync として Scope に含める。packet + Test Design Matrix を同 commit で commit し plan-gate に至る。

## Owner Effort Budget

- 介入回数上限: 5（既定 3 から引き上げ — 起票時 scope 裁定が 2 decision point あり、L3 が 5 項目〈4 操作の実データ生成 + 調査 state 復元〉と厚いため）
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
消費済み 3 回（2026-09-01）: ① R3 キュー最終としての本 change 選定、②③ 起票時 scope 裁定 2 decision point（sale_id → record_id 一本化 / csv_import・stocktake の backlog 据置）。残りは ④ Windows native L3、⑤ Ready 承認 + merge。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
Risk Tiers R3 行のうち operator workflow（操作ログ → 業務記録詳細への到達導線が実データで発火するようになる）に該当し、`detail_json` の 2 field は §74.9 が UI との間で厳密一致判定する安定契約（wire 相当）である。DB schema / migration / Tauri command DTO / bindings / route / merge gate は変更しない（`record_type` / `record_id` はカラムではなく `detail_json` TEXT 内の JSON key — `docs/db-design/tracking-system-tables.md` の設計どおり。AC で bindings 差分ゼロを機械確認）。

## Goal

Goal Invariant:

### 最小完了条件

(1) 入庫・返品交換・手動販売・廃棄の新規操作ログの `detail_json` に、§74.9 許可リストどおりの `record_type` と当該業務記録 PK の `record_id` が両方入る。(2) 操作ログ画面で当該 4 種の新規ログに「関連記録を見る」link が表示され、対応する詳細 route へ遷移し、returnTo で調査 state（期間・種別・page）が復元される（UI 側は既存実装のまま発火する）。(3) manual_sale の detail key は `record_id` へ一本化される（新規ログから `sale_id` key を書かない — owner 裁定 2026-09-01）。(4) source docs の producer 記述 drift（3 producer 記載・manual_sale 脱落・実効化前の現状記述）が実効化後の状態に是正される。

### 失敗定義

- 4 種のいずれかで `record_type` / `record_id` の対が書かれない、許可リスト外・当該操作の正値でない `record_type` を書く、または詳細 route の query と不整合な `record_id` を書く。
- 既存ログ（`record_type` なし）や対象外 operation_type のログに link が出る regression。
- manual_sale の新規ログに `sale_id` key が残る、または DTO（`ManualSaleCreateResult.sale_id`）・bindings 側へ変更が及ぶ。
- 冪等再送（ログ非書込み）・失敗 rollback など既存の操作ログ書込み挙動の regression。

### 非目的

- `csv_import` / `stocktake` producer への `record_type` 採用と許可リスト拡張（owner 裁定 2026-09-01 で backlog 据置。§74.9 / §74.16 / 65 §65.8.3 系の除外文面に据置判断を明記する — D-4）。
- `ManualSaleCreateResult.sale_id` DTO field（`src/lib/bindings.ts` / `ManualSalePage`）— 変更しない。一本化の対象は operation log の `detail_json` 内 key のみ。
- 過去ログの遡及書換え（既存 row は不変。`record_type` なしの過去ログは link 非表示のまま = §74.9 契約どおりの安全動作）。
- 操作ログ画面 UI の変更（§74.9 guard / route map / returnTo は実装済み。`KNOWN_KEYS` への `sale_id` ラベル追加もしない — 過去ログの raw key 表示で受容、D-2）。
- 4 操作以外の `insert_operation_log` 呼出し site（設定変更・保守系等）への `record_type` 追加。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

1. **入庫**: `src-tauri/src/biz/inventory_service/receiving.rs` の操作ログ detail へ `"record_type": "receiving_record"` を追加（`record_id` は書込み済み）。
2. **返品交換**: `returns.rs` へ `"record_type": "return_record"` を追加（同上）。
3. **廃棄**: `disposal.rs` へ `"record_type": "disposal_record"` を追加（同上）。
4. **手動販売**: `manual_sale.rs` へ `"record_type": "manual_sale"` と `"record_id": sale_id` を追加し、`"sale_id"` key を撤去（D-2。`item_count` / `warning_count` / `idempotency_key` は不変）。
5. **backend 契約 test**: Matrix T1〜T4（4 producer 個別の literal oracle assert + manual_sale の `sale_id` 0 hit 対 oracle）。既存 test の削除・無効化なし。既存 test に detail_json の key 構成を assert する箇所がある場合（起票時実測: `receiving.rs` の最新ログ検査 test）は実装に伴う**正当な更新対象**であり、Writer は更新箇所を PR body に列挙し、アサートの弱体化はしない。
6. **doc drift 是正（D-3 / D-4 の sweep）**: 是正対象は次の **7 箇所** — (i) `docs/function-design/74-ui-operation-logs.md:57` UI-11c-D7 行の現状記述、(ii) 同 `:244` §74.9 除外文面（据置明記）、(iii) 同 `:256` §74.9 現状の producer 状況（実効化後の状態へ書換え。新記述は D-050 に従い volatile count を転記しない）、(iv) 同 `:565` §74.16 producer 追加 row（実効化完了により削除。**行削除は新記述を持たず残存検査 rg の pattern にも hit しないため rg oracle の対象外** — Writer は `git diff` で該当 row の消失を直接確認し、Final Review で Scope 6 列挙との手動突合を行う）、(v) 同 `:566` §74.16 csv_import・stocktake row（据置判断明記）、(vi) `docs/function-design/65-inventory-record-traceability.md:242` の関連記録リンク現状記述（stocktake route の時制 drift 含む）、(vii) `docs/FUNCTION_DESIGN.md:54` UI-11c 行の producer 側 defer 記述。是正後の残存検査は `rg -n "producer が0件|record_type を書き込む|3 producer" docs --glob '!docs/archive/**' --glob '!docs/plans/**'` で行い、**残 hit が更新履歴の歴史記録 2 行のみ**（`74-ui-operation-logs.md` 更新履歴節〈§74.19 直後の無番号節〉の 2026-08-28 行 / `65-inventory-record-traceability.md` 更新履歴の 2026-07-11 行 — 歴史記録として非改変）であることを確認する。`Plans.md` backlog 行（表記変形「producer が 0 件」のため上記 pattern 非該当）の消込みは closeout で行い、本 PR では触らない。

## Non-scope

- frontend 変更（`OperationLogsPage` は無変更で発火する — 起票時実測で §74.9 guard・route map・returnTo・negative 8 種 test の実在を確認済み。既存 test は無変更 green が条件、T6）。
- `65-inventory-record-traceability.md` §65.10 実装スライスの再編（csv_import / stocktake の実効化は backlog）。
- migration / schema 変更（不要 — `operation_logs` は 5 カラムのまま、両 field は detail_json 内）。

## 設計判断（実装方式の確定）

- **D-1（record_type 値と record_id 意味論）**: `record_type` は §74.9 許可リストの literal と完全一致 — `receiving_record` / `return_record` / `disposal_record` / `manual_sale`。`record_id` は各詳細 route が query する PK と同値: receiving / returns / disposal は既存の `record_id`（各記録テーブル PK）、manual_sale は `insert_manual_sale` の戻り値 `sale_id` = `manual_sales.id`（詳細 route の `get_manual_sale_record_detail` が `WHERE manual_sales.id = ?1` で引くことを起票時実測 — route param と整合する）。
- **D-2（sale_id 一本化）**: owner 裁定 2026-09-01。新規ログの detail key は `record_id` のみとし、他 3 producer と完全対称にする。過去ログの `sale_id` は `KNOWN_KEYS` 外の raw key 表示のままで受容（値は読める・監査可読性は維持・出現頻度低）。「併記」案は同一値 2 key の冗長と将来の grep 誤誘導を招くため棄却。DTO の `sale_id` field は別物であり非接触。
- **D-3（doc drift 是正同乗）**: 74 doc §74.9 / §74.16 と UI-11c-D7 行は producer 候補を 3 件と書き manual_sale（`record_id` 未書込みで実作業最大の site）を脱落させている drift。Plans.md backlog の 4 操作記載が正。実効化と同一 PR で drift-fix sweep（Scope 6 の rg）により是正する。「docs-only PR に分離」案は、実効化後に旧記述が一時的に嘘になる期間を作るため棄却（Behavior changes update the relevant source document in the same change）。
- **D-4（csv_import / stocktake 据置）**: owner 裁定 2026-09-01。両種の除外理由は現行文面で「producer 側の `record_type` 採用（既存 follow-up）と併せて追加する」だが、本 R3 は 4 業務 producer のみを実効化し csv_import / stocktake producer には採用しない。誤読（本 R3 で自動的に許可リスト拡張と読める）を防ぐため、除外文面へ「2026-09-01 の producer 実効化 R3 では据置し、csv_import / stocktake producer への採用は別 follow-up」の据置判断を明記する。

## Acceptance Criteria

- AC1: 4 producer の新規操作ログ `detail_json` に、当該操作の `record_type`（§74.9 literal）と当該記録 PK の `record_id` が入る（T1〜T4、per-producer 個別 assert）。
- AC2: manual_sale の新規 `detail_json` に `"sale_id"` key が存在しない（T4 の対 oracle）。
- AC3: 冪等再送・失敗 rollback でログを書かない既存挙動が不変 — 該当既存 test（operation_logs COUNT 検査・失敗系）を無変更のまま `cargo test` が green（T5）。
- AC4: `src/lib/bindings.ts` の diff ゼロ + frontend 変更ゼロ（`git diff --stat` で src/ 配下 0 file）。
- AC5: doc 是正の対 oracle — Scope 6 の 7 箇所のうち (iv) を除く 6 箇所で新記述（4 producer 実効化済み + 据置判断）が exact 存在し、Scope 6 の残存検査 rg（archive / `docs/plans/` 除外）の残 hit が更新履歴の歴史記録 2 行のみ。(iv) の row 削除は rg oracle 対象外のため `git diff` での消失直接確認 + Final Review 手動突合で担保する。`bash scripts/doc-consistency-check.sh` green。
- AC6: 既存 test の削除・無効化（skip 含む）なし — backend `cargo fmt --check` / `cargo clippy` / `cargo test` green、frontend 全 gate green、`cargo check --release` PASS（L3 前 Writer 完了条件）。

## Design Sources

- Requirements / spec: 新規 REQ token 追加なし（既存 UI-11c 系契約の producer 側実効化）。test の traceability 表記は各 file の既存慣行に従い、REQ token を新規追加する場合のみ `generate_traceability` 再生成を同 commit で行う
- Architecture: 変更なし（BIZ 層内の既存 `insert_operation_log` 呼出しへの key 追加のみ、層間呼出し不変）
- Function / command / DTO: `docs/function-design/74-ui-operation-logs.md` §74.9（関連業務記録リンク契約 UI-11c-D7 / UI-11c-D16）/ §74.16、`65-inventory-record-traceability.md` §65.3・関連記録リンク記述
- DB: `docs/db-design/tracking-system-tables.md`（operation_logs — detail_json に関連 record_type / record_id を含めてよい、schema 変更なし）
- Screen / UI: 変更なし（§74.9 消費側は実装済み。DSR-18 returnTo は PR #23 で実装済み）
- Decision log / ADR: 変更なし（D-2 / D-4 は本 packet の適用裁定であり、契約本体は §74.9 が既に保持）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 74 §74.9 の 2 field 契約 + tracking-system-tables の detail_json 設計 | existing sufficient（producer 側の書込み値は §74.9 の許可リスト・route map が既に確定） |
| Command / DTO / generated binding / wire shape | 変更なし（AC4 で差分ゼロ機械確認） | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし（既存 tx 内の同一 insert に key 追加のみ） | existing sufficient |
| Screen / UI / route state / Japanese wording | 変更なし（消費側実装済み） | existing sufficient |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | 変更なし（drift 是正は事実状態の追随、D-4 据置判断は §74.9 除外文面へ明記） | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| なし（route / command / REQ token / doc / 画面の新設なし） | Writer 作業中に REQ token 追加が必要になった場合は `generate_traceability` 再生成を同 commit で行う | 条件付き |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| UI-11c-D7 | 74 §74.9 | D-1 | link 発火には 2 field の厳密一致が必要。heuristic 推測・coercion は §74.9 が明示禁止しており、producer が正値を書く以外の発火手段はない | Scope 1〜4 | T1〜T4 |
| UI-11c-D16 / DSR-18 | 74 §74.9 returnTo | — | 消費側実装済み（PR #23）。producer 実効化で実データ検証が可能になる — waiver 義務の解消 | 変更なし | L3-5 |
| 74 §74.9 producer 記述 | 74 §74.9 / §74.16 / UI-11c-D7 行、65 §65.8.3 相当 | D-3 | manual_sale 脱落の 3-producer 記載は drift。実装と同一 PR で是正しないと実効化後に旧記述が嘘になる | Scope 6 | AC5 対 oracle |
| §74.9 許可リスト除外（csv_import / stocktake） | 74 §74.9 / §74.16 | D-4 | 「producer 採用と併せて追加」の現行文面は本 R3 での自動拡張と誤読しうる。据置判断の明記で契約の現在地を確定 | Scope 6 | AC5 |
| detail_json key 対称性 | tracking-system-tables + §74.9 | D-2 | manual_sale だけ `sale_id` の非対称は grep・監査の誤誘導。record_id 一本化で 4 producer 対称に | Scope 4 | T4 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: §74.9 が 2 field 契約・許可リスト・route map・returnTo を、tracking-system-tables が detail_json 設計を保持しており成立。
- Plan-only durable decisions found and promoted to source docs: D-4 の据置判断は Scope 6 で §74.9 / §74.16 の除外文面へ明記する（packet 専有にしない）。D-1 / D-2 は既存契約の適用裁定。
- Assumptions and constraints: UI は無変更で発火する（起票時実測で guard・route map・negative test の実在確認済み）。過去ログは不変で link 非表示のまま。
- Deferred design gaps: csv_import / stocktake の実効化（backlog 据置、D-4）。`KNOWN_KEYS` の `sale_id` ラベル（過去ログ raw 表示の受容、D-2）。
- Test Design Matrix can cite design decision IDs: UI-11c-D7 / UI-11c-D16 / D-1〜D-4 を cite。
- Absolute guarantee / escape hatch self-check: 変更は既存 tx 内 insert への JSON key 追加のみで、失敗時挙動（rollback でログごと消える）・冪等再送（ログ非書込み）の経路は不変。link 表示は §74.9 の fail-closed guard（欠落 = 非表示）が受け皿。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — BIZ 層内の既存呼出しへの key 追加、外部 adapter 非接触 | — |
| Fact check / design decision split | 4 producer site の現状 detail key・§74.9 guard 実装・route 実在・DTO `sale_id` の別物性は 2026-09-01 起票時実測（HEAD e0a2a9b）で確認済みの観測事実。record_type 値・一本化・据置は design decision（D-1/D-2/D-4） | 本 packet「起票時実測」節 |
| Lifecycle / retry | 操作ログ書込みは業務記録 insert と同一 tx — 成功時のみ両方 commit、失敗 rollback で両方消える。冪等再送は早期 return でログ非書込み（既存挙動、T5 で保護） | Matrix T5 |
| Operator workflow | 操作ログから業務記録詳細への到達導線が実データで初めて機能する。既存の操作手順は不変（加算的） | Matrix + L3 |
| Replacement path | not applicable（外部システム非接触） | — |
| Data safety / evidence | synthetic fixture のみ。実店舗データ非 commit | Data Safety 節 |
| Reporting / accounting semantics | not applicable（ログの参照 key 追加のみ、集計非接触） | — |
| Manual verification | link の実データ発火・詳細到達・調査 state 復元は Windows native L3 で確認（PR #23 waiver 義務の解消を含む） | Human Gate |
| 環境・再現性 | 新設の環境依存なし | — |

## Design Readiness

§74.9 が許可リスト literal・`record_id` の型条件・route map・returnTo 契約を、tracking-system-tables が detail_json への格納方式を、それぞれ実装可能な粒度で確定済み。未解決の design 問題なし。実装方式の残余自由度（manual_sale の key 戦略・csv_import / stocktake の扱い・doc 是正の同乗）は owner 裁定 2 件（2026-09-01）と本 packet の D-1〜D-4 で確定した。

## 起票時実測（2026-09-01、HEAD e0a2a9b）

Explore subagent の全数調査を Coordinator が load-bearing 箇所の実読で裏取り（三点一致確認済み）:

- 4 producer site の現状: `receiving.rs`（`"record_id"` あり、`operation_type: "receiving_create"`）/ `returns.rs`（`"record_id"` あり、`return_type` 等の追加 key あり）/ `disposal.rs`（`"record_id"` あり）/ `manual_sale.rs`（`"sale_id"` のみ、`record_id` なし）。4 site とも業務記録 insert と同一 tx 内の `insert_operation_log` 単一呼出しで、`NewOperationLog.detail_json` は自由 JSON（signature 変更不要）。
- `record_type` の書込みは `src-tauri/src` 全体で 0 件（rg 実測）。
- manual_sale の id 意味論: `sale_id` = `insert_manual_sale` 戻り値 = `manual_sales.id`。詳細 route の `get_manual_sale_record_detail` は `WHERE manual_sales.id = ?1` — record_id への流用で route param と整合。
- 消費側 UI: `OperationLogsPage.tsx` に route map・§74.9 guard（typeof / `Number.isSafeInteger` / `> 0`、coercion なし）・「関連記録を見る」link + returnTo 生成・negative 8 種 test（zero / negative / fractional / numeric string / unsafe integer / unknown type / missing 各種）が実在。4 詳細 route file 実在、returnTo を受理。
- `sale_id` の他参照: `bindings.ts` の `ManualSaleCreateResult.sale_id`（DTO field — detail_json とは別物、非接触）と `ManualSalePage` 系のみ。frontend で detail_json の `sale_id` key を機能参照する箇所は 0。
- 既存 test の detail 検査: `receiving.rs` に最新 operation_logs row の `operation_type` / `detail_json` を検査する test あり（正当更新対象の候補）。冪等再送でログ非増加を検査する test が 4 service にあり（COUNT 検査 — 無変更 green 対象）。
- doc drift: 74 doc の UI-11c-D7 行 / §74.9 / §74.16、65 doc、`docs/FUNCTION_DESIGN.md:54` の関連記述が「3 producer + record_type 0 件」の実効化前状態を記載し、manual_sale を producer 候補から脱落。是正対象は Scope 6 に 7 箇所として全列挙（Plans.md backlog 行は closeout 消込み。§74.19 / 65 更新履歴の changelog 行と archive は歴史記録として非改変。packet 自身の実測記述は sweep 対象外 — Plan Review round 1 P1-1 是正）。
- PR #23 L3-3 waiver: archived packet に「実データでの L3 検証は producer 実効化 R3 の Human Gate に義務として含める」と明記（台本 = 期間・種別・page 設定 → 関連記録を見る → 戻りで同 state 復元）。

## Contract Probe

not required — 本 change の premise（serde_json の key 追加・SQLite TEXT 格納・§74.9 guard の受理挙動）はすべて repo 内実装と既存 test で検証済みの既知動作であり、未検証の外部 library / OS premise はない。消費側の受理は §74.9 guard 実装 + positive fixture test の起票時実測で確認済み、実データ経路は L3-1〜L3-5 で確認する。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| UI-11c-D7 許可リスト 4 値（producer 書込み値の一致） | Scope 1〜4 | T1〜T4（literal oracle、per-producer） | L3-1〜L3-4 |
| §74.9 record_id 条件（positive int、route query と同値） | Scope 1〜4 | T1〜T4（挿入記録 PK との突合） | L3-1〜L3-4 |
| UI-11c-D16 / DSR-18 returnTo（調査 state 復元） | 変更なし（消費側実装済み） | 既存 frontend test（無変更 green、T6） | L3-5（PR #23 waiver 義務） |
| D-2 sale_id 一本化（新規ログに sale_id 0） | Scope 4 | T4 対 oracle | — |
| D-3 / D-4 doc 是正（4 producer 化 + 据置明記） | Scope 6 | AC5 対 oracle + doc-consistency-check | — |
| 隣接: 冪等再送でログ非書込み | 変更なし | 既存 test 無変更 green（T5） | — |
| 隣接: §74.9 fail-closed guard（過去ログ・欠落 field で link 非表示） | 変更なし | 既存 negative 8 種 test 無変更 green（T6） | — |
| 隣接: DTO `ManualSaleCreateResult.sale_id` / bindings | 変更なし | AC4 bindings diff ゼロ | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-01-oplog-producer-impl.md](test-matrices/2026-09-01-oplog-producer-impl.md)

- targeted tests: 4 producer 個別の detail_json 契約 assert（T1〜T4。record_type literal は §74.9 表から test へ独立転記し、production 側 literal と共有しない）
- negative tests: manual_sale の `sale_id` key 不在（T4 内対 oracle）、冪等再送でログ非増加（T5 既存）
- compatibility checks: 既存 test 無変更 green（T5 / T6、正当更新は Scope 5 条件で除外列挙）、bindings diff ゼロ + frontend 0 file（AC4）
- data safety checks: synthetic fixture のみ
- main wiring/integration checks: T1〜T4 は実 SQLite（in-memory / temp）での service 呼出し → operation_logs 実 row の parse まで通す（mock 化しない）
- Human Gate に L3 を含むため、Writer 完了条件に `cargo check --release` を含める（CI gate ではない — release build blind spot 対策）

## Boundary / Wire Contract

- producer / consumer / wire type: `operation_logs.detail_json`（TEXT、自由 JSON）内の 2 key が §74.9 の厳密一致契約で UI に消費される。`record_type` = 許可リスト literal（string）、`record_id` = 業務記録 PK（JSON number、positive integer）。serde_json の `json!` macro で i64 がそのまま number になり、guard の `Number.isSafeInteger` を満たす（既存 `record_id` 書込み 3 site と同型）。
- 後方互換: key 追加は加算的。過去ログ（`record_type` なし）は link 非表示のまま — §74.9 の fail-closed が受け皿で、遡及 migration は不要。
- manual_sale の `sale_id` key 撤去は新規ログのみに影響。消費側で detail_json の `sale_id` を機能参照する箇所は 0（起票時実測）— 表示上は過去ログの raw key 表示が残るのみ。
- Tauri command / DTO / generated bindings / route / search state: 変更なし（AC4 で機械確認）。
- invalid input: なし（producer は自 tx 内で確定した PK を書くだけで、外部入力を新たに受けない）。

## Review Focus

- record_type literal の独立転記（test の期待値を §74.9 表から転記し、production コードの literal・共有定数から導出しない — SSOT 共有の mutation 感度自壊の型）
- T1〜T4 の per-producer 個別性（4 site を 1 loop / 1 combined test にしない — 1 site 漏れ mutation の検出粒度）
- record_id oracle の実 PK 突合（固定値 assert でなく、当該 test で挿入した業務記録の実 PK と突合すること — 固定値は id 採番変化で偽 red / 偽 green 両方の脆さ）
- T4 対 oracle の実効性（`sale_id` key 不在 assert が JSON parse 後の object key 検査であること — 文字列 contains では `record_id` の部分一致等で偽判定しうる）
- doc 是正 sweep の全数性（Scope 6 の 7 箇所の置換完了と、残存検査 rg の残 hit が changelog 歴史記録 2 行のみであること。changelog・archive・packet 自身の実測記述を巻き込まないこと）
- 既存 test 更新の正当性（receiving の最新ログ検査 test 等、更新は key 追加への追随のみでアサート弱体化がないこと）

## Spec Contract

Contract ID: SPEC-OPLOG-PRODUCER-2026-09-01

- 入庫・返品交換・廃棄の操作ログ detail_json に、既存 `record_id` と対になる `record_type`（それぞれ `receiving_record` / `return_record` / `disposal_record`）を追加する
- 手動販売の操作ログ detail_json に `record_type: "manual_sale"` と `record_id`（= `manual_sales.id`）を追加し、`sale_id` key は新規ログから書かない
- 4 producer の他の detail key（item_count / warning_count / return_type / register_processed / idempotency_key）と summary・operation_type は変更しない
- 冪等再送・失敗 rollback のログ非書込み挙動、UI・DTO・bindings・schema は変更しない
- source docs の producer 記述を実効化後の状態（4 producer 書込み済み）へ是正し、csv_import / stocktake の据置判断を明記する

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| UI-11c-D7 + D-1 | Scope 1〜3 | T1 / T2 / T3 | literal 独立転記・per-producer | Matrix |
| UI-11c-D7 + D-1 / D-2 | Scope 4 | T4 | 対 oracle 実効性・実 PK 突合 | Matrix |
| 冪等・rollback 隣接 | 変更なし | T5 | 既存 test 無変更 | Matrix |
| UI-11c-D16 消費側隣接 | 変更なし | T6 | frontend 0 file | Matrix + AC4 |
| D-3 / D-4 doc 是正 | Scope 6 | AC5 対 oracle | sweep 全数性 | PR body |

## Data Safety

synthetic fixture のみ使用(test は in-memory / temp SQLite の合成データ、L3 は owner 手元の開発 DB で通常のアプリ操作により生成)。実店舗の商品・取引データを test にも docs にも commit しない。

## Human Gate（owner Windows native L3）

L3 項目（既存開発 DB + 通常のアプリ画面操作のみで実施可能。4 操作とも画面から作成でき、**DB 外の入力物〈import file / CSV〉は不要** — L3 fixture 前提を DB 外入力物込みで突合済み。新規 tool 導入・fault-injection 級手順なし = L3 Eligibility 3 条件充足）:

- L3-1: 入庫を 1 件作成 → 操作ログ画面で当該ログを展開 → 「関連記録を見る」が表示され、click で入庫詳細（当該記録）に到達する。
- L3-2: 返品交換で同型（返品記録詳細に到達）。
- L3-3: 手動販売で同型（手動販売記録詳細に到達）。
- L3-4: 廃棄で同型（廃棄記録詳細に到達）。
- L3-5（PR #23 L3-3 waiver の引き継ぎ義務）: 操作ログで期間・種別・page を設定 → 実データの「関連記録を見る」→ 詳細 → 戻りで同じ調査 state（期間・種別・page）が route search として復元される。
- 併せて確認: `record_type` を持たない既存の過去ログに link が出ていないこと（fail-closed の実データ確認、任意）。

## 発注・レビュー段取り

- Writer: Codex（発注書は plan-approved 後に Coordinator が作成、worktree isolation）。
- Plan Reviewer: Sonnet subagent（fresh context、P1/P2 = 0 で plan-approved）。
- Final Reviewer: Sonnet subagent 別個体 + Coordinator が Matrix 記載の mutation を clean tree で独立再実測。
- hosted final: non-doc R3 のため Ready 化で自動 run。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Plan Review / Final Review の記録は本節へ append-only で追記する。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### Plan Review rally 記録（2026-09-01、append-only）

- round 1（Sonnet 独立 reviewer、対象 = plan-first commit `ef9a8df`）: P1 1 / P2 1 / P3 1。観点 1（前提事実 — 起票時実測の file 実読突合）は全項目一致、oracle 品質・L3 妥当性・リスク観点は不整合なし。
  - P1-1 **採用**: Scope 6 の sweep rg と AC5「0 hit」oracle の自己矛盾 — 当該 pattern は非改変と規定した changelog 行（74 doc §74.19 の 2026-08-28 行 / 65 doc 更新履歴の 2026-07-11 行）と packet 自身（docs/plans/ 配下 6 hit）にも hit するため、Writer が literal に従うと非改変ルール違反か AC5 恒久不成立のいずれかに陥る。Coordinator が rg 実測で再現し三点一致。是正 = 是正対象を 7 箇所へ明示列挙 + 残存検査 rg へ `--glob '!docs/plans/**'` 追加 + 期待残 hit を changelog 歴史記録 2 行に確定（Scope 6 / AC5 / 起票時実測 / Review Focus / Matrix の関連記述を同一 commit で同期是正）。
  - P2-1 **採用**: Scope 6 列挙に `docs/FUNCTION_DESIGN.md:54`（UI-11c 行の同型 defer 記述）が欠落。Coordinator 実読で drift を確認し、7 箇所列挙の (vii) として追加。
  - P3-1 **採用**: Matrix Adjacent Pattern Audit の「18 file・約 30 site」は 74 doc §74.9 の stale 記述の転記（reviewer 実測 20 file）で、本 packet の fresh 実測ではなかった。D-050 に従い volatile count を転記しない表現へ是正（74 doc :256 の新記述にも同旨を Scope 6 (iii) で明記済み）。
- 是正後も Phase は plan-gate に留まり、round 2（別個体 Sonnet の独立再検証）で是正の実装事実整合と残余 P1/P2 を確認する。
- round 2（別個体 Sonnet、対象 = 是正 commit `4eda007`）: 検証 6 項目中 5 項目 PASS（P2-1 / P3-1 是正適用・是正 diff の regression なし・doc-check exit 0）、P1-1 是正の実効性検証で新規 P2 1 件 / P3 1 件。
  - 新規 P2 **採用**: AC5 の残存検査 rg oracle は Scope 6 (iv)（§74.16 row の**削除**）を検出できない — 削除対象は新記述を持たず、現行文面が pattern 3 種のいずれにも hit しない（Coordinator の起票時 sweep 実測でも `:565` は非 hit で三点一致）。是正 = Scope 6 (iv) へ「rg oracle 対象外、`git diff` で消失を直接確認 + Final Review 手動突合」を明記し、AC5 を「(iv) を除く 6 箇所の exact 存在 + 残 hit 2 行 + (iv) は diff 直接確認」へ是正。Writer / Final Review 発注書にも明記する。
  - 新規 P3 **採用**: changelog 行の節名表記「§74.19 の 2026-08-28 行」は正しくは §74.19 直後の無番号「更新履歴」節内 — Scope 6 の表記を是正（round 1 記録中の同表記は append-only のため本記録での訂正をもって正とする。line 内容・日付・oracle への影響なし）。
  - reviewer 判定は「plan-approved へ異論なし（新規 P2 は非 blocking 性質だが発注書明記を推奨）」。Coordinator は上記是正を同一 commit で適用し、P1/P2 = 0 の確認を round 2 reviewer の追検証で取得のうえ plan-approved へ遷移する。
- round 2 追検証（同 reviewer、対象 = 是正 commit `e8880b4`）: 検証 4 項目（P2 是正適用 / P3 是正適用 / 是正 diff の regression なし・doc-check exit 0 / 残余走査）すべて PASS、**P1/P2 = 0、plan-approved へ異論なし**。

Phase 遷移記録（本 state-only commit で materialize）: `plan-gate -> plan-approved -> implementing`。Plan Review rally は round 2 + 追検証で新規 P1/P2 = 0 に収束（round 実績: round 1 → 是正 → round 2 → 是正 + 追検証、round 天井 3 の内数 2）。Plan Commit を `ef9a8df` で確定（plan-first commit は全 content commit の先頭にあり PK5 ancestry を充足する）。次は Codex 発注（Writer content commit、worktree 側 clone で実装、Draft PR open まで）。

### Writer review-only 記録（2026-09-01、append-only）

- content candidate `8cc7654` を独立 review-only sub-agent が確認し、P2 1件 / P3 1件を報告。Writer が live source / Matrix と突合し、両件を採用した。
- P2: Matrix T5 の「4 service の冪等再送 test が operation_logs COUNT 非増加を検査」という起票時前提に対し、manual_sale の既存 replay test は result contract のみを検査していた。Matrix 本文と既存 test は変更せず、manual_sale replay 前後の operation_logs COUNT 不変を検査する独立 regression test を追加して実被覆を補完した。
- P3: 74 §74.8 の `record_id` 説明に実効化前の3 producer列挙が残っていたため、volatile な列挙を削除し §74.9 参照へ同期した。
- Findings Freeze: review-only 初回 broad audit の finding set は上記2件で freeze。Phase は `local-verified` のまま維持し、Final Reviewer / Coordinator の独立確認を待つ。

### Final Review 記録（2026-09-01、append-only）

- Writer content commit: `a670b6b`（4 producer 実装 + doc 7 箇所是正）/ `8cc7654`（90-traceability 再生成）/ `0e17087`（review-only P2 対応の manual_sale replay COUNT test 追加）。Writer L1 full PASS（evidence の所在は PR body を正とする）、bindings diff 0、review-only closure P1/P2 = 0。Draft PR #26。発注書の cwd pin からの逸脱 1 件: Writer は public-writer clone でなく Coordinator と同一 clone で作業した — tree clean・remote 一致・PK5/STATECAP OK・非同期競合なしで実害なしと裁定、教訓は closeout で記録する。
- Coordinator mutation 独立再実測（同 tree の branch HEAD = `0e17087`、clean tree、commit 後）: M1〜M5 を Matrix どおり注入し全件 kill — M1（receiving record_type 行削除）は当該 test のみ fail で他 3 producer green（個別性成立）、M2（許可リスト内誤値）/ M3（record_id を実 PK からずらす）/ M4（sale_id key 再追加）/ M5（許可リスト外値）もすべて期待 test のみ fail。全注入は checkout 復元し、復元後 baseline green・tree clean・HEAD 不変を確認。
- Final Review round 1（Sonnet 独立 reviewer 別個体、対象 = `a80e2c3..0e17087`）: 検証 8 点（Ledger 逐条再検証〈4 literal + 詳細 route PK query との整合を repo 実読で確認〉/ Scope confinement〈bindings・src/・Plans.md 差分ゼロ〉/ AC1〜6〈AC5 残存検査 rg の残 hit = changelog 歴史記録 2 行のみ + (iv) row 削除を diff 直接確認〉/ oracle 独立性 / 既存 test 扱い〈削除・弱体化ゼロ〉/ doc 是正品質 / 回帰・negative-space / Workflow State・PR body 整合）**全 PASS、P1/P2/P3 = 0、Goal Invariant 充足 = yes**。reviewer 独立実測でも契約 test 27 passed / 0 failed。
- Findings Freeze: Final Review の Broad Audit 完了により発効。以降の round は closure 確認のみ。

Phase 遷移記録（state-only commit `1e61d55` で materialize）: `local-verified -> independent-review -> human-confirm`。Writer L1 full PASS + Coordinator mutation 全 kill + Final Review round 1 収束（P1/P2 = 0）により通過。`Reviewed Content HEAD` を `0e17087` で確定。残りは owner Windows native L3（L3-1〜L3-5）、Ready 承認、hosted final、merge。exact-HEAD evidence は D-035/D-038 どおり PR body を正本とする。

### owner Windows native L3 結果と disposition（2026-09-01、append-only）

- L3 実施: Windows native / branch pull 済み HEAD `1e61d55`（= Reviewed Content HEAD `0e17087` + docs 遷移 commit）。復元基準の控えを取得のうえ実施（owner 記録）。
- **L3-1〜L3-4: 全 PASS**。入庫 / 返品交換 / 手動販売 / 廃棄それぞれ実データ 1 件を作成し、操作ログの「関連記録を見る」表示と当該記録詳細への到達を確認。手動販売は複数クリック後も重複なし（追加観察）。
- **L3-5: PASS**。期間・種別・page を設定した調査 state が、実データ link での詳細往復後も route search として復元されることを確認 — **PR #23 L3-3 waiver の引き継ぎ義務を解消**。
- 任意確認: `record_type` を持たない過去ログに link が出ないこと（fail-closed の実データ確認）も PASS。
- 非ブロッキング UX 観察（機能契約に影響なし、closeout で design-first backlog 起票): PLU 警告の視認性 / 処理中フィードバック不足 / 薄いグレーの多用。参考候補として Refero サイトを含める（owner 提示）。
- owner 裁定: Ready へ進める（L3 実施 = 介入 4 回目、Ready 承認 = 介入 5 回目 / 予算 5 回 — 予算到達、owner 報告 2026-09-01 実記録。以降の owner 操作は Draft PR #26 の Ready 化と merge のみ）。

Phase 遷移記録（本 state-only commit で materialize）: `human-confirm -> ready-hosted-final`。Draft のまま遷移し、resulting exact HEAD で L1 full を再取得して PR body を更新する。Ready 化 → hosted 自動 run（non-doc R3）→ 三点一致（PR HEAD = PR body final L1 SHA = hosted run headSha）確認 → merge。
