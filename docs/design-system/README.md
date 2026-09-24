# デザインシステム参照ドキュメント

> **目的**: 本ディレクトリはデザイン規約の単一参照源（SSOT）。Codex を含む誰が実装しても外れない「決まったパーツ + 決まった選択ルール」を定義する。規則は「見せ方 → 見る人の受け取り方 → 狙う効果 → 根拠」の順で組む。
> **位置付け**: `docs/UI_TECH_STACK.md` §4 をここへ分離し、UI_TECH_STACK は技術スタック・設定・A11y 要件を引き続き持つ。

---

## 読む順

新しい画面や修正を設計するときは、次の順に読む。file の番号は内容領域を示し、読む順とは一致しない。

1. [00-foundations.md](00-foundations.md)（土台）: 色の役割・強調の段階・迷いやすい場面・ラベルと値・書体と、token の値
2. [04-backbone.md](04-backbone.md)（原則）: 11 の原則と旧番号の対応表
3. [01-decision-rules.md](01-decision-rules.md)（判断ルール）: DSR-01〜24 を話題別の索引から引く
4. [02-component-catalog.md](02-component-catalog.md)（部品）: 16 パターンの現行実装の canonical
5. [03-philosophy.md](03-philosophy.md)（出典）: 根拠の出典の一覧

## 迷ったらここ

