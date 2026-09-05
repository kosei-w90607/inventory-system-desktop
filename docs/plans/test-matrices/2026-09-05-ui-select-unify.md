# Test Design Matrix: native `<select>` → shadcn `Select` 統一（⑧）

Plan Packet: [../2026-09-05-ui-select-unify.md](../2026-09-05-ui-select-unify.md)

## Risk

R3（10 画面 16 箇所の native `<select>` を shadcn `Select` へ置換。開閉・選択操作の挙動自体が変わる operator workflow 変更）。render の実際の見た目・キーボード操作の実利用感は happy-dom で完全には判定できないため L3 が oracle、本 Matrix は DOM 契約（要素種別・値の往復・sentinel 変換・grouping・per-row 独立性）に限定する。

## Contracts Under Test

- SC1: `DisposalPage.tsx:509` 種別 per-row select が `Select` に置換され、他行へ波及せず（L8-D3）、`disabled={isFormLocked}` が `SelectTrigger` に保持される（round 2 P2-2）
- SC2: `ManualSalePage.tsx:429` 理由 select が `Select` に置換される
- SC3: `ReceivingPage.tsx:393` 取引先 select が `Select` に置換され、`"none"` sentinel が `null` に写像される（L8-D1）
- SC4a: `InventoryRecordsPage.tsx:165` 記録種別 select が `Select` に置換され、既存 `"all"` sentinel がそのまま機能する
- SC4b: `InventoryRecordsPage.tsx:232` 部門 select が `Select` に置換され、既存 `"all"` sentinel が機能し、かつ実在部門選択の numeric ID round-trip（`String()`/`Number()`、trigger 表示は `department.name` そのまま、suffix なし）が壊れない（L8-D5、Plan Review round 1 P1-4）。既存 `:312` `toHaveValue("2")` を round-trip assertion へ書き換える（round 2 P1-2）
- SC4c: `InventoryRecordsPage.tsx:254` 状態 select が `Select` に置換され、既存 `"all"` sentinel がそのまま機能する。既存 `:314` `toHaveValue("active")` を書き換える（round 2 P1-2）
- SC5: `StockUnitField.tsx:51` 数量単位 select が `Select` に置換され、隣接 checkbox は不変
- SC6: `PriceRevisionFilters.tsx:45` 取引先 select が `Select` に置換され、`"all"` sentinel が `undefined` に写像される（L8-D1）。囲み `<label>` を `<label htmlFor>` + `SelectTrigger id` の分離形へ変換し（L8-D7、round 2 P3-4、`htmlFor=`/`id=` を別々に検査、round 3 P1）、`disabled={suppliersQuery.isLoading}` を保持する（round 2 P2-2）。`CreateSupplierDialog` 経由の auto-select（`:133-140`）は numeric ID round-trip 契約の対象で、`onPatch` は observable でないため `PriceRevisionPage.test.tsx:539` は `await waitFor(() => expect(mockSearchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ supplier_id: 44 })))` で検証する（round 3 P1 是正、`priceRevisionSearch.ts:128` の `supplier`→`supplier_id` 写像経由）
- SC7: `StockMovementsPage.tsx:167` 種別 select が `Select` に置換され、既存 `"all"` sentinel がそのまま機能する
- SC8a: `ProductForm.tsx:274` 部門 select が `Select` に置換され、常時 controlled（`value={departmentId === null ? "" : String(departmentId)}`、round 2 P1-1 是正）+ placeholder 方式（sentinel item なし）で `FieldError` 表示が不変（L8-D2）、かつ実在部門選択の numeric ID round-trip（`code_prefix !== null` 部門の「（独自コード可）」suffix 込みの表示テキストを含む、round 2 P3-3）が壊れない（L8-D5）
- SC8b: `ProductForm.tsx:297` 取引先 select が `Select` に置換され、`disabled={supplierWarning !== null}` が `SelectTrigger` に保持され（round 2 P2-2）、`"none"` sentinel が `null` に写像され、実在取引先選択の numeric ID round-trip が壊れない（L8-D1, L8-D5）。自動選択された取引先の ID 一致は表示テキストでなく、`renderStateful` 内で hoist した `const onValuesChange = vi.fn()` を `(next) => { onValuesChange(next); setValues(next); }` 経由で実 state 更新と両立させ（`vi.fn(setValues)` を `Harness` 内に inline すると test scope から参照できないため、round 3 P1 で是正）、戻り値に含めて呼び出し側で `expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: 44 }))` を assert する（Plan Review round 1 P2-9、round 2 P2-1、round 3 P1 で具体化）
- SC8c: `ProductForm.tsx:413` 税率 select が `Select` に置換される（sentinel 不要）
- SC9: `OperationLogsPage.tsx:378` 種別 select が `Select` に置換され、`"all"` sentinel が `undefined` に写像され、`<optgroup>` カテゴリ分けが `SelectGroup`/`SelectLabel` で維持される。すべての option 存在確認は trigger を開いた状態で行う（Plan Review round 1 P1-2、Radix は閉状態で `role="option"` を生成しない）
- SC10a: `ReturnExchangePage.tsx:524` 種別 select が `Select` に置換される（sentinel 不要）
- SC10b: `ReturnExchangePage.tsx:704` 追加方向 select が `Select` に置換され、条件描画を撤去して「戻り」「渡し」を常時 2 件描画、到達不能性は `disabled` に一本化する（L8-D6、Plan Review round 1 P1-3）。enabled（exchange）側でのみ両 option を assert、disabled（return）側は trigger の disabled 状態のみ assert（選択肢構成は L3-only）
- SC10c: `ReturnExchangePage.tsx:823` per-row 方向 select が `Select` に置換され、他行へ波及しない（L8-D3）。option 条件描画の扱いは SC10b と同様（L8-D6）。既存 `ReturnExchangePage.suggest.test.tsx:105` `toHaveValue("out")` を書き換える（round 2 P1-2）
- SC11: DSR-23 が新設され、`01-decision-rules.md`/`README.md`/`UI_TECH_STACK.md` の DSR 列挙が同期する（docs review、非 vitest）
- SC12: catalog ④/⑨ に DSR-23 参照が追加される（docs review、非 vitest）
- SC13（Plan Review round 1 P1-5、round 2 P1-2 で拡充）: S4b/S4c/S6/S8a/S10 の select を別の入口・見落とし箇所から exercise する追加 test が置換後も pass する — `ProductFormPage.test.tsx:115,152`（部門 select、`userEvent.selectOptions` から書き換え）、`ProductFormPage.unsaved-guard.test.tsx:111`（同）、`ReturnExchangePage.suggest.test.tsx:97-98,105`（種別/追加方向/per-row 方向、`fireEvent.change`/`toHaveValue` から書き換え）、`InventoryRecordsPage.test.tsx:312,314`（部門/状態、`toHaveValue` から書き換え）、`PriceRevisionPage.test.tsx:539`（取引先 auto-select、`toHaveValue` から `mockSearchProducts` の `supplier_id` 引数へ、round 3 P1）
- SC14（Plan Review round 1 P2-10 で追加）: Lane 5 が追加した token-contract regression test（`border-input`/`bg-control-surface` class assertion、10 file）が select 置換後も pass し続ける（`select.tsx` の `SelectTrigger` が同じ class を持つため）。対象一覧は Plan Packet 起票時実測「Lane 5 token-contract regression 一覧」参照

