# Test Design Matrix: 座組と役割の書き直し（ハーネス刷新 PR2、R2）

Plan Packet: [2026-09-25-harness-pr2-roles-and-formation.md](../2026-09-25-harness-pr2-roles-and-formation.md)。文書だけの変更で、検査は `rg` / `find` / `git diff` と既存の checker・workflow test。新しい test は足さない（packet 非目的）。行番号は `origin/main` `8bd2bc9a` のもの。

## Risk

Risk: R2

## Contracts Under Test

- C1 座組は `docs/AGENT_OPERATING_MANUAL.md` の `## 座組` 1 か所にあり、owner 決定 2026-09-23 / 24 / 25 と一致する（packet S1）。
- C2 独立性の既存 5 項目と、fresh 非 fork・後の reviewer に先の結果を見せない・Writer が Codex の場合の Plan Reviewer の 3 項目が MANUAL `## 独立性` にある（S1）。
- C3 退役した仕組みを指示する文が本 PR の所有 file に残らない（S1〜S4、AC2 / AC3 / AC7）。
- C4 残す安全境界と文字列契約（one-shot irreversible / task-shape、hook 0 本、Subagent Budget の 5 項目、`## Subagent Budget` と `## Effort の選定` の見出し）が保たれる（S1〜S3）。
- C5 agent-guidance は README / model-notes / merge-evidence / evals だけになり、link が切れない（S3）。
- C6 review packet に §5.4 の発注の型と、後の reviewer に読ませないものが入り、legacy の文が消える（S4）。
- C7 decision-log D-092 が追記だけで、退役・部分退役・PR1 撤去済み・維持を列挙する（S5）。
- C8 本 PR は PR3 / PR4 / PR5 の所有 file と、DEV_WORKFLOW の S2 以外の行に触れない（所有表、AC9）。

## Failure Modes

- F1 座組・effort の記述が MANUAL 以外（model-notes、README、DEV_WORKFLOW）にも残り、2 か所が食い違う。
- F2 書き直しで独立性・Human Gate・depth 1・one-writer などの安全境界が落ちる。
- F3 MANUAL の書き直しで `one-shot irreversible` / `task-shape` が消え、`doc-consistency-plan-packet.test.sh:842-843` が落ちる。
- F4 hook の節を縮める過程で `claude-hooks.test.sh:39-46` の禁止句が入る。
- F5 `shared.md` / profiles の削除で link が切れる、または `docs/agent-guidance/README.md` まで消して `AGENTS.md:21` の名指しと MANUAL の link が切れる。
- F6 見出しの改名で DEV_WORKFLOW の anchor（`:68`・`:280`・`:286`）が古いまま残る（link 検査は anchor を見ない）。
- F7 独立性の規則が「packet と PR body」だけを挙げ、PR の comment / review 経由で先の結果が見えてしまう。
- F8 D-092 が既存 entry を書き換える、または PR1 が送った superseded の列挙を落とす。
- F9 PR3 の所有 file（AGENTS / CLAUDE / `.claude` / `.agents` / code_review / pr-review-prompt）や PR4 の所有行を編集する。

## Test Matrix

