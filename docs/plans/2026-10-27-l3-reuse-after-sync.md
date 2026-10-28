# Plan Packet: 同期の後の L3 と closure の使い回し（merge-evidence MG-D13・D-144）

wave に属さない単独の lane。helper（`scripts/pr-gate.py`）の manual の使い回しと base 同期の closure の受理条件、その test、正本の文（merge-evidence・DEV_WORKFLOW・ci.md・decision-log）を変える workflow の lane。製品の runtime・CI の job・classifier は変えない。

出所: owner の決定（2026-10-27、repo 外の回答台帳 TD-474〈A と B の両方〉、TD-476〈docs だけの同期の closure を同じ条件で helper の記録に代える〉）。所感 TD-475（小さな見直しで重い手続きに縛られる今の体制はおかしい）を受け、範囲を MG-D13 とその helper・test・正本の文に絞る。手続きそのものの軽量化は本 lane の外。

規模と手法: 起票（本 commit）は packet・Matrix と正本の文（plan-first。下の「本 commit で変えた正本」）。helper と test の実装は plan-approved の後の別の run。並走の workflow の lane #204（`agent/docs-file-line-check`）と直列。順は Coordinator が決める。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票は発注 638。実装は plan-approved の後の別の run）
- Plan Reviewer: fresh Opus 5.5（fork でない）+ Codex。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Reviewer: Claude 側 1 本 + Codex。座組表どおり（R3 なので Claude 側は Fable 5〈当面、TD-410〉）
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/l3-reuse-after-sync

manual なし: helper と test と docs の変更で、Windows native で確かめる物が無い。Final Review Minimum 2: `scripts/pr-gate.py` と `docs/agent-guidance/**` を変え classifier が `workflow=true` を出す workflow gate の変更（`docs/DEV_WORKFLOW.md` Workflow State の `Final Review Minimum`）。Double Audit（Contract Audit を 2 回）。

遷移の記録:

1. kickoff → spec-check（2026-10-27、起草役）: 範囲を TD-474・TD-476 の A・B・同期の closure と、それに合わせる正本の文にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-27、起草役、同じ commit）: merge-evidence の「base同期だけでheadが変わる場合」の再利用の条件を置き換える設計が要る（下の Design Readiness）。
3. design → plan-draft（2026-10-27、起草役、同じ commit）: 設計の成果を正本へ置いた（merge-evidence MG-D13 と同節、D-144）。未解決の設計の問いは無い。
4. plan-draft → plan-gate（2026-10-28、Coordinator）: packet と Matrix は起票の commit `4d057c65` で commit 済み。`doc-consistency-check.sh --target plan` は全チェック通過。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 2（TD-474・TD-476） | 2（Ready 1・merge 1） | 2（Ready の後の base 同期の再 Ready 1・Plan Review の裁定が owner に上がる 1） | 6 = 2 + 2 + 2 |

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
merge の関門（helper の manual と review の closure の受理条件）を変える。`docs/DEV_WORKFLOW.md` Risk Tiers の R3 の「merge gate changes」。D-098 が安全の境界に挙げる「古い証拠の拒否」を、PR 差分の byte 同一から同期だけの条件の機械の確かめへ置き換える改訂で、AGENTS.md Working Rules の「安全の境界の改訂は通常の packet・PR の経路で行う」に従い、owner の決定（2026-10-27、TD-474・TD-476）で起票する。R4 にしない理由: 破壊的な操作・実データ・secret・不可逆な git 操作を伴わない。helper は read-only の git（`rev-parse`・`merge-base`・`merge-tree --write-tree`・`diff`）だけを足し、`merge-tree --write-tree` は object を書くが ref と作業 tree を変えない。

required gate の green / red: この変更で `Merge gate`（hosted の required check）の green / red は変わらない。変わるのは CI の外の helper の manual と review の closure の受理条件だけ（classifier・`.github/workflows/**`・`scripts/ci/**` を変えない）。

## Goal

Goal Invariant:

### 最小完了条件

