# function-design ドキュメント↔実装 drift 総点検（2026-09-05）

## 本ドキュメントについて

- 実施日: 2026-09-05
- 対象 HEAD: 監査自体は origin/main `6fc4aba` 時点で実施。本 doc 化 PR での是正作業は origin/main `a38597e`（隔離 worktree、branch `agent/docs-drift-sync-2026-09`）を起点に行った
- 方法: 隔離 worktree（`git worktree add --detach`、detached checkout）+ Explore agent 3体を並列起動し6観点を2観点ずつ分担（下記「探索方法」参照）+ rg / fd / bat / Read による実読
- 本 PR での処理:
  - S1-1（operation_type 5種が frontend label registry と 74番doc実測テーブルに未登録）は Lane 3（PR #34）で既に是正済み。本 doc では該当節にクローズ注記を追加するのみで、追加の doc 修正はしていない
  - S2（doc が実装と矛盾）7件は、現 HEAD `a38597e` で再確認のうえ全件是正した。各 finding に是正 commit と検査 command を追記している
  - S3（表記ゆれ・軽微）5件、一致確認済み一覧、突合できなかった項目は記録のみで、本 PR では変更していない

---

- 対象: `docs/function-design/*.md`, `docs/decision-log.md` vs `src/`, `src-tauri/src/`
- 参照 commit: origin/main `6fc4aba`（隔離 worktree `/tmp/claude-1000/drift-audit`、detached checkout。読了後 `git worktree remove` 済み）
- 探索方法: rg / fd / bat / Read のみ。Explore agent 3体を並列起動し、6観点を2観点ずつ分担
  - Agent1: 観点1(数値契約) + 観点6(decision-log Exception/Superseded)
  - Agent2: 観点2(enum/registry) + 観点5(UI固定値契約)
  - Agent3: 観点3(command/DTO契約) + 観点4(route/navigation)
- 判定基準: doc と src の両方を実読して不一致を確認したものだけを記録。推測での「drift」は記載しない
- severity: **S1** 利用者可視の不整合（誤表示・fallback表示・機能欠落） / **S2** docが実装と矛盾（実装は正しい） / **S3** 表記ゆれ・軽微

---

## S1（利用者可視）

### S1-1: operation_type 5種が frontend label registry と 74番doc自身の「実測」テーブルに未登録

> **クローズ（2026-09-05 追記）**: Lane 3（PR #34）で `74-ui-operation-logs.md` §74.5.2 のテーブルと `src/features/operation-logs/operation-type-labels.ts` に該当5エントリ（`product_price_revise` / `product_bulk_plu_target` / `supplier_rename` / `supplier_merge` / `plu_register_snapshot_import`）が追加され、is-closed。現 HEAD `a38597e` で `rg -n "product_price_revise|product_bulk_plu_target|supplier_rename|supplier_merge|plu_register_snapshot_import" docs/function-design/74-ui-operation-logs.md src/features/operation-logs/operation-type-labels.ts` を再実行し、両ファイルとも5件ヒットを確認済み。本 doc での追加是正なし。

- doc主張: `docs/function-design/74-ui-operation-logs.md:142-169` — 「現行コードベースで実際に使われているoperation_type値（`rg 'operation_type: "[a-z_]+"' src-tauri/src` で実測、test_opを除く）」として24種のテーブルを掲載
- src実態: `src-tauri/src/biz/product_service.rs:460,638,737,779` と `src-tauri/src/biz/plu_export_service.rs:280` が下記5種を実際にINSERTしている（同じrgコマンドを再実行すると29種検出される）
  - `product_price_revise`
  - `product_bulk_plu_target`
  - `supplier_rename`
  - `supplier_merge`
  - `plu_register_snapshot_import`
