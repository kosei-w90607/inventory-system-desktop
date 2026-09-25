# Test Design Matrix: 座組と役割の書き直し（ハーネス刷新 PR2、R3）

Plan Packet: [2026-09-25-harness-pr2-roles-and-formation.md](../2026-09-25-harness-pr2-roles-and-formation.md)。文書だけの変更で、検査は `rg` / `find` / `git diff` と既存の checker・workflow test。新しい test は足さない（packet 非目的）。行番号は base `85b18a04` のもの。

## Risk

Risk: R3

## Contracts Under Test

- C1 座組と effort の値は `docs/AGENT_OPERATING_MANUAL.md` の `## 座組` 1 か所にあり、owner 決定 2026-09-07 / 08・14・23 / 24 / 25 と一致する。model-notes は値を持たず、DEV_WORKFLOW `:83` は model 名が座組表にも現れるとする（packet S1〜S3、SPEC-WF-HARNESS2-D1 / D6）。
- C2 独立性の既存 5 項目と、fresh 非 fork・後の reviewer に先の結果を見せない（置かれた場所すべて、後の発注の本文を含む）・Writer が Codex の場合の Plan Reviewer の 3 項目が MANUAL `## 独立性` にある（S1、D2）。
- C3 退役した仕組みを指示する文が本 PR の所有範囲（template `:34`・`:125` を含む）に残らない（S1〜S4、S7、AC2 / AC3 / AC7、D3）。
- C4 残す安全境界と文字列契約（Contract Coverage Ledger の各行: one-shot irreversible / task-shape と不可逆 mutation の直前の owner 判断、hook 0 本と advisory hook の推定禁止、Writer が編集前に止まったときの番号付き手順 1〜3、Subagent Budget の 5 項目、`## Subagent Budget` と `## Effort の選定` の見出し）が保たれる（S1〜S3、D4）。
- C5 agent-guidance は README / model-notes / merge-evidence / evals だけになり、archive を含む `docs/` の link が切れない（S3）。
- C6 review packet は発注の入力欄（`## 発注の型`）と後の reviewer に読ませないものを持ち、出力の規範は `docs/code_review.md` を参照し、legacy の文が消える（S4、D5）。
- C7 decision-log D-092 が追記だけで、退役・部分退役・PR1 撤去済み・維持を列挙する（S5）。
- C8 本 PR は PR3 / PR4 / PR5 の所有 file と、DEV_WORKFLOW の S2 以外の行に触れない。例外は template `:34`・`:125` と archive `2026-09-13-harness-context-efficiency.md:88` の 1 行だけ（所有表、AC9、D7）。

## Failure Modes

- F1 座組・effort の記述や effort の値が MANUAL 以外（model-notes、README、DEV_WORKFLOW）にも残り、2 か所が食い違う。
- F2 書き直しで独立性・Human Gate・depth 1・one-writer などの安全境界が落ちる。
- F3 MANUAL の書き直しで `one-shot irreversible` / `task-shape` が消え、`doc-consistency-plan-packet.test.sh:842-843` が落ちる。
- F4 hook の節を縮める過程で `claude-hooks.test.sh:39-46` の禁止句が入る。
- F5 `shared.md` / profiles の削除で link が切れる（archive `2026-09-13-harness-context-efficiency.md:88` を含む）、または `docs/agent-guidance/README.md` まで消して `AGENTS.md:21` の名指しと MANUAL の link が切れる。
- F6 見出しの改名で DEV_WORKFLOW の anchor（`:68`・`:280`・`:286`）が古いまま残る（link 検査は anchor を見ない）。
- F7 独立性の規則が一部の置き場所だけを挙げ、PR の comment / review、local の報告 file、後の発注の本文を経由して先の結果が見えてしまう。
- F8 D-092 が既存 entry を書き換える、または PR1 が送った superseded の列挙を落とす。
- F9 PR3 の所有 file（AGENTS / CLAUDE / `.claude` / `.agents` / code_review / pr-review-prompt）や PR4 の所有行を編集する、または template・archive の例外の範囲を越える。
- F10 one-shot irreversible の縮約で「不可逆 mutation の直前に owner の判断を得る」が落ち、owner が session にいるだけで不可逆 mutation に進める。
- F11 `## Writer への依頼` が停止時の手順を番号なしに畳み、DEV_WORKFLOW `:286` の「2〜3」が存在しない項番を指す。
- F12 review packet に出力の書式・重大度が残り、`docs/code_review.md` と 2 か所の規範になる。

## Test Matrix

