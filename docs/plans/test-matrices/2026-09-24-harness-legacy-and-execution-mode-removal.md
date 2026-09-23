# Test Design Matrix: 旧証跡方式（legacy）と Execution Mode の撤去

[Plan Packet](../2026-09-24-harness-legacy-and-execution-mode-removal.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-WF-HARNESS1-D1: legacy の撤去（`Evidence Mode` 行は任意・値は github のみ、legacy field 3 種の拒否、Phase 8 値）。
- SPEC-WF-HARNESS1-D2: Execution Mode の撤去（任意・未評価・承認時 snapshot の比較対象外・R3 UI の Minimum 分岐なし）。
- SPEC-WF-HARNESS1-D3: `check-workflow-git.sh` は PK5 と full history だけを検査し、STATECAP / backtrack / Rebase Map を持たない。
- SPEC-WF-HARNESS1-D4: PK4 は `Findings Freeze` 行を要求しない。
- SPEC-WF-HARNESS1-D5: merge gate の中核の維持。
- SPEC-WF-HARNESS1-D6 / D7: 文書の github 一本化、drift test の要求先。
- SPEC-WF-HARNESS1-D8: phase1 probe の削除、execpolicy mirror の解消。
- SPEC-WF-HARNESS1-D9: 本 PR 自身の検査を base 版で行う手順（test ではなく AC9 の記録）。
- 保護する隣接契約: PK5、Plans.md「次の行動」link、active packet 1 つ、base 側 classifier、RecordV1、直接 UI merge 禁止、pre-push の Ready push 拒否。

## Failure Modes

- F1: 旧 field（`Evidence Mode: github` / `Execution Mode` / `Findings Freeze`）を持つ並走 lane の packet が拒否される。
- F2: 新 template の packet（旧 field なし）が拒否される。
- F3: marker の任意化で `Evidence Mode: legacy` や未知値、legacy field、実装後の Phase が通る。
- F4: STATECAP / backtrack の検査が残り、通常の commit で Phase を更新した packet が止まる。
- F5: Rebase Map の解釈を消したつもりで残る、または消した結果 ancestry 検査まで消える（rebase した Plan Commit が通る）。
- F6: 保持すべき gate（PK5、Minimum の R4 / workflow 条件、Human Gate、snapshot 比較）が一緒に消える。
- F7: Execution Mode の値で review 本数が変わり続ける、または snapshot 比較に残って旧 packet の行の削除で KeyError / 拒否が起きる。
- F8: 旧 capture が新 helper で黙って受理される（形の違う snapshot で record が書かれる）。
- F9: 文書が撤去済みの仕組みを指示し続ける、または drift test が消した文を要求して PR3 の削除を止める。
- F10: mirror の削除で wrapper の default 検索が存在しない path を渡して失敗する、または allowlist に残る。

## Test Matrix

- 引用する既存 test は `rg` で実在を確認した（plan-packet test の case 番号は `scripts/tests/doc-consistency-plan-packet.test.sh` の `# --- N.` 見出し、pr-gate test は `def test_*`）。
- fixture は test 内で生成する合成 packet / 合成 git 履歴だけを使う。helper の test は既存の fake `gh` / 状態 file（`configure_packet` 等）を通すため、GitHub API は呼ばない。

### checker（`scripts/tests/doc-consistency-plan-packet.test.sh`）

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1 / D2 / D4 | F2 | CLI | T-P1: 既定 fixture（新 template 形: marker・Execution Mode・Findings Freeze 行なし、10 field）が `PK4: Workflow State machine 整合 OK`（case 1 / 27 の置換） | どれかの旧 field がまだ必須 |
| D1 / D2 / D4 | F1 | CLI（互換） | T-P2: 旧 template 形（`Evidence Mode: github`、`Execution Mode` を fable-window / dual-vendor-no-fable / codex-only / 任意文字列の 4 通り、`Findings Freeze` 行あり）が 4 通りとも OK（case 5 / 14 の exec mode loop の置換） | Execution Mode の enum 検査が残る、または旧行を拒否する |
| D1 | F3 | CLI（negative） | T-P3: `Evidence Mode: legacy` と `Evidence Mode: mystery` がそれぞれ ERROR（末尾 merge evidence schema block の置換）。marker 行なしは OK | marker の値検査が消える（legacy が通る）、または marker なしを拒否し続ける |
| D1 | F3 | CLI（negative） | T-P4: legacy field 3 種をそれぞれ 1 行足した fixture が ERROR（`legacy field` を含む）。旧 case 22（Hosted CI enum）の置換 | legacy field の拒否が github 分岐と一緒に消える |
| D1 / D5 | F3 / F6 | CLI（保持） | T-P5: Phase `local-verified` / `independent-review` / `human-confirm` / `ready-hosted-final` / `merge` / `review` が marker ありとなしの両方で ERROR。8 値はすべて OK（case 3 / 14 の phase loop の置換） | Phase 検査が marker あり（github）の時だけ働く、または enum が 13 値のまま |
| D5 | F6 | CLI（保持） | T-P6: 必須 10 field（Phase / Risk / Plan Commit / Amendments / Coordinator / Writer / Plan Reviewer / Final Reviewer / Final Review Minimum / Human Gate）をそれぞれ欠いた fixture と空値の Coordinator が ERROR（case 21 の配列の置換） | 必須 field の一覧から誤って削る |
| D5 | F6 | CLI（保持） | T-P7: R4 で `Final Review Minimum: 1`、`Human Gate: none`、R4 で r4 なしがそれぞれ ERROR（marker なしの fixture で） | Minimum / Human Gate の検査が github 分岐と一緒に消える |
| D5 | F6 | CLI（保持、既存） | T-P8: case 4（Risk 不一致）、case 7（implementing で Plan Commit pending）、case 11 / 11c / 12 / 28（Plans link）、case 13 / 25（archive skip）、case 26（R1 skip）が変更前と同じ判定 | 隣接の PK4 検査が巻き添えで変わる |
| D4 | — | CLI | T-P9: R3 fixture から `Findings Freeze` 行を除いて OK（case 6 の反転） | 行要求が残る |
| D1 | F9 | CLI（parity） | case 18: `doc-consistency-check.sh` と `check-workflow-git.sh` の `WORKFLOW_STATE_PHASES` が同じ 8 値 | 片方だけ 13 値のまま |

### PK5 検査（`scripts/tests/workflow-git-checks.test.sh`）

fixture の `write_packet` に `- Phase: implementing`（pending の case は `plan-gate`）を足し、marker 行を外す。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D3 / D5 | F6 | git fixture（保持、既存） | T-G1: ancestry 正例、squash 相当の負例、Plan Commit 書換え検出、Amendments 追記正例・順序・削除の負例、非 descendant の負例、pending skip が変更前と同じ判定（現 `:106-240`、`:509-555` の case を維持） | PK5 の処理を Rebase Map と一緒に削る |
| D3 | F5 | git fixture（negative） | T-G2: plan-first を rebase して非 ancestor にし、patch-id 同値の `Rebase Map: <old> -> <new>` 行を足しても `は現在の HEAD の祖先ではありません` で ERROR（旧 T-PK5 正例の反転） | Map の解釈が残り escape hatch になる |
| D3 / D5 | F6 | git fixture（保持、既存） | T-G3: shallow clone が `full history required` で ERROR、無関係な shallow ref は OK（現 `:729-745`） | full history の要求を STATECAP と一緒に削る |
| D1 | F3 | git fixture | T-G4: marker なし + Phase implementing は OK、`Evidence Mode: legacy` / `mystery` は ERROR、`Phase: local-verified` は marker の有無に関わらず ERROR、Phase 行なしは ERROR（現 `:709-727` の置換） | marker を必須のまま残す、または Phase 検査が marker 依存 |
| D3 | F4 | git fixture | T-G5: active packet ありで、`docs(plans): state-only遷移 ...` の forward commit 4 件と隣接する `docs(plans): state-backtrack ...` 2 件を積んでも exit 0 で、出力に `STATECAP` を含まない | STATECAP / backtrack 検査が残る |
| D3 | F4 | git fixture | T-G6: `docs/plans/` が無い repo（packet 0 件）で同じ commit 列でも exit 0、`STATECAP` を含まない（変更前は packet 0 件でも STATECAP が走っていた） | packet 0 件の分岐に STATECAP が残る |

### helper（`scripts/tests/pr-gate.test.py`）

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1 / D2 | F2 / F3 | unit | T-H1: `test_packet_schema` — 新 template 形（marker・Execution Mode なし）を `parse_packet` が受理し、戻り値に `mode` が無い。`Evidence Mode: legacy`、`Evidence Mode: mystery`、legacy field 3 種、`Phase: local-verified`、`Final Review Minimum: 0`、`Human Gate: none`、implementing で pending は GateError | 旧 field が `FIELDS` に残る、または marker 値・legacy field の拒否が消える |
| D2 | F1 | unit（互換） | T-H2: 旧 template 形（`Evidence Mode: github` + `Execution Mode` 4 通り）を受理 | Execution Mode の enum が残る |
| D5 | F6 | CLI fixture（保持、既存） | T-H3: `test_workflow_minimum_one_rejected`（`scripts/pr-gate.py` を含む PR で Minimum 1 → status / ready が exit 1）。Execution Mode 行を外した packet でも同じ | Double Audit の workflow 条件を codex-only 分岐と一緒に削る |
| D5 | F6 | CLI fixture（保持、既存） | T-H4: `test_r4_minimum_one_rejected`、`test_r4_approval_gate_cannot_be_omitted` | R4 条件が変わる |
| D5 | F6 | CLI fixture（保持） | T-H5: `test_unamended_gate_condition_changes_are_rejected` の Risk / Human Gate / Final Review Minimum の 3 case、`test_latest_amendment_snapshot_owns_gate_conditions` が変更前と同じ判定 | snapshot 比較から保持すべき field を削る |
| D2 | F7 | CLI fixture | T-H6: 承認時 snapshot に `Execution Mode: fable-window`、現在の packet は `dual-vendor-no-fable` または行なし → status が `approved packet condition changed` を出さず、Draft の通常 blocker だけ（旧 Execution Mode case の反転、KeyError も出ない） | 比較対象に Execution Mode が残る |
| D2 / D5 | F7 | CLI fixture | T-H7a: `Execution Mode: codex-only`、R3、変更 file が `src/features/example/view.tsx` だけ、Minimum 1 → status に Minimum の blocker が無い（`test_codex_ui_minimum_one_rejected` の反転） | codex-only R3 UI 分岐が残る |
| D2 | F8 | unit | T-H7b: `requirements` に `mode` を含む旧形の capture JSON で `record` が `fresh capture required` の GateError（既存 `RecordLifecycle.exercise` の capture を 1 key 足して使う） | helper が形の違う capture を受理する |

### 文書の drift test と wrapper

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D7 | F9 | drift test | T-D1: `reading-order-drift.test.sh` — `直接UI merge` と `残存リスク` を `AGENTS.md` と `docs/DEV_WORKFLOW.md` に要求し、どちらかから `直接UI merge` の行を消した写しで検査関数が失敗する。`.agents/skills/*` の `Evidence Mode` は要求しない | 安全境界の要求が消える、または PR3 が消す定型文を要求し続ける |
| D6 / D7 | F9 | drift test | T-D2: `ci-workflow.test.sh` — `validate_public_actions_doc_contract` が ci.md の「Actions 利用不能なら merge を停止」の文を要求し、その文を消した写しで失敗する（M3 の 3 mutation の置換）。CI-PUBLIC-D1 / CI-TRIGGER-D1 と表 3 行の既存 mutation は維持 | 旧 2 経路の文を要求し続ける、または Actions 停止時の規則が消えても通る |
| D8 | F10 | wrapper test | T-W1: `codex-safe-wrappers.test.sh` — fixture に `.codex/execpolicy.rules` を作らず T4 の default 検索が成功し一覧に `.codex/rules/default.rules` を含む。T11 は `.codex/rules/default.rules` に history-view token が無いこと、`git -C "$SOURCE_ROOT" ls-files --error-unmatch .codex/execpolicy.rules` が失敗することを確認する | wrapper の default 一覧に削除した path が残る（rg が存在しない path で失敗）、または file が残る |

## State Lifecycle Matrix

workflow-state の変更として、github 方式の観点（capture / server の競合、stale head/base、broad / closure、manual / R4、hosted gate）を選ぶ。本 PR はこれらの挙動を変えず、変えるのは packet の解釈と capture の形だけ。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| packet の Workflow State | 新 template で起票（plan-draft） | plan-gate（pending） | plan-approved / implementing（Plan Commit 確定、通常 commit） | Plan Gate 後の契約変更 → Gated Amendment | helper が承認時 snapshot を再取得して比較 | 旧 template の packet を同期後に再検査 | 本 PR の merge を挟んで再開しても同じ判定 | legacy marker / legacy field / 実装後 Phase → 拒否 | 行を直して再検査 | T-P1〜T-P5、T-G4、T-H1、T-H6 |
| helper の capture | 本 PR の merge 前に作った capture | — | 新 helper で fresh capture → record | helper の変更で capture の形が変わる | record 時に snapshot を再取得 | — | — | 旧 capture → `fresh capture required` | capture をやり直す | T-H7b |
| 本 PR 自身の helper 操作 | base 版の写しを作る | Draft、broad 待ち（Codex） | base 版で record / ready / merge | base が進む | 写しを作り直し blob を照合 | — | — | 写しと base の blob 不一致 → 停止 | 写しを作り直す | AC9 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| packet の field の解釈 | `scripts/doc-consistency-check.sh` PK4、`scripts/check-workflow-git.sh` `main`、`scripts/pr-gate.py` `FIELDS` / `parse_packet` / `requirements`（`rg -n 'Execution Mode\|Evidence Mode' scripts`） | 3 script すべて | なし | T-P1〜T-P5、T-G4、T-H1〜T-H2 |
| Phase enum の定義 | `doc-consistency-check.sh:1270,1273`、`check-workflow-git.sh:38,384`、`pr-gate.py:164,172`、DEV_WORKFLOW Workflow State、template | すべて 8 値へ | なし | case 18、T-P5、T-G4 |
| legacy 方式の文書上の指示 | DEV_WORKFLOW、ci.md、merge-evidence、template 2 本、MANUAL `:56,61,236,268`、project-profile `:160,163,237` | 左記すべて | 入口の定型文（AGENTS / CLAUDE / `.claude/**` / Skills / code_review / review 系 template / shared / README / HANDOFF / PR template）は PR3。条件文で誤った操作へ導かない（legacy packet は作れない）。`.agents/skills/inventory-code-review/SKILL.md:60` は無条件の指示として残る残余 | AC6、Review Focus |
| 安全境界「直接 UI merge 禁止」の所在 | AGENTS / CLAUDE / DEV_WORKFLOW / ci.md / PR template（`rg -n '直接UI merge'`） | test の要求先を AGENTS + DEV_WORKFLOW へ | CLAUDE / PR template / ci.md の文は残す（削除は PR3） | T-D1 |
| execpolicy の参照 | wrapper 3 本、wrapper test、`.codex/README.md`、decision-log D-049 | wrapper・test・README | decision-log は追記型で非変更（D-091 で扱う） | T-W1、AC8 |

## Negative Paths

- missing input: 必須 10 field の欠落・空値 → ERROR（T-P6）。marker・Execution Mode・Findings Freeze の欠落 → OK（T-P1、T-P9）。Phase 行の欠落 → checker と PK5 検査の両方で ERROR（T-P6、T-G4）。
- invalid input: `Evidence Mode: legacy` / 未知値、legacy field、Phase 8 値外 → ERROR（T-P3〜T-P5、T-G4、T-H1）。Execution Mode の任意値 → OK（T-P2、T-H2）。
- duplicate/ambiguous input: 同じ key の重複は helper が従来どおり拒否（`workflow_fields` の `duplicate packet fields`、変更しない）。Rebase Map 行は解釈せず、ancestry は記録 SHA で判定（T-G2）。
- unknown reference: 解決できない Plan Commit / Amendments SHA → 従来どおり ERROR（T-G1）。
- dependency missing: shallow 履歴 → ERROR（T-G3）。GitHub API 失敗 → helper は exit 2（既存 test）。
- permission/write failure: helper の record 書込みは owner 名義のみ（変更しない、既存 test）。
- dry-run side effect: helper の `status` は read-only（変更しない）。AC9 の base 版 cross-run は read-only の `status` と checker だけで比較する。

## Boundary Checks

- status/policy enum: Phase 8 値、Final Review Minimum 1/2、Human Gate の 4 token、Evidence Mode は `github` だけ。
- null/default: marker なし = github 方式。Execution Mode は既定値なし（評価しない）。
- empty/non-empty: 空値の field 行は欠落と同じ扱い（T-P6）。
- producer/consumer: packet（Coordinator）→ 3 script。capture（helper）→ record（helper、同じ版で作り直す）。
- round-trip token: 承認時 snapshot と現在の packet の比較 key（Risk / Final Review Minimum / Human Gate）。
- threshold / wire type / precision / cross-language parse: not applicable。

## Compatibility Checks

- old schema/input: 旧 template 形の packet（並走 4 lane）→ 新旧どちらの checker / helper でも受理（AC4、T-P2、T-H2）。archive packet → 検査対象外のまま（case 13 / 25）。既存 PR の RecordV1 → 不変。
- new schema/input: 新 template 形 → 新 checker / helper で受理（T-P1、T-H1）。本 PR の merge 前の main から切った branch では旧 checker / helper が拒否する（Ordinary Operation に明記、test 対象外）。
- output order: PK4 の error 文言のうち「13 phase enum」「Execution Mode」「Findings Freeze」「Hosted CI Requirement 値」を変える・削る。これらの文言を assert する test は本 PR で同時に改める（S4）。
- optional field behavior: 任意 field の追加は従来どおり禁止しない（case 24）。

## Data Safety Checks

- source-derived data: 監査報告・公式資料の保存版・owner 発言の原文を転記しない。
- generated outputs: なし。
- secrets: なし。helper の test は fake `gh` だけを使う。
- local-only files: `.local/pr-gate/**`、`$TMPDIR` の base 版の写しは commit しない。
- synthetic sample boundaries: fixture はすべて合成。

## Main Wiring / Integration Checks

- helper connected to main path: `bash scripts/tests/run-workflow-tests.sh` が上記 test file をすべて呼ぶ（parity 一覧は変えない、`ci-workflow.test.sh` の `validate_parity`）。
- output reaches manifest/report: not applicable。
- effective config reaches runtime: hosted docs job が本 PR の `check-workflow-git.sh` を `WORKFLOW_BASE_SHA` 付きで実行（`.github/workflows/ci.yml:309-312`、変更しない）。pre-push / local-ci も同じ script を呼ぶ。
- CLI arg reaches implementation: AC9 の base 版 helper は `--pr` / `--packet` を同じ形で受ける（引数の形は本 PR で変えない）。

## Mutation-style Adequacy Questions

AC5 の実注入は、保持行ごとに 1 回、次の mutation を本 PR の変更後の code に入れて red を確認し、戻す。

- If a guard is removed, which test fails?
  - `pr-gate.py` の `double = ... or flags['workflow'] == 'true'` から workflow 条件を消す → T-H3 が red。
  - `pr-gate.py` の承認時 snapshot 比較から `Final Review Minimum` を消す → T-H5 の該当 case が red。
  - `pr-gate.py` の legacy field 拒否を消す → T-H1 が red。
  - `doc-consistency-check.sh` の Phase enum 検査を marker ありの時だけに戻す → T-P5 の marker なし case が red。
  - `doc-consistency-check.sh` の R4 Minimum 2 検査を消す → T-P7 が red。
  - `check-workflow-git.sh` の Plan Commit 書換え検出（`first_value` の比較）を消す → T-G1 の書換え case が red。
  - `check-workflow-git.sh` の shallow 検査を消す → T-G3 が red。
- If a removed guard is wrongly kept, which test fails?
  - `pr-gate.py` に codex-only R3 UI 分岐を戻す → T-H7a が red。
  - 比較対象に `Execution Mode` を戻す → T-H6 が red。
  - `check_state_only_commit_cap` の呼出しを戻す → T-G5 / T-G6 が red。
  - Rebase Map の chain 解決を戻す → T-G2 が red。
  - PK4 の Execution Mode 必須検査を戻す → T-P1 が red。Findings Freeze 行の要求を戻す → T-P9 が red。
  - reading-order-drift に Skill の `Evidence Mode` 要求を戻す → PR3 で定型文を消した時点で red になる（本 PR では観測できないため固定 AC にしない。T-D1 は要求の不在を関数の対象 file 一覧で確認する）。
- If a key branch is inverted, which test fails? marker の値検査を「github 以外を受理」に反転 → T-P3 / T-G4 / T-H1 が red。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? 本 PR 後も tracked に実装後の状態・exact-HEAD を置かない（Phase 8 値、Evidence Ownership を維持）。
- If output order changes / an output field is omitted: helper の `requirements` から `mode` を外す変更は capture の形を変える → T-H7b が旧形の capture を拒否することで固定する。

## Residual Test Gaps

- 本 PR の merge 前の main から切った branch で新 template を使うと旧 checker / helper が拒否する制約は、運用規則（Ordinary Operation）で扱い、test では固定しない（旧版の script は本 PR の test から呼べない）。
- AC9 の base 版 helper の実行は、実 PR と GitHub API を要するため自動 test にしない。PR body の記録と Final Review で確認する。
- 入口文書の定型文（PR3）と `.agents/skills/inventory-code-review/SKILL.md:60` は本 PR 後も残る。reviewer への影響は Review Focus で確認し、PR3 で消す。
- 文面が公式 Opus 5.5 prompting guide と整合するかは review の判断で、機械検査しない。
