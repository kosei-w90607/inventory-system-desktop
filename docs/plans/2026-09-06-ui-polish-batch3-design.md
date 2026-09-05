# Plan Packet: UI 磨き batch 3 design（ページ説明セクション・記録IDの表示・備考の規則・記録状態Badge・PageHeader間隔・単位表示sweep、docs-only）

Plans.md ④ L8 ledger（owner「⑧ PR #38 L3 結果 原文」2026-09-06、`docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md`）のうち design-first 判定を受けた L8-1・L8-3・L8-6・L8-7・L8-8・L8-9 の 6 件を design-system canonical docs へ規範化する。L8-6 は Plans.md ④ 既存の runtime backlog 項目 A1(a)(b)(c)（`docs/Plans.md:68`、「直近の○○」系 section の文言・列見出し・囲み統一）と統合して 1 item として扱う。L8-2（badge 無色、⑦ runtime lane 待ち）・L8-4（明細数 summary 未決）・L8-5（記録日時 font 差、既に Plans ④ C5 で追跡中）は本 packet の対象外（Non-scope、Plans.md 側で参照のみ）。本 packet 自体は docs-only（design-system canonical docs 本体の改訂は Plan Review 後に別 Writer 起草が着手する。本 commit は Plan Packet + Test Design Matrix + `docs/Plans.md` の起票のみ）。

**Plan Review round 1 是正（Coordinator 直接レビュー、Opus 並行分は別途反映。全件 accept、本 commit で反映済み。詳細は文末「Review Response」節）**。本文は是正後の最終状態のみを記す。

**補足（merge 順序、⑦ との重複 file）**: 本 packet（⑩）は `02-component-catalog.md` ①③ と `01-decision-rules.md` DSR-22（注記）を編集する。`agent/ui-conventions-batch`（⑦、未 merge）は同じ `02-component-catalog.md`（⑬ 等）と DSR-22（本文の narrow 化）を編集する。両方とも同じ 2 file を触るため、どちらかが先に merge した場合、後に merge する側が origin/main を取り込んでから自身の rg oracle を再実行すること（行番号ずれ・記述の重複衝突の検出。⑦ の DSR-23 帰属節が ⑧ に対して定めた運用と同型）。

**起草中に判明した事実訂正（Coordinator 指摘、本節で先出し）**:
- L8-8 の発注前提「`PageHeader` の `description` prop」は誤り。`PageHeader.tsx` に `description` prop は無く、`subtitle` prop のみが存在する（実測は「起票時実測」節参照）。加えて `subtitle` は `actions` が渡されると描画されない分岐になっており、`商品一括インポート`（`ProductImportPage.tsx`、`actions` に「商品一覧へ戻る」ボタンを持つ）のような画面では `subtitle` prop を渡しても表示されない component gap がある。**Plan Review round 1 是正（P1）**: 単一行 `rg` の見落としで、実際には `SupplierManagementPage.tsx` 以外に `ReceivingPage.tsx` / `ManualSalePage.tsx` / `ReturnExchangePage.tsx` / `DisposalPage.tsx` の 4 画面が既に `subtitle` を渡しながら `actions` に握りつぶされ、説明文が画面に一切表示されていない（詳細は「起票時実測」節）。是正方向は使用パターンではなく `PageHeader.tsx` 本体の root-cause fix に一本化する。
- 04-backbone.md の「1 行説明」原則は発注前提の「原則 8」ではなく **原則 9**（実測は「起票時実測」節参照）。
- 「直近の○○」系 section の囲みは、発注前提「手動販売出庫だけ囲みがあり他は無い」ではなく、**4 画面とも外枠（`rounded-md border p-4` の `<section>`）は既にあり**、`ManualSalePage.tsx` だけが内側にもう 1 段 `<div className="rounded-md border">` を重ねている（二重囲み）。これは DSR-16「囲みは意味階層ごとに 1 つまで」への違反そのものであり、既存の正典に照らすと是正方向は「他 3 画面に箱を足す」ではなく「`ManualSalePage.tsx` の内側の箱を外す」。
- L8-1「入出庫セクションとそれに付随する変動履歴とかその辺の画面全部…pcs」は、**一覧本体（`StockMovementsPage.tsx` / `MovementTable.tsx`）自体では再現しないが、そこからリンクする記録詳細 6 画面で再現する**（`stock_unit` の参照は `StockMovementsPage.tsx:126` の 1 箇所のみで、既に canonical `formatStockDisplay` 経由・翻訳済み。owner の観察自体は正しく、画面の帰属先だけが異なる）。実際に raw `pcs` を出す箇所は入出庫 6 種の記録詳細ページと商品追加候補一覧であり、下記「起票時実測」で確定した実箇所リストを正とする。
- L8-6 の空欄表示は Plan Review round 1 で「`ReturnExchangePage.tsx` の薄字『備考なし』」を推奨としたが、round 1 Opus 分の再実測で `MovementTable.tsx:92-94`（7 画面が共有）を含む `?? "—"` 系が 5 箇所 4 file、`"—"` 空値リテラルはアプリ全体で 27 箇所（16 file）と実測され、「備考なし」（1 file のみ）は少数派と判明。推奨を「—」（薄字）へ反転し、「備考なし」は少数派である旨を明記した上で owner culling の対抗案として残す（詳細は「起票時実測」「設計判断」節）。

## Workflow State

- Phase: human-confirm
- Risk: R2
- Execution Mode: fable-window
- Plan Commit: 1e758cf5
- Amendments: none
- Coordinator: Fable 5.1（main session、conductor）
- Writer: Claude Sonnet 5 subagent（design docs、worktree isolation、D-079）
- Plan Reviewer: 独立 Sonnet subagent（fresh context）+ Opus 5 デザイン面（read-only claims-producer、D-056 / D-079）
- Final Reviewer: Sonnet subagent（fresh context）+ Opus 5 デザイン面 + Codex 1 round（§3.3、実施タイミングは起票時点の Codex 枠状況に従う）
- Reviewed Content HEAD: 0d75d3e
- Final Exact-HEAD Evidence: PR body
- Hosted CI Requirement: required（docs-only だが Ready 後の hosted final は owner `workflow_dispatch` が必要。Ready 案内に明記する）
- Human Gate: owner が design PR 上で (1) 商品一括インポート / PLU 書出し / バックアップの説明文 3 案を culling する（本 packet「設計判断」節の draft、2〜3 文の日本語文案） (2) 記録 ID の表示方針（(a) 種別込み表示 / (b) 一覧から外す / (c) 現状維持）を選ぶ（Coordinator 推奨は (b)、下記「設計判断」節参照） (3) 備考欄が空のときの表示（「—」か薄字「備考なし」か）を選ぶ（Coordinator 推奨は既存 27 箇所の「—」パターンへの統一、下記参照）。実機（Windows native L3）確認はこの packet の対象外で、後続 runtime lane が担う
- Merge 順序: `origin/agent/ui-conventions-batch`（⑦、未 merge）は `02-component-catalog.md`（⑬ 等）・`01-decision-rules.md` DSR-22（本文の narrow 化）・両 file の `## 更新履歴` 表を編集する。本 packet（⑩）は同じ 2 file（catalog ①③、DSR-22 注記）+ 同じ 2 つの更新履歴表を編集する。先に merge した側が勝ち、後に merge する側が origin/main を単段 merge してから自身の rg oracle を再実行する（詳細は本文冒頭「補足」節）。

## Owner Effort Budget

- 介入回数上限: 3
- 実働時間上限: 30分
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。
介入 3 回の内訳: 1 回目 = 起票選定（2026-09-06、owner「⑧ PR #38 L3 結果」原文を受けた design-first 判定、消費済み）。2 回目 = 説明文 3 案 + 記録 ID 方針 + 備考空欄表示の culling（Human Gate）。3 回目 = 承認 + merge（Coordinator 代行）。

## Consultation Relay

§5.5 を使わない change は両方 `none` のままにする。

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R2

