# Backlog

未了作業・保留・受容済みリスクの参照先。作業を選ぶときに読む。現在の進行状態と active packet は [Plans.md](Plans.md) が所有する。

元の本文・未決判断・参照先を移送した。古い記載だけで現在の未実装や blocker と断定せず、着手時に関係する正本と実装を照合する。履歴は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md) を参照。

## Backlog（未了）

3 軸で小節分け（owner 2026-09-11「着手対象と保留と記録目的で分けたほうが良い」）。**着手対象** = やると決めたもの（「次に動く lane」は上から順の固定順、それ以外は順番未定）/ **保留** = 要望・実需・顕在化を待つもの（着手判断は owner）/ **記録目的** = 受容済みリスクや revisit 条件付きで、行動を待つ項目ではないもの。2026-09-11 棚卸し: 済み 6 件（mockup-d-lists 定数名同期 / command drift 検出〈⑯〉/ bindings trailing whitespace〈再生成後 0 件〉/ eslint 保守性 rule〈⑯〉/ palette ban の ui・layout glob〈⑫〉/ drift 同期 PR #37 の P3）+ 完了ポインタ 5 行 + UI-15 改名の double-click（`RenameSupplierRow.tsx` の `mutation.isPending` disabled で対処済み）を除去。

### 着手対象

#### 次に動く lane（順番固定）

- doc-consistency の WARN 5 件掃除（supplier カラムの DB_DESIGN 未定義 3 / ページング上限未定義 1 / 未確定マーカー 2 箇所）: owner 2026-09-08「残しておいてもいいものでもない」→ ⑯ の次の衛生 lane 候補。Dependabot の default branch 指摘（2026-09-11 push 時表示は 3 件 = moderate 2 / low 1、npm 常設ガード下で名指し確認）も同 lane。**owner 2026-09-11「後回しにしてるけど直すタイミング設けよう」→ ⑲ merge 後・runtime lane の前に衛生 lane（R1 docs-only、Codex 1 発注）として実施する**。mockup-g の `:has()` selector（参照 mockup 中 g のみ、動作影響なし、⑳ Final Review round 3 Opus P3-11）も同 lane で `.legacy-header` 等の明示 class へ
- **フィルタ Label 上置き + 見出し 2 段の runtime lane**（design ⑳ 完了 2026-09-11、canonical = catalog ⑨ 使用トークン / ① 構造 + セクション見出し variation / mockup-g。Scope = archive packet S6 の申し送りが正本: `DepartmentFilter` → `grid gap-1`〈4 サイト一括〉/ 商品一覧 2 段目・在庫照会・一括価格改定 表示件数・棚卸し toolbar〈Checkbox は label 内包 + `self-center`〉・整合性検証 の上置き / **一括価格改定 toolbar の Checkbox（「廃番を含む」「取引先未設定の商品も含める」）も行の縦中央 `self-center`**〈owner 2026-09-11「表の真ん中に置いてほしい、下に書くんじゃなくて」〉/ `SegmentedControl` に `label?` prop〈`<span id>` + `aria-labelledby`〉+ 商品一覧 3 箇所 / `SearchBar` の `Label` に `font-normal` / **`PageHeader.tsx` の actions 分岐を見出し行 + 説明行へ**〈h1 `min-w-0 flex-1`、JSDoc `:21-27` + inline `:30` も更新、描画差は商品 CSV 取込みのみ、subtitle 5 page は説明が 4px 下がる〉/ 形態 C 2 箇所〈`IntegrityCheckPage.tsx:325-334`、`StocktakePage.tsx:385-407` は `space-y-2` 内に `space-y-1`〉/ 形態 A・B の h2 `text-lg` → `text-xl` / catalog ① `:28` canonical 行に `description?` 1 語〈⑮ 起源〉/ L3 抜き取り = 商品 CSV 取込み + subtitle 持ち page 2 つ + 棚卸し進捗。廃番表示 3 択 / PLU表示 5 択の SegmentedControl は DSR-02 drift〈Tabs / Select 化の要否は本 lane packet で判断〉。R3、M、Codex 実装、Plan Packet 必須）。
- **表示小修正 batch 2 候補**（owner 2026-09-11 所感、次の小 lane でまとめる）: 在庫少の基準画面で page 見出し h1「在庫少の基準」と `FormSection` の title「在庫少の基準」が同文言で二重に大きく出る（`ThresholdSettingsPage.tsx:187` / `:228`。区画見出しを「基準値」等の別語にするか、区画見出しを外して説明文だけ残す）/ **Alert の title（icon の真横の文言）を太字に**（owner 2026-09-11「アラートはアイコンの真横の文言は太字にしようぜ」。`src/components/ui/alert.tsx` の `AlertTitle` 1 箇所で app 全体に効く共通 component の変更。現行は `font-medium`（500）で、`font-semibold`（600）へ。catalog の Alert 節に weight を明記）/ **在庫照会に page 説明（副題）1 行**（mockup-d-history の文、owner 2026-09-11）/ **在庫状態 Badge の「通常」→「正常」**（owner「状態なら正常のほうが文言として正しい」。canonical = catalog ⑫ Badge 見本 `:868` `:905` + function-design 74 + `StockStatusBadge.tsx:36` + test を同時に更新）/ **在庫切れ・在庫少 filter 時の件数行「全 N 件のうち a〜b 件を表示」**（現行は `StockInquiryPage.tsx:225-227` で status = all のみ描画。`low_stock` source は backend が totalCount を返さない〈null〉ため。client 側で全件数を数えられるなら client で、無理なら backend に count を足す、を lane で判断）。**在庫少の基準の inline エラー文言を mockup の形（範囲が一目で分かる 1 本）へ**（owner 2026-09-11「モックのほうが情報量的に好き」。現行は `THRESHOLD_ERROR_MESSAGES` の 3 種〈入力してください / 1以上の整数を入力してください / 99999以下で入力してください〉→ 「1〜99999 の整数を入力してください」系に統一、function-design 69 §69.7 の文言表 + test を同時に更新）。上部の「保存できませんでした」Alert は現行にも実装済み（backend の保存失敗〈片方だけ保存済み〉の場面のみ、入力エラーでは出ない）で mockup と一致、入力エラー用の上部 Alert は作らない（owner 2026-09-11 合意）
- **ホーム画面を mockup-c 案へ寄せる**（owner 2026-09-11「これ好き、採用したい」。canonical = `reference/mockup-c-home.html`〈お手本〉、現行ホームは骨格〈上段 4 card + 3 区画〉が既に同型なので runtime 直行で可）: 差分 = (1) 各 action card に icon + 1 行説明〈既存の後続候補「ホーム action への説明文追加」〉/ (2)「売上データ取込み」card の primary 強調〈warning トーンの枠 + 背景〉/ (3) 上段 card の補助文言〈「基準を下回る商品」「レジ反映待ち」はそのまま。**在庫切れ card の「すぐ確認」だけは導線に見えるため状態説明の別文言へ**（例「在庫 0 の商品」、Writer が候補を出し owner 確認）〉。owner 2026-09-11 確定: 「補助文言は状態の説明であって導線ではない」を決定として更新し、「すぐ確認」以外は mockup-c をそのまま採用。**前日分未取込みの alert は現行（`HomePage.tsx:80`、danger トーン + 「最後の取込み精算日」）を変更しない**（owner「これこのまま使おうぜ」）。他画面の mockup（c / d 系）は owner が改めて見直し中、追加要望があれば本 lane に同乗

