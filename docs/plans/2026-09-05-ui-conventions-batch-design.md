# Plan Packet: UI 規約補強 design batch（状態 Badge tone・CTA 中間段・検索欄 Label・Alert warning、docs-only）

Plans.md ⑦（owner 所感 2026-09-05 起票、design-first 候補提示）の (a)(b)(c)(e) を design-system canonical docs へ規範化する。owner 決定 B2（CTA 中間段）/ C1（検索欄可視 Label）を確定事項として、(a) 状態 Badge tone と (e) Alert warning は推奨案を起草し owner が design PR 上で culling する。(d) 在庫照会の 2 項目（R2-3 展開行再クリック・R2-4 検索条件追加）は Non-scope（runtime batch / 条件待ち）。本 packet自体は docs-only（design-system canonical docs は Plan Review 後に別 Writer 起草が着手する。本 commit は Plan Packet + Test Design Matrix + `docs/Plans.md` の起票のみ）。

**(a) の枠組み訂正（Coordinator 指摘、起草中に反映）**: `04-backbone.md` 原則 2（色は 3 家族 × soft/border/strong/emphasis の 4 段）と原則 4（badge は①状態=outline+icon+soft背景／②分類=secondary pill+枠線／③強調=琥珀pillの3種だけ、DSR 新設なし）が既に badge の規範を確定している（`04-backbone.md:44` 「3 種構成は原則 4 の記述を正とする（DSR 新設なし）」）。したがって (a) は新規 DSR を起草せず、原則 2/4 の **具体化**として起票する。

**Plan Review round 1 是正（Opus reject / Sonnet approve-with-P2 / owner v2 mockup 決定〈batch 1・2・3〉→ 全件 accept、本 commit で反映済み。評決の変遷は文末「Review Response」節に記録）**。本文は是正後の最終状態のみを記す。

## Workflow State

- Phase: human-confirm
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: fbbcf19
- Amendments: Gated Amendment 1（2026-09-05、`src/styles/globals.css` token 4 行 + 既存 3 file の class 順整形、Writer `cd1c2f8` `402fd4e` `ce1b0ea`）/ Gated Amendment 2（2026-09-06、Human Gate 回答の反映、Writer `068c82c`）
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（design docs、worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5 デザイン面（read-only claims-producer、D-056 / D-079）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5 デザイン面 + Codex ロジック・整合面 1 回（Codex 枠切れ、2026-09-07 夜の週次リセット後に実施。それまで §3.3 Capacity-degraded を適用し Codex 成分は pending、Phase は human-confirm で待機し前進させない）
- Reviewed Content HEAD: 068c82c
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required（docs-only だが Ready 後の hosted final は owner `workflow_dispatch` が必要。Ready 案内に明記する）
- Human Gate: owner が design PR 上で ①状態 badge の tone family マッピング表の owner culling 列を埋める（原文回答、Coordinator が転記し原文を正とする）。Alert warning / ③強調 / CTA secondary / ①状態の枠強度は v2〜v4 mockup で owner 決定済み（下記参照、markers はすべて解消）。実機（Windows native L3）確認はこの packet の対象外で、後続 runtime lane が担う

補足（enum 訂正）: 発注時の指定は「Phase: plan-first」だったが、`scripts/doc-consistency-check.sh` の `WORKFLOW_STATE_PHASES` enum に `plan-first` は存在しない（有効値は `kickoff spec-check design plan-draft plan-gate plan-approved implementing local-verified independent-review human-confirm ready-hosted-final merge archive`）。本 commit は「plan-first commit」（packet を初めて起票する commit）に該当するため、Phase は enum 上の `plan-draft` を使う。

補足（DSR-23 の帰属、Plan Review round 1 batch 2 指摘）: ⑦（本 packet）と ⑧（`agent/ui-select-unify`、native `<select>` → shadcn `Select` 置換）は両方 `01-decision-rules.md` を編集する。DSR-23 の番号は ⑧ が登録する（本 packet は新規 DSR を起草しない、AC2 参照）。どちらかが先に merge した場合、後に merge する側が origin/main を取り込んでから自身の rg oracle を再実行すること（番号衝突・行番号ずれの検出）。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-05 回答、B2/C1 確定・(a)(e) は推奨案起草の方針、消費済み）。2 回目 = tone family 表 + Alert text 色の owner culling（v2〜v4 mockup、③強調枠は v3 で `--warning` に確定、消費済み〜継続中）。3 回目 = 承認 + merge（Coordinator 代行）。

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
- `01-decision-rules.md` DSR-22 の UI 部品枠 3:1 要件が interactive な操作枠（入力・outline ボタン・select・segmented・focus ring）に限定され、badge は文字 4.5:1 + icon 必須 + soft 背景単独不可（枠は tone 色または `--border`）へ改訂される（owner 決定、2026-09-05 v2 mockup）。`04-backbone.md:20` 原則4②・`review-checklist.md` カテゴリ9 も同期する。
- `00-foundations.md` に `--success-border`（`#bbf7d0`）/ `--success-strong`（`#14532d`）が `04-backbone.md`「foundations への追記分」表の既定値どおりに register され、`--success-strong` 対 `--success-soft` の contrast が WCAG 相対輝度計算で 4.5:1 以上であることが記録される。
- `01-decision-rules.md` DSR-08 に増減数値の色規則（+ = success-strong / − = destructive-strong / 0 = muted-foreground）が既存の記号+文言併記規定への追記として反映される（新規 DSR は起草しない）。
- `01-decision-rules.md` DSR-01 に primary / secondary（`--secondary` 塗り + `--border` 枠、中間段）/ outline の 3 段 CTA 階層が明記され、`02-component-catalog.md` ① ページヘッダの Do bullet が同期される（owner 決定 B2、枠色は owner が v2 mockup で `--border` を選択）。
- `02-component-catalog.md` ⑨ 検索+フィルタの live 型検索欄が「可視 Label を持たない設計」から「可視 Label 必須（既定文言『商品を検索』、画面ごとに上書き可）+ `aria-label` 廃止」へ書き換わる（owner 決定 C1、WCAG 2.5.3）。
- `02-component-catalog.md` ⑥ 空状態・エラー・ローディングに `Alert` `warning` variant（`bg-warning-soft` + `border-warning` + `AlertTriangle`〈icon `text-warning`〉+ 本文 `text-warning-strong`、①状態 badge と同じ 4 点構造）が規範化される（owner v4 決定、候補 (c) で確定）。適用先候補（`PriceRevisionPage.tsx:112-116`）が記録される。
- `04-backbone.md`「foundations への追記分」表の success 行・badge 行、`:52`「00〜03 への反映先」の catalog⑬ badge 項目、および原則4②の枠線記述に、本 packet で反映した旨・narrow 化した旨の状態更新が入る（原則本文の構成自体は変更しない）。
- `docs/Plans.md` ⑦ が本 packet への active link と owner 回答サマリ（v2/v3 mockup 決定含む）を持つ。
- 上記いずれも `src/**` の変更を伴わない（runtime 反映は別 packet）。

### 失敗定義

- (a) を新規 DSR として起草する、または `04-backbone.md` 原則 2/4 の構成（3 種・4 段）自体を書き換える。
- `--success-soft` / `--success`（既存 token）を新規登録として重複記載する、または `04-backbone.md` の既定値（border `#bbf7d0` / strong `#14532d`）と異なる値を 00-foundations に登録する、または `--success-border` の登録を owner 決定に反して見送る。
- 増減数値の色規則を新規 DSR や catalog に書き、DSR-08 拡張より大きい diff にする。
- owner 決定（B2/C1、DSR-22 narrow 化、②分類/CTA secondary の `--border`、Alert warning = 候補 (c)〈v4 確定〉、③強調 pill 枠色 `--warning`〈v3 確定〉）のいずれかを再度未決のまま書く、または確定済みの決定を書き換える。
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
- `04-backbone.md` の「00〜03 への反映先」に残る他項目（DSR-01 の「0 primary 画面の昇格」/ 検索欄の単一挙動〈live+ボタン併記への統合〉/ PageHeader subtitle 基準 / ⑨ SearchBar canonical 統合 / ListSkeleton 等）。
- destructive Alert の soft-fill 統一（`warning` との対称性、owner 判断が要る後続候補、本 packet では扱わない）。
- DSR-23 の新設・登録（lane ⑧ が担当）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-05、worktree base `07302b5`、すべて本 packet 起草者が rg で再確認）

### (a) 状態 Badge のトーン — 04-backbone 原則 2/4 の具体化 + DSR-22 の枠 3:1 narrow 化

- `04-backbone.md:20` 原則 4「badge は 3 種だけ。①状態 = outline + icon + soft 背景（在庫切れ / 在庫少 / PLU 未反映 等）②分類 = secondary pill + 枠線（隣接背景に対し 3:1、DSR-22）。icon は識別に必要な場合に限り可（廃番等、Gated Amendment 1）③強調 = 琥珀 pill（ランキング 1 位 / 最新 等）。4 種目を作らない。」/ `:44`「3 種構成は原則 4 の記述を正とする（**DSR 新設なし**）」/ `:52`「`02-component-catalog.md`: 原則 4（⑬ ステータスバッジに badge 3 種の visual 仕様）」— 反映先は catalog ⑬ であり新規 DSR ではないことが明記されている。
- `04-backbone.md:18` 原則 2「色は家族で使う。destructive（赤）/ warning（琥珀）/ success（緑）の 3 家族、各 soft・border・strong・emphasis の 4 段。」/ `:43`「foundations への追記分」表の success 行「soft `#f0fdf4` / border `#bbf7d0` / strong `#14532d` / emphasis `#16a34a`」— **`--success-border`/`--success-strong` の値（`#bbf7d0`/`#14532d`）は既に 04-backbone が確定済み**。本 packet はこれを 00-foundations.md へ反映するのみで、値の新規提案ではない（Tailwind `green-200`/`green-900` と一致）。
- `00-foundations.md:31-42` を実測すると `--success` / `--success-soft` / `--success-emphasis` の 3 点は既に存在するが `--success-border` / `--success-strong` は未登録。warning/destructive は 5 点フルセットだが success のみ 2 段欠けている（04-backbone 原則 2 の要求に対する登録漏れ）。
- **DSR-22 の枠 3:1 要件の narrow 化（owner 決定、2026-09-05 v2 mockup 視認）**: `01-decision-rules.md:443` は現状「UI 部品の枠は…3:1以上…**Badge / outline chip も対象**とし、境界（枠線または背景色）が隣接背景に対し 3:1 以上、かつ文字は…4.5:1 を維持することを要求する」と、badge にも 3:1 を課している。WCAG 相対輝度公式で独立計算すると、提案 `--success-border`（`#bbf7d0`）対 `--background` = **1.16:1**、既存 `--warning-border`（`#fde68a`）対 `--background` も同式で **1.19:1**（一致確認）— いずれも 3:1 に遠く及ばない。owner が v2 mockup を視認し「`--border-strong` の枠はくどい。バッジは改める案だとすっきりする」と明示的に却下したため、**3:1 要件を interactive な操作枠（入力・outline ボタン・select・segmented・focus ring）に限定**し、badge（状態/分類/強調）は 3:1 の対象外へ改める。badge の要件は「文字 4.5:1 以上・①状態は icon 必須・soft 背景単独は不可」とし、枠線は tone 固有色（`border-warning-border` 等）または `--border` でよい。secondary button（塗り + text で識別する部品）の枠も装飾扱いとし `--border` 可・3:1 不要とする。**Why の追加**: WCAG 1.4.11 はテキストで識別される component の境界コントラストを要求しない（badge は文字ラベルが一次識別子）。2026-09-03 owner 所感（廃番 Badge が soft 背景のみ・icon なしで白地に埋もれ見づらい）が禁止したかった組み合わせは「soft 背景単独 + icon なし」であり、この禁止は 3:1 という数値要件を使わなくても icon 必須・soft 背景単独不可のルールで引き続き維持される。
- 上記 narrow 化により **①状態 badge = 案A（tone border + soft bg + strong text + icon、既存 `StockStatusBadge` の形）に確定**（owner v2 mockup 決定）。`--success-border`（`#bbf7d0`）は 3:1 を満たさなくても badge 用途としては要件外のため、**無条件で登録する**（一時 conditional 化を検討したが撤回、詳細は Review Response）。
- canonical `StockStatusBadge.tsx`（catalog ⑬、`02-component-catalog.md:770-822`）は①状態 badge の正しい実装例。**Plan Review round 2 是正（Opus 指摘 4 番）**: 実装を `:17,25-44` で再確認すると、icon を持つのは「在庫切れ」「在庫少」の 2 状態のみで、`:41-44` の `通常`（中立、`border-stone-200 bg-stone-50 text-stone-600`）は icon なしのテキストのみ。発注時の「3 状態とも outline + icon + soft tone」は誤り — icon 必須ルールは**非中立の①状態 badge に限定**する（中立 tone の①状態 badge は icon 任意）。`通常` はこの訂正後も準拠（中立枠 + icon なしで規約に反しない）。
- **`ProductTable.tsx`（商品一覧）の badge 4 箇所を原則 4 の 3 種分類に当てはめて再検証**（owner R5-5「同一画面内の枠不整合」の実体、raw「商品一覧検索画面の廃番とかのバッジには枠ついてないけど対象外には付いてるね、あと感想だけと反映済みはいいとして未反映バッジとか」）:
  - `:56` 「廃番」`<Badge variant="secondary">廃番</Badge>` — ②分類の例そのもの（`:20`「廃番等」）。②分類は「secondary pill + `--border` 枠」が正しい形だが、`badge.tsx:8` の base（`border border-transparent`）と `:13` の `secondary` variant は枠色を上書きしない。**runtime gap**（design は正しい、runtime 未追随）。
  - `:74` 「対象外」`<Badge variant="outline" className="gap-1 whitespace-nowrap">` + `CircleMinus` icon — PLU 対象外は在庫切れ/在庫少のような遷移する状態ではなく、廃番と同じ「恒常的な属性」のため **②分類**（tone family 表には含めない）。現状 `variant="outline"`（②分類の secondary pill 形ではない）も runtime gap。
  - `:79` 「未反映」`<Badge variant="secondary" className="gap-1 whitespace-nowrap">` + `Clock3` icon — PLU 未反映は①状態（在庫切れ・在庫少と同じ「変化する状態」）だが `variant="secondary"`（②分類の形）で **種類の取り違え**（runtime gap）。正しくは `variant="outline"` + warning tone。owner raw「未反映バッジとか、バッジ系の色付け、アプリ内でルール作ったほうがいいかもしれん」が本 packet 起票の直接の契機。
  - `:84` 「反映済み」`<Badge variant="default" className="gap-1 whitespace-nowrap">` — owner raw「反映済みはいいとして未反映バッジとか」は現状表示を明示的に許容している。**owner 承認済みの現状として扱い runtime gap には記録しない**。厳密には①状態（`variant="default"` は③強調の形）だが是正の緊急度はなく、runtime lane で任意タイミングに再判断する。
