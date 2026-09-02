# 04 デザインの背骨（backbone）

> **位置付け**: 本 doc は `00-foundations.md` / `01-decision-rules.md` / `02-component-catalog.md` / `03-philosophy.md` を捨てずに、その上に被せる「まず守る骨」である。新しい画面を作るとき・既存画面を直すとき・レビューするときは、先に本 doc の 16 行に照らし、詳細は 00〜03 に従う。
> **成立経緯**: 2026-08-20、Opus 5 による 2 つの独立提案（A = 既存規範準拠 / B = 白紙）を Coordinator が突合・裁定し、owner が採用した（A / B の原文と統合案 C の mockup は [reference/](reference/README.md)）。両案の診断は「意味設計（色だけに頼らない・日本語ラベル主情報）は成熟しており、問題は視覚 system の断片化。しかも多くは規範が無いのではなく、規範があるのに実装が逸脱している」で一致した。
> **00〜03 への反映**: 本 doc の各行のうち 00〜03 に未記載・不一致のものは、UI batch 1（規範の履行）packet の Required Design Artifacts として同一 PR で 00〜03 へ反映する。反映完了までの間、本 doc の行は「採用済みの設計判断」として有効で、00〜03 と食い違う場合は本 doc を意図、00〜03 を現行実装基準として読む。

## 前提

個人経営の手芸店。IT ネイティブではない年配の店主が、Windows デスクトップ（ノート PC を含む）で毎日使う業務アプリ。「業務用だから動けばよい」ではなく、業務用だからこそ読みやすさ・迷わなさ・誤操作しにくさ・疲れにくさを追求する。各画面の仕事（機能・扱うデータ・操作の意味）は本 doc の対象外で、本 doc は見せ方だけを縛る。

**UI パーツ適用ルール（Q17）**: Q17 の UI パーツ適用ルールは ⑤カラム（常設 sidebar）に適合する。③ヘッダ（全画面共通ナビ・検索窓の常設帯）は本アプリに不在で、その役割は sidebar + PageHeader が分担する（`ui-design-rules-qa-v2.md` 5-3/6-3〜6-6、原田秀司『UIデザインの教科書［新版］』翔泳社、2020）。

## 16 の原則

各行は 1 文 + 由来（既存 = 00〜03 に既にある / A / B / owner 裁定）。