#### やると決めたもの（順番未定）

- Z001 / Z002 / Z005 の取り込み情報を画面で見られるようにする（owner run 3 原文「無いのはまずい」= 要望、後続候補ではない）: DTO 公開 + 表示設計、design-first（**owner 2026-09-11 再確認「やるべきこと」**）
- **単位の拡張（design-first、owner 2026-09-09「やっておきたい」）**: 現状 = DB `CHECK(stock_unit IN ('pcs','cm'))`、bindings `ProductStockUnit = "pcs" | "cm"`、UI は `formatStockDisplay` / `formatStockUnitLabel`（switch 2 arm、default「—」、param は `string`）。⑮ で UI 側の単位表示は formatter 1 箇所に集約済み。owner 提示の候補 13 種 = 個・枚・本・袋・箱・巻・組・セット・m・cm・g・kg・丁（g は店に要否確認中）。設計論点（Codex 助言 2026-09-09、Fable 賛同）: 長さ商品は基準単位 cm で在庫を記録し m は入力・表示の固定換算（整数契約 `31-biz:66` を維持しつつ 0.5m を扱える）/ 巻↔m は商品依存で換算しない / 単価の基準（1m か 1cm か、POS 数量 1 の意味）を在庫単位と別に明示 / 在庫少閾値は「連続量」で一括りにせず既存の通常・生地の適合を確認して必要な区分だけ追加 / 組とセットの code 衝突 / code を英字で続けるか日本語 label を code にするか。起点 = owner の質問シート回答（長さ商品は最小何 cm で売る・数えるか、同じ商品を m で仕入れて cm で売るか）。衛生同乗: formatter の param を `ProductStockUnit` にして exhaustive switch（未知単位を compile error に）。R4 相当（DB migration + Rust enum + bindings + CSV validation）
- 廃棄・破損の保存結果に「詳細を見る」+ `returnTo` を追加するか（現行 UI-05-D17 は「保存結果に link なし」を契約化済み。追加には UI-05-D17 改訂の design 判断が先行 — PR #23 owner L3 所感 2026-08-31 起源。歴史的非対称であり表示すべきでない業務理由は source docs に見当たらない、が owner 観察）。（**owner 2026-09-11「やったほうがいい」で格上げ**: UI-05-D17 の改訂を design 判断 1 行で先行し、入庫・返品交換と対称化する小 runtime lane）
- MSI 配布手順 docs 化（v1.0 gate。「次の行動」⑤と対応）。
- Z004 layout B 対応 + 混在期間の非 PLU 商品 end-to-end 再検証（layout A は PR #81 で消化済み、PLU スロット永続割当 design-first は PR #84 で正本化済み。残 = layout B 対応、混在期間の非 PLU 商品 end-to-end 検証）。
- CSV 出力・印刷の実挙動確認（owner run 3 原文「まともにテストしたことがない」「印刷は中身を作っていない」）: end-to-end で叩いて紙面 / 出力 file の実態を証跡化してから要否を裁定
- 日報取込み標準手順の残設計（issue #135 派生。保持期間・命名・取込み途中・再取込みの設計と店舗マニュアル反映が残る。同日複数精算は D-071 / PR #79・#80 で実装済み）。
- 日報画面の Excel 印刷・バインダー代替受入判定（現行 Excel + 印刷 + バインダーが日別記録を残す唯一の手段。実 1 日分での公式集計・過去日到達・欠落日・修正/再取込み・backup/restore 後の再現を横並び確認し、印刷機能の要否を go-live 前に判定する）。

