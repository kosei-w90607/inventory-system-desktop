# Test Design Matrix: 棚卸しの画面の小口（導入の前の関門 6 と、b1 の残り）

[Plan Packet](../2026-10-27-stocktake-screen-fixes.md) の Matrix。test の ID は SF1〜SF6（本 lane。既存の test 名の「Final Review G1」等と混ざらない接頭辞）。

## Risk

Risk: R3

## Contracts Under Test

- 73 UI-10-D10 の段落・§73.6: 一覧の「最終カウント」は効く計数の業務日 `count_business_date`。`actual_count` が null か業務日が null なら「—」。保存の時刻へ戻さない。
- 73 冒頭の D-118 の節「今の数を入れる」: route の `product` が外れても欄は残り、その商品の保存の成功で閉じて `/stocktake/` に留まる。途中の読込みの応答は捨てる。別の商品へ変わった欄は閉じない（b1 のまま）。
- 51 の D-118 の節の 2: `recount_required` の案内は「POS販売で在庫を減らす」の欄の直下、見出し「「POS販売で在庫を減らす」にできません」と 51 の文、BIZ の message を出さない（型で分岐）、案内の領域へ focus、「今の数を入れる」の導線の search は b1 のまま。

## Failure Modes

- 一覧が保存の時刻（`counted_at`）を出し続ける、または未入力の行・業務日の無い行に日付・時刻が出る。`actual_count` 0 を未入力と取り違える。
- route の `product` が外れた後に、欄の商品の保存が閉じ待ちのまま閉じない（backlog の不具合）。直しすぎて、外れた時点で欄を閉じる（未保存の入力を失う）、別の商品の欄を閉じる。
- 商品フォームが BIZ の message をそのまま出す（「在庫連動」が残る）、案内が上部に残る・2 つ出る、focus が移らない・導線の button に移る（Enter で離れる）。

## Test Matrix

- oracle の値は 73・51 の文と合成の fixture の値から取り、実装の定数から取らない。商品フォームの mock の `message` は BIZ の文（30）にし、画面の文（51）と違う値にする（画面が message を出すと SF2 が赤になる）。
- 一覧の fixture は `counted_at` と `count_business_date` に違う日付を置く（時刻を出す実装と業務日を出す実装を見分ける）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| UI-10-D10（業務日を出す） | 保存の時刻を出す | RTL | `StocktakePage.test.tsx` の `SF1 (T16) list shows the effective count's business date in the last-count column, blank for uncounted items (UI-10-D10)`（T16 を書き換える。差異 `+3` と在庫 `12`・`10` が無いことの assert は保つ） | 計数済みの行（`actual_count` 9、`counted_at` `2026-10-01T09:05:00`、`count_business_date` `2026-09-28`）に `2026-09-28` が出ない、または `2026-10-01 09:05:00` が出る |
| 同（未入力は「—」） | 未入力の行に業務日を出す | RTL | 同じ test | 未入力の行（`actual_count` null、`count_business_date` `2026-09-20`）に `2026-09-20` が出る、「—」が 2 つでない |
| 同（0 は計数） | `actual_count` 0 を未入力と扱う | RTL | 同じ test | `actual_count` 0・`count_business_date` `2026-09-27` の行に `2026-09-27` が出ない |
| 同（時刻へ戻さない） | 業務日が null の行で保存の時刻を出す | RTL | 同じ test | `actual_count` 4・`count_business_date` null・`counted_at` `2026-10-02T10:00:00` の行の最終カウントが「—」でない、または `2026-10-02 10:00:00` が出る |
| 51 D-118 の 2（文と型で分岐） | BIZ の message を出す、「在庫連動」が残る | RTL | `ProductFormPage.test.tsx` の `SF2 (U12) stock link start rejection names the POS field and offers the recount link (51)`（U12 を書き換える） | 案内の名（role `alert`、name「「POS販売で在庫を減らす」にできません」）が無い、51 の文が無い、mock の message（「連動しない間の売上があります。今の数を入れてから在庫連動にしてください」）が画面に出る、案内の中に `/在庫連動/` が出る、「今の数を入れる」で `onNavigateToStocktake({ product: "P-005", returnTo: "/products/P-005/edit" })` が呼ばれない、入力の checkbox が checked でない、toast・一覧への遷移が起きる |
| 51 D-118 の 2（場所と focus） | 上部に残る・2 つ出る・focus が移らない・button に移る | RTL | `ProductFormPage.test.tsx` の `SF3 recount notice renders right after the POS field inside the stock section and takes focus (51)` | 案内が `POS販売で在庫を減らす` の checkbox より DOM で前にある（`compareDocumentPosition` の FOLLOWING でない）、checkbox と同じ節（checkbox の `closest("section")`。`FormSection` は `section` を描く）の中に無い、同じ name の案内が 1 つでない、案内に focus が無い、「今の数を入れる」の button に focus がある |
| 73 D-118 の節（外れた後に保存して閉じる） | 照合が途中の別の商品のまま残り閉じない | RTL | `StocktakePage.test.tsx` の `SF4 count_now field for A closes on save after the route's product is removed while B loads (73)` | route `product` A で欄が開く → route を B（`previewStockCountPlacement` を解かない）→ route を `{}` → A の数を保存して、A の欄が閉じない、`onReturnTo` が呼ばれる、後から B の応答を解いて B の商品名が出る |
| 同（保存の保留中に外れて閉じる） | 閉じ待ちが実行されない | RTL | `StocktakePage.test.tsx` の `SF5 pending count_now save for A closes A's field after the route's product is removed while B loads (73)` | A の保存の応答を保留 → route を B（解かない）→ route を `{}` → この時点で A の欄が残っていない（外れた時点で閉じた）、または応答を解いた後に A の欄が閉じない、`onReturnTo` が呼ばれる |
| 同（別の商品の欄を閉じない） | 外れたときに閉じ待ちを商品の照合なしで実行する | RTL | `StocktakePage.test.tsx` の `SF6 pending count_now save for A keeps B's field after B loads and the route's product is removed (73)` | A の保存の応答を保留 → route を B（B の読込みが成功して B の欄が開く）→ route を `{}` → A の応答を解いて B の欄が閉じる |
| 73 D-118 の節（b1 の残りの契約） | S2 で既存の振舞いが変わる | RTL | 既存の U9 の 6 本（`rg -n 'it\("U9 ' src/features/stocktake/StocktakePage.test.tsx` → 1508・1571・1625・1760・1771・2456 行）を期待を変えずに | S2 が `settleStandaloneLoadFailure` の後始末・`handleStandaloneSaved` の閉じ方を変える |
| UI-USW-D1・D2（離脱の確認） | S3 で導線が guard を外す | RTL | 既存の `ProductFormPage.unsaved-guard.test.tsx` の `U12 recovery link passes through the unsaved-changes guard`（期待を変えない。button の名「今の数を入れる」と checkbox の label は変わらない） | 導線の位置を変えたときに route の遷移でなくなる |

