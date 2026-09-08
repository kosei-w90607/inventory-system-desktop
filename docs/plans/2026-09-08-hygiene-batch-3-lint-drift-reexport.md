# Plan Packet: 衛生 batch 3（lint 保守性 rule / command drift 検出 / re-export 増加禁止、⑯）

Backlog（`docs/Plans.md:152,155,167`、本 packet起票時点の行番号）記載の 3 件（eslint 保守性 rule 導入 / command drift detection 未導入 / architecture_test の re-export 洗浄検出強化）を、Coordinator 発注の read-only 監査 2 本（`.local/codex-orders/reports/10a-eslint-maintainability.md` / `.local/codex-orders/reports/10c-command-drift-and-reexport.md`、いずれも 2026-09-08、対象 HEAD `7c12dab`、tracked file 非変更）の実測結果を起票時実測として 1 lane にまとめる。3 件は互いに独立した file を編集し footprint は互いに素（S1 = `eslint.config.js` + `src/features/plu-export/PluExportPage.tsx` + `src/features/return-exchange/ReturnExchangePage.tsx` + `src/components/patterns/Pagination.tsx`、S2 = 新規 `scripts/check-command-drift.sh` + 新規 `scripts/tests/check-command-drift.test.sh` + `scripts/doc-consistency-check.sh`、S3 = `src-tauri/tests/architecture_test.rs` + `docs/decision-log.md` + `docs/architecture/cmd-task-specs.md`）。owner は 2026-09-08 に C′（re-export の狭い增分禁止）と eslint A 案を確認済み（本 packet の Fixed decisions）。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Codex（`model_reasoning_effort=medium`、S2/S3 の bash/Rust 実装は難所と Coordinator が判断した箇所で high へ昇格）
- Plan Reviewer: 独立 Opus 5（read-only claims-producer）+ 独立 Sonnet subagent（fresh context）
- Final Reviewer: Sonnet subagent（fresh context）1 パス + Opus 5（read-only claims-producer）1 パス = Double Audit（S1〜S3 とも）+ Codex ロジックレビュー、裁定は Fable
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: none（機械 gate のみ、L3 不要。UI/画面/operator workflow に非接触）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分（D-038 既定値、逸脱なし）
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票承認（本 packet の relay）。2 回目 = 予備（Plan Gate rally が天井に達した場合の disposition 承認）。3 回目 = 承認 + merge（Coordinator 代行）。L3 非対象のため owner 実働は起票承認と merge 承認のみ。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
3 件とも production runtime・DB・DTO・operator 画面に非接触だが、いずれも merge gate（enforcement surface）そのものを変更する: S1 は `npm run lint`（Verification Gates「Frontend」行）が直接実行する `eslint.config.js` に新規 block を追加する。S2 は `scripts/doc-consistency-check.sh`（Verification Gates「Docs/design」「Active plan packet」行、かつ `.github/workflows/ci.yml` の `Design doc consistency` job が直接実行する script）に新規 check を追加する。S3 は `src-tauri/tests/architecture_test.rs`（Verification Gates「Rust/backend」行の `cargo test` が実行する既存 layer-boundary test）に新規 test を追加する。DEV_WORKFLOW Risk Tiers の「uncertain between R2 and R3, choose R3 when the change touches ... a workflow gate」がそのまま適用される。**S1 も workflow gate 変更である**: ⑫（`docs/archive/plans/2026-09-06-hygiene-batch-2-config-reference.md:46`）は本 lane の S1 と全く同じ形（既存 block 無変更 + 新規 block 追加による `eslint.config.js` 変更）を「DEV_WORKFLOW Verification Gates『Frontend』行 `npm run lint` が直接実行する gate 定義そのもの」として R3 判定し、`docs/DEV_WORKFLOW.md:371`「Double audit: for R4 and workflow gate changes」を単独で適用した（同 packet `:241`）。よって本 lane の S1 も同型であり、Double Audit の対象外にする根拠はない。S1・S2・S3 のいずれも workflow gate 変更のため、Contract Audit 節の「Double audit: for R4 and workflow gate changes, run the Contract Audit twice in independent contexts」を 3 件全てに適用する。Final Reviewer は Sonnet subagent（fresh context）1 パス + Opus 5（read-only claims-producer）1 パスの Double Audit に Codex ロジックレビューを加えた 3 者体制とし（Workflow State 参照）、裁定は Fable が行う（Plan Review round 2 J1）。

## Goal

Goal Invariant:

### 最小完了条件

- S1: `eslint.config.js` の既存 block が全て無変更のまま、`complexity`/`max-depth`/`max-lines-per-function`/`max-params` の 4 rule を warn severity で持つ新規 block が `src/features/**/*.{ts,tsx}` + `src/components/patterns/**/*.{ts,tsx}`（test 除外）へ追加され、barrel block より前に置かれる。起票時実測で確認した 3 件の違反（`PluExportPage.tsx:188` complexity 69 / `ReturnExchangePage.tsx:185` max-lines-per-function 793 / `Pagination.tsx:33` max-params 5）が disposition どおりに是正・disable され、`npx eslint .` の当該 4 rule 警告が 0 件になる。
- S2: `scripts/check-command-drift.sh`（bash + `rg` のみ、Python 不使用）が command 宣言（D）・runtime handler（H）・Specta 登録（S）・bindings wire 名（T）の 4 集合の一致と重複無しを検査し、`scripts/doc-consistency-check.sh` の設計モード末尾から 1 箇所だけ呼ばれることで `scripts/local-ci.sh:193` / `scripts/pre-push.sh:217` / `.github/workflows/ci.yml` の `Design doc consistency` job（`:308-327`）の 3 経路すべてへ、それら 3 file を一切変更せずに到達する。
- S3: `src-tauri/tests/architecture_test.rs` に、`biz/**`・`mnt/**` からの `crate::db::*` / `crate::io::*` の直接 `pub use` / `pub(crate) use` 再公開を起票時実測の 30 symbol（17 statement）allow list に限定する新規 `#[test]` が追加され、allow list 外の新規直接再公開（`pub use crate::db::Row;` 等）を検出して fail する。

### 失敗定義

- S1: 新 block が既存 block の内容を 1 文字でも変更する、barrel block より後ろに挿入される、disposition 対象 3 件以外の場所で警告が残る、または disable した 2 件に Backlog 追跡先の記載がない。
- S2: checker が Python（または他の新規外部 interpreter）に依存する、または `local-ci.sh` / `pre-push.sh` / `ci.yml` のいずれかを直接編集する形でしか到達できない（= 二重呼出しまたは workflow 追加ステップになる）、または起票時実測の 5 mode self-test のいずれかが期待どおりの結果にならない、または gitignore 対象生成物混入で誤検出する（I-G1 型欠陥の新規混入）。
- S3: allow list 追加後も新規 `pub use crate::db::Row;`（negative fixture）を検出できない、または起票時実測の既存 30 symbol の正当な再公開を誤って violation 扱いする（既存 `layer_dependency_rules` test の非劣化を含む）。

### 非目的

- eslint B 案（全 `src/**` へ拡張、warn のまま）。段階 2 の error 昇格・`--max-warnings=0` 導入（10a 報告のとおり本 lane は phase 1 の warn 開始のみ、Backlog 参照）。
- `cargo-modules` / `cargo-deps` 等の外部 analyzer 導入（10c 報告: toolchain 版不一致・未導入、不採用）。Python 依存の追加。
- alias / type alias を介した re-export の完全洗浄検出（10c 報告の A 拡張、C′ とは別の設計判断として Backlog 残置）。
- 既存 30 symbol の re-export 削減・型所有の再設計。D-023（POS adapter boundary）自体の実装是正（10b 監査、別 lane）。
- `command drift` checker の cfg/feature/target 別到達性の完全保証（10c §2 の既知境界のまま — production 未登録の完全性は保証しない、本 lane は名前一致 drift の検出に限定）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-08、Coordinator 発注の read-only 監査 2 本より。監査自体は tracked file 非変更・子 agent 非使用・対象 HEAD `7c12dab`。本 packet 起草者が worktree `$TMPDIR/h3-draft`〈branch `agent/hygiene-batch-3`、origin/main `47f2163`〉で report 全文と repo 実体を rg/bat で突合）

### S1 実測（`.local/codex-orders/reports/10a-eslint-maintainability.md`）

