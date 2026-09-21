# Test Design Matrix: 普通の一日の操作列・Writer 停止時の規則・問い合わせの行き先

[Plan Packet](../2026-09-22-workflow-ordinary-operation-and-stop-routing.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-WF-LIGHT1A-D1: template の `## Ordinary Operation` 節。
- SPEC-WF-LIGHT1A-D2: Plan Review の最初の問い（既存の Plan Review の同じ run・同じ採否）。
- SPEC-WF-LIGHT1A-D3: Writer が編集前に止まったときの規則（§5.6）。
- SPEC-WF-LIGHT1A-D4: 問い合わせの行き先の表（Owner Effort Budget）。
- SPEC-WF-LIGHT1A-D5: D-090。
- 保護する隣接契約: `AGENTS.md` Decision and Approval Boundaries、`docs/AGENT_OPERATING_MANUAL.md` §3.2（codex-only の自己裁定の禁止、D-087）、Owner Effort Budget の上限と計上、Findings Freeze、Plan Review round 天井、Workflow State の field。

## Failure Modes

- F1: 操作列の節が「誤りを通さないか」の確認欄として書かれ、「目的を達成できるか」を問えない。
- F2: Plan Review の問いが新しい phase・review 本数・gate・承認 commit として読める。
- F3: 正本の変更が要る不一致が、発注の訂正として owner・裁定者を通らずに処理される。
- F4: codex-only / D-087 で owner が持つ裁定が Coordinator（起草役）へ移る。
- F5: 行き先の表が複数の文書に複製され、片方だけ更新される。
- F6: 設計を含まない小さな R2 にも操作列の表を要求し、起票の費用が増える。
- F7: link 切れ・anchor 不一致。

## Test Matrix

自動 test は追加しない。事例照合は Final Review が対象本文を直接読んで確認し、機械で観測できる部分は AC の command と既存 gate が担う。引用する既存 test はない。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D1 / D2 | F1 | 事例照合（review） | T1: PR #85 の操作列 `計数 → アプリ終了 → 翌日起動 → 後着売上の取込み` を表の 5 列で書け、reviewer の答え `具体的な反例あり` と最短の状態遷移を報告の冒頭に置ける | 表の列や規則文が「危険な結果を出さないか」だけを問い、正常な条件で目的に届くかを答える場所がない |
| D3 / D4 行 1 | F3 | 事例照合（review） | T2: PR #75 の「再開の発注書に実装前の着手条件が残った」、PR #67 の「packet と発注書で commit 条件が矛盾」が、Coordinator の発注作り直し + §5.6 手順 4 の最終照合で owner へ中継せずに閉じる | 規則文が owner への確認を要求する、または最終照合を要求しない |
| D3 / D4 行 4 | F3 | 事例照合（review、negative） | T3: PR #85 の「合成モデルは変更しない」とモデル是正の要求の衝突が、発注の訂正ではなく独立確認 + Gated Amendment へ戻る | 規則文の条件を満たすと読める（正本が一意でない・意味を変える場合の除外が欠ける） |
| D3 / D4 行 4・6・7 | F4 | 事例照合（review、negative） | T4: Execution Mode が codex-only の packet で、finding の採否・Gated Amendment の承認が owner に残る。D-087 でも owner の採用・裁定・Human Gate が残る | D3 の 7 か D4 行 4 の但し書きが欠け、Coordinator の起草役が裁定できると読める |
| D2 / 隣接契約 | F2 | CLI + review（negative） | T5: `git diff origin/main --stat -- scripts .github src src-tauri AGENTS.md CLAUDE.md docs/ci.md` が空。`git diff origin/main --numstat -- docs/templates/plan-packet.md` の削除 0。`docs/DEV_WORKFLOW.md` の既存行に削除・変更なし。D2 の項目が「足さない」を明記する | checker・phase enum・Final Review Minimum・Human Gate・上限値のいずれかに差分が出る |
| D4 / D5 / D2 | F5 / F7 | CLI（file の実在と文字列の突合）+ review | T6: `bash scripts/doc-consistency-check.sh` が link 先 file の実在を確認する（同 script は anchor 部を捨てるため anchor は検査しない）。anchor は AC4 の `rg -n '^### 問い合わせの行き先$' docs/DEV_WORKFLOW.md` と参照側の `DEV_WORKFLOW.md#問い合わせの行き先` の突合、Plan Packet Rules → Review Rules の link は review で確認する。AC4 の `rg` で表が `docs/DEV_WORKFLOW.md` だけにある | S3 / S4 が表を複製する、link 先 file が無い、または参照側の anchor 文字列が見出しと一致しない |
| D1 / D2 | F6 | 事例照合（review） | T7: PR #77（test 1 本の追加、production code 不変）のような設計を含まない変更が `not applicable` + 理由 1 行で足り、Plan Review で D2 の問いを要求されない。archive の packet は書き換えない | 節が全 packet に表を要求する、または遡及適用を求める |

## State Lifecycle Matrix

not applicable: UI・data・cache・route・import/export・永続 state を変えない。workflow-state についても、Workflow State の field・phase 遷移・Evidence Mode・record は変更しない（T5 で観測）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| owner へ聞く / 聞かないの境界 | `AGENTS.md` Decision and Approval Boundaries、`docs/DEV_WORKFLOW.md` Owner Effort Budget、`docs/AGENT_OPERATING_MANUAL.md` §3.2 / §5.5 / §5.6 | Owner Effort Budget（表の正本）、§5.6（link） | `AGENTS.md`: 承認の境界そのものを変えないため編集しない。§5.5 相談窓口役: dual-vendor-no-fable 専用の別経路で、本変更の対象外 | T3 / T4 / T6 |
| reviewer への発注に何を渡すか | `docs/DEV_WORKFLOW.md` Review Rules、`docs/AGENT_OPERATING_MANUAL.md` §5.4、`docs/templates/subagent-review-packet.md`、`docs/code_review.md` | Review Rules（1 項目） | §5.4 / subagent-review-packet: 読む順序・観点の強制を足さない（低制約 profile の趣旨）。code_review.md: Final Review の観点であり Plan Review の問いの所有先ではない | T1 / T5 |
| Writer 停止時の扱い | §5.6、§3.2 codex-only の発注書の必須 1 行、Plan Packet Rules の旧前提 sweep | §5.6 | §3.2: run 分離と packet 編集禁止の契約は変えない | T2 / T3 |

## Negative Paths

- missing input: `Ordinary Operation` を書かない設計 packet → 既存の Plan Review で finding になる（checker では止めない、非目的）。設計を含むのに `not applicable` とした packet → D2 により reviewer が理由の妥当性を確認し finding にする（著者の宣言だけで問いを無効にできない）。
- invalid input: 操作列が「文書を完了できる」だけを示す → D1 の「通常運用の達成」と分ける指示で reviewer が指摘できる。
- duplicate/ambiguous input: 問い合わせが表の 2 行に当てはまる（例: 正本の意味を変える範囲の拡張 = 行 4 と行 6）、または裁定権の所在が争点 → D4 の注記 (a) により owner 側の行（5〜7）を優先する。
- unknown reference: 表に当てはまらない問い合わせ → 既存の `AGENTS.md` Decision and Approval Boundaries に従う（表は境界を変更しない、と明記）。
- dependency missing: 発注前検査の script は未導入 → D3 は §5.6 手順 4 を指す。
- permission/write failure: not applicable。
- dry-run side effect: not applicable。

## Boundary Checks

- status/policy enum: reviewer の答えは `成立 / 具体的な反例あり / 外部前提が未確認` の 3 値。Workflow State の enum は不変。
- empty/non-empty: `not applicable` + 理由 1 行を許す（節は削除しない）。
- producer/consumer: producer = Coordinator（操作列）、consumer = Plan Reviewer。機械 consumer はない。
- その他（threshold / wire type / precision / cross-language parse）: not applicable。

## Compatibility Checks

- old schema/input: 既存の active / archive packet は本節を持たないままで有効（非遡及）。`scripts/doc-consistency-check.sh --target plan` は節の有無を検査しない。
- new schema/input: 本変更の merge 後に起票する packet から template の節を使う。
- output order / optional field behavior: not applicable。

## Data Safety Checks

- source-derived data: 外部設計相談の原文・owner 発言の原文を転記しない。
- generated outputs: なし（生成物を変更しない）。
- secrets: なし。
- local-only files: `.local/**`。
- synthetic sample boundaries: not applicable。

## Main Wiring / Integration Checks

- helper connected to main path: template の節 → Plan Packet Rules の項目 → Review Rules の規則、の順に link で辿れる。
- §5.6 の規則文 → Owner Effort Budget の表へ link で辿れる。
- その他（manifest / config / CLI arg）: not applicable。

## Mutation-style Adequacy Questions

実注入の mutation は対象外（自動 test なし）。文書の mutant を review で問う:

- D3 から「正本が曖昧な場合はこの経路を使わない」を除くと、T3 が不成立になるか → なる（PR #85 の衝突が発注の訂正で通る）。
- D3 から 7（実行 mode 上の裁定）を除くと、T4 が不成立になるか → なる。
- D2 から「足さない」の明記を除くと、T5 の review 部分が不成立になるか → なる。
- D1 から `not applicable` の扱いを除くと、T7 が不成立になるか → なる。
- D4 から注記 (a)（owner 側の行を優先）を除くと、行 4 と行 6 の両方に当たる問い合わせが Coordinator 側で閉じ得るか → 閉じ得る。
- D3 から 8（§5.6 の既存文との関係）を除くと、既存文を根拠に 5 を迂回できるか → できる読み方が残る。

## Residual Test Gaps

- reviewer が実際に報告の冒頭で 3 値を答えるか、Writer の停止から再開までの往復が減るかは未実測。次の R2+ 起票（㉘ runtime の最初の lane）を dogfood 対象とし、closeout で観測結果を記録する。
- 文書を読まずに発注する行動は機械的に防げない（1 段目の残り = 発注前検査の script で扱う）。