- **③強調の取り違え例**: `BackupRestorePage.tsx:533` 「最新」`<Badge variant="secondary">最新</Badge>` — ③強調の例示そのもの（`:20`「ランキング 1 位 / 最新 等」）だが `variant="secondary"`（②分類の形）で runtime gap。`ProductImportPreview.tsx:76` 「上書き N 件」`<Badge variant="default">` は③強調として整合（正しい実装例）。③強調の枠色は owner v3 決定で `--warning`（`#d97706`）に確定し、両 site とも `border-warning` を追加する対象になる（下記「badge.tsx runtime gap」節参照）。
- **①状態のうち原則 4 の 3 種いずれにも該当しない solid pill 2 箇所**: `StocktakePage.tsx:404`（棚卸し全数入力完了時）/ `IntegrityCheckPage.tsx:387`「補正済み」はいずれも `<Badge className="bg-success text-primary-foreground">`（`variant` 未指定＝`default` 形に `bg-success` 直接塗りを重ねた実質 4 種目）。「操作の結果として確定した」状態のため①状態の success family に該当し、runtime lane で `variant="outline"` + `border-success-border bg-success-soft text-success-strong` へ移行する（owner の明示的許容が無いため runtime gap）。
- **`text-success-strong` が既に runtime で使われているが未登録**: `rg -n "success-strong" src --glob '!*.test.*'` で `BackupRestorePage.tsx:358`・`HomePage.tsx:66`・`PluExportPage.tsx:521,567` の 4 箇所が `text-success-strong border-success bg-success-soft` を使用しているが、`--success-strong` は `globals.css` に未登録（`@theme inline` mapping も無い）ため無効化されている可能性が高い。`IntegrityCheckPage.tsx:269`・`CostDiffDialog.tsx:136` は同じ形を `text-success`（登録済み）で実装しており正しく着色される。**`--success-strong` の登録は「新規機能」ではなく「既に書かれているが無効化されている 4 箇所を直す」修正**でもある。
- **`rg -n "<Badge" src/features src/components --glob '!*.test.*'` は 44 件（Plan Review round 2 是正、Opus 指摘 8 番 — 発注時「全件 sweep」と書いたが実際に tone table / ②分類 note / ③強調 note / 除外リストで個別引用したのは半数弱で、「全件」は不正確だった）**。以下の追加分類表で残り全件を分類し、以後「全件」の語を使う場合はこの表を含めて正とする（表は canonical docs 本文には含めない、runtime lane 申し送り）:

  | file:line | 文言 | 分類 | 備考 |
  |---|---|---|---|
  | `ProductAddSuggest.tsx:129`、`StocktakePage.tsx:624`、`ProductForm.tsx:151` | 廃番 | ②分類 | `ProductTable.tsx:56` と同型 runtime gap（`border-border` 追加） |
  | `ProductForm.tsx:151` | 表示中 | ①状態・中立 | `variant="outline"`、`通常` と同型で icon 任意、gap なし |
  | `DisposalPage.tsx:304`／`ManualSalePage.tsx:345`／`ReturnExchangePage.tsx:437`／`ReceivingPage.tsx:321` | 再送結果 | ②分類・中立 | `variant="outline"` tone なしで gap なし（中立枠は tone 任意のため） |
  | `ManualSaleRecordDetailPage.tsx:123`／`InventoryRecordsPage.tsx:369`／`ReceivingRecordDetailPage.tsx:115`／`DisposalRecordDetailPage.tsx:117`／`ReturnRecordDetailPage.tsx:144` | `formatRecordStatus` 共有（有効/取消済み/進行中 等） | ①状態・中立 dynamic | tone table 中立行に集約引用済み、値ごとの owner culling は個別確認 |
  | `CsvImportRecordDetailPage.tsx:140` | `STATUS_LABELS` 共有（成功/部分成功/取消済み） | ①状態 dynamic | 取消済みは destructive 行で引用済み、成功/部分成功は `ResultStep.tsx:47` と同型 tone なし runtime gap |
  | `ErrorRowsTable.tsx:68`（`formatErrorRow`） | 未登録JAN/フォーマット異常/JAN不正/数値不正/その他 | ①状態 dynamic（新規実測） | `unmatched_product`→`secondary`「未登録JAN」は種類取り違え、他は `outline` tone なし、いずれも runtime gap |
  | `StocktakeRecordDetailPage.tsx:137`（`STATUS_LABELS`） | 進行中/完了 | ①状態 dynamic（新規実測） | `variant="outline"` tone なし runtime gap（進行中=warning 候補、完了=success 候補、owner culling） |
  | `DailyReportImportPage.tsx:322` | 成功 | ①状態（新規実測） | `variant` 未指定＝`default`（③強調の形）、`ProductTable.tsx:84`「反映済み」と同型の種類取り違えだが owner 承認なし、runtime gap |
  | `daily-sales/components/ProductTable.tsx:133` | 手動 | owner culling（新規実測） | `variant="secondary"` + `bg-warning-soft text-warning-strong` 直書き、枠なし。②分類（恒常的な入力経路属性）か①状態（warning family）か、owner culling で決定 |
  | `OperationLogsPage.tsx:512` | 操作種別ラベル | ②分類 dynamic（新規実測） | 既知種別→`secondary`／未知→`outline`、種別ラベルは中立のため tone なしで gap なし。secondary 側の `border-border` 要否は owner culling |
  | `ReturnRecordDetailPage.tsx:203`（`DIRECTION_LABELS`） | 方向ラベル | ②分類・中立 | `variant="outline"` tone なしで gap なし |
  | `AdditionalImportConfirmDialog.tsx:132` | 今回 | ②分類・中立 | `variant="outline"` tone なしで gap なし |
  | `MovementTable.tsx:69`（`formatMovementType`） | 移動種別ラベル | ②分類・中立 | `variant="outline"` tone なしで gap なし |
- DSR-08（`01-decision-rules.md:153-165`）は「比較のプラス / マイナスも記号 + テキストを併記する」を既に規定するが色の割当ては未規定。`IntegrityCheckPage.tsx:377-378` の差異数値は `font-semibold tabular-nums` のみで色クラスが無い（R3-1 実測確認）。同 `:381` の `<Badge variant="outline">{differenceLabel(item.difference)}</Badge>` は①状態のトーンなし outline（`differenceLabel()` 実装〈`IntegrityCheckPage.tsx:65-69`〉を実読すると値は「システム在庫が多い」/「入出庫の合計が多い」/「差異なし」の 3 値のみで、発注時の前提「差異あり」は実在しない — 削除。3 値とも tone family への機械的な当てはめが難しく owner culling 対象のまま tone table には含めない）。
- **00-foundations.md の用途セル整合 — 実態は色変更（Plan Review round 2 是正、Opus 指摘 5 番）**: `--success`（`:31`、用途「取込み完了、前月比プラス」）と `--success-emphasis`（`:42`、用途「増減プラス数値」）の「前月比プラス」「増減プラス数値」は、`text-success-emphasis` として **既に runtime 実装済み**（`monthly-sales/components/SummaryCardsBar.tsx:115`、`daily-sales/components/SummaryCardsBar.tsx:139`、いずれも `diff >= 0 ? "text-success-emphasis" : "text-destructive"`）。WCAG 相対輝度公式で独立計算すると `--success-emphasis`（`#16a34a`）対 `--background`（`#fafaf9`）= **3.16:1（AA 4.5:1 未達）**。DSR-08 の新規則（+ は `text-success-strong`）はこの用途を「参照へ repoint」するだけでなく **実質的に置き換える色変更**であり、`--success-strong`（`#14532d`）は同背景で 8.69:1（AA 達成）と AA 是正を伴う。この 2 site を runtime gap として明記し、「参照」という表現で色変更の実態を隠さない。`--success`（`:31`）の「取込み完了」用途は増減とは無関係の別状態表示なので repoint 対象から除外しそのまま残す。**Plan Review round 3 是正**: `rg -n "success-emphasis" src` を再実行すると `text-success-emphasis` の runtime 消費者は 3 件（`globals.css` の token 定義を除く）— 上記 2 site に加え `src/features/products/import/ProductImportPreview.tsx:238`（`<CheckCircle2 className="size-5 text-success-emphasis" aria-hidden="true" />`、増減数値ではなく「成功サマリの icon 色」用途）がある。`--success-emphasis` は DSR-08 採用後も**この icon 用途では引き続き使われる**ため「用途なし」は誤り — 用途セルは「増減用途は DSR-08 が置換、icon 用途 1 site（ProductImportPreview）残置」と明記する（値は削除しない、増減 2 site のみ `text-success-strong` へ置き換える runtime gap）。

### (b) CTA 中間段

- `src/components/ui/button.tsx:17` に `secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"` が既に実装済み（枠なし）。`src/styles/globals.css:76-77` の `--secondary` = `#e7e5e4`（stone-200）/ `--secondary-foreground` = `#1c1917`。
- **owner 決定（v2 mockup、2026-09-05）**: `--secondary` 単色のまま枠なしで運用すると対 `--background` 実測 1.20:1 で低視力操作者に境界が見えにくく（owner raw「次へボタンうす目…有効なボタンか？」の既存不満とも符合）、DSR-01 の `secondary` に枠を追加する必要がある点は妥当としつつ、`--border-strong`（対 `--secondary` ≈2.94:1）は上記 (a) と同じ「くどい」所感で不採用、**`--border` を選択**（塗り + `--border` 枠 + 無彩色）。
- runtime の既定実装は `secondary: "border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80"`（`button.tsx` 側、runtime lane で変更）を候補とする。**runtime 影響 sweep**（`rg -n 'variant="secondary"' src --glob '!*.test.*'`）: 現状 `Button` で `variant="secondary"` を使う箇所は **0 件**（全 8 件が `Badge`、上記 tone table / ②分類 note 参照）。したがって本枠追加は既存画面の見た目を変えず、今後 `outline`→`secondary` へ移行する箇所（`ProductForm.tsx:315`/`PriceRevisionFilters.tsx:64` 等）にのみ影響する。
- `ProductForm.tsx:313-322`「新しい取引先を追加」（インラインフォームの開閉トグル）は現状 `variant="outline"`（`:315`）。`PriceRevisionFilters.tsx:62-69`「新しい取引先を追加」も同型で `variant="outline"`（`:64`）。owner 決定 B2 に従うと、この種の「補助アクション」は `secondary` 中間段が適切な候補（runtime 反映は別 packet）。
- `ProductForm.tsx:343-377`「追加する」（インライン取引先登録の確定 Button、`:343` の `<Button type="button" size="sm" ...>` に `variant` 指定なし = 既定 `default`（primary））と同 file `:481`「登録する / 保存する」（`variant` 指定なし = 既定 `default`（primary））が同一画面に同時存在しうる（`showSupplierInput` が true のとき）。DSR-01「1 画面 1 primary」の違反候補（行番号は `:343`/`:481` に訂正 — 発注時の `:376` は本文中のボタン文言行）。是正（`secondary` へ変更）は runtime lane。
- `ProductListPage.tsx:307,309` の空状態「商品を登録する」（`variant="outline"`）は既存の EmptyState action 規約に基づく既存パターンで、DSR-01 違反ではない。据え置き検討のまま Non-scope とする。

### (c) 検索欄の可視 Label

- `SearchBar.tsx:72-74`（commit 型）は `<Label htmlFor={inputId}>{inputLabel}</Label>` を持つ。live 型（`:142-143`）は `Label` を描画せず `aria-label`/`placeholder` のみ。
- `02-component-catalog.md:588` の**アクセシビリティ節冒頭**は「検索 `Input` は両モードとも `aria-label="商品検索"` で識別する」から始まり、同段落内で live 型に「`aria-label` を省略しないことが必須要件」と重ねて明記している（発注時引用の `:591` を rg で再確認し `:588` に訂正）。**Plan Review round 2 是正（Opus 指摘 3 番）**: この冒頭文自体が owner 決定 C1（live 型は `aria-label` を廃止）と矛盾する — 「両モードとも `aria-label`」という前提から書き直す必要があり、末尾の Don't 節だけ直しても冒頭文が残ると自己矛盾する。是正対象は段落冒頭から Don't 節までの全体。
- 可視 `<Label htmlFor>` を追加すると、その Label テキストが accessible name になる。別文言の `aria-label` を併置すると WCAG 2.5.3 Label in Name に抵触するため、**`aria-label` は落とし、可視 Label を唯一の accessible name にする**。この結論は runtime lane へ先送りせず、catalog ⑨ 本文（`:588` アクセシビリティ節、`:598` Don't 節）で今すぐ確定する。
- Live 型採用画面: 商品一覧・在庫照会・一括価格改定・入出庫履歴。可視 Label の既定文言は owner 指定どおり「商品を検索」とする（現行 `aria-label` 既定値「商品検索」は `aria-label` ごと廃止するため文言の食い違いは解消される）。

### (e) Alert warning variant

