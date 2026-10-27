# Plan Packet: 在庫の振替（詰め替え・切り分け。導入の前の関門 9）

wave に属さない単独の lane。owner の決定（repo 外の回答台帳 TD-463、2026-10-27）で、在庫の振替（仕入れた品を別の商品にして売るときの在庫の動き。反物 → 端切れ、大袋 → 小袋）を初回の導入の前に入れる（導入の前の関門の confirmed の 9）。店主の答えは TD-358（問い Q-092 に「よくある」）。b1 の起票の「`inventory_movements` の 2 回目の作り直し〈vZ〉に予約として足さない」（TD-378）は Q-092 を未回答と扱った時点の判断で、TD-463 で覆った。backlog の項目「在庫の振替（詰め替え・切り分け）」と Plans の関門の 9 は PR #214（docs の小口 3、branch `agent/docs-small-batch-3`）の branch にあり、本 lane はそれを引くが backlog・Plans を変えない（#214 が先に merge する見込み。後なら同期で入る）。本 commit は Plan Packet と Test Design Matrix の起票と、plan-first の設計正本の置換え（下の「本 commit で変えた正本」）だけで、実装は plan-approved の後の別の run。branch は `agent/stock-transfer`（main `a2365759` から）。新しい決定は D-143。

## 規模と手法

2026-10-27 に本 worktree（HEAD `a2365759`）で数えた（command は逐語、出力を写した）:

| 区分 | 数 | command と出力 |
|---|---|---|
| 触る設計正本 | 本 commit で 16（decision-log・ADR・DB_DESIGN・tracking・transaction・10・21・22・31・44・52・65・66・74・FUNCTION_DESIGN・SCREEN_DESIGN）+ 新設 1（79）。runtime の S5 で 7（requirements・requirements-coverage・90 の再生成・UI_TECH_STACK・ARCHITECTURE・ui-task-specs・diagrams/current-system） | 下の「本 commit で変えた正本」と「予定 path の一覧」 |
| migration | 1（vT。`inventory_movements` の作り直しと 2 つの表。版 13 を予約、[22](../function-design/22-mnt-migration.md) §21） | `rg -n 'version: 1[0-9],' src-tauri/src/db/migration.rs` → `version: 10,`・`version: 11,` の 2 行（main の最大は 11） |
| 新しい Tauri command | 2（`create_transfer`・`get_transfer_record`） | `rg -n 'cmd::disposal_cmd::' src-tauri/src/lib.rs` → 8 行（廃棄の 4 command × `collect_commands!`・`generate_handler!`。振替は 2 × 2 を足す） |
| 新しい wire の型 | 6（`TransferCreateRequest`・`TransferItemInput`・`TransferCreateResult`・`TransferRecordDetail`・`TransferRecordDetailItem`・`TransferDirection`） | `rg -n "'transfer'\|\"transfer\"\|transfer_record" src-tauri/src src --glob '!src/lib/bindings.ts' \| wc -l` → 0（今は 1 つも無い） |
| 値の増える wire の enum | 2（`MovementType` に `"transfer"`、`ReferenceType` に `"transfer_record"`）と文字列の許可の 1（`InventoryRecordQuery.record_type` に `"transfer_record"`） | `rg -n '^export type MovementType =\|^export type ReferenceType =' src/lib/bindings.ts` → `1069:export type MovementType = "sale_auto" \| "sale_manual" \| "receiving" \| "return" \| "disposal" \| "stocktake";`・`1478:export type ReferenceType = "csv_import" \| "manual_sale" \| "receiving_record" \| "return_record" \| "disposal_record" \| "stocktake";` |
| Rust で 2 つの enum を値ごとに書く所 | 廃棄の値で数えて 16 行（`finite_enum_contract_tests.rs` 4・`inventory_repo.rs` 4 + test 2・`list.rs` 2・`common.rs` 2・`disposal.rs` 2）。振替が足すのは parse・as_str・contract test・`resolve_movement_source` の各 1 | `rg -n 'MovementType::Disposal\b\|ReferenceType::DisposalRecord\b' src-tauri/src \| wc -l` → 16 |
| 画面 | 新設 2（UI-16 作成、UI-16b 記録の詳細）+ 選択肢・label を足す 3（入出庫履歴の種別、在庫変動履歴の種別、操作ログの種別と関連記録の link） | [79](../function-design/79-ui-stock-transfer.md)、[65](../function-design/65-inventory-record-traceability.md) TRACE-D14、[66](../function-design/66-ui-stock-movements.md) の Filters、[74](../function-design/74-ui-operation-logs.md) |
| 選択肢を逐語で固定する既存の test | 4 file（`src/features/products/search.test.ts` の `MOVEMENT_TYPE_OPTIONS`・`INVENTORY_RECORD_TYPE_OPTIONS` の `toEqual`、`StockMovementsPage.test.tsx` の `REMAINING_MOVEMENT_TYPE_OPTIONS`、`operation-type-labels.test.ts`、`invalidation-contract.meta.test.ts` の entry の一覧） | `rg -n "MOVEMENT_TYPE_OPTIONS\|INVENTORY_RECORD_TYPE_OPTIONS" src --glob '*.test.*' \| cut -c1-120` → `search.test.ts:191`・`:200`・`:367`・`:422`・`:427`、`StockMovementsPage.test.tsx:229`・`:235` |
| 新しい表示の語と衝突する test の matcher | 0 | `rg -F '詰め替え' src --glob '*.test.*' \| wc -l` → 0。同じ形で `振替`・`切り分け`・`減らす商品`・`増やす商品` も各 0 |
| 横断の約束がかかる経路 | 安全な整数の範囲 1（`create_transfer` の明細の数量。在庫の上限は既存の `apply_stock_change` の 1 か所）、0 の表示 1（数量 0 は拒否。在庫 0 の表示は既存の formatter）、失敗の時点と順序 1（検証は全て TX の前、TX は 1 つ）、単位の混在 1（1 つの記録に個数と長さの明細が混ざる。足し合わせる表示を作らない） | [31](../function-design/31-biz-inventory-service.md) §12.6b、[79](../function-design/79-ui-stock-transfer.md) UI-16-D4 |
| 予定 path | 70（docs 26・Rust 15・TS 29。下の「予定 path の一覧」） | 下の一覧の行数（`wc -l` → 70） |

手法: **1 lane・1 PR（plan-first で設計正本を本 commit に置き、plan-approved の後に S1〜S5 の段で runtime まで）。** design lane（docs だけの PR）と runtime lane に分けない。理由: (1) 振替は既存の契約の組合せで、新しい原理を持たない（在庫の求め直しは入出庫の movement と同じ規則で `biz::stock_ledger` を変えない、記録は廃棄と同じヘッダと明細の形で入出庫履歴の表〈`list_inventory_records` の `RecordSpec`〉に 1 行足すだけ、migration は vZ〈[22](../function-design/22-mnt-migration.md) §20〉と同じ全行を写す形）。正本の置換えを独立に review する価値が、分けたときの owner の手間（Ready と merge が 2 回ずつ）を上回らない。(2) 正本の置換えは本 commit に入り、Plan Review が設計と計画を同じ版で見る（b2 の plan-first と同じ形）。(3) 70 path は b2（64）と同じ桁で、1 回の L3（新しい作成画面と記録の詳細、2 つの一覧の種別）で確かめられる。段は検証の単位で切る（S1 migration と IO、S2 BIZ、S3 CMD と wire は 1 つの Rust の検証の単位、S4 画面は frontend の検証の単位、S5 は docs と生成物）。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票。実装の Writer は Coordinator が発注時に決める）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）。座組表どおり
- Final Reviewer: Fable 5（Claude 側、R3 以上）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge,manual
- Branch: agent/stock-transfer

遷移の記録:

1. kickoff → spec-check（2026-10-27、起草役）: Coordinator の発注（導入の前の関門 9、owner の決定 TD-463）を範囲にし、規模を数えて 1 lane にした（上の「規模と手法」）。Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-27、起草役）: 対象の設計正本は ADR SPEC-STK-CNT-D1〜D3・D9 と横断の約束の表、[tracking](../db-design/tracking-system-tables.md) §14、[transaction](../db-design/transaction-tables.md)、[10](../function-design/10-common-rules.md) SPEC-UNIT-D2・D3・D11 と「入力の上限と安全な整数の範囲」、[21](../function-design/21-io-inventory-repo.md)、[22](../function-design/22-mnt-migration.md) §16・§20、[31](../function-design/31-biz-inventory-service.md) §12、[44](../function-design/44-cmd-inventory.md) §23、[52](../function-design/52-ui-shared-layout.md)、[64](../function-design/64-ui-disposal.md)、[65](../function-design/65-inventory-record-traceability.md)、[66](../function-design/66-ui-stock-movements.md)、[74](../function-design/74-ui-operation-logs.md)。振替の種類・記録・画面・migration はどの正本にも無く、設計の更新が要る。
3. design → plan-draft（2026-10-27、起草役、本 commit）: 振替の設計を D-143 と各正本に置いた（下の「本 commit で変えた正本」）。製品の振舞いで owner の判断が要る問いは 3 つ（下の「owner の判断事項」）で、推奨を既定にして書き進めた（TD-401）。plan-gate へは本 commit の後に Coordinator が進める。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定。L3 は見込み 10 分）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（2026-10-27。入れる決定 TD-463 は kickoff の依頼で数えない） | 6（owner の判断事項 (i)〜(iii) を既定のままでよいか見せる 3、L3 と画面の確かめ 1、Ready 1、merge 1） | 0 | 6 = 0 + 6 + 0 |

予備が 0 なので、L3 の 2 round 目が要れば、その問い合わせで上限の改定を一緒に諮る（`docs/DEV_WORKFLOW.md` Owner Effort Budget の「同じ 1 回で諮る」）。

owner の操作の回数を減らす工夫: (1) owner の判断事項は推奨つきで、返事が「既定のまま」か記号 1 つの形にし、L3 の依頼と同じ問い合わせに束ねる（decision point は 3 で数える）。(2) L3 の起点の DB は owner が作らない: Coordinator が L3 の前に、商品（個数の商品 2・長さの商品 1）と同じ日付の既定の計数を持つ商品 1 つを合成の値で入れた開発用の DB を用意する手順を Ready の依頼と同時に渡す（下の Test Plan の「L3 の起点の DB」）。vT は値のある開発・試験 DB でも止まらないので、owner の PC の今の DB をそのまま使ってもよく、作り直しは要らない。(3) L3 は 1 本の台本（作成画面 → 保存結果 → 記録の詳細 → 入出庫履歴 → 在庫変動履歴 → 操作ログ）で、各段の PASS / FAIL だけを返してもらう。画面の確かめ（Human Visual Confirmation）を同じ 1 回に含める。(4) Ready と merge は owner が 1 回の返事で「Ready にして hosted が緑なら merge」と委ねられる（decision point は 2 で数える）。

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
`docs/DEV_WORKFLOW.md` Risk Tiers の R3 の行の「DB」（`inventory_movements` の作り直しの migration と 2 つの表）、「Tauri command DTO」（2 つの command、6 つの型、2 つの enum の値）、「operator workflow」（新しい作成画面と記録の詳細、2 つの一覧の種別）に当たる。R4 の行の「Destructive data lifecycle」は次の理由で当たらないと判断した: vT は行の値を変えずに全行を写し（作り直しの前後で行数と id の集合を同じ TX で確かめる）、止める条件を持たない。本番の DB は無く（`docs/project-memory.md`）、vT は初回の導入の版に入るので、店の DB は空の状態で vT を通る（D-123 (4)）。値のある DB に当たるのは開発・試験 DB だけで、作り直してよい（D-123 (1)）。D-118 の (a) の migration（v9）が R4 だったのは、既存の行の値を埋め、写しを求め直して書き換えたからで、vT はどちらもしない。Coordinator が R4 に上げる場合は Human Gate に `r4`、Final Review Minimum を 2 にする。workflow の file（`.github/`・`scripts/`）に触れないので classifier の `workflow=true` にならず、Final Review Minimum は 1。operator に見える在庫の状態を書き換える経路なので、Contract Audit の 2 本目は任意の推奨（`docs/DEV_WORKFLOW.md` Contract Audit の Double audit）として Coordinator が決める。

Rollback / recovery notes: vT を COMMIT した DB は vT を知らない旧版のアプリで開けない（[22](../function-design/22-mnt-migration.md) §21 の「回復」。旧版へ戻すのは更新の前の backup）。merge の後に機能を戻すときは revert の PR で code を戻し、開発・試験 DB は作り直すか更新の前の backup に戻す。

required gate の green / red: 本 commit（docs だけ）はどの required gate の green / red も変えない（新設の 79 は `> 対応仕様:` の行に REQ の ID を持たず、FUNCTION_DESIGN の索引の UI-16 はどの REQ の対応タスクにも無いので、`generate_traceability -- --check` の出力は変わらない。`design_compliance_test` は未登録の設計書を assert で止めるが、classifier は docs だけの変更で Rust の job を走らせず、S1 が 79 を `SKIP_DOCS` に足すまでの間だけ、手元の `cargo test --test design_compliance_test` が 79 を名指して落ちる。先例: 取引先管理の 78 の設計書の commit〈`e28bdb8a`〉と登録の commit〈`8cdd1c38`〉が分かれていた）。実装では bindings・routes・traceability の再生成と `design_compliance_test` の登録を落とすと既存の required gate（bindings・frontend・traceability・rust）が red になる（下の Registration / Generation Obligations）。

## Goal

Goal Invariant:

### 最小完了条件

- 入出庫の「詰め替え・切り分け」の画面で、日付と「減らす商品」「増やす商品」を 1 つ以上ずつ（数量はその商品の単位で、長さは m）入れて保存すると、1 つの記録として、減らす商品の在庫が減り、増やす商品の在庫が増える。両方が同じ TX で動き、片方だけが動いた状態は残らない（D-143 (1)(2)）。
- その記録は入出庫履歴（種別「詰め替え・切り分け」）と記録の詳細（減らした商品・増やした商品・関連在庫変動）で後から追え、在庫変動履歴の各行は種別「詰め替え・切り分け」と元記録の link を持ち、操作ログに残る（TRACE-D14）。
- 在庫の求め直し（D-118）は振替の movement を入出庫の movement と同じ規則で扱う: 同じ日付の既定の計数がある商品は要再確認になり、計数より前の日付の振替は計数に入っている（ADR SPEC-STK-CNT-D3）。
- 振替は商品の原価を変えない（D-143 (4)）。

### 失敗定義

- 保存が片方の商品だけを動かす、または途中の失敗で記録・明細・movement・操作ログのどれかが残る。
- 減らす商品の movement が正、増やす商品の movement が負、業務日がヘッダの日付と違う、phase が 0 でない、`reference_type`・`reference_id` が記録を指さない。
- 振替の movement が初期在庫とみなされる、または計数との窓の判定が入出庫と違う。
- 同じ商品を減らして増やす記録が保存できる。長さの商品の m の入力が cm に直らない、または数量の上限・0・負を通す。
- 商品の原価が振替で変わる。
- vT が値のある DB で止まる、行の値・id・`sqlite_sequence` を変える、または既存の種類の行を拒む。
- 入出庫履歴・在庫変動履歴・操作ログで振替の記録が見つからない、または詳細へ進めない。

### 非目的

