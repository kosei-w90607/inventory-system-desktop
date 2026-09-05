# Plan Packet: UI 規約補強 design batch（状態 Badge tone・CTA 中間段・検索欄 Label・Alert warning、docs-only）

Plans.md ⑦（owner 所感 2026-09-05 起票、design-first 候補提示）の (a)(b)(c)(e) を design-system canonical docs へ規範化する。owner 決定 B2（CTA 中間段）/ C1（検索欄可視 Label）を確定事項として、(a) 状態 Badge tone と (e) Alert warning は推奨案を起草し owner が design PR 上で culling する。(d) 在庫照会の 2 項目（R2-3 展開行再クリック・R2-4 検索条件追加）は Non-scope（runtime batch / 条件待ち）。本 packet自体は docs-only（design-system canonical docs は Plan Review 後に別 Writer 起草が着手する。本 commit は Plan Packet + Test Design Matrix + `docs/Plans.md` の起票のみ）。

**(a) の枠組み訂正（Coordinator 指摘、本 packet 起草中に反映）**: `04-backbone.md` 原則 2（色は 3 家族 × soft/border/strong/emphasis の 4 段）と原則 4（badge は①状態=outline+icon+soft背景／②分類=secondary pill+枠線／③強調=琥珀pillの3種だけ、DSR 新設なし）が既に badge の規範を確定している（`04-backbone.md:44` 「3 種構成は原則 4 の記述を正とする（DSR 新設なし）」）。したがって (a) は新規 DSR を起草せず、原則 2/4 の **具体化**（① 状態 badge の tone family マッピング表 → catalog ⑬、`--success-border`/`--success-strong` の token 登録 gap → 00-foundations、増減数値の色 → 既存 DSR-08 の拡張、owner 指摘の枠不整合 → badge.tsx 側の runtime gap）として起票し直した。

## Workflow State

- Phase: plan-draft
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（design docs、worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5 デザイン面（read-only claims-producer、D-056 / D-079）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5 デザイン面 + Codex ロジック・整合面 1 回（Codex 枠切れ、2026-09-07 夜の週次リセット後に実施。それまで §3.3 Capacity-degraded を適用し Codex 成分は pending、Phase は human-confirm で待機し前進させない）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required（docs-only だが Ready 後の hosted final は owner `workflow_dispatch` が必要。Ready 案内に明記する）
- Human Gate: owner が design PR 上で ①状態 badge の tone family マッピング表（owner culling 列）を culling（原文回答、Coordinator が転記し原文を正とする）。実機（Windows native L3）確認はこの packet の対象外で、後続 runtime lane が担う

補足（enum 訂正）: 発注時の指定は「Phase: plan-first」だったが、`scripts/doc-consistency-check.sh` の `WORKFLOW_STATE_PHASES` enum に `plan-first` は存在しない（有効値は `kickoff spec-check design plan-draft plan-gate plan-approved implementing local-verified independent-review human-confirm ready-hosted-final merge archive`）。本 commit は「plan-first commit」（packet を初めて起票する commit）に該当するため、Phase は enum 上の `plan-draft` を使う。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-05 回答、B2/C1 確定・(a)(e) は推奨案起草の方針、消費済み）。2 回目 = ①状態 badge の tone family マッピング表の owner culling。3 回目 = 承認 + merge（Coordinator 代行）。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（`docs/design-system/00-foundations.md` / `01-decision-rules.md` / `02-component-catalog.md` / `04-backbone.md` / `README.md` / `docs/quality/review-checklist.md` + `docs/Plans.md`）。`src/**`・DB・Tauri command・route の変更はない。canonical docs の改訂自体は既存の状態 badge・CTA button・SearchBar・Alert の見た目契約を変えるが、runtime への反映は本 packet の Non-scope（後続 runtime lane、別 packet）。DEV_WORKFLOW Risk Tiers の R2「docs change that affects maintainability but not runtime contracts」に該当し、Lane 1 refresh（`docs/archive/plans/2026-09-03-ui-list-backbone-d-lane1-refresh.md`）と同型。ただし本 packet は Coordinator 設計判断により Test Design Matrix を必須（R2 optional 判定を使わない）とする — 複数 file にまたがる文言差し替え（新文言 exact 存在 + 旧文言 0 hit）を機械的に保証する必要があるため。

## Goal

Goal Invariant:

### 最小完了条件

- `02-component-catalog.md` ⑬ ステータスバッジに、`04-backbone.md` 原則 4 の badge 3 種構成（①状態=outline+icon+soft背景 / ②分類=secondary pill+枠線 / ③強調=琥珀pill）が明記され、①状態の tone family マッピング表（owner culling 列つき）が追加される。新規 DSR は起草しない。
- `00-foundations.md` に `--success-border`（`#bbf7d0`）/ `--success-strong`（`#14532d`）が `04-backbone.md`「foundations への追記分」表の既定値どおりに register され、`--success-strong` 対 `--success-soft` の contrast が WCAG 相対輝度計算で 4.5:1 以上であることが記録される。
- `01-decision-rules.md` DSR-08 に増減数値の色規則（+ = success-strong / − = destructive-strong / 0 = muted-foreground）が既存の記号+文言併記規定への追記として反映される（新規 DSR は起草しない）。
- `01-decision-rules.md` DSR-01 に primary / secondary（中間段）/ outline の 3 段 CTA 階層が明記され、`02-component-catalog.md` ① ページヘッダの Do bullet が同期される（owner 決定 B2）。
- `02-component-catalog.md` ⑨ 検索+フィルタの live 型検索欄が「可視 Label を持たない設計」から「可視 Label 必須（既定文言『商品を検索』、画面ごとに上書き可）」へ書き換わる（owner 決定 C1）。
- `02-component-catalog.md` ⑥ 空状態・エラー・ローディングに `Alert` `warning` variant（`--warning-soft`/`--warning-border`/`--warning-strong` + `AlertTriangle`）が規範化され、適用先候補（`PriceRevisionPage.tsx:112-116`）が記録される。
- `04-backbone.md`「foundations への追記分」表の success 行・badge 行、および「00〜03 への反映先」の該当箇所に、本 packet で反映した旨の状態更新が入る（原則本文は変更しない）。
- `docs/Plans.md` ⑦ が本 packet への active link と owner 回答サマリを持つ。
- 上記いずれも `src/**` の変更を伴わない（runtime 反映は別 packet）。

