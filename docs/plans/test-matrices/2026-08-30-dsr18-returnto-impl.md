# Test Design Matrix: DSR-18 戻り導線 returnTo 8 site + 共通 helper 実装

Plan Packet: [../2026-08-30-dsr18-returnto-impl.md](../2026-08-30-dsr18-returnto-impl.md)

## Risk

Risk: R3

## Contracts Under Test

- DSR-18 判定フロー: `/` 始まり かつ `//` 非始まり → returnTo 採用、それ以外（欠落含む）→ 呼出側指定 fallback。
- DSR-18 共通 helper: fallback 引数必須、detail 6 page のローカルコピー全廃、products 専用 `return-to.ts` は非緩和で独立存置。
- DSR-15: prefix 検証最低基準（外部 URL / protocol-relative `//` の拒否）。
- TRACE-D11: recent list / 保存結果 / 操作ログの各 link が search state を含む遷移元 URL を `returnTo` として送る。
- UI-02-D16 / UI-03-D22 / UI-04-D17: 保存結果 + recent list の「詳細を見る」が現在の作業画面 URL を送る（手動販売の保存結果は sale_id 非 null 条件付き）。
- UI-05-D17: 廃棄は recent list のみ producer、保存結果に詳細 link を追加しない。
- UI-11c-D16: 操作ログ「関連記録を見る」が `start_date` / `end_date` / `operation_type` / `page` を含む `/settings/logs` URL を送り、戻りで同じ調査 state を復元。
- 隣接 UI-11c-D5: 関連記録 link の押下が行展開 toggle を発火させない（既存挙動維持）。
- 隣接 DSR-17 分類② (a): 戻り導線は `<Link>` push のまま（`history.back()` 化しない）。
- packet D-B: `returnTo` 値は現在 location の href 由来（pathname + searchStr）。

## Failure Modes

- 8 site のいずれかで `returnTo` が未送信のまま残り、詳細の戻りが hub 固定になる（是正漏れ）。
- helper の検証条件落ちで `//evil.example` や絶対 URL が戻り先として採用される（open redirect 型）。
- fallback 引数が無視され全 page が固定 hub へ戻る、または fallback 自体が消えて欠落時に空遷移・crash する。
- detail page のローカル `normalizeReturnTo` が残存し、共通 helper と挙動が drift する。
- 操作ログの returnTo から期間・種別・page のいずれかが欠落し、調査 state が組み直しになる。
- 手動販売の保存結果 link が sale_id null でも表示される（条件の毀損）。
- 廃棄の保存結果へ詳細 link が誤追加される（UI-05-D17 違反）。
- 既存 producer 2 site（InventoryRecordsPage / MovementTable）や products flow の returnTo 挙動が壊れる。
- 関連記録 link 押下で行展開 toggle が発火する（UI-11c-D5 毀損）。

## Test Matrix

| ID | 対象 | 種別 | 検証内容 / oracle | Cite |
|---|---|---|---|---|
| T1 | `src/lib/return-to.ts` unit | 新規 | `/inventory/receiving` → そのまま採用 / `undefined`・`null`・空文字 → fallback / `//evil.example` → fallback / `https://evil.example` → fallback / fallback 引数 2 値（`/inventory/records`・`/settings/logs`）がそれぞれ返る（fallback 固定化 mutation 検出用に異なる 2 値で検証） | DSR-18 / DSR-15 / D-A |
| T2 | ReceivingPage recent list | 新規 | 「詳細を見る」link の search に `returnTo` が存在し、値が現在 location href と一致 | UI-02-D16 / D-B |
| T3 | ReceivingPage 保存結果 | 新規 | 保存成功後の result panel の「詳細を見る」が同様に `returnTo` を持つ | UI-02-D16 |
| T4 | ReturnExchangePage recent list | 新規 | T2 同型 | UI-03-D22 |
| T5 | ReturnExchangePage 保存結果 | 新規 | T3 同型 | UI-03-D22 |
| T6 | ManualSalePage recent list | 新規 | T2 同型 | UI-04-D17 |
| T7 | ManualSalePage 保存結果 | 新規 | sale_id 非 null → link あり + `returnTo` 付き / sale_id null → link なし（条件毀損の検出） | UI-04-D17 |
| T8 | DisposalPage recent list | 新規 | T2 同型。同 test 内で保存結果 panel に「詳細を見る」link が存在しないことも assert（誤追加検出、空集合 oracle 単独にしない） | UI-05-D17 |
| T9 | OperationLogsPage 関連記録 | 新規 | 期間・種別・page を非既定値に設定した状態で「関連記録を見る」link の `returnTo` が `/settings/logs?start_date=…&end_date=…&operation_type=…&page=…` を含む（4 param 個別 assert — 1 param 落ち mutation 検出用） | UI-11c-D16 / D-B |
| T10 | 往復 end-to-end（Contract Probe 兼務） | 新規 | memory history で search state 付き遷移元 → 詳細へ `<Link>` 遷移 → 「前の画面へ戻る」click → location が遷移元 URL（search 込み）へ復元。遷移が `<Link>` push であること（history 長の増加）も確認 | TRACE-D11 / DSR-17② (a) / DSR-18 |
| T11 | detail fallback | 新規 | returnTo なしで詳細を直接 render → 戻り先 href が `/inventory/records` / returnTo=`//evil.example` でも同様に fallback | DSR-18 / DSR-15 |
| T12 | 操作ログ link と行展開の独立 | 既存確認 or 新規 | 関連記録 link の click が行展開 state を変化させない（既存 test があれば regression 指定、なければ新規） | UI-11c-D5 |
| T13 | products / 既存 producer regression | 既存 | `src/features/products/lib/return-to.ts` の既存 regression test・InventoryRecordsPage / MovementTable / StockMovementsPage の既存 returnTo test が**無変更で** green（変更したら失敗定義に抵触）。packet Scope 8 列挙の producer test href 固定値アサート 9 箇所は T13 対象外 — 実装に伴う正当な更新対象（Plan Review round 1 P2 + 全 sweep 一般化） | DSR-18 存置 / TRACE-D11 |

