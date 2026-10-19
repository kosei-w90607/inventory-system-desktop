# Plan Packet: 衝突する PR の L3 の順・file:行 の引用・decision-log の Status の規則を正本にする

docs 全体の棚卸し（owner 2026-10-18、計画は owner 2026-10-19、repo 外の回答台帳 TD-327）の wave の lane「進め方と書き方の規則」。並走の lane は `agent/docs-contract-refresh`（lane 1、契約の文を今に合わせる）。file:行 の引用の書き換えと検査は、この後に起こす棚卸しの lane 2 が持つ。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session）
- Writer: Opus 5.5 subagent
- Plan Reviewer: fresh Opus 5.5（`subagent_type: reviewer`）+ Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1 + Codex
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/docs-writing-rules
- kickoff → spec-check → plan-draft（2026-10-19、起草役、本 commit）: owner の決定 TD-324・TD-326・TD-327 で 3 つの規則の中身が決まり、Risk は R3（`docs/DEV_WORKFLOW.md` を変える workflow gate の変更。`scripts/ci/classify-changes.sh` の workflow の一覧に `docs/DEV_WORKFLOW.md` が当たり `workflow=true`）、Final Review Minimum 2。spec-check → plan-draft は Design Readiness が既存の正本を十分と引く経路で進めた（理由は Design Readiness）。規則の文と置き場は下の「規則の文と置き場」で決め、正本への書込みは plan-approved の後の実装の commit で行う。未解決の設計の問いは無い

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 3（2026-10-19 の TD-324・TD-326・TD-327。decision point ごとに数える） | 2（Ready・merge） | 1 | 6 = 3 + 2 + 1 |

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
`docs/DEV_WORKFLOW.md` `## Wave Operation` に L3 の頼み方の規則を足す。workflow の正本の変更で、DEV_WORKFLOW の Risk Tiers の「workflow gate」に当たる（classifier `workflow=true`）。runtime・DB・wire・script は変えない。

## Goal

Goal Invariant:

### 最小完了条件

- 次の 3 つの規則が、それぞれ 1 か所の正本に、読み手がそのまま従える文で在る: (1) 同じ便の PR どうしで触る path が重なるときの L3 の順（D-124）、(2) 設計の正本と code の comment は行番号で引かず symbol か節の ID で引く（D-125）、(3) decision-log の `Status` は決定の状態だけを書く（D-126）
- 決定の記録 D-124〜D-126 が `docs/decision-log.md` の末尾に在り、理由と棄却案を持つ
- 3 つの規則と矛盾する live な規則の文が repo に残っていない

### 失敗定義

- 規則が 2 か所以上に書かれる、または置き場が読み手の通る経路から外れて読まれない
- D-124 の判定が manual 再利用の機械条件（[merge-evidence](../agent-guidance/merge-evidence.md)「base同期だけでheadが変わる場合」）より緩く、束ねた L3 が base 同期の後にまた要る
- D-125 が既存の時点つきの記録・data の行番号・review の一時出力まで禁じ、守れない規則になる
- D-126 が lane 1 の Status の直しと食い違う語を定める

### 非目的

- 既存の file:行 の引用の書き換えと、それを止める検査（lane 2）
- 既存の D の Status の直し（lane 1）
- 並走の本数・共有 file の Ready をずらす規則（`docs/backlog.md` の「並走の本数と共有 file の Ready をずらす規則を正本にする」。owner の決定が無い）
- script・hook・CI の変更

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、規則ごとに通常の作業の列で書く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 同じ便の 2 本の PR が Draft で、どちらも L3 を要する | Coordinator が L3 を頼む前に、2 本の PR の触る path の重なりを Wave Operation の command で確かめる | 重なりがあれば owner は前の PR の L3 だけを先に受け、後の PR の L3 は前の PR の merge と後の PR の base 同期の後に 1 回だけ受ける。重なりが無ければ 2 本を 1 回の依頼で受ける | owner の L3 の結果（PASS / FAIL）が各 PR の現在の head に対して記録される | Contract Probe P1・P2 |
| Writer が設計書か code の comment で code の箇所を引く | DOC_STYLE_GUIDE §1 の新しい節に従い、path と symbol（文書は節の ID）で書く | 後の変更で行が動いても、読み手が `rg` で同じ箇所へ着く | Plan Review・Final Review が行番号の引用を finding にできる | 無し |
| Coordinator が新しい D を decision-log に足す | owner の決定の前は `Status: proposed`、決定の後は `accepted`。実装の merge では Status を変えない | 読み手が Status から決定の状態だけを読み、実装の状態は code・Plans で見る | 置き換わったときは `Superseded in part by:` の行を足すか、Status を `superseded by D-xxx` にする | 無し |

