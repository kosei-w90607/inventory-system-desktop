# Test Design Matrix: デザインの決まりを「見る人の受け取り方」から組み直す

対象 packet: [2026-09-24-design-rules-renewal](../2026-09-24-design-rules-renewal.md)。改訂前の基準版は `dda8560a`（origin/main）。本 lane は文書だけの変更のため、test は `bash scripts/doc-consistency-check.sh` と `rg` / `diff` の oracle で組む。

## Risk

Risk: R2

## Contracts Under Test

- SPEC-DSR-RENEW-D1 色の役割表（6 役割・使う場面と 4 列・現行の実装と移行の列・HEX なし・今の赤の割り当てを保つ）
- SPEC-DSR-RENEW-D2 強調の段階 0〜4 と段に数えないもの
- SPEC-DSR-RENEW-D3 書体（旧理由の撤回、候補 2 つ、runtime lane での採用）
- SPEC-DSR-RENEW-D4 ラベルと値・進み具合
- SPEC-DSR-RENEW-D5 原則の統合と旧番号対応表、旧 04 の未反映の約束の処分（packet S2 の処分表 U1〜U14）
- SPEC-DSR-RENEW-D6 DSR の話題別の並べ直し（番号・見出し不変）
- SPEC-DSR-RENEW-D7 矛盾する DSR（01 / 08 / 16 / 21 / 22）の改訂
- SPEC-DSR-RENEW-D8 移行中の読み方と作り方（候補値を canonical docs に置かない、現行の部品の形で作る）
- SPEC-DSR-RENEW-D9 checker との境界（file 名・`## DSR-NN`・token 表の書式）
- SPEC-DSR-RENEW-D10 decision-log D-091
- SPEC-DSR-RENEW-D11 後続 lane 3 件の起票（lane A の進め方・対象・AC・L3 項目）
- SPEC-DSR-RENEW-D12 迷いやすい場面の答え（19 場面）
- SPEC-DSR-RENEW-D13 撤回・置換する旧文（W1〜W13）
- SPEC-DSR-RENEW-D14 04 からの反映待ち 3 点（caption・ページ余白・icon）

## Failure Modes

- F1 file の改名・分割で DS2 / DS3 が「見つかりません。スキップ」の INFO になり、merge gate が黙って弱まる。
- F2 DSR の見出しの文字列・番号・段が変わり、DS2 の定義件数が減る、または他文書の anchor link が切れる。
- F3 00 の既存 token 表の行が消える、または新しい表に backtick の `--name` と #hex が同じ行に並び、DS3 の突合件数が変わる・未実装値が突合に紛れる。
- F4 canvas の候補 HEX が canonical docs に入る（2026-09-03 Codex P2-2 と同型の false-green）。
- F5 役割表の役割が 6 つ揃わない、4 列の一部が欠ける、現行の実装と移行の列が無く、読む人が現行と狙いを取り違える。
- F6 強調の段 3 が「1 画面 1 か所」「黒・文字色で引かない」を欠く、または段 1 / 2 が DSR-16 と矛盾する。
- F7 旧書体理由（読み込み遅延）が残る、または書体を決めたように読める。
- F8 原則の統合で旧原則の細則が落ちる、旧番号対応表が 16 行に満たない。
- F9 旧原則番号の参照が、新番号の別の原則を指したまま残る。
- F10 DSR-01 / 08 / 16 / 21 / 22 が役割表と矛盾したまま残る、または改訂が他の DSR と新たに矛盾する。
- F11 話題別の索引が DSR を漏らす・重複させる。
- F12 README の索引の link が実在しない節を指す。
- F13 後続 lane の起票が漏れ、Non-scope の作業が宙に浮く。
- F14 canvas の URL・`.local/`・発言原文・店の実データが tracked file に入る。
- F15 迷いやすい場面（部品の状態・現行と狙いが分かれる場面）で役割か段の答えが 0 か 2 以上になる、または今の赤の割り当てを変える答えになる。
- F16 04 が約束した 00 の 3 点（caption・ページ余白・icon）が食い違ったまま残る。
- F17 撤回・置換した旧文（info を作らない・③強調の琥珀・新しい色相を足さない 等）が改訂後の文書に現行の規則として残り、答えが 2 つ並ぶ。
- F18 移行中に画面を作る人が、候補色や新 token 名を先取りする、または進行中の新しい見た目を lane A の前に作る。
- F19 候補値から計算したコントラスト比が canonical docs（DSR-22 等）に入り、未実装の値が正本に紛れる。

