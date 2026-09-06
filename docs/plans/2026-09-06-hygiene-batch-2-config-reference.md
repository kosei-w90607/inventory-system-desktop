# Plan Packet: 衛生 batch 2（config / reference 系、⑫）

Backlog（`docs/Plans.md:121,130,149`、`07302b5` 時点の行番号）記載の 3 件（TanStack Router generation settings の 2 系統併存 / eslint palette 外色 ban の `files` glob 拡張 / mockup 旧定数名同期）を機械的是正として 1 lane にまとめる。3 件は互いに独立した file を編集し footprint は互いに素（`vite.config.ts` + 新規 `tsr.config.json` / `eslint.config.js` / `docs/design-system/reference/mockup-d-lists.html`）。

**Coordinator ruling（2026-09-06）**: `src/components/ui/**` は Button 自体を含む primitive 層であり、生 `<button>` の実装が正当（それが元々 raw-button ban の scope が `features/**`/`patterns/**` に限定されている理由）。Backlog:149 は palette 色 ban の話であり、生 `<button>` ban ではない。S2 は `no-restricted-syntax` を 2 block へ分離し、**色 selector のみ** `ui/**`/`layout/**` へ拡張、**生 `<button>` selector は現行 scope のまま**とする。`src/components/ui/segmented-control.tsx` には触れない。

## Workflow State

- Phase: plan-draft
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer、D-056）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5（read-only claims-producer）+ Codex ロジックレビュー 1 回（§3.3 pending。Codex 枠状況に応じて実施タイミングは Coordinator が調整し、Codex 成分が pending の間は Phase を前進させない）
- Reviewed Content HEAD: pending
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required
- Human Gate: none（runtime・operator 画面に非接触。script / config / lint / docs のみ）

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
S1（TanStack Router 生成設定の統一）と S3（mockup 定数名同期）は単独なら R1〜R2 相当（developer tooling / reference-only doc、runtime・DB・DTO・operator 画面に非接触）。S2（eslint palette 外色 ban の `files` glob 拡張、`no-restricted-syntax` block 分離）は `eslint.config.js` を変更し、これは DEV_WORKFLOW Verification Gates 「Frontend」行 `npm run lint` が直接実行する gate 定義そのものである。DEV_WORKFLOW Risk Tiers に「glob のみの拡張は R2 に留める」といった明示の切り下げ規定は無く、一般則「uncertain between R2 and R3, choose R3 when the change touches ... a workflow gate」がそのまま適用される。加えて本件は「block を分離し、色 selector だけ拡張、生 `<button>` selector は不変に保つ」という 2 selector 間の切り分け作業であり、起票時の mutant 実験（下記「S2 実測」参照）で「生 `<button>` selector を誤って `ui/**` にも適用してしまう」誤りが実際に組めてしまうことを確認した——これは正に Coordinator が禁止した挙動であり、gate の enforcement surface（何が lint 対象になるか）を変える変更である以上、⑪ packet の S3〈`doc-consistency-check.sh` PK4 判定ロジック変更〉と同型に「gate のカバレッジ・分離が意図どおりか」を独立 2 パスで確認する価値がある。よって R3 を維持し、Contract Audit 節の「Double audit: for R4 and workflow gate changes, run the Contract Audit twice in independent contexts」を S2 に適用する。S1/S3 は単独なら R1〜R2 相当（Review Focus で明記）。

## Goal

Goal Invariant:

### 最小完了条件

- S1: TanStack Router の route 生成設定が単一の `tsr.config.json` に統一され、`npm run generate:routes`（CLI）と `npx vite build`（vite plugin）が同一の `src/routeTree.gen.ts` を生成する（是正後も維持、Contract Probe / AC3-AC4 で再検証）。
- S2: `eslint.config.js` の `no-restricted-syntax` が palette 外色 selector と生 `<button>` selector の 2 block に分離され、**色 selector のみ** `src/components/ui/**` / `src/components/layout/**` へ拡張される（生 `<button>` selector は `src/features/**` / `src/components/patterns/**` のまま不変）。拡張後の色 selector は違反 0 件で `npx eslint .` が exit 0 になり、`src/components/ui/segmented-control.tsx` には一切触れない。
- S3: `docs/design-system/reference/mockup-d-lists.html` の旧定数名 `PRODUCT_PER_PAGE_OPTIONS` が現行定数名 `LIST_PER_PAGE_OPTIONS`（`src/components/patterns/list-per-page.ts`）へ同期される。

