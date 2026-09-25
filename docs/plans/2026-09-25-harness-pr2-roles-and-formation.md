# Plan Packet: 座組と役割の書き直し（ハーネス刷新 PR2、R3）

2026-09-25 起草。出典は harness 監査（2026-09-24、fresh Opus 5.5、local-only の報告。要点は本 packet に書き下した）の §3.F / 3.G / 3.H / 3.K / 3.N / 3.O、§4、§5、§7 の PR2 行と、owner 決定 2026-09-23（Opus = Opus 5.5 を Coordinator / Writer / review へ全面解禁、Sonnet 5 / Opus 5 は座組から退役、Fable 5.1 は難所の相談役、Codex 稼働時の Plan Review = fresh Opus + Codex〈GPT-6 Astra〉、Final Review = fresh Opus + Codex〈GPT-6 Sol 既定・難所は Astra〉、Codex 停止中は Plan Review を Opus のみで進め Final Review だけ待つ、effort は Coordinator = high・Writer / reviewer = medium）・2026-09-24（規則は環境が変わるたびに変える。安全境界は維持する。push と Draft PR の作成は Coordinator に委任。P1/P2 の差し戻しで是正を書く前に Fable へ反例探しを頼む）・2026-09-25（Ready から merge・closeout までは owner の承認の後 Coordinator が helper で代行。Final Review の Claude 側は R3 以上と design lane で Fable 5.1、closure の Claude 側の既定は Fable 5.1。Codex の合否は是正の後も外さない。Plan Review の Codex は owner の指定で Sol にできる。Writer・レビューの Opus の medium は定義 file を置く PR5 まで実効しないと書いて進める）。Codex の effort は owner 決定 2026-09-07 / 08（Astra は既定 medium、難所 high）と 2026-09-14（Sol は既定 high）。PR3「入口と重複」と並走する（owner 2026-09-25「PR2とPR3の並列はやろうかな」）。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（worktree `.claude/worktrees/harness`、branch `agent/harness-pr2-roles`、fork でない、effort medium。Agent tool から直接起動すると session の high を継承するため、実効値を run 報告に記録する）
- Plan Reviewer: Opus 5.5（fork でない fresh subagent、Writer と別 context）+ Codex（GPT-6 Sol、effort high。owner 指定 2026-09-25）
- Final Reviewer: Fable 5.1（fresh subagent）+ Codex（GPT-6 Sol 既定、難所は Astra）。互いに独立な Double Audit で、後の reviewer に先の結果を見せない（S1 の独立性の規則を本 PR 自身にも適用する）。run の報告に実効 model を記録し、Fable から別 model へ切り替わった run は Fable の本数に数えず取り直す
- Final Review Minimum: 2
- Human Gate: ready,merge

manual なし: 製品の runtime・画面・配布物は変わらない。Final Review Minimum 2 は classifier が方針 docs（`docs/AGENT_OPERATING_MANUAL.md`・`docs/DEV_WORKFLOW.md`・`docs/agent-guidance/**`・`docs/templates/**`）を `workflow=true` にし、helper が 2 を要求するため（`docs/project-profile.md` の Risk と、監査 §0-7）。

decision-log の番号予約: 本 PR は **D-092** を使う。D-091 は並走 PR #98（デザインの決まり）、D-093 は並走 PR3 が使う（DEV_WORKFLOW Review Rules「連番契約 registry の採番を後続 lane が確定する」の起草時予約）。

座組と現行規則の不一致（append-only の記録）: 本 packet の座組は上の owner 決定による。現行の `docs/AGENT_OPERATING_MANUAL.md:38`（D-056: 高自律・低制約適性 slot = Opus は read-only の Reviewer / Explorer 専任）・`:37` / §3.1（希少 slot の投入条件）・§3.4 の slot 表（Sonnet 5 / Opus 5）とは衝突する。owner 決定 2026-09-24 により owner の現行決定を優先し、その規則を書き換えるのが本 PR である。

遷移記録（append-only）:

- kickoff → spec-check → plan-draft → plan-gate（本 commit、plan-first、2026-09-25、Coordinator 補助の起草役）: Risk R2（下記 Risk）。書き換える正本は workflow 文書そのもので、規則の中身は owner 決定と監査で決まっており、owner の設計判断を要する未決の論点は無い（spec-check → plan-draft の唯一の skip。Design Readiness 参照）。`docs/Plans.md` の wave 13 に登録した。次は Plan Review（fresh Opus + Codex〈GPT-6 Astra〉）。
- plan-gate（2026-09-25、Coordinator の指示で是正）: Plan Review round 1 は両 reviewer とも reject。plan-gate のまま packet を是正した。findings と裁定の詳細は round 2 の完了後に Review Response へ記録する。

## Owner Effort Budget

- 介入回数上限: 4（消費 1 = owner の起票承認 2026-09-25「PR2とPR3の並列はやろうかな」。見込み: Plan Review の Codex relay 1、Final Review の Codex relay 1、Ready・merge の承認 1）
- 実働時間上限: 15分（文書だけの変更で、owner の作業は Codex の起動 1 行と Ready・merge の判断に限られる見込み）
- relay 往復上限: 4（Plan Review と Final Review の両方に Codex を置き、是正の後の Codex の取り直しも relay になるため。順調なら Plan Review 1、Final Review 1）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

本 PR は §5.5 相談窓口役を削除し、template の §5.5 の使用指示 2 行（`docs/templates/plan-packet.md:34`・`:125`）を相談役への参照に替える（S7）。template の本節の見出しと 2 欄は PR4 が消すまで残るため、値だけ置く。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
reviewer の充当（Final Review の Claude 側を R3 以上で Fable 5.1 にする、Codex の合否を是正後の取り直しでも外さない）、Double Audit の独立性、D-062(c) の Plan Reviewer の規則、Human Gate の委任の参照、Subagent Budget の数値上限の撤去を書き換える。どれも merge の可否を左右する review の規則で、`docs/DEV_WORKFLOW.md` Risk Tiers の「If uncertain between R2 and R3, choose R3 when the change touches ... workflow gate」に当たる（D-090 の lane と PR1 も同じ判定で R3）。変更は文書だけで、`scripts/**`・`.github/**`・classifier・helper は変えず、checker / pre-push / helper / hosted CI の判定式は変わらない。方針 docs に触るので helper は Final Review Minimum 2 を要求する（R3 でも本数は同じ）。MANUAL の文字列を検査する test（`scripts/tests/doc-consistency-plan-packet.test.sh:842-843` の `one-shot irreversible` / `task-shape`、`scripts/tests/claude-hooks.test.sh:30-54` の禁止句）は、要求を満たす文面にして test 側は変えない。R4 には当たらない（data・secret・不可逆操作なし）。

Review-only skipped because: R3 の review-only sub-agent は、Final Review の Double Audit の broad（Fable 5.1 と Codex の 2 本、どちらも Contract Audit を正本から行う）が兼ねる（`docs/DEV_WORKFLOW.md` Review Rules・Draft PR Checkpoint、`docs/code_review.md:73`）。

## Goal

Goal Invariant:

### 最小完了条件

- 本 PR の merge 後、Coordinator が R2+ packet を起票するとき、`docs/AGENT_OPERATING_MANUAL.md#座組` の表 1 つを読めば、Coordinator / Writer / Plan Reviewer / Final Reviewer / 相談役 / Human Gate の担当・effort と、Codex 停止中の進め方が決まる。その表は owner の現行決定（2026-09-07 / 08・14・23 / 24 / 25）と一致し、本 PR の所有 file の範囲では、座組・model・effort の値を定める記述はこの表だけになる（CLAUDE.md の effort 節は PR3 がこの anchor への参照に替える。Non-scope）。
- Double Audit の後の reviewer に先の reviewer の結果を見せない規則が、MANUAL の独立性の節と review packet の両方に置かれ、次の Final Review の発注でそのまま使える。
- 退役した仕組み（Execution Mode 3 値の定義、D-056 の Opus read-only 専任、希少 slot の投入条件、§5.5 相談窓口役、§5.7 変則 provenance 監査、Astra 主担当、Subagent Budget の数値上限、D-062(c) の `codex-only` 句）を手順として指示する文が、MANUAL・DEV_WORKFLOW・agent-guidance・review packet・plan-packet template の §5.5 使用指示に残らず、decision-log D-092 がその退役と残すものを列挙する。

### 失敗定義

