# Test Design Matrix: helper と検査の守りを揃える

Packet: [2026-10-05-gate-record-guards](../2026-10-05-gate-record-guards.md)。設計の正本は `docs/decision-log.md` D-107、`docs/agent-guidance/merge-evidence.md`、message の literal は packet の Boundary / Wire Contract。

## Risk

Risk: R3

## Contracts Under Test

- D-107 (1) PK4 は helper の `parse_packet` の判定で Workflow State を拒む（S4）
- D-107 (2) PK5 は現在の Plan Commit・Amendments の SHA を 40 桁だけ受理し、重複を拒み、登録済みの列の不変を保つ（S3）
- D-107 (3) status は Plan 契約の変化を head/base の古さより先に言い、closure の record の拒否も要る review を言う（S1）
- D-107 (4) review の record は `--pr-reviews` が reviewed head の本文のある PR review の数と一致しないと何も書かない（S2）
- D-107 (5) 自己照合の停止 message が完全な command を示す（S5）

## Failure Modes

- PK4・PK5 が helper の拒む値（短縮・41 桁・大文字の SHA、末尾の空白・タブ・注記、重複、節が 2 つ）を通す
- PK4・PK5 が helper の受理する packet を拒む（今の active packet・既定の fixture）
- 書式の照合を足したことで、登録済みの Amendments の prefix の照合が走らなくなる
- status が stale だけを出し続ける、closure の拒否が要る review を言わない
- 本文が空の review・別の head の review を数える、過大な申告を通す、不一致でも comment を書く、照合が reviewed head の照合より前に走る
- 復帰 command が `…` のまま、または quote が崩れて元の引数を復元しない

## Test Matrix

修正前に red になることを、各行の Would fail if の「今の code」で示す。test は既存の file に足す（新しい file を作らない）。oracle の literal は packet の Boundary / Wire Contract から写し、helper の code から写さない。

