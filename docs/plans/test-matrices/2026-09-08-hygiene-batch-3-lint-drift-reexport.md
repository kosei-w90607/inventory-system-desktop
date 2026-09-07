# Test Design Matrix: 衛生 batch 3（lint 保守性 rule / command drift 検出 / re-export 増加禁止、⑯）

Plan Packet: [../2026-09-08-hygiene-batch-3-lint-drift-reexport.md](../2026-09-08-hygiene-batch-3-lint-drift-reexport.md)

## Risk

R3（S2 が `scripts/doc-consistency-check.sh`〈local-ci.sh:193 / pre-push.sh:217 / ci.yml の Design doc consistency job が実行する merge gate script〉へ新規 check を追加し、S3 が `src-tauri/tests/architecture_test.rs`〈cargo test が実行する既存 layer-boundary test〉へ新規 test を追加する workflow gate change に該当するため、DEV_WORKFLOW Risk Tiers の uncertain-default 規則で R3 とする。S2/S3 は新規ロジックのため Contract Audit を Double Audit で実施する。S1 は⑫ 承認済み方式の反復で単独なら R1〜R2 相当。runtime・DB・DTO・operator 画面には非接触のため L3 は非対象）。

## Contracts Under Test

- SC-LINT-1（S1）: 新規 eslint block が既存 3 block（色 selector×2 + barrel×1）を無変更のまま維持し、barrel block より前に置かれる
- SC-LINT-2（S1）: 新規 block の 4 rule が実際に発火する（glob 誤りによる恒常的 0 件ではない）
- SC-LINT-3（S1）: disposition 3 件（disable×2 + object 引数化×1）が理由コメント付き・挙動不変で実施される
- SC-CMD-1（S2）: D/H/S/T 4 集合とその multiplicity が完全一致する（drift 0）
- SC-CMD-2（S2）: checker が `local-ci.sh`/`pre-push.sh`/`ci.yml` を直接改変せず、`doc-consistency-check.sh` の設計モード 1 箇所経由で 3 経路（local-ci:193 / pre-push:217 / CI docs job）へ到達する
- SC-CMD-3（S2）: checker が Python を含む外部 interpreter に依存しない
- SC-CMD-4（S2）: `rg` の既定 gitignore 尊重により生成物混入で誤検出しない（I-G1 型欠陥の非回帰）
- SC-REX-1（S3）: allow list（30 symbol/17 statement）に対する新規直接再公開の追加を検出する
- SC-REX-2（S3）: allow list に実在する 30 symbol（multi-line brace-grouped import を含む）を誤って violation 扱いしない
- SC-REX-3（S3）: allow list からの無断削除（既存 exception の消失）も検出する

## Failure Modes