- 残すべき独立性・安全境界（Writer ≠ Plan Reviewer ≠ Final Reviewer、自己承認禁止、fresh context、Double Audit、Human Gate は owner、depth 1、one-writer、load-bearing 判断の正本直読み、hook 0 本と plugin 無効化、advisory hook の推定禁止と hook が review を強制しないこと、one-shot irreversible の task-shape と不可逆 mutation の直前の owner 判断、Writer が編集前に止まったときの番号付き手順 1〜3、発注直前の照合〈必須 command の出力先が編集禁止範囲に入らない〉）のどれかが文書から消える、または弱まる。
- 座組表が owner 決定と食い違う、または座組・effort の規則や effort の値が 2 か所以上に残る（本 PR の所有 file の範囲で）。
- 本 PR が PR3 / PR4 / PR5 の所有 file を編集する（所有表の例外 = `docs/templates/plan-packet.md:34`・`:125` と archive の 1 行を除く）、または PR3 と同じ行を取り合う。
- MANUAL の書き直しで既存の test（`doc-consistency-plan-packet.test.sh:842-843`、`claude-hooks.test.sh`）や link 検査が落ちる。
- 本 PR 自身の Final Review で、後の reviewer が先の結果を読んで独立性が崩れる（PR #97・#94 の再発）。

### 非目的

- 入口と重複の整理（AGENTS / CLAUDE / `.claude/**` / `.agents/**` / code_review / review-checklist / pr-review-prompt / PR template / project-profile）: PR3。CLAUDE.md の effort 節を `docs/AGENT_OPERATING_MANUAL.md#座組` への参照に替えるのも PR3。
- 手続きの軽量化（plan-packet template〈`:34`・`:125` を除く〉、Owner Effort Budget の数値、Review Rules の 3 分類、review-only と Final の統合、Findings Freeze、Wave Operation、Post-Merge Closeout、WER）: PR4。
- classifier の穴（`.claude/agents/**`）、helper の自己検査の穴、`.claude/agents/{reviewer,writer}.md` の新設による subagent ごとの effort 指定（`.gitignore:116` の除外の解除と一緒）: PR5。
- 新しい gate・checker・test の追加。独立性の規則は文書の規則として置き、機械の検査にしない。
- 過去の decision-log 本文と archive の書き換え（S3 の archive の 1 行を除く）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

workflow の変更なので、発注 → 停止と訂正 → review → owner 判断の通常列を、本 PR の merge 後の文書で書く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 本 PR merge 後、新しい R2+ の依頼 | Coordinator（Opus 5.5、high）が `#座組` の表で Workflow State の 4 役を書き、plan-first commit を push、Draft PR を作る（owner 委任 2026-09-24） | 座組を owner に尋ねずに決められる。model 名は packet の値と `#座組` の表にだけ現れる（DEV_WORKFLOW `:83` も同じ文にする） | Plan Review を発注 | Codex の稼働状況は Coordinator がその時点で確かめる |
| plan-gate、Codex 稼働中 | fresh Opus（fork でない）と Codex（既定 Astra。owner の指定で Sol）に Plan Review を発注。Writer が Codex の packet では fresh Opus を必ず含める | 2 本の review が独立に返る。冒頭で操作列の 3 値 | P1/P2 = 0 で plan-approved | なし |
| plan-gate、Codex 停止中 | fresh Opus だけで Plan Review を進める | 停止を理由に Phase を止めない | P1/P2 = 0 で plan-approved | なし |
| Plan Review・Final Review が P1/P2 で差し戻す、または Gated Amendment を書く | 是正を書く前に Fable 5.1 へ反例探しを頼む（相談役。Writer・reviewer には数えない）。Fable が使えないときは省くか fresh Opus で代え、遷移を止めない | 是正案の穴を先に潰し、round を減らす | 是正 commit → 次 round | Fable の価値は実測で見直す（`未実測`）。相談した run は closure に数えない |
| 実装済み、Draft PR | Writer（Opus 5.5 subagent、effort medium。Agent tool から直接起動すると session の high を継承するので実効値を run 報告に記録）の実装後、Claude 側（R3 以上と design lane は Fable 5.1、それ以外は fresh Opus）と Codex（Sol 既定）に Final Review を発注。Double Audit の broad の後の reviewer の発注では、先の結果が置かれた場所すべて（例: packet の Review Response の段落、PR body、PR の comment / review、Coordinator が保存した local の報告 file）を読ませず、発注の本文にも先の結果とそれ由来の観点を書かない。両方そろうまで Coordinator は転記しない | Double Audit が 2 本とも独立に数えられる | 両方の broad と closure（Claude 側の既定は Fable 5.1、fresh context）を helper で record | 相手の結果を読んだと申告した run と、Fable から別 model へ切り替わった run は数えず取り直す |
| Final Review、Codex 停止中 | Claude 側の broad を済ませ、Codex の結果だけ待つ。Draft のまま次の lane を進める | Ready 以降だけが止まる | Codex の broad が返る | なし |
| Final Review が P1/P2 で差し戻し、是正（GA を含む）を入れた | Codex に修正案と確認条件を頼んでよいが、それは一案で、採るかは Coordinator が現物で裏取りして決める（採否の記録は Review Response）。是正の後の取り直し（broad または closure）にも Codex の合否判定を含め、Final Reviewer の欄から Codex を外す GA をしない（owner 決定 2026-09-25）。closure・是正の発注は前回 findings から始めてよい（`docs/code_review.md:38`） | 修正の後も別 vendor の合否が残る | Codex を含む取り直しが通る | Codex 停止中は上の行と同じく Ready 以降だけを止める |
| review 通過 | owner の Ready・merge 承認 → Coordinator が helper で `ready` / `merge`・closeout を代行（owner 2026-09-25。委任の範囲は `AGENTS.md` Decision and Approval Boundaries） | owner は判断だけをする | merge → closeout PR | なし |

## Scope

S1〜S7 が本 PR の実装範囲。行番号は base `85b18a04`（本 branch の merge-base。起票時の `8bd2bc9a` から本 PR の所有 file で変わったのは decision-log の末尾だけ）のもの。

