# Test Design Matrix: file:行 の引用を `scripts/doc-consistency-check.sh` で検査する（docs の棚卸し lane 2b、R3）

packet: `docs/plans/2026-10-24-docs-file-line-check.md`（検査の形 D1〜D7、Contract Ledger CL1〜CL11、AC1〜AC10）。

## Risk

Risk: R3

## Contracts Under Test

- C1（D1・D2、CL1）: D2 の対象の file の、D3 の除外に当たらず時点の句の無い行の `P` の一致は `FL1: <file>:<行>: 行番号で引いている` の ERROR。4 つの形（`path:N`、bare の `:N`、`L<N>`、`#L<N>`）のどれでも。
- C2（D2・D3、CL3）: 除外の path の file と、library の版の行・変更履歴の表の行は止めない。
- C3（D4、CL2・CL4・CL5・CL6）: 時点の句のある行は、各引用を左で一番近い句の commit で照らす。SHA が解決しない・HEAD の祖先でない・path がその tree に無い（basename だけを含む）・行数を越える・覆われない一致（曖昧）・句より前の引用は、それぞれ D6 の固定の語の ERROR。全部合えば通る。
- C4（D5、CL2）: `docs/Plans.md` は時点の句があっても `行番号で引いている` の ERROR。
- C5（D6、CL9）: FL1 は既定 mode と `--target plan` の両方で走り、違反があれば script の exit は 1。違反が無ければ `info` の行を出す。
- C6（CL7・CL8）: 実 repo の live な docs・comment で FL1 の ERROR は 0（workflow の 2 行を直した後）。

## Failure Modes

- F1: 正本・comment に行番号の引用が足されても docs gate が通る（今の状態）。
- F2: 4 つの形の一部（bare の `:N`、`L<N>`、`#L<N>`）だけを見落とす。
- F3: 時点の記録（除外の path、library の版の行、変更履歴の行）を止め、active な packet・archive・reference が red になる。
- F4: 時点の句があるだけで、行の引用を照らさずに通す（2a の AC-S3-1 は行の単位で、句の commit・path・行数を見ない）。
- F5: SHA の写し誤り・main に無い commit・浅い clone の欠けた object を合格にする（fail-open）。
- F6: path の綴りの誤り・basename だけの path・行数の外を通す。
- F7: path の無い `L<N>`・`:N` を、どの path にも結び付けずに黙って通す（覆いの検査の欠け）。
- F8: 句より前の引用を、後ろの句の commit で照らして通す。
- F9: `docs/Plans.md` の時点つきの申し送りを backlog と同じく通す。
- F10: FL1 を片方の mode でしか呼ばない、または ERROR を `warn` にして exit 0 のまま。
- F11: 既存の check・既存の test（`doc-consistency-plan-packet.test.sh` ほか）が FL1 の追加で red になる。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。
- fixture は `scripts/tests/doc-file-line-check.test.sh` が tmpdir に作る synthetic な git repo（`git init`、架空の file と commit）。期待は「ERROR の行に `FL1:`・fixture の `<file>:<行>`・D6 の固定の語」か「その file の FL1 の ERROR の行が無い」。各負例の fixture には同じ file に正例の行も 1 つ置き、FL1 を丸ごと黙らせる変異（出力を空にする）で負例だけが kill を主張しないようにする（正例は「ERROR が無い」なので、負例の期待が非空であることが kill の根拠）。
- exit code は `--target plan` で valid な最小の packet を置いた fixture で見る（既定 mode は synthetic repo で他の check〈command の drift ほか〉が前提の file を欠くので、FL1 の行だけを見る）。
- test 名は実装で付ける（既存の命名に倣い `echo "PASS: <ID> …"`）。

