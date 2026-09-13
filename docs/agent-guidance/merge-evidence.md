# マージ検証と証跡作業の整理

Status: proposed。実装・移行確認・ownerの有効化承認が完了するまで現行規定を置き換えない。
Contract ID: SPEC-MERGE-EVIDENCE

## 動機と目的

目的は、検証した版を確実にマージしながら、AIとownerが証跡の転記・読み直し・状態記録に費やす手間を減らすこと。モデルの思考と独立レビューは、設計判断と欠陥検出に使う。SHAを短く表示するだけでは、記録更新でcommitが増え、再検証と説明が連鎖する原因を除けない。

PR #52では、実装・独立reviewを終えた内容に対してhuman-confirmとReadyのstate-only commitを追加し、Ready HEADでRust/frontendを含むfullを再実行した。これは当時の規定に従った処理である。D-033はprivate Freeでrequired checksを利用できなかった事情、D-035は自分のSHAを書き込む自己参照問題への対応だった。現在はpublicで、GitHubによる強制を選べる。2026-09-14にownerは「GitHubで強制し、docs・後処理は軽いPR経路」を選択した。

成功は、通常のReady/mergeでSHAの手転記と実装後の状態記録commitを不要にし、必要な検証結果を短い機械判定で確認できること。Plan Gate、非Writerによる独立review、ownerのReady/merge判断、Windows L3・R4の保護は維持する。未検証版のmerge、必要jobのskipを成功扱いすること、記録を作ること自体が目的になることを失敗とする。token削減量は未実測で、異なるreview roundを比較して効率改善を主張しない。

## 設計判断

| ID | 決定 | 理由・棄却案 |
|---|---|---|
| MG-D1 | mainへPRを必須化し、GitHub Actions由来の`Merge gate`をrequired checkにする。strict（最新mainとの整合）を使う | CLIを通らないmergeも止める。CLIのみの自主運用はownerが選ばなかった。別GitHubアカウントのreview承認を追加要求する案は、モデル間reviewとアカウントの独立性を混同するため採らない |
| MG-D2 | `Merge gate`は変更分類と必要jobの実成功を集約する。必要jobのfailure/cancelled/skipped/欠落/未知値は非0 | 単に「CIが緑」、Rust aggregateだけ、PR本文のpass宣言だけを根拠にしない |
| MG-D3 | docs-onlyにも軽いCIを実行する。Draftはマージ根拠となるcheckを発行しない | paths-ignoreと`Hosted CI: skip`によるmerge根拠の欠落をなくす。全docsにRust/frontend全量検証を課す案も採らない |
| MG-D4 | 既存classifierとlocalのworkflow回帰suiteを再利用し、hostedとの検証範囲を揃える | local fullの証拠だけを外して検出力を落とさない。新しい分類体系やテスト一覧の複製を避ける |
| MG-D5 | 新運用ではGitのpacketは計画と実装開始の根拠、実装後の状態はPRのnative state・review記録・CIから導く | 完了段階のstate-only commitをなくす。全工程を外部サービスへ移し、オフラインの計画/実装を止める案は採らない |
| MG-D6 | 非CIのreview/manual結果はPR内の専用記録1つへまとめ、対象版を自動取得する | PR本文全体を毎回書き換えない。署名チェーン、独自DB、別bot、SHA除外pathを持つ独自content hashは作らない |
| MG-D7 | 通常の最終merge根拠はhosted gateに集約し、localは変更中のfeedbackとhosted外の検証に使う | local fullを削除せず、通常mergeでの一律のlocal/full/SHA三点照合を撤去する。manual/R4結果はCI成功で代替しない |
| MG-D8 | helperはstatus・review対象capture・記録・Ready・mergeだけを扱う。既存`gh`とPython標準ライブラリを使う | AIが多数のAPI出力を読んで組み立てる工程を減らす。reviewerの起動、採否の自動判断、Plan Gateの自動承認は担当しない |
| MG-D9 | 直接mainへpushしていたdocs/closeoutも、docs CIを通る小さなPRへ変更する | main保護を恒常bypassで骨抜きにしない。R0 closeoutにPlan Packetや新しい独立reviewを要求せず、closeoutの再帰を起こさない |
| MG-D10 | 旧packetはlegacyとして維持し、明示markerのある新packetだけ新運用にする | archiveを一括変換しない。旧packetを曖昧に新運用へ推測変換しない |
| MG-D11 | CIとhelperを旧gate下で完成・dogfoodしてからmain保護を有効化する | 保護だけ先に入れて正規のmerge/closeoutを閉塞させない。失敗時の自動bypassは禁止 |
| MG-D12 | 人とモデルへの出力は状態・次の行動・阻害理由を中心にし、実行ログと集計を分ける | 成功時のログ全文再読や証跡の再証明を常設しない。レビュー要約だけで検証を済ませる案も採らない |

