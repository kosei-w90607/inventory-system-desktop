# Test Design Matrix: JAN を直した商品の前の JAN の別名

本 lane は docs だけで、自動 test を足さない。下の行は後続の lane（backlog の「JAN の別名の runtime」）が実装する test の設計で、設計正本の節（master-tables §1a、22 §17、20 IO-01-D5、30 §4.8・§4.9・§4.9.2 BIZ-01-D9、32 §15.3 手順 4 b、42 §22.6、60 UI-01c-D17）と D-122 から導いた。本 lane が自分で回す検査は packet の AC。test 名は後続の lane の Writer が現物の命名に合わせて変えてよい（契約と Would fail if は変えない）。

## Risk

Risk: R3

## Contracts Under Test

- C1 master-tables §1a 不変条件: どの商品も持たない JAN だけが別名。商品の INSERT と `jan_code` の UPDATE がその JAN の別名を消し（消えた別名は戻らない）、商品が持つ JAN の別名の INSERT は拒まれる。
- C2 master-tables §1a 形: `old_jan` は PRIMARY KEY で空文字を拒み、1 つの前の JAN は 1 つの商品だけを指す。1 つの商品は複数の別名を持てる。
- C3 22 §17 MNT-03-D15: 空の DB と商品のある DB の両方に当たり、行を作らない。最新の版までの migrate の後に 3 つの trigger がある。`products` を作り直す migration は作り直しの前に別名の表の側の trigger を消し、後に 3 つを作り直す。
- C4 20 IO-01-D5: `find_jan_alias` は文字列の一致で商品コードを返し、`insert_jan_alias` は 1 行を足す。更新・削除の関数は無い。
- C5 32 §15.3 手順 4 b: ヒット 0 件の行だけ別名を引き、別名があればヒット 1 件と同じ形の MatchedRow（その商品の `pos_stock_sync`、warning なし）、無ければ `unmatched_product`。ヒット 1 件・複数件の行は変えない。preview と D-118 の確定の TX の取り直しが同じ関数を使う。
- C6 30 BIZ-01-D9 問いの条件と preview の判定: 直す前の JAN が空でなく、直す前にその JAN を持つ商品がその商品だけで、取込みの他の行（error_rows を除く）がその JAN を持たない重複行だけ `old_jan_question = Some(前の JAN)`。JAN を空にする変更を含む。PLU の枠の有無・状態を見ない。
- C7 30 BIZ-01-D9 warning: 行の JAN が別の商品の別名なら `ImportRow.warnings` に足して取り込む。前の JAN へ戻す行（別名の商品と同じ）には出さない。
- C8 30 §4.9 手順 0b・2 e.: 上書きしない行の code は TX の前に拒み DB を変えない。TX の中で行を処理する前と後に条件を確かめ、満たせば別名を書き、満たさなければ TX 全体を戻す。空の一覧は全て「ない」。重複した code は 1 つとして扱う。
- C9 42 §22.6: CMD は引数を BIZ にそのまま渡し、generated の呼出しは 3 つの引数。
- C10 60 UI-01c-D17: 問いは `old_jan_question` のある重複行で `上書き` を選んだときだけ出て既定は `ない`。`ある` かつ `上書き` の行だけが `oldJanAliasCodes` に入る。warning は新規の行と重複行の両方に出る。commit の判定の失敗で preview を保つ。
- C11 D-122 (2): PLU の枠の照合・prepare・confirm・書出しは別名を読まず書かない。別名の JAN の枠は「対象の商品を持たない JAN の枠」のまま。

## Failure Modes