- 取消・訂正（REQ-208 の取消の設計に後で入れる）。
- 元と先の換算の比の記憶と先の数の自動計算、先の原価を元から求めること（owner の判断事項 (ii) の B・C。D-143 の Revisit）。
- 振替だけの一覧画面。商品と在庫の画面から振替を始める導線。
- `stocktake` の種類を DB の CHECK と enum から外すこと（下の「この変更で不要になるもの」の確かめて残すもの）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更（operator の操作、data / command 契約）なので、店の通常の操作列を置く。例の数・日付は説明用の合成の値。本 lane の merge の後に下の列が成り立つ。**この文書を完了できる**ことと、**詰め替え・切り分けの通常運用を達成できる**ことは同じ（記録・在庫の変動・追跡が 1 つの lane で揃う）。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 反物 A（m）の在庫 10 m、端切れ B（個）の在庫 0、どちらも計数なし | サイドバーの入出庫「詰め替え・切り分け」を開き、日付は今日のまま、「減らす商品」に A をスキャン相当の Enter で足して 3（m）、「増やす商品」に B を足して 6 を入れ、「詰め替え・切り分けを保存」 | 「詰め替え・切り分けを記録しました（記録 #1）」、減らした A 3 m・増やした B 6 個と行ごとの「在庫を見る」。A の在庫 7 m、B の在庫 6 個 | — | [31](../function-design/31-biz-inventory-service.md) §12.6b、[79](../function-design/79-ui-stock-transfer.md) |
| 同じ | 保存結果の「詳細を見る」 | 詰め替え・切り分け #1 の詳細: 減らした商品の表（A 3 m）、増やした商品の表（B 6 個）、関連する在庫変動 2 行、取消の代わりの案内。「前の画面へ戻る」で作成画面へ | — | 79 §79.8 |
| 同じ | 入出庫履歴で種別を「詰め替え・切り分け」に絞る、商品の検索で B を入れる | #1 の行が出る（B は増やす側の明細でも当たる）。行から詳細へ | — | 65 TRACE-D14 |
| 同じ | 商品と在庫の画面（今の build は在庫照会）で A の在庫変動履歴を開く | 種別「詰め替え・切り分け」・増減「-3 m」（長さの商品は m の形、66 UI-06c-D5）・元記録「詰め替え・切り分け #1」の行。種別の絞り込みに「詰め替え・切り分け」がある | — | 66 |
| 商品 C（個）に今日の日付の既定の計数（「数を保存」で 5）がある | C を減らす商品、D を増やす商品にして今日の日付で保存 | C は要再確認（棚卸しの画面の要再確認の一覧と商品の画面の範囲〈例「4〜5 個」〉に出る）。D は計数が無いので要再確認にならない | 棚卸しの画面で C を「入れ直す」と解ける | ADR D3 の理由 2（入出庫と同じ） |
| 誤って A と B を逆に保存した | 減らす商品と増やす商品を入れ替えて同じ日付でもう 1 回保存 | 在庫が元に戻る（記録は 2 つ残る） | — | D-143 (5) |
| 減らす商品に A がある | 増やす商品の追加欄で A を足す | 行は足されず、追加欄の近くに「この商品は「減らす商品」に入っています」 | 要らない方の行を削除する | 79 UI-16-D3 |

失敗と再試行: 保存の失敗は入力と冪等キーを保持し、同じ内容の再試行は同じ記録になる（UI-16-D6）。片方の表が 0 行の間は保存できず、理由を名指す。

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項

製品の振舞いで正本から一意に決まらなかった問いは次の 3 つ。owner の方針（repo 外の回答台帳 TD-401）で、推奨を既定にして書き進めた。どれも L3 の依頼に束ねて owner に見せる。答えが既定と違えば、名指した所を直す Gated Amendment にする。

(i) 画面の置き場と語:
- A（推奨・既定）: サイドバーの入出庫の「廃棄・破損」の次に独立の画面「詰め替え・切り分け」（`/inventory/transfer`）。画面・一覧・在庫変動履歴・操作ログの語は全て「詰め替え・切り分け」。
- B: 廃棄・破損の画面の中に切替を置く。
- C: 商品と在庫の画面の行の詳細から始める（元の商品が決まった状態で開く）。
- 推奨の理由: 入出庫のほかの作成画面と同じ置き場と操作で、ロスの画面に別の目的の操作を混ぜない。店の語で名指す。C は元と先の 2 つの商品を選ぶ所が要り、商品の画面の道具が増える（D-138 の「失うもの」）。
- 答えで変わる所: B・C なら [79](../function-design/79-ui-stock-transfer.md) UI-16-D1・§79.5・§79.7、[52](../function-design/52-ui-shared-layout.md) の UI-16 の行、`src/config/navigation.ts` と route の file、L3-1。語だけを変える（例「振替」）なら 79・65・66・74 の語と S4 の label の表。

(ii) 原価の移し方:
- A（推奨・既定）: 動かさない。振替は商品の原価を変えず、明細に原価を持たない。
- B: 保存の後に、元の原価から求めた先の 1 単位の原価（元の原価 × 減らした数 ÷ 基準数量 ÷ 増やした数。店の箱・袋をばらす原価の端数の規則〈`docs/project-memory.md` の 2026-09-29 の店主回答〉で丸める）を参考に出し、先の商品の原価を直す提案をする（入庫の原価差分の承諾〈REQ-209〉と同じ形）。
- C: B の値で先の原価を自動で書く。
- 推奨の理由: 原価は商品の値で、棚卸しの評価は商品の原価を使う（D-143 の Why）。先が複数のときの配り方の規則が要らず、利用者の見ない所で原価が変わる経路を作らない。先の商品（端切れ・小袋）の原価は商品の登録・修正で決められる。
- 答えで変わる所: B なら 31 §12.6b に原価の読取りと提案の値、79 に提案の dialog、明細に元の原価の写し（`transfer_items` の列）、Matrix に丸めの行、価格の履歴の書込み（`price_history`）。C なら B に加えて価格の履歴の自動の書込みと、先が複数のときの配り方の規則（D-143 の再決定）。

(iii) 1 つの記録の明細の数:
- A（推奨・既定）: 減らす商品と増やす商品の両方を複数行にできる（DB と BIZ は向きつきの明細の一覧。画面は 2 つの表に行を足す）。
- B: 元 1・先 1 に限る。
- C: 元 1・先は複数。
- 推奨の理由: DB と BIZ の手間は A も B も同じ（明細の一覧の回し方は廃棄と同じ）。1 本の反物を 2 種の端切れに分ける・複数の商品から 1 つを作る使い方を 1 回で記録できる。よくある 1 対 1 は各表 1 行で済む。
- 答えで変わる所: B・C なら 31 §12.6b の手順 1 に行の数の検査、79 UI-16-D3 と §79.5（表を 1 行の選択に）、Matrix の B3 と U3。

店主に新しく聞く必要がある事項: 無い（Q-092 の答え〈TD-358〉で足りる。換算の比を毎回同じにしているかは D-143 の Revisit の契機で、聞かなくても既定の形が成り立つ）。

## 起票時に起草役が決めたこと

設計の値を owner の判断なしに決めた技術の判断。Coordinator が覆せる。どれも D-143 と各正本に置いた。

1. movement の種類は 1 つ（`transfer`）で、向きは quantity の符号（返品・交換の `return` と同じ）。`reference_type` は `transfer_record`。理由: 2 つの種類にすると CHECK・enum・label・絞り込みの選択肢が 2 つずつ増え、在庫変動履歴の絞り込みで 1 つの記録の 2 行が別の種類に分かれる。
2. 記録はヘッダ（`transfer_records`）と明細（`transfer_items`。向き `out`/`in`）の 2 つの表。明細の UNIQUE(記録, 商品) で同じ商品を 1 つの記録に 2 回入れない。理由: 入出庫履歴の一覧（`disposal_repo.rs` の `list_inventory_records` の `RecordSpec` の表）はヘッダと明細の表の組で記録を数え・商品で探すので、1 行を足すだけで載る。ヘッダに元と先の列を持つ 1 表の形は、この表に載らず、(iii) の A を持てない。
3. 一覧の command を作らない。作成画面の「最近の記録」は `list_inventory_records` を `record_type: "transfer_record"` で読む（廃棄の `list_disposals` のような種類ごとの一覧を足さない）。
4. 検証の順は廃棄と同じ（冪等キー → 明細の形 → 日付 → fingerprint → 冪等の再送 → 明細ごとの DB の検証 → TX）。振替だけの検査は「減らす・増やすを 1 つ以上ずつ」（明細の形の段、DB を見ない）と「同じ商品の 2 回目」（明細ごとの段）。理由: 再送の判定より前に DB を見ない検証を置く今の形（31 §12.6）を崩さない。
5. 画面の語は全て「詰め替え・切り分け」、「振替」は設計の中の名前（DB・Rust の識別子と設計書）。元記録の label は「詰め替え・切り分け #{id}」、操作ログの label は「詰め替え・切り分け記録」。
6. D-052 の C23（`stockTransfer`）の集合は廃棄の C7 から `disposals.root()` を除いたもの（79 UI-16-D10）。理由: 振替が書く表を読む consumer は廃棄と同じで、廃棄の一覧だけを読まない。
7. migration の版は 13 を予約し、merge の時点の main の最大の次を取る（[22](../function-design/22-mnt-migration.md) §21）。理由: `migrate` は版の欠けを確かめず今の版より大きいものだけを当てる（`src-tauri/src/db/migration.rs` の `migrate`）ので、13 が 12 より先に main に入ると、13 まで当たった DB に後の 12 が当たらない。
8. 新しい要求の ID（REQ-210「仕入れた品を別の商品に詰め替え・切り分けた在庫の動きを記録できること」、coverage `required`）は本 commit で `docs/spec/requirements.md` に足さず、S5 で足して `generate_traceability` を再生成する。理由: 本 commit は cargo を回さない（並走の build のメモリ）。要求の一覧か `> 対応仕様:` の行を変えると 90 の再生成が要り、再生成しないと traceability の required gate が red になる。79 の `> 対応仕様:` の行は REQ の ID を持たず、S5 で REQ-210 を書く。

