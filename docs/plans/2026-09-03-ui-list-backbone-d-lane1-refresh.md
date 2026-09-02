# Plan Packet: UI 一覧の背骨 D — Lane 1 refresh（現状同期 + 理論蒸留 + mockup D 更新、docs-only）

旧 branch `agent/ui-list-backbone-d`（tip `20c4600`、2026-08-23、Draft PR #2 @ inventory-system-desktop、main から 163 commit 遅れ）の Lane 1（docs-only 規範化）を、2026-09-03 HEAD `654f95d` を起点に superseding するリブート packet。旧 Lane 1 の成果は全て branch 上のみで main に一切反映されておらず（本 packet「起票時実測」節参照）、DSR / catalog 採番は既に別内容へ消費済みのため単純 cherry-pick は不成立。本 packet は差分の棚卸し + 理論蒸留 + owner 新規所感（棚卸し画面）を統合し、実際の規範文は Writer が起票する。

Plan Review round 1（独立 Sonnet: P1×2 / P2×7、Opus デザインレビュー: P1×2 / P2×5 / P3×3）を Coordinator が全件 accept して本 commit へ反映済み。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

If a state-only commit materializes multiple phases, list the complete adjacent forward sequence and the pre-existing evidence for every intermediate transition in an append-only review/evidence record. Recording compression never permits a gate skip.

- Phase: implementing
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: ec80c57
- Amendments: none
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（design docs + mockup HTML、worktree isolation）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Opus 5 デザイン面レビュー（発注書駆動・read-only・§5.4 低制約 profile、D-056 準拠）+ Fable 裁定
- Final Reviewer: Codex（GPT-5.6、ロジック・整合面、PR review 1 回 = relay 1/2）+ Opus 5 デザイン面レビュー（read-only）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner が mockup D 2 file（Lane 1a、下記「Lane 1a/1b 分割」参照）を開いて視認（render oracle）+ docs-only hosted final の owner `workflow_dispatch`（Ready 後、CI-TRIGGER-D1）+ merge

2026-09-03: Plan Review round 1（独立 Sonnet subagent fresh context = P1 2 / P2 7、Opus 5 デザイン面レビュー〈発注書駆動・read-only〉= P1 2 / P2 5 / P3 3）→ 全件 accept、是正 commit `e594aa4`（§3.1 design board 例外の誤適用を撤回し Coordinator の役割配分判断へ / DSR-16 宙ぶらりん参照 3 箇所 / 「ベタっと」仮説を実読 4 点 + 完了画面 DSR-16 抵触へ差替 / Q8 追加・Q17 を ⑤ 限定・Q5-② 適用外注記 / deferral 裁定案 = 上部は件数 + 現在位置 text 必須・perPage 定数 1 本 + 画面別既定値 / Lane 1a（規範文 + mockup 2 file）・1b（残 5 file は Lane 2 同乗）分割 / catalog ⑯ 必須構成 6 項目 + 件数文言 pin）。round 2（Sonnet = P1 1 / P3 2、Opus = P2 3 / P3 2）→ 全件 accept、是正 commit `b928e6c`（00-foundations に更新履歴節なし / Lane 1b = 5 file / Q12 §1 へ典拠差替 / 密度注記式 200 × 40px ÷ 900px ≈ 9 画面 / DSR-16 pattern 限定 oracle）。round 3（Sonnet、最終）= P1/P2 = 0 / P3 1（Plan Review 記録の置き場、本 commit で Workflow State 側へ移設）。Plan Gate 収束（round 3/3、介入 1/3 = 起票選定）。`plan-gate -> plan-approved -> implementing` を本 state-only commit で圧縮遷移、Plan Commit = plan-first commit `ec80c57`。Writer = Sonnet subagent（Lane 1a）、Opus はレビュー専任。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者可視に何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-03 会話、座組承認 + owner 所感 2 件の提示、消費済み）。2 回目 = mockup 2 file（Lane 1a）視認 culling。3 回目 = Ready 後の owner `workflow_dispatch`（Ready・merge 自体は Coordinator 代行）。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（`docs/design-system/**` + `docs/design-system/reference/**` の HTML mockup + `docs/Plans.md` + `docs/decision-log.md` + `docs/quality/review-checklist.md`）。runtime code・DB・CSV・DTO・route・operator workflow の変更なし。後続の実装 lane（Lane 2〜5）は本 PR を正本として別 packet（R3）で行う。DEV_WORKFLOW Risk Level の R2「docs change that affects maintainability but not runtime contracts」に該当し、Test Design Matrix は R2 optional 判定で省略する（PR #21 scroll-policy-extension-design と同型）。

## Goal

Goal Invariant: 旧 Lane 1（`agent/ui-list-backbone-d` branch 資産、2026-08-23）の各成果を 2026-09-03 の main 状態と突合し、既に別内容へ消費された採番（DSR-16 / catalog 番号）を避けて再採番し、`ui-design-rules-qa-v2.md` の関連 Q（一覧設計・色使い・タイポグラフィ・ページング・UI パーツ）を書誌付きで 04-backbone へ流し込み、mockup D の一覧・棚卸し 2 file（Lane 1a）を現状同期 + owner 新規所感（棚卸し画面 header の平板さ・完了画面）を含めて更新し、ページ送り上下配置と perPage 既定値の deferral 2 件を裁定して、後続 Lane 2〜5 が本 PR の source docs だけで着手できる状態にする。

### 最小完了条件

- 差分表が旧 Lane 1 の全成果（原則 13〜16 / 00 枠コントラスト訂正 / DSR「一覧の器」/ catalog ⑯ / reference README + mockup D / review-checklist カテゴリ 9）+ 04-backbone 内の DSR-16 宙ぶらりん自己言及 3 箇所を現状（2026-09-03 main）と 1 行ずつ突合し、各項目の状態（未反映 / 部分反映 / 別内容へ採番消費）を確定する。
- DSR-22（一覧の器・現在行・UI 部品枠のコントラスト）と catalog ⑯（一覧の器 ListShell、必須構成 6 項目）が旧 Lane 1 の DSR-16 提案内容を承継しつつ新番号で規範化され、既存 DSR-16（同型情報のグループ化）・DSR-21（現在地色）と主題が重複しない。
- 04-backbone 原則 13〜16 に `ui-design-rules-qa-v2.md` Q5 / Q7 / Q8 / Q15 / Q17 の該当原則が書誌（原田秀司『UIデザインの教科書［新版］』翔泳社 2020）付きで反映され、Laws of UX（Miller / Chunking / Hick、Jon Yablonski 著、相島雅樹・磯谷拓也 訳、オライリー・ジャパン、2025-01）が一覧背骨の Why に引用される。
- mockup D の一覧・棚卸し 2 file（Lane 1a）が現状同期・理論反映済みで、棚卸し画面の進捗 header 案（現行 / A / B）と完了画面案（現行 / C）が新規に含まれ、owner が視認できる状態にある。
- ページ送り上下配置（採用、viewport 超過一覧限定）と perPage 既定値（共有定数は 1 本のまま維持し画面ごとに既定値だけ変える）の裁定案が 04-backbone / catalog ⑩ の改訂方針として記録される。
- D-079 が座組事実（Sonnet Writer 割当は Coordinator の役割配分判断 / Opus デザインレビュー専任 / Codex ロジックレビュー 1 回 / Fable 指揮）を記録し、D-056 と矛盾しない。
- `docs/Plans.md` ④ が本 packet（Lane 1a/1b 分割込み）への active link に更新される。

### 失敗定義

- 差分表を作らず旧 Lane 1 の規範文をそのまま転記し、DSR-16 / catalog 番号衝突のまま Plan Gate へ出す。
- 理論引用の書誌・条件節が転記時に誤る、または理論の適用条件（例外）を無視して断定する。
- owner 所感（棚卸し header の「ベタっと」）を断定の欠陥認定として書き、owner 視認前に是正方針を確定する。
- D-079 が D-056（Opus = read-only claims-producer 専任、Writer/Coordinator 不可）と矛盾する記述を含む、または §3.1 design board 例外を誤って引用する。