- frontend実態: `src/features/operation-logs/operation-type-labels.ts:6-31` の `OPERATION_TYPE_LABELS` も74番docのテーブルと一字一句一致した24 entryのみで、上記5種は未登録
- 影響: `operationTypeLabel()` はraw fallbackのため機能自体は壊れないが、操作ログ画面で該当5種が日本語ラベル・カテゴリなしの生値表示（例: `その他（product_price_revise）`）になる。非ITの店舗運営者が読む画面のため実利用上の可視劣化
- 方向: doc古い（74番doc自身が「rgで実測」と明記しているが再実測していない。30/33番doc側は個別機能仕様として当該operation_typeの存在を先に記述済みで、74番の集約registryだけ追随していない）
- 是正案: `74-ui-operation-logs.md` §74.5.2のテーブルと `operation-type-labels.ts` に該当5エントリを追加し、rg実測コマンドを再実行して件数・一覧を更新する
- Lane/PR提案: 単独の小PR（doc + label registry の2ファイル同時修正、実装側のoperation_type文字列自体は変更不要）

---

## S2（docが実装と矛盾）

### S2-1: 42-cmd-sales-stocktake.md にstocktake command 3件が未記載

> **是正済み（2026-09-05）**: `42-cmd-sales-stocktake.md` §22.5 に `get_active_stocktake` / `find_stocktake_item` / `get_last_completed_stocktake` の関数仕様（関数要求・シグネチャ・処理ステップ）を追加。是正 commit: `215681f`（branch `agent/docs-drift-sync-2026-09`）。検査 command: `rg -n "get_active_stocktake|find_stocktake_item|get_last_completed_stocktake" docs/function-design/42-cmd-sales-stocktake.md` で3コマンドとも `####` 見出しがヒットすることを確認。

- doc主張: `docs/function-design/42-cmd-sales-stocktake.md:129-256`（§22.5, §22.8）は `start_stocktake`/`get_stocktake_items`/`update_count`/`complete_stocktake`/`get_stocktake_record` の5個のみ列挙
- src実態: `src-tauri/src/cmd/stocktake_cmd.rs:36` `get_active_stocktake`、`:101` `find_stocktake_item`、`:118` `get_last_completed_stocktake` が実装済みで `lib.rs` の `collect_commands!`/`generate_handler!` 両方に登録済み、`src/lib/bindings.ts:231,259,269` にも生成済み
- 方向: code古い（doc未追随。3コマンドとも実装・bindings双方に存在し稼働中）
- 是正案: 42番doc §22.5に3コマンドの関数仕様節を追加する
- Lane/PR提案: docs-only PR（他のcmd doc drift とまとめて1PR可）

### S2-2: 41-cmd-pos.md PluExportPrepareResponse に over_limit_warning フィールドの記載漏れ

> **是正済み（2026-09-05）**: `41-cmd-pos.md` §17.6 の `PluExportPrepareResponse` 構造体定義に `over_limit_warning: bool` を追記（BIZ-04 側は常に `false` を返す互換維持フィールドである旨も明記）。是正 commit: `215681f`。検査 command: `rg -n "over_limit_warning" docs/function-design/41-cmd-pos.md` で1件ヒットを確認。

- doc主張: `docs/function-design/41-cmd-pos.md:422-452`（§17.6）は bytes_base64/suggested_filename/content_type/encoding/count/target_product_codes/prepared_rows/excludedの8フィールドのみ
- src実態: `src-tauri/src/cmd/plu_export_cmd.rs:23-42` に `over_limit_warning: bool`（コメント「互換維持フィールド」）、`bindings.ts:1100` にも存在
- 方向: code古い（doc未追随）
- severity補足: フィールド追加のみで既存consumerは無視可能なためS3寄りだが、契約表としての完全性の観点でS2に計上
- 是正案: 41番doc §17.6のレスポンス型定義に `over_limit_warning` を追記
- Lane/PR提案: S2-1と同一docs-only PRにまとめる

### S2-3: 52-ui-shared-layout.md のnavラベルが2件、実装から取り残されている

