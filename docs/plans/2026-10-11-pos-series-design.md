# Plan Packet: 実測と POS の系列の対応を取得・保存する設計

wave に属さない単独の lane（design lane、docs だけ。runtime は後続の lane）。owner の lane 選択は 2026-10-11（repo 外の回答台帳 TD-222: 単位 U の runtime と本 lane の 2 本で始める）。並走は `agent/unit-runtime`（単位 U の runtime）、`agent/backup-offsite`（PR #155 Draft、D-114、docs の design）、`agent/plu-clear`（D-110）。本 lane の branch は `agent/pos-series-design`。

規模と手法（起票の最初に数えた）: 触る設計正本は 7 file（時点証拠 ADR、32、29 の EJ parser、io-task-specs、37、pos-tables、tracking-system-tables）と decision-log・backlog・Plans.md。画面 0、migration 0（proposed の表 1 つと列 1 つを設計に足すだけ）、wire の型 0。横断の約束がかかる経路は 4 つ（取込みの preview / commit の分類、実測の保存 2 経路〈進行中の明細・独立再実測〉、SD の読取り、EJ の区間の完全性）。**1 lane のまま進める**。分ける案（対応の取得・保存の設計と、日次の EJ 取込みの「欠け」の設計を別 lane にする）は採らない。理由: どちらも同じ観測（Z004 の精算回数、EJ の精算票の題、取引一連番号）から決まり、どちらも時点証拠 ADR の D5 の同じ段を書き換えるので、分けると 2 本の lane が同じ段を取り合う。決める値が少ない（足すのは表 1 つと列 1 つ）ので、横断の約束は下の Scope の「値ごとの保証の表」1 つにまとめた。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（subagent_type: writer）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3・design lane）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/pos-series-design

遷移の記録:

1. kickoff → spec-check（2026-10-11、起草役）: owner の決定（repo 外の回答台帳 TD-221「しばらくは CASIO のレジでいく。CASIO の着手も進める」、TD-223「着手条件 4 を外す」）で保留が解けた `docs/backlog.md` の「実測とPOS系列の対応を取得・保存する」を Scope にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-11、起草役）: 時点証拠 ADR（`docs/adr/2026-09-18-stocktake-time-evidence.md`）の「適用範囲の但し書き」が次の design lane へ送った事項（判定不能を実測前・実測後へ分ける方法、精算系列と同一性の比較、系列、計数のまとまり、時刻区間）と、`docs/function-design/29-io-ej-parser.md` IO-08.10 の「欠け」の定義が正本に無い。同じ commit で設計正本を更新した（下の Design Readiness）。
3. design のまま止める（2026-10-11、起草役）: owner の判断事項 J1（番号印字を採るか）が残り、design → plan-draft の条件「未解決の設計の問いが無い」を満たさない。J1 に依らない部分（SPEC-STK-TIME-D10・D5a、外部前提の観測、clear 行の段、後続の依存の表）は正本へ書いた。
4. design（owner の決定の反映、2026-10-11、起草役）: owner が J1 を A（番号印字を採らない）に決めた（repo 外の回答台帳 TD-224）。ADR D10・D-116・本 packet・Matrix に反映し、同じ問い合わせで出た懸念（設計が SD に寄る）に対して、表・列・用語から媒体の名前を外し（`pos_source_scans`・`source_scan_cursor`・「全数読取り」）、判定を有効にする・外す出口を D10 に定めた。SD のエラーで締められなかった日（TD-160・TD-161）を入力列で確かめ、媒体の入替とファイルを選ぶ経路の資料が根拠に混ざる列を見つけたので、全部実測後の条件を「同じ置き場の 2 回の全数読取りの間に現れた資料」に改めた。
5. design → plan-draft（2026-10-11、起草役、同じ commit）: 条件「設計の出力が正本にある」は Design Readiness の引く正本で満たす。条件「未解決の設計の問いが無い」は、J1 の決定（TD-224）で owner の判断事項が無くなったことで満たす。残る Contract Probe の P1・P3・P7（持ち帰りデータの集計中）と P10 は設計の問いではなく、Plan Gate の前と D10 を有効にする lane の前に確かめる外部前提で、結果に依らず設計は安全側（判定不能）に倒れる。plan-gate への遷移は Coordinator。
6. plan-draft のまま（集計の反映、2026-10-11、起草役）: 持ち帰りデータの集計（独立の数え直し済み）が戻り、Contract Probe の P1・P3・P5・P7 を結果で書き直した。集計で、精算票と Z004 を「題の末尾 + 1」の番号で対応づける起票時の D5a が、番号の差がずれると 1 つ後の精算の記録を黙って拾うと分かったので、対応づけを精算の日時の同一性（同じ分か 1 分前、ちょうど 1 件）に改めた。D10 の条件 3 の日付の比較に 1 日の余裕を足した。Goal と設計の方向は変えず、owner の判断が要る事項は増えていないので plan-draft に留める。
7. plan-draft → plan-gate（2026-10-11、Coordinator）: packet と Matrix は commit 済み。Coordinator は ADR の SPEC-STK-TIME-D10（全数読取りと全部実測後の条件、有効にする・外す）と D5a（区間の終端・開始）を実読し、持ち帰りデータの集計（独立の数え直し済み）が Contract Probe の P1・P3・P5・P7 に反映されていることを確かめた。P1 のうち保存が異常終了した精算の資料の残り方と、P2・P10 は未観測のまま残り、D10 を有効にする変更の owner-operated gate に置いてある（本 lane は判定を有効にしない）。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 1（2026-10-11: J1 の判断〈TD-224〉。TD-221・TD-222・TD-223 は起票の前の lane 選択で、本 lane の介入に数えない） | 2（Ready 1、merge 1） | 3（Plan Review の round 天井に達したときの disposition、外部前提の集計の結果の扱い、店主への問いの中継） | 6 = 1 + 2 + 3 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
POS の入力（Z004・EJ）と棚卸しの実測の前後の判定、その証拠の保存先（DB の表と列）、operator の数え直しの頻度を決める設計。本 lane は docs だけだが、後続の runtime が写す契約を決めるので R3。データの破壊・実店舗データの露出・不可逆な操作は無い（設計は SD に書かず、既存の数量・履歴を変える migration を持たない。tracked には件数の細部・商品名・金額を書かない）ので R4 ではない。この変更で required gate の green / red は変わらない（docs だけで、function-design の新しい file・REQ の増減・code の変更が無い）。Scope の予定 path を `scripts/ci/classify-changes.sh` の workflow の一覧（`AGENTS.md`・`CLAUDE.md`・`docs/DEV_WORKFLOW.md`・`docs/ci.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/code_review.md`・`docs/quality/review-checklist.md`・`docs/project-profile.md`・`docs/agent-guidance/*`・`docs/templates/*`・`.agents/*`・`.claude/{rules,commands,skills}/*`・PR template と、full に倒す `scripts/*`・`.github/*` の列）に当てて、当たる file は無い。Final Review Minimum 1。

## Goal

Goal Invariant:

### 最小完了条件

- 後続の runtime lane の Writer が、チャットの履歴を見ずに source docs だけで「数えた商品の、どの精算の資料を数え直しなしで在庫へ入れてよいか」と「その判定をいつ有効にし、どう外すか」を実装できる（時点証拠 ADR の SPEC-STK-TIME-D10 と D4 の表、32 の分類の手順 4、`pos_source_scans` と `source_scan_cursor`）。
- 日次の EJ 取込みの lane の Writer が、「EJ がそろっているか（欠け）」「どの記録がどの Z004 の区間の端か」「前回の Z004 はどれか」を推測せずに書ける（SPEC-STK-TIME-D5a、29 の EJ parser IO-08.9・IO-08.10）。
- ADR が次の design lane へ送っていた事項の全てに、決めた結果（番号印字は採らない）が正本に書かれ、「次の design lane」を担当とする live な記述が設計正本に残らない。
- 店の毎日の操作を増やさずに、数えた商品の要再確認が「数えた日の精算と次の精算の資料で売れた商品」に限られる設計になっている。判定の考え方と保存先の名前がレジ・媒体に依らず、媒体に依る部分が adapter と「今のレジでは」の文に限られている。