- L3 の PASS の後に base 同期だけで head が変わった PR で、lane の差分が同じ（同期だけの条件）なら、共有の file の index の行や周りの行がずれても、同期が何回でも、owner が L3 をやり直さずに merge まで進める。取り込んだ main 側が code に触れなければ helper が自動で（A）、触れれば同期の closure 2 本と owner の 1 行の承認で（B）。
- 同期だけで code に触れない版では、独立 review の closure を回さずに helper の 1 回の record（`--review-stage sync`）で review の要件が満ち、同じ record で manual も引き継がれる。
- 使い回せないとき、helper が何も書かずに止まり、外れた理由（lane の commit・自動の merge と違う path・衝突の path・code に触れる main 側の path）と次の一手を名指す。

### 失敗定義

- lane の手（同期の merge の中の編集・衝突の手での解消・同期の後の lane の commit・main の外の branch の取込み）が入った版で、manual か closure を使い回す。
- code に触れる同期で、owner の承認なしに manual を、独立の closure なしに review を通す。
- R4 の承認を使い回す。
- 使い回せないときに manual の pass を黙って pending へ戻し、B の道を失わせる（今の closure を先に記録したときの挙動）。
- 今の正当な record（`source_head` と `reuse_approval` の組、監査の closure）を新しい helper が拒む。

### 非目的

- 手続きそのものの軽量化（closure の本数・Double Audit・Plan Review の形。Coordinator が別に案を作る）。
- classifier・CI の job・`Merge gate`・GitHub の ruleset の変更。
- 同期の自動化（helper が merge する等）、GitHub の Update branch を使える形にすること。
- stacked train の base の付け替えの後の使い回し（`docs/DEV_WORKFLOW.md` Stacked train のまま）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、L3 の後の base 同期の通常列を置く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| Draft、broad と manual（L3）が pass の record。先行 PR が docs だけを変えて merge | Coordinator が `git -c merge.directoryRenames=false merge origin/main` で同期 → push → `capture` → `record --kind review --review-stage sync --outcome pass` | 1 回の record で closure（`sync_from`）と manual（`source_head`）が新しい head に付く。owner の操作は無い | status の blocker が CI だけ | P1・P4（docs だけの同期は A） |
| 同上。先行 PR が code を変えて merge | 同期 → push → closure 2 本（座組表の Claude 側と Codex）に L3 の項目への影響も問う → owner に 1 行の承認を諮る → `capture` → `record --kind manual --reuse-from SOURCE --reuse-approval POINTER` → `capture` → `record --kind review --review-stage closure`（2 本の証跡を evidence に並べる） | owner は L3 をやり直さず、承認の 1 行だけ | closure が P1/P2 0 で、L3 の項目に影響なし | P2・P3（#197・#209 の型は B） |
| 同上。B の後にさらに docs だけの同期 | 同期 → push → `capture` → `record --kind review --review-stage sync --outcome pass` | 起点は旧 record の head（B で承認した版）なので A で引き継ぐ | 同上 | — |
| 同期の後に lane の commit がある、または衝突を手で解いた | `capture` → 何かの record | helper が何も書かずに止まり、外れた commit・path と次の一手（L3 をやり直すなら `record --kind manual --outcome pending --evidence POINTER`）を出す | L3 をやり直す | — |

## Scope

新しく書く引用は D-125・`docs/DOC_STYLE_GUIDE.md` §1 の形（path と symbol・節名・決定 ID。行番号で引かない）。owner の決定は「repo 外の回答台帳 TD-nnn」で引く。

### 予定の file

| file | 変更 | 段 |
|---|---|---|
| `docs/agent-guidance/merge-evidence.md` | 設計判断の表に MG-D13。RecordV1 の Closure に `{head, base, sync_from}` の形と説明の 1 文。「状態と非CI記録」の closure 数の段落・manual の段落・capture の段落の該当の文。「base同期だけでheadが変わる場合」の再利用の 3 段落を、同期だけの条件・code に触れない条件・manual の使い回し・review の closure・確かめ直しの 5 段落に置き換え。「Helperの境界」の CLI の文と pending へ戻す文。「実行手順」の順序の文 | 本 commit |
| `docs/DEV_WORKFLOW.md` | Workflow State の箇条の `MG-D6〜D9` の引用、Wave Operation の前文の `MG-D6` の引用を MG-D13 に。Ready の箇条の「L3 を済ませた PR を後ろへ回す順にしない…」の括弧を削除。L3（manual）の箇条（先頭で頼む既定・束ねる条件・`comm -12` の手順・防ぐ失敗の文）を 1 文の新しい規則に置き換え | 本 commit |
| `docs/ci.md` | `## Stale Green Prevention` の `MG-D6/D7` の引用を MG-D13 に | 本 commit |
| `docs/decision-log.md` | D-144 を末尾に足す。D-124 の末尾に `Superseded in part by: D-144` の行 | 本 commit |
| `scripts/pr-gate.py` | 下の H1〜H7 | 実装 |
| `scripts/tests/pr-gate.test.py` | 下の Matrix の行 | 実装 |
| `docs/plans/2026-10-27-l3-reuse-after-sync.md`・`docs/plans/test-matrices/2026-10-27-l3-reuse-after-sync.md` | 本 packet と Matrix | 本 commit |