- `src/components/ui/alert.tsx:9-16` の `alertVariants` は `default`（`bg-card text-card-foreground`）と `destructive`（`bg-card text-destructive ...`）の 2 variant のみ。`warning` variant は存在しない。
- `PriceRevisionPage.tsx:112-116` は `<Alert role="note">`（variant 指定なし = `default`）で注意文言を表示しており、視覚的に destructive/warning と区別されていない（R3-3）。
- 既存 Badge 側には `border-warning-border bg-warning-soft text-warning-strong` + icon の 3 点セット先例が複数ある（`StocktakePage.tsx:396-401`、`PreviewStep.tsx:75-80`）。**追加実測**: `BackupRestorePage.tsx:578` に既に `<Alert className="border-warning bg-warning-soft text-warning-strong">` というインライン warning 表現があり、owner raw「画面を再読み込みすると…注意文言なのに薄いし…どう見せるかはまぁバックアップの注意書きみたいな色でいいんじゃないか」はこの箇所を指している。この既存実装は `bg-warning-soft`（soft 背景）を使っており、`destructive` variant の「`bg-card` 据え置き」とは形が異なる。
- **owner v2 決定**: `warning` variant は `bg-card` 据え置きのまま **border を `--warning`（`#d97706`）で着色**し `AlertTriangle` icon を持つ（owner「icon 付きで分かりやすい」）。ここまでは確定。
- **owner v3 決定（③強調 pill の枠）**: `04-backbone.md:20`「琥珀 pill（ランキング 1 位 / 最新 等）」の枠を `--warning`（`#d97706`）に確定。WCAG 相対輝度公式で独立計算: `--warning` 対 fill `#fef3c7`（`--rank-top-badge-bg`）= **2.86:1**、対 `--background` = **3.05:1**（owner 提示の v3 mockup 数値と一致確認）。適用対象は `ProductImportPreview.tsx:76`「上書き N 件」（正しい variant、枠追加のみ）、`ProductRankingTable.tsx:80`「1 位」（`bg-rank-top-badge-bg text-rank-top-badge-text` custom class、枠追加のみ）、`BackupRestorePage.tsx:533`「最新」（`variant="secondary"` の種類取り違えも合わせて是正）の 3 site。runtime lane で `border-warning` を追加する（③強調の枠色決定は完了、以降は runtime gap として扱う）。
- **owner v4 決定（Alert warning の text 色、確定）**: `bg-warning-soft` + `border-warning` + `AlertTriangle`（icon `text-warning`）+ 本文 `text-warning-strong` の 4 点構造（①状態 badge と同じ soft/border/strong/icon の形）に確定。WCAG 相対輝度公式で独立計算: `text-warning-strong`（`#78350f`）対 `bg-warning-soft`（`#fffbeb`）= **8.75:1**（owner 提示値と一致、AA を大きく上回る）。「Badge の soft 背景 3 点セットを Alert に持ち込まない」という当初方針（`bg-card` 据え置きで家族内一貫性を優先）は撤回され、①状態との視覚言語統一が正式な設計判断になった。
- **Alternatives considered（不採用）**: 候補 (a) `bg-card` 据え置き + `text-warning-strong`（`bg-card` 対比 8.32:1、AA 達成）— 家族内一貫性は保てるが「薄い」という owner raw 指摘（R3-3 の起点）を soft 背景なしでは十分に解消できないため不採用。候補 (b) `bg-card` 据え置き + `text-foreground` 本文、枠と icon のみ amber — owner 所感「すっきり見えるが警告表示としての一貫性に欠ける」により不採用。候補 (d) タイトル「ご注意」を `--warning-strong` bold、本文 `--foreground` — 見出しのみの強調では①状態 badge との視覚言語統一が図れないため不採用。
- **destructive Alert は現状維持（Non-scope、対称性は後続候補）**: `alert.tsx` の `destructive` variant（`bg-card` + red 系）は本 packet では変更しない。`warning` が soft 塗りへ移行したことで `destructive` との構造が非対称になるが、destructive の soft 塗り統一は別途 owner 判断が要る後続候補として記録するに留める（`BackupRestorePage.tsx:393` 等の既存 destructive Alert 実装への影響が大きいため、本 packet の Goal Invariant を超える）。

### (d) 在庫照会（Non-scope）

- `useStockInquiry.ts:126-132`（1 件自動展開の `useEffect`）を実読確認。R2-3 の是正はロジック変更でありデザイン docs の改訂を要しない。本 packet では扱わず runtime batch へ申し送る。
- R2-4（検索条件追加）は owner が対象条件を未回答（`docs/Plans.md:85`）。本 packet では Backlog 起票もしない（Plans.md ⑦ の当該行に「条件待ち」と記すのみ）。

## 設計判断

### (a) DSR-22 の枠 3:1 narrow 化（owner 決定、2026-09-05 v2 mockup）

`01-decision-rules.md:443` の該当文を書き換える:

- 現行: 「UI 部品の枠は、操作枠（入力・ボタン outline・select・segmented・状態 badge・outline chip の枠・focus ring）を隣接背景（ページ背景）に対し 3:1 以上（WCAG 2.2 SC 1.4.11 / 2.4.13）にする。**Badge / outline chip も対象**とし、境界（枠線または背景色）が隣接背景に対し 3:1 以上、かつ文字は WCAG 1.4.3 の通常テキスト基準 4.5:1 を維持することを要求する（…）。soft 背景色のみでは非テキスト UI 部品のコントラスト要件を満たすシグナルにならない。」
- 新規: 「UI 部品の枠は、interactive な操作枠（入力・outline ボタン・select・segmented・focus ring）を隣接背景（ページ背景）に対し 3:1 以上（WCAG 2.2 SC 1.4.11 / 2.4.13）にする — 対象は文字ラベルではなく塗り・枠自体が識別子になる component（focus ring 等）で、`secondary` button のような文字ラベルで識別される部品は塗り・枠を装飾として扱い、この 3:1 要件の対象に含めない。**badge（状態/分類/強調）は非 interactive のため 1.4.11 の対象外**とし、代わりに次を要求する: 文字は WCAG 1.4.3 の通常テキスト基準 4.5:1 以上、**badge は枠線（tone 固有色または `--border`）を必ず持つ**（soft 背景単独・枠なしは不可）、**非中立の①状態 badge（warning/success/destructive tone）はさらに icon を必須にする**（中立 tone の①状態 badge は icon 任意、canonical `通常`=`StockStatusBadge.tsx:41-44` が icon なしで準拠する先例。②分類・③強調も識別に必要な場合のみ icon 可、廃番等は枠線ルールで担保されるため icon 任意）。枠線の強度は 3:1 を要求しない（tone 固有色または `--border` でよい）（2026-09-05 owner 決定、v2 mockup 視認。旧文は Badge/outline chip も 3:1 対象としていたが、owner が「`--border-strong` の枠はくどい」と明示的に却下）。」
- 判定フロー例（`:447`）も同期する: 「廃番 Badge の是正例: `secondary` pill を outline + `--border-strong` 相当の枠線（対 `--background` 3:1 以上）へ変更し…」→「廃番 Badge の是正例: `secondary` pill のまま `--border` 枠線を追加し、既存の灰色系 secondary Badge も同根の可読性課題として Lane 3〜5 の sweep 対象に含める。」
- Why への追加文: 「2026-09-05 owner 決定により、UI 部品枠 3:1 の対象を interactive な操作枠に限定し、badge は対象外とした。WCAG 1.4.11 はテキストで識別される component の境界コントラストを要求しない（badge は文字ラベルで意味を識別する）。2026-09-03 の owner 所感（廃番 Badge が soft 背景のみ・icon なしで白地に埋もれ見づらい）が禁止したい組み合わせ（soft 背景単独・icon なし）は、本節の icon 必須・soft 背景単独不可のルールで数値要件なしに引き続き維持される。」
- 連動して `04-backbone.md:20` 原則4②「②分類 = secondary pill + 枠線（隣接背景に対し 3:1、DSR-22）」→「②分類 = secondary pill + 枠線（`--border`、DSR-22。2026-09-05 owner 決定で 3:1 要件は interactive な操作枠へ限定、badge の枠は tone 固有色または `--border` を必須とする）」へ、`review-checklist.md:86`「UI 部品の枠（操作枠 3:1 / 構造線を一段濃く / Badge・outline chip も 3:1 対象で soft 背景だけに頼らない）」→「UI 部品の枠（操作枠 3:1 は interactive 部品限定 / 構造線を一段濃く / Badge は文字 4.5:1・枠線〈tone 固有色または `--border`〉必須・状態 badge は icon も必須・soft 背景単独は不可）」へ同期する。追加で `04-backbone.md:44` token 表 badge 行「②分類は枠線 3:1、icon は識別に必要な場合のみ可」→「②分類は枠線必須（`--border`）、icon は識別に必要な場合のみ可（原則 4 訂正、2026-09-05 narrow 化）」、`02-component-catalog.md:158` の JSX コメント「分類 badge は枠線 3:1（DSR-22）が規範」→「分類 badge は枠線必須（`--border`、DSR-22）が規範」、`01-decision-rules.md:445` Why「境界（枠線または背景）で 3:1 を担保し」→「境界（枠線、tone 固有色または `--border`）を必須にし」、`:451` 関連「Badge/outline chip の 3:1」→「Badge/outline chip の枠線必須化」へ、それぞれ同期する（Plan Review round 2 是正、Opus 指摘 2 番 — `rg -n "3:1" docs/design-system docs/quality` で網羅確認済み、残る hit は操作枠固有の記述〈`00-foundations.md:18,20,21`／`04-backbone.md:29,45`〈原則 13、badge に言及せず操作枠/構造線のみを扱うため据え置き〉〉と更新履歴〈`01-decision-rules.md:460`、append-only の過去記録のため不変〉のみで badge 3:1 の残存はない）。

### (a) catalog ⑬ 具体化方針（新規 DSR なし）

`02-component-catalog.md` ⑬ ステータスバッジに、`04-backbone.md` 原則 4 の 3 種構成を明記し、①状態の tone family マッピング表を追加する（Writer が Plan Gate 後に清書、本節は骨子）:

- **3 種構成の追記**: 「①状態 = `variant="outline"` + icon + soft tone（tone 固有色の枠、在庫切れ・在庫少・PLU 未反映 等、遷移しうる状態）」「②分類 = `variant="secondary"` + `--border` 枠（icon は識別に必要な場合のみ、廃番・PLU 対象外・最近改定 等の恒常的な属性）」「③強調 = `variant="default"` + `border-warning`（琥珀 pill、枠色は owner v3 決定で `--warning` に確定、ランキング・最新 等）」の 3 種以外を作らないことを明記する。
- **①状態の tone family マッピング表**（owner culling 列つき、原文回答で確定。全行 `rg -n "<Badge"` 実測、file:line 明記）:

  | tone family | 該当する状態 badge（file:line、実測文言） | owner culling（残す/外す/追加、原文回答） |
  |---|---|---|
  | warning（`border-warning-border bg-warning-soft text-warning-strong` + icon） | `StockStatusBadge.tsx:34`「在庫少」（実装済み）/ `StocktakePage.tsx:396-401`「未入力 N」（実装済み）/ `csv-import/components/PreviewStep.tsx:75-80`「同日データあり」（実装済み、Gated Amendment 5 先例）/ `ProductTable.tsx:79`「未反映」（`variant="secondary"`、runtime gap）/ `ResultStep.tsx:47`「部分成功」（`variant="outline"`、tone なし、runtime gap） | |
  | success（`border-success-border bg-success-soft text-success-strong` + icon） | `IntegrityCheckPage.tsx:387`「補正済み」（`bg-success` 直接塗り pill、runtime gap）/ `StocktakePage.tsx:404`（棚卸し全数完了時の同型 pill、runtime gap）/ `ProductTable.tsx:84`「反映済み」（`variant="default"`、**owner 承認済み現状のため runtime gap ではない**、raw「反映済みはいいとして」）/ `ResultStep.tsx:47`「成功」（`variant="secondary"`、tone なし、runtime gap）/ `DailyReportImportPage.tsx:164,186`「確認済み」（`variant="secondary"`、tone なし、runtime gap） | |
  | destructive（`border-destructive-border bg-destructive-soft text-destructive-strong` + icon） | `StockStatusBadge.tsx:25`「在庫切れ」（実装済み）/ `CsvImportRecordDetailPage.tsx:41,140`「取消済み」（`STATUS_LABELS.rolled_back` 定義 `:41`、`<Badge variant="outline">` 表示 `:140`、tone なし、runtime gap）・`:192`「明細取消済み」（tone なし、runtime gap）/ `DailyReportImportPage.tsx:164,179`「取込み済み」（`variant="destructive"` 塗り、原則 4 の 3 種いずれにも該当しない runtime gap 候補） | |
  | 中立（家族なし、`variant="outline"` の既定枠色、無彩色 soft（`bg-stone-50` 等）可・icon 任意） | `StockStatusBadge.tsx:42`「通常」（実装済み、`border-stone-200 bg-stone-50 text-stone-600`、icon なしで準拠）/ `src/features/inventory-records/types.ts:87-94` `formatRecordStatus`（`active`="有効" 等、`InventoryRecordsPage.tsx:369` 他複数の記録詳細ページで共有、owner culling で個別確認） | |

  **表から除外した項目とその理由**: 「差異あり」は `IntegrityCheckPage.tsx:65-69` の `differenceLabel()` 実装を実読すると値が「システム在庫が多い」「入出庫の合計が多い」「差異なし」の 3 値のみで実在しない（削除）。「入力中」（`PriceRevisionTable.tsx:104`）は `04-backbone.md:31` 原則 15「現在の行は 3 点で示す」の対象であり、tone family の対象外（原則 15 を参照するクロスリファレンスを catalog ⑬ に 1 行置く）。「対象外」（`ProductTable.tsx:74`）は廃番と同じ恒常的属性のため②分類（下記）へ移す。「有効」は `CsvImportRecordDetailPage.tsx:194` では Badge ではなく `<span className="text-muted-foreground">` の plain text（除外）。「未処理」（正確には「レジ未処理」、`ReturnExchangePage.tsx:90,592`）も plain text の radio ラベルであり Badge ではない（除外）。隣接する実際の Badge（`:592-598`「この保存で反映」、warning tone）は owner が既に色付きを支持済み（`docs/Plans.md:65`）のため Non-scope（現状維持）とする。
  - **②分類の note**（枠は `--border`、tone family 表とは別建て）: 廃番（`ProductTable.tsx:56` 等）・PLU 対象外（`ProductTable.tsx:74`）・最近改定（`PriceRevisionTable.tsx:98`）は恒常的な属性・分類ラベルであり、`variant="secondary"` + `--border` 枠（`badge.tsx` の runtime gap は上記「起票時実測」節参照）が正しい形。
  - **③強調の note**（枠色 `--warning`、owner v3 決定済み）: 最新（`BackupRestorePage.tsx:533`、`variant="secondary"` の種類取り違えも runtime gap）・1 位（`ProductRankingTable.tsx:80`、`bg-rank-top-badge-bg` custom class）・上書き件数（`ProductImportPreview.tsx:76`、正しい実装例）は `variant="default"`（琥珀 pill）+ `border-warning` 枠。対 fill `#fef3c7` = 2.86:1、対 `--background` = 3.05:1（owner v3 mockup 数値と一致）。3 site とも枠追加が runtime gap。
- **関連**: DSR-08（semantic 色）/ DSR-04（状態列 vs セル内 badge）/ `04-backbone.md` 原則 15（現在行 3 点、`入力中` の帰属先）/ DSR-22（枠の 3:1 narrow 化、上記参照）を引用し、DSR-16・DSR-21 とは主題が異なる旨は既存 DSR-22 側の記載に委ねる。

### (a) 00-foundations.md token 登録（04-backbone 既定値の反映）

