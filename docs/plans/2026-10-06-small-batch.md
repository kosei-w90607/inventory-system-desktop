# Plan Packet: 小口のまとめ（商品修正の操作ログ・docs の古い参照）

wave に属さない単独の lane。owner 2026-10-06 の決定で、`docs/backlog.md` の小口の 4 候補を 1 本の lane にした。並走は「日次売上に Z001 の表を出す」lane（branch `agent/z001-display`）。起票の時点で `agent/z001-display` は `origin/main` から commit が無く（`git log --oneline -3 agent/z001-display` の先頭が `13779ee4`）、file の重なりは未確認。本 lane は Scope の file だけを書き、`docs/backlog.md` は本 lane の項目の注記だけを書く。

## Workflow State

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（`subagent_type: writer`）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3）+ Codex（GPT-6.1 Sol 既定）。座組表（`docs/AGENT_OPERATING_MANUAL.md` `## 座組`）どおり
- Final Review Minimum: 1
- Human Gate: ready,merge
- Branch: agent/small-batch-1006

遷移の記録:

1. kickoff → spec-check（2026-10-06）: Scope を 4 候補から決め、Risk を R3 と記録した（下の Risk）。
2. spec-check → design（2026-10-06）: 候補 1 の設計正本 `docs/function-design/30-biz-product-service.md` §4.4 step 6 が「変更前後の値をJSON化」だけで、field・型・変更の判定が決まっていない。
3. design → plan-draft（2026-10-06）: 同じ plan-first の commit で §4.4 に BIZ-01-D7 を足した。Scope に未解決の設計の問いは無い。
4. plan-draft（owner の決定の反映、2026-10-06、起草役、本 commit）: 下の「owner の決定（2026-10-06）」を Scope・Non-scope・AC・Human Gate・Owner Effort Budget・Matrix と `docs/backlog.md` に反映した。Phase は plan-draft のまま。
5. plan-draft → plan-gate（2026-10-06、Coordinator、本 commit）: packet と Test Design Matrix は plan-first commit `8519d643` と owner の決定の反映 `bea1361e` で揃い、Coordinator の再実行で doc check（`--target plan`・full）は ERROR 0、`bash scripts/check-workflow-git.sh` は exit 0。Plan Reviewer の Codex は `.local/codex-orders/MODEL-SELECTION.md` の表の「上に当たらない R3 の初回 review」の行で Sol（high）。

## Owner Effort Budget

- 介入回数上限: 6（既定）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 6 | 2（2026-10-06 の 1 回の問い合わせで Q1・Q2 の 2 点を決めた） | 2（Ready 1、merge 1） | 2 | 6 = 2 + 2 + 2 |

## Risk

Risk: R3

Reason:
候補 1 は `operation_logs.detail_json`（DB に残る監査ログの JSON）の形を変え、操作ログ画面が読む。出力の形の変更なので、DEV_WORKFLOW Risk Tiers の「R2 と R3 で迷えば、stable contract・output schema に触れるときは R3」に当たる。backup の復元・破壊的な data lifecycle には触れない（新しすぎる backup の復元の文言は owner の決定で外した。下の「owner の決定（2026-10-06）」）。

`scripts/ci/classify-changes.sh` に予定の path を当てた出力（`printf '%s\n' <path...> | bash scripts/ci/classify-changes.sh --files-from-stdin`）:

Scope の path（`src-tauri/src/biz/product_service.rs` `docs/function-design/30-biz-product-service.md` `docs/function-design/90-traceability.md` `docs/TOOLING_SKILL_COMMANDS.md` `.codex/README.md` `docs/backlog.md` と本 packet・Matrix）:

```
rust=true
rust_drift=true
frontend=false
docs=true
env=false
generated=true
traceability=true
workflow=false
unknown=false
```

この変更でどれかの required gate の green / red が変わるか: 変わらない（workflow=false で gate の定義に触れず、要る job は rust・docs・generated・traceability の分類で回るだけ。`.codex/README.md` は `*.md` の docs に当たり、`.codex/bin/*` の full には当たらない〈`scripts/ci/classify-changes.sh:55`・`:67`〉）。

