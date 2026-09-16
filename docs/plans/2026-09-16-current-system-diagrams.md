# 現行構造の図面同期と設計整合性の点検

## Workflow State

- Evidence Mode: github
- Phase: plan-gate
- Risk: R2
- Execution Mode: codex-only
- Plan Commit: pending
- Amendments: none
- Coordinator: Astra（D-087、一貫担当。採用・裁定は owner）
- Writer: Astra
- Plan Reviewer: Sonnet（独立 fresh context、依頼予定）
- Final Reviewer: Sonnet（独立 fresh context、依頼予定）
- Final Review Minimum: 1
- Human Gate: ready,merge

2026-09-16: owner の「実情に合わせて図面を更新し、アプリの設計上の矛盾も見つける」という依頼により kickoff → spec-check。既存の仕様・schema・route を調査し、製品契約を変更しない現行構造の記述として Design Readiness を確認して plan-draft へ。計画を先に commit し、独立 Plan Review に提出する。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3

レビューの発注・回収は D-087 により Astra が担当する。今回の図面更新と別の製品仕様判断が必要になった場合は、根拠付きの所見を残し、製品コードの変更へ進めない。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

現行実装を説明する図面と設計本文の同期、図を使った調査の記録。保守性に影響するが、DB schema・migration・route/search・業務挙動・workflow gate の契約は変更しない。既存実装への疑義は所見として分離し、既存の製品要求を実装に合わせて弱めない。

## Goal

Goal Invariant:

### 最小完了条件

- owner が現行のデータ構造、画面間の到達・戻り、在庫・売上・日報・PLU のつながりを図で確認できる。
- 図から見つかった問題について、根拠・影響・確認済み範囲・残る検証・次の是正候補を追える。

### 失敗定義

- 古い図を現行として案内する、現行にない FK・画面・取消機能を描く、または実装の欠陥を正しい設計として追認する。
- 数値や図の形を揃えるだけで、任意参照・在庫を動かす条件・戻り経路・失敗時の状態を確認しない。

### 非目的

- 製品コード、DB、店舗データ、依存 package、CI・review gate の変更。
- 実店舗運用の安全性全般をこの静的調査だけで保証すること。
- 全部の図を自動生成する汎用基盤の新設。

## Scope

- `docs/inventory_system_erd.html`: 現行の全 application table と migration 管理表、カラム・PK/FK・NULL許容・有限状態を同期。重複線を整理し、物理 FK とアプリ側の論理参照を区別する。巨大な図でも拡大・スクロールして確認できる表示と source の表示を備える。
- `docs/diagrams/current-system.md`: 図面の入口、層と外部連携、現行画面の構成・主要遷移、業務記録の詳細と戻り、在庫・売上・日報・PLU のデータフローを Mermaid で記述。query 条件と戻り先の区別、失敗・取消・再実行の境界を注記する。
- `docs/research/2026-09-16-diagram-audit.md`: 基準の code ref、図ごとの照合先、解消した文書不一致、残る製品設計・実装上の所見を根拠付きで記録する。問題なしと判断した境界も確認範囲を限定して記載する。
- `docs/db-design/transaction-tables.md`: migration で追加済みの冪等性列をカラム定義へ反映。将来の取消・訂正設計は未実装のまま区別する。
- `docs/DB_DESIGN.md` / `docs/SCREEN_DESIGN.md` / `docs/ARCHITECTURE.md` / `docs/PROJECT_HANDOFF.md` / `docs/architecture/ui-task-specs.md`: 現行図への参照、historical mockup の位置付け、既存 UI task 一覧の欠落を同期する。
- `docs/screen_mockups.html`: 既存内容は初期提案資料として保持し、旧画面遷移図を現行と誤認しない可視注記と現行図へのリンクを加える。
- `docs/function-design/55-ui-csv-import.md` / `56-ui-daily-sales.md` / `57-ui-monthly-sales.md`: 既存図の明白な転記不一致を本文・型定義・実装に照合して同期。競合する業務契約を一方的に変更しない。
- 本 packet と `docs/Plans.md` の進捗を同期する。

## Non-scope

- runtime・schema・migration・DTO・navigation・テストの製品挙動変更。
- 既存 mockup の全画面再デザインや提案資料の現行画面化。
- CI への新しい必須 gate、汎用 generator、外部サービスの新設。
- Ready / merge（owner の別指示が必要）。

## Acceptance Criteria

