---
source: 店舗ヒアリング（owner 経由で店舗へ relay）
form: 在庫照会 (d) 検索条件追加・廃番表示の確認
captured_at: 2026-09-05
response_count: 1
status: anonymized
raw_source: private storage（repository外）
---

# 在庫照会 (d) 店舗ヒアリング回答（匿名化済み）

Coordinator が起草した質問を owner が店舗へ relay し、回答を owner が転記した。回答の意味・業務ルール・判断理由は維持し、店舗の識別につながる値だけを一般化した。原文の誤記や句読点は、意味を補わない範囲で整えた。

## 質問と回答

### Q1. 発注の準備をする時、「この取引先の商品で少ないもの」だけを一覧で見たいことはございますか？

**回答:** 発注書は、１枚に複数の取引先を取引先別にかくのでその方が楽。

### Q2. 廃番になった商品は、在庫照会に出ていてほしいですか、それとも隠れていてほしいですか？

**回答:** 廃番と取引先がつぶれたやつは、わかったほうがいい。2は、どっちも廃で。ただ、廃番とか、取引先潰れたは、私はほぼ把握してるから、なくてもすむけど。棚卸リストのほうが、逆にいる気がする。廃棄基準にもなるから。

## 合意した要約（owner 確認 2026-09-05）

- 在庫照会の検索条件追加は不要。欲しいのは「取引先で絞る」ではなく、在庫少・在庫切れ一覧が取引先別に並ぶこと（発注書 1 枚に取引先別で書くため）。
- 廃番・取引先消滅の印は在庫照会では無くても済むが、棚卸しリストでは要る（廃棄の判断基準になるため）。
- 「2 はどっちも廃で」= 廃番も取引先消滅も同じ「廃」扱いで表示する（区別しない）。

## データ事実（起票時実測、2026-09-05）

- `suppliers` に状態列なし。`src-tauri/src/db/schema_v1.rs:22-26`（`id` / `name` / `created_at` のみ）。`docs/db-design/master-tables.md:170-182` も取引先の状態列・問屋列を持たない設計で、重複統合（SPEC-SUP-D4）は参照が 0 になった側を DELETE する方式。
- `products.is_discontinued` / `products.supplier_id` あり（`src-tauri/src/db/schema_v1.rs:29-47`、`is_discontinued` は行 41、`supplier_id` は行 34）。
- `list_low_stock_products`（`src-tauri/src/db/product_repo.rs:1194`）は `ProductWithRelations`（`product_repo.rs:103-109`。`supplier_name` は自身のフィールド、`is_discontinued` は `#[serde(flatten)] product: Product` 経由で含まれ、`ProductWithRelations` 独自のフィールドではない）を返し、`ORDER BY p.stock_quantity ASC, p.name ASC`（`product_repo.rs:1225`）。`include_discontinued` 引数による絞り込み分岐（`discontinued_clause`、`product_repo.rs:1200`）は既に存在するが、在庫照会 UI（UI-06a）は `include_discontinued` を固定 false で渡し、取引先も一覧に表示しない。
- 棚卸しの `StocktakeItemDetail`（`src-tauri/src/db/stocktake_repo.rs:63-74`）に `is_discontinued` なし。廃番 badge は候補行のみ（`src/features/stocktake/StocktakePage.tsx:618-627`、`candidate.is_discontinued` で `secondary` variant badge を表示）。
- `docs/function-design/58-ui-stock-inquiry.md:622`「廃番商品の表示トグル UI | `include_discontinued` 固定 false、scope 抑制 | Phase 4 で再検討」。

## owner 決定（2026-09-05）

- **(d-1)** 在庫少・在庫切れ一覧に取引先列を出し、取引先名で並べる。DTO（`ProductWithRelations.supplier_name`）は既載のため DB 変更なし、client sort + 58-doc 改訂で足りる。
- **(d-2)** 棚卸しリストの行に廃番 badge（②分類）を追加。`StocktakeItemDetail` に `is_discontinued` を join し、Rust DTO 追加 + specta bindings 再生成 + UI + test が必要。
- (d-1) + (d-2) を 1 lane として次枠で起票する（R2-3〈展開行の再クリックで閉じる〉を同乗）。
- **(d-3)** 取引先消滅は data が無く、design も状態列を拒否している（`suppliers` へ状態列を追加しない、重複統合〈SPEC-SUP-D4〉は DELETE 方式のまま維持）ため、「該当商品を廃番に更新する運用」で代替する。起票なし。
