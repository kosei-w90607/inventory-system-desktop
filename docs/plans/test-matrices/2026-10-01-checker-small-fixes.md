# Test Design Matrix: 検査 script と test の小口を整理する（R3）

packet: `docs/plans/2026-10-01-checker-small-fixes.md`（Scope S1〜S6、設計判断 D1〜D7、AC1〜AC9）。行番号は main `0223ef18` のもの。

## Risk

Risk: R3

## Contracts Under Test

- C1（D3、S3）: PK4 は `## Workflow State` の `- key:` の行の key の重複を ERROR にする。行集合と key の切り方は helper の `workflow_fields`（`scripts/pr-gate.py:148-156`）と同じ（HTML comment と code fence を除き、`- ` から最初の ASCII `:` までを key にし、空白を削らない）。
- C2（D4、S4）: `scripts/check-workflow-git.sh` は Phase・Evidence Mode・Plan Commit・Amendments を h2 の `## Workflow State` の節（次の `## ` まで）からだけ読む。節に Phase が無ければ `invalid tracked Phase`。PK5 の判定式と対象の選び方は不変。
- C3（D5、S5）: PK1 の節の有無（base_sections・Contract Ledger・Spec Contract / Trace Matrix・Test Design Matrix）と PK3 の Contract Ledger の判定は `##` の見出しだけに当たる。`extract_markdown_section` は不変。archive の packet に新しい ERROR を出さない。
- C4（D6、S6）: hook test は agent 定義・command file・skill（`.agents/skills`・`.claude/skills`）の frontmatter の top-level の `hooks`・`permissionMode`・`mcpServers` を拒む。YAML として読めなければ拒む（既存）。tracked の frontmatter は通る。
- C5（D2、S1-c）: wrapper test は旧 clone の path（`[Pp]rojects/inventory-system`、`-public` なし）を wrapper・rules・live の文書で拒み、public の path を拾わず、DEV_SETUP の窓に小文字の namespace を要求する。pattern の感度を自己点検する。
- C6（D1、S1-a・S1-b）: `.codex/rules/default.rules` と DEV_SETUP の namespace は小文字。classifier の分類は不変（未知 path は full fallback）。
- C7（S2）: `reading-order-drift.test.sh` の comment は撤去済みの fixture を指さない。判定式は不変。

## Failure Modes

- F1: 遷移記録や必須 field の key が重複した packet が PK4 を通り、helper の最初の操作で初めて `duplicate packet fields` が出る（今の状態）。
- F2: PK4 の重複の検査が helper より緩い（key の空白を削る、comment の中を数える差で、helper が止める packet を PK4 が通す）か厳しい（comment の中を数えて helper が通す packet を止める）。
- F3: 本文の箇条の `- Phase:` / `- Evidence Mode:` で `check-workflow-git.sh` が止まる（今の状態、PR #123）。
- F4: `## Workflow State` に Phase が無い packet を本文の `- Phase: implementing` で通す（今の状態、fail-open）。
- F5: `check-workflow-git.sh` の変更で Plan Commit の ancestry の判定が変わる（節の外の `- Plan Commit:` を拾う、または節の Plan Commit を読み落として PK5 を skip する）。
- F6: `###` の小見出しだけで必須節（Contract Ledger・Data Safety ほか）を満たしたと判定する（今の状態、F-1）。
- F7: `##` 化で archive の packet や新旧 template の正例が ERROR になる。
- F8: `permissionMode` / `mcpServers` を書いた agent 定義が hook test を通る（今の状態、F-2）。
- F9: 新しい key の追加で `hooks` の拒否・CRLF・`.claude-plugin`・`.claude/skills` の既存の拒否が弱まる、または tracked の clean な frontmatter を拒む。
- F10: 小文字の旧 clone の path（`/home/kosei/projects/inventory-system/`）が rules や live の文書に入っても wrapper test が通る（今の状態）。
- F11: pattern の変更で public の path（`…/inventory-system-public/…`）を旧 clone と誤検出する、または大文字の旧 clone の検出を失う。
- F12: DEV_SETUP の namespace を小文字にしたのに T13 が大文字を要求して red、またはその逆（文書と test の片方だけ直す）。
- F13: `.codex/rules/default.rules` に大文字の path が残る、または置換が他の token を壊す（rules の構文が崩れる）。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。helper 名だけで実 router / integration と分類しない。
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。
- oracle の anchor は定義文にしか現れない literal を選び、`rg -c` で対象 file 内 1 件を file ごとに確かめる。
- oracle は検証対象と独立の正本から転記し、mutation は production 側だけを変える。
- 結果を空にする注入で、期待が空集合の case だけが kill を主張していないかを確かめ、各組合せに非空の期待を 1 件置く。

