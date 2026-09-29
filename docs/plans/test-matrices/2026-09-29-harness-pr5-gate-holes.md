# Test Design Matrix: ハーネス刷新 PR5 gate の穴を塞ぐ

Plan Packet: [2026-09-29-harness-pr5-gate-holes.md](../2026-09-29-harness-pr5-gate-holes.md)。`D1`〜`D11` は packet の `SPEC-WF-HARNESS5-D1`〜`D11` の略記。行番号は main `7ac96d9e` のもの。

## Risk

Risk: R3

## Contracts Under Test

- D1: classifier は `.claude/agents/*` を実行制御（full）、`docs/quality/review-checklist.md` を policy docs（docs＋workflow）に分類し、他の path の分類を変えない。
- D2: helper は実行中の file が PR の base の `scripts/pr-gate.py` と bytes で一致するときだけ、status・capture・record・ready・merge を進める。
- D3: `.claude/agents/{writer,reviewer}.md` が tracked で、effort medium、reviewer は編集の tool なし。
- D4: `.claude/settings.json` の `env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` は `"1"`。
- D5: `local-ci.sh full` は symlink の `node_modules` で gate の前に止まる。changed は止めない。
- D6: pre-push は open の PR が無く merged の PR がある branch への push を止める。照会失敗も止める。
- D7: pre-push は push 範囲の file の未 stage の変更に WARN を出し、exit code を変えない。
- D8: review の record は `--reviewed-head` を必須にし、capture の head と一致しなければ書かない。
- D11: 既存の helper・classifier・pre-push・local-ci・hook の契約を変えない。

## Failure Modes

- `.claude/agents/*.md` の変更が R1 で packet 無しに通る、Minimum 2 が掛からない（D1）。
- `docs/quality/review-checklist.md` の変更で workflow 回帰が走らない（D1）。
- 無関係の docs まで workflow=true になり、docs の PR が重くなる（D1 の過剰）。
- `pr-gate.py` を変えた PR が変更後の helper で record・Ready・merge できる（D2）。照合が一部の操作にしか掛からない（D2）。
- base と同じ helper が止まる（D2 の過剰）。
- 定義が ignore されて tracked にならない、effort が medium でない、reviewer が Edit を持つ（D3）。
- depth の設定が消えても test が green（D4）。
- symlink の `node_modules` のまま `npm ci` が走り、symlink 先が空になる（D5）。changed や実 dir の full まで止まる（D5 の過剰）。
- merged の branch への push が通る（D6）。open の PR の branch や PR の無い branch への push が止まる（D6 の過剰）。照会の失敗で push が通る（D6）。
- 未 stage の変更で push が止まる（D7 の過剰）。push 範囲の外の変更でも WARN が出る（D7 の雑音）。
- 是正の push の後の capture で、監査していない head の broad・closure が record される（D8）。
- 既存の record・capture・Ready・merge・rules・CI の判定が変わる（D11）。

## Test Matrix

