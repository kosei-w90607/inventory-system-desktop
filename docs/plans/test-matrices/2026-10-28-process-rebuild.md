# Test Design Matrix: 開発の手続きの作り直し（D-145）

Plan Packet: [../2026-10-28-process-rebuild.md](../2026-10-28-process-rebuild.md)

helper・検査・CI の振舞いを変える行（H1〜H9・H11〜H14）を、合成の git repo・fake gh・合成の packet で確かめる。既存の拒否の case（古い head・broad の不足・base の版の helper・R4 の承認を使い回さない・UI merge の道）は消さず、Phase・移送の前提で書かれた case は新しい契約に合わせて書き換える（書き換えた case と理由は PR body に挙げる。【安全: テストを弱めない】）。

## Risk

Risk: R3

## Contracts Under Test

- D-145 (2) Plan Commit の固定を script で書く（H1）
- D-145 (3) Phase を外し、Plan Commit の有無で計画の前後を決め、計画の承認の前の実装を機械が止める（H2）
- D-145 (4) Final Review Minimum と Human Gate を Risk・classifier・`## L3` 節から導く（H3）
- D-145 (5) packet を archive へ移さない。検査の対象を差分が触る packet に限る（H4）
- D-145 (6) L3 の使い回し C と docs だけの lane の commit の機械の closure（H5・H6）
- D-145 (7) GA の後、Scope・AC が同じなら closure（H7）
- D-145 (8) R2 は packet なしの道（H8）
- D-145 (9) 同じ head の CI を 1 回にする（H9）
- D-145 (10) reviewer の報告から reviewed head を読む（H11）、lane の一覧を引く（H12）、生きた docs に `path:行` を新しく足さない（H13）、packet の最小形（H14）
- 隣接（変えない）: helper は PR の base の版だけが判定する（D-099）、古い head・base の record を拒む、broad の本数の不足を拒む、R4 の承認を使い回さない、PK5 の ancestry と不変、不可逆 finding の 4 項目（文だけ）

## Failure Modes

- 計画の承認の前に code を書いた branch を、Phase の行が無くなったことで機械が通す
- 旧い packet（Phase・担当 4 行・Owner Effort Budget を持つ）を新しい helper・checker が拒み、走っている lane が止まる
- 導いた Minimum が旧い packet の明示値より小さくなり、R3 の Final が 1 本で通る
- `## L3` 節の有無の判定が外れ、manual の gate が黙って消える
- docs だけに見える lane の commit（rename・未知の path・生成物）で L3 か review を使い回す
- GA で Scope・AC が変わったのに fresh broad を求めない
- R2 の packet なしの道で、workflow・rust の変更が R2 として通る
- Draft の run の `Merge gate` が別の head の証拠として受理される
- 報告の reviewed head と capture の head が違うのに record が書かれる
- PK1・PK4 の対象を差分で絞るとき、差分が取れない場合に検査が 0 件になる（fail-open）

## Test Matrix