- **S1 `docs/AGENT_OPERATING_MANUAL.md` を全面的に書き直す**（288 行 / 33,395 bytes → 目安 60〜90 行）。節と中身は次のとおりにし、他の節は置かない。
  - 冒頭 1 段落: 本書は役割・独立性・座組・担当が使えないときの正本、phase・Risk・gate・review の手順は `docs/DEV_WORKFLOW.md`、読書ルートは `AGENTS.md` Session Start（ルートは複製しない）。
  - `## 役割`: 現行 §2 の表 6 行を保つ。`:22` の Final Reviewer は `independent-review phase の担当` を「実装後の Final Review（broad audit）の担当」に替える（backlog の `independent-review` の残存 2 か所のうち MANUAL 側）。`:21` の Writer は one-writer rule の参照を保つ。Human Gate の行は「owner だけが判断する（L3、R4、Ready、merge）。委任の範囲は `AGENTS.md` の Decision and Approval Boundaries」（委任の文そのものは PR3 が AGENTS に書き、ここには複製しない）。Explorer の行は read-only のまま。
  - `## 独立性`: 現行 `:32-36` の 5 項目（Writer ≠ Plan Reviewer、Writer ≠ Final Reviewer、Final Reviewer は Coordinator・Writer と fresh context で自己承認禁止、R4・workflow gate の Double Audit = Final Review 2 本、Human Gate は owner）を保ち、次を足す。(a) fork は独立に数えない。第三者性の要る review は fork でない fresh な subagent を使う（owner 2026-09-23。根拠: Claude Code 公式 sub-agents「How forks differ from other subagents」= fork は会話の全履歴を継承する）。(b) **Double Audit の 2 本は互いの結果を見ない。後の reviewer の発注では、先の reviewer の結果が置かれた場所すべて（例: packet の Review Response の段落、PR body、PR の comment / review、Coordinator が保存した local の報告 file）を読ませない。Double Audit の broad の後の reviewer への発注の本文にも、先の結果とそれ由来の観点を書かない（closure・是正の発注は前回 findings から始めてよい。`docs/code_review.md:38`）。両方の結果がそろうまで Coordinator は先の結果を packet・PR body に転記しない。読んだと申告した run は独立に数えず取り直す**（2026-09-25 の dogfood 所見: PR #97・#94 で 2 回取り直した）。(c) Writer が Codex の packet は Plan Reviewer に Codex 以外（fresh Opus）を含める（D-062 の原則「縛られる側に gate 文と検査器を書かせない」。現行 DEV_WORKFLOW `:349` の移入）。(d) load-bearing な判断（Plan Gate、Final、裁定）は担当者が正本を直接読み、subagent の要約は claim として扱う（DEV_WORKFLOW Subagent Budget の該当行への参照で足りる）。
  - `## 座組`（見出しは必ずこの文字列。PR3 の CLAUDE.md がここを参照する）: 表 1 つ。行 = Coordinator / Writer / Plan Reviewer / Final Reviewer / 相談役 / Human Gate、列 = Codex 稼働時の担当 / Codex 停止中 / effort。effort の列は担当ごとに書き分け、決定日を添える。effort の値は tracked の正本の中でこの列だけに置く。中身は Ordinary Operation と上の owner 決定のとおり:
    - Coordinator = Opus 5.5 main session、effort high（owner 2026-09-23）。
    - Writer = Opus 5.5 subagent〈Codex も可〉、effort medium（owner 2026-09-23。Codex が Writer のときは下の Codex の値）。
    - Plan Reviewer = fresh Opus 5.5（effort medium）+ Codex（既定 Astra。owner の指定で Sol）〈R3 以上は Fable 5.1 を足した 3 本も選べる〉。
    - Final Reviewer = Claude 側 1 本 + Codex（Sol 既定、難所は Astra）。Claude 側は R3 以上と design lane で Fable 5.1、それ以外は fresh Opus 5.5（effort medium）。closure〈base 同期を含む〉の Claude 側の既定は Fable 5.1（owner 2026-09-25）。注記に「Codex の本務はレビューとしての合否判定で、是正の後の取り直しでも外さない。修正案は一案で採否は Coordinator」（owner 決定 2026-09-25）と「run の報告に実効 model を記録し、Fable から別 model へ切り替わった run は Fable の本数に数えず取り直す」を置く。
    - Codex の effort は model ごとに書く: Astra = 既定 medium、難所 high（owner 2026-09-07 / 08）、Sol = 既定 high（owner 2026-09-14）。
    - 相談役 = Fable 5.1〈Plan Review・Final Review の P1/P2 の差し戻しと、Gated Amendment を書くたびに、是正を書く前に反例探し。Writer・reviewer の数に入れない。使えないときは省くか fresh Opus で代え、遷移を止めない。相談した run は closure に数えず、closure は fresh context で行う〉。advisor は座組の必須にせず、使う場合の組合せと費用の注意を相談役の行の注記に 1 行で置く。
    - Human Gate = owner（判断は owner。委任の範囲は `AGENTS.md` の Decision and Approval Boundaries）。
  - `## 座組` の表の下の注記は 5 行まで: (1) 確認日 2026-09-25 と owner 決定の日付。(2)「モデル更改時はこの表だけを書き換える。座組・effort を他の文書へ複製しない」。(3) effort の実効値: 「Writer・レビューの Opus = medium。Agent tool から直接起動する subagent は session の値（high）を継承する。Workflow から起動する subagent は effort を指定できる。tracked の定義 file（`.claude/agents/**`）は `.gitignore:116` の除外の解除と classifier の穴と一緒に PR5。実効値を run 報告に記録する」（公式 sub-agents「Supported frontmatter fields」の `effort`）。(4) Fable の出番を増やす理由と見直し方: owner 2026-09-25「週制限のなかで Fable 持て余す、指揮を Opus にしてる分」。指揮と Writer は Opus 5.5 のまま、Fable は context を絞った subagent の発注で使い、advisor は常用しない（呼ぶたびに会話全体を読み直し、回数の上限を付けられない）。1〜2 週ごとに `/usage` の Fable の消費で出番を増減する。(5) 根拠の URL: 公式 Opus 5.5 prompting guide「Calibrate effort」と effort「Recommended effort levels for Claude Opus 5.5」（Opus 5.5 の既定は medium、名前の同じ effort を model 間で同じ思考量と見なさない）。
  - `## 担当が使えないとき`（現行 §3.3 の書き直し）: 使えない担当だけを pending にして理由を 1 行残し、その担当を要する遷移だけを止める。Codex 停止中は Plan Review を fresh Opus だけで進め、Final Review は Claude 側を済ませて Codex の結果を待つ（Draft のまま、他の作業は続ける）。代替は owner の指名か同じ vendor の fresh context で、独立性は代替時も保つ。
  - `## one-shot irreversible`（現行 §3.5 を 5 行以内へ。`task-shape` と `one-shot irreversible` の語を残す = `doc-consistency-plan-packet.test.sh:842-843`）: 一回きり × 不可逆 × owner gate の task-shape は owner 同席の time-boxed 同期セッションを選べる。事前に Goal Invariant・time-box・mutation target・停止条件・rollback を固定し、**不可逆 mutation の直前に owner の判断を得る**（現行 `:110` の直前 gate を保つ。この文字列のまま書く）。上限か goal-drift signal で mutation 前に止まる。`Execution Mode` との対比の句は削る。
  - `## Writer への依頼`（現行 §5.6 を 15 行以内へ）: 発注は正本（packet の適用版・Matrix・設計正本）の節と ID を指し、条件を転記しない。書くのは作業 worktree・branch・開始 HEAD、完了済みと残作業、固有の実行条件（許可済み操作と編集禁止対象。権限を広げない）、検証と報告先（開始 / 終了 HEAD、実施・再利用・未実施の検証を区別）。発注直前に正本と対象 worktree の現在地へ照合する（節番号は `rg` で実在確認、数値は同じ command の出力、必須 command の出力先が編集禁止範囲に入らないこと = 現行 §5.6 作成・訂正の手順 4）。「Writer が編集前に止まったとき」の見出し語を残し、手順を番号付きで書く（DEV_WORKFLOW `:286` が「2〜3」を指す）: 1. Writer は編集を始めず、不一致箇所・正本の参照・現在 HEAD を Coordinator へ返す。2. 正本が一意で発注だけが誤りなら、Coordinator が Scope・AC・commit 条件・権限・phase・Risk・review 数を変えずに発注を作り直す。3. Coordinator は作り直した発注に旧前提の keyword での最終照合（sweep）を行う。2〜3 を満たす訂正は owner への中継を要しない。正本の意味を変える訂正・finding の採否・権限の追加は発注の訂正として扱わず、独立確認と Gated Amendment へ戻す（D-090 の中身を保つ。§3.2 codex-only と D-087 への言及は削る）。
  - `## 実機調査`（現行 §5.1 を 5 行以内へ）: 事実確認と設計判断を分ける（adapter facts として記録し、core の契約へ昇格する場合は同じ PR で source doc / decision-log へ）、調査項目は L3 checklist 形式（場所 / 操作 / 目視できる合格基準）、証跡は匿名化か形状だけ（実 JAN・商品名・価格・店舗固有情報・実ファイルを repo に入れない）。
  - `## ハーネスの境界`（現行 §6 / §6.1 を 10 行以内へ）: tracked `.claude/settings.json` が repository 固有 hook inventory の唯一の正本で 0 本、Plan Gate を Claude 固有 hook で再実装しない（D-059）、user-global 設定と `settings.local.json` は代用にしない、未監査の plugin は project scope で無効化する、将来 decision hook を入れるなら入出力と exit code と fixture test を先に契約化する、advisory hook は tool の成否や副作用を command 文字列から推定しない、hook は review を強制しない（現行 §6.1 の 2 項目）、`.codex/hooks.json` は非稼働、`$` 記法は Codex の入口で他の agent は Skill を plain procedure として読む、CASIO 語彙（`Z00x` / `CV17` / `SR-S4000` / `CP932`）の BIZ/CMD 混入は機械ガードが無く review-checklist の設計判断レンズ #2 で見る。`claude-hooks.test.sh:39-46` の禁止句を書かない。
  - 削除する節: §1 のうち Skill 入口の再掲と Evidence Mode の 1 段落（`:9`, `:11`）、§3 の希少 slot・高自律・低制約 slot の項（`:37-38`）、§3.1、§3.2（Execution Mode と Astra 主担当 D-087）、§3.4 の slot 表と旧称の解読、§4 router 表（入口は AGENTS Session Start が持つ。`:124` の `pr-review-prompt.md` への link もここで消える）、§5.2 backfill prompt、§5.3 Plans cleanup prompt（DEV_WORKFLOW Post-Merge Closeout が同じことを持つ）、§5.4（S4 へ移す）、§5.5 相談窓口役（D-058）、§5.7 変則 provenance 監査。
