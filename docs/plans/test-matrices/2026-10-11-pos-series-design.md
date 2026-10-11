# Test Design Matrix: 実測と POS の系列の対応を取得・保存する設計

Plan Packet: [2026-10-11-pos-series-design](../2026-10-11-pos-series-design.md)。本 lane は docs だけで、下の行は後続の runtime lane（㉘ ④、接続の runtime lane、日次の EJ 取込み、㉘ ⑤）が test に写す設計。test 名は runtime の lane が起票時に決める（ここでは行の ID だけを置く）。本 lane 自身の検証は packet の AC1〜AC9（docs の検査）。

## Risk

Risk: R3

## Contracts Under Test

- SPEC-STK-TIME-D10: 全数読取りの行を、置き場の識別子と一緒に列挙の前に置き、条件を満たした読取りだけが完了にする。実測の保存 TX が `source_scan_cursor` を採る。全部実測後の条件 1〜3（同じ置き場の 2 回の完了した読取りの間に、直前の精算の資料が初めて受領された）を全て満たす資料だけを After にし、ほかは今までどおり判定不能にする。全部実測後の枝は、外部前提の gate の証拠がそろうまで code に入れず、保存は枝の有無に依らず続ける。
- SPEC-STK-TIME-D4: 判定の表の既存の行（非連動・未実測・旧記録・実測開始前に受領済み・判定不能）と出口・flag の理由・解消の規則が変わらない。「実測開始前に受領済み」を D10 より先に見る。共有 JAN の行は、D10 の実測後でも保留のまま。
- SPEC-STK-TIME-D5a: 区間の終端と開始の対応づけ、区切りにしない記録、欠け、読めない記録、番号の比べ方、「前回」の候補。
- SPEC-STK-TIME-D8 / D8-K1: `pos_source_scans` の未完了と完了の形、`source_scan_cursor` の kind ごとの NULL / NOT NULL。
- ADR「㉘ への引継ぎ」の合格条件（TD-223）: 数える → アプリ終了 → OS 再起動 → 後日の取込みの通し。

## Failure Modes

- 数える前の販売を含む資料を全部実測後と判定し、要再確認なしで二重に引く（黙って在庫が現物より少なくなる）。
- 数えた後の販売の資料を全部実測前と判定し、引かない（D10 は Before を足さないので、既存の規則が変わらないことで守る）。
- 正常な入力なのに、いつまでも判定不能のまま残る（数えてから 3 つ目以降の精算でも要再確認が付く）。
- 途中で失敗した置き場の読取りが、後の実測の「保存より後の読取り」に数えられる。
- EJ の欠け・読めない記録・対応づけできない区間を「完全」と扱い、売れて戻った商品を見逃す。
- 番号の reset・媒体の入替・別の媒体の読取り・ファイルを選ぶ経路の資料・後から付いた同一性拒否で、別の精算を直前の精算と取り違える、または置き場に無かったと数える。
- 判定を無効にした build が全部実測後を返す、または保存を止めて後から有効にできなくなる。

## Test Matrix

