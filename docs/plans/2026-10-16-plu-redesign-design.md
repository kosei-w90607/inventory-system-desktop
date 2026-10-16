# Plan Packet: PLU の書出しの見直しの結果を設計正本へ置き換える

wave に属さない単独の lane（design lane、docs だけ。runtime は後続の lane）。設計の見直し（事実だけを集め、白紙の骨組みと今の設計を突き合わせ、owner が採否を決める）を PLU の書出しの領域で行い（repo 外の回答台帳 TD-258・TD-269）、owner が採否を決めた（TD-267・TD-273・TD-274・TD-277）結果を正本へ置き換える。棚卸しの時点証拠と POS の取込みの置換えの lane は本 lane の後（TD-275）。本 lane の branch は `agent/plu-redesign-design`（起点 main `18c6b591`）。

規模と手法（起票の最初に数え、file の数は最終の差分で数え直した）: 触る設計正本は 25 file（`git diff --name-only 18c6b591 HEAD -- docs ':(exclude)docs/plans'` の 29 file から decision-log・backlog・project-memory と生成物の `docs/function-design/90-traceability.md` を除いた数。function-design の 13、db-design の 2、architecture の 4、索引の `docs/DB_DESIGN.md`・`docs/FUNCTION_DESIGN.md`・`docs/SCREEN_DESIGN.md`、`docs/spec/` の 2、`docs/plu-export-and-real-csv-verification.md`）と decision-log・backlog・project-memory。画面 3（UI-08 PLU 書出し、UI-01a 商品一覧、UI-01b 商品フォーム。UI-07 は見た目を変えない）。migration 0（後続の runtime の lane が足す 1 本を plu-tables に設計した）。wire の型 0（後続の lane で変わる型は 7: `PluExportPrepareResponse`・`PluPreparedRowResponse`・`PluPreparedRowKind`・`PluRegisterSnapshotSummaryResponse`・`ProductSearchQuery`・`ProductWithRelations`・`ProductBulkFilter` / `BulkPluTargetResult`。command は 2 つ撤去）。横断の約束がかかる経路は 4 つ（占有の照合〈SD の読取り → BIZ-04〉、書出しの行の選び方〈Diff / Full〉、商品の状態の変化と枠〈BIZ-01 の修正・廃番・CSV 上書き〉、画面〈UI-08・UI-01a・UI-01b〉）。**1 lane のまま進める**。横断の約束（枠は JAN ごとに永続し、アプリは消さず・使い回さない）は、plu-tables の状態遷移の表と 33 §16.6 の表の 2 か所にまとめた（§16.6 は商品の側から、plu-tables は枠の側から同じ規則を引く）。分ける案（撤去と占有の自動化を別の lane にする）は採らない。理由: どちらも 33 §16.3 の照合の表と UI-08-D11 を書き換え、分けると 2 本が同じ表を取り合う。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（本 run の起草役）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3・design lane）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/plu-redesign-design

遷移の記録:

1. kickoff → spec-check（2026-10-16、起草役）: owner の決定（repo 外の回答台帳 TD-267・TD-273・TD-274・TD-277）と見直しの成果物（repo 外。事実の一覧・白紙の骨組み・突き合わせ）の置換えを Scope にし、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-16、起草役）: 触る正本（33 §16.3〜§16.9、plu-tables、25 §12、41 §17.6、67、30 §4、40、20、50、51、37 §37.9、45 §45.6a、23 §13.3.1、REQ-907）が、clear と解放・段階導入の道具・Z004 を選ぶ step・件数の要約を契約として持ち、前提の文の一部が事実と合わない。同じ commit で設計正本を更新した（下の Design Readiness）。
3. design → plan-draft（2026-10-16、起草役、同じ commit）: 条件「設計の出力が正本にある」は Design Readiness の引く正本と D-117 で満たす。条件「未解決の設計の問いが無い」は、owner の判断事項（D5〜D8・D10、TD-273・TD-274、CV17 の役目 TD-277）が決まり、D6・D9 を本 lane に入れない（backlog）と決まっていることで満たす。残る外部前提（Contract Probe の P1・P2）は runtime の lane の L3 で確かめるもので、設計の問いではない。plan-gate への遷移は Coordinator。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（TD-267・TD-273・TD-274・TD-277 は起票の前の見直しの採否で、本 lane の介入に数えない） | 2（Ready 1、merge 1） | 4 | 6 = 0 + 2 + 4 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Risk

Risk: R3

Reason:
PLU TSV（clear 行の撤去）、DB の表（`plu_slots` の status と UNIQUE）、Tauri command の DTO（撤去 2・縮小 5）、operator workflow（UI-08 の占有の読込みを締めの SD の読取りへ移す、商品一覧の一括操作の撤去）の契約を決める設計。本 lane は docs だけだが、後続の runtime が写す契約を決めるので R3。R4 ではない: データの破壊・実店舗データの露出・不可逆な操作は無い（設計は SD に書かず、後続の migration は `plu_slots` の status と index と app_settings の 1 key だけを変え、数量・在庫・売上・商品を変えない。本番の DB は無い）。この変更で required gate の green / red は変わらない: docs だけで、classifier は function-design と `docs/spec/requirements.md` の変更で traceability の検査（rust_drift）を回す。REQ-907 の文と担当の task を変えたので `docs/function-design/90-traceability.md` を再生成し、`cargo run --bin generate_traceability -- --check` は OK。撤去する pub fn の signature は設計に残したので、設計照合 test（`cargo test --test design_compliance_test`）は green のまま（下の AC10）。Scope の予定 path を `scripts/ci/classify-changes.sh` の workflow の一覧（`AGENTS.md`・`CLAUDE.md`・`docs/DEV_WORKFLOW.md`・`docs/ci.md`・`docs/AGENT_OPERATING_MANUAL.md`・`docs/code_review.md`・`docs/quality/review-checklist.md`・`docs/project-profile.md`・`docs/agent-guidance/*`・`docs/templates/*`・`.agents/*`・`.claude/{rules,commands,skills}/*`・PR template と、full に倒す `scripts/*`・`.github/*` の列）に当てて、当たる file は無い。Final Review Minimum 1。

