# Plan Packet: file:行 の引用を `scripts/doc-consistency-check.sh` で検査する（docs の棚卸し lane 2b）

wave に属さない単独の lane（docs 全体の棚卸し〈owner 2026-10-18、計画は repo 外の回答台帳 TD-327〉の lane 2 の後半。owner の決定〈repo 外の回答台帳 TD-353、2026-10-20〉で lane 2 を 2a の書き換え〈PR #183、2026-10-21 merge、archive packet `docs/archive/plans/2026-10-20-docs-file-line-rewrite.md`〉と 2b の検査〈本 lane〉に分けた）。gate の lane なので、helper・classifier・hosted CI・pre-push・workflow の正本を変える他の lane と並走させず直列にする（起票の時点で open な Draft PR〈#172・#188・#190・#193・#194・#196・#197・#198・#201・#202〉に `scripts/` の検査・`.github/`・workflow の正本を触るものは無い。下の「他の lane との重なり」）。

出所: `docs/Plans.md` の `## 次の行動` の「次 = lane 2b の検査（R3 見込み。path が在る・行数の内・曖昧でないを検査する）」、`docs/backlog.md` の「docs の棚卸し lane 2b「file:行 の検査」」の項目、D-125 の Guarantee range（「検査〈path が在る・行番号の禁止か時点の commit の要求〉を足すかは lane 2 が持つ」）と Revisit（「lane 2 が検査を足すとき」）、2a の packet の「他の lane との重なり」（workflow の 2 file の引用と、残す行の形 `K` を 2b の入力にする）。owner の方針（repo 外の回答台帳 TD-401）: 質問なしで推奨の既定で進めてよい。製品の振舞い・受容リスク・範囲の変更に当たる判断は Open Questions に残す（本 packet では該当なし。下の Open Questions）。

規模と手法: 触るのは検査 script 1 本・新しい test 1 本・test の目録 1 行・workflow の文書 2 行・規則の文書の 1 節。横断の約束は「どの形を行番号の引用とみなし、どこを除くか」の 1 つで、2a の AC の変数 `P`・`K` をそのまま正本にする。1 lane のまま。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

実装後の状態はPR native state / 専用record / CIが所有し、trackedに書かない。

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session）
- Writer: Opus 5.5 subagent（起票は本 run の起草役。実装は plan-approved の後の別の run で `subagent_type: writer`）
- Plan Reviewer: fresh Opus 5.5（`subagent_type: reviewer`、fork でない）+ Codex（model は発注時に決める）。互いに独立で Writer と別 context
- Final Reviewer: Fable 5.1（Claude 側、R3）+ Codex（GPT-6.1 Sol 既定）。互いに独立で Writer・Plan Reviewer と別 context（Double Audit）
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/docs-file-line-check

manual なし: 製品の runtime・画面・配布物を変えない検査 script と docs の変更で、Windows native で確かめる物が無い。

遷移の記録（番号つきの箇条にして、Workflow State の `- key:` の field と key を重ねない）:

1. kickoff → spec-check（2026-10-24、起草役）: 範囲を D-125 の Guarantee range のうち「検査」（TD-353 の 2b）と、2a が送った workflow の 2 file の引用の直しにした。Risk = R3（下の Risk）。
2. spec-check → plan-draft（2026-10-24、起草役、同じ commit）: 表の唯一の skip。規則は D-125 と DOC_STYLE_GUIDE §1 に在り、本 lane はその規則を機械で強制するだけで、検査の形（対象・形・除外）は §1 の列挙から導く（下の Design Readiness）。
3. plan-draft → plan-gate（2026-10-24、起草役、本 commit。state だけ）: packet と Test Design Matrix は前の commit `4e963c0c` で揃っている。Plan Review（Plan Reviewer 行の 2 本）へ出す。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（起票の時点。lane の分け方 TD-353 は 2a の予算で数えた。質問なしで進める方針 TD-401） | 2（Ready 1・merge 1） | 4 | 6 = 0 + 2 + 4 |

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
`scripts/doc-consistency-check.sh` は pre-push（`scripts/pre-push.sh` の `fail_gate doc-consistency`）・local full（`scripts/local-ci.sh` の `run_required docs`）・hosted の docs job（`.github/workflows/ci.yml` の `run: bash scripts/doc-consistency-check.sh`）が実行する merge gate で、本 lane は新しい ERROR（FL1）を足す。`docs/DEV_WORKFLOW.md` Risk Tiers の「merge gate changes」に当たる。この変更でどれかの required gate の green / red が変わるか: 変わる（行番号の引用を持つ docs の変更で docs job が red になる）。Scope の path は classifier（`scripts/ci/classify-changes.sh` の `classify_files`）で `scripts/doc-consistency-check.sh`・`scripts/tests/*` が実行制御（full、`workflow=true`）、`docs/ci.md`・`docs/agent-guidance/*` が workflow の docs（`workflow=true`）。よって Final Review Minimum 2（`docs/DEV_WORKFLOW.md` Workflow State の `Final Review Minimum`、Double Audit）。

## Goal

Goal Invariant:

### 最小完了条件

- push の前（pre-push）と hosted の docs job で、FL1 が次を ERROR で止める: 設計の正本・workflow の正本・runbook・code の comment と `docs/Plans.md` の行番号の引用、`docs/backlog.md` の時点の commit の無い行番号の引用、時点の commit を添えた引用のうち、その commit が解決しない・HEAD の祖先でない、その時点に path が無い、行番号がその時点の file の行数を越える、どの file を指すかが曖昧なもの。
- workflow の 2 file の引用（`docs/ci.md` の `scripts/pr-gate.py:398-410` と `docs/agent-guidance/merge-evidence.md` の `docs/templates/subagent-review-packet.md:15`）を symbol・節で引き直し、本 lane の merge の時点の main で FL1 の ERROR が 0 である。
- 時点の記録（dated の記録の path、library の版を書いた行、変更履歴の表の行）を FL1 が止めず、書き換えもしない。
- 規則の文書（DOC_STYLE_GUIDE §1）から、何を機械で検査するかが分かる。

### 失敗定義

- FL1 が今の main の live な docs・comment（2a が残した残す行と時点つきの引用）や、起票の時点の並走の lane の変更を ERROR にする。
- 時点の記録の file（`docs/archive/**`・`docs/evidence/**`・`docs/research/**`・`docs/plans/**`・`docs/decision-log.md`・`docs/design-system/reference/**`）を ERROR にする、または書き換える。
- 浅い clone で commit が引けないとき、解決しない SHA、HEAD の祖先でない SHA を合格にする（fail-open）。
- 2a の照合（`git log -S` の候補を歩いて書かれた時点の意図を取り戻す AC-S5-5 の loop）を常設の検査に持ち込み、検査が遅く壊れやすくなる。
- 既存の check・既存の test の結果が変わる。

### 非目的

- 書かれた時点の意図との照合を検査にする（2a の AC-S5-5 は 2a の一度きりの道具で、archive に残る）。
- 規則の中身（D-125 と DOC_STYLE_GUIDE §1 の規則）を変える。§1 に足すのは ✅ の印、検査の 1 項、backlog の path を repo root から書くことの明記だけ（下の D7）。
- `P` の外の形（`,N`・`L<N>・N`・` / L<N>` の後ろの数・行番号を文で書く形「65 行」）を拾う。
- 対象を `.agents`・`.claude/{rules,commands,agents,skills}`・`README.md`・`.github`・`scripts` へ広げる（D-125 の対象の外。起票の時点の hit は 0。下の Review Focus Q2）。
- library の名前の一覧（`K` の library の部分）を一般の形にする（下の D3）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、本 lane の merge の後に起きる操作列を、どこで何が走り何が出るかで書く。「旧:」は本 lane の前の振舞い。message の語は下の D6 の固定の語。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| Writer が設計の正本（例 `docs/function-design/10-common-rules.md`）に `` `src-tauri/src/biz/product_service.rs:965` `` と書いた | `git push origin <branch>`（pre-push の docs gate） | FL1 が `FL1: docs/function-design/10-common-rules.md:<行>: 行番号で引いている` の ERROR を出し、push が止まる（旧: 通り、Plan Review・Final Review の目か次の棚卸しで初めて分かった） | path と symbol（`price_range_error`）で書き直して push し直す | Probe P3（N8） |
| 同上を pre-push を通さずに push した | Draft PR の push → hosted docs job | docs job が同じ ERROR で red | 直して push | なし（同じ script を同じ引数で回す） |
| Coordinator が `docs/backlog.md` に「`<sha8>` の時点で `<path>:<N>`」の申し送りを書いた | 同上 | path がその commit に在り、N がその時点の行数の内なら通る。path の綴りの誤り・basename だけの path・行数の外は `の時点で無い` / `行数を越える` の ERROR（旧: 通った） | 綴りを直す、repo root からの path にする | Probe P2・P3（N1〜N3・N9） |
| 同上で SHA の写し誤り、または main に無い branch の commit を書いた | 同上 | `commit に解決しない` / `HEAD の祖先でない` の ERROR（旧: 通った） | main の commit を書く | Probe P3（N4・N10） |
| backlog の行に時点の句の無い行番号を書いた、または句より前に引用を置いた | 同上 | `行番号で引いている`（行に句が無い）/ `時点の commit が無い`（句より前の引用）の ERROR | 句を添える、句を引用の前へ動かす | Probe P3（N6） |
| 時点の句の後に path の無い行番号（`SCREEN_DESIGN L42`、前に path の無い `:12`）を書いた | 同上 | `曖昧` の ERROR | repo root からの path を書く | Probe P3（N5・N7） |
| `docs/Plans.md` に行番号の申し送りを書いた（時点の句つきでも） | 同上 | `行番号で引いている` の ERROR（D-125 (2)。Plans は現在地を持つ所） | backlog へ移すか symbol で書く | なし（起票の時点の Plans の hit は 0） |
| 引用先の file が後で改名・削除された（例: 時点の句つきの backlog の引用の先） | base 同期の後の push | 通る（FL1 は句の commit の tree で path を見る） | — | Probe P2 |
| 開発者の手元の clone が浅く、句の commit の object が無い | `git push`（pre-push） | `commit に解決しない` の ERROR と、浅い clone なら `git fetch --unshallow` の案内（fail-closed。`docs/ci.md` Local Commands の「浅い履歴や解決不能baseは成功にしない」と同じ）。hosted は `fetch-depth: 0` | `git fetch --unshallow` して push し直す | Probe P5 |
| active な Plan Packet・Matrix（`docs/plans/**`）や archive に `path:N` がある | 既定 mode・`--target plan` | 止まらない（時点の記録。DOC_STYLE_GUIDE §1 の対象外） | — | Probe P1 |

