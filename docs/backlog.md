# Backlog

未了作業・保留・受容済みリスクの参照先。作業を選ぶときに読む。現在の進行状態と active packet は [Plans.md](Plans.md) が所有する。

元の本文・未決判断・参照先を移送した。L8-4等の製品の未決判断は [Plansの該当節](Plans.md#製品の未決判断) に保持する。古い記載だけで現在の未実装や blocker と断定せず、着手時に関係する正本と実装を照合する。履歴は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md) を参照。

## Backlog（未了）

3 軸で小節分け（owner 2026-09-11「着手対象と保留と記録目的で分けたほうが良い」）。**着手対象** = やると決めたもの（「次に動く lane」は上から順の固定順、それ以外は順番未定）/ **保留** = 要望・実需・顕在化を待つもの（着手判断は owner）/ **記録目的** = 受容済みリスクや revisit 条件付きで、行動を待つ項目ではないもの。2026-09-11 棚卸し: 済み 6 件（mockup-d-lists 定数名同期 / command drift 検出〈⑯〉/ bindings trailing whitespace〈再生成後 0 件〉/ eslint 保守性 rule〈⑯〉/ palette ban の ui・layout glob〈⑫〉/ drift 同期 PR #37 の P3）+ 完了ポインタ 5 行 + UI-15 改名の double-click（`RenameSupplierRow.tsx` の `mutation.isPending` disabled で対処済み）を除去。

### 着手対象

#### 次に動く lane（順番固定）

- [x] フィルタ Label 上置き + 見出し 2 段の runtime: 完了（PR #63、2026-09-16）。design ⑳ 完了 2026-09-11 起源、canonical = catalog ⑨ 使用トークン / ① 構造 + セクション見出し variation / mockup-g。一覧 toolbar の label 上置き・SegmentedControl の可視 label・section 見出しの 2 段化を 5 site + 見出し群へ反映。[archive packet](archive/plans/2026-09-15-filter-label-top-runtime.md) / [Matrix](archive/plans/test-matrices/2026-09-15-filter-label-top-runtime.md)。
- **表示小修正 batch 2 候補**（owner 2026-09-11 所感、次の小 lane でまとめる。**2026-09-15 = ㉒ として wave 10 の lane 2 に登録、㉑ の branch へ stack**）: 在庫少の基準画面で page 見出し h1「在庫少の基準」と `FormSection` の title「在庫少の基準」が同文言で二重に大きく出る（`ThresholdSettingsPage.tsx:187` / `:228`。区画見出しを「基準値」等の別語にするか、区画見出しを外して説明文だけ残す）/ **Alert の title（icon の真横の文言）を太字に**（owner 2026-09-11「アラートはアイコンの真横の文言は太字にしようぜ」。`src/components/ui/alert.tsx` の `AlertTitle` 1 箇所で app 全体に効く共通 component の変更。現行は `font-medium`（500）で、`font-semibold`（600）へ。catalog の Alert 節に weight を明記）/ **在庫照会に page 説明（副題）1 行**（mockup-d-history の文、owner 2026-09-11）/ **在庫状態 Badge の「通常」→「正常」**（owner「状態なら正常のほうが文言として正しい」。canonical = catalog ⑫ Badge 見本 `:868` `:905` + function-design 74 + `StockStatusBadge.tsx:36` + test を同時に更新）/ **在庫切れ・在庫少 filter 時の件数行「全 N 件のうち a〜b 件を表示」**（現行は `StockInquiryPage.tsx:225-227` で status = all のみ描画。`low_stock` source は backend が totalCount を返さない〈null〉ため。client 側で全件数を数えられるなら client で、無理なら backend に count を足す、を lane で判断）。**在庫少の基準の inline エラー文言を mockup の形（範囲が一目で分かる 1 本）へ**（owner 2026-09-11「モックのほうが情報量的に好き」。現行は `THRESHOLD_ERROR_MESSAGES` の 3 種〈入力してください / 1以上の整数を入力してください / 99999以下で入力してください〉→ 「1〜99999 の整数を入力してください」系に統一、function-design 69 §69.7 の文言表 + test を同時に更新）。上部の「保存できませんでした」Alert は現行にも実装済み（backend の保存失敗〈片方だけ保存済み〉の場面のみ、入力エラーでは出ない）で mockup と一致、入力エラー用の上部 Alert は作らない（owner 2026-09-11 合意）/ **入出庫履歴 一覧の「明細数」列を撤去**（L8-4、owner 決定 2026-09-15 (a) 全消し。`InventoryRecordsPage.tsx` の列 + `65-inventory-record-traceability.md` + test を同時更新。実機で手動販売出庫に困れば『代表商品 ほか N 件』型で戻す）
- **一括価格改定の取引先紐付けを既定 off + 文言明示**（owner 決定 2026-09-16、L3 round 3 所感「価格改定のついでに取引先が変わる」）: `PriceRevisionPage.tsx:32` の `useState(true)` → `false`、supplier 変更時も off のまま、label 文言「確定した商品の取引先が未設定なら、この取引先を設定する」。設計書 77 REQ-106 / SPEC-PRV-D6 / §UI 記述の「既定 on」「取引先変更時に on へ戻す」を改訂、`PriceRevisionPage.test.tsx:186` の既定 on assert を反転、decision-log 1 件。R2、㉒ と file 互いに素、㉑ closeout 後に起票
- **ホーム画面を mockup-c 案へ寄せる**（owner 2026-09-11「これ好き、採用したい」。canonical = `reference/mockup-c-home.html`〈お手本〉、現行ホームは骨格〈上段 4 card + 3 区画〉が既に同型なので runtime 直行で可）: 差分 = (1) 各 action card に icon + 1 行説明〈既存の後続候補「ホーム action への説明文追加」〉/ (2)「売上データ取込み」card の primary 強調〈warning トーンの枠 + 背景〉/ (3) 上段 card の補助文言〈「基準を下回る商品」「レジ反映待ち」はそのまま。**在庫切れ card の「すぐ確認」だけは導線に見えるため状態説明の別文言へ**（例「在庫 0 の商品」、Writer が候補を出し owner 確認）〉。owner 2026-09-11 確定: 「補助文言は状態の説明であって導線ではない」を決定として更新し、「すぐ確認」以外は mockup-c をそのまま採用。**前日分未取込みの alert は現行（`HomePage.tsx:80`、danger トーン + 「最後の取込み精算日」）を変更しない**（owner「これこのまま使おうぜ」）。他画面の mockup（c / d 系）は owner が改めて見直し中、追加要望があれば本 lane に同乗

#### やると決めたもの（順番未定）

- Z001 / Z002 / Z005 の取り込み情報を画面で見られるようにする（owner run 3 原文「無いのはまずい」= 要望、後続候補ではない）: DTO 公開 + 表示設計、design-first（**owner 2026-09-11 再確認「やるべきこと」**）
- **単位の拡張（design-first、owner 2026-09-09「やっておきたい」、店の返答待ち 2026-09-14〜）**: 現状 = DB `CHECK(stock_unit IN ('pcs','cm'))`、bindings `ProductStockUnit = "pcs" | "cm"`、UI は `formatStockDisplay` / `formatStockUnitLabel`（switch 2 arm、default「—」、param は `string`）。⑮ で UI 側の単位表示は formatter 1 箇所に集約済み。owner 提示の候補 11 種 = 個・枚・本・袋・箱・巻・組・セット・m・cm・丁（**owner 2026-09-13: 重さは使わない、g・kg とも不採用**。店の回答 2026-08-15〈`docs/evidence/issue-76/form-response-2026-08-15.sanitized.md` 設問 4〉にある「玉」〈毛糸〉が候補に無いため、店の回答 2026-09-14 で「使う」と確定し 12 種へ）。設計論点（Codex 助言 2026-09-09、Fable 賛同）: 長さ商品は基準単位 cm で在庫を記録し m は入力・表示の固定換算（整数契約 `31-biz:66` を維持しつつ 0.5m を扱える）/ 巻↔m は商品依存で換算しない / 単価の基準（1m か 1cm か、POS 数量 1 の意味）を在庫単位と別に明示 / 在庫少閾値は「連続量」で一括りにせず既存の通常・生地の適合を確認して必要な区分だけ追加 / 組とセットの code 衝突 / code を英字で続けるか日本語 label を code にするか。起点 = owner の質問シート回答（長さ商品は最小何 cm で売る・数えるか、同じ商品を m で仕入れて cm で売るか）。**2026-09-13 実測: sanitized 聞き取り 3 件（issue-76 / issue-90 / 2026-09-05）のいずれにも反物の最小 cm・m 仕入れ cm 販売の設問は無い。現行 cm は `master-tables.md` 布 5 パターン表〈反物 = 残り何 cm〉の設計判断由来で、店の回答由来ではない。owner の一次判断は 1 cm 刻み据え置き（現行契約不変）、2 設問は次回の店舗聞き取りへ**。**店の回答 2026-09-14（`docs/evidence/hearing-2026-09-14-stock-units.sanitized.md`）: 最小 10 cm 刻み / 残り・仕入れ・値札はすべて m（値札は 1 m あたり）/ 12 種すべて使う（玉を含む、組とセットは両方）/ 箱をばらして 1 個ずつ売る商品あり。設計の起点はこれで揃った。残る確認 = POS の数量 1 が 1 m か 10 cm か（日報取込みの数量解釈）。**店の回答 2026-09-15（owner 伝聞、同 evidence file に追記）: レジのテンキーに `.` があり数量 1.3 × 単価 70 円/m で打てる = POS の数量 1 は 1 m、小数 1 桁。現状の運用は分類キー + 計算機で出した金額の直接入力（1.3 で打てると分かったのは 2026-09-15 で、まだ実運用していない）。JAN なし・メーカー品番なしの商品は現行仕様で登録可（`jan_code` NULL 可、`plu_target=0` → 部門売り + 手動販売出庫）。キルト地とガーゼが同分類なのはレジの集計単位の話で、アプリの在庫は商品コード単位のため問題にならない。設計 lane の追加論点 = Z004 の数量は `z004_parser.rs:350` で `i32` parse なので長さ商品を PLU 化して 1.3 と打つと行単位の `InvalidNumber` になる → 小数 1〜2 桁を 100 倍整数で受け、商品の単位が長さなら cm として流す換算を BIZ 側（商品を引いた後）に置く案を起点にする（parser では商品単位が分からない。個数商品の小数は現行どおり error）。状態: design lane 起票可、wave 10（㉑ ㉒）の後に並べる（owner 2026-09-15）**。衛生同乗: formatter の param を `ProductStockUnit` にして exhaustive switch（未知単位を compile error に）。R4 相当（DB migration + Rust enum + bindings + CSV validation）
- 廃棄・破損の保存結果に「詳細を見る」+ `returnTo` を追加するか（現行 UI-05-D17 は「保存結果に link なし」を契約化済み。追加には UI-05-D17 改訂の design 判断が先行 — PR #23 owner L3 所感 2026-08-31 起源。歴史的非対称であり表示すべきでない業務理由は source docs に見当たらない、が owner 観察）。（**owner 2026-09-11「やったほうがいい」で格上げ**: UI-05-D17 の改訂を design 判断 1 行で先行し、入庫・返品交換と対称化する小 runtime lane）
- MSI 配布手順 docs 化（v1.0 gate。「次の行動」⑤と対応）。
- Z004 layout B 対応 + 混在期間の非 PLU 商品 end-to-end 再検証（layout A は PR #81 で消化済み、PLU スロット永続割当 design-first は PR #84 で正本化済み。残 = layout B 対応、混在期間の非 PLU 商品 end-to-end 検証）。
- CSV 出力・印刷の実挙動確認（owner run 3 原文「まともにテストしたことがない」「印刷は中身を作っていない」）: end-to-end で叩いて紙面 / 出力 file の実態を証跡化してから要否を裁定
- 日報取込み標準手順の残設計（issue #135 派生。保持期間・命名・取込み途中・再取込みの設計と店舗マニュアル反映が残る。同日複数精算は D-071 / PR #79・#80 で実装済み）。
- 日報画面の Excel 印刷・バインダー代替受入判定（現行 Excel + 印刷 + バインダーが日別記録を残す唯一の手段。実 1 日分での公式集計・過去日到達・欠落日・修正/再取込み・backup/restore 後の再現を横並び確認し、印刷機能の要否を go-live 前に判定する）。
- **destructive Alert の soft 塗り + 三角 icon**（owner 所感 2026-09-15、L3 で確定。catalog ⑥ `:82` 付近で「別 change で owner 判断」と保留していた項目）: `alert.tsx` の `destructive` variant を `warning` と対称の soft 塗り（`bg-destructive-soft` + `border-destructive` + icon `text-destructive`、token は `00-foundations.md` に追加）へ。適用先 = ホーム「前日分が未取込みです」（icon 済み）、日報取込み「取込み済み」（icon なし）、他の `variant="destructive"` 全 site。design-first（見本を実機で並べて owner 確認）。関連案: 説明を手厚くするなら Alert 化ではなく右下 Toast の赤版を作る（owner 2026-09-16）

#### ⑰ 起票の小 runtime（次の小 lane に同乗可）

- （⑰で起票 2026-09-10）**商品修正の操作ログ detail_json に非価格 field の変更前後を含める**（owner L3 所感 2026-09-10「更新したのに詳細情報なし」。`src-tauri/src/biz/product_service.rs:360-374` `update_product` が売価 / 原価変更時のみ `detail_json` を書く。`30-biz-product-service.md:164` は「変更前後の値を JSON 化」で価格限定なし、`74-ui-operation-logs.md:609` Ledger に既知ギャップ）。runtime lane、S〜M、R3〈wire 契約〉
- （⑰で起票 2026-09-10）**`formatDateTime` の置き場**（`inventory-records/types.ts` から 7 feature が import、rule-of-three 到達、`src/lib/` 移設候補。⑰ Sonnet Plan Review P3）
- （⑰で起票 2026-09-10）**PLU export の日時書式統一**（`PluExportPage.tsx:159` `formatPendingSavedAt` が `YYYY/MM/DD HH:mm`、他画面は `YYYY-MM-DD HH:MM:SS`。prose 文脈、⑰ Opus Plan Review P2 で除外記録）

### 保留（要望・実需・顕在化待ち）

#### 見た目・UX

- **廃番表示 3 択 / PLU表示 5 択の SegmentedControl（DSR-02 drift、`ProductListPage.tsx`）の Tabs / Select 化**: ㉑ packet D-RT4 で据え置き（絞り込み条件であって tab ではない、Select 化は 1 click 増）。catalog ⑨ D1 但し書きが drift を記録済み。DSR-02 側で「フィルタ toolbar 内の少数選択肢は例外」と明文化するか、Select 化するかは owner の要望が出たときに design 判断（2026-09-15 起票）。
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

- smol-toml override（1.7.1）の撤去条件: markdownlint-cli2 が smol-toml ≥ 1.7.1 を pin する版を出したら override を外し、名指し通常更新へ戻して audit を再確認する。
- 移植先の Cargo alert 2 件の dismiss 理由候補（実行は owner）: rand 0.7.3 は tauri-utils の build 時 hash 生成経路のみで runtime 露出なし → `tolerable_risk` 候補、glib 0.18.5 は Linux 用 gtk 経路で Windows 配布物に含まれない → `not_used` 候補。2026-09-15 に owner がいずれも dismiss 済み。
- 40-cmd-product.md:279 の言い換えで field 名の明示が落ちた件（Opus P3-3、衛生 batch 4 Final Review round 2、2026-09-15）: per_page check の否定文脈検出を直す際に元の精度へ戻す。
- `ponytail:` comment の配置（Opus P3-4、衛生 batch 4 Final Review round 2、2026-09-15）: test 側だけでなく checker の `case` 行の直上にも置く。
- `Badge` / `Button` の base に `shrink-0` があり、`StocktakeProgressHeader` の明示 `shrink-0` と test の `toHaveClass("shrink-0")` は恒真（fresh broad Opus P3-3、PR #63、2026-09-15）。挙動影響なし、明示 class と assert を外すか base 依存を明記する
- 一括価格改定「取引先未設定の商品も含める」label（toolbar 外）の class が baseline に戻ったことを守る negative unit assert がない（Opus follow-up、PR #63）。AC6 の rg oracle のみ
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


## 完了項目に付随していた申し送り

旧Plansの完了済み親項目にも未決・保留・後続候補が残っていたため、子項目を原文で保持する。これは当時の候補・裁定記録であり、新しい実装義務や優先順位ではない。撤回・統合・後日の解消を含むため、関連作業の着手時にはその項目の正本・実装と照合する。親の完了チェックだけを理由に子の判断を解消しない。

- [x] 衛生 batch 4（doc WARN 5 / mockup-g `:has()` / npm 名指し更新）: 完了（PR #61、2026-09-15）。doc-consistency WARN 5 件掃除・mockup-g の `:has()` selector 是正・npm 名指し更新（js-yaml / vitest 実更新、smol-toml override）を実施。[archived packet](archive/plans/2026-09-14-hygiene-batch-4-doc-warn-deps.md)。
- 後続候補: ホーム action への説明文追加、操作ログの `開始日` / `終了日` を `期間` group 化、日次売上 Z001 summary の全項目公開（現 `OfficialDailyReportSummary` は gross/net/payment/department のみ）、Z004・手動販売の部門小計分離、Backup 日時書式 `YYYY-MM-DD HH:mm` と page subtitle、CSV native 出力の owner 確認、日次 / 月次の印刷要否・紙面設計（Phase 4 disabled placeholder）、入出庫履歴の識別列並べ替え（記録日時 + 代表商品を先頭 2 列へ、header 配列一致 test 更新を含む）、`FormSection` shared pattern 化の可否・命名（理由: DTO 未公開・native 出力未確認・紙面設計未着手など実装コストが本 Lane を超える）

- run 3 原文による訂正（2026-09-04、owner がチャットへ直接貼り直し。原文 = [owner L3 原文](design-system/reference/2026-09-04-owner-l3-feedback-raw.md)「run 3 原文」、上の 4 区分は Codex 要約起源なので食い違いは本 sub-bullet を正とする）: (a) 「日次 Z001 summary の全項目公開」は owner 原文では Z001 / Z002 / Z005 の取り込み情報全般で、「機能追加でコスト高いとはいえ無いのはまずい」= 後続候補ではなく要望（優先度は owner と選定） (b) 前日比を出すなら + は緑 / − は赤の符号色が要る（runtime `SummaryCardsBar.tsx` の `valueClassName` 適用状況は実機で確認） (c) 日次 / 月次の CSV 出力 / 印刷 button は page 右下または器の右下、印刷はオレンジ可。印刷は中身未整備・CSV は未テストという owner 認識（後続候補「印刷要否・紙面」「CSV 確認」の前提） (d) 日次 / 月次切替 button を TabsHeader の中へ納める案はしっくりこない = 現状維持（既記載）。日次売上に列見出しは合わない = 現状維持 (e) 月次の「公式部門集計（レジ日報由来）」説明書きは維持。mockup の 部門 → 構成比 → 売上金額 は「金額が右端が基本」と疑問、runtime（`MonthlySalesPage.tsx:177-180` 部門 / 数量 / 件数 / 金額）は金額右端のままで変更不要 (f) Backup: 復元 dialog 本文に控えの日時を入れたい（runtime は `{label} の控えに戻します` で既に日時入り、実機で owner 確認）。最新 badge / page subtitle / `yyyy-mm-dd HH:mm` 表記は owner 支持。復元 button は変更不要。mockup の一覧列見出し / 「現在の保存先: D:\\…」表示 / 「今すぐバックアップ」button は「看過できない」= runtime へ持ち込まない (g) Home: mockup に入庫 / 出庫の quick action が無い理由を owner が問うている（runtime の quick action 構成を実機で見せて判断） (h) 入出庫の明細数 summary は削ってよい (i) 商品検索一覧の列見出し角丸は run 5 / 6（PR #32）で消化済み (j) 操作ログ `実行者` は「データ構造に無い」= 明示不採用で一致、開始日 / 終了日 → 期間 group 化は後続候補で一致、在庫少一覧の列順 状態 → 在庫数 → 売価 は現状維持で一致

- runtime backlog: 価格履歴の説明文を「直近 10 件の売価・原価の変更を新しい順に表示します。」へ（`PriceHistorySection.tsx:43`、default limit 10 と整合）、S

- 候補（owner 条件付き「やるなら」）: 入庫の商品追加 list を 商品コード / 商品名 / 現在庫 / 入庫数量 / 単位 / 原価 / 操作 へ（現在庫列の追加、単位は入庫数量の隣、原価を数量と単位の間に置かない。owner の一次判断は「商品を追加 section も現行実装のほうがいい」なので実装前に owner 確認、`ReceivingPage.tsx:543-549`）、M

- runtime backlog: 入庫画面の「直近の入庫」は既に `per_page: 10`（`ReceivingPage.tsx:58`）なので見出し・説明に「直近 10 件」であることを明示する、S

- runtime backlog: 返品・交換の「交換は戻り・渡しの明細が両方必要です」注釈がポツンと置かれている（`ReturnExchangePage.tsx:790-791`）。置き場所は未定（owner「どうにかいい表示の仕方ないものか」）。実装前に候補 2〜3 案を実機で見て owner が決める、S

- runtime backlog: 返品・交換の方向 badge（戻り（在庫+）/ 渡し（在庫-））の色遣いを再検討。DSR-08 どおり文言 + 記号を主、色は補助に、S

- runtime backlog: 返品・交換のレシート画像 label に「（任意）」を付ける（`ReturnExchangePage.tsx:624`）、S

- 維持（肯定）: 保存結果の緑 icon toast / 原価差分 dialog の「マスタ原価 → 実原価」表示 / 返品・交換のレジ戻し badge と CSV 取込み反映 badge の色 / 検索欄と toolbar の明度差は問題視せず。後続 sweep で消さない

- A1 価格履歴の説明文: 採用。加えて (a) 他の「直近 10 件」系 section も同じ文言で揃える (b) 価格履歴に列タイトルを付ける (c) 「直近の○○」系 section は手動販売出庫だけ囲みがあり他に無いので、囲みありで統一する → runtime backlog S（対象 section の棚卸しを含む）

- C5 / C6: owner は mockup 前提で言った指摘。C6 方向 badge は「方向バッジは成立しえない」= runtime backlog から撤回。C7 レシート画像「（任意）」は採用。追加の owner 案: 現実装の「直近の返品・交換」の列を 返品日 or 日付 / 種別 / レジ戻し（mockup の 済み・未処理 badge は良かった、色付け可）/ 備考 / 記録日時（秒は省いても省かなくても可）へ再編（共通化する意味があるかは owner 自身も判断を保留、実機で候補提示）。記録日時の文字が時々別 font に見える（`ReturnExchangePage.tsx` の cell は `formatDateTime` を素の `TableCell` で描画、隣接 cell の `tabular-nums` 有無の差が仮説、機序は実機観測で確定）。返品交換の商品追加 section は触らない

- D8 検索欄 / ドロップダウンの面: 商品一覧でやった `--control-surface` #fafaf9 に揃える。runtime には shadcn `Input` / `Select` を通らない native `<select>` / `<input>` 直書き（`bg-background` のまま）が残る: `InventoryRecordsPage.tsx:156-245`（select 3 / input 3）、`ReceivingPage.tsx:393`（仕入先 select）、`DisposalPage.tsx:509`、`OperationLogsPage.tsx:338-352`（date input 2）→ runtime backlog S（token 化 sweep）

- E9 件数文言の自然文化: 採用。上下の font 差は実装上の事実: 上の帯 `PaginationSummary` は `text-base font-semibold text-foreground`、下の `Pagination` 範囲文言は `text-sm text-muted-foreground`（`Pagination.tsx:52-53,99`）。下は据え置き（他画面共通でよい）。owner 再回答: 文字の種類（font family）は同じと確認、上の帯は「特別太くしなくてもよさそう」= `font-semibold` を外す方向、文言は自然文型で確定、あとは list 系画面へ持ち込むだけ → runtime backlog S（`PaginationSummary` の weight 変更 + 全 list 画面の文言統一）

- E14 囲みを一階層減らす: Lane 2 packet S8 (viii) が owner L3 所感として記録した item だが、owner 直回答で「どういう話？」= owner 認識なし。PageShell → toolbar 枠（`rounded-lg border bg-card`）→ 表の外枠 → 行罫、の 4 段の線が 100% 表示で重い、という Coordinator 側の整理。owner 再回答「線系が太いって話？」= 太さの話ではなく「入れ子の枠の段数」の話（page → toolbar 枠 → 表の外枠 → 行罫）。owner が実機で重さを感じていないので drop 候補のまま、E12 の表の外枠再検討（D-2）に吸収して単独 item は立てない

- H22: owner「何とも言えない、わからん」= 保留のまま（要望が続けば起票）

- owner L3 run 2 所感（Lane 3、2026-09-05、原文 = [owner L3 原文](design-system/reference/2026-09-04-owner-l3-feedback-raw.md)「Lane 3 L3 run 2 原文」。Coordinator 転記、裁定は原文を正とする。いずれも Lane 3 の scope 外で、Lane 4 / 5 または別 lane の候補）:

- R2-1 ページ送りの上下切り分け（一覧 8 画面共通）: 上部 summary は件数が perPage 未満でも常に出す（現 `totalCount > 0` gating + 単一ページ時は下部行ごと非表示、在庫照会で観測）。下部は summary + 前へ / 次へを複数ページ時のみ。上部に button は置かない。上部の見た目は owner 決定（2026-09-05「下部と同じ小さい表示に揃えるよ」）で下部の summary と同じ `text-sm text-muted-foreground`（Lane 3 で太字を外した `PaginationSummary` の `text-base` も下部と同サイズへ、DSR-22 / catalog ⑩ の上部 variant 記述を改訂）。edge: 51 件で 2 ページ目に行った時に「前へ」が無い、を test で必ず塞ぐ → Lane 4 候補（ページ送り契約の改訂、catalog ⑩ 改訂を伴う）

- R2-2 次へ button が薄い: 有効状態を濃くし、hover で色変化 or さらに濃く → Lane 5（E13 `--border-strong` sweep）に同乗候補（outline button の枠 + 文字色 + hover）

- R2-4 在庫照会の検索条件を増やす（どの条件かは未回答、owner に候補提示）→ 別 item、design-first

- R2-5 入出庫履歴の状態 badge に色を付ける（状態 badge 系は色付けが優しい。DSR-08 どおり文言は残し色は補助）→ Lane 5 候補（mapping は owner と決める）

- R3-1 状態 badge と差異の数値（+3 / −2 等）に色: 棚卸し / 一括価格改定 / 整合性チェックで「目が滑る」。R2-5（入出庫履歴の状態 badge）と統合し「全画面の状態 badge・増減数値の色付け」1 item へ（DSR-08 どおり文言 / 記号は残し色は補助、mapping は owner と決める）→ Lane 5 後続 or 別 lane

- R3-2 前へ / 次へ button の有効状態が薄い: 一括価格改定の 1 ページ目で「前へ（無効）」と「次へ（有効）」の見た目が同じ。R2-2 と統合（有効を濃く + hover 反応、無効との区別を明確に）→ Lane 5 の E13 sweep に同乗候補（`Pagination.tsx` の button variant）

- R3-4 取引先プルダウンの枠と「取引先追加」button の枠が他と揃っていない（全画面共通の指摘）: プルダウンは Lane 5 の `PriceRevisionFilters.tsx` / `ProductForm.tsx` の native select 対象に含まれ是正済み（run 3 の HEAD は Lane 3 branch のため未反映）。「追加」系 button を primary（オレンジ）にする案は CTA hierarchy の設計判断 → design-first で owner と決める（DSR-03 / catalog Button 節の改訂候補）

- R5-1 検索欄に欄のタイトルが無いのが寂しい（案は owner も未定）→ design-first の候補提示（placeholder のみ vs label 併記、Laws of UX / DSR-22 の可読性で裁定）

- R5-2 表示件数 Select の配置が「画面上部の枠の中」と「枠の外」で画面ごとにばらつく → 一覧 8 画面で位置を統一する契約を catalog ⑯ / ⑩ に追加（ListShell の toolbar 内に置くか、件数行の右端に置くか、owner と実機候補で決める）→ Lane 4 候補（ListShell 横展開と同時が自然）

- R5-4 **owner 決定**: 検索欄・取引先・部門などを囲む外枠の中の地色を `#F5F5F4` に統一（参考 = 商品一覧の toolbar 枠）→ E15 / Lane 2 申し送り (v) card-on-card の裁定として確定。`--list-toolbar`（仮）token を 00-foundations に登録し、ListShell の toolbar 枠と非 ListShell 画面の filter 枠へ適用 → Lane 4 候補

- owner Lane 4 L3 run 1 所感（2026-09-06、原文 = [owner L3 原文](design-system/reference/2026-09-04-owner-l3-feedback-raw.md)「Lane 4 PR #40 L3 run 1 原文」。Coordinator 転記、裁定は原文を正とする）: (1) 識別列固定は Excel 型（検索ツールも 2 列も留まり右だけ滑る）を期待 → Gated Amendment 1 (2) 一括価格改定の取引先追加ボタンが Select の隣から離れた → Gated Amendment 2 (3) 在庫照会 検索ツール充実: 並び替え + 昇順降順、すべて / 在庫切れ / 在庫少 の chip を `--card` 枠の中へ → 後続 design-first lane（(d) の取引先順 sort の上に選べる並び替えを重ねる）(4) owner 環境は 2560×1440 / 125% のため 特大 × 125% は日常で充足

- L8-1 単位 code `pcs` の生表示が入出庫履歴・在庫変動履歴・記録詳細のあたりに残っている（PR #32 Gated Amendment 6 S45 で商品一覧 / 入庫 / 廃棄 / 返品交換 / 手動販売の主要画面は `formatStockDisplay`/`formatStockUnitLabel`（`format-stock-display.ts`）へ是正済みだが、同じ file 内でも別 render 箇所が未然のまま残る例あり: `DisposalPage.tsx:459,514` は候補一覧・行内現在庫を local `formatQuantity`（unit 生結合）で描画、`:595` のみ `formatStockUnitLabel` 適用済み）→ 残箇所の sweep、S

- L8-2 badge が無色（見た目未着手）は ⑦ design-first 候補（Badge の色と枠の規約）の runtime lane 待ちで想定どおり → 起票不要、記録のみ

- L8-5 記録日時の font 差は既起票（Plans ④ C5、`ReturnExchangePage.tsx` の `formatDateTime` cell と隣接 cell の `tabular-nums` 有無差が仮説、実機観測で機序確定待ち）→ 重複起票せず参照のみ

- L8-9 記録 ID が種別ごとの連番で全体一意でないため単独の識別子として機能しない（種別とセットでないと検索に使えない）→ 種別込みの表示（prefix 等）にするか一覧から外すかの design 判断、DSR-22 の識別列並べ替え候補と統合、design-first、M

- owner 回答（2026-09-05）: (b) B2 secondary 中間段・色相なし / (c) C1 可視 Label / (a) は backbone 原則 2/4 の具体化（catalog ⑬ tone family 表 + `--success-border`/`--success-strong` の token 登録 gap + badge.tsx 側の runtime gap、新規 DSR は起草しない）(e) は推奨案で起草し culling は design PR 上 / (d) R2-3 は runtime batch へ、R2-4 は店舗ヒアリングで確認（[店舗ヒアリング回答](evidence/hearing-2026-09-05-stock-inquiry.sanitized.md)）→ (d-1) 在庫少・在庫切れ一覧に取引先列 + (d-2) 棚卸しリストの廃番 badge は 1 lane として起票待ち（次枠）、(d-3) 取引先消滅は運用代替（起票なし）

- owner 回答（2026-09-05、v2 見本）: 「`--border-strong` の枠はくどい。バッジは改める案だとすっきりする」→ DSR-22 の枠 3:1 要件を interactive な操作枠（入力・outline ボタン・select・segmented・focus ring）へ限定し、badge（状態/分類/強調）は 3:1 対象外へ narrow 化（`04-backbone.md` 原則4②・review-checklist カテゴリ9 も同期）。①状態 badge = 案A（tone border + soft bg + strong text + icon、既存 `StockStatusBadge` 形）に確定、`--success-border`（`#bbf7d0`）は無条件登録へ復帰（conditional 化を撤回）。②分類 badge（廃番/対象外/最近改定/件数 pill）= secondary pill + `--border` 枠のまま（badge.tsx の runtime gap は `border-border` 追加）。CTA「追加」系 = B2 secondary + `--border` 枠（`--border-strong` ではなく owner が `--border` を選択、DSR-01 3 段階層に反映。runtime 影響 = `button.tsx` の `secondary` variant がアプリ全体で `border-border` を持つ。現状 `Button variant="secondary"` の既存使用は 0 件と実測済みのため既存画面への影響なし）。Alert warning = border `--warning` + `AlertTriangle` で確定（owner「icon 付きで分かりやすい」）、text 色は v3 mockup 待ちの 2 候補（(a) `--warning-strong` テキスト・既定候補 / (b) 本文 `--foreground`、枠と icon のみ amber）を両論併記。③強調（琥珀 pill）の枠（`--warning-border` か `--warning` か）も v3 で owner が決定、既定なし。

- owner 回答（2026-09-05、v3 見本）: ③強調（琥珀 pill）の枠 = `--warning`（`#d97706`、対 fill #fef3c7 = 2.86:1・対 background = 3.05:1）に確定。適用 3 site（`ProductImportPreview.tsx:76`「上書き N件」/ `ProductRankingTable.tsx:80`「1位」/ `BackupRestorePage.tsx:533`「最新」、後者は variant 取り違えも合わせて是正）が `border-warning` を得る runtime gap として記録。Alert warning の text 色は再オープン — owner は (b) を「すっきりするが warning らしさに欠ける」と評したため、Coordinator が新候補を追加: (c)（既定候補）soft 塗り `bg-warning-soft` + border/icon `--warning` + text `--warning-strong`（①状態 badge と同じ 4 点構造）/ (d) タイトル「ご注意」を `--warning-strong` bold、本文は `--foreground`。v4 mockup で (a)/(b)/(c)/(d) を owner が決定する。

- owner 回答（2026-09-05、v4 見本、最終）: Alert `warning` variant = 候補 (c) に確定 — `bg-warning-soft` + `border-warning` + `AlertTriangle`（icon `text-warning`）+ 本文 `text-warning-strong`（対 `bg-warning-soft` = 8.75:1、①状態 badge と同じ 4 点構造）。候補 (a)/(b)/(d) は不採用（(b) の理由 = owner「すっきり見えるが警告表示としての一貫性に欠ける」）。destructive Alert（`bg-card` + red 系）は現状維持、soft-fill 化は対称性の後続候補として Non-scope に記録。これで (a) Badge tone・(b) CTA secondary 枠・(c) 検索欄 Label・(e) Alert warning・③強調枠のすべての owner 決定が完結し、未決 marker は残らない。次は Plan Review round 2。

- Plan Review round 2（Sonnet approve-with-P2、Opus reject → 全件 accept、2026-09-05）: DSR-22 の badge 枠を「使ってよい」から「必ず持つ（tone 固有色または `--border`、soft 背景単独・枠なし不可）」へ必須化し、非中立の①状態のみ icon 必須（中立は icon 任意、`StockStatusBadge.tsx:42`「通常」が先例）。3:1 の残存 4 箇所（`01-decision-rules.md:445,451`／`04-backbone.md:44`／`02-component-catalog.md:158`）を追加是正し `rg -n "3:1" docs/design-system docs/quality` で全 hit を操作枠=keep/badge=fix に判定済み。`catalog:588` の冒頭「両モードとも aria-label」矛盾文を段落全体で是正。`--success-emphasis` の用途 repoint は実態が AA 是正（3.16:1→8.69:1、`SummaryCardsBar.tsx` 2 site）であることを明記し repoint ではなく用途撤去として記録。Badge 44 件の分類を完了（未分類だった `ErrorRowsTable.tsx`/`StocktakeRecordDetailPage.tsx`/`DailyReportImportPage.tsx:322`/`daily-sales ProductTable.tsx:133`「手動」〈owner culling〉等）。AC3 の壊れた正規表現（`^| Success Soft ` が全行一致）を `-F` へ修正。`PriceRevisionPage.tsx` に `AlertTitle` が無い実態を記録し runtime 申し送り（候補「ご注意」）。評価用ヒアリング証跡（`docs/evidence/hearing-2026-09-05-stock-inquiry.sanitized.md`）も要約の断定調を原文準拠へ整えた。

- L8-1 単位表示 sweep（入出庫記録詳細 6 画面 + 商品追加候補一覧 3 箇所の raw `pcs` 表示、9 箇所の重複 local `formatQuantity` を実測。在庫変動履歴自体は raw 表示ではないと訂正）

## 旧handoffの未完了・確認事項

以下も過去記録の保持であり、新しい全作業共通のblockerにはしない。元の採否と除外条件を保持し、関連する作業で現在の解消根拠を確認する。

- [ ] E-4. PLU書出しフォーマット/実機反映確認（オンライン調査で CV17 Ver.2.0.1 仕様を確認 2026-04-08。2026-07-02 field gate で CV17 1.1.1 import profile は `.txt` / 11列 / PLU総枠5000共有へ修正済み。2026-07-03 field gate で承認済み CV17 `.txt` の CV17取込み、SD書出し、SR-S4000設定読み、代表商品呼出しは通過。PR #122 は構造一致で gate 受容し merge 済み。最新アプリ生成 `.txt` の同手順再確認は Post-UI-08 follow-up）

- [ ] G-6. Phase 1 残 follow-up: 7-7b axe or hooks coverage / 7-8b 横断UI（Phase 2 completion gate ではない。7-6 Storybook は不採用で確定 = D-068 2026-08-12、7-8a Error Boundary / 7-8c unsaved changes は PR #60 で完了 2026-08-04）。`plugin-dialog` foundation は UI-08 前提として PR #106 で導入済み。



### ~~利用者への確認事項~~ → 回収済み
- ~~**C65**: 日次CSV取込みの運用フロー~~ → OK（確認済み）
- ~~**Q13**: 生地の在庫管理単位~~ → cm整数管理でOK（確認済み）

### システム設計後に再確認
- **Q40**: 障害時の対応。システム具体像が見えてから

### 開発環境の既知事項
- **WSL2 直接開発に移行済み（2026-04 以降）**: 当初 Docker 完結（案 C）で開始したが、UI 実装フェーズで GUI 確認頻度が上がり WSL2 直接開発（案 A）に切替済み。Docker は退役（`memory/dev-environment-policy.md`）。詳細経緯は `docs/DOCKER_REPAIR_LOG.md` 参照。PR-B #54 (private archive) で `docs/DEV_SETUP_CHECKLIST.md` に WSL2 ベース転換を正式反映済み（§A.1 退役記録に Docker 完結方針を移動）
- **Tauri 2 on Linux 日本語 IME 制約**: tauri#11412 OPEN（WSL2 固有でなく Ubuntu ネイティブでも再現）。Phase 1 P0 IPC 疎通は英字入力で検証完了。Phase 2 以降の operator-facing L3 は Windows native ビルドで実施する（`memory/tauri2-linux-ime-limitation.md`）

### 設計フェーズの懸案 → 全解消
A〜D 群（A: DB / B: CSV取込み / C: 独自コード・マスタ / D: 設計送り 5 項目）は全て確定済み。要求仕様 130 本 / 18 テーブル / 5 層 37 タスク / 関数設計（第 1〜4 + 第 7 段階 UI 基盤）は実装に反映済。Q40（障害時対応）は UI-13 実装（画面固有 CmdError/retry）と共通 Error Boundary（UI 安全網 batch PR #60、2026-08-04）まで消化済み。包括的な障害時対応方針としての残余は `docs/ARCHITECTURE.md` §4と `Plans.md` Backlog を参照（PR #6 棚卸し delta 検証 P3 起源の表記同期、2026-08-26）

---


### 旧Plansの確認記録

- 上記以外のブロッカーなし。Fable exit runway は完了済み（archive 参照）。Phase 4 第1スライス（UI-11b）は PR #144 の Fable 裁定 P2/P3 修正後に再確認。

## 移送照合で補足した経緯

以下も元の申し送りとして保持する。現在の進行状態や新規の実装義務を表さず、採否や完了は該当する正本と照合する。その他の判断・経緯は [移送前の次の行動](archive/harness-context/2026-09-14-Plans.md#次の行動) に保存している。

- 明示不採用: 架空の操作ログ `実行者`、非 link 「すぐ確認」card、平均単価 / 部門数への summary card 置換、画面固有の意味を壊す共通化、未実装機能を有効 button として描くこと（理由: 架空 field・誤誘導・DB / DTO に無い情報の先行表示のため）
- residual risk（Gated Amendment 6 S44）: 入力欄・Select の `--control-surface` #fafaf9 化（Gated Amendment 7 S46 で #fff から変更）は L3 で商品一覧のみ確認。他画面の入力欄の白面は Lane 3〜5 の実機で確認する → owner 直回答（下記 E15）で「他画面はもうなっている、違うのは外側の枠内の色」と確認済み
- B2 入庫の商品追加 list 列順: 「ほんとにやるならの条件付き」のまま（単位が数量の先に来るのは確かにおかしい）。実装前 owner 確認は据え置き
- E13 `--border-strong` sweep: 対象は (a) outline 系 button = 白地に枠のボタン全般（例: 商品一覧の 「PLU 対象にする」「商品を登録する」・絞り込みのクリア等 `variant="outline"`、`button.tsx:15-16` の枠は `--border` のまま）(b) Badge outline variant (c) 日次 / 月次切替の SegmentedControl（`components/ui/segmented-control` の枠）。いずれも枠が `--border`（薄い）で、入力欄の枠 `--input` = `--border-strong` と濃さが揃っていないのを揃える話。owner 再回答「まぁこれはやってみよう」= 採用（Lane 3〜5 で sweep 実施、実機 before / after で最終確認）
- L8-7 ページ説明セクション（商品一括インポート / PLU 書出し / バックアップに説明文 3 案、owner culling。PLU 書出しは Z004 読込み→占有確認→書出し→保存→未反映から外す の流れを明示）

## 棚卸しlaneの旧申し送り

移送時にarchiveだけへ分類した元の申し送りを保持する。現在の完了や撤回をこの整備で推測せず、次の棚卸し作業で関係する正本とowner判断を照合する。新しい製品作業の採用や優先順位変更ではない。

- Lane 2 実装中の Lane 3〜5 申し送り（2026-09-03、[archived packet](archive/plans/2026-09-03-ui-list-backbone-d-lane2.md) S8）: (i) 入出庫履歴 / 在庫変動履歴の perPage 200 は backend `inventory_service::list.rs:21` `MAX_PER_PAGE` 100 → 200 の契約変更（docs 21 + tests、`MAX_PER_PAGE` 引き上げ、Codex 適性）を伴う (ii) sticky 帯 × 識別列固定 × DSR-17 `<main>` 単一 scroll の両立 probe は横 overflow が実発生する画面で行う（D-2） (iii) 棚卸し A' 帯ラベルの contrast 是正（Lane 1a 申し送り、`--muted-foreground` 対 `--card` 4.40:1）は棚卸し lane で (iv) outline ボタン / Badge / chip / SegmentedControl 枠の `--border-strong` sweep（SegmentedControl は `border-stone-300` 直書き〈1.43:1〉の token 化を含む、D-7、Non-scope） (v) Card 内に一覧を持つ画面を `ListShell` 化する際は toolbar 枠の `bg-card` が card-on-card で沈むため枠の地色を再判断する（pilot の商品一覧は Card 非使用のため未検証） (vi) Gated Amendment 4（2026-09-04、owner L3 run 3 = FAIL、mockup 5 file を現実装 + Lane 2 差分へ限定、evidence: [archived packet](archive/plans/2026-09-03-ui-list-backbone-d-lane2.md):642-648 owner run 3 所感）の owner disposition を 4 区分で記録する:
- G20 / G21: 20 は PR #31 で最終裁定済みの「A'+器（帯の枠あり）」を棚卸し lane で実装する時に、帯ラベルの contrast も是正するという item（別の案ではない）。「リストを囲む」= 器の一部として同 lane
