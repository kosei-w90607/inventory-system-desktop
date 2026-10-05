# Plan Packet: helper と検査の守りを揃える

wave に属さない単独の lane。PR #138・#139・#140・#141 の運用で詰まった仕組みを、本筋の作業より先に直す小さな lane（owner 2026-10-05、選択肢 A）。helper と検査を変えるので、他の lane と並走させない。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session）
- Writer: Opus 5.5 subagent（`subagent_type: writer`）
- Plan Reviewer: fresh Opus 5.5（`subagent_type: reviewer`）+ Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1 + Codex
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/gate-record-guards
- kickoff → spec-check → design → plan-draft（2026-10-05、起草役、本 commit）: owner の起票承認と範囲（5 件すべて）。Risk R3（merge gate の変更）、classifier の `workflow=true` で Final Review Minimum 2。設計の出力は `docs/agent-guidance/merge-evidence.md`・`docs/DEV_WORKFLOW.md`（Workflow State の field 定義と PK5 の段落）・`docs/decision-log.md` D-107・`docs/backlog.md` の注記で、同じ plan-first の commit に入れた。未解決の設計の問いは無い
- plan-draft → plan-gate（2026-10-05、Coordinator）: packet と Test Design Matrix は plan-first commit `7deeecac` で揃い、Coordinator の再実行で doc check の `--target plan`・full は ERROR 0、`bash scripts/check-workflow-git.sh` は exit 0。Plan Reviewer の Codex は `.local/codex-orders/MODEL-SELECTION.md` の表の「merge gate・helper・classifier・hook の合否を変える変更」の行で Sol（high）。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 1（2026-10-05 の起票承認と範囲の選択 A） | 2（Ready・merge） | 3 | 6 = 1 + 2 + 3 |

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
merge gate の変更（`docs/DEV_WORKFLOW.md` Risk Tiers の R3 の行「merge gate changes」）。helper（`scripts/pr-gate.py`）の status・record の振舞いと CLI 引数、PK4（`scripts/doc-consistency-check.sh`）と PK5（`scripts/check-workflow-git.sh`）の受理集合を変える。破壊的な data 操作・実 POS データ・secret は触らないので R4 ではない。

classifier に予定 path（本 packet・Matrix・設計の正本・`docs/ci.md`・script 3 本と test 3 本）を当てた出力（`printf '%s\n' <予定 path> | bash scripts/ci/classify-changes.sh --files-from-stdin`、2026-10-05 起票時実測、exit=0）:

```text
rust=true
rust_drift=true
frontend=true
docs=true
env=true
generated=true
traceability=true
workflow=true
unknown=false
```

`workflow=true` なので Final Review Minimum は 2（`docs/DEV_WORKFLOW.md:84`）。

この変更で required gate の green / red は変わるか: 変わる。PK4 と PK5 が、helper の拒む Workflow State の値（末尾の空白・注記・短縮 SHA・重複）を新たに red にする（今の active packet 4 件は helper が受理する形で、Contract Probe P5 のとおり red にならない）。helper は gate の job ではないが、review の record に `--pr-reviews` が要る。

## Goal

Goal Invariant:

### 最小完了条件

- helper が拒む Workflow State の値（短縮 SHA、末尾の空白・注記）は、`--target plan` と pre-push の PK4・PK5 で先に止まり、helper の capture で初めて止まることが無い。
- Gated Amendment の後、helper の status は「新しい broad が要る」を最初の阻害理由に出し、closure の record の拒否も要る review を言う。
- 同じ head に本文のある PR review が複数あるとき、Coordinator がその数を申告しないと review の record は何も書かずに止まり、各 review の id と投稿時刻を示す。
- helper の自己照合の停止 message の復帰 command が、そのまま貼って動く完全な command になる。

### 失敗定義

- PK4・PK5 が helper の拒む値を通す経路が残る、または helper が受理する正当な packet（今の active packet）を PK4・PK5 が拒む。
- helper の判定（何を pass とするか）、exit code の意味、RecordV1 の wire が変わる。
- 登録済みの Amendments の綴りの不変（MG-D5）が緩む。
- `--pr-reviews` の照合が record の後に走る、または不一致でも comment を書く。

### 非目的

