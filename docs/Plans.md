# Plans.md

> 現在のフェーズ、進行中の作業、ブロッカー、次の行動を追うためのライブダッシュボード。完了済みの詳細履歴は archive に移す。

## 現在のフェーズ

- 製品フェーズ: Phase 3 UI 群は PR #117 までに完了。Phase 4 は UI-11b（PR #144）/ UI-11a（PR #151/#152）/ UI-10 棚卸し（PR #159）/ UI-11c 操作ログ（PR #164）/ UI-13 整合性検証（Public PR #5）で完了。`v0.8.0-ui-daily` tag は `f44f99a`。**リリースへの道筋**: 新画面を伴う当初仕様は UI-15（PR #4、2026-08-26）で全て実装完了。①実装 PR C（入庫 cost_diffs、PR #5）②docs 実装状況棚卸し（PR #6）に続き、実コード側 stale 表記 batch（PR #7）・商品一覧 plu filter の returnTo 脱落 fix（PR #8）・棚卸し詳細 route（PR #9）・wave 6 docs 衛生 batch + failpoint 並列 race 是正（PR #10・#11、2026-08-28 完了）・6 種対称化（Design PR #13 + 実装 PR #14、2026-08-29）・UI 表示磨き batch 第 1 弾 + DSR-16 正本化（PR #15、2026-08-29）・scroll 方針規範化 Design（PR #16、2026-08-29）・UI 表示磨き batch 第 2 弾（PR #17、2026-08-30）まで消化済み。残り = ④ UI 一覧の背骨 D（Lane 1〜5、完了時に E2E / visual regression 再評価〈UI_TECH_STACK §7.2〉）⑤ go-live 検証 flow（PLU 実機再確認 + Z004 layout 有効化 + 部門キー→PLU 移行計画）+ MSI 配布手順 docs 化 → v1.0。着手順は「次の行動」で owner と選定。
- 現在の基準: 正本 repo は `kosei-w90607/inventory-system-desktop`（2026-08-23〜24 rehome、旧 public repo `inventory-system-public` は private 化）。詳細は decision-log D-077 / [docs/PUBLIC_REPO_MIGRATION.md](PUBLIC_REPO_MIGRATION.md) を参照。
- 2026-06-30 UI-08 前フィールド確認: 現店舗の日報主入力は `Z001` / `Z002` / `Z005`、`Z004` は PLU(商品) / 商品別トラックとして扱う。詳細は [plu-export-and-real-csv-verification.md](plu-export-and-real-csv-verification.md)。

## 残作業分類

未了 backlog は下記『Backlog（未了）』節を参照。

## 直近の完了