- 既存 test を回帰の根拠にする前に、その test が実在し対象の文字列を検査していることを `rg` で確認した（`doc-consistency-plan-packet.test.sh:842-843`、`claude-hooks.test.sh:30-54`、`run-workflow-tests.sh` が両方を呼ぶ）。
- link 検査の範囲と anchor の扱いは packet の Contract Probe P1 / P2 で実測した。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | F1 | CLI | T-F1: AC1 `rg -c '^## 座組$' docs/AGENT_OPERATING_MANUAL.md` → 1、AC2 の `Sonnet|Opus 5（|Fable 5（|GPT-5\.6|Sol 5\.6` が 0 | `## 座組` が無い・2 つある、旧 slot 表や旧 model 名が残る |
| C1 | F1 | review | T-F2: 座組表の各行を owner 決定（packet 冒頭の出典）と突き合わせ、`rg -n 'effort' docs/agent-guidance/model-notes.md docs/agent-guidance/README.md docs/DEV_WORKFLOW.md` の各行が Claude 側の effort を独自に定めず `#座組` を参照していることを確認 | Codex 停止中の扱い・Fable の位置付け・effort が決定と違う、または座組が 2 か所に書かれる |
| C2 | F2 / F7 | CLI + review | T-I1: AC4 `rg -c '先の reviewer'` が MANUAL と review packet で 1 以上。MANUAL `## 独立性` に既存 5 項目・fork・後の reviewer・Writer が Codex の場合の 4 種が揃う | 独立性の項目が欠ける、読ませない対象から PR の comment / review が落ちる |
| C3 | — | CLI | T-R1: AC2（baseline 38 → 0）、AC3 前半（baseline 5 → 0）、AC7 前半（baseline 1 → 0） | Execution Mode・D-056・§5.5・§5.7・Astra 主担当・Subagent Budget の数値・D-062(c) の codex-only 句・legacy の文が残る |
| C4 | F3 | test | T-S1: `bash scripts/tests/doc-consistency-plan-packet.test.sh`（`:842-843`） | MANUAL から `one-shot irreversible` か `task-shape` が消える |
| C4 | F4 | test | T-S2: `bash scripts/tests/claude-hooks.test.sh` | MANUAL に禁止句が入る、hook inventory の記述と settings がずれる |
| C4 | F2 | CLI | T-S3: AC3 後半（Subagent Budget の 5 項目 = 5、`## Subagent Budget` = 1）、AC6 `## Effort の選定` = 1 | depth 1・one-writer・出力契約・load-bearing・P3-only のどれかが消える、見出しの改名で PR3 所有の `.claude/commands/plan-rally.md:8` と evals の anchor が古くなる |
| C5 | F5 | CLI + checker | T-G1: AC6 の `find`（4 行）と `bash scripts/doc-consistency-check.sh` の Markdown link 検査 | `shared.md` / profiles が残る、README まで消える、削除した file への link が `docs/` に残る |
| C5 / C4 | F6 | review | T-G2: AC8 の anchor と新 MANUAL の見出しの突合 | DEV_WORKFLOW の anchor が旧見出しを指したまま |
| C6 | — | CLI + review | T-P1: AC7 後半 `## 発注の型` = 1、5 項目と `## Target` の「読ませないもの」を確認 | §5.4 の中身が落ちる、Opus 専用の扱いや §5.5 の例外が残る |
| C7 | F8 | CLI | T-L1: AC5（見出し 1、5 件の全面 superseded、`git diff` の削除行 0） | D-092 が無い、既存 entry の行を書き換える、D-056 等の列挙が欠ける |
| C7 | F8 | review | T-L2: PR1 archive packet の Non-scope が挙げた D（D-034 / D-035 / D-038(8) / D-046-3 / D-049 / D-055・D-074 / D-084 / D-085 MG-D10・D11）が D-092 に全部ある | PR1 が送った列挙を落とす |
| C8 | F9 | CLI + review | T-B1: AC9 の `git diff --stat`（空）と DEV_WORKFLOW の hunk 位置 | 他 PR の所有 file・行を編集する |
| 全体 | — | CLI | T-C1: AC11 の 5 command が exit 0 | checker・workflow suite・PK4 / PK5 のどれかが落ちる |

## State Lifecycle Matrix

not applicable: UI・data・cache・route・永続 state を持たない文書変更。workflow の状態遷移（Workflow State・helper）の定義と検査は変えない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 座組・model・effort の記述 | `rg -n 'effort|Sonnet|Fable|Astra|Sol' docs/AGENT_OPERATING_MANUAL.md docs/DEV_WORKFLOW.md docs/agent-guidance CLAUDE.md AGENTS.md`（監査 §5 の「座組・model・effort」行） | MANUAL `## 座組`、model-notes（Codex 固有だけ）、DEV_WORKFLOW `:215` の削除 | `CLAUDE.md` の effort 節（PR3 が `#座組` 参照へ）、archive / decision-log（履歴） | T-F1 / T-F2 |
| MANUAL の anchor を指す link | `rg -o 'AGENT_OPERATING_MANUAL\.md#[^) ]+' --hidden -g '!.git/**' -g '!docs/archive/**' -g '!docs/decision-log.md' .` = DEV_WORKFLOW `:68,215,286` と `.agents/skills/inventory-workflow-start/SKILL.md:13` | DEV_WORKFLOW `:68`・`:286`（`:215` は削除）、`:280` の section 名指し | Skill `:13`（PR3 の所有、packet の所有表） | T-G2 |
| agent-guidance の file を指す参照 | `rg -n 'agent-guidance/(README|shared|profiles|model-notes)|profiles/|shared\.md|model-notes\.md' --hidden -g '!.git/**' -g '!docs/archive/**'` | MANUAL の旧 `:90` / `:97` / `:103` / `:119`（書き直しで消える）、README の索引 | `AGENTS.md:21`（README を残すので有効）、`.codex/README.md:86`（model-notes を残すので有効）、`scripts/tests/classify-changes.test.sh:46`（classifier の glob 判定に使う path の文字列で、file の実在を要しない）、decision-log（履歴） | T-G1 |
| `independent-review`（撤去済み Phase 名） | `rg -n 'independent-review' --hidden -g '!.git/**' -g '!docs/archive/**'` = MANUAL `:22`、template `:196`、test の旧 Phase 負例 2 件、backlog、decision-log | MANUAL `:22` | template `:196`（PR4）、`scripts/tests/*` の負例（旧値を拒否する検査の入力）、decision-log（履歴） | T-R1 |
| `Subagent Budget` の名指し | `rg -n 'Subagent Budget'` = DEV_WORKFLOW の見出し、MANUAL `:21` / `:210` / `:274`、`.claude/commands/plan-rally.md:8`、decision-log | 見出しを保ち、MANUAL は書き直しで参照を 1 か所（`## 役割` の Writer）に | plan-rally（PR3） | T-S3 |

