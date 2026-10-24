# Plan Packet: docs の小口 2（座組表の Fable を当面 Fable 5 に・ARCHITECTURE §4 の決まった項・ECR+ の精算の前提・棚卸しの期間の旧表記）

wave に属さない単独の lane。docs だけ。code・migration・bindings・画面の振舞い・helper・classifier・CI は変えない。

出所: (1) owner の決定（2026-10-24、repo 外の回答台帳 TD-410）: 座組表の Fable を当面 Fable 5 にする。(2) `docs/backlog.md` で「次の docs の小口」「次の docs の lane で直す」「docs 小口」とされた未着手の項目のうち、agent が直し方を一意に決められるもの。下の行番号と数は起点 `843c4938`（`origin/main`）で command を逐語で実行した出力（D-062）。本 packet は dated の Plan Packet なので、行番号を起票の時点の観測として書く（`docs/DOC_STYLE_GUIDE.md` §1 の対象外の項）。直した後の正本の文は行番号で引かない（D-125）。

規模と手法: 触る file は 6（`docs/AGENT_OPERATING_MANUAL.md`・`docs/ARCHITECTURE.md`・`docs/backlog.md`・`docs/architecture/biz-task-specs.md`・`docs/db-design/tracking-system-tables.md`・`docs/SCREEN_DESIGN.md`）と本 packet。段を S1〜S5 に分け、段ごとに AC を置く。本 run（起票）は packet だけを置き、docs の本体の直しは plan-approved の後の別の run で行う（先例: docs の小口〈`docs/archive/plans/2026-10-23-docs-small-batch.md`〉）。

起票の時点で済んでいたもの（Scope に入れない）: backlog の「次の docs の lane の候補（docs の棚卸し lane 1 の残り）」の項目（2026-10-20）は PR #192 が (1)〜(8) を直すか直さない理由を残して項目ごと外し（同 packet の S6b）、`docs/Plans.md` の `## 次の行動` の同じ名の句は PR #199（closeout）が外した。`843c4938` で `rg -n '次の docs の lane の候補' docs --glob '!docs/archive/**'` は何も出さない（exit 1）。#192 の Non-scope に残った backlog の「MSI の製品名と upgrade code の固定」の旧名の句も、項目ごと PR #191 の後に無い（`rg -n 'MSI の製品名と upgrade code の固定' docs/backlog.md` は「⑤ go-live 検証 flow」の 1 行の「済んだ」の句だけを出す）。

## Workflow State

- Phase: plan-gate
- Risk: R2
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票は本 run。docs の直しは plan-approved の後の別の run）
- Plan Reviewer: fresh Opus 5.5（fork でない）+ Codex。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Reviewer: fresh Opus 5.5（Claude 側。R2 で design lane でないので座組表の「それ以外」の行）+ Codex。座組表どおり
- Final Review Minimum: 2
- Human Gate: ready,merge
- Branch: agent/docs-small-batch-1024

Final Review Minimum 2 は、S1 の `docs/AGENT_OPERATING_MANUAL.md` が `scripts/ci/classify-changes.sh` の policy docs の列（`AGENTS.md|CLAUDE.md|docs/DEV_WORKFLOW.md|docs/ci.md|docs/AGENT_OPERATING_MANUAL.md|…`）に当たり classifier が `workflow=true` を出すため（`docs/DEV_WORKFLOW.md` Workflow State の `Final Review Minimum`）。manual なし: 製品の runtime・画面・配布物を変えない docs の変更で、Windows native で確かめる物が無い。

遷移の記録:

1. kickoff → spec-check（2026-10-24、起草役）: 範囲を TD-410 と backlog の 3 つの項目（下の S2〜S5）にし、Risk を R2 と記録した（下の Risk）。
2. spec-check → plan-draft（2026-10-24、起草役、同じ commit）: 表の唯一の skip。直す先の設計正本（下の Design Readiness）は契約として足りていて、本 lane は新しい設計の選択をしない。S1 は owner の決定（TD-410）を座組表へ書き写し、S2〜S4 は文を既にある正本・`docs/project-memory.md` の店の事実に合わせるだけ。
3. plan-draft → plan-gate（2026-10-24、起草役、同じ commit）: owner の判断事項は Scope に残らない（owner の選択が要る候補は Scope に入れず、起票の報告で Coordinator へ渡した。下の Non-scope）。packet が揃い commit されている。R2 で Test Design Matrix は任意で、置かない。Plan Review に出す。Codex が使えれば Codex と fresh Opus 5.5 を同じ round で、使えなければ fresh Opus 5.5 で始め Codex 分を後から足す（`docs/AGENT_OPERATING_MANUAL.md` §3.3）。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 1（decision point の単位、`docs/DEV_WORKFLOW.md` Owner Effort Budget: TD-410〈Fable を当面 Fable 5〉1） | 2（Ready 1・merge 1） | 3 | 6 = 1 + 2 + 3 |

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R2