Reason:
docs-only（`docs/design-system/01-decision-rules.md` / `02-component-catalog.md` + `docs/function-design/60-ui-product-import.md` / `65-inventory-record-traceability.md` / `67-ui-plu-export.md` / `68-ui-backup-restore.md` + `docs/Plans.md`）。`src/**`・DB・Tauri command・route の変更はない。canonical docs の改訂自体は複数画面の見た目・文言契約を変えるが、runtime への反映は本 packet の Non-scope（後続 runtime lane、別 packet）。DEV_WORKFLOW Risk Tiers の R2「docs change that affects maintainability but not runtime contracts」に該当し、`2026-09-05-ui-conventions-batch-design.md`（⑦ design batch、[archived 相当](https://github.com/) 参照不要・同型の docs-only R2 前例）と同型。Coordinator 設計判断により Test Design Matrix を必須（R2 optional 判定を使わない）とする — 複数 file にまたがる文言差し替え（新文言 exact 存在 + 旧文言 0 hit）と owner culling 3 件の整合を機械的に保証する必要があるため。

## Goal

Goal Invariant:

### 最小完了条件

- `02-component-catalog.md` ① ページヘッダに、タイトル直下の「説明セクション」使用パターン（2〜3 文、`text-sm text-muted-foreground`、`actions` の有無に関わらず表示できる構成）が追加される。`PageHeader` の `actions` 分岐が `subtitle` を描画しない component gap が「起票時実測」節に記録され、runtime lane への申し送りとして明記される。
- `docs/function-design/60-ui-product-import.md` / `67-ui-plu-export.md` / `68-ui-backup-restore.md` の「UI / Wording」相当箇所に、説明セクションの文案（owner culling 列つき）が追加される。PLU 書出しの文案は「レジ登録状況を読み込む → 占有状況確認 → 書き出す → 保存 → 未反映から外す」の一連の流れを明示する。
- `01-decision-rules.md` DSR-22 の識別列マッピング表（入出庫履歴行）に、記録 ID を一覧の表示列から外す方針（owner culling、推奨案つき）が追記される。`docs/function-design/65-inventory-record-traceability.md` §65.8.1 の結果列挙が方針確定後に更新される対象として明記される（本 commit では未確定のため書き換えない）。
- `02-component-catalog.md` ③ テーブル「バリエーション: 直近実績サマリテーブル」に、備考列の規則（必須列・空欄表示・truncate + tooltip）と「直近の○○」系 4 画面の文言・列見出し・囲みの統一方針が追記される。DSR-12（truncate）・DSR-16（囲みの階層）の既存規定を書き換えず、具体例として本件を追加する形にする。
- `ManualSalePage.tsx:739` の記録状態が既存 5 箇所（`InventoryRecordsPage.tsx`・記録詳細 4 ページ）と異なり plain text であるという runtime gap が記録され、是正方針（既存 `<Badge variant="outline">{formatRecordStatus(...)}</Badge>` パターンへの統一、新規デザイン判断は不要）が明記される。
- `SupplierManagementPage.tsx:35-38` の見出し・説明文の間隔が `PageHeader` の `subtitle` 内蔵レイアウト（`space-y-1`、4px）と異なり `PageShell` の `space-y-6`（24px）に流れ込んでいる runtime gap、および `ReceivingPage.tsx`/`ManualSalePage.tsx`/`ReturnExchangePage.tsx`/`DisposalPage.tsx` の 4 画面で `subtitle` が `actions` に握りつぶされ全く表示されていない runtime gap が記録され、`PageHeader.tsx:29-36` の root-cause fix（`actions` 分岐内で `space-y-1` の `<div>` にまとめる）を推奨案として明記する。
- 単位表示（`stock_unit` の raw 表示）の起票時実測 sweep 結果（9 箇所の重複 local `formatQuantity` + 3 箇所の商品追加候補一覧）が記録され、`02-component-catalog.md` ③ テーブルの使用トークン行に「数量 + 単位は共通 `formatStockDisplay`/`formatStockUnitLabel`（`format-stock-display.ts`）を使い、unit code を直接結合しない」旨の 1 文が追加される。
- `docs/Plans.md` ④ が本 packet への active link と owner 回答サマリを持つ bullet ⑩ を持つ。
- 上記いずれも `src/**` の変更を伴わない（runtime 反映は別 packet）。

### 失敗定義

- 発注前提の誤り（`PageHeader` の `description` prop、原則 8、手動販売出庫以外に囲みが無い）をそのまま正として書く。
- 備考欄・記録 ID・説明文の owner culling 対象を、owner 回答なしに確定事項として書く。
- DSR-12 / DSR-16 の既存ルール本文を書き換える（具体例の追加ではなく規則自体の変更にしてしまう）。
- `ManualSalePage.tsx` の状態表示是正に、既存 5 箇所と異なる新しい tone / 表示形式を提案する（既存パターンへの統一以上のことをしない）。
- L8-2 / L8-4 / L8-5 を本 packet の Scope へ誤って混入させる、または L8-4（明細数 summary）を Backlog へ誤って起票する。
- `src/**` のいずれかの file が本 commit で変更される。

### 非目的

- `ProductImportPage.tsx` / `PluExportPage.tsx` / `BackupRestorePage.tsx` / `SupplierManagementPage.tsx` / `PageHeader.tsx` / `ManualSalePage.tsx` / `ReceivingPage.tsx` / `InventoryRecordsPage.tsx` 等の runtime 実装変更（後続 runtime lane、別 packet）。
- 単位表示 sweep で発見した 9 箇所の重複 `formatQuantity` の統合実装（runtime lane）。
- 記録 ID 方針の実装（一覧列の削除・種別 prefix 表示等、owner culling 後の runtime lane）。
- Windows native L3 実機確認。
- L8-2（badge 無色、⑦ design-first 候補「Badge の色と枠の規約」待ち）・L8-4（明細数 summary 未決、owner 再判断待ち）・L8-5（記録日時 font 差、Plans ④ C5 で追跡中）。
- `04-backbone.md` 原則 9 の本文改訂（1 行説明の原則自体は正しく機能しており、説明セクションはその**拡張**であって矛盾ではないため、原則本文は変更しない）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## 起票時実測（2026-09-06、worktree base `07302b5`、すべて本 packet 起草者が rg で再確認）

### L8-7 ページ説明セクション

- `02-component-catalog.md:24-61` ① ページヘッダの現行 canonical は `PageHeader{title, subtitle?, actions?}` の 3 variant（`:28`）で、タイトル直下の複数文説明は想定していない。
- `04-backbone.md:25` 原則 9「入口と見出しは「何をする画面か」を 1 行で添える。ホームの大ボタンは icon（24px）+ 題名 + 1 行説明、PageHeader は subtitle と actions を同時に持てる。」— **実装を確認すると「subtitle と actions を同時に持てる」は誤り**（下記 `PageHeader.tsx` 実測）。原則 9 は「1 行」の説明を対象にしており、本件が要求する 2〜3 文の説明セクションはこれより長い別カテゴリのため、原則 9 と矛盾しない拡張として位置づける。
- `src/components/patterns/PageHeader.tsx:27-45`: `actions !== undefined` のとき `flex` レイアウトを返し `subtitle` を描画しない（`:29-36`）。`actions` が無いときのみ `space-y-1` レイアウトで `subtitle` を描画する（`:39-44`）。つまり **`subtitle`（および将来の説明セクション）は `actions` と併存できない**。
- `actions` を持つ画面のうち、説明セクションが要る 3 画面の現状:
  - `src/features/products/ProductImportPage.tsx:20-30`（`商品一括インポート`）: `actions` に「商品一覧へ戻る」ボタンを持つ。説明文は現在無い。
  - `src/features/plu-export/PluExportPage.tsx:360`（`PLU書出し`）: `<PageHeader title="PLU書出し" />` のみ、`actions` 無し。説明文は現在無い。
  - `src/features/backup-restore/BackupRestorePage.tsx:335`（`バックアップ・復元`）: `<PageHeader title="バックアップ・復元" />` のみ、`actions` 無し。説明文は現在無い。
  - PLU 書出し・バックアップは `actions` が無いため `subtitle` prop で対応できるが、商品一括インポートは `actions` があるため対応できない。3 画面を同じ使用パターンで扱うには、`actions` の有無に関わらず機能する説明セクションの型が要る。
- `src/features/suppliers/SupplierManagementPage.tsx:35-38` は `actions` を使いながら説明文を出す既存の実例（下記 L8-8 参照）。ただし現状は `PageShell` の `space-y-6` に流れ込んで間隔が崩れている。
- 3 画面の function-design 目的節を実読して起票時の文案材料を確認: `docs/function-design/60-ui-product-import.md:7`（商品一括インポートは CSV から商品をまとめて登録・更新する operator-facing flow、UI はファイル選択・プレビュー・重複行の扱い・確定結果の確認を担当）、`docs/function-design/67-ui-plu-export.md:27,29,32,34,36,52`（Z004「レジ登録状況を読み込む」→占有要約の above the fold 表示→Diff/Full 選択→書き出す→保存キャンセル/失敗では未反映を残す→保存済み未確認は復帰状態として保持→「この書出しを未反映から外す」で確定）、`docs/function-design/68-ui-backup-restore.md:11-14`（非IT高齢オーナーがバックアップ作成・保存先確認・復元を単独で完遂できる、復元は真の Undo が無い destructive 操作であることを隠さない）。

### L8-9 記録IDの表示

- `src/features/inventory-records/InventoryRecordsPage.tsx:336-343` の入出庫履歴一覧ヘッダは 種別(336) / 記録ID(337) / 業務日付(338) / 代表商品(339) / 明細数(340) / 状態(341) / 記録日時(342) / 操作(343) の 8 列。記録 ID は種別ごとの連番（`receiving_records` / `return_records` / `manual_sales` / `disposal_records` / `csv_imports` / `stocktakes` が各々独立の PK）で、全体では一意でない。
- `docs/function-design/65-inventory-record-traceability.md:212`「結果: 記録種別、記録ID、業務日付、代表商品、明細数、状態、記録日時、詳細ボタン。」が一覧列の正本。`:77`「記録ID | 全業務記録 | ID exact match」（§65.4.1 共通フィルタ）は記録 ID を検索フィルタとしても定義しており、**表示列を外してもフィルタ自体は残せる**（フィルタ入力欄は一覧ヘッダ列とは別 UI 要素、`InventoryRecordsPage.tsx:214` 付近）。
- `docs/function-design/65-inventory-record-traceability.md:226`「元記録ラベル（例: 入庫記録 #42、廃棄・破損 #7、CSV取込み #12）」（§65.8.2 在庫変動履歴）は、種別名 + `#` + 番号の**種別込み複合表示の既存前例**。記録 ID 単独表示ではなく種別と対にする形は既に他所で採用されている。
- 各記録詳細ページ（`ReceivingRecordDetailPage.tsx` 等）は記録 ID の数値そのものを本文に表示しない（`ReceivingRecordDetailPage.tsx:72` はエラーメッセージ内で「記録IDを確認するか」と言及するのみ）。ページタイトル自体が種別を表す（例: 「入庫記録詳細」）ため、一覧列から記録 ID を外しても、利用者が記録を識別する主手段（業務日付・代表商品・記録日時）は failure ではない。
- `01-decision-rules.md:435`（DSR-22 識別列マッピング表、入出庫履歴行）は既に「記録日時 + 代表商品」を入出庫履歴の識別列（横スクロール時の左固定対象）として確定済み — 記録 ID は元々この識別列マッピングに含まれていない。

### L8-6 備考の規則（+ A1(a)(b)(c) 統合）

- `docs/Plans.md:68` A1 ledger: 「(a) 他の『直近 10 件』系 section も同じ文言で揃える (b) 価格履歴に列タイトルを付ける (c) 『直近の○○』系 section は手動販売出庫だけ囲みがあり他に無いので、囲みありで統一する」— L8-6 と対象領域が重なるため統合する。
- `docs/design-system/02-component-catalog.md:185`「バリエーション: 直近実績サマリテーブル」（PR #116）が対象 4 画面（入庫・返品交換・手動販売・廃棄）の canonical 記述。
- 備考列の現状（file:line 実測）:
  - `src/features/receiving/ReceivingPage.tsx:689`: `<TableCell>{record.note ?? ""}</TableCell>` — 空欄は素の空文字（プレースホルダーなし）。
  - `src/features/return-exchange/ReturnExchangePage.tsx:103-110,963-969`: `formatNote()`（`trimmed === "" ? "備考なし" : trimmed`）+ `hasNote()` で `text-foreground` / `text-muted-foreground` を切替え、薄字「備考なし」パターンを実装（`max-w-[24rem] min-w-[14rem] whitespace-normal` で折り返し表示、truncate はしていない）。
  - `src/features/manual-sale/ManualSalePage.tsx:715-745`「直近の手動販売出庫」テーブルには**備考列そのものが無い**（列は 販売日/記録ID/代表商品/明細数/状態/記録日時/操作 の 7 列、`:719-725`）。ただしフォーム側 `:448`「備考」`Input`（`maxLength={200}`）は存在し、保存時に note を受け取っている——一覧に反映されていないだけ。
  - `src/features/disposal/DisposalPage.tsx`: 廃棄・破損記録に備考/note フィールドが存在しない（`rg -n "備考|note" DisposalRecordDetailPage.tsx` 0 件）。廃棄は「理由」（`:496` 列、事由選択）を持つが備考とは別概念。**本件の対象外**（Non-scope）。
  - **Plan Review round 1 是正（P1、Opus 分）**: `src/features/stock-movements/components/MovementTable.tsx:57`（`<TableHead>備考</TableHead>`）/`:92-94`（`<TableCell className="max-w-80 truncate">{movement.note?.trim() ? movement.note : "—"}</TableCell>`）が**入出庫 4 詳細ページ + CSV取込み/棚卸し詳細 + 在庫変動履歴の 7 画面で共有**されており（`rg -ln "MovementTable" src/features` で `StockMovementsPage.tsx` + 6 記録詳細ページを確認）、既に「—」（無地、薄字クラス無し）+ `truncate`（`title` 属性なし）を実装済み。これは DSR-12「truncate した主要値には全文を確認できる手段を残す」に対する**現存のギャップ**（`title` が無いため hover 以外に全文確認手段が無い、後述）。
  - 空欄表示の全体像（`rg` 実測）: `?? "—"` パターンは `CsvImportRecordDetailPage.tsx` / `MonthlySalesPage.tsx` / `PriceRevisionTable.tsx`（2 箇所） / `HomePage.tsx` の計 5 箇所・4 file。`"—"` 空値リテラル自体はアプリ全体で 27 箇所・16 file に出現する。対して薄字「備考なし」（`ReturnExchangePage.tsx` のみ）は 1 file に限られる少数派。
- truncate の既存前例: `src/features/operation-logs/OperationLogsPage.tsx:522`: `<TableCell className="max-w-0 truncate" title={item.summary}>` — `truncate` + `title` 属性（tooltip 相当）の組合せが本アプリ内にある（`MovementTable.tsx:94` は truncate のみで `title` を欠く）。
- `01-decision-rules.md:211-219` DSR-12「truncate と情報密度のバランス」は「truncate した主要値には全文を確認できる手段（折り返し・展開・別表示）を残す」ことを既に規定している。備考は主要値ではなく補足情報のため truncate 自体は許容範囲内（`:196` catalog③ Don't「すべての列に truncate を当てて主要値を隠さない」にも抵触しない）。全文確認手段は各記録詳細ページ本体が担う（`ManualSaleRecordDetailPage.tsx:149`・`ReceivingRecordDetailPage.tsx:133`・`ReturnRecordDetailPage.tsx:170,175` はいずれも `note` を truncate せず全文表示）——DSR-12 の「全文を確認できる手段」は詳細ページという「別表示」で満たされており、`title` 属性はあくまで一覧上での**補足**（`01-decision-rules.md:199-207` DSR-11「Tooltip は hover / focus でしか出ず…Tooltip は補足に限る」と同じ位置づけ）。`MovementTable.tsx:94` は補足の `title` すら欠く現存のギャップとして記録する。
- 「直近の○○」系 4 画面の説明文（A1a）: `src/features/products/components/PriceHistorySection.tsx:43`「直近の売価・原価の変更を新しい順に表示します。」（列見出しなし、`FormSection` の `description` prop）。owner 決定文言は「直近 10 件の売価・原価の変更を新しい順に表示します。」（`docs/Plans.md:58` runtime backlog）。他 4 画面（入庫・返品交換・手動販売・廃棄）は見出し「直近の{業務名}」（h2）のみで本文説明が無い。
- 囲みの実態（A1c、file:line 実測）: 4 画面とも外枠 `<section className="space-y-3 rounded-md border p-4">` を持つ（`ReceivingPage.tsx:652`、`ManualSalePage.tsx:687`、`ReturnExchangePage.tsx:921`、`DisposalPage.tsx:643`）。**`ManualSalePage.tsx:715` のみ**内側にさらに `<div className="rounded-md border">` を重ね、`<Table>` を二重に囲んでいる。他 3 画面（`ReceivingPage.tsx:674`、`ReturnExchangePage.tsx:946`、`DisposalPage.tsx:669`）は `<Table>` を直接置き、内側の追加枠を持たない。`01-decision-rules.md:267-273` DSR-16「囲み（border / カード）は意味階層ごとに 1 つまでとし…薄い border を単独のグループ信号にしない」に照らすと、**是正方向は `ManualSalePage.tsx` の内側の枠を外すこと**（既存 DSR-16 と整合する方向であり、他 3 画面へ箱を追加する方向は DSR-16 に反する）。

### L8-3 記録状態Badge

- `src/features/inventory-records/types.ts:87-94` に `formatRecordStatus(status)` が定義され、6 消費箇所すべてがこの関数を import する。
- 5 箇所は `<Badge variant="outline">{formatRecordStatus(...)}</Badge>` で統一済み: `InventoryRecordsPage.tsx:369`、`ManualSaleRecordDetailPage.tsx:123`、`ReceivingRecordDetailPage.tsx:115`、`DisposalRecordDetailPage.tsx:117`、`ReturnRecordDetailPage.tsx:144`。
- **`ManualSalePage.tsx:739`** のみ `<TableCell>{formatRecordStatus(record.status)}</TableCell>` の plain text（Badge でない）。「直近の手動販売出庫」一覧内の「状態」列（`:723` header）。
- tone は L8-2 の「別途裁定待ち」ではなく、⑦（`agent/ui-conventions-batch`、未 merge）が既に決定済み: `02-component-catalog.md`（⑦ branch）:828 の①状態 tone family マッピング表「中立」行に `formatRecordStatus`（`active`="有効" 等）が明記され、中立 tone の①状態 badge は icon 任意・色指定なしと確定している。同 branch `01-decision-rules.md:443`（DSR-22 narrow 化）は「badge は枠線（tone 固有色または `--border`）を必ず持つ」ことを要求し、`src/components/ui/badge.tsx:16` の `outline` variant（`border-border text-foreground ...`）は `--border` を使うためこの要件を満たす。したがって本件は既存 5 箇所と同じ `variant="outline"`（無色、`border-border` 枠）へ統一するだけで ⑦ の tone 決定・DSR-22 双方と整合し、追加の色決定を要しない。

### L8-8 PageHeader間隔

- `src/features/suppliers/SupplierManagementPage.tsx:35-38`:
  ```tsx
  <PageHeader title="取引先管理" actions={addButton} />
  <p className="text-sm text-muted-foreground">
    メーカー・ブランドの追加、名称変更、重複した取引先の統合を行います。
  </p>
  ```
  `actions` があるため `PageHeader` は `subtitle` を受け取っても描画しない `flex` レイアウトになる（上記 L8-7 実測）。説明文 `<p>` は `PageHeader` の外側の兄弟要素になり、`PageShell.tsx:21` の `space-y-6`（24px）がタイトルと説明文の間隔として適用される。
- 対照: `subtitle` prop 経由の画面（`HomePage.tsx:63` `<PageHeader title="ホーム" subtitle={today} />`）は `PageHeader.tsx:39-44` の内部 `space-y-1`（4px）で描画される。同じ「タイトル + 1 行説明」の見た目が **24px 対 4px（6 倍差）** になっている。
- **Plan Review round 1 是正（P1）**: 単一行 `rg` は JSX の複数行呼び出しを見落としていた。`for f in $(rg -l "<PageHeader" src/features); do rg -U -o "<PageHeader[\s\S]{0,400}?/>" "$f"; done` で `actions`/`subtitle` 併存を multiline-safe に再走査すると、**`SupplierManagementPage.tsx` 以外に 4 画面が同型で `subtitle` を渡しながら `actions` に握りつぶされている**: `ReceivingPage.tsx:288-291`（`subtitle="届いた商品をまとめて入庫し、在庫へ反映します"`）、`ManualSalePage.tsx:303-306`（`subtitle="レジCSVに入らない販売を手入力し、在庫と売上へ反映します"`）、`ReturnExchangePage.tsx:411-414`（`subtitle="レジ戻し済みなら帳面記録だけ、未処理ならこの保存で在庫を反映します"`）、`DisposalPage.tsx:278-281`（`subtitle="販売ではない理由で在庫を減らし、ロス理由と原価を記録します"`）。この 4 画面は `SupplierManagementPage.tsx` と違い**説明文自体が画面に一切表示されていない**（`<p>` 併記が無く、`subtitle` prop の値が render 結果から消えるだけ）— component gap の実害は当初把握より大きい。
- `src/components/patterns/PageHeader.tsx:27-36` の `actions !== undefined` 分岐は `<h1>` と `actions` だけを返し `subtitle` を参照しない。この分岐を「`<h1>` + 条件付き `<p>` を `space-y-1` の `<div>` にまとめ、`actions` と並べる」形に変えれば、外側 `<header>` の class（`flex flex-wrap items-center justify-between gap-3`）は変えずに済む。`src/components/patterns/PageHeader.test.tsx:61-73`「subtitle が指定されていても actions が優先されフレックスレイアウトになる」は `header` の class に `flex` が含まれることだけを assert しており（`subtitle` の描画有無は検査していない）、この形の修正でも green のまま通る。**→ 是正方向を (b) `PageHeader.tsx` 拡張（root-cause fix）に一本化**する（下記「設計判断」節参照、(a) 使用パターンは説明セクション slot 自体の記法としてのみ残す）。

### L8-1 単位表示sweep

- canonical formatter: `src/features/stock-inquiry/lib/format-stock-display.ts:15-24`（`formatStockDisplay(quantity, unit)` → 「10 個」/「300 cm」/フォールバック「—」）、`:34-43`（`formatStockUnitLabel(unit)` → 「個」/「cm」/「—」）。
- **翻訳済み（正しい）消費箇所**: `src/features/products/components/ProductTable.tsx:70`、`src/features/stock-inquiry/components/ProductListTable.tsx:86`、`src/features/stock-movements/StockMovementsPage.tsx:126-129`、`src/features/stock-inquiry/components/StockDetailContent.tsx:81-84`。
- **raw 表示（要是正、runtime gap）**: ローカル `function formatQuantity(value, unit) { return \`${value} ${unit}\`; }`（unit code をそのまま結合、翻訳なし）が 9 箇所に重複定義されている: `DisposalPage.tsx:84`、`ReturnExchangePage.tsx:112`、`ManualSalePage.tsx:94`、`CsvImportRecordDetailPage.tsx:51`、`ManualSaleRecordDetailPage.tsx:42`、`ReceivingRecordDetailPage.tsx:37`、`StocktakeRecordDetailPage.tsx:41`（+`formatSignedQuantity`/`formatOptionalQuantity` も同型）、`DisposalRecordDetailPage.tsx:43`、`ReturnRecordDetailPage.tsx:47`。呼び出し箇所は各記録詳細ページの明細テーブル（例: `ReceivingRecordDetailPage.tsx:159`）と商品追加候補一覧 3 箇所（`DisposalPage.tsx:452`、`ReturnExchangePage.tsx:770`、`ManualSalePage.tsx:547`）。
- **在庫変動履歴は raw 表示ではない**: `StockMovementsPage.tsx`/`MovementTable.tsx`/`movement-formatters.ts` を確認すると、`stock_unit` の参照は `StockMovementsPage.tsx:126`（canonical `formatStockDisplay` 経由）の 1 箇所のみで、変動量自体（`formatMovementQuantity`）は単位を伴わず「+18」等の符号付き数値 + 「増加/減少」文言で表示される（unit 表示なし）。owner の L8-1 raw コメント「変動履歴とかその辺の画面全部」は実物確認では再現しない（本節冒頭の訂正参照）。
- `docs/design-system` 配下に `formatStockDisplay`/`formatStockUnitLabel` を canonical と明記する記述が現状 0 件（`rg -n "formatStockDisplay|formatStockUnitLabel" docs/design-system docs/quality/review-checklist.md` 0 hit）。9 箇所の重複が生まれた一因は、canonical formatter の存在が設計文書に明記されていないこと。

## 設計判断

### L8-7 説明セクション（catalog ① 拡張）

`02-component-catalog.md` ① ページヘッダに、タイトル直下の「説明セクション」使用パターンを追加する: `text-sm text-muted-foreground` の `<p>`（2〜3 文）を `PageHeader` 直後に置く。**Plan Review round 1 是正（P1、L8-8 の是正と一本化）**: 当初案は呼び出し側で `<div className="space-y-1">` を都度書く使用パターンだったが、L8-8 で `actions`/`subtitle` 併存の実害が 4 画面（`ReceivingPage.tsx` 等）で判明したため、`PageHeader.tsx:29-36` 自体を「`actions` 分岐でも `<h1>`+条件付き `<p>` を `space-y-1` にまとめる」形へ直す root-cause fix（L8-8 参照）に一本化する。この component 修正後は、呼び出し側は `subtitle`（1 行）または将来追加する説明セクション相当の prop を渡すだけで `actions` の有無に関わらず正しい間隔になる。`subtitle` prop（1 行の短い副題、例: ホームの日付）とは用途を分け、説明セクションは複数文の操作説明に使う——ただし本 packet では新規 prop 名を確定しない（runtime lane が `subtitle` を複数文対応にするか新 prop を足すか判断する、Non-scope）。既存の 1 行「1 行説明」原則（04-backbone 原則 9）とは矛盾せず、より長い説明が要る画面向けの拡張として位置づける（原則 9 の本文は変更しない）。

**説明文 3 案（owner culling 対象、function-design 各 doc の「UI / Wording」相当箇所へ追加する）**: 各文に file:line 根拠を付す。根拠のない文は削除済み。owner culling は画面ごとの説明文全体に対して行う（文単位ではない）。**Plan Review round 1 是正（2 便）**: 各文を 2〜3 文へ整理し、入れ子の括弧を排した（backbone 原則 9「1 行説明」を拡張する節のため簡潔さを優先）。バックアップ案は「スケジュール」という語自体が UI に存在しない一方、自動バックアップ機能自体は実在する（1 便の全面削除は誤り、2 便で是正）ため、実際のラベル「自動バックアップ」「保存先」に基づき書き直した。

**商品一括インポート**:

| 文 | 根拠（file:line） |
|---|---|
| CSVファイルから複数の商品をまとめて登録・更新するページです。 | `docs/function-design/60-ui-product-import.md:7` |
| ファイルを選ぶと新規登録候補・既存商品との重複・エラー行の3つに分けて内容を確認でき、重複行は初期状態でスキップされるので上書きする行だけ個別に選んで取り込みます。 | `src/features/products/import/ProductImportPreview.tsx:68,93,104,162`（`新規候補`/`新規登録候補`/`既存商品との重複`/`エラー行`）、`:109`「初期状態では重複行をスキップします」、`:111`「上書きする行だけ選択してください。選択していない重複行は登録しません。」 |
| 取り込みを実行すると、新規登録・上書き更新・スキップの件数が画面に表示されます。 | `src/features/products/ProductImportPage.tsx:87-89`（`ResultCount label="新規登録"/"上書き更新"/"スキップ"`） |

→ 結合文案（owner culling）: 「CSVファイルから複数の商品をまとめて登録・更新するページです。ファイルを選ぶと新規登録候補・既存商品との重複・エラー行の3つに分けて内容を確認でき、重複行は初期状態でスキップされるので上書きする行だけ個別に選んで取り込みます。取り込みを実行すると、新規登録・上書き更新・スキップの件数が画面に表示されます。」

**PLU書出し**:

| 文 | 根拠（file:line） |
|---|---|
| レジのPLU登録状況を書き出すページです。 | `src/features/plu-export/PluExportPage.tsx:360`（画面タイトル）/ `docs/function-design/67-ui-plu-export.md:9` |
| 『レジ登録状況を読み込む』でレジのCSV（Z004）を読み込み、空き・外部登録・アプリ管理・競合の件数を確認します。 | `PluExportPage.tsx:417`（ariaLabel「レジ登録状況のZ004を選ぶ」）、`:418`（buttonLabel「レジ登録状況を読み込む」）、`:381,387,393,399`（`<dt>` 空き/外部登録/アプリ管理/競合） |
| 『差分を書き出す』（未反映の商品だけ）か『全件を書き出す』を選んで保存し、『この書出しを未反映から外す』を押して確定します。 | `PluExportPage.tsx:66`（mode `diff` 説明「未反映の商品だけ」）、`:737`（`全件を書き出す`/`差分を書き出す`）、`:463,530`（button「この書出しを未反映から外す」） |

→ 結合文案（owner culling）: 「レジのPLU登録状況を書き出すページです。『レジ登録状況を読み込む』でレジのCSV（Z004）を読み込み、空き・外部登録・アプリ管理・競合の件数を確認します。『差分を書き出す』（未反映の商品だけ）か『全件を書き出す』を選んで保存し、『この書出しを未反映から外す』を押して確定します。」

**バックアップ・復元**:

| 文 | 根拠（file:line） |
|---|---|
| アプリのデータ全体をまとめて保存し、必要なときに元に戻すためのページです。 | `docs/function-design/68-ui-backup-restore.md:8`「UI-11b は、ローカル SQLite DB の手動バックアップ、バックアップ設定、バックアップ一覧、復元を operator が 1 画面で扱うための画面である。」 |
| 自動バックアップの時刻を設定したり、今すぐ手動でバックアップを作成したり、保存先を選んだりできます。 | `src/features/backup-restore/BackupRestorePage.tsx:421`（Label「自動バックアップを使う」）、`:429`（Label「自動バックアップ時刻」）、`:491`（button「今すぐバックアップを作成」）、`:475`（button「保存先を選ぶ」） |
| 過去のバックアップから復元すると現在の記録は元に戻せませんが、復元の前には自動で今の状態のバックアップが作られます。 | `BackupRestorePage.tsx:580`（AlertTitle「復元すると今の記録は戻せません」）、`:487`「復元前にも自動で同じバックアップを作成します。」/ `docs/function-design/68-ui-backup-restore.md:76`（`createBackup` の自動実行） |

→ 結合文案（owner culling）: 「アプリのデータ全体をまとめて保存し、必要なときに元に戻すためのページです。自動バックアップの時刻を設定したり、今すぐ手動でバックアップを作成したり、保存先を選んだりできます。過去のバックアップから復元すると現在の記録は元に戻せませんが、復元の前には自動で今の状態のバックアップが作られます。」

**削除・訂正した文とその理由（Plan Review round 1 是正、2 便で再訂正）**:
- 1 便: バックアップ案の「保存先やスケジュールを確認・変更したりできます」を丸ごと削除した。2 便で是正: 「スケジュール」という語自体は UI 文言に存在しない（`rg -c "スケジュール" BackupRestorePage.tsx` = 0）が、同等の機能（自動バックアップの有効化・時刻設定、`:421,429`）は実在するため、実際のラベルに基づき書き直した（全面削除は言い過ぎだった）。
- バックアップ案「（復元の前に、念のため現在の状態も保存することをおすすめします）」— `BackupRestorePage.tsx:487` / `68-ui-backup-restore.md:76` により、これは利用者への推奨ではなく既にアプリが自動で行う挙動であるため、事実と異なる書き方だった。「復元の前には自動で今の状態のバックアップが作られます」へ訂正。

### L8-9 記録IDの表示（DSR-22 拡張 + 65-doc 改訂方針）

3 案を提示し owner culling とする（Coordinator 推奨は (b)）:

- (a) 種別込みの複合表示（例: 「入庫-42」）へ変更する。Pros: ID が識別子として機能を取り戻す。Cons: 一覧の主目的（複数種別の横断確認）において列が増え、`65-inventory-record-traceability.md:226` の「元記録ラベル」書式と表記が重複気味になる。
- **(b) 一覧の表示列から外す（Coordinator 推奨）**。Pros: 記録詳細ページも記録 ID の数値を本文表示しておらず（起票時実測参照）、削除しても既存の識別手段（業務日付・代表商品・記録日時、DSR-22 の識別列マッピングと一致）は変わらない。フィルタ入力欄（`65-inventory-record-traceability.md:77`）は一覧列と独立した UI 要素のため、種別を選んだ上での ID exact match 検索は維持できる。列を 1 つ減らせるため、横スクロール改善（Lane 4 の識別列固定・出っ張り解消）にも副次的に寄与する。Cons: 一覧だけを見て「何番目の記録か」を確認する手段が無くなる（ただし owner 自身の観察「種別とセットでないと検索に使えない」と整合）。
- (c) 現状維持。Pros: 変更コストが無い。Cons: owner が「効力を発揮しない」と明言した表示をそのまま残す。

採用案が確定した後、`docs/function-design/65-inventory-record-traceability.md:212` の結果列挙と `01-decision-rules.md` DSR-22 識別列マッピング表（`:435` 入出庫履歴行）へ反映する（本 commit では未確定のため書き換えない、Human Gate 後の Plan Gate 通過 Writer が行う）。**Plan Review round 1 是正（P3）**: DSR-22 の当該行（`:435`）は `InventoryRecordsPage.tsx:300-306` を引用しているが、実列は `InventoryRecordsPage.tsx:336-343`（8 列、種別/記録ID/業務日付/代表商品/明細数/状態/記録日時/操作）に移動済みで、行番号が stale になっている。次の Writer は記録 ID 方針の反映と**同時に**この stale な行番号（`:300-306`→`:336-343`、`:306`〈記録日時〉→`:342`、`:303`〈代表商品〉→`:339`）も修正すること。

### L8-6 備考の規則 + A1(a)(b)(c)（catalog ③ 拡張）

`02-component-catalog.md` ③ テーブル「バリエーション: 直近実績サマリテーブル」（`:185`）に以下を追記する:

- **備考列は対象記録に note フィールドがある画面（入庫・返品交換・手動販売、および `MovementTable.tsx` を共有する在庫変動履歴・記録詳細 7 画面）で必須列とする**。廃棄・破損は note フィールードを持たないため対象外（Non-scope、混同しない）。
- **空欄表示は owner culling（Plan Review round 1 是正、Opus 分の再実測で推奨を反転）**。Coordinator 推奨は「—」（薄字）への統一。理由: `MovementTable.tsx:92-94` の `?? "—"` を含め `?? "—"` パターンが 5 箇所・4 file、`"—"` 空値リテラル自体はアプリ全体で 27 箇所・16 file と圧倒的多数派で、`MovementTable.tsx` は 7 画面が共有する。薄字「備考なし」（`ReturnExchangePage.tsx` の `hasNote()`/`formatNote()`）は 1 file のみの少数派だが、「値が無いこと」自体を言葉で示せる利点があるため owner culling の対抗案として残す。
- **一定文字数超過時は `truncate` + `title` 属性で省略表示する**（`OperationLogsPage.tsx:522` の既存パターンを再利用）。全文確認手段（DSR-12）は各記録詳細ページ本体（`ManualSaleRecordDetailPage.tsx:149` 等、truncate なし）が担い、`title` は一覧上での補足（DSR-11「Tooltip は補足に限る」）と位置づける。`MovementTable.tsx:94` は現在 truncate のみで `title` を欠くため、これも本規則の是正対象に含める。現行 `ReturnExchangePage.tsx` の `whitespace-normal` 折り返しは行の高さが note の長さに応じて伸びる問題があり、truncate 化で行高を揃える。
- **「直近の○○」系 4 画面の説明文を統一する**（A1a）: `FormSection`/見出し直下に「直近 {N} 件の{対象}を新しい順に表示します。」の文型を採用し、`PriceHistorySection.tsx:43` を「直近10件の売価・原価の変更を新しい順に表示します。」へ（owner 決定済み文言、`docs/Plans.md:58`）、入庫・返品交換・手動販売・廃棄の各 recent list にも同型の説明文を新設する（現状は見出しのみで本文説明が無い）。
- **価格履歴に列見出しを付ける**（A1b、owner 決定、`docs/Plans.md:68`）。`PriceHistorySection.tsx` のテーブル構造を実装 lane で確認し、他画面と同様の `TableHead` を追加する。
- **囲みは `ManualSalePage.tsx` の内側の枠を外して統一する**（A1c、DSR-16 準拠。上記「起票時実測」節参照。他 3 画面に箱を追加する方向は DSR-16「囲みは意味階層ごとに 1 つまで」に反するため不採用）。

### L8-3 記録状態Badge（新規デザイン判断なし、既存パターンへの統一）

`ManualSalePage.tsx:739` を既存 5 箇所と同じ `<Badge variant="outline">{formatRecordStatus(record.status)}</Badge>` へ統一する。tone（中立、無色）は ⑦（`agent/ui-conventions-batch`）の①状態 tone family マッピング表が既に確定しており（「起票時実測」節参照）、`variant="outline"` は ⑦ の DSR-22 narrow 化（badge は枠線必須）を満たす形。**Plan Review round 1 是正（P2）**: 5 箇所は Badge の**形**（`variant="outline"`）は同じだが、枠色トークンは移行中——`badge.tsx:16` の `outline` variant は main 上では `border-border`（`--border`）だが、`origin/agent/ui-list-backbone-d-lane5`（human-confirm、PR #35、main 未 merge）では `border-border-strong`（`--border-strong`）に変更済み。一方 ⑦ の DSR-22 narrow 化は badge の枠を `--border-strong` ではなく tone 固有色または `--border` にする決定（owner「くどい」却下）のため、Lane 5 の変更と ⑦ の決定は逆方向。本 packet では新規の色決定は不要だが、canonical docs 側の記述変更も不要（既存 5 箇所は runtime 側の枠色トークンが Lane 5 merge → ⑦ merge の順に揃うのを待つだけで、runtime lane が最終的に ⑦ 規則へ揃える）。

### L8-8 PageHeader間隔（catalog ① 使用パターン + component gap 記録）

**Plan Review round 1 是正（P1、多画面実害の判明を受け反転）**: `SupplierManagementPage.tsx` 1 画面の runtime パッチではなく、**(b) `PageHeader.tsx:29-36` の root-cause fix を推奨案に一本化する**。`actions` 分岐を「`<h1>` + 条件付き `<p>`（`subtitle` があれば）を `<div className="space-y-1">` にまとめ、`actions` と並べる」形に変える（外側 `<header>` の class は不変のため `PageHeader.test.tsx:61-73` は green のまま）。理由: 使用パターン頼み（wrapper div を呼び出し側で都度書く）では、既に 4 画面（`ReceivingPage.tsx` 等）が `subtitle` を渡しているのに気づかず捨てられている実害が起きている——これは「書き忘れると再発する」という仮定の懸念ではなく、**現在進行形で 4 箇所が壊れている**ことの実測。component 側を直せば `SupplierManagementPage.tsx` の間隔・4 画面の消えている `subtitle`・将来の商品一括インポート（`actions` + 説明セクション）を 1 箇所の diff で同時に解消できる。
catalog ① には、この component 契約（`actions` の有無に関わらず `subtitle`/説明セクションが `space-y-1` で描画される）を使用パターンとして明記する。これは (a)「呼び出し側で毎回 wrapper を書く」案の**代替**であり、component が正しく動く前提のもとでの記法説明に位置づけを変える（Non-scope: `PageHeader.tsx` の実装変更そのもの、runtime lane が担当）。

### L8-1 単位表示sweep（catalog ③ 使用トークン行に 1 文追加）

`02-component-catalog.md` ③ テーブルの「使用トークン」行（`:172`）に「数量 + 単位の表示は共通 `formatStockDisplay`/`formatStockUnitLabel`（`src/features/stock-inquiry/lib/format-stock-display.ts`）を使い、`unit` コードを直接文字列結合しない」旨を追記する。新規 DSR は起草せず、既存の使用トークン記述への追記に留める（重複 9 箇所の統合実装は runtime lane、本 packet は「起票時実測」節に実測サイト一覧を残すのみ）。

## Scope

- **S1 catalog ① 説明セクション**: `02-component-catalog.md` ① ページヘッダ（`:24-61`）に「説明セクション」使用パターン（`space-y-1` wrapper、`actions` と併存可能）を追加。`PageHeader` の `actions`/`subtitle` 併存不可という component gap を Don't 節または備考として明記。
- **S2 function-design 3 doc の説明文**: `60-ui-product-import.md` / `67-ui-plu-export.md` / `68-ui-backup-restore.md` の「UI / Wording」相当箇所に、説明文 3 案（owner culling 列つき）を追加。
- **S3 DSR-22 記録ID方針**: `01-decision-rules.md` DSR-22 識別列マッピング表（`:435`）へ、記録 ID 表示方針の owner culling 状態（3 案、推奨 (b)）を注記として追加。確定後の `65-inventory-record-traceability.md:212` 改訂は Non-scope（別 commit）。
- **S4 catalog ③ 備考規則 + A1統合**: `02-component-catalog.md` ③ テーブル「バリエーション: 直近実績サマリテーブル」（`:185`）へ、備考列規則（必須・空欄表示 owner culling・truncate+title）・「直近 {N} 件」文言統一・価格履歴列見出し・`ManualSalePage.tsx` 二重囲みの是正方針（DSR-16 準拠）を追記。
- **S5 catalog ③ 単位表示ルール**: `02-component-catalog.md` ③ テーブルの使用トークン行（`:172`）へ、共通 formatter 使用の 1 文を追加。
- **S6 更新履歴**: `01-decision-rules.md` / `02-component-catalog.md` の `## 更新履歴` へ本 PR の行を追加。
- **S7 Plans.md ⑩ 相当**: `docs/Plans.md` ④ に bullet ⑩ を追加し、本 packet への active link と L8 サブ項目一覧を記録する（本 commit で直接実施）。
- **S8 runtime sweep 申し送り**: L8-3（`ManualSalePage.tsx:739` Badge 化）、L8-8（`SupplierManagementPage.tsx:35-38` 間隔、`PageHeader.tsx` 拡張候補）、L8-1（9 箇所の重複 `formatQuantity`）を「起票時実測」節に事実として残す（canonical docs 本文には含めない、runtime lane 起票時に再利用）。

## Non-scope

- `src/**` の実装変更全て（`PageHeader.tsx` / `ProductImportPage.tsx` / `PluExportPage.tsx` / `BackupRestorePage.tsx` / `SupplierManagementPage.tsx` / `ManualSalePage.tsx` / `ReceivingPage.tsx` / `ReturnExchangePage.tsx` / `DisposalPage.tsx` / `InventoryRecordsPage.tsx` / 各記録詳細ページ 等）。
- 単位表示 9 箇所の重複 `formatQuantity` の統合実装（runtime lane）。
- 記録 ID 方針確定後の `65-inventory-record-traceability.md:212` / DSR-22 マッピング表本編集（owner culling 完了後の別 commit）。
- L8-2（badge 無色、⑦ 待ち）・L8-4（明細数 summary 未決）・L8-5（記録日時 font 差、Plans ④ C5 追跡中）。
- Windows native L3 実機確認。
- `04-backbone.md` 原則 9 の本文改訂。
- DSR-12 / DSR-16 の既存ルール本文改訂（具体例の追加のみ）。
- 廃棄・破損記録への備考/note フィールード新設（データモデル変更、本 packet の対象外）。

## Acceptance Criteria

- AC1: `rg -Fc "説明セクション" docs/design-system/02-component-catalog.md` ≥ 1（① ページヘッダに使用パターンが追加されている）。
- AC2a: `rg -Fc "CSVファイルから複数の商品をまとめて登録・更新するページです" docs/function-design/60-ui-product-import.md` ≥ 1（Plan Review round 1 是正 — baseline 0 で本文に無い文であることを確認済み。旧 AC2 は `レジ登録状況を読み込む`/`未反映から外す` を anchor にしていたが、これらは既存本文（`67-ui-plu-export.md`）に既に 3 件・6 件存在する false oracle だった。以後は各画面の説明文冒頭など新規追加箇所にのみ現れる文を anchor にする）。
- AC2b: `rg -Fc "レジのPLU登録状況を書き出すページです" docs/function-design/67-ui-plu-export.md` ≥ 1（baseline 0 確認済み。PLU 書出し説明文が追加されている）。
- AC2c: `rg -Fc "アプリのデータ全体をまとめて保存し" docs/function-design/68-ui-backup-restore.md` ≥ 1（baseline 0 確認済み。バックアップ説明文が追加されている）。
- AC3: `rg -c "^## DSR-23" docs/design-system/01-decision-rules.md` = 0（新規 DSR を起草していないことの negative oracle。本 packet は DSR-22 への注記追加のみ）。
- AC4: `rg -Fc "owner culling" docs/design-system/01-decision-rules.md` ≥ 1（DSR-22 に記録 ID 方針の owner culling 注記がある）。
- AC5: 機械 oracle のみ（Plan Review round 1 是正 — 「reviewer 目視」を撤去し、baseline 0 を確認済みの新規文言のみ使う）: `rg -Fc "備考は" docs/design-system/02-component-catalog.md` ≥ 1（baseline 0 確認済み）、`rg -F "truncate + \`title\`" docs/design-system/02-component-catalog.md` の hit ≥ 1（baseline 0 確認済み、`truncate` 単独は DSR-12 の既存記述で baseline 2 のため anchor にしない）、`rg -Fc "直近 {N} 件の" docs/design-system/02-component-catalog.md` ≥ 1（baseline 0 確認済み、`直近` 単独は baseline 3 のため anchor にしない）。空欄表示の具体文言（「—」か「備考なし」か）は owner culling 対象のため oracle 化しない — **Human Gate 後に確定**、確定後の Writer が該当文言の exact-match oracle を追加する。
- AC6: `rg -Fc "formatStockDisplay" docs/design-system/02-component-catalog.md` ≥ 1（単位表示ルールが catalog ③ 使用トークンに追記されている）。
- AC7: `01-decision-rules.md` / `02-component-catalog.md` の `## 更新履歴` 表それぞれに本 PR の行が 1 行追加されている。
- AC8: `docs/Plans.md` ④ が本 packet（basename `2026-09-06-ui-polish-batch3-design.md`）への active link を持つ bullet ⑩ を持つ。
- AC9: `git diff --name-only 07302b5..HEAD -- src` の出力が空（`src/**` 無変更）。
- AC10: `bash scripts/doc-consistency-check.sh --target plan` が ERROR 0 で通過。
- AC-HumanGate: owner が (1) 説明文 3 案 (2) 記録 ID 表示方針 (3) 備考空欄表示 を design PR 上で culling する（原文回答、Coordinator が転記し原文を正とする）。

## Design Sources

- Requirements / spec: 該当なし（新規 REQ token 追加なし）。
- Architecture: 変更なし。
- Function / command / DTO: 変更なし。
- DB: 変更なし。
- Screen / UI: `docs/design-system/01-decision-rules.md` DSR-12/DSR-16/DSR-22（既存規定の具体例追加）/ `02-component-catalog.md` ①/③（改訂対象）/ `docs/function-design/60-ui-product-import.md` / `65-inventory-record-traceability.md` / `67-ui-plu-export.md` / `68-ui-backup-restore.md`（改訂対象）。
- Decision log / ADR: 新規 entry なし。D-079（UI 視覚系座組）を踏襲。
- owner 一次情報: `docs/design-system/reference/2026-09-04-owner-l3-feedback-raw.md`「⑧ PR #38 L3 結果 原文」（2026-09-06）、`docs/plans/2026-09-05-ui-select-unify.md` Review Response 2026-09-06 エントリ（L8-1〜L8-9 の Coordinator 転記）、`docs/Plans.md` ④ L8 ledger（`origin/agent/ui-select-unify` branch 側で追加中）・A1 ledger（`:68`）。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 該当なし | existing sufficient |
| Command / DTO / generated binding / wire shape | 該当なし | existing sufficient |
| DB / transaction / audit / rollback / migration | 該当なし | existing sufficient |
| Screen / UI / route state / Japanese wording | `01-decision-rules.md` DSR-12/16/22、`02-component-catalog.md` ①/③、`docs/function-design/60,65,67,68` | updated in this PR |
| CSV / TSV / report / import / export format | 該当なし | existing sufficient |
| durable decision / ADR | D-079 の座組を踏襲、新規 entry なし | existing sufficient |

## Registration / Generation Obligations

| 新規追加物 | 登録・生成義務 |
|---|---|
| Tauri command（frontend から呼ぶ） | 該当なし |
| function-design doc 新設 | 該当なし（既存 4 doc の改訂のみ） |
| source / workflow doc 新設・改名 | 該当なし |
| AGENT_OPERATING_MANUAL §5.5 consultation relay 使用 | 該当なし（§5.5 不使用） |
| REQ coverage 追加（設計書・テスト追加） | 該当なし（新規 REQ 追加なし、`generate_traceability` 再生成不要） |
| route 新設 | 該当なし |
| operator 画面新設 | 該当なし |
| 新規 DSR | なし（本 packet は既存 DSR-12/16/22 への具体例追加、catalog ①/③ への使用パターン追加のみ） |

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| L8-7 | `02-component-catalog.md` ①（新設パターン） | UIB3-D1 | `PageHeader` に新規 prop を足す代替は runtime 変更を伴い docs-only の本 packet の範囲を超える。使用パターン（wrapper div）で当面対応し、component 拡張は Non-scope の runtime lane へ | `02-component-catalog.md`、`docs/function-design/60,67,68` | AC1/AC2 rg |
| L8-9 | `01-decision-rules.md` DSR-22 | UIB3-D2 | 種別込み表示は `65-doc` の既存「元記録ラベル」書式と重複するため、記録詳細ページが ID を表示しない実態と合わせて一覧列削除 (b) を推奨。owner culling で最終決定 | `01-decision-rules.md`、（確定後）`docs/function-design/65-inventory-record-traceability.md` | AC4 rg |
| L8-6 | `02-component-catalog.md` ③（既存バリエーション拡張） | UIB3-D3 | 新規パターンを作る代替は `ReturnExchangePage.tsx` の既存実装を無視することになるため、既存パターンへの横展開を選ぶ。囲みは DSR-16 の明文（意味階層ごとに 1 つ）から `ManualSalePage.tsx` 側を是正する方向が導かれ、他 3 画面へ箱を足す発注前提は不採用 | `02-component-catalog.md` | AC5 rg + reviewer 実読 |
| L8-3 | 既存パターン（新規記述なし） | UIB3-D4 | 5/6 箇所が既に正しい形のため、design 側の変更は不要。runtime gap の記録のみ | なし（runtime lane へ申し送り） | 該当なし |
| L8-8 | `02-component-catalog.md` ①（S1 と共有） | UIB3-D5 | `PageHeader.tsx` の `actions`/`subtitle` 排他という component 契約が根本原因。使用パターンでの当座対応と component 拡張の両論併記とし、runtime lane で決める | `02-component-catalog.md` | AC1 rg |
| L8-1 | `02-component-catalog.md` ③（使用トークン追記） | UIB3-D6 | catalog に新しい節を作る代替は diff が大きい。既存の使用トークン行への 1 文追記で足りる | `02-component-catalog.md` | AC6 rg |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: catalog ①/③ の追記箇所に、それぞれの runtime gap（`PageHeader` の component 制約、`ManualSalePage.tsx` の二重囲み）を Why として明記し、packet 依存を残さない設計にする。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: 説明セクション使用パターン・備考規則・単位表示ルールは catalog へ昇格。記録 ID 方針は owner culling 完了後に DSR-22/65-doc へ昇格（本 commit では pending）。新規 decision-log entry は不要。
- Assumptions and constraints: `PageHeader.tsx` の `actions`/`subtitle` 排他は runtime lane が component 拡張するかどうかで catalog 記述の一部（wrapper 使用パターン vs 新 prop）が変わり得る。runtime lane 起票時に本 packet の記述を再確認する。
- Deferred design gaps, risk, and follow-up target: 記録 ID 方針の owner culling、説明文 3 案の owner culling、備考空欄表示の owner culling、9 箇所の `formatQuantity` 統合実装、`ManualSalePage.tsx` Badge 化、`SupplierManagementPage.tsx` 間隔是正、`ManualSalePage.tsx` 二重囲み是正 — いずれも runtime lane。
- Test Design Matrix can cite design decision IDs or source doc sections: Yes（[Test Matrix](test-matrices/2026-09-06-ui-polish-batch3-design.md) 各行に UIB3-D 番号を付す）。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 唯一の例外は備考空欄表示の具体文言（owner culling のため exact 文言 oracle にできない、AC5 で「備考」「truncate」の 2 語の存在確認に代替）。他は全て owner culling 完了を待たずに機械 oracle 化できている。抜け道なし。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable — docs-only | — |
| Fact check / design decision split | 適用: 発注前提 3 件（`PageHeader` の `description` prop、原則 8、手動販売出庫以外に囲みが無い）が実測で誤りと判明し訂正した。L8-1 の「変動履歴も raw pcs」も実測で再現せず訂正した | 本 packet冒頭「事実訂正」節・「起票時実測」節 |
| Lifecycle / retry | not applicable | — |
| Operator workflow | 適用: 説明セクション・記録 ID・備考・状態表示・間隔・単位表示はいずれも複数画面の主動線に影響（runtime 反映は別 packet、Human Gate は 3 点の owner culling のみ） | AC-HumanGate |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable — DB 書込みなし | — |
| Reporting / accounting semantics | not applicable | — |
| Manual verification | 適用: owner が説明文 3 案・記録 ID 方針・備考空欄表示を design PR 上で culling（実機 L3 は対象外） | Human Gate |
| 環境・再現性 | not applicable — toolchain / CI runner 変更なし | — |

## Design Readiness

- Existing design docs are sufficient because: DSR-12（truncate）・DSR-16（囲みの階層）・DSR-22（識別列マッピング）・catalog ①（PageHeader）・catalog ③（テーブル・直近実績サマリテーブル）の構造が既に存在し、本 packet は具体例の追加と使用パターンの新設で足りる。
- Source docs updated in this PR: `01-decision-rules.md`（DSR-22 注記）/ `02-component-catalog.md`（①/③）/ `docs/function-design/60,67,68`（説明文案）。
- Design gaps intentionally deferred: 記録 ID 方針・説明文 3 案・備考空欄表示の owner culling、`PageHeader.tsx` の component 拡張要否、L8-2/L8-4/L8-5。
- Durable decisions discovered in this plan and promoted to source docs: 「直近 {N} 件」文言統一・`ManualSalePage.tsx` 二重囲みの是正方向（DSR-16 準拠）・単位表示は共通 formatter 必須、の 3 点は owner culling 不要の既存正典からの導出として確定済み。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): 該当なし（docs-only）。
- Backend function design: 該当なし。
- Command / DTO / data contract: 該当なし。
- Persistence / transaction / audit impact: 該当なし。
- Operator workflow / Japanese UI wording: 説明文・備考・状態表示の日本語契約は本 packet の Scope で確定、runtime 反映時に再確認。
- Error, empty, retry, and recovery behavior: 備考の空欄表示のみ該当（本節「設計判断」参照）。
- Testability and traceability IDs: UIB3-D1〜D6（新規 DSR なし）。

