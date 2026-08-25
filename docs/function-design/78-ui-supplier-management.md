# 78. UI-15: 取引先管理

> 対応仕様: REQ-106, REQ-107
>
> 入力ドキュメント: `docs/function-design/20-io-product-repo.md`、`docs/function-design/30-biz-product-service.md`、`docs/function-design/40-cmd-product.md`、`docs/db-design/master-tables.md`、D-052、D-075、D-078

## 78.0 関数要求 / シグネチャ / 処理ステップの扱い

**関数要求**: UI-15 は取引先（メーカー/ブランド）の complete master data を name 昇順で表示し、追加、インライン改名、重複統合を安全に行うシステム管理画面である。各行に関連商品数と入庫記録数を表示し、統合前に影響範囲を operator が判断できるようにする。

**シグネチャ**: frontend の境界は generated `commands.listSuppliersWithUsage` / `commands.createSupplier` / `commands.renameSupplier` / `commands.mergeSuppliers` と各 DTO である。CMD の inline 署名は複製せず、[40-cmd-product.md](40-cmd-product.md) を正とする。

**処理ステップ**: 画面到達時に usage 付き一覧を取得する。追加は既存 command を流用し、改名は対象行内で確定する。統合は消す側の行から開始し、残す側を選んだ後に影響件数と不可逆性を確認して実行する。成功後は該当 query を再取得し、失敗時は入力と選択を保持する。

**エラーハンドリング**: 一覧取得、追加、行単位の改名、統合を別の失敗境界に分ける。1 操作の失敗で正常な他行を隠さず、日本語の error と同じ場所からの再試行導線を出す。

## 78.1 位置付け（SPEC-SUP-D1 / SPEC-SUP-D2 / SPEC-SUP-D10）

UI-15 は、漸進追加で生じた表記揺れや同一メーカー/ブランドの重複を是正する operator-facing 画面である。route は `/settings/suppliers`、route file は `src/routes/settings/suppliers.tsx`、画面本体は `src/features/suppliers/SupplierManagementPage.tsx` とする。サイドバーの「システム管理」エリアから到達する。

取引先の単独削除は提供しない。重複は統合で解消し、問屋チャネルと約 80 社の事前一括投入も本画面では扱わない。追加導線は REQ-106、改名・統合は REQ-107 の要求正本に従う。

## 78.2 Design Intent Trace

| Spec / requirement ID | 設計判断 | 理由 / 捨てた案 |
|---|---|---|
| SPEC-SUP-D1 / SPEC-SUP-D10 | 改名・統合・専用管理画面だけを Deferred から解除し、単独削除・問屋チャネル・事前一括投入は解除しない。 | typo と重複は日常運用で回復手段が必要だが、単独削除は参照の扱いが危険で統合により主要場面を代替できる。 |
| SPEC-SUP-D2 | `/settings/suppliers` のシステム管理画面に、name 昇順一覧・usage 件数・「新しい取引先を追加」を置く。 | 改名・統合は保守作業で、日常の商品管理操作と分ける。追加は既存の漸進補完を同じ画面からも行えるようにする。 |
| SPEC-SUP-D3 | 改名は trim、空文字拒否、同値 no-op、他行との同名衝突は統合案内付き validation とする。 | UNIQUE error の技術文言を見せず、重複解消の正しい次操作を示す。 |
| SPEC-SUP-D4 | 統合は products と receiving_records を残す側へ付け替えた後に消す側を削除する 1 transaction とする。 | 片側だけの付替えは FK 違反または過去記録の表示欠落を生む。 |
| SPEC-SUP-D5 | 改名時だけ `suppliers.updated_at` を更新する。 | 作成日時と名称変更日時を区別し、用途のない追加列は持たない。 |
| SPEC-SUP-D6 | 統合は「残す側の選択」→「影響件数 + 不可逆性の最終確認」の 2 段階にする。 | 別実体を誤統合した場合の自動復元手段がない。 |
| SPEC-SUP-D7 | rename は D-052 C21、merge は C22 の invalidation 契約を後続実装で追加する。 | UI-01b、UI-14、UI-15 の取引先名や products 系一覧を stale にしない。 |
| SPEC-SUP-D8 | 新規 wire は rename / merge / usage 付き一覧の 3 command。既存 list / create wire は変更しない。 | 既存画面を壊さず UI-15 に必要な境界だけを追加する。 |
| SPEC-SUP-D9 | navigation system エリアに `ui-15` を登録し、route 到達テストを持つ。 | route 実装だけ存在して operator が到達できない failure class を防ぐ。 |

## 78.3 画面構成