### 既存の test の移し方

- 書き換える（oracle が変わる）: `StocktakePage.test.tsx` の `T16 list shows difference and last counted columns, blank for uncounted items (UI-10-D10)` → SF1（最終カウントの期待を 73 の新しい段落の値に。fixture に行 2 つを足す）。`ProductFormPage.test.tsx` の `U12 stock link start rejection shows recovery link` → SF2（見出しと文を 51 の新しい文に、mock の message が出ないことを足す）。
- 変えない: 上の 2 本以外の `StocktakePage.test.tsx`・`StocktakePage.suggest.test.tsx`・`ProductFormPage.test.tsx`・`ProductFormPage.unsaved-guard.test.tsx`・`stocktake-formatters.test.ts`（`formatCountedAt` は残る）。`git diff --stat` で上の 2 本と新しい SF3〜SF6 の外に test の差分が無いことを見る。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 「今の数を入れる」の欄（route の `product`） | route A で A の欄 | B の読込み中・A の保存の応答の保留 | A の保存の成功で閉じる（戻り先が無ければ留まる） | route の `product` が外れる（サイドバーの link） | 計数の保存の `stocktakeCountUpdate`（変えない） | もう一度 route A で開く（既存の effect） | 画面を開き直すと欄は無い（state だけ） | A の保存の失敗で欄に留まる（既存の U9 の失敗） | もう一度保存 | SF4〜SF6、U9 |
| 一覧の最終カウント | 未入力「—」 | — | 保存の後の再取得で業務日 | `stocktakeCountUpdate`（変えない） | 再取得の値をそのまま出す | — | — | 一覧の取得の失敗は今の Alert | 今の再試行 | SF1、T15 |
| 商品フォームの案内 | 出ない | 保存中 | 拒否で欄の直下に出て focus | 次の保存で一度消える（今の `recountRequired` の扱いを変えない） | — | 棚卸しから戻ると DB の値で開き、案内は出ない | — | 別の失敗は今の上部の error の Alert | もう一度保存 | SF2・SF3 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 計数の日付の表示（業務日） | `rg -n "count_business_date\|counted_at" src/features --glob '!*.test.*'`: `StocktakePage.tsx` の欄の文脈（`targetFromItem`・`loadStandaloneTarget`、前に保存した数）、一覧、`StocktakeRecordDetailPage.tsx`（`count_business_date ?? "—"`） | 一覧（S1） | 欄の文脈と記録の詳細は既に業務日 | SF1 |
| 欄の読込みの決着の後始末（照合を戻す・閉じ待ちを実行） | `StocktakePage.tsx` の `settleStandaloneLoadFailure` の呼出し 2（route の effect の catch、`openRecount` の catch） | route の `product` が外れた分岐（S2） | `openRecount` は route を見ないので外れる経路が無い | SF4〜SF6 |
| 拒否の案内を欄の近くに出す | 51 の D-118 の節の 1（共有 JAN の validation の field の近く）・2 | 2（S3） | 1 は BIZ の message（Non-scope） | SF2・SF3 |
| focus を案内へ移す | `ProductFormPage.tsx` の今の focus の扱い（無し）、`StocktakePage.tsx` の `window.setTimeout` の focus（UI-10-D11） | 案内の領域の `tabIndex={-1}` と `useEffect` の focus | — | SF3 |

