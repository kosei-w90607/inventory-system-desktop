# Test Design Matrix: 衝突する PR の L3 の順・file:行 の引用・decision-log の Status の規則を正本にする

Plan Packet: [2026-10-19-docs-writing-rules.md](../2026-10-19-docs-writing-rules.md)

## Risk

Risk: R3

## Contracts Under Test

- D-124: L3 を頼む PR が同じ便で先に merge する PR（manual の有無を問わない）と path を共有するなら、L3 を持つ PR を train の先にするか、前の PR の merge と base 同期の後に L3 を頼み、共有は失敗を「共有あり」と扱う手順で確かめる規則が `docs/DEV_WORKFLOW.md` `## Wave Operation` の 1 か所に在る
- D-125: 設計の正本と code の comment は行番号で引かず symbol か節の ID で引き、backlog の申し送りは時点の main の commit を添え、時点の記録と dated の packet・matrix はそのまま残す規則が `docs/DOC_STYLE_GUIDE.md` §1 の 1 か所に在る
- D-126: decision-log の `Status` は決定の状態だけを書き、本文は append-only、全体の置換えは `superseded（by D-xxx。…）` と `- Superseded by:` の行、一部は `- Superseded in part by:` の行で示す規則が `docs/decision-log.md` の頭の 1 か所に在る
- D-127: 既存を出発点として扱い継ぎ足しで歪ませない（規則は環境が変わるたびに変える、を含む）・使い手に押しつけない・所感は原文で扱う規則が `AGENTS.md` `## Working Rules`、店主への問いを Issue に書かない規則が同 `## Decision and Approval Boundaries`、Safety の両立の句が同 `## Safety`、コピペ物の書き方と安全境界の review の経路が `CLAUDE.md` の各 1 か所に在る
- D-124〜D-127 の決定の記録が decision-log の末尾に在り（plan-first で置いた）、Status が決定の状態だけを書く（D-126 に自分で従う）
- 3 つの規則と矛盾する live な規則の文が repo に無い

## Failure Modes

- 規則の文が置き場に無い、または別の節・別の file に書かれる（AC1〜AC3 の置き場の確認で落ちる）
- 同じ規則の文が 2 か所に書かれる（D の本文が規則の文を写す等）
- D-124 の判定が merge の衝突だけになり、衝突なしに同じ file を触る PR を束ねる（Contract Probe P2 の反例）
- D-124 が「L3 を束ねる前」だけで発火し、manual を持たない先の PR との共有を外す
- D-124 の確かめ方の command が失敗しても空の出力で「共有なし」と誤る（Contract Probe P3）
- D-125 が data の行番号・review の一時出力・時点の記録・dated の packet まで禁じる、または Plans に SHA を書かせる
- D-126 の語・書式が lane 1 の Status の直し（`superseded（by D-xxx。…）`・`- Superseded by:` の行）と食い違う
- D-127 が安全・データ保護・外部書込みの承認の境界を緩めると読める、または Safety の「小さく、確認可能な変更を優先する」と食い違ったまま残る
- D-127 の Claude だけの運用（(g)(h)）が `AGENTS.md` に入る、または共通の規則が `CLAUDE.md` に入る。`CLAUDE.md` が共通の品質の条件（Double Audit の数え方）を変える
- 所感の原文を公開 repo に書かせる
- decision-log の頭に足した節が lane 1 の所有の行（既存の D の Status）に触れる
- decision-log の BOM が落ちる

## Test Matrix

