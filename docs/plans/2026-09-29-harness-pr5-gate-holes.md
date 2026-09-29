# Plan Packet: ハーネス刷新 PR5 gate の穴を塞ぐ（R3）

2026-09-29 起草。出典は owner 決定 2026-09-24（ハーネス刷新は 5 本。PR5 = classifier / helper の穴・`.claude/agents`）、2026-09-28（規則とハーネスの改善を最優先。止める規則は起きている失敗を 1 文で言えること〈Coordinator の言い換え〉。安全の境界は残す）、2026-09-29（PR4・PR5 の起票承認。PR5 に local-ci の `node_modules` symlink 検出と、pre-push の merge 済み PR 検出・未 stage の WARN を入れる）。背景の事実は 2026-09-24 のハーネス監査（§0-8 helper の自己検査の穴、§3.Q V2・V9 classifier の穴と helper の実行場所、§8-9）と 2026-09-28 の教訓の棚卸し（local-only の報告。要点は下の「現状の事実」に書き下す）。

本 lane は wave に属さない単独の lane（ハーネス刷新の最後の 2 本の片方。PR4〈手続きの軽量化〉と並走し、file の所有は下の「PR4 との file の所有」で分ける）。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

実装後の状態はPR native state / 専用record / CIが所有し、trackedに書かない。

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（fresh context、Coordinator が指定する worktree で作業）
- Plan Reviewer: fresh Opus 5.5 subagent（fork でない）+ Codex（GPT-6 Astra。merge gate・helper・classifier・hook の合否を変える変更）。互いに独立で Writer と別 context
- Final Reviewer: Fable 5.1（Claude 側、R3）+ Codex（GPT-6 Astra）。互いに独立で Writer・Plan Reviewer と別 context（Double Audit）。後の reviewer に先の結果を見せない
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/harness-pr5-gate-holes

manual なし: 製品の runtime・画面・配布物を変えず、Windows native L3 の対象画面が無い。helper・classifier・hook・local-ci の振舞いは合成 fixture の自動 test で確かめる。r4 なし: data・DB・破壊的 git 操作を含まず、変更は revert で戻せる。Final Review Minimum 2: `scripts/**`・`scripts/tests/**`・`.claude/settings.json` は `scripts/ci/classify-changes.sh:55` の実行制御（full）、`docs/agent-guidance/**`・`docs/ci.md`・`docs/AGENT_OPERATING_MANUAL.md` は `:59` の policy docs で、どちらも workflow=true になり helper は Minimum 2 を要求する（`scripts/pr-gate.py:270-272`）。owner の作業が要る場面（`.claude/agents/**`・`.claude/settings.json` の書込みの代行と、merge 後の本体の checkout の同期）は下の「判断点」の G1 に書く。

遷移記録（append-only）:

- kickoff → spec-check → plan-draft → plan-gate（2026-09-29、起草役 = Opus 5.5 subagent、本 commit、plan-first）: Risk R3（下記 Risk）。spec-check で、既存の正本（`docs/agent-guidance/merge-evidence.md` の MG-D4 の分類表・「Helperの境界」・「実行手順」、`docs/ci.md` の Classifier / Pre-push Contract、`docs/AGENT_OPERATING_MANUAL.md` の `## 座組`）が本 lane の判定の置き場所として足りると確かめた（新しい設計文書は作らない）。設計判断（D1〜D10）は本 packet の Spec Contract に置き、正本への反映は実装の S9〜S12 で行う（workflow の正本は本 lane が書き換える文書そのもの。PR2・PR3・並走の摩擦の lane と同じ形）。design phase は使わない（skip の条件は Design Readiness）。Plan Review へ。

## Owner Effort Budget

- 介入回数上限: 5（既定 3 から。理由: `.claude/agents/**` と `.claude/settings.json` は本体の checkout が sandbox から書けず、merge 後に owner が sandbox の外で本体を同期する 1 回が要る〈G1〉。plan-approved に owner の判断点が 1 つある）
- 実働時間上限: 15分（owner の作業は判断点の回答、Ready・merge の指示、merge 後の本体の同期 1 回）
- relay 往復上限: 5（Plan Review の Codex が最大 3 round、Final Review の Codex broad 1、base 同期の後の Codex closure の予備 1）
- Plan Review round 天井: 3（既定 3）

| 種別 | 上限 | 消費（2026-09-29 時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 5 | 1: 起票承認と範囲の判断（2026-09-29、同じ問いの 1 回） | 4: plan-approved と判断点 G1 の回答 1、Ready 1、merge 1、merge 後の本体の同期 1 | 0 | 5 = 1 + 4 + 0 |
| relay | 5 | 0 | 5: Plan Review の Codex 最大 3、Final Review の Codex broad 1、Codex closure 1 | 0 | 5 = 0 + 5 + 0 |

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