## Failure Modes

- 16 箇所のいずれかで native `<select>` が残る、または `SelectTrigger`/`SelectContent`/`SelectItem` に置換されない
- sentinel 変換箇所（`ReceivingPage`/`PriceRevisionFilters`/`OperationLogsPage`/`ProductForm` 取引先）で「すべて」「指定なし」「取引先なし」選択時の state が `null`/`undefined` にならない、または誤って実在 ID と衝突する値になる
- `ProductForm` 部門で偽の「選択してください」option が `SelectItem` として残る、または `FieldError` 表示が壊れる
- per-row select（`DisposalPage`/`ReturnExchangePage`）で片方の行の選択操作がもう片方の行の表示値に波及する
- `OperationLogsPage` のカテゴリ分けが `SelectGroup` 移行で失われる（フラットな選択肢リストになる）
- `aria-label`/`htmlFor` の関連付けが壊れ、既存 test の `getByLabelText`/`getByRole("combobox", {name})` が解決できなくなる
- DSR-23 / catalog 参照の旧表記が残る、または新表記が反映されない
- native `<select>` に `aria-label`/`htmlFor` を残したまま放置しても `getByRole("combobox", {name})` は native select にも解決するため、置換されていない mutation を見逃す（Plan Review round 1 P1-1）
- Radix は popover が閉じている間 `role="option"` を DOM に生成しないため、trigger を開かずに option の有無を確認する test は常に fail する、または閉状態の「存在しない」主張は常に真になり vacuous になる（Plan Review round 1 P1-2）
- disabled な trigger 配下の条件描画 option は開けないため検証できず、テストが「常に通る」か「常に落ちる」の either に固着する（Plan Review round 1 P1-3、ReturnExchangePage `:704,823`）
- `<form>` 内の Radix Select が残す aria-hidden bubble `<select>` を `document.querySelectorAll("select")` 等で誤検出し、native `<select>` が残っていないのに残っていると誤判定する（Plan Review round 1 P2-7）

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 DisposalPage per-row（L8-D3, P2-2） | native 残存 / 他行波及 / component 誤認 / disabled 退行 | unit（既存 `DisposalPage.test.tsx` 拡張） | SC1: 種別 select is a Select combobox per row (aria-label) with `data-slot="select-trigger"` and `tagName==="BUTTON"`, selecting a value in one row does not change another row's displayed value, `toBeDisabled()` when `isFormLocked` | `<select>` が残る（`tagName==="SELECT"` のまま `getByRole("combobox")` だけは解決してしまう mutation を含む）、他行の表示値が変化する、または `isFormLocked` 時に disabled が外れる |
| SC2 ManualSalePage | native 残存 / component 誤認 | unit（既存 `ManualSalePage.test.tsx` 拡張） | SC2: 理由 select is a Select combobox (getByLabelText via htmlFor) with `data-slot="select-trigger"`, selecting each option updates state | `<select>` が残る、または `data-slot` を持たない、または選択が state に反映されない |
| SC3 ReceivingPage sentinel（L8-D1） | sentinel 変換ミス / component 誤認 | unit（既存 `ReceivingPage.test.tsx` 拡張） | SC3: 取引先 select is a Select combobox with `data-slot="select-trigger"`、「指定なし」選択で supplierId が null になる、実在 supplier 選択で対応する number になる | `<select>` が残る、「指定なし」選択後も non-null、または number 変換が誤る |
| SC4a InventoryRecordsPage 記録種別 | native 残存 / component 誤認 | unit（既存 `InventoryRecordsPage.test.tsx` 拡張） | SC4a: 記録種別 select is a Select combobox (getByLabelText) with `data-slot="select-trigger"`、既存 "all" 選択が従来どおり機能する | `<select>` が残る、または "all" 選択で search state が変わらない |
| SC4b InventoryRecordsPage 部門（L8-D5） | native 残存 / numeric round-trip 破損 | unit（既存 `InventoryRecordsPage.test.tsx` 拡張） | SC4b: 部門 select is a Select combobox with `data-slot="select-trigger"`、既存 "all" 選択が従来どおり機能する。加えて実在部門を 1 件選ぶと trigger 表示がその部門名になり、かつ search state の departmentId が対応する number になる（round-trip） | `<select>` が残る、"all" 選択が壊れる、または実在部門選択で表示名と state の number のどちらかが対応しない（`String(null)` 等の文字列化ミスを含む） |
| SC4c InventoryRecordsPage 状態 | native 残存 / component 誤認 | unit（既存 `InventoryRecordsPage.test.tsx` 拡張） | SC4c: 状態 select is a Select combobox (getByLabelText) with `data-slot="select-trigger"`、既存 "all" 選択が従来どおり機能する | `<select>` が残る、または "all" 選択で search state が変わらない |
| SC5 StockUnitField | native 残存 / checkbox 誤変更 | unit（既存 `StockUnitField.test.tsx` 拡張） | SC5: 数量単位 select is a Select combobox with `data-slot="select-trigger"`; POS販売 checkbox class/role unchanged | select が置換されない、または checkbox が誤って変更される |
| SC6 PriceRevisionFilters sentinel（L8-D1, L8-D7, P1-2, P2-2） | sentinel 変換ミス / component 誤認 / disabled 退行 / auto-select round-trip 破損 | unit（既存 `PriceRevisionPage.test.tsx:539` 含む拡張） | SC6: 取引先 select is a Select combobox（`<label htmlFor="price-revision-supplier">` + `SelectTrigger id` の分離形、round 2 で `aria-label` から変更）with `data-slot="select-trigger"`、`toBeDisabled()` when `suppliersQuery.isLoading`、「すべての取引先」選択で normalized.supplier が undefined になる。`:539` の自動選択取引先は `onPatch` が observable でないため（round 3 P1）`await waitFor(() => expect(mockSearchProducts).toHaveBeenLastCalledWith(expect.objectContaining({ supplier_id: 44 })))` で検証する | `<select>` が残る、`isLoading` 時に disabled が外れる、「すべての取引先」選択後も undefined にならない、または自動選択後の `mockSearchProducts` 呼び出しの `supplier_id` が 44 以外 |
| SC7 StockMovementsPage | native 残存 / component 誤認 | unit（既存 `StockMovementsPage.test.tsx` 拡張） | SC7: 種別 select is a Select combobox with `data-slot="select-trigger"`、既存 "all" 選択が従来どおり機能する | `<select>` が残る、または "all" 選択で search state が変わらない |
| SC8a ProductForm 部門 placeholder（L8-D2, L8-D5, P1-1, P3-3） | 偽 option 残存 / FieldError 退行 / numeric round-trip 破損 / uncontrolled 切替の警告・空表示 | unit（既存 `ProductForm.test.tsx` 拡張） | SC8a: 部門 select is a Select combobox with `data-slot="select-trigger"`、常時 `value={departmentId === null ? "" : String(departmentId)}` で controlled（`ProductFormPage.tsx:74` の create-mode reset 後も再現）、"選択してください" を SelectItem として持たず SelectValue placeholder として表示、未選択時に FieldError が従来どおり表示される。`code_prefix !== null` の実在部門を 1 件選ぶと trigger 表示が `department.name + "（独自コード可）"` になり、かつ `update("departmentId", …)` へ渡る値が対応する number になる（round-trip） | "選択してください" が選択可能 option として残る、FieldError 表示が消える、reset 後に旧ラベルが残る/React 警告が出る、または実在部門選択で表示テキスト（suffix 込み）と渡された number のどちらかが対応しない |
| SC8b ProductForm 取引先 sentinel（L8-D1, L8-D5, P2-1, P2-2, P2-9） | sentinel 変換ミス / numeric round-trip 破損 / id ずれ検出不能 / disabled 退行 | unit（既存 `ProductForm.test.tsx:657` 拡張） | SC8b: 取引先 select is a Select combobox with `data-slot="select-trigger"`、`toBeDisabled()` when `supplierWarning !== null`、「取引先なし」選択で supplierId が null になる。自動選択された取引先（新規作成直後）は `renderStateful` 内で hoist した `const onValuesChange = vi.fn()` を実 setter と併用（`(next) => { onValuesChange(next); setValues(next); }`）し、戻り値経由で `expect(onValuesChange).toHaveBeenCalledWith(expect.objectContaining({ supplierId: 44 }))` で検証する（`Harness` 内 inline `vi.fn(setValues)` は test scope から参照できないため round 3 P1 で是正、`renderStateful` は submit しないため送信 payload は構成不能） | 「取引先なし」選択後も non-null、`supplierWarning` 時に disabled が外れる、または自動選択の supplierId が 44 以外（表示テキストのみの検証だと 1 id ずれても検出できない） |
| SC8c ProductForm 税率（P2-1） | native 残存 / component 誤認 | unit（既存 `ProductForm.test.tsx` 拡張） | SC8c: trigger を開いた状態で税率 select is a Select combobox with `data-slot="select-trigger"` with 3 options (10/8/0%) | `<select>` が残る、option 数が変わる、または trigger を開かずに option を数えて vacuous になる |
| SC9 OperationLogsPage grouping + sentinel（P1-2） | grouping 消失 / sentinel 変換ミス / 閉状態 option 誤判定 | unit（既存 `OperationLogsPage.test.tsx:192,511-521,524-533,535-547` 拡張） | SC9: 種別 select is a Select combobox with `data-slot="select-trigger"`。**trigger を `user.click` で開いた状態で** カテゴリごとに SelectGroup/SelectLabel でグルーピングされていること（`<optgroup>` 0 件）を確認し、「すべて」選択で operation_type が undefined になる。`:532`（削除された種別が候補に出ない）は開いた状態で対象 option が存在しないことと、他の実在カテゴリの option が最低 1 件存在することを対で確認する | `<select>` が残る、グルーピングがフラット化する、`<optgroup>` が残る、「すべて」選択後も undefined にならない、または trigger を開かずに option の有無を判定して vacuous になる |
| SC10a ReturnExchangePage 種別 | native 残存 / component 誤認 | unit（既存 `ReturnExchangePage.test.tsx:301,364` + `ReturnExchangePage.suggest.test.tsx:97` 拡張） | SC10a: 種別 select is a Select combobox with `data-slot="select-trigger"` | `<select>` が残る |
| SC10b ReturnExchangePage 追加方向（L8-D6, P1-3） | 条件描画の DOM 検証不能 / disabled 判定漏れ | unit（既存 `ReturnExchangePage.test.tsx:303` + `ReturnExchangePage.suggest.test.tsx:98` 拡張） | SC10b: 追加方向 select is a Select combobox with `data-slot="select-trigger"`。returnType="exchange"（enabled）の時は「戻り」「渡し」両方の option が存在することを開いた状態で確認する。returnType="return" の時は trigger が disabled であることのみ確認する（選択肢構成は L3-only） | `<select>` が残る、enabled 側で「渡し」option が欠落する、または disabled 側で trigger が開けてしまう |
| SC10c ReturnExchangePage per-row 方向（L8-D3, L8-D6） | 他行波及 / 条件描画の DOM 検証不能 | unit（既存 `ReturnExchangePage.test.tsx` 拡張） | SC10c: 方向 select は行ごとの Select combobox（aria-label）with `data-slot="select-trigger"`、一方の行の選択操作がもう一方の行の表示値に波及しない。SC10b と同様に enabled 側のみ選択肢構成を assert する | 他行の表示値が変化する、または disabled 側の選択肢構成を happy-dom で（誤って）assert しようとして test 自体が組み立て不能になる |
| SC11 DSR-23 新設 + 列挙同期 | 旧表記残存 | docs review（`rg -Fn`、非 vitest/cargo） | SC11: `01-decision-rules.md`/`README.md`/`UI_TECH_STACK.md` が `DSR-01〜22` 0 件・`DSR-01〜23` ≥ 1 件（対象 3 file 計）、`^## DSR-23 ` が 1 件 | 旧表記が残る、または新 DSR-23 heading が存在しない |
| SC12 catalog 参照追加 | 参照欠落 | docs review（`rg -Fn`、非 vitest/cargo） | SC12: `02-component-catalog.md` に `DSR-23` の言及が 2 件以上（④・⑨ 各 1 件以上） | 参照が 1 件以下 |
| SC13 追加 call-site / 見落とし test line（P1-5, round 2 P1-2） | 未更新の native select 前提が CI で fail | unit（`ProductFormPage.test.tsx:115,152`、`ProductFormPage.unsaved-guard.test.tsx:111`、`ReturnExchangePage.suggest.test.tsx:97-98,105`、`InventoryRecordsPage.test.tsx:312,314`、`PriceRevisionPage.test.tsx:539` 拡張） | SC13: 上記 file の部門/状態/種別/追加方向/per-row 方向/取引先 select 操作・assertion が `user.click(getByRole("combobox"))` → `user.click(getByRole("option"))`（操作）/ round-trip や payload 検証（値確認）へ書き換えられ pass する | `userEvent.selectOptions`/`fireEvent.change`/`toHaveValue` が native select 前提のまま残り、置換後に throw・no-op・または黙って無意味になる |
| SC14 Lane 5 token-contract regression（P2-10） | Lane 5 の class assertion が誤って壊れる | unit（Plan Packet「Lane 5 token-contract regression 一覧」記載の 10 file、無変更で pass 確認） | SC14: `border-input`/`bg-control-surface` class assertion が select 置換後も pass する（`describe`/`it` タイトルの改名のみ許容） | 対象 test が誤って削除される、または select 対象要素への assertion が消える |