## Contract Probe

- 該当なし（WCAG コントラスト計算等の数値検証を要する変更なし。説明文・列削除・Badge 統一・間隔・formatter 参照はいずれも既存 token 値やコントラスト比を変えない）。

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| UIB3-D1 説明セクション使用パターン | `02-component-catalog.md`、`docs/function-design/60,67,68` | AC1/AC2 rg | non-scope（runtime 反映は別 lane） |
| UIB3-D2 記録ID方針（owner culling） | `01-decision-rules.md` | AC4 rg | non-scope |
| UIB3-D3 備考規則 + A1統合 | `02-component-catalog.md` | AC5 rg + reviewer 実読 | non-scope |
| UIB3-D4 記録状態Badge統一（記録のみ） | なし | なし | non-scope |
| UIB3-D5 PageHeader間隔（記録のみ + 使用パターン） | `02-component-catalog.md` | AC1 rg | non-scope |
| UIB3-D6 単位表示 formatter ルール | `02-component-catalog.md` | AC6 rg | non-scope |
| S6 更新履歴 2 file | 各 file | AC7 git diff hunk | — |
| S7 Plans.md ⑩ 同期 | `Plans.md` | AC8 rg | — |
| 全体整合 | docs | AC10 `doc-consistency-check.sh --target plan` | — |
| Non-scope 遵守 | `src/**` | AC9 `git diff --name-only` | — |