Final Review Minimum = 1（R3 で workflow=false。R4 か workflow gate のときだけ 2、DEV_WORKFLOW Workflow State）。Human Gate = `ready,merge`: Scope は画面の code を変えず、操作ログ画面は新しい key を既存の UI-11c-D6（74 §74.8「辞書未収載の key は key 文字列そのものをラベル代わりに使う」）どおりに出すだけなので、Human Visual Confirmation の「operator-facing screen を作る・大きく変える」に当たらない（owner の決定 Q1 = A で画面を変えない）。

## Goal

Goal Invariant:

### 最小完了条件

- 商品修正で売価・原価以外（商品名・部門・取引先・税率・メーカー品番・在庫連動・PLU 対象）を変えて保存すると、操作ログ画面の「商品修正」の行の詳細に、変えた項目の変更前と変更後が出る（owner の L3 所感 2026-09-10「更新したのに詳細情報なし」、`docs/backlog.md:93`）。
- `docs/TOOLING_SKILL_COMMANDS.md` の Rust の見出しが実在する参照先を指し、`.codex/README.md` の `## PR evidence helper` から撤去済みの mode の句が消える。

### 失敗定義

- 売価・原価以外だけを変えた商品修正の詳細が「詳細情報はありません」のまま。
- 商品名に `"` や `\` を含むと detail_json が壊れた JSON になり、詳細が「詳細情報を解析できませんでした」になる。
- 変えていない項目が詳細に並ぶ、または変更前と変更後が入れ違う。
- 商品修正の保存そのもの（price_history・plu_dirty・PLU の解放・rollback）の振舞いが変わる。

### 非目的

- 操作ログ画面の表示の作り替え（owner の決定 Q1 = A。「項目名 / 前 → 後」の一覧は次の design-first の lane、`docs/backlog.md` の「やると決めたもの」）。
- 既に DB にある商品修正のログの書き換え。
- `product_update` 以外の操作種別（例 `product_create`・`product_price_revise`）の detail_json。
- 新しすぎる backup の復元の失敗の文言（owner の決定 Q2 = 外す。`docs/backlog.md` に残す）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更（操作ログの data 契約）なので操作列を置く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 商品が登録済み | 商品修正の画面で商品名だけを変えて保存 | 保存が成功する（今と同じ）。画面は差分の field だけを送る（`src/features/products/lib/product-form-request.ts:155`〜`:169`） | 操作ログに「商品修正」の行が 1 行増える | なし |
| 上の保存の後 | 操作ログ画面で「商品修正」の行の「詳細を表示」を押す | 要約に `name` の行が出て、値が `{"new":"新しい名前","old":"前の名前"}`（key の順は serde_json の既定で、契約にしない）。画面は変えない（owner の決定 Q1 = A） | 変えた項目と前後の値が記録に残り、詳細で確かめられる | key の並びは Contract Probe P1 |
| 商品が登録済み | 売価だけを変えて保存 | 詳細に `selling_price` だけが出る（今は `cost_price` も前後同じ値で出る） | 価格の履歴（price_history）は今と同じく残る | なし |
| 商品が登録済み | 何も変えずに保存（画面は空の request を送る） | 詳細は「詳細情報はありません」（今と同じ） | — | なし |
| 商品名に `"` を含む商品 | 商品名を変えて保存し、詳細を開く | 要約に前後の名前が正しく出る | 「詳細情報を解析できませんでした」にならない | Contract Probe P1 |

## Scope

Scope（owner の決定〈2026-10-06〉を反映済み）:

1. 商品修正の操作ログの detail_json に、変えた全 field の変更前後を書く（候補 1、BIZ-01-D7）。
   - `src-tauri/src/biz/product_service.rs` の `update_product` の step 6（現物 `:392`〜`:406`、`detail` を `format!` で組む所）: `selling_changed || cost_changed` のときだけ価格 2 つを書く今の形を、BIZ-01-D7 の「変えた field ごとに `{"old","new"}`」へ替え、`serde_json` で組む。変えた field が無ければ `None`。step 1〜5・7 と `ProductUpdateRequest` / `ProductUpdateResult` の型は変えない。
   - 同じ file の tests module に Matrix の T1〜T4 を足す。既存の `test_update_product_req102_detail_json_recorded`（`:2421`）は消さず、弱めない。
   - `docs/function-design/90-traceability.md` を `cd src-tauri && cargo run --bin generate_traceability` で生成し直す（REQ-102 の test を足すため。Registration Obligations）。
