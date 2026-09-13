対象phase: $ARGUMENTS

`AGENTS.md` `Session Start` から現在の対象を確認し、`docs/DEV_WORKFLOW.md` の現在phaseの完了条件と `docs/ci.md` の必須検証を照合する。

完了根拠、残る失敗、未実施gate、次の行動を報告する。既存の検証根拠を確認し、同じ全量チェックや全テスト/REQ一覧の再出力を追加しない。phase前進・Ready・mergeは既存の権限と証拠の条件に従う。

証跡の保存先とhelperは `docs/agent-guidance/merge-evidence.md` のEvidence Modeに従う。実装後state-only/三点一致はlegacyだけで、github modeのreview/manual/R4は専用recordをsingle-writerが更新する。