## Scope

### 予定の file

| file | 変更 | 目的 |
|---|---|---|
| `scripts/doc-consistency-check.sh` | 関数 `check_file_line_citations`（見出し `FL1: file:行 の引用（D-125）`）を足し、既定 mode と `--target plan` の両方の「参照整合性チェック」の群（`check_markdown_link_targets` の後）で呼ぶ。頭の使い方の comment は変えない | 下の D1〜D6 |
| `scripts/tests/doc-file-line-check.test.sh`（新設） | synthetic な git repo を tmpdir に作り、FL1 を Matrix の行ごとに確かめる。tracked の fixture file は増やさない（`doc-consistency-plan-packet.test.sh` の先例） | Matrix |
| `scripts/tests/run-workflow-tests.sh` | 新しい test を 1 行で呼ぶ | MG-D4 の 1 つの目録（`docs/ci.md` Local Commands「local fullとhosted workflow jobは同じ`run-workflow-tests.sh`を呼び」） |
| `docs/ci.md` | `### Final Trigger Selection` の final run の文の `（`scripts/pr-gate.py:398-410`）` を `（`scripts/pr-gate.py` の `Gate.ci`）` にする | 2a から送られた 1 行。`Gate.ci` が同じ head の latest の run と `Merge gate` の 1 つを見る（起票の時点の `scripts/pr-gate.py` の `class Gate` の `def ci`） |
| `docs/agent-guidance/merge-evidence.md` | `## 実行手順` の R2+ の例の段落の `（`docs/templates/subagent-review-packet.md:15`）` を `（`docs/templates/subagent-review-packet.md` の `## Target`）` にする | 2a から送られた 1 行。欄の名前`対象差分と内容commit`は同じ文に既にある |
| `docs/DOC_STYLE_GUIDE.md` | §1 の見出し「code と文書の箇所の引き方（行番号で引かない）」に ✅FL1 を付け、検査の 1 項（対象・除外・時点の句の照合）を足し、backlog の項に「path は repo root から」を足す | D7。規則の文の 1 か所（D-125）に、機械で検査する範囲を置く |
| `docs/plans/2026-10-24-docs-file-line-check.md`・`docs/plans/test-matrices/2026-10-24-docs-file-line-check.md` | 本 packet と Matrix | — |

`docs/Plans.md`・`docs/backlog.md` は本 lane の PR で触らない。closeout（Post-Merge Closeout）で、Plans の lane 2 の文を 2b の完了に替え、backlog の lane 2b の項目を消す（2a の closeout PR #186 の先例）。

呼び出し側・隣接の確認（`rg` で確かめた）: `scripts/doc-consistency-check.sh` を呼ぶのは `scripts/pre-push.sh`・`scripts/local-ci.sh`・`.github/workflows/ci.yml`、写して回すのは `scripts/tests/doc-consistency-plan-packet.test.sh`（`--target plan`）、stub に置き換えるのは `scripts/tests/local-ci.test.sh`・`scripts/tests/pre-push.test.sh`、呼び出しの文字列を見るのは `scripts/tests/claude-hooks.test.sh`。呼び出しの形（引数・exit code の意味）は変えないので、これらは変えない。`doc-consistency-plan-packet.test.sh` の fixture に `P` の hit は無い（`rg -c -e "$P" scripts/tests/` が何も出さない。下の Probe P6）ので、その synthetic repo で FL1 は ERROR を出さない。

### 検査の形（FL1）

