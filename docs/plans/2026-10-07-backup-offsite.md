# Plan Packet: backup の PC の外の控えと復元（USB メモリへ自動で写して確かめ、復元の前に控えを確かめる）

wave に属さない単独の lane（design-first、docs だけ。runtime は後続の lane）。2026-10-07 の第 1 段の 3 lane（`agent/stocktake-p1-3`・`agent/unit-extension`・本 lane）の 1 つで、ほかの並走は `agent/npm-audit-1006`（PR #146、package 依存）・`agent/plu-clear`（D-110）。owner の決定は 2026-10-07（repo 外の回答台帳 TD-190 の Q4「PC の外の控えは外付けの保存先へ自動で書き、確かめて画面に出す」）。本 lane の branch は `agent/backup-offsite`。

## Workflow State

- Phase: plan-gate
- Risk: R4
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5 main session
- Writer: Opus 5.5 subagent（subagent_type: writer）
- Plan Reviewer: fresh Opus 5.5 + Codex（model は発注時に決める）
- Final Reviewer: Fable 5.1（Claude 側、R3 以上）+ Codex（GPT-6.1 Sol 既定）。座組表（docs/AGENT_OPERATING_MANUAL.md ## 座組）どおり
- Final Review Minimum: 2
- Human Gate: ready,merge,r4
- Branch: agent/backup-offsite

遷移の記録:

1. kickoff → spec-check（2026-10-07、起草役）: owner 決定（TD-190 の Q4）と backlog の 2 項目（「backup に、PC の外のコピーと復元の実証が運用として設計されていない」と「保存と起動の守りの follow-up」の (2)〈新しすぎる版の backup の復元の文言〉）を Scope にし、Risk を R4 と記録した（下の Risk）。
2. spec-check → design（2026-10-07、起草役）: 正本（`docs/function-design/71-mnt-backup.md`、`68-ui-backup-restore.md`）に、PC の外の保存先・書けたかの照合・PC の外の成功の表示・復元の予行演習・新しすぎる版の文言が無く、`VACUUM INTO` が正式名へ直接書くので作成途中の file を成功の世代に数えうる。同じ commit で設計正本を更新した（下の Design Readiness）。
3. design のまま止めた（起草の時点、2026-10-07）: owner の判断事項 1〜3（下の「owner の判断事項」）が残り、design → plan-draft の条件「未解決の設計の問いが無い」を満たさない。アプリの仕組みは判断事項 1 の選択肢のどれでも同じに設計したので、決定が設計正本を変えるのは D-114 の Status・71 §71.11.6 の採った型・本 packet の Ordinary Operation と Data Safety だけの見込み（判断事項 2 で写しを含めると決めた場合は 71 §71.1・§71.11 の写す対象も変わる）。
4. design → plan-draft（2026-10-08、起草役）: owner が判断事項 1〜3 に答え（repo 外の回答台帳 TD-196・TD-197）、聞く事実 P5・P6 にも答えた（TD-198・TD-199）。決定を設計正本（71 §71.1・§71.11.6・§71.11.7・§71.13、68 UI-11b-L3-8、`docs/SCREEN_DESIGN.md` の 1 日の動線）、D-114、D-111（未決 B の決着の追記）、`docs/backlog.md` に反映した。条件（`docs/DEV_WORKFLOW.md` Workflow State の表: design の出力が source docs にあり、未解決の設計の問いが無い）を満たす。P6 の帰結を和らげる画面の振舞い（持ち帰りの 1 本の古さを出す）は設計に足さず、owner に諮る提案として Coordinator へ渡した。今の設計はその振舞いを持たないと明記してあり（71 §71.11.6・§71.11.7、D-114 の Guarantee range と Revisit）、未解決の問いではなく範囲の追加の提案として扱う。owner が採れば design へ戻る。plan-gate へは Coordinator が進める。
5. plan-draft → plan-gate（2026-10-08、Coordinator、本 commit）: 起草役が最終報告で owner に諮る提案とした「持ち帰りの 1 本の古さを和らげる画面の振舞い」（(a) 足さない／(b) 媒体ごとの最後に写した日を出す／(c) 注意も出す）を owner に諮り、(a) 足さないに決まった（repo 外の回答台帳 TD-202。差し込めば 60 秒の確認で写す今の設計〈71 §71.11.4〉のままでよい）。設計は変えず、Non-scope と D-114 の Revisit の記述のとおり。packet と Matrix（`docs/plans/test-matrices/2026-10-07-backup-offsite.md`）が揃い commit されている（`docs/DEV_WORKFLOW.md` Workflow State の表）。AC1〜AC6 を plan-gate の直前に逐語で再測し一致（AC1 `103:`・`111:`・`706:`・`747:`、AC2 68 `114:`〜`116:` と 53 `213:`、AC3 `207:`〜`210:`、AC4 `939:`、AC5 3 本とも出力なし・exit 1、AC6 出力なし）。Draft PR で Plan Review（fresh Opus + Codex）に出す。

## Owner Effort Budget

- 介入回数上限: 8（既定 6 から上げた。理由: 製品の運用の判断が 3 点〈owner の判断事項 1〜3〉と、owner に聞く機器・訪問の事実が 1 点〈Contract Probe の P5・P6、1 回の問い合わせにまとめる〉ある。1 回の問い合わせにまとめても decision point の数で数える）
- 実働時間上限: 30 分（既定）
- Plan Review round 天井: 3（既定）

| 種別 | 上限 | 消費（時点） | 残りの見込み | 予備 | 合計 |
|---|---|---|---|---|---|
| 介入 | 8 | 5（2026-10-08: 判断事項 1〜3 の 3〈TD-196・TD-197〉、機器・訪問の事実 1〈P5・P6、TD-198・TD-199〉、持ち帰りの 1 本の古さを扱う仕組みの提案 1〈予備から、TD-202〉。TD-190 の Q4 は lane の選択の前の決定で本 lane に数えない） | 3（R4 の承認 1、Ready 1、merge 1） | 0 | 8 = 5 + 3 + 0 |

## Risk

Risk: R4

Reason:
backup の作り方（作業名 → 確かめ → 正式名）、復元の前の確かめ、PC の外への書込み（取外し可能な媒体へ書き、レジの SD に書かない）を決める設計で、`docs/DEV_WORKFLOW.md` Risk Tiers の R4「backup restore」とデータ安全の境界に当たる。本 lane は docs だけだが契約を決めるので R4（Final Review Minimum 2、Human Gate `r4`）。classifier の workflow の一覧（`scripts/ci/classify-changes.sh` の `AGENTS.md|CLAUDE.md|docs/DEV_WORKFLOW.md|…|docs/templates/*|…` の行）に当たる file を Scope に持たない（下の Scope の表は `docs/function-design/`・`docs/architecture/`・`docs/SCREEN_DESIGN.md`・`docs/ARCHITECTURE.md`・`docs/FUNCTION_DESIGN.md`・`docs/decision-log.md`・`docs/backlog.md`・`docs/plans/` だけ）。required gate の green / red は変わらない: docs だけで、既存の function-design の file に未実装の関数の signature を足すが、`src-tauri/tests/design_compliance_test.rs` は「設計書にあるがコードにない関数」を INFO として失敗にしない（同 file の冒頭の説明）。function-design の新しい file を作らない。manual は足さない（本 lane は docs だけ。L3 は runtime の lane の Human Gate、68 §68.12 の UI-11b-L3-6〜9）。

