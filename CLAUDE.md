# 在庫管理システム

@AGENTS.md

Tauri / React / SQLite の単店舗向けアプリ。日本語で応答し、識別子は英語、commit/PR本文は原則日本語にする。

## 共通の入口

上で import した `AGENTS.md` の `Session Start` が唯一の読書ルート。依頼に関係する資料だけを読み、ここに順序やgateを複製しない。進め方の選定には `.agents/skills/inventory-workflow-start/SKILL.md`、実装には `inventory-implementation` を必要時に手順書として使える。`.claude/skills` の既存symlinkは同じSkill本文を共有する。

役割・可用性・独立性は `docs/AGENT_OPERATING_MANUAL.md`、phase・検証・承認は `docs/DEV_WORKFLOW.md` が所有する。writerは自分を承認者にしない。並行編集にはworktree分離か非重複ownershipを使う。

tracked project hook inventoryは空で、`claude-code-harness`はproject scopeで無効。Plan GateをClaude固有hookで再実装しない。

## 長い作業の報告

長いtool作業では開始前と節目に、現在の結果・不確実性・次の行動を短く共有する。独立したtool callはまとめ、最終応答は単独で結果・根拠・未完了事項が分かる形にする。

モデル固有補助は [Anthropicの当該モデル向けガイド](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) と実際の観測で選ぶ。Astraの特性をClaudeへ転記しない。

## 座組と effort

座組と effort の既定値は [座組表](docs/AGENT_OPERATING_MANUAL.md#座組) が正本で、ここに値を書かない。`.claude/settings.json` の `effortLevel` は main session の値。project設定を読まない `--safe-mode` 等の別セッションでは effort を明示指定し、要求値と取得できた実行metadataを記録する。

## 再開とmemory

停止時は `Ctrl+C`、別terminalから `claude --resume <session-id>`、再発時は `--fork-session` を検討する。transcript破損が疑われるAPI 400等では新規sessionでAGENTSの該当ルート、対象の現物、直近の引継ぎから再開する。

projectの現在地は `Plans.md`、安定した事実は `docs/project-memory.md`、判断は `docs/decision-log.md` とdesign doc。個人auto-memoryは補助であり、書込みや読取りをgateにしない。repo固有の成果物は作業checkoutに保持し、`~/.claude/`等の個人領域へ移さない。

npm 供給網ガード（D-030）と、データ保護、設計確認、テストを不都合だから削除・無効化しない原則はAGENTSと対象の正本に従う。