- 既存 test を回帰の根拠にする前に、その test が実在し対象の文字列を検査していることを `rg` で確認した（`doc-consistency-plan-packet.test.sh:842-843`、`claude-hooks.test.sh:30-54`、`run-workflow-tests.sh` が両方を呼ぶ）。
- link 検査の範囲（`docs/archive/**` を含む）と anchor の扱いは packet の Contract Probe P1 / P2 で実測した。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | F1 | CLI | T-F1: AC1 `rg -c '^## 座組$' docs/AGENT_OPERATING_MANUAL.md` → 1、AC2 の `Sonnet|Opus 5（|Fable 5（|GPT-5\.6|Sol 5\.6` が 0、AC12 の model-notes の `\b(medium|high|xhigh)\b` が 0、AC3 の `never in normative rules` が 0 | `## 座組` が無い・2 つある、旧 slot 表や旧 model 名が残る、model-notes に effort の値が残る、DEV_WORKFLOW `:83` が座組表と矛盾したまま |
| C1 | F1 | review | T-F2: 座組表の各行を owner 決定（packet 冒頭の出典）と突き合わせ、`rg -n 'effort' docs/agent-guidance/model-notes.md docs/agent-guidance/README.md docs/DEV_WORKFLOW.md` の各行が effort の値（Claude 側・Codex 側とも）を定めず `#座組` を参照していることを確認。Final Reviewer の Claude 側（R3 以上と design lane は Fable 5.1、closure の既定 Fable 5.1）、Codex の合否を外さない注記、実効 model の記録、相談役が使えないときの扱い、effort 列の実効値の注記を確認 | Codex 停止中の扱い・Fable の位置付け・effort が決定と違う、または座組が 2 か所に書かれる |
| C2 | F2 / F7 | CLI + review | T-I1: AC4 `rg -c '先の reviewer'` が MANUAL と review packet で 1 以上。MANUAL `## 独立性` に既存 5 項目・fork・後の reviewer・Writer が Codex の場合の 4 種が揃い、読ませない場所が「置かれた場所すべて」と例示 4 種（local の報告 file を含む）、後の発注の本文の禁止（closure・是正の発注は除く）を含む | 独立性の項目が欠ける、読ませない場所から PR の comment / review や local の報告 file が落ちる、後の発注の本文に先の結果由来の観点が書ける |
| C3 | — | CLI | T-R1: AC2（baseline 38 → 0）、AC3 前半（baseline 5 → 0）、AC7 前半（baseline 1 → 0） | Execution Mode・D-056・§5.5・§5.7・Astra 主担当・Subagent Budget の数値・D-062(c) の codex-only 句・legacy の文が残る |
| C3 | — | CLI + review | T-L1: `rg -n '§5\.5' docs/templates/plan-packet.md` が 0 行（baseline 2 行: `:34`・`:125`）、`git diff -U0 origin/main...HEAD -- docs/templates/plan-packet.md` の hunk が `:34`・`:125` の中だけ | template が §5.5 の手順を指示し続ける、または template の他の行（PR4）を編集する |
| C4 | F3 | test | T-S1: `bash scripts/tests/doc-consistency-plan-packet.test.sh`（`:842-843`） | MANUAL から `one-shot irreversible` か `task-shape` が消える |
| C4 | F4 | test | T-S2: `bash scripts/tests/claude-hooks.test.sh` | MANUAL に禁止句が入る、hook inventory の記述と settings がずれる |
| C4 | F2 | CLI | T-S3: AC3 後半（Subagent Budget の 5 項目 = 5、`## Subagent Budget` = 1）、AC6 `## Effort の選定` = 1 | depth 1・one-writer・出力契約・load-bearing・P3-only のどれかが消える、見出しの改名で PR3 所有の `.claude/commands/plan-rally.md:8` と evals の anchor が古くなる |
| C4 | F10 | CLI | T-S4: AC12 `rg -c '不可逆 mutation の直前に owner の判断を得る' docs/AGENT_OPERATING_MANUAL.md` → 1 | 直前 gate の文が縮約で落ちる、「owner 同席」だけになる |
| C4 | F11 / F2 | CLI + review | T-S5: AC12 の `awk '/^## Writer への依頼/,/^## 実機調査/' … | rg -c '^[123]\. '` → 3 と `Writer が編集前に止まったとき` = 1。手順 2 が Scope・AC・commit 条件・権限・phase・Risk・review 数を変えないこと、手順 3 が旧前提の sweep であること、発注直前の照合に必須 command の出力先の確認があること、`## ハーネスの境界` に advisory hook の推定禁止と hook が review を強制しないことがあることを review で確認 | 手順が番号なしに畳まれ DEV_WORKFLOW `:286` の「2〜3」が宙に浮く、§5.6 手順 4 や §6.1 の 2 項目が黙って落ちる |
| C5 | F5 | CLI + checker | T-G1: AC6 の `find`（4 行）と `rg -n '\]\([^)]*(shared\.md|profiles/)' docs` が 0 行、`bash scripts/doc-consistency-check.sh` の Markdown link 検査、`bash scripts/doc-consistency-check.sh --target plan docs/archive/plans/2026-09-13-harness-context-efficiency.md` が exit 0 | `shared.md` / profiles が残る、README まで消える、削除した file への link が archive を含む `docs/` に残る |
| C5 / C4 | F6 | review | T-G2: AC8 の anchor と新 MANUAL の見出しの突合 | DEV_WORKFLOW の anchor が旧見出しを指したまま |
| C6 | F12 | CLI + review | T-P1: AC7 `## 発注の型` = 1、`確信度|P1/P2/P3` = 0、`code_review\.md` への参照が 1 以上。発注の入力欄 5 つと `## Target` の「読ませないもの」を確認 | §5.4 の入力欄が落ちる、Opus 専用の扱いや §5.5 の例外が残る、出力の書式・重大度を review packet が定め続ける |
| C7 | F8 | CLI | T-L2: AC5（見出し 1、5 件の全面 superseded、`git diff` の削除行 0） | D-092 が無い、既存 entry の行を書き換える、D-056 等の列挙が欠ける |
| C7 | F8 | review | T-L3: PR1 archive packet の Non-scope が挙げた D（D-034 / D-035 / D-038(8) / D-046-3 / D-049 / D-055・D-074 / D-084 / D-085 MG-D10・D11）が D-092 に全部ある | PR1 が送った列挙を落とす |
| C8 | F9 | CLI + review | T-B1: AC9 の `git diff --stat`（所有外は空、archive は 1 file の 1 行だけ）、template の hunk（`:34`・`:125` の中だけ）と DEV_WORKFLOW の hunk 位置（7 か所の中だけ） | 他 PR の所有 file・行を編集する、例外の範囲を越える |
| 全体 | — | CLI | T-C1: AC11 の各 command が exit 0 | checker・workflow suite・PK4 / PK5 のどれかが落ちる |