### 失敗定義

- (a) を新規 DSR として起草する、または `04-backbone.md` 原則 2/4 の本文を書き換える。
- `--success-soft` / `--success`（既存 token）を新規登録として重複記載する、または `04-backbone.md` の既定値（border `#bbf7d0` / strong `#14532d`）と異なる値を 00-foundations に登録する。
- 増減数値の色規則を新規 DSR や catalog に書き、DSR-08 拡張より大きい diff にする。
- owner 決定（B2/C1）を再度未決のまま書く。
- SearchBar commit 型（現状 Label あり）の記述が誤って変更される。
- `src/**` のいずれかの file が本 commit で変更される。
- R2-3 / R2-4（在庫照会）を Non-scope から外して規範化してしまう、または R2-4 を Backlog へ誤って起票する。

### 非目的

- `badge.tsx` / `button.tsx` / `alert.tsx` / `ProductTable.tsx` / `ProductForm.tsx` / `PriceRevisionFilters.tsx` / `PriceRevisionPage.tsx` / `SearchBar.tsx` / `useStockInquiry.ts` 等の runtime 実装変更（後続 runtime lane、別 packet）。
- R2-3（在庫照会 展開行の再クリックで閉じる）・R2-4（在庫照会 検索条件追加、owner 条件待ち）。
- Windows native L3 実機確認（runtime lane）。
- Lane 4 / Lane 5（`agent/ui-list-backbone-d-lane5`）/ ⑧ native `<select>` → shadcn `Select` 置換（別 lane、進行中または起票待ち）。
- `ProductListPage.tsx:307-309` の空状態「商品を登録する」CTA の variant 変更（据え置き検討、本 packet では裁定しない）。
- `--success-border` / `--success-strong` 以外の token 新設・変更。
- `04-backbone.md` の「00〜03 への反映先」に残る他項目（DSR-01 の「0 primary 画面の昇格」/ 検索欄の単一挙動〈live+ボタン併記への統合〉/ PageHeader subtitle 基準 / ⑨ SearchBar canonical 統合 / ListSkeleton 等）。本 packet の (c) は Label 可視性のみを扱い、live/commit 統合には踏み込まない。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、worktree base `07302b5`、すべて本 packet 起草者が rg で再確認）

### (a) 状態 Badge のトーン — 04-backbone 原則 2/4 の具体化

- `04-backbone.md:20` 原則 4「badge は 3 種だけ。①状態 = outline + icon + soft 背景（在庫切れ / 在庫少 / PLU 未反映 等）②分類 = secondary pill + 枠線（隣接背景に対し 3:1、DSR-22）。icon は識別に必要な場合に限り可（廃番等、Gated Amendment 1）③強調 = 琥珀 pill（ランキング 1 位 / 最新 等）。4 種目を作らない。」/ `:44`「3 種構成は原則 4 の記述を正とする（**DSR 新設なし**）。②分類は枠線 3:1、icon は識別に必要な場合のみ可」/ `:52`「`02-component-catalog.md`: 原則 4（⑬ ステータスバッジに badge 3 種の visual 仕様）」— 反映先は catalog ⑬ であり新規 DSR ではないことが明記されている。
- `04-backbone.md:18` 原則 2「色は家族で使う。destructive（赤）/ warning（琥珀）/ success（緑）の 3 家族、各 soft・border・strong・emphasis の 4 段。」/ `:43`「foundations への追記分」表の success 行「soft `#f0fdf4` / border `#bbf7d0` / strong `#14532d` / emphasis `#16a34a` | strong・border を新設し warning / destructive と同形にする」— **`--success-border`/`--success-strong` の値（`#bbf7d0`/`#14532d`）は既に 04-backbone が確定済み**。本 packet はこれを 00-foundations.md へ反映するのみで、値の新規提案ではない（Tailwind `green-200`/`green-900` と一致することも確認済み、warning/destructive の border=200番台・strong=900番台と同じ刻み）。
- `00-foundations.md:31-42` を実測すると `--success` / `--success-soft` / `--success-emphasis` の 3 点は既に存在するが `--success-border` / `--success-strong` は未登録（`rg -n "success" docs/design-system/00-foundations.md`）。warning/destructive は 5 点フルセット（`--warning` `--warning-soft` `--warning-border` `--warning-strong` `--warning-emphasis`、destructive も同型）だが success のみ 4 段のうち 2 段が欠けている。これは 04-backbone 原則 2 の要求（3 家族とも 4 段）に対する **登録漏れ**であり、値自体は既決（上記）。
- canonical `StockStatusBadge.tsx`（catalog ⑬、`02-component-catalog.md:770-822`）は①状態 badge の正しい実装例（3 状態とも `variant="outline"` + icon + soft tone の 3 点セット、例: 在庫少 = `border-warning-border bg-warning-soft text-warning-strong` + `TriangleAlertIcon`）。ただし `通常` は semantic family でなく `border-stone-200 bg-stone-50 text-stone-600`（家族を持たない中立状態の先行実装）。
- **`ProductTable.tsx`（商品一覧）の badge 4 箇所を原則 4 の 3 種分類に当てはめて再検証**（owner R5-5 の「同一画面内の枠不整合」の実体）:
  - `:56` 「廃番」`<Badge variant="secondary">廃番</Badge>` — 廃番は原則 4 が明示する **②分類の例そのもの**（`:20` 原則 4 括弧内「廃番等」）。②分類は「secondary pill + 枠線（3:1）」が正しい形だが、`src/components/ui/badge.tsx:8` の base class は `border border-transparent`、`:13` の `secondary` variant（`bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90`）は border 色を上書きしない。**②分類の枠線要件を badge.tsx 側が満たしていない runtime gap**であり、design 側の規約（原則 4）に誤りはない。owner が見た「廃番は枠なし」は runtime 実装の未追随。
  - `:74` 「対象外」`<Badge variant="outline" className="gap-1 whitespace-nowrap">` + `CircleMinus` icon — PLU 対象外は「在庫切れ / 在庫少 / PLU 未反映」と並ぶ①状態の一種（PLU 連携の状態）。`variant="outline"` 自体は正しいが soft tone class が無い（中立状態として `border-border` のみで良いかは owner culling 対象）。
  - `:79` 「未反映」`<Badge variant="secondary" className="gap-1 whitespace-nowrap">` + `Clock3` icon — PLU 未反映は①状態（原則 4 の例「PLU 未反映」そのもの）だが `variant="secondary"`（②分類の形）を使っており **種類の取り違え**（runtime gap）。正しくは `variant="outline"` + warning tone。
  - `:84` 「反映済み」`<Badge variant="default" className="gap-1 whitespace-nowrap">` — `variant="default"` は③強調（琥珀 pill）の形だが「反映済み」は状態であって強調ではない。①状態（`variant="outline"` + success tone）への取り違え（runtime gap）。