既存 test の引用は `rg -n '<test 名>' scripts/tests/` で在ることを確かめてから書く（実装の段で Writer が確かめ、無ければ新しく作る）。test 名は実装で決め、下の ID を test の docstring か comment に付ける。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| PA1 `plan-approve.sh` が `Plan Commit: pending` を報告の SHA に置き換え、packet だけの commit を 1 本作る | 手写しの誤記 | CLI（合成 repo） | `scripts/tests/plan-approve.test.sh` PA1 | 置き換えが別の行に当たる、commit が packet 以外を含む |
| PA2 SHA が branch の祖先でない・40 桁の小文字 hex でない・既に SHA が入っている → exit 非 0、何も書かない | 承認していない版を固定、Plan Commit の書き換え（PK5 違反） | CLI | 同 PA2 | 祖先の検査か不変の検査が抜ける |
| PA3 `--amend SHA` は `Amendments` に足す（`none` → SHA、既存の列の後ろ）。重複・Plan Commit の子孫でない SHA は拒む | Amendments の順の崩れ | CLI | 同 PA3 | 列の前に足す、重複を通す |
| PH1 Phase 行の無い新しい packet: `Plan Commit: pending` → helper `status` は `Plan Gate incomplete`、`capture` は拒む | 承認の前に capture・record できる | unit（`parse_packet`・`snapshot`） | `scripts/tests/pr-gate.test.py` PH1 | `phase == implementing` の代わりの判定が pending を通す |
| PH2 Phase 行の無い packet で Plan Commit が SHA → `status` が blocker の評価に進む | 承認済みの lane が止まる | unit | 同 PH2 | SHA の packet を計画中と扱う |
| PH3 旧い packet（Phase・Coordinator・Writer・Plan Reviewer・Final Reviewer・Branch・Owner Effort Budget を持つ）を受け、Phase の値を評価しない。ただし Phase が 8 値の外でも拒まない一方、Plan Commit・Amendments・Risk の形の検査は今のまま | 走っている lane（#216 ほか）が止まる | unit | 同 PH3 | 旧い行を必須か拒否にする |
| PH4 `Plan Commit: pending` の packet を触る branch の差分（起点から）に classifier の `rust`・`frontend`・`generated`・`env`・`unknown` が出るか、`scripts/**`・`.github/**` の path があれば ERROR | 計画の承認の前の実装を通す（K11） | CLI（`check-workflow-git.sh`、合成 repo） | `scripts/tests/workflow-git-checks.test.sh` PH4 | 先走りの検査が無い、code の種類の一部を見落とす |
| PH5 同じ条件で差分が docs・packet だけなら通す（plan-first の commit は止めない） | 起票の commit が止まる | CLI | 同 PH5 | docs を code と数える |
| PH6 起点が解決できない・merge-base が一意でない → 全 packet を対象にし、pending の packet があり差分が取れなければ ERROR | fail-open | CLI | 同 PH6 | 差分が取れないときに 0 件で通す |
| MN1 R2 = 1、R3 = 2、R4 = 2 と r4、classifier `workflow=true` = 2（packet に Minimum を書かない） | R3 が 1 本で通る（TD-484） | unit（`requirements`） | `pr-gate.test.py` MN1 | 導出の表を誤る |
| MN2 packet に `Final Review Minimum` があれば導いた値との大きい方（旧い packet の明示値を下限として尊重。書いた値で下げられない） | 明示の 1 で R3 を下げる | unit | 同 MN2 | min を取る、明示値を無視する |
| MN3 `## L3` 節があれば manual。旧い packet の `Human Gate` に manual があれば節が無くても manual（和集合） | manual が黙って消える | unit | 同 MN3 | 節の検出か旧い行の読取りが抜ける |
| MN4 承認の後の条件の照合（`approved packet condition changed`）は Risk と `## L3` 節の有無で続け、旧い packet は今の 3 field も照合する | 承認の後に L3 を外して manual を消す | unit | 同 MN4 | 照合の対象から L3 を落とす |
| AR1 R0/R1 の道で packet が `docs/plans/` から `docs/archive/plans/` へ移っても `Phase: archive` を求めない（#215 の型を通す）。packet の削除だけ・archive の外への移動は今のまま拒む | 移送の PR が止まる、active な packet を黙って消す | unit | 同 AR1 | 削除の拒否まで消す |
| AR2 PK1・PK4 の対象は branch の差分が触る packet（`check-workflow-git.sh` の PK5 と同じ起点の取り方）。差分が取れなければ全 packet（fail-closed） | 済んだ packet の旧い形が他の PR を止める／差分が取れず検査 0 件 | CLI（`doc-consistency-check.sh`） | `scripts/tests/doc-consistency-plan-packet.test.sh` AR2 | 起点の取り方が PK5 と違う、fail-open |
| AR3 PK4 の `docs/Plans.md` の `## 次の行動` の pointer の検査を外す。`--target plan PATH` の明示の検査は今のまま | Plans の節を消すと全 PR が止まる | CLI | 同 AR3 | pointer の検査が残る |
| C1 L3 の後の lane の commit が classifier で docs だけ（`workflow=false`）で `## L3` 節が byte で同じ → manual を使い回す（#217 の A・B と同じ record の道） | 締めの docs の commit で L3 が無効（K13） | unit（合成 repo） | `pr-gate.test.py` C1 | C の分岐が無い |
| C2 同じで `## L3` 節が変わる → 使い回さず、理由に「L3 節が変わった」を出す | 別の基準の PASS を使い回す（反例 9） | unit | 同 C2 | 節の比較が抜ける |
| C3 lane の commit に runtime・生成物・`unknown`・`workflow=true` の path、または通常の path から docs への rename → 使い回さない（`--no-renames`） | runtime の変更の後の L3 を使い回す | unit | 同 C3 | classifier の flag の一部を見ない、rename を docs と数える |
| C4 R4 は C でも使い回さない | R4 の承認の使い回し | unit | 同 C4 | R4 を引き継ぐ |
| RC1 `--review-stage docs`: 版の間の lane の commit が C1 と同じ条件で、`--evidence` に P3 だけと裁定した pointer があれば review の closure を機械で書く | P3 の docs の是正で review を取り直す（TD-476 (2)） | unit | 同 RC1 | 分岐が無い |
| RC2 同じ道で `workflow=true` の docs（`docs/agent-guidance/**`・`docs/DEV_WORKFLOW.md` ほか gate の文書）・packet の `## Scope`・`## AC`・`## 契約の一覧`（旧い packet は `## Acceptance Criteria`・`## Contract Ledger`）の変更・`--evidence` の欠け → 拒む | gate の文や計画を人の review なしに変える | unit | 同 RC2 | workflow の docs を通す、計画の節の比較が抜ける |
| GA1 GA の後、broad の版と今の版で packet の `## Scope` と AC の節が byte で同じ → closure を受ける | 同じ範囲で fresh broad を取り直す | unit（`validate_review`） | 同 GA1 | 比較が無い |
| GA2 どちらかが変わる、節が読めない → `FRESH_BROAD`（今のまま） | 範囲が変わったのに closure で通す | unit | 同 GA2 | 節が読めないときに closure を受ける（fail-open） |
| R2N1 `--risk R2`（packet なし）は Minimum 1、`plan_commit` null で、`--manual` を要る | R2 の道が無い | unit | 同 R2N1 | `--risk` が R0/R1 だけ |
| R2N2 packet なしの R2 で classifier が `workflow=true`・`rust=true`・`unknown=true`、または diff が active な packet を触る → 拒む（R3 の packet か `--packet` を要る） | gate・runtime の変更が R2 で通る | unit | 同 R2N2 | flag の検査が抜ける |
| CI1 Draft の run の aggregate の名が `Merge gate`（`.github/workflows/ci.yml` の `merge_gate` の name 式）、`ready_for_review` で run を作らない | 同じ head の CI が 2 回（TD-481） | CLI（`scripts/tests/ci-workflow.test.sh`） | `ci-workflow.test.sh` CI1 | name 式か trigger が残る |
| CI2 helper `ci()` は同じ head の最新の成功の run（`pull_request` の Draft を含む）で `Merge gate` が 1 つなら受ける。別の head・失敗・`Merge gate` の欠け・別の app は今のまま拒む | 古い head の CI を受ける（K5） | unit | `pr-gate.test.py` CI2 | head の照合か app の照合が抜ける |
| CI3 Ready の後の push を pre-push が拒む挙動は今のまま | Ready の後の未検証の head | CLI | `scripts/tests/pre-push.test.sh` の既存の Ready push の case | 既存の case を消す |
| RP1 `record --report FILE` は FILE の `REVIEWED_HEAD=<40hex>` の 1 行を `--reviewed-head` に使い、capture の head と違えば何も書かない | 報告と違う版の record | unit | `pr-gate.test.py` RP1 | 照合が無い |
| RP2 行が無い・2 行ある・形が違う・`--reviewed-head` と両方 → 入力の誤り（exit 2） | 曖昧な報告を受ける | unit | 同 RP2 | 先頭の 1 行だけ読む |
| LN1 `scripts/lanes.sh` は open の PR ごとに番号・branch・packet（差分が触る `docs/plans/` の dated file）・head・helper status の blocker を 1 表で出し、何も書かない（`git status --porcelain` が空のまま、PR に書込みの API を呼ばない） | handoff の lane の表の手写し | CLI（fake gh） | `scripts/tests/lanes.test.sh` LN1 | 書込みの API を呼ぶ、packet の取り方が helper と違う |
| FL1 branch の差分で生きた docs（`docs/**`、`docs/archive/**` と `docs/plans/**` を除く、`AGENTS.md`・`CLAUDE.md`）に `<path>.<md|rs|ts|tsx|py|sh>:<数>` を足すと ERROR。既にある行は ERROR にしない | 腐る引用を新しく作る（D-125） | CLI | `doc-consistency-plan-packet.test.sh` か新しい test の FL1 | 既存の行まで ERROR、足した行を見落とす |
| FL2 差分が取れない → 全 live docs を対象にせず WARN と理由（既存 231 か所を一斉に ERROR にしない）。pre-push と hosted は起点を渡す | 起点の無い local の実行で全件 ERROR | CLI | 同 FL2 | fail の向きを誤る |
| PK1N 新しい最小形の R3 packet（Risk・Plan Commit・Amendments・Goal・Scope・AC・設計正本・契約の一覧・テストの表）を受ける。R3 で契約の一覧かテストの表が無ければ ERROR。旧い packet の節（Owner Effort Budget・Contract Probe・Data Safety・Test Design Matrix の link）は在れば受ける | 新しい packet を拒む、R3 の計画の芯が抜ける | CLI | `doc-consistency-plan-packet.test.sh` PK1N | 必須の節の表を誤る |
| KEEP 既存の拒否の case が全部残り通る: base と違う helper、古い head/base の record、broad の不足、Plan 契約の変更で fresh broad、R4 を使い回さない、UI merge の道の拒否、PK5 の ancestry と不変 | 安全の境界が黙って弱まる | 回帰 | `pr-gate.test.py`・`workflow-git-checks.test.sh`・`merge-gate.test.sh` の既存の case | 既存の拒否の case を消す・skip する |

