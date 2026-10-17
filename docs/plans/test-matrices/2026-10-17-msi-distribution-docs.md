# Test Design Matrix: アプリの MSI の配布・更新・前の版へ戻す手順を docs にする

本 lane は docs だけで、自動 test を足さない（code を変えない）。下の行は、手順書 `docs/msi-distribution-runbook.md` の分岐ごとの期待と、その期待を壊す誤った読み（mutation）を並べたもの。検査の手段は 3 つ: packet の AC の `rg`（機械で数える）、Plan Review・Final Review の読み取り（引く正本の節と突き合わせる）、予行演習の M1〜M9（実機。後続の項目）。手順が引く code の振舞いには既存の自動 test があり、`rg` で実在を確かめた test 名を Evidence に書く。先例は `docs/archive/plans/test-matrices/2026-10-17-unit-redesign-design.md`（docs の design lane の Matrix）。

## Risk

Risk: R3

## Contracts Under Test

- C1 前へ進む・戻す判断の前と、22 §16「回復」の手順 5・6 の外で、今の DB を動かさない（packet の AC6、Goal の失敗定義の 4 行目）
- C2 戻し方は**今の DB の版**が前の版の扱える版以下かで決める（22 §16「回復」の「旧版でそのまま開けるのは、残った版が旧版のアプリの最大以下のとき」）。今の DB の版は、新しい版が起動できたなら新しい版の扱える版、起動が止まったなら前の版の起動の結果（開く／MNT-03-D11 の文言の「データの版: *N*」）、それも分からなければ配布の記録の版で安全側に決める
- C3 店の DB に DB の作り直しを当てない。初回の導入（リリース）の版は作り直しの起点の migration を全部含む（owner の決定 TD-311、D-119、22 §16 の vB と「DB の作り直しを 1 回にまとめる順」）
- C4 起動の後の照合が全部合ったときだけ業務の入力を始める。合わなければ入力を始めず、控えて止める
- C5 更新の前の backup は前の版で作り、backup の保存先の外の 2 か所へ写す。どれかが失敗したら更新を始めない（71 §71.5・§71.9、22 §16「回復」の手順 1）
- C6 前の版の MSI と更新の前の backup の写しは、owner が戻す可能性を閉じるまで一緒に保つ
- C7 初回の起動の前に、ショートカットの作業フォルダーに `inventory.db` が無いことを確かめる（22 §12 の取込み）
- C8 予行演習は開発の DB に当たらず、終わった後に開発の DB の folder が元の名に戻る（試験用の folder と取り違えない）
- C9 v8 より後の migration から戻す手順は一般化せず、その migration の 22 の節に戻す手順が無ければ DB を戻さない
- C10 MSI の入れ直しだけで戻せる・新しい版の backup で前の版へ戻せる、と読ませない（MNT-03-D11、71 §71.9）

## Failure Modes

