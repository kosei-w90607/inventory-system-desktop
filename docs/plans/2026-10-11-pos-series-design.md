# Plan Packet: 実測と POS の系列の対応を取得・保存する設計

wave に属さない単独の lane（design lane、docs だけ。runtime は後続の lane）。owner の lane 選択は 2026-10-11（repo 外の回答台帳 TD-222: 単位 U の runtime と本 lane の 2 本で始める）。並走は `agent/unit-runtime`（単位 U の runtime）、`agent/backup-offsite`（PR #155 Draft、D-114、docs の design）、`agent/plu-clear`（D-110）。本 lane の branch は `agent/pos-series-design`。

規模と手法（起票の最初に数えた）: 触る設計正本は 7 file（時点証拠 ADR、32、29 の EJ parser、io-task-specs、37、pos-tables、tracking-system-tables）と decision-log・backlog・Plans.md。画面 0、migration 0（proposed の表 1 つと列 1 つを設計に足すだけ）、wire の型 0。横断の約束がかかる経路は 4 つ（取込みの preview / commit の分類、実測の保存 2 経路〈進行中の明細・独立再実測〉、SD の読取り、EJ の区間の完全性）。**1 lane のまま進める**。分ける案（対応の取得・保存の設計と、日次の EJ 取込みの「欠け」の設計を別 lane にする）は採らない。理由: どちらも同じ観測（Z004 の精算回数、EJ の精算票の題、取引一連番号）から決まり、どちらも時点証拠 ADR の D5 の同じ段を書き換えるので、分けると 2 本の lane が同じ段を取り合う。決める値が少ない（保存する値は 4 つ）ので、横断の約束は下の Scope の「値ごとの保証の表」1 つにまとめた。

## Workflow State

- Phase: design
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

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（起票の時点。TD-221・TD-222・TD-223 は起票の前の lane 選択で、本 lane の介入に数えない） | 3（J1 の判断 1、Ready 1、merge 1） | 3（店主への問い 1 件の中継、Plan Review の round 天井に達したときの disposition、外部前提の扱い） | 6 = 0 + 3 + 3 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
POS の入力（Z004・EJ）と棚卸しの実測の前後の判定、その証拠の保存先（DB の表と列）、operator の数え直しの頻度を決める設計。本 lane は docs だけだが、後続の runtime が写す契約を決めるので R3。データの破壊・実店舗データの露出・不可逆な操作は無い（設計は SD に書かず、既存の数量・履歴を変える migration を持たない。tracked には件数の細部・商品名・金額を書かない）ので R4 ではない。この変更で required gate の green / red は変わらない（docs だけで、function-design の新しい file・REQ の増減・code の変更が無い）。Scope の予定 path を `scripts/ci/classify-changes.sh` の workflow の一覧（`AGENTS.md`・`CLAUDE.md`・`docs/DEV_WORKFLOW.md`・`docs/ci.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/code_review.md`・`docs/quality/review-checklist.md`・`docs/project-profile.md`・`docs/agent-guidance/*`・`docs/templates/*`・`.agents/*`・`.claude/{rules,commands,skills}/*`・PR template と、full に倒す `scripts/*`・`.github/*` の列）に当てて、当たる file は無い。Final Review Minimum 1。

## Goal

Goal Invariant:

### 最小完了条件

- 後続の runtime lane の Writer が、チャットの履歴を見ずに source docs だけで「数えた商品の、どの精算の資料を数え直しなしで在庫へ入れてよいか」を実装できる（時点証拠 ADR の SPEC-STK-TIME-D10 と D4 の表、32 の分類の手順 4、`pos_sd_observations` と `sd_observation_cursor`）。
- 日次の EJ 取込みの lane の Writer が、「EJ がそろっているか（欠け）」「どの記録がどの Z004 の区間の端か」「前回の Z004 はどれか」を推測せずに書ける（SPEC-STK-TIME-D5a、29 の EJ parser IO-08.9・IO-08.10）。
- ADR が次の design lane へ送っていた事項の全てに、決めた結果か、owner の判断待ちであること（番号印字）が正本に書かれ、「次の design lane」を担当とする live な記述が設計正本に残らない。
- 店の毎日の操作を増やさずに、数えた商品の要再確認が「数えた日の精算と次の精算の資料で売れた商品」に限られる設計になっている（増やす案〈番号印字〉は owner が選べる形で選択肢に並んでいる）。

### 失敗定義

- 設計が、数える前の販売をもう一度引く・数えた後の販売を引かない結果を、要再確認を付けずに通す経路を持つ。
- runtime の Writer が、観測の行をいつ置くか・実測のどの時点の値を保存するか・直前の精算の資料の選び方・欠けの判定の単位のどれかを推測しないと書けない。
- 未検証の外部前提（番号印字の桁・位置、精算の書込みの時点）を、確かめた事実として正本に書く。
- 設計が安全側へ倒れすぎて、普通の日（数えない日、数えてから 3 つ目以降の精算）に要再確認を付ける。

### 非目的

