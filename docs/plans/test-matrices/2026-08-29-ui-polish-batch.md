# Test Design Matrix: UI 表示磨き batch 第 1 弾（10 件）

Plan Packet: [../2026-08-29-ui-polish-batch.md](../2026-08-29-ui-polish-batch.md)

## Risk

Risk: R2

## Contracts Under Test

- 55 §55.2 UI-07-D14: rollback summary の規定項目集合（Z004: ID / 精算日 / filename / 件数 / 金額。日報: ID / 対象日 / source filenames / 総売上 / 純売上）
- 55 §55.2 UI-07-D13: 追加確認の規定項目（import ID / filename(s) / 金額 / 取込み日時）+ scroll 可能一覧 + 省略禁止
- 61 §61.5 UI-02-D15: 状態を色だけに依存させない・成功/失敗を同じ行で判別
- 61 §61.5 追記（Scope 8a）: 更新成功後のマスタ原価新値反映
- 78 §78.6 追記（Scope 8b）: 改名成功の完了通知（§78.7 統合と対称）
- SCREEN_DESIGN 追記（Scope 8c）: hub の rollback / 復元完了後の先頭スクロール（既存 4 画面パターン）
- 75 doc 追記（Scope 8d）: PageHeader title「在庫整合性検証」の doc-code 一致
- 65 §65.6.1: 状態表現の意図的乖離への非接触（既存 test 凍結で担保）

## Failure Modes

- summary 構造化で規定項目が 1 つ以上欠落する / 金額・件数の表示値が変わる
- CostDiffDialog の成功表示が色のみの判別になる（テキスト・role 喪失）
- 更新成功後もマスタ原価が旧値のまま / footer が「見送って閉じる」のまま
- 改名成功が無通知のまま / 統合と非対称な通知文言
- rollback 完了後に一覧が旧スクロール位置のまま
- 旧見出し「在庫整合性チェック」の残存
- 既存機能（取込み / 取消 / 原価更新 / 改名 / hub 検索）の挙動回帰

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- Test Name は実装時に確定。既存 test の削除・無効化・skip 禁止（文言追随は意味不変の範囲で可）。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| ボタン行パターン統一 | wrapper 欠落 | RTL | T1 日報 ResultStep のボタン群が単一の flex 行 container 配下に render される assert | wrapper 未実装 |
| UI-07-D14 項目集合 | 項目欠落 | RTL | T2 両 tab の rollback 確認 summary に規定 5 項目の値 token（fixture の ID・日付・filename・件数/総売上・金額/純売上）が**全て** render される assert | 構造化で項目を落とす実装 |
| UI-07-D13 項目集合 | 項目欠落・省略発生 | RTL | T3 追加確認 dialog に規定 4 項目の値 token + 複数件 fixture の全行 render assert | 項目欠落・件数省略 |
| UI-02-D15 + Alert 化 | 色のみ判別化 | RTL | T4 更新成功行に success 表示 + 「マスタ原価を更新しました」テキスト + role の存在、失敗行に失敗テキスト（成功/失敗の同時 fixture） | テキスト・role を落として色だけにする実装 |
| 61 §61.5 追記 | 旧値表示継続 | RTL | T5 updateMasterCost 成功後にカードのマスタ原価が新値で render + footer 文言が状態対応（全行処理済みで「閉じる」系）に変わる assert | 反映欠落・固定文言 |
| 78 §78.6 追記 | 無通知のまま | RTL | T6 改名 submit 成功で toast.success が呼ばれる assert（mock、文言は追記 doc と一致の独立転記） | toast 追加漏れ・文言 drift |
| 取消成功通知の視認性 | 改善が実装されない | RTL | T7 改善形確定後に具体化（Writer 提案 + Opus round → Coordinator が gated Amendment として本 Matrix へ追記し Amendments 行へ SHA 記録。契約変更を伴わない範囲に限る） | — |
| SCREEN_DESIGN 追記 | スクロールしない | RTL | T8 rollback 完了 handler でページ先頭スクロール（scrollTo 等）が呼ばれる assert（jsdom mock） | scroll 呼出し欠落 |
| 既存挙動の凍結 | 回帰 | regression | T9 = 既存 suite green（InventoryRecordsPage / csv-import / receiving / suppliers の全既存 test） | 磨きが挙動を変えた場合 |
| 名称 doc-code 一致 | 旧見出し残存 | RTL + rg | T10 PageHeader が「在庫整合性検証」で render + AC5 の rg 全滅検査 | title 未変更・部分変更 |

