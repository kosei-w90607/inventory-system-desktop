# Plan Packet: 単位・数量・原価の精度の見直しの結果を設計正本へ置き換える

wave に属さない単独の lane（design lane、docs だけ。runtime は後続の lane）。設計の見直し（事実だけを集め、白紙の骨組みと今の設計を突き合わせ、owner が採否を決める）を単位・数量・原価の精度の領域で行い（repo 外の回答台帳 TD-258・TD-295）、owner が採否を決めた結果（TD-297 の U1〜U8）を正本へ置き換える。並走の lane は棚卸しの数の置き場と在庫数の求め直しの design lane（PR #167、branch `agent/stocktake-pos-redesign-design`、D-118）で、そちらが先に merge する見込み。本 lane の branch は `agent/unit-redesign-design`（起点 main `ea15360d`）。

規模と手法（起票の最初に数えた。file の数は `git diff --name-only ea15360d HEAD -- docs ':(exclude)docs/plans'` の 10 file）: 触る設計正本は 7 file（function-design の 10・22・30・31・51、db-design の master-tables・transaction-tables）と decision-log・backlog・project-memory。画面 1（UI-01b 商品フォーム。単位の select と原価の入力の補助）。migration 0（後続の原価の lane が足す 1 本〈vB〉を 22 §16 に設計した）。wire の型 0（後続で変わる型は、単位の語の直しの lane の `ProductUpdateRequest` の 1 つ〈`stock_unit` を足す〉と、原価の lane の原価の型〈D-113 のまま〉）。横断の約束がかかる経路は 3 つ（DB の作り直しの順〈原価の lane と D-118 の棚卸しの runtime の 2 つの migration〉、単位の変更〈商品フォーム・商品 CSV の上書き・BIZ の検査・操作ログ〉、原価の入力の補助〈商品フォーム → 原価の欄〉）。**1 lane のまま進める**。横断の約束のうち多くの経路にかかるのは DB の作り直しの順だけで、22 §16 の「DB の作り直しを 1 回にまとめる順」の 1 か所に置き、backlog と D-119 はそこを引く。分ける案（vC の撤去と単位の変更を別の lane にする）は採らない。理由: どちらも共通規則 SPEC-UNIT と D-113 の同じ段を書き換え、分けると 2 本が同じ段を取り合う。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（本 run の起草役）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3・design lane）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/unit-redesign-design

遷移の記録:

1. kickoff → spec-check（2026-10-17、起草役）: owner の決定（repo 外の回答台帳 TD-297 の U1〜U8）と見直しの成果物（repo 外。事実の一覧・白紙の骨組み・突き合わせ）の置換えを Scope にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-17、起草役）: 触る正本（共通規則 SPEC-UNIT-D1・D2・D4・D5 と「入力の上限と安全な整数の範囲」の掛ける lane、22 §16、master-tables・transaction-tables の「単位と原価の精度の契約」、30 BIZ-01-D8・§4.4、31 の原価の段、51 UI-01b-D5）が、vC の変換・範囲の検査・旧版へ戻す手順と、単位を登録の後に一切変えない規則を契約として持ち、前提の文の一部が事実と合わない。同じ commit で設計正本を更新した（下の Design Readiness）。
3. design → plan-draft（2026-10-17、起草役、同じ commit）: 条件「設計の出力が正本にある」は Design Readiness の引く正本と D-119 で満たす。条件「未解決の設計の問いが無い」は、owner の判断事項（U1〜U8）が決まり、U5・U6 は店に聞く問いとして答えが無い間の既定を正本に書いたことで満たす。DB の作り直しの順は既定（原価の lane を先）を 22 §16 に書き、逆の順になるときに owner に諮る条件も書いた。残る外部前提（Contract Probe の P1）は原価の lane の起票の前に確かめるもので、設計の問いではない。plan-gate への遷移は Coordinator。
4. plan-draft → plan-gate（2026-10-17、Coordinator）: packet と Matrix は起草役の commit（`17a2157a`・`e9151990`）にある。Coordinator は packet の全文（Goal・Ordinary Operation・Scope と PR #167 との所有表・AC・Design Readiness・Boundary / Wire Contract・Contract Ledger・Contract Probe・Data Safety）と Matrix の節の構成を読み、owner の決定（repo 外の回答台帳 TD-297）の写しに食い違いが無いこと、差分が docs だけであること（AC11）、追加の行に新しい実データが無いことを確かめた。DB の作り直しを原価の lane で 1 回にする順を採る。Plan Review round 1 へ出す。
5. plan-gate（round 1 の是正、2026-10-17、Coordinator）: Plan Review round 1（Claude 側 fresh Opus 5.5・Codex GPT-6 Astra）の是正（Review Response 参照）。起草役が `f4d0db64` で直し、Coordinator が差分（22 §16 の作り直しの手順と DB を見つける場所の表、30 の上書きの段の今と後の分割・`plu_dirty`・操作ログ）を読んだ。Scope の範囲と設計の方向は変えず、その場で直したので plan-gate に留める。Plan Review round 2 へ出す。

## Owner Effort Budget

- 介入回数上限: 9（既定の 6 から owner が改定、repo 外の回答台帳 TD-296 の 5a）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 9（owner の改定、TD-296） | 0（起票の時点。TD-297 は起票の前の見直しの採否で、本 lane の介入に数えない） | 2（Ready 1・merge 1。plan-approved は TD-296 の 4a で Coordinator が進める） | 7（Plan Review の findings で owner の判断が要るとき） | 9 = 0 + 2 + 7 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
DB の migration（原価の起点の migration vB と単位の CHECK）、Tauri command の DTO（`ProductUpdateRequest` に `stock_unit`、原価の型）、operator workflow（商品フォームの単位の変更と原価の入力の補助、商品 CSV の上書きの行の error）の契約を決める設計。本 lane は docs だけだが、後続の runtime が写す契約を決めるので R3。R4 ではない: 本 lane はデータを動かさず、設計した vB は行の無い DB にだけ当たって値を変えない（行のある DB では何も変えずに止まる）。開発・試験 DB の作り直しは owner が承認済みで（TD-297）、古い file を消さずに移す形で設計した（作り直す DB と保全の範囲は原価の lane の packet）。本番の DB は無い。この変更で required gate の green / red は変わらない: docs だけで、classifier は function-design の変更で traceability の検査（rust_drift）を回すが、REQ の参照は増減していない。設計書の code block の関数の signature を足していないので設計照合 test（`cargo test --test design_compliance_test`）は green のまま（下の AC12）。Scope の予定 path を `scripts/ci/classify-changes.sh` の workflow の一覧（`AGENTS.md`・`CLAUDE.md`・`docs/DEV_WORKFLOW.md`・`docs/ci.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/code_review.md`・`docs/quality/review-checklist.md`・`docs/project-profile.md`・`docs/agent-guidance/*`・`docs/templates/*`・`.agents/*`・`.claude/{rules,commands,skills}/*`・PR template と、full に倒す `scripts/*`・`.github/*` の列）に当てて、当たる file は無い。Final Review Minimum 1。

