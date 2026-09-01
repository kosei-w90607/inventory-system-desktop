# Test Design Matrix: DSR-19/20 runtime 是正 batch

Plan Packet: [../2026-09-01-dsr19-20-runtime-batch.md](../2026-09-01-dsr19-20-runtime-batch.md)

## Risk

Risk: R3

## Contracts Under Test

- SPEC-SUP-D11: 取引先追加（2 実装とも）の成功時に、返された取引先名を含む完了 toast を出す。
- SPEC-PRV-D8: 行確定の成功時に、対象商品名を含む完了 toast を出す。
- DSR-19 duration 階層: 取引先追加 = 全体既定 3000ms（duration 上書きなし、packet D-A）/ 行確定 = 5000ms（D-B）。
- DSR-19 toast id 基準: 取引先追加 = id なし（単発・重複経路なし）/ 行確定 = 商品単位の安定 id（同一商品は置換、別商品は個別、D-B）。
- DSR-20 variant: disposition table（packet D-C）の是正 7 件（廃番 / 追加取込み / CSV 取消 / 日報取消 / 整合性補正 / 上書き実行 / 棚卸し確定）の実行 Action が `variant="destructive"`。非是正 2 件（PLU 一括 / 統合 stage 1「次へ」）は default 維持。
- DSR-20 cancel 文言: ProductImportPreview「戻る」→「キャンセル」、BackupRestorePage 復元確認「やめる」→「キャンセル」（D-D）。
- DSR-20 硬化手段: UnsavedChangesDialog が明示 prop + 硬化条件 (b) の意図 comment を持ち、Esc / 外側クリックで閉じない挙動が不変（D-E）。
- 隣接 DSR-03: 失敗時は toast でなく既存の行内 error / Alert のまま（成功 toast の追加が失敗経路へ波及しない）。
- 隣接 DSR-20 DOM 順: 全 dialog の Cancel → Action DOM 順は変更しない。

## Failure Modes

- 取引先追加 2 実装のどちらかで toast が漏れる（片実装だけ是正して同型を見落とす）。
- 行確定 toast の id が固定文字列になり、別商品の連続確定で通知が置換されて消える（DSR-19 id 基準の毀損）。
- 行確定 toast の duration が全体既定 3000 のままで商品名の確認読了に不足する。
- variant 是正 7 件のうちいずれかが default のまま残る、または非是正 2 件が destructive 化される（Von Restorff の希釈）。
- cancel 文言の置換漏れ・別 dialog への誤適用。
- UnsavedChangesDialog の明示化で Esc / 外側クリック挙動が変わる（閉じるようになる、または callback が発火する）。
- 成功 toast 追加が失敗経路にも toast を出す（DSR-03 違反 — 失敗の回復導線は行内 / Alert が正）。
- 既存 toast（改名・統合・商品保存等）の文言・duration・id が変わる。

## Test Matrix

| ID | 対象 | 種別 | 検証内容 / oracle | Cite |
|---|---|---|---|---|
| T1 | suppliers 版 CreateSupplierDialog | 新規 | 追加成功 → `toast.success` が取引先名を含む文言で呼ばれる（文言は Matrix / test に literal 転記、production 定数から導出しない）。duration 上書きなし・id なし（呼出し引数に `duration` / `id` が存在しないことを assert）。dialog 閉鎖・入力 clear の既存挙動維持 | SPEC-SUP-D11 / D-A |
| T2 | products 版 CreateSupplierDialog | 新規 | T1 同型（2 実装の同型是正漏れ検出。文言は T1 と同一 literal） | SPEC-SUP-D11 / D-A |
| T3 | 取引先追加 失敗経路 | 新規 | 追加失敗 → `toast.success` 非呼出し + 既存の error 表示・入力保持のまま | DSR-03 隣接 / D-A |
| T4 | PriceRevisionTable 行確定成功 | 新規 | `toast.success` が対象商品名を含む文言・`duration: 5000`・商品単位 id で呼ばれる（3 引数個別 assert、combined snapshot にしない） | SPEC-PRV-D8 / D-B |
| T5 | 行確定 toast id の商品単位性 | 新規 | 商品 A 確定 → 商品 B 確定で id が異なる（非空 2 値の不一致 assert）+ 同一商品の再確定で id が同一（置換）。id 固定文字列化 mutation の検出用に**別商品 case を必須**とする | DSR-19 id 基準 / D-B |
| T6 | 行確定 失敗経路 | 新規 | 行確定失敗 → toast 非呼出し + 該当行の既存 error 表示・入力保持のまま | DSR-03 隣接 / D-B |
| T7 | variant 是正 7 dialog | 新規 | 7 dialog **個別に** render し、実行 Action button が destructive variant の様式であることを assert（`AlertDialogAction` への `variant` prop 透過を per-dialog で検証。7 件を 1 loop の combined assert にせず、1 dialog 漏れ mutation を検出できる粒度） | DSR-20 / D-C |
| T8 | 非是正 2 dialog の default 維持 | 新規 | PluBulkTargetConfirmDialog / MergeSupplierDialog stage 1「次へ」の Action が destructive 様式で**ない**こと（対 oracle — T7 と合わせ「是正対象だけが変わった」を両側から固定） | DSR-20 / D-C |
| T9 | cancel 文言 2 件 | 新規 | ProductImportPreview / BackupRestorePage 復元確認それぞれで、cancel button の accessible name が「キャンセル」exact + 当該 dialog 内に旧文言（「戻る」/「やめる」）の button が 0 件（component 単位 scope — 「前の画面へ戻る」等の正当用例と衝突させない） | DSR-20 / D-D |
| T10 | UnsavedChangesDialog 硬化挙動 | 新規 | open 状態で Esc keydown → dialog 残存 + onCancel / onConfirm 系 callback 非発火。外側 pointer-down → 同様。oracle は Contract Probe (2) の適用**前**実測と同値であること（挙動不変の直接検証） | DSR-20 硬化 / D-E |
| T11 | UnsavedChangesDialog ボタン経路 | 新規 or 既存確認 | 「編集を続ける」click → 閉じる（継続 callback）/「破棄して移動」click → 破棄 callback 発火（許可された close 経路の regression。既存 test があれば regression 指定） | DSR-20 硬化 / D-E |
| T12 | 既存 regression | 既存 | 既存 toast site（改名・統合・商品保存・取消 8000 等)と既存 dialog test が**無変更で** green。既存 test に variant / class / cancel 文言の固定値アサートがあり実装で fail する場合のみ正当な更新対象（Writer が PR body に file:line 列挙、アサート弱体化不可、T12 の無変更対象から除外） | 全契約の隣接保護 |