- review を読んだことの証明（申告は数の照合だけ）。
- 過去の PR・archive の packet の書き直し。
- helper の他の改善（`ready` の Draft の run の確認など backlog の別項目）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、Coordinator の操作列（capture → record → status → ready → merge）の中で新しい振舞いが出る場面を並べる。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| Writer が Gated Amendment の SHA を `Amendments` に短縮（8 桁）で書いて commit、未 push | `bash scripts/doc-consistency-check.sh --target plan <packet>`、または push（pre-push の PK5・PK4） | PK4 が helper の文（`invalid full SHA`）で、PK5 が 40 桁でない token で ERROR。push されない | その commit を full SHA に直す（新しい commit を足さない）。PK5 の綴りの固定より前に直せる | P3（今は PK5 が通す）、P5 |
| packet の Workflow State の値の末尾に空白、または `- Phase: implementing（注記）` | `--target plan`、pre-push | PK4 が helper の文で ERROR | 値を直す | P4 |
| broad を record した後に Gated Amendment を登録して push | `python3 scripts/pr-gate.py status --pr N --packet P` | blockers の最初に `broad Plan contract changed; fresh broad required: …`（今は `stale head/base in workflow record` だけ） | Final Review Minimum 本の broad を現在の head で発注する | P1 |
| 同上で Coordinator が closure を試す | capture → `record --kind review --review-stage closure …` | 何も書かず exit 1、`broad Plan contract changed; fresh broad required: …`（今は `server broad required for closure`） | broad を record する | P1 |
| Codex の 1 つの run が reviewed head に本文のある review を 2 本投稿 | capture → `record --kind review … --pr-reviews 1` | 何も書かず exit 1。2 本の `id` と `submitted_at` を並べる | 2 本とも読み、全 finding を裁定の対象にして `--pr-reviews 2` で record | P2 |
| 同上で数が合う | `record … --pr-reviews 2` → status | record が書かれ、status の review の阻害理由が消える（pass の条件は今と同じ） | ready（owner 指示）→ CI → merge（owner 指示） | P2 |
| PR が `scripts/pr-gate.py` を変える（本 lane 自身もそう） | どの action でも | `helper differs from base …; run: … python3 "${TMPDIR:-/tmp}/pr-gate-base.py" <元の引数>` を出して止まる。末尾に `…` が無い | 示された command を貼って base の版で実行する | P7（本 lane の PR は base の版で動くので、本 lane 自身の record ではこの改善と `--pr-reviews` は効かない。base の版の `…` には引数を手で補う） |

## Scope