- FM1: 商品がその JAN を持った後も別名が残り、その JAN の売上が別名の商品へ入る（商品フォームの新規、商品 CSV の新規・上書き、test の fixture のどれかの経路）
- FM2: 商品がその JAN を手放した後に、前に消えたはずの別名が生き返る（D-117 の round 2 の指摘の型）
- FM3: 共有 JAN、または同じ取込みで別の商品が持つ JAN に問いを出し、別名を作る（たどる先が誤る・2 つになる）
- FM4: 答えが上書きしない行・判定を満たさない行に付いたのに、別名を書く、または答えを黙って捨てて続ける
- FM5: 別名がヒット 1 件・共有 JAN の行の引き当てを変える、または別名の行が warning・別の形になる
- FM6: preview と確定で引き当ての規則が違い、preview で P に引き当たった行が確定で行エラーになる（またはその逆）
- FM7: `products` を作り直す migration の後に trigger が無い（不変条件が黙って外れる）、または作り直しが改名で失敗する
- FM8: 別名が PLU の枠の状態・照合に影響する（枠が `active` のまま書き出される、照合が別名を消す・書く）
- FM9: JAN を数に変えて先頭の 0 を落とし、別名が一致しない（または別の JAN と一致する）
- FM10: 問いが上書きを選ばない行に出る、既定が `ある`、`スキップ` に戻した行の答えが送られる
- FM11: 前の JAN へ戻す行に warning が出る、または別名の商品と違う行に warning が出ない

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | FM1 | migration / SQL（合成の DB） | `test_jan_alias_yields_when_product_takes_jan`（INSERT・`jan_code` の UPDATE の 2 case） | 別名 A→P がある DB で、商品 Q を JAN A で INSERT（または R の JAN を A に UPDATE）した後に `product_jan_aliases` に A の行が残る |
| C1 | FM1 | BIZ（商品フォームの新規・商品 CSV の新規・上書きの 3 case） | `test_jan_alias_cleared_on_every_jan_write_path_req104` | 3 つの経路のどれかで、JAN A を持つ商品を作った後に Z004 の A の行が別名の商品 P に引き当たる（期待は新しい商品） |
| C1 | FM2 | SQL | `test_jan_alias_does_not_revive_after_holder_leaves` | 別名 A→P、Q が A を持つ（別名が消える）、Q の JAN を C に変えた後に、`find_jan_alias(A)` が `Some(P)` を返す（期待 `None`） |
| C1 | FM1 | SQL | `test_jan_alias_insert_rejected_when_jan_held` | 商品 P が JAN A を持つ DB で `insert_jan_alias(A, P)` が成功する（期待は Err、行が増えない） |
| C1 | FM1 | SQL | `test_jan_alias_trigger_rollback_restores_alias` | 別名 A→P がある DB で、TX の中で Q を A で INSERT し TX を戻した後に、A→P が無い（期待は残る） |
| C2 | FM3 | SQL | `test_jan_alias_primary_key_and_empty_check` | 同じ `old_jan` の 2 行目、または `old_jan = ''` の INSERT が成功する。同じ商品の 2 つの別名（A→P、B→P）が拒まれる |
| C3 | FM7 | migration | `test_jan_alias_migration_on_empty_and_populated_db` | 空の DB か商品のある DB で migrate が失敗する、`product_jan_aliases` に行がある、3 つの trigger のどれかが `sqlite_master` に無い |
| C3 | FM7 | migration（最新の版） | `test_latest_schema_has_jan_alias_triggers` | 最新の版までの migrate の後に 3 つの trigger のどれかが無い（後から `products` を作り直す migration を足して規則を忘れた版で落ちる） |
| C3 | FM7 | migration（作り直しの規則の確かめ） | `test_products_rebuild_keeps_jan_alias_triggers`（作り直しを含む migration を足す lane の完了条件。vB・D-118 の写しの列の migration） | 作り直しの前に別名の表の側の trigger を消さずに `ALTER TABLE products_new RENAME TO products` で失敗する、または作り直しの後に 3 つの trigger が無い |
| C4 | FM9 | IO | `test_find_jan_alias_exact_text_match` | 別名 `"0491234567890"`（先頭 0 の 13 桁）が `find_jan_alias("491234567890")` に当たる、または `"0491234567890"` に当たらない |
| C5 | FM5 | BIZ（Z004 の preview） | `test_parse_and_validate_req401_alias_matches_unheld_jan` | 別名 A→P（P の `pos_stock_sync=true`）がある DB で、Z004 の A の行が ErrorRow になる、MatchedRow の商品が P でない、`pos_stock_sync` が P の値でない、warning が増える |
| C5 | FM5 | BIZ | `test_parse_and_validate_req401_unmatched_without_alias` | 別名の無い JAN の行が `unmatched_product` の ErrorRow にならない（既存 `test_parse_and_validate_req401_unmatched_product` の期待を保つ） |
| C5 | FM5 | BIZ | `test_parse_and_validate_req401_shared_jan_ignores_alias`（共有 JAN の行と別名の行を同じ file に置く） | 共有 JAN の行が先頭の商品と warning のまま（今の規則）でない、または別名の行の引き当てが変わる |
| C5 | FM6 | BIZ（D-118 の確定の取り直しがある版） | `test_commit_rematch_uses_same_alias_rule` | preview の後に別名ができた DB で、確定が A の行を行エラーにする（期待は P）。preview の後に別名が消えた DB で、確定が A の行を P に入れる（期待は消えた後の規則） |
| C6 | FM3 | BIZ（preview） | `test_preview_import_old_jan_question_conditions_req104`（下の 6 case） | (i) P が A を単独で持ち A→B に直す行で `Some(A)` でない、(ii) A→なし（JAN を空にする）で `Some(A)` でない、(iii) P1・P2 が A を共有する行で `Some` になる、(iv) 他の行（新規の行 Q が A）が A を持つのに `Some` になる、(v) error_rows の行だけが A を持つのに `None` になる、(vi) JAN を変えない行で `Some` になる |
| C6 | FM8 | BIZ | `test_preview_import_old_jan_question_ignores_plu_slot_state` | A の枠が無い・`free`・`external`・`reserved`・`active` の 5 つで、(i) の条件の行の `old_jan_question` が違う |
| C7 | FM11 | BIZ（preview） | `test_preview_import_warns_when_jan_is_alias_of_other_product` | 別名 A→P がある DB で、新規の行 Q（JAN A）と重複行 R（JAN を A へ）に warning が無い、または P 自身の行（A へ戻す）に warning がある |
| C8 | FM4 | BIZ（commit） | `test_commit_import_rejects_alias_code_not_in_overwrite` | `old_jan_alias_codes` に `overwrite_codes` に無い code があるのに Ok になる、または DB（商品・別名）が変わる |
| C8 | FM4 | BIZ（commit） | `test_commit_import_writes_alias_when_condition_holds_req104` | (i) の条件で code を送ったとき、commit の後に A→P が無い、P の JAN が B でない |
| C8 | FM4 | BIZ（commit、preview の後の変化） | `test_commit_import_rolls_back_when_alias_condition_changed`（下の 4 case） | 次のどれかで Ok になる、または商品・別名のどれかが変わる: P が無い、P の JAN が既に B（直していない）、A を持つ商品が commit の前に 2 つになった、同じ取込みで送った他の行が A を持つ |
| C8 | FM4 | BIZ | `test_commit_import_empty_alias_codes_means_no` | 空の一覧で別名が書かれる（期待は 0 行。既存の commit の結果は変わらない） |
| C8 | — | BIZ | `test_commit_import_duplicate_alias_codes_treated_once` | 同じ code を 2 回送ると Err になる、または別名が 2 回書かれようとして失敗する |
| C9 | FM4 | CMD / bindings | `bindings.ts` の `commitImport` が 3 つの引数（`oldJanAliasCodes: string[]`）を持つ（generate_bindings の差分の確かめ） | generated の呼出しが 2 つの引数のまま、または 3 つ目が optional |
| C10 | FM10 | RTL（`ProductImportPreview.test.tsx`） | `UI-01c-D17: 上書きを選んだ行だけに前の番号の問いが出て既定はない` | `old_jan_question` が null の行に問いが出る、`スキップ` の行に出る、既定が `ある` |
| C10 | FM10 | reducer / hook（`reducer.test.ts`、`ProductImportPage.test.tsx`） | `UI-01c-D17: ある かつ 上書き の行だけを oldJanAliasCodes に送る` | `スキップ` に戻した行、`ない` の行の code が `commitImport` の 3 つ目の引数に入る、または `ある` かつ `上書き` の行が入らない |
| C10 | FM11 | RTL | `UI-01c-D17: warning を重複行にも出す` | 重複行の `import_row.warnings` が表示されない |
| C10 | — | RTL | `UI-01c-D17: commit の判定の失敗で preview を保つ` | 「もう一度プレビューしてください」の失敗で preview の state と上書きの選択が消える |
| C11 | FM8 | BIZ（PLU） | `test_plu_slot_transitions_ignore_jan_alias` | 別名 A→P がある DB で、A の `active` の枠が照合の「別コード × active（対象の商品が無い）」で `external` にならない、prepare・書出しで A の枠が出る、照合・prepare・confirm が別名の表を変える |

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 別名（`product_jan_aliases` の行） | 無い | preview で問いが出る（DB は変えない） | commit の TX で書かれる | 商品がその JAN を持った時点で trigger が消す（戻らない） | 引き当てごとに DB を読む（cache しない） | 同じ商品の JAN をもう一度直すと、新しい前の JAN に同じ問い（前の別名は残る） | アプリの再起動で変わらない（DB の行） | commit の判定・DB の失敗で TX 全体が戻り、無いまま | ファイルを選び直して preview し直す | C1・C8 |
| 問いの答え（UI の state） | `ない` | 上書きの選択と組で保持 | `ある` かつ `上書き` の行だけ送る | `スキップ` に戻すと送らない（選択は保持してよい） | — | preview をやり直すと初期化 | 画面を離れると消える（server cache は作らない、UI-01c-D4） | commit の失敗で preview と選択を保つ | 同じ preview で再び取り込める | C10 |
| 引き当て（Z004 の行） | — | preview で引き当て | 確定（停止の解除の後）で同じ規則で取り直す | preview の後の別名の変化は確定の取り直しに効く | — | 取り消して取り込み直すと、その時点の別名と JAN で引き当て直す | — | 別名の無い行は `unmatched_product` | — | C5 |

