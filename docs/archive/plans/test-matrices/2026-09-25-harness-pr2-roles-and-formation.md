# Test Design Matrix: 座組の新設と退役した役割規則の削除（ハーネス刷新 PR2、R3）

Plan Packet: [2026-09-25-harness-pr2-roles-and-formation.md](../2026-09-25-harness-pr2-roles-and-formation.md)。文書だけの変更で、検査は `rg` / `find` / `git diff` と既存の checker・workflow test。新しい test は足さない（packet 非目的）。行番号は base `e7c22f8f` のもの。

## Risk

Risk: R3

## Contracts Under Test

- C1 座組と effort の値は `docs/AGENT_OPERATING_MANUAL.md` の `## 座組` 1 か所（effort 列の cell）にあり、owner 決定 2026-09-07 / 08・14・23 / 24 / 25 と一致する。model-notes は値を持たず（CLAUDE.md の effort 節への link も `#座組` へ付け替える）、DEV_WORKFLOW `:83` と MANUAL `:15` は、規範の文では model 名が field の値と座組表にだけ現れるとし、DEV_WORKFLOW `:83` と model-notes は `AGENT_OPERATING_MANUAL.md#座組` を link で参照する（packet S1〜S3、SPEC-WF-HARNESS2-D1 / D6）。
- C2 MANUAL §3 の独立性の既存 5 項目に、fresh 非 fork・同じ round の各 reviewer に他の reviewer の結果を見せない（置かれた場所すべて、各発注の本文を含む。Plan Review を含む。Codex の broad が返った後は Claude 側も同じ HEAD で broad を取り直す）・Writer が Codex の場合の別 vendor の Plan Reviewer・load-bearing・Plan Reviewer と Final Reviewer の別 context が足され、§3.3 に Codex の Final Review の枠の代替の規則がある（S1 (2)、D2）。
- C3 退役した仕組みを指示する文が本 PR の所有範囲（template `:34`・`:125` を含む）に残らない（S1〜S4、S7、AC2 / AC3 / AC7、D3）。
- C4 残す安全境界と文字列契約（Contract Coverage Ledger の各行: one-shot irreversible / task-shape と不可逆 mutation の直前の owner 判断、hook 0 本と advisory hook の推定禁止、Writer が編集前に止まったときの番号付き手順 1〜3、Subagent Budget の 5 項目、`## Subagent Budget` と `## Effort の選定` の見出し）が保たれ、MANUAL の残す節と既存の見出しは変わらない（S1〜S3、D4）。
- C5 agent-guidance は file の構成と link が変わらず、README `:8` と shared `:9` の Evidence Mode・legacy の句だけが消える（S3）。
- C6 review packet は出力の規範を持たず `## Output` から `docs/code_review.md` を参照し、reviewer の姿勢の 2 句と、read-only 宣言の depth 1、`## Target` の読ませないものを持ち、legacy の文が消える（「旧三点一致を要求しない」は「廃止済みの SHA 照合を要求しない」へ。S4、D5）。
- C7 decision-log D-092 が追記だけで、退役・部分退役・PR1 撤去済み・維持を列挙する（S5）。
- C8 本 PR は PR3 / PR4 / PR5 の所有 file と、DEV_WORKFLOW の S2 以外の行に触れない。例外は template `:34`・`:125` だけ（所有表、AC9、D7）。

## Failure Modes

