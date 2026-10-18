# Test Design Matrix: 単位の語の直しの runtime

Plan Packet: `docs/archive/plans/2026-10-17-stock-unit-relabel.md`。oracle は設計正本（共通規則 SPEC-UNIT-D2、30 BIZ-01-D7・BIZ-01-D8、51 UI-01b-D23）から転記し、実装から写さない。test 名は案で、Writer が既存の命名（`test_<対象>_req<NNN>_<内容>`、TS は `UI-01b-D23: …`）に合わせて決めてよい。新しい test の名前に REQ-102（商品修正）・REQ-104（商品 CSV）か UI-01b-D23 を入れる。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-UNIT-D2 / BIZ-01-D8: 単位の変更は、今の単位と新しい単位がどちらも個数の種類のときだけ（商品修正・商品 CSV の preview・commit の 3 経路）。
- BIZ-01-D8: 検査は手順 2 の今の検査の後。同じ単位なら、省くのは `stock_unit` の SET と detail_json の key `stock_unit` だけ（通常の UPDATE とログ行は今の契約のまま）。commit の未知の code は `在庫単位が正しくありません: {code}`。
- BIZ-01-D8: 単位だけの変更は `plu_dirty` を変えない（商品修正・上書き）。上書きの「単位だけ」は 30 の列の一覧で比べる。
- BIZ-01-D7 / BIZ-01-D8: 操作ログの key `stock_unit` は `{"old": code, "new": code}`、変えたときだけ。上書きは単位を変えた商品ごとに TX の中で `product_update` を 1 行（summary `商品を更新しました: {商品コード}`、key は `stock_unit` だけ）。
- PRODUCT-PATCH-D1: `stock_unit` の omitted / null は更新しない。
- 20 §2.3: `ProductUpdates.stock_unit` を SET する。
- UI-01b-D23: edit の個数の単位の商品は select が押せて個数の単位だけを出し、文を出す。長さの商品は読取専用で送らない。在庫の節の説明文 3 つ。

## Failure Modes

- 種類をまたぐ変更・長さどうしの変更・未知の code が、どれか 1 つの経路で保存される。
- 判定が 3 経路で食い違う（例: preview は許すが commit は拒む、またはその逆）。
- 単位の変更で在庫・明細・売価・原価・price_history が変わる。
- 単位だけの変更で `plu_dirty=1` になる。単位と他の列の変更で `plu_dirty` が立たない。
- log の key が無い・余分・TX の外（失敗の commit に log だけが残る）。
- 長さの商品の form で select が押せる、または `stock_unit` が送られる。
- `stock_unit` が `null` のときに単位が変わるか、ログ行が足されないか、その detail に `stock_unit` の key が出る（null は「更新しない」。ログ行は §4.4 の手順 6 のとおり書き、変更した field が無ければ detail は NULL）。

## Test Matrix

既存 test の名前は 2026-10-17 の main で `cargo test --lib biz::product_service` の出力と `rg` で確かめた（`test_import_req104_overwrite_cannot_change_stock_unit`・`test_update_product_req102_detail_json_unchanged_fields_omitted`・`test_update_product_req102_cost_only_no_plu_dirty`・`test_commit_import_req104_operation_log`・`test_commit_import_req104_overwrite`）。