- **S2 `docs/DEV_WORKFLOW.md` の 7 か所だけを直す**（他の行は PR4 の所有で触らない）。
  - `:83` の Workflow State の役割 field の括弧内だけ: 「role definitions in AGENT_OPERATING_MANUAL; concrete model names appear only as values here, never in normative rules」を、役割の定義と座組表は `AGENT_OPERATING_MANUAL.md`（`#座組`）にあり、具体的な model 名はこの field の値と座組表にだけ現れる、の意味に替える（行の他の部分は変えない）。
  - `:215` Astra 主担当の行を削除する。
  - `:252-268` Subagent Budget: 見出し `## Subagent Budget` は保つ（`.claude/commands/plan-rally.md:8` が名前で参照する。PR3 の file）。`:254-261` の Risk 別の同時数の前置きと表、`:263` の wave 合算 4 を削除し、「同時に動かす subagent の数に上限は置かず、Coordinator が作業ごとに決める（owner 2026-09-23）」の 1 行に替える。`:264-268` の 5 項目（depth 1・one-writer rule・出力契約・load-bearing・P3-only）は残す。
  - `:280` one-shot irreversible の行: link を `AGENT_OPERATING_MANUAL.md#one-shot-irreversible` にし、`This task-shape choice is separate from the vendor-oriented Execution Mode.` の文を削る。
  - `:349` D-062(c) の行（Writer が Codex の packet の Plan Reviewer の vendor 規則、`codex-only`、§3.3 への参照）を、「Plan Reviewer の独立性と、Writer が Codex の場合の Plan Reviewer は `AGENT_OPERATING_MANUAL.md#独立性`（link） に従う」の 1 行に替える。
  - `:68` と `:286` の `AGENT_OPERATING_MANUAL.md#56-従来型-writer-発注書の共通出力契約` を `AGENT_OPERATING_MANUAL.md#writer-への依頼` に替える（link の anchor と `§5.6` の表記だけ。文の中身は変えない。`:286` の「Writer が編集前に止まったとき」の 2〜3 は S1 の番号付き手順を指し続ける）。
- **S3 `docs/agent-guidance/` を統合する**（`merge-evidence.md` と `evals/` の本文は変えない）。
  - `README.md` を残し（`AGENTS.md:21` が path で名指しし、`.codex` 側の案内の入口のため）、`shared.md` の中身（共通契約との接続、指示競合、blocked 時の報告）と profiles 3 本の要点（frontier = 既定の調整・難所・横断、balanced = 範囲の決まった実装とレビュー、high-throughput = 範囲の狭い探索と機械的確認。profile は承認・独立性・必須検証・停止条件を変えない）を README へ畳む。`shared.md:9` の Evidence Mode と legacy の文、`README.md:8` の「適用条件が成立してから github mode」「bootstrap は legacy 規定」の句は削る。
  - `shared.md` と `profiles/{frontier,balanced,high-throughput}.md` を削除する。削除した file への link は archive を含む `docs/` 全体から消す（`rg -n '\]\([^)]*(shared\.md|profiles/)' docs` が 0 行。link 検査は `docs/archive/**` も走査する）。
  - archive `docs/archive/plans/2026-09-13-harness-context-efficiency.md:88` の「Codex共有契約」の link（`shared.md` を指す）だけを code 表記（`` `docs/agent-guidance/shared.md` ``）に替える。この file の他の行は変えない（Non-scope の archive 不可触の唯一の例外）。
  - `model-notes.md`: 見出し `## Effort の選定` は保つ（`evals/context-routing-fixture.md:11` が anchor で参照する）。節の本文は effort の値を持たず、Claude 側・Codex 側とも `../AGENT_OPERATING_MANUAL.md#座組`（link） を参照する 1〜2 文にする（`:7` の owner 方針 2026-09-14 と `:9` の値は座組表の effort 列と注記が引き継ぐ。`CLAUDE.md#sonnet--opus-の-effort` への link は消える）。`GPT-5.6 Sol` の見出しと文を GPT-6 Sol に改め、model 固有の傾向（Sol は Astra と同じ effort の選び方へ機械的に揃えない、Astra 向けの傾向を自動継承しない等）だけを残す。model-notes 全体で `medium` / `high` / `xhigh` の値の語を書かない（AC12）。公式確認日を更新する。
- **S4 `docs/templates/subagent-review-packet.md` を改訂する**（本 PR の所有。PR3 は編集しない）。review の依頼・出力の規範は `docs/code_review.md` 1 か所に置き（PR3 の S6 が統合する）、本 template は subagent への発注の入力欄だけを持つ。
  - 新しい節 `## 発注の型` に、発注の入力欄 5 つを置く: 対象（何を判定・報告してほしいか）/ 読取り範囲 / 読ませないもの（Double Audit の後の reviewer）/ read-only 宣言 / 報告の置き場。現行 MANUAL §5.4 のうち報告形式・件数の目安は `code_review.md` の参照へ、subagent 生成の上限は DEV_WORKFLOW Subagent Budget の depth 1 の参照へ寄せる。高自律・低制約 slot 専用の扱い、§5.5 の予約枠の例外、「観点 list・必読順・検証 command を書かない」の禁止は外し、「過程の指示は必要な範囲に留める」の 1 行にする。
  - `## Target` に 1 項目足す: 「読ませないもの（Double Audit の後の reviewer）: 先の reviewer の結果が置かれた場所すべて（例: packet の Review Response の段落、PR body、PR の comment / review、Coordinator が保存した local の報告 file）。Double Audit の broad の後の reviewer への発注の本文にも先の結果とそれ由来の観点を書かない（closure・是正の発注は前回 findings から始めてよい）。`../AGENT_OPERATING_MANUAL.md#独立性`（link）」。
  - `## Output` の本文（`:32` の finding の書式・確信度の要求）と、`## Role` `:7` の出力の要求（推定 severity・確信度）を、`../code_review.md` の `## Output Shape` と `## Finding Severity` への参照 1 文に替える（確信度の要求は PR3 の S6 が `code_review.md` の `## Output Shape` へ足す。本 PR は足さない）。`## Role` の read-only・claim の扱いは残す。
  - `:26` の `legacyのstate-onlyはfile名とzero-context hunkの両方を確認する。` の文と `github modeは` の前置きを削り、専用 record / head / base・必要 broad / closure / manual / R4・実効 rules / CI を確認し旧三点一致を要求しない、の中身は残す。
- **S5 `docs/decision-log.md` に D-092 を末尾へ追記する**（既存 entry の本文は変えない）。見出し `## D-092: Opus 5.5 主軸の座組を AGENT_OPERATING_MANUAL の座組表 1 か所に置き、Execution Mode 時代の役割規則を退役させる（2026-09-25）`、欄は D-090 と同じ Status / Decision / Why / Compatibility。Compatibility に次を列挙する。
  - 全面 superseded: D-056（Opus read-only 専任）、D-058（相談窓口役）、D-079（UI 座組）、D-084（codex-only）、D-087（Astra 主担当）。
  - 部分的に superseded: D-034（Execution Mode 3 値〈PR #97 で撤去済み〉、Subagent Budget の数値上限）、D-038(1)（slot 表 → 座組表）、D-062(c)（vendor 規則は MANUAL の独立性 (c) の 1 行へ。`codex-only` と capacity pending の句は消える）、D-065 のうち §5.7 変則 provenance 監査。
  - PR #97（PR1）で撤去済みの記録（PR1 の Non-scope が PR2 の D へ送ったもの）: D-035（state-only・三点一致）、D-038(8)（STATECAP）、D-046-3（backtrack）、D-049（execpolicy の 2 mirror 維持）、D-055 / D-074 のうち Rebase Map、D-085 の MG-D10 / MG-D11（移行）。
  - 維持: D-059（hook 0 本）、D-062(a)(b) と設計原則、D-039（PK5）、D-085 / D-086（merge gate）、D-090（Ordinary Operation・Writer 停止時）、独立性・Double Audit・Human Gate。
  - Why: owner 決定 2026-09-23 / 24 / 25（環境が変わった: Opus 5.5 と Fable 5.1 の水準、Codex の役割が review 中心へ、Claude 側の枠が潤沢）と、PR #97・#94 の独立性の崩れ、#96 の GA6 を Claude 側の reviewer 2 本だけで締めて merge し、最終形が Codex の合否を通らなかったこと（owner 2026-09-25「レビューとしての通すか否かが第三者の目として入るからそこはしっかり責務として持ちたい。あくまで一案でそこを採用するかはこっち次第」）。
- **S6 `docs/Plans.md` と `docs/backlog.md`**: `Plans.md` は本 commit の登録行と、closeout での完了の反映だけ。`backlog.md` は実装 PR では編集せず、closeout で「撤去済みの Phase 名 `independent-review` が 2 か所に残る」の entry を template 側（`docs/templates/plan-packet.md:196`、PR4 の所有）だけに狭める。
- **S7 `docs/templates/plan-packet.md` の 2 行だけ**（template の他の行は PR4 の所有で触らない）。
  - `:34`（Consultation Relay 節の §5.5 の使用指示）を「相談役への相談は `../AGENT_OPERATING_MANUAL.md`（anchor なしの link）の座組に従う。本節の 2 欄は `none` のままにする」の意味の 1 行に替える。
  - `:125`（Registration 表の「AGENT_OPERATING_MANUAL §5.5 consultation relay 使用」の行）を、左欄・右欄とも §5.5 の使用指示を持たない行（相談役への相談は登録義務なし、`Consultation Relay` の 2 欄は `none`）に替える。変更後の template に `§5.5` の語は残らない（`rg -n '§5\.5' docs/templates/plan-packet.md` が 0 行、baseline 2 行）。

### PR3 / PR4 / PR5 との file の所有

