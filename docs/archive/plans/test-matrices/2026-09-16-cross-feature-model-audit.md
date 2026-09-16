# 横断業務モデル検証 Test Design Matrix

## Risk

Risk: R2

製品挙動は変更せず、test-only helperと合成データによる診断を追加する。業務oracleの根拠は [検証モデル](../../../diagrams/cross-feature-verification.md)。既存の必須gateを変更しない。

## Contracts Under Test

- XFA-D1: 操作の意味から作る独立した在庫・売上期待値。売上は商品×sourceで比較し、手動販売=manual、CSV=auto、入庫/返品/廃棄は売上を作らない。REQ-201/202/203/204/401、INV-5、SPEC-SDI-D1〜D4。
- XFA-D2: 現物移動・カウント・CSV反映時点の分離。REQ-205/401、既知STK-1の診断。
- XFA-D3〜D5: 再現可能な有限操作列、最初の失敗prefix、通常PASSと診断FAILの分離。

## Failure Modes

- ある操作の在庫更新が後続操作で消える、POS非連動商品も減る、取消が別importへ影響する。
- 再送や再取消が二重反映され、拒否された要求が業務データを残す。
- 古いカウントが後続移動を消す、確定に織り込まれた過去の販売を後から再度減算する。
- モデルがDBの誤値やBIZの計算式を期待値としてコピーし、整合した誤りを検出できない。
- 診断FAILを通常suiteのPASSで覆い隠す。

## Test Matrix

実装予定名。既存テストがこの横断検証を網羅するとは主張しない。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| XFA-D1 / 在庫・売上 | 機能間で増減が干渉する | 実BIZ+DB model-based | `test_cross_feature_req201_req202_req203_req204_req401_model` | 在庫・movement・日次売上が独立モデルと違う |
| XFA-D1 / INV-5・SPEC-SDI | 再送・同日追加・対象取消が二重反映される | 状態/拒否/永続化 | 同上 | 再送で増える、別importが消える、拒否で業務snapshotが変わる |
| XFA-D2 / REQ-205 | カウント後に動いた在庫が戻る | 明示実行の診断 | `diagnostic_cross_feature_req205_count_then_movement` | 確定在庫が現物と一致しない（既知FAILを予想、実測は実行時） |
| XFA-D2 / REQ-205/401 | 遅いCSVが確定後に二重減算する | 明示実行の診断 | `diagnostic_cross_feature_req205_req401_late_import` | カウントより前の販売を反映した後に現物数と違う |
| XFA-D2 / 対照 | 変動なし・再カウント・確定前取込み | 正常対照 | `test_cross_feature_req205_controls` | 正しい順序の結果まで不一致になる |
| XFA-D1/3 / oracle・REQ-904/203 | DB内の整合や売上総計だけでpassする | mutation | `test_cross_feature_req904_req203_model_detects_consistent_corruption` | 在庫とmovementの同時誤り、manual/autoの取り違えを検出しない。棚卸し実装の保護実績へは計上しない |

## State Lifecycle Matrix

| 対象 | 初期/保留 | 成功 | 再接続/再試行 | 失敗 | 範囲外 |
|---|---|---|---|---|---|
| 入出庫 | 合成商品の初期在庫 | 実BIZ保存とモデル更新 | 同じ冪等キーの再送 | 内容不一致拒否・業務snapshot維持 | CMD/UI pending、native操作 |
| CSV | 実parserでpreview | 確定・同日追加 | 同じhash拒否、取消後再取込み、再取消 | 対象外importを巻き戻さない | CMD cacheの期限・再起動 |
| 棚卸し | 全商品明細を作成、診断対象をカウント | `force_fill=true` で対象外の非負在庫だけ補完して確定 | 再カウント | 確定成功後の在庫と現物の不一致のみを時点FAILとする | 未入力拒否・負在庫補正・中断回復UI・バックアップ復元 |
| POS現物 | 未反映の販売 | 後日のファイル反映 | 明示した同一イベントの遅い反映 | 二重反映 | 実機の採取・任意日付の一般解決 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 合成DB | `db/test_support.rs` | 新規test moduleで再利用 | 実DB禁止 | TempDir |
| Z004生成・parse | `csv_import_service/test_support.rs` / `tests/rollback_tests.rs` | 既存builderを再利用 | 新parser・独自encoding処理は作らない | 実parse→commit |
| CachedPreview構築 | `tests/commit_tests.rs` / `tests/rollback_tests.rs` の同じ `build_cached` | `test_support.rs` へ挙動不変で移設して共用 | 既存テストのassert・ケース・実行条件は変更しない | 既存CSVテストと新規横断テスト |
| 入出庫Request | inventory_service各BIZ | 実Request・実関数を使用 | UIの再実装なし | source contractとserde型 |

## Negative Paths

- 冪等キーの内容違い、同一activeファイルの再取込み、再取消。
- モデルは業務snapshot（在庫・ヘッダ・明細・売上・movement）を比較し、拒否時の操作ログ増加は許す。

## Boundary Checks

- `pos_stock_sync` true/false、CSVの販売/負数返品、register_processed true/false。
- 数量・金額は小さい合成整数。在庫単位変換、数値上限、共有JANは対象外。
- 操作集合・生成深さは有限。測定コマンドは結果文書に、実測した探索件数・所要時間・テスト件数はEvidence Ownershipに従いPR本文/CI出力へ記録する。

## Compatibility Checks

- schema/DTO/runtimeの変更なし。test moduleは `#[cfg(test)]` でのみ組み込む。
- Rust標準の `#[ignore]` は新規診断だけに付け、明示診断コマンドを必ず実行する。既存テストにignoreを追加したりassertを変えたりしない。
- `diagnostic_` 接頭辞は既知FAILをREQ coverageに計上しないための意図的な抽出対象外。通常ケースは `test_` + REQ番号で計上し、診断の実行実績は結果文書とPRへ分離する。

## Data Safety Checks

- 既存fixture helperと合成商品のみ。一時DBはTempDirに閉じ、店舗CSV・DB・log・backupは扱わない。
- 出力は操作ラベルと合成値のみ。失敗traceを実店舗の障害発生事実とは扱わない。

## Main Wiring / Integration Checks

- 新規moduleを既存 `csv_import_service/tests/` と `tests/mod.rs` に接続し、実BIZ→実parser/repository→SQLiteを通す。production側mod.rsは変更しない。
- 日次売上のconsumerまで照合し、DBの内部合計だけをoracleにしない。
- traceabilityはcanonical generatorで再生成・checkし、生成物を手編集しない。

## Mutation-style Adequacy Questions

- 在庫とmovementを同じ量だけ誤らせても、独立モデルとの比較は失敗するか。
- `pos_stock_sync` を無視した結果、再送の二重反映、別importの取消を検出できるか。
- 遅いCSVをカウント前/確定前/確定後へ動かすと、同じ現物イベントが保持されるか。

## Residual Test Gaps

- すべての順序・量・商品・期間の網羅ではない。実行した有限探索範囲を結果に明示する。
- UI/CMD cache、native/実POS、日報bundle、PLU、backup restore、共有JAN、単位変換は未実行。
