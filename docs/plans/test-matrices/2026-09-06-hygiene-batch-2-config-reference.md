# Test Design Matrix: 衛生 batch 2（config / reference 系、⑫）

Plan Packet: [../2026-09-06-hygiene-batch-2-config-reference.md](../2026-09-06-hygiene-batch-2-config-reference.md)

## Risk

R3（S2 が `eslint.config.js` の `no-restricted-syntax`（`npm run lint` が実行する workflow gate 定義）へ新規 block を追加し色 selector の対象範囲を変更するため、DEV_WORKFLOW Risk Tiers の uncertain-default 規則で R3 とする。glob のみの拡張を R2 へ切り下げる明示規定は DEV_WORKFLOW に無く、当初の「2 block 分離」設計が ESLint flat config の rule merge 挙動（`node_modules/eslint/lib/config/flat-config-schema.js:450-506`、同一 `files` に一致する block 間で `no-restricted-syntax` を完全置換）により `features/**`・`patterns/**` の色検出を実際に壊す（Plan Review Opus P1-1 で発見・実測確認）ことが判明したため R3 を維持する。S1/S3 は単独なら R1〜R2 相当。runtime・DB・DTO・operator 画面には非接触のため L3 は非対象、本 Matrix は 3 件の config/lint/doc 自体の契約検査に限定する）。

## Contracts Under Test

- SC1（S1）: `tsr.config.json` が `"target": "react"` と `"autoCodeSplitting": true` を正しく宣言する
- SC2（S1）: `vite.config.ts` が router 生成 inline options を一切持たず、`tsr.config.json` が両経路（CLI・vite plugin）の唯一の設定源になっている（単一化の実効性、mutation で乖離を検出できること）
- SC3（S1）: 是正後も CLI（`npm run generate:routes`）と vite plugin（`npx vite build`）が生成する `src/routeTree.gen.ts` が byte-identical（回帰確認）
- SC4（S2）: 既存 `no-restricted-syntax` block（`features/**`・`patterns/**`、色 selector + 生 `<button>` selector）が完全に無変更のまま残る（静的構造確認）
- SC5（S2）: 色 selector 専用の新規 block が追加され、`files`/`ignores` が `ui/**`・`layout/**`（と対応する `*.test.{ts,tsx}` ignore）を持ち、既存 block と `files` が重複しない（静的構造確認）
- SC6（S2）: 新規 block の拡張が実効的に機能する（`ui/**`/`layout/**` の非 test file 内の palette 外色 literal を検出する）
- SC7（S3）: `mockup-d-lists.html` / `01-decision-rules.md` / `50-ui-product-list.md` / `73-ui-stocktake.md` の定数名参照が現行契約（`LIST_PER_PAGE_OPTIONS`）と一致する
- SC8（S2、Plan Review Opus 追加）: 既存 block が新規 block 追加後も無変更で機能する——`features/**` の非 test file に palette 外色 literal を注入すると引き続き検出される（regression 確認。当初の「2 block 分離」設計はこれが exit 0 になり検出できなかった）

## Failure Modes

- `tsr.config.json` の値が誤る、または未作成のまま `vite.config.ts` の inline options だけ除去され設定が失われる
- `vite.config.ts` に router 生成 inline options が残存し、`tsr.config.json` を変更しても vite plugin 側の生成物に反映されない（単一化が名目だけで実効性がない）
- 是正後に CLI と plugin の生成物が乖離する、または `build` 自体が失敗する（Goal Invariant S1 失敗定義そのもの。`target` mutation は `src/routes/**` を破壊的に書き換えるため build 失敗という形でも顕在化しうる）
- 既存 block と新規 block の `files` が重複し、ESLint の rule merge により `no-restricted-syntax` が後方 block の値で完全置換される——`features/**`・`patterns/**` の色 literal 検出が silently 消える（当初の「2 block 分離」設計で実際に発生）
- 新規 block の `files` 拡張が `ui/**`/`layout/**` の非 test file を実際には対象化せず、palette 外色の新規混入を検出できない（拡張が名目だけ）
- 旧定数名が 4 file のいずれかに残る、または置換が周辺の日本語文言・別識別子（`ProductPagination` 等）まで書き換えてしまう