- 既存の test を回帰の根拠に引く行は無い（本 lane は test を足さず、既存の test も変えない）。runtime の lane は、D4 の既存の分類の回帰に `src-tauri/src/biz/csv_import_service/tests/time_evidence_tests.rs` の今の test を使う前に、`rg` で名前の実在を確かめる。
- oracle は ADR D10・D5a の文から独立に作る（操作列から手で決めた在庫数と分類）。実装の分類関数の出力を期待値に写さない。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D10-1 全部実測後の基本形 | 正常な入力が判定不能のまま残る | integration（実 SQLite、合成の資料） | runtime が決める（行 ID: D10-1） | 実測を保存 → 全数読取り O（識別子 X、精算 m まで受領）→ 全数読取り O′（同じ X、精算 m + 1 を受領）→ 精算 m + 2 を受領、の列で、精算 m + 2 の資料が After にならない実装。期待: m と m + 1 は Unknown、m + 2 は After（在庫は販売の数だけ一度減り、flag は 0 行） |
| D10-2 読取りの時点で置き場にあった精算の次の精算 | 数える前の販売を含みうる資料を After にする | integration | 行 ID: D10-2 | 上の列で精算 m + 1 の資料（直前の精算 m の資料は O の中で受領され、後の読取りの中の受領でない）を After にする実装。期待: Unknown（数量が 0 でない行は計数と前後不明の販売の flag） |
| D10-3 保存の時点の cursor | 保存より前の読取りを「保存より後」と数える | integration | 行 ID: D10-3 | cursor を計数の開始時に採る実装、または採らない実装。列: 開始 → 全数読取り O → 保存 → 全数読取り O′。期待: `source_scan_cursor` は O の ID 以上で、O を 1 回目の読取りに使えない（O′ の後の読取りで初めて組ができる） |
| D10-4 列挙の前に行を置く | 列挙と完了の間に保存された実測が、その読取りを後と数える | integration | 行 ID: D10-4 | 行を受領の後に INSERT する実装。列: 読取りの開始（行を置く）→ 実測を保存 → 読取りが完了。期待: その実測の cursor は行の ID 以上で、この読取りは条件 3 の O（1 回目）にならない |
| D10-5 未完了の行 | 途中で失敗した読取りを全数読取りに数える | integration | 行 ID: D10-5 | 窓の中に読めない資料が 1 本ある読取り・中止した読取りの行（`source_cursor` が NULL）を O か O′ に使う実装。期待: 完了せず、後から完了にもならず、After は 0 件。資料の受領の行は残る |
| D10-6 媒体の入替・別の媒体 | 別の媒体にあった資料を「この置き場に無かった」と数える | integration | 行 ID: D10-6 | O と O′ の識別子が違う組で After にする実装。列: 実測を保存 → 識別子 A の全数読取り → 識別子 B の全数読取りで直前の精算の資料を初めて受領。期待: Unknown。同じ識別子 B の読取りが 2 つそろった後の精算は After（非空の期待）。識別子を取れない読取りは行を置かない |
| D10-14 ファイルを選ぶ経路で取った直前の精算の資料 | 置き場の読取りの外で受領した資料を根拠にする | integration | 行 ID: D10-14 | 直前の精算の資料 P を、完了した読取りの後にファイルを選ぶ経路で受領した場合（どの行の `source_cursor_start` と `source_cursor` の間にも ID が入らない）に After にする実装。列: 古い媒体で精算 n − 1（未読）→ 実測を保存 → 新しい媒体で精算 n・読取り O・精算 n + 1・読取り O′ → n − 1 をファイルで受領 → n を取り込む。期待: n は Unknown |
| D10-15 有効にする前・外した後 | 無効の build が After を返す、保存を止める | integration | 行 ID: D10-15 | 全部実測後の枝の無い build で、D10-1 の列が After を返す実装、`pos_source_scans` の行と `source_scan_cursor` を保存しない実装。期待: 分類は Unknown、行と cursor は保存される。枝を入れた build で同じ DB を読むと、無効の間に保存した行で D10-1 が After になる（非空の期待） |
| D10-7 直前の精算の資料がちょうど 1 つ | 直前の精算を取り違える | unit / integration | 行 ID: D10-7 | 直前の settlement_no の資料が無い・2 つある・同一性拒否の記録がある・machine_no か帳票種別が違う場合に After にする実装。期待: どれも Unknown。ちょうど 1 つで拒否の記録が無い場合だけ After（非空の期待） |
| D10-8 窓の日付 | 窓の外にあって受領されなかった古い資料を「SD に無かった」と数える | unit | 行 ID: D10-8 | `P.settlement_date` が O（1 回目の読取り）の `window_from` より前の資料 P を根拠に After にする実装、日付を文字列の大小でなく形の違う値のまま比べる実装。期待: 窓より前・形の違う日付は Unknown、窓の始まりと同じ日は成り立つ（境界） |
| D10-9 実測開始前に受領済みを先に見る | Before の資料を After に変える | unit | 行 ID: D10-9 | `source.id <= source_cursor` の資料に D10 の条件を当てる実装。期待: Before（在庫を動かさない） |
| D10-10 後から付いた同一性拒否 | preview では After、commit では拒否の記録がある資料を After のまま確定する | integration | 行 ID: D10-10 | commit TX が現在の保存情報で再判定しない実装。期待: commit TX の判定は Unknown |
| D10-11 ファイルを選ぶ経路 | 全数読取りでない受領が行を作る | integration | 行 ID: D10-11 | ファイルを選ぶ経路の受領で `pos_source_scans` の行を作る実装。期待: 行は 0、分類は今の ADR と同じ（Unknown） |
| D10-12 共有 JAN | D10 の実測後で共有 JAN の行を commit できる | integration | 行 ID: D10-12 | 全候補が D10 の After のとき、スキップによる commit の対象にする実装。期待: 保留（未実測と同じ） |
| D10-13 相殺の判定の対象外 | 全部実測後の 0/0 の行に EJ 待ちの flag を付ける | integration | 行 ID: D10-13 | After の商品の数量・金額とも 0 の行を相殺の判定へ回す実装。期待: flag 0 行、EJ の有無に依らない |
| D4-1 既存の分類の回帰 | D10 の追加で既存の行の結果が変わる | regression | 既存の test（runtime が `rg` で確かめて引く） | NeverObserved → After、LegacyObserved → Unknown（旧記録の実測）、非連動 → 売上のみ、判定不能の flag の理由と解消の規則のどれかが変わる実装 |
| D5a-1 区間の終端 | 別の精算の記録を終端にする | unit（合成の EJ の記録列） | 行 ID: D5a-1 | 記録ヘッダの 4 桁の欄が違う記録、題の末尾 + 1 が settlement_no でない記録、中断した精算票、勤怠・ＰＬＵの精算票、点検票、モード欄だけが精算の記録を終端にする実装。期待: 完了した日計明細の精算票がちょうど 1 件のときだけ対応づく。0 件・2 件は EJ 待ち |
| D5a-2 区間の開始と前回の証明 | 開始の証拠がない区間・前回と合わない区間を完全にする | unit | 行 ID: D5a-2 | 終端より前の完了した精算票が n − 1 に対応づかない場合を登録の変化にしない実装、取り込んだ EJ に無い場合を EJ 待ちにしない実装。期待: 3 通り（一致 / 前回を証明できない / 開始の証拠がない）を区別して返す |
| D5a-3 欠け | 番号の抜けた区間を完全にする | unit | 行 ID: D5a-3 | 区間の 6 桁の番号が 1 つ抜ける・戻る・飛ぶ・同じ番号で中身が違う、のどれかを完全にする実装。file 名の日付や暦日で欠けを決める実装（精算の後の販売が次の file にある合成の資料で、全てそろっていれば完全になること〈非空の期待〉） |
| D5a-4 読めない記録 | 復元不能の記録を黙って除外する | unit | 行 ID: D5a-4 | 区間に復元不能の記録が 1 つある場合を完全にする実装。期待: EJ 待ち |
| D5a-5 番号の比べ方 | 先頭の 0・数字以外の値で誤った対応づけをする | unit | 行 ID: D5a-5 | 先頭に 0 のある番号を文字列のまま比べる実装、数字以外・空・NULL・桁あふれの値を 0 や隣の番号と読む実装。期待: 先頭の 0 は値に含めず、比べられない値は成り立たない側 |
| D5a-6 「前回」の候補 | 受領だけの Z004・拒否された Z004 を前回に使う | integration | 行 ID: D5a-6 | preview の受領 TX だけの Z004、同一性拒否の記録がある Z004 を「前回」・「直前の Z004 を利用できる」に数える実装。組を保存した取込みを取り消した後に候補から外す実装。期待: guard を通過した業務 TX で組を保存した受領だけが候補で、取消の後も残る |
| D8-1 表と列の形 | 壊れた証拠を書ける | schema | 行 ID: D8-1 | `window_from` と `source_cursor` の片方だけ NULL の行、空の `medium_id`、`source_cursor` が `source_cursor_start` より小さい行、measured で `source_scan_cursor` が NULL の行、uncounted・auto_filled・legacy で NOT NULL の行、負の cursor を受け入れる schema。期待: どれも CHECK で拒否。cursor 0 の measured と、資料が 1 つも無い置き場の完了した行（両方の cursor が 0）は受け入れる（非空の期待） |
| 通し（TD-223 の合格条件） | 再起動・遅延取込みで二重に減る・減り漏れる | integration（実 BIZ + 実 SQLite の操作列）と Windows native L3 | 行 ID: E2E-1 | 数えて保存 → 接続を閉じて開き直す（アプリ終了と再起動に当たる）→ 溜まった精算をまとめて取り込み、その後の精算も取り込む列で、(1) After の資料の販売が数え直しなしに一度だけ減らない、(2) Unknown の資料の販売が通常適用と flag にならない、数え直しで現物の数へ戻らない、(3) Before の資料が在庫を動かす、のどれかになる実装。在庫の期待値は操作列から手で決める |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| `pos_source_scans` の行 | 行なし（cursor は 0） | 列挙の前に、識別子と `source_cursor_start` を持つ未完了の行を置く | 条件 2 を満たして受領を終え、`window_from` と `source_cursor` を書いて完了 | 無し（完了した行は変えない・消さない） | 分類のたびに完了した行を読む | 次の読取りは新しい行 | 再起動の後も行は残る。未完了の行は未完了のまま | 読めない資料・中止は未完了のまま。識別子を取れない読取りは行なし | 読み直しは新しい行で、前の未完了の行を完了にしない | D10-4・D10-5・D10-6・D10-15 |
| 実測の `source_scan_cursor` | 未保存（context は値を持たない） | 無し（保存 TX の中で採る） | 保存 TX の commit で確定。以後変えない | 新しい実測の保存は新しい値を持つ | 分類が最新の有効な実測の値を読む | 独立再実測は新しい行に新しい値 | 再起動で変わらない | 保存 TX の失敗では書かない | 同じ要求の再送は再保存しない（ADR D1） | D10-3・D8-1 |
| 資料の分類（商品 × 資料） | 受領だけ（分類は preview で計算） | preview の結果 | commit TX の再判定で確定し、在庫と flag に反映 | 同一性拒否が後から付くと After → Unknown | commit TX が現在の保存情報で取り直す | 取消の後の再取込みは同じ判定をやり直す | 再起動の後は同じ file を再選択して取り直す（ADR D2） | guard の拒否・業務 TX の失敗は在庫と flag を変えない | 同じ hash は最初の受領 ID のまま | D10-10・E2E-1 |
| EJ の区間の完全性 | EJ 未取込み（EJ 待ち） | 無し | 終端・開始が対応づき、欠けと読めない記録が無い | 同じ番号で中身の違う記録が来ると欠け扱い | 再評価の業務 TX が保存済みの証拠で取り直す（ADR D4） | 欠けていた記録を後から取り込むと完全になりうる | 再起動で保存済みの記録は残る | 対応づけできない・読めない記録は EJ 待ち | EJ の再取込み | D5a-1〜D5a-4 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `source_cursor`（開始時に採る受領の上限）を証拠に持つ形 | `rg -n 'source_cursor' src-tauri/src`（`schema_time_evidence.rs`、`stocktake_repo.rs`、`biz/stocktake_service/time_evidence.rs`、`biz/csv_import_service/time_evidence.rs` と各 test） | `source_scan_cursor` は同じ保存先（measured の明細と recount）に置く | 採る時点は開始でなく保存（ADR D10 の理由）。flag の解消（`source_id <= source_cursor`）には使わない | D10-3・D8-1 |
| 番号を文字列で保持し、比べるときだけ整数にする形 | 日報の `settlement_no`（29 の日報 parser IO-07-D3）、`pos_import_sources.settlement_no`（pos-tables） | ADR D5a の番号の比べ方 | 保存する値は変えない（D3） | D5a-5 |