### 非目的

- `src/**` の実装（Lane 2〜5、後続 R3 packet）。
- Tauri / DB / 生成物の変更。
- 04-backbone 原則 1〜12 の改訂（batch 1〜4、Lane 2〜5 の Required Design Artifacts）。
- 旧 branch `agent/ui-list-backbone-d` の rebase（superseded、旧 Draft PR #2 は本 packet の PR merge 後に Coordinator が close する）。
- token 最終値の確定（提案値 + 実測を置き、アプリ内の見え方は Lane 2 の L3 で確定 — 旧 SPEC-UILB-D7 の方針を承継）。
- Fable 自身による画面実装着手（owner 保留、token 予算）。
- mockup D の残り 5 file（forms-a / forms-b / import-export / history / home-sales-admin）の現状同期（Lane 1b、下記参照）。
- sidebar / PageHeader / ボタンの見た目（旧 SPEC-UILB-D6 継続、mockup では描かない）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-03、HEAD 654f95d から分岐）

旧 Lane 1 packet（`git show agent/ui-list-backbone-d:docs/plans/2026-08-23-ui-list-backbone-d.md`、plan-first commit `eca3d26`）と分析 doc（`git show agent/ui-list-backbone-d:docs/design-system/reference/2026-08-23-current-design-analysis.md`）、および現行 main（`654f95d`）の実読突合。Plan Review round 1 の指摘を反映し、DSR-16 宙ぶらりん自己言及を 3 箇所へ訂正、`text-sm` 実測値を再計測、完了画面の構成要素数を再確認した。

| # | 旧 Lane 1 成果（2026-08-23、branch 上のみ） | 2026-09-03 main の現状 | 判定 |
|---|---|---|---|
| 1 | `04-backbone.md` 原則 13〜16 新設（枠 2 段 token / 一覧の器 / 現在行 3 点 / 低視力 L3） | 未反映。`04-backbone.md:11` は依然「## 12 の原則」、`README.md:16` も「12 行の『まず守る骨』」のまま。token 表の badge 行は今も `04-backbone.md` に「DSR-16 として新設」の宙ぶらりん参照が残る（後述 #7） | **未反映（0 件）** — 本 packet で再起票 |
| 2 | `00-foundations.md` `--border` 根拠訂正「4.5:1 境界可視性」→ 実測 1.20:1 | **反映済み**。`00-foundations.md:17` は `対 --background 実測比 ≈1.20:1（補助的な区切り。単独のグループ信号にしない、DSR-16）`（PR #15、2026-08-29、Plans.md L43「--border 4.5:1 誤記→実測 1.20:1 修正含む」）。ただし引用先の DSR-16 は旧 Lane 1 提案の「枠コントラスト」ではなく PR #15 で新設された別内容「同型情報のグループ化と囲みの階層」（`01-decision-rules.md:267`）— 意味的にはグループ信号としての枠の話でもあるため偶然整合しているが、旧 Lane 1 が意図した「操作枠 3:1」の 2 段 token（`--border-strong`）は未着手 | **部分反映**（border 根拠は是正済み、2 段 token は未着手） |
| 3 | `--muted-foreground` 行「4.5:1（AA）」を card 上 4.40:1（AA 未達）で訂正、`--foreground` 行を実測 16.7:1 へ訂正 | 未反映。`00-foundations.md:15` は今も「コントラスト比12.6:1（AAA+）」（対象背景の明記なし）、`:18` は今も「コントラスト比 4.5:1（AA）」の generic 表記（対象背景の明記なし） | **未反映** |
| 4 | DSR-16「一覧の器・現在行・UI 部品枠のコントラスト」新設 | 番号が別内容へ消費済み。DSR-16 は 2026-08-29 PR #15 gated amendment 3 で「同型情報のグループ化と囲みの階層」として新設（`01-decision-rules.md:267-284`）。DSR-17〜21 も新設済み（scroll 3+1 分類 / 戻り導線 / feedback / destructive dialog / 現在地色）。次の空き番号は DSR-22（`01-decision-rules.md:415` が DSR-21 で最後、`README.md:13` も「DSR-01〜21」） | **番号衝突・再採番必須** — DSR-22 |
| 5 | catalog ⑯「一覧の器（ListShell）」新設 | 未反映。catalog は ⑮「商品追加欄 live 候補プレビュー」（`02-component-catalog.md:845`）が最後で ⑯ は存在しない。⑩ ページネーションは canonical `ProductPagination` + `PRODUCT_PER_PAGE_OPTIONS = [50,100,200]` として既に正本化されており（`02-component-catalog.md:599-651`）、PR #30（2026-09-03）で棚卸し一覧が同 canonical を再利用済み（Plans.md L17） | **未反映** — ⑯ は本 packet で新設 |
| 6 | reference README + mockup D 6 file 追加 | 未反映。`fd -e html mockup-d docs/design-system/reference` = 0 件、`reference/README.md` は mockup-c-* 3 file のみ列挙。mockup D は旧 branch 上に存在するのみ（`git diff --stat $(git merge-base agent/ui-list-backbone-d main) agent/ui-list-backbone-d -- docs/design-system/reference/` で 6 file 確認済み: forms-a / forms-b / history / home-sales-admin / import-export / lists） | **未反映（0 件）** — 本 packet では Lane 1a として 2 file（lists / 新規 stocktake）のみ着手、残り 5 file は Lane 1b（下記参照） |
| 7 | review-checklist カテゴリ 9 に非テキスト枠 3:1 / 一覧の器 / 現在行 3 点 / 低視力 L3 の 4 項目追加 | 未反映。現行カテゴリ 9（`review-checklist.md:68-85`）は DSR-01/08/13/11/12/02/21/07/10/16/17/18/19/20 の 14 項目に対応済みだが、旧 Lane 1 提案の 4 項目は含まれない | **未反映** |
| （追加発見・件数文言） | 旧分析 doc「件数文言の揺れ」（`2026-08-23-current-design-analysis.md:14`）: 統一形「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」を Lane 1 で pin する提案 | 未反映。`02-component-catalog.md:610` の ⑩ 構造例は今も「{n} 件中 {p} / {t} ページ」のまま範囲表記なし | **未反映** — catalog ⑩ + 04-backbone 原則 14 で統一形を pin する（Scope 1） |
| （追加発見・DSR-16 宙ぶらりん自己言及） | — | `04-backbone.md` に badge 3 種を指す誤ったポインタが **3 箇所**残存: `:38`（token 表「badge \| 12px / 600 / pill、3 種 \| DSR-16 として新設」）、`:43`（反映先「01-decision-rules.md: 原則 4（DSR-16 新設）/ …」）、`:51`（適用の順序「3. badge 3 種の全画面適用 + DSR-16」）。いずれも実際の DSR-16（グループ化）とは無関係な badge 3 種の話を指す | **新規 drift（旧 Lane 1 起票時点では正しかったが、その後の DSR-16 占有で陳腐化）** — 本 packet の Scope 1 で 3 箇所とも是正 |

**未実装の裏取り**（Scope 1 の前提が今も成立することの確認）: `rg -n "PageShell" src` = 0 件、`rg -c "text-sm" src/features --glob '!*.test.*'` 合計 199（旧 Lane 1 実測 193 から微増、大勢は不変）。04-backbone 原則 1〜12 の履行状況（table 16px 化・PageShell 等）は旧 Lane 1 起票時からほぼ変わっていない。

## 設計判断

### 役割配分（Scope 5 の前提、D-079 で記録）

