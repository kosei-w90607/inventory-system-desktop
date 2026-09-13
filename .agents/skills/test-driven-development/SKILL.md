---
name: test-driven-development
description: Add a meaningful failing regression or behavior test before implementing a feature or bug fix. Use when behavior changes require executable checks.
---

# Test-Driven Development

変更する振舞いと、壊れた実装を検出する最小のテストを決める。repo の仕様、Risk、必須 gate が優先される。

1. 正しい理由で失敗するテストを実行する。コンパイルエラー、無関係な環境故障、mock の設定ミスを振舞いの失敗と取り違えない。
2. 既存の実装・標準機能を使って最小限の修正を行い、対象テストを通す。
3. 必要なら整理し、影響するテストとrepoが要求する最終確認を実行する。

テストは利用者に見える値、状態遷移、境界、失敗時の保護を検証する。実装と同じ式を期待値へ複写したり、mock の返り値だけを確認したりしない。mock を使う設計で不明点があれば [testing anti-patterns](testing-anti-patterns.md) を参照する。

設定・文書・生成物・振舞い不変の整理には、変更に合った構文検証、差分、既存テストを選ぶ。意味のないテストを増やさず、repoの必須検証は維持する。先にコードが書かれていても一律に削除せず、信頼できる回帰検証を補い、未確認事項を報告する。

既存テストを不都合だから削除・無効化・弱体化しない。誤ったテストは設計正本との不一致を確認し、理由を示して修正する。反復は新しい変更・失敗・未解決懸念に対応する範囲で行う。