- F1 座組・effort の記述や effort の値が MANUAL の `## 座組` 以外（model-notes、README、DEV_WORKFLOW、表の下の注記）にも残り、2 か所が食い違う。
- F2 編集で独立性・Human Gate・depth 1・one-writer などの安全境界が落ちる。
- F3 MANUAL の編集で `one-shot irreversible` / `task-shape` が消え、`doc-consistency-plan-packet.test.sh:842-843` が落ちる。
- F4 MANUAL の編集で `claude-hooks.test.sh:39-46` の禁止句が入る。
- F5 agent-guidance の編集で file や link が消える（`docs/agent-guidance/README.md` まで消して `AGENTS.md:21` の名指しと MANUAL の link が切れる、shared・profiles の link が切れる）。
- F6 既存の見出しが変わり、DEV_WORKFLOW `:68`・`:286` と `.agents/skills/inventory-workflow-start/SKILL.md:13` の anchor が古くなる（link 検査は anchor を見ない）。
- F7 独立性の規則が一部の置き場所だけを挙げ、PR の comment / review、local の報告 file、発注の本文を経由して他の reviewer の結果が見えてしまう。または Final Review だけに限り、Plan Review の reviewer が他の reviewer の結果を読める。または「後の reviewer」だけを縛り、同時に発注した reviewer の発注に読ませない指示が入らない。
- F8 D-092 が既存 entry を書き換える、または PR1 が送った superseded の列挙を落とす。
- F9 PR3 の所有 file（AGENTS / CLAUDE / `.claude` / `.agents` / code_review / pr-review-prompt）や PR4 の所有行を編集する、または template の例外の範囲を越える。
- F10 §3.5 の編集で `:110` の「不可逆 mutation の直前 gate に同席し」が落ち、owner が session にいるだけで不可逆 mutation に進める。
- F11 §5.6 の item 7 の削除で止まったときの手順 1〜3 の番号がずれるか消え、DEV_WORKFLOW `:286` の「2〜3」が存在しない項番を指す。
- F12 review packet に出力の書式・重大度が残り `docs/code_review.md` と 2 か所の規範になる、または reviewer の姿勢の 2 句まで消える。
- F13 Codex の Final Review の枠が、Codex の停止を理由に Coordinator の指名で Claude の reviewer に代えられる。
- F14 Codex の broad が是正後の HEAD で返った後、Claude 側の broad を同じ HEAD で取り直さず、helper が Final Review Minimum の不足で closure を拒否する（`scripts/pr-gate.py` の `record` は broad の head/base が変わると audits を作り直す）。または古い HEAD の run を新しい HEAD の broad として record する。

## Test Matrix