`docs/AGENT_OPERATING_MANUAL.md` の座組表は変えない。Final Reviewer の行の「closure（base 同期を含む）の Claude 側の既定は Fable 5」は closure を誰が回すかの値で、いつ要るかは merge-evidence が持つ（MG-D13 の文が要らない場合を持ち、座組表に条件を継ぎ足さない）。`docs/Plans.md` に lane の行を足さない（D-097）。

### helper の変更（`scripts/pr-gate.py`）

- H1 `validate_record`: closure は `{head, base, audit}` か `{head, base, sync_from}` のどちらか 1 つの形（両方・どちらも無しは `invalid record fields`）。`sync_from` の形には「独立の run」の検査を当てない。manual は `source_head` だけ（A）か `source_head` と `reuse_approval` の組（B）を受け、`reuse_approval` だけは拒む。`source_head` があれば outcome は pass（今のまま）。
- H2 同期だけの条件の関数（`reuse_geometry` を置き換える。名は実装で決める）: 引数は起点の SHA・head・base。head から first parent を辿って起点に着くまでの各 commit が (a) 2 親の merge で、second parent が base の祖先（`git merge-base --is-ancestor`）、2 親の `merge-base --all` が 1 行、tree が `git -c merge.directoryRenames=false merge-tree --write-tree FIRST SECOND` の tree と同じか、違う path（`git diff --name-only`）と衝突の path が全部生成物、または (b) 1 親で、親との差分の path が全部生成物。head の second parent は base（head が起点と同じなら満たさない）。生成物の集合は current main（PR の base）の `scripts/ci/classify-changes.sh` の `generated` の case の path（`src/lib/bindings.ts`・`src/routeTree.gen.ts`・`docs/function-design/90-traceability.md`）。満たさないときは理由（commit の SHA と path）を持つ `GateError`。
- H3 code に触れない条件の関数: 起点と base の `merge-base`（一意でなければ満たさない）から base までの `git diff --name-only --no-renames` の path を、`requirements` が使うのと同じ current main 側の classifier の呼び方（`--files-from-stdin`）に渡し、`rust`・`frontend`・`env`・`unknown` が全部 false。満たさないときは、classifier が code に分ける path を名指す（path ごとに classifier に渡して決める）。`requirements` の classifier の呼出しは 1 つの関数にまとめて両方から使う。
- H4 `record` の版が変わった分岐（`current` が偽）: 旧 record の manual が pass で manual が必須なら、起点を旧 record の head として H2 と H3 を当てる。満たせば manual を `{outcome: pass, evidence: 旧 evidence, source_head: 旧 manual の source_head か旧 head, reuse_approval: 旧にあればそのまま}` で引き継ぐ。満たさず、今回の `--kind` が manual でなければ、何も書かずに exit 1 で止まり、H2・H3 の理由と次の一手（B の command と要るもの、または `record --kind manual --outcome pending --evidence POINTER`）を出す。R4 は今のまま pending。head が旧 record の head と同じで base だけが変わったときは今のまま（manual を pending に戻す。同期だけの条件は head が変わることを前提にする）。
- H5 `--review-stage sync`（argparse の choices に足す）: `--kind review --outcome pass` だけを受け、`--pass-model`・`--run-ref`・`--evidence`・`--reviewed-head`・`--pr-reviews` を受けたら入力の誤り（exit 2）。版が変わったときだけ（`current` が真なら止める）。旧 record の review が pass で、broad の plan_commit と amendments が今の packet と同じ。起点は旧 record の closure が監査の形ならその head、`sync_from` の形ならその `sync_from`、closure が無ければ broad の head。H2 と H3 を満たせば `review = {outcome: pass, broad: 旧 broad, closure: {head, base, sync_from: 起点}}`。満たさなければ何も書かずに止まり、理由と「監査の closure を要る」を出す。
- H6 manual の明示の使い回し（`--reuse-from`。`--reuse-approval` があれば B、無ければ A を明示で求める形で、review の要らない R0/R1 の manual の lane の同期で使う）: `--reuse-from` は旧 record の manual の `source_head`（あれば）か旧 head と一致、evidence は旧 manual と一致、旧 manual は pass。起点を旧 record の head として H2 を当て、H3 は `--reuse-approval` が無いときだけ当てる。書く manual は `source_head` と（B なら）`reuse_approval`。今の「`--reuse-from` と `--reuse-approval` は両方か両方無し」の入力の検査は「`--reuse-approval` は `--reuse-from` と組でだけ」に変える。旧 manual が使い回しでも受ける（今の「使い回しの使い回しは拒む」を外す）。
- H7 `nonci`（status・ready・merge）: manual に `source_head` があれば H2 を `source_head` から現在の head へ当て直し、`reuse_approval` が無ければ H3 も当てる。closure が `sync_from` の形なら H2 と H3 を `sync_from` から当て直す。`validate_review` は `sync_from` の形の closure を現在の head/base の closure として受ける（broad の必要数と Plan 契約の検査は今のまま）。