- S1（status と closure の拒否が次の一手を言う、D-107 (3)）: `scripts/pr-gate.py` の `nonci`（`:336-353`）で、review が要る（`req['minimum']`）とき record の broad の `plan_commit`・`amendments` が要件と違えば、head/base の照合（`:343`）より先に `FRESH_BROAD` で止める。`validate_review`（`:319-320`）の文も同じ `FRESH_BROAD` にする。`record` の closure（`:463-467`）は、server の旧 record の broad の Plan 契約が要件と違えば `FRESH_BROAD` で拒み、broad が無い・本数が足りなければ `SERVER_BROAD` で拒む。文は Boundary / Wire Contract のとおり。
- S2（同じ head の review の数の申告、D-107 (4)）: `record` の `--kind review`（broad・closure とも）で `--pr-reviews N` を必須にする（無ければ exit 2、負なら exit 2）。reviewed head の照合（`:453-455`）の後、書き込みより前に `api(f'{endpoint}/pulls/{pr}/reviews?per_page=100', pages=True)` で全 page を取り、`commit_id == snap['head']` かつ `(body or '').strip()` が空でない review を数える。N と違えば exit 1、comment を書かない。取得の失敗は既存の `api` のとおり exit 2。argparse（`:512-531`）に `--pr-reviews`（`type=int`）を足す。`--kind manual|r4` では評価しない。
- S3（PK5 の SHA の 40 桁、D-107 (2)）: `scripts/check-workflow-git.sh` の `check_plan_commit_ancestry` で、現在の `Plan Commit`（`:52-53`）が `^[0-9a-f]{40}$` でなければ ERROR にして ancestry を評価しない。現在の `Amendments`（`:71-72`、`:90`）は `none` 以外なら区切り `[, \t]+` で分けた各 token を `^[0-9a-f]{40}$` と照合し、外れた token は ERROR（ancestry を評価しない）、重複も ERROR。prefix の照合の履歴の読み方（`:110-119` の `grep -oE '[0-9a-f]{7,40}'`）は変えない。書式の ERROR があっても prefix の照合は走らせ、既存の `Amendments が削除・変更されています` の判定を落とさない（`scripts/tests/workflow-git-checks.test.sh:216-232` の spelling の case が両方の文を出す）。
- S4（PK4 は helper の `parse_packet` で判定、D-107 (1)）: `scripts/doc-consistency-check.sh` の `check_plan_packet_workflow_state` で、R2+ の active packet ごとに helper の `parse_packet` を `python3` で呼ぶ（D-102 の重複の検査〈`:1270-1290`〉と同じ呼び方。1 回の呼び出しにまとめてもよい）。`GateError` は ERROR `PK4: <file> の Workflow State を helper（parse_packet）が拒否: <helper の文>`。ただし helper の文が `duplicate packet fields` なら今の重複の ERROR の literal だけを出し、節が無い（既存の `## Workflow State` の欠落の ERROR を出した）packet では helper を呼ばない。`python3` か import の失敗は今と同じく ERROR（fail-closed）。`extract_workflow_field` と他の PK4 の検査は変えない。
- S5（自己照合の復帰 command、D-107 (5)）: `scripts/pr-gate.py:215-217` の message の末尾の `…` を `shlex.join(sys.argv[1:])` にする（`import shlex`）。
- S6（test）: Matrix の行の test を既存の test file に足す。`scripts/tests/pr-gate.test.py` の fake gh（`:185-234`）に `/pulls/7/reviews` の route（state の `reviews` を返し、無ければ空）を足し、既存の review の record の呼び出し（`:377`・`:380` の `test_packet_double_audit_cli`、`:604-609` の `ReviewedHead.review`）に `--pr-reviews` を足す。`scripts/tests/doc-consistency-plan-packet.test.sh` の fixture に `Amendments` の値の変数を足す（今は `:332` で `none` 固定）。既存の assertion は弱めない。
- S7（line 参照の同期）: `docs/ci.md:29` の `scripts/pr-gate.py:388-399`（`ci()` の範囲）を実装後の行に直す。
- S8（記録）: 本 packet の `## Implementation Results`。merge 後の closeout で `docs/backlog.md:153`・`:178` (1) の注記を解消の書式にする（closeout の作業）。

予定 file（全部）: `scripts/pr-gate.py`、`scripts/tests/pr-gate.test.py`、`scripts/check-workflow-git.sh`、`scripts/tests/workflow-git-checks.test.sh`、`scripts/doc-consistency-check.sh`、`scripts/tests/doc-consistency-plan-packet.test.sh`、`docs/ci.md`、本 packet。設計の正本（`docs/agent-guidance/merge-evidence.md`、`docs/DEV_WORKFLOW.md`、`docs/decision-log.md`、`docs/backlog.md`）と Matrix は plan-first の commit で変更済み。

## Non-scope

- `scripts/check-workflow-git.sh` の Phase・Evidence Mode の末尾の削り（`:165`・`:169`）: 同じ `docs/plans/` の packet を PK4 が同じ段階（pre-push の docs 分類〈`scripts/pre-push.sh:237-241`〉、hosted の docs job〈`.github/workflows/ci.yml:306`〉）で helper の判定にかけるので、helper の段階で初めて止まる形にならない。
- helper の `requirements` の照合（承認 snapshot、PR の差分の packet）を PK4 に持ち込むこと（git と GitHub が要る）。
- RecordV1 の wire、helper の判定・exit code の意味。
- PK5 の履歴の照合の読み方、対象の packet の選び方。archive の packet。
- `.local` の発注の雛形・checklist の `--pr-reviews` への更新（tracked でない。Coordinator が行う）。
- Claude 側の review を PR に投稿する運用、`docs/code_review.md` の Output Shape の監査した commit の欄（backlog の別項目）。
- backlog の「検査 script と test の小口の整理（PR #136）」(1)〜(3)、helper の `ready` の Draft の run の確認。
- 過去の PR の record・packet の書き直し。

## Acceptance Criteria

