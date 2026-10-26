# Plan Packet: file:行 の引用を `scripts/doc-consistency-check.sh` で検査する（docs の棚卸し lane 2b）

wave に属さない単独の lane（docs 全体の棚卸し〈owner 2026-10-18、計画は repo 外の回答台帳 TD-327〉の lane 2 の後半。owner の決定〈repo 外の回答台帳 TD-353、2026-10-20〉で lane 2 を 2a の書き換え〈PR #183、2026-10-21 merge、archive packet `docs/archive/plans/2026-10-20-docs-file-line-rewrite.md`〉と 2b の検査〈本 lane〉に分けた）。gate の lane なので、helper・classifier・hosted CI・pre-push・workflow の正本を変える他の lane と並走させず直列にする。#201（`agent/dev-bins-out-of-msi`）が同じ `scripts/doc-consistency-check.sh` の R0・R1 の走査に `src-tauri/dev-tools/src` を足す計画で（#201 の packet の Scope の `scripts/doc-consistency-check.sh` の行）、#201 を先に merge し、本 lane はその後に base を同期して AC1・AC2・AC3 を回し直す（下の「他の lane との重なり」）。

出所: `docs/Plans.md` の `## 次の行動` の「次 = lane 2b の検査（R3 見込み。path が在る・行数の内・曖昧でないを検査する）」、`docs/backlog.md` の「docs の棚卸し lane 2b「file:行 の検査」」の項目、D-125 の Guarantee range（「検査〈path が在る・行番号の禁止か時点の commit の要求〉を足すかは lane 2 が持つ」）と Revisit（「lane 2 が検査を足すとき」）、2a の packet の「他の lane との重なり」（workflow の 2 file の引用と、残す行の形 `K` を 2b の入力にする）。owner の方針（repo 外の回答台帳 TD-401）: 質問なしで推奨の既定で進めてよい。製品の振舞い・受容リスク・範囲の変更に当たる判断は Open Questions に残す（本 packet では該当なし。下の Open Questions）。

規模と手法: 触るのは検査 script 1 本・新しい test 1 本・test の目録 1 行・hosted CI の workflow の 2 か所（workflow job の checkout の `fetch-depth: 0`、docs job の checker の step の `WORKFLOW_BASE_SHA`）とその drift test・workflow の文書 3 行・review の観点 1 行・規則の文書の 1 節。横断の約束は「どの形を行番号の引用とみなし、どこを除き、時点の句をどの commit・起点で照らすか」の 1 つで、形は 2a の AC の変数 `P` をそのまま正本にし、除外と句は下の D3・D4 の式にする。1 lane のまま。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

実装後の状態はPR native state / 専用record / CIが所有し、trackedに書かない。

- Phase: plan-approved
- Risk: R3
- Plan Commit: 852951a6248f5cf736d77d37605bac4f4f7feb78
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
4. plan-gate のまま round 1 の是正（2026-10-24、起草役）: Review Response 参照。round 2 の Plan Review へ出す。
5. plan-gate のまま round 2 の是正（2026-10-24、Writer）: Review Response 参照。round 3（天井）の Plan Review へ出す。
6. plan-gate → plan-approved（2026-10-26、Coordinator、本 commit）: 条件は `docs/DEV_WORKFLOW.md` の遷移表の「Writer でない独立の Plan Reviewer が P1 / P2 = 0」。round 3（天井）の後の closure 1〜3 の是正を経て、closure 4 の 2 本（Claude 側 fresh Opus 5.5 が `268b513e` に approve P3 1、Codex 577 が P3 を直した `852951a6` に approve P1 / P2 / P3 0）が P1 / P2 = 0 を報告した（下の Review Response の closure 4）。Plan Commit は Codex の closure が監査した `852951a6`（前例: PR #203 の遷移 6）。実装は #201 の merge の後に `origin/main` を単段で取り込んでから始める（上の Scope の #201 との順）。

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
`scripts/doc-consistency-check.sh` は pre-push（`scripts/pre-push.sh` の `fail_gate doc-consistency`）・local full（`scripts/local-ci.sh` の `run_required docs`）・hosted の docs job（`.github/workflows/ci.yml` の `run: bash scripts/doc-consistency-check.sh`）が実行する merge gate で、本 lane は新しい ERROR（FL1）を足す。`docs/DEV_WORKFLOW.md` Risk Tiers の「merge gate changes」に当たる。本 lane は hosted CI の `.github/workflows/ci.yml` も 2 か所変える（workflow job の checkout の履歴の深さ、docs job の checker の step の env）。この変更でどれかの required gate の green / red が変わるか: 変わる（行番号の引用を持つ docs・comment の変更で docs job が red になる。workflow job は full の履歴を取り、実 repo の self-pass で FL1 が句の commit を引ける）。Scope の path は classifier（`scripts/ci/classify-changes.sh` の `classify_files`）で `.github/workflows/ci.yml`・`scripts/doc-consistency-check.sh`・`scripts/tests/*` が実行制御（full、`workflow=true`）、`docs/ci.md`・`docs/agent-guidance/*`・`docs/quality/review-checklist.md` が workflow の docs（`workflow=true`）。R4 の項（破壊的な data・backup の復元・実 data・secret・不可逆な git の操作）には当たらない。よって Final Review Minimum 2（`docs/DEV_WORKFLOW.md` Workflow State の `Final Review Minimum`、Double Audit）。

## Goal

Goal Invariant:

### 最小完了条件

- push の前（docs を含む push の pre-push）と hosted の docs job で、FL1 が次を ERROR で止める: 設計の正本・workflow の正本・runbook・code の comment・`docs/backlog.md` の、時点の印（D4 の commit の句。backlog 以外は D3 (c) の日付の観測の印も）より後ろに無い行番号の引用、`docs/Plans.md` の行番号の引用（印があっても。D-125 (2)）、commit の句を添えた引用のうち、その commit が解決しない・main の祖先でない（PR の branch にだけ在る commit を含む）、その時点に path が無い、行番号がその時点の file の行数を越える、どの file を指すかが曖昧なもの。
- hosted の workflow job（`scripts/tests/run-workflow-tests.sh` の中の実 repo の self-pass）でも、FL1 が句の commit と main の起点を引ける（checkout が full の履歴）。
- workflow の 2 file の引用（`docs/ci.md` の `scripts/pr-gate.py:398-410` と `docs/agent-guidance/merge-evidence.md` の `docs/templates/subagent-review-packet.md:15`）を symbol・節で引き直し、本 lane の merge の時点の main で FL1 の ERROR が 0 である。
- 時点の記録（dated の記録の path、library の版を書いた行、変更履歴の表の行、正本の行の日付の観測の印より後ろ、合っている commit の句の引用。D-125 (3)）と code の文字列（test の fixture・error の文言・data の行番号）を FL1 が止めず、書き換えもしない。
- 規則の文書（DOC_STYLE_GUIDE §1）から、何を機械で検査するかが分かる。ERROR の message が、当たった文字列と直し方を名指す（D-127「起きたその画面で原因と直し方を名指し」）。

### 失敗定義

- FL1 が今の main の live な docs・comment（2a が残した残す行と時点つきの引用）や、起票の時点の並走の lane の変更を ERROR にする。
- 時点の記録の file（`docs/archive/**`・`docs/evidence/**`・`docs/research/**`・`docs/plans/**`・`docs/decision-log.md`・`docs/design-system/reference/**`）を ERROR にする、または書き換える。D-125 (3) が残す正本の行の時点の観測（合っている commit の句、日付の観測の印）を ERROR にする（規則を狭める）。code の文字列を ERROR にする。code の comment（行をまたぐ block comment の中の行を含む）を見落とす。
- 正しい path の書き誤り（その時点に無い path）を `git が失敗した` と出し、path の直し方を名指さない。
- 浅い clone で commit が引けないとき、解決しない SHA・曖昧な SHA、main の祖先でない SHA、起点が決まらないとき、D4 の判定に使わない git の終了値（`merge-base --is-ancestor`・`ls-tree` の 128 ほか）を合格にする（fail-open）。
- PR の branch の commit を句に書いた行を PR で通し、squash の後の main と後続の全 PR の docs job を red にする。
- 未追跡の file で手元だけ red になり、hosted と食い違う。
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
| Writer が設計の正本（例 `docs/function-design/10-common-rules.md`）に `` `src-tauri/src/biz/product_service.rs:965` `` と書いた | `git push origin <branch>`（docs を含む push なので pre-push の docs gate が走る） | FL1 が `FL1: docs/function-design/10-common-rules.md:<行>: 行番号で引いている: src-tauri/src/biz/product_service.rs:965（path と symbol・節で引く）` の ERROR を出し、push が止まる（旧: 通り、Plan Review・Final Review の目か次の棚卸しで初めて分かった） | path と symbol（`price_range_error`）で書き直して push し直す | Probe P3（N8） |
| 同上を pre-push を通さずに push した | Draft PR の push → hosted docs job | docs job が同じ ERROR で red | 直して push | なし（同じ script を同じ引数で回す） |
| Writer が正本に時点の観測（`` `843c4938` の時点で `src-tauri/src/biz/product_service.rs:965` ``、`2026-10-24 の観測: src/a.ts:12`）を書いた | 同上 | commit の句の引用は backlog と同じく D4 の (a)〜(f) で照らし、合えば通る（D-125 (3) の「commit を書いた観測」）。日付の観測の印より後ろは照らさず通る（D3 (c)）。印より前の引用と、印の無い引用（`src/a.ts:12（2026-10-24 の観測）`）は `行番号で引いている` / `時点の commit が無い` の ERROR。観測が今の code への入口として書かれていないか（D-125 の Alternatives）は review が見る（review-checklist の項） | 印を引用の前に置く。今の code への入口なら symbol・節で書く | Probe P11 |
| Writer が code の comment（`src/a.ts` の `// see b.ts:4`、行をまたぐ `/*`〜`*/` の中の `see h.ts:7`、template の `${…}` の中の `` `${1 /* see b.ts:4 */}` ``）に行番号を書いた | `git push`（code だけの push） | pre-push は通る（classifier が `src/*` を frontend、`src-tauri/*` を rust に分け、docs の gate を走らせない）。hosted docs job が `行番号で引いている` で red。code の文字列（`const s = "//fixture/b.ts:4";`、Rust の raw string）は通る（D2 の字句の走査） | comment を symbol で書き直す。手元で先に見るなら `bash scripts/doc-consistency-check.sh` を直接か local full | Probe P10・P13 |
| Coordinator が `docs/backlog.md` に「`<SHA>` の時点で `<path>:<N>`」の申し送りを書いた | docs を含む push（pre-push）→ hosted docs job | path がその commit に在り、N がその時点の行数の内なら通る。path の綴りの誤り・basename だけの path（root に無い `ci.md`）・行数の外は `の時点で無い` / `行数を越える` の ERROR（旧: 通った）。root 直下の file（`AGENTS.md:1`）は repo root からの path なので通る | 綴りを直す、repo root からの path にする | Probe P2・P3（N1〜N3・N9） |
| 同上で SHA の写し誤り、main に無い commit、またはこの PR の branch の commit を書いた | 同上 | `commit に解決しない` / `main の祖先でない` の ERROR（旧: 通った。PR の branch の commit は PR の上で通り、squash の後の main と後続の全 PR で red になっていた） | `git fetch origin main` の後でも出れば、main に在る commit を書く（自分の PR の commit は merge の後の別の PR で、main の commit に書き直す） | Probe P3（N4・N10）、Matrix T13 |
| branch を切った後に main へ入った commit（別の PR の merge）を句に書いた。branch は同期していない | 同上 | 通る（起点〈手元は `origin/main`、hosted は PR の base〉そのものの祖先かを見る。分岐点には下げない） | — | Probe P14、Matrix T13 (iv) |
| 手元の `origin/main` が古く、GitHub で見た main の新しい commit を句に書いた（その commit の object が手元に無い、または新しい main に同期済みの別の branch を fetch して object だけが入った） | pre-push | object が無ければ `commit に解決しない`、object だけが在れば `main の祖先でない`。どちらも `git fetch origin main` の案内を添える | `git fetch origin main` して push し直す。fetch の後でも出れば写し直す（main に在る commit を書く） | Matrix T12 (ii)・T13 (vi) |
| 句の 8 桁の SHA と同じ先頭を持つ object が repo に増えた | 同上 | `commit に解決しない` と、SHA を長くする案内（full SHA でよい） | 句の SHA を長くする | Probe P9 |
| backlog の行に時点の句の無い行番号を書いた、または句より前に引用を置いた | 同上 | `行番号で引いている`（行に句が無い）/ `時点の commit が無い`（句より前の引用）の ERROR | 句を添える、句を引用の前へ動かす | Probe P3（N6） |
| 時点の句の後に path の無い行番号（`SCREEN_DESIGN L42`、前に path の無い `:12`）か `L<N>`・`#L<N>` の形を書いた | 同上 | `曖昧` の ERROR | repo root からの `path:N` の形にする | Probe P3（N5・N7） |
| `docs/Plans.md` に行番号の申し送りを書いた（時点の句つきでも） | 同上 | `行番号で引いている` の ERROR（D-125 (2)。Plans は現在地を持つ所） | backlog へ移すか symbol で書く | なし（起票の時点の Plans の hit は 0） |
| 引用先の file が後で改名・削除された（例: 時点の句つきの backlog の引用の先） | base 同期の後の push | 通る（FL1 は句の commit の tree で path を見る） | — | Probe P2 |
| 開発者の手元の clone が浅く、句の commit の object が無いか、境界で祖先の道が切れている | `git push`（pre-push） | `commit に解決しない` / `main の祖先でない` の ERROR と、浅い clone なら `git fetch --unshallow` の案内（fail-closed。`docs/ci.md` Local Commands の「浅い履歴や解決不能baseは成功にしない」と同じ）。hosted は docs job と workflow job の両方が `fetch-depth: 0` | `git fetch --unshallow` して push し直す | Probe P5・P8 |
| 手元の clone に `origin/main` が無い（remote の ref を消した） | 句のある file を含む push（pre-push） | `起点が決まらない` の ERROR（fail-closed） | `git fetch origin main` して push し直す | Probe P5 |
| 未追跡の file（`docs/local-note.md`）に `path:N` を書いた | pre-push | 止まらない（FL1 は `git ls-files` の tracked の file だけを見る。hosted に無い file で手元だけ red にしない）。`git add` すると止まる | — | Matrix T24 |
| active な Plan Packet・Matrix（`docs/plans/**`）や archive に `path:N` がある | 既定 mode・`--target plan` | 止まらない（時点の記録。DOC_STYLE_GUIDE §1 の対象外） | — | Probe P1 |