## Goal

Goal Invariant:

### 最小完了条件

- 後続の runtime の lane の Writer が、チャットの履歴と repo 外の見直しの成果物を見ずに、source docs だけで次を実装できる: 原価の起点の migration vB（行の無い DB にだけ当たり列名だけを変える、行のある DB では止まる、巻・cm を前提つきで外す。22 §16 MNT-03-D14）と、それに伴う DB の作り直しの手順と順（原価の lane を棚卸しの runtime より先に入れて作り直しを 1 回にする）、個数の単位どうしの単位の変更（共通規則 SPEC-UNIT-D2、30 BIZ-01-D8・§4.4、51 UI-01b-D23）、原価の入力の補助（SPEC-UNIT-D5、UI-01b-D24）。
- vC の変換・範囲の検査・連続適用の失敗の test・旧版へ戻す手順の原価の部分が live な契約として正本に残らない（D-113 の本文と D-119 の Alternatives の記録は除く）。
- 店に聞く 2 つの問い（U5 長さの商品の在庫の減らし方、U6 原価の税）が、答えが無い間の既定と答えで変わる所とともに正本（SPEC-UNIT-D4・D5）と backlog にある。
- 前提の食い違い（突き合わせの C-09・C-16・C-18 と文書の食い違い 1〜3・5）の文が事実に合う。C-16・C-18 は今の設計が事実に合うので文を変えない（C-16 は U5 の未決として書いた。C-18 は骨組みの側の取り違え）。文書の食い違い 4（project-memory の日報の parser）は PR #167 が同じ行を直す。
- D-119 が decision-log にあり、D-113 に置換えの行と前提の訂正の行がある。後続の lane（C・単位の語の直し・P・⑤）の範囲と Risk が backlog にある。

### 失敗定義

- 正本のどこかに、原価の円の値を 1/100 円へ変換する live な契約（vC の 100 倍、範囲の検査、余りの検証、旧版へ戻す手順の原価の部分）が残る。
- vB が行のある DB で何かを変えうる、または行のある DB を黙って通す設計になる。
- 単位の変更で、種類をまたぐ変更（個数 ↔ 長さ）か長さの単位の商品の変更を許す経路が残る（商品フォーム・商品 CSV の上書き・BIZ のどれか）。
- 巻・cm を前提（最新の在庫 Excel で 0 行）を確かめずに外す、または今の DB に新しい migration で外す契約になる。
- U5・U6 を本 lane で決める、または答えが無い間の既定が書かれていない。
- 設計照合 test・traceability の検査を red にする変更を入れる。
- PR #167 が触る節（各文書の「計数の置き場と在庫の求め直しの契約」、master-tables の写しの列、35・73 の棚卸し、22 の migration の段のうち時点証拠の列の項）を書き換える。
- 公開 repo に店の運用の細部・金額・商品名・JAN・部門名・発言の原文を書く。

### 非目的

- code・migration・bindings・test の変更（原価の lane と単位の語の直しの lane）。
- 単位の一覧の今の 12 個の記述と個数の単位の数（今 10 個）の記述を、各文書で巻・cm を外した後の形に書き換えること（外すのは作り直しの起点で、各文書の現行の記述は原価の lane が実装と一緒に直す。backlog の原価の lane の範囲に列挙した）。
- U5・U6 の決定、P（Z004・EJ の数量の配線）と ⑤（棚卸しの runtime）の設計の変更。
- 行の金額の wire（十進の文字列、SPEC-UNIT-D6）と v8 の保存済みの値の上限の検査を外すこと（突き合わせの C-27・C-34。下の Scope の 1）。
- 入力の上限の数字を変えること（突き合わせの G8）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので、作り直しの日と普段の日の操作列を置く。本 lane は docs だけで、表の通常運用は後続の runtime（原価の lane、単位の語の直しの lane）の後に成り立つ。**この文書を完了できる**（設計正本がそろう）ことと、**通常運用を達成できる**（店が 1/100 円の原価で登録し、単位の語を直せる）ことは別で、後者は本 lane では未達。U5・U6 の店の答えは本 lane の外。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 原価の lane の起票の前。U6 の答えと最新の在庫 Excel がまだ無い | owner が店に原価の税を聞き、Excel を持ち帰る | 原価の lane を起票できるか（U6）と、巻・cm を外すか（U1）が決まる | U6 の答えが出た | P1（Excel の巻・cm）、U6 |
| 原価の lane を入れた版。開発・試験 DB（owner の PC の L3 用を含む）に商品がある。起動の作業フォルダに過去の移行の旧 DB が残っていることがある | 新しい版のアプリを起動する | 復元の遺物があれば reconcile が先に解く。vB が `作り直し` と表名の message で止まり、DB は何も変わらない。旧版のアプリでそのまま開ける | 開発者が作り直す | 22 §16 の vB の手順 2、作り直しの手順の (c) |
| 同じ DB | 開発者がアプリを止め、22 §16 の作り直しの手順で、起動のときに DB を見つける場所の全部（(a) `{app_data}` の DB 一式、(b) `.migrating`、(d) 起動の方法ごとの作業フォルダの旧 DB 一式。(c) の遺物は先に reconcile が解いた）を消さずに日付の付いた 1 つの folder へ移し、どれも残っていないことを確かめてから新しい版を起動する | (a) も (d) も無いので旧 DB の取込みは起きず、空の DB が作られ、v1 から vB までが当たる。原価の列は `_centi`、単位は前提が確かめられていれば巻・cm を外した後の一覧（個数の単位 9 個と `m`） | 初期投入をやり直す | P2（空の表の `RENAME COLUMN`）、P6（起動の DB の場所） |
| 作り直した DB | 商品 CSV か商品フォームで商品を登録する。ばらす商品は原価の欄の「袋の値段から出す」で袋の値段と入り数を入れる | 原価が 1/100 円で入る（`1000` 円 ÷ 12 → `83.33` 円）。袋の値段と入り数は残らない | — | UI-01b-D24 |
| その後、棚卸しの runtime（D-118）を入れた版 | 新しい版を起動する | 作り直した DB には棚卸しの明細も Z004 の取込みも無い（停止 ADR が止めている）ので、棚卸しの runtime の migration は止まらずに当たる。作り直しは 2 回目が要らない | — | P3（停止の範囲） |
| 単位の語の直しの lane の後。毛糸の商品が「個」で登録されている | 商品修正で数量単位を「玉」にして保存する | 単位の語が「玉」になり、在庫の数と過去の記録の数は変わらない（過去の記録も「玉」で出る）。操作ログに `stock_unit` の前後が残る | — | UI-01b-D23 |
| 同じ。長さの単位の商品 | 商品修正を開く | 数量単位は読取専用のまま（個数 ↔ 長さ、`m` ↔ `cm` は変えない） | — | SPEC-UNIT-D2 |
| 同じ。商品 CSV の上書きで、個数の商品の `在庫単位` を長さの単位にした | preview | 行の error `在庫単位は個数の単位どうしでだけ変えられます（登録: 個、CSV: m）`。commit も TX の中で同じ規則で拒む | CSV を直す | BIZ-01-D8 |
| U6 の答えが出ないまま、棚卸しの runtime を先に入れる必要が出た | Coordinator が owner に諮る | 作り直しが 2 回になること（棚卸しの runtime で 1 回、後の vB で 1 回）を owner が受け入れるか、原価の lane を待つかを決める | owner の判断 | 22 §16 の「DB の作り直しを 1 回にまとめる順」 |

