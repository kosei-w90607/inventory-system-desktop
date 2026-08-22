# Plan Packet: UI 一覧の背骨 D — L3 所見 5 点の規範化（04-backbone 原則 13〜16 / 00-foundations 枠コントラスト訂正 / DSR-16 / 02-component-catalog ⑯ 一覧の器 / reference mockup D）（docs-only、R2）

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

If a state-only commit materializes multiple phases, list the complete adjacent forward sequence and the pre-existing evidence for every intermediate transition in an append-only review/evidence record. Recording compression never permits a gate skip.

- Phase: implementing
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: eca3d26
- Amendments: none
- Coordinator: Fable
- Writer: Fable（docs-only、relay 0。mockup D 6 file は Fable + fork 作成済み）
- Plan Reviewer: Sonnet
- Final Reviewer: Sonnet（docs-only の contract audit: 原則 ↔ 00〜02 ↔ README ↔ checklist の整合 + 数値の実測一致）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Design Board Exception: AGENT_OPERATING_MANUAL §3.1 適用（design-only change。owner 明示指示 2026-08-23「今すぐ着手できることやっちゃいたいな 爆速でFableの頑張りどころで燃やしたいんだよね、前君にモック作ってもらっていいねって思ったから君の実力見たい」「他のページも今モックだけでもFable並列発火で試しに書き上げてみてほしい」。Plan Gate / Final Reviewer は Sonnet 独立 fresh context、実装 code（Lane 2〜5）の Writer には割り当てない）
- Human Gate: owner plan approval 済み（2026-08-23、介入 1/2。採否 3 点 = 構造線 #cdc8c4 案 / 現在行の琥珀バー 3 点表示 / 件数文言の統一形、いずれも採用。owner 所感「基本的には適用後の方が間違いなく良かった」）→ Ready（介入 2/2）→ merge（docs-only のため visual confirmation なし。mockup D は owner が 2026-08-23 に方向性承認済み）

## Owner Effort Budget

- 介入回数上限: 2（Plan Gate 承認〈採否 3 点込み〉+ Ready 承認）
- 実働時間上限: 20分
- relay 往復上限: 0（Codex 発注なし）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。使う場合はtarget branch / PRへorder commitを混ぜず、artifact pathと専用remote order branch refを宣言する。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（design-system 00 / 01 / 02 / 04、reference README + mockup HTML、quality/review-checklist）。runtime contract・DB・CSV・DTO・route・operator workflow の変更なし。後続の実装 lane（Lane 2〜5）は本 PR を正本として別 packet（R3）で行う。DEV_WORKFLOW Risk Level の R2「docs change that affects maintainability but not runtime contracts」に該当し、Test Design Matrix は省略（PR #87 design-backbone と同型）。

## Goal

Goal Invariant: PR #95 の Windows native L3（UI-14、実利用者に緑内障）で得た所見 5 点 — 総件数と pagination の上部表示 / table header の sticky 化 / 長い一覧で商品識別列を見失わない / 枠線・背景・操作領域のコントラスト強化 / 低視力を前提にした再評価 — を、Lane 0 の調査（根拠 URL 付き）と実測（WCAG 2.x 相対輝度）に基づいて `04-backbone.md` の原則 13〜16 として正本化し、00 / 01 / 02 / review-checklist / reference へ反映して、後続の shared 部品実装（Lane 2）と画面群 lane（Lane 3〜5）が「規範の履行」として引ける状態にする。

### 最小完了条件

- `docs/design-system/04-backbone.md` に原則 13〜16 と token 追記、00〜03 への反映先、適用の順序（Lane 2〜5）、更新履歴 v1.1 がある。
- `docs/design-system/00-foundations.md` の `--border` 行の根拠「4.5:1 境界可視性」が実測値（1.20:1、非テキスト 3:1 未達）と 2 段 token（構造線 / 操作枠）の方針に訂正され、`--muted-foreground` 行に card 上 4.40:1（AA 未達）と改訂候補、`--foreground` 行の比が実測 16.7:1 に訂正されている。
- `docs/design-system/01-decision-rules.md` に DSR-16「一覧の器・現在行・UI 部品枠のコントラスト」が新設され、title の範囲が更新されている。
- `docs/design-system/02-component-catalog.md` に ⑯ 一覧の器（ListShell）が新設され、③ テーブルに sticky header / 識別列固定、⑩ ページネーションに上下配置と件数文言の統一形が追記されている。
- `docs/design-system/reference/README.md` に mockup D 6 file の行があり、6 file が同 dir に存在する。
- `docs/quality/review-checklist.md` カテゴリ 9 に非テキスト枠 3:1 / 一覧の器 / 低視力 L3（forced-colors・DPI・実利用者）の項目がある。

### 失敗定義

- 原則の数値（コントラスト比・px）が実測・出典なしで書かれる（D-062 違反）。
- DSR 番号 / catalog 番号が既存計画（04-backbone の「原則 4 → DSR-16 新設」）と衝突したまま merge される。
- 00〜02 の文言と 04-backbone の原則が食い違う（例: 00 の border 根拠が旧記載のまま）。
- `doc-consistency-check.sh` の ERROR、または design-system 内リンク切れ。

### 非目的

- 実装（`ui/table.tsx` / `ProductPagination` / token 値の差替え / `PageShell` / 画面群の適用）— Lane 2〜5 の R3 packet。
- 04-backbone 原則 1〜12 の改訂、00-foundations caption 12 → 14px（UI batch 1 = Lane 2 の Required Design Artifacts）。
- token 値の最終確定（本 PR は提案値 + 実測を置き、アプリ内の見え方での最終値は Lane 2 の L3 で確定）。
- mockup の sidebar / PageHeader / 「商品登録」等のボタン描画（統合案 C の描き方の流用であり D の提案ではない。owner 所感 2026-08-23: 現仕様の方が良い箇所がある → Lane 2 packet で項目ごとに決める）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Scope