### 失敗定義

- 設計が、数える前の販売をもう一度引く・数えた後の販売を引かない結果を、要再確認を付けずに通す経路を持つ。
- runtime の Writer が、読取りの行をいつ置くか・実測のどの時点の値を保存するか・直前の精算の資料の選び方・判定の有効と無効の決まり方・欠けの判定の単位のどれかを推測しないと書けない。
- 媒体の入替、別の媒体の読取り、ファイルを選ぶ経路で取った資料、締められなかった日のどれかを含む入力列で、数える前の販売を含む資料が全部実測後になる。
- 未検証の外部前提（番号印字の桁・位置、精算の書込みの時点）を、確かめた事実として正本に書く。
- 設計が安全側へ倒れすぎて、普通の日（数えない日、数えてから 3 つ目以降の精算）に要再確認を付ける。

### 非目的

- runtime の code・test・fixture・migration・bindings（後続の lane）。`scripts/probes/stocktake_time_model.py` への D10 の追加（D10 を実装する runtime lane）。
- 番号印字の protocol（印の発行・保存・計数のまとまり・EJ での位置の決め方）の設計（採らない。TD-224）。
- EJ の記録の保存先・取込み画面・file の絞り方（日次の EJ 取込みの lane）。Z004 を SD から読む経路の窓と画面（接続の runtime lane）。
- ADR D1〜D9 の既存の契約、D4 の出口、UI の文言、準備照会の issue の変更。
- ADR の Status を accepted にすること（㉘ ⑤ で行う。D-109）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので、数える日とその後の日の操作列を置く。本 lane は docs だけで、表の通常運用は後続の runtime（㉘ ④・⑤、SD 直読みの runtime、接続の runtime lane、日次の EJ 取込み）と、D10 を有効にする変更（外部前提の owner-operated gate の後）の後に成り立つ。**この文書を完了できる**（設計正本がそろう）ことと、**通常運用を達成できる**（店で自動在庫連動が動く）ことは別で、後者は本 lane では未達。番号印字は採らない（owner 決定 TD-224）ので、店の操作は今決まっている毎日の締め（SD を PC に差して読む。D-111）から増えない。精算の番号は例（数えた日の締めの精算を m とする）。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 数えない普通の日。在庫連動商品に実測の履歴が無い、または前回数えてから精算を 3 回以上済ませている | 締め: 精算 → SD を PC に差す → 「SD から読む」→ 取り込む | 売れた分が在庫から一度だけ減る。要再確認は出ない | 取込みの結果が出る | Z004 を SD から読む経路は接続の runtime lane。P1・P2・P3・P10 |
| 棚卸しの日（営業中）。前日の締めで精算 m − 1 まで取込み済み | 商品ごとに「今から数える」→ 数える → 「数を保存」 | 数と、その時点の読取りの位置がアプリに残る | 保存済みの表示 | ADR D1（既存） |
| 同じ日の締め | 精算（m）→ SD を読む → 取り込む | 数えた商品のうち、その日に売れた商品だけに「取り込んだ後に数の再確認が必要です」。売れなかった数えた商品と、数えていない商品には出ない（売れて同じ日に戻った商品は EJ の相殺の判定） | 要再確認の商品を数え直して保存すると消える | 相殺の判定は日次の EJ 取込みの後（それまでは EJ 待ちの表示）。ADR D4（既存） |
| 翌営業日の締め | 精算（m + 1）→ SD を読む → 取り込む | 前日に数えた商品のうち、この日に売れた商品に要再確認。ほかは出ない | 同上 | 精算 m + 1 の区間は、前日の読取りより前の販売を含みうるので判定不能のまま（D10）。owner はこの「翌日」の分が数え直しになることを聞いた上で決めた（TD-224） |
| その次の営業日以降の締め | 精算（m + 2 以降）→ SD を読む → 取り込む | 数えた商品が売れても、数え直しなしで在庫から一度だけ減る | 取込みの結果が出る | D10 の全部実測後（精算 m + 1 の資料が、前日の読取りに無く、この SD の次の読取りで初めて受領された）。P1・P2・P3・P10 |
| 棚卸しの日の締めの取込みを済ませた後に数えた | 数えて保存 → 翌営業日・その次の営業日の締め | 精算 m + 1 と m + 2 の資料で売れた数えた商品に要再確認。m + 3 から自動 | 同上 | 保存の後の最初の読取りは翌営業日（D10） |
| 数えた後、アプリを終了し、PC を再起動し、何日か取り込まなかった | 後日の締めで SD を読み、溜まった精算を古い順に取り込む。その後も毎日取り込む | 溜まっていた精算と、その次の精算の資料で売れた数えた商品に要再確認。その次の精算から自動。保存済みの数と読取りの位置は再起動で消えない | 同上 | ADR の「㉘ への引継ぎ」の合格条件（TD-223）。接続の runtime lane の L3 |
| レジに SD カードのエラーが出て、その日は締められなかった（店に実例がある。repo 外の回答台帳 TD-160・TD-161）。その日に数えた商品もある | 後日、精算をして SD を読み、取り込む。その後も毎日取り込む | 締められなかった日の販売は後日の精算の資料に入る。その資料と次の精算の資料で売れた数えた商品に要再確認。その次の精算から自動。読めない資料が SD に残っている間は、要再確認が続く（自動に戻らない） | 読めない資料が窓から外れるか、読めるようになる | 精算をせずに終わった日か、精算は済んで保存だけ失敗した日かは分かっていない（P1、集計中）。後者で資料が後からまとめて書かれるなら D10 の外部前提が崩れるので、確かめるまで D10 を有効にしない |
| SD を別の 1 枚に替えた（SD カードのエラーの後に替えた場合を含む） | 新しい SD で締めて読む、を続ける | 新しい SD を 2 回読むまでは、数えた商品が売れると要再確認。その後は上の行と同じ。古い SD にだけある資料や、ファイルを選ぶ経路で取った資料は取り込めるが、数えた商品が売れていれば要再確認になる | 新しい SD の 2 回目の読取り | 置き場の識別子（P10）。D10 の条件 3 |
| 年末の棚卸し（何日もかけて数え、最後に確定） | 毎日: 数える → 締めで取り込む → 要再確認が出た商品を数え直す。全商品に未解消の要再確認が無くなったら確定 | 確定できる。確定の後に取り込む資料で売れた商品は、上の行と同じ扱い（要再確認は商品単位の準備の表示に出て、独立再実測で消える） | 未解消の要再確認が 0 | ADR D4 の確定の拒否（既存） |
| SD を読めない日（ファイルを選ぶ経路だけで取り込む） | 「ファイルを選んで取り込む」 | 数えた商品が売れていれば要再確認（今の ADR と同じ）。全部実測後にはならない | 次に SD を読めた日の次の読取りの後の精算から自動に戻る | ファイルを選ぶ経路は全数読取りを作らない（D10） |
| D10 を有効にする前、または外した後の build | いつもの締め | 数えた商品が売れるたびに要再確認（今の ADR と同じ）。読取りと実測の位置の保存は続く | D10 を有効にする変更の配布 | D10 の「有効にする・外す」 |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項（2026-10-11 決定）

### J1 番号印字を採るか → A（採らない）。owner 決定 2026-10-11、repo 外の回答台帳 TD-224

