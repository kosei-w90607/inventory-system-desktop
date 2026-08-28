# Plan Packet: Plans.md dashboard 減量（第 3 回 cleanup、snapshot chain 継承）

## Workflow State

- Phase: plan-draft
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable (Claude Code)
- Writer: Sonnet subagent (worker, fresh context)（§3.1「投入しない場合: … docs 同期」に該当するため希少 slot を Writer に充てない）
- Plan Reviewer: Sonnet subagent (independent)
- Final Reviewer: Sonnet subagent (independent)
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: Ready 承認（視覚確認なし — operator 画面変更を含まない docs-only）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 20分
- relay 往復上限: 2（本 lane は Codex 発注なしのため実消費 0 見込み）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only の dashboard 再編。runtime・契約に触れないが、Plans.md は AGENTS.md Session Start の canonical reading order に含まれる live dashboard であり、PK4（active packet link / Wave Registry の fail-closed 判定）の検査対象。maintainability と workflow 導線に影響する semantic な docs change として R2。AGENT_OPERATING_MANUAL §5.3 の cleanup prompt（Post-Merge Closeout 準拠）に従う。

## Goal

Goal Invariant:

### 最小完了条件

- Plans.md が DEV_WORKFLOW Artifact Map の規定（「Current phase, active work, blockers, next actions only.」）と Plans.md 自身の冒頭 tagline（「完了済みの詳細履歴は archive に移す」）に再適合する — 完了済み verbose 履歴が snapshot file へ verbatim 退避され、dashboard には未了事項と直近文脈のみが残る。
- 退避は情報損失ゼロ（snapshot file に旧 Plans.md 全文を fenced block で保存し、既存 snapshot chain へ Predecessor link で連結）。

### 失敗定義

- 未了 backlog 項目（起草時実査 32 項目）のいずれかが新 Plans.md からも snapshot からも辿れなくなる。
- PK4 の fail-closed 経路（active packet link / Wave Registry 形式）が壊れる、または doc-consistency-check が ERROR を出す。
- 完了記録の archived packet link が失われる（snapshot 側にも残らない形で消える）。

### 非目的

- backlog 項目の実施・優先度変更・新規起票（記載位置の整理のみ。項目の中身は無改変で移す）。
- archive 済み packet file 群の改変。
- 「現在のフェーズ」の方針変更（事実の現況化のみ。リリースへの道筋 ③④⑤ の内容は不変）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。

## Scope

起草時実査 2026-08-28（read-only 棚卸し agent の全数分類を Coordinator が裁定・凍結。Plans.md = 320 行 / 247,321 字 / 最長行 9,585 字〈L24 backlog セル〉。「次の行動」の未了 `- [ ]` は 0 件 = ほぼ全量が過去ログ化）:

**A. snapshot file 新設（受け皿、precedent chain 継承）**

1. `docs/archive/plans/2026-08-28-plans-dashboard-cleanup.md` を新設: 冒頭に Predecessor snapshot link（snapshot file 自身からの相対 path で `2026-07-04-plans-dashboard-cleanup.md` を指す markdown link）を明記し、cleanup 直前の Plans.md 全文（`git show` で取得した committed 版）を fenced code block で verbatim 保存する（2026-06-06 → 2026-07-04 版と同一の append-only chain 構造。既存 file への追記はしない）。

**B. 新 Plans.md の構造（節構成を以下へ再編）**