## この変更で不要になるもの

- backlog の項目「在庫の振替（詰め替え・切り分け）」（#214 の branch の版）: 本 lane の merge で済むので closeout で外す（本 lane では backlog を変えない）。main の今の backlog の「棚卸しの数の置き場と在庫数の求め直しの runtime」の子の「在庫の振替（詰め替え・切り分け）の `movement_type`」の項は #214 が上の項目へ移す。#214 より先に本 lane が merge するなら closeout でこの子の項を外す。
- 正本の「proposed・未実装」の D-143 の分: 本 commit で置いた注記（下の AC9 の command で数える）は S5 で現行の記述に直す。31 の「入出庫 4 業務」「4 つの `create_*`」、10 の「4 つの create」「5 経路」、74 の許可リストの括弧書き、66 の「b2 で変えていない」の文も同じ。
- code: 振替のための回り道の code は今は無い（廃棄 + 入庫の 2 回の操作は店の手作業で、アプリの code ではない）。外す code は無い。
- 確かめて残すもの: `movement_type` の `stocktake` と `reference_type` の `stocktake`。DB に `movement_type='stocktake'` の行は v9 の後に無い（[22](../function-design/22-mnt-migration.md) §19 の手順 1 が止める）が、値は在庫変動履歴の種別の絞り込み（`list.rs` の `list_movements` の `Some(MovementType::Stocktake)`）と計数の行の元記録の種類（`resolve_movement_source(&Some(ReferenceType::Stocktake), …)`）に使い、DB の CHECK と enum の値の集合を同じに保つ（D-061・D-064。`finite_enum_contract_tests.rs` の parity）。vT で CHECK から外すと enum との parity が崩れ、enum から外すと b2 の wire が変わる。`rg -n 'MovementType::Stocktake\|ReferenceType::Stocktake' src-tauri/src` → `finite_enum_contract_tests.rs` 4 行、`list.rs` 5 行、`inventory_repo.rs` の test 2 行。
- 確かめて残すもの: 廃棄の `list_disposals`（廃棄の作成画面の「最近の記録」が使う）。振替は使わないが、廃棄の画面を変えない。

## Scope

本 lane が変える file と目的。実装は S1 → S5 の順に積む。S1〜S3 は 1 つの Rust の検証の単位（S3 の wire の変更は S4 の画面と bindings で揃う）、S4 は frontend の検証の単位、S5 は docs と生成物。既存の test の移し方は Matrix の「既存の test の移し方」を引く。

### 本 commit で変えた正本（plan-first）

- [decision-log](../decision-log.md) D-143（新設）。
- [ADR](../adr/2026-10-16-stocktake-count-placement.md) の横断の約束の表の入出庫の行に振替。
- [DB_DESIGN](../DB_DESIGN.md) のテーブル一覧（11a・11b）・正本の一覧・CHECK 制約方針・インデックス方針・operation_type の一覧。
- [tracking](../db-design/tracking-system-tables.md) §14 の 2 つの CHECK の説明と movement_type の値の表（`transfer` と、`stocktake` を残す理由）。
- [transaction](../db-design/transaction-tables.md) §11a-11b（新設）。
- [10](../function-design/10-common-rules.md) の「入力の上限と安全な整数の範囲」(a) の 1 明細の数量と在庫の行。
- [21](../function-design/21-io-inventory-repo.md) §10.5a（新設）。
- [22](../function-design/22-mnt-migration.md) §3.1 のモジュール構成と §21（新設、MNT-03-D22）。
- [31](../function-design/31-biz-inventory-service.md) の D-118 の節の振替の項、§12.1、§12.6b（新設）、§12.6a の read 関数。
- [44](../function-design/44-cmd-inventory.md) §23.1、§23.3、§23.7 の `list_inventory_records` の種別、§23.7a（新設、CMD-13）。
- [52](../function-design/52-ui-shared-layout.md) の route 表の UI-16。
- [65](../function-design/65-inventory-record-traceability.md) の冒頭、§65.1、§65.2 TRACE-D14、§65.3、§65.12。
- [66](../function-design/66-ui-stock-movements.md) の Filters。
- [74](../function-design/74-ui-operation-logs.md) の UI-11c-D7、operation_type の registry、関連記録の許可リストと route 表。
- [79](../function-design/79-ui-stock-transfer.md)（新設、UI-16・UI-16b）。
- [FUNCTION_DESIGN](../FUNCTION_DESIGN.md) の索引の UI-16。
- [SCREEN_DESIGN](../SCREEN_DESIGN.md) の Phase 3 の画面の一覧と UI-16 の段落。

### S1 migration と IO

- `src-tauri/src/db/schema_v13.rs`（新設）: `apply_v13_stock_transfer`（22 §21 の手順。版の定数 `VT_VERSION`。vZ の `schema_v11.rs` と同じ helper〈`commit_transaction`・`rollback_after_error`〉）。
- `src-tauri/src/db/migration.rs`: `migrations()` に登録（description `振替の種類と振替の記録の表（D-143）`）。版の番号は 22 §21 の規則で merge の時点に決める。
- `src-tauri/src/db/mod.rs`: `pub mod schema_v13; pub mod transfer_repo;`。
- `src-tauri/src/db/transfer_repo.rs`（新設）: 21 §10.5a の 4 関数と `TransferDirection`・`NewTransferRecord`・`NewTransferItem`・`TransferRecordDetail`・`TransferRecordDetailItem`。
- `src-tauri/src/db/inventory_repo.rs`: `MovementType::Transfer`・`ReferenceType::TransferRecord` と `as_str`・`parse_*` の各 1 arm、as_str の test。
- `src-tauri/src/db/disposal_repo.rs`: `list_inventory_records` の `SPECS` に `transfer_record` の 1 行。
- `src-tauri/tests/design_compliance_test.rs`: `SKIP_DOCS` に `79-ui-stock-transfer.md`（`64-ui-disposal.md`・`78-ui-supplier-management.md` と同じ UI の設計書の扱い。関数の定義を持たない）、`build_doc_to_modules_map` の 21 の行に `db::transfer_repo`、31 の行に `biz::inventory_service::transfer`、44 の行に `cmd::transfer_cmd`。

### S2 BIZ

- `src-tauri/src/biz/inventory_service/transfer.rs`（新設）: `create_transfer`・`get_transfer_record` と 3 つの型（31 §12.6b）。
- `src-tauri/src/biz/inventory_service/mod.rs`: module と再 export。
- `src-tauri/src/biz/inventory_service/list.rs`: `list_inventory_records` の許可の `matches!` に `transfer_record`、`resolve_movement_source` の `TransferRecord` の arm（label `詰め替え・切り分け`・route `/inventory/transfer/records`）。
- `src-tauri/src/biz/inventory_service/common.rs`: `apply_stock_change` の doc comment の「入出庫 4 業務だけが呼ぶ」を振替を含めた 5 つに（振舞いは変えない）。

### S3 CMD と wire

- `src-tauri/src/cmd/transfer_cmd.rs`（新設）: 44 §23.7a の 2 command（`#[tauri::command]` と `#[specta::specta]` の対）。
- `src-tauri/src/cmd/mod.rs`: `pub mod transfer_cmd;`。
- `src-tauri/src/lib.rs`: `collect_commands!` と `generate_handler!` に 2 つずつ。
- `src-tauri/src/finite_enum_contract_tests.rs`: `MovementType::Transfer`・`ReferenceType::TransferRecord`・`TransferDirection` の 2 値の wire と DB の CHECK の parity。
- `src/lib/bindings.ts`: `cargo run --bin generate_bindings` で再生成（手で書かない）。

### S4 画面