## State Lifecycle Matrix

workflow の状態（計画・review・L3・CI の証拠）の寿命を並べる。UI・DB の状態は変えない。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 計画の固定（Plan Commit） | packet 起票、`pending` | Plan Review 中 | `plan-approve.sh` が SHA を書く | GA で Amendments に足す | helper が head の packet を読み直す | 再開は open の PR → packet | — | 祖先でない SHA を拒む | 正しい SHA で再実行 | PA1〜PA3・PH1・PH2 |
| 先走りの検査 | pending の packet | branch に code の差分 | 承認の後は検査しない | — | push ごと | — | — | ERROR で push を止める | plan-approve の後に push | PH4〜PH6 |
| Final Review の本数 | Risk と classifier から導く | broad の record | Minimum を満たす | Scope・AC の変更（GA2）で fresh broad | status ごとに導き直す | — | — | 不足で blocker | broad を足す | MN1・MN2・GA1・GA2 |
| manual（L3） | `## L3` 節の有無 | L3 を頼む | PASS の record | runtime の commit・L3 節の変更 | status が確かめ直す | 同期 A/B（#217）・C | — | FAIL は直した項目を取り直す | 取り直しの record | MN3・C1〜C4 |
| review の closure | broad の後 | 是正 | closure の record | lane の runtime の commit | status | docs だけの commit は RC1 | — | RC2 で拒む | 独立の closure | RC1・RC2・GA1 |
| CI の証拠 | push | Draft の run | 同じ head の `Merge gate` success | head が動く | helper `ci()` | — | — | 失敗・欠けで blocker | rerun・dispatch | CI1〜CI3 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| Phase の判定（`phase == implementing`・Phase の 8 値） | `rg -n "phase|Phase" scripts/pr-gate.py scripts/check-workflow-git.sh scripts/doc-consistency-check.sh scripts/tests/` を実装の段で全部挙げる（起票の時点で `scripts/pr-gate.py` の `parse_packet`・`snapshot`・`nonci`・`status`、`check-workflow-git.sh` の Phase の検査を確かめた） | 全部を Plan Commit の有無に置き換える | 旧い packet の Phase 行は読み捨てる | PH1〜PH3 |
| 差分が触る packet の取り方（PK5 の起点） | `scripts/check-workflow-git.sh` の起点の取り方、`pr-gate.py` `requirements` の `present`・`leaving` | PK1・PK4・FL1・PH4 を同じ取り方に | — | AR2・PH6・FL2 |
| classifier の呼び方 | `pr-gate.py` `requirements` の `classify-changes.sh --files-from-stdin`、#217 が足す code に触れない条件の関数 | C・RC・R2N・PH4 で同じ関数を使う | `check-workflow-git.sh`（push 前）は branch の版の classifier を使う（base の版を読む API が無い。helper は base の版のまま、D-099） | C3・R2N2・PH4 |
| `Draft (no merge evidence)` の名を前提にする所 | `rg -n "Draft \(no merge evidence\)|ready_for_review" .github scripts docs` を実装の段で全部挙げる（起票の時点で `.github/workflows/ci.yml` の `merge_gate`・trigger、`docs/ci.md`、`docs/DEV_WORKFLOW.md` の Draft PR Checkpoint を確かめた） | 全部 | archive は遡らない | CI1 |
| `Owner Effort Budget`・`介入 N 回目`・`Post-Merge Closeout`・`直近の完了`・`Wave Registry` の語 | 起票の時点の `rg -lF` の結果（packet の Scope の「消す語」の表） | 生きた文書の全部 | `docs/archive/**`・`docs/decision-log.md` の過去の D の本文・`docs/research/**`（時点の調べ） | AC7 |

