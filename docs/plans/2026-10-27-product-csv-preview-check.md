# Plan Packet: 商品 CSV のプレビューで黙って入る形の行を名指しで止める（導入の前の関門 8）

wave に属さない単独の lane。owner の決定（repo 外の回答台帳 TD-421・TD-426、2026-10-24）で起票した。起源は初期投入の手順の lane（PR #196、branch `agent/initial-load-procedure`）の起票の調べと Plan Review で、同じ PR が `docs/backlog.md` の項目「商品 CSV のプレビューで黙って入る形の行を止める」と `docs/Plans.md` の「導入の前の関門」の 8 を足した（どちらも本 lane の起票の時点では #196 の branch にだけあり、main には無い）。branch は `agent/product-csv-preview-check`（main `50f97a76` から）。新しい決定は D-140、新しい設計判断は [30](../function-design/30-biz-product-service.md) BIZ-01-D10 と [60](../function-design/60-ui-product-import.md) UI-01c-D18（本 commit）。本 run は起票（packet・Matrix・plan-first の正本の直し）と Draft PR までで、実装は plan-approved の後の別の run。

**#196 との順**: #196（R4、Final Review はこれから）が先に merge する見込み。本 lane は **#196 の merge の後に `origin/main` を単段で同期してから plan-gate に出す**（同期で backlog の項目・Plans の関門の 8・手順書 `docs/initial-load-runbook.md` が base に入る）。backlog の項目は #196 の branch の版（`git show origin/agent/initial-load-procedure:docs/backlog.md` の項目）を引き、main の backlog は本 lane で変えない。項目への完了の印と関門の 8 の「済み」は、本 lane の merge の後の closeout で付ける（#196 の closeout が先なら、その後の本 lane の closeout で）。#196 が先に merge しなかった場合は、plan-gate の前に Coordinator が順を決める（手順書の S6 は #196 の版が base に入るまで書けない）。

**規模と手法（1 lane・1 PR。実装は test を先に赤にしてから 1 段で直す）**: 2026-10-27 に本 worktree（HEAD `50f97a76`）で数えた。

- 触る設計正本: plan-first（本 commit）で 6 file（30・60・master-tables・SCREEN_DESIGN・ui-task-specs・decision-log）。実装の PR では手順書 1（#196 の merge の後）と生成物 1（`docs/function-design/90-traceability.md`）。
- code: 3 file（`src-tauri/src/biz/product_service.rs` の 1 関数の追加と preview・commit の呼出し・test、`src/features/products/import/ProductImportPreview.tsx` の表示の 2 か所、その test）。wire の型・command・bindings・DB・migration は変えない。
- 手法: 判定は行の値だけの 1 関数で、preview と commit が同じ関数を呼ぶ。画面はエラー行の表示の制限を外して 1 文を足すだけ。BIZ と画面は 1 つの利用者の結果（その画面で名指して止める）なので分けない。Matrix の T1〜T6 と T9 を先に書いて red を確かめ、関数と表示を足して green にし、契約が置き換わった既存 test 2 本（T7・T8）を同じ commit で直す。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（起票は fresh context の Writer。実装の Writer は plan-approved の後に Coordinator が発注する）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）。座組表どおり
- Final Reviewer: Fable 5（Claude 側、R3 以上。owner の決定 2026-10-24 で当面 Fable 5）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge,manual
- Branch: agent/product-csv-preview-check

遷移の記録:

1. kickoff → spec-check（2026-10-27、起草役）: Coordinator の発注（TD-421・TD-426、関門の 8）を Scope にし、規模を数えて 1 lane・1 PR と決め、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-27、起草役）: 対象の正本は [30](../function-design/30-biz-product-service.md) §4.8 の手順 4・§4.9 の手順 0・BIZ-01-D1・BIZ-01-D5・BIZ-01-D8、[master-tables](../db-design/master-tables.md) の `jan_code` の列と「jan_code の形式 validation を DB に置かない理由」、[60](../function-design/60-ui-product-import.md) UI-01c-D5・D8・D16・§60.5・§60.6、ADR SPEC-STK-CNT-D4（共有 JAN）。BIZ-01-D1 が CSV の取込みを JAN の形の検証の対象外と明記しているので、正本の置き換えが要る（下の Design Readiness）。
3. design → plan-draft（2026-10-27、起草役、本 commit）: BIZ-01-D10・UI-01c-D18・D-140 を正本に置き、BIZ-01-D1 と master-tables の「対象外」の句を置き換えた（下の「本 commit で変えた正本」）。owner に聞く設計の問いは残っていない（下の「owner の判断事項」は 5 件とも推奨を既定にした）。plan-gate へは、#196 の merge の後に `origin/main` を同期してから Coordinator が進める（前文）。
4. plan-draft → plan-gate（2026-10-27、Coordinator）: packet と Test Design Matrix は commit 済み。前文の順のとおり #196 が先に merge し（`f9a10762`）、`origin/main`（`ab009c1d`）を単段で同期した（`baab4ae0`）。手順書 `docs/initial-load-runbook.md` が base に入り、S3 の手順書の行が指す所（「今の事実」の「黙って入る形」の行、J5 の「変わる所」、流れ 1 の手順 4 の「初回の導入の版のプレビューが名指しで止める」の 3 か所、流れ 2 の手順 4）が今の版にあることを確かめた。owner の判断事項 5 件は推奨を既定のまま（出所は AI の調べで Human Gate の必須にしない）。Plan Review へ出す（fresh Opus 5.5 + Codex）。

本 commit で変えた正本（plan-first）:

- `docs/function-design/30-biz-product-service.md`: BIZ-01-D1 の適用の経路を「手入力の create と商品 CSV の取込み」に置き換え（「CSV/Z004 import 経路は対象外、preview_import / commit_import は検証を追加しない」の句を外した）、§4.8 の手順 4 に形の検査の行を足し、`PLU対象=1` の warning の対象を「13 桁でない JAN（空か 8 桁）」に直し、§4.9 の手順 0 とエラーハンドリングに形の再検証を足し、BIZ-01-D10（F1〜F4 の判定と文、順、通るもの、却下、範囲、Revisit）を BIZ-01-D5 の後に置いた。
- `docs/function-design/60-ui-product-import.md`: UI-01c-D18（エラー行の全件表示と表の上の 1 文）、UI-01c-D16 の warning の対象の文、§60.5 のエラー行、§60.6 の行エラー、§60.9 の D16・D18、§60.10 の履歴。
- `docs/db-design/master-tables.md`: `jan_code` の列の説明と「jan_code の形式 validation を DB に置かない理由」の「import 経路は対象外」の句。
- `docs/SCREEN_DESIGN.md`: 商品一括インポート画面のレイアウト判断に 1 行（黙って入る形の行の名指しとエラー行の全件）。
- `docs/architecture/ui-task-specs.md`: UI-01c の利用者操作フローの手順 2 の「不正 JAN の warning」を「13 桁でない JAN（空か 8 桁）の warning」に。
- `docs/decision-log.md`: D-140。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 0（2026-10-27 の起票の時点） | 3（L3 の 1 round・Ready・merge） | 3 | 6 = 0 + 3 + 3 |