- 既存の test を回帰の証拠として引く前に、`rg` でその test の実在を確かめた（2026-09-29、起草役）: `scripts/tests/classify-changes.test.sh:46-52`・`:92-99`、`scripts/tests/pr-gate.test.py` の `CLI.test_packet_double_audit_cli`・`RecordLifecycle`、`scripts/tests/local-ci.test.sh:25-56`、`scripts/tests/pre-push.test.sh:56-82`・`:119-139`・`:185-194`、`scripts/tests/claude-hooks.test.sh:13-26`・`:68-81`。
- helper の test の境界: `CLI` は `scripts/pr-gate.py` を実 process で起動し、fake の `gh`（Python の script、`FAKE_GH`）が GitHub API の argv と endpoint を受ける。contents は fixture の `contents`・`snapshots` から返る。D2 の base の `pr-gate.py` はこの `contents` に置く（実物の text を既定、不一致の場面だけ 1 byte 変える）。
- pre-push の test の境界: fake の `gh` は `--jq` の式を fixture の JSON に `jq` で当てる（実 gh の出力形を再現）。npm・cargo は呼出しを記録する stub。
- local-ci の test の境界: fixture の repo に local-ci.sh と classifier の実物を置き、他の script と npm・cargo は stub。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1 | agent 定義が一般 docs になる | unit（classifier） | `classify-changes.test.sh` の新しい `.claude/agents/reviewer.md`・`.claude/agents/sub/writer.md` の full の loop | `.claude/agents/*` が `:55` に無い、または `:59`（policy）に置かれる（`rust=true` の assert が落ちる。MU1） |
| D1 | review-checklist で workflow 回帰が走らない | unit（classifier） | 同 test の `docs/quality/review-checklist.md` の policy の assert | `:59` に無い（MU2） |
| D1 | 無関係の docs が workflow になる | unit（classifier） | 同 test の `docs/backlog.md`・`docs/quality/other.md` の `workflow=false` | pattern を `docs/quality/*` のように広げる |
| D1 | hook test の classify の検査から agent 定義が漏れる | integration（hook audit） | `claude-hooks.test.sh` の `validate_audit_wiring` と、classifier から `.claude/agents/*` を外した fixture の負例 | 検査の path に `.claude/agents/reviewer.md` が無い、または負例が green |
| D2 | 変更後の helper が自分を検査できる | CLI | `HelperVersion.test_mismatch_blocks_every_action`（status・capture・record・ready・merge、base の `pr-gate.py` を 1 byte 変えた fixture） | 照合が無い（MU3）、一部の操作にしか掛からない（MU4）。assert: exit 1、stderr に `helper differs from base` と base SHA、fake gh の呼出しに `pr` の mutation と comment の POST・PATCH が無い、capture の file が増えない |
| D2 | base と同じ helper が止まる | CLI | `HelperVersion.test_same_bytes_passes`（既存の `test_status_capture_ready_merge` の形） | bytes の比較でなく改行の正規化や別 file と比べる、base でなく head から取得する |
| D2 | base の取得失敗で進む | CLI | `HelperVersion.test_base_fetch_failure_exit_2`（fake の `http_error_path` に `contents/scripts/pr-gate.py`） | 取得の失敗を一致とみなす |
| D3 | 定義が tracked でない、中身が違う | schema（CLI の rg / git） | AC7 の `git check-ignore`・`git ls-files`・`rg '^effort: medium$'`・`rg '^disallowedTools: …'` | `.gitignore:116` が残る、frontmatter の値が違う |
| D4 | depth の設定が消えても green | integration（hook audit） | `claude-hooks.test.sh` の `validate_inventory` の jq と、env を消した fixture の負例 | jq の検査が無い（MU5） |
| D5 | symlink 先が空になる | CLI（local-ci） | `local-ci.test.sh` の symlink の full の場面 | 検査が無い（MU6）。assert: exit 非 0、evidence に `ERROR=node_modules is a symlink`・`RESULT=FAIL`、`GATE=` の行が無い、stub の呼出し記録が空、`target/marker` が残る |
| D5 | changed まで止まる | CLI（local-ci） | 同 test の symlink の changed の場面 | 条件から `MODE == full` を外す（MU7）。assert: exit 0、ERROR が無い |
| D5 | 実 dir の full まで止まる | CLI（local-ci） | 同 test の実 dir の full の場面（他の gate は stub） | `-L` でなく `-e` 等で判定する。assert: ERROR が無く `GATE=frontend-install` と `npm ci` の呼出しがある |
| D6 | merged の branch への push が通る | CLI（hook） | `pre-push.test.sh` の `FAKE_MERGED_HEAD=feature` の場面 | merged の照会が無い（MU8）。assert: exit 非 0、log の最後が `FAIL merged-pr`、stderr に `already merged` と `new branch` |
| D6 | open の PR が再利用の branch で止まる | CLI（hook） | 同 test の open の Draft と merged の併存の場面 | open より先に merged を見る。assert: exit 0 |
| D6 | PR の無い branch が止まる | CLI（hook） | 既存の `run_hook true`（fake の既定は merged も `[]`） | merged の結果の空を merged とみなす |
| D6 | 照会失敗で push が通る | CLI（hook） | 同 test の merged の照会だけ失敗する場面（fake に `FAKE_MERGED_EXIT`） | 失敗を無視する（MU9）。assert: exit 非 0、`FAIL ready-state-lookup` |
| D7 | 未 stage の変更で push が止まる | CLI（hook） | 同 test の push 範囲の `src/example.ts` の未 stage の編集の場面 | WARN を `fail_gate` にする（MU10）。assert: exit 0、stderr に `WARN: unstaged changes in pushed files` と path |
| D7 | 範囲の外で WARN が出る | CLI（hook） | 同 test の push 範囲の外の file（`README.md`）の未 stage の編集の場面 | 共通部分でなく全体の `git diff` を見る。assert: WARN が無い |
| D8 | 監査していない head の broad が record される | CLI | `ReviewedHead.test_broad_mismatch_rejected`（capture は H、`--reviewed-head` は別の SHA） | 一致の判定が無い（MU11）。assert: exit 1、fake の `comments` が不変 |
| D8 | closure で同じ誤り | CLI | `ReviewedHead.test_closure_mismatch_rejected`（server に broad があり、head が変わった後の capture） | 判定が broad だけ（MU12） |
| D8 | 引数の欠落で進む | CLI | `ReviewedHead.test_missing_reviewed_head_exit_2` | 欠落を許す |
| D8 | 正しい順序が止まる | CLI | `ReviewedHead.test_matching_head_records`（既存の `test_packet_double_audit_cli` に `--reviewed-head` を足した形） | 一致でも拒む、SHA の比較の向きを誤る |
| D11 | 既存の契約が変わる | regression | `python3 scripts/tests/pr-gate.test.py` 全体、`classify-changes.test.sh`・`local-ci.test.sh`・`pre-push.test.sh`・`claude-hooks.test.sh` の既存の場面 | 既存の assert のどれかが落ちる |

