# Test Design Matrix: backlog の小口の修正をまとめる（wave 14 lane E）

Plan Packet: [2026-09-27-small-fixes-batch](../2026-09-27-small-fixes-batch.md)

## Risk

Risk: R2

## Contracts Under Test

- C-S1: `migrate` のコメントの手順番号が `docs/function-design/22-mnt-migration.md` §3.2 の処理ステップ（1〜6）と一致する（コメントのみ、test なし）。
- C-S2: `generate_custom_code` は借りた transaction（`&rusqlite::Transaction<'_>`）しか受け取らない（30 §4.3、31 §12.2 の先例）。
- C-S3: `formatDateTime` は `src/lib/date-time.ts` の 1 箇所だけに定義され、DB の `YYYY-MM-DDTHH:MM:SS` の `T` を半角スペースへ置くだけで時差の変換をしない（74 §74.7、⑰ UIDISP-D6）。各画面は共有 helper を import し、ローカル定義を持たない。
- C-S4: PLU書出し画面の「最終読込み日時」と「保存日時」は `YYYY-MM-DD HH:mm:ss`（ローカル時刻、秒まで）。`snapshot_at` は時差変換をしない、`savedAt`（UTC）はローカルへ直す、解釈できない値はそのまま出す（67 処理ステップ 3・8）。
- C-S5: 部門の絞り込み欄の幅は部品だけが持ち `w-[11rem]`。呼び出し側は幅を渡せない。部品を使わない入出庫履歴の欄（`w-44` = 11rem）と同じ幅になる。部品の採用は 5 site（59 §59.1、price-revision を含む）（02 ⑨、旧 04「部門 select 幅は全画面同一」。正本は plan 側で訂正済み）。
- C-S6: CSV 取込みの解析・commit の失敗は `ErrorState` を出し `recoverTo` に従って戻る。取消（rollback）の失敗はトーストを出し `result` のまま（55 §55.5・§55.8・§55.9、reducer 遷移表、処理手順 20。正本は plan 側で訂正済み、挙動は変えない）。
- C-S7: `plu_slots.activated_at` / `released_at` はアプリ内で状態が変わった日時で、実レジへの反映・削除を証明しない。`released_at` は release_pending → free（clear 行の保存済み確認、snapshot でレジ空の観測）でだけ書き、解放 trigger では書かない。解放 trigger で active → release_pending になった行は `activated_at` を保持し、再対象化で active に戻る（snapshot の重複 stale の行は NULL で reserved に戻る）（plu-tables §25、UI-08-D2、`plu_export_service.rs`。正本は plan 側で訂正済み、runtime は変えない）。
- C-S8: REQ 付き test の増減が `docs/function-design/90-traceability.md` に再生成で反映され、T4 の baseline が動かない。

## Failure Modes

