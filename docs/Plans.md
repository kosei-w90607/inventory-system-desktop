# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

2 便の進め方（owner 2026-10-18、repo 外の回答台帳 TD-320）: 第 1 便（PR #170・#173・#174・#175）は着地した。次 = 第 2 便（PR #171 単位の語の直しの runtime の実装、PR #176 棚卸しの runtime (a)〈R4。owner の R4 の承認の後〉→ Final Review → L3 をまとめて 1 回 → merge）。第 2 便の後、新しい lane を起こす前に、前提の更新と docs 全体の棚卸し（設計だけ先に入った「proposed・未実装」の記述、file:行 の引用、decision-log の proposed の Status、数えた時点付きの事実・未確認の前提を 2026-10-18 の SD の写しと在庫 Excel で当たる、`docs/project-memory.md`・`docs/PROJECT_HANDOFF.md`・backlog の申し送り）を行う（owner 2026-10-18）。PR #172 SD 直読みの runtime は SD の写しの確かめ（Contract Probe）の後。

wave 13（owner 2026-09-23「全部並行で」、2026-09-24 にハーネス刷新を追加）: lane 数の上限と同じ source document の同居禁止（D-055）は owner 決定 2026-09-24「規則は環境が変わるたびに変える」により適用せず、同じ file の重なりは merge 順で解消する。Plan Review は fresh Opus + Codex、Codex が rate limit の間は fresh Opus のみで進め Final Review だけ Codex を待つ（owner 確認 2026-09-23、Codex 復帰後は両方）。

active な lane の Plan Packet は `docs/plans/` の dated packet が正本（lane の branch は各 packet の `Branch` 行、現在地は helper status）。lane の起票・closeout はこの節へ lane ごとの行を足さない（D-097）。

- ハーネス刷新は PR0 ∥ PR1 → (PR2 ∥ PR3) → (PR4 ∥ PR5) の 5 本（owner 2026-09-24）。5 本すべて merge 済み: PR0（#92）・PR1（#97）・PR2（#113、座組と役割）・PR3（#117、入口と重複）・PR5（#127、gate の穴）・PR4（#128、手続きの軽量化）と、PR4・PR5 より先に起こした並走の摩擦を削る lane（PR #123、owner 2026-09-28 起票承認）。
- 2026-10-04 の 4 lane（A Z004 取込みの穴・B 日報取込みの穴・D EJ の文法・E 独自コードの採番、owner の lane 選択 TD-104）と、その後に先に入れた helper の守りの lane（owner 2026-10-05）はすべて merge 済み（PR #138〜#142）。次の lane は未定（owner が決める）。
- wave 14（owner 2026-09-27「Issue の範囲を避けて片っ端から並列で」。owner 決定 2026-09-24「規則は環境が変わるたびに変える」により wave 13 と同じく Wave Registry でなく「次の行動」に置く）lane D の design（PR #114）と後続 runtime lane「日次売上の「レジ日報（公式）」に日計（Z001）の表を出す」（PR #145、2026-10-06）は merge 済み。
- SD を直接読む設計（PR #150、2026-10-07）は merge 済み。次 = 後続の「SD 直読みの runtime」の lane（PR #172、Draft で進行中。R3、[backlog](backlog.md) の該当項目。起票時に Final Review の P3 4 件を直し、L3 の前に packet の Contract Probe の確認を行う）、その後に取込み済みを `XZ_BKUP` へ移す (b) の lane（D-111 (1)(b)、backlog の該当項目）。(b) の lane まで店は CV17 の取込みを今の運用のまま続ける（D-111 の運用の制約）。

次の着手順（owner決定2026-09-22）:

1. ㉘ runtimeの最初のlane = 既存の危険な操作（旧棚卸しの開始・入力・確定、POSの業務commit・取消）の停止と再現fixture。並走でEJ（電子ジャーナル）parserのcoreを合成データで進める。本laneの起票はworkflowの軽量化1段目文書部分（PR #90）のdogfood対象: templateの `Ordinary Operation` 節を書き、Plan Reviewの冒頭でreviewerが `成立 / 具体的な反例あり / 外部前提が未確認` の3値を返すかを観測する。 → 完了（EJ parser core = PR #94、㉘ の最初の lane = PR #95、2026-09-25）。㉘ はその後 ② 受領・判定・保存の基盤（PR #148、2026-10-07）と ③ 計数と補正（PR #152、2026-10-11）まで merge 済みで、どちらも通常の起動へは配線していない（店の棚卸しは停止のまま）。㉘ の次は ④ 取込み・取消・回復（Square か CASIO かの判断待ちは 2026-10-11 に解けた: しばらくは CASIO のレジでいく。repo 外の回答台帳 TD-221）と ⑤ 一括切替（通常の起動・画面・command・bindings への配線）で、中身は [backlog](backlog.md) の「㉘ ③ 〜 ⑤ の申し送り」。次の着手順は未決（owner が決める）。

