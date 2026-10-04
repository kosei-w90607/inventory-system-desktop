> **親文書**: [FUNCTION_DESIGN.md](../FUNCTION_DESIGN.md)
> **入力ドキュメント**: [ARCHITECTURE.md](../ARCHITECTURE.md), [architecture/io-task-specs.md §IO-07](../architecture/io-task-specs.md), [db-design/pos-tables.md §B-2](../db-design/pos-tables.md), [plu-export-and-real-csv-verification.md](../plu-export-and-real-csv-verification.md)

## 29. IO-07: POS日報bundleパーサー

### 29.1 目的

`daily_report_parser` は、CASIO SR-S4000 adapter の Z001/Z002/Z005 ファイル束を app-internal daily report parse result に変換する純関数モジュールである。

この層はレジ依存の文字コード、改行、ファイルsource判定、メタ行、列位置を吸収する。DB参照、部門マスタ照合、重複判定、取込み可否判断は行わない。

### 29.2 型定義

```rust
struct DailyReportSourceFile {
    filename: String,
    bytes: Vec<u8>,
}

enum DailyReportSourceKind {
    Z001,
    Z002,
    Z005,
}

struct ParsedDailyReportSourceFile {
    source: DailyReportSourceKind,
    filename: String,
    file_hash: String,
    size_bytes: usize,
}

struct DailyReportSummaryLine {
    line_key: String,
    label: String,
    amount: Option<i64>,
    quantity_hundredths: Option<i64>, // 個数の100倍（IO-07-D2）
    count: Option<i64>,
    sort_order: i64,
}

struct DailyReportPaymentLine {
    payment_key: String,
    label: String,
    amount: Option<i64>,
    count: Option<i64>,
    sort_order: i64,
}

struct DailyReportDepartmentLine {
    raw_department_name: String,
    normalized_department_name: Option<String>,
    amount: i64,
    quantity_hundredths: Option<i64>, // 個数の100倍（IO-07-D2）
    count: Option<i64>,
    sort_order: i64,
}

struct DailyReportParseError {
    source_file: Option<DailyReportSourceKind>,
    filename: Option<String>,
    line_no: Option<i64>,
    error_type: String,
    error_message: String,
}

struct DailyReportParseResult {
    report_date: Option<String>,
    source_files: Vec<ParsedDailyReportSourceFile>,
    summary_lines: Vec<DailyReportSummaryLine>,
    payment_lines: Vec<DailyReportPaymentLine>,
    department_lines: Vec<DailyReportDepartmentLine>,
    parse_errors: Vec<DailyReportParseError>,
}
```

**IO-07-D1（最小内部契約と診断境界）**:

- summary / payment / department line のsourceは型と格納先からそれぞれ Z001 / Z002 / Z005 と一意に決まるため、各行へ `source_file` を重複保持しない。
- `DailyReportParseError` は、productionで診断に使う `source_file` / `filename` / `line_no` / `error_type` / `error_message` を保持する。特にsource判定前に失敗するunknown fileは `ParsedDailyReportSourceFile` に入らないため、error側のfilenameを診断専用provenanceとして維持する。
- parse error詳細はBIZ-08が開発者向けdiagnostic logへ構造化して記録する。利用者向け `BizError` と業務監査用operation logにはraw詳細を載せない。

