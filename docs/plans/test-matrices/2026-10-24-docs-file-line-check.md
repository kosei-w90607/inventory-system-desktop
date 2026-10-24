# Test Design Matrix: file:行 の引用を `scripts/doc-consistency-check.sh` で検査する（docs の棚卸し lane 2b、R3）

packet: `docs/plans/2026-10-24-docs-file-line-check.md`（検査の形 D1〜D7、Contract Ledger CL1〜CL13、AC1〜AC12）。

## Risk

Risk: R3

## Contracts Under Test

- C1（D1・D2、CL1）: D2 の対象の file（tracked の file だけ。code の file は comment の部分だけ）の、D3 の除外に当たらず照らす句の無い行の `P` の一致は `FL1: <file>:<行>: 行番号で引いている: <token>（直し方）` の ERROR。4 つの形（`path:N`、bare の `:N`、`L<N>`、`#L<N>`）のどれでも。正本（`docs/backlog.md`・`docs/DOC_STYLE_GUIDE.md` 以外）の行の時点の句・日付は照らさず、同じ ERROR。
- C2（D2・D3、CL3）: 除外の path の file、library の版の行・変更履歴の表の行、code の文字列は止めない。
- C3（D4、CL2・CL4・CL5・CL6）: `docs/backlog.md` と `docs/DOC_STYLE_GUIDE.md` の時点の句（SHA は 8〜40 桁）のある行は、各引用を左で一番近い句の commit で照らす。SHA が解決しない（曖昧なら長くする案内、浅い clone なら unshallow の案内）・main の起点（`WORKFLOW_BASE_SHA` か `origin/main` と HEAD の merge-base）の祖先でない・起点が決まらない・path がその tree に無い（root からの path でない basename を含む）・行数を越える・覆われない一致（path の無い `:N`、`L<N>`・`#L<N>`）・句より前の引用・git の 0・1 以外の終了は、それぞれ D6 の固定の語の ERROR。全部合えば通る。起点は照らす句があるときだけ引く。
- C4（D5、CL2）: `docs/Plans.md` は時点の句があっても `行番号で引いている` の ERROR。
- C5（D6、CL9）: FL1 は既定 mode と `--target plan` の両方で走り、違反があれば script の exit は 1。違反が無ければ `info` の行を出す。
- C6（CL7・CL8）: 実 repo の live な docs・comment で FL1 の ERROR は 0（workflow の 2 行を直した後。#201 の merge と base 同期の後）。
- C7（CL12）: hosted の workflow job の checkout は `fetch-depth: 0`、docs job の checker の step は `WORKFLOW_BASE_SHA`（PK5 の step と同じ値）を持つ。`scripts/tests/ci-workflow.test.sh` の `validate_parity` が両方を確かめる。

## Failure Modes

- F1: 正本・comment に行番号の引用が足されても docs gate が通る（今の状態）。
- F2: 4 つの形の一部（bare の `:N`、`L<N>`、`#L<N>`）だけを見落とす。
- F3: 時点の記録（除外の path、library の版の行、変更履歴の行）や code の文字列（test の fixture・data の行番号）を止め、active な packet・archive・reference・code の PR が red になる。
- F4: 時点の句があるだけで、行の引用を照らさずに通す（2a の AC-S3-1 は行の単位で、句の commit・path・行数を見ない）。
- F5: SHA の写し誤り・曖昧な SHA・main に無い commit（PR の branch にだけ在る commit を含む）・浅い clone の欠けた object・起点の欠け・git の異常終了を合格にする（fail-open）。PR の branch の commit を PR で通し、squash の後の main と後続の PR を red にする。
- F6: path の綴りの誤り・basename だけの path・行数の外を通す。root 直下の実在の file を止める。
- F7: path の無い `L<N>`・`:N`・句の後の `L<N>`・`#L<N>` を、どの path にも結び付けずに黙って通す（覆いの検査の欠け）。
- F8: 句より前の引用を、後ろの句の commit で照らして通す。
- F9: `docs/Plans.md` の時点つきの申し送りを backlog と同じく通す。
- F10: FL1 を片方の mode でしか呼ばない、または ERROR を `warn` にして exit 0 のまま。
- F11: 既存の check・既存の test（`doc-consistency-plan-packet.test.sh` ほか）が FL1 の追加で red になる。
- F12: 正本の行に時点の句か日付を添えた引用を通す（D-125 の Alternatives が退けた形）。
- F13: 未追跡の file で手元だけ red になり、hosted と食い違う。
- F14: hosted の workflow job が浅い checkout のままで、実 repo の self-pass の FL1 が句の commit も起点も引けず red になる。docs の checker の step が PR の base を受けない。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。
- fixture は `scripts/tests/doc-file-line-check.test.sh` が tmpdir に作る synthetic な git repo（`git init`、架空の file と commit。対象の file は `git add` して tracked にする）。句を照らす case は fixture の main の commit を `refs/remotes/origin/main` に置く（`git update-ref`）。期待は「ERROR の行に `FL1:`・fixture の `<file>:<行>`・D6 の固定の語・当たった token」か「その file の FL1 の ERROR の行が無い」。各負例の fixture には同じ file に正例の行も 1 つ置き、FL1 を丸ごと黙らせる変異（出力を空にする）で負例だけが kill を主張しないようにする（正例は「ERROR が無い」なので、負例の期待が非空であることが kill の根拠）。
- exit code は `--target plan` で valid な最小の packet を置いた fixture で見る（既定 mode は synthetic repo で他の check〈command の drift ほか〉が前提の file を欠くので、FL1 の行だけを見る）。
- test 名は実装で付ける（既存の命名に倣い `echo "PASS: <ID> …"`）。