2. `docs/TOOLING_SKILL_COMMANDS.md:44` の見出し「Rust / DB（`CLAUDE.md` で推奨）」を、実在する参照先（`docs/DEV_WORKFLOW.md` の `## Verification Gates` の Rust/backend の行）を指す見出しに直す（候補 3）。本文の command の列は変えない。
3. `.codex/README.md:246`（`## PR evidence helper`）から「github mode」と「legacyのstate-only/三点一致」の句を消し、helper の使い方（`python3 scripts/pr-gate.py status|capture|record|ready|merge --pr NUMBER`）・status が read-only・capture の置き場・record/Ready/merge は既存の明示承認の範囲だけ・helper は設定と権限を変えない、の内容は残す（候補 4）。同じ file の `:99`・`:132` の「legacy tmux bar」は別の話で触らない。
4. `docs/backlog.md` の候補の 4 項目（`:67`・`:68`・`:81`・`:93`）: 着手の注記と owner の決定は plan の commit で書いた。完了の注記は merge の後の closeout で書き、実装の commit では書かない。

呼出し側・読む側の全件（`rg` で数えた）:

| 対象 | 場所 | 本 lane での扱い |
|---|---|---|
| detail_json の producer（`"product_update"`） | `src-tauri/src/biz/product_service.rs:403` の 1 か所だけ（`rg -n '"product_update"' src-tauri/src`） | 変える |
| BIZ の `update_product` を呼ぶ所 | `src-tauri/src/cmd/product_cmd.rs:44`、test の `src-tauri/src/biz/plu_export_service.rs:1824`・`:1840`・`:1868`（tests module は `:879` から）、`src-tauri/src/biz/product_service.rs` の tests（`:2218`・`:2262`・`:2303`・`:2328`・`:2353`・`:2372`・`:2395`・`:2434`・`:2537`） | 呼び方と戻り値は変わらない。detail_json を読む test は `:2434` の `test_update_product_req102_detail_json_recorded` だけ（`rg -n "operation_type = 'product_update'" src-tauri/src` が `:2438` の 1 件） |
| detail_json を読む画面 | `src/features/operation-logs/OperationLogsPage.tsx` の `parseDetail`（`:76`）・`displayValue`（`:69`）・`KNOWN_KEYS`（`:45`）。商品修正に固有の分岐は無い | 変えない（owner の決定 Q1 = A） |
| 画面の test の fixture | `src/features/operation-logs/OperationLogsPage.test.tsx` は `product_update` を種別の一覧（`:525`・`:597`）にだけ使い、商品修正の detail_json の fixture は無い | 変えない |
| 型 | `OperationLog.detail_json` は文字列のまま（Tauri の DTO と `src/lib/bindings.ts` は変わらない） | 変えない |
| 設計正本 | `docs/function-design/30-biz-product-service.md` §4.4 step 6 と BIZ-01-D7（本 plan-first の commit で更新）、`docs/db-design/tracking-system-tables.md` §18（`:205`「商品修正なら変更前後のフィールド名・値」。既に合っている）、`docs/architecture/biz-task-specs.md:71`（「detail_jsonに変更前後」。既に合っている） | 30 だけ更新 |

### owner の決定（2026-10-06）

**Q1 = A: 操作ログ画面は変えない。本 lane は記録を残すところまで。**

- 画面は新しい key を UI-11c-D6（74 §74.8）どおり、key（例 `name`）と `{"new":…,"old":…}` の JSON の文字列で出す（`OperationLogsPage.tsx:69`〜`:74`・`:162`）。
- 「項目名 / 前 → 後」の一覧（部門・取引先は名前）は、owner の同意で次の design-first の小さな lane にする。`docs/backlog.md` の「やると決めたもの」に項目を足した（先例は `integrity_fix` の一覧の UI-11c-D14）。