- runtime の code・test・fixture・migration・bindings（後続の lane）。`scripts/probes/stocktake_time_model.py` への D10 の追加（D10 を実装する runtime lane）。
- 番号印字の protocol（印の発行・保存・計数のまとまり・EJ での位置の決め方）の設計。J1 が「採る」に決まった後の設計の続き。
- EJ の記録の保存先・取込み画面・file の絞り方（日次の EJ 取込みの lane）。Z004 を SD から読む経路の窓と画面（接続の runtime lane）。
- ADR D1〜D9 の既存の契約、D4 の出口、UI の文言、準備照会の issue の変更。
- ADR の Status を accepted にすること（㉘ ⑤ で行う。D-109）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので、数える日とその後の日の操作列を置く。本 lane は docs だけで、表の通常運用は後続の runtime（㉘ ④・⑤、SD 直読みの runtime、接続の runtime lane、日次の EJ 取込み）の後に成り立つ。**この文書を完了できる**（設計正本がそろう）ことと、**通常運用を達成できる**（店で自動在庫連動が動く）ことは別で、後者は本 lane では未達。表は J1 で A（番号印字を採らない）を選んだ場合の列で、店の操作は今決まっている毎日の締め（SD を PC に差して読む。D-111）から増えない。精算の番号は例（数えた日の締めの精算を m とする）。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 数えない普通の日。在庫連動商品に実測の履歴が無い、または前回数えてから精算を 3 回以上済ませている | 締め: 精算 → SD を PC に差す → 「SD から読む」→ 取り込む | 売れた分が在庫から一度だけ減る。要再確認は出ない | 取込みの結果が出る | Z004 を SD から読む経路は接続の runtime lane。P1・P2・P3 |
| 棚卸しの日（営業中）。前日の締めで精算 m − 1 まで取込み済み | 商品ごとに「今から数える」→ 数える → 「数を保存」 | 数と、その時点の SD の読取りの位置がアプリに残る | 保存済みの表示 | ADR D1（既存） |
| 同じ日の締め | 精算（m）→ SD を読む → 取り込む | 数えた商品のうち、その日に売れた商品だけに「取り込んだ後に数の再確認が必要です」。売れなかった数えた商品と、数えていない商品には出ない（売れて同じ日に戻った商品は EJ の相殺の判定） | 要再確認の商品を数え直して保存すると消える | 相殺の判定は日次の EJ 取込みの後（それまでは EJ 待ちの表示）。ADR D4（既存） |
| 翌営業日の締め | 精算（m + 1）→ SD を読む → 取り込む | 前日に数えた商品のうち、この日に売れた商品に要再確認。ほかは出ない | 同上 | 精算 m + 1 の区間は、前日の SD の読取りより前の販売を含みうるので判定不能のまま（D10） |
| その次の営業日以降の締め | 精算（m + 2 以降）→ SD を読む → 取り込む | 数えた商品が売れても、数え直しなしで在庫から一度だけ減る | 取込みの結果が出る | D10 の全部実測後。P1・P2・P3 が成立していること |
| 棚卸しの日の締めの取込みを済ませた後に数えた | 数えて保存 → 翌営業日・その次の営業日の締め | 精算 m + 1 と m + 2 の資料で売れた数えた商品に要再確認。m + 3 から自動 | 同上 | 保存の後の最初の SD の読取りは翌営業日（D10） |
| 数えた後、アプリを終了し、PC を再起動し、何日か取り込まなかった | 後日の締めで SD を読み、溜まった精算を古い順に取り込む。その後も毎日取り込む | 溜まっていた精算と、その次の精算の資料で売れた数えた商品に要再確認。その次の精算から自動。保存済みの数と読取りの位置は再起動で消えない | 同上 | ADR の「㉘ への引継ぎ」の合格条件（TD-223）。接続の runtime lane の L3 |
| 年末の棚卸し（何日もかけて数え、最後に確定） | 毎日: 数える → 締めで取り込む → 要再確認が出た商品を数え直す。全商品に未解消の要再確認が無くなったら確定 | 確定できる。確定の後に取り込む資料で売れた商品は、上の行と同じ扱い（要再確認は商品単位の準備の表示に出て、独立再実測で消える） | 未解消の要再確認が 0 | ADR D4 の確定の拒否（既存） |
| SD を読めない日（ファイルを選ぶ経路だけで取り込む） | 「ファイルを選んで取り込む」 | 数えた商品が売れていれば要再確認（今の ADR と同じ）。全部実測後にはならない | 次に SD を読めた日から 2 つ後の精算で自動に戻る | ファイルを選ぶ経路は SD の全数受領を作らない（D10） |

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項

### J1 番号印字を採るか（未決）

確認済み事実:

- 今の ADR のままでは、数えた商品は数えた後に売れるたびに毎日要再確認になる（ADR Consequences）。本 lane の D10 は、店の操作を増やさずに、これを「数えた日の精算と次の精算の資料で売れた商品」に限る（Ordinary Operation）。
- レジの番号印字は、取引の外で打つと EJ に行として残り、売上・現金・Z 帳票に影響しない（訪店の確認 2026-09-28、Issue #105 の A7。`docs/backlog.md` の同項目の着手条件 (2)）。独自の記録ヘッダと番号を持たず、直前の記録の本文の後ろか、続く記録の本文の中に現れる（`docs/function-design/29-io-ej-parser.md:474`）。
- 番号印字で判定不能をさらに狭めるには、EJ の取込み（日次の EJ 取込みの lane）が先に要る。D10 は EJ が無くても働く。
- 店は今、紙の棚卸しで、数え終わった商品が売れたらその場で数を直している（repo 外の回答台帳 L-069）。D10 の後に残る数え直しは、この今の作業より範囲が狭い（数えた日の精算と次の精算だけ）。
- 着手条件 4 の筋書き（数える → アプリ終了 → OS 再起動 → 翌日の遅延取込みで、再計数なしに実測後の販売だけが一度減る。TD-223）のうち「翌日」の分は、A では満たさない。A で数え直しなしになるのは、取込みを再開した時点で SD にあった精算より 2 つ以上後の精算からで、それより前の資料で売れた数えた商品は数え直しになる。B はこの範囲を狭める。