| ID | Contract | Failure Mode | Test Type | Test Name / fixture | Would fail if... |
|---|---|---|---|---|---|
| T1 | C1 | F1 | CLI（synthetic repo） | `PASS: T1 path と symbol の引用は通る`（`docs/function-design/10-x.md` に `` `src-tauri/src/a.rs` の `fn foo` ``） | path や backtick だけで ERROR にする（拾い過ぎ） |
| T2 | C1 | F1 | CLI | `PASS: T2 正本の path:N は ERROR`（同 file に `` `src-tauri/src/a.rs:3` ``、ERROR の行に token `src-tauri/src/a.rs:3`） | FL1 が無い、正本を対象にしない、message に token が無い |
| T3 | C1 | F2 | CLI | `PASS: T3 bare の :N は ERROR`（`` `a.rs` の `fn foo`（`:12`） `` の形） | bare の形を見ない |
| T4 | C1 | F2 | CLI | `PASS: T4 L<N> と #L<N> は ERROR`（`docs/x.md` に `SCREEN_DESIGN.md L120` と `…/blob/x/a.rs#L12` の 2 行、ERROR が 2 行） | `L<N>` か `#L<N>` を見ない |
| T5 | C1・C2 | F1・F3 | CLI | `PASS: T5 code は comment だけを照らす`（ERROR: `src/a.ts` の `// see b.ts:4`、`src-tauri/src/c.rs` の `/// see d.rs:5`、`src-tauri/dev-tools/src/e.rs` の `// see f.rs:6`、`src/g.ts` の block comment の ` * see h.ts:7`。ERROR なし: 同じ file の `const s = "fixture/b.ts:4";`・`let p = "d.rs:5";`・`"https://x.example/a.ts:3"`） | `src`・`src-tauri/src`・`src-tauri/dev-tools/src` の comment を見ない、code の文字列も照らす |
| T6 | C2 | F3 | CLI | `PASS: T6 除外の path は通る`（`docs/archive/a.md`・`docs/evidence/a.md`・`docs/research/a.md`・`docs/plans/a.md`・`docs/plans/test-matrices/a.md`・`docs/decision-log.md`・`docs/design-system/reference/a.md` の各 file に `` `x.rs:3` ``） | 除外の一覧の一部が抜ける |
| T7 | C2 | F3 | CLI | `PASS: T7 library の版の行は通る`（`docs/x.md` に `@tanstack/router-core 1.168.15 の router.js:415`） | library の除外が無い、名前の一覧が D3 (a) の式と違う |
| T8 | C2 | F3 | CLI | `PASS: T8 変更履歴の表の行は通る`（`| 2026-01-01 | a.md:3 を直した |`） | 変更履歴の除外が無い、行頭の判定がずれる（`rg -n` の前置きつきの式を file の行に当てる） |
| T9 | C3 | F4 | CLI | `PASS: T9 時点つきの正しい引用は通る`（`docs/backlog.md` に、fixture の commit A の句と `` `docs/a.md:2` ``・`` `docs/a.md:1-3` ``・`` `docs/a.md:1`〜`:3` ``・`` `docs/a.md:1`/`:2` ``、別の句 B と `` `src/b.ts:1` `` を 1 行に。A の時点の `docs/a.md` は 3 行。A と B は origin/main の祖先） | 句と引用の対応・bare の `:N` の path の引き継ぎ・範囲の読みが誤り、正しい引用を止める |
| T10 | C1・C3 | F4 | CLI | `PASS: T10 backlog の句の無い行番号は ERROR`（`docs/backlog.md` に `` `docs/a.md:2` `` だけ、`行番号で引いている`） | backlog を除外にする |
| T11 | C3 | F8 | CLI | `PASS: T11 句より前の引用は ERROR`（`` `docs/a.md:1` と `A` の時点で `docs/a.md:2` ``、1 つめに `時点の commit が無い`、2 つめは ERROR なし） | 行に句が 1 つあれば全部を照らして通す（2a の AC-S3-1 の行の単位） |
| T12 | C3 | F5 | CLI | `PASS: T12 解決しない SHA は ERROR`（`` `deadbeef` の時点で `docs/a.md:1` ``、`commit に解決しない`） | `rev-parse` の失敗を無視する（fail-open） |
| T12b | C3 | F5 | CLI（浅い clone） | `PASS: T12b 浅い clone は ERROR と unshallow の案内`（T9 の fixture を `git clone --depth 1 file://…` で写し、`origin/main` を写した HEAD に置いて回す。(i) 句の A の object が無いので `commit に解決しない` と `git fetch --unshallow` の両方が出る。(ii) `git fetch --depth 1 origin <A>` で A の object だけを足すと、A は解決するが境界で道が切れ、`main の祖先でない` と `git fetch --unshallow` の両方が出る） | 浅い clone で案内を出さない（`main の祖先でない` の側を含む）、object の欠けを合格にする |
| T12c | C3 | F5 | CLI | `PASS: T12c 曖昧な 8 桁は ERROR、full SHA は通る`（python3 で同じ tree・親で message だけ違う commit の本文の SHA-1 を数え、先頭 8 桁が同じ 2 つを `git hash-object -t commit -w --stdin` で書き、片方を main の先にする。その 8 桁の句は `commit に解決しない` と SHA を長くする案内、同じ commit の 40 桁の句は ERROR なし） | 8 桁だけを受ける、曖昧を `rev-parse` の失敗と区別せず直し方を出さない、9 桁以上を句と認めない |
| T13 | C3 | F5 | CLI | `PASS: T13 PR の branch の commit は main の祖先でない`（main の commit M を `origin/main` に置き、branch で commit C を作って HEAD を C の子にし、`docs/backlog.md` に C の句。(i) env なしで `main の祖先でない`、(ii) `WORKFLOW_BASE_SHA=M` で同じ ERROR、(iii) 同じ行の M の句は ERROR なし） | (b) を HEAD の祖先で見る（C は HEAD の祖先なので通る）、`WORKFLOW_BASE_SHA` を使わない |
| T14 | C3 | F6 | CLI | `PASS: T14 その時点に無い path は ERROR、root の path は通る`（A の時点に無い `docs/z.md:1` と、root に無い basename の `a.md:1` は `の時点で無い`。A の時点の root に在る `README.md:1` は ERROR なし） | path を今の tree で見る、basename を探して当てる、root 直下の file を basename として止める |
| T15 | C3 | F6 | CLI | `PASS: T15 行数を越える行番号は ERROR`（`docs/a.md:4` と `docs/a.md:2-9`、どちらも `行数を越える`。A の後の commit で `docs/a.md` を 9 行に延ばしても ERROR のまま） | 行数を今の file で数える、範囲の終わりを見ない |
| T16 | C3 | F7 | CLI | `PASS: T16 path の無い行番号と句の後の L<N> は ERROR`（句の後に `SCREEN_DESIGN L42` と `docs/a.md#L2`、前に path の無い `（:12）`、どれも `曖昧`） | 覆いの検査が無い、句の後の `L<N>`・`#L<N>` を path があるとして照らす |
| T17 | C4 | F9 | CLI | `PASS: T17 Plans の時点つきの申し送りは ERROR`（`docs/Plans.md` に T9 と同じ正しい句つきの引用、`行番号で引いている`） | Plans に D3・D4 を当てる |
| T18 | C5 | F10 | CLI | `PASS: T18 両 mode で走り exit 1`（T2 の file を置き、既定 mode の出力に `FL1:` と T2 の ERROR、`--target plan <valid packet>` の exit が 1 で同じ ERROR。T2 を消すと `--target plan` の exit が 0） | 片方の mode で呼ばない、`warn` にする |
| T19 | C6 | F11 | CLI（実 repo） | AC1・AC2（exit 0、`FL1` の行）、AC4（`run-workflow-tests.sh` の既存の test が全部 green。`doc-consistency-plan-packet.test.sh` の synthetic repo の fixture は `P` に当たらず句も無い〈packet の Probe P6〉。同じ test の実 repo の self-pass は手元では full の履歴、hosted では T25 の workflow job の checkout で引ける） | FL1 が今の live の docs を止める、既存の test が red、remote の無い synthetic repo で起点を引こうとして止まる |
| T20 | C1〜C4 | F1・F4〜F8・F12 | mutation（隔離した写し） | AC10: FL1 の呼び出しを外す・D4 (c)・(d) を常に真にする・(b) の base を HEAD にする・git の 0・1 以外を合格に読む・unshallow の案内を外す・code の文字列も照らす・正本の行の句も照らす変異で、当たる行（T2〜T5・T10〜T17・T12b・T13・T21・T23）が red | test の期待が空集合だけで、変異を検出しない |
| T21 | C1・C3 | F12 | CLI | `PASS: T21 正本の時点の句と日付は ERROR、規則の例の file は照らす`（`docs/function-design/10-x.md` に A の句つきの正しい `` `docs/a.md:2` `` と `2026-10-24 の観測: src/b.ts:1`、どちらも `行番号で引いている`。同じ句と引用を `docs/DOC_STYLE_GUIDE.md` に置くと ERROR なし、そこで行数を越えると `行数を越える`） | 正本の行の句を照らして通す（D-125 の Alternatives が退けた形）、日付つきの自由文を除外にする、規則の例の file を照らさない |
| T22 | C3 | F5 | CLI | `PASS: T22 起点が決まらなければ ERROR、句が無ければ引かない`（`origin/main` も `WORKFLOW_BASE_SHA` も無い fixture で `docs/backlog.md` に A の句、`起点が決まらない`。同じ fixture で句の無い正本の `path:N` は `行番号で引いている` だけで `起点が決まらない` は出ない） | 起点の欠けを合格にする、句の無い repo でも起点を引いて止まる |
| T23 | C3 | F5 | CLI | `PASS: T23 git の 0・1 以外は ERROR`（PATH の先頭に置いた shim の `git` が `merge-base --is-ancestor` だけ 128 を返し、他は本物の git へ渡す。T9 の正しい句で `git が失敗した`） | 128 を「祖先でない」か「合格」と読む |
| T24 | C1 | F13 | CLI | `PASS: T24 未追跡の file は見ない`（未追跡の `docs/local-note.md` に `` `docs/a.md:2` ``、ERROR なし。`git add` の後に回すと `行番号で引いている`） | `rg --files` 等で未追跡の file も列挙する |
| T25 | C7 | F14 | drift test（`scripts/tests/ci-workflow.test.sh`） | `validate_parity` が、`workflow` job の `actions/checkout@v6` の `fetch-depth == 0` と、docs job の `bash scripts/doc-consistency-check.sh` の step の `WORKFLOW_BASE_SHA == ${{ github.event.pull_request.base.sha \|\| github.sha }}` を確かめる。mutation: workflow job の checkout だけから `fetch-depth` を外した写し、docs の checker の step だけから env を外した写しで、どちらも `validate_parity` が失敗する（`assert_mutated` で写しが変わったことも確かめる） | workflow job の深さを見ない（既存の `shallow_mutation` は全置換で docs の assert が先に止まる）、env を見ない |