- [x] **PR #26 操作ログ producer 実効化（record_type / record_id 4 producer 書込み + 関連記録 link 実データ発火）**（R3 キュー最終、PR #26 @ inventory-system-desktop squash merge `818c9b1`、2026-09-01）: 入庫・返品交換・手動販売・廃棄の操作ログ detail_json へ §74.9 許可リストどおりの `record_type` + 実 PK の `record_id` を書込み（manual_sale は `sale_id` → `record_id` 一本化、DTO `ManualSaleCreateResult.sale_id` は非接触）+ producer 個別の実 SQLite E2E 契約 test（Coordinator mutation M1〜M5 独立再実測 全 kill）+ 74/65/FUNCTION_DESIGN の producer 記述 drift 是正（csv_import / stocktake は owner 裁定で据置明記）。owner Windows native L3 全 PASS — L3-5 で PR #23 L3-3 waiver の引き継ぎ義務を解消。証跡: [archived Packet](archive/plans/2026-09-01-oplog-producer-impl.md) / [Matrix](archive/plans/test-matrices/2026-09-01-oplog-producer-impl.md)
- [x] **PR #25 DSR-19/20 runtime 是正 batch（toast 2 件 + destructive variant 統一 + 硬化明示化 + cancel 文言）**（R3、PR #25 @ inventory-system-desktop squash merge `f88d262`、2026-09-01）: 取引先追加 2 実装 + 価格改定行確定へ成功 toast（SPEC-SUP-D11 / SPEC-PRV-D8、行確定は 5000ms + 商品単位 id）+ destructive 確認 7 dialog の `variant="destructive"` 統一（D-C disposition、PLU 一括 / 統合 stage 1「次へ」は default 維持）+ cancel 文言 2 件是正（「戻る」「やめる」→「キャンセル」）+ UnsavedChangesDialog の暗黙硬化を明示 prop 化（gated amendment `2433199`: `AlertDialogContentProps` が `onPointerDownOutside` を型 Omit するため `onEscapeKeyDown` のみ明示 + 外側クリックは primitive 既定の非 dismiss を T10 regression oracle で固定）。owner Windows native L3 は商品取込み 2 観測（fixture 不足の残余リスク受容、T7/T9 自動被覆）を除き全 PASS。証跡: [archived Packet](archive/plans/2026-09-01-dsr19-20-runtime-batch.md) / [Matrix](archive/plans/test-matrices/2026-09-01-dsr19-20-runtime-batch.md)
- [x] **PR #24 DSR-17 scroll 位置復元 + 主ナビ先頭表示（scrollRestoration 導入）**（R3、PR #24 @ inventory-system-desktop squash merge `f1d5590`、2026-08-31）: TanStack Router `scrollRestoration` 導入（href key + `<main>` data 属性 + miss 先頭 fallback）+ 分類④主ナビ 3 経路の遷移先識別子付き one-shot 機構 + D-E（初回 clamp 時の遅延再適用 = cold 安全網）+ **D-F 根本是正**（mount focus 3 site の `preventScroll` 化 — L3 で特定された「mount autofocus の native scroll が復元を上書き」への直撃是正）+ DSR-17 追記（(g) spike 結果 / (i) / 禁止行拡張）。owner Windows native L3 は 4 巡（clamp 系仮説 2 回の誤診を owner 実機計測が是正、経緯は archived packet の append-only 記録）で全項目 PASS。証跡: [archived Packet](archive/plans/2026-08-31-dsr17-scroll-restoration-impl.md) / [Matrix](archive/plans/test-matrices/2026-08-31-dsr17-scroll-restoration-impl.md)
- [x] **PR #23 DSR-18 戻り導線 returnTo 8 site + 共通 helper 実装**（R3、PR #23 @ inventory-system-desktop squash merge `16b73d8`、2026-08-31）: gap 8 site（保存結果 3 + recent list 4 + 操作ログ関連記録 1）へ `returnTo` 付与（`useRouterState` location href 方式）+ detail 6 page の `normalizeReturnTo` を `src/lib/return-to.ts`（DSR-15 prefix 検証 + fallback 必須引数）へ集約 + 契約 test（往復 end-to-end + detail 6 page 全数 negative）。owner Windows native L3 = 到達可能 7 site 全 PASS、操作ログ 1 site は既知 producer gap により waiver 裁定 A（実データ L3 は producer 実効化 R3 の Human Gate へ義務引き継ぎ、backlog 参照）。証跡: [archived Packet](archive/plans/2026-08-30-dsr18-returnto-impl.md) / [Matrix](archive/plans/test-matrices/2026-08-30-dsr18-returnto-impl.md)
- [x] **PR #22 成功 feedback / destructive dialog 横断規約 Design Phase**（R2 docs-only、PR #22 @ inventory-system-desktop squash merge `8b744f1`、2026-08-30）: DSR-19「作成・保存成功の feedback 規約」（toast 最低保証 + 併用基準〈適合 4 形 + R3 是正 2 件〉+ duration 3s/5s/8s + id 規約 + DSR-03 refine）と DSR-20「destructive 確認 dialog の配置・dismiss 規約」（variant 統一 + 並び順・3 ボタン先例 + cancel ブリッジ本則と硬化条件 + 暗黙硬化禁止 + Cancel 文言基準）を新設。SPEC-SUP-D11 / SPEC-PRV-D8 追記 + catalog ⑦ duration drift 是正 + 理論引用（『UXデザインの法則』第 2 版）を Why 限定で正本化。runtime 是正は後続 R3。証跡: [archived Packet](archive/plans/2026-08-30-feedback-dialog-conventions-design.md)
- [x] **PR #21 DSR-17 拡張 Design Phase（3+1 分類）**（R2 docs-only、PR #21 @ inventory-system-desktop squash merge `22504af`、2026-08-30）: 分類④「主ナビゲーションは遷移先先頭」新設（owner 所感 PR #17 comment 起源、mount 一律禁止と発火契機で両立）+ 分類②の実装方式契約 (a)〜(h) 確定（push 戻り + href key + `<main>` 復元 + 競合優先順位 + R3 Probe / L3 義務、TanStack Router 1.168.23 の `__TSR_key` drift を版数付き記録）+ review-checklist カテゴリ 9 同期。R3 着手順 = DSR-18 R3 先行 → scroll 復元 R3。証跡: [archived Packet](archive/plans/2026-08-30-scroll-policy-extension-design.md)
- [x] **PR #20 「前の画面へ戻る」導線契約の規範化 Design Phase**（R2 docs-only、PR #20 @ inventory-system-desktop squash merge `0d5f73c`、2026-08-30）: DSR-18「詳細画面の戻り導線契約」新設（遷移元本則 + returnTo 送信義務 + fallback + DSR-15 extend の共通 helper 方針）+ TRACE-D11 の遷移元横断化（65 の 4 箇所同期）+ 送信側契約 5 件採番（UI-02-D16 / UI-03-D22 / UI-04-D17 / UI-05-D17 / UI-11c-D16）+ review-checklist カテゴリ 9 対応行。gap 8 site の runtime 是正は後続 R3 packet。証跡: [archived Packet](archive/plans/2026-08-30-return-navigation-contract-design.md)
- [x] **PR #4 取引先管理実装**（R3、PR #4 @ inventory-system-desktop merge `c2cdda8`、2026-08-26）: UI-15 `/settings/suppliers` 画面（一覧 + usage 件数 + インライン改名 + 統合 dialog 2 段階）+ migration v6 + `rename_supplier` / `merge_suppliers` / `list_suppliers_with_usage` を実装。証跡: [archived Packet](archive/plans/2026-08-25-supplier-management-impl.md) / [Matrix](archive/plans/test-matrices/2026-08-25-supplier-management-impl.md)
- [x] **PR #5 入庫時原価差分検出 cost_diffs**（R3、PR #5 @ inventory-system-desktop merge `854948f`、2026-08-26）: 入庫保存完了時の原価差分ダイアログ（マスタ原価更新オプション）を実装。証跡: [archived Packet](archive/plans/2026-08-26-receiving-cost-diffs-impl-c.md) / [Matrix](archive/plans/test-matrices/2026-08-26-receiving-cost-diffs-impl-c.md)
- [x] **PR #6 docs 実装状況棚卸し**（R2、PR #6 @ inventory-system-desktop merge `bb4969e`、2026-08-26）: 実装状況 stale 表記 16 箇所を是正 + REQ-206/207 を required 昇格。証跡: [archived Packet](archive/plans/2026-08-26-docs-impl-status-inventory.md)
- [x] **PR #7 実コード側 stale 表記 batch**（R2、PR #7 @ inventory-system-desktop merge `5555d5e`、2026-08-26）: src / src-tauri の stale 表記 14 箇所是正 + 在庫照会詳細 CTA 2 個を active link 化。証跡: [archived Packet](archive/plans/2026-08-26-code-stale-impl-status-batch.md)
- [x] **PR #8 商品一覧 plu filter の returnTo 脱落 fix**（R3、PR #8 merge `7f72ea8`、2026-08-26）: `return-to.ts` build/parse へ `plu` を追加し、PLU filter が保存戻りで維持されるよう修正。証跡: [archived packet](archive/plans/2026-08-26-plu-returnto-fix.md) / [Matrix](archive/plans/test-matrices/2026-08-26-plu-returnto-fix.md)
- [x] **PR #9 棚卸し詳細 route + `get_stocktake_record`**（R3、PR #9 @ inventory-system-desktop merge `c5efc24`、2026-08-27）: `/stocktake/records/$stocktakeId` 詳細 Page を実装し、在庫変動履歴「棚卸し #n」link の 404 を解消。証跡: [archived Packet](archive/plans/2026-08-27-stocktake-record-detail.md) / [Matrix](archive/plans/test-matrices/2026-08-27-stocktake-record-detail.md)
- [x] **PR #10 wave 6 lane 1: docs 衛生 batch**（R2、PR #10 @ inventory-system-desktop squash merge `42b6679`、2026-08-28）: 74-ui の stocktake 除外理由同期 + fresh checkout gate 前提明記。証跡: [archived Packet](archive/plans/2026-08-28-docs-hygiene-sync.md)
- [x] **PR #11 wave 6 lane 2: product_service failpoint の並列 test race 是正**（R2、PR #11 @ inventory-system-desktop squash merge `cec68ba`、2026-08-28）: failpoint 4 本を thread-local 化し武装 test の他 test への漏れを機構レベルで排除。証跡: [archived Packet](archive/plans/2026-08-28-failpoint-test-race.md)
- [x] **PR #12 Plans.md dashboard 減量（第 3 回 cleanup）**（R2 docs-only、PR #12 @ inventory-system-desktop squash merge `8f8b44e`、2026-08-28）: 本 dashboard を 320 行 / 24.7 万字から 115 行へ再編。旧全文は [snapshot](archive/plans/2026-08-28-plans-dashboard-cleanup.md) へ verbatim 退避（未了 50 項目の全数残存を Final Review が 1 対 1 照合）。証跡: [archived Packet](archive/plans/2026-08-28-plans-dashboard-cleanup-packet.md)
- [x] **PR #13 入出庫履歴 6 種対称化 Design Phase（slice 4d）**（R2 docs-only、PR #13 @ inventory-system-desktop squash merge `6c688fe`、2026-08-29）: 65/21-io/44-cmd/73-ui/55-ui の 5 doc 11 節へ 6 種横断契約（status 正規化・差異件数・検索母集団・operator 表示・専用一覧 runway 残置）を確定。証跡: [archived Packet](archive/plans/2026-08-29-inventory-records-six-symmetry-design.md)
- [x] **PR #14 入出庫履歴 6 種対称化 実装（slice 4d）**（R3、PR #14 @ inventory-system-desktop squash merge `8ca7e78`、2026-08-29）: `listInventoryRecords` を 6 種横断へ拡張（status 正規化 3 値 + filter 4 値の WHERE 実効化 + 棚卸し差異件数 + hub UI 注記・「-」・「差異なし」+ D-052 invalidation 拡張）。owner Windows native L3 全項目 PASS。証跡: [archived Packet](archive/plans/2026-08-29-records-six-symmetry-impl.md) / [Matrix](archive/plans/test-matrices/2026-08-29-records-six-symmetry-impl.md)
- [x] **PR #16 画面遷移 scroll 方針の規範化 Design Phase**（R2 docs-only、PR #16 @ inventory-system-desktop squash merge `a8c1c82`、2026-08-29）: DSR-17「画面遷移と scroll の 3 分類」新設（mount 一律 scroll 禁止・詳細戻りは位置復元本則・Home 帰着は one-shot flag 条件付き先頭 scroll）+ UI-11b-D12（復元成功 Alert の scroll 可視性契約）+ review-checklist カテゴリ 9 対応行 + 裁定 3 件反映（状態表現統一 = 現状維持 close / card-soup 監査 = 違反 0 で close・グレー 2 件を第 2 弾候補へ）。hosted final は merge 後 main dispatch で backfill（経緯と disposition は archived Packet）。証跡: [archived Packet](archive/plans/2026-08-29-scroll-policy-design.md)
- [x] **PR #19 wave 7 lane 2: repo・scripts 衛生 batch**（R2、PR #19 @ inventory-system-desktop squash merge `920c2a7`、2026-08-30）: 退役 Dockerfile / docker-compose.yml の削除（§A.1 既決の物理的完遂）+ .gitignore protected-paths へ `.claude/hooks` / `.claude/loop.md` 追加。旧 S3（probe script 負 glob 是正）は前提欠陥の三重実測不成立により gated amendment `e618470` で descope。証跡: [archived Packet](archive/plans/2026-08-30-repo-scripts-hygiene.md)
- [x] **PR #18 wave 7 lane 1: docs 整合性衛生 batch**（R2、PR #18 @ inventory-system-desktop squash merge `d5cef6e`、2026-08-30）: backup-restore の UI-11b 文脈の REQ-905→REQ-901 採番是正（BackupRestorePage.test.tsx の REQ token + 4 doc + 90-traceability 再生成）+ 表記同期 4 件（78 §78.4 snake_case / ARCHITECTURE CMD-11 の MNT-02 非連結是正 / D-052-E1 語義確定 / 70-mnt 起動サンプルの run_startup_step 実装同期）+ 棚卸しカウント除外の母集団明記（35-biz §20.3 / 73-ui §73.1、issue #91 close）。証跡: [archived Packet](archive/plans/2026-08-30-docs-consistency-hygiene.md)
- [x] **PR #17 UI 表示磨き batch 第 2 弾（6 件）**（R2、PR #17 @ inventory-system-desktop squash merge `3195736`、2026-08-30）: 3 dialog の説明文言充実（原価差分の選択結果 3 点 / 取引先統合の統合元削除明示 / PLU 一括の絞り込み境界）+ Home 復元成功 one-shot scroll（UI-11b-D12 実装、negative test 込み）+ CostDiffDialog 商品名見出し格上げ + 整合性補正結果の divide-y 化（DSR-16/17 適合）。owner Windows native L3 全項目 PASS。証跡: [archived Packet](archive/plans/2026-08-30-ui-polish-batch-2.md) / [Matrix](archive/plans/test-matrices/2026-08-30-ui-polish-batch-2.md)
- [x] **PR #15 UI 表示磨き batch 第 1 弾 + DSR-16 正本化**（R2、PR #15 @ inventory-system-desktop squash merge `c6b6eb7`、2026-08-29）: 表示磨き 9 件（summary 構造化・CostDiffDialog Alert 化/マスタ原価反映/footer 文言・改名 toast・取消 toast 8s・名称統一「在庫整合性検証」）+ **DSR-16「同型情報のグループ化と囲みの階層」新設** + design-system 正本 4 doc 更新（--border 4.5:1 誤記→実測 1.20:1 修正含む）+ CostDiffDialog 暗黙 dismiss の modal 硬化（owner L3 発見 P1、在庫二重加算誘導の解消）。新編成 pilot（Sonnet Writer × Opus 修正案 × Codex cross）成立、owner L3 全項目 PASS。証跡: [archived Packet](archive/plans/2026-08-29-ui-polish-batch.md) / [Matrix](archive/plans/test-matrices/2026-08-29-ui-polish-batch.md)