## Test Matrix

- Before citing an existing test as regression coverage, use `rg` or an equivalent repository search to verify that the cited test exists.
- helper と mock の実装を読み、実際に通る境界と置換される境界を確認して Test Type / coverage を選ぶ。helper 名だけで実 router / integration と分類しない。
- `Would fail if...` は壊れる振舞いを観測できる入力・経路と結びつける。状態 reset なら初回 mount に加え同値再選択等の別経路を確認し、対象契約が行使されるものを選ぶ。

| Contract | Failure Mode | Test Type | Test Name | Would fail if... |
|---|---|---|---|---|
| D9 | F1・F3 | CLI | T1: `bash scripts/doc-consistency-check.sh` の DS1〜DS4 行 | DS2 行が `定義 24 件、孤立 0 / 壊れ参照 0` でない、DS3 行の突合件数が 27 未満（`dda8560a` で 27）、DS2 / DS3 が「見つかりません。スキップ」を出す、DS4 に WARN が出る、ERROR が 1 件以上 |
| D9 | F1 | CLI | T2: `git diff --name-status dda8560a -- docs/design-system` | 行頭が `R`（改名）または `D`（削除）の行がある |
| D6・D9 | F2 | CLI | T3: `diff <(git show dda8560a:docs/design-system/01-decision-rules.md \| rg '^## DSR-' \| sort) <(rg '^## DSR-' docs/design-system/01-decision-rules.md \| sort)` | 出力が空でない（見出しの文字列・番号・段のどれかが変わった） |
| D6 | F11 | CLI | T4: `awk '/^## 話題別の索引/{f=1;next} /^## /{f=0} f' docs/design-system/01-decision-rules.md \| rg -o 'DSR-[0-9]{2}' \| sort \| uniq -c` | 行数が 24 でない、または count が 1 でない行がある |
| D1・D4 | F5 | CLI | T5: 00 の役割表と見出しの `rg` | `rg -n '^\| ?(操作\|進行中\|注意・確認\|完了\|危険・失敗\|ふつう・補足) ?\|' docs/design-system/00-foundations.md` の役割表の行が 6 役割 × 各 1 行でない、表の見出し行に `使う場面`・`見せ方`・`受け取り方`・`狙う効果`・`根拠`・`現行の実装`・`移行` のどれかが無い、危険・失敗の行に `在庫切れ`・`取消済み`・`マイナス`・`取得失敗`・`二重` のどれかが無い、完了の行に `取込み済み` がある、ラベルと値の節に「何の値か」を言い切る規則・適用範囲 2 つ（補足情報とサマリカードの主値）・4 列が無い |
| D2 | F6 | CLI | T6: 00 の強調の段階表の `rg` | 段 0〜4 の行が各 1 行でない、段 0 の行に `stone`・`減衰`・`②分類` のどれかが無い、段 1 の行に `役割の領域` が無い、段 2 の行に `バー` と `面積` が無い、段 3 の行に `1 画面に 1 か所` と `黒` が無い、段 4 の行に `DSR-01` と `DSR-20` が無い、表の直後に `段に数えない` と `focus ring`・`操作枠`・`checked`・`進み具合の棒`・`spinner` が無い |
| D8・D10・D7 | F4・F19 | CLI | T7: `rg -n -i '#1D5C63\|#2F7F86\|#E6F0F0\|#7FB0B4\|#123E43' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md`、`rg -n '7\.28:1\|4\.47:1\|10\.07:1\|2\.29:1\|1\.11:1\|1\.52:1' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md`、`rg -c -i '#1D5C63' docs/decision-log.md` | 前の 2 つのどちらかが 1 件以上（起草時点はどちらも 0 件）、または最後が 0（候補値が D-091 に無い）。役割表の行に 6 桁 HEX がある |
| D3 | F7 | CLI | T8: `rg -n '読み込み遅延のリスク' docs/design-system docs/UI_TECH_STACK.md` と `rg -n 'Noto Sans JP\|BIZ UDPゴシック' docs/design-system/00-foundations.md` | 前者が 1 件以上、後者で 2 書体のどちらかが無い、書体の節に「runtime lane の実機比較で決める」「それまで現行の system font stack」が無い |
| D5 | F8 | CLI + review | T9: 04 の原則の本数と旧番号対応表の行数 | 原則が 8 本未満か 13 本以上、旧番号対応表に旧 1〜16 の 16 行が無い、旧原則に紐づかない W（W6〜W12）が旧 1〜16 の行に混ざり末尾の別行に無い、`rg -n '核心4本柱\|補助3原則' docs/design-system/03-philosophy.md docs/UI_TECH_STACK.md` の hit が更新履歴の行（`docs/UI_TECH_STACK.md` 840 行目）の外に 1 件以上。review では旧 16 原則の細則（token 名・path・DSR への委譲・owner 決定の日付）が新原則・00・DSR のどこかに残るかを旧文（`git show dda8560a:docs/design-system/04-backbone.md`）と突き合わせる。packet S2 の処分表 U1〜U14 の各行が行き先（00・01・02・04・review-checklist・backlog）で引けない、U9（検索ボタン併記の撤回）が旧番号対応表の「撤回・置換」列に無い、U13・U14 の backlog の 1 行が無い |
| D5 | F9 | CLI + review | T10: `rg -n '原則 ?[0-9]+' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md docs/backlog.md` の全 hit の分類 | 「新番号で正しい」「旧番号対応表の行」「更新履歴の行」「過去の記録の行（`docs/backlog.md` 235・237 行目の owner 回答の記録）」「Q 番号」のどれにも当たらない hit がある |
| D7 | F10 | review | T11: `rg -n 'amber\|琥珀\|primary\|Primary\|1 位\|1位' docs/design-system/01-decision-rules.md docs/design-system/04-backbone.md` の全 hit の分類 | DSR-01 / 08 / 16 / 21 / 22 が Spec Contract D7 のとおりでない、hit が「狙いの規則」（D12 の試しの行で owner の現行の決定を規則として書いたものを含む）「現行の実装（runtime lane 待ち）の説明」「更新履歴の行」のどれにも当たらない |
| D8 | F12 | CLI + review | T12: README の索引の link と、外部参照先の実在 | README の相対 link の先の節の見出しが `rg` で見つからない。`03-philosophy.md` に japanese-webdesign の節が無い（`02-component-catalog.md` 72 行目が引く） |
| D11 | F13 | CLI | T13: 題ごとの loop。`for t in 'デザインの決まり runtime lane A（色と強調）' 'デザインの決まり runtime lane B（書体）' '棚卸し画面 D1 の実装'; do rg -n -F "$t" docs/backlog.md; done` で各題の行を取り、行ごとに必須語を `rg -F` で確かめる（lane A: `着手条件`・`1 PR`・`origin/main`・`--ring`・`defaultVariants`・`ActionButton`・`progress`・`spinner`・`L3`。lane B: `着手条件`・`D-030`・`L3`。D1: `着手条件`・`lane A`） | どれかの題が 0 行か 2 行以上、またはその行に必須語のどれかが無い |
| D12 | F15 | CLI + review | T15: `awk '/^## 迷いやすい場面/{f=1;next} /^## /{f=0} f' docs/design-system/00-foundations.md` の出力に対し、場面の語 19 個（`focus ring`・`操作枠`・`保存中`・`待ちの spinner`・`進み具合の棒`・`checked`・`複数選択`・`入口 card`・`トリガー`・`実行ボタン`・`取込み済み`・`未取込み`・`減衰`・`注意の Alert`・`完了の知らせ`・`現在地`・`ランキング 1 位`・`最新`・`お知らせ一般`）を `rg -c -F` で数える。review では各行の役割・段が packet の D12 の表と一致するかを突き合わせる | 節が無い、場面の語のどれかが 0 件、役割か段が 1 つに決まらない行がある（行の中で条件ごとに 1 つを書く行は、条件ごとに 1 つずつあれば可。条件は要素・画面で分け、同じ要素の状態で役割を切り替える行は不可）、試しの 5 行の移行の列に `lane A の L3` が無い、ランキング 1 位を除く試しの 4 行の役割の列に `owner` と日付が無い（owner の現行の決定でない）、役割・段が D12 と違う、今の赤（在庫切れ・取消済み・マイナス・取得失敗）の役割を危険・失敗以外にする行がある |
| D14 | F16 | CLI | T16: `rg -n '^\| caption \|' docs/design-system/00-foundations.md`、`rg -n 'space-6\|space-8' docs/design-system/00-foundations.md`、`rg -n '^\| (12\|16\|20\|24\|32)px \|' docs/design-system/00-foundations.md`、`rg -n 'batch 1' docs/design-system/04-backbone.md` | caption の行に `14px` が無い、`space-6` の行に `ページ余白` が無いか `space-8` の行に `ページ余白` がある、icon の行が 5 段でないか 32px の行に `spinner` が無い、`batch 1` の hit が更新履歴の外にある |
| D13 | F17 | CLI + review | T17: `rg -n 'info\|色は家族\|琥珀\|新しい色相\|ウォーム系主アクセント\|Primary アクセント\|手動バッジ\|ボタン併記' docs/design-system/00-foundations.md docs/design-system/04-backbone.md docs/design-system/01-decision-rules.md docs/quality/review-checklist.md` の全 hit の分類と、`rg -n 'Q7' docs/design-system/04-backbone.md` | hit が「置換後の規則」「owner の現行の決定（D12 の試しの行）」「現行の実装（lane A 待ち）の説明」「旧番号対応表の行」「更新履歴の行」のどれにも当たらない、D13 の W1〜W13 のどれかが対応表の「撤回・置換」列に無い、04 に Q7 との関係の 1 文が無い |
| D8 | F18 | CLI | T18: `rg -n '移行中の作り方\|現行の token\|lane A の merge 後\|src/features/suppliers/components/SupplierPickerDialog.tsx' docs/design-system/README.md` と `rg -n '新しい見た目の先取り' docs/quality/review-checklist.md` | README で 4 語のどれかが 0 件、review-checklist が 0 件。DS1 が README の `SupplierPickerDialog.tsx` の path を実在しないとする |
| Data Safety | F14 | data safety | T14: `git diff dda8560a -- docs/design-system docs/quality docs/UI_TECH_STACK.md docs/decision-log.md docs/backlog.md \| rg '^\+' \| rg -n 'claude\.ai\|\.local/'` | 1 件以上ある（Writer の編集対象 file の追加行に canvas の URL か `.local/` の path が入った） |