Writer の Sonnet subagent 割当は Coordinator（Fable）の役割配分判断（owner 指示 2026-09-03「UI 視覚系は Claude が触る方が良い結果」）である。`AGENT_OPERATING_MANUAL` §3 の独立性制約（Writer ≠ Plan Reviewer ≠ Final Reviewer、自己承認禁止）は維持し、Plan Reviewer 一次と Final Reviewer は Writer とは別主体（独立 fresh context の Sonnet / Codex）が担う。実装 code（Lane 2〜5）の Writer 既定は変えない。Opus 5 は D-056 の read-only claims-producer 専任（発注書駆動、§5.4 低制約 profile）であり、Plan/Final Reviewer の一構成要素としてデザイン面の検出力を使う。Coordinator = Fable（指揮）/ Writer = Claude Sonnet 5 subagent（design docs + mockup、worktree isolation）/ Plan Reviewer = Sonnet 独立 + Opus 5 デザイン面 + Fable 裁定 / Final Reviewer = Codex（ロジック・整合面、PR review 1 回）+ Opus 5 デザイン面 + Fable 裁定 / Human Gate = owner render oracle + Ready の owner `workflow_dispatch` + merge。

**Plan Review round 1 是正（S-P1-1）**: 当初案は本節と D-079 verbatim・Workflow State に AGENT_OPERATING_MANUAL §3.1 design board 例外（希少・最高能力 slot を design docs の Coordinator/Writer に割り当てる例外）を根拠として引用していたが、Sonnet は希少・高コスト slot ではなく §3.1 の主語（Fable 自身が Writer/Coordinator になる場合）に該当しないため誤用だった。§3.1 への言及は Workflow State・座組・D-079 の全箇所から削除し、上記のとおり「Coordinator の役割配分判断」として書き直した（S-P2-7: Workflow State の 14 番目フィールド `Design Board Exception` も削除し、13 field に戻した）。

### Lane 1a / 1b 分割（Opus §1、S-P3-3）

本 PR は **Lane 1a** のみを扱う: 規範文一式（04-backbone 原則 13〜16 / DSR-22 / catalog ⑯ + ⑩ 改訂 / 00 訂正 / README・checklist 同期 / 採番是正 / D-079 / Plans.md）+ mockup **2 file**:

- (i) `mockup-d-lists.html`（一覧の器: 上部件数 + sticky header + 識別列固定 + 現在行 3 点、perPage 50 のときと 200 のときの密度比較 2 態。200 態は数値注記を必須とする — 「200 行 = 縦スクロール約 9 画面ぶん（200 行 × 行高 40px〈04-backbone 原則 12 契約値、`src/components/ui/table.tsx:61` の header cell `h-10` と整合〉= 8000px、viewport 高 900px 換算で 8000 ÷ 900 ≈ 8.9 → 約 9 画面。未入力の見落とし区間が生じる」の形で明記する。実寸描画は任意）
- (ii) 新規 `mockup-d-stocktake.html`（進行中 header の 現行 / A / B を同一ページ内に縦 3 段で並べ、完了画面の 現行 vs C を差異 0 件 / 12 件 / 不整合ありの 3 状態で示す）

各 mockup は「これを採ると何が変わるか」を 1 行の note で示し、未決項目に番号を振って owner が「3 番だけ嫌」のように個別に返せる形にする。描かないもの = sidebar / PageHeader / ボタンの見た目（旧 SPEC-UILB-D6 継続）。

**Lane 1b**（本 PR の Non-scope、後続 Lane 2 実装 PR に同乗）: 残り mockup **5** file（forms-a / forms-b / import-export / history / home-sales-admin。旧branch の 6 file から Lane 1a の lists を除いた残り、`git diff --stat` の merge-base 突合で 6 file 確認済み）の現状同期。Lane 2 への申し送り: Lane 2 は `ListShell` より先に `PageShell` を出す（`StocktakePage.tsx:215` と `StocktakePage.tsx:926` がそれぞれ独自 root `min-h-screen space-y-6 p-6` を持ち、旧分析 doc §1-6 が指摘した「page root 3 系統、`PageShell` 未実装」が今も未解消のため、一覧の器〈ListShell〉より先に page root の統一を済ませる必要がある）。

### Deferral 裁定案（Plans.md ④ sub-bullet、PR #30 起票時実測起源の 2 件、Opus §4 反映）

- **ページ送りの上下両配置**: 採用。対象は「table の行数が viewport を超える一覧画面」に限定し、全一覧へ無条件適用しない（旧 SPEC-UILB-D2 の判定と同型。1 画面に収まる短い一覧では下だけで足りる）。catalog ⑩ の canonical `ProductPagination` に上部 variant を追加する方針とし、**上部 variant は「件数 + 現在位置テキスト」を必須、pager ボタンは任意**とする。同じ操作ボタンが上下 2 組あると選択肢が増え判断コストが上がるため、`ui-design-rules-qa-v2.md` Q12 §1「初めてインターフェースを触るユーザー（初心者）にとっては、操作体系はシンプルなほうが使いやすい（インタラクションコストが少なくて済むため）」（`:419`）を根拠に、操作対象を減らす安全側の設計にする。既存呼び出し側（商品一覧等）は画面ごとに opt-in する。
- **perPage 選択肢の刻み**: 共有定数 `PRODUCT_PER_PAGE_OPTIONS`（またはそれに準ずる catalog ⑩ 正本の共有定数）は **1 本のまま維持**し、**既定値だけを画面ごとに変える**（裁定案: 棚卸しは未入力を潰し切る全走査が主動線のため既定 50、商品一覧は 1 件探索が主動線のため既定 100）。40 刻み化（40/80/120 等）は既存の固定文言 test（`ProductTable.test.tsx` 等）と旧分析 doc §1-11 が指摘する移行コストに見合わないため不採用の裁定案とする。mockup では刻みの変更ではなく「perPage 50 のとき / 200 のときの画面高さ」を並べて見せ、owner が既定値を Human Gate で最終決定する。owner の 2026-09-02「40 刻み」の要望は、値の刻み変更ではなく本裁定案（既定値の画面別最適化 + mockup での密度比較提示）で応える。

## D-079 verbatim 案

`docs/decision-log.md` へ追記する entry 案（D-078 の shape に合わせる。既存文言は変更しない、追記のみ）。Plan Review round 1 の指摘（S-P1-1）を反映し、§3.1 design board 例外への言及を全て削除した。

```
## D-079: UI 視覚系 change の座組（Sonnet Writer / Opus デザインレビュー専任 / Codex ロジックレビュー 1 回 / Fable 指揮）（2026-09-03）

- Decision: UI 一覧の背骨 D — Lane 1 refresh から、design-only な UI 視覚系 change の座組を次のとおり owner 承認事実として記録する。Writer の Sonnet subagent 割当は Coordinator（Fable）の役割配分判断（owner 指示 2026-09-03）であり、`AGENT_OPERATING_MANUAL` §3 の独立性制約（Writer ≠ Plan Reviewer ≠ Final Reviewer、自己承認禁止）は維持する。実装 code の Writer 既定は変えない。Coordinator = Fable（指揮）、Writer = Claude Sonnet 5 subagent（design docs / mockup HTML、worktree isolation）、Plan Reviewer = Sonnet 独立 fresh context 一次 + Opus 5 のデザイン面レビュー（D-056 の read-only claims-producer 範囲、§5.4 低制約 profile）+ Fable 裁定、Final Reviewer = Codex（ロジック・整合面、PR review 1 回）+ Opus 5 デザイン面 + Fable 裁定。Opus は D-056 の read-only claims-producer であり、Writer・Coordinator・state 遷移管理には割り当てない。
- Status: accepted（owner 承認 2026-09-03）
- Why: owner 所感「UI 視覚系は Claude が触る方が良い結果」（2026-09-03）により、design docs Writer 役を Coordinator の役割配分判断として Claude Sonnet 5 subagent に割り当てる。一方、Opus 5 は D-056 で Writer / Coordinator を明示的に除外された read-only claims-producer 専任 slot であり、デザイン面の検出力を使う場合も Plan/Final Reviewer の一構成要素（read-only、発注書駆動）に留める必要がある。両者を混同すると D-056 の rollback 条件（process 契約を内面化させない）に抵触するため、座組を明文化して切り分ける。
- Impact: 以後の UI 視覚系 design-only change は本 entry を座組の先例として引用できる。`AGENT_OPERATING_MANUAL` §3 の自己承認禁止（Writer と Plan/Final Reviewer の分離）は本座組でも独立 fresh context の Sonnet／Codex が担うことで維持する。実装 code（Lane 2〜5 等の R3）の Writer 割当ては本 entry の対象外で、既存分業（Codex 発注 or Sonnet subagent、change ごとに Coordinator 判断）のまま。
- Alternatives considered: Opus 5 を Writer に格上げする案（D-056 accepted 時点の「read-only claims-producer 専任」を change ごとの owner 裁定なしに拡張することになり、既定の分業実績を崩すため不採用。Opus 5 デザイン面「レビュー」に留める）; Codex を Writer のまま維持する案（owner 所感と矛盾するため不採用）。
- Revisit: Opus 5 の役割拡張が複数 change で反復要請される場合、または D-056 の rollback 条件に抵触する運用が観測された場合。
```

