# Test Design Matrix: デザインの決まりを「見る人の受け取り方」から組み直す

対象 packet: [2026-09-24-design-rules-renewal](../2026-09-24-design-rules-renewal.md)。改訂前の基準版は `dda8560a`（origin/main）。本 lane は文書だけの変更のため、test は `bash scripts/doc-consistency-check.sh` と `rg` / `diff` の oracle で組む。

## Risk

Risk: R2

## Contracts Under Test

- SPEC-DSR-RENEW-D1 色の役割表（6 役割・4 列・現行の実装と移行の列・HEX なし）
- SPEC-DSR-RENEW-D2 強調の段階 0〜4
- SPEC-DSR-RENEW-D3 書体（旧理由の撤回、候補 2 つ、runtime lane での採用）
- SPEC-DSR-RENEW-D4 ラベルと値・進み具合
- SPEC-DSR-RENEW-D5 原則の統合と旧番号対応表
- SPEC-DSR-RENEW-D6 DSR の話題別の並べ直し（番号・見出し不変）
- SPEC-DSR-RENEW-D7 矛盾する DSR（01 / 08 / 16 / 21 / 22）の改訂
- SPEC-DSR-RENEW-D8 移行中の読み方（候補値を canonical docs に置かない）
- SPEC-DSR-RENEW-D9 checker との境界（file 名・`## DSR-NN`・token 表の書式）
- SPEC-DSR-RENEW-D10 decision-log D-091
- SPEC-DSR-RENEW-D11 後続 lane 3 件の起票

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
| D1・D4 | F5 | CLI | T5: 00 の役割表と見出しの `rg` | `rg -n '^\| ?(操作\|進行中\|注意・確認\|完了\|危険・戻せない\|ふつう・補足) ?\|' docs/design-system/00-foundations.md` の役割表の行が 6 役割 × 各 1 行でない、表の見出し行に `見せ方`・`受け取り方`・`狙う効果`・`根拠`・`現行の実装`・`移行` のどれかが無い、ラベルと値の節に「何の値か」を言い切る規則と 4 列が無い |
| D2 | F6 | CLI | T6: 00 の強調の段階表の `rg` | 段 0〜4 の行が各 1 行でない、段 3 の行に `1 画面に 1 か所` と `黒` が無い、段 4 の行に `DSR-01` が無い |
| D8・D10 | F4 | CLI | T7: `rg -n -i '#1D5C63\|#2F7F86\|#E6F0F0\|#7FB0B4\|#123E43' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md` と `rg -c -i '#1D5C63' docs/decision-log.md` | 前者が 1 件以上、または後者が 0（候補値が D-091 に無い）。役割表の行に 6 桁 HEX がある |
| D3 | F7 | CLI | T8: `rg -n '読み込み遅延のリスク' docs/design-system docs/UI_TECH_STACK.md` と `rg -n 'Noto Sans JP\|BIZ UDPゴシック' docs/design-system/00-foundations.md` | 前者が 1 件以上、後者で 2 書体のどちらかが無い、書体の節に「runtime lane の実機比較で決める」「それまで現行の system font stack」が無い |
| D5 | F8 | CLI + review | T9: 04 の原則の本数と旧番号対応表の行数 | 原則が 8 本未満か 13 本以上、旧番号対応表が旧 1〜16 の 16 行でない、`rg -n '核心4本柱\|補助3原則' docs/design-system/03-philosophy.md docs/UI_TECH_STACK.md` が 1 件以上。review では旧 16 原則の細則（token 名・path・DSR への委譲・owner 決定の日付）が新原則・00・DSR のどこかに残るかを旧文（`git show dda8560a:docs/design-system/04-backbone.md`）と突き合わせる |
| D5 | F9 | CLI + review | T10: `rg -n '原則 ?[0-9]+' docs/design-system docs/quality/review-checklist.md docs/UI_TECH_STACK.md docs/backlog.md` の全 hit の分類 | 「新番号で正しい」「旧番号対応表の行」「更新履歴の行」「Q 番号」のどれにも当たらない hit がある |
| D7 | F10 | review | T11: `rg -n 'amber\|琥珀\|primary\|Primary\|1 位\|1位' docs/design-system/01-decision-rules.md docs/design-system/04-backbone.md` の全 hit の分類 | DSR-01 / 08 / 16 / 21 / 22 が Spec Contract D7 のとおりでない、hit が「狙いの規則」「現行の実装（runtime lane 待ち）の説明」「更新履歴」のどれにも当たらない |
| D8 | F12 | CLI + review | T12: README の索引の link と、外部参照先の実在 | README の相対 link の先の節の見出しが `rg` で見つからない。`03-philosophy.md` に japanese-webdesign の節が無い（`02-component-catalog.md` 72 行目が引く） |
| D11 | F13 | CLI | T13: `rg -n 'runtime lane A\|runtime lane B\|D1' docs/backlog.md` | 3 entry のどれかが無い、entry に着手条件・Human Gate（A と B の L3）・Non-scope 由来の作業が無い |
| Data Safety | F14 | data safety | T14: `git diff dda8560a -- docs/design-system docs/quality docs/UI_TECH_STACK.md docs/decision-log.md docs/backlog.md \| rg '^\+' \| rg -n 'claude\.ai\|\.local/'` | 1 件以上ある（Writer の編集対象 file の追加行に canvas の URL か `.local/` の path が入った） |

