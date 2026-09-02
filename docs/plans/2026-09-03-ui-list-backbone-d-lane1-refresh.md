# Plan Packet: UI 一覧の背骨 D — Lane 1 refresh（現状同期 + 理論蒸留 + mockup D 更新、docs-only）

旧 branch `agent/ui-list-backbone-d`（tip `20c4600`、2026-08-23、Draft PR #2 @ inventory-system-desktop、main から 163 commit 遅れ）の Lane 1（docs-only 規範化）を、2026-09-03 HEAD `654f95d` を起点に superseding するリブート packet。旧 Lane 1 の成果は全て branch 上のみで main に一切反映されておらず（本 packet「起票時実測」節参照）、DSR / catalog 採番は既に別内容へ消費済みのため単純 cherry-pick は不成立。本 packet は差分の棚卸し + 理論蒸留 + owner 新規所感（棚卸し画面）を統合し、実際の規範文は Writer が起票する。

## Workflow State

- Phase: plan-gate
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（design docs + mockup HTML、worktree isolation）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Opus 5 デザイン面レビュー（発注書駆動・read-only・§5.4 低制約 profile、D-056 準拠）+ Fable 裁定
- Final Reviewer: Codex（GPT-5.6、ロジック・整合面、PR review 1 回 = relay 1/2）+ Opus 5 デザイン面レビュー（read-only）+ Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner が mockup D HTML 6 file（棚卸し header 案・完了画面案を含む）を開いて視認（render oracle）+ docs-only hosted final の owner `workflow_dispatch`（Ready 後、CI-TRIGGER-D1）+ merge
- Design Board Exception: AGENT_OPERATING_MANUAL §3.1 適用（design-only change。owner 明示指示 2026-09-03「UI 視覚系は Claude が触る方が良い結果」により、design docs + mockup HTML の Writer を Codex ではなく Claude Sonnet 5 subagent に割り当てる。Plan Reviewer 一次と Final Reviewer は Writer とは別主体〈独立 fresh context の Sonnet / Codex〉が担い、§2 自己承認禁止を維持する。実装 code〈Lane 2〜5〉の Writer には割り当てない。Opus 5 のデザイン面レビューは D-056 の read-only claims-producer 役割の範囲内であり、本例外の対象〈Writer / Coordinator〉ではない）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者可視に何が完了するか1文`。
介入 1 回目は起票選定（2026-09-03 会話、座組承認 + owner 所感 2 件の提示）で消費済み。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（`docs/design-system/**` + `docs/design-system/reference/**` の HTML mockup + `docs/Plans.md` + `docs/decision-log.md` + `docs/quality/review-checklist.md`）。runtime code・DB・CSV・DTO・route・operator workflow の変更なし。後続の実装 lane（Lane 2〜5）は本 PR を正本として別 packet（R3）で行う。DEV_WORKFLOW Risk Level の R2「docs change that affects maintainability but not runtime contracts」に該当し、Test Design Matrix は R2 optional 判定で省略する（PR #21 scroll-policy-extension-design と同型）。

## Goal

Goal Invariant: 旧 Lane 1（`agent/ui-list-backbone-d` branch 資産、2026-08-23）の各成果を 2026-09-03 の main 状態と突合し、既に別内容へ消費された採番（DSR-16 / catalog 番号）を避けて再採番し、`ui-design-rules-qa-v2.md` の関連 Q（一覧設計・色使い・ページング・UI パーツ）を書誌付きで 04-backbone へ流し込み、mockup D 6 file を現状同期 + owner 新規所感（棚卸し画面 header の平板さ・完了画面）を含めて更新し、ページ送り上下配置と perPage 刻みの deferral 2 件を裁定して、後続 Lane 2〜5 が本 PR の source docs だけで着手できる状態にする。

### 最小完了条件

- 差分表が旧 Lane 1 の全成果（原則 13〜16 / 00 枠コントラスト訂正 / DSR「一覧の器」/ catalog ⑯ / reference README + mockup D / review-checklist カテゴリ 9）を現状（2026-09-03 main）と 1 行ずつ突合し、各項目の状態（未反映 / 部分反映 / 別内容へ採番消費）を確定する。
- DSR-22（一覧の器・現在行・UI 部品枠のコントラスト）と catalog ⑯（一覧の器 ListShell）が旧 Lane 1 の DSR-16 提案内容を承継しつつ新番号で規範化され、既存 DSR-16（同型情報のグループ化）・DSR-21（現在地色）と主題が重複しない。
- 04-backbone 原則 13〜16 に `ui-design-rules-qa-v2.md` Q5 / Q7 / Q15 / Q17 の該当原則が書誌（原田秀司『UIデザインの教科書［新版］』翔泳社 2020）付きで反映され、Laws of UX（Miller / Chunking / Hick、Jon Yablonski 著、相島雅樹・磯谷拓也 訳、オライリー・ジャパン、2025-01）が一覧背骨の Why に引用される。
- mockup D 6 file が現状同期・理論反映済みで、棚卸し画面の進捗 header 案と完了画面案が新規に含まれ、owner が視認できる状態にある。
- ページ送り上下配置（採用）と perPage 刻み（共有定数維持・値は owner 選定）の裁定案が 04-backbone / catalog ⑩ の改訂方針として記録される。
- D-079 が座組事実（Sonnet Writer / Opus デザインレビュー専任 / Codex ロジックレビュー 1 回 / Fable 指揮）を記録し、D-056 と矛盾しない。
- `docs/Plans.md` ④ が本 packet への active link に更新される。

### 失敗定義

- 差分表を作らず旧 Lane 1 の規範文をそのまま転記し、DSR-16 / catalog 番号衝突のまま Plan Gate へ出す。
- 理論引用の書誌・条件節が転記時に誤る、または理論の適用条件（例外）を無視して断定する。
- owner 所感（棚卸し header の「ベタっと」）を断定の欠陥認定として書き、owner 視認前に是正方針を確定する。
- D-079 が D-056（Opus = read-only claims-producer 専任、Writer/Coordinator 不可）と矛盾する記述を含む。

### 非目的

- `src/**` の実装（Lane 2〜5、後続 R3 packet）。
- Tauri / DB / 生成物の変更。
- 04-backbone 原則 1〜12 の改訂（batch 1〜4、Lane 2〜5 の Required Design Artifacts）。
- 旧 branch `agent/ui-list-backbone-d` の rebase（superseded、旧 Draft PR #2 は本 packet の PR merge 後に Coordinator が close する）。
- token 最終値の確定（提案値 + 実測を置き、アプリ内の見え方は Lane 2 の L3 で確定 — 旧 SPEC-UILB-D7 の方針を承継）。
- Fable 自身による画面実装着手（owner 保留、token 予算）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-03、HEAD 654f95d から分岐）

旧 Lane 1 packet（`git show agent/ui-list-backbone-d:docs/plans/2026-08-23-ui-list-backbone-d.md`、plan-first commit `eca3d26`）と分析 doc（`git show agent/ui-list-backbone-d:docs/design-system/reference/2026-08-23-current-design-analysis.md`）、および現行 main（`654f95d`）の実読突合。

| # | 旧 Lane 1 成果（2026-08-23、branch 上のみ） | 2026-09-03 main の現状 | 判定 |
|---|---|---|---|
| 1 | `04-backbone.md` 原則 13〜16 新設（枠 2 段 token / 一覧の器 / 現在行 3 点 / 低視力 L3） | 未反映。`04-backbone.md:11` は依然「## 12 の原則」、`README.md:16` も「12 行の『まず守る骨』」のまま。token 表の badge 行は今も `04-backbone.md` に「DSR-16 として新設」の宙ぶらりん参照が残る（後述 #7） | **未反映（0 件）** — 本 packet で再起票 |
| 2 | `00-foundations.md` `--border` 根拠訂正「4.5:1 境界可視性」→ 実測 1.20:1 | **反映済み**。`00-foundations.md:17` は `対 --background 実測比 ≈1.20:1（補助的な区切り。単独のグループ信号にしない、DSR-16）`（PR #15、2026-08-29、Plans.md L43「--border 4.5:1 誤記→実測 1.20:1 修正含む」）。ただし引用先の DSR-16 は旧 Lane 1 提案の「枠コントラスト」ではなく PR #15 で新設された別内容「同型情報のグループ化と囲みの階層」（`01-decision-rules.md:267`）— 意味的にはグループ信号としての枠の話でもあるため偶然整合しているが、旧 Lane 1 が意図した「操作枠 3:1」の 2 段 token（`--border-strong`）は未着手 | **部分反映**（border 根拠は是正済み、2 段 token は未着手） |
| 3 | `--muted-foreground` 行「4.5:1（AA）」を card 上 4.40:1（AA 未達）で訂正、`--foreground` 行を実測 16.7:1 へ訂正 | 未反映。`00-foundations.md:15` は今も「コントラスト比12.6:1（AAA+）」、`:18` は今も「コントラスト比 4.5:1（AA）」の generic 表記 | **未反映** |
| 4 | DSR-16「一覧の器・現在行・UI 部品枠のコントラスト」新設 | 番号が別内容へ消費済み。DSR-16 は 2026-08-29 PR #15 gated amendment 3 で「同型情報のグループ化と囲みの階層」として新設（`01-decision-rules.md:267-284`）。DSR-17〜21 も新設済み（scroll 3+1 分類 / 戻り導線 / feedback / destructive dialog / 現在地色）。次の空き番号は DSR-22（`01-decision-rules.md:415` が DSR-21 で最後） | **番号衝突・再採番必須** — DSR-22 |
| 5 | catalog ⑯「一覧の器（ListShell）」新設 | 未反映。catalog は ⑮「商品追加欄 live 候補プレビュー」（`02-component-catalog.md:845`）が最後で ⑯ は存在しない。⑩ ページネーションは canonical `ProductPagination` + `PRODUCT_PER_PAGE_OPTIONS = [50,100,200]` として既に正本化されており（`02-component-catalog.md:599-651`）、PR #30（2026-09-03）で棚卸し一覧が同 canonical を再利用済み（Plans.md L17） | **未反映** — ⑯ は本 packet で新設 |
| 6 | reference README + mockup D 6 file 追加 | 未反映。`fd -e html mockup-d docs/design-system/reference` = 0 件、`reference/README.md` は mockup-c-* 3 file のみ列挙。mockup D は旧 branch 上に存在するのみ（`git show agent/ui-list-backbone-d --stat` で 6 file 確認済み） | **未反映（0 件）** |
| 7 | review-checklist カテゴリ 9 に非テキスト枠 3:1 / 一覧の器 / 現在行 3 点 / 低視力 L3 の 4 項目追加 | 未反映。現行カテゴリ 9（`review-checklist.md:68-85`）は DSR-01/08/13/11/12/02/21/07/10/16/17/18/19/20 の 14 項目に対応済みだが、旧 Lane 1 提案の 4 項目は含まれない | **未反映** |
| （追加発見） | — | `04-backbone.md` 反映先節・token 表内に「原則 4（DSR-16 新設）」「DSR-16 として新設」の自己言及が 2 箇所残存し、実際の DSR-16（グループ化）と無関係な badge 3 種の話を指す誤ったポインタになっている（`04-backbone.md` 「foundations への追記分」表と「00〜03 への反映先」節） | **新規 drift（旧 Lane 1 起票時点では正しかったが、その後の DSR-16 占有で陳腐化）** — 本 packet の Scope 1 で是正 |

**未実装の裏取り**（Scope 1 の前提が今も成立することの確認）: `rg -n "PageShell" src` = 0 件、`rg -c "text-sm" src/features --glob '!*.test.*'` 合計 204（旧 Lane 1 実測 193 から微増、大勢は不変）。04-backbone 原則 1〜12 の履行状況（table 16px 化・PageShell 等）は旧 Lane 1 起票時からほぼ変わっていない。

## 設計判断

### 座組（Scope 5 の前提、D-079 で記録）

Coordinator = Fable（指揮）/ Writer = Claude Sonnet 5 subagent（design docs + mockup、owner 明示指示による §3.1 design board 例外）/ Plan Reviewer = Sonnet 独立 + Opus 5 デザイン面（D-056 の read-only claims-producer 範囲、低制約 profile）+ Fable 裁定 / Final Reviewer = Codex（ロジック・整合面、PR review 1 回）+ Opus 5 デザイン面 + Fable 裁定 / Human Gate = owner render oracle + Ready の owner `workflow_dispatch` + merge。Opus 5 は D-056 のとおり Writer・Coordinator・state 遷移管理を持たない。

### Deferral 裁定案（Plans.md ④ sub-bullet、PR #30 起票時実測起源の 2 件）

- **ページ送りの上下両配置**: 採用。対象は「table の行数が viewport を超える一覧画面」に限定し、全一覧へ無条件適用しない（旧 SPEC-UILB-D2 の判定と同型。1 画面に収まる短い一覧では下だけで足りる）。catalog ⑩ の canonical `ProductPagination` に上部 variant（件数 + pager、sticky header との併用）を追加する方針とし、既存呼び出し側（商品一覧等）は画面ごとに opt-in する。
- **perPage 選択肢の刻み**: 共有定数 `PRODUCT_PER_PAGE_OPTIONS`（またはそれに準ずる catalog ⑩ 正本の共有定数）を維持し、値そのものは owner が mockup D を見て選ぶ。40 刻み案（40/80/120 等）は一案として mockup に反映するが、本 packet では値を確定しない（Lane 2 の Required Design Artifacts に確定を委ねる、旧 SPEC-UILB-D7 と同じ「token/定数値は実装 lane で確定」の方針を踏襲）。

## D-079 verbatim 案

`docs/decision-log.md` へ追記する entry 案（D-078 の shape に合わせる。既存文言は変更しない、追記のみ）。

```
## D-079: UI 視覚系 change の座組（Sonnet Writer / Opus デザインレビュー専任 / Codex ロジックレビュー 1 回 / Fable 指揮）（2026-09-03）

- Decision: UI 一覧の背骨 D — Lane 1 refresh から、design-only（AGENT_OPERATING_MANUAL §3.1 design board 例外の対象）な UI 視覚系 change の座組を次のとおり owner 承認事実として記録する。Coordinator = Fable（指揮）、Writer = Claude Sonnet 5 subagent（design docs / mockup HTML、worktree isolation）、Plan Reviewer = Sonnet 独立 fresh context 一次 + Opus 5 のデザイン面レビュー（D-056 の read-only claims-producer 範囲、§5.4 低制約 profile）+ Fable 裁定、Final Reviewer = Codex（ロジック・整合面、PR review 1 回）+ Opus 5 デザイン面 + Fable 裁定。Opus 5 は D-056 のとおり Writer・Coordinator・state 遷移管理には割り当てない。
- Status: accepted（owner 承認 2026-09-03）
- Why: owner 所感「UI 視覚系は Claude が触る方が良い結果」（2026-09-03）により、通常は Codex が担う design docs Writer 役を §3.1 design board 例外の範囲で Claude Sonnet 5 subagent に割り当てる。一方、Opus 5 は D-056 で Writer / Coordinator を明示的に除外された read-only claims-producer 専任 slot であり、デザイン面の検出力を使う場合も Plan/Final Reviewer の一構成要素（read-only、発注書駆動）に留める必要がある。両者を混同すると D-056 の rollback 条件（process 契約を内面化させない）に抵触するため、座組を明文化して切り分ける。
- Impact: 以後の UI 視覚系 design-only change は本 entry を座組の先例として引用できる。§2 の自己承認禁止（Writer と Plan/Final Reviewer の分離）は本座組でも独立 fresh context の Sonnet／Codex が担うことで維持する。実装 code（Lane 2〜5 等の R3）の Writer 割当ては本 entry の対象外で、既存分業（Codex 発注 or Sonnet subagent、change ごとに判断）のまま。
- Alternatives considered: Opus 5 を Writer に格上げする案（D-056 の rollback 条件・§3.1 design board 例外の主語〈希少・最高能力 slot〉との整合は取れるが、D-056 accepted 時点の「read-only claims-producer 専任」を change ごとの owner 裁定なしに拡張することになり、既定の分業実績を崩すため今回は不採用。Opus 5 デザイン面「レビュー」に留める）; Codex を Writer のまま維持する案（owner 所感と矛盾するため不採用）。
- Revisit: Opus 5 の役割拡張が複数 change で反復要請される場合、または D-056 の rollback 条件に抵触する運用が観測された場合。
```

## Scope

1. **現状同期**（Scope 1）: 「起票時実測」節の差分表を根拠に、以下の改訂方針を Writer が起草する。
   - `04-backbone.md`: 「12 の原則」を「16 の原則」へ改題し、原則 13〜16（骨子は下記「設計判断」外の各節参照）を追記。「foundations への追記分（token）」表と「00〜03 への反映先」節の宙ぶらりん `DSR-16` 自己言及 2 箇所（badge 3 種）を、実際の DSR-16（グループ化）と無関係であることを明記した上で是正する（DSR-22 への付け替えではなく、badge 3 種は既存原則 4 の記述で足りるため DSR 参照自体を削除する方向。最終判断は Writer 起草 + Plan Review）。`README.md:16` の「12 行」を「16 行」へ。
   - `00-foundations.md`: `--border` 行（`:17`）は現行の是正済み文言を維持しつつ、新設 `--border-strong`（操作枠 3:1）と `--row-current`（現在行背景）token を追加。`--muted-foreground`（`:18`）と `--foreground`（`:15`）の比を実測値（card 上 4.40:1 AA 未達 / 16.7:1・16.0:1）へ訂正。
   - `01-decision-rules.md`: DSR-22「一覧の器・現在行・UI 部品枠のコントラスト」を DSR-21（`:415-424`）の後・更新履歴（`:427`）の手前に新設。title を「DSR-01〜22」に更新。本文は DSR-16（グループ化、同型情報の表示形式）・DSR-21（現在地色、ナビゲーションの active）と主題が重複しないことを明記した上で書く（DSR-22 は「枠の可視性」「現在行＝編集中/選択中の行」「一覧の器の構造」に限定する）。
   - `02-component-catalog.md`: ⑯「一覧の器（ListShell）」を ⑮（`:845`）の後・更新履歴（`:891`）の手前に新設。title の「15 パターン」は変更不要（現行 README も 15 パターン表記のまま整合済み — ⑯ 追加で「16 パターン」へ改訂）。③ テーブルへ sticky header / 識別列固定 opt-in を追記、⑩ ページネーションへ上部 variant（Deferral 裁定「上下両配置」）と perPage 刻みの owner 選定注記を追記。
   - `reference/README.md`: mockup D 6 file の行を追加（旧 6 file 名を踏襲: `mockup-d-lists.html` / `mockup-d-forms-a.html` / `mockup-d-forms-b.html` / `mockup-d-import-export.html` / `mockup-d-history.html` / `mockup-d-home-sales-admin.html`）。旧 gated amendment 1 の `2026-08-23-current-design-analysis.md` も分析資料として同時に移植し 1 行追加する。
   - `review-checklist.md`: カテゴリ 9 に DSR-22 対応行を追加（枠 3:1 / 一覧の器 / 現在行 3 点 / 低視力 L3 の 4 観点を DSR-16/17 と同様 1〜2 行に集約）。
2. **理論蒸留**（Scope 2）: `ui-design-rules-qa-v2.md` の該当 Q を 04-backbone 原則へ書誌付きで流し込む。
   - Q5 原則①（並べ替え時の基準列明示）: 現行のどの一覧にも明示規約がない新規要素。原則 14（一覧の器）へ「ソート機能を持つ一覧は基準列を明示する」を追加する方針（実装対象の有無は Writer が `rg` で確認）。
   - Q5 原則②（3 大操作の左配置）・Q5 原則③（余白グルーピング）・Q5 原則④（見切れによるスクロール示唆）: 原則 14 の Why（一覧の器の構成根拠）へ引用。
   - Q7 原則①（色数制限）: 原則 2（色は家族で）の Why を補強。
   - Q15（ページング vs 無限スクロール、現在地のコントロール感）: Deferral 裁定「上下両配置」の Why、および原則 14 の pager 記述の Why。
   - Q17（UI パーツ適用ルール、③ヘッダ / ⑤カラム）: 現行実装（sidebar 常設 + PageHeader）が既に適合していることの確認記述として 03-philosophy または 04-backbone の前提節へ 1 文。
   - Laws of UX（Miller / Chunking / Hick）: 一覧の器・現在行の Why に、情報のグルーピングと選択負荷低減の観点で引用（DSR-19/20/21 が同著を Why で引用した先例と同型の引用範囲に限定する — 契約本文の主張は本アプリの Why 節のみ、理論書の主張をそのまま規則として転記しない）。
3. **mockup D 更新**（Scope 3）: 旧 6 file を現状同期 + 理論反映で更新し、owner 所感 2 件（2026-09-03）を新規対象に追加する。
   - 「棚卸し画面の上部らへんのベタっと書いた感じ」: `StocktakeProgressHeader`（`src/features/stocktake/StocktakePage.tsx:379-411`）は h2 見出し + p 説明文 + Badge が同じ視覚 weight で縦に並ぶのみで、枠・背景差・icon による区切りがない。
   - 「棚卸し完了画面」: `StocktakeResultPage`（同 `:923-997`）は PageHeader + Card 3 枚 + FormSection 2 つが全て「見出し + プレーンテキスト」の同型反復で、状態を示す icon・色分けが一切ない（DSR-08 の icon+日本語+色 3 点が適用されていない）。
   - いずれも仮説であり owner 視認で確定する（下記「棚卸し『ベタっと』の仮説」参照）。mockup には棚卸し header 案・完了画面案の両方を含め、原則 13〜15（枠 / 一覧の器 / 現在行）を適用した代替案を描く。
4. **Deferral の裁定を 04-backbone に取り込む**（Scope 4）: 上記「設計判断」節の裁定案を 04-backbone 原則 14 と catalog ⑩ に反映する方針を Writer へ引き継ぐ。
5. **D-079 記録**（Scope 5）: 上記 verbatim 案を `docs/decision-log.md` の D-078（`:630-639`）の後に追記する。
6. **Plans.md**（Scope 6、本 packet で直接編集— 詳細は下記コミット手順参照）。
7. **Registration**（Scope 7）: `design-system/README.md` L13 の DSR 列挙に DSR-22 追加、L14 の catalog 目次を「15 パターン」→「16 パターン」+ ⑯ 追加、L16 の 04-backbone 説明を「16 行」へ、review-checklist カテゴリ 9 に DSR-22 行、01/02/04 の更新履歴行追加。`90-traceability` 再生成は不要（REQ token 追加なし、Registration/Generation Obligations 節参照）。

## Non-scope

- `src/**`、Tauri / DB（Lane 2〜5 で実装）。
- Lane 2 共有部品（`PageShell` / `ListShell` / `SearchBar` live 統一等）の実装。
- 旧 branch `agent/ui-list-backbone-d` の rebase・再利用（superseded）。
- Fable 自身による画面作成（owner 保留、token 予算）。
- 04-backbone 原則 1〜12 の改訂。
- token 最終値の確定（提案値 + 実測を置くのみ）。
- 棚卸し「ベタっと」所感の是正実装（mockup 提案のみ、実装は Lane 3〜5 の R3 packet）。

## Acceptance Criteria

- 差分表（起票時実測節）が旧 Lane 1 の 6 成果 + 追加発見 1 件を漏れなく現状判定している。
- `rg -c "^## DSR-22 " docs/design-system/01-decision-rules.md` = 1、`rg -c "DSR-01〜22" docs/design-system/01-decision-rules.md` = 1。
- `rg -c "^## ⑯ " docs/design-system/02-component-catalog.md` = 1、`rg -c "16 パターン" docs/design-system/02-component-catalog.md` ≥ 2（title + 責務）、`rg -c "16 パターン" docs/design-system/README.md` ≥ 1。
- `rg -c "16 の原則" docs/design-system/04-backbone.md` ≥ 1、`rg -c "12 の原則" docs/design-system/04-backbone.md` = 0、`rg -c "16 行" docs/design-system/README.md` ≥ 1、`rg -c "12 行" docs/design-system/README.md` = 0。
- `fd -e html mockup-d docs/design-system/reference | wc -l` = 6、`rg -c "mockup-d-" docs/design-system/reference/README.md` ≥ 6。
- `rg -c "DSR-22" docs/quality/review-checklist.md` ≥ 1。
- `rg -c "^## D-079" docs/decision-log.md` = 1、D-079 本文が D-056 を矛盾なく引用している（reviewer 確認）。
- `docs/Plans.md` ④ の行が本 packet への active packet link（basename `2026-09-03-ui-list-backbone-d-lane1-refresh.md`）を持つ。
- `bash scripts/doc-consistency-check.sh` ERROR 0、`bash scripts/doc-consistency-check.sh --target plan` 通過。
- mockup D 6 file に棚卸し header 案・完了画面案が含まれ、owner が視認して culling できる状態（Human Gate）。

## Design Sources

- Requirements / spec: なし（新規 REQ token 追加なし）
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: `docs/design-system/04-backbone.md`（改訂対象）、`00-foundations.md`（token 表）、`01-decision-rules.md` DSR-16/17/21（重複回避のため参照）、`02-component-catalog.md` ⑩/⑮（拡張・隣接）、`reference/README.md`、`docs/quality/review-checklist.md` カテゴリ 9、`src/features/stocktake/StocktakePage.tsx`（owner 所感の対象コード、read-only）
- 理論ソース: 原田秀司『UIデザインの教科書［新版］』翔泳社、2020（`~/Downloads/inventory-field-check/approved-readable/ui-design-rules-qa-v2.md` Q5 / Q7 / Q15 / Q17）、Jon Yablonski『UXデザインの法則』第 2 版、相島雅樹・磯谷拓也 訳、オライリー・ジャパン、2025-01（Laws of UX、Miller / Chunking / Hick、DSR-19/20/21 の既存引用範囲を踏襲）
- Decision log / ADR: D-056（Opus 役割）、D-062（数値主張は実測 or `未実測`）、旧 archived packet 候補（`docs/archive/plans/2026-08-23-ui-list-backbone-d.md` として本 PR で移植）

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
| DSR-22 新設 | `01-decision-rules.md` title 範囲更新（DSR-01〜22）、`README.md` L13 索引更新、review-checklist カテゴリ 9 対応行追加 |
| catalog ⑯ 新設 | `02-component-catalog.md` title・責務「16 パターン」化、`README.md` L14 目次更新 |
| reference mockup 6 file + 分析 doc 1 file | `reference/README.md` 表に行追加、`git ls-files` で tracked 化（Writer が旧 branch content を `git show` で取得し新規追加） |
| D-079 新設 | `docs/decision-log.md` 追記のみ、既存 entry 不変 |
| Tauri command / route / REQ / 画面 | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| 旧 Lane 1 成果の再起票 | 04-backbone 原則 13〜16、DSR-22、catalog ⑯ | Scope 1 | 単純 cherry-pick は DSR-16/番号衝突で不成立。差分表で状態確認後に再採番 | 04/00/01/02/README/checklist | AC rg |
| 理論蒸留 | 04-backbone 原則 14/15 の Why | Scope 2 | 一覧密度・余白・ソート・ページングの規範を owner 理論駆動流儀（理論→DSR→実装）で確立 | 04-backbone | Plan Review 理論引用チェック |
| mockup D + owner 所感 | reference mockup D 6 file | Scope 3 | 棚卸し画面 2 箇所の仮説を mockup で提示し owner 視認で確定 | reference | Human Gate render oracle |
| Deferral 裁定 | 04-backbone 原則 14、catalog ⑩ | 設計判断節 | catalog ⑩ の canonical を変えずに配置規約のみ追加 | 04/02 | AC rg |
| 座組記録 | decision-log D-079 | Scope 5 | D-056 と矛盾しない座組を明文化 | decision-log | reviewer D-056 突合 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 本 PR 完了後、04-backbone 原則 13〜16・DSR-22・catalog ⑯ の本文に由来（起票時実測 / Q5・Q7・Q15・Q17 / Laws of UX）を明記した状態で成立する。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: Deferral 裁定 2 件 → 04-backbone/catalog ⑩、座組事実 → D-079。
- Assumptions and constraints: 旧 Lane 1 実測値（WCAG 相対輝度、2026-08-23 時点の token）は再検証せず流用可能（token 値自体は main で不変、`00-foundations.md` の該当行を確認済み）。棚卸し「ベタっと」は仮説であり owner 視認前に断定しない。
- Deferred design gaps, risk, and follow-up target: token 最終値（Lane 2 L3）、perPage 刻みの具体値（owner が mockup で選定）、上部 pager variant の実装（Lane 2）。
- Test Design Matrix can cite design decision IDs or source doc sections: R2 docs-only で省略、AC の rg presence oracle が代替。
- Absolute guarantee / escape hatch self-check completed: docs-only。既存 DSR-16/17/21 の本文は変更しない（重複回避を明記するのみ）。escape hatch なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 該当なし（docs-only） | — |
| Fact check / design decision split | 事実 = 起票時実測の差分表（rg / git show 裏取り）。判断 = 設計判断節の Deferral 裁定・D-079 | 本 packet |
| Lifecycle / retry | 該当なし | — |
| Operator workflow | 一覧の器・現在行・低視力 L3 は全一覧画面の主動線に影響（Lane 2〜5 で実装） | Lane 2〜5 packet |
| Replacement path | 04-backbone 適用の順序に Lane 2〜5 を統合 | 04-backbone |
| Data safety / evidence | mockup はダミーデータのみ | Data Safety |
| Reporting / accounting semantics | 該当なし | — |
| Manual verification | docs-only で L3 なし。mockup D は Human Gate で owner 視認 | Human Gate |
| 環境・再現性 | 該当なし | — |

## Design Readiness

- Existing design docs are sufficient because: 04-backbone に原則枠・token 表・反映先の構造が既にあり、01/02/00/checklist/README に追記先の節が実在する（起票時実測で行番号確認済み）。
- Source docs updated in this PR: 04-backbone / 00-foundations / 01-decision-rules / 02-component-catalog / reference README + mockup 6 file + 分析 doc / quality/review-checklist / decision-log（D-079）/ Plans.md。
- Design gaps intentionally deferred: token 最終値、perPage 具体刻み、Lane 2〜5 の実装。
- Durable decisions discovered in this plan and promoted to source docs: Deferral 裁定 2 件、座組事実（D-079）。

Minimum design checks for business-app work:

- Layer ownership: 該当なし（docs-only）。
- Backend function design: 該当なし。
- Command / DTO / data contract: 該当なし。
- Persistence / transaction / audit impact: 該当なし。
- Operator workflow / Japanese UI wording: 一覧の器・現在行の日本語 label 契約は原則本文で確定、mockup の未決文言は実装 lane で採否。
- Error, empty, retry, and recovery behavior: 該当なし（既存契約不変）。
- Testability and traceability IDs: DSR-22、⑯、原則 13〜16、D-079。

## Contract Probe

N/A — docs-only。理論引用の正確さと DSR/catalog 採番の非衝突は Plan Review の rg presence oracle と reviewer の実読裏取りで検証し、外部前提の実行検証を要する対象がない。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-22 新設 + 重複回避 | 01-decision-rules | AC rg `^## DSR-22 ` = 1、`DSR-01〜22` = 1 | — |
| catalog ⑯ 新設 | 02-component-catalog | AC rg `^## ⑯ ` = 1、`16 パターン` ≥ 2 | — |
| 04-backbone 原則 13〜16 + 自己言及是正 | 04-backbone / README | AC rg `16 の原則` ≥ 1、`12 の原則` = 0、`16 行` ≥ 1（README）、`12 行` = 0（README） | — |
| mockup D 6 file + 分析 doc | reference | AC fd = 6、`mockup-d-` ≥ 6 | 棚卸し header/完了画面案は Human Gate render oracle |
| Deferral 裁定 2 件 | 04-backbone 原則 14 / catalog ⑩ | reviewer 突合（perPage の具体値は owner が mockup で選ぶと明記） | — |
| D-079 | decision-log | reviewer D-056 矛盾チェック | — |
| Plans.md ④ 同期 | Plans.md | AC の active link 目視 | — |
| 全体整合 | docs | `doc-consistency-check.sh` ERROR 0 | — |

## Test Plan

Test Design Matrix: 省略（R2 optional 判定で省略、PR #21 scroll-policy-extension-design と同型）。

- targeted tests: AC の rg / fd presence oracle、`doc-consistency-check.sh`（無引数 + `--target plan`）。
- negative tests: 旧記載残存 0（`12 の原則` / `12 行` / DSR-16 誤ポインタ）。
- compatibility checks: DSR-16 / DSR-17 / DSR-21 の既存本文が変更されないこと（`git diff` に該当節の hunk がないこと）、catalog ⑩ canonical（`ProductPagination` / `PRODUCT_PER_PAGE_OPTIONS`）の既存契約が変更されないこと。
- data safety checks: mockup はダミーデータ。
- main wiring/integration checks: README → 6 file のリンク実在、04 → 00/01/02 の反映先に対応する節が実在。owner render oracle（mockup 6 file を開いて視認）。

Human Gate: owner が mockup D HTML（棚卸し header/完了画面案込み）を視認して culling → Ready 承認 → docs-only hosted final の owner `workflow_dispatch`（CI-TRIGGER-D1、Ready 後の自動 run 0 件確認後）→ merge。

## Boundary / Wire Contract

N/A — docs-only、wire 変更なし。

## Review Focus

- 理論引用（Q5/Q7/Q15/Q17、Laws of UX）の書誌・条件節が転記時に誤っていないか。
- DSR-22 が既存 DSR-16（グループ化）・DSR-21（現在地色）と主題重複していないか（「現在行」≠「現在地」の区別が明確か）。
- catalog ⑩ の既存 canonical（`ProductPagination` / `PRODUCT_PER_PAGE_OPTIONS`）を変えずに配置規約だけ追加しているか。
- mockup と規範文（04-backbone/DSR-22/catalog ⑯）が一致しているか。
- 棚卸し「ベタっと」所感の記述が仮説（断定ではない）として書かれているか。
- D-079 が D-056 と矛盾しないか（Opus 5 が Writer/Coordinator に格上げされていないか）。
- 04-backbone の宙ぶらりん DSR-16 自己言及 2 箇所が正しく是正されているか。

## Spec Contract

N/A — R2。

## Trace Matrix

N/A — R2（Design Intent Trace を参照）。

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
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