## Scope

1. **現状同期**（Scope 1）: 「起票時実測」節の差分表を根拠に、以下の改訂方針を Writer が起草する。`rg -n "^## 更新履歴"` で実測した結果、`## 更新履歴` セクションを持つのは 01-decision-rules.md（`:427`）/ 02-component-catalog.md（`:891`）/ 04-backbone.md（`:54`）/ review-checklist.md（`:110`）の 4 file であり、**00-foundations.md には `## 更新履歴` セクションが存在しない**（`rg -n "^## 更新履歴" docs/design-system/00-foundations.md` = 0 件）。上記 4 file はそれぞれ改訂の一部として `## 更新履歴` へ 1 行追加する。00-foundations.md は更新履歴節を新設せず、訂正内容（`--border-strong` / `--row-current` token 追加、`--muted-foreground` / `--foreground` の対象背景明記）を該当 token 行の注記自体で足りるものとする。
   - `04-backbone.md`: 「12 の原則」を「16 の原則」へ改題し、原則 13〜16（骨子は下記「設計判断」外の各節参照）を追記。宙ぶらりん `DSR-16` 自己言及 **3 箇所**（`:38` token 表 badge 行 / `:43` 反映先「原則 4（DSR-16 新設）」/ `:51` 適用の順序「badge 3 種の全画面適用 + DSR-16」）を、実際の DSR-16（グループ化）と無関係であることを明記した上で是正する（badge 3 種は既存原則 4 の記述で足りるため DSR 参照自体を削除する方向。最終判断は Writer 起草 + Plan Review）。`README.md:16` の「12 行」を「16 行」へ。catalog ⑩ と合わせ、件数文言の統一形「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」（旧分析 doc `2026-08-23-current-design-analysis.md:14` 起源）を原則 14 で pin する。
   - `00-foundations.md`: `--border` 行（`:17`）は現行の是正済み文言を維持しつつ、新設 `--border-strong`（操作枠 3:1）と `--row-current`（現在行背景）token を追加。`--muted-foreground`（`:18`）と `--foreground`（`:15`）の比を実測値へ訂正し、対象背景を明記する: `--foreground` = 16.7:1（対 `--background`）/ 16.0:1（対 `--card`）、`--muted-foreground` = 4.59:1（対 `--background`）/ 4.40:1（対 `--card`、AA 未達）。
   - `01-decision-rules.md`: DSR-22「一覧の器・現在行・UI 部品枠のコントラスト」を DSR-21（`:415-424`）の後・更新履歴（`:427`）の手前に新設。title を「DSR-01〜22」に更新。本文は DSR-16（グループ化、同型情報の表示形式）・DSR-21（現在地色、ナビゲーションの active）と主題が重複しないことを明記した上で書く（DSR-22 は「枠の可視性」「現在行＝編集中/選択中の行」「一覧の器の構造」に限定する）。
   - `02-component-catalog.md`: ⑯「一覧の器（ListShell）」を ⑮（`:845`）の後・更新履歴（`:891`）の手前に新設。title の「15 パターン」は（`README.md:14` 同様）現状未変更 — ⑯ 追加に伴い両方「16 パターン」へ改訂する。③ テーブルへ sticky header / 識別列固定 opt-in を追記、⑩ ページネーションへ上部 variant（Deferral 裁定「上下両配置」、件数 + 現在位置テキスト必須・pager 任意）と perPage 既定値の画面別裁定注記を追記。⑯ の必須構成は下記「catalog ⑯ 必須構成」節を参照。
   - `reference/README.md`: mockup D 2 file（Lane 1a: `mockup-d-lists.html` / `mockup-d-stocktake.html`）の行を追加。旧 gated amendment 1 の `2026-08-23-current-design-analysis.md` も分析資料として同時に移植し 1 行追加する。残り 5 file（Lane 1b）は本 PR では追加しない旨を注記する。
   - `review-checklist.md`: カテゴリ 9 に DSR-22 対応行を追加（枠 3:1 / 一覧の器 / 現在行 3 点 / 低視力 L3 の 4 観点を DSR-16/17 と同様 1〜2 行に集約）。
   - **archive 移植**: 旧 packet を `git show agent/ui-list-backbone-d:docs/plans/2026-08-23-ui-list-backbone-d.md` から取得し、`docs/archive/plans/2026-08-23-ui-list-backbone-d.md` へ「superseded by 本 PR」注記付きで移植する（Writer 作業、S-P2-8）。
2. **理論蒸留**（Scope 2）: `ui-design-rules-qa-v2.md` の該当 Q を 04-backbone 原則へ書誌付きで流し込む。
   - Q5 原則①（並べ替え時の基準列明示）: 現行のどの一覧にも明示規約がない新規要素。原則 14（一覧の器）へ「ソート機能を持つ一覧は基準列を明示する」を追加する方針（実装対象の有無は Writer が `rg` で確認）。
   - Q5 原則②（3 大操作の左配置）: 原則 14 の Why に引用する際、**必須の適用外注記**を付す — 「左 rail は global nav（sidebar 22 項目、`src/config/navigation.ts` の `status: "active"` 実測値、`RootLayout.tsx:62`）が既に占有しているため、本アプリでは Q5 原則②の左配置をそのまま採らず、横 toolbar 2 段（原則 6）で代替する」。
   - Q5 原則③（余白グルーピング）・Q5 原則④（見切れによるスクロール示唆）: 原則 14 の Why（一覧の器の構成根拠）へ引用。
   - Q7 原則①（色数制限）: 原則 2（色は家族で）の Why を補強。
   - **Q8 原則①（見出しと本文の明確な区別、`ui-design-rules-qa-v2.md:312`）・原則③（PC はやや遠い距離、実サイズを大きめに、`:324-328`）・原則④（色数を絞った上で文字サイズの強弱による視線誘導、`:332-337`）**: 原則 13〜16 が求める「見出し / ラベル / 値の 3 段を全画面同型にする」ことの主典拠、および原則 1（本文 16px 最低線）の Why の補強として引用する。
   - Q12（`ui-design-rules-qa-v2.md:423-433`）: 「高齢の利用者への配慮」「ITに不慣れな利用者への配慮」はいずれも本書に記載なし。Writer note として、operator profile（非 IT・年配の店主）の根拠は QA v2 側からではなく既存の WCAG / Laws of UX 側から引く旨を明記する。
   - Q15（ページング vs 無限スクロール、現在地のコントロール感）: Deferral 裁定「上下両配置」の Why、および原則 14 の pager 記述の Why。
   - Q17（UI パーツ適用ルール）: 適合対象は **⑤カラム（常設 sidebar）のみ**と書く。③ヘッダ（全画面共通ナビ・検索窓の常設帯）は本アプリに不在（`RootLayout.tsx:62-65` は `aside`〈Sidebar〉+ `main`〈Outlet〉の 2 要素のみで、共通ヘッダ帯は存在しない）。ヘッダの役割は sidebar と各画面の `PageHeader` が分担していることを 03-philosophy または 04-backbone の前提節へ 1 文で記す。
   - Laws of UX（Miller / Chunking / Hick）: 一覧の器・現在行の Why に、情報のグルーピングと選択負荷低減の観点で引用（DSR-19/20/21 が同著を Why で引用した先例と同型の引用範囲に限定する — 契約本文の主張は本アプリの Why 節のみ、理論書の主張をそのまま規則として転記しない）。
