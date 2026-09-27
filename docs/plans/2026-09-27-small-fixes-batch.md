# Plan Packet: backlog の小口の修正をまとめる（wave 14 lane E）

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

実装後の状態はPR native state / 専用record / CIが所有し、trackedに書かない。

- Phase: plan-gate
- Risk: R2
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（worktree と branch を書く）
- Plan Reviewer: Opus 5.5（fresh subagent、Writer と別 context）+ Codex（GPT-5.6 Sol か GPT-6 Astra、owner が起動時に指定）
- Final Reviewer: Codex（GPT-5.6 Sol か GPT-6 Astra、owner が起動時に指定）
- Final Review Minimum: 1
- Human Gate: ready,merge,manual

遷移記録（append-only）:

- kickoff → spec-check → plan-draft → plan-gate（本 commit、plan-first、2026-09-27、起草役）: owner の起票承認 2026-09-27「B 色と強調 + E 小口」と wave 14 の方針（owner 2026-09-27「Issue の範囲を避けて片っ端から並列で」）を受け、`docs/backlog.md` の小口 4 群を現物で確かめて Scope S1〜S8 を確定した。lane 全体を R3 以上へ押し上げる ⑰-1（操作ログ `detail_json` の非価格 field）と、restore の表示契約・wire を変える follow-up (2)（新しすぎる backup の文言）は Non-scope へ移した。spec-check → plan-draft は Design Readiness が既存の正本で足りることを示すため design を飛ばす（根拠は同節）。
- Plan Review round 1（2026-09-27、Coordinator の裁定 r1）: fresh Opus 5.5 と Codex（GPT-6 Astra）の両 reviewer とも reject。Risk・Non-scope の判断は両者とも妥当とし、指摘 E1-1〜E1-10 をすべて accept して plan-gate のまま是正した（本 commit）。

## Owner Effort Budget

- 介入回数上限: 4（既定 3 から +1。manual を Human Gate に持つため、起票承認・manual の PASS / FAIL・Ready・merge の 4 decision point を見込む）。消費 1 = owner の起票承認 2026-09-27「B 色と強調 + E 小口」
- 実働時間上限: 30分（manual の目視 5 画面 + PLU 画面の日時 2 箇所）
- relay 往復上限: 2（Plan Review の Codex 1、Final Review の Codex 1）。消費 1（Plan Review round 1 の Codex）。見込み: 上限 2 は round 2 と Final Review で使い切る見込みで、closure が要れば超える。超える場合は Coordinator が owner に諮る（改定値はここでは決めない）
- Plan Review round 天井: 3

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
Scope に残した 8 件は、コメントの訂正（S1）、非公開 helper の引数型の限定（S2）、表示 helper の置き場の移動（S3）、表示書式と幅の統一（S4・S5）、実装どおりの挙動へ正本の外れた行を合わせる文書訂正（S6・S7）、生成物の再生成（S8）である。DB schema・migration・Tauri command の DTO・生成 bindings・CSV / TSV の形式・route / search state・merge gate はどれも変えない。S4 の localStorage（`savedAt`）は読むだけで、保存する形を変えない。S6・S7 は同じ文書の他の節と実装がすでに持つ挙動を正とし、挙動は変えない。R2 と R3 で迷う候補（⑰-1 の永続 JSON の形、follow-up (2) の restore の error kind）は Non-scope へ移したため、残りは R2 の「UI helper、docs の保守性の変更で runtime 契約を変えない」に当たる。classifier で workflow=true になる path（`docs/DEV_WORKFLOW.md`・`docs/templates/*` 等）を編集しないため Final Review Minimum は 1。

## Goal

Goal Invariant:

### 最小完了条件

- 部門の絞り込み欄の幅が、商品一覧・一括価格改定・在庫照会・日次売上・棚卸し・入出庫履歴で同じ 11rem になる（共有部品を使う 5 site は部品が幅を 1 つだけ持ち、部品を使わない入出庫履歴の欄は既に `w-44` = 11rem）。
- PLU書出し画面の「最終読込み日時」「保存日時」が、他の画面と同じ `YYYY-MM-DD HH:mm:ss`（ローカル時刻）で出る。
- 正本の食い違い 2 行（CSV 取込みの commit 失敗時の表示、PLU slot の `activated_at` の意味）が、実装と同じ文書の他の節に合う 1 つの説明になる。
- 保守者向けの 3 件（`migrate` のコメントの手順番号、`generate_custom_code` を借りた transaction に型で限る、`formatDateTime` を `src/lib/` に置く）が済み、既存の挙動と test が変わらずに通る。

### 失敗定義

- 画面の挙動（CSV 取込みの失敗からの戻り方、PLU の予約・確定、部門の絞り込みの結果）が変わる。
- 日時の表示が時差分ずれる、秒が落ちる、不正な値で空白になる（現行は不正な値をそのまま出す）。
- 既存 test を消す・弱めることで緑にする（置き換える test は同じ契約を同じ強さで確かめる）。
- Non-scope の候補（⑰-1、follow-up (2)、旧 04 の (b)〜(e)、DOC-2 の `system_stock` の行）に手を広げる。

### 非目的

- 操作ログの詳細に商品修正の変更前後を増やすこと（⑰-1）。
- 復元の失敗文言を原因ごとに分けること（follow-up (2)）。
- 日時の書式の共通規則を新しく design-system に起こすこと（既存の `formatDateTime` の書式に揃えるだけ）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