- 新規 eslint block が既存 block の `files`/`ignores`/`rules` を書き換える、または barrel block より後ろに挿入され barrel 禁止が silently 消える（⑫ の「2 block 分離は誤り」と同型の regression）
- 新規 block の `files` glob が誤って対象外 directory を指し、警告が常に 0 件になる（rule が機能していないのに機能しているように見える）
- disable comment に理由が無い、または対象外の rule/site に付与される
- `rangeText` の object 引数化で呼出し順序や値が入れ替わる（既存 test が無変更で PASS することが唯一の回帰防止線）
- command drift checker が D/H/S/T いずれかの collection ロジックを誤り、実際の drift（handler 欠落・重複・wire 不一致）を見逃す
- checker が `local-ci.sh`/`pre-push.sh`/`ci.yml` を直接編集してしまい、二重呼出しまたは新規 workflow ステップになる（Hosted CI 到達性の設計意図から逸脱）
- checker が独自の fs walk を実装し gitignore を尊重せず、生成物混入で誤検出する（I-G1 の再発）
- architecture_test の allow list 比較が multi-line brace-grouped import（`biz/mod.rs:25-27` 型）を 1 symbol としてしか拾わず、グループ内の追加 symbol を見逃す
- allow list の統計方向が単方向（追加のみ検出、削除は無視）で、既存 exception が無断で消えても検出できない

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC-LINT-1 既存 block 非破壊（S1） | 新規 block が既存 block を書き換える / 挿入位置が逆 | regression（`eslint.config.js` 逐語比較） | AC1 の `diff <(git show 47f2163:eslint.config.js \| bat --plain --line-range 1:117) <(bat --plain --line-range 1:117 eslint.config.js)` + AC2 の行番号比較 | 既存 block の 1 文字でも変わる、または新規 block が barrel block より後ろにある |
| SC-LINT-2 rule 発火の正証明（S1） | glob 誤りで常時 0 件 | unit（Writer probe、負例、AC4） | 新規 block の `complexity` max を一時的に `1` へ下げて `Pagination.tsx` を lint → warning ≥1 を確認して復元 | 閾値を下げても warning が増えない（block が対象ファイルに効いていない） |
| SC-LINT-3 disposition の妥当性（S1） | disable 理由なし / `rangeText` の挙動変化 | unit（`rg` literal 検査 + 既存 test 回帰） | AC5（disable comment 存在）+ AC6（`rangeText` signature 変更 + 旧呼出し 0 件）+ 既存 `Pagination` test 無変更 PASS | disable comment が無い、または `rangeText` の呼出しで引数の値・順序が入れ替わり既存 test が壊れる |
| SC-CMD-1 D/H/S/T 一致（S2） | 実際の drift を見逃す | unit（`scripts/tests/check-command-drift.test.sh`、mutation） | `handler 欠落`（`generate_handler!` から 1 entry 除去）→ exit 1 / `重複`（同 entry 重複追加）→ exit 1 / `wire 不一致`（bindings.ts の wire 文字列差し替え）→ exit 1 | いずれかの mutant で exit 0 のまま（drift を検出できない） |
| SC-CMD-2 hook 到達境界の非侵襲性（S2） | 3 file を直接改変してしまう | regression（`git diff` 空検査） | AC11 の `git diff 47f2163 -- scripts/local-ci.sh scripts/pre-push.sh .github/workflows/ci.yml` が空 + AC12 の `doc-consistency-check.sh` 内 1 箇所 hook 確認 | 3 file のいずれかに差分が生じる、または hook 呼出しが 2 箇所以上／0 箇所になる |
| SC-CMD-3 Python 非依存（S2） | 外部 interpreter 依存の混入 | static（`rg` literal 検査） | AC8 の `rg -c 'python3?\b' scripts/check-command-drift.sh` = 0 | script 内に `python`/`python3` 呼出しが存在する |
| SC-CMD-4 gitignore 非回帰（S2） | 独自 fs walk で誤検出 | unit（`check-command-drift.test.sh` mode 5） | `gitignored 生成物混入` fixture（合成 `.rs` file を `.gitignore` 追記 + `git init` した一時 dir 内に配置）→ baseline と結果不変（exit 0） | gitignore 対象の合成生成物混入で結果が変わる（誤って D に計上される等） |
| SC-REX-1 新規直接再公開の検出（S3） | allow list 外の追加を見逃す | unit（`architecture_test.rs`、Writer probe、負例） | AC15: `biz/mod.rs` へ一時的に `pub use crate::db::Row;` 追加 → `biz_mnt_direct_db_io_reexport_allowlist` が FAIL、復元後 `git diff --quiet` で確認 | mutant 追加後も test が PASS する（allow list 比較が機能していない） |
| SC-REX-2 grouped import の正確な解析（S3） | multi-line brace group を見逃す/誤集計 | unit（`architecture_test.rs`、既存 30 symbol の再検証） | AC14/AC16: 既存 `biz/mod.rs:25-27`（`Stocktake`/`StocktakeItemDetail`/`StocktakeProgress`/`LastStocktakeSummary` の 4 symbol 1 statement）が violation にならず allow list どおり pass する | grouped import の 4 symbol のうち一部しか認識されず、残りが「未許可の新規再公開」として誤検出される、または全体が 1 symbol としてしか認識されない |
| SC-REX-3 allow list 双方向一致（S3） | 削除方向の非検出 | unit（`architecture_test.rs`、Writer probe、負例） | allow list 上の既存 1 entry（例 `PriceHistoryEntry`）を `src-tauri/src/biz/product_service.rs` から一時的に削除し、`biz_mnt_direct_db_io_reexport_allowlist` が FAIL する（allow list に存在するが実体が無い）ことを確認して復元 | entry 削除後も test が PASS する（allow list が stale なまま放置されうる、片方向 diff のみの実装） |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| `#[cfg(test)]` brace 深度追跡（`find_forbidden_imports`、`architecture_test.rs:74-132`） | `architecture_test.rs` 全文 | 新規 `biz_mnt_direct_db_io_reexport_allowlist` の multi-line `pub use { ... }` grouping 解析 | brace 深度の起点が `#[cfg(test)]` ではなく `pub use ... {` 開始であるため、既存関数をそのまま呼ぶのではなく同型のロジックを新規関数へ複製する（既存 `find_forbidden_imports` の契約〈禁止 module の import 検出〉自体は変更しない） | AC14, AC16, SC-REX-2 |
| `collect_rs_files(dir: &Path)`（任意 dir 引数、`architecture_test.rs:55`） | 既存 `layer_dependency_rules` の呼出し（`src/db`,`src/biz`,`src/cmd`,`src/io`） | 新規 test が `src/biz`・`src/mnt` を同じ helper で走査 | `mnt` は既存 `LAYER_RULES` の対象外だが `collect_rs_files` 自体は layer 非依存の汎用 helper なのでそのまま再利用可能 | AC14 |
| `mktemp -d` ベース fixture 構築（`doc-consistency-plan-packet.test.sh:101`） | 同 test file の `write_plans_md_linking` 系 fixture builder | `check-command-drift.test.sh` の 5 mode fixture | 対象データ形状が異なる（Plans.md セクションではなく Rust/TS ソース fixture）ため fixture 関数は流用せず、mktemp パターンのみ踏襲 | AC10 |
| `check_*` 関数の calling convention（`header`/`warn`/`error`、`doc-consistency-check.sh:28-65`） | `check_new_wer_retired_rules`（`:1419`）等、既存全 `check_*` 関数 | 新規 `check_command_registry_drift` | 外部 script（`check-command-drift.sh`）を呼ぶ点が既存 `check_*` と異なるが、報告フォーマット自体は既存 helper をそのまま使う | AC12 |