## State Lifecycle Matrix

UI・DB・cache・route の状態は無い。docs の行番号の引用の検査の lifecycle（編集 → push → pre-push → hosted）を書く。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 正本・Plans の行番号の引用 | 引用なし | push の前 | pre-push の FL1 OK → hosted docs job OK | `path:N` を足す編集（正本の行の時点の句・日付つきを含む） | pre-push の FL1 が ERROR で push が止まる | path と symbol に直す | — | pre-push を通さなくても hosted docs job が red | 直して push | T2〜T4・T17・T18・T21 |
| code の comment の行番号の引用 | 引用なし | push の前 | hosted docs job OK | comment に `path:N` を足す編集（文字列は対象外） | code だけの push では pre-push の docs gate が走らない（classifier が docs に分けない） | comment を symbol に直す | — | hosted docs job が red（手元は checker の直接の実行か local full） | 直して push | T5 |
| backlog の時点つきの引用 | 句の commit の tree で合う | — | FL1 OK | 引用先の file が後で改名・削除される | OK のまま（句の commit で見る） | 句の SHA や path を書き誤る、PR の branch の commit を書く | — | `commit に解決しない`・`main の祖先でない`・`の時点で無い`・`行数を越える` | main の commit・root からの path に直して push | T9・T12〜T15 |
| 句の SHA の曖昧さ | 8 桁で 1 つの commit に決まる | — | FL1 OK | 同じ先頭の object が repo に増える | — | — | — | `commit に解決しない`（SHA を長くする案内） | 句の SHA を長くする | T12c |
| 手元の浅い clone・起点の無い clone | 句の commit の object か `origin/main` が無い | pre-push | — | — | — | — | — | `commit に解決しない`・`main の祖先でない`（`git fetch --unshallow` の案内）/ `起点が決まらない` | `git fetch --unshallow` / `git fetch origin main` | T12b・T22、packet の Probe P5・P8 |
| hosted の workflow job の self-pass | checkout が full の履歴 | workflow の file を触る PR の push | 実 repo の FL1 が句の commit と `origin/main` を引けて OK | checkout の `fetch-depth` を外す編集 | — | — | — | `ci-workflow.test.sh` の `validate_parity` が red | `fetch-depth: 0` に戻す | T25、packet の Probe P8 |