## Negative Paths

- missing input: `plan-approve.sh` に SHA が無い（PA2）、`--report` の file が無い・行が無い（RP2）、`--review-stage docs` に `--evidence` が無い（RC2）
- invalid input: 短い SHA・大文字の SHA（PA2）、Phase が 8 値の外の旧い packet（PH3 は受ける。評価しない）
- duplicate/ambiguous input: `REVIEWED_HEAD=` が 2 行（RP2）、Amendments の重複（PA3）、merge-base が一意でない（PH6）
- unknown reference: 祖先でない SHA（PA2）、未知の path（C3・R2N2・PH4）
- dependency missing: 起点の ref が無い（PH6・AR2・FL2）、GitHub の API の失敗（helper の今の exit 2 のまま）
- permission/write failure: `plan-approve.sh` の commit の失敗で packet の変更を残さない（PA1 の後片付け）
- dry-run side effect: `lanes.sh` と helper `status` は何も書かない（LN1）

## Boundary Checks

- threshold: Minimum の 1 と 2（MN1・MN2）、round の上限 3（文だけ）
- null/default: `Amendments: none`（PA3）、packet なしの R2 の `plan_commit` null（R2N1）
- empty/non-empty: 差分が 0 path（PH5 は通す）、`## L3` 節が空（節があれば manual。空の節は PK1N で ERROR にする）
- min/max: なし
- status/policy enum: Risk R0〜R4、`--review-stage` の choices に `docs`
- wire type: RecordV1 は変えない（`version` 1。closure の形は #217 の `{head, base, audit}` と `{head, base, sync_from}` のまま、RC1 は `sync_from` の形を使う）
- internal type: packet の field の dict
- producer/consumer: `plan-approve.sh` → packet → `check-workflow-git.sh`・helper
- round-trip token: Plan Commit の SHA（PA1 → PH2 → PK5）
- precision/range: SHA は 40 桁の小文字 hex
- cross-language parse: bash の checker と python の helper が同じ packet を読む（PK4 は helper の `parse_packet` を呼ぶ今の形を保つ、D-107）