## Negative Paths

- missing input: 直前の精算の資料が無い → Unknown。同じ置き場の完了した行が 2 つそろわない → 何も After にならない。置き場の識別子を取れない → 行を置かない。区間の EJ が無い → EJ 待ち。
- invalid input: 読めない資料が窓にある読取り → 未完了。比べられない settlement_no、形の違う日付 → 条件不成立。
- duplicate/ambiguous input: 直前の番号の資料が 2 つ（同一性の衝突）→ Unknown。題の末尾が同じ完了した精算票が 2 件 → 対応づけできない。同じ番号で中身の違う EJ の記録 → 欠け扱い。
- unknown reference: 別の machine_no・別の帳票種別の資料 → 直前の資料に数えない。識別子の違う読取り → 組にしない。
- dependency missing: Z004 を SD から読む経路が無い（ファイルを選ぶ経路だけ）→ 今の ADR と同じ結果。
- permission/write failure: 行を置けない読取りは観測にしない。cursor を採れない保存は保存 TX 全体が失敗。
- dry-run side effect: preview は在庫・flag を変えない（資料の受領と拒否の証拠だけ。ADR D2・D4）。SD の読取りは SD に書かない（IO-09-D3）。

## Boundary Checks

- threshold: `O′.source_cursor_start < P.id <= O′.source_cursor`（行を置く前に受領済みの資料は入らず、その読取りの最後に受領した資料は入る）、`C.source_scan_cursor < O.id`（等しい = 保存の時点で既にあった行は 1 回目に使えない）、`O.id < O′.id`（同じ行を 2 回使えない）、`P.settlement_date >= O.window_from`（等しい日は成り立つ）。
- null/default: 未完了の行の NULL、kind ごとの cursor の NULL。恒久の DEFAULT を付けない。
- empty/non-empty: 受領済みの資料が 0（`source_cursor_start` 0）、読取りの行が 0（cursor 0）、空の識別子は拒否。
- min/max: settlement_no が 0 のとき直前（−1）は無い。桁あふれの番号は比べられない値。
- status/policy enum: 分類の出力は Before / After / Unknown のまま（増やさない）。flag の理由は 5 つのまま。
- wire type: 無し（wire に出さない）。
- internal type: ID と cursor は i64、日付は YYYY-MM-DD の文字列、識別子は等しいかどうかだけを比べる文字列。
- producer/consumer: packet の Boundary / Wire Contract。
- round-trip token: 無し。
- precision/range: packet の「値ごとの保証の表」。
- cross-language parse: 無し（Rust と SQLite の中だけ）。

