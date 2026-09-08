# Test Design Matrix: UI 磨き batch 3 の runtime 反映（⑮）

Plan Packet: [../2026-09-08-ui-polish-batch3-runtime.md](../2026-09-08-ui-polish-batch3-runtime.md)

## Risk

R3（説明セクション・記録ID列撤去・備考「—」・PriceHistory表構造化・記録状態Badge・単位表示統合の runtime 反映。operator が業務入力 4 画面 + 記録一覧 + 商品詳細で読む視覚表現を変更する。本 Matrix は DOM 契約〈文言・列構成・class/属性〉に限定し、実際の見た目の読みやすさは owner L3 が oracle）。

## Contracts Under Test

- SC1: `PageHeader.tsx` の `actions` 分岐が `subtitle`/`description` を描画する（catalog `:48` root-cause fix、RUNTIME2-D1）
- SC2: `PageHeader.tsx` の `subtitle`-only 分岐にも `description` が描画される
- SC3: `ReceivingPage.tsx:295`/`ManualSalePage.tsx:310`/`ReturnExchangePage.tsx:418`/`DisposalPage.tsx:285` の既存 `subtitle` 文言が画面に表示される
- SC4: `ProductImportPage.tsx`/`PluExportPage.tsx`/`BackupRestorePage.tsx` に function-design 60/67/68 の確定文言が `description` として表示される
- SC5: `SupplierManagementPage.tsx` の説明文が外側 sibling `<p>` ではなく `PageHeader` 内 `subtitle` として描画される
- SC6: `InventoryRecordsPage.tsx` の一覧から記録ID列（head+body）が撤去され 7 列になる
- SC7: `InventoryRecordsPage.tsx` の記録IDフィルタ入力欄（`:216-218`）が変更されず維持される（**F7 是正**: `getByLabelText("記録ID")` の query literal で確認、行番号には依存しない）
- SC8: `ManualSalePage.tsx:730`/`DisposalPage.tsx:684` の直近テーブルの記録ID列が変更されない（negative）
- SC9: `ReceivingPage.tsx:698` の備考が空のとき「—」+ truncate、値があるとき `title` 属性を持つ
- SC10: `ReturnExchangePage.tsx` の共有 `formatNote()` が「備考なし」ではなく「—」を返し、保存結果パネル（`:475`）と直近テーブル（`:981`）の両方に反映される
- SC11: `ManualSalePage.tsx` に備考列が追加されない（negative、DTO 制約）
- SC12: `MovementTable.tsx:93-95` が truncate から折り返し（`whitespace-normal break-words`）へ変わり、note があるとき `title` 属性を持ち、無いとき `title` 属性を持たない
- SC13: `ReturnRecordDetailPage.tsx:57` の `formatNote` が「備考なし」ではなく「—」を返す
- SC14: `ReceivingPage.tsx`/`ManualSalePage.tsx`/`ReturnExchangePage.tsx`/`DisposalPage.tsx` の「直近の○○」section に「直近 {N} 件の…」文言が付く（N=10/5/10/10）
- SC15（**F5, Opus P2-3 / Sonnet P2-1, CHANGE**）: `PriceHistorySection.tsx:43` の説明文が `limit` state から動的に導出され、初期状態「直近 10 件の売価・原価の変更を新しい順に表示します。」、`:82-93`「すべて表示」button クリック後は「直近 100 件の売価・原価の変更を新しい順に表示します。」に切り替わる（固定文字列ではない）
- SC16: `PriceHistorySection.tsx` が `<ul>/<li>` から `<Table>`+`TableHead`（変更日時/売価/原価）へ変わり、既存の売価/原価 old→new 情報が維持される
- SC17: `ManualSalePage.tsx:725` の内側二重枠（`<div className="rounded-md border">`）が外れる
- SC18: `ManualSalePage.tsx:749` が `<Badge variant="outline">{formatRecordStatus(...)}</Badge>` へ統一される
- SC19（**F15, Opus P3-5, CHANGE**）: 9 箇所のローカル `formatQuantity`（+ `StocktakeRecordDetailPage.tsx` の signed/optional 変種）が削除される。単位列が別途ある 3 site（`ManualSalePage.tsx:610`/`DisposalPage.tsx:514`/`ReturnExchangePage.tsx:834`）は数値のみ（`toLocaleString("ja-JP")`）になり、それ以外の 9 site は `formatStockDisplay`/`formatStockUnitLabel` を使い unit code（`pcs`/`cm`）が日本語ラベルへ翻訳される
- SC20: `01-decision-rules.md:435` の「現状〈本 PR 時点〉は記録IDを含む 8 列…」という stale 注記が是正され、decision 本体 (b) は変更されない
- SC21（**F1, Opus P1-1, CHANGE / G3, G4 追加**）: catalog `:48`/`:191` の現在形 gap 文（「現状排他である」「計 5 画面が影響」「現状 truncate のみで title を欠くため是正対象」）が「何を・どの PR で・どう解消したか」を述べる反映済み文へ書き換えられる（追記ではなく書き換え）。**F13 追加**: `:191` の `OperationLogsPage.tsx:522` 引用も `:533` へ訂正される。**G3 追加**: `:48` の 4 画面 anchor（`ReceivingPage.tsx:288-291`等）も実測行（`:295` 等、+7 drift）へ訂正される。**G4 追加**: `:46` の未来形「runtime lane で移行する」が「本 PR（⑮）で移行済み」へ書き換えられる
- SC22（Coordinator adjudication 2026-09-08、Q1）: `formatStockDisplay` が `pcs`/`cm` 両分岐で `quantity.toLocaleString("ja-JP")` を使い、`(1234, "pcs")`=「1,234 個」・`(10, "pcs")`=「10 個」（既存契約不変）・`(300, "cm")`=「300 cm」（既存契約不変）の 3 ケースを独立 literal で持つ。既存 4 canonical 呼び出しサイト（`ProductTable.tsx:79`/`ProductListTable.tsx:88`/`StockMovementsPage.tsx:124-127`/`StockDetailContent.tsx:81-84`）にも桁区切りが反映される
- SC23（**G5, Opus P3-1 / Sonnet P2-1 追加 / F9 是正 / K2, Opus P3-2 是正**）: `01-decision-rules.md:435`（`InventoryRecordsPage.tsx:342`〈記録日時、file 名付き〉/ 裸の `` `:339` ``〈代表商品〉/ 裸の `` `:336-343` ``）と `:443`（file 名付き `InventoryRecordsPage.tsx:336-343`）の anchor が S4 の記録ID列撤去に伴い実装後の実測行へ更新される（decision 本体 (b) は変更しない）