**Q2 = 外す: 「保存と起動の守りの follow-up」の (2)（新しすぎる backup の復元の失敗を「新しい版のアプリが要る」と伝える）は backlog に残す。**

- 理由: 伝えるには restore の error kind か構造化した detail が要り（画面は kind で分け、文言の部分一致に頼らない契約、`docs/function-design/68-ui-backup-restore.md:129`）、Risk Tiers の R4「backup restore」に当たる。新しい版の backup を人が作る確認は DEV_WORKFLOW の L3 Eligibility の条件 (3)（manual fault-injection-grade procedure を要しないこと）を満たしにくい。
- 同じ項目の (1)・(3) は PR #118 で完了済み（`src-tauri/src/db/migration.rs:160`〜`:168` の手順の番号 1〜6 が `docs/function-design/22-mnt-migration.md` §3.2 の step 1〜6〈`:28`〜`:38`〉と一致、`generate_custom_code` の第 1 引数は `&rusqlite::Transaction<'_>`〈`src-tauri/src/biz/product_service.rs:156`〜`:157`〉）。backlog の項目は (1)・(3) を解消の書式にし、(2) を残した。

## Non-scope

- 操作ログ画面の変更（owner の決定 Q1 = A。「項目名 / 前 → 後」の一覧は backlog の次の design-first の lane）。
- 新しすぎる backup の復元の失敗の文言（owner の決定 Q2 = 外す）。
- 既に DB にある `product_update` のログの書き換え・移行。
- `product_create`・`product_price_revise`・`product_discontinue` ほか他の種別の detail_json。
- 部門・取引先の名前を detail に書くこと（BIZ-01-D7 で ID のまま）。
- `docs/TOOLING_SKILL_COMMANDS.md` の DEV_SETUP への吸収（監査 P12、`docs/backlog.md:61` の別項目）。
- `.codex/README.md` の他の節（`/home/kosei/Projects/` の path ほか）。

## Acceptance Criteria

- AC1（候補 1 の新しい振舞い）: `cd src-tauri && cargo test --lib test_update_product_req102_detail_json` が exit 0 で、Matrix の T1〜T4 の test 名と既存の `test_update_product_req102_detail_json_recorded` がすべて `... ok` で出る。T1〜T4 は実装の前に red（Matrix の「Would fail if」）。
- AC2（隣接の振舞いを保つ）: `cd src-tauri && cargo test --lib test_update_product_req102` が exit 0（price_history・plu_dirty・PLU 対象・rollback・validation の既存 test を含む）。
- AC3（Rust の gate）: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test` が exit 0。
- AC4（traceability）: `cd src-tauri && cargo run --bin generate_traceability -- --check` が exit 0 で `traceability check: OK（ERROR 0 件 / WARN 0 件）`。
- AC5（画面を変えない、owner の決定 Q1 = A）: `git diff --name-only origin/main...HEAD -- src/` の出力が空。
- AC6（候補 3）: ``rg -n 'CLAUDE.md` で推奨' docs/TOOLING_SKILL_COMMANDS.md`` が一致なし（exit 1）。新しい見出しが `rg -c 'DEV_WORKFLOW.md' docs/TOOLING_SKILL_COMMANDS.md` で 1 以上。
- AC7（候補 4）: `rg -n 'github mode|state-only|三点一致' .codex/README.md` が一致なし（exit 1）。`rg -c 'pr-gate.py status' .codex/README.md` が 1（helper の使い方を残す）。
- AC8（docs）: `bash scripts/doc-consistency-check.sh` が exit 0（ERROR 0）。

起票時実測（2026-10-06、branch の起点 = `origin/main`。D-038 により test の件数の行は貼らない）:

