対象: $ARGUMENTS

依頼された範囲の品質確認を行う。対象と現状は `AGENTS.md` `Session Start`、gateの選択は `docs/DEV_WORKFLOW.md` `Verification Gates` と `docs/ci.md` に従う。merge 前の feedback は push ごとの Draft の hosted の run が担う。全量チェックを明示された場合だけ `bash scripts/local-ci.sh full`（任意）を使う。

修正を伴う依頼なら範囲内の失敗を直して影響する検証を再実行する。review-onlyなら変更せず報告する。結果・失敗・未実施事項を短く示す。