1. **文字は本文 16px を最低線にする。** 12px は badge の中だけ。見出しは h1 24px / h2 20px。（16px = 既存 foundations タイポグラフィの履行 — A 診断 #1。「12px は badge 内のみ」= B 推奨表 1 行目。現行の caption 段（12px、補助説明・タイムスタンプ）は badge 以外で 20 箇所超使われており、batch 1 で 00-foundations の caption 行を「14px muted」へ改める）
2. **色は家族で使う。** destructive（赤）/ warning（琥珀）/ success（緑）の 3 家族、各 soft・border・strong・emphasis の 4 段。`info` 家族は作らず、お知らせ・注意喚起は warning トーンで描く。token は使う前に foundations の色表へ登録する。（A 診断 #2: `success-strong` / `info-*` の未定義参照 5 箇所が本 doc 成立の契機）
3. **状態は icon + 日本語 + 色の 3 点で伝える。** 色だけ・icon だけは不可。（既存 DSR-08 — A / B 一致）
4. **badge は 3 種だけ。** ①状態 = outline + icon + soft 背景（在庫切れ / 在庫少 / PLU 未反映 等）②分類 = secondary pill・icon なし（廃番 / 手動 等）③強調 = 琥珀 pill（ランキング 1 位 / 最新 等）。4 種目を作らない。（B §2.6）
5. **1 画面に primary（琥珀塗り）は 1 つ。** 入口（ホーム）は最重要導線 1 つだけ primary にする。0 primary の画面は昇格を検討する。（既存 DSR-01 + A 診断 #3）
6. **画面の器は 1 つ。** `PageShell`（p-6 / space-y-6）を唯一の page root にする。一覧画面の検索・絞り込みは枠（rounded-md border p-4）に入れ、「検索条件」と「並び替え・件数」は段を分ける。（B §2.2 + A 診断 #5 #6 + B D15。00-foundations スペーシング表の「space-8 = ページ余白」行と数値が異なる = 現行実装の多数派 p-6 に合わせる意図、batch 1 で同行を修正）
7. **検索欄は全画面で同じ挙動。** live 型（入力で絞り込み）+ 検索ボタン併記。Enter を押させる commit 型の画面を残さない。（B D7、owner 裁定 2026-08-20。02-component-catalog ⑨ の canonical `SearchBar` は live 型「ボタンなし」/ commit 型の 2 実装で、本行と異なる = batch 1〜2 で ⑨ の skeleton を「live + ボタン併記」の単一形へ改める）
8. **押せるものは押せる顔をしている。** 行は hover 背景 + 右端 chevron、ボタン・入力欄は最小高 40px。（B D13 D17）
9. **入口と見出しは「何をする画面か」を 1 行で添える。** ホームの大ボタンは icon（24px）+ 題名 + 1 行説明、PageHeader は subtitle と actions を同時に持てる。（B D6 D11、SCREEN_DESIGN の元意図）
10. **icon は 16 / 20 / 24 の 3 段だけ。** 表内・badge = 16、ボタン・入力・ナビ・見出し隣接 = 20、ホーム大ボタン・空状態・画面題名 = 24。（既存 foundations の履行。B の 28 は不採用、ホーム大ボタンで弱ければ明示例外として追記する）
11. **待ち時間の顔を揃える。** 読込みは共通 `ListSkeleton`、空は既存 `EmptyState`、成功は toast、要再操作は上部 Alert（DSR-03）。（B D14 + 既存）
12. **密度は業務データ優先で現行を維持する。** 行高は 40px のまま。読みにくさは 1（16px）と表示スケール（DSR-13）で解き、行高で解かない。（既存 03-philosophy、owner 裁定 2026-08-20。B の 48px 2 段密度は見送り、16px 化の効果を確認後に再判定）
13. **UI 部品の枠は 3:1、構造線は一段濃くする。** 操作枠は隣接背景に対し 3:1 以上、構造線（3:1 対象外）も現行より一段濃くする。新しい色相は追加しない（Q7 原則①「色数をむやみに増やさないこと」`ui-design-rules-qa-v2.md` 4-1/7-1、原田秀司『UIデザインの教科書［新版］』翔泳社、2020）。（DSR-22、旧 SPEC-UILB-D1〈2026-08-23 旧 Lane 1〉を承継。token 提案値・実測は DSR-22 本文を参照）
14. **viewport を超える一覧の器は、上下に件数、header は sticky、識別列は opt-in で固定する。** 上部は件数 + 現在位置テキストを必須、pager ボタンは任意（Q12 §1「操作体系はシンプルなほうが使いやすい」`:419`、同書。同じボタンを上下 2 組出すと判断コストが増えるため安全側にする）。ソート列の明示（Q5 原則①、5-4）、余白でのグルーピング（Q5 原則③、6-9）、見切れによる続きの示唆（Q5 原則④、6-9）を含む。左 rail への 3 大操作常設（Q5 原則②、5-4）は sidebar が既に占有するため採らず横 toolbar 2 段（原則 6）で代替する（**Q5-② 適用外注記**）。ページングは「コントロール感」を保つため無限スクロールより本則とする（Q15、6-8）。一覧の器の統一は情報のグルーピングと選択負荷の低減にも資する（Miller's Law / Law of Common Region、Jon Yablonski『UXデザインの法則』第 2 版、相島雅樹・磯谷拓也 訳、オライリー・ジャパン、2025-01。DSR-19/20/21 と同型の引用範囲）。（DSR-22 + catalog ⑯、旧 SPEC-UILB-D2 を承継。必須構成 6 項目・文言 pin・perPage 裁定の詳細は catalog ⑯/⑩ を参照）
15. **現在の行は 3 点で示す。** 入力中 / 開いている行 / 選択行は、左 4px の primary バー + 淡い背景 `--row-current` + badge または文言の 3 点で示す（色だけに頼らない、DSR-08）。色数を絞った上で文字サイズの強弱で視線誘導する（Q8 原則④「色数を絞った上で文字サイズの強弱による視線誘導」7-1、同書）ため、行全体の primary 塗りはしない（原則 5 に反する）。同じ原則から、ラベルは小さく muted、値は大きく — 見出し / ラベル / 値の 3 段を画面をまたいで同じ型にする（値の文字サイズは 00-foundations タイポグラフィ表の metric 行〈28 or 30px、提案〉を参照）。（DSR-22 + catalog ⑯、旧 SPEC-UILB-D3 を承継。token 提案値は DSR-22 本文を参照）
16. **低視力を前提にした L3 項目と行内操作の当たり判定を持つ。** forced-colors / DPI 125% / 150% で崩れない（rem / em 基準、px 直書きを避ける）/ 実利用者セッションを L3 checklist に含め、行内 icon ボタンは見た目 16px のまま当たり判定 24×24 以上にする。見出しと本文を明確に区別し（Q8 原則①、4-2、同書）、PC はやや遠い距離で使われるため実サイズを大きめに保つ（Q8 原則③、2-3、同書）。**Q12 caution**: 高齢者・IT に不慣れな利用者への直接の配慮規定は同書になく（Q12 §2/§3、`:424-433`）、operator profile の根拠は QA v2 側からではなく WCAG / Laws of UX 側から引く。（DSR-22「低視力 L3」節、旧 SPEC-UILB-D4 を承継。L3 checklist 項目の詳細は DSR-22「低視力 L3」節を参照）

