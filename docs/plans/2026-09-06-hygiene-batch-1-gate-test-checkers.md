# Plan Packet: 衛生 batch 1（gate / test checker 系、⑪）

Backlog（`docs/Plans.md:136,149,165`）記載の 3 件（I-G1 sweep test の gitignore 非尊重 / T10 source 文字列 test の formatter 脆弱性 / PK4 section 抽出の `###` 打ち切り）を機械的是正として 1 lane にまとめる。`docs/Plans.md:137`（STATECAP 検査の stacked train 継承除外）は Backlog 自身が「設計非自明のため将来判断」と記す通り、本 packet は候補案 2 つとトレードオフのみ提示し owner / Coordinator 判断待ちとして Scope から切り離す（詳細は「STATECAP 継承除外 — 判断保留」節）。

## Workflow State

- Phase: human-confirm
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: e67711e
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer、D-056）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer）+ Codex ロジックレビュー 1 回（Codex 枠切れ、2026-09-07 夜の週次リセット後に実施。§3.3 Capacity-degraded によりCodex成分は pending のまま Phase を前進させない）
- Reviewed Content HEAD: d364785
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: none（L3 対象なし。scripts / test checker のみで runtime・operator 画面に非接触）

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分（DEV_WORKFLOW 既定値、逸脱なし）
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票承認（本 packet の relay）。2 回目 = 予備（Plan Gate rally が天井に達した場合の disposition 承認）。3 回目 = 承認 + merge（Coordinator 代行）。L3 非対象のため owner 実働は起票承認と merge 承認のみ。

## Consultation Relay

§5.5を使わないchangeは両方`none`のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
3 件とも scripts / test checker のみを変更し runtime・DB・DTO・operator 画面に非接触なため、単独なら R1（I-G1 sweep test 是正、T10 test oracle 是正）または R2 相当。しかし S3（PK4 の `### Wave Registry` 打ち切り是正）は `scripts/doc-consistency-check.sh` の Plan Gate 判定ロジック（`extract_markdown_section` の呼び出し切替）を変更するため、DEV_WORKFLOW Risk Tiers の「uncertain between R2 and R3, choose R3 when the change touches ... a workflow gate」に該当する。Contract Audit 節の「Double audit: for R4 and workflow gate changes, run the Contract Audit twice in independent contexts」も適用対象になるため、パケット全体を R3 として扱い、S3 のみ Final Review で Double Audit（独立 2 パス）を実施する。S1/S2 は単独なら R1 相当（Review Focus で明記）。

## Goal

Goal Invariant:

### 最小完了条件

- S1: `src-tauri/tests/import_internal_contract_test.rs` の `sweep_dir_for_tokens` が、swept root（`src-tauri/src` / `src-tauri/tests` / `src`）配下に実際に出現しうる既知の gitignore 対象生成物 2 件（rustfmt backup `*.rs.bk` file、`src/routeTree.gen.ts` 型の生成 file）を走査対象から除外し、それらの内部に禁止 token があっても偽陽性 fail しない。
- S2: `src/hooks/useUnsavedChangesWarning.test.tsx` の T10 test（`DSR-20 D-E T10`）が、`UnsavedChangesDialog.tsx` の空白・改行のみの整形変更（formatter 由来）では fail せず、`onEscapeKeyDown` ハンドラの `event.preventDefault()` 呼び出しが消えた場合には fail する。
- S3: `scripts/doc-consistency-check.sh` の PK4 が、`docs/Plans.md` の `## 次の行動` 節内の `### Wave Registry` などの `###` 小見出し配下に置かれた active packet link を検出できる。

### 失敗定義

- S1: 修正後も `*.rs.bk` / `routeTree.gen.ts` のいずれかの内部 token が sweep 対象に残る、または既存の active surface（`src-tauri/src` 等の tracked file、`src/lib/bindings.ts` を含む）への走査が誤って除外される（既存 defect 検出力の劣化）。
- S2: 修正後も formatter 由来の空白変更で T10 が fail する、または `event.preventDefault()` 除去を検出できなくなる（検出力の劣化）。
- S3: 修正後も `### Wave Registry` 配下の link が検出されない、または他の `extract_markdown_section` 呼び出し元（Trace Matrix / Acceptance Criteria / Test Plan 等）の抽出範囲が意図せず変わる。

### 非目的