- 既存 test を回帰の根拠にする前に、その test が実在し対象の文字列を検査していることを `rg` で確認した（`doc-consistency-plan-packet.test.sh:842-843`、`claude-hooks.test.sh:30-54`、`run-workflow-tests.sh` が両方を呼ぶ）。
- link 検査の範囲（`docs/archive/**` を含む）と anchor の扱いは packet の Contract Probe P1 / P2 で実測した。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | F1 | CLI | T-F1: AC1 `rg -c '^## 座組$' docs/AGENT_OPERATING_MANUAL.md` → 1、AC2 の `Sonnet|Opus 5（|Fable 5（|GPT-5\.6|Sol 5\.6` が 0、AC12 の model-notes の `\b(medium|high|xhigh)\b` が 0 と `CLAUDE\.md#` が 0（baseline 1）、`値としてのみ現れる` が 0、AC3 の `never in normative rules` が 0 | `## 座組` が無い・2 つある、旧 slot 表や旧 model 名が残る、model-notes に effort の値や CLAUDE.md の effort 節への link が残る（PR3 の merge で anchor が切れる）、MANUAL `:15`・DEV_WORKFLOW `:83` が座組表と矛盾したまま |
| C1 | F1 / F13 | review | T-F2: 座組表の各行を owner 決定（packet 冒頭の出典）と突き合わせ、`rg -n 'effort' docs/agent-guidance/model-notes.md docs/agent-guidance/README.md docs/DEV_WORKFLOW.md` の各行が effort の値（Claude 側・Codex 側とも）を定めず `#座組` を参照していることを確認。Final Reviewer の Claude 側（R3 以上と design lane は Fable 5.1、closure の既定 Fable 5.1）、Fable 5.1 の effort high（Final Review・closure・相談役）、Codex の合否を外さない注記、Fable が使えないときの代替と実効 model の記録、相談役が使えないときの扱い、実効値の注意が effort 列の cell にあり表の下の注記が値を持たないこと、§3.3 の Codex の枠の代替（Codex の別 model だけ、Claude は owner の明示決定だけ）と Codex 停止中の列への参照を確認 | Codex 停止中の扱い・Fable の位置付け・effort が決定と違う、座組が 2 か所に書かれる、注記に値が書かれる、Codex の枠を Coordinator の指名で Claude に代えられる |
| C2 | F2 / F7 / F14 | CLI + review | T-I1: AC4 `rg -c '他の reviewer'` が MANUAL と review packet で 1 以上、`別の fresh context` が MANUAL で 1 以上、`Coordinator の指名では不可` が MANUAL で 1。MANUAL §3 に既存 5 項目・(a) fork・(b) 同じ round の各 reviewer（Plan Review・Final Review とも。発注の順に依らない）・(c) Writer が Codex の場合・(d) load-bearing・(e) Plan Reviewer と Final Reviewer の別 context が揃い、読ませない場所が「置かれた場所すべて」と例示 4 種（local の報告 file を含む）、各発注の本文の禁止（closure・是正の発注は除く）、Codex の broad が round をまたいで pending のときの進め方（Codex の broad が返った後、Claude 側も同じ HEAD で broad を取り直す）と、§3.3 の Plan Review の Codex 分の例外を含む | 独立性の項目が欠ける、読ませない場所から PR の comment / review や local の報告 file が落ちる、発注の本文に他の reviewer の結果由来の観点が書ける、同時に発注した reviewer が規則の外に落ちる、Codex の broad の後に Claude 側の broad を取り直さず helper に拒否される、Codex 停止中に plan-approved が止まる、Plan Review が規則の外に落ちる、Plan Reviewer と Final Reviewer が同じ context で済む |
| C3 | — | CLI | T-R1: AC2（baseline 42 → 0、`pr-review-prompt` の baseline 1 → 0）、AC3 前半（baseline 6 → 0）、AC7 前半（baseline 1 → 0） | Execution Mode・D-056・§5.5・§5.7・Astra 主担当・Subagent Budget の数値・D-062(c) の codex-only 句・実行 mode 上の裁定者・Evidence Mode と legacy の文・pr-review-prompt の link が残る |
| C3 | — | CLI + review | T-L1: `rg -n '§5\.5' docs/templates/plan-packet.md` が 0 行（baseline 2 行: `:34`・`:125`）、`git diff -U0 origin/main...HEAD -- docs/templates/plan-packet.md` の hunk が `:34`・`:125` の中だけ | template が §5.5 の手順を指示し続ける、または template の他の行（PR4）を編集する |
| C4 | F3 | test | T-S1: `bash scripts/tests/doc-consistency-plan-packet.test.sh`（`:842-843`） | MANUAL から `one-shot irreversible` か `task-shape` が消える |
| C4 | F4 | test | T-S2: `bash scripts/tests/claude-hooks.test.sh` | MANUAL に禁止句が入る、hook inventory の記述と settings がずれる |
| C4 | F2 | CLI | T-S3: AC3 後半（Subagent Budget の 5 項目 = 5、`## Subagent Budget` = 1）、AC6 `## Effort の選定` = 1、AC7 の review packet の `depth 1` が 1 以上 | depth 1・one-writer・出力契約・load-bearing・P3-only のどれかが消える、見出しの改名で PR3 所有の `.claude/commands/plan-rally.md:8` と evals の anchor が古くなる、review packet の read-only 宣言に depth 1 が無い |
| C4 | F10 | CLI | T-S4: AC12 `rg -c '不可逆 mutation の直前 gate に同席し' docs/AGENT_OPERATING_MANUAL.md` → 1（baseline 1） | §3.5 `:110` の直前 gate の文が編集で落ちる、「owner 同席」だけになる |
| C4 | F11 / F2 | CLI + review | T-S5: AC12 の `awk '/^### 5\.6/,/^## 6\./' … | rg -c '^[123]\. '` → 6（baseline 9: §5.7 の 1〜3 を含む）、`Writer が編集前に止まったとき` = 1、`^7\. 実行 mode` = 0（baseline 1）。§5.6 の変更が `:233` の「Evidence Mode・」と item 7 の削除・8・9 の繰り上げだけであること、§6.1 と §5.6 手順 4 が変わらないことを review で確認 | 手順 1〜3 の番号がずれ DEV_WORKFLOW `:286` の「2〜3」が宙に浮く、§5.6 手順 4 や §6.1 の 2 項目が編集で落ちる |
| C5 | F5 | CLI + checker | T-G1: AC6 の `find`（baseline と同じ 11 行）と `git diff --stat` が merge-evidence・evals・profiles で空、`bash scripts/doc-consistency-check.sh` の Markdown link 検査が exit 0 | agent-guidance の file が消える・増える、README まで消える、link が切れる |
| C4 | F6 | CLI + review | T-G2: AC10 の見出し 6 本 = 6、削除する節の見出し = 0、§5.1〜§5.4 = 4。AC8 (i) の `#座組` を除いた anchor が 2 行でどちらも §5.6 の見出しの slug と一致、(ii) DEV_WORKFLOW と model-notes にそれぞれ `AGENT_OPERATING_MANUAL.md#座組` が 1 以上、(iii) MANUAL に `^## 座組$` が 1 | 既存の見出しが変わり、DEV_WORKFLOW `:68`・`:286` や Skill `:13` の anchor が古くなる、削除する節が残る、`#座組` の参照が欠けるか参照先の見出しが無い |
| C6 | F12 | CLI + review | T-P1: AC7 `確信度|P1/P2/P3` = 0、`code_review\.md` への参照が 1 以上、`## Output` 以降の `code_review` が 1 以上（baseline 0）、`廃止済みの SHA 照合を要求しない` が 1、`黙って落とさない` と `を残したまま` が句ごとに 1 以上、`depth 1` が 1 以上。`## Target` の「読ませないもの」と、発注の型を review packet に複製していないこと（MANUAL §5.4 に残る）を確認 | 出力の書式・重大度を review packet が定め続ける、`## Output` が code_review を参照しない、reviewer の姿勢の 2 句が消える、`:26` の置換文が禁止語に当たる、§5.4 の発注の型が 2 か所になる |
| C7 | F8 | CLI | T-L2: AC5（見出し 1、5 件の全面 superseded、`git diff` の削除行 0） | D-092 が無い、既存 entry の行を書き換える、D-056 等の列挙が欠ける |
| C7 | F8 | review | T-L3: PR1 archive packet の Non-scope が挙げた D（D-034 / D-035 / D-038(8) / D-046-3 / D-049 / D-055・D-074 / D-084 / D-085 MG-D10・D11）が D-092 に全部ある | PR1 が送った列挙を落とす |
| C8 | F9 | CLI + review | T-B1: AC9 の `git diff --stat`（所有外と `docs/archive` は空）、template の hunk（`:34`・`:125` の中だけ）と DEV_WORKFLOW の hunk 位置（6 か所の中だけ） | 他 PR の所有 file・行を編集する、例外の範囲を越える |
| 全体 | — | CLI | T-C1: AC11 の各 command が exit 0 | checker・workflow suite・PK4 / PK5 のどれかが落ちる |