- D1 形: 行番号の引用は 2a の変数 `P` の 4 つの形（拡張子つきの `path:N`、bare の `:N`、path・backtick・`SCREEN_DESIGN`・`mockup` の後の `L<N>`、`#L<N>`）。式は下の Acceptance Criteria の `P` と同じ文字列。
- D2 対象: `docs`・`AGENTS.md`・`CLAUDE.md`・`src`・`src-tauri/src` の file（`rg --files` が列挙するもの。在る path だけを渡す）から、`docs/archive/**`・`docs/evidence/**`・`docs/research/**`・`docs/plans/**`・`docs/decision-log.md`・`docs/design-system/reference/**`・`src/lib/invalidation-contract.static.test.ts`（test の data の文字列）を除く。2a の数え直しの区分と同じ（2a の packet の `### 数え直し`）。
- D3 除外の行: 次の行は止めない。(a) 2a の `K` の library の名前と版（`(TanStack Router|@tanstack/[a-z-]+|@radix-ui/[a-z-]+|happy-dom|tauri-plugin-dialog) X.Y.Z`）を含む行、(b) 行頭が `| YYYY-MM-DD |` の変更履歴の表の行。library の名前は 2a の一覧のまま固定する（一般の `名前 X.Y.Z` にすると、起票の時点の live の範囲で semver を含む 178 行〈39 file〉が除外になり抜け道が広い。下の Probe P7）。新しい library の観測を足す lane は一覧も足す。
- D4 時点の句: 行に `` `<sha8>` の時点で `` があれば、その行の引用を句の commit で照らす（正本・backlog の区別なし。D-125 (3) と §1 の「commit を書いた観測は残す」）。行の中を左から読み、各引用はそれより前で一番近い句の commit、bare の `:N` はそれより前で一番近い path を持つ。照らす中身: (a) SHA が 1 つの commit に解決する（`git rev-parse --verify -q <sha>^{commit}`）、(b) その commit が HEAD の祖先（`git merge-base --is-ancestor`）、(c) path が repo root からの path としてその commit の tree に在る（basename だけは在らない扱い。D7）、(d) `N`（範囲は `N-M`）が `1 ≤ N ≤ M ≤` その時点の file の行数、(e) 行の `P` の一致がどれも path つきの引用か path の後の bare の `:N` に覆われる（覆われない `L<N>`・path の無い `:N` は曖昧）、(f) 句より前の引用は時点の commit が無い。
- D5 `docs/Plans.md`: D3・D4 の除外を当てず、`P` の一致はどれも ERROR（D-125 (2)）。
- D6 結果: 違反は `error`（ERROR、exit 1）。message は `FL1: <file>:<行>: ` に続けて次の固定の語のどれかを含む: `行番号で引いている`、`時点の commit が無い`、`commit に解決しない`（浅い clone なら `git fetch --unshallow` の案内を添える）、`HEAD の祖先でない`、`の時点で無い`、`行数を越える`、`曖昧`。違反が無ければ `info` で照らした引用の数を出す。実装の言語は問わない（bash と `rg`、または PK4 の先例どおり script の中の `python3`）。`P` と `K` の式は本 packet の文字列を写し、両方の engine で同じに読める形（`\x27`・`\s`）のまま使う。
- D7 規則の文書: DOC_STYLE_GUIDE §1 は規則の 1 か所（D-125）なので、機械の検査の範囲もそこに書く。足すのは、見出しの ✅FL1、検査の 1 項（D2 の対象と除外、D3 の除外の行、D4 の照合、D5）、backlog の項の「path は repo root から書く」（2a の書き換えの形〈2a の packet の書き換えの方法の 5〉で、起票の時点の backlog の時点つきの引用 82 個はすべてこの形。Probe P2）。

### 他の lane との重なり

- 起票の時点の open な Draft PR の file（`gh pr view <番号> --json files`）と予定の path の重なりは `docs/backlog.md`（#172・#190・#196・#198・#201）と `docs/Plans.md`（#188・#190・#201）だけで、本 lane の PR はどちらも触らない。gate・workflow の file を触る Draft は無い（#188 の `scripts/probes/stocktake_time_model.py` は検査でない）。
- 並走の lane が足す行と FL1: 各 Draft の差分の追加行（D2 の対象）で `P` に当たるのは #190 の `docs/backlog.md` の 1 行だけで、既存の時点つきの引用（`` `249df0ca` の時点で `src-tauri/src/biz/product_service.rs:153` ``）を含む行の書き換え。照らすと合格（Probe P4）。本 lane の merge の後に並走の lane が FL1 に当たる行を足したら、その lane の同期の後の docs job で分かる（新しい引用を path と symbol に直すのはその lane）。

## Non-scope

- 2a の照合（`git log -S` の候補と親を歩く）の常設化と、backlog の候補にあった `git log --follow` で改名前の path を読む形（FL1 は句の commit の tree で path を見るので、改名の問題が起きない）。
- 規則の中身の変更（D-125、DOC_STYLE_GUIDE §1 の規則）。decision-log の変更（D-125 の本文は append-only。Revisit の答えは「検査を足した、決定は変えない」で、closeout の Plans と本 packet の Implementation Results に書く）。
- `docs/Plans.md`・`docs/backlog.md` の編集（closeout）。
- 他の check（R0・R1・R3・DS1 ほか）の変更。R1（code の中の docs の path の実在）と DS1（design-system の docs の `src/` の path の実在）は行番号を見ない別の役で、FL1 と統合しない。
- `scripts/pr-gate.py`・`.github/workflows/*`・`scripts/ci/*`・`scripts/pre-push.sh`・`scripts/local-ci.sh` の変更。

## Acceptance Criteria

AC の command は repo root で、次の 2 つの変数を同じ shell に定義してから実行する（bash・zsh。2a の packet の `P`・`K` と同じ文字列）。

