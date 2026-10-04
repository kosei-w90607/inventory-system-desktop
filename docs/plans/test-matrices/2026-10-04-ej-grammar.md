# Test Design Matrix: EJ parser に店が普段使う文法を足す

Plan Packet: [2026-10-04-ej-grammar](../2026-10-04-ej-grammar.md)。決定 ID は `docs/function-design/29-io-ej-parser.md` の IO-08-Dn / IO-08-D3a〜D7a、S 番号・AC 番号は packet のもの。

## Risk

Risk: R3

## Contracts Under Test

- IO-08-D3a: 記録の種類（`EjRecord.kind`）を本文の行で決める。判定順の表、番号印字の行は判定から除く。モード欄は既知の値（`練習` / `点検` / `PGM1` / `PGM3` / `OFF` を含む）を別の field で返す。
- IO-08-D5a: 明細の折返し（`ItemName` + `Continued`）と合計域のラベルの折返し（ラベルだけの行 + `Continued`）。
- IO-08-D5b: 合計域の支払行 4 種・軽減税率の行・注記・合計域の訂正の行。金額 token の全角 `－` と印 `*` / `※`。
- IO-08-D5c: 明細域の訂正・小計・率・％値引き・マイナスキー・戻の印・取引中止の印の行。
- IO-08-D5d / D7a: 精算票（日計明細 / ＰＬＵ / 勤怠、完了・次のヘッダで閉じた中断、表に無い行）・点検票（4 形の題）・設定・練習・入金 / 出金 / 替（戻のモードを含む）・領収書は `NoItems`、`Unclassified` は `Unresolved`。file の最後の記録で `ReportEnd` の無い精算票は `kind: Settlement { completed: false }`・`Unresolved`（`IncompleteRecord`。IO-08-D4）。設定の記録は行種の分類より前に通貨記号の行を、ほかに当たらず半角空白 + `点` を含む行を `Unknown` にする（判定は decode 後の文字列）。
- IO-08-D6a: 訂正は直前の項目の取消（負 = 有効な明細、正 = 有効な ％値引き、合計域 = 支払行）。取消先が合わなければ記録ごと `InconsistentRecord`。
- IO-08-D6b: 値引き・マイナスキーは明細に配らず `adjustments` で返す。小計は前の有効な明細と値引き（マイナスキーを含む）の和。
- IO-08-D6c: 照合の金額は `合  計`、無ければ取り消されていない支払行がちょうど 1 行のときの金額。
- IO-08-D6d: 戻の印の直後の負の明細（空のモードだけ）は数量 -1・負の金額で、点数の照合に −1 で入る。
- IO-08-D8（不変）: `Unresolved` は明細・値引きを持たない、行の網羅、診断 7 code の固定文言。
- 互換（backlog「既存の復元結果を変えない追加に限る」）: 対象は Goal・AC7・AC11 と同じく、既存 test の fixture（AC7）と、旧 parser で `Restored` / `NoItems` だった実物の記録（AC11）。これらは同じ復元状態と明細を返し、既存 fixture の `adjustments` は空。操作ラベルと同名の明細（`小計 \100` のように、ラベル + 空白 + 金額 token だけの行）は新では操作の行（`Subtotal` / `Correction` / `PercentDiscount` / `MinusKey`）に分類し、旧で `Restored` だった合成の並び（例: `小計 \100` → 区切り → 点数 1 → 合計 100）でも項目の規則を満たさなければ復元不能になる。そうした合成の並びは互換の対象に含めず、実物に無いことは AC11 (b) で確かめる。

## Failure Modes