## 次の行動

- [ ] wave 8 lane 1: 現在地アクセント（DSR-21 正本化 + SidebarLink 実装）+ PLU 通知バー icon 同乗 — [active packet](plans/2026-09-02-ui-current-location-accent.md)（詳細は Wave Registry）
- [ ] wave 8 lane 2: 棚卸しカウントの数量空欄ガード（C5 機能欠陥級）— [active packet](plans/2026-09-02-stocktake-empty-count-guard.md) / [Matrix](plans/test-matrices/2026-09-02-stocktake-empty-count-guard.md)（詳細は Wave Registry）
- [ ] ④ UI 一覧の背骨 D Lane 1〜5: 着手時に owner と選定（完了時に E2E / visual regression 再評価〈UI_TECH_STACK §7.2〉）
- [ ] ⑤ go-live 検証 flow（PLU 実機再確認 + Z004 layout 有効化 + 部門キー→PLU 移行計画）+ MSI 配布手順 docs 化: 着手時に owner と選定

### Wave Registry

- 形式: 現 wave ごとに status / lane 数 / merge train 順序を置き、各 lane に是正単位、branch、active packet link、Draft PR、Workflow State Phase、owner 介入回数を記録する。lane packet の選択と PK4 は、この「次の行動」節内の link を正本として fail-closed 判定する。
- **wave 8（2 lane、UI ガッツリ整えターン第 1 便）: implementing（2026-09-02 起票、両 lane Plan Gate 2 round 収束）** — merge train 順序は human-confirm 到達順を既定案として Ready 承認時に確定。footprint 互いに素（lane 1 = `src/components/ui/selection-tone.ts` / `src/components/layout/SidebarLink.tsx` / `src/features/home/components/PluNotificationBar.tsx` + design-system docs、lane 2 = `src/features/stocktake/StocktakePage.tsx` + 同 test + `73-ui-stocktake.md`）。生成物再生成は lane 2 のみ条件付き（REQ token 追加時の 90-traceability）。owner 介入は起票選定（2026-09-02 会話）で各 lane 1 回。編成 = Fable Coordinator / Codex Writer（発注書駆動、worktree isolation）/ 独立 Sonnet Plan + Final Reviewer。
  - lane 1: 現在地アクセント（DSR-21 正本化 + SidebarLink 実装）+ PLU 通知バー icon 同乗（R2、design+runtime）— branch `agent/ui-current-location-accent` / [active packet](plans/2026-09-02-ui-current-location-accent.md) / Draft PR: pending / Phase: implementing（Plan Gate 2 round 収束 2026-09-02）/ 介入 1/5（起票承認 2026-09-02、視覚系につき予算 5）
  - lane 2: 棚卸しカウントの数量空欄ガード（空欄 Enter / 保存で actual_count=0 サイレント保存の是正、R3）— branch `agent/stocktake-empty-count-guard` / [active packet](plans/2026-09-02-stocktake-empty-count-guard.md) / [Matrix](plans/test-matrices/2026-09-02-stocktake-empty-count-guard.md) / Draft PR: #27 / Phase: human-confirm（Final Review P1/P2/P3 = 0 + mutation 再実測全 kill、2026-09-02）/ 介入 1/3（次 = L3 依頼で 2/3）（起票承認 2026-09-02）
