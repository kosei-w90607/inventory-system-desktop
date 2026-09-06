# Test Design Matrix: 衛生 batch 2（config / reference 系、⑫）

Plan Packet: [../2026-09-06-hygiene-batch-2-config-reference.md](../2026-09-06-hygiene-batch-2-config-reference.md)

## Risk

R3（S2 が `eslint.config.js` の `no-restricted-syntax`（`npm run lint` が実行する workflow gate 定義）の対象範囲を変更するため、DEV_WORKFLOW Risk Tiers の uncertain-default 規則で R3 とする。S1/S3 は単独なら R1〜R2 相当。runtime・DB・DTO・operator 画面には非接触のため L3 は非対象、本 Matrix は 3 件の config/lint/doc 自体の契約検査に限定する）。

## Contracts Under Test

- SC1（S1）: `tsr.config.json` が `"target": "react"` と `"autoCodeSplitting": true` を正しく宣言する
- SC2（S1）: `vite.config.ts` が inline options を持たず（`tanstackRouter()`）、`tsr.config.json` が両経路（CLI・vite plugin）の唯一の設定源になっている（単一化の実効性、mutation で乖離を検出できること）
- SC3（S1）: 是正後も CLI（`npm run generate:routes`）と vite plugin（`npx vite build`）が生成する `src/routeTree.gen.ts` が byte-identical（回帰確認）
- SC4（S2）: `eslint.config.js` の `files`/`ignores` 拡張が `*.test.{ts,tsx}` を正しく除外する（過剰検出なし）
- SC5（S2）: `eslint.config.js` の `files` 拡張が `src/components/ui/**` / `src/components/layout/**` の非 test file を正しく対象化する（検出力維持、生 `<button>` と palette 外色の両 selector）
- SC6（S2）: `segmented-control.tsx` の alias 置換後も DOM/role/props が不変（既存 test の regression 確認）
- SC7（S3）: `mockup-d-lists.html` の定数名参照が現行契約（`LIST_PER_PAGE_OPTIONS`）と一致する

## Failure Modes

