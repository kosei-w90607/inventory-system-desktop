# Plan Packet: デザインの決まりを「見る人の受け取り方」から組み直す（design-first、docs、R2）

2026-09-24 起草。起源は owner と Coordinator が 2026-09-24 に進めたデザインの見直し（owner と作った非公開の canvas 2 枚: 棚卸し画面の再設計案と、デザインの決まりの見直し案）。owner の判断の要旨と日付は本 packet の「設計判断の出典」に置き、発言の原文は公開 repository に置かない（owner 決定 2026-09-21 の方針に従う）。

本 lane は design-first の文書改訂だけを扱う。`src/styles/globals.css` の token の値の変更・全画面への適用・書体の同梱・棚卸し画面 D1 の実装は、本 packet の [Non-scope](#non-scope) で切り分けた後続 lane が持つ。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Evidence Mode: github
- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session）
- Writer: Opus 5.5 subagent（worktree run）
- Plan Reviewer: Opus 5.5（fork でない fresh subagent、Writer と別 context）
- Final Reviewer: Opus 5.5 fresh subagent + Codex（互いに独立、Plan Reviewer とも別の fresh context）
- Final Review Minimum: 2
- Human Gate: ready,merge

manual なし: 製品 runtime・画面・配布物は変わらない文書改訂で、Windows native で確かめる対象がない。画面の見た目の確認（owner の目・実機 L3）は後続の runtime lane の Human Gate に置く。

座組の根拠と現行規則との衝突（明記）:

- 座組は owner 決定 2026-09-23（Opus = Opus 5.5 を Coordinator / Writer / review に全面解禁）と 2026-09-24（差し戻し時は相談役として Fable 5.1 を入れる）による。
- 現行の tracked 規則とは衝突する。`docs/AGENT_OPERATING_MANUAL.md` §3 の高自律・低制約適性 slot の項（D-056）は Opus を read-only の Reviewer / Explorer 専任とし、§3.4 の表は Opus を Claude Opus 5 とする。この衝突を解く規則改訂は別 lane `agent/harness-overhaul` が持ち、本 packet は owner 決定を根拠に先行して座組を使う（並走 lane `agent/docs-restore-and-rules` の packet と同じ扱い）。
- Execution Mode は現行 enum から選ぶ。Fable 5.1 が相談役として利用可能なため §3.2 の定義上 `fable-window` とする。
- Plan Reviewer と Writer は同じ vendor・同じ model。`docs/DEV_WORKFLOW.md` Review Rules の vendor 条項（D-062）は Writer が Codex の packet に掛かるもので、本 packet には literal に掛からない。同 vendor の Plan Review で packet の前提誤りが通過する残余（PR #88 の dogfood 所見）は、Final Review の Codex が別 vendor の目で受ける。
- Final Review Minimum は R2 なら 1 を選べ、`scripts/ci/classify-changes.sh` は本 lane の予定 file をすべて `docs=true`・`workflow=false` に分類する（`docs/design-system/*` と `docs/quality/*` は policy docs の列挙に含まれない）ため helper も 2 を要求しない。owner 決定の Final Review 座組（fresh Opus + Codex）に合わせて 2 とする。Codex を待たない判断をするなら Plan Gate 前に 1 へ下げる（Plan Gate 後は helper が変更を拒む）。

遷移記録（append-only）:

- kickoff → spec-check → design → plan-draft（2026-09-24、Coordinator 起草）: 設計判断は owner と canvas で 2026-09-24 に確定した（「設計判断の出典」）。本 lane は design-only scope で、その判断を source docs へ反映すること自体が実装にあたり、[Spec Contract](#spec-contract) が反映内容を固定する。未解決の設計質問は書体の最終採用だけで、runtime lane の実機比較へ明示的に defer した（SPEC-DSR-RENEW-D3）。
- plan-draft → plan-gate（2026-09-24、Coordinator）: packet と Test Design Matrix を plan-first commit で確定し、`docs/Plans.md` の `## 次の行動` に登録。fresh Opus の Plan Review へ。

## Owner Effort Budget

- 介入回数上限: 3（見込み: Codex の Final Review relay 1、Ready 1、merge 1）
- 実働時間上限: 20分（文書だけの変更で、owner の作業は relay と Ready / merge の判断。規則の文面が canvas の判断どおりかは Ready 判断の中で見る）
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers と `docs/project-profile.md` High-risk Changes を当てた。変更は design-system の文書（色の役割・強調の段階・書体・ラベルと値・原則・DSR の並び）と、その参照元の文書の同期だけで、runtime 契約・DB・CSV/TSV・command・route/search・画面の振舞い・画面の文言を変えない。画面の見た目を変える runtime lane は別 packet（R3、manual 付き）とする。

gate への影響を確かめた（Risk は file の種類でなく gate と利用者への影響で決める）:

- 本 lane の予定 file を `scripts/ci/classify-changes.sh` に渡すと `docs=true`・`workflow=false`・`frontend=false` になる（同 script の 59 行目の policy docs 列挙に `docs/design-system/*`・`docs/quality/*`・`docs/UI_TECH_STACK.md`・`docs/decision-log.md`・`docs/backlog.md` は含まれない）。
- merge gate の合否に効く唯一の経路は `scripts/doc-consistency-check.sh` の DS1〜DS4 で、checker は `docs/design-system/00-foundations.md` / `01-decision-rules.md` / `02-component-catalog.md` の file 名と `## DSR-NN` 見出しを固定で読む。file を改名・分割すると DS2 / DS3 は「見つかりません。スキップ」の INFO で素通りし、検査が黙って弱まる。本 packet はこれを防ぐため file 名・見出し形式・token 表の書式を [Spec Contract](#spec-contract) の SPEC-DSR-RENEW-D9 で固定し、AC で DS2 / DS3 の実行結果（件数）を確かめる。gate の定義（script）は変えない。
- 先例: design-system の文書だけを改訂した lane は R2（`docs/archive/plans/2026-09-05-ui-conventions-batch-design.md`、`2026-08-20-design-backbone-reference.md`、`2026-07-04-design-system-drift-sync.md`）。runtime へ反映する lane は R3（`2026-09-08-ui-conventions-runtime.md`）。
- 規約文書は後続の実装とレビューの判断基準になるため R1 ではない。Test Design Matrix は R2 で任意だが、複数 file にまたがる番号の付け替え・参照の同期・「置かないもの」の検査を機械で確かめるため必須として付ける。

## Goal

Goal Invariant:

### 最小完了条件

- 新しい画面や修正を設計する人が、改訂後の design-system 文書だけを読んで、色（どの役割か）・強調（何段目か）・書体（いまは何を使い、何が採用前か）・補足情報の見せ方（ラベルと値の組）を迷わず選べる。選んだ理由を「見せ方 → 見る人の受け取り方 → 狙う効果 → 根拠」の 4 列で説明できる。
- 原則が 1 か所にまとまり、DSR-01〜24 は番号を変えずに話題から引ける。README が「どこを読めばよいか」の索引になっている。
- 現行の実装（amber の primary 等）と改訂後の決まりが食い違う箇所は、文書の上で「runtime lane 待ち」と明示され、読む人が現行の見た目と狙いの見た目を取り違えない。
- `bash scripts/doc-consistency-check.sh` の DS1〜DS4 が改訂前と同じ強さで働き続ける（file 名・DSR 見出し・token 表の突合件数が減らない）。

### 失敗定義

- 改訂後の文書だけでは、上の選択のどれかで答えが 2 つ以上になる、または答えが無い（例: 「進行中」を何色で示すかが読めない、書体が決まったのか採用前なのか読めない）。
- canvas の候補値（未実装の HEX）が canonical docs（`docs/design-system/*.md`・`docs/quality/review-checklist.md`）に載り、DS3 の検査対象外の書式で未実装値が正本に紛れ込む（2026-09-03 の Codex P2-2 と同型）。
- file 改名・見出しの書式変更・token 表の行の削除で、DS2 / DS3 の検査対象が黙って減る。
- 旧原則番号を引いている文書が、番号の付け替えで別の原則を指したまま残る。
- owner の判断（1 色 1 役割、操作と進行中は同じ緑寄り、黒の 2px 枠と長いバッジは避ける、書体は Noto Sans JP が好みで最終は実機、ラベルと値の組）と食い違う規則を書く。
- 発言の原文・canvas の URL・`.local/` の path・店の実データを tracked file に書く。

### 非目的

- 画面の見た目を変えること（token の値・部品・画面は runtime lane）。
- 書体を決め切ること（実機比較の後に runtime lane が決める）。
- 02 部品カタログを新しい token へ書き換えること（token が実装されたときに runtime lane が同期する）。
- DSR の新設・廃止・番号の付け替え、DSR 本文の全面的な書き直し（矛盾の解消に必要な改訂だけ）。
- DSR 24 本それぞれへの 4 列の付与（4 列は 00 土台の token と規則に持たせる。DSR は既存の Why が受け取り方を担う）。
- doc-consistency-check の検査の追加・変更。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

この文書を完了できること（本 lane）と、店主が画面を見て狙いどおりに受け取れること（通常運用の目的）は別である。後者は runtime lane の token 反映と実機 L3 まで達成しない。下表は本 lane の完了後に、設計する人（Coordinator・Writer・reviewer）が改訂後の決まりだけで普通の作業を進める列である。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 新しい画面を設計し始める。改訂後の design-system だけを開く | README の索引から読む順（00 土台 → 04 原則 → 01 判断ルール → 02 部品 → 03 出典）と「迷ったらここ」を引く | どの問いをどの節で解くかが 1 か所で分かる | 索引の全行が実在の節へ届く | なし（AC4 で索引の行と節の対応を確かめる） |
| 押すボタン・作業中の対象・確かめてほしい行・済んだ知らせを置く | 00 の色の役割表で役割を選び、強調の段階表で段を選ぶ | 各要素の役割（操作 / 進行中 / 注意・確認 / 完了 / 危険・戻せない / ふつう・補足）と段（0〜4）、1 画面あたりの上限、受け取り方と狙う効果と根拠が 1 つに決まる | 同じ要素に 2 つの役割・段が当たらない | 進行中の token は runtime lane まで未実装（SPEC-DSR-RENEW-D8）。その間に進行中を実装で使う画面は runtime lane を先に通す |
| 選んだ役割の「今の見た目」を確かめる | 00 の役割表の「現行の実装」列と「移行」列を読む | 現行の token（例: 操作 = `--primary`、現行値は amber）と、runtime lane 待ちかどうかが分かる | 狙いと現行の差が表の上で読める | 候補値（緑寄りの色）は canonical docs に無い。値は D-091 の候補と runtime lane の実測で決まる |
| 商品名の下に補足情報（部門・コード・前回数えた数・数えた日）を置く | 00 のラベルと値の組の規則を当てる | 何の値かを言葉で言い切るラベル（小さく薄く）と値（ふつうの濃さ）の組になる | 日付・数量のそれぞれに、何の日付・何の数かのラベルが付く | なし |
| 書体を選ぶ | 00 の書体の節を読む | いまは現行の system font stack を使うこと、候補 2 つ（Noto Sans JP / BIZ UDPゴシック）と選定条件、最終採用は runtime lane の実機比較で決まることが分かる | 「決まっていない」ことが明示され、勝手に書体を差し替えない | 店の PC に BIZ UDPゴシックが入っているか、Noto Sans JP の同梱サイズ（どちらも 未実測）は runtime lane B で確かめる |
| 既存の DSR を探す | 01 の話題別の索引（配置と一覧 / 入力 / 知らせ方 / 移動と戻り / 色と状態）から DSR 番号を引く | 旧番号のまま該当の DSR に届く | 24 本すべてが索引に 1 回ずつ載る | なし |
| 古い文書やコードのコメントに「04-backbone 原則 15」等の旧番号を見つける | 04 の旧番号対応表を引く | 新しい原則番号へ辿り着ける | 旧 1〜16 の全行が対応表にある | なし |

## Scope

Writer は下の file だけを編集する。対象を使う呼出し側（link・番号参照・checker）は起草時に `rg` で洗い出し、[Test Design Matrix](test-matrices/2026-09-24-design-rules-renewal.md) の Adjacent Pattern Audit に列挙した。

- S1 `docs/design-system/00-foundations.md`（土台）: 色の役割表（SPEC-DSR-RENEW-D1）、強調の段階（D2）、書体の節の改訂（D3）、ラベルと値の組と進み具合（D4）を新設・改訂する。新しい規則の節は「見せ方 / 受け取り方 / 狙う効果 / 根拠」の 4 列の表を持つ。既存のカラーパレット表・セマンティックカラー表は行も HEX も変えず（DS3 の突合対象）、各行が役割表のどの役割に属するかを示す列を足す。4 色エリアモデルの節・ウォーム系の論拠の節は、役割表と矛盾する文だけを直す（ニュートラルの stone はウォームのまま、役割色は色相で役割を分ける）。metric 行の「原則 15（04-backbone）」は新番号へ直す。
- S2 `docs/design-system/04-backbone.md`（原則）: 03 の哲学と 04 の 16 原則を 10 本前後の原則に統合する（D5）。各原則は 1 文 + 受け取り方と効果 + 根拠（出典は 03）で書く。旧番号対応表（旧 04 原則 1〜16 → 新番号、旧 03 の各節 → 新原則または 03 の出典）を置く。役目を終えた節（「foundations への追記分（token）」「00〜03 への反映先」「適用の順序」）は削り、内容が 00 に無いものだけ 00 または新原則へ移す。削った旧文は `git show dda8560a:docs/design-system/04-backbone.md` で引けると更新履歴に 1 行書く。file 名は変えない。
- S3 `docs/design-system/03-philosophy.md`（根拠の出典）: 原則を持たない「根拠の出典」へ改める（何を取り、何を取らないかは維持）。Laws of UX 日本語版（『UXデザインの法則』第 2 版、オライリー・ジャパン、2025-01）と、DSR が引く既存の出典（原田秀司『UIデザインの教科書［新版］』、NN/g、GOV.UK、WCAG）を一覧に揃える。`02-component-catalog.md` 72 行目が引く「japanese-webdesign の適用境界」の節は残す。file 名は変えない。
- S4 `docs/design-system/01-decision-rules.md`（判断ルール）: 冒頭に話題別の索引を置き、DSR の節を話題の順に並べ直す（D6）。矛盾する DSR を改訂する（D7）。`読み方` の Why の接地先を「00 の役割表と 03 の出典」へ直す。
- S5 `docs/design-system/README.md`（索引）: 読む順・「迷ったらここ」（問い → 節）・移行中の読み方（D8）・各 file の責務表を書く。機械強制の節は残す。
- S6 `docs/design-system/02-component-catalog.md`: 旧原則番号の参照（895・897・1012 行付近。874 行の原則 4 は新番号も 4 で変えない）を新番号へ直し、冒頭に「現行実装の canonical であり、00 の移行列が runtime lane 待ちとする項目は 00 / 04 / 01 を狙い、本書を現行として読む」旨の 1 文を置く。それ以外の部品の記述は変えない。
- S7 `docs/quality/review-checklist.md` カテゴリ 9: 旧原則番号と「③強調=琥珀pill」の記述を新規則へ合わせ（移行中は現行実装も可と明記）、色の役割と強調の段階を見る 1 行を足す。全行に DSR 参照を保つ（DS4）。
- S8 `docs/UI_TECH_STACK.md`: §1「デザインシステム」表のカラーパレット行と「哲学のスタック」節、§4 の索引表を、README の索引と 00 の役割表へ向ける。先頭の「時点証拠契約」節（並走の ADR lane が編集中）には触れない。
- S9 `docs/decision-log.md`: D-091 を追加する（D10）。
- S10 `docs/backlog.md`: 後続 lane 3 件（runtime lane A / B、棚卸し画面 D1）を起票し（D11）、41 行目の「`04-backbone.md` の token 表 min-height 40px」の参照を新しい置き場所へ直す。

`docs/Plans.md` は Coordinator が Workflow State の遷移と一緒に更新し、Writer は触らない。packet と Matrix は Writer が編集しない。

## Non-scope

- `src/styles/globals.css` の token の値の変更・進行中 token の新設・`--rank-top-*` の撤去、それに伴う 00 の HEX の更新と DS3 の同期、横断部品（button・ナビの現在地・badge・現在行）と全画面への適用 → runtime lane A（R3、manual 付き、before / after を並べて owner が見る L3）。
- 書体の実機比較・採用・同梱（依存追加は D-030 の名指し・`--save-exact` に従う）・等幅数字の適用 → runtime lane B。
- 棚卸し画面 D1（owner 採用 2026-09-24）の実装 → ㉘ 以降の棚卸し実装 lane と組にする（挙動も変わるため見た目だけ先に変えない）。
- `docs/SCREEN_DESIGN.md` の画面ごとの色の記述（ホームの入口 card の「primary 枠 + warning soft 背景」、ランキング 1 位の黄色バッジ、「手動」の黄色バッジ、§のウォーム系セマンティックの要約）→ 画面を変える runtime lane A が画面と同時に直す。現行の実装を正しく記述しているため、本 lane では変えない。並走 3 lane も同 file を編集中。
- `src/components/patterns/PageShell.tsx` のコメント「04-backbone.md 原則 6」→ 新番号も 6 のため変更不要（旧番号対応表で確認できる）。`docs/function-design/73-ui-stocktake.md` の「04-backbone.md 原則 4」も新番号 4 のため変更不要。
- `docs/design-system/reference/` の mockup と提案原文（正本ではない）。
- `scripts/doc-consistency-check.sh` の DS 検査の変更（file 名を変えないため不要）。
- 02 部品カタログの改題（canvas 案の「03 部品カタログ」）と 01 の改題（「02 判断ルール」）。checker が file 名を固定で読むため採らない（D9）。

## Acceptance Criteria

- AC1 `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0。WARN は改訂前（`dda8560a`、full で WARN 0）から増えない。
- AC2 DS 検査が弱まらない: 同 full 出力の DS2 行が `定義 24 件、孤立 0 / 壊れ参照 0`、DS3 行の突合件数が改訂前（`dda8560a` で `27 件突合`）以上、DS4 行が `カテゴリ 9 全 N 項目に DSR 参照あり`（N は改訂後の項目数、改訂前は 22）、DS1 が ERROR なし。
- AC3 DSR の見出しが不変: `diff <(git show dda8560a:docs/design-system/01-decision-rules.md | rg '^## DSR-' | sort) <(rg '^## DSR-' docs/design-system/01-decision-rules.md | sort)` が空出力。
- AC4 索引が全体を覆う: 01 の `## 話題別の索引` 節から `rg -o 'DSR-[0-9]{2}'` で取り出した番号が 01〜24 の 24 種で各 1 回。README の「迷ったらここ」の各行の link 先の節が実在する（Writer が各 link を `rg` で見出しと照合し PR に記録）。
- AC5 役割表: `docs/design-system/00-foundations.md` の色の役割表に 6 役割（操作 / 進行中 / 注意・確認 / 完了 / 危険・戻せない / ふつう・補足）が各 1 行あり、表の見出しに `見せ方`・`受け取り方`・`狙う効果`・`根拠`・`現行の実装`・`移行` の列がある。役割表の行は `#` で始まる 6 桁 HEX を含まない。
- AC6 強調の段階: 00 の強調の段階表に段 0〜4 が各 1 行あり、段 3 に「1 画面に 1 か所」と「黒・文字色で引かない」、段 4 に「押すボタンだけ」と DSR-01 への参照がある。
- AC7 候補値が canonical docs に無い: `rg -n -i '#1D5C63|#2F7F86|#E6F0F0|#7FB0B4|#123E43' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md` が 0 件。候補値は `docs/decision-log.md` の D-091 にだけある（`rg -c -i '#1D5C63' docs/decision-log.md` が 1 以上）。
- AC8 書体の旧理由の撤回: `rg -n '読み込み遅延のリスク' docs/design-system docs/UI_TECH_STACK.md` が 0 件。00 の書体の節に `Noto Sans JP` と `BIZ UDPゴシック` がともにあり、最終採用が runtime lane の実機比較で決まることと、それまで現行の system font stack を使うことが書かれている。
- AC9 原則の統合: 04 の原則が 10 本前後（8〜12 本）で、旧番号対応表が旧 04 原則 1〜16 の 16 行を持つ。03 が原則を持たない出典の一覧になっている（`rg -n '核心4本柱|補助3原則' docs/design-system/03-philosophy.md docs/UI_TECH_STACK.md` が 0 件）。
- AC10 旧番号の参照が別の原則を指したまま残らない: Writer は `rg -n '原則 ?[0-9]+' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md docs/backlog.md` の全 hit を「新番号で正しい」「旧番号対応表の行」「更新履歴の行」「Q 番号（原田本の Q 原則）」のどれかに分類して PR に記録し、どれにも当たらない hit が 0 件である。
- AC11 DSR の矛盾の解消: `rg -n 'amber|琥珀' docs/design-system/01-decision-rules.md docs/design-system/04-backbone.md` の各 hit が「現行の実装（runtime lane 待ち）」の説明か更新履歴の行である（Writer が hit ごとに分類し PR に記録）。DSR-01 / 08 / 16 / 21 / 22 が [Spec Contract](#spec-contract) D7 のとおり改訂されている。
- AC12 データ安全: `rg -n 'claude\.ai|\.local/' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md docs/backlog.md docs/decision-log.md` の新規 hit が 0 件（`git diff dda8560a -- …` の追加行で確かめる）。owner の発言は要旨と日付だけで書かれている。
- AC13 後続 lane の起票: `docs/backlog.md` に runtime lane A / B と棚卸し画面 D1 の 3 entry があり、各 entry が本 packet の Non-scope の切り方と着手条件を持つ。

## Design Sources

- Requirements / spec: なし（REQ を増減しない）。利用者前提は `docs/project-memory.md` と `docs/design-system/00-foundations.md`「業務ステータスの視認性」。
- Architecture: 変更なし。
- Function / command / DTO: 変更なし。
- DB: 変更なし。
- Screen / UI: `docs/design-system/README.md`、`00-foundations.md`、`01-decision-rules.md`、`02-component-catalog.md`、`03-philosophy.md`、`04-backbone.md`、`docs/quality/review-checklist.md` カテゴリ 9、`docs/UI_TECH_STACK.md` §1・§4、`docs/SCREEN_DESIGN.md`（参照のみ）、`src/styles/globals.css`（参照のみ、token の現行値）。
- Decision log / ADR: D-091（本 lane で追加、番号は予約。下の「連番の予約」）。先例として 2026-09-03 の Codex P2-2 裁定（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md`「Token 候補値」節）。

設計判断の出典（要旨と日付、原文は置かない）:

- owner 2026-09-24（デザインの決まりの見直し canvas）: 色は絞りすぎで、amber 1 色に「押す・注意・現在地・1 位」が重なっている。操作と進行中は「いま自分がしていること」として同じ緑寄りの色で揃える（ボタンが緑で枠が青なのはちぐはぐ）。黒の 2px 枠と長いバッジはくどい。書体は Noto Sans JP が好み（Coordinator の推奨は BIZ UDPゴシック、同梱と実機での読み分けが条件）。商品名の下の情報はラベルと値の組が見やすく、日付は何の日付かをラベルで言い切る。決まりは「どう見せるか」でなく「見る人がどう受け取るか・その効果」から組む（見せ方 → 受け取り方 → 効果 → 根拠）。
- owner 2026-09-24（棚卸し画面 canvas）: D1（今のアプリの外枠の中で、部門をページ内の列にした案）を採用。囲みの中で状態が変わる形を基本にする。実装すると挙動も変わる点は owner も認識。
- 理論の出典: Laws of UX（日本語版『UXデザインの法則』第 2 版、2025-01、owner 既選定）。theory → 正本 → 実装の順で形作る方針（owner 2026-08-29）。

連番の予約: 本 lane は `docs/decision-log.md` に D-091 を予約する。起草時点で main と並走 lane（`agent/docs-restore-and-rules`、`agent/harness-overhaul`、`agent/harness-pr0-dead-docs`、`agent/stk-runtime-stop-dangerous-ops`、`agent/stocktake-time-evidence-adr-fix`、`agent/ej-parser-core`）の最終 entry はいずれも D-090（各 branch の `docs/decision-log.md` を `git show` で確認）。先に他 lane が D-091 を merge した場合は、本 lane が origin/main を取り込んだ後に採番し直し、Gated Amendment と同一 packet 内の sweep を記録する（`docs/DEV_WORKFLOW.md` Review Rules の連番 registry 規則）。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient（触れない） |
| Command / DTO / generated binding / wire shape | なし | existing sufficient（触れない） |
| DB / transaction / audit / rollback / migration | なし | existing sufficient（触れない） |
| Screen / UI / route state / Japanese wording | `docs/design-system/*.md`、`docs/quality/review-checklist.md`、`docs/UI_TECH_STACK.md` | updated in this PR（S1〜S8）。画面ごとの記述（`docs/SCREEN_DESIGN.md`）は intentionally deferred（runtime lane A） |
| CSV / TSV / report / import / export format | なし | existing sufficient（触れない） |
| Durable decision / ADR | `docs/decision-log.md` D-091 | updated in this PR（S9） |

## Registration / Generation Obligations

- source doc 新設・改名・削除: 新設・改名・削除なし（D9 で file 名を固定）。design-system の親索引（`docs/design-system/README.md`）と `docs/UI_TECH_STACK.md` §4 の索引表は内容の変化に合わせて更新する（S5・S8）。
- REQ / coverage、Tauri command、function-design doc、route、operator 画面: 該当なし。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| SPEC-DSR-RENEW | 00 色の役割表 | SPEC-DSR-RENEW-D1 | 1 色 1 役割で、押す・注意・現在地・1 位の重なりを解く。却下: 進行中だけ青寄り（色数が増え、ボタンと枠がちぐはぐ、owner 2026-09-24） | S1 | Matrix T5・T7 |
| SPEC-DSR-RENEW | 00 強調の段階 | SPEC-DSR-RENEW-D2 | 目立つものが多いと何も目立たない。却下: 黒・文字色の 2px 枠（くどい、owner 2026-09-24） | S1 | Matrix T6 |
| SPEC-DSR-RENEW | 00 書体 | SPEC-DSR-RENEW-D3 | 旧理由（網からの読み込み遅延）は desktop 配布で当たらない。却下: 本 lane で書体を決め切る（実機の読み分けを見ていない） | S1 | Matrix T8 |
| SPEC-DSR-RENEW | 00 ラベルと値 | SPEC-DSR-RENEW-D4 | 何の値か迷わない。却下: 1 行に詰める現行形（どれが大事か分からない） | S1 | Matrix T5 |
| SPEC-DSR-RENEW | 04 原則 / 03 出典 | SPEC-DSR-RENEW-D5 | 原則が 3 か所に分かれ上下が分からない。却下: 04 と 03 を 1 file へ統合して片方を削除（外部参照の link が切れる） | S2・S3 | Matrix T9・T10 |
| SPEC-DSR-RENEW | 01 話題別の索引 | SPEC-DSR-RENEW-D6 | 出来事ごとの追加順では探せない。却下: 番号の付け替え（src・docs の DSR 参照が壊れる） | S4 | Matrix T3・T4 |
| SPEC-DSR-RENEW | DSR-01 / 08 / 16 / 21 / 22 | SPEC-DSR-RENEW-D7 | 役割表・強調の段階と矛盾する記述を解く | S4 | Matrix T11 |
| SPEC-DSR-RENEW | README / 00 移行列 | SPEC-DSR-RENEW-D8 | 規則と実装の差を読めるようにする。却下: 候補 HEX を canonical docs に書く（2026-09-03 Codex P2-2） | S1・S5・S6 | Matrix T7 |
| SPEC-DSR-RENEW | checker との境界 | SPEC-DSR-RENEW-D9 | DS 検査を弱めない | S1〜S6 | Matrix T1・T2 |
| SPEC-DSR-RENEW | decision-log D-091 | SPEC-DSR-RENEW-D10 | 横断の判断と候補値の durable な置き場 | S9 | Matrix T7 |
| SPEC-DSR-RENEW | backlog | SPEC-DSR-RENEW-D11 | 後続 lane の切り方 | S10 | Matrix T13 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 改訂後の 00（4 列）・04（原則と旧番号対応）・D-091（決定・候補値・却下案・Revisit）で答えられる。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: D1〜D11 は S1〜S10 で source docs と D-091 へ移す。packet だけに残る判断はない。
- Assumptions and constraints: 候補値のコントラストは起草時に計算した（D-091 候補値の欄。値は本 packet の Contract Probe）。店の PC の書体・同梱サイズは 未実測。
- Deferred design gaps, risk, and follow-up target: 書体の最終採用・候補色の確定・画面ごとの適用は runtime lane A / B（backlog、S10）。
- Test Design Matrix can cite design decision IDs or source doc sections: 可（Matrix の Contract 列が D1〜D11 を引く）。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「1 色 1 役割」の例外は置かない。runtime lane までの間は現行の token が複数役割を兼ねる（`--primary` と `--warning-emphasis` が同値、`--rank-top-*` が amber）ことを 00 の移行列に明示し、これを例外でなく移行中の状態として扱う。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable（外部 adapter に触れない） | なし |
| Fact check / design decision split | canvas は判断の材料で、決まりの正本は source docs。canvas の説明文にある外部の事実（BIZ UDPゴシックが Windows 標準に入った時期、Noto Sans JP の同梱が数 MB）は起草時に確かめていない（未実測）ため、規則には「runtime lane B で確かめる前提」として書き、事実として書かない | runtime lane B |
| Lifecycle / retry | not applicable（状態遷移を持たない文書改訂） | なし |
| Operator workflow | 店主の見え方は本 lane では変わらない。棚卸し D1 の挙動の変化は ㉘ 以降の lane が持つ | backlog D1 entry |
| Replacement path | 書体と役割色の値は token 経由で差し替わる（コードの直接色は stone だけで、他は token 経由。handoff の所見）。runtime lane A はこの前提を `rg` で確かめ直す | runtime lane A |
| Data safety / evidence | canvas の URL・`.local/`・原文を tracked に置かない（AC12） | 本 packet Data Safety |
| Reporting / accounting semantics | not applicable | なし |
| Manual verification | 狙った受け取り方になったかは実機でしか確かめられない（canvas 9 の結び）。本 lane には manual を置かず runtime lane A / B の L3 に置く | runtime lane A / B |
| 環境・再現性 | 書体の同梱は配布物と依存を変えるため runtime lane B で pin と D-030 を扱う | runtime lane B |

## Design Readiness

- Existing design docs are sufficient because: 本 lane は design-only scope で、改訂内容は Spec Contract が固定する。
- Source docs updated in this PR: S1〜S10。
- Design gaps intentionally deferred: 書体の採用、候補色の確定値、画面ごとの適用（runtime lane A / B）、棚卸し D1（㉘ 以降）。
- Durable decisions discovered in this plan and promoted to source docs: D-091。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 影響なし。
- Backend function design: 影響なし。
- Command / data contract: 影響なし。
- Persistence / transaction / audit impact: 影響なし。
- Operator workflow / Japanese UI wording: 画面の文言は変えない。規則の文面（ラベルで言い切る等）は後続の画面設計に効く。
- Error, empty, retry, and recovery behavior: 影響なし（DSR-03 / 11 / 19 / 20 の本文は変えない）。
- Testability and traceability IDs: REQ なし。Matrix の oracle は `rg` / doc check。

## Contract Probe

R2 のため必須ではない。起草時に次を確かめた。

- DS 検査は file 名を固定で読む: `scripts/doc-consistency-check.sh` 1796〜1797・1842 行を読み、`01-decision-rules.md`・`02-component-catalog.md`・`00-foundations.md` の path を固定で参照し、無ければ INFO でスキップすることを確認 → file 名を変えない（D9）。
- DS3 の抽出規則: 同 script 1833〜1878 行を読み、「backtick の `--name` を含む行の最初の #hex」を `globals.css` `:root` と突合することを確認 → 役割表の行に HEX を置かない（AC5）。
- 改訂前の DS の結果: `bash scripts/doc-consistency-check.sh`（`dda8560a`）→ `DS1: src/ path 参照 44 件すべて実在` / `DS2: DSR 参照整合 OK（定義 24 件、孤立 0 / 壊れ参照 0）` / `DS3: token HEX 整合 OK（27 件突合）` / `DS4: カテゴリ 9 全 22 項目に DSR 参照あり` / `結果: 全チェック通過`。
- 分類: `scripts/ci/classify-changes.sh` 59 行目の policy docs 列挙に本 lane の予定 file が含まれないことを読んで確認 → `workflow=false`。
- 候補色のコントラスト（WCAG 2.x の相対輝度式、`python3` の 1 行計算、2026-09-24）: 操作の塗りと背景 `#fafaf9` = 7.28:1、進行中の枠と背景 = 4.47:1、進行中の文字と進行中の地 = 10.07:1、進行中の線と背景 = 2.29:1、進行中の地と背景 = 1.11:1、操作の塗りと完了の緑（`--success`）= 1.52:1。参考に現行の `--primary` と背景 = 4.81:1。含意: 進行中の線は 3:1 未満のため操作枠や現在行のバーの単独信号にできない、進行中の地は背景とほぼ同じで文字と併用が必須、操作と完了は色で区別できず文字と icon が必須。候補 HEX は D-091 に置く。
- 文書の規模: `wc -l docs/design-system/*.md`（`dda8560a`）→ 合計 1953 行（00: 158 / 01: 520 / 02: 1068 / 03: 78 / 04: 71 / README: 58）。
- 旧原則番号の参照元: `rg -n '原則 ?[0-9]+' docs --glob '!docs/archive/**'` と `rg -n '04-backbone' src docs` で洗い出した（Matrix の Adjacent Pattern Audit）。新番号 4・6 を旧番号と同じ主題に置くため、`src/components/patterns/PageShell.tsx`（原則 6）と `docs/function-design/73-ui-stocktake.md`（原則 4）は変えずに済む。

## Test Plan

- targeted tests: `bash scripts/doc-consistency-check.sh` と `--target plan`、Matrix の `rg` / `diff` oracle（T1〜T13）。
- negative tests: 候補 HEX が canonical docs に無い（T7）、旧書体理由が残らない（T8）、旧原則番号が別の原則を指したまま残らない（T10）。
- compatibility checks: DSR 見出しと番号が不変（T3）、file 名が不変（T2）、外部の link 先（`03-philosophy.md` の japanese-webdesign 節、`04-backbone.md`）が実在（T12）。
- data safety checks: canvas URL・`.local/`・原文が追加行に無い（T14）。
- main wiring/integration checks: DS2 / DS3 が改訂後の file を実際に読んで件数を出す（T1）。

## Review Focus

- Plan Review の冒頭で、[Ordinary Operation](#ordinary-operation) の操作列が目的を達成できるかを `成立 / 具体的な反例あり / 外部前提が未確認` で答える。
- 役割表・強調の段階・書体・ラベルと値が owner の判断（「設計判断の出典」）と食い違わないか。
- 候補値を canonical docs に置かない方針（D8）と、読む人が現行と狙いを取り違えない書き方が両立しているか。
- DS 検査が弱まらないか（D9、AC2）。
- 原則の統合で、旧 16 原則と 03 の哲学の内容が落ちていないか（旧番号対応表で辿れるか）。
- DSR-01 / 08 / 16 / 21 / 22 の改訂が役割表・強調の段階と一貫し、他の DSR と新たな矛盾を作らないか。
- runtime lane の切り方（D11）が、画面・挙動・依存の変化をそれぞれの Human Gate に正しく載せているか。

## Spec Contract

Contract ID: SPEC-DSR-RENEW

| Contract | 内容 | Test |
|---|---|---|
| SPEC-DSR-RENEW-D1 色の役割表 | 00 に 6 役割の表を置く: 操作（押すボタン・リンク・ナビの現在地、塗りは押すものだけ）/ 進行中（数えている・取り込んでいる・処理中。操作と同じ色の仲間で、薄い地で表す）/ 注意・確認（数え直し・在庫少・確かめてほしいもの。手を止めて確かめる、怖くはない）/ 完了（保存した・取り込んだ・数え終わり）/ 危険・戻せない（削除・確定・取消の確認）/ ふつう・補足（説明・件数・日付・ランキング）。列 = 役割・使う場面・見せ方・受け取り方・狙う効果・根拠・現行の実装（token 名、HEX なし）・移行（済 / runtime lane A 待ち）。「どの状態も文字と icon を添え、色だけに頼らない」「ランキング 1 位は色でなく順位と太字」「進行中は info ではない（利用者の作業が続いている状態に限り、お知らせ一般に使わない）」を明記。既存の token 表の各行に役割の列を足す（HEX と行は変えない）。受け取り方・効果・根拠の文は canvas 9 の表（操作: Hick の法則 / Von Restorff 効果、進行中: Zeigarnik 効果 / Von Restorff 効果、注意: Von Restorff 効果 / WCAG 1.4.1、完了: Peak-End の法則）を元にする | Matrix T5・T7 |
| SPEC-DSR-RENEW-D2 強調の段階 | 00 に段 0〜4 を置く: 0 そのまま（地と線は stone）/ 1 薄い地（まとまり、線なし）/ 2 薄い地 + 同じ役割の 1px 線（状態を知らせる行・バッジ）/ 3 役割色の 2px 枠（いま操作している 1 つだけ、1 画面に 1 か所、黒・文字色で引かない）/ 4 塗り（押すボタンだけ、1 画面の主要ボタンは 1 つ = DSR-01）。上の段ほど 1 画面に置ける数を減らす。バッジの文は短く（目安 8 文字）、補足は下に小さく分ける。各段に 4 列（根拠: Von Restorff 効果、美的ユーザビリティ効果）。DSR-16（囲みは意味階層ごとに 1 つ、薄い線を単独のグループ信号にしない）と矛盾しないこと: 段 1 は線を引かず、段 2 の線は状態の行・バッジに限る | Matrix T6 |
| SPEC-DSR-RENEW-D3 書体 | 00 の書体の節を改める: 選定条件（見間違えにくさ〈数字と似た形のカナ〉、太字でつぶれない、長時間読める、数字は等幅で桁がそろう、配布の方法〈Windows 標準か同梱か〉）。候補は Noto Sans JP（owner の好み、同梱が要る）と BIZ UDPゴシック（Coordinator の推奨、Windows 標準で同梱不要）。旧理由「カスタム Web フォントは読み込み遅延のリスクで不採用」は、Tauri の desktop 配布では網から読まないため当たらないとして撤回し、判断軸を同梱サイズと店の PC での読み分けに置き換える。最終採用は runtime lane B の実機比較（店主が通常距離で読み分けられるか、owner の目）で決め、それまでは現行の system font stack を使う。同梱サイズ・店の PC の書体の有無は 未実測 と書く | Matrix T8 |
| SPEC-DSR-RENEW-D4 ラベルと値・進み具合 | 00 に置く: 補足情報はラベルと値の組にし、ラベルは小さく薄く、値はふつうの濃さにする。何の値かを言葉で言い切る（日付なら何の日付か。例: 前回数えた数 / 数えた日）。1 行に詰めて同じ薄さで並べない。根拠: チャンク化 / 近接の法則。進み具合は中くらいの大きさで数と棒の両方（根拠: 目標勾配効果、大きすぎると急かされる）。いずれも 4 列 | Matrix T5 |
| SPEC-DSR-RENEW-D5 原則の統合 | 04 を「原則」にし、次の 11 本とする（番号 4・6 は旧番号と同じ主題に置く）: 1 読める大きさ（本文 16px の最低線・書体・icon 16/20/24）/ 2 1 色 1 役割、色だけに頼らない / 3 強調は段階で決め、上の段ほど少なく（主要ボタンは 1 つ）/ 4 badge は 3 種（③強調は色でなく順位と太字へ改める。移行中は現行の琥珀 pill）/ 5 何をする画面か・何の値かを言葉で言い切る / 6 器は 1 つ（PageShell・ListShell）/ 7 同じ操作は同じ顔と挙動（検索欄・待ち時間・押せる顔と当たり判定）/ 8 密度は業務データ優先 / 9 枠と線は少なく、操作枠は 3:1 / 10 いま扱っているものは進行中で示す（現在行・作業中の囲み）/ 11 低視力を前提に実機で確かめる。旧番号対応表: 旧1→1、旧2→2、旧3→2、旧4→4、旧5→3、旧6→6、旧7→7、旧8→7、旧9→5、旧10→1、旧11→7、旧12→8、旧13→9、旧14→6、旧15→10、旧16→11。旧 03 の核心 4 本柱・補助 3 原則・観点借用は 03 の出典に残し、対応表で各々がどの新原則の根拠かを示す。旧原則の細則（token 名・path・DSR への委譲）は落とさず新原則の本文か 00 / DSR へ移す | Matrix T9・T10 |
| SPEC-DSR-RENEW-D6 DSR の並べ直し | 01 に `## 話題別の索引` を置き、DSR を次の話題の順に並べる。配置と一覧: DSR-04, 09, 12, 13, 16, 22。入力: DSR-02, 05, 06, 10, 14, 23, 24。知らせ方: DSR-03, 07, 11, 19, 20。移動と戻り: DSR-15, 17, 18。色と状態: DSR-01, 08, 21。`## DSR-NN 題` の見出しの文字列と番号は変えない。話題の区切りの見出しを置く場合も DSR の見出しは `## ` のまま。title の「DSR-01〜24」は維持 | Matrix T3・T4 |
| SPEC-DSR-RENEW-D7 矛盾する DSR の改訂 | DSR-01: 「Primary は amber 系」を「Primary は操作の役割色（`--primary`、現行値は 00 の役割表）」へ。DSR-08: badge の tone family の説明を 00 の役割表へ向け、進行中を加え、ランキングの強調は色でなく順位と太字（移行中は現行）とする。DSR-16: 強調の段階との関係を 1 文加える。DSR-21: 現在地は操作の役割色の細いバーのまま、Why の「Primary（amber-700）は warning 系と同系色」は runtime lane A までの現状として書き、役割表により色相が分かれることを書く。DSR-22: 現在行（入力中 / 開いている行 / 選択行）を進行中の役割に属させ、3 点表示（バー + 薄い地 + 文言）を維持、作業中の囲みは段 3 で 1 画面 1 か所とする。現行の `--row-current` と primary のバーは runtime lane A で進行中の token へ移すと書く。進行中の線（候補）は背景に対し 3:1 未満のためバーや操作枠の単独信号にしない。その他の DSR は `rg -n 'amber|琥珀|primary|Primary|1 位|1位' docs/design-system/01-decision-rules.md` の各 hit を確かめ、変えない理由を PR に記録する | Matrix T11 |
| SPEC-DSR-RENEW-D8 移行中の読み方 | canonical docs は狙いの規則を書き、現行の実装との差は 00 の役割表の「現行の実装」「移行」列に集める。候補の HEX は canonical docs に書かず D-091 に置く（2026-09-03 Codex P2-2 の先例）。README に「移行が runtime lane 待ちの項目は、00 / 04 / 01 を狙い、02 と画面を現行として読む」を書き、02 の冒頭に同旨の 1 文を置く | Matrix T7 |
| SPEC-DSR-RENEW-D9 checker との境界 | `00-foundations.md`・`01-decision-rules.md`・`02-component-catalog.md`・`03-philosophy.md`・`04-backbone.md`・`README.md` の file 名を変えない。DSR の見出しは `## DSR-NN` のまま。00 の既存 token 表の行と HEX を変えず、新しい表の行に backtick の `--name` と #hex を同じ行に並べない。review-checklist カテゴリ 9 の全行に DSR 参照を保つ。`scripts/doc-consistency-check.sh` の M3 検査（`check_stale_markers` の `markers`）と曖昧表現検査（`ambiguous_words`）は `docs/design-system/*.md` と `docs/quality/*.md` も走査するため、そこで列挙される語を新しい文に入れない（WARN が増える）。canvas の役割名「注意・」に続く 3 文字は前者の語に当たるため、役割名は「注意・確認」と書く | Matrix T1・T2 |
| SPEC-DSR-RENEW-D10 D-091 | decision-log に置く: 決定（1 色 1 役割の 6 役割、強調の段階 0〜4、書体の選定条件と runtime lane での採用、ラベルと値、原則の統合と DSR の話題別の並び）・理由（見る人の受け取り方から決める）・候補値（操作 塗り #1D5C63、進行中 地 #E6F0F0 / 線 #7FB0B4 / 枠 #2F7F86 / 文字 #123E43、注意 amber-50 / amber-200 / amber-900 + icon、完了 green-50 / green-200 / green-900、危険 red 系、ふつう stone。runtime lane A の実測と L3 で確定）と起草時のコントラストの計算結果・却下案（進行中だけ青寄り、黒の 2px 枠と長いバッジ、本 lane での書体の決め切り、file の改名）・Revisit（runtime lane A / B の L3 で狙った受け取り方にならなかったとき） | Matrix T7 |
| SPEC-DSR-RENEW-D11 後続 lane の切り方 | backlog に 3 entry: runtime lane A（色と強調の token と横断部品と全画面、R3、manual、before / after を並べて owner が見る L3。着手条件 = 本 lane の merge）/ runtime lane B（書体の実機比較と採用・同梱、依存を足すなら D-030、L3 = 店の PC で店主が通常距離で読み分けられるか。着手条件 = 本 lane の merge。A と別 lane にする理由 = 依存と配布物が変わり、店の PC での確認が要る）/ 棚卸し画面 D1（㉘ 以降の棚卸し実装 lane と組、開始前・中断から戻った画面は canvas で未作成）| Matrix T13 |

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-DSR-RENEW-D1 | S1 | T5・T7 | owner の判断との一致 | full doc check 出力、`rg` 出力 |
| SPEC-DSR-RENEW-D2 | S1 | T6 | DSR-16 との整合 | `rg` 出力 |
| SPEC-DSR-RENEW-D3 | S1 | T8 | 採用前であることの明示 | `rg` 出力 |
| SPEC-DSR-RENEW-D4 | S1 | T5 | 言い切るラベル | `rg` 出力 |
| SPEC-DSR-RENEW-D5 | S2・S3 | T9・T10 | 内容の落ち | 旧番号対応表、hit の分類記録 |
| SPEC-DSR-RENEW-D6 | S4 | T3・T4 | 番号と見出しの不変 | `diff` 空出力 |
| SPEC-DSR-RENEW-D7 | S4 | T11 | DSR 間の一貫性 | hit の分類記録 |
| SPEC-DSR-RENEW-D8 | S1・S5・S6 | T7 | 候補値の置き場 | `rg` 0 件 |
| SPEC-DSR-RENEW-D9 | S1〜S7 | T1・T2 | gate を弱めない | DS1〜DS4 の出力行 |
| SPEC-DSR-RENEW-D10 | S9 | T7 | 候補値と却下案 | D-091 |
| SPEC-DSR-RENEW-D11 | S10 | T13 | Human Gate の載せ先 | backlog entry |

## Data Safety

- 書かないもの: canvas の URL、`.local/` の path の詳細、引継ぎ書・台帳の発言原文（短い語句の引用を含む）、店の実データ（JAN・実商品名・価格・原価・売上・取引先名・個人名）。canvas の例示の商品名も tracked file に写さない（例が要るときは「商品名」「前回数えた数」等の一般語を使う）。
- local-only: 引継ぎ書、canvas の scratchpad への保存物。
- synthetic-only: 例示の数値（前回 14 等）は架空の値として扱い、実データと混同しない書き方にする。

## Test Design Matrix

[Test Design Matrix](test-matrices/2026-09-24-design-rules-renewal.md)

## Implementation Results

Fill after implementation.

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