## Scope

本 lane は docs だけ。下の file の、下の節を書き換えた（全部 plan-first の commit）。

1. 過剰の候補の撤去と外す時点（突き合わせの §4。round 1 の是正、Review Response 参照）: C-21（vC）= [22](../function-design/22-mnt-migration.md) §16 の題・MNT-03-D13 の vC の文・vU の上限の検査の「vC の手順 4」の文と表の「vC が改名する」を直し、vC の手順と列の改名の注記の段を、MNT-03-D14 の vB（起点の検査・6 列の改名・前提つきの単位の CHECK・確かめ・止まった後の作り直し）と「DB の作り直しを 1 回にまとめる順」に置き換えた。回復の段は vU だけの文にし、テストの段から vC と連続適用の失敗の case を外して vB の case を足した。[共通規則](../function-design/10-common-rules.md) の掛ける lane の「vC の範囲検査は外側の守り」、[master-tables](../db-design/master-tables.md)・[transaction-tables](../db-design/transaction-tables.md) の「既存の値を 100 倍する」、[30](../function-design/30-biz-product-service.md) の操作ログの円の key の互換、[31](../function-design/31-biz-inventory-service.md) の fingerprint の移行の前の記録の文を、D-119 の帰結に合わせた。C-02（巻）・C-03（cm）= 共通規則 SPEC-UNIT-D1 に作り直しの起点で外す項と前提を足し、`cm` の「値も意味も変えない」を外すまでの文にした。master-tables の CHECK の行と 30 の単位の契約に同じ時点を書いた。C-27（行の金額の wire の十進の文字列）は外さない: 突き合わせの判定は「上限を変えない限り再び起きる」で、U4 = b は値の変換の有無を変えるだけで棚卸しの行の範囲を変えない。C-34（v8 の上限の検査）は外さない: migration 済みで、突き合わせの判定は「外す対象にならない」。vU の上限の検査の原価の行は、vB の前の DB を守るので残した。
2. 前提の食い違いと文書の食い違いの訂正: C-09 = 共通規則 SPEC-UNIT-D2 の 10 cm 刻みを強制しない理由を事実（10 cm が最小か刻みか決まらない、店は棚卸しで cm までは数えない）に置き換え、`project-memory.md` の「最小 10 cm 刻み」の行と backlog の同じ語を直した。C-16 = 今の既定（長さの単位は在庫連動の自動提案が `false`、手動販売で記録）を U5 の未決として SPEC-UNIT-D4 に書いた。C-18 = 骨組みの側の取り違え（売価は税込で正しい）で、正本を変えない。文書の食い違い 1（12 の語の出典）= SPEC-UNIT-D1 の出典、`project-memory.md` の 2026-09-14 の行、D-113 の前提の訂正の行。2（話し手）= `project-memory.md` の 2 行を店主回答（owner が転記）に直した。3（backlog の現状）= backlog の単位の拡張の項に「起票時の」と PR #158 の後の値を書いた。4（日報の parser）= PR #167 が `project-memory.md` の同じ行を直すので本 lane は触らない（下の「PR #167 と重なる file」）。5（毛糸の「個」）= U2 で直せるようにし、SPEC-UNIT-D1 の出典と `project-memory.md` の毛糸の行に書いた。
3. 不足の候補（突き合わせの §3。round 1 の是正、Review Response 参照）: C-06（U2）= 共通規則 SPEC-UNIT-D2 に個数の単位どうしの変更の項、30 BIZ-01-D8 に BIZ の検査・`ProductUpdateRequest.stock_unit`・操作ログの key、§4.4 の構造体に field、商品 CSV の上書きの行の error の規則、51 に UI-01b-D23（select と 1 文）を足し、UI-01b-D5 に D23 が置き換えると書いた。C-23（U7）= SPEC-UNIT-D5 の入力の補助と 51 UI-01b-D24。他の不足の候補: C-19（原価の税）は U6 の未決として SPEC-UNIT-D5・master-tables の `cost_price` の行・backlog に書いた（決めない）。C-36（保存の前の確かめの画面）は U8 = a で足さない（D-119 (7)）。C-26（手動販売の丸める前の値を見せる）と C-30（棚卸し記録詳細のロス原価の基準数量）は owner の決定の範囲に無いので入れない（C-30 は既に backlog の「原価 × 数量の式が価格の基準数量を持たない残り」の (3) で ⑤ にある。C-26 は報告に書いた）。
4. DB の作り直しの一本化: 22 §16 の「DB の作り直しを 1 回にまとめる順」に、原価の lane（vB）を棚卸しの runtime の最初の配布の単位より先に入れ、作り直しを原価の lane で 1 回にする順と理由（作り直した DB には停止 ADR が止めている棚卸しと Z004 の確定の記録が作られない）、逆の順になるときに owner に諮る条件を書いた。backlog の原価の lane の項と D-119 (8) はそこを引く。PR #167 の正本（ADR の SPEC-STK-CNT-D10、backlog の棚卸しの runtime の項）は書き換えない。
5. 後続の lane の範囲と Risk（backlog）: 「原価の lane（C）」（R3、R4 → R3 の理由）、「単位の語の直しの lane」（R3）、「店に聞く: 長さの商品の在庫の減らし方と原価の税」を足し、単位の拡張の項の下に P・⑤ の範囲の書き直しを足した。単位の拡張の項の「U から C へ送るもの」の vC の手順 1 の参照を vB に直した。
6. D-119 を `docs/decision-log.md` に足した（Decision (1)〜(10)、Why、Alternatives、Guarantee range、Compatibility、owner の決定、Revisit）。D-113 に「Superseded in part by: D-119」と前提の訂正の行を足した。D-113 の本文は変えていない。

