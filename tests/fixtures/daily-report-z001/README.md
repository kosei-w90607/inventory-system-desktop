# 日計（Z001）表示 synthetic fixture

日次売上の「レジ日報（公式）」に日計（Z001）の表を出す lane（[packet](../../../docs/plans/2026-10-06-z001-display.md)）の L3（Windows native の before / after）と、Rust の結合 test `test_get_daily_sales_req501_summary_imports_from_fixture_bundles`（`src-tauri/src/biz/sales_service.rs`）が使う入力物です。

すべて合成の値です。実店舗の CSV 本文・売上・ラベルを含みません。ラベルは帳票仕様由来の種類の語（`docs/function-design/29-io-daily-report-parser.md`）と合成の番号（`部門01` 等）です。

## 束

| 束 | 日付 | 精算回数 | file |
|---|---|---|---|
| A | 2026-03-23 | 0001 | `Z001_260323_0001.CSV`・`Z002_260323_0001.CSV`・`Z005_260323_0001.CSV` |
| B1 | 2026-03-24 | 0001 | `Z001_260324_0001.CSV`・`Z002_260324_0001.CSV`・`Z005_260324_0001.CSV` |
| B2 | 2026-03-24 | 0002 | `Z001_260324_0002.CSV`・`Z002_260324_0002.CSV`・`Z005_260324_0002.CSV` |

A → B1 → B2 の順に取り込みます（B2 は「同じ日のデータを追加で取り込みますか？」で「追加で取り込む」）。Z001 は 28 行で、総売・純売以外の行、3 束とも 0 の行、負の値、空欄、小数の総売の個数を含みます。B2 は売上がほぼ 0 の 2 回目の精算です。

## 生成手順

[Test Design Matrix](../../../docs/plans/test-matrices/2026-10-06-z001-display.md) の「L3 fixture」の節にある Python 3（標準ライブラリだけ）の script を file に保存し、repo の root で次を実行して 9 file を書き出します。

```sh
python3 <script> tests/fixtures/daily-report-z001
```

出力は CP932・CRLF です。`sha256sum` は同じ節の表と一致します。CSV を手で編集したり、エディタで UTF-8 として上書き保存したりしないでください。中身を変えるときは Matrix の script を直して再生成します。