## Goal

Goal Invariant:

### 最小完了条件

- 後続の runtime の lane の Writer が、チャットの履歴を見ずに source docs だけで「USB メモリを用意する → 用意した媒体が見えている間に確かめ済みの最新の backup を写して読み戻しで照合する → 最後に PC の外へ写せた日時を画面とホームに出す → 復元の前に控えを確かめて新しすぎる版・壊れた控えを止める → 別の PC・新しい PC で媒体の控えから戻す」を実装できる（MNT-01-D7〜D10、71 §71.11〜§71.13、UI-11b-D14〜D16、UI-00-D12、43 §43.8.2〜§43.8.5）。
- owner の決定（TD-190 の Q4）が設計正本と D-114 に反映され、運用の型（差しっぱなし・入れ替え 等）の比較が盗難・火事・ランサムウェアへの耐性で並び、owner の判断事項 1〜3 の決定（2026-10-08、repo 外の回答台帳 TD-196・TD-197）とその帰結が D-114 と設計正本に反映されている。
- 新しすぎる版の backup の復元で、利用者に「新しい版のアプリが要る」と伝わる設計がある（MNT-01-D9、UI-11b-D15）。

### 失敗定義

- runtime の Writer が、媒体の見分け方・写す対象・照合の方法・失敗の扱い・レジの SD に書かない保証・状態の置き場所・知らせの条件のどれかを推測しないと書けない。
- 設計が、drive 文字の変化でレジの SD や別の drive に backup を書く経路、作成途中・壊れた file を成功の控えと数える経路、媒体が抜けたまま黙って何日も過ぎる経路、復元で状態が巻き戻って黙って写さなくなる経路のどれかを残す。
- 復元の契約（MNT-01-D1〜D6、`CmdErrorKind` の restore の 3 値、UI-11b-D2〜D5）を壊す。

### 非目的

- runtime の code・test・fixture・bindings（後続の lane）。
- クラウドへの backup（外部のサービスに頼らない owner の方針、TD-188 の文脈）。network（UNC）の保存先（`docs/backlog.md` の保留の項）。
- 更新・migration の前の保全（MSI 配布手順と一緒に設計する。D-114 の Revisit、`docs/backlog.md` の同項の残り）。
- 写しの暗号化、媒体を登録から外す操作、持ち帰った媒体の古さをアプリで扱うこと（D-114 の Revisit）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

