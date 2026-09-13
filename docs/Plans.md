# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

- **ハーネス文脈効率（R3、implementing）**: [Plan Packet](plans/2026-09-13-harness-context-efficiency.md) / [Matrix](plans/test-matrices/2026-09-13-harness-context-efficiency.md)。専用 branch `codex/harness-context-efficiency`、Codex 起草・owner裁定。条件付き読書と重複手順を実装し、既存gateは維持。reviewのeffort引下げを是正し、Plan契約も含め独立Final Reviewで再確認する。
- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。ハーネス変更へ便乗して製品の採否を変えない。

### Wave Registry

現在のbranchでは並列waveなし。完了済みwaveの記録はarchiveへ移送済み。新しいwaveを開始する場合は DEV_WORKFLOW の登録・選択条件に従う。

## ブロッカー

ハーネス整備は実装済み。旧Plan/Final Reviewのmediumによるpassは通過根拠を保留し、適切なeffortでの是正検証までphaseを前進させない。Ready/mergeはowner判断が残る。

旧「Codex枠切れ」の待機記録に対応するPRは旧dashboardの完了欄にmerge済みと記録されているためarchiveへ移送した。将来の可用性はその時点で確認し、過去の待機記録を新しい作業へ適用しない。

## 製品の未決判断

以下は製品側のowner判断待ち。ハーネス整備の実装・検証を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-4 明細数 summary の要否: run 3 原文 (h)「削ってよい」↔ 今回「手動販売出庫は残す方が良さそうに思うが何とも言えず」で食い違う → 未決（owner 再判断待ち）
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数 summary 未決）・L8-5（記録日時 font 差、④ C5 追跡中）は対象外（参照のみ）

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
