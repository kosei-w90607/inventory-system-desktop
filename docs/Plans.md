# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

wave 13（owner 2026-09-23「全部並行で」、2026-09-24 にハーネス刷新を追加）: lane 数の上限と同じ source document の同居禁止（D-055）は owner 決定 2026-09-24「規則は環境が変わるたびに変える」により適用せず、同じ file の重なりは merge 順で解消する。Plan Review は fresh Opus + Codex、Codex が rate limit の間は fresh Opus のみで進め Final Review だけ Codex を待つ（owner 確認 2026-09-23、Codex 復帰後は両方）。

active な lane の Plan Packet は `docs/plans/` の dated packet が正本（lane の branch は各 packet の `Branch` 行、現在地は helper status）。lane の起票・closeout はこの節へ lane ごとの行を足さない（D-097）。

- ハーネス刷新は PR0 ∥ PR1 → (PR2 ∥ PR3) → (PR4 ∥ PR5) の 5 本（owner 2026-09-24）。5 本すべて merge 済み: PR0（#92）・PR1（#97）・PR2（#113、座組と役割）・PR3（#117、入口と重複）・PR5（#127、gate の穴）・PR4（#128、手続きの軽量化）と、PR4・PR5 より先に起こした並走の摩擦を削る lane（PR #123、owner 2026-09-28 起票承認）。
- 2026-10-04 の 4 lane（A Z004 取込みの穴・B 日報取込みの穴・D EJ の文法・E 独自コードの採番、owner の lane 選択 TD-104）と、その後に先に入れた helper の守りの lane（owner 2026-10-05）はすべて merge 済み（PR #138〜#142）。次の lane は未定（owner が決める）。
- wave 14（owner 2026-09-27「Issue の範囲を避けて片っ端から並列で」。owner 決定 2026-09-24「規則は環境が変わるたびに変える」により wave 13 と同じく Wave Registry でなく「次の行動」に置く）lane D の design（PR #114）と後続 runtime lane「日次売上の「レジ日報（公式）」に日計（Z001）の表を出す」（PR #145、2026-10-06）は merge 済み。
- SD を直接読む設計（PR #150、2026-10-07）は merge 済み。次 = 後続の「SD 直読みの runtime」の lane の起票（R3、[backlog](backlog.md) の該当項目。起票時に Final Review の P3 4 件を直し、L3 の前に packet の Contract Probe の確認を行う）、その後に取込み済みを `XZ_BKUP` へ移す (b) の lane（D-111 (1)(b)、backlog の該当項目）。(b) の lane まで店は CV17 の取込みを今の運用のまま続ける（D-111 の運用の制約）。

次の着手順（owner決定2026-09-22）:

1. ㉘ runtimeの最初のlane = 既存の危険な操作（旧棚卸しの開始・入力・確定、POSの業務commit・取消）の停止と再現fixture。並走でEJ（電子ジャーナル）parserのcoreを合成データで進める。本laneの起票はworkflowの軽量化1段目文書部分（PR #90）のdogfood対象: templateの `Ordinary Operation` 節を書き、Plan Reviewの冒頭でreviewerが `成立 / 具体的な反例あり / 外部前提が未確認` の3値を返すかを観測する。 → 完了（EJ parser core = PR #94、㉘ の最初の lane = PR #95、2026-09-25）。㉘ はその後 ② 受領・判定・保存の基盤（PR #148、2026-10-07）と ③ 計数と補正（PR #152、2026-10-11）まで merge 済みで、どちらも通常の起動へは配線していない（店の棚卸しは停止のまま）。㉘ の次は ④ 取込み・取消・回復（Square か CASIO かの判断待ちは 2026-10-11 に解けた: しばらくは CASIO のレジでいく。repo 外の回答台帳 TD-221）と ⑤ 一括切替（通常の起動・画面・command・bindings への配線）で、中身は [backlog](backlog.md) の「㉘ ③ 〜 ⑤ の申し送り」。次の着手順は未決（owner が決める）。

設計の見直し（事実だけを集め、白紙の骨組みと今の設計を突き合わせる）の結果を正本へ置き換える design lane は、PLU の書出し（PR #163、D-117）・棚卸しの数の置き場と在庫数の求め直し（PR #167、D-118）・単位・数量・原価の精度（PR #168、D-119）の 3 本が merge 済み。見直しで分けた残りの design lane は 2 本で、「売上の SD からの一括取込みと EJ の控えの閲覧」（D-118 の後）と「日報の紙と意味づけ」（並走できる）（[backlog](backlog.md) の各項目）。runtime の順: 開発・試験 DB はリリースの前まで作り直してよいので（D-123、[22 §16](function-design/22-mnt-migration.md)）、棚卸しの数の置き場と在庫数の求め直しの runtime は原価の lane（vB）を待たない。原価の lane は店の答え（原価の税、repo 外の回答台帳 TD-297 の U6）を待つ。PLU 側の後続（SD を直接読む runtime の後に PLU の書出しの見直しの runtime、その前に TD-284 の lane）は [backlog](backlog.md) の「PLU の書出しの見直しの runtime」と「JAN を直した商品の前の JAN の枠で売れた分を同じ商品へたどる（TD-284 の lane）」の項目。デザインの刷新は v1.0 の前に入れる（機能が固まった後に画面を一新する。owner の決定 TD-296）。