## Compatibility Checks

- old schema/input: 走っている lane の旧い packet（PH3・MN2・MN3・MN4）、#215 の移送の PR（AR1）、#217 の record の形（RC1）
- new schema/input: 最小形の packet（PK1N・PH1・PH2）
- output order: `lanes.sh` は PR 番号の降順（LN1）
- optional field behavior: 旧い packet の担当 4 行・Branch・Owner Effort Budget は在っても無くても受ける

## Data Safety Checks

- source-derived data: 使わない
- generated outputs: 合成の repo・fake gh の state は tmpdir
- secrets: 使わない（`gh` の token は fake）
- local-only files: `.local/pr-gate/` の capture（今のまま ignored）
- synthetic sample boundaries: packet・record・PR の JSON は全部合成

## Main Wiring / Integration Checks

- helper connected to main path: fake gh の process の class で `status`・`capture`・`record --report`・`record --review-stage docs` が argv から実装に届く
- output reaches manifest/report: record の comment の PATCH の body
- effective config reaches runtime: pre-push と hosted の docs job が `check-workflow-git.sh` の PH4 と doc check の FL1 を起点つきで呼ぶ（`scripts/pre-push.sh`・`.github/workflows/ci.yml` の docs job の step）
- CLI arg reaches implementation: `plan-approve.sh --amend`、`record --report`、`--risk R2`

## Mutation-style Adequacy Questions

- If a key branch is inverted: PH4 の「pending なら止める」を反転すると PH4・PH5 の両方が red
- If a threshold comparison changes: MN2 の max を min にすると MN2 が red
- If a guard is removed: C2 の L3 節の比較、RC2 の workflow の docs の拒否、GA2 の読めない節の扱い、AR1 の削除の拒否を外すと各 test が red
- If an output field is omitted: RP1 で reviewed head を落とすと record の照合で red
- If output order changes: PA3 の Amendments の順
- If dry-run performs a side effect: LN1
- 実注入（Contract Audit の Mutation / anti-tautology）: 実装の段で Writer が上の 6 つを production 側に注入し、red を報告に残す

## Residual Test Gaps

- 文書の書き換え（AGENTS・DEV_WORKFLOW・MANUAL・template）が読み手の振舞いを変えるかは test できない。Plan Review と Final の 2 本が読む
- 「packet の節を発注の固定の問いに移しても同じだけ拾うか」は測れない（v2 §10.1 の 3）。作り直しの後の 3 lane で、問いが拾った finding の数を handoff に残す
- `lanes.sh` の表を handoff に貼る運用は repo の外（Coordinator）