- AC1: `cd src-tauri && cargo test --lib test_update_product_req102_detail_json` → `exit=0`、出力の test 行は `test biz::product_service::tests::test_update_product_req102_detail_json_recorded ... ok` だけ（T1〜T4 はまだ無い）。
- AC2: `cd src-tauri && cargo test --lib test_update_product_req102` → `exit=0`、出た test 行はすべて `... ok`（`biz::product_service::tests` の名前は Contract Ledger と Matrix の既存の行のとおりで、`db::product_repo::tests::test_update_product_req102_*` も同じ filter に入る）。
- AC3: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test` → `exit=0`、`cargo test` の `test result:` の行はすべて `ok.`。
- AC4: `cd src-tauri && cargo run --bin generate_traceability -- --check` → `exit=0`、`traceability check: OK（ERROR 0 件 / WARN 0 件）`。
- AC5: `git diff --name-only origin/main...HEAD -- src/` → 出力なし（起点では差分が無い）。
- AC6: ``rg -n 'CLAUDE.md` で推奨' docs/TOOLING_SKILL_COMMANDS.md`` → ``44:### Rust / DB（`CLAUDE.md` で推奨）``（一致 1 行）。`rg -c 'DEV_WORKFLOW.md' docs/TOOLING_SKILL_COMMANDS.md` → 出力なし・exit 1。
- AC7: `rg -n 'github mode|state-only|三点一致' .codex/README.md` → `246:` の 1 行が一致。`rg -c 'pr-gate.py status' .codex/README.md` → `1`。
- AC8: `bash scripts/doc-consistency-check.sh` → `exit=0`、ERROR なし（WARN は T1〜T4 の未作成の test 名の PK3 だけ）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/function-design/30-biz-product-service.md` §4.4（step 6、PRODUCT-PATCH-D1、BIZ-01-D7）、`docs/function-design/74-ui-operation-logs.md` §74.8（UI-11c-D6 の既知 key 要約・未知 key の raw 表示・ネストした値の JSON 文字列化）と §74.19、`docs/db-design/tracking-system-tables.md` §18（`:201` detail_json は NULLABLE、`:205` 商品修正は変更前後のフィールド名・値）。
- 必要な設計成果物: 「New or changed BIZ … invariant」の行 = updated in this PR（30 §4.4 step 6 と BIZ-01-D7）。「JSON wire shape」の行 = updated in this PR（BIZ-01-D7 と本 packet の Boundary / Wire Contract。Tauri command と bindings は変わらない）。DB の表・列は変えない（existing sufficient: §18 が既に「変更前後のフィールド名・値」を持つ）。画面は existing sufficient（74 §74.8。owner の決定 Q1 = A で変えない）。
- plan にしかない durable な判断の昇格先: BIZ-01-D7（30 §4.4）。decision-log には足さない（商品修正の 1 関数の局所の判断で、横断しない）。
- 前提・制約と、延期した design gap の follow-up: 74 §74.19 の「商品修正等の変更前後フィールドの辞書化は実装時の棚卸し対象」は本 lane では閉じず、backlog の「操作ログ画面で商品修正の詳細を…」の design-first の lane が扱う。新しすぎる backup の復元の文言は backlog に残す（owner の決定 Q2）。
- 絶対保証の自己点検: 「変えた field が無ければ null」は、request のすべての field が None か更新前と同じ値のときだけ。clear 可能 field の null は、更新前が null なら変更なし、値があれば変更あり（PRODUCT-PATCH-D1 の missing と null の区別を `Option<Option<T>>` が保つ、30 §4.4 の部分更新 wire 契約）。「壊れた JSON を作らない」は serde_json で組むことに依る（Contract Probe P1）。
- 判定: ready（owner の決定〈2026-10-06〉を反映した Scope）。

## Registration / Generation Obligations

| 変更対象 | 登録・生成義務 |
|---|---|
| REQ / coverage の参照の増減（REQ-102 の test を足す） | `cd src-tauri && cargo run --bin generate_traceability` で `docs/function-design/90-traceability.md` を生成し直す（REQ-102 の行の test の件数が変わる）。Scope 1 と AC4 に含めた |
| Tauri command・route・画面の新設 | 該当なし（command・DTO・bindings・route を変えない） |
| function-design doc 新設 | 該当なし（30 の既存の節を更新） |

## Impact Review Lenses

not applicable: 現場の調査・実機の確認・外部 tool・POS 連携・CSV 形式から始まった変更ではない（owner の L3 所感が起点だが、対象はアプリ内の監査ログの形）。Reporting / accounting semantics は、操作ログが業務記録の代替でない契約（`docs/db-design/tracking-system-tables.md:206`）を変えないため当たらない。

## Boundary / Wire Contract

- producer: `src-tauri/src/biz/product_service.rs` の `update_product` step 6（`operation_type = "product_update"`）。
- consumer: `src/features/operation-logs/OperationLogsPage.tsx` の `Detail`（`parseDetail` → `Object.entries` → `KNOWN_KEYS[key] ?? key` と `displayValue`。値が object なら `JSON.stringify`）。他に読む所は無い（Scope の表）。
- wire type: `operation_logs.detail_json` は TEXT（JSON object の文字列）か NULL。command の DTO `OperationLog.detail_json` は文字列か null のまま。
- internal type: Rust では `serde_json::Value`（object）を組んで `to_string()`。各 field の値の型は BIZ-01-D7（文字列・整数・真偽値・null）。
- precision/range: 価格・ID は i64 を JSON の数で書く。画面は `JSON.parse` で読むので 2^53 を超える値は丸まる（今の売価・原価の形と同じで、本 lane で悪化しない。validation は 0 以上だけで上限を持たない〈`src-tauri/src/biz/product_service.rs:946`〜`:959`〉）。
- round-trip path: 商品修正の画面 → `update_product` command → BIZ → `operation_logs` → `list_operation_logs` → 操作ログ画面の `JSON.parse`。
- invalid input: 商品名・メーカー品番の `"`・`\`・改行は serde_json が escape する（Contract Probe P1）。BIZ の validation（`validate_update_request`、`:937`）を通らない request はログを書かない（今と同じ）。
- compatibility: この形より前の記録（`{"selling_price":{"old","new"},"cost_price":{"old","new"}}`）は同じ `{"old","new"}` の形の部分集合で、画面は区別せずに出す。古い記録を書き換えない。key の順は契約にしない（serde_json の既定は key の辞書順。app の依存は `preserve_order` を有効にしていない〈`cargo tree -e features -i serde_json` の serde_json の feature は default・std・alloc・raw_value・unbounded_depth〉）。