```text
src/
  routes/settings/suppliers.tsx
  features/suppliers/
    SupplierManagementPage.tsx
    components/
      CreateSupplierDialog.tsx
      SupplierUsageTable.tsx
      RenameSupplierRow.tsx
      MergeSupplierDialog.tsx
    hooks/
      useSuppliersWithUsage.ts
      useRenameSupplier.ts
      useMergeSuppliers.ts
```

- PageHeader: title `取引先管理`、メーカー/ブランドの追加・名称変更・重複統合を行う画面であることを 1 行で説明する
- 一覧上部: primary action `新しい取引先を追加`
- 一覧: `取引先名` / `関連商品数` / `入庫記録数` / `操作`。name 昇順で全件表示する
- 操作: 各行に `名前を変更` と `統合`。状態や失敗は日本語 text、role、icon、ボタン label で示し、色だけに依存しない
- URL search state、filter、paging は持たない。利用規模は漸進補完された数十件を想定し、全件一覧を正とする

usage 件数は `N件` と単位を付けて表示する。0 件も `0件` と明示し、空欄や色だけで意味を表さない。横幅が不足する場合も取引先名・2 件数・操作を隠さず、table の横スクロールで到達できるようにする。

## 78.4 CMD / DTO 契約（SPEC-SUP-D8）

| generated command / DTO | 用途 |
|---|---|
| `commands.listSuppliersWithUsage()` / `SupplierWithUsage` | name 昇順一覧。`id` / `name` / `productCount` / `receivingRecordCount` |
| `commands.createSupplier(name)` / `Supplier` | 「新しい取引先を追加」。既存 wire を無変更で流用 |
| `commands.renameSupplier(supplierId, name)` / `Supplier` | インライン改名 |
| `commands.mergeSuppliers(sourceId, targetId)` / `SupplierMergeResult` | 重複統合。商品・入庫記録の付替え件数を返す |

`SupplierMergeResult` と `SupplierWithUsage` は BIZ-01 所有、CMD は qualified path 参照とする。UI は generated bindings だけを呼び、validation、transaction、operation_log、COUNT を実装しない。

## 78.5 追加（REQ-106 / SPEC-SUP-D2）

1. 一覧上部の `新しい取引先を追加` で dialog を開く
2. `取引先名` を入力し、保存時に UI で trim する。空文字は field error `取引先名を入力してください` とし CMD を呼ばない
3. `commands.createSupplier(name)` を呼ぶ。同名なら既存行が返る既存契約を維持する
4. 成功後は UI-15 の usage 付き一覧だけを再取得し、返された行が一覧に見える状態へ戻す。既存 inline 追加と同型のため D-052 entry は増やさない
5. 失敗時は dialog と入力値を保持し、field error または再試行可能な Alert を dialog 内に表示する

## 78.6 インライン改名（REQ-107 / SPEC-SUP-D3 / D5）

1. 行の `名前を変更` で取引先名セルを入力欄に切り替え、現在名を初期値にする
2. `保存` / Enter で確定し、`キャンセル` / Escape で現在名に戻す。pending 中は同じ行の入力・保存・キャンセルだけを無効化し、他行の閲覧を妨げない
3. 空文字は field error `取引先名を入力してください` とし、入力を保持する
4. 他行と同名の場合は `同じ名前の取引先があります。重複している場合は「統合」を使ってください。` と表示し、入力を保持する
5. 同値 no-op は成功として編集状態を閉じる。実際に名称が変わった場合は BIZ が updated_at と operation_log `supplier_rename` を更新する
6. 成功後は D-052 C21 に従い取引先 consumer を再取得し、DB の name を表示の正とする

## 78.7 統合 dialog（REQ-107 / SPEC-SUP-D4 / D6）

統合開始行を source（消す側）とし、source 行自身は残す側の候補から除外する。

### 段階 1: 残す側の選択

- 見出し `取引先を統合`
- `「<source名>」を統合します。残す取引先を選んでください。` と表示する
- name 昇順の他取引先を select で表示し、未選択では次へ進めない
- `次へ` と `キャンセル` を置く

### 段階 2: 影響件数と最終確認

- `「<source名>」を「<target名>」に統合します。`
- source 行の usage 件数を使い、`<product_count>件の商品 / <receiving_record_count>件の入庫記録が付け替わります` と表示する
- 画面文言の型は「◯件の商品 / ◯件の入庫記録が付け替わります」とし、◯へ source の実件数を入れる
- `この操作は元に戻せません。別の取引先を誤って統合しないよう、名称と件数を確認してください。` と不可逆性を明記する
- destructive action label は `統合する`、戻る action は `残す取引先を選び直す`、中止は `キャンセル` とする