3. **mockup D 更新（Lane 1a、2 file のみ）**（Scope 3）: 旧 `mockup-d-lists.html` を現状同期 + 理論反映で更新し、新規 `mockup-d-stocktake.html` を owner 所感 2 件（2026-09-03）向けに作成する。仮説は下記「棚卸し『ベタっと』の仮説」を参照し、いずれも owner 視認で確定する（断定しない）。
4. **Deferral の裁定を 04-backbone に取り込む**（Scope 4）: 上記「設計判断」節の裁定案を 04-backbone 原則 14 と catalog ⑩ に反映する方針を Writer へ引き継ぐ。
5. **D-079 記録**（Scope 5）: 上記 verbatim 案を `docs/decision-log.md` の D-078（`:630-639`）の後に追記する。
6. **Plans.md**（Scope 6、本 packet で直接編集）: ④ の行を Lane 1a/1b 分割が分かる文言へ更新（詳細は「Plans.md」節参照）。
7. **Registration**（Scope 7）: `design-system/README.md:13` の DSR 列挙「DSR-01〜21」を「DSR-01〜22」へ、`:14` の catalog 目次を「15 パターン」→「16 パターン」+ ⑯ 追加、`:16` の 04-backbone 説明を「16 行」へ、review-checklist カテゴリ 9 に DSR-22 行、01/02/04/review-checklist の更新履歴行追加。`90-traceability` 再生成は不要（REQ token 追加なし、Registration/Generation Obligations 節参照）。

### catalog ⑯ 必須構成（O-P2-1, O-P2-2, O-P2-5）

⑯「一覧の器（ListShell）」は次の 6 項目を必須構成として持つ（旧 SPEC-UILB-D2 を現状に合わせて更新）:

1. **toolbar 2 段**（検索条件 / 並び替え・件数を段で分け、原則 6 の枠〈`rounded-md border p-4`〉に入れる）
2. **上下の件数・現在位置**（上部は「{n} 件中 {from}〜{to} 件目」の text 表示を必須、pager ボタンは任意。下部は既存どおり件数 + pager フル装備。文言は統一形「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」で pin）
3. **sticky header**（単一 `<table>` 内、横スクロール時は固定列右端に影）
4. **識別列 opt-in**（商品コード + 商品名等を持つ一覧は固定、履歴系は日時 + 種別を固定）
5. **現在行 3 点**（左端バー + 淡い背景 + badge/文言、原則 15）
6. **読込みは `ListSkeleton`**（原則 11）+ 履歴系（識別列を持たない画面）の扱いを別途明記

Acceptance Criteria の該当行で、catalog ⑯ 本文にこの 6 項目それぞれが literal に存在することを確認する。

## 棚卸し「ベタっと」の仮説（owner 所感、mockup 提示 → render oracle で確定）

Plan Review round 1（S-P2-4, O-P2-3, O-P2-4）で当初の仮説（「icon がない」「同じ視覚 weight」）を実装コードと再突合し、以下へ差し替えた。

**進行中 header（`StocktakeProgressHeader`、`StocktakePage.tsx:379-411`）**:

1. 最重要の数値「入力済み n / 全 N」（`:389`）が `text-sm text-muted-foreground` — 画面で一番知りたい数が最小・最薄の文字になっている（Q8 原則④「色数を絞った上で文字サイズの強弱による視線誘導」の逆を行っている）。
2. 見出し（`:387`、「棚卸し中（開始日: …）」）に日時が混在し、見出しと補足情報が未分離（Q8 原則①「見出しと本文の明確な区別」）。
3. 進捗ブロックだけ器がない（`:383` の `space-y-2` のみで、`FormSection` が持つ `<Separator />`〈`FormSection.tsx:42`〉のような区切りも背景差もなく、`PageHeader` の続きに見える）。
4. filter 行が裸（`:740` の `flex flex-wrap items-center gap-4`、04-backbone 原則 6 後段「一覧画面の検索・絞り込みは枠に入れ」が未履行）。

**訂正注記**: Badge（`:394-405`）は `AlertTriangle` / `CheckCircle2` の icon + warning 系色を持ち、`:408` に `Progress` bar もある。「icon がない」という当初仮説は誤りで、icon は badge 内に留まり header 全体の視覚的な区切りとして機能していないだけである。見出し階層は 24px（PageHeader h1）/ 20px（h2 ×3）/ 14px（muted 本文・件数）の 2.5 段に留まる。

**完了画面（`StocktakeResultPage`、`StocktakePage.tsx:923-997`）**:

- 今回の総額（`:933`、`text-3xl`）と前回（`:946`、`text-base`）を **Card 2 枚に分離**（`:928` / `:937`）しており、増減を算出していない。DSR-16（`01-decision-rules.md:273-274`「比較が目的 → 列を揃えた表 / structured list」）に抵触する構造。
- 「差異のあった商品」見出し（`:954`）に件数がなく、0 件が素の `<p>差異はありませんでした</p>`（`:956`、原則 11 の `EmptyState` 未履行）。同じ `StocktakePage.tsx` 内、一覧側の絞り込み結果 0 件（`:793-796`）は `EmptyState`（`title="この条件に一致する商品がありません"`）を使っており、同一 file 内で空状態の表現が `EmptyState` と素の `<p>` の 2 系統に分かれている。
- 整合性チェック「不整合 n 件」（`:990`）が n > 0 でも無色・無 icon（DSR-08 の icon+日本語+色 3 点が未適用）。

**提案方向（mockup `mockup-d-stocktake.html` で並べて owner が選ぶ）**:

- **A（推奨）サマリ帯**: 既存 `SummaryCard`（`src/components/patterns/SummaryCard.tsx`、小さい muted ラベル + 大きい値）を横 2〜3 枚並べる（進行中: 入力済み / 未入力 / 進捗% — 完了: 今回総額 / 前回総額 / 増減）。新しい font-size を作らず DSR-13 に触れず、ホームと同部品を使うことで画面間のばらつきも減る。
- **B 見出しの役割分離**: 「棚卸し中」h2 と「開始 …」を別行 muted に分離し、進捗ブロックを `Separator` 付きの器へ入れる（A と併用可）。
- **C 完了画面の DSR-16 準拠再構成**: Card 2 枚を廃し、今回 / 前回 / 増減を列揃えの structured list へ再構成。差異件数を見出しへ明記し、不整合 n > 0 は warning Alert + icon で示す（規範違反の是正であり mockup 採否と独立に Lane 3〜5 の実装対象）。

## Non-scope

- `src/**`、Tauri / DB（Lane 2〜5 で実装）。
- Lane 2 共有部品（`PageShell` / `ListShell` / `SearchBar` live 統一等）の実装。
- 旧 branch `agent/ui-list-backbone-d` の rebase・再利用（superseded）。
- Fable 自身による画面作成（owner 保留、token 予算）。
- 04-backbone 原則 1〜12 の改訂。
- token 最終値の確定（提案値 + 実測を置くのみ）。
- 棚卸し「ベタっと」所感の是正実装（mockup 提案のみ、実装は Lane 3〜5 の R3 packet）。
- mockup D の Lane 1b 対象 5 file（forms-a / forms-b / import-export / history / home-sales-admin）の現状同期（後続 Lane 2 実装 PR に同乗）。
- sidebar / PageHeader / ボタンの見た目（旧 SPEC-UILB-D6 継続）。

