対象: $ARGUMENTS

対象の振舞いを検証するテストを選んで実行する。Rustは `src-tauri/` から、frontendはrepo rootから実行する。全テストの明示依頼とrepoの必須gateは守る。

失敗は対象仕様と照合し、修正を依頼されていれば原因を直す。結果と残る問題を報告し、全テスト名や件数を別の文書へ転記しない。gateの正本は `docs/DEV_WORKFLOW.md` `Verification Gates` と `docs/ci.md`。

証跡の保存先とhelperは `docs/agent-guidance/merge-evidence.md` のEvidence Modeに従う。実装後state-only/三点一致はlegacyだけで、github modeのreview/manual/R4は専用recordをsingle-writerが更新する。