### 失敗定義

- S1: 是正後に CLI と vite plugin の生成物が乖離する、または CLI 経路（`.npmrc` `ignore-scripts=true` 下で `npm run generate:routes` を明示実行する以外に worktree で routeTree を作れない唯一の経路）が壊れる。
- S2: 是正後も既存の検出力が劣化する（palette 外色の実害を `ui/**`/`layout/**` で見逃す、または `features/**`/`patterns/**` で見逃す）、または block 分離の誤りで生 `<button>` selector が `ui/**`/`layout/**` に波及し `segmented-control.tsx` 等の既存 primitive を誤検出する、または glob 拡張が test file を誤って対象化し class 文字列 assert 等で false positive を起こす。
- S3: 是正後も旧定数名が残る、または Scope 外の他 3 件の現行 doc 参照（`73-ui-stocktake.md:220` / `50-ui-product-list.md:63` / `01-decision-rules.md:447`）に意図せず変更が及ぶ。

### 非目的

- S1: CLI script（`generate:routes` / `pretypecheck` / `prelint` / `pretest`）の撤去。下記「S1 判断材料」の通り、`.npmrc` `ignore-scripts=true` 下で `typecheck`/`lint`/`test` が routeTree を得る唯一の経路であり、撤去は他 gate を壊す。
- S2: 視覚が変わり得る palette 色の是正（今回の棚卸しで該当 0 件、下記「S2 起票時実測」参照）。生 `<button>` selector の scope 拡張、`src/components/ui/segmented-control.tsx` を含む `ui/**`/`layout/**` の DOM/実装変更（Coordinator ruling、primitive 層の生 `<button>` は正当）。`eslint.config.js` の他の `no-restricted-syntax` block（`src/components/patterns/index.ts` / `src/components/ui/index.ts` の barrel 禁止）の変更。
- S3: `73-ui-stocktake.md` / `50-ui-product-list.md` / `01-decision-rules.md` の同名 stale 参照の同期（Backlog へ新規起票、下記「S3 起票時実測」参照）。
- `app-router.ts`（Lane 4 PR #40 が改修中）/ `src/lib/bindings.ts`（(d) PR #41 が再生成済み）への接触。新規 runtime 依存の追加。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-06、worktree `/tmp/claude-1000/hyg2`、branch `agent/hygiene-batch-config`、origin/main `07302b5` 起点。すべて本 packet 起草者が `npm ci --ignore-scripts` 後に rg/diff/eslint で確認）

### S1 実測