D-070（Z004の自動在庫連動をv1.0の必須にした裁定）は維持: owner 2026-09-22の再確認。店は当面、用意済みのExcelシートで大まかな在庫管理を続けられるため、アプリのv1.0は自動在庫連動の完成まで待つ（先行導入版は出さない）。実機確認（番号印字が電子ジャーナルに載るか）は 2026-09-28 の訪店で済み、番号印字が電子ジャーナルに載り売上に影響しないことを確かめた。owner は 2026-10-11 に番号印字を採らないと決めた（[decision-log](decision-log.md) D-116）ので、番号印字は v1.0 の条件ではない。v1.0 の自動在庫連動に残る条件は、時点証拠 ADR を置き換えた [ADR](adr/2026-10-16-stocktake-count-placement.md)（D-118）の後続の runtime（[backlog](backlog.md) の「棚卸しの数の置き場と在庫数の求め直しの runtime」）。

- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- 2026-10-17 [PR #168](https://github.com/kosei-w90607/inventory-system-desktop/pull/168) 単位・数量・原価の精度の見直しの結果を設計正本へ置き換える（単独の lane、R3、docs だけ）: 原価の 1/100 円を開発・試験 DB の作り直しの起点で行の無い DB にだけ当たる migration で入れ、巻・cm をその起点で外し、単位の語を個数の単位どうしで直せる形と、作り直しを data の folder ごと消さずに移す手順を設計正本に置いた（D-119。code・migration・bindings は変えず、runtime は後続の原価の lane と単位の語の直しの lane）。[archive](archive/plans/2026-10-17-unit-redesign-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-unit-redesign-design.md)
- 2026-10-17 [PR #167](https://github.com/kosei-w90607/inventory-system-desktop/pull/167) 棚卸しの数の置き場と在庫数の求め直しを設計正本へ置き換える（単独の lane、R3、docs だけ）: 棚卸しの数が記録を含むかを記録と計数の窓の重なりで決め、在庫数を記録から求め直し、Z004 を精算回数で識別する形を新しい ADR に置き、時点証拠 ADR と D-116 を置き換えた（D-118。停止 ADR の停止の範囲は変えず、code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-16-stocktake-count-placement-design.md)・[Matrix](archive/plans/test-matrices/2026-10-16-stocktake-count-placement-design.md)
- 2026-10-16 [PR #165](https://github.com/kosei-w90607/inventory-system-desktop/pull/165) CV17 の取込みが原本を書き換えないこと（SD-23）を、出どころを書かない「未確認の前提」として書き直す（R1、docs だけ）: レジスターツールの使用許諾がリバースエンジニアリング等を禁じていると確かめたため（repo 外の回答台帳 TD-276・TD-278）、今の文書の根拠の書き方を直した。設計の判断と、実機の前後比較で確かめる扱いは変えない
- 2026-10-16 [PR #163](https://github.com/kosei-w90607/inventory-system-desktop/pull/163) PLU の書出しの見直しの結果を設計正本へ置き換える（単独の lane、R3、docs だけ）: clear 行と解放・段階導入の道具・件数の要約を外し、枠を JAN ごとに永続させ、占有を締めの SD の読取りで Z004 から毎日照合する形を設計正本に置いた（D-117。code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-16-plu-redesign-design.md)・[Matrix](archive/plans/test-matrices/2026-10-16-plu-redesign-design.md)
- 2026-10-15 [PR #158](https://github.com/kosei-w90607/inventory-system-desktop/pull/158) 単位を 12 種へ広げ、長さの商品を m で入力・表示する（単位の lane、単独の lane、R4）: migration v8 で単位を 12 種へ広げ、長さの商品は在庫を cm の整数のまま m で入力・表示し、入庫・廃棄・手動販売の金額を 1 m あたりの価格から BIZ の共通の丸めで求め、数量・在庫・売価・原価の入力に上限と保存の前の検査を掛けた（D-113 の単位の分。原価の 1/100 円・Z004 と EJ の数量・棚卸しの再開は後続の lane）。[archive](archive/plans/2026-10-11-unit-runtime.md)・[Matrix](archive/plans/test-matrices/2026-10-11-unit-runtime.md)
- 2026-10-15 [PR #159](https://github.com/kosei-w90607/inventory-system-desktop/pull/159) 実測と POS の系列の対応を取得・保存する設計（単独の lane、R3、docs だけ）: 実測の後に行われた精算を資料の置き場の全数読取りの順で見分ける規則（SPEC-STK-TIME-D10、外部前提の確認まで判定は有効にしない）と、EJ の区間の対応づけの骨・欠け・「前回」の候補（D5a）を設計正本に置き、番号印字は採らないと決めた（D-116。code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-11-pos-series-design.md)・[Matrix](archive/plans/test-matrices/2026-10-11-pos-series-design.md)
- 2026-10-11 [PR #154](https://github.com/kosei-w90607/inventory-system-desktop/pull/154) 単位の拡張と数量・原価の精度の設計（単独の lane、R4、docs だけ）: 単位を 12 種へ広げ（m は在庫を cm の整数で持ち 1 m あたりで値付け）、数量・原価の精度（原価を 1/100 円で持つ）と金額の丸めを共通規則 SPEC-UNIT-D1〜D11 に決め、入力の上限と、移行の手順・移行の前の上限の検査・失敗したときの回復を設計正本に置いた（D-113。code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-07-unit-extension.md)・[Matrix](archive/plans/test-matrices/2026-10-07-unit-extension.md)
- 2026-10-11 [PR #152](https://github.com/kosei-w90607/inventory-system-desktop/pull/152) 棚卸しの P1 を直す ㉘ ③ 計数と補正（単独の lane、R3）: 時点証拠 schema に kind と証拠の組の CHECK（SPEC-STK-TIME-D8-K1）を入れ、新方式の棚卸しの開始・計数 context（begin）・1 商品 1 TX の保存・独立再実測・確定を `#[cfg(test)]` の中に置き、確定は確定の直前の在庫へ N − L を加えて保存の後の入出庫を打ち消さない形にした（`system_stock` の時点の正本は tracking の SPEC-STK-TIME-D8-L1。店の画面と今の棚卸しは変わらず、配線は ⑤）。[archive](archive/plans/2026-10-07-stocktake-p1-3.md)・[Matrix](archive/plans/test-matrices/2026-10-07-stocktake-p1-3.md)
- 2026-10-08 [PR #146](https://github.com/kosei-w90607/inventory-system-desktop/pull/146) npm の依存（開発用・runtime）の high・critical を名指しの更新で消す（単独の lane、R3、Issue #135）: TanStack の router 系と推移依存を名指しの更新で修正版へ上げ、修正版の無い経路は使っていない markdownlint-cli2 を外して消し、`npm audit --audit-level=high` が通るようになった（app の code は変えず、実 router で離脱防止を確かめる test を足した。zod の更新は backlog の follow-up）。[archive](archive/plans/2026-10-06-npm-audit.md)・[Matrix](archive/plans/test-matrices/2026-10-06-npm-audit.md)
- 2026-10-07 [PR #150](https://github.com/kosei-w90607/inventory-system-desktop/pull/150) 毎日の売上データをレジの SD から直接読む設計（単独の lane、R3、docs だけ）: レジの SD を探して売上の file を読み、精算ごとの束を取込み済みと照らして同じ精算の二重取込みを拒み、読んだ原本の写しを PC に残す設計を設計正本に置いた（D-111。SD は動かさず、runtime と移す操作は後続の lane）。[archive](archive/plans/2026-10-06-sd-direct-read.md)・[Matrix](archive/plans/test-matrices/2026-10-06-sd-direct-read.md)

### Wave Registry

- 形式: 完了済み wave の記録だけを置く。進行中の lane は `docs/plans/` の packet が持つ（D-097）。これより前の完了済み wave の記録は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に移送済み。

## ブロッカー

次 lane を止める製品側のblockerはない。単位の拡張の店回答は 2026-09-15 に揃い（POS 数量 1 = 1 m、小数 1 桁で打てる。[聞き取り記録](evidence/hearing-2026-09-14-stock-units.sanitized.md)）、設計（PR #154、2026-10-11、D-113）と単位の runtime（PR #158、2026-10-15）は merge 済み。残る原価の lane（C）・Z004 と EJ の数量（P）・棚卸しの再開（⑤）は [backlog](backlog.md) の「単位の拡張」の項目。

## 製品の未決判断

L8-4は owner 決定済み（下記参照）。L8-2/L8-5は旧⑩laneからの記録・実機観測の申し送りで、判断待ちではない。いずれもハーネス整備を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-4 明細数列は owner 決定 2026-09-15 で (a) 撤去。runtime 反映は Backlog の表示小修正 batch 2 に同乗。
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数列 撤去決定）・L8-5（記録日時 font 差、④ C5 追跡中）は対象外（参照のみ）
- STK-1 / STK-2の直し方は、時点証拠 ADR（PR #85、D-116）を置き換えた[棚卸しの数の置き場と在庫の求め直しの ADR](adr/2026-10-16-stocktake-count-placement.md)（PR #167、2026-10-17 merge、D-118）が正本。記録から在庫を求め直すので、確定が数えた後の入出庫を打ち消す・後着の Z004 が二重に減らす形が構造上起きない。runtime は未実装で、[backlog](backlog.md) の「棚卸しの数の置き場と在庫数の求め直しの runtime」が扱う（㉘ ②・③ の `#[cfg(test)]` の時点証拠の code は、その runtime が外す）。店の棚卸しと Z004 の業務 commit は停止 ADR のまま止まっている。
- SD 直読み（D-111）の未決 A（読んだ原本の写しの保持期間と削除）・B（写しを backup に含めるか・PC の外へ出すか）は owner の判断待ち。runtime の既定（消さない・backup に入れない）で通常運用は成り立つので、後続の「SD 直読みの runtime」の lane を止めない。

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