- 対象 4 rule を A 案の閾値（`complexity=40` / `max-depth=3` / `max-lines-per-function={max:650,skipBlankLines:true,skipComments:true,IIFEs:true}` / `max-params=4`）で `src/features/**/*.{ts,tsx}` + `src/components/patterns/**/*.{ts,tsx}`（test 除外）へ適用した ESLint CLI 実測（§4・§5）: **違反 3 件 = complexity 1 + max-depth 0 + max-lines-per-function 1 + max-params 1**、false positive 0/3（全件実読）。B 案（全 src、閾値 20/3/150/4）は 81 件で test suite の describe 集計ノイズを含み本 lane では不採用（Non-scope）。
- 3 件の内訳と実害判定（§3 実読）:
  1. `src/features/plu-export/PluExportPage.tsx:188`（`PluExportPage`、`complexity` 実測 69、max 40）— 実害あり。「保存・未確認復帰・確認・snapshot 読込みの state と表示条件が混在。flow hook と状態 panel に分ける候補」（§3 item #1）。分割は複数責務にまたがる component 分解であり、本 lane の局所的・退屈な最短 diff（ponytail rung 7 の「動く最小 code」）には収まらない。
  2. `src/features/return-exchange/ReturnExchangePage.tsx:185`（`ReturnExchangePage`、`max-lines-per-function` 実測 793、max 650）— 実害あり。「画像保存・再送 key・返品方向変換・検索・結果表示を 793 行に集約。画像/明細/保存 flow の責務単位で分割候補」（§3 item #2）。同じ理由で本 lane の scope 外。
  3. `src/components/patterns/Pagination.tsx:33`（`rangeText`、`max-params` 実測 5、max 4）— 実害あり。「同じ number 型の 5 位置引数（totalCount/from/to/page/totalPages）で順序を取り違えやすい。読みやすい object 引数にする候補で A の params 警告を実害ありと判定」（§3 補足実読）。呼び出し元は同一 file 内の 2 箇所のみ（`rg -Fc 'rangeText(' src/components/patterns/Pagination.tsx` = 3、定義 1 + 呼出 2、他 file からの参照なし）。object 引数化は局所改修（関数シグネチャ + 呼出し 2 箇所のみ、約 15 行差分）で ponytail rung 7 の「動く最小 code」に収まるため本 lane で是正する。
- **disposition（Coordinator 裁定、owner eslint A 確認 2026-09-08 の一部）**: (1)(2) は `// eslint-disable-next-line <rule> -- <理由>` + Backlog 新規行で見送り、(3) は object 引数化で是正する。CLAUDE.md の「既存テストを削除・無効化しない」規律に抵触しないことを確認済み（disable はテスト規律ではなく lint rule の抑制であり、対象は非テストコード。既存 test（`Pagination.test.tsx` 等）は変更しない）。
- **既存 block 非破壊の実測**（§4・§5）: 新規 block の `files` は既存 1 個目 block（`eslint.config.js:79`、色 selector + 生 `<button>` selector）と完全に同じ `["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]` を再利用するが、rule 名（`complexity`/`max-depth`/`max-lines-per-function`/`max-params`）が既存 `no-restricted-syntax` と異なるため、ESLint flat config の rule merge（同一 `files` に一致する block 間で同一 rule id を完全置換する挙動、⑫ 起票時実測で確認済み）に抵触しない。10a 報告 §1・§7 は通常 450 file・barrel 2 path で既存 rule の実効設定を base config と一時 config で比較し差分 0 であることを確認済み。
- **glob 非重複の前提整理**（10a 報告 §4 末尾、owner 確認事項）: `rg -n "glob 非重複|glob非重複" docs` は `docs/Plans.md:152,154` の Backlog prose 2 件のみに一致し、`docs/DEV_WORKFLOW.md` / `eslint.config.js` のコメント / `docs/architecture/*.md` / `docs/design-system/*.md` / archived packet ⑫（`docs/archive/plans/2026-09-06-hygiene-batch-2-config-reference.md`）本文のいずれにも「glob 非重複」という文言は存在しない（archived packet ⑫ は「`files` が重複しない」という同義だが異なる表現を使う）。したがって「tracked canonical doc の文言を reword する」対象は存在せず、「archive のみ、変更不要」でもない第 3 のケース: 該当は本 lane が同一 commit で annotate する `docs/Plans.md:152,154` の Backlog prose 自体のみであり、正確な規則性（「同一 rule を複数 block で設定しない」）は本 packet の起票時実測で確定済みのため、追加の reword S item は不要と判定する。**この判定自体は Coordinator の裁定であり機械検査で確定した事実ではない**（Plan Review H12、Sonnet P3-1）: 新規 block（`files` は既存 `:79` block と完全に同じ `["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]`）と既存 block は `files` を共有するが rule id（`complexity`/`max-depth`/`max-lines-per-function`/`max-params` 対 `no-restricted-syntax`）が素であるため後勝ち全置換の対象にならない、という「同一 rule id が重複しなければ `files` の重複は安全」という読み方自体は Final Review で再確認すべき Coordinator 判断であり、本 packet の実測（10a §1・§7 の実効設定差分 0）はこの読み方を裏付けるが、ESLint 側の将来的な rule merge 仕様変更まで保証するものではない。
- 現行 `npm run lint`（`package.json:23` `eslint .`）に `--max-warnings` は無く、warn は CI を fail させない（10a 報告 §4）。本 lane は phase 1 の warn 開始のみとし、error 昇格・`--max-warnings=0` の導入は Backlog（Non-scope 参照）。

### S2 実測（`.local/codex-orders/reports/10c-command-drift-and-reexport.md`）

- **現状の drift**: command 宣言（D）・runtime handler（H、`generate_handler!`）・Specta 登録（S、`collect_commands!`）・bindings wire 名（T、`src/lib/bindings.ts`）は各 **68**、12 方向の差集合が全て 0、各集合内の重複も 0（§1）。checker 未導入のため、この整合は監視されずに保たれているだけである。
- **推奨案**: B（rg + shell、Python 不使用の bash 再実装 — 監査 prototype は Python 標準ライブラリだったが、本 lane は task 前提により bash + `rg` のみで同等ロジックを実装する）。A（cargo test 内 pure Rust）は Rust/TS 双方の簡易 parser を Rust で保守するコストが高く不採用（§2 比較表）。
- **prototype ロジック**（§2「推薦 B の prototype 全文」、bash 再実装時にアルゴリズムとして踏襲）: `rg` で `#[tauri::command(...)]... pub (async)? fn NAME` を D として収集、`lib.rs` 内の `generate_handler!\[...\]` ブロックを H、`collect_commands!\[...\]` ブロックを S として各 `cmd::module::name,` entry を抽出、`src/lib/bindings.ts` の `NAME: ... __TAURI_INVOKE("wire_name")` 対応を T として抽出。D/H/S/T 4 集合の 12 方向差集合 + 各集合内 multiplicity を検査し、非 0 なら diff 一覧を出力して exit 1。
- **I-G1 型欠陥の予防**: `rg` は既定で `.gitignore` を尊重する（git repository 配下限定）。監査の mutation test 5（§2「最小の mutation 検証」）は gitignore 対象生成物（`.gitignore` へ追記した合成 `.rs` file）を混入させても D の走査結果が不変であること（exit 0、baseline と同一）を確認済み — batch 1 の I-G1 欠陥（`fs::read_dir` の素の walk が gitignore を無視した構造的欠陥）と同型の欠陥を、`rg` を唯一の走査手段にすることで構造的に予防する。
- **mutation 検証済みの 5 mode**（§2、tracked tree 非変更・一時 clone 相当の fixture で実測）: baseline exit=0 / handler omission（`generate_handler!` から 1 entry 除去）exit=1 / handler duplicate（同 entry を重複追加）exit=1 / binding wire mismatch（`bindings.ts` の wire 文字列を差し替え）exit=1 / gitignored 生成物混入（結果不変）exit=0。全 5 assertion PASS（§2 出力）。
- **CI 到達境界の既存実読**（§2「既存 CI の実読結果」）: `.github/workflows/ci.yml` の `rust_drift` job は `rust || rust_drift || workflow` 変更時のみ実行され常時ではない。bindings drift check は `cargo run --bin generate_bindings` → `git diff --exit-code` のみで、command 集合そのものの独立 oracle は無い。H だけ登録漏れで S/T が整合した状態、H に余分な runtime 登録があって S/T が整合した状態は既存 CI では見逃す（§2「見逃す」）。
- **hook 位置の裁定**: `scripts/doc-consistency-check.sh` の設計モード（`TARGET_MODE="design"` 既定、`scripts/doc-consistency-check.sh:1983-2032`）は plan モード（`--target plan`）と異なり、`scripts/local-ci.sh:193`（`run_required docs "$REPO_ROOT" bash scripts/doc-consistency-check.sh`、classification 分岐の外で常時実行）、`scripts/pre-push.sh:217`、`.github/workflows/ci.yml:308-327`（job `docs` = 「Design doc consistency」、`needs.changes.result == 'success'` のみが条件で path filter 無し、全 PR で実行）の 3 経路すべてから引数無しで呼ばれることを実測確認済み（`rg -n "doc-consistency-check" scripts/pre-push.sh .github/workflows/ci.yml` = 2 件、`scripts/local-ci.sh:193`）。したがって新規 check を `doc-consistency-check.sh` の設計モード末尾（`check_new_wer_retired_rules` 呼出し `:2031` の直後、`fi` `:2032` の直前）へ 1 箇所追加するだけで、10c 報告 §2「gate 位置」列が推薦する「local-ci:193 と hosted docs job への到達、local-ci からの二重呼出しを避ける」を、`local-ci.sh` / `pre-push.sh` / `ci.yml` の**いずれも直接編集せずに**満たせる。plan モード（`--target plan`）はこの新規 check を呼ばない（Plan Packet 単体検査の対象外のまま）。**3 経路の enforcement 強度は同一ではない**（Plan Review round 2 J5）: `scripts/pre-push.sh:214` の `if [[ "$(classification_value docs)" == "true" ]]; then` は `:217` の `bash "$REPO_ROOT/scripts/doc-consistency-check.sh"` 呼出しを docs-classified diff の場合のみに限定するため、pre-push は無条件では到達しない。一方 `scripts/local-ci.sh:193` は classification 分岐の外で常時実行され、`.github/workflows/ci.yml:311`（`if: always() && needs.changes.result == 'success'`）も path filter 無しで全 PR トリガーに対して無条件に実行される。したがって pre-push が条件付きであっても、local-ci full と hosted CI の 2 経路が merge gate 到達性を無条件に担保する（設計変更なし、記述の精緻化のみ）。
- **classifier の扱い**: `scripts/doc-consistency-check.sh` 自体は既に `scripts/local-ci.sh:193` で classification に関係なく常時実行されるため、`scripts/ci/classify-changes.sh` の分類ルール変更は不要（10c 報告 §2「gate 位置」列の懸念どおり `rust_drift` 経由のルーティング補完は必要ない — docs job が既に全 PR で実行されるため）。

