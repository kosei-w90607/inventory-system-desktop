# Test Design Matrix: 手続きの軽量化（ハーネス刷新 PR4）

Plan Packet: [2026-09-29-harness-pr4-lightweight.md](../2026-09-29-harness-pr4-lightweight.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-WF-HARNESS4-D1: template の構成（Contract Ledger・Design Readiness・R2 の短い本体、Consultation Relay・Findings Freeze 行・review-only skip・`independent-review` の撤去、import / 描画の表、L3 の fixture、先行 round の結果は Review Response にだけ）。
- SPEC-WF-HARNESS4-D2: PK1 は R3/R4 に `## Contract Ledger` か `## Spec Contract` + `## Trace Matrix` を求める。R4 の review-only skip の ERROR と PK3 の skip の WARN は無い。PK3 の Trace の WARN は Ledger → Trace Matrix の順に読む。`## Contract Ledger` があるときはデータ行 1 件以上を求める（0 件は ERROR）。
- SPEC-WF-HARNESS4-D3: PK4 は `- Findings Freeze:` 行を求めない。active packet の `Plan Commit` の値全体（末尾の空白・タブを削らない）は `pending` か `[0-9a-f]{40}` の完全一致。
- SPEC-WF-HARNESS4-D4: WER の要求・検査・template・Skill が無い。
- SPEC-WF-HARNESS4-D5〜D13: DEV_WORKFLOW・code_review・template・Skill・MANUAL・AGENTS の文（rg の anchor で確かめる。packet の AC5〜AC17）。
- SPEC-WF-HARNESS4-D14: 安全の境界（独立 review の本数、PK5、Human Gate、R4 の Minimum 2 と `r4`、helper、K3 の 4 項目）は変わらない。

## Failure Modes

- FM1: 新 template の R3 packet が PK1 で ERROR になる（Ledger を R3 の節と認めない）。
- FM2: 旧 template の R3 packet（本 packet・PR5 の packet）が ERROR になる（旧い組の受理漏れ、Findings Freeze 行の要求の残り、Ledger のデータ行の ERROR が旧い組の Trace Matrix に及ぶ）。
- FM3: Ledger も旧い組も無い R3 packet が通る（受理を緩めすぎる）。旧い組の片方だけで通る。
- FM4: `Plan Commit` に確定待ちの注記・短い SHA・大文字・注記付き・末尾の空白やタブの値が入っても PK4 が通し、commit 後に PK5 が初回値として固定する、または helper だけが record の時点で拒む（教訓 42 の再発）。
- FM5: `pending` か 40 桁の正しい値が PK4 で ERROR になる（過検出）。
- FM6: R4 の review が弱まる（R4 skip の検査を消した結果、R4 で Minimum 1 の packet が通る）。
- FM7: PK3 が新 template の Ledger を読まず、test token の実在の WARN を失う、または「Trace Matrix に data row が無い」の誤 WARN を出す。
- FM8: WER の検査を消したつもりで header や WARN が残る、または消した template・Skill への link が切れる。
- FM9: 縮約で安全の規則（K3 の 4 項目、goal-drift signal、Double Audit、承認依頼の counter）が消える。
- FM10: 見出しの改名で inbound の anchor（Skill・subagent-review-packet・MANUAL）が切れる。
- FM11: 新 template でデータ行 0 件の Contract Ledger が PK1・PK2 を通る（R3 の契約の一覧の強制が WARN に弱まる）。
- FM12: PK4 の書式検査が archive の明示 path に及ぶ。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- fixture は `scripts/tests/doc-consistency-plan-packet.test.sh` の `write_packet` が tmpdir に生成する（tracked の fixture file を増やさない）。本物の checker を tmpdir の repo で走らせるので、置換される境界は無い（`rg` の shim は argv を記録するだけで実 `rg` に委ねる、同 file の `rg_shim_dir`）。
- `Would fail if...` は、壊れた実装が観測できる入力と結び付ける。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1・D2 | FM1 | CLI（fixture） | PR4-F1 新 template の R3 packet | PK1 が Ledger を R3 の節として受けない（MU1）、PK4 が Findings Freeze 行を求める（MU7）、PK3 が Trace Matrix だけを読む（MU8） |
| D2 | FM2 | CLI（fixture） | PR4-F2 旧 template の R3 packet（既定の fixture） | 旧い組の経路を外す |
| D2 | FM2 | CLI（fixture） | PR4-F2b 旧 template で Trace Matrix が header と区切り行だけ | データ行の ERROR が Trace Matrix にも及ぶ（MU13）、PK3 の WARN が消える |
| D3 | FM2 | CLI（fixture） | PR4-F3 Findings Freeze 行だけが無い旧 template の R3 packet | Findings Freeze 行の要求が残る（MU7） |
| D2 | FM3 | CLI（fixture） | PR4-F4 Ledger も旧い組も無い R3 | 要求そのものが消える（MU2） |
| D2 | FM3 | CLI（fixture） | PR4-F4b Spec Contract だけの R3 | 旧い組の条件が OR になる（MU3） |
| D3 | FM4 | CLI（fixture） | PR4-F5 `Plan Commit: TBD（plan-approved で確定）`（Phase plan-gate） | 書式検査が無い（MU4）、書式の文言が変わる |
| D3 | FM5 | CLI（fixture） | PR4-F6 `pending`（plan-gate）と 40 桁の小文字 hex（implementing） | 正規表現が 40 桁を受けない、`pending` を拒む |
| D3 | FM4 | CLI（fixture） | PR4-F7 7 桁・39 桁・41 桁・大文字 40 桁・`pending（注記）`（plan-gate）・40 桁+`（注記）`・40 桁+末尾空白・40 桁+末尾タブ | 先頭 token だけを見る（MU5）、`{7,40}` に緩める（MU6）、検査が無い（MU4）、末尾を削ってから見る（MU10） |
| D2 | FM11 | CLI（fixture） | PR4-F11 データ行 0 件の Ledger | データ行の検査が無い（MU11） |
| D3 | FM12 | CLI（fixture） | PR4-F12 archive 明示 path の `abc1234` | 書式検査が archive の skip より前にある（MU12） |
| D5・D14 | FM6 | CLI（fixture） | PR4-F8 R4 + `Review-only skipped because:`（Minimum 2・`r4`）は ERROR なし、R4 + Minimum 1 は ERROR | R4 skip の検査が残る（行で ERROR）、PK4 の R4 の Minimum の検査が消える |
| D2 | FM7 | CLI（fixture） | PR4-F9 Ledger に存在しない `test_` token と placeholder | PK3 が Ledger を読まない（MU8） |
| D4 | FM8 | CLI（fixture） | PR4-F10 Retired 節の無い 2026-07-15 以降の WER | `check_new_wer_retired_rules` の呼出しが残る |
| D14 | FM9 | drift（source） | section 17（既存、3 分類の assert だけを外す） | K3 の 4 語・`goal-drift signal`・`one-shot irreversible`・`介入 N`・`予算 M`・承認依頼の counter のどれかが消える（MU9） |
| D14 | FM9・FM10 | drift（source） | section 19（既存、実 repository の checker の self-pass） | link 検査（切れた link）、PK 検査が実 repo で ERROR |
| D5〜D13 | FM9・FM10 | CLI（rg） | packet の AC5〜AC17 の file ごとの `rg` | 移し先に anchor が無い、旧い語が残る |
| D14 | FM6 | CLI | `python3 scripts/tests/pr-gate.test.py`（既存、`run-workflow-tests.sh` の中） | helper の R4・Minimum の判定を触ってしまう（本 lane は helper を変えない） |

## State Lifecycle Matrix

packet の状態の検査（PK4 の Phase と `Plan Commit` の組）に書式の検査を足す。helper の record・capture の状態は変えない。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `Plan Commit` の値 | plan-draft で `pending` | plan-gate で `pending` | plan-approved で 40 桁 | — | — | 実装中も 40 桁（PK5 が commit 履歴の初回値を固定） | — | 書式外の値（末尾の空白・タブを含む）は PK4 の ERROR（PR4-F5・F7） | 値を直して再実行 | PR4-F5〜F7 |
| 旧 template の active packet | 旧い組と Findings Freeze 行を持つ | — | 新しい checker で exit 0 | — | — | main の取込みの後も exit 0 | — | — | — | PR4-F2・F3、AC3 |

For workflow-state changes, cover capture/server races, stale head/base, broad/closure, manual/R4 and hosted gate: 本 lane は helper を変えないので、既存の `pr-gate.test.py` がそのまま守る（AC19 の `run-workflow-tests.sh`）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `Plan Commit` の SHA の書式 | `scripts/pr-gate.py:19`（`SHA`）・`:171-178`、`scripts/check-workflow-git.sh:52-61`・`:90`（Amendments は `[0-9a-f]{7,40}` で拾う）、`scripts/check-workflow-git.sh:53`（末尾空白を削る）、`scripts/pr-gate.py:72-73`（`fullmatch`）・`:147-155`（末尾を保つ） | PK4 に helper と同じ `[0-9a-f]{40}`。値は末尾を削らずに照合（helper と同じ集合。PK5 より厳しい） | Amendments の書式（起きた失敗が無い、helper が `sha()` で拒む）。check-workflow-git の Amendments の抽出（PR5 と無関係だが本 lane の非目的） | PR4-F5〜F7 |
| 節の見出しの判定 | PK1（`:1050-1054`）、`has_test_design_matrix_reference`（`:1000-1007`）、`extract_markdown_section`（`:830-839`） | Ledger の判定に同じ見出しの正規表現 | — | PR4-F1・F4・F4b |
| Trace の表の読み | `trace_matrix_data_rows`（`:962-980`） | Ledger → Trace Matrix の順 | — | PR4-F1・F9 |
| 旧い語の参照（review-only・Contract Coverage Ledger・Design Intent Trace・Design Sources・Findings Freeze・WER） | `rg --hidden` で `.agents`・`.claude`・`.github`・`docs`（archive を除く）・`scripts`・`AGENTS.md`（起草時に全数、packet の「範囲の候補の確認」と Non-scope） | S4・S7・S9〜S15 | archive・decision-log の過去の本文・`docs/function-design/65-inventory-record-traceability.md:294`・`.claude/commands/check.md:5`（packet の Non-scope） | AC7・AC16 |
| DEV_WORKFLOW の inbound anchor | `rg --hidden -o "DEV_WORKFLOW\.md#…"`（Skill 2 本、subagent-review-packet、MANUAL、decision-log） | 見出しを残す（AC14）。`#問い合わせの行き先` は MANUAL の link を直す | decision-log D-090 の過去の link（link 検査は anchor を見ない） | AC11・AC14 |

## Negative Paths

- missing input: R3 packet に Ledger も旧い組も無い（PR4-F4）。
- invalid input: `Plan Commit` の書式外、末尾の空白・タブ（PR4-F5・F7）。
- duplicate/ambiguous input: Ledger と旧い組の両方がある packet → 受理（どちらかで足りる。PR4-F1 の変形として既定の fixture に Ledger を足した場合も exit 0 を 1 件確かめる）。
- unknown reference: Ledger の `test_` token が repo に無い（PR4-F9、WARN）。
- dependency missing: 該当なし（checker の依存は変えない）。
- permission/write failure: 該当なし（read-only の検査）。
- dry-run side effect: 該当なし。

## Boundary Checks

- threshold: `Plan Commit` の桁数 39 / 40 / 41（PR4-F7・F6）、末尾 1 文字の空白（40 桁の判定が末尾で崩れる境界）。
- null/default: `Plan Commit` が空は既存の PK4 の field 欠落の ERROR（section 21）。
- empty/non-empty: Ledger の表にデータ行が無い → PK1 の ERROR（PR4-F11）。旧 Trace Matrix の空は従来どおり PK3 の WARN（PR4-F2b）。
- min/max: 7 桁（下限の旧案）と 40 桁。
- status/policy enum: 該当なし（Phase enum は変えない）。
- wire type: 該当なし。
- internal type: 該当なし。
- producer/consumer: packet（producer）と PK1・PK3・PK4（consumer）。
- round-trip token: 該当なし。
- precision/range: 小文字 hex 40 桁の完全一致（大文字・末尾空白は ERROR、helper と同じ）。
- cross-language parse: bash の checker と Python の helper が同じ集合を受ける（PR4-F6・F7 と `scripts/pr-gate.py:19`）。

## Compatibility Checks

- old schema/input: 旧 template の packet（Spec Contract・Trace Matrix・Design Intent Trace・Contract Coverage Ledger・Consultation Relay・Findings Freeze 行・review-only skip の行・relay の上限の行）→ 受理（PR4-F2・F3・F8、AC3）。Trace Matrix が空の旧 packet → 受理と PK3 の WARN（PR4-F2b）。
- new schema/input: 新 template の packet → 受理（PR4-F1）。
- output order: checker の出力の header の順（PK1〜PK4・PK6・D-046）は変えない。WER の header だけ消える（PR4-F10）。
- optional field behavior: `Branch`・`Evidence Mode`・`Execution Mode` の任意行の扱いは変えない（既存 section 5・24）。

## Data Safety Checks

- source-derived data: なし。
- generated outputs: なし（生成物を再生成しない）。
- secrets: なし。
- local-only files: `$TMPDIR` の checker の写し（AC3）と mutation の写し（AC18）。
- synthetic sample boundaries: fixture は合成の packet 本文と合成の SHA。

## Main Wiring / Integration Checks

- helper connected to main path: checker は `scripts/pre-push.sh`・`scripts/local-ci.sh`・hosted の docs job から呼ばれる（変えない）。design mode と plan mode の両方の呼出しから `check_new_wer_retired_rules` を消す（`:1929`・`:1984`）。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: `--target plan <file>` の経路（AC3）。

## Mutation-style Adequacy Questions

mutation は対象経路の観測結果を変えるものを選び、実注入で red を確かめる（packet の AC18、`$TMPDIR` の写し）。

- MU1〜MU9 は packet の Test Plan のとおり。
- MU10〜MU13 は packet の Test Plan のとおり。
- oracle の独立性: fixture の期待（ERROR の文言の断片）は checker の文言から写すが、判定の正しさは「入力の形 → exit と header」で見る。書式の期待値は helper の `SHA`（`scripts/pr-gate.py:19`）という独立の正本から取る。
- 空集合の期待だけで kill を主張しない: PR4-F9 は WARN が「出る」側、PR4-F1 は WARN が「出ない」側を持ち、MU8 は両方で観測できる。
- If a key branch is inverted, which test fails? 旧い組の AND/OR（MU3 → PR4-F4b）。
- If a guard is removed, which test fails? 書式検査（MU4 → PR4-F5・F7）、Ledger の要求（MU2 → PR4-F4）、Ledger のデータ行（MU11 → PR4-F11）、末尾の strip（MU10 → PR4-F7）、archive の skip の順序（MU12 → PR4-F12）、旧い組へのデータ行の検査の波及（MU13 → PR4-F2b）。
- If a threshold comparison changes, which test fails? `{7,40}`（MU6 → PR4-F7）。
- If an output field is omitted, which test fails? K3 の語（MU9 → section 17）。

## Residual Test Gaps

- 文の縮約（Design Phase・Contract Audit・Wave・Draft・closeout）の意味の保持は anchor の `rg` と Double Audit の人の目で見る。語が残っても意味が変わる縮約は機械では捉えない（処置表を Final Review の対象にする）。
- Owner Effort Budget の扱い（上限に届くときの諮り方）は文書の規則で、機械の検査が無い（今も無い）。
- 受理 P1/P2 の固定の規則は review の規律で、checker は検査しない（試行の件数が少なく、機械化の根拠が無い）。