| file / 範囲 | 所有 | 本 PR の扱い |
|---|---|---|
| `docs/AGENT_OPERATING_MANUAL.md` 全体 | PR2 | S1。見出し `## 座組` を必ず置く（両 PR で固定した anchor = `docs/AGENT_OPERATING_MANUAL.md#座組`） |
| `docs/DEV_WORKFLOW.md` の `:68`（anchor だけ）・`:83`（括弧内だけ）・`:215`・`:252-268`・`:280`・`:286`（anchor だけ）・`:349` | PR2 | S2 |
| `docs/DEV_WORKFLOW.md` のその他の行 | PR4（PR3 は DEV_WORKFLOW を編集しない前提。問い合わせの行き先の表の AGENTS への統合で DEV_WORKFLOW 側を消すのは PR4） | 触らない |
| `docs/agent-guidance/**`（`merge-evidence.md` を除く） | PR2 | S3 |
| `docs/agent-guidance/merge-evidence.md` | どの PR も本改訂では触らない（PR1 で縮約済み） | 触らない |
| `docs/archive/plans/2026-09-13-harness-context-efficiency.md:88` | PR2（削除する `shared.md` への link の 1 行だけ） | S3 |
| `docs/templates/subagent-review-packet.md` | **PR2**（PR3 の「review 系 template の統合」のうちこの file は PR2 が持つ） | S4 |
| `docs/templates/pr-review-prompt.md`、`docs/code_review.md`、`docs/quality/review-checklist.md` | PR3 | 触らない。pr-review-prompt は PR3 が `code_review.md` へ統合して削除するので、subagent-review-packet への移入は要らない（PR4 の作業にもならない）。確信度の要求の `code_review.md` への追加も PR3（S6） |
| `docs/decision-log.md` | PR2 は D-092 だけ、PR3 は D-093 だけ、PR #98 は D-091 だけ（いずれも末尾追記） | S5。末尾の追記どうしの衝突は merge 順で両方を残す |
| `docs/templates/plan-packet.md` の `:34`・`:125`（§5.5 の使用指示） | PR2 | S7 |
| `docs/templates/plan-packet.md` のその他の行（Consultation Relay 節の見出しと 2 欄、`:196` の `independent-review` を含む）、`docs/templates/test-design-matrix.md` | PR4 | 触らない |
| `AGENTS.md`、`CLAUDE.md`、`.claude/**`（settings を除く）、`.agents/**`、`.github/pull_request_template.md`、`docs/project-profile.md` | PR3 | 触らない |
| `scripts/**`、`.claude/agents/**`、`.github/workflows/**` | PR5 / どの PR も本 PR では触らない | 触らない |
| `docs/Plans.md` | 各 PR が登録行と closeout だけ | 登録行（本 commit）と closeout |

本 PR の merge で古くなる他 PR 所有の参照（本 PR では直さず、所有 PR が直す）:

- `.agents/skills/inventory-workflow-start/SKILL.md:13` の `AGENT_OPERATING_MANUAL.md#3-role-assignment役割割当の制約とavailability` の anchor と、同じ行の語「Capacity-degraded」→ PR3 の S5 が anchor なしの file link にし、語を「担当が使えないとき」に替える。link 検査は anchor を落として file の実在だけを見る（Contract Probe P2）ので、どちらの merge 順でも検査は落ちない。
- `CLAUDE.md` の `## Sonnet / Opus の effort` 節と `.claude/commands/plan-rally.md:23` の `consultation relay` → PR3。
- `AGENTS.md:21` の「未指定 profile は `frontier`」: README に profile の要点を残すので、PR3 の前後どちらでも文として正しい。
- MANUAL の Human Gate 行が参照する委任の範囲の文（push・Draft PR 作成と、owner の承認後の helper `ready` / `merge` の実行）→ PR3 が `AGENTS.md` Decision and Approval Boundaries に書く。
- review の出力の確信度の要求 → PR3 の S6 が `code_review.md` の `## Output Shape` に足す（本 PR の S4 は review packet から出力の規範を外し、code_review を参照する）。
- `docs/templates/plan-packet.md` の Consultation Relay 節の見出しと 2 欄、`:196` → PR4（§5.5 の使用指示の `:34`・`:125` は本 PR の S7）。

## Non-scope

- 上の所有表で PR3 / PR4 / PR5 のものとした file と行すべて。
- PR3 の merge までの並存: `CLAUDE.md` の `## Sonnet / Opus の effort` 節（high / xhigh）が残り、MANUAL の Human Gate 行が参照する委任の文（AGENTS）と review の出力の確信度（code_review）は PR3 で入る。本 PR で `CLAUDE.md` を触ると PR3 と同じ節を取り合うので触らない。PR2 → PR3 は続けて merge する。
- merge の順: PR2 merge → PR2 の closeout → PR3 に main を同期 → PR3 の Final Review → Ready。helper は PR head の active packet が 1 つであることを要求する（`scripts/pr-gate.py:231`）。
- `docs/DEV_WORKFLOW.md` Review Rules の `:348`（R3 の review-only 既定）・`:350-351`（review-only skip・R4）・3 分類・Findings Freeze、Owner Effort Budget（`:270-281` のうち `:280` 以外）、問い合わせの行き先（`:282-296` のうち `:286` の anchor 以外）、Wave Operation（`:228` 以降。`:237` の「Plan Reviewer と Final Reviewer は lane ごとの独立 fresh context」を含む）: PR4。
- `docs/agent-guidance/evals/*` の本文。eval fixture は keep（監査 F15、低優先）。
- `docs/research/2026-07-28-codex-sol-week-playbook.md` の D-056 への言及（研究記録で、規範ではない）。
- `docs/archive/**`（例外: S3 の `docs/archive/plans/2026-09-13-harness-context-efficiency.md:88` の link を code 表記に替える 1 行だけ）、decision-log の既存 entry の本文（追記型）。
- MANUAL §5.3 の「重複を 1 箇所へ統合」「次の行動が空なら補充」を Post-Merge Closeout へ書き足すこと: Post-Merge Closeout の「Update `Plans.md` so it reflects current live state, completed work, archived evidence, and next action」が同じことを求めるので足さない。不足が見つかれば PR4。
- 監査 K13 / K14（保守者可読性、店の事実の照合）の追加: PR3（`docs/code_review.md`）。
- 数値の token 削減量の測定（監査 §10、`未実測`）。

## Acceptance Criteria

baseline は本 branch の HEAD（base `85b18a04` に本 packet・Matrix・`Plans.md` の登録行を足しただけ）で同じ command を実行した出力。