- STATECAP 検査の stacked train 継承除外（`docs/Plans.md:137`）: 下記「STATECAP 継承除外 — 判断保留」節の通り Scope 外。
- `.gitignore` の汎用パーサ導入（`ignore` crate 等の新規依存追加）: 既知かつ swept root から到達可能な 2 パターンのみを明示 skip する最小対応に留める（下記 S1 参照、ponytail: 汎用パーサへの upgrade は swept root 配下に未知の gitignore パターンが実際に出現した時点で判断。汎用 walker が到達できない `target`/`mutants.out*` は skip 対象にしない — production が到達しない挙動を assert しない）。
- `useUnsavedChangesWarning.test.tsx` の他 test（DOM 挙動系 6 件）への変更。T10 のみが対象。
- `doc-consistency-check.sh` の他の PK チェック（PK1〜PK3, PK5〜PK7）や `extract_markdown_section` の一般契約の変更。呼び出し元の切替のみ。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-06、worktree `/tmp/claude-1000/hyg1`、origin/main `07302b5` 起点。すべて本 packet 起草者が rg/bat/eza で確認）

- **S1 現状確認**: `sweep_dir_for_tokens`（`import_internal_contract_test.rs:252-276`）は `fs::read_dir` による素の再帰 walk で `.gitignore` を一切参照しない。skip-list は無し（`rg -Fc '"target"' src-tauri/tests/import_internal_contract_test.rs` = 0 件 exit 1 で確認）。実害の有無を確認するため現worktree（`npm ci` 未実行の fresh checkout）で走査対象 3 root を実査: `src/routeTree.gen.ts` は不在（`eza` で確認、`os error 2`）、`src-tauri/target` / `target` も不在。つまり backlog 記載どおり「現時点 hit 0」は本 worktree でも再現するが、コードの構造的欠陥（gitignore 非参照）自体は今も解消されていない（PR #80 是正 `980a211` 以降の pure Rust walk 化はこの欠陥を temporariy に許容したまま）。呼び出し元は 1 箇所（`test_active_sales_import_vocabulary_sweep_i_g1`、`:278-300`）のみ
- **S1 到達可能性の再実測（Plan Review round 1 P2 是正）**: swept root は `["src-tauri/src", "src-tauri/tests", "src"]` の 3 つのみ（`import_internal_contract_test.rs:291`）。`target`（cargo が書くのは `src-tauri/target`）と `mutants.out*`（cargo-mutants が書くのは `src-tauri/mutants.out*`）はいずれも swept root の**外**にしか生成されず、`fd -I -H -t d '^(target|mutants\.out.*)$' src src-tauri/src src-tauri/tests` = 0 件で到達不能を実測確認した。したがって skip 対象はこの 2 パターンを含めない。実際に swept root 配下に到達しうるのは `src/routeTree.gen.ts` 型の生成 file（`.gitignore:33`、`src/` 直下）と `**/*.rs.bk`（`.gitignore:7`、rustfmt backup は `src-tauri/src` / `src-tauri/tests` 配下の `.rs` file 隣接に生成されうる）の 2 パターンのみ（ponytail: production の walker が到達しない挙動は assert しない）
- **S2 現状確認**: T10（`useUnsavedChangesWarning.test.tsx:154-159`）は `readFileSync` + 2 箇所の `toContain` 完全一致。対象箇所の現況（`UnsavedChangesDialog.tsx:22-24`）は `onEscapeKeyDown={(event) => {` / `event.preventDefault();` / `}}` の 3 行構成で test の期待と一致（現状 PASS）。この test の直前 6 個の `it` は RTL 経由で Escape キー押下時に dialog が閉じない・`reset`/`proceed` が呼ばれないことを検証済み（`:130-152`）。preventDefault が失われれば Radix の既定動作で dialog が閉じるため、直前の behavior test（`:133`「DSR-20 D-E T10: Escape と外側 pointer-down では閉じず callback も発火しない」、`expect(dialog).toBeInTheDocument()`）が既に regression の挙動面を検出できる。T10（`:154`）の string check は挙動を保証しない — 保証するのは兄弟 test `:133` の側であり、T10 は `onEscapeKeyDown` prop と `preventDefault()` 呼び出しが同じ handler 内で隣接していることのみを担保する。正規化後の単一 `toContain`（2 文字列を 1 個の連結文字列にする、下記 S2 参照）は、現行の独立した 2 個の `toContain`（file 内のどこか離れた場所にそれぞれの文字列が存在すれば偶然 PASS しうる）より厳密な検査になる。T10 は削除せず oracle のみ formatter 非依存化する
- **S3 現状確認**: `extract_markdown_section`（`doc-consistency-check.sh:829-837`）の終了条件 `in_section && $0 ~ "^#{2,}[[:space:]]+"` は `##`/`###`/`####` を区別せず、`次の行動` セクション内に現れる最初の `###` 見出しで打ち切る。`docs/Plans.md` に対して実行し確認（本 packet 自身の commit 後の HEAD、行数は今後の Plans.md 編集で再びずれうる実測時点の値）: 打ち切り版は 58 行、`^## 次の行動` から次の `^## ` まで手動抽出した完全な節は 72 行（`### Wave Registry` を含む）。同じ file に既に `extract_markdown_h2_section`（`:841-849`）が定義済みで、終了条件が `^##[[:space:]]+`（level 2 のみ）に限定されているため `###` では打ち切らない。`rg -Fc 'extract_markdown_section' scripts/doc-consistency-check.sh` = 8（定義 `:829` + comment `:994` + 実際の呼び出し 6 箇所〈`:1015,1035,1056,1286,1348,1366`〉）、`rg -Fc 'extract_markdown_h2_section' scripts/doc-consistency-check.sh` = 4（定義 `:841` + 呼び出し 3 箇所〈`:1241,1397,1438`〉）。本 lane が置き換える対象は `:1366`（次の行動）のみで、他の実際の呼び出し元は 5 箇所（`:1015,1035,1056,1286,1348`）。PK4 の次の行動リンク検査（`:1355-1379`）は `active_count -gt 0` のときのみ走るため、本 packet起票時点（Wave Registry に active lane 0）では実際の ERROR は出ないが、将来 wave の active packet link が `### Wave Registry` 配下のみに置かれた場合に false-ERROR で Plan Gate が誤ブロックする（wave 1 plan-gate round 1 P1 の再発条件と一致）
- **既存 test harness 確認**: `scripts/tests/doc-consistency-plan-packet.test.sh` は `bash scripts/local-ci.sh` から `run_required doc-consistency-plan-packet-tests` として実行される（`local-ci.sh:211`）。起票時点で `bash scripts/tests/doc-consistency-plan-packet.test.sh` を単独実行し exit 0 / `PASS: doc-consistency-plan-packet` を確認済み（baseline clean）
- **baseline 数値（delta oracle 用、実測済み）**: `rg -Fc 'fn test_' src-tauri/tests/import_internal_contract_test.rs` = 4 / `rg -Fc 'fn sweep_dir_for_tokens' ...` = 1 / `rg -Fc 'toContain(' src/hooks/useUnsavedChangesWarning.test.tsx` = 2 / `rg -Fc 'readFileSync' src/hooks/useUnsavedChangesWarning.test.tsx` = 2 / `rg -Fc 'extract_markdown_section' scripts/doc-consistency-check.sh` = 8 / `rg -Fc 'extract_markdown_h2_section' scripts/doc-consistency-check.sh` = 4 / `rg -Fc 'Wave Registry' scripts/tests/doc-consistency-plan-packet.test.sh` = 0