## Failure Modes

- `PageHeader.tsx` の修正が `actions` 分岐に留まらず、`subtitle`-only 分岐や外側 `<header>` の class まで変えてしまい `PageHeader.test.tsx:61-73` が red になる
- S2/S3 の新規 `description`/`subtitle` が意図しない画面（説明のない画面）にまで波及する
- `InventoryRecordsPage.tsx` の記録ID列撤去が `ManualSalePage.tsx`/`DisposalPage.tsx` の直近テーブルやフィルタ入力欄まで巻き込む
- `ManualSalePage.tsx` に存在しない `note` フィールドを参照してランタイムエラーになる、または型エラーを無視して `any` キャストで押し通す
- `ReturnExchangePage.tsx` の `formatNote()` 変更が保存結果パネルまたは直近テーブルの片方にしか反映されない（共有関数のはずが個別に直書きされる）
- `MovementTable.tsx` の `title` 属性が note が空のときも出てしまう（`title=""` や `title={undefined}` 以外の空文字列）
- `PriceHistorySection.tsx` の Table 変換で並び順（新しい順）や old→new の表示形式が崩れる
- `ManualSalePage.tsx:749` の Badge 化で `formatRecordStatus` の呼び出し引数や中立 tone が変わる
- 9 箇所の `formatQuantity` 統合で、unit 翻訳以外に数値そのもの（桁・符号）が変わる、または `StocktakeRecordDetailPage.tsx` の signed/optional ケースで符号・`—` fallback が壊れる
- `01-decision-rules.md:435` の状態更新で decision 本体 (b) の文言まで書き換えてしまう
- `formatStockDisplay` の `toLocaleString("ja-JP")` 追加漏れ、または既存の `(10, "pcs")`=「10 個」/`(300, "cm")`=「300 cm」契約を壊してしまう（Coordinator adjudication、Q1）

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 PageHeader actions+subtitle/description | subtitle/description 未描画 | unit（`PageHeader.test.tsx` 拡張） | SC1: `actions`+`subtitle`+`description` を同時指定すると `header` が `flex` class を持ち、両方の文言が `getByText` で解決できる | `actions` 指定時に `subtitle`/`description` が描画されない |
| SC2 PageHeader description（no actions） | description 未描画 | unit（`PageHeader.test.tsx` 拡張） | SC2: `subtitle`+`description`（`actions` なし）で `header` が `space-y-1` を持ち、両方の文言が解決できる | `description` 単独指定で描画されない |
| SC3 4 画面 subtitle 復活 | subtitle 非表示のまま | unit（`ReceivingPage.test.tsx`/`ManualSalePage.test.tsx`/`ReturnExchangePage.test.tsx`/`DisposalPage.test.tsx` 拡張） | SC3: 各画面で既存 `subtitle` 文言（例: 「届いた商品をまとめて入庫し、在庫へ反映します」）が `getByText` で解決できる | 4 画面のいずれかで文言が解決できない（起票時実測で該当テストが存在しないことを確認済み、空集合オラクル回避のため必ず正の文言一致） |
| SC4 説明セクション 3 画面 | description 未反映 / 文言相違 | unit（`ProductImportPage.test.tsx`/`PluExportPage.test.tsx`/`BackupRestorePage.test.tsx` 拡張） | SC4: 各画面で 60:102/67:123/68:147 の確定文言（冒頭文）が `getByText` で解決できる。**（F17 追加）** `rg -Fc` で function-design 側の文言と tsx 側の文言が一致することを docs-oracle で機械検証する | 文言が未反映、または function-design と異なる文言が使われる |
| SC5 SupplierManagementPage header 内描画 | 外側 sibling のまま | unit（`SupplierManagementPage.test.tsx` 拡張） | SC5: 説明文が `within(screen.getByRole("banner"))`（または `PageHeader` の `<header>` を指すクエリ）で解決できる | 説明文が `PageHeader` の外側に残る |
| SC6 記録ID列撤去 | 列残存 | unit（`InventoryRecordsPage.test.tsx` 拡張） | SC6: `getAllByRole("columnheader")` のテキスト配列が `["種別","業務日付","代表商品","明細数","状態","記録日時","操作"]`（7 列、記録IDなし）と一致する | 記録ID列が残る、または他の列が誤って削除される |
| SC7 フィルタ欄維持（**F7 是正**） | 誤削除 | unit（`InventoryRecordsPage.test.tsx` 既存 2 箇所〈`getByLabelText("記録ID")` query literal で参照、⑭ S5 の書き換えで行番号がずれるため `:315`/`:891` の行番号は使わない〉、無変更で pass 確認） | SC7: `getByLabelText("記録ID")` が引き続き解決できる | フィルタ入力欄が誤って削除される |
| SC8 直近テーブル記録ID列不変（negative） | 誤って撤去される | unit（`ManualSalePage.test.tsx`/`DisposalPage.test.tsx` 拡張、negative） | SC8: 各直近テーブルで `getByText("記録ID")`（列見出し）が引き続き解決できる | 記録ID列が誤って撤去される |
| SC9 ReceivingPage 備考「—」+ title | 「—」欠落 / title 誤り | unit（`ReceivingPage.test.tsx` 拡張） | SC9: note が空のとき `getByText("—")` が解決でき `title` 属性を持たない、note があるとき `title` 属性の値が note と一致する（対で確認、空集合オラクル回避） | 「—」が出ない、または title の有無が逆になる |
| SC10 ReturnExchangePage formatNote 共有反映 | 片方のみ反映 | unit（`ReturnExchangePage.test.tsx:261,278` 拡張） | SC10: 直近テーブル region（`:261` 相当）と保存結果 region（`:278` 相当）の両方で `getByText("—")` が解決でき、`getByText("備考なし")` が 0 件になる | いずれか一方が「備考なし」のまま残る |
| SC11 ManualSalePage 備考列非追加（negative） | 誤って追加される | unit（`ManualSalePage.test.tsx` 拡張、negative） | SC11: 直近テーブルのヘッダーに「備考」列が存在しない（`queryByText("備考")` が該当テーブル内で null） | 存在しない DTO field を前提に備考列が追加される |
| SC12 MovementTable 折り返し + title | truncate 残存 / title 誤り | unit（`MovementTable` 消費先いずれかの test 拡張、例 `StockMovementsPage.test.tsx`） | SC12: 長い note で `whitespace-normal` class を持ち `truncate` class を持たず、`title` 属性が note と一致する。note が空のとき `title` 属性を持たない | truncate class が残る、または title が空値でも出る |
| SC13 ReturnRecordDetailPage formatNote | 「備考なし」残存 | unit（`OtherRecordDetailPages.test.tsx:263` 拡張） | SC13: `getByText("—")` が解決でき `getByText("備考なし")` が 0 件 | 「備考なし」のまま残る |
| SC14 4 画面「直近 N 件の」文言 | 文言欠落 / N 相違 | unit（各 page test 拡張） | SC14: 各画面で「直近 {N} 件の…」（N=10/5/10/10）が exact match で解決できる | 文言が無い、または N が実際の取得件数と異なる |
| SC15 PriceHistorySection 件数文言（**F5, CHANGE、対 oracle**） | 件数欠落 / 固定文字列のまま | unit（`ProductForm.test.tsx` 拡張） | SC15: (i) 初期状態で「直近 10 件の売価・原価の変更を新しい順に表示します。」が `getByText` で解決でき、(ii)「すべて表示」button クリック後「直近 100 件の売価・原価の変更を新しい順に表示します。」に切り替わることを対で確認する | 件数が入らない、固定文字列のまま残る、または button クリック後も「10 件」のまま変わらない |
| SC16 PriceHistorySection Table 化 | 列見出し欠落 / 情報欠落 | unit（`ProductForm.test.tsx` 拡張） | SC16: `getAllByRole("columnheader")` が `["変更日時","売価","原価"]` を含み、既存の `findByText(entry.changed_at)` 等の情報表示アサーションが継続して pass する | 列見出しが無い、または既存の売価/原価表示が失われる |
| SC17 ManualSalePage 二重枠除去（**F3, Opus P2-1 / Sonnet P1-1 是正**） | 枠残存 / 他テーブルまで誤って撤去 | unit（`ManualSalePage.test.tsx` 拡張、`rg` docs-oracle 併用） | SC17: `rg -Fo 'rounded-md border">' src/features/manual-sale/ManualSalePage.tsx \| wc -l` = 2（起票時 3〈`:538`商品候補一覧/`:590`入力行一覧/`:725`直近テーブル〉、撤去されるのは `:725` のみ）。加えて `ManualSalePage.test.tsx` に直近テーブルの `<Table>` が bordered `<div>` の直下にないことを確認する DOM assertion を追加する | `:725` の枠が残る、または `:538`/`:590` の枠まで誤って撤去される |
| SC18 ManualSalePage Badge化 | plain text 残存 | unit（`ManualSalePage.test.tsx` 拡張） | SC18: 状態セルが `getByRole` で `Badge`（`data-slot="badge"` 等）を持つ | plain text のまま残る |
| SC19 formatQuantity 統合（**F15, CHANGE**） | 統合漏れ / 翻訳誤り / 単位重複残存 | unit（9 file の各 test 拡張） | SC19: 単位列を持つ 3 site（`ManualSalePage.tsx`/`DisposalPage.tsx`/`ReturnExchangePage.tsx` の入力行テーブル）は数値のみ（単位なし）+ 隣接単位列に「個」/「cm」が対で確認される。それ以外の 9 site は `pcs`→「個」、`cm`→「cm」の翻訳が表示される。**（F12, hedge 削除）** `StocktakeRecordDetailPage.test.tsx`（実在）で符号付き（+/−）と `null`→「—」のケースが従来どおり機能する | unit code が生表示のまま残る、単位重複が残る、または符号・null fallback が壊れる |
| SC20 DSR-22 stale 注記是正 | 是正漏れ / 本体変更 | docs review（`rg -Fo … \| wc -l`、非 vitest、**G6 是正**: scalar 形） | SC20: `rg -Fo "記録IDを含む 8 列" docs/design-system/01-decision-rules.md \| wc -l` = 0（起票時 1）。decision 本体「(b) 一覧の表示列から外す」の文言は変更されない | stale 注記が残る、または (b) 決定文言が書き換わる |
| SC21 catalog gap 文書き換え + anchor 訂正（**F1, CHANGE / G3, G4 追加**） | 追記のみで旧文残存 / anchor 未訂正 | docs review（`rg -Fo … \| wc -l`、非 vitest、**G6 是正**: scalar 形） | SC21: `rg -Fo "現状排他である" docs/design-system/02-component-catalog.md \| wc -l` = 0 かつ `rg -Fo "計 5 画面が影響" docs/design-system/02-component-catalog.md \| wc -l` = 0 かつ `rg -Fo "は現状 truncate のみで" docs/design-system/02-component-catalog.md \| wc -l` = 0（起票時いずれも 1）。`rg -Fo "本 PR（⑮）で" docs/design-system/02-component-catalog.md \| wc -l` ≥ 2。**F13**: `rg -Fo "OperationLogsPage.tsx:522" docs/design-system/02-component-catalog.md \| wc -l` = 0（起票時 1）かつ `rg -Fo "OperationLogsPage.tsx:533" docs/design-system/02-component-catalog.md \| wc -l` ≥ 1。**G3**: `rg -Fo "ReceivingPage.tsx:288-291" docs/design-system/02-component-catalog.md \| wc -l` = 0（起票時 1、他 3 画面も同様）。**G4**: `rg -Fo "runtime lane で移行する" docs/design-system/02-component-catalog.md \| wc -l` = 0（起票時 1） | 旧 gap 文が残ったまま新文言だけ追記される（矛盾併存）、`:522` の stale citation が残る、4 画面 anchor が未訂正、または `:46` が未来形のまま残る |
| SC22 formatStockDisplay 桁区切り契約（Q1） | toLocaleString 欠落 / 既存契約破壊 | unit（`format-stock-display.test.ts` 拡張） | SC22: `formatStockDisplay(1234, "pcs")`=「1,234 個」、`(10, "pcs")`=「10 個」、`(300, "cm")`=「300 cm」の 3 ケースを独立 literal で確認する | 1234 のケースで桁区切りが付かない、または既存 2 ケースの表示が変わる |
| SC23 DSR-22 anchor 実測行更新（**G5 追加 / F9, G2, K2, K3 是正**） | 更新漏れ / 誤ったオラクル対象 | docs review（`rg -Fo … \| wc -l` + reviewer 実読、非 vitest） | SC23: **K2 是正**（`:435` の `:339`〈代表商品〉と `:336-343` は裸表記だが、`:342`〈記録日時〉は `InventoryRecordsPage.tsx:342` と file 名付きで書かれている — 3 つとも裸ではない）。**K3 是正、AC9 と同じ 4 オラクルへ**: `rg -Fo "InventoryRecordsPage.tsx:336-343" docs/design-system/01-decision-rules.md \| wc -l` = 0（起票時 1〈`:443` のみ〉）かつ `rg -Fo ":336-343" docs/design-system/01-decision-rules.md \| wc -l` = 0（起票時 2〈`:435`,`:443`〉）かつ `` rg -Fo ':339`' docs/design-system/01-decision-rules.md \| wc -l `` = 0（起票時 1）かつ `` rg -Fo ':342`' docs/design-system/01-decision-rules.md \| wc -l `` = 0（起票時 1）。新引用が実装後の実際の head 行番号と一致することは Final Review が `rg -n` 実測で確認する（pre-implementation では正確な新番号を確定できないため機械 oracle 化不能） | 旧 anchor が残る、または新 anchor が実装後の実測行と一致しない |