ついでに直したもの: 無し。

対象を使う呼出し側・隣接 test・helper / mock・生成物（後続の lane が触る。本 lane は変えない）: 原価の lane = `src-tauri/src/db/migration.rs`（registry）と新しい schema の file、`src-tauri/src/constants.rs` の `MAX_COST_PRICE`、`src-tauri/src/db/schema_v8.rs` の `test_v8_req903_limits_match_runtime_constants` の原価の行、原価を読む Rust・TS の file（2026-10-16 の突き合わせの数え: Rust 32・TS 49。起票の時に `rg -l` で数え直す）、`src-tauri/src/db/product_repo.rs` の `ProductStockUnit` と `src/lib/bindings.ts`、`src-tauri/src/biz/unit_amount.rs`、`src/features/stock-inquiry/lib/format-stock-display.ts`・`src/lib/unit-quantity.ts`（cm の入力の分岐）、`src-tauri/src/seed_demo.rs`、`finite_enum_contract_tests.rs`、cm を fixture にする test（突き合わせの §4 C-03 の一覧）、商品フォームの原価の欄。単位の語の直しの lane = `src-tauri/src/biz/product_service.rs`（update と商品 CSV の上書きの検査）、`src-tauri/src/cmd/product_cmd.rs`、`src-tauri/src/db/product_repo.rs` の `ProductUpdates`、`src/lib/bindings.ts`（`ProductUpdateRequest_Deserialize`）、`src/features/products/components/ProductForm.tsx`、`docs/function-design/20-io-product-repo.md` の `ProductUpdates.stock_unit` の型。

PR #167 と重なる file と行・節の所有（D-055 の所有表）:

| file | PR #167 が触る所 | 本 lane が触る所 | merge の後に揃える所 |
|---|---|---|---|
| `docs/function-design/22-mnt-migration.md` | §16 の vU の上限の検査の時点証拠の列の項（`stocktake_recounts`）と、vC の後の「列は改名だけで…時点証拠の migration…」の段 | §16 の題・MNT-03-D13・vC の段の全部（#167 が触る「列は改名だけで…」の段を含む）・回復・テスト | 「列は改名だけで…」の段は本 lane が消すので、後に merge する側が消した形を採る（#167 の追記〈D-118 で時点証拠の migration を作らない〉は vC と一緒に不要になる）。vB の手順 4 は「列はその時点の `products` から写す」で、D-118 の写しの列が先に入っていれば含まれる |
| `docs/db-design/master-tables.md` | 冒頭の「計数の置き場と在庫の求め直しの契約」の節（1〜13 行目） | 「単位と原価の精度の契約」の節と `cost_price`・`stock_unit` の列の行 | 無し |
| `docs/db-design/transaction-tables.md` | 冒頭の節 | 「金額の丸めと、原価の 1/100 円」の段 | 無し |
| `docs/function-design/30-biz-product-service.md` | 冒頭の「時点証拠契約」の節 | 「単位と原価の精度の契約」の節と §4.4 | 無し |
| `docs/function-design/31-biz-inventory-service.md` | 冒頭の節 | 原価の段（16 行目） | 無し |
| `docs/function-design/51-ui-product-form.md` | 冒頭の節と UI-01b-D22 の行 | UI-01b-D5 の行と、その下に足した UI-01b-D23・D24 の行、変更履歴 | UI-01b-D22 の末尾の「edit mode の単位は読取専用」を、UI-01b-D23 が個数の単位の商品について置き換えると D22 の行に書く（本 lane は D22 の行を触らず D5 の行に書いた） |
| `docs/decision-log.md` | D-111・D-116 などへの追記と末尾の D-118 | D-113 の末尾の 2 行と末尾の D-119 | 末尾は両方を残す（D-118 の次に D-119） |
| `docs/backlog.md` | 「やると決めたもの」の先頭の 3 項目と STK-1・STK-2・実測と POS 系列の対応の項の追記 | 単位の拡張の項（56 行目と 73 行目の文、下に足した sub-bullet）と、その直後に足した 3 項目 | 棚卸しの runtime の項の「開発・試験 DB の作り直しは…別の承認（TD-261 の Q11 = b）」に、作り直しは原価の lane で 1 回にする順（D-119 (8)、22 §16）を足す。P の sub-bullet の置き場を D-118 の後の Z004 の確定の経路と EJ の項に揃える |
| `docs/project-memory.md` | 33〜41・99〜130・160〜166・238〜254 行目の付近 | 113・119・203 行目 | 無し（文書の食い違い 4 は #167 が直す） |

PR #167 の ADR の SPEC-STK-CNT-D10（作り直しは「対象と保全の範囲を決めた別の承認」）は、#167 の merge の後に D-119 (8) の順（作り直しは原価の lane で 1 回）を指す文を足す。

## Non-scope

- code・migration・bindings・test（原価の lane と単位の語の直しの lane。backlog の各項目）。
- U5・U6 の決定（店の答え待ち）、P・⑤ の設計（D-118 の lane と後続）。
- 各文書の単位の一覧の今の 12 個の記述（原価の lane が実装と一緒に直す。backlog の原価の lane の範囲）。
- 行の金額の wire（C-27）、v8 の上限の検査（C-34）、入力の上限の数字（G8）、手動販売の丸める前の値の表示（C-26）、棚卸し記録詳細のロス原価（C-30。⑤）。
- PR #167 が触る節（上の所有表）、`docs/evidence/` の聞き取りの記録（その時点の答えの記録）、D-113 の本文。
- `docs/Plans.md`（lane の行を足さない。D-097）。

## Acceptance Criteria

数は開始 HEAD `ea15360d`（`git archive ea15360d docs` を展開した版）と起票後の版を同じ数え方（その file の中で式に当たる行の数、`rg -c`）で測った。出力が無いのは 0。

