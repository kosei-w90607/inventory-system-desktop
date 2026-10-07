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
    settlement_no: Option<i64>, // 束の精算回数（IO-07-D5）
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
- 精算回数を読めたファイルが 1 本以下なら比べず、日付の一致だけで通す（layout B のエクスポート出力のメタに精算回数があるかは未確認。layout B の束は Z001 が layout A 系の形、Z002 / Z005 が連結型で出る〈§29.4.1〉ため、読めた 1 本だけでは比べられない）。SD の `XZ_BKUP` と PC の `EcrDatas` にある layout A では 3 本とも読める。取込み前の `XZ` の原本も、CV17 が移して複製するだけなので同じ bytes・同じ形と推定し（推定・強、§29.7.2 の SD-23）、3 本とも読める。
- 保証の範囲: 3 本とも精算回数を読める束（通常の layout A）では別の精算の混在を止める。読めないファイルの出所は確かめず、読めないファイルを含む束での別の精算の混入は見逃す（owner 決定 TD-110・TD-111 の受容リスク、D-104 Guarantee range）。比べられるのは、3 帳票の精算回数が一緒に進むから（手元の全期間で、同じ精算の 3 本の精算回数は一致し、番号が飛ぶときは 3 帳票とも同じに飛ぶ）。
- 同じ日に 2 回以上精算すると、日付だけでは別の精算の Z001 / Z002 / Z005 を混ぜて選んでも通る（実データに同日 2 回・3 回の精算の日がある）。ファイル名は `Z001_{日}{接尾字}_{連番}.CSV` の形で、接尾字（空白・`A`・`B`）は精算の順を表さない。精算の順は中身の日時で並べる（名前の文字列で並べると順が入れ替わる所がある）。ファイル名の `Z00k_` より後ろが同じ 3 本は、手元の全期間で同じ精算だった（手元の整理の folder を外し、中身の日付とファイル名の `Z00k_` より後ろで組むと、各帳票 142 本が 142 組すべてで 3 本そろい、3 本の精算回数が一致した。同じ日に 2 回以上精算した 19 日・42 組も同じ）。このため利用者への選び直しの案内（BIZ-08-D2）は「`Z00k_` より後ろが同じ 3 つ」を手がかりにする。ただしファイル名は利用者が変えうるので、アプリは名前で組まず、同じ精算かは中身の精算回数で判定する（名前は案内にだけ使う）。ファイル名からは精算回数を推測しない（形の約束が無く、Excel で保存し直した形も受ける）。
- 棄却案: 1 本以上が読めないなら拒む（layout B の束〈Z001 だけが読める〉が正規の形でも止まる）、ファイル名の連番を比べる（ファイル名は利用者が変えうる。中身の精算回数が正）、精算回数を保存して画面に出す（本 lane の Goal は混在を止めること。保存と表示は backlog の「layout A のプリアンブル（精算回数…）」の項で別に設計する）。

**IO-07-D4（「レコード」列は行の位置、ラベルで対応づける、D-104）**:

- layout A の「レコード」列は 3 帳票とも行の位置そのもの（先頭 0 付き 4 桁の `0001`〜。Excel で保存し直した形は先頭の 0 が落ちる）で、帳票仕様の行コード（例: 総売 101）ではない（手元の実データはどのファイルも行の位置）。
- `gross_sales` / `net_sales` / `cash` / `credit` はラベルだけで決める（総売 → `gross_sales`、純売 → `net_sales`、現金 → `cash`、クレジット → `credit`。ASCII の別名 `gross_sales` 等も受ける）。それ以外の行は並び順の `summary_N` / `payment_N`。「レコード」列の値は鍵に使わない。
- 罠: コードで対応づけ、先頭の 0 を正規化して比べると、Z002 の 3 行目（`0003`）がクレジットでない行なのに `credit` に、1 行目（`0001`）が `cash` になる。コードの比較は実データで 1 行も当たらず、正規化した瞬間に誤った鍵を作るので、比較そのものを持たない。
- `credit` の鍵は全角の `クレジット` を含むラベルだけで、半角の `ｸﾚｼﾞｯﾄ` は `credit` にしない（並び順の `payment_N` のまま）。実データの Z002 には半角の `ｸﾚｼﾞｯﾄ` を含むラベルの行が 1 本の中に複数あり、全角の `クレジット` の行は無い。半角も `credit` にすると、1 本の中の複数の行が同じ鍵になり、BIZ-05 の支払の集約（`payment_key` で group 化、24 §14.21 手順 3）が別の項目を 1 行に足す。`credit` の鍵を読む業務の処理は無い（表示の行の鍵だけ）。支払の行の鍵の作り直しは backlog の「既存の支払集計（Z002）で異なる項目が 1 行に合算されうる」で扱う。
- 棄却案: コードを先頭 0 を落として比べる（上の罠）、コードを位置として使う（帳票の行の並びがレジの設定で変わりうる。2022 年に精算の途中でラベルの並びが変わった日がある）、半角の `ｸﾚｼﾞｯﾄ` も `credit` にする（上の合算）。

