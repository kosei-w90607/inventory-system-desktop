# Plans.md

> 現在のフェーズ、進行中の作業、ブロッカー、次の行動を追うためのライブダッシュボード。完了済みの詳細履歴は archive に移す。

## 現在のフェーズ

- 製品フェーズ: Phase 3 UI 群は PR #117 までに完了。Phase 4 は UI-11b（PR #144）/ UI-11a（PR #151/#152）/ UI-10 棚卸し（PR #159）/ UI-11c 操作ログ（PR #164）/ UI-13 整合性検証（Public PR #5）で完了。`v0.8.0-ui-daily` tag は `f44f99a`。**リリースへの道筋**: 新画面を伴う当初仕様は UI-15（PR #4、2026-08-26）で全て実装完了。①実装 PR C（入庫 cost_diffs、PR #5）②docs 実装状況棚卸し（PR #6）に続き、実コード側 stale 表記 batch（PR #7）・商品一覧 plu filter の returnTo 脱落 fix（PR #8）・棚卸し詳細 route（PR #9）・wave 6 docs 衛生 batch + failpoint 並列 race 是正（PR #10・#11、2026-08-28 完了）・6 種対称化 Design Phase（PR #13、2026-08-29）まで消化済み。残り = ③ UI backlog の表示磨き batch ④ UI 一覧の背骨 D（Lane 1〜5、完了時に E2E / visual regression 再評価〈UI_TECH_STACK §7.2〉）⑤ go-live 検証 flow（PLU 実機再確認 + Z004 layout 有効化 + 部門キー→PLU 移行計画）+ MSI 配布手順 docs 化 → v1.0。着手順は「次の行動」で owner と選定。
- 現在の基準: 正本 repo は `kosei-w90607/inventory-system-desktop`（2026-08-23〜24 rehome、旧 public repo `inventory-system-public` は private 化）。詳細は decision-log D-077 / [docs/PUBLIC_REPO_MIGRATION.md](PUBLIC_REPO_MIGRATION.md) を参照。
- 2026-06-30 UI-08 前フィールド確認: 現店舗の日報主入力は `Z001` / `Z002` / `Z005`、`Z004` は PLU(商品) / 商品別トラックとして扱う。詳細は [plu-export-and-real-csv-verification.md](plu-export-and-real-csv-verification.md)。

## 残作業分類

未了 backlog は下記『Backlog（未了）』節を参照。

## 直近の完了

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

## 次の行動

- [ ] **入出庫履歴 6 種対称化 実装 PR B（R3、next）**: design-first は PR #13 で完了。Plan Packet / Test Matrix は起票済み — [active Packet](plans/2026-08-29-records-six-symmetry-impl.md) / [Matrix](plans/test-matrices/2026-08-29-records-six-symmetry-impl.md)。次段は独立 Plan Review → Codex 発注。[遷移契約 sweep 記録](archive/plans/2026-08-26-transition-contract-sweep.md) と「Backlog（未了）」の入出庫履歴 runway 項目を継続参照し、「前の画面へ戻る」導線契約は別 design-first 候補のまま維持する。
- [ ] ③ UI backlog の表示磨き batch: 着手時に owner と選定
- [ ] ④ UI 一覧の背骨 D Lane 1〜5: 着手時に owner と選定（完了時に E2E / visual regression 再評価〈UI_TECH_STACK §7.2〉）
- [ ] ⑤ go-live 検証 flow（PLU 実機再確認 + Z004 layout 有効化 + 部門キー→PLU 移行計画）+ MSI 配布手順 docs 化: 着手時に owner と選定

### Wave Registry

- 形式: 現 wave ごとに status / lane 数 / merge train 順序を置き、各 lane に是正単位、branch、active packet link、Draft PR、Workflow State Phase、owner 介入回数を記録する。lane packet の選択と PK4 は、この「次の行動」節内の link を正本として fail-closed 判定する。
- 現在 active wave なし。
- wave 1（2 lane pilot）: 完了 2026-07-28 — PR #29 squash `8f67315` / PR #30 squash `eac9d20`。[WER](archive/plans/2026-07-28-wave-1-pilot-workflow-effectiveness-review.md)
- wave 2（2 lane worktree）: 完了 2026-07-28 — merge train PR #33 squash `6c53c44` -> PR #32 squash `29b35ed`。[WER](archive/plans/2026-07-28-wave-2-workflow-effectiveness-review.md)
- wave 3（3 lane）: 完了 2026-07-29 — merge train PR #34 squash `3f5086b` -> PR #35 squash `b9d7e49` -> PR #36 squash `90cc963`。[WER](archive/plans/2026-07-29-wave-3-workflow-effectiveness-review.md)
- wave 4（3 lane）: 完了 2026-07-30 — merge train PR #40 squash `b3ac5e5` -> PR #39 squash `669dfee` -> PR #38 squash `a29f2e8`。[WER](archive/plans/2026-07-30-wave-4-workflow-effectiveness-review.md)
- wave 5（stacked 2 lane）: 完了 2026-08-20 — PR #85 squash `014c064` -> PR #86 squash `b2389b1`。[archived Packet lane 1](archive/plans/2026-08-18-plu-slot-core-implementation.md) / [lane 2](archive/plans/2026-08-19-plu-bulk-onboarding-implementation.md)
- wave 6（2 lane、小粒衛生 batch）: 完了 2026-08-28 — merge train PR #10 squash `42b6679` -> PR #11 squash `cec68ba`。[archived Packet lane 1](archive/plans/2026-08-28-docs-hygiene-sync.md) / [lane 2](archive/plans/2026-08-28-failpoint-test-race.md)