- AC1（vC の撤去）: `rg -c 'vC' docs/function-design/22-mnt-migration.md` が 0（開始 10）、`rg -c 'vC' docs/function-design/10-common-rules.md` が 0（開始 1）、`rg -c '100 倍する' docs/db-design/master-tables.md` が 0（開始 1）、`rg -c '既存の値を 100 倍' docs/db-design/transaction-tables.md` が 0（開始 1）、`rg -c '連続適用の失敗' docs/function-design/22-mnt-migration.md` が 0（開始 1）、`rg -c '両方の key を知る' docs/function-design/30-biz-product-service.md` が 0（開始 1）、`rg -c '移行の前に保存した記録の fingerprint' docs/function-design/31-biz-inventory-service.md` が 0（開始 1）。
- AC2（vB と作り直しの順）: `rg -c 'MNT-03-D14' docs/function-design/22-mnt-migration.md` が 2（開始 0）、`rg -c 'message に \`作り直し\`' docs/function-design/22-mnt-migration.md` が 2（開始 0。手順 2 とテスト）、`rg -c 'DB の作り直しを 1 回にまとめる順' docs/function-design/22-mnt-migration.md` が 1（開始 0）。
- AC3（巻・cm を外す時点。round 1 の是正、Review Response 参照）: `rg -c '個数の単位 9 個と \`m\`'` が 10-common-rules で 1、22 で 2（vB の手順 4 とテスト）、master-tables で 1（開始はどれも 0）。`rg -c '10 個の code' docs/function-design/10-common-rules.md` が 0（開始 1。D10 は「今 10 個、巻を外すと 9 個」に直した）。
- AC13（作り直しの手順。round 1 の是正、Review Response 参照）: `rg -c '作り直しの手順' docs/function-design/22-mnt-migration.md` が 3（開始 0）、`rg -c 'migrate_legacy_db' docs/function-design/22-mnt-migration.md` が 6（開始 3。§12 の 3 と §16 の表・手順 6・テスト）。`rg -c '元の版のまま' docs/function-design/22-mnt-migration.md` が 0。
- AC14（商品 CSV の上書きの PLU とログ。round 1 の是正、Review Response 参照）: `rg -c '単位だけの変更' docs/function-design/30-biz-product-service.md` が 1（開始 0）、`rg -c '商品の単位も変えない' docs/function-design/10-common-rules.md` が 0（開始 1）。
- AC4（U2）: `rg -c 'UI-01b-D23' docs/function-design/51-ui-product-form.md` が 3（開始 0。D5 の行・D23 の行・変更履歴）、`rg -c '在庫単位は個数の単位どうしでだけ変えられます' docs/function-design/30-biz-product-service.md` が 2（開始 0。update と商品 CSV）、`rg -c 'stock_unit（通常 field' docs/function-design/30-biz-product-service.md` が 1（開始 0）。
- AC5（U7）: `rg -c 'UI-01b-D24' docs/function-design/51-ui-product-form.md` が 2（開始 0）、`rg -c '袋の値段 ÷ 入り数' docs/function-design/10-common-rules.md` が 3（開始 1。D5 の理由の既存の 1 行）。
- AC6（U5・U6 の未決と既定）: `rg -c '未決（店に聞いてから決める' docs/function-design/10-common-rules.md` が 2（開始 0）、`rg -c '^- \*\*店に聞く: 長さの商品の在庫の減らし方と原価の税\*\*' docs/backlog.md` が 1（開始 0）。
- AC7（前提の訂正）: `rg -c '店は 12 種すべてを使う' docs/function-design/10-common-rules.md` が 0（開始 1）、`rg -c '実測の残り 1.27 m' docs/function-design/10-common-rules.md` が 0（開始 1）、`rg -c 'minimum 10 cm increment' docs/project-memory.md` が 0（開始 1）、`rg -c '12 unit words in use' docs/project-memory.md` が 0（開始 1）、`rg -c '最小 10 cm 刻み' docs/backlog.md` が 0（開始 1）、`rg -c '起票時（2026-09）の現状' docs/backlog.md` が 1（開始 0）。
- AC8（決定の記録）: `rg -c '^## D-119: ' docs/decision-log.md` が 1（開始 0）、`rg -c '^- Superseded in part by: D-119' docs/decision-log.md` が 1（開始 0）、`rg -c '^- 前提の訂正（2026-10-17、D-119 \(9\)）' docs/decision-log.md` が 1（開始 0）。D-113 の本文が変わっていない: `diff <(awk '/^## D-113/,/^- Revisit/' "$TMPDIR/old/docs/decision-log.md") <(awk '/^## D-113/,/^- Revisit/' docs/decision-log.md)` の出力が空。
- AC9（backlog の後続）: `rg -c '^- \*\*原価の lane（C）\*\*' docs/backlog.md`・`rg -c '^- \*\*単位の語の直しの lane\*\*' docs/backlog.md` がどちらも 1（開始 0）。
- AC10（PR #167 の節を触らない）: `git diff --name-only ea15360d HEAD -- docs/function-design/35-biz-stocktake-service.md docs/function-design/73-ui-stocktake.md docs/adr` の出力が空。`git diff -U0 ea15360d HEAD -- docs/db-design/master-tables.md | grep '^@@'` の hunk がどれも 14 行目より後（冒頭の節を触らない）。`git diff ea15360d HEAD -- docs/function-design/22-mnt-migration.md | grep -c '^-.*stocktake_recounts'` が 0（時点証拠の列の項を消していない）。
- AC11（docs だけ）: `git diff --name-only ea15360d HEAD -- src src-tauri scripts package.json package-lock.json` の出力が空。
- AC12（検査）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0（WARN は開始 HEAD と同じ数より増えない）。`cd src-tauri && cargo run --bin generate_traceability -- --check` が OK。`cd src-tauri && cargo test --test design_compliance_test` が pass。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: 共通規則 SPEC-UNIT-D1（作り直しの起点の項、出典）・D2（10 cm の理由、単位の変更）・D4（U5 の未決）・D5（入れ方、U6 の未決、入力の補助）と「入力の上限と安全な整数の範囲」の掛ける lane／22 §16（MNT-03-D13、vU の上限の検査、MNT-03-D14 の vB、DB の作り直しを 1 回にまとめる順、回復、テスト）／master-tables の「単位と原価の精度の契約」と `cost_price`・`stock_unit` の列／transaction-tables の「金額の丸めと、原価の 1/100 円」／30 BIZ-01-D8・§4.4・BIZ-01-D7／31 の原価の段／51 UI-01b-D5・D23・D24／D-113・D-118（PR #167）・D-119・停止 ADR SPEC-STOP-D1・D6。
- 必要な設計成果物（Design artifact selection の当たる行）: BIZ・CMD の振舞い = updated in this PR（30、10）／command・DTO = updated in this PR（30 §4.4 の `ProductUpdateRequest`。wire の変更は後続の lane、下の Boundary / Wire Contract）／表・migration = updated in this PR（22 §16、master-tables、transaction-tables。番号と実装は原価の lane）／operator workflow・文言 = updated in this PR（51 UI-01b-D23・D24）／durable な判断 = updated in this PR（D-119、D-113 の注記）。
- plan にしかない durable な判断の昇格先: 決めたことは全て正本と D-119 に置いた。packet にだけあるのは、規模と手法の数え、後続の lane への file の申し送り（Scope の末尾）、PR #167 との所有表、AC の数。
- 前提・制約と、延期した design gap の follow-up: 巻・cm を外すのは最新の在庫 Excel で 0 行のとき（Contract Probe の P1。原価の lane の起票の前）。U5・U6 は店の答え待ちで、答えが無い間の既定を正本に書いた（backlog）。操作ログ画面の既知の key に `stock_unit` を足すかは単位の語の直しの lane で決める（backlog。足さなくても raw JSON で見える）。延期が安全な理由: どれも今の code の振舞いを変えず、既定は今の振舞いのまま。
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: 「vB は行のある DB で何も変えない」は、5 つの表を外部キーに頼らず数え、どれかに行があれば TX の中で何も変える前に ROLLBACK するので例外は無い（行の無い表の改名だけが起きる）。「作り直しは 1 回」の例外は、U6 の答えより先に棚卸しの runtime を入れる場合で、そのときは owner に諮る（22 §16）。「作り直した DB に棚卸しと Z004 の確定の記録が作られない」は停止 ADR の 5 つの入口の停止に依り、停止を外すのは棚卸しの runtime の配布の単位（SPEC-STOP-D6）で、それは棚卸しの runtime の migration と同じか後なので成り立つ。「単位の変更は個数の単位どうしだけ」の escape hatch は商品フォーム・商品 CSV の上書き・UI を通らない command の 3 つで、BIZ が update と CSV の commit の TX の中で同じ規則を検査する。
- 判定（ready / not ready）と理由: ready（plan-draft に進める）。理由: 設計の出力が上の正本と D-119 にあり、owner の判断事項は TD-297 で決まり、U5・U6 は答えが無い間の既定を持つ未決として正本と backlog にあり、残る外部前提は原価の lane の起票の前に確かめるもので設計の問いではない。