- F-S2: 通常の接続（TX の外）で独自コードを発番でき、連番の更新が TX から漏れる。
- F-S3a: 移動後にどこかの画面が旧い置き場から import したまま、または別の置き場にローカル定義を持つ。
- F-S3b: 移動の際に helper の出力が変わる（時差変換が入る、区切りが変わる）。
- F-S4a: `snapshot_at` を `Date` に通して時差の解釈が入る、または秒が落ちる。
- F-S4b: `savedAt`（UTC）を文字列置換だけで出し、時差分ずれた時刻やミリ秒・`Z` が見える。
- F-S4c: 解釈できない値で空文字や `Invalid Date` を出す。
- F-S5a: 画面ごとに幅が違うまま残る、または再び画面が幅を渡せる。
- F-S5b: 11rem で最長の部門名が切れる（見た目、manual）。
- F-S6: 文書訂正の後で、commit の `internal` 失敗が `idle` に戻る（プレビューを失う）ように実装が変わっても test が捕まえない。
- F-S8: `90-traceability.md` の drift、または新しい FE test file に REQ / UI の参照がなく T4 の baseline がずれる。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- 既存 test の実在は起草時（2026-09-27）に `rg -n` で確かめた: 「⑰ SC6 / UIDISP-D6」7 本（`DisposalPage.test.tsx:771`・`ReceivingPage.test.tsx:1078`・`PriceHistorySection.test.tsx:32`・`PreviewStep.test.tsx:187`・`OperationLogsPage.test.tsx:1317`・`ReturnExchangePage.test.tsx:842`・`IntegrityCheckPage.test.tsx:591`）、DF-4 / DF-5（`src/components/patterns/DepartmentFilter.test.tsx:60`・`:67`）、B0-*-DF2（`daily-sales`・`products`・`stock-inquiry` の `components/DepartmentFilter.test.tsx`）、`REQ-401: import_error commit failure recovers to idle`（`useCsvImportFlow.test.tsx:171`）、`test_import_rollback_req401_failure_retries_same_id_success_refetches_remaining_aggregate`（同 `:349`）、`test_generate_custom_code_req101_*` 3 本（`product_service.rs:1542` 以降）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C-S2 | F-S2 | unit（コンパイル時の型） | `test_generate_custom_code_req101_requires_borrowed_transaction`（新規） | 引数型が `&DbConnection`（通常の接続を受ける型）に戻ると関数 pointer の cast が型不一致になり `cargo test` がコンパイルで止まる |
| C-S2 | 発番の挙動の維持 | unit | `test_generate_custom_code_req101_normal`・`_no_prefix`・`_sequential`（既存） | 型の変更で発番の結果・連番・接頭辞なしの拒否が変わる |
| C-S3 | F-S3b | unit | `src/lib/date-time.test.ts`（新規、REQ-206） | 出力が `"2026-09-27 08:05:09"` 以外になる（時差変換・区切りの変更・秒の欠落） |
| C-S3 | F-S3a | source 走査 | 「⑰ SC6 / UIDISP-D6: 共有 formatDateTime を import しローカル定義を持たない」7 本（既存、import 元の正規表現を `@/lib/date-time` へ書換え） | 対象画面が旧い置き場から import したまま、または `formatDateTime` / `formatCheckedAt` のローカル定義を持つ |
| C-S3 | F-S3a | 型検査 | `npm run typecheck`（`types.ts` から定義を消し re-export を残さない） | 15 の importer のどれかが旧い置き場を指したまま |
| C-S4 | F-S4a | component（page） | T-S4a `PluExportPage.test.tsx`（新規、REQ-402） | `snapshot_at = "2026-08-20T17:34:05"` で「最終読込み日時: 2026-08-20 17:34:05」以外（`2026/08/20 17:34` 等）を出す |
| C-S4 | F-S4b | component（page） | T-S4b `PluExportPage.test.tsx`（新規、REQ-402、`process.env.TZ = "Asia/Tokyo"`。vitest の pool が forks〈既定〉であることに依る。戻すときは元の値の文字列を代入し、未設定なら `"UTC"` 等、`delete` は使わない） | `savedAt = "2026-12-31T15:05:09.000Z"` で「保存日時: 2027-01-01 00:05:09」以外を出す（UTC のまま並べる、ミリ秒・`Z` が残る、分まで）。`toISOString().slice(0, 19).replace("T", " ")` 相当の mutant は UTC の runner でも red |
| C-S4 | 保存形（ISO の UTC）の維持 | component（page） | T-S4d `REQ-402 keeps a saved pending export recovery state without PLU file bytes`（既存、書換え） | 固定時計 `2026-07-01T12:00:00.000Z` で保存した localStorage の `savedAt` が `"2026-07-01T12:00:00.000Z"` と完全一致しない（保存時にローカル書式へ変える等） |
| C-S4 | F-S4c | component（page） | T-S4c `PluExportPage.test.tsx`（新規、REQ-402） | 解釈できない `savedAt` で入力と違う文字列（空・`Invalid Date`）を出す |
| C-S5 | F-S5a | component | DF-4 `src/components/patterns/DepartmentFilter.test.tsx`（書換え） | `SelectTrigger` の幅が `w-[11rem]` 以外 |
| C-S5 | F-S5a | component（結線の characterization） | B0-daily-DF2・B0-stock-DF2・B0-products-DF2（書換え） | 画面の props のまま描画して `w-[11rem]` 以外になる |
| C-S5 | F-S5a | 型検査 + 検索 | `npm run typecheck`、`rg -c 'widthClass' src` が 0 件 | 部品が幅の prop を受け続ける、または呼び出し側に `widthClass` が残る |
| C-S5 | F-S5b | manual | L3-1（packet の Test Plan） | 5 画面（入出庫履歴を含む）で幅が違って見える、「ビューティ関連」や未選択の表示（「すべての部門」、入出庫履歴は「すべて」）が切れる、絞り込みの行が崩れる |
| C-S6 | F-S6 | hook | T-S6 `useCsvImportFlow.test.tsx`（新規、REQ-401） | commit の `internal` 失敗で `recoverTo` が `"preview"` 以外になる、または `dismissError` で `preview` に戻らない |
| C-S6 | 取消失敗の挙動の維持 | hook | `test_import_rollback_req401_failure_retries_same_id_success_refetches_remaining_aggregate`（既存） | 取消の失敗でトーストが出ない、`result` を失う |
| C-S6 | import_error の挙動の維持 | hook | `REQ-401: import_error commit failure recovers to idle`（既存） | `import_error` が `idle` 以外へ戻る |
| C-S8 | F-S8 | CLI | `cd src-tauri && cargo run --bin generate_traceability -- --check` | T1 drift（再生成漏れ）か T4 baseline のずれで exit 非 0 |
| C-S1・C-S5・C-S6・C-S7 | 文書の不一致 | CLI（検索） | packet の AC-S1、AC-S5 の正本側、AC-S6、AC-S7 の command | 旧い番号（`0.`）、正本の `widthClass`、55 の `internal` / `not_found` の行のトーストと state を変えない記述、「レジ反映確認日時」「解放確認日時」、状態遷移表の解放 trigger の行の `released_at` が残る・戻る |