### S3 実測（`.local/codex-orders/reports/10c-command-drift-and-reexport.md` §3）

- **既存 test の境界**: `src-tauri/tests/architecture_test.rs`（現 172 行）は `LAYER_RULES`（db/biz/cmd/io の 4 層、`:35-52`）に対する `use crate::{layer}` の直接 import 行のみを検査し、`mnt/` は `LAYER_RULES` 自体の対象外（10c §3「現行 test と AMD2 の意味」）。`re-export` 経由の間接依存（`biz::Row` を import して `db::Row` を消費する等）は検出しない。
- **合成 fixture の実測**（10c §3「合成最小例と反例」、`rustc --crate-type lib` でコンパイル成功を確認済み）: `pub use crate::db::Row;`（direct）/ `use crate::db as storage; pub use storage::Row;`（alias）/ `pub type Row = crate::db::Row;`（type alias）の 3 fixture に対し、既存 `architecture_test` はいずれも **PASS（見逃し）**。監査が試作した A（use resolver）は direct/alias を検出（type alias は見逃し）、C（direct pub use 禁止）は direct のみ検出（alias/type alias は見逃し）。
- **A（全到達検出）は不採用**: cmd → biz/mnt 経由で到達する DB symbol は 41 箇所（10c §3「A の全到達候補」実測出力）あり、その大半（`PaginatedResult`・`ProductWithRelations` 等の DTO 共有）は D-060 が正本化した意図的な CMD-11 層経路である。全到達を禁止すると既存設計を破壊するため不採用。
- **C（direct pub use 全面禁止）も不採用、C′ を採用**: `biz/**`・`mnt/**` からの `crate::db::*` / `crate::io::*` の直接 `pub use` / `pub(crate) use`（`mnt/backup.rs:10` は `pub(crate) use`）は現状 **30 symbol / 17 statement**（10c §3「C の全禁止候補」実測出力、下記 allow list に転記）。全面禁止は既存 DTO 公開面（`biz/mod.rs` の CMD-02〜11 用 re-export）と AMD2 が承認した MNT no-create 経路（`mnt/backup.rs:10`）を破壊するため不採用。**C′**（起票時点の 30 symbol を allow list として凍結し、新規直接再公開の追加のみを禁止する）を採用する。
- **allow list（起票時実測、10c §3「C の全禁止候補」実測出力を転記）。assertion key = `(file, symbol, 再公開元 full path)` の 3 要素タプルであり、行番号（line）は key に含めない**（Plan Review H2、Opus P1-2/P2-2: 15/17 statement が `biz/mod.rs:19-46` の 1 file に集中しており、同 file 冒頭への `pub mod`/`use` 挿入だけで全 line がずれる。line を assertion key に含めると、実装内容が変わらない無関係な編集で merge gate が false FAIL する）。下表の「起票時 line」列は S3 実装時の探索補助コメントに過ぎず、比較ロジックには使わない:

  | file | symbol | 再公開元（assertion key の一部） | 起票時 line（comment only、実装時に再確認、assertion には使わない） |
  |---|---|---|---|
  | `src-tauri/src/biz/mod.rs` | `Department` | `crate::db::product_repo::Department` | `:19` |
  | `src-tauri/src/biz/mod.rs` | `Supplier` | `crate::db::product_repo::Supplier` | `:19` |
  | `src-tauri/src/biz/mod.rs` | `ProductBulkFilter` | `crate::db::product_repo::ProductBulkFilter` | `:21` |
  | `src-tauri/src/biz/mod.rs` | `ProductSearchQuery` | `crate::db::product_repo::ProductSearchQuery` | `:21` |
  | `src-tauri/src/biz/mod.rs` | `ProductWithRelations` | `crate::db::product_repo::ProductWithRelations` | `:21` |
  | `src-tauri/src/biz/mod.rs` | `CsvImport` | `crate::db::sales_repo::CsvImport` | `:23` |
  | `src-tauri/src/biz/mod.rs` | `LastStocktakeSummary` | `crate::db::stocktake_repo::LastStocktakeSummary` | `:25` |
  | `src-tauri/src/biz/mod.rs` | `Stocktake` | `crate::db::stocktake_repo::Stocktake` | `:25` |
  | `src-tauri/src/biz/mod.rs` | `StocktakeItemDetail` | `crate::db::stocktake_repo::StocktakeItemDetail` | `:25` |
  | `src-tauri/src/biz/mod.rs` | `StocktakeProgress` | `crate::db::stocktake_repo::StocktakeProgress` | `:25` |
  | `src-tauri/src/biz/mod.rs` | `AppSetting` | `crate::db::system_repo::AppSetting` | `:29` |
  | `src-tauri/src/biz/mod.rs` | `OperationLog` | `crate::db::system_repo::OperationLog` | `:29` |
  | `src-tauri/src/biz/mod.rs` | `DbConnection` | `crate::db::DbConnection` | `:31` |
  | `src-tauri/src/biz/mod.rs` | `DbError` | `crate::db::DbError` | `:33` |
  | `src-tauri/src/biz/mod.rs` | `PaginatedResult` | `crate::db::PaginatedResult` | `:35` |
  | `src-tauri/src/biz/mod.rs` | `DisposalRecordDetail` | `crate::db::disposal_repo::DisposalRecordDetail` | `:37` |
  | `src-tauri/src/biz/mod.rs` | `DisposalRecordSummary` | `crate::db::disposal_repo::DisposalRecordSummary` | `:37` |
  | `src-tauri/src/biz/mod.rs` | `InventoryRecordQuery` | `crate::db::disposal_repo::InventoryRecordQuery` | `:37` |
  | `src-tauri/src/biz/mod.rs` | `InventoryRecordSummary` | `crate::db::disposal_repo::InventoryRecordSummary` | `:37` |
  | `src-tauri/src/biz/mod.rs` | `ListQuery` | `crate::db::inventory_common::ListQuery` | `:40` |
  | `src-tauri/src/biz/mod.rs` | `ManualSaleRecordDetail` | `crate::db::manual_sale_repo::ManualSaleRecordDetail` | `:41` |
  | `src-tauri/src/biz/mod.rs` | `ReceivingRecordDetail` | `crate::db::receiving_repo::ReceivingRecordDetail` | `:42` |
  | `src-tauri/src/biz/mod.rs` | `ReceivingRecordWithSupplier` | `crate::db::receiving_repo::ReceivingRecordWithSupplier` | `:42` |
  | `src-tauri/src/biz/mod.rs` | `ReturnRecordDetail` | `crate::db::return_repo::ReturnRecordDetail` | `:43` |
  | `src-tauri/src/biz/mod.rs` | `ReturnRecordSummary` | `crate::db::return_repo::ReturnRecordSummary` | `:43` |
  | `src-tauri/src/biz/mod.rs` | `MovementQuery` | `crate::db::inventory_repo::MovementQuery` | `:45` |
  | `src-tauri/src/biz/mod.rs` | `MovementRecord` | `crate::db::inventory_repo::MovementRecord` | `:45` |
  | `src-tauri/src/biz/mod.rs` | `StockDetail` | `crate::db::product_repo::StockDetail` | `:46` |
  | `src-tauri/src/biz/product_service.rs` | `PriceHistoryEntry` | `crate::db::product_repo::PriceHistoryEntry` | `:17` |
  | `src-tauri/src/mnt/backup.rs` | `open_existing_database` | `crate::db::open_existing_database`（AMD2 承認済み MNT no-create 経路） | `:10` |

  合計 30 symbol / 17 statement（統計は `(file, 起票時 line)` の一意な組の数 = 17、行 = symbol 数 = 30。line は上記のとおり comment のみで assertion key ではない）。うち型のみは 29 symbol / 16 statement、残り 1 statement / 1 symbol（`mnt/backup.rs`）が関数。15/17 statement が `biz/mod.rs:19-46` に集中する。