Reason:
docs だけの変更で、runtime の契約を変えない。R0（「Typo, link, non-semantic doc cleanup.」）には当たらない: S1 は reviewer と相談役に充てる model と起動の仕方を変え、S2〜S4 は文の意味（決まった事項の置き場、ECR+ の論点の前提、棚卸しの期間）を変える。R2 の行（「Local developer workflow … or docs change that affects maintainability but not runtime contracts.」）に当たる。

R3 にしない理由: 境の規則（「If uncertain between R2 and R3, choose R3 when the change touches … workflow gate」）の workflow gate を、merge gate・helper・classifier・hosted CI・PK の合否の意味で読む（先例: ハーネスの残りの小口の整理〈`docs/archive/plans/2026-09-30-harness-small-cleanup.md` の Risk、R2〉）。S1 は座組表の Fable の枠の model の値と起動の仕方だけを替え、どの枠が何本要るか・独立性・Codex の合否・Final Review Minimum・Human Gate の規則は変えない（座組表の注記「モデル更改時は owner 決定を受けてこの表だけを書き換える」の経路）。review の義務・判定そのものを変えた R3 の前例（PR #113〈`docs/archive/plans/2026-09-25-harness-pr2-roles-and-formation.md`〉: Final Review の Claude 側を R3 以上で Fable 5.1 にする規則の新設）とは違う。`scripts/**`・`.github/**`・`.claude/agents/*` を触らず、required gate の green / red は変わらない。一方、classifier の `workflow=true` には当たるので Final Review Minimum は 2（上の Workflow State の注）。Human Gate は `ready,merge`（R2 の既定）。

## Goal

Goal Invariant:

### 最小完了条件

- 座組表（`docs/AGENT_OPERATING_MANUAL.md` `## 座組`）を読んだ Coordinator が、Fable の枠（Final Reviewer の Claude 側の R3 以上・design lane・closure と、相談役）に Fable 5 を充て、Fable 5 で起動する形（subagent の定義の frontmatter の `model: claude-fable-5`・`effort: high`、呼出しで `model` を渡さない）と、その出所（TD-410）を読める（S1）。
- `docs/ARCHITECTURE.md` の `## 4. 未確定事項` に、決まった事項（IO-04 の PLU の形と反映の手順、宅急便部門）が残らず、その中身は今の正本（[67](../function-design/67-ui-plu-export.md) UI-08-D1〜D3・[25](../function-design/25-io-plu-formatter.md)・[master-tables](../db-design/master-tables.md) の初期データの部門 12 の行）で辿れる（S2）。
- backlog の「ECR+ のサービス終了後の精算」の項目が、`docs/project-memory.md` の店の事実（2026-10 にレジ本体だけで精算できた）と合う前提と、残る論点だけを書く（S3）。
- 棚卸しの期間を「10月〜大晦日の長期作業」「数週間スパン」と書く 3 か所が、[73](../function-design/73-ui-stocktake.md) §73.1 の店の事実（10 月からの準備と大晦日に終える正式カウントに分かれる、一人で数千点を回る）と合う（S4）。
- backlog の済んだ項目（ARCHITECTURE §4 の宅急便部門）が外れ、期間の旧表記の項目が残りだけを書く（S5、D-127）。

### 失敗定義

- S1 で座組表の規則（枠の本数・独立性・Codex の合否・Fable が使えないときの代え方・effort の値）を変える。Fable 5 の起動の仕方を、公式の資料と食い違う形で書く。
- S1 で `docs/AGENT_OPERATING_MANUAL.md` の外（decision-log の決定の本文、archive、並走の lane の packet）の「Fable 5.1」を書き換える。
- S2 で外した項の中身に、今の正本に無く今も効くものがあったのに、確かめずに消す。
- S3 で店の運用の細部・実値・発言の原文を repo に書く。
- S4 で棚卸しの期間・作業量について、73 §73.1 と `docs/project-memory.md` に無い事実（例: 正式カウントの日数）を書く。
- 並走の lane の行（下の「他の lane との所有」）を触る。

### 非目的

- code・migration・bindings・route・画面の文言を変える（`src-tauri/src/biz/stocktake_service.rs` の module doc の comment を含む）。
- 座組表の他の枠（Writer・Plan Reviewer・Codex の model）と effort の方針を見直す。
- `.claude/agents/` の定義を tracked にする・変える。
- backlog の他の項目を洗い直す。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

not applicable: operator の操作・data / command の契約・業務の状態遷移を変えない docs の変更。S1 は workflow の文書だが、発注 → review → owner の Ready / merge の通常列を変えず、Fable の枠に充てる model の値と起動の形だけを替える。

## Scope

段ごとの対象と直し方。各段の表の「結果」列は実装の run が「直した」か「残す（理由）」で埋める（AC-S0-1）。直す前に、主張の根拠（正本・`docs/project-memory.md`・公式の資料）を `rg` か実読で確かめ、確かめられなければ直さずに「残す（未確認）」とする。新しく書く文の引用は D-125・`docs/DOC_STYLE_GUIDE.md` §1 の形（path と symbol、節の ID か見出し）。新しい文言に作業の印の語（AC-S9-1 の command が探す 7 語）を使わない。