- `docs/design-system/04-backbone.md`（updated in this PR）:
  - 「## 12 の原則」を「## 16 の原則」に改題し、原則 13〜16 を追記（SPEC-UILB-D1〜D4 の本文、各 1 文 + 由来〈L3 2026-08-23 / Lane 0 出典 / owner 裁定〉）。
  - 「foundations への追記分（token）」表に 構造線 / 操作枠 / 現在行 の 3 行（提案値 + 実測比 + 「Lane 2 で確定」）。
  - 「00〜03 への反映先」に 13〜16 の反映先（00: 枠 2 段 token + 実測訂正 / 01: 「原則 13〜16（DSR-16、本 PR）」と書き「新設」語は使わない〈AC の negative regex と衝突させない文言規約〉/ 02: ③ ⑩ ⑯ / quality: カテゴリ 9）を追記し、badge 3 種 = DSR-16 を指す既存 3 箇所（L38 token 表「DSR-16 として新設」/ L43 反映先「原則 4（DSR-16 新設）」/ L51 適用の順序「+ DSR-16」）をすべて DSR-17 に改訂（SPEC-UILB-D5）。
  - 位置付け文（L3）の「本 doc の 12 行に照らし」を「16 行」に改める。あわせて `docs/design-system/README.md` L16 の 04-backbone 説明「12 行の『まず守る骨』」を「16 行」に改める（条件付きではなく確定の変更）。
  - 「適用の順序」に Lane 2（shared 部品）/ Lane 3〜5（画面群）を追記し、UI batch 1〜4 を Lane 2〜5 に統合する旨を 1 文。
  - 更新履歴に v1.1 行。
- `docs/design-system/00-foundations.md`（updated in this PR）: カラーパレット表の `--border` 行の根拠を「構造線（行区切り・表枠・card 枠）。実測 1.20:1（白 1.26:1）で非テキスト 3:1 の対象外だが一段濃くする（提案 #cdc8c4 = 1.66:1、Lane 2 で確定）」に改訂し、新行 `--border-strong`（操作枠 = 入力・ボタン outline・select・segmented・状態 badge 枠。提案 #8a8480 = 白 3.69:1 / 地色 3.53:1、WCAG 1.4.11 非テキスト 3:1）と `--row-current`（現在行背景、提案 #fff8e6、上の本文 16.5:1 / 実 token muted 4.53:1）を追加。`--muted-foreground` 行の根拠に「地色 4.59:1 / card 上 4.40:1（AA 未達、改訂候補 #766f6b = card 上 4.52:1、Lane 2 で確定）」、`--foreground` 行の比を実測 16.7:1（地色）/ 16.0:1（card）に訂正。
- `docs/design-system/01-decision-rules.md`（updated in this PR）: title を「判断ルール集（DSR-01〜16）」に、DSR-15（L255〜）の後・`## 更新履歴`（L267）の手前に `## DSR-16 一覧の器・現在行・UI 部品枠のコントラスト`（ルール / 理由 / 例 / review-checklist カテゴリ 9 対応、既存 DSR と同型）を挿入、更新履歴に 1 行。
- `docs/design-system/02-component-catalog.md`（updated in this PR）: title L1「コンポーネントカタログ（15 パターン）」→「（16 パターン）」、責務 L4「15 パターンの canonical 定義」→「16 パターン」、⑯ は ⑮（L827〜）の後・`## 更新履歴`（L872）の手前に挿入（既存の DSR / pattern → 更新履歴の章順を保つ）、更新履歴に 1 行。③ テーブルに「header は sticky（単一 table 内、z-index: header > 固定列 > 本文、横スクロール時は固定列右端に影）/ 識別列固定は opt-in（商品コード + 商品名、2 列目の left は 1 列目の実幅計測）/ 線は構造線 token」を追記、⑩ ページネーションに「一覧が 1 画面を超える画面は table 上下に件数 + pager、文言は上下同一『{n} 件中 {from}〜{to} 件目 · {page} / {total} ページ』」を追記（SPEC-UILB-D2）、末尾に `## ⑯ 一覧の器（ListShell）`（使いどころ / canonical〈予定: `src/components/patterns/ListShell.tsx`、Lane 2 で実装〉/ 構成 = toolbar 2 段 + 上 count/pager + table〈sticky + 識別列〉+ 下 pager / 現在行 3 点 / 識別列を持たない履歴系の扱い / 参考 mockup）。
- `docs/design-system/reference/README.md`（updated in this PR）: 表に mockup D 6 file の行（`mockup-d-lists.html` / `mockup-d-forms-a.html` / `mockup-d-forms-b.html` / `mockup-d-import-export.html` / `mockup-d-history.html` / `mockup-d-home-sales-admin.html`、内容 1 行 + 「提案。C ⇄ D 切替。sidebar / ボタン等は C 流用で D の対象外」）、末尾に「D の未決文言（fork mockup が doc にない文言を置いた箇所）は各 mockup 末尾 note の『未決』を正とし、実装 lane の packet で採否を決める」を 1 文。
- `docs/design-system/reference/mockup-d-*.html` 6 file（新規、Fable + fork 作成済み、本 PR で tracked 化。内容は変更しない）。
- gated amendment 1（2026-08-23、owner 依頼「所感を context に残っているうちに書き留める」→「まるっと言えば分析」）: `docs/design-system/reference/2026-08-23-current-design-analysis.md`（現デザインの分析 — 画面間バラつき / doc 食い違い / 未決文言 / 評価 / 背骨 12 原則の維持・改訂・追加の素案 / 進め方）を新設して本 PR で tracked 化し、`reference/README.md` の表に 1 行（「分析。実装の正本ではない。全体デザイン見直し packet の入力」）を追加する。04-backbone 等の契約文言には影響しない。
- `docs/quality/review-checklist.md`（updated in this PR）: カテゴリ 9 に 4 項目（非テキスト UI 部品の枠・focus が 3:1 / 一覧が 1 画面を超えるなら上下 件数 + pager・sticky header・識別列固定 / 現在行は色 + 形状 + 文言 / 低視力 L3 = forced-colors・DPI 125〜150%・実利用者セッション）を追加、各 DSR-16 参照。
- `docs/design-system/README.md`（updated in this PR）: L13 の 01 行「DSR-01〜15」→「DSR-01〜16」+ トピック列挙末尾に「一覧の器・現在行・枠コントラスト」、L14 の 02 行「15 パターンカタログ」→「16 パターンカタログ」+ 列挙末尾に「⑯一覧の器」、L16 の 04-backbone 行「12 行の『まず守る骨』」→「16 行の『まず守る骨』（v1.1、原則 13〜16 = 一覧の器・枠コントラスト・現在行・低視力 L3）」。
- mockup 6 file は本 PR で内容を変えない。例外 = (a) `mockup-d-lists.html` 末尾 note の実測注記 1 箇所（「muted 7.2:1」は mockup のデモ配色 #57534e による値で、実 token `--muted-foreground` #78716c では 4.53:1 と明記、round 1 P2-1）、(b) owner 所見（2026-08-23、固定 2 列目 header が浮いて見える）に対する修正 = 固定列右端の影を横スクロール中（`.scroll.sx`、`scrollLeft > 0`）のみ表示し、header 側は共通下線 `0 1px 0` と合成（`mockup-d-lists` / `forms-b` / `home-sales-admin` / `history` / `import-export` の 5 file、`forms-a` は固定列なし）。いずれも plan-first commit 後・content commit 前の反映で、SPEC-UILB-D2 の実装注意（影は scrollLeft > 0 のときのみ、sticky header の下線と合成）として 02 ⑯ に転記する。

