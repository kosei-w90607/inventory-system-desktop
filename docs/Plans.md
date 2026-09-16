# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

## 直近の完了

- **現行図面の同期・設計点検**: [PR #69](https://github.com/kosei-w90607/inventory-system-desktop/pull/69) を merge（2026-09-16）。現行 ER / 画面遷移 / 業務フローの図面 3 file を新設し DB_DESIGN / SCREEN_DESIGN / ARCHITECTURE / PROJECT_HANDOFF / ui-task-specs 等の docs を同期、Rust の横断業務検証 test を追加（通常 3 本 PASS、診断 2 本 `XFA_TEMPORAL_FAIL` / `XFA_LATE_IMPORT_FAIL` は `#[ignore]` の意図的 FAIL で棚卸し確定と二重減算の設計問題を記録）。監査所見 STK-1 / STK-2 / NAV-1 / DATA-2 / DOC-2 を [backlog](backlog.md#やると決めたもの順番未定) へ起票。[archive の Plan Packet](archive/plans/2026-09-16-current-system-diagrams.md) / [Matrix](archive/plans/test-matrices/2026-09-16-cross-feature-model-audit.md)、[監査](research/2026-09-16-diagram-audit.md)。Final Review = Sonnet PASS / Opus P2 2・P3 4 → 全採用 / Sonnet closure PASS（`ee72ceea`）。merge phase は Fable が代行: origin/main（wave 11 #70〜#73）単段 merge `a3e44edc`、closure（Sonnet fresh）で P2 1 件〈図面の廃棄保存結果リンクが #71 と矛盾〉→ `6eba236f` で是正、Ready → CI pass → helper merge。

- **ホーム画面を mockup-c 案へ寄せる**: [PR #70](https://github.com/kosei-w90607/inventory-system-desktop/pull/70) を merge（2026-09-16）。owner 決定 2026-09-11（mockup-c 採用、補助文言は状態の説明、前日分未取込み alert は不変）起源。入口 card に icon + 題名 + 1 行説明（`NavItem.description`）/ 「売上データ取込み」の primary 強調 / 補助文言は状態の説明（D-089）/ 在庫切れ・在庫少の件数は 1 件以上で状態色を実装。PLU 未反映 card は owner L3 round 1 所感で撤去（3 枚のまま）。[archive の Plan Packet](archive/plans/2026-09-16-home-mockup-c-runtime.md)。Final Review round 1 = Sonnet pass A（P3 3）/ Opus pass B（P2 2 → SCREEN_DESIGN 同期）/ closure、GA4 是正後に broad 2 本取り直し（Opus + Sonnet、pass）。owner L3 2 round PASS（round 1 所感 → GA4、round 2 PASS）。介入 2/3、Codex relay 1/2 + Sonnet Writer。dogfood 所見: Codex 発注書 58 / 59 の fail-closed 停止 4 回はすべて Coordinator の packet 記述誤り（AC の count・mock 境界・test 本数・隣接 test の regex 衝突）。broad 監査後に GA を積むと helper が closure を拒否し broad 取り直しになる。

- **廃棄・破損の保存結果に「詳細を見る」+ `returnTo`**: [PR #71](https://github.com/kosei-w90607/inventory-system-desktop/pull/71) を merge（2026-09-16）。owner 2026-09-11「やったほうがいい」（PR #23 owner L3 所感 2026-08-31 起源）。UI-05-D17 を改訂し、保存結果にも詳細 link（`returnTo` 送信）を追加、入庫・返品交換と対称化。[archive の Plan Packet](archive/plans/2026-09-16-disposal-result-detail-link.md) / [Matrix](archive/plans/test-matrices/2026-09-16-disposal-result-detail-link.md)。Final Review round 1 = Sonnet pass A / Opus pass B P3 3 → 本 closeout で是正。owner L3 round 1 PASS。介入 1/3、Codex relay 3/3（3 回とも Coordinator の packet 記述誤り、Writer は正しく fail-closed）+ Sonnet Writer で実装。

- **一括価格改定の取引先紐付けを既定 off + 文言明示**: [PR #67](https://github.com/kosei-w90607/inventory-system-desktop/pull/67) を merge（2026-09-16）。owner 決定 2026-09-16（L3 round 3 所感「価格改定のついでに取引先が変わる」）起源。toggle 既定 off・供給者変更時も off のまま・label 文言変更を実装し、設計書 77 / `ui-task-specs.md` UI-14 を新既定へ同期、decision-log D-088。[archive の Plan Packet](archive/plans/2026-09-16-price-revision-assign-default-off.md)。Final Review round 1 = Sonnet pass / Opus P2 是正 → pass、owner L3 round 1 PASS。

- **表示小修正 batch 2**: [PR #64](https://github.com/kosei-w90607/inventory-system-desktop/pull/64) を merge（2026-09-16）。在庫少の基準の区画見出し撤去（説明文のみ）/ Alert title 太字（600）/ 在庫照会の副題 + 絞り込み時「全 N 件」/ 在庫状態 Badge「在庫あり」/ 基準の入力 error 文言 1 本化 / 入出庫履歴の明細数列撤去を実装し、[archive の Plan Packet](archive/plans/2026-09-15-display-fixes-batch-2.md) / [Matrix](archive/plans/test-matrices/2026-09-15-display-fixes-batch-2.md) に Final Review closure と GA1〜GA3 + GA3 補正を記録。

- **フィルタ Label 上置き + 見出し 2 段の runtime**: [PR #63](https://github.com/kosei-w90607/inventory-system-desktop/pull/63) を merge（2026-09-16）。一覧 toolbar の label 上置き・SegmentedControl の可視 label・section 見出しの 2 段化を 5 site + 見出し群へ反映し、[archive の Plan Packet](archive/plans/2026-09-15-filter-label-top-runtime.md) / [Matrix](archive/plans/test-matrices/2026-09-15-filter-label-top-runtime.md) に GA1〜GA4 と L3 3 round を記録。

- **衛生batch 4**: [PR #61](https://github.com/kosei-w90607/inventory-system-desktop/pull/61)をmerge。doc-consistency WARN 5件掃除・mockup-gの`:has()`是正・npm名指し更新（js-yaml/vitest実更新、smol-toml override）を実施し、[archive packet](archive/plans/2026-09-14-hygiene-batch-4-doc-warn-deps.md)へ移送した。Dependabotのopen alertは0件、Final ReviewはSonnet + Opusの独立2パスで完了（P3 4件はbacklog「記録目的」へ）。relay往復は5/上限2を超過、原因はCoordinator側の発注品質3回で、Writerは毎回fail-closedで正しく停止した。workflow effectivenessのdogfood所見: 実装後のstate-only commit 0件でDraft→record→Ready→mergeがhelperのみで完結／Gated AmendmentはCoordinatorのcontent commit + 登録commitの2 commit構成／fresh worktreeでvitestを回す前に`npm run generate:routes`が必要／`codex exec -o`の報告fileが未更新のケースがありlogから回収した。次のdogfood targetはフィルタLabel上置きruntime laneでのclosure recordとmanual（L3）record。

- **マージ検証整理と互換性修正**: [PR #54](https://github.com/kosei-w90607/inventory-system-desktop/pull/54) / [PR #59](https://github.com/kosei-w90607/inventory-system-desktop/pull/59)をmerge。GitHubの既定項目を扱うhelperとD-087のAstra一貫担当を導入し、[修正Packet](archive/plans/2026-09-14-merge-rules-compatibility.md) / [Matrix](archive/plans/test-matrices/2026-09-14-merge-rules-compatibility.md)をarchiveへ移した。CI・独立監査・native拒否/正常merge試験・一時資源cleanupを完了。本番保護の現在の有効化事実は、[PR #59](https://github.com/kosei-w90607/inventory-system-desktop/pull/59)の専用記録とhelper statusを参照する。ownerは締めまで承認済み、累計12/12回。局所変数名整理と旧packetのP3は着手条件付き後続保持。workflow effectivenessのdogfoodは新mode有効化後の最初のR2+ PR。

- **ハーネス文脈効率**: [PR #52](https://github.com/kosei-w90607/inventory-system-desktop/pull/52) をmergeし、[Plan Packet](archive/plans/2026-09-13-harness-context-efficiency.md) / [Matrix](archive/plans/test-matrices/2026-09-13-harness-context-efficiency.md) をarchiveへ移した。必要な読書と保護規定を両立させ、L1/hosted/独立reviewを完了。後続P3と未実測はPRに保持し、次のR2+作業でdogfoodする。

### Wave Registry

- 形式: 現 wave ごとに status / lane 数 / merge train 順序を置き、各 lane に是正単位、branch、active packet link、Draft PR、Workflow State Phase、owner 介入回数を記録する。完了済み wave の記録は [archive](archive/harness-context/2026-09-14-Plans.md) に移送済み。
- **wave 10（stacked train 2 lane、owner 2026-09-15「次の行動二つとって並走」）: 完了（lane 1〜3、2026-09-16）** — 非干渉 wave の条件（file footprint 互いに素 / 同じ source document を編集しない）を `src/features/stock-inquiry/StockInquiryPage.tsx` と `docs/design-system/02-component-catalog.md` の共有で満たさないため、D-074 の stacked train を採る。merge train = ㉑ → ㉒ 固定。
  - lane 1: ㉑ フィルタ Label 上置き + 見出し 2 段の runtime = **完了**（PR #63 squash `bb1862a5`、介入 3/4、relay 4/4、[archive](archive/plans/2026-09-15-filter-label-top-runtime.md)）
  - lane 2: ㉒ 表示小修正 batch 2 = **完了**（PR #64 squash `f2ef9e52`、介入 2/3、relay 4/4、[archive](archive/plans/2026-09-15-display-fixes-batch-2.md)）
  - lane 3: ㉓ 一括価格改定の取引先紐付けを既定 off + 文言明示 = **完了**（PR #67 squash `ebbbef14`、介入 1/3、relay 3/3、[archive](archive/plans/2026-09-16-price-revision-assign-default-off.md)）
- **wave 11（非干渉並走 2 lane、owner 2026-09-16「ホーム画面 + 廃棄の詳細 link」）: 完了（lane 1〜2、2026-09-16）** — file footprint 互いに素（lane 1 = `src/features/home/**` + `src/config/navigation.ts` + SCREEN_DESIGN / 53 / 52 / decision-log、lane 2 = `src/features/disposal/**` + 64）、同じ source document を編集せず、生成 file の再生成なし。D-055 の並列 wave。merge train 順は Draft PR 到達順で owner が指定（既定案 = human-confirm 到達順）。
  - lane 1: ㉔ ホーム画面を mockup-c 案へ寄せる = **完了**（PR #70 squash `41c2e3e2`、介入 2/3、relay 1/2、[archive](archive/plans/2026-09-16-home-mockup-c-runtime.md)）
  - lane 2: ㉕ 廃棄・破損の保存結果に「詳細を見る」+ `returnTo` = **完了**（PR #71 squash `949a5c4c`、介入 1/3、relay 3/3、[archive](archive/plans/2026-09-16-disposal-result-detail-link.md)）

## ブロッカー

次 lane を止める製品側のblockerはない。単位の拡張の店回答は 2026-09-15 に揃った（POS 数量 1 = 1 m、小数 1 桁で打てる。[聞き取り記録](evidence/hearing-2026-09-14-stock-units.sanitized.md)）。design lane は起票可だが、wave 10 の後に並べる（owner 2026-09-15 合意）。

## 製品の未決判断

L8-4は owner 決定済み（下記参照）。L8-2/L8-5は旧⑩laneからの記録・実機観測の申し送りで、判断待ちではない。いずれもハーネス整備を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-4 明細数列は owner 決定 2026-09-15 で (a) 撤去。runtime 反映は Backlog の表示小修正 batch 2 に同乗。
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数列 撤去決定）・L8-5（記録日時 font 差、④ C5 追跡中）は対象外（参照のみ）
- STK-1 / STK-2（[監査](research/2026-09-16-diagram-audit.md) 由来、棚卸し確定が入出庫を打ち消す設計問題と二重減算）は是正方式が owner 判断待ち、着手順は [backlog](backlog.md#やると決めたもの順番未定) を参照

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
