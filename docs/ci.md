# CI

CIとmerge evidenceの正本。設計理由とwire契約は [merge-evidence.md](agent-guidance/merge-evidence.md)（MG-D1〜D12）。

## 移行状態

CI/helperはlegacy gate下で導入する。bootstrapのDraft/Ready・分類失敗、merge後のdocs-only、検証用rulesetの拒否を確認し、ownerの本番有効化承認とread-backが揃ってからgithub modeのReady/mergeを利用する。有効化事実はPR専用commentとhelper statusで確認し、この文書に未確認の設定完了を記録しない。

GitHubが強制するのはmainへのPRとCI。review/manual/R4はhelperが確認し、直接UI merge・確認を飛ばす直接gh mergeは禁止。GitHub UIがCI成功だけでmerge可能と示し得る残存リスクを受容した契約であり、非CI結果をserverが強制するとは主張しない。

## Verification Ladder

| 層 | 目的 | 証跡 |
|---|---|---|
| L0 pre-push | push増分のfeedback、Ready push拒否 | `.local/quality-check.log` |
| L1 local full | 全gateとlocal固有確認。legacyでは必須merge証拠 | `.local/ci-evidence/` |
| L2 hosted final | 必要jobの実成功をMerge gateへ集約 | GitHubの対象workflow/check |

github modeはhostedを最終CI根拠にし、一律のlocal/full/SHA三点一致を要求しない。localで観測した失敗、Windows L3・manual/R4の保護は維持する。legacyはCLEANなcompleted HEADで`local-ci.sh full`を実行し、PR HEAD・PR本文のL1 SHA・required hosted headShaの三点一致を維持する。

## Hosted Trigger Model

`pull_request`のopened/reopened/ready_for_review/synchronize（base=main）と`workflow_dispatch`だけを使う。pushやbody編集では起動しない。全docsをevent対象とし、path filterと本文skip tokenは廃止した。Draftは全runnerを止め、aggregate名は`Draft (no merge evidence)`。Ready/dispatchだけ`Merge gate`を発行する。required名でDraftのskippedを発行しない。

aggregateのifは`always()`とDraft判定だけ。changes成功条件をifへ追加すると分類失敗でaggregateがskipされるため禁止。`check-required-jobs.sh`が分類key/値と全jobを検査し、選択されたjobはsuccessだけ、非対象jobはsuccess/skippedを受理する。failure/cancelled/欠落/未知値は拒否する。CI tokenはcontents:read。

### Final Trigger Selection

CI-TRIGGER-D1: 同じHEADへ予防的なdispatchを重ねない。dispatchは常にfull。

| HEADの状態 | 選ぶtrigger | dispatch前の確認 |
|---|---|---|
| docsを含む全PR | owner Ready、Ready更新の例外はsynchronize、再開はreopened | dispatch しない |
| required final の自動 run または explicit dispatch が作成されない、失敗、または cancel | 原因是正後のrecovery dispatch | 同一 HEAD に successful / in-progress run がないこと |
| 同一 HEAD に successful final が既にある | 既存runを使う | Ready再操作もdispatchも不要 |

base付替え等でrunが無い場合も、同一 HEAD の run が 0 件であること、または失敗/cancelを確認してからrecoveryを選ぶ。

## Risk Routing

一般docs/closeoutはdocs＋Merge gate。policy docsはdocs＋workflow回帰＋Merge gate。実行制御、tests、未知pathは全gate。Rust/frontend/env/generated/traceabilityの既存分類は保持する。RiskはCI範囲を縮めず、owner/modelが意味から判断する。R2+のPlan Gate、独立review、必要manual/R4はCI成功で代替しない。

## Public Standard-Runner Policy