設計を含む変更なので、店の毎日の列を置く。本 lane は docs だけで、表の通常運用は runtime の lane の後に成り立つ。**この文書を完了できる**（設計正本がそろう）ことと、**通常運用を達成できる**（店で PC の外の控えが毎日取れる）ことは別で、後者は本 lane では未達。運用の型は C（2 本の入れ替え。owner 決定 2026-10-08、repo 外の回答台帳 TD-196）で書く。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 導入時、PC の外の控えは用意の前 | owner が USB メモリ（札「控え 1」）を差し、バックアップ画面の「この USB メモリを控えの保存先にする」で選ぶ | 媒体に `InventoryBackup\` と目印ができ、続けて最新の backup が写り、card に「最後に PC の外へ写した控え: 今日の日時（控え 1、確かめ済み）」 | card に今日の日時 | P1（USB メモリが取外し可能な drive に見える）。P5: 空きの USB の口は 1 つ（TD-198）で、控え 1 がそれを占める |
| 控え 1 が差してある | owner が控え 1 を抜き、同じ口に 2 本目（札「控え 2」）を差して同じく用意し、控え 2 を抜いて持ち帰り、控え 1 を差し戻す（空きの口が 1 つなので 2 本を同時に差さない、P5） | 控え 2 にも同じ控えが写る。控え 1 を差し戻すと 60 秒以内に「差してある控え: 控え 1」 | — | 持ち帰りは owner が受けた前提（TD-011 の見直しと露出の受容、TD-196） |
| 毎朝、PC を起動する | 店主は何もしない | 起動時の自動 backup（71 §71.8）の後、共通レイアウトの起動直後の確認が控え 1 へ写す（UI-11b-D16） | — | — |
| 営業中 | 何もしない | 設定時刻の backup ができれば、60 秒以内に控え 1 へ写る | — | 店を閉める前に PC を閉じる日は、その日の入力は翌朝の backup まで PC の中だけ（71 §71.11.7） |
| 控え 1 が抜けた・壊れた | 何もしない | 写せない。媒体が見えないだけなら toast は出ない。最後に写せた日から 3 日でホームに「PC の外の控えが 3 日写せていません。USB メモリが差してあるか確かめてください。」 | 店主が差し直す、または owner に連絡 | 写す処理の失敗（空きなし・照合の不一致）は toast を 1 回（UI-11b-D16） |
| ホームに知らせが出ている | 店主が控え 1 を差し直す | 60 秒以内に写り、知らせが消える | — | — |
| owner の訪問 | owner が控え 1 を抜き、持ち帰っていた控え 2 を差す。差した控え 2 の最新の file を「控えを選んで確かめる」で見る | 控え 2 が前回の時点まで読めることが分かり（短い確かめ、71 §71.13）、60 秒以内に今日の控えが控え 2 へ写る。控え 1 を持ち帰る | card に「差してある控え: 控え 2」と今日の日時 | drive 文字が変わっても目印で見つかる（MNT-01-D8）。同じ口で抜いてから差す（P5）。訪問の間隔は決まっていない（P6、TD-199） |
| 新しすぎる版の控え・壊れた控えを選んだ | 一覧の行か「控えを選んで確かめる」 | 確認の手順へ進まずに固有の文言（UI-11b-D15）。事前バックアップも作らない | 別の控えを選ぶ | — |
| PC を失った（故障・盗難・火事） | owner が新しい PC にアプリを入れ、「控えを選んで確かめる」で持ち帰っていた控えを選び、2 段の確認で戻し、媒体を用意し直す | 最後の入れ替えの時点（店に残った控えが無事なら前日）まで戻る | — | 盗難・火事で失う期間は最後の入れ替えからの日数で、上限が無い（P6、下の残るリスク） |

残るリスク（owner の決定 TD-196 と、P5・P6 の答えの帰結）:

- 持ち帰りの 1 本が守る範囲: 盗難・火事・水害、または差している控え 1 も暗号化するランサムウェアで、PC と控え 1 を同時に失うと、戻れるのは持ち帰りの控えの時点まで。失う日数は最後の入れ替えからの日数で決まり、訪問の間隔は決まっていない（TD-199）ので上限が無い。店主の許容（3 日程度前まで、L-220）を超えうる。アプリは持ち帰りの 1 本の古さを見ず、ホームの 3 日の知らせ（UI-00-D12）は差してある 1 本についてだけ出る（71 §71.11.6・§71.11.7、D-114 の Guarantee range）。持ち帰りの 1 本の古さをアプリで扱うことは今の設計に無い（D-114 の Revisit）。
- PC の故障・DB の破損・誤操作の後に古い時点へ戻すことは、差しっぱなしの控え 1（前日まで、30 世代）が守り、訪問の間隔に依らない。
- owner は「実際に運用できるかは別」と添えた（TD-196）。入れ替えが途絶えても控え 1 への毎日の写しとホームの知らせは続き、守りは A（差しっぱなし）と同じに戻るだけで、アプリの振舞いは変わらない（MNT-01-D8 は型に依らない）。
- 空きの USB の口が 1 つ（P5、TD-198）: 控え 1 がその口を占める。SD の読取り機とバーコードリーダーは自分の口を使い続けるので、毎日の SD の読取り（D-111）とスキャンは変わらない。2 本を同時に差せないので、用意と入れ替えは「抜いてから差す」順にする（上の表、68 UI-11b-L3-8）。ほかの USB 機器（例: アプリの更新を運ぶ USB メモリ）を差す間は控え 1 を抜く。差し戻し忘れは 3 日でホームが知らせる（UI-00-D12）。常に差す機器が増えれば USB の hub が要る（D-114 の Revisit）。ノート PC を持ち帰る日（TD-009）は控え 1 も PC と一緒に動き、差したまま運ぶと口や媒体を傷めうる。

Plan Review は、この列が「正常な条件で目的を達成できるか」と「危険な結果を出さないか」を別々に答える（`docs/DEV_WORKFLOW.md` Review Rules）。

## owner の判断事項（決定済み、2026-10-08）

確認済み事実（repo 外の回答台帳）: PC の外の保存先は今使っていない（L-217）。外部に保存するなら置き場所は店（TD-011）。ノート PC を家へ持ち帰って作業する日がある（TD-009）。USB メモリは owner が持っていて渡せるが、店主が毎回手で取れるかは分からない（TD-187）。店主は 3 日程度前まで戻れれば許容（L-220）。毎営業日に店主が USB へ手で取る手順は owner が 2026-09-28 に「今は考えない」とした（TD-031）。決定済み: 外付けの保存先へ自動で書き、確かめて画面に出す（TD-190 の Q4）。

決定（owner 2026-10-08、repo 外の回答台帳 TD-196・TD-197）: 下の表の「決定」の列。アプリの設計（71 §71.11・§71.12、UI-11b-D14〜D16、UI-00-D12）はどの選択肢でも同じで、決定は運用の手順・残るリスク・D-114 の Status を決めた。選択肢・起草時の推奨・根拠は記録として残す。

| # | 判断事項 | 選択肢 | 起草時の推奨（区分） | 根拠 | 決定 |
|---|---|---|---|---|---|
| 1 | 運用の型 | A 差しっぱなし（1 本、毎日自動）／ B 週 1 回など店主が手で差す（1 本）／ C 2 本の入れ替え（1 本を差しっぱなし、1 本を owner が持ち帰り、訪問時に入れ替え）／ C' 2 本の入れ替え（外した 1 本を店の中の PC と別の場所に置く） | **C**（precondition-dependent: owner が店の外へ店のデータを持ち出すことを認め〈TD-011「置き場所は店」の見直し〉、持ち出した媒体を失くしたときの露出〈商品・原価・売上の記録。暗号化しない〉を受け、訪問の間隔が分かること）。前提が立たなければ **C'**（candidate）。A は C の最初の 1 本で、単独では推奨しない。B は推奨しない | 71 §71.11.6 の比較: A は盗難（差した媒体ごと持ち去られやすい）・火事・ランサムウェア（差している媒体も暗号化されうる）に弱い。B は店主の毎週の操作が要り（TD-187・TD-031）、PC の故障で最大 1 週間を失い許容の 3 日を超える。C は店主の手間なしで、毎日の故障は前日まで、盗難・火事・ランサムウェアは持ち帰りの 1 本で守る（失うのは最後の入れ替えからの日数）。C' は火事を守らない。ノート PC を家へ持ち帰る日（TD-009）、差してある 1 本は PC と一緒に動く（C でも持ち帰りの 1 本は owner の所にある） | **C**（TD-196）。前提の TD-011 の見直し（店のデータを店の外へ持ち出す）と、失くしたときの露出（暗号化しない）を受けた。実際に運用できるかは別との添え書きがある（Ordinary Operation の残るリスク） |
| 2 | D-111 の残りの判断 B（SD から読んだ原本の写し `pos-sources/` を backup・PC の外の控えに含めるか） | 含めない ／ PC の外の控えに folder ごと写す（足すだけの mirror） ／ backup の file にまとめる | **含めない**（candidate） | 取り込んだ内容は DB にあり、DB の控えで戻せる。原本は (b) の lane まで店が CV17 の取込みを続ける間（D-111 の運用の制約）、レジの SD の `XZ_BKUP` に同じ bytes が残り、SD は PC と別の機器（レジ）にある。写しの runtime（SD 直読みの runtime の lane）が未実装で量も未実測。見直し: CV17 の取込みをやめるとき（D-111 の (b) の lane）、写しの容量が分かったとき。レシート画像（`images/`、IO-06）も同じく今は含めない（71 §71.1）が、同じ時に見直す | **含めない**（TD-197）。D-111 に決着を追記した |
| 3 | 復元の予行演習の実施者と頻度 | 71 §71.13 の推奨どおり ／ 頻度を変える ／ 通しの演習をしない | **71 §71.13 の推奨どおり**（candidate）: 短い確かめは入れ替えのたび（A なら月 1 回）に owner、通しの演習は go-live の前と migration を含む更新の後に owner が別の PC で | 「控えがある」と「戻せる」を分ける（`docs/backlog.md` の同項）。店の PC で実際の復元をしない（店の記録を巻き戻さない）。別の PC に店のデータが残る間の扱いは owner の判断（71 §71.13） | **71 §71.13 のとおり**（TD-197） |

店主に聞く事項: 無い（台帳で確かめた: 戻れる許容〈L-220〉、手で取れるか〈TD-187〉、置き場所〈TD-011〉、PC を持ち帰ること〈TD-009〉は回答済み）。判断事項 1 は C で店主の手の操作を要しないので、店主が USB を差して抜けるか（open-questions の Q-017、保留〈TD-031〉）は聞かない。

owner に聞いた事実（判断ではない、2026-10-08 に 1 回で）: P5 バーコードリーダー・SD の読取り機と別に空いている USB の口は 1 つ（TD-198）。P6 訪問の間隔は決まっていない（TD-199）。帰結は Ordinary Operation の残るリスクと Contract Probe。

### runtime の置き場所（推奨）

- **後続の別の lane**（candidate）: 本 lane は docs の設計だけにし、runtime は本 lane の merge の後に 1 本の lane として起票する。理由: runtime は Rust（`mnt::offsite` の新設、`create_backup` の作業名、`inspect_backup`、4 command）・bindings・frontend（card・restore の確かめ・ホームの Alert・共通の確認の hook）にまたがる R4 で、実 USB の L3（68 §68.12 の UI-11b-L3-6〜9）が要り、本 lane の設計の review（R4 の Final Review 2 本）と分けた方が review の対象が小さい。判断事項 1〜3 の決定（2026-10-08）は runtime の code を変えない（判断事項 2 は「含めない」と決まったので runtime の Scope も増えない）。
- 同じ lane の後段にする案は採らない: plan-first（設計と packet を先に commit し、独立の Plan Review を通す）を runtime の Scope でもう一度回すことになり、本 lane の packet が設計と runtime の両方の AC を持って重くなる。

## Scope

本 lane は docs だけを変える（予定 file の全部。所有の列は並走 lane との重なり）。

| file | 変更 | 他 lane との重なり |
|---|---|---|
| `docs/function-design/71-mnt-backup.md` | §71.1 の module と写しの注記、§71.4 の手順 0・3・4a・4b とエラーハンドリング、MNT-01-D7・D10 の新設、§71.8 手順 3 の判定、§71.10 の D-114 の追加の表、§71.11（PC の外の控え、MNT-01-D8）・§71.12（`inspect_backup`、MNT-01-D9）・§71.13（復元の予行演習）の新設 | なし |
| `docs/function-design/68-ui-backup-restore.md` | 前文、UI-11b-F8〜F10、§68.3 の 4 command、§68.4 の PC の外の控えと復元の手順 1・1a・2、UI-11b-D14〜D16、§68.6、§68.7 の `offsite_preparing`・`restore_inspecting`・`restore_blocked` と `ready`・`restore_detail` の行、§68.9、§68.10、§68.11、§68.12 の UI-11b-L3-6〜9、§68.13 | なし |
| `docs/function-design/53-ui-home.md` | §53.1 の `OffsiteBackupWarning` の行、§53.5 の query 失敗の行と UI-00-D12、更新履歴 | なし |
| `docs/function-design/43-cmd-settings-log.md` | §43.8.2〜§43.8.5（4 command・エラーの写像・DTO の形）、§43.11 の登録の注記 | なし |
| `docs/function-design/22-mnt-migration.md` | MNT-03-D11 の「復元への波及」 | なし |
| `docs/architecture/cmd-task-specs.md` | CMD-11 の表に 4 行 | なし |
| `docs/architecture/mnt-task-specs.md` | MNT-01 に PC の外の控えの処理構造 | なし |
| `docs/SCREEN_DESIGN.md` | 1 日の動線のバックアップの文、ホーム画面の利用者配慮に 1 行、バックアップ・復元画面のレイアウト判断に 2 行 | なし |
| `docs/ARCHITECTURE.md` | MNT-01 の行 | なし |
| `docs/FUNCTION_DESIGN.md` | MNT-01 の索引の行 | なし |
| `docs/decision-log.md` | 末尾に D-114 だけを追記 | 全 lane が末尾に追記（`agent/plu-clear` = D-110、本 lane = D-114。ほかの 2 lane は依頼文が指定した番号）。merge 順で両方を残す |
| `docs/backlog.md` | 「backup に、PC の外のコピーと…」の entry に着手の sub-bullet、「保存と起動の守りの follow-up」の (2) に着手の注記 | 全 lane が自 lane の entry だけ |
| `docs/plans/2026-10-07-backup-offsite.md`、`docs/plans/test-matrices/2026-10-07-backup-offsite.md` | 新設 | なし |

触らない: `Plans.md`（D-097）、`docs/function-design/90-traceability.md`（生成物）、`docs/spec/requirements.md`・`requirements-coverage.md`（QR-04 / QR-05 / REQ-901 の行は変えない。D-114 は REQ-901 の範囲の中）、`docs/db-design/`（DB の schema・`app_settings` の key を変えない）、`docs/project-memory.md`（「PC の外の保存先は今使っていない」は事実のまま）。

### runtime の lane への申し送り（形が変わる型と、作る所・読む所）

本 lane は code を書かない。触る型・関数の作る所・読む所を `rg` で挙げる（2026-10-07、`95c0aeb0` の現物。行番号は定義・呼出しの行）。runtime の lane はこの一覧を Scope の出発点にし、起票時の現物で数え直す。

| 型・関数 | 変更 | 作る所 | 読む所・test |
|---|---|---|---|
| `create_backup`（作業名 → 確かめ → 正式名、MNT-01-D7、手順 0 の MNT-01-D10） | 中の処理だけ。signature と `BackupResult` は変えない | `src-tauri/src/mnt/backup.rs:218` | 呼出し: `cmd/settings_cmd.rs:192`、`mnt/backup.rs:377`・`:420`（`check_auto_backup` の中）。test: `mnt/backup.rs:666`・`:683`・`:722`・`:744`・`:960`・`:1018`・`:1217`、`cmd/settings_cmd.rs:560`・`:579` |
| `collect_today_backup_names` | 変えない（今も前方一致と `.db` の後方一致で、作業名を数えない） | `mnt/backup.rs:425`（判定は `:446`） | test: `mnt/backup.rs:1191` |
| `read_current_version_without_ddl` | private を `pub(crate)` にして `inspect_backup` と共有（MNT-01-D9、22 MNT-03-D11） | `src-tauri/src/db/migration.rs:91` | 呼出し: `migration.rs:171`（`migrate`）、新しい `inspect_backup` |
| `app_max_version` | 変えない | `db/migration.rs:79` | 新しい `inspect_backup` |
| 新 `inspect_backup` と `BackupInspection` | MNT-01-D9 | `mnt/backup.rs`（71 §71.12） | `create_backup` の手順 4a、新 command `inspect_backup` |
| 新 module `mnt::offsite`（`prepare_offsite_medium`・`check_offsite_backup`・`offsite_status`、型 71 §71.11.1） | MNT-01-D8 | `src-tauri/src/mnt/offsite.rs`、`mnt/mod.rs`（今は `pub mod backup` 等 4 つ） | `src-tauri/tests/design_compliance_test.rs:281` の `71-mnt-backup.md` の行に `mnt::offsite` を足す |
| レジの SD の root の判定（`CASIO\SR500_550_4000`） | MNT-01-D10 | SD 直読みの runtime の lane（IO-09、`io::register_sd`）と同じ定数・関数を使う。先に入る lane が置き、後の lane が使う（文字列を二重に持たない） | `create_backup` の手順 0、`mnt::offsite` |
| 新 command 4 つと request DTO 2 つ（`PrepareOffsiteMediumRequest`・`InspectBackupRequest`） | 43 §43.8.2〜§43.8.5 | `cmd/settings_cmd.rs`、`lib.rs` の `collect_commands!`（`:277`、restore は `:356`）と `generate_handler!`（`:1272`、restore は `:1352`） | `src/lib/bindings.ts`（再生成。今の backup 系は `:311`・`:317`・`:333`） |
| `useAutoBackupCheck` | `checkAutoBackup` の後に `checkOffsiteBackup`、mount 時に 1 回（UI-11b-D16） | `src/features/backup-restore/useAutoBackupCheck.ts:33` | mount: `src/components/layout/RootLayout.tsx:48`。test: `src/features/backup-restore/useAutoBackupCheck.test.tsx` |
| `BackupRestorePage` の復元の選択（`selected: BackupInfo \| null`） | 選んだ file（`BackupInfo` でない）も詳細に入る。確かめの結果を持つ（UI-11b-D15） | `src/features/backup-restore/BackupRestorePage.tsx:93`（型）・`:227`（`selectRestoreBackup`） | test: `BackupRestorePage.test.tsx`・`BackupRestorePage.flow.test.tsx` |
| ホームの知らせ | UI-00-D12 | 新 `src/features/home/components/OffsiteBackupWarning.tsx`、`src/features/home/HomePage.tsx`（前日未取込みの Alert は `:78`） | `HomePage.test.tsx`、`src/lib/query-keys.ts:116`（`backupRestore` の key に status を足す） |

## Non-scope

- runtime の code・test・fixture・bindings・`90-traceability.md`。
- クラウド・network（UNC）の保存先、写しの暗号化、媒体を登録から外す操作、持ち帰った媒体の古さの管理（D-114 の Revisit）。
- 更新・migration の前の保全（`docs/backlog.md` の同項の残り。MSI 配布手順と一緒に）。
- `pos-sources/`・`images/` を控えに含めること（判断事項 2 で含めないと決めた、TD-197。見直しは D-114 の Revisit）。
- `backup_path` に取外し可能な drive を選ばせない変更（MNT-01-D10 の棄却案。レジの SD の上だけを止める）。
- 既存の restore の契約（MNT-01-D1〜D6、UI-11b-D2〜D5・D11〜D13）の変更。

## Acceptance Criteria

baseline は本 worktree（起草の時点の HEAD は `95c0aeb0` の上の未 commit の編集）で逐語に実行した出力。2026-10-08 に owner の決定の反映の後（HEAD `3c2df223` の上の未 commit の編集）で全 AC を逐語に再実行し、値の変わった所を「2026-10-08 の再実行」として足した。「main の値」は同じ検索を `git show 95c0aeb0:<file> | rg …` で数えた値（出力なし = 0 件）。

- AC1（MNT-01 の決定がある）: `rg -n '^\*\*MNT-01-D(7|8|9|10):' docs/function-design/71-mnt-backup.md` が 4 行（D7・D10・D8・D9）。起草時の実測: `103:**MNT-01-D7: …`・`111:**MNT-01-D10: …`・`705:**MNT-01-D8: …`・`746:**MNT-01-D9: …` の 4 行。main の値 0。2026-10-08 の再実行: `103:`・`111:`・`706:`・`747:` の 4 行（§71.11.7 に 1 行足したため D8・D9 が 1 行ずれた）。
- AC2（画面とホームの決定がある）: `rg -n '^\| UI-11b-D1[456] \|' docs/function-design/68-ui-backup-restore.md` が 3 行、`rg -n '^#### PC の外の控えの知らせ（UI-00-D12' docs/function-design/53-ui-home.md` が 1 行。起草時の実測: 68 は `114:`・`115:`・`116:` の 3 行、53 は `213:#### PC の外の控えの知らせ（UI-00-D12、D-114）` の 1 行。2026-10-08 の再実行: 同じ。
- AC3（command がある）: `rg -n '^\| 43\.8\.[2-5] \|' docs/function-design/43-cmd-settings-log.md` が 4 行（`prepare_offsite_medium`・`check_offsite_backup`・`get_offsite_backup_status`・`inspect_backup`）。起草時の実測: `207:`〜`210:` の 4 行。2026-10-08 の再実行: 同じ。
- AC4（決定の記録）: `rg -n '^## D-114' docs/decision-log.md` が 1 行で、D-114 が owner の決定 1〜3・Guarantee range・Revisit を持つ。起草時の実測: `938:## D-114: …` の 1 行。2026-10-08 の再実行: `939:## D-114: …` の 1 行（D-111 に未決 B の決着を 1 行追記したため）。
- AC5（旧い記述・未決の書き方の live な残り 0）: `rg -c 'restore に版の事前検査は足さない（同じ判定の二重化）' docs -g '!docs/archive/**' -g '!docs/plans/2026-10-07-backup-offsite.md'`、`rg -c 'PC の外へのコピーを1日のどの時点で行うかは決めていない' docs -g '!docs/archive/**' -g '!docs/plans/2026-10-07-backup-offsite.md'`、`rg -c 'D-114 の owner の判断事項|owner の判断事項（未決|決まるまでは含めない|D-114 の判断事項' docs -g '!docs/archive/**' -g '!docs/plans/2026-10-07-backup-offsite.md'` の 3 つが出力なし（0 件、exit 1）。packet を除くのは、この AC の文自身が検索語を含むため（2026-10-07 の起草時の「出力なし」は packet 自身の 1 件を見落としていた。2026-10-08 に除外を足した）。2026-10-08 の再実行（plan-draft の commit の前の worktree）: 3 つとも出力なし・exit 1。main の値: 1 つ目は 22 に 1、2 つ目は SCREEN_DESIGN に 1。3 つ目は起票の commit（`3c2df223`）で SCREEN_DESIGN に 1・71 に 4・decision-log に 1（owner の判断を待つ書き方。2026-10-08 に決定の文へ直した）。新しい文は 22 の「restore の中に版の事前検査は足さない」と SCREEN_DESIGN の「PC の外の控えは、用意した USB メモリが差してある間に」で、それぞれ `rg -c` で 1 件。
- AC6（code を変えない）: `git diff --name-only 95c0aeb0 -- src src-tauri` が出力なし。起草時の実測: 出力なし。2026-10-08 の再実行: 出力なし。
- AC7（検査）: `bash scripts/doc-consistency-check.sh` と `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-07-backup-offsite.md` が ERROR 0（WARN は報告）。

