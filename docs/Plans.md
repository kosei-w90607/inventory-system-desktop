# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

第 1 便（PR #170・#173・#174・#175）と第 2 便（PR #171・#176）は着地した（2026-10-19）。次 = 新しい lane を起こす前に、前提の更新と docs 全体の棚卸し（owner 2026-10-18。設計だけ先に入った「proposed・未実装」の記述、file:行 の引用、decision-log の proposed の Status、数えた時点付きの事実・未確認の前提を 2026-10-18 の SD の写しと在庫 Excel で当たる、`docs/project-memory.md`・`docs/PROJECT_HANDOFF.md`・backlog の申し送り。契約の文を今に合わせる lane 1 は packet `docs/plans/2026-10-19-docs-contract-refresh.md`。[backlog](backlog.md) に足した 51 UI-01b-D5 の句と Wave Operation の L3 の頼み方の規則もここで）。棚卸しの後の lane の候補（順は owner が決める）: 棚卸しの runtime (b)、PR #172 SD 直読みの runtime（SD の写しの確かめ〈Contract Probe〉の後）、JAN の別名の runtime、日報の紙の runtime、SD 一括取込みと EJ の控えの runtime、原価の lane（C、U6 の店の答えの後）。

active な lane の Plan Packet は `docs/plans/` の dated packet が正本（lane の branch は各 packet の `Branch` 行、現在地は helper status）。lane の起票・closeout はこの節へ lane ごとの行を足さない（D-097）。

- SD を直接読む設計（PR #150、2026-10-07）は merge 済み。次 = 後続の「SD 直読みの runtime」の lane（PR #172、Draft で進行中。R3、[backlog](backlog.md) の該当項目。起票時に Final Review の P3 4 件を直し、L3 の前に packet の Contract Probe の確認を行う）、その後に取込み済みを `XZ_BKUP` へ移す (b) の lane（D-111 (1)(b)、backlog の該当項目）。(b) の lane まで店は CV17 の取込みを今の運用のまま続ける（D-111 の運用の制約）。
- 棚卸しと Z004 の業務 commit の次の runtime は D-118 の (b)（[backlog](backlog.md) の「棚卸しの数の置き場と在庫数の求め直しの runtime」）。2026-09-22 の owner 決定の着手順（㉘ ①〜⑤）は D-118 で置き換わった。移した記録は [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) の「移した「次の行動」の段落」。

設計の見直し（事実だけを集め、白紙の骨組みと今の設計を突き合わせる）の結果を正本へ置き換える design lane は、PLU の書出し（PR #163、D-117）・棚卸しの数の置き場と在庫数の求め直し（PR #167、D-118）・単位・数量・原価の精度（PR #168、D-119）の 3 本が merge 済み。見直しで分けた残りの design lane 2 本、「日報の紙と意味づけ」（PR #173、D-120）と「売上の SD からの一括取込みと EJ の控えの閲覧」（PR #175、D-121）も 2026-10-18 に merge 済みで、runtime は [backlog](backlog.md) の「日報の紙の runtime」「SD の一括取込みと EJ の控えの runtime（A）」「Z004 を SD の一括取込みに入れる runtime（B）」の項目。runtime の順: 開発・試験 DB はリリースの前まで作り直してよいので（D-123、[22 §16](function-design/22-mnt-migration.md)）、棚卸しの数の置き場と在庫数の求め直しの runtime は原価の lane（vB）を待たない（(a) は PR #176 で 2026-10-19 に merge、残りは (b)）。原価の lane は店の答え（原価の税、repo 外の回答台帳 TD-297 の U6）を待つ。PLU 側の後続（SD を直接読む runtime の後に PLU の書出しの見直しの runtime）と、TD-284 の設計 lane（PR #174、2026-10-18 merge、D-122）の後続の「JAN の別名の runtime」（PLU の書出しの見直しの runtime と同じ lane か、その後）は [backlog](backlog.md) の各項目。デザインの刷新は v1.0 の前に入れる（機能が固まった後に画面を一新する。owner の決定 TD-296）。

D-070（Z004の自動在庫連動をv1.0の必須にした裁定）は維持: owner 2026-09-22の再確認。店は当面、用意済みのExcelシートで大まかな在庫管理を続けられるため、アプリのv1.0は自動在庫連動の完成まで待つ（先行導入版は出さない）。実機確認（番号印字が電子ジャーナルに載るか）は 2026-09-28 の訪店で済み、番号印字が電子ジャーナルに載り売上に影響しないことを確かめた。owner は 2026-10-11 に番号印字を採らないと決めた（[decision-log](decision-log.md) D-116）ので、番号印字は v1.0 の条件ではない。v1.0 の自動在庫連動に残る条件は、時点証拠 ADR を置き換えた [ADR](adr/2026-10-16-stocktake-count-placement.md)（D-118）の後続の runtime の (b)（[backlog](backlog.md) の「棚卸しの数の置き場と在庫数の求め直しの runtime」。(a) は PR #176 で merge 済み）。