## CIとmain保護

現在のRust集約jobを全体の`merge_gate`へ置き換える。既存のRust lint/test/drift、frontend、docs、env jobを保持し、workflow回帰suiteのjobを追加する。aggregateは全jobを`needs`に持ち、`always()`で分類失敗も検出する。分類成功が必須で、選択されたjobは`success`だけを受理し、非対象jobの`skipped`だけを許す。未知pathはfull fallbackとして受理するが、分類key/値の不備や未知のjob結果は拒否する。npm auditのwarn-onlyという現行契約はこの変更で改変しない。

`pull_request`はmain対象のopened/reopened/ready_for_review/synchronize、dispatchは現行どおりfull。paths-ignoreと本文のskip tokenで全workflowを止める経路は廃止する。body編集では実行しない。base付替え等でrunが無い場合は、helperが同じHEADの成功/進行中runを確認してから明示recovery dispatchを案内する。予防的な重複dispatchは行わない。

Draft時はaggregateのcheck名を`Draft (no merge evidence)`、Ready/dispatch時だけ`Merge gate`とする（`jobs.<job_id>.name`のgithub expression）。Draft guardによりrunnerは起動しない。**required名のskipped checkをDraftで発行してはならない**。GitHubはskipped/neutralもrequired checkの成功条件に含めるためである。実際のcheck-run名とDraft→Ready境界の挙動は、有効化前のlive dogfoodで確認する。期待どおりでなければmain保護を有効化しない。

分類は既存の出力keyを保つ。CI/ゲート実行コード、tests、未知pathは全gate。AGENTS/CLAUDE、agent-guidance、workflow/CI/review正本、workflow templates、Skills、Claude rules/commandsはdocs＋workflow回帰を要求する。一般のPlans/backlog/archive/説明文書はdocs経路。function-design/REQ/bindings等の既存traceability/drift分類は維持する。consumerは明示されたarea flagを使い、`workflow=true`だけで無条件にRust/frontendへ再昇格させない。rename/copyの両pathと削除も分類する。

ruleset案は`inventory-main-merge`、target=branch、include=`refs/heads/main`、exclude=[]、enforcement=active、bypass_actors=[]。rulesはpull_request（required_approving_review_count=0）、required_status_checks（context=`Merge gate`、integration_id=15368、strict_required_status_checks_policy=true）、deletion禁止、non_fast_forward禁止。15368は現repoのCI check APIで確認したGitHub Actions app IDで、設定直前にも照合する。review承認数0はモデルによるPlan/Final Reviewを免除せず、別GitHubユーザーを増やさないための設定。既存rulesetを上書きせず、別設定が増えていれば適用差分を再確認する。

desired payloadは実装時に`.github/merge-gate-ruleset.json`へ置く。helperの実効照合はcurrent main側のpolicyを使用し、PRが自分用に弱めたpolicyを信頼しない。payloadの自動適用はhelperに含めない。保護はCI改変の悪意やモデルreviewの独立性を証明するものではなく、workflow/policy変更の独立Double Auditを維持する。

native拒否のprobeは、ownerに具体的対象を示したうえで`ci-probe/merge-gate-<candidate>`という検証用base refと、rules内容が同じで対象refだけ異なる一時rulesetを使う。PRを伴わない合成commit、必要checkのないPR、期待appでないstatusを拒否することを確認する。positive controlはbootstrapの実CIが成功したcandidateとその検証時baseを使い、検証用PRだけをmergeする。mainへ失敗実験を行わず、結果を保存して一時ref/rulesetを片付ける。最後にproduction rulesをread-backする。GitHubのPR要件は「PRに対応する検証済み変更」を要求するもので、正当なPRに対応したmanual mergeまで暗号学的に禁止する仕組みとは扱わない。

## 状態と非CI記録