Mandatory oracle rule（全 SC 共通）: 文言一致は `getByText`/`rg -Fc`（literal match）を優先し、正規表現の意図しないマッチを避ける。列構成の確認は `getAllByRole("columnheader")` の配列 exact match を使い、部分一致（`toContain` 等）に頼らない。

## State Lifecycle Matrix

not applicable — 本 lane は静的な文言・DOM 構造（PageHeader props、テーブル列、formatter 出力）の切替のみで、state machine・cache・route/search・import/export・retry・永続化 state を持たない。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `PageHeader` の `actions`+`subtitle`/`description` 併存 | `rg -n "<PageHeader" src/features` 全件 | `ReceivingPage.tsx`/`ManualSalePage.tsx`/`ReturnExchangePage.tsx`/`DisposalPage.tsx`（`subtitle` 復活）、`ProductImportPage.tsx`/`PluExportPage.tsx`/`BackupRestorePage.tsx`（`description` 新設）、`SupplierManagementPage.tsx`（`subtitle` へ migrate） | `HomePage.tsx`（`subtitle` のみ、`actions` なし、現状維持） | 各 page test 拡張 |
| 備考「—」+ truncate/wrap + title | `rg -n "備考なし|note \?\?" src/features --glob '!*.test.*'` | `ReceivingPage.tsx:698`、`ReturnExchangePage.tsx:110-113`（共有）、`MovementTable.tsx:93-95`、`ReturnRecordDetailPage.tsx:57` | `ManualSalePage.tsx`（DTO に note なし）、`DisposalPage.tsx`（note フィールドなし） | AC6 + 各 page test |
| ローカル `formatQuantity` → canonical（**F15, CHANGE**） | `rg -c "function formatQuantity" src --glob '!*.test.*'`（9 file） | 9 site（`formatStockDisplay`、単位列なし） + 3 site（`toLocaleString("ja-JP")` のみ、単位列あり） | なし（全数移行、signed/optional 変種は `StocktakeRecordDetailPage.tsx` にローカル薄ラッパーとして残す） | AC8 rg + 各 detail page test |
| 記録ID列（種別横断 vs 種別固定） | `rg -n "記録ID" src/features/inventory-records src/features/manual-sale src/features/disposal --glob '!*.test.*'` | `InventoryRecordsPage.tsx`（撤去） | `ManualSalePage.tsx`/`DisposalPage.tsx` の直近テーブル（種別固定のため一意性の理由が当たらない、Non-scope） | AC5 + SC8 negative |