- **③強調の取り違え例**（追加発見）: `BackupRestorePage.tsx:533` 「最新」`<Badge variant="secondary">最新</Badge>` — 「最新」は原則 4 ③強調の例示そのもの（`:20`「ランキング 1 位 / 最新 等」）だが `variant="secondary"`（②分類の形）になっている（runtime gap）。`ProductImportPreview.tsx:76` 「上書き N 件」`<Badge variant="default">` は③強調（琥珀 pill）として整合（正しい実装例）。
- `rg -n "<Badge" src/features src/components --glob '!*.test.*'` の全件 sweep（badge 3 種への当てはめ含む）を「設計判断」節に runtime sweep 表として残す（canonical docs 本文には含めない、次の runtime lane が再利用する申し送り）。
- DSR-08（`01-decision-rules.md:153-165`）は「比較のプラス / マイナスも記号 + テキストを併記する」を既に規定するが色の割当ては未規定。`IntegrityCheckPage.tsx:377-378` の差異数値（`{item.difference > 0 ? "+" : ""}{item.difference...}`）は `font-semibold tabular-nums` のみで色クラスが無い（R3-1 の指摘どおり実測で確認）。同 `:381` の `<Badge variant="outline">{differenceLabel(item.difference)}</Badge>` は①状態のトーンなし outline（`システム在庫が多い` / `入出庫の合計が多い` / `差異なし` の 3 値、tone family への機械的な当てはめが難しく owner culling 対象）。

### (b) CTA 中間段

- `src/components/ui/button.tsx:16` に `secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"` が既に実装済み（枠なし）。`src/styles/globals.css:76-77` の `--secondary` = `#e7e5e4`（stone-200）/ `--secondary-foreground` = `#1c1917`。owner 決定 B2「`--secondary` stone-200 塗り、枠なし、色相を付けない」と runtime の既存実装が一致している（**button.tsx の変更は不要**、catalog/DSR に位置づけを書くだけで足りる）。
- `ProductForm.tsx:313-322`「新しい取引先を追加」（インラインフォームの開閉トグル）は現状 `variant="outline"`（`:315`）。`PriceRevisionFilters.tsx:62-69`「新しい取引先を追加」も同型で `variant="outline"`（`:64`）。owner 決定 B2 に従うと、この種の「補助アクション（インラインで別の入力面を開く）」は `secondary` 中間段が適切な候補（runtime 反映は別 packet、本 packet は DSR-01 に位置づけを記録するのみ）。
- `ProductForm.tsx:343-377`「追加する」（インライン取引先登録の確定 Button、`:343` の `<Button type="button" size="sm" ...>` に `variant` 指定なし = 既定 `default`（primary））と同 file `:481`「登録する / 保存する」（`<Button type="submit" ...>`、`variant` 指定なし = 既定 `default`（primary））が同一画面に同時存在しうる（`showSupplierInput` が true のとき）。DSR-01「1 画面 1 primary」の違反候補（発注時の指摘どおり、行番号は `:343`/`:481` に訂正 — 発注時の `:376` は本文中のボタン文言行で、Button タグ開始行は `:343`）。是正（`secondary` へ変更）は runtime lane。
- `ProductListPage.tsx:307,309` の空状態「商品を登録する」（`variant="outline"`）は既存の EmptyState action 規約（`02-component-catalog.md:375` 既存 action 共存規定）に基づく既存パターンで、DSR-01 違反ではない（画面ヘッダに primary が無い空状態時の唯一の CTA）。据え置き検討のまま Non-scope とする。

### (c) 検索欄の可視 Label

- `SearchBar.tsx:72-74`（commit 型）は `<Label htmlFor={inputId}>{inputLabel}</Label>` を持つ。`SearchBar.tsx` の live 型（`:142-143` で `inputAriaLabel` / `inputPlaceholder` の既定値を計算する関数コンポーネント）は `Label` を描画せず `aria-label`/`placeholder` のみ。
- `02-component-catalog.md:591` は「live 型は可視 Label を持たない設計（在庫照会の検索駆動レイアウト）のため、`aria-label` を省略しないことが必須要件」と明記しており、owner 決定 C1（live 型も可視 Label 必須）と正反対の規範になっている。是正対象は本文そのもの。
- Live 型採用画面（`aria-label` 既定値 "商品検索"）: 商品一覧・在庫照会・一括価格改定・入出庫履歴。owner C1「既定文言『商品を検索』」は現行 `aria-label` 既定値「商品検索」とは表記が異なる（「を」の有無）。可視 Label の既定文言は owner 指定どおり「商品を検索」とし、`aria-label` の既定値表記との整合は runtime lane の判断に委ねる（本 packet は catalog の規範文のみ）。

### (e) Alert warning variant

- `src/components/ui/alert.tsx:9-16` の `alertVariants` は `default`（`bg-card text-card-foreground`）と `destructive`（`bg-card text-destructive ...`）の 2 variant のみ。`warning` variant は存在しない。
- `PriceRevisionPage.tsx:112-116` は `<Alert role="note">`（variant 指定なし = `default`）で「画面を再読み込みすると、確定前に入力した新売価・新原価は失われます。1行ずつ確定してください。」を表示しており、注意文言でありながら視覚的に destructive/warning と区別されていない（R3-3）。
- 既存 Badge 側には `border-warning-border bg-warning-soft text-warning-strong` + `AlertTriangle`/`TriangleAlertIcon` の 3 点セット先例が複数ある（`StocktakePage.tsx:396-401`、`csv-import/components/PreviewStep.tsx:75-80` — 後者は Gated Amendment 5 で「黒枠 outline は主警告より強く見え情報階層が逆転するため不採用、soft warning token へ統一」の裁定履歴あり）。Alert 自身の `destructive` variant は `bg-card` を保ったまま `text-destructive` のみ変えるミニマルな配色（Badge の 3 点フル塗り替えとは形が違う）。本 packet は Alert の `warning` variant を **`destructive` と同じ「`bg-card` 据え置き + text/icon のみ warning 色にする」形**で提案する（Alert 内部の一貫性を優先し、Badge の 3 点セット形を Alert に持ち込まない）。