> **是正済み（2026-09-05）**: §52.3 route table の UI-07 行を「CSV取込み」→「売上データ取込み」、UI-11a 行を「閾値設定」→「在庫少の基準」へ更新し、それぞれ D-025 / 69番doc UI-11a-D6 への参照注記を追加。§52.4 の「4エリア×22項目」表と各項目アイコン表内の同ラベルも揃えて更新。是正 commit: `215681f`。検査 command: `rg -n "CSV取込み|閾値設定" docs/function-design/52-ui-shared-layout.md`（nav ラベルとしての旧文言は0件、route table の入出庫履歴行の追跡入口説明文に残る「CSV取込み」は機能名の一般言及であり本finding対象外）/ `rg -c "売上データ取込み|在庫少の基準" docs/function-design/52-ui-shared-layout.md` で新文言が複数箇所（各3件）ヒットすることを確認。

- doc主張1: `docs/function-design/52-ui-shared-layout.md:66,135,145` UI-07のnav表示名を「CSV取込み」と明記
  実装: `src/config/navigation.ts:70-76` `label: "売上データ取込み"`。`docs/decision-log.md` D-025がラベル変更を決定済み
- doc主張2: `52-ui-shared-layout.md:86,138,152` UI-11aのnav表示名を「閾値設定」と明記
  実装: `navigation.ts:238-244` `label: "在庫少の基準"`。`69-ui-threshold-settings.md` UI-11a-D6が「operator向け名称は在庫少の基準、閾値は画面に出さない」と明記（2026-07-06決定）
- 方向: doc古い（52番docが他doc/decision-logの決定に未追随）
- 是正案: 52番doc §52.3/§52.4の該当2ラベルを実装値に更新し、更新履歴に反映
- Lane/PR提案: 52番doc単独の小PR

### S2-4: 52-ui-shared-layout.md route table に記録詳細route5件が未記載

> **是正済み（2026-09-05）**: §52.3 冒頭の全画面対応表の説明文に、記録詳細route（入出庫履歴6種、いずれもナビ非表示）はこの表の集計対象外とし [65-inventory-record-traceability.md](../../function-design/65-inventory-record-traceability.md) §65.3 を正本とする旨を追記。UI-02b〜05b（入出庫履歴）行の備考欄にも同趣旨の委譲注記を追加。是正案の2案（route table への5件追加／別docへの委譲明記）のうち、65番doc §65.3 に既に6記録種別の一覧・詳細route全件が実路径と一致した形で存在していたため、重複記載を避け委譲方式を採用（是正 commit: `215681f`）。検査 command: `rg -n "65-inventory-record-traceability" docs/function-design/52-ui-shared-layout.md` で2件ヒット、`rg -n "csv-import.records|receiving.records|return.records|manual-sale.records|disposal/records|stocktake.records" src/routes -g '*.tsx'` で列挙した6 route と 65番doc §65.3 の記載パスが一致することを確認済み。

- doc主張: `52-ui-shared-layout.md:59-97`（§52.3）「全画面対応表（22ナビ表示+2ナビ非表示、route計23）」、ナビ非表示routeは `/products/$code/edit` と `/stock/$code/movements` の2件のみ列挙（UI-10備考欄で`/stocktake/records/$stocktakeId`のみ言及）
- src実態: 実際には記録詳細routeが計6件存在（`csv-import.records.$importId`, `inventory/receiving.records.$recordId`, `inventory/return.records.$recordId`, `inventory/manual-sale.records.$recordId`, `inventory/disposal/records/$recordId`, `stocktake.records.$stocktakeId`）
- 方向: code古い（doc未追随。52番docは2026-04-21初版のまま、記録詳細routeは後発の65番doc・41/42/44番docの記述で追加された）
- 是正案: 52番doc §52.3のroute tableに5件を追加し総route数を更新、または「入出庫履歴」機能の別docに委譲する旨を明記
- Lane/PR提案: S2-3と同一52番doc PRにまとめる

### S2-5: 52-ui-shared-layout.md icon対応表に「入出庫履歴」行が欠落