## State Lifecycle Matrix

not applicable: 文書の改訂で、UI・data・cache・route/search・import/export・retry・永続化の状態を持たない。runtime lane A / B が画面の状態（現在行・進行中・作業中の囲み）を扱う。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 04-backbone の原則番号の参照 | `rg -n '原則 ?[0-9]+' docs --glob '!docs/archive/**'` と `rg -n '04-backbone' src docs`（`dda8560a`）: `docs/design-system/00-foundations.md:86`（原則 15）、`01-decision-rules.md:438`（04 原則 14）・`:456`（原則 6）・`:509`・`:510`（更新履歴）、`02-component-catalog.md:874`（原則 4）・`:889`・`:895`・`:897`（原則 15）・`:1012`・`:1016`（原則 11）、`04-backbone.md` 内の相互参照、`docs/quality/review-checklist.md:70`（04 原則 1）・`:87`（原則 4）・`:89`（04 原則 6）、`docs/function-design/59-ui-shared-patterns.md:26`（04 原則 6）、`docs/function-design/73-ui-stocktake.md:164`（原則 4）、`src/components/patterns/PageShell.tsx:3`・`:9` と `PageShell.test.tsx:3`・`src/test/page-root-pageshell-sweep.test.ts:3`（原則 6）、`docs/backlog.md:41`（04-backbone の token 表）・`:235`・`:237`（原則 2/4、履歴の記録） | 00:86、01:438（旧 14 → 新 6）、02:889・895・897（旧 15 → 新 10）・1012・1016（旧 11 → 新 7）、04 内、review-checklist（1・4・6 は番号が同じため文言だけ確認）、backlog:41 | 01:456・59:26・73:164・PageShell 系 4 行は新番号も 6・4 で主題が同じため変えない（src を変えると CI 分類が frontend になるため避ける意味もある）。01:509・510 は更新履歴、backlog:235・237 は過去の owner 回答の記録で書き換えない。`docs/design-system/reference/` の mockup と分析 doc は正本でないため変えない（packet Non-scope） | T10 |
| 03-philosophy の哲学の参照 | `docs/UI_TECH_STACK.md:57-63`（哲学のスタック）・`:415`（§4 索引表）、`docs/design-system/01-decision-rules.md:13`（読み方）、`02-component-catalog.md:72`（japanese-webdesign の適用境界）、`README.md:15` | UI_TECH_STACK の 2 か所、01:13、README | 02:72 は 03 の japanese-webdesign 節を残すため変えない | T9・T12 |
| amber / primary / 琥珀 を役割として書く記述 | `rg -n 'amber\|琥珀\|primary\|Primary' docs/design-system`（01・04・00・02）、`docs/quality/review-checklist.md:76・87` | 01（DSR-01 / 08 / 21 / 22）、04（原則 2・4・5・15 の後継）、00（役割の列、4 色エリアの節）、review-checklist | 02 部品カタログの実装記述は現行の canonical として残し、冒頭の 1 文で読み方を示す。`docs/SCREEN_DESIGN.md` の画面ごとの記述は runtime lane A | T11 |
| 書体の不採用理由 | `rg -n 'Webフォント\|Web フォント\|font-family\|フォントファミリー' docs --glob '!docs/archive/**'` | 00 の書体の節 | `src/styles/globals.css` の `--font-sans` は runtime lane B | T8 |
| DSR 見出しを読む checker・link | `scripts/doc-consistency-check.sh` DS2（`^## (DSR-[0-9]+)`）、他文書の `01-decision-rules.md#dsr-…` の anchor | なし（見出しを変えない） | 並べ替えは anchor を変えない | T1・T3 |
| token 表を読む checker | `scripts/doc-consistency-check.sh` DS3（backtick の `--name` を含む行の最初の #hex） | なし（既存表の行と HEX を変えない） | 役割表は HEX を持たない | T1・T7 |
| 操作の役割色（`--primary`）の消費（D11・D12） | `src/styles/globals.css`（`--ring` が `--primary` と同値）、`src/components/ui/button.tsx`・`badge.tsx`（`defaultVariants` が `default`）・`checkbox.tsx`（checked が `bg-primary`）、`src/components/ui/selection-tone.ts`（`CURRENT_LOCATION_ACCENT`）、`SupplierPickerDialog.tsx:137`（現在行）、`src/features/home/components/ActionButton.tsx:39`（`border-primary bg-warning-soft`）、features・patterns・layout の primary の消費（数え方で 18〜25、packet Contract Probe） | なし（src を変えない） | runtime lane A の対象として backlog の lane A の行に名指しする。式は lane A の Plan で固定し、merge 直前に再実行する | T13・T15 |
| 進行中へ移る表示（D12） | 待ちの spinner `Loader2 ... text-primary` 5 site（`ImportingStep.tsx:22`・`ParseStep.tsx:25`・`DailyReportImportPage.tsx:98,298`・`IntegrityCheckPage.tsx:490`）、`progress.tsx:25`（`bg-warning`、消費は `StocktakePage.tsx:408`・`IntegrityCheckPage.tsx:495`・`DepartmentTable.tsx:95`）、保存中のボタン（`ReceivingPage.tsx:664`・`ManualSalePage.tsx:701`・`StocktakePage.tsx:319` ほか） | なし | 保存中のボタンは元の役割のまま（D12）。spinner と棒は lane A | T15 |
| 危険の塗りと今の赤（D1・D12） | `rg -n 'variant="destructive"' src` から `Alert` を除いた 10 行（すべて dialog の実行ボタン）、在庫切れ・取消済みの destructive tone、増減のマイナス（DSR-08）、取得失敗の Alert | なし（割り当てを変えない） | Home の前日分の未取込み（`HomePage.tsx:78`、危険）と日報の取込み済みの badge（`DailyReportImportPage.tsx:163-175`、注意）は owner 決定 2026-09-06 の現行として残し、D12 の試しにする | T5・T15 |
| ③強調の badge（D5・D12） | `BackupRestorePage.tsx:537`（最新）、`ProductImportPreview.tsx:76`（上書き件数）、`ProductRankingTable.tsx:77-80`（1 位の行の地と badge）、`02-component-catalog.md` の ③強調の note | なし（02 は現行の canonical） | ランキング 1 位は試しの答えを規則に、最新・上書き件数は owner の現行の決定（琥珀 pill）を規則に書き、どちらも lane A の L3 で見せる | T15 |
| ②分類の badge と「手動」（D2・D13 の W12） | `ProductTable.tsx:132`（「手動」は `variant="secondary"`）、`00-foundations.md:32`（Warning の用途に「手動バッジ」）、`docs/SCREEN_DESIGN.md:225`（黄色「手動」バッジ） | 00:32 の用途の列 | `docs/SCREEN_DESIGN.md` の記述は lane A が画面の記述と同時に直す（packet Non-scope、D11） | T6・T17 |
| 旧 04 の未反映の約束（packet S2 の処分表） | `04-backbone.md:34-60`（token 表・反映先・適用の順序）、`button.tsx`（既定 `h-9`）、`DepartmentFilter` の `widthClass`（`w-[10rem]` と `w-[11rem]` が混在）、`src/App.css`（参照 0）、`SearchBar.tsx` の live 型（ボタンなし）、一覧の行の右端 chevron（`rg -n 'Chevron' src` の hit は選択ボタンと select の開く印・accordion・pager・操作ログの詳細の開閉だけで、行の右端には無い） | 01 DSR-01（U7）、04 新 2・7・8（U5・U6・U8・U9）、backlog（U12・U13・U14） | 反映済みの U4・U10・U11 は行き先の実物を当てるだけで変えない | T9 |
| 04 から 00 への反映待ち（D14） | `00-foundations.md` の caption 行・space-8 行・アイコンサイズ表、`04-backbone.md` 原則 1・6・10 の「batch 1 で改める」、`PageShell.tsx:21`（`p-6`）、`button.tsx`（svg 既定 `size-4`）、`badge.tsx`（svg `size-3`）、`EmptyState.tsx:29`（`size={24}`）、`alert-dialog.tsx:122`（`AlertDialogMedia` の svg 既定 `size-8`、消費は `UnsavedChangesDialog`）、`docs/UI_TECH_STACK.md:51`（アイコンサイズ 3 段） | 00 の 3 表、UI_TECH_STACK:51 | src の 12px の文字（`text-xs` 33 行）は画面を触る lane が直す（packet Non-scope） | T16 |