| ID | Contract | Failure Mode | Test Type | Test Name / fixture | Would fail if... |
|---|---|---|---|---|---|
| T1 | C1 | F1 | CLI（synthetic repo） | `PASS: T1 path と symbol の引用は通る`（`docs/function-design/10-x.md` に `` `src-tauri/src/a.rs` の `fn foo` ``） | path や backtick だけで ERROR にする（拾い過ぎ） |
| T2 | C1 | F1 | CLI | `PASS: T2 正本の path:N は ERROR`（同 file に `` `src-tauri/src/a.rs:3` ``） | FL1 が無い、正本を対象にしない |
| T3 | C1 | F2 | CLI | `PASS: T3 bare の :N は ERROR`（`` `a.rs` の `fn foo`（`:12`） `` の形） | bare の形を見ない |
| T4 | C1 | F2 | CLI | `PASS: T4 L<N> と #L<N> は ERROR`（`docs/x.md` に `SCREEN_DESIGN.md L120` と `…/blob/x/a.rs#L12` の 2 行、ERROR が 2 行） | `L<N>` か `#L<N>` を見ない |
| T5 | C1 | F1 | CLI | `PASS: T5 code の comment の path:N は ERROR`（`src/a.ts` に `// see b.ts:4`、`src-tauri/src/c.rs` に `/// see d.rs:5`） | `src`・`src-tauri/src` を対象にしない |
| T6 | C2 | F3 | CLI | `PASS: T6 除外の path は通る`（`docs/archive/a.md`・`docs/evidence/a.md`・`docs/research/a.md`・`docs/plans/a.md`・`docs/plans/test-matrices/a.md`・`docs/decision-log.md`・`docs/design-system/reference/a.md`・`src/lib/invalidation-contract.static.test.ts` の各 file に `` `x.rs:3` ``） | 除外の一覧の一部が抜ける |
| T7 | C2 | F3 | CLI | `PASS: T7 library の版の行は通る`（`docs/x.md` に `@tanstack/router-core 1.168.15 の router.js:415`） | library の除外が無い、名前の一覧が 2a の `K` と違う |
| T8 | C2 | F3 | CLI | `PASS: T8 変更履歴の表の行は通る`（`| 2026-01-01 | a.md:3 を直した |`） | 変更履歴の除外が無い、行頭の判定がずれる |
| T9 | C3 | F4 | CLI | `PASS: T9 時点つきの正しい引用は通る`（`docs/backlog.md` に、fixture の commit A の句と `` `docs/a.md:2` ``・`` `docs/a.md:1-3` ``・`` `docs/a.md:1`〜`:3` ``・`` `docs/a.md:1`/`:2` ``、別の句 B と `` `src/b.ts:1` `` を 1 行に。A の時点の `docs/a.md` は 3 行） | 句と引用の対応・bare の `:N` の path の引き継ぎ・範囲の読みが誤り、正しい引用を止める |
| T10 | C1・C3 | F4 | CLI | `PASS: T10 backlog の句の無い行番号は ERROR`（`docs/backlog.md` に `` `docs/a.md:2` `` だけ、`行番号で引いている`） | backlog を除外にする |
| T11 | C3 | F8 | CLI | `PASS: T11 句より前の引用は ERROR`（`` `docs/a.md:1` と `A` の時点で `docs/a.md:2` ``、1 つめに `時点の commit が無い`、2 つめは ERROR なし） | 行に句が 1 つあれば全部を照らして通す（2a の AC-S3-1 の行の単位） |
| T12 | C3 | F5 | CLI | `PASS: T12 解決しない SHA は ERROR`（`` `deadbeef` の時点で `docs/a.md:1` ``、`commit に解決しない`） | `rev-parse` の失敗を無視する（fail-open） |
| T13 | C3 | F5 | CLI | `PASS: T13 HEAD の祖先でない SHA は ERROR`（fixture で別 branch に commit C を作って元の branch へ戻り、C の句、`HEAD の祖先でない`） | 祖先の判定が無い |
| T14 | C3 | F6 | CLI | `PASS: T14 その時点に無い path は ERROR`（A の時点に無い `docs/z.md:1` と basename だけの `a.md:1`、どちらも `の時点で無い`） | path を今の tree で見る、basename を探して当てる |
| T15 | C3 | F6 | CLI | `PASS: T15 行数を越える行番号は ERROR`（`docs/a.md:4` と `docs/a.md:2-9`、どちらも `行数を越える`。A の後の commit で `docs/a.md` を 9 行に延ばしても ERROR のまま） | 行数を今の file で数える、範囲の終わりを見ない |
| T16 | C3 | F7 | CLI | `PASS: T16 path の無い行番号は ERROR`（句の後に `SCREEN_DESIGN L42` と、前に path の無い `（:12）`、どちらも `曖昧`） | 覆いの検査が無い |
| T17 | C4 | F9 | CLI | `PASS: T17 Plans の時点つきの申し送りは ERROR`（`docs/Plans.md` に T9 と同じ正しい句つきの引用、`行番号で引いている`） | Plans に D3・D4 を当てる |
| T18 | C5 | F10 | CLI | `PASS: T18 両 mode で走り exit 1`（T2 の file を置き、既定 mode の出力に `FL1:` と T2 の ERROR、`--target plan <valid packet>` の exit が 1 で同じ ERROR。T2 を消すと `--target plan` の exit が 0） | 片方の mode で呼ばない、`warn` にする |
| T19 | C6 | F11 | CLI（実 repo） | AC1・AC2（exit 0、`FL1` の行）、AC4（`run-workflow-tests.sh` の既存の test が全部 green。`doc-consistency-plan-packet.test.sh` の fixture は `P` に当たらない〈packet の Probe P6〉） | FL1 が今の live の docs を止める、既存の test が red |
| T20 | C1〜C4 | F1・F4〜F8 | mutation（隔離した写し） | AC10: FL1 の呼び出しを外す・D4 (c)・(d) を常に真にする変異で、T2〜T5・T10〜T17 のうち当たる行が red | test の期待が空集合だけで、変異を検出しない |

## State Lifecycle Matrix

UI・DB・cache・route の状態は無い。docs の行番号の引用の検査の lifecycle（編集 → push → pre-push → hosted）を書く。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 正本・comment・Plans の行番号の引用 | 引用なし | push の前 | pre-push の FL1 OK → hosted docs job OK | `path:N` を足す編集 | pre-push の FL1 が ERROR で push が止まる | path と symbol に直す | — | pre-push を通さなくても hosted docs job が red | 直して push | T2〜T5・T17・T18 |
| backlog の時点つきの引用 | 句の commit の tree で合う | — | FL1 OK | 引用先の file が後で改名・削除される | OK のまま（句の commit で見る） | 句の SHA や path を書き誤る | — | `commit に解決しない`・`の時点で無い`・`行数を越える` | 直して push | T9・T12〜T15 |
| 手元の浅い clone | 句の commit の object が無い | pre-push | — | — | — | — | — | `commit に解決しない`（`git fetch --unshallow` の案内） | `git fetch --unshallow` | T12、packet の Probe P5 |
