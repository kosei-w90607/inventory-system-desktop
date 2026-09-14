# ruleset応答互換性 Test Design Matrix

## Risk

Risk: R3

workflow gate。契約は[MG-D1a](../../../agent-guidance/merge-evidence.md#実応答の既定項目との互換性mg-d1a)、範囲は[packet](../2026-09-14-merge-rules-compatibility.md)。

## Contracts Under Test

MG-D1aの限定した値/型・desired優先・copy、MG-D1/D8の既存保護と共有CLI経路、MG-D11のlegacy移行。

owner追加指示のD-087: Astraの一貫担当、独立レビューと既存のPlan Gate/owner裁定の維持。

## Failure Modes

正常な実応答を拒否する、既定値の名目で弱化/未知fieldを通す、desiredまで変える、statusだけ直してReady/mergeが止まる、dataを破壊する、自己充足fixtureでlive差分が消える。

## Test Matrix

計画時に新規としたtestは実装済み。既存testは`search-safe-files.sh 'rules|policy|bypass' scripts/tests/pr-gate.test.py`で実在を確認した。実行結果はtest logとPR本文を参照する。

| Contract | Failure mode | Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 / MG-D1a | 実応答の正常系を拒否 | CLI regression | 新規 `test_rules_accept_observed_defaults` | desiredと独立の追加fieldを現行比較が拒否する。両方/片方/不在を検証 |
| C2 / MG-D1a | 異なる既定値/型を受理 | CLI negative | 新規 `test_rules_reject_default_value_or_type_drift` | reviewersの非空/null/object/string、approvalのfalse/null/string/0/1を削って通す |
| C3 / MG-D1/D1a | 未知field/既存保護のdriftを受理 | CLI negative | 新規 `test_rules_defaults_preserve_drift_rejection`、既存 `test_rules_reject_strict_false` / `test_rules_reject_bypass` / `test_rules_reject_inactive_enforcement` / `test_rules_reject_parameter_drift` | 互換応答に混ぜた未知field、rule欠落、app/context/strict/identity/conditions/保護のdriftを通す |
| C4 / MG-D1a | desired明示値を無視、入力を破壊 | function + CLI | 新規 `test_rules_keep_explicit_desired_defaults` / `test_rules_leave_inputs_unchanged` | desiredに明示した値も除外、元objectをpopする |
| C5 / MG-D8 | statusだけ直る、main policyを無視 | CLI integration | C1/C2/C3で `status` / `ready` / `merge`、既存 `assert_rules_blocked` | 許可/拒否が共有経路へ届かない、拒否後にgh prを呼ぶ |
| C6 / MG-D11 | 移行契約を先取り | workflow / operation | 既存shared suite / PK5 / legacy full / hosted | 新modeで修正PRを通す、本番承認を先取り |
| C7 / D-087 | 一貫担当を自己承認や無断計画変更へ拡張 | source contract review | 限定Plan Review / Final Double Audit / docと既存workflow suite | Fable分業や非Codex review・Plan Gate・Gated Amendment・owner裁定を緩める |

## State Lifecycle Matrix

応答取得→current mainのdesiredと比較→正常なら次の検査、異常なら操作停止。新規cache/状態保存は作らず、各status/Ready/mergeのfresh取得と既存race負例を維持する。legacyのPlan Gate→実装→独立レビュー→owner Ready→exact HEADのCI→owner merge→docs closeout。本番適用は別判断。

## Adjacent Pattern Audit

`Gate.rules`の呼出は`Gate.status`と`Gate.mutate`（Ready/merge）。`api`と`Gate.contents`は読取境界として確認。別のruleset matcherは作らない。CI評価器/record/manual再利用/PK5/製品コードは非接触。既存CLI fixtureはdesiredとdetailを同じpolicyから作るため、新しい応答fieldだけは独立literalで注入する。

## Negative Paths

必須rule/parameter欠落、unknown parameter、非空reviewers、true以外や数値1、desired明示値不一致、追加defaultsと既存driftの混在。元のbypass/strict/inactive/name/target/conditions/check app/context・通信失敗を保持する。`assert_rules_blocked`でReady/mergeのgh pr呼出なしまで検証する。

## Boundary Checks

JSON配列の空/非空、boolean/number/string/null/object、既知fieldの不在/存在、desired側の未指定/明示を分ける。応答のrules配列順序変更は従来どおり拒否し、コピーだけを処理する。required checksのcontext/app/strictや他の保護を既定fieldと誤認しない。

## Compatibility Checks

旧形式・実測新形式・片方だけの追加を受理する。tracked fixtureには追加項目の値・型だけを独立literalで注入し、raw応答のprobe固有metadataは移さない。任意の将来形式への互換性は約束しない。送信payloadを変更しないのでnative probeのpolicyは変わらない。保存応答全体のreplayはignored localの別経路で行い、実装後の通過を確認する。

## Data Safety Checks

tracked fixtureは既存の合成repo/PRと設定形のみ。raw APIのID/URL/authorやvendor session情報は移さない。log/replay driver/実mutation用copyはignored local-only。GitHub設定の書込みとmain/ref変更はテストから行わない。

## Main Wiring / Integration Checks

`pr-gate.test.py`の既存fake ghを使い、statusのblocker、Ready/mergeのexit、実際の`gh pr`呼出の有無まで検証する。desiredはmain contents、detailは別objectの応答として与える。copyの不変確認は実`Gate.rules`の呼出前後で行う。

## Mutation-style Adequacy Questions

無変更copyで対象testがGREENであることを確認してから、値/型検査を外すmutationを注入する。C2の非空/null/数値1がREDになることを確認する。未知fieldも削るmutationではC3、desiredまで除外するmutationではC4が失敗するかを確認する。元runtimeやtracked testをmutationで変更しない。回数・所要時間は未実測。

## Residual Test Gaps

未公開fieldの一般的な意味や送信契約は保証しない。今回扱うのはnative試験が成功した設定に追加された固定の応答値だけ。設定は未有効であり、保存応答の通過をproduction read-backと呼ばない。本番有効化後、旧closeout/修正closeoutの適切なPRに対するhelper statusで実応答との整合を確認する。必要な保護を変えた場合は既存native証拠の流用をやめ、改めて具体的な試験判断を受ける。