## Negative Paths

- missing input: `count_business_date` null（SF1）。route の `product` が無い（SF4〜SF6）。
- invalid input: 該当なし（表示だけ。日付は BIZ が検査した値）。
- duplicate/ambiguous input: 同じ name の案内が 2 つ（SF3）。
- unknown reference: 該当なし。
- dependency missing: 途中の読込みの応答が届かない（SF4・SF5 は B の応答を解かない）。
- permission/write failure: 計数の保存の失敗（既存の U9 の失敗）。
- dry-run side effect: 該当なし。

## Boundary Checks

- threshold: 該当なし。
- null/default: `actual_count` null、`count_business_date` null（SF1）。
- empty/non-empty: 計数済みの行と未入力の行を同じ表に置く（SF1）。
- min/max: `actual_count` 0（SF1）。
- status/policy enum: `stocktake_recovery.code` `recount_required`（SF2）。
- wire type: `string | null` の業務日をそのまま出す。
- internal type: 該当なし。
- producer/consumer: BIZ の `item_detail` → 一覧（Packet の Boundary）。
- round-trip token: route の search の `product`・`returnTo`（形を変えない）。
- precision/range: 該当なし。
- cross-language parse: 該当なし。

## Compatibility Checks

- old schema/input: wire の形は変えない。
- new schema/input: なし。
- output order: 一覧の並びは変えない。
- optional field behavior: `ProductForm` の新しい prop は optional（登録の画面と他の呼出しは渡さない）。

## Data Safety Checks

- source-derived data: なし（合成の fixture）。
- generated outputs: なし（bindings・routeTree・traceability は変わらない）。
- secrets: なし。
- local-only files: L3 の dev の DB は repo に入れない。
- synthetic sample boundaries: 商品コード `P-005` 等の既存の合成の値。

## Main Wiring / Integration Checks

- helper connected to main path: S2 の後始末は `StocktakePage` の route の effect から呼ぶ（SF4〜SF6 は実際の `StocktakePage` を rerender で route を変えて描く）。
- output reaches manifest/report: 該当なし。
- effective config reaches runtime: 該当なし。
- CLI arg reaches implementation: 該当なし。

## Mutation-style Adequacy Questions

実装の commit で production 側だけに注入して赤を確かめる（PR の本文に結果を書く）:

| # | 注入 | 赤になる test |
|---|---|---|
| M1 | 一覧を `formatCountedAt(item.counted_at)` に戻す | SF1 |
| M2 | `actual_count === null` の条件を外す | SF1（未入力の行） |
| M3 | `item.actual_count ?` の truthy の判定にする | SF1（0 の行） |
| M4 | 業務日が null のとき `formatCountedAt(item.counted_at)` へ戻す | SF1（業務日 null の行） |
| M5 | 案内の文を `error.cmdError.message` にする | SF2 |
| M6 | 案内を `ProductForm` の外（上部）で描く | SF3 |
| M7 | focus の `useEffect` を外す | SF3 |
| M8 | focus を「今の数を入れる」の button へ移す | SF3 |
| M9 | S2 の分岐を外し、今の早い return に戻す | SF4・SF5 |
| M10 | route の `product` が外れたら欄を直ちに閉じる | SF5（外れた時点で残る assert）・SF6 |
| M11 | 外れたときに閉じ待ちを商品の照合なしで実行する | SF6 |

- mock の値を正本の値と違えたとき: SF2 の mock の message は BIZ の文で、画面の文と違う（M5）。
- invalidate/refetch の順: 変えない（`stocktakeCountUpdate`。T15・U15）。
- key branch の反転: M2・M3・M9。
- guard の撤去: M9・M11。
- 出力の field の欠落: M4。
- 出力の順: 該当なし。
- dry-run: 該当なし。
- JSON number の安全な整数の範囲: 該当なし（数を足さない）。
- state token の round-trip: route の `product` の外れ（SF4〜SF6）。

## Residual Test Gaps

- focus で画面が案内の位置まで移ることは jsdom では示せない（`toHaveFocus` まで）→ L3-2。
- Windows の WebView の表示の幅で一覧の日付の列が折れないか → L3-1。
