# 在庫管理システム

Tauri / React / SQLite の単店舗向けアプリ。日本語で応答し、識別子は英語、commit/PR本文は原則日本語にする。

## 共通の入口

[AGENTS.md](AGENTS.md) `Session Start` が唯一の読書ルート。依頼に関係する資料だけを読み、ここに順序やgateを複製しない。進め方の選定には `.agents/skills/inventory-workflow-start/SKILL.md`、実装には `inventory-implementation` を必要時に手順書として使える。`.claude/skills` の既存symlinkは同じSkill本文を共有する。

役割・可用性・独立性は `docs/AGENT_OPERATING_MANUAL.md`、phase・検証・承認は `docs/DEV_WORKFLOW.md` が所有する。writerは自分を承認者にしない。並行編集にはworktree分離か非重複ownershipを使う。

証跡の保存先はEvidence Modeで選ぶ。github modeは [merge-evidence](docs/agent-guidance/merge-evidence.md) のhelperがreview/manual/R4を確認し、GitHubがPR/CIを強制する。直接UI mergeは禁止、CI成功だけでUIがmerge可能と示し得る残存リスクは保持する。legacyの実装後state-only/三点一致を新modeへ持ち込まない。

tracked project hook inventoryは空で、`claude-code-harness`はproject scopeで無効。Plan GateをClaude固有hookで再実装しない。

## Fable 5.1 補助

長いtool作業では開始前と節目に、現在の結果・不確実性・次の行動を短く共有する。独立したtool callはまとめ、最終応答は単独で結果・根拠・未完了事項が分かる形にする。

モデル固有補助は [Anthropicの当該モデル向けガイド](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices) と実際の観測で選ぶ。Astraの特性をClaudeへ転記しない。

## Sonnet / Opus の effort

基本は既存の `.claude/settings.json` の `high`。難問では `xhigh` を選ぶ。見落としを防ぐことを優先し、修正・再試行・再レビューまで含む総tokenで効率を判断する。短い出力や一回の消費だけを理由に `medium` へ下げない。

別セッションの `--effort` もこの方針に合わせる。project設定を読まない `--safe-mode` 等では明示指定し、要求値と取得できた実行metadataを記録する。モデル間で同名effortを同じ思考深度と見なさない。findingの収集と裁定は共通の [review packet](docs/templates/subagent-review-packet.md) に従う。

根拠: owner方針（2026-09-14）、[Sonnet 5 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-sonnet-5#calibrating-effort-and-thinking-depth)、[Opus 5 guide](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/prompting-claude-opus-5)。公式の低effort活用案を、このrepoの既定引下げの許可とは扱わない。

## 再開とmemory

停止時は `Ctrl+C`、別terminalから `claude --resume <session-id>`、再発時は `--fork-session` を検討する。transcript破損が疑われるAPI 400等では新規sessionでAGENTSの該当ルート、対象の現物、直近の引継ぎから再開する。

projectの現在地は `Plans.md`、安定した事実は `docs/project-memory.md`、判断は `docs/decision-log.md` とdesign doc。個人auto-memoryは補助であり、書込みや読取りをgateにしない。主checkoutの既存格納先は `/home/kosei/.claude/projects/-home-kosei-projects-inventory-system-public/memory/`。repo固有の成果物は作業checkoutに保持し、`~/.claude/`等の個人領域へ移さない。

## npm供給網ガード（D-030）

- `.npmrc` の `ignore-scripts=true` と `min-release-age=7` を維持する。CI/再構築は `npm ci --ignore-scripts`。
- 依存追加・更新はpackage/versionを名指しし、`--save-exact`を使う。新規runtime依存はPlan / PRで明示する。lockfile差分をレビューし、PR前に `npm audit --audit-level=high` を確認する。
- `npm audit fix --force`、名指しでない `npm update` / `npm upgrade`、version pinなしの `npx <package>`、install-scriptガードの迂回は禁止。
- `min-release-age-exclude[]` によるcooldown bypassはuserの明示承認が必要。

データ保護、設計確認、テストを不都合だから削除・無効化しない原則はAGENTSと対象の正本に従う。