| ID | Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|---|
| T1 | SPEC-UNIT-D2・BIZ-01-D7・`plu_dirty` | 個数どうしが通らない、数・価格・`plu_dirty` が変わる、log が無い | unit（実 DB） | `test_update_product_req102_stock_unit_between_count_units`（新） | 単位 `pcs`・在庫 12・入庫の明細 1 行・`plu_dirty=0` の商品に `stock_unit: ball` を送り、単位が `ball`、在庫 12・売価・原価・明細の数量・price_history の行数が前と同じ、`plu_dirty` が 0、最新の `product_update` の detail を JSON として読んだ値が `{"stock_unit":{"old":"pcs","new":"ball"}}` と等しくないとき（文字列の字面で比べない。key の順は契約にしない、BIZ-01-D7。serde_json は `preserve_order` を持たず〈`src-tauri/Cargo.toml:27`〉、文字列にすると key は名前の順に出る） |
| T2 | SPEC-UNIT-D2・BIZ-01-D8 | 種類をまたぐ変更が保存される | unit | `test_update_product_req102_rejects_cross_kind_stock_unit`（新） | `pcs` → `m` と `m` → `pcs`（m の商品）のどちらかが `ValidationFailed("在庫単位は個数の単位どうしでだけ変えられます")` 以外を返すか、単位・`updated_at`・`product_update` の log の件数が変わるとき |
| T3 | BIZ-01-D8（長さどうし・失敗の順序） | `m` → `cm` が通る、検査の順が違う | unit | `test_update_product_req102_rejects_length_to_length_and_checks_unit_last`（新） | `m` → `cm` が拒まれないとき。存在しない取引先と `pcs` → `m` を同時に送って `指定された取引先が存在しません` 以外が返るとき（単位の検査は手順 2 の今の検査の後） |
| T4 | PRODUCT-PATCH-D1 | null で単位が変わる | unit（serde + 実 DB） | 既存の serde の test（`product_service.rs:2891`〜`:2953`）に `stock_unit` の行を足す | JSON `{}`・`{"stock_unit":null}` が `None` にならないか、`{"stock_unit":"ball"}` が `Some(Ball)` にならないとき。`{"stock_unit":null}` だけを送った update（実 DB）の後に、単位が変わっているか、`product_update` のログ行が 1 行足されていないか、その detail が NULL でない（`stock_unit` の key がある）とき（30 §4.4 の手順 6・BIZ-01-D8 の update の段。`record` は値が違うときだけ key を足し、ログ行そのものは書く〈`product_service.rs:395`〜`:456`〉） |
| T5 | BIZ-01-D8（同じ単位）・BIZ-01-D7 | 同じ単位で `stock_unit` の SET か key が出る、または同じ単位を理由に通常の UPDATE・ログ行まで省く | unit | `test_update_product_req102_detail_json_unchanged_fields_omitted`（既存、`req_ii` に `stock_unit: Some(<更新前>)` を足す）＋ 同じ単位と商品名の変更を送る行を足す | 全 field を更新前と同じ値で送ったときにログ行が書かれないか、その detail が NULL でなくなるとき（`stock_unit` の比べ方の漏れ）。同じ単位と新しい商品名を送ったとき、商品名が更新されないか、detail の key が `name` だけでないとき |
| T6 | BIZ-01-D8（preview、個数どうし） | 個数どうしの上書きが行の error になる | unit | `test_preview_import_req104_overwrite_allows_count_unit_change`（新） | 単位 `pcs` の既存の商品の行を `在庫単位` = `玉`（語）と `ball`（code）で読み、どちらも `duplicate_rows` に入り `import_row.stock_unit` が `Some("ball")` でないとき |
| T7 | SPEC-UNIT-D2・BIZ-01-D8（preview、種類をまたぐ・長さどうし） | 長さ ↔ 個数・長さどうしが通る、文が旧い | unit | `test_import_req104_overwrite_rejects_cross_kind_stock_unit`（既存 `test_import_req104_overwrite_cannot_change_stock_unit` を改名し文を差し替え）＋ 個数の商品の行を `m` で読む行と、m の商品の行を `cm` で読む行を足す | m の商品を `玉` で読んだ行の error が `在庫単位は個数の単位どうしでだけ変えられます（登録: m、CSV: 玉）` でないとき。`pcs` の商品を `m` で読んだ行と、m の商品を `cm` で読んだ行（文は `…（登録: m、CSV: cm）`）が error にならないとき。入庫の明細の金額の assert（`line_cost` が `33300`）が変わるとき |
| T8 | BIZ-01-D8（commit の再検証・未知の code・長さどうし） | preview を通らない wire で保存される、一部の行だけ書かれる | unit | `test_commit_import_req104_overwrite_revalidates_stock_unit_wire`（新。T7 の既存の wire の段も残す） | 上書きの行の wire の単位が `m`（既存 `pcs`）・`cm`（既存 `m`）・`kg`（未知）のとき、`ValidationFailed` の文がそれぞれ `在庫単位は個数の単位どうしでだけ変えられます（登録: 個、CSV: m）`・`在庫単位は個数の単位どうしでだけ変えられます（登録: m、CSV: cm）`・`在庫単位が正しくありません: kg` を含まないか、同じ取込みの他の行（新規 1・個数どうしの上書き 1）・単位・`product_update` の log のどれかが書かれているとき |
| T9 | BIZ-01-D8（上書きの `plu_dirty`、単位だけ） | 単位だけの上書きで `plu_dirty=1` | unit | `test_commit_import_req104_unit_only_overwrite_keeps_plu_dirty`（新、表駆動） | `plu_target=1` の `pcs` の商品を初期 `plu_dirty` = `0` と `1`（PLU の未反映の商品）の 2 行で用意し、それぞれ他の列を登録と同じにして `在庫単位` = `玉` で上書きした後、単位が `ball` で `plu_dirty` が更新前の値のまま（0 は 0、1 は 1）でないとき。初期 1 の行は、単位だけの行で `plu_dirty` を `Some(false)` にする誤実装で 0 に消え、差分 PLU の候補（`plu_dirty = 1 AND plu_target = 1`、`product_repo.rs:754`）から漏れると red。CSV が `取引先ID` 等の任意列を空にした行（書かない列）でも同じでないとき |
| T10 | BIZ-01-D8（上書きの `plu_dirty`、他の列も変わる・単位が同じ） | 上書きで比べる列のどれかを比べ落とし、単位とその列の変更で `plu_dirty` が立たない | unit（表駆動） | `test_commit_import_req104_overwrite_with_other_changes_sets_plu_dirty`（新） | 30 BIZ-01-D8 の 10 列（JAN・商品名・部門・売価・原価・税率・取引先・メーカー品番・在庫連動・PLU対象）それぞれについて、`plu_dirty=0` にした `pcs` の商品を「単位 `玉` + その 1 列だけが登録と違う」行で上書きした後に `plu_dirty` が 1 でないとき（任意の 4 列は CSV がその列に値を持つ行。JAN の行は「既存に JAN があり CSV の JAN が空」）。加えて (b) 単位が空で他の列が登録と同じ行、(c) 単位が同じで売価が違う行で `plu_dirty` が 1 にならないとき（(b) は今の §4.9 手順 2 d. の「上書きは plu_dirty=1」） |
| T11 | BIZ-01-D7・BIZ-01-D8（上書きの log） | log が無い・余分・形が違う、単位を変えない行にも log が出る | unit | `test_commit_import_req104_overwrite_logs_stock_unit_change_per_product`（新） | 3 行（単位を変える 2 商品〈うち 1 つは商品名も変える〉、単位は同じで商品名だけを変える 1 商品）を上書きした後、`product_update` の行が単位を変えた 2 商品の分の 2 行でないとき（商品名だけの商品に行がある、または 3 行になる）。それぞれの summary が `商品を更新しました: {商品コード}`、detail の key が `stock_unit` だけで前後の code が合わないとき。`product_import` の件数の要約の行が無いとき |
| T12 | BIZ-01-D8（log は TX の中） | 失敗した commit に log が残る | unit | T8 の中で確かめる（単位を変える正しい行を失敗の行より前に置く） | TX が戻った後に `product_update` の行が 1 行でも増えているとき |
| T14 | BIZ-01-D8（上書きの log の書込みの失敗） | log の INSERT の失敗を握りつぶし、単位だけが保存される | unit（実 DB + trigger） | `test_commit_import_req104_overwrite_log_failure_rolls_back_all`（新。既存 `test_update_product_req102_log_failure_rolls_back_all` の `fail_product_update_log` trigger〈`BEFORE INSERT ON operation_logs WHEN NEW.operation_type = 'product_update'` → `RAISE(ABORT, …)`〉を使う） | 新規 1 行と単位を変える上書き 1 行を正しい wire で commit し、log の INSERT だけが失敗したとき、`commit_import` が `Err` を返さないか、上書きの商品の単位・同じ取込みの新規の行・`product_update` の行のどれかが残るとき |
| T13 | 20 §2.3 | repo が単位を SET しない | unit（repo） | `test_update_product_sets_stock_unit`（新、`product_repo.rs` の test） | `ProductUpdates { stock_unit: Some(ProductStockUnit::Ball), ..Default::default() }` で更新した後に読んだ単位が `ball` でないか、`stock_unit: None` で単位が変わるとき |
| F1 | UI-01b-D23（送る判定） | 個数どうしの変更を送らない、変えないのに送る | unit（TS 純関数） | `product-form-request.test.ts` に `UI-01b-D23: 個数の単位の商品は単位を変えたときだけ stock_unit を送る`（新） | `pcs` の商品で `stockUnit: "ball"` の request が `{ stock_unit: "ball" }` を含まないか、`pcs` のままで `stock_unit` を含むとき |
| F2 | UI-01b-D23（長さの商品は送らない） | 長さの商品の値を送る | unit（TS 純関数） | `product-form-request.test.ts` の既存 `sends only supported changed fields and never sends read-only fields`（cm の商品、変えない） | cm の商品の form の値を `pcs` にした request が `stock_unit` を持つとき |
| F3 | UI-01b-D23（select と文） | 長さの商品の select が押せる、個数の select に長さが出る、文が出ない | component | `StockUnitField.test.tsx` に `UI-01b-D23: edit の個数の単位の商品は個数の単位だけを選べる`・`UI-01b-D23: edit の長さの単位の商品は選べない`（新）、`ProductForm.test.tsx:68`〜`:71` の書換え | edit・`pcs` で select が disabled、選択肢に `m`・`cm` がある、`個`〜`丁` の 10 個が無い、文 `単位の語だけが変わり、在庫の数は変わりません。過去の記録も新しい語で表示されます。` が無いとき。edit・`m` で select が押せるか文が出るとき |
| F4 | UI-01b-D23（説明文） | 説明文が旧いか分岐が違う | component | `ProductForm.test.tsx` に `UI-01b-D23: 在庫の節の説明文は mode と単位で 3 つ`（新） | create・edit の `pcs`・edit の `m` の説明文が UI-01b-D23 の 3 つの文と exact で一致しないとき、旧い create の文 `登録後は数量単位を変更できません。` が出るとき |
| F5 | PRODUCT-PATCH-D1（生成物） | bindings に field が無い、required になる | unit（source） | `product-update-patch-contract.test.ts` の 2 つの test（`ORDINARY_FIELDS` に `stock_unit`、名前を ten に） | `ProductUpdateRequest_Deserialize` に `stock_unit?:` が無いか、`_Serialize` に `stock_unit:` が無いとき |
| F6 | UI-01b-D23（保存と拒否） | 画面の保存が単位を送らない、BIZ の拒否が出ない | integration（page、`@/lib/bindings` は `vi.mock`） | `ProductFormPage.test.tsx` に `UI-01b-D23: 単位を変えて保存すると stock_unit を送り、拒否は保存の error に出る`（新） | `pcs` の商品で select を「玉」にして保存したとき `mockUpdateProduct` の第 2 引数が `{ stock_unit: "ball" }` でないか、`mockUpdateProduct` が `在庫単位は個数の単位どうしでだけ変えられます` の error を返したときに画面にその文が出ないとき |

