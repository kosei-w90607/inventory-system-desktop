# Plan Packet: 最小の実装の梯子を正本に置き、ponytail plugin を外せるようにする

wave に属さない単独の lane。手続きの正本の文（`AGENTS.md`・`docs/code_review.md`・`docs/decision-log.md`）と Writer の agent の定義（`.claude/agents/writer.md`）を変える。製品の runtime（`src/**`・`src-tauri/**`）と helper・検査・CI は変えない。

出所: owner の判断（repo 外の回答台帳 TD-526〜529、2026-10-29）。ponytail plugin（user global の `enabledPlugins`、SessionStart で main・SubagentStart で全 subagent に約 5 千字の「最小の実装」の指示を入れる）をこの project で切る（TD-528）。owner「でも強度と効果は保ちたい」を受け、切るのはこの lane の置き換えが main に入った後（TD-529）。AGENTS.md への 1 行は単独の R3 にせず手続きの lane に束ねる（TD-527）。plugin の注入が reviewer・相談役にも入ることは指示の棚卸し（repo 外の `.local/reports/instructions-reorg-2026-10-27/inventory.md` の §1.2・§5.2）が挙げた。

decision-log の番号: 本 lane は D-147 を予約する（main は D-146 まで。open の PR が足す D は D-143 まで）。

## Workflow State

- Risk: R3
- Plan Commit: pending
- Amendments: none

## Risk

Risk: R3

Reason:
`AGENTS.md`・`docs/code_review.md`・`.claude/agents/*` は classifier が `workflow=true` を出す手続きの正本で、R2 にできない（`docs/DEV_WORKFLOW.md` Risk Tiers）。

## Goal

Goal Invariant:

### 最小完了条件

- plugin を切った後も、Claude の Writer は起動のたびに agent の定義で最小の実装の梯子（下の Scope の 5 段と、削ってはいけないもの）を受け取る。
- Codex を含む全部の agent が毎回読む `AGENTS.md` に、最小の実装の規則が 1 項目ある。
- 全部の reviewer が読む `docs/code_review.md` に、作り込みすぎ（`/ponytail-review` が探していたもの）を見る観点と、その重大度がある。
- reviewer・相談役の agent の定義には最小の実装の指示を入れない（plugin を切る目的の 1 つ）。

### 失敗定義

- 梯子が「削ってはいけないもの」（入力の検証・データを失わないための error 処理・安全の境界・アクセシビリティ・明示の要求）を落とし、正しさや安全を削る読みを許す。
- 既存の規則（AGENTS.md「継ぎ足さない」・Safety「小さく、確認可能な変更」、code_review.md の「保守者として読めるか」）と重なる・食い違う文を足す。
- reviewer の定義に梯子を入れる、または code_review.md の観点が作り込みすぎを P1/P2 の blocking に上げ、正しさの review を押しのける。
- repo に既にある `ponytail:` comment（意図した簡略化の天井と次の手の印、`rg -n "ponytail:"` で 9 か所）の慣習が、plugin を外すと根拠を失う。

### 非目的

- plugin を切る操作（`.claude/settings.json` の `enabledPlugins`）。merge の後に owner が行う（Claude は書けない）。
- Coordinator の `.local/` の発注の雛形（repo の外。Writer の雛形には 2026-10-29 に梯子を入れた）。
- 効いているかの測定の仕組み。切った後の数本の lane の Final で作り込みすぎの指摘を見る（D-147 の Revisit）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- `.claude/agents/writer.md` の本文（frontmatter は変えない）: 今の 3 行の後に、最小の実装の節を足す（英語、今の本文に合わせる）。中身: (1) 先に問題を読み切る（触る code・呼出し側・流れ）。梯子は理解の後で、読む量を減らす理由にしない。(2) 梯子 — 上から最初に成り立つものを採る: 要るか（推測の要求なら作らない）→ この repo に既にある helper・型・pattern → 標準ライブラリ → 言語・platform・DB の標準機能 → 入れてある依存 → 最小のコード。(3) 足さないもの: 新しい依存、実装が 1 つの interface、変えない値の設定、「後のため」の足場。(4) bug は根本で: 共有の関数を直す前に呼出し側を全部 `rg` し、1 か所で直す。(5) 削ってはいけないもの: 信頼の境界の入力の検証、データを失わないための error 処理、安全の境界、アクセシビリティの基本、明示の要求。(6) 意図した簡略化で天井があるものは `ponytail:` comment に天井と次の手を書く（repo の慣習）。(7) 非自明な処理には失敗で red になる最小の test を 1 つ残す（AGENTS.md の「意味のあるテスト」の範囲で）。
- `AGENTS.md` の Working Rules: 「継ぎ足さない」の後に 1 項目（日本語）。要旨: 「最小の実装（D-147）: 問題を読み切ってから、要るか → 既にある helper・pattern → 標準ライブラリ → 標準機能 → 入れてある依存 → 最小のコード、の順で最初に成り立つものを採る。依存・実装が 1 つの抽象・後のための足場を足さない。入力の検証・データを守る error 処理・安全の境界は削らない。意図した簡略化の天井は `ponytail:` comment に書く。」
- `docs/code_review.md` の Blocking Review Focus の「保守者として読めるか」の後に 1 項目: 作り込みすぎ（既にある helper・標準機能の再実装、使わない柔軟さ、実装が 1 つの抽象、要らない依存、推測の機能）。finding は削る所と置き換えを名指す。重大度は既定 P3、読めなさ（既存の P2 の規則）や契約・安全に及ぶものはその規則の重大度。
- `docs/decision-log.md` の末尾に D-147（Status accepted〈owner の判断 TD-526〜529〉。Context に plugin の注入の範囲と owner の「強度と効果は保ちたい」、Decision に上の 3 か所の置き場と plugin を merge の後に切る順、Why に agent の定義は起動のたびに必ず入る・AGENTS.md は Codex も読む・reviewer には入れない、Alternatives に「plugin のまま」「今すぐ切る」「CLAUDE.md にも書く」〈CLAUDE.md は `@AGENTS.md` で取り込むので重複〉、Revisit に切った後の数本の lane の Final の作り込みすぎの指摘）。

