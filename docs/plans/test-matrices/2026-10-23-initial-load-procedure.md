# Test Design Matrix: 店の PC で本物のデータを入れ始める初期投入の手順を決める

本 lane は docs だけで、自動 test を足さない（code を変えない）。下の行は、手順書 `docs/initial-load-runbook.md` の分岐ごとの期待と、その期待を壊す誤った読み（mutation）を並べたもの。検査の手段は 3 つ: packet の AC の `rg`（機械で数える）、Plan Review・Final Review の読み取り（引く正本の節と code と突き合わせる）、手順書の予行演習（実機。初回の導入の版の後）。手順が引く code の振舞いには既存の自動 test があり、`rg` で実在を確かめた test 名を Evidence に書く。先例は `docs/archive/plans/test-matrices/2026-10-17-msi-distribution-docs.md`（docs だけの手順書の lane の Matrix）。

## Risk

Risk: R4

## Contracts Under Test

- C1 取り込む前の backup を作り、保存先の外の 2 か所へ写してから取り込む。取り込む前の backup から照合までを同じ日に行い、照合が全部合ったときだけ業務の入力を始め、合わないかその日に終えられなければ入力を始めずに取り込む前の backup をアプリの復元で戻す。業務の入力を始めた後は戻さず、DB の作り直しで直さない（68 §68.4、71 §71.5、D-123 (5)）
- C2 13 桁の JAN の行は `商品コード` と `JANコード` の両方に JAN を入れる。`商品コード` が 13 桁の数字で `JANコード` が空の行は初回の導入の版のプレビューが名指しで止め（J5 = b、TD-421、Plans の導入の前の関門の 6）、空でなく違う行が 0 であることは表の全部の行で数えて確かめる（今の取込みは `JANコード` を補わず warning も出さず、Z004 は `jan_code` で引き当てる。`commit_import`、32 §15）
- C3 プレビューのエラー行と重複行が 0 のときだけ取り込む（確定はエラー行を除いて正常な行だけを入れる。30 §4.9、UI-01c-D8）
- C4 行の種類で商品コードを決める: 種類は上から順に当てはめて 1 行を 1 つの種類にする。部門 11・12 の行は入れない（master-tables の departments）、店が JAN を使っていない行（布の管理 5 パターンのパッチワーク）は JAN で分ける種類より先に独自コードにする、共有 JAN の群（桁を問わない）は全部の行に独自コードと群の JAN と `POS在庫連動` = `0`（TD-352、ADR SPEC-STK-CNT-D4）、他の行と共有しない 8 桁の JAN の行と、コードの無い行（布の管理 5 パターンの反物・カット生地）は独自コード（J4・J2）、どれにも当たらない行と接頭辞の無い部門の独自コードの行は 1 行でもあれば手順を止める（外して進まない）。部門の初期データはリリースの前に直す（リリースの後は値を移す migration が要る。D-123 (4)・(5)）
- C5 商品コードと単位の種類はアプリの中で直せない（SP-102-04、30 BIZ-01-D8）。入れた後に見つかったら止めて owner に諮り、予行演習で見つけて入れる前に直す
- C6 商品 CSV は CSV UTF-8（BOM 付きの UTF-8。CP932 の `?` への置換を避ける）で、`商品コード` と `JANコード` は文字列の値にして桁を落とさず書く（数値のセルは `=TEXT(セル,"0")` で置き換える）。指数の形の値の行は初回の導入の版のプレビューが名指しで止める（J5 = b。今の取込みはコードの形を検査しない。26 §18.3、30 §4.8 の手順 4）
- C7 売価は税込の円の整数（Excel の税抜から J1 で換算）、原価は税抜の円をそのまま、`m` の初期在庫は m の数、個数の単位の初期在庫は整数で、上限を超える行は止める（30 BIZ-01-D8、D-128）
- C8 初期在庫は取り込んだ日を業務日とする初期在庫の記録になり、どの計数よりも前とみなす。J3 の既定は年末の在庫 Excel の数で、差は次の計数で棚卸しの差として出る（ADR SPEC-STK-CNT-D3）
- C9 予行演習は店の PC と同じ版（導入の前の関門の confirmed を全部満たした版）・同じ CSV（SHA-256）で開発用の Windows で通し、MSI の手順書の準備と片付けのとおり開発のデータの folder を退避した空の DB で行う。同じ日に MSI の試験用のデータを使うときは、その片付けを終えてから始める
- C10 入れた後の CSV の上書きは `JANコード` を CSV の値で書く（空・列なしは JAN を消す。30 BIZ-01-D8 の上書きの段、30 §4.9.2）ので、上書きの CSV には今の `JANコード` を全部の行に入れる