F6 の mock 境界: `ProductFormPage.test.tsx:27` の `vi.mock("@/lib/bindings", …)` で `commands.updateProduct` を置き換える（実 BIZ は通らない。BIZ の拒否は T2 が受け持つ）。F3・F4 の `ProductForm.test.tsx:20` も `@/lib/bindings` を mock する（select の選択肢は `STOCK_UNIT_LABELS` から出るので mock の影響を受けない）。

oracle の anchor（定義文にしか現れない literal。実装の後に file ごとに `rg -c` で件数を確かめる。下の 2 つの UI の文は 1 件）: `単位の語だけが変わり、在庫の数は変わりません。過去の記録も新しい語で表示されます。`（`StockUnitField.tsx`）、`現在庫は変更できません。数量単位は個数の単位どうしでだけ変更できます。`（`ProductForm.tsx`）、`在庫単位は個数の単位どうしでだけ変えられます`（`product_service.rs` の production の部分で 1 件以上〈定数にまとめるなら 1 件〉。update の拒否と CSV の行の error の 2 か所に literal で書けば 2 件になる。test の部分にも出るので、`#[cfg(test)]` より前の範囲で数える）。旧い文 `在庫単位は登録の後に変えられません`（`src-tauri/src` と `src`）と `登録後は数量単位を変更できません。`（`src/features/products` に限る。Non-scope で残す `src/components/patterns/FormSection.test.tsx:40` を数えない）は 0 件。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 商品修正の form の単位 | `productToFormValues` が登録の単位を入れる | 保存中は今どおり保存ボタンを止める | 一覧へ戻る（UI-01b-D14） | `invalidationContract.productUpdate`（変えない） | 在庫照会・商品一覧・商品 form は再取得で新しい語。記録詳細・売上の画面は次の再取得まで旧い語（UI-01b-D23 の末尾） | 修正画面を開き直すと新しい単位が select に入る | DB の単位が残る | BIZ の拒否は form の alert、入力値を保持（51 §7.6） | 選び直して保存 | F6、L3-1 |
| 離脱の警告 | baseline = 登録の値 | — | 保存の後に baseline を同期（UI-USW-D1） | — | — | — | — | — | — | `isDirty` は form の全 field を比べる（`ProductFormPage.tsx:183`〜`:185`）。単位だけを変えて離れると警告が出る。既存の `ProductFormPage.unsaved-guard.test.tsx` の型で 1 行足すかは Writer の判断（足さなくても AC は満たす） |
| 商品 CSV の preview → commit | preview の結果（重複行の単位は code） | 取込み中 | 件数の要約 | `invalidationContract.productImport`（変えない） | — | — | — | commit の再検証で TX 全体を戻す（T8・T12） | 直して読み直す | T6〜T12、L3-3 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 商品修正の field の追加（PRODUCT-PATCH-D1 の通常 field、BIZ-01-D7 の log） | `ProductUpdateRequest` の 9 field、`update_product` の `record` の 9 個の呼出し（`product_service.rs:405`〜`:449`）、`buildUpdateProductRequest` の比較 9 行 | `stock_unit` を同じ型で 1 行ずつ | — | T1・T4・T5・F1・F5 |
| 商品 CSV の commit の再検証（BIZ-01-D5・D8） | `import_row_commit_error` の上書きと新規の分岐（`:1027`〜`:1053`） | 上書きの分岐に未知の code と判定を足す | 新規の行の分岐は変えない | T8 |
| `stock_unit_kind` で種類を分ける所 | `product_service.rs:933`（在庫少）、`sales_service.rs:451`・`:470`、`inventory_service/common.rs:26`、`seed_demo.rs:236` | 判定の関数で同じ `stock_unit_kind` を使う | 他の所は単位の変更で振舞いが変わらない（個数どうし） | Contract Ledger の除外の段 |
| select の readOnly の分岐 | `ProductForm.tsx` の readOnly 3 か所（`:194` JAN、`:418` 現在庫、`:431` 単位） | `:431` だけ | `:194`・`:418` は今どおり edit で読取専用 | F3 |