Non-scope: `.claude/agents/reviewer.md`・`reviewer-fable5.md`・`consult-fable5.md`（入れない）、`CLAUDE.md`（`@AGENTS.md` で取り込むので書かない）、`docs/templates/subagent-review-packet.md`（code_review.md を指すので複製しない）。

## Acceptance Criteria

- AC1: `.claude/agents/writer.md` の frontmatter が変わらず（`git diff` で `---` の間が同じ）、本文に Scope の (1)〜(7) がある。`rg -n "ponytail" .claude/agents/reviewer.md .claude/agents/reviewer-fable5.md .claude/agents/consult-fable5.md` が 0 件。
- AC2: `AGENTS.md` の Working Rules に D-147 を引く最小の実装の項目が 1 つ（`rg -c "D-147" AGENTS.md` が 1）。CLAUDE.md は変わらない。
- AC3: `docs/code_review.md` の Blocking Review Focus に作り込みすぎの項目があり、既定の重大度を P3 と書く。
- AC4: `rg -n "^## D-147" docs/decision-log.md` が 1 件。D-146 以前の本文は変わらない（`git diff origin/main -- docs/decision-log.md` が追加の行だけ）。
- AC5: `bash scripts/tests/claude-hooks.test.sh`（agent の定義の frontmatter に hooks が無いことなどの検査）が PASS。`bash scripts/doc-consistency-check.sh` と `--target plan` が ERROR なし。

## Design Readiness

- 引用する設計正本（節まで）: `AGENTS.md` Working Rules（「継ぎ足さない」）と Safety（「小さく、確認可能な変更」）、`docs/code_review.md` Blocking Review Focus・Finding Severity、`docs/AGENT_OPERATING_MANUAL.md` 座組（Writer の `subagent_type: writer`）、`docs/decision-log.md`「Status の書き方」。
- 必要な設計成果物: 上の 4 file を本 PR で直す（updated in this PR）。
- plan にしかない durable な判断の昇格先: D-147。
- 前提・制約と延期した design gap: agent の定義の本文が起動のたびに subagent の system prompt に入ること（公式 sub-agents「Write subagent files」）と、非 fork の subagent が `AGENTS.md` を載せること（公式 memory。棚卸しの §1.1 に引用あり）は公式の資料に拠り、本 lane では実測しない。効き目の比較は Revisit。
- 絶対保証の例外と抜け道: 主張しない。Coordinator（main）は agent の定義を持たないので、AGENTS.md と global の `~/.claude/CLAUDE.md` の行だけで受ける（plugin より弱い。main は実装を Writer に回すので許容）。
- 判定: ready。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3・非対象 |
|---|---|---|---|---|
| D-147（Writer の最小の実装） | `.claude/agents/writer.md` の本文、座組の Writer | writer.md の節 | `claude-hooks.test.sh`（定義の形が壊れないこと） | 非対象 |
| D-147（全 agent の規則） | AGENTS.md Working Rules | AGENTS.md の 1 項目 | 非対象（文） | 非対象 |
| D-147（review の観点） | code_review.md Blocking Review Focus・Finding Severity | code_review.md の 1 項目 | 非対象（文） | 非対象 |
| D-127（継ぎ足さない） | AGENTS.md Working Rules | 新しい項目は「継ぎ足さない」と重ねず、実装の手順として書く | 非対象 | 非対象 |
| decision-log の追記の規則 | decision-log「Status の書き方」 | D-147 を末尾に足す | 非対象 | 非対象 |

## Test Plan

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| agent の定義の形 | 本文の追記で frontmatter が壊れる・hooks を持つ | CLI（既存） | `scripts/tests/claude-hooks.test.sh` | writer.md の frontmatter を壊す、hooks の key を足す |
| docs の形 | link・見出し・packet の形が壊れる | CLI（既存） | `scripts/doc-consistency-check.sh`（PK1・PK4 ほか） | packet の節や Workflow State を壊す |