`04-backbone.md`「foundations への追記分」表が既に確定した値をそのまま 00-foundations.md のセマンティックカラー表へ転記する（新規提案ではない）:

- `--success-border`: `#bbf7d0`（Tailwind `green-200` 相当）— **無条件で登録**（DSR-22 narrow 化により badge の枠は 3:1 を要求されないため、1.16:1 という数値は登録の妨げにならない）。
- `--success-strong`: `#14532d`（Tailwind `green-900` 相当）— **無条件で登録**。Contrast（WCAG 相対輝度公式で独立に再計算）: `--success-strong` 対 `--success-soft`（`#f0fdf4`）= **8.71:1**（AA 4.5:1 を上回る）。加えて `text-success-strong` は既に 4 箇所（起票時実測節参照）で runtime 使用済みだが token 未登録のため無効化されている — 本登録はこれらを機能させる修正でもある。
- `--success-soft`（既存 `#f0fdf4`）/ `--success`（既存 `#15803d`）/ `--success-emphasis`（既存 `#16a34a`）は色の値を変更しない。**用途セルは repoint ではなく実態を正直に反映する**（Plan Review round 2/3 是正）: `--success`（`:31`）は「取込み完了」用途のみ残す（「前月比プラス」は DSR-08 の ± 規則が置き換える runtime gap として下記で扱う）。`--success-emphasis`（`:42`）は「増減用途は DSR-08 が置換、icon 用途 1 site（ProductImportPreview）残置」と明記する。**`--success-soft`（`:41`）も用途セルの repoint が必要**（Plan Review round 3 是正、Opus 指摘 7 番）: 現行「前月比プラス soft 背景」は `:42` が増減用途を失うと同一表内で整合しなくなる。「①状態 badge success tone の soft 背景 / Alert warning 型に準ずる soft 塗り」へ書き換える（値 `#f0fdf4` は不変）。

### (a) DSR-08 増減数値の色（拡張、新 DSR 不要）

既存 DSR-08 の「比較のプラス / マイナスも記号 + テキストを併記する」の直後に 1 文追加する: 「増減数値の色は補助シグナルとして重ねる: + は `text-success-strong`、− は `text-destructive-strong`、0 は `text-muted-foreground`（記号 + 文言併記は維持する）。」起票時実測（`IntegrityCheckPage.tsx:377` が無色の具体例）を Why の裏付けとして引用する。catalog ⑬ ではなく DSR-08 本文への追記を選ぶ理由: DSR-08 に該当規定が既にあり 1 文追加で済む。**この規則は `text-success-emphasis` を使う既存 2 site（`monthly-sales`/`daily-sales` の `SummaryCardsBar.tsx`）の色を `text-success-strong` へ置き換える AA 是正を伴う**（`--success-emphasis` は対 `--background` 3.16:1 で AA 未達、`--success-strong` は 8.69:1 で達成）。`00-foundations.md` の `--success` 用途セルは「取込み完了」のみ残し、`--success-emphasis` は「増減用途は DSR-08 が置換、icon 用途 1 site（ProductImportPreview）残置」とする（repoint ではなく実態は色変更、二重所有の解消と AA 是正を同時に行う）。

### (a) badge.tsx runtime gap（記録のみ、本 packet では変更しない）

- ②分類の枠要件に対し、`badge.tsx:8` の base（`border border-transparent`）と `:13` の `secondary` variant が枠色を上書きしないため、②分類 badge（廃番・PLU 対象外等）に枠線が付かない。runtime lane で `secondary` variant に `border-border`（**`--border`、`--border-strong` ではない**、owner v2 決定）を追加する。
- ①状態の種類取り違え: `ProductTable.tsx:79`「未反映」（`variant="secondary"` → `outline`+warning tone）、`ResultStep.tsx:47`「部分成功」「成功」（tone なし → warning/success tone 追加）、`CsvImportRecordDetailPage.tsx:140,192`「取消済み」「明細取消済み」（tone なし → destructive tone 追加）、`DailyReportImportPage.tsx:186`「確認済み」（`variant="secondary"` → `outline`+success tone）。
- ①状態の中で原則 4 の 3 種いずれにも該当しない solid pill（4 種目相当、要移行）: `StocktakePage.tsx:404` / `IntegrityCheckPage.tsx:387`「補正済み」（`bg-success text-primary-foreground` → `outline`+success tone）、`DailyReportImportPage.tsx:179`「取込み済み」（`variant="destructive"` 塗り → `outline`+destructive tone）。
- `ProductTable.tsx:84`「反映済み」（`variant="default"`）は owner raw「反映済みはいいとして」により **runtime gap として記録しない**（現状維持）。
- ③強調の種類取り違え: `BackupRestorePage.tsx:533`「最新」（`variant="secondary"` → `default`、琥珀 pill + `border-warning`）。
- ③強調の枠追加（owner v3 決定 `--warning`、種類は既に正しい）: `ProductImportPreview.tsx:76`「上書き N 件」、`ProductRankingTable.tsx:80`「1 位」に `border-warning` を追加。
- `--success-strong` 未登録による無効化（登録すれば自動的に解消）: `BackupRestorePage.tsx:358`・`HomePage.tsx:66`・`PluExportPage.tsx:521,567` の `text-success-strong`。
- CTA: `button.tsx` の `secondary` variant に `border-border` を追加（起票時実測のとおり既存 Button 使用箇所は 0 件のため既存画面への影響なし）。
- 増減数値の色（DSR-08、AA 是正、Plan Review round 2 是正）: `monthly-sales/components/SummaryCardsBar.tsx:115`・`daily-sales/components/SummaryCardsBar.tsx:139` の `text-success-emphasis`（対 `--background` 3.16:1、AA 未達）を `text-success-strong`（8.69:1、AA 達成）へ置き換える。`text-destructive` は既存のまま（DSR-08 の − 規則は `text-destructive-strong` を指すため、この 2 site も強調 shade への統一が runtime gap）。
- いずれも design（04-backbone 原則 4、DSR-22 narrow 化後）は正しく、runtime 実装が追随していない。本 packet は記録のみ、是正は runtime lane。

### (b) DSR-01 3 段 CTA 階層（owner 決定 B2、枠は `--border`）

現行ルール文「それ以外の CTA は outline / ghost へ降格する。」を次へ拡張する: 「それ以外の CTA は 3 段で降格する — 補助アクション（画面の主目的に付随し、別の入力面を開く等の二次操作）は `secondary`（`--secondary` stone-200 塗り + `--border` 枠、色相を付けない中間段）、それ以外（一覧へ戻る等の離脱系操作）は `outline` / `ghost` に降格する。」枠を `--border`（`--border-strong` ではない）にする理由は owner が v2 mockup で「くどい」として `--border-strong` を却下したため（上記 (a) DSR-22 narrow 化と同じ判断軸）。判定フローに起票時実測の `ProductForm.tsx` 二重 primary 候補を runtime 是正対象として追記する。catalog ① ページヘッダの Do bullet「アクションが複数あるときは 1 つだけ Primary、残りは outline / ghost に降格する」を「…残りは 3 段（`secondary` 中間段 → `outline` / `ghost`）で降格する」へ同期する。

### (c) SearchBar live 型 Label（owner決定 C1、aria-label 廃止を確定）

`02-component-catalog.md:588` の**アクセシビリティ節全体**（冒頭「検索 `Input` は両モードとも `aria-label="商品検索"` で識別する」から Don't 節 `:598` まで）を書き換える（**Plan Review round 2 是正、Opus 指摘 3 番** — 冒頭文が「両モードとも aria-label」と述べたまま Don't 節だけ直すと自己矛盾するため、段落全体を対象にする）: 新文言は「commit 型は可視 `Label htmlFor` + `aria-label="商品検索"` の両方を持つ（accessible name は可視 Label が優先）。live 型は可視 `<Label>`（既定文言『商品を検索』、画面ごとに上書き可）のみを accessible name とし、`aria-label` は持たない（WCAG 2.5.3 Label in Name）。`placeholder` はいずれのモードも入力例の補助に留め、識別の手段にしない。」。Don't 節（`:598`）「live 型で `aria-label` を外さない（可視 Label がない分、これが唯一の識別子）」を「live 型に `aria-label` を追加しない（可視 Label が唯一の accessible name、commit 型と live 型で識別方式を混在させない）」へ更新する。commit 型の Label/aria-label 併存は変更しない。

### (e) Alert warning variant（確定、owner v4 決定）

`02-component-catalog.md` ⑥ に新規バリエーション節を追加し、`Alert` `warning` variant を次の形に確定する: `alertVariants` に `warning: "bg-warning-soft border-warning text-warning-strong [&>svg]:text-warning *:data-[slot=alert-description]:text-warning-strong/90"`（soft 塗り + border + strong text + icon の 4 点構造、①状態 badge の `border-warning-border bg-warning-soft text-warning-strong` + icon と同じ視覚言語）。WCAG 相対輝度公式で独立計算: `text-warning-strong` 対 `bg-warning-soft` = **8.75:1**（owner 提示値と一致、AA を大きく上回る）。

**設計判断の変更点（確定）**: 当初「`destructive` と同じ `bg-card` 据え置きで家族内一貫性を優先」としていたが、owner が候補 (b)（`bg-card` 据え置き + `text-foreground` 本文）を「すっきり見えるが警告表示としての一貫性に欠ける」と評したため、①状態 badge との視覚言語統一を優先する方針へ転換した。**Alternatives considered**: (a) `bg-card` 据え置き + `text-warning-strong`（対比 8.32:1、AA 達成だが「薄い」という owner raw 指摘を soft 背景なしでは解消できず不採用）。(b) `bg-card` 据え置き + `text-foreground`、枠と icon のみ amber（上記理由で不採用）。(d) タイトル「ご注意」を `text-warning-strong` bold、本文 `text-foreground`（見出しのみの強調では視覚言語統一に届かず不採用）。

子要素は `AlertTriangle` icon + `AlertTitle`/`AlertDescription` の 2 段（DSR-11 に準拠）。**Plan Review round 2 是正（Opus 指摘 11 番）**: 適用先候補 `PriceRevisionPage.tsx:112-116` を実読すると現状 `<Alert role="note"><AlertDescription>...</AlertDescription></Alert>` のみで `AlertTitle` が無い（2 段構造ではなく 1 段）。runtime lane への申し送り: `AlertTitle` 文言の候補は「ご注意」とし、本文（既存の「画面を再読み込みすると…」）はそのまま `AlertDescription` に残す。既存のインライン warning 表現（`BackupRestorePage.tsx:578`、`bg-warning-soft` 併用）は本 variant 採用によりほぼ同一形へ収束するため、runtime lane で統一するかどうかを判断する。`destructive` variant（`bg-card` + red 系）は本 packet では変更しない — `warning` の soft 塗り確定により両者は非対称になるが、`destructive` の soft 塗り統一は対称性のための後続候補として Non-scope に記録する（`BackupRestorePage.tsx:393` 等の既存 destructive 実装への影響が大きく、本 packet の Goal Invariant を超えるため）。runtime 反映（`alert.tsx` の variant 追加 + 呼び出し側の variant 切替）は別 packet。

## Scope

- **S1 catalog ⑬ 具体化**: `02-component-catalog.md` ⑬ ステータスバッジ（`:770-822`）に badge 3 種構成と①状態 tone family マッピング表（owner culling 列つき、file:line 実測のみ）を追加。②分類 note（廃番・PLU 対象外・最近改定、枠は `--border`）・③強調 note（枠 `--warning`、owner v3 決定済み）・原則 15 クロスリファレンス（`入力中`）を追加。Don't 節に「secondary（②分類）を①状態の soft tone 代わりに使わない」を追加。
- **S2 00-foundations.md token 登録**: `--success-border`（`#bbf7d0`）/ `--success-strong`（`#14532d`）を無条件でセマンティックカラー表（`:31-42` 付近）に追加。`--success`（`:31`）用途セルは「取込み完了」のみ残し、`--success-emphasis`（`:42`）用途セルは「増減用途は DSR-08 が置換、icon 用途 1 site（ProductImportPreview）残置」とし、`--success-soft`（`:41`）用途セルは「①状態 badge success tone の soft 背景 / Alert warning 型に準ずる soft 塗り」とする（3 セルとも値は変更しない、Plan Review round 2/3 是正 — repoint ではなく実態は色変更・同一表内の整合維持）。
- **S3 DSR-08 増減数値の色**: `01-decision-rules.md` DSR-08（`:153-165`）の記号+文言併記規定の直後に色規則の 1 文を追加。
- **S4 DSR-01 3 段階層 + secondary の `--border` 枠**: `01-decision-rules.md` DSR-01（`:19-28`）のルール文を 3 段表現へ拡張し、`secondary` に `--border` 枠を追加。判定フローに `ProductForm.tsx` 二重 primary 候補を runtime 是正対象として追記。
- **S5 catalog ① 同期**: `02-component-catalog.md` ① ページヘッダ（`:24-64`）の Do bullet を 3 段表現へ更新。
- **S6 catalog ⑨ SearchBar Label 反転 + aria-label 廃止**: `02-component-catalog.md` ⑨ 検索+フィルタ（`:543-601`）のアクセシビリティ節全体（`:588` 冒頭〜Don't 節 `:598`）を owner C1 + WCAG 2.5.3 へ書き換え（冒頭「両モードとも aria-label」の矛盾文も含めて是正、Plan Review round 2 是正）。
- **S7 catalog ⑥ Alert warning**: `02-component-catalog.md` ⑥ 空状態・エラー・ローディング（`:318-424`）に warning variant バリエーション節（`bg-warning-soft`+`border-warning`+icon`text-warning`+本文`text-warning-strong`、確定）を新設し、使用トークン行に warning を追記。適用先候補 `PriceRevisionPage.tsx:112-116` を記録。destructive の soft 化は後続候補として Non-scope に記録。
- **S8 review-checklist カテゴリ9**: `docs/quality/review-checklist.md` カテゴリ 9 に badge 3 種構成・増減数値の色の 2 行を追加し、`:86` の枠 3:1 記述を interactive 限定へ narrow 化する。
- **S9 04-backbone.md 状態更新 + narrow 化同期**: 「foundations への追記分」表の success 行・badge 行の備考に反映を追記し、`:52`「00〜03 への反映先」の catalog⑬ badge 項目を完了済みへ更新し、`:20` 原則4②の枠線記述と `:44` token 表 badge 行を `--border` 必須 + narrow 化の dated note へ更新し、更新履歴に 1 行追加する（原則の 3 種/4 段という構成自体は変更しない）。
- **S10 DSR-22 narrow 化**: `01-decision-rules.md` DSR-22（`:443` 本文、`:445` Why、`:447` 判定フロー例、`:451` 関連）を badge 3:1 対象外 + 枠線必須化へ改訂し、Why に WCAG 1.4.11 の根拠文（badge 非 interactive）を追加する。連動して `02-component-catalog.md:158` の JSX コメントも同期する（Plan Review round 2 是正、Opus 指摘 2 番）。
- **S11 更新履歴**: `01-decision-rules.md`（`:455`）/ `02-component-catalog.md`（`:939`）/ `review-checklist.md`（`:112`）/ `04-backbone.md` の `## 更新履歴` へ本 PR の行を追加（`00-foundations.md` には更新履歴節が無いため対象外）。
- **S12 Plans.md ⑦ 相当**: `docs/Plans.md` ⑦（`:101`）へ本 packet への active link + owner 回答サマリ（v2/v3 決定含む）を追記（本 commit で直接実施）。
- **S13 runtime sweep 申し送り**: badge 3 種の取り違え一覧、CTA `Button variant="secondary"` 使用 0 件の実測、`text-success-strong` 無効化 4 箇所を「起票時実測」節に事実として残す（canonical docs 本文には含めない）。