既定値・数え方・上限に届くときの扱いは `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

owner の操作の回数を減らす工夫: L3 は 1 round・合成の CSV 2 つ（Coordinator が CP932 で用意し、Ready の依頼と同時に渡す）・確かめる項目 3 つで、1 回の取込みの画面の操作で済む（下の Test Plan の L3）。同じ日に他の lane の L3 がある日は、`docs/DEV_WORKFLOW.md` Wave Operation の束ねる条件（path の共有なし）を満たす限り 1 回の依頼に束ねる。下の「owner の判断事項」は推奨を既定にしたので、owner の答えを待たずに進み、変えるときだけ予備から 1 回使う。

## Risk

Risk: R3

Reason:
商品 CSV の取込みの検証の契約（受け入れる行の範囲）と取込みの画面の表示を変える（`docs/DEV_WORKFLOW.md` Risk Tiers の operator workflow と、行の分類という import の契約）。DB の値を消す・移す操作は無く（今まで通した行を error にして取り込まないだけ）、R4 の「Destructive data lifecycle」には当たらない。

Rollback notes: PR を revert すると判定が外れ、今の寛容な取込みに戻る。revert までに取り込んだ商品は検査を通った行だけなので、戻しても記録の値・意味は変わらない。DB・migration・設定の操作は要らない。

この変更でどれかの required gate の green / red が変わるか: 変わらない（製品の code・test・設計正本だけで、gate の定義・helper・classifier・CI・workflow の正本を触らない）。

## Goal

Goal Invariant:

### 最小完了条件

- 商品 CSV の一括インポートのプレビューで、(1) `商品コード` か `JANコード` が指数の形（`E+`）の行、(2) `商品コード` が 13 桁の数字で `JANコード` が空の行、(3) `JANコード` が 8 桁・13 桁の数字でないかチェックディジットが合わない行が、新規の行でも上書きの候補の行でもエラー行になり、画面に行の番号・原因・直し方が全件出て、その行は取り込まれない。正しい行は今と同じく取り込める。

### 失敗定義

- 上の 3 つの形のどれかの行が、新規登録候補か重複行（上書きの候補）としてプレビューに出る、または確定で DB に入る（画面を通らない wire を含む）。
- 今通る行（JAN が空の独自コード、13 桁の数字の商品コードに合う JAN、8 桁のチェックディジットが合う JAN、先頭 2 の店内コード、共有 JAN）がエラー行になる。
- エラー行が 51 行以上あるとき、どれかの行が画面に出ない。
- 手入力の商品登録の JAN の検査（文・判定）が変わる。

### 非目的

- 下の「owner の判断事項」の候補（8 桁の数字の商品コード、商品コードと JAN の不一致、上書きで JAN を消す行の warning、`00000` で始まる 13 桁の JAN、原価 × 初期在庫の合計）を既定のまま入れること。
- 既に DB にある行の JAN を直すこと、Z004 の取込みの検査を変えること、CSV の行を画面で直す機能、エラー行の一覧の file の書出し。
- 手順書 `docs/initial-load-runbook.md` の手作業の確かめを、本 lane が止めない形（上の候補）の分まで外すこと。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 在庫 Excel から作った商品 CSV（数千行。一部の行で Excel が 13 桁の数を `4.90123E+12` の形にした、JAN の先頭の 0 が落ちた、JAN を商品コードにしたのに `JANコード` を空にした） | 一括インポートで CSV を選ぶ | プレビューのエラー行の表に、その行が全件、行の番号と原因・直し方の文（例「JANコードが8桁か13桁の数字ではありません: '4912345'。先頭の0が落ちていないかを見て…」）で出る。表の上に「エラー行は取り込みません。…「ファイルを選び直す」で読み込み直してください」 | 利用者が Excel で名指された行を直し、文字列で保存し直す | Excel が CSV の保存で表示の形を書くか（P1、下の Contract Probe） |
| 同じ画面（プレビュー） | 「ファイルを選び直す」で直した CSV を選ぶ | エラー行が 0 になり、新規登録候補の数が行の数と合う | 「インポート実行」 | なし |
| 同じ | 「インポート実行」 | 取り込んだ件数が出る。どの商品も JAN の形が正しく、13 桁の数字の商品コードの商品は同じ JAN を持つ | 業務（売上の取込みで Z004 が JAN で引き当たる） | なし |
| エラー行を残したままのプレビュー（導入の後に数件を足す CSV で、1 行だけ JAN を打ち間違えた） | 「インポート実行」 | 正しい行だけが入り、エラー行は入らない（今の UI-01c-D8）。その行は CSV を直して読み込み直せば入る | 同じ CSV を直して取り込み直す（既に入った行は重複行として既定のスキップになる） | なし |
| 導入の後、13 桁の数字の商品コードの商品の売価を直す上書きの CSV で、`JANコード` を空にした | CSV を選ぶ | その行はエラー行（F2）で、重複行（上書きの候補）に出ない。JAN を入れ直せば上書きできる | `JANコード` に今の JAN を入れて選び直す | なし |

## Scope

対象の code と、読む所・test の呼び方（2026-10-27、`50f97a76`）。wire の型（`ImportRow`・`ImportErrorRow`・`ImportDuplicateRow`・`ImportPreview`・`ProductImportResult`）と command・bindings は変えないので、作る所・読む所の全件の列挙は要らない（`ImportErrorRow.errors: Vec<String>` に入る文が増えるだけ）。

### S1 BIZ（`src-tauri/src/biz/product_service.rs`）

| 変えること | 根拠 |
|---|---|
| 行の値だけを見る private の関数を 1 つ足す（名前は実装に任せる。例 `import_code_shape_errors(product_code: &str, jan_code: Option<&str>) -> Vec<String>`）。BIZ-01-D10 の F1〜F4 を表の順・文の literal で返す。JAN の判定は `super::jan_code::validate`（`biz::jan_code`、変えない）を呼び、`JanCodeValidationError` の 2 つの variant を F3・F4 に写す。指数の形の判定は ASCII の文字の走査で足りる（新しい crate を足さない） | 30 BIZ-01-D10、BIZ-01-D1 |
| `preview_import` の行の検証（`// 3. 各行バリデーション` の段）で、F1 の `商品コード` を `商品コード` の今の検査（空・上限・CSV の中の重複）の直後に、F1 の `JANコード`・F2・F3・F4 を `JANコード` を読んだ直後に `errors` へ足す。重複の分類（`existing` の match）と共有 JAN の検査（`import_row_link_error`）より前なので、上書きの候補の行にも当たり、当たった行は共有 JAN の検査に届かない | 30 §4.8 手順 4 |
| `commit_import` の TX を開く前（今の BIZ-01-D5 の上限の再検証の直後）に、valid_rows の順で同じ関数を呼び、最初に当たった行の最初の文で `BizError::ValidationFailed` を返す（DB を変えない） | 30 §4.9 手順 0 |
| `PLU対象=1` の warning（`is_plu_target_eligible_jan`）と `should_default_plu_target` は変えない（下の「この変更で不要になるもの」） | 30 BIZ-01-D2 |
| test を足す（Matrix の T1〜T6）。契約が置き換わった既存 test 2 本を直す（T7・T8。下の「契約が置き換わる既存 test」） | Matrix |

契約が置き換わる既存 test（`test-quality` の「誤ったテストは設計正本との不一致と理由を示して修正する」。弱めず、置き換わった契約の部分だけを新しい正本に合わせる）:

- `test_preview_import_req907_warns_and_disables_invalid_jan_plu_target`（T7）: 行 `PLU-C2-SHORT` の `JANコード` `12345678` はチェックディジットが合わず（`biz::jan_code::validate` で外れる。下の probe P3）、行 `PLU-C2-CHECK` の `2000000000038` も合わない。BIZ-01-D10 でどちらもエラー行になる。`PLU-C2-SHORT` の JAN を BIZ-01-D1 の golden の EAN-8 `49123456` に替えて「8 桁の JAN の warning と対象外」を今のまま確かめ、`PLU-C2-CHECK` はエラー行（F4 の文）を期待する形に直す。名前は `test_preview_import_req907_warns_and_disables_plu_target_without_13_digit_jan` に改める（`invalid_jan` の warning はもう無い）。
- `test_commit_import_req907_blank_plu_target_derives_for_new_and_preserves_overwrite`（T8）: 行 `PLU-C4-INVALID-CHECK`（`2000000000038`）を commit が受け入れて `plu_target` を導く期待は、§4.9 の手順 0 の再検証で拒まれる。その行と assert を外す（新規の既定の導出と上書きの保持の 2 つは残す）。`should_default_plu_target` がチェックディジットを見ない互換（BIZ-01-D2、一覧の inline の導出に使う）は `test_should_default_plu_target_req907_preserves_invalid_check_digit_compatibility` が今のまま確かめる。

ほかの既存 test の fixture の確かめ（2026-10-27、`50f97a76`）: `python3 -I` の小さな script で、`preview_import`・`commit_import` を呼ぶ 4 file（`product_service.rs`・`plu_export_service.rs`・`cmd/product_cmd.rs`・`csv_import_service/tests/rollback_tests.rs`）と `io/l3_fixtures.rs`・`sales_service.rs`・`cmd/sales_cmd.rs` の 8 桁・13 桁の数字の literal をチェックディジットで調べた。合わないものは上の 2 本と、商品 CSV の取込みを通らない所（`create_product` の拒否の test、`should_default_plu_target` の互換の test、`bulk_set_plu_target` の DB に直に入れた行、Z004 の取込みの test の `4912345678901`〈商品は `insert_product` で直に入れる〉、`plu_export_service.rs` の DB に直に入れた行、価格の上限の `99999999`・`10000000`）だけだった。`rg -nE 'make_import_row\("[0-9]{13}"|"[0-9]{13},|product_code: "[0-9]{13}"|[Ee]\+[0-9]'` は 3 file（`product_service.rs`・`plu_export_service.rs`・`cmd/product_cmd.rs`）で出力なし。実装の run で `cargo test` を通し、ほかに red が出たら、設計正本（BIZ-01-D10）と fixture のどちらが誤りかを示して直す（fixture の偶然の値なら合う値に替える。期待を弱めない）。

### S2 画面（`src/features/products/import/ProductImportPreview.tsx`）

| 変えること | 根拠 |
|---|---|
| エラー行の表の `preview.error_rows.slice(0, MAX_VISIBLE_ROWS)` を全件の `preview.error_rows` にし、エラー行の「他 N 件」の段落を外す。新規登録候補と重複行の表の 50 行の制限は変えない | 60 UI-01c-D18 |
| エラー行の card の表の上に 1 文 `エラー行は取り込みません。内容の文のとおりに CSV を直し、「ファイルを選び直す」で読み込み直してください` を出す（text。色だけに頼らない） | 60 UI-01c-D18、§60.5 |
| `ProductImportPreview.test.tsx` に test を 1 本足す（Matrix の T9） | Matrix |

新しい表示の文言と既存の matcher の衝突（2026-10-27、`50f97a76`）: `rg -F 'エラー行は取り込みません' src` は出力なし。BIZ の 4 つの文の語（`指数の形`・`チェックディジットが合いません`・`8桁か13桁の数字ではありません`）も `rg -F '<語>' src src-tauri/src` で出力なし。`rg -n 'エラー行' src --glob '*.test.*'` は `ProductImportPage.test.tsx` の UI-01c-D8 の test 名と page の説明の文、`csv-import`・`inventory-records` の別画面の test だけで、`getByText` の部分一致で当たる文は無い（実装の run で green を確かめる）。

### S3 docs と生成物

| file | 変えること | 時点 |
|---|---|---|
| 正本 6 file | 上の「本 commit で変えた正本」 | 本 commit |
| `docs/function-design/90-traceability.md` | `cd src-tauri && cargo run --bin generate_traceability` で再生成（REQ-104・REQ-907 の test の名前と数が変わる。手で直さない） | 実装 |
| `docs/initial-load-runbook.md`（#196 が足す。本 lane の base には無い） | #196 の merge の後の同期の版で、本 lane が入った後の形に合わせる: 「今の事実」の「黙って入る形」の行（「今のアプリには無い」「初回の導入の版では」の未来の書き方を今の版の事実に。止める 3 つの形と、止めない形〈8 桁の数字の商品コード、`00000` で始まる 13 桁、商品コードと JAN の不一致〉を分けて書く）、「入れる前に決めること」の J5 の「変わる所」、流れ 1 の手順 4 の「初回の導入の版のプレビューが名指しで止める」の 3 か所、流れ 2 の手順 4 の J5 の注、「入れた後に誤りを見つけたら」の JAN の行（プレビューが止める行の文を今の版に）。下の「owner の判断事項」で owner が既定と違う答えを選んだら、その形の手作業の確かめ（流れ 1 の手順 4 の該当の確かめの列）を外す | 実装（#196 の merge の後） |

`docs/backlog.md` と `docs/Plans.md` は本 lane で触らない（前文。closeout で項目と関門の 8 に完了を付ける）。

### 並走との重なり（`comm -12`、2026-10-27）

入力は本 lane の予定 path 13（本 packet・Matrix・正本 6・`product_service.rs`・`ProductImportPreview.tsx`・その test・`90-traceability.md`・`initial-load-runbook.md`）と、各 PR の branch の差分（`git diff --name-only --no-renames origin/main...origin/<branch>`）。#193 は branch の差分と packet の「予定 path の一覧」（62）の和。

- #202（`agent/screen-elements-redesign`）と 4: `docs/SCREEN_DESIGN.md`・`docs/architecture/ui-task-specs.md`・`docs/decision-log.md`・`docs/function-design/60-ui-product-import.md`
- #197（`agent/z004-rollback-entry`）と 3: `docs/SCREEN_DESIGN.md`・`docs/architecture/ui-task-specs.md`・`docs/function-design/90-traceability.md`
- #172（`agent/sd-direct-read-runtime`）と 2: `docs/SCREEN_DESIGN.md`・`docs/function-design/90-traceability.md`
- #193（`agent/stocktake-count-runtime-b2`）と 2: `docs/SCREEN_DESIGN.md`・`docs/function-design/90-traceability.md`
- #196（`agent/initial-load-procedure`）と 1: `docs/initial-load-runbook.md`
- #201（`agent/dev-bins-out-of-msi`）と 1: `docs/decision-log.md`
- #194（`agent/backup-offsite-runtime-b`）と 1: `docs/decision-log.md`
- #190（`agent/backup-offsite-runtime`）・#204（`agent/docs-file-line-check`）と 0

節の所有表:

| file | 他の lane の節 | 本 lane の節 | 扱い |
|---|---|---|---|
| `docs/function-design/60-ui-product-import.md` | #202: UI-01c-D11・D13 の行と §60.5 の `result` の行（戻り導線の画面名） | UI-01c-D16 の行、表の末尾の UI-01c-D18 の行（D17 の後）、§60.5 のエラー行の行、§60.6 の行エラー、§60.9 の D16・D18、§60.10 の末尾 | 行が別（間に変えない行がある）。#202 が先に merge する見込みで、同期で当て直す |
| `docs/SCREEN_DESIGN.md` | #202: 商品一括インポート画面の route の行・完了画面の行・L3 の行ほか多数の節。#197: 120 行あたりの売上取込みの節。#172: 76・114 行あたり。#193: 棚卸し・在庫の節 | 商品一括インポート画面の「エラー行があっても…」の行の直後に 1 行を足す | #202 と同じ節の別の行（間に「取り込める行が 0 件…」の行がある）。先に merge した版を起点に同期で当て直す |
| `docs/architecture/ui-task-specs.md` | #202: 26・81・90・208 行あたり。#197: 235 行あたり | UI-01c の利用者操作フローの手順 2（182 行あたり） | 行が別 |
| `docs/decision-log.md` | #201: D-137、#194: D-130、#202: D-138 と 363 行あたり。どれも末尾に追記 | 末尾に D-140 | 末尾への追記は merge の順で両方を残す（D-055） |
| `docs/function-design/90-traceability.md` | #197・#172・#193: 生成物 | 生成物 | 衝突は手で解かず、取り込んだ後に再生成する（D-098） |
| `docs/initial-load-runbook.md` | #196: 新設 | #196 の merge の後に S3 の節だけ | #196 が先（前文） |

merge の順: #196 → （#202 は merge の直前で、本 lane より先の見込み）→ 本 lane。本 lane は #196 の merge の後に `origin/main` を単段で merge してから plan-gate に出し、実装の後に #202 か他の lane が先に merge したら同じく単段で同期する。L3 は本 lane が train の先頭に来て最新の `origin/main` を取り込んだ head で頼む（D-124）。

新しい decision・ID の番号: D-140（発注の予約）、BIZ-01-D10、UI-01c-D18。open な 9 PR の branch の docs に同じ ID は無い（`git grep -n -e 'D-140' -e 'BIZ-01-D10' -e 'UI-01c-D18' <9 branch> -- docs` の出力なし、2026-10-27）。migration は足さない。

### この変更で不要になるもの（D-127）

- 正本: BIZ-01-D1 の「CSV/Z004 import 経路と既存 DB 行は対象外（実店舗データ互換のため寛容性を意図的に維持し、preview_import / commit_import は検証を追加しない）」、master-tables の `jan_code` の列の「import 経路・既存行は対象外」と「CSV/Z004 import 経路には非 JAN 値・非 13 桁値が実在し得る」、§4.8 の手順 4 の PLU の warning の「または check digit 不正」、UI-01c-D16 と ui-task-specs の「不正 JAN の warning」。どれも本 commit で置き換えた（足すのでなく置き換え。AC-7 の削除の検査）。
- 手順書の手作業: 流れ 1 の手順 4 が「プレビューが止める」としている 3 つの形の注は、本 lane で今の版の事実になる（S3）。本 lane が止めない形の手作業の確かめ（8 桁の数字の商品コード〈J4 の a のとき〉、数字だけの商品コードと JAN の不一致、`00000` で始まる 13 桁）は残る（owner の判断事項の既定）。
- code: `is_plu_target_eligible_jan` のチェックディジットの判定は、preview では形の誤った JAN の行が先にエラー行になるので結果を変えなくなる。外さない: 外しても観測できる振舞いは変わらず、`should_default_plu_target`（BIZ-01-D2、チェックディジットを見ない互換）と 1 つにすると、DB の行に使う導出と CSV の `PLU対象=1` の判定の意味の違いが code から消えるため。`PLU対象=1` の warning の文（`JAN が13桁でないため対象外として取り込みます`）は空と 8 桁の JAN にそのまま当たるので変えない。
- test: T7・T8 の、置き換わった契約（CSV がチェックディジットの合わない JAN を受け入れる）を期待する部分（上の S1）。
- 画面: エラー行の表の「他 N 件」の段落（UI-01c-D18 で全件にするので不要）。

## owner の判断事項

5 件。どれも出所は初期投入の手順の lane（PR #196）の Plan Review の AI の調べで、owner の確認の前に必須にしない（AGENTS.md の「owner の所感は原文で扱う」）。owner の方針（repo 外の回答台帳 TD-401）で推奨を既定にして書き進めた。答えで変わる所はどれも、BIZ-01-D10 の表の 1 行・Matrix の 1〜2 行・手順書の手作業の確かめの 1 列で、wire・画面の形は変わらない（(3) の a を除く）。

1. **8 桁の数字の `商品コード` で `JANコード` が空の行を止めるか**（候補 (1)）: (a) F2 に足して止める。(b) 止めない（推奨・既定、precondition-dependent）。推奨の理由: 手順書の J4 の既定 b（8 桁の JAN の商品は独自コードにし、8 桁は `JANコード` に入れる）ではこの形の行が出ない。店の今の独自コードに 8 桁の数字のものがあるかは確かめていない（あれば (a) は正しい行を止める）。J4 で a を選ぶなら (a) に替える。答えで変わる所: BIZ-01-D10 の F2 の条件（「13 桁」→「8 桁か 13 桁」）、Matrix の T2 の 8 桁の行の期待、手順書の流れ 1 の手順 4 の確かめ。
2. **数字だけの `商品コード` が `JANコード` と同じでない行を止めるか・知らせるか**（候補 (2)。(1) を含む）: (a) 行の error、(b) warning、(c) どちらもしない（推奨・既定）。推奨の理由: 売上の引き当ては `jan_code` で行うので、`JANコード` が正しい形なら商品コードと違っても Z004 は引き当たる（害は名前の整い方だけ）。害のある部分集合（13 桁の数字の商品コードで JAN が空）は F2 が止める。(b) の warning は新規登録候補の表の 50 行の外に隠れるので、UI-01c-D17 の warning のまとめ（JAN の別名の runtime の lane、proposed・未実装）が無いと全件を名指せない。答えで変わる所: BIZ-01-D10 の表に 1 行、Matrix に 1 行、手順書の流れ 1 の手順 4 の不一致の確かめの列（(a) なら外す）。
3. **上書きで JAN を消す行（`JANコード` が空か列が無く、今の JAN を消す。13 桁の数字の商品コードの商品は F2 で既に止まる）を warning で知らせるか**（候補 (3)）: (a) 本 lane で warning を足す、(b) JAN の別名の runtime の lane で足す（推奨・既定）、(c) 足さない。推奨の理由: 初期投入は空の DB への新規の行だけで、上書きは導入の後の操作なので関門の 8 の条件に要らない。重複行の warning の表示と、50 行の外の warning の全件のまとめは UI-01c-D17（同じ lane）が作るので、同じ lane に置くと表示を 2 度作らずに済む。JAN を消すのは意図した契約（30 BIZ-01-D8 の上書きの段、§4.9.2 の「JAN を空にする変更」）なので止めずに知らせる形になる。(a) にすると本 lane に重複行の warning の表示（`ImportDuplicateRow.import_row.warnings` を画面に出す）と画面の test が増え、UI-01c-D17 の一部を先に作ることになる。答えで変わる所: (a) なら Scope の S1 に warning の文と判定、S2 に重複行の warning の表示、Matrix に 2 行、L3 に 1 項目、介入の見込みは変わらない。(b) なら JAN の別名の runtime の lane の backlog の項目に申し送る（closeout で Coordinator が足す）。
4. **13 桁で `00000` から始まる `JANコード` を止めるか**（候補 (4)。8 桁の JAN に 13 桁の Excel の形式を当てた値。EAN-8 と EAN-13 の重みが揃うのでチェックディジットが合い、F4 を通る。全部 0 の 13 桁〈`0000000000000`〉も合う）: (a) 行の error にする、(b) 止めない（推奨・既定、precondition-dependent）。推奨の理由: 8 桁の JAN の商品をレジが Z004 にどう書くかを確かめていない（[pos-tables](../db-design/pos-tables.md) の Z004 の JAN 正規化は「13 桁 JAN にならないコード〈8 桁独自コード + `EEEEEE` 等〉」を `invalid_jan` にする）。それが分かるまで、`00000` の 13 桁が誤りと言い切れない。手順書の流れ 1 の手順 4 の手作業の確かめは残る。8 桁の JAN をレジに載せるかを決める backlog の lane（「JAN の無い商品の店内コードと色ごとのバーコードの表」）で Z004 の形が分かったら見直す（BIZ-01-D10 の Revisit）。答えで変わる所: BIZ-01-D10 の表に 1 行、Matrix の T3 に 2 行、手順書の確かめの列（(a) なら外す）。
5. **プレビューに新規の行の原価 × 初期在庫の合計を出すか**（候補 (5)）: (a) 本 lane で出す、(b) 別の backlog の項目にする（推奨・既定）、(c) 出さない。推奨の理由: 黙って入る形の検査でなく、Excel の合計と比べる照合の道具で、正しい形の値（表示の桁で丸まった原価）を見つけるための別の機能。新しい集計の文言・桁の表示（1/100 円 × cm の単位の混在）の設計が要る。手順書の流れ 1 の手順 4 が今は全部の行で元の値と比べる。答えで変わる所: (a) なら BIZ の preview の返り値に field が増え（wire の変更、bindings の再生成）、Scope・Boundary・Matrix・L3 が増える。(b) なら closeout で backlog に 1 項目。