## Scope

### 予定の file

| file | 変更 | 目的 |
|---|---|---|
| `scripts/doc-consistency-check.sh` | 関数 `check_file_line_citations`（見出し `FL1: file:行 の引用（D-125）`）を足し、既定 mode と `--target plan` の両方の「参照整合性チェック」の群（`check_markdown_link_targets` の後）で呼ぶ。頭の使い方の comment は変えない | 下の D1〜D6 |
| `scripts/tests/doc-file-line-check.test.sh`（新設） | synthetic な git repo を tmpdir に作り、FL1 を Matrix の行ごとに確かめる。tracked の fixture file は増やさない（`doc-consistency-plan-packet.test.sh` の先例） | Matrix |
| `scripts/tests/run-workflow-tests.sh` | 新しい test を 1 行で呼ぶ | MG-D4 の 1 つの目録（`docs/ci.md` Local Commands「local fullとhosted workflow jobは同じ`run-workflow-tests.sh`を呼び」） |
| `.github/workflows/ci.yml` | (1) `workflow` job（`Workflow regression`）の `actions/checkout@v6` に `with: fetch-depth: 0` を足す。(2) `docs` job の `Run doc consistency check` の step に `env: WORKFLOW_BASE_SHA: ${{ github.event.pull_request.base.sha || github.sha }}`（同じ job の PK5 の step と同じ値）を足す。job・trigger・required の名前・他の step は変えない | (1) workflow job は `run-workflow-tests.sh` → `doc-consistency-plan-packet.test.sh` の「19. D-046 T7: 実 repository の checker self-pass」で実 repo の checker を回す。checkout の既定は深さ 1 で、句の commit も `origin/main` も無い（Probe P8）。`fetch-depth: 0` は全 branch と tag の全履歴を取る（actions/checkout v6 の `action.yml` の `fetch-depth` の description「0 indicates all history for all branches and tags.」と `default: 1`。2026-10-24 に `gh api` で読んだ）。(2) hosted の D4 (b) の起点を PR の base にする |
| `scripts/tests/ci-workflow.test.sh` | `validate_parity` に、`workflow` job の checkout の `fetch-depth == 0` と、docs job の `bash scripts/doc-consistency-check.sh` の step の `WORKFLOW_BASE_SHA` の assert を足す。同じ関数の `lost workflow regression` の `%w[...]`（起票の時点で `run-workflow-tests.sh` の `.sh` の test 12 本〈`classify-changes` 〜 `merge-gate`〉を名指す行）に `doc-file-line-check` を足す（後の PR が目録から新しい test を外したら red にする）。mutation を 2 つ足す: workflow job の checkout だけから `fetch-depth` を外した写し、docs の checker の step だけから env を外した写しで、どちらも `validate_parity` が失敗する（既存の `shallow_mutation` は全ての `fetch-depth: 0` を置き換えるので docs job の assert で先に止まり、workflow job の assert を証明しない） | Matrix T25 |
| `docs/ci.md` | (1) `### Final Trigger Selection` の final run の文の `（`scripts/pr-gate.py:398-410`）` を `（`scripts/pr-gate.py` の `Gate.ci`）` にする。(2) Local Commands の「hosted docs jobは全経路でfetch-depth: 0、実PR head/baseを用いてPK5を実行する。」を「hosted docs jobとworkflow jobは全経路でfetch-depth: 0。docs jobは実PR head/baseを用いてPK5とFL1の起点を決める。」にする | (1) 2a から送られた 1 行。`Gate.ci` が同じ head の latest の run と `Merge gate` の 1 つを見る（起票の時点の `scripts/pr-gate.py` の `class Gate` の `def ci`）。(2) 上の ci.yml の (1)(2) を正本に写す |
| `docs/agent-guidance/merge-evidence.md` | `## 実行手順` の R2+ の例の段落の `（`docs/templates/subagent-review-packet.md:15`）` を `（`docs/templates/subagent-review-packet.md` の `## Target`）` にする | 2a から送られた 1 行。欄の名前`対象差分と内容commit`は同じ文に既にある |
| `docs/quality/review-checklist.md` | 「設計書・code の comment が code と文書の箇所を行番号で引いていないか」の項の括弧に「`P` の 4 つの形は FL1 が検査する。review は `P` の外の形〈`,N`・文で書いた行番号〉と、引き直した symbol・節が正しいかと、時点の印〈commit の句・日付の観測の印〉で FL1 を通った正本の行・code の comment が観測の記録で、今の code への入口でないか〈D-125 の Alternatives〉を見る」を足す | 機械へ移した範囲を review の観点から外し、手作業の重複を無くす（消さずに狭める）。観測か入口かは書いた人の意図で、機械で分けられないので review に残す |
| `docs/DOC_STYLE_GUIDE.md` | §1 の見出し「code と文書の箇所の引き方（行番号で引かない）」に ✅FL1 を付け、検査の 1 項を足し、backlog の項に「path は repo root から」を足す | D7。規則の文の 1 か所（D-125）に、機械で検査する範囲を置く |
| `docs/plans/2026-10-24-docs-file-line-check.md`・`docs/plans/test-matrices/2026-10-24-docs-file-line-check.md` | 本 packet と Matrix | — |

`docs/Plans.md`・`docs/backlog.md` は本 lane の PR で触らない。closeout（Post-Merge Closeout）で、Plans の lane 2 の文を 2b の完了に替え、backlog の lane 2b の項目を消す（2a の closeout PR #186 の先例）。

呼び出し側・隣接の確認（`rg` で確かめた）: `scripts/doc-consistency-check.sh` を呼ぶのは `scripts/pre-push.sh`・`scripts/local-ci.sh`・`.github/workflows/ci.yml`、写して回すのは `scripts/tests/doc-consistency-plan-packet.test.sh`（`--target plan` の synthetic repo と、実 repo の self-pass）、stub に置き換えるのは `scripts/tests/local-ci.test.sh`・`scripts/tests/pre-push.test.sh`、呼び出しの文字列を見るのは `scripts/tests/claude-hooks.test.sh`（`run: bash scripts/doc-consistency-check.sh` の行の grep。step に `env` を足しても `run` の行は変わらない）。呼び出しの形（引数・exit code の意味）は変えないので、これらは変えない。`doc-consistency-plan-packet.test.sh` の synthetic repo の fixture に `P` の hit は無い（下の Probe P6）ので、そこで FL1 は ERROR を出さず、時点の句も無いので D4 (b) の起点も引かない（remote が無くても止まらない）。実 repo の self-pass は hosted では workflow job で回るので、ci.yml の (1) が要る（Probe P8）。

### 検査の形（FL1）

- D1 形: 行番号の引用は 2a の変数 `P` の 4 つの形（拡張子つきの `path:N`、bare の `:N`、path・backtick・`SCREEN_DESIGN`・`mockup` の後の `L<N>`、`#L<N>`）。式は下の Acceptance Criteria の `P` と同じ文字列。`path:N` の path は、一致の `:` から左へ `[A-Za-z0-9_./@-]` が続く所まで（backtick・空白・括弧・`、` で切れる）。`:` の直前が backtick 1 つなら（`P` の 1 つめの形が拾う `` `docs/a.md`:2 ``）、それを飛ばしてから左へ読む。
- D2 対象: `git ls-files` が列挙する tracked の file のうち、`docs`・`AGENTS.md`・`CLAUDE.md`・`src`・`src-tauri/src`・`src-tauri/dev-tools/src`（在るときだけ。#201 が R0・R1 に足す dir と揃える）の下の file から、`docs/archive/**`・`docs/evidence/**`・`docs/research/**`・`docs/plans/**`・`docs/decision-log.md`・`docs/design-system/reference/**` を除く（2a の数え直しの区分と同じ。2a の packet の `### 数え直し`）。未追跡の file は見ない（hosted に無い file で手元だけ red にしない）。code の file（`src`・`src-tauri/src`・`src-tauri/dev-tools/src` の下の `.rs`・`.ts`・`.tsx`・`.css`）は comment の部分だけを照らす。comment の部分は file を頭から 1 文字ずつ読む字句の走査で決め、状態を行をまたいで持つ: line comment（`//` から行末。`.css` には無い）、block comment（`/*` から `*/`。`.rs` は入れ子を数える）が comment。文字列（`"…"`、`.rs` 以外の `'…'`、`\` の escape を飛ばす。`.rs` 以外の `"…"`・`'…'` は行末で閉じる）、`.ts`・`.tsx` の template（`` `…` ``）の本文、`.rs` の raw string（`r`・`br`・`cr` の後に 0 個以上の `#` と `"` で始まる。`\` を escape と読まず、開きと同じ数の `#` を後ろに持つ `"` で閉じる）と char literal（`'x'`・`'\n'`・`'"'`。それ以外の `'` は lifetime として飛ばす）の中は comment でない。template の本文の中の `${` から対応する `}` までは code として読む: `{` と `}` の深さを数え、その中の文字列・comment・入れ子の template も同じ規則で読み、深さ 0 の `}` で template の本文へ戻る（状態は template と `${…}` の積み重ね。`` const s = `${1 /* see b.ts:4 */}`; `` の comment を照らし、`` `${a} //x.ts:6` `` の本文と `` `${"}"} y.ts:8` `` の `"}"` の後ろの本文は照らさない）。comment の中の `P` の一致は、その一致の在る行の引用として出す。他の拡張子（起票の時点は `.svg` 1・`.gitkeep` 2 で、`P` の hit は 0）は見ない。code の文字列（test の fixture・error の文言・data の行番号）は照らさない（D-125 (1) の対象は「code の comment」、(3) は「data の行番号」を対象外にする）。これで起票の版の除外 `src/lib/invalidation-contract.static.test.ts` は要らなくなる（その file の hit は 10 行・11 個で、どれも `"…"` の文字列の中。Probe P10）。起票の時点の live の code での観測は Probe P13・P15・P16。
  - 走査の限界: `.ts`・`.tsx` の regex literal と JSX（文と属性の文字列）は字句として読まないので、その中の記号（引用符・`` ` ``・`//`・`/*`・`{`・`}` ほか）も上の規則どおりに読み、本物の文字列・comment・template・`${…}` との対応（開きと閉じ、`{`・`}` の深さ）がずれうる。ずれが行をまたぐ状態（template・block comment・`${…}` の積み重ねと深さ）に及ぶと、ずれは行をまたぎ、file の終わりまで続きうる。結果は拾い過ぎ（文字列・template の本文・文を comment と読んで ERROR）にも見落とし（本物の comment を読まない）にもなり、その行は原因の記号の行から離れうる。起票の時点の live の code で当たる行は 0（Probe P16）。例は Matrix の「走査の既知の限界の例」。拾い過ぎの直し方は他の ERROR と同じく symbol・節で書く。
- D3 除外: D2 の対象（`docs/Plans.md` を除く）の次の行・部分は止めない。(a) library の名前と版を含む行の全体: 式 `(TanStack Router|@tanstack/[a-z-]+|@radix-ui/[a-z-]+|happy-dom|tauri-plugin-dialog) [0-9]+\.[0-9]+\.[0-9]+`（`K` の 1 つめの選択肢と同じ文字列）。(b) 変更履歴の表の行の全体: file の行の頭が `| YYYY-MM-DD |`（式 `^\| 20[0-9]{2}-[0-9]{2}-[0-9]{2} \|` を file の行に当てる。`K` の 3 つめの選択肢は `rg -n` の出力の `file:行:` の前置きにしか当たらないので写さない）。(c) 日付の観測の印より後ろ: 行の最初の `YYYY-MM-DD の観測`（式 `20[0-9]{2}-[0-9]{2}-[0-9]{2} の観測`）より後ろの部分。印より前の一致は照らす。`docs/backlog.md` には当てない（D-125 (2) が backlog に commit を求める）。日付には照らす tree が無いので、(c) の部分は path も行数も見ない。(a)〜(c) と D4 の commit の句が、D-125 (3)・§1 の「時点を書いた記録（commit・library の版・日付を書いた観測 …）」の正本の行での機械の形で、規則を狭めも広げもしない（下の Review Response の round 2「正本の時点の観測の扱い」）。library の名前は 2a の一覧のまま固定する（一般の `名前 X.Y.Z` にすると、起票の時点の live の範囲で semver を含む 178 行〈39 file〉が除外になり抜け道が広い。下の Probe P7）。一覧に無い library の版の観測は、(c) の日付の印か D4 の commit の句を前に置いて書く。一覧を足すのは gate の script の変更で、classifier が `workflow=true` にする R3 の lane になる（D7 で §1 に書く）。
- D4 時点の句: 句は `` `<SHA>` の時点で ``（SHA は小文字の 16 進 8〜40 桁）。句を照らすのは D2 の対象の `docs/Plans.md` 以外の全ての file（D-125 (2) の backlog の「書いた時点の main の commit を添える」と、(3) の「commit を書いた観測」）。行の中を左から読み、各引用はそれより前で一番近い句の commit を持つ。bare の `:N` は、同じ行でそれより前にある一番近い `path:N` の一致の path を引き継ぐ（`:N` を持たない path〈`` `src/b.rs` の `fn f`（`:12`） `` の `src/b.rs`〉は引き継がない。前に `path:N` が無ければ path の無い `:N` で、(e) の `曖昧`）。照らす中身:
  - (a) SHA が 1 つの commit に解決する（`git rev-parse --verify -q <SHA>^{commit}` が 0）。1 なら `commit に解決しない`。同じ先頭の object が 2 つ以上なら（`git rev-parse --disambiguate=<SHA>` の行が 2 以上）SHA を長くする案内（full SHA でよい）を、浅い clone なら（`git rev-parse --is-shallow-repository` が `true`）`git fetch --unshallow` の案内を添える。
  - (b) その commit が main の祖先: 起点は `WORKFLOW_BASE_SHA` が在って HEAD と違えばそれ、無ければ `origin/main`（PK5 の `scripts/check-workflow-git.sh` の起点の選び方と同じ。`docs/DEV_WORKFLOW.md` の Plan Commit ancestry の段落「measured from `WORKFLOW_BASE_SHA` when it differs from HEAD and otherwise from `origin/main`」）。起点が commit に解決すれば（`git rev-parse --verify -q <起点>^{commit}` が 0）、`git merge-base --is-ancestor <commit> <起点>` が 0 なら合格、1 なら `main の祖先でない`（`git fetch origin main` の案内を添え、浅い clone なら unshallow の案内も添える。手元の `origin/main` が古く、新しい main の commit の object だけが別の ref の fetch で入った場合も 1 になる）。起点が解決しないときは `起点が決まらない`（fail-closed）。起点は照らす句が 1 つ以上あるときにだけ引く。起点そのものを見て、HEAD との分岐点には下げない（PK5 が分岐点を使うのは `起点...HEAD` の差分の範囲を決めるためで、FL1 が問うのは「その commit が main に在るか」。分岐点に下げると、branch を切った後に main へ入った commit を句に書いた正しい行を止める）。PR の branch にだけ在る commit は起点の祖先でないので止まる（helper は squash で merge し〈`scripts/pr-gate.py` の `gh pr merge … --squash`〉、merge の後の main にその commit は残らない。HEAD の祖先で見ると PR の上では通り、merge の後の main と後続の全 PR が red になる）。
  - (c) path が repo root からの path としてその commit の tree に blob で在る: `git ls-tree -z --full-tree <commit> -- <path>` が 0 で終わり、出力が `<path>` と完全に一致する blob の entry を 1 つ持つ。出力が空か、tree（dir）の entry だけなら `の時点で無い`（`git cat-file -e <commit>:<path>` は path が無いと 128 で終わり、下の終了値の規定で `git が失敗した` になって path の直し方を出せないので使わない）。root 直下の file（`AGENTS.md`）も repo root からの path なので、在れば通る。basename で他の dir の file を探して当てることはしない（root に `ci.md` が無ければ `ci.md:1` は `の時点で無い`）。
  - (d) `N`（範囲は `N-M`）が `1 ≤ N ≤ M ≤` その時点の file の行数。行数は blob の改行の数で、最後の改行の後ろに文字があればその行も 1 行と数える（`wc -l` は改行で終わらない 3 行の file を 2 と数えるので使わない）。外れれば（`N=0`・`N>M` の逆順を含む）`行数を越える`。句の SHA が 7 桁以下・41 桁以上なら句と認めず、その行は句の無い行として扱う（`行番号で引いている`）。
  - (e) 覆い: 行の `P` の一致がどれも、path つきの `path:N` か、同じ行の前の一番近い `path:N` の一致の path を引き継ぐ bare の `:N` に覆われる。覆われない一致は `曖昧`: path の無い `:N`、`L<N>`・`#L<N>`（path があっても。照らすのは `:N` の形だけ）。
  - (f) 句より前の引用は `時点の commit が無い`。
  - git の終了値は、(a) の `rev-parse --verify -q` と (b) の `merge-base --is-ancestor` の 0・1、(c) の `ls-tree` の 0 だけを判定に使い、それ以外（`merge-base --is-ancestor` の 128、`ls-tree` の 128 ほか）は `git が失敗した`（fail-closed）。D2 の file の列挙（`git ls-files`）と (d) の blob の読み出しの非 0 も `git が失敗した` で、列挙が失敗したときは 0 file として `info` で通さない（repo の外の `git ls-files` は 128）。