| ID | Contract | Failure Mode | Test Type | Test Name（file） | Would fail if... |
|---|---|---|---|---|---|
| T1-1 | D-107 (3) | status が stale を先に出す | unit | `Records.test_plan_contract_change_reported_before_stale`（`scripts/tests/pr-gate.test.py`） | `nonci` に、broad の amendments が要件と違い head も古い record を渡して `FRESH_BROAD` の全文で `assertRaisesRegex`。今の code は `stale head/base in workflow record` で red |
| T1-2 | D-107 (3) | CLI の status の blockers に出ない | CLI | `ReviewedHead.test_status_after_amendment_names_fresh_broad`（同） | broad を record した後に packet の Amendments を足して head を進め、`status --packet` の blockers に `FRESH_BROAD` が入り `stale head/base in workflow record` が入らない。今の code は stale で red |
| T1-3 | D-107 (3) | closure の拒否が要る review を言わない | CLI | `ReviewedHead.test_closure_after_amendment_says_fresh_broad`（同） | T1-2 の状態で closure を record し exit 1・`FRESH_BROAD`・comment 不変。今の code は `server broad required for closure` だけで red |
| T1-4 | MG-D8（判定不変）・D-107 (3) | 契約が同じで head だけ古いときに文が変わる、broad が無い closure の文 | unit / CLI | `Records.test_stale_without_contract_change_keeps_stale`、`RecordLifecycle.test_closure_without_server_broad_names_next_step`（同） | 契約が同じなら `stale head/base in workflow record` のまま（新しい順が判定を変えていない）。server に broad が無い closure は `SERVER_BROAD` の全文。今の code は後者が `server broad required for closure` の短文で red |
| T2-1 | D-107 (4) | 過少の申告で書く | CLI | `ReviewedHead.test_pr_reviews_undercount_rejected`（同） | reviewed head に本文のある review 2 件（id・submitted_at が別）を置き、`--pr-reviews 1` で exit 1、両方の `id=`・`submitted_at=` と数が message にあり、comment 不変・POST/PATCH の call 無し。今の code は argparse が引数を知らず exit 2 で red |
| T2-2 | D-107 (4) | 一致しても通らない | CLI | `ReviewedHead.test_pr_reviews_match_records`（同） | 同じ置き方で `--pr-reviews 2` が exit 0 で record。今の code は exit 2 で red |
| T2-3 | D-107 (4) | 本文が空・空白だけ・`null`、別の head の review を数える | CLI | `ReviewedHead.test_pr_reviews_count_only_body_on_reviewed_head`（同） | 本文あり 1 件 + 本文が空・空白だけ・`null` の各 1 件 + 別の head の本文あり 1 件で、`--pr-reviews 1` が通り `2` が拒まれる。今の code は exit 2 で red |
| T2-4 | D-107 (4) | 過大の申告・closure での照合漏れ | CLI | `ReviewedHead.test_pr_reviews_overcount_and_closure_rejected`（同） | 本文あり 0 件で `--pr-reviews 1` が exit 1。closure（`broad_then_push` の後、新しい head に本文あり 1 件）で `--pr-reviews 0` が exit 1、`1` が通る。今の code は exit 2 で red |
| T2-5 | D-107 (4) | 欠落・負・取得失敗で書く | CLI | `ReviewedHead.test_pr_reviews_missing_negative_or_unavailable`（同） | 欠落と `-1` は exit 2、`http_error_path='/reviews'` は exit 2、どれも comment 不変。今の code は欠落が通る（exit 0）ので red |
| T2-6 | D-099 D8・D-107 (4) | 数える照合が reviewed head の照合より前に走る | CLI | `ReviewedHead.test_reviewed_head_checked_before_pr_reviews`（同） | `--reviewed-head` が違い `--pr-reviews` も違うとき、文が `reviewed head differs from capture head`（先に reviewed head を照合）。fake gh の call に `/reviews` が無い。今の code は exit 2 で red |
| T2-7 | D-107 (4) | 未提出の review の `submitted_at` の欠落で exit 2 になり識別情報が出ない | CLI | `ReviewedHead.test_pr_reviews_pending_review_listed`（同） | reviewed head に提出済みの本文あり 1 件と、`submitted_at` の property が無い本文ありの PENDING 1 件を置き、`--pr-reviews 1` で exit 1、両方の `id=` と `submitted_at=not-submitted` が message にあり、comment 不変・POST/PATCH の call 無し。`r['submitted_at']` で引くと KeyError で exit 2 になり red。今の code は exit 2（引数を知らない）で red |
| T2-8 | D-107 (4) | 先頭 page だけを数える | CLI | `ReviewedHead.test_pr_reviews_counted_across_pages`（同） | fake gh の reviews を 2 page（page 1 = 本文あり 1 + 本文が空 99、page 2 = 本文あり 1）で返し、`--pr-reviews 1` は exit 1・comment 不変、`--pr-reviews 2` は exit 0 で record。先頭 page だけを数えると red。今の code は exit 2 で red |
| T3-1 | D-107 (2) | 8 桁の Amendments を通す | regression | `PK5-SHA40: short Amendments`（`scripts/tests/workflow-git-checks.test.sh`） | 合成 repo で Amendments を 8 桁で commit し、exit≠0 と `40 桁の小文字 hex の full SHA ではありません`。今の code は exit 0（P3）で red |
| T3-2 | D-107 (2) | 41 桁・大文字・hex 以外の token を通す | regression | `PK5-SHA40: malformed Amendments token`（同） | 41 桁（full + `0`）・大文字の full・`abc1234,` の各 case で ERROR。今の code は `{7,40}` の部分一致で 41 桁と大文字を通すので red |
| T3-3 | D-107 (2) | 重複を通す | regression | `PK5-SHA40: duplicate Amendments`（同） | 同じ full SHA を 2 回で `重複する SHA`。今の code は exit 0 で red |
| T3-4 | D-107 (2) | 短縮の Plan Commit を通す | regression | `PK5-SHA40: short Plan Commit`（同） | 初回の確定値を 8 桁で commit し、exit≠0 と Plan Commit の 40 桁の文。今の code は `git rev-parse` で解決して exit 0 で red |
| T3-5 | D-107 (2)（受理側） | 正当な形を拒む | regression | 既存 `PK5: Amendments 追記型の正例`・`MG-D5 / F1`（同、`:180-214`） | 40 桁の 1 件・2 件、区切りの空白・カンマの変化（`:208-212`）が今までどおり exit 0。書式の照合が過剰なら red |
| T3-6 | MG-D5 | 書式の照合で prefix の照合が消える | regression | 既存 `for variant in reorder replacement removal spelling`（同、`:216-232`） | spelling（12 桁）の case で `Amendments が削除・変更されています` が出続け、`祖先ではありません` が出ない（既存の assertion を弱めない）。書式の ERROR で `return` すると red |
| T4-1 | D-107 (1) | 末尾の空白・タブを通す | regression | `PK4-HELPER: trailing blank`（`scripts/tests/doc-consistency-plan-packet.test.sh`） | Phase・Risk・Amendments・Final Review Minimum・Human Gate・Evidence Mode の値の末尾に空白、Human Gate の末尾にタブ、の各 case で ERROR `helper（parse_packet）が拒否`。今の code は exit 0（P4）で red |
| T4-2 | D-107 (1) | enum の後ろの注記を通す | regression | `PK4-HELPER: trailing note`（同） | `Phase: implementing（注記）`・`Risk: R3（注記）` で ERROR。今の code は先頭 token の切り出しで通すので red |
| T4-3 | D-107 (1) | Amendments の書式・重複、Human Gate の重複を通す | regression | `PK4-HELPER: amendments and gate duplicates`（同） | Amendments が 8 桁・同じ full SHA の 2 回・`Human Gate: ready,merge,ready` の各 case で ERROR。今の code は Amendments を見ず、Human Gate の regex は重複を通すので red |
| T4-4 | D-107 (1)・D-102 (3) 部分改訂 | 節が 2 つを通す、重複の literal が変わる | regression | `PK4-HELPER: ambiguous section`（同）、既存 `PK4-DUP`（同、`:1224` 以下） | `## Workflow State` を 2 つ置いた packet で ERROR（`missing/ambiguous` を含む）。既存の PK4-DUP の literal の assertion がそのまま通る。今の code は節 2 つを通すので red |
| T4-5 | D-107 (1)（受理側） | helper が受理する形を拒む | regression | `PK4-HELPER: accepted shapes`（同）、既存の正例（T-P1・T-P10 ほか） | 既定の fixture（旧・新 template）、Coordinator 等の役割の値の末尾の空白（helper は受理）、40 桁の Amendments 2 件で ERROR 0。過剰なら red |
| T4-6 | D-107 Compatibility | archive に遡及する | regression | 既存 `13.`・`25.`・`PR4-F12`（同） | archive の明示 path は PK4 の新しい検査も skip。helper を呼ぶと red |
| T4-7 | D-107 (1) fail-closed | helper が無いと通る | regression | 既存 `PK4-DUP-7`（同、`:1258-1264`）。`parse_packet` を重複の検査と別の呼び出しにするなら、同じ形の case（`PK4-HELPER: helper unavailable`）を足す | fixture の repo から `scripts/pr-gate.py` を消すと ERROR（既存の literal `の Workflow State の重複の検査に python3 と scripts/pr-gate.py が必要です`、別の呼び出しならその文）。呼び出しの失敗を無視すると red（M12。今の code でも通る guard の行） |
| T5-1 | D-107 (5) | `…` が残る、quote が崩れる | CLI | `HelperVersion.test_mismatch_command_is_complete`（`scripts/tests/pr-gate.test.py`） | base と違う helper で、空白と `;` を含む `--evidence` を付けた record を走らせ、message に `…` が無く、`pr-gate-base.py" ` の後ろを `shlex.split` した列が元の引数の列と一致する。今の code は `…` で red |
| T5-2 | D-099 D2 | 文の変更で既存の自己照合が崩れる | CLI | 既存 `HelperVersion.test_mismatch_blocks_every_action`（同、`:571-585`） | 5 action とも exit 1、何も書かず、`helper differs from base` と `git show <base>:scripts/pr-gate.py` を含む（不変） |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 専用 record の review（S1・S2） | record 無し | broad の 1 本目を pending で record | Minimum 本の broad で pass | Gated Amendment で Plan 契約が変わる → status が `FRESH_BROAD` | fresh capture | 同じ head の次の audit の record（`--pr-reviews` は同じ数） | — | `--pr-reviews` の不一致・取得失敗で何も書かない | 数を直して同じ capture で再実行（capture/server が変わっていれば既存の `fresh capture required`） | T1-1〜T1-4、T2-1〜T2-8 |
| packet の Workflow State（S3・S4） | plan-draft | — | plan-approved で Plan Commit を 40 桁で記録 | Gated Amendment の登録 | — | — | — | 短縮・末尾の空白で PK4・PK5 が ERROR（push の前） | その commit を直す（未 push） | T3-1〜T3-6、T4-1〜T4-7 |