> **是正済み（2026-09-05）**: §52.4 各項目アイコン表に「入出庫履歴 | `ScrollText`」行を追加（全11行×2列=22項目に整合）。是正 commit: `215681f`。検査 command: `rg -n "入出庫履歴 \| \`ScrollText\`" docs/function-design/52-ui-shared-layout.md` で1件ヒットを確認。

- doc主張: `52-ui-shared-layout.md:141-154`（§52.4）21項目のみ列挙（「入出庫履歴」行なし）
- src実態: `navigation.ts:188-195` `id:"ui-02b-05b", label:"入出庫履歴", icon: ScrollText`
- 方向: doc古い（転記漏れ。22項目と自称しながら21項目のみ）
- severity: S3寄りだがS2-3/S2-4と同一doc改訂でまとめて直すため本セクションに記載
- 是正案: §52.4表に「入出庫履歴 | ScrollText」行を追加
- Lane/PR提案: S2-3と同一PR

### S2-6: 50-ui-product-list.md 内でperPage既定値の記述がdoc内不整合

> **是正済み（2026-09-05）**: UI-01a-D1 要件表の `per_page=50` を `per_page=100` に修正し、D Lane 2 変更への参照注記を追加。是正 commit: `215681f`。検査 command: `rg -n "per_page=50" docs/function-design/50-ui-product-list.md`（0件、exit code 1）で旧記述が消えたことを確認、`rg -n "per_page=100" docs/function-design/50-ui-product-list.md` で新記述が既存の他2箇所と合わせて3箇所存在することを確認。

- doc主張: `docs/function-design/50-ui-product-list.md:19`（UI-01a-D1）「per_page=50を既定」
- doc実態（同ファイル内）: `:63,:121`は「2026-09-03 D Lane 2でperPage既定を50→100へ変更」と明記
- src実態: `src/features/products/search.ts:130-135` `normalizePerPage` 既定値は `100`
- 方向: doc古い（同一doc内でD1要件表のみ未更新。実装は100で確定済み）
- 是正案: line19の `per_page=50` を `per_page=100` に修正
- Lane/PR提案: docs-only、1行修正

### S2-7: decision-log D-033に「Superseded in part by: D-043」の逆参照が欠落

> **是正済み（2026-09-05）**: D-033エントリの「Alternatives considered」直後に「Superseded in part by: D-043」行を追加（D-026/D-029等の既存逆参照と同一書式）。是正 commit: `215681f`。検査 command: `rg -n "Superseded in part by: D-043" docs/decision-log.md` で1件ヒットを確認。

- doc実態: `docs/decision-log.md:291-297` D-043は「Supersede only D-033's exclusion of `pull_request.synchronize`」と明言するが、D-033自身（`:235-244`）にはSuperseded逆参照フィールドがない（D-026/D-029/D-034/D-035/D-038は逆参照を記載する慣行）
- src/CI実態: `git show b3c8226`確認済み。`.github/workflows/ci.yml:7` `types: [opened, ready_for_review, synchronize]` でD-043記載どおりsynchronize追加済み、concurrency設定も維持
- 方向: doc古い（コードはD-043に正しく追従しているが、D-033エントリへの逆参照追記漏れ）
- 是正案: `decision-log.md:244`直後に「Superseded in part by: D-043（synchronize除外の撤回）」を追記
- Lane/PR提案: decision-log 1行追記、docs-only

---

## S3（表記ゆれ・軽微）

> 本 PR では変更していない（記録のみ）。