```sh
P='\.[A-Za-z][A-Za-z0-9]*`?:[0-9]+|(^|[^0-9A-Za-z_:.{}\["\x27])\s?:[0-9]+|(`|\.[A-Za-z][A-Za-z0-9]*|SCREEN_DESIGN[^ ]*|mockup) ?L[0-9]{2,}|#L[0-9]+'
K='(TanStack Router|@tanstack/[a-z-]+|@radix-ui/[a-z-]+|happy-dom|tauri-plugin-dialog) [0-9]+\.[0-9]+\.[0-9]+|`[0-9a-f]{8}` の時点で|^[^:]+:[0-9]+:\| 20[0-9]{2}-[0-9]{2}-[0-9]{2} \|'
```

- AC1: `bash scripts/doc-consistency-check.sh` が exit 0 で、出力に `FL1` を含む行がある（`bash scripts/doc-consistency-check.sh | rg -c 'FL1'` が 1 以上）。
- AC2: `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-24-docs-file-line-check.md` が exit 0 で、出力に `FL1` を含む行がある（CL9 の両 mode。本 packet の `path:N` は D2 で除外）。
- AC3: `bash scripts/tests/doc-file-line-check.test.sh` が exit 0。Matrix の各行が case になっている（Matrix の Test Name の列）。
- AC4: `bash scripts/tests/run-workflow-tests.sh` が exit 0、`rg -n 'doc-file-line-check.test.sh' scripts/tests/run-workflow-tests.sh` が 1 行。
- AC5（workflow の 2 行）: `rg -n -e "$P" docs/ci.md docs/agent-guidance` が何も出さない（exit 1）。`rg -nF '`scripts/pr-gate.py` の `Gate.ci`' docs/ci.md` と `rg -nF '`docs/templates/subagent-review-packet.md` の `## Target`' docs/agent-guidance/merge-evidence.md` がそれぞれ 1 行。
- AC6（2a の AC と同じ集合が 0）: `rg -n -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' docs AGENTS.md CLAUDE.md | rg -v -e "$K"` が何も出さない（後ろの `rg` の exit 1）。2a の AC-S2-1 と AC-S3-1 の command（下の baseline）も何も出さない。
- AC7（規則の文書）: `rg -n 'FL1' docs/DOC_STYLE_GUIDE.md` が §1 の中に 1 行以上（見出しの ✅FL1 と検査の項）。
- AC8: `bash scripts/check-workflow-git.sh` が exit 0。
- AC9（範囲）: `git diff --name-only origin/main...HEAD | rg -v -x -e 'scripts/doc-consistency-check\.sh' -e 'scripts/tests/doc-file-line-check\.test\.sh' -e 'scripts/tests/run-workflow-tests\.sh' -e 'docs/ci\.md' -e 'docs/agent-guidance/merge-evidence\.md' -e 'docs/DOC_STYLE_GUIDE\.md' -e 'docs/plans/2026-10-24-docs-file-line-check\.md' -e 'docs/plans/test-matrices/2026-10-24-docs-file-line-check\.md'` が何も出さない（後ろの `rg` の exit 1）。`bash scripts/ci/classify-changes.sh | rg -x 'workflow=true'` が 1 行。
- AC10（red の証拠）: Final Review の reviewer が隔離した写しで FL1 の呼び出しを外す（または D4 の (c)・(d) の判定を常に真にする）と、`doc-file-line-check.test.sh` の負例の case が red になる（Contract Audit の mutation。tracked の成果物は変えない）。

baseline（起票の時点、`origin/main` = `843c4938`、2026-10-24。本 packet と Matrix だけを足した branch の working tree で、上の変数を定義して各 command を逐語で実行した。`cut -d: -f1,2` は file と行だけを見るために付けた。`# exit` は pipe の最後の command の終了値）:

```text
## AC1
$ bash scripts/doc-consistency-check.sh > "$TMPDIR/ac1.log" 2>&1; echo "exit=$?"; tail -1 "$TMPDIR/ac1.log"; rg -c 'FL1' "$TMPDIR/ac1.log"
exit=0
結果: WARN 12 件（ERROR なし）
(出力なし)
# exit=1（最後の rg）

## AC2
$ bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-24-docs-file-line-check.md > "$TMPDIR/ac2.log" 2>&1; echo "exit=$?"; tail -1 "$TMPDIR/ac2.log"; rg -c 'FL1' "$TMPDIR/ac2.log"
exit=0
結果: 全チェック通過
(出力なし)
# exit=1（最後の rg）

## AC8
$ bash scripts/check-workflow-git.sh
✅ [workflow-git] PK5 検査 OK
# exit=0

## AC5

$ rg -n -e "$P" docs/ci.md docs/agent-guidance | cut -d: -f1,2
docs/ci.md:29
docs/agent-guidance/merge-evidence.md:160
# exit=0

## AC6
$ rg -n -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' docs AGENTS.md CLAUDE.md | rg -v -e "$K" | cut -d: -f1,2
docs/ci.md:29
docs/agent-guidance/merge-evidence.md:160
# exit=0

$ rg -n -e "$P" -g '!src/lib/invalidation-contract.static.test.ts' src src-tauri/src | rg -v -e "$K"
(出力なし)
# exit=1

$ rg -n -e "$P" docs/backlog.md | rg -v -e '`[0-9a-f]{8}` の時点で'
(出力なし)
# exit=1

$ rg -n -e "$P" docs/Plans.md
(出力なし)
# exit=1

## AC7
$ rg -n 'FL1' docs/DOC_STYLE_GUIDE.md
(出力なし)
# exit=1

## AC4
$ rg -n 'doc-file-line-check.test.sh' scripts/tests/run-workflow-tests.sh
(出力なし)
# exit=1

$ bash scripts/tests/run-workflow-tests.sh
（末尾）
Ran 78 tests in 122.411s

OK
# exit=0
```

AC1 の WARN 12 件はどれも function-design の C1（`cost_price` ほかが DB_DESIGN に未定義）で、本 lane と関係しない。AC9 は起票の commit の後に測る（下の「起票の検証」）。AC3 は file が無い（未実測）。完了の時点の期待: AC5・AC6 は出力なし、AC7・AC4 の `rg` は 1 行以上、AC1・AC2 は exit 0 で `FL1` の行あり。

## Design Readiness

- 引用する設計正本（節まで）: [decision-log](../decision-log.md) の D-125（Decision の (1)〜(3)、Guarantee range、Revisit）、[DOC_STYLE_GUIDE](../DOC_STYLE_GUIDE.md) §1「code と文書の箇所の引き方（行番号で引かない）」と頭の「自動検証」の行（✅ の印）、[DEV_WORKFLOW](../DEV_WORKFLOW.md) の Risk Tiers（merge gate changes）・Workflow State の `Final Review Minimum`・Plan Packet Rules（active plan は `--target plan` で検査）、[ci.md](../ci.md) の Local Commands（hosted docs job は `fetch-depth: 0`、浅い履歴は成功にしない）と Classifier Contract、[merge-evidence](../agent-guidance/merge-evidence.md) の MG-D4（workflow 回帰の 1 つの目録）。2a の packet（`docs/archive/plans/2026-10-20-docs-file-line-rewrite.md`）の `P`・`K` と「他の lane との重なり」。
- 必要な設計成果物: Design artifact selection の「workflow gate change → decision-log か ADR」の行は D-125 が既に持つ（検査を足すことを lane 2 に割り当てた決定）。本 lane は決定を変えない。検査の形の置き場は規則の 1 か所の DOC_STYLE_GUIDE §1（D7、本 lane の実装の PR で足す = updated in this PR）。ほかの行（BIZ・CMD・DB・画面・format）は当たらない。
- plan にしかない durable な判断の昇格先: D1〜D6 の検査の形は DOC_STYLE_GUIDE §1 の検査の項（D7）と script の comment に置く。D4 の「時点の句つきなら正本の行でも照らして通す」は §1 の「commit を書いた観測はそのまま残す」の当てはめで、規則を足さない。D3 の library の一覧の固定は 2a の `K` の引き継ぎ。
- 前提・制約と延期した gap: `P` の外の形（`,N` ほか）と対象の外の path（`.agents` ほか）は延期する。延期しても安全な理由: 起票の時点の hit が 0（2a の数え直しと下の Probe P1）で、規則の文は残り、review が拾う。
- 絶対保証の自己点検: 「FL1 が行番号の引用を止める」は D1 の 4 つの形と D2 の対象についての主張。例外と escape hatch: (1) D3 (a) の library の版を含む行は、同じ行の別の行番号の引用も止めない（2a の AC-S1-2 と同じ行の単位。起票の時点の該当は 10 行で、すべて library の観測）、(2) D4 の時点の句を添えた引用は、正本の行でも path と行数が合えば通る（規則の「時点を書いた記録」）、(3) 変更履歴の表の行、(4) D2 の除外の path。どれも DOC_STYLE_GUIDE §1 の「時点を書いた記録」「対象外」の列挙に対応し、§1 の検査の項（D7）に書く。
- 判定: ready。

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| workflow の回帰 test の新設 | `scripts/tests/run-workflow-tests.sh` の 1 つの目録に足す（MG-D4） | Scope の行。AC4 |
| source / workflow doc の新設・改名・削除 | 親の目次・索引 | 該当なし（test の script は doc でない。既存の文書の行を直すだけ） |
| Tauri command・bindings・REQ・route・画面 | — | 該当なし（`src` と `src-tauri/src` を変えない） |

## Impact Review Lenses

not applicable: 起点は現地調査・実機確認・外部 tool の振舞いでなく、repo の中の規則（D-125）の機械化。環境・再現性の lens だけ 1 行: FL1 は時点の句の commit の object を要する（新しい環境依存）。hosted は `.github/workflows/ci.yml` の docs job の `fetch-depth: 0` で固定済み、手元の浅い clone は object が無ければ ERROR（D6、fail-closed）。起票の作業 clone（浅い、570 commit）で backlog の 26 個の SHA はすべて引けた（Probe P5）。

## Boundary / Wire Contract

変えない。JSON・CSV・config・manifest・DTO・DB・bindings に触れない。検査の出力は開発者向けの log で、exit code の意味（0 = 問題なし、1 = 不整合、2 = 引数の誤り）は変えない。

## Test Plan

Test Design Matrix: [2026-10-24-docs-file-line-check.md](test-matrices/2026-10-24-docs-file-line-check.md)

- targeted tests: `bash scripts/tests/doc-file-line-check.test.sh`（AC3）。
- negative tests: Matrix の負例の行（D4 の (a)〜(f)、D1 の各形、D5）。各行の期待は ERROR の行に `FL1:`・fixture の `<file>:<行>`・D6 の固定の語が出ること。
- compatibility checks: 実 repo の AC1・AC2（今の live の docs・comment で ERROR 0）、AC4（既存の workflow 回帰が全部 green）、AC8。
- data safety checks: fixture は synthetic（tmpdir の git repo、架空の path と行）。message は file・行・引用の文字列だけで、店の data を出さない。
- main wiring/integration checks: AC1・AC2 の両 mode で `FL1` の見出しが出る（呼び出しの配線）。AC10 の mutation。

起票の検証: AC1・AC2・AC8 は上の baseline（commit の前に実行）。AC9 の範囲と classifier の値は PR の Validation の欄に書く（起票の差分は本 packet と Matrix だけで、classifier は docs だけ = `workflow=false` の見込み。実装の後に `workflow=true`）。

## Review Focus

- D1〜D6 の形が、D-125 と DOC_STYLE_GUIDE §1 の列挙（対象・時点を書いた記録・対象外）から外れていないか。拾い過ぎ（時点の記録・data の行番号を止める）と拾い漏れ（D2 の対象の中の行番号の引用を通す）。
- D4: 句と引用の対応（左から一番近い句、bare の `:N` は一番近い path）と、覆いの検査 (e) が、`SCREEN_DESIGN L42` や path の無い `:N` を黙って通さないか。HEAD の祖先の判定（`origin/main` でなく HEAD にした理由: hosted でも手元でも remote の ref に依らず、branch は main から切るので main の commit は HEAD の祖先）。
- D3 の library の一覧を固定にした判断（一般の形の抜け道 178 行と、新しい library の観測で一覧を足す手間の比較）。
- Q1（D-127、Plan Review で答える）: この変更で不要になる記述・条件は無いか。起草の答え: (1) 2a の AC-S1-1〜AC-S3-2 の一度きりの command は FL1 が常設で置き換える（archive の中なので消さない）。(2) backlog の lane 2b の項目は closeout で消す。その中の候補「`git log --follow` で改名前の path も読む」は採らない（FL1 は句の commit の tree で読むので改名が起きない。2a の照合の loop を検査へ移さない）。(3) `docs/Plans.md` の lane 2 の文は closeout で 2b の完了に替える。(4) D-125 の Revisit の答えは「決定は変えない」で、本文は append-only なので触らない。(5) 既存の R1・DS1 は path の実在を見る別の役で、FL1 と統合しない。
- Q2（Plan Review で答える）: 対象（D2）に `.agents`・`.claude/{rules,commands,agents}` を入れるか。既定: 入れない（D-125 の対象は `docs/` の正本・workflow の正本・runbook と `src/`・`src-tauri/src/` の comment で、起票の時点の hit は 0。2a の数え直しの `rg -c -e "$P" .agents .claude/rules .claude/commands .claude/agents README.md .github scripts` が何も出さない）。
- Q3（Plan Review で答える）: D4 で正本の行の時点の句つきの引用を通すか、2a の AC-S1-4 のように正本では `DOC_STYLE_GUIDE.md` の規則の例だけを許すか。既定: 通す（D-125 (3) の「commit を書いた観測」は file の種類で限らない。起票の時点の正本の時点の句は `docs/DOC_STYLE_GUIDE.md` の規則の例の 1 行だけ）。

## Open Questions

owner へ送る判断事項: なし。製品の振舞い・受容リスク・範囲の変更に当たる判断は無い（検査の形は D-125 の規則の機械化で、範囲は D-125 の Guarantee range と backlog の項目の中）。技術的な既定（Q1〜Q3）は Plan Review で答える。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| CL1 | D-125 (1)・DOC_STYLE_GUIDE §1 の本文（正本・comment は行番号で引かない） | FL1 の D1・D2 | Matrix T2〜T5 | 非対象（L3 なし） |
| CL2 | D-125 (2)・§1 の backlog の項（commit を添える）と Plans の項（行番号の申し送りを置かない） | FL1 の D4・D5 | Matrix T9〜T11・T17 | 非対象 |
| CL3 | D-125 (3)・§1 の時点を書いた記録と対象外 | FL1 の D2 の除外、D3 | Matrix T6〜T8 | 非対象 |
| CL4 | `docs/backlog.md` の lane 2b の項目（path が在る・行数の内・曖昧でない） | FL1 の D4 (c)〜(e)、D7 の repo root の path | Matrix T14〜T16 | 非対象 |
| CL5 | D-125 (3) の「commit を書いた観測」の commit が実在する（照らせる時点） | FL1 の D4 (a)・(b) | Matrix T12・T13 | 非対象 |
| CL6 | `docs/ci.md` Local Commands（浅い履歴・解決不能は成功にしない） | D6 の `commit に解決しない`（fail-closed） | Matrix T12 | 非対象 |
| CL7 | 2a の packet の「他の lane との重なり」（workflow の 2 file を直してから検査、`K` を入力に） | Scope の `docs/ci.md`・`merge-evidence.md` の行、D3 | AC5・AC6、Matrix T7・T8 | 非対象 |
| CL8 | `docs/ci.md` Final Trigger Selection の final run の文と merge-evidence の R2+ の例の文（中身は不変、引用だけ） | 2 行の引用の直し | AC5（中身は reviewer が差分で読む） | 非対象 |
| CL9 | DEV_WORKFLOW Plan Packet Rules（active plan は `--target plan`）、script の両 mode | FL1 を両 mode で呼ぶ | Matrix T18、AC1・AC2 | 非対象 |
| CL10 | MG-D4（workflow 回帰の 1 つの目録） | `run-workflow-tests.sh` の 1 行 | AC4 | 非対象 |
| CL11 | DOC_STYLE_GUIDE の頭の「自動検証: 機械チェック可能な項目には ✅ を付記」 | D7 | AC7 | 非対象 |

隣接の契約の sweep: R1・DS1・R3（path・link の実在）は行番号を見ず、FL1 と対象が重なっても判定は独立（同じ行で両方が ERROR を出しうるが、直し方は別）。PK1〜PK6 は `docs/plans/**` を見て、FL1 は同じ path を除く。exit code の意味と見出しの群の順は変えない。

## Contract Probe

起票の時点（`843c4938`）の repo の中の前提。P2・P3 は scratchpad の未追跡の試作（D1〜D6 を python3 で書いた 90 行ほど。tracked にしない）で測った。実装の test（Matrix）が同じ場面を tracked に持つ。

- P1（今の main の違反は workflow の 2 行だけ）: 試作を repo root で実行 → `FORBID docs/agent-guidance/merge-evidence.md:160`・`FORBID docs/ci.md:29` の 2 行と `{'lib': 10, 'changelog': 3, 'forbidden': 2, 'ok': 83, 'err': 0}`。AC6 の baseline の `rg` と一致する。
- P2（時点つきの引用は句の commit で合う）: 同じ実行の `ok 83`（backlog の 82 と DOC_STYLE_GUIDE の規則の例 1）。D4 の (a)〜(f) で `err 0`。backlog の path はすべて repo root から（basename だけの path は 0）。
- P3（負例を拾う）: 未追跡の `docs/zz-fl1-probe.md` に 11 行を置いて試作を実行し、すぐ消した。結果: `RANGE`（`docs/ci.md:9999`、行数 100）、`NOPATH`（`docs/nope.md`、basename だけの `ci.md`）、`BADSHA`（`deadbeef`）、`UNCOVERED`（`SCREEN_DESIGN L42`）、`NOSHA`（句より前の `docs/ci.md:1`）、`AMBIG`（path の無い `（:12）`）、`FORBID`（句の無い `docs/ci.md:3`）、`RANGE`（`docs/ci.md:1-9999`）、`NOTANC`（`ee10506d` = `origin/agent/backup-offsite` の head）の 9 件が ERROR、正例（`` `843c4938` の時点で `docs/ci.md:1`〜`:5`・`docs/DEV_WORKFLOW.md:40-50` `` と N6 の 2 つめ）は通った。
- P4（並走の lane）: 各 Draft の branch について `git diff -U0 origin/main...origin/agent/<branch>` の D2 の対象の追加行を `rg -e "$P"` に通した → `backup-offsite-runtime` の 1 行（既存の `` `249df0ca` の時点で `src-tauri/src/biz/product_service.rs:153` ``、P2 で合格の引用）だけ、ほかの 9 本は 0。
- P5（commit の object）: `.github/workflows/ci.yml` の docs job の checkout は `fetch-depth: 0`。作業 clone は浅い（`git rev-parse --is-shallow-repository` → `true`、`git log --oneline | wc -l` → `570`）が、backlog の句の 26 個の SHA は `git cat-file -e <sha>^{commit}` ですべて `ok`。
- P6（既存の test の fixture）: `rg -c -e "$P" scripts/tests/` が何も出さない（exit 1）。`doc-consistency-plan-packet.test.sh` の synthetic repo で FL1 は ERROR を出さない。
- P7（library の除外を一般の形にした場合の抜け道）: `rg -c '\S+ [0-9]+\.[0-9]+\.[0-9]+'` を D2 の対象に掛けた和 → `39 files, 178 lines`。2a の固定の一覧なら除外は 10 行（P1 の `lib 10`）。

## Data Safety

- commit しないもの: 実 POS・店舗の data、DB、backup、log、receipt、secret。fixture は tmpdir に作り、架空の path・行・commit だけを使う。
- local-only: Contract Probe の試作と出力（scratchpad）。
- synthetic-only: `scripts/tests/doc-file-line-check.test.sh` の fixture。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。