#### ⑰ 起票の小 runtime（次の小 lane に同乗可）

- （⑰で起票 2026-09-10）**商品修正の操作ログ detail_json に非価格 field の変更前後を含める**（owner L3 所感 2026-09-10「更新したのに詳細情報なし」。`src-tauri/src/biz/product_service.rs:360-374` `update_product` が売価 / 原価変更時のみ `detail_json` を書く。`30-biz-product-service.md:164` は「変更前後の値を JSON 化」で価格限定なし、`74-ui-operation-logs.md:609` Ledger に既知ギャップ）。runtime lane、S〜M、R3〈wire 契約〉
- （⑰で起票 2026-09-10）**`formatDateTime` の置き場**（`inventory-records/types.ts` から 7 feature が import、rule-of-three 到達、`src/lib/` 移設候補。⑰ Sonnet Plan Review P3）
- （⑰で起票 2026-09-10）**PLU export の日時書式統一**（`PluExportPage.tsx:159` `formatPendingSavedAt` が `YYYY/MM/DD HH:mm`、他画面は `YYYY-MM-DD HH:MM:SS`。prose 文脈、⑰ Opus Plan Review P2 で除外記録）

### 保留（要望・実需・顕在化待ち）

#### 見た目・UX

- 記録状態 Badge の tone（`formatRecordStatus`: 有効・訂正済み = 中立 / 進行中 = warning / 取消済み = destructive、owner 決定 2026-09-08。catalog `:841` の「owner culling で個別確認」保留を解消）: 中立 Badge の見栄えを `StockStatusBadge`「通常」と同じ無彩色 soft（`border-stone-200 bg-stone-50 text-stone-600`）へ揃える案を併記。⑮ S7 が同 Badge 群を触るため ⑮ merge 後の小 lane（catalog culling 欄へ決定を記録 → runtime）。方向 badge（入庫 / 出庫）は owner 撤回済み（`:70`）、分類なので無色維持
- 在庫整合性検証の差異 Badge（`differenceLabel`、outline 中立）に tone を付けるかの owner 所感（2026-09-08）: ⑭ plan は中立維持を明示決定。数値側が DSR-08 で着色済みのため Badge にも付けると同 cell 内の二重符号化。付けるなら数値 / Badge のどちらか一方、DSR 側判断として design lane で扱う
- UX 磨き 3 観察（PLU 警告の視認性 / 処理中フィードバック不足 / 薄いグレーの多用 — PR #26 L3 owner 所感 2026-09-01 起源、機能契約非影響。design-first で要望が続けば起票、参考候補に Refero サイトを含める〈owner 提示〉）。**2026-09-02 更新**: 『UIデザインの教科書』突合で 3 観察とも根拠付き（薄いグレー ↔ 現在地色 drift、PLU 警告 ↔ DSR-08 icon 欠落、処理中 ↔ リアルタイム検証 / feedback）。PLU 警告の視認性は wave 8 lane 1（PluNotificationBar icon 同乗）で消化中、残 2 観察は UI ターンの画面単位 design packet 群へ編入。
- 商品一覧の scroll 復元で「ディレイ入れてるかな？」と感じる体感（owner L3 run 4 所感 2026-09-07、Lane 4 PR #40、原文 = [owner L3 原文](design-system/reference/2026-09-04-owner-l3-feedback-raw.md)「Lane 4 PR #40 L3 run 4 原文」）: 行 data の非同期到着後に `applyWhenScrollable` が位置を当て直す機構の体感。data 到着前に箱の高さを仮置き（skeleton / min-height）して「二度動く」感を減らす案。どの操作で感じたかは未特定、要望が続けば起票、S
- 取消完了 toast の視認性追加検討（PR #15 で duration 8s 化済み。owner 所感で不足なら ページ内 Alert 併用を第 2 弾で検討）。
- CostDiffDialog 結果画面への再表示ボタン（PR #15 P1 裁定で今回不採用 — 状態管理拡大を伴うため要望が続けば別 change。見送り時は次回入庫で再提示される既存契約が safety net）。
- CostDiffDialog の structured action list 化（更新 / 見送りの帰結を定型構造で並べる表示強化。PR #17 で説明文言 3 点は明記済み、さらに一歩の磨きは要望次第 — owner L3 2026-08-30 所感起源）。
- 整合性補正結果への商品名併記（現行は商品コードのみ。PR #17 の divide-y 化とは独立の情報追加 — owner L3 2026-08-30 所感起源）。
- 廃棄・破損画面にヘッダ備考（任意）がない（入庫 / 返品交換には備考あり、`64-ui-disposal.md` は明細の理由のみ。owner 所感 2026-09-03。DB 列追加を伴う R3 のため Lane 3〜5 で廃棄・破損画面を触る際に同乗候補、母集団は 35-biz と DB_DESIGN で裁定）
- UI-08 prepare failure Alert の読みやすさ改善（PR #128 L3 P3-2 起源、operator UI）: 「PLUファイルに書き出せる商品がありません」の Alert が対象商品コードを横並びで列挙しており読みにくい。要約表示 + 要修正一覧と同じ構造化テーブルへの改善が必要だが、現在の prepare failure 経路（`BizError::ValidationFailed` の message 文字列埋め込み、`plu_export_service.rs` `build_all_excluded_message`）は CMD/BIZ 契約拡張を要する。UI-08-D10 の scope 外として切り出し。
- 4 作業画面の保存結果 panel を詳細往復時だけ one-shot 復元する案（現行は詳細 → 戻りで panel が消える。復元条件・サイドバー再訪との区別は DSR-03/DSR-19 系の design 判断が先行 — PR #23 owner L3 所感 2026-08-31 起源）。
- 在庫詳細→取引画面の prefill（61/63/64: productCode/direction 事前入力、現行は商品再検索が必要）。
- Lane 4 GA4 の残余（Final Review Opus P3、2026-09-07）: 件数帯の `z-20` は箱の外では dead CSS（撤去 + selector を `data-list-summary-band` へ、test 5 箇所の churn あり）/ `docs/design-system/reference/mockup-d-lists.html:112` の「箱内スクロール `max-height:56vh` は不採用」記述が GA4b で stale。次に ListShell / mockup を触る lane で同期、S

