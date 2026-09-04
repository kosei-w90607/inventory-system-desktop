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
| [mockup-d-forms-a.html](mockup-d-forms-a.html) | 統合案 D（入力画面、Lane 1b→Lane 2 実装値同期→Gated Amendment 4 closure round 1 で現実装 + Lane 2 差分へ限定）の商品登録・修正 / 入庫記録 / 返品・交換: `PageShell` の space-y-6 統一の前後比較（旧 space-y-4 との比較パネル、説明用・実装対象外を明示）、入力枠 `--border-strong` 化（入庫記録の明細行「入力中」badge + 左バーは後続候補へ移動）、末尾 4 区分 note（今回採用（Lane 2）/ 現実装維持 / 後続候補（本 mockup へ描かない）/ owner L3 所感） | 提案。静的 HTML、外部資源なし、合成データ。ブラウザで直接開ける |
| [mockup-d-forms-b.html](mockup-d-forms-b.html) | 統合案 D（入力画面、Lane 1b→Lane 2 実装値同期→Gated Amendment 4 closure round 1 で現実装 + Lane 2 差分へ限定）の手動販売出庫 / 廃棄・破損 / 棚卸し: 入力枠 `--border-strong` 化。棚卸しカウント一覧は DSR-22 mapping（`01-decision-rules.md:434`）の対象画面のため history と同格の例外として商品コード + 商品名の識別列固定（`id`/`id2`）を維持し、sticky header・上部 pager 帯のみ商品一覧 pilot 限定のため後続候補へ移す、末尾 4 区分 note | 同上 |
| [mockup-d-history.html](mockup-d-history.html) | 統合案 D（履歴・照会画面、Lane 1b→Lane 2 実装値同期→Gated Amendment 4 closure round 1 で現実装 + Lane 2 差分へ限定）の入出庫履歴 / 在庫変動履歴 / 操作ログ / 在庫少一覧: DSR-22 の画面→固定列 mapping（入出庫履歴 = 記録日時 + 代表商品〈先頭 2 列へ並べ替え〉/ 在庫変動履歴・操作ログ = 日時 + 種別）の識別列固定は history のみの例外として描き、AC-L3-5 で owner が最終確定する（sticky 上部件数帯は商品一覧 pilot のみのため描かない）。入出庫履歴の絞り込みは runtime どおり記録種別・開始日・終了日・SearchBar・記録ID・部門・状態の label 付き input/select、操作ログは `日時 / 種別 / 概要 / 詳細` 4 列 + subtitle「システムの操作履歴を期間・種別で確認します」+ 整合性補正の semantic list（架空の `実行者` は除去）、在庫少一覧は現実装の列順 `状態 → 在庫数 → 売価`、末尾 4 区分 note | 同上 |
| [mockup-d-home-sales-admin.html](mockup-d-home-sales-admin.html) | 統合案 D（ホーム・売上・管理画面、Lane 1b→Lane 2 実装値同期→Gated Amendment 4 closure round 1 で現実装 + Lane 2 差分へ限定）のホーム / 日次売上 / 月次売上 / バックアップ復元 / 整合性チェック / 在庫少の基準: `--border` 濃化後の card 群 + 確認 dialog 枠。ホームは現実装の 3 summary card + PLU warning + 前日未取込み alert + `毎日の作業` / `入庫・出庫` / `その他` の action 構成、日次は `部門` 列を含む商品明細（`ProductTable.tsx`）、日次・月次は別置き `TabsHeader` + 現実装の summary とレジ日報（公式）、Backup は「この控えに戻す」→ 警告 alert →「復元の確認へ進む」→ 最終確認 dialog の 3 段（`BackupRestorePage.tsx`）、整合性チェックは 6 列（商品コード / 名前 / システム在庫 / 入出庫の合計 / 差異 / 操作）、識別列固定・sticky 帯は商品一覧 pilot のみのため 4 一覧に描かない、末尾 4 区分 note | 同上 |
| [mockup-d-import-export.html](mockup-d-import-export.html) | 統合案 D（取込み・書出し画面、Lane 1b→Lane 2 実装値同期→Gated Amendment 4 closure round 1 で現実装 + Lane 2 差分へ限定）の売上データ取込み / 商品 CSV 一括インポート / PLU書出し: token 同期（本画面は実入力欄を持たず `--border-strong` の消費者なし）。日報 preview と前回結果は排他表示、商品一括インポートは 4 summary（登録対象/新規候補/重複/エラー）+ 3 section（新規登録候補・既存商品との重複・エラー行）、PLU書出しは復帰バナーの操作 button・要修正一覧の `理由` 列・未反映商品の `売価/在庫` 列・書出し設定 card を runtime から同期。DSR-22 mapping の対象外画面のため識別列固定・sticky 帯は描かない、末尾 4 区分 note | 同上 |
| [2026-08-23-current-design-analysis.md](2026-08-23-current-design-analysis.md) | 2026-08-23 現デザインの分析（旧 Lane 1 branch の gated amendment 1 起源）。全画面 mockup D 通し描きで得た画面間バラつき・doc 食い違い・改善案の棚卸し | 分析資料（非正本）。Lane 1a の起票時実測・原則 13〜16 の骨子として参照 |

旧 branch `agent/ui-list-backbone-d`（2026-08-23、Draft PR #2 @ inventory-system-desktop、main 未 merge）の mockup D は 6 file だった。Lane 1a では対象の 2 file（lists / 新規 stocktake）のみを追加し、残り 5 file（forms-a / forms-b / import-export / history / home-sales-admin）は Lane 1b として本 Lane 2 実装 PR に同乗し、CSS 変数を Lane 2 の実装値（`--border` 濃化 / `--border-strong` / `--row-current`）へ揃えて追加した。

3 つの mockup-c と 7 つの mockup-d は 1 つの CSS（token）系統から作成しており、画面間でバラつかないこと自体を確認点にしている。

## 使い方

- 新しい一覧画面や入口を作るとき: 対応する mockup を開き、枠・検索欄・行・badge の作りを合わせる
- レビューで「背骨 n に反している」と指摘するとき: mockup の該当箇所を根拠として指す
- 背骨を改定したとき: mockup の該当箇所を同時に直す（batch packet の Required Design Artifacts に含める）