## State Lifecycle Matrix

| 状態 | 遷移 | 検証 |
|---|---|---|
| 作業画面（search なし現況） | 詳細へ push → 戻り | T10（往復で URL 復元） |
| 操作ログ（search 4 param あり） | 詳細へ push → 戻り | T9 + T10（state 復元） |
| 詳細直接開き（returnTo 欠落） | 戻り | T11（fallback） |
| 詳細（returnTo 不正） | 戻り | T11（fallback、検証拒否） |
| 保存直後（result panel） | 詳細へ → 戻り | T3 / T5 / T7（returnTo が保存後の現在 URL） |

## Adjacent Pattern Audit

- 既存 returnTo producer 2 site（InventoryRecordsPage `buildDetailLinkProps` / MovementTable）は手組み直列化のまま非接触 — T13 で保護。
- StockMovementsPage の `detailReturnTo` 手組みも非接触（同上）。
- detail 6 page のうち CsvImport / Stocktake も共通 helper 化対象（受信側集約は 6 page 全部）だが、producer 側の静的入口追加は非目的。
- 61〜63 の保存成功時ページ先頭 scroll 契約は本変更と独立 — 既存 test regression で確認。
- producer 側既存 test の「詳細を見る」/「関連記録を見る」href 固定値アサート 9 箇所（packet Scope 8 に file:line 列挙）は、href に `?returnTo=…` が付くため更新が必要 — アサート更新のみ許可、test 削除・無効化・oracle の弱体化（`toContain` への安易な置換で record path 検証を失う等）は不可。

## Negative Paths

- `//` protocol-relative、絶対 URL、空文字、undefined → すべて fallback（T1 / T11）。
- sale_id null の手動販売保存結果 → link 非表示（T7）。
- 廃棄保存結果 → link 非存在（T8）。

## Boundary Checks

- returnTo 長さ: 操作ログ最長 URL は 100 文字未満 < searchSchema `max(500)`。境界超過時は `catch(undefined)` → fallback（schema 既存挙動、変更なし）。
- `/` 1 文字のみの returnTo: `/` 始まり + `//` 非始まりで採用され root へ戻る — 許容（app 内 path であり DSR-15 を満たす）。T1 に case 追加は Writer 裁量。

## Compatibility Checks

- returnTo なしの既存 deep link・bookmark → 従来どおり `/inventory/records` fallback（挙動不変、T11）。
- 既存 2 producer の returnTo 形式は不変（T13）。

## Data Safety Checks

- fixture は synthetic のみ（mock command 応答）。実店舗データ非使用。

## Main Wiring / Integration Checks

- T10 が render-with-router（実 routeTree + memory history）で producer → detail → 戻りの実配線を通す。
- AC2（ローカル normalizeReturnTo 0 件）と AC4（bindings diff ゼロ）は機械確認。

## Mutation-style Adequacy Questions

- helper の `//` 拒否を消したら？ → T1 / T11 が fail。
- fallback 引数を固定文字列にしたら？ → T1 の 2 値 fallback case が fail。
- ある site の returnTo 付与を外したら？ → 対応する T2〜T9 が fail。
- 操作ログ直列化から 1 param 落としたら？ → T9 の個別 assert が fail。
- detail の helper 呼出しを `value ?? fallback`（検証なし）にしたら？ → T11 の不正値 case が fail。

## 必須 mutation 注入（Final Review で clean tree 独立再実測、5 件）

| # | 注入 | kill 期待 |
|---|---|---|
| M1 | `src/lib/return-to.ts` の `!value.startsWith("//")` 条件を除去 | T1 / T11 |
| M2 | helper の fallback 引数を無視し `/inventory/records` 固定を返す | T1（`/settings/logs` fallback case） |
| M3 | ReceivingPage recent list の `search={{ returnTo }}` を除去 | T2 |
| M4 | OperationLogsPage の直列化から `page` を除去 | T9 |
| M5 | detail 側 helper 呼出しを検証なし `value ?? fallback` に置換 | T11（`//evil.example` case） |

## Residual Test Gaps

- WebView2 実機（browser history + sessionStorage 環境）での往復挙動は自動 test 対象外 — L3-1〜L3-3 で被覆。
- 視覚上のボタン配置・ラベル視認性は render oracle 不能 — L3。