- `tsr.config.json` の値が誤る、または未作成のまま `vite.config.ts` の inline options だけ除去され設定が失われる
- `vite.config.ts` の inline options が残存し、`tsr.config.json` を変更しても vite plugin 側の生成物に反映されない（単一化が名目だけで実効性がない）
- 是正後に CLI と plugin の生成物が乖離する（Goal Invariant S1 失敗定義そのもの）
- glob 拡張の `ignores` が `*.test.{ts,tsx}` を含まず、test file 内の class assert 文字列やダミー `<button>` で false positive が発生する
- glob 拡張の `files` が `ui/**`/`layout/**` の非 test file を実際には対象化せず、palette 外色や生 `<button>` の新規混入を検出できない（拡張が名目だけ）
- `segmented-control.tsx` の alias 置換で `key`/`type`/`aria-pressed`/`data-state`/`disabled`/`className`/`onClick` のいずれかが欠落し DOM/挙動が変わる
- mockup の定数名が旧名のまま残る、または置換が周辺の日本語文言まで書き換えてしまう

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 tsr.config.json 内容（S1） | 値の欠落・誤記 | static（`rg -Fc`） | `rg -Fc '"target": "react"' tsr.config.json` = 1 かつ `rg -Fc '"autoCodeSplitting": true' tsr.config.json` = 1 | いずれかの値が存在しない、または誤った値になる |
| SC2 単一化の実効性（S1） | inline options 残存 | Writer probe（mutation、`tsr.config.json` の `target` を一時的に `"solid"` へ変更） | `npm run generate:routes` と `npx vite build` を再実行し `diff` で比較。是正が正しければ両者は揃って変化し byte-identical のまま。probe 後に元の値へ復元し `diff` exit 0 を再確認 | `vite.config.ts` に inline `target: "react"` が残っていて plugin 側だけ変化せず両者が乖離する（`diff` exit 1） |
| SC3 生成物 byte-identical 回帰（S1） | 統一後に生成物が変わる | integration（CLI vs plugin diff） | 是正後（`tsr.config.json` 導入後）に `npm run generate:routes` の出力と `npx vite build` 生成物を保存し `diff` | `diff` exit 1（byte-identical でなくなる） |
| SC4 test file 除外（S2） | ignores 未拡張 | Writer probe（`ui/**`/`layout/**` 既存 `*.test.{ts,tsx}` へ一時的に palette 外色 literal を含む文字列 assertion を追加） | `npx eslint .` が exit 0 のまま（ignore が機能）であることを確認し probe を復元 | test file が対象化され `npx eslint .` が exit 1 になる（false positive） |
| SC5 非 test file 検出力（S2） | files 拡張が無効・alias 置換で検出力低下 | Writer probe（是正後の `segmented-control.tsx` から alias 置換を一時的に取り消し生 `<button` に戻す、または `ui/**`/`layout/**` 非 test file に一時的な palette 外色 literal を追加） | `npx eslint .` が exit 1 になることを確認し probe を復元 | mutant 適用後も `npx eslint .` が exit 0 のまま（検出力なし） |
| SC6 DOM/role 不変（S2） | alias 置換で props 欠落 | unit（既存 `segmented-control.test.tsx` 全 case、無変更） | 既存の `getByRole("button", ...)` 系 assertion（`:38,39,67,68,112` 等）が alias 置換後も無変更で全 PASS | alias 置換で `type`/`aria-pressed`/`data-state`/`disabled`/`onClick` 等のいずれかが欠落し既存 test が壊れる |
| SC7 mockup 定数名一致（S3） | 旧名残存・誤置換 | static（`rg -Fc`） | `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 0 かつ `rg -Fc 'LIST_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 1 | 旧名が残る、または新名が期待箇所に現れない |

## Mutation Oracle Notes

- SC1 単独（値の静的存在確認のみ）だと `tsr.config.json` を作成しつつ `vite.config.ts` の inline options を残す mutant（統一が名目だけ）を見逃す。SC2 の mutation probe（`target` を変えて両経路の追随を見る）と対にすることで、`tsr.config.json` が実際に両経路の設定源になっていることを検証する
- SC3 は SC1/SC2 の結果として「現状の実効値」が変わっていないことを保証する回帰確認であり、起票時実測で行った pre-change 測定と同じ手順を post-change でも再現する。SC2 の mutation probe は一時的に値を変えて挙動を確認した後に元の値へ復元するため、SC3 は probe 復元後の状態で実行する
- SC4/SC5 は対で運用する（⑪ SC1/SC2 と同型のパターン）。SC5 単独だと glob 拡張自体を全く適用しない mutant（`files` を変更しない）を、`npx eslint .` が拡張前と同じ結果（既存違反 1 件が残ったまま「起票時実測」で確認済みの状態）になることでしか検出できず紛らわしいため、SC4（test file 除外）との対で「拡張が実際に効いている」ことを積極的に確認する
- SC6 は新規 test を追加せず、既存 `segmented-control.test.tsx` の全既存ケースが無変更で PASS することをもって確認する。alias 置換が `button.tsx` の前例と同じパターンであることは Review Focus でも確認する
- SC7 は空集合 oracle を避けるため baseline（旧名 1 件）→ delta（旧名 0 件・新名 1 件）の対で確認する

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC1-SC3 は `npm run generate:routes` + `npx vite build` + `diff`（S1）、SC4-SC6 は `npx eslint .` + vitest（S2）、SC7 は `rg -Fc`（S3）。AC11（`doc-consistency-check.sh --target plan` / `check-workflow-git.sh` の exit code）と AC12（既存 frontend フル gate）は Plan Packet 側の完了条件として記載済みで、本 Matrix には独立行を立てない。
