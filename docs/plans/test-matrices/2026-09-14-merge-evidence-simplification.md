# マージ検証整理 Test Design Matrix

## Risk

Risk: R3

## Contracts Under Test

[MG-D1〜D12](../../agent-guidance/merge-evidence.md)。同じ対象版の必要な検証と独立性を守り、手転記・実装後の状態commitをなくす。

## Failure Modes

古いgreen、Draftのskip、必要job欠落、別app/別workflowの成功、分類欠落、review後のhead/base変更、古いmanual承認、PR記録の衝突、offline cacheの誤用、保護先行の閉塞、legacyの無断読み替え、docs closeoutの再帰。

## Test Matrix

| Contract | Failure mode | Type | Test target | Would fail if... |
|---|---|---|---|---|
| MG-D1/D11 | native保護不足 | fixture + live | pr-gate.test.py / activation probe | context/app/strict/PR要件不足を通す |
| MG-D2 | false green | shell unit | merge-gate.test.sh（新規） | 必要jobのfailed/cancelled/skipped/missing/unknownが0になる |
| MG-D3 | Draft→Readyの穴 | YAML + live | ci-workflow.test.sh | Draftがrequired名を成功/skipで発行する |
| MG-D3/D4 | docsだけで全量/必要policy検証抜け | classification | classify-changes.test.sh | docsとpolicy/実行codeを同じ免除にする |
| MG-D4/D7 | localから移した検証が消える | integration | run-workflow-tests.sh / ci-workflow.test.sh / local-ci.test.sh | registryにある必要testがhostedから呼ばれない |
| MG-D5/D10 | 旧/新schema混同 | contract | doc-consistency-plan-packet.test.sh / workflow-git-checks.test.sh | 未知modeをlegacy扱い、不足fieldを許す、Plan Commitを変更する |
| MG-D6 | 記録の誤結合 | HTTP fixture | pr-gate.test.py（新規） | author違い/複数record/古いhead/base/改版時manual継承を許す |
| MG-D8 | merge時race/通信失敗 | CLI integration | pr-gate.test.py | 確認後pushで別HEADをmerge、API失敗からsuccessを作る |
| MG-D7/D8 | owner/manualの省略 | state | pr-gate.test.py | review/required manual/R4が未了でReadyできる |
| MG-D9 | docs closeout閉塞/再帰 | integration + live | docs-only fixture PR | docs check成功後も必須checkが永続pending、次のcloseoutを要求する |
| MG-D12 | 出力と副作用の膨張 | CLI | pr-gate.test.py / operation observation | statusがwriteし、正常系で全ログdumpやtracked更新を要する |

既存testファイルは`rg --files scripts/tests`で確認済み。新規と記したものは未実装で、現在のcoverageとして数えない。

## State Lifecycle Matrix

| Subject | Initial/pending | Success | Invalidate / restart | Failure / retry | Evidence |
|---|---|---|---|---|---|
| legacy bootstrap | 旧Plan Gate/実装 | 旧L1/review/Ready/三点一致でmerge | 内容変更は旧backtrack | 旧gateを維持して是正 | 現行fixture + bootstrap PR |
| new plan | markerとpre-implementation phase | 独立Plan Review→実装 | 契約変更は再設計/再review | 不備はfail-closed | PK4/PK5 |
| review capture | clean local=PR head/base | 不変ならrecord可能 | head/base/local変更でstale | 再capture・影響範囲closure | API fixture |
| new Draft | review未了 | review/manual充足→human-confirm | 新版で古い結果は無効 | ownerの必要判断へ | CLI/record |
| Ready | owner指示、必要結果充足 | 現版CI成功→merge候補 | 新pushは新gate必要 | failure/skip欠落はmerge拒否 | CI/API |
| merge | fresh head/base/rules/checks | match-head merge成功 | head/baseが動けば拒否 | 勝手に再実行やadminへfallbackしない | race fixture |
| offline | last observationあり | online再取得後だけgate判断 | cacheは表示に限定 | local作業は継続、mergeは停止 | HTTP failure |
| rollout | CI/helper完成、legacy有効 | owner承認→実効rules確認 | 設定driftは停止 | 保護を残して修正、rollbackは別承認 | live read-back |
| closeout | merged parent | docs PRでarchive | main更新は通常の再同期 | closeout自身を再帰生成しない | docs-only PR |