通常の列（発注 → 停止と訂正 → review → owner 判断）: plan-draft の packet を Plan Review（fresh Opus 5.5 + Codex）に出し、P1/P2 = 0 で plan-approved。実装の run が正本 4 file を直し、Final Review 2 本（Double Audit）の後、owner の Ready・merge の判断を待つ。

## 規則の文と置き場

実装の run はこの節の文を置き場へ書く（語の小さな直しはよいが、規則の中身を変えるなら Gated Amendment）。同じ規則を 2 か所に書かない。decision-log の D は決定・理由・棄却案を持ち、規則の文は置き場の 1 か所だけが持つ。

### D-124 の置き場: `docs/DEV_WORKFLOW.md` `## Wave Operation`

置き場の理由: owner の決定（TD-324）が置き場を `## Wave Operation` と指定した。同節は便の PR の並列・Ready の順・base 同期を持ち、L3 の頼み方はその間の手順になる。既存の箇条「先頭 lane の merge 後、後続 lane は main との同期を…」の直後に 1 つの箇条として足す。

```markdown
- 同じ便の複数の PR の L3（manual）を 1 回の依頼で束ねる前に、L3 を頼む時点の head で PR どうしが触る path の重なりを機械で確かめる（`comm -12 <(git diff --name-only --no-renames origin/main...origin/A | sort) <(git diff --name-only --no-renames origin/main...origin/B | sort)`。A・B は各 PR の branch。出力が空なら重なりが無い）。重なりがあれば merge の順を先に決め、後の PR の L3 は、前の PR の merge と後の PR の base 同期の後に 1 回だけ頼む。L3 を束ねるのは重なりの無い PR だけにする。防ぐ失敗: 後の PR は base 同期で PR の差分が変わり（衝突の解消が無くても、同じ file の hunk の行番号と文脈が動く）、[merge-evidence](agent-guidance/merge-evidence.md)「base同期だけでheadが変わる場合」の manual 再利用の機械条件（PR 差分の byte 一致）を満たせず、L3 が 2 回になる（第 2 便の PR #171・#176。D-124）。
```

### D-125 の置き場: `docs/DOC_STYLE_GUIDE.md` `## 1. 参照の書き方`

置き場の理由: §1 は設計書と code の doc comment の参照の書き方を持つ既存の節で（Rust の doc comment・Markdown リンク・§ 記号）、行番号の引き方はその続きになる。DEV_WORKFLOW は作業の進め方を持ち、書き方の規則を置くと §1 と 2 か所に分かれる。decision-log の頭は決定の記録の書式の場所で、合わない。§1 の最後（「タスクID・要件ID」の後）に節を 1 つ足し、file の頭の「対象」の行に範囲を 1 句足す。

```markdown
### code と文書の箇所の引き方（行番号で引かない）

設計の正本（`docs/` の設計書・workflow の正本・runbook）と code の comment（`src/`・`src-tauri/src/`）は、箇所を行番号（`path:N`・`` `:N` ``・`#LN`）で引かない。行番号は code や文書の変更で動き、読み手を別の箇所へ導く（D-125）。