- AC1: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/tests/pr-gate.test.py` が exit 0（`OK`）。Matrix の T1-1〜T1-4・T2-1〜T2-6・T5-1〜T5-2 を含む。
- AC2: `bash scripts/tests/workflow-git-checks.test.sh` が exit 0。Matrix の T3-1〜T3-6 を含む。
- AC3: `bash scripts/tests/doc-consistency-plan-packet.test.sh` が exit 0。Matrix の T4-1〜T4-7 を含む。
- AC4: `PYTHONDONTWRITEBYTECODE=1 bash scripts/tests/run-workflow-tests.sh` が exit 0（`OK`）。
- AC5: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0（その時点の active packet すべてを含む。helper の `parse_packet` が受理する packet を PK4 が拒まない）。
- AC6: `bash scripts/check-workflow-git.sh` が exit 0（`✅ [workflow-git] PK5 検査 OK`）。
- AC7: `rg -c '…' scripts/pr-gate.py` が一致なし（exit 1）。
- AC8: `docs/ci.md` の `scripts/pr-gate.py:<a>-<b>` の範囲が `def ci(self, pr):` の行から `return run['html_url']` の行まで（`sed -n '<a>p;<b>p' scripts/pr-gate.py` で確かめる）。
- AC9: Matrix の Mutation の節の各 mutant を実装に入れると、割り当てた test の command（AC1〜AC3）が exit≠0 になる（closure で修正を戻して red を確かめる。D-098 (9)）。

起票時実測（2026-10-05、変更前の HEAD、逐語の command）:

- AC1: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/tests/pr-gate.test.py` → exit=0、`OK`（新しい test はまだ無い）。
- AC2: `bash scripts/tests/workflow-git-checks.test.sh` → exit=0、末尾 `PASS: unrelated shallow boundary excluded`。
- AC3: `bash scripts/tests/doc-consistency-plan-packet.test.sh` → exit=0、末尾 `PASS: S1b missing_column (exit 0, ERRORなし)`。
- AC4: `PYTHONDONTWRITEBYTECODE=1 bash scripts/tests/run-workflow-tests.sh` → exit=0、末尾 `OK`。
- AC5・AC6: 本 packet を足した後の結果を Implementation Results の前の検証（本 commit の報告）で見る。変更前の main では両方とも ERROR 0 / exit 0。
- AC7: `rg -n '…' scripts/pr-gate.py` → `217:` の 1 行（変更前）。
- AC8: 変更前は `docs/ci.md:29` が `scripts/pr-gate.py:388-399`、`def ci` は `:388`、`return run['html_url']` は `:400`。
- AC9: 未実測（実装の後。mutant ごとの exit を closure で記録する）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/agent-guidance/merge-evidence.md` の `## 状態と非CI記録`（Amendments の不変と SHA の桁、`:87`）・`## Helperの境界`（自己照合 `:58`、status と record の引数 `:146`）・`## 実行手順`（record の例 `:160-168`、同じ head の複数の review `:173`）。`docs/DEV_WORKFLOW.md` の `## Workflow State`（field の定義 `:81-82`、PK5 の段落 `:114`）。`docs/decision-log.md` の D-039、D-098 (10)、D-099 D2・D8、D-102 (3)(4)、D-107。
- 必要な設計成果物: workflow gate change → `docs/decision-log.md` D-107（updated in this PR）。merge-evidence と DEV_WORKFLOW の該当文（updated in this PR、plan-first の commit）。CLI 引数と message の形 → 本 packet の Boundary / Wire Contract（updated in this PR）。
- plan にしかない durable な判断の昇格先: D-107 の Decision・Alternatives・Guarantee range。message の literal は helper の code と test が持つ（merge-evidence は意味だけを書く）。
- 前提・制約と、延期した design gap の follow-up: 本 lane の PR は helper 自体を変えるので、PR 自身の status・record は base の版で動く（D-099 D2）。`.local` の雛形の更新は Coordinator。延期は Non-scope の各項目。
- 絶対保証の例外と escape hatch: 「helper の段階で初めて止まる形を無くす」は `parse_packet` の判定に限る（requirements の照合は範囲外、Guarantee range）。`--pr-reviews` は数の照合で、拒否 message から写せば通る（D-107 Guarantee range）。push 済みの短縮の綴りは今も履歴の書き直しが要る。
- 判定: ready。5 件それぞれの採った案・退けた案は D-107 にあり、未解決の設計の問いは無い。