## State Lifecycle Matrix

not applicable の行が多いため対象 state のみ:

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| CostDiffDialog 行状態 | 差分一覧表示（prop） | 更新中 disabled（既存） | 成功 Alert + マスタ原価新値 + footer 文言遷移（T4/T5） | 既存 D-052 契約不変 | dialog 再表示は既存挙動 | — | — | 失敗テキスト維持（T4） | 既存 retry なし | Matrix |
| 取消 flow の通知/スクロール | 確認 dialog（構造化 summary、T2） | 取消中 | toast + hub 先頭スクロール（T7/T8） | 既存 root() 契約不変 | 一覧再取得（既存） | — | — | 既存 error 経路不変 | — | Matrix |

- workflow-state 行: 本 packet の遷移運用は DEV_WORKFLOW の現行規範どおり（STATECAP 3/PR、state-only allowlist + zero-context hunk、三点一致）。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| ボタン行 `flex flex-wrap gap-2` | csv-import ResultStep L67-112 | 日報 DailyReportResultStep | — | T1 |
| success token 表示 | IntegrityCheckPage の成功 Alert | CostDiffDialog | — | T4 |
| 完了 toast | MergeSupplierDialog L63-64（件数入り文言） | RenameSupplierRow | 件数情報は改名に該当なし（対象 1 件）— 文言は §78.6 追記で確定 | T6 |
| 先頭スクロール | SCREEN_DESIGN L263 / L283 / L417 / L419 の 4 画面 | InventoryRecordsPage | 他の未規定画面への水平展開は本 batch 非対象（磨き対象は owner 所感起源のみ） | T8 |
| summary 構造化 | — （新パターン。既存は文字列連結） | ResultStep 両 tab + AdditionalImportConfirmDialog の 3 site | 3 site とも同一の構造化様式に揃える（site 間で別様式にしない） | T2 / T3 |

## Negative Paths

- missing input: 該当なし（表示のみ）
- invalid input: 該当なし
- duplicate/ambiguous input: 追加確認の複数件一覧の全行 render（T3）
- unknown reference: 該当なし
- dependency missing: toast mock 不在時の test 破綻を避ける既存 test 慣行に従う
- permission/write failure: CostDiffDialog 失敗行の表示維持（T4）
- dry-run side effect: 該当なし

## Boundary Checks

- threshold / min/max / precision / wire / round-trip: 該当なし（表示層のみ、bindings 差分ゼロを AC3 で機械確認）
- empty/non-empty: 追加確認 0 件時の既存挙動不変（既存 test 凍結）
- status/policy enum: CostDiffDialog の成功 / 失敗 / 未処理の 3 状態表示（T4 / T5）

## Compatibility Checks

- old schema/input: なし
- new schema/input: なし
- output order: summary 項目の表示順は規定なし（項目集合のみ契約）— 構造化後の順序は 3 site で統一
- optional field behavior: なし

## Data Safety Checks

- source-derived data: fixture は synthetic のみ
- generated outputs: なし（bindings / traceability 非接触）
- secrets: 該当なし
- local-only files: `.local/ci-evidence/`
- synthetic sample boundaries: L3-lite は synthetic seed 最小限、手順は PR body

## Main Wiring / Integration Checks

- 該当なし（表示層のみ。既存の取込み / 取消 / 更新 flow の wiring は既存 test が凍結）

## Mutation-style Adequacy Questions

- summary から項目を 1 つ削る → T2 / T3 の全 token assert が red になるか（token は fixture 固有値で、他要素との偶然一致がないこと）
- 成功 Alert のテキストを削り色だけにする → T4 red
- マスタ原価の新値反映を削る → T5 red
- toast.success 呼出しを削る → T6 red
- scroll 呼出しを削る → T8 red
- PageHeader を旧文言へ戻す → T10 + AC5 red

## Residual Test Gaps

- 視認性（間隔・折返し・Alert の見た目・toast の目立ち方）の最終判定は自動 test で代替不能 → owner 目視（L3-lite）
- T7 の oracle は改善形確定後に具体化（確定前は本 Matrix の未確定行として明示）
- Opus 修正案 round の指摘反映後に assert を追補する場合も、Plan Gate 後の Matrix 変更はすべて gated Amendment（Amendments 行への SHA 記録）で行う