#### 機能・運用

- D-023 POS adapter boundary の実装側未充足（2026-09-05 Fable 実測、2026-09-08 Codex 監査で訂正・再棚卸し）: **訂正** — 旧記載「`sales_repo.rs` 37 箇所が最多」は Codex 監査（2026-09-08、read-only、report は Coordinator 保管 `.local/codex-orders/reports/10b-pos-adapter-boundary.md`、gitignore 配下）で全件 `#[cfg(test)]` 内と判明。production の CASIO 固有語漏出は実測 41 行 / 61 出現（IO 層は正当な置き場所として除外）。本体は `DailyReportSourceKind`（Z001/Z002/Z005）が IO → BIZ → CMD → `bindings.ts` → frontend まで型のまま流れている点と、`schema_v4` の CHECK 制約が `casio_sr_s4000` / Z001 等を値として固定している点。**推奨** = B 初段（`io::casio` に literal と source/adapter ID を集約 + report id → `ReportKind` 変換関数、BIZ 以降は `ReportKind` だけを見る、legacy hash / JSON wire 互換は identity helper で維持、7〜9 file、migration 不要、trait / factory / registry は作らない）+ 副産物として「アプリが任意のレジに求めるデータ契約の要件表」を docs 化。A（adapter trait 導入）は第 2 機種の実契約が確認できた時のみ。**owner 状況**（2026-09-08 原文要旨）: 現行レジはリース契約で残り約 2 年、満了時に返却して新機種を探す見込み、「こっちのアプリに合わせて探す」方針あり = 機種変更は見える範囲、検討中。**起票判断**: 衛生 batch 3（⑯）の次の Codex 実装 lane として起票候補（M、R3）
- PLUスロット永続割当の恒久設計（CV17 import が メモリNo. merge のため現行再採番と衝突。[2026-07-03 packet](archive/plans/2026-07-03-post-ui08-janless-plu-target-design.md) D-6 参照）。
- PLU slot 後続 follow-up（PR #84 packet Non-scope 起源）: Z004 売上取込み〈BIZ-03〉内でのスロット占有自動更新（要望が出たら別 packet）/ CV17「レジスターの設定」書出し .txt の読込み対応（owner 裁定 Q2 = A で不採用、レジ側単価とアプリ売価の突合等の別要求が出た時のみ再検討）。
- UI-09a・09b 将来設計（UI-09b の日報 coverage 表示「一部日だけ日報がある月」の取込み済み日数、SALES2-D3 で自覚的 defer〈batch A から移管〉、34-biz §19.4 参照。`get_monthly_sales` DTO 拡張を伴う R3）。
- 在庫状態表示の filter 依存不整合（在庫 2・基準 3 の同一商品が「すべて」filter では状態「通常」、「在庫少」filter では「在庫少」と表示される。query source 依存の pre-existing 仕様で受入台本 L3 2026-08-13 の owner 観察起源〈PR #74 comment〉。operator には矛盾に見えるため follow-up 要否を検討、優先度は owner 判断）。
- 部門 17「本」のバーコードなし本・ISBN-10 本の登録経路（JAN 専用欄正規化 change の owner 裁定 2026-08-11 起源 = 本は 13 桁 JAN〈EAN-13/ISBN-13〉登録・ISBN-10 特例なし。部門 17 は code_prefix NULL のため JAN 欄空白の escape hatch が使えず、ISBN-10 のみの古書・バーコードなし本は登録不能のまま。要望発生時に code_prefix 付与 or ISBN-10 対応を再裁定）。
- UI-01a 商品検索への取引先 filter 露出（backend `ProductSearchQuery` の `supplier_id` / `include_unassigned` は PR #95 で実装済み・UI 露出は UI-14 のみ。50-ui 画面契約の改訂が必要。UI-15 は PR #4 で完了済みのため着手可、UI 一覧の背骨 D 系の画面見直しとの前後関係は着手時に owner 判断）。
- CsvImport / Stocktake detail page の静的入口未整備（PR #20 packet 起票時実測起源）: `/csv-import/records/$importId` / `/stocktake/records/$stocktakeId` は横断 hub 経由のみ到達可能で、専用一覧などの静的入口は未整備。入口設計は実需発生時の別 change とする。
- csv_import / stocktake の関連記録 link 実効化（詳細 route は実装済み。record_type producer 採用 + §74.9 許可リスト追加を併せて行う別 follow-up — 2026-09-01 の producer 実効化 R3〈PR #26〉では owner 裁定で据置、74 §74.9 / §74.16 に据置判断明記済み。実需発生時に起票）。
- 入出庫履歴の完成形 runway 残余（横断 hub 検索の 6 種対称化・棚卸し合流・検索母集団差の利用者説明は PR #14〈2026-08-29〉で完了。残余 = 専用一覧 `/csv-import/records`・`/stocktake/records` と `listCsvImportRecords` / `listStocktakeRecords`〈完成形契約のまま実需発生まで残置〉+ slice 6 の CSV 出力・印刷/控え + slice 5 の取消/訂正・`corrected` status）。
- receipt 添付の follow-up（63 §63.8: 画像表示・削除・orphan cleanup・共通添付化）。
- 一括価格改定の運用支援 3 点（77 §77.9: 新売価算出補助・複数行一括確定・改定前入力の長期保持）。
- 取引先一覧の操作性（78 §78.12: 検索・sort・paging・bulk rename）（検索は ⑱ で設計済み・runtime lane で実装、sort / paging / bulk rename は残置）。
- daily-report-import の FilePicker multiple 対応（共通 FilePicker 化・前回フォルダ記憶は完了済み、multiple 対応のみ要望発生時に別 R3）。
- バックアップ保存先の UNC / ネットワークパス対応（PR #149 L3 で発見、既存 MNT-01 挙動）: UNC パス指定時 `VACUUM INTO` が「database is locked」で失敗する。対処候補 = ①設定時に UNC を検証して拒否 ②ローカル一時ファイルへ `VACUUM INTO` → 保存先へコピーの 2 段構え ③エラー文言の改善。優先度は店舗運用でネットワーク保存先を使う要望が出るまで低。
- restore 遅延成功の DB log 非依存な起動通知（PR #14 Codex 第 7 round P2-2 起源）: durability 不明で終わった restore が再起動後の reconcile で committed 回復した事実を、UI 起動通知（toast 等）で operator へ渡す強化。二重障害系列（電断 + operation_log 書込みの持続障害）のみで必要になるため優先度低。
- バックアップ一覧の肥大化 UX（保持日数で自然減のため優先度低）。

