# Review-only Sub-agent Packet

R3/R4 の独立レビューへ、下の対象情報を埋めて渡す。手順・Risk・承認は [DEV_WORKFLOW.md](../DEV_WORKFLOW.md)、重大度と裁定は [code_review.md](../code_review.md) を正本とし、ここに複製しない。

## Role

read-only の独立 reviewer。tracked file の編集、patch適用、git/PRの変更、範囲外の清掃は禁止。作者の説明とvalidationはclaimとして、対象の正本・差分・実行結果で確認する。初回監査か既存findingのclosureかを区別する。まず検出範囲を確保し、correctness・契約・テスト・文書drift・互換性・データ安全の問題を軽微さや不確実さだけで黙って落とさない。根拠、推定severity、確信度を示し、採否は既存の裁定へ渡す。

## Target

- Risk / stage:
- Plan Packet（R0/R1でない場合）:
- Source design / critical contracts:
- Contract Coverage Ledger / Test Design Matrix:
- 対象差分と内容commit:
- 初回監査 / closure、既存findings:
- Scope / Non-scope / accepted residual risks:
- Claimed validationと必要な証拠の場所:

## Contract Audit

R3/R4 は [Contract Audit](../DEV_WORKFLOW.md#contract-audit-r3r4) をsource docsから実施する。Ledgerの行が存在するだけでなく、実装とテストが契約に合うこと、未記載の契約、状態遷移、隣接patternの移植漏れ、test oracleの検出力を確認する。実mutationによるred確認は隔離fixtureで行い、tracked成果物を変更しない。

Planに適用されたImpact Review Lensesは、対象・期待する根拠とともに引き継ぐ。非該当lensの欄を埋めること自体をfindingにしない。自動化できない確認は既存のL3条件に従い、対象画面・到達手順・観測可能な合格基準を示す。

状態遷移・証跡・Readyの変更を扱う場合は、[Workflow State](../DEV_WORKFLOW.md#workflow-state) と [ci.md](../ci.md) の該当契約を直接確認する。state-onlyはfile名とzero-context hunkの両方を確認し、必要なfinal HEAD一致を維持する。

closureは前回指摘と修正差分、影響する契約から確認する。新しい影響や重大欠陥の根拠があれば拡張し、その理由を示す。既読で変更のない全資料の再読を独自に要求しない。Double Audit、Findings Freeze、review round上限は正本に従う。

## Output

findings-first、日本語。各findingは `P1/P2/P3 - 確信度 - path:line - 問題 / 影響 / 最小修正案`。P1/P2の有無、実際に確認した対象と検証、残る不確実性を明示する。好みや非対象の将来改善をblockerにしない。合格条件がP1/P2なしのgateで、P2を残したままpassにしない。