新packetのmarkerは`Evidence Mode: github`。Gitで管理するWorkflow StateはPhase、Risk、Execution Mode、Plan Commit、Amendments、Coordinator、Writer、Plan Reviewer、Final Reviewer、Human Gate、およびmarker。Phaseはkickoff〜implementingとarchiveの計画上の地点を表す。local-verified以後をGitへ書く必要はない。Human Gateは要件であり、`ready,merge`を必須に、必要な場合`manual,r4`を加える。R4にはr4が必須。自由文の条件を推測して免除しない。

Reviewed Content HEAD / Final Exact-HEAD Evidence / Hosted CI Requirementは新packetから外す。元のPlan CommitとAmendmentsの不変性・祖先確認は残す。実装開始後に計画の契約が変わる場合の再設計・再reviewも維持する。

非CI結果は、owner名義の専用PR comment（marker=`inventory-workflow-v1`）にJSONと短い表示を保存する。PR本文や他commentを編集しない。正当なauthorの記録が複数あれば曖昧として止め、任意の最新コメントを採らない。記録はrepo/PR、head/base SHA、review/manual/r4のoutcomeとevidence pointerを持つ。outcomeはpending/pass/fail/not-required。R2+のreviewはnot-required不可、manual/r4はpacketの要件と一致しなければ不可。CIのSHAや成功フラグはここへ複製せず、GitHub APIから取得する。

captureはPRのrepo/head/baseとcleanなlocal HEADを取得して、一意のlocalファイルへ保存する。review中の変更を見落とさないためcaptureを上書きしない。record時に再照合し、head/baseが変わっていれば古いpassを結び付けない。新しい版のrecordに前のmanual/R4のpassを自動継承しない。reviewの独立性とP1/P2裁定は人・モデルの役割であり、JSONで証明できるとは扱わない。commentへの書込みは当該PRの記録更新の明示承認範囲で行う。

recordのwireは`version:1`、`repo`（owner/name）、`pr`（正整数）、`head`/`base`（full SHA）、`review`/`manual`/`r4`（それぞれoutcomeとevidence文字列配列）。head/baseはrecord全体に適用する。reviewのpassと必須manual/r4のpassには非空evidenceが必要。manualはL3等の追加検証・承認をまとめた結果で、内容は承認済みpacketの該当手順が所有する。r4のrecordは操作前のowner承認を後から代用するものではない。

書込みはsingle-writerが担当し、reviewerは専用commentを編集しない。commentのauthorはrepo ownerと照合する。recordの新設/更新前後にPRのhead/baseを確認し、途中で変わった記録は有効扱いしない。既存commentのIDを指定して更新し、人のPR本文や他のcommentを上書きしない。削除/複数marker/不正versionは再確認が必要な状態として扱い、cacheから再作成して通過させない。

| 観測状態 | 有効な現在地 / 次の行動 |
|---|---|
| 計画未承認 | tracked phaseに従いPlan Gate。実装不可 |
| 実装開始済み、PRなし / local先行 | implementing。対象検証とDraft準備 |
| Draft、必要review未了/古い版 | 修正または独立review。Ready不可 |
| Draft、review通過、manual/R4が未了 | 該当するowner検証/承認待ち |
| Draft、必要review/manual/R4充足 | human-confirm。owner Ready判断待ち |
| Ready、CI未了/失敗 | ready-hosted-final。成功前はmerge不可、必要な修正はDraftへ |
| Ready、現版の必要CI成功 | ownerのmerge指示があればhelperでmerge |
| merged | archive/closeout PR準備 |
| offline / API不明 / 壊れた記録 | merge権限は確定しない。計画/実装の許可済み作業は継続可 |

## Helperの境界

追加候補は`python3 scripts/pr-gate.py status|capture|record|ready|merge --pr NUMBER`。R2+では`--packet docs/plans/FILE.md`を指定し、当該PR headのpacket・Plansの登録と照合する。R0/R1は明示Riskとdiff分類を確認し、policy/workflow変更をR0/R1へ下げる入力を拒否する。業務的Riskの分類自体はowner/モデルが担う。PR作成前はtrackedの計画phaseを使い、helperで架空のPR状態を作らない。

statusはread-only、結果は短い状態と阻害理由（`--json`で構造化）。captureはignored `.local/pr-gate/`だけへ書く。recordは`--capture FILE --kind review|manual|r4 --outcome VALUE --evidence POINTER`を受け、対象commentだけを作成/更新する。対象版が変わったrecordでは他kindもpendingへ戻し、必須でないものだけnot-requiredを設定する。Ready/mergeはownerの明示指示を前提にする。

