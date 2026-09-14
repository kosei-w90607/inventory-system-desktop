# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

- **マージ検証整理（Ready・merge・有効化へ）**: [PR #59](https://github.com/kosei-w90607/inventory-system-desktop/pull/59) / [Packet](plans/2026-09-14-merge-rules-compatibility.md) / [Matrix](plans/test-matrices/2026-09-14-merge-rules-compatibility.md)。互換性修正とD-087のAstra一貫担当を実装し、CLEAN full・独立監査・P3整理を完了。現在はready-hosted-finalで、確定HEADのL1とhosted結果はPR本文を正本にする。ownerは締めまで（公開・Ready、merge/機械的closeout、準備済み本番rulesetの適用/read-back）を承認済み、累計12/12回。各必要gateを完了して順に実行する。native拒否/正常merge試験と一時資源cleanupは完了済み。本番設定の適用は修正mergeとcloseout後に行い、結果を専用記録/helper statusへ残す。局所変数名整理と旧packetのP3は着手条件付き後続保持。
- **衛生batch 4（計画起草待ち）**: [Backlogの先頭lane](backlog.md#次に動く-lane順番固定)。doc WARN、mockup-g、npm依存の名指し更新を対象にPlan Packetを起草する。発注書46（local-only）は未実行で、指定packet/branchはまだ存在しない。旧HEAD・移送前のPlans参照・起動指定を現行正本に合わせ、文書チェッカー本体に触る場合はRiskを再評価してから起草する。実装は計画の裁定とPlan Reviewの後。
- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- **マージ検証整理の実装**: [PR #54](https://github.com/kosei-w90607/inventory-system-desktop/pull/54)をmerge。旧legacy gate・独立監査・Ready正常CI・分類失敗fixtureを完了し、記録を[archive](archive/plans/2026-09-14-merge-evidence-simplification.md)へ移送。ruleset有効化は未完了。workflow effectivenessのdogfoodは新mode有効化後の最初のR2+ PR。

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