## Test Matrix

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| SC1 tsr.config.json 内容（S1） | 値の欠落・誤記 | static（`rg -Fc`） | `rg -Fc '"target": "react"' tsr.config.json` = 1 かつ `rg -Fc '"autoCodeSplitting": true' tsr.config.json` = 1 | いずれかの値が存在しない、または誤った値になる |
| SC2 単一化の実効性（S1） | inline options 残存 | Writer probe（mutation、**`$TMPDIR` 配下の使い捨てコピーで** `tsr.config.json` の `target` を一時的に `"solid"` へ変更） | `npm run generate:routes` と `npx vite build` を再実行し `diff` で比較。是正が正しければ両者は揃って変化し byte-identical のまま。probe 後にコピーごと破棄し、worktree 側は `git status --short -- src/routes` = 空で無傷を確認 | `diff` 不一致（`vite.config.ts` に inline `target: "react"` が残っていて plugin 側だけ変化せず両者が乖離する）、または `target` を `"react"` に戻した再生成が `SyntaxError` で build 失敗する（stale `@tanstack/solid-router` import が残る） |
| SC3 生成物 byte-identical 回帰（S1） | 統一後に生成物が変わる | integration（CLI vs plugin diff） | 是正後（`tsr.config.json` 導入後）に `npm run generate:routes` の出力と `npx vite build` 生成物を保存し `diff` | `diff` exit 1（byte-identical でなくなる） |
| SC4 既存 block 無変更（S2） | 既存 block に誤って手を加える | static（`rg -Fc`） | `rg -Fc 'files: ["src/features/**/*.{ts,tsx}", "src/components/patterns/**/*.{ts,tsx}"]' eslint.config.js` = 1 かつ `rg -Fc "JSXOpeningElement\[name.name='button'\]" eslint.config.js` = 1（既存 block にのみ 1 箇所） | 既存 block の `files`/`ignores`/selector 文字列が変わる、または button selector が新規 block にも複製される（2 箇所になる） |
| SC5 新規 block の静的構造（S2） | 新規 block が無い、または既存 block と `files` が重複する | static（`rg -Fc`） | `rg -Fc 'src/components/ui/**/*.{ts,tsx}' eslint.config.js` = 1 かつ `rg -Fc 'src/components/layout/**/*.{ts,tsx}' eslint.config.js` = 1（新規 block にのみ出現、`features/**`・`patterns/**` とは別 block） | glob が存在しない、または既存 block の `files` 配列に追加されてしまう（重複） |
| SC6 色 selector 検出力（S2、mutant） | 新規 block の拡張が無効 | Writer probe（`ui/**`/`layout/**` 非 test file、例 `segmented-control.tsx`、に一時的な palette 外色 literal `bg-red-500` を追加） | `npx eslint .` が exit 1 になり色 selector のメッセージで検出されることを確認し、byte-for-byte 復元する | mutant 適用後も `npx eslint .` が exit 0 のまま（検出力なし） |
| SC7 旧定数名一致（S3） | 旧名残存・誤置換 | static（`rg -Fc`） | `rg -Fc 'PRODUCT_PER_PAGE_OPTIONS' <4 file>` 合計 = 0 かつ `rg -Fc 'LIST_PER_PAGE_OPTIONS' <4 file>` 合計 = 4（`docs/design-system/reference/mockup-d-lists.html` / `docs/design-system/01-decision-rules.md` / `docs/function-design/50-ui-product-list.md` / `docs/function-design/73-ui-stocktake.md`） | 旧名が 4 file のいずれかに残る、または新名が期待箇所に現れない、または `docs/Plans.md:18` の歴史的記述まで書き換わる |
| SC8 既存 block の regression（S2、mutant） | 新規 block 追加が既存 block の検出力を壊す | Writer probe（`src/features/**` 非 test file、例 `BackupRestorePage.tsx`、に一時的な palette 外色 literal を追加） | `npx eslint .` が exit 1 になり色 selector が検出されることを確認し、復元する | mutant 適用後に `npx eslint .` が exit 0 のまま（既存 block の検出力が新規 block 追加によって消える——当初の「2 block 分離」設計で実際に発生した regression と同型） |

## Mutation Oracle Notes

- SC1 単独（値の静的存在確認のみ）だと `tsr.config.json` を作成しつつ `vite.config.ts` の inline options を残す mutant（統一が名目だけ）を見逃す。SC2 の mutation probe（`target` を変えて両経路の追随を見る）と対にすることで、`tsr.config.json` が実際に両経路の設定源になっていることを検証する
- SC2 の probe は破壊的（`src/routes/**` 35 file を書き換え、`target` を戻しても `SyntaxError` で復旧しない）ため `$TMPDIR` 配下の使い捨てコピーでのみ実行する。「would fail if」に build 失敗も含めるのは、divergence だけでなく生成そのものが壊れる経路もあるため（Sonnet P2）
- SC3 は SC1/SC2 の結果として「現状の実効値」が変わっていないことを保証する回帰確認であり、起票時実測で行った pre-change 測定と同じ手順を post-change でも再現する（本番 worktree、SC2 の使い捨てコピーとは別）
- SC4/SC5 は静的構造確認に留まり、それだけでは「新規 block が実際に効いているか」「既存 block が壊れていないか」を保証しない。SC6（新規 block の検出力）と SC8（既存 block の regression 確認）を mutant で対にすることで、静的宣言が実効的であることを確認する（⑪ SC1/SC2 の baseline+delta パターンと同型）
- SC6 単独（`ui/**` へ色 literal を注入して検出）だけでは、新規 block が実は既存 block と `files` が重複しており「たまたま両方効いている」状態（Coordinator が禁止した挙動）を見逃す。SC4/SC5 の静的重複チェックと組み合わせて初めて「意図どおりの独立 block である」ことを保証する
- SC8 は「2 block 分離」設計で実際に発生した regression（起票時実測で `BackupRestorePage.tsx` への `bg-red-500` 注入が exit 0 になった）をそのまま正式な Matrix contract へ格上げしたもの。SC6 単独ではこの regression を検出できない（`ui/**` 側は正しく検出されるため）——SC6/SC8 は必ず対で運用する
- 当初の「生 `<button>` selector を widen する動的 mutant」（旧 SC6）は、新規 block（後方・色 selector のみ）が merge 時に widen 済み既存 block（前方）の結果を完全上書きし button 検出自体が消えるという別の非自明な相互作用を起こすため廃止した。静的重複チェック（SC4/SC5）の方が正確な oracle である
- SC7 は空集合 oracle を避けるため baseline（旧名 4 件）→ delta（旧名 0 件・新名 4 件）の対で確認する

## Contract Coverage Cross-check

Plan Packet の Contract Coverage Ledger と 1:1 対応する。SC1-SC3 は `npm run generate:routes` + `npx vite build` + `diff`（S1、SC2 は使い捨てコピー限定）、SC4-SC6・SC8 は `npx eslint .` + `rg -Fc`（S2、静的構造確認 + mutant）、SC7 は `rg -Fc`（S3、4 file 合算）。AC11（`doc-consistency-check.sh --target plan` / `check-workflow-git.sh` の exit code）と AC12（既存 frontend フル gate）は Plan Packet 側の完了条件として記載済みで、本 Matrix には独立行を立てない。