## Goal

Goal Invariant:

### 最小完了条件

- 後続の runtime の lane の Writer が、チャットの履歴と repo 外の見直しの成果物を見ずに、source docs だけで次を実装できる: clear 行・`release_pending`・解放の trigger の撤去と `plu_slots` の migration（plu-tables）、売るのをやめた商品と JAN を変えた商品の枠の扱い（33 §16.6）、段階導入の道具の撤去（30 §4.9.1・40・20・50）、占有の毎日の自動の照合（33 §16.3、37 §37.9 手順 10、45 §45.6a 手順 2a）と UI-08 の FilePicker の step の撤去（67 UI-08-D11）、件数の要約・`over_limit_warning`・`row_kind`・`plu_memory_no` の撤去（41・67・51）。
- 割当て後・反映前のレジ側の変化（U-1）と、枠を持つ商品が PLU にできない側へ移ったとき（U-2）と、JAN の変更（U-3）が、撤去の後も今の規則で塞がり、規則の文が 33 §16.3・§16.4・§16.6 にある。
- 店の普段の操作（毎日の締めで SD を読む、PLU を変えるときにまとめて CV17 を開く）を増やさずに、書出しの前に占有が照合済みになる設計である（下の Ordinary Operation）。
- 前提の食い違い（突き合わせの F-1・F-3・F-4・F-6〜F-10）の文が事実に合い、D-011 の前提の訂正と、2 段を D-027 の理由で残すことが正本にある。
- D-117 が decision-log にあり、D-111 の段は変わっていない。D6（店内コード・色ごとの表）・D9（部門リンク）・runtime の lane が backlog にある。

### 失敗定義

- 正本のどこかに、アプリが枠を消す・解放する・別の JAN に使い回す live な契約（clear 行、`release_pending`、解放の trigger）が残る（撤去の注記・migration の手順・履歴は除く）。
- 一度も照合していない状態で書出しが空きを仮定して予約できる経路、または占有の照合に店主の別の操作が要る経路が残る。
- 撤去の後に、予約中の枠へのレジ側の変化・アプリの JAN の重複の観測・反映済みの枠の変化のどれかで、規則が無い（何をするか正本から読めない）。
- 店の毎日の操作が増える（締めの SD の読取りのほかに PLU のための読込みが要る）。
- 設計照合 test・traceability の検査を red にする変更を入れる。
- D-111 の段を書き換える。D6・D9 を本 lane で決める。
- 公開 repo に店の運用の細部・金額・商品名・JAN・部門名・発言の原文を書く。

### 非目的

- code・migration・bindings・test の変更（runtime の lane）。
- 2 段（書出し → 未反映から外す）と `plu_dirty`、Diff と Full を変えること（D1 = b の帰結。CV17 の経路の間は残す）。
- SD への書込み、レジの設定 file をアプリが作る経路。
- JAN の無い商品の店内コード・色ごとのバーコードの表（D6）、部門リンクの値と 21 個目の部門（D9）、JAN-8 を PLU に載せるか。
- 時点証拠 ADR・32・tracking-system-tables の clear 行の段（取込み側。棚卸しと POS の置換えの lane の入力）。
- 現行の実装を写す図（`docs/diagrams/current-system.md`・`docs/inventory_system_erd.html`）の更新（runtime の lane）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので、導入の日と普段の日の操作列を置く。本 lane は docs だけで、表の通常運用は後続の runtime（SD 直読みの runtime と、本 lane の runtime）の後に成り立つ。**この文書を完了できる**（設計正本がそろう）ことと、**通常運用を達成できる**（店で毎日の照合と書出しが動く）ことは別で、後者は本 lane では未達。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 導入の日。アプリの DB に照合の記録が無い。商品は登録済み（「レジにバーコード登録する」は商品ごとの欄と CSV の `PLU対象` 列で決めた） | PLU 書出しの画面を開く | 「レジの登録状況がまだ読まれていません。売上データ取込みでレジの SD を一度読んでください。」と導線。書出しは拒まれる（`register_snapshot_required`） | 締めで SD を読む | 33 §16.3 の gate |
| 同じ日の締め | 精算 → SD を PC に差す → 売上データ取込みで「SD から読む」 | 日報の候補が出る（今までどおり）。裏で窓の中の Z004 のうち精算回数が最大の 1 本でレジの占有を照合し、PLU 書出しの画面に最終照合日時が出る | 照合済み | P3・P4（37 §37.9 手順 10、45 §45.6a 手順 2a） |
| PLU を変える日（新商品・値段の変更が溜まった） | PLU 書出し → 「差分を書き出す」→ 保存 → CV17 で取り込み SD へ書く → レジで設定読込み → 代表の商品を呼ぶ → アプリで「この書出しを未反映から外す」 | 新しい JAN は空き枠を予約して書かれ、前からの JAN は同じ枠に書かれる。未反映が 0 になる | 次の締め | P1（Diff の部分取込みで他の枠が保たれる。PLU-21） |
| その次の締め | SD を読む | 照合で、書いた枠の `reserved` が `active` になる（コードと名称の反映が分かる）。単価などは分からない | — | D-117 (7) |
| CV17 の取込みに失敗した | 保存した file を入れ直す、または差分・全件を書き出し直す | 同じ memory No. で書ける。外すまで未反映は残る | 取込みの成功 | P2（PLU-25） |
| 商品を廃番にした・「レジにバーコード登録する」を外した | 商品フォームで保存 | 枠は残り、書出しに出なくなる。レジには前の登録が残り、そのバーコードで売れた分は次の Z004 に JAN の行で出て在庫が減る（値段は前の値段） | — | 33 §16.6、D-117 の Guarantee range |
| 商品の JAN を直した（CSV の上書き） | 取り込む | 未反映になり、次の差分で新しい JAN が別の枠に書かれる。前の JAN の枠は残り、その前のバーコードの売上はどの商品にもたどれず、取込みが未登録の JAN の行エラーで知らせる | 差分を書き出す | 33 §16.6、D-103 |
| 予約した後、レジに書く前に、レジ側でその枠に別のコードが入った | 次の締めで SD を読む | 照合で予約が外れる（`reservation_dropped`）。その JAN は次の書出しで別の空き枠を予約する | 差分を書き出す | 33 §16.3（D8 = a） |
| 古い SD を読んだ（2 枚を取り違えた） | SD を読む | 占有は古い精算の時点に戻る。次の締めで正しい SD を読むと最新に戻る | — | D-117 の Guarantee range |

