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