## Non-scope

- `src/**` の変更、`src/styles/globals.css` の token 値差替え（Lane 2）。
- `docs/function-design/*`（各画面の契約は不変。一覧の器は shared pattern として 02 に置き、画面 doc への転記は Lane 3〜5 の packet で行う）。
- `docs/UI_TECH_STACK.md` §6.11（離脱ガード）/ §2.5（D-052）。
- 00-foundations の typography / spacing 表（caption 12 → 14 と space-8 は UI batch 1 = Lane 2 の Required Design Artifacts）。
- mockup D の sidebar / PageHeader / ボタンの見た目の決定。

## Acceptance Criteria

- `bash scripts/doc-consistency-check.sh` ERROR 0（既存 WARN は可）、`bash scripts/doc-consistency-check.sh --target plan` 全チェック通過。
- `rg -c "^1[3-6]\. \*\*" docs/design-system/04-backbone.md` = 4、`rg -c "16 の原則" docs/design-system/04-backbone.md` ≥ 1、`rg -c "12 行" docs/design-system/04-backbone.md` = 0 かつ `rg -c "12 行" docs/design-system/README.md` = 0（各 file 個別、`rg -c` は 0 件で無出力・exit 1 = 0 とみなす）、`rg -c "DSR-17" docs/design-system/04-backbone.md` ≥ 3（token 表 / 反映先 / 適用の順序）、`rg -c "原則 4（DSR-16|DSR-16 として新設|\+ DSR-16$" docs/design-system/04-backbone.md` = 0（badge 文脈の DSR-16 残存なし。原則 13〜16 の反映先は「原則 13〜16（DSR-16、本 PR）」と書き「新設」語を使わない = Scope の文言規約）、`rg -c "16 行" docs/design-system/README.md` ≥ 1、`rg -c "DSR-01〜16" docs/design-system/README.md` ≥ 1、`rg -c "15 パターン" docs/design-system/README.md` = 0 かつ `rg -c "15 パターン" docs/design-system/02-component-catalog.md` = 0、`rg -c "16 パターン" docs/design-system/README.md` ≥ 1 かつ `rg -c "16 パターン" docs/design-system/02-component-catalog.md` ≥ 2（title L1 + 責務 L4）。
- `rg -c "^## DSR-16 " docs/design-system/01-decision-rules.md` = 1、`rg -c "DSR-01〜16" docs/design-system/01-decision-rules.md` = 1。
- `rg -c "^## ⑯ " docs/design-system/02-component-catalog.md` = 1、`rg -c "件目" docs/design-system/02-component-catalog.md` ≥ 1、`rg -c "sticky" docs/design-system/02-component-catalog.md` ≥ 2。
- `rg -c "border-strong" docs/design-system/00-foundations.md` ≥ 1、`rg -c "4.5:1 境界可視性" docs/design-system/00-foundations.md` = 0、`rg -c "4.40:1" docs/design-system/00-foundations.md` ≥ 1。
- `rg -c "mockup-d-" docs/design-system/reference/README.md` = 6 以上、`fd -e html mockup-d docs/design-system/reference | wc -l` = 6、各 file が `git ls-files` に含まれる。`rg -c "current-design-analysis" docs/design-system/reference/README.md` ≥ 1 かつ `docs/design-system/reference/2026-08-23-current-design-analysis.md` が `git ls-files` に含まれる（gated amendment 1）。
- `rg -c "DSR-16" docs/quality/review-checklist.md` ≥ 3。
- `bash scripts/local-ci.sh full` RESULT=PASS / END_TREE_STATE=CLEAN（content candidate と Ready exact-HEAD の 2 回、evidence は PR body）、hosted final と exact-HEAD 三点一致。

## Design Sources

