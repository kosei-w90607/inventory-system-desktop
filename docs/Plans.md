# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

wave 13（owner 2026-09-23「全部並行で」、2026-09-24 にハーネス刷新を追加）: lane 数の上限と同じ source document の同居禁止（D-055）は owner 決定 2026-09-24「規則は環境が変わるたびに変える」により適用せず、同じ file の重なりは merge 順で解消する。Plan Review は fresh Opus + Codex、Codex が rate limit の間は fresh Opus のみで進め Final Review だけ Codex を待つ（owner 確認 2026-09-23、Codex 復帰後は両方）。

active な lane の Plan Packet は `docs/plans/` の dated packet が正本（lane の branch は各 packet の `Branch` 行、現在地は helper status）。lane の起票・closeout はこの節へ lane ごとの行を足さない（D-097）。

- ハーネス刷新は PR0 ∥ PR1 → (PR2 ∥ PR3) → (PR4 ∥ PR5) の 5 本（owner 2026-09-24）。5 本すべて merge 済み: PR0（#92）・PR1（#97）・PR2（#113、座組と役割）・PR3（#117、入口と重複）・PR5（#127、gate の穴）・PR4（#128、手続きの軽量化）と、PR4・PR5 より先に起こした並走の摩擦を削る lane（PR #123、owner 2026-09-28 起票承認）。
- wave 14（owner 2026-09-27「Issue の範囲を避けて片っ端から並列で」。owner 決定 2026-09-24「規則は環境が変わるたびに変える」により wave 13 と同じく Wave Registry でなく「次の行動」に置く）lane D の design（PR #114）は merge 済み。次 = 後続 runtime lane「日次売上の「レジ日報（公式）」に日計（Z001）の表を出す」（R3、Human Gate `ready,merge,manual`）。着手は訪店（Issue #105）の後（owner 決定 2026-09-28。Z001 の表を足すと日次売上の画面が縦に伸び既存の並びが崩れうるため、実物の Z001 の行数を見てから作る）。起票の中身は [backlog](backlog.md) の該当項目。

次の着手順（owner決定2026-09-22）:

1. ㉘ runtimeの最初のlane = 既存の危険な操作（旧棚卸しの開始・入力・確定、POSの業務commit・取消）の停止と再現fixture。並走でEJ（電子ジャーナル）parserのcoreを合成データで進める。本laneの起票はworkflowの軽量化1段目文書部分（PR #90）のdogfood対象: templateの `Ordinary Operation` 節を書き、Plan Reviewの冒頭でreviewerが `成立 / 具体的な反例あり / 外部前提が未確認` の3値を返すかを観測する。 → 完了（EJ parser core = PR #94、㉘ の最初の lane = PR #95、2026-09-25）。次の着手順は未決（owner が決める）。

次のdesign lane「実測とPOS系列の対応を取得・保存する」は実機確認が着手条件のまま。

D-070（Z004の自動在庫連動をv1.0の必須にした裁定）は維持: owner 2026-09-22の再確認。店は当面、用意済みのExcelシートで大まかな在庫管理を続けられるため、アプリのv1.0は自動在庫連動の完成まで待つ（先行導入版は出さない）。したがって実機確認（番号印字が電子ジャーナルに載るか）は後回しにはできるが、v1.0の成否を決める条件として残る。

- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- 2026-10-01 [PR #132](https://github.com/kosei-w90607/inventory-system-desktop/pull/132) ハーネスの残りの小口の整理（単独の lane、R2）: 直近の完了を 1 行 + link の短い行にして長文を完了履歴へ移し、closeout の書き方を変え（D-101）、AGENTS の Workspace Access と MANUAL §5.4 を今の運用に合わせ、使われない profiles・evals を削った。[archive](archive/plans/2026-09-30-harness-small-cleanup.md)
- 2026-09-30 [PR #130](https://github.com/kosei-w90607/inventory-system-desktop/pull/130) CI の二重を削る（単独の lane、R3）: Draft の PR にも hosted CI が回り、merge の CI 根拠は Ready の後の run の `Merge gate` だけになり、`bash scripts/local-ci.sh full` は任意の道具になった。[archive](archive/plans/2026-09-30-ci-dedup.md)・[Matrix](archive/plans/test-matrices/2026-09-30-ci-dedup.md)
- 2026-09-30 [PR #127](https://github.com/kosei-w90607/inventory-system-desktop/pull/127)・[PR #128](https://github.com/kosei-w90607/inventory-system-desktop/pull/128) ハーネス刷新 PR5・PR4（R3、並走の 2 本）: PR5 が gate の穴を塞ぎ、PR4 が止める理由を 1 文で言えない手続きを削り R3 の契約の追跡を Contract Ledger の 1 表にまとめた。[archive PR4](archive/plans/2026-09-29-harness-pr4-lightweight.md)・[Matrix](archive/plans/test-matrices/2026-09-29-harness-pr4-lightweight.md)・[archive PR5](archive/plans/2026-09-29-harness-pr5-gate-holes.md)・[Matrix](archive/plans/test-matrices/2026-09-29-harness-pr5-gate-holes.md)
- 2026-09-29 [PR #123](https://github.com/kosei-w90607/inventory-system-desktop/pull/123) ハーネス: 並走の摩擦を削る（単独の lane、R3）: 後続の lane が先行 lane の closeout を待たずに main を取り込んで merge でき、helper は PR の差分が触る active packet で packet を決める。[archive](archive/plans/2026-09-28-harness-parallel-friction.md)・[Matrix](archive/plans/test-matrices/2026-09-28-harness-parallel-friction.md)
- 2026-09-28 [PR #116](https://github.com/kosei-w90607/inventory-system-desktop/pull/116) デザインの決まり runtime lane A: 色と強調の役割を全画面に適用する（wave 14 lane B、R3）: 操作の色を注意・確認の琥珀から分け、進行中の token と危険・失敗の Alert の描き方を全画面に当てた。[archive](archive/plans/2026-09-27-design-color-emphasis.md)・[Matrix](archive/plans/test-matrices/2026-09-27-design-color-emphasis.md)
- 2026-09-28 [PR #118](https://github.com/kosei-w90607/inventory-system-desktop/pull/118) backlog の小口の修正をまとめる（wave 14 lane E、R2）: 部門の絞り込み欄の幅、PLU書出しの日時の表示、`formatDateTime` の置き場などの小口を直した。[archive](archive/plans/2026-09-27-small-fixes-batch.md)
- 2026-09-28 [PR #117](https://github.com/kosei-w90607/inventory-system-desktop/pull/117) ハーネス刷新 PR3: 入口を AGENTS に一本化し、重複した Skill・rules・commands を削る（R3）: 入口を `AGENTS.md` に寄せ、`CLAUDE.md` を import と Claude 固有の補助だけにした（D-093）。[archive](archive/plans/2026-09-25-harness-pr3-entry-and-dedup.md)・[Matrix](archive/plans/test-matrices/2026-09-25-harness-pr3-entry-and-dedup.md)
- 2026-09-28 [PR #114](https://github.com/kosei-w90607/inventory-system-desktop/pull/114) Z001（日計）の全行を日次売上で見る画面と読み出しの契約を設計する（design-first、R3）: 日次売上の「レジ日報（公式）」に日計の表を足す案 A と、同日複数取込みを合算しない規則（D-096）を設計正本に書いた。[archive](archive/plans/2026-09-27-daily-report-z-display.md)・[Matrix](archive/plans/test-matrices/2026-09-27-daily-report-z-display.md)
- 2026-09-28 [PR #113](https://github.com/kosei-w90607/inventory-system-desktop/pull/113) ハーネス刷新 PR2: 座組表を正本に置き、Execution Mode 時代の役割規則を退役させる（R3）: MANUAL に座組表と独立性の規則を置き、旧い役割規則を削った（D-092）。[archive](archive/plans/2026-09-25-harness-pr2-roles-and-formation.md)・[Matrix](archive/plans/test-matrices/2026-09-25-harness-pr2-roles-and-formation.md)
- 2026-09-26 [PR #111](https://github.com/kosei-w90607/inventory-system-desktop/pull/111) 保存と起動の守り（R4）: 商品コードの長さの制限、新しい版の DB の起動拒否、画面に依らない自動バックアップの確認などを入れた。[archive](archive/plans/2026-09-25-save-startup-guards.md)・[Matrix](archive/plans/test-matrices/2026-09-25-save-startup-guards.md)

### Wave Registry

- 形式: 完了済み wave の記録だけを置く。進行中の lane は `docs/plans/` の packet が持つ（D-097）。これより前の完了済み wave の記録は [archive](archive/harness-context/2026-09-14-Plans.md) と [完了履歴](archive/harness-context/2026-09-30-Plans-completed.md) に移送済み。

## ブロッカー

次 lane を止める製品側のblockerはない。単位の拡張の店回答は 2026-09-15 に揃った（POS 数量 1 = 1 m、小数 1 桁で打てる。[聞き取り記録](evidence/hearing-2026-09-14-stock-units.sanitized.md)）。design lane は起票可だが、wave 10 の後に並べる（owner 2026-09-15 合意）。日計（Z001）の表を出す runtime lane は訪店（Issue #105）の後に着手する（owner 決定 2026-09-28、実物の Z001 の行数を見てから作る）。

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