- code は repo root からの path と symbol（関数・型・定数・test の名前）で引く。範囲は symbol と、その中の目印の語で書く
- 文書は節の ID（`§12.3`・`BIZ-01-D8`・`DSR-22` 等）か節の見出しで引く
- `docs/backlog.md`・`docs/Plans.md` の申し送りで行番号を使うときは、書いた時点の main の commit を同じ行に添える（例: 「`18db621e` の時点で `src-tauri/src/biz/product_service.rs:965`」）
- 時点を書いた記録（commit・library の版・日付を書いた観測、dated の調査・提案・L3 の記録、decision-log の append-only の本文）の行番号は、その時点の観測としてそのまま残す
- 対象外: data の行番号（CSV・EJ の `line_no` 等の製品の契約）、review の finding と subagent の報告の `path:line`（その時点の版に対する一時の出力。[code_review.md](code_review.md)、[DEV_WORKFLOW.md](DEV_WORKFLOW.md) の Subagent Budget）
```

file の頭の「対象」の行は「docs/ 配下の全設計書、src-tauri/src/ 内の doc comment（§1 の箇所の引き方は `src/` の comment と backlog・Plans の申し送りも対象）」にする。

### D-126 の置き場: `docs/decision-log.md` の頭（`## Purpose` の後）

置き場の理由: Status は decision-log の各 D の書式で、D を足す人が最初に読むのは file の頭の `## Purpose` になる。DEV_WORKFLOW の Design Phase Rules は decision-log を設計の成果物として選ぶ所までを持ち、D の書式は持たない。DOC_STYLE_GUIDE は設計書（function-design・db-design・architecture）の型を持ち、decision-log の型を持たない。`## Purpose` と `## D-001` の間に節を 1 つ足す。

```markdown
## Status の書き方

- `Status` は決定の状態だけを書く: `accepted`（決まった）、`superseded by D-xxx`（全体が置き換わった）、`withdrawn`（取り下げた）。`proposed` は owner の決定の前だけに使う。括弧で出典（owner の決定の日付・repo 外の回答台帳の ID）を添えてよい
- 実装が済んだか、どの lane・PR が反映するかは code と `docs/Plans.md`・Plan Packet が持ち、Status に書かない
- 決定の本文（Decision・Why・Alternatives ほか）は append-only で書き換えない。一部が置き換わったときは `- Superseded in part by: D-xxx（置き換わった所）` の行を足し、全体が置き換わったときは Status を `superseded by D-xxx` に直す。後から直してよいのは Status の行（状態の語と出典）と、Superseded の行の追加だけ
- 理由と棄却案は D-126
```

### D-124〜D-126 の決定の記録（`docs/decision-log.md` の末尾）