## Negative Paths

- missing input: 該当なし（フォーム入力の必須/任意チェックは変更しない）
- invalid input: 該当なし
- duplicate/ambiguous input: 該当なし
- unknown reference: `ManualSalePage.tsx` が存在しない `note` field を参照しないこと（SC11 negative）
- dependency missing: 該当なし
- permission/write failure: 該当なし（UI 表示のみ、書込みなし）
- dry-run side effect: 該当なし

## Boundary Checks

- threshold: `formatQuantity` 統合後の 1000 以上の桁区切りは `formatStockDisplay` 自体の修正で機械的に保証する（SC22 の 1234 ケース、Coordinator adjudication Q1）。AC-L3-4 は見た目の自然さの確認のみに限定する
- null/default: `StocktakeRecordDetailPage.tsx` の `formatOptionalQuantity(null, unit)` が「—」を返すこと（既存契約、SC19 に含める）
- empty/non-empty: 備考が空文字/`null`/`undefined` のとき「—」、非空のとき値そのものを表示（SC9/SC10/SC12/SC13）
- min/max: 該当なし
- status/policy enum: `formatRecordStatus` の 3 値（有効/取消済み/進行中）は本 packet で増減しない（Badge 化は表示形式のみの変更、SC18）。**（F4, Opus P2-2 追加）** `stock_unit` の値域は `docs/DB_DESIGN.md:94` の DB CHECK 制約（`IN ('pcs','cm')`）で 2 値に閉じており、`formatStockDisplay` の fallback「—」分岐は実データでは到達不能（許容、新規 guard 不要）
- wire type: 該当なし
- internal type: `InventoryRecordSummary` DTO に `note` field が無いこと自体が SC11 の前提（型定義を変えない）
- producer/consumer: 該当なし
- round-trip token: 該当なし
- precision/range: 該当なし
- cross-language parse: 該当なし