未解決の判断: 棚卸しのたびにレジで番号を打つ操作を店に足して、数え直しの範囲をさらに狭めるか。

全ての選択肢:

| 案 | 店の操作 | 数え直しになる範囲（数えた在庫連動商品） | 追加の設計・前提 |
|---|---|---|---|
| A 番号印字を採らない（D10 だけ） | 増えない | 数えた後に初めて SD を読んだ時点で SD にあった精算と、その次の精算の資料で売れた商品 | 無し（D10 の外部前提 P1〜P3 だけ） |
| B D10 に番号印字を足す | 計数のまとまりの終わり（棚卸しの各日の数え終わり、独立再実測のたび）に、アプリが出した番号をレジで 1 回打つ | 前の締めから番号を打つまでの間に売れた商品だけ（打った後の販売と、次の精算の販売は自動） | 印の発行と保存、計数のまとまり、EJ での位置の決め方、打ち間違い・打ち忘れ・二重印字の出口の設計。未確認の前提 P8（残る桁数、2 行の内訳、取引の途中で打ったときの位置）。日次の EJ 取込みが前提。打ち忘れた日は A と同じ結果へ戻る |
| C 番号印字だけ（D10 を外す） | B と同じ | 打ち忘れ・EJ の欠けのたびに、今の ADR の毎日の要再確認へ戻る | B と同じ設計が要り、A より範囲が広がる場面がある。B に劣る |
| D 何も足さない（今の ADR のまま） | 増えない | 数えた後に売れるたびに毎日 | 無し。日次の自動在庫連動（D-070）に届かない |

条件付きの推奨: **A（candidate）**。理由: 店の操作が増えず、EJ の取込みを待たずに働き、未確認の前提が少ない。残る数え直しは店の今の作業より狭い。B は A の上に後から足せる（D10 は B でも打ち忘れの出口として残る）ので、今 A に決めても B の道を閉じない。前提: D10 の外部前提 P1〜P3 が成立すること（Contract Probe。崩れた場合は D10 を外し、B か D を選び直す）。B を今選ぶのが妥当になる条件（precondition-dependent）: 年末の棚卸しで、数えた商品が数えた日か次の営業日に売れる件数が、店主の手に余るほど多いと分かった場合。その件数は持ち帰りデータからは出せない（店は部門キーで売っており、商品ごとの販売の記録が無い）ので、店主への問い（下）か、運用を始めてからの実数で確かめる。A に決めた場合、TD-223 の合格条件の筋書きは ADR の「㉘ への引継ぎ」に書いた形（D10 が全部実測後と判定する資料は数え直しなしで一度だけ減り、判定不能のまま残る資料は要再確認と数え直しで現物の数へ戻る）になる。

J1 が決まるまで、番号印字と取引の単位の前後判定は正本に入れない（ADR D10 の番号印字の段、D-116 の「未決」）。A に決まれば正本の該当の段を「採らない」に改めて plan-draft へ進める。B に決まれば design を続ける。

### 店主に聞く候補（J1 の材料。過去に答えていないことは回答台帳と `open-questions.json` で確かめた）

- 年末の棚卸しの期間に、数え終わった商品が売れて数を直すことは、1 日に何品くらいあるか（数品か、十品を超えるか）。台帳には「売れたら都度直す」事実（L-069）だけがあり、件数の答えは無い。

## Scope

本 lane は docs だけを変える（予定 file の全部）。所有の列は並走 lane との重なり（`git diff --name-only 7070382f...agent/backup-offsite`・`...agent/plu-clear` の結果と、`agent/unit-runtime` の発注の範囲から）。

| file | 変更する節 | 他 lane との重なり |
|---|---|---|
| `docs/adr/2026-09-18-stocktake-time-evidence.md` | Status、適用範囲の但し書きの最終段落（決めたことの表）、D1 の S / E の 1 文、D4 の表と前後の文・clear 行の箇条、D5 の時刻の箇条・合計の照合の除外・戻りの箇条・外部前提の段落、D5a（新設）、D8 の表と 1 文、D10（新設）、Rejected Options の追記と 1 箇条、Consequences の 3 か所、㉘ への引継ぎ（依存の表と合格条件）、Evidence の 1 文、Revisit Trigger の最終段落 | なし |
| `docs/function-design/32-biz-csv-import-service.md` | 時点証拠契約の「一つの分類関数とcommit」の入力の文と手順 4、外部 probe 表の「精算の書込み」の行と表の後の観測の段落 | なし（`agent/unit-runtime` は Z004 の小数の配線をしない。D-113 (8)） |
| `docs/function-design/29-io-ej-parser.md` | IO-08.9 の表の 3 行、IO-08.10 の「欠け」の箇条 | なし |
| `docs/architecture/io-task-specs.md` | IO-08 の「行わない」の 1 行 | なし |
| `docs/function-design/37-biz-daily-report-import-service.md` | §37.9 の「Z004 と EJ への引継ぎ」の末尾に 2 文 | なし |
| `docs/db-design/pos-tables.md` | 時点証拠契約の表に `pos_sd_observations` の 1 行 | `agent/plu-clear` は `plu-tables.md` で別 file |
| `docs/db-design/tracking-system-tables.md` | 時点証拠契約の表に `sd_observation_cursor` の 1 行、SPEC-STK-TIME-D8-K1 の箇条に 1 つ | なし |
| `docs/decision-log.md` | 末尾に D-116 だけを追記 | 全 lane が末尾に追記（`agent/backup-offsite` = D-114 と D-111 の中の 1 行、`agent/plu-clear` = D-110）。merge 順で両方を残す |
| `docs/backlog.md` | 「実測とPOS系列の対応を取得・保存する」の項目（現在の状態の箇条を足し、日付つきの 2 箇条に 2026-10-11 の結果を足す）、「㉘ ③ 〜 ⑤ の申し送り」の箇条の 2 か所 | `agent/unit-runtime` は「単位の拡張」の項目だけ。`agent/backup-offsite` は backup の項目と「保存と起動の守りの follow-up」。行は重ならない |
| `docs/Plans.md` | 「次の着手順」の 1 の末尾の 1 句、その下の 2 段落の各 1 文、「次の行動」の後ろの製品の判断の節の STK-1 / STK-2 の行の 1 文。lane の行は足さない（D-097） | closeout の PR が「直近の完了」を触る。行は重ならない |
| `docs/plans/2026-10-11-pos-series-design.md`、`docs/plans/test-matrices/2026-10-11-pos-series-design.md` | 新設 | なし |