## State Lifecycle Matrix

S4 だけが状態（保存済み未確認の復帰状態）を読む。S6 は状態遷移を変えない（既存の遷移を正本に書くだけ）ため、既存の reducer / hook の test を根拠に挙げる。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| PLU の保存済み未確認の復帰状態（`savedAt`） | なし（表示なし） | 保存中は変更なし | 保存成功で localStorage に ISO の UTC で保存（不変） | confirm 成功で削除（不変） | 該当なし | 画面の再表示で「保存日時」を新書式で表示 | アプリ再起動後も同じ値を新書式で表示 | 解釈できない値はそのまま表示 | 該当なし | T-S4b、T-S4c、T-S4d、既存の復帰 test |
| レジ登録状況の要約（`snapshot_at`） | 未読込みなら表示なし | 読込み中は変更なし | 読込み成功で新書式 | 該当なし | summary の再取得で同じ書式 | 同上 | 同上 | 該当なし（読込み失敗は既存の表示） | 該当なし | T-S4a |
| CSV 取込みの flow（文書のみ） | idle | parsing / importing | preview / result | 該当なし | 該当なし | 該当なし | 該当なし | 解析・commit 失敗は error（`recoverTo`）、取消失敗は result のまま | error からの戻り、取消は同じ ID で再試行 | T-S6、既存 `reducer.test.ts`・`useCsvImportFlow.test.tsx` |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 借りた transaction に型で限る（31 §12.2） | `rg -n 'fn [a-z_]+\(conn: &DbConnection' src-tauri/src/biz/product_service.rs` 等、backlog が名指しした `generate_custom_code` | `generate_custom_code` | 同じ前提の他の helper の走査は本 lane の対象外（backlog の (3) は `generate_custom_code` だけを名指し）。Writer が見つけたら報告し、Scope は広げない | T-S2 |
| 共有 `formatDateTime`（⑰ UIDISP-D6） | `rg -l '\bformatDateTime\b' src --glob '!*.test.*'` の 16 file（定義 1 + importer 15） | importer 15 file を `@/lib/date-time` へ | なし | 「⑰ SC6」7 本、typecheck |
| 日時の表示書式 `YYYY-MM-DD HH:mm:ss` | `rg -n 'toLocaleString\("ja-JP"' src --glob '!*.test.*'` と `rg -n 'toLocale(Date|Time)String' src --glob '!*.test.*'`（起草時に実行。日時に `toLocaleString` を使うのは `PluExportPage.tsx:162` だけで、他の hit は金額・件数。`toLocaleDateString("sv-SE")` の 4 箇所は日付の計算用で表示の日時ではない） | `PluExportPage.tsx` の 2 箇所 | 月次売上の期間表示「YYYY/MM/DD-MM/DD」は SCREEN_DESIGN が固定文言として定める日付範囲で、日時ではないため対象外 | T-S4a〜c |
| 部門 select の幅 | `rg -n '<DepartmentFilter' src --glob '!*.test.*'` の 5 site と、`rg -n 'listDepartments' src --glob '!*.test.*'` で部門 master を読む画面 | 部品を使う 5 site（棚卸しは既定値を使っていたため属性の削除なし）。59 §59.1 の採用画面の一覧に price-revision を足して 5 site に揃えた（plan 側で訂正済み） | 入出庫履歴 `InventoryRecordsPage.tsx:229` は部品を使わない独自 select で `w-44` = 11rem、幅は一致するため変更しない（部品への置換は検索状態の配線に触れ Non-scope）。商品フォームの部門（`useProductFormOptions.ts`）は入力欄で絞り込みではない。棚卸しの画面は旧棚卸しの開始が ㉘ で止まっており manual で到達できないため、部品の test だけで確かめる | DF-4、B0-*-DF2、L3-1 |
| DOC-2 の「アプリ内の状態の時刻は実レジの証明ではない」 | `rg -n 'activated_at|released_at' docs --glob '!docs/archive/**'`（plu-tables・33・67・diagrams・ERD） | plu-tables §25 のカラム定義の 2 行（plan 側で訂正済み） | 33・diagrams・ERD は既に実装と一致（「not register proof」「実レジへの反映完了を証明しない」） | AC-S7 |
| `released_at` を書く契機 | `rg -n 'released_at' src-tauri/src/biz/plu_export_service.rs`（書込みは 164・637 行の 2 箇所。147・713 行は前の値の持ち越し、725 行は NULL）、plu-tables §25 の状態遷移表、33 §16.3 の 86 行・§16.5 の 138 行 | plu-tables §25 の状態遷移表の解放 trigger の 2 行（`22331e15` の 52・54 行）から「released_at」を外し、release_pending → free の 2 行に書いた（plan 側で訂正済み） | 33 の 2 行は既に実装と一致。runtime は変えない | AC-S7 の 2 つ目の command |
| CSV 取込みの失敗表示 | 55 の §55.5 表と直下の recoverTo の決定の文・182 行・reducer 遷移表・処理手順 20・§55.8・§55.9（`decideRecoverTo` の例、rollback 失敗の UX、`internal` の節）、`useCsvImportFlow.ts`、`reducer.ts`、`ErrorState.tsx` | §55.5 の表の 2 行と直下の recoverTo の決定の文、§55.9 の `decideRecoverTo` の例と `internal` の節（plan 側で訂正済み） | 182・515 行と遷移表・図は既に実装と一致 | AC-S6、T-S6 |