L3 を置くかは owner に問わない（発注の「L3 を省かず」と、`docs/DEV_WORKFLOW.md` Human Visual Confirmation の operator-facing の画面の変更）。エラー行の全件表示（UI-01c-D18）は起草役の設計判断（出所は backlog の項目の「全件出すかを決める」）で、owner の判断事項にしない（理由と却下は 60 UI-01c-D18）。

## Non-scope

- 上の owner の判断事項の 5 つの候補（既定のとき）。
- 既存の DB の行の JAN の形の直し（開発・試験 DB は作り直しで揃う。本番の DB は無い）。
- Z004 の取込み（BIZ-03）の JAN の扱い、手入力の商品登録の JAN の検査（51 UI-01b-D17、BIZ-01-D1 の create の文）、frontend の `jan-code.ts`。
- IO-03（`parse_product_csv`）の変更（[26](../function-design/26-io-product-csv-importer.md) §18.3 は変えない。形の検査は BIZ）。
- CSV のテンプレート、行の画面での編集、エラー行の一覧の file の書出し（60 §60.8）。
- `docs/backlog.md`・`docs/Plans.md` の更新（closeout）。

## Acceptance Criteria

- AC-1（preview の 3 つの形）: `cd src-tauri && cargo test --lib -- test_preview_import_req104_rejects_exponent_form_codes test_preview_import_req104_rejects_13_digit_code_without_jan test_preview_import_req104_validates_jan_shape_and_check_digit` の 3 本（Matrix の T1〜T3）が PASS。各 test はエラー行の `errors` を BIZ-01-D10 の文と完全一致で比べ、同じ CSV の正しい行が valid_rows に残ることを見る。
- AC-2（上書きの候補にも当たる）: `cd src-tauri && cargo test --lib test_preview_import_req104_shape_check_applies_to_overwrite_candidates`（T4）が PASS: 既存の 13 桁の数字の商品コードの商品に対し、`JANコード` が空の行とチェックディジットの合わない行はエラー行で `duplicate_rows` に無く、同じ JAN の行は `duplicate_rows` にある。
- AC-3（commit の再検証）: `cd src-tauri && cargo test --lib test_commit_import_req104_revalidates_code_shape_before_tx`（T5）が PASS: preview を通らない wire の行（F1〜F4 の各 1 行を、正しい新規の行の後に置く）で `ValidationFailed` の文が BIZ-01-D10 の文と一致し、`products` の行の数と `inventory_movements` の行の数が呼ぶ前と同じ。
- AC-4（通るもの）: `cd src-tauri && cargo test --lib test_preview_import_req104_keeps_accepted_code_forms`（T6）が PASS: BIZ-01-D10 の「通るもの」の各形（JAN が空の独自コード、13 桁の数字の商品コードと同じ JAN、13 桁の数字の商品コードと違う正しい JAN、`49123456`・`96385074`、先頭 2 の店内コード、同じ JAN の 2 行〈在庫連動 0〉、12 桁・14 桁の数字の商品コードで JAN が空）が valid_rows に入る。
- AC-5（置き換わった既存 test）: `cd src-tauri && cargo test --lib -- test_preview_import_req907_warns_and_disables_plu_target_without_13_digit_jan test_commit_import_req907_blank_plu_target_derives_for_new_and_preserves_overwrite test_should_default_plu_target_req907_preserves_invalid_check_digit_compatibility test_create_product_req101_rejects_invalid_jan_wire_with_exact_message test_create_product_req101_accepts_valid_jan_8_and_jan_13` が PASS（T7・T8 は S1 のとおり直し、ほかの 3 本は変えない）。`rg -n 'fn test_preview_import_req907_warns_and_disables_invalid_jan_plu_target' src-tauri/src` が出力なし（exit 1。baseline 2026-10-27 `50f97a76` は 1 行 `src-tauri/src/biz/product_service.rs:3978`）。
- AC-6（画面）: `npm test -- src/features/products/import/ProductImportPreview.test.tsx` が PASS し、T9（`UI-01c-D18`: エラー行 60 件の preview で、行の番号 61 の行と最後の行の文が表に出て「他 」で始まる段落が無く、表の上の 1 文が出る）を含む。`rg -c 'error_rows.slice\(0, MAX_VISIBLE_ROWS\)' src/features/products/import/ProductImportPreview.tsx` が出力なし（exit 1）。baseline（2026-10-27、`50f97a76`）: `rg -n 'error_rows.slice\(0, MAX_VISIBLE_ROWS\)' …` は 1 行（174 行）、`rg -c 'slice\(0, MAX_VISIBLE_ROWS\)' …` は `3`（完了時は `2`）。
- AC-7（正本の置き換え）: `rg -n 'preview_import / commit_import は検証を追加しない|import 経路・既存行は対象外|CSV/Z004 import 経路には' docs --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/decision-log.md'` が出力なし（exit 1）。baseline（`50f97a76`）: 30 に 1 件、master-tables に 2 件（`git show 50f97a76:<path> | rg -c …` の出力 `1`・`2`）。decision-log は D-140 の Compatibility が旧い句を引くので除く。`rg -c 'BIZ-01-D10' docs/function-design/30-biz-product-service.md` が `7`、`rg -c 'UI-01c-D18' docs/function-design/60-ui-product-import.md` が `5`（本 commit の時点の値。実装の run で正本を直したら数え直して PR に書く）。
- AC-8（感度）: Matrix の Mutation の M1〜M8 を production 側にだけ注入すると、それぞれの「red になる test」が red（`cd src-tauri && cargo test --lib -- <test 名>` が exit 101、T9 は `npm test -- src/features/products/import/ProductImportPreview.test.tsx` が exit 1）、戻すと green で `git diff --exit-code` が exit 0。結果は PR の Validation に書く（tracked に test の数を書かない）。
- AC-9（gate）: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test` が exit 0、`cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0（再生成の後）、`npm run typecheck && npm run lint && npm run format:check && npm test && npm run build` が exit 0。bindings は変わらない（`cd src-tauri && cargo run --bin generate_bindings` の後 `git diff --exit-code src/lib/bindings.ts` が exit 0）。L3 があるので `cd src-tauri && cargo check --release` が exit 0（Writer の完了条件）。
- AC-10（docs）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-27-product-csv-preview-check.md` が ERROR 0。
- AC-11（範囲）: `git diff --name-only origin/main...HEAD` が本 packet の Scope の予定 path 13 の内に収まる（#196 の merge の前に実装する場合は手順書を除く 12）。

## Design Readiness

設計の完了条件は `docs/DEV_WORKFLOW.md` Design Phase Rules の Design completion criteria。当たらない箇条は 1 行の理由で閉じる。

- 引用する設計正本（節まで）: [30](../function-design/30-biz-product-service.md) §4.8 の手順 4・§4.9 の手順 0 とエラーハンドリング・BIZ-01-D1・BIZ-01-D2・BIZ-01-D5・BIZ-01-D8（上書きの段の `plu_dirty` の項）・BIZ-01-D10（本 commit）・§4.9.2 の「JAN を空にする変更」・「計数の置き場と在庫の求め直しの契約」の共有 JAN の段（ADR SPEC-STK-CNT-D4）、[master-tables](../db-design/master-tables.md) の `jan_code` の列と「jan_code の形式 validation を DB に置かない理由」、[60](../function-design/60-ui-product-import.md) UI-01c-D5・D8・D16・D17・D18（本 commit）・§60.5・§60.6、[51](../function-design/51-ui-product-form.md) UI-01b-D17（変えない）、[26](../function-design/26-io-product-csv-importer.md) §18.3（変えない）、[pos-tables](../db-design/pos-tables.md) の Z004 の JAN 正規化、[decision-log](../decision-log.md) D-127・D-140（本 commit）。
- 必要な設計成果物: 「New or changed BIZ … validation, error」の行 = updated in this PR（30 BIZ-01-D10・§4.8・§4.9・BIZ-01-D1）。「operator workflow … empty/error/retry UI, Japanese wording」の行 = updated in this PR（60 UI-01c-D18・D16・§60.5・§60.6、SCREEN_DESIGN の 1 行、ui-task-specs の 1 文）。「CSV … import … compatibility rule」の行 = updated in this PR（受け入れる行の範囲は BIZ-01-D10、形式〈列・encoding〉は変えない。下の Boundary）。「Durable cross-cutting choice」の行 = updated in this PR（D-140。BIZ-01-D1 の 2026-08-11 の方針〈CSV は寛容〉を置き換えるため）。DB の行 = existing sufficient（DB・migration を変えず、master-tables の文だけを直した）。
- plan にしかない durable な判断の昇格先: 判定と文は BIZ-01-D10、画面は UI-01c-D18、方針の置き換えは D-140。owner の判断事項の 5 つの既定は D-140 の Guarantee range と BIZ-01-D10 の Revisit に置いた。
- 前提・制約と、延期した design gap の follow-up: owner の判断事項の (3) は JAN の別名の runtime の lane、(5) は別の backlog の項目へ（closeout で Coordinator が足す）。(1)・(4) は BIZ-01-D10 の Revisit。Excel の CSV の保存の振舞い（P1）は本 lane の判定の正しさに依らない（下の Contract Probe）。
- 絶対保証の自己点検: 「3 つの形の行は DB に入らない」の例外は、(i) 本 lane より前に入った行（D-140 の Guarantee range）、(ii) 復元・legacy の DB の取込み（file を差し替えるだけで取込みの判定を通らない。(i) と同じ扱い）、(iii) 手入力の登録（JAN は BIZ-01-D1 で同じ判定、商品コードは JAN か発番なので F1・F2 の形にならない）、(iv) 商品の修正（JAN を変えない。商品コードも変えない）。escape hatch は無い（preview と commit の両方が同じ関数を呼ぶ）。
- 判定: ready。判定・文・順・画面・wire の不変が正本にあり、Matrix は正本から導ける。#196 の merge の後の同期で手順書が base に入ってから plan-gate に出す（前文）。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| REQ / coverage の追加・変更・削除 | Rust の新しい test の名前に `req104` を付ける（T1〜T6）。T7 の改名（REQ-907 のまま）。frontend の T9 は test 名に `UI-01c-D18` と `REQ-104` を書く。`cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を再生成し、`-- --check` を AC-9 に含める |