## State Lifecycle Matrix

workflow の状態（review の record）に触るため、record の lifecycle を書く。UI・DB・cache の状態は無い。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| review の record（D8） | record なし | broad を pending で record（`--reviewed-head` = capture の head） | 必要数の broad と裁定で pass | 是正の push で head が変わり、broad は旧 head のまま（closure が要る） | 新しい head で capture し直す | closure を `--reviewed-head` = 新しい head で record | 旧い helper の期間（本 lane 自身）は順序を手で守る | 監査した head と capture の head が違う → exit 1、書かない | 監査した head で record し直すか、現在の head を監査し直す | `ReviewedHead` の test |
| helper の版（D2） | branch の helper = base | — | 一致して進む | main が helper を更新、または PR が helper を変える | — | base の版の写しで実行 | 単段 merge の後は branch の helper が base と一致しうる | 不一致 → exit 1、何も書かない。取得失敗 → exit 2 | 写しか単段 merge の後に再実行 | `HelperVersion` の test |

stale head/base・broad/closure の race は既存の `RecordLifecycle`・`test_offline_bad_repo_input_and_race` が持ち、本 lane は変えない（D11）。manual/R4 と hosted gate の判定も変えない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| main 側から取得して PR の変更を信頼しない（classifier `:220`、policy `:352`） | `scripts/pr-gate.py` の `contents()` の呼出し全部（classifier・packet・archive・policy） | helper 本体（D2） | packet・archive は head から読む（PR の内容そのもの） | `HelperVersion` |
| 照会失敗は止める（pre-push の Ready の照会 `:98-101`） | `scripts/pre-push.sh` の `gh` の呼出し | merged の照会（D6） | — | S9 の照会失敗の場面 |
| 実行制御の path（`.claude/settings.json`・`.claude/hooks/*`） | `classify-changes.sh:55`、merge-evidence `:53`、`claude-hooks.test.sh:78` | `.claude/agents/*`（D1） | `.claude/{rules,commands,skills}` は policy のまま（実行の設定を持たない） | S2、S11 |
| worktree の symlink の運用 | `scripts/local-ci.sh` の `npm` の呼出し（`:224` の `npm ci` と `:226-231` の `npm run`） | `npm ci` の前の検査（D5） | `npm run` は `node_modules` を消さない | S7 |

## Negative Paths

- missing input: `--reviewed-head` の欠落（exit 2）。base の `pr-gate.py` の取得失敗（exit 2）。
- invalid input: `--reviewed-head` が SHA でない（exit 2）。
- duplicate/ambiguous input: open と merged の PR が同じ branch にある（open を優先）。
- unknown reference: base の `pr-gate.py` が無い（404 → exit 2）。
- dependency missing: `gh` が無い（既存どおり push を止める）。
- permission/write failure: helper の不一致で何も書かない。local-ci の symlink で gate を走らせない。
- dry-run side effect: status は read-only のまま（不一致でも comment を書かない）。