- F1 訂正で取り消した明細が `items` に残り、在庫が二重に減る（取消を無視して照合が偶然そろう、または取消先を別の明細にする）。
- F2 訂正の取消先を「同額の明細」で探し、直前でない明細を消す。
- F3 正の訂正（値引きの取消）を明細の取消と取り違える、または値引きが `adjustments` に残る。
- F4 小計値引き・明細値引き・マイナスキーの行を明細として `items` に入れる（旧の `Item` の形「ラベル + 通貨記号つきの金額」に当たる `小計` / 正の `訂正` を含む）。
- F5 取引中止の記録・練習の記録が明細を返す（在庫を減らす）。
- F6 モード欄で種類を決め、モード欄が空・`点検`・`PGM` の精算票を `Settlement` と認識しない、または点検票を取引と読む。
- F7 設定の記録をモード欄で決める規則が、取引の行（通貨記号つき、状態ラベルで始まる通貨記号つきの行、半角空白 + `点` を含む数量・点数の行）の紛れ込みを `Text` / `Status` として通す。または通貨記号を byte の 0x5C で判定し、2 byte 目が 0x5C の漢字の行を止める。
- F8 `合  計` の無い取引で、支払行 2 行や取り消した支払行を照合に使う。合計域の訂正が支払行の後でなくても通る。
- F9 折返しの `Continued` が前の行（`ItemName` / ラベルだけの行）が無くても受理され、架空の明細・金額が生まれる。
- F10 戻の印の明細が戻のモードでも受理される、戻の印の無い負の明細が受理される、数量が 1 のままで点数の照合が素通りする。
- F11 番号印字の行が種類の判定（例: 入金の 1 行）や照合を壊す、または明細域でも `NumberPrint` として通る。
- F12 中断した精算票が `completed: true` になる、または `Unresolved` のままで既知の形と未知の形を区別できない。逆に、file の最後で切れた精算票を中断として `NoItems` にする（EOF を閉じの根拠にする。IO-08-D4）。
- F13 新しい行種の追加で、既存 fixture・旧で `Restored` だった実物の記録の明細が変わる・`Unresolved` になる。
- F14 全角 `－` が半角の数字と混ざった token を受理する（幅の不一致）。
- F15 新しい行種の fixture で、行が記録にも先頭断片にも入らずに消える、または診断の文言に行の文字列が入る。
- F16 未知のモードを既知の値に当てて取引の文法で読み、復元してしまう。

## Test Matrix

- 既存 test の名前は `rg -n '    fn parse_ej' src-tauri/src/io/ej_parser.rs` で実在を確かめた（2026-10-04、`76de30d8`）。新しい test の名前は Writer が `parse_ej_` で始まる名前で付け、ID（G-..）と決定 ID を test の上の comment に書く（`// G-M1 / IO-08-D6a: …`）。
- 負の fixture（`Unresolved` を期待する G-F・G-C3・G-K8 ほか）の点数・合計は、対象の規則を外せば `Restored` になる値にする（既存の負の test の comment と同じ慣行）。対象外の照合の不一致で偶然 `Unresolved` になって green にならないようにする。
- fixture は合成だけで、既存の builder（`header` / `lr` / `zen` / `yen` / `item` / `qty` / `count` / `wide` / `sep`）で 24 バイトの行を組む。mock は無い（純関数）。期待値は設計正本の規則から手で決め、parser の出力から写さない。

