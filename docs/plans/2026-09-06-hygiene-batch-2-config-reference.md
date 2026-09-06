# Plan Packet: 衛生 batch 2（config / reference 系、⑫）

Backlog（`docs/Plans.md:121,130,149`、`07302b5` 時点の行番号）記載の 3 件（TanStack Router generation settings の 2 系統併存 / eslint palette 外色 ban の `files` glob 拡張 / mockup 旧定数名同期）を機械的是正として 1 lane にまとめる。3 件は互いに独立した file を編集し footprint は互いに素（`vite.config.ts` + 新規 `tsr.config.json` / `eslint.config.js` / `docs/design-system/reference/mockup-d-lists.html` + `docs/design-system/01-decision-rules.md` + `docs/function-design/50-ui-product-list.md` + `docs/function-design/73-ui-stocktake.md`、後 3 file は Plan Review Opus P2-5 で S3 の Scope へ統合）。

**Coordinator ruling（2026-09-06）**: `src/components/ui/**` は Button 自体を含む primitive 層であり、生 `<button>` の実装が正当（それが元々 raw-button ban の scope が `features/**`/`patterns/**` に限定されている理由）。Backlog:149 は palette 色 ban の話であり、生 `<button>` ban ではない。S2 は既存 `no-restricted-syntax` block を無変更のまま維持し、**色 selector のみを持つ新規 block**を `ui/**`/`layout/**`（既存 block と `files` が重複しない）へ追加する。**生 `<button>` selector は現行 scope のまま**、`src/components/ui/segmented-control.tsx` には触れない。**Plan Review round 1 是正（2026-09-06）**: 当初設計は「1 block を 2 つへ分離」だったが、ESLint flat config の rule merge が同一 `files` に一致する block 間で `no-restricted-syntax` を完全置換すること（selector 配列を merge しない）を Opus が実測で発見し、分離設計は `features/**`・`patterns/**` の色検出を壊す実害が確認されたため「追加方式」へ是正した（詳細は「S2 実測」参照）。

## Workflow State

- Phase: implementing
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 3aa0e8a
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
S1（TanStack Router 生成設定の統一）と S3（旧定数名同期）は単独なら R1〜R2 相当（developer tooling / reference-only doc + 現行契約 doc、runtime・DB・DTO・operator 画面に非接触）。S2（eslint palette 外色 ban の `files` glob 拡張、既存 block 無変更 + 新規 block 追加）は `eslint.config.js` を変更し、これは DEV_WORKFLOW Verification Gates 「Frontend」行 `npm run lint` が直接実行する gate 定義そのものである。DEV_WORKFLOW Risk Tiers に「glob のみの拡張は R2 に留める」といった明示の切り下げ規定は無く、一般則「uncertain between R2 and R3, choose R3 when the change touches ... a workflow gate」がそのまま適用される。加えて本件は「既存 block を無変更に保ちつつ色 selector だけを新規 block で拡張する」という block 間の切り分け作業であり、起票時の実測（下記「S2 実測」参照）で当初の「2 block 分離」設計が `files` 重複を通じて色検出を壊す実害を実際に発生させることを確認した——ESLint の rule merge が同一 `files` の block 間で `no-restricted-syntax` を完全置換する非自明な挙動が根にあり、gate の enforcement surface（何が lint 対象になるか）を変える変更である以上、⑪ packet の S3〈`doc-consistency-check.sh` PK4 判定ロジック変更〉と同型に「gate のカバレッジ・分離が意図どおりか」を独立 2 パスで確認する価値がある。よって R3 を維持し、Contract Audit 節の「Double audit: for R4 and workflow gate changes, run the Contract Audit twice in independent contexts」を S2 に適用する。S1/S3 は単独なら R1〜R2 相当（Review Focus で明記）。

## Goal

Goal Invariant:

### 最小完了条件

- S1: TanStack Router の route 生成設定が単一の `tsr.config.json` に統一され、`npm run generate:routes`（CLI）と `npx vite build`（vite plugin）が同一の `src/routeTree.gen.ts` を生成する（是正後も維持、Contract Probe / AC3-AC4 で再検証）。
- S2: `eslint.config.js` の既存 block（palette 外色 selector と生 `<button>` selector が同居、`features/**`・`patterns/**`）は完全に無変更のまま、色 selector 専用の新規 block（`ui/**`・`layout/**`、既存 block と `files` が重複しない）が追加される。拡張後の色 selector は違反 0 件で `npx eslint .` が exit 0 になり、`src/components/ui/segmented-control.tsx` には一切触れない。
- S3: `docs/design-system/reference/mockup-d-lists.html` / `docs/design-system/01-decision-rules.md` / `docs/function-design/50-ui-product-list.md` / `docs/function-design/73-ui-stocktake.md` の旧定数名 `PRODUCT_PER_PAGE_OPTIONS` が現行定数名 `LIST_PER_PAGE_OPTIONS`（`src/components/patterns/list-per-page.ts`）へ同期される。

### 失敗定義

- S1: 是正後に CLI と vite plugin の生成物が乖離する、または CLI 経路（`.npmrc` `ignore-scripts=true` 下で `npm run generate:routes` を明示実行する以外に worktree で routeTree を作れない唯一の経路）が壊れる。
- S2: 是正後も既存の検出力が劣化する（`features/**`・`patterns/**` の色 literal 検出が新規 block 追加によって silently 消える——「2 block 分離」設計で実際に起きた regression、または `ui/**`・`layout/**` で色 literal を見逃す）、または `files` 重複により生 `<button>` selector が `ui/**`/`layout/**` に波及し `segmented-control.tsx` 等の既存 primitive を誤検出する、または glob 拡張が test file を誤って対象化し class 文字列 assert 等で false positive を起こす。
- S3: 是正後も 4 file のいずれかに旧定数名が残る、または置換が周辺の日本語文言・別識別子（`ProductPagination` 等）まで書き換えてしまう。

### 非目的

- S1: CLI script（`generate:routes` / `pretypecheck` / `prelint` / `pretest`）の撤去。下記「S1 判断材料」の通り、`.npmrc` `ignore-scripts=true` 下で `typecheck`/`lint`/`test` が routeTree を得る唯一の経路であり、撤去は他 gate を壊す。
- S2: 視覚が変わり得る palette 色の是正（今回の棚卸しで該当 0 件、上記「S2 実測」参照）。生 `<button>` selector の scope 拡張、`src/components/ui/segmented-control.tsx` を含む `ui/**`/`layout/**` の DOM/実装変更（Coordinator ruling、primitive 層の生 `<button>` は正当）。`eslint.config.js` の barrel 禁止 block（`src/components/patterns/index.ts` / `src/components/ui/index.ts`）自体の書き換え。
- `app-router.ts`（Lane 4 PR #40 が改修中）/ `src/lib/bindings.ts`（(d) PR #41 が再生成済み）への接触。新規 runtime 依存の追加。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-06、worktree `/tmp/claude-1000/hyg2`、branch `agent/hygiene-batch-config`、origin/main `07302b5` 起点。すべて本 packet 起草者が `npm ci --ignore-scripts` 後に rg/diff/eslint で確認）