- FM1: 流れ 5 が配布の記録の新しい版の「扱える DB の版」だけで戻し方を決め、新しい版の起動が最初の migration で止まって DB が前の版のままのときに、要らない DB の差し替え（runbook の手順 5・6）へ進ませる（C1・C2。round 2 の Codex C1）
- FM2: 新しい版の起動の失敗の文言に出る migration の番号から今の DB の版を決め、COMMIT の後の失敗（版は記録済み）や、先に COMMIT した migration を読み違える（C2）
- FM3: 新しい版の起動の失敗で、22 §16 の vB の「止まった後の進め方」（作り直し）を店の DB に当てる。または初回の導入の版が作り直しの起点の migration を含まず、後の更新で店の DB が作り直しの対象になる（C3。round 2 の Claude O1）
- FM4: 起動の後の照合で在庫の数が違うのに、入力を始めてしまう（照合の失敗の行き先が無い）（C4。round 2 の Codex C3）
- FM5: 流れ 5 の 1 で、新しい版の入力を持つ DB に前の版の MSI を上から入れ、未確認の振舞い（M6・M7）でデータの folder を失ったときに戻す先が無い（C1。round 2 の Claude O5）
- FM6: 予行演習の後、試験用の folder が `com.kosei.inventory` の名を占めたまま退避した folder を戻そうとして、名の衝突で失敗するか、試験用の folder を開発の DB と取り違える（C8。round 2 の Codex C2）
- FM7: 初回の起動の前の作業フォルダーの確かめが起動の手順の中に埋もれ、起動した後に気づく（C7。round 2 の Claude O4）
- FM8: 流れ 3 の backup か写しが失敗したのに更新を進める（C5）
- FM9: 前の版の MSI か更新の前の backup の写しを、戻す可能性が残るうちに手放す（C6）
- FM10: v8 より後の migration を含む版から、その節に戻す手順が無いのに DB を戻す（C9）
- FM11: 前の版の MSI を入れ直すだけで、版の上がった DB を前の版に戻せるように読める（C10）

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | FM1・FM5 | rg（packet の AC6） | AC6 | 手順書に「移す」「置く」の類の語が、runbook の手順 5・6 を引く行の外に 1 行でも出る（後ろの `rg` が exit 0 になる） |
| C2 | FM1 | rg（packet の AC8） | AC8 | 撤回した前提の文（配布の記録の「扱える DB の版」を「戻す先と今の版で比べる」）が手順書に残る |
| C2 | FM1・FM2 | 読み取り（Final Review、22 §3.2 の処理ステップ 5・6、22 §16「回復」と突き合わせる） | 流れ 5 の「今の DB の版を知る」 | 3 つの場面（新しい版が起動できた／起動が止まった／前の版も止まり版が分からない）のどれかが無い、起動が止まった場面で文言の migration の番号から版を決める、または前の版の起動の拒否の文言の「データの版: *N*」（`src-tauri/src/db/mod.rs` の `DbError` の表示）を版の出所にしない |
| C2 | FM1 | 読み取り | 流れ 5 の表の行の見出し | 表の行が「今の DB の版」でなく、配布の記録の版の比較で分かれている |
| C3 | FM3 | rg（packet の AC7） | AC7 | 手順書と backlog の MSI の項目に TD-311 の前提が無い、または流れ 4 に「店の DB に当てない」が無い |
| C3 | FM3 | 読み取り（22 §16 の vB の「止まった後の進め方」・「DB の作り直しを 1 回にまとめる順」、D-119 の Guarantee range と突き合わせる） | 流れ 4・5 の全経路の作り直しの有無 | 流れ 4・5 のどの枝からでも、22 §16 の作り直しの手順か vB の「止まった後の進め方」へ店の DB を送る文が残る |
| C4 | FM4 | 読み取り | 流れ 4 の手順 5 | 照合の項目の 1 つでも合わないときに入力を止める文が無い、または行き先（控えて止める、戻すなら流れ 5）が無い |
| C5 | FM8 | 読み取り（71 §71.5・§71.9） | 流れ 3 の末尾 | 手順 3・4 の失敗で更新を始めない文が無い |
| C6 | FM9 | 読み取り | 配布の記録の保管の段 | 前の版の MSI と更新の前の backup の写しを、owner が戻す可能性を閉じる前に手放せるように読める |
| C7 | FM7 | 読み取り＋L3（M2） | 流れ 2 の手順 3 | 作業フォルダーの確かめが起動の手順（手順 4）の後ろか中にある、あったときに起動せずに止める文が無い。M2 が作業フォルダーの見方を確かめない |
| C8 | FM6 | 読み取り＋L3（予行演習の片付け） | 確かめる項目の「終わった後は次の順で戻す」 | 全プロセスの停止 → 試験用の folder の別名での保全 → 元の名が空いていることの確かめ → 退避した folder を戻して確かめる、の順が崩れる、または空いていないときに先へ進める |
| C9 | FM10 | 読み取り | 流れ 5 の 2 の 1 つ目の箇条 | v8 より後の migration で、その 22 の節に戻す手順が無いのに DB を戻せるように読める |
| C10 | FM11 | 読み取り（packet の AC5） | AC5 | 流れ 5 が「今の DB の版が前の版の扱える版を超えたら MSI の入れ直しだけでは戻せない」と「前の版で作った backup を使う」を書いていない |
| C1・C2 | FM1 | 既存の自動 test（手順が引く振舞い） | `test_startup_req903_d11_newer_schema_stops_startup_with_own_message`（`src-tauri/src/lib.rs`）、`test_migrate_req903_d11_rejects_newer_schema_without_writes`（`src-tauri/src/db/migration.rs`） | 前の版が新しすぎる DB で文言の末尾に「データの版: *N*」を出さない、または拒否の前に DB に書く（流れ 5 の「前の版を入れて起動して確かめる」が DB を変える） |
| C2 | FM2 | 既存の自動 test | `test_migration_req903_v8_commit_and_fk_restore_failures`（`src-tauri/src/db/migration.rs`） | COMMIT の後の後始末の失敗で版が記録済みになる場合と、COMMIT の失敗で版が戻る場合の区別が変わる（文言の migration の番号から版を決めない理由） |