## 直近の完了

- 2026-10-19 [PR #176](https://github.com/kosei-w90607/inventory-system-desktop/pull/176) 棚卸しの数の置き場と在庫数の求め直しの runtime (a)（単独の lane、R4）: migration v9 で入出庫の記録に業務日の列を持たせて作り直し（消さずに写す）、計数の表と写しの列を置き、入出庫・商品登録・商品 CSV・整合性の補正の在庫数を記録から求め直して書く形に切り替え、整合性検証を記録から求め直した値との突合にした（D-118 の (a)・D-123。計数が無い間は在庫の値は今と同じ。棚卸しか Z004 の記録のある開発・試験 DB は止まり作り直す。計数の保存・Z004 の新しい経路・停止の解除は後続の (b)）。[archive](archive/plans/2026-10-18-stocktake-count-runtime-a.md)・[Matrix](archive/plans/test-matrices/2026-10-18-stocktake-count-runtime-a.md)
- 2026-10-19 [PR #171](https://github.com/kosei-w90607/inventory-system-desktop/pull/171) 登録の後に単位の語を個数の単位どうしの中で直せるようにする（単位の語の直しの runtime、単独の lane、R3）: 商品修正と商品 CSV の上書きで個数の単位どうしの単位の変更を許し、種類をまたぐ変更と長さの単位どうしの変更は 3 つの入口で BIZ の 1 つの判定で拒み、単位を変えた記録を操作ログに残し、単位だけの変更では PLU の未反映にしない形にした（D-119。在庫・明細・金額は変えない。migration は無い）。[archive](archive/plans/2026-10-17-stock-unit-relabel.md)・[Matrix](archive/plans/test-matrices/2026-10-17-stock-unit-relabel.md)
- 2026-10-18 [PR #175](https://github.com/kosei-w90607/inventory-system-desktop/pull/175) 売上の SD からの一括取込みと EJ の控えの閲覧の設計（単独の lane、R3、docs だけ）: 締めの SD の読取りで日報・Z004・EJ を 1 項目 1 TX で順に取り込み業務の拒否は飛ばす一括取込み、日報の同日追加の確認を精算回数の照合で置き換える条件、EJ の記録の文を番号を鍵に保存してレシートの控えとして見せる画面、CV17 の取込みとの併存を設計正本に置いた（D-121。code・migration・bindings は変えず、runtime は後続の (A)・(B)）。[archive](archive/plans/2026-10-17-sd-bulk-import-ej-view-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-sd-bulk-import-ej-view-design.md)
- 2026-10-18 [PR #170](https://github.com/kosei-w90607/inventory-system-desktop/pull/170) MSI を作る・入れる・更新する・前の版へ戻す管理者の手順書を置く（単独の lane、R3、docs だけ）: 既存の migration と backup の契約を引いて配布・更新・前の版へ戻す流れを 1 つの手順書に並べ、前へ進むか戻すかを今の DB の版と入力の有無で決め、決めるまで DB を動かさない判断を足した（実機の MSI の振舞いは未確認として予行演習へ送った。設定と code は変えず、製品名と upgrade code の固定と予行演習は後続）。[archive](archive/plans/2026-10-17-msi-distribution-docs.md)・[Matrix](archive/plans/test-matrices/2026-10-17-msi-distribution-docs.md)
- 2026-10-18 [PR #173](https://github.com/kosei-w90607/inventory-system-desktop/pull/173) 日報の紙と意味づけの設計（単独の lane、R3、docs だけ）: その日の完了した日報の取込みを位置と名称の組で足した 1 日 1 枚の紙を A4 縦・文字 9 pt 以上・色なしで印刷する形と紙の切替えの時期を設計正本に置き、日次売上の支払集計の合算の鍵を紙と同じ規則にし、`credit` の規則を外した（D-120。code・migration・bindings は変えず、runtime は後続の「日報の紙の runtime」）。[archive](archive/plans/2026-10-17-daily-report-sheet-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-daily-report-sheet-design.md)
- 2026-10-18 [PR #174](https://github.com/kosei-w90607/inventory-system-desktop/pull/174) JAN を直した商品の前の JAN を別名にして売上を同じ商品へたどる設計（単独の lane、R3、docs だけ）: JAN を直すときに前の番号の現物の有無を 1 回聞き、「ある」なら前の JAN を商品の側の表に別名として残して Z004 の売上を同じ商品へ引き当て、商品がその JAN を持てば trigger で消す形を、PLU の枠と独立に設計正本に置いた（D-122。code・migration・bindings は変えず、runtime は後続の「JAN の別名の runtime」）。[archive](archive/plans/2026-10-17-jan-alias-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-jan-alias-design.md)
- 2026-10-17 [PR #168](https://github.com/kosei-w90607/inventory-system-desktop/pull/168) 単位・数量・原価の精度の見直しの結果を設計正本へ置き換える（単独の lane、R3、docs だけ）: 原価の 1/100 円を開発・試験 DB の作り直しの起点で行の無い DB にだけ当たる migration で入れ、巻・cm をその起点で外し、単位の語を個数の単位どうしで直せる形と、作り直しを data の folder ごと消さずに移す手順を設計正本に置いた（D-119。code・migration・bindings は変えず、runtime は後続の原価の lane と単位の語の直しの lane）。[archive](archive/plans/2026-10-17-unit-redesign-design.md)・[Matrix](archive/plans/test-matrices/2026-10-17-unit-redesign-design.md)
- 2026-10-17 [PR #167](https://github.com/kosei-w90607/inventory-system-desktop/pull/167) 棚卸しの数の置き場と在庫数の求め直しを設計正本へ置き換える（単独の lane、R3、docs だけ）: 棚卸しの数が記録を含むかを記録と計数の窓の重なりで決め、在庫数を記録から求め直し、Z004 を精算回数で識別する形を新しい ADR に置き、時点証拠 ADR と D-116 を置き換えた（D-118。停止 ADR の停止の範囲は変えず、code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-16-stocktake-count-placement-design.md)・[Matrix](archive/plans/test-matrices/2026-10-16-stocktake-count-placement-design.md)
- 2026-10-16 [PR #165](https://github.com/kosei-w90607/inventory-system-desktop/pull/165) CV17 の取込みが原本を書き換えないこと（SD-23）を、出どころを書かない「未確認の前提」として書き直す（R1、docs だけ）: レジスターツールの使用許諾がリバースエンジニアリング等を禁じていると確かめたため（repo 外の回答台帳 TD-276・TD-278）、今の文書の根拠の書き方を直した。設計の判断と、実機の前後比較で確かめる扱いは変えない
- 2026-10-16 [PR #163](https://github.com/kosei-w90607/inventory-system-desktop/pull/163) PLU の書出しの見直しの結果を設計正本へ置き換える（単独の lane、R3、docs だけ）: clear 行と解放・段階導入の道具・件数の要約を外し、枠を JAN ごとに永続させ、占有を締めの SD の読取りで Z004 から毎日照合する形を設計正本に置いた（D-117。code・migration・bindings は変えず、runtime は後続の lane）。[archive](archive/plans/2026-10-16-plu-redesign-design.md)・[Matrix](archive/plans/test-matrices/2026-10-16-plu-redesign-design.md)

### Wave Registry

- 形式: 完了済み wave の記録だけを置く。進行中の lane は `docs/plans/` の packet が持つ（D-097）。これより前の完了済み wave の記録は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に移送済み。

## ブロッカー

次 lane を止める製品側のblockerはない。単位の拡張の店回答は 2026-09-15 に揃い（POS 数量 1 = 1 m、小数 1 桁で打てる。[聞き取り記録](evidence/hearing-2026-09-14-stock-units.sanitized.md)）、設計（PR #154、2026-10-11、D-113）と単位の runtime（PR #158、2026-10-15）は merge 済み。残る原価の lane（C）は [backlog](backlog.md) の「原価の lane（C）」、Z004 と EJ の数量（P）は backlog の「単位の拡張の残りの申し送り」の項目、棚卸しの再開は D-118 の (b)（backlog の「棚卸しの数の置き場と在庫数の求め直しの runtime」）。

## 製品の未決判断

L8-2/L8-5は旧⑩laneからの記録・実機観測の申し送りで、判断待ちではない。いずれもハーネス整備を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-2（badge 無色、⑦ 待ち）・L8-5（記録日時 font 差。[backlog](backlog.md) の L8-5 の項目）は対象外（参照のみ）
- STK-1 / STK-2の直し方は、時点証拠 ADR（PR #85、D-116）を置き換えた[棚卸しの数の置き場と在庫の求め直しの ADR](adr/2026-10-16-stocktake-count-placement.md)（PR #167、2026-10-17 merge、D-118）が正本。記録から在庫を求め直すので、確定が数えた後の入出庫を打ち消す・後着の Z004 が二重に減らす形が構造上起きない。runtime の (a)（在庫数を記録から求め直して書く形と計数の置き場の migration）は PR #176（2026-10-19）で入り、残る (b) は [backlog](backlog.md) の「棚卸しの数の置き場と在庫数の求め直しの runtime」が扱う（㉘ ②・③ の `#[cfg(test)]` の時点証拠の code は (b) が外す）。店の棚卸しと Z004 の業務 commit は停止 ADR のまま止まっている。
- SD 直読み（D-111）の未決 A（読んだ原本の写しの保持期間と削除）・B（写しを backup に含めるか・PC の外へ出すか）は owner の判断待ち。runtime の既定（消さない・backup に入れない）で通常運用は成り立つので、後続の「SD 直読みの runtime」の lane を止めない。

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