test 名は実装で付ける名前（既存の命名: `doc-consistency-plan-packet.test.sh` は番号付きの comment、`workflow-git-checks.test.sh` は `echo "PASS: …"`、`claude-hooks.test.sh` は `expect_rejected "<label>"`）。既存の test の実在は `rg -n` で確かめた（packet の事実 11）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | F1 | CLI（fixture packet、`--target plan`） | `doc-consistency-plan-packet.test.sh` S3 (a) `PK4-DUP-1: 必須 field の重複は ERROR`（`PKT_WORKFLOW_STATE_EXTRA="- Human Gate: ready,merge"`、exit 非 0、出力に `重複する field` と `Human Gate`） | PK4 の重複の検査が無い（MU1）、必須 field だけを別の経路で読んで重複を見ない |
| C1 | F1 | CLI | S3 (b) `PK4-DUP-2: 遷移記録の同じ key は ERROR`（`PKT_WORKFLOW_STATE_EXTRA` に `- plan-draft → plan-gate（2026-01-01）: a` と `- plan-draft → plan-gate（2026-01-01）: b`、exit 非 0、出力に `plan-draft → plan-gate（2026-01-01）`） | 重複の検査が必須 10 field だけを見る（D3 の棄却案 (b)）、key を最初の `:` でなく別の位置で切る |
| C1 | F2 | CLI | S3 (c) `PK4-DUP-3: 遷移記録の違う key は OK`（`- plan-draft → plan-gate（round 1）: a` と `- plan-draft → plan-gate（round 2）: b`、exit 0、`PK4: Workflow State machine 整合 OK`） | key の切り方が括弧の前で切れて同じ key になる、遷移記録の行を一律に拒む |
| C1 | F2 | CLI | S3 (d) `PK4-DUP-4: HTML comment の中の行は数えない`（`PKT_WORKFLOW_STATE_EXTRA` に `<!-- - Phase: x -->`、exit 0） | `strip_fenced_code_and_html_comments` を通さず comment の中の `- Phase:` を重複に数える（helper は `markdown()` で除く） |
| C1 | F2 | CLI（packet 実物） | AC3 の 2 本目: 本 packet の `--target plan` が exit 0（遷移記録 4 行 + `Branch` の key が互いに違う） | 検査が過剰に拒む（空白の扱い・全角括弧の扱いで同じ key に潰す） |
| C2 | F3 | CLI（synthetic git repo） | `workflow-git-checks.test.sh` S4 (a) `PASS: body bullets outside Workflow State are ignored`（`## Scope` に `- Phase: 本文の箇条` と `- Evidence Mode: legacy の語`、exit 0） | Phase / Evidence Mode を file 全体から読む（MU2・MU3） |
| C2 | F4 | CLI | S4 (b) `PASS: Phase outside Workflow State does not count`（節に Phase 無し、本文に `- Phase: implementing`、exit 非 0、`invalid tracked Phase`） | 節の抽出に失敗したとき file 全体に fallback する、本文の値を拾う（MU2） |
| C2 | F5 | CLI | S4 (c) `PASS: Plan Commit read from Workflow State only`（implementing の packet の `## Workflow State` より前の前文に `- Plan Commit: 0000000000000000000000000000000000000000` の箇条、節の Plan Commit は正しい ancestor、exit 0。前文に置くのは旧い `grep -m1` が file の最初の行を取るため） | Plan Commit を file 全体の `grep -m1` で読んで前文の行を拾い `rev-parse` が失敗する（MU2 を 4 つの読み取りに同時に注入した場合）。節の Plan Commit を読み落とす（empty → PK5 skip。(c) は節の値が ancestor なので skip でも exit 0 になる。読み落としは既存の D1〜D4 の負例〈non-ancestor で exit 非 0〉が検出する） |
| C2 | F5 | CLI（既存） | `workflow-git-checks.test.sh` の既存 `PASS: PK5 diff scope` と D1〜D4・T-G4 の全場面（`rg -n 'PASS: ' scripts/tests/workflow-git-checks.test.sh`） | PK5 の判定式や対象の選び方が変わる |
| C3 | F6 | CLI（fixture packet） | `doc-consistency-plan-packet.test.sh` S5 (a) `PK1-H2-1: ### Contract Ledger だけの R3 は ERROR`（新 template の fixture を書いた後 `sed -i 's/^## Contract Ledger$/### Contract Ledger/'`、exit 非 0、`Contract Ledger（旧 template は Spec Contract と Trace Matrix）を欠いています`） | Contract Ledger の判定が `#{2,}` のまま（MU4） |
| C3 | F6 | CLI | S5 (b) `PK1-H2-2: ### Data Safety は必須節を満たさない`（`sed -i 's/^## Data Safety$/### Data Safety/'`、exit 非 0、`必須セクション '## Data Safety' を欠いています`） | base_sections の判定が `#{2,}` のまま（MU5） |
| C3 | F7 | CLI | S5 (c) `PK1-H2-3: ## と ### の両方があれば OK`（fixture に `### Contract Ledger` の小見出しを Test Plan の下に足す、exit 0、`PK1: Plan Packet presence OK`） | `##` の判定が `###` の存在で壊れる、`extract_markdown_section` が `###` の方を取って表の行が空になる（最初の `#{2,}` の一致 = `##` を取る） |
| C3 | F7 | CLI（既存） | `doc-consistency-plan-packet.test.sh` の既存 PR4-F1〜F11（新旧 template）、case 13（archive）、1・21〜27（10 field）: `rg -n '^# --- (1|13|21|22|23|24|25|26|27)\.|PR4-F' scripts/tests/doc-consistency-plan-packet.test.sh` | `##` 化が正例を拒む |
| C3 | F7 | CLI（archive 実物） | AC5 の archive 3 本の `--target plan` が exit 0（`[ERROR]` 0 行）と `rg … docs/archive/plans \| wc -l` が `0` | archive に節名の `###` 見出しがあって新しい ERROR が出る |
| C4 | F8 | CLI（fixture repo） | `claude-hooks.test.sh` S6 (a) `expect_rejected "HARNESS5-D3 agent frontmatter permissionMode"`（`.claude/agents/writer.md` に `permissionMode: bypassPermissions`） | key の一覧に `permissionMode` が無い（MU6） |
| C4 | F8 | CLI | S6 (b) `expect_rejected "HARNESS5-D3 agent frontmatter mcpServers"`（`mcpServers:` の inline 定義 `- playwright:` + `type: stdio`） | 一覧に `mcpServers` が無い（MU7）、list 値の key を Hash の key として見ない（YAML の top-level は Hash なので `doc.key?` で見える） |
| C4 | F8 | CLI | S6 (c) `expect_rejected "HARNESS5-D3 skill frontmatter permissionMode"`（`.agents/skills/example/SKILL.md` に `permissionMode: plan`） | skill の dir に別の一覧を使う、値 `plan` を許す（D6 は値で分けない） |
| C4 | F9 | CLI（既存） | `claude-hooks.test.sh` の既存 `validate_contract "$frontmatter_fixture"`（clean な agent と skill が通る、`:260`）と `expect_rejected` の `hooks`・CRLF・`.claude/skills`・`.claude-plugin`・many manifests（`rg -n 'expect_rejected "HARNESS5-D3' scripts/tests/claude-hooks.test.sh`） | 一覧の書き方で `hooks` が抜ける、clean な frontmatter（`model`・`effort`・`disallowedTools`・`allowed-tools`・`metadata`）を拒む |
| C4 | F9 | CLI（実 repo） | `claude-hooks.test.sh` の冒頭の実 repo の `validate_contract "$SOURCE_ROOT"`（`rg -n 'validate_contract "\$SOURCE_ROOT"' scripts/tests/claude-hooks.test.sh`）、AC6 の `rg -ln 'permissionMode\|mcpServers' .claude/agents .claude/commands .agents/skills` が 0 行 | tracked の agent / skill に拒む key がある |
| C5 | F10 | CLI（自己点検） | `codex-safe-wrappers.test.sh` S1-c の感度の行 `OLD_ROOT_PATTERN misses the lowercase history-view path`（`printf '/home/kosei/projects/inventory-system/x' \| rg -q "$OLD_ROOT_PATTERN"` が真であること） | pattern が `Projects` だけ（MU9） |
| C5 | F11 | CLI（自己点検） | S1-c の感度の行 `OLD_ROOT_PATTERN matches the public path`（`…/inventory-system-public/x` を拾わない） | `$\|[^-]` の境界を落として public を拾う |
| C5 | F11 | CLI（自己点検） | S1-c の `old_namespace_pattern` の対（`-home-kosei-projects-inventory-system` を拾う、`-home-kosei-projects-inventory-system-public` を拾わない） | namespace の pattern が小文字を拾わない、または public を拾う |
| C5 | F10 | CLI（実 file） | 既存 T11（`:338`）: `.codex/rules/default.rules` に `$OLD_ROOT_PATTERN` が無い | rules に旧 clone の path（大文字・小文字）が入る（MU10） |
| C5 | F12 | CLI（実 file） | 既存 T13（`:368-369`）: DEV_SETUP の窓に `public_namespace`（小文字）がある | T13 が大文字を要求する（MU8）、DEV_SETUP だけ直して test を直さない |
| C5 | F11 | CLI（実 file） | 既存 T12（`:351-357`、`:361-367`）: live の文書と DEV_SETUP の窓に旧 clone の path・namespace が無い | `[Pp]` 化が live の文書の public の path を誤検出する（P7 で public は `exit 1`） |
| C6 | F13 | CLI（`grep -c`） | AC1 の `grep -c Projects .codex/rules/default.rules` が `0`、`grep -c '/home/kosei/projects/inventory-system-public'` が `29` | 置換の漏れ、置換が別の token に当たる |
| C6 | F13 | CLI | AC1 の classifier の出力（9 行 true、`unknown=true`）と `classify-changes.test.sh` | 分類を変えた（D1 を覆した場合は packet の訂正と test の行の追加） |
| C7 | — | CLI（`rg`） | AC2 の `rg -n 'routing fixture separately'` が 0 行、`rg -n 'D-101'` が 1 行以上、test が exit 0 | comment を直し忘れる、判定式を触る |

