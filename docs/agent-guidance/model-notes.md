# モデル差分メモ

公式確認日: 2026-09-25。実モデルが明示された場合だけ該当する補助を使う。設定によるモデル選択や、repositoryでの性能改善の実測結果ではない。

## Effort の選定

Claude 側・Codex 側とも、effort の値と決定日は [AGENT_OPERATING_MANUAL の座組](../AGENT_OPERATING_MANUAL.md#座組) の effort 列が持ち、ここには書かない。選択理由と取得できたusage/実効metadataを残し、未取得は未実測とする。

## GPT-6 Astra

`gpt-6-astra` は指示競合による停止や検証の膨張に注意する。新しい一律の注意書きを増やす前に、重複するSkill・曖昧な承認境界・不要な反復指示を整理する。目的と完了条件を明確にし、許可済み作業を完遂する。必要な独立レビューは維持する。

根拠: [Skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)、[Prompting best practices](https://developers.openai.com/api/docs/guides/latest-model#prompting-best-practices)。

## GPT-6 Sol と未知のモデル

共通契約と用途別profileを使う。今回の整理では、Solだけに長い旧手順を残す根拠は未実測。共通の短い依頼で不足が観測された箇所にだけ補助を追加する。Astra向けの傾向を自動継承しない。SolのeffortはAstraと同じ選び方へ機械的に揃えない。過去のSolのeffort比較はその設定での観測に限り、通常運用への推奨や品質保証にしない。

## Claude Code との共有境界

共有workflowの契約は同じ。Claudeのモデル補助は `CLAUDE.md` とAnthropicの当該モデル向けガイドを参照する。CLIの設定とAPI専用パラメータを混同しない。

根拠: [Claude Code best practices](https://code.claude.com/docs/en/best-practices)、[Claude model-specific prompting](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)。