## Scope

本 lane は docs だけ。下の file の、下の節を書き換えた（全部 plan-first の commit）。

1. clear と解放の撤去（D-117 (1)、突き合わせの O-1）: [33](../function-design/33-biz-plu-export-service.md) §16.2（status 4 値、`PluPreparedRowKind` と件数を外す）・§16.3（照合の表から `release_pending` を外し、重複の観測を `external` にする）・§16.4 step 4〜6（再対象化は sticky、Full は対象の JAN だけ、clear 行なし）・§16.5（clear 行の confirm と `PLU_CLEAR_ROW_ENABLED` を外し、2 段を残す理由）・§16.6（商品の状態の変化と枠の表。撤去する `release_plu_slot_for_jan` は signature だけ残す）・§16.8・§16.9（使い回さない不変条件）。[plu-tables](../db-design/plu-tables.md)（status の CHECK、`released_at` を外す、partial UNIQUE、runtime の migration の手順、状態遷移の表）。[25](../function-design/25-io-plu-formatter.md) §12.2・§12.3（`row_kind` と clear 行）。[30](../function-design/30-biz-product-service.md) §4.4 の 4b・廃番化・CSV の d.（解放しない、JAN の変更で `plu_dirty=1`）。[20](../function-design/20-io-product-repo.md)（`plu_memory_no` の `release_pending` の tie-break）。[22](../function-design/22-mnt-migration.md) §13 の注記。`docs/DB_DESIGN.md` D-2。architecture の biz・io・ui の task spec。残る論点（空き枠と商品の数の食い違い、JAN の変更）は D-117 の Revisit と 33 §16.6 に書いた。
2. 段階導入の道具の撤去（D-117 (2)、O-6）: [30](../function-design/30-biz-product-service.md) §4.9.1・[40](../function-design/40-cmd-product.md) の `bulk_set_plu_target`（signature だけ残す）、40 の `search_products` の `plu`、[20](../function-design/20-io-product-repo.md) の `PluMigrationFilter` と WHERE、`find_products_for_bulk_plu_target`（signature だけ残す）、[50](../function-design/50-ui-product-list.md) UI-01a-D10〜D12・URL の `plu`・文言・test の観点、architecture の cmd・ui の task spec。REQ-907 の文と担当の task（`docs/spec/requirements.md`・`docs/spec/requirements-coverage.md`、生成物 90-traceability の再生成）。2026-08-01 の段階導入の前提（`docs/project-memory.md`、`docs/plu-export-and-real-csv-verification.md` の「店舗運用から導いた公開設計前提」）を D-117 で置き換えたと書いた。
3. 占有の自動取得（D-117 (3)、O-4）: 33 §16.3 の入力の経路と `refresh_plu_register_snapshot_from_sd`、[37](../function-design/37-biz-daily-report-import-service.md) §37.9 の関数要求・snapshot の型・手順 4・手順 10、[45](../function-design/45-cmd-daily-report-import.md) §45.6a 手順 2a、[23](../function-design/23-io-z004-parser.md) §13.3.1 の入力、[41](../function-design/41-cmd-pos.md) の `import_plu_register_snapshot`（撤去。signature だけ残す）、[67](../function-design/67-ui-plu-export.md) UI-08-D11・§67.4 手順 3・§67.6・§67.8・§67.9・§67.10・§67.11・§67.12、`docs/SCREEN_DESIGN.md` の PLU 書出し画面、`docs/FUNCTION_DESIGN.md` の UI-08 の行、architecture の cmd・ui の task spec。依存: SD を直接読む runtime（D-111 の後続の lane）の後に入れる（D-117 (3)、backlog）。
4. 小さい過剰の撤去（D-117 (5)、O-5・O-7・O-8）: 33 §16.2 の summary、41 の `PluExportPrepareResponse`・`PluPreparedRowResponse`・`get_plu_slot_summary`、67 UI-08-D5・§67.8.1（復帰状態の `overLimitWarning`）、[51](../function-design/51-ui-product-form.md) UI-01b-D19、40 の `get_product`、20 の `ProductWithRelations`、architecture の cmd・ui の task spec。
5. 前提の食い違いの訂正（D-117 (7)）: F-1（D-011 の前提の訂正の行、67 §67.1・UI-08-D2、`docs/DB_DESIGN.md` D-2、master-tables の `plu_exported_at` の理由、project-memory、PLUV の参照と UI-08 着手時の判断 2）。F-3・F-4（25 の冒頭・試験の観点・手動の gate、67 UI-08-D3、PLUV の UI-08 readiness と 2026-07-06 の確定事項、project-memory の CV17 の profile）。F-6（PLUV の Z004 の構造、project-memory）。F-7（PLUV の PLU-05）。F-8（PLUV の結論・PLU-21・PLU-25）。F-9（51 UI-01b-D18 の理由）。F-10（PLUV の参照、project-memory）。F-2 は D6 と、F-5 は D9 と一緒に backlog。
6. U-1・U-2 の確かめ（D8 = a）: 撤去の後の規則を 33 §16.3（予約中の枠に別のコード、アプリの JAN の重複の観測、反映済みの枠の別コード・空）と §16.4 step 7（要修正中の既存の枠は維持して出さない）に書いた。U-1 の重複の観測は、`release_pending` の代わりに `external` で持つ（partial UNIQUE を `reserved` / `active` だけにして保存できるようにした）。U-2 は今の規則で塞がる（枠は残り出力しない。解放の trigger が無くなったので、JAN の誤りを直した商品は U-3 の扱いになる）。U-3 は JAN の変更で `plu_dirty=1` を足した（新しい JAN を書くため）。
7. D-117 を `docs/decision-log.md` に足した。D-072 に「Superseded in part by」の行、D-011 に前提の訂正の行を足した。D-111 の段は変えていない。
8. backlog（`docs/backlog.md`）: 「PLU の書出しの見直しの runtime」、「JAN の無い商品の店内コードと色ごとのバーコードの表」（D6、TD-279 の Q-083・Q-084 と残る実機の確かめ、JAN-8）、「PLU の部門リンクの値と 21 個目の部門」（D9、Q-055）を足し、SD 直読みの runtime に Z004 の読取りの申し送りを足した。古くなった項目（PLU表示 5 択、一括の対象化の文言、Z004 取込みでの占有の自動更新、段階移行の見分け方）に D-117 の帰結を書いた。

