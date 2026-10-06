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

次の着手順（owner決定2026-09-22）:

1. ㉘ runtimeの最初のlane = 既存の危険な操作（旧棚卸しの開始・入力・確定、POSの業務commit・取消）の停止と再現fixture。並走でEJ（電子ジャーナル）parserのcoreを合成データで進める。本laneの起票はworkflowの軽量化1段目文書部分（PR #90）のdogfood対象: templateの `Ordinary Operation` 節を書き、Plan Reviewの冒頭でreviewerが `成立 / 具体的な反例あり / 外部前提が未確認` の3値を返すかを観測する。 → 完了（EJ parser core = PR #94、㉘ の最初の lane = PR #95、2026-09-25）。次の着手順は未決（owner が決める）。

次のdesign lane「実測とPOS系列の対応を取得・保存する」は実機確認が着手条件のまま。

D-070（Z004の自動在庫連動をv1.0の必須にした裁定）は維持: owner 2026-09-22の再確認。店は当面、用意済みのExcelシートで大まかな在庫管理を続けられるため、アプリのv1.0は自動在庫連動の完成まで待つ（先行導入版は出さない）。したがって実機確認（番号印字が電子ジャーナルに載るか）は後回しにはできるが、v1.0の成否を決める条件として残る。

- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- 2026-10-06 [PR #145](https://github.com/kosei-w90607/inventory-system-desktop/pull/145) 日次売上のレジ日報（公式）に日計（Z001）の全行を取込みごとの表で出す（単独の lane、R3）: 日次売上の「レジ日報（公式）」に Z001 の全行を保存したラベルと並びのまま出し、同じ日に 2 回以上取り込んだ日は取込みごとの表を古い順に並べ、既存の 2 表の見出しに出どころ（Z002・Z005）を添えた（UI-09a-D16、D-096。L3 は owner PASS で、見せ方はデザイン刷新への要求仕様として backlog へ送った）。[archive](archive/plans/2026-10-06-z001-display.md)・[Matrix](archive/plans/test-matrices/2026-10-06-z001-display.md)
- 2026-10-06 [PR #144](https://github.com/kosei-w90607/inventory-system-desktop/pull/144) 商品修正の操作ログに売価・原価以外の項目の変更前後も残し、docs の古い参照を直す（小口のまとめ、単独の lane、R3）: 商品修正の detail_json に変えた field ごとの変更前後を serde_json で書き（BIZ-01-D7）、`docs/TOOLING_SKILL_COMMANDS.md` の見出しの参照先と `.codex/README.md` の撤去済みの mode の句を直した。操作ログ画面は変えていない。[archive](archive/plans/2026-10-06-small-batch.md)・[Matrix](archive/plans/test-matrices/2026-10-06-small-batch.md)
- 2026-10-05 [PR #142](https://github.com/kosei-w90607/inventory-system-desktop/pull/142) helper と検査の守りを揃える（単独の lane、R3）: PK4 が Workflow State の値を helper の `parse_packet` で判定し、PK5 が `Plan Commit`・`Amendments` の 40 桁の SHA だけを受け、helper は Gated Amendment の後に要る broad を先に言い、review の record に同じ head の PR review の数の申告（`--pr-reviews`）を求めるようになった（D-107）。[archive](archive/plans/2026-10-05-gate-record-guards.md)・[Matrix](archive/plans/test-matrices/2026-10-05-gate-record-guards.md)
- 2026-10-05 [PR #141](https://github.com/kosei-w90607/inventory-system-desktop/pull/141) EJ parser に店が普段使う文法を足す（2026-10-04 の 4 lane の lane D、R3）: 記録の種類を本文の行で決め、取引の合計域・明細域（訂正・値引き・マイナスキー・戻の印）と取引中止を読み、規則に合わない記録は今どおり復元不能に倒す（D-105）。[archive](archive/plans/2026-10-04-ej-grammar.md)・[Matrix](archive/plans/test-matrices/2026-10-04-ej-grammar.md)
- 2026-10-05 [PR #140](https://github.com/kosei-w90607/inventory-system-desktop/pull/140) 日報（Z001 / Z002 / Z005）取込みの穴（4 lane の lane B、R3）: 小数の個数を 100 倍の整数で受け（migration v7）、別の精算の混在を精算回数で止め、行の鍵をラベルで決めた（D-104）。[archive](archive/plans/2026-10-04-daily-report-import-gaps.md)・[Matrix](archive/plans/test-matrices/2026-10-04-daily-report-import-gaps.md)
- 2026-10-04 [PR #139](https://github.com/kosei-w90607/inventory-system-desktop/pull/139) Z004 取込みの穴（4 lane の lane A、R3）: カンマ付きの金額を読み、コードの無い枠の売上を `invalid_jan` の行エラーで知らせ、売上の無い非 JAN の枠を読み飛ばす（D-103）。[archive](archive/plans/2026-10-04-z004-import-gaps.md)・[Matrix](archive/plans/test-matrices/2026-10-04-z004-import-gaps.md)
- 2026-10-04 [PR #138](https://github.com/kosei-w90607/inventory-system-desktop/pull/138) 独自コードの自動採番が既存の番号と衝突して止まる（4 lane の lane E、R3）: 発番は既存の番号の最大の次から振り（抜けは埋めない）、9999 の次は 5 桁で続ける（D-106）。[archive](archive/plans/2026-10-04-custom-code-seq.md)・[Matrix](archive/plans/test-matrices/2026-10-04-custom-code-seq.md)
- 2026-10-01 [PR #136](https://github.com/kosei-w90607/inventory-system-desktop/pull/136) 検査 script と test の小口を整理する（単独の lane、R3）: PK4 が Workflow State の key の重複を push の前に止め、`check-workflow-git.sh` は Phase を `## Workflow State` の節だけから読み、PK1・PK3 の節の判定を `##` に限り、hook test が frontmatter の `permissionMode`・`mcpServers` を拒み、home の小文字化の残りを揃えた（D-102）。[archive](archive/plans/2026-10-01-checker-small-fixes.md)・[Matrix](archive/plans/test-matrices/2026-10-01-checker-small-fixes.md)
- 2026-10-01 [PR #132](https://github.com/kosei-w90607/inventory-system-desktop/pull/132) ハーネスの残りの小口の整理（単独の lane、R2）: 直近の完了を 1 行 + link の短い行にして長文を完了履歴へ移し、closeout の書き方を変え（D-101）、AGENTS の Workspace Access と MANUAL §5.4 を今の運用に合わせ、使われない profiles・evals を削った。[archive](archive/plans/2026-09-30-harness-small-cleanup.md)
- 2026-09-30 [PR #130](https://github.com/kosei-w90607/inventory-system-desktop/pull/130) CI の二重を削る（単独の lane、R3）: Draft の PR にも hosted CI が回り、merge の CI 根拠は Ready の後の run の `Merge gate` だけになり、`bash scripts/local-ci.sh full` は任意の道具になった。[archive](archive/plans/2026-09-30-ci-dedup.md)・[Matrix](archive/plans/test-matrices/2026-09-30-ci-dedup.md)

### Wave Registry

- 形式: 完了済み wave の記録だけを置く。進行中の lane は `docs/plans/` の packet が持つ（D-097）。これより前の完了済み wave の記録は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に移送済み。

## ブロッカー

次 lane を止める製品側のblockerはない。単位の拡張の店回答は 2026-09-15 に揃った（POS 数量 1 = 1 m、小数 1 桁で打てる。[聞き取り記録](evidence/hearing-2026-09-14-stock-units.sanitized.md)）。design lane は起票可だが、wave 10 の後に並べる（owner 2026-09-15 合意）。

## 製品の未決判断

L8-4は owner 決定済み（下記参照）。L8-2/L8-5は旧⑩laneからの記録・実機観測の申し送りで、判断待ちではない。いずれもハーネス整備を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-4 明細数列は owner 決定 2026-09-15 で (a) 撤去。runtime 反映は Backlog の表示小修正 batch 2 に同乗。
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数列 撤去決定）・L8-5（記録日時 font 差、④ C5 追跡中）は対象外（参照のみ）
- STK-1 / STK-2は[統合ADR](adr/2026-09-18-stocktake-time-evidence.md)へ設計を正本化済み（PR #85、2026-09-21 merge）。runtimeは㉘で未実装、恒常運用（日次の自動在庫連動）は実測とPOS系列の対応を取得・保存する次のdesign laneに依る。snapshot補正・商品単位の再実測・過去評価額の非遡及は引き継ぐ。旧日付比較や未検証の時刻補完を実装指示に使わない。

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