## State Lifecycle Matrix

UI・DB・cache・route の状態は無い。packet と frontmatter の検査の lifecycle（push → pre-push → hosted → helper）を書く。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| packet の Workflow State（key の重複） | 起草（key が互いに違う） | push の前 | pre-push の PK4 OK → hosted docs job OK → helper `parse_packet` OK | key を重複させる編集 | pre-push の PK4 が ERROR で push が止まる | 直して push し直す | — | pre-push を bypass しても hosted docs job が red、helper も止まる（3 箇所で同じ判定） | 直して push | AC3、S3 (a)〜(d)、「本 lane 自身の検査」の 1〜3 |
| packet の Phase（読み取り範囲） | 節に Phase | — | `check-workflow-git.sh` OK | 本文に `- Phase:` の箇条を足す | OK のまま（旧: 止まる） | 節の Phase を消す | — | `invalid tracked Phase`（旧: 本文の値で通る） | 節に書く | AC4、S4 (a)〜(c) |
| frontmatter（agent 定義） | `name`・`description`・`model`・`effort`（clean） | — | hook test OK | `permissionMode` / `mcpServers` / `hooks` を足す | hosted workflow job が red（classifier は `.claude/agents/*` で full） | key を消す | — | red のまま merge できない（`Merge gate` の workflow job） | 消して push | AC6、S6 (a)〜(d) |
| rules と DEV_SETUP の path | 大文字（実在と不一致） | — | 小文字（実在と一致、T11 / T13 OK） | 大文字や小文字の旧 clone を書く | T11 / T12 / T13 が red | — | — | — | — | AC1、MU8〜MU10 |

