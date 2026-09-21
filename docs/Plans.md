# Plans.md

現在の作業・未解決判断・次の行動のdashboard。長い候補一覧は [Backlog](backlog.md)、完了履歴は [archive](archive/harness-context/2026-09-14-Plans.md) に置く。

## 現在のフェーズ

製品の当初画面群は実装済み。残る改善とgo-live作業の選定は [Backlog](backlog.md) を参照。正本repositoryは `kosei-w90607/inventory-system-desktop`（D-077）。

## 次の行動

- **㉗ 棚卸しと後着売上の時点証拠（STK-1 / STK-2、R3、implementing）**: [Plan Packet](plans/2026-09-16-stocktake-count-baseline.md)。branch `agent/stocktake-count-baseline-design`、Plan Commit `b7f19514`。round 3 closure（対象 `a2a265bf`）は移行境界の新規P2で通過不可・天井到達、owner escalationを経た。発注68で[初導入・本番履歴なし](project-memory.md)を正本化し、新形式での本番開始、旧試験履歴の不持込み、旧importのメタ不足拒否と日付つきpreflight、過去日の後追い対応を同期した。追加Opus closure（対象 `b7f19514`）はP1/P2 = 0で通過し、2026-09-19にplan-approved、2026-09-21にimplementingへ遷移。介入上限9はowner承認済み（9/9）。Draft PR #85のFinal Review初回指摘は発注70で是正。GA1後の是正headへCoordinatorがbroadを再取得し、closureを確認してからReady → mergeへ進む。旧棚卸し/取消の互換機構は維持し、初導入の実作業とは区別する。同精算別hash・系列未証明reset等の未解決拒否は残り、再実測では売上欠落を復旧しない。runtime・DB作り直し・実機検証は未実施。wave 12 lane 2。
- 製品作業の既定順序は [次に動くlane](backlog.md#次に動く-lane順番固定) を維持する。

㉗の統合案は是正 `68c3d0d3` でOpus closure pass、follow-up P3は `24087bad` で是正。main単段merge `36891af8` 後のsource同期はADRの判断を変えていない。sourceの事前点検で見つかったactive legacyの分岐と時計失効のTX境界も是正・解消確認済みだが、旧closureを新しいsource全体の正式承認には流用しない。

## 直近の完了

- **Writer 発注文書の整理**: [PR #82](https://github.com/kosei-w90607/inventory-system-desktop/pull/82) を merge（2026-09-19、main `8ae12595`）。owner の発注漏れ調査依頼を受け、`docs/AGENT_OPERATING_MANUAL.md` §5.6 に発注構成・起草時の現物確認・初回 / 再開の区別・訂正時の照合を集約し、`docs/DEV_WORKFLOW.md` 前提訂正 sweep の対象へ当該変更の最終 Writer 発注書・再開指示を追加、`docs/templates/plan-packet.md` / `test-design-matrix.md` の Scope / AC / Registration / Matrix 欄を明確化した。[archive の Plan Packet](archive/plans/2026-09-17-writer-dispatch-docs.md)。Gated Amendment 1（`25cf5cb2`、Final Review Minimum 2 へ引上げ）後、Final Review = broad 2 本（Sonnet P1/P2 なし、Opus P2 2 件）→ 是正 `a9faaccc` → Opus closure pass。helper record と CI（Merge gate / Design doc consistency / Workflow regression pass）で Ready → merge。報告は PR #82 の comment `#issuecomment-5732743285` / `#issuecomment-5732763646` / `#issuecomment-5732927180`。取り込み順の申し送り: ㉗ 棚卸しの基準時点は再開時に本 PR 反映後の最新 main を単段 merge してから続ける。次 dogfood 対象: ㉗ の次回 Writer 発注で §5.6 の手順を使い、発注前の fail-closed の有無を観測する。

- **㉙ returnTo 衛生**: [PR #78](https://github.com/kosei-w90607/inventory-system-desktop/pull/78) を merge（2026-09-17）。NAV-1（PR #75）Final Review round 1 pass B / round 2 pass B の P3 5 件 + 起票時に見つけた同型の実害（入出庫履歴の数字だけの検索語が詳細からの戻りで消える）を修正。`returnTo` guard の検証を prefix 判定から origin 一致 + 解決後 pathname の `//` 拒否 + no-throw（C7）へ強化し、業務記録詳細 6 画面と在庫変動履歴の戻り link を文字列 `to` から `to`（pathname）+ `search`（object）へ統一（`returnToLinkProps`、「在庫照会へ戻る」は `/stock` に pin）。入出庫履歴の `returnTo` を手組みの `URLSearchParams` から router の href へ寄せ、数字だけの検索語が number 化せず往復するようにした。在庫照会 `selected` の上限も `q` と同じ 100 文字に揃えた（旧 20）。[archive の Plan Packet](archive/plans/2026-09-17-return-to-hygiene.md) / [Matrix](archive/plans/test-matrices/2026-09-17-return-to-hygiene.md)。

- **一括価格改定: 同一取引先の再選択で紐付け toggle が off へ戻ることを固定する test**: [PR #77](https://github.com/kosei-w90607/inventory-system-desktop/pull/77) を merge（2026-09-17）。PR #67 Final Review pass B の指摘が起源。`PriceRevisionPage.tsx:37` の `setAssignSupplier(false)` が同一取引先の再選択で単独に効く load-bearing 行であり、除去しても既存 test が落ちないことを test で固定した。production code と設計 docs は不変。Codex の独立レビューで指摘 0、mutant の red / green を Writer・Coordinator・Codex が独立に再現。

- **在庫変動履歴からの戻りで在庫照会の検索条件と商品選択を保持する（NAV-1）**: [PR #75](https://github.com/kosei-w90607/inventory-system-desktop/pull/75) を merge（2026-09-17）。監査 NAV-1（P2、[根拠](research/2026-09-16-diagram-audit.md#nav-1-在庫変動履歴からの戻りで商品選択が失われる)）起源。在庫照会の詳細（インライン展開・フォールバックカード）→ 在庫変動履歴の link に現在の `/stock` URL を `returnTo` として送り（UI-06a-D7）、「在庫照会へ戻る」は `returnTo` を正規化して戻る。欠落・不正時は `Link` の `search` props（`{ q, selected }`、GA5）で商品コード検索付き `/stock` へ fallback（UI-06c-D9）。業務記録詳細との往復でも `returnTo` を入れ子で保持。[archive の Plan Packet](archive/plans/2026-09-16-stock-movements-return-selected.md) / [Matrix](archive/plans/test-matrices/2026-09-16-stock-movements-return-selected.md)。Final Review round 1（head `9e8d02be`）= Sonnet pass A / Opus pass B とも P1/P2 0、round 2（head `8192c2db`、GA5 後）= 両 pass P2 1（66 の fallback 記述 drift）→ `4b48cd38` で是正 → closure pass。owner L3 round 1 = (a) PASS / (b) FAIL → Gated Amendment 5、round 2 = (a)(b) PASS。介入 3/3、Codex relay 4/4（GA5 で上限改訂）。dogfood 所見: Codex の fail-closed 停止 3 回はすべて Coordinator の発注誤り〈削除 oracle の regex が新記述にも一致 / REQ 付き test 追加で 90-traceability 再生成が要ることの見落とし / 再開版発注書に実装前の着手条件を残した〉。L3 で見つかった欠陥 = route/search state を文字列で組んだため数字だけの商品コードが `parseSearch` で number 化し検索前状態へ戻った（`Link` の `search` props で修正）。教訓: L3 で欠陥が出た後は追加の docs commit を積まず closeout へ回す（broad 取り直しの手戻りを避ける）。

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
- **wave 12（起案時は非干渉並走、owner 2026-09-16「次何やるかふたつとって早速始めよう」、lane 選定は Coordinator）: 進行中（lane 2 plan-approved、lane 1/3 完了）** — 現在の作業対象はlane 2のみ。source同期の最新footprintはpacket Scope S1〜S7を正とし、起案時のruntime候補一覧を現在の編集許可にしない。生成fileの再生成なし。
  - lane 1: ㉖ 在庫変動履歴からの戻りで在庫照会の検索条件と商品選択を保持する = **完了**（PR #75 squash `6f7928ed`、介入 3/3、relay 4/4、[archive](archive/plans/2026-09-16-stock-movements-return-selected.md)）
  - lane 2: ㉗ 棚卸しと後着売上の時点証拠（R3 docs-only、`agent/stocktake-count-baseline-design`、[Packet](plans/2026-09-16-stocktake-count-baseline.md)、Phase implementing（2026-09-21、Plan Gate通過は2026-09-19）。Draft PR #85の指摘是正後、GA1によりFinal Reviewのbroad再取得とclosureへ。介入9/9（上限9はowner承認済み））
  - lane 3: ㉙ returnTo 衛生 = **完了**（PR #78 squash `a68ba291`、介入 3/3、relay 2/3、[archive](archive/plans/2026-09-17-return-to-hygiene.md)）
- **wave 11（非干渉並走 2 lane、owner 2026-09-16「ホーム画面 + 廃棄の詳細 link」）: 完了（lane 1〜2、2026-09-16）** — file footprint 互いに素（lane 1 = `src/features/home/**` + `src/config/navigation.ts` + SCREEN_DESIGN / 53 / 52 / decision-log、lane 2 = `src/features/disposal/**` + 64）、同じ source document を編集せず、生成 file の再生成なし。D-055 の並列 wave。merge train 順は Draft PR 到達順で owner が指定（既定案 = human-confirm 到達順）。
  - lane 1: ㉔ ホーム画面を mockup-c 案へ寄せる = **完了**（PR #70 squash `41c2e3e2`、介入 2/3、relay 1/2、[archive](archive/plans/2026-09-16-home-mockup-c-runtime.md)）
  - lane 2: ㉕ 廃棄・破損の保存結果に「詳細を見る」+ `returnTo` = **完了**（PR #71 squash `949a5c4c`、介入 1/3、relay 3/3、[archive](archive/plans/2026-09-16-disposal-result-detail-link.md)）

## ブロッカー

次 lane を止める製品側のblockerはない。単位の拡張の店回答は 2026-09-15 に揃った（POS 数量 1 = 1 m、小数 1 桁で打てる。[聞き取り記録](evidence/hearing-2026-09-14-stock-units.sanitized.md)）。design lane は起票可だが、wave 10 の後に並べる（owner 2026-09-15 合意）。

## 製品の未決判断

L8-4は owner 決定済み（下記参照）。L8-2/L8-5は旧⑩laneからの記録・実機観測の申し送りで、判断待ちではない。いずれもハーネス整備を止めるgateではなく、採用や新規backlog起票を行わずに元の状態を保持する。

- L8-4 明細数列は owner 決定 2026-09-15 で (a) 撤去。runtime 反映は Backlog の表示小修正 batch 2 に同乗。
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数列 撤去決定）・L8-5（記録日時 font 差、④ C5 追跡中）は対象外（参照のみ）
- STK-1 / STK-2は[統合ADR](adr/2026-09-18-stocktake-time-evidence.md)からsource詳細へ同期し、正式Plan Gateを通過してplan-approved（2026-09-19）。snapshot補正・商品単位の再実測・過去評価額の非遡及は引き継ぐ。旧日付比較や未検証の時刻補完を実装指示に使わない。ownerの未確認の店舗運用を受容済みにせず、正式Plan Gateまではruntimeへ進めない。

元の文脈は [移送前のPlans](archive/harness-context/2026-09-14-Plans.md)。関連する製品作業でownerの判断を得る。

## 参照

- [安定した製品前提](project-memory.md)、[引き継ぎ案内](PROJECT_HANDOFF.md)
- [未了項目・保留・受容済みリスク](backlog.md)
- [移送前のdashboard全文](archive/harness-context/2026-09-14-Plans.md)