## Test Plan

Test Design Matrix: [test-matrices/2026-09-06-ui-polish-batch3-design.md](test-matrices/2026-09-06-ui-polish-batch3-design.md)（R2 だが Coordinator 判断で必須化、上記「Risk」節参照）。
- Human Gate に L3 は含まない（docs-only）。

- targeted tests: 各 Scope 項目の rg exact-match presence oracle（AC1〜AC10）。
- negative tests: 新規 DSR 起草 0 件（AC3）。
- compatibility checks: DSR-12/DSR-16 の既存ルール本文、`04-backbone.md` 原則 9 本文、廃棄・破損の Non-scope 扱い — いずれも変更されないこと。
- data safety checks: 該当なし（DB 書込みなし）。
- main wiring/integration checks: 該当なし（route/DTO 変更なし）。`docs/Plans.md` ⑩ のリンクが本 packet basename と一致すること。

## Boundary / Wire Contract

該当なし。JSON API / browser state / CSV / config / manifest / cache schema / Tauri command DTO / generated bindings / report output / DB-backed compatibility のいずれも変更しない（design-system docs と function-design docs の文言・使用パターン追加のみ）。

## Review Focus

- 事実訂正 3 件（`PageHeader` の `description` prop 不在、原則 8→9、囲みの実態）が正しく反映されているか。
- 記録 ID 方針の 3 案が owner culling 前提のまま書かれており、(b) 推奨に断定的な既決事項として書かれていないか。
- 備考の空欄表示・説明文 3 案が owner culling 前提のまま書かれているか。
- `ManualSalePage.tsx` 二重囲みの是正方向が DSR-16 の明文と整合しているか（他画面へ箱を足す誤読になっていないか）。
- 廃棄・破損が備考規則の Non-scope であることが明記され、混同されていないか。
- L8-2/L8-4/L8-5 が Scope に混入していないか。
- `src/**` の変更が本 commit に混入していないか。