| 問い | 節 |
|---|---|
| この要素を何色にするか（どの役割か） | [00「色の役割」](00-foundations.md#色の役割) |
| どれくらい目立たせるか、1 画面にいくつまでか | [00「強調の段階」](00-foundations.md#強調の段階) |
| focus ring・checked・spinner・現在地と現在行・試しの行をどう扱うか | [00「迷いやすい場面」](00-foundations.md#迷いやすい場面) |
| 商品名の下の補足情報やサマリカードの数をどう見せるか | [00「ラベルと値」](00-foundations.md#ラベルと値) |
| 書体は何を使うか | [00「書体」](00-foundations.md#書体) |
| 文字・余白・icon の大きさ | [00「タイポグラフィ」](00-foundations.md#タイポグラフィ)・[「スペーシング」](00-foundations.md#スペーシング)・[「アイコンサイズ」](00-foundations.md#アイコンサイズ) |
| まず守る原則は何か | [04「11 の原則」](04-backbone.md#11-の原則) |
| 古い文書やコメントの旧原則番号がどれを指すか | [04「旧番号の対応表」](04-backbone.md#旧番号の対応表) |
| Tabs か SegmentedControl か、Toast か Alert か、戻り導線はどうするか | [01「話題別の索引」](01-decision-rules.md#話題別の索引) |
| 部品の JSX・token・状態・canonical file | [02 コンポーネントカタログ](02-component-catalog.md) |
| 規則の根拠をどこから引くか | [03「出典の一覧」](03-philosophy.md#出典の一覧) |
| runtime lane A の merge 前に画面を作るとき | [「移行中の作り方」](#移行中の作り方) |

## 移行中の読み方

規則と実装は、runtime lane A（色と強調）と runtime lane B（書体）が反映するまで一部で食い違う。どちらも `docs/backlog.md` に起票してある。移行が runtime lane 待ちの項目は、00 / 04 / 01 を狙いとして読み、02 と画面を現行として読む。どの項目が待ちかは、00 の色の役割表と迷いやすい場面の「移行」列に集めてある。候補の色の値は正本に書かず、`docs/decision-log.md` の D-091 に置いてある。

## 移行中の作り方

runtime lane A の merge 前に新しい画面や修正を作るときは、次のどちらか 1 つに決める。

- **現行の token と 02 の部品の形で作る**: 操作は `--primary`、現在行は DSR-22 の 3 点表示で作る。現在行の canonical は `src/features/suppliers/components/SupplierPickerDialog.tsx` の現在行で、一括価格改定の「入力中」は outline badge 1 点のため canonical にしない。00 の迷いやすい場面で「lane A の L3 で試し」の行は、現行の実装のまま作る。
- **lane A の merge 後に作る**: 進行中の地・作業中の囲み（進行中の段 1〜3）を新しく要する画面は、lane A の merge 後に作る。棚卸し画面の新しい形（部門をページ内の列にする案）もこちらに当たる。

どちらの場合も、新しい見た目の先取り（候補色の直書き・新 token 名の先取り）はしない（`docs/quality/review-checklist.md` カテゴリ 9）。

---

## サブ docs 一覧

| ファイル | 責務 | 主な内容 |
|--------|------|--------|
| [00-foundations.md](00-foundations.md) | 土台: 色の役割・強調の段階とデザイントークン（色 / タイポ / スペーシング / アイコン）の正典 | 色の役割表（6 役割、見せ方・受け取り方・狙う効果・根拠と現行の実装・移行の列）・強調の段階 0〜4 と段に数えないもの・迷いやすい場面・ラベルと値・書体の選定条件・カラーパレット・セマンティックトークン・タイポグラフィ階層・スペーシングスケール・アイコンサイズ・業務ステータス視認性 |
| [01-decision-rules.md](01-decision-rules.md) | 判断ルール: DSR-01〜24（話題別の索引から引く） | 主動線 CTA / Tabs vs SegmentedControl / Toast vs Alert 3 階層 / ステータスバッジ配置 / read-only vs disabled / 必須表示 / 確認ダイアログ境界 / semantic 色 / Form セクション / フィルタソース / 空状態・Tooltip / truncate・密度 / 表示スケール / ファイル選択方式 / returnTo 検証 / DSR-21 現在地と選択状態の色分離 / DSR-22 一覧の器・現在行・UI 部品枠のコントラスト / DSR-23 プルダウン統一 / DSR-24 追加導線を伴う master 参照の picker dialog 統一 |
| [02-component-catalog.md](02-component-catalog.md) | 部品: 16 パターンカタログ（現行実装の canonical。使いどころ / JSX skeleton / トークン / 状態 / a11y / Do-Don't / canonical ファイル参照） | ①ページヘッダ ②サマリカード ③テーブル ④フォームセクション ⑤SegmentedControl ⑥空状態・エラー・ローディング ⑦Toast ⑧Dialog/確認 ⑨検索+フィルタ ⑩ページネーション ⑪日付・月ナビ ⑫行インライン展開 ⑬ステータスバッジ ⑭FilePicker ⑮商品追加欄live候補プレビュー ⑯一覧の器（ListShell） |
| [03-philosophy.md](03-philosophy.md) | 出典: 根拠の出典の一覧（何を取り、何を取らないか）。原則は持たない | refactoring-ui / ux-principles / GOV.UK / IBM Carbon / Shopify Polaris / Atlassian / Microsoft Fluent 2 / Laws of UX / 原田秀司『UIデザインの教科書［新版］』/ NN/g / WCAG / japanese-webdesign 観点借用 |
| [04-backbone.md](04-backbone.md) | 原則: 11 の原則（owner 採用 2026-08-20 の 16 の原則と旧 03 の哲学を 2026-09-24 に統合）と旧番号の対応表 | 読める大きさ / 1 色 1 役割 / 強調の段階 / badge 3 種 / 言葉で言い切る / 器は 1 つ / 同じ操作は同じ顔と挙動 / 密度 / 枠と線 / いま扱っているものは進行中 / 低視力の実機確認。お手本 mockup と提案原文は [reference/](reference/README.md) |

---

## 既存 docs との責務境界

| ドキュメント | 責務 | 本ディレクトリとの関係 |
|-----------|------|-------------------|
| `docs/SCREEN_DESIGN.md` | 画面固有の判断（各画面の項目・操作フロー・状態遷移） | 横断規約は本ディレクトリへ移設済み、画面固有部分は SCREEN_DESIGN に残る。画面ごとの色の記述は runtime lane A が画面と同時に直す |
| `docs/UI_TECH_STACK.md` | 技術スタック選定・A11y 要件・Tauri 特有の決定（§1〜§3・§5・§6・§7） | §4 デザインシステム本文は本ディレクトリへ移設、UI_TECH_STACK §4 はスタブ + リンク |
| `docs/quality/review-checklist.md` | PR レビュー観点チェックリスト | カテゴリ 9 の参照先が本ディレクトリの対応パターン見出しへ張り替わる（A5 で更新） |

---

## サブファイル命名規約

`0x`=デザイン基盤。番号は内容領域を示す。file 名は `scripts/doc-consistency-check.sh` の DS1〜DS4 が決め打ちで読むため変えない:

| 番号 | 領域 |
|-----|------|
| `00` | foundations（土台: 色の役割・強調の段階・トークン層） |
| `01` | decision-rules（DSR 判断ルール） |
| `02` | component-catalog（パターン集、現行実装の canonical） |
| `03` | philosophy（根拠の出典の一覧） |
| `04` | backbone（原則） |
| `reference/` | お手本 mockup（統合案 C）と提案原文（正本ではない） |

---

## 機械強制の現状（PR-C 導入済み）

新規依存なしで実現できる範囲は PR-C で導入済み:

- palette 外色 / 生 `<button>` / barrel 迂回: eslint `no-restricted-syntax`（`eslint.config.js`、既存 eslint のみ。既存違反 = 色 14 箇所 + button 3 箇所は先行解消済み）
- docs 整合: `scripts/doc-consistency-check.sh` の DS1〜DS4（canonical path 実在 / DSR 参照整合 / token HEX 整合 / review-checklist 対応）

## 将来項目（npm 凍結解除後に検討）

以下は Mini Shai-Hulud 凍結解除後の候補であり、現時点では実装しない。静的な palette 外色強制は上記 eslint で導入済みのため、ここに残るのは eslint の AST Literal 検査で届かない構造ケース:

- `ast-grep` 構造 lint（動的 shade 補間 `` `bg-${c}-${n}` `` 型、`<input>` / `<select>` の primitive 強制）
- `stylelint` CSS カスタムプロパティ整合チェック
- `eslint-plugin-tailwindcss` Tailwind クラス順序・未知クラス強制