確認済み事実（起票時に示したもの）:

- 今の ADR のままでは、数えた商品は数えた後に売れるたびに毎日要再確認になる（ADR Consequences）。本 lane の D10 は、店の操作を増やさずに、これを「数えた日の精算と次の精算の資料で売れた商品」に限る（Ordinary Operation）。
- レジの番号印字は、取引の外で打つと EJ に行として残り、売上・現金・Z 帳票に影響しない（訪店の確認 2026-09-28、Issue #105 の A7。`docs/backlog.md` の同項目の着手条件 (2)）。独自の記録ヘッダと番号を持たず、直前の記録の本文の後ろか、続く記録の本文の中に現れる（`docs/function-design/29-io-ej-parser.md:474`）。
- 番号印字で判定不能をさらに狭めるには、EJ の取込み（日次の EJ 取込みの lane）が先に要る。D10 は EJ が無くても働く。
- 店は今、紙の棚卸しで、数え終わった商品が売れたらその場で数を直している（repo 外の回答台帳 L-069）。D10 の後に残る数え直しは、この今の作業より範囲が狭い。
- 着手条件 4 の筋書き（TD-223）のうち「翌日」の分は、A では満たさない。A で数え直しなしになるのは、取込みを再開した時点で置き場にあった精算より 2 つ以上後の精算から。

選択肢（決定の記録として残す）:

| 案 | 店の操作 | 数え直しになる範囲（数えた在庫連動商品） | 追加の設計・前提 | 結果 |
|---|---|---|---|---|
| A 番号印字を採らない（D10 だけ） | 増えない | 数えた後に初めて置き場を読んだ時点で置き場にあった精算と、その次の精算の資料で売れた商品 | 無し（D10 の外部前提だけ） | **採用**（起票時の推奨、candidate） |
| B D10 に番号印字を足す | 計数のまとまりの終わりに、アプリが出した番号をレジで 1 回打つ | 前の締めから番号を打つまでの間に売れた商品だけ | 印の発行と保存、計数のまとまり、EJ での位置の決め方、打ち間違い・打ち忘れ・二重印字の出口。番号印字の残る桁数と位置の確認。日次の EJ 取込みが前提 | 不採用（後から D10 の上に足せる。D-116 の Revisit） |
| C 番号印字だけ（D10 を外す） | B と同じ | 打ち忘れ・EJ の欠けのたびに、今の ADR の毎日の要再確認へ戻る | B と同じ | 不採用 |
| D 何も足さない（今の ADR のまま） | 増えない | 数えた後に売れるたびに毎日 | 無し。日次の自動在庫連動（D-070）に届かない | 不採用 |

決定の内容: A。owner は、A では TD-223 の筋書きの「翌日」の分が数え直しになることを聞いた上で選んだ。ADR の「㉘ への引継ぎ」の合格条件は起票時の形のままでよい。同じ問い合わせで owner が述べた懸念（設計が SD に寄る。店の操作が減るのは望ましい）に対し、次の 2 つを設計に入れた。

- 判定の考え方・表・列・用語をレジと媒体に依らない形にした（ADR D10 の「考え方」の段、`pos_source_scans`・`source_scan_cursor`・「全数読取り」。媒体に依るのは adapter〈IO-09〉と「今のレジでは」の文だけ）。
- 判定を有効にする・外す出口を 1 通りに定めた（ADR D10 の「有効にする・外す」、D-116 の (9)）。

残る owner の判断事項は無い。

### 店主に聞く候補（判断は済んだので急がない。運用の見積りの材料）

- 年末の棚卸しの期間に、数え終わった商品が売れて数を直すことは、1 日に何品くらいあるか。台帳には「売れたら都度直す」事実（L-069）だけがあり、件数の答えは無い。D-116 の Revisit（番号印字を後から足すか）の材料になる。

## Scope

本 lane は docs だけを変える（予定 file の全部）。所有の列は並走 lane との重なり（`git diff --name-only 7070382f...agent/backup-offsite`・`...agent/plu-clear` の結果と、`agent/unit-runtime` の発注の範囲から）。

| file | 変更する節 | 他 lane との重なり |
|---|---|---|
| `docs/adr/2026-09-18-stocktake-time-evidence.md` | Status、適用範囲の但し書きの最終段落（決めたことの表）、D1 の S / E の 1 文、D4 の表と前後の文・clear 行の箇条、D5 の時刻の箇条・合計の照合の除外・戻りの箇条・外部前提の段落、D5a（新設）、D8 の表と 1 文、D10（新設。考え方・全数読取り・実測側の保存・全部実測後の条件・締められなかった日と媒体の入替・外部前提・有効にする・外す・番号印字は採らない）、Rejected Options の追記と 1 箇条、Consequences の 3 か所、㉘ への引継ぎ（依存の表と合格条件）、Evidence の 1 文、Revisit Trigger の最終段落 | なし |
| `docs/function-design/32-biz-csv-import-service.md` | 時点証拠契約の「一つの分類関数とcommit」の入力の文と手順 4、外部 probe 表の「精算の書込み」の行と表の後の観測の段落 | なし（`agent/unit-runtime` は Z004 の小数の配線をしない。D-113 (8)） |
| `docs/function-design/29-io-ej-parser.md` | IO-08.9 の表の 3 行、IO-08.10 の「欠け」の箇条 | なし |
| `docs/architecture/io-task-specs.md` | IO-08 の「行わない」の 1 行 | なし |
| `docs/function-design/37-biz-daily-report-import-service.md` | §37.9 の「Z004 と EJ への引継ぎ」の末尾に 2 文 | なし |
| `docs/db-design/pos-tables.md` | 時点証拠契約の表に `pos_source_scans` の 1 行 | `agent/plu-clear` は `plu-tables.md` で別 file |
| `docs/db-design/tracking-system-tables.md` | 時点証拠契約の表に `source_scan_cursor` の 1 行、SPEC-STK-TIME-D8-K1 の箇条に 1 つ | なし |
| `docs/decision-log.md` | 末尾に D-116 だけを追記 | 全 lane が末尾に追記（`agent/backup-offsite` = D-114 と D-111 の中の 1 行、`agent/plu-clear` = D-110）。merge 順で両方を残す |
| `docs/backlog.md` | 「実測とPOS系列の対応を取得・保存する」の項目（現在の状態の箇条を足し、日付つきの 2 箇条に 2026-10-11 の結果を足す）、「㉘ ③ 〜 ⑤ の申し送り」の箇条の 2 か所 | `agent/unit-runtime` は「単位の拡張」の項目だけ。`agent/backup-offsite` は backup の項目と「保存と起動の守りの follow-up」。行は重ならない |
| `docs/Plans.md` | 「次の着手順」の 1 の末尾の 1 句、その下の 2 段落の各 1 文、「次の行動」の後ろの製品の判断の節の STK-1 / STK-2 の行の 1 文。lane の行は足さない（D-097） | closeout の PR が「直近の完了」を触る。行は重ならない |
| `docs/plans/2026-10-11-pos-series-design.md`、`docs/plans/test-matrices/2026-10-11-pos-series-design.md` | 新設 | なし |

触らない: `src-tauri/`・`src/`・`scripts/`（`scripts/probes/stocktake_time_model.py` を含む）、`docs/function-design/90-traceability.md`（生成物）、`docs/function-design/23-io-z004-parser.md`（識別メタの抽出は変えない）、`docs/function-design/35-biz-stocktake-service.md`・`42-cmd-sales-stocktake.md`（保存の API と wire は変えない。`source_scan_cursor` は保存 TX の中で BIZ が採り、wire に出さない）、`docs/project-memory.md`。

### 値ごとの保証の表（DB・wire に出す値）

本 lane が足す値は全て DB の中だけで、wire（Tauri command の DTO、bindings）には出ない。