- AC-1: `src-tauri/src/db/migration.rs` が登録する schema を照合し、ER の table/column/PK/FK/nullable が一致する。SQL をメモリ内 SQLite に適用して比較し、実店舗 DB は開かない。enum / CHECK / index は省略範囲を明示し、図に書く値は実 schema と一致する。
- AC-2: `src/config/navigation.ts` と `src/routes/` の具体的な page route を図・対応表で網羅する。layout/index の重複、画面内展開、検索条件つき deep-link は独立画面と混同しない。各主要矢印は実装の Link / navigate / callback へ遡れる。
- AC-3: 在庫を動かす商品別売上と、在庫を動かさない公式日報を区別する。CSV rollback、通常業務記録の追跡、棚卸し、PLU の app 内確認と外部レジ反映の境界が図と説明から分かる。
- AC-4: 図から見つかった矛盾は、文書の更新漏れ・設計と実装の不一致・追加検証が必要な設計懸念に分類し、source と実装の位置、影響、再現または静的根拠、未検証範囲、是正候補を記録する。重大な欠陥は黙って実装追認せず owner へ返す。
- AC-5: `bash scripts/doc-consistency-check.sh`、`git diff --check`、変更分類に応じた `bash scripts/local-ci.sh changed` が通る。Mermaid を render し、構文エラーがなく文字・線・図の範囲が読めることを確認する。新しい dependency を repository に追加しない。
- AC-6: 独立 Final Review を通し、未解決 finding は owner に明示する。Windows native L3 はアプリ表示・挙動を変更しないため対象外。

## Design Sources

- [DB 設計](../DB_DESIGN.md) と配下のテーブル定義、[migration](../function-design/22-mnt-migration.md)。実装は `src-tauri/src/db/schema_v*.rs` と `migration.rs`。
- [アーキテクチャ](../ARCHITECTURE.md)、[画面設計](../SCREEN_DESIGN.md)、`src/config/navigation.ts`、`src/routes/`、各画面の Link / navigate。
- [共通規則](../function-design/10-common-rules.md)、[在庫処理](../function-design/31-biz-inventory-service.md)、[商品別 CSV](../function-design/32-biz-csv-import-service.md)、[PLU](../function-design/33-biz-plu-export-service.md)、[棚卸し](../function-design/35-biz-stocktake-service.md)、[日報](../function-design/37-biz-daily-report-import-service.md)、[記録追跡](../function-design/65-inventory-record-traceability.md)。
- [図とコードの照合基準](../code_review.md)、[文書の書式](../DOC_STYLE_GUIDE.md)。

## Required Design Artifacts

| 対象 | 資料 | 状態 |
|---|---|---|
| 現行 DB の図示 | schema / migration / DB design | 既存 sufficient。本文の転記漏れのみ同期 |
| 画面・業務フローの図示 | route / navigation / function-design | 既存 sufficient。不一致を調査所見に分離 |
| 図面の位置付け・読み方 | current-system.md と親文書 | 同じ変更で追加 |
| 新しい製品契約 | なし | 非対象 |

## Registration / Generation Obligations

- 新設図面の入口を DB / SCREEN / ARCHITECTURE / PROJECT_HANDOFF から参照する。
- 新しい Tauri command、page route、function-design 文書、REQ coverage はない。bindings / route tree の変更は不要。traceability は既存 checker の判定に従い検証し、生成物は手編集しない。

## Design Readiness

既存設計と source は現行構造を描くために十分。今回の成果物は観測した現在と採用済み仕様の関係を説明し、追加仕様は作らない。図化中に見つかった未解決の製品設計は audit へ根拠付きで残す。この docs-only scope の実装前に決める製品 Human Gate はない。

## Impact Review Lenses

- Adapter/core: POS 固有形式、app 内の売上・日報モデル、外部反映の確認限界を区別する。
- Fact/design: コードの実在、設計意図、現在の不一致、将来案を混ぜない。
- Lifecycle/operator: 入力・確定・取消・再試行・詳細・戻りの実経路を追い、図で途切れを隠さない。
- Reporting/data safety: 商品別明細と公式集計の意味を分離し、NULL参照・冪等性・stock と movement の関係を確認する。
- Manual/environment: 実店舗情報は扱わず、図の表示だけを browser で確認する。製品の Windows / レジ実機検証を代替したとしない。

## Contract Probe

R2 docs-only。外部環境の挙動を製品契約へ昇格させないため R3/R4 Contract Probe は非対象。図の render 可否は AC-5 で実際に検証する。

## Test Plan

- メモリ内 SQLite の schema introspection と図の entity / column / FK を比較する一時検証。production migration の制御コード全体を実行したとは主張しない。
- navigation / concrete route と図面対応表を集合で比較し、主要矢印は実 source で確認する。
- Mermaid render と可視確認、リンクの実在、doc checker、diff check、変更分類に従う local gate。
- 製品の不具合が疑われた場合、既存テストと実経路を調査し、必要なら作業用の合成データによる再現検証を行う。製品テストや仕様を弱めない。

## Boundary / Wire Contract

既存契約の説明だけで変更なし。物理 FK と app 側の論理関連、在庫単位と売上集計、URL と画面内 state をそれぞれ区別する。

## Review Focus

- 図を読むだけで誤った必須関係・在庫更新・レジ反映・取消機能を想像しないか。
- source と図の差が既存欠陥なのか単なる省略なのか、根拠で区別しているか。
- 健全性を保証する範囲を過大に書いていないか。図を更新し続ける参照先が明確か。

## Data Safety

実 POS / 店舗 CSV、実 DB、backup、log、receipt、secret は読取・記録対象外。メモリ内 SQLite には repository の schema と必要な合成データのみを使う。

## Implementation Results

Plan Gate 前。図面の編集は未着手。

## Review Response

- Findings Freeze: not yet frozen。
- Plan Review: Sonnet に依頼予定。