## 時系列の表（同じ前の JAN の共有・同時の変更・取消）

| # | 順の出来事 | 期待 | 正本 |
|---|---|---|---|
| T1 | P が A を単独で持つ → 商品 CSV で A→B、`ある` → Z004 に A の行 | A の行は P | BIZ-01-D9、32 §15.3 手順 4 b |
| T2 | 同じで `ない` → Z004 に A の行 | `unmatched_product` | BIZ-01-D9 |
| T3 | P1・P2 が A を共有 → 同じ CSV で両方の JAN を直す | 問いは出ない。A の行は `unmatched_product` | 条件 2 |
| T4 | P1・P2 が A を共有 → P1 だけを直す | 問いは出ない。A の行は P2（共有でなくなった後の 1 件のヒット） | 条件 3 |
| T5 | P1 が A、P2 が C → 同じ CSV で P1 を A→C、P2 を C→A（入れ替え） | どちらにも問いは出ない（直した後に他の行が持つ）。A の行は P2、C の行は P1 | 条件 3 |
| T6 | P1 が A → 同じ CSV で P1 を A→B、新規の行 Q が A | P1 に問いは出ない。Q の行は warning なし（別名がまだ無い）。A の行は Q | 条件 3 |
| T7 | T1 の後 → 商品 Q を A で登録（商品フォームか CSV） | CSV なら Q の行に warning。登録の後は A の行は Q。Q の JAN を後で C に変えても A→P は戻らない（A の行は `unmatched_product`） | master-tables §1a、C1・FM2 |
| T8 | T1 の後 → P の JAN を B→A に戻す | 問いは B について出る（P だけが B を持ち、戻した後に誰も持たないとき）。A→P は trigger が消す（P が A を持つ）。warning は出ない | BIZ-01-D9 の warning |
| T9 | T1 の後 → P の JAN を B→D に直し `ある` | 別名は A→P と B→P の 2 つ | C2 |
| T10 | preview（問いが出る）→ 別の CSV を先に取り込んで P の JAN が変わる → 最初の preview のまま `ある` で取り込む | 「もう一度プレビューしてください」で何も変わらない | C8 |
| T11 | JAN を直す前の売上の Z004 を、直して `ない` と答えた後に取り込む | 前の JAN の行は `unmatched_product`（受け入れ済みの限界。JAN を直すのは締めの取込みの後） | D-122 の Guarantee range |
| T12 | A の行を含む Z004 を取り込む（別名で P）→ その取込みを取り消す → Q が A を持った後に取り込み直す | 取消は記録の商品コード（P）で戻す。取り込み直しは今の規則で A の行を Q に入れる | 32 §15.3 手順 4 b の最後の文、D-118 の取消 |
| T13 | 別名 A→P があり、レジの照合で A の枠に別のコードを観測 | 枠は D-117 の規則どおり `external`。別名は残る（レジが A で売らなくなるだけ） | C11 |
| T14 | 別名を作った後に、`products` を作り直す migration を含む版へ更新 | 別名の行は残り、3 つの trigger がある（作り直しの規則） | 22 §17、C3 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 「選んだ行の product_code の一覧」を commit の引数にする（`overwrite_codes`） | 30 §4.9、42 §22.6、60 §60.3、`src/features/products/import/reducer.ts`・`useProductImportFlow.ts` | `old_jan_alias_codes`（同じ形・既定は空） | `ImportRow` に field を足す案は採らない（新規の行に意味の無い欄） | C8・C10 |
| preview の行の `warnings`（UI-01c-D16 の JAN 不備） | 30 §4.8 の `ImportRow.warnings`、60 UI-01c-D16 | 別名の warning（同じ field。重複行にも表示） | wire に新しい field を足さない | C7・C10 |
| commit の TX の中の確かめ直し（BIZ-01-D5 の手順 0、D-118 の確定の検査のやり直し、32 §15.4 の同日 snapshot の再検証） | 30 §4.9 手順 0、32 の D-118 の節、32 §15.4 手順 4 | 手順 0b（TX の前）と 2 e.（TX の中、全行の後） | 答えの合わない commit を続ける案は採らない（32 §15.4 の「再度プレビューしてください」と同じ扱い） | C8 |
| 表の作り直しの migration の index の作り直し（22 §16 の vU の手順 5） | 22 §16 の vU・vB | trigger の作り直し（22 §17 の規則） | 列の改名・追加だけの migration は対象外（probe P2 で trigger が残る） | C3 |
| JAN の文字列の一致（`find_by_jan_code`） | 20 `find_by_jan_code`、`src-tauri/src/db/product_repo.rs:727` | `find_jan_alias` | JAN を数に変える比べ方は採らない | C4 |