- `src/routes/inventory/transfer.tsx`・`src/routes/inventory/transfer/index.tsx`・`src/routes/inventory/transfer/records/$recordId.tsx`（新設）と `src/routeTree.gen.ts`（`npm run generate:routes`）。
- `src/features/stock-transfer/StockTransferPage.tsx`・`lib/transfer-request.ts` と test（新設、79 §79.2〜§79.7）。
- `src/features/inventory-records/TransferRecordDetailPage.tsx` と test（新設、79 §79.8）。
- `src/features/inventory-records/types.ts`: `INVENTORY_RECORD_TYPE_OPTIONS` に `{ value: "transfer_record", label: "詰め替え・切り分け" }`（「廃棄・破損」の次）。
- `src/features/stock-movements/types.ts`: `MOVEMENT_TYPE_OPTIONS` に `{ value: "transfer", label: "詰め替え・切り分け" }`（「廃棄・破損」の次）。`lib/movement-formatters.ts` の `movementTypeLabels` に `transfer`（`Record<MovementType, string>` なので bindings の再生成の後は足さないと型の error）。
- `src/features/operation-logs/operation-type-labels.ts`: `transfer_create: { category: "入出庫", label: "詰め替え・切り分け記録" }`。`OperationLogsPage.tsx` の record_type → route の表に `transfer_record`。
- `src/config/navigation.ts`: 入出庫の `ui-05` の次に `ui-16`（79 §79.7）。
- `src/lib/invalidation-contract.ts`: `stockTransfer`（C23）。`src/test/invalidation-oracle.ts`・`src/test/invalidation-contract-static-fixtures.ts` に独立に写した C23。
- 既存の test の追随（Matrix の T2）: `src/features/products/search.test.ts`、`src/features/stock-movements/StockMovementsPage.test.tsx`、`src/features/stock-movements/lib/movement-formatters.test.ts`、`src/features/operation-logs/operation-type-labels.test.ts`、`src/features/operation-logs/OperationLogsPage.test.tsx`、`src/features/inventory-records/InventoryRecordsPage.test.tsx`、`src/config/navigation.test.ts`、`src/lib/invalidation-contract.meta.test.ts`、`src/hooks/unsaved-changes-guard-sweep.test.ts`（未保存の離脱ガードを持つ画面の一覧に `StockTransferPage`）。

### S5 docs・生成物

- `docs/spec/requirements.md` に REQ-210（UI-16, UI-16b, BIZ-02、coverage `required`）、`docs/spec/requirements-coverage.md` の同じ行、79 の `> 対応仕様:` の行に REQ-210、`docs/function-design/90-traceability.md` を `cargo run --bin generate_traceability` で再生成（手で書かない）。
- `docs/UI_TECH_STACK.md` の D-052 の entry の数（「22 mutation entry / 25 success handler」と C の範囲）を `rg -c "invalidateByContract\(" src/features --glob '!**/*.test.*'` の実測で直し、decision-log D-052 の Contract 行に C23 を 1 文で足す（D-052 の Revisit の規則）。
- `docs/ARCHITECTURE.md`・`docs/architecture/ui-task-specs.md`・`docs/diagrams/current-system.md` の画面・command の一覧に UI-16・UI-16b・CMD-13 の行。
- 本 commit で置いた「proposed・未実装」の D-143 の分を現行の記述に直す（上の「この変更で不要になるもの」）。版の番号を取り直したら 22・DB_DESIGN・tracking・transaction の `v13` と file 名を同じ番号に。

### 節の所有表（並走の lane と重なる file）

下の「予定 path の一覧」と open な PR の差分（`git diff --name-only --no-renames origin/main...origin/<branch>`）を `comm -12` で突き合わせた（2026-10-27）。#190・#204・#210 とは 0。merge の順は、どの PR も本 lane より先（本 lane は起票の段）と見込み、本 lane は先頭に来たときに `origin/main` を単段で取り込む（`git -c merge.directoryRenames=false merge origin/main`）。生成物（`src/lib/bindings.ts`・`docs/function-design/90-traceability.md`・`src/routeTree.gen.ts`）は手で解かず、取り込んだ後に再生成する（D-098）。

| file | 本 lane の節 | 重なる PR と節 | 扱い |
|---|---|---|---|
| `docs/decision-log.md` | 末尾の D-143（本 commit）、D-052 の Contract 行への 1 文（S5） | #194・#201・#209（D-140）・#211（D-142）・#212（D-141）・#214 の末尾の追記と各行 | 末尾の追記は merge の順で両方を残す。D-052 の行は本 lane だけ |
| `docs/SCREEN_DESIGN.md` | Phase 3 の画面の一覧と UI-16 の段落 | #172（SD 直読みの節）・#197（Z004 の取消の節）・#209（商品 CSV）・#212（商品フォーム） | 節が違う。同期で当て直す |
| `docs/FUNCTION_DESIGN.md` | 索引の UI-16 の 1 行（UI-05 の次） | #197（索引の別の行） | 行が違う |
| `docs/DB_DESIGN.md` | テーブル一覧 11a・11b、CHECK、index、operation_type | #172（`daily_report_imports` の列） | 節が違う |
| `docs/function-design/22-mnt-migration.md` | §3.1 の 1 行と末尾の §21 | #172（§3.1 の `schema_v12.rs` の行と §17 の vS） | §3.1 は隣の行で、同期で両方を残す。版の番号は 22 §21 の規則 |
| `docs/function-design/65-inventory-record-traceability.md` | 冒頭、§65.1、§65.2 TRACE-D14、§65.3、§65.12 の末尾 | #197（§65.5a TRACE-D13 と §65.12 の末尾） | §65.12 の末尾の追記は merge の順で両方を残す |
| `docs/function-design/10-common-rules.md` | 「入力の上限と安全な整数の範囲」(a) の 2 行 | #211（日報の紙の節）・#214（別の節） | 節が違う |
| `docs/UI_TECH_STACK.md` | D-052 の entry の数（S5） | #197・#212・#214 | 同期の後に実測で直す |
| `docs/architecture/ui-task-specs.md`・`docs/ARCHITECTURE.md` | UI-16 の行（S5） | #172・#197・#209 | 行が違う |
| `docs/function-design/90-traceability.md`・`src/lib/bindings.ts` | 再生成（S3・S5） | #172・#197・#209 | 手で解かず、同期の後に再生成 |
| `src-tauri/src/db/migration.rs`・`src-tauri/src/db/mod.rs` | vT の登録と 2 つの `mod` | #172（v12 の登録） | 版の番号は 22 §21 の規則（先に merge した側が若い番号）。登録の行は両方を残す |
| `src-tauri/src/lib.rs`・`src-tauri/src/cmd/mod.rs` | 2 command の登録と `mod` | #172・#197・#201（bin を外す） | 登録の行は両方を残す |
| `src-tauri/tests/design_compliance_test.rs` | 79 の登録と 3 module | #172・#201 | 行が違う |
| `src/hooks/unsaved-changes-guard-sweep.test.ts` | 一覧に `StockTransferPage` | #197 | 行が違う |

### 予定 path の一覧（`comm -12` の入力）

```text
docs/ARCHITECTURE.md
docs/DB_DESIGN.md
docs/FUNCTION_DESIGN.md
docs/SCREEN_DESIGN.md
docs/UI_TECH_STACK.md
docs/adr/2026-10-16-stocktake-count-placement.md
docs/architecture/ui-task-specs.md
docs/db-design/tracking-system-tables.md
docs/db-design/transaction-tables.md
docs/decision-log.md
docs/diagrams/current-system.md
docs/function-design/10-common-rules.md
docs/function-design/21-io-inventory-repo.md
docs/function-design/22-mnt-migration.md
docs/function-design/31-biz-inventory-service.md
docs/function-design/44-cmd-inventory.md
docs/function-design/52-ui-shared-layout.md
docs/function-design/65-inventory-record-traceability.md
docs/function-design/66-ui-stock-movements.md
docs/function-design/74-ui-operation-logs.md
docs/function-design/79-ui-stock-transfer.md
docs/function-design/90-traceability.md
docs/plans/2026-10-27-stock-transfer.md
docs/plans/test-matrices/2026-10-27-stock-transfer.md
docs/spec/requirements-coverage.md
docs/spec/requirements.md
src-tauri/src/biz/inventory_service/common.rs
src-tauri/src/biz/inventory_service/list.rs
src-tauri/src/biz/inventory_service/mod.rs
src-tauri/src/biz/inventory_service/transfer.rs
src-tauri/src/cmd/mod.rs
src-tauri/src/cmd/transfer_cmd.rs
src-tauri/src/db/disposal_repo.rs
src-tauri/src/db/inventory_repo.rs
src-tauri/src/db/migration.rs
src-tauri/src/db/mod.rs
src-tauri/src/db/schema_v13.rs
src-tauri/src/db/transfer_repo.rs
src-tauri/src/finite_enum_contract_tests.rs
src-tauri/src/lib.rs
src-tauri/tests/design_compliance_test.rs
src/config/navigation.test.ts
src/config/navigation.ts
src/features/inventory-records/InventoryRecordsPage.test.tsx
src/features/inventory-records/TransferRecordDetailPage.test.tsx
src/features/inventory-records/TransferRecordDetailPage.tsx
src/features/inventory-records/types.ts
src/features/operation-logs/OperationLogsPage.test.tsx
src/features/operation-logs/OperationLogsPage.tsx
src/features/operation-logs/operation-type-labels.test.ts
src/features/operation-logs/operation-type-labels.ts
src/features/products/search.test.ts
src/features/stock-movements/StockMovementsPage.test.tsx
src/features/stock-movements/lib/movement-formatters.test.ts
src/features/stock-movements/lib/movement-formatters.ts
src/features/stock-movements/types.ts
src/features/stock-transfer/StockTransferPage.test.tsx
src/features/stock-transfer/StockTransferPage.tsx
src/features/stock-transfer/lib/transfer-request.test.ts
src/features/stock-transfer/lib/transfer-request.ts
src/hooks/unsaved-changes-guard-sweep.test.ts
src/lib/bindings.ts
src/lib/invalidation-contract.meta.test.ts
src/lib/invalidation-contract.ts
src/routeTree.gen.ts
src/routes/inventory/transfer.tsx
src/routes/inventory/transfer/index.tsx
src/routes/inventory/transfer/records/$recordId.tsx
src/test/invalidation-contract-static-fixtures.ts
src/test/invalidation-oracle.ts
```