2. `## 現在のフェーズ`: 現況へ更新 — (a) 進捗を wave 6 完走（2026-08-28）まで反映し、残り = ③ 表示磨き batch ④ UI 一覧の背骨 D ⑤ go-live 検証 + MSI docs 化 → v1.0 の骨子は不変のまま記述を現在時点へ揃える。(b) 「現在の基準」に 2026-08-23〜24 の repository rehome（正本 = `kosei-w90607/inventory-system-desktop`、旧 public repo は private 化。詳細は D-077 / PUBLIC_REPO_MIGRATION.md）を反映する。
3. `## 残作業分類`: 表は維持するが、backlog 行のセル内容（旧 L24、9,585 字）を「下記『Backlog（未了）』節を参照」の 1 行に置換（最長行問題の根治。grey zone 1 の裁定 = セル → 節分解）。
4. `## 直近の完了`: 完了日 2026-08-26 以降の entry のみを各 1〜3 行の要約 + archived packet link で残す。日付基準で該当するのは PR #4（取引先管理実装）/ #5（cost_diffs）/ #6（docs 棚卸し）/ #7（stale 表記 batch）/ #8（plu returnTo fix）/ #9（棚卸し詳細 route）/ #10 / #11（wave 6 両 lane）の 8 entry（起草時実査、日付基準が正で列挙はその全数転記）。それ以前の `- [x]` entry（進行中節 + 次の行動節の合算）は dashboard から除去（snapshot に全文保存済み）。
5. `## 次の行動`: 本来の未来形専用へ再編（grey zone 2 の裁定）— リリースへの道筋 残り ③④⑤ の各 1 bullet（着手時は owner と選定、の現行方針を維持）+ 本 packet の active link（`- [ ]`、closeout で完了化）。
6. `## Backlog（未了）`: 旧 L24 セルの未了 32 項目と旧「後回し Backlog の参照先」節の未了分を 1 項目 1 bullet へ統合（grey zone 4 の裁定 = 節へ一本化。同一 topic の重複は 1 bullet に統合し、両記述の情報は losslessly 併合。項目本文は原文を尊重し要約で意味を削らない）。完了マーカー付き項目は移さない（snapshot 保存で足りる）。例外 1 件: 完了済み item「PK 系 checker gap」内に入れ子で残置されている未解決注記「PK4 の section 抽出が `###` 小見出しで打ち切られ `### Wave Registry` 配下 link が検査対象外になる問題（優先度は owner 判断）」は、Backlog（未了）節の**独立 bullet として起こして残す**（Wave Registry 節末尾の同内容の観測行は圧縮時に除去してよい — 写し先を本 bullet に一本化）。
7. `### Wave Registry`（次の行動 節配下、現行位置維持）: 形式行を維持し、wave 1〜6 を各 1 行（PR 番号 + merge SHA + archived packet link）へ圧縮 + 「現在 active wave なし」を明記（grey zone 3 の裁定 = PK4 経路を保った圧縮保持）。
8. `## ブロッカー` / `## 注意リスト`: 無改変。
9. `## 最近の archive`: 直近 5 件 + 「それ以前は `docs/archive/plans/` と GitHub PR 履歴を参照」の index 案内へ圧縮。

**C. 検査**

10. `bash scripts/doc-consistency-check.sh`（active plan があるため `--target plan` も）green を確認してから commit する。

## Non-scope

- archive 済み packet / WER / 過去 snapshot file の改変。
- backlog 項目の取捨選択・優先度変更（未了 32 項目 + 後回し節未了分は全て残す）。
- AGENTS.md / DEV_WORKFLOW.md 等の規約側変更。
- PROJECT_HANDOFF.md の更新（本 change は dashboard 整理であり project 進捗ではない）。

## Acceptance Criteria

検索 oracle は自己参照回避のため本 packet の在る `docs/plans` を検索対象に含めない。

- AC-1: `bash scripts/doc-consistency-check.sh` ERROR 0、かつ `--target plan` 全通過。
- AC-2: `wc -l docs/Plans.md` ≤ 140（設計値。起草時 320 行）。
- AC-3: `awk '{print length}' docs/Plans.md | sort -rn | head -1` ≤ 3000（設計値。起草時 9,585 字。backlog 1 項目 1 bullet 化の機械 oracle）。
- AC-4: snapshot file が `rg -F -c 'Predecessor snapshot' docs/archive/plans/2026-08-28-plans-dashboard-cleanup.md` ≥ 1、かつ旧 Plans.md 全文の fenced block を含む（行数照合: fenced block 内の行数 = 退避時点の Plans.md 実行数と一致）。
- AC-5: 未了 backlog の残存 spot 5 項目が新 Plans.md の **`## Backlog（未了）` 節の抽出内**（`awk` 等で同節のみ切り出した範囲）で各 ≥ 1 hit — `MSI 配布手順` / `PLUスロット永続割当` / `「前の画面へ戻る」導線契約` / `入出庫履歴の完成形 runway 復帰` / `shortcuts の retroactive unit test`。（節限定にする理由: `MSI 配布手順` 等は KEEP 対象の他節にも出現し、全文検索では移植漏れを検出できない — Plan Review round 1 P2）
- AC-6: 除去済み verbose の消滅 spot 3 件が 0 hit — `rg -F -c 'describeError' docs/Plans.md` = 0、`rg -F -c 'useBlocker' docs/Plans.md` = 0、`rg -F -c 'JAN 専用欄の共通正規化' docs/Plans.md` = 0。
- AC-7: Wave Registry に形式行 + wave 1〜6 の圧縮行 6 本 + 「active wave なし」記述が存在（`rg -c "wave [1-6]" docs/Plans.md` ≥ 6）。
- AC-8: 本 packet への link が「次の行動」節内に存在（PK4。closeout まで維持）。

## Design Sources

- Requirements / spec: 変更なし
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: 変更なし
- Decision log / ADR: 変更なし（dashboard 記載位置の整理。durable 判断なし — snapshot chain 構造は 2026-06-06 / 2026-07-04 の既存 precedent 踏襲）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | なし | existing sufficient |