## Failure Modes

- FM1: 照合が合わないのに業務の入力を始める、または取り込む前の backup を作らずに取り込む（C1）
- FM2: 業務の入力を始めた後の誤りを、取り込む前の backup の復元か DB の作り直しで直し、その後の入力が消える（C1）
- FM3: 取り込む前の backup が保存先の中にだけあり、保持日数（既定 3 日）で消える。または照合を日をまたいで延ばし、一覧から取り込む前の backup が消えて戻せない（C1）
- FM4: 13 桁の JAN の行で `JANコード` が空か違う値のまま入り、レジの売上が商品に引き当たらず、`PLU対象` の既定も対象外になる。関門の 6 を満たさない版で予行演習する、または空でなく違う行を抜き取りの照合だけで確かめ、途中の行を見落とす（C2）
- FM5: プレビューにエラー行があるまま取り込み、一部の行だけが入る（C3）
- FM6: 共有 JAN の群に JAN を商品コードにした行が混ざる、群の行が在庫連動のまま入る、または 8 桁の共有 JAN の行が 8 桁の JAN の種類に数えられ在庫連動のまま入る（C4）
- FM7: 接頭辞の無い部門の行に独自コードを作り、独自コードルールの外の形のコードが入る（C4）
- FM8: 商品コードを誤って入れた後に、廃番と登録し直しで直そうとして同じ JAN の商品が 2 つになる（C5）
- FM9: Excel が JAN を指数の形で書いた CSV が 1 つの商品コードとして黙って入る。書式を「文字列」に変えただけで数値のセルが直ったと読む、CP932 で保存して文字が `?` に化ける（C6）
- FM10: 売価を税抜のまま入れる、原価を税込に換算する、`m` の初期在庫を cm の数で入れる（C7）
- FM11: 初期在庫を入れた日より前の売上が在庫から引かれると読める、または数えた日と入れた日の差が黙って消えると読める（C8）
- FM12: 予行演習を店の PC で行う、別の版・別の CSV で通す、開発のデータの folder か MSI の試験用のデータの DB に当てる（C9）
- FM13: 売価だけを直す CSV（`JANコード` の列なし）で上書きし、黙って JAN が消えてレジの売上が引き当たらなくなる（C10）

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | FM1 | rg（packet の AC6） | AC6 | 手順書から「全部が合ったときだけ業務の入力を始める」か「業務の入力を始めた後は、取り込む前の backup へ戻さない」が消える |
| C1 | FM2 | rg（packet の AC5） | AC5 | 手順書に、DB の作り直しで直す文（文ごとに分けて、「作り直さない」「作り直しで行わない」「作り直しの範囲」の外の「作り直」）が 1 文でも出る、または「入れた後のやり直しを DB の作り直しで行わない」が消える |
| C1 | FM1・FM3 | 読み取り（Final Review、68 §68.4・71 §71.5 と突き合わせる） | 流れ 3 の前提の後の段落と手順 2・7・9 | 取り込む前の backup が取込みより後にある、2 か所への写しが無い、写しの失敗で取り込みを止めない、復元が業務の入力の前に限られていない、照合を日をまたいで延ばせる |
| C2 | FM4 | 読み取り（`src-tauri/src/biz/product_service.rs` の `commit_import` の新規の行の `jan_code: row.jan_code.clone()`、Plans の導入の前の関門の 6 と突き合わせる） | 今の事実の JANコード と黙って入る形の行、J5、流れ 1 の手順 2 の表の 13 桁の JAN の行、手順 4 の確かめの列、流れ 2 の冒頭と手順 4 | 13 桁の JAN の行の `JANコード` が空でよいと読める、空でなく違う行の確かめが表の全部の行でなく抜き取りになる、予行演習の版が関門の 6 を満たさなくてよいと読める |
| C3 | FM5 | 読み取り（30 §4.9、UI-01c-D8） | 流れ 2 の手順 4、流れ 3 の手順 3 | エラー行か重複行が 1 行でもあるまま取り込む段がある |
| C4 | FM6・FM7 | 読み取り（ADR SPEC-STK-CNT-D4、master-tables の独自コードルール） | 流れ 1 の手順 2 の表と箇条 | 種類が排他でない（上から順の当てはめが無い、8 桁の行が共有しない JAN に限られない）、店が JAN を使っていない行が JAN で分ける種類より下にあり商品コード = JAN になる、共有 JAN の群の行に JAN の商品コードか `POS在庫連動` の空がある、部門 11・12 の行を入れる、接頭辞の無い部門で止めない、どれにも当たらない行を入れる |
| C5 | FM8 | 読み取り（SP-102-04、30 BIZ-01-D8） | 入れた後に誤りを見つけたらの表 | 商品コードか単位の種類をまたぐ誤りに、アプリの中の直し方（廃番と登録し直しを含む）を手順として示す |
| C6 | FM9 | 読み取り（26 §18.3 と `decode_bytes`、30 §4.8 の手順 4、Plans の導入の前の関門の 6） | 流れ 1 の手順 4・5、流れ 2 の手順 4、今の事実の Excel の CSV の保存と黙って入る形の行 | 文字列の値への置き換え（`TEXT` か表示形式 `0`）が書式の変更だけに戻る、保存が CSV UTF-8 でなくなる、指数の形の値をプレビューが止めることが関門の版に結び付かない |
| C7 | FM10 | 読み取り（30 BIZ-01-D8、D-128） | 流れ 1 の手順 3 | 売価の換算、原価をそのまま、`m` は m の数、のどれかが逆になる |
| C8 | FM11 | 読み取り（ADR SPEC-STK-CNT-D3 の判定表） | 今の事実の初期在庫の記録の行、J3 | 初期在庫の業務日が数えた日になると読める、差が次の計数で出ることが書かれていない |
| C9 | FM12 | 読み取り（MSI の手順書の確かめる項目と準備と片付け） | 流れ 2 の冒頭と手順 1・2・8、流れ 3 の前提 | 予行演習の版と CSV が店の PC と同じであることを求めない、準備と片付けを引かない、MSI の試験用のデータとの境（片付けの後に始める、商品 0 件で止める）が無い |
| C10 | FM13 | 読み取り（30 BIZ-01-D8 の上書きの段、30 §4.9.2、`commit_import` の上書きの `jan_code: Some(row.jan_code.clone())`） | 今の事実の上書きの JANコード の行、入れた後に誤りを見つけたらの表 | 上書きの CSV で `JANコード` の空・列なしが今の値を保つと読める、商品名・売価などを直す上書きに今の `JANコード` を入れる段が無い |
| 全体 | 案内から辿れない | rg（packet の AC3・AC4） | AC3・AC4 | PROJECT_HANDOFF か backlog から手順書の link が消える、手順書の節の見出しが欠ける |