`統合する` pending 中は dialog を閉じる操作と二重送信を無効化する。成功後は dialog を閉じ、`SupplierMergeResult` の 2 件数と一致する完了通知を出して一覧を再取得する。失敗時は段階 2、source / target、件数表示を保持し、`統合できませんでした` と再試行導線を表示する。

## 78.8 Loading / Empty / Error / Recovery

- Loading: table の列構造を保つ skeleton を表示する。追加 dialog の開閉 state は一覧再取得で失わない
- Empty: `取引先はまだ登録されていません` と表示し、同じ画面内に `新しい取引先を追加` を残す
- 一覧取得失敗: ページ上部 Alert に `取引先を読み込めませんでした` と `再試行` を表示する。0 件と誤認させない
- 追加失敗: dialog 入力を保持する。他行や既存一覧を隠さない
- 改名失敗: 対象行を編集状態のまま保ち、入力値と `再試行` を残す。他行は操作可能なままにする
- 統合失敗: 段階 2 と選択値を保持し、再試行または前段階へ戻れるようにする
- command が not-found を返した場合は一覧が古い可能性を日本語で示し、一覧再取得 action を出す。失敗を成功扱いにしない

## 78.9 Query invalidation（SPEC-SUP-D7）

実装 PR は D-052 に C21 rename / C22 merge を登録し、consumer 全数導出（SPEC-SUPI-D2）により C21 / C22 は同一の 8 key 集合に確定した。集合の正本は decision-log D-052 Contract 行と `src/lib/invalidation-contract.ts` とし、test 側は独立 oracle を持つ。

共通離脱ガード（UI_TECH_STACK §6.11 `useUnsavedChangesWarning`）は UI-USW-D3 (c)〈行単位の即時 DB 保存 + dialog 完結〉により適用しない。

UI-15 の追加成功は自画面一覧の再取得だけを行い、既存 create flow と同様に D-052 entry を追加しない。

## 78.10 実装 PR の登録・生成・検証義務（SPEC-SUP-D9）

後続実装 PR は次を完了条件として継承する。

- Tauri 3 command に `#[tauri::command]` / `#[specta::specta]` を対で付け、`collect_commands!` / `generate_handler!` へ登録する
- `cd src-tauri && cargo run --bin generate_bindings` で bindings を再生成し、差分が新規 3 command + BIZ 所有 DTO 2 種の追加と既存 export 不変であることを確認する
- route file を追加し、`npm run generate:routes` で route tree を再生成する
- `src/config/navigation.ts` のシステム管理エリアに `id: "ui-15"` / `to: "/settings/suppliers"` / `status: "active"` の entry を追加する
- `navigation.test.ts` に REQ-107 を付け、サイドバーから `/settings/suppliers` へ到達できる test を追加する
- RTL / Rust tests は REQ-106 / REQ-107 / SPEC-SUP-D1〜D10 を紐付け、追加、改名、統合、usage 件数、失敗時入力保持、C21/C22 invalidation を検証する
- human visual confirmation: Windows native で UI-15 への到達、追加 happy path、インライン改名 happy path、統合 happy path、段階 2 の影響件数文言と不可逆文言を目視確認する

## 78.11 テスト観点

- SPEC-SUP-D1 / SPEC-SUP-D10: 単独削除 action がなく、Deferred 境界が維持される
- SPEC-SUP-D2 / D9: システム管理 navigation から UI-15 に到達し、name 昇順・商品件数・入庫記録件数・追加導線が表示される
- SPEC-SUP-D3 / D5: trim、空文字、同値 no-op、他行との同名衝突、updated_at / operation_log の契約が成立する
- SPEC-SUP-D4: products と receiving_records の両参照を付け替えて source を削除し、途中失敗は transaction 全体を rollback する
- SPEC-SUP-D6: 統合が 2 段階で、影響件数文言と不可逆文言を省略できない
- SPEC-SUP-D7: C21 / C22 が予約された全 consumer を invalidate し、片側の supplier cache だけを更新しない
- SPEC-SUP-D8: existing list / create の wire が不変で、新規 3 command と DTO 2 種だけが generated bindings に追加される
- operator UI: Loading / Empty / Error、件数、validation、完了通知を日本語 text / role / value で assert し、色 class だけの test にしない

## 78.12 Deferred

- 取引先の単独削除、問屋チャネル、約 80 社の事前一括投入
- 検索、任意並び替え、paging、bulk rename
- 統合の自動 undo。誤統合時はバックアップ復元を含む別の owner 判断が必要であり、本画面に簡易 undo を設けない

## 78.13 変更履歴

| 日付 | 版 | 内容 |
|---|---|---|
| 2026-08-25 | 取引先管理 design-first | SPEC-SUP-D1〜D10、REQ-106/107、UI-15 の追加・改名・統合契約を新設。 |
