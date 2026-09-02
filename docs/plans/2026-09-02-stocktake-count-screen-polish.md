# Plan Packet: 棚卸しカウント画面の磨き batch（disposition table 採用分）

棚卸し UX audit C1〜C10（『UIデザインの教科書』突合起源）+ PR #27 L3 owner 観察 3 件（FieldError 残留・FieldError 予約高さ・廃番商品の名前検索除外）を対象に owner disposition culling を行い、採用 8 件（S1〜S6/S8、S7 は起票時実測で見送り確定）+ Plans.md backlog L88（DSR-20 AlertDialog 系追記候補）の同乗 1 件（S9）を実装する。対象は `src/features/stocktake/StocktakePage.tsx` / `hooks/useStocktakeItems.ts` / `docs/function-design/73-ui-stocktake.md` / `docs/SCREEN_DESIGN.md` 棚卸し節 / `docs/design-system/01-decision-rules.md` DSR-20。

## Workflow State

- Phase: implementing
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 4ffa162
- Amendments: 9176a39
- Coordinator: Claude Fable 5.1（main session、conductor）
- Writer: Codex（GPT-5.6、発注書駆動、worktree isolation）
- Plan Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Fable 裁定
- Final Reviewer: Claude Sonnet 5 subagent（independent fresh context）+ Coordinator mutation 独立再実測 + Fable 裁定
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: owner Windows native L3（render oracle）

2026-09-02: Plan Review round 1（Sonnet subagent fresh context、実装ソース・Rust IO・design-system 各書と突合）= P1 2 / P2 2 / P3 0、全件 accept、是正 commit `570f2b4`（S8 既定 50 化に伴う既存 T2/T3 の `per_page` 期待値更新を明記 / S6 の live 候補は 5 画面共有 hook の定数を変えず `queryOverrides` option 方式へ + catalog ⑮ SPEC-SUGGEST-D13 追記 / REQ 引用の実測訂正 / SC1 到達手順の具体化）。round 2（同 reviewer、diff 実読 + 全文再読 + hook 実装・bindings 型・DS2/DS4 突合）= P1/P2/P3 = 0。Plan Gate 収束（介入 1/3 = disposition culling）。`plan-gate -> plan-approved -> implementing` を本 state-only commit で圧縮遷移、Plan Commit = plan-first commit `4ffa162`。

2026-09-02: Writer（Codex）が worktree isolation で content commit 1 本を積み Draft PR #30 を作成（frontend gate / `cargo check --release` / L1 full RESULT=PASS、exact SHA と evidence は PR body を正とする。mutation 自己検証は発注書どおり不実施）。Final Review round 1 = P1/P2 = 0 / P3 2、Coordinator mutation 独立再実測 11 体全 kill（Review Response 節）。`implementing -> local-verified -> independent-review -> human-confirm` を本 state-only commit で圧縮遷移（post-impl state-only 1/2）、Reviewed Content HEAD = Writer content commit。次 = owner Windows native L3（介入 2/3、PR body の 7 手順）。

2026-09-02: owner Windows native L3 run 1（PR #30 comment 5509800525、run identity = human-confirm 遷移 HEAD、content = Writer commit、`L3_SYNC` PASS）= 手順 1 PASS（CTA hierarchy）、手順 1 の途中で利用者可視 blocker を発見し fail-closed 停止（手順 2〜7 NOT RUN）、backup から棚卸し開始前へ復元済み。blocker = 数量入力欄に対して「数を保存」が下へずれて見える（S3 の常設 `min-h-5` slot を数量欄 column 内へ置いたため grid row 高さに含まれ、隣の button column の `flex items-end` が row 最下部へ揃えて予約高さぶん押し出す）。owner 追加 disposition = 一覧 filter row を左から「部門 → 表示件数 → 未入力のみ表示」へ（現状の checkbox と表示件数 Select を入れ替え）。介入 2/3 消費、次回 L3 は介入 3/3。`human-confirm -> implementing` へ state-backtrack（Reviewed Content HEAD を pending へ戻す）。是正契約は gated amendment（S3 整列契約の具体化 + S10 filter row 順序）として append-only で追記し、Writer は relay 上限到達のため Codex から Sonnet subagent（worktree isolation）へ切替（PR #28 先例）。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

介入 1/3 は起票選定（disposition culling、2026-09-02 会話）で消費済み。

## Consultation Relay

§5.5 は使わない。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
Risk Tiers R3 行のうち operator workflow（棚卸しカウントの主動線 CTA・FieldError 表示・母集団を横断的に変更する）、route/search state（一覧の表示件数・ページ状態の扱いを変更する）に該当。加えて Plan Review round 1 P1-2 是正により、5 画面（Stocktake/Disposal/ManualSale/Receiving/ReturnExchange）が共有する `src/components/patterns/useProductAddSuggest.ts` へ非破壊拡張（optional `queryOverrides` 追加）を加えるため、共有パターン touch として regression 範囲が棚卸し画面外にも及ぶ（他 4 画面は default 引数のまま呼ぶため挙動不変、`ProductAddSuggest.test.tsx` の contract test で保証）。Tauri command / DTO / bindings / DB は変更しない（AC7 で bindings 差分ゼロを機械確認）。

## 起票時実測（2026-09-02、HEAD `a1e9811` から分岐）

Coordinator が今回実読・実行した現況実測（すべて file:line 付き）:

- **S6 母集団**: `start_stocktake`（`src-tauri/src/biz/stocktake_service.rs:312-344`）は `stocktake_repo::find_stocktake_eligible_products`（`src-tauri/src/db/stocktake_repo.rs:457-464`）を呼ぶ。SQL は `SELECT product_code, stock_quantity, cost_price, is_discontinued FROM products ORDER BY product_code ASC` — `WHERE` 句なし（コメント「対象商品の取得（全商品、フィルタなし。P2-1修正済み）」`stocktake_service.rs:323`）。廃番商品は `is_discontinued=true` かつ `stock_quantity=0` のとき `actual_count=0` で自動入力されるだけで（`stocktake_service.rs:344-352`）、明細生成自体からは除外されない。**結論: 棚卸し item 母集団には廃番商品が含まれる**（S6 は Scope に残す）。
- **S6 `is_discontinued: null` の意味論**: `src-tauri/src/db/product_repo.rs:804-805`（`search_products` の動的 WHERE 構築）は `if let Some(discontinued) = query.is_discontinued { conditions.push(...) }` — `None`（TypeScript 側 `null`）のときは絞り込み条件を一切追加しない、すなわち「全件（現行品 + 廃番）」を意味する。`Some(false)` のときのみ現行品限定になる。**結論: `PRODUCT_NAME_SEARCH_QUERY.is_discontinued` を `false` → `null` に変更すれば廃番商品も候補に含まれる**（`src/lib/bindings.ts:1245` `ProductSearchQuery.is_discontinued: boolean | null` 型と整合）。
- **S7 単位情報**: `StocktakeItemDetail`（`src/lib/bindings.ts:1567-1577`）は `id / stocktake_id / product_code / name / department_name / system_stock / actual_count / counted_at / current_stock` の 9 fieldのみで、単位（`stock_unit` 相当）を持たない。`Product.stock_unit`（`bindings.ts:1173`）は商品マスタ側にのみ存在し、棚卸し明細 DTO には伝播していない。**結論: S7（数量欄の単位併記）は DTO 拡張なしには実装できない。DTO 拡張は本 packet の非目的（Non-scope）のため、S7 は見送りに確定する**。
- **S5 Badge tone の実在 variant**: `src/components/ui/badge.tsx:11-20` の `variant` は `default / secondary / destructive / outline / ghost / link` の 6 種のみで、`warning` / `success` variant は存在しない。ただし className override による semantic tone 適用は既存 canonical 実装が 2 例ある: 警告系は `StockStatusBadge.tsx:34`（`variant="outline"` + `className="border-warning-border bg-warning-soft text-warning-strong"` + `TriangleAlertIcon`）、完了系は `IntegrityCheckPage.tsx:345-348`（`className="bg-success text-primary-foreground"` + `CheckCircle2`、`variant` 省略 = default）。**結論: 新規 Badge variant を要求せず、この 2 つの既存 className パターンをそのまま再利用する**（`AlertTriangle` / `CheckCircle2` は `StocktakePage.tsx:3-4` で既に import 済み、新規 import 不要）。
- **S8 ページネーションの canonical パターン**: `docs/design-system/02-component-catalog.md` ⑩ ページネーション（`:599-641`）は「前へ / 次へ + 件数表示」を `src/features/products/components/ProductPagination.tsx`、perPage 切替を呼び出し側ページの `Select` + `PRODUCT_PER_PAGE_OPTIONS`（`src/features/products/search.ts:36`、`= [50, 100, 200] as const`）と規定済みで、「リテラル直書きせず定数を参照する」（catalog `:639`）。`ProductPagination` は既に `inventory-records`（`InventoryRecordsPage.tsx:24`）/ `stock-movements`（`StockMovementsPage.tsx:14`）/ `operation-logs`（`OperationLogsPage.tsx:20`）/ `stock-inquiry`（`StockInquiryPage.tsx:22`）の 4 画面から `@/features/products/components/ProductPagination` としてクロスフィーチャー import されている確立済みパターンで、`PRODUCT_PER_PAGE_OPTIONS` を伴う perPage `Select` の実装先例は `ProductListPage.tsx:182-204`（自 feature 内、`updateSearch({ perPage })`）。**結論: 棚卸し一覧は独自 SegmentedControl を作らず、この canonical component + 定数をそのまま stocktake feature からクロスフィーチャー import して再利用する**（値・位置は catalog 既定〈50/100/200、下側配置〉のまま変更しない。上下 2 箇所配置・40 刻み化は catalog ⑩ の配置規約・定数改訂を伴う横断変更のため次の行動 ④「UI 一覧の背骨 D」lane へ委ねる — 詳細は Non-scope）。