capture/server の競合、stale head/base、broad/closure、manual/R4、hosted gate は既存の test（`RecordLifecycle`・`Records`・`CLI`）が持ち、本 lane はその判定を変えない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| helper の判定を checker が `python3` で呼ぶ（D-102 (3)） | `scripts/doc-consistency-check.sh:1270-1290`（重複） | PK4 の `parse_packet`（S4） | `check-workflow-git.sh` の Phase・Evidence Mode（`:162-173`）: PK4 が同じ段階で同じ packet を判定する（packet の Non-scope） | T4-1〜T4-7 |
| SHA の書式の照合（helper `SHA`、`scripts/pr-gate.py:19`） | PK4 の Plan Commit（`scripts/doc-consistency-check.sh:1317-1323`）、PK5 の Plan Commit（`scripts/check-workflow-git.sh:52-60`）・Amendments（`:71-90`）・履歴（`:110-119`） | PK5 の現在値（S3）、PK4（S4 が helper 経由で Amendments も） | PK5 の履歴の読み方: 40 桁だけにすると登録済みの短縮の綴りの置換を許す（D-107 Alternatives） | T3-1〜T3-6 |
| 停止の message に次の一手を書く（D-099 D8 の `reviewed head differs … record the broad before pushing a fix`） | `scripts/pr-gate.py` の `require` の文（`:217`・`:320`・`:343`・`:455`・`:464`） | `:217`・`:320`・`:343` の前・`:464`（S1・S5） | 他の文: 今回の詰まりの経路でない（D-098 (1)、言える失敗だけを直す） | T1-x、T5-1 |