## Negative Paths

- missing input: `snapshot_at` が無いときは現行どおり空を出す（表示の条件は変えない）。
- invalid input: 解釈できない `savedAt` はそのまま表示（T-S4c）。通常の接続を `generate_custom_code` に渡すとコンパイルできない（T-S2）。
- duplicate/ambiguous input: 該当なし。
- unknown reference: 該当なし。
- dependency missing: 該当なし（依存を足さない）。
- permission/write failure: 該当なし。
- dry-run side effect: 該当なし。

## Boundary Checks

- threshold: 該当なし。
- null/default: `snapshot_at` の null は `?? ""` のまま。`DepartmentFilter` の既定幅だけが残る。
- empty/non-empty: `formatDateTime("")` は `""`（現行どおり）。
- min/max: 秒まで表示し、ミリ秒は出さない（T-S4b）。
- status/policy enum: 該当なし。
- wire type: `savedAt` は ISO の UTC 文字列のまま（Boundary / Wire Contract）。
- internal type: 表示時だけ `Date`。
- producer/consumer: 保存側は不変、表示側だけ変える。
- round-trip token: 保存 → localStorage → 再表示（既存の復帰 test）。
- precision/range: 時差のある環境でもローカル時刻で出る（T-S4b は `TZ=Asia/Tokyo` で日付の境界を跨ぐ固定の UTC 値を使う）。
- cross-language parse: `snapshot_at` は Rust の `%Y-%m-%dT%H:%M:%S` を文字列置換だけで表示する（`Date` に通さない）。