## Adjacent Pattern Audit

CI/分類の全consumer、PK4/PK5、local/pre-push、AGENTS/CLAUDE、workflow-start/implementation/code-review/pr-review、各template、CI/Workflow/AOM/profile、Windows/manual引継ぎを検索する。legacyとarchiveの説明を残す理由を明示し、通常新modeへ旧三点一致/state-onlyを漏らさない。global Skillsはこの変更で編集せず、repoの正本参照を優先させる。

## Negative Paths

- Missing: PR、必要job、分類key、record、evidence、packet field。
- Invalid: JSON、mode/status、full SHA、repo識別、PR番号、特殊文字。
- Ambiguous: 同一ownerの複数marker、別branch/PRへのcapture、local/remote不一致。
- Permission/network: 403/404/timeout/rate limit、comment更新失敗、rules不足。既知のcacheからsuccessへ補完しない。
- Side effects: statusはread-only、captureはlocalだけ、recordは専用commentだけ、mergeは明示したPRだけ。

## Boundary Checks

全area flagのtrue/false/欠落/未知値、必要/不要jobの全status組合せ、同じheadでbaseだけ更新、recordなし/重複、Draft直後/Ready直後、latest run進行中と古いsuccessの同居。PR本文にskip tokenや偽のRisk/成功宣言を書いてもCIの必須範囲を縮めない。Risk/Manual要件は承認されたpacketを正とし、機械が業務的Riskを証明したとは扱わない。

## Compatibility Checks

markerなしlegacyは旧13-field/STATECAPを維持。github modeは新static fieldsとPR状態を使い、未知値は拒否。Plan Commit/Amendmentsは両modeで維持。archiveの古いpacketは変換しない。旧globalレシピと食い違う場合はrepoの正本で判定する。現在のNode pin・npm guard・生成義務・L3/R4手順は不変更。

## Data Safety Checks

合成JSONと一時git repoだけで拒否を再現する。GitHub実験は合成fixtureの検証用refを使い、mainや実店舗データを負例の対象にしない。rulesetは実効設定snapshotと提案差分を読み、owner承認後にだけ適用する。no bypass / no admin fallbackを検査する。

## Main Wiring / Integration Checks

aggregateが全必要jobをneedsに持つこと、workflow suiteをlocal/hosted双方が呼ぶこと、helperがnative stateと専用recordを実際に取得して判定すること、Ready/merge直前のfresh取得とmatch-headが実mutationへ接続していること、実効rulesに正しいcontext/app/strictが入ることを確認する。

## Mutation-style Adequacy Questions

- required jobのsuccess比較を外すとnegativeがREDになるか。
- Draftの名前をMerge gateへ固定するとYAML/live検査が失敗するか。
- classifierのpolicy経路をdocsへ落とすと必要suiteの欠落を検出するか。
- local suiteから1つ取り落とすとparity検査が失敗するか。
- head/base比較、author確認、複数record拒否、manual改版無効化を外すとREDになるか。
- merge直前にheadを更新したHTTP/git fixtureで、別の版がmergeされないか。
- cacheだけでpassを返す、statusで書く、通常のPR本文を書き換えるmutantを検出するか。

実注入は一時コピーに限る。静的に「そうなりそう」と説明するだけをmutation実行の代用にしない。

## Residual Test Gaps

live dynamic check名、ruleset拒否、docs PR経路は実装後の有効化前に確認する。1回の成功で全変更のtoken効果を保証しない。native checkはモデルreviewの独立性や人の承認内容を証明しないため、役割のreviewを維持する。GitHub障害時は新modeのmergeを停止し、旧例外へ自動fallbackしない。