## Negative Paths

- missing input: 役割表・強調の段階・書体・ラベルと値の節のどれかが欠ける → T5・T6・T8。
- invalid input: 候補 HEX を canonical docs に書く → T7。
- duplicate/ambiguous input: 1 つの要素に 2 つの役割・段が当たる書き方 → Plan Review / Final Review の Ordinary Operation の確認。DSR の索引の重複 → T4。
- unknown reference: 旧原則番号・消えた節への link → T10・T12。
- dependency missing: not applicable（依存を足さない。書体の同梱は runtime lane B）。
- permission/write failure: not applicable。
- dry-run side effect: not applicable。

## Boundary Checks

- threshold: 原則の本数 8〜12、段 0〜4、バッジの文の目安 8 文字（規則の文として置くだけで機械検査しない）。
- null/default: 書体の採用前の既定 = 現行の system font stack（T8）。
- empty/non-empty: not applicable。
- min/max: not applicable。
- status/policy enum: 6 役割（操作 / 進行中 / 注意・確認 / 完了 / 危険・失敗 / ふつう・補足）と移行の値（済 / runtime lane A 待ち / lane A の L3 で試し）→ T5・T15。段の値（0〜4 / 段に数えない）→ T6・T15。
- wire type: not applicable。
- internal type: not applicable。
- producer/consumer: 00 の token 表（producer）と DS3 / `globals.css`（consumer）→ T1。
- round-trip token: not applicable。
- precision/range: コントラスト比は D-091 に計算値として置き、規則の閾値（3:1・4.5:1）は既存の DSR-22 のまま。
- cross-language parse: not applicable。