## Registration / Generation Obligations

該当なし（新しい command・DTO・route・設計文書・REQ を足さない。helper の CLI 引数は Boundary / Wire Contract で扱う）。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 不該当（製品の code を触らない） | — |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 該当。GitHub の review の API の field と、Codex の投稿が owner の account である事実は P2 で実物を見た。数える条件（commit_id と本文）は app の決定で D-107 へ昇格 | D-107 |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 該当（record の再試行）。不一致・取得失敗では何も書かないので、数を直して同じ capture で再試行できる。capture と server の変化の扱いは既存のまま | Matrix T2-1・T2-5 |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 不該当（店の operator の操作は変わらない。Coordinator の操作列は Ordinary Operation） | — |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 該当（GitHub の review の API）。変わったら helper の数える関数だけを直す。D-107 Revisit | D-107 |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 該当。review の本文は写さず、件数と field の有無だけを packet に書く | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 不該当（業務の数を扱わない） | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 不該当（すべて合成 fixture の自動 test。実 GitHub への書込みは test でしない） | — |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 新しい依存は無い（`shlex` は Python 標準。PK4 の `python3` の依存は D-102 から既存） | — |

## Boundary / Wire Contract

- producer: `scripts/pr-gate.py`（status の blockers、record の拒否 message、自己照合の message）、`scripts/doc-consistency-check.sh` PK4、`scripts/check-workflow-git.sh` PK5。
- consumer: Coordinator（人と model）、pre-push、local-ci、hosted の docs job。
- wire type:
  - helper CLI: `record --kind review` に `--pr-reviews N`（10 進の整数、0 以上）を必須で足す。無い・負は exit 2、`--kind manual|r4` では評価しない。他の引数は不変。
  - `FRESH_BROAD` = `broad Plan contract changed; fresh broad required: record --review-stage broad at the current head (a closure cannot carry this broad)`。status の blockers（nonci）、`validate_review`、closure の record の拒否で同じ文。exit 1。
  - `SERVER_BROAD` = `server broad required for closure: record --review-stage broad at the current head until it has Final Review Minimum audits`。exit 1。
  - `--pr-reviews` 不一致: `--pr-reviews {N} but the reviewed head has {M} PR reviews with a body; read each before recording: id={id} submitted_at={submitted_at}, …`（数えた review を API の順に `, ` で並べる。M=0 なら一覧は空）。exit 1。
  - `--pr-reviews` 欠落: `review needs --pr-reviews (count of PR reviews with a body on the reviewed head)`。exit 2。
  - 自己照合: `helper differs from base {base}; run: git fetch origin && git show {base}:scripts/pr-gate.py > "${TMPDIR:-/tmp}/pr-gate-base.py" && python3 "${TMPDIR:-/tmp}/pr-gate-base.py" {shlex.join(sys.argv[1:])}`。exit 1（不変）。
  - PK4: `PK4: <file> の Workflow State を helper（parse_packet）が拒否: <GateError の文>`。重複は今の literal（`PK4: <file> の Workflow State に重複する field があります（helper の workflow_fields が拒否）`）。
  - PK5: `❌ [workflow-git] PK5: <file> の Plan Commit '<value>' は 40 桁の小文字 hex の full SHA ではありません`、`❌ [workflow-git] PK5: <file> の Amendments SHA '<token>' は 40 桁の小文字 hex の full SHA ではありません`、`❌ [workflow-git] PK5: <file> の Amendments に重複する SHA '<token>' があります`。
- internal type: review は GitHub の `pulls/{n}/reviews` の object（`id`・`commit_id`・`body`・`submitted_at`。P2）。
- precision/range: SHA は 40 桁の小文字 hex。`--pr-reviews` は 0 以上。
- round-trip path: GitHub API → helper の数 → 申告と比較 → 不一致なら message に `id`・`submitted_at` を戻す。
- invalid input: 引数の欠落・負・非整数は exit 2。API の失敗は exit 2（既存の `api`）。`body` が `null` は空として扱う。
- compatibility: RecordV1 は不変。既存の record・capture はそのまま読める。PR 自身が helper を変えるときは base の版が動く（D-099 D2）ので、`--pr-reviews` と新しい message は本 lane の merge の後の PR から効く。PK4・PK5 は archive に遡及しない。

## Test Plan