ほかの行（Tauri command・function-design doc 新設・source doc 新設・route・operator 画面の新設）は該当なし（関数は private で `design_compliance_test.rs` の pub fn の照合に当たらない）。

## Impact Review Lenses

起点は初期投入の作業（在庫 Excel → CSV → 取込み）の調べで、CSV の取込みの互換の規則を変えるので当てる。

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 当たる: JAN の形の判定は core（BIZ の `biz::jan_code`）で、CASIO の adapter（`io/plu_formatter`）の検証は使わない（BIZ-01-D1 の方針のまま）。Excel の指数の形は外部の tool の表示の形だが、判定は core の「コードは数字の文字列」という契約の側に置く | BIZ-01-D10 |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 当たる: 事実 = Excel の「標準」の形式は 12 桁以上を指数で表示する（Microsoft の公式、P1）、Z004 は `jan_code` で引き当てる（pos-tables）。未確認 = Excel の CSV の保存が表示の形を書くか（#196 の P1）、8 桁の JAN の Z004 の形。決定 = 3 つの形を止める（D-140） | D-140、Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 当たる: preview は DB を変えない。エラー行を残した commit は正しい行だけを入れ、直した CSV の再取込みでは入った行が重複行（既定のスキップ）になる（Ordinary Operation の 4 行目）。commit の再検証は TX の前で、失敗は何も書かない | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 当たる: Excel で CSV を作る → 取込みの画面で名指された行を見る → Excel で直す → 「ファイルを選び直す」。直す場所（元の資料・文字列で入れる）を文が名指す | UI-01c-D18、手順書（S3） |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 当たらない: レジ・POS の adapter を変えない。CSV の作り手が Excel から別の tool に変わっても、判定はコードの文字列の形だけを見る | — |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 当たる: test と L3 の fixture は合成の値（BIZ-01-D1 の golden、合成の店内コード）だけ。店の在庫 Excel・CSV の値を repo に入れない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | 当たる（害の側）: 形の誤った JAN の商品は Z004 の売上が引き当たらず在庫が減らない。本 lane はその入口を閉じる。集計・記録の意味は変えない | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 当たる: Windows の native の FilePicker で CP932 の CSV を選んだときのエラー行の表示と取込みの結果（L3-1〜3）。Excel の保存の振舞いは本 lane の L3 にしない（#196 の流れ 2 の予行演習で見る） | Test Plan の L3 |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | 当たらない: 新しい依存・toolchain は無い（判定は標準 library の文字の走査） | — |

## Boundary / Wire Contract

商品 CSV（import の形式の互換）に当たる。列・encoding・型・command の形は変えず、受け入れる行の範囲だけが狭まる。