呼び出し側・隣接の確認（`rg -n "closure|source_head|reuse_|review_stage|nonci\(|validate_review\(|reuse_geometry" scripts/pr-gate.py` と test 側の同様の `rg` で確かめた）:

- 作る所: `Gate.record`（closure の dict を作る review の分岐、manual の分岐、版が変わった分岐の record の初期値）。
- 読む所: `validate_record`、`Gate.validate_review`、`Gate.nonci`、`Gate.record` の closure の分岐（旧 broad の検査）。
- test の fixture と呼び方: `scripts/tests/pr-gate.test.py` の `good_record`・`args`（`reuse_from`・`reuse_approval` を持つ）、`Records` の mutant（`manual.source_head` だけの record を拒む mutant は H1 で A の形として受けるので、`reuse_approval` だけの mutant に置き換える）、`RecordLifecycle.exercise`（`reuse_geometry` を patch する。H2 の関数名に合わせる）と `test_reuse_then_closure_order`・`test_source_record_missing_changed_or_not_pass`・`test_closure_first_loses_old_manual_and_cannot_restore_cache`（H4 で「closure を先に記録すると止まる」に変わる）、`GitReuse.test_exact_merge_and_changed_patch`（H2 の合成の repo の test に置き換える）、fake gh の process の class の closure の記録（`review('closure','closure',…)` の呼び方。closure の監査の形は変えないのでそのまま通る）。
- `scripts/tests/merge-gate.test.sh` は helper を呼ばない（`rg -n 'pr-gate|manual' scripts/tests/merge-gate.test.sh` が 0 件）。`scripts/doc-consistency-check.sh` の PK4 と `scripts/tests/doc-consistency-plan-packet.test.sh` は helper の `parse_packet`・`workflow_fields` だけを使い、本 lane はそれらを変えない。

### 他の lane との所有

起票の時点（起点 `bbea3314`）の open の PR 12 本の変更 file（`gh pr diff <N> --name-only`）と本 lane の予定 path を突き合わせた。重なるのは次の 3 つ。

| file | 相手 | 相手の所有 | 本 lane の所有 |
|---|---|---|---|
| `docs/agent-guidance/merge-evidence.md` | #204 | `## 実行手順` の R2+ の例の段落の review packet の引用 | 設計判断の表の MG-D13 の行、`## 状態と非CI記録` の該当の文、`## base同期だけでheadが変わる場合`、`## Helperの境界` の該当の文、`## 実行手順` の「Double Auditは」の段落の順序の文 |
| `docs/ci.md` | #204 | `### Final Trigger Selection` と `## Local Commands` | `## Stale Green Prevention` の 1 文 |
| `docs/decision-log.md` | #194・#201・#209・#211・#212・#216 | 末尾への D の追記（D-139〜D-143 ほか） | 末尾の D-144 と D-124 の末尾の 1 行。末尾の追記は merge 順で両方を残す |