## STATECAP 継承除外 — 判断保留（Scope 外、`docs/Plans.md:137`）

`check-workflow-git.sh:253` の STATECAP 計数範囲は `base="$(git merge-base origin/main HEAD)"` で固定されている。stacked train（DEV_WORKFLOW「Stacked train」節）で後続 lane が先頭 lane の branch 上に積まれている間、先頭 lane が未 merge だと `merge-base(origin/main, HEAD)` は stack 点より手前（先頭 lane の分岐点）まで遡り、先頭 lane 自身の forward state-only commit が後続 lane の STATECAP 計数（aggregate 上限 3 / post-implementation 上限 2）に二重計上される（PR #86 で実測済み、docs 側の運用規律〈継承分は content commit 同乗で処理〉は正本化済みだが機械側の範囲判定は未是正）。

候補案:

- **案 A: 計数の起点を `merge-base(origin/main, HEAD)` から自 lane の `Plan Commit`（Workflow State 記載 SHA）へ変更する**。Plan Commit は PK5 により「全実装 commit の祖先」であることが既に保証されており、stacked train でも自 lane の分岐点に一致する。
  - 利点: stack 点以前の他 lane commit を構造的に計数対象から除外できる。追加のマニュアル入力が不要（既存 tracked field を再利用）。
  - 欠点: 新しいパースパスは不要（`check-workflow-git.sh` は既に packet 内容を読んでいる — `:100-101` が `grep -m1 -E '^- Plan Commit:...'` で Plan Commit を、`:192` が `grep -E '^Rebase[[:space:]]Map:'` で Rebase Map を抽出済み。既存 parse を再利用できる）。残る課題は 2 点のみ: (1) `Plan Commit` が `pending`（plan-gate 未到達）の間の fallback 定義、(2) 単一 lane（非 stacked）で現行の `merge-base(origin/main, HEAD)` 版と計数結果が一致するかの回帰検証。
- **案 B: 明示的な stack 起点 SHA を呼び出し側から渡す（例: 環境変数 `STATECAP_BASE_OVERRIDE` または CLI 引数）**。Coordinator が stacked train 起票時にパケットの「Stacked train」節に記録済みの旧 tip SHA を明示的に渡す。
  - 利点: git 履歴パースのみで完結し、packet 内容への依存を増やさない。他の PK5/STATECAP ロジックとの結合が小さい。
  - 欠点: 手動指定が前提のため渡し忘れると現状の誤挙動へ silent に戻る（fail-closed にならない）。既存の運用（継承分は content commit 同乗で吸収）に対する改善幅が小さく、結局 Coordinator が都度 SHA を把握・入力する手間は残る。