## Design Readiness

- 引用する設計正本（節まで）: `docs/function-design/71-mnt-backup.md` §71.1・§71.4（MNT-01-D7・D10）・§71.8 手順 3・§71.10・§71.11（MNT-01-D8）・§71.12（MNT-01-D9）・§71.13／`68-ui-backup-restore.md` UI-11b-F8〜F10・D14〜D16・§68.4・§68.7・§68.9〜§68.13／`53-ui-home.md` §53.5 UI-00-D12／`43-cmd-settings-log.md` §43.8.2〜§43.8.5／`22-mnt-migration.md` MNT-03-D11／`docs/decision-log.md` D-114・D-111（未決 B・IO-09-D3 の SD に書かない）・D-032（復元前の強制バックアップ、変えない）。
- 必要な設計成果物: function-design（MNT-01・CMD-11・UI-11b・UI-00） = updated in this PR／DB = existing sufficient（schema・`app_settings` を変えない。状態は DB の外の file、71 §71.11.1）／SCREEN_DESIGN = updated in this PR／decision-log = D-114 を追加／Boundary / Wire Contract = 下に記入。
- plan にしかない durable な判断の昇格先: すべて D-114 と上の正本へ置いた。owner の決定 1〜3 は D-114 の「owner の決定」に書き、D-111 の未決 B の決着は D-111 に追記した。runtime の置き場所の推奨だけは packet にあり、runtime の起票時に Coordinator が使う（durable な製品の判断ではない）。
- 前提・制約と、延期した design gap: Windows の drive の種類の判定（P1）・空の読取り機の扱い（P3）は runtime の lane の L3 の前に確かめる。読み戻しの照合は file cache を通りうる（P2、保証の範囲を狭めて書いた）。延期: 更新・migration の前の保全、媒体の登録の解除、持ち帰った媒体の古さ、暗号化（Non-scope、D-114 の Revisit）。延期が安全な理由: どれも今の backup と復元の振舞いを変えず、PC の外の控えが無い今より悪くしない。
- 絶対保証の自己点検: 「レジの SD に書かない」の例外: SD が取外し可能な drive でなく固定 disk に見える読取り機でも、root の `CASIO\SR500_550_4000` の判定（MNT-01-D10）は drive の種類に依らず効く。`backup_path` に SD の上の folder を選んだ既存の設定は `create_backup` の手順 0 が止める（自動 backup は失敗し、既存の失敗の toast が出る）。「用意した媒体にしか書かない」の例外: 同じ目印を別の媒体へ手で写した場合（利用者の手の操作。同じ `medium_id` の 2 本になり、どちらにも写る。害は札が同じになることだけ）。「作成途中を成功に数えない」: 正式名は確かめの後の rename でしか作らない。例外は MNT-01-D6 の metadata の失敗で、正式名の file は検査済み。「黙って写さなくならない」の例外: 状態の file が消えた（利用者が消した・PC を替えた）とき、`NotPrepared` になり知らせない（用意の前と区別できない）。媒体を登録から外す操作の代わりがこれで、PC を替えたときは本番の復元の手順の最後で用意し直す（71 §71.13）。
- 判定: ready（plan-draft、2026-10-08）。owner の判断事項 1〜3 は決定し、設計正本・D-114・D-111 に反映した。持ち帰りの 1 本の古さをアプリで扱うことは延期した設計の範囲（D-114 の Revisit、上の延期）で、今の設計はそれを持たないと明記してある。扱うかは owner に諮る提案として Coordinator が持つ（採れば design へ戻る）。