## Compatibility Checks

- old schema/input: 旧原則番号 → 旧番号対応表（T9・T10）。旧 DSR 番号 → 不変（T3）。
- new schema/input: 話題別の索引（T4）。
- output order: DSR の物理的な並びは変わるが、見出しと番号は不変（T3）。
- optional field behavior: not applicable。

## Data Safety Checks

- source-derived data: canvas の例示の商品名・数値を tracked file に写さない（T14 と review）。
- generated outputs: なし。
- secrets: なし。
- local-only files: 引継ぎ書・canvas の scratchpad 保存物は commit しない。
- synthetic sample boundaries: 例示の数値は架空と分かる書き方にする。

## Main Wiring / Integration Checks

- helper connected to main path: DS2 / DS3 が改訂後の実 file を読んで件数を出すこと（T1 の件数行で確かめる。「スキップ」の INFO は失敗として扱う）。
- output reaches manifest/report: not applicable。
- effective config reaches runtime: not applicable（runtime を変えない）。
- CLI arg reaches implementation: not applicable。

## Mutation-style Adequacy Questions

- `01-decision-rules.md` を改名した場合: DS2 は「見つかりません。スキップ」を出して ERROR にならないため、doc check の ERROR 0 だけでは検出できない。T1 が DS2 行の `定義 24 件` を要求し、T2 が改名を直接検出する。
- 00 の既存 token 表の行を 1 行消した場合: DS3 は ERROR を出さず突合件数が減る。T1 の「27 件以上」で検出する。
- 迷いやすい場面の表から 1 行落とした場合: doc check は検出しない。T15 の場面の語の数え上げで検出する。
- 在庫切れを注意・確認の役割に書いた場合: T5 の危険・失敗の行の必須語（`在庫切れ`）の欠落で検出する。
- backlog の lane A の行から `--ring` や `defaultVariants` を落とした場合: T13 の行ごとの必須語で検出する（旧 T13 の `rg 'D1'` は他の entry にも当たり検出できなかった）。
- DSR-22 に候補値の比（例: 2.29:1）を書いた場合: DS3 は比を見ないため検出しない。T7 の 2 つ目の `rg` で検出する。
- 役割表の行に候補 HEX を書いた場合: backtick の `--name` を同じ行に置かなければ DS3 は検出しない。T7 が候補 HEX の出現を直接検出する。
- 話題別の索引から DSR を 1 本落とした場合: T4 の行数 24 で検出する。
- DSR の見出しの文言を 1 字変えた場合: DS2 は番号しか見ないため検出しない。T3 の `diff` で検出する。
- 旧原則 15 の参照を直し忘れた場合: 機械では意味の誤りを判定できないため、T10 の hit の全件分類（Writer の記録と Final Review の確認）で検出する。

## Residual Test Gaps

- 狙った受け取り方（例: 進行中の囲みが「まだ終わっていない」と受け取られるか）は文書の test で確かめられない。runtime lane A / B の実機 L3 が持つ。
- 規則の文面が owner の判断の意図どおりかは機械で確かめられない。Plan Review・Final Review と owner の Ready 判断が持つ。
- D12 の試しの行（Home の入口 card・日報の取込み済み・Home の前日分の未取込み・ランキング 1 位・最新と上書き件数）を owner が採るかは、runtime lane A の L3 まで決まらない。本 lane の test は、ランキング 1 位は試しの答えが、他の 4 行は owner の現行の決定が規則として読め、試しの答えが移行の列にあることまでを確かめる。
- D12 の答えが今の src のすべての場面を覆うかは、2026-09-24 に相談役と起草役が当てた範囲に依る。新しい場面は lane A の merge 直前の `rg` 再実行（D11）で拾う。
- 旧原則の細則が漏れなく移ったかは T9 の review（旧文との突き合わせ）に依る。