| 値 | 範囲 | 0・空の意味 | 失敗の時点と順序 | 種類の混在 | 保証する所 |
|---|---|---|---|---|---|
| `pos_source_scans.id` | 正の整数（AUTOINCREMENT） | 取らない | 置き場の file の列挙より前に行を置く。置けなければ読取りを全数読取りにしない | 商品別売上の資料の読取りだけ | 接続の runtime lane の BIZ（ADR D10） |
| `pos_source_scans.medium_id` | 空でない文字列 | 空は許さない（取れなければ行を置かない） | 行を置く前に adapter から取る | 等しいかどうかだけを比べる（大小・部分一致を使わない）。別の種類の置き場の識別子と重ならない形は adapter が決める | DB の CHECK（pos-tables）と adapter（IO-09） |
| `pos_source_scans.source_cursor_start` | 0 以上の整数 | 受領済みの資料が 1 つも無い | 行を置く TX の中で採る | `source_cursor` 以下 | DB の CHECK と BIZ |
| `pos_source_scans.source_cursor` | `source_cursor_start` 以上の整数、未完了は NULL | 0 は、完了の時点でも資料が 1 つも無い（窓に資料が無い置き場） | 条件 2 を満たして受領を終えた後に書く。途中の失敗・中止は NULL のまま | `window_from` と両方 NULL か両方 NOT NULL | DB の CHECK と BIZ |
| `pos_source_scans.window_from` | YYYY-MM-DD、未完了は NULL | 取らない | 同上 | 資料の `settlement_date`（YYYY-MM-DD）と日付として比べる。形が違えば条件不成立 | BIZ（ADR D10 の条件 3） |
| `source_scan_cursor`（実測の証拠） | 0 以上の整数 | 読取りの行が 1 つも無い | 実測の保存 TX の中で採る（開始時には採らない）。採れなければ保存 TX 全体が失敗 | measured は必須、uncounted・auto_filled・legacy は NULL、recount は NOT NULL。表と列が入る前の実測は値を持たず、判定を受けない | DB の CHECK（SPEC-STK-TIME-D8-K1 の 6 つ目）と保存の BIZ |
| settlement_no の比較 | ASCII 数字だけの文字列を i64 として比べる | 0 の直前（−1）の資料は無いので条件不成立 | 比べられない値（数字以外・空・NULL・桁あふれ）は成り立たない側 | 同じ帳票種別・同じ machine_no の間だけ。精算票の題の末尾の番号とは比べない | BIZ（ADR D5a の番号の比べ方） |
| 精算日時の照合（Z004 の精算日時と EJ の記録の日時） | 分の精度の日時。差は 0 分か 1 分（Z004 が後）だけを同じとする | 差 0 は同じ分。日時の無い Z004 は対応づけできない | 0 件は EJ が届いていない扱い、2 件以上は対応づけできない扱い。どちらも EJ 待ち | どちらもレジの時計の値。同じ machine_no の間だけ。アプリの時計と比べない。前後の判定に使わない | 日次の EJ 取込みの lane の BIZ（ADR D5a の区間の終端） |

### runtime の lane への申し送り（形が変わる所。本 lane は code を書かない）

`rg -n 'source_cursor' src-tauri/src` と `rg -n 'fn (classify|receive_source|save_stocktake)' src-tauri/src/biz` の現物（開始 HEAD `7070382f`）。行番号は起票時のもので、runtime の lane は起票時に数え直す。

| 形が変わるもの | 作る所 | 読む所・test |
|---|---|---|
| 実測の証拠に `source_scan_cursor` を足す（schema） | `src-tauri/src/db/schema_time_evidence.rs:83`〜`:91`（`stocktake_items` の列と K1 の CHECK）、`:130`（`stocktake_recounts` の列） | 同 file の test（`:357`・`:377` の列の一覧、`:496`〜`:554` の INSERT、`:652`、`:733`、`:795`、`:834`） |
| 実測の保存が cursor を採る | `src-tauri/src/biz/stocktake_service/time_evidence.rs:404`（`save_stocktake_count`）と、証拠を組む `:515` | `src-tauri/src/db/stocktake_repo.rs:837`〜`:886`（measured の UPDATE と recount の INSERT）、`:1084`、`src-tauri/src/biz/stocktake_service/time_evidence_tests.rs` |
| 最新の有効な実測の読取りに cursor を足す | `src-tauri/src/db/stocktake_repo.rs:677`〜`:740`（`source_cursor` を読む SELECT と型） | `src-tauri/src/biz/csv_import_service/time_evidence.rs:205`（`classify_product`） |
| 分類に全部実測後の枝を足す | `src-tauri/src/biz/csv_import_service/time_evidence.rs:205`〜`:226`（`Measured` で `source_id <= source_cursor` でない枝の前） | `:228`（`classify_stock_rows`）、`src-tauri/src/biz/csv_import_service/tests/time_evidence_tests.rs` |
| `pos_source_scans`（新しい表）、Z004 を SD から読む経路、置き場の識別子の取得 | 無い（`src-tauri/src/io/` に `register_sd.rs` はまだ無い。SD 直読みの runtime の lane が作る。設計の `RegisterSdRoot`〈29 の日報 parser §29.7〉は path と表示用の `volume_label` だけで、識別子を持たない。接続の runtime lane が IO-09 に読取り専用の取得を足す） | 接続の runtime lane が起票時に Scope を決める |

## Non-scope

- runtime の code・test・fixture・migration・bindings・`90-traceability.md`・`scripts/probes/stocktake_time_model.py`。
- 番号印字の protocol の設計（採らない。TD-224）。IO-09 の型と関数への識別子の取得の追加（接続の runtime lane が 29 の日報 parser §29.7 を改める。本 lane は D10 に要件だけを書く）。
- EJ の記録の保存先、同じ番号で中身の違う記録の保存の扱い、読む file の絞り方、取込み画面（日次の EJ 取込みの lane）。
- Z004 を SD から読む経路の窓の決め方、読み直さずに受領済みと対応づけてよい条件、画面（接続の runtime lane）。
- 名称の重なりの検知と登録名の付け直しの支援（PLU 書出し側の別の変更。ADR D4）。
- 共有 JAN の手軽な解除（DATA-2）、Z004 layout B。
- 持ち帰りデータの新しい集計（Contract Probe の P1・P3・P7 の確認。本 run は既存の集計結果の引用だけ）。

## Acceptance Criteria