- D5 `docs/Plans.md`: D3・D4 の除外を当てず、`P` の一致はどれも ERROR（D-125 (2)）。
- D6 結果: 違反は `error`（ERROR、exit 1）。message は `FL1: <file>:<行>: <固定の語>: <当たった token>（<直し方>）`。固定の語と直し方: `行番号で引いている`（path と symbol・節で引く。時点の観測なら句〈backlog は commit の句、他は日付の観測の印も可〉を引用の前に置く）、`時点の commit が無い`（句を引用の前へ動かす）、`commit に解決しない`（`git fetch origin main` の後でも解決しなければ main の commit を写し直す。(a) の案内）、`main の祖先でない`（`git fetch origin main` の後でも出れば main に在る commit を書く）、`起点が決まらない`（`git fetch origin main`）、`の時点で無い`（repo root からの path にする）、`行数を越える`（その時点の行を確かめる）、`曖昧`（repo root からの `path:N` の形にする）、`git が失敗した`（git の出力を見る）。test は固定の語・`<file>:<行>`・token で照らし、直し方のうち command（`git fetch --unshallow`・`git fetch origin main`）も照らす。他の直し方の文言は実装で決める。違反が無ければ `info` で照らした引用の数を出す。実装の言語は問わない（bash と `rg`、または PK4 の先例どおり script の中の `python3`）。`P` は本 packet の文字列を写し、両方の engine で同じに読める形（`\x27`・`\s`）のまま使う。`K` は AC6 で 2a の式と突き合わせるだけに使い、FL1 の除外には D3 の 3 つの式、句の認識には D4 の式を使う（`K` の 2 つめの選択肢を除外に使うと、句の行を照らさずに通す）。
- D7 規則の文書: DOC_STYLE_GUIDE §1 は規則の 1 か所（D-125）なので、機械の検査の範囲もそこに書く。足すのは、見出しの ✅FL1、検査の 1 項（D2 の対象・除外・code は comment だけと、D2 の走査の限界の箇条と同じ文〈Probe・Matrix の参照と起票の時点の観測は写さない〉、D3 の 3 つの形と「一覧に無い library の版の観測は日付の観測の印か commit の句を前に置く。一覧を足すのは gate の変更」、D4 の照合〈`docs/Plans.md` 以外の対象の commit の句〉、D5）、backlog の項の「path は repo root から書く」（2a の書き換えの形〈2a の packet の書き換えの方法の 5〉で、起票の時点の backlog の時点つきの引用 82 個はすべてこの形。Probe P2）。検査の項は、同じ §1 の「時点を書いた記録（commit・library の版・日付を書いた観測 …）の行番号は … そのまま残す」の項（`docs/DOC_STYLE_GUIDE.md:88`）が正本の行で機械にどう読まれるか（commit は D4 の句、library の版は D3 (a)、日付は D3 (b) の変更履歴の行か (c) の印）を書き、その項の文は変えない。

### 他の lane との重なり

- 2026-10-24 の open な Draft PR（#172・#188・#190・#193・#194・#196・#197・#198・#201・#202・#203）の file（`gh pr view <番号> --json files`）と予定の path の重なりは `docs/backlog.md`（#172・#190・#196・#198・#201）と `docs/Plans.md`（#188・#190・#201）だけで、本 lane の PR はどちらも触らない。`.github/`・`scripts/`・`docs/ci.md`・`docs/agent-guidance/`・`docs/quality/review-checklist.md`・`docs/DOC_STYLE_GUIDE.md` を今触る Draft は #188 の `scripts/probes/stocktake_time_model.py`（検査でない）だけ。
- #201（head `110894ca`、closure 中）は、実装で `scripts/doc-consistency-check.sh` の R0（`check_stale_parent_doc_references`）と R1（`check_code_doc_references`）の走査に `src-tauri/dev-tools/src` を足し、3 つの bin を `src-tauri/src/bin/` から `src-tauri/dev-tools/src/bin/` へ移す（#201 の packet の Scope）。同じ file を変える gate の lane なので直列にし、#201 を先に merge する見込み。本 lane はその merge の後に base を同期（`origin/main` の merge 1 回）し、AC1・AC2・AC3 と AC4 を回し直す。D2 は `src-tauri/dev-tools/src` を在るときだけ含むので、どちらの順でも移した bin の comment は FL1 から外れない。本 lane が先になったら、#201 が同期の後に自分の AC を回し直す。
- 並走の lane が足す行と FL1: 各 Draft の差分の追加行（D2 の対象）で `P` に当たるのは #190 の `docs/backlog.md` の 1 行だけで、既存の時点つきの引用（`` `249df0ca` の時点で `src-tauri/src/biz/product_service.rs:153` ``）を含む行の書き換え。照らすと合格（Probe P4）。本 lane の merge の後に並走の lane が FL1 に当たる行を足したら、その lane の同期の後の docs job で分かる（新しい引用を path と symbol に直すのはその lane）。

## Non-scope

- 2a の照合（`git log -S` の候補と親を歩く）の常設化と、backlog の候補にあった `git log --follow` で改名前の path を読む形（FL1 は句の commit の tree で path を見るので、改名の問題が起きない）。
- 規則の中身の変更（D-125、DOC_STYLE_GUIDE §1 の規則）。decision-log の変更（D-125 の本文は append-only。Revisit の答えは「検査を足した、決定は変えない」で、closeout の Plans と本 packet の Implementation Results に書く）。
- `docs/Plans.md`・`docs/backlog.md` の編集（closeout）。
- 他の check（R0・R1・R3・DS1 ほか）の変更。R1（code の中の docs の path の実在）と DS1（design-system の docs の `src/` の path の実在）は行番号を見ない別の役で、FL1 と統合しない。
- `scripts/pr-gate.py`・`scripts/ci/*`・`scripts/pre-push.sh`・`scripts/local-ci.sh` の変更。`.github/workflows/ci.yml` は Scope の 2 か所だけで、job・trigger・required の名前・他の step・他の workflow の file は変えない。

## Acceptance Criteria

AC の command は repo root で、次の 2 つの変数を同じ shell に定義してから実行する（bash・zsh。2a の packet の `P`・`K` と同じ文字列）。