owner / Coordinator の判断待ち事項: (1) 案 A・B のどちらを採用するか（あるいは現状の運用〈content commit 同乗〉のまま是正を見送るか）、(2) 案 A を採る場合、`pending` 時の fallback 挙動をどう定義するか。優先度は owner 判断（Backlog 記載を維持）。

## Scope

- **S1 `sweep_dir_for_tokens` に既知 gitignore パターンの skip を追加**（`src-tauri/tests/import_internal_contract_test.rs:252-276`）: `fs::read_dir` の再帰中に、file 名が `routeTree.gen.ts` または `.rs.bk` で終わる場合はその file を token 検索対象から除外する（`target`/`mutants.out*` は swept root から到達不能なため skip 対象に含めない、上記「S1 到達可能性の再実測」参照。`ignore` crate 等の新規依存は追加しない、既知 2 パターンの明示 skip のみ。ponytail: 汎用 `.gitignore` parser への upgrade は swept root 配下に未知パターンが実際に出現した時点で判断）。名前一致による skip は `src/lib/bindings.ts`（tracked、vendor-in された生成物）や `.local/` 配下の tracked file を誤って除外しないこと（拡張子 `.rs.bk` とファイル名 `routeTree.gen.ts` の完全一致のみで判定し、`.ts`/`.local` 等の広いパターンにしない）。既存 dev-dependency `tempfile`（`Cargo.toml:53`）を使い、新規 test `test_sweep_dir_for_tokens_skips_known_generated_paths` を追加: tempdir 直下に (a) `routeTree.gen.ts` file に禁止 token を直接書き込み、(b) 隣接 `foo.rs.bk` file に禁止 token を書き込み、(c) 通常の tracked-相当 file（例 `foo.rs`）に禁止 token を書き込み、の 3 パターンを配置し `sweep_dir_for_tokens` を直接呼び出して `hits` を検証する（(a)(b) は検出されない = 空、(c) は検出される = 非空、を同一 test 内で対にする。空集合 oracle 単独は使わない）。完了条件: `rg -Fc 'fn test_sweep_dir_for_tokens_skips_known_generated_paths' src-tauri/tests/import_internal_contract_test.rs` = 1（baseline 0）、既存 `test_active_sales_import_vocabulary_sweep_i_g1` は無変更で pass する
- **S2 T10 の oracle を formatter 非依存化**（`src/hooks/useUnsavedChangesWarning.test.tsx:154-159`）: `readFileSync` で読んだ `source` を `.replace(/\s+/g, " ")` で空白正規化してから、正規化済み文字列に対して `onEscapeKeyDown={(event) => { event.preventDefault();` を `toContain` で検査する単一 assertion に統合する（現行の 2 個の exact-literal `toContain` を、正規化 1 回 + 統合 assertion 1 個へ置換。test 自体・it 名・検証対象コードは変更しない）。完了条件: `rg -Fc 'replace(/\s+/g' src/hooks/useUnsavedChangesWarning.test.tsx` ≥ 1（baseline 0）、かつ `rg -Fc 'toContain("onEscapeKeyDown={(event) => {")' src/hooks/useUnsavedChangesWarning.test.tsx` = 0（baseline 1、旧 exact-literal 除去）、かつ `rg -Fc 'DSR-20 D-E T10' src/hooks/useUnsavedChangesWarning.test.tsx` = 2（同一 decision ID を持つ既存 it が 2 件〈`:133`/`:154`〉、test 自体は削除しない、baseline から不変）
- **S3 PK4 の「次の行動」抽出を `extract_markdown_h2_section` へ切替**（`scripts/doc-consistency-check.sh:1366`）: `next_actions_section=$(extract_markdown_section "$plans_md" "次の行動")` を `next_actions_section=$(extract_markdown_h2_section "$plans_md" "次の行動")` へ置換する（1 行差替え、他の `extract_markdown_section` 実際の呼び出し元 5 箇所〈`:1015,1035,1056,1286,1348`〉は無変更）。あわせて `extract_markdown_h2_section` 直前のコメント（`:839`「Goal Invariant の構造検査専用。既存 PK helpers の境界挙動は変更しない。」）を是正する: この関数は既に `Contract Probe`/`Review Response`（`:1241`）・`Goal`（`:1397`）・`Retired / Consolidated Rules`（`:1438`）でも呼ばれており「Goal Invariant 専用」は本 lane 以前から不正確だった。コメントを「level-2 section の配下にある level-3+ 小見出しも含めて抽出する。Goal Invariant 専用ではなく、`###` 小見出しを含みうる level-2 section 全般に使う。」へ書き換える（helper の汎化に合わせた 1 行 doc 是正、動作変更なし）。完了条件: `rg -Fc 'extract_markdown_h2_section "$plans_md" "次の行動"' scripts/doc-consistency-check.sh` = 1（baseline 0）、`rg -Fc 'extract_markdown_section' scripts/doc-consistency-check.sh` = 7（baseline 8、置換後の呼び出し元総数が 1 減）、`rg -Fc 'extract_markdown_h2_section' scripts/doc-consistency-check.sh` = 5（baseline 4、呼び出し元総数が 1 増）、`rg -Fc 'Goal Invariant の構造検査専用' scripts/doc-consistency-check.sh` = 0（baseline 1、stale comment 除去）
- **S3b `scripts/tests/doc-consistency-plan-packet.test.sh` に回帰 test を追加**: 新規 fixture 関数 `write_plans_md_linking_under_wave_registry`（既存 `write_plans_md_linking` 群と同じ構造、`## 次の行動` の後に `### Wave Registry` 見出しを挟んでから packet link を置く）を追加し、その link のみで PK4 の active packet link 検査が PASS することを検証する新規 test ケースを追加する（既存の番号付きコメント規約 `# --- N. ... ---` を踏襲、次番号は Writer が実装時に既存最終番号を確認して採番する）。完了条件: `rg -Fc 'write_plans_md_linking_under_wave_registry' scripts/tests/doc-consistency-plan-packet.test.sh` ≥ 1（baseline 0）、`bash scripts/tests/doc-consistency-plan-packet.test.sh` が exit 0 で `PASS: doc-consistency-plan-packet` を出力する