## Negative Paths

- missing input: `scripts/check-command-drift.sh` が `src-tauri/src` または `src/lib/bindings.ts` を欠く状態で実行された場合（worktree 破損）→ 明示的な non-zero exit + エラーメッセージ（unassert-based silent pass にしない）
- invalid input: `generate_handler!`/`collect_commands!` ブロック内に未対応構文（コメントのみの行、想定外のトークン）が混入した場合 → 10c 報告の prototype と同様、`unsupported` として明示 fail-closed（空集合扱いで通過させない）
- duplicate/ambiguous input: `generate_handler!` に同一 entry が重複登録される（SC-CMD-1 の mutation で確認済み）
- unknown reference: `bindings.ts` の wire 文字列が D/H/S のいずれにも存在しない架空値を指す場合 → 差集合として検出（SC-CMD-1）
- dependency missing: `rg` が PATH に無い環境 → checker 自体が non-zero exit で明示的に失敗する（silent pass にしない、Writer 実装時に確認）
- permission/write failure: 該当なし（S2/S3 とも読み取り専用スキャン、書込みは self-test/negative fixture の一時領域のみ）
- dry-run side effect: 該当なし（drift 検出・re-export 検出とも読み取り専用、修復動作を持たない）

## Compatibility Checks

- old schema/input: 既存 30 symbol の re-export（AC16）が新規 test で non-violation として扱われ続ける
- new schema/input: allow list への将来の追加（本 lane の範囲外）は const 編集で対応でき、checker ロジック自体の変更を要さない設計であることを Review Focus で確認する
- output order: 該当なし（両 checker とも順序に意味を持つ出力を持たない、diff 一覧は file:line でソート）
- optional field behavior: 該当なし
- 既存 eslint block 非破壊（AC1）— old schema/input に相当: `git show 47f2163:eslint.config.js` との逐語比較

## Data Safety Checks

- source-derived data: 該当なし
- generated outputs: `src/lib/bindings.ts` は読み取り専用でスキャンするのみ、書き換えない
- secrets: 該当なし
- local-only files: S2 self-test の fixture ディレクトリ（`mktemp -d`）、S3 negative fixture の `tempfile::tempdir()`
- synthetic sample boundaries: negative fixture の symbol 名（`Row`）は実 DB スキーマに存在しない架空名を使い、実 symbol との混同を避ける

## Main Wiring / Integration Checks

- helper connected to main path: `check_command_registry_drift` が `scripts/doc-consistency-check.sh` の設計モード実行パスから確実に呼ばれる（AC12）
- output reaches manifest/report: checker の non-zero exit が `doc-consistency-check.sh` の `$ERRORS` counter へ反映され、最終 `結果: ERROR N 件` サマリに現れる
- effective config reaches runtime: 該当なし（runtime config ではなく静的 lint/test）
- CLI arg reaches implementation: `--target plan` 指定時に新規 check が実行されないこと（AC13）

## Residual Test Gaps

- command drift checker は cfg/feature/target 別の command 到達性を検証しない（10c §2 既知境界、production 未登録の完全性は保証しない）
- re-export allow list は alias（`use crate::db as storage; pub use storage::Row;`）・type alias（`pub type Row = crate::db::Row;`）を検出しない（10c §3 既知境界、A 拡張は別設計判断）
- eslint 新規 block は phase 1 の warn のみで CI を fail させない（`--max-warnings` 未導入）。閾値を跨いだ新規違反が merge をブロックしない残余リスクは Backlog の phase 2 昇格まで残る
- command drift checker・re-export allow list ともに、cold/warm 実行時間の CI 実測値は未取得（10c 報告は host 単回 warm run のみ）。hosted CI での実行時間が local-ci の `run_required` timeout と衝突しないかは Final Review で確認する

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC-LINT-1..3 は `npx eslint .` + Writer probe + `rg` 逐語比較、SC-CMD-1..4 は `scripts/tests/check-command-drift.test.sh`（5 mode）+ `rg`/`git diff` の静的検査、SC-REX-1..3 は `cargo test --test architecture_test` + Writer probe（negative fixture 2 種）。AC19（`doc-consistency-check.sh --target plan` / `check-workflow-git.sh`）と AC20（既存 Rust/frontend フル gate）は Plan Packet 側の完了条件として記載済みで、本 Matrix には独立行を立てない。