### S1 実測

- 現状: `vite.config.ts:12` が `tanstackRouter({ target: "react", autoCodeSplitting: true })`（inline options）で route 生成を行い、`package.json` `generate:routes` スクリプトは `tsr generate`（CLI、`tsr.config.json` なし = schema 既定値で実行）。2 系統が同一設定を共有せず個別に決め打ちしている状態を実測確認（`fd` で `tsr.config.json` 不在を確認）。
- **判断材料（実測）**: `.npmrc` の `ignore-scripts=true` は npm の pre/post lifecycle hook を止めるため、`npm run typecheck` / `npm run lint` / `npm run test` の `pretypecheck` / `prelint` / `pretest`（いずれも `npm run generate:routes` を呼ぶ）は自動発火しない。`npm run generate:routes` は「意図して明示実行するスクリプト自体」であり ignore-scripts 下でも実行される（npm 仕様: 明示 run-script の対象スクリプト自体は実行されるが、その pre/post hook は実行されない）。一方 vite plugin は `vite dev` / `vite build` の実行時にのみ route を生成する。したがって `ignore-scripts=true` の fresh worktree で `typecheck`/`lint`/`test` 単体を実行する場合、`npm run generate:routes` の明示実行（またはその手動呼び出し）が routeTree を用意する唯一の経路であり、CLI script の撤去はこの経路を壊す（S1 非目的に反映）。
- **生成物同一性の実測**（新規）: `npm ci --ignore-scripts` 後、`npm run generate:routes`（CLI、tsr.config.json なし）で生成した `src/routeTree.gen.ts`（831 行）を保存 → 削除 → `npx vite build`（vite plugin、`autoCodeSplitting: true` 明示）で再生成 → `diff` の exit code 0（byte-identical）。
- **`autoCodeSplitting` は生成物の内容に影響しないことの確認（Plan Review P2-4 是正）**: `node_modules/@tanstack/router-generator/dist/esm/config.js:53` は `autoCodeSplitting: z.boolean().optional()`（`.default(...)` なし）で、generator 自体はこの値を分岐条件に使わない。唯一の consumer は `node_modules/@tanstack/router-plugin/dist/esm/core/router-composed-plugin.js:16-17`（`if (userConfig.autoCodeSplitting) result.push(...routerCodeSplitter)`）で、vite plugin が code-splitter サブ plugin を bundle に組み込むかどうかを決めるだけであり、CLI（`tsr generate`）には対応する consumer が存在しない。生成物中に `.lazy` import が 0 件（`rg -c lazy` 両ファイルとも 0）なのはこのため（file ベースの lazy route splitting 自体を本 project が使っていないからではなく、`autoCodeSplitting` が `routeTree.gen.ts` の内容そのものに一切関与しないため）。**旧稿の「`.lazy.tsx` route を追加すると乖離しうる」という判断材料は誤りだったため撤回する**（Plan Review Opus P2-4 指摘、ソース実読で確認）。
- **CLI が `tsr.config.json` を merge 可能なことの確認**: `node_modules/@tanstack/router-generator/dist/esm/config.js` の `getConfig()` は `configDirectory` 直下の `tsr.config.json` を読み `{...fileConfig, ...inlineConfig}` で merge する。`@tanstack/router-plugin` の `core/config.js` は同じ `getConfig` を re-export しており（vite plugin の inline options が `inlineConfig` として上書きに使われる）、CLI・plugin いずれの経路も同一の `tsr.config.json` を土台にできることをソース実読で確認済み。
- **裁定（小裁定）**: 現状で byte-identical であることは実測済みだが、これは `target`（CLI 既定値 `"react"` と plugin 明示値 `"react"` が偶然一致）という 1 条件に依存した「たまたま」の一致であり、将来 `target` を片方だけ変更した場合に無言で乖離しうる（`autoCodeSplitting` は上記の通り生成物の内容には無関係、consolidation は bundling 挙動の単一化としては引き続き有意義だが byte-identity の懸念要因ではない）。「CLI script 撤去」案は上記判断材料により却下（ignore-scripts 下の唯一の生成経路を失う）。「tsr.config.json 明示化」案を採用: `vite.config.ts` の inline options 2 個（`target: "react"`, `autoCodeSplitting: true`）をそのまま `tsr.config.json` へ移し、`vite.config.ts` 側は `tanstackRouter()`（引数なし）にする。値は現状の実効値を 1 文字も変えない最小移動（ponytail: 新しい判断は増やさない、既存 2 値を 1 箇所にまとめるだけ）。`vite.config.ts` に `target`/`autoCodeSplitting`/`routesDirectory`/`generatedRouteTree` 等のいずれの router 生成オプションも残さないことを完了条件とする（`getConfig()` は `{...fileConfig, ...inlineConfig}` で inline が勝つため、1 つでも inline options が残ると `tsr.config.json` は単一情報源にならない）。

### S2 実測