## Spec Contract

Contract ID: SPEC-UIB3-1

- catalog ①（説明セクション使用パターン、PageHeader component gap の記録）、catalog ③（備考規則+A1統合、単位表示 formatter ルール）、DSR-22（記録ID方針の owner culling 注記）、function-design 3 doc（説明文 3 案）が canonical docs に反映され、`src/**` は無変更のまま。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-UIB3-1 | S1/S2 | AC1/AC2 rg | 説明セクション使用パターン・PLU書出し enabling flow | rg |
| SPEC-UIB3-1 | S3 | AC4 rg | 記録ID owner culling 注記 | rg |
| SPEC-UIB3-1 | S4 | AC5 rg | 備考規則 + A1統合 + 囲み是正方向 | rg / reviewer 実読 |
| SPEC-UIB3-1 | S5 | AC6 rg | 単位表示 formatter ルール | rg |
| SPEC-UIB3-1 | S6/S7 | AC7/AC8 rg | 更新履歴・Plans.md 同期 | rg |
| SPEC-UIB3-1 | 全体 | AC3/AC9/AC10 | 新規DSRなし・Non-scope遵守・doc gate | rg / git diff / doc-consistency-check.sh |

## Data Safety

- what must not be committed: なし。
- local-only paths: 該当なし。
- synthetic-only paths: 該当なし。