- wave 7（2 lane、衛生 batch）: 完了 2026-08-30 — merge train PR #18 squash `d5cef6e` -> PR #19 squash `920c2a7`。lane 2 は前提の三重実測不成立により S3 を gated amendment `e618470` で descope（Writer Codex の fail-closed 停止が起点、rally 天井内で owner escalation 処置）。後続 lane の base 追随は origin/main 単段 merge（D-074 手順、conflict-free）。[archived Packet lane 1](archive/plans/2026-08-30-docs-consistency-hygiene.md) / [lane 2](archive/plans/2026-08-30-repo-scripts-hygiene.md)
- wave 1（2 lane pilot）: 完了 2026-07-28 — PR #29 squash `8f67315` / PR #30 squash `eac9d20`。[WER](archive/plans/2026-07-28-wave-1-pilot-workflow-effectiveness-review.md)
- wave 2（2 lane worktree）: 完了 2026-07-28 — merge train PR #33 squash `6c53c44` -> PR #32 squash `29b35ed`。[WER](archive/plans/2026-07-28-wave-2-workflow-effectiveness-review.md)
- wave 3（3 lane）: 完了 2026-07-29 — merge train PR #34 squash `3f5086b` -> PR #35 squash `b9d7e49` -> PR #36 squash `90cc963`。[WER](archive/plans/2026-07-29-wave-3-workflow-effectiveness-review.md)
- wave 4（3 lane）: 完了 2026-07-30 — merge train PR #40 squash `b3ac5e5` -> PR #39 squash `669dfee` -> PR #38 squash `a29f2e8`。[WER](archive/plans/2026-07-30-wave-4-workflow-effectiveness-review.md)
- wave 5（stacked 2 lane）: 完了 2026-08-20 — PR #85 squash `014c064` -> PR #86 squash `b2389b1`。[archived Packet lane 1](archive/plans/2026-08-18-plu-slot-core-implementation.md) / [lane 2](archive/plans/2026-08-19-plu-bulk-onboarding-implementation.md)
- wave 6（2 lane、小粒衛生 batch）: 完了 2026-08-28 — merge train PR #10 squash `42b6679` -> PR #11 squash `cec68ba`。[archived Packet lane 1](archive/plans/2026-08-28-docs-hygiene-sync.md) / [lane 2](archive/plans/2026-08-28-failpoint-test-race.md)