`R` と `G` は packet の Acceptance Criteria の置き方（bash で実行）。oracle の literal は規則の文にしか現れない語を選び、file ごとに数える。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D-124 置き場 | 箇条が無い・別の節に在る | regression（rg） | 行 1: `awk '/^## Wave Operation/,/^### Stacked train/' docs/DEV_WORKFLOW.md \| rg -c 'name-only --no-renames'` が `1` | 箇条が Wave Operation の外（Stacked train の下・別 file）に書かれた、または command が落ちた |
| D-124 発火の範囲と判定の語 | 「束ねる前」だけで発火する、merge の衝突だけで判定する | regression（rg） | 行 2: 同じ範囲で `rg -c 'manual の有無を問わない'` が `1`、`rg -c 'merge-tree'` が出力なし | 主語が「束ねる前」に戻った、または merge-tree が判定の command として入った |
| D-124 矛盾なし | 別の所に L3 を束ねる手順が残る | negative（rg） | 行 3: `rg -n 'L3.{0,30}束ね\|束ね.{0,30}L3' $R` が Wave Operation の新しい箇条の行だけ | 別の文書に束ね方の別の手順が書かれた |
| D-125 置き場 | 節が §1 の外 | regression（rg） | 行 4: `rg -n '^## 1\. 参照の書き方\|^### code と文書の箇所の引き方\|^## 2\. ' docs/DOC_STYLE_GUIDE.md` で新しい節の行が §1 と §2 の間 | 節が §5 禁止事項など別の所に置かれた |
| D-125 範囲 | 一時出力・data の行番号・dated の packet まで禁じる、Plans に SHA を書かせる | review（読む）+ rg | 行 5: 新しい節に `対象外:` の箇条が在り、dated の Plan Packet と Test Design Matrix・`line_no`・`path:line`（review・subagent）を名指す（`rg -c 'line_no' docs/DOC_STYLE_GUIDE.md` が `1`。baseline は出力なし・exit 1）。申し送りの箇条が `docs/backlog.md` だけを対象にする | 対象外の箇条が落ちた、または申し送りの対象に Plans が戻った |
| D-125 矛盾なし | 行番号で引けと言う live な規則が残る | negative（rg） | 行 6: `rg -n 'file:line\|path:line\|file:行' $R \| cut -d: -f1,2` が baseline の 5 行（一時出力）と新しい節の対象外の行だけ | 正本・comment に行番号を書かせる規則の文が新しく入った |
| D-126 置き場 | 節が頭に無い | regression（rg） | 行 7: `rg -n '^## Status の書き方\|^## D-001$\|^## Purpose' docs/decision-log.md` が Purpose → Status の書き方 → D-001 の順 | 節が末尾や別 file に置かれた |
| D-126 自己適用 | D-124〜D-127 の Status が実装の状態を書く | regression（rg） | 行 8: `rg -A2 '^## D-12[4567]: ' docs/decision-log.md \| rg -c '^- Status: accepted（owner の決定、repo 外の回答台帳 TD-32[4678]、2026-10-19'` が `4`、`rg -A2 '^## D-12[4567]: ' docs/decision-log.md \| rg '^- Status:' \| rg 'runtime\|実装の PR\|merge で'` が出力なし | Status に「実装は後続の PR」等を書いた |
| D-126 矛盾なし | 「merge で accepted にする」型の live な規則が残る | negative（rg） | 行 9: `rg -n 'accepted にする\|merge で accepted' $R` が出力なし・exit 1 | 規則の文書に旧い流儀の手順が入った |
| 1 か所だけ | 規則の文が 2 か所（同じ file の中の重複を含む） | regression（rg） | 行 10: packet の AC5 の 5 本の `rg -n -o 'LITERAL' docs AGENTS.md CLAUDE.md $G` がそれぞれちょうど 1 行で、指定の位置に在る | D の本文や別の文書・同じ file の別の節が規則の文を写した |
| BOM | decision-log の先頭が変わる | regression（od） | 行 11: `head -c3 docs/decision-log.md \| od -An -tx1` が ` ef bb bf` | 編集の道具が BOM を落とした |
| 検査 | 新しい節が既存の検査を壊す | CLI | 行 12: `bash scripts/doc-consistency-check.sh`、`--target plan docs/plans/2026-10-19-docs-writing-rules.md`、`bash scripts/check-workflow-git.sh` が exit 0 | M1・M3・R3・PK の検査に当たる語・link を入れた |
| D-124 確かめ方の頑健さ | command の失敗を「共有なし」と誤る | regression（rg）+ review（読む） | 行 13: Wave Operation の範囲で `rg -c 'gh pr view'` が `1`、箇条が「終了値が 0 であることを確かめ」「どれかが失敗したら比べられない」を持つ（Contract Probe P3 の反例を防ぐ形） | 手順が process substitution の 1 行に戻った、または失敗の扱いが落ちた |
| D-126 書式 | 全体の置換えを `superseded by D-xxx` の 1 語で書く | negative（rg） | 行 14: `rg -n '^- Status: superseded by ' docs/decision-log.md` が出力なし・exit 1 | lane 1 の適用と違う書式が入った |
| D-127 置き場（共通） | 規則が `AGENTS.md` の別の節・`CLAUDE.md`・2 か所に入る | regression（rg） | 行 15: packet の AC5 の `継ぎ足さない（D-127）`・`押しつけない（D-127）`・`所感は原文で扱う（D-127）`・`差分の行数でなく`・`現場の手順書にする（D-127）` がそれぞれ `AGENTS.md` の指定の節の 1 行 | 共通の規則が Claude だけの補助に入った、または重複した |
| D-127 置き場（Claude だけ） | (g)(h) が `AGENTS.md` に入る、2 か所に入る | regression（rg） | 行 16: packet の AC5 の `返答の本文に inline で書き`・`review の本数の数え方は座組表` がそれぞれ `CLAUDE.md` の指定の節の 1 行 | Claude だけの運用が共通の入口に入った、または重複した |
| D-127 矛盾なし | 既存の「小さく」「smallest」系・委任の範囲・owner の原文の照合と食い違う | negative（rg）+ review（読む） | 行 17: packet の AC6 の D-127 と (d)〜(h) の 2 本の `rg` が baseline の行（`AGENTS.md:65`・`docs/code_review.md:98`・`docs/DEV_WORKFLOW.md:351`・`docs/DEV_WORKFLOW.md:269`）と足した D-127 の行だけ。Safety の行が両立の句を持ち、「継ぎ足さない」の箇条が安全・データ保護・外部書込みの承認の境界を除く文を持ち、(e) の箇条が原文の置き場を repo の外と書く | 両立の句・境界の除外・原文の置き場の文が落ちた |

