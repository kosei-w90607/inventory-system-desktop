# Plan Packet: ㉗ 時点証拠 ADR の改訂（OS 監視と legacy 専用復旧の撤去、判定不能の一本化、design-only、R3）

2026-09-23 起票。出典は owner 決定 2026-09-23（店主・owner の回答台帳 `.local/reports/store-premises/answer-ledger.md` の L-107 / L-108、同日の TD-005 / TD-006 / TD-007）、owner 回答 2026-09-24（台帳 追補3 `ledger-parts/today-2026-09-24.md` の TD-024 / TD-025）と、2026-09-23 の ㉗ ADR の独立レビュー（Fable 5.1 と Opus 5.5 の fresh subagent に同じ依頼文、その統合候補を blind の fresh Opus で裏取り。原文は session 535b4afb の subagent 記録で、repository には置かない）。判定は 3 本とも「修正してから ㉘ へ進める」。

対象は [時点証拠 ADR](../adr/2026-09-18-stocktake-time-evidence.md)（SPEC-STK-TIME-D1〜D9）と、その同期先の「時点証拠契約（proposed・未実装）」節。runtime code は変えない。後続の runtime lane ㉘ はこの改訂後の ADR を入力にする。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Evidence Mode: github
- Phase: plan-gate
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: pending
- Amendments: none
- Coordinator: Opus 5.5（Claude Code main session、effort high）
- Writer: Opus 5.5 subagent（worktree run、effort medium。Coordinator とも Plan Reviewer とも別 context）
- Plan Reviewer: Opus 5.5（fork でない fresh subagent、effort medium。Codex は rate limit 中のため Plan Review には入れない）
- Final Reviewer: Opus 5.5（fresh context）+ Codex（互いに独立、Double Audit。Codex は rate limit 中で pending、Final Review の通過は Codex の復帰を待つ）
- Final Review Minimum: 2
- Human Gate: ready,merge

manual なし: 製品 runtime・画面・配布物への変化がない設計文書と合成モデルの変更で、Windows native の確認対象がない。

座組の根拠と現行規則との衝突（記録）:

- 座組は owner 決定 2026-09-23（Opus = Opus 5.5 を Writer / Coordinator / レビューへ全面解禁、Sonnet 5 / Opus 5 は座組から退役、Fable 5.1 は難所の相談役、Codex 停止中は Final Review だけ待つ）に従う。
- 現行の tracked 規則 `docs/AGENT_OPERATING_MANUAL.md` §3（D-056、高自律・低制約適性 slot = Opus は read-only の Reviewer / Explorer 専任で Writer / Coordinator に割り当てない）と §3.4 の表（Opus = Claude Opus 5）はこの座組と衝突する。owner 決定は D-056 を Opus 5 向けの判断とし、Opus 5.5 には引き継がないとした。規則文書の改訂は並行する docs 復元 + 規則改訂 lane が行う。本 packet はその改訂を先取りして規則文書を編集しない。
- Execution Mode は現行 enum から `fable-window` を選ぶ（Fable 5.1 が利用可能な期間の可用性ラベル）。Fable は本 change の役割に割り当てない。Execution Mode の enum 自体の廃止方向（owner 同意 2026-09-23）は同じ規則改訂 lane の対象。
- Plan Reviewer と Writer は同じ model（Opus 5.5）の別 context。`docs/DEV_WORKFLOW.md` Review Rules の vendor 条項（D-062）は Writer が Codex の packet が対象で、本 packet には literal に掛からない。PR #88 の dogfood 所見（計画と実装を同じ vendor が見て前提の誤りが Plan Gate を通過した）の残余は、Final Review の Codex が別 vendor の目として担う。
- Codex が Final Review 時点でも復帰しない場合は `docs/AGENT_OPERATING_MANUAL.md` §3.3 Capacity-degraded に従い、Final Review 通過を止めて待つ（owner 決定「最終レビューだけ Codex を待つ」と同じ）。

遷移記録（append-only）:

- kickoff → spec-check → design → plan-draft → plan-gate（本 commit、plan-first）: 設計の決定は owner 2026-09-23 で確定している（判定不能の一本化、OS 監視と legacy 専用復旧の撤去、運用で解決しない、PC 時計による比較を捨てる）。その具体化を本 packet の Spec Contract に置き、source 文書への反映は plan-approved 後の Writer run が行う。Risk は `docs/project-profile.md` High-risk Changes の「stocktake / csv_imports の意味」「Z004 取込みの重複・取消の振舞い」「BIZ service の振舞い」「Tauri command の引数・返り値」に当たる契約を変えるため R3（file の種類は docs と合成モデルだけ）。merge 可否に効く test / workflow gate は変えない。起票中に owner へ 2 問を確認し、2026-09-24 の回答（TD-024 = 要再確認は計数後に売れた商品だけに付け、売上と返品の相殺には対策を講じる / TD-025 = 「今から数える」を押してから棚へ行く流れは成り立つ）を Spec Contract R3 / R8 / R9 に反映した。

## Owner Effort Budget

- 介入回数上限: 4（内訳の見込み: 起票中の owner 確認 1〈2026-09-24 に消費済み、TD-024 / TD-025〉、Codex の Final Review relay 1、Ready 1、merge 1。既定 3 から 1 増やす理由 = owner にしか答えられない店の運用と受容 risk の確認を 1 回含むため）
- 実働時間上限: 20分（文書の変更で、owner の作業は回答・relay・Ready / merge の判断に限られる見込み。未実測）
- relay 往復上限: 2
- Plan Review round 天井: 3（既定 3）

既定値と超過時の Coordinator 責務は `docs/DEV_WORKFLOW.md` `Owner Effort Budget` 参照。
承認依頼フォーマット: `この change での介入 N 回目 / 予算 M 回` + `承認すると利用者から見て何が完了するか1文`。

## Consultation Relay

- Review Order Artifact: none
- Review Order Ref: none

## Risk

Risk: R3

Reason:
diff は設計文書と合成モデル（`scripts/probes/stocktake_time_model.py`）だけだが、定める契約は棚卸しの保存・取込みの分類と保留・取消・DB の列と表・Tauri command の DTO と error code に及ぶ（`docs/project-profile.md` High-risk Changes の R3 例に当たる）。Risk は file の種類ではなく影響で決める。データの削除・不可逆操作・実データへの接触はないので R4 ではない。merge gate・CI・checker は変えない。操作者から見える状態の遷移（要再確認・保留・取消の保留）を変えるため、Contract Audit を独立 2 本で行う（`docs/DEV_WORKFLOW.md` Contract Audit の推奨の 2 本目を採る）。

## Goal

Goal Invariant: owner 決定 2026-09-23 のとおり、㉘ が実装する時点証拠の契約から OS 監視・PC 時計による比較・legacy 専用の復旧を外し、判定不能を「通常適用 + 商品 × 資料の要再確認を DB に残す」に一本化する（共有 JAN の行は保留を維持）。在庫が現物へ収束する性質と、実測より後の記録済み入出庫を消さない性質は変えない。

### 最小完了条件

- ADR と同期先の各 source が、改訂後の契約を肯定形の本文で持ち、「適用範囲の但し書き」で本文から差し引いて読ませる箇所が残らない。㉘ の実装者が ADR の「㉘ への引継ぎ」節と各 source の「時点証拠契約」節だけから、作るもの・作らないものを判断できる。
- 撤去した概念（OS 監視、PC 時計 epoch、POS 時刻基準、legacy 専用復旧）の語が、AC2 の検索で live な正本に残らない。
- 判定不能の一本化で、実測前販売・実測後販売・数え直し前後の取消の各場合に在庫が現物へ収束することを、合成モデルの assert で確かめる（AC5）。
- 「この文書を完了できる」と「通常運用を達成できる」を分けて書く。本 lane の完了は、日次の自動在庫連動の達成ではない（Ordinary Operation 参照）。