## Writer 実装原則（ponytail、full。実装節の直前に固定注入、`feedback-ponytail-principles-in-order-sheets.md` verbatim）

```
## 実装原則（ponytail、full）
書く前に順に問う: (1) そもそも要るか（推測需要は書かず 1 行で理由）(2) この codebase に既に helper / util / pattern があるか（再実装しない）(3) 標準ライブラリで済むか (4) platform の素の機能で済むか（<input type="date">、CSS、DB 制約）(5) 導入済み依存で済むか（数行のために新規依存を足さない）(6) 1 行で済むか (7) それでも要るなら動く最小 code。
規則: 実装 1 つの interface / 製品 1 つの factory / 変わらない値の config を作らない。将来用の scaffold を作らない。追加より削除、賢さより退屈さ。file 数は最少、動く最短 diff（ただし問題を理解してから。正しい場所の小さな変更 > 間違った場所の最小変更）。同サイズの選択肢は edge case に正しい方。意図的に角を落とした箇所（上限のある近似・O(n²)・global lock 等）は `ponytail:` comment を残す。
例外: 正しさ・データ安全・既存 test の契約・packet の AC を削る方向には使わない。
```

Writer（Plan Gate 通過後の canonical docs 起草担当）への申し送り: explicit-path `git add` のみ（`git add -A`/`.` 禁止）。PR body の `Reviewed Content HEAD` は `pending` のまま起票する。REQ / traceability table に触れる変更は本 packet に含まれないため `generate_traceability` 再生成は不要（Registration Obligations 節参照、変更があれば再判定する）。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