## Non-scope

- 取消・訂正、換算の比、先の原価の算出と提案、振替だけの一覧画面、商品の画面からの入口（上の Goal の非目的と 79 §79.9）。
- 廃棄の画面と `list_disposals` の変更。
- `stocktake` の種類を外すこと。
- 在庫の求め直し（`biz::stock_ledger`）・整合性の検査（36）・棚卸し（35・73）の変更（振替の movement は今の規則でそのまま扱われる。変えないことを Matrix の L の行で確かめる）。
- backlog・Plans の更新（closeout）。

## Acceptance Criteria

AC の baseline は 2026-10-27 に本 worktree で測った（command は逐語）。実装の後の期待は「完了時」。

- AC1（migration）: Matrix の M1〜M6 の Rust の test が PASS（`cd src-tauri && cargo test schema_v13` の該当 test が全て PASS）。空の DB と、入庫・返品交換・手動販売・廃棄・初期在庫・Z004（`phase = 1`）の movement と計数・棚卸しを持つ直前の版の DB の両方で vT が成功し、各 movement の全列と id と `sqlite_sequence` が vT の前と同じ。vT の後に `transfer`・`transfer_record` の行が入り、一覧に無い値が CHECK で拒まれる。
- AC2（BIZ の振舞い）: Matrix の B1〜B14 の test が PASS。1 つの `create_transfer` で、減らす明細は `-quantity`・増やす明細は `+quantity` の movement（`movement_type='transfer'`、`reference_type='transfer_record'`、`reference_id=record_id`、`business_date=transfer_date`、`phase=0`、`settlement_no` NULL）を明細ごとに 1 つ作り、両方の商品の写しを求め直す。検証の失敗（31 §12.6b の手順 0・1・2・5 の各文）と TX の中の失敗（在庫の上限越え）で `transfer_records`・`transfer_items`・`inventory_movements`・`operation_logs` の行数が呼ぶ前と同じ。同じ key・同じ内容は `idempotent_replay: true` で行が増えず、同じ key・違う内容は `IdempotencyConflict`。`products.cost_price_centi` が呼ぶ前と同じ。
- AC3（D-118 との関係）: Matrix の L1〜L4 の test が PASS: 振替の日付と同じ日付の既定の計数を持つ商品は要再確認（理由 2）、計数より前の日付の振替は計数に入り、後の日付は入らない、fresh な計数の保存の前に保存した振替は入る。振替の movement は初期在庫とみなされない（`INITIAL_STOCK_SQL` の式に当たらない）。`biz::stock_ledger` の差分が無い（`git diff origin/main -- src-tauri/src/biz/stock_ledger.rs` が空）。
- AC4（wire）: 完了時に `rg -n '^export type MovementType =' src/lib/bindings.ts` の行に `"transfer"`、`rg -n '^export type ReferenceType =' src/lib/bindings.ts` の行に `"transfer_record"` があり、`rg -n 'createTransfer:\|getTransferRecord:\|^export type TransferDirection =' src/lib/bindings.ts` が 3 行。baseline: `rg -n "'transfer'\|\"transfer\"\|transfer_record" src-tauri/src src --glob '!src/lib/bindings.ts' \| wc -l` → 0。`cd src-tauri && cargo run --bin generate_bindings` の後に `git diff --exit-code src/lib/bindings.ts` が 0。
- AC5（記録の追跡）: Matrix の R1〜R5 の test が PASS: `list_inventory_records` が `record_type: "transfer_record"` で振替の記録だけを返し、`"all"` に含め、商品の絞り込みが減らす明細と増やす明細の両方で当たり、件数は明細の数。未対応の種別は今のまま `validation`。`resolve_movement_source` が `詰め替え・切り分け #{id}` と `/inventory/transfer/records/{id}` を返す。`get_transfer_record` が減らす明細を先に返し、無い id は `not_found`。
- AC6（作成画面）: Matrix の U1〜U11 の frontend の test が PASS（79 §79.10 の UI-16-D1〜D11）。
- AC7（記録の詳細と種別）: Matrix の U12〜U16 の test が PASS（UI-16b、入出庫履歴と在庫変動履歴の種別の選択肢、操作ログの label と関連記録の link）。
- AC8（到達と invalidation）: `src/config/navigation.test.ts` の UI-16 の到達の test と、`src/lib/invalidation-contract.meta.test.ts` の C23 の独立の oracle との完全一致が PASS。
- AC9（正本の現行化）: 完了時に `rg -n 'proposed・未実装' docs --glob '!docs/archive/**' --glob '!docs/plans/**' \| rg -c 'D-143\|振替\|transfer\|詰め替え'` が 0。baseline（本 commit の後）: 38。`docs/spec/requirements.md` に REQ-210 の行があり、`cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0。
- AC10（gate）: `bash scripts/doc-consistency-check.sh` と `--target plan docs/plans/2026-10-27-stock-transfer.md` の本 lane が足した ERROR が 0、`bash scripts/check-workflow-git.sh` が exit 0、Rust（`cargo fmt --check`・`cargo clippy --all-targets --all-features -- -D warnings`・`cargo test`）と frontend（`npm run typecheck && npm run lint && npm run format:check && npm test && npm run build`）が PASS。L3 の前に Writer が `cargo check --release` を通す。
- AC11（L3）: owner が下の Test Plan の L3-1〜L3-7 を PASS とし、helper の manual の record（`python3 scripts/pr-gate.py status --pr <番号>` の manual）が L3 を頼んだ head で PASS になる。

## Design Readiness

- 引用する設計正本（節まで）: D-143、ADR SPEC-STK-CNT-D1〜D3・D9 と横断の約束の表、tracking §14、transaction §11a-11b、10 SPEC-UNIT-D2・D3・D11 と「入力の上限と安全な整数の範囲」(a)、21 §10.5a、22 §21、31 §12.2・§12.6・§12.6a・§12.6b・§12.8、44 §23.3・§23.7・§23.7a、52 の route 表、64（同じ形の作成画面）、65 TRACE-D1・D2・D7・D11・D14、66 の Filters、74 UI-11c-D7 と registry、79。
- 必要な設計成果物: BIZ・IO・CMD・migration・table・operator workflow・Japanese wording・decision の行が全て当たり、全て updated in this PR（本 commit）。D-052 の Contract 行と UI_TECH_STACK の数は S5（実測が要る）。
- plan にしかない durable な判断の昇格先: 上の「起草役が決めたこと」の 1〜7 は D-143 と 21・22・31・79 に置いた。8（REQ-210 を S5 で足す）は配布の手順で、正本の判断ではない。
- 前提・制約と、延期した design gap の follow-up: 取消・訂正は REQ-208（deferred）の設計に入れる（65 §65.7.2）。換算の比と先の原価は D-143 の Revisit。owner の判断事項 (i)〜(iii) の答えで変わる所は上に名指した。
- 絶対保証の例外と escape hatch の自己点検: 「片方だけが動いた状態は残らない」は、明細ごとの `apply_stock_change` が同じ TX の中で、どの失敗も `?` で TX 全体を戻す（rusqlite の Transaction の drop で ROLLBACK）ことに依る。例外は COMMIT の後の失敗だけで、COMMIT は 1 回。「vT はどの DB でも止まらない」は、CHECK に値を足すだけで既存の行の値の集合が新しい集合に含まれることに依る。例外は作り直しの前後の行数と id の集合の不一致（手順 5）で、そのときは何も変えずに止まる。
- 判定: ready。正本だけで「何を作るか・なぜ・何を退けたか」が読める（D-143 の Decision・Why・Alternatives、79 の決定表）。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| Tauri command（`create_transfer`・`get_transfer_record`） | `lib.rs` の `collect_commands!` と `generate_handler!`、`#[tauri::command]` + `#[specta::specta]` の対、`cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成（S3、Contract Ledger の C-REG） |
| function-design doc 新設（79） | `src-tauri/tests/design_compliance_test.rs` の `SKIP_DOCS` に 79（シグネチャを持たない UI の設計書で、`64-ui-disposal.md` と同じ扱い）と、`build_doc_to_modules_map()` の 21・31・44 の行に新しい module（S1） |
| source doc 新設（79） | `docs/FUNCTION_DESIGN.md` の索引（本 commit）、`docs/SCREEN_DESIGN.md`（本 commit）、`docs/architecture/ui-task-specs.md`（S5） |
| REQ の追加（REQ-210） | `docs/spec/requirements.md`・`requirements-coverage.md`・79 の `> 対応仕様:`、`cargo run --bin generate_traceability` で 90 を再生成（S5） |
| route 新設 | `npm run generate:routes` で `src/routeTree.gen.ts`（S4） |
| operator 画面新設 | `src/config/navigation.ts` の `ui-16`（`to` + `status: "active"`）と `navigation.test.ts` の REQ-210 入りの到達の test（S4）。「operator が画面に到達できる」は Contract Ledger の C-NAV |