## Non-scope

- STATECAP 検査の stacked train 継承除外（上記「STATECAP 継承除外 — 判断保留」節、owner / Coordinator 判断待ち）
- `.gitignore` 汎用パーサの導入（S1 は既知 2 パターンの明示 skip のみ）
- `useUnsavedChangesWarning.test.tsx` の T10 以外の test、`UnsavedChangesDialog.tsx` 本体の実装変更（S2 は test file のみ）
- `extract_markdown_section` / `extract_markdown_h2_section` の一般契約変更、他 5 箇所の呼び出し元の切替（S3 は「次の行動」1 箇所のみ）
- `check-workflow-git.sh` の STATECAP 範囲判定そのものの実装（Scope 外、上記判断保留節）

## Acceptance Criteria

- AC1（S1）: `test_sweep_dir_for_tokens_skips_known_generated_paths` が `routeTree.gen.ts` / `*.rs.bk` 内の禁止 token を検出せず、同一 test 内の通常 file 内の禁止 token は検出する（対で確認、空集合 oracle を避ける）— `cargo test --test import_internal_contract_test test_sweep_dir_for_tokens_skips_known_generated_paths` PASS
- AC2（S1）: 既存 `test_active_sales_import_vocabulary_sweep_i_g1` が無変更で PASS する（既存 defect 検出力の非劣化）
- AC3（S2）: T10 が `UnsavedChangesDialog.tsx` の空白・改行のみの整形変更で FAIL しない（Writer が一時的に `onEscapeKeyDown={(event) => {` を複数行・追加空白入りに書き換えて probe し、新 oracle で PASS することを Implementation Results に記録してから元に戻す）
- AC4（S2）: T10 が `event.preventDefault();` 呼び出しの削除（mutant）で FAIL する（Matrix M2 参照）
- AC5（S3）: `bash scripts/tests/doc-consistency-plan-packet.test.sh` が exit 0 で全 PASS（新規 fixture ケース含む）
- AC6（S3）: `rg -Fc 'extract_markdown_h2_section "$plans_md" "次の行動"' scripts/doc-consistency-check.sh` = 1 かつ `rg -Fc 'extract_markdown_section "$plans_md" "次の行動"' scripts/doc-consistency-check.sh` = 0（旧呼び出しが残らない）
- AC7（全体）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/check-workflow-git.sh` がいずれも exit 0（ERROR 0）
- AC8（全体）: `cd src-tauri && cargo fmt --check && cargo clippy --all-targets --all-features -- -D warnings && cargo test` と `npm run typecheck && npm run lint && npm run format:check && npm test` がいずれも exit 0（S1/S2 は既存 gate に含まれる形で担保、新規 gate は追加しない）
- AC9（S3、docs oracle）: `rg -Fc 'Goal Invariant の構造検査専用' scripts/doc-consistency-check.sh` = 0（baseline 1）かつ `extract_markdown_h2_section` 直前のコメントが動作契約を書き換えている（`rg -A1 'level-3\+ 小見出しも含めて抽出する' scripts/doc-consistency-check.sh` に「Goal Invariant 専用ではなく」を含む行が続くことを目視確認）

## Design Sources

- Requirements / spec: 該当なし（REQ 非接触、developer workflow / test checker のみ）
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: 変更なし
- Decision log / ADR: 新規 durable decision なし。DEV_WORKFLOW.md「Risk Tiers」「Contract Audit (R3/R4)」の既存規定をそのまま適用する

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | なし（DEV_WORKFLOW.md の既存規定を適用） | existing sufficient |

## Registration / Generation Obligations

該当なし（route / command / doc 新設・REQ token 変更なし。bindings / routes / traceability の生成物再生成なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | DEV_WORKFLOW.md Risk Tiers / Contract Audit (R3/R4) | なし（既決規定の適用のみ） | S1: 汎用 `.gitignore` parser 導入は新規依存追加のコストに見合わない（到達可能な既知 2 パターンの明示 skip で足りる）。S2: test 削除は CLAUDE.md 禁止事項に抵触するため oracle 差替えのみ。S3: 既存 `extract_markdown_h2_section` の再利用が新規ロジック追加より小さい diff | `import_internal_contract_test.rs` / `useUnsavedChangesWarning.test.tsx` / `doc-consistency-check.sh` | AC1-AC2 / AC3-AC4 / AC5-AC6 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（本 packet の「起票時実測」節が一次情報。3 件とも DEV_WORKFLOW.md の既存規定の機械的適用で新規設計判断を含まない）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: S1/S2/S3 は互いに独立した file を編集し footprint は互いに素（`import_internal_contract_test.rs` / `useUnsavedChangesWarning.test.tsx` / `doc-consistency-check.sh` + `doc-consistency-plan-packet.test.sh`）
- Deferred design gaps, risk, and follow-up target: STATECAP 継承除外は上記「判断保留」節、owner / Coordinator 判断待ちのまま Backlog 残置
- Test Design Matrix can cite design decision IDs or source doc sections: Test Design Matrix は各 Contract に AC 番号を付す（decision ID は本 lane に新設なし）
- Absolute guarantee / escape hatch self-check completed: 例外なし（3 件とも既知の具体的欠陥の是正、抜け道なし）

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — test/checker script の内部ロジックのみ | — |
| Fact check / design decision split | 適用: 「起票時実測」節で 3 件とも実測により再現・非再現を確認済み（S1 は構造的欠陥は再現、現時点 hit 0 は事実として維持） | 「起票時実測」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | not applicable — operator 非接触 | — |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 非接触 | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | not applicable — L3 対象外（Human Gate: none） | — |
| 環境・再現性 | 適用: S1 の tempfile ベース test は環境非依存（外部 binary 依存なし、既存方針を踏襲） | AC1 |

## Design Readiness

- Existing design docs are sufficient because: 3 件とも DEV_WORKFLOW.md「Risk Tiers」「Contract Audit (R3/R4)」の既存規定をそのまま適用する機械的是正で、新規設計判断を要しない
- Source docs updated in this PR: なし
- Design gaps intentionally deferred: STATECAP 継承除外（上記「判断保留」節）
- Durable decisions discovered in this plan and promoted to source docs: なし

Minimum design checks:

- Layer ownership: 非該当（test / checker script のみ、UI/CMD/BIZ/IO/MNT 非接触）
- Backend function design: 変更なし（S1 は test file 内のヘルパー関数のみ）
- Command / DTO / data contract: 変更なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 変更なし
- Error, empty, retry, and recovery behavior: 変更なし
- Testability and traceability IDs: REQ 非接触。S1/S2 は既存 test file の拡張のみで新規 test file を追加しないため traceability FE baseline は不変見込み

## Contract Probe

N/A — 本 lane に検証を要する未検証の外部前提はない。理由: (1) S1 は既存 dev-dependency `tempfile` の再利用のみで新規機構を導入しない (2) S2 は `String.prototype.replace` の標準動作のみに依存する (3) S3 は同一 file 内に既に定義済みの `extract_markdown_h2_section` を呼び出し元切替するのみで、その関数自体の動作は「起票時実測」節で直接確認済み。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| I-G1 sweep test の gitignore 非尊重是正（S1） | `sweep_dir_for_tokens` | `test_sweep_dir_for_tokens_skips_known_generated_paths` / 既存 `test_active_sales_import_vocabulary_sweep_i_g1` | non-scope（fs/cargo test のみ） |
| T10 formatter 脆弱性是正（S2） | `useUnsavedChangesWarning.test.tsx` T10 | T10 自体（oracle 差替え後）+ Writer probe（AC3） | non-scope（vitest のみ） |
| PK4 `###` 打ち切り是正（S3） | `doc-consistency-check.sh` `extract_markdown_h2_section` 切替 | `doc-consistency-plan-packet.test.sh` 新規 fixture | non-scope（bash test のみ） |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-06-hygiene-batch-1-gate-test-checkers.md](test-matrices/2026-09-06-hygiene-batch-1-gate-test-checkers.md)