### 失敗定義

- 撤去した概念が ㉘ の実装契約として source に残る、または但し書きで差し引く形が残る。
- 一本化の結果、在庫が現物へ収束しない場合が生じる、進行中の棚卸しの確定が未解消の要再確認を素通りする、共有 JAN 行の保留が消える。
- owner が決めていない変更を持ち込む（TD-024 を超える要再確認の条件の変更、明示の「今から数える」の廃止、精算同一性 guard の比較方法の変更、非連動化の記録の撤去）。
- EJ の完全性契約（D5）と EJ parser lane の入力契約（32 の外部 probe 表の EJ 行）を失う。
- runtime code・bindings・traceability を変える。日次の自動在庫連動が解決したと書く。

### 非目的

- 「数えた後」の判定（番号印字 + EJ による取引単位の前後判定）。次の design lane「実測と POS 系列の対応を取得・保存する」（[backlog](../backlog.md#やると決めたもの順番未定)）の対象で、番号印字は実機未検証の候補。
- 精算同一性 guard の再設計（byte hash か正規化した内容か、preview 時点の受領で衝突させるか）とレジ入替・番号 reset の系列の扱い。次の design lane の (a) に含まれる。
- 明示の「今から数える」を商品選択時の暗黙開始へ畳む案（Opus / Fable レビューの単純化の提案、owner 未判断）。
- `project-memory.md` の :40 / :190 以外の編集、`decision-log.md` への新 D（本改訂の durable な決定の置き場は ADR。Spec Contract R8 参照）。
- 運用の約束で安全を担保する案（owner 決定 TD-007）。

Priority: `Goal Invariant > Acceptance Criteria > supporting evidence`。AC や証跡作業が Goal Invariant を前進させない場合は、Goal を置き換えず簡略化・defer・削除する。

## Ordinary Operation

改訂後の ADR で ㉘ が実装した状態を前提にした、棚卸し期間と確定後の普通の日。店の事実は回答台帳の番号で示す。

| 初期状態 | 操作 | 利用者が得る結果 | 次へ進む条件 | 未確認の前提／probe参照 |
| --- | --- | --- | --- | --- |
| 年末の棚卸しを開始済み。ノート PC は机の上（L-076） | 商品をスキャンして選び「今から数える」→ 棚へ行って数える → 机へ戻り数を入れて「数を保存」 | その商品の実測（N、保存時の帳簿 L、開始時の受領上限）が即保存される | 次の商品へ | 「開始してから数える」は外部前提のまま（ADR D1）。今の Excel の運用は棚で数えてから机で入力する往復（L-076）だが、owner はアプリでは押してから棚へ行く流れが成り立つと判断した（TD-025） |
| 計数の途中 | 接客で離れる、蓋を閉じる、家へ持ち帰って後で続ける（L-297、TD-015） | 未保存の 1 商品だけが残る。sleep や OS の時刻変更では失効しない。保存時に商品の版・所有者を再検査し、その間に在庫が動いていれば「もう一度数えてください」 | 保存するか、数え直す | アプリを終了・再起動した場合は未保存の token を失い、その商品を数え直す |
| 営業中 | 数え終えた商品がレジで売れる | アプリの操作なし | 閉店前のレジ締め | — |
| レジ締め後、店を離れる前（L-048、L-298） | SD → CV17 → アプリで Z004 を選んで取込み（EJ の日次取込みが入っていれば同じ締めで EJ も取り込む、TD-014） | 売上が記録され、在庫が通常どおり減る。数えた後の資料で数量が 0 でない商品に要再確認が付く。数量 0 の行は、同じ精算の EJ に当該商品の行（販売・戻・訂正・取消）があれば要再確認、行がなければ何も付かない。EJ がない・不完全・商品を特定できない場合は「相殺の確認待ち」になり、EJ が届くか数え直すまで確定を止める（R9） | 翌日以降に要再確認の対象を数え直す | 実測前後の販売を分ける手段は ㉘ にない（次の design lane）。EJ の戻・訂正・取消の行と精算区間の対応は実機で確かめる外部前提（R9） |
| 翌日 | 要再確認・確認待ちの商品を数え直して保存 | その資料の要再確認・確認待ちが解消する。確認待ちは後から完全な EJ を取り込んでも解消する | 当日の取込みで、数えた後に売れた商品に再び要再確認が付き得る | 同上 |
| 複数日の棚卸し（TD-024）。例: 1 日目に PLU 商品 A・B を数える。2 日目に C を数え、A が 1 個売れ、B は同じ日に 1 個売れて返品される。3 日目に A・B を数え直す | 各日の締め後に Z004 と EJ を取込み | 1 日目: A・B は数量 0 で EJ に行がないので何も付かない。2 日目: A は数量 -1 で要再確認（通常適用で在庫が 1 減る）。B は数量 0 だが EJ に販売と戻の行があるので要再確認（計数の前に売れて後に返品された場合、帳簿が現物より 1 少なくなり得る）。C は何も付かない。3 日目: A・B の数え直しで要再確認が解消する。EJ を取り込めなかった日は、その日の資料で数量 0 の数えた商品が確認待ちになり、後から EJ を取り込めば行のない商品の確認待ちは自動で解消する | 確定の前に、未解消の要再確認と確認待ちを数え直しか EJ の取込みで解消する | 数え直しは計数後に売れた（または同じ日に売れて戻った）商品だけ。EJ の日次取込みが ㉘ に無い間は、数量 0 の行は全て確認待ちになり、旧来の負担（数えた PLU 商品を全て数え直す）が残る。規模は未実測 |
| 最終日 | 未解消の要再確認・確認待ちを解消してから「確定」 | 補正後の現在庫で評価額が出る。未解消があれば確定できず、対象の計数か EJ の取込みへ案内される | 確定 | 最終日の取込みで計数後に売れた商品を数え直す負担が残る |
| 確定後の普通の日 | 取込み | 売上・在庫は通常どおり適用される。確定済みの棚卸しで数えた商品は商品単位の要再確認として準備表示に出る（取込みは止まらない） | 独立再実測で解消 | 同上 |
| 同じ JAN を持つ在庫連動商品の行を含む取込み | 取込み | file 全体が保留になり、候補商品の計数へ案内される | 全候補を数えて同じ file を選び直す | 本番前の設定検査で、曖昧な JAN の在庫連動は有効化できない（ADR D4） |

この表のとおり、改訂後の ADR を実装しても日次の自動在庫連動（v1.0 の必須、D-070）は達成しない。数えた PLU 商品は資料ごとに要再確認になり、数え直しの循環は次の design lane まで残る。本 lane が完了させるのは、その土台になる契約から不要な機構を外し、判定不能の扱いを一つにすることまで。

## Scope

改訂の中身は Spec Contract R1〜R9。source 文書は各文書の「時点証拠契約（proposed・未実装）」節だけを編集し、現行本文（実装済み契約）は触らない。以下の行番号は main `3148347b` 時点の現物（`rg -n` と節の抽出で確認）。

- S1（ADR）: `docs/adr/2026-09-18-stocktake-time-evidence.md` 全体。Status（:5-7）、適用範囲の但し書き（:9-11、見出しは残し中身を置換）、D1（:25-47）、D3（:63-105）、D4（:107-151）、D5（:162）、D6 legacy（:182-198）、D7（:204）、D8（:212-259、:265、:277）、D9（:283-300）、Consequences（:316-332）、Evidence（:337）、Revisit Trigger（:345）。「㉘ への引継ぎ」節を新設する。Context（:13-19）と Rejected Options（:302-310）へ R8 の台帳の要旨を加える。R9（相殺への対策）は D4 の判定不能からの復旧と D5 に置く。
- S2（DB）: `docs/DB_DESIGN.md` :7-11、`docs/db-design/pos-tables.md` :5-41、`docs/db-design/tracking-system-tables.md` :5-42。
- S3（IO）: `docs/function-design/20-io-product-repo.md` :5-20、`21-io-inventory-repo.md` :5、:10、`23-io-z004-parser.md` :5、`24-io-csv-import-repo.md` :5-27。
- S4（BIZ）: `docs/function-design/30-biz-product-service.md` :5、:12、`32-biz-csv-import-service.md` :5-76、`35-biz-stocktake-service.md` :5-48。
- S5（CMD）: `docs/function-design/40-cmd-product.md` :9-11、`41-cmd-pos.md` :7-21、`42-cmd-sales-stocktake.md` :5-35、`43-cmd-settings-log.md` :5-7。
- S6（UI）: `docs/function-design/55-ui-csv-import.md` :8-38、`73-ui-stocktake.md` :5-33。
- S7（親文書・層の task）: `docs/ARCHITECTURE.md` :13、`docs/FUNCTION_DESIGN.md` :14、`docs/SCREEN_DESIGN.md` :8、`docs/UI_TECH_STACK.md` :5-9、`docs/architecture/biz-task-specs.md` :5-12、`cmd-task-specs.md` :5-11、`io-task-specs.md` :5-7、`mnt-task-specs.md` :5-14、`ui-task-specs.md` :5-9。
- S8（合成モデル）: `scripts/probes/stocktake_time_model.py`。legacy 専用復旧（`recover_legacy_rollback`、`rebased_from`、`check_legacy_recovery` の復旧部分）を、保留と通常の適用済み実測による解除へ置き換える。判定不能の一本化の収束を確かめる check を 1 つ加える（Spec Contract R3 の 4 場合 + 進行中の確定拒否 + 取消での解消）。時刻区間の計算（`bound_clock_interval`、`classify` の trusted 分岐、`check_bounds`）は変えない（次の design lane の入力として残す。ADR Evidence にその位置づけを書く）。
- S9（archive の差替え注記）: `docs/archive/plans/2026-09-16-stocktake-count-baseline.md` :252 の直前と `docs/archive/plans/test-matrices/2026-09-18-stocktake-time-evidence.md` :7 の直後に、それぞれ 1 行で「2026-09-23 の改訂で本節の一部は ADR の『㉘ への引継ぎ』と本 lane の Matrix に置き換わった」旨とリンクを置く。それ以外の archive 本文は書き換えない（非遡及）。
- S11（店の前提の layout A/B）: `docs/project-memory.md` の :40 と :190 の 2 行だけ（R6）。他の行は編集しない。
- S10（本 lane の記録）: 本 packet、[Test Design Matrix](test-matrices/2026-09-23-stocktake-time-evidence-adr-revision.md)。`docs/Plans.md` の active link と Wave Registry は Coordinator が plan-first commit で置く（Writer の編集対象外）。

編集しない（現物を確認し、改訂の影響がないと判断した）: `docs/db-design/master-tables.md`（`pos_sync_disabled_revision` を維持するため）、`transaction-tables.md`、`docs/function-design/31-biz-inventory-service.md`、`36-biz-integrity-check.md`、`51-ui-product-form.md`、`60-ui-product-import.md`、`65-inventory-record-traceability.md`、`docs/adr/README.md`、`docs/backlog.md`、`docs/decision-log.md`、`docs/project-memory.md` の :40 / :190 以外。同期先の節外にある語の一致（`Instant` のキャッシュ期限、`resume` の UI 状態、`flag` の汎用語）は本 lane と無関係であることを確認済み。

生成物: なし。bindings・route tree・`docs/function-design/90-traceability.md` を再生成しない。要求 token（`REQ-nnn`）の増減を起こさない（AC6）。

並行 lane との関係（Coordinator 裁定 2026-09-24、owner 決定 2026-09-24「並行 lane が同じ file を編集してよい。重なりは merge 順で解く」）:

- merge 順は本 lane が先、その後に ㉘。同じ source 文書を編集する並行 lane（docs 復元 + 規則改訂 lane、㉘ の最初の lane、EJ parser core lane）は、本 lane の merge 後に自分の branch へ main を取り込み、本 lane の改訂を前提に衝突を解く。
- `docs/project-memory.md` は docs 復元 lane も編集する。本 lane は :40 / :190 の 2 行だけを持ち、docs 復元 lane はこの 2 行を本 lane の担当として除外済み。
- 台帳の「docs へ戻す候補」のうち L-054 / L-095 / L-096 / L-097 / L-098 / L-099 は docs 復元 lane から本 lane へ渡された（R8）。

## Non-scope

- `src/`、`src-tauri/`、migration、bindings、traceability の変更。
- 次の design lane の対象（番号印字・EJ による実測後の判定、精算系列の意味、同一性 guard の比較方法、レジ入替時の系列）。
- 明示 begin、`pos_sync_disabled_revision` と `sync_disabled_unreconciled` の機構、共有 JAN の設定検査の変更。EJ の取込み・parser・日次取込みの UI（EJ parser lane。R9 は EJ から受け取る証拠の条件だけを定める）。
- 規則文書（`docs/DEV_WORKFLOW.md`、`docs/AGENT_OPERATING_MANUAL.md`、`docs/templates/`、`CLAUDE.md`）の変更。
- 過去の review 記録・archive 本文の書換え（S9 の 1 行注記を除く）、GitHub 操作、実機操作、実データの読取り。

## Acceptance Criteria

- AC1（但し書きの解消）: `rg -n '適用範囲の但し書き' docs --glob '!docs/archive/**' --glob '!docs/plans/**'` の一致が ADR・`docs/Plans.md`・`docs/backlog.md` だけになる（source 文書の一致 0）。改訂前は 25 行（同じ command、main `3148347b`。内訳 = ADR 2 行〈見出し :9、Revisit Trigger :345〉、Plans 1、backlog 1、source 21）。ADR の見出しの anchor は残り、既存リンク（archive を含む）が切れない（AC7 の doc check で確認）。
- AC2（撤去した語の不在）: 次の 2 つの検索の一致が 0 件。(i) `rg -n 'legacy_rollback_recheck|rebased_from_recount_id|rebase:|count_platform_generation|count_environment_unavailable|CountEnvironment|pc_clock_epoch|pos_time_bases|TimeBasis|TimeEvidence|time_evidence|clock_unverified|time_basis_id|timestamp_precision|WM_TIMECHANGE|PowerRegisterSuspendResumeNotification|wall-clock|OS監視|計数監視|監視不成立|監視の成立' docs --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/research/**'`（改訂前 21 file・76 行 = ADR 18 行 + source 20 file 58 行。`rg -c` の合計、main `3148347b`）。(ii) `rg -n 'recover_legacy_rollback|rebased_from' scripts/probes`（改訂前 7 行）。ADR の「適用範囲の但し書き」節と「㉘ への引継ぎ」節で撤去したものを列挙する場合は語を言い換えて書く（例: 「PC 時計の世代番号」）。`docs/research/` の一致（別件の記録）と probe の同秒 comment の `wall-clock` は対象外。
- AC3（一本化の肯定形の契約）: ADR D4 の「判定不能からの復旧」、`32-biz-csv-import-service.md` の分類 step、`tracking-system-tables.md` の要再確認 flag の行を読み、次の全てが書かれていることを Final Review の Contract Audit が確認する。(a) 一意の商品の判定不能は所属によらず通常適用し、同じ業務 TX で (商品, 資料) 単位の要再確認 flag を保存する。(b) 進行中の棚卸しの明細は未解消の flag がある間 force_fill でも確定できない。(c) 解消は当該資料を計数開始前に受領していた新しい実測の保存、または当該 import の取消。(d) file 全体の保留は、在庫連動候補が複数ある共有 JAN 行で全候補の実測前を証明できない場合だけ。(e) 確定済み・独立再実測に属する商品の flag は、取込みを止めず商品単位の準備 issue として残る。所属で保留へ分ける旧規則の検索 `rg -n 'file全体の業務commitを保留|完了済み/独立再実測所属はfile全体' docs --glob '!docs/archive/**' --glob '!docs/plans/**'` が 0 件（改訂前 2 行 = ADR :132、32 :33。共有 JAN の保留を書く 32 :30 の「file全体をheld」は残すため検索に含めない）。
- AC4（legacy の fail-closed の維持）: ADR D6 と `32` の取消、`35` の確定が、legacy 分類・`legacy_movement_ceiling`（内部 key `stocktake_legacy_movement_ceiling`）・`reconciliation_version`・取消の保留を維持し、保留の解除を「新しい適用済み実測（active 明細があればその計数と確定、なければ独立再実測）の後に取消を再試行」と書く。`rg -n 'stocktake_legacy_movement_ceiling|reconciliation_version' docs/adr docs/db-design docs/function-design` が改訂後も一致する。
- AC5（合成モデル）: `python3 scripts/probes/stocktake_time_model.py` が exit 0 で `PASS:` 行を出力する（改訂前も exit 0、`PASS: temporal bounds, causal receipt, clock conflict, zero-net split, revision, count/rollback lifecycle, legacy recovery, migration kinds, force_fill`、main `3148347b`）。新しい check は Spec Contract R3 の数値例 4 場合で最終在庫が現物に一致し、数え直し前の進行中の確定を拒否し、取消で flag が消えることを assert する。R9 について、計数前の販売と計数後の返品で純数量 0 の行が (a) EJ に行ありで要再確認になり数え直しで現物へ収束する、(b) EJ に行なしで flag なし、(c) EJ なしで確認待ちになり確定を拒否し、後から行なしの EJ で解消する、を assert する。隔離 copy で (i) 判定不能の商品へ通常適用しない（在庫を動かさない）mutation、(ii) flag を保存しない mutation、(iii) legacy の取消を保留しない、(iv) 数量 0 の行を EJ の条件なしに flag なしとする mutation を入れ、それぞれ assert が落ちることを Writer が確認して報告する。
- AC6（runtime 不変・生成物なし）: `git diff --name-only origin/main -- src src-tauri docs/function-design/90-traceability.md docs/DEV_WORKFLOW.md docs/AGENT_OPERATING_MANUAL.md docs/templates docs/decision-log.md docs/backlog.md` の出力が空。`git diff -U0 origin/main -- docs/project-memory.md` の変更 hunk が :40 と :190 の 2 行だけ。変更した docs ごとに `REQ-[0-9]+` の出現の多重集合が `origin/main` と同じ（`git show origin/main:FILE | rg -o 'REQ-[0-9]+' | sort` と作業版の同じ出力の diff が空）。
- AC7（検査）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/doc-consistency-check.sh` が ERROR なし、`bash scripts/doc-consistency-check.sh --target plan docs/archive/plans/2026-09-16-stocktake-count-baseline.md` が ERROR なし、`git diff --check` が成功。
- AC9（相殺への対策）: ADR D4 / D5、`32-biz-csv-import-service.md` の分類 step と外部 probe 表、`tracking-system-tables.md` の flag の理由の列に、R9 の 3 分岐（EJ に行なし → flag なし、行あり → 要再確認、EJ なし・不完全・特定不能 → 確認待ちで確定を止める）と、後から取り込む EJ による確認待ちの再評価が書かれていることを Contract Audit が確認する。`rg -n '相殺の確認待ち' docs/adr/2026-09-18-stocktake-time-evidence.md docs/function-design/32-biz-csv-import-service.md docs/db-design/tracking-system-tables.md` が 3 file とも一致する（改訂前 0 件）。
- AC8（引継ぎ）: ADR の「㉘ への引継ぎ」節が、㉘ で実装するものと実装しないものを列挙し、archive packet の申し送りと archive Matrix の該当行より優先することを書く。`rg -n '㉘ への引継ぎ' docs/adr/2026-09-18-stocktake-time-evidence.md docs/archive/plans/2026-09-16-stocktake-count-baseline.md docs/archive/plans/test-matrices/2026-09-18-stocktake-time-evidence.md` が 3 file とも一致し（改訂前 0 件）、archive の 2 行はその節へのリンクを含む。

## Design Sources

- 要求: REQ-205 / REQ-401（`docs/spec/requirements.md`）。
- 改訂対象: [時点証拠 ADR](../adr/2026-09-18-stocktake-time-evidence.md) SPEC-STK-TIME-D1〜D9 と、Scope S2〜S7 の「時点証拠契約（proposed・未実装）」節。
- 店の事実: `docs/project-memory.md`（Store Premises Facts、初導入・本番履歴なし）、回答台帳 L-048 / L-052 / L-076 / L-101 / L-104 / L-107 / L-108 / L-297 / L-298、TD-001〜TD-008 / TD-014 / TD-015 / TD-024 / TD-025（`.local/`、公開 repository に原文を置かない）。
- 境界: `UI -> CMD -> BIZ -> IO/MNT`、INV-2、D-051、D-025、D-070。
- ㉗ の経緯: [archive packet](../archive/plans/2026-09-16-stocktake-count-baseline.md)（「後続 runtime lane ㉘ への申し送り」）、[archive Matrix](../archive/plans/test-matrices/2026-09-18-stocktake-time-evidence.md)。

## Required Design Artifacts

| Area touched by upcoming work | Required source doc / artifact | Status: existing sufficient / updated in this PR / intentionally deferred |
|---|---|---|
| Backend function / command / repository / validation / error | 20 / 21 / 24 / 30 / 32 / 35 / 43 の時点証拠契約節 | updated in this PR（S3〜S5） |
| Command / DTO / generated binding / wire shape | 40 / 41 / 42 の時点証拠契約節（purpose・code・action・引数の撤去） | updated in this PR（proposed の DTO だけ。bindings は runtime） |
| DB / transaction / audit / rollback / migration | DB_DESIGN、pos-tables、tracking-system-tables | updated in this PR（列・表・CHECK の撤去と flag の key 変更。SQL は runtime） |
| Screen / UI / route state / Japanese wording | 55 / 73、SCREEN_DESIGN、UI_TECH_STACK、ui-task-specs | updated in this PR（計数環境不成立の表示と旧取込み取消の専用再確認を撤去、要再確認の文言を一本化） |
| CSV / TSV / report / import / export format | 23 の精算メタ | updated in this PR（精度の保存を撤去、settled_at の抽出は維持） |
| Durable decision / ADR | 時点証拠 ADR | updated in this PR（decision-log は編集しない） |

## Registration / Generation Obligations

該当なし。function-design 文書の新設・改名・削除、Tauri command の登録、REQ / coverage の増減、route の変更はない。proposed の DTO から code・action・purpose を外すことに伴う bindings・`CMD_ERROR_KIND`・mock の同期は ㉘ の runtime 変更の義務として ADR の「㉘ への引継ぎ」節に残す。

## Design Intent Trace

| Spec / requirement ID | Source design doc section | Decision ID | Why / rejected alternatives | Implementation target | Test target |
|---|---|---|---|---|---|
| REQ-205 | ADR D1、35 / 42 / 43 / 73、MNT task | SPEC-STK-TIME-D1（R1） | ㉘ の判定は受領上限・revision・ledger_cursor だけで決まり、計数時刻 S/E を使わない。OS 監視は安全性に寄与せず、登録失敗で計数を止める可用性の risk だけを入れる（レビュー F3 / C6）。不採用 = 監視の維持 | ㉘ の BIZ-06 / CMD-10 / UI-10 | Matrix M1、AC2 |
| REQ-401 | ADR D3 / D4 / D5、23 / 24 / 32 / 41、pos | SPEC-STK-TIME-D3 / D4（R2） | PC 時計による比較は同じ起動中にしか成立せず、owner が捨てた。不採用 = 時刻経路を但し書きで保持し続ける | ㉘ の BIZ-03 / IO-01 / IO-02 | Matrix M2、AC1 / AC2 |
| REQ-205 / REQ-401 | ADR D4、32 / 35 / 55 / 73、tracking | SPEC-STK-TIME-D4（R3） | 保留集合を永続しない設計が迂回路と JAN 変更の受容 risk を生み、時刻経路なしでは確定済みへの後着が毎日 file 全体の保留になる。一本化しても数え直しの補正 N-L が差を吸収する（blind 裏取りの検算）。不採用 = 所属で適用と保留を分ける現行 | ㉘ の BIZ-03 / BIZ-06 / UI-07 | Matrix M3、AC3 / AC5 |
| REQ-205 | ADR D6 / D8 / D9、20 / 32 / 35 / 40 / 42 / 55 / 73、tracking | SPEC-STK-TIME-D6（R4） | 初導入で本番の旧履歴がなく、legacy 専用の復旧 command は開発・試験 DB のためだけに状態機械を抱える。不採用 = 専用復旧の維持、DB 全体の拒否 | ㉘ の取消 / migration | Matrix M4、AC4 / AC5 |
| REQ-205 / REQ-401 | ADR D4 / D5、32 / 35、tracking | SPEC-STK-TIME-D4（R9） | Z004 は全スロットを純数量で出すため数量 0 の行だけでは相殺を検出できない。EJ の行の有無なら区間内の前後を問わず判定できる。不採用 = 数量 0 を全て要再確認、対策なし、警告だけ | ㉘ の BIZ-03 / BIZ-06、EJ parser lane | Matrix M9、AC5 / AC9 |
| REQ-401 | ADR D3、23 | SPEC-STK-TIME-D3（R6） | Z004 の layout B は未対応（23、backlog）で、対応時は同じ精算の A/B が別 hash になり同一性 guard と衝突する | 次の layout B 対応 lane | Matrix M6 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 改訂後の ADR に、外した機構と外した理由（owner 決定 2026-09-23、レビューの要旨）を書き、「㉘ への引継ぎ」節で作るもの・作らないものを列挙する。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: R1〜R8 は全て ADR へ置く（R6 の layout A/B は project-memory :40 / :190 にも）。packet は scope と状態だけを持つ。
- Assumptions and constraints: 「開始してから数える」は外部前提のままで、owner は成り立つと判断した（TD-025）。要再確認は計数後に売れた商品だけ（TD-024、L-101 (1) の一部と L-107 を置換）。数量 0 の行の相殺は EJ で確かめ、EJ が無ければ確認待ち（R9）。v1.0 は次の design lane を待つ（D-070）。
- Deferred design gaps, risk, and follow-up target: 実測後の判定・同一性 guard の比較方法・レジ入替時の系列は次の design lane（backlog の「実測と POS 系列の対応を取得・保存する」(a)(b)）。明示 begin の単純化は owner 未判断で本 lane では扱わない。
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix の各行が R1〜R8 と ADR の節を引く。
- Absolute guarantee / escape hatch self-check completed, with every exception checked and compatibility stated: 「在庫は現物へ収束する」は数え直しが行われることを条件とする（数え直すまでの間は二重減算で帳簿が一時的に過小になり得る。blind 裏取り C2 の条件）。この条件と一時的な過小を ADR Consequences に書く。共有 JAN 行は一本化の例外。

## Impact Review Lenses

| Lens | Applicability / finding | Follow-up artifact |
|---|---|---|
| Adapter / core boundary | 精算メタの抽出（IO）と同一性の判定（BIZ）の分担は不変。layout B の扱いは adapter の未対応事項として ADR D3 に置く | ADR D3、23 |
| Fact check / design decision split | 店の事実（ノート PC を机に置いて棚と往復、蓋を閉じて続きをする、取込みは店で締めの後）は台帳から引き、設計判断（一本化・撤去）と分ける | Ordinary Operation、Owner Questions |
| Lifecycle / retry | 取込み → 要再確認 → 数え直し → 解消、取消 → 解消、legacy 取消の保留 → 通常の実測 → 再試行、共有 JAN の保留 → 再選択 | Matrix State Lifecycle |
| Operator workflow | 棚卸し期間の日・最終日・確定後の日を操作列で確認した | Ordinary Operation |
| Replacement path | EJ・番号印字が次の lane で入ったとき、判定不能の範囲が狭まるだけで一本化の出口（通常適用 + flag）は変わらない | ADR「㉘ への引継ぎ」 |
| Data safety / evidence | 合成モデルだけ。実 POS・DB・backup に触れない | Data Safety |
| Reporting / accounting semantics | 数え直しの補正は「再実測」区分で記録され、二重減算の戻しが棚卸し差のように見える（blind 裏取り C2 の P3）。確定済みの評価額は非遡及で不変 | ADR Consequences |
| Manual verification | 本 lane は docs のみで Windows L3 なし。73 の L3 項目 (c) を「取込み後の要再確認 → 再起動 → 数え直しで解消」へ置き換え、通知登録失敗・時刻変更の native probe を撤去する | 73、42 |
| 環境・再現性 | 新しい環境依存はない。撤去により Windows 固有の通知 API への依存がなくなる | ADR D1 |

## Design Readiness

- Existing design docs are sufficient because: 該当なし（本 lane が source を改訂する）。
- Source docs updated in this PR: Scope S1〜S7。
- Design gaps intentionally deferred: Non-scope の各項目（次の design lane と owner 未判断の単純化）。
- Durable decisions discovered in this plan and promoted to source docs: R1〜R8 を ADR へ（R6 は project-memory :40 / :190 にも）。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): MNT は計数に何も供給しなくなる。DB 接続交換時の context 失効は CMD（43）と BIZ の DB 世代で維持する。
- Backend function design: BIZ の begin / save から環境引数を外す。分類は受領順 Before・NeverObserved・LegacyObserved・Unknown の 4 種に絞る。
- Command / DTO / data contract: begin の purpose から legacy 用を外す。error code から計数環境不成立を外す。回復 action から legacy 用を外す。`get_pos_stock_readiness` は `(conn)` だけ（41 の現行 proposed の但し書きの内容を本文へ）。準備 issue に商品単位の要再確認を加え、時計の issue を外す。
- Persistence / transaction / audit impact: `pos_time_bases` と source の時刻列、item / recount の `time_basis_id` と `rebased_from_recount_id` を外す。要再確認 flag の key を (明細, import) から (商品, 資料) + 作成 import の参照へ変える。
- Operator workflow / Japanese UI wording: 「計数環境不成立」「非 Windows では計数できません」「旧取込みの取消を保留（専用の再確認）」の表示を外す。取込み結果の「取り込んだ後に数の再確認が必要です」を所属によらず使う。
- Error, empty, retry, and recovery behavior: 保留は共有 JAN 行だけ。legacy 取消の保留は通常の実測で解除して再試行。
- Testability and traceability IDs: Matrix M1〜M7。要求 token は増減しない。

## Contract Probe

- 合成モデルの基準: `python3 scripts/probes/stocktake_time_model.py` → exit 0、`PASS: temporal bounds, causal receipt, clock conflict, zero-net split, revision, count/rollback lifecycle, legacy recovery, migration kinds, force_fill`（main `3148347b`、2026-09-23 に本起票で実行）。
- 一本化の収束: blind 裏取り（fresh Opus、2026-09-23）が確定済み P 帳簿 10 の数値例で、実測後販売・実測前販売（二重減算）・数え直し前の取消・数え直し後の取消の 4 場合とも最終在庫が現物 8 に収束することを手計算で確かめた。AC5 で合成モデルの assert として再現する。
- 外部前提（agent では probe できない）: 「開始してから数える」の物理的な成立（owner は成り立つと判断、TD-025）。R9 の EJ 条件（戻・訂正・取消の行の形、EJ の精算区間と Z004 の対応、名称から商品を一意に特定できること、締めで同じ日の EJ が取れること）は実機と承認済みサンプルで確かめる事項。番号印字は次の design lane の実機確認の対象で、本 lane は依存しない。
- Z004 は活動のない商品の行も出すか（R9 の前提）: 出す。Z004 は売上の有無を問わずメモリ No. 1〜5000 の全スロットを出力する（`docs/plu-export-and-real-csv-verification.md:125`、`docs/project-memory.md:33`、`src-tauri/src/io/z004_parser.rs:218` の全スロット読込み、:204 の全桁 0 の空スロットだけを skip）。列は 5 列で数量・金額は純額だけ（同 :181 CSV-04）。owner も「Z004 だけでは売って返して差し引き 0 と動きなしを区別できない」と確認済み（台帳 L-052）。したがって数量 0 の行そのものは相殺の兆候にならない。
- 既存 anchor の着地点: `rg -o 'stocktake-time-evidence\.md#[^)]*' docs scripts` の一致は全て `#適用範囲の但し書き`（非 archive 23、archive 2。main `3148347b`）。見出しを残すことで Plans / backlog / archive のリンクを保つ。

## Contract Coverage Ledger

改訂で触る契約と、同期先・自動の証拠・非対象の対応。runtime の実装と test は ㉘ の packet が持つ。

| Design contract / decision ID | Implementation target | Automated test | L3 or non-scope |
|---|---|---|---|
| D1 context の失効（R1） | ADR D1、35 / 42 / 43 / 73、MNT / CMD task、ARCHITECTURE | AC2、Matrix M1 | ㉘ の L3 (a)(b) は維持、native probe は撤去 |
| D1 S/E の記録（R1） | ADR D1、tracking、20 / 35 | Matrix M1（S/E を前後判定に使わない記述） | — |
| D3 時刻境界の撤去（R2） | ADR D3、pos、24 / 32、BIZ / IO task | AC1 / AC2、Matrix M2 | 次の design lane |
| D3 精算同一性 guard（維持、系列証明の記述だけ変更） | ADR D3、pos、24 / 32 / 41 / 55 | Matrix M2（同番の別 hash は系列証明がないため常に衝突） | 比較方法の再設計は次の design lane |
| D4 分類（R2 / R3） | ADR D4、32 | AC3、Matrix M3 | — |
| D4 判定不能の一本化（R3） | ADR D4 / D8 / D9、tracking、20 / 32 / 35 / 41 / 55 / 73、SCREEN / UI task | AC3 / AC5、Matrix M3 | ㉘ の L3 (c) |
| D4 共有 JAN の保留（維持） | ADR D4、32 / 55 | AC3 (d)、Matrix M3 | — |
| D4 非連動化の記録（維持） | ADR D4（:141 の理由を共有 JAN 保留に限って残す） | Matrix M3 | 機構の撤去は non-scope |
| D4 JAN 変更の受容 risk（ADR :320、R3 で書き直し） | ADR Consequences | Matrix M3 | — |
| D5 EJ の完全性（維持、時計の条件だけ変更） | ADR D5、32 の外部 probe 表（EJ 完全性・EJ 復元・商品同定の行） | Matrix M5 | EJ parser lane |
| D6 legacy 取消（R4） | ADR D6 / D8 / D9、tracking、20 / 32 / 35 / 40 / 41 / 42 / 55 / 73 | AC4 / AC5、Matrix M4 | — |
| D8 保存先の表（R1〜R4） | ADR D8、DB_DESIGN、pos、tracking | AC2、Matrix M2 / M3 / M4 | SQL は ㉘ |
| D8 API と wire（R1 / R4） | ADR D8、40 / 41 / 42 | AC2、Matrix M1 / M4 | bindings は ㉘ |
| D9 UI の出口（R1 / R3 / R4） | ADR D9、55 / 73、SCREEN_DESIGN / UI_TECH_STACK / ui-task-specs | Matrix M1 / M3 / M4 | ㉘ の L3 |
| 但し書きの書き分け（R5） | 全 source の proviso 行 | AC1 | — |
| layout B（R6） | ADR D3、project-memory :40 / :190 | Matrix M6、AC6 | — |
| 売上と返品の相殺（R9） | ADR D4 / D5、tracking、32 / 35 / 55 / 73 | AC5 / AC9、Matrix M9 | EJ の取込みは EJ parser lane |
| 台帳の owner 回答の要旨（R8） | ADR Context / Rejected Options | Matrix M8 | decision-log は docs 復元 lane |
| ㉘ への引継ぎ（R7） | ADR 新節、archive 注記 2 行 | AC8 | — |

## Test Plan

[Test Design Matrix](test-matrices/2026-09-23-stocktake-time-evidence-adr-revision.md)。

- targeted tests: 合成モデル（AC5）。docs の検索 oracle（AC1〜AC4、AC6）。
- negative tests: 合成モデルへの 3 種の mutation（AC5）。撤去語の再混入を AC2 の検索で検出。
- compatibility checks: 既存 anchor の着地（AC1 / AC7）。legacy 分類と上限の維持（AC4）。
- data safety checks: 合成値だけ。実 POS・DB・backup を読まない。
- main wiring/integration checks: Contract Coverage Ledger の各行について、Final Review の Contract Audit が ADR から source の DB → IO → BIZ → CMD → UI の順に語と契約が揃っていることを読む（撤去した引数・code・action が片側だけに残らない）。

## Boundary / Wire Contract

proposed の wire だけを変える（現行の wire は不変）。

- producer: BIZ-06（begin / save）、BIZ-03（準備照会・取込み結果）。
- consumer: CMD-10 / CMD-07 → UI-10 / UI-07 / 記録詳細。
- wire type: `BeginStocktakeCountRequest.purpose` は `in_progress` / `independent_recount` の 2 種。`StocktakeRecovery.code` から `count_environment_unavailable` を外す（`rollback_recheck_required` は legacy 取消の保留理由として残す）。`CountRecoveryTarget.action` から legacy 用を外す。`PosStockReadiness.issues.code` から時計の値を外し、商品単位の要再確認の値を 1 つ加える（名前は Writer が既存の命名規則で決め、ADR と 32 / 41 / 55 / 73 で同じ綴りにする）。要再確認 flag の理由は 3 値（計数後の販売 / 相殺の行あり / 相殺の確認待ち）で、UI は確認待ちを「EJ を取り込むか、数え直してください」と区別して表示する。
- internal type: CountContext から OS 通知の世代・PC 時計 epoch・monotonic 開始を外す。DB / context 世代は残す。
- precision/range: 変更なし。
- round-trip path: count_token の往復は不変。
- invalid input: 旧 purpose（legacy 用）は deserialize で拒否される（enum から消えるため）。
- compatibility: 現行 runtime の wire は未変更。proposed 同士の差し替えで、旧 client は存在しない（㉘ 未実装）。

## Review Focus

- 撤去で、㉘ の安全性に効いていた検査まで消していないか（revision・所有者・DB 世代・受領上限・ledger_cursor は残るか）。
- 一本化で、進行中の確定が未解消の要再確認を素通りしないか。二重減算の一時的な過小を書いているか。
- 共有 JAN 行だけが保留に残ることが、ADR・32・55 で一致しているか。非連動化の記録を残す理由がその保留に絞って書かれているか。
- legacy 取消の保留の解除が、通常の経路（active の計数と確定、または独立再実測）で必ず到達できるか。active がある商品で独立再実測が拒否される規則と矛盾しないか。
- 但し書きを消した後、次の design lane が決めることが ADR の 1 か所で読めるか。
- 要再確認が計数後に売れた商品だけに付き、数量 0 の行は R9 の EJ の条件で分かれるか。EJ が無い場合の確認待ちが確定を止め、数え直しか完全な EJ でだけ解消するか。確認待ちを警告だけで確定させる経路がないか。
- Ordinary Operation の各行が成立するか（Plan Review は冒頭で `成立 / 具体的な反例あり / 外部前提が未確認` を答える）。

## Spec Contract

Contract ID: SPEC-STK-TIME-REV-2026-09-23

- R1（OS 監視の撤去）: 計数 context の失効は、商品の切替・画面離脱・abandon・アプリの終了（未保存 token は復元しない）・DB 接続の交換（DB 世代）と、保存 TX での商品 revision・所有者・親状態の不一致に限る。sleep・蓋閉じ・OS の時刻変更では失効させない。MNT の suspend/resume と時刻変更の通知、環境の世代番号、wall-clock と monotonic 時計の差の検査、監視不成立での計数停止、非 Windows での計数不可、そのための native probe と L3 項目を撤去する。S（開始）と E（保存）はアプリの時計で記録を続けるが、前後判定・失効に使わない。
- R2（PC 時計による比較の撤去）: 実測側の PC 時計 epoch（time_basis_id）、POS 時刻基準の表とその認定 gate、source の基準 FK・時刻証拠の状態と境界、境界の導出・昇格・失効の伝播、因果矛盾の検査と信用失効の証拠 TX、準備照会の時計 issue、精算時刻の精度の保存、D4 表の時刻による 2 行、D5 と外部 probe 表の時計の条件を撤去する。精算日時（settled_at）は識別と表示のメタとして抽出・保存を続ける。D4 の分類は `pos_stock_sync=false` → 売上のみ、NeverObserved → 通常、LegacyObserved → 判定不能、受領が計数開始前（`source.id <= source_cursor`）→ 実測前、それ以外 → 判定不能とする。判定不能を実測前・実測後へ分ける方法（EJ の取引単位の判定、番号印字）は次の design lane が決める。
- R3（判定不能の一本化）: 一意の商品の判定不能は、最新の実測の所属（進行中の棚卸し・確定済みの棚卸し・独立再実測・legacy）によらず Z004 の在庫変動を通常適用する。要再確認 flag は (商品, 資料) 単位で、作成した import への参照と理由（計数後の販売 / 相殺の行あり / 相殺の確認待ち）とともに同じ業務 TX で保存する。数量が 0 でない行には必ず付ける（TD-024「数えた後に売れた商品だけ」）。数量 0 の行は R9 に従う。LegacyObserved は数量によらず付ける。進行中の棚卸しに最新の実測がある商品は、未解消の flag がある間は force_fill でも確定できない。確定済み・独立再実測に属する商品の flag は取込みを止めず、商品単位の準備 issue（回復先 = active 明細、なければ独立再実測）と取込み結果で示す。flag の解消は、当該資料を計数開始前に受領していた新しい実測の保存（active 明細への measured 保存、または独立再実測）か、当該 import の取消に限る。相殺の確認待ちだけは、R9 の条件を満たす EJ の取込みでも解消する（行がなければ解消、行があれば相殺の行ありへ変わる）。file 全体の保留は、在庫連動の候補が複数ある共有 JAN 行で全候補の実測前を証明できない場合だけに残し、保留集合の再生成（同じ file の再選択と再 preview）もその場合に限る。`pos_sync_disabled_revision` と `sync_disabled_unreconciled` は、共有 JAN 行の保留を非連動化で痕跡なく抜ける経路を塞ぐものとして維持する。ADR :320 の JAN 変更の受容 risk は、一意の商品では保留がないため迂回にならないことと、共有 JAN 行で残る商品同定の限界（DATA-2）に書き直す。数値例（確定済み P、帳簿 10、現物 8 へ収束）: 実測後に 2 個販売 → 適用で 8 + flag → 数え直し N=8, L=8 で補正 0。実測前に 2 個販売 → 確定補正 -2 で 8 → 適用で 6 + flag → 数え直し N=8, L=6 で補正 +2。数え直し前に取消 → 通常の戻しで 8、flag 解消。数え直し後に取消 → 戻し +2 と補償 -2 が相殺して 8。
- R4（legacy 専用復旧の撤去）: begin の legacy 用 purpose、再実測の legacy 用 reason、回復 action の legacy 用の値、active 明細を N/N へ付け替える再基準化、`rebased_from_recount_id`、`rebase:` の内部 request ID 空間、D9 の「旧取込みの取消を保留」の専用再確認を撤去する。legacy 分類、`stocktake_legacy_movement_ceiling`、`reconciliation_version`、legacy 観測の判定不能、取消の保留（void 前に全体を停止し `rollback_recheck_required` で対象を返す）は維持する。保留の解除は、対象商品に新しい適用済み実測を作ってから（active 明細があればその計数と確定、なければ独立再実測）取消を再試行する。新方式の pending だけでは解除しない（ADR :188 の例は維持）。
- R5（但し書きの書き分け）: 各 source の冒頭にある「〜は ADR の適用範囲の但し書きにより ㉘ の実装対象外」の行を削除し、本文を改訂後の契約だけの肯定形にする。ADR の「適用範囲の但し書き」見出しは既存リンクの着地点として残し、中身を「2026-09-23 の改訂で外したもの・理由・次の design lane が決めること」の短い節に置き換える。
- R6（layout B）: ADR D3 に、Z004 の parser は従来 shape と layout A だけを受理し layout B は未対応で安全停止すること（23、backlog :36）、layout B に対応するときは同じ精算の A/B が別 hash となり精算同一性 guard で拒否されるため、その lane で同一性の比較方法を決め直すことを書く。`project-memory.md` :40 は layout A/B の観測と「REQ-401 の parser は両方を受理する」要件が日報（Z001/Z002/Z005）のものであることを明示し、Z004 は layout A だけを受理済みで layout B は未対応（台帳 L-031: Z004 でも両方を受け付ける方針、B は未対応）と書き分ける。:190 も同じ区別を 1 句で加える。
- R7（㉘ への引継ぎ）: ADR に「㉘ への引継ぎ」節を置き、㉘ で実装するもの（R1〜R4 の後に残る契約）と実装しないもの（次の design lane の対象）、ゼロ行を含む判定不能の規模、bindings・error kind・mock の同期義務を列挙する。archive packet の申し送りと archive Matrix の該当行より、この節と本 lane の Matrix を優先すると書く。
- R8（台帳の owner 回答の要旨）: 公開 repository には要旨だけを置く（L-296）。ADR Context に次を加える。L-098 = 棚卸しは「いつ数えても年末時点へ数量を繰り越せる」ことを中心に設計し、商品別に記録できた入出庫は自動で反映し、記録できない分だけ店の訂正を受け、二つを重ねて減算しない。古い実測数のままの評価額は年末時点の要求と別物になる（D1 の snapshot 補正と確定後評価額の根拠）。L-095 = 確定は snapshot 方式で、数えた時点の帳簿と現物の差だけを現在庫へ加減する（例: 帳簿 10・実測 8、その後入庫 5・販売 2 なら確定時は 11）。L-097 = 実測に反映済みの販売を後着の Z004 で再び引かない。対象は Z004 で、在庫を動かさない日報とは分けてよい。L-054 = PC の時計は電波同期だろうという owner の見立て（推測）と、レジ時計の管理は不明であること（取扱説明書では月差 ±40 秒・手動設定）。PC 時計による比較を捨てた経緯の一部として置く。Rejected Options に次を加える。L-096（開店前の計数は同日の販売を計数後、閉店後は計数前とみなす日付と時間帯の規則。営業中は日付では決まらず、L-100 で `<=` の一律適用は不承認）。L-099（「数えたら入出庫が起きる前に保存し、売れた後の数え直しは実数を入れる」という運用の約束。L-103 と D1 の「今から数える → 保存」に置き換え、運用に頼らない L-104 とも合わない）。L-098 は台帳が decision-log を候補に挙げている（旧 D-090 の予定が未実行。現在の D-090 は別件）。本 lane は ADR Context に置き、decision-log の D 化が要るなら decision-log を持つ docs 復元 lane の判断とする。 TD-025 の扱い: Context に「owner は『今から数える』を押してから棚へ行って数える流れを成り立つと判断した（2026-09-24）。この順序は外部前提として残る」を置く。同じ回答の提案「棚卸し画面を開いた・閉じたことを記録し、その時点の状態を保存する」は一部採用とし、Rejected Options と次の design lane の入力に書く。安全の仕組みとしては採らない（計数 context は商品ごとの begin で受領上限と版を固定し、画面離脱で失効する。画面を開いた時点の全商品の状態は各商品の計数より古く、それで保存・判定すると ADR が退けた全商品一括の基準に戻る。時刻による比較も捨てた）。一方、計数の作業のまとまり（その日の開始と終了）の境界を残す考えは、次の design lane の候補（番号印字を作業の開始と終了に 1 回ずつ打ち、EJ の取引順で挟む案、2026-09-23 のレビュー）と同じ形なので、その lane へ渡す。㉘ に画面の開閉の記録を加えない。TD-023（評価額の丸め）は ADR の評価額の式（D1 :51）の丸めを変えないため本 ADR には置かない（docs 復元 lane が記録する）。
- R9（売上と返品の相殺への対策、TD-024）: Z004 は活動のない商品の行も数量 0 で出すため（Contract Probe）、数量 0 の行だけでは「動きなし」と「同じ精算内で売れて戻った」を区別できない。計数の前に売れて計数の後に返品されると、Z004 の純数量は 0 のまま帳簿が現物より 1 少なくなる（逆も同じ）。採用する対策: 数えた商品（判定不能の対象）の数量 0 の行は、同じ精算区間の EJ で判定する。EJ が D5 の完全性（精算の開始と終了、取引一連番号の連続、分割 file の続き）を満たし、名称から当該商品を一意に特定でき、その区間に当該商品の行（販売・戻・訂正・取消。未知の形式の行も含む）が 1 つもなければ flag を付けない。1 つでもあれば「相殺の行あり」の要再確認を付ける。この判定は区間の中の前後を問わない（行の有無だけを見るので、時刻や番号印字による取引単位の前後判定を要しない）。EJ が無い・不完全・商品を特定できない場合は「相殺の確認待ち」の flag を付ける。確認待ちは確定を止め、準備表示に出る。R9 を満たす EJ が後から取り込まれた時点で BIZ が対象の flag を再評価し、行がなければ解消、あれば相殺の行ありへ変える。数え直しでも解消する。不採用: (a) 数量 0 の行を全て要再確認にする（L-101 (1)。TD-024 で置換、数え直しの負担が数えた PLU 商品全体に広がる）。(b) 対策なしで残存 risk として受け入れる（owner が対策を求めた）。(c) 確認待ちを警告だけにして確定を通す（利用者の注意に頼る。TD-007 / L-104）。(d) 数量 0 の行そのものを相殺の兆候とみなす（活動のない商品の行も出るので全商品に付くのと同じ）。依存: EJ の取込みと区間ごとの完全性・商品の特定は EJ parser lane が作る。それが ㉘ に入るまでは、数えた商品の数量 0 の行は全て確認待ちになり、数え直しでしか解消しない（旧来の保守的な扱いと同じ負担）。実機で確かめる外部前提: EJ に戻の行が商品名つきで載ること（承認済みサンプルで返品モードを確認済み、ADR Evidence）、訂正・取消の行の形（未確認、店が使うかも未確認 TD-026）、EJ の精算区間と Z004 の対応（D5）、16 バイトの PLU 名称から商品を一意に特定できること、締めの時点で同じ日の EJ を SD から取れること（TD-014 の日次取込み）。

## Trace Matrix

| Spec ID | Plan Step | Test | Review Focus | Evidence |
|---|---|---|---|---|
| SPEC-STK-TIME-REV-2026-09-23 R1 | S1 / S3 / S5 / S6 / S7 | AC2、Matrix M1 | 安全性に効く検査を消していないか | 検索 oracle、Contract Audit |
| SPEC-STK-TIME-REV-2026-09-23 R2 | S1 / S2 / S3 / S4 / S5 / S7 | AC1 / AC2、Matrix M2 | 精算同一性 guard と settled_at を残したか | 検索 oracle、Contract Audit |
| SPEC-STK-TIME-REV-2026-09-23 R3 | S1 / S2 / S3 / S4 / S5 / S6 / S7 / S8 | AC3 / AC5、Matrix M3 | 確定の素通り、共有 JAN の保留 | 合成モデルの PASS と mutation |
| SPEC-STK-TIME-REV-2026-09-23 R4 | S1 / S2 / S3 / S4 / S5 / S6 / S8 | AC4 / AC5、Matrix M4 | 解除の経路の到達性 | 合成モデルの PASS と mutation |
| SPEC-STK-TIME-REV-2026-09-23 R5 | S1〜S7 | AC1、Matrix M7 | 差し引いて読む箇所の不在 | 検索 oracle |
| SPEC-STK-TIME-REV-2026-09-23 R6 | S1 | Matrix M6 | layout B の現状の記述 | Contract Audit |
| SPEC-STK-TIME-REV-2026-09-23 R7 | S1 / S9 | AC8、Matrix M7 | 引継ぎの優先関係 | doc check（archive の明示 path） |
| SPEC-STK-TIME-REV-2026-09-23 R9 | S1 / S2 / S4 / S6 / S8 | AC5 / AC9、Matrix M9 | EJ なしで確定を通さないか | 合成モデルの PASS と mutation |
| SPEC-STK-TIME-REV-2026-09-23 R8 | S1 | Matrix M8 | 要旨だけで原文を置かない、置き場所 | Contract Audit |
| REQ-205 / REQ-401 | S1〜S8 | AC6 | 要求 token の不変 | `rg -o 'REQ-[0-9]+'` の比較 |

## Data Safety

- commit しないもの: 実 POS の CSV・EJ・DB・backup・receipt、店舗の実値。回答台帳とレビューの原文（`.local/` と個人領域に置いたまま。本 packet は台帳の番号と要旨だけを引く）。
- local-only: `.local/reports/store-premises/`、`.local/consultations/`、session 535b4afb の subagent 記録。
- synthetic-only: `scripts/probes/stocktake_time_model.py` の合成値。

## Owner Answers

起票中に owner へ確認した 2 問と回答（2026-09-24、台帳 追補3）。反映先は Spec Contract。

- Q1 →TD-025: 「今から数える」を押してから棚へ行って数え、机へ戻って保存する流れは成り立つと owner は判断した。棚卸し画面の開閉を記録してその時点の状態を保存する案も出た → R8（一部採用、次の design lane へ）。
- Q2 →TD-024: 要再確認は数えた後に売れた商品だけに付け、売上 0 の行には付けない。売上と返品の相殺で 1 つずれる余地には対策を講じる → R3 / R9。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

Fill after review.

- Findings Freeze: not yet frozen; post-freeze exceptions: none.