## Compatibility Checks

- old schema/input: 該当なし（DTO 変更なし）
- new schema/input: 該当なし
- output order: `PriceHistorySection.tsx` の Table 変換後も新しい順の並びが維持されること（SC16）
- optional field behavior: `PageHeader` の `description`/`subtitle` は既定 `undefined` で描画されないフォールバックを維持する

## Data Safety Checks

- source-derived data: 該当なし
- generated outputs: 該当なし
- secrets: 該当なし
- local-only files: 該当なし
- synthetic sample boundaries: 該当なし

## Main Wiring / Integration Checks

- helper connected to main path: `formatStockDisplay` の import が 9 file すべてで既存の描画パスに正しく配線される。**（F14 是正）** `ReturnExchangePage.tsx`/`DisposalPage.tsx`/`ManualSalePage.tsx` は `formatStockUnitLabel` を既に import 済みのため再追加しない — この 3 file は `formatStockDisplay` のみ新規、残り 6 file は `formatStockDisplay` を新規 import する（新設 wiring なし、既存 import パターンの横展開）
- output reaches manifest/report: 該当なし
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- `PageHeader.tsx` の `actions` 分岐から `description` の描画を外したら、SC1 が fail するか
- `subtitle`-only 分岐から `description` の描画を外したら、SC2 が fail するか
- `ReceivingPage.tsx` の `subtitle` prop を削除したら、SC3 が fail するか
- `InventoryRecordsPage.tsx` の記録ID列を削除し忘れたら（head だけ、または body だけ削除）、SC6 が fail するか（head/body 両方を個別に確認する構造になっているか）
- `ManualSalePage.tsx`/`DisposalPage.tsx` の直近テーブルの記録ID列を誤って削除したら、SC8（negative）が fail するか
- `ReturnExchangePage.tsx` の `formatNote()` を「備考なし」のまま残し、保存結果パネル側だけ直書きで「—」に変えたら、SC10 の対アサーション（両方 region を確認）が fail するか
- `MovementTable.tsx` の `title` 属性を note の有無に関わらず常に出すように変えたら（空文字 `title=""` を出す mutant）、SC12 の negative 側（title 属性を持たない確認）が fail するか
- `formatStockDisplay` への置換時に unit 翻訳を忘れて raw unit code を残したら、SC19 が fail するか
- `StocktakeRecordDetailPage.tsx` の `formatSignedQuantity` の符号ロジックを壊したら（例: 0 のとき `+0` を出す mutant）、SC19 が fail するか
- `formatStockDisplay` の `toLocaleString("ja-JP")` を `String(quantity)` へ戻したら（桁区切り retreat mutant）、SC22 の 1234 ケースが fail するか
- `ManualSalePage.tsx:538`/`:590`（対象外の 2 テーブル）の枠を誤って撤去したら、SC17 の scalar count（2 のまま維持を期待）が fail するか（F3）
- `PriceHistorySection.tsx` の「すべて表示」button を押しても `description` の件数文言が「10」のまま変わらなかったら、SC15 の対アサーション（ii）が fail するか（F5）
- `ManualSalePage.tsx:610`（単位列ありサイト）に誤って `formatStockDisplay`（単位付き）を使ってしまったら、隣接する単位列（`:651`）との重複表示になる — SC19 の該当 3 site 個別アサーションが fail するか（F15）
- `01-decision-rules.md:435`（`InventoryRecordsPage.tsx:342`〈file 名付き〉/ 裸の `` `:339` ``/`` `:336-343` ``）と `:443`（file 名付き `InventoryRecordsPage.tsx:336-343`）の引用を実装後も更新し忘れたら、SC23 の `rg -Fo | wc -l` = 0 オラクルが fail するか（**F9/G2/K2 是正**）
- `01-decision-rules.md:435` の状態更新で decision 本体「(b) 一覧の表示列から外す」の文言まで書き換えてしまったら、SC20 の「本体は変更されない」確認は reviewer 実読でのみ検出できるか（`rg` は stale 注記の消滅のみ検出、本体文言の同一性は machine oracle 化しにくい）
- If tracked Workflow State stores the current PR HEAD, does a state commit make it stale immediately? — 本 packet の Workflow State は `Reviewed Content HEAD: pending` のままで PR HEAD を書かない（D-035 準拠）
- If a hosted URL/headSha is committed after the run, does the merge three-point check fail because PR HEAD changed? — 該当は Ready 化以降（本 packet は plan-draft、非該当）
- If a state-only commit edits Scope/AC in the same packet file, does hunk-level review reject it even though the filename is allowlisted? — 該当は独立レビュー以降
- If output order changes, which test fails? — SC16（PriceHistorySection 新しい順）
- If dry-run performs a side effect, which test fails? — not applicable
- If a JSON number crosses JavaScript safe integer range, which test fails? — not applicable
- If a state token is round-tripped through browser/client code, which test fails? — not applicable