workflow-state の race（capture / server、stale head、broad / closure、manual / R4、hosted gate）は helper と record を変えないので当たらない（PK5 の判定式も不変。C2 の F5 の行が守る）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| Workflow State の `- key:` の行を読む経路 | `scripts/pr-gate.py:148-156`（helper、h2 の節、重複を拒む）、`scripts/doc-consistency-check.sh:942-951` `extract_workflow_field`（PK4、`head -1`）、`:1226-1301` PK4 の各検査、`scripts/check-workflow-git.sh:50`（Plan Commit）・Amendments の grep・`:160-161`（Evidence Mode）・`:165`（Phase） | S3（PK4 に重複の検査）、S4（`check-workflow-git.sh` の 4 つの読み取りを節に限る） | PK4 の `extract_workflow_field` の `head -1` と `extract_markdown_section` の `#{2,}` の終わりは変えない（D3 の残る差。別 change）。helper は変えない（D7） | C1・C2 の行 |
| 節の有無を見出しで判定する grep | `doc-consistency-check.sh:1003`（Test Design Matrix）・`:1052`（base_sections）・`:1063`（Contract Ledger）・`:1067-1068`（Spec Contract / Trace Matrix）・`:1130`（PK3 Contract Ledger）、`extract_markdown_section:834-835`（`#{2,}`）、`extract_markdown_h2_section:842-850`（`##`）、D-046 の Goal（h2）、PK4 の Plans.md の pointer（h2） | S5（6 箇所を `has_h2_section` に） | `extract_markdown_section` は抽出の規約で判定ではない（D5 の棄却案 (b)、Non-scope）。`rg -n '#\{2,\}' scripts/doc-consistency-check.sh` の残りが `:834`・`:835` の 2 行だけになる（AC5） | C3 の行 |
| frontmatter を YAML として読んで key を拒む | `scripts/tests/claude-hooks.test.sh:13-18`（唯一の実装）、`:37-45`（4 つの dir の走査）、`:249-310`（mutant） | S6（一覧に 2 key） | 走査する dir は変えない。`.claude-plugin` の拒否は別の判定（`:50-52`、変えない） | C4 の行 |
| 旧 clone の path / namespace の pattern | `scripts/tests/codex-safe-wrappers.test.sh:7`・`:56`・`:338`・`:351`・`:355`・`:359-360`・`:361-369` | S1-c（3 変数と感度の対） | T14・T15・HC-D8（path の境界・canonicalize・部分読み）は path の文字列と無関係で変えない。`live_files` の一覧は変えない | C5 の行 |
| home の path の表記 | `.codex/rules/default.rules`（29 行）、`docs/DEV_SETUP_CHECKLIST.md`（4 行）、`.codex/README.md`・`.codex/bin/*`・`AGENTS.md`・`CLAUDE.md`・`docs/TOOLING_SKILL_COMMANDS.md`（PR #134 で追従済み、`rg -n 'Projects'` 一致なし） | S1-a・S1-b | archive（`docs/archive/**`）と decision-log の旧 path は履歴（D-049「A 群は非変更」） | C6 の行、AC1 |