## Negative Paths

- missing input: `old_jan_alias_codes` が空 → 全て「ない」（C8）。`old_jan_question` が null の行 → 問いを出さない（C10）。
- invalid input: 上書きしない行の code → 手順 0b で拒む（C8）。`old_jan` が空文字 → CHECK で拒む（C2）。
- duplicate/ambiguous input: 同じ code を 2 回 → 1 つとして扱う（C8）。共有 JAN → 問いを出さない（C6）。同じ前の JAN の 2 行目の別名 → PRIMARY KEY で拒む（C2）。
- unknown reference: code の商品が commit の時点で無い → 2 e. で TX を戻す（C8）。
- dependency missing: 別名の表が無い版の DB → migration で空の表を作る（C3）。
- permission/write failure: 別名の INSERT の失敗（trigger の拒否・DB の失敗）→ DbError で TX 全体を戻す（C1・C8）。
- dry-run side effect: preview は DB を変えない（問いの判定と warning は読むだけ、C6・C7）。

## Boundary Checks

- threshold: 「直す前に A を持つ商品がちょうど 1 つ」（0 = 直す前に誰も持たない〈別名が既にあるか JAN が無い〉→ 聞かない、2 以上 = 共有 → 聞かない）（C6）。
- null/default: `old_jan_question` は null が既定、答えの既定は「ない」、`old_jan_alias_codes` の既定は空（C6・C8・C10）。
- empty/non-empty: 前の JAN が空・NULL の商品は聞かない。JAN を空にする変更は聞く（C6）。
- min/max: 件数・数の上限を足さない（code の一覧は行の数で上限がある）。
- status/policy enum: PLU の枠の状態は条件にしない（C6 の 5 つの状態の case）。
- wire type: `string | null` と `string[]`（数を運ばない）。
- internal type: JAN は TEXT のまま（C4）。
- producer/consumer: BIZ-01 の preview → UI-01c → CMD → BIZ-01 の commit（C9・C10）。
- round-trip token: `old_jan_question` の値（前の JAN）は表示だけで commit に戻さない（commit は DB の今の JAN で判定する）。
- precision/range: JAN の先頭の 0 を保つ（C4）。
- cross-language parse: TS は code と JAN を文字列のまま扱う（数に変えない）。