- targeted tests: `cargo test --test import_internal_contract_test`（S1）/ `npm test -- useUnsavedChangesWarning`（S2）/ `bash scripts/tests/doc-consistency-plan-packet.test.sh`（S3）
- negative tests: S1 の (a)(b)(c) 非検出 3 パターン、S2 の formatter probe（AC3）、S3 の旧 `extract_markdown_section` 呼び出しに戻すと新規 fixture が FAIL することの mutant 確認
- compatibility checks: S1 既存 test 無変更 PASS（AC2）、S3 他 5 箇所の `extract_markdown_section` 呼び出し元が無変更で PASS（既存 doc-consistency-plan-packet.test.sh 全体 PASS で担保）
- data safety checks: 該当なし（DB 非接触）
- main wiring/integration checks: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/check-workflow-git.sh` の exit code（AC7）

## Boundary / Wire Contract

N/A — JSON / CSV / DTO / bindings / DB 互換のいずれにも触れない。

## Review Focus

- S1: skip 対象が到達可能な既知 2 パターン（`*.rs.bk`/`routeTree.gen.ts`）に限定され、それ以外の tracked file（`src/lib/bindings.ts` を含む）への走査が誤って除外されていないこと（AC1(c) の非除外確認）
- S2: 2 個の exact-literal `toContain` が正規化 1 個の assertion に統合され、formatter probe（AC3）と preventDefault 除去 mutant（AC4）の両方が期待どおりの結果になること
- S3: `extract_markdown_section "$plans_md" "次の行動"` の呼び出しが 1 箇所のみ存在し、それが `extract_markdown_h2_section` に置き換わっていること。他 5 箇所の呼び出し元（Trace Matrix / Acceptance Criteria / Test Plan 等）が無変更であること
- S3 は `extract_markdown_h2_section` が開始条件も `^##[[:space:]]+`（level 2 のみ）に限定している点に注意: 現行の `docs/Plans.md` は `## 次の行動`（level 2）なので本 lane で回帰しないが、仮に見出しが `### 次の行動` のように level 3 以上へ変わった場合、旧 `extract_markdown_section`（`^#{2,}` で開始マッチ）は検出できたのに対し新 `extract_markdown_h2_section` は一致せず抽出が空になり、active packet がある限り全 active packet に対して「へのリンクが見つかりません」ERROR になる（fail-closed の向き自体は安全側だが、挙動が変わる点を Review で明示する）
- S3 は workflow gate 変更のため Contract Audit を独立 2 パス（Double Audit）で実施すること（Sonnet fresh 1 パス + Opus 1 パス、それぞれ `doc-consistency-check.sh` の diff と新規 fixture を独立に読む）
- Non-scope に列挙した項目（STATECAP 継承除外、`.gitignore` 汎用パーサ、T10 以外の test、他 5 箇所の呼び出し元切替）が変更されていないこと