## Goal

Goal Invariant:

### 最小完了条件

棚卸しカウント画面（`counting` 状態）で、(a) 主動線ボタンが「数を保存」の 1 個だけ視覚的に primary（amber）である、(b) 対象商品が切り替わると前商品の数量 FieldError 表示が残らない、(c) FieldError 表示の有無で「数を保存」ボタンの位置がずれない、(d) 「対象にありません」がエラーではなく回復可能な情報として表示される、(e) 未入力バッジが件数 0 か否かで tone が変わる、(f) 商品名検索で廃番商品も候補に出る、(g) 一覧の表示件数を catalog ⑩ canonical `ProductPagination` + `Select`（50/100/200）で選べる — の 7 点が、既存の棚卸しカウント契約（UI-10-D1〜D12、73-ui-stocktake.md）を regression させずに成立する。

### 失敗定義

- 「棚卸しを確定する」または候補行「選択」が primary（`bg-primary`）のまま残る。
- 候補選択後に前商品の FieldError 文言が画面に残る。
- FieldError の出現・消失で「数を保存」ボタンの垂直位置が変化する（reserved height 未実装）。
- 「対象にありません」が `role="alert"` または `text-destructive` のまま残る。
- 未入力 0 件時と N>0 時で Badge の tone（色・アイコン）が同一のまま。
- 商品名検索で廃番商品が候補から除外されたまま（`is_discontinued: false` のまま）。
- 表示件数変更後も `page` が変更前の値のまま（1 へ戻らない）。
- 一覧のページ送りが catalog ⑩ canonical component（`ProductPagination`）を使わず、独自 markup のまま残る。
- 既存 T1〜T23（`StocktakePage.test.tsx`）/ W5〜W17（`StocktakePage.suggest.test.tsx`）/ SPEC-UIBB-1/2 が regression する。

### 非目的

- S7（数量欄の単位併記）: 起票時実測で `StocktakeItemDetail` に単位 field が無いと確定したため見送り。DTO 拡張は本 packet の非目的。
- Tauri command / DTO / bindings / DB スキーマの変更。
- 表示件数の永続化（画面内 state のみ、URL / localStorage 化しない）。
- C2 sort・C3 履歴・中止機能・確定処理中の progress feedback・カウント毎 toast・差異列色分けの追加（既存 UI-10-D3/D5/D1/D6/D9/D10 の rejected 済み判断を維持、詳細は disposition table）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 設計判断（disposition table）

棚卸し UX audit C1〜C10（PR #27 L3 owner 所感 2026-09-01/02 起源）+ PR #27 L3 owner 観察 3 件の計 13 件を owner が disposition culling（2026-09-02 会話）で裁定。

| # | 内容 | 裁定 | 採用先 / 理由 |
|---|---|---|---|
| C1 | 一覧の表示件数が多い、しかしページめくりを増やしたくない | 採用（catalog ⑩ 再利用に限定） | S8: catalog ⑩ canonical `ProductPagination` + `PRODUCT_PER_PAGE_OPTIONS` の再利用のみ。上下 2 箇所配置・40 刻み化は横断変更のため④へ委譲（Non-scope） |
| C2 | 一覧のソート追加 | 見送り | UI-10-D3 既決（主動線は検索/スキャン、並び順投資対効果低い） |
| C3 | 棚卸し履歴一覧 | 見送り | UI-10-D5 既決 + `/inventory/records` 横断合流で別経路充足済み（2026-08-27 owner 裁定） |
| C4 | primary ボタンが「棚卸しを確定する」「数を保存」「選択」の 3 種同時存在 | 採用 | S1: 主動線を「数を保存」1 個に統一（DSR-01） |
| C5 | 数量欄の空欄送信ガード | 既済 | PR #27（wave 8 lane 2、squash `e4382b0`）で実装済み、本 packet 対象外 |
| C6 | リアルタイム検証 | 見送り | Q6-①「即時検証が要るほど誤入力頻度が高いか」の条件未充足、ST-C5-D1 維持 |
| C7 | 確定処理中のフィードバック不足所感 | 見送り | owner 判断（2026-09-02）: 「体感待ちなし、件数増で 1 秒超なら progress を検討、処理高速化に投資する方が良い」。backlog へ実測要望を追加 |
| C8 | 「対象にありません」が destructive 表示 | 採用 | S4: `role="status"` + `text-muted-foreground` + `Info` icon へ是正 |
| C9 | 未入力 Badge が件数 0 でも同一 tone | 採用 | S5: N>0 warning tone / N=0 success tone |
| C10 | 数量欄に単位併記 | 見送り（起票時実測で確定） | S7: `StocktakeItemDetail` に単位 field なし、DTO 拡張は非目的 |
| PR27-1 | live 候補選択後に前商品の FieldError 残留 | 採用 | S2: `selectItem` で `setFieldError(null)` |
| PR27-2 | FieldError 出現で「数を保存」ボタンが下へずれる | 採用 | S3: FieldError slot 常時 render + `min-h-5` |
| PR27-3 | 廃番・在庫あり商品が名前検索候補から除外される | 採用 | S6: `is_discontinued: null` + 候補行に廃番 Badge |

上記 13 件とは別に、Plans.md backlog L88（DSR-20 AlertDialog 系追記候補）を同乗（S9）。

## Scope

**S1: primary CTA 1 個化（DSR-01、C4）**

`StocktakePage.tsx` の counting 画面で、`default`（primary/amber）variant のボタンが同時に 3 種存在する: 「棚卸しを確定する」（`StocktakePage.tsx:289-298`、`variant` prop なし = default）、「数を保存」（`:647-654`、`variant` prop なし = default）、候補行「選択」（`:592-599`、`size="sm"` のみで `variant` prop なし = default）。主動線 = 「数を保存」のみを primary として残し、他 2 個を `variant="outline"` へ降格する（位置は現状維持）。未開始画面の「棚卸しを開始する」（`:351-354`）は同一画面に他の primary が無いため無変更。「対象を確認」（`:559-562`）は既に `variant="outline"` のため無変更。

**S2: FieldError 残留是正（PR27-1）**

`selectItem(item: StocktakeItemDetail)`（`StocktakePage.tsx:431-437`）は `setSelectedItem` / `setQuantity` / `setCandidates([])` / `setTargetMessage(null)` は行うが `setFieldError(null)` を呼ばない。これが呼ばれる全経路（`resolveItem` の `find_stocktake_item` 直接解決成功 `:449`、`resolveItem` の商品名検索フォールバック単一候補時の自動選択 `:470`、`selectCandidate` 経由の候補選択 `:484`）すべてで、対象商品を切り替えたのに前商品の数量 FieldError が画面に残留する。是正: `selectItem` の先頭に `setFieldError(null);` を追加する（対象切替経路の単一集約点であるため、呼び出し側個別の修正より漏れが出ない）。

**S3: FieldError 予約高さ（PR27-2）**

数量入力欄の FieldError 表示（`StocktakePage.tsx:640-644`）は `fieldError !== null` のときだけ `<p role="alert">` を render する条件分岐で、grid（`md:grid-cols-[1fr_12rem_auto]`、`:610`）の各列は独立した高さを持つため、エラー出現時に「数を保存」ボタン（3列目、`:646-655`）が下へずれる。是正: エラー表示スロットを常時 1 個の wrapper で render し、高さを固定する:

```tsx
<div className="min-h-5" aria-live="polite">
  {fieldError !== null ? (
    <p className="text-sm text-destructive" role="alert">
      {fieldError}
    </p>
  ) : null}
</div>
```

`min-h-5`（1.25rem/20px）は `text-sm` の line-height と一致させる。`role="alert"` は従来どおりエラー発生時のみ mount し、毎回のエラー切替で読み上げが再発火する既存挙動（DSR-03「毎試行置換」）を維持する。

**S4: 「対象にありません」の tone 是正（C8）**

73 §73.9 は「エラー扱いにせず次の入力を受け付ける」と明記するが、実装（`StocktakePage.tsx:566-570`）は `text-destructive` の `<p role="alert">` で destructive 表示になっている（doc↔実装 drift）。是正: `role="status"` + `text-muted-foreground` + `Info`（lucide-react、新規 import — 既存 import 群 `AlertTriangle, CheckCircle2, ClipboardCheck, Loader2, RotateCcw, Search`〈`:3-9`〉のアルファベット順で `ClipboardCheck` と `Loader2` の間に挿入）+ flex layout（icon + text）へ変更する:

```tsx
{targetMessage !== null ? (
  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground" role="status">
    <Info aria-hidden="true" className="size-4" />
    {targetMessage}
  </p>
) : null}
```

文言（「この商品は棚卸しの対象にありません。...」）は無変更。DSR-08（色は二次シグナル）/ DSR-11（空状態・回復導線）準拠。

**S5: 未入力 Badge の状態表現（C9）**

進捗 header の Badge（`StocktakePage.tsx:379`、`<Badge variant="secondary">未入力 {progress.uncounted_items}</Badge>`）は件数 0 でも同一 tone。起票時実測（上記）で確認した既存 2 パターンをそのまま再利用し、N>0 は warning tone、N=0 は success tone へ分岐する:

```tsx
{progress.uncounted_items > 0 ? (
  <Badge variant="outline" className="border-warning-border bg-warning-soft text-warning-strong">
    <AlertTriangle aria-hidden="true" />
    未入力 {progress.uncounted_items}
  </Badge>
) : (
  <Badge className="bg-success text-primary-foreground">
    <CheckCircle2 aria-hidden="true" />
    未入力 {progress.uncounted_items}
  </Badge>
)}
```

文言「未入力 {N}」は維持。`AlertTriangle` / `CheckCircle2` は既存 import を再利用（新規 import 不要）。

**S6: 廃番商品の名前検索包含（PR27-3、母集団整合、共有 live-suggest hook を非破壊で拡張）**

Plan Review round 1 P1-2 是正: `src/components/patterns/useProductAddSuggest.ts:9-16` の `PRODUCT_SEARCH_QUERY`（`is_discontinued: false` 固定）は棚卸しの live 候補プレビューだけでなく `Disposal` / `ManualSale` / `Receiving` / `ReturnExchange` の商品追加欄が共有する定数で、`src/components/patterns/ProductAddSuggest.test.tsx:139-147`（S1）が default 挙動をリテラル `is_discontinued: false` を含む完全一致で契約テストしている。この共有定数を直接書き換えると 4 画面すべての live 候補が廃番を含む方向へ変わり、販売・入庫等では廃番を候補にしない既存業務判断（`ProductAddSuggest.test.tsx:139-147` の default が正）を壊す。よって以下のとおり非破壊で拡張する:

(a) 商品名検索フォールバック（`resolveItem` 内、`PRODUCT_NAME_SEARCH_QUERY`、`StocktakePage.tsx:99-106`）の `is_discontinued: false` は起票時実測（上記）に基づき `is_discontinued: null` へ変更する（全件 = 現行品 + 廃番）。これは棚卸し画面ローカルの定数で、他画面に影響しない。

(b) 共有 hook `useProductAddSuggest.ts` の `PRODUCT_SEARCH_QUERY`（`:9-16`）自体は変更しない。`UseProductAddSuggestOptions`（`:17-21`）へ任意 `queryOverrides?: Partial<ProductSearchQuery>` を追加し、`loadSuggestions` 内の `commands.searchProducts({ ...PRODUCT_SEARCH_QUERY, keyword: query })`（`:86`）を `commands.searchProducts({ ...PRODUCT_SEARCH_QUERY, ...queryOverridesRef.current, keyword: query })` へ変更する。`onSelect` / `isLocked` と同じ ref 経由パターン（`:56-60` の `useEffect` 同期ブロック）で `queryOverridesRef` を追加し、`queryOverrides` 未指定時は `PRODUCT_SEARCH_QUERY` のみのマージ（= 従来と byte-identical な挙動）になることを保証する。`StocktakePage.tsx` の `useProductAddSuggest` 呼び出し（`:414-418`）だけが `{ queryOverrides: { is_discontinued: null } }` を渡し、他 4 画面（`Disposal` / `ManualSale` / `Receiving` / `ReturnExchange`）の呼び出しは無変更のまま既定の `is_discontinued: false` を使い続ける。

(c) 商品名検索フォールバックの候補テーブル（`:585-602`）と live 候補プレビュー（`ProductAddSuggest`）双方に廃番 Badge を追記する。`candidates` の型は `ProductWithRelations[]`（`is_discontinued: boolean` を `Product` から継承、`bindings.ts:1174,1298-1302`）ですでに保持しているため、候補行の商品名セルへ既存 catalog パターン（`docs/design-system/02-component-catalog.md:157` `{item.is_discontinued && <Badge variant="secondary">廃番</Badge>}`）と同型で追記する:

```tsx
<TableCell>
  {candidate.name}
  {candidate.is_discontinued ? (
    <Badge variant="secondary" className="ml-2">廃番</Badge>
  ) : null}
</TableCell>
```

Scope に含む touched files: `src/components/patterns/useProductAddSuggest.ts`（+ その test file `useProductAddSuggest` を直接 exercise する既存 test、および `ProductAddSuggest.test.tsx`）。

**S7: 数量欄の単位併記 — 見送り（起票時実測で確定）**

上記「起票時実測」節のとおり `StocktakeItemDetail` に単位 field が無いため実装しない。Non-scope へ記録。

**S8: 表示件数の選択 + catalog ⑩ canonical pagination への統一（C1、catalog ⑩ 再利用に限定）**

現行の一覧ページ送り（`StocktakeItemList`、`:775-799`）は「前へ」「次へ」ボタンと「n / N ページ」表示を画面ローカルに手書きした markup で、catalog ⑩（`docs/design-system/02-component-catalog.md:599-641`）の canonical `ProductPagination` を使っていない。表示件数も `hooks/useStocktakeItems.ts:9` の `STOCKTAKE_PER_PAGE = 200` 固定 const で選択肢がない。

owner 所感「表示件数が多い」への是正は、**catalog ⑩ の再利用のみ**に限定する（ページ送りの上下 2 箇所配置・perPage を 40 刻みにする変更は catalog ⑩ の配置規約・共有定数そのものの改訂を伴う横断変更のため、次の行動 ④「UI 一覧の背骨 D」lane へ委ねる。詳細は Non-scope）。

- `hooks/useStocktakeItems.ts:9` の `STOCKTAKE_PER_PAGE = 200` 固定 const を撤去し、`useStocktakeItems(stocktakeId: number | null, search: StocktakeSearch, perPage: number)` へ signature を変更する（`queryKeys.stocktake.items(...)` の `perPage` は引数をそのまま渡す。IO 側 `PAGINATION_MAX_PER_PAGE` による 200 クランプは不変）。
- `StocktakePage.tsx` に画面内 state `const [perPage, setPerPage] = useState<(typeof PRODUCT_PER_PAGE_OPTIONS)[number]>(50)` を追加し（`PRODUCT_PER_PAGE_OPTIONS` は `@/features/products/search` からクロスフィーチャー import — `ProductPagination` と同型の既存 4 画面先例〈起票時実測〉に倣う）、`useStocktakeItems(activeStocktakeId, effectiveSearch, perPage)` へ渡す。既定値は catalog の最小選択肢 `50`（owner が口頭で挙げた「40」は既存の共有定数 `PRODUCT_PER_PAGE_OPTIONS` を変更することになり全画面へ影響するため今回は採用せず、④ lane 候補として Non-scope へ記録）。永続化しない（URL / localStorage 不使用）。
- `StocktakeItemList`（`:671-802`）から現行の手書きページ送り markup（`:775-799`）を削除し、`ProductPagination`（`src/features/products/components/ProductPagination.tsx`、`@/features/products/components/ProductPagination` からクロスフィーチャー import）を `page={page} perPage={perPage} totalCount={totalCount} onPageChange={...}` で置き換える（`totalPages`/`canPrev`/`canNext` は component 内部で計算するため、現行 `:680` の `pageCount` ローカル計算は撤去可）。配置は現行どおり表の下のまま変更しない。
- `perPage` 切替 UI は `ProductListPage.tsx:182-204` の先例（`Select` + `SelectTrigger id="product-per-page"` + `PRODUCT_PER_PAGE_OPTIONS.map(...)`、`{option} 件` ラベル）と同型で `StocktakeItemList` のフィルタ行（部門フィルタ + 未入力のみ toggle、`:690-715`）に追加する。`id` は `stocktake-per-page` など画面固有にする（`product-per-page` との重複回避）。
- `StocktakeItemList` は `perPage: (typeof PRODUCT_PER_PAGE_OPTIONS)[number]` / `onPerPageChange: (value: (typeof PRODUCT_PER_PAGE_OPTIONS)[number]) => void` props を新規に受け取る。
- 表示件数変更時は `onPerPageChange(next)` に加えて `onSearchChange((prev) => ({ ...prev, page: 1 }))` を呼び、`page` を 1 へ戻す。
- Plan Review round 1 P1-1 是正: 既定 `perPage` を `200` → `50` に変更するため、`getStocktakeItems` の `per_page` 引数を旧既定 `200` で assert している既存 test を新既定に合わせて更新する（削除・skip ではなく期待値更新）。対象は `StocktakePage.test.tsx:217`（T2 `expect(mockGetItems).toHaveBeenCalledWith(77, null, null, 1, 200)` → `..., 1, 50)`）と `:232`（T3 `expect(mockGetItems).toHaveBeenLastCalledWith(77, 1, false, 1, 200)` → `..., 1, 50)`）の 2 箇所。73 §73.6 の表示件数行（下記 docs 是正）の既定値記述と同期する。

**S9: DSR-20 AlertDialog 系追記（同乗、Plans.md backlog L88）**

`docs/design-system/01-decision-rules.md` DSR-20（`:392-410`）「硬化手段」bullet（`:405`）の直後に、AlertDialog 系の型制約を追記する（下記「docs 是正」節、verbatim）。根拠: `node_modules/@radix-ui/react-alert-dialog/dist/index.d.mts:23` `interface AlertDialogContentProps extends Omit<DialogContentProps, 'onPointerDownOutside' | 'onInteractOutside'>` — AlertDialog は Radix の型定義そのものが外側クリック系 prop を受け付けない（Dialog と異なり、外側クリックは prop 無しで常に非 dismiss）。硬化に使えるのは `onEscapeKeyDown` のみ。DSR 番号は増やさない（既存 DSR-20 の追記）ため DS2（DSR 参照整合）/ DS4（review-checklist カテゴリ 9 の DSR 対応）は影響を受けない — 両者とも「DSR ID の新規定義・参照」を検査対象とし、既存 DSR-20 の本文追記はどちらの検査対象でもない。

