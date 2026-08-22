# 2026-08-23 現デザインの分析 — 全画面 mockup D 通し描きで得た観察と評価（全体デザイン見直しの入力）

> **位置付け**: 参考資料。実装の正本ではない（正本は `docs/design-system/00〜04` と各 function-design）。PR #95（UI-14）の Windows native L3 所見 5 点 → Lane 0 調査 → mockup D 6 file（`mockup-d-*.html`、全 21 画面を同一 token・器で通し描き）→ owner 全件確認（2026-08-23「全体的に良さそう、細部は相談して詰める。基本的には適用後の方が間違いなく良かった」）の過程で見えた **事実（観察）** と **評価（所感・改善案）** を、Plans.md「全体デザイン見直し — 背骨 C 再点検」の入力として書き留める。
> **性格**: 現デザイン（背骨 C + 実装）の分析。§1〜§3 は rg / 実測 / fork 報告で裏取りした観察。§4〜§6 は Coordinator（Fable）と owner の評価・案で、採否は未決。数値は WCAG 2.x 相対輝度の実測（2026-08-23、`src/styles/globals.css` の token、main `a16d57f`）。
> **関連**: Lane 1 packet `docs/plans/2026-08-23-ui-list-backbone-d.md`（所見 5 点の規範化、原則 13〜16）/ archived `docs/archive/plans/2026-08-23-price-revision-impl-b.md`（UX findings の起点）/ `04-backbone.md` / `reference/README.md`。

## 1. 画面間のバラつき（実装 drift、Lane 0-b 監査 + mockup 通し描きで確認）

| # | 観察 | 事実 / 箇所 | 影響 |
|---|---|---|---|
| 1-1 | table primitive はほぼ統一済み | 全一覧 table が `src/components/ui/table.tsx`（shadcn）経由。例外 = PLU 書出し `src/features/plu-export/PluExportPage.tsx` の raw `<table className="w-full min-w-[760px] text-sm">` | sticky header / 線 token は 1 箇所で波及できるが、PLU 書出しだけ別経路 |
| 1-2 | table 本文が 14px | `ui/table.tsx` の `Table` が `text-sm`、`text-sm` 193 箇所 vs `text-base` 4（`src/features` 非 test）。04-backbone 原則 1（16px）・適用順序 1「table 16px 化」は未着手 | 低視力で最も効く未履行項目 |
| 1-3 | pagination は全画面 table 下のみ | 7 画面が `ProductPagination` 共有（商品一覧 / 在庫照会 / 在庫変動履歴 / 一括価格改定 / 入出庫履歴 / 操作ログ / 整合性チェック）。上部に件数なし、`PageHeader` に count props なし | 長い一覧で「いま何件目か」が下まで行かないと分からない |
| 1-4 | 件数文言の揺れ | 共通「{n} 件中 {p} / {t} ページ」（test で固定 3 箇所）と、非一覧画面の「n 件」「差分 n 件」等が並存 | 統一形「{n} 件中 {from}〜{to} 件目 · {p} / {t} ページ」を Lane 1 で pin |
| 1-5 | toolbar wrapper / select 実装が 3 系統 | A 系 `flex flex-wrap items-center gap-3` + shadcn `Select`（ProductListPage / StockInquiryPage / PriceRevisionFilters）、B 系 `items-end` + raw `<select>`（InventoryRecordsPage / StockMovementsPage / OperationLogsPage）、C 系 独自 row（PriceRevisionPage 外枠） | 同じ「検索 + 絞り込み」が画面ごとに微妙に違う |
| 1-6 | page root が 3 系統、`PageShell` 未実装 | `space-y-4 p-6` / `space-y-5 p-6` / `min-h-screen space-y-6 p-6`。04-backbone 原則 6 の `PageShell` は `rg -n "PageShell" src` 0 件 | 規範化済み・未履行 |
| 1-7 | 読込み表示の揃い | `ListSkeleton` は UI-14 のみ（PR #95 で新設）、他は `ui/skeleton.tsx` 直書き 3 行（StockInquiryPage 等） | 原則 11 未履行 |
| 1-8 | 識別列の有無は画面依存 | 商品コード + 商品名を持つ一覧（商品一覧 / 在庫照会 / 一括価格改定 / 棚卸し / 整合性チェック / 日次・月次 ranking）と、1 列目が日時の履歴系（入出庫履歴 / 操作ログ / 在庫変動履歴 / backup 一覧） | 「識別列固定」は opt-in、履歴系は日時 + 種別を固定（仮置き） |
| 1-9 | 線・枠の token が 1 本 | `--border` #e7e5e4（白 1.26:1 / 地色 1.20:1）を構造線（行区切り・card 枠）と操作枠（input / outline button / select）の両方に使用 | 非テキスト UI 部品の 3:1（WCAG 1.4.11）未達。Lane 1 で 2 段 token に |
| 1-10 | 補助文字のコントラスト | `--muted-foreground` #78716c = 地色 4.59:1 / card 上 4.40:1（AA 未達） | card 内の補助文字だけ AA を割る |
| 1-11 | test の構造依存 | `ProductTable.test.tsx:126` header 配列の完全一致、pagination 文言の `getByText` 完全一致（上下 2 箇所で複数 match） | 器の変更時に先に潰す |
| 1-12 | 操作者 UI の状態表現は成熟 | icon + 日本語 + 色の 3 点、badge 3 種、primary 1 つ、`EmptyState` 20 画面・`PageHeader` 26 画面で流用 | 意味設計は維持（A / B 提案の診断と一致） |

