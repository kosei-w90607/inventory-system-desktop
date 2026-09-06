# Test Design Matrix: 衛生 batch 1（gate / test checker 系、⑪）

Plan Packet: [../2026-09-06-hygiene-batch-1-gate-test-checkers.md](../2026-09-06-hygiene-batch-1-gate-test-checkers.md)

## Risk

R3（S3 が `scripts/doc-consistency-check.sh` の Plan Gate 判定ロジック〈`extract_markdown_section` 呼び出し切替〉を変更する workflow gate change に該当するため、DEV_WORKFLOW Risk Tiers の uncertain-default 規則で R3 とする。S1/S2 は単独なら R1 相当。runtime・DB・DTO・operator 画面には非接触のため L3 は非対象、本 Matrix は 3 件の checker/test 自体の契約検査に限定する）。

## Contracts Under Test

- SC1（S1）: `sweep_dir_for_tokens` が `routeTree.gen.ts` file、`*.rs.bk` file の内部を token 検索対象から除外する（`target`/`mutants.out*` は swept root から到達不能なため対象外、Plan Packet「S1 到達可能性の再実測」参照）
- SC2（S1）: `sweep_dir_for_tokens` が上記以外の通常 file（既存 defect 検出対象）は引き続き検出する（除外の非過剰）
- SC3（S2）: T10 の oracle が `UnsavedChangesDialog.tsx` の空白・改行のみの整形変更で FAIL しない
- SC4（S2）: T10 の oracle が `event.preventDefault();` 呼び出しの削除で FAIL する
- SC5（S3）: PK4 の「次の行動」抽出（`extract_markdown_h2_section` 切替後）が `### Wave Registry` などの `###` 小見出し配下に置かれた active packet link を検出する
- SC6（S3）: `extract_markdown_section` の他 5 呼び出し元（`:1015,1035,1056,1286,1348`、Trace Matrix / Acceptance Criteria / Test Plan 等）の抽出範囲が本変更で変わらない

## Failure Modes

- skip-list が効かず `routeTree.gen.ts`/`*.rs.bk` 内の token が誤検出される（偽陽性 fail、backlog 記載の欠陥そのもの）
- skip-list が過剰に効き、通常の tracked file が走査対象から漏れる（既存 defect 検出力の劣化、偽陰性）
- T10 の oracle が exact-literal のまま残り formatter 由来の空白変更で FAIL し続ける（是正が効いていない）
- T10 の oracle が緩すぎて `event.preventDefault()` の削除を検出できなくなる（検出力の劣化）
- PK4 の「次の行動」抽出が `### Wave Registry` 配下の link を依然として検出できない（是正が効いていない）
- `extract_markdown_h2_section` への切替が「次の行動」以外の呼び出し元にも波及し、他の PK チェック（Trace Matrix 等の抽出）の範囲が変わる

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 gitignore skip（S1） | skip-list 未実装 / 不完全 | unit（`import_internal_contract_test.rs` 新規） | `test_sweep_dir_for_tokens_skips_known_generated_paths` — tempdir に `routeTree.gen.ts`（禁止 token 含む）、`foo.rs.bk`（禁止 token 含む）の 2 パターンを配置し `sweep_dir_for_tokens` を直接呼び出す。`hits` が空であることを assert | `routeTree.gen.ts`/`*.rs.bk` のいずれかで token が検出される（`hits` が非空になる） |
| SC2 過剰除外なし（S1） | skip-list が広すぎる | unit（同一 test 内、対で確認） | 同一 tempdir 内に通常 file（例 `foo.rs`）へ禁止 token を配置し、同じ `sweep_dir_for_tokens` 呼び出しで `hits` にこの file が含まれることを assert（SC1 と対にし空集合 oracle を避ける） | 通常 file 内の token が検出されない（`hits` から漏れる） |
| SC3 formatter 非依存（S2） | oracle が exact-literal のまま | unit（`useUnsavedChangesWarning.test.tsx` T10 の Writer probe、Implementation Results に記録） | Writer が実装直後に `UnsavedChangesDialog.tsx:22-24` を一時的に `onEscapeKeyDown={(event) => {\n          event.preventDefault();\n        }}` から改行位置・インデント幅を変えた同義の整形へ書き換え、T10 が PASS することを確認してから元に戻す（`git diff` で復元確認） | 整形変更後に T10 が FAIL する（is-fragile のまま） |
| SC4 preventDefault 除去検出（S2） | oracle が緩すぎる | unit（T10、mutation probe） | `UnsavedChangesDialog.tsx` の `event.preventDefault();` を一時的に削除し、T10 が FAIL することを確認してから元に戻す | mutant 適用後も T10 が PASS する（検出力なし） |
| SC5 Wave Registry 配下 link 検出（S3） | `###` 打ち切りが残る | unit（`doc-consistency-plan-packet.test.sh` 新規 fixture） | 新規 fixture `write_plans_md_linking_under_wave_registry` で `## 次の行動` → `### Wave Registry` → packet link の順に `docs/Plans.md` を構成し、`run_check` が active packet link を検出して PK4 PASS することを assert | `### Wave Registry` 配下の link が検出されず PK4 が「へのリンクが見つかりません」で ERROR になる |
| SC6 他呼び出し元の非干渉（S3） | 切替が波及 | unit（既存 `doc-consistency-plan-packet.test.sh` 全体の無変更 pass 確認） | 既存の全 test ケース（Trace Matrix / Acceptance Criteria / Test Plan 等の抽出に依存する既存 assertion）が本変更後も無変更で PASS する | 他の `extract_markdown_section` 呼び出し元（実際の呼び出し 6 箇所中、対象 `:1366` 以外の 5 箇所）の抽出結果が変わり既存 test が壊れる |

## Mutation Oracle Notes

- SC1/SC2 は同一 test 内で「除外されるべき 2 パターン」と「除外されるべきでない 1 パターン」を対にする。SC1 単独（除外パターンのみ）だと `sweep_dir_for_tokens` を丸ごと no-op にする mutant（何も検出しない）を見逃す
- SC3/SC4 は Writer probe として Implementation Results に記録する（Matrix 実行時に repo を一時的に mutant 化して元に戻す運用、CI に恒久 mutant を残さない）。SC3 単独だと oracle を「常に PASS」にする mutant（検出力ゼロ）を見逃すため SC4 と対で運用する
- SC5 の fixture は既存 `write_plans_md_linking`（link が `## 次の行動` 直下、`###` を挟まない）との対比で設計する。SC5 単独で `write_plans_md_linking_under_wave_registry` のみを追加すると、`extract_markdown_h2_section` への切替を忘れて `extract_markdown_section` のまま残した mutant（旧関数のまま）を、新規 fixture が ERROR で kill する。既存 `write_plans_md_linking` 系ケース（SC6 側）が無変更で PASS することとの両立を確認する
- SC6 は新規 test を追加せず、既存 `doc-consistency-plan-packet.test.sh` の全既存ケースが無変更で PASS することをもって確認する。もし `extract_markdown_h2_section` への切替が「次の行動」以外の呼び出し元（Trace Matrix 等）にまで誤って波及した場合、既存の該当 test ケースが壊れて検出される

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC1/SC2 は `cargo test --test import_internal_contract_test`、SC3/SC4 は vitest + Writer probe（Implementation Results 記録）、SC5/SC6 は `bash scripts/tests/doc-consistency-plan-packet.test.sh`。AC7（`doc-consistency-check.sh --target plan` / `check-workflow-git.sh` の exit code）と AC8（既存 Rust/frontend フル gate）は Plan Packet 側の完了条件として記載済みで、本 Matrix には独立行を立てない。