- **AC1** `rg -c '^## 座組$' docs/AGENT_OPERATING_MANUAL.md` → `1`（baseline: 一致なし、exit 1）。
- **AC2** 退役した仕組みが本 PR の所有 file に残らない: `rg -n 'fable-window|dual-vendor-no-fable|codex-only|Execution Mode|相談窓口|高自律|低制約|希少|D-056|D-058|D-079|D-084|D-087|Consultation Relay|independent-review|Sonnet|GPT-5\.6|Sol 5\.6|Opus 5（|Fable 5（' docs/AGENT_OPERATING_MANUAL.md docs/agent-guidance/README.md docs/agent-guidance/model-notes.md docs/templates/subagent-review-packet.md | wc -l` → `0`（baseline `38`）。
- **AC3** DEV_WORKFLOW: `rg -n 'Astra主担当|Writer が Codex（発注書駆動の実装者）|Max concurrent sub-agents|全 lane 合算の同時 subagent 上限|vendor-oriented Execution Mode' docs/DEV_WORKFLOW.md | wc -l` → `0`（baseline `5`）。残すもの: `rg -n 'Max delegation depth is 1|One-writer rule|Sub-agent output contract|Load-bearing decisions|P3-only findings' docs/DEV_WORKFLOW.md | wc -l` → `5`（baseline `5`）。`rg -c '^## Subagent Budget$' docs/DEV_WORKFLOW.md` → `1`。`:83` の旧文: `rg -c 'never in normative rules' docs/DEV_WORKFLOW.md` → 一致なし（baseline `1`）。
- **AC4** 独立性の規則: `rg -c '先の reviewer' docs/AGENT_OPERATING_MANUAL.md` と `rg -c '先の reviewer' docs/templates/subagent-review-packet.md` がそれぞれ `1` 以上（baseline: どちらも一致なし）。文面が S1 (b) の要素（読ませない対象 = 先の結果が置かれた場所すべてと例示 4 種〈local の報告 file を含む〉、Double Audit の broad の後の発注の本文に先の結果とそれ由来の観点を書かないこと〈closure・是正の発注は除く〉、転記の順序、読んだ run の取り直し）を含むことを review で確認する。
- **AC5** `rg -c '^## D-092: ' docs/decision-log.md` → `1`（baseline: 一致なし）。`awk '/^## D-092: /,0' docs/decision-log.md | rg -o 'D-0(56|58|79|84|87)' | sort -u | wc -l` → `5`。追記だけ: `git diff origin/main...HEAD -- docs/decision-log.md | rg -c '^-[^-]'` → 一致なし。
- **AC6** agent-guidance: `find docs/agent-guidance -maxdepth 1 -mindepth 1 | sort` → `docs/agent-guidance/README.md`、`docs/agent-guidance/evals`、`docs/agent-guidance/merge-evidence.md`、`docs/agent-guidance/model-notes.md` の 4 行（baseline: これに `profiles`、`shared.md` を加えた 6 行）。`git diff --stat origin/main...HEAD -- docs/agent-guidance/merge-evidence.md docs/agent-guidance/evals` → 空。`rg -c '^## Effort の選定$' docs/agent-guidance/model-notes.md` → `1`（baseline `1`）。削除した file への link（archive を含む）: `rg -n '\]\([^)]*(shared\.md|profiles/)' docs | wc -l` → `0`（baseline `7`: MANUAL `:97`、archive `2026-09-13-harness-context-efficiency.md:88`、README `:5`・`:6`、profiles 3 本）。
- **AC7** review packet: `rg -n 'legacy|state-only|三点一致' docs/templates/subagent-review-packet.md | wc -l` → `0`（baseline `1`）。`rg -c '^## 発注の型$' docs/templates/subagent-review-packet.md` → `1`（baseline: 一致なし）。出力の規範を持たない: `rg -n '確信度|P1/P2/P3' docs/templates/subagent-review-packet.md | wc -l` → `0`（baseline `2`: `:7`、`:32`）、`rg -c 'code_review\.md' docs/templates/subagent-review-packet.md` → `1` 以上（baseline `1`）。
- **AC8** MANUAL を指す anchor が実在する: `rg -o 'AGENT_OPERATING_MANUAL\.md#[^) ]+' docs -g '!docs/archive/**' -g '!docs/decision-log.md' -g '!docs/plans/**'` の各 anchor が、新 MANUAL の見出し（`rg '^#+ ' docs/AGENT_OPERATING_MANUAL.md`）から GitHub の slug 規則で作られる anchor と一致する（link 検査は anchor を見ないので review で確認する。baseline: `docs/DEV_WORKFLOW.md:68,215,286` の 3 件で、`:215` は S2 で消える）。`.agents/skills/inventory-workflow-start/SKILL.md:13` は PR3 の所有で対象外。
- **AC9** 他 PR の所有 file に触れない: `git diff --stat origin/main...HEAD -- AGENTS.md CLAUDE.md .claude .agents .github .codex scripts docs/code_review.md docs/quality docs/project-profile.md docs/ci.md docs/templates/pr-review-prompt.md docs/templates/test-design-matrix.md docs/templates/adr.md docs/templates/workflow-effectiveness-review.md` → 空。`git diff -U0 origin/main...HEAD -- docs/templates/plan-packet.md` の hunk が `:34`・`:125` の中だけにある。`git diff --stat origin/main...HEAD -- docs/archive` が `docs/archive/plans/2026-09-13-harness-context-efficiency.md` の 1 行の変更だけ。`git diff -U0 origin/main...HEAD -- docs/DEV_WORKFLOW.md` の hunk が S2 の 7 か所（旧 `:68`、`:83`、`:215`、`:252-268`、`:280`、`:286`、`:349`）の中だけにある（hunk の位置は review で確認）。
- **AC10** 大きさ（Goal の代理にしない補助の確認）: `wc -lc docs/AGENT_OPERATING_MANUAL.md` → 100 行以下かつ 15,000 bytes 以下（baseline `288 33395`。監査の目標 60 行 / 6KB は `未実測` の目安で停止条件にしない）。
- **AC11** 検査: `bash scripts/doc-consistency-check.sh`、`bash scripts/doc-consistency-check.sh --target plan`、`bash scripts/doc-consistency-check.sh --target plan docs/archive/plans/2026-09-13-harness-context-efficiency.md`（変えた archive file を explicit path で。baseline exit 0）、`bash scripts/check-workflow-git.sh`、`bash scripts/tests/run-workflow-tests.sh`（`claude-hooks.test.sh`・`doc-consistency-plan-packet.test.sh:842-843`・`reading-order-drift.test.sh` を含む）、`git diff --check` がすべて exit 0。
- **AC12** 残す境界の文字列と effort の所在: `rg -c '不可逆 mutation の直前に owner の判断を得る' docs/AGENT_OPERATING_MANUAL.md` → `1`（baseline: 一致なし）。`awk '/^## Writer への依頼/,/^## 実機調査/' docs/AGENT_OPERATING_MANUAL.md | rg -c '^[123]\. '` → `3`（baseline: 一致なし）。`rg -c 'Writer が編集前に止まったとき' docs/AGENT_OPERATING_MANUAL.md` → `1`（baseline `1`）。`rg -n '\b(medium|high|xhigh)\b' docs/agent-guidance/model-notes.md | wc -l` → `0`（baseline `2`: `:7`、`:9`）。

## Design Sources

- Workflow 正本（本 PR が書き換えるもの自身）: `docs/AGENT_OPERATING_MANUAL.md`、`docs/DEV_WORKFLOW.md` の Workflow State（`:83`）/ Implementation Rules / Subagent Budget / Owner Effort Budget / Review Rules、`docs/templates/subagent-review-packet.md`、`docs/templates/plan-packet.md:34`・`:125`、`docs/agent-guidance/{README,shared,model-notes}.md` と profiles。
- 参照だけする正本: `docs/code_review.md` の `## Output Shape`・`## Finding Severity`・`:38`（closure の読み方）・`:73`（R3 の review-only skip）。PR3 の所有。
- Decision log: D-034、D-038、D-056、D-058、D-059、D-062、D-065、D-079、D-084、D-087、D-090。
- 監査: `.local/reports/harness-audit-2026-09-24.md`（local-only）§3.F / 3.G / 3.H / 3.K / 3.N / 3.O、§4、§5、§7 PR2 行、§8、§9 Q2（5 本で決定済み）。
- PR1 archive packet: `docs/archive/plans/2026-09-24-harness-legacy-and-execution-mode-removal.md`（Non-scope で PR2 へ送ったもの = MANUAL の §3.1 / §3.2 / §3.3 / §3.5 / §5.5 と DEV_WORKFLOW の旧 `:312,381` = 現 `:280,:349`、decision-log の superseded の列挙）。
- 公式資料（取得版 `.local/reports/official-guides/`、URL が正本）: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5 「Calibrate effort」、https://platform.claude.com/docs/en/build-with-claude/effort 「Recommended effort levels for Claude Opus 5.5」、https://code.claude.com/docs/en/sub-agents 「How forks differ from other subagents」「Supported frontmatter fields」（`effort`）「Let subagents spawn their own subagents」。
- 公式資料の追加（owner 2026-09-25「Fable5.1のガイドも盛り込んでよさそう」、取得版は同じ directory）: https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1 （座組の相談役と、Fable を reviewer・相談役に置く発注書の書き方に関わる節: 「Consider all effort levels」「Ask for user-facing progress updates」「Batch independent tool calls in agent loops」「Finish the whole task」「Keep changes and tests to what the task asks for」「Let the lead agent keep working while subagents run」）、https://code.claude.com/docs/en/advisor （advisor tool、experimental。main が Opus 5.5 のとき advisor は Fable か Opus 5 以降、有効化は owner の `/advisor`・`advisorModel`・`--advisor`、呼ぶ時機は Claude が決める。Max では Fable の使用は週の上限の 50% まで plan 内で、超えると usage credits）。`#座組` の相談役の行と `model-notes.md` は、Opus 5.5 guide と同じく Fable 5.1 guide と照合する。advisor は座組の必須にせず、使う場合の組合せと費用の注意を相談役の行の注記に 1 行で置く。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient（製品コードを変えない） |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Workflow 正本（役割・独立性・座組） | `docs/AGENT_OPERATING_MANUAL.md`、`docs/DEV_WORKFLOW.md` の S2 の 7 か所、`docs/agent-guidance/**`、`docs/templates/subagent-review-packet.md`、`docs/templates/plan-packet.md:34`・`:125` | updated in this PR（S1〜S4、S7） |
| Durable decision / ADR | `docs/decision-log.md` D-092 | updated in this PR（S5） |

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| source / workflow doc の削除（`docs/agent-guidance/shared.md`、`profiles/*.md`） | 親の索引 `docs/agent-guidance/README.md` を更新し、削除した file への link を archive を含む `docs/` 全体から消す（`rg -n '\]\([^)]*(shared\.md|profiles/)' docs` が 0 行、AC6）。link 検査は `docs/` 配下（`docs/archive/**` を含む）だけを見る（Contract Probe P1）ので、root の `AGENTS.md:21` の path 名指しは README を残すことで保つ |
| archive の file の変更（`docs/archive/plans/2026-09-13-harness-context-efficiency.md:88`） | DEV_WORKFLOW Plan Packet Rules の「when changing archived plans, check the changed archive files by explicit path」に従い、`bash scripts/doc-consistency-check.sh --target plan docs/archive/plans/2026-09-13-harness-context-efficiency.md` を実行する（AC11） |
| MANUAL の見出しの改名 | 旧 anchor を指す link を `rg -o 'AGENT_OPERATING_MANUAL\.md#'` で全件洗い、本 PR の所有分（DEV_WORKFLOW `:68`・`:280`・`:286`）を直し、他 PR 所有分を Scope の「古くなる他 PR 所有の参照」に列挙する（AC8） |
| MANUAL の文字列を検査する test | `doc-consistency-plan-packet.test.sh:842-843`（`one-shot irreversible` / `task-shape`）と `claude-hooks.test.sh:39-46`（禁止句）を満たす文面にする。test は変えない |