## Non-scope

- `src/**` の実装変更全て（`badge.tsx` / `button.tsx` / `alert.tsx` / `ProductTable.tsx` / `ProductForm.tsx` / `PriceRevisionFilters.tsx` / `PriceRevisionPage.tsx` / `SearchBar.tsx` / `useStockInquiry.ts` / `BackupRestorePage.tsx` 等）。
- R2-3（在庫照会 展開行の再クリックで閉じる）・R2-4（在庫照会 検索条件追加、owner 条件待ち、Backlog 起票もしない）。
- Windows native L3 実機確認。
- Lane 4 / Lane 5 / ⑧ native `<select>` → shadcn `Select` 置換。
- `ProductListPage.tsx:307-309` の空状態 CTA variant（据え置き検討のまま）。
- `--success-border` / `--success-strong` 以外の新規 token。`--success`/`--success-emphasis` の色の値そのもの（用途セルの repoint のみ許可、値は不変）。
- badge.tsx outline（①状態）の枠色トークン値そのもの（`border-border` → `border-border-strong` 相当の変更、Lane 5 が別途扱う。②分類の `border-border` 追加は本 packet の runtime 申し送りだが実装自体は runtime lane）。
- `04-backbone.md`「00〜03 への反映先」に残る他項目（DSR-01「0 primary 画面の昇格」/ 検索欄 live+ボタン併記統合 / PageHeader subtitle 基準 / ListSkeleton 等）。catalog ⑬ badge 項目・DSR-22 narrow 化のみ本 packet で完了済みへ更新する。
- `04-backbone.md` 原則 1〜16 の 3 種/4 段という構成自体の改訂（枠線記述・状態更新の備考欄追記のみ）。
- DSR-23 の新設・登録（lane ⑧ `agent/ui-select-unify` が担当）。
- `mockup-e-badge-cta-samples.html`（別 commit `5c3bc46`）および続く v3 mockup の内容そのもの — 本 packet は owner culling の材料として参照するのみ。
- destructive Alert（`bg-card` + red 系）の soft-fill 統一（`warning` variant との対称性、owner 判断が要る後続候補として記録のみ、本 packet では実装しない）。

## Acceptance Criteria

