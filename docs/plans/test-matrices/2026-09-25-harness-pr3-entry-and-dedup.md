# Test Design Matrix: 入口と重複の整理（harness 改訂 PR3）

[Plan Packet](../2026-09-25-harness-pr3-entry-and-dedup.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-WF-HARNESS3-D1: npm 供給網ガードと問い合わせの行き先（PR 操作を含む）の正本は `AGENTS.md`。`CLAUDE.md` は Claude 固有の補助だけ。
- SPEC-WF-HARNESS3-D2: 入口に廃止済みの仕組み（Evidence Mode、legacy、state-only、三点一致、exact-HEAD 証拠、撤去済みの Phase 名）の指示が無い。
- SPEC-WF-HARNESS3-D3 / D4: 薄い wrapper と `pr-review-prompt` の削除、live な参照が残らない。review の依頼形式・重大度・出力形式は `docs/code_review.md`。
- SPEC-WF-HARNESS3-D5: 保守者観点（P2）と店の事実の照合、review-checklist の件数上限の撤去。
- SPEC-WF-HARNESS3-D6: project-profile の縮約。
- SPEC-WF-HARNESS3-D7: drift test と T12 / T13 の要求先。
- SPEC-WF-HARNESS3-D8: review の最短経路。
- SPEC-WF-HARNESS3-D9: PR2 との境界・merge 順・helper の前提（test ではなく AC11〜AC13 の記録）。
- 保護する隣接契約: Session Start の R2+ 経路と fail-closed（D-034）、canonical 読書順の再掲禁止（D-034）、直接 UI merge 禁止と残存リスク（D-085）、history-view の旧 path・旧 namespace の拒否（T12）、hook inventory 0 本（D-059）、link 検査（doc check R3）、PK1〜PK6、review-checklist の 9 カテゴリ（DS2 / DS4）。

## Failure Modes

- F1: npm ガードや行き先を `CLAUDE.md` から消したが `AGENTS.md` に移し損ねる（Codex にも Claude にも届かない）。
- F2: 入口のどこかに Evidence Mode・legacy の手順や撤去済みの Phase 名が残る。
- F3: 削除した file を指す markdown link・Skill 名・command 名が live な文書に残る（link 検査が落ちる、または名前だけの参照が黙って死ぬ）。
- F4: test の要求を緩めすぎ、`AGENTS.md` か `docs/DEV_WORKFLOW.md` から直接 UI merge 禁止の文が消えても通る。
- F5: Session Start の書き換えで R2+ 経路・`完全`・`Workflow State`・`fail-closed` が消え、check_entry_contract が落ちる、または初回レビュー行の追記が canonical 読書順の再掲（DRIFT_PATTERN）になる。
- F6: T13 から `CLAUDE.md` を外した巻き添えで、T12 の旧 namespace の拒否まで `CLAUDE.md` に効かなくなる。
- F7: `pr-review-prompt` の固有部分（外部 reviewer に渡す PR context、non-scope で block しない）が code_review に移らない。
- F8: review-checklist の運用ルールの書き換えで 9 カテゴリの見出しが崩れ、DS2 / DS4 が WARN を出す。
- F9: project-profile の縮約で、他の正本に無い固有の情報（High-risk の R3 例など）を消す。
- F10: PR2 の所有 file（MANUAL、subagent-review-packet、agent-guidance、DEV_WORKFLOW）へ差分が出る、または PR2 より先に merge して `#座組` が無い見出しを指す。

## Test Matrix

- 引用する既存 test は base `8bd2bc9a` で `rg` と実行により実在を確認した（`scripts/tests/reading-order-drift.test.sh`、`codex-safe-wrappers.test.sh`、`claude-hooks.test.sh`、`classify-changes.test.sh`、`run-workflow-tests.sh`、doc check の link 検査 `check_markdown_link_targets`）。
- 文書の契約は `rg` の AC で検査する（packet の AC1〜AC11）。test script は既存の 2 本の要求を書き換えるだけで、新しい test file を足さない。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D7 | F4 | regression（既存 test の書き換え） | T-D1: `reading-order-drift.test.sh` の `for path in AGENTS.md docs/DEV_WORKFLOW.md` loop（`:158` の置換）が green | loop から `docs/DEV_WORKFLOW.md` か `AGENTS.md` を誤って外す（T-D1m で検出） |
| D7 | F4 | mutation（写し） | T-D1m: 写しの `AGENTS.md`、次に写しの `docs/DEV_WORKFLOW.md` から `直接UI merge` を含む行を消すと、それぞれ `FAIL: helper-only merge boundary missing: <file>` で exit 1。`残存リスク` の行でも同じ | 要求先が 1 file に減る、または rg の語が変わって検出しない |
| D7 | F4（緩めた側） | mutation（写し） | T-D1r: 写しの `CLAUDE.md` と `.github/pull_request_template.md` から同じ語を消しても exit 0。`.agents/skills/*/SKILL.md` に `Evidence Mode` が無くても exit 0 | 要求の撤去が不完全で、S2 / S5 / S9 の後に test が落ちる |
| D8 / D2 | F5 | regression（既存） | T-D2: check_entry_contract（`:64-79`）が書き換え後の `AGENTS.md` を受理し、既存の mutation（`:86-93`、R2+ 行の削除・`fail-closed` の削除）が引き続き拒否される | S1 の書き換えで R2+ 行の語（`R2+`・`実装`/`再開`・`Workflow State`・`完全`）か `fail-closed` を落とす |
| D8 | F5 | regression（既存） | T-D3: DRIFT_PATTERN の実 repo 検査（`:150-153`）が violation 0。`AGENTS.md` は除外対象だが、S6 / S8 / S10 で書き換える code_review・review-checklist・project-profile は対象 | 書き換えで `AGENTS → DEV_WORKFLOW → Plans → project-memory` の順の近接列挙を作る |
| D7 | F6 | regression（既存 test の書き換え） | T-W1: `codex-safe-wrappers.test.sh` の T13 から `CLAUDE.md` を外した後も exit 0（T13 の DEV_SETUP 側は残る） | S2 で namespace を消したのに T13 が `CLAUDE.md` を要求し続ける |
| D7 | F6 | mutation（写し） | T-W1m: 写しの `CLAUDE.md` に `-home-kosei-Projects-inventory-system/` を足すと `FAIL: T12 live B-group file still contains the history-view encoded namespace` で exit 1。`/home/kosei/Projects/inventory-system/` を足すと T12 の旧 path の FAIL | T13 の変更の巻き添えで T12 の `live_files` から `CLAUDE.md` を外す |
| D3 / D4 | F3 | CLI（doc check） | T-L1: `bash scripts/doc-consistency-check.sh` の R3（markdown link の実在）が ERROR 0。S7 の着手条件（MANUAL `:124` の link が origin/main で消えている）を満たした HEAD で実行する | 削除した file を markdown link で指す行が残る（base では MANUAL `:124` が該当） |
| D3 / D4 | F3 | CLI（rg） | T-L2: packet の「削除する file と参照元」の command の一致が `scripts/tests/classify-changes.test.sh:46` の 1 行だけ（AC2） | Skill 名・command 名だけの参照（link でないため T-L1 が拾わない）が残る |
| D3 | F3 | regression（既存） | T-L3: `classify-changes.test.sh` が exit 0（`:46` の `.claude/rules/commands.md` は path の文字列で、file の実在を要求しない） | classifier の test が削除した file の実在に依存していた |
| D3 | F3 | regression（既存） | T-L4: `claude-hooks.test.sh` が exit 0（`.claude/commands/plan-rally.md` を写し、`CLAUDE.md` の禁止語を検査する。S4 は plan-rally を削除しない） | plan-rally を誤って削除する、または `CLAUDE.md` に禁止語（`hook pass` 等）が入る |
| D1 | F1 | CLI（rg） | T-A1: AC3（npm ガードの 4 語が `AGENTS.md` に 4、`CLAUDE.md` に 0）と AC5（行き先の 7 語が `AGENTS.md` の Decision and Approval Boundaries にある） | 移す途中で項目を落とす、または `CLAUDE.md` に残して重複させる |
| D2 | F2 | CLI（rg） | T-A2: AC1 の command が 0 行 | 定型文や legacy の文が 1 箇所でも残る |
| D4 / D5 | F7 | CLI（rg） | T-A3: AC8（`保守者`、`現場の前提`、`non-scope`、`Branch|Commit` が code_review にある） | pr-review-prompt の固有部分や K13 / K14 を移し損ねる |
| D5 | F8 | CLI（rg + doc check） | T-A4: AC9（件数上限と新規観点禁止の文が 0、`Findings Freeze` と `AGENTS.md` への参照がある、`### N.` 見出しが 9、DS2 / DS4 に新しい WARN なし） | 運用ルールの書き換えで 9 カテゴリの見出しを崩す |
| D6 | F9 | CLI（rg） | T-A5: AC10（削除する 6 見出しが 0、残す 8 見出しが 8、High-risk の `Test/workflow gates` 行が残る） | 残すべき節を消す |
| D9 | F10 | CLI（git diff） | T-B1: AC13（PR2 の所有 file・helper・checker・CI 定義に本 PR 由来の差分が無い）と AC11（merge 直前の HEAD で `^## 座組` が 1 行、MANUAL に `pr-review-prompt` が 0 行） | 所有を重ねる、または PR2 より先に merge する |
| 全体 | 全体 | integration | T-I1: `bash scripts/tests/run-workflow-tests.sh` と `bash scripts/local-ci.sh full` が exit 0 | 上の個別 test の外で workflow suite が落ちる |

## State Lifecycle Matrix

not applicable: UI・data・cache・route・import / export・retry の状態を持たない。workflow state（Phase・Plan Commit・helper の record）の扱いも変えない。merge 順と capture の前提は packet の「PR2 との境界と merge 順」「helper と PK5 の前提」が持つ。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| Evidence Mode の定型文（B7、PR #54 で配布） | `rg -n 'Evidence Mode\|legacy\|三点一致\|state-only\|exact-HEAD'` を repo 全体（archive・decision-log・plans を除く）で実行 | AGENTS `:14`・`:27`、CLAUDE `:11`、`.claude/rules` 3、`.claude/commands` 5、Skill 5（うち 2 本は削除）、code_review `:36`、project-profile `:166`・`:236`、PR template `:18`・`:32`、HANDOFF `:17` | `docs/templates/subagent-review-packet.md:26`・`docs/agent-guidance/README.md:8`・`shared.md:9`（PR2）、`docs/templates/plan-packet.md:259`・`test-design-matrix.md:101`・`workflow-effectiveness-review.md:78`（PR4）、`docs/DEV_WORKFLOW.md` と `merge-evidence.md` の廃止を述べる文（PR1 の AC6 で残した記述） | AC1 |
| 直接 UI merge 禁止と残存リスクの文（D-085） | `rg -n '直接UI merge\|残存リスク'`（AGENTS `:27`、CLAUDE `:11`、DEV_WORKFLOW Workflow State、PR template `:32`、ci.md） | AGENTS と DEV_WORKFLOW に残す（test の要求先） | CLAUDE・PR template から消す（重複）。ci.md は変えない（ci-workflow test の対象） | T-D1、T-D1m、T-D1r |
| 削除する file への参照 | 「削除する file と参照元」の rg（hidden を含む repo 全体） | inventory-workflow-start `:20`、TOOLING `:58-60,65-66,79,83,163,165`、reading-order-drift `:162`、MANUAL `:124`（PR2） | `classify-changes.test.sh:46`（path の文字列）、`docs/archive/**` と decision-log（履歴） | T-L1〜T-L4、AC2 |
| MANUAL 内の anchor を指す link | `rg -n 'AGENT_OPERATING_MANUAL.md#'` | inventory-workflow-start `:13` を anchor なしへ。CLAUDE・AGENTS は `#座組` を新設 | DEV_WORKFLOW 内の MANUAL への anchor link（PR2 / PR4 の所有）。link 検査は anchor を見ないため、見出しの変更で黙って死ぬ link の追従は所有者が行う | AC11 |
| `CLAUDE.md` の見出しを指す link | `rg -n 'CLAUDE.md#'` | なし（本 PR の file には無い） | `docs/agent-guidance/model-notes.md:9` の `#sonnet--opus-の-effort`（PR2 が座組表へ向ける。packet の「PR2 に求めること」） | Plan Review で PR2 packet と照合 |
| PR 操作の承認境界（K12） | AGENTS `:45`、review-checklist `:10-11`、inventory-code-review `:83-97` | review-checklist と inventory-code-review は AGENTS を参照する 1 文へ | inventory-code-review の投稿手順（API の使い方）は境界ではなく手順なので残す | AC5、AC9 |
| hook inventory 0 本の記述（N3） | CLAUDE `:13`、project-profile `:237`、MANUAL §6.1 | project-profile から消す | CLAUDE の 1 行は Claude への指示として残す、MANUAL は PR2 | T-L4 |

## Negative Paths

- missing input: 入口から npm ガードの節が消える → T-A1。R2+ 行・fail-closed が消える → T-D2。
- invalid input: `CLAUDE.md` に history-view の旧 namespace / 旧 path が入る → T-W1m。
- duplicate/ambiguous input: 同じ規則が `CLAUDE.md` と `AGENTS.md` の両方に残る → T-A1（`CLAUDE.md` 側 0）。問い合わせの行き先が DEV_WORKFLOW の表と並存する期間は Non-scope（注記 (b) で AGENTS が上位）。
- unknown reference: 削除した file への link・名前 → T-L1、T-L2。
- dependency missing: PR2 が未 merge で MANUAL `:124` の link が残る → S7 の着手条件で削除を止める（T-L1 は条件を満たした HEAD で実行）。
- permission/write failure: `.claude/skills` は sandbox で書込み不可 → Scope に入れない（削除する Skill に symlink が無いことを確認済み）。
- dry-run side effect: mutation は `$TMPDIR` の写しでだけ行い、本 repo の tracked file・index・git 設定を変えない。

## Boundary Checks

- threshold: 直接 UI merge 禁止を要求する file の数（4 → 2）。T-D1m が下限の 2 を守る。
- null/default: 該当なし。
- empty/non-empty: T13 の `namespace_files` が空になる場合は loop ごと消し、空配列の展開で `set -u` に当たらないようにする（Writer が実行で確認）。
- min/max: review-checklist の件数上限（最大 3 件）を撤去 → T-A4。
- status/policy enum: 該当なし（Phase・Risk・Human Gate の enum を変えない）。
- wire type / internal type / producer/consumer / round-trip token / precision/range / cross-language parse: 該当なし。

## Compatibility Checks

- old schema/input: 本 PR の前に起票された active packet（EJ parser core、PR2）は本 PR の文書変更の影響を受けない（checker・helper を変えない）。
- new schema/input: PR template から `Evidence Mode` 行が消えても、helper は PR 本文を読まないため merge 手順は変わらない（`scripts/pr-gate.py` を変えない、AC13）。
- output order: 該当なし。
- optional field behavior: 該当なし。

## Data Safety Checks

- source-derived data: 含まない。
- generated outputs: 含まない（bindings・routeTree・traceability を再生成しない）。
- secrets: 含まない。`.env*`・鍵を読まない。
- local-only files: mutation の写しは `$TMPDIR` に置き、終わったら消す。`.local/` の発注書は tracked にしない。
- synthetic sample boundaries: 該当なし。

## Main Wiring / Integration Checks

- helper connected to main path: `scripts/tests/run-workflow-tests.sh` が reading-order-drift・codex-safe-wrappers・claude-hooks・classify-changes を実行し、`scripts/local-ci.sh full` と hosted CI の workflow job がそれを呼ぶ（本 PR は wiring を変えない）→ T-I1。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: Claude Code が `.claude/rules/*` と `.claude/commands/*` を読み込む。削除後は該当する rule・slash command が消えるだけで、settings は変えない。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- If a key branch is inverted, which test fails?: reading-order-drift の要求 loop を `AGENTS.md` だけにすると T-D1m の `docs/DEV_WORKFLOW.md` 側が通ってしまう → T-D1m は 2 file それぞれで red を確認する。
- If a guard is removed, which test fails?: T12 の `live_files` から `CLAUDE.md` を外すと T-W1m が通ってしまう → T-W1m で red を確認する。check_entry_contract を弱めると既存の mutation（`:86-93`）が落ちる。
- If an output field is omitted, which test fails?: npm ガードの 4 項目のどれかを移し損ねると AC3 の件数が 4 未満になる（T-A1）。行き先の語のどれかを落とすと AC5（T-A1）。
- If a mock value is changed so it differs from the design-doc expected value / If invalidate/refetch changes the value / If a threshold comparison changes / If tracked Workflow State stores the current PR HEAD / If output order changes / If dry-run performs a side effect / If a JSON number crosses JavaScript safe integer range / If a state token is round-tripped: 該当なし（mock・lifecycle・数値比較・Workflow State の保存形式・出力順・JSON・状態 token を扱わない）。

## Residual Test Gaps

- 入口を読んだ model が実際に正しく振る舞うか（review の最短経路で読む量が減るか、行き先どおりに問い合わせるか）は機械検査しない。未実測。
- `#座組` を含む anchor は link 検査が見ない。PR2 との整合は Plan Review と AC11 の rg で確かめる。
- DEV_WORKFLOW の問い合わせの行き先の表と AGENTS の並存期間の食い違いは、PR4 が表を link にするまで review で確かめる。