Tauri command・REQ・route・画面は該当なし。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| SPEC-WF-HARNESS2 | MANUAL §3 / §3.4、DEV_WORKFLOW `:83`、model-notes、owner 決定 2026-09-07 / 08・14・23 / 24 / 25 | D1 | 座組と effort の値を表 1 か所に置き、モデル更改時の書換えを 1 か所にする。却下: model-notes・CLAUDE.md にも値を残す（2 か所が食い違う） | S1 `## 座組`、S2 `:83`、S3 model-notes | AC1、AC12、T-F2 |
| SPEC-WF-HARNESS2 | MANUAL §3 の独立性、DEV_WORKFLOW `:349`、PR #97・#94 の dogfood 所見 | D2 | Double Audit の後の reviewer に先の結果を見せない規則を、置き場所を列挙して文書の規則として置く。却下: 機械の検査にする（非目的） | S1 `## 独立性`、S4 `## Target` | AC4、T-I1 |
| SPEC-WF-HARNESS2 | MANUAL §3.1 / §3.2 / §3.4 / §5.5 / §5.7、DEV_WORKFLOW `:215`・`:252-268`・`:349`、template `:34`・`:125` | D3 | Execution Mode 時代の役割規則を退役させ、D-092 に記録する。却下: 注記付きで残す（読み手が旧手順を実行する） | S1、S2、S3、S4、S5、S7 | AC2、AC3、AC5、AC7 |
| SPEC-WF-HARNESS2 | MANUAL の §2 / §3 / §3.3 / §3.5 / §5.6 / §6 / §6.1、DEV_WORKFLOW Subagent Budget | D4 | 残す安全境界を新しい節へ移し、縮約で落とさない（Contract Coverage Ledger）。却下: 節ごと削る | S1、S2 | AC3、AC12、T-S1〜T-S5 |
| SPEC-WF-HARNESS2 | `docs/templates/subagent-review-packet.md`、`docs/code_review.md` | D5 | review の依頼・出力の規範は code_review 1 か所、review packet は発注の入力欄だけ。却下: review packet に出力形式を残す（2 か所の規範） | S4 | AC7、T-P1 |
| SPEC-WF-HARNESS2 | owner 決定 2026-09-25、D-062 の原則 | D6 | Final Review の Claude 側を R3 以上と design lane で Fable 5.1、closure の既定を Fable 5.1 にし、Codex の合否を是正後も外さない。実効 model を記録する。却下: Fable を相談役だけに置く（owner 決定と違う） | S1 `## 座組` | T-F2 |
| SPEC-WF-HARNESS2 | 所有表、PR3 packet、PR4 / PR5 の範囲 | D7 | 並走 PR と file・行を取り合わない。例外は template の 2 行と archive の 1 行だけで、どちらも本 PR の削除が原因 | 所有表、Non-scope | AC9、T-B1 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 座組・独立性・担当が使えないときは MANUAL に、退役と維持の列挙と理由は D-092 に置く。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 「座組と effort の値は `#座組` の表だけ」「後の reviewer に先の結果を見せない」「Final Review の Claude 側は R3 以上で Fable 5.1」「review packet は発注の入力欄だけ」を MANUAL・review packet・D-092 に置く。
- Assumptions and constraints: PR3 が `CLAUDE.md` の effort 節、AGENTS の委任の文、code_review の確信度を続けて入れる（Non-scope の並存）。Writer・レビューの medium は PR5 の定義 file まで実効しない（座組表の注記で正直に書く）。
- Deferred design gaps, risk, and follow-up target: subagent ごとの effort を定義 file で固定すること（PR5）、plan-packet template の Consultation Relay 節と `independent-review`（PR4）、DEV_WORKFLOW の他の節（PR4）。
- Test Design Matrix can cite design decision IDs or source doc sections: D1〜D7 と失敗定義の境界を Matrix が引く。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 所有の例外（template `:34`・`:125`、archive `:88`）を所有表と AC9 に書いた。Codex 停止中の Final Review は Ready 以降だけを止め、Codex を外す例外は置かない。

## Impact Review Lenses

not applicable: 実機調査・外部 tool・POS・CSV・operator workflow を起点にしない workflow 文書の変更で、製品の設計前提を変えない。

## Design Readiness

- Existing design docs are sufficient because: 規則の中身は owner 決定（2026-09-07 / 08・14・23 / 24 / 25）・2026-09-25 の dogfood 所見・監査で決まっており、本 PR はそれを workflow 正本へ書く。owner の判断を要する未決の論点は無い。
- Source docs updated in this PR: S1〜S5、S7 の file。
- Design gaps intentionally deferred: subagent ごとの effort を定義 file で固定すること（PR5）、plan-packet template の Consultation Relay 節と `independent-review` の残り（PR4）。
- Durable decisions discovered in this plan and promoted to source docs: 独立性の規則「後の reviewer に先の結果を見せない」（S1 (b)、S4）と D-092。

## Contract Probe

Scope の前提 3 つを起票時に確かめた。

- P1 link 検査は `docs/` 配下（`docs/archive/**` を含む）の Markdown だけを見て、link 先 file の実在を確かめる: `docs/agent-guidance/README.md` を一時的に退避して `bash scripts/doc-consistency-check.sh` → `AGENT_OPERATING_MANUAL.md:90` と `:119` の 2 件が `リンク先 'agent-guidance/README.md' が存在しません` の ERROR（`8bd2bc9a`、退避を戻して `git status --porcelain` 空を確認）。検査対象は `find "$ALL_DOCS" -name "*.md"`（`scripts/doc-consistency-check.sh` の Markdown link 検査）で、root の `AGENTS.md` は含まれない。
- P2 link 検査は anchor を落として file だけを見る: 同じ関数が `link_path=$(echo "$link_path" | sed 's/#.*//')` で anchor を除く（`scripts/doc-consistency-check.sh:1710-1711`）。したがって anchor の食い違いは機械では落ちず、AC8 の review で見る。
- P3 subagent の effort は定義 file で指定できる: 公式 sub-agents「Supported frontmatter fields」の `effort`（「Overrides the session effort level. Default: inherits from session」、取得版 `claude-code-sub-agents.md:311`）。監査 §10 が「公式資料では未確認」とした点はこれで確認済み。定義 file の新設は PR5。

## Contract Coverage Ledger