| ID | Contract | Failure Mode | Test Type | Test 内容 | Would fail if... |
|---|---|---|---|---|---|
| G-K1 | IO-08-D3 / D3a | F6 | unit | モード欄が空・`点検`・`PGM` の 3 記録に同じ完了した日計明細 Z の本文。どれも `kind == Settlement { report: Daily, completed: true }`・`NoItems`・診断 0、`mode` はそれぞれ `Normal` / `Inspection` / `Program` | 種類をモード欄で決める |
| G-K2 | IO-08-D3a | F6 | unit | モード欄が空と `精算` の記録に `4 桁 日計明細 X` の本文。`kind == Inspection`・`NoItems` | 点検票を取引・精算と読む |
| G-K3 | IO-08-D3a | F5 | unit | `練習` のモードの取引（明細・区切り・点数・合計・`･･････トレーニング･･････` の行）と入金。`kind == Training`・`NoItems`・診断 0、本文の行は `Text` | 練習の明細を返す、印の行で `UnknownLine` |
| G-K4 | IO-08-D3a | F5 | unit | `点検` のモードの `ﾄﾚｰﾆﾝｸﾞﾓｰﾄﾞを開始します` + 印の行。`kind == Training`・`NoItems` | トレーニングの表示を未知の記録にする |
| G-K5 | IO-08-D3a / D8 | F16 | unit | 未知のモード（例 `ZZZ`）の取引の本文。`kind == Unclassified`、`mode == Unrecognized("ZZZ")`、reasons `[UnrecognizedMode]`、診断はその 1 件だけ | 未知のモードを復元する、行ごとに `UnknownLine` を出す |
| G-K6 | IO-08-D3a | F6 | unit | `精算` のモードで題の無い本文（`総売` の行から始まる）。`kind == Unclassified`、reasons `[IncompleteRecord]` | 題の無い精算を `NoItems` にする |
| G-K7 | IO-08-D3 | — | unit | モード欄 `練習` / `点検` / `PGM1` / `PGM3` / `OFF` が `Training` / `Inspection` / `Program1` / `Program3` / `Off` | 既知の値が `Unrecognized` |
| G-K8 | IO-08-D3a | F16 | unit | `点検` のモードに取引の本文（区切り・点数・合計）。`kind == Unclassified`・`Unresolved`、reasons `[UnknownLine]`（本文は精算票・点検票の表で分類され、取引の行が `Unknown`。取引の文法で復元しない） | 空・戻以外のモードで取引を復元する |
| G-S1 | IO-08-D5d / D7a | F12 | unit | ＰＬＵ Z（`4 桁 ＰＬＵ Z 4 桁`、案内文の行、区切り、`ＰＬＵ`、`SDｶｰﾄﾞ保存`）と勤怠 Z。`Settlement { report: Plu / Attendance, completed: true }`・`NoItems`・診断 0 | 日計明細だけを題にする |
| G-S2 | IO-08-D5d | — | unit | 日計明細 Z に `信在高` / `貸在高`（負値）/ `券在高` / `領収書 3 件` / `領収書 印紙 1 件` / `取引中止 2 件` の行。`NoItems`・診断 0、各行が `Labeled` | 表に無い行で `UnknownLine` |
| G-S3 | IO-08-D5d | — | unit | `ｽﾏ-ﾄﾌｫﾝ送信  異常終了` の後に空白で始まる 4 桁の行と、数字・通貨記号の無い案内文の行 2 行。`NoItems`、`Status.result == "異常終了"`、4 桁の行は `AmountOnly`、案内文は `Text` | 案内文・コードの行で復元不能 |
| G-S4 | IO-08-D7a / D4 | F12 | unit | 終わりの印字の無い日計明細 Z（題・値・送信の異常終了）と、続く完了した日計明細 Z。前は `completed: false`、後は `completed: true`、どちらも `NoItems`。対の case: 同じ終わりの印字の無い日計明細 Z が file の最後の記録（CRLF で終わる）なら `kind == Settlement { report: Daily, completed: false }`・`Unresolved`・reasons `[IncompleteRecord]` | 中断を `Unresolved` か `completed: true` にする、EOF の切断を中断として `NoItems` にする |
| G-S5 | IO-08-D5d | F6 | unit | 点検票の題の 4 形（`0000 日計明細 X`・`0014 ＰＬＵ X`・`在売点検 X`・`X`）。`Inspection`・`NoItems`、`ReportTitle` の `leading_no` は前 2 つが `Some`、後 2 つが `None`、`trailing_no` は `None` | X の題の一部を読めない |
| G-S6 | IO-08-D5d | F7 | unit | 日計明細 Z の本文に数字を含む名称の行（空白でない文字で始まり数字を含む）。`UnknownLine` | 精算票の `Text` が数字の行も通す |
| G-O1 | IO-08-D5d / D7a | F7 | unit | `PGM` の `SD設定読込み 正常終了`、`OFF` の `自動設定保存 正常終了`（区切りつき）、本文 0 行の `PGM1`、通貨記号の無い設定の印字の行（2 byte 目が 0x5C の漢字〈例 `表`〉を含む行を 1 行入れる）と空白だけの行を持つ `PGM3`。どれも `Settings`・`NoItems`・診断 0 | 設定の記録を復元不能にする、通貨記号を decode 前の byte で判定する |
| G-O2 | IO-08-D5d | F7 | unit | `PGM` の本文に通貨記号つきの行（`名称 \100`）、状態ラベルで始まる通貨記号つきの行（`自動設定保存 \100`、`SD設定読込み ￥１００`）、半角空白 + `点` を含む行（` 1 点`）の 4 case。どれも `UnknownLine` で `Unresolved` | 設定の `Text` / `Status` が取引の行を通す、通貨記号の判定が `Status` の後にある |
| G-O3 | IO-08-D3a | — | unit | 戻のモードの `入金 ￥1,000` の 1 行。`CashMovement`・`NoItems` | 戻のモードの入金を復元不能にする |
| G-O4 | IO-08-D3a / D5d | — | unit | 領収書の 3 行（` 一連No.000123` 相当の合成・` 領収No.1`・`領収書 ￥1,500`）。`Receipt`・`NoItems`・診断 0 | 領収書を取引として `IncompleteRecord` |
| G-O5 | IO-08-D3a | F11 | unit | 番号印字の行 + `入金` の行の記録が `CashMovement`、`OFF` の設定の後ろの番号印字 2 行が `Settings` の `NoItems`、行種 `NumberPrint` | 番号印字で入金の 1 行の判定が崩れる |
| G-O6 | IO-08-D3a / D6c | F11 | unit | 取引の合計域の `現金` の後に番号印字 2 行。`Restored`（明細・点数は番号印字の無い同じ取引と同じ） | 番号印字で照合が崩れる |
| G-T1 | IO-08-D5a | F9 | unit | `対象計 8.0%` の行 + 空白で始まる `\12,345` の行（5 桁で折り返す合成）。`Restored`、続きの行は `Continued` | 折返しの金額の行が `UnknownLine` |
| G-T2 | IO-08-D5a / D6c | F9 | unit | `合  計` の無い取引で `ｸﾚｼﾞｯﾄ電子M` のラベルだけの行 + `Continued`（金額 = 明細の和）。`Restored` | 折り返した支払行の金額を照合に使えない |
| G-T3 | IO-08-D5a | F9 | unit | `お預り` / `お  釣` の折返し（`合  計` あり）。`Restored` | お預り・お釣の折返しで復元不能 |
| G-T4 | IO-08-D5b / D6c | F8 | unit | `合  計` も `現金` も無い取引で、支払行 1 行（`ｸﾚｼﾞｯﾄ電子M` / `売掛` / `商品券` の 3 case）の金額 = 明細の和。`Restored`。金額を 1 円ずらすと `InconsistentRecord` | 支払行で照合しない、照合を素通りする |
| G-T5 | IO-08-D5b / D6c | F8 | unit | `合  計` + `ｸｰﾎﾟﾝﾎﾟｲﾝﾄ払` + `お預り` + `お  釣`、`合  計` + `商品券` + `ｸﾚｼﾞｯﾄ電子M`（2 種の併用）。`Restored`（照合は `合  計`） | 支払行の併用で復元不能、または支払行を照合に使う |
| G-T6 | IO-08-D6a / D6c | F8 | unit | `合  計` + `売掛` + `訂正 -1,000`（売掛と同額）+ `現金`、`合  計` + `現金` + `訂正` + `現金`。`Restored`、明細は変わらない（合計域の訂正は明細に効かない） | 合計域の訂正を明細の取消にする |
| G-T7 | IO-08-D5b | — | unit | 軽減税率: `名称 \300※` の明細、`対象計※ 8.0% \300`、`内税※ \22`、`現金`、`注）※は軽減税率適用`。`Restored`、明細の金額 300 | `※` の行で復元不能 |
| G-T8 | IO-08-D5 / D6d | F13 / F14 | unit | 取引全体が負: `(ReturnMark → 負の Item) × 2`（印は明細ごとに 1 行。実データ (c)）、` -2 点`、`対象計 8.0% -1,000`、`合  計 －１，０００`（全角）、`売掛 －１，０００`。`Restored`、明細の数量 -1・金額負、`item_count == -2` | 全角 `－` を読めない、負の点数を受けない |
| G-M1 | IO-08-D6a | F1 | unit | 明細 A → 明細 B → `訂正 -B` → 区切り → 点数 1 → 合計 A。`items == [A]`、`item_count == 1` | 取り消した B が残る |
| G-M2 | IO-08-D6a | F1 | unit | 数量行つきの明細（3 点 @100）→ `訂正 -300` → 明細 C。`items == [C]`、点数 1。折返しの明細（`ItemName` + `Continued`）→ `訂正` も同じく取り消せる | 数量行・折返しの明細を取り消せない |
| G-M3 | IO-08-D6a | F3 | unit | 明細 → 率 → `％－ -50` → `訂正 \50`（正）→ 区切り。`adjustments` 空、合計 = 明細の和 | 正の訂正を明細の取消にする、値引きが残る |
| G-M4 | IO-08-D6b | F4 | unit | 明細 2 件 → `小計 \1,000` → `-10%` → `％－ -100*` → 区切り → 合計 900。`items` 2 件、`adjustments == [SubtotalDiscount, -100]`、`item_count` は明細の数量の和。もう 1 case: 明細 A \1,000 → `－ -100` → `小計 \900` → `-10%` → `％－ -90*` → 区切り → 点数 1 → 合計 810。`Restored`、`adjustments == [MinusKey -100, SubtotalDiscount -90]` | 小計・値引きを明細にする、点数に数える、小計の和にマイナスキーを含めない |
| G-M5 | IO-08-D6b | F4 | unit | 明細 A → `-20%` → `％－ -40` → 明細 B。`adjustments == [ItemDiscount { item_line_no: A の行 }, -40]` | 明細値引きの掛かり先を誤る |
| G-M6 | IO-08-D5a | F9 | unit | 名称だけの行 → 空白で始まる `\1,200` の行、数量行 → 名称だけの行 → 金額の行（2 点 @600）。それぞれ 1 明細（`line_no` は名称の行） | 折返しを 2 行の未知の行にする |
| G-M7 | IO-08-D6b | F4 | unit | 明細 → `－ -100*`、明細 → `－ -50`。`adjustments == [MinusKey]`、点数は明細の数量の和 | マイナスキーを明細にする、`*` で読めない |
| G-M8 | IO-08-D6d | F10 | unit | 空のモードで 明細 A → `戻 ････` → `名称 -300`（通貨記号なし）→ 区切り → 点数 0 → 合計 A − 300。`items` の 2 件目は数量 -1・金額 -300 | 戻の印の明細を受けない、数量 1 で返す |
| G-M9 | IO-08-D6 / D6a | F1 | unit | 明細 1 件 → `訂正` で取消 → 区切り → ` 0 点` → `現金 ￥0`。`Restored { items: [] , item_count: 0 }` | すべて取り消した取引を復元不能にする（または取り消した明細を返す） |
| G-C1 | IO-08-D7a | F5 | unit | 明細 2 件 → `訂正` → 数量行つきの明細 → `取引中止 ････`（区切りなし）。`kind == Cancelled`・`NoItems`・診断 0 | 取引中止を `IncompleteRecord` にする、明細を返す |
| G-C2 | IO-08-D7a | F5 | unit | 明細 → 率 → `％－` → `取引中止 ････`、明細 → `－ -100` → `取引中止 ････`。`Cancelled`・`NoItems` | 値引きを含む取引中止を読めない |
| G-C3 | IO-08-D7a | F2 | unit | 取引中止の記録の中で訂正の取消先が合わない（`訂正` の金額 ≠ −直前の明細）。`InconsistentRecord` | 取引中止の中の項目の規則を検査しない |
| G-F1 | IO-08-D6a | F2 | unit | 明細 A → 明細 B → `訂正 -A`（直前でない明細と同額）→ 区切り → 点数 1 → 合計 B（A ≠ B。誤って A を取り消せば `Restored` になる値）。`InconsistentRecord` | 同額の明細を探して取り消す |
| G-F2 | IO-08-D6a | F2 | unit | 明細域の最初の行が `訂正`、`訂正` → `訂正`、`訂正 \0`。それぞれ `InconsistentRecord` | 直前の項目の無い訂正を受ける |
| G-F3 | IO-08-D6b | F4 | unit | `-10%` の後に `％－` が無い、`％－` の前に率の行が無い。`InconsistentRecord` | 率と値引きの対を検査しない |
| G-F4 | IO-08-D6b | F4 | unit | `小計` の金額 ≠ 前の明細の和。`InconsistentRecord` | 小計を照合しない |
| G-F5 | IO-08-D6b | F4 | unit | `*` つきの ％値引きの直前（率の行の前）が小計でない、`*` なしの ％値引きの直前が小計。`InconsistentRecord` | 小計値引きと明細値引きを取り違える |
| G-F6 | IO-08-D6b | F4 | unit | ％値引き・マイナスキーの金額が正。`InconsistentRecord` | 正の値引きを受ける |
| G-F7 | IO-08-D6d | F10 | unit | 戻のモードの記録に `戻 ････` + 負の明細。`InconsistentRecord` | 戻のモードで戻の印を受ける |
| G-F8 | IO-08-D6d | F10 | unit | 戻の印の無い負の明細（通貨記号なし・あり）、戻の印の直後が正の明細。`InconsistentRecord`（既存の `parse_ej_negative_item_amount_unresolves` と同じ code） | 負の明細を受ける |
| G-F9 | IO-08-D6c | F8 | unit | `合  計` の無い取引で支払行 2 行（`現金` + `売掛`。2 行の和 = 明細の合計で、足し合わせれば `Restored` になる値）、支払行 0 行。前は `InconsistentRecord`、後は `IncompleteRecord` | 支払行を足し合わせる、どれかを選ぶ |
| G-F10 | IO-08-D6a | F8 | unit | 合計域の訂正の直前が `対象計`、金額が直前の支払行と合わない。`InconsistentRecord` | 合計域の訂正を検査しない |
| G-F11 | IO-08-D7a | F5 | unit | 区切りのある取引の明細域に `取引中止 ････` の行。`UnknownLine` | 取引中止の印を途中の行でも受ける |
| G-F12 | IO-08-D5 | F14 | unit | `合  計 －1,000`（全角の符号と ASCII 数字）、`現金 -１，０００`（半角の符号と全角数字）。`InconsistentRecord`（照合のラベルの金額が読めない） | 幅の混ざった token を受ける |
| G-F13 | IO-08-D5a | F9 | unit | 明細域で前に名称だけの行が無い `\1,200` の行、合計域で前が金額つきのラベルの `Continued` の形の行。`UnknownLine` | 続きの行を前の行なしで受ける |
| G-F14 | IO-08-D5（単位の拡張は Non-scope） | — | unit | 小数の数量行（` 1.5 点 @100`）と小数の点数。`UnknownLine`（既存の `parse_ej_decimal_quantity_unresolves` と同じ扱い） | 小数を黙って整数に丸める |
| G-X1 | IO-08-D8 | F15 | unit | `parse_ej_every_line_is_accounted_for` と `parse_ej_diagnostic_messages_are_fixed_texts` の fixture に、取引中止・練習・精算票（次のヘッダで閉じた中断）・設定の印字・領収書・折返し・訂正・値引き・番号印字の記録を足す。行番号が 1〜N を 1 回ずつ覆い、message に fixture の名称が含まれない。`fixed_texts` に足す記録は、S2 で直した `mixed_file()` の dedup した 7 code の順を崩さない位置に限る | 新しい行種で行が消える、文言に行が入る |