L1 full の生成系検査（bindings・routes・traceability）を S5 の後に 1 回通す。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 振替は app-core の在庫の記録で、外部の adapter（POS・CSV）に触れない | — |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 事実は店主の答え（TD-358）だけ。形（記録・原価・換算・画面）はアプリの判断で D-143 に置いた | D-143 |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 冪等キーで再送を 1 つにする。失敗は TX 全体を戻す。取消は無く、逆向きの振替で戻す（H5 の過剰側に倒れる） | 31 §12.6b、79 §79.6、Matrix B の行 |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 棚の作業（切る・詰める）の後に 1 回の入力。同じ日に数えた商品は要再確認で入れ直しを促す | 79、Ordinary Operation |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | not applicable（外部の system に依らない） | — |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | fixture は合成の商品と値だけ | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 振替をロス（廃棄）と仕入れ（入庫）から分ける（D-143 の Context）。売上・ロス原価・入庫の原価の合計に入らない。棚卸しの評価は数量だけが変わる | D-143、Matrix の B13 |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 2 つの表の入力の分かりやすさ、スキャン相当の Enter、長さの m の入力と表示、保存結果の読みやすさ | Test Plan の L3 |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 新しい環境依存は無い | — |

## Boundary / Wire Contract

- producer: `create_transfer`・`get_transfer_record`（CMD-13）、`list_inventory_records`（`transfer_record` の行）、`list_movements`（`movement_type: "transfer"` の行と `source`）。
- consumer: `StockTransferPage`・`TransferRecordDetailPage`・`InventoryRecordsPage`・`StockMovementsPage`（`StockHistoryTable`・`MovementTable`）・`OperationLogsPage`。
- wire type: `TransferCreateRequest { idempotency_key: string, transfer_date: string, items: TransferItemInput[] }`、`TransferItemInput { product_code: string, direction: TransferDirection, quantity: number }`、`TransferDirection = "out" | "in"`、`TransferCreateResult`（`DisposalCreateResult` と同じ 4 field）、`TransferRecordDetail { id, transfer_date, status, created_at, items: TransferRecordDetailItem[], movements: MovementRecord[] }`、`TransferRecordDetailItem { id, product_code, product_name, department_name, stock_unit: ProductStockUnit, direction, quantity }`。`MovementType` に `"transfer"`、`ReferenceType` に `"transfer_record"`。
- internal type: `db::transfer_repo` の `NewTransferRecord`・`NewTransferItem`、DB の `transfer_items.direction` は TEXT（CHECK で 2 値）。
- precision/range: quantity は 1 以上 `MAX_LINE_QUANTITY`（`9999999`）の整数で、在庫の数量の単位（長さは cm。画面は m の小数 2 桁を cm に直す）。在庫の上限は `apply_stock_change` の後の `recompute_stock`（`999999999`）。金額は無い。どれも安全な整数の範囲に入る（10 (a)・(b)）。
- round-trip path: 画面 → `createTransfer` → BIZ → DB → `getTransferRecord`・`listInventoryRecords`・`listMovements` → 画面。数量は保存の値をそのまま返し、表示で単位に直す。
- invalid input: `direction` の一覧外は serde の deserialize で拒む（generated enum）。`record_type` の一覧外は今のまま `validation`。数量 0・負・上限越え・同じ商品の 2 回目・片側 0 行・日付の形と暦は `validation`（31 §12.6b）。
- compatibility: `MovementType`・`ReferenceType` の union が広がるだけで、既存の値と意味は変えない。TS の `Record<MovementType, string>` の表は label を足さないと型の error になる（足し漏れを compile で止める）。旧版のアプリは vT の後の DB を開けない（22 §21 の「回復」）。

## Test Plan

Test Design Matrix は下の節の link。

- targeted tests: Rust は `cargo test schema_v13`・`cargo test transfer`・`cargo test list_inventory_records`・`cargo test finite_enum`、frontend は `npx vitest run src/features/stock-transfer src/features/inventory-records src/features/stock-movements src/features/operation-logs src/config src/lib/invalidation-contract.meta.test.ts src/features/products/search.test.ts src/hooks/unsaved-changes-guard-sweep.test.ts`。
- negative tests: Matrix の M4・M5・B3〜B10・R4・U4・U5。
- compatibility checks: 既存の種類の movement・記録の一覧・在庫変動履歴の test が変わらず PASS（Matrix の T1）。
- data safety checks: fixture は合成の値だけ（下の Data Safety）。
- main wiring/integration checks: 作成画面 → 保存 → 記録の詳細 → 入出庫履歴 → 在庫変動履歴の link の通り（U11・U12・R5）と、生成物の再生成（bindings・routes・traceability）。

- If the Human Gate includes L3, Writer completion includes `cargo check --release` before the owner native build; this is not a CI gate.
- L3 は merge の列の先頭に来て、最新の `origin/main` を取り込んだ head で頼む（`docs/DEV_WORKFLOW.md` Wave Operation。頼む前に `git merge-base --is-ancestor origin/main <head>` の終了値が 0 を確かめる）。L3 の後に本 lane を列の後ろへ回さない。

L3 の起点の DB: owner の PC の今の開発・試験 DB をそのまま使う（vT は値のある DB でも止まらない）。台本に要る商品が無ければ、Coordinator が Ready の依頼と同時に、合成の商品 CSV（CP932。個数の商品 2〈`L3-TR-01`・`L3-TR-02`〉と長さの商品 1〈`L3-TR-M1`、初期在庫 10 m〉）を渡し、owner は商品の一括インポートで入れる（`docs/DEV_WORKFLOW.md` Human Visual Confirmation の fixture の規則）。L3-5 の計数は owner が棚卸しの画面で `L3-TR-02` に今日の日付で「数を保存」する（1 操作）。