## Residual Test Gaps

- 桁区切りの正しさ自体は SC22 で機械保証されるため Residual Gap ではない（Coordinator adjudication Q1 で解消）。残るのは「1,234 個」の見た目が業務データとして自然かという主観的評価のみで、owner Windows native L3（AC-L3-4）が唯一の oracle
- `01-decision-rules.md:435` の decision 本体 (b) が変更されていないことの確認は、stale 注記の消滅を `rg` で機械確認できても、本体文言の同一性そのものは reviewer 実読に依存する（構造的限界、`git diff` の hunk 範囲確認で補完）
- `PageHeader` の `description`/`subtitle` co-render の実際の視覚間隔（catalog `:46` の `space-y-1` グループ内の見え方）は happy-dom のクラス確認に留まり、実際の余白の見やすさは owner L3（AC-L3-1/2）に委ねる
- **（F9 追加）** `01-decision-rules.md:435`/`:443` の `InventoryRecordsPage.tsx` anchor は S4 の列撤去で実測行番号が動くが、正確な新番号は実装 diff 確定後にのみ判明するため plan 段階では機械 oracle 化できない。SC23 は旧 anchor の消滅のみを機械確認し、新 anchor が実際の行番号と一致しているかは Final Review の `rg -n` 実測 + reviewer 実読に依存する