## Registration / Generation Obligations

該当なし（doc 新設は archive 配下の snapshot のみで、目次・索引義務は Plans.md「最近の archive」直近 5 件内に自然に入る。REQ / route / command 非接触、生成物再生成なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| （workflow docs、spec ID 非接触） | DEV_WORKFLOW Artifact Map / AGENT_OPERATING_MANUAL §5.3 | 本 packet Scope B の grey zone 裁定 1〜5 | セル温存案は最長行問題が再発するため不採用 / 2 節統合は Artifact Map の見出し語義への再適合 / Registry 全 archive 案は PK4 fail-closed 経路への影響が読み切れず不採用 | docs/Plans.md + snapshot 新設 | AC-1〜AC-8 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history: yes（§5.3 cleanup prompt + snapshot chain precedent が正本）
- Plan-only durable decisions found and promoted: なし
- Assumptions and constraints: PK4 の検査対象は「次の行動」節内 link（`###` 小見出しで抽出打ち切りの既知 gap あり）— active packet link は `###` より前に置く
- Deferred design gaps, risk, and follow-up target: なし
- Test Design Matrix can cite design decision IDs: Matrix は R2 optional 判定で省略（機械 oracle AC-1〜AC-8）
- Absolute guarantee / escape hatch self-check: 「情報損失ゼロ」の保証は snapshot の verbatim 全文保存（AC-4 の行数照合）で担保。例外 = 未了項目の重複統合は文言を併合するため原文 2 本の並置ではないが、snapshot に両原文が残る

## Impact Review Lenses

not applicable — 起点は repo 内 dashboard の肥大（owner 指摘 2026-08-28「完了済みが多くて長い」）であり、実地調査・実機・外部 tool・POS 連携・format 変更のいずれにも該当しない。

## Design Readiness

- Existing design docs are sufficient because: 構造規定は DEV_WORKFLOW Artifact Map、手順は §5.3、受け皿構造は既存 snapshot chain 2 例の precedent で確立済み
- Source docs updated in this PR: `docs/Plans.md`（再編）+ snapshot 新設のみ
- Design gaps intentionally deferred: なし
- Durable decisions discovered: なし

Minimum design checks:

- Layer ownership: 非該当（docs-only）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 変更なし
- Error, empty, retry, and recovery behavior: 変更なし
- Testability and traceability IDs: REQ 非接触、oracle は AC-1〜AC-8

## Contract Probe

N/A — 外部前提なし（R2 docs-only。PK4 の抽出挙動は wave 6 起票時に実測済み: `###` 打ち切りのため link は節直下へ置く）。

## Contract Coverage Ledger

R2 簡易版:

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| Artifact Map「live dashboard は現況のみ」 | Plans.md 再編（Scope B） | AC-2/AC-3/AC-6 | non-scope |
| 完了履歴の archive 保全（情報損失ゼロ） | snapshot 新設（Scope A） | AC-4（行数照合） | non-scope |
| PK4 fail-closed 経路の維持 | active link + Wave Registry 圧縮 | AC-1/AC-7/AC-8 | non-scope |
| 未了 backlog の全数残存 | Backlog（未了）節 | AC-5（spot 5）+ Final Review の全数突合 | non-scope |

## Test Plan

Test Design Matrix は R2 optional 判定で省略（機械 oracle AC-1〜AC-8 + Final Review の未了 32 項目全数突合）。

- targeted tests: なし（docs-only）
- negative tests: AC-6（除去済み verbose の消滅）
- compatibility checks: AC-1（doc-consistency full + plan）
- data safety checks: AC-4（verbatim 退避の行数照合）
- main wiring/integration checks: L1 full（Ready 前の exact HEAD）

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない。

## Review Focus

- 未了 backlog 32 項目 + 後回し節未了分の**全数**が新 Backlog（未了）節に残存すること（識別名の全数突合、AC-5 の spot 5 では代替しない）
- 重複統合 bullet が両原文の情報を落としていないこと
- 「現在のフェーズ」の現況化が新たな事実誤りを持ち込まないこと（rehome の記述は D-077 / 既存 entry と突合）
- snapshot の fenced block が退避時点の committed Plans.md と byte 一致すること
- PK4 経路（active link 位置・Wave Registry 形式行）の維持

## Spec Contract

N/A（R2。触れる契約は Contract Coverage Ledger 参照）。

## Trace Matrix

N/A（R2、Design Intent Trace 参照）。

## Data Safety

- 旧 Plans.md 全文は snapshot file に verbatim 保存してから dashboard を削る（順序固定）。
- 実データ・secrets・破壊的操作なし。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