番号の予約: D-124・D-125・D-126 は本 lane が持つ（[Review Rules](../DEV_WORKFLOW.md#review-rules) の連番 registry。並走の lane 1 は番号を新設しない）。各 D は D-123 と同じ項目（Status・Context・Decision・Why・Alternatives・Guarantee range・Compatibility・owner の決定・Revisit）で書く。中身:

- **D-124: 同じ便で触る path が重なる PR の L3 は、前の PR の merge と base 同期の後に 1 回だけ頼む（2026-10-19）**
  - Status: accepted（owner 2026-10-19、repo 外の回答台帳 TD-324）
  - Context: 第 2 便の PR #171 が PR #176 の merge の後の base 同期で衝突を解き、manual を再利用できず L3 が 2 回になった
  - Decision: 置き場の文のとおり。owner の決定の「衝突」は、PR どうしが触る path の重なりで判定する（merge の衝突を含む）
  - Why: manual 再利用の機械条件は PR 差分の byte 一致で、衝突の解消が無くても同じ file を両方が触れば base 同期で hunk が動き、条件を満たさない（Contract Probe P2）。path が重ならなければ後の PR の差分は byte で変わらない（P2）
  - Alternatives: `git merge-tree --write-tree --name-only` の衝突だけで判定する（P2 の `product_service.rs` は衝突なしに merge されたが差分が変わった。束ねた L3 がまた要る）; 便の全 PR の L3 を直列にする（重なりの無い PR まで待たせる）; manual 再利用の機械条件を緩める（安全の境界で、D-098 の原則でも緩めない）
  - Guarantee range: 同じ便の並列の PR どうし。stacked train の後続 lane の L3 は対象外（[Stacked train](../DEV_WORKFLOW.md#stacked-train) の base 付け替えのまま）。path が重ならないことは manual 再利用の必要条件で、manual 対象への無影響を示さない（merge-evidence の owner の判断は変えない）
  - Compatibility: D-055 の Wave Operation（lane の独立、起票時の所有表、`Ready 化は merge train 先頭の lane のみ`、`origin/main` の単段 merge）と merge-evidence の再利用の条件は変えない。起票時の所有表（D-098）は予定の file、本規則は L3 を頼む時点の差分を見る
  - Revisit: manual 再利用の機械条件が変わったとき。便の PR がいつも path を共有して束ねられない状態が続くとき
- **D-125: 設計の正本と code の comment は行番号で引かず、symbol か節の ID で引く（2026-10-19）**
  - Status: accepted（owner 2026-10-19、repo 外の回答台帳 TD-326）
  - Context: docs の棚卸しの調査で、正本の設計書と code の comment の行番号の引用が code の変更でずれていた（PR #171 は `product_service.rs` を変え、同じ PR で `10-common-rules.md` の文を直したが、行番号は直さなかった）
  - Decision: 置き場の文のとおり。owner の決定の要旨は「ずれても対応できる形で引く。行番号はハードコードと変わらない」
  - Why: symbol と節の ID は `rg` で今の箇所へ着き、行の挿入では動かない。申し送りは起票の時点の観測なので、時点の commit があれば `git show` で当時の行を引ける
  - Alternatives: 行番号を残し、検査で追従させる（検査は行の有無しか分からず、中身のずれを見ない）; 全ての引用に commit を添える（正本は今の code への入口で、古い行を指し続ける）
  - Guarantee range: 新しく書く・直す引用。既存の引用の書き換えと、検査（path が在る・行番号の禁止か時点の commit の要求）を足すかは棚卸しの lane 2
  - Compatibility: Evidence Ownership（D-038・D-050）は exact-HEAD の SHA と件数を tracked に写さない規則で、変えない。申し送りに添える commit は main に在る観測の時点で、merge の根拠ではない。Post-Merge Closeout の「`## 直近の完了` の行に SHA を書かない」も変えない。DOC_STYLE_GUIDE §1 の R0・R1・R3 の検査は変えない
  - Revisit: lane 2 が検査を足すとき
- **D-126: decision-log の Status は決定の状態だけを書く（2026-10-19）**
  - Status: accepted（owner 2026-10-19、repo 外の回答台帳 TD-327）
  - Context: D-111・D-113 は design の段階で accepted、D-116〜D-122 は design の出力を proposed と書き、2 つの流儀が並ぶ。一部だけ実装した D（D-118 の runtime (a)）の書き方が決まらない
  - Decision: 置き場の文のとおり
  - Why: 実装の状態は code・Plans・packet が持つ。Status に重ねると merge のたびに古くなり、一部の実装の書き方を別に決める必要が出る
  - Alternatives: `proposed` を「設計は merge 済み・runtime は未実装」の意味にする（一部の実装を表せず、実装の状態が Status と Plans の 2 か所になる）; Status の行も append-only にする（古い状態が先頭に残り、読み手が最後の行まで読む）
  - Guarantee range: decision-log の D。ADR の Status（[templates/adr.md](../templates/adr.md)）は変えない
  - Compatibility: 既存の D の Status の直し（適用）は lane 1（`agent/docs-contract-refresh`）が持つ。既存の `Superseded in part by:` の行の形を使う
  - Revisit: ADR の Status の語を decision-log とそろえる事情が出たとき

## Scope

実装の run（plan-approved の後）が直す file と目的:

- `docs/DEV_WORKFLOW.md` `## Wave Operation`: D-124 の箇条を 1 つ足す（上の文）
- `docs/DOC_STYLE_GUIDE.md`: §1 の最後に D-125 の節を足し、file の頭の「対象」の行に 1 句足す（上の文）
- `docs/decision-log.md`: `## Purpose` と `## D-001` の間に `## Status の書き方` を足し、末尾に D-124〜D-126 を足す（先頭の BOM を保つ）
- 本 packet の Workflow State と `## Implementation Results`

隣接の確認（変えない）: `docs/agent-guidance/merge-evidence.md`「base同期だけでheadが変わる場合」（D-124 が引く条件）、DEV_WORKFLOW の `### Stacked train`・Subagent Budget・Commit / PR Messages の `path:line`、`docs/code_review.md` の finding の形、`docs/AGENT_OPERATING_MANUAL.md` の Explorer と報告フォーマットの `file:line`、`docs/templates/adr.md` の Status、`scripts/doc-consistency-check.sh`（新しい h2 の節と箇条は PK・M・R の検査の対象を変えない）。

### 並走の lane との所有表

| file | 本 lane | lane 1（`agent/docs-contract-refresh`） |
|---|---|---|
| `docs/decision-log.md` | `## Purpose` と `## D-001` の間の新しい節 `## Status の書き方`、末尾の `## D-124`〜`## D-126` | 既存の D の `- Status:` の行と、既存の D に足す `- Superseded in part by:` の行 |

merge の順はどちらが先でもよい。後の lane は `origin/main` の単段 merge で両方の行を残す（Wave Operation）。どちらの lane も Human Gate に manual を持たないので、D-124 の L3 の順は当たらない。本 lane の他の file（DEV_WORKFLOW・DOC_STYLE_GUIDE・本 packet と matrix）は lane 1 の対象外（lane 1 は workflow の正本を触らず、DOC_STYLE_GUIDE は同 lane の調査で直す対象に無い）。

## Non-scope

- 既存の file:行 の引用の書き換え・file の頭の時点の注記・検査の追加（棚卸しの lane 2）
- 既存の D の Status の直しと Superseded の行の追加（lane 1）
- `docs/backlog.md` の項目「同じ便で実装 file が衝突する PR の L3 の頼み方を Wave Operation に足す」を外すこと（本 lane の closeout で外す。本 lane の PR では backlog を触らず、lane 1 と共有する file を増やさない）
- `docs/backlog.md` の「並走の本数と共有 file の Ready をずらす規則を正本にする」（owner の決定が無く、本 lane の 3 つの決定に入っていない。backlog に残す）
- stacked train の後続 lane の L3 の頼み方、ADR の Status の語、`docs/Plans.md` の lane の行（D-097）
- script・hook・CI・runtime の変更

## Acceptance Criteria

AC の確認は下の command を repo root で逐語に実行する。`R` は live な規則の文書の一覧: `R="AGENTS.md CLAUDE.md docs/DEV_WORKFLOW.md docs/AGENT_OPERATING_MANUAL.md docs/DOC_STYLE_GUIDE.md docs/ci.md docs/templates docs/agent-guidance docs/code_review.md docs/quality/review-checklist.md docs/adr/README.md .agents/skills/inventory-workflow-start .agents/skills/inventory-implementation .agents/skills/inventory-code-review .agents/skills/inventory-operator-ui"`。baseline は起票の時点（`18db621e`）の出力。

- AC1 D-124 の置き場: `awk '/^## Wave Operation/,/^### Stacked train/' docs/DEV_WORKFLOW.md | rg -c 'name-only --no-renames'` が `1`、同じ範囲の `rg -c 'L3 を束ねるのは重なりの無い PR だけ'` が `1`。baseline: `rg -c 'name-only --no-renames' docs/DEV_WORKFLOW.md` は出力なし・exit 1
- AC2 D-125 の置き場: `rg -n '^## 1\. 参照の書き方|^### code と文書の箇所の引き方|^## 2\. ' docs/DOC_STYLE_GUIDE.md` で新しい節の行番号が §1 と §2 の見出しの間にある。baseline: `rg -c '^### code と文書の箇所の引き方' docs/DOC_STYLE_GUIDE.md` は出力なし・exit 1
- AC3 D-126 の置き場: `rg -n '^## Status の書き方|^## D-001$|^## Purpose' docs/decision-log.md` が `## Purpose`・`## Status の書き方`・`## D-001` の順の 3 行。baseline: `3:## Purpose` と `8:## D-001` の 2 行
- AC4 決定の記録: `rg -c '^## D-12[456]: ' docs/decision-log.md` が `3`、各 D の `- Status:` が `accepted（owner 2026-10-19、repo 外の回答台帳 TD-32n）` で始まり、実装の状態の語（`runtime`・`実装の PR`・`merge で`）を含まない。baseline: 出力なし・exit 1
- AC5 1 か所だけ: `rg -l 'name-only --no-renames' docs AGENTS.md CLAUDE.md --glob '!docs/plans/**' --glob '!docs/archive/**'` が `docs/DEV_WORKFLOW.md` の 1 行、`rg -l 'code と文書の箇所の引き方' docs --glob '!docs/plans/**' --glob '!docs/archive/**'` が `docs/DOC_STYLE_GUIDE.md` の 1 行、`rg -l '^## Status の書き方' docs` が `docs/decision-log.md` の 1 行（D-124〜D-126 の本文は置き場を名指し、規則の文を写さない）
- AC6 矛盾する live な規則の文が無い（下の 3 本の `rg` の各 hit を読んで判定する）:
  - D-124: `rg -n 'L3.{0,30}束ね|束ね.{0,30}L3' $R` が DEV_WORKFLOW `## Wave Operation` の新しい箇条の行だけ。baseline: 出力なし・exit 1
  - D-125: `rg -n 'file:line|path:line|file:行' $R | cut -d: -f1,2` が、baseline の 5 行（`docs/DEV_WORKFLOW.md:198`〈Subagent Budget〉・`docs/DEV_WORKFLOW.md:351`〈Commit / PR Messages〉・`docs/code_review.md:98`・`docs/AGENT_OPERATING_MANUAL.md:21`・`docs/AGENT_OPERATING_MANUAL.md:152`。どれも review・subagent の一時の出力）と、DOC_STYLE_GUIDE の新しい節の対象外の行だけ（DEV_WORKFLOW の行番号は Wave Operation の追記で動いてよい）
  - D-126: `rg -n 'accepted にする|merge で accepted' $R` が出力なし・exit 1（baseline も同じ）。`docs/decision-log.md` の既存の D の Status の行の同じ語は lane 1 の所有（所有表）で、本 lane の AC に入れない
- AC7 BOM: `head -c3 docs/decision-log.md | od -An -tx1` が ` ef bb bf`（baseline も同じ）
- AC8 検査: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-19-docs-writing-rules.md` が exit 0、`bash scripts/check-workflow-git.sh` が exit 0、Draft の hosted run（`Draft (no merge evidence)`）が success

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。当たらない箇条は 1 行の理由で閉じる。

- 引用する設計正本（節まで）: [DEV_WORKFLOW](../DEV_WORKFLOW.md) `## Wave Operation`・`### Stacked train`・Review Rules の連番 registry と Double Audit・Workflow State の Evidence Ownership（D-038）・Plan Packet Rules の Evidence Ownership の design-document extension（D-050）・Post-Merge Closeout の `## 直近の完了`、[merge-evidence](../agent-guidance/merge-evidence.md)「base同期だけでheadが変わる場合」、[DOC_STYLE_GUIDE](../DOC_STYLE_GUIDE.md) `## 1. 参照の書き方`、[decision-log](../decision-log.md) `## Purpose` と D-123 の項目の型
- 必要な設計成果物: 「Durable cross-cutting choice, workflow gate change」の行 = decision-log の D-124〜D-126（updated in this PR、実装の commit）。ほかの行（BIZ・DTO・DB・画面・CSV）は当たらない
- plan にしかない durable な判断の昇格先: 3 つの規則は置き場の正本、決定・理由・棄却案は decision-log の D-124〜D-126。どちらも同じ PR の実装の commit で書き、merge の前に揃う
- 前提・制約と、延期した design gap の follow-up: 既存の引用の書き換えと検査は lane 2、既存の D の Status の直しは lane 1、並走の本数の規則は backlog に残す（Non-scope）
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: D-124 の「path が重ならなければ後の PR の差分は byte で変わらない」は Contract Probe P2 で 1 例を確かめた性質で、manual 再利用の必要条件にとどめ、owner の判断を残す（D-124 Guarantee range）
- 判定（ready / not ready）と理由: ready。この change の成果物は規則の文そのもので、規則の中身は owner の決定 TD-324・TD-326・TD-327 で決まっている。文と置き場は本 packet の「規則の文と置き場」が決め、前提は Contract Probe で確かめた。正本への書込みは発注（plan-approved の後の別の run）に従い実装の commit で行うので、design の段階を挟まず spec-check → plan-draft の経路を使った

## Registration / Generation Obligations

該当なし（新しい file・route・command・REQ を作らない。DOC_STYLE_GUIDE と decision-log に足す節は既存の file の中で、目次・索引の登録は無い）。

## Impact Review Lenses

not applicable: 現地の調査・実機・外部の tool・POS・CSV の形式・operator の作業から始まる task ではなく、docs の棚卸しの調査から決まった workflow と書き方の規則の変更。外部の前提（git の振舞い）は Contract Probe で確かめた。

## Boundary / Wire Contract

not applicable: JSON・CSV・config・DTO・bindings・DB を触らない。

## Test Plan

[Test Design Matrix](test-matrices/2026-10-19-docs-writing-rules.md) を使う。L3 は無い（docs だけで operator の画面を変えない）。

- targeted tests: AC1〜AC7 の `rg`・`awk`・`od` を実装の後に逐語で実行する
- negative tests: AC6 の旧い書き方の検索（矛盾する live な規則の文が 0、または既知の一時出力の行だけ）
- compatibility checks: `bash scripts/doc-consistency-check.sh` が exit 0（新しい h2・h3 の節が M・R・PK の検査を壊さない）、`bash scripts/check-workflow-git.sh` が exit 0
- data safety checks: 店の実値・発言の原文を書かない。owner の決定は TD の ID で引く
- main wiring/integration checks: 置き場の 3 か所が読み手の経路に在る（DEV_WORKFLOW は AGENTS.md の Session Start の R2+ の経路、DOC_STYLE_GUIDE は DEV_WORKFLOW の Source Index、decision-log の頭は D を足すときに開く所）

## Review Focus

- D-124 の判定を owner の決定の「衝突」から「触る path の重なり」へ広げたことが、owner の決定の目的（L3 を 2 回にしない）と merge-evidence の再利用の条件に合うか（Contract Probe P1・P2）
- D-125 の「申し送りに時点の commit を添える」が、Evidence Ownership（D-038・D-050）と Post-Merge Closeout の「SHA を書かない」と食い違わないか
- 3 つの置き場の選び方と、同じ規則を 2 か所に書いていないか（AC5）
- lane 1 との所有表（decision-log の頭と末尾 / 既存の D の Status の行）が lane 1 の packet と食い違わないか
- spec-check → plan-draft の経路（Design Readiness の判定）が Workflow State の遷移の条件を満たすか

## Contract Ledger

ここから Data Safety までが R3/R4 の部分。

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-124（新設） | DEV_WORKFLOW `## Wave Operation` | 箇条を 1 つ足す、decision-log に D-124 | AC1・AC5・AC6 の `rg`（matrix の行 1〜3） | L3 なし |
| D-125（新設） | DOC_STYLE_GUIDE `## 1. 参照の書き方` | 節を 1 つ足す、頭の「対象」の行、decision-log に D-125 | AC2・AC5・AC6 の `rg`（matrix の行 4〜6） | L3 なし |
| D-126（新設） | decision-log `## Purpose` の後 | 節 `## Status の書き方`、decision-log に D-126 | AC3・AC4・AC5・AC6 の `rg`（matrix の行 7〜9） | L3 なし |
| D-055 Wave Operation の既存の箇条 | DEV_WORKFLOW `## Wave Operation` | 変えない（足す位置の前後） | AC8 の doc check | 非対象 |
| merge-evidence の manual 再利用の条件 | merge-evidence「base同期だけでheadが変わる場合」 | 変えない。D-124 が引く | Contract Probe P2 | 非対象 |
| D-074 stacked train | DEV_WORKFLOW `### Stacked train` | 変えない（D-124 の対象外） | AC1 の `awk` の範囲の終端 | 非対象 |
| D-038・D-050 Evidence Ownership | DEV_WORKFLOW Workflow State・Plan Packet Rules | 変えない。D-125 の Compatibility に書く | 無し（文の review） | 非対象 |
| Post-Merge Closeout の `## 直近の完了` | DEV_WORKFLOW Post-Merge Closeout | 変えない | 無し（文の review） | 非対象 |
| DOC_STYLE_GUIDE §1 の R0・R1・R3 | DOC_STYLE_GUIDE §1・§6 | 変えない | AC8 の doc check | 非対象 |
| 連番 registry の番号予約 | DEV_WORKFLOW Review Rules | D-124〜D-126 を本 lane が予約（本 packet） | AC4 の `rg -c` | 非対象 |
| ADR の Status | `docs/templates/adr.md` | 変えない（D-126 の対象外） | 無し | 非対象 |
| D-097 Plans に lane の行を足さない | decision-log D-097、DEV_WORKFLOW Wave Operation | 変えない（Plans を触らない） | 無し | 非対象 |

## Contract Probe

- P1 `git merge-tree --write-tree --name-only A B` は衝突のとき exit 1 で衝突の path を出し、衝突が無いとき exit 0 で tree だけを出す: 第 2 便の PR #171 の base 同期の前の head `2f71fab1` と PR #176 の head `daa23a40` で実行 → exit 1、衝突の path は `docs/backlog.md`・`docs/function-design/20-io-product-repo.md`・`docs/function-design/90-traceability.md`・`src-tauri/src/db/product_repo.rs`（実装 file の衝突を含む）。`2f71fab1` と祖先の `44f1e666` で実行 → exit 0、tree の 1 行だけ（git 2.53.0）
- P2 両方の PR が触る file は、merge の衝突が無くても base 同期で PR 差分の byte が変わり、片方だけが触る file は変わらない: `git diff --binary --full-index --no-ext-diff --no-textconv` の file ごとの sha256 を、同期の前（`44f1e666` → `2f71fab1`）と後（`c1c1c5bf` → `87a96fb9`、PR #171 の最終の head）で比べた。両方が触り P1 で衝突に出なかった `src-tauri/src/biz/product_service.rs` → `5e322fd6…` と `be9481b7…` で不一致（hunk の見出しが `@@ -63,6 +63,8 @@` から `@@ -64,6 +64,8 @@` へ動いた）。#171 だけが触る `src/features/products/components/ProductForm.tsx` と `docs/SCREEN_DESIGN.md` → 前後とも `117a0c11…` で一致。PR が触る path の一覧は `git diff --name-only --no-renames 44f1e666...2f71fab1` と `44f1e666...daa23a40` で取った。結論: merge-tree の衝突だけで束ねる PR を選ぶと、後の PR の manual を再利用できない場合が残るので、D-124 は path の重なりで判定する

## Data Safety

- 店の実値・発言の原文・実 POS / 店舗のデータを書かない。owner の決定は repo 外の回答台帳の ID（TD-324・TD-326・TD-327）で引く
- probe は公開 repo の commit（PR #171・#176）だけを使い、作業の出力は `$TMPDIR` に置いた
- 調査の報告（repo 外の `.local/`）の全件の表を写さない

## Implementation Results

実装の後に書く。

## Review Response

review の後に書く。