`scripts/pr-gate.py`・`scripts/tests/pr-gate.test.py`・`docs/DEV_WORKFLOW.md` はどの open の PR も触らない。helper・検査・gate を変える #204 とは直列（順は Coordinator が決める）。

### この変更で不要になる記述・条件（D-127）

- merge-evidence の PR 差分の byte 比較の条件（`git diff --binary --full-index …` の比較）、単一の merge の条件、「再利用した manual の再利用は拒む」、manual → fresh capture → closure の記録の順序（A では順序が要らず、B は「新しい head での最初の record」の 1 文に縮む）。
- DEV_WORKFLOW Wave Operation の L3 を train の先頭で頼む既定、束ねる条件と `comm -12` の手順、L3 済みの PR を後ろへ回さない句、共有の path を closeout へ寄せる句（D-124 の (1)〜(4)。L3 の後の同期で L3 が無効にならないので要らない）。
- DEV_WORKFLOW・ci.md の `MG-D6〜D9`・`MG-D6`・`MG-D6/D7` の引用（再利用の規則はどの MG-D の行にも無く、引用がずれていた。MG-D13 に集めた）。
- helper の `reuse_geometry` と、`nonci` の「`head^1` が source_head・2 親・`head^2` が base」の 3 つの検査（H2・H7 に置き換わる）。
- 残すもの: R4 の承認を使い回さない文（今も正しい）。同期の後の CI。B と code に触れる同期の監査の closure。

## Non-scope

- 座組表（`docs/AGENT_OPERATING_MANUAL.md` `## 座組`）の値と closure の本数。
- classifier（`scripts/ci/classify-changes.sh`）の分類の変更。tests だけの main 側の変更（`src/**/*.test.ts*`）も classifier が `frontend=true` に分けるので code として扱う（下の Contract Audit の既知の限界）。
- 同期だけの条件を CI の job にすること。
- Coordinator の運用の checklist（repo の外）の書換え（Coordinator が本 lane の merge の後に合わせる）。
- 他の active な packet の D-124 の引用（`docs/plans/2026-10-23-stocktake-count-runtime-b2.md` の 1 文。その lane の closeout で archive へ移り、遡って直さない）。

## Acceptance Criteria