触らない: `src-tauri/`・`src/`・`scripts/`（`scripts/probes/stocktake_time_model.py` を含む）、`docs/function-design/90-traceability.md`（生成物）、`docs/function-design/23-io-z004-parser.md`（識別メタの抽出は変えない）、`docs/function-design/35-biz-stocktake-service.md`・`42-cmd-sales-stocktake.md`（保存の API と wire は変えない。`sd_observation_cursor` は保存 TX の中で BIZ が採り、wire に出さない）、`docs/project-memory.md`。

### 値ごとの保証の表（DB・wire に出す値）

本 lane が足す値は全て DB の中だけで、wire（Tauri command の DTO、bindings）には出ない。

| 値 | 範囲 | 0 の意味 | 失敗の時点と順序 | 種類の混在 | 保証する所 |
|---|---|---|---|---|---|
| `pos_sd_observations.id` | 正の整数（AUTOINCREMENT） | 取らない | SD の file の列挙より前に行を置く。置けなければ読取りを観測にしない | Z004 の読取りだけ | 接続の runtime lane の BIZ（ADR D10） |
| `pos_sd_observations.source_cursor` | 0 以上の整数、未完了は NULL | 受領済みの資料が 1 つも無い | 条件 1・2 を満たして受領を終えた後に書く。途中の失敗・中止は NULL のまま | `window_from` と両方 NULL か両方 NOT NULL | DB の CHECK（pos-tables）と BIZ |
| `pos_sd_observations.window_from` | YYYY-MM-DD、未完了は NULL | 取らない | 同上 | 資料の `settlement_date`（YYYY-MM-DD）と日付として比べる。形が違えば条件不成立 | BIZ（ADR D10 の条件 3） |
| `sd_observation_cursor`（実測の証拠） | 0 以上の整数 | 観測の行が 1 つも無い | 実測の保存 TX の中で採る（開始時には採らない）。採れなければ保存 TX 全体が失敗 | measured は必須、uncounted・auto_filled・legacy は NULL、recount は NOT NULL | DB の CHECK（SPEC-STK-TIME-D8-K1 の 6 つ目）と保存の BIZ |
| settlement_no の比較 | ASCII 数字だけの文字列を i64 として比べる | 0 の直前（−1）の資料は無いので条件不成立 | 比べられない値（数字以外・空・NULL・桁あふれ）は成り立たない側 | 同じ帳票種別・同じ machine_no の間だけ | BIZ（ADR D5a の番号の比べ方） |

### runtime の lane への申し送り（形が変わる所。本 lane は code を書かない）

`rg -n 'source_cursor' src-tauri/src` と `rg -n 'fn (classify|receive_source|save_stocktake)' src-tauri/src/biz` の現物（開始 HEAD `7070382f`）。行番号は起票時のもので、runtime の lane は起票時に数え直す。

| 形が変わるもの | 作る所 | 読む所・test |
|---|---|---|
| 実測の証拠に `sd_observation_cursor` を足す（schema） | `src-tauri/src/db/schema_time_evidence.rs:83`〜`:91`（`stocktake_items` の列と K1 の CHECK）、`:130`（`stocktake_recounts` の列） | 同 file の test（`:357`・`:377` の列の一覧、`:496`〜`:554` の INSERT、`:652`、`:733`、`:795`、`:834`） |
| 実測の保存が cursor を採る | `src-tauri/src/biz/stocktake_service/time_evidence.rs:404`（`save_stocktake_count`）と、証拠を組む `:515` | `src-tauri/src/db/stocktake_repo.rs:837`〜`:886`（measured の UPDATE と recount の INSERT）、`:1084`、`src-tauri/src/biz/stocktake_service/time_evidence_tests.rs` |
| 最新の有効な実測の読取りに cursor を足す | `src-tauri/src/db/stocktake_repo.rs:677`〜`:740`（`source_cursor` を読む SELECT と型） | `src-tauri/src/biz/csv_import_service/time_evidence.rs:205`（`classify_product`） |
| 分類に全部実測後の枝を足す | `src-tauri/src/biz/csv_import_service/time_evidence.rs:205`〜`:226`（`Measured` で `source_id <= source_cursor` でない枝の前） | `:228`（`classify_stock_rows`）、`src-tauri/src/biz/csv_import_service/tests/time_evidence_tests.rs` |
| `pos_sd_observations`（新しい表）と、Z004 を SD から読む経路 | 無い（`src-tauri/src/io/` に `register_sd.rs` はまだ無い。SD 直読みの runtime の lane が作る） | 接続の runtime lane が起票時に Scope を決める |