## Backlog（未了）

- command drift detection（`collect_commands!` / `generate_handler!` の drift detection 未導入）。※退役 Docker 資材の削除は wave 7 lane 2（PR #19、2026-08-30）で完了済み。
- TanStack Router generation settings の統一（起草時実査 2026-08-30: vite plugin `tanstackRouter({ autoCodeSplitting: true })` と `tsr generate` CLI の 2 系統併存・tsr.config.json なし。統一方針〈CLI script 撤去 or tsr.config 明示化〉の小裁定 + 生成物同一性検証を伴う単独小 change として着手）。
- UI-09a・09b 将来設計（UI-09b の日報 coverage 表示「一部日だけ日報がある月」の取込み済み日数、SALES2-D3 で自覚的 defer〈batch A から移管〉、34-biz §19.4 参照。`get_monthly_sales` DTO 拡張を伴う R3）。
- bindings trailing-whitespace generation の扱い（2026-08-30 実測: commit 済み `src/lib/bindings.ts` に trailing whitespace 0 件。生成時のみ発生する可能性が残るため、次回 bindings 再生成を伴う change で実測して要否判定）。
- PLUスロット永続割当の恒久設計（CV17 import が メモリNo. merge のため現行再採番と衝突。[2026-07-03 packet](archive/plans/2026-07-03-post-ui08-janless-plu-target-design.md) D-6 参照）。
- MSI 配布手順 docs 化（v1.0 gate。「次の行動」⑤と対応）。
- バックアップ一覧の肥大化 UX（保持日数で自然減のため優先度低）。
- architecture_test の re-export 洗浄検出強化（cmd が biz/mnt の re-export 経由で db symbol を消費する間接依存は現行の use 行 literal match で検出不能 — 順12 実装 AMD2 で実証。cmd-task-specs に検出境界を明記済み、検出強化は将来判断）。
- 在庫状態表示の filter 依存不整合（在庫 2・基準 3 の同一商品が「すべて」filter では状態「通常」、「在庫少」filter では「在庫少」と表示される。query source 依存の pre-existing 仕様で受入台本 L3 2026-08-13 の owner 観察起源〈PR #74 comment〉。operator には矛盾に見えるため follow-up 要否を検討、優先度は owner 判断）。
- 部門 17「本」のバーコードなし本・ISBN-10 本の登録経路（JAN 専用欄正規化 change の owner 裁定 2026-08-11 起源 = 本は 13 桁 JAN〈EAN-13/ISBN-13〉登録・ISBN-10 特例なし。部門 17 は code_prefix NULL のため JAN 欄空白の escape hatch が使えず、ISBN-10 のみの古書・バーコードなし本は登録不能のまま。要望発生時に code_prefix 付与 or ISBN-10 対応を再裁定）。
- I-G1 sweep test の gitignore 非尊重（pure Rust walk 化〈PR #80 是正 `980a211`〉は gitignored file も走査するため、将来 `src/routeTree.gen.ts` 等の生成物が旧 token を偶然含むと偽陽性 fail し得る。安全側にしか倒れない構造差で現時点 hit 0 を実測済み、顕在化時に走査除外 or 生成物パターン skip を判断）。
- STATECAP 検査の stacked train 継承除外（`check-workflow-git.sh` の範囲 `merge-base(origin/main, HEAD)..HEAD` が stack 点以前の他 lane forward state-only commit を自 PR に計上する。PR #86 で実測、docs 側の運用規律は正本化済み、機械側の範囲判定是正は設計非自明のため将来判断）。
- UI-01a 商品検索への取引先 filter 露出（backend `ProductSearchQuery` の `supplier_id` / `include_unassigned` は PR #95 で実装済み・UI 露出は UI-14 のみ。50-ui 画面契約の改訂が必要。UI-15 は PR #4 で完了済みのため着手可、UI 一覧の背骨 D 系の画面見直しとの前後関係は着手時に owner 判断）。
- UI-15 改名ボタンの double-click 貫通リスク（保存確定の連打で二重送信し得る懸念。pending 中の行単位 disabled は実装・RTL 検証済みのため顕在化時に再評価、L3 owner 所感 2026-08-26 起源の P3）。
- CsvImport / Stocktake detail page の静的入口未整備（PR #20 packet 起票時実測起源）: `/csv-import/records/$importId` / `/stocktake/records/$stocktakeId` は横断 hub 経由のみ到達可能で、専用一覧などの静的入口は未整備。入口設計は実需発生時の別 change とする。
- csv_import / stocktake の関連記録 link 実効化（詳細 route は実装済み。record_type producer 採用 + §74.9 許可リスト追加を併せて行う別 follow-up — 2026-09-01 の producer 実効化 R3〈PR #26〉では owner 裁定で据置、74 §74.9 / §74.16 に据置判断明記済み。実需発生時に起票）。
- UX 磨き 3 観察（PLU 警告の視認性 / 処理中フィードバック不足 / 薄いグレーの多用 — PR #26 L3 owner 所感 2026-09-01 起源、機能契約非影響。design-first で要望が続けば起票、参考候補に Refero サイトを含める〈owner 提示〉）。**2026-09-02 更新**: 『UIデザインの教科書』突合で 3 観察とも根拠付き（薄いグレー ↔ 現在地色 drift、PLU 警告 ↔ DSR-08 icon 欠落、処理中 ↔ リアルタイム検証 / feedback）。PLU 警告の視認性は wave 8 lane 1（PluNotificationBar icon 同乗）で消化中、残 2 観察は UI ターンの画面単位 design packet 群へ編入。
- 廃棄・破損の保存結果に「詳細を見る」+ `returnTo` を追加するか（現行 UI-05-D17 は「保存結果に link なし」を契約化済み。追加には UI-05-D17 改訂の design 判断が先行 — PR #23 owner L3 所感 2026-08-31 起源。歴史的非対称であり表示すべきでない業務理由は source docs に見当たらない、が owner 観察）。
- 4 作業画面の保存結果 panel を詳細往復時だけ one-shot 復元する案（現行は詳細 → 戻りで panel が消える。復元条件・サイドバー再訪との区別は DSR-03/DSR-19 系の design 判断が先行 — PR #23 owner L3 所感 2026-08-31 起源）。
- 入出庫履歴の完成形 runway 残余（横断 hub 検索の 6 種対称化・棚卸し合流・検索母集団差の利用者説明は PR #14〈2026-08-29〉で完了。残余 = 専用一覧 `/csv-import/records`・`/stocktake/records` と `listCsvImportRecords` / `listStocktakeRecords`〈完成形契約のまま実需発生まで残置〉+ slice 6 の CSV 出力・印刷/控え + slice 5 の取消/訂正・`corrected` status）。
- `app-router.ts` top-level の router singleton 副作用（test が named export だけ import しても実 router が構築されグローバル scroll/pagehide listener が登録される。現状は test 側の一意 query で cache 衝突を回避済みで実害なし。router 関連改修時に遅延生成 or test util 分離を検討 — PR #24 Final Review P3-2、2026-08-31）。
- CostDiffDialog の structured action list 化（更新 / 見送りの帰結を定型構造で並べる表示強化。PR #17 で説明文言 3 点は明記済み、さらに一歩の磨きは要望次第 — owner L3 2026-08-30 所感起源）。
- 整合性補正結果への商品名併記（現行は商品コードのみ。PR #17 の divide-y 化とは独立の情報追加 — owner L3 2026-08-30 所感起源）。
- DSR-20 硬化手段列挙の AlertDialog 系追記候補（DSR-20 本文の `onEscapeKeyDown` / `onPointerDownOutside` 列挙は Dialog 前提。AlertDialog 系は `AlertDialogContentProps` が `onPointerDownOutside` / `onInteractOutside` を型 Omit し外側クリックは primitive 既定で非 dismiss — PR #25 gated amendment `2433199` 起源。次回 design-system 改訂 change に同乗）。
- T10 source 文字列 test の formatter 脆弱性（`useUnsavedChangesWarning.test.tsx` の `readFileSync` + `toContain` による明示 prop 存在検査は formatter 変更で false-fail し得る実装詳細 test — PR #25 Final Review 非ブロッカー所見 2026-09-01 起源。顕在化時に検査形の置換を判断）。
- eslint palette 外色 ban（`eslint.config.js` `no-restricted-syntax`）の `files` glob 拡張（現行は `src/features/**` + `src/components/patterns/**` のみで `src/components/ui/**` / `src/components/layout/**` は非対象。wave 8 lane 1 Plan Review P2 起源 2026-09-02、当該 PR は `rg` を唯一の機械 oracle として運用、glob 拡張は既存違反の棚卸しが先行）。
- 棚卸しの表示件数設定案（owner L3 2026-09-01 所感起源。表示件数の設定化は design 判断が先行、要望が続けば起票）。
- 商品取込み上書き確認の実機 visual 未観測（PR #25 L3 で fixture 不足〈上書き確認へ到達する import file 不在〉の残余リスク受容済み、T7/T9 自動被覆あり。import file fixture が整った機会の随時確認で足りる、義務ではない）。
- inventory-operator-ui SKILL.md への DSR-16 判断手順追加（sandbox の `.claude/skills` write deny により Claude worker 経路不可 — Codex 発注 or owner 手動の小 change、PR #15 起源）。
- CostDiffDialog 結果画面への再表示ボタン（PR #15 P1 裁定で今回不採用 — 状態管理拡大を伴うため要望が続けば別 change。見送り時は次回入庫で再提示される既存契約が safety net）。
- 取消完了 toast の視認性追加検討（PR #15 で duration 8s 化済み。owner 所感で不足なら ページ内 Alert 併用を第 2 弾で検討）。
- dialog/AlertDialog 内の dl・table が aria-describedby に含まれない既存同型制約（3 site 共通、スクリーンリーダー初期読み上げ対象外 — Opus round 指摘起源のアクセシビリティ磨き候補）。
- receipt 添付の follow-up（63 §63.8: 画像表示・削除・orphan cleanup・共通添付化）。
- 在庫詳細→取引画面の prefill（61/63/64: productCode/direction 事前入力、現行は商品再検索が必要）。
- 一括価格改定の運用支援 3 点（77 §77.9: 新売価算出補助・複数行一括確定・改定前入力の長期保持）。
- 取引先一覧の操作性（78 §78.12: 検索・sort・paging・bulk rename）。
- shortcuts の retroactive unit test（54 §54.9、延期理由「Vitest 未導入」は失効済み・test file 0 件）。
- 低優先 deferred 11 件の集約追跡（N8〜N19: CSV import 拡張 / cm・m 表示切替 / global scanner detection / shortcut 拡張 / REQ-704・705 / 操作ログ CSV / 状態チップ件数・廃番 toggle / 棚卸し中止・sort・履歴 / 商品個別閾値 / Z006・Z009・Z011 / ダークモード。詳細と doc 節は [遷移契約 sweep 記録](archive/plans/2026-08-26-transition-contract-sweep.md) 参照、要望発生時に個別裁定）。
- PK4 の section 抽出が `###` で打ち切られ `### Wave Registry` 配下 link が検査対象外になる問題（wave 1 plan-gate round 1 P1 起源。PK 系 checker gap 是正 PR #69 の Post-Freeze follow-up として別件残置、優先度は owner 判断）。
- 棚卸しカウント除外の長期滞留在庫（issue #91、2026-08-22 回答済み）: 除外基準は年数でなく原価根拠の有無（伝票保管義務範囲外で廃棄済み・取引先データなし・バーコードなし・販売に適さない見た目）、規模は例年 1〜2 点・多い年で 4〜5 点。owner 提案どおりシステムでは表現しない（除外品は単品コード非付与 = 商品マスタ外、部門キーで商品非連動販売、復活時は新規登録）。35-biz-stocktake-service.md / 73-ui-stocktake.md への母集団明記のみ残作業、owner 同意で close 候補。
- cargo 側の advisory 2 件（rand low `GHSA-cq8v-f236-94qc` / glib medium `GHSA-wrw7-89jp-8q8g`）: D-067 で tolerable_risk として dismiss 済み（upstream-blocked）、revisit = Tauri 更新時。
- npm dependency-security 常設 monitoring の運用（週次〈月曜 06:00 JST〉+ manual dispatch で `npm audit` high+ と監視 advisory の state 変化を check し issue 通知。監視対象 advisory の追加・整理は `scripts/npm-security-monitor.sh` の `WATCHED_ADVISORIES` を編集）。
- ~~linuxbrew ripgrep 15.1.0 のネガティブ glob 誤解釈~~ **close（2026-08-30 実測是正）**: doc-consistency-check.sh 側の負 glob 除去は PR #39（`669dfee`）で対応済み。残存を疑った `check-phase1-probe-removed.sh` の同型は wave 7 lane 2 の三重実測（rg 15.2.0 / linuxbrew 15.1.0、literal・wildcard・明示 file 引数の全形で正常動作）で**非欠陥と確定**し descope。当時の「リテラル解釈で全マッチ 0 件」診断は現行 binary では再現せず、一般化しない（経緯は [lane 2 archived packet](archive/plans/2026-08-30-repo-scripts-hygiene.md) の amendment 記録参照）。
- 日報取込み標準手順の残設計（issue #135 派生。保持期間・命名・取込み途中・再取込みの設計と店舗マニュアル反映が残る。同日複数精算は D-071 / PR #79・#80 で実装済み）。
- 日報画面の Excel 印刷・バインダー代替受入判定（現行 Excel + 印刷 + バインダーが日別記録を残す唯一の手段。実 1 日分での公式集計・過去日到達・欠落日・修正/再取込み・backup/restore 後の再現を横並び確認し、印刷機能の要否を go-live 前に判定する）。
- 検証用スキャニング PLU 4 件の掃除（issue #76 店舗訪問の残項目、任意・実害なし）。
- daily-report-import の FilePicker multiple 対応（共通 FilePicker 化・前回フォルダ記憶は完了済み、multiple 対応のみ要望発生時に別 R3）。
- UI-08 prepare failure Alert の読みやすさ改善（PR #128 L3 P3-2 起源、operator UI）: 「PLUファイルに書き出せる商品がありません」の Alert が対象商品コードを横並びで列挙しており読みにくい。要約表示 + 要修正一覧と同じ構造化テーブルへの改善が必要だが、現在の prepare failure 経路（`BizError::ValidationFailed` の message 文字列埋め込み、`plu_export_service.rs` `build_all_excluded_message`）は CMD/BIZ 契約拡張を要する。UI-08-D10 の scope 外として切り出し。
- バックアップ保存先の UNC / ネットワークパス対応（PR #149 L3 で発見、既存 MNT-01 挙動）: UNC パス指定時 `VACUUM INTO` が「database is locked」で失敗する。対処候補 = ①設定時に UNC を検証して拒否 ②ローカル一時ファイルへ `VACUUM INTO` → 保存先へコピーの 2 段構え ③エラー文言の改善。優先度は店舗運用でネットワーク保存先を使う要望が出るまで低。
- restore 遅延成功の DB log 非依存な起動通知（PR #14 Codex 第 7 round P2-2 起源）: durability 不明で終わった restore が再起動後の reconcile で committed 回復した事実を、UI 起動通知（toast 等）で operator へ渡す強化。二重障害系列（電断 + operation_log 書込みの持続障害）のみで必要になるため優先度低。
- 在庫少閾値の非数値 fallback 可視化（UI-11a 実装時の事実確認起源）: BIZ `list_low_stock` が `stock_low_threshold` / `stock_low_threshold_fabric` の非数値値を無警告で fallback する（ログ・operation_logs 記録なし）。DB 直接操作以外で非数値が入る経路が現状ないため優先度低。
- Z004 layout B 対応 + 混在期間の非 PLU 商品 end-to-end 再検証（layout A は PR #81 で消化済み、PLU スロット永続割当 design-first は PR #84 で正本化済み。残 = layout B 対応、混在期間の非 PLU 商品 end-to-end 検証）。
- PLU slot 後続 follow-up（PR #84 packet Non-scope 起源）: Z004 売上取込み〈BIZ-03〉内でのスロット占有自動更新（要望が出たら別 packet）/ CV17「レジスターの設定」書出し .txt の読込み対応（owner 裁定 Q2 = A で不採用、レジ側単価とアプリ売価の突合等の別要求が出た時のみ再検討）。
- smoke E2E / visual regression の再評価トリガー（全画面横断 typography / density 変更時、Phase 3 の最初の画面横断 workflow 計画時、Phase 4 完了後の `v1.0.0` 候補前に再評価する契約。UI_TECH_STACK §7.2）。
- Workflow 自走化 mechanical slice 2（PK4/PK5、drift grep test、hook 評価。design + implementation slice 1 は PR #162/#163 で完了、slice 2 は Appendix C として別 Plan Packet へ deferred）。
- Workflow 自走化 第 3 層（自走ドライバ）: 単一エントリポイントが状態ファイル群から次の dependency-ready フェーズを決定 → 実行 → gate 通過で状態更新、を人間ゲートに当たるまでループする構想。前提 = 第 2 層完了、3 層構想の経緯は第 2 層着手時の Design Phase で decision-log / 設計書へ昇格予定。