- AC1（D10 と D5a が正本にある）: `rg -c '^### SPEC-STK-TIME-D10: ' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1、`rg -c '^#### SPEC-STK-TIME-D5a: ' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1（開始 HEAD ではどちらも 0。`git show 7070382f:docs/adr/2026-09-18-stocktake-time-evidence.md | rg -c 'SPEC-STK-TIME-D(10|5a)'` は hit なしで exit 1）。
- AC2（「次の design lane」を担当とする live な記述が設計正本に 0）: `rg -n '次の ?design ?lane' docs --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/backlog.md'` の hit が 0（開始 HEAD の実測: ADR 12、32 に 1、29 の EJ parser に 4、io-task-specs に 1、Plans.md に 2。起票後の実測: 0）。`docs/backlog.md` は日付つきの経緯の 3 行（同項目の本文と STK-1・STK-2 の行）が残る。
- AC3（決定の記録）: `rg -c '^## D-116: ' docs/decision-log.md` が 1 で、その entry が Decision (1)〜(9)・Guarantee range・owner の決定（TD-224）を持つ。
- AC4（保存先の設計）: `rg -c 'pos_source_scans' docs/db-design/pos-tables.md` が 1、`rg -c 'source_scan_cursor' docs/db-design/tracking-system-tables.md` が 1 以上（開始 HEAD ではどちらも hit なし）。
- AC5（外部前提の観測と probe 表）: `rg -c '^\| 精算の書込み（ADR D10）' docs/function-design/32-biz-csv-import-service.md` が 1、`rg -c '^観測（2026-10-11' docs/function-design/32-biz-csv-import-service.md` が 1。ADR D5 の外部前提の段落が「観測したもの」と「まだ観測していない外部前提」に分かれ、観測を owner-operated gate の通過に数えない文を持つ。
- AC6（clear 行の段が実物に合う）: `rg -c 'Z004から落ち' docs/adr/2026-09-18-stocktake-time-evidence.md` が hit なし（開始 HEAD の実測: 3）。
- AC7（古い状態の文）: `rg -n 'Square か CASIO かの判断待ち）|実機確認が着手条件のまま' docs/Plans.md docs/backlog.md` の hit が 0（開始 HEAD の実測: Plans.md 2、backlog 1）。`docs/Plans.md` に lane の行を足していない（`git diff "$(git merge-base origin/main HEAD)" HEAD -- docs/Plans.md` の `+` の行に branch 名・PR 番号・Phase が無い）。
- AC10（媒体の名前を core の名前から外した）: `rg -n 'pos_sd_observations|sd_observation_cursor|SD ?の全数受領' docs --glob '!docs/archive/**' --glob '!docs/plans/**'` の hit が、`docs/decision-log.md` の D-116 の Alternatives の 1 行（旧い名前を不採用の案として挙げる行）だけ。`rg -c '番号印字は採らない' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1 以上、`rg -n '採否はownerの判断を待つ' docs/adr/2026-09-18-stocktake-time-evidence.md` が hit なし。
- AC11（有効にする・外す出口）: `rg -c '^\*\*有効にする・外す\*\*' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1 で、その段が、決める所（code だけ）・無効の間の保存・後から有効にしたときの扱い・外したときの適用済みの取込みの扱いを持つ。
- AC12（対応づけに番号の差を使わない）: `rg -c '題の末尾の番号に1を足した値' docs/adr/2026-09-18-stocktake-time-evidence.md` が hit なし（前の版 `c46e7418` の実測: 1）、`rg -c '同じ分かtの1分前' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1、`rg -c 'の翌日以降' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1 以上。
- AC8（docs だけ）: `git diff --name-only "$(git merge-base origin/main HEAD)" HEAD -- src src-tauri scripts package.json package-lock.json` の出力が空。
- AC9（検査）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0・WARN 0。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: `docs/adr/2026-09-18-stocktake-time-evidence.md` 適用範囲の但し書き・D4 の表・D5 の外部前提・D5a・D8・D10・㉘ への引継ぎ・Revisit Trigger／`docs/function-design/32-biz-csv-import-service.md` 時点証拠契約の「一つの分類関数とcommit」と「外部probeと本番条件」／`docs/function-design/29-io-ej-parser.md` IO-08.9・IO-08.10／`docs/function-design/29-io-daily-report-parser.md` §29.7.2（SD-02・SD-18・SD-22・SD-23。変えない）／`docs/function-design/37-biz-daily-report-import-service.md` §37.9 の引継ぎ／`docs/db-design/pos-tables.md`・`tracking-system-tables.md` の時点証拠契約／`docs/decision-log.md` D-103・D-105・D-109・D-111（変えない）・D-116。
- 必要な設計成果物（Design artifact selection の当たる行）: BIZ の判定の変更 = updated in this PR（ADR D10、32 手順 4）／表と列 = updated in this PR（pos-tables、tracking-system-tables。migration の番号と index は runtime）／EJ の入力の互換の規則（欠け）= updated in this PR（ADR D5a、29 の EJ parser）／durable な横断の決定 = D-116 と ADR／operator の流れ = existing sufficient（画面・文言・操作は増えない。ADR D9 を変えない）／Tauri command・DTO = 該当なし（wire に出す値が無い）。
- plan にしかない durable な判断の昇格先: 決めたことは全て ADR と D-116 に置いた（J1 の決定は D-116 の「owner の決定」と ADR D10 の番号印字の段）。packet にだけあるのは、J1 の選択肢の表（決定の記録）と、runtime の lane への行番号の申し送り。
- 前提・制約と、延期した design gap の follow-up: D10 は外部前提 P1〜P4・P10（Contract Probe）に依り、owner-operated gate の証拠がそろうまで全部実測後の枝を code に入れない（ADR D10 の「有効にする・外す」、32 の外部 probe 表の行）。延期: (a) 窓の決め方と、読み直さずに受領済みと対応づけてよい条件（接続の runtime lane。ADR D10 が「条件 2 を弱めない根拠を Contract Probe で示す」と縛る）。(b) 置き場の識別子を IO-09 のどの関数が返すか（接続の runtime lane。D10 が要件〈同じ媒体で変わらない・別の媒体と違う・読取り専用・取れなければ行を置かない〉を縛る）。(c) EJ の記録の保存と file の絞り方（日次の EJ 取込みの lane。D5a が欠けの判定を縛る）。(d) SD カード保存が異常終了した精算の Z004 の残り方（資料に例が無く確かめられない。D10 を有効にする変更の owner-operated gate に残す。証拠を得る手段が無いと分かった場合は、残る危険を受け入れて有効にするかを、その変更の lane が owner に諮る）。延期が安全な理由: どれも、決まるまで判定不能・EJ 待ち・対応づけできない扱い（数え直し）へ倒れ、在庫を黙って誤らせない。
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: 「全部実測後と判定した資料の販売は実測の後」の例外は、外部前提が崩れた場合（P1: 資料が精算の後でまとめて書かれる、P2: 精算で PLU の集計が 0 に戻らない、P3: path の日付と中身の精算日が違う、P4: 人が置き場に file を足す・消す、P10: 識別子が同じ媒体で変わる・別の媒体と重なる）だけで、ADR D10 の外部前提に全て書いた。媒体の入替・別の媒体の読取り・ファイルを選ぶ経路の資料は、条件 3（同じ置き場の 2 回の読取り）が成り立たないので例外にならない。崩れたと分かった後の出口は ADR D10 の「有効にする・外す」の 1 通り（枝を外す。適用済みは再判定せず、新しい実測で戻す）。「D4 の出口は変えない」は、D10 の条件を満たさない資料の全てが今までどおり判定不能になることで保つ（D10 は After を足すだけで、Before・Unknown・flag の理由・解消の規則を変えない）。「実測開始前に受領済み」と D10 の条件が同時に成り立つ場合は、D4 の表の文で前者を先に見る。共有 JAN の行は、D10 の実測後でも未実測と同じく保留の対象のまま。
- 判定（ready / not ready）と理由: ready（plan-draft に進める）。理由: 設計の出力（D10・D5a・D4 の表・D8 の表と列・外部前提の観測・後続の依存の表と合格条件・D-116）が上の正本にあり、owner の判断事項 J1 は 2026-10-11 に決まった（TD-224）。残る P1・P3・P7 の集計と P2・P10 の確認は、設計の問いではなく D10 を有効にする前の外部前提の確認で、結果がどちらでも正本の設計は変わらない（崩れれば D10 を有効にしない・D5a に足さない、だけ）。

## Registration / Generation Obligations

本 lane（docs だけ）は該当なし（function-design の新しい file・REQ の増減・route・画面・command を足さない。ADR に足した D5a・D10 は既存の file の中の節）。runtime の lane の義務: 時点証拠 schema に `pos_source_scans` と `source_scan_cursor` を足すときは `docs/function-design/22-mnt-migration.md` と ㉘ ⑤ の registry の登録に含める。分類の関数を cfg(test) の外へ出すとき（㉘ ⑤）は `src-tauri/tests/design_compliance_test.rs` の対応表に載せる（D-109 (3)）。