## Test Plan

Test Design Matrix: [test-matrices/2026-10-06-small-batch.md](test-matrices/2026-10-06-small-batch.md)

- targeted tests: Matrix の T1〜T4（`src-tauri/src/biz/product_service.rs` の tests module）と既存の `test_update_product_req102_detail_json_recorded`。
- negative tests: T3（値を持つが同じ field は書かない・全部同じなら NULL）、T4（`"`・`\` を含む名前）。
- compatibility checks: 既存の `test_update_product_req102_detail_json_recorded`（売価の前後）を残す。画面は変えず（owner の決定 Q1 = A）、既存の `OperationLogsPage.test.tsx` の「expands one row, labels known fields, and renders hostile JSON as text」（`:661`）が未知 key の raw 表示を守る。
- data safety checks: test の data は合成（`default_create_request` の「テスト商品」ほか）だけ。
- main wiring/integration checks: T1〜T4 は `init_database` の実 DB に `update_product` を通し、`operation_logs` の行を SQL で読む（mock を通さない）。

## Review Focus

- BIZ-01-D7 の「変えた」の判定が、clear 可能 field（`supplier_id`・`maker_code`）の missing / null / 値の 3 つで正しいか。
- 売価だけを変えたときに `cost_price` を書かなくなる変更（却下 (a) の裏）を、読む側・既存の test・owner の期待のどれも壊さないか。
- owner の決定（Q1 = A で画面を変えない）の下で、Human Gate に `manual` を足さない判定（Human Visual Confirmation）が成り立つか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| BIZ-01-D7（変えた field ごとに old/new） | 30 §4.4 BIZ-01-D7 | Scope 1 `update_product` step 6 | `test_update_product_req102_detail_json_non_price_fields`（T1） | — |
| BIZ-01-D7（clear 可能 field の null） | 30 §4.4 BIZ-01-D7・PRODUCT-PATCH-D1 | Scope 1 | `test_update_product_req102_detail_json_clearable_fields`（T2） | — |
| BIZ-01-D7（同じ値は書かない・無ければ NULL） | 30 §4.4 step 6・BIZ-01-D7 | Scope 1 | `test_update_product_req102_detail_json_unchanged_fields_omitted`（T3） | — |
| BIZ-01-D7（serde_json で組む） | 30 §4.4 BIZ-01-D7 | Scope 1 | `test_update_product_req102_detail_json_escapes_name`（T4） | — |
| 30 §4.4 step 6（売価の変更前後、REQ-102） | 30 §4.4 step 6 | Scope 1 | `test_update_product_req102_detail_json_recorded`（既存） | — |
| 30 §4.4 step 4・4b（price_history・plu_dirty・PLU の解放、隣接） | 30 §4.4 step 4・4b、BIZ-01-D3 | 変えない | `test_update_product_req102_price_change`・`test_update_product_req102_cost_only_no_plu_dirty`・`test_update_product_req102_sets_plu_dirty_when_plu_target_turns_on`（既存） | — |
| 30 §4.4 step 3・7（TX、隣接） | 30 §4.4 | 変えない | `test_update_product_req102_rollback_after_price_history`（既存） | — |
| UI-11c-D6（未知 key の raw 表示、読む側） | 74 §74.8 | 変えない（owner の決定 Q1 = A） | `OperationLogsPage.test.tsx:661` の「expands one row, labels known fields, and renders hostile JSON as text」（既存） | — |
| tracking-system-tables §18（detail_json NULLABLE・変更前後） | `docs/db-design/tracking-system-tables.md` §18 | 変えない（既に合っている） | T1・T3 | — |
| 候補 3（見出しの参照先） | `docs/backlog.md:67` | Scope 2 | AC6 の `rg` | — |
| 候補 4（撤去済みの mode の句） | `docs/backlog.md:68`、`docs/DEV_WORKFLOW.md:75`（legacy の撤去） | Scope 3 | AC7 の `rg` | — |
| 隣接で除外: `revise_product_price` の `product_price_revise` ログ | 30 §4.4.1 | 変えない（別の種別で、価格 4 値を持つ） | — | 非対象 |
| 隣接で除外: 新しすぎる backup の復元の文言（候補 2 の (2)） | 68 `:129`、71 `:233` | 変えない（owner の決定 Q2 = 外す、backlog に残す） | — | 非対象 |

## Contract Probe

- P1 serde_json が文字列の `"`・`\` を escape し、`None` を `null` にし、読み戻せる: `$TMPDIR` に serde_json 1（app の lockfile と同じ 1.0.149）だけの crate を作り、`{"name":{"old":"テスト商品","new":"A\"B\\C"},"supplier_id":{"old":3,"new":None}}` を `Value::Object` で組んで `to_string()` → `from_str` で読み戻した -> `{"name":{"new":"A\"B\\C","old":"テスト商品"},"supplier_id":{"new":null,"old":3}}` と `roundtrip ok`。key は辞書順に並んだ（順を契約にしない根拠）。
- P2 app の serde_json に `preserve_order` が入っていない: `cargo tree --manifest-path src-tauri/Cargo.toml -e features -i serde_json --offline` -> serde_json の feature は default・std・alloc・raw_value・unbounded_depth で、`preserve_order` は schemars の feature としてだけ出る。
- 画面が object の値を `JSON.stringify` で出すこと・未知 key を key のまま出すことは外部の前提でなく repo の現物（`OperationLogsPage.tsx:69`〜`:74`・`:162`）で確かめた。

## Data Safety

- 実 POS / 店舗データ・DB・backup・log を読まず、commit しない。
- test は `tempfile` の合成 DB と合成の商品（`default_create_request`）だけを使う。
- probe の crate は `$TMPDIR` に置き、repo に入れない。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