- **Non-scope の明記**: alias（`use crate::db as storage; pub use storage::Row;`）・type alias（`pub type Row = crate::db::Row;`）を介した再公開の検出（A 拡張）は本 lane の対象外。C′ 採用は「直接 `pub use` の新規追加のみを止める」という狭い契約であり、洗浄全般を解決済み扱いにしない（10c §3「推薦 candidate C′」）。

## Scope

- **S1 eslint 保守性 rule 導入（A 案、既存 block 不変 + 新規 block 追加）**: `eslint.config.js:117`（⑫ が追加した block の閉じ `}`）と `:118`（barrel block のコメント）の間へ、以下の新規 block を挿入する（既存 block を 1 文字も変更しない）。

  ```js
  // 衛生 batch 3 S1: eslint 保守性 rule（complexity/max-depth/max-lines-per-function/max-params）。
  // phase 1 は features/ patterns/（test 除外）へ warn のみで導入し、既存 3 rule block とは
  // 異なる rule id のため files が既存 block（:79）と重複しても rule merge の完全置換に抵触しない
  // （10a 起票時実測 §1・§7 で実効設定差分 0 を確認）。閾値は既存負債を一度に押し付けない暫定開始値
  // であり、良い設計の目標値ではない（段階強化は Backlog）。
  {
    files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"],
    ignores: ["src/features/**/*.test.{ts,tsx}", "src/components/patterns/**/*.test.{ts,tsx}"],
    rules: {
      complexity: ["warn", 40],
      "max-depth": ["warn", 3],
      "max-lines-per-function": ["warn", { max: 650, skipBlankLines: true, skipComments: true, IIFEs: true }],
      "max-params": ["warn", 4],
    },
  },
  ```

  disposition 3 件を実施する:
  1. `src/features/plu-export/PluExportPage.tsx:188`（`export function PluExportPage` 宣言直前）に `// eslint-disable-next-line complexity -- 衛生 batch 3 起票時実測（10a §3 item #1）: 保存・未確認復帰・確認・snapshot 読込みの state/表示条件混在。flow hook / 状態 panel への分割は本 lane の scope 外、Backlog 参照` を追加する。
  2. `src/features/return-exchange/ReturnExchangePage.tsx:185`（`export function ReturnExchangePage` 宣言直前）に `// eslint-disable-next-line max-lines-per-function -- 衛生 batch 3 起票時実測（10a §3 item #2）: 画像保存・再送 key・返品方向変換・検索・結果表示が同居。画像/明細/保存 flow への分割は本 lane の scope 外、Backlog 参照` を追加する。
  3. `src/components/patterns/Pagination.tsx:33-44` の `rangeText(totalCount, from, to, page, totalPages)`（5 個の number 型位置引数）を単一の object 引数（`{ totalCount, from, to, page, totalPages }: { totalCount: number; from: number; to: number; page: number; totalPages: number }`）へ変更し、`:56`・`:103` の呼出し 2 箇所を `rangeText({ totalCount, from, to, page, totalPages })` へ更新する（挙動は完全に不変、既存 `Pagination` の test は無変更で pass する想定 — 引数の値と返り値は変わらない）。
  - `docs/Plans.md` へ Backlog 新規行 2 件（PluExportPage complexity 分割 / ReturnExchangePage max-lines 分割、それぞれ規模 M）を追加する。

- **S2 command drift 検出**: 新規 `scripts/check-command-drift.sh`（bash + `rg` のみ、Python を含む外部 interpreter を呼ばない）を作成する。ロジックは 10c 報告 §2 の prototype（Python）を bash へ移植する: `rg` で D（`#[tauri::command...] pub (async)? fn NAME`、`src-tauri/src` 配下）・H（`generate_handler!\[...\]` ブロック内の `cmd::module::name,` entry）・S（`collect_commands!\[...\]` ブロック内の同形 entry）・T（`src/lib/bindings.ts` の `NAME: ... __TAURI_INVOKE("wire_name")` 対応）の 4 集合を収集し、12 方向の差集合と各集合内 multiplicity が全て 0 であることを assert する。0 でなければ diff 一覧を stdout/stderr に出力して exit 1。既知の生成物・ignore path は `rg` の既定 gitignore 尊重に委ねる（I-G1 型の独自 fs walk を新設しない）。**`#[cfg(test)]` 内の `#[tauri::command]`（現状 0 件、`src-tauri/src/cmd/*.rs` はいずれも file 末尾に `#[cfg(test)]` module を 1 個持つが、その内側に `#[tauri::command]` を持つ既存例は無いことを起票時実測で確認済み）は D の収集対象から明示的に除外するルールを持つ（`architecture_test.rs` の `find_forbidden_imports` と同じ brace 深度追跡で `#[cfg(test)]` 領域を切り離してから D を収集する）。現状 0 件のため drift 検出結果に現時点の影響は無いが、将来 test 専用 command が追加された場合に H/S/T との比較で偽陽性 drift を出さないための明示ルールとして残す（Residual Test Gaps 参照）。
  - `scripts/doc-consistency-check.sh` の設計モード（`else` 分岐、`:1983-2032`）末尾、`check_new_wer_retired_rules`（`:2031`）の直後・`fi`（`:2032`）の直前に、新規関数 `check_command_registry_drift`（既存 `check_*` 関数の calling convention — `header`/`warn`/`error` helper、`$ERRORS`/`$WARNINGS` counter — を踏襲し `bash scripts/check-command-drift.sh` を呼び出して非 0 exit を `error` で報告）の定義と呼出しを追加する。plan モード（`if [ "$TARGET_MODE" = "plan" ]`、`:1925-1981`）には追加しない。`scripts/local-ci.sh` / `scripts/pre-push.sh` / `.github/workflows/ci.yml` は変更しない（起票時実測「S2 実測」の hook 位置の裁定を参照。3 file はいずれも既に `bash scripts/doc-consistency-check.sh` を引数無しで呼んでおり、設計モード経由で到達する）。
  - 新規 `scripts/tests/check-command-drift.test.sh`（`scripts/tests/doc-consistency-plan-packet.test.sh` の `mktemp -d` ベース fixture 構築パターンを踏襲）に、10c 報告 §2「最小の mutation 検証」の 5 mode（baseline PASS / handler 欠落 → exit 1 / 重複 → exit 1 / wire 不一致 → exit 1 / gitignored 生成物混入 → 結果不変 exit 0）を実装する。`COMMAND_AUDIT_ROOT` 相当の環境変数（または引数）で fixture ディレクトリを指定できるようにし、tracked tree を変更せずに実行できることを test 自体が保証する。
  - `scripts/local-ci.sh` の `workflow` classification 分岐（`:199-216`）に既存の shell test 群と同様、`run_required check-command-drift-tests "$REPO_ROOT" bash scripts/tests/check-command-drift.test.sh` を追加する。
  - `scripts/ci/classify-changes.sh:55` の `workflow` 判定 case pattern（`.github/workflows/*|...|scripts/doc-consistency-check.sh|scripts/check-env-safety.sh|scripts/check-workflow-git.sh)`）へ `scripts/check-command-drift.sh` を追加する（Plan Review H5: 現状のこの glob に `scripts/check-command-drift.sh` は含まれていない。`scripts/tests/*` は既にこの glob に含まれるため self-test file 自体の変更は拾われるが、checker 本体〈`scripts/check-command-drift.sh`〉のみを変更する PR は `workflow=false` に分類され、`local-ci.sh` の `workflow` classification 分岐にある `check-command-drift-tests` self-test が実行されない隙間が残る）。