## Non-scope

- runtime の code・test・fixture・migration・bindings・`90-traceability.md`・`scripts/probes/stocktake_time_model.py`。
- 番号印字の protocol の設計（J1 が B に決まった場合の続き）。
- EJ の記録の保存先、同じ番号で中身の違う記録の保存の扱い、読む file の絞り方、取込み画面（日次の EJ 取込みの lane）。
- Z004 を SD から読む経路の窓の決め方、読み直さずに受領済みと対応づけてよい条件、画面（接続の runtime lane）。
- 名称の重なりの検知と登録名の付け直しの支援（PLU 書出し側の別の変更。ADR D4）。
- 共有 JAN の手軽な解除（DATA-2）、Z004 layout B。
- 持ち帰りデータの新しい集計（Contract Probe の P1・P3・P7 の確認。本 run は既存の集計結果の引用だけ）。

## Acceptance Criteria

- AC1（D10 と D5a が正本にある）: `rg -c '^### SPEC-STK-TIME-D10: ' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1、`rg -c '^#### SPEC-STK-TIME-D5a: ' docs/adr/2026-09-18-stocktake-time-evidence.md` が 1（開始 HEAD ではどちらも 0。`git show 7070382f:docs/adr/2026-09-18-stocktake-time-evidence.md | rg -c 'SPEC-STK-TIME-D(10|5a)'` は hit なしで exit 1）。
- AC2（「次の design lane」を担当とする live な記述が設計正本に 0）: `rg -n '次の ?design ?lane' docs --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/backlog.md'` の hit が 0（開始 HEAD の実測: ADR 12、32 に 1、29 の EJ parser に 4、io-task-specs に 1、Plans.md に 2。起票後の実測: 0）。`docs/backlog.md` は日付つきの経緯の 3 行（同項目の本文と STK-1・STK-2 の行）が残る。
- AC3（決定の記録）: `rg -c '^## D-116: ' docs/decision-log.md` が 1 で、その entry が Decision (1)〜(8)・Guarantee range・未決（番号印字）を持つ。
- AC4（保存先の設計）: `rg -c 'pos_sd_observations' docs/db-design/pos-tables.md` が 1 以上、`rg -c 'sd_observation_cursor' docs/db-design/tracking-system-tables.md` が 1 以上（開始 HEAD ではどちらも hit なし）。
- AC5（外部前提の観測と probe 表）: `rg -c '^\| 精算の書込み（ADR D10）' docs/function-design/32-biz-csv-import-service.md` が 1、`rg -c '^観測（2026-10-11' docs/function-design/32-biz-csv-import-service.md` が 1。ADR D5 の外部前提の段落が「観測したもの」と「まだ観測していない外部前提」に分かれ、観測を owner-operated gate の通過に数えない文を持つ。
- AC6（clear 行の段が実物に合う）: `rg -c 'Z004から落ち' docs/adr/2026-09-18-stocktake-time-evidence.md` が hit なし（開始 HEAD の実測: 3）。
- AC7（古い状態の文）: `rg -n 'Square か CASIO かの判断待ち）|実機確認が着手条件のまま' docs/Plans.md docs/backlog.md` の hit が 0（開始 HEAD の実測: Plans.md 2、backlog 1）。`docs/Plans.md` に lane の行を足していない（`git diff "$(git merge-base origin/main HEAD)" HEAD -- docs/Plans.md` の `+` の行に branch 名・PR 番号・Phase が無い）。
- AC8（docs だけ）: `git diff --name-only "$(git merge-base origin/main HEAD)" HEAD -- src src-tauri scripts package.json package-lock.json` の出力が空。
- AC9（検査）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0・WARN 0。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: `docs/adr/2026-09-18-stocktake-time-evidence.md` 適用範囲の但し書き・D4 の表・D5 の外部前提・D5a・D8・D10・㉘ への引継ぎ・Revisit Trigger／`docs/function-design/32-biz-csv-import-service.md` 時点証拠契約の「一つの分類関数とcommit」と「外部probeと本番条件」／`docs/function-design/29-io-ej-parser.md` IO-08.9・IO-08.10／`docs/function-design/29-io-daily-report-parser.md` §29.7.2（SD-02・SD-18・SD-22・SD-23。変えない）／`docs/function-design/37-biz-daily-report-import-service.md` §37.9 の引継ぎ／`docs/db-design/pos-tables.md`・`tracking-system-tables.md` の時点証拠契約／`docs/decision-log.md` D-103・D-105・D-109・D-111（変えない）・D-116。
- 必要な設計成果物（Design artifact selection の当たる行）: BIZ の判定の変更 = updated in this PR（ADR D10、32 手順 4）／表と列 = updated in this PR（pos-tables、tracking-system-tables。migration の番号と index は runtime）／EJ の入力の互換の規則（欠け）= updated in this PR（ADR D5a、29 の EJ parser）／durable な横断の決定 = D-116 と ADR／operator の流れ = existing sufficient（画面・文言・操作は増えない。ADR D9 を変えない）／Tauri command・DTO = 該当なし（wire に出す値が無い）。
- plan にしかない durable な判断の昇格先: 決めたことは全て ADR と D-116 に置いた。packet にだけあるのは J1 の選択肢と推奨（決まる前の判断材料）と、runtime の lane への行番号の申し送り。
- 前提・制約と、延期した design gap の follow-up: D10 は外部前提 P1〜P4（Contract Probe）に依り、成立が示されるまで有効にしない（32 の外部 probe 表の行）。延期: (a) 窓の決め方と、読み直さずに受領済みと対応づけてよい条件（接続の runtime lane。ADR D10 が「条件 1 を弱めない根拠を Contract Probe で示す」と縛る）。(b) EJ の記録の保存と file の絞り方（日次の EJ 取込みの lane。D5a が欠けの判定を縛る）。(c) ＰＬＵの精算票の題の末尾の番号と Z004 の対応（集計で確かめたら D5a に足す。D-116 の Revisit）。(d) 番号印字（J1）。延期が安全な理由: (a)〜(c) はどれも、決まるまで判定不能・EJ 待ち・対応づけできない扱い（数え直し）へ倒れ、在庫を黙って誤らせない。
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: 「全部実測後と判定した資料の販売は実測の後」の例外は外部前提が崩れた場合（P1: 精算の後でまとめて書かれる、P2: 精算で PLU の集計が 0 に戻らない、P3: path の日付と中身の精算日が違う、P4: 人が SD の file を消す・複数の SD を混ぜて条件 2 をすり抜ける）だけで、ADR D10 の外部前提に 4 つとも書いた。「D4 の出口は変えない」は、D10 の条件を満たさない資料の全てが今までどおり判定不能になることで保つ（D10 は After を足すだけで、Before・Unknown・flag の理由・解消の規則を変えない）。「実測開始前に受領済み」と D10 の条件が同時に成り立つ場合は、D4 の表の文で前者を先に見る。共有 JAN の行は、D10 の実測後でも未実測と同じく保留の対象のまま（全部実測前だけがスキップで commit できる）。
- 判定（ready / not ready）と理由: not ready（design のまま）。理由: J1（番号印字の採否）が owner の判断待ちで、決まるまで ADR D10 の番号印字の段と D-116 の「未決」が残る。J1 に依らない設計の出力は上の正本にそろっている。