oracle の独立性: 行 1・2・4・7・13・15・16 の literal は packet の「規則の文と置き場」の文（owner の決定 TD-324・TD-326・TD-327・TD-328、D-127 の出所の owner の方針と round 1 の裁定から起こした文）から取り、実装の後の正本から取らない。

## State Lifecycle Matrix

not applicable: docs の規則の文を足すだけで、UI・data・cache・route・import の状態を持たない。workflow の状態（Workflow State・helper の record）の扱いも変えない。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| not applicable | — | — | — | — | — | — | — | — | — | 上の理由 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| L3 の束ね方・manual 再利用 | DEV_WORKFLOW `## Wave Operation`・`### Stacked train`・Human Visual Confirmation、merge-evidence「base同期だけでheadが変わる場合」、AGENT_OPERATING_MANUAL、ci.md、templates、inventory-* skill（`rg -n 'L3.{0,30}(束ね\|まとめ\|一緒\|同時)\|(束ね\|まとめ\|一緒).{0,30}L3\|merge-tree'`。起票の時点の hit は merge-evidence の「同時に指定」の 1 行で、別の意味） | Wave Operation の 1 か所 | Stacked train（base 付け替えが別の手順）、merge-evidence（条件を引くだけで変えない） | 行 1〜3 |
| 箇所の引き方（行番号） | DOC_STYLE_GUIDE §1・§5・§6、DEV_WORKFLOW Subagent Budget・Commit / PR Messages、code_review.md、AGENT_OPERATING_MANUAL の Explorer・報告フォーマット、templates | DOC_STYLE_GUIDE §1 の 1 か所 | review の finding・subagent と Explorer の報告（一時の出力）、data の `line_no`（製品の契約） | 行 4〜6 |
| 決定の Status の語 | decision-log の頭と各 D の Status、templates/adr.md、adr/README.md、merge-evidence の頭の `Status: accepted` | decision-log の頭の 1 か所 | ADR の Status（templates/adr.md が持つ）、merge-evidence の文書の Status（文書の状態で D の Status でない）、既存の D の Status の行と `Superseded by:` の行（lane 1。全体の置換えの書式は lane 1 の S3 にそろえた） | 行 7〜9・14 |
| 設計の考え方・owner への問い合わせ・Claude だけの運用 | `AGENTS.md` の Working Rules・Decision and Approval Boundaries・Safety、`CLAUDE.md` の全節、DEV_WORKFLOW の Review Rules（owner の原文の照合）、`docs/code_review.md` の finding の形（`rg -n '継ぎ足|不要になる|押しつけ|押し付け|尊重|小さな変更|小さく|smallest|既存の実装|既存を|黙って通さ|環境が変わる|原文|Issue|コピペ|dual-use|敵対的'`。起票の時点の hit は `AGENTS.md:65`・`docs/code_review.md:98`・`docs/DEV_WORKFLOW.md:351`・`docs/DEV_WORKFLOW.md:269`） | `AGENTS.md` の Working Rules・Decision and Approval Boundaries・Safety の両立の句、`CLAUDE.md` の 2 段落 | 委任の範囲（Decision and Approval Boundaries に既にある）、finding の `smallest safe fix`（修正案の形）、owner の原文の照合（同じ向き） | 行 15〜17 |

## Negative Paths