## foundations への追記分（token）

| 種別 | 値 | 備考 |
|---|---|---|
| success 家族 | soft `#f0fdf4` / border `#bbf7d0` / strong `#14532d` / emphasis `#16a34a` | strong・border を新設し warning / destructive と同形にする |
| info | 新設しない | お知らせ・注意喚起は warning トーン |
| page root | p-6 / space-y-6（`PageShell`） | 現行 3 系統を 1 つへ |
| 操作目標 | min-height 40px | ボタン既定 36 → 40 |
| icon | 16 / 20 / 24 | 「見出し隣接 = 20」を表に明記 |
| 検索欄 | live + 検索ボタン併記 | 部門 select 幅は全画面同一 |
| badge | 12px / 600 / pill、3 種 | 3 種構成は原則 4 の記述を正とする（DSR 新設なし） |
| 枠（提案、原則 13） | `--border`（構造線、一段濃く提案値 cdc8c4）/ 新設 `--border-strong`（操作枠、提案値 `8a8480`。`#` は Lane 2 実装時に付与し DS3 の突合対象へ戻す） | 3:1 は操作枠のみ対象、構造線は対象外（DSR-22） |
| 現在行（提案、原則 15） | 新設 `--row-current`（提案値 `fff8e6`。`#` は Lane 2 実装時に付与し DS3 の突合対象へ戻す） | 左 4px primary バー + badge/文言と併用（DSR-22） |

## 00〜03 への反映先（UI batch 1 packet で同一 PR）

- `00-foundations.md`: 原則 1 / 2 / 6 / 8 / 10 / 12（上記 token 表）
- `01-decision-rules.md`: 5（DSR-01 に「0 primary 画面の昇格」追記）/ 7（検索欄の単一挙動）/ 9（PageHeader subtitle 基準）
- `02-component-catalog.md`: 原則 4（⑬ ステータスバッジに badge 3 種の visual 仕様）/ 6（⑨ 検索行の器）/ 7（⑨ `SearchBar` canonical を live + ボタン併記の単一形へ）/ 9（① subtitle + actions）/ 11（ListSkeleton）
- `quality/review-checklist.md`: 原則 1（本文 16px）/ 2（token 登録）

## 適用の順序（参考、正本は各 batch の Plan Packet）

1. 規範の履行（table 16px / success token / 見出し統一 / PageShell / ホーム primary）— 機械的で全画面に波及
2. 器と導線（PageHeader variant / 検索欄 live 統一 / フィルタ行の枠 / ホーム説明文 / 40px / chevron / ListSkeleton）
3. badge 3 種の全画面適用
4. 月数回・年数回画面の個別 sweep、sidebar ラベル折返し、未使用 `App.css` 撤去

## 更新履歴

| 日付 | 内容 |
|---|---|
| 2026-09-03 | wave 8 lane 1 refresh — Final Review round 2 是正。原則 16 に「DPI 125% / 150% で崩れない（rem / em 基準、px 直書きを避ける）」を復元し、参照先を DSR-22「低視力 L3」節（新設）へ差替え。原則 15 の太字要約を「現在の行は 3 点で示す」に戻し、ラベル/値の 3 段規範文は本文へ移動（Q8 引用・metric 行参照は維持）。 |
| 2026-09-03 | wave 8 lane 1 refresh — Final Review round 1 是正。原則 13〜16 に Q5/Q7/Q8/Q12/Q15 と Laws of UX を Why に反映し DSR-22/catalog ⑯ へ委譲する形へ圧縮（1 文 + 由来）、前提節に Q17（⑤カラムに適合、③ヘッダは本アプリに不在）を追加。見出しを「16 の原則」へ改題（旧見出しから 4 項目増）し、badge 3 種を指す宙ぶらりん DSR-16 参照 3 箇所（token 表 / 反映先 / 適用の順序）を是正 |
| 2026-08-20 | v1.0 初版。Opus 5 提案 A / B の突合・裁定（Coordinator）、owner 採用 |