境界の 4 観点の一巡（今回足した契約の文: 表と 3 つの trigger、`products` を作り直す規則、IO の 2 関数、引き当ての段と関数の共有、問いの 3 条件、preview の判定、warning、`old_jan_question`、`old_jan_alias_codes`、手順 0b・2 e. と 2 つの message、UI の問いと送り方、UI-01b-D25、枠との独立）:

- 安全な整数の範囲: 足した契約に数の値は無い（JAN と商品コードは文字列、件数を返さない）。`created_at` は日時の文字列。
- 0 の表示: 結果（`ProductImportResult`）に別名の件数を足さない。空の答えの一覧は「全て `ない`」で、0 件の別名を特別に表示しない。
- 失敗の時点と順序: preview は読むだけ。commit は手順 0（商品コードの長さ）→ 0b（答えの形、TX の前、DB を変えない）→ TX → 行を処理する前の条件の控え → 全行の処理（trigger が別名を消す）→ 全行の後の条件の確かめ → 別名の INSERT → COMMIT の順で、0b の後の失敗は全て TX 全体を戻す。Z004 の引き当ての DB の失敗は今の `find_by_jan_code` と同じ DatabaseError。
- 単位や種類の混在: JAN-8 と 13 桁の混在は今の商品の照合と同じ扱い（別名は `products.jan_code` の文字列をそのまま持ち、Z004 の 13 桁と文字列で比べる。比べ方を変えない）。共有 JAN と別名は不変条件で混ざらない（別名の JAN を商品が持たない）。