## Impact Review Lenses

実機確認・POS 連携・持ち帰りデータ起点なので適用する。

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | core: 「同じ置き場の 2 回の全数読取りの間に現れた資料の精算は、その間に行われた」と「実測の保存の順」で実測後を決める考え方、`pos_source_scans`・`source_scan_cursor`・判定の条件。名前に媒体を入れていない。adapter（CASIO 固有）: 置き場が SD の `XZ` / `XZ_BKUP` であること、Z004 の名前、置き場の識別子の取り方（ボリュームの通し番号）、Z004 を書く精算票の種類（日計明細とＰＬＵ）と、精算日時が記録の日時と同じ分か 1 分後という対応、記録ヘッダの 4 桁の欄 = machine_no、取引一連番号。D5a は CASIO の形に依る節で、レジが替わると D5a と IO-09・EJ parser を取り替える。D10 は、精算のたびに資料を書く置き場をアプリが読めるレジでだけ働く（ADR Consequences） | レジの入替が決まったとき（D-116 の Revisit） |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 観測は ADR D5 の「観測したもの」と 32 の観測の段落に分けて書き、gate の通過と区別した。未観測は「まだ観測していない外部前提」と D10 の外部前提。判断は D10・D5a・D-116 | Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 読取りの途中の失敗・中止は未完了の行で、判定に使わない。締められなかった日・媒体の入替・ファイルを選ぶ経路は判定不能に倒れる（Ordinary Operation）。判定そのものを外す出口は code の変更 1 通り（ADR D10）。再起動の後も行と cursor は DB に残る。同じ資料の再選択は最初の受領 ID のまま（D2）。取消の後の再取込みは同じ判定をやり直す。同一性拒否が後から付くと実測後から判定不能へ変わる（安全側） | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 操作は増えない（番号印字は採らない。TD-224）。数えた日の精算と次の精算の資料で売れた商品の数え直しが残る（Ordinary Operation） | 接続の runtime lane の L3（ADR の合格条件） |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | レジが替わると、D5a の対応づけの規則、置き場の読み方と識別子（IO-09）、D10 の外部前提の確認を取り替える。`pos_source_scans`・`source_scan_cursor`・D10 の条件・D4 の表は名前も形も残る。新しいレジが置き場を持たない場合は D10 が働かず、要再確認へ戻る（D-116 の Revisit） | D-116 の Revisit |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 観測は形と規則だけを書き、件数は既に `docs/backlog.md` にある数え直し済みの集計を参照するだけにした（新しい数は書かない）。新しい表は売上値・file 名・file 本体を持たない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | D10 は在庫の適用の可否だけを決め、売上の記録（sale_records）は変えない。全部実測後の資料の返品は通常の在庫の戻しで、相殺の判定を要しない（計数の後の販売と返品は帳簿へそのまま入れてよい） | Matrix |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 実 SD で、読取りの時点で無かった精算が後から現れること、SD カード保存が異常終了した精算の Z004 の残り方（P1）、ボリュームの通し番号が読取りをまたいで同じであること（P10）、通しの筋書き（数える → 終了 → 再起動 → 後日の取込み） | 接続の runtime lane の L3 と Contract Probe |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 置き場の識別子の取得は Windows の API（ボリュームの情報）に依る。Windows 以外と test では adapter が別の識別子を返す形にする（接続の runtime lane が決める。IO-09 の drive の列挙と同じ扱い） | — |

## Boundary / Wire Contract

本 lane は wire（Tauri command の DTO、bindings、JSON、CSV）を変えない。DB の保存の互換だけを書く。

- producer: 接続の runtime lane の BIZ（`pos_source_scans` の行）、実測の保存の BIZ（`source_scan_cursor`）
- consumer: 取込みの分類（32 の手順 4）
- wire type: 無し（DB の中だけ。UI・command に出さない）
- internal type: 行の ID と cursor は i64、`window_from` は YYYY-MM-DD の文字列、`medium_id` は adapter が返す文字列（等しいかどうかだけを比べる）
- precision/range: Scope の「値ごとの保証の表」
- round-trip path: 読取りの開始で識別子と `source_cursor_start` を持つ行を置く → 受領 → 完了で `window_from`・`source_cursor` を書く → 実測の保存で最大 ID を cursor に採る → 取込みの分類が、同じ識別子の 2 つの完了した行を読む
- invalid input: 未完了の行、識別子の違う行の組、形の違う日付、比べられない settlement_no は、条件不成立（判定不能）
- compatibility: 既存の表の列は変えない。時点証拠 schema は migration の registry に未登録（D-109）なので、登録の前に足せば既存の DB の移行は要らない

## Test Plan

Test Design Matrix: [2026-10-11-pos-series-design](test-matrices/2026-10-11-pos-series-design.md)（runtime の lane が実装する test の設計。本 lane は docs の検査だけ）。

- targeted tests: 本 lane は `bash scripts/doc-consistency-check.sh --target plan` と full。
- negative tests: Matrix の Negative Paths（runtime）。
- compatibility checks: D4 の既存の分類（NeverObserved・LegacyObserved・Before・Unknown）と flag の理由が変わらないこと（Matrix）。
- data safety checks: 本 lane の差分に実データ（JAN・商品名・金額・新しい件数・発言の原文）を入れない。
- main wiring/integration checks: runtime の lane。

## Review Focus