- Requirements / spec: `docs/spec/requirements.md` REQ-105（UI-14 の操作性所見の起点）、`docs/SCREEN_DESIGN.md`（一覧画面の共通方針）
- Architecture: `docs/UI_TECH_STACK.md`（Tailwind v4 token、shadcn primitive）
- Design system: `docs/design-system/04-backbone.md` 原則 1〜12 / token 表 / 反映先 / 適用の順序、`00-foundations.md` カラーパレット表（L12-18）/ typography（L73-78）、`01-decision-rules.md` DSR-08 / DSR-12 / DSR-13 / DSR-15（末尾）、`02-component-catalog.md` ③（L120）/ ⑩（L581）/ ⑮（L827、末尾番号）、`reference/README.md`、`docs/quality/review-checklist.md` カテゴリ 9（L68）
- Evidence（Lane 0、2026-08-23、archived packet `docs/archive/plans/2026-08-23-price-revision-impl-b.md` の UX findings 起点）: 0-a research（WCAG 2.2 SC 1.4.11 / 2.4.13 / 2.5.8、WebAIM、NN/g、PMC4026991 / PMC1249580 / PMC7917782、GOV.UK / USWDS / Stanford table guides、MS Learn accessible text）、0-b repo 監査（全一覧 table は `src/components/ui/table.tsx` 経由、PLU 書出しのみ raw table、pagination は 7 画面が `ProductPagination` 共有、`PageShell` 未実装、`text-sm` 193 / `text-base` 4（`rg -c "text-sm" src/features --glob '!*.test.*'` の合計、2026-08-23 main `a16d57f`。src 全体・test 込みでは 235 / 6〈`git grep -c "text-sm" a16d57f -- src` 合計〉）、`ProductTable.test.tsx:126` header 配列完全一致）、0-c 実測（`src/styles/globals.css` L52-93 token: border / input / outline 1.20:1、muted-foreground 4.59 / 4.40、foreground 16.74 / 16.03、ring 4.81、primary 4.81、badge 系 AA 達成）
- Decision log: D-062（数値主張は契約値 or `未実測`）、PR #87 design-backbone packet（`docs/archive/plans/2026-08-20-design-backbone-reference.md`、docs-only R2 の先例）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Screen / UI / Japanese wording | design-system 04-backbone / 00-foundations / 01-decision-rules / 02-component-catalog / reference README + mockup D / quality review-checklist | updated in this PR |
| Backend / DB / CSV / command / DTO | — | 該当なし（docs-only） |
| Durable decision / ADR | 04-backbone 本文（採用済み判断を design-system 内に記録）、SPEC-UILB-D1〜D7（本 packet） | updated in this PR（04-backbone）+ packet |
| 各画面の function-design | 50 / 58 / 66 / 73 / 75 など一覧画面 doc | intentionally deferred（Lane 3〜5 の packet で shared pattern 参照を転記） |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| DSR 新設 | `01-decision-rules.md` title の範囲更新（DSR-01〜16）、04-backbone 反映先の番号整合（原則 4 の badge 3 種を DSR-17 へ繰り下げ）、review-checklist の参照 |
| catalog pattern 新設（⑯） | `02-component-catalog.md` 末尾番号の連番、目次があれば追記 |
| reference mockup 新設（6 file） | `reference/README.md` 表に行追加、`git ls-files` で tracked |
| 04-backbone 改版 | 更新履歴 v1.1 行、「16 の原則」改題 |
| Tauri command / route / REQ / 画面 | 該当なし |

## Design Decisions（packet-local、SPEC-UILB-D1〜D7）

### SPEC-UILB-D1: 原則 13 — UI 部品の枠と focus は 3:1、構造線は一段濃く（2 段 token）

- 操作枠（入力・ボタン outline・select・segmented・状態 badge の枠・focus ring）は隣接背景に対し 3:1 以上（WCAG 2.2 SC 1.4.11 非テキスト、focus は 2.4.13 の 2px + 3:1）。構造線（行区切り・表枠・card 枠・区切り線）は 3:1 の対象外だが、現行 1.20〜1.26:1 は低視力で行の追従を妨げるため一段濃くする。token は `--border`（構造線）と新設 `--border-strong`（操作枠）の 2 段。提案値 = 構造線 #cdc8c4（白 1.66:1）/ 操作枠 #8a8480（白 3.69:1 / 地色 3.53:1）。
- 理由: Lane 0-c 実測で現行 `--border` / `--input` / outline button が 1.20:1。00-foundations の「4.5:1 境界可視性」は事実誤認。全部を 3:1 にすると 00-foundations の淡い stone 系の意図（情報ブロックの静かな区切り）を壊すため、識別に必要な部品だけ 3:1、構造線は「見える」程度に留める。
- 却下: 全線 3:1（#939191 級、画面全体が重くなる）/ 現状維持 + 表示スケールで解く（線の薄さは拡大しても比が変わらない）。
- 転記先: 04-backbone 原則 13 + token 表、00-foundations `--border` 行 + `--border-strong` 新行、DSR-16、review-checklist。

### SPEC-UILB-D2: 原則 14 — 一覧の器（件数 + pager を上下、sticky header、識別列固定 opt-in）

- pagination を持つ一覧画面（0-b: 商品一覧 / 在庫照会 / 在庫変動履歴 / 一括価格改定 / 入出庫履歴 / 操作ログ / 整合性チェック）は table の上下に件数 + pager を置き、文言は上下同一「{n} 件中 {from}〜{to} 件目 · {page} / {total} ページ」（現行「{n} 件中 {page} / {total} ページ」に範囲を加える。上の件数は 16px 太字）。table header は sticky（単一 `<table>` 内、overflow container は table wrapper、z-index は header > 固定列 > 本文、横スクロール時は固定列右端に影）。識別列固定は opt-in: 商品コード + 商品名を持つ一覧（商品一覧 / 在庫照会 / 一括価格改定 / 棚卸し / 整合性チェック / 日次・月次 ranking）は 2 列を左固定し、2 列目の left は 1 列目の実幅を計測して決める（固定 rem は mockup v1 で隙間の不具合）。1 列目が日時の履歴系（入出庫履歴 / 操作ログ / 在庫変動履歴 / backup 一覧）は日時 + 種別（または日時のみ）を固定する。toolbar 2 段（原則 6）と行高 40px（原則 12）は不変。
- 理由: 視野狭窄では横スクロール中の行追従と画面端の見落としが増える（PMC7917782 / PMC4026991）、長い一覧で「いま何件目か」を上でも示す（GOV.UK / USWDS の table guide）。0-b で実装境界が `ui/table.tsx` + `ProductPagination` に集約されており、shared 1 箇所で波及できる。
- 却下: 無限 scroll（perPage 上限 D-031 と矛盾）/ 識別列を全画面で固定（識別列を持たない画面がある）/ 上だけに pager（下で読み終えた後に戻る操作が増える）。
- 転記先: 04-backbone 原則 14、02 ③ / ⑩ / ⑯、DSR-16、review-checklist。実装 lane への注意（Lane 2 packet の Matrix に予約）: `ProductTable.test.tsx:126` header 配列完全一致、pagination 文言 `getByText` の上下重複。