| # | doc file:line + 主張 | src file:line + 実態 | 内容 | 方向 | 是正案 |
|---|---|---|---|---|---|
| S3-1 | `41-cmd-pos.md:564,573` 戻り値型を`PluRegisterSnapshotSummaryResponse`と表記 | `plu_export_cmd.rs:149,169` 実際の型名は`PluRegisterSnapshotSummary`（fieldは完全一致） | 型名のみrename、wire契約への実害なし | 不明 | doc表記を実装名に統一 |
| S3-2 | `22-mnt-migration.md:164` 「migrations()はv1→v4の順、新規DBはv1〜v4適用」 | `migration.rs:37-68` 実際はv1〜v6登録済み。同docの`:290`は「v1→...→v6」で最新かつ一致 | 同一doc内に新旧記述が併存 | doc古い | line164の古い節を削除し`:290`に一本化 |
| S3-3 | `41-cmd-pos.md:135` 疑似コードが`file_bytes.len() > 20*1024*1024`とマジックナンバー表記 | `csv_import_cmd.rs:42` 実装は`constants::CSV_IMPORT_FILE_SIZE_LIMIT`参照（値は同一20MB、D-054 SSOT方針） | 値は一致だがdoc表記がSSOT命名を反映していない | doc表記のみ古い | pseudo-codeを定数参照に書き換え |
| S3-4 | `35-biz-stocktake-service.md:133` 「最大4000件のINSERTを1TX内」 | `stocktake_service.rs:4` コメントのみ「4000商品を順次カウント」、hard capのenforcementコードなし | 想定規模の記述であり実装上の強制上限ではない | 不明（意図的sizing assumption） | docに「4000は想定規模でありhard capではない」旨を明記 |
| S3-5 | `74-ui-operation-logs.md` の operation_type registry（30番/33番doc個別仕様との粒度不一致） | `30-biz-product-service.md:191-192,312,334`、`33-biz-plu-export-service.md:96` は個別機能として存在明記済みだが74番集約表に転記されていない | doc間の集約漏れ（S1-1と同根、個別doc側は正しい） | doc古い（74番のみ） | 74番docの「拡張ルール」（新規operation_type追加時はPRごとに追記）を実運用に戻す |

---

## 一致確認済み（drift なし。主要なもののみ抜粋、全件は各Explore agentのtranscript参照）

- 数値契約: `PAGINATION_MAX_PER_PAGE=200`(D-031)／`inventory_service::MAX_PER_PAGE=100`維持／`50-ui-product-list.md`のperPage選択肢`[50,100,200]`／各画面の初期perPage(10,5,1)／`threshold-settings`の1〜99999範囲／backup retention既定3日とfallback非実行／diagnostic-log retention既定30日／PLU memory_no範囲217-5000・4784slot／CSV import file size 20MB・line limit 10,000・error row 100件・PREVIEW_CACHE_LIMIT 10件・TTL 30分／busy_timeout=5000／debounceMs=200／候補最大5件
- decision-log: D-031 Exception（inventory_service reject契約維持）、D-026/D-029のSuperseded内容（CI push:main撤去、npm-security-monitor weekly化）はいずれも現行CI設定と一致
- enum/registry: record_type 6種（receiving/return/manual_sale/disposal/csv_import/stocktake）はdoc・src・frontendで完全一致。関連記録リンク許可4種も一致。status系（all/active/canceled/in_progress、PLU slot 5値、CSV import status 3値）はdoc・src・frontendで完全一致。CmdErrorKind 12 variantも一致
- UI固定値契約: 66/62/53/58/63/56/51/69/67/54番docの固定値記述（per_page固定値、件数バッジ非表示、include_discontinued固定、返品方向固定、部門順固定、価格履歴件数、backup/threshold key所有、PLUスロット数、shortcuts件数）は全て実装と一致
- command/DTO契約: 40/41(残り)/42(残り)/43/44/45番docの全65 command中62件は、Rust実装署名・bindings.ts型定義まで完全一致
- route/navigation: 4エリア×22項目の構成、NavItem/NavArea型定義、UI-06a/06b排他active判定、主要route pathは全てdocと一致

---

## 突合できなかった項目と理由

