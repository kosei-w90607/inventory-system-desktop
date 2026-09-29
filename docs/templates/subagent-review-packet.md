# Review Packet（Plan Review・Final Review）

R3/R4 の独立レビューへ、下の対象情報を埋めて渡す。手順・Risk・承認は [DEV_WORKFLOW.md](../DEV_WORKFLOW.md)、重大度と裁定は [code_review.md](../code_review.md) を正本とし、ここに複製しない。

## Role

read-only の独立 reviewer。tracked file の編集、patch適用、git/PRの変更、範囲外の清掃は禁止。subagent を起動しない（depth 1）。作者の説明とvalidationはclaimとして、対象の正本・差分・実行結果で確認する。初回監査か既存findingのclosureかを区別する。まず検出範囲を確保し、correctness・契約・テスト・文書drift・互換性・データ安全の問題を軽微さや不確実さだけで黙って落とさない。採否は既存の裁定へ渡す。合格条件がP1/P2なしのgateで、P2を残したままpassにしない。

## Target

- Risk / stage:
- Plan Packet（R0/R1でない場合）:
- Source design / critical contracts:
- Contract Ledger（旧 packet は Contract Coverage Ledger）/ Test Design Matrix:
- 対象差分と内容commit:
- 初回監査 / closure、既存findings:
- Scope / Non-scope / accepted residual risks:
- Claimed validationと必要な証拠の場所:
- 読ませないもの（同じ round で 2 本以上の review を回すときの各 reviewer。Plan Review・Final Review とも、Double Audit を含む）: 他の reviewer の結果が置かれた場所すべて（例: packet の Review Response の段落、PR body、PR の comment / review、Coordinator が保存した local の報告 file、是正 commit の件名・本文）。その発注の本文にも他の reviewer の結果とそれ由来の観点を書かない（closure・是正の発注は前回 findings から始めてよい）。[AGENT_OPERATING_MANUAL.md](../AGENT_OPERATING_MANUAL.md) §3 の独立性の項

## Contract Audit

R3/R4 は [Contract Audit](../DEV_WORKFLOW.md#contract-audit-r3r4) をsource docsから実施する。Ledgerの行が存在するだけでなく、実装とテストが契約に合うこと、未記載の契約、状態遷移、隣接patternの移植漏れ、test oracleの検出力を確認する。実mutationによるred確認は隔離fixtureで行い、tracked成果物を変更しない。

Planに適用されたImpact Review Lensesは、対象・期待する根拠とともに引き継ぐ。非該当lensの欄を埋めること自体をfindingにしない。自動化できない確認は既存のL3条件に従い、対象画面・到達手順・観測可能な合格基準を示す。

状態遷移・証跡・Readyの変更を扱う場合は、[Workflow State](../DEV_WORKFLOW.md#workflow-state) と [ci.md](../ci.md) の該当契約を直接確認する。専用record/head/base・必要broad/closure/manual/R4・実効rules/CIを確認し、廃止済みの SHA 照合を要求しない。

closureは前回指摘と修正差分、影響する契約から確認する。新しい影響や重大欠陥の根拠があれば拡張し、その理由を示す。既読で変更のない全資料の再読を独自に要求しない。Double Audit、Findings Freeze、review round上限は正本に従う。

## Output

findingの書式と重大度は [code_review.md](../code_review.md) の `## Output Shape` と `## Finding Severity` に従う。