## Registration / Generation Obligations

本 lane: REQ の参照を増減していないので `docs/function-design/90-traceability.md` を再生成しない（`cargo run --bin generate_traceability -- --check` で確かめる、AC12）。function-design の file の新設・改名・削除は無い。後続の義務: 原価の lane は vB を `migration.rs` の registry に番号を付けて登録し（棚卸しの runtime の migration と番号を突き合わせる）、`ProductStockUnit` から `roll`・`cm` を外したら `cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成する。単位の語の直しの lane は `ProductUpdateRequest` に field を足した後に bindings を再生成する。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 当たる（小）。単位の一覧と原価の精度は app-core（SPEC-UNIT）。POS の数量の adapter（D8）は本 lane で変えない | 共通規則 SPEC-UNIT |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 当たる。12 の語の出典・話し手・10 cm の意味は事実の記録（聞き取りの記録と repo 外の事実の一覧）に合わせ、1 cm まで受けることと 10 cm 刻みを強制しないことは app の決定（U3 = a）として分けて書いた。最新の Excel の巻・cm は未確認の前提として扱う | D-119 (9)、Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 当たる。vB の失敗は TX の中で何も変えずに止まり、作り直しの後の再起動で当たる。再実行で重複適用しない。商品 CSV の上書きは preview と commit で同じ規則 | 22 §16、Matrix |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 当たる。作り直しは開発者の作業で店の操作にしない。店主の操作は単位の語の変更（1 文の説明つき）と原価の補助だけ増える（任意） | Ordinary Operation、51 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 不該当。外部の system に依る変更が無い | — |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 当たる。tracked には巻・cm が 0 行という件数だけを書き、他の単位の件数・商品名・金額・発言の原文を書いていない。作り直しは古い file を消さずに移す | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 当たる。単位の語の変更は個数の単位どうしに限るので、在庫・明細・評価額の数の意味が変わらない。原価の税の区分は決めず、評価額の計算は変えない | SPEC-UNIT-D2・D5 |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 当たる（後続）。単位の語の直しと原価の補助の画面の見た目と文言は後続の lane の L3。作り直しの手順は原価の lane で開発者が 1 度通す。本 lane は docs だけで L3 は無い | Matrix の Manual |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 不該当。環境依存を足さない | — |

## Boundary / Wire Contract

本 lane は wire を変えない（bindings も変えない）。後続の lane が変える wire の契約を正本に書いた。

- producer: CMD-01（`update_product`）、BIZ-01（商品 CSV の preview の行の error の文）
- consumer: UI-01b（商品フォーム）、UI-01c（商品 CSV の取込みの画面。文の表示だけ）
- wire type: `ProductUpdateRequest` に通常 field の `stock_unit: Option<ProductStockUnit>` を足す（単位の語の直しの lane）。原価の型の `_centi` は D-113 のまま（原価の lane）。巻・cm を外すと `ProductStockUnit` の variant が 10 になる（原価の lane、前提つき）
- internal type: `ProductUpdates.stock_unit`（IO）。原価の入力の補助の袋の値段と入り数は UI の state だけで、wire・DB に出さない
- precision/range: 原価の補助の結果は 1/100 円の整数で、袋の値段（上限 `99999999`）以下。入り数は 1〜`9999999`
- round-trip path: 商品フォームの select → `updateProduct` の `stock_unit` → BIZ の検査 → `products.stock_unit` → 各画面は今の単位を引いて表示
- invalid input: 種類をまたぐか長さの単位の変更 → `ValidationFailed("在庫単位は個数の単位どうしでだけ変えられます")`（商品 CSV は行の error）。入り数が範囲の外 → 補助の欄の入力の error で原価の欄を変えない
- compatibility: 本番の DB は無い。vB は行のある DB で止まり、作り直す。`stock_unit` を送らない古い UI は無い（1 つの build）。D-061 / D-064 の enum と DB CHECK の二重化は保つ

## Test Plan

Test Design Matrix: [2026-10-17-unit-redesign-design](test-matrices/2026-10-17-unit-redesign-design.md)（後続の lane が実装する test の設計。本 lane は docs の検査だけ）。

- targeted tests: 本 lane は `bash scripts/doc-consistency-check.sh` と `--target plan`、`cargo run --bin generate_traceability -- --check`、`cargo test --test design_compliance_test`（AC12）。
- negative tests: Matrix の Negative Paths（後続）。
- compatibility checks: Matrix の Compatibility Checks（行のある DB で vB が止まる、作り直しの後に棚卸しの runtime の migration が当たる）。
- data safety checks: 本 lane の差分に実データ（商品名・金額・JAN・部門名・発言の原文）を入れない。
- main wiring/integration checks: 後続の lane（商品フォームから BIZ まで、空の DB から vB まで）。

## Review Focus

- Ordinary Operation の列が、正常な条件で目的（作り直しを 1 回にして原価を 1/100 円で入れ、単位の語を直せる）を達成できるか。vB で止まった DB の作り直しの手順が、データを失わずに（古い file を消さずに）進むか。
- vB の起点の検査が、行のある DB を全部止めるか（5 つの表で足りるか。D-118 の新しい表や写しの列で漏れが無いか）。作り直しの順（原価の lane を先）の理由（停止 ADR）が成り立つか。
- 単位の変更の規則が、商品フォーム・商品 CSV の上書き・UI を通らない command の全経路で同じか。個数の単位どうしの変更で、在庫少の判定・評価額・入庫の明細の金額・PLU の状態が変わらないか。
- vC を外した後に、共通規則・22・master-tables・30・31・backlog に値の変換を前提にした live な文が残っていないか（Matrix の sweep の残りの理由）。
- 訂正した前提の文が、出典（聞き取りの記録、事実の一覧の ID）で裏づくか。確かめていないもの（最新の Excel）を確かめたように書いていないか。
- D-113・D-118（PR #167）・停止 ADR と矛盾しないか。PR #167 の節を触っていないか（AC10、所有表）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| SPEC-UNIT-D1（作り直しの起点で巻・cm を外す、前提） | 共通規則 SPEC-UNIT-D1、master-tables の CHECK の行、30 の単位の契約 | 原価の lane: vB の手順 4、enum・bindings・formatter・CSV の語 | 原価の lane（Matrix の D1 の行） | 非対象 |
| SPEC-UNIT-D2（10 cm 刻みを強制しない理由、単位の変更は個数の単位どうし、単位だけの変更は `plu_dirty` を変えない、商品 CSV の上書きは商品ごとに TX の中のログ） | 共通規則 SPEC-UNIT-D2、30 BIZ-01-D8・§4.4・§4.9 の d.、51 UI-01b-D5・D23 | 単位の語の直しの lane: `product_service.rs`・`product_cmd.rs`・`product_repo.rs`・`ProductForm.tsx` | 単位の語の直しの lane（Matrix の D2 の行） | L3: 商品フォームの単位の select と 1 文 |
| SPEC-UNIT-D4 の店に聞く問い（U5）と答えが無い間の既定 | 共通規則 SPEC-UNIT-D4、backlog | 変えない（答えが無い間の既定は今の振舞い） | 既存（UI-01b-D6 の自動提案の test） | 非対象 |
| SPEC-UNIT-D5（入れ方、店に聞く問い U6 と既定、入力の補助） | 共通規則 SPEC-UNIT-D5、master-tables、transaction-tables、30、31、51 UI-01b-D24 | 原価の lane | 原価の lane（Matrix の D5 の行） | L3: 原価の補助の画面 |
| MNT-03-D14（vB）と作り直しの手順（起動のときに DB を見つける (a)〜(d)） | 22 §16 | 原価の lane: 新しい schema の file、`migration.rs` | 原価の lane（Matrix の vB の行と作り直しの手順の行） | 非対象（実際の PC での作り直しは開発者が 1 度通す） |
| DB の作り直しを 1 回にまとめる順（D-119 (8)） | 22 §16、backlog の原価の lane | 順の運用（Coordinator） | 原価の lane の後の棚卸しの runtime の migration の test（作り直した DB で通る） | 非対象 |
| BIZ-01-D7（操作ログの key `stock_unit`） | 30 BIZ-01-D8 | 単位の語の直しの lane | 単位の語の直しの lane | 非対象 |
| D-119、D-113 の Superseded in part と前提の訂正 | decision-log | 本 lane の記録 | AC8 | 非対象 |
| 前提の訂正（12 の語の出典、話し手、backlog の現状、10 cm の意味） | 共通規則、project-memory、backlog、decision-log | 本 lane | AC7 | 非対象 |
| 隣接の除外: SPEC-UNIT-D6 の行の金額の wire（C-27）、v8 の上限の検査（C-34）、入力の上限の数字、D3・D7〜D11 | 共通規則、22 §16 の vU | 変えない | 既存 | 非対象 |
| 隣接の除外: D-118 の SPEC-STK-CNT-D10・backlog の棚卸しの runtime、停止 ADR SPEC-STOP-D1・D6 | PR #167 の ADR・backlog、停止 ADR | 変えない（参照だけ。#167 の merge の後に揃える所は Scope の所有表） | 非対象 | 非対象 |

## Contract Probe

本 run は実機・持ち帰りデータの新しい集計を行っていない。前提ごとに、出典（repo 外の事実の一覧の ID、tracked の記録、code）を確かめた結果を書く。

- P1（最新の在庫 Excel で巻・cm の行が 0）: 2026-09-12 版の Excel で 0 行（事実の一覧 U-005）。店は入力を続けていて版が古い（台帳 TD-283）。→ 未確認。原価の lane の起票の前に、次の持ち帰りで確かめる（owner の決定 U1 = d）。0 でなければ巻・cm を外さず owner に聞き直す。
- P2（空の表の 6 列を `ALTER TABLE … RENAME COLUMN` で改名できる）: 同梱の SQLite は 3.45.0（22 §15 の v7 の記録、`libsqlite3-sys` 0.28.0）で、`RENAME COLUMN` は 3.25 以降。v7 が同じ操作で日報の列を改名している。→ 観測（tracked の記録と実装済みの v7）。
- P3（停止 ADR が棚卸しの開始・保存・確定と Z004 の確定・取消を BIZ の入口で止め、停止は棚卸しの runtime の配布の単位がまとめて外すまで続く）: 停止 ADR の SPEC-STOP-D1（5 つの BIZ 入口が最初の文で停止する、PR #95 で実装）と SPEC-STOP-D6（部分的に外さない）、D-118 の SPEC-STK-CNT-D12（PR #167。まとめて外す）。→ 観測（tracked の記録）。作り直した DB に棚卸しと Z004 の確定の記録が作られないことはここに依る。
- P4（本番の DB は無い）: `docs/project-memory.md` の「無いもの」（owner 回答 2026-09-19）。→ 回答。
- P6（起動のときに DB を見つけて開くか取り込む場所）: 現物の `src-tauri/src/lib.rs:114`〜`:123`（`prepare_database`、作業フォルダを `std::env::current_dir()` で取る）・`:150`〜`:199`（`prepare_database_with_init`: `:161` の `{app_data}/inventory.db`、`:162` の `reconcile_restore`、`:165`〜`:183` の新 DB が無いときの `migrate_legacy_db`、`:188` の `init`）、`src-tauri/src/db/mod.rs:291`〜`:330`（`migrate_legacy_db_with_ops`: `:296` の作業フォルダの `inventory.db`、`:298` の `.migrating`）、`src-tauri/src/mnt/restore.rs:11`〜`:13`・`:64`〜`:88`（復元の遺物の名前）を読んだ。→ 観測（code）。4 か所 (a)〜(d) を 22 §16 の作り直しの手順の表に書いた。
- P5（2026-09-14 の答えの話し手と問いの形）: 聞き取りの記録（`docs/evidence/hearing-2026-09-14-stock-units.sanitized.md` の問い 1・5 と source の行）と事実の一覧の U-002・U-017・X-U04・X-U07。→ 記録。

## Data Safety

- tracked に書かない: 在庫 Excel の中身と単位ごとの件数（巻・cm が 0 行であることだけを書いた）、商品名・金額・JAN・部門名、店主・owner の発言の原文、repo 外の見直しの成果物の本文。
- local-only: repo 外の回答台帳・見直しの成果物（事実の一覧・白紙の骨組み・突き合わせ）・持ち帰りデータ。
- synthetic-only: 後続の lane の test は合成の DB と合成の商品だけを使う。作り直しで移した開発・試験 DB の file を commit しない。

## Implementation Results

Fill after implementation.

## Review Response

### Plan Review round 1（2026-10-17、head `db801d52`）

Claude 側 fresh Opus 5.5（reject、P1 0・P2 1・P3 4）と Codex GPT-6 Astra（reject、P1 1・P2 2・P3 2）。全て採った（Coordinator の裁定）。owner の方針（repo 外の回答台帳 TD-296 の 5a）に従い、個別の継ぎ当てでなく 1 通りに読める形に直した。

| # | 出所 | 裁定 | 要旨 | 直した所 |
|---|---|---|---|---|
| R1 | Codex #1（P1） | 採る | 作り直しの手順が、旧 DB の自動取込み（22 §12.2 の `migrate_legacy_db`）を考えていない。作業フォルダに旧 DB が残ると、`{db_path}` 一式を移しても次の起動で取り込まれ、vB がまた止まる | 22 §16 に「作り直しの手順」を足し、起動のときに DB を見つける場所の全部（(a) `{app_data}` の DB 一式、(b) `.migrating`、(c) 復元の遺物、(d) 起動の作業フォルダの旧 DB 一式。現物の file:line つき）を対象に、消さずに日付の付いた 1 つの folder へ移す 1 つの手順にした（(c) は reconcile に先に解かせる）。vB の「止まった後の進め方」はこの手順を引く。Matrix に `test_rebuild_moves_legacy_cwd_db_and_starts_empty`（(d) を移さない対照つき）と FM11 を足した。Ordinary Operation の作り直しの 2 行、Contract Probe の P6、Contract Ledger、AC13 |
| R2 | Codex #3・Opus #1（P2） | 採る | 原価の補助の golden が浮動小数の誤った実装を落とせない | Matrix の golden に `"0.29"` 円 ÷ `"2"` → 15 を足し、入力の文字列の解析から補助の関数までを通す case にした。mutant の文を「円の小数（number）で割る」に直し、その mutant が `"0.29"` ÷ `"2"` で 14 になって red になることを求めた |
| R3 | Codex #2（P2）・Opus #3・#4（P3） | 採る | 商品 CSV の上書きで単位を変えたときの PLU と操作ログが、BIZ-01-D8（PLU の状態の保持、前後の記録）と §4.9（上書きは常に `plu_dirty=1`、ログは TX の外の件数の要約）で食い違う | 30 の上書きの段を「今の規則」と「単位の語の直しの lane の後の規則」の 2 つの bullet に分け、括弧の差込みをやめた。単位の変更は `plu_dirty` の理由にならない（update の段と同じ）、上書きで単位だけを変える行は `plu_dirty` を変えず、それ以外は §4.9 の d. のとおり。ログは単位を変えた商品ごとに同じ TX の中で `product_update`（BIZ-01-D7 の形、key `stock_unit` だけ）を書く（理由: 商品修正と同じ形で読み方が 1 つ、TX の中なので commit と一緒に必ず残り、商品ごとに元の単位を追える。件数の要約に一覧を入れる案は TX の外で失いうる）。§4.9 の d. に pointer を足した。Matrix の CSV の成功例に dirty の保持とログの期待を足した（FM12）。AC14 |
| R4 | Codex #4（P3） | 採る | 10-common-rules の「商品の単位も変えない」が U2 と食い違う | 「許す単位の変更（D2 の個数の単位どうし）では価格の基準数量が変わらない」に直した |
| R5 | Codex #5（P3） | 採る | packet の `src-tauri/src/bin/seed_demo.rs` が実在しない | `src-tauri/src/seed_demo.rs`（現物で確かめた。`src-tauri/src/bin/seed_demo_data.rs` は起動の入口）に直した |
| R6 | Opus #2（P3） | 採る | 22 の「保全した file は元の版のまま残る」が、先に COMMIT した migration があるときに誤る | 「移した file は止まった時点の版で残る（同じ起動で先に COMMIT した migration があれば旧版のアプリでは開けない。データは失われない）」に直した |
| R7 | Opus #5（P3） | 採る | 「10 個の code」が個数の単位と巻・cm を外した後の一覧の 2 つの意味で使われる | 外した後の一覧は「個数の単位 9 個と `m`」、個数の単位は「今 10 個、巻を外すと 9 個」と書き分けた（10・22・master-tables、Matrix の test 名を `test_vb_unit_check_drops_roll_and_cm` に）。backlog の原価の lane の範囲に、個数の単位の数（10 → 9）の記述の場所（SPEC-UNIT-D3 の集計の規則と D10、35:473、44:966、DB_DESIGN:187 ほか）を足した。AC3 を数え直した |