Mandatory oracle rule（Plan Review round 1 P1-1, 全 SC 共通）: SC1〜SC10・SC13 の全 test は、上記「Would fail if」の挙動確認に加えて、対象要素が `data-slot="select-trigger"`（または `element.tagName === "BUTTON"`）を持つことを assert する。`aria-label`/`htmlFor` ベースの `getByRole("combobox", {name})`/`getByLabelText` だけでは native `<select>`（残存していても `role` が同じ場合がある）と shadcn `Select` を区別できないため、component identity の直接検査を必須とする。

Mandatory oracle rule（Plan Review round 2 P2-4, 全 SC 共通）: option の存在/不在を確認する SC（SC8c を含む全 SC）は、必ず `await user.click(getByRole("combobox", {...}))` で trigger を開いた状態で option を assert する。Radix は popover が閉じている間 `role="option"` を DOM に生成しないため、開かずに option を数える／存在を確認する test は fail するか vacuous になる（SC9 で個別に明記していた要件を全 SC 共通の rule として明文化、round 1 P1-2 の一般化）。

## Mutation Oracle Notes

- SC1/SC10c（per-row 独立性）は「行 A の選択操作 → 行 B の表示値」を明示的に確認する対のオラクルで、mutant「他行の値も同期して変わる」を検出する（Contract Probe〈L8-D3〉で happy-dom 環境の実現性は事前確認済み、本番 test では component 実装への mutation で確認する）
- SC3/SC6/SC8b/SC9 の sentinel 変換は「sentinel 選択 → state が null/undefined になる」ことに加えて「実在 ID 選択 → 対応する number/string になる」ことも同一 test 内で確認し、mutant「sentinel 判定が逆」「実在値も null に潰れる」の両方を検出する（空集合 oracle 禁止の趣旨）
- SC4b/SC8a/SC8b の numeric round-trip（L8-D5）は「表示テキストが名前になる」と「state/payload に渡る値が number になる」を同一 test 内の対で確認し、mutant「表示は合っているが渡す値が string のまま」「`String(null)` で `"null"` という架空 ID が発生する」を検出する（Plan Review round 1 P1-4）
- SC8a は「"選択してください" が SelectItem として存在しない」ことと「未選択時に FieldError が表示される」ことを両方確認し、mutant「偽 option が復活する」「バリデーションが外れる」の両方を検出する
- SC8b の自動選択取引先アサーションは表示テキストでなく送信 payload の `supplierId` 数値を直接検証する（Plan Review round 1 P2-9）。表示テキスト（取引先名）は id が 1 ずれても文字列が一致しないだけで気づきにくいが、payload の数値比較なら off-by-one を確実に検出する
- SC4a〜c/SC7 は「file 内の対象箇所すべて」を 1 test 内で列挙し、1 箇所でも native `<select>` を戻すと fail する構成にする（Lane 5 SC4a〜k の先例に倣う）
- SC9 は `SelectGroup` 移行後も既存カテゴリのラベル文言・所属 option が変わらないことを、既存 `<optgroup>` ベースの test 期待値から機械的に転記する（oracle を production の grouping 定義から独立して転記し、mutation 感度を自壊させない）。加えてすべての option 存在/不在確認は `user.click` で trigger を開いた状態で行い、negative（存在しないこと）は同じ open 状態での positive（他 option が最低 1 件存在すること）と対にする（Plan Review round 1 P1-2、Radix は閉状態で `role="option"` を生成しないため、開かずに negative だけを assert すると常に真になる vacuous oracle になる）
- SC10b/SC10c は disabled（return）側の option 構成を happy-dom で検証しようとしない（disabled trigger は開けないため構成を確認できず、条件描画を復活させる mutant も検出できない死んだ検査になる）。enabled（exchange）側の positive 確認と disabled 状態そのものの確認に絞ることで、「disabled 判定が外れる」「enabled 側の option が欠落する」という実際に happy-dom で観測可能な 2 種の mutant を確実に検出する（Plan Review round 1 P1-3, L8-D6）
- 全 SC の component identity 検査（`data-slot="select-trigger"`）は、native `<select>` 残置 + `aria-label`/`htmlFor` 温存という mutant（`getByRole("combobox")` 解決は native select でも成立するため behavior のみのオラクルでは kill できない）を検出するための追加必須項目（Plan Review round 1 P1-1）

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する（round 2 P3-2 で Ledger 側に SC13/L8-D7 行を追加、本節との対応を維持）。SC1〜SC10・SC13・SC14 は vitest、SC11/SC12 は `rg -Fn` の docs review オラクル（vitest/cargo ではない静的検査だが Plan Gate/Final Review の再検証対象として本 Matrix に明示した、Lane 5 SC6a/SC6b の先例に倣う）。
