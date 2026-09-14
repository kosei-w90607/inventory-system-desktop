---
description: inventory-systemのビルド・検証コマンドの参照先
paths:
  - "src-tauri/**/*.rs"
  - "src/**/*.{ts,tsx,js,jsx}"
  - "package.json"
  - "Cargo.toml"
---

# コマンド

ビルド・検証は [DEV_WORKFLOW.md](../../docs/DEV_WORKFLOW.md) `Verification Gates` と [ci.md](../../docs/ci.md) の対象範囲に従う。Rustコマンドは `src-tauri/`、frontendはrepo rootで実行する。

依存導入は `CLAUDE.md` の供給網ガードを維持する。環境の前提は [DEV_SETUP_CHECKLIST.md](../../docs/DEV_SETUP_CHECKLIST.md)。ここに別の全量チェック手順を置かない。

証跡の保存先とhelperは `docs/agent-guidance/merge-evidence.md` のEvidence Modeに従う。実装後state-only/三点一致はlegacyだけで、github modeのreview/manual/R4は専用recordをsingle-writerが更新する。