### Gated Amendment 1（2026-09-02、L3 run 1 起源）

owner Windows native L3 run 1（PR #30 comment 5509800525、詳細は Workflow State 2026-09-02 節参照）は手順 1 の途中で利用者可視 blocker を検出し fail-closed 停止した（手順 2〜7 NOT RUN）。本 amendment は同 blocker の是正契約（S3 追加是正）と owner 追加 disposition（S10 新設）を append-only で定義する。Writer は本節を Scope 本体の一部として適用し、既存 S1〜S9 の記述は変更しない。

**S3 追加是正: 整列契約の具体化（PR27-2 追加是正）**

現状の機序: 数量入力欄の grid（`md:grid-cols-[1fr_12rem_auto]`、`StocktakePage.tsx:648`）の第 2 列（数量欄 column、`:659-685`）は `Label` + `Input` + 常設 FieldError slot（`min-h-5`、`:678-684`）の 3 要素を縦積みし、第 3 列（button column、`:686-695`）は `flex items-end`（`:686`）で row 最下部へボタンを揃える。S3 実装済みの常設 slot（`min-h-5`、20px 予約）が数量欄 column の高さに常に加算されるため、button column が `items-end` で揃える row 最下部が slot 分だけ下がり、「数を保存」ボタンが数量入力欄に対して視覚的に下へずれる（owner Windows native L3 run 1 blocker）。

契約の具体化: 既存契約（FieldError の出入りで「数を保存」の位置が動かない、S3 原文）に加え、**ボタンは数量入力欄と垂直に整列する**（新規）。実装方針は Writer 裁量とし、以下いずれかを候補とする:

(a) button column にも同じ `min-h-5` の空 slot を持たせて両 column の行構造を揃え、`items-end` を `items-start` へ変更する。
(b) FieldError slot を grid 行の外（入力行の下に全幅の別行）へ出し、grid 自体の高さが FieldError の有無に左右されない構造にする。
(c) button column を `items-start` にし、`Label` 分の高さを `mt-*` 等で offset する。

いずれの方針でも `aria-live="polite"` と `role="alert"`（エラー発生時のみ mount、DSR-03「毎試行置換」）は維持する。

AC-L3-2 の具体化: 「エラーの有無にかかわらずボタン上端が入力欄（`Input`）上端と揃う」を視認基準に追加する（元の「垂直位置が変化しない」は維持、下記 Acceptance Criteria 節に追記）。

Matrix 追加（詳細は `test-matrices/2026-09-02-stocktake-count-screen-polish.md` 側に反映）: `SC3b` = DOM 構造で契約を検査できる最小 oracle。案(a) 採用時はボタン column に予約 slot（`min-h-5`）が存在すること、案(b) 採用時は FieldError slot が入力行 grid の外にあることを assert する。Matrix には両案の oracle を記載し、Writer が採用した方を実装し他方は N/A 記録とする。既存 SC3（FieldError 出入りでのボタン位置不変）は維持する。mutation `X3b` = 整列手段の撤去（`items-end` 復帰 / 追加した空 slot・行外だしの撤去）→ SC3b kill。render oracle は L3（AC-L3-2）。

**S10 新設: 一覧 filter row 順序（owner disposition、L3 run 1 追加所感）**

現状の DOM 順序: `StocktakeItemList` の filter row（`StocktakePage.tsx:733-784`）は 部門フィルタ（`DepartmentFilter`、`:734-742`）→ 「未入力のみ表示」`Checkbox`（`:743-757`）→ 表示件数 `Select`（`:758-783`）の順。

是正後の順序: 部門フィルタ → 表示件数 `Select` → 「未入力のみ表示」`Checkbox`。実装は `:743-757`（checkbox block）と `:758-783`（per-page block）の JSX 順序を入れ替えるのみで、各 block 内部（`id`/`htmlFor`/`aria-*` の対応）は変更しない。

73 §73.6 docs 是正提案（verbatim、次回 Writer が `docs/function-design/73-ui-stocktake.md` の「表示件数」行末に追記する）:

> filter row 内の並び順は 部門フィルタ → 表示件数 → 未入力のみ表示。

73 更新履歴表への追記（verbatim、最上段の既存 2026-09-02 行の直後に新規行として追加、または既存最上段行への追記いずれでも可 — 既存行 shape に合わせるのは Writer 裁量）:

> 内容列: Gated Amendment 1（owner Windows native L3 run 1、PR #30 comment 5509800525）。S3 に整列是正（ボタン上端を入力欄上端と揃える）を追加、S10 として一覧 filter row 順序を 部門→表示件数→未入力のみ表示 へ変更。

SCREEN_DESIGN.md 同期要否: `docs/SCREEN_DESIGN.md:195`（「一覧は進捗管理用（部門フィルタ + 未入力のみ toggle + 入力済み/全件の進捗表示、UI-10-D3）」）は列挙のみで filter row の並び順を明言しておらず、表示件数にも触れていない。並び順の主張が現状存在しないため同期不要。

Matrix 追加: `SC10` = filter row 内の DOM 順序を 部門 Select の label → 表示件数 Select の label/trigger → 「未入力のみ表示」checkbox の順に `compareDocumentPosition` または container 内 index で assert する（oracle は文言 literal の独立転記）。mutation `X10` = checkbox と表示件数 Select の順序を戻す → SC10 kill。AC-L3-8 として owner 視認項目を追加する。

## Non-scope

- S7（数量欄の単位併記）: `StocktakeItemDetail` に単位 field が無いため実装不能。DTO 拡張は非目的。
- C2 一覧ソート追加（UI-10-D3 既決）。
- C3 棚卸し履歴一覧（UI-10-D5 既決 + `/inventory/records` 横断合流で別経路充足）。
- C6 リアルタイム検証（Q6-① 条件未充足、ST-C5-D1 維持）。
- C7 確定処理中の progress feedback（owner 判断 2026-09-02、backlog へ「確定処理の所要時間を件数増で実測」を追加）。
- 棚卸しの中止機能（UI-10-D1 既決）。
- カウント毎 toast（§73.5 既決）。
- 差異列色分け（UI-10-D10 既決）。
- Tauri command / DTO / generated bindings / DB スキーマの変更（AC7 で bindings 差分ゼロ機械確認）。
- 表示件数の永続化（画面内 state のみ）。
- ページ送りの表上下両配置（catalog ⑩ の配置規約改訂 + 全一覧画面〈`inventory-records` / `stock-movements` / `operation-logs` / `stock-inquiry` / `products`〉一括適用を伴う横断変更。次の行動 ④「UI 一覧の背骨 D」lane 候補、owner 所感 2026-09-02 起源）。
- perPage 選択肢の 40 刻み化（`PRODUCT_PER_PAGE_OPTIONS = [50, 100, 200]` は複数画面が共有する定数のため、変更すると全画面の表示件数選択肢に影響する。次の行動 ④「UI 一覧の背骨 D」lane 候補、owner 所感 2026-09-02 起源）。

## 73 / SCREEN_DESIGN / DSR-20 docs 是正（提案 verbatim、Plan Reviewer は本節の文面を精査対象にする — Writer は本節をそのまま適用する）

**`docs/function-design/73-ui-stocktake.md` UI-10-D2 節、「契約監査追記2」の直後に追加する段落**（見出しレベル・書式は既存の契約監査追記と同型）:

> **契約監査追記3（本 PR、UI ガッツリ整えターン disposition culling 起源）**: 3 点を是正する。①`selectItem` が対象切替時に `setFieldError(null)` を呼ばず、live 候補選択・商品名検索フォールバックの単一候補自動選択を経由した場合に前商品の数量 FieldError が残留していた（PR #27 L3 owner 観察 2026-09-02）。対象商品が切り替わる全経路の集約点である `selectItem` へ `setFieldError(null)` を追加して是正する。②§73.9 の「対象にありません」はエラー扱いにしない契約だが、実装は `role="alert"` + `text-destructive` の destructive 表示になっていた（doc↔実装 drift）。`role="status"` + `text-muted-foreground` + `Info` icon の情報系表示へ是正する（DSR-08/DSR-11 準拠）。③商品名検索フォールバック（`PRODUCT_NAME_SEARCH_QUERY`）が `is_discontinued: false` 固定のため、棚卸し item 母集団（廃番商品を含む、§73.1 issue #91 回答済み）と商品コード/JAN 完全一致検索（`find_stocktake_item`、母集団の制限なし）には存在する廃番商品が、名前検索経路だけ候補から漏れる非対称があった（PR #27 L3 owner 観察 2026-09-02）。名前検索フォールバックの `PRODUCT_NAME_SEARCH_QUERY`（棚卸し画面ローカル）は `is_discontinued: null`（`ProductSearchQuery` の `None` は「全件、フィルタなし」を意味する、`product_repo.rs:804-805` 実読で確定）へ変更する。live 候補プレビュー（catalog ⑮）側は 5 画面共有の `useProductAddSuggest.ts` の default `PRODUCT_SEARCH_QUERY`（`is_discontinued: false`）を直接変更せず、新設の optional `queryOverrides`（catalog ⑮ SPEC-SUGGEST-D13、下記 docs 是正）で棚卸し画面だけ `{ is_discontinued: null }` を渡す（他 4 画面は default のまま廃番を除外し続ける）。両経路の候補行に廃番 Badge（catalog `02-component-catalog.md:157` と同型）を追記して是正する。