## Boundary Checks

- threshold: bytes の完全一致（1 byte 違いで不一致）。
- null/default: fake の merged の既定は `[]`。settings の env が無い → hook test が red。
- empty/non-empty: push 範囲と未 stage の共通部分が空なら WARN を出さない。
- min/max: 該当なし。
- status/policy enum: pre-push の outcome に `merged-pr` を足す（`FAIL merged-pr`）。
- wire type: contents の base64、`gh pr list` の JSON、full SHA。
- internal type: bytes、SHA の文字列。
- producer/consumer: GitHub contents → `Gate.requirements()`、`gh pr list` → `pre-push.sh`。
- round-trip token: 該当なし（record の wire は変えない）。
- precision/range: 該当なし。
- cross-language parse: 該当なし。

## Compatibility Checks

- old schema/input: RecordV1・capture・既存の record は変えない。review の record の CLI は `--reviewed-head` が必須になり、旧い呼び方は exit 2（merge-evidence の実行手順を同時に直す）。
- new schema/input: `.claude/settings.json` の `env` の key。
- output order: classifier の出力の key の順は変えない。
- optional field behavior: 該当なし。

## Data Safety Checks

- source-derived data: なし。
- generated outputs: なし。
- secrets: なし。
- local-only files: helper の capture（`.local/pr-gate/`）、local-ci の evidence（`.local/ci-evidence/`）は fixture の中だけで作る。
- synthetic sample boundaries: fixture の `node_modules` の symlink の先は fixture の dir だけ。本 repo の `node_modules` を触らない。

## Main Wiring / Integration Checks

- helper connected to main path: 自己照合は `requirements()` の先頭で、全操作が `snapshot()` から通る（`HelperVersion` が 5 操作を叩く）。
- output reaches manifest/report: local-ci の ERROR は evidence の log に、pre-push の WARN は stderr に出る。
- effective config reaches runtime: agent 定義と depth の設定は本体の checkout の同期の後に効く（packet の P3、AC7 の merge 後の項目）。
- CLI arg reaches implementation: `--reviewed-head` は argparse から `record()` に届く（`ReviewedHead` の CLI の test）。

## Mutation-style Adequacy Questions

mutation は packet の Test Plan の MU1〜MU12。実注入の手順は packet の AC9。

- If a key branch is inverted: D2 の一致の判定を反転 → `HelperVersion` の一致・不一致の両方の test が red。
- If a guard is removed: MU3・MU6・MU8・MU11。
- If a threshold comparison changes: D2 の比較を正規化した文字列にする → 1 byte（末尾の改行）違いの fixture で `test_mismatch_blocks_every_action` が red。
- If an output field is omitted: WARN の path の出力を消す → S9 の assert（path を含む）が red。
- If tracked Workflow State stores the current PR HEAD: 本 lane は tracked に head を書かない（`--reviewed-head` は CLI の入力で、record の head と同じ値）。
- mock の値と正本の期待値の区別: fixture の base の `pr-gate.py` は実物の text（`ROOT/scripts/pr-gate.py`）を既定にし、不一致の場面だけ 1 byte 変える。合成の定数と偶然一致して green になる形にしない。
- dry-run の副作用: status の不一致で comment・mutation の呼出しが無いことを fake の `calls` で確かめる。
- JSON number / state token の round-trip: 該当なし。

## Residual Test Gaps

- 照合の code を消した helper を実行する場合は D2 が守らない（差分に出るので Double Audit が見る）。
- 生成器（`src-tauri/src/bin/generate_*`、`lib.rs` の bindings の export）の判定を緩める変更は R1 と申告すれば packet 無しで通る（D10）。kickoff の問いと Final Review が見る。
- 座組表の effort と agent 定義の値の一致は自動で照合しない（どちらかを変える PR は D1 で Minimum 2 が掛かる）。
- agent 定義と depth の設定の実効は merge 後の run でしか確かめられない（AC7、P3）。
- PR の base の SHA が古い場合、helper が要求する版は古い main の版になる（message の command がその版を示すので進める。安全は弱まらない）。