- Ordinary Operation の列が、正常な条件で目的（数えた商品が、数えた日の精算と次の精算を過ぎれば数え直しなしで減る）を達成できるか。達成を止める条件が D10 に隠れていないか。
- D10 の条件が、数える前の販売を含む資料を全部実測後と判定する入力・順序を持たないか（読取りの行を列挙の前に置く規則、保存の時点の cursor、直前の精算の資料がちょうど 1 つ、窓の日付、同じ置き場の 2 回の読取り、媒体の入替、ファイルを選ぶ経路、締められなかった日）。
- D5a の区間の終端が、番号の差がずれた資料・同じ日の続けての精算・レジの時計が戻った資料・中断と再実行で、誤った記録を 1 件として採らないか。日時を前後の判定に使っていないか。
- D5a の区間の終端・開始・欠けの定義が、ADR D4・D5 の既存の分岐（EJ 待ち・登録の変化・前回を証明できない・開始の証拠がない）と矛盾しないか。
- 観測と書いた前提が、tracked の出典（`docs/backlog.md` の入力 1・2、29 の構造所見、D-103・D-105・D-111）で裏づくか。観測を gate の通過と書いていないか。
- D10 の「有効にする・外す」が 1 通りに読めるか（決める所、無効の間の保存、後から有効にしたときの扱い、外したときの適用済みの取込み）。新しい設定・flag・画面を足していないか。
- core の名前（表・列・用語）に媒体やレジの名前が残っていないか。名前を変えて意味が曖昧になっていないか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| SPEC-STK-TIME-D10（考え方・全数読取り・置き場の識別子・実測側の保存・全部実測後の条件・締められなかった日と媒体の入替・外部前提・有効にする・外す・番号印字は採らない） | ADR D10 | 本 lane は設計の記録。runtime は接続の runtime lane と ㉘ ④ か ⑤ | runtime（Matrix の D10 の行） | L3: ADR の「㉘ への引継ぎ」の合格条件 |
| SPEC-STK-TIME-D5a（番号の比べ方・区間の終端〈精算の日時の同一性〉と開始・区切りにしない記録・欠け・読めない記録・時刻・「前回」の候補・同一性の比較と系列） | ADR D5a | 本 lane は設計の記録。runtime は日次の EJ 取込みの lane と ㉘ ④ | runtime（Matrix の D5a の行） | 非対象 |
| SPEC-STK-TIME-D4（判定の表に全部実測後の行、clear 行の箇条の事実の更新。出口・flag・解消は変えない） | ADR D4 | 同上 | runtime（Matrix の D4 の行） | 非対象 |
| SPEC-STK-TIME-D5（外部前提を観測と未観測に分ける。合計の照合の除外の理由、戻りの箇条の文。条件そのものは変えない） | ADR D5 | 本 lane の docs | 本 lane の AC5・AC6 | 非対象 |
| SPEC-STK-TIME-D8（`source_scan_cursor` と `pos_source_scans` の行）、SPEC-STK-TIME-D8-K1（6 つ目の項目） | ADR D8、pos-tables・tracking-system-tables の時点証拠契約 | runtime: `schema_time_evidence.rs` | runtime（Matrix の D8 の行） | 非対象 |
| ㉘ への引継ぎ（依存の表、接続の runtime lane の合格条件。TD-223） | ADR ㉘ への引継ぎ | 後続の lane の起票 | runtime（Matrix の通しの行） | L3: 通しの筋書き |
| BIZ-03 の分類の手順 4 と入力、外部 probe 表の「精算の書込み」の行と観測の段落 | 32 時点証拠契約 | runtime: `biz/csv_import_service/time_evidence.rs` | runtime（Matrix の D10 の行） | 非対象 |
| IO-08-D9（IO が判断しないことの表の 3 行）、IO-08-D10（欠けの定義の箇条） | 29 の EJ parser IO-08.9・IO-08.10、io-task-specs の IO-08 | 変えない（parser の出力は今のまま。責務の持ち主の記述だけ） | 既存の parser の test を変えない | 非対象 |
| BIZ-08-D3 の引継ぎ（Z004 を SD から読む経路が D10 を満たす） | 37 §37.9 の末尾 | 接続の runtime lane | runtime | 非対象 |
| D-116 | `docs/decision-log.md` | 本 lane の記録 | 本 lane の AC3 | 非対象 |
| 隣接の除外: SPEC-STK-TIME-D1（S / E の 1 文の言い換えだけ。context・保存・再送の契約は変えない）・D2（`source_cursor` を保存時に取り直さない）・D3（同一性 guard と拒否）・D6・D7・D9 | ADR | 変えない | 既存（㉘ ②・③ の test） | 非対象 |
| 隣接の除外: SPEC-STOP-D1〜D6（停止）、IO-09-D1〜D4・BIZ-08-D3〜D6（SD の読取りと日報）、IO-08-D1〜D8（EJ parser の文法と型）、SPEC-Z4A-D8（D-103） | 停止 ADR、29 の日報 parser、37、29 の EJ parser、23 | 変えない（参照だけ） | 非対象 | 非対象 |

## Contract Probe

本 run は実機・持ち帰りデータの新しい集計を行っていない。観測済みは tracked の出典の引用、未実測は確かめ方を書く。P1・P3・P5・P7 は持ち帰りデータの手元集計（2026-10-11、独立の数え直し済み。出力は件数・日付・番号だけ）の結果で、数は `docs/backlog.md` の同項目の入力 3 に置いた（`rg -n '入力 3（持ち帰りデータの手元集計 2026-10-11' docs/backlog.md` の行）。