**`docs/function-design/73-ui-stocktake.md` §73.6 の表、「並び順」行の直後・「0 件表示」行の直前に追加する行**:

> `| 表示件数 | catalog ⑩ canonical \`ProductPagination\`（\`docs/design-system/02-component-catalog.md\` §⑩）+ \`PRODUCT_PER_PAGE_OPTIONS\`（50/100/200、既定 50）の \`Select\`。変更時は \`page\` を 1 へ戻す。IO 側 200 クランプ（\`PAGINATION_MAX_PER_PAGE\`）は不変。配置は表の下（catalog 既定）のまま。 |`

**`docs/function-design/73-ui-stocktake.md` §73.10、「主動線 CTA は 1 個（DSR-01）」文の置換後の全文**（既存 1 文の書き換えのみ、直後の確定ダイアログ文は無変更）:

> 主動線 CTA は 1 個（DSR-01）。counting 画面の primary は「数を保存」のみとし、「棚卸しを確定する」「選択」（候補行）は `variant="outline"` へ降格する（本 PR、UI-10-D2 契約監査追記3）。未開始画面の「棚卸しを開始する」は同一画面に他の primary が無いため引き続き primary。状態は色だけで表さず、「入力済み」「未入力のみ表示」「未入力 N」等の日本語ラベル + アイコンを主情報にする（DSR-08）。未入力 Badge は件数 0 で success tone（`bg-success` + `CheckCircle2`）、1 件以上で warning tone（`border-warning-border bg-warning-soft text-warning-strong` + `AlertTriangle`）に分岐する（本 PR）。

**`docs/function-design/73-ui-stocktake.md` 末尾の更新履歴表、最上段に追加する行**:

内容列: UI ガッツリ整えターン disposition culling（棚卸し UX audit C1/C4/C8/C9/C10 + PR #27 L3 owner 観察 3 件）を消化。UI-10-D2 契約監査追記3（FieldError 残留是正・「対象にありません」情報表示化・廃番商品の名前検索包含）+ §73.6 表示件数行（catalog ⑩ 再利用）+ §73.10 主動線 CTA / 未入力 Badge tone 記述更新。C10（単位併記）は起票時実測で `StocktakeItemDetail` に単位 field が無いと確定し見送り。

**`docs/SCREEN_DESIGN.md` 棚卸し画面節（L190-201）、「利用者配慮」箇条書きの最終行（「詳細な command contract...」の直前）に追加する行**:

> - 主動線ボタンは「数を保存」の 1 個のみを primary にし、対象商品切替時の入力検証エラー・「対象にありません」表示・未入力件数バッジの視覚 tone を是正する（UI ガッツリ整えターン disposition culling、本 PR）。表示件数は catalog ⑩ canonical pagination（50/100/200）から選べる。

**`docs/design-system/01-decision-rules.md` DSR-20、「硬化手段」bullet（`:405`）の直後に追加する bullet**（既存 bullet 形式と同型）:

> - **AlertDialog 系の制約**: `AlertDialogContent`（`radix-ui` 経由の `@radix-ui/react-alert-dialog`）は `AlertDialogContentProps extends Omit<DialogContentProps, 'onPointerDownOutside' | 'onInteractOutside'>`（`node_modules/@radix-ui/react-alert-dialog/dist/index.d.mts:23`）のため、そもそも `onPointerDownOutside` / `onInteractOutside` を受け付けない。AlertDialog の外側クリックは prop 無しで常に非 dismiss（primitive 既定、PR #25 gated amendment `2433199` で実証済み）であり、AlertDialog 系で使える明示硬化手段は `onEscapeKeyDown` の `preventDefault()` のみである（通常の `Dialog` と異なる）。

**`docs/design-system/01-decision-rules.md` 更新履歴表、最上段に追加する行**:

内容列: DSR-20 に AlertDialog 系の制約（Radix `AlertDialogContentProps` が `onPointerDownOutside` / `onInteractOutside` を型 Omit するため、硬化手段は `onEscapeKeyDown` のみが対象になる）を追記。Plans.md backlog（PR #25 gated amendment `2433199` 起源）の同乗解消。

**`docs/design-system/02-component-catalog.md` ⑮ 商品追加欄 live 候補プレビュー、D12（`:866`）の直後に追加する bullet**（Plan Review round 1 P1-2 是正: 共有 hook `useProductAddSuggest.ts` へ optional `queryOverrides` を追加するため、SPEC-SUGGEST 凍結正本〈D1〜D12〉に新規 D13 を追加する。D1〜D12 の本文・意味論は無変更）:

> - D13 = SPEC-SUGGEST-D13（画面別クエリ上書き、本 PR 追加）: hook は optional `queryOverrides?: Partial<ProductSearchQuery>` を受け取り、suggest fetch のクエリを `{ ...PRODUCT_SEARCH_QUERY, ...queryOverrides, keyword }` としてマージする。`queryOverrides` 未指定時は `PRODUCT_SEARCH_QUERY`（D3 の `per_page 5` を含む既定値）のみが使われ、既存 5 画面の挙動と byte-identical のまま変わらない。棚卸し（UI-10-D2）は `{ is_discontinued: null }` を渡し、名前検索候補に廃番商品を含める（棚卸し item 母集団に廃番が含まれる契約、§73.1、との整合）。取引 4 画面（入庫 61 / 手動販売 62 / 返品・交換 63 / 廃棄・破損 64）は `queryOverrides` を渡さず、廃番を候補から除外する既存業務判断を維持する。D1〜D12 の契約意味論（二層構造・Enter 分岐・IME・破棄条件等）は変更しない。

**`docs/design-system/02-component-catalog.md` ⑮ D8（`:862`）の置換後の全文**（棚卸しの override 使用を明記する 1 文を追記、既存文の残り部分は無変更）:

> D8（棚卸し）: 棚卸しの suggest fetch は `searchProducts`（部分一致）を用い、`queryOverrides: { is_discontinued: null }`（D13）で廃番商品も候補に含める。候補確定は既存 UI-10-D2 の `find_stocktake_item` 経由で棚卸し対象化する。UI-10-D11 の focus 遷移契約（解決成功で数量欄へ）は候補確定経由でも同一に発火する。候補確定後に `find_stocktake_item` が稀に `None` を返す場合は既存 `selectCandidate` の無言 no-op 挙動をそのまま継承する（既知の pre-existing gap、本 change の scope 外）。

## Acceptance Criteria

- AC-L3-1（S1、render oracle、Plan Review round 1 P2-2 是正で到達手順を訂正）: `StocktakePage.tsx` counting 画面で、(i) 商品を選択済みの状態から別の検索語で複数候補が返り、候補テーブルと「数を保存」欄が共存する状態（`resolveItem` は 0 候補時のみ `selectedItem` をクリアし〈`:458`〉、複数候補時は `selectedItem` を保持したまま `setCandidates` する〈`:473`〉ため到達可能）で、amber の primary ボタンが「数を保存」の 1 個だけであることを owner が視認確認する。「棚卸しを確定する」「選択」（候補行）は outline 見た目である。(ii) 商品を未選択のまま複数候補だけが表示されている状態（`selectedItem === null`）では primary ボタンは 0 個が正しい挙動であり、1 個であることを求めない。
- AC1（S2）: `SC2` green — live 候補選択で前商品の FieldError が消え、新商品名が表示される。
- AC-L3-2（S3、render oracle）: `StocktakeCountEntry` の FieldError の出現・消失で「数を保存」ボタンの垂直位置が変化しないことを owner が視認確認する。
- AC-L3-3（S4、render oracle）: 「対象にありません」表示が赤色でなく `Info` アイコン付きの通常トーンで表示されることを owner が視認確認する。
- AC-L3-4（S5、render oracle）: 未入力 N>0 で警告色 + `AlertTriangle`、N=0 で完了色 + `CheckCircle2` の Badge を owner が視認確認する。
- AC2（S6）: `SC6` green — 商品名検索フォールバックで廃番商品が候補に出る（`is_discontinued: null`）+ 候補行に「廃番」Badge が出る。`SC6b` green — live 候補プレビュー側は `queryOverrides` 未指定の他 4 画面で `is_discontinued: false` の既定挙動が不変、棚卸しのみ override 適用で廃番を含む。
- AC-L3-5（S8、render oracle）: 一覧のページ送りが catalog ⑩ canonical `ProductPagination`（「前のページ」/「次のページ」`aria-label`、outline ボタン）で表示され、表示件数 `Select`（50/100/200 件）が選べることを owner が視認確認する。
- AC3（S8）: `SC8a`/`SC8b`/`SC8c'` green — 既定 50 件、変更時に `page` が 1 へ戻る、canonical component が実際に render される（独自 markup が残っていない）。
- AC4: `test-matrices/2026-09-02-stocktake-count-screen-polish.md` の SC1〜SC9 が green、必須 mutation X1〜X9 が全 kill（Coordinator 独立再実測 + Final Reviewer 独立再実測）。
- AC5（Plan Review round 1 P1-1 是正）: 既存 `StocktakePage.test.tsx`（T1〜T23、うち T2/T3 は `per_page` 期待値を `200` → `50` へ更新済みであること）/ `StocktakePage.suggest.test.tsx`（W5/W7/W8/W12/W17）/ SPEC-UIBB-1/2 / `ProductAddSuggest.test.tsx`（S1 含む既存 suite）が regression-free（SC9）。regression-free の定義は「T2/T3 の `per_page` 期待値更新以外は既存 test に変更がない」こと。
- AC6: `git diff --stat -- src/lib/bindings.ts src-tauri` がゼロ行（Tauri command / DTO / DB 非接触）。
- AC7: frontend gate（`npm run typecheck` / `npm run lint` / `npm run format:check` / `npm test` / `npm run build`）green + `cargo check --release` PASS（Human Gate に L3 を含むため）。
- AC8: `73-ui-stocktake.md` / `SCREEN_DESIGN.md` 棚卸し節 / `01-decision-rules.md` DSR-20 / `02-component-catalog.md` ⑮（SPEC-SUGGEST-D13）の是正が反映され、`bash scripts/doc-consistency-check.sh` clean（WARN は既存分から増分なし）。