#### workflow / test / lint / docs

- STATECAP 検査の stacked train 継承除外（`check-workflow-git.sh` の範囲 `merge-base(origin/main, HEAD)..HEAD` が stack 点以前の他 lane forward state-only commit を自 PR に計上する。PR #86 で実測、docs 側の運用規律は正本化済み、機械側の範囲判定是正は設計非自明のため将来判断）。⑪ packet で候補案 2 つ（Plan Commit 起点化 / 明示 override 引数）とトレードオフを記録済み、設計非自明のため Scope 外・owner / Coordinator 判断待ちのまま Backlog 残置。
- PK4 の section 抽出が `###` で打ち切られ `### Wave Registry` 配下 link が検査対象外になる問題（wave 1 plan-gate round 1 P1 起源。PK 系 checker gap 是正 PR #69 の Post-Freeze follow-up として別件残置、優先度は owner 判断）。⑪ で起票（Scope）。
- squash merge の subject 明示: `gh pr merge --squash` は既定で PR title を subject にするため、plan-first で開いた PR は起票 title（例: PR #43 `e78d3c5` = 「⑪ … packet 起票」）のまま main に入る。Coordinator 代行の merge では `--subject` で conventional な件名を明示する運用に固定（2026-09-07 実発生、履歴は書き換えない）。DEV_WORKFLOW の Ready/merge 手順への 1 行追記は docs 小口候補
- Codex review-only 発注向けの Session Start fast path（`AGENTS.md`）: `codex exec` は毎回 context ゼロから `AGENTS.md` `Session Start` の canonical reading order（正本は `AGENTS.md` `Session Start`、D-034 によりここでは再掲しない）を全読みする。2026-09-07 の実測では環境検証で即停止した run でも 26k〜39k token を消費し（1 run 15〜25 万 token の 13〜20%）、round 2 以降の delta 再検証（監査対象 2〜5 file）では過剰。案 = `AGENTS.md` `Session Start` に「review-only 発注（発注書に明示）は Plan Packet / Matrix / 指定 review 観点のみ読む」fast path を 1 節追加し、発注書 template に対応する宣言行を置く。repo 契約の変更なので小口 docs PR で起票（起票元 = 2026-09-07 Codex exec バッチ運用、8 通 ×3 round の実測）
- Codex exec バッチ発注 + Coordinator 監視の runbook（AGENT_OPERATING_MANUAL §5.7 候補、owner 提案 2026-09-08）: §5.4 / §5.6 は発注書の中身 profile のみで起動機構が未文書化。owner 端末側（`.local/codex-orders/NN-*.md` 発注書、`codex exec -s danger-full-access --ignore-rules -c agents.enabled=false -c model_reasoning_effort=medium "$(<file)" > log 2>&1`、`/tmp/codex-NN` worktree と完了後 detach、session id 明記、`HEAD:branch` push 禁止、報告 1 回契約）と Coordinator 側（30 分 wakeup、log は末尾 tail のみ、完了判定 = 最終報告 block、完了時の自動後続 = origin tip と END_HEAD_SHA 照合 → PR body 転記 → Sonnet 一次 → 裁定 → L3 依頼）を 2 役 1 本で。同時に DEV_WORKFLOW の L1 手順へ「L1 full は 1 worktree 1 run（並走すると開始時 TREE_STATE=DIRTY で merge evidence 無効、2026-09-08 実発生）」を 1 行
- Final Review の固定観点「保守者として読めるか」の docs 化（owner 決定 2026-09-07、Astra の圧縮 code 問題への対応。命名 / 理由 comment / 賢い圧縮より退屈な構造 / 関数長 → P2 maintainability）: `docs/DEV_WORKFLOW.md` の Review Focus template と `AGENTS.md` に宣言 1 行を足す docs 小口。Codex 発注書 7 通（2026-09-07 夜）には挿入済み、S
- Workflow 自走化 mechanical slice 2（PK4/PK5、drift grep test、hook 評価。design + implementation slice 1 は PR #162/#163 で完了、slice 2 は Appendix C として別 Plan Packet へ deferred）。
- Workflow 自走化 第 3 層（自走ドライバ）: 単一エントリポイントが状態ファイル群から次の dependency-ready フェーズを決定 → 実行 → gate 通過で状態更新、を人間ゲートに当たるまでループする構想。前提 = 第 2 層完了、3 層構想の経緯は第 2 層着手時の Design Phase で decision-log / 設計書へ昇格予定。
- `scripts/check-command-drift.sh` の「D の収集漏れ N 件」message に対処ヒント（`#[tauri::command]` と `pub fn` の間の未対応区切りを疑う旨）を添える（⑯ Sonnet closure P3、no-action 記録）
- TanStack Router generation settings の統一（起草時実査 2026-08-30: vite plugin `tanstackRouter({ autoCodeSplitting: true })` と `tsr generate` CLI の 2 系統併存・tsr.config.json なし。統一方針〈CLI script 撤去 or tsr.config 明示化〉の小裁定 + 生成物同一性検証を伴う単独小 change として着手）。⑫ で起票（tsr.config.json 明示化を採用、生成物 byte-identical 実測済み）。（**2026-09-11 棚卸し**: `tsr.config.json` は現存、vite plugin `tanstackRouter` と `tsr generate` CLI の併存は継続。前提の「tsr.config.json なし」は失効、統一裁定は未了）
- architecture_test の re-export 洗浄検出強化（cmd が biz/mnt の re-export 経由で db symbol を消費する間接依存は現行の use 行 literal match で検出不能 — 順12 実装 AMD2 で実証。cmd-task-specs に検出境界を明記済み、検出強化は将来判断）。⑯ で起票（C′ = allow list による直接再公開の増加禁止のみ、D-083。alias/type alias 洗浄の A 拡張は Non-scope のまま Backlog 残置）
- shortcuts の retroactive unit test（54 §54.9、延期理由「Vitest 未導入」は失効済み・test file 0 件）。
- eslint palette 外色 ban の残り非対象 dir（`src/components/common/**` / `src/components/FilePicker.tsx`。⑫ Final Review Opus P3 2026-09-07、probe では現状 CLEAN）: 次に `eslint.config.js` を触る衛生 batch で `ui/**` `layout/**` と同じ追加 block 方式（既存 block 不変・glob 非重複・barrel block より前）で拡張、S
- `PluExportPage.tsx:188` の complexity 分割（⑯ 起票時実測 10a §3 item #1 起源、complexity 69。保存・未確認復帰・確認・snapshot 読込みの state/表示条件混在を flow hook / 状態 panel へ分割する候補、本 lane では disable + 見送り）、M
- `ReturnExchangePage.tsx:185` の max-lines-per-function 分割（⑯ 起票時実測 10a §3 item #2 起源、793 行。画像保存・再送 key・返品方向変換・検索・結果表示を画像/明細/保存 flow の責務単位で分割する候補、本 lane では disable + 見送り）、M
- inventory-operator-ui SKILL.md への DSR-16 判断手順追加（sandbox の `.claude/skills` write deny により Claude worker 経路不可 — Codex 発注 or owner 手動の小 change、PR #15 起源）。