失敗定義の「残す境界」を 1 行ずつ、旧 MANUAL（または DEV_WORKFLOW）の節 → 新しい節 → 検査 / review で写す。

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| Writer ≠ Plan Reviewer ≠ Final Reviewer（旧 MANUAL §3 `:32-33`） | 新 `## 独立性` の既存 5 項目 | なし（文書の規則） | review: T-I1 |
| 自己承認禁止・fresh context（旧 MANUAL §3 `:34`） | 新 `## 独立性`、(a) fork を独立に数えない | なし | review: T-I1 |
| Double Audit（旧 MANUAL §3 `:35`、DEV_WORKFLOW Contract Audit） | 新 `## 独立性` と (b) 後の reviewer に先の結果を見せない | AC4（`先の reviewer` の語） | review: T-I1（読ませない場所の列挙） |
| Human Gate は owner（旧 MANUAL §2 の Human Gate 行、§3 `:36`） | 新 `## 役割` の Human Gate 行（委任の範囲は `AGENTS.md` の参照） | なし | review: T-F2。委任の文は PR3 |
| depth 1（DEV_WORKFLOW Subagent Budget `:264`） | DEV_WORKFLOW `## Subagent Budget`（残す）、S4 の参照 | AC3 後半（5 項目 = 5） | — |
| one-writer（DEV_WORKFLOW Subagent Budget `:265`、旧 MANUAL §2 の Writer 行） | DEV_WORKFLOW `## Subagent Budget`、新 `## 役割` の Writer 行 | AC3 後半 | — |
| load-bearing 判断の正本直読み（DEV_WORKFLOW Subagent Budget `:267`） | DEV_WORKFLOW `## Subagent Budget`、新 `## 独立性` (d) | AC3 後半 | — |
| hook 0 本と plugin 無効化（旧 MANUAL §6.1） | 新 `## ハーネスの境界` | `claude-hooks.test.sh`（T-S2） | — |
| advisory hook の推定禁止、hook は review を強制しない（旧 MANUAL §6.1 `:285`・`:286`） | 新 `## ハーネスの境界` | なし | review: T-S5 |
| one-shot irreversible の task-shape（旧 MANUAL §3.5） | 新 `## one-shot irreversible`、DEV_WORKFLOW `:280` の link | `doc-consistency-plan-packet.test.sh:842-843`（T-S1） | — |
| 不可逆 mutation の直前の owner 判断（旧 MANUAL §3.5 `:110`） | 新 `## one-shot irreversible` | AC12（文字列、T-S4） | — |
| Writer が編集前に止まったときの手順 1〜3（旧 MANUAL §5.6 `:242-246`、DEV_WORKFLOW `:286` が「2〜3」を指す） | 新 `## Writer への依頼` の番号付き手順、DEV_WORKFLOW `:286` の anchor | AC12（番号 3 つと見出し語、T-S5） | review: AC8 の anchor |
| 発注直前の照合（必須 command の出力先が編集禁止範囲に入らない。旧 MANUAL §5.6 作成・訂正の手順 4 `:234`） | 新 `## Writer への依頼` | なし | review: T-S5 |
| 座組・effort の値の所在（D1） | 新 `## 座組`、DEV_WORKFLOW `:83`、model-notes | AC1、AC3（`:83`）、AC12（model-notes） | review: T-F2 |
| review packet は発注の入力欄だけ（D5） | S4 | AC7 | 確信度の code_review への追加は PR3 |

adjacent-contract sweep: S1〜S4、S7 が触る節で上表に無い契約は、MANUAL §5.1 の実機調査の証跡の扱い（新 `## 実機調査` に残す、review で確認）と、DEV_WORKFLOW の S2 以外の行（変えない、AC9）。

## Test Plan

Test Design Matrix: [2026-09-25-harness-pr2-roles-and-formation.md](test-matrices/2026-09-25-harness-pr2-roles-and-formation.md)。

- targeted tests: AC1〜AC8、AC12 の `rg` / `find` / `git diff`。
- negative tests: Matrix の Mutation-style（`one-shot irreversible` を消す → `doc-consistency-plan-packet.test.sh` が red、禁止句を入れる → `claude-hooks.test.sh` が red、`README.md` を消す → link 検査が ERROR、直前の owner 判断の文を消す → AC12 が 0 になる）。
- compatibility checks: active な他 packet は並走 lane の branch にだけある（main には無い）ので、本 branch の `--target plan` は本 packet だけを見る。変えた archive file は explicit path で検査する（AC11）。PR3 の起草 branch と file が重ならない（AC9）。
- data safety checks: 実データ・secret を含まない文書変更（Data Safety）。
- main wiring/integration checks: `bash scripts/tests/run-workflow-tests.sh`（policy docs で workflow=true のとき hosted でも走る suite）。

## Boundary / Wire Contract

not applicable: JSON・browser state・CSV・config・DTO・bindings・DB を変えない。

## Review Focus

- Plan Review の冒頭で、Ordinary Operation の各行が本 PR の merge 後の文書で成立するかを `成立 / 具体的な反例あり / 外部前提が未確認` で答える。
- 座組表の中身が owner 決定（2026-09-07 / 08・14・23 / 24 / 25）と一致するか。特に Codex 停止中の Plan Review と Final Review の非対称、Fable を相談役としては reviewer の数に入れないことと Final Review の Claude 側に置くことの書き分け、effort の値が表にだけあること、Human Gate の委任の参照先。
- S1 (b) の独立性の規則が PR #97・#94 の崩れ方（packet の Review Response と PR body を読ませた）を実際に防ぐか。読ませない場所の列挙（PR の comment / review、local の報告 file、後の発注の本文）が過不足ないか。
- 削る規則のうち、実は安全境界や独立性を担っていたものが無いか（§3.1 の希少 slot、§3 の Opus read-only、§5.5、§5.7、Subagent Budget の数値、D-062(c)）。Contract Coverage Ledger の各行が S1 の節で全部拾えているか。
- Risk R3 の判定と、R3 の review-only を Final Review の Double Audit の broad が兼ねる扱い。
- 所有表が PR3 の起草（`.claude/worktrees/harness-closeout`、branch `agent/harness-pr3-entry`）と重ならないか。特に `docs/templates/subagent-review-packet.md`（PR2）と pr-review-prompt・code_review（PR3）、DEV_WORKFLOW を PR3 が触らない前提、template の 2 行の例外。
- 本 PR の Writer（Opus）が Opus を縛る規則を書くこと（D-062 の原則「縛られる側に gate 文と検査器を書かせない」）: Final Review に Codex を含めることで別 vendor の目を置く。これで足りるか。

## Spec Contract

Contract ID: SPEC-WF-HARNESS2

- D1: 座組（担当・model・effort・Codex 停止中の進め方）の tracked の正本は `docs/AGENT_OPERATING_MANUAL.md` の `## 座組` の表 1 つで、effort の値も担当ごとにこの表だけに置く。`docs/agent-guidance/model-notes.md` は値を持たず表を参照し、`docs/DEV_WORKFLOW.md:83` は model 名が Workflow State の値と座組表に現れるとする。
- D2: 独立性は既存 5 項目に、fork を独立に数えない、Double Audit の後の reviewer に先の結果が置かれた場所すべてを読ませず発注の本文にも書かない、Writer が Codex の場合の Plan Reviewer、load-bearing 判断の正本直読み、を足して MANUAL `## 独立性` に置く。review packet の `## Target` も同じ読ませないものを持つ。
- D3: 退役した仕組み（Execution Mode、D-056、希少 slot、§5.5、§5.7、Astra 主担当、Subagent Budget の数値、D-062(c) の `codex-only` 句）を手順として指示する文が本 PR の所有範囲に残らず、D-092 が退役・部分退役・PR1 撤去済み・維持を列挙する。
- D4: 失敗定義の残す境界は、Contract Coverage Ledger の各行の新しい節に残る。
- D5: review の依頼・出力の規範は `docs/code_review.md`、`docs/templates/subagent-review-packet.md` は subagent 発注の入力欄だけを持つ。
- D6: Final Review の Claude 側は R3 以上と design lane で Fable 5.1、closure の既定も Fable 5.1。Codex の合否は是正後の取り直しでも外さない。run の報告に実効 model を記録し、別 model へ切り替わった run は Fable の本数に数えない。
- D7: 本 PR は PR3 / PR4 / PR5 の所有 file と行に触れない（例外: template `:34`・`:125`、archive `:88`）。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-WF-HARNESS2-D1 | S1、S2、S3 | AC1、AC3、AC12、T-F1、T-F2 | 座組表と owner 決定の一致、effort の所在 | rg 出力と表の突合 |
| SPEC-WF-HARNESS2-D2 | S1、S4 | AC4、T-I1 | 読ませない場所の過不足 | rg 出力と文面 |
| SPEC-WF-HARNESS2-D3 | S1〜S5、S7 | AC2、AC3、AC5、AC7、T-R1、T-L1 | 退役の取りこぼし | rg 出力 |
| SPEC-WF-HARNESS2-D4 | S1、S2 | AC3、AC12、T-S1〜T-S5 | Ledger の各行 | test 出力・rg 出力 |
| SPEC-WF-HARNESS2-D5 | S4 | AC7、T-P1 | 出力の規範の二重化 | rg 出力 |
| SPEC-WF-HARNESS2-D6 | S1 | T-F2 | Fable の二つの役の書き分け | 表の文面 |
| SPEC-WF-HARNESS2-D7 | 所有表、Non-scope | AC9、AC11、T-B1、T-G1 | 他 PR との重なり | git diff の stat・hunk |

## Data Safety

not applicable（製品データを扱わない）: 変更は tracked の workflow 文書だけで、実 POS / 店舗データ、DB、backup、log、receipt、secret、`.env*` を読まず、commit しない。

- local-only: `.local/`（監査報告、公式資料の取得版、Codex 発注書）。tracked に写さず、URL と節名だけを書く。
- synthetic-only: 該当なし（fixture を作らない。mutation は Writer の作業 worktree で行い、確認後に戻す）。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review. Final Review の結果は、Double Audit の 2 本がそろうまで本節と PR body に転記しない（S1 (b)）。
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