**Gated Amendment 1 による AC 追加・具体化**

- AC-L3-2（Amendment 1 で具体化）: 元の「FieldError の出現・消失で「数を保存」ボタンの垂直位置が変化しない」に加え、「エラーの有無にかかわらずボタン上端が入力欄（`Input`）上端と揃う」ことを owner が視認確認する。
- AC-L3-8（S10、render oracle）: 一覧 filter row（`StocktakeItemList`）が左から 部門フィルタ → 表示件数 → 未入力のみ表示 の順で並ぶことを owner が視認確認する。
- AC9（Amendment 1）: `test-matrices/2026-09-02-stocktake-count-screen-polish.md` の `SC3b`/`SC10` が green、必須 mutation `X3b`/`X10` が全 kill（Coordinator 独立再実測 + Final Reviewer 独立再実測）。

## Design Sources

- Requirements / spec: UI-10（REQ-205）、DSR-01/02/03/04/08/11/20/21、catalog ⑮ SPEC-SUGGEST-D1〜D12
- Architecture: 変更なし（UI 層内）
- Function / command / DTO: `docs/function-design/73-ui-stocktake.md`（変更なし・contract 追記のみ）
- DB: 変更なし
- Screen / UI: `docs/SCREEN_DESIGN.md` 棚卸し節（L190-201）、`docs/design-system/01-decision-rules.md` DSR-20、`docs/design-system/02-component-catalog.md` ⑮
- Decision log / ADR: catalog ⑮ に SPEC-SUGGEST-D13（`queryOverrides`、Plan Review round 1 P1-2 是正）を新規採番。他は UI-10-D2 契約監査追記へ集約し新規 D 番号は振らない。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 変更なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 変更なし（AC6 で差分ゼロ機械確認） | existing sufficient |
| DB / transaction / audit / rollback / migration | 変更なし | existing sufficient |
| Screen / UI / route state / Japanese wording | UI-10-D2 契約監査追記3 + §73.6/§73.10 + SCREEN_DESIGN 棚卸し節 | updated in this PR |
| CSV / TSV / report / import / export format | 変更なし | existing sufficient |
| Durable decision / ADR | DSR-20 硬化手段追記（S9）+ catalog ⑮ SPEC-SUGGEST-D13 新設（S6、共有 hook 非破壊拡張） | updated in this PR |

## Registration / Generation Obligations

新規 Tauri command / route / function-design doc / operator 画面の追加はない。

| 新規追加物 | 登録・生成義務 | 対応 |
|---|---|---|
| `useStocktakeItems` signature 変更（`perPage` 明示引数化） | — | 呼び出し元は `StocktakePage.tsx` の 1 箇所のみ（`rg -n 'useStocktakeItems' src` で確認済み）。test 同梱（SC8a/SC8b）。既存 `StocktakePage.test.tsx:217`（T2）/`:232`（T3）の `per_page` 期待値 `200` を新既定 `50` へ更新する（P1-1、削除・skip ではない） |
| `useProductAddSuggest.ts` へ optional `queryOverrides` 追加（P1-2、共有 hook 非破壊拡張） | — | 呼び出し元 5 箇所中 `StocktakePage.tsx:414-418` のみ override を渡す。他 4 箇所（`DisposalPage.tsx:184` / `ManualSalePage.tsx:203` / `ReceivingPage.tsx:188` / `ReturnExchangePage.tsx:265`）は無変更のまま既定 `PRODUCT_SEARCH_QUERY` を使用。test 同梱（SC6b、`ProductAddSuggest.test.tsx` 既存 S1 は regression 対象・SC9 へ追加） |
| REQ coverage | Plan Review round 1 P2-1 是正: `rg -n 'REQ-' src/features/stocktake/*.test.tsx` の実測結果は **hit 2 件**（`StocktakePage.test.tsx:3` / `StocktakePage.suggest.test.tsx:1`、いずれも file 冒頭のヘッダーコメントで `REQ-205` を cite）であり、以前の記載「hit 0」は誤り。`generate_traceability` の file 参照判定 `fe_file_references_ids`（`src-tauri/src/bin/generate_traceability.rs:546`、正規表現 `\b(REQ-[0-9]{3}\b\|UI-[0-9]{2}[a-z]?\b)`）は `REQ-` トークンと `UI-\d{2}` トークンのいずれかを file 内に含めば true になる。両 test file は既に `UI-10`（`StocktakePage.test.tsx:3` の「UI-10 Test Design Matrix」/ `StocktakePage.suggest.test.tsx:1` の「UI-10-D2/D11/D12」）も cite しているため、`REQ-205` トークンの有無に関わらず file 単位の参照判定は既に true で不変。新規 SC1〜SC9 も既存 decision ID 引用の慣行（新規 REQ token を追加しない）に従うため、`generate_traceability` 再生成は不要 | 不要（結論確定、根拠を実測に基づき更新） |
| route / operator 画面 / Tauri command | — | 該当なし |
| Gated Amendment 1（73 更新履歴行の追記） | 73 更新履歴表最上段に Amendment 1 の変更内容を追記（verbatim は Scope 節「Gated Amendment 1」参照） | 対応: 上記 verbatim を次回 Writer が反映。`SCREEN_DESIGN.md` は filter row 並び順の主張が現状存在しないため同期不要（`SCREEN_DESIGN.md:195` 実測、Scope 節に根拠記載） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| DSR-01 主動線 CTA 1 個 | 01 DSR-01 | UI-10-D2 契約監査追記3 | 「棚卸しを確定する」「選択」を outline へ降格。ボタンサイズ・位置変更は非目的（誤操作リスク回避のため既存位置維持） | Scope S1 | SC1 |
| PR27-1 FieldError 残留 | 73 §73.5 | UI-10-D2 契約監査追記3 | `selectItem` への集約が呼び出し側個別修正より漏れが出ない | Scope S2 | SC2 |
| PR27-2 FieldError 予約高さ | 73 §73.5 | UI-10-D2 契約監査追記3 | wrapper 常時 render 方式（条件付き `role="alert"` 内側は維持し a11y regression なし） | Scope S3 | SC3 |
| C8 対象にありません tone | 73 §73.9 | UI-10-D2 契約監査追記3 | doc（非エラー）と実装（destructive）の drift 是正、DSR-08/DSR-11 準拠 | Scope S4 | SC4 |
| C9 未入力 Badge tone | 73 §73.6 | UI-10-D2 契約監査追記3 | 新規 Badge variant を追加せず既存 2 パターン（`StockStatusBadge` / `IntegrityCheckPage`）を再利用 | Scope S5 | SC5 |
| PR27-3 廃番商品の名前検索包含（名前検索フォールバック） | 73 §73.5 UI-10-D2 | UI-10-D2 契約監査追記3 | `is_discontinued: null` が「全件」を意味すると起票時実測で確定（product_repo.rs:804-805） | Scope S6 | SC6 |
| P1-2 廃番商品の live 候補包含（共有 hook 非破壊拡張） | catalog ⑮ SPEC-SUGGEST-D13（新設） | Plan Review round 1 P1-2 是正 | `queryOverrides` 未指定時は既存 5 画面と byte-identical、棚卸しのみ override で廃番を含める | Scope S6 | SC6b |
| C10 単位併記 | — | — | `StocktakeItemDetail` に単位 field なしと起票時実測で確定、DTO 拡張は非目的につき見送り | Non-scope | — |
| C1 表示件数 + catalog ⑩ 統一 | 73 §73.6 | UI-10-D2 契約監査追記3 | canonical `ProductPagination` + `PRODUCT_PER_PAGE_OPTIONS` 再利用に限定、画面内 state のみ、IO 200 クランプは不変。上下配置・40 刻み化は④へ委譲 | Scope S8 | SC8a/SC8b/SC8c' |
| S9 DSR-20 AlertDialog 系追記 | 01 DSR-20 | 本 packet | Radix `AlertDialogContentProps` の型 Omit を根拠に硬化手段を `onEscapeKeyDown` のみへ限定明記 | Scope S9 | doc-consistency-check |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: UI-10-D1〜D12 の既存契約 + 本 packet の UI-10-D2 契約監査追記3 で成立。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: `is_discontinued: null` の意味論（product_repo.rs 実読で確定）と Badge tone の既存パターン再利用方針を UI-10-D2 契約監査追記3 / 73 §73.6 へ promote する。
- Assumptions and constraints: S7 見送りの根拠（`StocktakeItemDetail` field 一覧）は起票時実測節に file:line 付きで記録。
- Deferred design gaps, risk, and follow-up target: S7（単位併記）は DTO 拡張の実需発生時に再判断。
- Test Design Matrix can cite design decision IDs or source doc sections: UI-10-D2 契約監査追記3 / DSR-01/08/11/20/21 を cite。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: S8 の `perPage` 拡張は IO 側 200 クランプの安全網が既存のまま残るため、UI 側の不正値（`Select` は `PRODUCT_PER_PAGE_OPTIONS` の 3 択のみで任意入力を受け付けない）が来ても IO で吸収される。他 S1〜S6 は表示・クラス変更のみで DB/Tauri 非接触、失敗しても既存挙動（棚卸し不能にはならない）へ縮退する。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — frontend UI 層のみ | — |
| Fact check / design decision split | 起票時実測（実コード実読）は観測事実。Badge tone 再利用・`perPage` 明示引数化は design decision | 本 packet |
| Lifecycle / retry | 該当なし（cache lifecycle 変更なし、query key に `perPage` が入るため per-page 変更は自然に refetch を誘発） | — |
| Operator workflow | 棚卸しカウントの主動線明確化（S1）・エラー表示の非糾弾化（S4）・表示件数選択によるページめくり削減（S8）という一人・数週間運用の摩擦軽減 | AC-L3 |
| Replacement path | not applicable（外部システム非接触） | — |
| Data safety / evidence | 業務データ非接触（表示・検索クエリパラメータのみ） | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | Badge/Button の視覚トーン・レイアウトずれの有無は自動 test で判別しきれない部分がある — L3 必須 | Human Gate |
| 環境・再現性 | test 環境は happy-dom（`vitest.config.ts:11`）。オラクルは class literal の直接検査で環境非依存 | Matrix |