### (d) 在庫照会（Non-scope）

- `useStockInquiry.ts:126-132`（1 件自動展開の `useEffect`）を実読確認。R2-3 の是正（再クリックで閉じる、検索条件変化ごとに 1 回へ限定）はロジック変更でありデザイン docs の改訂を要しない。本 packet では扱わず runtime batch へ申し送る。
- R2-4（検索条件追加）は owner が対象条件を未回答（`docs/Plans.md:85`「どの条件かは未回答、owner に候補提示」）。本 packet では Backlog 起票もしない（Plans.md ⑦ の当該行に「条件待ち」と記すのみ）。

## 設計判断

### (a) catalog ⑬ 具体化方針（新規 DSR なし）

`02-component-catalog.md` ⑬ ステータスバッジに、`04-backbone.md` 原則 4 の 3 種構成を明記し、①状態の tone family マッピング表を追加する（Writer が Plan Gate 後に清書、本節は骨子）:

- **3 種構成の追記**: 「①状態 = `variant="outline"` + icon + soft tone（在庫切れ・在庫少・PLU 未反映・PLU 対象外 等）」「②分類 = `variant="secondary"` + 枠線（隣接背景に対し 3:1、icon は識別に必要な場合のみ、廃番等）」「③強調 = `variant="default"`（琥珀 pill、ランキング・最新 等）」の 3 種以外を作らないことを明記する（04-backbone 原則 4 の catalog への反映）。
- **①状態の tone family マッピング表**（owner culling 列つき、原文回答で確定）:

  | tone family | 該当する状態文言（例） | owner culling（残す/外す/追加、原文回答） |
  |---|---|---|
  | warning（`border-warning-border bg-warning-soft text-warning-strong` + icon） | 未反映・未入力・差異あり・入力中・未処理・部分成功 | |
  | success（`border-success-border bg-success-soft text-success-strong` + icon） | 反映済み・補正済み・済み・確定・完了・訂正済み | |
  | destructive（`border-destructive-border bg-destructive-soft text-destructive-strong` + icon） | 取消済み・明細取消済み・失敗・フォーマット異常 | |
  | 中立（家族なし、`variant="outline"` の既定枠色のみ、soft 背景なし） | 通常・対象外・有効 | |

  進行中・未登録 JAN・`IntegrityCheckPage.tsx` の差異ラベル等、複数系統に読める文言は表に含めず「runtime sweep（起票時実測節の site 表）で owner が個別裁定する」と明記する。②分類（廃番・最近改定・記録種別ラベル等）・③強調（最新・上書き件数等）はこの tone family 表の対象外（枠線・pill 色はそれぞれ原則 4 の規定どおり）であることも明記する。
- **関連**: DSR-08（semantic 色）/ DSR-04（状態列 vs セル内 badge）を引用し、DSR-16・DSR-21・DSR-22 とは主題が異なる旨は既存 DSR-22 側の記載に委ねる（catalog 側で重複説明しない）。

### (a) 00-foundations.md token 登録（04-backbone 既定値の反映）

`04-backbone.md`「foundations への追記分」表が既に確定した値をそのまま 00-foundations.md のセマンティックカラー表へ転記する（新規提案ではない）:

- `--success-border`: `#bbf7d0`（Tailwind `green-200` 相当）
- `--success-strong`: `#14532d`（Tailwind `green-900` 相当）
- Contrast（WCAG 相対輝度公式で独立に再計算、Plan Review での再現用）: `--success-strong`（`#14532d`）対 `--success-soft`（`#f0fdf4`）= **8.71:1**（相対輝度 L_fg ≈ 0.0652、L_bg ≈ 0.9531、(0.9531+0.05)/(0.0652+0.05) ≈ 8.71）。AA 本文基準 4.5:1 を上回る。
- `--success-soft`（既存 `#f0fdf4`）/ `--success`（既存 `#15803d`）/ `--success-emphasis`（既存 `#16a34a`）は変更しない。

### (a) DSR-08 増減数値の色（拡張、新 DSR 不要）

既存 DSR-08 の「比較のプラス / マイナスも記号 + テキストを併記する」の直後に 1 文追加する: 「増減数値の色は補助シグナルとして重ねる: + は `text-success-strong`、− は `text-destructive-strong`、0 は `text-muted-foreground`（記号 + 文言併記は維持する）。」起票時実測（`IntegrityCheckPage.tsx:377` が無色の具体例）を Why の裏付けとして引用する。catalog ⑬ ではなく DSR-08 本文への追記を選ぶ理由: DSR-08 に該当規定（記号+文言併記）が既にあり 1 文追加で済む（catalog ⑬ に新設すると増減数値専用の新しい構造節が要り diff が大きくなる）。

### (a) badge.tsx runtime gap（記録のみ、本 packet では変更しない）

- ②分類の枠線要件（原則 4）に対し、`badge.tsx:8` の base（`border border-transparent`）と `:13` の `secondary` variant が枠色を上書きしないため、②分類 badge（廃番等）に枠線が付かない。runtime lane で `secondary` variant（または呼び出し側）に境界色を追加する。
- ①状態の種類取り違え: `ProductTable.tsx:79`「未反映」（`variant="secondary"` → 正しくは `outline`+warning tone）、`:84`「反映済み」（`variant="default"` → 正しくは `outline`+success tone）。
- ③強調の種類取り違え: `BackupRestorePage.tsx:533`「最新」（`variant="secondary"` → 正しくは `default`、琥珀 pill）。
- いずれも設計（04-backbone 原則 4）は正しく、runtime 実装が追随していない。本 packet は記録のみ、是正は runtime lane。

### (b) DSR-01 3 段 CTA 階層（owner 決定 B2）