## State Lifecycle Matrix

not applicable: UI・data・cache・route・永続 state を持たない文書変更。workflow の状態遷移（Workflow State・helper）の定義と検査は変えない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 座組・model・effort の記述 | `rg -n 'effort|Sonnet|Fable|Astra|Sol' docs/AGENT_OPERATING_MANUAL.md docs/DEV_WORKFLOW.md docs/agent-guidance CLAUDE.md AGENTS.md`（監査 §5 の「座組・model・effort」行）と DEV_WORKFLOW `:83`・MANUAL `:15` の model 名の規則 | MANUAL `## 座組`（effort の値もその cell だけ）、model-notes（値を持たず `#座組` を参照、`:9` の CLAUDE.md への link も付け替え、傾向だけ）、DEV_WORKFLOW `:83` の括弧内、MANUAL `:15`・`:28`、`:215` の削除 | `CLAUDE.md` の effort 節（PR3 が `#座組` 参照へ。PR3 merge まで並存）、archive / decision-log（履歴） | T-F1 / T-F2 |
| MANUAL の anchor を指す link | `rg -o 'AGENT_OPERATING_MANUAL\.md#[^) ]+' --hidden -g '!.git/**' -g '!docs/archive/**' -g '!docs/decision-log.md' .` = DEV_WORKFLOW `:68,215,286` と `.agents/skills/inventory-workflow-start/SKILL.md:13` | DEV_WORKFLOW `:215`（行ごと削除）。DEV_WORKFLOW `:83` と model-notes に `AGENT_OPERATING_MANUAL.md#座組` への link を足す（AC8 (ii)）。`:68`・`:286` と Skill `:13` は見出しを変えないので触らない | archive の anchor は link 検査が anchor を見ないので切れない。§5.4 の見出しの括弧書きは anchor で指す参照が 0 件 | T-G2 |
| 削除する MANUAL の節を番号で指す参照 | `rg -n '§3\.[124]|§5\.[57]|#astraを主担当' --hidden -g '!.git/**' -g '!docs/archive/**' -g '!docs/decision-log.md' -g '!docs/plans/**' .` = MANUAL 内、DEV_WORKFLOW `:215`・`:349`、template `:34`・`:125`、`docs/backlog.md:127` | MANUAL 内（削除か直す行）、DEV_WORKFLOW `:215`・`:349`、template `:34`・`:125` | `docs/backlog.md:127`（closeout で見直す）、`docs/function-design/22-mnt-migration.md` 等の同じ番号（別文書の節） | T-R1 / T-L1 |
| agent-guidance の file を指す参照 | link: `rg -n '\]\([^)]*(shared\.md|profiles/)' docs`（archive を含む）。名前: `rg -n 'agent-guidance/(README|shared|profiles|model-notes)|profiles/|shared\.md|model-notes\.md' --hidden -g '!.git/**'` | MANUAL `:97`（§3.4 の削除で消える）、MANUAL `:119`（README の link だけにする） | file は消さないので、README `:5`・`:6`、archive `2026-09-13-harness-context-efficiency.md:88`、`AGENTS.md:21`、`.codex/README.md:86` は有効のまま | T-G1 |
| `independent-review`（撤去済み Phase 名） | `rg -n 'independent-review' --hidden -g '!.git/**' -g '!docs/archive/**'` = MANUAL `:22`、template `:196`、test の旧 Phase 負例 2 件、backlog、decision-log | MANUAL `:22` | template `:196`（PR4）、`scripts/tests/*` の負例（旧値を拒否する検査の入力）、decision-log（履歴） | T-R1 |
| `Subagent Budget` の名指し | `rg -n 'Subagent Budget'` = DEV_WORKFLOW の見出し、MANUAL `:21` / `:209` / `:210` / `:274`、`.claude/commands/plan-rally.md:8`、decision-log | 見出しを保つ。MANUAL `:209`・`:210` は §5.5 の削除で消え、`:274` は上限を置かない文に直す | plan-rally（PR3） | T-S3 |
| §5.5 consultation relay の使用指示 | `rg -n '§5\.5|consultation relay' --hidden -g '!.git/**' -g '!docs/archive/**' -g '!docs/decision-log.md' -g '!docs/plans/**'` | MANUAL §5.5 と関連行 `:38`・`:181`（削除か直す行）、template `:34`・`:125`（S7） | `.claude/commands/plan-rally.md:23`（PR3）、template の Consultation Relay 節の見出しと 2 欄（PR4）、`docs/UI_TECH_STACK.md` の `§5.5.1`（別文書の節番号で無関係） | T-L1 |

