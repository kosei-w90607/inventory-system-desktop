# Codex / OpenAI Agent Guidance

仕事の入口と権限は [AGENTS.md](../../AGENTS.md#session-start)。このディレクトリはモデル補助を確認・調整するときに読む。通常の質問や既知の作業で毎回全ファイルを読み直す必要はない。

- [Shared Contract](shared.md): 共通契約との接続と指示競合の扱い。
- profile は用途別: [frontier](profiles/frontier.md)、[balanced](profiles/balanced.md)、[high-throughput](profiles/high-throughput.md)。未指定は frontier。model や承認権限の指定ではない。
- [モデル差分メモ](model-notes.md): 明示された実モデルに合う補助だけを使う。未知モデルへ別世代の性質を転記しない。
- [文脈効率の設計](context-efficiency.md): 条件付き参照の理由と検証境界。

## Model updates

モデル選択は [.codex/README.md](../../.codex/README.md) の config / 一時指定が所有する。モデル更新時は対象・確認日・公式根拠を確認し、観測された不足にだけ補助を追加する。Astra の助言を Sol や Claude の実測済み特性として扱わない。

個人の応答スタイルは ignored `AGENTS.override.md`。override は tracked AGENTS をロードしてから適用し、共通の権限や gate を上書きしない。

比較は [Decision Gate Fixture](evals/decision-gate-fixture.md) と [Context Routing Fixture](evals/context-routing-fixture.md) を使う。個人拡張・会話全文・実測ログはlocal-only。文字数の削減と実モデルのtoken・判断結果を区別する。

出典: [OpenAI AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)、[Skills and prompts](https://developers.openai.com/blog/rethinking-skills-and-prompts-for-gpt-6-astra)。