## State Lifecycle Matrix

not applicable: UI・data・cache・route・永続 state を持たない文書変更。workflow の状態遷移（Workflow State・helper）の定義と検査は変えない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 座組・model・effort の記述 | `rg -n 'effort|Sonnet|Fable|Astra|Sol' docs/AGENT_OPERATING_MANUAL.md docs/DEV_WORKFLOW.md docs/agent-guidance CLAUDE.md AGENTS.md`（監査 §5 の「座組・model・effort」行）と DEV_WORKFLOW `:83` の model 名の規則 | MANUAL `## 座組`（effort の値もここだけ）、model-notes（値を持たず `#座組` を参照、傾向だけ）、DEV_WORKFLOW `:83` の括弧内、`:215` の削除 | `CLAUDE.md` の effort 節（PR3 が `#座組` 参照へ。PR3 merge まで並存）、archive / decision-log（履歴） | T-F1 / T-F2 |
| MANUAL の anchor を指す link | `rg -o 'AGENT_OPERATING_MANUAL\.md#[^) ]+' --hidden -g '!.git/**' -g '!docs/archive/**' -g '!docs/decision-log.md' .` = DEV_WORKFLOW `:68,215,286` と `.agents/skills/inventory-workflow-start/SKILL.md:13` | DEV_WORKFLOW `:68`・`:286`（`:215` は削除）、`:280` の section 名指し | Skill `:13`（PR3 の所有、packet の所有表。同じ行の語「Capacity-degraded」も PR3）。archive の anchor は link 検査が anchor を見ないので切れない | T-G2 |
| agent-guidance の file を指す参照 | link: `rg -n '\]\([^)]*(shared\.md|profiles/)' docs`（archive を含む）= MANUAL `:97`、archive `2026-09-13-harness-context-efficiency.md:88`、README `:5`・`:6`、profiles 3 本。名前: `rg -n 'agent-guidance/(README|shared|profiles|model-notes)|profiles/|shared\.md|model-notes\.md' --hidden -g '!.git/**'` | MANUAL の旧 `:90` / `:97` / `:103` / `:119`（書き直しで消える）、README の索引、archive `:88`（code 表記へ） | `AGENTS.md:21`（README を残すので有効）、`.codex/README.md:86`（model-notes を残すので有効）、`scripts/tests/classify-changes.test.sh:46`（classifier の glob 判定に使う path の文字列で、file の実在を要しない）、archive の link でない言及（`docs/archive/harness-context/2026-09-14-PROJECT_HANDOFF.md:183`、`2026-09-13-harness-context-efficiency.md:59`）と decision-log（履歴） | T-G1 |
| `independent-review`（撤去済み Phase 名） | `rg -n 'independent-review' --hidden -g '!.git/**' -g '!docs/archive/**'` = MANUAL `:22`、template `:196`、test の旧 Phase 負例 2 件、backlog、decision-log | MANUAL `:22` | template `:196`（PR4）、`scripts/tests/*` の負例（旧値を拒否する検査の入力）、decision-log（履歴） | T-R1 |
| `Subagent Budget` の名指し | `rg -n 'Subagent Budget'` = DEV_WORKFLOW の見出し、MANUAL `:21` / `:210` / `:274`、`.claude/commands/plan-rally.md:8`、decision-log | 見出しを保ち、MANUAL は書き直しで参照を 1 か所（`## 役割` の Writer）に | plan-rally（PR3） | T-S3 |
| §5.5 consultation relay の使用指示 | `rg -n '§5\.5|consultation relay' --hidden -g '!.git/**' -g '!docs/archive/**' -g '!docs/decision-log.md' -g '!docs/plans/**'` | MANUAL §5.5 と関連行 `:38`・`:181`・`:211`（書き直しで消える）、template `:34`・`:125`（S7） | `.claude/commands/plan-rally.md:23`（PR3）、template の Consultation Relay 節の見出しと 2 欄（PR4）、`docs/UI_TECH_STACK.md:691` の `§5.5.1`（別文書の節番号で無関係） | T-L1 |

