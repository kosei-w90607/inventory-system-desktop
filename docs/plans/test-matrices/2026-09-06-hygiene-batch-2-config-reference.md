# Test Design Matrix: 衛生 batch 2（config / reference 系、⑫）

Plan Packet: [../2026-09-06-hygiene-batch-2-config-reference.md](../2026-09-06-hygiene-batch-2-config-reference.md)

## Risk

R3（S2 が `eslint.config.js` の `no-restricted-syntax`（`npm run lint` が実行する workflow gate 定義）を 2 block へ分離し、色 selector の対象範囲を変更するため、DEV_WORKFLOW Risk Tiers の uncertain-default 規則で R3 とする。glob のみの拡張を R2 へ切り下げる明示規定は DEV_WORKFLOW に無く、2 selector 間の切り分け自体に誤り（生 `<button>` selector を誤って `ui/**`/`layout/**` へ波及させる）が起票時の mutant 実験で実際に組めることを確認したため R3 を維持する。S1/S3 は単独なら R1〜R2 相当。runtime・DB・DTO・operator 画面には非接触のため L3 は非対象、本 Matrix は 3 件の config/lint/doc 自体の契約検査に限定する）。

## Contracts Under Test

- SC1（S1）: `tsr.config.json` が `"target": "react"` と `"autoCodeSplitting": true` を正しく宣言する
- SC2（S1）: `vite.config.ts` が inline options を持たず（`tanstackRouter()`）、`tsr.config.json` が両経路（CLI・vite plugin）の唯一の設定源になっている（単一化の実効性、mutation で乖離を検出できること）
- SC3（S1）: 是正後も CLI（`npm run generate:routes`）と vite plugin（`npx vite build`）が生成する `src/routeTree.gen.ts` が byte-identical（回帰確認）
- SC4（S2）: `no-restricted-syntax` が色 selector block と生 `<button>` selector block の 2 つに分離され、色 selector block のみ `files`/`ignores` が `src/components/ui/**` / `src/components/layout/**`（と対応する `*.test.{ts,tsx}` ignore）へ拡張される（静的構造確認）
- SC5（S2）: 色 selector の拡張が実効的に機能する（`ui/**`/`layout/**` の非 test file 内の palette 外色 literal を検出する）
- SC6（S2）: 生 `<button>` selector の block は拡張前の scope（`src/features/**` / `src/components/patterns/**`）のまま不変であり、`ui/**`/`layout/**` の生 primitive（`segmented-control.tsx` 等）を対象化しない
- SC7（S3）: `mockup-d-lists.html` の定数名参照が現行契約（`LIST_PER_PAGE_OPTIONS`）と一致する

## Failure Modes