## Registration / Generation Obligations

本 lane（docs だけ）は該当なし（function-design の新しい file・REQ の増減・route・画面・command を足さない。ADR に足した D5a・D10 は既存の file の中の節）。runtime の lane の義務: 時点証拠 schema に `pos_sd_observations` と `sd_observation_cursor` を足すときは `docs/function-design/22-mnt-migration.md` と ㉘ ⑤ の registry の登録に含める。分類の関数を cfg(test) の外へ出すとき（㉘ ⑤）は `src-tauri/tests/design_compliance_test.rs` の対応表に載せる（D-109 (3)）。

## Impact Review Lenses

実機確認・POS 連携・持ち帰りデータ起点なので適用する。

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | core: 「アプリが資料の置き場を全て読んだ読取りの順」と「実測の保存の順」で実測後を決める考え方、受領・cursor・判定の表。adapter（CASIO 固有）: SD の `XZ` / `XZ_BKUP` と Z004 の名前、精算票の題の末尾 + 1 の規則、記録ヘッダの 4 桁の欄 = machine_no、取引一連番号。D5a は CASIO の形に依る節で、レジが替わると D5a と IO-09・EJ parser を取り替える | レジの入替が決まったとき（D-116 の Revisit） |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 観測は ADR D5 の「観測したもの」と 32 の観測の段落に分けて書き、gate の通過と区別した。未観測は「まだ観測していない外部前提」と D10 の外部前提。判断は D10・D5a・D-116 | Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 読取りの途中の失敗・中止は未完了の行で、判定に使わない。再起動の後も行と cursor は DB に残る。同じ資料の再選択は最初の受領 ID のまま（D2）。取消の後の再取込みは同じ判定をやり直す。同一性拒否が後から付くと実測後から判定不能へ変わる（安全側） | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | A では操作は増えない。数えた日の精算と次の精算の資料で売れた商品の数え直しが残る（Ordinary Operation）。B は番号を打つ操作が増える（J1） | 接続の runtime lane の L3（ADR の合格条件） |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | レジが替わると、D5a の対応づけの規則、D10 の「SD に無かった精算は後に行われた」の根拠（P1）、IO-09 を取り替える。`pos_sd_observations` と cursor の考え方、D4 の表は残る | D-116 の Revisit |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 観測は形と規則だけを書き、件数は既に `docs/backlog.md` にある数え直し済みの集計を参照するだけにした（新しい数は書かない）。新しい表は売上値・file 名・file 本体を持たない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | D10 は在庫の適用の可否だけを決め、売上の記録（sale_records）は変えない。全部実測後の資料の返品は通常の在庫の戻しで、相殺の判定を要しない（計数の後の販売と返品は帳簿へそのまま入れてよい） | Matrix |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 実 SD で、読取りの時点で無かった精算が後から現れること、SD カード保存が異常終了した精算の Z004 の残り方（P1）、通しの筋書き（数える → 終了 → 再起動 → 後日の取込み） | 接続の runtime lane の L3 と Contract Probe |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 新しい環境依存は無い（SD の列挙は D-111 の IO-09 を使う） | — |

## Boundary / Wire Contract