現行ルール文「それ以外の CTA は outline / ghost へ降格する。」を次へ拡張する: 「それ以外の CTA は 3 段で降格する — 補助アクション（画面の主目的に付随し、別の入力面を開く等の二次操作）は `secondary`（`--secondary` stone-200 塗り、枠なし、色相を付けない中間段）、それ以外（一覧へ戻る等の離脱系操作）は `outline` / `ghost` に降格する。」。判定フローに起票時実測の `ProductForm.tsx` 二重 primary 候補を runtime 是正対象として追記する。catalog ① ページヘッダの Do bullet「アクションが複数あるときは 1 つだけ Primary、残りは outline / ghost に降格する」を「…残りは 3 段（`secondary` 中間段 → `outline` / `ghost`）で降格する」へ同期する。

### (c) SearchBar live 型 Label（owner決定 C1）

`02-component-catalog.md:591` 付近の「live 型は可視 Label を持たない設計（在庫照会の検索駆動レイアウト）のため、`aria-label` を省略しないことが必須要件」を「live 型も可視 `<Label>` を必須とする（既定文言『商品を検索』、画面ごとに上書き可）。`aria-label` は可視 Label と同文言で維持し、`placeholder` は入力例として併存させる（識別の唯一の手段にしない）」へ書き換える。Don't 節「live 型で `aria-label` を外さない（可視 Label がない分、これが唯一の識別子）」も可視 Label 前提の文言へ更新する。commit 型（既に Label あり）の記述は変更しない。

### (e) Alert warning variant（owner 推奨案、culling 対象）

`02-component-catalog.md` ⑥ に新規バリエーション節を追加し、`Alert` `warning` variant を次の形で規範化する: `alertVariants` に `warning: "bg-card text-warning-strong *:data-[slot=alert-description]:text-warning-strong/90 [&>svg]:text-warning-strong"`（`destructive` variant と同じ「`bg-card` 据え置き + text/icon のみ着色」の形。Badge の soft 背景 3 点セットは Alert には持ち込まない — Alert は `default`/`destructive` とも `bg-card` 共通のため、`warning` だけ背景を変えると variant 間の一貫性が崩れる）。子要素は `AlertTriangle` icon + `AlertTitle`/`AlertDescription` の 2 段（DSR-11 に準拠）を推奨する。適用先候補: `PriceRevisionPage.tsx:112-116`。runtime 反映（`alert.tsx` の variant 追加 + 呼び出し側の variant 切替）は別 packet。

## Scope

- **S1 catalog ⑬ 具体化**: `02-component-catalog.md` ⑬ ステータスバッジ（`:770-822`）に badge 3 種構成（原則 4 の反映）と①状態 tone family マッピング表（owner culling 列つき）を追加。Don't 節に「secondary（②分類）を①状態の soft tone 代わりに使わない」を追加。
- **S2 00-foundations.md token 登録**: `--success-border`（`#bbf7d0`）/ `--success-strong`（`#14532d`）の 2 行をセマンティックカラー表（`:31-42` 付近、既存 Warning Border/Strong 行の隣）に追加。`--success-soft`/`--success`/`--success-emphasis` の既存行は変更しない。
- **S3 DSR-08 増減数値の色**: `01-decision-rules.md` DSR-08（`:153-165`）の記号+文言併記規定の直後に色規則の 1 文を追加。
- **S4 DSR-01 3 段階層**: `01-decision-rules.md` DSR-01（`:19-28`）のルール文を 3 段表現へ拡張し、判定フローに `ProductForm.tsx` 二重 primary 候補を runtime 是正対象として追記。
- **S5 catalog ① 同期**: `02-component-catalog.md` ① ページヘッダ（`:24-64`）の Do bullet を 3 段表現へ更新。
- **S6 catalog ⑨ SearchBar Label 反転**: `02-component-catalog.md` ⑨ 検索+フィルタ（`:543-601`）の live 型 Label 記述・アクセシビリティ節・Don't 節を owner C1 へ書き換え。
- **S7 catalog ⑥ Alert warning**: `02-component-catalog.md` ⑥ 空状態・エラー・ローディング（`:318-424`）に warning variant バリエーション節を新設し、使用トークン行に warning を追記。適用先候補 `PriceRevisionPage.tsx:112-116` を記録。
- **S8 review-checklist カテゴリ9**: `docs/quality/review-checklist.md` カテゴリ 9（`:68-87`）に badge 3 種構成（04-backbone 原則4/catalog⑬）と増減数値の色（DSR-08 拡張）の 2 行を追加。
- **S9 04-backbone.md 状態更新**: 「foundations への追記分」表の success 行・badge 行の備考に本 packet での反映を追記し、更新履歴に 1 行追加する（原則 2/4 の本文は変更しない）。
- **S10 更新履歴**: `01-decision-rules.md`（`:455`）/ `02-component-catalog.md`（`:939`）/ `review-checklist.md`（`:112`）の 3 file の `## 更新履歴` へ本 PR の行を追加（`00-foundations.md` には更新履歴節が無いため対象外）。
- **S11 Plans.md ⑦ 相当**: `docs/Plans.md` ⑦（`:101`）へ本 packet への active link + owner 回答サマリを追記（本 commit で直接実施、下記「Plans.md edits」節参照）。
- **S12 runtime sweep 申し送り**: `rg -n "<Badge" src/features src/components --glob '!*.test.*'` の全件と CTA 候補（`ProductForm.tsx`/`PriceRevisionFilters.tsx`）、badge 3 種の取り違え一覧（`ProductTable.tsx:56,74,79,84`、`BackupRestorePage.tsx:533`）を「起票時実測」節に事実として残す（canonical docs 本文には含めない、次の runtime lane 起票時に再利用する）。

## Non-scope

