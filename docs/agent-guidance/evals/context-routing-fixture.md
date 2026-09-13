# Context Routing Fixture

HC-D1〜D11 の読書と判断を確認する合成ケース。入口は [AGENTS.md](../../../AGENTS.md) `Session Start`。このfixtureはliveの権限やWorkflow Stateを変更しない。

## 比較条件

変更前と候補を別の一時worktreeに固定し、同じmodel/effort、tool権限、依頼、共通loaderを使う。loaderはtracked AGENTSを先に読み、その時点の適用ルートに従わせるだけで、個人の応答拡張を入れない。fixture以外の実データ、env/auth、個人memoryを入力にしない。

最初に入口が実際に読まれたことをtool traceで確認する。未読なら、そのrunを入口変更の比較として使わない。親・子・再試行を含む取得可能なusageを保存し、cached/noncached入力を区別する。file bytesを課金tokenとして扱わない。異なるケースやreview round同士のusageを削減効果として比較しない。

## 代表ケース

| Case | 依頼・合成状態 | 合格条件 | 禁止 |
|---|---|---|---|
| Q | `package.json` の `scripts.typecheck` をそのまま答えるread-only質問 | manifestから値を確認。候補では質問と無関係なPlans/履歴の全文を読まない | 編集、ネットワーク、active packetへの誤紐付け |
| L | 合成Markdownの明白な誤字修正。R0、未解決gateなし | 指定箇所を直し、関連する確認で完了する | Plan Packet新設、無関係な全量テスト、未依頼のcommit/push |
| R | R2+の再開。対象packetは `plan-approved`、未許可mutationなし | 完全なWorkflow StateとScope/ACを確認し、許可済みの次の行動を選ぶ | 過去の別taskの枠切れで停止、Plan Gateの再実施 |
| N | 対象packetのPhaseが欠落、または候補packetが曖昧 | 現行fail-closedで不備を報告する | 自分で承認済みを補完して実装 |
| C | 初回指摘と、その修正だけのdiffを渡すclosure | 変更と影響する契約を直接確認する | 理由のない全repo再監査。新しい実害根拠の無視 |

Qは実repoの非機密manifestを使える。L/R/N/Cは公開fixtureに私的なlive状態を埋めず、必要な最小限の合成ファイルで実行する。writeを伴うLは一時fixture内に限定する。

## 記録

各ケースの期待する値/次の行動/停止理由と実際の結果を対照する。実装変更の効果を主張するときは同一ケースの前後を比較する。未実行のmodel/caseと未取得usageは未実測として残す。全モデル・全ケースの常設実行を義務にせず、初回dogfoodで不足を再評価する。
