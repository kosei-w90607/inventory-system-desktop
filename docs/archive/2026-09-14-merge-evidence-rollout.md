# merge-evidence の移行・有効化記録
出典: docs/agent-guidance/merge-evidence.md（SPEC-MERGE-EVIDENCE、2026-09-14）。移送日: 2026-09-24。現行契約は [merge-evidence](../agent-guidance/merge-evidence.md) が所有し、本書は履歴として変更しない。

## 移行・運用・復旧

1. この整備は明示legacy markerと現行13-field/三点一致/Double Auditを使う。実装と検証を完了するまで旧gateを外さず、外部設定は有効化承認後にだけ変更する。
2. classifier・aggregate・hosted PK5/suite・helper・新旧packet検査を実装する。markerなしactive packetを新運用へ持ち込まず、archiveは一括変換しない。
3. bootstrap PR上でDraftの名前とReady full経路を確認する。分類job failureでaggregateがskippedでなくfailureになる負例は、候補CI定義を持つbase=main、head=bootstrap候補から分けた合成fixture branchのPR（mainへmergeせずclose）で確認する。このPRの作成・closeはbootstrap Ready時に具体的対象を提示してowner承認を得る操作範囲に含め、実装開始承認では実行しない。この時点ではdocs-only経路を実証したとしない。
4. bootstrap PRを旧gateでmergeする。続いてmain向けdocs-onlyのcloseout/fixture PRを作り、新CIでdocs（PK5含む）＋aggregateが通り、Rust/frontendが走らないことを確認してbootstrapをarchiveする。この移行PRだけはまだ旧manual gateで扱う。CI変更の差分が混じるPRをdocs-only証拠にしない。
5. 完成したpayloadと検証用ref/ruleset（作成・テストPRのmerge/close・削除を含む）およびproduction適用の範囲をownerへ提示する。承認後に同一rulesの検証用refで拒否を確認する。docsのpositive controlはstep 4の成功headとその検証時baseを使う。probe targetへのPR eventはbranches filterで起動しないため、そこから新CIが走ると仮定しない。
6. mainとopen PRに未完了legacy作業がないことを確認し、production rulesを有効化してread-backする。新templateはbootstrapで配布するが、新modeのReady/mergeは保護確認まで利用不可。sourceは「条件成立時に新modeを適用」という文面でbootstrapに含め、有効化事実は専用comment/ignored evidence/helper statusへ置く。有効化後にpolicy正本をR0で変更する必要を作らない。
7. 以後のdocs/closeoutは軽いPR経路。先行closeoutのmergeを後続PRのbase同期より先に行い、squash後の古いpacketがPK5を止める期間を持ち越さない。旧無条件state-only/三点一致/direct-main-closeoutの説明はlegacy/移行の範囲に限定する。

## 測定と実装時の判断基準

通常の新modeでSHA手転記0回、実装後のstate-only commit0件は規範の目標値。実測済みという意味ではない。実装変更、base同期による影響確認、失敗、manual試験の改版以外でfullやreviewを繰り返さない。base同期の確認は上記のclosure/適用判断に限定する。境界が曖昧なら必要な検出力を優先し、全md除外・弱いreviewer・不都合なテスト削除で帳尻を合わせない。

旧PR #52と同じ問題規模を再現できない場合、token削減率を作らない。正常merge、docs closeout、stale head、CI failureの同じfixtureで、AIが読む出力、手作業の記録、不要な再実行の有無を比較する。独立reviewの費用と機械処理の費用を分ける。

## 公式根拠とprobe

2026-09-14確認。現repoはpublic/admin可、main protected=false、適用rules=[]、既存CI checkのappはgithub-actions/15368。取得コマンドと出力はPlan PacketのContract Probeとignored evidenceに記録する。

- [Required status checks / skippedの扱い](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [RulesetsのPR要件と承認数](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [job name/ifのcontext](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [Rules API](https://docs.github.com/en/rest/repos/rules)
- [GitHub CLI merge](https://cli.github.com/manual/gh_pr_merge)

dynamic check名が期待と違う場合の予備案は、Draftでもaggregateを起動し、同じrequired名では必ずfailureを返す形（軽いrunnerが必要になる）とする。Draftでrequired成功/skipを返す案は採らず、予備案の採用と運用コストはownerへ示してから有効化する。

dynamic check名・rulesetの実効拒否・通信競合は実装後の有効化前dogfoodが必要で、現在のread-only調査で実証済みとはしない。GitHub公式契約とlocal fixtureで設計を検証し、live確認を有効化の前提にする。

## 実行手順と有効化payload

有効化のレビュー対象は [desired payload](../../.github/merge-gate-ruleset.json)。helperは適用コマンドを内包しない。次のread-only snapshotをignored evidenceへ保存し、既存設定が増えていたら無条件上書きせず差分をownerへ返す。

```bash
mkdir -p .local/merge-evidence/activation
REPO=kosei-w90607/inventory-system-desktop
gh api "repos/$REPO/rulesets?includes_parents=true" \
  > .local/merge-evidence/activation/rulesets-before.json
gh api "repos/$REPO/rules/branches/main" \
  > .local/merge-evidence/activation/main-before.json
```

Snapshotに既存rulesetがある場合は各IDのdetailも保存する。設定直前にsuccessful CI checkのappがgithub-actions/15368であることを再照合する。対象が明示されたowner承認後のproduction操作は次のpayload作成だけ（既存settingの削除・PUT・bypass追加を含まない）。

```bash
gh api --method POST "repos/$REPO/rulesets" \
  --input .github/merge-gate-ruleset.json \
  > .local/merge-evidence/activation/ruleset-created.json
gh api "repos/$REPO/rules/branches/main" \
  > .local/merge-evidence/activation/main-after.json
```

返されたIDで`repos/$REPO/rulesets/ID`をread-backし、payloadのname/target/enforcement/conditions/rules/bypass_actorsを比較する。main-afterでもPR必須・Merge gate/15368/strict・削除/force禁止を確認する。`pr-gate status`はcurrent mainのdesired policyと実効detailを照合し、不足/driftならReady/mergeを止める。

先に行うprobeは`ci-probe/merge-gate-<candidate>`だけをtargetにしたpayload写しと、`ci-probe/merge-gate-<candidate>-head`の合成資料だけを使用する。元payloadのrulesとbypass_actorsを維持し、nameとinclude refだけ変える。ownerにこの2ref、一時ruleset名、検証PRの作成/merge/close、終了時の正確なID/ref削除をまとめて提示する。負例はPRなしの合成commit、checkなしPR、別appの同名status。positive controlはdocs-only成功head/baseを使う。mainへ負例をpushせず、probe対象でCIが新規起動するとも仮定しない。

probeで拒否/成功が期待と違う場合、本番適用を停止してCI/helperの修正PRへ戻る。適用後の問題では保護を残す。rollbackが必要ならbefore snapshot、作成されたruleset ID、変更対象をownerへ提示して別承認を得る。read-back失敗やActions障害を理由に自動DELETE/disable/admin mergeへ移らない。