ついでに直したもの（同じ節の事実の誤り）: 25 §12.3 の出力例の `単品売り` が `はい` だった（IO-04-D5 と食い違う）ので `いいえ` にした。20 の `db::plu_slot_repo` の節が 2 度書かれていたので 1 つにした。

対象を使う呼出し側・隣接 test・helper / mock・生成物（runtime の lane が触る。本 lane は変えない）: `src-tauri/src/biz/plu_export_service.rs`（clear 行・解放・summary・`over_limit_warning`）、`src-tauri/src/constants.rs`（`PLU_CLEAR_ROW_ENABLED`）、`src-tauri/src/db/plu_slot_repo.rs`・`schema_v5.rs`（status・index）、`src-tauri/src/io/plu_formatter.rs`（clear 行）、`src-tauri/src/cmd/plu_export_cmd.rs`（`import_plu_register_snapshot`・DTO）、`src-tauri/src/biz/product_service.rs`・`cmd/product_cmd.rs`・`db/product_repo.rs`（`bulk_set_plu_target`・`find_products_for_bulk_plu_target`・`PluMigrationFilter`・`plu_memory_no`）、`src/features/plu-export/PluExportPage.tsx`（FilePicker の step・件数の要約・上限の警告・復帰状態）、`src/features/products/ProductListPage.tsx` と一覧の component（PLU 列・絞り込み・一括操作）、商品フォーム（レジメモリNo.）、`src/lib/invalidation-contract.ts` と D-052 の oracle（C17・C19）、`src/lib/bindings.ts`、各 test、`src-tauri/tests/design_compliance_test.rs`（撤去した pub fn の設計の signature を一緒に消す）。

## Non-scope

- code・migration・bindings・test（runtime の lane。backlog「PLU の書出しの見直しの runtime」）。
- D6（店内コードの発行と色ごとのバーコードの表、F-2）、D9（部門リンクの値と 21 個目の部門、F-5）、JAN-8 を PLU に載せるか（backlog）。
- 2 段・`plu_dirty`・Diff と Full（D-117 (6)）。
- 時点証拠 ADR・32・tracking-system-tables の clear 行の段（取込み側）、D-103 の段。
- D-111 の段、D-052 の Contract 行（runtime の lane が production SSOT と一緒に直す）、`docs/UI_TECH_STACK.md` §2.5 の件数。
- 現行の実装を写す図（`docs/diagrams/current-system.md` の PLU の節、`docs/inventory_system_erd.html` の `plu_slots`）、操作ログの種類の表（`74-ui-operation-logs.md` の `plu_register_snapshot_import`・`product_bulk_plu_target` は既存の log の表示に要る）、design-system の reference（owner の所感の原文と mockup）、research と archive。
- `docs/Plans.md`（lane の行を足さない。D-097）。

## Acceptance Criteria

数は開始 HEAD `18c6b591`（`git archive 18c6b591 docs` を展開した版）と起票後の版を同じ行数の数え方（その file の中で式に当たる行の数）で測った。

