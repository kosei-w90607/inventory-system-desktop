> **親文書**: [FUNCTION_DESIGN.md](../FUNCTION_DESIGN.md)
> **入力ドキュメント**: [ARCHITECTURE.md](../ARCHITECTURE.md), [architecture/io-task-specs.md §IO-08](../architecture/io-task-specs.md), [ADR 棚卸しと後着売上の時点証拠 SPEC-STK-TIME-D5](../adr/2026-09-18-stocktake-time-evidence.md#spec-stk-time-d5-ejの完全と商品を判定可能を分ける), [23-io-z004-parser.md](23-io-z004-parser.md), [32-biz-csv-import-service.md](32-biz-csv-import-service.md)（外部 probe 表の「EJ完全性」「EJ復元」）

## IO-08: EJパーサー

文書名は `29-io-ej-parser.md`。同じ CASIO SR-S4000 adapter の日報 parser（[29-io-daily-report-parser.md](29-io-daily-report-parser.md)）と番号 29 を共有するため、参照は常に file 名全体で書く。節番号は `IO-08.1`〜`IO-08.10` とし、Spec Contract IO-08-D1〜D10 に 1 対 1 で対応させる（日報 parser の `§29.n` とは別の系列）。

### 目的

`ej_parser` は、店のレジ（CASIO SR-S4000）が売上/EJ 保存設定で SD に書く電子ジャーナル（EJ）1 file の生バイト列を、記録（取引・返品・入金 / 出金 / 替・設定書込み・精算）の列へ構造復元する純関数モジュールである。通常販売と返品の取引は、観測済みの形式に一致し記録内の照合がそろう場合に限り、明細（印字名称・数量・単価・金額）へ復元する。一致しない記録は、その記録だけを「復元不能」として返し、明細を読み出せない型にする。どの行も黙って捨てない。

この層は CASIO 固有の固定幅・ラベル・モード欄を吸収する。番号の連続・区間の完全性・商品の同定・時刻の解釈は行わない（IO-08.9）。出力型（記録・明細・復元状態・診断）は後続の BIZ が使う core 側の契約で、レジが替わった場合は `ej_parser.rs` と本書を取り替え、出力型を保つ（D-023）。

### モジュール構成

```
src-tauri/src/io/
└── ej_parser.rs   # parse_ej と出力型。合成 fixture の unit test と実物確認用の ignore 付き test を同じ file に置く
```

`parse_ej` 以外の `pub fn` を置かない。

### 型定義

```rust
pub struct EjParseResult {
    pub file_hash: String,            // 生バイトの SHA-256（小文字 hex 64 文字）
    pub leading_lines: Vec<EjLine>,   // 最初の記録ヘッダより前の行（IO-08.4）
    pub records: Vec<EjRecord>,       // file の出現順
    pub diagnostics: Vec<EjDiagnostic>,
}

pub struct EjLine {
    pub line_no: usize,   // 1 始まり
    pub text: String,     // decode したままの行（空白を除去しない）
    pub kind: EjLineKind,
}

pub enum EjLineKind {
    Separator,
    Quantity { quantity: i64, unit_price: i64 },
    Item { name: String, amount: i64 },
    ItemCount { count: i64 },
    Labeled { label: &'static str },          // prefix だけで判定。値は解釈しない
    SettlementTitle { leading_no: String, trailing_no: String },
    AmountOnly,
    SettlementEnd,
    Status { label: &'static str, result: String },
    Unknown,
}

pub struct EjRecord {
    pub header_line_no: usize,   // ヘッダ 1 行目の行番号。2 行目は header_line_no + 1
    pub mode: EjMode,
    pub printed_at: String,      // `YYYY-MM-DD HH:MM`。変換しない
    pub number_prefix: String,   // 番号行の 4 桁の欄。意味は未検証
    pub number: String,          // 番号行の 6 桁の番号。先頭 0 を保つ
    pub body: Vec<EjLine>,       // ヘッダ 2 行を除く本文（常に保持）
    pub restoration: EjRestoration,
}

pub enum EjMode { Normal, Return, Settlement, Program, Unrecognized(String) }

pub enum EjRestoration {
    Restored { items: Vec<EjItem>, item_count: i64 },
    NoItems,
    Unresolved { reasons: Vec<EjDiagnosticCode> },   // 明細の field を持たない
}

pub struct EjItem {
    pub line_no: usize,            // 名称行の行番号
    pub name: String,              // 印字名称（末尾の空白を除く）
    pub quantity: i64,             // 数量行が掛かる明細はその値、それ以外は 1
    pub unit_price: Option<i64>,   // 数量行があるときだけ Some
    pub amount: i64,               // 円。返品でも符号を反転しない
}

pub struct EjDiagnostic {
    pub line_no: Option<usize>,    // 範囲 File のときは None
    pub code: EjDiagnosticCode,
    pub scope: EjDiagnosticScope,
    pub message: &'static str,     // code ごとの固定文言（IO-08.8）
}

pub enum EjDiagnosticCode {
    UnknownLine, InvalidWidth, UnrecognizedMode, InconsistentRecord,
    IncompleteRecord, MissingFinalNewline, LeadingFragment,
}

pub enum EjDiagnosticScope { Line, Record, File }

pub enum EjParseError {
    DecodeFailed(String),
    NoRecords(String),
    Empty(String),
}
```

`EjDiagnostic.message` を `&'static str` にするのは、文言が code ごとの固定文言だけであることを型で保つためである（行の生の文字列を後から埋め込めない）。

### IO-08.1 入力と致命的エラー（IO-08-D1）

**関数要求**: EJ 1 file の生バイト列を受け取り、記録の列・先頭断片・診断と file_hash を返す。後続の BIZ（区間の照合・商品同定・在庫反映）と訪店時の実物確認が、同じ関数で「この取引の明細は確かか」を判定できるようにする。

**シグネチャ**:

```rust
pub fn parse_ej(raw_bytes: &[u8]) -> Result<EjParseResult, EjParseError>
```

**前提条件**: 純関数。DB 非依存・副作用なし。file 名・file 探索・現在時刻を受け取らない（file の先頭が file 名の日付より前の記録で始まる実物があるため、file 名から日付を取らない）。

**処理ステップ**:

1. 0 バイトなら `Err(Empty)`。
2. 生バイト列の SHA-256 を小文字 hex 64 文字で `file_hash` にする（decode 後の文字列からは計算しない）。
3. CRLF で行に分割する（IO-08.2）。
4. 各行を CP932 strict（`encoding_rs::SHIFT_JIS.decode_without_bom_handling`）で decode する。どれかの行が decode できなければ `Err(DecodeFailed)`。
5. 記録ヘッダを検出する（IO-08.3）。1 つも無ければ `Err(NoRecords)`。
6. 最初のヘッダより前の行を先頭断片にする（IO-08.4）。
7. 各記録の本文の行を分類し（IO-08.5）、復元状態を決める（IO-08.6 / IO-08.7）。診断は IO-08.8 の規則で積む。
8. `EjParseResult` を返す。

**エラーハンドリング**:

致命的エラーは 3 種で、部分結果を返さない。それ以外の異常は記録単位の復元不能と診断で返す（IO-08.8）。

| 条件 | 戻り値 | 文言 |
|---|---|---|
| 0 バイト | `Err(EjParseError::Empty)` | ファイルが空です。ファイル形式を確認してください |
| どれかの行が CP932 strict で decode できない | `Err(EjParseError::DecodeFailed)` | CP932デコードに失敗しました。ファイル形式を確認してください |
| 記録ヘッダが 1 つも無い | `Err(EjParseError::NoRecords)` | 記録のヘッダがありません。ファイル形式を確認してください |

### IO-08.2 行の単位（IO-08-D2）

- 生バイトを CRLF（`0x0D 0x0A`）だけで分割する。改行の正規化（Z004 parser の NEL / LF / CR → LF）はしない。固定幅の形式で孤立した LF / CR は破損の兆候であり、正規化すると幅の検査が効かなくなるためである。
- 最後の CRLF の後が空なら行として数えない。空でなければ最後の行として扱い、診断 `MissingFinalNewline` を出し、その行を含む記録を復元不能にする。
- 各行は 24 バイトちょうどでなければ診断 `InvalidWidth` を出し、その行を `Unknown` として残し、その行を含む記録を復元不能にする（孤立した LF / CR はこの形で現れる）。先頭断片の行にも同じ検査をする。
- 行番号は 1 始まり。

### IO-08.3 記録ヘッダ（IO-08-D3）

連続する 2 行が次の両方を満たすとき、記録の始まりとする。どちらも 24 バイトちょうどであること。

| 行 | バイト位置 | 形 |
|---|---|---|
| 1 行目 | 0〜4（5 バイト） | モード欄 |
| 1 行目 | 5〜20（16 バイト） | `YYYY-MM-DD HH:MM`（ASCII 数字、`-` / 空白 / `:` の位置が固定） |
| 1 行目 | 21〜23（3 バイト） | 空白 |
| 2 行目 | 0〜12（13 バイト） | 空白 |
| 2 行目 | 13〜23（11 バイト） | 数字 4 桁 + `-` + 数字 6 桁 |

- ヘッダの検出は file の先頭から順に行い、見つけたら 2 行進める。本文の途中でもこの形の 2 行があれば、そこから次の記録になる。
- モード欄を空白除去した値で `EjMode` を決める: 空 → `Normal`、`戻` → `Return`、`精算` → `Settlement`、`PGM` → `Program`、それ以外 → `Unrecognized(raw)`（その記録は復元不能、診断 `UnrecognizedMode`）。
- 日時は分精度の文字列のまま返し、変換・妥当性の判断・時計の信用をしない。
- 4 桁の欄と 6 桁の番号は先頭 0 を保つ文字列で返し、連続・欠番・リセットを判断しない（[23-io-z004-parser.md](23-io-z004-parser.md) の精算メタと同じ方針）。

記録の境界をダッシュ 24 本の行にする案は、実物でその行が明細と合計の区切りだったため採らない。

### IO-08.4 先頭断片と EOF（IO-08-D4）

- 最初のヘッダより前の行は記録に入れず、`leading_lines` に行番号つきで返す（行種は `Unknown`）。1 行以上あれば診断 `LeadingFragment`（範囲 File）を 1 件出す。先頭断片の行ごとの `UnknownLine` は出さない。
- 記録の本文は次のヘッダの直前まで、最後の記録は EOF まで。
- EOF を記録の閉じの根拠にしない。閉じは IO-08.6 / IO-08.7 の必須行で判断する。途中で切れた記録は必須行の欠けで復元不能になり、再取得した file を再度 parse すれば復元される。

### IO-08.5 行の分類（IO-08-D5）

行種は記録の種類と記録内の位置で決める。行の形だけで分類すると、区切りの後の「現金」行が明細と同じ形になるためである。どれにも当たらない行は `Unknown` として残し、診断 `UnknownLine` を出し、その記録を復元不能にする。24 バイトでない行は分類せず `Unknown`（IO-08.2）。

#### 行の文法表

「区切り」はダッシュ（`-`）24 個の行。通常・返品の記録では最初の区切りより前を明細域、後を合計域とする。

| 記録 | 位置 | 行種 | 形 | 値の扱い |
|---|---|---|---|---|
| 通常・返品 | 明細域 | `Quantity` | 空白で始まり、空白除去後が `1 以上の整数` + ` 点` + 空白 1 個以上 + `@` + 単価 token（通貨記号なし、`-` なし） | 数量（ASCII 数字の 1 以上の整数）と単価（非負）。直後の 1 明細だけに掛かる |
| 通常・返品 | 明細域 | `Item` | 空白でない文字で始まり、末尾の空白を除いた最後の半角空白より後が通貨記号つきの金額 token、その前（末尾の空白を除く）が空でない名称 | 名称（中の空白を許す）と金額 |
| 通常・返品 | 最初の区切り | `Separator` | `-` × 24 | — |
| 通常・返品 | 合計域 | `ItemCount` | 空白で始まり、空白除去後が `整数` + ` 点` | 点数（ASCII 数字の整数） |
| 通常・返品 | 合計域 | `Labeled` | `対象計` / `内税` / `合  計` / `お預り` / `お  釣` / `現金` + 半角空白で始まる | prefix だけで判定。金額を読むのは `合  計` / `現金` だけ（IO-08.6） |
| 通常（区切り無し、本文 1 行） | 本文 | `Labeled` | `入金` / `出金` / `替` + 半角空白で始まる | 値を解釈しない。`替` の行は金額 token を持たない（`替` + 空白 + 半角カナの文字列） |
| 精算 | 本文 | `Separator` | `-` × 24 | — |
| 精算 | 本文 | `SettlementEnd` | 空白除去後が `日計明細` だけ | — |
| 精算 | 本文 | `SettlementTitle` | 空白区切りの語が「4 桁の ASCII 数字、`日計明細`、（任意の語）、`Z`、4 桁の ASCII 数字」の並び | 両端の数字を文字列で保持。意味は解釈しない |
| 精算 | 本文 | `Status` | 下記 `Status` と同じ | 同上 |
| 精算 | 本文 | `Labeled` | `総売` / `純売` / `純客` / `現金在高` / `対象計` / `内税` / `消費税合計` + 半角空白で始まる | 値を解釈・検査しない（負値・通貨記号の有無を問わない） |
| 精算 | 本文 | `AmountOnly` | 空白で始まり、空白除去後が金額 token だけ | 符号・通貨記号の有無を問わない。値を解釈しない |
| 設定書込み（`PGM`） | 本文 | `Separator` | `-` × 24 | — |
| 設定書込み・精算 | 本文 | `Status` | `SD設定書込み` / `SDｶｰﾄﾞ保存` / `ｽﾏ-ﾄﾌｫﾝ送信` で始まる | 結果欄（観測は `正常終了`）を空白除去した文字列で保持。成否を判断しない |
| 未知のモード | 本文 | `Unknown` | すべての行 | 分類しない（IO-08.8 のとおり `UnknownLine` は出さない） |
| いずれか | どこでも | `Unknown` | 上のどれにも当たらない行 | 診断 `UnknownLine` |

- 精算の行の判定順は `Separator` → `SettlementEnd` → `SettlementTitle` → `Status` → `Labeled` → `AmountOnly` → `Unknown`。
- ラベルの判定は位置ごとの候補に限る。明細域では「現金」で始まる名称も `Item` になる。通常・返品の合計域の 2 本目の区切りは `Unknown`。
- 区切りの無い通常の記録は、明細域の規則より先に「本文がちょうど 1 行で、その行が `入金` / `出金` / `替` の `Labeled`」かを判定し、そうなら明細を持たない記録とする（IO-08.7）。

#### 金額 token

1 つの共通規則で読む: 任意の `-`（半角だけ）、任意の通貨記号（半角 `\` = CP932 の 0x5C、または全角 `￥`）、数字と桁区切り。

- 数字は ASCII `0`〜`9` または全角 `０`〜`９`（U+FF10〜U+FF19）、桁区切りは半角 `,` または全角 `，`。
- 通貨記号・数字・桁区切りの幅が 1 つの token の中でそろわなければ受理しない（半角 `\` + ASCII 数字 + 半角 `,`、または全角 `￥` + 全角数字 + 全角 `，`）。
- 桁区切りは数字の直後だけに置ける（先頭・連続・末尾の桁区切りは受理しない）。数字が 1 つも無い token は受理しない。
- 値は `i64`。収まらない桁は受理しない（その行は `Unknown`）。
- 観測した字形: `合  計` / `お預り` / `お  釣` / `入金` / `出金` / `現金` の金額は全角 `￥` + 全角数字 + 全角 `，`。明細（半角 `\`）・`対象計`・`内税`・精算票の値は ASCII 数字。精算票の `AmountOnly` とラベル行は通貨記号なしの負値（`-` + ASCII 数字）を取りうる。
- 小数の数量は未観測のため受理しない（その行は `Unknown`）。数量 0 と `-` つきの単価も未観測のため受理しない（その行は `Unknown`）。数量 0 の数量行は Σ数量にも Σ金額にも寄与せず、記録内の照合を素通りするためである。

### IO-08.6 明細の復元（IO-08-D6）

対象は `Normal` / `Return` の記録で、IO-08.8 の行単位の問題が無いもの。次の条件がすべてそろうとき `Restored { items, item_count }` にする。

1. 区切りがあり、本文がヘッダだけではない。
2. 明細域の全行が `Item` または `Quantity` で、`Quantity` の直後の行が `Item` であり、数量 × 単価 = その `Item` の金額。
3. 明細が 1 件以上ある。
4. 明細の金額は 0 以上（0 円の明細は受理する）。
5. 合計域に `ItemCount` がちょうど 1 行あり、その値 = 明細の数量の合計。
6. `合  計` の金額（無ければ `現金` の金額。どちらも金額 token の共通規則で読む。実物で観測した字形は全角）= 明細の金額の合計。照合に使うラベルの行はちょうど 1 行で、金額 token が読めること。
7. 合計域に `Unknown` が無い（行単位の問題として先に復元不能になる）。

- 数量行が掛かる明細の数量はその値、それ以外の明細の数量は 1。単価は数量行があるときだけ `Some`。
- 同じ名称の行を合算しない。明細は記録内の出現順。
- 返品モードでも金額の符号を反転しない。返品の効果の解釈は BIZ が行い、金額の符号で返品を判定しない。
- `対象計` / `内税` / `お預り` / `お  釣` の値は照合しない。
- 残る限界: 合計域の行の並びと回数は、`ItemCount` と照合に使うラベルの行（`合  計`、無ければ `現金`）を除いて検査しない。`合  計` だけで支払行が無い、`合  計` と `現金` が両方ある、`合  計` があるときに `現金` 行が複数ある、といった未観測の並びも、照合がそろえば `Restored` になり得る。明細の数量と金額は点数・合計と一致しているため、在庫へ渡る明細は誤らない。

条件が 1 つでも欠ければ `Unresolved` で、欠け方に応じて次の診断を出す（範囲 Record、行番号は `header_line_no`）。

| 欠け方 | 診断 |
|---|---|
| 本文がヘッダだけ、区切りが無い、明細が 0 件、`ItemCount` が無い、`合  計` も `現金` も無い | `IncompleteRecord` |
| 数量 × 単価 ≠ 金額、数量行の直後が `Item` でない（数量行の連続・区切りの直前の数量行）、負の明細金額、`ItemCount` ≠ 数量の合計、合計（または現金）≠ 金額の合計、`ItemCount` または照合に使うラベルの行が 2 行以上、照合に使うラベルの金額 token が読めない、合計の計算が `i64` に収まらない | `InconsistentRecord` |

記録内の照合は取引の構造の確認であり、区間の完全性の証明ではない（ADR SPEC-STK-TIME-D5「日計合計一致だけを完全性の証明にしない」）。Z004 との照合は行わない。

### IO-08.7 明細を持たない記録（IO-08-D7）

次のとき `NoItems` にする（行単位の問題が無い記録に限る）。

| 記録 | `NoItems` の条件 | 欠けたとき |
|---|---|---|
| 通常（入金 / 出金 / 替） | 区切りが無く、本文が `入金` / `出金` / `替` の `Labeled` 1 行だけ | 該当しなければ IO-08.6 の明細の復元として扱う |
| 設定書込み（`Program`） | 本文が `Separator` と `Status` だけで、`Status` が 1 行以上 | 他の行があれば `UnknownLine`、`Status` が無ければ `IncompleteRecord` |
| 精算（`Settlement`） | 本文の先頭行が `SettlementTitle`、`SettlementEnd` があり、全行が既知の行種 | 先頭が `SettlementTitle` でない、または `SettlementEnd` が無ければ `IncompleteRecord`、未知の行があれば `UnknownLine` |

精算票の値（総売・純売・現金在高・対象計・内税・消費税合計・純客）を解釈せず、値の検査もしない。区間・系列の意味づけは IO-08.9 のとおり IO の外で行う。

### IO-08.8 復元状態の型と診断（IO-08-D8）

- `EjRestoration::Unresolved` は明細の field を持たない。後続が復元不能の記録を誤って在庫へ使う経路を型で閉じる（bool の flag は読み出しを防げないため採らない）。
- 記録は `header_line_no` と本文の行（行番号・生の文字列・行種）を復元状態によらず常に保持する。診断と訪店時の確認のためである。本文の行から明細を組み直すのは呼出し側の責任であり、そうした値は本関数の復元の保証を持たない。
- 先頭断片・ヘッダ 2 行・本文の行番号を合わせると、1〜N（N は file の行数）をちょうど 1 回ずつ覆う。どの行も記録・先頭断片のどちらかに必ず入る。
- 行単位の問題（`UnrecognizedMode` / `InvalidWidth` / `UnknownLine` / `MissingFinalNewline`）がある記録は、IO-08.6 / IO-08.7 の照合をせずに `Unresolved` とし、`InconsistentRecord` / `IncompleteRecord` を重ねて出さない。行が読めない記録の照合結果は、欠けた行が合計の行だった可能性があり、原因を示さないためである。
- 未知のモードの記録は `UnrecognizedMode` 1 件で表し、本文の行（行種 `Unknown`）ごとの `UnknownLine` は出さない。幅違反と最終改行なしは未知のモードの記録でも出す。
- `Unresolved.reasons` は、その記録で出た診断の code を初出順に重複なく並べたもの。
- `diagnostics` は file 内の出現順に並ぶ: `LeadingFragment`、先頭断片の `InvalidWidth`、続いて記録ごとに `UnrecognizedMode`、本文の行の診断（行順）、`MissingFinalNewline`、記録の照合の診断。

#### 診断の code・範囲・固定文言

message は code ごとの固定文言と完全に一致し、行の生の文字列（名称・金額・日時・番号）を含めない。後続が診断を log・画面へ出しても実データが流れないようにするためである。

| code | 範囲 | `line_no` | 発生条件 | message |
|---|---|---|---|---|
| `UnknownLine` | Line | その行 | 行種が `Unknown`（先頭断片・未知のモードの本文・幅違反の行を除く） | 解釈できない行があります。この記録は明細を復元できません |
| `InvalidWidth` | Line | その行 | 24 バイトでない行（先頭断片を含む） | 行の長さが24バイトではありません。この記録は明細を復元できません |
| `UnrecognizedMode` | Record | `header_line_no` | モード欄が未知 | 未知のモードの記録です。この記録は明細を復元できません |
| `InconsistentRecord` | Record | `header_line_no` | IO-08.6 の照合の不一致 | 取引内の数量・点数・合計が一致しません。この記録は明細を復元できません |
| `IncompleteRecord` | Record | `header_line_no` | IO-08.6 / IO-08.7 の必須行の欠け | 記録に必須の行がありません。この記録は明細を復元できません |
| `MissingFinalNewline` | Line | 最後の行 | 最後の CRLF の後に行がある | ファイルの最後の行に改行がありません。最後の記録は途中で切れたものとして扱います |
| `LeadingFragment` | File | なし | 最初のヘッダより前に行がある | 最初の記録より前に行があります。ファイルは記録の途中から始まっています |

### IO-08.9 IO が判断しないこと（IO-08-D9）

| やらないこと | 理由 | 責務を持つモジュール |
|---|---|---|
| 番号の連続・欠番・リセットの判断 | 番号の採番規則（4 桁の欄・6 桁の番号の意味）が未検証 | 次の design lane（実測と POS 系列の対応）と BIZ |
| 精算区間の完全性・分割 file の連結・再出力と真の重複の区別 | 区間と系列の信用は IO の責務ではない（[23-io-z004-parser.md](23-io-z004-parser.md) と同じ線引き） | 同上 |
| Z004 の精算メタとの対応づけ | 同上 | 同上 |
| 印字名称から商品への同定・部門名との衝突 | 名称辞書と商品マスタは BIZ の知識 | BIZ と次の design lane |
| 日時の解釈と時刻分割 | 時計の信用と実測をまたぐ取引の扱いは未決 | 次の design lane |
| file 名の日付の解釈 | file の先頭が前日付の記録で始まる実物がある | 日次取込みの lane（IO-08.10） |
| 未観測の形式（訂正・取消・値引き・番号印字・点検 / 精算以外のモード・小数数量・クレジット等の支払行）の受理 | 推測で受理すると誤った明細が返る。未観測の形式は復元不能に倒す | 実物の採取後に文法を足す |

これらは `parse_ej` の出力を入力にして決める。

### IO-08.10 日次取込みとの接続（IO-08-D10、設計の申し送り）

本節は実装しない。後続の設計の入力として記録する。

- owner 決定（2026-09-23）: 店の EJ の PC 取込みは今は月 1 回程度で、毎日の精算に EJ の取込みを足す。アプリは Z004 と一緒に EJ を拾い、欠けたら知らせる。
- 確定している事実: EJ はレジツール CV17 の「電子ジャーナルを閲覧する」で取り込むと、SD の `XZ_BKUP` と PC の `EcrDatas` に残る。売上/EJ 保存設定は有効で、EJ は Z004 と同じ SD フォルダにある。1 file に複数の精算が入ることがあり、file の先頭は前回精算の後の記録で始まる（下記の構造所見）。
- 後続が決めること: 「欠け」の定義（番号の採番規則・精算との対応・file の分割規則。次の design lane の実機確認の結果による）、`EcrDatas` からの file の選び方と file 名の扱い、取込み画面での置き場所と文言、Windows L3。
- `parse_ej` はこれらに依存しない入力（1 file の生バイト）と出力（記録の列）を提供する。

### 実物の構造所見（値なし）

2026-08 に採取した実物 6 本（repo 外）を、値・名称・日時・番号を出力しない構造 probe で確認した結果。件数と種別名だけを記録する。

- 6 本すべてが CP932 strict で decode でき、CRLF で終わる。行幅は全 309 行が 24 バイト。先頭断片は 0 行。
- 記録ヘッダのモード: 空（通常）25、`戻` 2、`精算` 7、`PGM` 7。明細を持つ取引 11 件で、数量 × 単価・点数 = 数量の合計・合計（無ければ現金）= 金額の合計・金額と点数が非負の 4 検査がすべて成立。
- 本文の行種の並びは 13 種で、すべて本書の文法表に収まる。代表: `PGM` は区切り・`Status`・区切り、通常販売は `Quantity` `Item`+ 区切り `ItemCount` `対象計` `内税` `合  計` `お預り` `お  釣`、現金ちょうどは `Item` 区切り `ItemCount` `対象計` `内税` `現金`、`入金` / `出金` / `替` は本文 1 行、返品は `Item`+ 区切り以降が通常販売と同じ、精算は `SettlementTitle` `総売` `AmountOnly` `純売` `AmountOnly` `現金在高` [`対象計` `内税` `消費税合計`] `純客` 区切り `SettlementEnd` `Status`+。
- ダッシュ 24 本の行は取引の境界ではなく、明細と合計の区切り。区切りの後の「現金」行は明細と同じ形。
- 番号行の 4 桁の欄は全記録で 1 種類。6 桁の番号は記録ごとに +1 で、精算をまたいでも戻らず、連続する日付の file 間も +1（取扱説明書の「精算ごとにリセット」と一致しない。意味は IO で解釈しない）。
- 合計域の `合  計` / `お預り` / `お  釣` / `現金` と `入金` / `出金` の金額は全角数字。明細・`対象計`・`内税`・精算票の値は ASCII 数字。返品だけの精算 2 回では、`AmountOnly` と `対象計` / `内税` / `消費税合計` / `現金在高` / `総売` / `純客` が通貨記号なしの負値。
- 1 file に精算 2 回が 1 本（その日は次の file にもう 1 回）。file 先頭の記録が file 名の日付より前の日付を持つ file が 5 本。

実物 6 本に現れない形式（訂正・取消・値引き・番号印字・点検・小数数量・クレジット等）は、受理規則を作らず復元不能に倒す。文法の不足は「取りこぼし」ではなく「復元不能の増加」として現れる。

### 採らなかった案

| 案 | 採らない理由 |
|---|---|
| 改行を正規化してから分割する（Z004 parser と同じ） | 固定幅の形式で孤立した LF / CR は破損の兆候で、正規化すると幅の検査が効かない |
| ダッシュ 24 本の行を記録の境界にする | 実物では明細と合計の区切りだった |
| 行の形だけで行種を決める | 区切りの後の「現金」行が明細と同じ形になり、架空の明細が増える |
| file 名から日付を取る | file の先頭が前日付の記録で始まる実物がある |
| 復元の可否を bool の flag で返す | flag を見ずに明細を読み出せてしまう |
| 番号を数値にする | 先頭 0 が落ち、意味が未検証の値に数値の意味を与える |