### S1 座組表の Fable を当面 Fable 5 にする（TD-410）

規則: 座組表の注記「モデル更改時は owner 決定を受けてこの表だけを書き換える。座組・effort を他の文書へ複製しない」。`docs/AGENT_OPERATING_MANUAL.md` の `## 座組` の節（表と直後の箇条）の中だけを直す。

公式の資料（2026-10-24 に読んだ）:

- [sub-agents](https://code.claude.com/docs/en/sub-agents)「Choose a model」: frontmatter の `model` は alias（`fable` ほか）か full model ID を受ける。呼出しごとの `model` は定義の frontmatter より優先される（順は「per-invocation `model` parameter → 定義の `model` frontmatter → `CLAUDE_CODE_SUBAGENT_MODEL` → main の model」）。
- [advisor](https://code.claude.com/docs/en/advisor)「Choose an advisor model」: main が Opus 5 / Opus 5.5 なら advisor に Fable を受ける。alias（`fable` ほか）は Claude Code の built-in default version に解決され、full model ID も渡せる。
- [Fable 5 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)「Consider all effort levels」: 多くの作業の既定を `high` にする。
- 発注の前提（Coordinator の発注書、2026-10-24）: Agent tool の `model: "fable"` は Fable 5.1 になる。main の checkout にある相談役の定義（`consult-fable5`、tracked でない）は frontmatter が `model: claude-fable-5`・`effort: high`・`disallowedTools: Edit, Write, NotebookEdit`。

| # | 場所（`843c4938` の行） | 今の句 | 直す向き | 結果 |
|---|---|---|---|---|
| S1-1 | Final Reviewer の行の「Codex 稼働時の担当」の列（72） | 「Claude 側は R3 以上と design lane で Fable 5.1」「closure（base 同期を含む）の Claude 側の既定は Fable 5.1（owner 2026-09-25）」 | 2 か所の「Fable 5.1」を「Fable 5」にする。owner の日付（2026-09-25）は枠の決定の出所として残す。ほかの句（Fable が使えないときの代え方、発注と実効 model が違う run の扱い、Codex の本務）は変えない | |
| S1-2 | 同じ行の effort の列（72） | 「Fable 5.1 = high（owner 2026-09-25。定義を使わず session の値を継承）」 | 「Fable 5 = high（owner 2026-09-25。起動は相談役の行と同じ定義の `effort: high`）」の向き。「定義を使わず session の値を継承」は Fable 5 の起動（定義で model を決める）と合わないので外す | |
| S1-3 | 相談役の行の担当の列（73） | 「Fable 5.1。」と、advisor の句「使う場合は main の Opus 5.5 に Fable 5.1 を組み」 | 頭を「Fable 5（当面。owner 2026-10-24、repo 外の回答台帳 TD-410）」にし、起動の句を足す（向き: 「起動: frontmatter に `model: claude-fable-5` と `effort: high` を書いた subagent の定義で起動し、Agent tool の呼出しで `model` を渡さない（呼出しの `model` は定義の frontmatter より優先され、alias の `fable` は Fable 5.1 になる。公式 [sub-agents](https://code.claude.com/docs/en/sub-agents)「Choose a model」）。実効 model を run 報告に記録する」）。advisor の句は「Fable 5（full model ID `claude-fable-5`。alias の `fable` は Fable 5.1 になる、公式 advisor「Choose an advisor model」）を組み」の向き。定義の file の名は書かない（tracked でない。Non-scope） | |
| S1-4 | 表の後の「確認日」の箇条（76） | 「確認日: 2026-09-30。担当と effort は owner 決定 2026-09-07 / 08・14・23・24・25・30 による。」 | 確認日を 2026-10-24 にし、owner 決定の列に「2026-10-24（Fable を当面 Fable 5 に。repo 外の回答台帳 TD-410）」を足す | |
| S1-5 | 「根拠」の箇条（80） | 「Fable 5.1 prompting guide への link（URL の末尾 `prompting-claude-fable-5-1`）」 | 「[Fable 5 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5)「Consider all effort levels」」にする | |

直さない: 「Fable は context を絞った subagent の発注で使い、advisor は常用しない」の箇条（79）は版を書かない。decision-log の D-092 の Decision と Why の「Fable 5.1」は決定の本文（append-only、D-126）。backlog と archive の「Fable 5.1」は誰が review したかの記録。並走の lane の packet の `Final Reviewer` の値（下の「他の lane との所有」）。

sweep（`843c4938` で `rg -n 'Fable' --glob '!docs/archive/**' --glob '!node_modules' .`）: 座組の値として「Fable 5.1」を書くのは `docs/AGENT_OPERATING_MANUAL.md` の 72・73・80 の 3 行（`rg -o 'Fable 5\.1' docs/AGENT_OPERATING_MANUAL.md | wc -l` が `6`）だけ。`AGENTS.md`・`CLAUDE.md`・`docs/templates/**`・`.claude/rules/**`・`.agents/**`・`scripts/**` に「Fable 5.1」は無い（`scripts/tests/doc-consistency-plan-packet.test.sh` の `Fable 5（fixture coordinator）` は PK4 の fixture の文字列で、座組の値でない）。tracked でない `.local/codex-orders/templates/subagent-review.md`・`codex-review.md` は「Fable 5.1」を書くが、本 lane の外（起票の報告で Coordinator へ渡した）。

### S2 ARCHITECTURE §4 の決まった 2 項を外す（backlog 109 行の項目）

出所: backlog の「`docs/ARCHITECTURE.md` §4 の宅急便部門の項を整理する」（PR #195 の Plan Review round 1 の P3 F4）。同じ項目が「同じ節の IO-04 の項も決まった中身で、一緒に扱うかは着手のときに決める」と書くので、本 lane で一緒に扱うと決める（理由: どちらも中身が決まり、今の正本が持つ。項を残すと、§4 の節が決まった事項をまだ決まっていない事項と読ませる。D-127）。

| # | 場所（`843c4938` の行） | 今の句 | 直す向き | 中身の置き場（確かめた所） | 結果 |
|---|---|---|---|---|---|
| S2-1 | `## 4. 未確定事項` の IO-04 の項（299） | 「IO-04（PLUフォーマッター）: 2026-07-03 field gate により…`.txt`、11列、13桁JAN必須、通常PLU216枠使用時217始まりの profile と…一連フローを確認済み。アプリはPCツール受理やレジ反映を自動検知しないため、保存後のapp-side confirmationは利用者の明示操作に分離する。」 | 項を外す | profile と手順は [67](../function-design/67-ui-plu-export.md) UI-08-D3（11 列・217 始まり・13 桁 JAN 必須・field gate の手順）と [25](../function-design/25-io-plu-formatter.md)。保存後の確認を利用者の明示操作に分けることは 67 の関数要求（「利用者が保存済み扱いを明示した後にだけ `confirm_plu_export_saved` を呼ぶ」）と UI-08-D1・UI-08-D2。同じ file の §2 のタスク一覧の IO-04 の行も profile を書く | |
| S2-2 | 同じ節の宅急便部門の項（300） | 「宅急便部門: ~~在庫管理対象かどうか利用者返答待ち~~ → 在庫管理対象外と確定（2026-04-10）。サービス取次であり追跡すべき在庫が存在しない。departmentsにはZ005対応で残すがcode_prefix=NULL」 | 項を外す | [master-tables](../db-design/master-tables.md) の「初期データ（全21部門、C-1/C-3 2026-03-29 確定）」の部門 12 の行（`NULL`、「在庫管理対象外。サービス取次（ヤマト/佐川）。Z005に載るがシステムでは追跡しない」）。code の初期データも PR #195 で `NULL` | |

節の見出しと Q40 の項は残す（Q40 は backlog の項目を引く、まだ開いた事項）。§4 を引く link と文は他に無い（`843c4938` で `rg -n 'ARCHITECTURE[^ ]*( |` )?§ ?4|ARCHITECTURE.md#4' docs --glob '!docs/archive/**'` は backlog の 109 行の項目だけを出し、それは S5 で外す）。

### S3 backlog の ECR+ の精算の項目の前提を店の事実に合わせる（backlog 172 行の項目）

出所: 同じ項目の「「精算に ECR+ が要る」とする文は、project-memory への link の 2026-10 の観測（スマホを切ってレジ本体だけで精算できた日がある）と合わない。次の docs の lane で直す（2026-10-20）」。食い違う文は、この項目自身の「店主は精算に ECR+ を要すると答えている（project-memory への link Store Premises Facts）ため、ECR+ の終了後に精算を続けられるかを確かめる」（`843c4938` で `rg -n 'ECR\+.{0,40}精算|精算.{0,40}ECR\+' --glob '!docs/archive/**' .` が出す docs の外の行は `docs/project-memory.md` の 2 行と本項目だけ。project-memory の 2 行は 2026-10 の観測を既に書いている）。

| # | 今の句 | 直す向き | 根拠 | 結果 |
|---|---|---|---|---|
| S3-1 | 「店主は精算に ECR+ を要すると答えている（project-memory への link Store Premises Facts）ため、ECR+ の終了後に精算を続けられるかを確かめる。」 | レジ本体だけで精算できることは 2026-10 に確かめた（店主の 2026-03 の答えと違った）と書き、残る論点を「ECR+ の終了の後に、送信の失敗の印字と SD の控えがどう積もるか」にする。どちらも project-memory を引き、回数・日付の細部は写さない | `docs/project-memory.md` の Store Premises の ECR+ の行（2026-03 の店主の答えと、2026-10 のレジ本体だけの精算）と、同じ file の「一方、店主は精算に ECR+ を要すると答えていたが…」の行（終了の後の積もり方は未確認で、backlog のこの項目に置く） | |
| S3-2 | 「「精算に ECR+ が要る」とする文は、…次の docs の lane で直す（2026-10-20）。」 | 外す（S3-1 で直したので役目が終わる。D-127） | — | |

項目の名（「ECR+ のサービス終了後の精算」）、CASIO の公式ページの句、ジャーナル閲覧の代替の句、「導入の後でよいと確かめた」の句は変えない（project-memory が「`docs/backlog.md`（ECR+ のサービス終了の項）」と名で引く）。

### S4 棚卸しの期間の旧表記を 73 §73.1 に合わせる（backlog 193 行の項目）

出所: backlog の「期間・動線の旧表記の残り 7 か所を店の事実に合わせる」（PR #93 の Non-scope と Final Review broad の申し送り）。店の事実の正本は [73](../function-design/73-ui-stocktake.md) §73.1（「一人で商品マスタ全件（数千点規模）を回り、10月からの準備（…）と、年末の正式カウント（大晦日に完了）に分かれる」）と `docs/SCREEN_DESIGN.md` の `### 利用者の1日の動線`。

| # | 場所（`843c4938` の行） | 今の句 | 直す向き | 結果 |
|---|---|---|---|---|
| S4-1 | `docs/architecture/biz-task-specs.md` BIZ-06 の「理由」（453） | 「年末棚卸し（10月〜大晦日の長期作業）で、」 | 「年末棚卸し（10 月からの準備と、大晦日に終える正式カウントに分かれる。[73](../function-design/73-ui-stocktake.md) §73.1）で、」の向き | |
| S4-2 | `docs/db-design/tracking-system-tables.md` の stocktakes + stocktake_items の「役割」（133） | 「年末棚卸しの記録。10月〜大晦日の長期作業に対応する中断・再開機能付き。」 | 「年末棚卸しの記録。一人で数千点の商品を回る作業（10 月からの準備と、大晦日に終える正式カウント。[73](../function-design/73-ui-stocktake.md) §73.1）に対応する中断・再開機能付き。」の向き | |
| S4-3 | `docs/SCREEN_DESIGN.md` 棚卸しの画面の「利用者配慮」（218） | 「一人運用・数週間スパンの反復作業を前提に、」 | 「一人で数千点の商品を回る反復作業（73 への link〈`function-design/73-ui-stocktake.md`〉 §73.1）を前提に、」の向き（link は SCREEN_DESIGN からの相対 path） | |

backlog の項目の 7 か所のうち、本 lane で直さないもの:

- `docs/function-design/35-biz-stocktake-service.md` の force_fill の設計判断の「年末棚卸しは10月〜大晦日の長期作業。…」（377）: 並走の PR #188（`agent/stocktake-count-runtime-b`、`c667d52c`）の差分がこの行を外す（`gh pr diff 188` の `-` の行）。本 lane は 35 を触らない。
- `src-tauri/src/biz/stocktake_service.rs` の module doc の「年末の長期作業（10月〜大晦日）で、…」（4）: code の file で、本 lane（docs だけ）の外。PR #188 が同じ module doc の隣の行（3 行目と 6 行目以降）を書き換えるので、今直すと #188 の base 同期で衝突する。#188 の merge の後に同じ file を触る lane で直す（S5 で backlog の項目に残す）。
- `docs/screen_mockups.html` の図の「10月〜大晦日」（208）とボタン説明「閉店後にレジのCSVを読み込む」（259）: 初期提案の歴史資料で、今の画面の図でない（`docs/SCREEN_DESIGN.md` の頭の「このファイルの目的」、`docs/architecture/ui-task-specs.md` の頭、[52](../function-design/52-ui-shared-layout.md) の「モックアップアーカイブ扱い」「触らない」の行）。当時の提案の記録として残す。

### S5 backlog の項目を直す

| # | 項目（`843c4938` の行） | 直す向き | 結果 |
|---|---|---|---|
| S5-1 | 「`docs/ARCHITECTURE.md` §4 の宅急便部門の項を整理する」（109） | 項目を外す（S2 で済む。残りが無い） | |
| S5-2 | 「期間・動線の旧表記の残り 7 か所を店の事実に合わせる」（193） | 残りだけを書く項目にする: `src-tauri/src/biz/stocktake_service.rs` の module doc の期間の句（code comment 1 行。PR #188 の merge の後に同じ file を触る lane で直す）。35 の句は PR #188 が外し、mockup の 2 か所は歴史資料として残す、と 1 文で添える。本 lane が直した 3 か所の名と、PR #93 の起源の句の長い列挙は外す（本 packet に残る） | |

S3 は項目そのものを直す段なので、S5 に入れない。

### 他の lane との所有

並走の Draft の PR（`843c4938` の時点で #172・#188・#190・#193・#194・#196・#197・#198・#201・#202）と予定の path の重なりを `comm -12` で見た（`gh pr diff <N> --name-only`）。重なりは下の 4 file。どの PR の差分も本 lane の対象の行を `+`/`-` に持たない（`gh pr diff` の差分を対象の句〈`10月〜大晦日`・`数週間スパン`・`ECR+ のサービス終了`・`宅急便部門`・`IO-04（PLUフォーマッター）`・`§4 の宅急便`・`期間・動線の旧表記`〉で `rg` して、#188 の 35 の行の外は何も出ない）。

| file | 重なる PR（head） | 本 lane の行と並走の hunk |
|---|---|---|
| `docs/ARCHITECTURE.md` | #172（`8fd5b875`）・#188（`c667d52c`）・#198（`16d7dd00`） | 並走の hunk は頭・§2 の表・§3 の依存。§4 に hunk は無い |
| `docs/SCREEN_DESIGN.md` | #172・#188・#198 | #188 が棚卸しの画面の「現行 build では一時停止中」の 1 行を外し、本 lane の S4-3 の行とは 1 行離れる（間に「利用者配慮」の見出しの行）。#172・#198 の hunk は離れた節 |
| `docs/architecture/biz-task-specs.md` | #172・#188 | #188 は頭の 8 行、#172 は BIZ-08 の辺り。BIZ-06 の「理由」に hunk は無い |
| `docs/db-design/tracking-system-tables.md` | #188・#198 | #188 の hunk は頭・29 行の辺り・140 行以降、#198 は 225 行の辺り。133 行の「役割」に hunk は無い |
| `docs/backlog.md` | #172・#190・#196・#198 | 本 lane の 3 つの項目（109・172・193）の行は、どの PR の差分にも無い |
| `docs/AGENT_OPERATING_MANUAL.md` | なし | — |

並走の lane の packet（#172・#188・#190・#196・#198）の `Final Reviewer` の行は「Fable 5.1」を値に持つ。本 lane は触らない（各 lane の packet の値で、所有は各 lane。TD-410 を各 lane に写すかは Coordinator が決める）。同じ file を触る lane は、後に merge する方が `origin/main` の単段 merge で同期する（`docs/DEV_WORKFLOW.md` Wave Operation）。

## Non-scope

- code・migration・bindings・route・画面の文言（`src-tauri/src/biz/stocktake_service.rs` の module doc を含む。S5-2 で backlog に残す）。
- 35 の force_fill の句（PR #188 が外す）と `docs/screen_mockups.html`（歴史資料）。
- `.claude/agents/` の相談役の定義（`consult-fable5`）を tracked にするか。座組表は定義の file を名で引かず、frontmatter の形だけを書く（S1-3）。tracked にするなら、classifier が `.claude/agents/*` を full の areas にする（`scripts/ci/classify-changes.sh` の 1 つめの `case`）ので、別の判断として Coordinator・owner が決める。
- 座組表の外の「Fable 5.1」（decision-log の決定の本文、backlog と archive の記録、並走の lane の packet、tracked でない `.local/` の雛形、owner の個人の `~/.claude/CLAUDE.md`）。
- backlog の「squash merge の subject 明示」の項目（「DEV_WORKFLOW の Ready/merge 手順への 1 行追記は docs 小口候補」）: 今の merge は helper（`scripts/pr-gate.py` の `merge` が `gh pr merge --squash --match-head-commit` を呼び、`--subject` を渡さない）だけを通るので、項目の「`--subject` で明示する運用に固定」は今の経路と合わない。直し方（DEV_WORKFLOW に PR title を conventional にする 1 行を足す／項目を外す）は workflow の正本の選択で、owner か Coordinator が選ぶ（起票の報告に選択肢を挙げた）。
- backlog の「単位の拡張の残りの申し送り」の子の「S7 の対象の行の外に残る古い型・SQL・表示例」（「小口のまとめで行う」）: docs の小口でなく、4 つの function-design と code の照合が要る。別の lane で扱う。
- backlog の「`docs/Plans.md` の `### Wave Registry` が見出しと形式の行だけになる」: closeout の手順（`docs/DEV_WORKFLOW.md` Post-Merge Closeout）と PK4 の test（`scripts/tests/doc-consistency-plan-packet.test.sh`）が見出しを使い、workflow の変更になる。
- `docs/Plans.md`（lane ごとの行を置かない、D-097）。

## Acceptance Criteria

baseline は起点 `843c4938` で下の command を逐語で実行した出力。git の差分の範囲は `origin/main...HEAD`（merge-base から HEAD まで。並走の lane が main に足した変更を数えない）。

- AC1: `bash scripts/doc-consistency-check.sh` が exit 0、末尾の WARN の件数が 12 以下（baseline: exit 0、「結果: WARN 12 件（ERROR なし）」）。
- AC2: `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-24-docs-small-batch-2.md` が exit 0。
- AC-S0-1: Scope の各段の表の「結果」列が全行埋まっている（読んで確かめる）。
- AC-S1-1: `rg -o 'Fable 5\.1' docs/AGENT_OPERATING_MANUAL.md | wc -l` が `2` で、`rg -o 'Fable 5\.1 になる' docs/AGENT_OPERATING_MANUAL.md | wc -l` も `2`（残る「Fable 5.1」は S1-3 の alias の注の 2 つだけ。baseline: 前者 `6`、後者 `0`）。
- AC-S1-2: ``rg -c '`claude-fable-5`' docs/AGENT_OPERATING_MANUAL.md`` と `rg -c 'TD-410' docs/AGENT_OPERATING_MANUAL.md` がどちらも 1 以上、`rg -c 'prompting-claude-fable-5\)' docs/AGENT_OPERATING_MANUAL.md` が `1`（baseline: 3 つとも何も出さない、exit 1。backtick 付きで探すのは、今の根拠の link の `prompting-claude-fable-5-1` に当たらないようにするため）。
- AC-S1-3（`## 座組` の外を変えていない）: `git diff -U0 origin/main...HEAD -- docs/AGENT_OPERATING_MANUAL.md` の hunk の行の範囲（`@@` の行の `+` 側）が、全部 `rg -n '^## 座組$|^## 4\. 既存資産 router 表$' docs/AGENT_OPERATING_MANUAL.md` が出す 2 行の間に収まる（baseline: 65 行と 82 行。読んで確かめる）。

- AC-S1-4（読んで確かめる）: 座組表の Fable の枠の規則（Final Reviewer の Claude 側の充て方の条件〈R3 以上・design lane・closure〉、Fable が使えないときの代え方、発注と実効 model が違う run の扱い、相談役を Writer・reviewer の数に入れないこと、effort の値 high）が変わっていない。S1-3 の起動の句が S1 の公式の資料の読みと合う。
- AC-S2-1: `rg -n -e '^- \*\*IO-04（PLUフォーマッター）\*\*' -e '^- \*\*宅急便部門\*\*' docs/ARCHITECTURE.md` が何も出さない（exit 1。baseline は 2 行: 299・300）。`rg -c '^- \*\*Q40（障害時の対応）\*\*' docs/ARCHITECTURE.md` が `1`（baseline: `1`）。
- AC-S2-2（読んで確かめる）: S2 の表の「中身の置き場」が直した時点の正本にあり、外した項の中身（PLU の profile と手順、保存後の確認を利用者の操作に分けること、宅急便部門の `code_prefix=NULL` と在庫管理対象外の理由）を失っていない。
- AC-S3-1: `rg -n -e 'ECR\+ を要すると答えている（' -e '次の docs の lane で直す' docs/backlog.md` が何も出さない（exit 1。baseline は 1 行: 172）。`rg -c '^- \*\*ECR\+ のサービス終了後の精算\*\*' docs/backlog.md` が `1`（baseline: `1`）。
- AC-S3-2（読んで確かめる）: S3 の直した文が `docs/project-memory.md` の ECR+ の 2 行と合い、店の運用の細部（精算した日・回数）を写していない。
- AC-S4-1: `rg -n -e '10月〜大晦日' -e '数週間スパン' docs/architecture/biz-task-specs.md docs/db-design/tracking-system-tables.md docs/SCREEN_DESIGN.md` が何も出さない（exit 1。baseline は 3 行: biz-task-specs:453・tracking-system-tables:133・SCREEN_DESIGN:218）。
- AC-S4-2: `rg -c '73-ui-stocktake.md\) §73.1' docs/architecture/biz-task-specs.md docs/db-design/tracking-system-tables.md docs/SCREEN_DESIGN.md` が 3 file でそれぞれ 1 以上（baseline: 何も出さない、exit 1）。読んで確かめる: 新しい句が 73 §73.1 に無い期間・作業量（例: 正式カウントの日数）を書いていない。
- AC-S5-1: `rg -n -e 'ARCHITECTURE.md` §4 の宅急便部門' docs/backlog.md` が何も出さない（exit 1。baseline は 1 行: 109）。
- AC-S5-2: `rg -c 'stocktake_service.rs' docs/backlog.md` が 1 以上で、その行が期間の旧表記の項目にある（baseline: `1`、同じ項目の今の列挙。読んで確かめる）。`rg -n -e 'biz-task-specs.md:451' -e 'tracking-system-tables.md:137' -e 'SCREEN_DESIGN.md:213' docs/backlog.md` が何も出さない（exit 1。baseline は 1 行: 193）。
- AC-S9-1（新しい文言）: `git diff origin/main...HEAD -- docs ':!docs/plans/**' | rg '^\+' | rg -n 'T[O]DO|T[B]D|F[I]XME|H[A]CK|未確[定]|要確[認]|要検[討]'` が何も出さない（exit 1）。文字の組の形は、本 packet の文が doc check の印の検査に当たらないようにするためで、探す語は 7 語のまま。
- data safety: `git diff --name-only origin/main...HEAD` が上の 6 file と本 packet だけ（docs だけ）。店の運用の細部・実値・発言の原文を書いていない。

## Design Readiness

- 引用する設計正本（節まで）: `docs/AGENT_OPERATING_MANUAL.md` `## 座組`（表と直後の箇条）と §3.3（S1）、[67](../function-design/67-ui-plu-export.md) の関数要求・UI-08-D1〜D3、[25](../function-design/25-io-plu-formatter.md)、[master-tables](../db-design/master-tables.md) の「初期データ（全21部門、C-1/C-3 2026-03-29 確定）」（S2）、`docs/project-memory.md` の Store Premises の ECR+ の 2 行（S3）、[73](../function-design/73-ui-stocktake.md) §73.1 と `docs/SCREEN_DESIGN.md` の `### 利用者の1日の動線`（S4）。
- 必要な設計成果物: Design artifact selection の当たる行は無い（振舞い・command・DB・画面・format を変えない）。状態は existing sufficient。
- plan にしかない durable な判断の昇格先: 本 packet が決める判断は 2 つ。(1) S2 で IO-04 の項も一緒に外す（backlog の項目が「着手のときに決める」とした事項。昇格先は ARCHITECTURE §4 そのもの）。(2) S4 で 35・code comment・mockup を直さない（理由は本 packet と、S5-2 で直す backlog の項目に残る）。どちらも規則の新設でなく既存の規則（D-127、歴史資料の扱い）の適用。S1 の owner の決定は座組表そのものが置き場（表の注記の経路）で、decision-log には足さない。
- 前提・制約と延期した gap: `stocktake_service.rs` の module doc の句は PR #188 の merge の後に直す（S5-2）。送っても安全な理由: comment で振舞いに効かず、#188 が同じ module doc を書き換えている。
- 絶対保証の自己点検: S1-3 の「alias の `fable` は Fable 5.1 になる」は、公式の資料の「alias は built-in default version に解決される」と発注の前提（2026-10-24）に基づく時点の事実で、Claude Code の版で変わり得る。表の既存の規則（発注と実効 model が違う run は数えず取り直す、実効 model を run 報告に記録する）が、変わったときの検出を持つ。
- 判定: ready。

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| source / workflow doc 新設・改名・削除 | 親文書の目次・索引 | 本 packet の新設だけ（`docs/plans/` の dated packet で、索引は持たない。D-097） |

ほかの行（Tauri command、function-design の新設、REQ / coverage、route、operator 画面）は該当なし（function-design を触らず、REQ の参照を増減させない）。

## Impact Review Lenses

not applicable: 起点は現地調査・実機確認・外部 tool の振舞いでなく、owner の座組の決定（TD-410）と repo の中の docs の照合。S3 の店の事実は `docs/project-memory.md` の既存の行を引くだけ。S1 の Claude Code の振舞いは公式の資料（S1 の一覧）で確かめた。

## Boundary / Wire Contract

変えない。JSON・CSV・config・manifest・DTO・bindings・DB に触れない。

## Test Plan

Test Design Matrix は置かない（R2 で任意。各段の AC が `rg` の件数と読んで確かめる項目で直した所を確かめる）。

- targeted tests: AC1・AC2。code と function-design を変えないので Rust・frontend の test と traceability の検査は足さない（hosted の Draft run が classifier の分類どおりに docs と workflow の suite を回す）。
- negative tests: AC-S1-1・AC-S2-1・AC-S3-1・AC-S4-1・AC-S5-1・AC-S5-2・AC-S9-1（旧い表現・禁じた語が残らないこと）、AC-S1-3（`## 座組` の外を変えていないこと）。
- compatibility checks: AC1（link の先の file の実在）。
- data safety checks: 上の data safety の AC。
- main wiring/integration checks: AC-S2-2（外した項の中身の置き場）、AC-S1-4（座組表の規則が変わらない）。

起票の run の検証（AC1・AC2 と `bash scripts/check-workflow-git.sh`）の結果は PR の Validation の欄に書く。

## Review Focus

- S1: 起動の句（frontmatter の `model: claude-fable-5`・`effort: high`、呼出しで `model` を渡さない）が公式の資料と合うか。座組表の規則（枠の本数・独立性・代え方・effort）を変えていないか。R2 の判定（座組表の model の値の更改は workflow gate に触れない）が成り立つか。座組表の外に、座組の値として「Fable 5.1」を書く tracked の所が残っていないか。
- S2: IO-04 の項を一緒に外す判断と、外した中身が 67・25・master-tables で辿れるか。
- S3: 直した前提が project-memory の 2 行と合い、残る論点を落としていないか。
- S4: 新しい句が 73 §73.1 の店の事実の範囲に収まるか。35・code comment・mockup を直さない理由が成り立つか。
- Q1（D-127）: この変更で不要になる記述・条件は無いか。例: S1-2 の「定義を使わず session の値を継承」（Fable 5 の起動と合わないので外す）、S3-2 の「次の docs の lane で直す」の句、S5 の済んだ backlog の項目。
