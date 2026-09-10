# Test Design Matrix: ⑳ フィルタ入力の Label 上置き統一 + セクション見出しの規範化（docs-only）

Plan Packet: [2026-09-10-filter-label-top-design.md](../2026-09-10-filter-label-top-design.md)

## Risk

Risk: R2

## Contracts Under Test

- C1 catalog ⑨ 使用トークンが「すべてのフィルタ入力」の上置き規範 + 例外 2 種（Checkbox 横並び / SegmentedControl 可視 Label なし）を持つ（D1）
- C2 catalog ⑨ の `DepartmentFilter` 構造 block が `grid gap-1` 上置き形（D2）
- C3 catalog ⑨ に page の file:line が無い（D3）
- C4 catalog ① にセクション見出し variation（h2 / 説明 / action、PageHeader (c) 折返し契約、1 h1 不変、`SectionHeader` canonical 想定）（D4）
- C5 catalog ⑤ に SegmentedControl の Label 例外（D5、draft literal）
- C6 mockup-g が存在し reference/README に登録、外部依存なし（D6）
- C7 更新履歴 1 行、他 section 不変、`src/**` / DSR / function-design に diff なし
- C8 Human Gate 3 件が確定文になっていない（両論併記）

## Failure Modes

- F1 規範が live SearchBar 限定のまま / 例外が書かれず Checkbox まで上置きになる
- F2 DepartmentFilter block が横並びのまま（runtime lane が旧形を転記する）
- F3 catalog に `Page.tsx:NN` が入り、runtime 後に stale
- F4 variation が `PageHeader` を使う指示になり 1 h1 が崩れる / 折返し契約の class が 1 つ欠ける
- F5 SegmentedControl の扱いが無記載で runtime lane が Label を足す / 足さないを再導出する
- F6 mockup-g が JS / CDN を含む、README 未登録
- F7 DSR-01 や 04-backbone を巻き込んで書き換える / src に diff
- F8 Human Gate 前に「component 化する」と確定文で書く

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| C1 | F1 | rg | AC1 `rg -c "すべてのフィルタ入力"` ≥ 1 / AC3 `label 内包の横並び` ≥ 1、`可視 Label を持たない` ≥ 2 | 規範拡張・例外のいずれかが欠ける |
| C1 | F1 | rg（互換） | `rg -c "useId" 02-component-catalog.md` = baseline / `rg -c "max-w-md" …` = baseline | 既存 live 型記述が置換で消える |
| C2 | F2 | awk + rg | AC2 `awk ⑨ \| rg -c 'className="grid gap-1"'` ≥ 1 | DepartmentFilter block が旧形 |
| C3 | F3 | awk + rg（負） | AC5 `awk ⑨ \| rg -c "\.tsx:[0-9]+"` = 0 | file:line が混入 |
| C4 | F4 | rg | AC4 `バリエーション: セクション見出し` = 1 / `SectionHeader` ≥ 1 / `awk ① \| rg -c "min-w-0 flex-1"` ≥ 3（baseline 2） / AC6 `1 ページ 1 個の h1` = 1 + `PageHeader で描かない` ≥ 1 | variation 欠落、契約 class 欠落、1 h1 の文言が変わる |
| C4 | F4（token） | awk + rg（負） | AC11 `awk ① \| rg -c "text-lg"` = 0 / `text-xl font-semibold` ≥ 1 / `説明を見出し行の下に置く形` ≥ 1 | h2 に h3 token（18px）を書く / 形態 A の除外が抜ける |
| C1 | F1（D5） | rg | AC3 `3 択以上の SegmentedControl` ≥ 1 / `text-sm text-muted-foreground" htmlFor` ≥ 1 | SegmentedControl の 2 択 / 3 択以上の区別が無い / label の canonical class が無い |
| C5 | F5 | rg | AC3 後半（⑤ 節内 `awk '/^## ⑤/,/^## ⑥/' \| rg -c "可視 Label を持たない"` = 1） | ⑤ に記述なし |
| C6 | F6 | fd + rg | AC7 | file 無し / README 未登録 / `<script` or `http` 混入 |
| C7 | F7 | git + awk | AC8 更新履歴 1 行 / AC9 `git diff --name-only origin/main..HEAD -- src src-tauri docs/design-system/01-decision-rules.md docs/function-design` = 0 | 範囲外 diff |
| C8 | F8 | rg（負） | `rg -n "component 化を採用|SectionHeader を新設する" 02-component-catalog.md \| wc -l` = 0（Human Gate 回答前） | 確定文が混入 |
| 全体 | — | gate | AC10（doc-consistency / check-workflow-git / reading-order-drift / format:check） | いずれか FAIL |

## State Lifecycle Matrix

not applicable — docs-only、UI / data / route / persisted state の変更なし。workflow-state の標準行のみ:

- content candidate → L1 / independent review → state-only human-confirm commit
- owner authorization → Draft state-only Ready commit → exact-HEAD L1 → PR body → Ready / dispatch（docs-only は owner `workflow_dispatch`）→ merge with no later tracked commit
- state-only violation: allowlist + `git diff --unified=0` hunk 監査
- hosted-not-required incidental failure: product / gate failure は implementing へ

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| live SearchBar 上置き（⑭） | `ProductListPage` / `StockInquiryPage` / `PriceRevisionFilters` / `InventoryRecordsPage` の 4 サイト + 既に上置きの 3 page（操作ログ / 入出庫履歴 / 在庫変動） | 規範として全入力へ（docs） | Checkbox（慣行）/ SegmentedControl（自己記述、Human Gate (1)） | packet 実測表 |
| PageHeader (c) 折返し契約（⑮） | `PageHeader.tsx:31-43` | ① variation（docs） | `AlertDialogTitle`（`IntegrityCheckPage.tsx:438`、見出しでない） | packet 実測表 |
| mockup 運用 | `mockup-d-lists.html` / `mockup-f-supplier-picker.html` | mockup-g | — | AC7 |

## Negative Paths

- missing input: 該当なし
- invalid input: 該当なし
- duplicate/ambiguous input: 例外の記述を ⑨ と ⑤ の 2 箇所に分けるが、規範本体は ⑨ のみ（⑤ は参照 1 行）— 重複定義にならないこと（Review Focus）
- unknown reference: `SectionHeader` は後続実装（「想定」明記）
- dependency missing: 該当なし
- permission/write failure: 該当なし
- dry-run side effect: 該当なし

## Boundary Checks

not applicable（docs-only）。

## Compatibility Checks

- old schema/input: 既存 ⑨ live 型記述（`useId` / `max-w-md` / 既定 label）が残る
- new schema/input: 該当なし
- output order: 該当なし
- optional field behavior: 該当なし

## Data Safety Checks

- source-derived data: 該当なし
- generated outputs: 該当なし

## Main Wiring / Integration Checks

該当なし。

## Mutation-style Adequacy Questions

docs-only のため runtime mutant なし。closure（Sonnet + Opus）は AC1〜AC9 の oracle を再実行し、加えて「D1 の段落から例外 1 種を消した draft」を仮想 mutant として AC3 が落ちることを確認する。

## Residual Test Gaps

- 規範の妥当性（Label 上置きが全 toolbar で見やすいか）は owner の目のみ（AC-HumanGate）
- runtime 反映後の視覚崩れは runtime lane の L3