## State Lifecycle Matrix

not applicable: 文書の改訂で、UI・data・cache・route/search・import/export・retry・永続化の状態を持たない。runtime lane A / B が画面の状態（現在行・進行中・作業中の囲み）を扱う。

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 04-backbone の原則番号の参照 | `rg -n '原則 ?[0-9]+' docs --glob '!docs/archive/**'` と `rg -n '04-backbone' src docs`（`dda8560a`）: `docs/design-system/00-foundations.md:86`（原則 15）、`02-component-catalog.md:874`（原則 4）・`:895`・`:897`（原則 15）・`:1012`（原則 11）、`04-backbone.md` 内の相互参照、`docs/quality/review-checklist.md:87`（原則 4）・`:89`（04 原則 6）、`docs/function-design/73-ui-stocktake.md:164`（原則 4）、`src/components/patterns/PageShell.tsx:9`（原則 6）、`docs/backlog.md:41`（04-backbone の token 表）・`:235`（原則 2/4、履歴の記録） | 00:86、02:895・897・1012、04 内、review-checklist（4・6 は番号が同じため文言だけ確認）、backlog:41 | 73:164 と PageShell.tsx:9 は新番号も 4・6 で主題が同じため変えない（src を変えると CI 分類が frontend になるため避ける意味もある）。backlog:235 は過去の owner 回答の記録で書き換えない | T10 |
| 03-philosophy の哲学の参照 | `docs/UI_TECH_STACK.md:57-63`（哲学のスタック）・`:415`（§4 索引表）、`docs/design-system/01-decision-rules.md:13`（読み方）、`02-component-catalog.md:72`（japanese-webdesign の適用境界）、`README.md:15` | UI_TECH_STACK の 2 か所、01:13、README | 02:72 は 03 の japanese-webdesign 節を残すため変えない | T9・T12 |
| amber / primary / 琥珀 を役割として書く記述 | `rg -n 'amber\|琥珀\|primary\|Primary' docs/design-system`（01・04・00・02）、`docs/quality/review-checklist.md:76・87` | 01（DSR-01 / 08 / 21 / 22）、04（原則 2・4・5・15 の後継）、00（役割の列、4 色エリアの節）、review-checklist | 02 部品カタログの実装記述は現行の canonical として残し、冒頭の 1 文で読み方を示す。`docs/SCREEN_DESIGN.md` の画面ごとの記述は runtime lane A | T11 |
| 書体の不採用理由 | `rg -n 'Webフォント\|Web フォント\|font-family\|フォントファミリー' docs --glob '!docs/archive/**'` | 00 の書体の節 | `src/styles/globals.css` の `--font-sans` は runtime lane B | T8 |
| DSR 見出しを読む checker・link | `scripts/doc-consistency-check.sh` DS2（`^## (DSR-[0-9]+)`）、他文書の `01-decision-rules.md#dsr-…` の anchor | なし（見出しを変えない） | 並べ替えは anchor を変えない | T1・T3 |
| token 表を読む checker | `scripts/doc-consistency-check.sh` DS3（backtick の `--name` を含む行の最初の #hex） | なし（既存表の行と HEX を変えない） | 役割表は HEX を持たない | T1・T7 |

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
- status/policy enum: 6 役割と移行の値（済 / runtime lane A 待ち）→ T5。
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
- 役割表の行に候補 HEX を書いた場合: backtick の `--name` を同じ行に置かなければ DS3 は検出しない。T7 が候補 HEX の出現を直接検出する。
- 話題別の索引から DSR を 1 本落とした場合: T4 の行数 24 で検出する。
- DSR の見出しの文言を 1 字変えた場合: DS2 は番号しか見ないため検出しない。T3 の `diff` で検出する。
- 旧原則 15 の参照を直し忘れた場合: 機械では意味の誤りを判定できないため、T10 の hit の全件分類（Writer の記録と Final Review の確認）で検出する。

## Residual Test Gaps

- 狙った受け取り方（例: 進行中の囲みが「まだ終わっていない」と受け取られるか）は文書の test で確かめられない。runtime lane A / B の実機 L3 が持つ。
- 規則の文面が owner の判断の意図どおりかは機械で確かめられない。Plan Review・Final Review と owner の Ready 判断が持つ。
- 旧原則の細則が漏れなく移ったかは T9 の review（旧文との突き合わせ）に依る。