**IO-07-D2（小数の個数は 100 倍の整数で持つ、[D-104](../decision-log.md#d-104-日報の小数の個数別の精算の混在レコード列の対応2026-10-04)）**:

- 部門キーで小数の数量を打った日は、Z001 の総売の行の個数と Z005 のその部門の個数が小数になる（実データに小数 1 桁の形がある）。レジの数量は小数 2 桁まで（取扱説明書の乗算の数量 0.01〜9999.99）。
- 個数の列（Z001 の総売の行の第3列、Z005 の第3列）は `^-?[0-9]+(\.[0-9]{1,2})?$`（3桁区切りのカンマと空白は既存の `clean_number` で除いた後）を受け、浮動小数を通さずに整数部 ×100 + 小数部（1桁は ×10）の `i64` にする（`1.3` → 130、`-2` → -200、`4` → 400）。小数 3 桁以上・`.5`・`1.` は `invalid_number`。
- 件数の列（Z001 の総売以外の行の第3列、Z002 の第3列）は整数のまま。小数なら今までどおり `invalid_number`（件数は数えた回数で小数にならない。実データで小数が出たのは個数の列だけ）。
- 100 倍の整数を単位の数へ戻す変換は IO-07 が持つ 1 つの関数に限り、BIZ-05 / BIZ-08 は wire DTO を作るときにこれを呼ぶ:

```rust
fn quantity_hundredths_to_units(quantity_hundredths: i64) -> f64
```

  `quantity_hundredths as f64 / 100.0`。整数どうしの割り算の丸めで、`130` は `1.3`、`400` は `4.0` の最近接の倍精度になり、serde の出力も `1.3` / `4.0` になる。
- 棄却案: 倍精度（REAL / `f64`）で保存する（月次の部門集計は `SUM` で足すので 0.1 の積み上げで誤差が出る）、文字列のまま保存する（`SUM` できず月次集計が壊れる）、四捨五入して整数にする（レジの値と食い違う）、小数の行の個数を NULL にする（月次集計が NULL 安全側に倒れて、その部門の月の個数が丸ごと「未取得」になる）、wire も 100 倍の整数で返す（UI-09a-D16 の「数は `toLocaleString`」と既存の部門別集計の表示が 100 倍の値を出す。UI 側の割り戻しが全 site に要る）。
- 単位の拡張（[backlog](../backlog.md) の「単位の拡張」。Z004 の小数を 100 倍の整数で受け、商品の単位が長さなら BIZ で cm に換算する案）と同じ 100 倍の整数の表し方にそろえる。日報の個数は部門の数で商品の単位を持たないので、換算はしない。

**IO-07-D3（同じ精算の 3 ファイルかを精算回数で確かめる、D-104）**:

- layout A の 7 行プリアンブルの「精算回数」の行（第1列を trim すると `精算回数`、第2列が数字だけ）から、ファイルごとの精算回数を整数で読む（先頭の 0 は値に影響しない。`0005` と `5` は同じ）。ヘッダより前の行だけを見る。
- 精算回数を読めたファイルが 2 本以上あり、値が 1 つでも違えば `settlement_mismatch`（commit 不可）。日付の一致（§29.3 手順 6）とは別に判定し、両方が出てもよい。
- 精算回数を読めたファイルが 1 本以下なら比べず、日付の一致だけで通す（layout B のエクスポート出力のメタに精算回数があるかは未確認。layout B の束は Z001 が layout A 系の形、Z002 / Z005 が連結型で出る〈§29.4.1〉ため、読めた 1 本だけでは比べられない）。通常の手順（`EcrDatas` から選ぶ layout A）では 3 本とも読める。
- 保証の範囲: 3 本とも精算回数を読める束（通常の layout A）では別の精算の混在を止める。読めないファイルの出所は確かめず、読めないファイルを含む束での別の精算の混入は見逃す（owner 決定 TD-110・TD-111 の受容リスク、D-104 Guarantee range）。比べられるのは、3 帳票の精算回数が一緒に進むから（手元の全期間で、同じ精算の 3 本の精算回数は一致し、番号が飛ぶときは 3 帳票とも同じに飛ぶ）。
- 同じ日に 2 回以上精算すると、日付だけでは別の精算の Z001 / Z002 / Z005 を混ぜて選んでも通る（実データに同日 2 回・3 回の精算の日がある）。ファイル名は `Z001_{日}{接尾字}_{連番}.CSV` の形で、接尾字（空白・`A`・`B`）は精算の順を表さない。精算の順は中身の日時で並べる（ファイル名の文字列の順に頼らない。名前の文字列で並べると順が入れ替わる所がある）。同じ精算の 3 ファイルの組は中身の日付・時刻と連番で作る（ファイル名の `Z00k_` より後ろの文字列だけで組むと割れる組が手元の全期間にある）。ファイル名からは精算回数を推測しない（形の約束が無く、Excel で保存し直した形も受ける）。
- 棄却案: 1 本以上が読めないなら拒む（layout B の束〈Z001 だけが読める〉が正規の形でも止まる）、ファイル名の連番を比べる（ファイル名は利用者が変えうる。中身の精算回数が正）、精算回数を保存して画面に出す（本 lane の Goal は混在を止めること。保存と表示は backlog の「layout A のプリアンブル（精算回数…）」の項で別に設計する）。

**IO-07-D4（「レコード」列は行の位置、ラベルで対応づける、D-104）**:

- layout A の「レコード」列は 3 帳票とも行の位置そのもの（先頭 0 付き 4 桁の `0001`〜。Excel で保存し直した形は先頭の 0 が落ちる）で、帳票仕様の行コード（例: 総売 101）ではない（手元の実データはどのファイルも行の位置）。
- `gross_sales` / `net_sales` / `cash` / `credit` はラベルだけで決める（総売 → `gross_sales`、純売 → `net_sales`、現金 → `cash`、クレジット → `credit`。ASCII の別名 `gross_sales` 等も受ける）。それ以外の行は並び順の `summary_N` / `payment_N`。「レコード」列の値は鍵に使わない。
- 罠: コードで対応づけ、先頭の 0 を正規化して比べると、Z002 の 3 行目（`0003`）がクレジットでない行なのに `credit` に、1 行目（`0001`）が `cash` になる。コードの比較は実データで 1 行も当たらず、正規化した瞬間に誤った鍵を作るので、比較そのものを持たない。
- `credit` の鍵は全角の `クレジット` を含むラベルだけで、半角の `ｸﾚｼﾞｯﾄ` は `credit` にしない（並び順の `payment_N` のまま）。実データの Z002 には半角の `ｸﾚｼﾞｯﾄ` を含むラベルの行が 1 本の中に複数あり、全角の `クレジット` の行は無い。半角も `credit` にすると、1 本の中の複数の行が同じ鍵になり、BIZ-05 の支払の集約（`payment_key` で group 化、24 §14.21 手順 3）が別の項目を 1 行に足す。`credit` の鍵を読む業務の処理は無い（表示の行の鍵だけ）。支払の行の鍵の作り直しは backlog の「既存の支払集計（Z002）で異なる項目が 1 行に合算されうる」で扱う。
- 棄却案: コードを先頭 0 を落として比べる（上の罠）、コードを位置として使う（帳票の行の並びがレジの設定で変わりうる。2022 年に精算の途中でラベルの並びが変わった日がある）、半角の `ｸﾚｼﾞｯﾄ` も `credit` にする（上の合算）。

### 29.3 parse_daily_report_bundle

**関数要求**: Z001/Z002/Z005 のファイル束を受け取り、正規化済みの日報行データとparse errorを返す。

**シグネチャ**:

```rust
fn parse_daily_report_bundle(files: Vec<DailyReportSourceFile>) -> DailyReportParseResult
```

**処理ステップ**:

1. 入力ファイル数とsource判定
   - filenameまたは先頭行の内容から `Z001` / `Z002` / `Z005` を判定する。
   - 欠損、重複、未知sourceは `parse_errors` に追加する。
2. 各ファイルのハッシュとサイズを記録する。
3. CP932 strict decodeを行う。
   - decode失敗は該当sourceのparse errorにする。
4. 改行正規化を行う。
   - CP932 decode後に `\u0085` / `\r\n` / `\n` / `\r` を統一する。
5. source別パース
   - Z001: 日計サマリ行を `summary_lines` に変換する。
   - Z002: 取引キー・支払集計行を `payment_lines` に変換する。
   - Z005: 部門別集計行を `department_lines` に変換する。
6. report_date抽出
   - 3ファイルから抽出できる日付が一致すれば `report_date=Some(YYYY-MM-DD)`。
   - 不一致または抽出不可ならparse errorにし、`report_date=None` または最初の抽出値を返す場合でもBIZ-08でcommit不可にする。
   - 日付が一致しても、精算回数を読めたファイルが 2 本以上で値が違えば `settlement_mismatch` を追加する（IO-07-D3）。
7. `DailyReportParseResult` を返す。
   - `parse_errors` の各要素はBIZ-08の診断経路で消費される。詳細の利用者向けwire/operation logへの転送は禁止する。

### 29.4 source別正規化方針

| Source | 入力の性質 | app-internal target | 備考 |
|---|---|---|---|
| Z001 | 日計サマリ系。CP932 CSV、layout A/B ともヘッダ後は4列データ | `DailyReportSummaryLine` | `line_key` はadapterが安定名を付ける |
| Z002 | 取引キー集計系。CP932 CSV、layout A/B ともヘッダ後は4列データ | `DailyReportPaymentLine` | 支払/取引キーの表示ラベルと件数/金額を分ける |
| Z005 | 部門別集計系。CP932 CSV、layout A/B ともヘッダ後は4列データ | `DailyReportDepartmentLine` | 部門マスタ照合はBIZ-08で行う |

#### 29.4.1 匿名化済み実CSV shape（2026-07-04）

CV17 1.1.1 では、SD取込み後にツール内部ディレクトリへ常在するファイル（layout A）と、レジスターツールのエクスポート機能出力（layout B）が確認されている。運用主経路は現地手順でなお確認中のため、IO-07 は両 layout を正式サポートし、layout 検出後に同じ4列行へ正規化する。gitに入れるfixtureは匿名化shapeを満たすsyntheticデータのみとし、実CSV本文・実店舗値は保存しない。

**layout A: プリアンブル型**

| Source | 匿名化shape | Parserでの扱い |
|---|---|---|
| 共通 | CRLF複数行。7行プリアンブル（マシン/ファイル/モード/精算回数/日付/時刻/空行）→ 1行ヘッダ → 4列データ行。第1列の「レコード」は行の位置（先頭 0 付き 4 桁の `0001`〜、IO-07-D4） | ヘッダ行を検出し、それ以前はメタとして読み飛ばす。ただし「精算回数」の行だけは読む（IO-07-D3）。ヘッダ後の非空行が4列でない場合は `invalid_format` |
| Z001 | 4列は `record_code, label, quantity_or_count, amount`。ヘッダの第3列は「個数/件数」、第4列は「金額」。日付は `YYYY/M/D` または `YYYY-MM-DD` を受けて `YYYY-MM-DD` へ正規化する | 総売ラベルの行を `gross_sales`、純売ラベルの行を `net_sales` にする（ラベルだけで決める、IO-07-D4）。総売の行は第3列を `quantity_hundredths`（小数 2 桁まで、IO-07-D2）、それ以外の行は第3列を `count`（整数）、第4列を `amount` として保存する |
| Z002 | 4列は `record_code, label, count, amount`。ヘッダの第3列は「個数/件数」、第4列は「金額」。日付は `YYYY/M/D` または `YYYY-MM-DD` を受けて `YYYY-MM-DD` へ正規化する | 第3列を `count`（整数）、第4列を `amount` として `payment_lines` に変換する。現金ラベルの行は `cash`、クレジットラベルの行は `credit`（ラベルだけで決める、IO-07-D4） |
| Z005 | 4列は `record_code, department_label, quantity, amount`。全フィールドがクォートされる場合がある。日付は `YYYY-MM-DD` または `YYYY/M/D` を受けて `YYYY-MM-DD` へ正規化する | 第2列を `raw_department_name`、第3列を `quantity_hundredths`（小数 2 桁まで、IO-07-D2）、第4列を必須 `amount` として `department_lines` に変換する。`count` は `None` |

**layout B: 連結型**

| Source | 匿名化shape | Parserでの扱い |
|---|---|---|
| 共通 | 通常の行改行を持たず、先頭メタフィールドの後に `レコード, キャラクター, 個数/件数または個数, 金額` ヘッダと4列データ行が連結される | quoted field の連続からヘッダ4フィールドを検出し、ヘッダ後を4フィールド単位にchunk化する。4列反復で割り切れない場合は `invalid_format` |
| Z001 | layout A 系のCRLF複数行で出る場合がある | layout A と同じ正規化を使う |
| Z002 | メタフィールド + `record_code, label, count, amount` の4列反復 | layout A と同じ `payment_lines` へ正規化する |
| Z005 | メタフィールド + `record_code, department_label, quantity, amount` の4列反復 | layout A と同じ `department_lines` へ正規化する |

数値列の意味は、CSV自身のヘッダ行（プリアンブル直後または連結フィールド中の4列テキスト行）と `SRS4000_JA3.pdf` / `ECRCV17.pdf` のレポート仕様を正とする。「レジ明細 - 見せる用.xlsx」は sanitized 版のため数値突合には使わず、列構成・ラベル・行の並びの参照に限定する。

どちらの layout にも該当しない構造、またはヘッダ後の4列反復が崩れた構造は `invalid_format` として安全に落とす。

**行の構成と性質（2026-09-27、repo 外の匿名化要約と帳票仕様から。実値・実ラベルは記録しない）**: 匿名化要約（2026-07 の 2 回の採取）では、Z001 は 8 行目がヘッダ（layout A の 7 行プリアンブルの直後）でデータ 28〜29 行、Z002 も同じ 4 列形状でデータ約 50 行だった。行の名前ごとの照合は生の CSV を開かない決まりのため未実施で、Z001 の行の種類は `SRS4000_JA3.pdf` の日計明細の精算の印字例（p.33）から、部門・総売・純売・在高（現金・券・信用）・税の対象額と税額・非課税・高額券の枚数・丸め・取引中止・戻モード・電卓・領収書の類と推定する（CV17 の Z001 が印字と同じ行の集合かは未確認）。同書 p.57 の表で日計明細の精算は取引データをクリアする（点検はクリアしない）ため、Z001 の各行は前回の精算から今回までの件数・金額で、同日の 2 回の精算は足すとその日の値になると帳票仕様からは言える。構成比は標準で印字されず、CSV も個数/件数と金額の列だけを持つ。実物の同日 2 回精算の Z001 / Z002 は未確認のため、Z001 の行は合算せず取込みごとに表示する（D-096）。

### 29.5 エラーハンドリング

| error_type | 発生条件 | BIZ-08での扱い |
|---|---|---|
| missing_source | Z001/Z002/Z005のいずれかがない | commit不可 |
| duplicate_source | 同じsourceが複数ある | commit不可 |
| unknown_source | source判定できないファイルがある | commit不可 |
| decode_failed | CP932 strict decodeに失敗 | commit不可 |
| invalid_format | source別の最低限行構造に合わない | commit不可 |
| invalid_date | 日付抽出不可または不一致 | commit不可 |
| settlement_mismatch | 精算回数を読めたファイルが 2 本以上あり、値が違う（IO-07-D3） | commit不可。利用者向けの文は BIZ-08-D2 |
| invalid_number | 金額/件数が整数でない、個数が小数 2 桁までの数でない（IO-07-D2） | commit不可 |

### 29.6 非目的

- DBを読むこと。
- departmentsとの照合。
- bundle_hashによる重複判定。
- daily_report_importsへの保存。
- sale_recordsやinventory_movementsへの変換。
- Excel帳票を読み込むこと。
- `Z006`（グループ）、`Z009`（時間帯別）、`Z011`（担当者）のparse。個人店の初期日報用途が確認されるまでは対象外とし、必要になった時にadapter拡張として扱う。