- 現状: `vite.config.ts:12` が `tanstackRouter({ target: "react", autoCodeSplitting: true })`（inline options）で route 生成を行い、`package.json` `generate:routes` スクリプトは `tsr generate`（CLI、`tsr.config.json` なし = schema 既定値で実行）。2 系統が同一設定を共有せず個別に決め打ちしている状態を実測確認（`fd` で `tsr.config.json` 不在を確認）。
- **判断材料（実測）**: `.npmrc` の `ignore-scripts=true` は npm の pre/post lifecycle hook を止めるため、`npm run typecheck` / `npm run lint` / `npm run test` の `pretypecheck` / `prelint` / `pretest`（いずれも `npm run generate:routes` を呼ぶ）は自動発火しない。`npm run generate:routes` は「意図して明示実行するスクリプト自体」であり ignore-scripts 下でも実行される（npm 仕様: 明示 run-script の対象スクリプト自体は実行されるが、その pre/post hook は実行されない）。一方 vite plugin は `vite dev` / `vite build` の実行時にのみ route を生成する。したがって `ignore-scripts=true` の fresh worktree で `typecheck`/`lint`/`test` 単体を実行する場合、`npm run generate:routes` の明示実行（またはその手動呼び出し）が routeTree を用意する唯一の経路であり、CLI script の撤去はこの経路を壊す（S1 非目的に反映）。
- **生成物同一性の実測**（新規）: `npm ci --ignore-scripts` 後、`npm run generate:routes`（CLI、tsr.config.json なし）で生成した `src/routeTree.gen.ts`（831 行）を保存 → 削除 → `npx vite build`（vite plugin、`autoCodeSplitting: true` 明示）で再生成 → `diff` の exit code 0（byte-identical）。生成物中に `.lazy` import は 0 件（`rg -c lazy` 両ファイルとも 0）で、本 project は file ベースの lazy route splitting を使っておらず、`autoCodeSplitting` の値（CLI = 未指定で `z.boolean().optional()` のため実質 `undefined`、plugin = 明示 `true`）は `routeTree.gen.ts` の内容そのものには現状影響しないことも確認（`node_modules/@tanstack/router-generator/dist/esm/config.js:53` の zod schema で `autoCodeSplitting` に `.default(...)` が無いことをソース実読で確認）。
- **CLI が `tsr.config.json` を merge 可能なことの確認**: `node_modules/@tanstack/router-generator/dist/esm/config.js` の `getConfig()` は `configDirectory` 直下の `tsr.config.json` を読み `{...fileConfig, ...inlineConfig}` で merge する。`@tanstack/router-plugin` の `core/config.js` は同じ `getConfig` を re-export しており（vite plugin の inline options が `inlineConfig` として上書きに使われる）、CLI・plugin いずれの経路も同一の `tsr.config.json` を土台にできることをソース実読で確認済み。
- **裁定（小裁定）**: 現状で byte-identical であることは実測済みだが、これは `target`（CLI 既定値 `"react"` と plugin 明示値が偶然一致）と `autoCodeSplitting`（現状の route 構成では無関係）の 2 条件に依存した「たまたま」の一致であり、将来 `.lazy.tsx` route を追加した場合や `target` を片方だけ変更した場合に無言で乖離しうる。「CLI script 撤去」案は上記判断材料により却下（ignore-scripts 下の唯一の生成経路を失う）。「tsr.config.json 明示化」案を採用: `vite.config.ts` の inline options 2 個（`target: "react"`, `autoCodeSplitting: true`）をそのまま `tsr.config.json` へ移し、`vite.config.ts` 側は `tanstackRouter()`（引数なし）にする。値は現状の実効値を 1 文字も変えない最小移動（ponytail: 新しい判断は増やさない、既存 2 値を 1 箇所にまとめるだけ）。

### S2 実測

- 対象 block: `eslint.config.js:78-97`（`no-restricted-syntax` に palette 外色 selector と 生 `<button>` selector の 2 つが同居、`files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]` / `ignores: [...*.test.{ts,tsx}]`）。**両 selector は同一 block の `files`/`ignores` を共有するため、素朴に glob を拡張すると 2 selector が同時に拡張される。**
- **既存違反の棚卸し（両 selector を仮拡張して実測）**: `files`/`ignores` に `src/components/ui/**/*.{ts,tsx}` / `src/components/layout/**/*.{ts,tsx}`（と対応する `*.test.{ts,tsx}` ignore）を一時追加し `npx eslint .` を実行 → **1 件**、`src/components/ui/segmented-control.tsx:51` の生 `<button>`（palette 色 selector の hit は **0 件**）。仮拡張は実測後に repo 状態を元に戻し `git status --porcelain` で復元確認済み。
- **Coordinator ruling（2026-09-06）**: `src/components/ui/**` は Button 自体（`button.tsx`）を含む primitive 層であり、生 `<button>` の実装は正当（raw-button ban の scope がそもそも `features/**`/`patterns/**` に限定されているのはこのため）。Backlog:149 は palette 色 ban の `files` 拡張であり、生 `<button>` ban の拡張ではない。よって `segmented-control.tsx` には触れず、**`no-restricted-syntax` を 2 block へ分離**し、色 selector のみ拡張、生 `<button>` selector は現行 scope（`features/**`/`patterns/**`）のまま維持する。
- **分離後の実測**: block 分離を適用した状態で `npx eslint .` → **exit 0**（`segmented-control.tsx` は対象外のまま検出されない）。分離が「名目だけ」でなく実効的であることを 2 つの mutant で確認:
  - **mutant A（生 `<button>` selector を誤って `ui/**`/`layout/**` に拡張してしまう mutant）**: 生 `<button>` block の `files`/`ignores` にも `ui/**`/`layout/**` を追加すると `npx eslint .` は **exit 1、`segmented-control.tsx:51` の 1 件のみ**を報告（起票時実測の仮拡張と同一の hit）。これは「Coordinator が禁止した挙動を再現すると、正しく検出される」ことの確認であり、分離が本物であることの証明。mutant 適用後に復元し `npx eslint .` exit 0 を再確認済み。
  - **mutant B（`ui/**` 内に palette 外色 literal を注入）**: `segmented-control.tsx` に一時的に `className="bg-red-500"` を含む prop を追加すると `npx eslint .` は **exit 1、該当 2 箇所を色 selector が検出**。色 selector 拡張が実効的であることの確認。mutant 適用後に復元し（`segmented-control.tsx` は元の内容へ byte-for-byte 復元、`git diff` で無変更確認）exit 0 を再確認済み。