- missing input: 置き場の節が無い → 行 1・4・7 が落ちる
- invalid input: D-124〜D-126 の Status に実装の状態の語 → 行 8 が落ちる
- duplicate/ambiguous input: 規則の文が 2 か所 → 行 10 が落ちる
- unknown reference: DEV_WORKFLOW・DOC_STYLE_GUIDE の新しい link の先が無い → 行 12 の doc check（R3）が落ちる
- dependency missing: not applicable（script・依存を足さない）
- permission/write failure: not applicable（docs の編集だけ）
- dry-run side effect: not applicable（実行する処理を足さない）

## Boundary Checks

- threshold: not applicable（数の閾値を持たない）
- null/default: D-124 の確かめ方で比べられないときは共有ありと同じに扱う（規則の文が名指す）
- empty/non-empty: 行 3・6・9・14 の負の検索は空か既知の行だけ。D-124 の確かめ方の空の出力は、全ての PR の差分の取得が終了値 0 のときだけ「共有なし」（行 13）
- min/max: not applicable
- status/policy enum: D-126 の語は `accepted`・`superseded（by D-xxx。…）`・`withdrawn`・`proposed` の 4 つ（行 8・14 と packet の Review Focus で lane 1 の語と照らす）
- wire type: not applicable
- internal type: not applicable
- producer/consumer: 規則の文の書き手は実装の run、読み手は Coordinator・Writer・reviewer（置き場が読書の経路に在ることは packet の Test Plan の main wiring）
- round-trip token: not applicable
- precision/range: not applicable
- cross-language parse: not applicable

## Compatibility Checks

- old schema/input: 既存の D の Status の行・`Superseded by:` と `Superseded in part by:` の行は本 lane で変えない（Status の直しと `Superseded by:` の行の追加は lane 1）。既存の file:行 の引用は変えない（lane 2）
- new schema/input: 新しく書く D・引用から規則に従う
- output order: decision-log は Purpose → Status の書き方 → D-001 → … → D-123 → D-124〜D-126
- optional field behavior: D の Status の括弧の出典は任意（規則の文が「添えてよい」と書く）

## Data Safety Checks

- source-derived data: 店の実値・発言の原文を書かない（owner の決定は TD の ID）
- generated outputs: 無し（bindings・traceability を触らない）
- secrets: 無し
- local-only files: 調査の報告（`.local/`）を写さない
- synthetic sample boundaries: probe は公開 repo の commit だけ

## Main Wiring / Integration Checks

- helper connected to main path: not applicable（helper を変えない）
- output reaches manifest/report: not applicable
- effective config reaches runtime: not applicable
- CLI arg reaches implementation: not applicable

## Mutation-style Adequacy Questions

docs の規則の変更なので、mutation は正本の文に入れて検索の行が落ちることを確かめる（実装の run が 1 回ずつ注入して戻す）。

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → not applicable（mock を使わない）。代わりに、行 1・2 の literal を packet の文から取る（oracle の独立性）
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → not applicable
- If a key branch is inverted, which test fails? → D-124 の「path を共有するなら」を「path を共有しないなら」に変える注入で、行 2 の `manual の有無を問わない` は残るので落ちない。この反転は Final Review が文を読んで見る（Residual Test Gaps）
- If a threshold comparison changes, which test fails? → not applicable
- If a guard is removed, which test fails? → D-125 の対象外の箇条を消す注入で行 5（`line_no` の数）が落ちる
- If an output field is omitted, which test fails? → D-124 の command を消す注入で行 1、D-126 の節の見出しを消す注入で行 7 が落ちる
- If output order changes, which test fails? → `## Status の書き方` を D-001 の後へ動かす注入で行 7 が落ちる
- If dry-run performs a side effect, which test fails? → not applicable
- If a JSON number crosses JavaScript safe integer range, which test fails? → not applicable
- If a state token is round-tripped through browser/client code, which test fails? → not applicable

## Residual Test Gaps

- 規則の文の意味（条件の向き・語の選び方）は `rg` で確かめられず、Plan Review と Final Review（Double Audit）が文を読んで確かめる
- D-124 の「path を共有しなければ PR 差分は byte で変わらない」は Contract Probe P2 の 1 例で確かめた。`.gitattributes` の変更のように path の外から diff を変える場合は、merge-evidence の owner の判断に残る
- 同じ便の外の PR（前の wave の closeout・R0 の PR 等）が先に同じ path を触って merge すると、L3 を持つ PR の manual は再利用できない（D-124 の Guarantee range の受け入れる残りのリスク）
- D-127 は考え方の規則で、守られたかは `rg` で決められず、Plan Review・Final Review が文と変更を読んで見る