## Negative Paths

- missing input: `stock_unit` が omitted / null（T4）、CSV の `在庫単位` が空（T10 (b)、今の規則）。
- invalid input: 未知の code の wire（T8）。command の enum の外は serde が拒む（今の `tax_rate` と同じ。新しい test は足さない）。
- duplicate/ambiguous input: 同じ単位を送る（T5）。
- unknown reference: 存在しない商品の update は今どおり `NotFound`（変えない）。上書きの対象が無い行は今どおり skip（`:1500` の `existing` が None のとき再検証しない）。
- dependency missing: 該当なし。
- permission/write failure: log の書込みの失敗で TX 全体が戻ることは既存の `test_update_product_req102_log_failure_rolls_back_all` の型。上書きの log は T12（validation の失敗）と T14（log の INSERT の失敗）。
- dry-run side effect: preview は DB を書かない（今どおり。T6 の後に単位が変わっていないことを確かめる）。

## Boundary Checks

- threshold: 該当なし（数を変えない）。
- null/default: T4。
- empty/non-empty: T10 (b)。
- min/max: 該当なし。
- status/policy enum: 12 個の code の種類（個数 10・長さ 2）。個数どうし（T1・T6）、個数 → 長さ（T2・T7・T8）、長さ → 個数（T2・T7）、長さどうし（T3）の 4 組を全部置く。
- wire type: `ProductStockUnit | null`（F5）、CSV の wire は code の文字列（T8）。
- internal type: `Option<ProductStockUnit>`（T13）。
- producer/consumer: builder → command（F1・F6）、preview → commit（T6〜T8）。
- round-trip token: 保存した単位を `get_product` で読み直す（T1 は DB から読む。L3-1）。
- precision/range: 該当なし。
- cross-language parse: serde の enum の名前（`ball` 等）と TS の literal が一致することは生成物（F5）。

