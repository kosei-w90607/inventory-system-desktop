# ハーネス文脈効率 Test Design Matrix

## Risk

Risk: R3

## Contracts Under Test

[source design HC-D1〜D11](../../harness-context/2026-09-24-context-efficiency.md)。既存の承認/phase/evidence契約とsafe wrapperの拒否境界を維持する。

## Failure Modes

無関係な履歴の全文読込み、R2+の必要gate脱落、closureから無関係な監査再開、未了項目消失、partial readでsecret/外部path漏洩、静的bytesを実token効果として過大主張。

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| HC-D1〜D3 | 読書route再掲/必要gate欠落 | contract + review | scripts/tests/reading-order-drift.test.sh + behavioral cases | 別文書が独立順序を強制、または必要な正本を読まない |
| HC-D4〜D5/HC-D7 | Skill独自gate/他モデル特性混入 | review | independent source/diff audit | human-confirm後だけの追加full/コード一律削除が残る |
| HC-D6 | 未了backlog消失 | data preservation | relocation audit | 移送前archiveの未了項目の本文・未決判断・参照先がlive backlog/明示引継ぎ先に対応せず、全件照合が不一致になる |
| HC-D8 | 範囲指定が本文全部/別pathを返す | CLI integration | scripts/tests/codex-safe-wrappers.test.sh | 選択区間とstdoutが一致しない/拒否すべきpathが読める |
| HC-D8 | 不正入力が通る | negative | same wrapper suite | 空/ゼロ/負数/逆順/非数値/複数file/CRLFを受理する |
| HC-D9〜D11 | 効果/品質の誤判定 | behavioral | read-only question/closure/resume observations | 無許可mutation/未確認gate通過/usage未取得を実測とする |
| Existing gates | 旧plan/CI承認契約が劣化 | regression | workflow-git / plan-packet / local-ci / pre-push tests | 既存invalid状態fixtureがgreenになる |

## State Lifecycle Matrix

対象はresumeの読取り判断。現行Workflow Stateのschema/遷移は変更しない。

| Subject | Initial | Pending | Success | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|
| R2+ resume | Plansから対象識別 | 完全なstate/該当契約を読む | 次の許可済み作業へ | missing/ambiguous/malformedは停止 | 正しいstateから再開 | model/source audit |
| closure | findingsと修正差分 | 影響する正本を確認 | closure報告 | 新しい影響/重要欠陥で拡張 | affected checks | model/source audit |
| content→human-confirm→Ready | existing gate | existing evidence | owner Ready後のfinal HEAD | 既存fail-closed | existing backtrack | preserved regression suite |

## Adjacent Pattern Audit

入口: AGENTS / CLAUDE / agent-guidance / workflow Skills / Claude rules/commands / profile/manual / review templates。safe wrapperのpath安全は既存read/list/searchの共通パターンを維持し、readの部分読みにだけ同じ判定を適用する。list/searchの権限拡張は非該当。

## Negative Paths

- missing input: wrapper用法error。
- invalid input: 不正rangeは非0。readの先頭以外の `--lines`、未知の `--flag`、list/searchのoption風pathは既存どおり拒否する（codex-safe-wrappers.test.shの負例）。
- ambiguous input: range指定時の複数path拒否。packet曖昧性は現行停止。
- unknown reference: file不存在とsource不明を推測で補わない。
- permission failure: external/sensitive/symlink逃避拒否。
- dry-run side effect: read-only model caseはwrite toolを持たず、local fixture外へのmutation不可。

## Boundary Checks

正整数の閉区間、単一行、EOF超過、空file、旧複数file形式。数値比較失敗も非0で終了。stdoutは本文、stderrは診断。JSON/DB/DTO/encodingのproduct契約は非接触。

## Compatibility Checks

既存read-safe-fileのpath呼出し、symlink正規化、拒否コード、外部Skillはdirect narrow readという境界を維持。既存packet/state/CI fixtureは合格条件不変更。

## Data Safety Checks

synthetic fixtureのみ。モデル比較の出力はignored `.local/`。POS/DB/env/auth/個人memoryの内容を評価へ投入しない。

## Main Wiring / Integration Checks

AGENTS→必要な文書→Skill→state/CI参照の実到達を確認。read範囲指定を実wrapperに通す。CLIの版差を検証しないまま新機能へ依存しない。

## Mutation-style Adequacy Questions

- range filterを外した場合、stdout assertionがredになるか。
- sensitive/path containment guardを外した場合、既存negative fixtureがredになるか。
- malformed Workflow Stateを正常扱いした場合、既存fixture/model判断が拒否するか。
- 未了backlogの行を落とした場合、移送対照で発見できるか。

実注入は隔離fixture/一時コピー上で実行し、元worktreeの成果物を破壊しない。

## Residual Test Gaps

モデル比較は代表ケースであり全作業の保証ではない。token削減率、全harnessの実効設定、全modelの後続実装品質は未実測。gate/entryの初回dogfoodで再評価する。測定回数・tokenなどの実績はPR本文/ignored evidenceに置く。