- `docs/function-design/22-mnt-migration.md:118-119` のPLU backfill SQL（jan_code 13桁GLOB条件）: `src-tauri/src/db/schema_v3.rs` 本文未Read（時間配分の都合、間接確認のみ）
- `docs/function-design/56-ui-daily-sales.md:263` のIPC payload見積り（1日1000件×200byte、WebView2上限）: 実測値ではなく設計時のsizing note。対応する定数やenforcementがコード側になくnumeric contractとして不適切と判断し除外
- `docs/function-design/55-ui-csv-import.md:38`「標準入力元をEcrDatasに固定」: `rg "EcrDatas" src/ src-tauri/src/` で0件。レジ(CV17)がPC側に書き出す実フォルダ名についての運用手順書記述であり、コード上のハードコード定数として実装されている形跡なし。coded contractではなくoperator向け手順書相当のため drift有無を確認できず
- `65-inventory-record-traceability.md`は監査対象doc外だったため、S2-4で発見した記録詳細route5件の「正本doc」がどこにあるか（41/42/44番docの断片的言及以外）を追跡しきれていない
- `src/lib/bindings.ts`は自動生成物のため、複数commandで共用される型（`ProductResponse`等）は型の"命名"レベルの突合を一部省略し、field名一致のみで判定
- `44-cmd-inventory.md` §23.9〜23.10のIO/BIZ層内部関数（`product_repo::get_stock_detail`等）はCMD層契約の対象外としてスコープ外
- decision-log D-034/D-035/D-038（Superseded in part by: D-039）はいずれもプロセス決定（Plan Packet運用、Workflow State/Contract Audit統合）でsrc/src-tauri側に対応実装が存在しないため突合対象外
- `docs/function-design/44-cmd-inventory.md`内の複数箇所（L153,307,443,486,805等）の`per_page: u32`型定義は同一契約の反復記載のため、代表箇所のみ確認し残りは同一契約とみなした

---

## 実行した主要コマンド（再現用）

```bash
# worktree準備
git worktree add --detach "$TMPDIR/drift-audit" origin/main

# 観点1: 数値契約
rg -n "per_page|perPage|上限|既定|debounce|timeout|retention|最大|桁" docs/function-design/*.md
rg -n "PAGINATION_MAX_PER_PAGE|MAX_PER_PAGE" src-tauri/src/db/*.rs src-tauri/src/biz/inventory_service/list.rs
rg -n "DEFAULT_RETENTION_DAYS|retention_days" src-tauri/src/mnt/backup.rs src-tauri/src/mnt/diagnostic_log.rs src-tauri/src/lib.rs
rg -n "217|5000|CHECK" src-tauri/src/db/schema_v5.rs
rg -n "CSV_IMPORT_FILE_SIZE_LIMIT|CSV_IMPORT_LINE_LIMIT|PREVIEW_CACHE_LIMIT|PREVIEW_CACHE_TTL_SECS" src-tauri/src/constants.rs
rg -n "debounceMs=\{?[0-9]+\}?" src/features -g '!*.test.*'

# 観点2: enum/registry
rg -o 'operation_type: "[a-z_]+"' src-tauri/src | sed -E 's/.*"([a-z_]+)"/\1/' | sort -u
rg -n "OPERATION_TYPE_LABELS" src/features/operation-logs/operation-type-labels.ts
rg -n "record_type" src-tauri/src -g '*.rs'
rg -n "enum CmdErrorKind" -A 30 src-tauri/src/cmd/mod.rs

# 観点3: command/DTO
rg -n -A3 '#\[tauri::command\]' src-tauri/src/cmd/*.rs
rg -n '__TAURI_INVOKE\("[a-z_]+"' src/lib/bindings.ts

# 観点4: route/navigation
fd . src/routes -e tsx
rg -n "createFileRoute\(" src/routes -A1 --no-heading
rg -n '売上データ取込み|在庫少の基準|閾値設定' docs/decision-log.md docs/function-design/*.md

# 観点6: decision-log
rg -n "Exception|Superseded" docs/decision-log.md
git log --oneline -- .github/workflows/ci.yml
git show b3c8226 -- docs/decision-log.md .github/workflows/ci.yml

# 終了処理
git worktree remove "$TMPDIR/drift-audit"
```