- AC1（同期だけの条件）: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/tests/pr-gate.test.py` が exit 0 で、Matrix の G1〜G12 の test が合成の git repo で、(a) 2 回の同期の自動の merge・生成物だけが衝突し再生成した merge・生成物だけの再生成の commit を受け、(b) 同期の後の lane の commit・生成物の外の衝突を手で解いた merge・自動の merge と違う tree（merge の中の編集）・main の外の branch を second parent に持つ merge・head の second parent が base でない版・merge-base が一意でない merge を拒み、拒む理由に commit の SHA と path を含む。baseline（起点 `bbea3314`）: 同じ command が exit 0、末尾 `OK`（今の test は byte 同一の 1 回の merge だけを受ける）。
- AC2（code に触れない条件）: 同じ command で Matrix の C1〜C5 が、main 側が docs・packet・`docs/function-design/90-traceability.md` だけなら満たし、`src-tauri/**`・`src/lib/bindings.ts`・`package.json`・`scripts/pr-gate.py`・未知の path のどれかがあれば満たさず、その path を名指す。
- AC3（A と B と止める形）: 同じ command で Matrix の R1〜R10 が、docs だけの同期で manual を引き継ぎ（どの kind の record でも）、code に触れる同期で manual 以外の record を何も書かずに止めて理由と次の一手（`--reuse-approval` と `--outcome pending` の 2 つの command）を出し、B を受け、B の後の docs だけの同期で A を受け、R4 を引き継がないことを確かめる。
- AC4（同期の closure）: 同じ command で Matrix の S1〜S7 が、`--review-stage sync` で `sync_from` の closure を書き、code に触れる同期・旧 review が pass でない・版が変わらない・余計な引数・Plan 契約の変更を拒むことを確かめる。
- AC5（記録の形と確かめ直し）: 同じ command で Matrix の V1〜V6 が、今の形の record（`source_head` と `reuse_approval` の組・監査の closure）を新しい `validate_record` が受け、`reuse_approval` だけ・closure の 2 つの形の混在を拒み、`nonci` が `source_head`・`sync_from` から確かめ直すことを確かめる。
- AC6（文書）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-27-l3-reuse-after-sync.md` が ERROR 0。`rg -n 'byte比較で同一|MG-D6〜D9|MG-D6/D7|MG-D6の単一merge|先頭で頼むのが既定' docs --glob '!docs/archive/**' --glob '!docs/decision-log.md' --glob '!docs/plans/**'` が 0 件（本 commit で満たす）。
- AC7（workflow の回帰）: `bash scripts/check-workflow-git.sh` が exit 0、Draft の hosted の `Draft (no merge evidence)` が緑（classifier は `workflow=true` と `pr-gate.py` で full を出す）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/agent-guidance/merge-evidence.md` の `## 設計判断`（MG-D13）・`## 状態と非CI記録`（RecordV1）・`## base同期だけでheadが変わる場合`・`## Helperの境界`・`## 実行手順`。`docs/DEV_WORKFLOW.md` の `## Workflow State`・`## Wave Operation`。`docs/decision-log.md` の D-098・D-124・D-144。
- 必要な設計成果物: workflow gate change → `docs/decision-log.md`（D-144）と merge-evidence の MG-D13 の節 = updated in this PR（本 commit）。
- plan にしかない durable な判断の昇格先: 同期だけの条件・code に触れない条件・A・B・同期の closure・止める形は全部 merge-evidence と D-144 に置いた。packet にだけある判断は helper の関数の分け方（H1〜H7）で、実装の段取り。
- 前提・制約と延期した design gap: classifier の分類に頼る（tests だけの main 側の変更も code として B に回る）。GitHub の Update branch の merge が `merge-tree` と違えば外れる（安全側）。どちらも D-144 の Guarantee range に書いた。
- 絶対保証の自己点検: 「lane の手が入った版で使い回さない」の例外と escape hatch は、(1) 生成物の違い（hosted の drift 検査が source との一致を強制。`Merge gate` が要る）、(2) `merge-tree` の rename 検出の差（`merge.directoryRenames=false` を同期と同じにする。違えば外れる側）、(3) record を helper の外で手で書く経路（今と同じ信頼の形。owner の account だけが書け、`nonci` が確かめ直す）。
- 判定: ready。

## Registration / Generation Obligations

該当なし（Tauri command・function-design・REQ・route・画面を足さない。`docs/agent-guidance/merge-evidence.md` は既存の文書で、目次・索引の登録は変わらない）。

## Impact Review Lenses

not applicable: 実機・外部の tool・POS・CSV・operator の発見から始まる作業でない。owner の決定（TD-474・TD-476）と PR #197・#209 の git の履歴から始まり、git の挙動は下の Contract Probe で確かめた。

## Boundary / Wire Contract

- producer: `scripts/pr-gate.py` の `record`（専用 PR comment の RecordV1 の JSON）。
- consumer: 同じ helper の `server_record`・`validate_record`・`nonci`・`record`（PR の base の版の helper だけが判定する。D-099）。
- wire type: `review.closure` は `{head, base, audit}` か `{head, base, sync_from}`。`manual` は `source_head?` と `reuse_approval?`（`reuse_approval` は `source_head` があるときだけ）。`version` は 1 のまま。
- internal type: 同じ dict。
- precision/range: SHA は 40 桁の小文字 hex（`sha`）。pointer は空でない 1 行（`pointer`）。
- round-trip path: `record` が書いた JSON を `server_record` が `decode_json`（重複 key を拒む）→ `validate_record` で読み戻し、`record read-back mismatch` で照合する（今のまま）。
- invalid input: closure の 2 つの形の混在・どちらでもない形、`reuse_approval` だけの manual は `invalid record fields` / `incomplete manual reuse`（exit 2 / 1 は実装で今の分け方に合わせる）。
- compatibility: 今の record（監査の closure、`source_head` と `reuse_approval` の組）はそのまま受ける。新しい形の record を古い helper（本 lane の merge の前の main の版）は `invalid record fields` で拒むが、helper は PR の base の版だけが動き（D-099）、本 lane の merge の後の base でしか新しい形を書かないので混ざらない。

## Test Plan

Test Design Matrix: [test-matrices/2026-10-27-l3-reuse-after-sync.md](test-matrices/2026-10-27-l3-reuse-after-sync.md)

- targeted tests: `PYTHONDONTWRITEBYTECODE=1 python3 scripts/tests/pr-gate.test.py`（Matrix の全行）。
- negative tests: Matrix の G6〜G12・C2〜C5・R3〜R5・S2〜S7・V3〜V4。
- compatibility checks: V1・V2（今の形の record）。
- data safety checks: 合成の git repo を tmpdir に作り、実の PR・store のデータを使わない。fake gh は今の process の fake を使う。
- main wiring/integration checks: fake gh の process の class で `record --review-stage sync` が argv から実装に届き、comment の PATCH の body に `sync_from` が載ること（S1 の integration の行）。
- workflow: `bash scripts/check-workflow-git.sh`、`bash scripts/doc-consistency-check.sh`、`--target plan`。Draft の hosted（full）。

## Review Focus

- 同期だけの条件が lane の手を全部拒むか（Matrix の G の反例。特に main の外の branch を second parent に持つ merge と、生成物の例外の範囲）。
- code に触れない条件の path の集合が classifier と食い違わないか（`unknown` の扱い、rename の両側）。
- H4 の止める形が今の記録の順序（B・closure）と矛盾せず、B の道を失わせないか。
- `sync_from` の closure が独立 review の要件（broad の必要数・Plan 契約の変更で fresh broad）を緩めていないか。
- この変更で不要になる記述・条件は他に無いか（D-127）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| MG-D13 同期だけの条件 | merge-evidence `## base同期だけでheadが変わる場合` | H2 | G1〜G12 | 非対象 |
| MG-D13 code に触れない条件 | 同上 | H3 | C1〜C5 | 非対象 |
| MG-D13 manual の A | 同上、`## Helperの境界` | H4 | R1・R2・R6・R7 | 非対象 |
| MG-D13 manual の B | 同上 | H6 | R5・R8・R9 | 非対象 |
| MG-D13 止める形（D-127） | 同上 | H4・H5 | R3・R4・S2 | 非対象 |
| MG-D13 同期の closure | 同上、`## 状態と非CI記録` | H5 | S1〜S7 | 非対象 |
| RecordV1 の Closure と manual の形 | `## 状態と非CI記録` | H1 | V1〜V4 | 非対象 |
| 確かめ直し | `## base同期だけでheadが変わる場合` の最後の段落 | H7 | V5・V6 | 非対象 |
| R4 を使い回さない | 同上 | H4（R4 は pending のまま） | R10 | 非対象 |
| closure の数と broad の保持（隣接） | `## 状態と非CI記録` | 変えない（H7 の `validate_review` は broad の検査を保つ） | `scripts/tests/pr-gate.test.py` の `RecordLifecycle` の Plan 契約の変更と broad の欠けの既存の case と S6 | 非対象 |
| helper は base の版だけが判定する（隣接、D-099） | `## CIとmain保護` | 変えない | 既存 | 非対象 |
| capture の一致と記録の前後の照合（隣接） | `## 状態と非CI記録` | 変えない | `RecordLifecycle` の capture の変更の既存の case | 非対象 |
| L3 を頼む時点（D-124 の置換え） | DEV_WORKFLOW `## Wave Operation` | 文だけ（本 commit） | AC6 | 非対象 |

## Contract Audit（起票の時点の一巡）

新しく足す契約の文（MG-D13 の 5 段落、RecordV1 の Closure の形、Helper の境界の CLI の文、DEV_WORKFLOW の L3 の箇条、D-144）を境界の 4 観点で一巡した。

- 安全な整数の範囲: 新しい数は無い（同期の回数に上限を置かず、first parent を起点まで辿る。起点に着かずに root か 1 親の lane の commit に当たれば止まるので、辿る長さは履歴の長さで抑えられる）。→ 不足なし。
- 0 の表示: main 側の変更の path が 0 件（起点の後に main が進まない同期は無い。head の second parent が base で、起点と同じ head は満たさない）。code の path が 0 件なら満たす。生成物の違いが 0 件の merge は tree の一致と同じ扱い。→ 正本の不足は「head が起点と同じ」の扱いで、H2 に「満たさない」と書いた（版が変わらない record は今の `current` の分岐で、使い回しを当てない）。
- 失敗の時点と順序: H4 の止めは「何も書かずに」で、comment の PATCH の前（今の `validate_record` と `same_pr` の照合の前）に置く。B は新しい head での最初の record、A は順序が要らない。H5 は版が変わった最初の record でだけ。判定の git が失敗（`command failed`）したら exit 2 で止まり、満たした扱いにしない（判定不能は満たさない、MG-D13）。→ 正本の不足は「判定不能」で、merge-evidence の同期だけの条件の段落に書いた。
- 単位や種類の混在: 起点が 3 種（manual は旧 record の head・確かめ直しは `source_head`、closure は最後の監査の版）。B の承認の後の A は、記録の時点では旧 record の head から当て、確かめ直しでは `reuse_approval` があれば code に触れない条件を当てない（承認が code の取込みを覆っている）。closure の `sync_from` は最後の監査の版で、`sync_from` の連鎖でも同じ値を引き継ぐ。→ 正本の不足は確かめ直しの起点で、merge-evidence の最後の段落に書いた。

既知の限界（受け入れる）: classifier の `frontend=true` に tests だけの main 側の変更も入るので、それは B に回る。`.github/workflows/**` など CI の実行 code も code として B に回る。

## Contract Probe

- `git merge-tree --write-tree` が使えること: `git --version` → `git version 2.56.0`（helper は owner の WSL の git で動く）。
- PR #209 の 2 回の同期の merge は自動の merge を再現する: `git -c merge.directoryRenames=false merge-tree --write-tree a4a110e1^1 a4a110e1^2` → `ea11e797…`、`git rev-parse a4a110e1^{tree}` → `ea11e797…`（一致）。`c4737fa2` も `041e4d48…` で一致（full SHA は `git rev-parse` で引ける）。
- PR #197 の同期の merge は生成物だけが違う: `git -c merge.directoryRenames=false merge-tree --write-tree 3c7e1413^1 3c7e1413^2` は exit 1、衝突は `docs/function-design/90-traceability.md` だけ。`git diff --name-only <merge-tree の tree> 3c7e1413^{tree}` → `docs/function-design/90-traceability.md` だけ。
- 今の byte 比較は #197 で外れる: `git diff --binary --full-index --no-ext-diff --no-textconv 3573dc67...256c904e -- | sha256sum` → `dae6b528…`、`… a2365759...3c7e1413 -- | sha256sum` → `b5476485…`（違う）。
- code に触れない条件の分け方: #214 の同期の main 側（`git diff --name-only --no-renames a2365759 bbea3314 --` の 7 path、docs だけ）を `bash scripts/ci/classify-changes.sh --files-from-stdin` に渡すと `rust=false`・`frontend=false`・`env=false`・`unknown=false`（A）。#193 の同期の main 側（`3573dc67` から `a2365759`）は `src-tauri/**`・`src/**`・`src/lib/bindings.ts` を含む（B）。
- `src/routeTree.gen.ts` は tracked でない（`.gitignore` にある）ので、生成物の例外で効くのは `src/lib/bindings.ts` と `docs/function-design/90-traceability.md`。どちらも hosted の `rust_drift` の job が再生成と差分で確かめる（`.github/workflows/ci.yml` の `bindings.ts drift check` と traceability の step）。

## Data Safety

- commit しないもの: 実の PR の record の中身・owner の承認の原文・店のデータ。
- local だけ: `.local/pr-gate/` の capture（今のまま ignored）。
- 合成だけ: test の git repo（tmpdir）と fake gh の state。

## 後続

- Coordinator の運用の checklist（repo の外）の base 同期と Ready・merge の手順を MG-D13 に合わせる（Coordinator）。
- base だけが変わり head が同じ版の manual の扱い（今のまま pending に戻す。起きる頻度を見て、要れば別の lane）。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。
