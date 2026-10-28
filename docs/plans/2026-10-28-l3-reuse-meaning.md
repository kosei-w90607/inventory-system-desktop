# Plan Packet: MG-D13 B の「L3 の項目に影響なし」の意味を書き、同期の closure の止めの理由と test を直す

wave に属さない単独の lane。merge の関門の文（`docs/agent-guidance/merge-evidence.md` MG-D13 の B）と helper（`scripts/pr-gate.py`）・その test を変える。製品の runtime（`src/**`・`src-tauri/**`）は変えない。

出所: owner の裁定 TD-516（2026-10-28、repo 外の回答台帳。#197 の 2 回目の同期の B の closure で Codex は表示の値の変化を理由に reject、Fable は approve し、owner が a を選んだ）。PR #217 の Final Review〈Fable 5〉の P3 2 件（repo 外の報告 `.local/reports/final-review/pr217-broad-fable-b09ffa30.md` の #1・#2。Coordinator の裁定で follow-up にした）。

## Workflow State

- Risk: R3
- Plan Commit: pending
- Amendments: none

## Risk

Risk: R3

Reason:
merge の関門（MG-D13 の L3 の使い回しの判定）の意味と、その helper（`scripts/pr-gate.py`）を変える。classifier が `workflow=true` を出す変更は R2 にできない（`docs/DEV_WORKFLOW.md` Risk Tiers）。

## Goal

Goal Invariant:

### 最小完了条件

- B の closure を頼む人と判定する reviewer が、「L3 の項目に影響なし」を owner の裁定 TD-516 と同じ意味で読める文が merge-evidence にある。
- R0/R1 の lane で `--review-stage sync`（と `docs`）を試すと、helper が「R0/R1 の lane に review の record は無い」と本当の理由で止まる。
- manual の要る lane で `--review-stage sync` の 1 record が manual の A の引継ぎと sync の closure を同時に付ける流れを、test が直接確かめる。

### 失敗定義

- 書き足した文が、L3 の項目が観測する結果を変え得る変更（裏のロジックの変更）まで「影響なし」に読める（L3 の使い回しが緩む）。
- 書き足した文が、合否も観測する事柄も変わらない表示の値・文言の変化を「影響あり」に読ませ、TD-516 の裁定と食い違う。
- helper の分割で、R3/R4 の `--review-stage sync`・`docs` の今の受理・拒否が 1 つでも変わる。

### 非目的

- B の機械の条件（同期だけの条件・code に触れない条件）・A・C・docs の closure の条件を変えない。
- B の closure の本数（2 本）と owner の承認を変えない。
- `.local/` の発注の雛形は repo の外なので本 PR で変えない（手続きの道具の slimming で直す）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- `docs/agent-guidance/merge-evidence.md` の「manualの使い回し」の (B 承認) の文: 「L3の項目に影響なし」の直後に意味を 1〜2 文で書く。案: 「影響なしは、L3 の各項目の合格基準で確かめた結果（合否と、その基準が観測する事柄）が同期の前後で変わらないこと。項目が観測しない表示の値・文言・配置だけの変化は影響に数えず、合否や観測する事柄を変え得る処理（裏のロジック）の変更は影響ありとする（owner の裁定 TD-516、2026-10-28）。」
- `docs/decision-log.md` の D-144: TD-516 の裁定を 1 行（`- Clarified (2026-10-28):`）で足す。D-144 の Decision・Guarantee range の文は変えない。
- `scripts/pr-gate.py` の `record` の `--review-stage sync`・`docs` の入口の `require`（`'--review-stage sync takes only --outcome pass ...'` の文の箇所）を 2 つに分ける: 先に `req['minimum']` を見て、0 なら「R0/R1 の lane に review の record は無い（`--review-stage sync`・`docs` は review のある lane だけ）」の文で exit 2。引数の検査は今の文のまま。
- `scripts/tests/pr-gate.test.py` の `SyncRecords` に 2 test を足す（下の Test Plan）。

Non-scope: `docs/DEV_WORKFLOW.md` の L3 の表（B の行は merge-evidence を指すので文を複製しない）。`docs/templates/subagent-review-packet.md`（B の closure の問いの文を持たないことを `rg -n "影響なし|L3 の項目" docs/templates` で確かめた。出力 0 件）。

## Acceptance Criteria