## Negative Paths

- missing input: `--pr-reviews` の欠落（T2-5）、未提出の review の `submitted_at` の欠落（T2-7）、節の欠落（既存の欠落の ERROR、helper を呼ばない）
- invalid input: 負の `--pr-reviews`（T2-5）、短縮・41 桁・大文字の SHA（T3-1・T3-2・T4-3）、末尾の空白・注記（T4-1・T4-2）
- duplicate/ambiguous input: Amendments の重複（T3-3・T4-3）、Human Gate の重複（T4-3）、節が 2 つ（T4-4）、同じ head の review が 2 本（T2-1）
- unknown reference: 解決できない SHA（既存の PK5 の文のまま）
- dependency missing: helper が無い（T4-7）、review の API の失敗（T2-5）
- permission/write failure: 不一致・失敗で comment を書かない（T2-1・T2-5 の call 確認）
- dry-run side effect: status は read-only のまま（既存 `test_status_capture_ready_merge` の GET だけの確認）

## Boundary Checks

- threshold: `--pr-reviews` の 0（T2-4）、SHA の 39・40・41 桁（T3-2、既存 PR4-F7）
- null/default: review の `body` が `null`（T2-3）、`submitted_at` の欠落（T2-7）
- empty/non-empty: 本文が空・空白だけ（T2-3）
- min/max: 0 以上の整数（T2-5）
- status/policy enum: Phase・Risk の後ろの注記（T4-2）
- wire type: CLI の整数（argparse の `type=int`）
- internal type: —
- producer/consumer: helper の message → Coordinator（T1-x・T2-1・T5-1 の literal）
- round-trip token: 復帰 command の引数の quote（T5-1）
- precision/range: —
- cross-language parse: bash（PK4）→ python の `parse_packet`（T4-x）