- `tsr.config.json` の値が誤る、または未作成のまま `vite.config.ts` の inline options だけ除去され設定が失われる
- `vite.config.ts` の inline options が残存し、`tsr.config.json` を変更しても vite plugin 側の生成物に反映されない（単一化が名目だけで実効性がない）
- 是正後に CLI と plugin の生成物が乖離する（Goal Invariant S1 失敗定義そのもの）
- block 分離が行われず、色 selector の glob 拡張と同時に生 `<button>` selector まで拡張されてしまい `ui/**`/`layout/**` の生 primitive（`segmented-control.tsx` 等）が誤検出される
- 色 selector block の `files` 拡張が `ui/**`/`layout/**` の非 test file を実際には対象化せず、palette 外色の新規混入を検出できない（拡張が名目だけ）
- mockup の定数名が旧名のまま残る、または置換が周辺の日本語文言まで書き換えてしまう

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 tsr.config.json 内容（S1） | 値の欠落・誤記 | static（`rg -Fc`） | `rg -Fc '"target": "react"' tsr.config.json` = 1 かつ `rg -Fc '"autoCodeSplitting": true' tsr.config.json` = 1 | いずれかの値が存在しない、または誤った値になる |
| SC2 単一化の実効性（S1） | inline options 残存 | Writer probe（mutation、`tsr.config.json` の `target` を一時的に `"solid"` へ変更） | `npm run generate:routes` と `npx vite build` を再実行し `diff` で比較。是正が正しければ両者は揃って変化し byte-identical のまま。probe 後に元の値へ復元し `diff` exit 0 を再確認 | `vite.config.ts` に inline `target: "react"` が残っていて plugin 側だけ変化せず両者が乖離する（`diff` exit 1） |
| SC3 生成物 byte-identical 回帰（S1） | 統一後に生成物が変わる | integration（CLI vs plugin diff） | 是正後（`tsr.config.json` 導入後）に `npm run generate:routes` の出力と `npx vite build` 生成物を保存し `diff` | `diff` exit 1（byte-identical でなくなる） |
| SC4 block 分離の静的構造（S2） | 分離されていない、または誤った block に glob が入る | static（`rg -Fc`） | `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 1 かつ `rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 1（色 selector block）、かつ生 `<button>` selector block の `files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]` 文字列が無変更で 1 件存在 | glob が両方の selector に同時適用される、または生 `<button>` block の文字列が変わる |
| SC5 色 selector 検出力（S2、mutant B） | files 拡張が無効 | Writer probe（`ui/**`/`layout/**` 非 test file、例 `segmented-control.tsx`、に一時的な palette 外色 literal `bg-red-500` を追加） | `npx eslint .` が exit 1 になり色 selector のメッセージで検出されることを確認し、byte-for-byte 復元する | mutant 適用後も `npx eslint .` が exit 0 のまま（検出力なし） |
| SC6 生 `<button>` selector と色 selector の独立性（S2、mutant A） | 2 block が実は独立していない（共有 array 誤用等） | Writer probe（生 `<button>` selector block の `files`/`ignores` にのみ一時的に `ui/**`/`layout/**` を追加、色 selector block は触らない） | `npx eslint .` が exit 1 で `src/components/ui/segmented-control.tsx:51` の生 `<button>` 1 件のみを報告することを確認し（起票時実測の仮拡張と同一 hit）、復元する | mutant 適用後の結果が期待（exit 1・該当 1 件のみ）と一致しない（0 件のまま＝mutant が効いていない、または想定外の file/件数＝2 block が独立していない） |
| SC7 mockup 定数名一致（S3） | 旧名残存・誤置換 | static（`rg -Fc`） | `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 0 かつ `rg -Fc 'LIST_PER_PAGE_OPTIONS' docs/design-system/reference/mockup-d-lists.html` = 1 | 旧名が残る、または新名が期待箇所に現れない |

## Mutation Oracle Notes

- SC1 単独（値の静的存在確認のみ）だと `tsr.config.json` を作成しつつ `vite.config.ts` の inline options を残す mutant（統一が名目だけ）を見逃す。SC2 の mutation probe（`target` を変えて両経路の追随を見る）と対にすることで、`tsr.config.json` が実際に両経路の設定源になっていることを検証する
- SC3 は SC1/SC2 の結果として「現状の実効値」が変わっていないことを保証する回帰確認であり、起票時実測で行った pre-change 測定と同じ手順を post-change でも再現する。SC2 の mutation probe は一時的に値を変えて挙動を確認した後に元の値へ復元するため、SC3 は probe 復元後の状態で実行する
- SC4 は静的構造確認（block が実在し正しい glob を持つ）に留まり、それだけでは「色 selector が実際に効いているか」「生 `<button>` selector が実際に効かないままか」を保証しない。SC5（色 selector の検出力）と SC6（生 `<button>` selector の非拡張・独立性）を mutant で対にすることで、SC4 の静的宣言が実効的であることを確認する（⑪ SC1/SC2 の baseline+delta パターンと同型）
- SC5 単独（`ui/**` へ色 literal を注入して検出）だけでは、色 selector と生 `<button>` selector が実は分離されておらず単に glob だけ両方拡張された状態（Coordinator が明示的に禁止した状態）でも同じ結果になり区別できない。SC6（生 `<button>` selector を単独で widen する mutant A）と対にすることで、2 block が実際に独立していること（片方だけを動かせること）を確認する
- SC6 の mutant A は「起票時実測」で行った仮拡張実験（Backlog:149 の当初解釈）を意図的に再現するものであり、`segmented-control.tsx:51` の 1 件のみが検出されることでカバレッジの正確さを確認する
- SC7 は空集合 oracle を避けるため baseline（旧名 1 件）→ delta（旧名 0 件・新名 1 件）の対で確認する

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC1-SC3 は `npm run generate:routes` + `npx vite build` + `diff`（S1）、SC4-SC6 は `npx eslint .` + `rg -Fc`（S2、静的構造確認 + mutant A/B）、SC7 は `rg -Fc`（S3）。AC11（`doc-consistency-check.sh --target plan` / `check-workflow-git.sh` の exit code）と AC12（既存 frontend フル gate）は Plan Packet 側の完了条件として記載済みで、本 Matrix には独立行を立てない。