## Design Readiness

- Existing design docs are sufficient because: UI-10-D1〜D12 が主要契約を確定済み。今回は表示トーン・レイアウト・母集団の是正であり新規業務ルールを追加しない。
- Source docs updated in this PR: `73-ui-stocktake.md` UI-10-D2 契約監査追記3 + §73.6/§73.10 + `SCREEN_DESIGN.md` 棚卸し節 + `01-decision-rules.md` DSR-20。
- Design gaps intentionally deferred: S7（単位併記）は DTO 拡張の実需発生時。
- Durable decisions discovered in this plan and promoted to source docs: `is_discontinued: null` 全件意味論、Badge tone 再利用パターン、DSR-20 AlertDialog 型制約。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 変更なし（UI 層内、CMD/BIZ/IO 非接触。S6 は既存 `search_products` CMD の呼び出しパラメータ変更のみ）。
- Backend function design: 変更なし。
- Command / DTO / data contract: 変更なし（AC6 で機械確認）。
- Persistence / transaction / audit impact: 変更なし。
- Operator workflow / Japanese UI wording: S1/S4/S5/S8 で操作性・視認性を改善、文言は無変更（S4 の「対象にありません」文言も無変更、tone のみ変更）。
- Error, empty, retry, and recovery behavior: S4 で「対象にありません」を非エラー表示へ是正。
- Testability and traceability IDs: UI-10-D2 契約監査追記3 を Matrix が cite（REQ token 不使用、既存慣行どおり）。

## Contract Probe

- **S6 live 候補プレビューの `is_discontinued` フィルタ**: Plan Review round 1 P1-2 是正により確定済み。`useProductAddSuggest.ts:9-16` の `PRODUCT_SEARCH_QUERY` は 5 画面共有かつ `ProductAddSuggest.test.tsx:139-147`（S1）で default 挙動が契約テストされているため、直接変更しない -> optional `queryOverrides` を hook に追加し `StocktakePage.tsx:414-418` の呼び出しだけへ `{ is_discontinued: null }` を渡す（catalog ⑮ SPEC-SUGGEST-D13、下記 docs 是正）。Writer 実装時の確認事項は「`queryOverrides` 未指定時の suggest fetch クエリが `PRODUCT_SEARCH_QUERY` と完全一致すること」（SC6b の独立 literal oracle で担保）。
- 登録漏れ是正を含む probe は、是正を仮適用した状態で end-to-end に実行する — 本 packet は登録漏れ型ではないため、この規律は非該当（is-N/A）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| DSR-01 主動線 CTA 1 個 | `StocktakePage.tsx` Button variant（S1） | SC1 | AC-L3-1 |
| PR27-1 FieldError 残留是正 | `selectItem`（S2） | SC2 | — |
| PR27-2 FieldError 予約高さ | 数量入力欄 wrapper（S3） | SC3 | AC-L3-2 |
| C8 対象にありません tone | `targetMessage` 表示（S4） | SC4 | AC-L3-3 |
| C9 未入力 Badge tone | `StocktakeProgressHeader`（S5） | SC5 | AC-L3-4 |
| PR27-3 廃番商品の名前検索包含（フォールバック） | `PRODUCT_NAME_SEARCH_QUERY` + 候補 Badge（S6） | SC6 | — |
| catalog ⑮ SPEC-SUGGEST-D13 廃番包含（live 候補、共有 hook 非破壊拡張） | `useProductAddSuggest.ts` `queryOverrides`（S6） | SC6b | — |
| C1 表示件数 + catalog ⑩ 統一 | `useStocktakeItems` + `StocktakeItemList`（S8） | SC8a/SC8b/SC8c' | AC-L3-5 |
| 既存 UI-10-D1〜D12 契約の非破壊 | 変更なし | SC9（regression 実行） | — |
| DSR-20 AlertDialog 系硬化手段追記 | `01-decision-rules.md`（S9） | doc-consistency-check | — |
| PR27-2 追加是正（ボタン垂直整列、Gated Amendment 1） | 数量入力欄 grid の整列手段（S3 追加是正） | SC3b | AC-L3-2（具体化） |
| S10 filter row 順序（owner disposition、Gated Amendment 1） | `StocktakeItemList` filter row（S10） | SC10 | AC-L3-8 |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-02-stocktake-count-screen-polish.md](test-matrices/2026-09-02-stocktake-count-screen-polish.md)

- targeted tests: SC1（primary count）、SC2（FieldError クリア）、SC3（reserved height slot）、SC4（対象にありません tone）、SC5（Badge tone）、SC6（廃番検索フォールバック）、SC6b（共有 hook 非破壊拡張）、SC8a/SC8b/SC8c'（表示件数 + catalog ⑩ 統一）
- negative tests: SC2 の presence oracle（新商品名が表示される）、SC5 の N=0 presence oracle（success tone の実在確認）、SC6b の default 非破壊 presence oracle（`is_discontinued: false` を含む呼び出し引数の完全一致 assert）、SC8b の page reset 確認、SC8c' の独自 markup 非残置確認
- compatibility checks: 既存 `StocktakePage.test.tsx`（T1〜T23、T2/T3 は `per_page` 期待値更新のみ）/ `StocktakePage.suggest.test.tsx`（W5/W7/W8/W12/W17）/ SPEC-UIBB-1/2 / `ProductAddSuggest.test.tsx`（S1 含む既存 suite、無変更）green（SC9、AC5）
- data safety checks: 業務データ非接触
- main wiring/integration checks: `useStocktakeItems` の `perPage` 引数が `StocktakePage` から実際に配線されていること（SC8a/SC8b で query 呼び出し引数を検証）
- Human Gate に L3 を含めるため、Writer 完了条件に `cargo check --release` を含める（CI gate ではない — release build blind spot 対策）

## Boundary / Wire Contract

- producer: `commands.searchProducts`（既存、`ProductSearchQuery.is_discontinued: boolean | null`）、`commands.getStocktakeItems`（既存、`per_page: number`）。
- consumer: `StocktakePage.tsx` / `useStocktakeItems.ts` / `useProductAddSuggest.ts`（新規 optional `queryOverrides` 引数、wire 型を跨がない画面内マージのみ）。
- wire type: 既存 `ProductSearchQuery` / `getStocktakeItems` 引数（変更は値のみ、型は無変更）。
- internal type: `perPage: (typeof PRODUCT_PER_PAGE_OPTIONS)[number]`（`50 | 100 | 200`、画面内 state、wire を跨がない）。`queryOverrides?: Partial<ProductSearchQuery>`（`useProductAddSuggest.ts` の新規 optional 引数、hook 内部でのみマージされ wire を跨がない）。
- precision/range: `per_page` は既存どおり IO 側 `PAGINATION_MAX_PER_PAGE`（200）でクランプされる。
- round-trip path: なし（表示件数は永続化しない）。
- invalid input: 該当なし（`Select` は `PRODUCT_PER_PAGE_OPTIONS` の 3 択のみが選択可能、任意入力なし）。
- compatibility: `is_discontinued: false` → `null` は検索結果を拡張する方向の変更のみで、既存の狭い結果を壊さない（後方互換）。

## Review Focus

- DSR-01 count oracle（primary ボタンの class literal 独立転記、`button.tsx` の `buttonVariants` を import しない）。
- DSR-08 icon presence（S4/S5 のアイコンが実際に render されているか、色 class だけの検証で終わっていないか）。
- catalog ⑩ 準拠（`ProductPagination` の props・aria-label・class を独自に改変していないか、perPage `Select` が `PRODUCT_PER_PAGE_OPTIONS` を直接参照しリテラル `[50, 100, 200]` を再宣言していないか）。
- CSS specificity（Badge/Button の `className` override が variant 由来の class と衝突して意図しない色にならないか、PR #28 lane 1 の教訓どおり className 連結順を確認）。
- page reset の確実性（SC8b: `onPerPageChange` と `onSearchChange` の呼び出し順序に関わらず、最終的に `page=1` へ収束するか）。
- oracle の独立性（Matrix の class literal・アイコン名が実装 module から import されず独立転記になっているか）。
- design-system sweep（S5 の Badge tone が `02-component-catalog.md` の既存 Badge 規約から逸脱していないか、新規 semantic token を要求していないか）。
- 共有 hook 非破壊性（`useProductAddSuggest.ts` の `queryOverrides` 未指定時が `PRODUCT_SEARCH_QUERY` のみのマージと byte-identical か、他 4 画面の呼び出しが無変更のままか、`ProductAddSuggest.test.tsx` の既存 S1〜他 test が無改変か）。
- AC-L3-1 の到達手順が実装と一致するか（`resolveItem` の 0 候補 clear / 複数候補 keep-selected 分岐、`:458`/`:473` 相当のロジックが変更されていないか）。
- 整列手段が CSS 詳細度や grid 副作用で崩れないか（Gated Amendment 1、S3 追加是正の a/b/c いずれの方式でも既存 S1/S4/S5 の class と衝突しないか）。
- filter row の a11y（`Label htmlFor` / `Checkbox id` / `SelectTrigger id` の対応関係）が並び替え後も維持されているか（Gated Amendment 1、S10）。