| L3 | 到達経路 | 入力物 | 観測可能な合格基準 | 依存する既知 backlog |
|---|---|---|---|---|
| L3-1 | サイドバー → 入出庫 → 詰め替え・切り分け | — | 廃棄・破損の次に「詰め替え・切り分け」があり、題と説明が読める | — |
| L3-2 | 同じ画面 | `L3-TR-M1`（減らす、1.5 m）、`L3-TR-01`（増やす、3） | 2 つの表に Enter で足せ、長さの商品の数量を m で入れられ、現在庫が単位つきで読める。増やす商品の欄に `L3-TR-M1` を入れると行が足されず案内が出る | — |
| L3-3 | 「詰め替え・切り分けを保存」 | L3-2 の入力 | 保存中は入力が止まり、保存結果に記録の番号、減らした 1.5 m・増やした 3 個、行ごとの「在庫を見る」が読める | — |
| L3-4 | 保存結果の「詳細を見る」→「前の画面へ戻る」 | — | 詳細に減らした商品と増やした商品の 2 つの表と関連在庫変動、取消の代わりの案内。戻ると作成画面 | — |
| L3-5 | 棚卸しで `L3-TR-02` に今日「数を保存」した後、`L3-TR-02` を減らす商品にして保存 → 棚卸しの画面 | `L3-TR-02` | `L3-TR-02` が要再確認の一覧に出る | — |
| L3-6 | 入出庫履歴で種別「詰め替え・切り分け」 | — | L3-3・L3-5 の記録が出て、行から詳細へ進める | — |
| L3-7 | `L3-TR-M1` の在庫変動履歴、操作ログ | — | 種別「詰め替え・切り分け」・元記録の link の行、種別の絞り込みの選択肢。操作ログに「詰め替え・切り分け記録」と関連記録の link | — |

## Test Design Matrix

[2026-10-27-stock-transfer](test-matrices/2026-10-27-stock-transfer.md)。

## Review Focus

- 振替の movement が D-118 の求め直しで入出庫と同じに扱われるか（初期在庫の印、窓の判定、要再確認の理由 2）。`biz::stock_ledger` を変えずに済むという主張の根拠（movement の種類で分けない）。
- vT が値のある DB で止まらず、行の値・id・`sqlite_sequence` を変えないこと。版の番号の規則（main に欠けを作らない）。
- 片方だけが動いた状態が残らないこと（全ての失敗の経路が TX の前か TX の中か）。
- 同じ商品を減らして増やす記録を、画面と BIZ と DB の 3 か所で止める形が過不足ないか。
- 原価を動かさない既定（owner の判断事項 (ii)）が、棚卸しの評価・ロス原価・入庫の原価の合計と矛盾しないか。
- 「この変更で不要になる記述・条件・code は無いか」（上の節。`stocktake` を残す理由）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-143 (1)(2) | decision-log D-143、31 §12.6b | S2 `create_transfer` | Matrix B1・B2 | L3-3 |
| D-143 (3) | D-143、10 SPEC-UNIT-D2・D3、79 UI-16-D4 | S2 の数量の検証、S4 の m の入力 | B5・B6・U5 | L3-2 |
| D-143 (4) | D-143、31 §12.6b の「原価・金額」 | S2（原価を読まず書かない） | B13 | — |
| D-143 (5) | D-143、79 §79.6・§79.8 | S4 の案内 | U12 | L3-4 |
| D-143 (6) / MNT-03-D22 | 22 §21、tracking §14、transaction §11a-11b | S1 `schema_v13.rs` | M1〜M6 | — |
| D-143 (7) / UI-16-D1 | 79、52 | S4 route と navigation | U1、C-NAV | L3-1 |
| ADR 横断の約束の表（振替の行） | ADR、31 の D-118 の節の振替の項 | S2（`apply_stock_change` を明細ごとに） | L1〜L4 | L3-5 |
| ADR SPEC-STK-CNT-D9（初期在庫の印） | ADR D9、21 の D-118 の節 | 変えない（`INITIAL_STOCK_SQL`） | L4 | — |
| 10 (a) 1 明細の数量 | 10「入力の上限と安全な整数の範囲」 | S2 | B5 | — |
| 31 §12.6b 手順 0〜10 | 31 | S2 | B3〜B12 | — |
| 31 §12.8 fingerprint | 31 | S2 | B11 | — |
| 21 §10.5a | 21 | S1 `transfer_repo` | R3・R4 | — |
| 44 §23.7a / CMD-13 | 44 | S3 | B14、C-REG | — |
| 44 §23.7 `list_inventory_records` の種別 | 44、21 §10.5a | S1 の `SPECS`、S2 の許可 | R1・R2・R4 | L3-6 |
| 65 TRACE-D14 | 65 | S2 `resolve_movement_source`、S4 の詳細と選択肢 | R5・U12〜U14 | L3-4・L3-6・L3-7 |
| 65 TRACE-D11 | 65、79 UI-16-D11 | S4 | U11 | L3-4 |
| 66 Filters の `transfer` | 66 | S4 | U14 | L3-7 |
| 74 UI-11c-D7・registry | 74 | S2 の detail_json、S4 の label と route | U15・U16 | L3-7 |
| 79 UI-16-D2〜D10 | 79 | S4 | U2〜U10 | L3-2・L3-3 |
| D-052 C23 | 79 UI-16-D10、decision-log D-052（S5） | S4 `invalidation-contract.ts` | U10 | — |
| D-061 / D-064（enum と CHECK の parity） | DB_DESIGN の CHECK 制約方針 | S3 `finite_enum_contract_tests.rs` | E1 | — |
| C-REG（登録と生成） | 本 packet の Registration | S1・S3・S4・S5 | bindings・routes・traceability の `--check` | — |
| C-NAV（到達導線） | 79 §79.7、52 | S4 `navigation.ts` | `navigation.test.ts` | L3-1 |

adjacent-contract sweep: 31 §12.2（`apply_stock_change` の引数と前提）は変えずに呼ぶ（行を立てない）。31 §12.6（廃棄）・64・`list_disposals` は変えない（Non-scope）。35・36・73（棚卸し・整合性）は振替の movement を種類で分けないので変えない（L1〜L4 が確かめる）。66 の `StockHistoryTable`・`MovementTable` は種別の label の表を共有するので S4 の label の 1 行で両方に出る（U13）。

## Contract Audit（起票の時点の一巡）

新しく足す契約の文を境界の 4 観点（安全な整数の範囲・0 の表示・失敗の時点と順序・単位や種類の混在）で一巡した。

- 安全な整数の範囲: 明細の数量は `MAX_LINE_QUANTITY`、在庫は `recompute_stock` の上限で、どちらも既存の定数と 1 か所。金額は無い。1 つの記録の明細の数に上限を置かないが、和を取る値が無いので範囲に届く筋が無い（入庫・廃棄の円の合計〈10 (c)〉と違う）。
- 0 の表示: 数量 0 は画面と BIZ と DB の CHECK（`quantity > 0`）で拒む。在庫が 0 になった商品は既存の formatter で「0 個」「0 m」。在庫が負になった商品は stock_warnings で名指す（31 §12.6b の手順 8）。
- 失敗の時点と順序: DB を見ない検証（手順 0〜2）→ 冪等の再送（4）→ DB の検証（5）→ TX（6〜10）。TX の中の失敗（在庫の上限、DB の error）は TX 全体を戻す。画面は検証の失敗で入力を保持し、key を変えずに再試行できる（UI-16-D6）。
- 単位や種類の混在: 1 つの記録に個数と長さの明細が混ざる。数量は明細ごとにその商品の単位で持ち、足し合わせる表示（記録の数量の合計）を作らない。入出庫履歴の件数は明細の数で、単位を持たない。在庫変動履歴は商品ごとなので 1 つの単位。

## Contract Probe

N/A。振替は外部のライブラリ・OS・ハードの振舞いに依らない。SQLite の CHECK を作り直しで変える形は vZ（22 §20、`src-tauri/src/db/schema_v11.rs`）で実装・test 済みで、vT は同じ形の値の追加だけ。

## Data Safety

- 実の店の DB・POS の資料・商品の実値を commit しない。test と L3 の fixture は合成の商品コード（`L3-TR-*` ほか）と値だけ。
- L3 の DB は owner の PC の開発・試験 DB（repo の外）。L3 の商品 CSV は Coordinator が repo の外で渡す。
- 店の運用の細部と発言の原文は書かず、owner の決定は repo 外の回答台帳の ID で引く。

## 残りの危険（起票の時点）

- 版の番号: #172 より先に本 lane が merge すると版 12 を取り、#172 が 13 に取り直す（22 §21）。取り直しを忘れて 13 のまま main に欠けを作ると、後の 12 が当たらない DB ができる。merge の前の helper の確かめに無いので、Final Review の Review Focus に入れた。
- 誤った振替の戻し方: 取消が無いので、逆向きの振替で戻すと記録が 2 つ残り、同じ日付に計数のある商品は要再確認になる（過剰側）。
- 元と先の数の釣り合いを確かめないので、入力の誤り（3 m を 30 m）は在庫の誤りとして残り、次の計数で直る（ほかの入出庫と同じ）。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