### SPEC-UILB-D3: 原則 15 — 現在の行は 3 点で示す

- 入力中 / 開いている行（inline 展開）/ 選択行は、左 4px の primary バー（形状）+ 淡い背景 `--row-current`（提案 #fff8e6、上の本文 #1c1917 = 16.5:1、実 token `--muted-foreground` #78716c = 4.53:1〈AA〉。mockup の「muted 7.2:1」は mockup のデモ配色 #57534e による値で実 token とは別物）+ badge または文言（「入力中」等、DSR-08）の 3 点で示す。hover は従来の accent のまま。差異列など doc が「色分けなし」と定める値（73-ui §73.6）は変えない。
- 理由: 色相変化だけの hover / 選択は視野狭窄・コントラスト閾値上昇で見落とす（Lane 0-a A-10）。UI-14 L3 で「いま何の行を編集しているか」が 400 行級の主動線の要。
- 却下: 行全体を primary 塗り（原則 5 の primary 1 つに反する）/ 枠線のみ（線は薄い）。
- 転記先: 04-backbone 原則 15 + token 表、02 ⑯、DSR-16、review-checklist。

### SPEC-UILB-D4: 原則 16 — 低視力を前提にした L3 項目と行内操作の当たり判定

- 操作者画面の L3 checklist に (a) Windows forced-colors（ハイコントラスト）で状態・枠・focus が消えない (b) DPI 125% / 150% で崩れない（rem / em 基準、px 直書きを避ける）(c) 実利用者（緑内障）の Windows native 1 セッションを代表画面で、を含める。行内の icon のみボタンは見た目 16px のまま当たり判定 24×24 以上（padding）。
- 理由: WCAG 2.2 2.5.8 target size、MS Learn（既定配色のコントラストを土台にし、forced-colors は上書きされる前提）、owner 所見（緑内障のある実利用者で再評価）。
- 転記先: 04-backbone 原則 16、review-checklist カテゴリ 9、DSR-16。実装 lane の Human Gate 文面に転記。

### SPEC-UILB-D5: DSR / catalog の採番（registry 予約）

- 本 PR が `DSR-16` と `⑯` を取る。04-backbone が「原則 4（DSR-16 新設）」としていた badge 3 種の DSR は `DSR-17` に繰り下げ（反映先の文言を本 PR で改訂、batch 1 = Lane 2 で新設）。理由: 並行 lane が同一 registry の次番号を各自割り当てると衝突する（PR #86 D-052 C 番号衝突の教訓）。先に merge する本 PR が採番し、未作成の予約は番号を繰り下げる。

### SPEC-UILB-D6: mockup D の位置付けと 6 file の扱い

- mockup D（`reference/mockup-d-*.html` 6 file）は提案 = お手本であり実装の正本ではない（README の既存方針どおり）。正本は 04-backbone 原則 13〜16 の本文。mockup の sidebar / PageHeader / ボタン / 検索欄の描き方は C の流用で D の対象外、owner 所感（現仕様の方が良い箇所）は Lane 2 packet で項目ごとに決める。fork が doc にない文言を置いた箇所は各 mockup 末尾 note の「未決」に列挙済みで、採否は実装 lane の packet で決める（本 PR は文言を確定しない）。fork の自己申告のうち事実と異なるもの: 「FormSection は catalog 未登録」（02 ④ フォームセクション L198 と `src/components/patterns/FormSection.tsx` が既存）— README 注記で訂正する。
- 理由: 見た目の提案と規範を分け、review で「背骨 n に反する」を指せる単位を保つ。

### SPEC-UILB-D7: token の最終値は Lane 2 で確定

- 本 PR の数値は実測付きの提案値（構造線 #cdc8c4 = 1.66:1 / 操作枠 #8a8480 = 3.69:1 / 現在行 #fff8e6 / muted 改訂候補 #766f6b = card 上 4.52:1）。Tailwind v4 `@theme` の `--border` / `--input` / `--ring` への割当てとアプリ内の見え方（Windows native、DPI 125%）は `未実測` で、Lane 2 の L3 で確定し、確定値を 00-foundations へ書き戻す（Lane 2 packet の Required Design Artifacts）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| L3 所見 4（コントラスト） | 00-foundations カラーパレット、04-backbone token 表 | SPEC-UILB-D1 / D7 | 識別に必要な部品だけ 3:1、構造線は一段濃く。全線 3:1 は却下 | 04 原則 13 / 00 / DSR-16 / checklist | AC rg（`border-strong` / 旧根拠 0） |
| L3 所見 1・2・3（上部 pager / sticky / 識別列） | 02 ③ ⑩、04 原則 6・12 | SPEC-UILB-D2 | shared 1 箇所で波及。無限 scroll / 全画面固定は却下 | 04 原則 14 / 02 ③ ⑩ ⑯ / DSR-16 | AC rg（⑯ / 件目 / sticky） |
| UI-14 L3「いま何の行か」 | 77-ui §77.3 行状態、DSR-08 | SPEC-UILB-D3 | 3 点表示。primary 塗りは却下 | 04 原則 15 / 02 ⑯ / DSR-16 | AC rg |
| L3 所見 5（低視力再評価） | review-checklist カテゴリ 9、DSR-13 | SPEC-UILB-D4 | L3 項目 + 当たり判定 24px | 04 原則 16 / checklist | AC rg（DSR-16 ≥ 3） |
| registry 整合 | 04-backbone 反映先、01 title、02 title、design-system README | SPEC-UILB-D5 | 先に merge する側が採番 | 04 / 01 / 02 / README | AC rg（`DSR-17` ≥ 3 / badge 文脈 DSR-16 = 0 / `DSR-01〜16` / `16 パターン`） |
| mockup の正本性 | reference README | SPEC-UILB-D6 | 提案と規範の分離 | README + 6 file | AC fd / rg |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（原則 13〜16 の本文に由来〈L3 2026-08-23 / Lane 0 出典〉を書き、00 / 01 / 02 / checklist / README に反映先を置く。Lane 0 の出典 URL は 04-backbone 原則の由来欄に主要 3 件、残りは本 packet Design Sources）。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: SPEC-UILB-D1〜D6 は 04-backbone / 00 / 01 / 02 / README に転記（本 PR）。SPEC-UILB-D7 は Lane 2 packet へ引き継ぎ。
- Assumptions and constraints: 実測値は `src/styles/globals.css` L52-93（2026-08-23）の token に対する WCAG 2.x 相対輝度計算（node、Lane 0-c script）。アプリ内の見え方は `未実測`。pagination 文言の変更は実装時に既存 test の文言 assertion 更新を伴う（Lane 2 packet で許容を明記）。
- Deferred design gaps, risk, and follow-up target: token 最終値（Lane 2 L3）/ `PageShell` 実装（Lane 2）/ 識別列を持たない履歴系の固定列の最終形（Lane 4 packet、mockup-d-history の方針を仮置き）/ caption 12 → 14（Lane 2 = batch 1）/ 02 ⑯ の canonical file（Lane 2 で実装後に path を確定）。
- Test Design Matrix can cite design decision IDs or source doc sections: R2 docs-only で Matrix 省略。AC の rg presence oracle が代替。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: docs-only。原則 1〜12 は不変、function-design は不変。escape hatch なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 該当なし（docs-only） | — |
| Fact check / design decision split | 事実 = Lane 0 実測 + 出典。判断 = SPEC-UILB-D1〜D7 | 本 packet |
| Lifecycle / retry | 該当なし | — |
| Operator workflow | 一覧の器（上下 pager / sticky / 識別列 / 現在行）は全一覧画面の主動線に影響 → 実装 lane の L3 | Lane 2〜5 packet |
| Replacement path | UI batch 1〜4（規範の履行）を Lane 2〜5 に統合 | 04-backbone 適用の順序 |
| Data safety / evidence | mockup はダミーデータのみ。実店舗データなし | Data Safety |
| Reporting / accounting semantics | 該当なし | — |
| Manual verification | docs-only で L3 なし。mockup D は owner 方向性承認済み（2026-08-23） | Human Gate |
| 環境・再現性 | 該当なし | — |