- `src/**` の実装変更全て（`badge.tsx` / `button.tsx` / `alert.tsx` / `ProductTable.tsx` / `ProductForm.tsx` / `PriceRevisionFilters.tsx` / `PriceRevisionPage.tsx` / `SearchBar.tsx` / `useStockInquiry.ts` / `BackupRestorePage.tsx` 等）。
- R2-3（在庫照会 展開行の再クリックで閉じる）・R2-4（在庫照会 検索条件追加、owner 条件待ち、Backlog 起票もしない）。
- Windows native L3 実機確認。
- Lane 4 / Lane 5 / ⑧ native `<select>` → shadcn `Select` 置換。
- `ProductListPage.tsx:307-309` の空状態 CTA variant（据え置き検討のまま）。
- `--success-border` / `--success-strong` 以外の新規 token。
- badge.tsx outline の枠色トークン値そのもの（`border-border` → `border-border-strong` 相当の変更、Lane 5 が別途扱う）。
- `04-backbone.md`「00〜03 への反映先」に残る他項目（DSR-01「0 primary 画面の昇格」/ 検索欄 live+ボタン併記統合 / PageHeader subtitle 基準 / ListSkeleton 等）。
- `04-backbone.md` 原則 1〜16 の本文改訂（状態更新の備考欄追記のみ、原則本文は不変）。

## Acceptance Criteria

- AC1: `rg -Fc "owner culling（残す/外す/追加、原文回答）" docs/design-system/02-component-catalog.md` ≥ 1（tone family マッピング表が catalog ⑬ にあり、`01-decision-rules.md` 側には無いこと — `rg -Fc "owner culling（残す/外す/追加、原文回答）" docs/design-system/01-decision-rules.md` = 0）。
- AC2: `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 0（新規 DSR を起草していないことの negative oracle）。
- AC3: `rg -Fc "success-border" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "success-strong" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "#bbf7d0" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "#14532d" docs/design-system/00-foundations.md` ≥ 1、`rg -c "^| Success Soft " docs/design-system/00-foundations.md` = 1（既存行が重複登録されていない）。
- AC4: `rg -Fc "text-success-strong" docs/design-system/01-decision-rules.md` ≥ 1（DSR-08 側に増減数値の色規則がある）、`rg -Fc "text-success-strong" docs/design-system/02-component-catalog.md` = 0（catalog ⑬ に増減数値ルールを重複記載していない）。
- AC5: `rg -Fc "それ以外の CTA は 3 段で降格する" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fc "それ以外の CTA は outline / ghost へ降格する。" docs/design-system/01-decision-rules.md` = 0。
- AC6: `rg -Fc "残りは 3 段（\`secondary\` 中間段 → \`outline\` / \`ghost\`）で降格する" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "残りは outline / ghost に降格する" docs/design-system/02-component-catalog.md` = 0。
- AC7: `rg -Fc "live 型も可視" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "live 型は可視 Label を持たない設計" docs/design-system/02-component-catalog.md` = 0、`rg -Fc "商品を検索" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "可視 Label がない分、これが唯一の識別子" docs/design-system/02-component-catalog.md` = 0。
- AC8: `rg -Fc 'variant="warning"' docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "AlertTriangle" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "PriceRevisionPage.tsx:112" docs/design-system/02-component-catalog.md` ≥ 1。
- AC9: `rg -Fc "badge 3 種" docs/quality/review-checklist.md` ≥ 1、`rg -Fc "DSR-08" docs/quality/review-checklist.md` ≥ 2（既存 1 行 + 増減数値の色の新規 1 行）。
- AC10: `rg -Fc "本 packet" docs/design-system/04-backbone.md` ≥ 1（success 行・badge 行いずれかの備考に反映記録がある）。`rg -c "^## DSR-" docs/design-system/04-backbone.md` = 0（04-backbone 側にも新規 DSR を作っていないこと）。
- AC11: `01-decision-rules.md` / `02-component-catalog.md` / `review-checklist.md` の `## 更新履歴` 表それぞれに本 PR の行が 1 行追加されている（`git diff` の hunk が各 file の該当表にのみ存在）。`04-backbone.md` の `## 更新履歴` にも 1 行追加されている。
- AC12: `docs/Plans.md` ⑦ が本 packet（basename `2026-09-05-ui-conventions-batch-design.md`）への active link と owner 回答サブ bullet を持つ。
- AC13: `git diff --name-only 07302b5..HEAD` に `src/` 配下の file が 0 件。
- AC14: `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0 で通過。
- AC-HumanGate: owner が①状態 tone family マッピング表の owner culling 列を design PR 上で埋める（原文回答）。

## Design Sources

- Requirements / spec: 該当なし（新規 REQ token 追加なし）
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: `docs/design-system/04-backbone.md` 原則 2/4（badge 規範の正本、本文は不変・状態更新のみ）/ `00-foundations.md`（token 表、改訂対象）/ `01-decision-rules.md` DSR-01/DSR-08（改訂対象）/ `02-component-catalog.md` ①/⑥/⑨/⑬（改訂対象）/ `docs/quality/review-checklist.md` カテゴリ 9 / `docs/design-system/README.md`（変更なし、DSR 総数不変のため）
- Decision log / ADR: 新規 entry なし。D-056（Opus 役割）/ D-079（UI 視覚系座組）を踏襲。
- owner 一次情報: `docs/Plans.md` ⑦（`:101`、R2-5/R3-1/R3-2/R3-3/R3-4/R5-1/R5-3/R5-5 の起票時実測 sub-bullet）、`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md`（owner 原文、本 packet の R 番号は Plans.md 側の Coordinator 転記から引用。原文自体には R 番号の記載なし — 本節で明記）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | `04-backbone.md` 原則 2/4（既存、状態更新のみ）、`01-decision-rules.md` DSR-01/DSR-08、`02-component-catalog.md` ①/⑥/⑨/⑬、`00-foundations.md`、`review-checklist.md` | updated in this PR |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| durable decision / ADR | D-056 / D-079 の座組を踏襲、新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名 | 該当なし（新設 file なし、既存 5 file の改訂のみ） |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 該当なし（新規 REQ 追加なし、`generate_traceability` 再生成不要） |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |
| 新規 DSR | なし（本 packet は既存 DSR-01/DSR-08 の拡張のみ、DSR 総数不変のため `README.md` 索引更新は不要） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| R2-5/R3-1/R5-5 | `04-backbone.md` 原則 2/4 → `02-component-catalog.md` ⑬（具体化） | UICONV-D1 | 新規 DSR 起草案は `04-backbone.md:44`「DSR 新設なし」と矛盾するため不採用。catalog ⑬ への tone family 表追加が正しい反映先 | `02-component-catalog.md` | AC1/AC2 rg |
| なし（token 整合） | `04-backbone.md`「foundations への追記分」表 → `00-foundations.md` | UICONV-D2 | 値は 04-backbone が既に確定（`#bbf7d0`/`#14532d`）、本 packet は転記のみ。独自に値を再提案する代替は既存の設計判断を無視するため不採用 | `00-foundations.md` | AC3 rg + reviewer 実読（WCAG 計算の再現） |
| R3-1 | `01-decision-rules.md` DSR-08（拡張） | UICONV-D3 | catalog ⑬ に新設する代替は diff が大きい。DSR-08 に既存の記号+文言併記規定があるため 1 文追加で足りる | `01-decision-rules.md` | AC4 rg |
| R5-5（runtime gap） | `04-backbone.md` 原則 4②、`badge.tsx:8,13` | UICONV-D4 | 廃番の枠なしは design の誤りではなく `badge.tsx` の `secondary` variant が枠色を上書きしないための runtime 未追随。design 側を変更する代替（②分類の定義を「枠なし」に緩める）は原則 4 の明文と矛盾するため不採用 | なし（runtime lane へ申し送り） | 該当なし |
| R3-4 | `01-decision-rules.md` DSR-01（改訂） | UICONV-D5（owner 決定 B2） | 3 段階層。secondary は既存 runtime 実装（`button.tsx`/`globals.css`）と一致するため新規 token 不要 | `01-decision-rules.md`、`02-component-catalog.md` ① | AC5/AC6 rg |
| R5-1 | `02-component-catalog.md` ⑨ | UICONV-D6（owner 決定 C1） | live 型も可視 Label 必須。placeholder のみ案（現状）は owner が明示的に却下 | `02-component-catalog.md` | AC7 rg |
| R3-3 | `02-component-catalog.md` ⑥ | UICONV-D7 | Alert `warning` variant は `destructive` と同じ「bg-card 据え置き」形にし、Alert 内 variant 間の一貫性を優先。Badge の soft 3 点セットをそのまま持ち込む代替は Alert の他 variant と背景形が食い違うため不採用 | `02-component-catalog.md` | AC8 rg |
| R2-3/R2-4 | — | UICONV-D8 | design 変更なしの runtime ロジック（R2-3）と owner 未回答（R2-4）のため本 packet では扱わない | なし（Non-scope） | 該当なし |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: catalog ⑬ 本文の「Why」に `04-backbone.md` 原則 4 の引用と `ProductTable.tsx` 枠不整合の実測を明記し、packet 依存を残さない設計にする。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: owner 決定 B2/C1 は DSR-01/catalog ⑨ 本文へ昇格。新規 decision-log entry は不要（既存 D-056/D-079 座組の範囲内）。
- Assumptions and constraints: badge.tsx の outline 枠色トークン値（`border-border` → `border-border-strong`）は Lane 5（別 branch、進行中）が扱うため、①状態 tone family 表では固定値を書かず「badge.tsx の既定に従う」とした。Lane 5 merge 後に記述が古くならないか、runtime lane 起票時に再確認する。
- Deferred design gaps, risk, and follow-up target: tone family 表の owner culling 列（Human Gate）、`IntegrityCheckPage.tsx` の差異ラベル tone（owner culling で個別裁定）、badge.tsx の②分類枠線・③強調取り違え runtime gap 一式、R2-3/R2-4。
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-conventions-batch-design.md) 各行に UICONV-D 番号か DSR/catalog 節番号を付す）。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 例外は「複数系統に読める文言は表に含めず owner culling」（`IntegrityCheckPage.tsx` 差異ラベル等）のみで、catalog ⑬ 本文にその旨を明記する。抜け道なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — docs-only | — |
| Fact check / design decision split | 適用: 発注時の前提「(a) は新規 DSR」が `04-backbone.md:44` の明文と矛盾すると判明し catalog ⑬ 具体化へ差替え。「`--success-soft` 新規登録」「`ProductForm.tsx` 行番号 `:376`」の 2 件も実測で誤りと判明し訂正した | 本 packet「起票時実測」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 状態 badge・CTA・検索欄・注意文言は複数画面の主動線に影響（runtime 反映は別 packet、Human Gate は tone family 表の culling のみ） | AC-HumanGate |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner が tone family マッピング表を design PR 上で culling（実機 L3 は対象外） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: `04-backbone.md` 原則 2/4 が badge の規範を既に確定しており、DSR-01〜22・catalog 16 パターン・token 表の構造も既に存在。追記先の節・行番号を起票時実測で確認済み。
- Source docs updated in this PR: `01-decision-rules.md`（DSR-01/DSR-08 拡張、新規 DSR なし）/ `00-foundations.md`（token 2 行）/ `02-component-catalog.md`（①⑥⑨⑬）/ `review-checklist.md` / `04-backbone.md`（状態更新のみ）。
- Design gaps intentionally deferred: tone family 表の owner culling、`IntegrityCheckPage.tsx` 差異ラベルの個別裁定、R2-3/R2-4、badge.tsx runtime gap 一式。
- Durable decisions discovered in this plan and promoted to source docs: owner 決定 B2（DSR-01 3 段階層）/ C1（SearchBar live Label）。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 該当なし（docs-only）。
- Backend function design: 該当なし。
- Command / DTO / data contract: 該当なし。
- Persistence / transaction / audit impact: 該当なし。
- Operator workflow / Japanese UI wording: 状態 badge・CTA・検索欄・注意文言の日本語契約は本 packet の Scope で確定、runtime 反映時に再確認。
- Error, empty, retry, and recovery behavior: 該当なし（既存契約不変）。
- Testability and traceability IDs: UICONV-D1〜D8（新規 DSR なし）。

