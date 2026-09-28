# Test Design Matrix: 並走の摩擦を削る（ハーネス、R3）

Plan Packet: [2026-09-28-harness-parallel-friction.md](../2026-09-28-harness-parallel-friction.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-WF-PARALLEL-FRICTION-D1: R2+ は差分（`filename` と `previous_filename`）が触る `docs/plans/` 直下の dated packet がちょうど `--packet` の 1 つで、それが head にあるときだけ通る。
- SPEC-WF-PARALLEL-FRICTION-D2: R0 / R1 は head にある active packet を触らないときだけ通る。`docs/plans/` を離れる packet は head の `docs/archive/plans/<同じ名前>` の Phase が `archive` のときだけ closeout の移送として通す。
- SPEC-WF-PARALLEL-FRICTION-D3: helper は head の `docs` / `docs/plans` の一覧と `docs/Plans.md` を読まない。
- SPEC-WF-PARALLEL-FRICTION-D4: PK5 の祖先・不変性の検査は、起点（`WORKFLOW_BASE_SHA` が HEAD と違えばそれ、そうでなければ `origin/main`）からの差分が触る packet に掛け、起点が無ければ全 packet に掛ける。
- SPEC-WF-PARALLEL-FRICTION-D5: 後続 lane の base 同期は先行 lane の closeout を待たない（文書の規則。rg で確かめる）。
- SPEC-WF-PARALLEL-FRICTION-D6: PK4 は active packet があるとき `## 次の行動`（code fence と HTML comment を除く）に `docs/plans/` の文字列を求め、packet ごとの link は求めない。
- SPEC-WF-PARALLEL-FRICTION-D7 / D8: 選択規則・`Branch` 行・`merge.directoryRenames=false` の文書の規則（rg で確かめる）。
- SPEC-WF-PARALLEL-FRICTION-D9: 守る境界（record の head/base、approved snapshot、Double Audit、classifier、R0 / R1 の要求、manual の再利用、strict）は既存の test のまま green。

## Failure Modes

- F1: main から取り込んだ他の lane の merge 済み packet が head にあるだけで、R2+ の PR が `packet absent or multiple active packets` で止まる（観測 1）。
- F2: 同じく R0 / R1 の PR が `R2+ active packet requires --packet` で止まる（観測 2）。
- F3: 差分の packet の判定が緩み、他の lane の packet を書き換える・archive へ動かす PR が通る。
- F4: R0 と称した PR が active packet を編集・削除して通る。
- F5: directory rename の推測で進行中の lane の packet が archive へ動いた PR が closeout として通る（観測 6）。
- F6: GitHub が移送を削除と追加で返し、正当な closeout が拒否される。
- F7: 触る packet の計算が `previous_filename` を見落とし、他の lane の packet の移送を見逃す。
- F8: merge 済み packet の Plan Commit が squash で祖先でなくなり、PK5 が他の lane の PR・local の gate を red にする（Contract Probe 3）。
- F9: PK5 の対象を狭めすぎ、自分の packet の Plan Commit の祖先の破れや、他の lane の packet の書き換えを見逃す。
- F10: 起点が取れない環境（`origin` の無い clone、dispatch）で PK5 が黙って何も検査しない。
- F11: Plans.md の lane の link の要求が残り、lane が起票・closeout のたびに共有の節へ書き足す（観測 3）。
- F12: PK4 の検査が消え、dashboard が active な作業を指さなくなっても検出しない。
- F13: 既存の test の置き換えで、同じ失敗（曖昧な結び付け・HTTP 失敗の握り潰し）を拒む力が落ちる。
- F14: 未知の file の `status` を黙って既知の扱いにする。

## Test Matrix

- 引いた既存の test の実在は `rg -n 'def test_|^# ---' scripts/tests/pr-gate.test.py scripts/tests/doc-consistency-plan-packet.test.sh` と `rg -n '^# PK5|^# T-G' scripts/tests/workflow-git-checks.test.sh` で 2026-09-28 に確かめた。新しい test の名前は実装の S2・S4・S6 で作る。
- helper の test は CLI の class（`scripts/tests/pr-gate.test.py` の `CLI`）と同じく fake gh の process を通す。差分の fixture は `state['files']`（`status`・`filename`・`previous_filename`）、head の内容は `state['contents']`（ref ごとの `snapshots`）。実 GitHub は呼ばない。
- PK5 の test は `scripts/tests/workflow-git-checks.test.sh` の合成 repo（`init_repo` / `commit_all` / `write_packet`）で commit 列を組む。起点は `WORKFLOW_BASE_SHA` と、合成 repo に作る `refs/remotes/origin/main` で与える。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1 | F1 | CLI（fake gh） | `PacketScope.test_other_lane_packet_in_head_r2_passes`: 差分 = 自分の packet `added` と code、head の contents に他の lane の packet もある、`--packet` = 自分 → status の blockers に packet の理由が無い | 触る packet を head の一覧で決める（MU1） |
| D1 | F3 | CLI | `test_two_active_packets_in_diff_rejected`: 差分に active packet 2 つ（自分 `added`、他 `modified`）→ exit 1、`PR diff must touch exactly the --packet active packet` | 条件を部分集合に緩める（MU2） |
| D1 | F3 | CLI | `test_packet_argument_mismatch_rejected`: 差分の packet は A、`--packet` は B（B は head にある）→ exit 1 | `--packet` の一致を見ない |
| D1 | F3・F7 | CLI | `test_r2_archiving_other_lane_packet_rejected`: 差分 = 自分の packet `added` と、他の lane の packet の `renamed`（`filename` = archive、`previous_filename` = `docs/plans/…`、archive の Phase archive）→ exit 1 | `previous_filename` を見ない（MU4）、部分集合に緩める（MU2） |
| D1 | F7 | CLI | `test_rename_inside_plans_counts_both_paths`: `renamed docs/plans/2026-01-02-b.md ← docs/plans/2026-01-01-a.md`、`--packet` = b → exit 1（a が離れる packet として数えられ、archive でもない） | `previous_filename` を見ない（MU4） |
| D2 | F2 | CLI | `test_r0_closeout_archive_move_passes`: `--risk R0`、差分 = `renamed` で packet と Matrix を archive へ、archive の packet の Phase archive、head に他の lane の active packet も残る → status の blockers が空、ready・merge まで通る | R0 の経路が head の一覧を見る、移送を削除として扱う |
| D2 | F6 | CLI | `test_r0_closeout_reported_as_remove_and_add_passes`: 同じ移送を `removed docs/plans/…` と `added docs/archive/plans/…` で返す → 通る | `renamed` の metadata だけで移送を判定する |
| D2 | F4 | CLI | `test_r0_edit_of_active_packet_rejected`: `--risk R0`、差分 = active packet の `modified` → exit 1、`R2+ active packet requires --packet` | R0 の経路の触る packet の検査を外す（MU3） |
| D2 | F4 | CLI | `test_r0_packet_deletion_without_archive_rejected`: `--risk R0`、差分 = `removed docs/plans/…`、archive に無い → exit 1 | 離れる packet を無条件に通す |
| D2 | F5 | CLI | `test_r0_archive_move_without_phase_archive_rejected`: `--risk R0`、`renamed` で archive へ、archive の内容の Phase が `implementing`（directory rename の事故の形）→ exit 1 | Phase archive の検査を外す（MU5） |
| D2 | F13 | CLI | 置き換えた `test_parent_or_present_directory_http_failure_is_error` の後継: closeout の移送の archive の contents が HTTP 失敗 → exit 2 | 取得失敗を空や移送なしに置き換える |
| D3 | F11・F13 | CLI | `test_packet_scope_does_not_list_docs_or_read_plans`: R0 と R2+ の status を通し、fake gh の呼出しに `/contents/docs?`・`/contents/docs/plans?`・`/contents/docs/Plans.md` が無い | 一覧か Plans.md の照合が残る |
| D1・D2 | F14 | CLI | `test_unknown_file_status_is_input_error`: `status: moved` → exit 2 | 未知の status を既知として扱う |
| D4 | F8 | 合成 git repo | S4 (a): main 側で squash 相当の merge 済み packet（Plan Commit が祖先でない）、branch は自分の packet だけを足す、`WORKFLOW_BASE_SHA` = main → exit 0 | 対象を全 packet に戻す（MU6） |
| D4 | F9・F3 | 合成 git repo | S4 (b): branch が merge 済み packet の本文を書き換える → exit 1 | 対象を常に空にする（MU7） |
| D4 | F9 | 合成 git repo | S4 (c): 自分の packet の Plan Commit が祖先でない（rebase 後の形）、起点あり → exit 1 | 対象を常に空にする（MU7）、自分の packet を差分から外す |
| D4 | F10 | 合成 git repo | S4 (d): `origin/main` も `WORKFLOW_BASE_SHA` も無い → merge 済み packet も検査して exit 1 | 起点なしで検査を飛ばす |
| D4 | F10 | 合成 git repo | S4 (e): `WORKFLOW_BASE_SHA` = HEAD（dispatch）、`origin/main` あり → 自分の packet を検査する（祖先の破れで exit 1） | dispatch で差分が空になり検査が抜ける |
| D4 | — | 合成 git repo | 既存の「PK5: squash 相当の負例」「Plan Commit 書き換え検出」「Amendments」系（起点なし）→ 現行どおり | 起点なしの経路で既存の検査が変わる |
| D6 | F11 | bash checker test | S6: active packet 2 つ、packet ごとの link なし、`docs/plans/` を指す行あり → `PK4: Workflow State machine 整合 OK` | packet ごとの link の要求が残る |
| D6 | F12 | bash checker test | S6: pointer 行なし → ERROR `docs/plans/` を指す行がありません | pointer の検査を外す（MU8） |
| D6 | F12 | bash checker test | S6: pointer が code fence か HTML comment の中だけ → ERROR | strip をせずに数える |
| D6 | — | bash checker test | S6: `### Wave Registry` の小見出しの下の pointer（旧 section 28 の後継）→ OK | h2 の節の抽出が `###` で切れる |
| D5・D7・D8 | F11 | rg | packet の AC6・AC7・AC8 | 旧い規則の文が正本に残る |
| D9 | F13 | CLI・unit | `scripts/tests/pr-gate.test.py` の既存の全 test（`Records`・`RecordLifecycle`・`GitReuse`・`CLI`）。`configure_packet` を使う test は packet を差分に `added` で載せる形に直し、期待する合否は変えない | 境界のどれかを弱める |

## State Lifecycle Matrix

packet（lane）の状態の遷移と、各状態で helper・PK4・PK5 がどう見るか。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 自分の lane の packet | 起票で `docs/plans/` に `added`。helper は差分の packet 1 つで判定、PK5 は Plan Commit が pending の間は対象外 | 実装中。差分に出続け、PK5 の対象 | merge。main に Phase implementing のまま残る | main の取込みで head/base が変わると record は旧版になり closure が要る（D9、変えない） | helper は毎回 PR の差分を取り直す（cache しない） | 再開は依頼の名指しと `Branch` 行で選ぶ（D7） | merge 済みの packet は再開しない | 差分の packet が 0 か 2 以上なら拒否 | 是正して取り直す | AC1、AC2 |
| 他の lane の merge 済み packet（closeout 前） | main に残る | 後続 lane が取り込む。差分に出ない | helper・PK5 の対象外、PK4 は形式だけ | 後続 lane の差分が触れば対象になり拒否・red | — | — | — | 触った PR は拒否 | 触らないように直す | AC1、AC4 |
| closeout の PR | R0。packet を archive へ移し Phase archive | — | 離れる packet が Phase archive の移送なら通る | archive の Phase が archive でなければ拒否 | — | — | — | archive の取得失敗は exit 2 | 再実行 | AC1 |
| Plans.md の pointer | 本 lane の実装で 1 行置く | — | active packet がある間 PK4 が求める | pointer を消すと PK4 が ERROR | — | — | — | — | 行を戻す | AC5 |

For workflow-state changes, cover capture/server races, stale head/base, broad/closure, manual/R4 and hosted gate: 本 lane は capture・record・closure・manual・R4・hosted gate の処理を変えない（D9）。既存の `RecordLifecycle`・`CLI.test_offline_bad_repo_input_and_race`・`test_merge_match_head_race` が現行どおり green であることで確かめる（AC2）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 「head の `docs/plans/` の全 packet」で判定する | `scripts/pr-gate.py:223-234`・`:244`、`scripts/check-workflow-git.sh` の `main()` の loop、`scripts/doc-consistency-check.sh:1364-1391`（PK4 の Plans.md）、`iter_active_dated_plans`、`--target plan` の既定の対象 | helper（S1）、PK5（S3）、PK4 の Plans.md（S5） | PK1〜PK4 の形式の検査と `--target plan` の既定の対象は全 packet のまま（merge 済み packet も形式は満たしている）。Evidence Mode・Phase の検査も全 packet のまま | AC1、AC4、AC5 |
| 「Plans.md の lane の link から packet を選ぶ」 | `docs/DEV_WORKFLOW.md:110`・`:235`・`:385`・`:419`、`docs/agent-guidance/merge-evidence.md:142`・`:144`・`:160`、`.agents/skills/inventory-workflow-start/SKILL.md:12`、`.claude/commands/plan-rally.md:7`、`docs/AGENT_OPERATING_MANUAL.md:86`、`docs/Plans.md:83`、`AGENTS.md:14`、`docs/PROJECT_HANDOFF.md:7`、`docs/DEV_WORKFLOW.md:68`・`:390` | S7・S8・S10・S11 | `AGENTS.md:14`（pointer 経由で意味が保たれ、drift test の対象）、`docs/PROJECT_HANDOFF.md:7`（「Plans.md と対象 Plan Packet」で誤りでない）、`docs/DEV_WORKFLOW.md:68`・`:390`（該当が無くなるだけ、PR4） | AC8 |
| 「先行 lane の closeout を後続 lane の同期より先に」 | `docs/agent-guidance/merge-evidence.md:130`、`docs/DEV_WORKFLOW.md:419`・`:426`、`docs/ci.md:79`（MG-D6/D7 と Actions 停止時の参照だけ） | S7・S8 | `docs/ci.md` は順序を定めていない | AC6 |
| 単段 merge の command | `docs/DEV_WORKFLOW.md:238`・`:246`（Stacked train）、merge-evidence の base 同期 | `:238`（S8） | `:246` は Stacked train の base 付け替えで `:238` を参照する形のまま。merge-evidence は「origin/mainを取り込む」とだけ書き、command は DEV_WORKFLOW が持つ | AC7 |
| test の fixture の Plans.md の link | `scripts/tests/pr-gate.test.py` の `configure_packet`・`test_registered_amendment_order_cannot_roll_back_manual`、`scripts/tests/doc-consistency-plan-packet.test.sh` の `write_plans_md_*` | S2・S6 | — | AC2、AC5 |

## Negative Paths

- missing input: `--packet` なしで差分が active packet を触る（R0 の拒否）、`--packet` ありで差分が packet を触らない（R2+ の拒否）。
- invalid input: 未知の file の `status`（exit 2）、`--packet` の path の形式違い（現行の exit 2）。
- duplicate/ambiguous input: 差分が active packet を 2 つ触る、rename で 2 path が出る。
- unknown reference: `docs/plans/` を離れる packet が archive に無い（削除として拒否）。
- dependency missing: 起点（`origin/main`・`WORKFLOW_BASE_SHA`）が無い → PK5 は全 packet に倒す。
- permission/write failure: archive の contents の HTTP 失敗 → exit 2（空に置き換えない）。
- dry-run side effect: helper の `status` は read-only のまま（既存の `test_status_capture_ready_merge` の GET だけの確認）。

## Boundary Checks

- threshold: 差分の path 数の上限（6000 未満）は変えない。
- null/default: `previous_filename` が無い entry（`renamed` 以外）。
- empty/non-empty: 差分が packet を 1 つも触らない R0、`docs/plans/` が head に無い R0（一覧を読まないので区別しない）。
- min/max: 触る packet 0・1・2。
- status/policy enum: file の `status` の 7 値と未知の値、Phase `archive` とそれ以外。
- wire type: GitHub の file entry（Boundary / Wire Contract）。
- internal type: 触る packet の集合 2 つ。
- producer/consumer: GitHub API → helper、git の diff → PK5、Plans.md → PK4。
- round-trip token: 該当なし。
- precision/range: 該当なし。
- cross-language parse: 該当なし（Python と bash が同じ正規表現 `YYYY-MM-DD-*.md` を使う点は、helper の `:228`・`:230` と checker の `is_active_dated_plan` を実装時に読み合わせる）。

## Compatibility Checks

- old schema/input: 既存の packet（`Branch` 行なし）はそのまま受理する（追加行は評価しない）。旧 helper で作った capture は `requirements` の key が同じで、再 capture の要否は現行どおり内容の一致で決まる。
- new schema/input: `Branch` 行つきの packet を helper と PK4 が受理する（`test_packet_schema` の追加行の扱いと PK4 の section 24「任意追加 field は禁止しない」）。
- output order: helper の出力と exit code は変えない。
- optional field behavior: `previous_filename` は `renamed` のときだけ。

## Data Safety Checks

- source-derived data: なし。
- generated outputs: なし（`90-traceability.md`・bindings を再生成しない）。
- secrets: なし。helper の test は fake gh で、実 token を使わない。
- local-only files: `$TMPDIR` の mutation の写しと合成 repo は test の後に消す。
- synthetic sample boundaries: fixture の SHA・path・packet の本文は合成。実 PR は Contract Probe の read-only の GET だけ。

## Main Wiring / Integration Checks

- helper connected to main path: `python3 scripts/pr-gate.py status|capture|record|ready|merge` の全 action が `requirements()` を通る（`snapshot()`）。CLI の test は fake gh の process を通す。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: hosted の docs job が `WORKFLOW_BASE_SHA` を渡し、S3 が起点に使う（Contract Probe 5 を実装の PR で確かめる）。
- CLI arg reaches implementation: `--packet` と `--risk` が R2+ と R0 の経路を選ぶ（既存の argparse のまま）。

## Mutation-style Adequacy Questions

mutation は packet の Test Plan の MU1〜MU8。実注入で red を確かめる（AC10）。

- If a key branch is inverted, which test fails?: R2+ と R0 の経路の取り違え → `test_other_lane_packet_in_head_r2_passes`（R2+ が通るべき）と `test_r0_edit_of_active_packet_rejected`（R0 が拒むべき）。
- If a guard is removed, which test fails?: Phase archive の検査（MU5）→ `test_r0_archive_move_without_phase_archive_rejected`、触る packet の検査（MU3）→ `test_r0_edit_of_active_packet_rejected`、pointer の検査（MU8）→ S6 の pointer なし。
- If a threshold comparison changes, which test fails?: 触る packet の数の等号を「含む」に緩める（MU2）→ `test_two_active_packets_in_diff_rejected`。
- If an output field is omitted, which test fails?: `previous_filename` を読まない（MU4）→ `test_r2_archiving_other_lane_packet_rejected`・`test_rename_inside_plans_counts_both_paths`。
- If output order changes, which test fails?: 該当なし（集合の比較）。
- If dry-run performs a side effect, which test fails?: `status` の GET だけの確認（既存）。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately?: 本 lane は tracked に head を書かない（`Branch` は branch 名で SHA でない）。
- mock の値の取り違え: fake gh の差分と head の contents を別々に持たせ、差分に無い packet を contents にだけ置く（`test_other_lane_packet_in_head_r2_passes`）。一覧で判定する実装（MU1）なら contents の packet を拾って落ちる。
- PK5 の対象の取り違え: MU6（全 packet）は S4 (a)、MU7（空）は S4 (b)・(c) が捉える。

## Residual Test Gaps

- 他の lane の Test Design Matrix（`docs/plans/test-matrices/`）の書き換えは helper も PK5 も検出しない（現行も同じ。本 lane の範囲外）。
- hosted の docs job で `origin/main` が解決できること（Contract Probe 5）は、実装の PR の hosted の log でしか確かめられない。解決できなくても全 packet の検査に倒れる（red の向き）。
- GitHub が移送を `renamed` で返すか削除と追加で返すかの閾値は未実測。どちらの形も test で通す。
- 業務上の Risk の申告の正しさ（R2+ の作業を R0 と称して packet なしで出す PR）は、現行どおり helper では検出しない（owner と model の判断。CI 実行 code の変更だけは classifier で拒否）。