```sh
P='\.[A-Za-z][A-Za-z0-9]*`?:[0-9]+|(^|[^0-9A-Za-z_:.{}\["\x27])\s?:[0-9]+|(`|\.[A-Za-z][A-Za-z0-9]*|SCREEN_DESIGN[^ ]*|mockup) ?L[0-9]{2,}|#L[0-9]+'
K='(TanStack Router|@tanstack/[a-z-]+|@radix-ui/[a-z-]+|happy-dom|tauri-plugin-dialog) [0-9]+\.[0-9]+\.[0-9]+|`[0-9a-f]{8}` の時点で|^[^:]+:[0-9]+:\| 20[0-9]{2}-[0-9]{2}-[0-9]{2} \|'
```

- AC1: `bash scripts/doc-consistency-check.sh` が exit 0 で、出力に `FL1` を含む行がある（`bash scripts/doc-consistency-check.sh | rg -c 'FL1'` が 1 以上）。AC1〜AC4 は #201 の merge の後の base 同期の後の working tree で測る（上の「他の lane との重なり」）。
- AC2: `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-24-docs-file-line-check.md` が exit 0 で、出力に `FL1` を含む行がある（CL9 の両 mode。本 packet の `path:N` は D2 で除外）。
- AC3: `bash scripts/tests/doc-file-line-check.test.sh` が exit 0。Matrix の T1〜T18・T21〜T24 と T12b・T12c の各行が case になっている（Matrix の Test Name の列。T19 は AC1・AC2・AC4、T20 は AC10、T25 は `scripts/tests/ci-workflow.test.sh`）。
- AC4: `bash scripts/tests/run-workflow-tests.sh` が exit 0、`rg -n 'doc-file-line-check.test.sh' scripts/tests/run-workflow-tests.sh` が 1 行。
- AC5（workflow の 2 行）: `rg -n -e "$P" docs/ci.md docs/agent-guidance` が何も出さない（exit 1）。`rg -nF '`scripts/pr-gate.py` の `Gate.ci`' docs/ci.md` と `rg -nF '`docs/templates/subagent-review-packet.md` の `## Target`' docs/agent-guidance/merge-evidence.md` と `rg -nF 'hosted docs jobとworkflow jobは全経路でfetch-depth: 0' docs/ci.md` がそれぞれ 1 行。
- AC6（2a の AC と同じ集合が 0）: `rg -n -e "$P" -g '!docs/archive/**' -g '!docs/evidence/**' -g '!docs/research/**' -g '!docs/plans/**' -g '!docs/backlog.md' -g '!docs/decision-log.md' -g '!docs/design-system/reference/**' docs AGENTS.md CLAUDE.md | rg -v -e "$K"` が何も出さない（後ろの `rg` の exit 1）。2a の AC-S2-1 と AC-S3-1 の command（下の baseline）も何も出さない。
- AC7（規則の文書）: `rg -n 'FL1' docs/DOC_STYLE_GUIDE.md` が §1 の中に 1 行以上（見出しの ✅FL1 と検査の項）。
- AC8: `bash scripts/check-workflow-git.sh` が exit 0。
- AC9（範囲）: `git diff --name-only origin/main...HEAD | rg -v -x -e 'scripts/doc-consistency-check\.sh' -e 'scripts/tests/doc-file-line-check\.test\.sh' -e 'scripts/tests/run-workflow-tests\.sh' -e 'docs/ci\.md' -e 'docs/agent-guidance/merge-evidence\.md' -e 'docs/DOC_STYLE_GUIDE\.md' -e '\.github/workflows/ci\.yml' -e 'scripts/tests/ci-workflow\.test\.sh' -e 'docs/quality/review-checklist\.md' -e 'docs/plans/2026-10-24-docs-file-line-check\.md' -e 'docs/plans/test-matrices/2026-10-24-docs-file-line-check\.md'` が何も出さない（後ろの `rg` の exit 1）。`bash scripts/ci/classify-changes.sh | rg -x 'workflow=true'` が 1 行。
- AC10（red の証拠）: Final Review の reviewer が隔離した写しで次のどれかの変異を入れると、`doc-file-line-check.test.sh` の当たる負例の case が red になる（Contract Audit の mutation。tracked の成果物は変えない）: FL1 の呼び出しを外す、D4 の (c)・(d) の判定を常に真にする、(b) の起点を HEAD にする（T13 (i)〜(iii)）、(b) の起点を HEAD との merge-base に下げる（T13 (iv)）、`WORKFLOW_BASE_SHA` を読まない（T13 (v)）、(c) を `git cat-file -e` にする（T14）、判定に使わない git の終了値を合格か判定の値に読む（`merge-base --is-ancestor` の 128 を祖先でない・合格、`ls-tree` の 128 を空の出力、`git ls-files` の非 0 を 0 file の列挙。T23）、unshallow の案内を外す（T12b）、`git fetch origin main` の案内を外す（T12 (ii)・T13 (vi)）、行数を `wc -l` で数える（T15）、code の comment の判定を行の最初の `//` か行頭の `/*`・`*` にする（T5 の文字列の中の `//` と、行をまたぐ block comment の中の行）、template を `${…}` ごと文字列として飛ばす（T5 の `${…}` の中の comment）、code の文字列も照らす（T5）、`.rs` の raw string を普通の文字列として読む（T5 の `r#"a"// x.rs:3"#`・`br#"a"// z.rs:3"#`・`r"C:\"; // see x.rs:2`）、正本の行の句を照らさず止める・日付の観測の印を除外にしない（T21）。workflow job の checkout から `fetch-depth: 0` を外す変異では `bash scripts/tests/ci-workflow.test.sh` が red（T25。この test の中の mutation と同じ形）。
- AC11（hosted CI）: `rg -c 'fetch-depth: 0' .github/workflows/ci.yml` が 3（changes・workflow・docs の 3 job）。`ruby -ryaml -e 'w=YAML.load_file(".github/workflows/ci.yml"); s=w["jobs"]["docs"]["steps"].find{|x| x["run"]=="bash scripts/doc-consistency-check.sh"}; p s.dig("env","WORKFLOW_BASE_SHA"); c=w["jobs"]["workflow"]["steps"].find{|x| x["uses"]=="actions/checkout@v6"}; p c.dig("with","fetch-depth")'` が `"${{ github.event.pull_request.base.sha || github.sha }}"` と `0` の 2 行。
- AC12（review の観点）: `rg -n 'FL1' docs/quality/review-checklist.md` が 1 行（行番号の観点の項）。

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

## AC11（round 1 の是正で足した。同じ base で測った）
$ rg -c 'fetch-depth: 0' .github/workflows/ci.yml
2
# exit=0
$ ruby -ryaml -e '（AC11 の式）'
nil
nil
# exit=0

## AC12・AC5 の 3 つめ（同上）
$ rg -n 'FL1' docs/quality/review-checklist.md
(出力なし)
# exit=1
$ rg -nF 'hosted docs jobとworkflow jobは全経路でfetch-depth: 0' docs/ci.md
(出力なし)
# exit=1
```

AC1 の WARN 12 件はどれも function-design の C1（`cost_price` ほかが DB_DESIGN に未定義）で、本 lane と関係しない。AC9 は起票の commit の後に測る（下の「起票の検証」）。AC3 は file が無い（未実測）。完了の時点の期待: AC5 の `$P` と AC6 は出力なし、AC5 の 3 つの `rg -nF` は各 1 行、AC7 の `rg` は 1 行以上、AC4・AC12 の `rg` は 1 行、AC1・AC2 は exit 0 で `FL1` の行あり、AC11 は 3 と 2 行の値。

## Design Readiness

- 引用する設計正本（節まで）: [decision-log](../decision-log.md) の D-125（Decision の (1)〜(3)、Guarantee range、Revisit）、[DOC_STYLE_GUIDE](../DOC_STYLE_GUIDE.md) §1「code と文書の箇所の引き方（行番号で引かない）」と頭の「自動検証」の行（✅ の印）、[DEV_WORKFLOW](../DEV_WORKFLOW.md) の Risk Tiers（merge gate changes）・Workflow State の `Final Review Minimum`・Plan Packet Rules（active plan は `--target plan` で検査）、[DEV_WORKFLOW](../DEV_WORKFLOW.md) の Plan Commit ancestry の段落（PK5 の起点の選び方。D4 (b) が同じ選び方を使う）、[ci.md](../ci.md) の Local Commands（hosted docs job は `fetch-depth: 0`、浅い履歴は成功にしない。本 lane で workflow job を足す）と Classifier Contract、[merge-evidence](../agent-guidance/merge-evidence.md) の MG-D4（workflow 回帰の 1 つの目録）。2a の packet（`docs/archive/plans/2026-10-20-docs-file-line-rewrite.md`）の `P`・`K` と「他の lane との重なり」。
- 必要な設計成果物: Design artifact selection の「workflow gate change → decision-log か ADR」の行は D-125 が既に持つ（検査を足すことを lane 2 に割り当てた決定）。本 lane は決定を変えない。検査の形の置き場は規則の 1 か所の DOC_STYLE_GUIDE §1（D7、本 lane の実装の PR で足す = updated in this PR）。ほかの行（BIZ・CMD・DB・画面・format）は当たらない。
- plan にしかない durable な判断の昇格先: D1〜D6 の検査の形は DOC_STYLE_GUIDE §1 の検査の項（D7）と script の comment に置く。D3 (a)〜(c) と D4 の句は D-125 (3) の「commit・library の版・日付を書いた観測」の正本の行での機械の形で、規則を足しも狭めもしない。観測か今の code への入口か（D-125 の Alternatives）は review-checklist の項が持つ。D3 の library の一覧の固定は 2a の `K` の引き継ぎ。hosted の workflow job の `fetch-depth: 0` は `docs/ci.md` Local Commands の文に写す。
- 前提・制約と延期した gap: `P` の外の形（`,N` ほか）と対象の外の path（`.agents` ほか）は延期する。code の comment の判定（D2）は字句の走査で、D2 の「走査の限界」の箇条に書いた読み違いで、comment を見落とし、文字列・template の本文・文を comment と読みうる。延期しても安全な理由: 起票の時点の hit が 0（2a の数え直しと下の Probe P1・P10・P13）で、規則の文は残り、review が拾う（review-checklist の観点は `P` の外の形・symbol の正しさ・時点の観測の意図に狭めるが、項目は残す）。
- 絶対保証の自己点検: 「FL1 が行番号の引用を止める」は D1 の 4 つの形と D2 の対象についての主張。例外と escape hatch: (1) D3 (a) の library の版を含む行は、同じ行の別の行番号の引用も止めない（2a の AC-S1-2 と同じ行の単位。起票の時点の該当は 10 行で、すべて library の観測）、(2) D4 の commit の句を添えた引用は、`docs/Plans.md` 以外の D2 の対象の行で、commit・main の祖先・path・行数が合えば通る、(3) 変更履歴の表の行、(4) D3 (c) の日付の観測の印より後ろ（backlog と Plans を除く。path・行数を見ない。起票の時点の該当は 0 行）、(5) D2 の除外の path、code の文字列と D2 の走査の限界。(1)〜(4) は DOC_STYLE_GUIDE §1 の「時点を書いた記録」、(5) は「対象外」の列挙に対応し、§1 の検査の項（D7）に書く。(2)・(4) を今の code への入口に使う書き方は機械で分けられず、review-checklist の項が見る。
- 判定: ready。

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| workflow の回帰 test の新設 | `scripts/tests/run-workflow-tests.sh` の 1 つの目録に足す（MG-D4） | Scope の行。AC4 |
| source / workflow doc の新設・改名・削除 | 親の目次・索引 | 該当なし（test の script は doc でない。既存の文書の行を直すだけ） |
| Tauri command・bindings・REQ・route・画面 | — | 該当なし（`src` と `src-tauri/src` を変えない） |

## Impact Review Lenses

not applicable: 起点は現地調査・実機確認・外部 tool の振舞いでなく、repo の中の規則（D-125）の機械化。環境・再現性の lens だけ 1 行: FL1 は時点の句の commit の object と main の起点（`WORKFLOW_BASE_SHA` か `origin/main`）を要する（新しい環境依存）。hosted は docs job の `fetch-depth: 0`（固定済み）と、本 lane で足す workflow job の `fetch-depth: 0` で揃える。手元の浅い clone・起点の無い clone は ERROR（D4・D6、fail-closed）。起票の作業 clone（浅い、570 commit）で backlog の 26 個の SHA はすべて引けた（Probe P5）。深さ 1 の clone では 26 個とも引けず `origin/main` も無い（Probe P8）。

## Boundary / Wire Contract

変えない。JSON・CSV・config・manifest・DTO・DB・bindings に触れない。検査の出力は開発者向けの log で、exit code の意味（0 = 問題なし、1 = 不整合、2 = 引数の誤り）は変えない。

## Test Plan

Test Design Matrix: [2026-10-24-docs-file-line-check.md](test-matrices/2026-10-24-docs-file-line-check.md)

- targeted tests: `bash scripts/tests/doc-file-line-check.test.sh`（AC3）、`bash scripts/tests/ci-workflow.test.sh`（T25、AC11）。
- negative tests: Matrix の負例の行（D4 の (a)〜(f) と git の終了値、D1 の各形、D5、正本の句）。各行の期待は ERROR の行に `FL1:`・fixture の `<file>:<行>`・D6 の固定の語・当たった token が出ること。
- compatibility checks: 実 repo の AC1・AC2（今の live の docs・comment で ERROR 0）、AC4（既存の workflow 回帰が全部 green）、AC8。
- data safety checks: fixture は synthetic（tmpdir の git repo、架空の path と行）。message は file・行・引用の文字列だけで、店の data を出さない。
- main wiring/integration checks: AC1・AC2 の両 mode で `FL1` の見出しが出る（呼び出しの配線）。AC10 の mutation。

起票の検証: AC1・AC2・AC8 は上の baseline（commit の前に実行）。AC9 の範囲と classifier の値は PR の Validation の欄に書く（起票の差分は本 packet と Matrix だけで、classifier は docs だけ = `workflow=false` の見込み。実装の後に `workflow=true`）。round 1 の是正の後に AC1・AC2・AC8 を同じ形で測り直した（値は baseline と同じ。PR の Validation の欄）。

## Review Focus

- D1〜D6 の形が、D-125 と DOC_STYLE_GUIDE §1 の列挙（対象・時点を書いた記録・対象外）から外れていないか。拾い過ぎ（時点の記録・data の行番号を止める）と拾い漏れ（D2 の対象の中の行番号の引用を通す）。
- D4: 句と引用の対応（左から一番近い句、bare の `:N` は同じ行の前の一番近い `path:N` の一致の path）と、覆いの検査 (e) が、`SCREEN_DESIGN L42` や path の無い `:N`・`L<N>` を黙って通さないか。(b) の起点（PK5 と同じ `WORKFLOW_BASE_SHA` か `origin/main` の、その commit そのもの）が、PR の branch の commit を PR の上で止め、分岐の後に main へ入った commit を通し、squash の後の main を壊さないか。起点を句のあるときだけ引く形が、remote の無い synthetic repo の既存の test を壊さないか。(c) の `ls-tree` の完全一致が、path の不在（空の出力）・dir・git の異常終了を分けるか。
- D2 の字句の走査が、文字列の中の `//`・raw string・char literal と lifetime を取り違えず、行をまたぐ block comment の中の行と template の `${…}` の中の comment を見るか。D2 に書いた走査の限界が、規則の抜け道として許せる範囲か。
- hosted CI の 2 か所（workflow job の `fetch-depth: 0`、docs の checker の step の `WORKFLOW_BASE_SHA`）が足りるか。他に実 repo の checker を回す hosted の経路が無いか（起草の確認: `run-workflow-tests.sh` の中で実 repo を回すのは `doc-consistency-plan-packet.test.sh` の self-pass だけ）。
- D3 の library の一覧を固定にした判断（一般の形の抜け道 178 行と、新しい library の観測で一覧を足す手間の比較。一覧に無い library の版の観測は D3 (c) の印か D4 の句で書ける）。
- Q1（D-127、Plan Review で答える）: この変更で不要になる記述・条件は無いか。起草の答え: (1) 2a の AC-S1-1〜AC-S3-2 の一度きりの command は FL1 が常設で置き換える（archive の中なので消さない）。(2) backlog の lane 2b の項目は closeout で消す。その中の候補「`git log --follow` で改名前の path も読む」は採らない（FL1 は句の commit の tree で読むので改名が起きない。2a の照合の loop を検査へ移さない）。(3) `docs/Plans.md` の lane 2 の文は closeout で 2b の完了に替える。(4) D-125 の Revisit の答えは「決定は変えない」で、本文は append-only なので触らない。(5) 既存の R1・DS1 は path の実在を見る別の役で、FL1 と統合しない。(6) code を comment だけ照らすので、起票の版の除外 `src/lib/invalidation-contract.static.test.ts` を消した（D2）。(7) review-checklist の行番号の観点は、`P` の 4 つの形を FL1 へ移した分だけ狭める（消さない）。(8) `docs/ci.md` Local Commands の「hosted docs jobは全経路でfetch-depth: 0」は workflow job を含む文に置き換える。(9) D4 の照らす file の一覧（backlog と規則の例の file だけ）を消し、`docs/Plans.md` 以外で一律に照らす（規則の例の file の特別扱いが要らなくなった）。(10) D4 (b) の分岐点（merge-base）と「merge-base が 1 つでない」の条件を消した。(11) D2 の「`://` の中の `//` を除く」と行頭の `/*`・`*`・`{/*` の判定は、字句の走査に置き換えて消した。
- Q2（Plan Review で答える）: 対象（D2）に `.agents`・`.claude/{rules,commands,agents}` を入れるか。既定: 入れない（D-125 の対象は `docs/` の正本・workflow の正本・runbook と `src/`・`src-tauri/src/` の comment で、起票の時点の hit は 0。2a の数え直しの `rg -c -e "$P" .agents .claude/rules .claude/commands .claude/agents README.md .github scripts` が何も出さない）。
- Q3（Plan Review で答える）: 正本で時点の句・日付を添えた引用をどう扱うか。既定: D-125 (3)（`docs/decision-log.md` の D-125 の Decision (3)）と §1 の「時点を書いた記録（commit・library の版・日付を書いた観測 …）の行番号は … そのまま残す」（`docs/DOC_STYLE_GUIDE.md:88`）は置き場所を限らないので、正本の行の観測も残す。機械の形は、commit は D4 の句（`docs/Plans.md` 以外で一律に照らす）、library の版は D3 (a)、日付は D3 (b) の変更履歴の行と (c) の `YYYY-MM-DD の観測` の印（backlog は (2) が commit を求めるので除く）。印の無い引用・印より前の引用は止める。D-125 の Alternatives が退けた「全ての引用に commit を添える」は、正本の引用の書き方の方針で、観測の記録と字面では分けられないので、review-checklist の項が見る。起票の時点の正本の句は `docs/DOC_STYLE_GUIDE.md:87` の規則の例の 1 行、日付の観測の印は 0 行（Probe P11）で、この扱いで結果の変わる行は無い。

## Open Questions

owner へ送る判断事項: なし。製品の振舞い・受容リスク・範囲の変更に当たる判断は無い（検査の形は D-125 の規則の機械化で、範囲は D-125 の Guarantee range と backlog の項目の中）。技術的な既定（Q1〜Q3）は Plan Review で答える。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| CL1 | D-125 (1)・DOC_STYLE_GUIDE §1 の本文（正本・comment は行番号で引かない） | FL1 の D1・D2（code は comment だけ、tracked の file だけ） | Matrix T2〜T5・T24 | 非対象（L3 なし） |
| CL2 | D-125 (2)・§1 の backlog の項（commit を添える）と Plans の項（行番号の申し送りを置かない）、D-125 (3)・§1 の時点の記録の項（commit を書いた観測は正本の行でも残す） | FL1 の D4（`docs/Plans.md` 以外で一律）・D5、D3 (c) を backlog に当てない | Matrix T9〜T11・T17・T21 | 非対象 |
| CL3 | D-125 (3)・§1 の時点を書いた記録（library の版・日付を書いた観測）と対象外（data の行番号を含む） | FL1 の D2 の除外と code の文字列（字句の走査）、D3 (a)〜(c) | Matrix T5〜T8・T21 | 非対象 |
| CL4 | `docs/backlog.md` の lane 2b の項目（path が在る・行数の内・曖昧でない） | FL1 の D4 (c)〜(e)（(c) は `ls-tree` の完全一致）、D7 の repo root の path | Matrix T14〜T16 | 非対象 |
| CL5 | D-125 (2)「書いた時点の main の commit」・Compatibility「main に在る観測の時点」 | FL1 の D4 (a)・(b)（8〜40 桁、曖昧なら長くする案内、起点は PK5 と同じ選び方の commit そのもの） | Matrix T12・T12c・T13・T22 | 非対象 |
| CL6 | `docs/ci.md` Local Commands（浅い履歴・解決不能 base は成功にしない） | D4 の unshallow の案内と、判定に使わない git の終了値の ERROR、D6 の `commit に解決しない`・`起点が決まらない`・`git が失敗した`（fail-closed） | Matrix T12・T12b・T22・T23 | 非対象 |
| CL7 | 2a の packet の「他の lane との重なり」（workflow の 2 file を直してから検査、`K` を入力に） | Scope の `docs/ci.md`・`merge-evidence.md` の行、D3 | AC5・AC6、Matrix T7・T8 | 非対象 |
| CL8 | `docs/ci.md` Final Trigger Selection の final run の文と merge-evidence の R2+ の例の文（中身は不変、引用だけ） | 2 行の引用の直し | AC5（中身は reviewer が差分で読む） | 非対象 |
| CL9 | DEV_WORKFLOW Plan Packet Rules（active plan は `--target plan`）、script の両 mode | FL1 を両 mode で呼ぶ | Matrix T18、AC1・AC2 | 非対象 |
| CL10 | MG-D4（workflow 回帰の 1 つの目録） | `run-workflow-tests.sh` の 1 行 | AC4 | 非対象 |
| CL11 | DOC_STYLE_GUIDE の頭の「自動検証: 機械チェック可能な項目には ✅ を付記」 | D7 | AC7 | 非対象 |
| CL12 | `docs/ci.md` Local Commands（hosted の正規の経路は full の履歴、PK5 は実 PR の head/base）、MG-D4（local full と hosted workflow job が同じ suite を回す） | `.github/workflows/ci.yml` の 2 か所、`ci-workflow.test.sh` の `validate_parity`、`docs/ci.md` の文 | Matrix T25、AC11・AC5 | 非対象 |
| CL13 | `docs/quality/review-checklist.md` の行番号の観点（D-125。Alternatives の「全ての引用に commit を添える」を退けた線を含む） | 観点を `P` の外の形・symbol の正しさ・時点の印で通った正本の行・code の comment の意図に狭める | AC12（文は reviewer が差分で読む） | 非対象 |

隣接の契約の sweep: R1・DS1・R3（path・link の実在）は行番号を見ず、FL1 と対象が重なっても判定は独立（同じ行で両方が ERROR を出しうるが、直し方は別）。PK1〜PK6 は `docs/plans/**` を見て、FL1 は同じ path を除く。exit code の意味と見出しの群の順は変えない。

## Contract Probe

起票の時点（`843c4938`）の repo の中の前提。P2・P3 は scratchpad の未追跡の試作（D1〜D6 を python3 で書いた 90 行ほど。tracked にしない）で測った。P8〜P12 は round 1 の是正の時点、P13・P14 は round 2 の是正の時点、P15 は round 3 の是正の時点（どれも 2026-10-24、base は同じ `843c4938`）、P16 は closure の是正の時点（2026-10-25、head `a4544ba7`、base は同じ `843c4938`）に scratchpad で測った。実装の test（Matrix）が同じ場面を tracked に持つ。

- P1（今の main の違反は workflow の 2 行だけ）: 試作を repo root で実行 → `FORBID docs/agent-guidance/merge-evidence.md:160`・`FORBID docs/ci.md:29` の 2 行と `{'lib': 10, 'changelog': 3, 'forbidden': 2, 'ok': 83, 'err': 0}`。AC6 の baseline の `rg` と一致する。
- P2（時点つきの引用は句の commit で合う）: 同じ実行の `ok 83`（backlog の 82 と DOC_STYLE_GUIDE の規則の例 1）。D4 の (a)〜(f) で `err 0`。backlog の path はすべて repo root から（basename だけの path は 0）。
- P3（負例を拾う）: 未追跡の `docs/zz-fl1-probe.md` に 11 行を置いて試作を実行し、すぐ消した。結果: `RANGE`（`docs/ci.md:9999`、行数 100）、`NOPATH`（`docs/nope.md`、basename だけの `ci.md`）、`BADSHA`（`deadbeef`）、`UNCOVERED`（`SCREEN_DESIGN L42`）、`NOSHA`（句より前の `docs/ci.md:1`）、`AMBIG`（path の無い `（:12）`）、`FORBID`（句の無い `docs/ci.md:3`）、`RANGE`（`docs/ci.md:1-9999`）、`NOTANC`（`ee10506d` = `origin/agent/backup-offsite` の head）の 9 件が ERROR、正例（`` `843c4938` の時点で `docs/ci.md:1`〜`:5`・`docs/DEV_WORKFLOW.md:40-50` `` と N6 の 2 つめ）は通った。
- P4（並走の lane）: 各 Draft の branch について `git diff -U0 origin/main...origin/agent/<branch>` の D2 の対象の追加行を `rg -e "$P"` に通した → `backup-offsite-runtime` の 1 行（既存の `` `249df0ca` の時点で `src-tauri/src/biz/product_service.rs:153` ``、P2 で合格の引用）だけ、ほかの 9 本は 0。round 1 の是正の時点（2026-10-24）に足した #203（head `d3007c38`、file は自分の packet だけ）と #201 の head `110894ca` も 0（`rg -c` が何も出さない）。
- P5（commit の object と起点）: `.github/workflows/ci.yml` の docs job の checkout は `fetch-depth: 0`。作業 clone は浅い（`git rev-parse --is-shallow-repository` → `true`、`git log --oneline | wc -l` → `570`）が、backlog の句の 26 個の SHA は `git cat-file -e <sha>^{commit}` ですべて `ok`。round 2 の是正の時点（2026-10-24、`git rev-parse origin/main` → `843c49385d43eb93142e572467e61cb40573cd12`）: `docs/backlog.md` と `docs/DOC_STYLE_GUIDE.md` の句の 27 個の SHA（backlog の 26 と規則の例の 1）は、どれも起点そのものに対して `git merge-base --is-ancestor <sha> origin/main` が 0（`n=27 bad=0`）。句の SHA の長さは backlog の 49 個とも 8 桁。
- P6（既存の test の fixture）: `rg -c -e "$P" scripts/tests/` が何も出さない（exit 1）。`doc-consistency-plan-packet.test.sh` の synthetic repo で FL1 は ERROR を出さない。ただし同じ test の「19. D-046 T7: 実 repository の checker self-pass」は実 repo の checker を回し、hosted では workflow job で走る（P8）。
- P7（library の除外を一般の形にした場合の抜け道）: `rg -c '\S+ [0-9]+\.[0-9]+\.[0-9]+'` を D2 の対象に掛けた和 → `39 files, 178 lines`。2a の固定の一覧なら除外は 10 行（P1 の `lib 10`）。
- P8（workflow job の浅い checkout）: `.github/workflows/ci.yml` の `workflow` job の `actions/checkout@v6` に `with` が無い（既定は `fetch-depth` 1）。scratchpad で `git clone -q --depth 1 --no-local file://<本 worktree>` を作り、backlog の句の SHA を `git rev-parse --verify -q <sha>^{commit}` で引いた → `n=26 miss=26`。同じ clone で `git rev-parse --verify -q 'origin/main^{commit}'` は exit 1（起点も無い）。
- P9（8 桁の衝突）: scratchpad の git repo で、同じ tree・親・author で message だけ違う commit の本文の SHA-1 を python3 で数え、先頭 8 桁が同じ 2 つを 77,400 回ほど（0.10 秒）で得た。2 つを `git hash-object -t commit -w --stdin` で書くと、`git rev-parse --verify -q '<8 桁>^{commit}'` が exit 1、`git rev-parse --disambiguate=<8 桁>` が 2 行。full SHA は解決する（Matrix T12c の fixture の作り方）。
- P10（code の文字列と comment）: `rg -n -e "$P" src/lib/invalidation-contract.static.test.ts` の 10 行（11 個）はどれも `"…"` の文字列の中（`"fixture/bound-alias.ts:2"` ほか）で comment に無い。`src`・`src-tauri/src` の残りの hit は `ProductListPage.scroll-restoration.test.tsx` の `//` の comment の 3 行で、どれも library の版を含む（D3 (a)）。
- P11（正本の時点の句と日付つきの観測）: `rg -n '`[0-9a-f]{8,40}` の時点で'` を D2 の対象（除外の path と `docs/backlog.md` を除く）に掛ける → `docs/DOC_STYLE_GUIDE.md:87` の 1 行（§1 の規則の例）。`P` に当たる正本の行のうち日付を含み変更履歴の表の行でないもの → 0 行。round 2 の是正の時点: D3 (c) の印の式 `20[0-9]{2}-[0-9]{2}-[0-9]{2} の観測` を D2 の対象（除外の path を除く）に掛ける → 0 行。
- P12（改めた D2〜D4 の試作）: P1 の試作を、tracked の file（`git ls-files`）・code は comment だけ・句を照らすのは backlog と `DOC_STYLE_GUIDE.md` だけ・(b) は起点 `origin/main`、に改めて実 repo で回した（このときの起点は HEAD との分岐点と同じ commit。正本の句は規則の例の 1 行だけ〈P11〉なので、round 2 の「`docs/Plans.md` 以外で一律に照らす・起点そのもの」でも同じ値）（(c)・(d) は P2 と同じなので省いた）→ `FORBID docs/agent-guidance/merge-evidence.md 160`・`FORBID docs/ci.md 29` と `{'ok': 31, 'forbid': 2, 'lib': 10, 'chg': 3}`（`ok` は句のある行の数で、引用の数〈P2 の 83〉でない）、起点は `843c4938…`。git の 0・1 以外の終了値: 無い object の `git merge-base --is-ancestor deadbeefdeadbeef HEAD` は 128。浅い clone で object は在るが道が切れる場合: 3 commit の repo を `git clone --depth 1` で写し、`git fetch --depth 1 origin <最古の commit>` で object だけを足すと、`git rev-parse --verify -q` は 0、`git merge-base --is-ancestor <その commit> <起点>` は 1（その clone では `origin/main` = HEAD）（Matrix T12b の (ii) の作り方）。
- P13（D2 の字句の走査。round 2 の是正の時点、base `843c4938`）: scratchpad の未追跡の試作（python3 で 90 行ほど。D2 の状態〈line comment・入れ子の block comment・`"`・`'`・`` ` `` の文字列・Rust の raw string・char literal と lifetime〉を書いた）を実 repo の `git ls-files src src-tauri/src` に掛けた → comment の中の `P` の一致は `src/features/products/ProductListPage.scroll-restoration.test.tsx` の 16・62・64 行（どれも library の版を含む。P10 と一致）だけ。T5 の形の fixture（`src/a.ts` 9 行、`src-tauri/src/c.rs` 6 行）では、`// see b.ts:4`・`const q = 'x.ts:9'; // see q.ts:8`・行をまたぐ `/*`〜`*/` の中の `see h.ts:7`・行の途中の `/* see i.ts:6 */`・`/// see d.rs:5`・lifetime の後の `// see e.rs:2`・`'"'` の後の `// see g.rs:3`・入れ子の `/* outer /* inner */ see n.rs:4 */` の 8 行が当たり、`const s = "//fixture/b.ts:4";`・`"https://x.example/a.ts:3"`・`` `//t.ts:2` ``・`'x.ts:9'`・`"d.rs:5"`・`r#"// x.rs:3 "quoted""#` は当たらなかった。
- P14（git の終了値と起点。round 2 の是正の時点）: scratchpad の synthetic repo（main の M0 → branch の C、main は M1 → N へ進む。`origin/main` = M1）で、`git cat-file -e M0:docs/z.md`（無い path）は 128、`git ls-tree -z --full-tree M0 -- docs/z.md` は exit 0 で出力が空、在る path は `100644 blob …\tdocs/a.md`、dir は `040000 tree …\tdocs`、`--full-tree` を外して subdir から回すと空（`--full-tree` が要る）、無い object の `ls-tree` は 128。`git merge-base --is-ancestor M1 origin/main` は 0、同じ M1 を HEAD との分岐点（M0）に当てると 1（round 2 の Opus の反例）、C は 1、N を `origin/main`（M1）に当てると 1・N 自身に当てると 0（`WORKFLOW_BASE_SHA` を読まない変異の検出。T13 (v)）、無い起点への `--is-ancestor` は 128。
- P15（round 3 の是正の時点）: P13 の試作に template の `${…}` の積み重ね（`${` から深さ 0 の `}` まで code、入れ子の template も同じ）と Rust の `cr#"…"#` を足し、`git ls-files src src-tauri/src` の `.rs`・`.ts`・`.tsx`・`.css`（`rg -c` で 573 file）に、template を丸ごと文字列とする形と両方で掛けた → どちらも comment の中の一致は `ProductListPage.scroll-restoration.test.tsx` の 16・62・64 行だけ（差 0）。1 行の `${…}` の中の comment は `rg -n '\$\{[^}]*(/\*|//)'` を同じ `.ts`・`.tsx` に掛けて 0 行。fixture（`src/a.ts` 5 行、`src-tauri/src/c.rs` 2 行）では、`` const s = `${1 /* see b.ts:4 */}`; ``・入れ子の `` `${f(`in ${2 // see c.ts:5 `` の行・`` ${ {a:1}.a /* see d.ts:7 */ } ``・`${"}"}` の行の後ろの `// see z.ts:9`・`c"//c.rs:1"` の後の `// see p.rs:2`・`cr#"// q.rs:3 "x""#` の後の `// see r.rs:4` が当たり、template の本文の `//x.ts:6`・`` `plain //t.ts:2` ``・`"}"` の後ろの本文の `y.ts:8`・`c"…"`・`cr#"…"#` の中は当たらなかった。丸ごと文字列とする形は `b.ts:4`・`d.ts:7` を見落とした（Codex round 3 #1 の再現）。改行で終わらない 3 行の file は `wc -l` が 2、改行の数と最後の行で数えると 3。repo の外の `git ls-files`、無い object の `git cat-file blob <commit>:<path>`・`git show` はどれも 128。D2 の対象の docs の `` `path`:N `` の形（`rg -n '[A-Za-z0-9]`:[0-9]'`）は 0 行。
- P16（D2 の走査の限界と raw string。closure の是正の時点）: D2 の文から python3 の試作（scratchpad の未追跡の `lex.py`、80 行）を書き直し、`git ls-files src src-tauri/src src-tauri/dev-tools/src` の `.rs`・`.ts`・`.tsx`・`.css` の 573 file（`wc -l`）に掛けた → comment の中の `P` の一致は `ProductListPage.scroll-restoration.test.tsx` の 16・62・64 行だけ（library の版の行。P10・P13・P15 と同じで、template を `${…}` ごと文字列として飛ばす形とも同じ）。`rg -c -e "$P" src src-tauri/src` の和は 13 行（P10 の文字列の 10 行と上の 3 行）で、限界の読み違いで結果が変わりうる行はこの 13 行の外に無い。`${…}` が行末で開いたままの行は 10 行（`ProductAddSuggest.tsx` の 116・117 行、`StockMovementsPage.tsx` の 79〜86 行）で、実読するとどれも本物の複数行の `${…}`（className の条件、`defaultStringifySearch(` の引数）で、期待どおりの行で閉じる。`${…}` の中の regex literal は `rg -n -P -g '*.ts' -g '*.tsx' '\$\{[^}\n]*(\(|\$\{|,|=|\|\||&&|\?|:)\s*/(?![/*\s])' src` が exit 1（0 行）。限界の例（Matrix の「走査の既知の限界の例」の L1〜L3）は試作で再現した: L1・L2 の 4 行目の comment を見落とし、L3 の 2 行目を comment と読む。closure 2 の是正（`861271d3`）で足した L4 も、closure 3 の 2 本の reviewer の試作で再現した（2 行目を comment と読み、4 行目を見落とす）。raw string を普通の文字列として読む変異の試作では、`r#"a"// x.rs:3"#` が ERROR になり、`r"C:\"; // see x.rs:2` の comment を見落とした（D2 の試作は前者が ERROR なし、後者が ERROR）。live の `.rs` の raw string の開きの行（`rg -n '(^|[^A-Za-z0-9_"])(b|c)?r#*"'` が 19 file・43 行）では 2 つの試作の差は 0。

## Data Safety

- commit しないもの: 実 POS・店舗の data、DB、backup、log、receipt、secret。fixture は tmpdir に作り、架空の path・行・commit だけを使う。
- local-only: Contract Probe の試作と出力（scratchpad）。
- synthetic-only: `scripts/tests/doc-file-line-check.test.sh` の fixture。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。

### round 1（Plan Review、head `04aff55f`、2026-10-24）

- Codex（発注 555）: reject — P1 2 / P2 6 / P3 1。PR #204 への review の投稿は無い（`gh api repos/kosei-w90607/inventory-system-desktop/pulls/204/reviews` が空、review comment 0）ので、最終報告の 9 件を全部とした。
- fresh Opus 5.5（`subagent_type: reviewer`）: reject — P1 2 / P2 1 / P3 8。
- Coordinator の裁定（2026-10-24）: 全 finding を受理し、重複は束ねる。食い違いの裁定は下の表の「裁定」の欄。

| # | 出所 | 重大度 | 指摘の要旨 | 裁定 | 是正 |
|---|---|---|---|---|---|
| R1-1 | Codex #1・Opus F1 | P1 | hosted の workflow job は `run-workflow-tests.sh` → `doc-consistency-plan-packet.test.sh` の実 repo の self-pass で checker を回すが、checkout は深さ 1 で句の SHA が引けず red になる | 受理 | Scope に `.github/workflows/ci.yml` の (1) workflow job の `fetch-depth: 0`、`scripts/tests/ci-workflow.test.sh` の assert と mutation、`docs/ci.md` Local Commands の文を足し、Non-scope の `.github/workflows/*` を直した。Goal・Risk・Impact Review Lenses・AC9・AC11・CL12・Matrix C7・F14・T25・Probe P8 |
| R1-2 | Codex #2・Opus F2 | P1 | (b) の「HEAD の祖先」は、PR の branch の commit を PR で通し、squash の後の main と後続の全 PR を red にする | 受理 | D4 (b) の基準を PK5 と同じ起点（`WORKFLOW_BASE_SHA` が HEAD と違えばそれ、無ければ `origin/main`）と HEAD の merge-base にし、解決できなければ `起点が決まらない`（fail-closed）。hosted は ci.yml の (2) で docs の checker の step に `WORKFLOW_BASE_SHA` を渡す。固定の語を `main の祖先でない` に替えた。Matrix の T13 を「PR の branch にだけ在る commit の句は red」（env なし・`WORKFLOW_BASE_SHA` の両方）に置き換え、T22 を足した。Review Focus の理由を書き直した |
| R1-3 | Codex #3・Opus F3 | P2 | D2 が code の全行を照らし、文字列（test の fixture・data の行番号）を止める | 受理 | D2 で `src`・`src-tauri/src`（・`src-tauri/dev-tools/src`）は comment の部分だけを照らすことにした。全部が文字列の hit だった除外 `src/lib/invalidation-contract.static.test.ts` を消した（Probe P10）。Matrix の T5 を対の case（comment は ERROR、文字列は通る）に置き換え、T6 から同じ file を外した |
| R1-4 | Codex #4・Opus F4（Q3） | P2・P3 | Codex: 正本の日付つきの観測（`2026-10-24 の観測: …:12`）を ERROR にし、D-125 (3) と食い違う。Opus: 正本で時点の句を通すと、D-125 が退けた「全ての引用に commit を添える」が gate の正規の経路になる | 受理。Coordinator の指示は「D-125 の文言で正本で許す形を 1 通りに決め、D-125 が退けた形を通さない」 | 下の「D-125 の文言から決めた正本の時点の扱い」。D3・D4・D7・Q3 を合わせ、Matrix T21 を足した。Codex の修正案のうち「日付つきの自由文を認識して通す」は採らず（退けた形と同じ働き）、「認識の形を D3・正本に明記し正例を足す」を採った（正例は T7・T8 と T21 の `DOC_STYLE_GUIDE.md` の側） |
| R1-5 | Codex #5 | P2 | 「basename だけは在らない扱い」が root 直下の実在の file（`AGENTS.md:1`）を止める | 受理 | D4 (c) を「repo root からの path が tree に在れば通る。basename で他の dir の file を探さない」に置き換えた。Matrix T14 に root の正例を足した |
| R1-6 | Codex #6・Opus F7 | P2・P3 | 浅い clone で object が在っても道が切れると `HEAD の祖先でない` になり案内が付かない。git の 128 を合格と読む変異を拾えない | 受理 | D4 (a)(b) の両方に unshallow の案内、git の 0・1 以外は `git が失敗した`。Matrix T12b（`clone --depth 1` の fixture。object 無しと、object だけを足した道の欠け）と T23（shim の git が 128）を足した |
| R1-7 | Codex #7 | P2 | 8 桁に固定すると、同じ先頭の commit が増えたとき直す手段が無い | 受理（Opus は確率が低いとして finding にしなかったが、Coordinator が受理） | D4 の句の SHA を 8〜40 桁にし、曖昧なら SHA を長くする案内を出す。Matrix T12c、Probe P9 |
| R1-8 | Codex #8・Opus F8 | P2・P3 | #201 が同じ checker の R0・R1 に `src-tauri/dev-tools/src` を足すのに、「並走の gate の lane は無い」と書き、直列の順と後から merge する側の確認が無い | 受理 | 冒頭と「他の lane との重なり」を書き直した（#201 が先の見込み、本 lane は base 同期の後に AC1〜AC4 を回し直す）。D2 に `src-tauri/dev-tools/src`（在るときだけ）を足した。AC1 に注記 |
| R1-9 | Codex #9 | P3 | `rg --files` は未追跡の file も列挙し、手元だけ red になる | 受理（Opus は既存の R3 と同じ性質として finding にしなかったが、hosted と手元の食い違いを無くす向きで受理） | D2 の列挙を `git ls-files` の tracked に限った。Ordinary Operation の行、Matrix T24 |
| R1-10 | Opus F5 | P3 | library の一覧を足すことが gate の script の変更（R3）になる点を書いていない | 受理 | D3 と D7 に「一覧に無い library の観測は symbol で書く。一覧を足すのは R3 の lane」 |
| R1-11 | Opus F6 | P3 | D6 の「`K` を写す」を字面どおりに実装すると、変更履歴の行が ERROR になり句の行が素通りする。path の左端と句の後の `L<N>` の扱いが無い | 受理 | D3 に除外の 2 つの式を明記し、D6 で `K` は AC6 の突き合わせだけと書いた。D1 に path の左端、D4 (e) に「句の後の `L<N>`・`#L<N>` は path があっても `曖昧`」。Matrix T16 |
| R1-12 | Opus F9 | P3 | Ordinary Operation に code の comment の経路（pre-push の docs gate が走らない）が無い | 受理 | Ordinary Operation に行を足し、Goal の pre-push を「docs を含む push」に限った。Matrix の State Lifecycle に行を足した |
| R1-13 | Opus F10 | P3 | review-checklist の行番号の観点が、FL1 が機械へ移す範囲を示さない | 受理 | Scope に `docs/quality/review-checklist.md`（観点を狭める、消さない）、AC9・AC12・CL13・Q1 (7) |
| R1-14 | Opus F11 | P3 | message に当たった token も直し方も無い（D-127） | 受理 | D6 の message を `FL1: <file>:<行>: <固定の語>: <token>（<直し方>）` にし、固定の語ごとの直し方を書いた。Matrix の期待に token を足した（T2） |

#### D-125 の文言から決めた正本の時点の扱い

- 読んだ文（`docs/decision-log.md` の D-125）: (1)「設計の正本…と code の comment…は、code と文書の箇所を行番号で引かない」。(2)「`docs/backlog.md` の申し送りで行番号を使うときは、書いた時点の main の commit を添える」。(3)「時点を書いた記録（commit・library の版・日付を書いた観測、dated の調査・提案・L3 の記録、dated の Plan Packet と Test Design Matrix、decision-log の append-only の本文）の行番号は、その時点の観測として残す」。Alternatives「全ての引用に commit を添える（正本は今の code への入口で、古い行を指し続ける）」を退けた。Compatibility「backlog に添える commit は main に在る観測の時点」。
- 決めた扱い（1 通り）: 正本の行で時点を書いた観測として通る形は、library の版を含む行（D3 (a)）と変更履歴の表の行（D3 (b)）だけ。commit の句を照らすのは `docs/backlog.md`（(2)）と `docs/DOC_STYLE_GUIDE.md`（§1 の規則の例）だけ。他の正本の行に commit の句や日付を添えた引用は照らさず `行番号で引いている`。
- 理由: 正本の行に commit や日付を添えた引用は、Alternatives が「正本は今の code への入口で、古い行を指し続ける」として退けた形そのもので、添えるのが commit か日付かで働きは変わらない（Codex #4 の例の `2026-10-24 の観測: external/parser.rs:12` も同じ）。(3) の「commit・日付を書いた観測」は、dated の記録の file（D2 の除外の path）と backlog の句、正本の中では変更履歴の表の行が受け持つ。library の版の行は repo の外の code の版の観測で、今の code への入口でない。2a も正本の句を規則の例の 1 行に限っていた（2a の archive packet の AC-S1-4）。
- 今の repo への影響: 正本の句は `docs/DOC_STYLE_GUIDE.md:87` の 1 行、変更履歴の表の行でない日付つきの行番号の引用は 0 行で（Probe P11）、この扱いで新しく止まる行は無い。

#### 置き換えた旧い記述

D2 の `rg --files` と除外 `src/lib/invalidation-contract.static.test.ts`、D3 の「`K` の library の名前と版」と「新しい library の観測を足す lane は一覧も足す」、D4 の「正本・backlog の区別なし」「`<sha8>`」「HEAD の祖先」「basename だけは在らない扱い」、D6 の `HEAD の祖先でない` と「`P` と `K` の式は本 packet の文字列を写し」、冒頭と「他の lane との重なり」の「触るものは無い」、Non-scope の `.github/workflows/*`、Review Focus の「HEAD にした理由」、Q3 の既定「通す」、Matrix の T13（別 branch の commit）と T5・T6・T14・T16 の旧い fixture。上の表の要旨の引用の他に残していない（`rg` の sweep は PR の Validation の欄）。

#### 測り直し

是正の後の working tree（base `843c4938`）で、AC1（exit 0、WARN 12、`FL1` 0 行）・AC2（exit 0、全チェック通過）・AC8（exit 0）・AC5・AC6 の baseline は変わらない。AC11・AC12 と AC5 の 3 つめの baseline は上の baseline の block に足した。数え直し: AC は AC1〜AC12（AC11・AC12 を足した）、Matrix は T1〜T25 と T12b・T12c の 27 行（T21〜T25・T12b・T12c を足し、T13・T5 を置き換えた）、Contract Ledger は CL1〜CL13（CL12・CL13 を足した）。

### round 2（Plan Review、head `dfc5bfb4`、2026-10-24）

- fresh Opus 5.5（`subagent_type: reviewer`）: reject — P1 0 / P2 1 / P3 3。
- Codex（発注 559）: reject — P1 0 / P2 3 / P3 1。
- Coordinator の裁定（2026-10-24）: 両者の finding を全件受理。修正案は一案で、より素直な形があればそれでよい。Opus #1 は D4 (b) の base を起点そのものにし、Matrix に分岐の後に main へ入った commit の正例、AC10 に merge-base へ戻す変異を足す。Codex #1 は文字列 literal の中の `//` を comment と扱わず、Matrix に `const s = "//fixture/b.ts:4";` の形の負例と本物の comment の正例を置く。他の P2・P3 も同じ粒度で Matrix の行と AC に落とす。

| # | 出所 | 重大度 | 指摘の要旨 | 裁定 | 是正 |
|---|---|---|---|---|---|
| R2-1 | Opus #1 | P2 | D4 (b) の base を起点と HEAD の merge-base にしたため、branch を切った後に main へ入った commit を句に書いた正しい行が `main の祖先でない` になり、直し方も誤る | 受理（Coordinator の裁定） | D4 (b) を「起点が commit に解決すれば `git merge-base --is-ancestor <commit> <起点>`」に書き直し、merge-base と「merge-base が 1 つでない」の条件を消した。分岐点に下げない理由を (b) に書いた。Ordinary Operation に分岐の後の main の commit の行、Matrix T13 (iv)、F16、AC10・T20 に merge-base へ下げる変異、Probe P14 |
| R2-2 | Opus #2 | P3 | §1 の「時点を書いた記録（commit・library の版・日付を書いた観測 …）」の項は置き場所を限らないのに、D7 が「正本の行に commit・日付を添えても通らない」を足し、§1 の中で 2 つの文が食い違って見える | 受理（Coordinator の裁定）。修正案（D7 に「正本では library の版と変更履歴の形だけ」と書く）は採らず、R2-6 と同じ是正で食い違いそのものを無くした | 下の「正本の時点の観測の扱い」。D7 を「§1 の時点の記録の項が正本の行で機械にどう読まれるか（commit は D4 の句、library の版は D3 (a)、日付は D3 (b)・(c)）を書き、その項の文は変えない」に書き直した |
| R2-3 | Opus #3 | P3 | Matrix の期待の形が file 単位の「ERROR が無い」だけで、同じ行に ERROR と ERROR なしの引用が並ぶ case を表せない。`WORKFLOW_BASE_SHA` が開発者の shell に在ると case の起点が変わる | 受理（Coordinator の裁定） | Matrix の Test Matrix の頭の fixture の段落に「`<file>:<行>` と token の組の ERROR が無い」の形と、test の頭の `unset WORKFLOW_BASE_SHA` を足した。T5・T13・T21 の正例をその形で書いた |
| R2-4 | Opus #4 | P3 | `commit に解決しない` の直し方が、手元の `origin/main` が古く新しい main の commit の object が無い場合を名指さない | 受理（Coordinator の裁定） | D6 の直し方を「`git fetch origin main` の後でも解決しなければ写し直す」にし、test が直し方の command を照らすと書いた。Ordinary Operation の行、Matrix T12 (ii)・F16、AC10・T20 に案内を外す変異 |
| R2-5 | Codex #1 | P2 | D2 の comment の判定（行の最初の `//`、行頭の `/*`・`*`）が、文字列の中の `//` を comment と読み（`const s = "//fixture/b.ts:4";` が ERROR）、行をまたぐ block comment の中の `*` で始まらない行を見落とす | 受理（Coordinator の裁定） | D2 を、行をまたいで状態を持つ字句の走査（line comment・入れ子を数える block comment・文字列・Rust の raw string と char literal と lifetime）に書き直し、走査の限界（見落としの 3 つと、JSX の文の中の `//` の拾い過ぎ）を D2 と Design Readiness に書いた。Matrix T5 を正負の対で書き直し F15 を足した。AC10・T20 に旧い判定へ戻す変異。Probe P13（試作で T5 の形を分け、実 repo の hit は P10 と同じ 3 行） |
| R2-6 | Codex #2 | P2 | 正本の日付つきの観測を変更履歴の表の行だけに限る根拠が D-125 に無く、「規則を変えない」としながら (3) の例外を狭める | 受理（Coordinator の裁定）。修正案のとおり、日付の観測の受理の形を D3 に書き、T21 を観測の正例と今の参照の負例に分けた。同じ理由で commit の句も正本の行で照らす（日付だけを通し commit を止めると、精しい観測ほど止まる） | 下の「正本の時点の観測の扱い」。D3 に (c)、D4 の照らす file を `docs/Plans.md` 以外の全てにした。Goal・失敗定義・Ordinary Operation・Scope の review-checklist の行・D6・D7・Design Readiness・Q3・CL2・CL3・CL13、Matrix C1〜C3・F12・T21・T20・State Lifecycle |
| R2-7 | Codex #3 | P2 | 「git の 0・1 以外は `git が失敗した`」が、`git cat-file -e <commit>:<path>` の path の不在（128）と衝突し、`の時点で無い` と path の直し方を出せない | 受理（Coordinator の裁定） | D4 (c) を `git ls-tree -z --full-tree <commit> -- <path>` の完全一致の blob の entry に替え、終了値の規定を command ごとに書き直した。失敗定義・AC10・CL6 の「git の 0・1 以外」を「判定に使わない git の終了値」に替えた。Matrix T14（dir の `.github:1` と `git が失敗した` でないこと）・T23 (ii)（`ls-tree` の 128 は `git が失敗した`）・F16、AC10・T20 に `cat-file -e` へ戻す変異と `ls-tree` の 128 を空の出力と読む変異、CL4・CL6、Probe P14 |
| R2-8 | Codex #4 | P3 | T13 は fixture の `origin/main` と env が同じ M で、`WORKFLOW_BASE_SHA` を読まない変異を検出できない | 受理（Coordinator の裁定） | Matrix T13 (v)（`origin/main` = M1、env = 後の main の commit N、N の句は ERROR なし）、AC10・T20 に env を読まない変異、Probe P14 |

#### 正本の時点の観測の扱い（round 1 の「D-125 の文言から決めた正本の時点の扱い」を置き換えた）

- 読んだ文: D-125 の Decision (3)「時点を書いた記録（commit・library の版・日付を書いた観測、dated の調査・提案・L3 の記録、dated の Plan Packet と Test Design Matrix、decision-log の append-only の本文）の行番号は、その時点の観測として残す」（`docs/decision-log.md` の D-125）と、§1 の同じ項（`docs/DOC_STYLE_GUIDE.md:88`）。どちらも置き場所を限らない。Alternatives の「全ての引用に commit を添える（正本は今の code への入口で、古い行を指し続ける）」は、正本の引用の書き方の方針として退けたもので、観測の記録を禁じる文ではない。
- 決めた扱い: 正本の行の観測は残す。機械の形は、commit を書いた観測は D4 の句（`docs/Plans.md` 以外で一律に照らし、commit・main の祖先・path・行数が合えば通る）、library の版は D3 (a)、日付は D3 (b) の変更履歴の行と (c) の `YYYY-MM-DD の観測` の印。backlog は D-125 (2) が commit を求めるので (c) を当てない。Plans は (2) のとおり何も通さない。
- round 1 の扱い（正本で通る時点の形は library の版の行と変更履歴の行だけ、句を照らすのは backlog と規則の例の file だけ）を置き換えた理由: (3) の文が残すと書く正本の観測を、検査が止める。Non-goal は規則を変えないことで、D-125 は owner の決定（TD-326）なので、狭めるなら規則の改訂の lane になる。round 1 の線を残すと §1 の 88 行と検査の項が食い違い（R2-2）、その食い違いを D7 の文で説明しても、規則の文と検査が別のことを言う状態は残る。
- Alternatives の線の守り方: 観測か今の code への入口かは書いた人の意図で、字面では分けられない。review-checklist の行番号の項に「時点の印で FL1 を通った正本の行が観測の記録で、今の code への入口でないか」を足し、review が見る（Scope の review-checklist の行、CL13）。
- 今の repo への影響: 正本の句は `docs/DOC_STYLE_GUIDE.md:87` の規則の例の 1 行で、照らして合う（P2・P5）。日付の観測の印は 0 行（P11）。この扱いで結果の変わる行は無い。

#### 置き換えた旧い記述（round 2）

D2 の「行の最初の `//`（`://` の中の `//` を除く）より後ろ、または最初の空白でない文字が `/*`・`*`・`{/*` で始まる行の全体」と「文字列の中の `//` の後ろは comment と読む」の制約、D3 の「正本で時点を書いた観測として通る形はこの 2 つだけ」と「一覧に無い library の観測は symbol で書く」、D4 の照らす file の一覧（backlog と `DOC_STYLE_GUIDE.md` だけ）と「他の D2 の対象の行の句は照らさず」、D4 (b) の merge-base と「merge-base が 1 つでない・取れない」、D4 (c) の `git cat-file -e`、終了値の「0 と 1 だけ」と失敗定義・AC10・CL6・Matrix T20・T23 の「git の 0・1 以外」、D6 の `commit に解決しない` の直し方、D7 の「正本の行に commit・日付を添えても通らない」、Goal・Ordinary Operation・Design Readiness・Review Focus・Q3・CL2 の同じ前提の文、Probe P5・P12 の merge-base の base、Matrix の C1・C3・F12 と T5・T12・T13・T14・T20・T21 の旧い fixture と期待。上の表の要旨と round 1 の項の他に残していない（`rg` の sweep は PR の Validation の欄）。

#### 測り直し（round 2）

是正の後の working tree（base `843c4938`）で、AC1（exit 0、WARN 12、`FL1` 0 行）・AC2（exit 0、全チェック通過）・AC8（exit 0）は baseline と変わらない（途中の版で D2 の文の語が `--target plan` の M1〈曖昧表現〉の WARN に当たったので、`/"/` の後ろの語を「の形」に替えた）。AC5・AC6・AC11・AC12 の baseline は packet の外の file を変えていないので同じ。数え直し: AC は AC1〜AC12（増減なし。AC10 の変異を 5 つ〈merge-base に下げる・env を読まない・`cat-file -e`・`git fetch origin main` の案内・comment の行の判定〉足し、正本の句と終了値の変異を書き直した）、Matrix は T1〜T25 と T12b・T12c の 27 行（ID の増減なし。T5・T12・T13・T14・T20・T21・T23 を書き直し、F15・F16 を足した）、Contract Ledger は CL1〜CL13（増減なし）、Contract Probe は P1〜P14（P13・P14 を足した）。

### round 3（Plan Review の天井、head `bf98d6c2`、2026-10-24）

- fresh Opus 5.5（`subagent_type: reviewer`）: approve — P1 0 / P2 0 / P3 5。
- Codex（発注 565）: reject — P1 0 / P2 1 / P3 0。
- Coordinator の裁定（天井の disposition = 一括是正、2026-10-24）: 全 finding を受理。Codex #1 と Opus #3 は同じ所なので束ね、直し方は (a)「template の `${` から対応する `}` までを code として読む」か (b)「限界として名指す」のうち現物で素直な方を選ぶ。どちらでも限界の文は Opus #3 の指摘を含む今の正確な文に段落ごと書き直す。

| # | 出所 | 重大度 | 指摘の要旨 | 裁定 | 是正 |
|---|---|---|---|---|---|
| R3-1 | Codex #1・Opus #3 | P2・P3 | D2 の走査が template を丸ごと文字列として飛ばし、`${…}` の中の comment（`` const s = `${1 /* see b.ts:4 */}`; ``）を見落とす。限界の一覧にこの形が無い。限界の影響を「同じ行（template は閉じるまで）」と書くが、regex literal の中の `/*`・`` ` ``、JSX の文の中の `` ` `` は閉じる記号まで行をまたいで状態をずらす。Rust の `c"…"`・`cr#"…"#` が書かれていない | 受理（Coordinator の裁定）。(a) を選んだ: 走査の状態を template と `${…}` の積み重ねにするだけで、見落としを無くし、旧い限界の「`${…}` の中の入れ子の `` ` ``」も同時に消える。live の code の結果は (a) でも丸ごと飛ばす形でも同じ 3 行（差 0、Probe P15）で、(b) にして見落としを残す理由が無い。Rust の `c"…"`・`cr#"…"#` は限界に置かず走査に足した（`"…"` と raw string の接頭辞を 1 つ足すだけ） | D2 に `${…}` を code として読む規則と `b"…"`・`c"…"`・`cr#"…"#` を足し、走査の限界の段落を書き直した（regex literal〈`${…}` の中を含む〉と JSX の文の中の記号の読み違い、`"`・`'`・`//` は同じ行、`/*`・`` ` `` は閉じる記号まで行をまたいでずれ、拾い過ぎと見落としの両方が原因から離れた行に出うる）。Design Readiness の延期した gap、Review Focus、Ordinary Operation の code の comment の行、AC10・Matrix T20 に「template を `${…}` ごと文字列として飛ばす」変異、Matrix F15・T5（`${…}` の中の comment は ERROR、本文と `"}"` の後ろの本文は ERROR なし、Rust の `c"…"`・`cr#"…"#`）、Probe P15 |
| R3-2 | Opus #1 | P3 | `main の祖先でない` の直し方が「main に在る commit を書く」だけで、手元の `origin/main` が古く、新しい main の commit の object が別の ref の fetch で入った場合を名指さない | 受理（Coordinator の裁定） | D4 (b) と D6 の `main の祖先でない` に `git fetch origin main` の案内（その後でも出れば main に在る commit を書く）を足した。Ordinary Operation の 2 行（`main の祖先でない` の直し方、手元の `origin/main` が古い行を object の有無の 2 つに分けた）、Matrix C3・F16・T13 (vi)（object だけ在って `origin/main` が古い clone）・State Lifecycle、AC10・T20 の案内を外す変異に T13 (vi) |
| R3-3 | Opus #2 | P3 | `ci-workflow.test.sh` の `validate_parity` の `lost workflow regression` の `%w[...]` に新しい `doc-file-line-check` を足さず、後の PR が目録から外しても drift test が green | 受理（Coordinator の裁定） | Scope の `scripts/tests/ci-workflow.test.sh` の行に `%w[...]` へ `doc-file-line-check` を足すことを書いた（起票の時点の `scripts/tests/ci-workflow.test.sh` の `validate_parity` の `%w[classify-changes … merge-gate]` の行。`rg -n '%w\[' scripts/tests/ci-workflow.test.sh` で確かめた）。Matrix T25 |
| R3-4 | Opus #4 | P3 | 実装が 1 通りに決まらない 3 点: 改行で終わらない file の行数、bare の `:N` が引き継ぐ path、file の列挙と blob の読み出しの失敗 | 受理（Coordinator の裁定） | D4 (d) に「最後の改行の後ろに文字があればその行も数える（`wc -l` は使わない）」、D4 の頭に「bare の `:N` は同じ行の前の一番近い `path:N` の一致の path を引き継ぐ（`:N` を持たない path は引き継がない）」、D1 に「`:` の直前の backtick 1 つを飛ばして path を読む（`` `docs/a.md`:2 ``）」、終了値の規定に「`git ls-files` と blob の読み出しの非 0 も `git が失敗した`（0 file の `info` で通さない）」。AC10・T20 に変異 2 つ、Matrix F16・T9・T15・T16・T23 (iii)(iv)、Probe P15 |
| R3-5 | Opus #5 | P3 | review-checklist に足す括弧が「正本の行」だけを名指し、D3・D4 で通る code の comment を名指さない | 受理（Coordinator の裁定） | Scope の review-checklist の行の括弧と CL13 を「正本の行・code の comment」にした |

#### 置き換えた旧い記述（round 3）

D2 の「`.ts`・`.tsx` の `` `…` ``」を文字列に含めて template を丸ごと飛ばす形と、走査の限界の段落（「template の `${…}` の中の入れ子の `` ` ``」と「同じ行（template は閉じるまで）の後ろの comment を見落としうる」「JSX の文の中の `//` でだけ」）、Design Readiness の延期した gap の同じ列挙、D4 の頭の「bare の `:N` はそれより前で一番近い path を持つ」、D6 と Ordinary Operation の `main の祖先でない` の直し方「main に在る commit を書く」、Ordinary Operation の手元の `origin/main` が古い行の `commit に解決しない` だけの結果、Scope の review-checklist の行と CL13 の「正本の行」だけの括弧。上の表の要旨と round 1・round 2 の項の他に残していない。

#### 測り直し（round 3）

是正の後の working tree（base `843c4938`）で `bash scripts/doc-consistency-check.sh` と `--target plan` を測り直した（値は PR の Validation の欄）。packet の外の file を変えていないので AC5・AC6・AC8・AC11・AC12 の baseline は同じ。数え直し: AC は AC1〜AC12（増減なし。AC10 に変異 3 つ〈`wc -l`・template を丸ごと飛ばす・`git ls-files` の非 0 を 0 file〉を足した）、Matrix は T1〜T25 と T12b・T12c の 27 行（ID の増減なし。T5・T9・T13・T15・T16・T20・T23・T25 に case を足した）、Contract Ledger は CL1〜CL13（増減なし）、Contract Probe は P1〜P15（P15 を足した）。

### closure（Plan Review の closure、head `a4544ba7`、是正 2026-10-25）

- fresh Opus 5.5（Claude 側）: approve — P1 0 / P2 0 / P3 3。
- Codex（発注 569）: reject — P1 0 / P2 1 / P3 1。PR への投稿は無く、最終メッセージで返った。
- Coordinator の裁定（2026-10-25）: 全 finding を受理。走査の仕様（round 3 の (a)「`${…}` を code として読む」）は変えず、文と固定を直す。Codex N1 と Opus #1、Codex N2 と Opus #3 は同じ所なので束ねる。Opus の「不要になる記述」（D2 の末尾の観測を Probe へ寄せる）も採る。

| # | 出所 | 重大度 | 指摘の要旨 | 裁定 | 是正 |
|---|---|---|---|---|---|
| C-1 | Codex 569 N1・Opus #1 | P2・P3 | D2 の走査の限界の段落と Design Readiness が「`"`・`'`・`//` の読み違いは行末で閉じるので同じ行の後ろだけがずれる」と書くが、`${…}` の中で読み違えると閉じる `}` を飲み込み、外側の状態が後ろの行までずれる（Codex: `${/"/.test('x')}` の後の 4 行目の comment を見落とす。Opus: `${s.replace(/'/g, "")}` の次の行を comment と読み ERROR） | 受理（Coordinator の裁定） | D2 の走査の限界を別の箇条に分け、(i) `${…}` の外の `"`・`'`・`//` は同じ行、(ii) `${…}` の中の `"`・`'`・`//` は `${…}` を閉じ損ねて後ろの行へ、(iii) `/*`・`` ` `` は置き場所に関わらず行をまたぐ、の現行の文に段落ごと書き直した。regex literal の中の記号に `//`（`/[//]/` の形）を足した。Design Readiness の延期した gap、D7 の写す文（「D2 の走査の限界の箇条と同じ文」）。Matrix に「走査の既知の限界の例」L1〜L3（両者の再現の入力）。Probe P16（試作の再現と、live で当たる行が 0） |
| C-2 | Codex 569 N2・Opus #3 | P3 | Review Focus の D4 と D4 (e) に「bare の `:N` は一番近い path」「path の後の bare の `:N`」の旧い句が残り、D4 の頭の規則（同じ行の前の一番近い `path:N` の一致の path、`:N` を持たない path は引き継がない）と食い違う | 受理（Coordinator の裁定） | D4 (e) と Review Focus の D4 の句を「同じ行の前の一番近い `path:N` の一致の path」に揃えた |
| C-3 | Opus #2 | P3 | T5 の Rust の「ERROR なし」の case（`r#"// x.rs:3 "quoted""#`・`cr#"// q.rs:3 "x""#`・`` cr#"x"# ``・`c"//c.rs:1"`）は raw string を扱わない実装でも green で、固定にならない。D2 の `b"…"`・`c"…"` を `"…"` と同じに読む括弧は、無くても結果が変わらない | 受理（Coordinator の裁定） | Matrix T5 の Rust の case を、区別できる 2 つ（`r#"a"// x.rs:3"#` は ERROR なし、`r"C:\"; // see x.rs:2` は ERROR。前者を後者より前に置く）に替え、区別できない `cr#"x"#` の ERROR の case を外した。F15 と T5 の Would fail if を合わせた。AC10・T20 に「`.rs` の raw string を普通の文字列として読む」変異。D2 の `b"…"`・`c"…"` の括弧を消し、raw string の読み方（`\` を escape と読まず、同じ数の `#` を後ろに持つ `"` で閉じる）を書いた。Probe P16（変異の試作で 2 case が red、live の差 0） |
| C-4 | Opus（不要になる記述） | — | D2 の末尾の live の観測の文（template を丸ごと飛ばす形と同じ、P10 とも一致）は観測なので Probe へ寄せてよい（任意） | 受理（Coordinator の裁定） | D2 の末尾の観測の文を消し、Probe P16 へ寄せた（D2 には Probe の参照だけを残した） |

#### 置き換えた旧い記述（closure）

D2 の走査の限界の段落（「regex literal〈`${…}` の中を含む〉」と「`"`・`'`・`//` の読み違いは行末で閉じるので、同じ行の後ろだけがずれる」）、D2 の末尾の live の観測の 2 文、D2 の `.rs` の byte・C の string の括弧、Design Readiness の延期した gap の同じ要約、D4 (e) の「path の後の bare の `:N`」、Review Focus の「bare の `:N` は一番近い path」、Matrix T5 の Rust の 4 つの「ERROR なし」の case と `cr#"x"#` の ERROR の case、F15 の「`cr#"…"#` の後ろの comment を見落とす」。上の表の要旨と round 1〜3 の項の他に残していない。

### closure 2（Plan Review の closure 2、head `c655a568`、是正 2026-10-25）

- fresh Opus 5.5（Claude 側）: reject — P1 0 / P2 1 / P3 3。
- Codex（発注 571）: reject — P1 0 / P2 1 / P3 1。PR への投稿は無く、最終メッセージで返った。
- Coordinator の裁定（2026-10-25）: 全 finding を受理。走査の限界を「`${…}` の内・外」などの置き場所で場合分けして書くたびに反例が出た（round 3・closure・closure 2 の 3 回）ので、場合分けをやめ、置き場所に依らず真である一般の文 1 つに置き換える（D-127 の置き換え）。走査の仕様（D2 の規則）は変えない。Opus F1 と Codex finding 1 は同じ所なので束ね、Opus F2 は同じ置き換えで消える。Opus F3 と Codex N1 も同じ所なので束ねる。

| # | 出所 | 重大度 | 指摘の要旨 | 裁定 | 是正 |
|---|---|---|---|---|---|
| C2-1 | Opus F1・Codex finding 1・Opus F2 | P2・P3 | D2 の走査の限界の (i) が「`${…}` の外の `"`・`'`・`//` は同じ行の後ろだけがずれる」と書くが、飲み込んだ行の後ろに `` ` ``・`/*` があると `${…}` の外でも行をまたいでずれる（Opus F1 (a)〜(c)、Codex の 4 行の例）。(ii) の「閉じ損ねる」は、飲み込んだ部分に `{` があると早く閉じ、ずれが止まる条件も正確でない（Opus F2 (1)(2)）。同じ誤りが Design Readiness の延期した gap と、D7 で §1 に写す文に入る | 受理（Coordinator の裁定） | D2 の走査の限界の (i)〜(iii) の分類を削り、一般の文 1 つ（読み違えた記号から閉じると読む所までを一続きに読み、間の `` ` ``・`/*`・`${`・`{`・`}` も飲み込む。行をまたぐ状態を変えると、ずれは file の終わりまで続きうる。拾い過ぎにも見落としにもなり、その行は原因の記号の行から離れうる）に置き換えた。Design Readiness の延期した gap は D2 の箇条を参照する形にした。D7 は「同じ文」のまま、Probe・Matrix の参照と起票の時点の観測は写さないと書いた |
| C2-2 | Opus F1 (a)・Codex の例 | P2（C2-1 の固定） | Matrix の既知の限界の表に、`${…}` の外の読み違いが行をまたぐ例が無い | 受理（Coordinator の裁定） | Matrix に L4（Codex の 4 行の例。2 行目を ERROR、4 行目を見落とす）を足した。表の冒頭の「(ii) の例」を「例」にし、L2・L3 の「閉じ損ねる」を「閉じる `}` を飲み込む」にした |
| C2-3 | Opus F3・Codex N1 | P3 | L2 の結果の列の `c.ts:4` が、入力（L1 の 2 行目だけを替えた 4 行。4 行目は `b.ts:4`）と食い違う | 受理（Coordinator の裁定） | 結果の列を `b.ts:4` にした |
| C2-4 | Opus F4 | P3 | D2 の raw string の列挙が `br"…"`・`r##"…"##` を含むかを推すしかなく、T5 に `br#`・`cr#` の接頭を固定する case が無い | 受理（Coordinator の裁定） | D2 を「`r`・`br`・`cr` の後に 0 個以上の `#` と `"` で始まる」の 1 文にした。Matrix T5 に `let z = br#"a"// z.rs:3"#;`（ERROR なし）を足し、順の注を 3 case にした（注は残した）。T5 の Would fail if・F15・AC10 に同じ case を足した |

#### 置き換えた旧い記述（closure 2）

D2 の走査の限界の「読み違えた状態がどこまで続くかは、記号の種類と置き場所で決まる」と (i)〜(iii) の文、Design Readiness の延期した gap の同じ要約（「`${…}` の外の `"`・`'`・`//` は同じ行の後ろだけ …」）、D2 の raw string の 4 つの形の列挙、Matrix の「走査の既知の限界の例」の冒頭の「(ii) の例」と L2・L3 の「閉じ損ねる」、L2 の結果の `c.ts:4`、Probe P16 の「限界の (ii) の例」の「(ii)」（日付つきの観測の中身は変えず、消えた分類への参照だけを外した）。上の表の要旨と round 1〜3・closure の項の他に残していない。

#### 測り直し（closure 2）

是正の後の working tree（base `843c4938`）で AC1・AC2・AC8 を測り直した（値は baseline と同じ。PR の Validation の欄）。一般の文は、scratchpad の未追跡の試作（D2 の規則を書いた python3）で、review の反例（Opus F1 (a)〜(c)・F2 (1)(2)、Codex の 4 行の例、Matrix の L1〜L4）がどれも文の言う形（閉じると読む所まで一続きに読み、飲み込んだ `` ` ``・`/*`・`{`・`}` で行をまたいでずれる）で起きることを確かめた。T5 の Rust の case は、試作で `br#"a"// z.rs:3"#` が ERROR なし、raw を普通の文字列として読む変異と `br` の接頭を raw と読まない変異でどちらも ERROR（red）。`r"C:\"` の行より後ろに置くと、前者の変異で独立に red にならない（順の注のとおり）。数え直し: AC は AC1〜AC12（増減なし）、Matrix は T1〜T25 と T12b・T12c の 27 行（ID の増減なし。T5 に case を足した）、走査の既知の限界の例は L1〜L4（L4 を足した）、Contract Ledger は CL1〜CL13（増減なし）、Contract Probe は P1〜P16（増減なし）。

### closure 3（Plan Review の closure 3、head `861271d3`、是正 2026-10-25、Coordinator）

Claude 側（fresh Opus 5.5）= reject（P2 1 / P3 1）、Codex 572 = reject（P2 1、新規 0）。P2 は同じ点で、一般の文に残った場合分けの 2 つ（括弧の「`"`・`'`・`//` は行末、`/*` は `*/`、…」の閉じる所の列挙と、「当たるのは、…」の記号の列挙）が偽（`"`・`'` は同じ行の次の同じ引用符で閉じる。`${…}` の中の regex の `{`・`}`、JSX の文の中の `"` が列挙に無い）。全件受理。Coordinator が両者の修正案（列挙を消し、D2 の規則どおりに読むことだけを書く）で直した。

| # | 出所 | 是正の場所 |
|---|---|---|
| C3-1 | Claude 側 N1 = Codex 既存 1（P2） | D2 の「走査の限界」から閉じる所と当たる記号の列挙を消し、「その中の記号（引用符・`` ` ``・`//`・`/*`・`{`・`}` ほか）も上の規則どおりに読み、本物の文字列・comment・template・`${…}` との対応（開きと閉じ、`{`・`}` の深さ）がずれうる」に置き換えた。Design Readiness の延期した gap の「でだけ」を外した。D7 は「同じ文」のまま |
| C3-2 | Claude 側 N2（P3） | Contract Probe P16 に、closure 2 の是正で足した L4 の再現を 1 文足した |

### closure 4（Plan Review の closure 4、head `268b513e`、是正 2026-10-25、Coordinator）

Claude 側（fresh Opus 5.5）= approve（P1 0 / P2 0 / P3 1）。Codex 577 は利用上限で遅れ、reset の後（2026-10-26）に P3 を直した `852951a6` で流して approve（P1 0 / P2 0 / P3 0。Plan Review の closure なので PR へ投稿せず、報告は repo 外の発注の記録）。Codex の AC4（`bash scripts/tests/run-workflow-tests.sh`）は初回だけ `doc-consistency-plan-packet.test.sh` が `plan-approved` の fixture を「Phase 行なし」として拒否し、変更なしの単独の再実行と suite の再実行は通った（checker と test は base から不変。原因はまだ分からず、実装の run で AC4 を回すときに再び見る）。P3（D2 の走査の限界の 1 文目の原因の構文に JSX の属性の文字列が無い。属性の文字列は `\` を escape と読まず行をまたげる）を受理し、「regex literal と JSX（文と属性の文字列）」に直した。D7 は同じ文を写す。