- P1 商品別売上の資料（Z004）が置き場へ書かれるのは、その精算の操作の時点である（D10 の根拠）: 正常に保存された精算では観測した。2022-08-13 以降の完了した日計明細・ＰＬＵの精算票の全てが SD の Z004 の更新時刻の順位と 1 対 1 で、記録の日付と path の日付が全て同じ、更新時刻は記録の時刻の後で、後の精算でまとめて書かれた例は無い（入力 3 の (b)。`rg -c '後の精算でまとめて書かれた例は 0' docs/backlog.md` が 1）。完了した精算票の SD カード保存の状態は全て正常終了で、異常終了した精算の Z004 の残り方は資料に例が無く確かめられない（入力 3 の (c)）。店には SD カードのエラーで締められなかった日がある（repo 外の回答台帳 TD-160・TD-161）が、その日が精算をせずに終わった日か、保存だけ失敗した日かは分からず、資料の中の異常終了の行はスマートフォン送信と設定の書込みだけで、売上の保存の異常終了は無い。-> 正常な保存は観測、異常終了は未観測（確かめられない）。設計への効き方: 異常終了の項目は 32 の外部 probe 表の「精算の書込み」の行に残り、D10 を有効にする変更の owner-operated gate で扱う。証拠を得る手段（説明書・製造元の記載、実機）が無ければ、その変更の lane が残る危険の受け入れを owner に諮る。確かめるまで枝を入れない
- P2 資料の個数・金額は、直前の精算より後の販売・返品だけを持つ: PLU を 1 件登録して売ると個数の列に出ること、締めの後の新しい Z004 が開始時と整合したことは店の確認（repo 外の回答台帳 L-012・L-030）。区間ごとの EJ の商品の行の合計との一致は未実測（PLU で売った実例が少ない）。ADR D5 の「EJ完全性」の owner-operated gate と同じ確認で、D10 を有効にする変更の merge 条件に置く（32 の外部 probe 表）。-> 未実測
- P3 Z004 の path の日付（年・月の folder と名前の日）は、中身の精算日と同じ: 観測した。手元に中身のある Z004 の全てで同じ（入力 3 の (b)。`rg -c 'path の日付 = 中身の精算日' docs/backlog.md` が 1）。日付をまたぐ時刻の精算は資料に無く、その場合のずれは未観測。-> 観測（日付をまたぐ精算は未観測。D10 の条件 3 を「窓の始まりの翌日以降」にして 1 日のずれを受ける）
- P4 置き場の file を人が足さない・消さない・書き換えない: 店の運用の前提として ADR D10 に明記。SD を別の 1 枚に替えること・古い SD を後から読むこと・ファイルを選ぶ経路で取ることは、この前提に含めない（D10 の条件 3 がどれも判定不能に倒す。下の入力列）。-> 前提
- P5 精算票と Z004 の対応: 起票時に観測済みとした「題の末尾 + 1 = Z004 の settlement_no」は、0011 以降では成り立つが規則としては使えないと分かった。Z004 の settlement_no は Z004 を書いた精算の通し番号で、題の末尾とは別の番号で進み、差はＰＬＵだけの精算のたびに変わる（入力 3 の (a)。`rg -c '対応づけに番号の差を使わない' docs/backlog.md` が 1）。使い始めの 0001〜0010 は規則が外れ、うち 9 個は別の記録に 1 件として当たった。代わりに観測したのは、Z004 の中身の時刻が精算票の記録の時刻と同じ分か 1 分後であること（手元に中身のある Z004 の全て。入力 3 の (b)）。-> D5a の終端を日時の同一性に改めた。差が 1 分を超える資料・日時の無い Z004 は対応づけできない扱い（数え直し）に倒れる
- P6 EJ の 6 桁の番号は記録ごとに +1 で file と精算をまたいでも戻らない、記録ヘッダの 4 桁の欄 = machine_no: 観測済み。出典 `rg -n '全期間 8,624 件が \+1 で連続' docs/backlog.md` の行と `rg -n '6 桁の番号は記録ごとに \+1' docs/function-design/29-io-ej-parser.md` の行、`rg -n 'EJ の見出しの 4 桁 = machine_no' docs/backlog.md` の行。-> 観測
- P7 ＰＬＵの精算票: 完了したＰＬＵの精算票は Z004 を 1 本ずつ書き、題の末尾は対応する Z004 の番号と同じだった（入力 3 の (a)。母数は 3 で、最後は 2022-08 。規則として確かめるには足りない）。D5a は番号を使わず、ＰＬＵの精算票も日計明細と同じ日時の同一性で終端にする（手元に中身のある Z004 のうち相手がＰＬＵのものも日時が合った。`rg -c 'Daily. か .Plu' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1）。-> 観測（母数が小さい）。外れれば対応づけできない扱いに倒れる
- P8 番号印字の残る桁数・行数の内訳・取引の途中で打ったときの位置: 番号印字を採らない（TD-224）ので確かめない。EJ に残り売上・現金・Z 帳票に影響しないことは観測済み（Issue #105 の A7、`rg -n '番号印字（EJ の記録と取引番号・時刻との並び）= 2026-09-28 確認済み' docs/backlog.md` の行）。-> 不要
- P9 IO-09 が窓の始まりの日付で SD の entry を列挙する設計である: `rg -c 'fn list_register_sd_entries' docs/function-design/29-io-daily-report-parser.md` が 1（実測、2026-10-11）。runtime は未実装（`src-tauri/src/io/` に `register_sd.rs` が無い）。-> D10 は窓つきの読取りで成り立つ形（条件 3 の `window_from`）にした
- P10 置き場の識別子（SD のボリュームの通し番号）を読取り専用で取れ、同じ SD では読取りをまたいで同じ、別の SD では違う: 取得の API を含む feature が依存にあること（`rg -n 'Win32_Storage_FileSystem' src-tauri/Cargo.toml` が 1 行、実測 2026-10-11）だけ確かめた。店の reader と SD での値の安定は未実測。設計の `RegisterSdRoot` は識別子を持たない（`rg -n 'volume_label' docs/function-design/29-io-daily-report-parser.md` の行は表示用の名前）。-> 未実測（接続の runtime lane の Contract Probe と L3。取れない間は行を置かず、何も全部実測後にならない）
- 締められなかった日と媒体の入替の入力列（机上で D10 の条件に当てた。精算の番号は例、C は数えた商品の実測の保存）:
  - 列 1（精算をせずに終わった日）: C → エラーで締められず読取りも無い → 後日、精算 m → 全数読取り O（m を受領）→ 精算 m + 1 → 全数読取り O′（m + 1 を受領）→ 精算 m + 2 → 読取り。結果: m は P（m − 1）が O より前の受領で条件 3 不成立、m + 1 は P（m）が O の中の受領で O′ と組にならず不成立、m + 2 は P（m + 1）が O′ の中で初めて受領されて成立。締められなかった日の販売は m に入り、判定不能（要再確認）
  - 列 2（読めない資料が窓に残る）: 読取りは完了せず行は未完了のまま。完了した行が 2 つそろうまで何も成立しない
  - 列 3（SD を替え、古い SD の未読の資料を後からファイルで取る）: 古い SD で精算 n − 1（未読）→ SD を替える → 販売 → C → 新しい SD で精算 n → 読取り O（n を受領）→ 精算 n + 1 → 読取り O′ → 後日 n − 1 をファイルを選ぶ経路で受領 → n を取り込む。結果: P（n − 1）はどの読取りの中の受領でもないので条件 3 不成立、n は判定不能。起票時の形（読取り 1 つの後に初めて受領したことだけを見る）では、この列で n が全部実測後になり、C の前の販売を二重に引いた。条件を、同じ置き場の読取り 2 つの間に現れた資料へ改めた理由
  - 列 4（古い SD を後から読む）: C → 古い SD の全数読取り O（識別子 A）→ 新しい SD の読取り（識別子 B）で P を初めて受領。結果: 識別子が違うので組にならず不成立
  - 列 5（精算は済んで保存だけ失敗し、後の精算でまとめて書かれる。P1 が崩れる場合）: 精算 n（保存に失敗）→ 販売 → C → 読取り O → 精算 n + 1 で n の資料も書かれる → 読取り O′ で n を初めて受領。結果: n + 1 が成立し、C の前の販売を含む。D10 の条件では防げないので、P1 を確かめるまで枝を入れない（ADR D10 の外部前提と「有効にする・外す」）
- D5a の終端の入力列（机上で新しい規則に当てた。番号と日付は入力 3 の集計のもの）:
  - 使い始めの 0001〜0010: 番号の規則では 0001 に当たる記録が無く、0002〜0010 は別の記録ひとつに当たる。日時の同一性では、集計が「実際の相手」とした記録（日付と時刻が合う記録）がそのまま候補になる。同じ日に続けて精算した日（日計明細とＰＬＵが同じ日にある）で二つの記録の日時が幅の中に並べば候補が複数になり、対応づけできない扱い（誤った記録を採らない）
  - Z004 を書かなかった精算（使い始めの日計明細。入力 3 の日付ごとの件数が違う日）: どの Z004 の日時とも合わず、終端にならない。次の Z004 の開始の確認では「対応づく Z004 が無い」で前回を証明できない扱い
  - ＰＬＵだけの精算がもう一度ある（差が 2 になる）: ＰＬＵの精算票が自分の Z004 の終端になり、後の日計明細の精算票は自分の Z004 と日時で対応づく。番号の差に依らないので、1 つ後の記録を拾わない
  - 中断と再実行（同じ題の末尾の記録が続く）: 中断した精算票は完了でないので候補に入らず、再実行の完了した精算票だけが候補
  - 勤怠の精算票が同じ頃にある: 帳票の種類で候補に入らない
  - レジの時計が戻った箇所（2024-11）: 記録の日時も Z004 の中身の日時もレジの時計に従うので互いに合う。戻した先に同じ日時の完了した精算票がもうひとつあれば候補が複数になり、対応づけできない扱い。日時は合うかどうかだけを見て、前後を決めない
- D10 の条件 3 の日付の入力列（机上）:
  - レジの時計が戻った日に精算した資料 P: 精算日が窓の始まりより前になれば条件 3 が成り立たず、次の資料は判定不能。精算日が窓の中なら、O の時点で置き場にあれば列挙されて受領されているので、「O に無く O′ にある」は時計に依らず正しい
  - 時計が進められていた間の資料: path の日付が先の日付でも、窓は始まりだけを持つので列挙に入り、受領される
  - 日付をまたぐ時刻の精算（未観測）: path の日付が中身の精算日の前日で、窓の始まりの前日に当たると、置き場にあっても列挙されない。起票時の条件（精算日が窓の始まり以降）では、この資料が後の読取りで初めて受領されると「置き場に無かった」と数えた。条件を「窓の始まりの翌日以降」に改め、この列を成り立たなくした
  - 窓の始まりを決めるアプリの時計が狂っている: 窓が動くだけで、条件 3 は列挙の範囲と同じ値で比べるので、列挙されなかった資料を根拠にしない
- 観測済みで probe の要らない前提: SD の原本・取込み後の file・PC 側の複製が同じ bytes（29 の日報 parser の SD-22 の観測と SD-23 の推定）、戻の行に商品名が載る・締めで同じ日の EJ を SD から取れる・レジが clear を受け付ける（`docs/backlog.md` の同項目の 2026-10-06 の再確認）、clear した枠の行の残り方（D-103）。

## Data Safety

- tracked に書かない: 実 SD・EJ・Z 帳票の中身、実 JAN・商品名・部門名・金額、新しい件数（本 lane は `docs/backlog.md` に既にある数え直し済みの集計を参照するだけで、新しい数を足さない）、店の取引の頻度、店主・owner の発言の原文、repo 外の調査・相談の path の詳細。店の事実は「repo 外の回答台帳 TD-xxx / L-xxx」の参照と要旨で書いた。
- local-only: repo 外の回答台帳・外部設計相談の記録・持ち帰りデータと集計。
- synthetic-only: runtime の lane の test は合成の資料（合成の Z004・EJ の bytes、合成の SD の tree）だけを使う。

## Implementation Results

起票の段階（plan-draft）。設計正本の更新は Scope の表のとおり。runtime の実装は無い。

## Review Response

（review の後に書く）