本 lane は wire（Tauri command の DTO、bindings、JSON、CSV）を変えない。DB の保存の互換だけを書く。

- producer: 接続の runtime lane の BIZ（`pos_sd_observations` の行）、実測の保存の BIZ（`sd_observation_cursor`）
- consumer: 取込みの分類（32 の手順 4）
- wire type: 無し（DB の中だけ。UI・command に出さない）
- internal type: 行の ID と cursor は i64、`window_from` は YYYY-MM-DD の文字列
- precision/range: Scope の「値ごとの保証の表」
- round-trip path: 読取りの開始で行を置く → 受領 → 完了で `window_from`・`source_cursor` を書く → 実測の保存で最大 ID を cursor に採る → 取込みの分類が読む
- invalid input: 未完了の行、形の違う日付、比べられない settlement_no は、条件不成立（判定不能）
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
- D10 の条件が、数える前の販売を含む資料を全部実測後と判定する入力・順序を持たないか（読取りの行を列挙の前に置く規則、保存の時点の cursor、直前の精算の資料がちょうど 1 つ、窓の日付、別の SD）。
- D5a の区間の終端・開始・欠けの定義が、ADR D4・D5 の既存の分岐（EJ 待ち・登録の変化・前回を証明できない・開始の証拠がない）と矛盾しないか。
- 観測と書いた前提が、tracked の出典（`docs/backlog.md` の入力 1・2、29 の構造所見、D-103・D-105・D-111）で裏づくか。観測を gate の通過と書いていないか。
- J1 の選択肢が全てか、推奨の前提が正しく分類されているか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| SPEC-STK-TIME-D10（SD の全数受領・実測側の保存・全部実測後の条件・外部前提・番号印字の段） | ADR D10 | 本 lane は設計の記録。runtime は接続の runtime lane と ㉘ ④ か ⑤ | runtime（Matrix の D10 の行） | L3: ADR の「㉘ への引継ぎ」の合格条件 |
| SPEC-STK-TIME-D5a（番号の比べ方・区間の終端と開始・区切りにしない記録・欠け・読めない記録・時刻・「前回」の候補・同一性の比較と系列） | ADR D5a | 本 lane は設計の記録。runtime は日次の EJ 取込みの lane と ㉘ ④ | runtime（Matrix の D5a の行） | 非対象 |
| SPEC-STK-TIME-D4（判定の表に全部実測後の行、clear 行の箇条の事実の更新。出口・flag・解消は変えない） | ADR D4 | 同上 | runtime（Matrix の D4 の行） | 非対象 |
| SPEC-STK-TIME-D5（外部前提を観測と未観測に分ける。合計の照合の除外の理由、戻りの箇条の文。条件そのものは変えない） | ADR D5 | 本 lane の docs | 本 lane の AC5・AC6 | 非対象 |
| SPEC-STK-TIME-D8（`sd_observation_cursor` と `pos_sd_observations` の行）、SPEC-STK-TIME-D8-K1（6 つ目の項目） | ADR D8、pos-tables・tracking-system-tables の時点証拠契約 | runtime: `schema_time_evidence.rs` | runtime（Matrix の D8 の行） | 非対象 |
| ㉘ への引継ぎ（依存の表、接続の runtime lane の合格条件。TD-223） | ADR ㉘ への引継ぎ | 後続の lane の起票 | runtime（Matrix の通しの行） | L3: 通しの筋書き |
| BIZ-03 の分類の手順 4 と入力、外部 probe 表の「精算の書込み」の行と観測の段落 | 32 時点証拠契約 | runtime: `biz/csv_import_service/time_evidence.rs` | runtime（Matrix の D10 の行） | 非対象 |
| IO-08-D9（IO が判断しないことの表の 3 行）、IO-08-D10（欠けの定義の箇条） | 29 の EJ parser IO-08.9・IO-08.10、io-task-specs の IO-08 | 変えない（parser の出力は今のまま。責務の持ち主の記述だけ） | 既存の parser の test を変えない | 非対象 |
| BIZ-08-D3 の引継ぎ（Z004 を SD から読む経路が D10 を満たす） | 37 §37.9 の末尾 | 接続の runtime lane | runtime | 非対象 |
| D-116 | `docs/decision-log.md` | 本 lane の記録 | 本 lane の AC3 | 非対象 |
| 隣接の除外: SPEC-STK-TIME-D1（S / E の 1 文の言い換えだけ。context・保存・再送の契約は変えない）・D2（`source_cursor` を保存時に取り直さない）・D3（同一性 guard と拒否）・D6・D7・D9 | ADR | 変えない | 既存（㉘ ②・③ の test） | 非対象 |
| 隣接の除外: SPEC-STOP-D1〜D6（停止）、IO-09-D1〜D4・BIZ-08-D3〜D6（SD の読取りと日報）、IO-08-D1〜D8（EJ parser の文法と型）、SPEC-Z4A-D8（D-103） | 停止 ADR、29 の日報 parser、37、29 の EJ parser、23 | 変えない（参照だけ） | 非対象 | 非対象 |

## Contract Probe

本 run は実機・持ち帰りデータの新しい集計を行っていない。観測済みは tracked の出典の引用、未実測は確かめ方を書く。