- 対象 block: `eslint.config.js:78-97`（`no-restricted-syntax` に palette 外色 selector と 生 `<button>` selector の 2 つが同居、`files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]` / `ignores: [...*.test.{ts,tsx}]`）。**両 selector は同一 block の `files`/`ignores` を共有するため、素朴に glob を拡張すると 2 selector が同時に拡張される。**
- **既存違反の棚卸し（両 selector を仮拡張して実測）**: `files`/`ignores` に `src/components/ui/**/*.{ts,tsx}` / `src/components/layout/**/*.{ts,tsx}`（と対応する `*.test.{ts,tsx}` ignore）を一時追加し `npx eslint .` を実行 → **1 件**、`src/components/ui/segmented-control.tsx:51` の生 `<button>`（palette 色 selector の hit は **0 件**）。仮拡張は実測後に repo 状態を元に戻し `git status --porcelain` で復元確認済み。
- **Coordinator ruling（2026-09-06）**: `src/components/ui/**` は Button 自体（`button.tsx`）を含む primitive 層であり、生 `<button>` の実装は正当（raw-button ban の scope がそもそも `features/**`/`patterns/**` に限定されているのはこのため）。Backlog:149 は palette 色 ban の `files` 拡張であり、生 `<button>` ban の拡張ではない。よって `segmented-control.tsx` には触れず、色 selector のみ拡張、生 `<button>` selector は現行 scope（`features/**`/`patterns/**`）のまま維持する。
- **「2 block 分離」設計は誤り（Plan Review Opus P1-1、実装前に検出）**: 当初「`no-restricted-syntax` を 2 block へ分離し、色 block の `files` は `features/**`・`patterns/**`・`ui/**`・`layout/**`、button block の `files` は `features/**`・`patterns/**` のまま」という設計を実測したところ、ESLint flat config の `rulesSchema.merge`（`node_modules/eslint/lib/config/flat-config-schema.js:450-506`）は同一 `ruleId`（`no-restricted-syntax`）を後方 block の値で完全に置換する（selector 配列を merge しない）ことをソース実読で確認した。`features/**`・`patterns/**` は 2 block 双方の `files` に一致するため、後方の button block（`no-restricted-syntax` の値が `["error", {button selector}]` で length 2、length 1 でないため後方が丸ごと勝つ）が前方の色 block の結果を上書きし、`features/**`・`patterns/**` の色 literal 検出が silently 消える。**実測で再現**: `src/features/backup-restore/BackupRestorePage.tsx` に `const __probeColor = "bg-red-500";` を一時注入 → 分離設計下では `npx eslint .` が **exit 0**（`no-unused-vars` のみ検出、色 selector は検出されない）。probe は復元し `git status --porcelain` で clean を確認済み。
- **是正した設計（追加方式）**: 既存 block（`eslint.config.js:78-97`）は**完全に無変更のまま維持**し、`files` が重複しない新規 block を追加する: `files: ["src/components/ui/**/*.{ts,tsx}", "src/components/layout/**/*.{ts,tsx}"]`（既存 block の `features/**`・`patterns/**` と重複しない）、`ignores` に対応する `*.test.{ts,tsx}` を含め、`rules` は色 selector のみ（生 `<button>` selector は含めない）。
- **追加方式の実測**: 上記設計を適用した状態で `npx eslint .` → **exit 0**（`segmented-control.tsx` は対象外のまま検出されない）。以下 3 つの実測で正しさを確認:
  - **SC8 回帰確認（既存 block が無変更で機能すること）**: `BackupRestorePage.tsx`（`features/**`）へ同じ `bg-red-500` literal を再注入 → **exit 1、色 selector が検出**（既存 block は触っていないため当然だが、「2 block 分離」設計で実際に壊れていた箇所なので明示的に再確認した）。probe は復元済み。
  - **mutant B（`ui/**` 内に palette 外色 literal を注入）**: `segmented-control.tsx` に一時的に `probeClassName = "bg-red-500"` prop を追加すると `npx eslint .` は **exit 1、該当 2 箇所を色 selector が検出**。新規 block の拡張が実効的であることの確認。probe は byte-for-byte 復元済み（`git diff` で無変更確認）。
  - **生 `<button>` selector の非重複確認（静的、動的 mutant の代替）**: 「既存 block の `files` を一時的に `ui/**`/`layout/**` へ拡張する」動的 mutant を試したところ、新規 block（後方に位置し色 selector のみ、length 2）が merge 時に既存 block（前方）の結果を完全上書きし、button 検出自体が消える（`npx eslint .` は exit 0 のまま）という別の非自明な相互作用を確認した——2 block が overlap すればどちらの方向でも起きる ESLint 側の一般的挙動であり、動的 probe よりも「2 block の `files` が重複しない」ことを直接検査する静的チェックの方が正確な oracle になる。よって生 `<button>` selector の非拡張確認は静的チェック（`rg -Fc` で該当 selector 文字列が既存 block にのみ 1 箇所存在し新規 block に存在しない）を正式な oracle として採用する（Matrix SC4/SC5 参照）。
- **baseline 数値**: `rg -Fc '<button' src/components/ui/segmented-control.tsx` = 1（是正対象ではなく現状維持の参考値）/ `rg -Fc 'files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]' eslint.config.js` = 1 / `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 0 / `rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 0 / 追加方式適用後の `npx eslint .` = exit 0 / SC8 probe = exit 1・色 selector 検出 / mutant B = exit 1・2 error。すべての一時変更は復元後 `git status --porcelain` で clean を確認済み。

### S3 実測