- AC1: merge-evidence の (B 承認) の文に、TD-516 を引く意味の文がある。`rg -n "TD-516" docs/agent-guidance/merge-evidence.md docs/decision-log.md` が両 file で 1 件以上。
- AC2: `LOW`（R0、minimum 0、manual あり）の req で `record --kind review --review-stage sync --outcome pass`（引数は正しい形）が exit 2 の `GateError` で止まり、文に `R0/R1` を含み `takes only` を含まない。`docs` でも同じ。何も書かない（`writes == []`）。
- AC3: `REQ`（R3、manual・r4 あり）で docs だけの同期の後、`--review-stage sync` の 1 record が manual を `source_head`=旧 L3 の版で引き継ぎ、review の closure を `sync_from` の形で付け、r4 を pending にする。
- AC4: `python3 scripts/tests/pr-gate.test.py` が全 PASS。今の `test_sync_stage_*` を含め、既存の test を消さず弱めない。
- AC5: `bash scripts/doc-consistency-check.sh` と `--target plan` が ERROR なし。
- AC6: AC2 の test は分割を元に戻す mutation（`req['minimum']` を元の 1 つの `require` へ戻す）で red、AC3 の test は `carry_manual` を `kind == 'review'` で飛ばす mutation で red になることを実装の報告に書く。

## Design Readiness

- 引用する設計正本（節まで）: `docs/agent-guidance/merge-evidence.md` の「manualの使い回し」（MG-D13）、`docs/decision-log.md` D-144、`docs/DEV_WORKFLOW.md` L3 の表（B の行）。
- 必要な設計成果物: merge-evidence と D-144 を本 PR で直す（updated in this PR）。helper の分割は止めの文の変更で、契約（受理・拒否の集合）を変えない（existing sufficient）。
- plan にしかない durable な判断の昇格先: TD-516 の意味を merge-evidence（規則の文）と D-144（判断の記録）へ。
- 前提・制約と延期した design gap: 「観測する事柄」は L3 の各項目の合格基準が名指す事柄で、項目ごとの判定は B の closure の reviewer と owner が持つ（機械では判定しない。D-144 の Guarantee range のまま）。
- 絶対保証の例外と抜け道: 主張しない。B は今も reviewer 2 本と owner の承認で、機械の保証でない。
- 判定: ready。正本の該当節が 2 か所で、意味の追記と止めの文の分割に留まる。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3・非対象 |
|---|---|---|---|---|
| MG-D13（B の判定の意味） | merge-evidence「manualの使い回し」(B 承認) | merge-evidence の文、D-144 の Clarified の行 | 非対象（文の意味。B は reviewer と owner の判定で機械の検査が無い） | 非対象 |
| MG-D13（review の closure の `--review-stage sync`・`docs` の入口） | merge-evidence「reviewのclosure」「docs の closure」 | `pr-gate.py` の `record` の入口の `require` の分割 | `test_sync_stage_names_no_review_for_r0r1`（新規）、今の `test_sync_stage_*` | 非対象 |
| MG-D13（A の引継ぎと sync の closure の 1 record） | merge-evidence「manualの使い回し」(A 自動)・「reviewのclosure」 | 変更なし（今の挙動を test で固める） | `test_sync_stage_carries_manual_and_closure`（新規） | 非対象 |
| D-127（止めたときに理由を名指す） | AGENTS.md Working Rules「使い手に押しつけない」 | 同上の分割 | 同上（新規の 1 本目） | 非対象 |

## Test Plan

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| R0/R1 で sync・docs の stage を止める理由 | R0/R1 の lane で引数をいくら直しても `takes only --outcome pass` の文で止まり、原因（review が無い）へ辿れない | unit（`SyncRecords`、合成 repo） | `test_sync_stage_names_no_review_for_r0r1` | `req['minimum']` の検査を引数の検査と同じ `require` に戻す、または文から `R0/R1` を消す。何かを書いてから止める |
| R3/R4 の sync・docs の stage の今の受理・拒否 | 分割で R3/R4 の拒否（`--pass-model` 付き、`docs` の `--evidence` 無し）が受理に変わる | unit | 今の `test_sync_stage_*`（全 PASS のまま） | 分割で引数の検査が抜ける |
| manual の要る lane の sync の 1 record | `Gate.record` の分岐の並びが変わり、sync の closure だけが付いて manual の引継ぎが落ちる（または逆） | unit（`SyncRecords`、`req=REQ`・`stage='sync'`） | `test_sync_stage_carries_manual_and_closure` | `carry_manual` を `kind == 'review'` で飛ばす、`carry_manual` の呼出しを sync の closure の後ろで `record` を作り直す位置へ動かす、r4 を引き継ぐ |