CI-PUBLIC-D1: この repository は public で、現行 workflow は standard GitHub-hosted runner のみを使う。[GitHub Actions billing](https://docs.github.com/en/billing/concepts/product-billing/github-actions) と [job execution time](https://docs.github.com/en/actions/how-tos/monitor-workflows/view-job-execution-time) の公式 contract 上、この組み合わせでは Actions の billable execution minutes は発生しないため、private repository 時代の月間 minute 使用率や reset 日を hosted gate の判断条件にしない。larger runner を将来導入する場合は public repository でも課金対象になるため、別の R3 change で費用・security boundary・routing を再設計する。

free minutes と無関係に、runner / Actions service の障害、concurrency、cache、重複実行には運用コストがある。CI-TRIGGER-D1 の 1 HEAD 1 final、L1 での事前検証、失敗原因を直してからの recovery を維持する。

以下は **legacyだけ** のActions利用不能時の例外。github modeはActions利用不能ならmergeを停止する。

GitHub-hosted runner が利用不能な場合、pure docs-only（workflow / release contract 非接触）は従来どおり 0 hosted run とする。workflow / release contract の docs-only change は原則として owner Ready 後に explicit dispatch を 1 run するが、Actions 利用不能かつ次の閉じた経路へ完全一致する場合だけ `not-required` にできる。

Actions 利用不能時の `Hosted CI Requirement` 例外は次の閉じた 2 経路だけとする。

1. **non-release R2/R3 Actions unavailable**: migration design doc を含むが、実際の R4 mutation や release を行わない変更は `not-required` にできる。exact-HEAD `local-ci.sh full`、risk-tier の独立 review、PR body の未実行 hosted gate/availability 理由、owner residual-risk disposition をすべて要求し、利用可能になった後に必要な HEAD/main を backfill する。
2. **public repository Phase B bootstrap R4**: active control PR の source Actions allocation が利用不能で、かつ destination Actions を安全上 push 前から無効にする Phase B に限り `not-required` にできる。固定 final-root fresh clone の local full、privacy/public-surface gate、R4 Double Audit/closure、PR body の例外、owner disposition を compensating evidence とする。destination Actions は後続の CI 再設計 R3 まで有効化しない。

上記以外の release、R4、workflow executable change は `required` のまま。`not-required` でも観測済み product/test/gate failure は blocker であり、infrastructure/cancel/availability 以外を owner disposition してはならない。この例外の追加自体を行う PR は workflow gate change として Double Audit を必須とし、owner disposition が得られなければ merge しない。

## Local Commands

```bash
bash scripts/local-ci.sh changed
bash scripts/local-ci.sh full
bash scripts/tests/run-workflow-tests.sh
```

changedはorigin/main（なければmain）とのmerge-baseからPR全差分を分類する。push増分とは異なる。fullはdocs、実履歴PK5、shell syntax、workflow YAML、workflow回帰、Rust fmt/clippy/tests、bindings、traceability、frontend install/routes/typecheck/lint/format/tests/build、envを保持する。npm auditは従来どおりwarn-only。

local fullとhosted workflow jobは同じ`run-workflow-tests.sh`を呼び、検証一覧を複製しない。hosted docs jobは全経路でfetch-depth: 0、実PR head/baseを用いてPK5を実行する。浅い履歴や解決不能baseは成功にしない。Node pinとRuby/ripgrep/Pythonを用意する。

local evidenceは開始/終了のHEADとtree状態を保存し、gate中のHEAD更新・CLEANからDIRTYへの変更を失敗にする。DIRTYは診断用、legacyのmerge証拠はfull/CLEAN/同一HEADだけ。github modeでもlocalでの失敗を無視しない。

## Classifier Contract

`classify-changes.sh`の既存9key（rust/rust_drift/frontend/docs/env/generated/traceability/workflow/unknown）を共有する。workflow=trueはworkflow回帰の意味だけで、consumerがRust/frontendへ再昇格させない。詳細path表はMG-D4。rename/copyの両pathと削除を分類し、未知path/比較不能はfull fallback。

## Pre-push Contract

pre-pushは実際のpush先remote_refのReady状態を確認し、Ready pushと照会失敗を拒否する。修正はDraftへ戻す。Rust、docs、env、traceability、frontend routes/typecheck/lintとPK5を維持する。legacyは修正HEADのlocal fullと旧遷移を、新modeは対象検証・改版record・hosted finalを使う。

Rustまたはtraceability分類では`cargo run --bin generate_traceability -- --check`を1回実行し、T1/T2/T4のERRORをpush拒否、T3を従来どおりWARNとして扱う。全Rust関数名へ`_reqNNN`だけを要求する重複検査は使わない。REQ対象の名前規約と、技術/workflowテストの適用SPEC・設計IDはreviewで確認し、機械検査の成功を全テストの仕様対応の証明にしない。

緊急bypassは既存の固定token（owner-approved/tooling-unavailable/incident-response）でhookに記録する。raw no-verifyは使わない。これはGitHub rulesetのbypassやhelperを省略する許可ではない。

## Stale Green Prevention

新modeは`python3 scripts/pr-gate.py status|capture|record|ready|merge --pr NUMBER`。R2+は`--packet`、R0/R1は`--risk`と`--manual required|not-required`を明示する。capture/server/head/baseが変われば記録し直す。Ready/mergeはowner指示の後、helperがfreshなPR・record・rules・CIを確認する。mergeはmatch-headとstrictを使い、admin fallbackはない。

旧legacyは従来のstate-only、exact-HEAD full、PR本文の三点一致を継続する。Ready後の修正はDraftへ戻し、旧greenを流用しない。base同期時のclosureとmanual限定再利用はMG-D6/D7、復旧はMG-D11に従う。

## Cache Policy

- actions/cache は `~/.cargo/registry/index/`、`~/.cargo/registry/cache/`、`~/.cargo/git/db/` の依存取得 cache だけを保存する。
- `src-tauri/target/` と `~/.cargo/bin/` は保存しない。
- key は OS + `src-tauri/Cargo.lock` hash、restore key は OS prefix を維持する。
- Rust 3 job は同じ immutable key を使う。cold miss 時は first writer が保存し、他 job の同一 key save 競合は warning として受容する。job 別 key に分けて同じ依存 cache を三重保存しない。
- npm は既存 `actions/setup-node` の `cache: npm` を維持し、`node_modules/` は保存しない。
- 10GB 上限再到達時は cache usage と key 数を確認し、target 等の build output を再追加しない。

## Required Check Impact

requiredはGitHub Actions/15368由来の`Merge gate`。strict、PR必須、bypassなし、削除/force禁止を`.github/merge-gate-ruleset.json`に定義する。helperはcurrent main側のpolicyと実効rulesを照合し、PRが自分の必要reviewやpolicyを緩めない。設定はhelperから変更しない。

## Related Records

[DEV_WORKFLOW](DEV_WORKFLOW.md)、[merge evidence設計とrollout](agent-guidance/merge-evidence.md)、[D-033/D-063と後継判断](decision-log.md)。初回Actions Enableと旧CIの実績はarchive/過去PRの記録を参照する。