## Compatibility Checks

- old schema/input: 既存の record・capture（RecordV1 不変、既存の `Records`・`RecordLifecycle`）、旧 template の packet（T4-5）
- new schema/input: `--pr-reviews`（T2-x）
- output order: status の blockers は nonci・rules・ci の順のまま（nonci の中の最初の文だけが変わる）
- optional field behavior: `--kind manual|r4` では `--pr-reviews` を評価しない（既存 `test_required_manual_record_and_comment_only_write` が引数なしで通り続ける）

## Data Safety Checks

- source-derived data: 無い（review の本文を fixture に写さない）
- generated outputs: 無い
- secrets: 無い
- local-only files: capture は既存どおり `.local/pr-gate/`（test は tmp）
- synthetic sample boundaries: 合成 git repo・fake gh だけ

## Main Wiring / Integration Checks

- helper connected to main path: `CLI` の fixture で `python3 scripts/pr-gate.py record …` を subprocess で走らせる（T1-2・T1-3・T2-x・T5-1）
- output reaches manifest/report: status の `--json` の blockers（T1-2）
- effective config reaches runtime: —
- CLI arg reaches implementation: `--pr-reviews` が argparse から record の照合へ届く（T2-1・T2-2）

## Mutation-style Adequacy Questions

実装の後に、production 側だけに次の mutant を 1 つずつ入れ、割り当てた test が red になることを closure で確かめる（AC9）。

| Mutant | 期待する red |
|---|---|
| M1: `nonci` の Plan 契約の照合を head/base の照合の後ろへ戻す | T1-1・T1-2 |
| M2: closure の拒否を `server broad required for closure` の短文に戻す（契約の違いを見ない） | T1-3・T1-4 |
| M3: 数える条件から `commit_id` の照合を外す | T2-3 |
| M4: 本文の空の判定を外す（全 review を数える） | T2-3 |
| M5: 一致の照合を `>=` にする | T2-1・T2-4 |
| M6: 照合を書き込みの後へ動かす | T2-1（comment 不変の確認） |
| M7: 照合を reviewed head の照合の前へ動かす | T2-6 |
| M7a: 先頭 page だけを数える（`pages[0]`） | T2-8 |
| M7b: `submitted_at` を `r['submitted_at']` で引く（欠落を `not-submitted` にしない） | T2-7 |
| M8: PK5 の現在値の切り出しを `[0-9a-f]{7,40}` に戻す | T3-1・T3-2 |
| M9: PK5 の重複の照合を外す | T3-3 |
| M10: PK5 の書式の ERROR で `return` して prefix の照合を飛ばす | T3-6 |
| M11: PK4 の `parse_packet` の呼び出しの結果を無視する | T4-1〜T4-4 |
| M12: PK4 の helper の呼び出しの失敗を無視する（fail-open） | T4-7 |
| M13: 復帰 command を `' '.join(sys.argv[1:])`（quote なし）にする | T5-1 |

- If a guard is removed, which test fails? → M6・M7・M11・M12 の行。
- If a key branch is inverted, which test fails? → M1・M5。
- If a threshold comparison changes, which test fails? → M5・M8（桁）。
- If output order changes, which test fails? → M1（阻害理由の順）。
- mock の値と設計の期待値の区別: fake gh の review の `id`・`submitted_at` は fixture ごとに別の値にし、message に両方が出ることで、helper が API の値を使ったことを見る。

## Residual Test Gaps

- 実 GitHub での `--pr-reviews` の照合（本 lane の PR は base の helper で動くため、次の PR の最初の record で観測する）。
- `parse_packet` の判定の将来の変更に PK4 が自動で追従することは構造で保証し、個々の新しい規則の test は helper の test が持つ。