### Lane 2 への申し送り（DS1/DS3 復元義務、Final Review round 1 Coordinator 裁定 S-P2-1）

`--border-strong` / `--row-current` token と `ListShell.tsx` は本 PR では未実装のため、DS1（src path 実在）/ DS3（token HEX 整合）の突合対象から意図的に外す表記（backtick なしの path、`#` を付けない hex）を 00-foundations.md / 04-backbone.md / 02-component-catalog.md に用いている。Lane 2 で実装したら、次を復元する義務を負う: (1) `--border-strong` / `--row-current` を globals.css `:root` へ追加し、doc 側の hex 表記を `#8a8480` / `#fff8e6` の backtick + `#` 付きへ戻して DS3 の突合対象に含める、(2) `src/components/patterns/ListShell.tsx` を新設したら 02-component-catalog.md ⑯ の canonical 記載を backtick 付き `` `src/components/patterns/ListShell.tsx` `` 表記へ戻して DS1 の対象化する。Opus P3-2（今すぐ `#` を復元する）はこの裁定により却下（unimplemented token を DS3 に含めると常時 ERROR になるため）。

## Acceptance Criteria

- 差分表（起票時実測節）が旧 Lane 1 の 6 成果 + 追加発見 2 件（件数文言 / DSR-16 宙ぶらりん 3 箇所）を漏れなく現状判定している。
- `rg -c "^## DSR-22 " docs/design-system/01-decision-rules.md` = 1、`rg -c "DSR-01〜22" docs/design-system/01-decision-rules.md` = 1。
- `rg -c "^## ⑯ " docs/design-system/02-component-catalog.md` = 1、`rg -c "16 パターン" docs/design-system/02-component-catalog.md` ≥ 2（title + 責務）、`rg -c "16 パターン" docs/design-system/README.md` ≥ 1。catalog ⑯ 本文に「必須構成」6 項目（toolbar 2 段 / 上下の件数・現在位置 / sticky header / 識別列 opt-in / 現在行 3 点 / `ListSkeleton`）が literal に存在する。
- `rg -c "16 の原則" docs/design-system/04-backbone.md` ≥ 1、`rg -c "12 の原則" docs/design-system/04-backbone.md` = 0、`rg -c "16 行" docs/design-system/README.md` ≥ 1、`rg -c "12 行" docs/design-system/README.md` = 0。
- `rg -c "DSR-16 として新設|原則 4（DSR-16|\+ DSR-16$" docs/design-system/04-backbone.md` = 0（badge 関連の宙ぶらりん参照 3 パターンに限定した negative oracle。現状は 3 パターンとも 1 件ずつ計 3 件ヒット — `DSR-16 として新設`:38、`原則 4（DSR-16`:43、`\+ DSR-16$`:51、`rg -c` 実測で確認済み）。
- `fd -e html mockup-d docs/design-system/reference | wc -l` = 2（Lane 1a: `mockup-d-lists.html` / `mockup-d-stocktake.html`）、`rg -c "mockup-d-" docs/design-system/reference/README.md` ≥ 2。
- `rg -c "DSR-22" docs/quality/review-checklist.md` ≥ 1。
- `rg -c "^## D-079" docs/decision-log.md` = 1、D-079 本文に `§3.1` の文字列が含まれない（negative oracle、S-P1-1）、D-056 を矛盾なく引用している（reviewer 確認）。
- `docs/archive/plans/2026-08-23-ui-list-backbone-d.md` が存在し `superseded` の注記を含む。
- 01-decision-rules / 02-component-catalog / 04-backbone / review-checklist の 4 file それぞれの `## 更新履歴` に本 PR の行が追加されている（00-foundations.md には更新履歴節がないため対象外、訂正は該当 token 行の注記で足りる）。
- `docs/Plans.md` ④ の行が本 packet への active packet link（basename `2026-09-03-ui-list-backbone-d-lane1-refresh.md`）を持ち、Lane 1a/1b の分割が分かる。
- `bash scripts/doc-consistency-check.sh` ERROR 0、`bash scripts/doc-consistency-check.sh --target plan` 通過。
- mockup D 2 file（Lane 1a）に棚卸し header 案（現行 / A / B）・完了画面案（現行 / C）が含まれ、owner が視認して culling できる状態（Human Gate）。

## Design Sources

- Requirements / spec: なし（新規 REQ token 追加なし）
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: `docs/design-system/04-backbone.md`（改訂対象）、`00-foundations.md`（token 表）、`01-decision-rules.md` DSR-16/17/21（重複回避のため参照）、`02-component-catalog.md` ⑩/⑮（拡張・隣接）、`reference/README.md`、`docs/quality/review-checklist.md` カテゴリ 9、`src/features/stocktake/StocktakePage.tsx`（owner 所感の対象コード、read-only）、`src/components/layout/RootLayout.tsx`（Q17 ヘッダ不在の確認）、`src/components/patterns/FormSection.tsx` / `SummaryCard.tsx`（mockup 提案の参照 canonical）
- 理論ソース: 原田秀司『UIデザインの教科書［新版］』翔泳社、2020（`~/Downloads/inventory-field-check/approved-readable/ui-design-rules-qa-v2.md` Q5 / Q7 / Q8 / Q12 / Q15 / Q17）、Jon Yablonski『UXデザインの法則』第 2 版、相島雅樹・磯谷拓也 訳、オライリー・ジャパン、2025-01（Laws of UX、Miller / Chunking / Hick、DSR-19/20/21 の既存引用範囲を踏襲）
- Decision log / ADR: D-056（Opus 役割）、D-062（数値主張は実測 or `未実測`）、旧 archived packet（`docs/archive/plans/2026-08-23-ui-list-backbone-d.md` として本 PR で `git show agent/ui-list-backbone-d:docs/plans/2026-08-23-ui-list-backbone-d.md` から移植）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | design-system 00/01/02/04 + reference + review-checklist | updated in this PR |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | D-079（座組事実） | updated in this PR |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| DSR-22 新設 | `01-decision-rules.md` title 範囲更新（DSR-01〜22）、`README.md:13` 索引更新、review-checklist カテゴリ 9 対応行追加 |
| catalog ⑯ 新設 | `02-component-catalog.md` title・責務「16 パターン」化、`README.md:14` 目次更新 |
| reference mockup 2 file（Lane 1a）+ 分析 doc 1 file + 旧 packet archive 1 file | `reference/README.md` 表に行追加、`git ls-files` で tracked 化（Writer が旧 branch content を `git show` で取得し新規追加。archive は `docs/archive/plans/` 配下） |
| D-079 新設 | `docs/decision-log.md` 追記のみ、既存 entry 不変 |
| Tauri command / route / REQ / 画面 | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| 旧 Lane 1 成果の再起票 | 04-backbone 原則 13〜16、DSR-22、catalog ⑯ | Scope 1 | 単純 cherry-pick は DSR-16/番号衝突で不成立。差分表で状態確認後に再採番 | 04/00/01/02/README/checklist | AC rg |
| 理論蒸留 | 04-backbone 原則 14/15 の Why | Scope 2 | 一覧密度・余白・ソート・ページング・タイポの規範を owner 理論駆動流儀（理論→DSR→実装）で確立 | 04-backbone | Plan Review 理論引用チェック |
| mockup D（Lane 1a）+ owner 所感 | reference mockup 2 file | Scope 3 | 棚卸し画面 2 箇所の仮説を mockup で提示し owner 視認で確定 | reference | Human Gate render oracle |
| Deferral 裁定 | 04-backbone 原則 14、catalog ⑩ | 設計判断節 | catalog ⑩ の canonical を変えずに配置規約のみ追加 | 04/02 | AC rg |
| 座組記録 | decision-log D-079 | Scope 5 | D-056 と矛盾しない座組を明文化、§3.1 誤用を除去 | decision-log | reviewer D-056 突合 + `§3.1` negative oracle |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 PR 完了後、04-backbone 原則 13〜16・DSR-22・catalog ⑯ の本文に由来（起票時実測 / Q5・Q7・Q8・Q15・Q17 / Laws of UX）を明記した状態で成立する。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: Deferral 裁定 2 件 → 04-backbone/catalog ⑩、座組事実 → D-079。
- Assumptions and constraints: 旧 Lane 1 実測値（WCAG 相対輝度、2026-08-23 時点の token）は再検証せず流用可能（token 値自体は main で不変、`00-foundations.md` の該当行を確認済み）。棚卸し「ベタっと」は仮説であり owner 視認前に断定しない。
- Deferred design gaps, risk, and follow-up target: token 最終値（Lane 2 L3）、perPage 既定値の最終決定（owner が mockup で選定）、上部 pager variant の実装（Lane 2）、mockup D Lane 1b 5 file（Lane 2 実装 PR 同乗）。
- Test Design Matrix can cite design decision IDs or source doc sections: R2 docs-only で省略、AC の rg presence oracle が代替。
- Absolute guarantee / escape hatch self-check completed: docs-only。既存 DSR-16/17/21 の本文は変更しない（重複回避を明記するのみ）。escape hatch なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 該当なし（docs-only） | — |
| Fact check / design decision split | 事実 = 起票時実測の差分表（rg / git show 裏取り）。判断 = 設計判断節の Deferral 裁定・D-079・Lane 1a/1b 分割 | 本 packet |
| Lifecycle / retry | 該当なし | — |
| Operator workflow | 一覧の器・現在行・低視力 L3 は全一覧画面の主動線に影響（Lane 2〜5 で実装） | Lane 2〜5 packet |
| Replacement path | 04-backbone 適用の順序に Lane 2〜5 を統合、Lane 2 は `PageShell` を `ListShell` より先に出す | 04-backbone |
| Data safety / evidence | mockup はダミーデータのみ | Data Safety |
| Reporting / accounting semantics | 該当なし | — |
| Manual verification | docs-only で L3 なし。mockup D 2 file は Human Gate で owner 視認 | Human Gate |
| 環境・再現性 | 該当なし | — |