## Design Readiness

- Existing design docs are sufficient because: 04-backbone に原則・token 表・反映先・適用順序の枠があり、00 / 01 / 02 / checklist / README に追記先の節が存在する（Lane 1 fact pack で行番号確認済み）。
- Source docs updated in this PR: 04-backbone / 00-foundations / 01-decision-rules / 02-component-catalog / reference README（+ mockup 6 file）/ quality/review-checklist。
- Design gaps intentionally deferred: Design Intent Audit 参照。
- Durable decisions discovered in this plan and promoted to source docs: SPEC-UILB-D1〜D6。

Minimum design checks for business-app work:

- Layer ownership: 該当なし（docs-only）。
- Backend function design: 該当なし。
- Command / DTO / data contract: 該当なし。
- Persistence / transaction / audit impact: 該当なし。
- Operator workflow / Japanese UI wording: 件数文言「{n} 件中 {from}〜{to} 件目 · {page} / {total} ページ」、現在行 badge「入力中」、原則本文は日本語。
- Error, empty, retry, and recovery behavior: 該当なし（既存 ⑥ のまま）。
- Testability and traceability IDs: SPEC-UILB-D1〜D7、DSR-16、⑯、原則 13〜16、D-062。

## Contract Probe

- Probe 1: `doc-consistency-check.sh` が design-system docs の「親文書」参照や番号付き見出しを検査するか（⑯ / DSR-16 追加で ERROR にならないか）: Writer が追記後に `bash scripts/doc-consistency-check.sh` を実行して確認（PR #87 で ⑮ / 04 新設が通った先例）。
- Probe 2: 04-backbone 原則の追記で `quality/review-checklist.md` の既存項目と文言が重複しないか: カテゴリ 9 は既存 10 項目（`doc-consistency-check.sh` DS4「カテゴリ 9 全 10 項目に DSR 参照あり」（`scripts/doc-consistency-check.sh:1881`）、共通レイアウト継承 / 色のみ禁止 DSR-08 / 可読距離 DSR-13 / 文言 DSR-11 / 密度 DSR-12 / focus・active・filter の非色判別 DSR-02 ほか）。新 4 項目（枠・focus 3:1 / 一覧の器 / 現在行 3 点 / 低視力 L3）は既存 10 項目のいずれとも対象が異なる（既存「focus を色以外で判別」は DSR-02 の選択状態の話で、3:1 の比率要件は新規）。Writer は追記後に DS4 が「全 14 項目」で PASS することを確認する。
- Probe 3: `mockup-d-history.html` が fork から届いているか: 本 packet 起草時点で作成中。plan-first commit 時に 6 file 揃っていなければ README 行を 5 + 「作成中」にせず、file 到着を待って content commit で 6 file を揃える（AC の fd = 6）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| SPEC-UILB-D1 原則 13 + 2 段 token + 00 訂正 | 04-backbone / 00-foundations | AC rg: `^13\. \*\*` = 1、`border-strong` ≥ 1、`4.5:1 境界可視性` = 0、`4.40:1` ≥ 1 | — |
| SPEC-UILB-D2 原則 14 + 02 ③ ⑩ ⑯ | 04 / 02 | AC rg: `^14\. \*\*` = 1、`^## ⑯ ` = 1、`件目` ≥ 1、`sticky` ≥ 2 | — |
| SPEC-UILB-D3 原則 15 + 現在行 token | 04 / 00 / 02 ⑯ | AC rg: `^15\. \*\*` = 1、`row-current` ≥ 1 | — |
| SPEC-UILB-D4 原則 16 + checklist 4 項目 | 04 / review-checklist | AC rg: `^16\. \*\*` = 1、checklist `DSR-16` ≥ 3 | — |
| SPEC-UILB-D5 採番 | 01 title / 04 反映先 ×3 / 02 title・責務 / design-system README L13-14 | AC rg: 01 `DSR-01〜16` = 1 + `^## DSR-16 ` = 1、04 `DSR-17` ≥ 3 + `原則 4（DSR-16\|DSR-16 として新設\|\+ DSR-16$` = 0、02 `15 パターン` = 0 + `16 パターン` ≥ 2、README `DSR-01〜16` ≥ 1 + `15 パターン` = 0 + `16 パターン` ≥ 1 | — |
| SPEC-UILB-D6 mockup 6 file + README | reference | AC fd = 6、`mockup-d-` ≥ 6、`git ls-files` 6 | — |
| 更新履歴 / 改題 / 自己言及 | 04-backbone / design-system README | AC rg: 04 `16 の原則` ≥ 1 + `v1.1` ≥ 1 + `12 行` = 0、README `16 行` ≥ 1 + `12 行` = 0 | — |
| 全体整合 | docs | `doc-consistency-check.sh` ERROR 0 + `--target plan` 通過 | — |