## Registration / Generation Obligations

本 lane（docs だけ）は該当なし（function-design の新しい file・REQ の増減・route・画面の新設をしない）。runtime の lane の義務: 新しい 4 command に `#[tauri::command]` + `#[specta::specta]` を付け、`lib.rs` の `collect_commands!` と `generate_handler!` の両方に登録する（`scripts/check-command-drift.sh` が 4 つの集合の一致を見る）、`cd src-tauri && cargo run --bin generate_bindings`、`src-tauri/tests/design_compliance_test.rs` の `build_doc_to_modules_map()` の `71-mnt-backup.md` の行（`:281`）に `mnt::offsite` を足す、test に REQ-901 と決定 ID を付けて `cargo run --bin generate_traceability`（REQ-901 の coverage は既に required、`docs/spec/requirements.md:38`）。画面の新設は無い（既存の `/settings/backup` とホームの中）。

## Impact Review Lenses

| Lens | Question to answer | Evidence home | Applicability / finding | Follow-up artifact |
|---|---|---|---|---|
| Adapter / core boundary | Which concepts belong to replaceable external adapters, and which concepts are stable app-core contracts? | Architecture, function design, decision-log, Plan Packet | 媒体の発見（Windows の drive の列挙）とレジの SD の判定は OS・機種に依る部分で、`mnt::offsite` の中の小さな関数に閉じる。core は「確かめてから正式名」「目印で見分ける」「状態は DB の外」「3 日で知らせる」 | レジの機種が変わったら MNT-01-D10 の folder を IO-09 と一緒に替える |
| Fact check / design decision split | Which claims are observed facts from hardware/tool/files, and which are app decisions that need source-doc promotion? | Investigation doc, source design docs, decision-log | 事実: 店の回答（L-217・L-220・TD-009・TD-011・TD-187・TD-190）、今の実装（`VACUUM INTO` が正式名へ直接書く、`backup.rs:218` 以降）。未確認の外部前提: P1〜P4（Contract Probe）。判断: D-114・MNT-01-D7〜D10・UI-11b-D14〜D16・UI-00-D12 | Contract Probe |
| Lifecycle / retry | What happens before, during, after, and after failure for import/export, duplicate input, rollback, retry, cancellation, and re-run? | Function design, DB design, UI design, Test Matrix | 作成の途中の失敗は作業名だけが残り次回に消える。写しの途中の抜去は作業名が媒体に残り、次の写しで消える。照合の不一致は作業名を消して `last_failure`。媒体の入れ替えは目印で追う。復元は status の file を変えない。用意の再実行は同じ `medium_id` を使う | Matrix の State Lifecycle |
| Operator workflow | What does the operator do in the real sequence across app, external tool, media, print/export, backup, and recovery? | Screen/UI design, function design, Plan Packet manual checks | 店主の操作は無し（差しっぱなしの 1 本を抜かない）。owner が用意・入れ替え・短い確かめ・通しの演習・本番の復元を行う（Ordinary Operation、71 §71.13） | runtime の lane の L3（UI-11b-L3-6〜9） |
| Replacement path | If the external system changes, which files/modules/docs are replaced and which app-core contracts remain stable? | Architecture, function design, decision-log | 保存先を USB の HDD・network に広げるときは §71.11.3 の発見だけを替え、写し・照合・状態・知らせは残る | D-114 の Revisit |
| Data safety / evidence | How can the claim be supported by anonymized shape/count/hash/procedure evidence without committing real store data? | Plan Packet Data Safety, investigation doc, review evidence | 媒体には店の DB の控えが入る（暗号化しない）。持ち出す（判断事項 1 = C、owner が露出を受けた、TD-196）。repo には実データ・backup file・媒体の中身を置かない | Data Safety |
| Reporting / accounting semantics | Are totals, summaries, item records, returns, corrections, and inventory movements modeled separately enough to avoid false business meaning? | DB design, function design, report design, Test Matrix | not applicable: 業務の数値・集計を変えない（`inspect_backup` の商品の数・最後の記録は控えの確かめの表示だけ） | — |
| Manual verification | Which assertions cannot be proven by automated tests and require Windows native L3, external tool import, or real-device confirmation? | Plan Packet, Test Matrix, PR body | 実 USB の drive の種類の判定・用意・写し・入れ替えで drive 文字が変わっても見つかること・レジの SD の拒否・媒体から読む確かめ（68 §68.12 の UI-11b-L3-6〜9）。3 日の知らせと新しすぎる版の控えは L3 Eligibility の条件 (3) に当たるので自動 test | runtime の lane の Human Gate に manual |
| 環境・再現性 | 新設の環境依存（toolchain / CI runner / OS 差異等）を repo-pinned config で強制するか、明示的に defer するか | repo-pinned config, Plan Packet | drive の列挙は Windows だけ（既存の `windows-sys` の feature `Win32_Storage_FileSystem`、`src-tauri/Cargo.toml:48`。`GetLogicalDrives`・`GetDriveTypeW` が同じ feature に入るかは runtime の lane が確かめる）。Windows 以外は空の列で、test は root の列を受ける内部関数に一時 directory を渡す（71 §71.11.3）。SHA-256 は既存の `sha2`（`Cargo.toml:33`）、id は既存の `uuid`（`:37`）。新しい依存を足さない | runtime の lane |