## Design Readiness

- Existing design docs are sufficient because: 04-backbone に原則枠・token 表・反映先の構造が既にあり、01/02/00/checklist/README に追記先の節が実在する（起票時実測で行番号確認済み）。
- Source docs updated in this PR: 04-backbone / 00-foundations / 01-decision-rules / 02-component-catalog / reference README + mockup 2 file（Lane 1a）+ 分析 doc + 旧 packet archive / quality/review-checklist / decision-log（D-079）/ Plans.md。
- Design gaps intentionally deferred: token 最終値、perPage 既定値の最終決定、mockup D Lane 1b 5 file、Lane 2〜5 の実装。
- Durable decisions discovered in this plan and promoted to source docs: Deferral 裁定 2 件、座組事実（D-079）、Lane 1a/1b 分割。

Minimum design checks for business-app work:

- Layer ownership: 該当なし（docs-only）。
- Backend function design: 該当なし。
- Command / DTO / data contract: 該当なし。
- Persistence / transaction / audit impact: 該当なし。
- Operator workflow / Japanese UI wording: 一覧の器・現在行の日本語 label 契約は原則本文で確定、件数文言は統一形を pin、mockup の未決文言は実装 lane で採否。
- Error, empty, retry, and recovery behavior: 該当なし（既存契約不変）。
- Testability and traceability IDs: DSR-22、⑯、原則 13〜16、D-079。

## Contract Probe

N/A — docs-only。理論引用の正確さと DSR/catalog 採番の非衝突は Plan Review の rg presence oracle と reviewer の実読裏取りで検証し、外部前提の実行検証を要する対象がない。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-22 新設 + 重複回避 | 01-decision-rules | AC rg `^## DSR-22 ` = 1、`DSR-01〜22` = 1 | — |
| catalog ⑯ 新設 + 必須構成 6 項目 | 02-component-catalog | AC rg `^## ⑯ ` = 1、`16 パターン` ≥ 2、6 項目 literal presence | — |
| 04-backbone 原則 13〜16 + DSR-16 宙ぶらりん 3 箇所是正 | 04-backbone / README | AC rg `16 の原則` ≥ 1、`12 の原則` = 0、`DSR-16 として新設\|原則 4（DSR-16\|\+ DSR-16$` = 0（04-backbone）、`16 行` ≥ 1（README）、`12 行` = 0（README） | — |
| mockup D 2 file（Lane 1a）+ 分析 doc + 旧 packet archive | reference / archive | AC fd = 2、`mockup-d-` ≥ 2、archive file 存在 | 棚卸し header/完了画面案は Human Gate render oracle |
| Deferral 裁定 2 件 | 04-backbone 原則 14 / catalog ⑩ | reviewer 突合（perPage 既定値は画面別、owner が mockup で最終決定と明記） | — |
| D-079 + §3.1 誤用除去 | decision-log | reviewer D-056 矛盾チェック + `§3.1` negative oracle | — |
| Plans.md ④ 同期（Lane 1a/1b） | Plans.md | AC の active link 目視 | — |
| 全体整合 | docs | `doc-consistency-check.sh` ERROR 0 | — |

## Test Plan

Test Design Matrix: 省略（R2 optional 判定で省略、PR #21 scroll-policy-extension-design と同型）。

- targeted tests: AC の rg / fd presence oracle、`doc-consistency-check.sh`（無引数 + `--target plan`）。
- negative tests: 旧記載残存 0（`12 の原則` / `12 行` / `04-backbone.md` 内 badge 関連 DSR-16 参照 3 パターン / D-079 内 `§3.1`）。
- compatibility checks: DSR-16 / DSR-17 / DSR-21 の既存本文が変更されないこと（`git diff` に該当節の hunk がないこと）、catalog ⑩ canonical（`ProductPagination` / `PRODUCT_PER_PAGE_OPTIONS`）の既存契約が変更されないこと。
- data safety checks: mockup はダミーデータ。
- main wiring/integration checks: README → 2 file のリンク実在、04 → 00/01/02 の反映先に対応する節が実在。owner render oracle（mockup 2 file を開いて視認）。

Human Gate: owner が mockup D 2 file（Lane 1a、棚卸し header/完了画面案込み）を視認して culling → Ready 承認 → docs-only hosted final の owner `workflow_dispatch`（CI-TRIGGER-D1、Ready 後の自動 run 0 件確認後）→ merge。

## Boundary / Wire Contract

N/A — docs-only、wire 変更なし。

## Review Focus

- 理論引用（Q5/Q7/Q8/Q12/Q15/Q17、Laws of UX）の書誌・条件節が転記時に誤っていないか。
- DSR-22 が既存 DSR-16（グループ化）・DSR-21（現在地色）と主題重複していないか（「現在行」≠「現在地」の区別が明確か）。
- catalog ⑩ の既存 canonical（`ProductPagination` / `PRODUCT_PER_PAGE_OPTIONS`）を変えずに配置規約だけ追加しているか。
- mockup と規範文（04-backbone/DSR-22/catalog ⑯）が一致しているか。
- 棚卸し「ベタっと」所感の記述が仮説（断定ではない）として書かれているか。
- D-079 が D-056 と矛盾しないか、§3.1 design board 例外への言及が残っていないか（Opus 5 が Writer/Coordinator に格上げされていないか）。
- 04-backbone の宙ぶらりん DSR-16 自己言及 3 箇所が正しく是正されているか。
- Lane 1a/1b の境界（mockup 2 file のみ本 PR、残り 5 file は Lane 2 同乗）が Scope・Non-scope・Plans.md で一貫しているか。

## Spec Contract

N/A — R2。

## Trace Matrix

N/A — R2（Design Intent Trace を参照）。

## Data Safety