## Test Plan

Test Design Matrix: 省略（R2 docs-only、PR #87 と同型）。

- targeted tests: AC の rg / fd presence oracle、`doc-consistency-check.sh`（無引数 + `--target plan`）。
- negative tests: 旧記載の残存 0（`4.5:1 境界可視性` / `DSR-16 新設`）。
- compatibility checks: 04-backbone 原則 1〜12 の本文不変（`git diff` で 1〜12 行に hunk なし）、function-design 不変、`src/**` 不変（`git diff --stat` に src なし）。
- data safety checks: mockup はダミーデータ。
- main wiring/integration checks: README → 6 file のリンク実在（R3 check）、04 → 00 / 01 / 02 の反映先に対応する節が実在。

Human Gate: owner plan approval（介入 1/2、Plan Gate で採否 3 点: 構造線の濃さ〈#cdc8c4 案〉/ 現在行の琥珀バー / 件数文言の統一形）→ Ready 承認（介入 2/2）→ merge。visual confirmation なし。

## Boundary / Wire Contract

- producer / consumer / wire type / internal type: 該当なし（docs-only）。
- precision/range: コントラスト比は WCAG 2.x 相対輝度（sRGB 線形化 γ2.4、小数 2 桁）。px / rem は原則本文の契約値（16 / 24 / 40 / 2px）。
- round-trip path: 04-backbone 原則 → 00 / 01 / 02 / checklist / README の反映先 → Lane 2 packet の Required Design Artifacts。
- compatibility: 原則 1〜12 不変、既存 DSR 不変、既存 catalog ①〜⑮ の本文は ③ / ⑩ への追記のみ。

## Review Focus

- 原則 13〜16 の数値が実測（Lane 0-c）・出典（Lane 0-a）と一致し、`未実測` の箇所が tag 付きか（D-062）。
- 00-foundations の訂正が 04 の token 表・DSR-16・checklist と同じ値・同じ語で書かれているか（文言表 presence oracle: 新記載 ≥ 1 / 旧記載 0）。
- DSR-16 / ⑯ / DSR-17 繰り下げの採番整合（01 title、04 反映先、02 連番）。
- 02 ③ / ⑩ への追記が既存本文（canonical / sortable header / 件数文言 code block）と矛盾しないか。
- README の 6 行と file の実在、fork の誤申告（FormSection）の訂正注記。
- mockup HTML を本 PR で編集していないこと（`git diff` は新規追加のみ）。

## Spec Contract

Contract ID: SPEC-UILB

- SPEC-UILB-D1〜D7（本 packet）を正とし、採用後は 04-backbone 原則 13〜16 / 00 / 01 / 02 / checklist / README の本文が正本になる。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UILB-D1 | 04 原則 13 + token / 00 訂正 / DSR-16 / checklist | AC rg | 実測一致、旧記載 0 | rg 出力 |
| SPEC-UILB-D2 | 04 原則 14 / 02 ③ ⑩ ⑯ | AC rg | 既存本文との整合 | rg 出力 |
| SPEC-UILB-D3 | 04 原則 15 / 00 row-current / 02 ⑯ | AC rg | 3 点表示 | rg 出力 |
| SPEC-UILB-D4 | 04 原則 16 / checklist | AC rg | L3 項目 | rg 出力 |
| SPEC-UILB-D5 | 01 title / 04 反映先 | AC rg | 採番 | rg 出力 |
| SPEC-UILB-D6 | README + 6 file | AC fd / rg | 正本性の注記 | fd / ls-files |
| 全体 | doc-consistency-check | exit 0 | — | log |

## Data Safety

