---
description: inventory-systemの回帰テストと検証根拠
paths:
  - "src-tauri/**/*.rs"
---

# テスト品質

振舞いの変更と同時に、その失敗を検出するテストを用意する。要件・仕様IDはテスト名またはコメントで追跡できるようにする。mockと実装が同じ誤りを繰り返してgreenにならないよう、期待値を設計正本から導く。

不都合なテストの削除・無効化・assert弱体化で通過させない。失敗時は仕様と照合し、実装かテストの誤っている側を理由付きで直す。

実行範囲と最終gateは [DEV_WORKFLOW.md](../../docs/DEV_WORKFLOW.md) `Verification Gates` が所有する。新規テストごとの一律full実行や、結果件数の全文転記を追加しない。