### 記録目的（受容済みリスク・revisit 条件付き）

- SidebarLink の focus 中は `focus-visible:border-ring`（詳細度 0-2-0）が DSR-21 の左辺 Primary を上書きする（at rest は無関係、一過性。PR #28 Final Review round 2〜3 観察、意図的な a11y 挙動のため要望があれば DSR-21 に focus 時の扱いを追記）。
- dialog/AlertDialog 内の dl・table が aria-describedby に含まれない既存同型制約（3 site 共通、スクリーンリーダー初期読み上げ対象外 — Opus round 指摘起源のアクセシビリティ磨き候補）。
- 在庫少閾値の非数値 fallback 可視化（UI-11a 実装時の事実確認起源）: BIZ `list_low_stock` が `stock_low_threshold` / `stock_low_threshold_fabric` の非数値値を無警告で fallback する（ログ・operation_logs 記録なし）。DB 直接操作以外で非数値が入る経路が現状ないため優先度低。
- 商品取込み上書き確認の実機 visual 未観測（PR #25 L3 で fixture 不足〈上書き確認へ到達する import file 不在〉の残余リスク受容済み、T7/T9 自動被覆あり。import file fixture が整った機会の随時確認で足りる、義務ではない）。
- 確定処理の所要時間を件数増で実測（棚卸しカウント画面の磨き batch owner 判断 2026-09-02 起源、C7 見送り分。「体感待ちなし、件数増で 1 秒超なら progress を検討、処理高速化に投資する方が良い」との owner 判断を受け、実測が先行事項として残る）。
- 棚卸しカウント除外の長期滞留在庫（issue #91、2026-08-22 回答済み）: 除外基準は年数でなく原価根拠の有無（伝票保管義務範囲外で廃棄済み・取引先データなし・バーコードなし・販売に適さない見た目）、規模は例年 1〜2 点・多い年で 4〜5 点。owner 提案どおりシステムでは表現しない（除外品は単品コード非付与 = 商品マスタ外、部門キーで商品非連動販売、復活時は新規登録）。35-biz-stocktake-service.md / 73-ui-stocktake.md への母集団明記のみ残作業、owner 同意で close 候補。
- 検証用スキャニング PLU 4 件の掃除（issue #76 店舗訪問の残項目、任意・実害なし）。
- 低優先 deferred 11 件の集約追跡（N8〜N19: CSV import 拡張 / cm・m 表示切替 / global scanner detection / shortcut 拡張 / REQ-704・705 / 操作ログ CSV / 状態チップ件数・廃番 toggle / 棚卸し中止・sort・履歴 / 商品個別閾値 / Z006・Z009・Z011 / ダークモード。詳細と doc 節は [遷移契約 sweep 記録](archive/plans/2026-08-26-transition-contract-sweep.md) 参照、要望発生時に個別裁定）。
- I-G1 sweep test の gitignore 非尊重（pure Rust walk 化〈PR #80 是正 `980a211`〉は gitignored file も走査するため、将来 `src/routeTree.gen.ts` 等の生成物が旧 token を偶然含むと偽陽性 fail し得る。安全側にしか倒れない構造差で現時点 hit 0 を実測済み、顕在化時に走査除外 or 生成物パターン skip を判断）。⑪ で起票（Scope）。
- `app-router.ts` top-level の router singleton 副作用（test が named export だけ import しても実 router が構築されグローバル scroll/pagehide listener が登録される。現状は test 側の一意 query で cache 衝突を回避済みで実害なし。router 関連改修時に遅延生成 or test util 分離を検討 — PR #24 Final Review P3-2、2026-08-31）。
- T10 source 文字列 test の formatter 脆弱性（`useUnsavedChangesWarning.test.tsx` の `readFileSync` + `toContain` による明示 prop 存在検査は formatter 変更で false-fail し得る実装詳細 test — PR #25 Final Review 非ブロッカー所見 2026-09-01 起源。顕在化時に検査形の置換を判断）。⑪ で起票（Scope）。
- test hygiene: `SearchBar.test.tsx` の「初期表示時に検索 input へ focus する」test に SC15 の Label / wrapper assertion が同居（⑭ round 1 由来、round 2 で踏襲。Sonnet 一次は P3 0、Coordinator が P3 no-action で記録）→ 次に SearchBar test を触る lane で test 名どおりに分離
- cargo 側の advisory 2 件（rand low `GHSA-cq8v-f236-94qc` / glib medium `GHSA-wrw7-89jp-8q8g`）: D-067 で tolerable_risk として dismiss 済み（upstream-blocked）、revisit = Tauri 更新時。
- npm dependency-security 常設 monitoring の運用（週次〈月曜 06:00 JST〉+ manual dispatch で `npm audit` high+ と監視 advisory の state 変化を check し issue 通知。監視対象 advisory の追加・整理は `scripts/npm-security-monitor.sh` の `WATCHED_ADVISORIES` を編集）。
- smoke E2E / visual regression の再評価トリガー（全画面横断 typography / density 変更時、Phase 3 の最初の画面横断 workflow 計画時、Phase 4 完了後の `v1.0.0` 候補前に再評価する契約。UI_TECH_STACK §7.2）。