- mockup はダミーデータのみ（実店舗の商品名・価格・取引先名を含めない）。
- local-only paths: なし。
- synthetic-only paths: `docs/design-system/reference/mockup-d-*.html`。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Plan Review round 1（Sonnet、独立 context、2026-08-23、packet `eca3d26`）: P1 3 / P2 3 / P3 0、verdict fail。全件 Coordinator が rg / node で裏取りのうえ accept して是正: P1-1 04-backbone に badge = DSR-16 を指す箇所が L43 以外に L38（token 表）/ L51（適用の順序）の 2 箇所あり AC の rg を素通り → Scope を 3 箇所改訂に拡張し AC に `DSR-17` ≥ 3 + badge 文脈 DSR-16 残存 0 を追加 / P1-2 AGENT_OPERATING_MANUAL §3.1 design board 例外の Workflow State 記録と owner 明示指示の引用が欠落（先例 PR #87 L16 あり）→ `Design Board Exception` 行を追加（owner 発言 2026-08-23 を引用）/ P1-3 「12 行」の自己言及が 04-backbone L3 と design-system/README L16 に残る（Scope の条件付き更新は常に「変更なし」に倒れる）→ 両方を確定の変更として Scope + AC に追加 / P2-1 「muted 7.2:1」は mockup のデモ配色 #57534e の値で実 token #78716c では 4.53:1 → SPEC-UILB-D3 / Scope に注記、mockup note も訂正 / P2-2 Probe 2 のカテゴリ 9 既存項目数 6 → 10（DS4 出力）に訂正し突合を再記述 / P2-3 `text-sm` 196 / 4 の計測条件不明 → `src/features` 非 test で 193 / 4（src 全体 236 / 6）と command を明記。
- Plan Review round 2（Sonnet、fresh context、2026-08-23、packet `400a19e`）: delta 7 hunk / anchor 8/9（DS4 文言の引用ずれ 1）/ WCAG 比率は全件再計算一致。P1 3 / P2 2 / P3 2、verdict fail。全件 Coordinator が rg / git grep で裏取りのうえ accept して是正: P1-1 round 1 で更新した AC が Design Intent Trace「registry 整合」行 / Ledger「SPEC-UILB-D5」「更新履歴」行に未伝播 → 3 行を AC と同一文言に同期 / P1-2 AC の negative regex `DSR-16 新設` が原則 13〜16 の反映先の正当な新規記述と衝突し得る → 反映先は「原則 13〜16（DSR-16、本 PR）」と書き「新設」語を使わない文言規約を Scope に置き、regex を `原則 4（DSR-16|DSR-16 として新設|\+ DSR-16$` に限定 / P1-3 design-system README L13「DSR-01〜15」・L14「15 パターンカタログ」・02 L1 / L4「15 パターン」の自己言及が Scope 外 → 4 箇所を Scope + AC + Ledger に追加 / P2-1 src 全体 text-sm 236 → 235（`git grep -c` 合計）に訂正 / P2-2 01 / 02 の「末尾に」挿入指示が更新履歴章の後ろを許す → 「DSR-15 の後・更新履歴の手前」「⑮ の後・更新履歴の手前」と明示 / P3-1 DS4 出力の引用「DSR 対応あり」→「DSR 参照あり」に訂正 / P3-2 2 file 指定の `rg -c` = 0 の意味が曖昧 → file ごとの個別チェックに分け「0 件は無出力・exit 1 = 0 とみなす」を注記。
- Plan Review round 3（Sonnet、fresh context、delta 検証、2026-08-23、packet `0087214`）: delta 7 hunk / anchor 10/10 実在 / AC ↔ Scope ↔ Ledger ↔ Design Intent Trace の 4 点整合 ok / AC 全 rg 式の現行 baseline を実測（未改訂のため期待どおり未達、式は壊れていない）/ `doc-consistency-check.sh --target plan` exit 0・無引数 ERROR 0 WARN 2（既存）。P1 0 / P2 0 / P3 0、verdict pass。Plan rally 収束（round 3/3、天井内）。Plan Commit 候補 = plan-first commit `eca3d26`（本 branch の全 commit の祖先）。
- 引き継ぎ（2026-08-23、Fable 全力稼働の終了、owner 指示「これからは今までのやり方に戻る、無茶するとしても Opus 5 に投げる」）: 以後の Writer は Design Board Exception の範囲で Opus 5（design docs の Writer、§3.1）または Codex 発注に切替可。切替時は Workflow State の `Writer` 行を改め、Plan Gate 後なら gated amendment として SHA を `Amendments` に記録する。owner 所見（2026-08-23、mockup 全件確認）: 「全体的に良さそう、細部は相談して詰める」+「商品一覧の固定 2 列目 header が浮いて見える」→ mockup 5 file の固定列影を横スクロール中のみ + header 下線合成に修正済み（`mockup-d-lists.html` v4 note 参照、未 commit）。
- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### 遷移記録（2026-08-23、state-only 遷移 plan-draft -> plan-gate -> plan-approved -> implementing）

- plan-draft -> plan-gate の evidence: packet を plan-first commit `eca3d26` で commit 済み（R2 docs-only、Test Matrix 省略）、`doc-consistency-check.sh --target plan` 全チェック通過。
- plan-gate -> plan-approved の evidence: 独立 Sonnet Plan Reviewer 3 round（round 1 P1 3 / P2 3 → 是正 `400a19e`、round 2 P1 3 / P2 2 / P3 2 → 是正 `0087214`、round 3 fresh delta 検証 P1 0 / P2 0 / P3 0 = pass、Review Response 参照）、owner plan approval（2026-08-23、介入 1 回目 / 予算 2 回。採否 3 点 = 構造線 #cdc8c4 案 / 現在行の琥珀バー / 件数文言の統一形、すべて採用。mockup 6 file 全件確認済み、固定列影の所見は修正反映済み）、Plan Commit = plan-first commit `eca3d26`（本 branch の全 commit の祖先）。
- plan-approved -> implementing の evidence: docs 本文の執筆は Design Board Exception の範囲で行う。Fable 全力稼働は 2026-08-23 で終了したため、以後の Writer は Opus 5（design docs Writer、§3.1）または Codex 発注に切替可 — 切替時は Workflow State `Writer` 行の改訂を gated amendment として `Amendments` に SHA 記録する。隣接 3 遷移を 1 state-only commit で圧縮記録（PR #87 / #94 / #95 と同型、forward state-only 1 本目 / cap 3）。
- owner 所感（2026-08-23）の後続: mockup 6 file で見えた画面間のバラつき・doc との食い違い・識別列を持たない画面の扱い・「現仕様の方が良い箇所」（サイドバー / PageHeader / ボタン）は、背骨 C（PR #87）そのものを問い直す「全体デザイン見直し」の材料として Plans.md 次の行動に新設した entry へ引き継ぐ（本 packet の scope には含めない）。

### gated amendment 1（2026-08-23、Plan Gate 後、owner 依頼起源）

- 事象: owner が「画面間のバラつき・食い違い・デザインそのものへの評価や改善案など、今回の所感はどこかに残してあるか。context に残っているうちに書き留めるべき」と依頼（続けて「まるっと言えば分析」）。所感は Plans.md entry / packet Design Sources / mockup note / Coordinator context に散在しており、1 本の文書が無かった。
- 裁定: `docs/design-system/reference/2026-08-23-current-design-analysis.md`（現デザインの分析）を新設し、本 PR の reference README に 1 行を追加して tracked 化する（Scope 追記 + AC 追記）。04-backbone 等の契約文言には影響せず、全体デザイン見直し packet の入力として Plans.md entry から参照する。Plan Gate 後の scope 追加のため gated amendment として記録し、commit SHA は後続 commit で `Amendments` に記す（PR #86 / #95 と同型）。