- AC1: `rg -Fc "owner culling（残す/外す/追加、原文回答）" docs/design-system/02-component-catalog.md` ≥ 1（tone family マッピング表が catalog ⑬ にあり、`01-decision-rules.md` 側には無いこと — 同文字列が `01-decision-rules.md` に 0）。
- AC2: `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 0（新規 DSR を起草していないことの negative oracle）。
- AC3: `rg -Fc "success-border" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "success-strong" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "#bbf7d0" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "#14532d" docs/design-system/00-foundations.md` ≥ 1、`rg -Fc "| Success Soft " docs/design-system/00-foundations.md` = 1（既存行が重複登録されていない。旧 anchor `rg -c "^| Success Soft "` は `|` が正規表現の空選択肢になり全行に一致する不具合だったため `-F` へ訂正、Plan Review round 2 是正、Opus 指摘 7 番）。両方とも無条件登録（owner v2 決定で conditional 化は撤回）。
- AC4: `rg -Fc "増減数値の色は補助シグナルとして重ねる" docs/design-system/01-decision-rules.md` ≥ 1、同一文字列が `docs/design-system/02-component-catalog.md` に 0（catalog ⑬ に重複記載していない。旧 anchor `text-success-strong` は tone table 自体に含まれるため使わない）。
- AC5: `rg -Fc "それ以外の CTA は 3 段で降格する" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fc "それ以外の CTA は outline / ghost へ降格する。" docs/design-system/01-decision-rules.md` = 0、`rg -Fc "\`--secondary\` stone-200 塗り + \`--border\` 枠" docs/design-system/01-decision-rules.md` ≥ 1（secondary の枠は `--border`、`--border-strong` ではないこと）。
- AC6: `rg -Fc "残りは 3 段（\`secondary\` 中間段 → \`outline\` / \`ghost\`）で降格する" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "残りは outline / ghost に降格する" docs/design-system/02-component-catalog.md` = 0。
- AC7: `rg -Fc "live 型は可視" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "live 型は可視 Label を持たない設計" docs/design-system/02-component-catalog.md` = 0、`rg -Fc "商品を検索" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "可視 Label がない分、これが唯一の識別子" docs/design-system/02-component-catalog.md` = 0、`rg -Fc "aria-label は持たない" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "検索 \`Input\` は両モードとも" docs/design-system/02-component-catalog.md` = 0（Plan Review round 3 是正 — bare「両モードとも」は `:547,581,584` の正当な用法にも一致し unsatisfiable だったため `:588` 冒頭の一意な文言へ anchor。冒頭の矛盾文が残っていないことの negative oracle）。
- AC8: `rg -Fc 'variant="warning"' docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "bg-warning-soft" docs/design-system/02-component-catalog.md` の hit に Alert warning 定義行が含まれること（reviewer 目視、既存 Badge 引用行との区別）、`rg -Fc "AlertTriangle" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "PriceRevisionPage.tsx:112" docs/design-system/02-component-catalog.md` ≥ 1、`rg -c "owner決定待ち" docs/design-system/02-component-catalog.md` = 0（全 marker 解消の negative oracle）、`rg -Fc "border-warning" docs/design-system/02-component-catalog.md` の hit に③強調 pill と Alert warning の両方の枠記述が含まれること（reviewer 目視、AC1 の tone table とは別建て）。
- AC9: `rg -Fc "業務上の増減数値（±）が記号 + 文言に加えて色" docs/quality/review-checklist.md` ≥ 1、`rg -Fc "badge 3 種構成" docs/quality/review-checklist.md` ≥ 1、`rg -Fc "操作枠 3:1 は interactive 部品限定" docs/quality/review-checklist.md` ≥ 1（`:86` narrow 化）、`rg -Fc "Badge・outline chip も 3:1 対象で soft 背景だけに頼らない" docs/quality/review-checklist.md` = 0（旧文言 0 件）。
- AC10: `rg -Fc "本 packet" docs/design-system/04-backbone.md` ≥ 1。`rg -c "^## DSR-" docs/design-system/04-backbone.md` = 0（04-backbone 側にも新規 DSR なし）。`rg -Fc "原則 4（⑬ ステータスバッジに badge 3 種の visual 仕様）（完了" docs/design-system/04-backbone.md` ≥ 1（`:52`）。`rg -Fc "枠線（\`--border\`、DSR-22" docs/design-system/04-backbone.md` ≥ 1（`:20` narrow 化同期）、`rg -Fc "枠線（隣接背景に対し 3:1、DSR-22）" docs/design-system/04-backbone.md` = 0（旧文言 0 件）、`rg -Fc "②分類は枠線 3:1、icon は識別に必要な場合のみ可" docs/design-system/04-backbone.md` = 0（`:44` token 表 badge 行の旧文言 0 件、Plan Review round 3 是正、Opus 指摘 6 番）。
- AC11: `rg -Fc "badge（状態/分類/強調）は 3:1 の対象外" docs/design-system/01-decision-rules.md` ≥ 1（DSR-22 narrow 化）、`rg -Fc "Badge / outline chip も対象" docs/design-system/01-decision-rules.md` = 0（旧文言 0 件）、`rg -Fc "\`secondary\` pill のまま \`--border\` 枠線を追加" docs/design-system/01-decision-rules.md` ≥ 1（判定フロー例の同期）、`rg -Fc "境界（枠線または背景）で 3:1 を担保し" docs/design-system/01-decision-rules.md` = 0（`:445` Why の旧文言 0 件、Plan Review round 3 是正）、`rg -Fc "Badge/outline chip の 3:1" docs/design-system/01-decision-rules.md` = 0（`:451` 関連の旧文言 0 件、Plan Review round 3 是正）、`rg -Fc "分類 badge は枠線 3:1（DSR-22）が規範" docs/design-system/02-component-catalog.md` = 0（`02-component-catalog.md:158` JSX コメントの旧文言 0 件、Plan Review round 3 是正、Opus 指摘 6 番）。
- AC12: `01-decision-rules.md` / `02-component-catalog.md` / `review-checklist.md` / `04-backbone.md` の `## 更新履歴` 表それぞれに本 PR の行が 1 行追加されている（`git diff` の hunk が各 file の該当表にのみ存在）。
- AC13: `docs/Plans.md` ⑦ が本 packet（basename `2026-09-05-ui-conventions-batch-design.md`）への active link と owner 回答サブ bullet（v2/v3 決定込み）を持つ。
- AC14: `git diff --name-only 07302b5..HEAD -- src` の出力が `src/styles/globals.css` の 1 行のみ、かつ `git diff 07302b5..HEAD -- src/styles/globals.css` の追加行が `:root` の `--success-border` / `--success-strong` 2 行 + `@theme inline` の `--color-success-border` / `--color-success-strong` 2 行の計 4 行（削除行 0）に限られる。加えて `prettier-plugin-tailwindcss` が新 token を theme color と認識して class 順を並べ替える既存 3 file（`src/features/home/HomePage.tsx` / `src/features/backup-restore/BackupRestorePage.tsx` / `src/features/plu-export/PluExportPage.tsx`、path は Writer 実測で確定）の **class 順のみ** の差分を許容する（oracle: 各 file の `git diff --numstat` で追加行数 = 削除行数、`git diff --word-diff=porcelain` の変更 token が既存 class の並べ替えのみ、`npm run format:check` exit 0）（Gated Amendment 1 で「src 0 件」から改訂、Final Review Opus P2-1 で alias 2 行を追加: Tailwind 4 は `@theme` からのみ utility を生成するため alias が無いと `text-success-strong` 等が無効になる。既存消費者 `HomePage.tsx:66` / `BackupRestorePage.tsx:358` / `PluExportPage.tsx:521,567` はこの欠落で現在無効）。
- AC15: `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0 で通過。
- AC16: `rg -Fc "増減用途は DSR-08 が置換、icon 用途 1 site（ProductImportPreview）残置" docs/design-system/00-foundations.md` ≥ 1（`--success-emphasis` `:42`）、`rg -Fc "取込み完了" docs/design-system/00-foundations.md` ≥ 1（`--success` `:31` の用途が残ること）、`rg -Fc "増減プラス数値" docs/design-system/00-foundations.md` = 0（旧用途文言が残っていないこと）、`rg -Fc "①状態 badge success tone の soft 背景" docs/design-system/00-foundations.md` ≥ 1（`--success-soft` `:41` の repoint、Plan Review round 3 是正、Opus 指摘 7 番）、`rg -Fc "前月比プラス soft 背景" docs/design-system/00-foundations.md` = 0（旧用途文言が残っていないこと）。**Plan Review round 2/3 是正（Sonnet/Opus 指摘）**: 旧 AC16 は「同一文字列を両セルに強制する」形で用途差を表現できなかったため、セルごとに異なる文字列へ差替え。round 3 で `--success-soft`（`:41`）が旧文言のまま残ると `:42` の用途撤去と同一表内で矛盾するため repoint 用オラクルを追加。
- AC-HumanGate: owner が①状態 tone family マッピング表の owner culling 列を design PR 上で埋める（原文回答）。Alert warning（候補 (c)、v4）・③強調 pill 枠色（`--warning`、v3）は既に owner 決定済みのため Human Gate の対象外（Plan Review round 2 是正、Opus 指摘 9 番 — v4 で確定済みの事項が未決のまま Human Gate に残っていた）。
- AC17（Gated Amendment 2、Writer `068c82c`）: `rg -Fc "tone family は感情で分ける: 緑 = 終わったことを伝えるプラスの報告、琥珀 = 「ちょっと待って」の注意、赤 = 警告。状態の名前を伝えるだけの badge は無色" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "owner 承認済み現状のため runtime gap ではない" docs/design-system/02-component-catalog.md` = 0（旧文言 0 件）、`rg -Fc '「反映済み」（\`variant="default"\`（橙）→ success tone の runtime gap）' docs/design-system/02-component-catalog.md` ≥ 1、`rg -F "| destructive" docs/design-system/02-component-catalog.md | rg -Fc "取込み済み"` = 0（destructive 行に残っていないこと、row-scoped）、`rg -F "| warning" docs/design-system/02-component-catalog.md | rg -Fc "取込み済み"` ≥ 1（warning 行へ移動済み、row-scoped）、`rg -Fc "badge の tone family は感情で分ける" docs/design-system/01-decision-rules.md` ≥ 1、`rg -Fc "追加適用先（owner 決定、2026-09-06）" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "success Alert の本文色は現状（\`text-success-strong\`）を維持する" docs/design-system/02-component-catalog.md` ≥ 1、`rg -Fc "owner culling 列は design PR 上で記入（AC-HumanGate、未記入）" docs/design-system/02-component-catalog.md` = 0（旧文言 0 件）。全 9 oracle を `rg -c` で実測確認済み（2026-09-06、drafter）。

## Design Sources

- Requirements / spec: 該当なし（新規 REQ token 追加なし）
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: `docs/design-system/04-backbone.md` 原則 2/4（badge 規範の正本、構成は不変・枠記述と状態更新のみ改訂）/ `00-foundations.md`（token 表、改訂対象）/ `01-decision-rules.md` DSR-01/DSR-08/DSR-22（改訂対象）/ `02-component-catalog.md` ①/⑥/⑨/⑬（改訂対象）/ `docs/quality/review-checklist.md` カテゴリ 9 / `docs/design-system/README.md`（変更なし、DSR 総数不変のため）
- Decision log / ADR: 新規 entry なし。D-056（Opus 役割）/ D-079（UI 視覚系座組）を踏襲。
- owner 一次情報: `docs/Plans.md` ⑦（`:101`）、`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md`（owner 原文）、v2/v3 mockup 視認時の owner 発言（Plans.md ⑦ sub-bullet に転記）。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | `04-backbone.md` 原則 2/4、`01-decision-rules.md` DSR-01/DSR-08/DSR-22、`02-component-catalog.md` ①/⑥/⑨/⑬、`00-foundations.md`、`review-checklist.md` | updated in this PR |
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
| 新規 DSR | なし（本 packet は既存 DSR-01/DSR-08/DSR-22 の拡張のみ、DSR 総数不変のため `README.md` 索引更新は不要） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| R2-5/R3-1/R5-5 | `04-backbone.md` 原則 2/4 → `02-component-catalog.md` ⑬（具体化） | UICONV-D1 | 新規 DSR 起草案は `04-backbone.md:44`「DSR 新設なし」と矛盾するため不採用。catalog ⑬ への tone family 表追加が正しい反映先 | `02-component-catalog.md` | AC1/AC2 rg |
| なし（token 整合） | `04-backbone.md`「foundations への追記分」表 → `00-foundations.md` | UICONV-D2 | 値は 04-backbone が既に確定。DSR-22 narrow 化（badge は 3:1 対象外）により `--success-border` の 1.16:1 は登録の妨げにならないと判明し、conditional 化を撤回して無条件登録に確定 | `00-foundations.md` | AC3 rg + reviewer 実読 |
| R3-1 | `01-decision-rules.md` DSR-08（拡張） | UICONV-D3 | catalog ⑬ に新設する代替は diff が大きい。DSR-08 に既存の記号+文言併記規定があるため 1 文追加で足りる | `01-decision-rules.md`、`00-foundations.md` | AC4/AC16 rg |
| R5-5（runtime gap） | `04-backbone.md` 原則 4②、`badge.tsx:8,13` | UICONV-D4 | 廃番の枠なしは design の誤りではなく `badge.tsx` の `secondary` variant が枠色（`--border`）を上書きしないための runtime 未追随。PLU 対象外も同型 | なし（runtime lane へ申し送り） | 該当なし |
| R3-4 | `01-decision-rules.md` DSR-01（改訂） | UICONV-D5（owner 決定 B2） | 3 段階層。枠は `--border-strong`（対 `--secondary` ≈2.94:1）を検討したが owner が「くどい」と却下し `--border` を選択（DSR-22 narrow 化と同じ判断軸） | `01-decision-rules.md`、`02-component-catalog.md` ① | AC5/AC6 rg |
| R5-1 | `02-component-catalog.md` ⑨ | UICONV-D6（owner 決定 C1） | live 型も可視 Label 必須。`aria-label` は WCAG 2.5.3 により廃止（runtime lane への先送り不採用） | `02-component-catalog.md` | AC7 rg |
| R3-3 | `02-component-catalog.md` ⑥ | UICONV-D7 | Alert `warning` は `bg-warning-soft`+`border-warning`+`text-warning-strong`+icon の 4 点構造に確定（owner v4、①状態 badge と同じ視覚言語）。候補 (a)/(b)/(d) は owner 所感（(b)「一貫性に欠ける」等）により不採用、Alternatives considered として記録 | `02-component-catalog.md` | AC8 rg |
| R2-3/R2-4 | — | UICONV-D8 | design 変更なしの runtime ロジック（R2-3）と owner 未回答（R2-4）のため本 packet では扱わない | なし（Non-scope） | 該当なし |
| なし（Plan Gate 手続き） | Workflow State 補足 | UICONV-D9 | DSR-23 の番号は lane ⑧ が登録する。⑦ は DSR-01/DSR-08/DSR-22 の拡張に留める | なし（運用上の取り決め） | AC2 rg |
| R5-5 / owner v2 mockup | `01-decision-rules.md` DSR-22、`04-backbone.md` 原則4②、`review-checklist.md` | UICONV-D10（owner 決定） | badge の枠 3:1 要件を owner が「くどい」と却下し interactive な操作枠のみへ narrow 化。WCAG 1.4.11 はテキスト識別 component の境界コントラストを要求しないため、この narrow 化は規格上も正当化できる。数値要件を外しても icon 必須・soft 背景単独不可で 2026-09-03 の禁止事項は維持される | `01-decision-rules.md`、`04-backbone.md`、`review-checklist.md` | AC9/AC10/AC11 rg |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: catalog ⑬ 本文の「Why」に `04-backbone.md` 原則 4 の引用と `ProductTable.tsx` 枠不整合の実測を、DSR-22 の Why に WCAG 1.4.11 の narrow 化根拠を明記し、packet 依存を残さない設計にする。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: owner 決定 B2/C1、DSR-22 narrow 化は DSR-01/DSR-22/catalog ⑨/⑬ 本文へ昇格。新規 decision-log entry は不要（既存 D-056/D-079 座組の範囲内）。
- Assumptions and constraints: badge.tsx の①状態 outline 枠色トークン値（`border-border` → `border-border-strong`）は Lane 5（別 branch、進行中）が扱うため、①状態 tone family 表では固定値を書かず「badge.tsx の既定に従う」とした。Lane 5 merge 後に記述が古くならないか runtime lane 起票時に再確認する。
- Deferred design gaps, risk, and follow-up target: tone family 表の owner culling 列、`IntegrityCheckPage.tsx` の差異ラベル tone（owner culling で個別裁定）、destructive Alert の soft-fill 統一（対称性、後続候補、Non-scope）、badge.tsx runtime gap 一式（③強調の `border-warning` 追加を含む）、R2-3/R2-4。
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-05-ui-conventions-batch-design.md) 各行に UICONV-D 番号か DSR/catalog 節番号を付す）。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 唯一の例外は「複数系統に読める文言は表に含めず owner culling」（`IntegrityCheckPage.tsx` 差異ラベル等）のみ。Badge tone・CTA 枠・Alert warning・③強調枠の owner 決定は全て確定済みで、未決 marker は残らない。抜け道なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — docs-only | — |
| Fact check / design decision split | 適用: 発注時の前提「(a) は新規 DSR」「badge も 3:1 対象」の 2 件が owner 決定・実測により訂正された（前者は `04-backbone.md:44`、後者は owner v2 mockup 視認） | 本 packet「起票時実測」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 状態 badge・CTA・検索欄・注意文言は複数画面の主動線に影響（runtime 反映は別 packet、Human Gate は tone family 表の culling のみ、Alert/③強調は v3/v4 で確定済み） | AC-HumanGate |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner が tone family マッピング表と v3 mockup（Alert text 色 / ③強調枠）を design PR 上で culling（実機 L3 は対象外） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: `04-backbone.md` 原則 2/4 が badge の 3 種/4 段構成を既に確定しており、DSR-01/DSR-22・catalog 16 パターン・token 表の構造も既に存在。owner v2 mockup 決定で枠要件の細部（3:1 narrow 化・`--border` 選択）も確定した。
- Source docs updated in this PR: `01-decision-rules.md`（DSR-01/DSR-08/DSR-22 改訂、新規 DSR なし）/ `00-foundations.md`（`--success-border`/`--success-strong` 無条件登録 + 用途セル repoint）/ `02-component-catalog.md`（①⑥⑨⑬）/ `review-checklist.md` / `04-backbone.md`（枠記述の narrow 化 + 状態更新）。
- Design gaps intentionally deferred: tone family 表の owner culling、`IntegrityCheckPage.tsx` 差異ラベルの個別裁定、`daily-sales/components/ProductTable.tsx:133`「手動」badge の family 分類（owner culling、Plan Review round 2 追加実測）、R2-3/R2-4。
- Durable decisions discovered in this plan and promoted to source docs: owner 決定 B2（DSR-01 3 段階層 + `--border`）/ C1（SearchBar live Label + aria-label 廃止）/ DSR-22 narrow 化（badge 3:1 対象外）。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 該当なし（docs-only）。
- Backend function design: 該当なし。
- Command / DTO / data contract: 該当なし。
- Persistence / transaction / audit impact: 該当なし。
- Operator workflow / Japanese UI wording: 状態 badge・CTA・検索欄・注意文言の日本語契約は本 packet の Scope で確定、runtime 反映時に再確認。
- Error, empty, retry, and recovery behavior: 該当なし（既存契約不変）。
- Testability and traceability IDs: UICONV-D1〜D10（新規 DSR なし）。

## Contract Probe

- `--success-strong` 対 `--success-soft` の WCAG コントラスト: 独立計算 -> **8.71:1**（AA 4.5:1 を上回る）。
- `--success-border`（`#bbf7d0`）対 `--background`（`#fafaf9`）: 独立計算 -> **1.16:1**。`--warning-border`（`#fde68a`）対 `--background` も同式で **1.19:1** と一致確認（badge は DSR-22 narrow 化により 3:1 を要求されないため、この値は登録判断に影響しない）。
- `--border-strong`（`#8a8480`）対 `--secondary`（`#e7e5e4`）: 独立計算 -> **≈2.94:1**（3:1 にわずかに届かない。owner はこの数値の妥当性ではなく見た目の「くどさ」を理由に `--border` を選択した）。
- Alert `warning` の text 色候補: `--warning`（`#d97706`）対 `bg-card`（`#f5f5f4`）= **2.92:1**（AA 未達、候補 a/b/d いずれでも単独の本文色には不採用。候補 c は soft 塗り + strong text の組合せで別途 AA を満たす）、`--warning-strong`（`#78350f`）対 `bg-card` = **8.32:1**（候補 a で採用）、`--destructive`（`#b91c1c`）対 `bg-card` = **5.93:1**（既存 `destructive` variant が濃い shade を使う理由の裏取り）。
- Alert `warning` variant の形（`bg-card` 据え置き vs soft 背景）: `destructive`/`default` の既存実装を `alert.tsx` で実読し、両者とも `bg-card` 共通であることを確認済み（N/A、追加実験不要）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| UICONV-D1 catalog ⑬ 具体化（tone family 表、新規 DSR なし） | `02-component-catalog.md` | AC1/AC2 rg | non-scope（tone 適用は runtime lane） |
| UICONV-D2 `--success-border`/`--success-strong` 無条件登録 | `00-foundations.md` | AC3 rg | non-scope（token 実装は runtime lane） |
| UICONV-D3 DSR-08 増減数値の色 + foundations 用途セル repoint | `01-decision-rules.md`、`00-foundations.md` | AC4/AC16 rg | non-scope |
| UICONV-D4 badge.tsx runtime gap（記録のみ、solid pill 移行候補含む） | なし | AC10 の一部 | non-scope |
| UICONV-D5 DSR-01 3 段階層 + secondary `--border` 枠（owner B2） | `01-decision-rules.md`、`02-component-catalog.md` ① | AC5/AC6 rg | non-scope |
| UICONV-D6 SearchBar live Label + aria-label 廃止（owner C1） | `02-component-catalog.md` ⑨ | AC7 rg | non-scope |
| UICONV-D7 Alert warning variant（4 点構造で確定、owner v4） | `02-component-catalog.md` ⑥ | AC8 rg | — |
| UICONV-D9 DSR-23 は lane ⑧ が登録（本 packet は起草しない） | `01-decision-rules.md` | AC2 rg | — |
| UICONV-D10 DSR-22 narrow 化（badge 3:1 対象外、owner v2 決定） | `01-decision-rules.md`、`04-backbone.md`、`review-checklist.md` | AC9/AC10/AC11 rg | — |
| UICONV-D11 ③強調 pill 枠 `--warning`（owner v3 決定、確定済み） | `02-component-catalog.md`、`04-backbone.md`（runtime gap 記録は badge.tsx 側） | AC8 rg（border-warning hit） | non-scope（枠追加自体は runtime lane） |
| UICONV-D12 Gated Amendment 2（Human Gate 回答の canonical 反映、Writer `068c82c`） | `02-component-catalog.md`、`01-decision-rules.md` | AC17 rg（9 oracle） | — |
| S11 更新履歴 4 file | 各 file | AC12 git diff hunk | — |
| S12 Plans.md ⑦ 同期 | `Plans.md` | AC13 rg | — |
| 全体整合 | docs | AC15 `doc-consistency-check.sh --target plan` | — |
| Non-scope 遵守 | `src/**` | AC14 `git diff --name-only` | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-05-ui-conventions-batch-design.md](test-matrices/2026-09-05-ui-conventions-batch-design.md)（R2 だが Coordinator 判断で必須化、上記「Risk」節参照）。
- Human Gate に L3 は含まない（docs-only）。`cargo check --release` の Writer 完了条件は L3 が無いため非該当。

- targeted tests: 各 Scope 項目の rg exact-match presence/negative oracle（AC1〜AC16）。
- negative tests: 旧文言 0 件（「outline / ghost へ降格する。」「live 型は可視 Label を持たない設計」「可視 Label がない分」「新規 DSR-23」「Badge / outline chip も対象」「枠線（隣接背景に対し 3:1、DSR-22）」「Badge・outline chip も 3:1 対象で soft 背景だけに頼らない」の 7 negative oracle）。
- compatibility checks: 既存 DSR-04/16/21 本文、`04-backbone.md` 原則 2/4 の 3 種/4 段構成、SearchBar commit 型の記述、`--success-soft`/`--success`/`--success-emphasis` の色の値 — いずれも変更されないこと。
- data safety checks: 該当なし（DB 書込みなし）。
- main wiring/integration checks: 該当なし（route/DTO 変更なし）。`docs/Plans.md` ⑦ のリンクが本 packet basename と一致すること。

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（design-system docs の文言・token 表変更のみ）。

## Review Focus