## Negative Paths

- missing input: `## 座組` が無い → T-F1 が 0 を返す。直前 gate の文が無い → T-S4。
- invalid input: 旧 model 名（Sonnet 5 / Opus 5 / Fable 5 / GPT-5.6）が残る → AC2 が 0 でない。
- duplicate/ambiguous input: 座組や effort の値が MANUAL の `## 座組` 以外にもある → T-F1（model-notes）、T-F2（review）。出力の規範が review packet と code_review の 2 か所、発注の型が §5.4 と review packet の 2 か所 → T-P1。
- unknown reference: 見出しの変更で anchor が古くなる → T-G2（AC8・AC10）。link 先の file が消える → link 検査の ERROR（Contract Probe P1 で実測）、T-G1。
- dependency missing: not applicable（依存の追加なし）。
- permission/write failure: not applicable。
- dry-run side effect: not applicable。

## Boundary Checks

- 見出しの保全: AC10 の 6 本の既存見出しの一致と、削除する節の見出しの不在（節番号は振り直さず欠番のまま）。
- producer/consumer: MANUAL の見出し（producer）と、それを anchor で指す DEV_WORKFLOW・PR3 の CLAUDE.md・Skill（consumer）。固定 anchor は `#座組`。DEV_WORKFLOW `:286` は §5.6 の anchor（変えない）の番号 2〜3 を指す。
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

- M1 編集後の MANUAL から `one-shot irreversible` を消す → `bash scripts/tests/doc-consistency-plan-packet.test.sh` が red になるか。
- M2 編集後の MANUAL に `hook pass` を 1 行入れる → `bash scripts/tests/claude-hooks.test.sh` が red になるか。
- M3 `docs/agent-guidance/README.md` を消す → `bash scripts/doc-consistency-check.sh` が link の ERROR を出すか（起票時に MANUAL の link で実測済み: Contract Probe P1。編集後の MANUAL `:119` の README への link で再確認する）。
- M4 AC2 の pattern の 1 語（例: `codex-only`）を編集後の MANUAL に戻す → AC2 が 0 でなくなるか（検査式の検出力の確認）。
- M5 編集後の MANUAL の §3.5 `:110` の「不可逆 mutation の直前 gate に同席し」を「owner 同席で進め」に替える → T-S4 が 0 を返すか。

## Residual Test Gaps

- anchor の食い違いは機械で検査されない（Contract Probe P2）。AC8 / AC10 / T-G2 に頼る。恒久の検査の追加は非目的。
- 座組表が owner 決定と一致することと、独立性の規則の実効性は文書の review でしか確かめられない。規則が守られたかは次の Plan Review・Final Review の発注（本 PR 自身を含む）で観測する。
- PR3 の merge までは `CLAUDE.md` の effort 節、AGENTS の委任の文、code_review の確信度が本 PR の参照先と食い違う（packet Non-scope。PR2 → PR3 を続けて merge する）。
- Writer・レビューの Opus の effort medium は PR5 の定義 file まで実効せず、Agent tool から直接起動した subagent は high で動く。実効値は run 報告で観測する。
- MANUAL の節番号の欠番（§3.1・§3.2・§3.4・§5.5・§5.7）と、残す節の冗長さは別 PR の縮約まで残る。
- model が改訂後の文書で正しく判断するか、token の削減量は `未実測`（監査 §10）。
