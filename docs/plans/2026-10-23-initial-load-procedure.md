# Plan Packet: 店の PC で本物のデータを入れ始める初期投入の手順を決める

wave に属さない単独の lane（2026-10-23 に同時に起票した 2 本の 1 本。もう 1 本は操作ログの保持の lane `docs/plans/2026-10-23-oplog-retention.md`〈別の branch〉。docs だけ）。導入の前の関門の candidate「初期投入の手順」（[Plans の導入の前の関門](../Plans.md#導入の前の関門)、`docs/backlog.md` の同名の項目、owner の決定 repo 外の回答台帳 TD-345）を、関門に足す前提で起票する（owner の決定 repo 外の回答台帳 TD-402、2026-10-23）。

規模と手法（起票の最初に数えた）: 触る file は 3（新しい管理者の手順書 `docs/initial-load-runbook.md`、`docs/PROJECT_HANDOFF.md` の案内の 1 行、`docs/backlog.md` の「初期投入の手順」の項目）と本 packet と Test Design Matrix（`docs/plans/test-matrices/2026-10-23-initial-load-procedure.md`）。設計正本（function-design・db-design・SCREEN_DESIGN・ADR・decision-log）・code・migration・wire の型は 0。手順書は既存の契約（26 §18.3、30 §4.8・§4.9 と BIZ-01-D5・D6・D8、60 UI-01c、master-tables の departments と独自コードルール、ADR SPEC-STK-CNT-D3・D4、68 §68.4、71 §71.5、D-123）を引いて並べ、正本に無い管理者の判断（行の種類の分け方、CSV の側の確かめ、予行演習、取り込む前の backup と照合、照合が合わないときの戻し方、入れた後の誤りの直し方）を足す。その組は下の Contract Ledger。手法: 1 lane のまま（手順書 1 つで、正本も code も変えないので分ける境が無い）。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（本 run の起草役）
- Plan Reviewer: fresh Opus 5.5 + Codex（座組表 docs/AGENT_OPERATING_MANUAL.md ## 座組 どおり）
- Final Reviewer: Fable 5.1（Claude 側。座組表の「R3 以上と design lane で Fable 5.1」）+ Codex（座組表どおり）
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/initial-load-procedure

遷移の記録:

1. kickoff → spec-check（2026-10-23、起草役）: 発注書の範囲（店の PC で本物のデータを入れ始める最初の手順〈商品・初期在庫・部門・設定・最初の backup〉の正本の置き場と、アプリの側に足りない機能があるか）を範囲にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-23、起草役）: 引く正本（上の規模と手法の一覧）は各機能の契約として足りるが、初期投入を 1 つに並べた手順が無い（30 BIZ-01-D8 は「Excel から作る CSV の換算は初期投入の作業の範囲」とだけ書く）。手順書を新しく置く。
3. design → plan-draft（2026-10-23、起草役、同じ commit）: 条件「設計の出力が正本にある」は、手順書 `docs/initial-load-runbook.md` を同じ plan-first の変更に置いて満たす（docs だけの lane の先例 `docs/archive/plans/2026-10-17-msi-distribution-docs.md` と同じ形）。条件「未解決の設計の問いが無い」は、owner の判断が要る 4 問（下の Review Focus の owner の判断事項）に全ての選択肢と推奨を並べ、推奨を既定として手順書を書き、答えで変わる所を手順書の表の「変わる所」に名指したことで満たす（owner の方針、repo 外の回答台帳 TD-401、2026-10-23）。実機でしか分からない点（P1・P2）は手順書に「未確認」と書き、予行演習で確かめる。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（起票の時点） | 2（Ready 1、merge 1） | 4 | 6 = 0 + 2 + 4 |

owner の判断事項 J1〜J4 は既定で進め、本 lane の完了に答えを要らない（答えが出れば手順書の該当の行を直す）ので、見込みに数えない。手順書の予行演習（流れ 2）と店の PC での投入（流れ 3）は、初回の導入の版ができた後に MSI の予行演習と同じ回で行う運用で、本 lane の L3 ではない（下の Risk）。

承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
発注書は「docs だけで済むなら R2」とするが、`docs/DEV_WORKFLOW.md` Risk Tiers の境の規則（「If uncertain between R2 and R3, choose R3 when the change touches ... data safety boundary」）に当たるので R3 にした。手順書は店の本物のデータを入れる最初の手順で、入れた商品の記録は商品コードに積もって後から変えられず（SP-102-04、INV-8）、リリースの後は DB を作り直さない（D-123 (5)）。手順書は正本に無い店のデータの安全の判断（取り込む前の backup と照合が合わないときの復元、業務の入力を始める条件、入れた後の誤りの直し方）を足す。先例の MSI の手順書の lane も同じ理由で R2 から R3 に上げた（`docs/archive/plans/2026-10-17-msi-distribution-docs.md` の Risk）。R4 にしない理由: 手順書は DB の file を動かす段も消す段も足さず、戻す操作はアプリの復元（68 §68.4。戻す前に今の状態の backup を自動で作る）だけで、業務の入力を始めた後は戻さない。code・設定・DB・command の DTO・画面・merge gate は変えない。R3 の要件: Contract Ledger・Data Safety・Contract Probe・Test Design Matrix・Design Readiness を置いた。required gate の green / red は変わらない（docs だけで、`scripts/ci/classify-changes.sh` の workflow の path に当たらない。下の AC の実測）。Final Review Minimum は 1、Human Gate は `ready,merge`（R3 の既定）。

L3 について: 本 lane の成果物は手順書で、画面も振舞いも変えないので、Windows native で確かめる本 lane の項目は無い。手順書の予行演習（流れ 2）は、初回の導入の版（導入の前の関門の 1〜4 を含む版）と在庫 Excel の写しが揃った後に、MSI の予行演習（M1〜M8）と同じ回にまとめて行う（owner の操作の回数を 1 回に減らす工夫。手順書の流れ 2 の冒頭）。

## Goal

Goal Invariant:

### 最小完了条件

- owner が `docs/PROJECT_HANDOFF.md` から辿れる 1 つの手順書で、在庫 Excel から商品 CSV を作る・予行演習で通す・店の PC で入れる・照合する・最初の backup を作る、を順に実行でき、各手順で何を確かめるか、合わなければ何をするかが分かる。
- owner の判断が要る所は既定と選択肢と「変わる所」が手順書にあり、答えが無くても手順を進められる。
- アプリの側に足りない機能があるかの答え（無い。後続の候補は backlog）が、backlog の項目に書かれている。

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
| 年末の棚卸しで埋めた在庫 Excel がある（J3 の既定） | 手順書の流れ 1（行の種類に分ける → 列を作る → 表で確かめる → CSV で保存 → SHA-256） | 商品 CSV と行の種類ごとの数 | 「どれにも当たらない」行と接頭辞の無い部門の独自コードの行が 0、指数の形の行が 0、上限を超える行が 0 | P1（Excel の CSV の保存の形） |
| 初回の導入の版の MSI と CSV がある | 流れ 2（MSI の予行演習と同じ回。開発用の Windows で取り込む前の backup → 取込み → 照合 → 復元で 0 件に戻る） | 同じ CSV と版で店の PC と同じ結果になることが分かる | プレビューのエラー行と重複行が 0、照合が全部合い、復元で 0 件に戻る | P2（復元で 0 件に戻る） |
| 店の PC に MSI が入り、商品が 0 件（MSI の手順書の流れ 2 の後） | 流れ 3（写して SHA-256 → 取り込む前の backup を 2 か所へ → 取込み → 開き直し → 照合 → 設定 → 最初の backup） | 店の PC で本物の商品と初期在庫が入り、業務の入力を始められる | 照合が全部合う。合わなければ入力を始めずに取り込む前の backup へ復元し、流れ 1 から | なし（既存の 60・68・71 の機能） |
| 業務の入力を始めた後に誤りが見つかった | 「入れた後に誤りを見つけたら」の表 | 画面か CSV の上書きか計数で直す。直せない誤り（商品コード・単位の種類）は止めて owner に諮る | — | なし |

この lane で完了するのは「手順書が置かれ、owner が辿れる」まで。店の PC での投入は初回の導入の版と予行演習の後で、v1.0 の通常運用の達成はそれらを含む。

## Scope

- `docs/initial-load-runbook.md`（新規）: なぜ 1 度で入れ切るか、今の事実の表（repo の現物で確かめた出所つき）、入れる前に決めること（J1〜J4 の選択肢・既定・変わる所）、流れ 1（商品 CSV を作る）・流れ 2（予行演習）・流れ 3（店の PC で入れる）、入れた後に誤りを見つけたら。
- `docs/PROJECT_HANDOFF.md`: 案内の表に手順書の行を 1 行足す（template の Registration / Generation Obligations「source / workflow doc 新設」）。
- `docs/backlog.md`: 「初期投入の手順」の項目の前提の文を直し（業務の入力の前は取り込む前の backup の復元で戻せる）、下に起票の行と後続の候補の行を足す。他の行は変えない。
- `docs/plans/test-matrices/2026-10-23-initial-load-procedure.md`（新規、R3 の Test Design Matrix）: 手順の分岐ごとの期待と、それを壊す誤った読み。

型・JSON・関数・DTO の形は変えない（作る所・読む所・fixture・test の呼び方の列挙は不要）。

決めたこと（発注書の「決めること」）:

- 正本の置き場: 管理者の手順書 `docs/initial-load-runbook.md`。function-design には置かない。理由: 手順は 1 度きりの管理者の作業の列で、26・30・60・68・71・master-tables・ADR の契約を横に並べる。function-design の各 file は 1 つの module の契約を持つ所で、手順を置くと各 file に同じ列を写すか、1 つの file に他の module の手順が入る。先例は MSI の手順書（同じ管理者の手順で、PROJECT_HANDOFF から辿る）。
- アプリの側に足りない機能: 本 lane の範囲で要るものは無い。今の商品 CSV の取込み（新規の行の初期在庫の記録、CSV の中の重複の拒否、エラー行の除外、独自コードの番号を画面の発番が飛ばす D-106）と、backup の復元で手順が成り立つ。黙って入る形が 2 つ（`商品コード` が 13 桁の数字なのに `JANコード` が空の行、`商品コード` が指数の形の行）あり、手順書は CSV の側で確かめ、アプリの preview の warning は後続の候補として backlog に置いた（出所を書き、owner の確認の前に必須にしない。AGENTS.md の Working Rules の「owner の所感は原文で扱う」の項）。

他の lane との所有（`docs/DEV_WORKFLOW.md` Wave Operation。open の PR #172・#188・#190・#191・#192・#193・#194 の差分〈#188 は packet の Scope、#194 は PR body の Scope〉と本 lane の予定の path を `comm -12` で突き合わせた。下の AC の実測）:

| file | 節 | 所有 |
|---|---|---|
| `docs/backlog.md` | 「初期投入の手順」の項目とその下の箇条 | 本 lane |
| `docs/backlog.md` | それ以外の項目（SD 直読みの runtime〈#172〉、PC の外の控えの runtime と保存と起動の守り〈#190〉、部門 12 の初期データ〈#192 が足す〉、#188 の Scope の各項目を含む） | 各 lane（本 lane は触らない） |
| `docs/PROJECT_HANDOFF.md` | 案内の表の手順書の行 | 本 lane（他の PR の差分と Scope に無い） |
| `docs/initial-load-runbook.md`・本 packet・Matrix | 全体 | 本 lane（新規） |

この変更で不要になる記述・条件・code（D-127 の問い）: 無い。30 BIZ-01-D8 の「Excel から作る CSV の換算は初期投入の作業の範囲で、本契約は CSV の値をそのまま読む」は今も正しく（換算は手順書の流れ 1 の手順 3）、#188 が 30 を触るので本 lane は変えない（手順書が 30 を引く）。backlog の項目の「入れた後のやり直しは DB の作り直しになり」は、業務の入力の前は復元で戻せるので、同じ項目の中で直した（上の Scope）。MSI の手順書（#190・#191 が触る）と 22 §16 の作り直しの手順の「6. 初期投入をやり直す」（開発・試験 DB の作り直しの手順で、店の DB に当てない）は変えない。

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
- AC5: `rg -n '作り直' docs/initial-load-runbook.md | rg -v '作り直さない|作り直しで行わない|作り直しの範囲'` が何も出さない（後ろの `rg` の exit 1）。入れた後のやり直しを DB の作り直しで行う文が無いことを見る（Goal の失敗定義の 2 行目）。
- AC6: `rg -c '全部が合ったときだけ業務の入力を始める' docs/initial-load-runbook.md` が `1`（流れ 3 の手順 7）と、`rg -n '業務の入力を始めた後は、取り込む前の backup へ戻さない' docs/initial-load-runbook.md` が 1 行（Goal の失敗定義の 1・3 行目）。
- AC7（読んで確かめる、`docs/initial-load-runbook.md` の「入れる前に決めること」と流れ 2・3）: 手順書の J1〜J4 の各行に選択肢・既定・変わる所があり、「変わる所」が指す手順の番号が実在する。「未確認（P*n*）」が packet の Contract Probe の行を指す。流れ 2 の手順 4 と流れ 3 の手順 3 が、エラー行と重複行が 0 のときだけ取り込む（Goal の失敗定義の 4 行目）。
- AC8: `git diff --name-only eed07d37 HEAD` が本 lane の 5 file（手順書・PROJECT_HANDOFF・backlog・本 packet・Matrix）だけを出す（店のデータの file が無い）。
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

## Design Readiness

- 引く設計正本（節まで）: 26 §18.3（文字コード・ヘッダ・改行・引用符）、30 §4.8（必須列・行の検証・CSV の中の重複・既存のコードは重複行）・§4.9（1 つの TX、新規の行の初期在庫の記録、`PLU対象` の既定の導出、next_seq を進めない）・BIZ-01-D5（100 文字）・BIZ-01-D6（D-106、CSV の番号を画面の発番が飛ばす）・BIZ-01-D8（単位・`m` の初期在庫・原価の 1/100 円・Excel の税抜の換算は初期投入の作業）、30 の「計数の置き場と在庫の求め直しの契約」（初期在庫の movement、共有 JAN）、60 UI-01c-D5〜D8・D15・D16（プレビュー・重複の既定スキップ・上書きの確認・エラー行の除外・20MB・PLU対象）、master-tables の departments（初期データ 21 部門、独自コードルール C-1、SP-102-04）、10-common-rules の INV-8、ADR SPEC-STK-CNT-D3（初期在庫はどの計数よりも前）・D4（共有 JAN は在庫連動の外）、32 §15 の実データ行のマスタ照合（`jan_code` で引き当てる）、68 §68.4（手動バックアップ・復元と戻す前の自動の backup・PC の外の控え）、71 §71.5（保持日数での削除）・§71.13（別の PC に店のデータを置く扱い）、D-075（取引先を一括で入れない）、D-076（長く動いていないコードの無い品）、D-119（個数の単位どうしの直し）、D-123 (4)・(5)、D-128（原価は税抜）、MSI の手順書の流れ 2 と「予行演習の準備と片付け」。
- 必要な設計成果物: Design artifact selection の当たる行は無い（振舞い・command・DB・画面・format を変えない）。管理者の手順書を新しく置く（updated in this PR、`docs/initial-load-runbook.md`）。
- plan にしかない durable な判断の昇格先: 無い。手順書が足した判断（行の種類の分け方、CSV の側の確かめ、予行演習を MSI の予行演習と同じ回で通す、取り込む前の backup を 2 か所へ写す、エラー行と重複行が 0 のときだけ取り込む、照合が全部合うまで業務の入力を始めない、合わなければ取り込む前の backup へ復元する、業務の入力を始めた後は戻さない、直せない誤りは止めて owner に諮る）は手順書に置き、引く正本との組を Contract Ledger に置く。J1〜J4 の既定は手順書の表に置き、owner の答えで直す。
- 前提・制約と延期した gap: 予行演習と投入は初回の導入の版（関門の 1〜4）を待つ。延期しても安全な理由: 手順書は予行演習を通すまで店の PC に入れないと書く（流れ 3 の前提）。アプリの preview の warning（後続の候補）は手順書の CSV の側の確かめで代える。
- 絶対保証の自己点検: 「取り込む前の状態に戻る」は、業務の入力を始める前に限り、同じ版で作った backup をアプリの復元で戻す場合に限って書いた（68 §68.4 の復元は戻す前に今の状態を自動で backup する）。「直せない」は商品コード（SP-102-04）と単位の種類をまたぐ変更（30 BIZ-01-D8）に限った。
- 判定: ready。

## Contract Audit（新しく足す契約の文の境界の一巡）

発注書の境界の 4 観点で、手順書が新しく書いた文を一巡した。

| 観点 | 手順書の文 | 確かめたこと |
|---|---|---|
| 安全な整数の範囲 | 流れ 1 の手順 4「上限を超える行があれば止める」、今の事実の売価・原価・初期在庫の行 | 上限は 30 BIZ-01-D8 と共通規則の「入力の上限と安全な整数の範囲」の値（売価 999999、原価 999999.99 円、初期在庫 999999999、`m` は cm にした後）をそのまま写した。税込への換算（J1）の後の売価も同じ上限で確かめる（手順 4 は換算の後の表で確かめる） |
| 0 の表示 | 今の事実の初期在庫「空は 0」、流れ 1 の手順 4 の 0 の行の一覧 | 空と 0 は取り込んだ後に区別できない（どちらも初期在庫の記録を作らない、30 §4.9）。数えていない行と 0 個の行を分けたいときは CSV の側の一覧（手順 4）で分ける。売価・原価の 0 は受理される（0 以上）ので、黙って入らないよう owner が予行演習で一覧を見る |
| 失敗の時点と順序 | 流れ 2 の手順 4、流れ 3 の手順 2〜7 | プレビューは DB を変えない（30 §4.8）。確定は 1 つの TX だが、エラー行を除いて正常な行だけを入れる（30 §4.9、UI-01c-D8）ので、エラー行が 0 のときだけ取り込む。取り込む前の backup は取込みの前（手順 2）、2 か所への写しが失敗したら取り込まない。照合（手順 6）は業務の入力（手順 7）の前。戻すのは業務の入力の前だけ |
| 単位や種類の混在 | 流れ 1 の手順 3、今の事実の在庫単位・初期在庫・原価・売価の行 | `m` の初期在庫は m の数（cm にしない）、個数の単位は整数、原価は税抜の円で小数 2 桁まで（1/100 円にしない。アプリが直す）、売価は税込の円の整数（Excel の税抜から J1 で換算）、税率は文字列 `10`・`8`・`0`。商品コードと JAN の数字は文字列の書式で書く（指数の形にしない） |

## Registration / Generation Obligations

| 変更対象 | 義務 | 本 lane |
|---|---|---|
| source / workflow doc 新設 | 親文書の目次・索引を更新 | `docs/PROJECT_HANDOFF.md` の案内の表に 1 行（Scope） |

ほかの行（Tauri command、function-design doc、REQ、route、operator 画面）は該当なし。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | 外部の adapter と app-core の境 | — | 不該当: レジ・POS の adapter に触れない（Z004 の引き当てを今の事実として引くだけ） | なし |
| Fact check / design decision split | 観測した事実とアプリの判断の分け | 手順書の「今の事実」と「入れる前に決めること」 | 当たる: repo の現物で確かめた事実を出所つきで表にし、Excel の振舞いは P1 の未確認に、owner の判断は J1〜J4 に分けた | 予行演習（手順書の流れ 2） |
| Lifecycle / retry | 前・中・後・失敗の後 | 手順書の流れ 2・3 | 当たる: 取り込む前の backup、プレビューのエラー行で取り込まずに直す、照合が合わなければ復元して流れ 1 から、業務の入力の後は戻さない | Test Design Matrix の State Lifecycle Matrix |
| Operator workflow | 実際の順序 | 手順書 | 当たる（管理者の作業）: Excel → CSV → 予行演習 → 店の PC → 照合 → 設定 → 最初の backup。店の利用者の操作にしない | なし |
| Replacement path | 外部の系が変わったとき | — | 不該当: 取込みの形式を変える判断は無い | なし |
| Data safety / evidence | 店のデータを repo に入れない | 手順書の流れ 1 の冒頭、Data Safety | 当たる: 在庫 Excel・CSV・backup は repo の外、記録は管理者の保管場所。予行演習の folder の消す時期は owner | なし |
| Reporting / accounting semantics | 集計の意味 | 手順書の J3 | 当たる: 初期在庫の数を数えた日と入れた日の差、レジが部門キーで売る間の差は、次の計数で棚卸しの差として出る（店主の許容はロスの範囲、project-memory の利用者の節）。評価額の計算は変えない | なし |
| Manual verification | 自動 test で示せない主張 | 手順書の流れ 2 | 当たる: Excel の CSV の保存（P1）と復元で 0 件に戻ること（P2）は予行演習で確かめる。本 lane の L3 ではない | 予行演習 |
| 環境・再現性 | 新しい環境依存の pin | — | 不該当: 新しい環境依存を足さない（Excel は店と開発用の PC の既存の道具） | なし |

## Boundary / Wire Contract

変えない。商品 CSV の形（26 §18.3、30 §4.8）を引いて CSV を作る手順を書くだけで、JSON・CSV の形・config・DTO・bindings・DB に触れない。

## Test Plan

Test Design Matrix: [2026-10-23-initial-load-procedure](test-matrices/2026-10-23-initial-load-procedure.md)（手順の分岐ごとの期待と、それを壊す誤った読み。自動 test は足さない）。

- targeted tests: 無い（code を変えない）。手順が引く振舞いの既存の自動 test は Matrix の Evidence に `rg` で確かめた名で書いた。
- negative tests: AC5・AC6（失敗定義に当たる文が無い・ある）、AC7 の読み取り。
- compatibility checks: AC1・AC2 の doc 検査（R3 の Markdown link の実在を含む）。
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
| 手動バックアップ・復元と戻す前の自動の backup | 68 §68.4、71 §71.7 | 流れ 2 の手順 3・7、流れ 3 の手順 2・7（Matrix C1） | 既存（Matrix の Evidence） | 予行演習で P2 |
| 保持日数での削除 | 71 §71.5、`schema_v1.rs` の `backup_retention_days` | 流れ 3 の手順 2・9（保存先の外の 2 か所へ写す）（Matrix C1） | 非対象（読み取り） | 非対象 |
| リリースの後は作り直さない、初回の導入の版の条件 | D-123 (4)・(5) | なぜ 1 度で入れ切るか、流れ 1 の手順 2 と流れ 2 の手順 2（部門の初期データはリリースの前にだけ直す）（Matrix C1・C4） | AC5 | 非対象 |
| 手順書が足した判断: エラー行と重複行が 0 のときだけ取り込む。照合が全部合ったときだけ業務の入力を始める。合わなければ取り込む前の backup へ復元し流れ 1 から。業務の入力を始めた後は戻さない | 引く正本: 30 §4.9（エラー行を除いて入れる）、68 §68.4（復元）、D-123 (5) | 流れ 2 の手順 4、流れ 3 の手順 3・7、入れた後に誤りを見つけたら（Matrix C1・C3） | AC6 | 非対象（読み取り） |
| 手順書が足した判断: 予行演習を同じ版・同じ CSV で開発用の Windows で通し、MSI の予行演習と同じ回にまとめる。片付けは MSI の手順書の「予行演習の準備と片付け」、店のデータの folder の消す時期は owner | 引く正本: MSI の手順書の確かめる項目と準備と片付け、71 §71.13 | 流れ 2（Matrix C9） | 非対象 | 予行演習で 1 度通す |
| 手順書が足した判断: 行の種類（13 桁 JAN・共有 JAN の群・8 桁 JAN・コード無し・どれにも当たらない）と、どれにも当たらない行・指数の形の行・上限を超える行で止める | 引く正本: 30 §4.8 の手順 4（商品コードの形を検査しない）、TD-352、J2・J4 | 流れ 1 の手順 2・4（Matrix C2・C4・C6） | 非対象（読み取り） | 非対象 |
| 隣接の除外: 取引先を一括で入れない（D-075）、長く動いていない品を商品にしない（D-076） | D-075・D-076 | 今の事実の取引先の行、J2 の既定（引くだけ） | 非対象 | 非対象 |
| 隣接の除外: JAN の別名（D-122、proposed・未実装）、PLU の書出し（33）、SD 直読み（D-111） | 30 §4.9.2、33、29 | 変えない（初期投入は新しい DB で重複行が無く、別名の問いは出ない。PLU をレジへ書く手順は導入の前の関門の precondition-dependent の項目） | 非対象 | 非対象 |
| 隣接の除外: 22 §16 の作り直しの手順の「6. 初期投入をやり直す」 | 22 §16 | 変えない（開発・試験 DB の作り直しの手順で、店の DB に当てない） | 非対象 | 非対象 |

## Contract Probe

R3 の Contract Probe（`docs/DEV_WORKFLOW.md` Plan Packet Rules）は、外部の前提に頼る計画で Plan Gate の前に最小の実験を求める。本 lane の成果物（手順書）は外部の前提を手順の前提にせず「未確認」と書き、確かめるまで店の PC に入れない（流れ 3 の前提は予行演習を通していること）。実験は Windows の実機と在庫 Excel の写しが要り、本 run では行っていない。

- P1 Excel の「CSV（コンマ区切り）」の保存が CP932 で、文字列の書式の列を表示のまま（桁を落とさず）書く: 流れ 1 の手順 5 のメモ帳の確かめと予行演習の照合 → 未実施。外れても、文字コードは取込みが file ごと拒否し（26 §18.3）、桁の崩れは流れ 1 の手順 4・5 と予行演習の照合が止める。
- P2 取り込む前の backup をアプリの復元で戻すと商品の無い状態に戻る: 流れ 2 の手順 7 → 未実施（復元の振舞いは 71 §71.7 と既存の test が持つ。初回の導入の版で通す）。

## Data Safety

- commit しない: 在庫 Excel・その写し・商品 CSV・backup・管理者の記録・店の DB。
- repo の外にだけ置く: 上の全部（流れ 1 の冒頭、管理者の保管場所）。
- 試験用だけ: 本 lane は試験用のデータを作らない。予行演習は在庫 Excel から作った本物の CSV を開発用の Windows で使い、出来た folder の消す時期は owner が決める（71 §71.13 と同じ）。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