- P1 Z004 が SD へ書かれるのは、その精算の操作の時点である（D10 の根拠）: 説明書の記載（SD が無いと精算できない）は `rg -n 'SD-18' docs/function-design/29-io-daily-report-parser.md` の行、精算のときだけ書かれることは D-111 の運用の制約の文。精算票の SD カード保存が異常終了した精算の Z004 がいつ・どう残るかは未実測。確かめ方: 持ち帰りの EJ で、精算票の `SDｶｰﾄﾞ保存` の状態の行の結果ごとに記録を数え（1 記録 = 1 件）、異常終了の精算に対応する Z004 が SD にあるか、その path の日付が精算の日かを見る（新しい集計。`/home/kosei/projects/inventory-system-public/.local/checklists/field-data.md` の手順で、別の担当の数え直しの後に結果を書く）。-> 未実測（Plan Gate の前に行う）
- P2 Z004 の個数・金額は、直前の Z004 の精算より後の販売・返品だけを持つ: PLU を 1 件登録して売ると個数の列に出ること、締めの後の新しい Z004 が開始時と整合したことは店の確認（repo 外の回答台帳 L-012・L-030）。区間ごとの EJ の商品の行の合計との一致は未実測（PLU で売った実例が少ない）。ADR D5 の「EJ完全性」の owner-operated gate と同じ確認で、D10 を有効にする lane の merge 条件に置く（32 の外部 probe 表）。-> 未実測
- P3 Z004 の path の日付（年・月の folder と名前の日）は、中身の精算日と同じ: 未実測。確かめ方: 持ち帰りの Z004 の全 file（1 file = 1 件）で、path の年月日と中身のメタ行の日付を比べ、違う file の本数を出す（新しい集計）。-> 未実測（Plan Gate の前に行う）
- P4 SD は同じ 1 枚を使い続け、file を人が消さない: 店の運用の前提。別の SD の読取りは D10 の条件 2 が数えない。SD を替えたことがあるかは台帳に答えが無い（聞かなくても設計は安全側。替えた日は観測にならず、次に続けて読めた日から戻る）。-> 前提として ADR D10 に明記
- P5 完了した日計明細の精算票の題の末尾 + 1 = Z004 の settlement_no、Z004 の settlement_no は Z004 ごとに +1 で他の Z 帳票と共有しない: 観測済み。出典 `rg -n '入力 1（精算系列' docs/backlog.md` の行（持ち帰りデータの手元集計 2026-09-29、数え直し済み）。使い始めの期間は規則が成り立たない（同じ行）。-> 観測（D5a は規則に合わない資料を対応づけできない扱いにする）
- P6 EJ の 6 桁の番号は記録ごとに +1 で file と精算をまたいでも戻らない、記録ヘッダの 4 桁の欄 = machine_no: 観測済み。出典 `rg -n '全期間 8,624 件が \+1 で連続' docs/backlog.md` の行と `rg -n '6 桁の番号は記録ごとに \+1' docs/function-design/29-io-ej-parser.md` の行、`rg -n 'EJ の見出しの 4 桁 = machine_no' docs/backlog.md` の行。-> 観測
- P7 ＰＬＵの精算票の題の末尾の番号と Z004 の settlement_no の対応の規則: 未実測（tracked の集計の記録に規則が書かれていない）。D5a は終端の対応づけに使わない（対応づけできない扱い）。確かめ方: 持ち帰りの EJ の完了したＰＬＵの精算票（1 記録 = 1 件）で、題の末尾の番号と同じ日の Z004 の settlement_no を並べる（新しい集計）。-> 未実測（決まらなくても安全側。D-116 の Revisit）
- P8 番号印字の残る桁数、1 回の操作で残る行数の内訳、取引の途中で打ったときの位置: 未実測。J1 で B を選ぶ場合だけ要る。EJ に残り売上・現金・Z 帳票に影響しないことは観測済み（Issue #105 の A7、`rg -n '番号印字（EJ の記録と取引番号・時刻との並び）= 2026-09-28 確認済み' docs/backlog.md` の行）。-> A では不要
- P9 IO-09 が窓の始まりの日付で SD の entry を列挙する設計である: `rg -c 'fn list_register_sd_entries' docs/function-design/29-io-daily-report-parser.md` が 1（実測、2026-10-11）。runtime は未実装（`src-tauri/src/io/` に `register_sd.rs` が無い）。-> D10 は窓つきの読取りで成り立つ形（条件 3 の `window_from`）にした
- 観測済みで probe の要らない前提: SD の原本・取込み後の file・PC 側の複製が同じ bytes（29 の日報 parser の SD-22 の観測と SD-23 の推定）、戻の行に商品名が載る・締めで同じ日の EJ を SD から取れる・レジが clear を受け付ける（`docs/backlog.md` の同項目の 2026-10-06 の再確認）、clear した枠の行の残り方（D-103）。

## Data Safety

- tracked に書かない: 実 SD・EJ・Z 帳票の中身、実 JAN・商品名・部門名・金額、新しい件数（本 lane は `docs/backlog.md` に既にある数え直し済みの集計を参照するだけで、新しい数を足さない）、店の取引の頻度、店主・owner の発言の原文、repo 外の調査・相談の path の詳細。店の事実は「repo 外の回答台帳 TD-xxx / L-xxx」の参照と要旨で書いた。
- local-only: repo 外の回答台帳・外部設計相談の記録・持ち帰りデータと集計。
- synthetic-only: runtime の lane の test は合成の資料（合成の Z004・EJ の bytes、合成の SD の tree）だけを使う。

## Implementation Results

起票の段階（design）。設計正本の更新は Scope の表のとおり。runtime の実装は無い。

## Review Response

（review の後に書く）