## Negative Paths

- missing input: `## Workflow State` が無い packet → PK4 の既存 ERROR（`必須セクション '## Workflow State' を欠いています`）、`check-workflow-git.sh` は Phase が空で `invalid tracked Phase`（S4 (b) の形）。
- invalid input: YAML として読めない frontmatter → 既存の fail-closed（`ruby` の例外で exit 非 0 → 拒む）。`permissionMode: plan`（公式の値だが D6 で拒む）。
- duplicate/ambiguous input: key の重複（S3 (a)・(b)）。`## Workflow State` が 2 つある packet → helper は `missing/ambiguous` で止まる（既存）。PK4 は最初の節を読む（既存。変えない）。`##` と `###` の両方（S5 (c)）。
- unknown reference: 本 packet の Matrix の link は `has_test_design_matrix_reference`（PK1）が見る（本 packet の Test Plan の link）。
- dependency missing: `ruby` が無い環境では hook test は既存の fail-closed（D-099、`2>/dev/null` の後の exit 非 0 → 拒む）。`rg` が無い環境は既存の前提（`run-workflow-tests.sh` の `rg --files`）。
- permission/write failure: fixture は `mktemp -d` と `$TMPDIR`。書けなければ test が止まる（既存）。
- dry-run side effect: 検査は読むだけ。`sed -i` は fixture の写しだけに掛ける（S5 (a)・(b) は `write_packet` の後の写し、本 repo の file ではない）。