## Compatibility Checks

- old schema/input: 既存の localStorage の復帰状態（ISO の UTC）はそのまま読める。
- new schema/input: 変更なし。
- output order: 該当なし。
- optional field behavior: 該当なし。

## Data Safety Checks

- source-derived data: test の日時・部門名・JAN はすべて合成。
- generated outputs: `90-traceability.md` は再生成だけで手を入れない。
- secrets: なし。
- local-only files: L3 の合成 Z004 と保存した PLU file は `.local/` か repo の外に置き、commit しない。
- synthetic sample boundaries: 実店舗の PLU file・Z004・DB を使わない。

## Main Wiring / Integration Checks

- helper connected to main path: `formatDateTime` は全 importer が `@/lib/date-time` を経由（typecheck と「⑰ SC6」7 本）。PLU 画面の 2 箇所は page の test で画面に出る文字列を確かめる。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

Writer は下の mutation を実装へ一時的に入れて対象 test が red になることを確かめ、戻す（clean tree で実施）。

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → T-S4a・T-S4b の期待値（秒が 0 でない `05`・`09`）は画面の入力からしか作れない。`formatPendingSavedAt` の秒の部品を落とすと T-S4b が red。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → 該当なし（invalidate の順序を変えない）。
- If a key branch is inverted, which test fails? → `decideRecoverTo` が `import_error` 以外でも `"idle"` を返すと T-S6 が red。`formatPendingSavedAt` の不正値の分岐を外すと T-S4c が red。
- If a threshold comparison changes, which test fails? → 該当なし。
- If a guard is removed, which test fails? → `generate_custom_code` の型を `&DbConnection` に戻すと T-S2 がコンパイルで red。
- If an output field is omitted, which test fails? → `snapshot_at` の表示で秒を落とすと T-S4a が red。
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? The accepted design must keep current exact-HEAD evidence in PR metadata. → 該当なし（Workflow State に HEAD を書かない）。
- If output order changes, which test fails? → 該当なし。
- If dry-run performs a side effect, which test fails? → 該当なし。
- If a JSON number crosses JavaScript safe integer range, which test fails? → 該当なし。
- If a state token is round-tripped through browser/client code, which test fails? → `savedAt` を保存時にローカル書式へ変える（保存形の変更）と T-S4d（固定時計に対する ISO の UTC の完全一致）が red になる。既存の復帰 test は localStorage に直接値を置くため、この mutant を捕まえない（round 1 で実測）。
- 部品の幅を `w-[10rem]` に戻すと DF-4 と B0-*-DF2 が red。

## Residual Test Gaps

- 11rem で最長の部門名が切れないことは自動 test では確かめない（字幅は実機の font に依る）。L3-1 に残す。
- 棚卸しの画面の部門の絞り込みは画面で到達できない（旧棚卸しの停止、㉘）。部品の test と typecheck に依る。
- C-S1・C-S7 はコメント・文書の訂正で、AC の検索だけが根拠になる。
- S6 の取込み（commit）の失敗の画面の列は、Z004 の取込みの確定が現行 build で一時停止中（55 §55.0）のため manual で通れない。hook の test（T-S6）と既存の reducer の test に依る。