## Boundary / Wire Contract

- producer: MNT-01（71 §71.11・§71.12）、CMD-11（43 §43.8.2〜§43.8.5）
- consumer: UI-11b（`getOffsiteBackupStatus`・`prepareOffsiteMedium`・`checkOffsiteBackup`・`inspectBackup`）、UI-00（`getOffsiteBackupStatus`）
- wire type: `PrepareOffsiteMediumRequest { selected_path: String }`、`InspectBackupRequest { backup_path: String }`、`OffsiteMediumView { label, drive_root, newest_copy? }`、`OffsiteCheckResult`（`kind` の tagged enum 5 値）、`OffsiteBackupStatus { prepared, last_success_at?, last_success_label?, days_since_last_success?, stale, attached[], last_failure_kind? }`、`OffsiteFailureKind`（6 値、snake_case）、`BackupInspection { file_name, created_at?, size_bytes, schema_version, app_max_version, newer_than_app, quick_check_ok, product_count?, last_operation_at? }`。error は既存の `CmdError`（kind `validation` / `internal` だけ、`CmdErrorKind` に値を足さない）
- internal type: `OffsiteMediumMarker`（媒体の `InventoryBackup\offsite-medium.json`）と `OffsiteState`（`{app_data_dir}\offsite-backup.json`）。どちらも `format: 1` の JSON で wire に出さない
- precision/range: 日時は `YYYY-MM-DD HH:MM:SS`（ローカル時刻）の文字列。`days_since_last_success`・`product_count`・版は i64 だが値は小さく、JS の安全な整数の範囲に収まる。SHA-256 は 64 桁の小文字 hex（状態の file だけ）
- round-trip path: 用意（目印・状態を書く）→ 確認（目印を読み、写し、状態を書く）→ status（状態と見えている媒体を読む）→ 画面・ホーム。復元: 一覧の行 / 選んだ file の path → `inspectBackup` → 既存の `restoreBackup({ backup_path })`
- invalid input: 空の `selected_path` / `backup_path` は `validation`。取外し可能でない drive・レジの SD は `validation`（固定の文、43 の表）。`medium_id` か `label` の読めない目印は作り直す（写しは消さない）。形の違う状態の file は `StateUnreadable`（上書きしない）
- compatibility: 既存の command・DTO・`CmdErrorKind`・`app_settings`・DB の schema は変えない。新しい版のアプリの file を古い版が上書きしない: 目印は `medium_id` と `label` が読めれば `format` を問わず読むだけで書き換えず、状態の file は `format` が 1 でなければ `StateUnreadable` で止まる（71 §71.11.1・§71.11.2 手順 4）