手順が引く振舞いの既存の自動 test（2026-10-23 に `rg -n 'fn test_…' src-tauri/src` で実在を確かめた）:

- 文字コード・ヘッダ・引用符（C6）: `test_parse_csv_req104_cp932_normal`、`test_parse_csv_req104_utf8_bom_normal`、`test_parse_csv_req104_decode_failure`、`test_parse_csv_req104_double_quote_handling`（`src-tauri/src/io/product_csv_importer.rs`）
- プレビューの分類と行の error（C3）: `test_preview_import_req104_validation_errors`、`test_preview_import_req104_duplicates`、`test_preview_import_req104_mixed`、`test_preview_import_req104_product_code_length_limit`（`src-tauri/src/biz/product_service.rs`）
- 単位・`m` の初期在庫（C7）: `test_preview_import_req104_stock_unit_code_and_label_normalized`、`test_preview_import_req104_initial_stock_in_meters_for_m_rows`、`test_commit_import_req104_revalidates_initial_stock_of_new_rows`
- 初期在庫の記録と写し（C8）: `test_commit_import_req104_initial_stock_movement`、`test_commit_import_req104_initial_stock_movement_and_copy_match`
- `PLU対象` の既定（C2）: `test_commit_import_req907_blank_plu_target_derives_for_new_and_preserves_overwrite`
- 確定の戻し（C3）: `test_commit_import_req104_rollback_on_failure`
- 独自コードの発番が CSV の番号を飛ばす（C4）: `test_create_product_req101_custom_code_after_csv_import`、`test_generate_custom_code_req101_no_prefix`
- Z004 の `jan_code` の引き当て（C2）: `test_parse_and_validate_req401_normal_matching`、`test_parse_and_validate_req401_unmatched_product`（`src-tauri/src/biz/csv_import_service/tests/parse_tests.rs`）
- 復元で内容が置き換わる（C1）: `test_restore_backup_req901_replaces_data`（`src-tauri/src/mnt/backup.rs`。suppliers だけを見る）。取り込む前の backup の復元で商品と入出庫の記録が 0 件に戻ることは、packet の Contract Probe P2 の一時 test で確かめた（test は残していない）