2026-09-06: Plan Review round 1（Coordinator 直接レビュー + Opus 並行分、2 便）→ 全件 accept、本 commit で反映。
- 便 1（Coordinator）: (P1) 説明文 3 案に file:line 根拠を必須化し根拠のない文を削除、バックアップ案の「スケジュール」を誤って全面削除（便 2 で是正）。(P1) AC2 の `レジ登録状況を読み込む`/`未反映から外す` anchor が `67-ui-plu-export.md` に既に 3 件/6 件存在する false oracle だったため baseline 0 の新規文へ差替え（AC2a/b/c）。(P2) AC5 の「reviewer 目視」を撤去し、baseline 0 確認済みの機械 oracle（`備考は`/`truncate + \`title\``/`直近 {N} 件の`）へ差替え。(P2) L8-3 の tone を「L8-2 待ち」から ⑦ の tone family 表・DSR-22 narrow 化の既存決定へ差替え。(P3) 備考の全文確認手段は詳細ページが担い `title` は DSR-11 に沿う補足と明記。(P3) ⑦ との merge 順序（同一 2 file 編集）を Workflow State に追記。
- 便 2（Opus 並行）: (P1 訂正) バックアップの自動バックアップ機能は実在する（`:421,429`）ため全面削除ではなく実際のラベルへ書き直し。(P1) `PageHeader` の `actions`/`subtitle` 併存は `SupplierManagementPage.tsx` 以外に `ReceivingPage.tsx`/`ManualSalePage.tsx`/`ReturnExchangePage.tsx`/`DisposalPage.tsx` の 4 画面で実害（`subtitle` 消失）が起きていることが判明し、是正方向を (b) `PageHeader.tsx` root-cause fix へ一本化。(P1) `MovementTable.tsx:57,92-94`（7 画面共有）を備考規則の起票時実測に追加し、`?? "—"`/`"—"` の実測件数（5 箇所4file / 27箇所16file）に基づき空欄表示の推奨を「備考なし」から「—」へ反転。(P2) ⑦ の記録状態 tone 決定と Lane 5 の枠色トークン移行（`--border-strong`→`--border`）の矛盾を明記。(P3) PLU 説明文を実在ボタン文言（『差分を書き出す』/『全件を書き出す』）へ訂正、各説明文を 2〜3 文・非入れ子括弧へ整理。(P3) L8-1 の帰属画面を「一覧本体」から「記録詳細 6 画面」へ訂正。(P3) `ManualSalePage.tsx` 備考列見出し行・DSR-22 の `InventoryRecordsPage.tsx` 行番号の stale 引用を修正。
2026-09-06: Plan Review round 2（Sonnet fresh）= approve、P3 1 件是正: `BackupRestorePage.tsx:488` 引用（`:196,202`）はタグ閉じ行を指しており、実文言「復元前にも自動で同じバックアップを作成します。」は `:487`。両箇所を `:487` へ修正。
2026-09-06: Plan Gate 収束（round 1 = Coordinator 直接 + Opus、round 2 = Sonnet fresh approve）。Phase は Human Gate（説明文 3 案 / 記録 ID / 備考空欄）の owner 回答待ちで plan-draft のまま。
- Findings Freeze: not yet frozen; post-freeze exceptions: none.

