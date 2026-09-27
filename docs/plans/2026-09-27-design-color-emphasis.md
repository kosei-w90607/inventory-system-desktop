# Plan Packet: デザインの決まり runtime lane A（色と強調）

2026-09-27 起票。起点は `e7c22f8f`（origin/main）。デザインの決まりの組み直し（[D-091](../decision-log.md#d-091-デザインの決まりを見る人の受け取り方から組み直す2026-09-24)、PR #98）が `docs/design-system/00-foundations.md` に置いた色の役割・強調の段階・迷いやすい場面を、token・横断部品・全画面へ反映する。範囲の正本は [backlog](../backlog.md) の「デザインの決まり runtime lane A（色と強調）」の項目で、本 packet は現行 main の site を `rg` で数え直し、移すか除外かを決めた。実装は plan-approved の後に Writer（別 context）が行う。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

実装後の状態はPR native state / 専用record / CIが所有し、trackedに書かない。

- Phase: plan-gate
- Risk: R3
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（worktree `.claude/worktrees/design-color-emphasis`、branch `agent/design-color-emphasis`）
- Plan Reviewer: Opus 5.5（fresh subagent、Writer と別 context）+ Codex（GPT-5.6 Sol か GPT-6 Astra、owner が起動時に指定）
- Final Reviewer: Fable 5.1（fresh subagent。design lane と R3 以上の Claude 側）+ Codex（GPT-5.6 Sol か GPT-6 Astra）。互いに独立で、後の reviewer に先の結果を見せない
- Final Review Minimum: 1
- Human Gate: ready,merge,manual

manual = owner が before / after（と試し）を実機で並べて見る L3（AC-L3-1〜13）。Final Review Minimum は規則どおり 1（R4 でなく、予定 file に `scripts/ci/classify-changes.sh` が workflow と判定する path が無い）。R3 で operator が読む状態の見え方を全画面で変えるため、Contract Audit の 2 本目の推奨（DEV_WORKFLOW Contract Audit「operator-visible state lifecycle」）に従い、Final Reviewer 2 本を運用で回す。

遷移記録（append-only）:
- kickoff → spec-check → plan-draft → plan-gate（本 commit、plan-first、2026-09-27、起草役）: Risk R3 を記録。Design Readiness が D-091 と `docs/design-system/00-foundations.md`（色の役割・強調の段階・迷いやすい場面）・`01-decision-rules.md`（DSR-08 / DSR-21 / DSR-22）・`02-component-catalog.md`（⑥ ⑫ ⑬）を実装に足りると引用するため、spec-check → plan-draft の許容 skip を使う（正本で決まっていない 2 点〈card の面色・muted の文字色の値〉は Non-scope に置き、design へ戻さない）。packet と Test Design Matrix を同じ commit に置く。decision-log の番号は **D-094** を予約する（D-092 / D-093 は並走のハーネス PR2 / PR3 が予約済み）。

## Owner Effort Budget

- 介入回数上限: 7（既定 3 から改訂。内訳 = 起票承認 1〈消費済み、owner 2026-09-27「B 色と強調 + E 小口」〉+ L3 round 1〈before / after / 試しの並べ比べと試しの採否〉1 + L3 round 2〈採否を反映した最終版の確認〉1 + Codex relay の起動 2〈Plan Review・Final Review〉+ Ready 1 + merge 1。理由 = 全画面の見た目を 1 PR で変え、試し 7 点の採否を owner が実機で決めるため）
- 実働時間上限: 60分（既定 30 分から改訂。L3 round 1 は build 3 本〈main / PR head / 試し〉を並べて 13 項目を見るため）
- relay 往復上限: 3（Plan Review の Codex 1、Final Review の Codex 1、manual〈L3 の結果の受け渡し〉1）
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
operator が状態を読み分ける見た目（押す・進行中・危険・失敗・注意の色と強調）を全画面で変える。共有部品（`alert.tsx` の `destructive` は 53 site、`badge.tsx`、`progress.tsx`、`--primary` / `--ring` を読む `button`・`checkbox`・ナビの現在地・focus ring）への変更が画面横断に波及し、DEV_WORKFLOW Risk Tiers の「operator workflow」と、R2 / R3 で迷えば stable contract（DSR の見え方の契約）に触れる方を採る規則に当たる。DB / Tauri command / DTO / route / search state / CSV は変えないため R4 ではない。

## Goal

Goal Invariant:

### 最小完了条件

- 操作（押すボタン・リンク・ナビの現在地・checkbox の checked・focus ring）が D-091 の操作の色（#1D5C63）になり、注意・確認の琥珀と別の色で見える。
- 進行中（現在行・待ちの spinner・作業の進み具合の棒、owner が採った試しでは詳細を開いた行と取込みの手順のいまのステップ）が新しい進行中の token で示される。
- 危険・失敗の Alert が薄い地 + 線 + 三角 icon + 文言（段 2）になり、53 site すべてで icon が付く。
- 00 の「迷いやすい場面」23 行と色の役割表の移行列に「runtime lane A 待ち」「lane A の L3 で試し」が残らず、試し 7 点は owner の L3 の採否どおりの形（実装と 00 / 01 / 02 / 04 / review-checklist）にそろう。
- 旧 token（`--row-current`、試しを採った場合の `--rank-top-*`、`--warning-emphasis` と操作の兼用）が src と 00 から消え、DS3（00 ↔ `globals.css` の HEX 突合）が通る。

### 失敗定義

- 今の赤・琥珀・緑の割り当て（在庫切れ・取消済み・マイナスの増減・取得失敗の赤、注意の琥珀、完了の緑、owner 決定 2026-09-06）が変わる。
- 状態の意味が色だけで伝わる箇所が増える（文言・icon・記号・位置のどれかを失う）。accessible name・role・文言が変わる。
- main に途中の状態（操作の色だけ新しく、部品や画面が旧 token のまま等）が置かれる。
- `src-tauri/**`、`src/lib/bindings.ts`、`src/routeTree.gen.ts`、`package.json` / `package-lock.json` に diff が出る。
- 正本に無い色の値・token の役割を実装が先に決める（例: card の面色や muted の文字色の値を変える）。

### 非目的

- 書体の変更（runtime lane B）。棚卸し画面 D1 の実装と作業中の囲み（段 3）の新設。
- card の面色を白へ寄せること、muted の文字色の値を変えること（正本で決まっていない。Non-scope と owner への質問）。
- ボタンの高さ（44px）・badge の文字の太さの変更（L3 で見るだけ）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

operator の操作手順・data 契約・状態遷移は変えないが、operator が普通の一日で状態を読み分けられるかが目的のため、表を置く。各行は L3 の到達手順にも使う。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 起動直後、前日分の日報が未取込み | Home を開く | 前日分の未取込みの知らせ（危険・失敗の薄い地 + 線 + 三角 icon + 文言）と、「売上データ取込み」の入口 card（操作の線）が目に入り、押す先が 1 つに決まる | 入口 card を押す | 知らせを注意・確認へ揃える試し、入口 card の地を操作の仲間へ揃える試しは L3（AC-L3-4 / 6） |
| 売上データ取込みの日報取込みタブ、ファイル未選択 | 日報ファイルを選び、プレビューを見て取り込む | 取込み中は待ちの spinner が進行中の色で示される。取込み済みの日なら危険・失敗の Alert で止まる | 結果の画面が出る | 取込み済みの badge を危険・失敗へ揃える試しは L3（AC-L3-5） |
| 日報取込みの結果の画面 | 結果を読む | 完了の badge（緑、icon + 文言）と、押すボタン（操作の塗り）を言い分けられる | 次の画面へ移る | AC-L3-7 |
| 商品別CSV取込み（Z004）タブ | ファイルを選び、プレビューを見る | 手順の表示のいまのステップが分かる。取込みの確定は停止中（[停止 ADR](../adr/2026-09-23-legacy-stocktake-z004-write-stop.md) SPEC-STOP-D4）のため、「3 結果」と取込み中の表示（移動制限の知らせ）は画面では出ない | —（停止の解除は ㉘ の ⑤） | いまのステップの試しは L3（AC-L3-10、ステップ 1〜2）。ステップ 3 と移動制限の知らせは自動 test だけで確かめる |
| 在庫照会の一覧 | 行を押して詳細を開き、もう一度押して閉じる | 開いた行と詳細が一体に見え、どれを開いているか分かる | 別の行を開く・閉じる | 詳細を開いた行を進行中にする試しは L3（AC-L3-9）。行内の muted の文字は進行中の地の上で 4.13:1（Contract Probe） |
| 入庫記録の入力 | 取引先を選ぶ dialog で行を選ぶ | 選んでいる行が左端のバー + 進行中の地 + 「選択中」で分かる | 閉じて入力を続ける | AC-L3-8 |
| 月次売上の商品別 | ランキングと前月比を見る | 1 位が順位と太字で分かる。前月比は記号と文字色で増減が分かる | — | AC-L3-2 / 11 |
| どの画面でも取得に失敗 | 画面を開く | 危険・失敗の Alert（薄い地 + 線 + 三角 icon + 原因と次の一手）と再試行 | 再試行を押す | AC-L3-12 |

本 lane で完了できるのは見た目の移行までで、operator の業務の目的（取込み・照会・記録）は現行のまま達成できる。muted の文字の AA 未達（下の Non-scope）は本 lane の完了後も残る。

## 起票時実測（2026-09-27、`e7c22f8f`）

site 数は下の command をこの worktree で実行した出力。「非 test」は `--glob '!*.test.*'`。分類の全行は [Matrix](test-matrices/2026-09-27-design-color-emphasis.md) の Adjacent Pattern Audit。

| # | 対象 | command | 出力 | 扱い |
|---|---|---|---|---|
| 1 | `primary` の非 test 行 | `rg -n 'primary' src --glob '!*.test.*' \| wc -l` | 35 | token の値の変更で追従する site と、進行中へ移す site に分ける（Matrix） |
| 2 | `--ring` を読む site | `rg -n -e '-ring\b' src --glob '!*.test.*' \| wc -l` | 19（16 file） | すべて `ring-ring` / `border-ring` / `outline-ring` / token 定義で、`--ring` の値の変更で追従。site の編集なし |
| 3 | `warning-emphasis` | `rg -n 'warning-emphasis' src --glob '!*.test.*' \| wc -l` | 5 | 注意・確認の文字（在庫少のセル・件数・取込みの警告文）は不変。token 定義 2 行は値不変 |
| 4 | `rank-top` | `rg -n 'rank-top' src \| wc -l` | 8（test 0） | ランキング 1 位の試しを採れば全削除 |
| 5 | `row-current` | `rg -n 'row-current' src \| wc -l` | 9（非 test 3・test 6） | 現在行を進行中の token へ移し全削除 |
| 6 | `toast.info` | `rg -n 'toast\.info' src \| wc -l` | 0 | 変更なし（00「お知らせ一般」の行どおり） |
| 7 | `variant="destructive"` | `rg -n 'variant="destructive"' src --glob '!*.test.*' \| wc -l` | 63 = Alert 53 + `AlertDialogAction` 9 + `Button` 1（`MergeSupplierDialog.tsx:193`、dialog 内） | Alert 53 は `alert.tsx` の変更で移る（うち `ImportingStep` 1 は注意・確認へ）。dialog の実行ボタン 10 は不変（DSR-20） |
| 8 | 明示の icon を持つ destructive Alert | `rg -U -c '<Alert variant="destructive"[^>]*>\s*<AlertTriangle' src --glob '!*.test.*'` の合計 | 6（`BackupRestorePage.tsx:324,364`、`CostDiffDialog.tsx:141`、`HomePage.tsx:78`、`IntegrityCheckPage.tsx:211`、`ProductImportPreview.tsx:83`） | icon を部品が描くため 6 site の明示の icon を外す（D-CE2） |
| 9 | `data-[state=selected]` / `has-aria-expanded` | `rg -n 'has-aria-expanded\|data-\[state=selected\]' src --glob '!*.test.*'` | `table.tsx:48` の既定 1 行 + `ProductListTable.tsx:96` のコメント 1 行 | `table.tsx` の既定は stone のまま（選択欄を開いた入力行に当たるため）。詳細を開いた行は site 側で明示の class を当てる（D-CE7） |
| 10 | `<Badge variant="default"` | `rg -n '<Badge variant="default"' src --glob '!*.test.*' \| wc -l` | 2（`BackupRestorePage.tsx:520` 最新、`ProductImportPreview.tsx:76` 上書き件数） | `--warning-emphasis` の塗りへ移す（D-091）。variant 無指定の `<Badge>` は `ProductRankingTable.tsx:80` だけ |
| 11 | 待ちの spinner | `rg -n 'animate-spin text-primary' src \| wc -l` | 5（`DailyReportImportPage.tsx:98,298`、`ImportingStep.tsx:22`、`ParseStep.tsx:25`、`IntegrityCheckPage.tsx:490`） | 進行中へ |
| 12 | 進み具合の棒 | `rg -n '<Progress' src --glob '!*.test.*'` | 3 site（`StocktakePage.tsx:430` 棚卸しの進み、`DepartmentTable.tsx:95` 部門比率、`IntegrityCheckPage.tsx:495` 確認中の不定の棒〈`before:bg-warning`〉） | 作業の進み 2 site は進行中、比率 1 site はふつう・補足（00「進み具合の棒」の行） |
| 13 | 00 に無い token の drift | `rg -n 'warning-foreground\|info-soft\|border-info\|text-info-strong' src \| wc -l` | 2（`IntegrityCheckPage.tsx:272`、`PluExportPage.tsx:366`） | どちらも class が生成されず見た目に効いていない。class を外す（D-CE11、見た目不変） |
| 14 | 未保存の案内の赤い文字 | `rg -B1 '未保存の(入庫\|手動販売\|廃棄・破損\|返品・交換)内容があります' src --glob '!*.test.*' \| rg -c 'text-destructive'` | 4 | 注意・確認の文字へ（D-CE10） |
| 15 | docs の移行の印 | `rg -n 'lane A (待ち\|の L3 で試し\|の L3 まで\|の merge 前\|の merge 後\|の L3 で決ま)\|runtime lane A で(追加\|移す)' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md docs/SCREEN_DESIGN.md --glob '!reference/**' \| wc -l` | 36（00 26 / README 4 / review-checklist 2 / 01・02・04・UI_TECH_STACK 各 1） | すべて解消 |

起票時に見つけた、backlog の項目に無い隣接 site（Matrix で移す・除外を決めた）: `ReturnExchangePage.tsx:151` の登録方法の選択カード（`border-primary bg-primary/5`）、`FilePicker.tsx:134` の drag over（同）、`input.tsx` の文字選択（`selection:bg-primary`）、`formatErrorRow.ts:22` の「フォーマット異常」badge（`destructive` の塗り）、`PriceRevisionTable.tsx:104` の「入力中」（現在行を badge 1 点で示す）。

## 設計判断（Coordinator adjudication、Plan Review で覆せる）

- **D-CE1 token**: 進行中の家族を既存の家族（warning / success / destructive）と同じ形で足す。`--ongoing`（#2F7F86、D-091 の進行中の枠。バー・棒・spinner・段 3 の枠）、`--ongoing-soft`（#E6F0F0、地）、`--ongoing-border`（#7FB0B4、badge 大の要素の 1px 線）、`--ongoing-strong`（#123E43、文字）。`@theme inline` に `--color-ongoing*` を足す。`--primary` と `--ring` を #1D5C63（D-091 の操作の塗り）へ、`--primary-foreground` は #fafaf9 のまま。`--warning-emphasis` の値は不変（#b45309）で、役割は注意・確認だけになる。名前は Plan Review で覆せる。値は D-091 の候補値で、L3 で確定したら 00 のパレット表・セマンティックカラー表へ登録し、D-094 に記録する（D-091「runtime lane A が実測と L3 で値を確定し…登録する」）。
- **D-CE2 destructive Alert**: `alert.tsx` の `destructive` を `warning` と対称の 4 点にする: `bg-destructive-soft border-destructive text-destructive-strong [&>svg]:text-destructive *:data-[slot=alert-description]:text-destructive-strong/90`。三角 icon（lucide の `TriangleAlert`、`aria-hidden`）は `variant="destructive"` のとき部品が最初の子として描き、明示の icon を持つ 6 site（実測 #8）から外す。backlog の「destructive Alert の soft 塗り + 三角 icon」を本 lane に束ねる（00「危険・失敗の Alert」の行が「束ねるかを lane A の Plan で決め」とする。狙いの形は 00 が段 2 と決めており、別 PR にすると Alert だけ規則とずれたまま main に残る）。部品が描く理由 = DSR-08 の「非中立の Alert は icon 必須」を 53 site の個別編集でなく 1 か所で守り、今後の site の書き忘れを構造で防ぐ。`warning` は現行どおり site が icon を書く（変えない）。
- **D-CE3 badge**: `badge.tsx` の `default` variant（`bg-primary` の塗り）と `defaultVariants` を削る。最新・上書き件数（実測 #10）は `className="border-warning bg-warning-emphasis text-primary-foreground"`（D-091 の移し先、対比 4.81:1）で琥珀 pill を保つ。`link` variant の `text-primary` は `--primary` の値で追従する。
- **D-CE4 進み具合の棒**: `progress.tsx` の棒を `bg-ongoing` にし、`indicatorClassName?: string` を 1 つ足す（棒の class を `cn` で上書き）。部門比率（`DepartmentTable.tsx:95`）は `indicatorClassName="bg-muted-foreground"`（ふつう・補足、stone の既存 token）。確認中の不定の棒（`IntegrityCheckPage.tsx:497`）は `before:bg-ongoing`。
- **D-CE5 待ちの spinner**: 実測 #11 の 5 site を `text-ongoing` へ。ボタン内の保存中の spinner は元の役割のまま（00「保存中のボタン」の行、変更なし）。
- **D-CE6 現在行**: `SupplierPickerDialog.tsx:137` を `border-l-4 border-l-ongoing bg-ongoing-soft` へ。バーは `--ongoing`（D-091: 進行中の線 #7FB0B4 は 2.29:1 で現在行のバーに使えない）。
- **D-CE7 詳細を開いた行（試し、owner 了承 2026-09-25）**: 在庫照会の選択行と展開行、操作ログの開いた行と詳細の行を、左端のバー（`border-l-4 border-l-ongoing`）+ 進行中の地（`bg-ongoing-soft`）で一体に見せる。閉じた行は `border-l-4 border-l-transparent`（`SupplierPickerDialog` と同じく列がずれない）。`table.tsx` の既定（`data-[state=selected]:bg-muted`・`has-aria-expanded:bg-muted/50`）は stone のまま残す（`has-aria-expanded` は選択欄を開いた入力行にも当たるため進行中にしない）。site 側の上書きは既定と同じ variant で書く（在庫照会の選択行は `data-[state=selected]:bg-ongoing-soft`、操作ログの開いた行は `has-aria-expanded:bg-ongoing-soft`。既定の variant 付き class は素の `bg-*` より詳細度が高く、素の class では上書きできない。`cn` の tailwind-merge が同じ variant の class を後勝ちで 1 つにする: Contract Probe）。hover で色が動かないよう開いた行に `hover:bg-ongoing-soft` を足す。3 点目は開いた詳細と「詳細を閉じる」の類の文言が担い、badge を足さない。
- **D-CE8 取込みの手順の表示（試し、Coordinator の既定 2026-09-25）**: 00「取込みの手順の表示」の行どおり、いまのステップの番号を `border-ongoing-border bg-ongoing-soft text-ongoing-strong` の丸 + 太字、名前を `font-semibold text-foreground`。済んだステップと先のステップは同じ段 0（`border-muted-foreground/30 text-muted-foreground`）で、位置と `aria-current="step"` で分ける。結果の画面でもいまのステップは「結果」のまま進行中にする（00 の行は結果の画面を例外にしていない）。Z004 の確定が停止中（SPEC-STOP-D4）のため画面ではステップ 1〜2 しか出ず、ステップ 3 は自動 test で固定し、結果の画面での受け取られ方は停止の解除（㉘ の ⑤）の lane の L3 で見る。
- **D-CE9 前月比のセル**: 00「役割色の文字だけの表示」の行（増減の ±）を当てる。薄い地の chip をやめ、+1.0% 以上は `text-success-strong`、−1.0% 以下は `text-destructive-strong`、それ以外と「—」は `text-muted-foreground`。記号と % の文言は不変。段 1（薄い地だけ）は 00 が「その役割の領域だけ」に限るため、セルの地に使わない。`docs/function-design/57-ui-monthly-sales.md` の該当行と `docs/SCREEN_DESIGN.md:373` を同期する。
- **D-CE10 失敗ではない赤の知らせ**: 取込み中の移動制限（`ImportingStep.tsx:29`）は失敗でも戻せない操作でもなく、待ってほしい知らせのため注意・確認（`variant="warning"` + `AlertTriangle`、catalog ⑥ の warning の形）。Z004 の確定が停止中のため画面には出ず、自動 test で固定する。入力 4 画面の未保存の案内（実測 #14）は「商品登録へ進むと入力が残らない」ことを確かめてほしい文のため、注意・確認の文字だけの表示 `text-warning-emphasis`（在庫少のセルと同じ token。文言が意味を担う）。未保存の案内は AC-L3-13 で owner が見る。
- **D-CE11 drift の掃除**: `IntegrityCheckPage.tsx:272` の `text-warning-foreground` を外す（`warning` variant が icon を `text-warning` にする）。`PluExportPage.tsx:366` の `border-info bg-info-soft text-info-strong` を外す（class が生成されず、現状も既定の Alert の見た目。役割はふつう・補足のお知らせ一般のまま、見た目不変）。
- **D-CE12 Home の入口 card**: PR head は owner の現行の決定を保つ形（`border-primary bg-warning-soft`、icon `text-primary`。`--primary` の値で線と icon が操作の新しい色になる。site の編集なし）。試しは地を `bg-ongoing-soft`（操作の仲間の薄い地。D-091 の候補で操作と同じ色の仲間の薄い地はこれだけ）。
- **D-CE13 ランキング 1 位（試し、owner 了承 2026-09-24）**: PR head は試しの答え（00 の役割と段の列）。1 位は badge と行の地をやめ、`<span className="text-sm font-semibold text-foreground">1 位</span>`（2 位以下の `text-sm text-muted-foreground` は不変）。`--rank-top-*` 3 token と `@theme` の 3 行を削る。
- **D-CE14 試しの扱いと順序**: 試し 7 点（D-CE7 / D-CE8 / D-CE12 / D-CE13 と、日報の取込み済みの badge・Home の前日分の未取込み・最新と上書き件数）は、採る・採らないの両方の到達形を下の「L3 の分岐」に書いて本 packet で先に承認を受ける。L3 の採否は Scope 内の分岐の選択で、packet の契約を変えないため Gated Amendment にしない。順序は 実装 → Writer の検証 → L3 round 1（採否）→ 採否の反映 → Final Review broad → L3 round 2（最終版の確認）→ Ready → merge。broad の後に見た目を変えると broad の取り直しになるため、L3 round 1 を broad の前に置く。
- **D-CE15 隣接 site**: `ReturnExchangePage.tsx:151` の選択カードと `FilePicker.tsx:134` の drag over は `--primary` の値で操作の色へ追従させ、site は編集しない（選択カードの役割を DSR-21 の選択状態〈stone〉に寄せるかは正本で決まっていないため、owner への質問にする）。`input.tsx` の文字選択は操作として追従。`formatErrorRow.ts:22`（危険の塗りの badge、00 は危険の塗りを dialog の実行ボタンだけに限る）と `PriceRevisionTable.tsx:104`（現在行を badge 1 点で示す）は、役割の選択（②分類か①状態か、現在行の 3 点へ足すか）が正本に無いため除外し、Writer が backlog へ 1 行ずつ起票する。

## Scope

1 PR。commit は backlog の進め方どおり、(1) 新 token を足す → (2) 部品を移す → (3) 画面を移す → (4) `--primary` / `--ring` の値を変え旧 token を削る → (5) docs、の順に分けてよい（途中の状態は branch 内だけ）。

- **S1 `src/styles/globals.css`**: D-CE1 の 4 token と `@theme inline` の 4 行を足す。`--primary` / `--ring` を #1D5C63 へ（commit (4)）。`--row-current` と `--color-row-current` を削る。ランキングの試しを採れば `--rank-top-*` 3 行と `@theme` の 3 行を削る（L3 の分岐）。
- **S2 `src/components/ui/alert.tsx`**: D-CE2。`destructive` の class と、`variant === "destructive"` のとき最初の子に `TriangleAlert` を描く。
- **S3 destructive Alert の明示の icon を外す 6 site**: 実測 #8 の 6 site から `AlertTriangle` の子を外す（使わなくなった import も外す）。
- **S4 `src/components/ui/badge.tsx`**: D-CE3。`default` variant と `defaultVariants` を削る。
- **S5 ③強調の 2 site**: `BackupRestorePage.tsx:520`、`ProductImportPreview.tsx:76` を D-CE3 の class へ（L3 の分岐で試しを採れば stone の pill と太字へ）。
- **S6 `src/components/ui/progress.tsx`**: D-CE4。棒を `bg-ongoing`、`indicatorClassName?` を足す。`DepartmentTable.tsx:95` に `indicatorClassName="bg-muted-foreground"`、`IntegrityCheckPage.tsx:497` を `before:bg-ongoing`。
- **S7 待ちの spinner 5 site**: D-CE5。
- **S8 現在行**: `SupplierPickerDialog.tsx:137` を D-CE6。
- **S9 詳細を開いた行**: D-CE7。`src/features/stock-inquiry/components/ProductListTable.tsx`（選択行と展開行）、`src/features/operation-logs/OperationLogsPage.tsx`（開いた行と詳細の行）。L3 で採らなければ現行（stone）へ戻す。
- **S10 取込みの手順の表示**: `src/features/csv-import/components/StepIndicator.tsx` を D-CE8。L3 で採らなければ owner の選んだ形へ直す（L3 の分岐）。
- **S11 ランキング 1 位**: `src/features/monthly-sales/components/ProductRankingTable.tsx` を D-CE13。
- **S12 前月比のセル**: `src/features/monthly-sales/components/comparison-cell.tsx` を D-CE9。
- **S13 失敗ではない赤の知らせ**: `ImportingStep.tsx`（Alert を `warning` + `AlertTriangle`）、入力 4 画面の未保存の案内（`ReceivingPage.tsx`・`ManualSalePage.tsx`・`DisposalPage.tsx`・`ReturnExchangePage.tsx` の `text-destructive` を `text-warning-emphasis`）。
- **S14 drift**: D-CE11 の 2 site。
- **S15 L3 の分岐の反映**: owner の L3 round 1 の答えに従い、下の「L3 の分岐」表の採る / 採らない側の edit を行う（Home の入口 card は `src/features/home/components/ActionButton.tsx`、日報の badge は `DailyReportImportPage.tsx:163-166`、Home の前日分の知らせは `HomePage.tsx:78`、ほか S5 / S9 / S10 / S11）。
- **S16 test**（既存 assert の更新は意図を保つ。class だけでなく文言・role・icon を assert する）:
  - `src/components/ui/alert.test.tsx`: destructive が soft の 4 点の class と `svg` 1 つ（部品が描く）を持つ、`warning` と `default` は部品が icon を描かない。既存の「destructive は warning の class を持たない」は保つ。
  - `src/components/ui/badge.test.tsx:64`: `bg-primary` の既定の塗りの assert を、variant 無指定で `bg-primary` を出さない assert へ。
  - `src/styles/globals.test.ts:20,28`: `--row-current` の literal を撤去し、`--ongoing*` 4 token と `@theme` の 4 行、`--primary` / `--ring` の値を literal で固定。
  - `src/features/suppliers/components/SupplierPickerDialog.test.tsx:61,65,66`: `bg-row-current` / `border-l-primary` を `bg-ongoing-soft` / `border-l-ongoing` へ（「選択中」の文言の assert は保つ）。
  - `src/features/stock-inquiry/components/ProductListTable.test.tsx`・`src/features/operation-logs/OperationLogsPage.test.tsx`: 開いた行と詳細の行が進行中の class を持ち、閉じると外れる（D-CE7）。選択欄を開いた入力行が進行中にならないことは `table.tsx` の既定が不変であることで保つ。
  - `src/features/monthly-sales/components/ProductRankingTable.test.tsx`: 1 位の「1 位」の文言が `font-semibold` で、行に地の class が無い（採らなければ現行の assert のまま）。
  - StepIndicator の test を足す（`aria-current="step"` のステップだけが進行中の class と太字、済んだ・先のステップは muted）。新しい test file は REQ か UI の ID（例 `UI-07`）を describe に含める（traceability T4 は ID の無い FE test file の数を baseline と比べる）。
  - 前月比のセル・移動制限の Alert・未保存の案内・③強調の badge・Home の入口 card・日報の badge・Home の Alert の既存 test のうち class を assert するものを、新しい形へ（`ActionButton.test.tsx:43,44,80`、`DailyReportImportPage.test.tsx`、`BackupRestorePage.test.tsx`、`IntegrityCheckPage.test.tsx`、`DepartmentTable.test.tsx` ほか。対象は `rg -l 'primary|rank-top|row-current|bg-warning\b|bg-muted|destructive-soft|success-soft' src --glob '*.test.*'` の 20 file から Writer が確かめる）。
- **S17 docs**（L3 の分岐の答えを反映した最終形で書く）:
  - `docs/design-system/00-foundations.md`: 冒頭の「現行と狙い」、色の役割表の「現行の実装」「移行」列、「迷いやすい場面」表の現行の実装・移行列（23 行すべて「済」か、試しを採らなかった行は owner の答えの形）、「強調の段階」の③強調の琥珀 pill の文、カラーパレット表（`--row-current` の行を削り、`--ongoing` 4 行を HEX つきで足す）、セマンティックカラー表（Primary の HEX を #1D5C63、Warning Emphasis の「現行は操作の色と同じ値」を削る、試しを採れば Rank Top 3 行を削る）、「候補の色の値…D-091 に置く」の注記を登録済みへ。
  - `docs/design-system/01-decision-rules.md`: DSR-08（icon を必須にする Alert を「非中立の〈warning・destructive〉Alert」へ、ランキングの文を L3 の答えへ）、DSR-21 の Why の「runtime lane A までの現状」の文、DSR-22 の現在行の「現行は primary のバーと `--row-current`」の文と詳細を開いた行の文。
  - `docs/design-system/02-component-catalog.md`: ① `:61` の Primary（`amber-700`）、⑤ `:322,328` の amber の文、⑥ destructive の段落（`:419` の「本 packet では変更しない」、`:450` の使用トークン）、⑫ `:827` の使用トークンと状態、⑬ の ③強調の note（`:894`）と 1 位、⑯ `:1015` の `--row-current`、更新履歴 1 行。
  - `docs/design-system/04-backbone.md`: 原則 2 と旧番号の対応表の旧 3 の行の「Alert」を「非中立の Alert」へ、原則 4 のランキングの文を L3 の答えへ。
  - `docs/design-system/README.md`: 「移行中の読み方」「移行中の作り方」を lane A 反映後の形へ（残る移行は runtime lane B だけ）。
  - `docs/quality/review-checklist.md`: カテゴリ 9 の③強調とランキングの行、「runtime lane A の merge 前は…」の句。
  - `docs/UI_TECH_STACK.md:46`: token の家族に進行中を足し「進行中は runtime lane A で追加」を削る。
  - `docs/SCREEN_DESIGN.md`: `:110`（入口 card）、`:228`（「手動」は黄色でなく②分類の stone の pill）、`:368`（1 位）、`:373`（前月比）。
  - `docs/function-design/57-ui-monthly-sales.md`: `:397-399`、`:404`、`:456-458`（前月比と 1 位の class）。
  - `docs/decision-log.md`: **D-094** を追加（D-CE1 の token 名と値の確定、試し 7 点の採否、試しを採らなかった場合の恒久の例外〈Home の入口 card の地・③強調の琥珀 pill、D-091 の求め〉、D-CE2 / D-CE9 / D-CE10 の役割の割当て）。
  - `docs/backlog.md`: D-CE15 の除外 2 件と、owner の答え次第で残る Non-scope（card の面色・muted の文字色）を起票・更新する。lane A の項目と「destructive Alert の soft 塗り + 三角 icon」の完了印は closeout で付ける。
- **S18（Coordinator、本 commit）**: 本 packet、Matrix、`docs/Plans.md` の登録 1 行。Writer は触らない。

### L3 の分岐

PR head（L3 round 1 で見せる after）は 00 の「役割」「段」の列の答えで作る。試しの版（L3 round 1 の 3 本目の build）は、Writer が PR head の上に 1 commit で作り、PR の branch へは入れない（採った分だけ S15 で PR へ入れる）。

| 試し | PR head（after） | 試しの版 | 採ったとき | 採らなかったとき |
|---|---|---|---|---|
| ランキング 1 位（D-CE13） | 順位と太字 | —（PR head が試し） | S11 のまま。`--rank-top-*` を削る | 琥珀 pill と行の地へ戻す（`--rank-top-*` を残す）。00 の色の役割表と迷いやすい場面、04 原則 4、DSR-08 のランキングの文、review-checklist カテゴリ 9 の badge の行を現行へ（00 の注記どおり） |
| 詳細を開いた行（D-CE7） | 進行中の地とバー | —（PR head が試し） | S9 のまま | stone（`bg-muted`）へ戻す。00 の表と色の役割表、02 ⑫ の狙いの 1 文、DSR-22 の詳細を開いた行の文をふつう・補足の段 0 へ、DSR-22 と 04 原則 10 の「開いている行」を「入力や編集のために開いている行」と書き分ける（00 の注記どおり） |
| 取込みの手順の表示（D-CE8） | いまのステップを進行中の段 2 | —（PR head が試し） | S10 のまま | owner の選んだ形へ直す。押すボタンでない塗り（段 4）を残すなら D-094 に例外として記録する（00 の注記どおり） |
| Home の入口 card（D-CE12） | 操作の新しい線 + 注意の薄い地 | 操作の線 + `bg-ongoing-soft` | `ActionButton.tsx` の地を `bg-ongoing-soft` へ。00・02・04 の該当文を試しの答えへ | そのまま。D-094 に恒久の例外（操作の要素に注意の薄い地）として記録 |
| 日報の取込み済みの badge | 注意・確認（現行） | 取込み済みの分岐だけ `tone="destructive"`（Alert と同じ危険・失敗）。同日追加確認の分岐は注意・確認のまま | `DailyReportImportPage.tsx` の badge を危険・失敗へ。00 の表と注記を直す | そのまま |
| Home の前日分の未取込み | 危険・失敗（現行、D-CE2 の soft の形） | `variant="warning"` + `AlertTriangle` | `HomePage.tsx:78` を注意・確認へ。00 の色の役割表と表を直す | そのまま |
| 最新・上書き件数（D-CE3） | 琥珀 pill（`--warning-emphasis` の塗り） | stone の pill と太字（`variant="secondary"` + `font-semibold`） | S5 を stone の pill と太字へ。00・02 ⑬・04 原則 4・review-checklist を直す | そのまま。D-094 に恒久の例外（押すボタンでない badge の塗り）として記録 |

## Non-scope

- `src-tauri/**`、`src/lib/bindings.ts`、`src/routeTree.gen.ts`、`package.json`、`package-lock.json`、`docs/design-system/reference/**`（mockup、正本でない）、`.agents/**`。
- **card の面色を白へ寄せる**（backlog の項目）: 00 も D-091 も面色の値と、それに伴う `--accent` / `--control-surface` / `--list-head` の関係を決めていない。値を決めることが新しい方針の決定になるため除外し、owner へ質問する。
- **muted の文字色の AA 未達**（backlog の項目、`--muted-foreground` 対 `--card` 4.40:1）: 直す向き（`--muted-foreground` を濃くする値、または対象 site の文字を濃くする）が正本に無いため除外し、owner へ質問する。本 lane の試しで進行中の地（#E6F0F0）に載る muted の文字は 4.13:1 になり、現行（対 `--card` 4.40:1）より下がる（Contract Probe）。
- 作業中の囲み（段 3、2px 枠）の新設と、取込み中の領域の進行中の地（段 1）: backlog の lane A の対象一覧に無く、使う画面（棚卸し D1）は後続 lane。
- `table.tsx` の既定（`data-[state=selected]:bg-muted`・`has-aria-expanded:bg-muted/50`）: stone のまま（D-CE7）。
- `formatErrorRow.ts:22` の危険の塗りの badge、`PriceRevisionTable.tsx:104` の「入力中」: D-CE15 で除外し backlog へ。
- ボタンの高さ、badge の文字の太さ（500）、書体: 変えない（L3 で見るだけ、または別 lane）。
- Toast（Sonner）の色: 変えない（`toast.success` / `toast.error` は役割どおり）。

## Acceptance Criteria

baseline は起票時実測（`e7c22f8f`）。「分岐」と書いた AC は L3 の答えで期待値が決まり、PR body に採った側を書く。

- **AC1 token**: `rg -c -e '--ongoing(-soft|-border|-strong)?:' src/styles/globals.css` = 4（baseline 0 = 出力なし）/ `rg -n -e '--primary: #' -e '--ring: #' src/styles/globals.css` の 2 行とも `#1d5c63`（大文字小文字不問。baseline `#b45309` の 2 行、`:82`・`:84`）/ `rg -n 'row-current' src | wc -l` = 0（baseline 9）/ 分岐: 1 位の試しを採れば `rg -n 'rank-top' src | wc -l` = 0（baseline 8）、採らなければ 8。
- **AC2 00 と DS3**: `bash scripts/doc-consistency-check.sh` で DS3 が OK、ERROR 0 / ``rg -c '`--ongoing' docs/design-system/00-foundations.md`` ≥ 4（baseline 0）/ `rg -n 'row-current' docs/design-system/00-foundations.md | wc -l` = 0（baseline 2）。
- **AC3 destructive Alert**: `rg -c 'bg-card text-destructive' src/components/ui/alert.tsx` = 0（baseline 1）/ `rg -c 'bg-destructive-soft border-destructive text-destructive-strong' src/components/ui/alert.tsx` = 1（baseline 0）/ `rg -U -c '<Alert variant="destructive"[^>]*>\s*<AlertTriangle' src --glob '!*.test.*'` の合計 = 0（baseline 6）/ `rg -c '<Alert variant="destructive"' src --glob '!*.test.*'` の合計 = 52（baseline 53、`ImportingStep` の 1 が注意・確認へ。分岐: Home の前日分の試しを採れば 51）/ `alert.test.tsx` の destructive の test が PASS。
- **AC4 badge**: `rg -n '<Badge variant="default"' src --glob '!*.test.*' | wc -l` = 0（baseline 2）/ `rg -c 'defaultVariants' src/components/ui/badge.tsx` = 0（baseline 1）/ `rg -c 'bg-primary' src/components/ui/badge.tsx` = 0（baseline 1）/ 分岐: 最新・上書き件数の試しを採らなければ `rg -c 'bg-warning-emphasis' src/features/backup-restore/BackupRestorePage.tsx src/features/products/import/ProductImportPreview.tsx` が各 1（baseline 0）、採れば各 0。
- **AC5 spinner と棒**: `rg -n 'animate-spin text-primary' src | wc -l` = 0（baseline 5）/ `rg -c 'bg-warning' src/components/ui/progress.tsx` = 0（baseline 1）/ `rg -n 'before:bg-warning' src | wc -l` = 0（baseline 1）/ `rg -c 'indicatorClassName' src/features/monthly-sales/components/DepartmentTable.tsx` = 1（baseline 0）。
- **AC6 現在行**: `rg -c 'border-l-ongoing bg-ongoing-soft' src/features/suppliers/components/SupplierPickerDialog.tsx` = 1（baseline 0）。
- **AC7 詳細を開いた行（分岐）**: 採れば `rg -c 'bg-ongoing-soft' src/features/stock-inquiry/components/ProductListTable.tsx` ≥ 2 と `rg -c 'bg-ongoing-soft' src/features/operation-logs/OperationLogsPage.tsx` ≥ 1（baseline 0 / 0）、`rg -c 'bg-muted' src/features/stock-inquiry/components/ProductListTable.tsx` = 0（baseline 2）。採らなければ 3 つとも baseline のまま。どちらでも `rg -c 'has-aria-expanded:bg-muted/50 data-\[state=selected\]:bg-muted' src/components/ui/table.tsx` = 1（不変）。
- **AC8 取込みの手順の表示（分岐）**: 採れば `rg -c 'primary' src/features/csv-import/components/StepIndicator.tsx` = 0（baseline 2）と `rg -c 'bg-ongoing-soft' src/features/csv-import/components/StepIndicator.tsx` = 1（baseline 0）。
- **AC9 前月比**: `rg -c 'success-soft|destructive-soft' src/features/monthly-sales/components/comparison-cell.tsx` = 0（baseline 2）/ `rg -c 'text-success-strong|text-destructive-strong' src/features/monthly-sales/components/comparison-cell.tsx` = 2（baseline 0）/ `rg -c 'bg-success-soft text-success|bg-destructive-soft text-destructive' docs/function-design/57-ui-monthly-sales.md` = 0（baseline 2）。
- **AC10 失敗ではない赤**: `rg -c 'variant="destructive"' src/features/csv-import/components/ImportingStep.tsx` = 0（baseline 1）/ `rg -c 'variant="warning"' src/features/csv-import/components/ImportingStep.tsx` = 1（baseline 0）/ `rg -B1 '未保存の(入庫|手動販売|廃棄・破損|返品・交換)内容があります' src --glob '!*.test.*' | rg -c 'text-destructive'` = 0（baseline 4）/ 同 `| rg -c 'text-warning-emphasis'` = 4（baseline 0）。
- **AC11 drift**: `rg -n 'warning-foreground|info-soft|border-info|text-info-strong' src | wc -l` = 0（baseline 2）。
- **AC12 docs の移行の印**: 起票時実測 #15 の command の出力 = 0 行（baseline 36）/ `rg -n 'row-current' docs/design-system/01-decision-rules.md docs/design-system/02-component-catalog.md | wc -l` = 0 / 00 の「迷いやすい場面」表の移行列の 23 行が「済」か owner の答えの形（Final Review が表を直読みして確かめる）。
- **AC13 merge 直前の sweep**（backlog の AC）: merge 直前に `origin/main` を 1 回 merge し、Matrix の Adjacent Pattern Audit の「最終 sweep の式」9 本を再実行して、全 hit が同 Audit の分類（追従 / 移した / 除外）のどれかに当たることを PR body に記録する。分類に無い hit が 1 つでもあれば merge しない。
- **AC14 検証**: 対象 test（S16 の file）が vitest で PASS、`npm run typecheck` / `npm run lint` / `npm run format:check` PASS、`cd src-tauri && cargo run --bin generate_traceability -- --check` PASS（T4 の数が不変）、最終 `bash scripts/local-ci.sh full` PASS（fresh worktree では `npm run generate:routes` を先に実行）。L3 の前に Writer が `cargo check --release` を実行する（DEV_WORKFLOW Implementation Rules）。
- **AC15**: `bash scripts/doc-consistency-check.sh --target plan` ERROR 0 / `bash scripts/check-workflow-git.sh` PASS。
- **AC16 負の oracle**: `git diff --name-only origin/main...HEAD -- src-tauri src/lib/bindings.ts src/routeTree.gen.ts package.json package-lock.json docs/design-system/reference .agents | wc -l` = 0。
- **AC-L3**（画面 / 到達手順 / 観測可能な合格基準。結果は github mode の `manual` record に残す。round 1 は build 3 本〈before = main、after = PR head、試し = 試しの版〉を並べる。round 2 は採否を反映した PR head だけで、round 1 から変わった画面を見る）:
  - **AC-L3-1 全体の並べ比べ**: Home（`/`）と入庫記録（`/inventory/receiving`）/ 起動して左のナビから開く / after でナビの現在地のバー・主要ボタンの塗り・focus ring（Tab で移る）が同じ操作の色で、在庫少の琥珀・PLU 通知バーの琥珀と別の色に見える。
  - **AC-L3-2 ランキング 1 位**: 月次売上（`/reports/monthly`）の商品別 / ナビ →「月次売上」→ 商品別 / 1 位が色なしで順位と太字だけで見分けられる（採否）。
  - **AC-L3-3 最新と手動**: バックアップ（`/settings/backup`、最新）と日次売上（`/reports/daily`、手動）/ ナビから各画面 / 「最新」と②分類の「手動」を言い分けられる。琥珀 pill（after）と stone の pill + 太字（試し）を比べる（採否）。
  - **AC-L3-4 Home の入口 card の 3 状態**: Home（`/`）/ 起動直後 / before（琥珀の線 + 注意の薄い地）・after（操作の新しい線 + 注意の薄い地）・試し（操作の線 + 操作の仲間の薄い地）を並べ、最重要の入口 1 つとして目に留まる形を owner が選ぶ（採否）。
  - **AC-L3-5 日報の取込み済み**: 売上データ取込み（`/csv-import`）の日報取込みタブ / 取込み済みの日の日報を選ぶ（CP932 の合成 fixture は Coordinator が用意） / Alert（危険・失敗）と badge（after = 注意・確認、試し = 危険・失敗。同日追加確認の badge は注意・確認のまま）の役割を見て選ぶ（採否）。
  - **AC-L3-6 Home の未取込みの知らせ**: Home（`/`）/ 前日分の日報が未取込みの状態で起動 / after（危険・失敗の soft の地 + 三角 icon）と試し（注意・確認）を比べる（採否）。
  - **AC-L3-7 操作と完了の言い分け**: 日報取込みの結果の画面（`/csv-import`、`DailyReportImportPage.tsx` の結果）/ 未取込みの日の日報を取り込む / 完了の緑の badge（icon + 文言「成功」）と操作の塗りのボタンを文字と icon で言い分けられる（D-091 の比 1.52:1 のため色では区別できない前提）。取込み中の spinner が進行中の色で見える。
  - **AC-L3-8 現在行**: 入庫記録（`/inventory/receiving`）の取引先を選ぶ dialog / 取引先の欄を押す / 選んでいる行が左端のバー + 進行中の地 + 「選択中」で分かる。
  - **AC-L3-9 詳細を開いた行**: 在庫照会（`/stock`）と操作ログ（`/settings/logs`）/ 行を押して詳細を開く・もう一度押して閉じる・別の行を開く / 開いた行と詳細が一体に見える。緑寄りの色に違和感が無いか、3 点目に badge を足さない形で分かるか、行内の薄い文字が読めるかを owner が言う（採否）。
  - **AC-L3-10 取込みの手順の表示**: 売上データ取込み（`/csv-import`）の商品別CSV取込み（Z004）タブ / ファイルを選ぶ → プレビュー（確定は停止中のためステップ 3 は出ない）/ いまのステップが進行中の段 2 で目に留まり、済んだステップ（プレビュー時の 1）と先のステップ（3）を見分けられる（採否。結果の画面の見え方は StepIndicator の自動 test だけで確かめ、停止の解除〈㉘ の ⑤〉の lane の L3 で見る）。
  - **AC-L3-11 前月比**: 月次売上（`/reports/monthly`）/ 部門別と商品別 / 地の無い文字色 + 記号で増減が読める（D-CE9）。
  - **AC-L3-12 危険・失敗の Alert の見本**: 日報取込みの二重取込みの Alert（AC-L3-5 と同じ画面、`/csv-import`）/ 同上 / 薄い地 + 線 + 三角 icon + 文言で「止まる」と受け取れる。
  - **AC-L3-13 失敗ではない知らせ**: 入庫記録（`/inventory/receiving`）/ 明細を 1 行入れる / 「未保存の入庫内容があります」が琥珀の文字で、失敗の赤と取り違えない（取込み中の移動制限の知らせ〈`ImportingStep.tsx`〉は Z004 の確定が停止中で画面に出ないため、自動 test だけで確かめる）。

## Design Sources

- Requirements / spec: owner 2026-09-24 のデザインの見直しの判断と、ランキング 1 位の試しの了承（D-091 Status）、owner 2026-09-25 の詳細を開いた行の試しの了承、runtime lane A を 1 PR で出すことの了承（2026-09-24、backlog）、owner 所感 2026-09-15（destructive Alert の soft 塗り + 三角 icon、backlog）
- Architecture: 該当なし（UI 層のみ）
- Function / command / DTO: `docs/function-design/57-ui-monthly-sales.md` §57.7 / §57.10（前月比と 1 位の表示。S17 で同期）
- DB: 該当なし
- Screen / UI: `docs/design-system/00-foundations.md`（色の役割・強調の段階・迷いやすい場面・カラーパレット・セマンティックカラー）、`01-decision-rules.md` DSR-08 / DSR-20 / DSR-21 / DSR-22、`02-component-catalog.md` ⑥ / ⑫ / ⑬、`04-backbone.md` 原則 2 / 4 / 10、`docs/SCREEN_DESIGN.md`、`.agents/skills/inventory-operator-ui/SKILL.md`
- Decision log / ADR: [D-091](../decision-log.md#d-091-デザインの決まりを見る人の受け取り方から組み直す2026-09-24)（候補値・コントラスト・試し・移し先）、D-094（本 lane で予約）

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | なし | not applicable |
| Command / DTO / generated binding / wire shape | なし | not applicable |
| DB / transaction / audit / rollback / migration | なし | not applicable |
| Screen / UI / route state / Japanese wording | 00 / 01 / 02 / 04 / README / review-checklist / UI_TECH_STACK / SCREEN_DESIGN / 57 | existing sufficient（D-091 と 00 が狙いを決め済み）。本 PR は現行の実装・移行の列と、試しの採否の反映を更新する |
| CSV / TSV / report / import / export format | なし | not applicable |
| Durable decision / ADR | D-094 | updated in this PR（token の確定値・試しの採否・恒久の例外） |

## Registration / Generation Obligations

新規 command / route / 画面 / function-design doc / REQ なし。`progress.tsx` の `indicatorClassName?` は TypeScript の optional prop で bindings に依らない。`docs/function-design/57-ui-monthly-sales.md` の編集は REQ 参照を増減しないため 90-traceability の再生成は要らない（`generate_traceability -- --check` で確かめる、AC14）。新しい FE test file は REQ か UI の ID を含める（T4）。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| SPEC-COLOR-EMPHASIS-RT-1 | 00 色の役割（操作）/ 迷いやすい場面「focus ring」「checkbox の checked」「現在地と現在行」「役割色の文字だけの表示」のリンク | D-091、D-CE1 | 操作を琥珀から分け 1 色 1 役割にする。site ごとの置換は採らず token の値で追従させる（壊さない） | S1 | `globals.test.ts`、`SidebarLink.test.tsx:149`（`border-l-primary` 不変） |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 色の役割（進行中）/ 迷いやすい場面「待ちの spinner」「進み具合の棒」「現在地と現在行」 | D-CE1 / D-CE4 / D-CE5 / D-CE6 | 進行中の家族を既存の家族と同じ形で足す。進行中の線は 3:1 未満のためバーと棒は `--ongoing` | S1 / S6 / S7 / S8 | `globals.test.ts`、`SupplierPickerDialog.test.tsx`、`DepartmentTable.test.tsx` |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 迷いやすい場面「危険・失敗の Alert」、DSR-08、02 ⑥ | D-CE2 | 部品が icon を描き 53 site の書き忘れを防ぐ。53 site の個別追加（差分が大きく、今後の site で漏れる）は採らない | S2 / S3 | `alert.test.tsx` |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 強調の段階（段 4 は押すボタンだけ）、D-091 の③強調の移し先 | D-CE3 | badge の既定の塗りを無くし、琥珀 pill は `--warning-emphasis` で保つ（`--warning` は 3.05:1 で不可） | S4 / S5 | `badge.test.tsx`、`BackupRestorePage.test.tsx` |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 迷いやすい場面「詳細を開いた行」、02 ⑫、DSR-22 | D-CE7 | 既定を変えず site で上書き（選択欄を開いた入力行を進行中にしない） | S9 | `ProductListTable.test.tsx`、`OperationLogsPage.test.tsx` |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 迷いやすい場面「取込みの手順の表示」 | D-CE8 | 塗りは押すボタンだけのため段 2 へ | S10 | StepIndicator の新 test |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 迷いやすい場面「ランキング 1 位」 | D-CE13 | 色でなく順位と太字（owner 了承の試し） | S11 | `ProductRankingTable.test.tsx` |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 迷いやすい場面「役割色の文字だけの表示」、DSR-08、57 §57.7 | D-CE9 | 段 1 は領域だけ。chip に枠と icon を足す案（段 2 の badge 化）は強調が増えるため採らない | S12 | 前月比の test（`DepartmentTable.test.tsx` / `ProductRankingTable.test.tsx`） |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 色の役割（注意・確認 / 危険・失敗の使う場面） | D-CE10 | 失敗でない知らせに危険の赤を使わない。ふつう・補足（Alert の既定）は「待ってほしい」が伝わりにくいため採らない | S13 | 移動制限・未保存の案内の test |
| SPEC-COLOR-EMPHASIS-RT-1 | 00 色の役割表の注記（00 に無い token を使わない）、review-checklist カテゴリ 9 | D-CE11 | 生成されない class を外す。info 家族を作る案は D-091 が撤回済み | S14 | AC11 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: yes。狙いは 00 の色の役割表・強調の段階・迷いやすい場面、値とコントラストと試しは D-091。本 packet は site の census と実装の形（D-CE1〜15）だけ
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: token 名（D-CE1）、destructive Alert の icon を部品が描くこと（D-CE2）、前月比・失敗でない知らせの役割（D-CE9 / D-CE10）は S17 で 00 / 02 ⑥ と D-094 へ上げる
- Assumptions and constraints: tailwind-merge が独自の色 token の class を同じ variant 同士で 1 つにする（Contract Probe で確認済み）。WebView2 の実描画は L3
- Deferred design gaps, risk, and follow-up target: card の面色、muted の文字色の値（owner への質問、backlog）。作業中の囲みと取込み中の領域の地（棚卸し D1 の lane）。D-CE15 の除外 2 件（backlog）
- Test Design Matrix can cite design decision IDs or source doc sections: yes（D-CE1〜15、00 の迷いやすい場面の行名）
- Absolute guarantee / escape hatch self-check completed: 「危険・失敗の Alert は全 site で icon が付く」は部品が描くことで担保し、例外（明示の icon の二重）は S3 と AC3 で 0 にする。「今の赤・琥珀・緑の割り当てを変えない」は、変える要素が試しの採否（owner の L3）と D-CE10 の 2 か所（失敗でない赤を琥珀へ）だけで、後者は AC-L3-13 で owner が見る

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | not applicable（UI の見た目のみ、CMD / BIZ 非接触） | — |
| Fact check / design decision split | 事実 = 起票時実測（site 数、コントラスト比、tailwind-merge の挙動）。判断 = D-CE1〜15 | 本 packet、Matrix |
| Lifecycle / retry | 行の開閉・選択・手順の進み・取込み中の状態で見た目が切り替わる | Matrix の State Lifecycle Matrix |
| Operator workflow | 操作手順・文言・URL は不変。状態の読み分けが変わる | Ordinary Operation、AC-L3 |
| Replacement path | not applicable | — |
| Data safety / evidence | not applicable（データ非接触）。L3 の fixture は合成 | Data Safety |
| Reporting / accounting semantics | 前月比の見た目だけが変わり、値と閾値（±1.0%）は不変 | AC9 |
| Manual verification | 13 項目を before / after / 試しで並べる | AC-L3-1〜13、github mode の manual record |
| 環境・再現性 | 新設の環境依存なし。L3 の build 3 本の手順は Coordinator が owner の環境に合わせて用意する | — |

## Design Readiness

- Existing design docs are sufficient because: D-091 と 00 が 6 役割・段 0〜4・迷いやすい 23 場面の答えと候補値を決め、02 ⑥ / ⑫ / ⑬ と DSR-08 / 21 / 22 が部品の形を持つ。backlog が「Plan で役割と段を決める」とした 3 点（取込みの手順の表示・前月比のセル・失敗ではない赤の知らせ）は、00 の既存の行（取込みの手順の表示・役割色の文字だけの表示・色の役割表の使う場面）を当てて決まる（D-CE8 / D-CE9 / D-CE10）
- Source docs updated in this PR: S17
- Design gaps intentionally deferred: card の面色、muted の文字色の値（Non-scope、owner への質問）
- Durable decisions discovered in this plan and promoted to source docs: D-CE1 / D-CE2 / D-CE9 / D-CE10 を D-094 と 00 / 02 へ

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): UI のみ
- Backend function design: 非接触
- Command / DTO / data contract: 非接触
- Persistence / transaction / audit impact: なし
- Operator workflow / Japanese UI wording: 文言不変（ランキング 1 位の「1 位」、「選択中」、Alert の文言はそのまま）
- Error, empty, retry, and recovery behavior: 取得失敗の Alert は見た目だけ変わり、再試行の導線は不変
- Testability and traceability IDs: SPEC-COLOR-EMPHASIS-RT-1。REQ の追加なし

## Contract Probe

- tailwind-merge 3.5.0 が独自の色 token の class を同じ variant 同士で後勝ちにする: 本 worktree で `node -e` により `twMerge('border-b hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted','data-[state=selected]:bg-ongoing-soft')` → `border-b hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-ongoing-soft`、`twMerge('bg-primary text-primary-foreground','border-warning bg-warning-emphasis')` → `text-primary-foreground border-warning bg-warning-emphasis`、`twMerge('relative bg-card text-card-foreground','bg-destructive-soft text-destructive-strong')` → `relative bg-destructive-soft text-destructive-strong`（2026-09-27、version は `node_modules/tailwind-merge/package.json` の 3.5.0）。variant の違う class（素の `bg-ongoing-soft` と `data-[state=selected]:bg-muted`）は merge されず、CSS の詳細度で variant 付きが勝つため、D-CE7 は同じ variant で書く
- コントラスト（WCAG 2.x の相対輝度、本 worktree の `$TMPDIR/cr.py` で計算、2026-09-27）: #1D5C63 対 #fafaf9 = 7.28:1、対 #f5f5f4 = 6.97:1 / #2F7F86 対 #fafaf9 = 4.47:1、対 #E6F0F0 = 4.02:1、対 #e7e5e4（棒の溝）= 3.72:1 / #123E43 対 #E6F0F0 = 10.07:1 / #7FB0B4 対 #fafaf9 = 2.29:1 / #78716c（muted）対 #E6F0F0 = 4.13:1、対 #f5f5f4 = 4.40:1 / #1c1917 対 #E6F0F0 = 15.06:1 / #7f1d1d 対 #fef2f2 = 9.16:1 / #b91c1c 対 #fef2f2 = 5.91:1 / #b45309 対 #f5f5f4 = 4.60:1、対 #fafaf9 = 4.81:1 / #1D5C63 対 #15803d = 1.52:1。含意: 進行中の地の上の muted の文字は AA（4.5:1）に届かない（Non-scope の muted の項目と同じ根）
- `tr` の左の枠が表に描かれる: Tailwind の preflight が `table` を `border-collapse: collapse` にし、`SupplierPickerDialog` の現在行（`border-l-4`）が既に描かれている（DSR-22 の現在行の L3 で確認済み）。WebView2 での在庫照会・操作ログの行は AC-L3-9 で確かめる
- WebView2 の実描画と色の受け取り方: L3（AC-L3-1〜13）

## Contract Coverage Ledger

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| 00 色の役割「操作」（押すボタン・リンク・ナビの現在地・checked・focus ring） | S1（token の値。`button` / `badge` の `link` / `checkbox` / `SidebarLink` / `ring-ring` 系は追従） | `globals.test.ts`（値の literal）、`SidebarLink.test.tsx:149,166`（`border-l-primary` 不変） | AC-L3-1 |
| 00 色の役割「進行中」（現在行・spinner・棒・詳細を開いた行・手順のいまのステップ） | S1 / S6〜S10 | `SupplierPickerDialog.test.tsx`、`DepartmentTable.test.tsx`、`ProductListTable.test.tsx`、`OperationLogsPage.test.tsx`、StepIndicator の新 test | AC-L3-8〜10 |
| 00 色の役割「注意・確認」「完了」（済） | 非接触 | 既存 | AC-L3-7 |
| 00 色の役割「危険・失敗」の Alert（段 2、icon） | S2 / S3 | `alert.test.tsx` | AC-L3-12 |
| 00 色の役割表の注記（00 に無い token を使わない） | S14 | AC11 | — |
| 00 強調の段階（段 4 は押すボタンだけ、badge の塗りは③強調だけ） | S4 / S5 / S10 | `badge.test.tsx`、StepIndicator の新 test | AC-L3-3 / 10 |
| 00 迷いやすい場面 23 行（focus ring / 操作枠 / 保存中のボタン / 待ちの spinner / 進み具合の棒 / checked / 複数選択の行 / Home の入口 card / 画面上の確定・削除 / dialog の実行ボタン / 日報の取込み済み / 未取込みの知らせ / 危険・失敗の Alert / 減衰 / 注意の Alert と badge の線 / 完了の知らせ / 現在地と現在行 / 詳細を開いた行 / 取込みの手順の表示 / ランキング 1 位 / 最新・上書き件数 / お知らせ一般 / 役割色の文字だけの表示） | 行ごとの移し先は Matrix の Adjacent Pattern Audit。「済」の 9 行（操作枠・保存中のボタン・複数選択の行・画面上の確定・削除・dialog の実行ボタン・減衰・注意の Alert と badge の線・完了の知らせ・お知らせ一般）は非接触 | AC12（移行列）、各 test | AC-L3 の各項目 |
| 00 カラーパレット・セマンティックカラー（HEX を `globals.css` と一致） | S1 / S17 | DS3（AC2） | — |
| DSR-08（非中立の Alert と①状態 badge は icon 必須、増減の ± の色） | S2 / S12 / S17 | `alert.test.tsx`、前月比の test | AC-L3-11 |
| DSR-20（dialog の実行ボタンは危険の塗り） | 非接触（10 site 不変） | 既存 | — |
| DSR-21（現在地は操作の細いバー、選択状態は stone） | S1（追従）、D-CE15（選択カードは質問） | `SidebarLink.test.tsx` | AC-L3-1 |
| DSR-22（現在行 3 点、詳細を開いた行、操作枠 3:1） | S8 / S9 | `SupplierPickerDialog.test.tsx`、`ProductListTable.test.tsx` | AC-L3-8 / 9 |
| 02 ⑥（エラーは destructive Alert、AlertTitle + AlertDescription の 2 段） | S2 / S17 | `alert.test.tsx` | AC-L3-12 |
| 02 ⑫（展開行を選択行と一体に見せ、hover で色を動かさない） | S9 | `ProductListTable.test.tsx` | AC-L3-9 |
| 02 ⑬（badge 3 種、③強調の枠 `--warning`） | S4 / S5 / S11 | `badge.test.tsx` | AC-L3-2 / 3 |
| D-091 の③強調の移し先（`--warning-emphasis`、4.81:1） | S5 | `BackupRestorePage.test.tsx` の class | AC-L3-3 |
| D-091 の試しと採らなかったときの処理（恒久の例外の記録） | S15 / S17（D-094） | — | AC-L3-2〜6 / 9 / 10 |
| 57 §57.7 / §57.10（前月比の閾値 ±1.0% と表示、1 位の強調） | S11 / S12 / S17 | 前月比・1 位の test | AC-L3-2 / 11 |
| 今の赤・琥珀・緑の割り当て（owner 決定 2026-09-06）を変えない | 非接触（在庫状態の badge・セル・件数、取消済み、増減） | 既存の `StockStatusBadge` / `ProductListTable` / `SummaryCards` の test が無変更で PASS | — |

隣接契約 sweep: 00 の「ラベルと値」「タイポグラフィ」「スペーシング」「アイコンサイズ」「書体」は非接触（三角 icon は 16px の Alert の既定 `[&>svg]:size-4` に従う）。02 ⑦ Toast、⑭ FilePicker（drag over は `--primary` で追従、D-CE15）、⑯ ListShell（`--row-current` の記述だけ S17）。

## Test Plan

Test Design Matrix: [2026-09-27-design-color-emphasis](test-matrices/2026-09-27-design-color-emphasis.md)。

- targeted tests: S16。部品（alert / badge / progress / globals）を先に RED → GREEN、画面は class に加えて文言・role・icon を assert する
- negative tests: destructive Alert の icon が 1 つだけ（二重にならない）、`warning` と `default` は部品が icon を描かない、`table.tsx` の既定が stone のまま、badge の variant 無指定で `bg-primary` を出さない
- compatibility checks: 在庫状態・取消済み・増減・注意の既存 test が無変更で PASS（赤・琥珀・緑の割り当て不変）
- data safety checks: not applicable
- main wiring/integration checks: 画面の test で、部品の変更が実画面に届く（例: `HomePage` の前日分の知らせが soft の class と icon 1 つを持つ）
- Human Gate に L3 を含むため、Writer 完了時に `cargo check --release` を実行する（Rust 非接触だが手順どおり）

## Boundary / Wire Contract

not applicable（JSON / CSV / DTO / bindings / route state 非接触。`indicatorClassName?` は component の props で wire ではない）。

## Review Focus

- D-CE2: 部品が icon を描く形が catalog ⑥ と DSR-08 と両立するか。6 site の二重 icon が残らないか。`role="alert"` の読み上げに icon が混ざらないか（`aria-hidden`）
- D-CE7: 同じ variant での上書きが tailwind-merge と CSS の詳細度の両方で効くか。選択欄を開いた入力行（廃棄・返品交換）が進行中にならないか
- D-CE9 / D-CE10: 役割の割当てが 00 の既存の行から一意に導けるか（新しい方針を足していないか）
- L3 の分岐: 採らなかった側の docs の直し（00 の注記の列挙）が漏れなく Scope にあるか
- 今の赤・琥珀・緑の割り当てが変わる site が D-CE10 と試し以外に無いか
- muted の文字が進行中の地に載る site（在庫照会の部門・取引先の列、詳細の中のラベル）の扱いを owner の答え待ちにしてよいか

## Spec Contract

Contract ID: SPEC-COLOR-EMPHASIS-RT-1

| Contract | Test |
|---|---|
| 操作・進行中・危険・失敗の Alert・③強調・ランキング・前月比・失敗でない知らせが、00 の色の役割と段（試しは owner の L3 の答え）どおりに token・部品・画面へ反映され、今の赤・琥珀・緑の割り当てと文言・role・accessible name は不変で、00 / 01 / 02 / 04 / README / review-checklist から lane A の移行の印が消える | `alert.test.tsx`、`badge.test.tsx`、`globals.test.ts`、`SupplierPickerDialog.test.tsx`、`ProductListTable.test.tsx`、`OperationLogsPage.test.tsx`、`ProductRankingTable.test.tsx`、StepIndicator の新 test、AC1〜AC13 |

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-COLOR-EMPHASIS-RT-1 | S1 / S4 / S5 | `globals.test.ts`、`badge.test.tsx` | D-CE1 / D-CE3 | AC1 / AC2 / AC4 |
| SPEC-COLOR-EMPHASIS-RT-1 | S2 / S3 | `alert.test.tsx` | D-CE2 | AC3 |
| SPEC-COLOR-EMPHASIS-RT-1 | S6〜S10 | 各 test | D-CE4〜D-CE8 | AC5〜AC8 |
| SPEC-COLOR-EMPHASIS-RT-1 | S11〜S14 | 各 test | D-CE9〜D-CE11、D-CE13 | AC9〜AC11 |
| SPEC-COLOR-EMPHASIS-RT-1 | S15 / S17 | AC12 / AC13 | L3 の分岐 | AC-L3、PR body |

## Data Safety

- 実店舗の DB・日報・CSV・バックアップを commit しない。L3 の fixture（取込み済みの日の日報、数秒かかる大きさの商品別売上 CSV）は Coordinator が合成し、repo の外（`.local/`）に置く。取込みの fixture は実 encoding（CP932）にそろえる（DEV_WORKFLOW Human Visual Confirmation）
- local-only: L3 の build と screenshot（owner の手元）

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
- Findings Freeze: not yet frozen; post-freeze exceptions: none.