設計の見直し（事実だけを集め、白紙の骨組みと今の設計を突き合わせる）の結果を正本へ置き換える design lane は、PLU の書出し（PR #163、D-117）・棚卸しの数の置き場と在庫数の求め直し（PR #167、D-118）・単位・数量・原価の精度（PR #168、D-119）の 3 本が merge 済み。見直しで分けた残りの design lane 2 本、「日報の紙と意味づけ」（PR #173、D-120）と「売上の SD からの一括取込みと EJ の控えの閲覧」（PR #175、D-121）も 2026-10-18 に merge 済みで、runtime は [backlog](backlog.md) の「日報の紙の runtime」「SD の一括取込みと EJ の控えの runtime（A）」「Z004 を SD の一括取込みに入れる runtime（B）」の項目。runtime の順の注意: DB の作り直しを 1 回にするため、原価の lane（vB）を棚卸しの数の置き場と在庫数の求め直しの runtime の最初の配布の単位より先に入れる（D-119 (8)、[22 §16](function-design/22-mnt-migration.md)）。原価の lane は店の答え（原価の税、repo 外の回答台帳 TD-297 の U6）を待つ。PLU 側の後続（SD を直接読む runtime の後に PLU の書出しの見直しの runtime）と、TD-284 の設計 lane（PR #174、2026-10-18 merge、D-122）の後続の「JAN の別名の runtime」（PLU の書出しの見直しの runtime と同じ lane か、その後）は [backlog](backlog.md) の各項目。デザインの刷新は v1.0 の前に入れる（機能が固まった後に画面を一新する。owner の決定 TD-296）。

D-070（Z004の自動在庫連動をv1.0の必須にした裁定）は維持: owner 2026-09-22の再確認。店は当面、用意済みのExcelシートで大まかな在庫管理を続けられるため、アプリのv1.0は自動在庫連動の完成まで待つ（先行導入版は出さない）。実機確認（番号印字が電子ジャーナルに載るか）は 2026-09-28 の訪店で済み、番号印字が電子ジャーナルに載り売上に影響しないことを確かめた。owner は 2026-10-11 に番号印字を採らないと決めた（[decision-log](decision-log.md) D-116）ので、番号印字は v1.0 の条件ではない。v1.0 の自動在庫連動に残る条件は、時点証拠 ADR を置き換えた [ADR](adr/2026-10-16-stocktake-count-placement.md)（D-118）の後続の runtime（[backlog](backlog.md) の「棚卸しの数の置き場と在庫数の求め直しの runtime」）。

- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- 2026-10-18 [PR #175](https://github.com/kosei-w90607/inventory-system-desktop/pull/175) 売上の SD からの一括取込みと EJ の控えの閲覧の設計（単独の lane、R3、docs だけ）: 締めの SD の読取りで日報・Z004・EJ を 1 項目 1 TX で順に取り込み業務の拒否は飛ばす一括取込み、日報の同日追加の確認を精算回数の照合で置き換える条件、EJ の記録の文を番号を鍵に保存してレシートの控えとして見せる画面、CV17 の取込みとの併存を設計正本に置いた（D-121。code・migration・bindings は変えず、runtime は後続の (A)・(B)）。[archive](archive/plans/2026-10-17-sd-bulk-import-ej-view-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-sd-bulk-import-ej-view-design.md)
- 2026-10-18 [PR #170](https://github.com/kosei-w90607/inventory-system-desktop/pull/170) MSI を作る・入れる・更新する・前の版へ戻す管理者の手順書を置く（単独の lane、R3、docs だけ）: 既存の migration と backup の契約を引いて配布・更新・前の版へ戻す流れを 1 つの手順書に並べ、前へ進むか戻すかを今の DB の版と入力の有無で決め、決めるまで DB を動かさない判断を足した（実機の MSI の振舞いは未確認として予行演習へ送った。設定と code は変えず、製品名と upgrade code の固定と予行演習は後続）。[archive](archive/plans/2026-10-17-msi-distribution-docs.md)・[Matrix](archive/plans/test-matrices/2026-10-17-msi-distribution-docs.md)
- 2026-10-18 [PR #173](https://github.com/kosei-w90607/inventory-system-desktop/pull/173) 日報の紙と意味づけの設計（単独の lane、R3、docs だけ）: その日の完了した日報の取込みを位置と名称の組で足した 1 日 1 枚の紙を A4 縦・文字 9 pt 以上・色なしで印刷する形と紙の切替えの時期を設計正本に置き、日次売上の支払集計の合算の鍵を紙と同じ規則にし、`credit` の規則を外した（D-120。code・migration・bindings は変えず、runtime は後続の「日報の紙の runtime」）。[archive](archive/plans/2026-10-17-daily-report-sheet-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-daily-report-sheet-design.md)
- 2026-10-18 [PR #174](https://github.com/kosei-w90607/inventory-system-desktop/pull/174) JAN を直した商品の前の JAN を別名にして売上を同じ商品へたどる設計（単独の lane、R3、docs だけ）: JAN を直すときに前の番号の現物の有無を 1 回聞き、「ある」なら前の JAN を商品の側の表に別名として残して Z004 の売上を同じ商品へ引き当て、商品がその JAN を持てば trigger で消す形を、PLU の枠と独立に設計正本に置いた（D-122。code・migration・bindings は変えず、runtime は後続の「JAN の別名の runtime」）。[archive](archive/plans/2026-10-17-jan-alias-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-jan-alias-design.md)
- 2026-10-17 [PR #168](https://github.com/kosei-w90607/inventory-system-desktop/pull/168) 単位・数量・原価の精度の見直しの結果を設計正本へ置き換える（単独の lane、R3、docs だけ）: 原価の 1/100 円を開発・試験 DB の作り直しの起点で行の無い DB にだけ当たる migration で入れ、巻・cm をその起点で外し、単位の語を個数の単位どうしで直せる形と、作り直しを data の folder ごと消さずに移す手順を設計正本に置いた（D-119。code・migration・bindings は変えず、runtime は後続の原価の lane と単位の語の直しの lane）。[archive](archive/plans/2026-10-17-unit-redesign-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-unit-redesign-design.md)
- 2026-10-17 [PR #167](https://github.com/kosei-w90607/inventory-system-desktop/pull/167) 棚卸しの数の置き場と在庫数の求め直しを設計正本へ置き換える（単独の lane、R3、docs だけ）: 棚卸しの数が記録を含むかを記録と計数の窓の重なりで決め、在庫数を記録から求め直し、Z004 を精算回数で識別する形を新しい ADR に置き、時点証拠 ADR と D-116 を置き換えた（D-118。停止 ADR の停止の範囲は変えず、code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-16-stocktake-count-placement-design.md)・[Matrix](archive/plans/test-matrices/2026-10-16-stocktake-count-placement-design.md)
- 2026-10-16 [PR #165](https://github.com/kosei-w90607/inventory-system-desktop/pull/165) CV17 の取込みが原本を書き換えないこと（SD-23）を、出どころを書かない「未確認の前提」として書き直す（R1、docs だけ）: レジスターツールの使用許諾がリバースエンジニアリング等を禁じていると確かめたため（repo 外の回答台帳 TD-276・TD-278）、今の文書の根拠の書き方を直した。設計の判断と、実機の前後比較で確かめる扱いは変えない
- 2026-10-16 [PR #163](https://github.com/kosei-w90607/inventory-system-desktop/pull/163) PLU の書出しの見直しの結果を設計正本へ置き換える（単独の lane、R3、docs だけ）: clear 行と解放・段階導入の道具・件数の要約を外し、枠を JAN ごとに永続させ、占有を締めの SD の読取りで Z004 から毎日照合する形を設計正本に置いた（D-117。code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-16-plu-redesign-design.md)・[Matrix](archive/plans/test-matrices/2026-10-16-plu-redesign-design.md)
- 2026-10-15 [PR #158](https://github.com/kosei-w90607/inventory-system-desktop/pull/158) 単位を 12 種へ広げ、長さの商品を m で入力・表示する（単位の lane、単独の lane、R4）: migration v8 で単位を 12 種へ広げ、長さの商品は在庫を cm の整数のまま m で入力・表示し、入庫・廃棄・手動販売の金額を 1 m あたりの価格から BIZ の共通の丸めで求め、数量・在庫・売価・原価の入力に上限と保存の前の検査を掛けた（D-113 の単位の分。原価の 1/100 円・Z004 と EJ の数量・棚卸しの再開は後続の lane）。[archive](archive/plans/2026-10-11-unit-runtime.md)・[Matrix](archive/plans/test-matrices/2026-10-11-unit-runtime.md)
- 2026-10-15 [PR #159](https://github.com/kosei-w90607/inventory-system-desktop/pull/159) 実測と POS の系列の対応を取得・保存する設計（単独の lane、R3、docs だけ）: 実測の後に行われた精算を資料の置き場の全数読取りの順で見分ける規則（SPEC-STK-TIME-D10、外部前提の確認まで判定は有効にしない）と、EJ の区間の対応づけの骨・欠け・「前回」の候補（D5a）を設計正本に置き、番号印字は採らないと決めた（D-116。code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-11-pos-series-design.md)・[Matrix](archive/plans/test-matrices/2026-10-11-pos-series-design.md)

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
