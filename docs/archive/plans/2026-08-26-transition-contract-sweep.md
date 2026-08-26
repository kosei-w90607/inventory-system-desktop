# 実査記録: 画面遷移契約の全数棚卸し + 設計認識済み・Plans 未追跡 gap 走査（2026-08-26）

read-only 実査（Codex、owner relay。file 変更なし）。起点 = PR #7 作業中に owner が発見した「直近の入庫 → 詳細 → 前の画面へ戻る」の無絞り込み fallback。Coordinator（Fable）が荷重主張 2 件（plu 脱落・棚卸し 404）を実読で独立裏取り済み。

## Lane A: 導線 × 設計契約 matrix

集計: 実 call site 78 / 集約 hop 66 / 判定 = 適合 54・設計未定義 gap 8・契約乖離 4。

### 設計未定義 gap 8 件（「前の画面へ戻る」系、returnTo 未送信 → 無絞り込み `/inventory/records` fallback）

TRACE-D11（65 doc）は hub 一覧発の遷移のみ returnTo 保持を契約化しており、以下は設計記載なし:

| # | 遷移元 | site |
|---|---|---|
| 1〜4 | 直近の入庫 / 返品・交換 / 手動販売出庫 / 廃棄・破損（recent list）→ 各詳細 | `ReceivingPage.tsx:689` / `ReturnExchangePage.tsx:969` / `ManualSalePage.tsx:741` / `DisposalPage.tsx:684` |
| 5〜7 | 保存結果「詳細を見る」→ 各詳細 | `ReceivingPage.tsx:350` / `ReturnExchangePage.tsx:481` / `ManualSalePage.tsx:376` |
| 8 | 操作ログ「関連記録を見る」→ 4 種詳細（期間・種別・page も喪失） | `OperationLogsPage.tsx:187`（74 doc §74.9 は route mapping のみで戻り契約なし） |

裁定方向（owner 裁定待ち）: 戻り先を遷移元にする（returnTo 送信）か、hub 正としてラベルを実挙動へ合わせるか。8 件同型のため 1 本の design-first packet「戻る導線契約の規範化」で束ねる。

### 契約乖離 4 hop（root cause 1 件）

`src/features/products/lib/return-to.ts` の `buildProductListReturnTo` / `parseProductListSearchFromReturnTo` が契約済み URL state `plu`（50-ui §50.4 L55、`ProductListSearch` schema 実在）だけを扱わない。`plu=target|pending|synced|excluded` で新規/修正を開いて保存・戻ると `plu=all` に落ちる。影響 hop = `ProductListPage.tsx:95` / `ProductTable.tsx:91` / `routes/products/new.tsx:27` / `routes/products/$code.edit.tsx:29`。Coordinator 実読で真陽性確定。是正 = build/parse 両側へ plu 追加 + regression test（契約確定済みの純 bug fix、小 R2）。

### 適合確認済み（finding 非計上）

在庫変動履歴→元記録（returnTo 保持）/ hub→詳細（8 state 保持、TRACE-D11 適合）/ 在庫詳細→商品修正（returnTo 非付与は明示契約）/ 在庫詳細→入庫（prefill なしは明示契約）/ 日次月次タブ。

## Lane B: 認識済み・Plans 未追跡 deferred

集計: marker 行 266 / occurrence 303。「未追跡」= archive の Non-scope 記録だけで live Plans.md に実行可能 entry がないもの。既知 1 + 新規 19。

### 利用者可視の実害あり見込み（K1 + N1〜N7）

- K1: 65 §65.10 slice 4b — CSV 取込みの一覧・横断 hub 検索が slice 外のまま（詳細のみ実装）
- N1: 74 §74.9/§74.16 — 関連記録 link の backend producer が record_type 書込み 0 件、実データで link 発火 0
- N2: 65 §65.3/§65.10 — backend `inventory_service/list.rs:226` が `/stocktake/records/{id}` を生成するが frontend route 未実装 = 到達可能な 404（Coordinator 実読で真陽性確定）
- N3: 65 §65.9 slice 6 — 入出庫履歴・詳細の CSV 出力・印刷/控えが実装 runway 外
- N4: 63 §63.8 / 65 — receipt 添付の画像表示・削除・orphan cleanup・共通添付化
- N5: 61/63/64 — 在庫詳細→取引画面の productCode/direction prefill
- N6: 77 §77.9 — 新売価算出補助・複数行一括確定・改定前入力の長期保持
- N7: 78 §78.12 — 取引先一覧の検索・sort・paging・bulk rename

### 内部品質

- N12: 54 §54.9 — shortcuts の retroactive unit test（延期理由「Vitest 未導入」は失効、test file 0 件）

### 低優先・意図的放置と推定（11 件）

- N8: 60 §60.8 CSV template・列 mapping・一括上書き・cancel/resume・import 履歴
- N9: 50/51 — 生地 cm/m 横断表示切替
- N10: UI_TECH_STACK L449 — global scanner detection
- N11: 54 §54.9 — Ctrl+K・Alt+←/→・screenScope（旧 archive backlog 8-6b/c から live 消失）
- N13: REQ-704/705 — 動的ログレベル・ログフォルダを開く
- N14: 74 §74.16 — 操作ログ CSV 出力
- N15: 58 §58.13 — 状態チップ件数・廃番表示 toggle
- N16: 73 §73.14 — 棚卸し中止・一覧 sort・複数回履歴
- N17: DB_DESIGN L179 / 69 — 商品個別在庫少閾値
- N18: ARCHITECTURE L87 — Z006/Z009/Z011
- N19: 52 §52.7 — ダークモード切替 UI

### 追跡済み・完了済みとして除外

REQ-208 / REQ-403 / UI-09a/b 6 項目 / E2E・visual regression 再評価 / UI-15 deferred 3 点 / 旧フェーズ記録の test marker / 64 §64.8 詳細表示（実装済み）。

## 優先裁定候補（Codex 提案、Coordinator 同意）

1. N2 棚卸し 404（壊れた実導線）2. plu returnTo 乖離 4 hop（契約確定済み bug）3. N1 + gap#8 の操作ログ二重 gap 4. 戻る契約 gap 8 件の設計裁定 5. K1+N3 の records 完成形 runway 復帰。共通所見 =「UI 上は完成に見えるが実データで 0 件 / 404 を正式生成する」型を先に裁定すべき。