## State Lifecycle Matrix

| 状態 | 遷移 | 検証 |
|---|---|---|
| 取引先追加 dialog open | 成功 → 閉鎖 + toast | T1 / T2 |
| 取引先追加 dialog open | 失敗 → 開いたまま・入力保持・toast なし | T3 |
| 価格改定行 入力済み | 確定成功 → clear + toast（商品 id） | T4 |
| 価格改定 連続確定 | A 成功 → B 成功 → 別 id で両方個別 | T5 |
| 未保存編集 block 中 | Esc / 外側クリック → 残存 | T10 |
| 未保存編集 block 中 | 明示 button → 継続 / 破棄 | T11 |

## Adjacent Pattern Audit

- CreateSupplierDialog は 2 実装（products / suppliers）— 片方だけの是正は T1 / T2 の対で検出。
- CostDiffDialog（明示硬化の参照実装）は非接触 — 既存 test regression で保護。
- MergeSupplierDialog stage 2 / UnsavedChangesDialog / BackupRestorePage 復元の既存 destructive variant 3 件は非接触（T7 の対象外、T12 で保護）。
- 既存 toast id 付与 site（帳票 / 商品保存 / 保存系 4 画面等）と未付与 site（20 site 超）はいずれも非接触 — Non-scope（packet 参照)、T12 で保護。
- `AlertDialogAction` の variant prop 透過が primitive（`src/components/ui/alert-dialog.tsx`）に既にあるか Writer が実装時に確認 — なければ prop 追加は許可された実装詳細（button variant の既存 variants を使用、新規 style 定義は不可）。

## Negative Paths

- 追加失敗・行確定失敗で toast なし（T3 / T6）。
- 非是正 dialog の destructive 化なし（T8）。
- Esc / 外側クリックで UnsavedChangesDialog が閉じない（T10）。

## Boundary Checks

- 取引先名・商品名に長い文字列 / 記号が入っても toast 文言は template literal 埋込みのみ（escape 処理は sonner 既定に委ねる、新規変換なし）。
- 行確定 toast の id は productId 由来 — 同一 render 内で安定（再取得後も同一商品なら同 id)。

## Compatibility Checks

- 既存 toast の文言・duration・id は全 site 不変（T12）。
- dialog の DOM 順（Cancel → Action）・dismiss 配線は全件不変（T12 + T7 は variant のみ assert）。

## Data Safety Checks

- fixture は synthetic のみ（mock command 応答）。実店舗データ非使用。

## Main Wiring / Integration Checks

- T1 / T2 は dialog 実 render + 追加操作の end-to-end（Contract Probe (1) 兼務）。
- AC6（bindings diff ゼロ）は機械確認。

## Mutation-style Adequacy Questions

- 取引先追加の toast 呼出しを片実装だけ消したら？ → T1 または T2 が fail。
- 行確定 toast の id を固定文字列にしたら？ → T5 の別商品 case が fail。
- 行確定 toast の duration 指定を消したら？ → T4 の duration assert が fail。
- variant 是正 1 dialog だけ default に戻したら？ → T7 の該当 dialog case が fail。
- 非是正 dialog まで destructive にしたら？ → T8 が fail。
- cancel 文言を旧文言に戻したら？ → T9 が fail。
- UnsavedChangesDialog の Esc preventDefault を消したら？ → T10 が fail（probe 実測で oracle 実効性を確定済みであること）。

## 必須 mutation 注入（Final Review で clean tree 独立再実測、5 件）

| # | 注入 | kill 期待 |
|---|---|---|
| M1 | suppliers 版 CreateSupplierDialog の toast 呼出しを除去 | T1（T2 は green のまま = 個別性確認） |
| M2 | PriceRevisionTable の toast id を固定文字列 `"price-revision-success"` に置換 | T5（別商品 case） |
| M3 | 是正 7 件のうち 1 件（StocktakePage 確定）の variant を default へ戻す | T7（該当 case のみ fail = 個別 assert 確認） |
| M4 | ProductImportPreview の cancel 文言を「戻る」へ戻す | T9 |
| M5 | UnsavedChangesDialog の `onEscapeKeyDown` preventDefault を除去 | T10（Esc case）。外側クリックは primitive 既定の非 dismiss（`AlertDialogContentProps` が該当 handler を Omit）のため注入形なし — T10 の外側 case は primitive 既定の regression oracle として維持（gated amendment 2026-09-01 で確定） |

## Residual Test Gaps

- toast の視認性・重なり・読了時間、variant 色の見え方は render oracle 不能（CSS 詳細度は自動 gate 素通り — PR #15 教訓） — L3-1〜L3-4 で被覆。
- Windows native WebView2 での Esc / 外側クリック実挙動 — L3-5 で被覆。