Test Design Matrix: [test-matrices/2026-10-05-gate-record-guards.md](test-matrices/2026-10-05-gate-record-guards.md)

- targeted tests: AC1〜AC3 の 3 file（Matrix の T 行）。
- negative tests: 短縮・41 桁・大文字・重複の SHA、末尾の空白・タブ・注記、節が 2 つ、`--pr-reviews` の過少・過大・欠落・負、API の失敗。
- compatibility checks: 今の active packet と既定の fixture が PK4・PK5 を通る（AC5・AC6、T4-5）。既存の spelling の case が両方の文を出す（T3-6）。archive の明示 path は対象外（T4-6）。
- data safety checks: 合成 fixture だけ。fake gh で GitHub に書かない（既存の CLI test の方式）。
- main wiring/integration checks: helper の CLI を subprocess で走らせる既存の `CLI` の fixture を使い、argparse から record まで通す。PK4・PK5 は script を実行する既存の test の方式。

## Review Focus

- S1: 阻害理由の順を変えても、判定（pass の条件）と exit code が変わらないか。R0/R1（minimum 0）で新しい文が出ないか。
- S2: 数える条件（reviewed head・本文）が書き込みより前に評価され、不一致・取得失敗で comment が増えないか。closure にも効くか。本文が空の review と別の head の review を数えないか。
- S3: 書式の照合が prefix の照合（MG-D5 の不変）を弱めていないか。書式の ERROR で既存の判定が消えないか。
- S4: helper を呼ぶ条件（R2+、active、節あり）と fail-closed。重複の literal の維持。今の active packet を拒まないか。
- S5: quote が shell に安全で、元の引数の列を復元するか。
- 全体: D-107 の Guarantee range を超える主張をしていないか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-107 (1) PK4 は helper の parse_packet で判定 | decision-log D-107、`docs/DEV_WORKFLOW.md:114` | S4 | T4-1〜T4-7 | — |
| D-107 (2) PK5 の SHA は 40 桁、重複を拒む | D-107、merge-evidence `:87`、DEV_WORKFLOW `:81-82`・`:114` | S3 | T3-1〜T3-6 | — |
| D-107 (3) status・closure が fresh broad を言う | D-107、merge-evidence `:146` | S1 | T1-1〜T1-4 | — |
| D-107 (4) `--pr-reviews` の照合 | D-107、merge-evidence `:146`・`:160-168`・`:173` | S2 | T2-1〜T2-6 | — |
| D-107 (5) 自己照合の完全な command | D-107、merge-evidence `:58` | S5 | T5-1〜T5-2 | — |
| MG-D5 Amendments の不変（prefix・表記の置換を拒む） | merge-evidence `:87`、D-039 | S3（読み方を変えない） | T3-6（既存の reorder・replacement・removal・spelling） | — |
| MG-D8 / §状態と非CI記録「Plan契約が変わった場合は新しいbroad」 | merge-evidence `:108` | S1（判定は不変、文と順だけ） | T1-4、既存 `test_changed_plan_requires_new_broad`・`test_broad_contract_and_minimum` | — |
| MG-D12 出力は状態・次の行動・阻害理由 | merge-evidence `:29` | S1・S2・S5 | T1-2・T2-1・T5-1 | — |
| D-099 D2 helper の自己照合（base の版で動く、何も書かない） | D-099、merge-evidence `:58` | S5（文だけ） | T5-2（既存 `test_mismatch_blocks_every_action`） | — |
| D-099 D8 reviewed head の照合 | D-099、merge-evidence `:146` | S2（照合の後に数える） | 既存 `ReviewedHead` の 4 test、T2-6 | — |
| D-098 (10) PK4 の Plan Commit の書式 | D-098 | 不変（S4 と並ぶ） | 既存 PR4-F5〜F7b | — |
| D-102 (3) PK4 の重複は helper が判定 | D-102、D-107 Compatibility（部分改訂） | S4 | 既存 PK4-DUP、T4-4 | — |
| D-102 (4) check-workflow-git の Phase の読み取り範囲 | D-102 | 対象外（Non-scope の 1 項目） | 既存 `only the first Workflow State section is read` | 非対象: PK4 が同じ段階で helper の判定にかける |
| RecordV1 の wire | merge-evidence `:91-104` | 不変 | 既存 `test_wire_fail_closed` | — |
| `docs/ci.md` final run の参照 | `docs/ci.md:29` | S7 | AC8 | — |