## Spec Contract

Contract ID: SPEC-STOCKTAKE-COUNT-POLISH-2026-09-02

- counting 画面の primary（`bg-primary` class）ボタンは「数を保存」の 1 個のみとする。
- 対象商品が切り替わる全経路（`find_stocktake_item` 直接解決・商品名検索単一候補自動選択・候補選択）で、前商品の数量 FieldError をクリアする。
- FieldError 表示スロットは常時 render し、エラー有無で「数を保存」ボタンの位置を変えない。
- 「対象にありません」は `role="status"` + `text-muted-foreground` + `Info` icon で表示し、`role="alert"` / `text-destructive` を使わない。
- 未入力 Badge は件数 0 のとき success tone（`bg-success`）+ `CheckCircle2`、1 件以上のとき warning tone（`border-warning-border bg-warning-soft text-warning-strong`）+ `AlertTriangle` を表示する。
- 商品名検索フォールバック（`PRODUCT_NAME_SEARCH_QUERY`）は `is_discontinued: null` とし、廃番商品も候補に含める。候補行は廃番商品に `廃番` Badge を付す。
- `useProductAddSuggest.ts` の共有既定 `PRODUCT_SEARCH_QUERY`（`is_discontinued: false`）は変更しない。`queryOverrides` 未指定時は既存 5 画面すべてが byte-identical な挙動を維持し、棚卸し画面のみ `{ is_discontinued: null }` を明示的に渡して廃番を live 候補へ含める。
- `useStocktakeItems` の `perPage` は呼び出し側が明示指定し、既定値は `StocktakePage` の画面内 state（初期値 50、`PRODUCT_PER_PAGE_OPTIONS` の最小値）が持つ。表示件数変更時は `page` を 1 へ戻す。
- 一覧のページ送りは catalog ⑩ canonical `ProductPagination`（「前のページ」/「次のページ」`aria-label`）を使う。表示件数 `Select` の選択肢は `PRODUCT_PER_PAGE_OPTIONS` を直接参照する（リテラル再宣言禁止）。
- Gated Amendment 1（S3 追加是正）: FieldError スロットの有無にかかわらず、「数を保存」ボタンの上端は数量入力欄（`Input`）の上端と揃う。
- Gated Amendment 1（S10）: 一覧 filter row は左から 部門フィルタ → 表示件数 `Select` → 「未入力のみ表示」`Checkbox` の順に並ぶ。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| primary CTA 1 個 | Scope S1 | SC1 | count oracle 独立性 | Matrix |
| FieldError クリア | Scope S2 | SC2 | 集約点の網羅性 | Matrix |
| FieldError 予約高さ | Scope S3 | SC3 | reserved height 実測 | Matrix + AC-L3-2 |
| 対象にありません tone | Scope S4 | SC4 | icon presence | Matrix + AC-L3-3 |
| 未入力 Badge tone | Scope S5 | SC5 | tone 分岐 + presence | Matrix + AC-L3-4 |
| 廃番商品の名前検索包含（フォールバック） | Scope S6 | SC6 | query literal + Badge presence | Matrix |
| catalog ⑮ SPEC-SUGGEST-D13 共有 hook 非破壊拡張 | Scope S6 | SC6b | default 不変性・override 適用の両立 | Matrix |
| 表示件数 + catalog ⑩ 統一 | Scope S8 | SC8a/SC8b/SC8c' | page reset・canonical component 使用 | Matrix + AC-L3-5 |
| 既存契約非破壊（T2/T3 期待値更新含む） | Scope S8（T2/T3 のみ） | SC9（regression） | 既存 test 無変更 green（T2/T3 除く） | PR body |
| DSR-20 AlertDialog 系追記 | Scope S9 | doc-consistency-check | 文面正確性 | doc check + diff |
| ボタン垂直整列追加是正（Gated Amendment 1） | Scope S3 追加是正 | SC3b | 整列手段が CSS 詳細度で崩れないか | Matrix + AC-L3-2 |
| filter row 順序（Gated Amendment 1、owner disposition） | Scope S10 | SC10 | DOM 順 oracle の独立性 | Matrix + AC-L3-8 |

## Data Safety

- 業務データ・実店舗データに非接触。表示トーン・検索クエリパラメータ・画面内ページング state のみを扱う。
- local-only: 画面内 state（`perPage`）はコンポーネントメモリ内のみ、永続化しない。
- synthetic-only: test の seed データはすべて synthetic な商品名・コード・件数。

## Implementation Results

棚卸しカウント画面の primary CTA、FieldError、対象外表示、未入力 Badge、廃番候補検索、表示件数・ページ送りを Scope S1〜S8 の契約どおり統一した。共有 live 候補 hook は任意 override の追加だけに留め、棚卸し以外の既定検索条件を維持した。S9 の AlertDialog 制約を含む source docs を提案文面どおり同期した。

Gated Amendment 1（L3 run 1 是正）: S3 追加是正はボタン垂直整列の候補 (a) を採用し、button column に数量欄 column の Label 高さ相当の invisible spacer と数量欄と対称な `min-h-5` 空 slot を追加、`items-end` を `items-start` へ切り替えて「数を保存」の上端を数量入力欄の上端と揃えた。FieldError slot はこれまでどおり数量欄 column 内の常設要素のまま位置を変えていない。S10 は `StocktakeItemList` の filter row の JSX 順序を、部門フィルタ → 表示件数 → 未入力のみ表示 へ入れ替え、各 block 内部の `id`/`htmlFor`/`aria-*`/ハンドラは無変更のまま維持した。SC3b（button column の構造 oracle、案 a 採用・案 b は N/A）と SC10（filter row の DOM 順序 oracle）は TDD で先にテストを追加して red を確認したのち実装し、green に到達させた。Coordinator の独立再実測で X3b-iii（Label spacer 撤去）が survivor となったため、SC3b の oracle を Matrix 最小指定の superset（spacer の存在も assert）へ強化した。Matrix 本文は変更しない。

## Review Response

2026-09-02 Final Review round 1（Sonnet subagent fresh context、差分 11 file を Scope S1〜S9 / verbatim docs block / Matrix と突合）= P1 0 / P2 0 / P3 2。docs 是正は 73 契約監査追記 3 件 + §73.6 / §73.10、SCREEN_DESIGN、01 DSR-20、catalog ⑮ D8 / D13 が verbatim block と完全一致、旧文言 0 hit。`bindings.ts` / `src-tauri` 差分ゼロ、既存 test の改変は T2 / T3 の `per_page` 期待値更新のみ。共有 hook は `queryOverridesRef` 方式で既定挙動 byte 同一、他 4 画面の呼出し無変更。

- P3-1（記録のみ）: `ProductAddSuggest.tsx` の import 順（`Button` → `Badge`）がアルファベット順に反する。lint 通過済みのため機能影響なし。
- P3-2（記録のみ）: `StocktakePage.tsx` の `queryOverrides: { is_discontinued: null }` が render ごとに新規 object となり hook 側 effect が再実行される。ref 経由で常に最新値を読むため実害なし、perf nit。
- Coordinator 裁定の補足: `ProductAddSuggest.tsx`（共有 component）への廃番 Badge 追加は Scope S6(c)「候補行に廃番 Badge を併記」の描画先が共有 component であるための必要変更で in-scope。他画面は廃番を候補に出さないため見た目は不変。`StocktakeItemList` の `<fieldset disabled>` で `ProductPagination` を包む実装は canonical を改変せず disabled を伝播する妥当な手段（Final Reviewer 所見と一致）。

Coordinator mutation 独立再実測（隔離 worktree、clean tree = Reviewed Content HEAD、stocktake 系 + `ProductAddSuggest.test.tsx` を mutant ごとに単独実行）: X1（確定ボタン outline 撤去）→ SC1、X2（`selectItem` の FieldError クリア撤去）→ SC2、X3（`min-h-5` slot を条件 render へ）→ SC3、X4（`role="alert"` + `text-destructive` へ戻す）→ SC4、X5（Badge tone 分岐撤去）→ SC5、X6（ローカル query を `false` へ）→ SC6、X6b（override spread 撤去）→ SC6b、X6c（共有既定を `null` へ）→ SC6b + 共有 S1、X7（既定 perPage 200 へ、`useStocktakeItems` は perPage 必須引数のため `StocktakePage` の `useState(50)` へ注入）→ SC8a + T2 / T3、X8（page リセット撤去）→ SC8b、X9（canonical を手書き pager へ）→ SC8c'。**11 体全 kill、survivor なし**、Matrix 期待列と一致。Writer 側の mutation 自己検証は発注書で不実施としており、本独立再実測が唯一の kill 証跡。

- Findings Freeze: frozen at Final Review round 1（P1/P2 = 0）; post-freeze exceptions: none.