### 既存 test の変更（S2）

| 既存 test | 変更 | 理由（設計正本） |
|---|---|---|
| `parse_ej_unrecognized_header_mode_unresolves_record` | モード欄を `点検` から未知の値（例 `ZZZ`）へ替える。assert（`UnrecognizedMode` 1 件）は保つ | `点検` が既知のモード `Inspection` になった（IO-08.3）。`点検` のモードの取引の本文は G-K8 で `Unclassified` を見る |
| `parse_ej_program_body_with_other_line_unresolves` | 1 件目（PGM に通貨記号つきの明細の行）は `UnknownLine` のまま。2 件目（区切りだけの PGM）は `Settings` の `NoItems` へ | 設定の記録は本文に必須の行を持たない（本文 0 行の `PGM1` / `PGM3` が実物にある。IO-08-D7a）。通貨記号の行を止める規則は保つ（IO-08-D5d） |
| `mixed_file()`（`parse_ej_every_line_is_accounted_for` / `parse_ej_diagnostic_messages_are_fixed_texts` の fixture） | `sale("点検", …)` のモードを未知の値 `ZZZ` に替え、code 列は保つ（dedup した期待値の 7 code を変えない）。`every_line` の名称の検査の `"点検"` も `ZZZ` へ | `点検` が既知のモードになり、この記録は `Unclassified` の `UnknownLine` になって `UnrecognizedMode` が出なくなる（IO-08-D3a の 6）。相談役の走査で、是正後の dedup 列は期待の 7 code と一致 |
| `parse_ej_paid_in_line_in_return_mode_unresolves` | 戻のモードの入金を `CashMovement` の `NoItems` へ。test 名を内容に合わせて改める | 戻のモードの入金 / 出金 / 替が実物にある（IO-08-D3a の 7 は空と戻） |
| `parse_ej_settlement_and_program_records` ほか `SettlementTitle` / `SettlementEnd` / `Restored { items, item_count }` / `EjMode` の pattern を使う test | 型の追従だけ（`ReportTitle` / `ReportEnd`、`adjustments`、`kind` の assert を足す） | 出力型の変更（型定義）。期待値は変えない |
| `real_ej_structure_probe`（ignore） | packet の S3 のとおり（変更の正本は S3） | Non-scope の形が実物に残る。突合は AC11 |

ほかの既存 test は変更しない（AC7）。

## Mutation / anti-tautology

Writer は実装後に次の変異を 1 つずつ入れて、挙げた test が red になることを確かめ、PR body に結果（red になった test 名）を書く。期待値は設計正本の規則から手で決めた fixture の値で、parser の出力から写さない。

- 訂正（負）の取消先を「直前の項目」から「同額の最初の有効な明細」に変える → G-F1 が red。
- 取り消した明細を `items` から外さない → G-M1・G-M2・G-M9 が red。
- 値引きを `items` に混ぜる（`Item` として扱う）→ G-M4・G-M5 が red。
- 取引中止を `Sale` として復元に回す → G-C1 が red。
- 練習のモードを `Normal` として扱う → G-K3 が red。
- 種類の判定順で精算票の題より前にモード欄を見る → G-K1 が red。
- 設定の記録の通貨記号の判定を外す、または `Status` の判定より後に置く → G-O2 が red。通貨記号を decode 前の byte の 0x5C で判定する → G-O1 が red。
- `合  計` の無い取引で支払行を足し合わせる → G-F9 が red。
- 戻の印の明細の数量を 1 にする → G-M8・G-T8 が red。
- `Continued` の前の行の条件を外す → G-F13 が red。