not applicable: 操作・data / command 契約・業務の状態遷移を決める／変える項目を含まない。S4・S5 は表示の書式と幅だけで操作列は変わらない。S6・S7 は正本の外れた行を、同じ文書の他の節（55 §55.8 の遷移図・遷移表・処理手順 20、plu-tables の状態遷移表）と実装がすでに持つ挙動へ合わせる訂正で、operator の操作列（commit 失敗 → エラー表示 → 「プレビューに戻る」→ 再実行、PLU の保存 → 保存済み確認）は現行のままである。workflow の変更も含まない。

## Scope

起草時の実測（2026-09-27、`e7c22f8f`）に基づく。行番号は起草時の値で、Writer は編集前に同じ command で現在地を取り直す。

- **S1 `migrate` の doc comment の手順番号**（backlog「保存と起動の守りの follow-up」(1)）: `src-tauri/src/db/migration.rs` の `migrate` の doc comment（起草時 156〜159 行、`0.`〜`2.`）と本体の手順コメント（`// 0.`・`// 1.`・`// 2.`）を、`docs/function-design/22-mnt-migration.md` §3.2 の処理ステップの番号（1〜6）に合わせる。doc comment は §3.2 の 1〜6 を要約して並べ、本体は版の読取りと比較に `1〜2.`、表の確保に `3.`、未適用の実行に `4〜5.` を付ける。コードの動作は変えない。
- **S2 `generate_custom_code` を借りた transaction に型で限る**（同 (3)）: `src-tauri/src/biz/product_service.rs` の `generate_custom_code`（起草時 154 行）の第 1 引数を `&DbConnection` から `&rusqlite::Transaction<'_>` にする（`apply_stock_change` と同じ形、31 §12.2）。呼び出し元は `create_product` の `&tx` と既存 test の `&tx` だけ（`rg -n 'generate_custom_code\(' src-tauri/src` で確認）で、呼出しの書き換えは要らない見込み。同じ file の test module に関数 pointer の型で固定する test（Test Plan の T-S2）を足す。正本 `docs/function-design/30-biz-product-service.md` §4.3 のシグネチャと注記を新しい型へ直し、§4.2 の「実装時の差分」の文言と矛盾しないことを確かめる。
- **S3 `formatDateTime` を `src/lib/` へ移す**（⑰-2）: `src/features/inventory-records/types.ts` の `formatDateTime`（起草時 104〜107 行）を新 file `src/lib/date-time.ts` へ移し（関数本体とコメントはそのまま）、`types.ts` からは削除する（re-export を残さない）。import 元を直す file = feature の外 8 file（`AdditionalImportConfirmDialog.tsx`・`DisposalPage.tsx`・`IntegrityCheckPage.tsx`・`ManualSalePage.tsx`・`OperationLogsPage.tsx`・`PriceHistorySection.tsx`・`ReceivingPage.tsx`・`ReturnExchangePage.tsx`）と `inventory-records` 内の 7 file（`CsvImportRecordDetailPage.tsx`・`DisposalRecordDetailPage.tsx`・`InventoryRecordsPage.tsx`・`ManualSaleRecordDetailPage.tsx`・`ReceivingRecordDetailPage.tsx`・`ReturnRecordDetailPage.tsx`・`StocktakeRecordDetailPage.tsx`）。共有 helper の import を source で固定する既存 test 7 本（「⑰ SC6 / UIDISP-D6」、`DisposalPage.test.tsx`・`ReceivingPage.test.tsx`・`PriceHistorySection.test.tsx`・`PreviewStep.test.tsx`・`OperationLogsPage.test.tsx`・`ReturnExchangePage.test.tsx`・`IntegrityCheckPage.test.tsx`）の正規表現の import 元を `@/lib/date-time` へ直す（ローカル定義を禁じる側の assertion は残す）。単体 test `src/lib/date-time.test.ts` を足す。正本 `docs/function-design/74-ui-operation-logs.md` §74.7 の「既存 `inventory-records/types.ts` の `formatDateTime` を再利用する」を新しい置き場へ直す。
- **S4 PLU書出しの日時書式を揃える**（⑰-3）: `src/features/plu-export/PluExportPage.tsx` の 2 箇所を `YYYY-MM-DD HH:mm:ss`（ローカル時刻、秒まで）にする。(a) 「最終読込み日時」（起草時 381 行）の `snapshot_at` は DB の `YYYY-MM-DDTHH:MM:SS`（ローカル、時差なし）なので、S3 の共有 `formatDateTime` を使う（`Date` に通さない）。(b) 「保存日時」（起草時 463 行）の `savedAt` は `new Date().toISOString()`（UTC、起草時 148 行）なので、`formatPendingSavedAt` を「`Date` で解釈し、ローカルの年月日時分秒を 0 埋めで `YYYY-MM-DD HH:mm:ss` に並べる。解釈できなければ入力をそのまま返す」へ直す（`toLocaleString("ja-JP", …)` をやめる）。localStorage に保存する `savedAt` の形は変えない。どちらも文中の表示のため `font-mono tabular-nums` は付けない（⑰ UIDISP-D6 の `IntegrityCheckPage` と同じ扱い）。正本 `docs/function-design/67-ui-plu-export.md` の処理ステップ 3（最終読込み日時）と 8（保存済み未確認の復帰）の近くに、日時の表示書式を 1 文で書く。
- **S5 部門 select の幅を全画面で同一にする**（旧 04 の (a)）: `src/components/patterns/DepartmentFilter.tsx` の `widthClass` prop を削除し、`SelectTrigger` の幅を `w-[11rem]` に固定する。呼び出し 4 箇所（`DailySalesPage.tsx`・`ProductListPage.tsx`・`PriceRevisionFilters.tsx`・`StockInquiryPage.tsx`）から `widthClass` 属性を外す（`StocktakePage.tsx` は既定値を使っており変更なし）。11rem を採る理由: 部門 master の初期データで最も長い名前「ビューティ関連」（7 文字、`src-tauri/src/db/schema_v1.rs` の `INSERT INTO departments`）と「すべての部門」（6 文字）を、trigger の `text-sm`（14px、`src/components/ui/select.tsx` の `SelectTrigger`）の字幅と trigger の左右 padding・chevron を足しても切らずに収めるため（字幅からの見積もりで未実測。manual の L3-1 で確かめる）。test は、部品の test（`src/components/patterns/DepartmentFilter.test.tsx` の DF-4 を 11rem の固定へ、prop の無くなった DF-5 を削除）と、画面ごとの characterization test 3 本（`daily-sales`・`products`・`stock-inquiry` の `components/DepartmentFilter.test.tsx`。props から `widthClass` を外し、DF2 の期待を `w-[11rem]` へ）を直す。入出庫履歴（`src/features/inventory-records/InventoryRecordsPage.tsx` 起草時 229 行）は共有部品を使わず `SelectTrigger` に `w-44`（Tailwind の既定で 11rem）を持つ。幅は既に 11rem で一致するため変更しない（共有部品への置換は Non-scope）。正本 `docs/function-design/59-ui-shared-patterns.md` §59.1 の props、`docs/design-system/02-component-catalog.md` ⑨ の `DepartmentFilter` の記述（起草時 633 行の「widthClass / idPrefix は呼び出し側で現値を維持する」、634〜640 行の例の `widthClass="w-[11rem]"`、646 行の内部構造の `className={widthClass}`、653 行の「使用トークン」）を直し、「幅は部品が `w-[11rem]` に固定し呼び出し側で変えない」を書き、`docs/design-system/04-backbone.md` の「旧 04 の反映待ちの行き先」の表で部門 select の幅を反映済み（02 ⑨）へ移す。
- **S6 DOC-2: CSV 取込みの commit 失敗時の説明を 1 つにする**: `docs/function-design/55-ui-csv-import.md` §55.5 の「CmdError kind 別表示マトリクス」の `internal`・`not_found` の行（起草時 345〜346 行、「Sonner トースト + state 据え置き」）を、実装・同書の §55.8 遷移図・state 遷移表（起草時 190〜197 行）・処理手順 20（起草時 331 行）に合わせる。解析（parse）と取込み（commit）の失敗は kind を問わず `ErrorState` を出し、`import_error` は `recoverTo = "idle"`、それ以外は解析由来なら `"idle"`・取込み由来なら `"preview"` へ戻る。トーストと state の据え置きは取消（rollback）の失敗の挙動（同書 182 行・515 行、`useCsvImportFlow.ts` の `rollbackMutation.onError`）として別の行に分ける。`ErrorState` の題名が `internal` 等で「エラーが発生しました」であること（`ErrorState.tsx`）も表に書く。同じ食い違いを持つ §55.9「`internal` kind の沈黙ポリシー」（起草時 517〜519 行、「Sonner トーストのみで state を据え置く」）も直し、「`internal` も解析・取込みの失敗では `ErrorState` を出し `recoverTo` に従う。トーストと据え置きは取消の失敗だけ」の趣旨にする。§55.9 の `decideRecoverTo` の例（起草時 499〜505 行、引数 2 つ）も実装の形（引数は `error` だけ。`import_error` なら `"idle"`、それ以外は `"preview"`。解析の失敗は `parse_failed` が常に `idle` へ戻す）へ直す。取込み由来の `internal` を固定する hook test（T-S6）を足す。
- **S7 DOC-2: PLU slot の `activated_at` の意味を 1 つにする**: `docs/db-design/plu-tables.md` §25 のカラム定義で、`activated_at` の説明「レジ反映確認日時」を「slot が active になった日時（アプリ側の保存済み確認、snapshot での観測による採用、prepare での external の採用、再対象化による復元）。release_pending でも保持し、再対象化で active と reserved のどちらへ戻すかの判別に使う。実レジへの反映完了は証明しない（UI-08-D2）」の趣旨に直す。同じ表の `released_at` の説明「解放確認日時」も実装どおりに直す（隣接の同型、Matrix の Adjacent Pattern Audit）。実装で値を書くのは release_pending → free の 2 箇所だけ（`src-tauri/src/biz/plu_export_service.rs` 起草時 164 行 = snapshot でレジ空の観測、637 行 = clear 行の保存済み確認）で、解放 trigger（`release_plu_slot_for_jan`、起草時 705〜727 行）は reserved → free で前の値を持ち越し（713 行）、active → release_pending で NULL にする（725 行）。snapshot でレジ空の external → free も前の値を持ち越す（147 行）。説明は「release_pending → free の解放を記録した日時（clear 行の保存済み確認、snapshot でレジ空の観測）。解放 trigger では設定しない（active → release_pending は NULL、reserved → free は前の値を持ち越す）。実レジからの削除完了は証明しない」の趣旨にする。同書 §25 の状態遷移表の解放 trigger の 2 行（起草時 52 行 reserved → free、54 行 active → release_pending）の必須処理から「released_at」を外す。runtime は変えない（33 §16.3 の 86 行・§16.5 の 138 行は既に実装と一致）。
- **S8 生成物と検査**: S2・S3・S4・S5・S6 で REQ 付きの test が増減するため `cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成する（手で編集しない）。`src/lib/date-time.test.ts` は `REQ-` か `UI-` の参照を含め、T4（REQ / UI 参照の無い FE test file の数）の baseline を動かさない。

## Non-scope

- **⑰-1 商品修正の操作ログ `detail_json` に非価格 field の変更前後を含める**: lane 全体を R3 へ押し上げるため外す。`operation_logs.detail_json` の永続する JSON の形（どの field を、`department_id`・`supplier_id` を ID と名称のどちらで残すか）を決め、`docs/function-design/74-ui-operation-logs.md` §74.8 の既知 key 辞書と表示を同時に変える必要があり、backlog 自身が「R3〈wire 契約〉」と分類している。どの field を名称で残すかは owner に見える表示の判断を含む。
- **follow-up (2) 新しすぎる backup の復元失敗の文言**: lane 全体を R3 以上へ押し上げ、設計判断も要るため外す。画面は `restore_failed_recovered` の kind だけで固定文言を出し、§68 は「エラーメッセージ文字列の部分一致に依存しない」と定める（`docs/function-design/68-ui-backup-restore.md`）。文言を分けるには `CmdErrorKind` に値を足す（生成 bindings と restore の分岐を変える R3、backup restore は R4 の領域）か、CMD の message を画面に出す表示契約へ変えるかの選択が要る。
- 入出庫履歴の部門 select を共有 `DepartmentFilter` へ置き換えること: 幅は既に 11rem で一致しており Goal を満たす。置換は URL の検索状態（`departmentId`）の配線と「すべて」の文言に触れるため、小口の範囲を越える。backlog の follow-up 候補として報告する。
- 旧 04 の (b) sidebar のラベルの折返し、(c) `src/App.css` の撤去、(d) 月数回・年数回の画面の個別 sweep、(e) 押せる行の chevron。
- DOC-2 の `stocktake_items.system_stock` の行（㉗ の方針どおり別途）。
- `restore` 以外の画面の固定文言、日時の書式の共通規則の新設、`formatYen` など `types.ts` の他の helper の移動。
- `docs/backlog.md` と `docs/Plans.md` の完了反映（merge 後の closeout で行う）。`docs/research/2026-09-16-diagram-audit.md` は履歴の snapshot のため書き換えない。

## Acceptance Criteria

baseline はすべて 2026-09-27、`e7c22f8f` で下の command を実行して写した値（「実装前 → 完了時の期待」）。

- AC-S1: `sed -n '/^\/\/\/ schema_versionsテーブルを確認し/,/^    Ok(())$/p' src-tauri/src/db/migration.rs | rg -n '^\s*//+ [0-9]+(〜[0-9]+)?\.'` の出力が、実装前は `0.`・`1.`・`2.` の 6 行（doc comment 3 行と本体 3 行。round 1 是正時に同じ command で再実測）→ 完了時は `0.` を含まず、doc comment が 22 §3.2 の 1〜6 の順の 6 行、本体が `1〜2.`・`3.`・`4〜5.` の 3 行（計 9 行）になる。`cargo test` の migration 系 test が全 PASS。
- AC-S2: `rg -nU 'fn generate_custom_code\(\s*conn: &rusqlite::Transaction' src-tauri/src/biz/product_service.rs`（rustfmt が引数を改行しても一致する形）が実装前 0 件（exit 1、round 1 是正時に再実測）→ 完了時 1 件。`test_generate_custom_code_req101_requires_borrowed_transaction` を含む `cargo test` の `product_service` の test が全 PASS。30 §4.3 のシグネチャが同じ型。
- AC-S3: `rg -n 'export function formatDateTime' src` が実装前 `src/features/inventory-records/types.ts:104` の 1 件 → 完了時 `src/lib/date-time.ts` の 1 件だけ。`rg -n '\bformatDateTime\b' src/features/inventory-records/types.ts` が実装前 1 件 → 完了時 0 件。「⑰ SC6 / UIDISP-D6」の 7 本と `src/lib/date-time.test.ts` が `npm test` で PASS、`npm run typecheck` が exit 0。
- AC-S4: `rg -n 'toLocaleString\("ja-JP"' src/features/plu-export/PluExportPage.tsx` が実装前 1 件（162 行）→ 完了時 0 件。T-S4a・T-S4b・T-S4c・T-S4d（`PluExportPage.test.tsx`、REQ-402）が PASS し、T-S4b は `TZ=UTC npm test -- PluExportPage` でも PASS する。
- AC-S5: `rg -c 'widthClass' src` が実装前 9 file に計 18 件 → 完了時 0 件（exit 1）。`DepartmentFilter` の部品 test と画面ごとの characterization test 3 本が `w-[11rem]` を期待して `npm test` で PASS、`npm run typecheck` が exit 0（呼び出し側が幅を渡せないことの確認）。
- AC-S6: `rg -n 'Sonner トースト「データベースエラーが発生しました」' docs/function-design/55-ui-csv-import.md` が実装前 1 件（345 行）→ 完了時 0 件。`rg -n '据え置' docs/function-design/55-ui-csv-import.md`（「据え置き」「据え置く」の両方に一致）が実装前 5 件（182・345・346・515・519 行、round 1 是正時に再実測）→ 完了時は取消（rollback）の失敗の説明の 2 件（起草時 182・515 行に当たる行）だけ。T-S6（REQ-401）が PASS。
- AC-S7: `rg -n 'レジ反映確認日時|解放確認日時' docs src src-tauri --glob '!docs/archive/**' --glob '!docs/research/**' --glob '!docs/plans/**'` が実装前 2 件（`plu-tables.md` 22・23 行）→ 完了時 0 件。`rg -n '解放 trigger.*released_at' docs/db-design/plu-tables.md` が実装前 2 件（52・54 行、round 1 是正時に実測）→ 完了時 0 件。
- AC-S8: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0（T1 drift・T4 baseline とも ERROR なし）。`bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/doc-consistency-check.sh` が exit 0。`bash scripts/local-ci.sh changed` が PASS。
- AC-manual: Test Plan の L3-1・L3-2 を owner が PASS とする。

## Design Sources

- Requirements / spec: `docs/spec/requirements.md` の REQ-101（商品の新規登録、S2）、REQ-206（業務記録の追跡、S3）、REQ-401（POS 売上の取込み、S6）、REQ-402（PLU 書出し、S4・S7）、REQ-901（バックアップ・復元、Non-scope の根拠）。
- Architecture: `docs/ARCHITECTURE.md` の層（`UI -> CMD -> BIZ -> IO/MNT`）。どの項目も層をまたぐ呼出しを増やさない。
- Function / command / DTO: `docs/function-design/22-mnt-migration.md` §3.2（S1）、`30-biz-product-service.md` §4.2〜§4.3（S2）、`31-biz-inventory-service.md` §12.2（S2 の先例）、`33-biz-plu-export-service.md` §16.3・§16.5（S7）、`55-ui-csv-import.md` §55.5・§55.8 と state 遷移表・処理手順 20（S6）、`59-ui-shared-patterns.md` §59.1（S5）、`67-ui-plu-export.md` の処理ステップ 3・8 と UI-08-D2（S4・S7）、`68-ui-backup-restore.md`（Non-scope）、`74-ui-operation-logs.md` §74.7・§74.8（S3、Non-scope）。
- DB: `docs/db-design/plu-tables.md` §25 のカラム定義と状態遷移表（S7）、`docs/inventory_system_erd.html` の `plu_slots`（`activated_at` を「app active; not register proof」と既に書いている）。
- Screen / UI: `docs/design-system/02-component-catalog.md` ⑨、`docs/design-system/04-backbone.md`「旧 04 の反映待ちの行き先」（S5）、旧 04（`git show dda8560a:docs/design-system/04-backbone.md` の token 表「検索欄」の行「部門 select 幅は全画面同一」）。
- Decision log / ADR: D-011 / D-023（レジ側 API がない）と D-072（PLU slot 永続割当）を S7 の根拠に引く。新しい decision-log の番号は要らない（予約番号 D-095 は使わない）。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 22 §3.2（S1）、30 §4.3（S2） | 22 は existing sufficient（コメントを正本へ寄せる）。30 §4.3 はシグネチャの行を updated in this PR |
| Command / DTO / generated binding / wire shape | なし | 変更なし。bindings の再生成は不要（S2 は非公開関数） |
| DB / transaction / audit / rollback / migration | plu-tables §25（S7） | カラム説明の 2 行と状態遷移表の解放 trigger の 2 行を updated in this PR（schema・runtime は不変） |
| Screen / UI / route state / Japanese wording | 55 §55.5・§55.9（S6）、59 §59.1・02 ⑨・04（S5）、67（S4）、74 §74.7（S3） | 各行を updated in this PR。挙動・文言の新設はない |
| CSV / TSV / report / import / export format | なし | 変更なし |
| Durable decision / ADR | なし | 不要。11rem の値は 02 ⑨ に理由とともに置く |

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし（command・DTO を変えない） |
| function-design doc 新設 | 該当なし |
| source / workflow doc 新設・改名・削除 | 該当なし（新設は `src/lib/date-time.ts` と test だけで doc ではない） |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし |
| REQ / coverage の追加・変更・削除（設計書・test 内の既存 REQ 参照の増減を含む） | 該当する。S8 で `cd src-tauri && cargo run --bin generate_traceability` を実行し `docs/function-design/90-traceability.md` を再生成、`-- --check` の exit 0 を完了条件にする |
| route 新設・改名・削除 | 該当なし |
| operator 画面新設・改名・削除 | 該当なし |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-101 | 30 §4.3、31 §12.2 | 31 §12.2 の「借りた transaction に型で限る」 | 通常の接続を渡すとコンパイルが止まる。棄却: コメントだけで前提を書く現行 | `generate_custom_code` の引数型 | T-S2 |
| REQ-206 | 74 §74.7 | ⑰ UIDISP-D6（共有 `formatDateTime`、archive） | 8 feature から import される表示 helper を feature の外へ。棄却: `types.ts` から re-export を残す（置き場が 2 つになる） | `src/lib/date-time.ts` | T-S3、「⑰ SC6 / UIDISP-D6」7 本 |
| REQ-402 | 67 処理ステップ 3・8 | ⑰ UIDISP-D6 の書式 `YYYY-MM-DD HH:mm:ss` | DB の文字列は時差変換をせず、`savedAt`（UTC）だけローカルへ直す。棄却: `snapshot_at` も `Date` に通す（DB 側の時差なしの約束から外れる）、`savedAt` の保存形を変える（既存の localStorage と互換が切れる） | `PluExportPage.tsx` | T-S4a〜c |
| 旧 04 token 表「検索欄」 | 02 ⑨、04 の反映待ちの表 | 旧 04「部門 select 幅は全画面同一」 | 幅を部品だけが持てば画面ごとの drift が起きない。棄却: prop を残して値だけ揃える（再び混在し得る）、10rem（最長の部門名に余裕がない見積もり） | `DepartmentFilter.tsx` と呼び出し 4 箇所 | DF-4、B0-*-DF2 |
| REQ-401 | 55 §55.5・§55.8・§55.9 | 55 の state 遷移表と処理手順 20 | 実装・遷移図・遷移表・手順が一致し、§55.5 の表の 2 行と §55.9 の沈黙ポリシーだけが取消の挙動を解析・取込みにまで書いていた。「state 据え置き」は取込み中（importing）のまま止まり抜け出せない | 55 §55.5 の表、§55.9 の沈黙ポリシーと `decideRecoverTo` の例 | T-S6、既存の rollback 失敗 test |
| REQ-402 | plu-tables §25、33 §16.5、67 UI-08-D2 | UI-08-D2（レジ反映済みとは書かない）、D-011 / D-023 | アプリはレジへの反映を観測できない。状態遷移表・実装・ERD は既に「アプリ側で active になった日時」。`released_at` は実装が release_pending → free でだけ書き、解放 trigger では書かない | plu-tables §25 のカラム説明と状態遷移表の解放 trigger の 2 行 | 文書訂正のみ（test なし） |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 各項目の正本の節を Design Sources に挙げた。S5 の 11rem の理由は 02 ⑨ へ書く。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 11rem の値（02 ⑨ へ）、DOC-2 の 2 行の採用側（55・plu-tables へ）。decision-log は不要。
- Assumptions and constraints: 11rem が最長の部門名を切らないことは字幅の見積もりで未実測（L3-1 で確かめる）。部門名は owner が増減し得る（`docs/db-design/master-tables.md`「初期データ」）ため、より長い名前が入れば見直す。棚卸しの部門の絞り込みは旧棚卸しの開始が ㉘（PR #95）で止まっており画面で到達できないため、部品の test だけで確かめる。
- Deferred design gaps, risk, and follow-up target: ⑰-1 と follow-up (2) は backlog に残す（Non-scope）。
- Test Design Matrix can cite design decision IDs or source doc sections: [Matrix](test-matrices/2026-09-27-small-fixes-batch.md) の Contracts Under Test が上の節を引く。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「全画面で同一」は部品を描画する全 5 site（`rg -n '<DepartmentFilter' src --glob '!*.test.*'` の出力 = `StocktakePage.tsx:770`・`ProductListPage.tsx:119`・`StockInquiryPage.tsx:119`・`PriceRevisionFilters.tsx:92`・`DailySalesPage.tsx:84`）と、部門 master を読む画面（`rg -n 'listDepartments' src --glob '!*.test.*'`）から部品を使わない絞り込みを探して確かめた。例外は入出庫履歴の独自 select 1 つ（`InventoryRecordsPage.tsx:229` の `w-44` = 11rem）で、幅は一致する。`useProductFormOptions.ts` の部門は商品フォームの入力欄で、絞り込みではないため対象外。

## Impact Review Lenses

DOC-2 は 2026-09-16 の図面監査の finding が起点のため、該当する lens を使った。

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | S7: `activated_at` はアプリ内の状態の時刻で、レジ（外部）への反映は観測できない（D-011 / D-023） | plu-tables §25 |
| Fact check / design decision split | S6・S7: 実装・遷移表・ERD は観測した事実、表の外れた行は古い記述。採用側は事実側に置く | 55 §55.5、plu-tables §25 |
| Lifecycle / retry | S6: commit 失敗 → error → プレビューに戻る → 再実行、取消失敗 → result のまま同じ ID で再試行。挙動は変えない | T-S6、既存の rollback 失敗 test |
| Operator workflow | 変更なし（表示の書式と幅だけ） | not applicable |
| Replacement path | not applicable（外部 adapter を置き換えない） | not applicable |
| Data safety / evidence | test は合成の値だけを使う。実店舗の data・PLU file・DB を commit しない | Data Safety は R2 のため節を置かず Test Plan に書く |
| Reporting / accounting semantics | not applicable（集計・金額を変えない） | not applicable |
| Manual verification | S4・S5 の見た目は owner の目でしか確かめられない | Test Plan の L3-1・L3-2 |
| 環境・再現性 | S4 の T-S4b は test の中で `process.env.TZ` を `Asia/Tokyo` に固定し、日付の境界を跨ぐ固定の UTC 値で組む（runner の時差に依らず、UTC の runner でも時差変換漏れを捕まえる）。新しい環境依存は足さない | T-S4b |

## Design Readiness

- Existing design docs are sufficient because: S1・S2 は 22 §3.2・31 §12.2 がすでに決めた内容へコードとコメントを寄せる。S3 は 74 §74.7 が決めた書式の helper の置き場を変えるだけ。S4 は同じ書式（74 §74.7、⑰ UIDISP-D6）を PLU 画面へ当てる。S5 は旧 04 の「部門 select 幅は全画面同一」と 04 の反映待ちの表が要求を持ち、値は内容から決まる。S6・S7 は採用する挙動が同じ文書の他の節（55 の遷移図・遷移表・手順 20、plu-tables の状態遷移表）と実装・ERD にすでに書かれており、外れた行を直す訂正である。未解決の設計の問いは残らない。
- Source docs updated in this PR: 30 §4.3、55 §55.5・§55.9、59 §59.1、67（日時の書式 1 文）、74 §74.7、plu-tables §25、02 ⑨、04 の反映待ちの表。いずれも実装 commit と同じ PR で直す。
- Design gaps intentionally deferred: ⑰-1、follow-up (2)（Non-scope）。
- Durable decisions discovered in this plan and promoted to source docs: 部門 select の幅 11rem（02 ⑨）。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 変更なし。S2 は BIZ 内、S3〜S5 は UI 内、S1 は MNT 内。
- Backend function design: S2 は引数型だけ。処理手順・エラーは 30 §4.3 のまま。
- Command / DTO / data contract: 変更なし。S4 の localStorage の `savedAt` は読むだけで形を変えない。
- Persistence / transaction / audit impact: なし。S2 は TX の内側という既存の前提を型にするだけ。
- Operator workflow / Japanese UI wording: 日本語の文言は変えない。日時の書式と select の幅が変わる。
- Error, empty, retry, and recovery behavior: S4 の不正な日時は現行どおり入力をそのまま出す。S6 は既存の回復経路を正本に書くだけ。
- Testability and traceability IDs: REQ-101・REQ-206・REQ-401・REQ-402 を test 名か本文に付ける。

## Contract Probe

N/A: R2 で、未検証の外部前提に依らない。S4 は `toISOString()` の出力（末尾 `Z` の UTC）を `Date` で解釈してローカルの部品を読むだけで、DB の時差なしの文字列は `Date` に通さない。

## Contract Coverage Ledger

R2 のため必須ではない。契約ごとの test は [Matrix](test-matrices/2026-09-27-small-fixes-batch.md) の Test Matrix に置く。

## Test Plan

Test Design Matrix: [2026-09-27-small-fixes-batch](test-matrices/2026-09-27-small-fixes-batch.md)。

- targeted tests（新規・書換え。修正前に red になることの確かめ方を併記）:
  - T-S2 `test_generate_custom_code_req101_requires_borrowed_transaction`（`product_service.rs` の test module）: `let _ = generate_custom_code as fn(&rusqlite::Transaction<'_>, i64) -> Result<String, BizError>;` の形で型を固定する（`invariants.rs` の `apply_stock_change` と同じ先例）。修正前: 現行の `&DbConnection` の引数では cast が型不一致で `cargo test` のコンパイルが止まる（red）。
  - T-S3 `src/lib/date-time.test.ts`（REQ-206）: `formatDateTime("2026-09-27T08:05:09")` が `"2026-09-27 08:05:09"`、時差の変換をしないこと。修正前: `@/lib/date-time` が無く import で失敗する（red）。既存 7 本の import 元の正規表現を `@/lib/date-time` に直したものは、修正前の source（旧 import 元）で red、移動後に green になる。
  - T-S4a（REQ-402）: `getPluSlotSummary` の `snapshot_at` が `"2026-08-20T17:34:05"` のとき「最終読込み日時: 2026-08-20 17:34:05」を表示する。修正前: `toLocaleString` が「2026/08/20 17:34」を出し red。
  - T-S4b（REQ-402、必須）: test の中で `process.env.TZ` を `Asia/Tokyo` にし（終わりに元へ戻す）、保存済み未確認の復帰状態の `savedAt` に日付の境界を跨ぐ固定値 `"2026-12-31T15:05:09.000Z"` を置き、「保存日時: 2027-01-01 00:05:09」を表示する。修正前: 「2027/01/01 00:05」で red。UTC のまま並べる誤実装（`toISOString().slice(0, 19).replace("T", " ")` 相当）を一時的に入れて red になることを確かめ（`TZ=UTC` の runner でも捕まえる）、戻す。Node は実行中の `process.env.TZ` の変更を `Date` に反映する前提で、この mutant の red で前提も確かめる。
  - T-S4c（REQ-402）: `savedAt` が解釈できない文字列なら、その文字列をそのまま表示する（現行の挙動の維持）。
  - T-S4d（REQ-402、既存 test の書換え）: 保存 test `REQ-402 keeps a saved pending export recovery state without PLU file bytes`（起草時 390 行、`toMatchObject` は 404〜413 行）で時計を固定し（`vi.useFakeTimers({ toFake: ["Date"] })` と `vi.setSystemTime(new Date("2026-07-01T12:00:00.000Z"))`、終わりに `vi.useRealTimers()`）、localStorage の `savedAt` が `"2026-07-01T12:00:00.000Z"`（ISO の UTC）と完全一致することを足す。現行も green（保存形を変えない約束の固定）。保存時にローカル書式へ変える mutant で red になることを確かめる。
  - DF-4（`src/components/patterns/DepartmentFilter.test.tsx`）: `SelectTrigger` に `w-[11rem]` が付く。修正前: 既定 `w-[10rem]` で red。DF-5（`widthClass` を渡す test）は prop の削除とともに消し、呼び出し側が幅を渡せないことは `npm run typecheck` が確かめる（JSX に未知の prop を書くと型 error）。
  - B0-daily-DF2・B0-stock-DF2・B0-products-DF2: 期待を `w-[11rem]` にし、props の object から `widthClass` を外す（daily・stock は修正前の既定値・props で red）。
  - T-S6（REQ-401、`useCsvImportFlow.test.tsx`）: commit が `internal` の error を返したとき `state` が `{ status: "error", recoverTo: "preview" }` になり、`dismissError` で `preview` に戻る。文書訂正の裏付けの characterization で、修正前も green。壊れた実装を捕まえることは mutation（`decideRecoverTo` が常に `"idle"` を返す）で red になることで確かめる。
- negative tests: T-S4c（不正な日時）。S2 は型の否定（通常の接続を渡すとコンパイルできない）を T-S2 が表す。
- compatibility checks: localStorage の `savedAt` の形（ISO の UTC）を変えないこと（T-S4d）と、既存の復帰状態がそのまま読めること（`PluExportPage.test.tsx` の既存の復帰 test が PASS）。`formatDateTime` の出力は移動の前後で同じ（呼び出し元の既存 test が PASS）。
- data safety checks: test の値はすべて合成。実店舗の PLU file・Z004・DB を置かない。
- main wiring/integration checks: `npm run typecheck`（import 元の付け替え漏れと `widthClass` の残りを検出）、`npm run lint`、`npm run format:check`、`npm test`、`npm run build`、`cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test`、`cd src-tauri && cargo run --bin generate_traceability -- --check`、`bash scripts/doc-consistency-check.sh`、`bash scripts/local-ci.sh changed`。
- Human Gate に manual があるため、Writer は owner の native build の前に `cd src-tauri && cargo check --release` を通す（Writer の完了条件、CI gate ではない）。

manual（owner の目視、Windows の native build で行う。画面 / 到達手順 / 観測可能な合格基準）:

- L3-1 部門の絞り込み欄の幅: 画面 = 商品検索・一覧（`/products`）、一括価格改定（`/products/price-revision`）、在庫照会（`/stock`）、日次売上（`/reports/daily`）、入出庫履歴（`/inventory/records`）。到達手順 = 左のナビから各画面を開き、「部門」の欄を見る。欄を開いて「ビューティ関連」を選ぶ。画面ごとの条件: 商品検索・一覧・一括価格改定・在庫照会の候補は部門 master の全件で、未選択の表示は「すべての部門」。入出庫履歴の候補も master の全件だが、未選択の表示は「すべて」。日次売上の候補はその日の売上明細にある部門だけなので、「ビューティ関連」の合成売上がある対象日を Coordinator が fixture として用意し、その日付を開く。合格基準 = 5 画面で欄の幅が同じに見え、未選択の表示（「すべての部門」または「すべて」）と「ビューティ関連」が欄の中で切れずに読める。絞り込みの行が折り返して崩れない。
- L3-2 PLU書出しの日時: 画面 = PLU書出し（`/products/plu-export`）。到達手順 = (a) レジ登録状況を読み込み済みなら画面上部の「最終読込み日時」を見る。読み込んでいなければ Coordinator が用意する合成の Z004 file を「レジ登録状況を読み込む」で選ぶ。(b) 「差分を書き出す」か「全件を書き出す」で PLU file を任意の folder へ保存する。保存の直後は「保存日時」が出ない（保存直後の表示では復帰の案内を出さないため）。「この書出しを未反映から外す」は押さずに、左のナビで別の画面へ移り、PLU書出しを開き直す。上部に出る「保存済みで未確認のPLU書出しがあります」の「保存日時」を見る（保存は PLU slot の予約を開発用の DB に残すが、実店舗の data ではない）。合格基準 = どちらも `2026-09-27 14:05:09` の形（ハイフン区切りの日付、半角スペース、秒まで）で、保存日時が保存した時刻（PC の時計）と合う。

L3 の fixture（合成の Z004、「ビューティ関連」の合成売上がある日の日報）は Coordinator が Ready の依頼と同時に渡す（実 encoding にそろえる）。

## Boundary / Wire Contract

S4 が browser state（localStorage の保存済み未確認の復帰状態）を読むため書く。

- producer: `PluExportPage.tsx` の保存成功時の `savedAt: new Date().toISOString()`（変更なし）。`snapshot_at` は BIZ の `chrono::Local::now().format("%Y-%m-%dT%H:%M:%S")`（変更なし）。
- consumer: `PluExportPage.tsx` の表示だけ（`formatPendingSavedAt` と `formatDateTime`）。
- wire type: string（ISO 8601 の UTC、末尾 `Z`）と string（時差なしの `YYYY-MM-DDTHH:MM:SS`）。
- internal type: 表示時だけ `Date`（`savedAt` のみ）。
- precision/range: 秒まで表示する（ミリ秒は出さない）。
- round-trip path: 保存 → localStorage → 画面の再表示。保存する形は変えない。
- invalid input: 解釈できない `savedAt` はそのまま表示する（現行どおり）。`snapshot_at` が無いときは現行どおり空。
- compatibility: 既存の localStorage の値はそのまま読める（形を変えない）。

## Review Focus

- S6・S7 で採用した側が、実装・同じ文書の他の節・ERD と一致しているか。表の外れた行だけを直し、正しい行（55 の 182・515 行、plu-tables の状態遷移表）を書き換えていないか。
- S4 で `snapshot_at` を `Date` に通していないか（時差なしの DB 文字列の約束）。`savedAt` の表示が `TZ=Asia/Tokyo` の日付の境界を跨ぐ入力で固定され、保存形（ISO の UTC）が T-S4d で固定されているか。S7 の `released_at` の説明が実装（release_pending → free でだけ書く）と一致し、遷移表の解放 trigger の 2 行から外れているか。S6 で §55.9 も直っているか。
- S5 で部品を使う全 site（棚卸しを含む）が 1 つの幅になり、prop が消えているか。消した DF-5 の代わりを typecheck が担っているか。部品を使わない入出庫履歴の欄を変えていないか（`w-44` = 11rem のまま）。
- S3 で re-export を残していないか。既存 7 本の source 走査 test の「ローカル定義の禁止」の assertion を弱めていないか。
- Non-scope の 2 件（⑰-1、follow-up (2)）に手が入っていないか。
- 並走する wave 14 の lane（色と強調、D-094）と `PluExportPage.tsx`・`docs/design-system/02-component-catalog.md`・`docs/design-system/04-backbone.md`・`90-traceability.md` が重なり得る。重なりは merge 順で解く（wave 13 からの owner 決定）。後から merge する側は `origin/main` を 1 回 merge し、`90-traceability.md` は手で直さず再生成する。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
