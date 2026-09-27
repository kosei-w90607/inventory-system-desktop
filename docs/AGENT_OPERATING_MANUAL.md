# Agent Operating Manual

この文書は、どのモデル・ハーネスの組み合わせでもこの repository の workflow が停止しないための **役割・独立性・座組・役割担当の一時不能（§3.3）・task-shape（§3.5）・追加 prompt の正本**。workflow の中身（phase、Risk、Plan、CI、review）は [DEV_WORKFLOW.md](DEV_WORKFLOW.md) が正本であり、本書は「誰がどの役割を担うか」を扱う（D-034 / D-046）。

## 1. 入口

セッション開始の条件付き参照ルートは [AGENTS.md](../AGENTS.md) `Session Start`。本書は役割・可用性・発注方法を判断する場合に関係する節を読み、入口のルートを複製しない。作業中の live 状態は [Plans.md](../Plans.md) を確認する。

`$inventory-workflow-start`（[Skill doc](../.agents/skills/inventory-workflow-start/SKILL.md)）が start / resume 共通の入口。resume 時は active Plan Packet の `Workflow State` を読んで、現在 Phase から dependency-ready な次の一手を選ぶ。

## 2. 役割定義（model-neutral）

役割はモデル名から独立して定義する。規範の文では、model 名は Plan Packet `Workflow State` の field の値と `## 座組` の表にだけ現れる。

| 役割 | 責務 |
|---|---|
| Coordinator | thread を薄く保ち、委譲・統合・phase 遷移を管理する。実作業は原則しない。[DEV_WORKFLOW.md](DEV_WORKFLOW.md) の `Owner Effort Budget` を承認インターフェースで可視化し、超過見込みまたは `goal-drift signal` で hard stop する |
| Plan Reviewer（Plan Gate 担当） | plan-draft を独立レビューし P1/P2 = 0 まで差し戻す。Writer と兼任不可。phase 名 plan-gate はこの役割の審査 phase を指す |
| Writer | 実装・docs 編集の書き手。one-writer rule（DEV_WORKFLOW `Subagent Budget`）に従う |
| Final Reviewer | 実装後の Final Review（broad audit）の担当。R3/R4 は Contract Audit（DEV_WORKFLOW）を source docs 直読みで実施 |
| Explorer / Evidence | read-only の広域探索・証跡収集・docs 同期。file:line 付き summary だけ返す |
| Human Gate | owner のみ。L3 実機確認、R4 承認、Ready 化、merge |

## 3. Role Assignment（役割割当の制約とAvailability）

役割の実際の担当は各 PR の Plan Packet `Workflow State` の role assignment フィールドに記録する。担当・model・effort は `## 座組` の表だけに置き、他文書へ複製しない。

以下の独立性制約は常に適用する:

