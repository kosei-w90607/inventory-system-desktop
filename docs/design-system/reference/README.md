# design-system/reference — 参考資料（お手本と提案原文）

[04-backbone.md](../04-backbone.md) の成立根拠と、背骨どおりに描いた「お手本」を置く。**ここにあるものは実装の正本ではない**（正本は 00〜04 と各 function-design）。背骨や規範が変わったらお手本も更新する。

| ファイル | 内容 | 扱い |
|---|---|---|
| [mockup-c-home.html](mockup-c-home.html) | 統合案 C のホーム画面（icon 24 + 題名 + 1 行説明の入口、primary 1 つ、warning トーンのバナー） | お手本。静的 HTML、外部資源なし、ダミーデータ。ブラウザで直接開ける |
| [mockup-c-products.html](mockup-c-products.html) | 同 商品検索・一覧（枠に入れた検索・絞り込みの 2 段、live 検索欄 + ボタン、16px 本文、chevron、PLU 列の状態 badge、廃番の分類 badge） | 同上 |
| [mockup-c-stock.html](mockup-c-stock.html) | 同 在庫照会（商品一覧と同じ枠・検索欄・行、状態 badge 3 点セット、開いた行の詳細 + 操作） | 同上 |
| [2026-08-20-proposal-A-rules-bound.md](2026-08-20-proposal-A-rules-bound.md) | Opus 5 提案 A（既存規範準拠）原文。実装の逸脱診断（file:line 付き）、規範へのフィードバック 10 件 | 提案原文。file:line は 2026-08-20 時点の snapshot で、以後の変更で古くなる |
| [2026-08-20-proposal-B-blank-slate.md](2026-08-20-proposal-B-blank-slate.md) | Opus 5 提案 B（白紙）原文。system としての再定義（PageShell / badge 3 種 / 2 段密度 / 検索統一 等） | 同上。採否は 04-backbone の各行に記載（28px icon・48px 行高は不採用 / 見送り） |
| [mockup-d-lists.html](mockup-d-lists.html) | 統合案 D（一覧の器、Lane 1a）の一覧画面: 上部件数 + sticky header + 識別列固定 + 現在行 3 点、perPage 50 / 200 の密度比較（200 は「約 9 画面」の数値注記付き）、番号付き未決項目 | 提案。静的 HTML、外部資源なし、合成データ。ブラウザで直接開ける |
| [mockup-d-stocktake.html](mockup-d-stocktake.html) | 統合案 D（棚卸し、Lane 1a）の owner 所感対応: 進捗 header 現行 / A（サマリ帯）/ B（見出し分離）の 3 案、完了画面 現行 vs C（DSR-16 準拠再構成）を差異 0 件 / 12 件 / 不整合ありの 3 状態で比較、番号付き未決項目 | 同上。仮説であり owner 視認（Human Gate）で確定する |
| [2026-08-23-current-design-analysis.md](2026-08-23-current-design-analysis.md) | 2026-08-23 現デザインの分析（旧 Lane 1 branch の gated amendment 1 起源）。全画面 mockup D 通し描きで得た画面間バラつき・doc 食い違い・改善案の棚卸し | 分析資料（非正本）。Lane 1a の起票時実測・原則 13〜16 の骨子として参照 |

旧 branch `agent/ui-list-backbone-d`（2026-08-23、Draft PR #2 @ inventory-system-desktop、main 未 merge）の mockup D は 6 file だったが、本ディレクトリには Lane 1a 対象の 2 file（lists / 新規 stocktake）のみを追加した。残り 5 file（forms-a / forms-b / import-export / history / home-sales-admin）は Lane 1b として後続 Lane 2 実装 PR に同乗する（本 PR では追加しない）。

3 つの mockup-c と 2 つの mockup-d は 1 つの CSS（token）系統から作成しており、画面間でバラつかないこと自体を確認点にしている。

## 使い方

- 新しい一覧画面や入口を作るとき: 対応する mockup を開き、枠・検索欄・行・badge の作りを合わせる
- レビューで「背骨 n に反している」と指摘するとき: mockup の該当箇所を根拠として指す
- 背骨を改定したとき: mockup の該当箇所を同時に直す（batch packet の Required Design Artifacts に含める）
