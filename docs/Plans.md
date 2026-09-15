# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

- **㉑ フィルタ Label 上置き + 見出し 2 段の runtime lane（R3、implementing）**: [Plan Packet](plans/2026-09-15-filter-label-top-runtime.md) / [Matrix](plans/test-matrices/2026-09-15-filter-label-top-runtime.md)。branch `agent/filter-label-top-runtime`、Plan Commit `c5b1ea2b`（Plan Review 3 round、Sonnet + Opus）。次 = Codex 実装（発注書 49）→ Final Review → owner L3 抜き取り 4 画面 → Ready → merge。wave 10 の先頭 lane。
- **㉒ 表示小修正 batch 2（R2、stacked）**: ㉑ の branch 上に stack する後続 lane（[Backlogの該当行](backlog.md#次に動く-lane順番固定)）。packet は ㉑ の plan-first commit の後に起草し、実装は ㉑ の Plan Gate 後。㉑ merge 後に `origin/main` 単段 merge で base を付け替える（D-074）。
- **㉒ 表示小修正 batch 2（R2、stacked、plan-gate）**: [Plan Packet](plans/2026-09-15-display-fixes-batch-2.md) / [Matrix](plans/test-matrices/2026-09-15-display-fixes-batch-2.md)。branch `agent/display-fixes-batch-2`（㉑ の plan-first commit `a2e01334` 起点）。Plan Review 3 round 通過（Plan Commit `68fa5915`）。次 = ㉑ の実装 HEAD へ stack → implementing 遷移 → Codex 実装。㉑ merge 後に `origin/main` 単段 merge で base を付け替える（D-074）。
- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- **衛生batch 4**: [PR #61](https://github.com/kosei-w90607/inventory-system-desktop/pull/61)をmerge。doc-consistency WARN 5件掃除・mockup-gの`:has()`是正・npm名指し更新（js-yaml/vitest実更新、smol-toml override）を実施し、[archive packet](archive/plans/2026-09-14-hygiene-batch-4-doc-warn-deps.md)へ移送した。Dependabotのopen alertは0件、Final ReviewはSonnet + Opusの独立2パスで完了（P3 4件はbacklog「記録目的」へ）。relay往復は5/上限2を超過、原因はCoordinator側の発注品質3回で、Writerは毎回fail-closedで正しく停止した。workflow effectivenessのdogfood所見: 実装後のstate-only commit 0件でDraft→record→Ready→mergeがhelperのみで完結／Gated AmendmentはCoordinatorのcontent commit + 登録commitの2 commit構成／fresh worktreeでvitestを回す前に`npm run generate:routes`が必要／`codex exec -o`の報告fileが未更新のケースがありlogから回収した。次のdogfood targetはフィルタLabel上置きruntime laneでのclosure recordとmanual（L3）record。

- **マージ検証整理と互換性修正**: [PR #54](https://github.com/kosei-w90607/inventory-system-desktop/pull/54) / [PR #59](https://github.com/kosei-w90607/inventory-system-desktop/pull/59)をmerge。GitHubの既定項目を扱うhelperとD-087のAstra一貫担当を導入し、[修正Packet](archive/plans/2026-09-14-merge-rules-compatibility.md) / [Matrix](archive/plans/test-matrices/2026-09-14-merge-rules-compatibility.md)をarchiveへ移した。CI・独立監査・native拒否/正常merge試験・一時資源cleanupを完了。本番保護の現在の有効化事実は、[PR #59](https://github.com/kosei-w90607/inventory-system-desktop/pull/59)の専用記録とhelper statusを参照する。ownerは締めまで承認済み、累計12/12回。局所変数名整理と旧packetのP3は着手条件付き後続保持。workflow effectivenessのdogfoodは新mode有効化後の最初のR2+ PR。

- **ハーネス文脈効率**: [PR #52](https://github.com/kosei-w90607/inventory-system-desktop/pull/52) をmergeし、[Plan Packet](archive/plans/2026-09-13-harness-context-efficiency.md) / [Matrix](archive/plans/test-matrices/2026-09-13-harness-context-efficiency.md) をarchiveへ移した。必要な読書と保護規定を両立させ、L1/hosted/独立reviewを完了。後続P3と未実測はPRに保持し、次のR2+作業でdogfoodする。

### Wave Registry

- 形式: 現 wave ごとに status / lane 数 / merge train 順序を置き、各 lane に是正単位、branch、active packet link、Draft PR、Workflow State Phase、owner 介入回数を記録する。完了済み wave の記録は [archive](archive/harness-context/2026-09-14-Plans.md) に移送済み。
- **wave 10（stacked train 2 lane、owner 2026-09-15「次の行動二つとって並走」）: 進行中** — 非干渉 wave の条件（file footprint 互いに素 / 同じ source document を編集しない）を `src/features/stock-inquiry/StockInquiryPage.tsx` と `docs/design-system/02-component-catalog.md` の共有で満たさないため、D-074 の stacked train を採る。merge train = ㉑ → ㉒ 固定。
  - lane 1: ㉑ フィルタ Label 上置き + 見出し 2 段の runtime（R3、`agent/filter-label-top-runtime`、[Packet](plans/2026-09-15-filter-label-top-runtime.md)、Draft PR 未作成、Phase implementing〈Plan Commit `c5b1ea2b`、Plan Review 3 round〉、介入 0/4）
  - lane 2: ㉒ 表示小修正 batch 2（R2、`agent/display-fixes-batch-2`、lane 1 の plan-first commit `a2e01334` を base に stack、[Packet](plans/2026-09-15-display-fixes-batch-2.md) / [Matrix](plans/test-matrices/2026-09-15-display-fixes-batch-2.md)、Draft PR 未作成、Phase plan-approved〈Plan Commit `68fa5915`、Plan Review 3 round〉、介入 0/3）

## ブロッカー

wave 10 の 2 lane を止める製品側のblockerはない。単位の拡張の店回答は 2026-09-15 に揃った（POS 数量 1 = 1 m、小数 1 桁で打てる。[聞き取り記録](evidence/hearing-2026-09-14-stock-units.sanitized.md)）。design lane は起票可だが、wave 10 の後に並べる（owner 2026-09-15 合意）。

## 製品の未決判断

L8-4は owner 決定済み（下記参照）。L8-2/L8-5は旧⑩laneからの記録・実機観測の申し送りで、判断待ちではない。いずれもハーネス整備を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-4 明細数列は owner 決定 2026-09-15 で (a) 撤去。runtime 反映は Backlog の表示小修正 batch 2 に同乗。
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数列 撤去決定）・L8-5（記録日時 font 差、④ C5 追跡中）は対象外（参照のみ）

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