## State Lifecycle Matrix

手順の状態（店の PC の DB）の移り変わり。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 店の PC の DB | 商品 0 件（MSI の手順書の流れ 2 の後） | 取り込む前の backup を 2 か所へ写した | 照合が全部合い、業務の入力を始める | — | — | 開き直してホームが出る（流れ 3 の手順 5） | 開き直した後に照合（手順 6） | 照合が合わない → 入力を始めずに取り込む前の backup へ復元 → 商品 0 件 | CSV を直して流れ 1 から（予行演習を含む） | 流れ 3 の手順 2〜7 |
| 商品 CSV | 在庫 Excel の写し | 表で確かめた（流れ 1 の手順 4） | CSV と SHA-256 | 直したら SHA-256 が変わる | 予行演習と店の PC で SHA-256 を照らす | — | — | 確かめで止まる行がある → 直す | 流れ 1 の手順 3 から | 流れ 1、流れ 3 の手順 1 |
| プレビュー | ファイルを選ぶ | プレビュー（DB を変えない） | エラー行と重複行が 0 → 取り込む | — | — | — | — | エラー行がある → 取り込まない | CSV を直して選び直す | 流れ 2 の手順 4 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 管理者の手順書の形（対象・引く正本・未確認の点・今の事実の表・流れ・確かめる項目） | `docs/msi-distribution-runbook.md`、`docs/migration-recovery-runbook.md` | 手順書の冒頭の引用・今の事実の表・流れ・未確認（P*n*） | 配布の記録の表は持たない（管理者の記録は流れ 3 の手順 9 の項目だけ） | AC4 |
| 取り込む前の backup を 2 か所へ写して SHA-256 を照らす | MSI の手順書の流れ 3 の手順 3・4 | 流れ 3 の手順 2・9 | — | 読み取り |

## Negative Paths

- missing input: 必須列が無い CSV は file ごと拒否（30 §4.8 の手順 3）。`JANコード` の空は今は拒否されないので流れ 1 の手順 2 の表で埋め、13 桁の数字の `商品コード` の行は関門の 6 の版のプレビューが止める（C2）。上書きの行の `JANコード` の空・列なしは JAN を消す（C10）
- invalid input: 行の error はプレビューに出て取り込まない（C3）。指数の形の値は今は拒否されず、関門の 6 の版のプレビューが行の error として名指す（C6）
- duplicate/ambiguous input: CSV の中の重複は行の error、既存のコードは重複行（新しい DB では 0）。共有 JAN の群は独自コードに分ける（C4）
- unknown reference: `部門ID` が無い部門・`取引先ID` が無い取引先は行の error（30 §4.8）。`取引先ID` は空にする
- dependency missing: 予行演習の版が店の PC の版と違う → 流れ 3 の前提で止める（C9）
- permission/write failure: 取り込む前の backup か写しが失敗 → 取り込まない（C1）
- dry-run side effect: プレビューは DB を変えない（30 §4.8）