- **baseline 数値**: `rg -Fc '<button' src/components/ui/segmented-control.tsx` = 1（是正対象ではなく現状維持の参考値）/ `rg -Fc 'files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]' eslint.config.js` = 1 / `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 0 / `rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 0 / 分離後の `npx eslint .` = exit 0 / mutant A = exit 1・1 error / mutant B = exit 1・2 error。すべての一時変更は復元後 `git status --porcelain` で clean を確認済み。

### S3 実測

- Backlog:130 は `docs/design-system/reference/mockup-d-lists.html:110` と記載するが、実測では現在の行番号は **96 行目**（`rg -n 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = `96:...`）。Lane 3（PR #34、commit `1d44ba2`）が同 mockup file を編集した際に行がずれたと見られる（Backlog:130 起票後の file 変更、`git log --oneline -- docs/design-system/reference/mockup-d-lists.html` で `1d44ba2` が該当編集の直近 commit と確認）。行番号は実測値（96）を正として Scope に記載する。
- 現行定数名は `src/components/patterns/list-per-page.ts:1` `export const LIST_PER_PAGE_OPTIONS = [50, 100, 200] as const;`（`rg` で実在確認）。`git log -p --follow` で `LIST_PER_PAGE_OPTIONS` は `1d44ba2`（Lane 3、2026-09-05）で新規導入され、旧名 `PRODUCT_PER_PAGE_OPTIONS` から改名されたことを確認。
- 旧定数名 `PRODUCT_PER_PAGE_OPTIONS` の repo 全体 hit（node_modules 除く）: mockup 対象 1 件（`docs/design-system/reference/mockup-d-lists.html:96`）の他に、`docs/archive/plans/**` 6 file（archived packet、D-050 の non-retroactive 原則により対象外）+ **現行 tracked doc 3 file**: `docs/Plans.md:18`（`直近の完了` PR #30 の履歴記述、その PR 当時の名前として正しいため対象外）/ `docs/design-system/01-decision-rules.md:447` / `docs/function-design/50-ui-product-list.md:63` / `docs/function-design/73-ui-stocktake.md:220`。後者 3 file は「現在の契約」を説明する文脈で旧名を使っており Lane 3 の改名に追随していない stale 参照だが、Backlog:130 の Scope（mockup のみ）を超えるため本 lane では触らず、新規 Backlog 行として追記する（下記「S3 追加所見」）。
- **baseline 数値**: `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 1 / `rg -Fc 'LIST_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 0。

### S3 追加所見（Scope 外、Backlog へ新規起票）

`01-decision-rules.md:447` / `50-ui-product-list.md:63` / `73-ui-stocktake.md:220` が現行契約の文脈で `PRODUCT_PER_PAGE_OPTIONS`（Lane 3 `1d44ba2` で `LIST_PER_PAGE_OPTIONS` へ改名済み）を参照したまま。本 lane は mockup 1 file の Scope に留め、この 3 file の同期は次に該当 doc を触る lane に委ねる（`docs/Plans.md` Backlog へ新規行を追加、下記参照）。

## Scope

- **S1 TanStack Router 生成設定を `tsr.config.json` へ統一**: 新規 `tsr.config.json`（repo root）に `{"target": "react", "autoCodeSplitting": true}` を作成し、`vite.config.ts:12` の `tanstackRouter({ target: "react", autoCodeSplitting: true })` を `tanstackRouter()`（引数なし、他 plugin 引数の並びは変更しない）へ置換する。値は現状の実効値からの変更なし（既存 2 値を 1 箇所へ移動するのみ、新しい設定判断は追加しない）。完了条件: `rg -Fc '"target": "react"' tsr.config.json` = 1、`rg -Fc '"autoCodeSplitting": true' tsr.config.json` = 1、`rg -Fc 'tanstackRouter({ target: "react", autoCodeSplitting: true })' vite.config.ts` = 0（baseline 1）、`rg -Fc 'tanstackRouter()' vite.config.ts` = 1（baseline 0）。是正後、`npm run generate:routes`（CLI）と `npx vite build`（plugin）を再実行し `src/routeTree.gen.ts` が byte-identical であることを `diff` exit code 0 で再確認する（AC3）。
- **S2 eslint palette 外色 ban の `files` glob 拡張（生 `<button>` ban は現行 scope のまま）**: `eslint.config.js:78-97` の `no-restricted-syntax` block を 2 つへ分離する。(i) 色 selector（palette 外色 literal ban）の block: `files`/`ignores` に `src/components/ui/**/*.{ts,tsx}` / `src/components/layout/**/*.{ts,tsx}` と対応する `*.test.{ts,tsx}` ignore を追加する。(ii) 生 `<button>` selector の block: `files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]` を**変更しない**（`src/components/ui/**`/`src/components/layout/**` は非対象のまま — primitive 層で生 `<button>` は正当、Coordinator ruling）。`src/components/ui/segmented-control.tsx` には一切触れない。完了条件: `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0、色 block にのみ出現）、`rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0、色 block にのみ出現）、生 `<button>` block の `files`/`ignores` 文字列は無変更、`npx eslint .` が exit 0（`segmented-control.tsx` は検出されない）。
- **S3 mockup 旧定数名の同期**: `docs/design-system/reference/mockup-d-lists.html:96`（起票時実測で確認した実際の行番号、Backlog:130 記載の `:110` は stale）の `PRODUCT_PER_PAGE_OPTIONS` を `LIST_PER_PAGE_OPTIONS` へ置換する（`<code>` タグ内のテキストのみ、周辺文の日本語文言は変更しない）。完了条件: `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 0（baseline 1）、`rg -Fc 'LIST_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 1（baseline 0）。
- **S3b `docs/Plans.md` Backlog への新規行追加**: 上記「S3 追加所見」の 3 file stale 参照を新規 Backlog 行として追記する（「次に該当 doc を触る lane で同期」形式、既存 Backlog 行の書式踏襲）。

## Non-scope

- CLI script（`generate:routes` / `pretypecheck` / `prelint` / `pretest`）の撤去（上記「S1 判断材料」参照、ignore-scripts 下の唯一の生成経路のため）。
- `tsr.config.json` へ `target` / `autoCodeSplitting` 以外の項目（`routesDirectory` / `quoteStyle` / `semicolons` / `routeFileIgnorePrefix` 等）を追加すること。現状どちらの経路も既定値のみに依存しており変更不要。
- palette 外色の hex → token 置換（今回の棚卸しで該当 0 件）。
- **`src/components/ui/segmented-control.tsx` への変更、および `ui/**`/`layout/**` の DOM 変更全般**（Coordinator ruling: primitive 層の生 `<button>` は正当、raw-button ban の scope はそもそも `features/**`/`patterns/**` 限定）。
- 生 `<button>` ban selector の scope 拡張（現行 `features/**`/`patterns/**` のまま）。
- `eslint.config.js` の barrel 禁止 block（`src/components/patterns/index.ts` / `src/components/ui/index.ts`）の変更。
- `01-decision-rules.md:447` / `50-ui-product-list.md:63` / `73-ui-stocktake.md:220` の旧定数名同期（S3b で Backlog へ新規起票のみ、本 lane では実装しない）。
- `app-router.ts`（Lane 4 PR #40 改修中）/ `src/lib/bindings.ts`（(d) PR #41 再生成済み）への接触。新規依存の追加。runtime 挙動の変更。

## Acceptance Criteria

- AC1（S1）: `tsr.config.json` が repo root に存在し `"target": "react"` と `"autoCodeSplitting": true` を含む — `rg -Fc '"target": "react"' tsr.config.json` = 1、`rg -Fc '"autoCodeSplitting": true' tsr.config.json` = 1
- AC2（S1）: `vite.config.ts` の inline options が除去される — `rg -Fc 'tanstackRouter({ target: "react", autoCodeSplitting: true })' vite.config.ts` = 0（baseline 1）かつ `rg -Fc 'tanstackRouter()' vite.config.ts` = 1（baseline 0）
- AC3（S1）: 是正後に `npm run generate:routes`（CLI）と `npx vite build`（plugin）が生成する `src/routeTree.gen.ts` が byte-identical — `diff` exit code 0（起票時実測と同じ手順の post-change 再現）
- AC4（S1、Writer probe、負例）: `tsr.config.json` の `"target"` を一時的に `"solid"` へ変更し、CLI・plugin 両方を再実行して生成物を比較する。是正が正しく単一化されていれば両者は依然として byte-identical（両方が solid 風に揃って変化する）。もし `vite.config.ts` に inline `target: "react"` が残っていれば（Scope 未適用の mutant）plugin 側だけ react のまま固定され乖離する — probe 後は `tsr.config.json` を元の値に戻し、`diff` exit code 0 を再確認して復元する（Implementation Results に記録）
- AC5（S2）: `eslint.config.js` の `no-restricted-syntax` が 2 block に分離され、色 selector の block のみ `files`/`ignores` に `src/components/ui/**` / `src/components/layout/**`（と対応する `*.test.{ts,tsx}` ignore）が追加される — `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0）、`rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0）
- AC6（S2）: 生 `<button>` selector の block の `files`/`ignores` が無変更 — `rg -Fc 'files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]' eslint.config.js` = 1（分離後も生 `<button>` block にこの文字列がそのまま残る）。`src/components/ui/segmented-control.tsx` は無変更（`git diff --stat` に出現しない）
- AC7（S2）: `npx eslint .` が exit 0（分離 + 拡張後。`segmented-control.tsx` は検出されない）
- AC8（S2、Writer probe、負例、mutant A）: 生 `<button>` selector の block の `files`/`ignores` にも一時的に `ui/**`/`layout/**` を追加すると `npx eslint .` が exit 1・`segmented-control.tsx:51` の 1 件のみを報告することを確認してから復元する（block 分離が名目だけでなく実効的であることの確認、起票時実測で再現済み、Matrix SC6 参照）
- AC9（S2、Writer probe、負例、mutant B）: `ui/**`/`layout/**` 内の既存 non-test file（例 `segmented-control.tsx`）に一時的な palette 外色 literal（例 `bg-red-500`）を追加すると `npx eslint .` が exit 1 で色 selector がそれを検出することを確認してから byte-for-byte 復元する（色 selector の拡張が実効的であることの確認、起票時実測で再現済み、Matrix SC5 参照）
- AC10（S3）: `docs/design-system/reference/mockup-d-lists.html` の旧定数名が新定数名へ置換される — `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 0（baseline 1）、`rg -Fc 'LIST_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 1（baseline 0）
- AC11（全体）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/check-workflow-git.sh` がいずれも exit 0（ERROR 0）
- AC12（全体）: `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build` が exit 0（S1/S2 は既存 gate に含まれる形で担保、新規 gate は追加しない）

## Design Sources

- Requirements / spec: 該当なし（REQ 非接触、developer tooling / lint config / reference-only doc のみ）
- Architecture: 変更なし
- Function / command / DTO: 変更なし
- DB: 変更なし
- Screen / UI: 変更なし（`ui/**`/`layout/**` の DOM には一切触れない、Non-scope 明記）
- Decision log / ADR: 新規 durable decision なし。DEV_WORKFLOW.md「Risk Tiers」「Contract Audit (R3/R4)」の既存規定と D-080（mockup reference-only）をそのまま適用する

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status |
|---|---|---|
| Backend function / command / repository / validation / error | なし | existing sufficient |
| Command / DTO / generated binding / wire shape | なし | existing sufficient |
| DB / transaction / audit / rollback / migration | なし | existing sufficient |
| Screen / UI / route state / Japanese wording | なし | existing sufficient |
| CSV / TSV / report / import / export format | なし | existing sufficient |
| Durable decision / ADR | なし（DEV_WORKFLOW.md の既存規定 + D-080 を適用） | existing sufficient |

## Registration / Generation Obligations

該当なし（route / command / doc 新設・REQ token 変更なし。S1 は既存 routeTree 生成経路の設定統一のみで新規 route を追加しない。bindings / traceability の再生成なし）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| — | DEV_WORKFLOW.md Risk Tiers / Contract Audit (R3/R4) | なし（既決規定の適用のみ） | S1: 「CLI script 撤去」は ignore-scripts 下の唯一の生成経路を失うため却下、「tsr.config.json 明示化」を採用（起票時実測「S1 判断材料」参照）。S2: `no-restricted-syntax` の 2 block 分離は Coordinator ruling（primitive 層の生 `<button>` は正当）を機械的に反映するのみで新規判断を含まない。S3: mockup は D-080 で reference-only、現行契約は runtime 側 `list-per-page.ts` が正 | `tsr.config.json` / `vite.config.ts` / `eslint.config.js` / `mockup-d-lists.html` | AC1-AC4 / AC5-AC9 / AC10 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（本 packet の「起票時実測」節が一次情報。3 件とも DEV_WORKFLOW.md の既存規定の機械的適用 + ソース実読で完結し新規設計判断を含まない）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: S1/S2/S3 は互いに独立した file を編集し footprint は互いに素
- Deferred design gaps, risk, and follow-up target: S3 の他 3 file stale 参照は S3b で Backlog へ新規起票（Scope 外のまま残置）
- Test Design Matrix can cite design decision IDs or source doc sections: Test Design Matrix は各 Contract に AC 番号を付す（decision ID は本 lane に新設なし）
- Absolute guarantee / escape hatch self-check completed: 例外なし（3 件とも既知の具体的欠陥の是正、抜け道なし）

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — build tooling / lint config / reference doc のみ | — |
| Fact check / design decision split | 適用: 「起票時実測」節で 3 件とも実測により事実（生成物同一性・違反件数・行番号drift）を確認済み | 「起票時実測」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | not applicable — operator 非接触 | — |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 非接触 | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | not applicable — L3 対象外（Human Gate: none） | — |
| 環境・再現性 | 適用: S1 の probe（AC4）は tempfile 等を使わず repo tree 上の `tsr.config.json` を一時変更・復元するのみ。ignore-scripts 環境での再現性は「S1 判断材料」で確認済み | AC4 |

## Design Readiness

- Existing design docs are sufficient because: 3 件とも DEV_WORKFLOW.md「Risk Tiers」「Contract Audit (R3/R4)」の既存規定と D-080 の適用のみで、新規設計判断を要しない
- Source docs updated in this PR: なし（`docs/Plans.md` の Backlog/次の行動同期を除く）
- Design gaps intentionally deferred: S3 の他 3 file stale 参照（S3b で Backlog 新規起票）
- Durable decisions discovered in this plan and promoted to source docs: なし

Minimum design checks:

- Layer ownership: 非該当（build config / lint config / reference doc のみ、UI/CMD/BIZ/IO/MNT 非接触）
- Backend function design: 変更なし
- Command / DTO / data contract: 変更なし
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 変更なし（S2 は lint config のみで DOM/UI 非接触）
- Error, empty, retry, and recovery behavior: 変更なし
- Testability and traceability IDs: REQ 非接触。新規 test file を追加しないため traceability FE baseline は不変見込み

## Contract Probe

- S1 の unverified premise: 「vite plugin と CLI `tsr generate` は同一設定なら同一生成物を出す」 → 実験: worktree `/tmp/claude-1000/hyg2` で `npm ci --ignore-scripts` 後、CLI 実行結果（831 行）と `npx vite build` 実行結果の `src/routeTree.gen.ts` を保存し `diff` → 結果: exit code 0（byte-identical）。post-change（`tsr.config.json` 導入後）の再検証は AC3（回帰確認）と AC4（Writer probe、`target` mutation で単一化の実効性を確認）に記録する。
- S2/S3: N/A — eslint / rg の決定的なツール挙動のみに依存し、外部ライブラリや OS/hardware の未検証前提はない。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| TanStack Router 生成設定の統一（S1） | `tsr.config.json` / `vite.config.ts` | `npm run generate:routes` vs `npx vite build` diff（AC3）+ Writer probe（AC4） | non-scope（生成物比較のみ） |
| eslint palette 外色 ban の glob 拡張（生 `<button>` selector は不変、S2） | `eslint.config.js`（block 分離） | `npx eslint .` exit code（AC7）+ mutant A/B（AC8-AC9） | non-scope（lint のみ） |
| mockup 旧定数名同期（S3） | `mockup-d-lists.html` | `rg -Fc` baseline+delta（AC10） | non-scope（doc 文字列のみ） |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-06-hygiene-batch-2-config-reference.md](test-matrices/2026-09-06-hygiene-batch-2-config-reference.md)

- targeted tests: `npm run generate:routes && npx vite build`（S1、生成物 diff）/ `npx eslint .`（S2）
- negative tests: S1 の `target` mutation probe（AC4）、S2 の mutant A（生 `<button>` selector を `ui/**`/`layout/**` へ誤拡張、AC8）、S2 の mutant B（`ui/**` へ palette 外色 literal 注入、AC9）
- compatibility checks: S1 の post-change 生成物 diff（AC3、既存 route 構成が壊れないことを担保）、S2 生 `<button>` selector block の `files`/`ignores` 無変更（AC6、`segmented-control.tsx` 等の既存 primitive が非接触のまま）
- data safety checks: 該当なし（DB 非接触）
- main wiring/integration checks: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/check-workflow-git.sh` の exit code（AC11）、frontend フル gate（AC12）

## Boundary / Wire Contract

N/A — JSON API / browser state / CSV / DTO / bindings / DB 互換のいずれにも触れない（`tsr.config.json` は build tooling 設定であり wire contract ではない）。

## Review Focus

- S1: `tsr.config.json` の値が現状の実効値（`target: "react"`, `autoCodeSplitting: true`）から 1 文字も変わっていないこと（新しい設定判断を持ち込んでいないこと）。「CLI script 撤去」を却下した判断材料（ignore-scripts 下の唯一の生成経路）が正確であること
- S2: 生 `<button>` selector の block の `files`/`ignores` が Scope 適用の前後で文字列として無変更であること（`src/components/ui/segmented-control.tsx` を含む `ui/**`/`layout/**` の生 primitive が一切対象化されないこと、Coordinator ruling の反映）
- S2 は workflow gate 変更（`eslint.config.js`）のため Contract Audit を独立 2 パス（Double Audit）で実施すること（Sonnet fresh 1 パス + Opus 1 パス、それぞれ `eslint.config.js` の diff と mutant A/B probe の記録を独立に読み、2 block が実際に分離されている＝色 selector の files のみが拡張され生 `<button>` selector の files には手を加えていないことを確認する）
- S3: 行番号drift（Backlog:130 の `:110` → 実測 `:96`）の原因（Lane 3 `1d44ba2` の同 file 編集）が Implementation Results に記録されていること。置換が `<code>` タグ内のみで周辺の日本語文言を変更していないこと
- Non-scope に列挙した項目（CLI script 撤去、`tsr.config.json` の他項目追加、色 token 置換、barrel 禁止 block、他 3 file の stale 参照、`app-router.ts`/`bindings.ts`）が変更されていないこと

## Spec Contract

Contract ID: SPEC-HYG2-D1

- TanStack Router の CLI・vite plugin 生成物が単一 `tsr.config.json` を土台に同一であり続けること、eslint palette 外色 ban の `files` glob 拡張が色 selector のみに適用され生 `<button>` selector の scope（primitive 層除外）を変えないこと、mockup の定数名参照が現行契約と一致すること

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-HYG2-D1 | S1 | CLI vs plugin diff（AC3）+ `target` mutation probe（AC4） | 単一化の実効性 | 起票時実測 + Implementation Results |
| SPEC-HYG2-D1 | S2 | `npx eslint .`（AC7）+ mutant A/B（AC8-AC9） | block 分離の実効性 + primitive 層非接触 + Double Audit | eslint + Implementation Results |
| SPEC-HYG2-D1 | S3, S3b | `rg -Fc` baseline+delta（AC10） | 現行定数名との一致 | rg |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: 該当なし（S1/S2 の probe はいずれも repo tree 上の一時変更 + 復元のみ、tempdir や DB を使わない）

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

- 具体的な適用: S1 は `tsr.config.json` に既存 2 値以外を追加しない（ponytail rung 1「そもそも要るか」— 未使用項目の先回り設定はしない）。S2 は `no-restricted-syntax` の block を分離するだけで、`segmented-control.tsx` や他の `ui/**`/`layout/**` file には一切触れない（ponytail rung 1「そもそも要るか」— Coordinator ruling により生 `<button>` ban 側の scope 拡張は不要と確定済み）。S3 は `<code>` タグ内の文字列置換のみで周辺文言を書き換えない

## Implementation Results

(Fill after implementation.)

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