- Writer ≠ Plan Reviewer
- Writer ≠ Final Reviewer
- Final Reviewer は Coordinator および Writer と fresh context（自己承認禁止）
- R4・workflow gate change は Double Audit（独立2回の Contract Audit。詳細は [DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Contract Audit (R3/R4)」参照）
- Human Gate は owner 限定
- fork は独立に数えない。第三者性の要る review は fork でない fresh な subagent を使う（owner 2026-09-23。fork は会話の全履歴を継承する: Claude Code 公式 [sub-agents](https://code.claude.com/docs/en/sub-agents)「How forks differ from other subagents」）
- 同じ round で 2 本以上の review を回すとき（Plan Review・Final Review とも。Double Audit を含む）は、同じ round の各 reviewer に、他の reviewer の結果が置かれた場所すべて（例: packet の Review Response の段落、PR body、PR の comment / review、Coordinator が保存した local の報告 file）を読ませず、その発注の本文にも他の reviewer の結果とそれ由来の観点を書かない。発注の順や同時発注に依らず、どの reviewer の発注にもこの指示を入れる。closure・是正の発注は前回 findings から始めてよい（[code_review.md](code_review.md) の `## Verification Rules` の closure の文）。すべての結果がそろうまで Coordinator は結果を packet・PR body に転記しない。読んだと申告した run は独立に数えず取り直す。Codex の broad が round をまたいで pending のときは、Claude 側の findings の是正を進めてよく、Codex には是正後の HEAD への初回 broad として（先の findings を見せず）発注する。Codex の broad が返ったら、Claude 側も同じ HEAD で broad を取り直す（helper は同じ head/base の broad だけを Final Review Minimum に数える。`scripts/pr-gate.py` の `record`）。取り直しの発注にも Codex の結果と先の findings を見せない（2026-09-25 の dogfood 所見: PR #97・#94 で 2 回取り直した）
- Writer が Codex の packet は、Writer と別 vendor の Plan Reviewer を含める（担当は `## 座組`）。同じ vendor の fresh context はこの条件を満たさない（D-062 の原則「縛られる側に gate 文と検査器を書かせない」）
- load-bearing な判断（Plan Gate、Final、裁定）は担当者が正本を直接読み、subagent の要約は claim として扱う（[DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Subagent Budget」の Load-bearing decisions の項）
- Plan Reviewer と Final Reviewer は別の fresh context（同じ model・vendor でよい）

数値閾値（`Owner Effort Budget` 等）は [DEV_WORKFLOW.md](DEV_WORKFLOW.md) を参照し、本書には再掲しない。

### 3.3 Capacity-degraded（役割担当の一時不能）

個別の役割担当（Coordinator / Plan Reviewer / Final Reviewer）が rate limit・枠切れ・障害で一時的に利用不能な場合は次を適用する:

- 利用できない役割だけを pending にし、理由を 1 行残す
- pending の役割を要する遷移（plan-approved、Final Review の record、Ready）を進めない。それ以外の作業は続ける。別 vendor の reviewer が使えない間は、使える reviewer で進められる review を進め、別 vendor を要する review だけを待つ
- owner が代替担当を指名するか、同 vendor の fresh context で再開する。§2 の独立性（Coordinator の自己承認禁止）は代替時も維持する
- 代替が決まらない場合は [Plans.md](../Plans.md) のブロッカーへ記録し、pending の役割を要する遷移を進めない
- Plan Review の Codex 分は上の 2 つ目の項目（pending の役割を要する遷移を進めない）の例外とし、`## 座組` の表の Codex 停止中の列に従う。Final Review の Codex の枠は 2 つ目の項目のとおり pending にする
- Codex の Final Review の枠は Codex の別 model（`## 座組` の Final Reviewer 行の Codex の候補）でのみ代替できる。Claude での代替は owner の明示決定（decision-log に記録）だけで、Coordinator の指名では不可。Codex の結果が得られるまで枠は pending

### 3.5 Task Shape: one-shot irreversible

`一回きり × 不可逆 × owner gate 必須` の task shape では、非同期自律実行ではなく owner 同席の time-boxed 同期セッションを選べる。この task-shape 軸は Risk に直交する。

- セッション前に Goal Invariant、利用者可視の完了1文、time-box、正確な mutation target、停止条件、利用可能な rollback / containment を固定する。
- owner は不可逆 mutation の直前 gate に同席し、Coordinator は承認依頼に `この change での介入 N 回目 / 予算 M 回` を表示する。runbook 実行と最小証跡の記録は agent が担い、owner に証跡編集や relay を求めない。
- time-box、Owner Effort Budget、または `goal-drift signal` に達したら mutation 前に停止する。同期セッション中に自由な証跡拡張へ切り替えない。
- 新規スクリプトは「どの具体的な failure path を防ぐか」を1文で説明でき、Goal Invariant の最小完了経路に必要な場合だけ作る。説明できない一回限りの補助スクリプトは作らない。

## 座組

| 役割 | Codex 稼働時の担当 | Codex 停止中 | effort |
|---|---|---|---|
| Coordinator | Opus 5.5 の main session | 同じ | high（owner 2026-09-23） |
| Writer | Opus 5.5 の subagent（Codex も可。Writer が Codex のときは §3 の独立性の項の Writer が Codex の場合に従う） | Opus 5.5 の subagent | medium（owner 2026-09-23。Codex が Writer のときは Plan Reviewer 行の Codex の値）。実効値の注意: Agent tool から直接起動する subagent は session の値（high）を継承する。Workflow から起動する subagent は effort を指定できる。tracked の定義 file（`.claude/agents/**`）は `.gitignore:116` の除外の解除と classifier の穴と一緒に PR5。実効値を run 報告に記録する（公式 [sub-agents](https://code.claude.com/docs/en/sub-agents)「Supported frontmatter fields」の `effort`） |
| Plan Reviewer | fresh Opus 5.5（fork でない）+ Codex（GPT-6 Astra 既定。owner の指定で GPT-6 Sol） | fresh Opus 5.5 だけで進める（§3.3） | Opus = medium（実効値の注意は Writer 行と同じ）。Codex は model ごと: Astra = 既定 medium・難所 high（owner 2026-09-07 / 08）、Sol = 既定 high（owner 2026-09-14） |
| Final Reviewer | Claude 側 1 本 + Codex（GPT-6 Sol 既定、難所は GPT-6 Astra）。Claude 側は R3 以上と design lane で Fable 5.1、それ以外は fresh Opus 5.5。closure（base 同期を含む）の Claude 側の既定は Fable 5.1（owner 2026-09-25）。Codex の本務はレビューとしての合否判定で、是正の後の取り直しでも外さない。修正案は一案で採否は Coordinator（owner 決定 2026-09-25）。Fable が使えないときは §3.3 に従い理由を 1 行残して fresh Opus 5.5 で代えてよい。発注と実効 model が違う（宣言なしに切り替わった）run は数えず取り直す | Claude 側を済ませ、Codex の枠は §3.3 に従い pending（Ready 以降だけが止まる） | Fable 5.1 = high（owner 2026-09-25）、Opus = medium、Codex は Plan Reviewer 行と同じ |
| 相談役 | Fable 5.1。Plan Review・Final Review の P1/P2 の差し戻しと、Gated Amendment を書くたびに、是正を書く前に反例探しを頼む。Writer・reviewer の数に入れない。使えないときは省くか fresh Opus 5.5 で代え、遷移を止めない。相談した run は closure に数えず、closure は fresh context で行う。advisor（公式 [advisor](https://code.claude.com/docs/en/advisor)、experimental）は座組の必須にしない。使う場合は main の Opus 5.5 に Fable 5.1 を組み、有効化は owner（`/advisor` 等）。Max では Fable の使用が週の上限の 50% を超えると usage credits になる | 同じ | high（owner 2026-09-25） |
| Human Gate | owner（判断は owner。委任の範囲は [AGENTS.md](../AGENTS.md) の Decision and Approval Boundaries） | 同じ | — |

- 確認日: 2026-09-27。担当と effort は owner 決定 2026-09-07 / 08・14・23・24・25 による。
- モデル更改時は owner 決定を受けてこの表だけを書き換える。座組・effort を他の文書へ複製しない。owner をモデル間の伝書鳩にしない（発注は Plan Packet / PR body / review packet という repository 証跡経由で渡す）。
- effort の選び方: 見落としを防ぐことを優先し、修正・再試行・再レビューを含むタスク完了までの総 token で効率を判断する。低い effort が効率的とは限らず、選択理由と取得できた usage / 実効 metadata を残し、未取得は未実測とする（owner 2026-09-14）。
- Fable は context を絞った subagent の発注で使い、advisor は常用しない（owner 2026-09-25「週制限のなかで Fable 持て余す、指揮を Opus にしてる分」）。1〜2 週ごとに `/usage` の Fable の消費を見て出番を増減する。
- 根拠: [Opus 5.5 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5-5#calibrate-effort)「Calibrate effort」、[effort](https://platform.claude.com/docs/en/build-with-claude/effort)「Recommended effort levels for Claude Opus 5.5」、[Fable 5.1 prompting guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-fable-5-1)。名前の同じ effort を model 間で同じ思考量と見なさない。

## 4. 既存資産 router 表

| 場面 | 使う資産 |
|---|---|
| start / resume kickoff | [.agents/skills/inventory-workflow-start](../.agents/skills/inventory-workflow-start/SKILL.md) + Plan Packet `Workflow State` |
| Codex/OpenAI session | [agent-guidance index](agent-guidance/README.md) |
| wave 編成 / resume / merge train | [DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Wave Operation」+ [Plans.md](Plans.md)「Wave Registry」 |
| Design Phase | [DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Design Phase Rules / Impact Review Lenses」 |
| 実装 | [.agents/skills/inventory-implementation](../.agents/skills/inventory-implementation/SKILL.md) + [docs/templates/plan-packet.md](templates/plan-packet.md) |
| Contract Audit / review-only subagent | [DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Contract Audit (R3/R4)」+ [docs/templates/subagent-review-packet.md](templates/subagent-review-packet.md) |
| PR review 依頼 | [docs/code_review.md](code_review.md) |
| 設計書レビュー観点 | [docs/quality/review-checklist.md](quality/review-checklist.md) |
| PR handoff | [.github/pull_request_template.md](../.github/pull_request_template.md) + [DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Draft PR Checkpoint」 |

## 5. 追加 prompt / 発注 profile（本 manual が正本）

### 5.1 Field-check / 実機調査 kickoff prompt

```text
目的の業務フローを 1 文で固定する。

1. 「事実確認」と「設計判断」を分離する。docs/ARCHITECTURE.md の POS Adapter Boundary に従い、実機 / PC ツール / 外部ファイルで確認した事実は adapter facts として記録し、BIZ/CMD/UI/DB の contract へ昇格する判断は Design Phase で行う。
2. 調査項目は GitHub issue でバッチ管理する。各項目は L3 checklist 形式で、場所 / 操作 / 目視できる合格基準を必ず書く。参考実例は issue #135。
3. 証跡は匿名化または形状のみを残す。実 JAN、実商品名、価格、店舗固有情報、実ファイルは repo に入れない。
4. 結果は docs/plu-export-and-real-csv-verification.md 方式の状態列で source doc へ反映する。
5. adapter facts がアプリ core の contract に影響する場合は、同じ PR で source doc / decision-log へ昇格するか、後続 Design Phase の blocker として明記する。
```

### 5.2 Backfill audit prompt

```text
対象領域の source docs を必ず開いてから audit する。

1. 各判断を次に分類する:
   (a) source docs で復元可能
   (b) archive plan・PR body 頼み
   (c) code を読まないと不明
   (d) 変更前 backfill 必須
2. 判定フロー:
   - docs と code が矛盾しているなら、即修正 PR を切る。
   - 次 PR で触る contract の手順欠落なら、その PR の Design Phase 内で backfill する。
   - 外部境界の判断が archive にしかないなら、decision-log へ 1 エントリ昇格する。
   - それ以外は backfill しない。
3. 自己検証として「docs にある設計を無い扱いにしていないか」を必ず確認する。
4. backfill 専用 PR は月 1 本まで。超えそうなら backfill ではなく設計変更として Design Phase を回す。
```

### 5.3 Plans.md cleanup prompt

```text
docs/Plans.md cleanup は DEV_WORKFLOW.md の Post-Merge Closeout に準拠する。

1. 「現在の基準」の SHA / PR 番号を GitHub main の実態と突合する。
2. 完了項目を archive へ移す。archive へ移したリンクは必ず相対パスへ変換する。
3. 同一項目の重複記載を 1 箇所へ統合する。
4. 「次の行動」が空なら、active runway / roadmap / backlog から補充する。
5. bash scripts/doc-consistency-check.sh を実行し、green を確認してから PR / closeout を完了する。
```

### 5.4 低制約発注書 profile（read-only の Reviewer / Explorer 向け）

read-only の Reviewer / Explorer への発注書はこの profile を用いる。次の 5 点のみで構成し、過程指示・検証手順の指定を書かない（手順を縛るほど性能が落ちる世代特性への対応。findings は claims として Coordinator が裁定し、検証は workflow 側が担うため、実行者に process 契約を内面化させる必要がない）:

1. goal（何を判定・報告してほしいか）
2. scope 境界（対象物と読取り範囲）
3. read-only 宣言（ファイル変更・git / PR 操作の禁止）
4. 報告フォーマット（Verdict 形式・件数上限・file:line 実読・全文 dump 禁止）
5. subagent 生成上限（既定 0。委譲過多傾向への上限明記は必須）

出力契約（4）と委譲上限（5）は必ず書く。観点 list・必読順・検証 command の指定は書かない。Writer への発注など他の発注には従来型発注書（手順込み、§5.6）を使う。Contract Audit / Final Review 役への発注では、[DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Contract Audit」の実施項目を**検証対象として scope 境界（2）に列挙する** — これは対象物の指定（出力契約）であり過程指示ではない。検証の手順・順序・command は引き続き指定しない。

### 5.6 従来型 Writer 発注書の共通出力契約

本節は、§5.4 の read-only Reviewer / Explorer 専用の低制約 profile ではなく、手順を含む従来型発注書で Writer に実装を発注する場合を対象とする。

仕様は設計正本、R2+ の変更範囲・AC・commit 条件は承認済み Packet（適用済み Amendment を含む）を参照する。発注書は該当節・ID を指し、条件全文を転記しない。R0/R1 は合意済みの依頼範囲と設計正本を参照し、発注のために Packet を新設しない。食い違いは Coordinator が正本と発注書を訂正し、Writer が独断で条件を外さない。

発注には次の情報を置く。これは人が読む構成例であり、機械 parse 用の固定 schema や追加の承認 gate ではない。

| 項目 | 記載内容 |
|---|---|
| 種別・対象 | 初回 / 再開、作業 worktree、branch、開始 HEAD。HEAD の照合はその worktree で行う |
| 正本 | Packet / Matrix と適用済み Amendment の参照。R0/R1 は依頼範囲と設計正本 |
| 現在地・残作業 | 完了済みの変更と残作業を Scope / AC の ID（R0/R1 は依頼項目）で示す。未 commit の作業があれば状態も明示する |
| 固有の実行条件 | この run に必要な環境準備、既に許可された操作、編集禁止対象。権限を新たに広げない |
| 検証・報告 | 必要な検証への参照、再利用候補の証跡と適用範囲、報告先。報告は開始 / 終了 HEAD、完了 / 残作業、実施・再利用・未実施の検証を区別する |

**作成・訂正の手順**:

1. 起票時に、対象を使う呼出し側・隣接 test・helper / mock・生成物・依存更新の波及を現物で確認し、必要な file と変更目的を Packet の Scope / Registration / Generation Obligations へ含める。既存 REQ を参照する test の追加・変更・削除も traceability 再生成の対象（template の該当行を参照）。「関連 file 全般」の包括許可に置き換えず、未承認の拡張は既存 Gated Amendment で扱う。
2. 指定する doc 節は `rg` で番号の実在と内容の一致を確認する。数値は対象版で同じ command を実行した出力に基づき、未実測の期待値を停止条件にしない。helper 名から実 router 等を推定せず実装・mock 境界を読む。AC の可観測性と削除検査の旧例 / 新例は [Packet template](templates/plan-packet.md#acceptance-criteria)、経路と mutation の選び方は [Matrix](templates/test-design-matrix.md) に従う。
3. 初回は承認済み計画の着手条件を対象 worktree で確認する。再開は現在の HEAD・変更状態・前回報告から「完了済み / 残作業 / 証跡」を書き直し、実装前 baseline を完成後の状態に要求しない。長い改訂履歴は過去報告への参照へ寄せる。証跡再利用と再検証は対象変更・正本の条件に従い、失敗した検証を再利用で PASS にしない。
4. 発注直前に最終版を正本と対象 worktree の現在地へ照合し、Scope・AC・commit 条件、および必須 command の出力先が編集禁止範囲に入らないことが同時に成立するか確認する。訂正は停止した一文だけで終えず、[Plan Packet Rules](DEV_WORKFLOW.md#plan-packet-rules) の旧前提 sweep を最終発注書・再開指示にも適用する。Packet が不変で発注書だけを訂正するときも同じ照合を行う。

既存の Plan Review では上記の現物根拠を確認し、Plan Gate 後に作る発注書の最終照合は Coordinator が引き取る。追加のレビュー段階は設けず、正本の変更が必要なら既存の改訂・承認経路を使う。

遷移 commit の作成主体や Writer / Coordinator の分担は、本節で再配分しない。[DEV_WORKFLOW.md](DEV_WORKFLOW.md) の現行規範と per-change Plan Packet の定めに従う。

節番号と REQ 再生成の注意は上記の作成手順へ統合した。出典: PR #72 / #84 / #85、および PR #61 / #64 / #67 / #70 / #71 / #75 の発注訂正記録。

**Writer が編集前に止まったとき**:

1. 発注と適用版の正本が一致しない場合、Writer は編集を始めず、不一致箇所・正本の参照・現在 HEAD を Coordinator へ返す。
2. 正本が一意で発注だけが誤っている場合、Coordinator は発注を作り直す。この訂正で Scope・AC・commit 条件・権限・phase・Risk・review 数を変えない。
3. Coordinator は訂正後に本節の作成・訂正の手順 4 の最終照合（旧前提 sweep を含む）を行う。
4. 2 と 3 を満たす発注の訂正は owner への中継を要しない。行き先は [DEV_WORKFLOW.md](DEV_WORKFLOW.md#問い合わせの行き先)「問い合わせの行き先」を参照する。
5. 正本が曖昧な場合はこの経路を使わない。正本の意味を変える場合は既存の独立確認と Gated Amendment へ戻る。
6. finding の採否と権限の追加は発注の訂正として扱わない。
7. 上記の「食い違いは Coordinator が正本と発注書を訂正し、Writer が独断で条件を外さない」のうち、正本の訂正は 5 の経路で行い、Coordinator が単独で行えるのは 2 の発注の作り直しだけである。5 の「既存の独立確認と Gated Amendment」は、上記の「正本の変更が必要なら既存の改訂・承認経路を使う」が指す経路である。
8. 例: PR #85 の「合成モデルは変更しない」という発注とモデル是正の要求の衝突は、正本の変更が必要な例であり、発注の訂正として通してはならない。

## 6. ハーネス間の既知の非対称（重要な注意）

- `.codex/hooks.json` は gitignore 済みの未確認実験で非稼働。Claude側もD-059採用時点のtracked project hook inventoryは0本。両harnessともpre-push / local full / hosted CIの正本gateとreview-only packetを使う。
- `$inventory-workflow-start` 等の `$` 記法は Codex/OpenAI harness の入口。Claude や他 agent は `.agents/skills/*/SKILL.md` を plain procedure docs として読む。
- 同時に動かす subagent の数に上限は置かず Coordinator が決める（[DEV_WORKFLOW.md](DEV_WORKFLOW.md)「Subagent Budget」）。depth 1 と one-writer は守る。

### 6.1 Claude project hook の所有境界

Claude Code hook は、設定の置き場所と効力を分離する（D-059）。

- user-global `~/.claude/settings.json` は repository 非依存の個人設定だけを所有し、この repository 固有の command、path、`Plans.md` 更新指示を置かない
- tracked `.claude/settings.json` が repository 固有 hook inventory の唯一の正本。D-059の採用時点ではinventoryを0本とし、Plan GateをClaude固有hookで再実装しない
- `.claude/settings.local.json` は machine-local override であり、tracked 正本の代用にしない。repository の `.gitignore` でも保護する
- plugin hook は project hook と別の decision layer。plugin 単位で監査・採用を決め、未監査または宣言と実効動作が一致しない plugin は project scope で無効化する。plugin cache の直接 patch は行わない
- 将来decision hookを再導入する場合は、入力、stdout、stderr、exit code、許可 / 拒否条件、正常系runtime、timeoutを先に契約化し、fixture testを持たせる。既存checkerの単純接続は、正常系runtimeがhook timeoutを超えないことを複数回実測するまで採用しない
- advisory hook は tool 実行の成否や副作用を command 文字列だけから推定しない。実際には完了していない push / PR 作成を完了済みと表現したり、read-only role へ tracked write を命じたり、`[MANDATORY]` 文言で repository workflow を上書きしたりしない
- Plan Reviewer、Final Reviewer、subagent の要否は Plan Packet と DEV_WORKFLOW が所有する。旧hook固有の7観点 `Self-Review` とplan rally強制は後継なしで退役する。hook は model 名、agent log、時間窓、個人 memory を根拠に追加 review を強制しない
- effective hook inventory（0本を含む）とplugin無効化はrepo-owned testをlocal fullとhosted finalの両方で実行する
- CASIO 語彙（`Z00x` / `CV17` / `SR-S4000` / `CP932`）の BIZ/CMD 契約への混入検出は機械ガードが存在しない。レビューが最後の砦であり、[review-checklist](quality/review-checklist.md) の設計判断レンズ #2 を必ず使う。