## Boundary Checks

- threshold: 売価 999999、原価 999999.99 円、初期在庫 999999999（`m` は cm にした後）、商品コード 100 文字、file 20MB
- null/default: `在庫単位` の空は `個`、`初期在庫` の空は 0、`POS在庫連動` の空は連動する、`PLU対象` の空は 13 桁の `jan_code` で決まる
- empty/non-empty: 初期在庫の空と 0 は取り込んだ後に区別できない（packet の Contract Audit の 0 の表示）
- min/max: 上の threshold
- status/policy enum: 税率 `10`・`8`・`0`
- wire type: 変えない
- internal type: 変えない（原価はアプリが 1/100 円にする）
- producer/consumer: 在庫 Excel（店）→ CSV（管理者）→ 取込み（アプリ）
- round-trip token: 該当なし
- precision/range: 原価と `m` の初期在庫は小数 2 桁まで
- cross-language parse: Excel の数値の書式と CSV の文字列（C6）

## Compatibility Checks

- old schema/input: 該当なし（新しい DB に入れる）
- new schema/input: 初回の導入の版（Plans の導入の前の関門の confirmed を全部満たす版）
- output order: 該当なし
- optional field behavior: 上の null/default

## Data Safety Checks

- source-derived data: 在庫 Excel と CSV は repo の外
- generated outputs: 管理者の記録は repo の外
- secrets: 該当なし
- local-only files: 予行演習の folder（消す時期は owner）
- synthetic sample boundaries: 本 lane は試験用のデータを作らない

## Main Wiring / Integration Checks

- helper connected to main path: 該当なし
- output reaches manifest/report: PROJECT_HANDOFF から手順書へ（AC3）
- effective config reaches runtime: 該当なし
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

docs だけの lane で、mutation は手順書の文を誤った読みに替えることを指す（上の Test Matrix の Would fail if）。

- 「全部が合ったときだけ業務の入力を始める」を消すと AC6 が落ちる。
- 「作り直しで行わない」を「作り直しで直す」に替えると AC5 が落ちる（文ごとに分けるので、同じ行の「作り直さない」に隠れない。round 1 の是正で `$TMPDIR` の写しに当てて確かめた。packet の AC5）。
- 流れ 1 の手順 2 の表の 13 桁の JAN の行の `JANコード` を空にすると、Final Review の C2 の読み取りが落とす（機械の検査は無い。Residual Test Gaps）。

## Residual Test Gaps

- CSV の中の商品コードの重複の行の error（`CSV内で商品コードが重複しています`）を直接確かめる自動 test は見つからなかった（`rg -n 'CSV内で商品コードが重複' src-tauri/src` は `preview_import` の 1 行だけ）。手順書は流れ 1 の手順 4 で CSV の側でも重複を確かめるので、本 lane の安全は依らない。test を足すのは code を変える lane（backlog の「商品 CSV のプレビューで黙って入る形の行を止める」の runtime の lane）で行う。
- 手順書の表の値（J1〜J4 の既定と J5 の答え、行の種類）は機械で検査しない。Plan Review と Final Review の読み取りと、予行演習で確かめる。
- P1（Excel の CSV の保存）は予行演習まで確かめない（外れて指数の形の値や 13 桁の数字で `JANコード` が空の行ができても、関門の 6 の版のプレビューが取り込む前に止める。packet の Contract Probe P1）。
- CSV の上書きが `JANコード` の空・列なしで JAN を消す振舞いを直接確かめる自動 test は見つからなかった（`test_commit_import_req104_overwrite_preserves_optional_fields` は在庫単位だけを見る）。Plan Review round 2 の Claude 側が一時 test で再現した。test を足すのは関門の 6 の runtime の lane（backlog の項目の候補 (4)）で行う。P2（復元で 0 件に戻る）は code の上で確かめ（packet の Contract Probe）、Windows の画面の上の復元は予行演習の手順 7 で確かめる。