- (a) が新規 DSR を起草しておらず、`04-backbone.md:44`「DSR 新設なし」と整合しているか。DSR-23 は lane ⑧ の帰属であることが Workflow State に明記されているか。
- catalog ⑬ の tone family 表が実在する Badge のみ（file:line 明記）から構成され、`入力中`（原則15）・`対象外`（②分類）・`有効`/`未処理`（非Badge）の誤分類が解消されているか。
- DSR-22 の narrow 化（badge は 3:1 対象外、interactive 操作枠のみ 3:1）が `04-backbone.md:20` / `review-checklist.md:86` と一貫して同期されているか。WCAG 1.4.11 の根拠づけが正確か。
- `--success-border`/`--success-strong` が無条件登録に確定しているか（conditional 化の撤回が反映されているか）。
- DSR-08 の増減数値の色追記が catalog ⑬ に重複していないか。`00-foundations.md` の用途セルが repoint されているか。
- DSR-01 の `secondary` 枠が `--border`（`--border-strong` ではない）で統一されているか。badge.tsx の②分類枠も同じ `--border` か。
- SearchBar live 型 Label 反転が commit 型を巻き込んでいないか。`aria-label` 廃止が catalog 本文で確定しているか。
- Alert warning の 4 点構造（`bg-warning-soft`+`border-warning`+icon+`text-warning-strong`、v4 確定）が①状態 badge と同じ視覚言語で書かれているか。Alternatives considered に (a)/(b)/(d) と owner の却下理由が記録されているか。destructive Alert の soft 化が Non-scope の後続候補として記録され、本 packet で実装されていないか。③強調 pill の枠色（`--warning`、v3 確定）が catalog/DSR 双方に反映されているか。
- Non-scope（`src/**`、R2-3/R2-4、Lane 4/5/⑧、`ProductListPage.tsx` 空状態 CTA、destructive Alert の soft-fill 統一）が誤って Scope に混入していないか。Alert warning（候補 c、v4 確定）・③強調 pill の枠色（`--warning`、v3 確定）を未決のまま書いていないか（Plan Review round 2 是正 — 確定済み事項を未決として残す stale wording の sweep）。

## Spec Contract

Contract ID: SPEC-UICONV-1

- catalog ⑬（①状態 tone family + badge 3 種構成、新規 DSR なし）、DSR-08（増減数値の色）、DSR-01 3 段 CTA 階層（`--border` 枠）、DSR-22 narrow 化（badge 3:1 対象外）、catalog ⑨ SearchBar live Label 反転 + aria-label 廃止、catalog ⑥ Alert warning variant（4 点構造で確定、owner v4）、`00-foundations.md` の `--success-border`/`--success-strong` 無条件登録、`04-backbone.md`/`review-checklist.md` の同期が canonical docs に反映され、`src/**` は無変更のまま。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UICONV-1 | S1 | AC1/AC2 rg | catalog ⑬ 具体化・新規 DSR なし | rg |
| SPEC-UICONV-1 | S2 | AC3 rg | success token 無条件登録 | rg |
| SPEC-UICONV-1 | S3 | AC4/AC16 rg | DSR-08 増減数値の色 | rg |
| SPEC-UICONV-1 | S4/S5 | AC5/AC6 rg | DSR-01 3 段階層 + `--border` 枠の同期 | rg |
| SPEC-UICONV-1 | S6 | AC7 rg | SearchBar Label 反転 + aria-label 廃止 | rg |
| SPEC-UICONV-1 | S7 | AC8 rg | Alert warning variant（4 点構造で確定、owner v4） | rg |
| SPEC-UICONV-1 | S8/S9/S10 | AC9/AC10/AC11 rg | checklist・04-backbone・DSR-22 の narrow 化同期 | rg |
| SPEC-UICONV-1 | S11 | AC12 git diff hunk | 更新履歴同期 | git |
| SPEC-UICONV-1 | S12 | AC13 rg | Plans.md 同期 | rg |
| SPEC-UICONV-1 | 全体 | AC14/AC15 | Non-scope 遵守・doc gate | git diff / doc-consistency-check.sh |

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

Writer（Plan Gate 通過後の canonical docs 起草担当）への申し送り: explicit-path `git add` のみ（`git add -A`/`.` 禁止）。PR body の `Reviewed Content HEAD` は `pending` のまま起票する。REQ / traceability table に触れる変更は本 packet に含まれないため `generate_traceability` 再生成は不要。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Plan Review round 1（対象 `fbbcf19`、docs-only 見本 mockup `5c3bc46`〜v4 は別 commit として維持）— 5 batch の評決の変遷:

- **batch 1（Opus reject）→ 全件 accept**: tone table の非実在文言「差異あり」削除、`入力中`→原則15、`対象外`→②分類、`反映済み`を owner 承認済み現状として gap から除外、`bg-success` 直接塗り 2 箇所を①状態移行対象に明記、`--success-border` 登録を（一時）conditional 化、`00-foundations` 用途セル repoint、DSR-01 `secondary` に `--border-strong` 枠を（一時）追加、Alert `warning` の border を `--warning` に着色し text/icon は `--warning-strong` に（一時）確定、SearchBar `aria-label` 廃止を catalog 本文で確定。
- **batch 2（Sonnet approve-with-P2）→ 全件 accept**: AC4/AC9 の anchor を bare class/count から exact sentence へ差替え（tone table 自体が `text-success-strong` を含むため旧 anchor は false positive、既存 checklist 2 行が旧 anchor `DSR-08 ≥2` を既に満たしていたため）、`04-backbone.md:53` の反映先リスト完了マーク追加、DSR-23 は lane ⑧ 帰属を明記、Alert warning のコントラスト理由（`--warning` 2.92:1 fail / `--warning-strong` 8.32:1 pass）を明記。
- **batch 3（owner が v2 mockup を視認して決定）→ batch 1 の項目 5・7 の既定を上書き**: owner 所感「`--border-strong` の枠はくどい。バッジは改める案だとすっきりする」により、DSR-22 の badge 3:1 要件を interactive な操作枠のみへ narrow 化（`04-backbone.md:20`・`review-checklist.md:86` も同期）、`--success-border` の conditional 化を撤回し無条件登録へ復帰（①状態 = 案A〈tone border〉に確定）、②分類・CTA secondary の枠を `--border-strong` から `--border` へ変更（badge.tsx / button.tsx の runtime gap 記述も追随）。Alert warning は border `--warning` + `AlertTriangle` を確定、text 色は owner「icon 付きで分かりやすい」以降 v3 mockup 待ちの 2 候補（`--warning-strong` 既定 / `--foreground` 本文+amber 枠）として両論併記。③強調 pill の枠色（`--warning-border` vs `--warning`）も v3 決定待ちで既定なしとした。
- **batch 4（owner が v3 mockup を視認して決定）→ ③強調の枠を確定、Alert text 色は再オープン**: ③強調（琥珀 pill）の枠を `--warning`（`#d97706`）に確定（対 fill `#fef3c7` = 2.86:1、対 `--background` = 3.05:1、独立計算で owner 提示値と一致）。適用 3 site（`ProductImportPreview.tsx:76`/`ProductRankingTable.tsx:80`/`BackupRestorePage.tsx:533`）を runtime gap として記録。「owner決定待ち（v3）」marker は③強調について解消、Alert text 色は解消されず — owner は候補 (b) を「すっきりするが warning らしさに欠ける」と評したため、Coordinator が新候補 (c)（soft 塗り + border/icon `--warning` + text `--warning-strong`、①状態 badge と同じ 4 点構造）と (d)（タイトルのみ強調）を追加提案し、v4 mockup で (a)/(b)/(c)/(d) の 4 候補（既定 (c)）を再提示する。marker を「owner決定待ち（v4）」へ更新。
- **batch 5（owner が v4 mockup を視認して決定、最終）→ Alert text 色を確定、全 marker 解消**: Alert `warning` variant = 候補 (c)（`bg-warning-soft` + `border-warning` + `AlertTriangle`〈icon `text-warning`〉+ 本文 `text-warning-strong`、①状態 badge と同じ 4 点構造）に確定。WCAG 独立計算で `text-warning-strong` 対 `bg-warning-soft` = **8.75:1**（owner 提示値と一致）。候補 (a)/(b)/(d) は Alternatives considered へ格下げ、(b) 不採用理由は owner 所感「すっきり見えるが警告表示としての一貫性に欠ける」。destructive Alert（`bg-card` + red 系）は現状維持、soft-fill 統一は対称性のための後続候補として Non-scope に記録（`BackupRestorePage.tsx:393` 等への影響が大きく本 packet の Goal Invariant を超える）。これにより (a) 状態 Badge tone・(b) CTA secondary 枠・(c) 検索欄 Label・(e) Alert warning の全設計判断が確定し、「owner決定待ち（vN）」marker は 1 件も残らない。
Plan Review round 2（対象 `d6b1007`）— Sonnet approve-with-P2、Opus reject → 全件 accept、本 commit で反映:

- **P1（Opus）**: (1) DSR-22 の badge 枠を「使ってよい」から「必ず持つ」へ必須化、廃番(②分類)は枠線ルールで担保 (2) `01-decision-rules.md:445,451`／`04-backbone.md:44`／`02-component-catalog.md:158` の 3:1 残存 4 箇所を追加是正し `rg -n "3:1" docs/design-system docs/quality` で全 hit を判定（badge 系は fix、操作枠系〈`00-foundations.md:18,20,21`／`04-backbone.md:29,45`〉と更新履歴〈`:460`、append-only〉は keep） (3) `catalog:588` 冒頭「両モードとも aria-label」の自己矛盾を段落全体で是正 (4) `StockStatusBadge.tsx` 実装再確認で icon 必須ルールを非中立①状態へ限定、中立行を「無彩色 soft 可・icon 任意」へ訂正 (5) `--success`/`--success-emphasis` の用途 repoint は実態が AA 是正を伴う色変更（`SummaryCardsBar.tsx` 2 site、3.16:1→8.69:1）であることを明記し AC16 を差替え (6) 1.4.11 の理由づけを「button=文字ラベル識別・塗りと枠は装飾」「badge=非interactiveのため対象外」へ精緻化 (7) AC3 の壊れた正規表現（`^| Success Soft ` が全行一致）を `-F` へ修正 (8) badge 44 件の未分類残り約 20 件を分類表として追加、「全件」の過大主張を訂正 (9) batch 5 後も残っていた stale「未決/2候補」文言（AC-HumanGate・Design Readiness・Ledger・Spec Contract・Trace Matrix 等）を sweep し確定表現へ統一 (10) 証跡 doc（`hearing-2026-09-05-stock-inquiry.sanitized.md`）の要約断定・(d-3) の設計文書引用精度を是正 (11) `PriceRevisionPage.tsx` に `AlertTitle` が無い実態を記録し runtime 申し送り。
- **P2（Sonnet）**: `button.tsx:16`→`:17`、`04-backbone.md:53`→`:52`（packet 本文 + AC10）、Matrix の `src/**` negative oracle を AC14 と同じ非パイプ pathspec 形へ統一。
Plan Review round 3（対象 `a90a872`）— Opus reject（oracle/citation mechanics のみ）→ 全件 accept、本 commit で反映:

- (1) Matrix:44 の壊れた `rg -c "^| Success Soft "`（`|` の空選択肢で全行一致）を AC3 と同じ `-F` へ修正。Matrix 全体を `-F` なし regex パターンで sweep し、他に metacharacter バグは無いことを確認（`^## DSR-23`/`^## DSR-` は意図した anchor で正しい）。
- (2) AC7/Matrix の `rg -Fc "両モードとも" = 0` は `:547,581,584` の正当な用法にも一致し unsatisfiable だったため、`:588` 冒頭の一意な文言「検索 `Input` は両モードとも」へ anchor し直す。
- (3) `rg -n "success-emphasis" src` を再実行し `text-success-emphasis` の runtime 消費者が 3 件（`SummaryCardsBar.tsx` 2 件 + `ProductImportPreview.tsx:238` の icon 用途）であることを確認。`--success-emphasis` 用途セルを「用途なし」から「増減用途は DSR-08 が置換、icon 用途 1 site（ProductImportPreview）残置」へ訂正（AC16・S2・起票時実測・DSR-08 節の計 5 箇所）。
- (4) Matrix:56,57 のオラクル文字列（「live 型も可視」「aria-label は廃止する」）が packet の確定文言（「live 型は可視」「aria-label は持たない」）と不一致だったため、packet と一致する exact literal へ差替え。
- (5) Matrix:50 の「中立 tone の①状態 badge は icon 任意」オラクルは packet:172 の記述先が `01-decision-rules.md`（DSR-22）であり catalog ではないため、対象 file を訂正。
- (6) `01-decision-rules.md:445,451` と `02-component-catalog.md:158` の 3:1 残存 3 箇所（round 2 で Scope には入れたが negative oracle が無かった）に AC11 + Matrix の負のオラクルを追加。`04-backbone.md:44` token 表の旧文言にも AC10 + Matrix の負のオラクルを追加。
- (7) `00-foundations.md:41` `--success-soft` の用途「前月比プラス soft 背景」が `:42` の用途撤去後に同一表内で矛盾するため、`--success-soft` 用途セルも「①状態 badge success tone の soft 背景 / Alert warning 型に準ずる soft 塗り」へ repoint する行を S2/AC16/Matrix に追加（値は不変）。
- (P3) Matrix の `src/**` negative oracle は「非パイプ」と称しつつ `| wc -l` を残していたため、`git diff --name-only 07302b5..HEAD -- src` の出力行数を直接見る形（パイプなし）へ訂正。
2026-09-05: Plan Gate 収束（round 3/3。round 1 = Opus reject P1 4 / Sonnet approve-with-P2 → 是正 3 便 + owner 決定 5 便 / round 2 = Opus reject P1 5 / Sonnet approve-with-P2 → 是正 `a90a872` / round 3 = Opus reject・Sonnet reject とも Matrix と packet の oracle 不一致 7 件のみで設計欠陥なし → 是正 `f7e0a04`）。round 3 の是正は同一 vendor ラリー天井のため Coordinator が該当行（Matrix `-F` 化 / `検索 `Input` は両モードとも` anchor / success-emphasis 第 3 消費者 / AC7 literal / D10b 対象 file / 3:1 負 oracle 4 本 / success-soft 用途）を直接検分して閉じた（owner 許可 2026-09-05）。`plan-draft -> plan-gate -> plan-approved -> implementing` を Plans.md ⑦ 同期の本 content commit に同乗させて遷移。Plan Commit = `fbbcf19`（plan-first commit、main `07302b5` 直上、以後の是正 commit はその子孫）。Codex ロジック・整合面 1 回は §3.3 pending のまま。