- Backlog:130 は `docs/design-system/reference/mockup-d-lists.html:110` と記載するが、実測では現在の行番号は **96 行目**（`rg -n 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = `96:...`）。Lane 3（PR #34、commit `1d44ba2`）が同 mockup file を編集した際に行がずれたと見られる（Backlog:130 起票後の file 変更、`git log --oneline -- docs/design-system/reference/mockup-d-lists.html` で `1d44ba2` が該当編集の直近 commit と確認）。行番号は実測値（96）を正として Scope に記載する。
- 現行定数名は `src/components/patterns/list-per-page.ts:1` `export const LIST_PER_PAGE_OPTIONS = [50, 100, 200] as const;`（`rg` で実在確認）。`git log -p --follow` で `LIST_PER_PAGE_OPTIONS` は `1d44ba2`（Lane 3、2026-09-05）で新規導入され、旧名 `PRODUCT_PER_PAGE_OPTIONS` から改名されたことを確認。
- 旧定数名 `PRODUCT_PER_PAGE_OPTIONS` の repo 全体 hit（node_modules 除く）: mockup 対象 1 件（`docs/design-system/reference/mockup-d-lists.html:96`）の他に、`docs/archive/plans/**` 6 file（archived packet、D-050 の non-retroactive 原則により対象外）+ **現行 tracked doc 3 file**: `docs/Plans.md:18`（`直近の完了` PR #30 の履歴記述、その PR 当時の名前として正しいため対象外）/ `docs/design-system/01-decision-rules.md:447` / `docs/function-design/50-ui-product-list.md:63` / `docs/function-design/73-ui-stocktake.md:220`。
- **優先度の是正（Plan Review Opus P2-5）**: mockup は D-080 で reference-only、しかし `01-decision-rules.md:447` / `50-ui-product-list.md:63` / `73-ui-stocktake.md:220` の 3 file は「現在の契約」を説明する現役ドキュメントであり Lane 3 の改名に追随していない stale 参照——mockup（reference-only）より優先度が高い。旧稿は mockup 1 file のみを Scope に入れ 3 file を Backlog 新規行（`docs/Plans.md:132`）へ先送りしていたが、優先順位が逆転していたため撤回する。3 file を S3 の Scope へ統合し、Backlog:132 の新規行は削除する（`docs/Plans.md:18` の歴史的記述は D-050 non-retroactive によりそのまま対象外）。
- **baseline 数値**: `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 1、`docs/design-system/01-decision-rules.md` = 1、`docs/function-design/50-ui-product-list.md` = 1、`docs/function-design/73-ui-stocktake.md` = 1（4 file 合計 4）/ `rg -Fc 'LIST_PER_PAGE_OPTIONS'` は 4 file とも 0。

## Scope

- **S1 TanStack Router 生成設定を `tsr.config.json` へ統一**: 新規 `tsr.config.json`（repo root）に `{"target": "react", "autoCodeSplitting": true}` を作成し、`vite.config.ts:12` の `tanstackRouter({ target: "react", autoCodeSplitting: true })` を `tanstackRouter()`（引数なし、他 plugin 引数の並びは変更しない）へ置換する。値は現状の実効値からの変更なし（既存 2 値を 1 箇所へ移動するのみ、新しい設定判断は追加しない）。完了条件: `rg -Fc '"target": "react"' tsr.config.json` = 1、`rg -Fc '"autoCodeSplitting": true' tsr.config.json` = 1、`rg -c 'autoCodeSplitting|routesDirectory|generatedRouteTree' vite.config.ts` = 0（`vite.config.ts` に router 生成オプションを一切残さない、`getConfig()` の inline-wins merge により 1 つでも残ると単一情報源が崩れる）。是正後、`npm run generate:routes`（CLI）と `npx vite build`（plugin）を再実行し `src/routeTree.gen.ts` が byte-identical であることを `diff` exit code 0 で再確認する（AC3）。
- **S2 eslint palette 外色 ban の `files` glob 拡張（生 `<button>` ban は現行 scope のまま）**: `eslint.config.js:78-97` の既存 block は**完全に無変更のまま維持**する。色 selector（palette 外色 literal ban）専用の新規 block を、**既存 block の直後・barrel 禁止 block（`eslint.config.js:101-102`）より前**に挿入する: `files: ["src/components/ui/**/*.{ts,tsx}", "src/components/layout/**/*.{ts,tsx}"]`（既存 block の `features/**`・`patterns/**` と重複しない）、`ignores` に対応する `*.test.{ts,tsx}` を含め、`rules` は色 selector のみ（生 `<button>` selector は含めない — ESLint flat config の rule merge は同一 `files` に一致する block 間で `no-restricted-syntax` を完全置換するため、`files` を重複させないことが必須。起票時実測「2 block 分離は誤り」参照）。`src/components/ui/segmented-control.tsx` には一切触れない。**挿入位置が逆（barrel block より後ろ）だと `ui/index.ts` について barrel の re-export 禁止が新規 block の色 selector に置換され silently 消える**——起票時実測で両方向を再現済み（AC14 参照）。完了条件: `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0、新規 block にのみ出現）、`rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0、新規 block にのみ出現）、既存 block の `files`/`ignores`/`no-restricted-syntax` 文字列は無変更、`npx eslint .` が exit 0（`segmented-control.tsx` は検出されない）、新規 block の `files` 出現行が barrel block の `files` 出現行より小さい（AC14）。**既知の P3（Coordinator 記録済み、是正不要、本 lane 起源ではない）**: 新規 block の `files`（`src/components/ui/**`）は barrel 禁止 block とも重複するため `ui/index.ts` という 1 file 限定で色 selector が barrel selector に置換される（barrel block が後方のため。`ui/index.ts` は現状不在で barrel block 自体が作成を禁止するため実害はない）。同根の重複は**既存 block**（`patterns/**`）と barrel block の間にも `src/components/patterns/index.ts` について既に存在する（本 lane 以前からの pre-existing 状態、起票時実測で確認済み——`patterns/index.ts` に色 literal を置いても現状の `npx eslint .` は検出しない。本 lane はこれを是正しない）。
- **S3 旧定数名の同期（mockup + 現行契約 doc 3 file、Plan Review Opus P2-5 で Scope 拡大）**: `docs/design-system/reference/mockup-d-lists.html:96`（起票時実測で確認した実際の行番号、Backlog:130 記載の `:110` は stale）/ `docs/design-system/01-decision-rules.md:447` / `docs/function-design/50-ui-product-list.md:63` / `docs/function-design/73-ui-stocktake.md:220` の `PRODUCT_PER_PAGE_OPTIONS` を `LIST_PER_PAGE_OPTIONS` へ `sd -F -- 'PRODUCT_PER_PAGE_OPTIONS' 'LIST_PER_PAGE_OPTIONS' <file>` で置換する（4 file とも 1 箇所のみの literal 置換、周辺の日本語文言・`ProductPagination` 等の別識別子は変更しない）。完了条件: `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html docs/design-system/01-decision-rules.md docs/function-design/50-ui-product-list.md docs/function-design/73-ui-stocktake.md` の合計が 0（baseline 4、`docs/Plans.md:18` の歴史的記述は対象外で維持）。`docs/Plans.md` の Backlog 新規行（`:132`）は本 Scope への統合により削除する。

## Non-scope

- CLI script（`generate:routes` / `pretypecheck` / `prelint` / `pretest`）の撤去（上記「S1 判断材料」参照、ignore-scripts 下の唯一の生成経路のため）。
- `tsr.config.json` へ `target` / `autoCodeSplitting` 以外の項目（`routesDirectory` / `quoteStyle` / `semicolons` / `routeFileIgnorePrefix` 等）を追加すること。現状どちらの経路も既定値のみに依存しており変更不要。
- palette 外色の hex → token 置換（今回の棚卸しで該当 0 件）。
- **`src/components/ui/segmented-control.tsx` への変更、および `ui/**`/`layout/**` の DOM 変更全般**（Coordinator ruling: primitive 層の生 `<button>` は正当、raw-button ban の scope はそもそも `features/**`/`patterns/**` 限定）。
- 生 `<button>` ban selector の scope 拡張（現行 `features/**`/`patterns/**` のまま）。
- `eslint.config.js` の barrel 禁止 block（`src/components/patterns/index.ts` / `src/components/ui/index.ts`）の変更（新規 block との glob 重複は既知 P3 として Scope に記録済み、barrel block 自体の書き換えはしない）。
- `app-router.ts`（Lane 4 PR #40 改修中）/ `src/lib/bindings.ts`（(d) PR #41 再生成済み）への接触。新規依存の追加。runtime 挙動の変更。

## Acceptance Criteria