## Spec Contract

Contract ID: SPEC-HYG1-D1

- I-G1 sweep test が既知 gitignore 対象生成物を走査対象から除外すること、T10 test が formatter 非依存の oracle で同等の検出力を保つこと、PK4 の「次の行動」抽出が `###` 小見出し配下の link を検出できること

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-HYG1-D1 | S1 | `test_sweep_dir_for_tokens_skips_known_generated_paths` / 既存 I-G1 test | skip 対象の限定性 | cargo test |
| SPEC-HYG1-D1 | S2 | T10（oracle 差替え後）+ Writer probe | formatter 非依存性 + 検出力維持 | vitest + Implementation Results 記録 |
| SPEC-HYG1-D1 | S3, S3b | `doc-consistency-plan-packet.test.sh` 新規 fixture | `###` 打ち切りの解消 + 他呼び出し元の非影響 | bash test |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: S1 の probe は `tempfile::tempdir()` の一時ディレクトリのみを使用し repo tree を書き換えない

## Writer Instructions

- PR body の Reviewed Content HEAD は pending で置く（Final Reviewer が audit した content commit の SHA を後から state-only commit で埋める。Writer 自身は書き換えない）
- `git add` は明示パスのみ（`git add -A`/`git add .` 禁止）。commit 前に `git status` / `git diff --cached --name-only` で意図した file のみが staged であることを確認する
- 実装原則（ponytail、full。subagent には発注書経由で注入する運用）:

```
## 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

- 具体的な適用: S1 は `ignore` crate 等の新規依存を追加しない（到達可能な既知 2 パターンの明示 skip のみ、ponytail rung 5「導入済み依存で済むか」を優先し既存 `tempfile` のみ使う。walker が到達しない `target`/`mutants.out*` の skip は書かない — production が到達しない挙動を assert しない）。S2 は正規化 1 行 + assertion 統合のみで、readFileSync 自体の置換や新規 helper 関数化はしない（呼び出し元 1 箇所のみで rule of three 未達）。S3 は既存 `extract_markdown_h2_section` を再利用し新規関数を書かない（ponytail rung 2「既に codebase にある」を最優先）

## Implementation Results

2026-09-06: Sonnet Writer 3 commit（`df318da` S1 `sweep_dir_for_tokens` の生成物 skip〈`routeTree.gen.ts` 完全一致 / `.rs.bk` 末尾一致、file のみ〉+ `tempfile` test〈skip される 2 件 + skip されない 1 件の対〉/ `d583386` S2 T10 を空白正規化の単一 `toContain` へ〈隣接性契約は保持、旧 2 個独立より厳密〉/ `732d097` S3 PK4「次の行動」抽出を `extract_markdown_h2_section` へ + `:840` stale comment + self-test fixture `write_plans_md_linking_under_wave_registry`）+ Final Review P3 是正 `d364785`（役割分担 comment / 正 assert を `foo.rs:` 終端込みへ）。AC1〜AC9 = Writer 実測 + Final Reviewer 独立再実測で全 PASS（AC3 formatter probe: インデント幅変更 / 1 行整形 / 余分改行 = PASS、復元済み。AC4 `preventDefault` 除去 = FAIL、復元済み。AC6 h2 呼出 1 / 旧呼出 0。AC8 `cargo fmt` / `clippy -D warnings` / `cargo test` / typecheck / lint / format:check / vitest 全 exit 0。AC9 stale comment 0）。L1 full PASS（HEAD `d364785`、clean tree）。traceability `--check` OK（再生成不要）。packet 逸脱なし。

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

2026-09-06: Plan Review round 1 = Sonnet fresh approve（P3 4: Backlog anchor 行番号 / S3 行数 58・72 / 呼び出し元の数え方 / 実働上限の理由）+ Opus approve-with-P2（P1 0。P2: 「他 7 箇所」は定義 + comment 込みの数え方で実際の他 call site は 5 / STATECAP 案A の con が事実誤認〈`check-workflow-git.sh:100-101,192` は既に packet を parse〉/ S1 skip 4 pattern のうち `target` `mutants.out*` は走査 root から到達不能。P3: S2 の挙動保証は sibling test `:133` / S3 の `##` 狭窄は fail-closed / `:840` の stale comment / 座組は Double Audit と整合）。Opus 実測: S3 で `### Wave Registry` 配下 link を検査対象にしても初回 fail 0（PK4 は存在検査のみで節拡張は単調 permissive）→ link 是正の Scope 追加は不要。Coordinator 裁定 = 全件採用 → 是正 `f2a18ca`（S1 skip を到達可能 2 件へ、AC9 追加、実働上限 30 分へ）→ Coordinator 行検分で Plan Gate 閉鎖。`plan-draft -> plan-gate -> plan-approved -> implementing` を Plans.md ⑪ 同期の本 commit に同乗させて遷移。Plan Commit = `e67711e`（plan-first commit）。Codex ロジックレビュー 1 回は §3.3 pending（2026-09-07 夜）。

2026-09-06: Final Review round 1 = Sonnet fresh approve-with-P2（Matrix SC1 / SC2 / SC4 / SC5 の mutant を独立再注入し全 kill、SC6 self-test 27 case pass、追加: 無関係 prop 追加 = 非過敏 / 隣接性破壊 = kill / `extract_markdown_h2_section` の終端 `^##`→`^#` は equivalent mutant〈Scope 外の既存関数〉。main `07302b5` の Plans.md は active packet 0 のため新 PK4 で ERROR なし）+ Opus approve-with-P2（`## 次の行動` → `## Backlog` 直前まで抽出し `### Wave Registry` を含む、節内の完了 lane link は `archive/plans/` 記法で PK4 regex 非該当、他呼出し元 5 箇所無変更、S1 skip は file のみ・完全一致 / 末尾一致、S2 正規化を node で再現）。P1 0。P2 = Implementation Results 未記入（本 commit で記録）。P3 = T10 の役割分担 comment / I-G1 正 assert の `foo.rs.bk` 部分一致 → 是正 `d364785`（Coordinator 行検分、2 行）。P3 記録のみ = T10 正規化は `{` 直後改行の非現実的 reflow で偽 FAIL し得る（prettier 設定では発生せず）/ 節拡張で完了 lane 行の `plans/` link でも PK4 が満たされる偽陰性方向の緩み（現状 `archive/plans/` 記法で実害 0、Wave Registry では `archive/plans/` 記法を継続）。Reviewed Content HEAD = `d364785`、`implementing -> human-confirm`。Human Gate = なし（script / test のみ、L3 不要）。Codex ロジックレビュー 1 回は §3.3 pending（2026-09-07 夜）。