## ブロッカー

- 現在ブロッカーなし。Fable exit runway は完了済み（archive 参照）。Phase 4 第1スライス（UI-11b）は PR #144 の Fable 裁定 P2/P3 修正後に再確認。

## 注意リスト

- 既存 research ADR は `docs/research/` に残っている。当面は [adr/README.md](adr/README.md) が index する。
- 実 POS / 店舗 artifact、DB file、backup、log、receipt image、secret は commit しない。
- operator-facing UI flow の変更では、Windows native L3 verification が引き続き必要。
- 画面を新規作成または大きく変更した PR は、CI / review-only が clean でも owner 目視確認パートを merge 前に設ける。

## 最近の archive

- [2026-08-29 UI 表示磨き batch 第 1 弾 + DSR-16](archive/plans/2026-08-29-ui-polish-batch.md)
- [2026-08-29 入出庫履歴 6 種対称化 実装](archive/plans/2026-08-29-records-six-symmetry-impl.md)
- [2026-08-29 入出庫履歴 6 種対称化 Design Phase](archive/plans/2026-08-29-inventory-records-six-symmetry-design.md)
- [2026-08-28 product_service failpoint 並列 test race 是正](archive/plans/2026-08-28-failpoint-test-race.md)
- [2026-08-28 docs 衛生 batch](archive/plans/2026-08-28-docs-hygiene-sync.md)
- それ以前は `docs/archive/plans/` と GitHub PR 履歴を参照。旧 verbose dashboard の snapshot chain: [2026-08-28](archive/plans/2026-08-28-plans-dashboard-cleanup.md) / [2026-07-04](archive/plans/2026-07-04-plans-dashboard-cleanup.md) / [2026-06-06](archive/plans/2026-06-06-plans-dashboard-cleanup.md)。