- AC1（S1）: `tsr.config.json` が repo root に存在し `"target": "react"` と `"autoCodeSplitting": true` を含む — `rg -Fc '"target": "react"' tsr.config.json` = 1、`rg -Fc '"autoCodeSplitting": true' tsr.config.json` = 1
- AC2（S1）: `vite.config.ts` の router 生成 inline options が完全に除去される — `rg -Fc 'tanstackRouter({ target: "react", autoCodeSplitting: true })' vite.config.ts` = 0（baseline 1）かつ `rg -Fc 'tanstackRouter()' vite.config.ts` = 1（baseline 0）かつ `rg -c 'autoCodeSplitting|routesDirectory|generatedRouteTree|target' vite.config.ts` = 0（`tsr.config.json` が唯一の情報源であることの確認、`getConfig()` の inline-wins merge により残存があれば単一情報源にならない。`target` を含めるのは build target 等の無関係な語が現状存在しないことを実測確認済みのため、この grep が誤検出しないことも合わせて確認済み）
- AC3（S1）: 是正後に `npm run generate:routes`（CLI）と `npx vite build`（plugin）が生成する `src/routeTree.gen.ts` が byte-identical — `diff` exit code 0（起票時実測と同じ手順の post-change 再現）
- AC4（S1、Writer probe、負例、**必ず `$TMPDIR` 配下の 2 つの独立した使い捨てコピーで実行し worktree では実行しない**）: 1 つのコピー内で CLI・plugin を順番に実行してはならない——leg 1（CLI）が `target: "solid"` で `src/routes/**` 全 35 file に `import { createFileRoute } from '@tanstack/solid-router'` を書き込んだ状態のまま leg 2（`vite build`）を実行すると、既存 import との重複で `SyntaxError: Identifier 'createFileRoute' has already been declared` が発生し leg 2 が `routeTree.gen.ts` を生成する前に失敗する（起票時実測で確認済み）。是正: 独立した使い捨てコピー A・B を作成し、両方に同じ `tsr.config.json`（`target: "solid"`）を置く。**コピー作成は `cp -a` を使い、コピー先の `node_modules` が実体（symlink でない）であることを `[ -L <copy>/node_modules ]` で確認する**（symlink であれば `npm ci --ignore-scripts` をコピー内で実行して実体化してから probe する）。worktree の `node_modules` symlink を跨いだ `rm -rf` が本体を消した記録済み incident があるため、破棄（disposal）は必ずコピー配下のみを対象にする（`rm -rf <copy dir>`、本体には一切触れない）。コピー A では `npm run generate:routes`（CLI）のみを実行、コピー B では `npx vite build`（plugin）のみを実行する。コピー B の `vite build` は routeTree 生成後の code-splitter 変換段階で**同じ重複宣言 `SyntaxError`（route file 側に残る `@tanstack/react-router` からの import と、code-splitter が target: solid 用に注入する `@tanstack/solid-router` からの import が衝突する）**を起こし non-zero exit で終了する（`@tanstack/solid-router` パッケージの有無とは無関係——solid は code-splitter がサポートするターゲットであり、原因は import 重複であって未インストールではない。独立コピーでも同じ重複が発生する——起票時実測で確認済み）が、**routeTree.gen.ts はその失敗より前に書き出し済み**であり、これは生成物比較そのものとは無関係の後段失敗である。**oracle はコピー A・B の `src/routeTree.gen.ts` の `diff` の exit code のみ**とし、コピー B の `vite build` プロセス自体の exit code は pass/fail 判定に含めない（起票時実測: `diff` exit code 0 で byte-identical）。是正が正しく単一化されていれば両者は依然として byte-identical に揃って変化する。もし `vite.config.ts` に inline `target: "react"` が残っていれば（Scope 未適用の mutant）plugin 側だけ react のまま固定され乖離する。probe は 2 つの使い捨てコピー内で完結させ、実施後に両方とも破棄する（worktree 側は一切変更しない）。**restore oracle**: probe 実行後、worktree 側で `git status --short`（**`-- src/routes` 等の path 限定をせず tree 全体**）を確認し、Scope が意図する S1/S2/S3 の変更以外に差分が無いこと——特に `tsr.config.json` / `vite.config.ts` / `src/routeTree.gen.ts` に probe 由来の意図しない差分が無いことを確認して Implementation Results に記録する（`-- src/routes` だけの限定検査では、probe を誤って worktree 直下で実行し `tsr.config.json` 自体が汚染された場合を見逃す）
- AC5（S2）: `eslint.config.js` の既存 block（`files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]`）が完全に無変更のまま残る — `rg -Fc 'files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]' eslint.config.js` = 1、`rg -Fc "JSXOpeningElement[name.name='button']" eslint.config.js` = 1（既存 block にのみ 1 箇所、新規 block には出現しない。`-F` は literal 文字列比較のため `[`/`]` をバックスラッシュで escape しないこと——escape すると `-F` はバックスラッシュ自体を literal 文字として探すため常に 0 件になる、起票時実測で確認済み）
- AC6（S2）: 色 selector 専用の新規 block が追加され、`files`/`ignores` が既存 block と重複しない — `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0、新規 block にのみ出現）、`rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 1（baseline 0、新規 block にのみ出現）、`rg -Fc 'src/components/ui/**/*.test.{ts,tsx}' eslint.config.js` = 1 かつ `rg -Fc 'src/components/layout/**/*.test.{ts,tsx}' eslint.config.js` = 1（`ignores` が両方存在することの確認——`src/components/layout` は現状 palette 外色の実例が 0 件のため、`layout` の `ignores` 欠落は `npx eslint .` の exit code だけでは検出できず、この静的チェックが唯一の oracle になる）
- AC7（S2、**前提: `npm run generate:routes` を先に実行しておくこと**）: `npx eslint .` が exit 0（新規 block 追加後。`segmented-control.tsx` は検出されない）。`.npmrc` の `ignore-scripts=true` により `prelint`（`npm run generate:routes` 呼び出し）が自動発火しないため、`src/routeTree.gen.ts` が存在しない状態で `npx eslint .` を実行すると `src/lib/app-router.ts` 等の import 解決が失敗し無関係な lint error（`@typescript-eslint/no-unsafe-assignment` 等）が出る（起票時実測で確認済み）
- AC8（S2、Writer probe、負例、mutant B、前提は AC7 と同じ）: `ui/**`/`layout/**` 内の既存 non-test file（例 `segmented-control.tsx`）に一時的な palette 外色 literal（例 `bg-red-500`）を追加すると `npx eslint .` が exit 1 で色 selector がそれを検出することを確認してから byte-for-byte 復元する（新規 block の拡張が実効的であることの確認、起票時実測で再現済み、Matrix SC6 参照）
- AC9（S2、Writer probe、負例、SC8 回帰、前提は AC7 と同じ）: `src/features/**` の既存 non-test file（例 `BackupRestorePage.tsx`）に一時的な palette 外色 literal を追加すると `npx eslint .` が exit 1 で色 selector がそれを検出することを確認してから復元する（既存 block が新規 block 追加後も無変更で機能することの確認 — 起票時実測で「2 block 分離」設計はこれが exit 0 になり検出できないことが判明した箇所、Matrix SC8 参照）
- AC10（S3）: `docs/design-system/reference/mockup-d-lists.html` / `docs/design-system/01-decision-rules.md` / `docs/function-design/50-ui-product-list.md` / `docs/function-design/73-ui-stocktake.md` の旧定数名が新定数名へ置換される — `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' <4 file>` の合計が 0（baseline 4）、`rg -Fc 'LIST_PER_PAGE_OPTIONS' <4 file>` の合計が 4（baseline 0、`docs/Plans.md:18` は対象外で維持）
- AC11（全体）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/check-workflow-git.sh` がいずれも exit 0（ERROR 0）
- AC12（全体）: `npm run typecheck && npm run lint && npm run format:check && npm test && npm run build` が exit 0（S1/S2 は既存 gate に含まれる形で担保、新規 gate は追加しない）
- AC13（S3）: `docs/Plans.md` の Backlog に S3 用の重複行が存在しない — 旧 `:132`（3 file 停滞を Backlog 化した行）が削除されていることを確認する
- AC14（S2、Plan Review Opus P2）: 新規 block が barrel 禁止 block より前に置かれる — `rg -n 'src/components/ui/\*\*/\*\.\{ts,tsx\}' eslint.config.js`（新規 block の `files` 出現行）が `rg -n 'src/components/patterns/index.ts' eslint.config.js`（barrel block の `files` 出現行）より小さい。逆順だと `ui/index.ts` について barrel の再 export 禁止が新規 block の色 selector に置換され silently 消える（起票時実測で再現済み、Scope 参照）

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
| — | DEV_WORKFLOW.md Risk Tiers / Contract Audit (R3/R4) | なし（既決規定の適用のみ） | S1: 「CLI script 撤去」は ignore-scripts 下の唯一の生成経路を失うため却下、「tsr.config.json 明示化」を採用（起票時実測「S1 判断材料」参照）。実際に乖離しうるのは `target` のみ（`autoCodeSplitting` は生成物に無関係、Plan Review Opus P2-4）。S2: `no-restricted-syntax` は既存 block 無変更 + 新規 block 追加（分離ではなく追加、Plan Review Opus P1-1 — ESLint の rule merge は同一 `files` の block 間で完全置換するため分離は色検出を壊す）。S3: mockup（D-080 reference-only）より現行契約 doc 3 file の同期を優先（Plan Review Opus P2-5） | `tsr.config.json` / `vite.config.ts` / `eslint.config.js` / `mockup-d-lists.html` / `01-decision-rules.md` / `50-ui-product-list.md` / `73-ui-stocktake.md` | AC1-AC4 / AC5-AC9, AC14 / AC10, AC13 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes（本 packet の「起票時実測」節が一次情報。3 件とも DEV_WORKFLOW.md の既存規定の機械的適用 + ソース実読で完結し新規設計判断を含まない）
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: なし
- Assumptions and constraints: S1/S2/S3 は互いに独立した file を編集し footprint は互いに素
- Deferred design gaps, risk, and follow-up target: なし（Plan Review Opus P2-5 により S3 の他 3 file stale 参照は Scope へ統合済み、Backlog 先送りは撤回）
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
| 環境・再現性 | 適用: S1 の probe（AC4）は `target: "solid"` mutation が `src/routes/**` 35 file を破壊的に書き換え `target` を戻しても復旧しない（起票時実測で確認、`SyntaxError` で `tsr generate` が失敗する）ため、CLI・plugin の 2 leg を同一コピー内で順番に実行せず、`$TMPDIR` 配下の独立した使い捨てコピー A（CLI）・B（plugin）へ分離して実行し worktree では実行しない。コピーは `cp -a` で作成し `node_modules` が実体（symlink でない）であることを確認、破棄はコピー配下のみ。restore oracle は worktree 側の `git status --short`（tree 全体、`tsr.config.json`/`vite.config.ts`/`src/routeTree.gen.ts` を含む）= Scope 意図どおりの差分のみ | AC4 |

## Design Readiness

- Existing design docs are sufficient because: 3 件とも DEV_WORKFLOW.md「Risk Tiers」「Contract Audit (R3/R4)」の既存規定と D-080 の適用のみで、新規設計判断を要しない
- Source docs updated in this PR: なし（`docs/Plans.md` の Backlog/次の行動同期を除く）
- Design gaps intentionally deferred: なし（S3 の他 3 file stale 参照は Scope へ統合済み）
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

- S1 の unverified premise (a): 「vite plugin と CLI `tsr generate` は同一設定なら同一生成物を出す」 → 実験: worktree `/tmp/claude-1000/hyg2` で `npm ci --ignore-scripts` 後、CLI 実行結果（831 行）と `npx vite build` 実行結果の `src/routeTree.gen.ts` を保存し `diff` → 結果: exit code 0（byte-identical）。post-change（`tsr.config.json` 導入後）の再検証は AC3（回帰確認）と AC4（Writer probe、使い捨てコピーでの `target` mutation）に記録する。
- S1 の unverified premise (b): 「`autoCodeSplitting` は生成物の内容に影響しない」 → 実験: `node_modules/@tanstack/router-generator/dist/esm/config.js:53` と `router-composed-plugin.js:16-17` をソース実読 → 結果: `autoCodeSplitting` の唯一の consumer は vite plugin composition（code-splitter サブ plugin の有無）であり generator 自体は分岐条件に使わない。CLI に対応する consumer は存在しない。
- S1 の unverified premise (c): 「`target: "solid"` mutation は `src/routes/**` を破壊的に書き換える」 → 実験: `$TMPDIR` 配下の使い捨てコピーで `tsr.config.json` の `target` を `"solid"` に変更し `npm run generate:routes` → 結果: `src/routes/**` 35 file に `import { createFileRoute } from '@tanstack/solid-router'` が追記される。`target` を `"react"` へ戻して再実行すると `SyntaxError: Identifier 'createFileRoute' has already been declared` で `tsr generate` 自体が失敗する（stale import が自動除去されない）。よって AC4 は worktree 外の使い捨てコピーでのみ実行する。
- S1 の unverified premise (d, Plan Review round 2 Opus P1): 「CLI・plugin の 2 leg を同一使い捨てコピー内で順番に実行しても比較できる」 → 実験: 1 つのコピーで `npm run generate:routes`（leg 1、target solid）を実行後、同じコピーで `npx vite build`（leg 2）を実行 → 結果: leg 1 が書き込んだ `import { createFileRoute } from '@tanstack/solid-router'` と route file 既存の import が重複し、leg 2 が `routeTree.gen.ts` を生成する前に `SyntaxError` で失敗する。是正: 独立した使い捨てコピー A（leg 1 のみ）・B（leg 2 のみ）に分離する → 結果: コピー B の `vite build` も code-splitter 変換段階で同じ重複宣言 `SyntaxError` により non-zero exit するが（**原因は route file が持つ `@tanstack/react-router` からの既存 import と code-splitter が target: solid 用に注入する import の重複であり、`@tanstack/solid-router` パッケージが node_modules に無いこととは無関係——solid は code-splitter がサポートするターゲットである。Plan Review round 3 で誤帰属を是正**）、`routeTree.gen.ts` はその失敗より前に書き出し済みで、コピー A・B の該当 file は `diff` exit code 0（byte-identical）。よって AC4 の oracle は `diff` のみとし、コピー B の `vite build` 自体の exit code は pass/fail に含めない。
- S2/S3: N/A — eslint / rg の決定的なツール挙動のみに依存し、外部ライブラリや OS/hardware の未検証前提はない（ただし ESLint flat config の rule merge 挙動は S2 実測で直接ソース確認済み、上記「S2 実測」参照）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| TanStack Router 生成設定の統一（S1） | `tsr.config.json` / `vite.config.ts` | `npm run generate:routes` vs `npx vite build` diff（AC3）+ Writer probe（AC4、使い捨てコピー） | non-scope（生成物比較のみ） |
| eslint palette 外色 ban の glob 拡張（生 `<button>` selector は不変、既存 block 無変更 + 新規 block 追加、S2） | `eslint.config.js`（追加方式） | `npx eslint .` exit code（AC7）+ mutant B（AC8）+ SC8 回帰（AC9） | non-scope（lint のみ） |
| 旧定数名同期（mockup + 現行契約 doc 3 file、S3） | `mockup-d-lists.html` / `01-decision-rules.md` / `50-ui-product-list.md` / `73-ui-stocktake.md` | `rg -Fc` baseline+delta（AC10） | non-scope（doc 文字列のみ） |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-06-hygiene-batch-2-config-reference.md](test-matrices/2026-09-06-hygiene-batch-2-config-reference.md)

- targeted tests: `npm run generate:routes && npx vite build`（S1、生成物 diff）/ `npm run generate:routes && npx eslint .`（S2、ignore-scripts 下では `prelint` が自動発火しないため `generate:routes` を明示先行させる）
- negative tests: S1 の `target` mutation probe（AC4、独立した 2 使い捨てコピー限定）、S2 の mutant B（`ui/**` へ palette 外色 literal 注入、AC8）、S2 の SC8 回帰 probe（`features/**` へ palette 外色 literal 注入、AC9）
- compatibility checks: S1 の post-change 生成物 diff（AC3、既存 route 構成が壊れないことを担保）、S2 既存 block の `files`/`ignores`/`no-restricted-syntax` 文字列無変更（AC5、`segmented-control.tsx` 等の既存 primitive が非接触のまま）、S2 新規 block の挿入順序（AC14、barrel block より前）
- data safety checks: 該当なし（DB 非接触）
- main wiring/integration checks: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/check-workflow-git.sh` の exit code（AC11）、frontend フル gate（AC12）

## Boundary / Wire Contract

N/A — JSON API / browser state / CSV / DTO / bindings / DB 互換のいずれにも触れない（`tsr.config.json` は build tooling 設定であり wire contract ではない）。

## Review Focus

- S1: `tsr.config.json` の値が現状の実効値（`target: "react"`, `autoCodeSplitting: true`）から 1 文字も変わっていないこと（新しい設定判断を持ち込んでいないこと）。「CLI script 撤去」を却下した判断材料（ignore-scripts 下の唯一の生成経路）が正確であること。AC4 の probe が worktree 内で実行されていないこと、コピーが `cp -a` で作成され `node_modules` が実体（symlink でない）であること、かつ CLI・plugin の 2 leg が独立した 2 コピーに分離されており同一コピー内で順番に実行していないこと（`git status --short` を tree 全体で確認した結果が Implementation Results に記録されていること）
- S2: 既存 block（`eslint.config.js:78-97`）の `files`/`ignores`/`no-restricted-syntax` 文字列が Scope 適用の前後で完全に無変更であること（`src/components/ui/segmented-control.tsx` を含む `ui/**`/`layout/**` の生 primitive が一切対象化されないこと、Coordinator ruling の反映）。新規 block の `files` が既存 block と重複していないこと（重複すると ESLint の rule merge により色 selector が消える、起票時実測「2 block 分離は誤り」参照）。新規 block が barrel 禁止 block より**前**に挿入されていること（AC14。逆順だと `ui/index.ts` の barrel 禁止が silently 消える）
- S2 は workflow gate 変更（`eslint.config.js`）のため Contract Audit を独立 2 パス（Double Audit）で実施すること（Sonnet fresh 1 パス + Opus 1 パス、それぞれ `eslint.config.js` の diff と mutant B/SC8 probe の記録を独立に読み、新規 block が既存 block と `files` 重複を持たないこと、block の挿入順序、`no-restricted-syntax` の rule merge 挙動を踏まえて安全であることを確認する）
- S2 の `rg -Fc` oracle は `-F`（literal 文字列）モードのため、`JSXOpeningElement[name.name='button']` 等の `[`/`]` をバックスラッシュで escape しないこと（escape すると常に 0 件になり oracle が機能しない、Plan Review round 2 Sonnet P2 の教訓）。AC7-AC9 の `npx eslint .` は事前に `npm run generate:routes` を実行していないと `routeTree.gen.ts` 不在で無関係な lint error が出ること
- S3: 行番号drift（Backlog:130 の `:110` → 実測 `:96`）の原因（Lane 3 `1d44ba2` の同 file 編集）が Implementation Results に記録されていること。4 file とも置換が `PRODUCT_PER_PAGE_OPTIONS` の完全一致のみで `ProductPagination` 等の別識別子・周辺の日本語文言を変更していないこと。`docs/Plans.md:18` の歴史的記述が対象外のまま維持されていること
- Non-scope に列挙した項目（CLI script 撤去、`tsr.config.json` の他項目追加、色 token 置換、barrel 禁止 block 自体の書き換え、`app-router.ts`/`bindings.ts`）が変更されていないこと

## Spec Contract

Contract ID: SPEC-HYG2-D1

- TanStack Router の CLI・vite plugin 生成物が単一 `tsr.config.json` を土台に同一であり続けること、eslint palette 外色 ban の拡張が既存 block を無変更のまま新規 block 追加でのみ行われ生 `<button>` selector の scope（primitive 層除外）を変えないこと、mockup + 現行契約 doc 3 file の定数名参照が現行契約と一致すること

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-HYG2-D1 | S1 | CLI vs plugin diff（AC3）+ `target` mutation probe（AC4、使い捨てコピー） | 単一化の実効性 | 起票時実測 + Implementation Results |
| SPEC-HYG2-D1 | S2 | `npx eslint .`（AC7）+ mutant B（AC8）+ SC8 回帰（AC9）+ 挿入順序 rg（AC14） | 追加方式の実効性 + primitive 層非接触 + block 挿入順序 + Double Audit | eslint + rg + Implementation Results |
| SPEC-HYG2-D1 | S3 | `rg -Fc` baseline+delta（AC10）+ Backlog 重複行削除確認（AC13） | 現行契約 4 file との一致 | rg |

## Data Safety

- what must not be committed: なし
- local-only paths: 該当なし
- synthetic-only paths: S1 の AC4 probe（`target` mutation）は `$TMPDIR` 配下の**独立した使い捨てリポジトリコピー 2 つ**（CLI 用・plugin 用）でのみ実行する（`src/routes/**` 35 file を破壊的に書き換え復旧不能になるため、起票時実測で確認済み。同一コピー内で 2 leg を順番に実行すると leg 1 の書き込みが leg 2 を失敗させるため分離が必須）。S2 の probe は repo tree 上の一時変更 + 復元のみ

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

- 具体的な適用: S1 は `tsr.config.json` に既存 2 値以外を追加しない（ponytail rung 1「そもそも要るか」— 未使用項目の先回り設定はしない）。AC4 probe は必ず `$TMPDIR` 配下の**独立した使い捨てコピー 2 つ**（CLI 用・plugin 用、`cp -a` で作成し `node_modules` が実体であることを確認、破棄はコピー配下のみ）で行い worktree では絶対に実行しない（`target: "solid"` は `src/routes/**` 35 file を破壊的に書き換え復旧不能になる。1 つのコピーで CLI→plugin の順に実行すると leg 1 の書き込みが leg 2 を失敗させ生成物比較ができない）。S2 は既存 block に一切触れず、`files` が重複しない新規 block を 1 つ、**barrel 禁止 block より前**に追加するだけ（`segmented-control.tsx` や他の `ui/**`/`layout/**` file には一切触れない — Coordinator ruling により生 `<button>` ban 側の scope 拡張は不要と確定済み。既存 block を「分離」する設計は ESLint の rule merge 挙動により色検出を壊すため採らない）。S3 は 4 file とも `PRODUCT_PER_PAGE_OPTIONS` の完全一致文字列置換（`sd -F`）のみで周辺文言・別識別子を書き換えない

## Implementation Results

(Fill after implementation.)

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

2026-09-06: Plan Review round 1 = Sonnet approve-with-P2、Opus reject。P1 = (1) S2「2 block 分離」設計が ESLint flat config の rule merge（`node_modules/eslint/lib/config/flat-config-schema.js:450-506`）により `features/**`・`patterns/**` の色検出を消す（実測で再現、是正: 追加方式へ変更 + Matrix SC8 新設）(2) AC4 の `target: "solid"` probe が `src/routes/**` 35 file を破壊的に書き換え復旧不能（実測で再現、是正: `$TMPDIR` 使い捨てコピー限定化 + restore oracle）。P2 = (3) Matrix SC2「would fail if」に build 失敗を追記（Sonnet） (4) S1 の `.lazy.tsx` 乖離根拠が誤り、`autoCodeSplitting` は生成物に無関係でソースで確認（Opus、実測で再現） (5) S3 の優先順位が逆転、mockup（reference-only）より現行契約 doc 3 file を優先しScope へ統合（Opus）。P3 = (6) S3b Backlog 重複行（`:132`）は item 5 で自動的に不要化、削除（Sonnet）。Coordinator 裁定 = 9 項目全件採用 → 本 commit で是正（S2 を追加方式へ、Matrix SC8 新設、AC4 を使い捨てコピー限定化 + restore oracle 追加、S1 rationale を `target` 限定へ訂正、S3 を mockup + 3 file へ拡大、Backlog:132 削除、Plans.md ⑫ 同期）。新規発見の P1/P2/P3 はすべて実測で再現確認済み（segmented-control.tsx への `bg-red-500` 注入 probe、`$TMPDIR` throwaway copy での `target: "solid"` 破壊的挙動再現、`autoCodeSplitting` の唯一の consumer が `router-composed-plugin.js:16-17` であることのソース確認）。次 round は Plan Reviewer 再確認待ち。

2026-09-06: Plan Review round 2 = Sonnet approve-with-P2、Opus reject（P1 1 件）。P1 = (1) AC4/Matrix SC2 の「1 コピー内で CLI→plugin を順に実行」設計は leg 1（target solid の CLI 実行）が `src/routes/**` へ書き込む重複 import により leg 2（`vite build`）が `routeTree.gen.ts` を生成する前に `SyntaxError` で失敗し比較不能（Opus、実測で再現）。是正: 独立した使い捨てコピー A（CLI のみ）・B（plugin のみ）に分離し、oracle をコピー A・B の `routeTree.gen.ts` の `diff` のみに限定（コピー B の `vite build` 自体は `@tanstack/solid-router` 不在により non-zero exit するが、これは routeTree 生成後の後段失敗であり pass/fail に含めない——実測で `diff` exit 0 を確認）。P2 = (2) 新規 block の挿入位置を barrel block より前と明記し AC14（行番号 rg 比較）を新設、逆順だと `ui/index.ts` の barrel 禁止が消えることを実測確認（Opus）(3) Matrix SC5 に `ignores` oracle を追記（Opus）(4) AC2 の残存 grep に `target` を追加（Opus、他の無関係な `target` 語が存在しないことも実測確認）(5) AC7/AC9 に `npm run generate:routes` の事前実行が必要である旨を明記（Opus、実測で確認——`routeTree.gen.ts` 不在だと無関係な lint error が出る）(6) `src/components/patterns/index.ts` も barrel block に pre-existing に重複していることを既知 P3 note へ追記（Opus、実測確認、本 lane 起源ではない）。Sonnet P2 = (7) `rg -Fc "JSXOpeningElement\[name.name='button'\]"` は `-F` モードでバックスラッシュが literal 文字として扱われ常に 0 件になる欠陥、packet AC5 + Matrix SC4 の 2 箇所を `rg -Fc "JSXOpeningElement[name.name='button']"`（escape なし）へ修正（実測で再現確認、他に該当パターンなし）。Sonnet P3 = (8) 表記ゆれ「実測で再現、is 是正:」の誤字を修正。Coordinator 裁定 = 8 項目全件採用 → 本 commit で是正。全項目 `$TMPDIR` throwaway copy 上で再現確認済み（worktree 非破壊）。

2026-09-06: Plan Review round 3 = Sonnet approve、Opus approve（P1 0）。Rally 収束。4 項目 + Sonnet P3 1 件を採用: (1) AC4 のコピー作成手順を明示——`cp -a` を使い `node_modules` が実体（symlink でない）であることを確認、破棄はコピー配下のみ（worktree の node_modules symlink を跨いだ `rm -rf` が本体を消した記録済み incident に基づく予防策）(2) Matrix SC5 / packet AC6 に `src/components/layout/**/*.test.{ts,tsx}` の `ignores` oracle を追加（`layout` は現状 palette 外色の実例が 0 件のため `npx eslint .` の exit code だけでは `layout` 側の `ignores` 欠落を検出できない）(3) コピー B の `vite build` 非 0 exit の原因を訂正——`@tanstack/solid-router` パッケージ不在ではなく、route file 側の既存 import と code-splitter が注入する import の重複が原因（solid は code-splitter がサポートするターゲット）。oracle（`diff` のみ、`vite build` 自体の exit code は判定外）は変更なし (4) restore oracle を `git status --short -- src/routes` から tree 全体の `git status --short` へ拡張し、`tsr.config.json` / `vite.config.ts` / `src/routeTree.gen.ts` への probe 由来の混入も検出できるようにした。Sonnet P3 = `docs/Plans.md:103` は変更しない（Coordinator が transition commit で同期する）。本 round は docs のみで実測不要（既存の起票時実測・round 1/2 実測がそのまま根拠）。

2026-09-07: Plan Review round 2 = Sonnet approve-with-P2（`rg -F` pattern の `\[` が常に 0 hit）+ Opus reject（P1: AC4 の 1 copy 連続 probe は leg 2 が `createFileRoute` 重複で必ず壊れる → 2 copy 分離 + diff のみ oracle。P2: 新 block は barrel block より前）→ 是正 `f043e44`。round 3 = Sonnet approve + Opus approve（P1 0。P2: copy は `cp -a` / layout `ignores` oracle。P3: 非 0 exit の帰属 / restore oracle）→ 最終小口 `58b0118` → Coordinator 行検分（`-F` バックスラッシュ bug の残存 0 を sweep）で Plan Gate 閉鎖。`plan-draft -> plan-gate -> plan-approved -> implementing` を Plans.md ⑫ 同期の本 commit に同乗。Plan Commit = `3aa0e8a`（plan-first commit）。Codex ロジックレビュー 1 回は §3.3 pending（2026-09-07 夜）。