## Compatibility Checks

- old schema/input: 時点証拠 schema は registry に未登録（D-109）。登録の前に列と表を足すので、既存の DB の移行は無い。㉘ ③ の test が作る行は列を足した後の CHECK に合わせて直す（runtime）。
- new schema/input: `pos_source_scans` と `source_scan_cursor`。
- output order: 分類の順は「実測開始前に受領済み」→ D10 → 判定不能。
- optional field behavior: 読取りの行が無い環境と、全部実測後の枝を入れる前の build では、D10 は何も変えない（今の ADR と同じ結果）。

## Data Safety Checks

- source-derived data: 新しい表は ID・日付・アプリの時計の時刻だけを持ち、売上値・商品名・file 名・file 本体を持たない。
- generated outputs: 無し。
- secrets: 無し。
- local-only files: 持ち帰りデータと集計、回答台帳は repo 外。
- synthetic sample boundaries: runtime の test の資料は合成（合成の Z004・EJ、合成の SD の tree）。実物の形の確認は repo 外の probe で行い、件数と形だけを書く。

## Main Wiring / Integration Checks

- helper connected to main path: D10 の分類は preview と commit TX の同じ関数から呼ばれる（D10-10）。
- output reaches manifest/report: 無し。
- effective config reaches runtime: 設定は無い。有効・無効は全部実測後の枝が code にあるかどうかだけで決まる（ADR D10 の「有効にする・外す」）。枝の無い build で After が 0 件であること、保存が続くことを D10-15 で固定する。
- CLI arg reaches implementation: 無し。