- AC1（clear と解放の撤去）: `rg -c "CHECK\(status IN \('free','external','reserved','active'\)\)" docs/db-design/plu-tables.md` が 1（開始 0）。`rg -c 'release_pending'` が 33 で 1（冒頭の runtime の状態の注記。開始 14）、plu-tables で 2（冒頭の注記と migration の手順 2。開始 14）、67・30・20・architecture の biz と ui の task spec で 0（開始 5・1・1・4・1）。`rg -c 'row_kind' docs/function-design/25-io-plu-formatter.md` が 0（開始 2）。
- AC2（段階導入の道具の撤去）: `rg -c '^\| \`plu\` \|' docs/function-design/50-ui-product-list.md` が 0（開始 1）。`rg -n 'bulk onboarding' docs/spec/requirements.md` の hit は 48 行目の「D-117 で…外した」の注記だけ（開始は REQ-907 の行の 1）。REQ-907 の行が「毎日の SD の読取りで照合し、JAN ごとの永続割当」を持つ。
- AC3（占有の自動取得）: `rg -c 'fn refresh_plu_register_snapshot_from_sd' docs/function-design/33-biz-plu-export-service.md` が 1、`rg -c 'plu_register_z004s' docs/function-design/37-biz-daily-report-import-service.md` が 2、`rg -c 'refresh_plu_register_snapshot_from_sd' docs/function-design/45-cmd-daily-report-import.md` が 1（開始はどれも 0）。`rg -c 'Z004を選んで' docs/function-design/67-ui-plu-export.md` が 0（開始 1）。33 §16.3 に gate（`register_snapshot_required`）がある。
- AC4（小さい過剰の撤去）: `rg -c 'over_limit_warning: bool' docs/function-design/41-cmd-pos.md`・`rg -c '"overLimitWarning": false' docs/function-design/67-ui-plu-export.md`・`rg -c 'free_count' docs/function-design/33-biz-plu-export-service.md`・`rg -c 'として読取り専用表示する' docs/function-design/51-ui-product-form.md`・`rg -c 'row_kind: PluPreparedRowKind' docs/function-design/41-cmd-pos.md` がどれも 0（開始はどれも 1）。
- AC5（前提の訂正）: `rg -c '配分変更の設定は取説に見当たらない' docs/function-design/25-io-plu-formatter.md`・`rg -c '通常PLUの件数 \+ 1' docs/function-design/25-io-plu-formatter.md`・`rg -c '通常PLU使用数 \+ 1' docs/function-design/67-ui-plu-export.md`・`rg -c '既存別商材 10件' docs/plu-export-and-real-csv-verification.md` がどれも 0（開始はどれも 1）。`rg -c '^- 前提の訂正（2026-10-16、D-117 \(7\)）' docs/decision-log.md` が 1（開始 0）。
- AC6（U-1・U-2・U-3 の規則）: `rg -c 'duplicate_on_register' docs/function-design/33-biz-plu-export-service.md` が 1 以上（開始 0）。33 §16.3 の表が「別コード × reserved」「別コード × active」「空 × active」「occupied × free（アプリの JAN の重複）」の 4 行を持ち、§16.4 step 7 と §16.6 の表（対象外化・再対象化・JAN の変更の 3 行）がある。
- AC7（決定の記録）: `rg -c '^## D-117: ' docs/decision-log.md` が 1（開始 0）で、Decision (1)〜(7)・Alternatives・Guarantee range・Compatibility・owner の決定・Revisit を持つ。D-111 の段が変わっていない: `diff <(awk '/^## D-111/,/^## D-113/' "$TMPDIR/old/docs/decision-log.md") <(awk '/^## D-111/,/^## D-113/' docs/decision-log.md)` の出力が空。
- AC8（backlog）: `rg -c '^- \*\*PLU の書出しの見直しの runtime\*\*' docs/backlog.md`・`rg -c '^- \*\*JAN の無い商品の店内コードと色ごとのバーコードの表\*\*' docs/backlog.md`・`rg -c '^- \*\*PLU の部門リンクの値と 21 個目の部門\*\*' docs/backlog.md` がどれも 1（開始はどれも 0）。
- AC9（docs だけ）: `git diff --name-only 18c6b591 HEAD -- src src-tauri scripts package.json package-lock.json` の出力が空。
- AC10（検査）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0・WARN 0。`cd src-tauri && cargo run --bin generate_traceability -- --check` が OK（ERROR 0・WARN 0）。`cd src-tauri && cargo test --test design_compliance_test` が pass（撤去する pub fn の signature を設計に残したので、code の pub fn が設計に無い UNEXPECTED は 0）。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。