merge時はGitHubのPR head/base・実効rules・必要checkをfreshに取得し、対象CI workflow、GitHub Actions app、必要job成功、review/manualの対応版、Ready、merge可能状態を確認する。`gh pr merge --match-head-commit`で確認後のhead変更を拒否し、strict ruleでbase更新も防ぐ。helperはsettingsを変更せず、`--admin`やbypass fallbackを持たない。未知/不足/HTTP失敗/permission failureは非0で終了する。

通常操作に対するexitは0=成功、1=条件不足、2=入力/通信エラー。statusの待機状態は正常な読取り結果として出し、CI未完了をツール故障として扱わない。PR/branch名やJSONはargv/構造化dataとして扱い、shellへ展開しない。ローカルcacheは表示用の写しで、offline mergeや失われた承認の復元根拠にしない。

## 移行・運用・復旧

1. この整備自体は現行13-field/三点一致/Double Auditを使う。planning-onlyの今はproduction code、CI、rulesetを変更しない。
2. classifier・aggregate・workflow回帰のhosted移植・helper・新旧packet検査を実装し、静的/負例テストを通す。legacy packetはmarkerなし、新markerの未知値は拒否。archiveは一括変換しない。
3. Draftにrequired名の成功/skipが出ないこと、Readyで必要jobが実行されること、policy/docs/failureの経路をlive CIで確認する。新CIの有効化前には旧L1を省略しない。
4. bootstrap PRを旧gateでmerge・archiveする。この時点では旧運用が正本。有効化直前のmain treeに未完了legacy packetがないことを確認する。
5. reviewedなruleset payloadと現在設定の差分をownerへ示す。承認後にnative保護を有効化し、実効rulesの読戻しと負例を確認する。新templateはbootstrapで配布できるが、新modeのReady/mergeはこの確認まで利用不可。bootstrap本体とそのcloseoutだけは明示したlegacy移行経路を使う。
6. 新運用の開始にはhelperの`status`が保護とCIの適合を確認できることが必要。旧sourceのstate-only/三点一致/direct-main-closeout記述はmode別に同期し、旧経路を新packetへ誤適用しない。

docs/closeout PRはR0のまま、docs gateとMerge gateを通す。親PRで許可された後処理の範囲なら、その都度同じ承認を聞き直さない。自身のPlanを持たないcloseout PRには次のcloseoutを要求しない。通常squashを維持し、既存commitの履歴保持が必要な例外はownerの明示範囲で扱う。

Actions利用不能時は新modeのmergeを停止し、許可済みのlocal作業と証拠を保存する。旧not-required/skipの例外を新modeで自動利用しない。設定やCIの障害では保護を残して修正PRを準備する。設定の復旧が必要なら、事前snapshotと正確な対象をownerへ示して別途操作し、無承認で保護を解除してmergeしない。単なるGitHub障害を理由に再reviewを発注しない。

## 測定と実装時の判断基準

通常の新modeでSHA手転記0回、実装後のstate-only commit0件は規範の目標値。実測済みという意味ではない。実装変更、失敗、manual試験の改版以外でfullやreviewを繰り返さない。境界が曖昧なら必要な検出力を優先し、全md除外・弱いreviewer・不都合なテスト削除で帳尻を合わせない。

旧PR #52と同じ問題規模を再現できない場合、token削減率を作らない。正常merge、docs closeout、stale head、CI failureの同じfixtureで、AIが読む出力、手作業の記録、不要な再実行の有無を比較する。独立reviewの費用と機械処理の費用を分ける。

## 公式根拠とprobe

2026-09-14確認。現repoはpublic/admin可、main protected=false、適用rules=[]、既存CI checkのappはgithub-actions/15368。取得コマンドと出力はPlan PacketのContract Probeとignored evidenceに記録する。

- [Required status checks / skippedの扱い](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [RulesetsのPR要件と承認数](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-rulesets/available-rules-for-rulesets)
- [job name/ifのcontext](https://docs.github.com/en/actions/reference/workflows-and-actions/contexts)
- [Rules API](https://docs.github.com/en/rest/repos/rules)
- [GitHub CLI merge](https://cli.github.com/manual/gh_pr_merge)

dynamic check名・rulesetの実効拒否・通信競合は実装後の有効化前dogfoodが必要で、現在のread-only調査で実証済みとはしない。GitHub公式契約とlocal fixtureで設計を検証し、live確認を有効化の前提にする。