2026-09-06: Final Review round 1 = Sonnet fresh approve（AC 45 項目全通過、full doc gate ERROR 0、P3: Matrix の `差異あり` oracle が catalog:522 の無関係文に衝突）+ Opus approve-with-P2（P2: `@theme inline` alias 欠落で utility 未生成 → GA1 改訂 `e162af1` / accname は aria-label 優先 → commit 型も Label のみ / icon 規則の narrow 化を catalog ⑬・backbone へ / destructive 用途 repoint / DSR-01 に secondary の runtime gap 注記、P3: Alert 枠 token の差・tone 表 header・8.69→8.72）→ Writer 是正 `402fd4e`（alias）`b90e494`（docs）→ alias で prettier tailwind plugin が既存 3 file の class 順を並べ替え format gate fail → GA1 再改訂 `3098fbc` → 整形 `ce1b0ea`（各 file の追加 / 削除行数が一致、word-diff は既存 class の並べ替えのみ、format:check pass）、L1 full RESULT=PASS（evidence は PR body、Reviewed Content HEAD `ce1b0ea` と同一）。Coordinator が是正行を検分（alias 2 行 / `aria-label` は持たない / 中立 tone は任意 ×2 / 増減数値マイナス / DSR-01 runtime gap）し P1/P2 = 0 を確認、`implementing -> local-verified -> independent-review -> human-confirm` を Plans.md ⑦ 同期の本 content commit に同乗させて遷移、Reviewed Content HEAD = `ce1b0ea`。次 = owner Human Gate（catalog ⑬ tone 表の culling 列記入 + alias 有効化で見た目が変わる既存 4 箇所〈HomePage:66 / BackupRestorePage:358 / PluExportPage:521,567〉の視認、介入 2/3）→ Codex ロジック・整合面 1 回（§3.3 pending、9/7 夜）→ Findings Freeze → ready-hosted-final（src を含むため hosted は通常 run）。

- Findings Freeze: not yet frozen（Codex レビュー待ち）; post-freeze exceptions: none.

### Gated Amendment 1（2026-09-05、Coordinator 起票、docs gate 起源）

- 事象: Writer の docs 実装後、`bash scripts/doc-consistency-check.sh`（full）が DS3 ERROR 2 件（`--success-border` / `--success-strong` が 00-foundations に登録済みで `src/styles/globals.css` `:root` に無い）。full check は `ci.yml:327` / `local-ci.sh:193` / `pre-push.sh:217` の全部で必須のため、docs-only のままでは merge 不能。
- 裁定: token 2 行（値は 00-foundations と同一: `#bbf7d0` / `#14532d`）を `globals.css` `:root` に追加する。runtime の消費者は追加しない（消費は runtime lane）。AC14 を上記のとおり改訂。hosted CI は `src` を触るため通常 run になり、docs-only の owner dispatch は不要になる。
- 根拠: Lane 1a（PR #31）Codex P2 (2)「未実装候補の token を canonical から外す」と同じ DS3 不変条件を、今回は逆側（実装側に 2 行足す）で満たす。token 追加は挙動変更を伴わない。
- Writer commit: `cd1c2f8`（訂正、Gated Amendment 2 の是正時に誤って `068c82c` を記入していたため修正 — GA1 の Writer commit は Amendments 行のとおり `cd1c2f8`/`402fd4e`/`ce1b0ea`）
- 改訂（2026-09-06、Final Review Opus P2-1）: `:root` 2 行だけでは Tailwind 4 の utility が生成されず（`@theme inline` に `--color-*` alias が無い）、規約が名指す `text-success-strong` / `border-success-border` が無効のまま。AC14 を「計 4 行」へ改訂し、Writer が `@theme inline` に alias 2 行を追加する。既存の `text-success-strong` 消費 4 箇所（`HomePage.tsx:66` / `BackupRestorePage.tsx:358` / `PluExportPage.tsx:521,567`）が結果的に有効化される = 見た目の変化を伴うため、Human Gate で owner が当該 4 箇所を一度視認する（AC-L3 追加）。
- 再改訂（2026-09-06、Writer 停止起源）: `@theme` alias 追加後、`prettier-plugin-tailwindcss` が `success-strong` / `success-border` を theme color と認識し、既存消費者 3 file（`HomePage.tsx:66` / `BackupRestorePage.tsx:358` / `PluExportPage.tsx:521,567`）の class 文字列を並べ替えるため `format:check` が fail（L1 full `frontend-format` GATE_EXIT_CODE=1、`b90e494`）。Writer は AC14 / Non-scope（`BackupRestorePage.tsx` 名指し）に従い停止。裁定: 3 file の **prettier による class 順のみ** の整形を許容（意味変化なし、上記 oracle で機械検査）。Non-scope の `BackupRestorePage.tsx` 名指しはこの整形に限り例外。

### Human Gate 回答（2026-09-06、owner 原文 + Coordinator 転記。裁定は原文を正とする）

- 原文 1: 「反映済みは橙にしてあるならそっちに寄せるのがいいんじゃない」（取込み済み を赤でなく橙側へ、の一次反応）
- 原文 2（確定）: 「終わったから緑で終わったと教えてあげる、これ取り込み済みだよと教えてあげるのは注意に値しそうだけども。あと反映済み橙にしてるなら緑にしちゃうのもありだな、感情的にプラスの報告は緑、ちょっと待ってねって言いたくなるのは琥珀というか橙？警告したいのは赤、みたいな感情の分け方になると思う」
- Coordinator 転記（tone family 表の culling 結果）: 緑 = 感情的にプラスの報告 = 反映済み（現状 `variant="default"` 橙 → 緑へ、runtime gap に昇格）/ 補正済み / 成功 / 確認済み。琥珀 = 「ちょっと待ってね」 = 在庫少 / 未入力 N / 同日データあり / 未反映 / 部分成功 / **取込み済み**（destructive 行から warning 行へ移動）。赤 = 警告 = 在庫切れ / 取消済み / 明細取消済み。中立 = 通常 / 記録状態（有効 等）/ 入力中 / レジ未処理 / 差異ラベル 3 値。
- 規約文言（DSR-08 具体化、catalog ⑬ の tone 表冒頭へ、Writer 反映）: 「tone family は感情で分ける: 緑 = 終わったことを伝えるプラスの報告、琥珀 = 「ちょっと待って」の注意、赤 = 警告。状態の名前を伝えるだけの badge は無色」
- 注記: 琥珀は ③強調（1 位 / 最新、塗り pill）と warning（soft 背景 + 枠 + icon）で同色相を共有する。形で区別する前提、混同が見えたら owner L3 で報告（residual）。
- 次の一手（Gated Amendment 2 候補、次枠）: Writer が catalog ⑬ の表（反映済み → success 行 + runtime gap 化、取込み済み → warning 行、owner culling 列に「原文 2」を記入、冒頭の規約文言追加）と DSR-08 の対応文を更新し、Matrix の該当 oracle（反映済み の「runtime gap ではない」文 / destructive 行の 取込み済み）を改訂。Human Gate (2)（既存 4 箇所の視認）は merge 後の main build で実施に改める（owner 判断待ち）。

2026-09-06: owner Human Gate (2)（HEAD `ce1b0ea`、介入 2/3）= 途中（原文は `docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md`「⑦ PR #39 Human Gate (2) 所感 原文」）。(a) PLU 書出しは Coordinator の fixture 準備不足（「保存」は status 名で、実 button は「書き出す」。有効化条件 = `PluExportPage.tsx:731` Z004 snapshot 読込み済み かつ diff mode で未反映 > 0。fixture `tests/fixtures/z004/normal-small.csv`）→ 手順を owner に再提示、視認は再実施。owner 所感「書き出しの流れがぱっと見で分からない、バックアップは導線がしっかりしている」は PR #38 所感 (7) のページ説明セクションと同根で ④ ledger へ。(b) バックアップの緑 Alert（文字 `--success-strong` 有効化後）: owner「前の状態のほうが正解の可能性も。色学問的に OK か」→ 判断材料: 文字 #14532d on #f0fdf4 = 8.7:1（AAA）、旧状態（本文色 #1c1917 on #f0fdf4）≈ 16.8:1。同系色の tone-on-tone は輝度差が下がり「落ち着くが切れ味が落ちる」、success は緊急度が低いので tone-on-tone が定石だが、切れ味を優先するなら「枠・icon・見出しだけ緑、本文は本文色」（Alert warning で検討した (d) 型）を success にも適用できる。owner 判断待ち（⑦ Gated Amendment 2 候補に同乗）。

2026-09-06: owner 決定（原文は raw file「⑦ PR #39 緑 Alert の owner 決定 原文」）: success Alert は緑の枠 + `--success-soft` 背景 + 緑 icon が意味を担い、本文は本文色（`--foreground`）。経緯の事実（Coordinator）: 4 箇所の `text-success-strong` は既存 class で、`@theme` alias 欠落により無効 = 黒で描かれていた事故状態。⑦ の token 登録 + Final Review Opus P2-1 の alias 追加で class が有効化し緑文字が出現。owner の意識的な選択は本日が初。Gated Amendment 2（次枠）で catalog Alert 節に「success Alert の本文は本文色」を規約化し、既存 4 箇所は runtime gap（`text-success-strong` → 削除、`border-success bg-success-soft` は維持、icon に `text-success`）として記録。warning Alert（v4 (c) 本文 `--warning-strong`）を同じ規則に揃えるかは owner 確認待ち。

2026-09-06: owner 再決定（原文は raw file「⑦ PR #39 緑 Alert 保留 + 未取込み通知の owner 発言 原文」）: success Alert の本文色は **現状の緑（`text-success-strong` 有効化後）のまま運用し保留**（直前の「黒でも良い」を取り下げ、気になれば再考）。warning Alert も v4 (c) のまま。よって Gated Amendment 2 の Alert 文字色項目は不要。追加要望: ホームの「前日分が未取込みです / 最後の取込み精算日: …」通知（`HomePage.tsx:76-84` の `Alert`）と、日次 / 月次売上の「レジ日報は未取込みです」（`DailySalesPage.tsx:175`、`MonthlySalesPage.tsx:166`）を Alert warning variant（(c) soft 4 点構成）の姿に揃える → ⑦ の runtime lane の申し送りに追加（design 側は本 packet の Alert warning 規約で既にカバー、適用先の列挙のみ）。

2026-09-06: owner 決定（原文は raw file「⑦ 未取込み通知の tone の owner 決定 原文」）: ホームの「前日分が未取込みです」（`HomePage.tsx:76-84`）は **赤（destructive）のまま + icon（AlertTriangle）を追加**して警告の姿に（日次の取込み漏れは業務上まずいため警告）。日次売上 / 月次売上ページの「レジ日報は未取込みです」（`DailySalesPage.tsx:175`、`MonthlySalesPage.tsx:166`）は情報提示のため Alert warning (c) 琥珀。Coordinator 注記: 日次売上ページの文は「選んだ日付の日報が無い」の情報で、当日分の抜けを警告する役はホームが担う、という切り分け。runtime lane の申し送りに反映。

2026-09-06: owner Human Gate (2) 完了（原文「PLU 書出しの緑 Alert見たけどOKとします」、raw file 参照）。バックアップ画面の緑 Alert は保留（現状維持）、PLU 書出しの緑 Alert は OK。Human Gate (1) tone 表 culling は回答済み（感情で分ける 3 色）。**Human Gate 完了、介入 2/3 消費**。残り = Codex ロジック・整合面 1 回（§3.3 pending、9/7 夜）→ Findings Freeze → ready-hosted-final（src 含むため hosted は通常 run）。Gated Amendment 2（次枠、Writer 小 1 commit）の内容 = catalog ⑬ tone 表の culling 反映（反映済み → success 行 + runtime gap、取込み済み → warning 行、冒頭に「感情で分ける 3 色」規約文）+ DSR-08 対応文 + Matrix oracle 改訂 + runtime 申し送り（未取込み通知 3 箇所の tone、success Alert 4 箇所は現状維持）。

### Gated Amendment 2（2026-09-06、Human Gate 起源、Coordinator 起票）

- 事象: Human Gate (1) の owner culling 回答（「感情で分ける 3 色」）と Human Gate (2) の所感で、本 PR が実装済みの canonical 文言に 3 点の差分が生じた。
- 変更（Writer、docs のみ、`src` 変更なし）: (a) `02-component-catalog.md` ⑬ tone 表 — 冒頭に規約文「tone family は感情で分ける: 緑 = 終わったことを伝えるプラスの報告、琥珀 = 「ちょっと待って」の注意、赤 = 警告。状態の名前を伝えるだけの badge は無色」を追加。「反映済み」を success 行へ移し `variant="default"`（橙）→ success tone の runtime gap として記録（「owner 承認済み現状のため runtime gap ではない」文を削除）。「取込み済み」を destructive 行から warning 行へ移動（注意: もう取り込んである）。owner culling 列に原文 2（raw file「⑦ PR #39 Human Gate 回答」）を転記。(b) `01-decision-rules.md` DSR-08 — 上記規約文の要約 1 文を追加（Why: owner 回答 2026-09-06）。(c) catalog Alert 節 — 適用先の列挙に「ホーム『前日分が未取込みです』は destructive のまま AlertTriangle icon を追加（警告）、日次 / 月次売上の『レジ日報は未取込みです』は warning variant」を追記し、success Alert の本文色は現状（`text-success-strong`）を維持と明記（owner 保留）。
- Matrix / AC（drafter、Writer `068c82c` commit 後、2026-09-06 実測反映済み）: AC17 を新設し、上記 3 点の新文言 ≥1 / 旧文言（「owner 承認済み現状のため runtime gap ではない」、「owner culling 列は design PR 上で記入（AC-HumanGate、未記入）」）= 0 / destructive 行に「取込み済み」が無いこと・warning 行にはあること（row-scoped rg）の対 oracle を追加、Matrix にも同一 9 oracle を反映。
- 根拠: Human Gate の回答は本 PR の正本文言を確定させる入力であり、runtime lane へ持ち越すと正本と実装の drift になるため本 PR で反映する。
- Writer commit: `068c82c`
- Writer 判断（accepted）: owner 原文 2 を tone family 表の全 4 行（warning/success/destructive/中立）の owner culling 列へ転記した。発注は「反映済み→success 行・取込み済み→warning 行の 2 行移動」を主眼にしていたが、Writer は原文 2 が 4 tone family 全体の割当方針（緑=プラス報告/琥珀=注意/赤=警告/中立=状態名のみ）を一度に述べているため、4 行すべてに同一原文を残す判断をした。Coordinator はこれを accept する（原文は分割要約すると意味が痩せるため、4 行重複の冗長さより一次情報の保全を優先）。

2026-09-06: Gated Amendment 2（Human Gate 回答の canonical 反映）= Writer `068c82c` → 独立 Final Review（Sonnet fresh、差分 `ce1b0ea..c3a0192`）= approve（AC17 / UICONV-D12 全通過、owner 決定との一致を実読確認、P3 = 本 packet の揮発 evidence 表記 → 本 entry と同時に是正）+ Codex 前 preflight = ready。Reviewed Content HEAD を `068c82c` へ更新（docs のみの delta、src は不変）。Phase は human-confirm のまま、残り = Codex 1 回（9/7 夜）→ Findings Freeze → ready-hosted-final。