## Contract Probe

- `--success-strong` 対 `--success-soft` の WCAG コントラスト: WCAG 2.x 相対輝度公式で独立計算 -> **8.71:1**（AA 4.5:1 を上回る、本文「設計判断」節に計算過程を記録）。`04-backbone.md` の既定値をそのまま検証した形（値の新規探索ではない）。
- Alert `warning` variant の形（`bg-card` 据え置き vs soft 背景）: `destructive`/`default` の既存実装を `alert.tsx` で実読し、両者とも `bg-card` 共通であることを確認済み（静的コード確認、追加実験不要、N/A）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| UICONV-D1 catalog ⑬ 具体化（tone family 表、新規 DSR なし） | `02-component-catalog.md` | AC1/AC2 rg | non-scope（tone 適用は runtime lane） |
| UICONV-D2 `--success-border`/`--success-strong` 登録 | `00-foundations.md` | AC3 rg | non-scope（token 実装は runtime lane） |
| UICONV-D3 DSR-08 増減数値の色 | `01-decision-rules.md` | AC4 rg | non-scope |
| UICONV-D4 badge.tsx runtime gap（記録のみ） | なし | AC10 の一部（04-backbone 状態更新） | non-scope |
| UICONV-D5 DSR-01 3 段階層（owner B2） | `01-decision-rules.md`、`02-component-catalog.md` ① | AC5/AC6 rg | non-scope |
| UICONV-D6 SearchBar live Label（owner C1） | `02-component-catalog.md` ⑨ | AC7 rg | non-scope |
| UICONV-D7 Alert warning variant | `02-component-catalog.md` ⑥ | AC8 rg | non-scope |
| S8 review-checklist 2 行追加 | `review-checklist.md` | AC9 rg | — |
| S9 04-backbone 状態更新 | `04-backbone.md` | AC10 rg | — |
| S10 更新履歴 4 file | 各 file | AC11 git diff hunk | — |
| S11 Plans.md ⑦ 同期 | `Plans.md` | AC12 rg | — |
| 全体整合 | docs | AC14 `doc-consistency-check.sh --target plan` | — |
| Non-scope 遵守 | `src/**` | AC13 `git diff --name-only` | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-05-ui-conventions-batch-design.md](test-matrices/2026-09-05-ui-conventions-batch-design.md)（R2 だが Coordinator 判断で必須化、上記「Risk」節参照）。
- Human Gate に L3 は含まない（docs-only）。`cargo check --release` の Writer 完了条件は L3 が無いため非該当。