## 2. doc との食い違い・directive との食い違い（mockup 作成で露出）

| # | 観察 | 出典 |
|---|---|---|
| 2-1 | 「売上データ取込み」と「日報取込み」は同一画面 UI-07（既定 tab 日報 / 商品別 CSV の 2 track） | `55-ui-csv-import.md` §55.0。fork G3 が directive（4 画面）を doc 優先で 3 tab + track 切替に正した |
| 2-2 | 棚卸しは UI-10 `73-ui-stocktake.md`（directive の「UI-12 / 67-ui」は誤り、UI-12 は shared layout） | fork G2 |
| 2-3 | 閾値設定（在庫少の基準）は `app_settings` 2 key（一般商品 / 生地）の form であり部門別 table ではない | `69-ui-threshold-settings.md` UI-11a-D1、fork G5 |
| 2-4 | 在庫少一覧（UI-06b）は `list_low_stock` が paging しない = 上下 pager の対象外 | `58-ui-stock-inquiry.md` L497 付近、fork G4 |
| 2-5 | 棚卸しの差異列は「色分けなし」が契約 — D の 状態 badge 化はしない | `73-ui` §73.6、fork G2 が維持 |
| 2-6 | `00-foundations.md` の `--border` 根拠「4.5:1 境界可視性」は誤り（実測 1.20:1）、`--foreground` の「12.6:1」は実測 16.7:1 | Lane 0-a / 0-c、Lane 1 で訂正 |
| 2-7 | 77-ui が参照する「共通 `ListSkeleton`」は PR #95 時点で未実装だった（Writer が新設、gated amendment 1） | archived packet impl-b。UI doc が参照する共通 component の実在を packet の Contract Probe に入れる（WER 候補） |
| 2-8 | fork G1 の「FormSection は catalog 未登録」は誤申告（`02-component-catalog.md` ④ + `src/components/patterns/FormSection.tsx` が既存） | Lane 1 packet SPEC-UILB-D6 |
| 2-9 | 52-ui の固定順サマリー件数（navigation 21 項目）は UI-14 追加後も未更新（non-blocking、Codex 最終報告） | `52-ui-shared-layout.md` §52.3 付近 |
| 2-10 | 04-backbone の反映先「原則 4（DSR-16 新設）」は未作成のまま番号だけ予約されていた（Lane 1 が DSR-16 を取り、badge は DSR-17 へ繰り下げ） | 採番 registry は「先に merge する側が採番」（PR #86 D-052 C 番号衝突と同族） |

## 3. doc にない文言を mockup が置いた箇所（未決。採否は各実装 lane の packet で）

