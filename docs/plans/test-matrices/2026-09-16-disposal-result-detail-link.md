# Test Design Matrix: ㉕ 廃棄・破損の保存結果に「詳細を見る」+ `returnTo`

Packet: `docs/plans/2026-09-16-disposal-result-detail-link.md`。file:line は origin/main `9d6799ff` で実測。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-UI05-D17-R1: 保存結果 panel の「詳細を見る」が現在の `/inventory/disposal` URL を `returnTo` として `/inventory/disposal/records/$recordId` へ送る（D-D1 / D-D2）
- UI-05-D17（recent list 側）: recent list の「詳細を見る」の href は不変
- DSR-18 consumer: `DisposalRecordDetailPage` の `returnTo` 正規化と fallback は不変（非接触）

## Failure Modes

- FM1: 保存結果に link が出ない（現行のまま）
- FM2: link は出るが `returnTo` を送らない（詳細の「前の画面へ戻る」が hub `/inventory/records` へ落ちる）
- FM3: link の `recordId` が保存した記録と違う（別記録の詳細へ飛ぶ）
- FM4: `idempotent_replay` の保存結果で link が出ない / 別挙動になる
- FM5: `resetForm`（続けて廃棄・破損）後も古い link が残る
- FM6: recent list の link や consumer の fallback に副作用が及ぶ

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SPEC-UI05-D17-R1 | FM1 / FM2 / FM3 | unit（RTL + 既存の `@tanstack/react-router` mock。`Link` が `to` / `params` / `search` から href を組み立てる、`:22-45`。実 router 配線は AC-L3-1） | T8' `DisposalPage.test.tsx` 「T8 UI-05-D17: saved disposal result links to the detail with returnTo」（`:334` の反転。保存結果 panel に scope し `href` = `/inventory/disposal/records/41?returnTo=%2Finventory%2Fdisposal`） | link 不在（FM1）、`?returnTo=` 欠落（FM2）、`/records/41` 不一致（FM3） |
| SPEC-UI05-D17-R1 | FM4 | unit | T8'-replay（任意、Writer 判断）: `idempotent_replay: true` の result でも同じ link。Writer が実装 diff に分岐が無いことを示せば review evidence で代替可 | replay 分岐で link を隠す実装 |
| SPEC-UI05-D17-R1 | FM5 | regression（既存） | `DisposalPage.test.tsx` の reset 系 test（`rg -n "続けて廃棄・破損" src/features/disposal/DisposalPage.test.tsx` で実在確認）: reset 後は `result === null` で panel ごと消える | panel 外に link を置いた実装 |
| UI-05-D17（recent list） | FM6 | regression（既存） | `DisposalPage.test.tsx:462-466`（href `/inventory/disposal/records/12?returnTo=%2Finventory%2Fdisposal`） | recent list の link を触った場合 |
| DSR-18 consumer | FM6 | regression（既存、非接触） | `DisposalRecordDetailPage.test.tsx:129` 「REQ-207 / T11 DSR-18: … returnTo %s を安全に %s へ正規化する」 | consumer を触った場合（AC4 で diff 0 も機械検査） |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 保存結果 panel の「詳細を見る」 | 非表示（`result === null`） | 保存中は panel なし | `result` 設定で表示、href = `/records/<record_id>?returnTo=<現在 href>` | `resetForm` で `result = null` → 非表示 | not applicable（link は query に依存しない） | 詳細から `returnTo` で戻ると page は再 mount、`result` は初期化（入庫・返品交換と同じ既知挙動、DSR-19 系は非目的） | app 再起動で初期状態 | 保存失敗時は panel なし（`saveError` Alert のみ） | 再試行で保存成功すれば表示 | T8' / 既存 reset test / AC-L3-1 |
| `returnTo` の値 | `useRouterState` の現在 href（既存 `:134`） | — | link click 時点の href（search state 込み） | — | — | consumer が正規化、不正なら `/inventory/records` | — | — | — | 既存 consumer test（非接触） |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 保存結果 panel の「詳細を見る」+ `returnTo`（DSR-18 producer） | `ReceivingPage.tsx:355-363`（入庫、UI-02-D16）/ `ReturnExchangePage.tsx:490-497`（返品・交換、UI-03-D22）/ `ManualSalePage`（手動販売、UI-04-D17、`sale_id` 条件付き）/ `DisposalPage.tsx:333-345`（廃棄、link なし = 本 lane の対象） | `DisposalPage.tsx` 保存結果 panel（本 lane） | 手動販売の `sale_id` 条件は業務上の分岐（非 PLU 行のみ等）で本 lane 非対象。CSV 取込みの result step は別契約（DSR-19 の全面遷移型） | AC4（他画面 diff 0）、T8' |
| recent list の「詳細を見る」+ `returnTo` | 4 作業画面の recent list（DSR-18 lane PR #20 で移植済み） | なし（不変） | 既に全 site 移植済み | 既存 test（`:462-466` ほか） |

## Negative Paths

- missing input: `returnTo` 欠落 → consumer が `/inventory/records` へ fallback（既存 test、非接触）
- invalid input: `//` 始まり・絶対 URL → 同上
- duplicate/ambiguous input: 同 test 内で recent list と保存結果の「詳細を見る」が 2 本 → 保存結果 panel に scope して取る（Review Focus）
- unknown reference: `record_id` が存在しない記録 → 詳細画面の既存 not-found 表示（非接触）
- dependency missing: not applicable
- permission/write failure: not applicable（表示のみ）
- dry-run side effect: not applicable

## Boundary Checks

- threshold: not applicable
- null/default: `result === null` で panel なし（link なし）
- empty/non-empty: `stock_warnings` の有無に関わらず link は出る（panel 内の位置は button 群）