## State Lifecycle Matrix

管理者の手順の状態（店の PC のアプリの版と DB の版）。

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 店の PC のアプリと DB の版（流れ 3〜5） | 前の版が動き、DB は前の版の扱える版 | 流れ 3 の backup と写しの後、新しい版の MSI を入れて起動 | 照合が全部合い、DB は新しい版の扱える版 | — | — | 翌日以降に不具合（流れ 5） | 新しい版の再起動は同じ migration で止まり得る（新しい版を使い続けない） | 起動の失敗か照合の不一致で、入力を始めずに止まる。今の DB の版を流れ 5 の 3 つの場面で知る | 前へ進む（修正版を流れ 3 から）か戻す（流れ 5 の 1・2） | 読み取り（Test Matrix の C2・C4）、AC6 |
| 予行演習の開発機のデータの folder | 開発の DB が `com.kosei.inventory` | 全プロセスを止めて別名へ退避 | 試験用のデータで M1〜M8 | — | — | — | — | 片付けで元の名が空いていない | (1) からやり直す | 読み取り（C8） |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 戻し方を版で分ける（22 §16「回復」の「残った版が旧版のアプリの最大以下」） | `rg -n '旧版の最大|扱える版|残った版' docs/function-design/22-mnt-migration.md docs/migration-recovery-runbook.md docs/msi-distribution-runbook.md` | 手順書の流れ 5 | runbook の「使わない場合」（v8 がその起動の最初の migration だった場合。手順書の流れ 5 の「今の DB の版を知る」が一般の形を持つ。runbook は変えない〈Non-scope〉） | AC8、読み取り |
| 作り直しの手順（22 §16 の vB の「止まった後の進め方」と「作り直しの手順」） | `rg -n '作り直' docs/msi-distribution-runbook.md docs/migration-recovery-runbook.md docs/function-design/22-mnt-migration.md` | 手順書の「初回の導入の前に決めること」と流れ 4 | 22 §16 と D-119 の本文（開発・試験 DB の手順として正しい。変えない） | AC7 |
| 作業フォルダーの旧 DB の取込み（22 §12） | `rg -n '作業フォルダ' docs/msi-distribution-runbook.md` | 流れ 2 の手順 3、予行演習の準備 | 流れ 4 の更新（データの folder に DB があるので取り込みは起きない。22 §12.2 の手順 1） | 読み取り |

## Negative Paths

- missing input: 前の版の MSI か更新の前の backup の写しが無い → 流れ 5 の 1・2 に進めない。保管の規則（C6）で防ぐ
- invalid input: SHA-256 が配布の記録と違う → 入れない（流れ 2・4）。backup の写しの版が新しすぎるか `integrity_check` が `ok` でない → runbook の手順 4 で止まる
- duplicate/ambiguous input: 今の DB の版が分からない → 配布の記録の版で安全側（流れ 5）
- unknown reference: v8 より後の migration の 22 の節に戻す手順が無い → DB を戻さない（C9）
- dependency missing: 店の PC に `sqlite3` が無い → 開発用の PC で確かめ、SHA-256 を照らす（流れ 5 の 2）
- permission/write failure: 流れ 3 の backup・写しの失敗 → 更新を始めない（C5）
- dry-run side effect: 前の版を入れて起動して版を確かめるとき、新しすぎる DB は論理内容を変えずに拒まれる（MNT-03-D11。既存の自動 test）

## Boundary Checks