相談役への相談は[AGENT_OPERATING_MANUAL](../AGENT_OPERATING_MANUAL.md)の座組に従う。本節の2欄は`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R3「merge gate changes」に当たる。本 lane は次の合否を変える: classifier の分類（helper の Final Review Minimum と R0 / R1 の経路の可否、hosted の job の選択。`scripts/ci/classify-changes.sh`）、helper が走ってよい条件と review の record の受理（`scripts/pr-gate.py`）、pre-push の push の可否（`scripts/pre-push.sh`）、local-ci full の合否（`scripts/local-ci.sh`）。kickoff の問い「この変更でどれかの required gate の green / red が変わるか」の答えは「変わる」で、R3・Minimum 2。どれも「変更前に green だった入力が red になる」向き（締める側）で、緩める向きの変更は無い（D10）。R4 には当たらない（data・破壊的操作なし）。

Review-only skipped because: R3 の review-only sub-agent は、Final Review の Double Audit の broad（Fable 5.1 と Codex の 2 本、どちらも Contract Audit を正本から行う）が兼ねる（`docs/DEV_WORKFLOW.md` Review Rules・Draft PR Checkpoint）。

## 現状の事実（main `7ac96d9e`、2026-09-29 に起草役が確かめた）

1. classifier の穴: `scripts/ci/classify-changes.sh:59` の policy docs の一覧に `.claude/agents/*` と `docs/quality/review-checklist.md` が無い。どちらも `:67` の `*.md` / `docs/*` で一般 docs（docs=true・workflow=false）になる（AC1 の baseline）。`.claude/agents/*.md` は subagent の model・effort・tools・`hooks`・`permissionMode` を決める設定で、review の座組を実質的に変えられるのに、helper の Minimum 2 も workflow 回帰も掛からず、R0 / R1 の経路でも通る（`scripts/pr-gate.py:259` は `workflow` と `rust` の両方が true のときだけ拒む）。監査 V2。
2. `.gitignore:116` が `.claude/agents` を除外している（`git check-ignore -v .claude/agents/reviewer.md` → `.gitignore:116:.claude/agents`）。`:100-107` の comment のとおり、Claude Code の sandbox が本体の checkout の `.claude/agents` を `/dev/null` の mount で塞ぐ（本体の `.claude/agents` は owner `nobody` の character special file に見える）ための雑音対策で、tracked の定義を置けない原因にもなっている。
3. `scripts/local-ci.sh:224` は full のとき無条件に `npm ci` を実行する。worktree の `node_modules` が本体の `node_modules` への symlink だと、`npm ci` が symlink 先（本体）の中身を消す。事故は 3 回（2026-09 に 2 回と 09-25。09-25 は並走中の reviewer も止まった）。教訓の棚卸しの優先度は高。
4. `scripts/pre-push.sh:98` は `gh pr list --head <branch> --state open` だけを見る。merge 済みの PR の branch へ追加で push すると素通りし、commit が PR に載らず孤児になる（2 回）。
5. closeout の `git mv` の後の編集を add し忘れ、rename だけの commit を push した事故が 5 回ある（`git status` の ` M`・`RM`）。正当な WIP の push もあるので止めずに WARN にとどめる（教訓の棚卸しの判断）。
6. helper の自己検査の穴: `scripts/pr-gate.py:219-221` は review 要件の判定に base 側の classifier を GitHub から取得するが、helper 本体は実行した checkout の file。`pr-gate.py` を変える PR は、変更後の helper で自分を検査できる。PR1（#97）と並走の摩擦の lane（#123）は「origin/main の helper の写しを使う」手順を発注書と packet に固定して回避した（`docs/archive/plans/2026-09-24-harness-legacy-and-execution-mode-removal.md` の D9）。手順を忘れれば通る。監査 §0-8・V9。helper は repo root を `git rev-parse --show-toplevel`（`:196`）で決め、自分の file 位置を使わない（`rg -c '__file__' scripts/pr-gate.py` → 0 件、exit 1）。
7. broad の record の順序: `pr-gate.py record --review-stage broad`（`:450-454`）は capture の head を broad の head にする。監査した head を受け取らないため、是正を push した後の head の capture で broad を record すると、監査していない是正を broad が覆ったことになり closure が要らなくなる。PR #113 で起き、owner に 1 回余分に諮った。closure（`:455-459`）も同じ形。
8. closure の record は audit 1 つ（`:458-459`、RecordV1 の `Closure.audit`）。同じ head に 2 本の closure run がある場合にどちらを record するかが文書に無い（PR2・PR3 の Final Review の follow-up (1)、`docs/backlog.md` の該当項目。file の所有に合わせて PR4 から本 lane へ移す〈Coordinator 裁定〉）。
9. 座組の注記: `docs/AGENT_OPERATING_MANUAL.md:68`（Writer 行）は「Agent tool から直接起動する subagent は session の値（high）を継承する。Workflow から起動する subagent は effort を指定できる。tracked の定義 file（`.claude/agents/**`）は `.gitignore:116` の除外の解除と classifier の穴と一緒に PR5」、`:69`（Plan Reviewer 行）は「実効値の注意は Writer 行と同じ」。座組表の Writer・Plan Reviewer の effort medium は、今は Agent tool の起動では効かない。
10. subagent の入れ子: `docs/DEV_WORKFLOW.md:254` の「Max delegation depth is 1」は文書だけで、Claude Code の既定は 3 層（公式、Contract Probe P1）。
11. 本体の checkout（Coordinator の main session の cwd）の HEAD は `253eef06` で、origin/main（`7ac96d9e`）より古い。project の subagent 定義と `.claude/settings.json` は session の cwd から読まれる（公式、P1・P3）ので、tracked の定義を足しても本体の checkout を同期するまで Coordinator の session には効かない。本体の `.claude/settings.json` は sandbox から書けず（`test -w` が偽）、`.claude/agents` は上の 2 の mount で塞がれる。

## Goal

Goal Invariant:

### 最小完了条件

- `.claude/agents/**` と `docs/quality/review-checklist.md` を変える PR に、helper が Minimum 2 を、hosted が workflow 回帰を要求する。`.claude/agents/**` を変える PR は R0 / R1 の経路を通れない。
- helper は、自分の file が PR の base の `scripts/pr-gate.py` と違うときに何もせず止まり、base の版を使う command を示す。`pr-gate.py` を変える PR が変更後の helper で自分を検査する経路が、手順を忘れても塞がる。
- review の record は監査した head を受け取り、capture の head と違えば止まる。是正の push の後に broad を record して closure を飛ばす経路が塞がる。
- local-ci full は `node_modules` が symlink のとき、どの gate よりも前に非 0 で止まり、symlink 先を変えない。
- pre-push は merge 済みの PR の branch への push を止め、「main から新しい branch」を示す。push する file に未 stage の変更が残れば WARN を出して push を続ける。
- Coordinator が Agent tool で起動する Writer・reviewer が、tracked の定義（`.claude/agents/{writer,reviewer}.md`）から座組表の effort（medium）で動き、subagent の入れ子は設定（`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1`）で止まる。座組表の注記が実態と合う。

### 失敗定義

- 上のどれかが残る（例: `.claude/agents/*.md` の変更が R1 で通る、`pr-gate.py` を変えた PR が自分の helper で record できる、監査していない head の broad が record できる、symlink の `node_modules` のまま `npm ci` が走る、merge 済みの branch への push が通る）。
- 新しい停止が正当な作業を止める: `local-ci changed` や symlink でない worktree の full、open の PR の branch や PR の無い branch への push、未 stage の変更を残した WIP の push、`pr-gate.py` を変えない PR の helper の操作（base と同じ版の helper）。
- 既存の安全の境界が弱まる: 古い証拠の拒否（record の head/base の照合、capture と server の一致、closure の要求）、独立 review の本数（Double Audit の下限、main 側の classifier）、Human Gate（approved snapshot の照合、Ready・merge の owner 指示）、fail-closed の既定（照会失敗・未知の値で止まる）。

### 非目的

- PR4 の範囲（下の「PR4 との file の所有」の PR4 の行）。
- strict（MG-D1）の撤去、衝突を解いた版の manual の再利用の条件（owner 2026-09-28「今回は緩めない」）。
- 過去の decision-log の本文と archive の書換え。
- 生成器（`src-tauri/src/bin/generate_*`、bindings の export）の classifier の扱いの変更（D10 で入れないと決める）。
- helper が base の版へ自動で切り替えて実行すること（D2 の棄却案）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、本 lane の merge 後に 1 本の lane（X）を worktree の作成から merge まで通す操作列を書く。各行の「旧:」は本 lane の前の振舞い。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 本 lane が main にあり、owner が本体の checkout を sandbox の外で同期した（G1） | Coordinator が Agent tool で `subagent_type: writer`（または `reviewer`）を起動する | subagent が effort medium で動き、`/tasks` の行に model と effort が出る（旧: session の high を継承）。subagent が Agent tool を持たない（depth 1） | Coordinator が run 報告に実効の model・effort を記録する | P3（本体の同期までは効かない）。merge 後の最初の run で `/tasks` を確かめる（AC7） |
| X の worktree を origin/main から作り、`node_modules` を本体への symlink にした | `bash scripts/local-ci.sh changed` | 従来どおり（changed は `npm ci` を実行しない） | exit 0 | なし |
| 同上 | `bash scripts/local-ci.sh full` | どの gate よりも前に `ERROR=node_modules is a symlink …` で exit 非 0。本体の `node_modules` は変わらない（旧: `npm ci` が本体を空にした） | symlink を外して `npm ci --ignore-scripts` で実 dir を作り、full をやり直す | なし |
| X の Draft PR（open） | commit して `git push origin <branch>`。push する file の 1 つに未 stage の編集が残っている | `[pre-push] WARN: unstaged changes in pushed files: …` を出し、push は続く（旧: 何も出ない） | 意図した commit なら続ける。add し忘れなら add・commit して push し直す | なし |
| X の broad 監査が head H1 で終わり、是正が要る | capture（H1）→ `record --kind review --review-stage broad --reviewed-head H1 …` → 是正を push（H2）→ capture（H2）→ closure の監査 → `record --review-stage closure --reviewed-head H2 …` | broad が H1、closure が H2 に結び付く | 現在版の closure pass | なし |
| 同上で順序を誤る | 是正を push（H2）した後に capture（H2）→ `record --review-stage broad --reviewed-head H1` | `reviewed head differs from capture head` で exit 1。何も書かない（旧: H2 の broad として記録され closure が要らなくなった） | H2 で broad をやり直す（H1 の broad は record できない） | なし |
| 同じ head に closure run が 2 本（例: Claude 側 2 本） | 後に完了判定を出した run を `--pass-model` / `--run-ref` にし、両方の run の証跡を `--evidence` に並べて 1 回 record する | 1 つの closure audit に両方の証跡が残る | 現在版の closure pass | なし（record の wire は変えない） |
| X が `pr-gate.py` を変えない。X の branch の `pr-gate.py` が PR の base と同じ | `python3 scripts/pr-gate.py` の status / capture / record / ready / merge（`--pr N --packet …`） | 従来どおり | 各操作の従来の条件 | P5（base の `pr-gate.py` を取得できる） |
| main の `pr-gate.py` が X の分岐の後に変わった、または X 自身が `pr-gate.py` を変える | 同上を X の checkout の helper で実行 | `helper differs from base …` と、`git show <base SHA>:scripts/pr-gate.py > "$TMPDIR/pr-gate-base.py"` で base の版を使う command を示して exit 1。何も書かない（旧: 変更後の helper で自分を検査できた） | base の版の写しで実行し直す（`pr-gate.py` を変えない PR は origin/main を単段 merge してもよい） | P5 |
| X が merge 済み。同じ branch に追加の是正を commit した | `git push origin <branch>` | `PR #N for <branch> is already merged; create a new branch from main` で push が止まる（旧: 素通りして commit が孤児になった） | origin/main から新しい branch を切り、新しい PR にする | P6 |
| PR が `.claude/agents/writer.md` を変える | helper `status --risk R1 --manual not-required` | `CI execution change requires R3 packet` で止まる（旧: R1 で review 無しに通った）。packet 付きなら Minimum 2 | R3 の packet で進める | なし |
| PR が `docs/quality/review-checklist.md` だけを変える | hosted CI、helper | docs と workflow 回帰の job が走り、packet 付きなら Minimum 2（旧: docs だけ） | 従来の条件 | なし |

この列で、現状の事実 1・3〜7・9・10 の穴が塞がる。11 は本体の同期（G1）の後に効く。

### 本 lane 自身の検査と merge（自分の変更で自分の gate を緩めない）

本 lane は `pr-gate.py` を変えるため、先例（PR1 の D9、並走の摩擦の lane）と同じく origin/main の helper で自分を検査する。

1. Coordinator が本 lane の worktree で `git fetch origin` の後、`git show origin/main:scripts/pr-gate.py > "$TMPDIR/pr-gate-main.py"` を作り、`git hash-object "$TMPDIR/pr-gate-main.py"` と `git rev-parse origin/main:scripts/pr-gate.py` の一致を確かめる。
2. cwd を本 lane の worktree にしたまま `python3 "$TMPDIR/pr-gate-main.py" status|capture|record|ready|merge --pr N --packet docs/plans/2026-09-29-harness-pr5-gate-holes.md` を使う（helper は cwd の git で root と HEAD を決める。現状の事実 6）。本 lane の新しい helper で自分の PR を record・Ready・merge しない。
3. 旧い helper には `--reviewed-head` が無い。本 lane の broad は是正の push の前に record し、closure は是正の後の capture で record する（D8 の順序を手で守る）。
4. base が進んだら（origin/main の単段 merge の後）1 をやり直す。`ready` と `merge` の直前には、base が進んでいなくても 1 の blob 照合をやり直す。
5. origin/main の `scripts/doc-consistency-check.sh` と `scripts/check-workflow-git.sh` も `$TMPDIR` に取り出し、本 lane の worktree の root で実行する（checker は既定 mode と `--target plan` の両方、PK5 は `WORKFLOW_BASE_SHA` 付き）。hosted CI は PR の head の script（新しい classifier・pre-push 等）で走り、その妥当性は Double Audit が見る。
6. 本 lane の新しい helper の `status` も、Phase が implementing・PR が Draft・broad の record がある状態で本 lane の worktree で実行し、D2 の自己照合で exit 1（`helper differs from base`）になることを確かめる（AC2 の実物の確認。本 lane は `pr-gate.py` を変えるので必ず違う）。
7. 本 lane の merge の後は、D2 が同じ手順を helper 自身で強制する。`pr-gate.py` を変える後続の PR は、手順を忘れても自分の helper が止まる。本 lane の closeout（R0）は main の新しい helper で行う。

## Scope

行番号は main `7ac96d9e` のもの。各 file の変更は該当行・節に限る。

- S1 `scripts/ci/classify-changes.sh`（D1）
  - `:55` の実行制御（full）の一覧に `.claude/agents/*` を足す。
  - `:59` の policy docs（docs＋workflow）の一覧に `docs/quality/review-checklist.md` を足す。
  - 他の分類・出力 key・fallback は変えない。`src-tauri/src/bin/generate_*` は変えない（D10）。
- S2 `scripts/tests/classify-changes.test.sh`（D1）
  - `.claude/agents/reviewer.md` と `.claude/agents/sub/writer.md`（階層の下も同じ分類）が、既存の実行制御の loop（`:92-99`）と同じ形で rust / rust_drift / frontend / docs / env / generated / traceability / workflow = true・unknown = false。
  - `docs/quality/review-checklist.md` が既存の policy の loop（`:46-52`）と同じ形で docs = true・workflow = true・rust = false・frontend = false。
  - 無関係の docs（`docs/backlog.md`、`docs/quality/other.md`）が docs = true・workflow = false（新しい負例）。
- S3 `scripts/pr-gate.py` の自己照合（D2）
  - `Gate.requirements()` の classifier の取得（`:220`）と同じ base（`pr['base']['sha']`）で `scripts/pr-gate.py` を contents API から取得し、base64 を復号した bytes と、実行中の file（`Path(__file__)`）の bytes を比べる。違えば GateError（exit 1）で `helper differs from base <base SHA>; run: git show <base SHA>:scripts/pr-gate.py > "$TMPDIR/pr-gate-base.py" && python3 "$TMPDIR/pr-gate-base.py" …` を出す。
  - 置く場所は `requirements()` の先頭（PR の差分の取得より前）。status・capture・record・ready・merge はすべて `snapshot()` → `requirements()` を通るので、1 か所で全操作に掛かる。
  - 取得の失敗は既存の `contents()` のとおり exit 2。比較は bytes の完全一致（改行・末尾の空白の正規化をしない）。
- S4 `scripts/pr-gate.py` の `--reviewed-head`（D8）
  - `main()` に `--reviewed-head` を足す。`record --kind review`（broad・closure の両方）で必須（無ければ exit 2、既存の `review needs stage/model/run-ref/evidence` と同じ扱い）。full SHA の形を `sha()` で確かめる。
  - `snap['head']` と違えば GateError（exit 1）で `reviewed head differs from capture head; record the broad before pushing a fix, or audit the current head`。書込みの前に判定する。
  - manual / r4 の record には要求しない。RecordV1 の wire は変えない（reviewed head は capture の head と同じなので record に新しい field を足さない）。
- S5 `scripts/tests/pr-gate.test.py`（D2・D8）
  - CLI の fixture の `contents` に `scripts/pr-gate.py` = 実物（`ROOT/scripts/pr-gate.py` の text）を足す（既存の test が自己照合を通るように）。`args()` の既定に `reviewed_head=H` を足し、既存の CLI の review の record に `--reviewed-head <head>` を足す。
  - 新しい class `HelperVersion`: base の `scripts/pr-gate.py` が実物と 1 byte 違う fixture で、status・capture・record・ready・merge のそれぞれが exit 1、message に `helper differs from base` と base SHA、fake gh の呼出しに `pr ready` / `pr merge` / comment の POST・PATCH が無い。同じ bytes なら status の blockers が従来どおり。base の取得が HTTP 失敗なら exit 2。
  - 新しい class `ReviewedHead`: broad・closure の record で `--reviewed-head` が capture の head と違えば exit 1 で comment を書かない（fake の `comments` が不変）。無ければ exit 2。一致すれば従来どおり record される（`test_packet_double_audit_cli` の形）。
- S6 `scripts/local-ci.sh`（D5）
  - 分類の log（`:187-191`）の直後、最初の gate（`:193` の docs）の前に、`MODE == full` かつ `-L "$REPO_ROOT/node_modules"` なら `log "ERROR=node_modules is a symlink; npm ci would empty its target. Remove the link and run npm ci --ignore-scripts for a real directory"` と `finish FAIL 1`。
  - changed では検査しない（`npm ci` を実行しないため。worktree で symlink を使う正当な運用を止めない）。`:224` の `npm ci` は変えない。
- S7 `scripts/tests/local-ci.test.sh`（D5）
  - fixture の repo に `target/marker` を持つ dir と、それを指す `node_modules` の symlink を置き、PATH の先頭に呼出しを記録する stub の `npm`・`cargo` を置く。`local-ci.sh full` が exit 非 0、evidence に `ERROR=node_modules is a symlink`・`RESULT=FAIL`、`GATE=` の行が 1 つも無い、stub の呼出し記録が空、`target/marker` が残る。
  - 同じ symlink で `local-ci.sh changed` は exit 0 で ERROR が無い。
  - `node_modules` を実 dir にし、full の他の gate を stub（`scripts/tests/run-workflow-tests.sh`・`scripts/check-env-safety.sh`・`npm`・`cargo`）で通すと、ERROR が無く `GATE=frontend-install` と `npm ci` の呼出しがある。
  - `:13` の `grep -Fq 'run_required frontend-install "$REPO_ROOT" npm ci'` は残す。
- S8 `scripts/pre-push.sh`（D6・D7）
  - D6: `:98` の open の照会が空のとき、同じ branch で `gh pr list --head "$branch" --state merged --json number --jq 'if length == 0 then empty else .[0].number end'` を照会する。番号が返れば `[pre-push] PR #<N> for <branch> is already merged; create a new branch from main.` を出して `fail_gate merged-pr`。照会の失敗は `fail_gate ready-state-lookup`（既存と同じ fail-closed）。open の PR があれば merged を照会しない（branch 名を再利用した新しい PR を止めない）。
  - D7: Ready の確認の後、分類の前に、push する各 ref のうち `local_oid` が HEAD と同じものについて、push 範囲（分類と同じ起点: remote_oid、新しい ref なら origin/main（無ければ main）との merge-base）の変更 file と `git diff --name-only`（index と作業 tree の差 = 未 stage）の共通部分を求め、空でなければ `[pre-push] WARN: unstaged changes in pushed files: <path…>` を stderr に出す。exit code・`quality-check.log` の outcome は変えない。起点が決まらない ref は WARN の対象にしない（止めない）。
- S9 `scripts/tests/pre-push.test.sh`（D6・D7）
  - fake の `gh`（`:56-82`）に `--state` の解析と、`FAKE_MERGED_HEAD`（その branch の merged の照会に `[{"number":42}]` を返す）を足す。既定は merged も `[]`。
  - merged の branch → exit 非 0、log の最後が `FAIL merged-pr`、stderr に `already merged` と `new branch`。open の Draft の PR と merged の PR が同じ branch にある → exit 0（open を優先）。PR 無し → exit 0（既存の `run_hook true` の形）。merged の照会だけ失敗 → exit 非 0・`FAIL ready-state-lookup`。
  - push 範囲の file（`src/example.ts`）に未 stage の変更 → exit 0、stderr に `WARN: unstaged changes in pushed files` と path。push 範囲の外の file の未 stage の変更 → WARN が出ない。変更なし → WARN が出ない。
- S10 `.gitignore` と `.claude/agents/**`（D3）
  - `.gitignore:116` の `.claude/agents` を消し、`:100-107` の comment に「`.claude/agents` は tracked の subagent 定義を置くので除外しない（本体の checkout の sandbox の mount は同期で実 dir になれば消える）」の 1 文を足す。他の行は変えない。
  - `.claude/agents/writer.md`: frontmatter `name: writer`、`description`（Plan Packet の Scope を worktree で実装する Writer。発注書が唯一の指示）、`model: opus`、`effort: medium`。body は 3 行以内（AGENTS.md の `Session Start` から読むこと、発注書が指示の正本であること、報告は発注書の様式）。規則を複製しない。
  - `.claude/agents/reviewer.md`: frontmatter `name: reviewer`、`description`（Plan Review・Final Review・closure の review-only の reviewer。Writer と別 context）、`model: opus`、`effort: medium`、`disallowedTools: Edit, Write, NotebookEdit`。body は 3 行以内（`docs/code_review.md` の出力の形、`docs/templates/subagent-review-packet.md` に従うこと）。
  - Fable 5.1 の reviewer（Final Review の Claude 側、相談役）は定義を作らない（座組の effort は high で、session の値の継承と同じ。Coordinator が Agent tool の `model` で指定する）。
- S11 `.claude/settings.json` と `scripts/tests/claude-hooks.test.sh`（D4）
  - `.claude/settings.json` に `"env": {"CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH": "1"}` を足す。他の key は変えない。
  - `scripts/tests/claude-hooks.test.sh` の `validate_inventory`（`:13-26`）に `jq -e '.env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH == "1"'` を足し、`validate_audit_wiring`（`:68-81`）の classify の検査 path に `.claude/agents/reviewer.md` を足す。既存の負例の作り方（fixture の copy を壊して red を確かめる形）で、env を消した fixture と、classifier から `.claude/agents/*` を外した fixture の 2 つの負例を足す。
- S12 正本の文書（D1〜D9）
  - `docs/agent-guidance/merge-evidence.md`
    - `:53` の実行制御の行に `.claude/agents/**`、`:54` の policy の行に `docs/quality/review-checklist.md` を足す。
    - `:58` の段落（helper は current main 側の分類を使う）に 1 文: 「helper は自分の file が PR の base の `scripts/pr-gate.py` と同じときだけ動き、違えば base の版を使う command を示して止まる（D2）」。
    - `## Helperの境界`（`:146`）の record の説明に `--reviewed-head`（review で必須、capture の head と一致）を足す。
    - `## 実行手順`（`:158-171`）: 例の record に `--reviewed-head "$REVIEWED_HEAD"` を足す。`:171` の後に 2 文: 「broad は是正の push の前に、監査した head の capture で record する」「同じ head に closure run が 2 本あるときは、後に完了判定を出した run を model・run_ref にし、両方の証跡 pointer を evidence に並べて 1 回 record する」。
  - `docs/ci.md`
    - `## Local Commands`（`:49-61`）に 1 文: 「full は `node_modules` が symlink なら gate の前に失敗する（`npm ci` が symlink 先を空にするため）。changed は検査しない」。
    - `## Pre-push Contract`（`:67-73`）に 1 文: 「push 先の branch の PR が open に無く merged にあれば push を拒否し、main から新しい branch を案内する。push する file に未 stage の変更があれば WARN を出して push を続ける」。
    - `## Stale Green Prevention`（`:75-79`）の正規経路の文に「helper は PR の base と同じ版でだけ動く」を足す。
  - `docs/AGENT_OPERATING_MANUAL.md` の `## 座組` の表（`:65-72`）
    - Writer 行の effort 欄の「実効値の注意」を「Agent tool では `subagent_type: writer`（`.claude/agents/writer.md`、effort medium）で起動する。定義を使わない起動は session の値（high）を継承する。実効値を run 報告に記録する（`/tasks`）」に置き換える。`.gitignore:116` と PR5 の句を消す。公式 link は残す。
    - Plan Reviewer 行の「実効値の注意は Writer 行と同じ」を「Opus は `subagent_type: reviewer`（`.claude/agents/reviewer.md`、effort medium、編集の tool なし）」に置き換える。Final Reviewer 行の Opus = medium にも同じ定義を使う旨を 1 句。Fable 5.1 は定義を使わない（high、session の継承）。
    - 表の下の箇条に 1 文: 「subagent の入れ子は `.claude/settings.json` の `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` で止める（`docs/DEV_WORKFLOW.md` Subagent Budget の depth 1）。定義と設定は本体の checkout を同期してから効く」。
    - 表の外の MANUAL の節は変えない（PR4 の所有）。
  - `docs/decision-log.md` の末尾に `## D-099` を追記する（番号の予約は下の G2）。書く内容: D1〜D10 の要旨、D2 の採った案と棄却案、D10 の入れない判断と残るリスク、D1 で `.claude/agents/**` を full にした理由。

対象を使う呼出し側・隣接 test の確認: classifier の consumer は `scripts/pre-push.sh`・`scripts/local-ci.sh`・hosted の `changes` job・`scripts/pr-gate.py:220-221`（どれも出力 key で読み、path の一覧を持たない）と `scripts/tests/claude-hooks.test.sh:78-81`。helper の consumer は merge-evidence の手順と Coordinator の checklist（tracked 外）。`scripts/tests/run-workflow-tests.sh` は既存の test file だけを実行し、本 lane は新しい test file を作らないので登録の変更は無い。

## PR4 との file の所有

| file / 範囲 | 所有 |
|---|---|
| `docs/DEV_WORKFLOW.md`、`docs/templates/**`、`docs/code_review.md`、`docs/quality/review-checklist.md`、`scripts/doc-consistency-check.sh`、`scripts/check-workflow-git.sh`、`scripts/tests/doc-consistency-plan-packet.test.sh`・`workflow-git-checks.test.sh`・`reading-order-drift.test.sh`、`.agents/skills/**`、`AGENTS.md`（follow-up (5) の導線だけ）、`docs/AGENT_OPERATING_MANUAL.md`（`## 座組` の表を除く） | PR4 |
| `scripts/ci/classify-changes.sh`、`scripts/pr-gate.py`、`scripts/local-ci.sh`、`scripts/pre-push.sh` とそれぞれの test、`.gitignore`、`.claude/agents/**`、`.claude/settings.json`、`docs/agent-guidance/merge-evidence.md`、`docs/ci.md`、`docs/AGENT_OPERATING_MANUAL.md` の `## 座組` の表 | PR5 |
| `docs/decision-log.md` の末尾追記、`scripts/tests/run-workflow-tests.sh` への登録 | 両方（merge 順で両方を残す） |
| `docs/Plans.md`、`docs/backlog.md`、`docs/archive/**` | どちらも実装 PR で触らない（closeout） |

- 表に無く本 lane が触る file: `scripts/tests/claude-hooks.test.sh`（S11。settings の監査と classify の検査を持つ test で、settings と classifier を所有する本 lane に置く。PR4 の表にも無い）。判断点 G2 で Coordinator に確かめる。
- merge 順の影響: 本 lane が先に merge されると、PR4 が触る `docs/quality/review-checklist.md` が workflow=true になる。PR4 は `docs/DEV_WORKFLOW.md` 等で元から workflow=true・Minimum 2 なので要件は変わらない。PR4 の branch が本 lane の merge の前に分岐していれば、PR4 の helper の操作は D2 で止まり、origin/main の単段 merge（strict で元々必要）か base の版の写しで進める。PR4 が先なら本 lane への影響は無い（PR4 は `pr-gate.py` を触らない）。
- `docs/decision-log.md` は両方が末尾に足す。後に merge する側が単段 merge で両方の節を残す（番号は G2）。

## Non-scope

- PR4 の範囲すべて（上の表の PR4 の行）。`docs/DEV_WORKFLOW.md:254` の depth 1 の文は変えない（設定で機械化しても文の意味は変わらない）。
- strict の撤去、衝突を解いた版の manual の再利用の条件（owner 2026-09-28）。
- 過去の decision-log の本文と archive の書換え。
- 生成器（`src-tauri/src/bin/generate_*`、`lib.rs` の bindings の export）の classifier の扱い（D10、入れない）。
- RecordV1 の wire の変更（closure の audit を複数にする案。D9 の棄却案）。
- helper の自動の切替え（D2 の棄却案）。
- Fable 5.1・Codex 用の agent 定義（S10 の注記）。`.claude/agents` の `hooks`・`mcpServers`・`permissionMode` の利用。
- tracked 外の資料（`.local/` の checklist・発注書の雛形の symlink の許可の削除、個人 memory の教訓 100 の削除）: 本 lane の merge 後に Coordinator が直す。教訓 100（「subagent の effort 指定は Workflow の `agent()` で」）が要らなくなったことは、merge 後の AC7 の確認で決める。
- `docs/backlog.md` の follow-up (1) の項目を閉じること: closeout で行う（本 lane の実装 PR は backlog を触らない）。

## Acceptance Criteria

baseline は main `7ac96d9e`（本 branch の plan 側の HEAD と script・文書が同じ）で、同じ command を逐語で 2026-09-29 に起草役が実行した実測。test は全 PASS を求め、本数を AC にしない。

- AC1（classifier、D1、S1・S2）: 下の 4 つがすべて成り立つ（`classify-changes.sh --files-from-stdin` の出力と test の exit 0）。
  - `printf '%s\n' .claude/agents/reviewer.md | bash scripts/ci/classify-changes.sh --files-from-stdin` の出力が `rust=true`・`workflow=true`・`unknown=false`。baseline: `rust=false … docs=true … workflow=false unknown=false`。
  - `printf '%s\n' docs/quality/review-checklist.md | bash scripts/ci/classify-changes.sh --files-from-stdin` の出力が `docs=true`・`workflow=true`・`rust=false`・`frontend=false`。baseline: `workflow=false`。
  - `printf '%s\n' docs/backlog.md | bash scripts/ci/classify-changes.sh --files-from-stdin` の出力が `workflow=false`（不変）。baseline: `workflow=false`。
  - `bash scripts/tests/classify-changes.test.sh` が exit 0（S2 の場面を含む）。baseline: exit 0（`PASS: classify-changes`、S2 の場面は未実装）。
- AC2（helper の自己照合、D2、S3・S5）: 下の 2 つ（test の exit 0 と実物の exit 1）。
  - `python3 scripts/tests/pr-gate.test.py -v -k HelperVersion` が exit 0 で各 test が `ok`。baseline: `NO TESTS RAN`、exit 5。
  - 実物: 本 lane の新しい helper の `status` を本 lane の worktree で実行して exit 1・stderr に `helper differs from base`（「本 lane 自身の検査」の 6）。`python3 "$TMPDIR/pr-gate-main.py" status …` は従来どおり動く。
- AC3（reviewed head、D8、S4・S5）: `python3 scripts/tests/pr-gate.test.py -v -k ReviewedHead` が exit 0。baseline: `NO TESTS RAN`、exit 5。`rg -n -- '--reviewed-head' scripts/pr-gate.py docs/agent-guidance/merge-evidence.md` が 3 行以上（helper の引数・Helperの境界・実行手順の例）。baseline: 一致なし（exit 1）。
- AC4（helper の既存の契約、D11）: `python3 scripts/tests/pr-gate.test.py` が exit 0。baseline: exit 0（`OK`）。
- AC5（local-ci、D5、S6・S7）: `bash scripts/tests/local-ci.test.sh` が exit 0（S7 の 3 場面を含む）。baseline: exit 0（`PASS: local-ci`、S7 の場面は未実装）。`rg -n 'node_modules' scripts/local-ci.sh` が 1 行以上。baseline: 一致なし（exit 1）。
- AC6（pre-push、D6・D7、S8・S9）: `bash scripts/tests/pre-push.test.sh` が exit 0（S9 の場面を含む）。baseline: exit 0（`PASS: pre-push`）。`rg -n -- '--state merged' scripts/pre-push.sh` が 1 行。baseline: 一致なし（exit 1）。
- AC7（agent 定義と depth、D3・D4、S10・S11）: 下の 4 つ（`git check-ignore` の exit 1、`jq` の出力 `1`、test の exit 0、merge 後の run 報告）。
  - `git check-ignore -v .claude/agents/reviewer.md` が exit 1（除外されない）。baseline: `.gitignore:116:.claude/agents` と対象 path（tab 区切り）、exit 0。
  - `git ls-files .claude/agents` が `.claude/agents/reviewer.md` と `.claude/agents/writer.md` の 2 行。`rg -n '^effort: medium$' .claude/agents` が 2 行、`rg -n '^disallowedTools: Edit, Write, NotebookEdit$' .claude/agents/reviewer.md` が 1 行。baseline: どれも一致なし。
  - `jq -r '.env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH' .claude/settings.json` が `1`。baseline: `null`。`bash scripts/tests/claude-hooks.test.sh` が exit 0（S11 の 2 つの負例を含む）。baseline: exit 0。
  - merge 後（本体の同期〈G1〉の後）: Coordinator が最初に `subagent_type: writer` か `reviewer` で起動した run の `/tasks` の行に model と effort medium が出ること、その subagent が Agent tool を持たないことを run 報告に記録する（P3 の外部前提の確認。合否は Ready・merge の条件にしない。出なければ follow-up）。
- AC8（正本の文書、S12）: 下の各 `rg` の出力が期待の行数。
  - `rg -n '\.claude/agents' docs/agent-guidance/merge-evidence.md` が 1 行以上、`rg -n 'review-checklist' docs/agent-guidance/merge-evidence.md` が 1 行以上。baseline: どちらも一致なし（exit 1）。
  - `rg -n 'helper differs from base|base の版' docs/agent-guidance/merge-evidence.md docs/ci.md` が 1 行以上。baseline: 一致なし（exit 1）。
  - `rg -n '同じ head に closure run が 2 本' docs/agent-guidance/merge-evidence.md` が 1 行。baseline: 一致なし（exit 1）。
  - `rg -n 'symlink' docs/ci.md` が 1 行以上、`rg -n 'merged' docs/ci.md` が 1 行以上。baseline: どちらも一致なし（exit 1）。
  - `rg -n 'session の値（high）を継承する。Workflow から起動する|gitignore:116' docs/AGENT_OPERATING_MANUAL.md` が 0 行（exit 1）。baseline: 1 行（`:68`）。`rg -n 'subagent_type: writer' docs/AGENT_OPERATING_MANUAL.md` が 1 行、`rg -n 'CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH' docs/AGENT_OPERATING_MANUAL.md` が 1 行。baseline: どちらも一致なし。
  - `rg -c '^## D-099' docs/decision-log.md` が 1（番号は G2 で変わりうる）。baseline: 一致なし（exit 1）。
- AC9（mutation、Test Plan の MU1〜MU12）: 実装を commit した後、`$TMPDIR` の写し（`copy="$TMPDIR/pr5-mut"; mkdir -p "$copy"; git archive HEAD | tar -x -C "$copy"; git -C "$copy" init -q; git -C "$copy" add -A`。改変ごとに作り直し、終わったら消す。本 repo の index・設定は触らない）で各 mutation を入れ、対応する test が red（exit 非 0）になり、改変なしの写しでは green になる。
- AC10（検査の全体。すべて exit 0）: `bash scripts/tests/run-workflow-tests.sh`、`bash scripts/doc-consistency-check.sh`、`bash scripts/doc-consistency-check.sh --target plan`、`bash scripts/check-workflow-git.sh`、`git diff --check origin/main...HEAD`、`bash scripts/local-ci.sh changed`、`bash scripts/check-env-safety.sh`（`.gitignore` を変えるため）。「本 lane 自身の検査」の 5（origin/main の checker と PK5 の cross-run）も exit 0。baseline（plan 側の HEAD の前、main と同じ内容で 2026-09-29 に起草役が実測）: run-workflow-tests exit 0、doc-consistency exit 0（全チェック通過）、check-workflow-git exit 0、`git diff --check origin/main...HEAD` exit 0。local-ci changed・check-env-safety は未実測（実装時に Writer が実測する）。`bash scripts/local-ci.sh full` は Writer の worktree の `node_modules` が実 dir のときだけ実行する（symlink なら本 lane の S6 がまさに止める）。
- AC11（範囲）: `git diff --name-status origin/main...HEAD` の変更 file が S1〜S12 の file と本 packet・Matrix に限られる。`docs/DEV_WORKFLOW.md`・`docs/templates/**`・`docs/code_review.md`・`docs/quality/review-checklist.md`・`scripts/doc-consistency-check.sh`・`scripts/check-workflow-git.sh`・`.agents/**`・`AGENTS.md`・`docs/Plans.md`・`docs/backlog.md`・`src-tauri/**` に本 lane 由来の差分が無い。

## 判断点

owner に諮る判断点（G1）と、Coordinator に確かめる判断点（G2・G3）。各判断点は Plan Review で覆せる。

- G1（owner、plan-approved の依頼と同じ 1 回で諮る。merge 後の作業を含む）: `.claude/agents/**` と `.claude/settings.json` の書込みと、本体の checkout の同期。
  - 確認済みの事実: 本 lane の worktree（`.claude/worktrees/harness-pr5`）では、sandbox の Bash で `mkdir .claude/agents` が成功し（直後に `rmdir`、2026-09-29 の probe）、`.claude/settings.json` は `test -w` が真。本体の checkout では `.claude/settings.json` は `test -w` が偽、`.claude/agents` は sandbox の mount で塞がれる。公式の protected paths は `.claude` を保護し `.claude/worktrees` を除く（P2）。Edit / Write の tool で worktree の `.claude/agents/**` を書けるかは未確認。
  - 選択肢: (a) Writer が worktree で書く。書けなければ Writer は内容を報告に書き、owner が sandbox の外（自分の terminal）でその file を作る。merge 後、owner が本体の checkout を sandbox の外で origin/main に同期する（1 回）。(b) 定義を tracked にせず owner の `~/.claude/agents/` に置く（review が掛からない。classifier の穴を塞ぐ意味が薄れる）。(c) Coordinator の main session を本体でなく origin/main の worktree から起動する運用に変える（session の起動のたびに owner の操作が要る）。
  - 推奨: (a)（candidate。Writer の最初の書込みの結果で、owner の代行が要るかが決まる）。承認すると、Writer・reviewer の subagent が座組表の effort で動き、入れ子が設定で止まる。
- G2（Coordinator、PR4 の packet と照合）: decision-log の番号と、表に無い file（`scripts/tests/claude-hooks.test.sh`）。本 packet は D-099 を予約する（PR4 が D-098 を予約する前提）。PR4 の packet と食い違えば、Coordinator が裁定し、後に merge する側が packet の gated amendment で採番し直す（`docs/DEV_WORKFLOW.md` Review Rules の連番の規則）。
- G3（Coordinator、Plan Review で確かめる）: D2 の方式（自己照合で止める）と D10（生成器を入れない）。どちらも技術判断で、下の Design Intent Trace に理由と棄却案を書いた。

## Design Sources

- Requirements / spec: 該当なし（製品要件を変えない）。
- Architecture / Function / DB / Screen: 該当なし。
- Workflow 正本（本 lane が書き換える文書と、参照だけする文書）: `docs/agent-guidance/merge-evidence.md`（MG-D4 の分類表、MG-D8 helper の境界、RecordV1、「実行手順」）、`docs/ci.md`（Classifier / Pre-push Contract、Local Commands、Stale Green Prevention）、`docs/AGENT_OPERATING_MANUAL.md` の `## 座組`、`docs/DEV_WORKFLOW.md`（Risk Tiers、Subagent Budget の depth 1、Verification Gates。参照だけ）、`docs/project-profile.md` High-risk Changes（参照だけ）。
- 公式資料（2026-09-29 に WebFetch で確かめた。Contract Probe P1〜P4）: [Create custom subagents](https://code.claude.com/docs/en/sub-agents)（frontmatter の `effort`・`model`・`disallowedTools`、scope、「Let subagents spawn their own subagents」）、[Environment variables](https://code.claude.com/docs/en/env-vars)（`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH`）、[Settings](https://code.claude.com/docs/en/settings)（`env` の key と trust）、[Permission modes](https://code.claude.com/docs/en/permission-modes)（Protected paths）。
- Decision log / ADR: D-030（npm ガード、変えない）、D-034（Subagent Budget の depth 1）、D-059（hook inventory、`claude-hooks.test.sh`）、D-085 / MG-D1〜D12（helper と classifier）、D-092（座組表）、D-097（並走の摩擦。helper の差分の判定は変えない）。本 lane は D-099（予約、G2）を足す。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient（製品コードを変えない） |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Workflow gate（classifier、helper、pre-push、local-ci、subagent 定義・設定） | `docs/agent-guidance/merge-evidence.md`、`docs/ci.md`、`docs/AGENT_OPERATING_MANUAL.md` の `## 座組` | updated in this PR（S12） |
| Durable decision / ADR | `docs/decision-log.md` D-099（予約） | updated in this PR（S12） |

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| decision-log の追記 | D-099（予約、G2）。PR4 の D 番号と突き合わせる |
| workflow の正本の文の変更（S12） | link の実在は `bash scripts/doc-consistency-check.sh` の link 検査で確かめる。文書の新設・改名・削除は無い |
| test の追加（S2・S5・S7・S9・S11） | 既存の test file に足す。`scripts/tests/run-workflow-tests.sh` の登録の変更は無い |
| `.claude/agents/**` の新設 | `.gitignore:116` の除外の解除（S10）。classifier の full（S1）。座組表からの参照（S12） |

Tauri command・function-design doc・REQ・route・operator 画面: 該当なし。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| SPEC-WF-HARNESS5 | merge-evidence MG-D4 の分類表 | D1 | `.claude/agents/*.md` は subagent の model・effort・tools に加え `hooks`（command を実行する）と `permissionMode` を持てる設定で、`.claude/settings.json`・`.claude/hooks/*` と同じ「実行制御」に置く。full にすると R0 / R1 の経路（`pr-gate.py:259`）で拒まれ、R3 の packet と Minimum 2 が要る。`docs/quality/review-checklist.md` は review の観点の正本（`docs/DEV_WORKFLOW.md` Review Rules・`AGENTS.md` の初回レビューが参照）で、`docs/code_review.md` と同じ policy docs に置く。却下: `.claude/agents/*` を policy docs（`:59`）に置く（監査の当初案。workflow 回帰と packet 付きの Minimum 2 は掛かるが、R1 の申告で packet 無しに reviewer の定義を変えられる経路が残る）。費用: agent 定義を変える PR は hosted で Rust・frontend の job も走る（変更は稀） | S1 | AC1、S2 |
| SPEC-WF-HARNESS5 | merge-evidence「Helperの境界」、`:58` | D2 | helper が PR の base の `pr-gate.py` と自分の bytes を比べ、違えば止まる。base の classifier を使う既存の設計（`:58`・`:62`「PR が自分用に弱めた policy を信頼しない」）を helper 本体に広げる。変更後の helper が照合そのものを消せば通るが、その変更は Double Audit が読む差分に出る。守るのは「手順を忘れて変更後の helper を使う」事故で、悪意の helper の実行は守らない（hook と同じく local の実行は信頼の外）。却下: (i) 自動で base の版を取得して exec する（摩擦は無いが、GitHub から取った code を暗黙に実行する経路が増え、どの版が動いたかが見えにくい）、(ii) 実行場所の強制（wrapper script。wrapper も PR の checkout にあり同じ問題）、(iii) hosted CI での検査（helper は local で動き、CI はどの helper が動いたかを知らない）、(iv) `pr-gate.py` を変える PR だけ照合する（main が helper を更新した後に古い branch が古い helper で record でき、D8 のような新しい検査が効かない） | S3 | AC2 |
| SPEC-WF-HARNESS5 | 座組表、公式 sub-agents の frontmatter | D3 | 座組表の effort（Writer・Opus reviewer = medium）を Agent tool の起動で効かせる手段は frontmatter の `effort`（公式、P1）。`model: opus` は main が Opus 5.5 なら main と同じ model に解決する（P4）。reviewer は編集の tool を外す（Bash は test と mutation の実注入に要るので残す）。定義の body は規則を複製しない。却下: Workflow の `agent()` だけで指定する（Agent tool の通常の起動に効かない）、Fable の定義も作る（Fable は high で session の継承と同じ） | S10、S12 | AC7 |
| SPEC-WF-HARNESS5 | DEV_WORKFLOW Subagent Budget、公式 env-vars | D4 | depth 1 の規則を設定で機械化する（公式に `1` で入れ子を止めると明記、P1）。project の settings に置き、hook test で固定する。却下: 各定義の `disallowedTools: Agent` だけにする（定義を使わない起動に効かない） | S11 | AC7 |
| SPEC-WF-HARNESS5 | ci.md Local Commands | D5 | full だけが `npm ci` を実行するので、full の最初（gate の前）で止める。途中の gate を走らせてから止めると時間を捨てる。changed は止めない（worktree の symlink は changed の正当な使い方）。却下: `npm ci` の直前に置く（Rust の gate の後まで待つ）、symlink を自動で外す（本体の checkout を壊す操作に近づく） | S6 | AC5 |
| SPEC-WF-HARNESS5 | ci.md Pre-push Contract | D6 | open の PR が無く merged の PR がある branch への push は、PR に載らない commit を作るだけ。open を優先して branch 名の再利用を止めない。照会の失敗は既存どおり止める。却下: closed（merge されていない）も止める（閉じた PR の branch を作り直す正当な使い方がある） | S8 | AC6 |
| SPEC-WF-HARNESS5 | ci.md Pre-push Contract | D7 | 未 stage の変更は正当な WIP でも起きるので止めず WARN。push する file と HEAD の ref に限って雑音を減らす。却下: 止める（WIP の push を止める）、全 ref に出す（HEAD でない ref の作業 tree は無関係） | S8 | AC6 |
| SPEC-WF-HARNESS5 | merge-evidence「Helperの境界」「実行手順」 | D8 | review の record に監査した head を必須にし、capture の head と一致を求める。broad・closure の両方に掛ける（closure も是正の後の capture で同じ誤りが起きる）。record の wire は変えない。却下: broad だけ（closure の同じ穴が残る）、record に reviewed head の field を足す（capture の head と同じ値の複製） | S4 | AC3 |
| SPEC-WF-HARNESS5 | merge-evidence「実行手順」、RecordV1 | D9 | 同じ head の 2 本の closure は、後に完了判定を出した run を 1 つの audit にし、両方の証跡を evidence に並べる（record は後の書込みで closure を置き換える現行の振舞いに合う）。却下: `Closure.audit` を配列にする（RecordV1 の wire・既存の record・fixture の変更が要り、closure の必要数は 1 のまま） | S12 | AC8 |
| SPEC-WF-HARNESS5 | ci.md Classifier Contract、教訓 52 | D10 | 生成器を workflow に入れない。`src-tauri/src/bin/generate_traceability.rs` は T4 の baseline（`FE_UNREFERENCED_BASELINE`）を持ち、UI の lane が REQ の無い frontend test を足すたびに更新する（#35・#40）。full にすると UI の lane が Minimum 2 と全 job を負う。bindings の export の本体は `src-tauri/src/lib.rs`（#88 の変更の主体）で、製品 code と分けられない。どちらも今は `src-tauri/*` で Rust・generated・traceability の全 gate が走る。gate を緩める生成器の変更の Risk は kickoff の「required gate の green / red が変わるか」（教訓 52）と Final Review が判定する。残るリスク: 生成器の判定を緩める変更を R1 と申告すれば packet 無しで通る（Residual Test Gaps）。却下: `generate_*.rs` を full にする（上の費用）、baseline を別 file に分けて判定の code だけ full にする（`src-tauri/**` の変更で本 lane の file の所有を越える。必要なら別 lane） | なし | なし（判断の記録は D-099） |
| SPEC-WF-HARNESS5 | merge-evidence 全体 | D11 | 変えないもの: record の head/base の照合、capture と server の一致、closure の要求、approved snapshot の照合、Double Audit の下限、main 側の classifier の使用、R0 / R1 の `--risk` / `--manual` の要求と CI 実行 code の拒否、manual の再利用の条件、strict、PR の差分による packet の判定（D-097）、pre-push の Ready の拒否と緊急 bypass の token | 全体 | AC4、AC10 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 規則は S12 の正本に、判断と棄却案は D-099 に置く。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: D1〜D10 を merge-evidence・ci.md・座組表と D-099 に置く（S12）。
- Assumptions and constraints: GitHub の contents API が PR の base の `pr-gate.py` を返す（classifier の取得と同じ経路、P5）。`gh pr list --state merged --head` が merge 済みの PR を返す（P6、read-only で確認済み）。project の subagent 定義と settings の `env` は本体の checkout の同期の後に効く（P3、外部前提）。
- Deferred design gaps, risk, and follow-up target: 生成器の classifier（D10、Residual Test Gaps）、agent 定義の実効値の確認（AC7 の merge 後の項目）、tracked 外の資料の更新（Non-scope）。
- Test Design Matrix can cite design decision IDs or source doc sections: D1〜D11 を Matrix が引く。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「helper は base と同じ版でだけ動く」の例外 = 照合を消した helper を実行する場合（D2 の守らない範囲、差分に出る）。「merge 済みの branch への push を止める」の例外 = open の PR がある場合（D6）と緊急 bypass の token（既存）。「symlink の `node_modules` で止める」は full だけ（changed は例外）。「record は監査した head を要る」は review だけ（manual / r4 は対象外）。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 該当なし: 製品の adapter と core を変えない | — |
| Fact check / design decision split | 事実 = 現状の事実 1〜11（起草役が現物で確認）、公式資料（P1〜P4）、probe（P2・P6）。判断 = D1〜D10 と G1〜G3 | Contract Probe、D-099 |
| Lifecycle / retry | review の record の順序（broad → 是正の push → closure）を D8 で機械化。止まった後の戻り方を各 message に書く（base の版の command、新しい branch、実 dir の作り方、broad のやり直し） | Ordinary Operation |
| Operator workflow | 該当なし（店の operator の操作を変えない）。開発の操作列は Ordinary Operation | — |
| Replacement path | helper の実行を「checkout の file」から「base と同じ版」に替える。PR4 等の並走 lane は D2 で止まったら単段 merge か写しで進む（上の「PR4 との file の所有」） | S3、S12 |
| Data safety / evidence | 古い証拠の拒否は強まる（D8 が監査していない head の broad を拒む）。record の wire・capture の形は変えない。helper の自己照合は何も書かずに止まる | AC3、AC4 |
| Reporting / accounting semantics | 該当なし | — |
| Manual verification | 該当なし: 画面が無い。agent 定義の実効値は merge 後の run 報告で確かめる（AC7、Ready・merge の条件にしない） | AC7 |
| 環境・再現性 | agent 定義・depth の設定は本体の checkout の同期に依る（G1、P3）。local-ci の symlink の検査は `-L` だけで OS に依らない。pre-push の merged の照会は `gh` に依り、無ければ既存どおり止まる | G1、S6、S8 |

安全の境界が弱まらないこと:

- 古い証拠の拒否: record の head/base の照合、capture と server の一致、closure の要求は変えない（D11）。D8 は監査した head と capture の head の一致を足すので強まる。
- 独立 review の本数: Double Audit の下限と main 側の classifier は変えない。D1 で `.claude/agents/**` と review-checklist に Minimum 2 が掛かる範囲が広がる。D2 で、変更後の helper が自分の review の要件を読み替える経路が塞がる。
- Human Gate: approved snapshot の照合、Ready・merge の owner 指示は変えない。helper が止まる場面が増えるだけで、Ready・merge の条件を緩めない。
- fail-closed の既定: 新しい照会（base の `pr-gate.py`、merged の PR）の失敗は止まる側（exit 2、`fail_gate ready-state-lookup`）。D7 の WARN は push を止めないが、既存の gate の判定にも影響しない。

新しい停止が正当な作業を止めないこと:

- WIP の push: D7 は WARN だけで exit 0（S9 の test）。
- symlink でない worktree・changed: D5 は full かつ symlink のときだけ止まる（S7 の test）。
- open の PR の branch・PR の無い branch への push: D6 は open が空で merged があるときだけ止まる（S9 の test）。
- `pr-gate.py` を変えない PR の helper: base と同じ版なら従来どおり。main の helper が分岐の後に変わった lane だけが止まり、単段 merge か写しで進む（1 command）。
- agent 定義: 定義を使わない起動（general-purpose・Fable）は従来どおり。

## Design Readiness

- Existing design docs are sufficient because: 分類・helper・pre-push・local-ci の契約の置き場所（merge-evidence・ci.md・座組表）が既にあり、本 lane はその中の行・文を足し替える。新しい概念・wire は作らない（spec-check → plan-draft の skip）。
- Source docs updated in this PR: merge-evidence、ci.md、座組表、decision-log D-099。
- Design gaps intentionally deferred: D10 の生成器、Non-scope の各項目。
- Durable decisions discovered in this plan and promoted to source docs: D-099。

Minimum design checks for business-app work: 製品コードを変えないため、layer・function・DTO・永続化・画面・error の各項目は該当なし。testability は Matrix。

## Contract Probe

- P1「subagent の frontmatter の `effort` が session の effort を上書きし、`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1` が入れ子を止める」: 公式 [sub-agents](https://code.claude.com/docs/en/sub-agents) の frontmatter の表（`effort`: 「Effort level when this subagent is active. Overrides the session effort level. Default: inherits from session」）と「Let subagents spawn their own subagents」（既定は 3 層、`settings.json` の `env` で変える、「Set `1` to turn nesting off」）、[env-vars](https://code.claude.com/docs/en/env-vars)（v2.1.217 以降、正の整数だけ受理）を 2026-09-29 に WebFetch → 成立。local の Claude Code は v2.1.284（`claude --version`）。
- P2「worktree の `.claude/agents/**` と `.claude/settings.json` を書ける」: 公式 [permission-modes](https://code.claude.com/docs/en/permission-modes) の Protected paths は `.claude` を保護し「except for `.claude/worktrees`」（2026-09-29 WebFetch）。本 lane の worktree で sandbox の Bash の `mkdir .claude/agents` が成功（直後に `rmdir`、差分なし）、`test -w .claude/settings.json` が真。本体の checkout では `test -w` が偽 → worktree の Bash では成立。Edit / Write の tool の経路は未確認（Writer が最初の書込みで確かめ、書けなければ G1 の (a) の代行）。
- P3「project の subagent 定義と settings の `env` は session の cwd の checkout から読まれる」: 公式 sub-agents の scope の表（`.claude/agents/` は「Current project」、cwd から上へ走査）と settings（`.claude/settings.json` は clone の中で session を始めたときに読む。`env` の多くは folder の trust の後に効く）→ 成立。本体の checkout の HEAD は `253eef06`（origin/main より古い）で、`.claude/agents` は sandbox の mount（owner `nobody` の character special file）→ merge 後の本体の同期（G1）まで Coordinator の session には効かない。外部前提として AC7 の merge 後の項目で確かめる。
- P4「`model: opus` は Opus 5.5 に解決する」: 公式 sub-agents「Choose a model」（main の model が同じ family なら alias は main の model に解決する）→ 成立（main session が Opus 5.5 である限り）。
- P5「helper は cwd の git で動き、base の file を contents API で取れる」: `scripts/pr-gate.py:196`（`git rev-parse --show-toplevel`）、`rg -c '__file__' scripts/pr-gate.py` → 0 件（exit 1）、`:207-210` の `contents()` と `:220` の classifier の取得 → 成立。自己照合の `Path(__file__)` は新しく足す唯一の file 位置の参照で、写しを `$TMPDIR` から実行しても自分の bytes を読む。
- P6「`gh pr list --head <branch> --state merged` が merge 済みの PR を返す」: `gh pr list --head agent/harness-parallel-friction --state merged --json number,isDraft,state` → `[{"isDraft":false,"number":123,"state":"MERGED"}]`、同じ branch の `--state open` の照会は空（2026-09-29、read-only）→ 成立。
- P7「生成器は UI の lane が日常的に触る」: `git log -- src-tauri/src/bin/generate_traceability.rs` → #35・#40（UI の lane）が `FE_UNREFERENCED_BASELINE` を更新。`git show --stat 7d2002a0`（#88）→ `src-tauri/src/bin/generate_bindings.rs` 8 行と `src-tauri/src/lib.rs` 325 行 → 成立（D10 の前提）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| D1 `.claude/agents/*` は full、`docs/quality/review-checklist.md` は policy、無関係の docs は不変 | S1 | AC1（S2）、AC7（S11 の classify の負例）、MU1・MU2 | — |
| D2 helper は base と同じ版でだけ動く、違えば何も書かず exit 1 | S3 | AC2（`HelperVersion`）、MU3・MU4 | 照合を消した helper の実行（守らない範囲） |
| D3 writer / reviewer の定義（effort medium、reviewer は編集の tool なし）、除外の解除 | S10、S12 | AC7 | 実効値は merge 後の run 報告（P3） |
| D4 depth 1 の設定 | S11 | AC7（`claude-hooks.test.sh` の負例）、MU5 | — |
| D5 local-ci full は symlink の `node_modules` で gate の前に止まる、changed は止めない | S6 | AC5（S7）、MU6・MU7 | — |
| D6 pre-push は merged の branch への push を止め、open を優先、照会失敗で止める | S8 | AC6（S9）、MU8・MU9 | — |
| D7 未 stage の変更の WARN、exit 0 | S8 | AC6（S9）、MU10 | — |
| D8 review の record は `--reviewed-head` を要り、capture の head と一致 | S4 | AC3（`ReviewedHead`）、MU11・MU12 | — |
| D9 同じ head の 2 本の closure の record の仕方 | S12 | AC8 | 文書の規則（helper は検査しない） |
| D10 生成器を入れない | なし | なし | non-scope（D-099 に記録） |
| D11 変えない境界 | 全体 | AC4、AC10 | — |
| 隣接: MG-D4 の分類表と classifier の一致 | S1、S12 | AC1、AC8 | — |
| 隣接: 座組表の effort と定義の一致 | S10、S12 | AC7・AC8 の rg | 表と定義の自動照合はしない（Residual Test Gaps） |

adjacent-contract sweep: S12 が触る節で上表に無い契約は、merge-evidence の RecordV1 の他の field・manual の再利用・base 同期・Actions 停止時、ci.md の Hosted Trigger・Cache Policy・Required Check、座組表の Coordinator・相談役・Human Gate の行（どれも変えない）。

## Test Plan

Test Design Matrix: [2026-09-29-harness-pr5-gate-holes.md](test-matrices/2026-09-29-harness-pr5-gate-holes.md)

- targeted tests: `bash scripts/tests/classify-changes.test.sh`、`python3 scripts/tests/pr-gate.test.py`（`-k HelperVersion`・`-k ReviewedHead` を含む）、`bash scripts/tests/local-ci.test.sh`、`bash scripts/tests/pre-push.test.sh`、`bash scripts/tests/claude-hooks.test.sh`。
- negative tests: Matrix の拒否の行（base と違う helper、監査した head の不一致・欠落、symlink の `node_modules` の full、merged の branch、merged の照会失敗、settings の env の欠落、classifier から `.claude/agents` を外した fixture）。
- mutation（AC9、各 mutation は実注入して red を確かめる。構造の推論だけで済ませない）:
  - MU1: S1 の `.claude/agents/*` を実行制御の行から policy の行へ移す → S2 の `.claude/agents` の `rust=true` の assert が red。
  - MU2: S1 の `docs/quality/review-checklist.md` を消す → S2 の review-checklist の `workflow=true` の assert が red。
  - MU3: S3 の比較を常に一致とする（照合を外す）→ `HelperVersion` の不一致の test が red。
  - MU4: S3 の照合を ready・merge だけに掛ける（status・capture・record では照合しない）→ `HelperVersion` の record の test が red（comment が書かれる）。
  - MU5: `.claude/settings.json` の env を消す → `claude-hooks.test.sh` が red。
  - MU6: S6 の検査を消す → S7 の symlink の場面が red（`npm ci` の stub が呼ばれ、ERROR が無い）。
  - MU7: S6 の条件から `MODE == full` を外す → S7 の changed の場面が red。
  - MU8: S8 の merged の照会を消す → S9 の merged の場面が red（exit 0）。
  - MU9: S8 の merged の照会の失敗を無視する（`|| true`）→ S9 の照会失敗の場面が red。
  - MU10: S8 の WARN を `fail_gate` にする → S9 の未 stage の場面が red（exit 非 0）。
  - MU11: S4 の一致の判定を外す → `ReviewedHead` の不一致の test が red。
  - MU12: S4 の判定を broad だけに掛ける → `ReviewedHead` の closure の不一致の test が red。
- compatibility checks: 既存の helper の test 全体（AC4）、classifier・local-ci・pre-push・hook の既存の場面（AC1・AC5・AC6・AC7）。
- data safety checks: 変更は script・test・設定・文書だけで、実データ・secret を含まない（Data Safety）。
- main wiring/integration checks: `bash scripts/tests/run-workflow-tests.sh`、`bash scripts/local-ci.sh changed`、実装の PR の hosted CI、「本 lane 自身の検査」の 5・6。

## Boundary / Wire Contract

- producer: GitHub REST の `GET /repos/{owner}/{repo}/contents/scripts/pr-gate.py?ref=<base SHA>`（base64）、`gh pr list --state merged`（JSON）、CLI の `--reviewed-head`。
- consumer: `scripts/pr-gate.py` の `Gate.requirements()`・`Gate.record()`、`scripts/pre-push.sh`。
- wire type: contents の base64 の本文、`[{"number": N}]`、40 桁の小文字 hex の SHA。
- internal type: bytes の比較、PR 番号、SHA の文字列比較。
- precision/range: bytes の完全一致（正規化なし）。
- round-trip path: なし（record の wire・capture の形は変えない）。
- invalid input: base の取得失敗は exit 2、不一致は exit 1。`--reviewed-head` の欠落・SHA でない値は exit 2、不一致は exit 1。merged の照会の失敗は push を止める。
- compatibility: CLI は `--reviewed-head` が review の record で必須になる（旧い呼び方は exit 2 で止まる。merge-evidence の実行手順を同時に直す）。RecordV1・capture・exit code の意味は変えない。`.claude/settings.json` は key を足すだけ。

## Review Focus

- Plan Review の冒頭で `Ordinary Operation` の操作列が目的を達成できるかを `成立 / 具体的な反例あり / 外部前提が未確認` で答える（P3 は外部前提）。
- D2 の方式: 自己照合で止める案と、棄却した自動の切替え・wrapper・CI での検査・`pr-gate.py` を変える PR だけの照合の比較。並走の lane（PR4）への影響と、base の SHA が古い場合の振舞い（message の command が base の版を示すので進める）。
- D1 で `.claude/agents/**` を policy でなく full にした理由と費用。
- D10 で生成器を入れない判断と、残るリスクの置き方。
- D8 を closure にも掛けることが、正当な record の順序（merge-evidence の実行手順、manual の再利用の順序）を止めないか。
- D5・D6・D7 の新しい停止が、正当な作業（WIP の push、changed、symlink でない worktree、open の PR）を止めないか。
- G1 の owner の作業（本体の同期）が避けられないか、より軽い経路が無いか。
- 「本 lane 自身の検査と merge」が成り立つか（旧い helper に `--reviewed-head` が無い期間の順序を含む）。

## Spec Contract

Contract ID: SPEC-WF-HARNESS5

- D1: classifier は `.claude/agents/*`（下の階層を含む）を実行制御（全 area = true、unknown = false）に、`docs/quality/review-checklist.md` を policy docs（docs = true・workflow = true、rust = false・frontend = false）に分類する。他の path の分類は変えない。
- D2: helper は status・capture・record・ready・merge のすべてで、実行中の file の bytes が PR の base の `scripts/pr-gate.py` と完全に一致するときだけ先へ進む。違えば何も書かず exit 1 で base の版を使う command を示す。base の取得の失敗は exit 2。
- D3: `.claude/agents/writer.md` と `.claude/agents/reviewer.md` を tracked に置き、どちらも `model: opus`・`effort: medium`、reviewer は `disallowedTools: Edit, Write, NotebookEdit`。`.gitignore` は `.claude/agents` を除外しない。座組表は起動の仕方と実効値の確かめ方を書く。
- D4: `.claude/settings.json` は `env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH = "1"` を持ち、hook test がそれを求める。
- D5: `local-ci.sh full` は `node_modules` が symlink なら、どの gate よりも前に ERROR を log して非 0 で終わる。changed は検査しない。
- D6: pre-push は push 先の branch に open の PR が無く merged の PR があれば push を拒否し（`FAIL merged-pr`）、main から新しい branch を案内する。open があれば merged を照会しない。照会の失敗は拒否する。
- D7: pre-push は HEAD の ref の push 範囲の file に未 stage の変更があれば stderr に WARN を出し、判定と exit code を変えない。
- D8: helper の review の record は `--reviewed-head` を必須にし、capture の head と一致しなければ何も書かず exit 1。
- D9: 同じ head の 2 本の closure run は、後に完了判定を出した run を model・run_ref にし、両方の証跡を evidence に並べて 1 回 record する（文書の規則）。
- D10: 生成器（`src-tauri/src/bin/generate_*`、bindings の export）は classifier の分類を変えない。
- D11: record の head/base の照合、capture と server の一致、closure の要求、approved snapshot の照合、Double Audit の下限、main 側の classifier、R0 / R1 の経路の条件、manual の再利用の条件、strict、PR の差分による packet の判定、pre-push の Ready の拒否と bypass の token は変えない。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-WF-HARNESS5-D1 | S1、S2 | AC1、AC9（MU1・MU2） | full にした理由 | test 出力と mutation の exit |
| SPEC-WF-HARNESS5-D2 | S3、S5 | AC2、AC9（MU3・MU4） | 自己照合の方式 | test 出力、本 lane の新 helper の status の exit 1 |
| SPEC-WF-HARNESS5-D3 | S10、S12 | AC7、AC8 | 定義の中身と座組表 | `git ls-files`・rg、merge 後の `/tasks` |
| SPEC-WF-HARNESS5-D4 | S11 | AC7、AC9（MU5） | 設定の効く条件 | jq・test 出力 |
| SPEC-WF-HARNESS5-D5 | S6、S7 | AC5、AC9（MU6・MU7） | 止める位置 | test 出力 |
| SPEC-WF-HARNESS5-D6 | S8、S9 | AC6、AC9（MU8・MU9） | open の優先 | test 出力 |
| SPEC-WF-HARNESS5-D7 | S8、S9 | AC6、AC9（MU10） | WARN の範囲 | test 出力 |
| SPEC-WF-HARNESS5-D8 | S4、S5 | AC3、AC9（MU11・MU12） | closure にも掛けること | test 出力 |
| SPEC-WF-HARNESS5-D9 | S12 | AC8 | wire を変えないこと | rg 出力 |
| SPEC-WF-HARNESS5-D10 | なし | なし | 残るリスク | D-099 |
| SPEC-WF-HARNESS5-D11 | 全体 | AC4、AC10 | 境界の弱化 | test 出力 |

## Data Safety

- 変更は tracked の script・test・設定・文書だけ。実 POS / 店舗データ、DB、backup、log、receipt、secret、`.env*` を読まず、commit しない。
- local-only: `.local/`（発注書、helper の capture、local-ci の evidence）、`$TMPDIR`（AC9 の mutation の写し、helper・checker の写し）。
- synthetic-only: helper・classifier・pre-push・local-ci・hook の test の fixture（合成の path・SHA・packet・`node_modules` の dir）。GitHub の実 PR は read-only の GET でだけ読み、fixture に写さない。
- local-ci の test は fixture の中の dir だけを symlink の先にし、本 repo の `node_modules` を触らない。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