- 入力 A（01b / 02 / 03）: 保存ボタン「保存する」（51-ui に literal なし）/ `pos_stock_sync` の表示 label「レジ在庫連携」/ 入庫 cost-diff dialog の「見送る」/ 入庫明細の「入力中」badge（77-ui 由来の転用）/ UI-03「商品が追加されていません」（61-ui からの借用）/ 領収書画像 drop-zone の空文言。
- 入力 B（04 / 05 / 棚卸し）: 3 画面の PageHeader subtitle / PLU 警告パネル本文 / 数量・金額・理由の validation 文言 / 「同じ内容の再送」badge の文言と位置。
- 取込み・書出し: PLU 書出し「要修正一覧」の列構成（商品コード / 商品名 / JAN / 状態）/ UI-01c preview の列見出し / 取込み結果の「取込み ID」表示形式と部門別集計の内訳表現。
- 履歴・照会: 入出庫履歴の列見出し「商品」「金額 / ロス原価」/ 操作ログの列見出し「種別」/ 在庫少一覧の件数 line「在庫少 n 件・在庫切れ m 件」（58-ui は件数 badge を Phase 2 に defer）/ 在庫変動履歴 header card の 4 項目 flex。
- ホーム・売上・管理: 日次売上の summary card 4 枚の構成順 / backup の break-glass checkbox を常時表示として描画（doc は失敗後のみ）。
- 一覧（Coordinator 作）: filter なし 0 件の文言は UI-01a 既存「該当する商品がありません」に統一（Plan rally で先例優先）。

## 4. デザインそのものへの評価（所感、採否未決）

### 4.1 強み（維持する）
- **意味設計は成熟**: 状態 = icon + 日本語 + 色、badge 3 種、primary 1 つ、日本語 label が一次情報。A / B 提案の診断（「問題は視覚 system の断片化」）と、今回の通し描きの実感が一致した。
- **器の規範は既にある**: 04-backbone 原則 6（PageShell / 検索枠 2 段）・7（検索欄統一）・11（待ち時間の顔）は描いてみると効く。問題は未履行（§1-2 / 1-5 / 1-6 / 1-7）。
- **業務密度の維持（原則 12、行高 40px）は正しい**: 400 行級の一括価格改定で行高を増やすと主動線が遅くなる。読みにくさは 16px 化・線・固定列・現在行で解けた（owner L3「速度面は良好」）。

### 4.2 弱み（D で当てたもの、Lane 1 で規範化）
- 線が薄すぎる（1.20:1）。構造線と操作枠が同じ token で、入力欄・ボタン枠が背景に溶ける。
- 現在行 / 選択行が色相のみ（hover `bg-muted/50` 16.46:1 は「見える」が、どの行を編集中かが形で分からない）。
- 長い一覧で header と識別列が流れる。件数が下にしかない。
- 低視力前提の検証項目（forced-colors / DPI 125〜150% / 実利用者セッション）が gate に無かった。

### 4.3 弱み（D では触らなかった、全体見直しの候補）
- **サイドバー**: 21 項目 1 列は長い（label 折返しは既存 backlog）。mockup C の描き方より現アプリ（shadcn）の方が良い、が owner 所感 — 背骨 C の mockup と実装の「見え方」のずれを、どちらに寄せるか未決。
- **PageHeader / 主ボタン（「商品登録」等）/ 検索欄**: 同上。mockup C は「器の統一」を示すための簡略描画で、実装の細部（影・角丸・高さ）を決めるものではない。全体見直しでは「実装済み shadcn 部品の見た目を正とし、C / D は配置と意味だけを縛る」と明文化する案。
- **入力画面**: 明細 table と form section の境界（同じ枠で囲むか）、保存ボタン文言の統一（「保存する」/「記録する」）、result panel と Alert の使い分け（DSR-03）が画面ごとに揺れる。
- **badge 12px**: 原則 1 は「12px は badge の中だけ」。低視力前提で 12px の白抜きなし pill が読めるかは未検証（L3 で「最近改定」は読めた、が文字数が少ない）。13〜14px 化の再判定候補。
- **行内 icon ボタンの当たり判定**（chevron / 行内操作）: 見た目 16px のまま 24×24 の padding が要る（WCAG 2.5.8）。
- **日本語フォント**: 実装は Meiryo 優先で Yu Gothic UI を含まない。低視力での根拠（Meiryo は可読性重視設計）を 00-foundations に明記するか。
- **表示スケール（DSR-13）と system DPI の相互作用**: 125〜150% で `px` 直書きが崩れないか未検証。
- **dark theme**: なし（light 固定）。業務用途・店舗環境では不要と判断しているが、明文化されていない。