- threshold: 今の DB の版と前の版の扱える版の比較は「以下」と「超える」の 2 つで、等しいときは前の版で開ける（22 §3.2 の処理ステップ 2 の `current_version > app_max`）
- null/default: 版が分からないとき → 配布の記録の版で安全側
- empty/non-empty: 予行演習の片付けで試験用の folder が無い（M7 で消えた） → (2) を飛ばして (3) へ
- min/max: MSI の版の形（major と minor は 255、patch と build は 65,535 まで）は「今の事実」の表のまま
- status/policy enum: 起動の失敗の文言は MNT-03-D11 とそれ以外の 2 つに分ける（22 §12.4 の文言の表）
- wire type: 該当なし（wire に触れない）
- internal type: 該当なし
- producer/consumer: 配布の記録（管理者が書く）→ 流れ 5（管理者が読む）
- round-trip token: 該当なし
- precision/range: 該当なし
- cross-language parse: 該当なし

## Compatibility Checks

- old schema/input: 22 §16 の runbook（v8 の例）は変えない。手順書は引くだけ
- new schema/input: 該当なし
- output order: 該当なし
- optional field behavior: 該当なし

## Data Safety Checks

- source-derived data: 手順書・packet・Matrix に店の運用の細部・店のデータ・発言の原文を書かない
- generated outputs: MSI・配布の記録・backup は repo の外
- secrets: 無し
- local-only files: 予行演習で退避・保全した folder は開発機の中だけ
- synthetic sample boundaries: 予行演習は `seed_demo_data` の決定的な試験データだけ

## Main Wiring / Integration Checks

- helper connected to main path: `docs/PROJECT_HANDOFF.md` の案内の表から手順書へ辿れる（AC3）
- output reaches manifest/report: 該当なし
- effective config reaches runtime: 該当なし（`tauri.conf.json` を変えない）
- CLI arg reaches implementation: 該当なし

## Mutation-style Adequacy Questions

- If a mock value is changed so it differs from the design-doc expected value, which assertion proves the implementation used the correct source and not the mock's accidental constant? → 該当なし（code を変えない）
- If invalidate/refetch changes the value before versus after the operation, which test proves the lifecycle order and preserved snapshot are correct? → 該当なし
- If a key branch is inverted, which test fails? → 流れ 5 の表の行を配布の記録の版で分ける形に戻すと AC8（旧い文）と読み取りの C2 の行。作り直しを店の DB に当てる文を戻すと AC7 の「店の DB に当てない」が 0 件になる
- If a threshold comparison changes, which test fails? → 「以下」を「より小さい」にすると、版の同じ更新（migration の無い版）で runbook の 7 手順へ送る。読み取りの C2 の行（表の見出しの「以下」）
- If a guard is removed, which test fails? → 流れ 3 の中止の条件を外すと C5、照合の不一致で止める文を外すと C4、片付けの (3) を外すと C8 の読み取りの行
- If an output field is omitted, which test fails? → 配布の記録の「扱える DB の版」を外すと流れ 5 の 1 つ目と 3 つ目の場面が成り立たない（読み取りの C2）
- If output order changes, which test fails? → 流れ 2 の手順 3 と 4 を入れ替えると C7、片付けの (2) と (4) を入れ替えると C8 の読み取りの行
- If dry-run performs a side effect, which test fails? → 前の版の起動での版の確かめが DB に書くなら `test_migrate_req903_d11_rejects_newer_schema_without_writes`
- If a JSON number crosses JavaScript safe integer range, which test fails? → 該当なし
- If a state token is round-tripped through browser/client code, which test fails? → 該当なし

## Residual Test Gaps

- MSI の振舞い（M1〜M8）は開発用の Windows の予行演習で、M9 は店の PC で確かめる（後続の項目）。特に流れ 5 の 1 の「前の版の MSI を上から入れてもデータの folder が残る」は M6・M7 の結果に依る。それまで店の PC に入れない（手順書の「初回の導入の前に決めること」と流れ 2 の前提）。
- 読み取りの行は機械で止まらない。Final Review で引く正本の節と 1 行ずつ突き合わせる（Contract Ledger）。
- 前の版の起動での版の確かめは、前の版の起動の失敗の文言を実機で 1 度見る機会が予行演習に無い（M の表に無い）。予行演習で版 B の migration を持つ組を作るかは後続の項目で決める。