- 引用する設計正本（節まで）: 33 §16.2〜§16.9（BIZ-04-D3〜D7）／`docs/db-design/plu-tables.md` の「カラム定義」「migration（D-117、runtime の lane）」「状態遷移」「app_settings の PLU スナップショットキー」／25 §12.2・§12.3（IO-04-D2・D4、D3 の撤去）／41 §17.6（CMD-08-D3〜D5）／67 §67.1・§67.4・§67.5（UI-08-D1〜D3・D5・D9・D11）・§67.8〜§67.12／30 §4.4 の 4b・§4.6・§4.8 の d.・§4.9.1（BIZ-01-D3・D4）／40 の `search_products`・`get_product`・`bulk_set_plu_target`（CMD-01-D3・D4）／20 の `search_products`・`plu_slot_repo`（IO-01-D4）／50 UI-01a-D10〜D12／51 UI-01b-D18・D19／37 §37.9（BIZ-08 の SD の読取り）／45 §45.6a（CMD-12-D1）／23 §13.3.1（IO-02-D1）／D-011・D-027・D-028・D-072・D-111・D-117。
- 必要な設計成果物（Design artifact selection の当たる行）: BIZ・IO・CMD の振舞い = updated in this PR（33・25・30・20・37・45・23）／command・DTO = updated in this PR（41・40。wire の変更は runtime の lane、下の Boundary / Wire Contract）／表・migration = updated in this PR（plu-tables、DB_DESIGN、22 の注記。migration の番号と実装は runtime）／operator workflow・文言 = updated in this PR（67・50・51・SCREEN_DESIGN）／PLU TSV の形 = updated in this PR（25 の clear 行の撤去）／durable な判断 = updated in this PR（D-117、D-011・D-072 の注記）。
- plan にしかない durable な判断の昇格先: 決めたことは全て正本と D-117 に置いた。packet にだけあるのは、規模と手法の数え、runtime の lane への file の申し送り（Scope の末尾）と AC の数。
- 前提・制約と、延期した design gap の follow-up: 占有の自動の照合は SD 直読みの runtime に依る（D-117 (3)。それより前に入れない）。外部前提 P1（Diff の部分取込みで他の枠が保たれる）・P2（取込みの失敗からの回復）は runtime の lane の L3 で記録を取る（PLU-21・PLU-25）。延期: D6・D9・JAN-8（backlog）、時点証拠 ADR と 32 の clear 行の段（棚卸しと POS の置換えの lane）、現行の図（runtime の lane）、D-052 の Contract 行と UI_TECH_STACK §2.5（runtime の lane が production SSOT と一緒に）。延期が安全な理由: どれも今の code の振舞いを変えず、本 lane の決定と矛盾しない（ADR の clear 行の段はレジで手で消す経路で今も成り立つ）。
- 絶対保証（cannot happen / always happens）の例外と escape hatch の自己点検: 「アプリは枠を消さない・使い回さない」の例外は 2 つで、33 §16.9 に書いた（レジ側の観測による `reservation_dropped`、レジで空になった `external` が `free` に戻る）。「書出しの前に占有が照合済み」の例外は、古い SD を読んだときの古い占有と、精算回数がレジの初期化で戻ったとき（D-117 の Guarantee range と Revisit）で、どちらも照合の規則（予約中の枠の別コードで予約を外す）が次の照合で戻す。「黙って在庫を誤らない」の例外は無い: 売るのをやめた商品と前の JAN の売上は JAN の行で出て、商品にたどれなければ D-103 の行エラーになる（値段のずれは在庫を誤らないが残る。D-117 の Guarantee range）。
- 判定（ready / not ready）と理由: ready（plan-draft に進める）。理由: 設計の出力が上の正本と D-117 にあり、owner の判断事項は TD-267・TD-273・TD-274・TD-277 で決まり、残る外部前提は runtime の L3 で確かめるもので設計の問いではない。

## Registration / Generation Obligations