## Contract Probe

- P1（helper の status は stale を先に出す）: helper を import し、broad の Amendments が要件と違い head も古い record で `nonci` を呼ぶ → `stale head/base in workflow record`（2026-10-05 実測）。`validate_review`（`scripts/pr-gate.py:319-320`）の `fresh broad required` には届かない。closure の record は旧 broad を契約の違いで持ち越さず（`:445-448`）、`server broad required for closure`（`:464`）で止まる（実読）。
- P2（GitHub の review の API の field）: `gh api --paginate --slurp 'repos/kosei-w90607/inventory-system-desktop/pulls/141/reviews?per_page=100'` → review 6 件、全件に `id`・`commit_id`・`body`・`user`・`submitted_at`・`html_url`・`state` がある。6 件とも同じ 1 つの `commit_id` で、本文のある review 2 件（summary 2 本）と本文が空の review 4 件（inline の comment）、全件 owner の account、state は全件 `COMMENTED`。同じ数え方で PR #138 は本文あり 1、#139 は本文あり 1、#140 は本文あり 1・空 1（2026-10-05 実測。本文の中身は写さない）。→ 投稿者では区別できず、本文の有無と `commit_id` で summary の本数が数えられる。
- P3（PK5 は短縮 SHA を通す）: 合成 repo（`$TMPDIR`）で Plan Commit を full、Amendments を 8 桁で commit して `bash scripts/check-workflow-git.sh` → exit=0、`✅ [workflow-git] PK5 検査 OK`。8 桁 + 末尾の空白でも exit=0（2026-10-05 実測）。原因は `scripts/check-workflow-git.sh:90` の `grep -oE '[0-9a-f]{7,40}'` と `:60` の `git rev-parse --verify`。
- P4（PK4 は末尾の空白・注記を通し、helper は拒む）: HEAD の `git archive` の写しで、active packet の 1 行を `Phase: implementing `・`Amendments: none `・`Human Gate: ready,merge<TAB>`・`Final Review Minimum: 1 `・`Risk: R3 `・`Phase: implementing（注記）` に変えて `bash scripts/doc-consistency-check.sh --target plan <packet>` → 6 件とも exit=0 で `PK4: Workflow State machine 整合 OK`。helper の `parse_packet` は同じ形を `invalid tracked Phase`・`invalid full SHA`・`Human Gate must explicitly include ready,merge` 等で拒む（8 桁の Amendments も `invalid full SHA`）（2026-10-05 実測）。原因は `extract_workflow_field`（`scripts/doc-consistency-check.sh:947-957`）の末尾の削りと先頭 token の切り出し。
- P5（既存の packet と fixture が 40 桁・helper の受理形か）: `docs/plans/` の active packet 4 件は helper の `parse_packet` が全件受理し、Plan Commit・Amendments の値はすべて `pending`・`none`・40 桁の列（0 件が外れる）。archive は `- Amendments:` 行のある packet のうち none でも 40 桁の列でもないもの・Plan Commit が pending でも 40 桁でもないものが多数あるが、PK5 は `docs/plans/` の直下だけ（`scripts/check-workflow-git.sh:178`）、PK4 は archive の path を飛ばす（`scripts/doc-consistency-check.sh:1227`）ので遡及しない。`scripts/tests/doc-consistency-plan-packet.test.sh` の既定の fixture（旧 template・新 template）も helper が受理する（2026-10-05 実測）。
- P6（自己照合の message の `…`）: `rg -n '…' scripts/pr-gate.py` → `217:` の 1 行（実読）。
- P7（本 lane の PR は base の helper で動く）: `requirements` は base の `scripts/pr-gate.py` と bytes が違えば止まる（`scripts/pr-gate.py:215-217`）。本 lane の PR は helper を変えるので、PR 自身の status・capture・record・ready・merge は base の版を使う（実読）。

## Data Safety

- 実 POS / 店舗データ、DB、backup、log、secret を読まず commit しない。
- PR review の本文は packet・test に写さない（件数と field の有無だけ）。test の review は合成の値。
- 合成の git repo と `git archive` の写しは `$TMPDIR` だけに作る。fake gh で GitHub への書込みをしない。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