## Negative Paths

- missing input: `## 座組` が無い → T-F1 が 0 を返す。直前 gate の文が無い → T-S4。
- invalid input: 旧 model 名（Sonnet 5 / Opus 5 / Fable 5 / GPT-5.6）が残る → AC2 が 0 でない。
- duplicate/ambiguous input: 座組や effort の値が MANUAL 以外にもある → T-F1（model-notes）、T-F2（review）。出力の規範が review packet と code_review の 2 か所 → T-P1。
- unknown reference: 削除した file への link（archive を含む） → link 検査の ERROR（Contract Probe P1 で実測）、T-G1 の `rg`。
- dependency missing: not applicable（依存の追加なし）。
- permission/write failure: not applicable。
- dry-run side effect: not applicable。

## Boundary Checks

- threshold: AC10 の 100 行 / 15,000 bytes は上限の確認で、目標値（60 行 / 6KB）は `未実測` の目安。
- producer/consumer: MANUAL の見出し（producer）と、それを anchor で指す DEV_WORKFLOW・PR3 の CLAUDE.md・Skill（consumer）。固定 anchor は `#座組`。DEV_WORKFLOW `:286` は `#writer-への依頼` の番号 2〜3 を指す。
- その他の項目（null・wire・precision 等）: not applicable（文書変更）。

## Compatibility Checks

- old schema/input: active な他 packet は並走 lane の branch にだけある（main には無い）。本 PR は checker を変えないので、他 lane の packet の `--target plan` の結果は変わらない（T-C1）。
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
- M5 新 MANUAL の「不可逆 mutation の直前に owner の判断を得る」を「owner 同席で進める」に替える → T-S4 が 0 を返すか。

## Residual Test Gaps

- anchor の食い違いは機械で検査されない（Contract Probe P2）。AC8 / T-G2 の review に頼る。恒久の検査の追加は非目的。
- 座組表が owner 決定と一致することと、独立性の規則の実効性は文書の review でしか確かめられない。規則が守られたかは次の Final Review の発注（本 PR 自身を含む）で観測する。
- PR3 の merge までは `CLAUDE.md` の effort 節、AGENTS の委任の文、code_review の確信度が本 PR の参照先と食い違う（packet Non-scope。PR2 → PR3 を続けて merge する）。
- Writer・レビューの Opus の effort medium は PR5 の定義 file まで実効せず、Agent tool から直接起動した subagent は high で動く。実効値は run 報告で観測する。
- model が改訂後の文書で正しく判断するか、token の削減量は `未実測`（監査 §10）。