**IO-07-D5（束の精算回数を返す、[D-111](../decision-log.md#d-111-毎日の売上データはレジの-sd-から直接読むcv17-は-plu-の書込みだけ2026-10-06)）**:

- 3 本とも精算回数を読め（IO-07-D3）、値がそろう束だけ `settlement_no = Some(値)` にする。1 本でも読めない束（layout B を含む）と、値が違う束（`settlement_mismatch`）は `None`。
- 使い道は BIZ-08 の「同じ精算を別の bytes で二重に取り込まない」guard（BIZ-08-D4）と、SD の経路で `None` の束を取り込まない guard（BIZ-08-D6）だけ。IO は精算回数の意味（系列・リセット・欠番）を解釈しない。
- 棄却案: 1 本でも読めた値を束の値にする（layout B の束では Z001 だけの値になり、ほかの 2 本の出所を確かめない値で guard が判定する）、文字列で返す（IO-07-D3 は先頭の 0 を落として整数で比べる。`0005` と `5` が別の値になる）。

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

CV17 1.1.1 では、SD取込み後にツール内部ディレクトリへ常在するファイル（layout A）と、レジスターツールのエクスポート機能出力（layout B）が確認されている。売上データの標準の入力元はレジの SD の原本で、アプリが SD を直接読む（§29.7、D-111。2026-08-01 の「SD → CV17 取込み → `EcrDatas` から選ぶ」を 2026-10-06 に置き換えた）。SD の `XZ_BKUP` の file は PC の `EcrDatas` の同じ相対 path の file と同じ bytes の layout A だった（§29.7.2）。layout B は CV17 の明示書出しだけが作り、通常の経路には現れないが、IO-07 は両 layout を受理し、layout 検出後に同じ4列行へ正規化する。gitに入れるfixtureは匿名化shapeを満たすsyntheticデータのみとし、実CSV本文・実店舗値は保存しない。

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

### 29.7 IO-09: レジの SD の列挙と読取り（D-111）

#### 29.7.1 目的と置き場所

`register_sd`（module `io::register_sd`、未実装）は、レジ（CASIO SR-S4000）の SD を探し、売上の file（Z・EJ）の名前を列挙し、指定された 1 file の生バイトを読取り専用で読む IO 層の関数群である。file の中身の解釈は IO-07（日報）・IO-02（Z004）・IO-08（EJ）が行い、どの file を取込みの候補にするか・取込み済みかの判断は BIZ（日報は BIZ-08 §37.9）が行う。DB を呼ばず、SD に書かない。

本節は IO-09 の function-design の正本である。新しい function-design の file を作ると `src-tauri/tests/design_compliance_test.rs` の `build_doc_to_modules_map()` への登録が要り、docs だけの設計 lane では行えないため、IO-07 の文書に置く。runtime の lane は同 map の `29-io-daily-report-parser.md` の行に `io::register_sd` を足す（登録義務）。

#### 29.7.2 SD の配置と名前（adapter facts）

2026-10-06 に店の PC で SD を読取り専用で 1 回だけ採取した結果（repo 外の SD 調査、名前・形・hash だけ。中身は読んでいない）と、CV17 の説明書（C p.16・19・26）から。件数は書かない（D-050）。分類の「観測」は設計が必ず扱う場合、「状態」はこの日・この期間の状態で、決め打ちにせず読込み時に検査する値、「推定」は観測ではないが資料・解析から強く推せること（実機の確認を残す）、「未確認」は今回の範囲で決まらないこと。

| ID | 事実 | 分類 |
|---|---|---|
| SD-01 | 機種の root は `<drive>:\CASIO\SR500_550_4000\`（機種名 `SR-S4000` と綴りが違う）。売上は `XZ`、CV17 で取り込んだ後の売上は `XZ_BKUP`。ほかに `AUTOPGM`・`LOGO` がある。`RESERVE` は無かった | 観測（root と `XZ` / `XZ_BKUP`）／状態（`RESERVE` の有無） |
| SD-02 | 精算前の Z は `XZ\yyyy\mm\Znnn_dda.CSV`（`nnn` は系列、`dd` は日、`a` は半角空白か `A`〜`Z` の 1 文字。年・月の folder は精算した日の日付）。CV17 の取込み後は `XZ_BKUP\yyyy\mm\Znnn_dda_nnnn.CSV`（4 桁の連番つきに改名） | 観測 |
| SD-03 | EJ は `XZ\EJyymmdd.TXT`（`XZ` の直下、年・月の folder なし）、取込み後は `XZ_BKUP\EJyymmdd_nnnn.TXT`。SD 上の綴りは大文字の `EJ`（説明書の綴りは `Ej`） | 観測 |
| SD-04 | 系列は Z001・Z002・Z004・Z005 があり、Z006・Z009・Z011 は全期間で無かった（CV17 の設定で変わる） | 状態 |
| SD-07 | 旧い `XZ\yyyy\mm\` に、既知の名前の規則に合わない file が残っている（正体は未確認）。中身が空の `XZ\yyyy\mm\` の folder も残る | 観測（未知の名前の file がある）／未確認（正体） |
| SD-08 | 同じ日・同じ系列の Z が 2 本以上ある日がある。接尾字は空白・`A`・`B` を観測した。CV17 の改名で接尾字が空白に戻ることがあり、本数・接尾字は精算の順を表さない（IO-07-D3） | 観測 |
| SD-09 | `XZ` 直下の EJ は、CV17 が移すまで同じ file に精算をまたいで追記されて伸びる（持ち帰りの EJ の集計で、1 file に複数の精算が入る file がある）。file 名の日付はその file の最後の精算の日 | 観測（推定を集計で裏付け） |
| SD-11 | `XZ_BKUP` の Z・EJ はすべて `_nnnn` 付きの名前 | 観測 |
| SD-14 | この日の `XZ` に取込み前の Z は無く、EJ は 1 本だった。取込み前の Z が何日分も溜まった状態は見ていない | 状態 |
| SD-18 | 売上/EJ の保存の設定が有効なら、SD が無いとレジは精算できない（C p.4、E180） | 観測（説明書） |
| SD-22 | SD の `XZ_BKUP` の Z・EJ は、PC の `EcrDatas` の同じ相対 path の file と全件で size・SHA-256 が一致した（PC にだけあったのは採取の後の精算の分） | 観測 |
| SD-23 | 取込み前の `XZ` の原本と、取込み後の file は同じ bytes。CV17 の SD の取込みは原本を `MoveFileExA` で `XZ_BKUP` へ改名・移動し、移動後の file を `CopyFileA` で `EcrDatas` へ複製するだけで、中身を書く API（`CreateFileA/W`・`WriteFile`・`SHFileOperation`）を import していない（CV17 2.0.1 の `CV17ST.dll` の静的解析、2026-10-07、repo 外の解析記録）。SD-22 と合う | 推定・強（packet の Contract Probe P1）／未確認（店の CV17 は 1.1.1、.NET 側の handler の中身、実機の前後比較〈店の R-50、runtime の lane の L3 の前〉） |
| SD-24 | `XZ_BKUP` の Z・EJ は全件が CP932 strict・BOM 無し・CRLF だけ（孤立した CR / LF 無し）・最終改行あり。Z001 / Z002 / Z005 は layout A の形、Z004 は 5 列の固定長。系列ごとの行数・列数は全 file で同じだった | 観測（この形が全期間ある）／状態（いつもこの形であること）。取込み前の `XZ` の原本も同じ形と推定（SD-23） |
| SD-25 | 店の PC の reader で SD は取外し可能な volume として見え（その日は 1 つだけ）、読取り専用の採取の前後で SD の file の一覧・size・hash の差は 0 だった。SD には `System Volume Information` がある | 観測 |

#### 29.7.3 型定義

```rust
struct RegisterSdRoot {
    path: PathBuf,        // `<drive>:\CASIO\SR500_550_4000` の実 path
    volume_label: String, // 表示用。ドライブ名（`G:` 等）
}

// 「自動で探すか、選んだ場所か」の選択の enum は BIZ-08 が持つ（`DailyReportSdSelection`、37 §37.9）。
// CMD は IO の型を使えない（`src-tauri/tests/architecture_test.rs` の LAYER_RULES: cmd → io は禁止）ので、IO-09 の関数はこの選択を引数に取らない。

struct RegisterSdLocatedFile {
    root: RegisterSdRoot,
    relative_path: String, // root からの相対 path（区切りは `\`。RegisterSdEntry.relative_path と同じ形）
}

enum RegisterSdArea {
    Pending,  // `XZ`（精算前。CV17 で取り込んでいない）
    Imported, // `XZ_BKUP`（CV17 で取り込んだ後）
}

enum RegisterSdEntryKind {
    Z { series: u16, day: u8, suffix: char, backup_seq: Option<u16> }, // suffix は ' ' か 'A'..='Z'
    Ej { backup_seq: Option<u16> },
    Unknown, // 名前の規則に合わない file。中身を読まない
}

struct RegisterSdEntry {
    relative_path: String,   // root からの相対 path（区切りは `\`。例 `XZ\2026\10\Z001_06 .CSV`）
    area: RegisterSdArea,
    kind: RegisterSdEntryKind,
    date: Option<NaiveDate>, // Z: folder の yyyy・mm と名前の dd、EJ: 名前の yymmdd（20yy）。Unknown は None
    size_bytes: u64,
}

struct RegisterSdListing {
    entries: Vec<RegisterSdEntry>,
    imported_area_present: bool, // `XZ_BKUP` があるか（無いのは CV17 で一度も取り込んでいない SD）
}

struct RegisterSdFile {
    relative_path: String,
    bytes: Vec<u8>,
    shape: RegisterSdShape,
}

struct RegisterSdShape {
    cp932_strict: bool,   // 全体を CP932 で strict に decode できる
    has_bom: bool,        // 先頭が UTF-8 の BOM（EF BB BF）
    crlf_only: bool,      // 改行が CRLF だけ（孤立した CR・LF・NEL が無い）
    ends_with_crlf: bool, // 最後が CRLF
}

enum RegisterSdError {
    // 自動で探して 0 件・2 件以上は error にせず `Ok(vec)` で返す（§29.7.4 手順 2。止めて案内するのは BIZ-08 §37.9 手順 1）
    NotRegisterSd,                  // Selected の path から root を解決できない
    MissingSalesArea,               // root に `XZ` が無い
    InvalidPath,                    // read の相対 path が root の外を指す
    TooLarge { relative_path: String },
    Io { relative_path: String, kind: std::io::ErrorKind },
}
```

#### 29.7.4 find_register_sd_roots / resolve_register_sd_root

**関数要求**: SD の root を見つける（IO-09-D1）。

**シグネチャ**:

```rust
fn find_register_sd_roots() -> Result<Vec<RegisterSdRoot>, RegisterSdError>
fn resolve_register_sd_root(selected: &Path) -> Result<RegisterSdRoot, RegisterSdError>
fn locate_in_register_sd_roots(roots: &[RegisterSdRoot], path: &Path) -> Option<RegisterSdLocatedFile> // 純関数（file system を見ない）
fn check_selected_file_present(path: &Path) -> Result<(), RegisterSdError> // その時点で通常の file として在り、metadata を読めるか
```

**処理ステップ**:

1. `find_register_sd_roots`: Windows では `GetLogicalDrives` の各 drive のうち `GetDriveTypeW` が `DRIVE_REMOVABLE` のものだけを見て、`<drive>:\CASIO\SR500_550_4000` が directory なら root にする（大文字小文字は区別しない）。network・固定 disk・CD の drive は見ない（応答しない network drive で止まらない）。依存は既存の `windows-sys`（`Win32_Storage_FileSystem`、`src-tauri/Cargo.toml` の `[target.'cfg(windows)'.dependencies]`）で、新しい crate を足さない。Windows 以外（開発機・CI）では空の列を返す。
2. 0 件なら `Ok(vec![])`、2 件以上もそのまま `Ok` で返す（IO は件数で error にしない。0 件の「SD が見つかりません」と 2 件以上の「売上を読む SD だけを差してください」は BIZ-08 §37.9 手順 1 が決める）。
3. `resolve_register_sd_root`: 選ばれた path が drive の root・`CASIO`・`SR500_550_4000` のどれかで、そこから `CASIO\SR500_550_4000` に当たる directory が見つかれば root にする。それ以外は `NotRegisterSd`。選ばれた path は取外し可能な drive でなくてよい（reader が固定 disk として見える PC と、SD の写しを読む復旧に使う）。
4. `locate_in_register_sd_roots`: 手でファイルを選ぶ経路（UI-07-D16）の file が、`find_register_sd_roots` の返した root（取外し可能な drive の `CASIO\SR500_550_4000`、IO-09-D1 と同じ規則）の下にあるかを、path の文字列だけで決める。`path` が絶対 path で、`.`・`..` の要素を持たず、要素の列が `roots` のどれかの `path` の要素の列で始まる（大文字小文字は区別しない）なら、その root と残りの要素を `\` でつないだ `relative_path` を返す。それ以外（root の外、相対 path、`..` を含む、`roots` が空）は `None`。file を開かず、名前の規則（IO-09-D2）でも分けない（root の下なら名前に依らず SD の file として扱う）。BIZ が `find_register_sd_roots` を 1 回呼んでその結果を渡す（test は一時 directory の root を渡す）。
5. `check_selected_file_present`: 手順 4 が `None` を返した手で選んだ file について、`std::fs::metadata(path)` でその時点で在り、通常の file（`is_file()`）かを確かめる。読めない（在らない・権限が無い・drive が無い）、または通常の file でなければ `Io { relative_path: path の文字列, kind }`（通常の file でないときの kind は `InvalidInput`）。file を開かず、中身を読まない。用途: SD の上の file を選んだ後に SD を抜くと、手順 1 の root が無くなり手順 4 が `None` を返す。この file を PC 上の file として扱わず止めるため（BIZ-08 §37.3 手順 1a）。

**IO-09-D1（root の見つけ方）**: 自動で探すのは取外し可能な drive の中の決まった folder だけで、見つからない・2 つ以上のときは推測で選ばない。既定は自動で探し、見つからなければ利用者が folder を選ぶ（owner 決定 2026-10-06、D-111、UI-07-D15）。選ぶ経路も同じ IO で持つ。

#### 29.7.5 list_register_sd_entries

**関数要求**: root の `XZ` と `XZ_BKUP` から、売上の file の名前を列挙する。中身は読まない（IO-09-D2）。

**シグネチャ**:

```rust
fn list_register_sd_entries(root: &RegisterSdRoot, from: NaiveDate) -> Result<RegisterSdListing, RegisterSdError>
```

**処理ステップ**:

1. `XZ` が無ければ `MissingSalesArea`。`XZ_BKUP` は無くてよい（`imported_area_present = false`）。
2. `XZ` と `XZ_BKUP` のそれぞれで、4 桁の年・2 桁の月（01〜12）の名前の folder のうち (年, 月) が `from` の (年, 月) 以上のものだけに入り、その中の file を Z の規則で分類する。それ以外の名前の folder には入らない。
3. `XZ` と `XZ_BKUP` の直下の file を EJ の規則で分類する。`XZ` 直下の EJ（伸び続ける file、SD-09）は `from` によらず返す。
4. 名前の規則（大文字小文字を区別しない。FAT は区別せず、SD 上は大文字の `EJ`、説明書は `Ej`）:
   - Z: `^Z(\d{3})_(\d{2})([ A-Z])(_(\d{4}))?\.CSV$`。`XZ` では連番なし、`XZ_BKUP` では連番ありだけを Z とする（逆は `Unknown`）。日付は folder の年・月と名前の日で、暦日として不正なら `Unknown`。
   - EJ: `^EJ(\d{2})(\d{2})(\d{2})(_(\d{4}))?\.TXT$`。`XZ` では連番なし、`XZ_BKUP` では連番ありだけを EJ とする。日付は 20yy 年。
   - どれにも当たらない file は `Unknown` として返す（名前と size だけ。中身を読まない）。SD-07 の旧い folder の未知の file はこれに当たる。
5. `date` が `from` より前の Z・EJ（`XZ` 直下の EJ を除く）は返さない。系列番号（`nnn`）は決め打ちにせず、Z006・Z009・Z011 や未知の番号もそのまま返す（使うかは BIZ が決める）。
6. 列挙の途中で読めなくなった（SD を抜いた等）ら `Io`。途中までの一覧を返さない。

**IO-09-D2（名前で分類し、中身で判定する）**: 名前は列挙と組分けの手がかりにだけ使い、取込み済みか・同じ精算かは中身（hash と精算回数）で決める（IO-07-D3 と同じ線引き）。名前が規則に合わない file は読まずに `Unknown` で返し、推測で Z や EJ にしない。年・月の folder の絞り込みは、全期間の `XZ_BKUP` を毎回読まないための列挙の範囲で、取込み済みの判定には使わない。

#### 29.7.6 read_register_sd_file

**関数要求**: 列挙した 1 file の生バイトを読取り専用で読み、形を測る（IO-09-D3・D4）。

**シグネチャ**:

```rust
fn read_register_sd_file(root: &RegisterSdRoot, relative_path: &str, max_bytes: u64) -> Result<RegisterSdFile, RegisterSdError>
```

**処理ステップ**:

1. `relative_path` を `\` で分け、空・`.`・`..`・drive 指定・絶対 path の要素があれば `InvalidPath`。root と結合した path が root の下でなければ `InvalidPath`。
2. `std::fs::File::open`（読取り専用）で開き、`max_bytes + 1` byte まで読む。超えたら `TooLarge`（全体を読まない）。開けない・読めないは `Io`。読み終えたら handle を閉じる（関数の外へ handle を持ち出さない）。
3. 形を測る: CP932 の strict decode の成否、先頭の UTF-8 BOM、改行が CRLF だけか、最後が CRLF か。測るだけで、直さない・捨てない。
4. `RegisterSdFile` を返す。

**IO-09-D3（SD を書き換えない）**: `io::register_sd` は SD への書込み・作成・改名・移動・削除・属性の変更・時刻の変更を行う関数を持たない。そのため、この module が使ってよい file system の API を次の許可の列に限る（列にない API は使わない。禁止の語を数える形にしない）: `std::fs::File::open`（読取り専用で開く）、`std::fs::read_dir`、`std::fs::metadata`、型の `std::fs::{File, ReadDir, DirEntry, Metadata, FileType}`、`std::io::Read` の読取りの method（`read`・`read_to_end`・`take`）、`File::metadata`・`DirEntry::{path, file_name, file_type, metadata}`・`Metadata::{is_file, is_dir, len}`、`std::path` の文字列の操作と `Path::is_dir`・`Path::is_file`（中で `metadata` を読むだけ）、Windows の `windows_sys` の `GetLogicalDrives`・`GetDriveTypeW`（と定数 `DRIVE_REMOVABLE`）。使わないものの例（許可の列にないので使えない）: `OpenOptions`、`File::create`・`File::create_new`、`fs::write`・`fs::copy`・`fs::rename`・`fs::hard_link`・`fs::soft_link`・`create_dir*`・`remove_*`・`fs::set_permissions`、`File` の `set_len`・`set_modified`・`set_times`・`set_permissions`、`std::io::Write`、`windows_sys` の上の 2 関数以外。runtime の lane が source の検査 test（Matrix の `register_sd::module_uses_only_allowed_fs_api`）で、`src-tauri/src/io/register_sd.rs` の `std::fs` / `fs::` / `File::` / `OpenOptions` / `std::io::Write` / `windows_sys` の出現が許可の列の中だけかを確かめる（`use std::fs::*` と別名の `use std::fs as …` も許可の列の外として red）。file は読取り専用で開き、読んだら閉じる。Windows が読取りで FAT の最終アクセス日を変える・`System Volume Information` を作ることはアプリでは止められないが、店は CV17 の取込みのために毎日この PC で同じ SD を書込み可能なまま差してきており（SD-25）、新しい種類の副作用は増えない。(a) の段階（IO-09 と SD 直読みの runtime の lane）では、CV17 と同じく `XZ` から `XZ_BKUP` へ移す案は採らない（owner 決定 2026-10-06、D-111。この段階では SD は動かさない。移す操作は D-111 (1) の (b) の後続の lane が別の module で作る）。動かさない前提（Z・EJ が `XZ` に残っても精算が続く）は、Z の名前が日付と同じ日の精算ごとの接尾字で決まり別の日の Z とぶつからないこと（SD-02・SD-08）と、EJ が約 1 か月 `XZ` に残っても精算が続いた店の実績（SD-09、repo 外の回答台帳 TD-139）で受け入れた。取込み済みを `XZ_BKUP` へ移す操作（D-111 (1) の (b)、後続の lane）ができるまで店は CV17 の取込みを今の運用のまま続けるので（D-111 の運用の制約）、Z が `XZ` に何日も溜まる状態は生じない。`XZ` の file が数千本になったときのレジの振舞いは (b) の lane の前提（D-111 の Revisit）。読んだ原本の写しは PC 側のアプリの folder に書き（§29.8、IO-10）、書く module を `io::register_sd` と分けて、この module に書込みの API が無いことを保つ。

**IO-09-D4（形は測って BIZ が止める）**: SD-24 の符号化・改行・BOM は「状態」なので IO は決め打ちにせず測って返し、外れた file を取込みの候補にしないのは BIZ（BIZ-08-D3）が決める。行数・列数は各 parser の構造の検査（IO-07 の `invalid_format`、IO-02、IO-08）に任せ、固定の行数を IO で求めない（Z004 の 5,000 枠も含め、レジの設定で変わりうる）。

#### 29.7.7 エラーハンドリング

| エラー | 発生条件 | BIZ での扱い |
|---|---|---|
| （error でない）空の列 | 自動で root が無い | 「SD が見つかりません」と予備の経路（folder を選ぶ）を案内 |
| （error でない）2 つ以上の列 | 自動で root が 2 つ以上 | 推測で選ばず、売上の SD だけを差すよう案内 |
| NotRegisterSd | 選んだ folder がレジの SD でない | 選び直しを案内 |
| MissingSalesArea | `XZ` が無い | 読まずに止める |
| InvalidPath | 相対 path が root の外 | 内部の誤り。診断ログ |
| TooLarge | 上限を超える | その束・file を候補にしない（読めない） |
| Io | 列挙・読取りの途中の失敗 | 読み全体を失敗にし、途中の結果を使わない |
| Io（`check_selected_file_present`） | 手で選んだ file がその時点で無い・読めない・通常の file でない | PC の file として通さず、37 §37.3 手順 1a (iii) の固定の文で止める |

#### 29.7.8 採らなかった案

| 案 | 採らない理由 |
|---|---|
| すべての drive を探す | 応答しない network drive で止まる。SD は取外し可能な drive として見えた（SD-25） |
| file 名の日付・接尾字・連番で取込み済みを決める | CV17 の改名で接尾字が戻り、連番は接尾字と無関係（SD-08）。SD と PC で名前が違う（SD-02） |
| 改行を正規化して読む前提で形を測らない | 取込み前の原本は取込み後と同じ bytes と推定する（SD-23）が、形を観測したのは `XZ_BKUP` の分だけで（SD-24）、形は状態の値なので決め打ちにしない（IO-09-D4）。測らないと、外れた file を黙って読む |
| `XZ_BKUP` を読まない | CV17 の取込みを誰かが続けると、精算の分が `XZ_BKUP` にしか無い日ができる |
| 全期間の `XZ_BKUP` を毎回読む | 全期間の Z004 を毎回読むことになり遅い。取込み済みは hash で分かるので、範囲は BIZ の窓で足りる |

### 29.8 IO-10: SD から読んだ原本の写しの保存（D-111）

#### 29.8.1 目的と置き場所

`pos_source_copy`（module `io::pos_source_copy`、未実装）は、SD から読んで取り込んだ file の生バイトを、PC 側のアプリのデータ folder に写しとして書く IO 層の関数である。CV17 の取込みをやめると PC 側に原本の写しが無くなる（CV17 は `EcrDatas` に写しを置いていた）ための代わり（owner 決定 2026-10-06）。SD には書かない（書く先はアプリのデータ folder だけ）。どの file をいつ書くか・失敗したらどうするかは BIZ（日報は BIZ-08-D5）が決める。本節も §29.7.1 と同じ理由で IO-07 の文書に置き、runtime の lane は `design_compliance_test.rs` の map の `29-io-daily-report-parser.md` の行に `io::pos_source_copy` を足す。

置き場所は既存の規則に合わせ、アプリのデータ folder（`app_data_dir`。DB の `inventory.db` と同じ folder、[71](71-mnt-backup.md) §71.7）の下の相対 path にする。レシート画像の `images/receipts/`（[28](28-io-image-manager.md) IO-06）と同じく、DB には app_data_dir からの相対 path を残す。

```
{app_data_dir}/pos-sources/casio-sr-s4000/sd/{SD の root からの相対 path}
例: pos-sources/casio-sr-s4000/sd/XZ/2026/10/Z001_06 .CSV
```

#### 29.8.2 型とシグネチャ

```rust
struct PosSourceCopyResult {
    relative_path: String, // app_data_dir からの相対 path（区切りは `/`）
    written: bool,         // false = 同じ path に同じ bytes がすでにあり、書かなかった
}

fn save_pos_source_copy(
    app_data_dir: &Path,
    sd_relative_path: &str, // IO-09 の RegisterSdEntry.relative_path
    bytes: &[u8],
) -> Result<PosSourceCopyResult, std::io::Error>
```

#### 29.8.3 処理ステップ

1. `sd_relative_path` を IO-09-D3 と同じ規則で検証し（`..`・drive・絶対 path・空の要素を拒む）、`\` を `/` に直して既定の path（§29.8.1）を作る。
2. 書く先の path を決める（ここではまだ書かない）: 既定の path に file が無ければ既定の path に書く（手順 3・4）。同じ bytes（SHA-256 が同じ）の file があれば書かずに `written: false`。違う bytes の file があれば上書きせず、名前の拡張子の前に `~` と SHA-256 の先頭 12 桁を足した path（例 `Z001_06 ~1a2b3c4d5e6f.CSV`）にする。その path にも同じ bytes があれば `written: false`。
   - 同じ相対 path に違う bytes が来るのは、CV17 で移した後に同じ日にもう一度精算し、レジが同じ名前（接尾字が空白に戻る、SD-08）で書いた場合。上書きすると前の精算の写しが消える。
3. 書く前に、書く file の親の directory を `create_dir_all` で作る（初回で `pos-sources/…/XZ/yyyy/mm/` が無いとき。あれば何もしない。失敗は `std::io::Error`）。
4. 書くときは手順 3 の directory の一時 file に書いて flush・sync し、最終の名前へ rename する（途中で失敗しても最終の名前に半端な file を残さない）。既存の file を上書き・削除・改名しない。

#### 29.8.4 エラーと採らなかった案

- 書けない（容量不足・権限・パス長）ときは `std::io::Error` を返す。BIZ が取込みを止める（BIZ-08-D5）。一時 file が残った場合は次回の書込みで別の一時名を使い、最終の名前の file だけを写しとみなす。
- 採らなかった案: hash だけの名前で置く（店の人や開発者が日付・系列で探せない。CV17 の写しは名前で探せた）、同じ path を上書きする（前の精算の写しが消える）、scan の時にすべて書く（取り込まない束・形の外れた file まで残り、どれが取込みの原本か分からなくなる）、DB に bytes を入れる（DB と backup が大きくなり、日報の行の正本と原本の証拠が混ざる）。