## Compatibility Checks

- old schema/input: 別名の表が無い版の DB は migration で空の表を得る。別名の無い DB の引き当て・商品 CSV の取込みは今と同じ（C5 の既存の期待、C8 の空の一覧）。
- new schema/input: `products` を作り直す後の migration の後にも trigger がある（C3）。
- output order: `old_jan_question` は既存の field の後。preview の行の順と error の items の選び方（32 §15.3 手順 5 c）は変えない。
- optional field behavior: `old_jan_alias_codes` は省略できない引数（UI は常に送る）。`old_jan_question` は null を取りうる。

## Data Safety Checks

- source-derived data: 本 lane は実データを使わない。後続の test は合成の JAN（check digit の合う架空の値）と合成の商品。
- generated outputs: bindings の再生成は後続の lane。
- secrets: 無し。
- local-only files: repo 外の台帳と review の報告。
- synthetic sample boundaries: probe は in-memory の DB。

## Main Wiring / Integration Checks

- helper connected to main path: BIZ-03 の parse が引き当ての関数を呼ぶ（`csv_import_service/parse.rs:112` の `find_by_jan_code` の呼出しを関数に替える）。D-118 の確定の取り直しも同じ関数（C5・FM6）。
- output reaches manifest/report: preview の MatchedRow の商品コードが UI の preview と（停止の解除の後の）売上の記録に届く。
- effective config reaches runtime: migration が registry に登録され、起動の migrate で表と trigger ができる（C3）。
- CLI arg reaches implementation: UI の `oldJanAliasCodes` が CMD を経て BIZ の手順 0b・2 e. に届く（C9・C10 と C8 の結合）。

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → C5 の MatchedRow の `pos_stock_sync` を、別名の商品の値（true）と違う既定（false）で比べる。
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → `test_commit_rematch_uses_same_alias_rule`（preview の後の別名の変化）。
- If a key branch is inverted, which test fails? → 「ヒット 0 件の行だけ別名を引く」を「ヒット 1 件以上でも引く」にすると `test_parse_and_validate_req401_shared_jan_ignores_alias`。条件 2 の `== 1` を `>= 1` にすると C6 (iii)。
- If a threshold comparison changes, which test fails? → C6 (iii)・(iv)・(v)。
- If a guard is removed, which test fails? → 手順 0b を外すと `test_commit_import_rejects_alias_code_not_in_overwrite`。2 e. の後の確かめを外すと `test_commit_import_rolls_back_when_alias_condition_changed`。trigger を外すと C1 の各行。
- If an output field is omitted, which test fails? → `old_jan_question` を常に null にすると C6 (i)・C10。
- If output order changes, which test fails? → 2 e. の「全行の後の確かめ」を行の処理の前の状態で行う mutant は、同じ取込みで他の行が A を持つ case で確かめを通り、別名の INSERT が trigger に拒まれて DbError になる。`test_commit_import_rolls_back_when_alias_condition_changed` の 4 つ目の case は ValidationFailed の message（「もう一度プレビューしてください」）を確かめるので落ちる。
- If dry-run performs a side effect, which test fails? → preview の後に `product_jan_aliases` の行数が変わらないことを C6・C7 で確かめる。
- If a JSON number crosses JavaScript safe integer range, which test fails? → 数を運ばない（JAN を数に変える mutant は C4）。
- If a state token is round-tripped through browser/client code, which test fails? → C10 の 2 行目（`スキップ` に戻した行の答えを送らない）。

## Residual Test Gaps

- 実機（レジで前のバーコードを売り、Z004 に前の JAN の行が出る）は後続の lane の L3 と、Contract Probe の P3 の前提に依る。
- 同梱の SQLite（3.45.0）での trigger の振舞いは後続の lane の migration の test で確かめる（本 run の probe は 3.51.3）。
- Z004 の確定（在庫に入る）は停止 ADR の解除の後で、それまでは preview の引き当てまでしか確かめられない。