## Boundary Checks

- threshold: 重複は 2 回以上（`uniq -d`）。1 回は通る。
- null/default: `- Key:`（値が空）は helper が key を保つ（`pairs` の値が空）。PK4 の必須 field の検査は空値を既存の ERROR にする（`[^[:space:]]` の要求）。重複の検査は値を見ない。
- empty/non-empty: 節が空（見出しだけ）→ 既存の `-z "$ws_section"` で ERROR。`check-workflow-git.sh` は Phase 空 → ERROR。
- min/max: 遷移記録の行数に上限は無い（key が違えばよい）。
- status/policy enum: Phase の 8 値（不変）。`permissionMode` の値は見ない（key の有無だけ）。
- wire type: Markdown の箇条の行、YAML の mapping の key、rules の文字列。
- internal type: bash の文字列、Python の dict、ruby の Hash。
- producer/consumer: packet の起草役 → PK4 / helper / `check-workflow-git.sh`。frontmatter の作者 → hook test。
- round-trip token: 同じ packet が pre-push・hosted・helper で同じ判定（AC3 の写しは PK4 ERROR と helper `duplicate packet fields` の両方）。
- precision/range: key の完全一致（空白を含む）。`[Pp]` の 2 文字だけの大小の違い。`$|[^-]` の境界。
- cross-language parse: bash の `sort | uniq -d` と Python の `len(pairs) == len(fields)` が同じ集合で同じ答え（S3 (a)〜(d) と AC3 の写しで両方を確かめる）。awk の h2 の抽出と Python の `(?=^## |\Z)` が同じ範囲（S4 (a)〜(c) と P3 の helper の出力）。

## Compatibility Checks

- old schema/input: 旧 template の packet（Spec Contract + Trace Matrix）は PK1 を通る（PR4-F1〜F11 の既存 case、AC5 の `2026-09-29-harness-pr5-gate-holes`）。D-039 前の archive（`2026-07-12-mechanical-workflow-slice2`）は明示 path で PK4 skip・PK1 緩和（case 13）。
- new schema/input: 新 template（Contract Ledger + Design Readiness）の packet は PK1 を通り、本 packet は全検査を通る（AC3・AC8）。
- output order: PK4 の ERROR の順序（必須 field → legacy → 重複 → Minimum / Human Gate → Phase → Plan Commit → Risk）は追加の位置で決まる。test は出力の有無だけを見る。
- optional field behavior: `Evidence Mode` / `Execution Mode` / `Branch` などの任意行は重複しなければ通る（既存の「その他の追加行は禁止しない」）。

## Data Safety Checks

- source-derived data: 無し（店の data を使わない）。
- generated outputs: 無し。
- secrets: 無し。rules の path は公開済みの home の path。
- local-only files: `$TMPDIR/ck189-*`、`.local/quality-check.log`。
- synthetic sample boundaries: fixture の packet・frontmatter・git repo は `mktemp -d` / `$TMPDIR` の中だけ。

## Main Wiring / Integration Checks