- producer: 利用者の CSV（Excel が保存した file。CP932 か BOM の UTF-8）→ IO-03 `parse_product_csv`（前後の空白を除いた文字列の field）
- consumer: BIZ `preview_import` の行の検証 → `ImportPreview`（wire）→ UI-01c の表。`commit_import` の手順 0
- wire type: `ImportErrorRow { line_no: number, raw_data: Record<string, string>, errors: string[] }`（`src/lib/bindings.ts`。変えない）。BIZ-01-D10 の文は `errors` の要素
- internal type: `String` の field（`商品コード`・`JANコード`）。判定は文字列のまま行い、数に変えない
- precision/range: 数への変換が無いので整数の範囲に当たらない。F2 は ASCII 数字ちょうど 13 個、F3・F4 は 8 個か 13 個（`biz::jan_code::validate` の byte 長）
- round-trip path: CSV の値 → preview のエラー行 → 画面の表（文に CSV の値を `'…'` で写す）。commit には届かない（UI はエラー行を送らない）
- invalid input: 3 つの形は行の error。全角の数字・空白を含む JAN は F3（IO-03 は前後の空白だけを除く。全角→半角の正規化は手入力の UI-01b-D16 だけ）
- compatibility: 今まで通った F1〜F4 の行は取り込めなくなる（D-140 の Compatibility）。既存の DB の行・Z004 の取込み・手入力の登録は変わらない。上書きの行は、既存の商品の JAN が正しくない形なら、その CSV の行で JAN を正しい値にしないと上書きできない（BIZ-01-D10 の範囲）

## Test Plan

Test Design Matrix: [2026-10-27-product-csv-preview-check](test-matrices/2026-10-27-product-csv-preview-check.md)

- targeted tests: Matrix の T1〜T6（Rust、`product_service.rs` の test module の preview・commit の test 群の中）、T9（frontend）。順は T1〜T6・T9 を書いて今の code で red を確かめてから、関数と表示を足す。
- negative tests: T1〜T3・T5（形ごとの error と文の完全一致）。T4（上書きの候補）。
- compatibility checks: T6（今通る形が通り続ける）、T7・T8（置き換わった部分だけを直す）、AC-5 の手入力の create の 2 本（変えない）、`biz::jan_code` の 3 本（変えない）。
- data safety checks: 合成の値（BIZ-01-D1 の golden、合成の店内コード）と `tempfile` の DB だけ。
- main wiring/integration checks: T1〜T6 は実の `parse_product_csv` を通る `preview_import` / `commit_import` を `init_database` の DB で呼ぶ（mock しない）。T9 は `ProductImportPreview` を wire の型の値で描く。

L3（Human Gate の `manual`、1 round）。fixture は Coordinator が合成の値で CP932 で作り、Ready の依頼と同時に渡す（`docs/DEV_WORKFLOW.md` Human Visual Confirmation の「取込み fixture は実 encoding にそろえる」）。DB は既存の開発・試験 DB でよい（fixture の商品コードは合成で既存の商品と重ならない値にする）。依存する既知の backlog は無い。

| # | 画面 / 到達手順 | 入力物 | 観測可能な合格基準 |
|---|---|---|---|
| L3-1 | 商品 → 一括インポート → 「ファイルを選ぶ」（native の dialog）で fixture A を選ぶ | fixture A（CP932、10 行: 正しい行 3〈13 桁の JAN の商品、8 桁の JAN `49123456` の独自コードの商品、JAN の無い独自コード〉と、指数の形の商品コード・指数の形の JAN・13 桁の数字の商品コードで JAN が空・7 桁の JAN・チェックディジットの合わない 13 桁の JAN・同じく 8 桁・12 桁の JAN の 7 行） | エラー行が 7 件で、各行に行の番号と BIZ-01-D10 の文（原因と直し方）が日本語で読める。表の上に「エラー行は取り込みません。…」の 1 文。新規登録候補が 3 件。色だけで区別していない |
| L3-2 | 同じ画面で「インポート実行」 | — | 結果が新規 3 件。商品の一覧で 3 件の商品が見え、エラー行の商品コードの商品は無い |
| L3-3 | 「別のCSVを取り込む」→ fixture B を選ぶ | fixture B（CP932、エラー行 60 行〈どれもチェックディジットの合わない JAN〉） | エラー行の表を下まで送ると、最後の行の番号（61）の行まで全件があり、「他 N 件」が出ない |

Writer の完了条件に `cd src-tauri && cargo check --release`（L3 の build の前）。Human Visual Confirmation For Screen Changes（`docs/DEV_WORKFLOW.md`）は上の L3 が兼ねる（画面: `/products/import`、主な経路: CSV を選ぶ → エラー行の確かめ → 取込み、見分ける状態: エラー行と新規登録候補、日本語の文: BIZ-01-D10 の 4 つと UI-01c-D18 の 1 文、Windows native L3: 要る）。

## Review Focus

