# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

- **衛生batch 4（plan-draft、R2）**: [Plan Packet](plans/2026-09-14-hygiene-batch-4-doc-warn-deps.md)。doc WARN・mockup-g・npm 名指し更新を対象に起草済み。Coordinator 裁定と独立 Plan Review 後に別 run で実装する。
- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- **マージ検証整理と互換性修正**: [PR #54](https://github.com/kosei-w90607/inventory-system-desktop/pull/54) / [PR #59](https://github.com/kosei-w90607/inventory-system-desktop/pull/59)をmerge。GitHubの既定項目を扱うhelperとD-087のAstra一貫担当を導入し、[修正Packet](archive/plans/2026-09-14-merge-rules-compatibility.md) / [Matrix](archive/plans/test-matrices/2026-09-14-merge-rules-compatibility.md)をarchiveへ移した。CI・独立監査・native拒否/正常merge試験・一時資源cleanupを完了。本番保護の現在の有効化事実は、[PR #59](https://github.com/kosei-w90607/inventory-system-desktop/pull/59)の専用記録とhelper statusを参照する。ownerは締めまで承認済み、累計12/12回。局所変数名整理と旧packetのP3は着手条件付き後続保持。workflow effectivenessのdogfoodは新mode有効化後の最初のR2+ PR。

- **ハーネス文脈効率**: [PR #52](https://github.com/kosei-w90607/inventory-system-desktop/pull/52) をmergeし、[Plan Packet](archive/plans/2026-09-13-harness-context-efficiency.md) / [Matrix](archive/plans/test-matrices/2026-09-13-harness-context-efficiency.md) をarchiveへ移した。必要な読書と保護規定を両立させ、L1/hosted/独立reviewを完了。後続P3と未実測はPRに保持し、次のR2+作業でdogfoodする。

### Wave Registry

現在のbranchでは並列waveなし。完了済みwaveの記録はarchiveへ移送済み。新しいwaveを開始する場合は DEV_WORKFLOW の登録・選択条件に従う。

## ブロッカー

衛生batch 4を止める製品側のblockerはない。単位の拡張は、店へ送付したPOS数量の打ち方の返答待ち（2026-09-14）。返答前に当該design laneへ着手しない。聞き取り記録と最新状態はBacklogへ引き継いだ。

## 製品の未決判断

L8-4は製品側のowner判断待ち。L8-2/L8-5は旧⑩laneからの記録・実機観測の申し送りで、同じ判断待ちではない。いずれもハーネス整備を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-4 明細数 summary の要否: run 3 原文 (h)「削ってよい」↔ 今回「手動販売出庫は残す方が良さそうに思うが何とも言えず」で食い違う → 未決（owner 再判断待ち）
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数 summary 未決）・L8-5（記録日時 font 差、④ C5 追跡中）は対象外（参照のみ）

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