- **S3 architecture_test re-export 増加禁止（C′）**: `src-tauri/tests/architecture_test.rs` に新規 const `DB_IO_REEXPORT_ALLOWLIST`（上記「S3 実測」の 30 symbol/17 statement、`(file, symbol, 再公開元 full path)` 3 要素タプルの配列 — **行番号は要素に含めない**、Plan Review H2 参照）と新規 `#[test] fn biz_mnt_direct_db_io_reexport_allowlist()` を追加する。既存 `collect_rs_files(dir: &Path)`（`:55`、既に任意 dir を引数に取る）を再利用して `src/biz` と `src/mnt` を走査し、各 `.rs` file 内の `pub use crate::db::...` / `pub(crate) use crate::db::...` / 同形の `crate::io::` 文（複数行の brace-grouped import を含む — `biz/mod.rs:25-27` の `Stocktake` 系グループが実例、既存 `find_forbidden_imports` の `#[cfg(test)]` brace 追跡パターンを踏襲して brace 深度で複数行を束ねる）を検出し、`(file, symbol, 再公開元 full path)` 単位で allow list と完全一致（追加・削除・出所すげ替えの全方向）することを assert する。不一致時は allow list の該当 entry（file + symbol、行番号は含めない）と実際の差分、D-083（decision-log）への参照を含む panic message を出す。
  - negative fixture: 既存 `architecture_test.rs` は fixture 機構を持たない（実 `src` tree を直接走査する）ため、batch 1 S1（`sweep_dir_for_tokens` の `tempfile::tempdir()` 型 test、`src-tauri/tests/import_internal_contract_test.rs`）の前例を踏襲し、新規 test 内で `tempfile::tempdir()` に `biz/mod.rs` 相当の synthetic file を作成して AC15 の 5 fixture（単純 `pub use` / `pub(crate) use` / grouped import 内 1 symbol混在 / コメント付き / 出所すげ替え）を書き込み、新規スキャン関数を直接呼び出して violation が検出されることを確認する（実 repo tree・allow list 本体には影響しない、独立した unit test）。同一 test 内で allow list に実在する symbol（例 `DbConnection`）を含む synthetic file も配置し、既存許可分は violation にならないことを対で確認する（空集合 oracle を避ける、batch 1 SC1/SC2 の設計を踏襲）。

