---
description: inventory-systemの実装境界と失敗時の保護
paths:
  - "src-tauri/**/*.rs"
  - "src/**/*.{ts,tsx,js,jsx}"
---

# 実装品質

対象の設計正本と既存コードを読み、`UI -> CMD -> BIZ -> IO/MNT` を維持する。読書範囲は [AGENTS.md](../../AGENTS.md) `Session Start`、検証は [DEV_WORKFLOW.md](../../docs/DEV_WORKFLOW.md) `Verification Gates` と [ci.md](../../docs/ci.md) に従う。TypeScriptの変更に一律のRust検証を追加しない。

- 本番に `todo!()` / `unimplemented!()` や `unwrap()` を残さない（テストは例外）。
- `Result` を握りつぶさない。継続可能な補助ファイル操作の失敗も `tracing::warn!` 等で記録する。
- filesystem の `NotFound`（未作成）とpermission/IO errorを区別し、後者を空結果の成功へ変換しない。
- エラー型と利用者向け文言は対象のfunction designに従い、ここに型定義を複写しない。

証跡の保存先とhelperは `docs/agent-guidance/merge-evidence.md` のEvidence Modeに従う。実装後state-only/三点一致はlegacyだけで、github modeのreview/manual/R4は専用recordをsingle-writerが更新する。