## Mutation-style Adequacy Questions

- 条件 3 の `O.id < O′.id` を `<=` に変える（1 回の読取りで足りるようにする）と、D10-2 が落ちる。
- `O.medium_id = O′.medium_id` を外すと、D10-6 が落ちる。
- `O′.source_cursor_start < P.id` を外す（読取りの外の受領を許す）と、D10-14 が落ちる。
- `C.source_scan_cursor < O.id` を `<=` に変えると、D10-3 と D10-4 が落ちる。
- 行を列挙の後に置くよう変えると、D10-4 が落ちる。
- 未完了の行を除く条件を外すと、D10-5 が落ちる。
- 条件 2 の「ちょうど 1 つ」「拒否の記録がない」を外すと、D10-7 が落ちる。
- 「実測開始前に受領済み」を先に見る順を逆にすると、D10-9 が落ちる。
- D10 の枝を消す（常に Unknown）と、D10-1 と E2E-1 の (1) が落ちる（「正常な入力でも常に要再確認」の mutant）。
- 欠けの判定を file の有無に変えると、D5a-3 が落ちる。
- JSON の数が JavaScript の安全な整数の範囲を越える経路は無い（wire に出さない）。

## Residual Test Gaps

- 外部前提 P1〜P3（精算の時点での書込み、精算で PLU の集計が 0 に戻る、path の日付と精算日の一致）は自動 test で証明できない。Contract Probe と、D10 を有効にする lane の owner-operated gate。
- 実 SD での読取り（SD の入替、途中で抜く、CV17 が file を移した後）は Windows native L3。
- 番号印字は採らない（TD-224）ので、その行は無い。
- 置き場の識別子の安定（同じ媒体で変わらない・別の媒体と違う）は実機でしか確かめられない（P10）。
- 合成のモデル（`scripts/probes/stocktake_time_model.py`）に D10 は無い。D10 を実装する runtime lane が足す。