## Test Plan

Test Design Matrix: [2026-10-07-backup-offsite](test-matrices/2026-10-07-backup-offsite.md)（runtime の lane が実装する test の設計。本 lane は docs の検査だけ）。

- targeted tests: 本 lane は `bash scripts/doc-consistency-check.sh --target plan docs/plans/2026-10-07-backup-offsite.md` と full。
- negative tests: Matrix の Negative Paths（runtime）。
- compatibility checks: 既存の restore の契約と backup 系の command の wire（Matrix）。
- data safety checks: 本 lane の差分に実データ（店の DB・backup file・媒体の中身・実 JAN・商品名・金額）を入れない。
- main wiring/integration checks: runtime の lane（共通の確認の hook から `checkOffsiteBackup` まで、ホームの query まで）。

## Review Focus

- Ordinary Operation の列が、正常な条件で目的（店主の手間なしに PC の外の控えが毎日取れ、取れない日が続けば知らされ、PC を失っても戻せる）を達成できるか。
- レジの SD・目印の無い媒体・別の PC で用意した媒体・`InventoryBackup\` の外に書く経路が無いか（MNT-01-D8・D10、71 §71.11.3）。
- 作成途中・照合の失敗・抜去の途中の file が、PC の中でも媒体の上でも成功の控えと数えられないか（MNT-01-D7、71 §71.11.4）。
- 状態を DB の外に置いたことで、復元・状態の file の破損・PC の入れ替えのどれでも「黙って写さなくなる」経路が残らないか（71 §71.11.5・§71.11.7、Design Readiness の絶対保証の自己点検）。
- 復元の前の確かめ（MNT-01-D9）が、restore の契約（MNT-01-D1〜D6、`CmdErrorKind` の 3 値、UI-11b-D2〜D5）を変えずに新しすぎる版の文言を出せるか。MNT-03-D11 の改めた文と矛盾しないか。
- 目印と状態の file の版の扱い（71 §71.11.1・§71.11.2 手順 4）で、新しい版のアプリが置いた file を古い版が上書き・削除する経路が無いか。
- 運用の型の比較（71 §71.11.6）が、盗難・火事・ランサムウェア・PC の持ち帰り（TD-009）で正しいか。採った C の前提（TD-011 の見直し・露出の受容）と、訪問の間隔が決まっていないこと（TD-199）・空きの USB の口が 1 つ（TD-198）の帰結が、Ordinary Operation の残るリスクと 71 §71.11.6・§71.11.7 に漏れなく書かれているか。

## Contract Ledger

| 契約 ID | 設計正本の節 | 実装（Scope） | 自動 test | L3 / 非対象 |
|---|---|---|---|---|
| D-114 | `docs/decision-log.md` D-114 | 本 lane は設計の記録。runtime は後続 | runtime（Matrix） | — |
| MNT-01-D7 | 71 §71.4 手順 3・4・4a・4b、エラーハンドリング、§71.8 手順 3 | runtime: `mnt/backup.rs` の `create_backup` | Matrix の MNT-01-D7 の行 | L3: UI-11b-L3-6（`.partial` が残らない） |
| MNT-01-D8 | 71 §71.11.1〜§71.11.7 | runtime: `mnt/offsite.rs` | Matrix | L3: UI-11b-L3-6・L3-8 |
| MNT-01-D9 | 71 §71.12、22 MNT-03-D11 | runtime: `mnt/backup.rs` の `inspect_backup`、`db/migration.rs` の共有 | Matrix | L3: UI-11b-L3-9 |
| MNT-01-D10 | 71 §71.4 手順 0、§71.11.2 手順 3、§71.11.3 | runtime: `mnt/backup.rs`・`mnt/offsite.rs` | Matrix | L3: UI-11b-L3-7 |
| CMD 43.8.2〜43.8.5 | 43 §43.8.2〜§43.8.5（エラーの写像・DTO・lock を放す時点） | runtime: `cmd/settings_cmd.rs`・`lib.rs` | Matrix | 非対象 |
| UI-11b-F8・D14 | 68 §68.2・§68.4・§68.5・§68.9・§68.11 | runtime: `features/backup-restore`（`OffsiteBackupPanel`） | Matrix | L3: UI-11b-L3-6・L3-8、目視の確認 |
| UI-11b-F9・D15 | 68 §68.4 手順 1・1a・2、§68.5、§68.7 | runtime: `BackupRestorePage` | Matrix | L3: UI-11b-L3-9 |
| UI-11b-F10・D16 | 68 §68.5、§68.10 | runtime: `useAutoBackupCheck` | Matrix | 非対象 |
| UI-00-D12 | 53 §53.5 | runtime: `features/home` | Matrix | 目視の確認（3 日の状態は fixture、L3 Eligibility の条件 (3) により自動 test） |
| MNT-03-D11（改めた文） | 22 §3.2 の MNT-03-D11「復元への波及」 | 版の判定の関数を共有するだけ。restore の中は変えない | 既存の MNT-03-D11 の test（runtime が回帰で回す） | 非対象 |
| 隣接の除外: MNT-01-D1〜D6、UI-11b-D2〜D5・D11〜D13、D-032 | 71 §71.4〜§71.8、68 §68.5 | 変えない（確かめは restore の前に足すだけ。共通の確認の停止・世代番号を共有する） | 既存の test（runtime が回帰で回す） | 非対象 |
| 隣接の除外: UI-11b-D8（`backup_path` は picker だけ） | 68 §68.5 | 変えない（取外し可能な drive を選ばせない変更は Non-scope） | 既存 | 非対象 |
| 隣接の除外: D-111 の (8)・残りの判断 A・B、IO-09-D3 | D-111、29 §29.7.6 | 変えない。残りの判断 B は判断事項 2 で「含めない」と決め、D-111 に決着を追記した（TD-197）。A は変えない。MNT-01-D10 は IO-09-D3 と同じ folder で SD を見分ける | — | 非対象 |

## Contract Probe

- P1 店で使う USB メモリが、Windows の `GetDriveTypeW` で `DRIVE_REMOVABLE` に見える: **未確認**（設計の前提。外れると用意が `NotRemovable` で拒まれる）。確かめ（runtime の lane の L3 の前）: owner の USB メモリを店の PC か owner の PC に差し、Windows の「取り外し可能なディスク」と出るか（エクスプローラーの種類の表示）を見る。外れたら USB の HDD と同じく D-114 の Revisit（固定 disk を許す条件の設計）へ戻す。
- P2 写した直後の読み戻しが Windows の file cache から返るか: **probe しない**（設計は保証の範囲を「OS が返す bytes の一致」に狭めて書き〈71 §71.11.7〉、媒体の記憶素子の故障は差し直した後の短い確かめ〈§71.13〉が受け持つ）。
- P3 媒体の入っていない読取り機（SD の読取り機の空の口）の root を見ても、Windows がエラーの dialog を出さない: **未確認**。確かめ（runtime の lane）: 空の読取り機を挿したまま status を読む。dialog が出るなら `SetErrorMode(SEM_FAILCRITICALERRORS)` 等で抑える設計を runtime の lane が足す（Windows の公式資料で確かめる）。
- P4 SQLite の `immutable=1` の読取り専用の open が file と folder に何も書かない: SQLite の公式資料（URI の `immutable` の項: 読取り専用で開き、lock と変更の検出をしない）に依る。runtime の lane の test が前後の hash と folder の一覧で実測する（Matrix の MNT-01-D9 の行）。
- P5 店の PC に、バーコードリーダー・SD の読取り機と別に USB の口が空いている: **観測（owner 回答 2026-10-08、repo 外の回答台帳 TD-198）**: 空きは 1 つ。差しっぱなしの控え 1 がその口を占めるので、2 本を同時に差さず、用意と入れ替えは抜いてから差す。SD の読取り機は自分の口のままで、毎日の SD の読取りは変わらない。扱いは Ordinary Operation の残るリスク、68 UI-11b-L3-8。
- P6 owner の訪問の間隔: **観測（owner 回答 2026-10-08、TD-199）**: 決まった間隔は無い。持ち帰りの 1 本が守る範囲（盗難・火事で失う日数）は最後の入れ替えからの日数で、上限が無い（Ordinary Operation の残るリスク、71 §71.11.6・§71.11.7、D-114 の Guarantee range）。
- 観測済みで probe の要らない前提: `sha2`・`uuid`・`windows-sys` の `Win32_Storage_FileSystem` は既存の依存（`src-tauri/Cargo.toml:33`・`:37`・`:48`）。今の `create_backup` は `VACUUM INTO` で正式名へ直接書く（71 §71.4 の旧い手順 3・4、`mnt/backup.rs:218` 以降）。今日の backup の判定は前方一致と `.db` の後方一致（`mnt/backup.rs:446`）。新しすぎる版の backup の復元は差し替えの後の open で拒否され `restore_failed_recovered` の固定の文になる（22 MNT-03-D11、`src/features/backup-restore/BackupRestorePage.tsx:305`）。

## Data Safety

- tracked に書かない: 店の DB・backup file・媒体の中身・状態の file の中身、実 JAN・商品名・金額、店主の発言の原文、repo 外の回答台帳の細部（TD・L の番号と要旨だけを書いた）。
- local-only: repo 外の回答台帳（TD-009・TD-011・TD-031・TD-187・TD-190・TD-196〜TD-199、L-217・L-220）。owner の USB メモリと、通しの演習で別の PC に戻した店のデータ（演習の後に消す、71 §71.13）。
- synthetic-only: runtime の lane の test は一時 directory に合成の DB の控え・目印・状態の file・`CASIO\SR500_550_4000` の folder を作る。L3 は試しの DB で行い、レジの SD の拒否は試しの媒体に同じ folder を置いても確かめられる（68 UI-11b-L3-7）。
- 媒体の露出: 控えは暗号化しない。C で媒体を店の外へ持ち出すので、失くしたときに店の記録が読める。owner はこの露出を受けた（判断事項 1、TD-196）。

## Implementation Results

Fill after implementation.

## Review Response

Fill after review.