- BIZ-01-D10 の F1〜F4 が、backlog の項目の AC の要旨（TD-421・TD-426）の 3 つの形と「通るもの」をちょうど覆うか。止めすぎ（共有 JAN、先頭 2 の店内コード、12・14 桁の数字の商品コード）と止め漏れ（上書きの候補）が無いか。
- 判定が 1 か所の関数で、preview と commit が同じものを呼ぶか。手入力の create と validator を共有し、文だけを分けているか（51 UI-01b-D17 の 2 文を変えていないか）。
- 行の検証が重複の分類と共有 JAN の検査より前にあるか（上書きの候補に当たる、当たった行は共有 JAN の error と 2 重に出ない）。
- T7・T8 の直しが、置き換わった契約の部分だけで、期待を弱めていないか（S1 の「契約が置き換わる既存 test」）。
- UI-01c-D18 がエラー行の表だけを全件にし、新規登録候補と重複行の 50 行の制限を残すか。
- owner の判断事項の既定（5 件とも本 lane で入れない）が Goal Invariant（関門の 8）を満たすのに足りるか。(4) の precondition（8 桁の JAN の Z004 の形）の書き方が事実と決定を分けているか。
- この変更で不要になる記述・条件・code は無いか（上の「この変更で不要になるもの」）。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| BIZ-01-D10 F1（指数の形、2 列） | 30 BIZ-01-D10 | S1 の関数、preview の行の検証 | T1、T5 | L3-1 |
| BIZ-01-D10 F2（13 桁の数字の商品コードで JAN が空） | 30 BIZ-01-D10 | 同じ | T2、T4、T5 | L3-1 |
| BIZ-01-D10 F3・F4（JAN の桁・文字とチェックディジット） | 30 BIZ-01-D10、BIZ-01-D1 の validator | 同じ（`biz::jan_code::validate` を呼ぶ） | T3、T4、T5 | L3-1・L3-3 |
| BIZ-01-D10 の「通るもの」 | 30 BIZ-01-D10 | 同じ | T6 | L3-1（正しい 3 行） |
| BIZ-01-D10 の errors の中の順と排他 | 30 BIZ-01-D10 | preview の行の検証の 2 か所 | T1（2 列の両方）、T2（F2 と F1 の排他） | — |
| §4.8 手順 4（重複の分類より前、上書きの候補にも当たる） | 30 §4.8 | preview の行の検証 | T4 | — |
| §4.9 手順 0（TX の前の再検証、DB を変えない、最初の行の最初の文） | 30 §4.9 | `commit_import` の冒頭 | T5 | 非対象（UI からは届かない） |
| BIZ-01-D5（商品コードの上限の再検証の順。形の再検証はその後） | 30 BIZ-01-D5 | 変えない（直後に足す） | 既存 `test_preview_import_req104_product_code_length_limit`・`test_commit_import_req104_rejects_overlong_product_code_without_writes`（`rg -n` で在ることを確かめた、2026-10-27） | — |
| BIZ-01-D1（手入力の create の JAN の判定と 2 文、適用の経路の置き換え） | 30 BIZ-01-D1 | create は変えない | `test_create_product_req101_rejects_invalid_jan_wire_with_exact_message`、`test_create_product_req101_accepts_valid_jan_8_and_jan_13`、`biz::jan_code` の `req101_*` 3 本 | — |
| BIZ-01-D2（`should_default_plu_target` のチェックディジットを見ない互換） | 30 BIZ-01-D2 | 変えない | `test_should_default_plu_target_req907_preserves_invalid_check_digit_compatibility`、T8 | — |
| §4.8 手順 4 の `PLU対象=1` の warning（13 桁でない JAN = 空か 8 桁） | 30 §4.8、60 UI-01c-D16 | 変えない（文・判定） | T7 | — |
| 共有 JAN の検査（SPEC-STK-CNT-D4。形の検査の後に当たる。adjacent-contract sweep で足した） | 30 の「計数の置き場と在庫の求め直しの契約」、ADR SPEC-STK-CNT-D4 | 変えない | 既存 `test_import_req104_shared_jan_row_error_both_directions_and_commit_recheck`（`rg -n 'fn test_.*shared_jan'` で在ることを確かめた、2026-10-27）、T6 の同じ JAN の 2 行 | — |
| BIZ-01-D8 の上書きの段（JAN を消す上書きは意図した契約。13 桁の数字の商品コードの商品だけ F2 で止まる） | 30 BIZ-01-D8、§4.9.2 | 変えない | T4（13 桁は止まる）、T6（独自コードの上書きで JAN が空の行は通る） | — |
| UI-01c-D18（エラー行の全件と 1 文） | 60 UI-01c-D18、§60.5、§60.6 | S2 | T9 | L3-1・L3-3 |
| UI-01c-D5（新規登録候補・重複行の 50 行の制限は残す） | 60 UI-01c-D5 | 変えない | 既存の `ProductImportPreview` の test（制限の test は無い。T9 が重複行の表の制限を変えないことは見ない。Review Focus で見る） | — |
| UI-01c-D8（エラー行があっても正しい行は取り込める） | 60 UI-01c-D8 | 変えない | `ProductImportPage.test.tsx` の「UI-01c-D8: エラー行だけの preview では commit を実行しない」ほか | L3-2 |
| UI-01c-D17（warning のまとめ、proposed・未実装） | 60 UI-01c-D17 | 変えない | — | 非対象（owner の判断事項 (2)・(3) の前提として引くだけ） |
| D-140 | decision-log D-140 | 上の全部 | 上の全部 | — |
| D-127（使い手に押しつけない・継ぎ足さない） | AGENTS.md、decision-log D-127 | UI-01c-D18、正本の置き換え | AC-7 | — |
| 26 §18.3（IO-03 は前後の空白を除くだけ） | 26 §18.3 | 変えない | 既存の IO-03 の test | 非対象 |
| 51 UI-01b-D16・D17（手入力の正規化と文） | 51 | 変えない | 既存 | 非対象 |

## Contract Audit（起票の時点の一巡）

新しく足す契約の文を境界の 4 観点で一巡した。

| 契約の文 | 安全な整数の範囲 | 0 の表示 | 失敗の時点と順序 | 単位や種類の混在 |
|---|---|---|---|---|
| F1（指数の形） | 数に変えないので範囲に当たらない（`4.9E+999` も文字列で止まる） | 値は `'…'` で写すので空は出ない（空は F1 に当たらない） | preview の行の検証の中、`商品コード` と `JANコード` の 2 か所。両方なら errors に 2 つ | `E`・`e` の両方、`+` だけ（`E-` は対象外。D-140 の Guarantee range）。小数点の無い `5E+12` も当たる |
| F2（13 桁で JAN が空） | 文字の数だけ | `0000000000000` の 13 桁の商品コードで JAN が空も当たる | `JANコード` を読んだ直後。F1 の `JANコード` と排他（JAN が空でないと F1 にならない） | ASCII 数字だけ（全角の 13 桁は当たらない。その行は商品コードとして今どおり通る）。12・14 桁は当たらない |
| F3・F4（JAN の判定） | validator の和は 12 × 9 × 3 = 324 以下で `u32` に収まる | `0000000000000`・`00000000` はチェックディジットが合い通る（owner の判断事項 (4) と同じ扱い。止めない） | F1 の `JANコード` に当たらないときだけ。F3 と F4 は排他（validator の返す 1 つ） | 8 桁と 13 桁で重みの偶奇が逆（BIZ-01-D1、validator が持つ）。全角・空白・記号は F3 |
| §4.9 手順 0 の再検証 | — | — | TX の前、BIZ-01-D5 の上限の後。valid_rows の順で最初の行の最初の文。DB を変えない | 新規の行と上書きの行を区別しない（両方に当てる） |
| UI-01c-D18 | 件数の表示は今の `toLocaleString()` のまま | エラー行が 0 なら card を出さない（今のまま） | preview の描画の時点だけ | 文は BIZ の文を ` / ` で結ぶだけで、種類で分けない |

## Contract Probe

- P1（外部、Excel）: 「Excel の『標準』の形式は 12 桁以上の数を指数で表示する」→ Microsoft support「Reset a number to the General format」と「Available number formats in Excel」の General の行で確かめた（2026-10-27）。「Excel が CSV の保存で表示の形（`4.90123E+12`）を書く」は確かめていない（開発用の PC に Excel が無い。#196 の P1、repo 外の回答台帳 TD-437）。本 lane の判定の正しさはこの前提に依らない: 指数の形の値が file にあれば止め、無ければ当たらない（正しい行を止めない）。実物の確かめは #196 の流れ 2 の予行演習で行う。
- P2（repo の中）: 「IO-03 は field の前後の空白を除くだけで、`E+` の値をそのまま渡す」→ `src-tauri/src/io/product_csv_importer.rs` の `field_map.insert(header.clone(), value.trim().to_string())` を実読（2026-10-27、`50f97a76`）。数への変換は BIZ の売価・原価・初期在庫の列だけ。
- P3（repo の中）: 「既存の import の test の fixture にチェックディジットの合わない JAN を使うのは T7・T8 だけ」→ Scope の S1 の末尾の script と `rg`（2026-10-27、`50f97a76`）。`12345678` は EAN-8 の重みで合わない（7 桁の和 = 1×3+2×1+3×3+4×1+5×3+6×1+7×3 = 60、期待のチェックディジット 0、実の 8）。

## Data Safety

- commit しない: 店の在庫 Excel・CSV・DB・backup、L3 の fixture を取り込んだ DB の写し。
- local だけ: L3 の fixture A・B（Coordinator が合成の値で作り、Ready の依頼で owner に渡す。repo に入れない）。
- 合成だけ: test の CSV は BIZ-01-D1 の golden（`4901234567887`・`49123456`・`96385074` ほか）と合成の店内コード（先頭 2）、`tempfile` の DB。

## Implementation Results

Fill after implementation.

## Review Response

先行 round の結果・評価（判定・件数・採否・reviewer の意見）はこの節にだけ書く。前半の節と遷移記録には「round N の是正（Review Response 参照）」だけを書く（独立 review は `## Review Response` より前だけを読む）。