- helper connected to main path: `run-workflow-tests.sh` が 4 本の test を既に呼ぶ（`rg -n 'doc-consistency-plan-packet|workflow-git-checks|claude-hooks|codex-safe-wrappers|reading-order-drift' scripts/tests/run-workflow-tests.sh` → 5 行）。hosted の workflow job（`ci.yml:281`）と docs job（`:306`・`:311`）、pre-push（`scripts/pre-push.sh:223`・`:240`）が新しい script を回す。
- output reaches manifest/report: PK4 / PK1 の ERROR は checker の `[ERROR]` の行と exit 1 で pre-push と hosted に届く。
- effective config reaches runtime: `.codex/rules/default.rules` は Codex Desktop が読む（本 lane では実機で確かめない。packet の Ordinary Operation の未確認の行）。
- CLI arg reaches implementation: `--target plan <path>` の明示 path で PK1〜PK3 が archive にも掛かる（AC5 の 3 本）。

## Mutation-style Adequacy Questions

mutation は対象経路の観測結果を変えるものを選び、写し（AC7 の `$TMPDIR/ck189-mut`）に実注入して red を確かめる。

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? — fixture の key（`Human Gate`、`plan-draft → plan-gate（2026-01-01）`）は出力の message に現れる literal で、S3 (a)・(b) はその literal を出力に求める。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? — 当たらない（状態の snapshot が無い）。
- If a key branch is inverted, which test fails? — 重複の有無の分岐: S3 (a)（red になる側）と S3 (c)（通る側）の対。節の有無の分岐: S4 (a)（通る側）と S4 (b)（止まる側）の対。`##` の判定: S5 (a)・(b)（止まる側）と S5 (c)・既存 PR4-F1（通る側）の対。key の一覧: S6 (a)〜(c)（止まる側）と既存の clean fixture（通る側）の対。
- If a threshold comparison changes, which test fails? — `uniq -d` を `uniq -u` にすれば S3 (a)・(b) が通ってしまい red（期待は exit 非 0）、S3 (c) が止まって red。
- If a guard is removed, which test fails? — MU1（S3 (a)・(b)）、MU2・MU3（S4 (a)・(b)）、MU4・MU5（S5 (a)・(b)）、MU6・MU7（S6 (a)〜(c)）、MU8（T13）、MU9（S1-c の感度の行）、MU10（T11）。
- If an output field is omitted, which test fails? — PK4 の ERROR の message から key を省けば S3 (a)・(b) の `assert_contains`（`Human Gate` / 遷移の key）が red。
- If output order changes, which test fails? — 当たらない（有無だけを見る）。
- If dry-run performs a side effect, which test fails? — 当たらない（検査は読むだけ。`sed -i` は写し）。
- If a JSON number crosses JavaScript safe integer range, which test fails? — 当たらない。
- If a state token is round-tripped through browser/client code, which test fails? — 当たらない。

## Residual Test Gaps

- PK4 の節の終わり（`#{2,}`）と helper（`## `）の差: Workflow State の中に `###` を置いた packet では PK4 の重複の検査が短い範囲しか見ない（helper は止めるので fail-closed は残る）。template に `###` は無く、本 lane は `extract_markdown_section` を変えない（D3 の残る差、Non-scope）。
- `check-workflow-git.sh` は helper の `markdown()`（HTML comment と code fence の除去）を写さない。Workflow State の中の comment に `- Phase:` を書けば helper は無視し `check-workflow-git.sh` は読む（止まる向き。template に comment は無い）。
- Windows の Codex Desktop が小文字の rules で auto-allow することは実機でしか確かめられず、本 lane では確かめない（D-101、packet の Ordinary Operation の未確認の行）。
- `permissionMode` / `mcpServers` が skill / command file の frontmatter で効かないことは公式の表の不在からの推定で、効くようになっても検査は先に止める（D6）。
- MU2 と MU3 は同じ sed の形（file 全体の読み取り）に戻す mutation で、`check-workflow-git.sh` の実装が 1 つの抽出を 4 つの読み取りで共有するなら、MU2 の注入は Plan Commit / Amendments の読み取りも同時に戻す。S4 (c) はその場合も red になる（前文の dangling の Plan Commit を `grep -m1` が先に拾って `rev-parse` が失敗し exit 非 0）。Plan Commit の読み取りだけを戻す mutation は Matrix に置かない（Scope の D4 の付随で、G2 で (a) に戻れば S4 (c) ごと消える）。