## 旧「次の行動」の未完了項目

- [ ] ⑤ go-live 検証 flow（PLU 実機再確認 + Z004 layout 有効化 + 部門キー→PLU 移行計画）+ MSI 配布手順 docs 化: 着手時に owner と選定

## 過去memoryの未決記録

以下は旧memoryの原文。現在の成立・解消状況は未確認であり、新しい義務や全作業の blocker にしない。関係する項目の着手時に正本と照合する。


- Whether `宅急便` is in inventory scope
- `Q40` failure-handling detail
- SR-S4000 scanning PLU reflection path is confirmed at the procedure/profile level, and PR #122 external gate is accepted by structural equivalence to the confirmed CV17 1.1.1 11-column shape. Use `docs/plu-export-and-real-csv-verification.md` for the Post-UI-08 app-generated `.txt` recheck; do not treat app-side `plu_exported_at` as proof of PC-tool/register reflection.
- REQ-401 implementation: implement IO-07/BIZ-08/CMD-12 and daily_report_* migration from the archived SALES design, then update UI-07/daily/monthly reports; keep Z004 product-sales track separate until post-PLU verification proves item-level sales import semantics
- Optional future UI quality follow-up: reassess smoke E2E / visual regression at the timing recorded in `docs/UI_TECH_STACK.md` §7.2: future cross-screen typography/density changes, first Phase 3 cross-screen workflow planning, and before the `v1.0.0` candidate after Phase 4
- Price-revision support design (issue #90): owner hearing settled the open premises (filter axes, supplier registration path, no provisional-cost flag, cost-column recommendation); Plan Packet drafting is pending. See `docs/evidence/issue-90/hearing-2026-08-21-22.sanitized.md` and decision-log D-075
- Stock-take exclusion of long-dormant items (issue #91): merged into the UI-10 stock-take semantics follow-up as a one-line population definition (no system feature); close candidate. See decision-log D-076

