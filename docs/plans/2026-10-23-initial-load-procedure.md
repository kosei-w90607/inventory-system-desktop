# Plan Packet: 店の PC で本物のデータを入れ始める初期投入の手順を決める

wave に属さない単独の lane（2026-10-23 に同時に起票した 2 本の 1 本。もう 1 本は操作ログの保持の lane `docs/plans/2026-10-23-oplog-retention.md`〈別の branch〉。docs だけ）。導入の前の関門の candidate「初期投入の手順」（[Plans の導入の前の関門](../Plans.md#導入の前の関門)、`docs/backlog.md` の同名の項目、owner の決定 repo 外の回答台帳 TD-345）を、関門に足す前提で起票する（owner の決定 repo 外の回答台帳 TD-402、2026-10-23）。

規模と手法（起票の最初に数えた）: 触る file は 3（新しい管理者の手順書 `docs/initial-load-runbook.md`、`docs/PROJECT_HANDOFF.md` の案内の 1 行、`docs/backlog.md` の「初期投入の手順」の項目）と本 packet と Test Design Matrix（`docs/plans/test-matrices/2026-10-23-initial-load-procedure.md`）。設計正本（function-design・db-design・SCREEN_DESIGN・ADR・decision-log）・code・migration・wire の型は 0。手順書は既存の契約（26 §18.3、30 §4.8・§4.9 と BIZ-01-D5・D6・D8、60 UI-01c、master-tables の departments と独自コードルール、ADR SPEC-STK-CNT-D3・D4、68 §68.4、71 §71.5、D-123）を引いて並べ、正本に無い管理者の判断（行の種類の分け方、CSV の側の確かめ、予行演習、取り込む前の backup と照合、照合が合わないときの戻し方、入れた後の誤りの直し方）を足す。その組は下の Contract Ledger。手法: 1 lane のまま（手順書 1 つで、正本も code も変えないので分ける境が無い）。

## Workflow State

- Phase: plan-gate
- Risk: R4
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（本 run の起草役）
- Plan Reviewer: fresh Opus 5.5 + Codex（座組表 docs/AGENT_OPERATING_MANUAL.md ## 座組 どおり）
- Final Reviewer: Fable 5.1（Claude 側。座組表の「R3 以上と design lane で Fable 5.1」）+ Codex（座組表どおり）
- Final Review Minimum: 2
- Human Gate: ready,merge,r4
- Branch: agent/initial-load-procedure

遷移の記録:

1. kickoff → spec-check（2026-10-23、起草役）: 発注書の範囲（店の PC で本物のデータを入れ始める最初の手順〈商品・初期在庫・部門・設定・最初の backup〉の正本の置き場と、アプリの側に足りない機能があるか）を範囲にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-23、起草役）: 引く正本（上の規模と手法の一覧）は各機能の契約として足りるが、初期投入を 1 つに並べた手順が無い（30 BIZ-01-D8 は「Excel から作る CSV の換算は初期投入の作業の範囲」とだけ書く）。手順書を新しく置く。
3. design → plan-draft（2026-10-23、起草役、同じ commit）: 条件「設計の出力が正本にある」は、手順書 `docs/initial-load-runbook.md` を同じ plan-first の変更に置いて満たす（docs だけの lane の先例 `docs/archive/plans/2026-10-17-msi-distribution-docs.md` と同じ形）。条件「未解決の設計の問いが無い」は、owner の判断が要る 4 問（下の Review Focus の owner の判断事項）に全ての選択肢と推奨を並べ、推奨を既定として手順書を書き、答えで変わる所を手順書の表の「変わる所」に名指したことで満たす（owner の方針、repo 外の回答台帳 TD-401、2026-10-23）。実機でしか分からない点（P1・P2）は手順書に「未確認」と書き、予行演習で確かめる。
4. plan-draft → plan-gate（2026-10-24、Coordinator の代行）: 条件「packet complete and committed; Test Design Matrix committed for R3」は、packet・Matrix・手順書が起草役の commit `fac7575b` にあり、packet が template の全節と R3 の Contract Ledger・Data Safety・Contract Probe・Design Readiness を持つことで満たす。発注の直前に AC1〜AC6・AC8・AC9 の command を逐語で実行し、上の実測と同じ値（AC1 は exit 0・WARN 12 件、AC2・AC9 は exit 0）を確かめた。Contract Probe の P1・P2 は未実施で、Plan Gate（plan-approved）の前に要るかは Plan Review の問いに渡す。branch の起点 `eed07d37` の後に main が進んだ（#191・#195・#199・#200。`docs/backlog.md` が衝突する）ことは、base 同期の要否とともに Coordinator が決める。Plan Review round 1 へ出す。
5. plan-gate のまま是正（round 1、2026-10-24、起草役、本 commit）: round 1 の是正（Review Response 参照）。Risk を R4 に上げ（Final Review Minimum 2、Human Gate に `r4`）、Contract Probe の P2 を repo の中で回して記録した。手順書の方向（1 つの手順書、今のアプリのまま）は変えないので plan-gate に留め、round 2 で再 review する。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（起票の時点） | 3（R4 の承認 1、Ready 1、merge 1） | 3 | 6 = 0 + 3 + 3 |

owner の判断事項 J1〜J5 は既定で進め、本 lane の完了に答えを要らない（答えが出れば手順書の該当の行を直す）ので、見込みに数えない。手順書の予行演習（流れ 2）と店の PC での投入（流れ 3）は、初回の導入の版ができた後の運用で、本 lane の L3 ではない（下の Risk）。

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R4

Reason:
手順書は店の本物のデータを入れる最初の手順で、取り込む前の backup を店の DB へ復元する判断（照合が合わないとき、その日に照合を終えられないとき）と、在庫 Excel から作った本物の商品 CSV を開発用の Windows に置いて予行演習する手順を定める。`docs/DEV_WORKFLOW.md` Risk Tiers の R4 の行（「backup restore, real POS/store data exposure」）に当たる。docs だけでも契約を決めるので R4 にする（先例: docs だけの backup の PC の外の控えの lane `docs/archive/plans/2026-10-07-backup-offsite.md` も R4）。入れた商品の記録は商品コードに積もって後から変えられず（SP-102-04、INV-8）、リリースの後は DB を作り直さない（D-123 (5)）。code・設定・DB・command の DTO・画面・merge gate は変えない。R4 の要件: R3 の Contract Ledger・Data Safety・Contract Probe・Test Design Matrix・Design Readiness に加え、Final Review Minimum 2、Human Gate `r4`、下の Rollback / recovery notes。classifier の workflow の path（`scripts/ci/classify-changes.sh`）に当たる file を Scope に持たない（下の AC の実測）。

Rollback / recovery notes（R4、`docs/DEV_WORKFLOW.md` Risk Tiers の R4 の行）: 本 lane は docs だけで、merge の後に戻すときは本 lane の commit の revert で足りる（code・DB・設定に触れない）。手順書が店の DB に対して持つ戻し方は 1 つだけで、業務の入力を始める前に、同じ日に作った取り込む前の backup をアプリの復元（68 §68.4。戻す前に今の状態の backup を自動で作る）で戻す（手順書の流れ 3 の手順 7）。その戻し方で商品と入出庫の記録が 0 件に戻ることは Contract Probe の P2 で code の上で確かめた。業務の入力を始めた後は戻さず、手順書の「入れた後に誤りを見つけたら」の表で直す。

L3 について: 本 lane の成果物は手順書で、画面も振舞いも変えないので、Windows native で確かめる本 lane の項目は無い。手順書の予行演習（流れ 2）は、初回の導入の版（Plans の導入の前の関門の confirmed を全部満たした版）と在庫 Excel の写しが揃った後に行う。MSI の予行演習 M1〜M8 は PR #191 で済んだので、同じ日に MSI の試験用のデータを使うときの境は手順書の流れ 2 の冒頭が持つ。

## Goal

Goal Invariant:

### 最小完了条件

- owner が `docs/PROJECT_HANDOFF.md` から辿れる 1 つの手順書で、在庫 Excel から商品 CSV を作る・予行演習で通す・店の PC で入れる・照合する・最初の backup を作る、を順に実行でき、各手順で何を確かめるか、合わなければ何をするかが分かる。
- owner の判断が要る所は既定と選択肢と「変わる所」が手順書にあり、答えが無くても手順を進められる。
- アプリの側に足りない機能があるかの答え（今のアプリで手順は成り立つ。黙って入る 2 つの形をプレビューで止めるかは手順書の J5 で owner に諮り、後続の候補は backlog）が、手順書と backlog の項目に書かれている。

### 失敗定義

- 業務の入力を始めた後に、取り込む前の backup へ戻すように読める（その後の入力が消える）。
- 入れた後のやり直しを DB の作り直し（22 §16 の作り直しの手順）で行うように読める（D-123 (5)）。
- 照合が合わないのに業務の入力を始めるように読める、または取り込む前の backup を作らずに取り込むように読める。
- プレビューにエラー行があるまま取り込み、一部の行だけが入るように読める（30 §4.9 は正常な行だけを入れる）。
- 店の運用の細部・在庫 Excel の中身・店のデータを repo に書く。

### 非目的

- アプリの変更（商品 CSV の取込みの検査を足す、Excel を直接読む、売価の換算を持つ等）。必要なら後続の lane（backlog）。
- 予行演習と店の PC での投入を本 lane で行う。
- 部門の初期データを変える（必要なら手順書の止まる所から別の lane）。
- PLU をレジへ書く手順（導入の前の関門の precondition-dependent の項目）、SD 直読み・日報の取込みの始め方。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

管理者（owner）の作業の列。アプリの中の操作は変えない。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 年末の棚卸しで埋めた在庫 Excel がある（J3 の既定） | 手順書の流れ 1（行の種類に分ける → 列を作る → 表で確かめる → CSV で保存 → SHA-256） | 商品 CSV と行の種類ごとの数 | 「どれにも当たらない」行と接頭辞の無い部門の独自コードの行が 0、`商品コード` が 13 桁の数字で `JANコード` が違う行が 0（表の全部の行を数える）、保存した file の `E+` が 0 件、上限を超える行が 0 | P1（Excel の CSV の保存の形。外れても手順 4・5 の確かめで止まる） |
| 初回の導入の版の MSI と CSV がある | 流れ 2（開発用の Windows で、開発のデータの folder を退避した空の DB に、取り込む前の backup → 取込み → 照合 → 復元で 0 件に戻る） | 同じ CSV と版で店の PC と同じ結果になることが分かる | プレビューのエラー行と重複行が 0、照合が全部合い、復元で 0 件に戻る | P2（code の上で確かめた。画面の上は手順 7） |
| 店の PC に MSI が入り、商品が 0 件（MSI の手順書の流れ 2 の後） | 流れ 3（写して SHA-256 → 取り込む前の backup を 2 か所へ → 取込み → 開き直し → 照合 → 設定 → 最初の backup） | 店の PC で本物の商品と初期在庫が入り、業務の入力を始められる | 手順 2〜7 を同じ日に行い、照合が全部合う。合わないかその日に終えられなければ入力を始めずに取り込む前の backup へ復元し、合わなければ流れ 1 から | P2（code の上で確かめた） |
| 業務の入力を始めた後に誤りが見つかった | 「入れた後に誤りを見つけたら」の表 | 画面か CSV の上書きか計数で直す。直せない誤り（商品コード・単位の種類）は止めて owner に諮る | — | なし |

この lane で完了するのは「手順書が置かれ、owner が辿れる」まで。店の PC での投入は初回の導入の版と予行演習の後で、v1.0 の通常運用の達成はそれらを含む。

## Scope

- `docs/initial-load-runbook.md`（新規）: なぜ 1 度で入れ切るか、今の事実の表（repo の現物で確かめた出所つき）、入れる前に決めること（J1〜J5 の選択肢・既定・変わる所）、流れ 1（商品 CSV を作る）・流れ 2（予行演習）・流れ 3（店の PC で入れる）、入れた後に誤りを見つけたら。
- `docs/PROJECT_HANDOFF.md`: 案内の表に手順書の行を 1 行足す（template の Registration / Generation Obligations「source / workflow doc 新設」）。
- `docs/backlog.md`: 「初期投入の手順」の項目を、手順書への案内・業務の入力の前後の戻し方・残る作業に置き換え（「設計が無い」と「決めること」の列挙を外す）、後続の候補（プレビューが名指しで止める、J5 の b）の行を置く。他の行は変えない。
- `docs/plans/test-matrices/2026-10-23-initial-load-procedure.md`（新規、R4 の Test Design Matrix）: 手順の分岐ごとの期待と、それを壊す誤った読み。

型・JSON・関数・DTO の形は変えない（作る所・読む所・fixture・test の呼び方の列挙は不要）。

決めたこと（発注書の「決めること」）:

- 正本の置き場: 管理者の手順書 `docs/initial-load-runbook.md`。function-design には置かない。理由: 手順は 1 度きりの管理者の作業の列で、26・30・60・68・71・master-tables・ADR の契約を横に並べる。function-design の各 file は 1 つの module の契約を持つ所で、手順を置くと各 file に同じ列を写すか、1 つの file に他の module の手順が入る。先例は MSI の手順書（同じ管理者の手順で、PROJECT_HANDOFF から辿る）。
- アプリの側に足りない機能: 今の商品 CSV の取込み（新規の行の初期在庫の記録、CSV の中の重複の拒否、エラー行の除外、独自コードの番号を画面の発番が飛ばす D-106）と backup の復元で、手順は成り立つ（Contract Probe の P2）。ただし黙って入る形が 2 つある（`商品コード` が 13 桁の数字なのに `JANコード` が違う・空の行、`商品コード` が指数の形の行。preview で正常な行になり error も warning も出ない。P2 の probe で確かめた）。「問題は起きた画面で名指しする」（D-127 (2)）の形はプレビューが名指しで止めることで、手順書の確かめはその代わりの守りにとどまる。この食い違いは手順書の J5 として owner に諮る: 既定 a は手順書の機械の確かめ（流れ 1 の手順 4 の全部の行を数える確かめの列、手順 5 の file 全体の `E+` の検索）で取り込む前に止める。推奨 b はプレビューが名指しで止める形を初回の導入の版に入れる（アプリの変更で別の lane。AI の調べから出た要件なので出所を書き、owner の確認の前に必須にしない。AGENTS.md の Working Rules の「owner の所感は原文で扱う」の項）。どちらでも、手順書の確かめは取り込む前に全部の行を見るので、黙って入ることは無い。

他の lane との所有（`docs/DEV_WORKFLOW.md` Wave Operation。open の PR #172・#188・#190・#191・#192・#193・#194 の差分〈#188 は packet の Scope、#194 は PR body の Scope〉と本 lane の予定の path を `comm -12` で突き合わせた。下の AC の実測）:

| file | 節 | 所有 |
|---|---|---|
| `docs/backlog.md` | 「初期投入の手順」の項目とその下の箇条 | 本 lane |
| `docs/backlog.md` | それ以外の項目（SD 直読みの runtime〈#172〉、PC の外の控えの runtime と保存と起動の守り〈#190〉、部門 12 の初期データ〈#192 が足す〉、#188 の Scope の各項目を含む） | 各 lane（本 lane は触らない） |
| `docs/PROJECT_HANDOFF.md` | 案内の表の手順書の行 | 本 lane（他の PR の差分と Scope に無い） |
| `docs/initial-load-runbook.md`・本 packet・Matrix | 全体 | 本 lane（新規） |

この変更で不要になる記述・条件・code（D-127 の問い）: backlog の「初期投入の手順」の項目の「設計が無い」と「決めること」の列挙（手順書の J1〜J5 と重なり、原価の 1/100 円は PR #184 で済んだ）と「入れた後のやり直しは DB の作り直しになり」は、手順書への案内と残る作業に置き換えた（上の Scope）。30 BIZ-01-D8 の「Excel から作る CSV の換算は初期投入の作業の範囲で、本契約は CSV の値をそのまま読む」は今も正しく（換算は手順書の流れ 1 の手順 3）、#188 が 30 を触るので本 lane は変えない（手順書が 30 を引く）。MSI の手順書（#190・#191 が触る）と 22 §16 の作り直しの手順の「6. 初期投入をやり直す」（開発・試験 DB の作り直しの手順で、店の DB に当てない）は変えない。

## Non-scope

- 設計正本（function-design・db-design・SCREEN_DESIGN・ADR）、`docs/decision-log.md`（新しい決定は無い。予約の D-135 は使わない。手順書が足した判断は手順書に置き、Contract Ledger で引く正本と組にする）。
- `docs/msi-distribution-runbook.md`（流れ 2 の後に本手順書へ進むことは本手順書の「いつ使うか」が書く）、`docs/Plans.md`（D-097。関門の candidate の行は owner が関門に足すときに動く）。
- code・設定・migration・bindings。
- 予行演習の実施、店の PC での投入。

## Acceptance Criteria

- AC1: `bash scripts/doc-consistency-check.sh` が exit 0（ERROR なし）。起票の前の baseline（2026-10-23、本 branch の起点 `eed07d37`）: exit 0、`結果: WARN 12 件（ERROR なし）`（WARN は既存の `cost_price` 系の DB_DESIGN の未定義）。
- AC2: `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-23-initial-load-procedure.md` が exit 0。
- AC3: `rg -n 'initial-load-runbook.md' docs/PROJECT_HANDOFF.md docs/backlog.md` が両 file で hit する。baseline（`eed07d37`）: `rg exit=1`。
- AC4: `rg -n '^## ' docs/initial-load-runbook.md` が「なぜ 1 度で入れ切るか」「今の事実」「入れる前に決めること」「流れ 1」「流れ 2」「流れ 3」「入れた後に誤りを見つけたら」を出す。baseline: file が無い（`rg exit=2`）。
- AC5: `sed 's/。/。\n/g' docs/initial-load-runbook.md | rg -n '作り直' | rg -v '作り直さない|作り直しで行わない|作り直しの範囲'` が何も出さない（後ろの `rg` の exit 1。文ごとに分けてから除くので、同じ行の別の文に隠れない）と、`rg -c '入れた後のやり直しを DB の作り直しで行わない' docs/initial-load-runbook.md` が `1`。入れた後のやり直しを DB の作り直しで行う文が無く、行わない文があることを見る（Goal の失敗定義の 2 行目）。
- AC6: `rg -c '全部が合ったときだけ業務の入力を始める' docs/initial-load-runbook.md` が `1`（流れ 3 の手順 7）と、`rg -n '業務の入力を始めた後は、取り込む前の backup へ戻さない' docs/initial-load-runbook.md` が 1 行（Goal の失敗定義の 1・3 行目）。
- AC7（読んで確かめる、`docs/initial-load-runbook.md` の「入れる前に決めること」と流れ 2・3）: 手順書の J1〜J5 の各行に選択肢・既定・変わる所があり、「変わる所」が指す手順の番号が実在する。「未確認（P*n*）」が packet の Contract Probe の行を指す。流れ 2 の手順 4 と流れ 3 の手順 3 が、エラー行と重複行が 0 のときだけ取り込む（Goal の失敗定義の 4 行目）。
- AC8: `git diff --name-only $(git merge-base origin/main HEAD) HEAD` が本 lane の 5 file（手順書・PROJECT_HANDOFF・backlog・本 packet・Matrix）だけを出す（店のデータの file が無い。main から取り込んだ変更を数えない）。
- AC9: `bash scripts/check-workflow-git.sh` が exit 0。

実測（commit の前、2026-10-23。各 command を逐語で実行した。AC8・AC9 と commit の後の値は PR body の Validation に書く）:

```text
AC1  bash scripts/doc-consistency-check.sh   → 起票の前 exit=0、結果: WARN 12 件（ERROR なし）
AC3  baseline: rg exit=1 / 起票の後: docs/backlog.md:65 と docs/PROJECT_HANDOFF.md:15 が hit
AC4  baseline: rg exit=2（file が無い）/ 起票の後: 8 なぜ 1 度で入れ切るか / 14 今の事実 / 41 入れる前に決めること /
     52 流れ 1: 商品 CSV を作る / 81 流れ 2: 予行演習 / 96 流れ 3: 店の PC で入れる / 110 入れた後に誤りを見つけたら
AC5  （出力なし）rg exit=1
AC6  rg -c → 1
```

実測（round 1 の是正、2026-10-24、commit の前）:

```text
AC5  原文: 出力なし rg exit=1、rg -c → 1
     mutation（$TMPDIR の写しで「作り直しで行わない」→「作り直しで直す」）: 20:入れた後のやり直しを DB の作り直しで直す。（exit=0、red）、rg -c → exit=1（red）
     同じ mutation に round 1 の前の AC5（行ごとの除外）: 出力なし exit=1（green のまま。round 1 の finding の再現）
AC3  docs/backlog.md:62 と docs/PROJECT_HANDOFF.md:15 が hit
AC4  8 なぜ 1 度で入れ切るか / 14 今の事実 / 42 入れる前に決めること / 54 流れ 1: 商品 CSV を作る / 86 流れ 2: 予行演習 /
     101 流れ 3: 店の PC で入れる / 117 入れた後に誤りを見つけたら
AC6  rg -c → 1、119 行目が hit
AC8  git merge-base origin/main HEAD → 843c49385d43eb93142e572467e61cb40573cd12、5 file（docs/PROJECT_HANDOFF.md・docs/backlog.md・docs/initial-load-runbook.md・本 packet・Matrix）
     bash scripts/ci/classify-changes.sh（既定の merge-base の差分）→ docs=true workflow=false unknown=false（他は false）
```

## Design Readiness

- 引く設計正本（節まで）: 26 §18.3（文字コード・ヘッダ・改行・引用符）、30 §4.8（必須列・行の検証・CSV の中の重複・既存のコードは重複行）・§4.9（1 つの TX、新規の行の初期在庫の記録、`PLU対象` の既定の導出、next_seq を進めない）・BIZ-01-D5（100 文字）・BIZ-01-D6（D-106、CSV の番号を画面の発番が飛ばす）・BIZ-01-D8（単位・`m` の初期在庫・原価の 1/100 円・Excel の税抜の換算は初期投入の作業）、30 の「計数の置き場と在庫の求め直しの契約」（初期在庫の movement、共有 JAN）、60 UI-01c-D5〜D8・D15・D16（プレビュー・重複の既定スキップ・上書きの確認・エラー行の除外・20MB・PLU対象）、master-tables の departments（初期データ 21 部門、独自コードルール C-1、SP-102-04）、10-common-rules の INV-8、ADR SPEC-STK-CNT-D3（初期在庫はどの計数よりも前）・D4（共有 JAN は在庫連動の外）、32 §15 の実データ行のマスタ照合（`jan_code` で引き当てる）、68 §68.4（手動バックアップ・復元と戻す前の自動の backup・PC の外の控え）、71 §71.5（保持日数での削除）・§71.13（別の PC に店のデータを置く扱い）、D-075（取引先を一括で入れない）、D-076（長く動いていないコードの無い品）、D-119（個数の単位どうしの直し）、D-123 (4)・(5)、D-128（原価は税抜）、MSI の手順書の流れ 2 と「予行演習の準備と片付け」。
- 必要な設計成果物: Design artifact selection の当たる行は無い（振舞い・command・DB・画面・format を変えない）。管理者の手順書を新しく置く（updated in this PR、`docs/initial-load-runbook.md`）。
- plan にしかない durable な判断の昇格先: 無い。手順書が足した判断（行の種類の分け方、CSV の側の全部の行の確かめ、予行演習を開発のデータの folder を退避した空の DB で通す、取り込む前の backup を 2 か所へ写す、取り込む前の backup から照合までを同じ日に行う、エラー行と重複行が 0 のときだけ取り込む、照合が全部合うまで業務の入力を始めない、合わないかその日に終えられなければ取り込む前の backup へ復元する、業務の入力を始めた後は戻さない、直せない誤りは止めて owner に諮る）は手順書に置き、引く正本との組を Contract Ledger に置く。J1〜J5 の既定は手順書の表に置き、owner の答えで直す。
- 前提・制約と延期した gap: 予行演習と投入は初回の導入の版（Plans の導入の前の関門の confirmed を全部満たした版）を待つ。延期しても安全な理由: 手順書は予行演習を通すまで店の PC に入れないと書く（流れ 3 の前提）。黙って入る 2 つの形をプレビューで名指しで止めるか（D-127 (2) との食い違い）は J5 として owner に諮る。答えが無い間も、手順書の確かめ（流れ 1 の手順 4・5）が表と file の全部の行を見て取り込む前に止めるので、黙って入らない（上の Scope の「アプリの側に足りない機能」）。
- 絶対保証の自己点検: 「取り込む前の状態に戻る」は、業務の入力を始める前に限り、同じ日に同じ版で作った backup をアプリの復元で戻す場合に限って書いた（68 §68.4 の復元は戻す前に今の状態を自動で backup する。商品と入出庫の記録が 0 件に戻ることは Contract Probe の P2）。「直せない」は商品コード（SP-102-04）と単位の種類をまたぐ変更（30 BIZ-01-D8）に限った。
- 判定: ready（J1〜J5 は既定で手順が成り立ち、答えで変わる所を手順書が名指す。owner の方針 TD-401）。

## Contract Audit（新しく足す契約の文の境界の一巡）

発注書の境界の 4 観点で、手順書が新しく書いた文を一巡した。

| 観点 | 手順書の文 | 確かめたこと |
|---|---|---|
| 安全な整数の範囲 | 流れ 1 の手順 4「上限を超える行があれば止める」、今の事実の売価・原価・初期在庫の行 | 上限は 30 BIZ-01-D8 と共通規則の「入力の上限と安全な整数の範囲」の値（売価 999999、原価 999999.99 円、初期在庫 999999999、`m` は cm にした後）をそのまま写した。税込への換算（J1）の後の売価も同じ上限で確かめる（手順 4 は換算の後の表で確かめる） |
| 0 の表示 | 今の事実の初期在庫「空は 0」、流れ 1 の手順 4 の 0 の行の一覧 | 空と 0 は取り込んだ後に区別できない（どちらも初期在庫の記録を作らない、30 §4.9）。数えていない行と 0 個の行を分けたいときは CSV の側の一覧（手順 4）で分ける。売価・原価の 0 は受理される（0 以上）ので、黙って入らないよう owner が予行演習で一覧を見る |
| 失敗の時点と順序 | 流れ 2 の手順 4、流れ 3 の手順 2〜7 | プレビューは DB を変えない（30 §4.8）。確定は 1 つの TX だが、エラー行を除いて正常な行だけを入れる（30 §4.9、UI-01c-D8）ので、エラー行が 0 のときだけ取り込む。取り込む前の backup は取込みの前（手順 2）、2 か所への写しが失敗したら取り込まない。照合（手順 6）は業務の入力（手順 7）の前。戻すのは業務の入力の前だけ |
| 単位や種類の混在 | 流れ 1 の手順 3、今の事実の在庫単位・初期在庫・原価・売価の行 | `m` の初期在庫は m の数（cm にしない）、個数の単位は整数、原価は税抜の円で小数 2 桁まで（1/100 円にしない。アプリが直す）、売価は税込の円の整数（Excel の税抜から J1 で換算）、税率は文字列 `10`・`8`・`0`。商品コードと JAN の数字は文字列の書式で書く（指数の形にしない） |

round 1 の是正で足した文（流れ 1 の手順 2〜5、流れ 2 の冒頭と手順 2、流れ 3 の前提の後の段落、入れた後の表の JAN の行）の一巡:

| 観点 | 手順書の文 | 確かめたこと |
|---|---|---|
| 安全な整数の範囲 | 流れ 1 の手順 3 の `税抜 × (100 + 税率) ÷ 100` | 税抜の売価（円の整数）に 100〜110 を掛けた値は約 1 億までで、Excel の数（倍精度）で誤差なく表せる。100 で割った後に J1 の規則で円の整数にし、換算の後の売価は手順 4 で上限（999999）と比べる。整数を掛けてから割るので、`× 1.1` の形の誤差（割り切れる値を少し超えて切り上げで 1 円上がる）が出ない |
| 0 の表示 | 流れ 1 の手順 4 の確かめの列、手順 5 の `E+` の検索 | 合格は「TRUE の数が 0」「`E+` が 0 件」で、0 が合格の値。`JANコード` の空は「違う」に数える（空を含む）。`商品コード` の空の行は確かめの列に当たらないが、取込みが行の error にする（30 §4.8）ので流れ 2 の手順 4 で止まる |
| 失敗の時点と順序 | 流れ 1 の手順 4・5、流れ 3 の前提の後の段落 | 表の確かめ（手順 4）→ 保存 → file の `E+` の検索と行の数（手順 5）→ SHA-256 の順で、SHA-256 は確かめた後の file の値になる。取り込む前の backup から照合までは同じ日で、その日に終えられなければ業務の入力の前に復元してから閉じる（保存先の中の backup は file 名の日付から数えた日数が保持日数を超えた日に消える〈`cleanup_old_backups` の `age.num_days() > retention_days`〉ので、作った日のうちは一覧にある） |
| 単位や種類の混在 | 流れ 1 の手順 2 の表、手順 4 の確かめの列 | 行の種類は上から順に当てはめ、1 行が 2 つの種類に入らない（同じ 8 桁の JAN の 2 行は共有の群に入り、8 桁の種類に数えない）。確かめの列は 13 桁で数字だけの `商品コード` に当たり、`-` を含む独自コードは数字でないので当たらない。部門 11・12 は `部門ID` で分ける |

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| source / workflow doc 新設 | 親文書の目次・索引を更新 | `docs/PROJECT_HANDOFF.md` の案内の表に 1 行（Scope） |

ほかの行（Tauri command、function-design doc、REQ、route、operator 画面）は該当なし。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | 外部の adapter と app-core の境 | — | 不該当: レジ・POS の adapter に触れない（Z004 の引き当てを今の事実として引くだけ） | なし |
| Fact check / design decision split | 観測した事実とアプリの判断の分け | 手順書の「今の事実」と「入れる前に決めること」 | 当たる: repo の現物で確かめた事実を出所つきで表にし、Excel の振舞いは P1 の未確認に、owner の判断は J1〜J5 に分けた | 予行演習（手順書の流れ 2） |
| Lifecycle / retry | 前・中・後・失敗の後 | 手順書の流れ 2・3 | 当たる: 取り込む前の backup、プレビューのエラー行で取り込まずに直す、照合が合わなければ復元して流れ 1 から、業務の入力の後は戻さない | Test Design Matrix の State Lifecycle Matrix |
| Operator workflow | 実際の順序 | 手順書 | 当たる（管理者の作業）: Excel → CSV → 予行演習 → 店の PC → 照合 → 設定 → 最初の backup。店の利用者の操作にしない | なし |
| Replacement path | 外部の系が変わったとき | — | 不該当: 取込みの形式を変える判断は無い | なし |
| Data safety / evidence | 店のデータを repo に入れない | 手順書の流れ 1 の冒頭、Data Safety | 当たる: 在庫 Excel・CSV・backup は repo の外、記録は管理者の保管場所。予行演習の folder の消す時期は owner | なし |
| Reporting / accounting semantics | 集計の意味 | 手順書の J3 | 当たる: 初期在庫の数を数えた日と入れた日の差、レジが部門キーで売る間の差は、次の計数で棚卸しの差として出る（店主の許容はロスの範囲、project-memory の利用者の節）。評価額の計算は変えない | なし |
| Manual verification | 自動 test で示せない主張 | 手順書の流れ 2 | 当たる: Excel の CSV の保存（P1）と、Windows の画面の上の復元で 0 件に戻ること（P2 は code の上で確かめ済み）は予行演習で確かめる。本 lane の L3 ではない | 予行演習 |
| 環境・再現性 | 新しい環境依存の pin | — | 不該当: 新しい環境依存を足さない（Excel は店と開発用の PC の既存の道具） | なし |

## Boundary / Wire Contract

変えない。商品 CSV の形（26 §18.3、30 §4.8）を引いて CSV を作る手順を書くだけで、JSON・CSV の形・config・DTO・bindings・DB に触れない。

## Test Plan

Test Design Matrix: [2026-10-23-initial-load-procedure](test-matrices/2026-10-23-initial-load-procedure.md)（手順の分岐ごとの期待と、それを壊す誤った読み。自動 test は足さない）。

- targeted tests: 無い（code を変えない）。手順が引く振舞いの既存の自動 test は Matrix の Evidence に `rg` で確かめた名で書いた。
- negative tests: AC5・AC6（失敗定義に当たる文が無い・ある）、AC7 の読み取り。
- compatibility checks: AC1・AC2 の doc 検査（R3 以上の Markdown link の実在を含む）。
- data safety checks: AC8。手順書と packet に店の運用の細部・在庫 Excel の中身・金額・商品名を書かない。
- main wiring/integration checks: AC3（案内から辿れる）。

## Review Focus

- Goal の失敗定義の 5 行に当たる記述が手順書に無いか。特に流れ 3 の手順 7（照合が合わないときの復元）が、業務の入力の前に限られ、D-123 (5) の「作り直さない」と食い違わないか（復元は同じ版の backup をアプリの中で戻す操作で、22 §16 の作り直しの手順〈data の folder を移して空の DB から〉ではない、という読みの当否）。
- 今の事実の表の各行が出所（code・正本の節）と合っているか。特に `JANコード` を `商品コード` から補わないこと（`commit_import`）、`PLU対象` の既定の導出、`POS在庫連動` の共有 JAN の拒否が D-118 の (b) を含む版だけであること。
- 行の種類の表（流れ 1 の手順 2）が、共有 JAN の群（TD-352、ADR SPEC-STK-CNT-D4）・8 桁の JAN（J4）・コードの無い行（J2）・どれにも当たらない行を漏れなく分け、どの行も黙って入らないか。
- アプリの側に足りない機能が無いという判断と、後続の候補（preview の warning）の当否。この変更で不要になる記述・条件・code が他に無いか。
- owner の判断事項（owner の方針 TD-401 のとおり、推奨を既定にして書き進めた。答えで変わる所は手順書の表の「変わる所」の列）:
  - J1 税抜の売価を税込へ換える丸め: a 切り捨て / b 四捨五入 / c 切り上げ / d 値札の税込の値を Excel の別の列に入れて使う。推奨 a（precondition-dependent: 予行演習で値札と照らし、1 件でも違えば全件が合う規則か d へ替える。手順書がこの切替えを持つので、答えが無くても誤った売価のまま入らない）。変わる所: 流れ 1 の手順 3 の `売価`。
  - J2 JAN もコードも無い行: a 部門の接頭辞で独自コードを振って入れる / b 入れずに後で画面から登録する。推奨 a（candidate: 数えた在庫を初日から持てる。画面の発番は CSV の番号を飛ばす〈D-106〉）。変わる所: 流れ 1 の手順 2 の表。
  - J3 初期在庫の数と最初の計数: a 年末の在庫 Excel の数を入れ、最初の計数は次の年末（アプリ）/ b 入れる直前に数え直す / c 初期在庫を空で入れアプリの棚卸しで数える。推奨 a（candidate: 年末の棚卸しは在庫 Excel を埋めれば終わる〈TD-347〉。差は次の計数で棚卸しの差として出る）。変わる所: 流れ 1 の手順 3 の `初期在庫`、流れ 3 の手順 9 の記録。
  - J4 8 桁の JAN の商品の商品コード: a 8 桁を商品コードにする / b 独自コードを振り 8 桁は `JANコード` に入れる。推奨 b（candidate: 商品コードは後から変えられず、`JANコード` は CSV の上書きで直せる）。変わる所: 流れ 1 の手順 2 の表。
  - J5 黙って入る 2 つの形（`商品コード` が 13 桁の数字で `JANコード` が違う・空の行、`商品コード` が指数の形の行）をどこで止めるか: a 手順書の機械の確かめ（流れ 1 の手順 4・5）で止める / b 商品 CSV のプレビューがその行を名指しで止める形をアプリに入れ、初回の導入の版に含める（導入の前の関門に足す、別の lane）。推奨 b（precondition-dependent: D-127 (2) の「起きた画面で名指しする」形。AI の調べから出た要件なので owner の確認を前提にする）。答えが無い間の既定は a（今のアプリで手順が成り立ち、全部の行を見るので黙って入らない）。変わる所: 初回の導入の版の条件、流れ 1 の手順 4・5。
- Risk を R4 にした理由（店の DB への backup の復元の判断と、本物の商品 CSV を開発用の Windows に置く手順。Risk Tiers の R4 の行）の当否。

## Contract Ledger

手順書が足した判断（「実装（Scope）」の列の手順書の箇所）と、それが引く正本の契約の組。手順書は正本を変えない（Non-scope）。触る正本の節の隣接の契約は sweep して、Scope が触り得るものを足すか除外を書いた（最後の 3 行）。Matrix の C*n* は Test Design Matrix の Contracts Under Test。

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| IO-03 の文字コード・ヘッダ・改行の扱い | 26 §18.3 | 今の事実の文字コード・列の行、流れ 1 の手順 5（CP932 で保存、メモ帳で桁を見る）（Matrix C6） | 既存（`src-tauri/src/io/product_csv_importer.rs` の test。Matrix の Evidence） | 予行演習で P1 |
| BIZ-01 の preview の必須列・行の検証・CSV の中の重複・既存のコード | 30 §4.8 の手順 3〜5、BIZ-01-D5 | 今の事実の列・商品コードの行、流れ 2 の手順 4 と流れ 3 の手順 3（エラー行と重複行が 0 のときだけ取り込む）（Matrix C3） | 既存（Matrix の Evidence） | 非対象（読み取り） |
| BIZ-01 の commit（1 つの TX、エラー行の除外、新規の行の初期在庫の記録、`PLU対象` の既定、`JANコード` を補わない、next_seq を進めない） | 30 §4.9、UI-01c-D8、30 の計数の置き場の契約 | 今の事実の確定・初期在庫の記録・JANコード・PLU対象の行、流れ 1 の手順 2 の表の `JANコード` の列（Matrix C2・C3） | 既存（Matrix の Evidence） | 非対象 |
| BIZ-01-D8（単位・`m` の初期在庫・原価の 1/100 円・Excel の換算は初期投入の作業） | 30 BIZ-01-D8、共通規則 SPEC-UNIT-D10、D-128 | 今の事実の売価・原価・在庫単位・初期在庫の行、流れ 1 の手順 3（Matrix C7） | 既存（Matrix の Evidence） | 非対象 |
| 独自コードの形と画面の発番（BIZ-01-D6、D-106）、接頭辞の無い部門 | master-tables の独自コードルール、30 BIZ-01-D6 | 流れ 1 の手順 2 の箇条（部門の接頭辞と 4 桁の番号、接頭辞が無ければ止める）（Matrix C4） | 既存（Matrix の Evidence） | 非対象 |
| 商品コードを変えない（SP-102-04）・商品を消さない（INV-8） | master-tables の「独自コードの接頭辞変更」、10-common-rules の INV-8 | なぜ 1 度で入れ切るか、入れた後に誤りを見つけたらの表（Matrix C5） | 非対象（読み取り） | 非対象 |
| 共有 JAN は在庫連動の外（SPEC-STK-CNT-D4） | ADR、30 の計数の置き場の契約、60 の同じ節 | 流れ 1 の手順 2 の表の共有 JAN の群の行（`POS在庫連動` = `0`）、今の事実の POS在庫連動の行（Matrix C4） | 非対象（D-118 の (b) の test。本 lane の範囲の外） | 非対象 |
| 初期在庫はどの計数よりも前（SPEC-STK-CNT-D3） | ADR の判定表の「商品の登録・一括 import の初期在庫」の行 | 今の事実の初期在庫の記録の行、J3（Matrix C8） | 既存（(a) の test。Matrix の Evidence） | 非対象 |
| Z004 は `jan_code` で商品に引き当てる | 32 §15 の実データ行のマスタ照合 | 今の事実の JANコード の行、流れ 1 の手順 2 の表の `JANコード` の列（Matrix C2） | 既存（Matrix の Evidence） | 非対象 |
| 手動バックアップ・復元と戻す前の自動の backup | 68 §68.4、71 §71.7 | 流れ 2 の手順 3・7、流れ 3 の手順 2・7（Matrix C1） | 既存（Matrix の Evidence）、Contract Probe P2（一時 test） | 画面の上は予行演習の手順 7 |
| 保持日数での削除 | 71 §71.5、`schema_v1.rs` の `backup_retention_days` | 流れ 3 の手順 2・9（保存先の外の 2 か所へ写す）（Matrix C1） | 非対象（読み取り） | 非対象 |
| リリースの後は作り直さない、初回の導入の版の条件 | D-123 (4)・(5) | なぜ 1 度で入れ切るか、流れ 1 の手順 2 と流れ 2 の手順 2（部門の初期データはリリースの前に直すのが安い。リリースの後は値を移す migration が要る）、流れ 2 の冒頭（初回の導入の版は Plans の導入の前の関門の confirmed を全部満たした版）（Matrix C1・C4・C9） | AC5 | 非対象 |
| 手順書が足した判断: エラー行と重複行が 0 のときだけ取り込む。取り込む前の backup から照合までを同じ日に行う。照合が全部合ったときだけ業務の入力を始める。合わないかその日に終えられなければ取り込む前の backup へ復元し、合わなければ流れ 1 から。業務の入力を始めた後は戻さない | 引く正本: 30 §4.9（エラー行を除いて入れる）、68 §68.4（復元）、71 §71.5 と `cleanup_old_backups`（file 名の日付から数えた日数が保持日数を超えたら消す）、D-123 (5) | 流れ 2 の手順 4、流れ 3 の前提の後の段落と手順 3・7、入れた後に誤りを見つけたら（Matrix C1・C3） | AC6、Contract Probe P2 | 非対象（読み取り） |
| 手順書が足した判断: 予行演習を同じ版・同じ CSV で開発用の Windows で、開発のデータの folder を退避した空の DB に通す。同じ日に MSI の試験用のデータを使うときはその片付けの後に始め、商品が 1 件でもあれば止める。片付けは MSI の手順書の「予行演習の準備と片付け」、店のデータの folder の消す時期は owner | 引く正本: MSI の手順書の確かめる項目と準備と片付け、71 §71.13 | 流れ 2（Matrix C9） | 非対象 | 予行演習で 1 度通す |
| 手順書が足した判断: 行の種類（上から順に当てはめる排他の種類。部門 11・12・共有 JAN の群・共有しない 13 桁 JAN・共有しない 8 桁 JAN・コード無しか JAN を使っていない・どれにも当たらない）と、どれにも当たらない行・`商品コード` が 13 桁の数字で `JANコード` が違う行・file の `E+`・上限を超える行で止める（表と file の全部の行を数える） | 引く正本: 30 §4.8 の手順 4（商品コードの形を検査しない）、master-tables の departments（部門 11・12 は在庫管理の対象外）と布の管理 5 パターン、TD-352、J2・J4・J5 | 流れ 1 の手順 2・4・5（Matrix C2・C4・C6） | 非対象（読み取り） | 非対象 |
| 隣接の除外: 取引先を一括で入れない（D-075）、長く動いていない品を商品にしない（D-076） | D-075・D-076 | 今の事実の取引先の行、J2 の既定（引くだけ） | 非対象 | 非対象 |
| 隣接の除外: JAN の別名（D-122、proposed・未実装）、PLU の書出し（33）、SD 直読み（D-111） | 30 §4.9.2、33、29 | 変えない（初期投入は新しい DB で重複行が無く、別名の問いは出ない。PLU をレジへ書く手順は導入の前の関門の precondition-dependent の項目） | 非対象 | 非対象 |
| 隣接の除外: 22 §16 の作り直しの手順の「6. 初期投入をやり直す」 | 22 §16 | 変えない（開発・試験 DB の作り直しの手順で、店の DB に当てない） | 非対象 | 非対象 |

## Contract Probe

R4 の Contract Probe（`docs/DEV_WORKFLOW.md` Plan Packet Rules）は、外部の前提に頼る計画で Plan Gate の前に最小の実験を求める。

- P1 Excel の「CSV（コンマ区切り）」の保存が CP932 で、文字列の書式の列を表示のまま（桁を落とさず）書く → 未実施。本 run の環境（WSL の上の起草役）には Excel が無い（`/mnt/c/Program Files/Microsoft Office`・`/mnt/c/Program Files (x86)/Microsoft Office` が無く、`WindowsApps` にも Office の名が無い）。手順は P1 に安全を頼らない: 文字コードの誤りは取込みが file ごと拒否し（26 §18.3、`test_parse_csv_req104_decode_failure`）、桁の崩れと指数の形は流れ 1 の手順 4（表の全部の行を数える確かめの列）・手順 5（保存した file の全体の `E+` の検索と行の数）が取り込む前に止める。P1 が外れたときに変わるのは手順を最後まで進められるか（保存の仕方を替える）だけで、最小の実験は Excel のある Windows で合成の 3 行（13 桁の数字・8 桁の数字・独自コード）を文字列の書式で保存してメモ帳で見ること。予行演習（流れ 2）の手順 4 の前に行う。
- P2 取り込む前の backup をアプリの復元で戻すと商品の無い状態に戻る → code の上で確かめた（2026-10-24、round 1 の是正、head `e9493279`）。一時 test を `src-tauri/src/mnt/backup.rs` の test module に置き（実行後に `git checkout` で外し、`git status --porcelain` は空）、`CARGO_TARGET_DIR=/tmp/shared-cargo-target cargo test --lib probe_pr196_p2 -- --nocapture` で回した。手順: `db::init_database` の空の DB → `create_backup`（取り込む前の backup）→ BOM の UTF-8 の 4 行の商品 CSV（13 桁の JAN を両方の列に持つ行、13 桁の数字の商品コードで `JANコード` が空の行、`4.97638E+12` の行、`m` の独自コードの行）を `preview_import` → `commit_import` → `restore_backup` → 開き直し。出力:

  ```text
  PROBE preview valid=4 error=0 dup=0
  PROBE after import created=4 products=4 movements=4 jan_null_for_13digit=1
  PROBE after restore products=0 movements=0 departments=21 app_settings=9
  PROBE after reopen products=0
  test result: ok. 1 passed; 0 failed
  ```

  復元で商品と入出庫の記録が 0 件に戻り、部門と設定の行の数は取り込む前と同じ。同じ probe で、黙って入る 2 つの形（`JANコード` が空の 13 桁の行、指数の形の行）が preview で正常な行になることも確かめた（手順書の「今の事実」の「黙って入る形」の行）。Windows の画面の上の復元（「バックアップ・復元」の一覧から選ぶ）は予行演習の手順 7 で確かめる。

## Data Safety

- commit しない: 在庫 Excel・その写し・商品 CSV・backup・管理者の記録・店の DB。
- repo の外にだけ置く: 上の全部（流れ 1 の冒頭、管理者の保管場所）。
- 試験用だけ: 本 lane は試験用のデータを作らない。予行演習は在庫 Excel から作った本物の CSV を開発用の Windows で使い、出来た folder の消す時期は owner が決める（71 §71.13 と同じ）。

## Implementation Results

Fill after implementation.

## Review Response

先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。

round 1（`e9493279`）: Codex（発注 549）= reject（P1 0 / P2 8 / P3 2。Ordinary Operation に具体的な反例あり）、Claude 側 fresh Opus 5.5 = reject（P1 0 / P2 2 / P3 9）。PR #196 に投稿された review は 0 本（`gh api repos/kosei-w90607/inventory-system-desktop/pulls/196/reviews` が空）で、Codex の件数は最終報告の 10 件。重なる finding を束ねて 12 件にし、全部を受理した。一部を退けたのは 2 点（下の #2 の Design Readiness、#5 の P1）。是正は起草役の本 commit。

| # | finding（束ねた元） | 裁定 | 是正 |
|---|---|---|---|
| 1 | P2 照合を保持日数を越えて延ばすと、取り込む前の backup が一覧から消えて戻せない（Codex #1） | 受理（別の形で是正） | 保全した写しから戻す分岐を足さず、取り込む前の backup から照合までを同じ日に行い、その日に終えられなければ業務の入力の前に復元してから閉じる段落に置き換えた（手順書の流れ 3 の前提の後。保存先の中の backup は file 名の日付から数えた日数が保持日数を超えた日に消える〈`cleanup_old_backups`〉ので、同じ日なら一覧にある。写しから戻す入口〈68 の「控えを選んで確かめる」〉は D-114 の runtime の版にしか無い）。今の事実の backup の保持の行、Matrix の C1・FM3・C1 の読み取りの行、Contract Ledger、Contract Audit の追記 |
| 2 | P2 黙って入る 2 つの形を owner の手の確かめに回す判断が D-127 (2) と両立せず、手順 4・5 の確かめが抜き取りで file 全体を見ない（Codex #2、Opus #1・#2）。P3 preview の warning に時期の条件が無い（Opus #6） | 受理。ただし Design Readiness を ready のままにする点は退ける | 「アプリの変更は要らない」を撤回し、D-127 (2) との食い違いを手順書の J5（a 手順書の機械の確かめ / b プレビューが名指しで止める形を初回の導入の版に入れる。推奨 b、既定 a）として owner に諮る形にした（手順書の J5、packet の Scope の「アプリの側に足りない機能」・Goal・Design Readiness・Review Focus、backlog の後続の候補に時期の条件）。手順 4 を表の全部の行を数える確かめの列（13 桁の数字の `商品コード` で `JANコード` が違う・空の行が 0）に、手順 5 を保存した file の全体の `E+` の検索と行の数に替えた。今の事実に「黙って入る形」の行を足した。退ける理由: b はアプリの変更で、AI の調べから出た要件は owner の確認の前に必須にしない（AGENTS.md の Working Rules の「owner の所感は原文で扱う」）。owner の方針（repo 外の回答台帳 TD-401、2026-10-23）は推奨を既定にして書き進めることで、既定 a でも手順書の確かめが表と file の全部の行を取り込む前に見るので黙って入らない。J5 の答えは owner の判断として Coordinator に渡す |
| 3 | P2 共有 JAN と 8 桁の JAN の種類が排他でない（Codex #3）。P3 布の管理 5 パターン（パッチワーク）と部門 11・12 の扱いが無い（Opus #8） | 受理 | 手順 2 の表を上から順に当てはめる排他の種類にし、部門 11・12 の行（入れない）を先頭に、共有 JAN の群を桁を問わず 13 桁・8 桁の前に置き、13 桁・8 桁を「他の行が持たない」に限り、J2 の種類に店が JAN を使っていない行（布の管理 5 パターンの独自コードの行）を含めた。今の事実の部門の行、Matrix の C4・FM6・C4 の読み取りの行、Contract Ledger |
| 4 | P2 MSI の予行演習と同じ回にするときの試験用のデータとの境が無い（Codex #4）。P3 M1〜M8 は済んでいる（Opus #7） | 受理 | 流れ 2 の冒頭を、M1〜M8 は 2026-10-24 に済み、同じ日に MSI の試験用のデータを使うときはその片付けの後に手順 1 から始める形に置き換え、手順 2 に商品があれば止める段を足した。packet の Risk の L3 の段落・Owner Effort Budget の注・Ordinary Operation・Contract Ledger、Matrix の C9・FM12・C9 の読み取りの行 |
| 5 | P2 未確認と書いて止めることを Plan Gate の前の Contract Probe の代わりにしている（Codex #5）。P3 P2 は repo の中で probe できる（Opus #9） | P2 は受理。P1 を Plan Gate の前に回す点は退ける | P2 を一時 test で回して command と出力を記録した（Contract Probe の P2。4 商品・4 movement が復元で 0・0、部門 21・設定 9 は同数、開き直しても 0）。退ける理由: P1 は Excel が要り、本 run の環境に Excel が無い（Contract Probe の P1 に調べた path）。代わりに手順を P1 に安全を頼らない形にした（#2 の機械の確かめで、P1 が外れても取り込む前に止まる）。P1 の最小の実験（Excel のある Windows で合成の 3 行）は owner の手が要り、予行演習の手順 4 の前に行う |
| 6 | P2 R4 にしない理由が Risk Tiers に無い例外を作っている（Codex #6。Opus は R3 を妥当とした） | 受理 | Risk Tiers の R4 の行（backup restore、real store data exposure）に当たるので R4 にした。Final Review Minimum 2、Human Gate `ready,merge,r4`、Rollback / recovery notes を足した（packet の Workflow State・Risk・Owner Effort Budget の見込みに R4 の承認 1、Matrix の Risk）。先例は docs だけの R4 の `docs/archive/plans/2026-10-07-backup-offsite.md` |
| 7 | P2 初回の導入の版の条件が「関門 1〜4」のまま（Codex #7） | 受理 | 「Plans の導入の前の関門の confirmed を全部満たした版」への参照に置き換えた（手順書の流れ 2 の冒頭、packet の Risk の L3 の段落・Design Readiness・Contract Ledger、Matrix の C9・Compatibility Checks） |
| 8 | P2 AC5 の mutation が落ちない（Codex #8、Opus #3） | 受理 | AC5 を文ごとに分けてから除く形と、「入れた後のやり直しを DB の作り直しで行わない」の数え上げ `1` の 2 つにした。`$TMPDIR` の写しの mutation で red を確かめた（AC の実測、Matrix の Mutation-style Adequacy Questions） |
| 9 | P3 AC8 の起点が main の同期の前のまま（Codex #9、Opus #4） | 受理 | `git merge-base origin/main HEAD` を起点にした（実測 `843c4938`、5 file） |
| 10 | P3 backlog の項目に「設計が無い」「決めること」が残る（Codex #10、Opus #5） | 受理 | 項目を手順書への案内・業務の入力の前後の戻し方・残る作業に置き換え、起票の行を本文に入れた。packet の「この変更で不要になる記述」を「無い」から直した |
| 11 | P3 J1 の換算を `× 1.1` で行うと切り上げで 1 円ずれ、照合が端数の出る値を選ばない（Opus #10） | 受理 | 手順 3 を `税抜 × (100 + 税率) ÷ 100`（整数を掛けてから割る）と式の例に、流れ 2 の手順 6 に端数の出る売価の商品を必ず含める句を足した。Contract Audit の追記 |
| 12 | P3 「部門の初期データはリリースの前にしか変えられない」は D-123 (5) より強い（Opus #11） | 受理 | 「リリースの前に直すのが安い（リリースの後は値のある DB を移す migration が要る）」に弱めた（手順書の流れ 1 の手順 2、Matrix の C4、Contract Ledger） |

是正の中で足したもの（finding の付随）: Opus #1 の影響の欄の「CSV の上書きで JAN を入れても `PLU対象` が空なら今の 0 が保たれる」を、手順書の今の事実の PLU対象の行（`test_commit_import_req907_blank_plu_target_derives_for_new_and_preserves_overwrite`）と「入れた後に誤りを見つけたら」の JAN の行（13 桁の JAN を入れ直すときは `PLU対象` を `1`）に書いた。