- **S4 docs 同期（`decision-log.md` / `cmd-task-specs.md` は S3 実装 commit で追加する — plan-first commit には含めない。以下は Writer が S3 で追加する提案文言〈起草者 draft、Final Review で文言確認〉。次の空き番号は `rg -n "^## D-08" docs/decision-log.md | tail -3` で `D-082` が最終（`:670`）であることを起票時実測で確認済み、よって次は `D-083`）**:
  - `docs/decision-log.md` に、既存 `## D-08x` entry と同一 format（Decision / Status / Why / Impact / Alternatives considered / Revisit）で以下を追加する:

    ```
    ## D-083: biz/mnt からの DB/IO 直接 re-export を allow list で増加禁止（C′、衛生 batch 3）（2026-09-08）

    - Decision: `src-tauri/src/biz/**` と `src-tauri/src/mnt/**` からの `crate::db::*` / `crate::io::*` の直接 `pub use` / `pub(crate) use` 再公開を、起票時点の 30 symbol（17 statement）を allow list として凍結し、`src-tauri/tests/architecture_test.rs` の機械検査で新規追加（および allow list からの無断削除）を禁止する。alias 経由・type alias 経由の再公開の検出、および既存 30 symbol の削減・型所有の再設計は本 decision の対象外とする（別設計判断、`docs/Plans.md` Backlog 残置）。
    - Status: accepted
    - Why: 衛生 batch 3 起票時の read-only 監査（`.local/codex-orders/reports/10c-command-drift-and-reexport.md` §3）で、cmd → biz/mnt 経由の DB 型共有は D-060 が正本化した意図的設計（CMD-11 backup/restore 経路、CSV/inventory 系 DTO 共有）であり、全面禁止（監査の「C」案）は既存設計を破壊すると判明した。一方で無制限の増加は既存 `architecture_test.rs` の layer check（`use crate::db` の直接 import のみ検出、re-export 経由は対象外）をすり抜ける経路であり、drift の監視が皆無だった。allow list による増分 guard（監査の「C′」案）は、既存の意図的公開面を壊さず新規の無審査な再公開だけを止める最小 gate として選ばれた。
    - Impact: `src-tauri/tests/architecture_test.rs` に allow list 定数と新規 test を追加する（衛生 batch 3、Plan Packet `docs/plans/2026-09-08-hygiene-batch-3-lint-drift-reexport.md`）。`docs/architecture/cmd-task-specs.md:128` の検査境界記述を同期する。allow list への今後の追加は architecture_test.rs の const 編集で行い、無審査の追加を防ぐことが目的のため追加自体を禁止しない。
    - Alternatives considered: 全面禁止（監査の A「全 direct import 到達禁止」または C「全 pub use 禁止」）— 既存 30 symbol の設計（D-060 の CMD-11 経路、AMD2 の MNT no-create 経路）を破壊するため却下。alias/type alias まで含む完全洗浄検出（監査の A 拡張）— 別設計判断として非採用、`docs/Plans.md` Backlog 参照。`cargo-modules`/`cargo-deps` 等の外部 tool 導入 — toolchain 版不一致・未実測のため不採用（10c 報告 §3 参照）。
    - Revisit: alias/type alias 経由の再公開が実害を伴って発見された場合、または既存 30 symbol の削減・型所有の再設計が必要になった場合。
    ```

  - `docs/architecture/cmd-task-specs.md:128` の「検査対象は `use crate::db` / `use crate::io` の直接 import 行であり、re-export 経由の間接依存は対象外（検出強化は backlog）。」に続けて、以下 1 文を追記する:

    ```
    biz/mnt からの直接 `pub use` / `pub(crate) use crate::db::*` / `crate::io::*` 再公開は D-083 の allow list（`src-tauri/tests/architecture_test.rs`）で新規追加を禁止する。alias / type alias を介した再公開は対象外のまま（検出強化は backlog）。
    ```

  - `docs/quality/review-checklist.md` は変更しない（⑪/⑫ と同様、operator UI / runtime 契約に非接触のため既存 9 カテゴリのいずれにも該当しない）。
  - `docs/Plans.md`: Backlog 3 件（`:152,155,167`）へ「⑯ で起票」注記を追加し、⑬ の直後に ⑯ 行を追加する（plan-first commit に含める、Plans.md はダッシュボードであり実装対象ではないため）。新規 Backlog 行 2 件（PluExportPage / ReturnExchangePage の分割候補、S1 disposition 由来）を追加する（同様に plan-first commit）。
  - `docs/Plans.md` Backlog の D-023 POS adapter boundary entry の事実訂正（Plan Review H6、Coordinator 指示、Codex 監査 `.local/codex-orders/reports/10b-pos-adapter-boundary.md` 起源、gitignore 配下）: 旧記載「`sales_repo.rs` 37 箇所が最多」を、10b 監査（2026-09-08、read-only）の実測——該当 37 箇所は全件 `#[cfg(test)]` 内、production の CASIO 固有語漏出は実測 41 行 / 61 出現（IO 層は正当な置き場所として除外）——へ訂正し、推奨（B 初段: `io::casio` に literal 集約 + `ReportKind` 変換関数、trait/factory/registry は作らない）、owner 状況（現行レジのリース残り約 2 年、満了時に「こっちのアプリに合わせて探す」方針）、起票判断（衛生 batch 3 の次の Codex 実装 lane 候補、M・R3）を記録する。**この rewrite は記録のみであり、B 初段の実装自体は別 lane（本 packet の Scope・AC には含まない）**。plan-first commit に含める（Plans.md 編集のため）。

## Non-scope

- eslint B 案（全 `src/**` へ拡張）、error 昇格・`--max-warnings=0` 導入（Backlog、phase 2）。
- `cargo-modules` / `cargo-deps` 等の外部 analyzer 導入。Python への依存追加（S2 は bash + `rg` のみ）。
- alias / type alias を介した re-export の完全洗浄検出（A 拡張、Backlog 残置）。
- 既存 30 symbol の re-export 削減・型所有の再設計。D-023 adapter 実装そのもの（10b 監査対象、別 lane）。
- command drift checker の cfg/feature/target 別到達性の完全保証、macro 展開・cfg 評価（10c §2 の既知境界のまま）。
- `PluExportPage.tsx` / `ReturnExchangePage.tsx` の実際の分割実装（disable コメント + Backlog 記録のみ）。

## Acceptance Criteria

- AC1（S1、Plan Review round 2 J3 是正: 旧稿は barrel block `:118-139` を比較対象に含めておらず、新規 block を挿入しつつ barrel selector を壊す mutant が AC1/AC2 を素通りしていた）: `eslint.config.js` の既存 block = `:1-117`（⑫ 等）+ barrel block `:118-139`（⑪、22 行、⑫ が追加した block の直後 = ファイル末尾）の**両区間**が完全に無変更のまま残る — (a) `diff <(git show 47f2163:eslint.config.js | bat --plain --line-range 1:117) <(bat --plain --line-range 1:117 eslint.config.js)` が空（exit 0）、(b) `diff <(git show 47f2163:eslint.config.js | tail -n 22) <(tail -n 22 eslint.config.js)` が空（exit 0、barrel block 22 行分の逐語比較。base `47f2163` 時点の `eslint.config.js` は 139 行、barrel block は末尾 22 行と一致することを起票時実測で確認済み）。⑫ AC5 の逐語比較 oracle を踏襲、`rg -Fc` の出現数チェックは新規 block へ既存 glob を混入させても検出しないため不採用
- AC2（S1）: 新規 block が barrel block（`files: ["src/components/patterns/index.ts", "src/components/ui/index.ts"]`）より前に置かれる — `rg -n 'complexity: \["warn", 40\]' eslint.config.js`（新規 block 出現行）が `rg -n 'src/components/patterns/index.ts' eslint.config.js`（barrel block 出現行）より小さい
- AC3（S1、前提: `npm run generate:routes` 実行済み、Plan Review H9 是正: スカラー oracle を明記）: `npx eslint .` 全体の exit code だけでなく、対象 4 rule の警告件数そのものを数値で確認する — `npx eslint "src/features/**/*.{ts,tsx}" "src/components/patterns/**/*.{ts,tsx}" -f json | node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));const rules=new Set(['complexity','max-depth','max-lines-per-function','max-params']);let n=0;for(const f of d)for(const m of f.messages)if(rules.has(m.ruleId))n++;console.log(n);"` の出力が `0`（disposition 3 件を実施した状態、baseline 3）
- AC4（S1、Writer probe、正の発火確認、mutant）: 新規 block の `complexity` max を一時的に `1` へ下げて `npx eslint src/components/patterns/Pagination.tsx` を実行すると warning が 1 件以上出ることを確認してから元の `40` へ復元する（rule が実際に発火することの確認 — 警告 0 件が「rule が正しく機能して 0」なのか「glob 誤りで対象外のため常に 0」なのかを区別する。ponytail: 専用 fixture file は新設せず、実在する低複雑度関数への一時的閾値操作で足りる）
- AC5（S1）: `PluExportPage.tsx` / `ReturnExchangePage.tsx` に disable comment が exact 1 件ずつ存在する — `rg -Fc 'eslint-disable-next-line complexity --' src/features/plu-export/PluExportPage.tsx` = 1（baseline 0）、`rg -Fc 'eslint-disable-next-line max-lines-per-function --' src/features/return-exchange/ReturnExchangePage.tsx` = 1（baseline 0）
- AC6（S1）: `Pagination.tsx` の `rangeText` が object 引数化される — `rg -Fc 'function rangeText({' src/components/patterns/Pagination.tsx` = 1（baseline 0）、`rg -Fc 'rangeText(totalCount, from, to, page, totalPages)' src/components/patterns/Pagination.tsx` = 0（baseline 2、旧 5 位置引数呼出しが残らない）、既存 `Pagination` 関連 test が無変更で PASS
- AC7（S1、Plan Review round 2 J6 是正: 機械 oracle を明記）: `docs/Plans.md` Backlog に S1 disposition 由来の新規行 2 件（PluExportPage / ReturnExchangePage 分割候補）が存在する — `rg -Fc '`PluExportPage.tsx:188` の complexity 分割' docs/Plans.md` = 1（起票時実測 `docs/Plans.md:156`）、`rg -Fc '`ReturnExchangePage.tsx:185` の max-lines-per-function 分割' docs/Plans.md` = 1（起票時実測 `docs/Plans.md:157`）
- AC8（S2）: `scripts/check-command-drift.sh` が Python を含む外部 interpreter を呼ばない — `rg -c 'python3?\b' scripts/check-command-drift.sh` = 0
- AC9（S2）: 起票時実測の baseline（68/68/68/68、drift 0）で `bash scripts/check-command-drift.sh` が exit 0
- AC10（S2、Matrix 参照）: `bash scripts/tests/check-command-drift.test.sh` が 5 mode（baseline PASS / handler 欠落 fail / 重複 fail / wire 不一致 fail / gitignored 生成物混入 結果不変）を全て期待どおりに実行し exit 0
- AC11（S2、Plan Review H1 是正: 旧稿は Scope S2 の `local-ci.sh` self-test 登録行と矛盾していた）: hook 到達境界の非侵襲性を 2 点で確認する。(a) `scripts/pre-push.sh` と `.github/workflows/ci.yml` はいずれも無変更 — `git diff 47f2163 -- scripts/pre-push.sh .github/workflows/ci.yml` が空。(b) `scripts/local-ci.sh` は `workflow` classification 分岐（`:199-216`）内への self-test 登録 1 行の追加のみ — 追加はその `run_required check-command-drift-tests "$REPO_ROOT" bash scripts/tests/check-command-drift.test.sh` の 1 行に限られ、他の行は無変更。かつ checker 本体（`bash scripts/check-command-drift.sh`）への直接呼出しが `doc-consistency-check.sh` の設計モード以外に存在しない — `rg -Fc 'bash scripts/check-command-drift.sh' scripts/local-ci.sh scripts/pre-push.sh .github/workflows/ci.yml` = 0（起票時実測: baseline 0、`check-command-drift.sh` 未実装のため）
- AC12（S2、Plan Review H8 是正: `rg -Fc 'check-command-drift.sh'` は保守性 comment が script 名を書くだけで 2 になり脆弱）: `scripts/doc-consistency-check.sh` の設計モードから新規 check が 1 回だけ呼ばれる — 呼出し literal で検査する `rg -Fc 'bash scripts/check-command-drift.sh' scripts/doc-consistency-check.sh` = 1（起票時実測 baseline 0）。かつ plan モード分岐（現行 `:1925-1981`、実装後に行番号を再確認する必要がある場合は `check_new_wer_retired_rules` のプラン分岐側呼出し `:1976` を目印にする）にはこの呼出し literal が出現しない
- AC13（S2）: `bash scripts/doc-consistency-check.sh --target plan` は新規 check を実行しない（AC12 の分岐確認と対）
- AC14（S3）: `cargo test --test architecture_test` が既存 `layer_dependency_rules` + 新規 `biz_mnt_direct_db_io_reexport_allowlist` の両方で PASS（clean tree、allow list = 起票時実測どおり）
- AC15（S3、Writer probe、負例、Matrix SC-REX-1 参照、Plan Review H2/H4/H10 反映）: 以下の負例を `src-tauri/src/biz/mod.rs` への一時的な追加として個別に確認し、各回 `cargo test --test architecture_test biz_mnt_direct_db_io_reexport_allowlist` が FAIL することを確かめてから復元する（`git diff --quiet -- src-tauri/src/biz/mod.rs` で復元確認、10c 報告 `:697` の推奨〈`pub(crate)`、group/multiline、コメントも fixture 化〉に従う）:
  1. `pub use crate::db::Row;`（allow list 外、架空 symbol、単純 `pub use`）
  2. `pub(crate) use crate::db::Row2;`（allow list 外、`pub(crate) use` 形式 — allow list は `pub use`/`pub(crate) use` 双方を検出対象にすることの確認）
  3. `pub use crate::db::product_repo::{Department, Row3};`（既存 allow-listed symbol `Department` と架空 symbol `Row3` を同一 grouped import に混在させ、group 内の 1 symbol だけが未許可でも検出できることを確認 — 「出所すげ替え」変種の group 版）
  4. コメント付き（`// comment\npub use crate::db::Row4;` のような直前行コメントを伴う形）でも検出されることの確認
  5. **出所すげ替え**（Plan Review H2）: allow list 上に実在する symbol 名を、allow list に記載された再公開元とは異なる `crate::db::...` path から再公開する（例 `PaginatedResult` を `crate::db::PaginatedResult` ではなく合成の `crate::db::other_repo::PaginatedResult` から `pub use` する）— symbol 名の一致だけでなく再公開元 full path の一致も assertion key に含まれていることの確認（symbol 名のみを key にすると見逃す変種）