## 5. 改善案（背骨 C 12 原則の「維持 / 改訂 / 追加」棚卸しの素案）

| 原則 | 案 | 根拠 |
|---|---|---|
| 1 本文 16px | 維持 + 履行（table 16px 化、caption 12 → 14） | §1-2 |
| 2 色は家族で | 維持 + 追加: 枠は 2 段（構造線 / 操作枠 3:1）、現在行 token | Lane 1 原則 13 / 15 |
| 3 状態は 3 点 | 維持 + 具体化: 現在行・選択行にも適用（色 + 形状 + 文言） | Lane 1 原則 15、DSR-08 |
| 4 badge 3 種 | 維持。12px の可読性を低視力 L3 で再判定（13〜14px 候補） | §4.3 |
| 5 primary 1 つ | 維持 | — |
| 6 器は 1 つ | 維持 + 履行（PageShell）+ 追加: 一覧の器（ListShell = toolbar 2 段 + 上下 件数・pager + sticky header + 識別列 opt-in） | Lane 1 原則 14、§1-3 / 1-5 / 1-6 |
| 7 検索欄統一 | 維持 + 履行 | §1-5 |
| 8 押せる顔 | 維持 + 追加: 行内 icon の当たり判定 24×24、操作枠 3:1 | WCAG 2.5.8 / 1.4.11 |
| 9 見出し 1 行 | 維持 | — |
| 10 icon 3 段 | 維持 | — |
| 11 待ち時間の顔 | 維持 + 履行（ListSkeleton を全一覧へ） | §1-7 |
| 12 密度維持 | 維持（40px）。読みにくさは 1 / 13 / 14 / 15 と表示スケールで解く | owner L3 |
| 追加 | 低視力 L3（forced-colors / DPI / 実利用者）を gate 化（Lane 1 原則 16）/ 「実装済み shadcn 部品の見た目を正とし、mockup は配置と意味だけを縛る」の明文化 / dark theme 不要の明文化 / フォント根拠 | §4.3 |

## 6. 全体デザイン見直しの進め方（案）

1. Lane 1（所見 5 点の規範化）を merge して土台を固定する。
2. 上表 §5 を design-first packet（R2 docs-only）で 1 行ずつ裁定する。PR #87 と同型に、独立 2 案（A = 既存規範準拠 / B = 白紙、Opus 5）を作って突合してもよいが、今回は §1〜§4 の材料が既にあるため「背骨 v2 草案 1 本 + Sonnet rally」でも足りる。
3. 採択分を `04-backbone.md` v2 として正本化し、mockup（C / D）を更新、00〜03 へ反映。
4. 実装 lane（Lane 2 shared → Lane 3〜5 画面群）の packet に反映し、実利用者の Windows native 1 セッションで検証する。

## 7. 出典（Lane 0-a の主要分のみ、全量は Lane 1 packet Design Sources）

- WCAG 2.2: SC 1.4.11 Non-text Contrast / 2.4.13 Focus Appearance / 2.5.8 Target Size — https://www.w3.org/TR/WCAG22/
- WebAIM Contrast — https://webaim.org/articles/contrast/
- 視野狭窄と読み: PMC4026991（glaucoma reading eye-tracking）/ PMC1249580（contrast threshold）/ PMC7917782（tunnel vision scanning）
- data table guides: GOV.UK Home Office design system（tables）/ USWDS table / Stanford sticky table
- Microsoft Learn: accessible text requirements / Make Windows easier to see

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-08-23 | 初版（Coordinator = Fable、mockup D 6 file と Lane 0 調査、owner 所感を集約） |
