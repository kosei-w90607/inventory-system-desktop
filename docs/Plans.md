# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

- **マージ検証整理（互換性修正の計画確認）**: [修正Packet](plans/2026-09-14-merge-rules-compatibility.md) / [Matrix](plans/test-matrices/2026-09-14-merge-rules-compatibility.md)。GitHubの既定parameterによるhelperの不一致を、既知の値・型だけ受理する案で解消する。現在はimplementing。ownerがAstra自身で進める担当形と但し書き追加を指示し、追加文言のSonnet限定Plan ReviewもP1/P2なし。D-087に従い同じsessionで実装・検証する。ownerがchange全体の介入上限を12回へ変更し、現在9/12回。再ログイン後のSonnet独立Plan ReviewはP1/P2 stopperなし。P3の明確化とD-087の一貫担当を採用するowner指示を記録。次のowner判断は介入10/12の公開・Ready。実装PR #54 / docs closeout #56は完了し、[旧Packet](archive/plans/2026-09-14-merge-evidence-simplification.md)はarchive済み。[負例PR #57](https://github.com/kosei-w90607/inventory-system-desktop/pull/57) / [成功PR #58](https://github.com/kosei-w90607/inventory-system-desktop/pull/58)のnative試験と一時ruleset/refのcleanupはPASS。本番main/設定は不変で、本番有効化は修正後の別承認。証拠はlocal-only `.local/merge-evidence/activation-20260914/probe/`、本計画のreviewは`.local/merge-rules-compatibility/`。他のP3は既存の後続保持を維持する。
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