本 lane: REQ-907 の文と担当の task を変えたので、`cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成した（生成物。手で書いていない）。function-design の file の新設・改名・削除は無い。runtime の lane の義務: 撤去する command（`import_plu_register_snapshot`・`bulk_set_plu_target`）の specta の登録を外し、`cargo run --bin generate_bindings` で `src/lib/bindings.ts` を再生成する。撤去した pub fn の signature を設計（33 §16.6、41、30 §4.9.1、40、20）から消す（`src-tauri/tests/design_compliance_test.rs` の突合せ）。migration を足すときは `docs/function-design/22-mnt-migration.md` と migration の registry に登録する。D-052 の C17・C19 を production SSOT（`src/lib/invalidation-contract.ts`）・独立 oracle・UI_TECH_STACK と同じ PR で直す。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 当たる。枠の永続・使い回さない・照合の gate は core（BIZ-04）、SD の列挙と Z004 の形は adapter（IO-09・IO-02）。占有の source を「締めの SD の読取り」に移しても、BIZ-04 は bytes を受けるだけで媒体に依らない | D-117、33 §16.3 |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 当たる。訂正した前提（F-1・F-3〜F-10）は観測・回答・取説を出典にし、確かめていないもの（PLU-21・PLU-25、2026-07-06 の backup の中身）は未確認と書いた。CV17 について確かめていない推定は「未確認の前提」として扱い、根拠に使っていない | D-117 (7)、PLUV、Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 当たる。照合の失敗は前回の照合を保ち scan を失敗にしない、同じ Z004 の照合は同じ結果、prepare / confirm の再試行と保存のキャンセルは今のまま | 33 §16.3・§16.8、Matrix |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 当たる。PLU のための別の読込みが無くなり、締めの SD の読取りで足りる。CV17 は PLU を変えるときにまとめて開く | Ordinary Operation、67 |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 当たる。レジが変われば IO-09・IO-02・IO-04 と 37 の Z004 の読取りを替え、BIZ-04 の枠の規則は残る。CV17 を開かない反映の経路が成り立てば、2 段と Diff / Full を見直す（D-117 の Revisit） | D-117 |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 当たる。tracked には件数（空き 3,851、既存 933 など既に正本にある数）と事実の要旨だけを書き、商品名・JAN・金額・部門名・発言の原文を書いていない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 当たる。枠の状態は売上・在庫・会計の集計に入れない（SPEC-PLS-D8、変えない）。占有の照合は資料の受領を作らない（33 §16.3） | plu-tables の集計境界 |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 当たる（runtime）。Diff の部分取込みで他の枠が保たれる（PLU-21）、取込みの失敗からの回復（PLU-25）、clear 行の無い file の CV17 の受理、締めの SD の読取りの後の最終照合日時。本 lane は docs だけで L3 は無い | Matrix の Manual、backlog の runtime の項目 |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 不該当。環境依存を足さない | — |

## Boundary / Wire Contract

本 lane は wire を変えない（bindings も変えない）。後続の runtime の lane が変える wire の契約を正本に書いた。

- producer: CMD-08（`prepare_plu_export`・`get_plu_slot_summary`）、CMD-01（`search_products`・`get_product`）、CMD-12（`scan_register_sd`。wire は変えない）
- consumer: UI-08、UI-01a、UI-01b、UI-00（`listPluDirty`、変えない）
- wire type: `PluExportPrepareResponse` から `over_limit_warning` を外す。`PluPreparedRowResponse` から `row_kind` を外し、`PluPreparedRowKind` の enum を消す。`PluRegisterSnapshotSummaryResponse` は `snapshot_at` だけ（件数の field を外す）。`ProductSearchQuery` から `plu` を外し `PluMigrationFilter` を消す。`ProductWithRelations` から `plu_memory_no` を外す。`import_plu_register_snapshot` と `bulk_set_plu_target` の command と `ProductBulkFilter` / `BulkPluTargetResult` を消す。`confirm_plu_export_saved` の入力の `prepared_rows` は `memory_no` と `target_product_codes` だけ
- internal type: `PluSlotStatus` は 4 値。BIZ-08 の `DailyReportSdScanSnapshot.plu_register_z004s: Vec<Vec<u8>>`（wire に出さない）
- precision/range: memory No. は 217〜5000（変えない）
- round-trip path: 締めの SD の読取り → BIZ-08 が Z004 の bytes を snapshot に入れる → CMD-12 が BIZ-04 で照合（`plu_register_snapshot_at` を書く）→ UI-08 が `get_plu_slot_summary` の `snapshot_at` を出す → prepare（gate）→ confirm（exact な memory No.）
- invalid input: 精算回数の読めない Z004 は照合に使わない。最大の精算回数の bytes が 2 本以上で違えば照合しない。照合の失敗は scan を失敗にしない。復帰状態の JSON の旧形（`overLimitWarning` を持つ）は schema 不一致として消す
- compatibility: 本番の DB は無い。開発・試験・owner の PC の DB は runtime の migration で `release_pending` を `external` にする（plu-tables）。旧い UI と新しい backend の混在は無い（1 つの build）。旧形の復帰状態は消える（memory No. は永続なので、書き出し直せば同じ番号）

## Test Plan

Test Design Matrix: [2026-10-16-plu-redesign-design](test-matrices/2026-10-16-plu-redesign-design.md)（runtime の lane が実装する test の設計。本 lane は docs の検査だけ）。

- targeted tests: 本 lane は `bash scripts/doc-consistency-check.sh` と `--target plan`、`cargo run --bin generate_traceability -- --check`、`cargo test --test design_compliance_test`（AC10）。
- negative tests: Matrix の Negative Paths（runtime）。
- compatibility checks: Matrix の Compatibility Checks（migration の `release_pending` → `external`、復帰状態の旧形）。
- data safety checks: 本 lane の差分に実データ（JAN・商品名・金額・部門名・発言の原文）を入れない。
- main wiring/integration checks: runtime の lane（SD の読取りから照合までの配線、UI-08 の gate）。

## Review Focus

- Ordinary Operation の列が、正常な条件で目的（店の操作を増やさずに書出しの前に占有が照合済みで、PLU を変えるときにまとめて 1 回で反映できる）を達成できるか。導入の日の gate、照合の失敗、古い SD の列で、空きを仮定して予約する経路が無いか。
- 撤去の後の照合の表（33 §16.3）が、全ての（レジの観測 × 今の status）の組に結果を持つか。`external` の重複を許した partial UNIQUE で、prepare の external の採用（step 5）と照合の採用が 1 つに決まるか。
- 「アプリは枠を消さず使い回さない」の例外が §16.9 の 2 つだけか。売るのをやめた商品・JAN を変えた商品・再対象化の扱いが 33 §16.6・plu-tables・30 で同じか。
- 撤去した live な契約が正本に残っていないか（AC1〜AC4 と、Matrix の sweep の残りの理由）。撤去の注記と signature を残した所が、runtime の lane の手順として 1 通りに読めるか。
- 訂正した前提の文が、出典（事実の一覧の ID、取説、owner の回答）で裏づくか。確かめていないものを確かめたように書いていないか。
- D-111・D-027・D-028・D-103 と矛盾しないか。D-052 の C17・C19 を runtime の lane へ送った書き方で足りるか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| SPEC-PLS-D1（`plu_slots` の表と結合。status 4 値、partial UNIQUE、`released_at` を外す、migration） | plu-tables、22 §13 の注記、DB_DESIGN | runtime: migration、`db/plu_slot_repo.rs` | runtime（Matrix の D1 の行） | 非対象 |
| SPEC-PLS-D2 / BIZ-04-D3（占有の照合の表、入力の経路、gate、summary） | 33 §16.3、plu-tables の app_settings | runtime: `biz/plu_export_service.rs`、CMD-12 の配線 | runtime（Matrix の D2 の行） | L3: 締めの SD の読取りの後の最終照合日時 |
| SPEC-PLS-D3 / BIZ-04-D4（prepare の step 4〜8） | 33 §16.4 | runtime | runtime（Matrix の D3 の行） | 非対象 |
| SPEC-PLS-D4 / BIZ-04-D5・D6（confirm、商品の状態の変化と枠） | 33 §16.5・§16.6、30 §4.4 の 4b・§4.6・§4.8 の d. | runtime: `biz/plu_export_service.rs`、`biz/product_service.rs` | runtime（Matrix の D4 の行） | 非対象 |
| SPEC-PLS-D5 / IO-04-D2・D4（Diff / Full の行、clear 行の撤去〈IO-04-D3〉） | 33 §16.4 step 6、25 §12.2・§12.3 | runtime: `io/plu_formatter.rs` | runtime（golden の更新） | L3: clear 行の無い file の CV17 の受理、PLU-21 |
| SPEC-PLS-D6 / BIZ-01-D4 / CMD-01-D4（一括の対象化の撤去。CSV の `PLU対象` 列〈IO-03-D1・UI-01c-D16〉は残す） | 30 §4.9.1、40、20、50 UI-01a-D11・D12 | runtime | runtime（撤去の test、CSV の既存の test を保つ） | 非対象 |
| SPEC-PLS-D7（memory No. と移行状態の表示の撤去） | 50 UI-01a-D10、51 UI-01b-D19、40 CMD-01-D3、20 IO-01-D4 | runtime | runtime | human visual confirmation（一覧と商品フォーム） |
| SPEC-PLS-D8 / BIZ-04-D7（集計境界） | plu-tables の集計境界、33 §16.9 | 変えない | 既存 | 非対象 |
| UI-08-D1・D2・D3・D5・D9・D11（2 段、文言、開始番号、上限の警告の撤去、占有の画面） | 67 §67.5 | runtime: `PluExportPage.tsx` | runtime（Matrix の UI-08 の行） | L3: UI-08 の operator flow（D-073） |
| UI-08-D7（復帰状態の形） | 67 §67.8.1 | runtime | runtime | 非対象 |
| CMD-08-D3〜D5（DTO の縮小、`import_plu_register_snapshot` の撤去） | 41 §17.6 | runtime: `cmd/plu_export_cmd.rs`、bindings | runtime | 非対象 |
| BIZ-08 §37.9 手順 4・10、CMD-12 §45.6a 手順 2a、IO-02-D1 の入力 | 37、45、23 §13.3.1 | runtime（SD 直読みの runtime の後） | runtime（Matrix の D2 の配線の行） | L3: SD の読取り |
| UI-01b-D18 の理由（JAN-8 の前提の訂正） | 51 | 変えない（振舞いは今のまま） | 既存 | 非対象 |
| REQ-907 の文と担当 | `docs/spec/requirements.md`、requirements-coverage、90-traceability（生成） | 本 lane | AC10 の traceability の検査 | 非対象 |
| D-117、D-011 の前提の訂正、D-072 の Superseded in part | decision-log | 本 lane の記録 | AC5・AC7 | 非対象 |
| 前提の訂正（F-1・F-3・F-4・F-6〜F-10） | 25、67、DB_DESIGN、master-tables、project-memory、PLUV | 本 lane | AC5 | 非対象 |
| 隣接の除外: D-027 の 2 段、D-028 の三分バケット・dedup・要修正（UI-08-D8・D10、`PluExcludedReason`）、UI-08-D4・D6・D10、`list_plu_dirty`、UI-00 の通知バー | 33 §16.4 step 2・3・7、§16.6.1、67、53 | 変えない | 既存 | 非対象 |
| 隣接の除外: D-111（IO-09-D1〜D4、BIZ-08-D3〜D6、CMD-12-D1 の決定）、SPEC-STOP-D1〜D6、SPEC-STK-TIME の clear 行の段、D-103（SPEC-Z4A-D8）、D-052 の Contract 行 | decision-log、停止 ADR、時点証拠 ADR、32、23 | 変えない（参照だけ。D-052 は runtime の lane） | 非対象 | 非対象 |

## Contract Probe

本 run は実機・持ち帰りデータの新しい集計を行っていない。前提ごとに、出典（repo 外の事実の一覧の ID、tracked の記録）を確かめた結果を書く。

- P1（Diff の部分取込みで、file に無い枠はレジで保たれる）: tracked の記録は PLUV の PLU-21「後続実装 L3」で、owner は全段を通したと答えた（事実の一覧 F-132）が build と段の記録が無い。取説は「記載した枠だけを書く」（事実の一覧 P-013）。→ 未確認。runtime の lane の L3 で記録を取る。崩れたら Full だけにする（D-117 の Revisit の 2,000 行の項目と一緒に見直す）。
- P2（CV17 の取込みに失敗した後、保存した file か書出し直しで回復できる）: PLU-25「後続実装 L3」、取説は中止までの行が残る（F-135）。→ 未確認。runtime の lane の L3。
- P3（精算ごとの Z004 に 5,000 枠のコードと名称が出る）: 持ち帰った Z004 143 本の集計で確かめた（F-121）。→ 観測。
- P4（Z004 の精算回数がメタ行から読め、精算ごとに進む）: Z004 のメタ 6 行に精算回数がある（PLUV の 2026-07-06 の確定事項、23 の SettlementMetadata）。精算回数が日報と組で進むことは `docs/backlog.md` の時点証拠の項目の入力 1（2026-07〜09 の 103 組）。→ 観測。初期化で戻ることは未観測（D-117 の Revisit）。
- P5（SD の `XZ` と `XZ_BKUP` に Z004 がある）: 29 §29.7.2 の SD-04（系列に Z004 がある）。→ 観測。
- P6（レジの学習〈未登録のバーコードのその場の登録〉を店は使っていない）: owner 回答（F-136）。→ 回答。使い始めたら Revisit。
- P7（取説にレジで枠を消す操作が無い）: 取説の全文検索で不在（F-129）。→ 取説。clear を持たない理由の 1 つ（D-117 の Why）。

## Data Safety

- tracked に書かない: 実 SD・EJ・Z 帳票・PLU の file の中身、実 JAN・商品名・部門名・金額、店主・owner の発言の原文、repo 外の見直しの成果物の本文。書いた数は、既に正本にある数（空き 3,851・既存 933、通常 PLU の 216 と試しの 2 枠、Z004 143 本）と、精算の組の 103 組（backlog の既存の入力）だけ。
- local-only: repo 外の回答台帳・見直しの成果物（事実の一覧・白紙の骨組み・突き合わせ）・持ち帰りデータ。
- synthetic-only: runtime の lane の test は合成の Z004 の bytes と合成の DB だけを使う。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