## Compatibility Checks

- old schema/input: `stock_unit` を送らない今の request は今どおり（T4 の `{}`、既存の update の test 全部）。
- new schema/input: `stock_unit` を持つ request（T1）。
- output order: log の key の順は契約にしない（BIZ-01-D7）。
- optional field behavior: T4。

## Data Safety Checks

- source-derived data: 無い（合成の値）。
- generated outputs: `src/lib/bindings.ts`、`docs/function-design/90-traceability.md`（生成で作る）。
- secrets: 無い。
- local-only files: L3-3 の CSV（Coordinator が local で作る）。
- synthetic sample boundaries: 既存の `make_import_row`・`make_csv`・`makeMockProductWithRelations` の型。

## Main Wiring / Integration Checks

- helper connected to main path: 判定の関数を 3 経路が呼ぶ（T2・T7・T8 が同じ文を見る）。
- output reaches manifest/report: 操作ログ（T1・T11）。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

- If a key branch is inverted: 判定の「どちらも個数」を「どちらかが個数」にすると T2（`pcs` → `m`）と T7（`pcs` の商品を `m`）が red。判定を常に真にすると T2・T3・T7・T8 が red。
- If a guard is removed: commit の再検証を外すと T8・T12 が red。上書きの log の書込みの error を握りつぶすと T14 が red。未知の code の分岐を外すと T8 の `kg` の文が red。
- If an output field is omitted: log の `stock_unit` の `record` を外すと T1 が red。上書きの log を外すと T11 が red。`ProductUpdates.stock_unit` の SET を外すと T1・T9・T13 が red。
- If a threshold comparison changes: 該当なし。
- If output order changes: 該当なし（key の順は契約でない）。
- If dry-run performs a side effect: preview が単位を書くと T6 の後の確かめが red。
- If a mock value differs from the design-doc expected value: F6 の拒否の文は 30 BIZ-01-D8 から転記し、mock は文をそのまま返すだけ。BIZ の文が正本から外れると T2 が red（F6 だけでは検出しない。役割を分けた）。
- `plu_dirty`: 上書きの「単位だけ」の判定を「単位が変わった」だけにすると T10 (a) が red。判定を外して常に `Some(true)` にすると T9 の初期 0 の行が red、単位だけの行で `Some(false)` にすると T9 の初期 1 の行が red。10 列のどれかを比べ落とすと T10 のその列の行が red。上書きの全行に log を書くと T11 が red（商品名だけの商品の行）。判定の「どちらも個数」を「同じ種類」にすると T3・T7・T8 の `m` → `cm` が red。
- If a JSON number crosses JavaScript safe integer range / state token round-trip: 該当なし。

## Residual Test Gaps

- 記録詳細・売上の画面が保存の直後に旧い語で出ることは test しない（受容した制約、UI-01b-D23 の末尾）。
- 操作ログ画面の `stock_unit` の表示（raw key と JSON）は新しい test を足さない（74 §74.8 の既存の未知 key の test の型で表示される。画面の code を変えない）。
- Windows の実機での select の操作と日本語の文の読みやすさは L3-1〜L3-3。