- AC16（S3）: 新規 test は allow list に実在する 30 symbol を violation として検出しない — `cargo test --test architecture_test biz_mnt_direct_db_io_reexport_allowlist` が exit 0（AC14 の PASS がこれを含む）
- AC17（S3）: `docs/decision-log.md` に `## D-083` が新設される — `rg -Fc '## D-083' docs/decision-log.md` = 1
- AC18（S3）: `docs/architecture/cmd-task-specs.md:128` 相当の記述に D-083 参照が追記される — `rg -Fc 'D-083' docs/architecture/cmd-task-specs.md` ≥ 1
- AC19（全体）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/check-workflow-git.sh` がいずれも exit 0（ERROR 0）
- AC20（全体）: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test` と `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build` がいずれも exit 0
- AC21（全体、Plan Review round 2 J6 是正: 機械 oracle を明記）: `docs/Plans.md` の Backlog 3 件（`:152,155,167`、行番号は起票時点）に「⑯ で起票」注記が付与され、⑬ の直後に ⑯ 行が追加される — `rg -Fc '⑯ で起票' docs/Plans.md` = 3（起票時実測 `docs/Plans.md:153,158,170`）、`rg -Fc -- '- [ ] ⑯ 衛生 batch 3' docs/Plans.md` = 1（起票時実測 `docs/Plans.md:132`、先頭 `-` が `rg` にフラグ解釈されないよう `--` を付ける）
- AC22（S2、Plan Review H5）: `scripts/ci/classify-changes.sh:55` の `workflow` 判定 case pattern に `scripts/check-command-drift.sh` が追加される — `rg -Fc 'scripts/check-command-drift.sh' scripts/ci/classify-changes.sh` = 1（起票時実測 baseline 0）
- AC23（S4、Plan Review H6、Plan Review round 2 J4 是正: `-F` literal 内の `\`/`\[`/`\(` は不要なエスケープで、旧稿の値は測定していなかった）: `docs/Plans.md` の D-023 Backlog entry が 10b 監査の事実訂正を反映する — `rg -Fc '全件 `#[cfg(test)]` 内と判明' docs/Plans.md` = 1（起票時実測 `docs/Plans.md:165`、本 packet の plan-first commit で既に 1、Coordinator 指示による先行編集）

## Design Sources

- Requirements / spec: 該当なし（REQ 非接触、developer tooling / lint config / merge gate script / architecture test のみ）
- Architecture: `docs/architecture/cmd-task-specs.md:128` を本 lane で同期する（既存記述の拡張、新設ではない）
- Function / command / DTO: 変更なし（S2 は既存 command 登録の drift 検出のみで新規 command を追加しない）
- DB: 変更なし
- Screen / UI: 変更なし
- Decision log / ADR: 新規 `D-083`（C′ の allow list guard を正本化）を本 lane で追加する。DEV_WORKFLOW.md「Risk Tiers」「Contract Audit (R3/R4)」の既存規定を適用する

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient |
| Command / DTO / generated binding / wire shape | なし（drift 検出のみ、新規 command なし） | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | `docs/decision-log.md` D-083（C′ の正本化） | updated in this PR |

## Registration / Generation Obligations

該当なし（route / command / doc 新設・REQ token 変更なし。S2 は既存 command 登録の drift 検出のみ。bindings / routes / traceability の生成物再生成は不要 — S2 の走査対象 `src/lib/bindings.ts` は tracked file であり、`src/routeTree.gen.ts` のような ignore-scripts 下の生成待ち file ではない）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | DEV_WORKFLOW.md Risk Tiers / Contract Audit (R3/R4) | なし（既決規定の適用） | S1: A 案採用（B 案は test suite ノイズで不採用、起票時実測「S1 実測」） | `eslint.config.js` / `PluExportPage.tsx` / `ReturnExchangePage.tsx` / `Pagination.tsx` | AC1-AC7 |
| — | 10c 報告 §2 | なし（本 lane の新規実装） | S2: B 案（bash+rg）採用、A 案（pure Rust）は保守コストで不採用、doc-consistency-check.sh 経由の hook で 3 file 非改変 | `scripts/check-command-drift.sh` / `scripts/doc-consistency-check.sh` | AC8-AC13, AC22 |
| — | 10c 報告 §3 | D-083（本 lane で新設） | S3: C′（allow list 増分禁止）採用、A（全到達禁止）と C（全面禁止）は既存設計破壊のため不採用 | `src-tauri/tests/architecture_test.rs` | AC14-AC16 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（本 packet の「起票時実測」節 + 引用 report 2 本が一次情報。3 件とも report の実測結果の機械的適用で新規設計判断は C′ の 1 点のみ、D-083 として正本化する）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: あり — C′（re-export allow list guard）を D-083 として `docs/decision-log.md` へ昇格する
- Assumptions and constraints: S1/S2/S3 は互いに独立した file を編集し footprint は互いに素
- Deferred design gaps, risk, and follow-up target: alias/type alias 洗浄（A 拡張）、eslint error 昇格、PluExportPage/ReturnExchangePage の分割は全て Backlog へ明示的に残置
- Test Design Matrix can cite design decision IDs or source doc sections: Test Design Matrix は各 Contract に AC 番号 + D-083/report 節番号を付す
- Absolute guarantee / escape hatch self-check completed: C′ は「直接 pub use の新規追加のみを禁止する」狭い契約であることを Scope/Non-scope/D-083 の Alternatives 全てで明示し、alias/type alias の抜け道を「解決済み」と主張しない（10c §3 の限界をそのまま継承・明記）

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — lint config / merge gate script / architecture test の内部ロジックのみ | — |
| Fact check / design decision split | 適用: 「起票時実測」節で 3 件とも report の実測結果を repo 実体（`rg`/`bat`）で突合済み。C′ は事実（30 symbol の現状）と設計判断（allow list で凍結する）を明示的に分離し D-083 へ | 「起票時実測」節、D-083 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | not applicable — operator 非接触 | — |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 非接触 | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | not applicable — L3 対象外（Human Gate: none） | — |
| 環境・再現性 | 適用: S2 は `rg` の既定 gitignore 尊重のみに依存し新規環境依存を持ち込まない。S3 の negative fixture は `tempfile::tempdir()`（既存 dev-dependency）を使い環境非依存 | AC10, AC15 |

## Design Readiness

- Existing design docs are sufficient because: 3 件とも report の実測結果 + DEV_WORKFLOW.md 既存規定の適用で、C′ の 1 点のみが新規設計判断であり D-083 として本 PR 内で昇格する
- Source docs updated in this PR: `docs/decision-log.md`（D-083 新設）、`docs/architecture/cmd-task-specs.md:128`（既存記述の拡張）
- Design gaps intentionally deferred: alias/type alias 洗浄（A 拡張）、eslint error 昇格、PluExportPage/ReturnExchangePage 分割
- Durable decisions discovered in this plan and promoted to source docs: D-083

Minimum design checks:

- Layer ownership: 非該当（lint config / merge gate script / architecture test のみ、UI/CMD/BIZ/IO/MNT の runtime 非接触。S3 は layer boundary **test** の拡張であり layer 定義自体は変更しない）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし（S2 は既存 command 登録の drift 検出のみ）
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 変更なし
- Error, empty, retry, and recovery behavior: 変更なし
- Testability and traceability IDs: REQ 非接触。S2/S3 は新規 test file 追加（`check-command-drift.test.sh`）+ 既存 test file 拡張（`architecture_test.rs`）のため traceability FE baseline は不変見込み（REQ/UI ID を持たない checker/architecture test のため T4 baseline カウント対象外）

## Contract Probe

- S1 の premise「新規 block は既存 `no-restricted-syntax` block と rule merge で衝突しない」→ 実験: 10a 報告 §1・§7 が通常 450 file・barrel 2 path で既存 rule の実効設定を base config と一時 config で比較し実施済み → 結果: 差分 0（既に検証済み、本 lane での再実験は不要）。
- S2 の premise「`rg` の既定 gitignore 尊重により生成物混入で誤検出しない」→ 実験: 10c 報告 §2「最小の mutation 検証」mode 5（gitignore 対象生成 `.rs` file を混入させ `git init` した fixture で走査）→ 結果: baseline と結果不変、exit 0（既に検証済み）。
- S2 の premise「bash + `rg` のみで Python prototype と同等のロジックを再実装できる」→ **未検証**。10c 報告の prototype は Python 実装であり、bash 再実装の等価性は本 lane の実装そのものが検証対象（Contract Probe として事前に切り出すと実装を二重に書くことになるため、AC9/AC10（baseline drift 0 の再現、5 mode self-test）を実装完了時の検証点として扱う。plan-gate 前の probe としては実施しない）。
- S3 の premise「`tempfile::tempdir()` ベースの synthetic fixture で allow list 違反を検出できる」→ 実験: 10c 報告 §3 の合成 fixture（`rustc --crate-type lib` でのコンパイル確認 + 既存 `architecture_test` を fixture 向けに再コンパイルして実行）で direct pub use パターンが検出可能であることを確認済み（10c §3「fixture 実行 script 全文」の `mode=C hits=1` 出力）→ 結果: 検出可能（既に検証済み、本 lane は同型ロジックを allow list 比較へ組み込む）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| eslint 保守性 rule 導入 A 案（S1） | `eslint.config.js` 新規 block | `npx eslint .`（AC3）+ 発火 probe（AC4）+ disable comment 検査（AC5）+ rangeText 契約 test（AC6） | non-scope（lint のみ） |
| command drift 検出（S2） | `scripts/check-command-drift.sh` / `scripts/doc-consistency-check.sh` | `scripts/tests/check-command-drift.test.sh` 5 mode（AC10）+ baseline exit code（AC9） | non-scope（bash/rg のみ） |
| DB/IO 直接 re-export 増加禁止 C′（D-083、S3） | `src-tauri/tests/architecture_test.rs` | `cargo test --test architecture_test`（AC14）+ negative fixture（AC15） | non-scope（cargo test のみ） |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-08-hygiene-batch-3-lint-drift-reexport.md](test-matrices/2026-09-08-hygiene-batch-3-lint-drift-reexport.md)

- targeted tests: `npx eslint .`（S1）/ `bash scripts/check-command-drift.sh` + `bash scripts/tests/check-command-drift.test.sh`（S2）/ `cargo test --test architecture_test`（S3）
- negative tests: AC4（S1 発火 probe）、AC10 の 4 fail mode（S2）、AC15（S3 negative fixture）
- compatibility checks: AC1（S1 既存 block 逐語比較）、AC11-AC13（S2 の hook 到達境界）、AC16（S3 既存 30 symbol 非誤検出）
- data safety checks: 該当なし（DB 非接触）
- main wiring/integration checks: AC19（`doc-consistency-check.sh --target plan` / `check-workflow-git.sh`）、AC20（既存 full gate）

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない。S2 は `src/lib/bindings.ts` を読み取り専用で走査するのみで書き換えない。

## Review Focus

- S1: 新規 block が既存 3 block（色/button 2 個 + barrel 1 個）を一切変更していないこと（AC1 の逐語比較）。disable comment 2 件が理由付きで exact 1 件ずつであること（AC5）。`rangeText` の object 引数化が既存呼出し全 2 箇所を漏れなく更新していること（AC6）。閾値 4 値が report の A 案どおり（40/3/650・skipBlankLines/skipComments/IIFEs/4）であること
- S2: `scripts/check-command-drift.sh` が Python を含む外部 interpreter を一切呼ばないこと（AC8）。`pre-push.sh` / `ci.yml` は無変更、`local-ci.sh` は self-test 登録の 1 行追加のみであること（AC11(a)(b)）。checker 本体への直接呼出しが `doc-consistency-check.sh` の設計モード以外に存在しないこと（AC11(b) の `rg -Fc` = 0、AC12-AC13）。5 mode self-test（AC10）が report 10c §2 の mutation と同型であること。`rg` の gitignore 既定尊重に依存し独自 fs walk を新設していないこと（I-G1 回帰の防止）。`scripts/ci/classify-changes.sh:55` の workflow glob に `scripts/check-command-drift.sh` が追加され、checker-only PR でも self-test が classify されること（AC22）
- S3: allow list が起票時実測の 30 symbol/17 statement と過不足なく一致すること（AC14, AC16）。multi-line brace-grouped `pub use`（`biz/mod.rs:25-27` 型）を正しく 1 statement・複数 symbol として解析していること。negative fixture（AC15）が実 repo tree を汚さず復元されること。D-083 の Alternatives 節が A/C 不採用の理由（既存設計破壊）を正しく反映していること
- S1・S2・S3 とも workflow gate change のため Contract Audit を独立 2 パス（Double Audit: Sonnet subagent〈fresh context〉1 パス + Opus 5〈read-only claims-producer〉1 パス、それぞれ diff と新規 test/fixture を独立に読む）+ Codex ロジックレビューの 3 者体制で実施し、裁定は Fable が行うこと（Workflow State の Final Reviewer 欄と同一体制、Plan Review round 2 J1）。S1 は⑫（`docs/archive/plans/2026-09-06-hygiene-batch-2-config-reference.md:46,:241`）と同型の `eslint.config.js` 変更のため単独でも Double Audit 対象（Plan Review round 1 H3、Risk 節参照）

## Spec Contract

Contract ID: SPEC-HYG3-LINT-1, SPEC-HYG3-LINT-2, SPEC-HYG3-CMD-1..5, SPEC-HYG3-REX-1..3

- SPEC-HYG3-LINT-1: 新規 eslint 保守性 block が既存 block を変更せず barrel block より前に追加され、disposition 後の当該 4 rule 警告が 0 件になる
- SPEC-HYG3-LINT-2: disposition 3 件（disable×2 + object 引数化×1）が理由付きで実施され、`rangeText` の挙動が不変であることを既存 test が保証する
- SPEC-HYG3-CMD-1: D/H/S/T の 4 集合と multiplicity が完全一致する（drift 0）
- SPEC-HYG3-CMD-2: checker が `local-ci.sh`/`pre-push.sh`/`ci.yml` を直接改変せず `doc-consistency-check.sh` 経由の 1 箇所 hook で 3 経路へ到達する
- SPEC-HYG3-CMD-3: 5 mode self-test が report と同型の mutation を再現する
- SPEC-HYG3-CMD-4: checker が Python 依存を持たない
- SPEC-HYG3-CMD-5（Plan Review round 2 J2）: `scripts/ci/classify-changes.sh:55` の `workflow` 判定 case pattern に `scripts/check-command-drift.sh` が含まれ、checker 本体のみを変更する PR でも self-test が classify される
- SPEC-HYG3-REX-1: allow list（30 symbol/17 statement、`pub use` / `pub(crate) use` 双方を対象）が新規直接再公開の追加・既存例外の無断削除の両方向で厳密一致検査される
- SPEC-HYG3-REX-2: negative fixture（`pub use crate::db::Row;`）が検出され、実 tree は汚染されない
- SPEC-HYG3-REX-3: alias/type alias の残存境界が Non-scope として明記され、洗浄完了を主張しない

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-HYG3-LINT-1 | S1 | `npx eslint .` | 既存 block 非破壊 + barrel 前挿入 | AC1-AC3 |
| SPEC-HYG3-LINT-2 | S1 | disable comment 検査 + `rangeText` 契約 test + 発火 probe | disposition 3 件の妥当性 | AC4-AC7 |
| SPEC-HYG3-CMD-1..4 | S2 | `check-command-drift.sh` + self-test 5 mode | Python 非依存 + hook 到達境界 | AC8-AC13 |
| SPEC-HYG3-CMD-5 | S2 | `rg -Fc` on `classify-changes.sh:55`（SC-CMD-5） | checker-only PR の classification 漏れ防止 | AC22 |
| SPEC-HYG3-REX-1..3 | S3 | `cargo test --test architecture_test` + negative fixture | allow list 厳密一致 + 残存境界の明記 | AC14-AC18 |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: S2 self-test の fixture は `mktemp -d` の一時ディレクトリのみを使用し repo tree を書き換えない。S3 negative fixture は `tempfile::tempdir()` の一時ディレクトリを使用し、`src-tauri/src/biz/mod.rs` への一時変更（AC15）は復元後 `git diff --quiet` で確認する

## Writer Instructions

- PR body の Reviewed Content HEAD は pending で置く（Final Reviewer が audit した content commit の SHA を後から state-only commit で埋める。Writer 自身は書き換えない）
- worktree: `npm ci --ignore-scripts` → `npm run generate:routes` 必須（S1 の `npx eslint .` は routeTree 不在だと無関係な lint error を出す、⑫ AC7 と同型の前提）
- `git add` は明示パスのみ（`git add -A`/`git add .` 禁止）。commit 前に `git status` / `git diff --cached --name-only` で意図した file のみが staged であることを確認する
- packet / `docs/plans/test-matrices/*` / `docs/Plans.md` は編集しない（本 packet と Backlog 注記は Coordinator/Plan Review が確定させる）
- eslint block は既存 block を 1 文字も変えない、新規 block を追加するだけ（AC1 の逐語比較で機械検査される）
- Python を使わない（S2 は bash + `rg` のみ。`awk`/`sed` 等の POSIX 標準ツールは可）
- commands 実行数と修正 round 数を PR body に記録する
- 実装原則（ponytail、full。以下を verbatim で PR body ないし commit message へ反映する）:

```
### 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- Maintainability review lens（owner 決定 2026-09-07、Backlog `docs/Plans.md:151`）: 命名 / 理由 comment / 退屈な構造 > 賢い圧縮。S2/S3 の checker ロジックは保守者が report 全文を読まずに読めるよう、各判定の意図を短い comment で残す
- S2 の具体的な適用: 既存 `check_*` 関数（例 `check_new_wer_retired_rules`、`:1419`）の calling convention（`header`/`warn`/`error`、`$WARNINGS`/`$ERRORS` counter）をそのまま踏襲し、新規の report 出力フォーマットを発明しない（ponytail rung 2）
- S3 の具体的な適用: `find_forbidden_imports`（`:74`）の `#[cfg(test)]` brace 深度追跡パターンをそのまま re-export 検出の multi-line grouping にも再利用する（新規 parser を書かない、ponytail rung 2）

## Implementation Results

未着手（Phase: plan-draft、Plan Commit pending）。

## Review Response

未着手。

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