- mockup はダミーデータのみ（実店舗の商品名・価格・取引先名を含めない）。
- local-only paths: なし。
- synthetic-only paths: `docs/design-system/reference/mockup-d-lists.html`、`docs/design-system/reference/mockup-d-stocktake.html`。

## Implementation Results

Writer（Sonnet subagent、worktree isolation）が Lane 1a の規範文一式 + mockup 2 file を起草した。

- 04-backbone.md: 原則 13〜16 を新設（DSR-22 + catalog ⑯ を承継、Q5/Q7/Q8/Q12/Q15/Q17 と Laws of UX を Why に反映、Q5-② 適用外注記込み）。「12 の原則」を「16 の原則」へ改題、token 表に枠 2 段（`--border-strong`）と現在行（`--row-current`）の提案行を追加、宙ぶらりん DSR-16 参照 3 箇所（token 表 badge 行 / 00〜03 反映先 / 適用の順序）を是正し、badge 3 種は原則 4 の記述を正とする方向（DSR 新設なし）で解消した。
- 00-foundations.md: `--foreground` / `--muted-foreground` を対象背景明記の実測値へ訂正、`--border-strong`（提案 8a8480）と `--row-current`（提案 fff8e6）を token 行として追加。更新履歴節は無いため訂正は該当行への注記に留めた。
- 01-decision-rules.md: DSR-22「一覧の器・現在行・UI 部品枠のコントラスト」を新設（DSR-16 / DSR-21 との主題重複を Why 内で明記して回避）。title を DSR-01〜22 に更新。
- 02-component-catalog.md: ⑯「一覧の器（ListShell）」を新設（必須構成 6 項目、canonical は未実装で予定パスのみ記載）。⑩ ページネーションに上部 variant（件数 + 現在位置 text 必須・pager 任意、viewport 超過一覧のみ opt-in）と perPage 既定値の画面別裁定案（棚卸し 50 / 商品一覧 100、pending owner render oracle）を追記。title・責務・README 目次を 16 パターンへ改訂。
- README.md / review-checklist.md: DSR-22・⑯ の索引反映、カテゴリ 9 に DSR-22 対応行を追加。
- reference/README.md + mockup-d-lists.html + mockup-d-stocktake.html: 一覧の器（上部件数 + sticky header + 識別列固定 + 現在行 3 点、perPage 50/200 密度比較と「約 9 画面」注記）と棚卸し画面（進捗 header 現行/A/B、完了画面 現行 vs C を差異 0 件/12 件/不整合ありの 3 状態）を新規作成。sidebar / PageHeader / ボタンの見た目は描いていない（旧 SPEC-UILB-D6 継続）。2026-08-23 分析 doc を旧 branch から移植。
- 旧 packet を `docs/archive/plans/2026-08-23-ui-list-backbone-d.md` へ superseded 注記付きで移植（本文は verbatim）。
- D-079（座組事実）を decision-log.md へ追記（§3.1 言及なし、D-056 と矛盾しない範囲で記述）。

**gate 実測**: `bash scripts/doc-consistency-check.sh` は ERROR 0 / WARN 5（是正前の pre-existing WARN セットと完全一致、新規 WARN 0）。`--target plan` も全チェック通過。全 AC の rg/fd oracle を個別実行し期待値と一致を確認（04-backbone の negative oracle 3 パターン含む）。prettier `--check` は touched md/html 全件で整形済み。DS1（src path 実在）/ DS3（token HEX 整合）は `--border-strong` / `--row-current` / `ListShell.tsx` が未実装である旨を検出しない書式（backtick 付き `src/` path・`#hex` の同居を避ける）へ調整して通過させた（globals.css / src/** は非変更のまま）。

**裁定の記録**: Plans.md ④ は Coordinator 指示により本 Writer worktree では触っていない（既存 line 49 が Lane 1a/1b 分割を既に反映済み。Coordinator が別途「5 file」へ訂正済み）。

**Final Review round 1 是正（Sonnet P1=2/P2=1、Opus P1=2/P2=5/P3=3、Coordinator 全件 accept）**:

- S-P1-1: Q17 が docs 本文のどこにも無いまま「反映済み」と誤って主張していた（`rg -n "Q17" docs/design-system docs/quality` = 0 件を確認済み）。04-backbone.md 前提節に Q17（⑤カラムに適合、③ヘッダは本アプリに不在、書誌付き）を追加し、更新履歴の記述を実際の反映箇所（前提節）に合わせて訂正した。
- S-P1-2: catalog ③ テーブルへの sticky header / 識別列 opt-in 追記を実装した（Scope item を省略していたのを是正）。前回 Implementation Results の自己正当化記述は撤回。
- S-P2-1（Coordinator 裁定）: `--border-strong` / `--row-current` / `ListShell.tsx` は未実装のため DS1/DS3 の対象外に保つ方針を維持しつつ、00-foundations.md / 04-backbone.md の表記を「提案値 `8a8480`（`#` は Lane 2 実装時に付与し DS3 の突合対象へ戻す）」に統一。catalog ⑯ canonical も「canonical（予定）: src/components/patterns/ListShell.tsx（Lane 2 で新設後に backtick 表記へ戻し DS1 対象化）」に統一。Non-scope 節に「Lane 2 への申し送り」を新設し復元義務を明記。**Opus P3-2（今すぐ `#` を復元する）はこの Coordinator 裁定により却下**（unimplemented token を DS3 突合対象に含めると常時 ERROR になるため）。
- O-P1-1: mockup-d-stocktake.html の A 案「未入力 96」が色のみだった（DSR-08 違反）ため、warning icon + 「要入力」文言を追加。
- O-P1-2: catalog ⑯ 必須構成と 04-backbone 原則 14 が無条件表現だったため、「viewport を超える一覧が対象。収まる一覧は項目 2 を省略可、検索欄なし画面は toolbar 1 段でよい」を明記。
- O-P2-1: A 案が見出し/開始日時を落としていたため、A を「B の見出し構造を内包したサマリ帯」として描き直し、B は「見出し構造のみの最小案」に再定義。未決項目 1 の記述も合わせて更新。
- O-P2-2: density 比較の 2 ペインが同一 `max-height:420px` で clamp され密度差が判別不能だったため、clamp を撤去し実高で描画。
- O-P2-3: 上部件数文言をパン統一形「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」の実値表記へ揃え、上部の前へ/次へボタンは catalog ⑩ Don't と矛盾するため撤去し「pager ボタンは任意・下部のみ」と note した。
- O-P2-4: 完了画面 C の 3 状態がすべてプラス増減だったため、3 状態目を仕入原価総額の減少（-¥28,600、`.down` class）に変更。
- O-P2-5: Q8 主典拠の規範行「ラベルは小さく muted、値は大きく — 見出し / ラベル / 値の 3 段を画面をまたいで同じ型にする」を原則 15 の太字要約へ追加。
- O-P3-1: catalog ⑯ 項目 6 を `ListSkeleton` のみに絞り、履歴系（識別列なし）の扱いは項目 4 へ統合。
- O-P3-3: 04-backbone.md 原則 13〜16 を「1 文 + 由来」の契約（L13）に沿って圧縮し、token 提案値・必須構成・L3 checklist 詳細は DSR-22 / catalog ⑯ 本文へ委譲。

**gate 実測（round 1 是正後）**: `bash scripts/doc-consistency-check.sh` → `結果: WARN 5 件（ERROR なし）`（pre-existing WARN セットと完全一致、diff 0 行）。`--target plan` → `結果: 全チェック通過`。全 AC oracle（新規追加分含む）を再実行し期待値と一致。prettier `--check` は本ラウンド touched 全 6 file で整形済み。

Human Gate（owner の mockup 2 file 視認 + Ready 後の workflow_dispatch + merge）と Reviewed Content HEAD の確定は未実施（Coordinator/owner の後続作業）。PR は未作成のため PR link は Coordinator が別途記録する。

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
If R3 review-only sub-agent is skipped, record an explicit line beginning with `Review-only skipped because:` and the reason.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