- targeted tests: 各 Scope 項目の rg exact-match presence/negative oracle（AC1〜AC13）。
- negative tests: 旧文言 0 件（「outline / ghost へ降格する。」「live 型は可視 Label を持たない設計」「可視 Label がない分」「新規 DSR-23」の 4 negative oracle）。
- compatibility checks: 既存 DSR-04/16/21/22、`04-backbone.md` 原則 2/4 本文が変更されないこと（`git diff` に該当 hunk がないこと）、SearchBar commit 型の記述が変更されないこと、`--success-soft`/`--success`/`--success-emphasis` の既存行が変更されないこと。
- data safety checks: 該当なし（DB 書込みなし）。
- main wiring/integration checks: 該当なし（route/DTO 変更なし）。`docs/Plans.md` ⑦ のリンクが本 packet basename と一致すること。

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（design-system docs の文言・token 表変更のみ）。

## Review Focus

- (a) が新規 DSR を起草しておらず、`04-backbone.md:44`「DSR 新設なし」と整合しているか。catalog ⑬ の tone family 表が owner culling 列を持ち、複数系統に読める文言（`IntegrityCheckPage.tsx` の差異ラベル等）を無理に押し込んでいないか。
- `--success-border`/`--success-strong` の値が `04-backbone.md` の既定値（`#bbf7d0`/`#14532d`）と一致しているか、独自の値を提案していないか。
- DSR-08 の増減数値の色追記が catalog ⑬ に重複していないか（AC4 の negative oracle）。
- badge.tsx runtime gap の記述が「design は正しい、runtime が未追随」という因果を正確に表しているか（design 側の規約を緩める書き方になっていないか）。
- DSR-01 3 段階層の追記が既存の「1 画面 1 primary」原則と矛盾しないか（secondary は primary の代替ではなく中間段であることが明確か）。
- SearchBar live 型 Label 反転が commit 型の既存記述を巻き込んでいないか。
- Alert warning variant の形（`bg-card` 据え置き）の理由づけが Alert 内部の一貫性として妥当か。
- Non-scope（`src/**`、R2-3/R2-4、Lane 4/5/⑧、`ProductListPage.tsx` 空状態 CTA、04-backbone の他の反映先項目）が誤って Scope に混入していないか。

## Spec Contract

Contract ID: SPEC-UICONV-1

- catalog ⑬（①状態 tone family + badge 3 種構成の明記、新規 DSR なし）、DSR-08（増減数値の色）、DSR-01 3 段 CTA 階層、catalog ⑨ SearchBar live Label 反転、catalog ⑥ Alert warning variant、`00-foundations.md` の `--success-border`/`--success-strong` 登録、`04-backbone.md` の状態更新が canonical docs に反映され、`src/**` は無変更のまま。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UICONV-1 | S1 | AC1/AC2 rg | catalog ⑬ 具体化・新規 DSR なし | rg |
| SPEC-UICONV-1 | S2 | AC3 rg | success token 新設・重複なし・04-backbone 既定値一致 | rg |
| SPEC-UICONV-1 | S3 | AC4 rg | DSR-08 増減数値の色（catalog 側に重複なし） | rg |
| SPEC-UICONV-1 | S4/S5 | AC5/AC6 rg | DSR-01 3 段階層の同期 | rg |
| SPEC-UICONV-1 | S6 | AC7 rg | SearchBar Label 反転 | rg |
| SPEC-UICONV-1 | S7 | AC8 rg | Alert warning variant | rg |
| SPEC-UICONV-1 | S8/S9/S10 | AC9/AC10/AC11 rg + git diff | checklist・04-backbone 状態更新・更新履歴同期 | rg / git |
| SPEC-UICONV-1 | S11 | AC12 rg | Plans.md 同期 | rg |
| SPEC-UICONV-1 | 全体 | AC13/AC14 | Non-scope 遵守・doc gate | git diff / doc-consistency-check.sh |

## Data Safety

- what must not be committed: なし。
- local-only paths: 該当なし。
- synthetic-only paths: 該当なし。

## Writer 実装原則（ponytail、full。実装節の直前に固定注入、`feedback-ponytail-principles-in-order-sheets.md` verbatim）

```
## 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

Writer（Plan Gate 通過後の canonical docs 起草担当）への申し送り: explicit-path `git add` のみ（`git add -A`/`.` 禁止）。PR body の `Reviewed Content HEAD` は `pending` のまま起票する。REQ / traceability table に触れる変更は本 packet に含まれないため `generate_traceability` 再生成は不要（Registration Obligations 節参照、変更があれば再判定する）。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
