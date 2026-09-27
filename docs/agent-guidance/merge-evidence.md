# マージ検証と証跡作業の整理

Status: accepted。本番保護の現在の有効化事実はhelper statusを正とする。移行・有効化の手順、測定の判断基準、公式根拠とprobe、有効化payloadの記録は[archive](../archive/2026-09-14-merge-evidence-rollout.md)へ移した。
Contract ID: SPEC-MERGE-EVIDENCE

## 動機と目的

目的は、検証した版を確実にマージしながら、AIとownerが証跡の転記・読み直し・状態記録に費やす手間を減らすこと。モデルの思考と独立レビューは、設計判断と欠陥検出に使う。SHAを短く表示するだけでは、記録更新でcommitが増え、再検証と説明が連鎖する原因を除けない。

[PR #52](https://github.com/kosei-w90607/inventory-system-desktop/pull/52)では、実装・独立reviewを終えた内容に対してhuman-confirmとReadyのstate-only commitを追加し、Ready HEADでRust/frontendを含むfullを再実行した。これは当時の規定に従った処理である。D-033はprivate Freeでrequired checksを利用できなかった事情、D-035は自分のSHAを書き込む自己参照問題への対応だった。現在はpublicで、GitHubによる強制を選べる。2026-09-14にownerは「GitHubで強制し、docs・後処理は軽いPR経路」を選択した。

成功は、通常のReady/mergeでSHAの手転記と実装後の状態記録commitを不要にし、必要な検証結果を短い機械判定で確認できること。Plan Gate、非Writerによる独立review、ownerのReady/merge判断、Windows L3・R4の保護は維持する。CI未検証版をGitHubが通すこと、helper経由の正規mergeで未了review/manual/R4を通すこと、必要jobのskipを成功扱いすること、記録を作ること自体が目的になることを失敗とする。token削減量は未実測で、異なるreview roundを比較して効率改善を主張しない。

## 設計判断

| ID | 決定 | 理由・棄却案 |
|---|---|---|
| MG-D1 | mainへPRを必須化し、GitHub Actions由来の`Merge gate`をrequired checkにする。strict（最新mainとの整合）を使う | CLIを通らない操作でもCI/PR要件をGitHubで強制する。review/manual/R4の強制はhelperの正規経路が担う。CLIのみの自主運用はownerが選ばなかった。別GitHubアカウントのreview承認を追加要求する案は、モデル間reviewとアカウントの独立性を混同するため採らない |
| MG-D2 | `Merge gate`は変更分類と必要jobの実成功を集約する。必要jobのfailure/cancelled/skipped/欠落/未知値は非0 | 単に「CIが緑」、Rust aggregateだけ、PR本文のpass宣言だけを根拠にしない |
| MG-D3 | docs-onlyにも軽いCIを実行する。Draftはマージ根拠となるcheckを発行しない | paths-ignoreと`Hosted CI: skip`によるmerge根拠の欠落をなくす。全docsにRust/frontend全量検証を課す案も採らない |
| MG-D4 | 既存classifierとlocalのworkflow回帰suiteを再利用し、hostedとの検証範囲を揃える | local fullの証拠だけを外して検出力を落とさない。新しい分類体系やテスト一覧の複製を避ける |
| MG-D5 | 新運用ではGitのpacketは計画と実装開始の根拠、実装後の状態はPRのnative state・review記録・CIから導く | 完了段階のstate-only commitをなくす。全工程を外部サービスへ移し、オフラインの計画/実装を止める案は採らない |
| MG-D6 | 非CIのreview/manual結果はPR内の専用記録1つへまとめ、対象版を自動取得する | PR本文全体を毎回書き換えない。署名チェーン、独自DB、別bot、SHA除外pathを持つ独自content hashは作らない |
| MG-D7 | 通常の最終merge根拠はhosted gateに集約し、localは変更中のfeedbackとhosted外の検証に使う | local fullを削除せず、通常mergeでの一律のlocal/full/SHA三点照合を撤去する。manual/R4結果はCI成功で代替しない |
| MG-D8 | helperはstatus・review対象capture・記録・Ready・mergeだけを扱う。既存`gh`とPython標準ライブラリを使う | AIが多数のAPI出力を読んで組み立てる工程を減らす。reviewerの起動、採否の自動判断、Plan Gateの自動承認は担当しない |
| MG-D9 | 直接mainへpushしていたdocs/closeoutも、docs CIを通る小さなPRへ変更する | main保護を恒常bypassで骨抜きにしない。R0 closeoutにPlan Packetや新しい独立reviewを要求せず、closeoutの再帰を起こさない |
| MG-D10 | 移行期の旧packetの扱い（完了。履歴は[archive](../archive/2026-09-14-merge-evidence-rollout.md)） | 現行の方式は本書だけ。archiveは一括変換しない |
| MG-D11 | CIとhelperを旧gate下で完成・dogfoodしてからmain保護を有効化する（完了。履歴は[archive](../archive/2026-09-14-merge-evidence-rollout.md)） | 保護だけ先に入れて正規のmerge/closeoutを閉塞させない。失敗時の自動bypassは禁止 |
| MG-D12 | 人とモデルへの出力は状態・次の行動・阻害理由を中心にし、実行ログと集計を分ける | 成功時のログ全文再読や証跡の再証明を常設しない。レビュー要約だけで検証を済ませる案も採らない |

## 強制範囲（owner選択）

2026-09-14にownerは「CIはGitHub、review等はhelperで確認。直接UI mergeは運用上禁止」を選択した。GitHubが強制するのはPRとCIの条件であり、review/manual/R4のrecordはCI evaluatorへ入れない。これらはhelperとownerの規律で確認する。新modeの正規Ready/mergeはhelper経由とし、直接UI mergeや確認を飛ばす直接gh mergeを行わない。

GitHub UIがCI成功だけでmerge可能と表示する場合があることは既知の残存リスクで、未実装のserver保護があるとは主張しない。helperはその状態でも古い/不足したreview/manual/R4を拒否する。CI以外もserver側に追加の必須checkで強制する案は、同期処理と再実行を増やすため今回は採らない。既存のモデルreview・owner承認を省略する許可ではない。

## CIとmain保護

現在のRust集約jobを全体の`merge_gate`へ置き換える。既存のRust lint/test/drift、frontend、docs、env jobを保持し、workflow回帰suiteのjobを追加する。aggregateは全jobを`needs`に持ち、jobのifは`always()`とname式と同じDraft判定だけにする。`needs.changes.result == success`をjobのifへ入れてはならず、分類失敗は実際に起動したevaluatorが非0で処理する。既存ci-workflow.test.shの全always jobへのsuccess前提をaggregateについて置換し、前提を付け足すmutantを拒否する。分類成功が必須で、選択されたjobは`success`だけを受理し、非対象jobの`skipped`だけを許す。未知pathはfull fallbackとして受理するが、分類key/値の不備や未知のjob結果は拒否する。npm auditのwarn-onlyという現行契約はこの変更で改変しない。

`pull_request`はmain対象のopened/reopened/ready_for_review/synchronize、dispatchは現行どおりfull。paths-ignoreと本文のskip tokenで全workflowを止める経路は廃止する。body編集では実行しない。base付替え等でrunが無い場合は、helperが同じHEADの成功/進行中runを確認してから明示recovery dispatchを案内する。予防的な重複dispatchは行わない。

Draft時はaggregateのcheck名を`Draft (no merge evidence)`、Ready/dispatch時だけ`Merge gate`とする（`jobs.<job_id>.name`のgithub expression）。Draft guardによりrunnerは起動しない。**required名のskipped checkをDraftで発行してはならない**。GitHubはskipped/neutralもrequired checkの成功条件に含めるためである。実際のcheck-run名とDraft→Ready境界の挙動は、有効化前のlive dogfoodで確認する。期待どおりでなければmain保護を有効化しない。

docs-onlyを含むhostedの全正規経路には実PR headに対するPK5（Plan Commit/Amendmentsの祖先・不変確認）も必須接続する。該当jobはfetch-depth: 0とPR head/baseを取得し、履歴不足をskip成功にしない。parityの対象はlocal-ci.sh fullの全gate（workflow-git、shell-syntax、workflow-yamlも含む）。回帰suiteの実行と、実PRのPK5検査を別の義務として扱う。必要なRuby/ripgrep/PythonとNode pinをhostedに用意し、CI tokenはcontents:readに固定してownerの運用commentを書き換える権限を渡さない。

分類は既存の出力keyを保つ。CI/ゲート実行コード、tests、未知pathは全gate。AGENTS/CLAUDE、agent-guidance、workflow/CI/review正本、workflow templates、Skills、Claude rules/commandsはdocs＋workflow回帰を要求する。一般のPlans/backlog/archive/説明文書はdocs経路。function-design/REQ/bindings等の既存traceability/drift分類は維持する。consumerは明示されたarea flagを使い、`workflow=true`だけで無条件にRust/frontendへ再昇格させない。rename/copyの両pathと削除も分類する。

`workflow`出力は「workflow回帰が必要」の意味へ限定し、旧の自動full昇格を次の表へ置換する。consumerとfixtureを同時に更新する。

| 分類 | 具体pathと扱い |
|---|---|
| 実行制御/full | `.github/workflows/**`、`.github/actions/**`、`.github/merge-gate-ruleset.json`、`scripts/ci/**`、`scripts/tests/**`、`scripts/{local-ci,pre-push,doc-consistency-check,check-env-safety,check-workflow-git,check-command-drift}.sh`、`scripts/pr-gate.py`、`.codex/bin/**`、`.claude/settings.json`、`.claude/hooks/**` |
| policy/docs＋workflow回帰 | `AGENTS.md`、`CLAUDE.md`、`docs/{DEV_WORKFLOW,ci,AGENT_OPERATING_MANUAL,code_review,project-profile}.md`、`docs/agent-guidance/**`、`docs/templates/**`、`.agents/**`、`.claude/{rules,commands,skills}/**`、`.github/pull_request_template.md` |
| 一般docs | `docs/Plans.md`、`docs/backlog.md`、`docs/archive/**`等。既存のfunction-design/REQ/bindings/drift分類が重なる場合はそのflagも保持 |
| その他 | 既存のRust/frontend/env/generated/traceability分類を維持。未登録pathは全gateへfallback |

helperのRisk/review要件確認ではcurrent main側の分類を使い、PRがclassifier/evaluatorを変更して自分の必要reviewを減らせないようにする。CI判定自体を二重実装せず、helperは正しいworkflow/app/対象版の実行済みMerge gateを確認する。

ruleset案は`inventory-main-merge`、target=branch、include=`refs/heads/main`、exclude=[]、enforcement=active、bypass_actors=[]。rulesはpull_request（required_approving_review_count=0）、required_status_checks（context=`Merge gate`、integration_id=15368、strict_required_status_checks_policy=true）、deletion禁止、non_fast_forward禁止。15368は現repoのCI check APIで確認したGitHub Actions app IDで、設定直前にも照合する。review承認数0はモデルによるPlan/Final Reviewを免除せず、別GitHubユーザーを増やさないための設定。既存rulesetを上書きせず、別設定が増えていれば適用差分を再確認する。

desired payloadは実装時に`.github/merge-gate-ruleset.json`へ置く。helperの実効照合はcurrent main側のpolicyを使用し、PRが自分用に弱めたpolicyを信頼しない。payloadの自動適用はhelperに含めない。保護はCI改変の悪意やモデルreviewの独立性を証明するものではなく、workflow/policy変更の独立Double Auditを維持する。

native拒否のprobeは、ownerに具体的対象を示したうえで`ci-probe/merge-gate-<candidate>`という検証用base refと、rules内容が同じで対象refだけ異なる一時rulesetを使う。PRを伴わない合成commit、必要checkのないPR、期待appでないstatusを拒否することを確認する。positive controlはbootstrapの実CIが成功したcandidateとその検証時baseを使い、検証用PRだけをmergeする。mainへ失敗実験を行わず、結果を保存して一時ref/rulesetを片付ける。最後にproduction rulesをread-backする。GitHubのPR要件は「PRに対応する検証済み変更」を要求するもので、正当なPRに対応したmanual mergeまで暗号学的に禁止する仕組みとは扱わない。

### 実応答の既定項目との互換性（MG-D1a）

GitHubのruleset detailは、送信payloadにない既定parameterを返す。[検証用PR #57](https://github.com/kosei-w90607/inventory-system-desktop/pull/57) / [#58](https://github.com/kosei-w90607/inventory-system-desktop/pull/58)の試験ではnativeの拒否・正常mergeが成立した一方、`pull_request.parameters`に追加された次の項目でhelperの全体比較が不一致になった。

| 応答だけに存在する項目 | 許容する値・型 |
|---|---|
| `required_reviewers` | 空のJSON配列 `[]` |
| `require_extra_approval_for_unattributed_changes` | JSON boolean `true`（数値 `1` は不可） |

helperは取得したcurrent main側のdesired policyを基準とする。上の項目をdesired側が明示していない場合に限り、応答に存在すれば値・型を表どおり検査し、比較用のコピーから除いて既存の全体比較を行う。応答に存在しない従来形式も受け入れる。desired側が明示する項目は除外せず、desiredとの比較対象として残す。元のAPI応答・desired・保存証拠は変更しない。

未知のparameter、表と異なる値・型、既存の保護項目の欠落・変更は拒否する。rulesの配列順序やallowed_merge_methodsの順序はこの修正で正規化せず、従来の比較を維持する。name/target/enforcement/conditions/bypass、実効PR必須・Merge gate/15368/strict・削除/force禁止の検査を維持し、status/Ready/mergeは同じ`Gate.rules`を通る。

これは観測した応答形を扱う限定的な互換処理で、GitHub側の設定やreview要求を変更するものではない。`required_reviewers`は[公式Rules API](https://docs.github.com/en/rest/repos/rules)に記載がある。もう一方の項目の入力契約・全状況での意味は未確認で、今回のnative試験を越えて無害と一般化しない。送信payloadへの未確認項目の追加、未知fieldの一括無視、再帰的な部分一致、恒常bypassは採らない。実応答が許容形から変わった場合は利用を止め、実物確認と別の変更判断を行う（D-086）。

## 状態と非CI記録

Gitで管理するWorkflow StateはPhase、Risk、Plan Commit、Amendments、Coordinator、Writer、Plan Reviewer、Final Reviewer、Final Review Minimum、Human Gateの10 field。`Evidence Mode`行は任意で、書くなら`github`だけを受理する。その他の行はhelperが評価しない。archiveは非遡及。Phaseはkickoff〜implementingとarchiveの計画上の地点を表す。実装後の状態をGitへ書く必要はない。Human Gateは要件であり、`ready,merge`を必須に、必要な場合`manual,r4`を加える。R4にはr4が必須。自由文の条件を推測して免除しない。Final Review Minimumは承認された初回監査の必要数（1または2）を明記し、R4/workflow gateでは2を下回らない。既存のRisk別review要件を減らさず、helperはこの明示値を下限にする。

helperはRisk / Final Review Minimum / Human Gateを、Plan Commit（Amendmentsがあれば最後の登録SHA）のpacket snapshotとheadで照合する。未追補の変更は拒否し、snapshot当時のPhaseや自己SHAがpre-gate/pendingでもこの3条件の照合には影響させない。これは登録された承認内容への結合であり、人の承認を署名やmetadataだけで証明する仕組みではない。

Reviewed Content HEAD / Final Exact-HEAD Evidence / Hosted CI Requirementの行は拒否する。元のPlan CommitとAmendmentsの不変性・祖先確認は残す。Amendmentsは過去の登録列が現在列のprefixになる追記だけを許す。区切りや空白は変更できるが、登録順序・SHAの差替え・削除・表記の置換は許さない。実装開始後に計画の契約が変わる場合の再設計・再reviewも維持する。

非CI結果はowner名義の専用PR comment（marker=`inventory-workflow-v1`）に保存する。PR本文や他commentを編集しない。正当なauthorの記録が複数あれば曖昧として止める。CIのSHAや成功フラグは複製せずGitHub APIから取得する。

wireの正本は次のRecordV1だけとする。SHAはこのrepoのfull SHA、Evidenceは公開可能な証拠pointer（会話全文・vendor session ID・実データは含めない）。Riskの意味やreviewの独立性は人とモデルが確認し、metadataだけで証明しない。

```text
RecordV1 = {
  version: 1, repo: owner/name, pr: positive_integer, head: SHA, base: SHA,
  review: {outcome: Outcome, broad: Broad|null, closure: Closure|null},
  manual: {outcome: Outcome, evidence: [Evidence], source_head?: SHA, reuse_approval?: Evidence},
  r4: {outcome: Outcome, evidence: [Evidence]}
}
Outcome = pending | pass | fail | not-required
Audit = {model: string, run_ref: string, evidence: [Evidence]}
Broad = {head: SHA, base: SHA, plan_commit: SHA|null, amendments: [SHA], audits: [Audit]}
Closure = {head: SHA, base: SHA, audit: Audit}
```

初回のbroad監査はpacketのFinal Review Minimum以上の独立auditを必要とする。auditsは監査の実施記録で、各監査でfindingが出たことを隠さない。現在版の全findingが裁定・解消された場合だけreview.outcomeをpassにする。run_refは重複不可の公開可能な識別子であり、モデルのsession識別子ではない。R2+のreviewをnot-requiredにはできず、Broad.plan_commitは承認されたPlan Commitと一致するfull SHAを必須としnullを拒否する。schemaのplan_commit=nullはR0/R1だけに許す。R0/R1の不要reviewはbroad/closureともnull。

broadと現在のhead/baseが同じならclosureはnull。異なる場合は、同じPlan Commit/Amendmentsの範囲で、必要数を満たすbroadを保持し、現在head/baseに一致する独立closureを1回以上必要とする。closureのauditは過去の監査・既存finding・累積修正を踏まえた現在候補の完了判定を含む。単に最新の1行だけ見た結果を完了判定にしない。Plan契約が変わった場合やbroadの同一scope適用を確認できない場合は、新しいbroadを必要とする。base同期にもこのclosure数を適用し、初回Double Auditを無条件にやり直さない。

manual/r4のpassは非空evidenceが必要。manual.source_head/reuse_approvalは両方を同時に指定し、後述するbase同期の限定再利用でだけ受理する。それ以外のmanual結果はrecord.headでの実施/確認を表す。r4に再利用fieldはなく、当該head/操作条件の明示承認を必要とする。manualはL3等の追加検証・承認をまとめた結果で、内容はpacketの該当手順が所有する。

captureはrepo/PR/head/base、Plan Commit/Amendmentsと現在の正当なrecordを取得し、cleanなlocal HEADとの一致を確認して一意のlocalファイルへ保存する。captureは上書きしない。record時にPRと既存commentを再取得し、対象版または取り込む元recordが変わっていれば停止する。新しい版にmanual/R4のpassを自動継承しない。旧broadを使うclosureは、serverに現在も存在する正当なrecordを基に作り、消失したcommentをcacheだけから復元しない。

書込みはsingle-writerが担当し、reviewerはcommentを編集しない。IDを指定して専用commentだけを更新し、前後のhead/baseを確認する。途中で版が変わった記録は有効扱いせず、任意の最新commentで補完しない。commentへの書込みは当該PRの記録更新の明示承認範囲で行う。

| 観測状態 | 有効な現在地 / 次の行動 |
|---|---|
| 計画未承認 | tracked phaseに従いPlan Gate。実装不可 |
| 実装開始済み、PRなし / local先行 | implementing。対象検証とDraft準備 |
| Draft、必要review未了/古い版 | 修正または独立review。Ready不可 |
| Draft、review通過、manual/R4が未了 | 該当するowner検証/承認待ち |
| Draft、必要review/manual/R4充足 | ownerのReady判断待ち |
| Ready、CI未了/失敗 | Ready、hosted CI待ち。成功前はmerge不可、必要な修正はDraftへ |
| Ready、現版の必要CI成功 | ownerのmerge指示があればhelperでmerge |
| merged | archive/closeout PR準備 |
| offline / API不明 / 壊れた記録 | merge権限は確定しない。計画/実装の許可済み作業は継続可 |

## base同期だけでheadが変わる場合

strictによりmainの取込みが必要な場合、まず先行PRのcloseoutを完了し、対象をDraftへ戻してからorigin/mainを取り込む。GitHubのUpdate branchも同じ扱いで、hookを通らない更新を信頼しない。新headではCIを実行し、独立reviewは新たなdelta/相互作用のclosureに限定する。全面監査を最初から繰り返す義務はない。並行PRではmain更新に伴う再Ready判断とCIが追加され得る。これはstrictを選ぶ運用コストとして各作業の予算に含め、今回のrollout予算だけで将来分も賄えるとはしない。

manualの再実施が不要とownerが判断できる候補は、new headが旧headをfirst parent、取得したmainをsecond parentに持つ単一のmergeで、旧base→旧headと新base→新headのPR差分が`git diff --binary --full-index --no-ext-diff --no-textconv BASE...HEAD --`のbyte比較で同一の場合に限る。patch-idだけの同値は根拠にしない。競合解消・別の編集があった場合、またはmanual対象への影響が否定できない場合は再利用しない。判定不能も同じ。merge-baseが複数ある等で差分が一意に定まらない場合も再利用しない。機械条件は必要条件で、manual対象への無影響を証明しない。

許可された再利用ではmanualに元の`source_head`と既存evidence、ownerの適用判断を示す`reuse_approval`を残し、新headで実施し直したとは記録しない。source_headがrecordのheadと異なるpassは、機械条件と非空reuse_approvalを満たす場合だけ受理する。旧記録の検証結果はcaptureへ保持し、無条件に書き換えない。reviewは新headに対するclosureが必要。R4承認は新head/操作条件に対する明示承認を必要とし、このmanual再利用では代用しない。

再利用元は現在serverに存在する正当なrecordのmanual.passに限り、source_headはその確認対象版、evidenceは元記録と一致しなければ拒否する。元recordの欠落・pending/fail・evidenceの差替えや、capture後の元record変更をcacheやCLIのpass宣言で補完しない。版変更時は旧passを含むfresh captureから再利用manualを先に記録し、保持されたbroadと現在版manualをfresh captureしてからclosureを記録する。closureを先に記録して旧manualがpendingへ戻った場合、消えたpassをlocal captureだけで復元せず、manualを再確認する。

manual失敗の修正や対象挙動を変える修正は、既存L3の復旧・改版・canonical先頭からの再実施に従う。L3の証拠の扱いはこの規則に一本化する。

## Helperの境界

packet不在は親docs一覧で確認する。Git上にdocs/plansが無ければR0/R1のno-packet経路とし、親一覧の取得失敗や存在するdirectoryへのHTTP失敗は空結果に置き換えない。

追加候補は`python3 scripts/pr-gate.py status|capture|record|ready|merge --pr NUMBER`。R2+では`--packet docs/plans/FILE.md`を指定し、当該PR headのpacket・Plansの登録と照合する。対象を複数packetへ曖昧に結び付ける入力は拒否する。R0/R1は明示Riskとdiff分類、および`--manual required|not-required`を必須とし、CI制御の実行code変更をR0/R1へ下げる入力を拒否する。Risk値でCIの実行範囲を縮めず、policy文書の意味変更のRisk判定はowner/modelが行う。packet不在をmanual免除とみなさない。業務的Riskの分類自体はowner/モデルが担う。PR作成前はtrackedの計画phaseを使い、helperで架空のPR状態を作らない。

statusはread-only、結果は短い状態と阻害理由（`--json`で構造化）。captureはignored `.local/pr-gate/`だけへ書く。recordは`--capture FILE --kind review|manual|r4 --outcome VALUE --evidence POINTER`を受ける。reviewでは`--review-stage broad|closure --pass-model MODEL --run-ref REF`を指定し、Auditを追加/更新する。同じrun_refを別監査として数えない。manualの再利用には`--reuse-from SHA --reuse-approval POINTER`を両方指定する。helperがcapture/serverの正当なbroadを保持し、CLI入力から架空のbroadを作らない。対象commentだけを作成/更新する。対象版が変わったrecordでは他kindもpendingへ戻し、必須でないものだけnot-requiredを設定する。Ready/mergeはownerの明示指示を前提にする。

merge時はGitHubのPR head/base・実効rules・必要checkをfreshに取得し、対象CI workflow、GitHub Actions app、必要job成功、review/manualの対応版、Ready、merge可能状態を確認する。`gh pr merge --match-head-commit`で確認後のhead変更を拒否し、strict ruleでbase更新も防ぐ。helperはsettingsを変更せず、`--admin`やbypass fallbackを持たない。未知/不足/HTTP失敗/permission failureは非0で終了する。

通常操作に対するexitは0=成功、1=条件不足、2=入力/通信エラー。statusの待機状態は正常な読取り結果として出し、CI未完了をツール故障として扱わない。PR/branch名やJSONはargv/構造化dataとして扱い、shellへ展開しない。ローカルcacheは表示用の写しで、offline mergeや失われた承認の復元根拠にしない。

## closeoutとActions停止時

docs/closeout PRはR0のまま、docs gateとMerge gateを通す。親PRで許可された後処理の範囲なら、その都度同じ承認を聞き直さない。自身のPlanを持たないcloseout PRには次のcloseoutを要求しない。通常squashを維持し、既存commitの履歴保持が必要な例外はownerの明示範囲で扱う。

Actions利用不能時はmergeを停止し、許可済みのlocal作業と証拠を保存する。設定やCIの障害では保護を残して修正PRを準備する。rulesが失われたPRはDraftで保持し、手動mergeで回避しない。設定の復旧が必要なら、事前snapshotと正確な対象をownerへ示して別途操作し、無承認で保護を解除してmergeしない。単なるGitHub障害を理由に再reviewを発注しない。

## 実行手順

R2+の例（`PR`は対象PR番号、`PACKET`は登録された単一packet）。以下のrecord/Ready/mergeはその操作のowner指示を得てから実行する。captureの返すpathを使い、SHAを手転記しない。

```bash
python3 scripts/pr-gate.py status --pr "$PR" --packet "$PACKET"
python3 scripts/pr-gate.py capture --pr "$PR" --packet "$PACKET"
python3 scripts/pr-gate.py record --pr "$PR" --packet "$PACKET" \
  --capture "$CAPTURE" --kind review --review-stage broad \
  --pass-model "$MODEL" --run-ref "$PUBLIC_REVIEW_REF" \
  --outcome pending --evidence "$EVIDENCE"
```

Double Auditは最初のauditをpendingで記録し、fresh captureから次のauditを追加する。必要数とfinding裁定が揃ったときだけpassにする。改版後のclosureはserverに残るbroadを使い、manual再利用時は前節のmanual→fresh capture→closureの順序を守る。モデル名/run_refは公開可能な実施記録であり独立性の機械的証明ではない。