## Negative Paths

- missing input: `## 座組` が無い → T-F1 が 0 を返す。
- invalid input: 旧 model 名（Sonnet 5 / Opus 5 / Fable 5 / GPT-5.6）が残る → AC2 が 0 でない。
- duplicate/ambiguous input: 座組や effort の規則が MANUAL 以外にもある → T-F2（review）。
- unknown reference: 削除した file への link → link 検査の ERROR（Contract Probe P1 で実測）。
- dependency missing: not applicable（依存の追加なし）。
- permission/write failure: not applicable。
- dry-run side effect: not applicable。

## Boundary Checks

- threshold: AC10 の 100 行 / 15,000 bytes は上限の確認で、目標値（60 行 / 6KB）は `未実測` の目安。
- producer/consumer: MANUAL の見出し（producer）と、それを anchor で指す DEV_WORKFLOW・PR3 の CLAUDE.md・Skill（consumer）。固定 anchor は `#座組`。
- その他の項目（null・wire・precision 等）: not applicable（文書変更）。

## Compatibility Checks

- old schema/input: 並走 lane の active packet（`docs/plans/2026-09-23-ej-parser-core.md`）の Workflow State は旧 2 行（`Evidence Mode` / `Execution Mode`）を持つ。本 PR は checker を変えないので、`--target plan` の結果は変わらない（T-C1）。
- new schema/input: 本 packet は `Evidence Mode` / `Execution Mode` 行を持たない（PR1 後の template）。
- output order: not applicable。
- optional field behavior: not applicable。

## Data Safety Checks

- source-derived data / generated outputs / secrets / local-only files: なし。監査報告（`.local/reports/`）と公式資料の取得版は local-only のまま参照し、tracked に写さない（URL と節名だけを書く）。
- synthetic sample boundaries: not applicable。

## Main Wiring / Integration Checks

- policy docs の変更で classifier が `workflow=true` を返し、hosted で `run-workflow-tests.sh` が走る（本 PR は classifier を変えない。T-C1 を local で先に実行する）。
- helper が Final Review Minimum 2 を要求し、本 packet の `Final Review Minimum: 2` と一致する。

## Mutation-style Adequacy Questions

実注入は Writer の作業 worktree で行い、確認後に戻す（tracked の成果物に残さない）。

- M1 新 MANUAL から `one-shot irreversible` を消す → `bash scripts/tests/doc-consistency-plan-packet.test.sh` が red になるか。
- M2 新 MANUAL に `hook pass` を 1 行入れる → `bash scripts/tests/claude-hooks.test.sh` が red になるか。
- M3 `docs/agent-guidance/README.md` を消す → `bash scripts/doc-consistency-check.sh` が link の ERROR を出すか（起票時に現行 MANUAL の link で実測済み: Contract Probe P1。書き直し後の MANUAL にも README への link を 1 つ置く場合に再確認する）。
- M4 AC2 の pattern の 1 語（例: `codex-only`）を新 MANUAL に戻す → AC2 が 0 でなくなるか（検査式の検出力の確認）。

## Residual Test Gaps

- anchor の食い違いは機械で検査されない（Contract Probe P2）。AC8 / T-G2 の review に頼る。恒久の検査の追加は非目的。
- 座組表が owner 決定と一致することと、独立性の規則の実効性は文書の review でしか確かめられない。規則が守られたかは次の Final Review の発注（本 PR 自身を含む）で観測する。
- model が改訂後の文書で正しく判断するか、token の削減量は `未実測`（監査 §10）。
