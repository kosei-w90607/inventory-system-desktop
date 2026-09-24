# タスク仕様（IO層）

## 時点証拠契約（proposed・未実装）

本節の実測epoch、POS基準とfile境界の保存・読取りは、[ADRの適用範囲の但し書き](../adr/2026-09-18-stocktake-time-evidence.md#適用範囲の但し書き)により㉘のruntime実装対象外とし、次のdesign laneで置き換える。

SPEC-STK-TIME-D1〜D8。IO-01は[20](../function-design/20-io-product-repo.md) / [21](../function-design/21-io-inventory-repo.md) / [24](../function-design/24-io-csv-import-repo.md)の新契約で、kind・両cursor・request ID・実測time_basis_id（PC時計epoch）・flag・受領を保存し、数量と版の不可分更新を強制する。TXの開始/確定と業務判断はBIZが所有する。実測epochはPOS基準のFKにしない。24はpc_clock_epochを含むgate基準のpos_time_basesとsourceの基準FK/導出境界を分離保存し、23のsettled_at/精度と前回候補をBIZへ渡す。

IO-02は[23](../function-design/23-io-z004-parser.md)の任意メタを純粋に抽出し、正常JANのゼロ行を証拠集合へ残す。時計・精算系列の信用や商品別のBefore/Afterは判断しない。既存のCP932・改行・符号・空スロットとPLU占有modeは維持する。新しいSQL/schemaは未実装で、[DB契約](../DB_DESIGN.md)をruntimeの移行・故障注入試験へ渡す。

> **親文書**: [ARCHITECTURE.md](../ARCHITECTURE.md)
> **入力ドキュメント**: `docs/spec/requirements.md`、`docs/spec/requirements-coverage.md`、DB_DESIGN.md（テーブル定義書）

---

### IO-01: SQLiteデータアクセス層

**タスク要求**: 全25テーブルへのCRUD操作、DB接続管理、初期設定を提供する

**理由**: DB操作をIO層に集約することで、BIZ層がSQLを直接書かなくて済む。DB固有の設定（PRAGMA、WALモード等）もここで一元管理

**【データ構造】**

- 各テーブルに対応するRust構造体（Product, Department, Supplier, ReceivingRecord, ...）
- クエリ結果をRust構造体にマッピング

**【処理構造】**

**DB接続初期化:**
1. SQLiteファイルを開く（なければ作成）
2. PRAGMA foreign_keys = ON
3. PRAGMA journal_mode = WAL
4. PRAGMA busy_timeout = 5000
5. MNT-03（マイグレーション）を呼び出してスキーマを最新化

**リポジトリパターン（実装時の分割単位）:**
- product_repository: products, departments, suppliers, price_history のCRUD
- inventory_repository: inventory_movements, receiving_records/items, return_records/items, manual_sales/items, disposal_records/items のCRUD
- sales_repository: sale_records, csv_imports, csv_import_errors のCRUD
- stocktake_repository: stocktakes, stocktake_items のCRUD
- system_repository: operation_logs, app_settings のCRUD
- plu_slot_repository: plu_slots の snapshot / reservation / confirm / release CRUD と products の JAN JOIN

**【制御構造】**
- コネクションプールは不要（1人運用デスクトップアプリ、単一接続で十分）
- トランザクション管理はBIZ層が開始/コミット/ロールバックを指示し、IO層が実行
- product_repository の keyword は商品名、product_code、jan_code、maker_codeの部分一致とし、検索一覧と filter 全件処理で共有する（SPEC-PRV-D2）
- 価格改定は products の価格・`plu_dirty`・NULL supplier_id だけを部分更新し、price_history の old/new 4 値を同じ BIZ transaction で書ける repository 関数を提供する（SPEC-PRV-D5 / D6）
- `find_or_create_supplier` は trim 後の name を使い、空文字を拒否する。`list_price_history` は `changed_at DESC, id DESC`、既定 10・上限 100、不存在 product_code は空配列とする（SPEC-PRV-D6 / D9）

---

### IO-02: Z004パーサー

**タスク要求**: Z004ファイルのバイト列を受け取り、構造化データに変換する。純粋なフォーマット変換のみ、業務ロジックなし

**理由**: カシオSR-S4000固有のCSV形式を、売上取込みと PLU 占有 snapshot の二つの明示 mode で変換する。レジ移行時にはこのモジュールだけ差し替える

**【データ構造】**

入力: 生バイト列

出力: ParseResult
- settlement_date: String（YYYY-MM-DD）
- parsed_rows: Vec<ParsedRow>（line_no, normalized_jan, name, quantity: i32, amount: i32）
- parse_errors: Vec<ParseError>（line_no, error_type, error_message）
- 占有 mode: Vec<PluRegisterSlot>（memory_no, raw_code）を全 **5,000 行**分返す

**【処理構造】**

※ 詳細はdb-design/pos-tables.mdの「B-1: Z004パース仕様 Stage 1: Parse」に記載。ここでは処理の流れのみ。

1. CP932 strictデコード（失敗 → ParseError返却、parsed_rows空）
2. 改行正規化（\u0085 / \r\n / \n / \r）
3. 1行目からYYYY-MM-DD抽出 → settlement_date（失敗 → エラー）
4. 2行目スキップ（ヘッダ）
5. 3行目以降を5フィールドCSVパース
   - フィールド数不正 → parse_errorsに追加、次の行へ
   - JAN正規化（末尾アルファベット除去→13桁化）。全桁ゼロは除外（エラーにもしない）
   - quantity/amountを整数パース。失敗 → parse_errorsに追加
6. ParseResultを返す

**【制御構造】**
- ステートレス。入力バイト列を受け取り、結果を返すだけ
- 行単位エラーは他の行をブロックしない
- 占有 mode は layout A preamble / header 検査を再利用し、売上列・JAN 妥当性を評価しない。13桁 + E は正規化し、8桁 + E×6 は raw のまま返す。データ行数が 5,000 でなければ ImportError で全体を拒否する（IO-02-D1 / SPEC-PLS-D2）

---

### IO-03: 商品マスタCSVインポーター

**タスク要求**: 利用者が作成したCSVファイルを読み込み、構造化データに変換する

**理由**: 初期データ投入（4000商品）やマスタ更新で、Excelで作ったCSVを取り込む。エンコーディングの違いを吸収する

**【データ構造】**

入力: 生バイト列

出力: ImportParseResult
- headers: Vec<String>
- rows: Vec<HashMap<String, String>>（ヘッダ名→値のマップ）
- parse_errors: Vec<ParseError>

**【処理構造】**

1. エンコーディング判定
   - 先頭3バイトがBOM（0xEF 0xBB 0xBF）→ UTF-8としてデコード（BOMは除去）
   - それ以外 → CP932としてstrictデコード
   - デコード失敗 → エラー
2. 改行で分割（\r\n / \n / \r）
3. 1行目をヘッダとしてパース（カンマ区切り）
4. 2行目以降をデータ行としてパース
   - フィールド数がヘッダと一致しない → parse_errorsに追加
5. ImportParseResultを返す

任意列 `PLU対象` は raw string のまま保持する。`1` / `0` / 空欄の意味付けと JAN warning は BIZ-01 の責務（IO-03-D1 / SPEC-PLS-D6）。

**【制御構造】**
- ステートレス
- ヘッダ検証（必須列の確認）はBIZ-01側の責務

---

### IO-04: PLUフォーマッター

**タスク要求**: `plu_slots` 由来の memory No. を持つ product / clear 行を、CV17 1.1.1 が受理する CP932・タブ区切り **11 列**へ変換する（IO-04-D2〜D4 / SPEC-PLS-D3〜D5）。

**データ構造**: `PluExportRow` は `memory_no` と `row_kind=product|clear` を持つ。memory No. は 217〜5000 の入力値を 6 桁ゼロ埋めし、行順から生成しない。

**処理構造**:
- product 行は 13 桁 JAN、加工済み名称、単価、課税方式、固定列、部門リンクを既存 adapter 規則で出力する
- clear 行は memory No.、14 桁ゼロ code、空名称、`\0`、`税1(内税)`、`いいえ`×4、`無し`、`ノンリンク` の exact 11 field とする
- external / free slot は入力・出力しない
- header / 列順、CP932、CRLF、商品名加工、tax mapping は [25-io-plu-formatter.md](../function-design/25-io-plu-formatter.md) を正本とする

**制御構造**: IO-04 は純粋変換だけを行う。slot 予約、status 遷移、Diff / Full の行選択は BIZ-04 が所有する。

---

### IO-05: レポートCSVエクスポーター

**タスク要求**: 売上集計データをCSVファイルに変換する

**理由**: 売上レポートをExcelで開いたり、会計ソフトに取り込んだりする利用者のニーズに対応

**【データ構造】**

入力: Vec<Vec<String>>（行列データ）+ Vec<String>（ヘッダ）

出力: CSVファイルバイト列（UTF-8 BOM付き）

**【処理構造】**

1. ヘッダ行を書き込み
2. データ行を書き込み（カンマ区切り、ダブルクォート囲み）
3. UTF-8 BOM（0xEF 0xBB 0xBF）を先頭に付与
4. バイト列を返す

**【制御構造】**
- ステートレス

---

### IO-06: 画像ファイル管理

**タスク要求**: レシート画像の保存とパス管理を行う

**理由**: 返品・交換記録にレシート画像を添付する機能（REQ-202）の基盤

**【データ構造】**

入力: 画像バイト列 + ファイル名

出力: 保存先の相対パス（例: images/receipts/2026-03-21_001.jpg）

**【処理構造】**

1. 保存ディレクトリの確認（なければ作成）
2. ファイル名の生成: {日付}_{連番}.{拡張子}
3. アプリデータフォルダ/images/receipts/ に保存
4. 相対パスを返す（DBにはこの相対パスを記録）

**【制御構造】**
- ファイル名の連番は同日内でインクリメント

---

### IO-07: POS日報bundleパーサー

**タスク要求**: CASIO SR-S4000 adapter の Z001/Z002/Z005 ファイル束を受け取り、アプリ内部の日報サマリ・支払集計・部門別集計データに変換する。純粋なフォーマット変換のみ、業務ロジックなし

**理由**: current operation の日報主入力は Z004 ではなく Z001/Z002/Z005 である。レジ依存の文字コード、改行、メタ行、ファイル名、列構造を IO adapter に閉じ、BIZ/UI/DB は stable app-internal daily report model を扱えるようにする

**【データ構造】**

入力:
- Vec\<DailyReportSourceFile\>（filename, bytes）

出力:
- DailyReportParseResult
  - report_date: String（YYYY-MM-DD）
  - source_files[]: source_file（Z001/Z002/Z005）, filename, file_hash, size_bytes
  - summary_lines[]: line_key, label, amount?, quantity?, count?, sort_order
  - payment_lines[]: payment_key, label, amount?, count?, sort_order
  - department_lines[]: raw_department_name, normalized_department_name?, amount, quantity?, count?, sort_order
  - parse_errors[]: source_file?, filename?, line_no?, error_type, error_message（BIZ-08の開発者向けdiagnostic logで消費し、利用者向けwire/operation logへraw detailを出さない）

**【処理構造】**

1. ファイル名または内容から adapter 内 source（Z001/Z002/Z005）を判定する
2. 3 source が1つずつ揃っていることを確認する。欠損・重複・未知sourceは parse_errors にする
3. 各ファイルを CP932 strict decode する
4. CP932 decode 後に改行を `\u0085` / CRLF / LF / CR で正規化する
5. sourceごとの行構造を parse する
   - Z001 → summary_lines
   - Z002 → payment_lines
   - Z005 → department_lines
6. 3 source で report_date が一致することを parse result に含める。一致しない場合は parse_errors にする
7. 生バイトから個別hashとbundle_hash素材を作る。bundle_hashの確定はBIZ-08で安定順に束ねて行う

summary/payment/departmentのsourceは格納先から一意に決まるため行ごとには重複保持しない。入力filenameはsource file metadataに加え、source判定前に失敗してmetadataへ入らないunknown fileを識別するparse error provenanceとして診断専用に保持する（IO-07-D1）。

**【制御構造】**
- ステートレス。DBを呼ばない
- CASIO 固有の表記、列位置、メタ行、改行、文字コードはこの層で吸収する
- app core が使う値は line_key / label / amount / quantity / count / department label に正規化して返す

---

### IO-08: EJパーサー

**タスク要求**: CASIO SR-S4000 が SD に保存する電子ジャーナル（EJ）1 file の生バイト列を受け取り、記録（取引・返品・入金 / 出金 / 替・設定書込み・精算）の列へ元 file の行番号つきで構造復元する。通常販売と返品の取引は、観測済みの形式に一致し記録内の照合がそろう場合に限り明細へ復元する。純粋なフォーマット変換のみ、業務ロジックなし

**理由**: EJ を PLU 販売の本番開始の前提にする（[ADR SPEC-STK-TIME-D5](../adr/2026-09-18-stocktake-time-evidence.md#spec-stk-time-d5-ejの完全と商品を判定可能を分ける)）。後続の BIZ が「この取引の明細は確かか」を判定する入口であり、誤復元は在庫の誤った増減に直結するため、一致しない取引を記録単位の復元不能として返す。レジ依存の固定幅・ラベル・モード欄を IO adapter に閉じる（D-023）

**【データ構造】**

入力:
- 生バイト列（CP932、CRLF、BOM なし、各行 24 バイト固定幅）。file 名・現在時刻は受け取らない

出力:
- EjParseResult
  - file_hash: String（生バイトの SHA-256、小文字 hex 64 文字）
  - leading_lines[]: 最初の記録ヘッダより前の行（line_no, text, kind）
  - records[]: header_line_no, mode（Normal / Return / Settlement / Program / Unrecognized）, printed_at（分精度の文字列）, number_prefix, number（先頭 0 を保つ文字列）, body[]（line_no, text, kind）, restoration（Restored { items[], item_count } / NoItems / Unresolved { reasons[] }）
  - items[]: line_no, name, quantity, unit_price?, amount
  - diagnostics[]: line_no?, code（7 種）, scope（Line / Record / File）, message（code ごとの固定文言。行の生の文字列を含めない）

**【処理構造】**

1. 生バイトの SHA-256 を file_hash にする
2. CRLF だけで行に分割する（改行を正規化しない）
3. 各行を CP932 strict decode する。decode できない行があれば致命的エラー（幅の診断より先）
4. 2 行の記録ヘッダ（モード欄 + 日時 / 番号行）で記録を区切る。最初のヘッダより前は先頭断片
5. 記録の種類と記録内の位置（区切りの前 / 後）で行を分類する。24 バイトでない行、または 24 バイトの中に孤立した CR / LF を含む行と、最終改行なしは診断にし、どれにも当たらない行は Unknown として残す
6. 通常・返品の記録は、数量×単価・点数・合計（無ければ現金）を記録内で照合し、そろえば明細を復元する。入金 / 出金 / 替・設定書込み・精算は明細なし
7. 一致しない記録は、その記録だけを復元不能にして診断を積む

詳細は [function-design/29-io-ej-parser.md](../function-design/29-io-ej-parser.md)（IO-08-D1〜D10）。

**【制御構造】**
- ステートレス。DBを呼ばない
- 致命的エラーは 3 種（DecodeFailed / NoRecords / Empty）で部分結果を返さない。それ以外は記録単位の復元不能 + 診断
- EOF を記録の閉じの根拠にしない。復元不能の記録から明細を読み出す API を持たない
- 番号の連続・区間の完全性・分割 file の連結・Z004 との対応・商品同定・時刻の解釈は行わない（次の design lane と BIZ）