## Backlog（未了）

- command drift detection（`collect_commands!` / `generate_handler!` の drift detection 未導入）。合わせて repository root に残る未参照の退役 `Dockerfile` / `docker-compose.yml` は `DEV_SETUP_CHECKLIST.md` §A.1 の履歴コピーとの不一致（Rust / Node pin 含む）を確認のうえ削除または再同期を別 change で判断する。
- TanStack Router generation settings の統一。
- UI-09a・09b 将来設計（UI-09b の日報 coverage 表示「一部日だけ日報がある月」の取込み済み日数、SALES2-D3 で自覚的 defer〈batch A から移管〉、34-biz §19.4 参照。`get_monthly_sales` DTO 拡張を伴う R3）。
- bindings whitespace（bindings trailing-whitespace generation の扱い）。
- PLUスロット永続割当の恒久設計（CV17 import が メモリNo. merge のため現行再採番と衝突。[2026-07-03 packet](archive/plans/2026-07-03-post-ui08-janless-plu-target-design.md) D-6 参照）。
- MSI 配布手順 docs 化（v1.0 gate。「次の行動」⑤と対応）。
- バックアップ一覧の肥大化 UX（保持日数で自然減のため優先度低）。
- architecture_test の re-export 洗浄検出強化（cmd が biz/mnt の re-export 経由で db symbol を消費する間接依存は現行の use 行 literal match で検出不能 — 順12 実装 AMD2 で実証。cmd-task-specs に検出境界を明記済み、検出強化は将来判断）。
- D-052-E1 の語義重複整理（invalidation 除外と query-keys literal 例外容認の 2 契約が同一 ID を共有。順17 plan-gate round 1 P3 起源、decision-log 整理時に別 ID へ分離）。
- 70-mnt-diagnostic-log.md §のサンプルコード陳腐化（189-198 行付近が `.expect()` ベースで実コード〈`?` 伝搬〉と乖離。setup 失敗可視化 change の Plan Review round 1 P3-1 起源、doc 整理時に実コードへ同期）。
- ARCHITECTURE.md §2 CMD-11 行の MNT-02 表記 cleanup（実 import は MNT-01 のみで cmd-task-specs に MNT-02 mapping なし。pre-existing の集約表記慣習で D-060 起因ではない。順12 Final Review P3-1 起源、削除または注記化を将来判断）。
- .gitignore protected-paths block の補完（`.claude/hooks` / `.claude/loop.md` が sandbox device mask 対象なのに未登録で sandbox 内 git status が DIRTY 化。104-120 行の既存 block へ 2 行追加、暫定対処は `.git/info/exclude` で実施済み）。
- 整合性検証の名称統一検討（サイドバー label「整合性検証」と遷移先ページ見出し「在庫整合性チェック」の名称差。双方とも正本どおりの実装で操作可能なため非 blocker、統一は表示幅含め後日検討 — 受入台本 L3 round 3 2026-08-13 の owner 観察起源〈PR #74 comment〉、P3）。
- 在庫状態表示の filter 依存不整合（在庫 2・基準 3 の同一商品が「すべて」filter では状態「通常」、「在庫少」filter では「在庫少」と表示される。query source 依存の pre-existing 仕様で受入台本 L3 2026-08-13 の owner 観察起源〈PR #74 comment〉。operator には矛盾に見えるため follow-up 要否を検討、優先度は owner 判断）。
- 部門 17「本」のバーコードなし本・ISBN-10 本の登録経路（JAN 専用欄正規化 change の owner 裁定 2026-08-11 起源 = 本は 13 桁 JAN〈EAN-13/ISBN-13〉登録・ISBN-10 特例なし。部門 17 は code_prefix NULL のため JAN 欄空白の escape hatch が使えず、ISBN-10 のみの古書・バーコードなし本は登録不能のまま。要望発生時に code_prefix 付与 or ISBN-10 対応を再裁定）。
- 同日冪等取込みの UI polish 3 件（日報完了画面の action 間隔 / 両 tab rollback summary のラベル付き構造化・改行 / 追加確認 summary のラベル付き構造化・任意位置折返し回避。PR #80 owner human visual confirmation 2026-08-16 起源の P3、契約非変更の表示磨きとして後日 1 PR で束ねる）。
- I-G1 sweep test の gitignore 非尊重（pure Rust walk 化〈PR #80 是正 `980a211`〉は gitignored file も走査するため、将来 `src/routeTree.gen.ts` 等の生成物が旧 token を偶然含むと偽陽性 fail し得る。安全側にしか倒れない構造差で現時点 hit 0 を実測済み、顕在化時に走査除外 or 生成物パターン skip を判断）。
- STATECAP 検査の stacked train 継承除外（`check-workflow-git.sh` の範囲 `merge-base(origin/main, HEAD)..HEAD` が stack 点以前の他 lane forward state-only commit を自 PR に計上する。PR #86 で実測、docs 側の運用規律は正本化済み、機械側の範囲判定是正は設計非自明のため将来判断）。
- UI-01a 商品検索への取引先 filter 露出（backend `ProductSearchQuery` の `supplier_id` / `include_unassigned` は PR #95 で実装済み・UI 露出は UI-14 のみ。50-ui 画面契約の改訂が必要。UI-15 は PR #4 で完了済みのため着手可、UI 一覧の背骨 D 系の画面見直しとの前後関係は着手時に owner 判断）。
- 78 §78.4 の `SupplierWithUsage` field 名表記是正（doc の camelCase 表記を実 wire の snake_case〈40-cmd 記載と一致〉へ 1 行是正。UI-15 実装 PR #4 Final Review P3-1 起源、機能影響なし）。
- UI-15 改名ボタンの double-click 貫通リスク（保存確定の連打で二重送信し得る懸念。pending 中の行単位 disabled は実装・RTL 検証済みのため顕在化時に再評価、L3 owner 所感 2026-08-26 起源の P3）。
- UI-15 改名成功時の完了通知なし非対称（統合は完了通知あり・改名は行内反映のみ。78 doc は改名時通知を規定せず設計適合、同日冪等取込み UI polish 3 件と同じ表示磨き batch 候補）。
- 入庫原価差分ダイアログの UI polish 3 件（更新成功表示が本文テキストのみで視認性弱〈緑色成功 Alert との統一検討〉/ 更新成功後もカードのマスタ原価が旧値表示のままで更新済み状態との対応が曖昧 / 更新成功後も footer が「見送って閉じる」のままで完了後の操作名として紛らわしい。PR #5 L3 owner 所感 2026-08-26 起源の非阻害 P3、表示磨き batch 候補）。
- 「前の画面へ戻る」導線契約の規範化 design-first 候補（設計未定義 gap 8 件同型: recent list 発 4 + 保存結果発 3 + 操作ログ関連記録発 1 が returnTo 未送信で無絞り込み `/inventory/records` へ fallback、ラベルと実挙動の乖離。戻り先を遷移元にするか hub 正でラベル変更かの owner 裁定要）。
- 操作ログ関連記録の producer 0 件（74 §74.9 の link UI はあるが record_type 書込み producer が 0 件で実データ発火 0。上記戻り gap と二重 gap）。
- 入出庫履歴の完成形 runway 復帰（65 §65.10 slice 4b の CSV 取込み一覧・横断 hub 検索 + slice 6 の CSV 出力・印刷/控えが archive-only。検索母集団差〈商品マスタ vs 4 記録明細〉の利用者説明も含め裁定。棚卸しのハブ横断検索合流を含める — owner 裁定 2026-08-27: `/inventory/records` の種別を 6 種対称化する。棚卸し詳細 route は slice 4c で実装済みのため合流は backend `listInventoryRecords` の種別拡張 + hub UI が主対象、専用一覧 `/stocktake/records` は完成形契約のまま実需発生まで runway 残置）。
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
- linuxbrew ripgrep 15.1.0 のネガティブ glob 誤解釈（`--glob '!...'` をリテラル解釈し全マッチ 0 件を返す。`scripts/doc-consistency-check.sh` `test_token_exists()` の負 glob 除去〈PK3 偽 WARN 対策、exit code 影響なし〉を別 PR で対応）。
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

- [2026-08-28 product_service failpoint 並列 test race 是正](archive/plans/2026-08-28-failpoint-test-race.md)
- [2026-08-28 docs 衛生 batch](archive/plans/2026-08-28-docs-hygiene-sync.md)
- [2026-08-27 棚卸し詳細 route 実装](archive/plans/2026-08-27-stocktake-record-detail.md)
- [2026-08-26 商品一覧 plu filter returnTo 脱落 fix](archive/plans/2026-08-26-plu-returnto-fix.md)
- [2026-08-26 実コード側 stale 表記 batch](archive/plans/2026-08-26-code-stale-impl-status-batch.md)
- それ以前は `docs/archive/plans/` と GitHub PR 履歴を参照。旧 verbose dashboard の snapshot chain: [2026-08-28](archive/plans/2026-08-28-plans-dashboard-cleanup.md) / [2026-07-04](archive/plans/2026-07-04-plans-dashboard-cleanup.md) / [2026-06-06](archive/plans/2026-06-06-plans-dashboard-cleanup.md)。