2026-09-06: owner Human Gate 回答（原文は raw file「⑩ Human Gate 回答 原文」、Coordinator 転記、裁定は原文を正とする）: (1) 説明文 3 案 = **そのまま採用**（culling なし）。(2) 記録 ID = owner は (a) 種別込み表示にも好意、「労力の差か」と質問 → Coordinator 回答: 労力でなく情報価値（一覧の識別列は DSR-22 の 記録日時 + 代表商品、ID の実用は検索欄の完全一致と操作ログの元記録ラベル〈既に種別 + 番号書式〉のため (a) は既存情報の繰り返し。ただし「入庫の 42 番」と番号で呼ぶ運用があるなら (a) が正当）→ **owner 判断待ち**（運用の有無で決める）。(3) 備考の空欄 = **「—」で確定**（推奨に同意）。Human Gate は (2) の回答で完了。

2026-09-06: owner Human Gate (2) = **(b) 一覧の列から外す で確定**（原文「いや、それならbにするよ」、番号で呼ぶ運用なし）。Human Gate 3 件すべて回答済み。次 = implementing 遷移（Plan Commit `1e758cf5`）→ Sonnet Writer（S1〜S6 の design docs 編集、記録 ID は (b) を DSR-22 マッピング表 + `65-inventory-record-traceability.md:212` へ反映）→ Final Review → human-confirm → Codex 待ち。

2026-09-06: Plan Gate 収束（round 1 = Coordinator 直接〈owner 許可〉+ Opus 並走、round 2 = Sonnet fresh approve）+ Human Gate 3 件回答済み → `plan-draft -> plan-gate -> plan-approved -> implementing` を Plans.md ⑩ 同期の本 content commit に同乗させて遷移。Plan Commit = `1e758cf5`（plan-first commit、main `07302b5` 直上）。Codex 1 回は §3.3 pending。

2026-09-06: Final Review round 1 = Sonnet fresh approve-with-P2（AC 全通過、D-038 揮発 evidence 0、P2: DSR-22 :435 の stale 行番号未修正 / packet Goal・Non-scope の「別 commit」文言）+ Opus approve-with-P2（同 stale 行 / 「備考なし」を代替として残す文 / 「直近10件」の空白 / MovementTable 引用の誤り / 価格履歴は `ul` で `TableHead` 指示が不成立）→ Writer 是正 `0d75d3e`（全 5 件 + 「確定後 / 別 commit」文言の canonical 側 0 件確認）。Coordinator が是正行を検分し P1/P2 = 0 を確認、`implementing -> local-verified -> independent-review -> human-confirm` を Plans.md ⑩ 同期の本 content commit に同乗させて遷移、Reviewed Content HEAD = `0d75d3e`。注記: 本 packet の Goal / Non-scope にある「65-doc:212 の改訂は確定後の別 commit」は Human Gate 完了（2026-09-06）により本 PR で前倒し反映済み（Writer commit `6e5ddcf`）。残り = Codex 1 回（§3.3 pending、9/7 夜）→ Findings Freeze → ready-hosted-final（docs-only、hosted は owner dispatch）。
