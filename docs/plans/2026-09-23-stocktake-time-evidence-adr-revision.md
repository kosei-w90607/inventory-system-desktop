# Plan Packet: ㉗ 時点証拠 ADR の改訂（OS 監視と legacy 専用復旧の撤去、判定不能の一本化、design-only、R3）

2026-09-23 起票。出典は owner 決定 2026-09-23（店主・owner の回答台帳 `.local/reports/store-premises/answer-ledger.md` の L-107 / L-108、同日の TD-005 / TD-006 / TD-007）、owner 回答 2026-09-24（台帳 追補3 `ledger-parts/today-2026-09-24.md` の TD-024 / TD-025）と、2026-09-23 の ㉗ ADR の独立レビュー（Fable 5.1 と Opus 5.5 の fresh subagent に同じ依頼文、その統合候補を blind の fresh Opus で裏取り。原文は session 535b4afb の subagent 記録で、repository には置かない）。判定は 3 本とも「修正してから ㉘ へ進める」。

対象は [時点証拠 ADR](../adr/2026-09-18-stocktake-time-evidence.md)（SPEC-STK-TIME-D1〜D9）と、その同期先の「時点証拠契約（proposed・未実装）」節。runtime code は変えない。後続の runtime lane ㉘ はこの改訂後の ADR を入力にする。

## Workflow State

Use the field definitions, enums, transition evidence, packet-selection rule, and fail-closed behavior from `docs/DEV_WORKFLOW.md` `Workflow State`. Keep exactly one `- Key: value` line per field.

- Evidence Mode: github
- Phase: implementing
- Risk: R3
- Execution Mode: fable-window
- Plan Commit: 47744266f45ae764270d61fd45377e5619ac16f2
- Amendments: 8daadb3806c5bd0c1404b6ba5567b7acfcad9d12, 324ac9cb372b9fede6faf930a21ea74e63be0ab3, 46168058b67c681dd09548cb9fbed55b06c5b4f3, f760c9f0a0b86763fa6f4588be45299b4c49586e, 3a683aa8686c330ba82d9bc170d9fe31215c112b, 9d46095e82c55452c0a45429e657db6e89dc55a9, 29f49267246d7ec41681de621e4a67c398b8f77f, 0cff9cd681747b0a9f6bfa86a94cf7725afab63b, 68211591057275082f41a086db82e61c796d9ea5
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
- plan-gate → plan-approved → implementing（2026-09-24、Coordinator、state-only）: Plan Review round 1（fresh Opus、P1 1 / P2 4 / P3 9）→ 是正 `a7841609` → round 2（別の fresh Opus、P1 1 / P2 2 / P3 7）→ 是正 `111105be` → round 3 closure（別の fresh Opus、P1/P2 = 0、P3 3）→ P3 を反映。Plan Commit = `47744266`。round 天井 3 に到達し通過。実装は Opus 5.5 subagent の worktree run。
- Gated Amendment 1（2026-09-24、Coordinator、implementing のまま）: Final Review broad（Opus、`02574656`）の P2-1（PLU 書出しの翌日の区間が必ず不完全になり、動きのない数えた商品が全て相殺の確認待ちになる。TD-024 と矛盾）と P3-1 / P3-2 / P3-3 を受け、R9 の完全な EJ の最後の条件を「前回と今回の Z004 のスロットと名称の対応が変わっていない」へ置き換え、R9 に準備表示の理由の型と優先順位、R10 (d) の実測の基準、AC5 に (f) と mutation (vi) を加えた。裁定は Review Response。修正は Writer run、その後に Final Review broad を取り直す。
- Gated Amendment 2（2026-09-24、Coordinator、implementing のまま）: Final Review broad 2 回目（Opus、`9c901ea2`）の P2-1（GA1 の条件でも廃番・名称変更の書出しの翌日に区間全体が不完全になり、動きのない数えた商品が全て確認待ちになる）と P3-1〜P3-5 を受け、R9 の条件を「対応が変わった名称の明細の行が区間の EJ にないこと」へ細かくし、「前回」の決め方、対応の単位、最初の計数の前の Z004、flag の理由の 5 値と優先順位、R7 の担当、R10 (d) の括弧、Ordinary Operation 行 102、AC5 (f) と mutation (vii)、Matrix M9 を直した。Writer へ渡す前に Fable 5.1（相談役、read-only）で新しい条件の反例を探す。
- Gated Amendment 2 の補足（2026-09-24、Coordinator、Writer へ渡す前）: Fable 5.1（相談役、read-only）が新しい条件を検討し、書出しの反映が区間に 1 回以下なら反例なし、2 回以上なら途中の名称が今回の別コードの名称と一致したときに誤帰属しうると報告した。これを受け、対応が変わった名称を組の集合差で定義し、残る限界を 2 回以上の反映へ広げて受け入れ（塞ぐ案は Revisit Trigger へ）、「複数に一致」を商品名と部門名を合わせて数え、clear 行の外部前提を加えた。
- Gated Amendment 3（2026-09-24、Coordinator、owner 判断を受けて）: Final Review broad 3 回目（Opus、`4913921d`、round 天井）の P2-1（16 バイトの切り詰めや部門名との一致で名称が重なる商品が売れると区間全体が確認待ちになり、EJ の再取込みでも解消しない）を owner へ disposition し、owner が「候補の商品だけに絞る」を選んだ（名称の重なりの検知と付け直しの支援は PLU 書出し側の別 lane）。R9 に局所化と、区間全体の確認待ちの 2 種の範囲、P3-1 / P3-2 / P3-5 / P3-6 を加え、P3-3 の sweep（4 値 → 5 値、行 105、wire の文、R3 / R7、Matrix の flag 行）と AC5 (g)・mutation (viii)〜(x) を足した。Writer の反映の後、round は開かず GA3 の差分に限る closure 確認（fresh Opus）と Codex の broad で閉じる。
- Gated Amendment 3 の補足（2026-09-24、Coordinator）: owner 判断（TD-027、名称の重なりの検知と付け直しの支援は PLU の本番より前に必須）を R10 (a) の解除の条件に加え、Writer の GA3 反映で決めた「前回の Z004 が未受領なだけの区間は EJ待ち」を採り、その文言を前回の商品別 CSV の取込みも案内する形に定めた。
- Gated Amendment 3 の補足 2（2026-09-24、Coordinator の裁定、GA3 closure 確認 N1〜N6 と packet の sweep）: GA3 の closure 確認（fresh Opus、`8a91e26c`）の N1（部門名とも一致する名称を合計の照合から外す）・N2（合計の照合を連結成分で行う）・N3（最初の区間と未受領の見分け方）・N6（部門名の変更による登録の変化の受入れ）を R9 に加え、R9 を現行の規則だけの本文に書き直し、GA 前の規則は末尾の経緯の括弧へ移した。同じ sweep で R3 / R7 / R10 (a) の出典、Ordinary Operation 行 104 / 106 / 107、AC5 (c)(d)(f) と (h)・mutation (xi)〜(xiii)、AC9、Contract Probe、Boundary、Review Focus、Test Plan、Matrix の M9 と flag の行を直した。
- Gated Amendment 3 の補足 3（2026-09-24、Coordinator の裁定、相談役 Fable 5.1 の検討 F1〜F6 と明確化 2 点）: 相談役（read-only、対象 `29f49267`）は中核の規則（候補の局所化・連結成分・部門名の除外）に相殺の見逃しの反例なしと報告し、F1〜F6 と明確化 2 点を全件採用して R9 に加えた（最初の区間の登録の変化の再評価、前回の Z004 が未受領の間の帰属できない行、settlement_no の戻り、前回を証明できない場合と不完全の区別、clear 行で消えた code の商品、再評価の判定の順序、確認待ちの対象と Z004 側の合計の単位）。同じ sweep で R3 / R7、Ordinary Operation の複数日の棚卸しの行、AC5 (i) と mutation (xiv)〜(xvii)、AC9、Review Focus、Test Plan、Matrix の M9 と flag の行を直した。

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
| 年末の棚卸しを開始済み。ノート PC は机の上（L-076） | 商品をスキャンして選び「今から数える」→ 棚へ行って数える → 机へ戻り数を入れて「数を保存」 | その商品の実測（N、保存時の帳簿 L、開始時の受領上限）が即保存される | 次の商品へ | 「開始してから数える」は外部前提のまま（ADR D1）。owner の見立ては、押してから棚へ行く流れは成り立つ（TD-025）。商品を切り替えると context が失効するため、1 商品ごとに机と棚を 1 往復することになり、今の Excel の運用（棚で数えてから机で入力、L-076）とは順序が逆になる |
| 計数の途中 | 接客で離れる、蓋を閉じる、家へ持ち帰って後で続ける（L-297、TD-015） | 未保存の 1 商品だけが残る。sleep や OS の時刻変更では失効しない。保存時に商品の版・所有者を再検査し、その間に在庫が動いていれば「もう一度数えてください」 | 保存するか、数え直す | アプリを終了・再起動した場合は未保存の token を失い、その商品を数え直す |
| 営業中 | 数え終えた商品がレジで売れる | アプリの操作なし | 閉店前のレジ締め | — |
| レジ締め後、店を離れる前（L-048、L-298） | SD → CV17 → アプリで Z004 と同じ締めの EJ を取込み（EJ の日次取込み、TD-014。商品の在庫連動〈pos_stock_sync〉はこれが揃うまで有効にできない、R10。PLU 対象〈plu_target〉とは別の設定） | 売上が記録され、在庫が通常どおり減る。数えた後の資料で数量が 0 でない商品に「計数と前後不明の販売」の要再確認が付く。数量 0 で金額が 0 でない行は「相殺の行あり」。数量・金額とも 0 の行は、完全な EJ（R9）に当該商品を候補に含む行があれば「相殺の行あり」、なければ何も付かない。部門キーで打った行は部門売りとして商品の判定から外れる | 翌日以降に要再確認の対象を数え直す | 実測前後の販売を分ける手段は ㉘ にない（次の design lane）。R9 の EJ の外部前提は実機で確かめる |
| 翌日 | 要再確認の商品を数え直して保存 | その資料の要再確認が解消する | 当日の取込みで、数えた後に売れた商品に再び要再確認が付き得る | 同上 |
| 複数日の棚卸し（TD-024、EJ の日次取込みあり）。例: 1 日目の開店前に PLU 商品 A を数える。2 日目、B が 1 個売れた後に B を数え、その後で同じ B が返品される。同じ日に A が 1 個売れる。C は 2 日目に数えて動きなし。3 日目に A・B を数え直す | 各日の締め後に Z004 と EJ を取込み | 1 日目: A は数量 0 で EJ に行がなく、何も付かない。2 日目: A は数量 -1 で「計数と前後不明の販売」（通常適用で在庫が 1 減る）。B は販売と返品で数量 0・金額 0 だが EJ に販売と戻の行があるので「相殺の行あり」（計数前の販売を N が含み、計数後の返品が帳簿に入らないので、帳簿が現物より 1 少ない）。C は何も付かない。3 日目: A・B の数え直しで要再確認が解消し、B の帳簿は現物へ戻る | 確定の前に未解消の要再確認を数え直す | 数え直しは計数後に売れた（または同じ精算で売れて戻った）商品と、名称が重なる行・対応が変わった名称の行の候補の商品だけ（価格だけ・廃番・名称変更・新しい名称の追加の書出しや名称の重なりでは、区間全体は確認待ちにならない）。区間の資料で数量・金額とも 0 の数えた商品が全て「相殺の確認待ち」になり確定を止めるのは、EJ を取り込めなかった・完全でない日と前回の Z004 が未受領なだけの日（EJ待ち。その EJ か前回の Z004 を後から取り込むか数え直すまで）と、どの名称にも一致しない行が EJ にある日と前回を証明できない日（登録の変化。数え直すまで。最初の区間によるものは直前の Z004 を後から取り込めば再評価される）だけ（例外の保守的な扱い、R9）。本番の最初の計数より前に、その直前の精算の Z004 を取り込んでおく |
| 最終日 | 未解消の要再確認を解消してから「確定」 | 補正後の現在庫で評価額が出る。未解消があれば確定できず、対象の計数（EJ待ちなら当日の EJ か前回の Z004 の取込みも）へ案内される | 確定 | 最終日の取込みで計数後に売れた商品を数え直す負担が残る |
| 確定後の普通の日 | 取込み | 売上・在庫は通常どおり適用される。確定済みの棚卸しで数えた商品のうち、その後に売れた（または同じ精算で売れて戻った）商品が、商品単位の要再確認として準備表示に毎日加わり、独立再実測をするまで残る（取込みは止まらない）。準備表示は確定後に空にならない | 独立再実測で解消 | 表示の件数は計数後に売れた PLU 商品の数に比例し、次の design lane が入るまで減らない（規模は未実測） |
| ㉘ だけが入り、EJ の日次取込みと R9 の条件がまだない状態 | 商品の在庫連動を有効にしようとする | 準備照会の `ej_unverified` が ㉘ の build では常に返るため、在庫連動を false から true にする変更と、新規の商品・新規の import 行を true にする変更が拒否される。既定値と提案値は false になる（R10）。Z004 は売上だけを取り込み、在庫は手動の入出庫と棚卸しで動く。したがって毎晩の取込みで要再確認が付き直すことはなく、複数日の棚卸しは通常どおり確定できる | EJ の日次取込みと R9 を実装する lane の code 変更だけが `ej_unverified` を外す。その lane の merge 条件は 32 の外部 probe 表の EJ 3 行の owner-operated gate の証拠 | 店は初導入で本番 DB がなく、v1.0 は自動在庫連動の完成を待つ（D-070）ので、この状態で本番運用は始まらない |
| 同じ JAN を持つ在庫連動商品の行を含む取込み | 取込み | file 全体が保留になり、候補商品の計数へ案内される | 全候補を数えて同じ file を選び直す | 本番前の設定検査で、曖昧な JAN の在庫連動は有効化できない（ADR D4） |

この表のとおり、改訂後の ADR を実装しても日次の自動在庫連動（v1.0 の必須、D-070）は達成しない。数えた PLU 商品は資料ごとに要再確認になり、数え直しの循環は次の design lane まで残る。本 lane が完了させるのは、その土台になる契約から不要な機構を外し、判定不能の扱いを一つにすることまで。

## Scope

改訂の中身は Spec Contract R1〜R10。source 文書は各文書の「時点証拠契約（proposed・未実装）」節だけを編集し、現行本文（実装済み契約）は触らない。以下の行番号は main `3148347b` 時点の現物（`rg -n` と節の抽出で確認）。

- S1（ADR）: `docs/adr/2026-09-18-stocktake-time-evidence.md` 全体。Status（:5-7）、適用範囲の但し書き（:9-11、見出しは残し中身を置換）、D1（:25-47）、D3（:63-105）、D4（:107-151）、D5（:162）、D6 legacy（:182-198）、D7（:204）、D8（:212-259、:265、:277）、D9（:283-300）、Consequences（:314-332）、Evidence（:337）、Revisit Trigger（:345）。「㉘ への引継ぎ」節を新設する。Context（:13-19）と Rejected Options（:302-310）へ R8 の台帳の要旨を加える。R9（相殺への対策）は D4 の判定不能からの復旧と D5 に、R10（在庫連動の有効化の条件）は D4 の本番前の設定検査と Consequences :316 に置く。
- S2（DB）: `docs/DB_DESIGN.md` :7-11、`docs/db-design/pos-tables.md` :5-41、`docs/db-design/tracking-system-tables.md` :5-42。`docs/db-design/master-tables.md` :5-11（R10: `pos_stock_sync` の DB の DEFAULT 1 は変えず、`ej_unverified` の間の既定 false は BIZ-01 が与えることを 1 文加える）。
- S3（IO）: `docs/function-design/20-io-product-repo.md` :5-20、`21-io-inventory-repo.md` :5、:10、`23-io-z004-parser.md` :5、`24-io-csv-import-repo.md` :5-27。
- S4（BIZ）: `docs/function-design/30-biz-product-service.md` :5、:12、`32-biz-csv-import-service.md` :5-76、`35-biz-stocktake-service.md` :5-48。
- S5（CMD）: `docs/function-design/40-cmd-product.md` :7-15（R10 の拒否は既存 kind を使うため enum は増えない。R10 の説明を 1 文加える）、`41-cmd-pos.md` :7-21、`42-cmd-sales-stocktake.md` :5-35、`43-cmd-settings-log.md` :5-7。
- S6（UI）: `docs/function-design/55-ui-csv-import.md` :8-38、`73-ui-stocktake.md` :5-33。`51-ui-product-form.md` :5-9 と `60-ui-product-import.md` :5-9（R10 の拒否表示と既定値）。
- S7（親文書・層の task）: `docs/ARCHITECTURE.md` :13、`docs/FUNCTION_DESIGN.md` :14、`docs/SCREEN_DESIGN.md` :8、`docs/UI_TECH_STACK.md` :5-9、`docs/architecture/biz-task-specs.md` :5-12、`cmd-task-specs.md` :5-11、`io-task-specs.md` :5-7、`mnt-task-specs.md` :5-14、`ui-task-specs.md` :5-9。
- S8（合成モデル）: `scripts/probes/stocktake_time_model.py`。legacy 専用復旧（`recover_legacy_rollback`、`rebased_from`、`check_legacy_recovery` の復旧部分）を、保留と通常の適用済み実測による解除へ置き換える。判定不能の一本化と相殺への対策を確かめる check を 1 つ加える（Spec Contract R3 の 4 場合、進行中の確定拒否、取消での解消、R9 の分岐〈EJ に行あり・行なし・帰属できない行あり・EJ なし・数量 0 で金額あり〉）。時刻区間の計算（`bound_clock_interval`、`classify` の trusted 分岐、`check_bounds`）は変えない（次の design lane の入力として残す。ADR Evidence にその位置づけを書く）。
- S9（archive の差替え注記）: `docs/archive/plans/2026-09-16-stocktake-count-baseline.md` :252 の直前と `docs/archive/plans/test-matrices/2026-09-18-stocktake-time-evidence.md` :7 の直後に、それぞれ 1 行で「2026-09-23 の改訂で本節の一部は ADR の『㉘ への引継ぎ』と本 lane の Matrix に置き換わった」旨とリンクを置く。それ以外の archive 本文は書き換えない（非遡及）。
- S11（店の前提の layout A/B）: `docs/project-memory.md` の :40 と :190 の 2 行だけ（R6）。他の行は編集しない。
- S10（本 lane の記録）: 本 packet、[Test Design Matrix](test-matrices/2026-09-23-stocktake-time-evidence-adr-revision.md)。`docs/Plans.md` の active link と Wave Registry は Coordinator が plan-first commit で置く（Writer の編集対象外）。

編集しない（現物を確認し、改訂の影響がないと判断した）: `transaction-tables.md`、`docs/function-design/31-biz-inventory-service.md`、`36-biz-integrity-check.md`、`65-inventory-record-traceability.md`、`docs/adr/README.md`、`docs/backlog.md`、`docs/decision-log.md`、`docs/project-memory.md` の :40 / :190 以外。同期先の節外にある語の一致（`Instant` のキャッシュ期限、`resume` の UI 状態、`flag` の汎用語）は本 lane と無関係であることを確認済み。

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
- AC2（撤去した語の不在）: 次の 2 つの検索の一致が 0 件。(i) `rg -n 'legacy_rollback_recheck|rebased_from_recount_id|rebase:|count_platform_generation|count_environment_unavailable|CountEnvironment|pc_clock_epoch|pos_time_bases|TimeBasis|TimeEvidence|time_evidence|clock_unverified|time_basis_id|timestamp_precision|WM_TIMECHANGE|PowerRegisterSuspendResumeNotification|wall-clock|OS監視|計数監視|監視不成立|監視の成立' docs --glob '!docs/archive/**' --glob '!docs/plans/**' --glob '!docs/research/**'`（改訂前 21 file・76 行 = ADR 18 行 + source 20 file 58 行。`rg -c` の合計、main `3148347b`）。(ii) `rg -n 'recover_legacy_rollback|rebased_from' scripts/probes`（改訂前 7 行）。(iii) 和文・別表記の検索 `rg -n 'epoch|generation|monotonic|sleep|suspend|時刻変更|時計変更|POS基準|file境界|series_rule|lower_bound|計数環境|非Windows|native probe|旧取込み(の)?取消|legacy用|専用(の)?再(実測|確認)|N/N|環境不成立|時刻基準'` を Scope S1〜S7 の 29 file に当てる（改訂前 19 file・90 行 = ADR 30 行 + source 18 file 60 行。source の一致は全て時点証拠契約の節の中。main `3148347b`。round 2 で Scope に加えた master-tables / 51 / 60 の一致は 0 件で、件数は変わらない）。除外: ADR の「適用範囲の但し書き」節と「㉘ への引継ぎ」節、`32-biz-csv-import-service.md:215` の Instant（preview cache の期限）。DB 接続交換の世代は「DB 世代」と和文で書き、`generation` を使わない。R1 の肯定文は ADR D1・35・73 に「sleep・時刻変更では失効させない」の文言どおりに書き、(iii) では `rg -v 'sleep・時刻変更では失効させない'` でその行を除く。ADR の「適用範囲の但し書き」節と「㉘ への引継ぎ」節で撤去したものを列挙する場合は語を言い換えて書く（例: 「PC 時計の世代番号」）。`docs/research/` の一致（別件の記録）と probe の同秒 comment の `wall-clock` は対象外。
- AC3（一本化の肯定形の契約）: ADR D4 の「判定不能からの復旧」、`32-biz-csv-import-service.md` の分類 step、`tracking-system-tables.md` の要再確認 flag の行を読み、次の全てが書かれていることを Final Review の Contract Audit が確認する。(a) 一意の商品の判定不能は所属によらず通常適用し、同じ業務 TX で (商品, 資料) 単位の要再確認 flag を保存する。(b) 進行中の棚卸しの明細は未解消の flag がある間 force_fill でも確定できない。(c) 解消は当該資料を計数開始前に受領していた新しい実測の保存、または当該 import の取消。(d) file 全体の保留は、在庫連動候補が複数ある共有 JAN 行で全候補の実測前を証明できない場合だけ。(e) 確定済み・独立再実測に属する商品の flag は、取込みを止めず商品単位の準備 issue として残る。所属で保留へ分ける旧規則の検索 `rg -n 'file全体の業務commitを保留|完了済み/独立再実測所属はfile全体' docs --glob '!docs/archive/**' --glob '!docs/plans/**'` が 0 件（改訂前 2 行 = ADR :132、32 :33。共有 JAN の保留を書く 32 :30 の「file全体をheld」は残すため検索に含めない）。
- AC4（legacy の fail-closed の維持）: ADR D6 と `32` の取消、`35` の確定が、legacy 分類・`legacy_movement_ceiling`（内部 key `stocktake_legacy_movement_ceiling`）・`reconciliation_version`・取消の保留を維持し、保留の解除を「新しい適用済み実測（active 明細があればその計数と確定、なければ独立再実測）の後に取消を再試行」と書く。`rg -n 'stocktake_legacy_movement_ceiling|reconciliation_version' docs/adr docs/db-design docs/function-design` が改訂後も一致する。
- AC5（合成モデル）: `python3 scripts/probes/stocktake_time_model.py` が exit 0 で `PASS:` 行を出力する（改訂前も exit 0、`PASS: temporal bounds, causal receipt, clock conflict, zero-net split, revision, count/rollback lifecycle, legacy recovery, migration kinds, force_fill`、main `3148347b`）。新しい check は Spec Contract R3 の数値例 4 場合で最終在庫が現物に一致し、数え直し前の進行中の確定を拒否し、取消で flag が消えることを assert する。R9 について、計数前の販売と計数後の返品で純数量 0 の行が (a) EJ に行ありで要再確認になり数え直しで現物へ収束する、(b) EJ に行なしで flag なし、(c) EJ なしで相殺の確認待ち（EJ待ち）になり確定を拒否し、後から行なしの EJ で解消する、(d) 区間に帰属できない行（どの商品の名称にも部門名にも前回の Z004 の名称にも一致しない明細の行）が 1 つでもあれば、行のない商品も相殺の確認待ち（登録の変化）になり、部門名だけに一致する部門売りの行と明細でない行（合計・支払・税）だけなら確認待ちにならない、(e) 数量 0 で金額が 0 でない行は EJ を待たずに相殺の行ありになる、を assert する。隔離 copy で (i) 判定不能の商品へ通常適用しない（在庫を動かさない）mutation、(ii) flag を保存しない mutation、(iii) legacy の取消を保留しない、(iv) 数量 0 の行を EJ の条件なしに flag なしとする、(v) 帰属できない行があっても区間を完全とみなす mutation を入れ、それぞれ assert が落ちることを Writer が確認して報告する。 Gated Amendment 1 / 2 で追加: (f) 価格だけ・廃番・名称変更・新しい名称の追加の書出しの後の区間で、変わった名称の明細の行が EJ になければ、数量・金額とも 0 で EJ に行のない数えた商品に flag が付かず、変わった名称の行がある区間（名称の入替えを含む）では区間を完全のままその名称の候補（前回と今回の組の商品の和）のうち数量・金額とも 0 の数えた商品だけが相殺の行ありになり、前回を証明できない区間では相殺の確認待ち（登録の変化）になって EJ の再評価では解消せず数え直しで解消する、を assert し（Gated Amendment 3 の補足 2 で GA3 の規則に合わせた。GA2 の旧文は、変わった名称の行がある区間も対応の変化の確認待ちにしていた）、隔離 copy で (vi) 変わった名称の行を無視する mutation と (vii) 変わった名称があれば行の有無を問わず区間を不完全にする mutation を入れて、それぞれ assert が落ちることを Writer が確認して報告する。Gated Amendment 3 で追加: (g) 名称が複数の商品に一致する行（16 バイトの切り詰めによる同名）・商品の名称と部門名に一致する行・対応が変わった名称の行では、区間を不完全にせず、候補の商品のうち数量・金額とも 0 の数えた商品だけが相殺の行ありになり、候補でない動きのない数えた商品には flag が付かない、どれにも一致しない行と前回を証明できない区間は登録の変化、前回の Z004 が未受領なだけの区間はその Z004 の受領で再評価される、組の集合差（前回 {(1,P),(2,Q),(3,Q)}・今回 {(1,P),(2,Q)}・行 Q）で Q の候補が相殺の行ありになる、を assert し、(viii) 複数一致の行で区間全体を不完全にする mutation、(ix) 候補から前回の組を外す mutation、(x) 名称をキーにした対応表で比べる mutation を入れて、それぞれ assert が落ちることを確認する。Gated Amendment 3 の補足 2 で追加: (h) 商品の名称と部門名の両方に一致する名称の行が部門売りと合わせて区間にあるとき、その名称の行を商品別の符号付き合計の照合から外すので区間は完全のまま（EJ待ちにならず）、その名称の候補の数量・金額とも 0 の数えた商品が相殺の行ありになる、区間の途中で名称が入れ替わり（前回 {(1,A),(2,B)}・今回 {(1,B),(2,A)}）商品 1 が入替えの前後に A と B で売れた区間で、候補でつながる名称と商品の単位の合計が Z004 と一致して区間が完全のままになる、その machine_no の Z004 を一度も受領していない最初の区間は EJ の有無によらず Z004 の取込みの時点で相殺の確認待ち（登録の変化）になり EJ の取込みでは解消せず、受領したことのある machine_no で直前の settlement_no の Z004 だけが無い区間は EJ待ちになってその Z004 の受領で再評価される、を assert し、(xi) 部門名とも一致する名称の行を合計の照合に含める、(xii) 合計の照合を名称ごとに行う、(xiii) 一度も受領していない machine_no と未受領を区別しない mutation を入れて、それぞれ assert が落ちることを確認する。Gated Amendment 3 の補足 3 で追加: (i) 今日の Z004 と EJ を先に取り込んで最初の区間の登録の変化になった後、直前の settlement_no の Z004 を取り込むと再評価され、帰属できない行がなく完全なら行の有無で解消か相殺の行ありになる（F1）、前回の Z004 が未受領の間は、どの名称にも一致しない行が EJ にあっても登録の変化にせず EJ待ちのままで、前回の受領後に帰属できない行を判定する（F2）、受領済みの最大より小さい settlement_no の Z004 は登録の変化になり、その後の Z004 の前回の候補は戻った後に受領したものに限る（F3）、EJ に区間の開始の証拠が無い区間は EJ待ち、開始の証拠が受領済みの前回と一致しない区間は登録の変化になる（F4）、F5 の外部前提が真の場合に、今回の Z004 に行がなく前回にはある code の数えた商品を数量・金額とも 0 の行として EJ で判定し（EJ にその名称の行があれば相殺の行あり）、その code を含む単位の合計を照合しない（F5）、帰属できない行と当該商品の候補の行の両方がある区間の再評価が相殺の行ありでなく登録の変化になる（F6）、を assert し、(xiv) 最初の区間の登録の変化を直前の Z004 の受領で再評価しない、(xv) 前回の Z004 が未受領の間に帰属できない行を判定する、(xvi) settlement_no の戻りを未受領として扱う、(xvii) 帰属できない行の判定を行の有無の判定より後にする mutation を入れて、それぞれ assert が落ちることを確認する（F4 / F5 は assert だけで、mutation を求めない）。
- AC6（runtime 不変・生成物なし）: `git diff --name-only origin/main -- src src-tauri docs/function-design/90-traceability.md docs/DEV_WORKFLOW.md docs/AGENT_OPERATING_MANUAL.md docs/templates docs/decision-log.md docs/backlog.md` の出力が空。`git diff -U0 origin/main -- docs/project-memory.md` の変更 hunk が :40 と :190 の 2 行だけ。変更した docs ごとに `REQ-[0-9]+` の出現の多重集合が `origin/main` と同じ（`git show origin/main:FILE | rg -o 'REQ-[0-9]+' | sort` と作業版の同じ出力の diff が空）。
- AC7（検査）: `bash scripts/doc-consistency-check.sh --target plan` と `bash scripts/doc-consistency-check.sh` が ERROR なし、`bash scripts/doc-consistency-check.sh --target plan docs/archive/plans/2026-09-16-stocktake-count-baseline.md` が ERROR なし、`git diff --check` が成功。
- AC9（相殺への対策）: ADR D4 / D5、`32-biz-csv-import-service.md` の分類 step と外部 probe 表、`tracking-system-tables.md` の flag の理由の列に、R9 の分岐（完全な EJ に候補の行なし → flag なし、行あり → 相殺の行あり、EJ なし・不完全・前回の Z004 が未受領 → 相殺の確認待ち〈EJ待ち〉、帰属できない行・前回を証明できない → 相殺の確認待ち〈登録の変化〉。確認待ちは 2 種とも確定を止める）と、後から取り込む EJ か前回の Z004 による EJ待ちの再評価（帰属できない行と前回の証明を先に判定する順序）、直前の Z004 の受領による最初の区間の登録の変化の再評価が書かれていることを Contract Audit が確認する。`rg -n '相殺の確認待ち' docs/adr/2026-09-18-stocktake-time-evidence.md docs/function-design/32-biz-csv-import-service.md docs/db-design/tracking-system-tables.md` が 3 file とも一致する（改訂前 0 件）。
- AC10（在庫連動の有効化の条件）: ADR D4 の本番前の設定検査と Consequences、`30-biz-product-service.md`、`32-biz-csv-import-service.md` の準備照会、`40-cmd-product.md`、`51-ui-product-form.md`、`60-ui-product-import.md`、`master-tables.md` の時点証拠契約の節に、R10 の全要素（拒否は false→true と新規 true だけ、true→true は許可、`ej_unverified` の間の既定値・提案値は false、拒否は既存 kind `validation`・field `pos_stock_sync`、51 と 60 の文言と 60 は行単位の error、`ej_unverified` は ㉘ の build で常に返り外すのは EJ 日次取込みと R9 の lane の code 変更だけ、初回の有効化の実測基準）が書かれていることを Contract Audit が確認する。`rg -n 'ej_unverified' docs/adr/2026-09-18-stocktake-time-evidence.md docs/function-design/30-biz-product-service.md` が 2 file とも一致し（改訂前 ADR 0 行、30 0 行、32 1 行。main `3148347b`）、`rg -n '在庫連動は有効にできません' docs/function-design/51-ui-product-form.md docs/function-design/60-ui-product-import.md` が 2 file とも一致する（改訂前 0 行）。
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
| DB / transaction / audit / rollback / migration | DB_DESIGN、pos-tables、tracking-system-tables、master-tables（R10 の既定値） | updated in this PR（列・表・CHECK の撤去と flag の key 変更。SQL は runtime） |
| Screen / UI / route state / Japanese wording | 55 / 73 / 51 / 60、SCREEN_DESIGN、UI_TECH_STACK、ui-task-specs | updated in this PR（計数環境不成立の表示と旧取込み取消の専用再確認を撤去、要再確認の文言を一本化、R10 の拒否表示と提案値） |
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
| REQ-205 / REQ-401 | ADR D4 / Consequences、30 / 32 | SPEC-STK-TIME-D4（R10） | EJ がないと複数日の棚卸しが毎晩の要再確認で確定に届かない（Plan Review round 1 P1-1）。Consequences :316 の方針を仕組みにする。不採用 = owner に受容を求める（EJ の日次取込みは owner 了承済み TD-014 で、待つ費用は D-070 で受け入れ済み） | ㉘ の BIZ-01 / BIZ-03 | Matrix M10、AC10 |
| REQ-401 | ADR D3、23 | SPEC-STK-TIME-D3（R6） | Z004 の layout B は未対応（23、backlog）で、対応時は同じ精算の A/B が別 hash になり同一性 guard と衝突する | 次の layout B 対応 lane | Matrix M6 |

## Design Intent Audit

- Source docs can answer what is being built and why without chat history or archived Plan Packets: 改訂後の ADR に、外した機構と外した理由（owner 決定 2026-09-23、レビューの要旨）を書き、「㉘ への引継ぎ」節で作るもの・作らないものを列挙する。
- Plan-only durable decisions found and promoted to source docs / decision-log / ADR: R1〜R10 は全て ADR へ置く（R6 の layout A/B は project-memory :40 / :190 にも）。packet は scope と状態だけを持つ。
- Assumptions and constraints: 「開始してから数える」は外部前提のままで、owner の見立てでは成り立つ（TD-025）。要再確認は計数後に売れた商品だけ（TD-024、L-101 (1) の一部と L-107 を置換）。数量 0 の行の相殺は EJ で確かめ、EJ が無ければ確認待ち（R9）。v1.0 は次の design lane を待つ（D-070）。
- Deferred design gaps, risk, and follow-up target: 実測後の判定・同一性 guard の比較方法・レジ入替時の系列は次の design lane（backlog の「実測と POS 系列の対応を取得・保存する」(a)(b)）。明示 begin の単純化は owner 未判断で本 lane では扱わない。
- Test Design Matrix can cite design decision IDs or source doc sections: Matrix の各行が R1〜R10 と ADR の節を引く。
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
- Durable decisions discovered in this plan and promoted to source docs: R1〜R10 を ADR へ（R6 は project-memory :40 / :190 にも）。

Minimum design checks for business-app work:

- Layer ownership (`UI -> CMD -> BIZ -> IO/MNT`): MNT は計数に何も供給しなくなる。DB 接続交換時の context 失効は CMD（43）と BIZ の DB 世代で維持する。
- Backend function design: BIZ の begin / save から環境引数を外す。分類は受領順 Before・NeverObserved・LegacyObserved・Unknown の 4 種に絞る。
- Command / DTO / data contract: begin の purpose から legacy 用を外す。error code から計数環境不成立を外す。回復 action から legacy 用を外す。`get_pos_stock_readiness` は `(conn)` だけ（41 の現行 proposed の但し書きの内容を本文へ）。準備 issue に商品単位の要再確認を加え、時計の issue を外す。
- Persistence / transaction / audit impact: `pos_time_bases` と source の時刻列、item / recount の `time_basis_id` と `rebased_from_recount_id` を外す。要再確認 flag の key を (明細, import) から (商品, 資料) + 作成 import の参照へ変える。
- Operator workflow / Japanese UI wording: 「計数環境不成立」「非 Windows では計数できません」「旧取込みの取消を保留（専用の再確認）」の表示を外す。取込み結果の「取り込んだ後に数の再確認が必要です」を所属によらず使う。
- Error, empty, retry, and recovery behavior: 保留は共有 JAN 行だけ。legacy 取消の保留は通常の実測で解除して再試行。
- Testability and traceability IDs: Matrix M1〜M10。要求 token は増減しない。

## Contract Probe

- 合成モデルの基準: `python3 scripts/probes/stocktake_time_model.py` → exit 0、`PASS: temporal bounds, causal receipt, clock conflict, zero-net split, revision, count/rollback lifecycle, legacy recovery, migration kinds, force_fill`（main `3148347b`、2026-09-23 に本起票で実行）。
- 一本化の収束: blind 裏取り（fresh Opus、2026-09-23）が確定済み P 帳簿 10 の数値例で、実測後販売・実測前販売（二重減算）・数え直し前の取消・数え直し後の取消の 4 場合とも最終在庫が現物 8 に収束することを手計算で確かめた。AC5 で合成モデルの assert として再現する。
- 外部前提（agent では probe できない）: 「開始してから数える」の物理的な成立（owner の見立てでは成り立つ、TD-025）。R9 の EJ 条件（戻・訂正・取消の行の形、EJ の精算区間と Z004 の対応、16 バイトのレジ名称の重なりの程度〈重なっても候補の商品に局所化する〉、締めで同じ日の EJ が取れること）は実機と承認済みサンプルで確かめる事項。番号印字は次の design lane の実機確認の対象で、本 lane は依存しない。
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
| D7 訂正の active 優先（R4 で :204 の legacy 例外の 1 文を削る） | ADR D7 | Contract Audit（active 明細がある商品で独立再実測が拒否される規則が例外なしで残る） | — |
| 在庫連動の有効化の条件（R10） | ADR D4 / Consequences、30 / 32 | AC10、Matrix M10 | 外部 probe の成立は owner-operated gate |
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

- targeted tests: 合成モデル（AC5。S8 の check は R3 と R9 の場合を含む）。docs の検索 oracle（AC1〜AC4、AC6、AC9、AC10）。
- negative tests: 合成モデルへの mutation（AC5 (i)〜(xvii)）。撤去語の再混入を AC2 の 3 つの検索で検出。
- compatibility checks: 既存 anchor の着地（AC1 / AC7）。legacy 分類と上限の維持（AC4）。
- data safety checks: 合成値だけ。実 POS・DB・backup を読まない。
- main wiring/integration checks: Contract Coverage Ledger の各行について、Final Review の Contract Audit が ADR から source の DB → IO → BIZ → CMD → UI の順に語と契約が揃っていることを読む（撤去した引数・code・action が片側だけに残らない）。

## Boundary / Wire Contract

proposed の wire だけを変える（現行の wire は不変）。

- producer: BIZ-06（begin / save）、BIZ-03（準備照会・取込み結果）。
- consumer: CMD-10 / CMD-07 → UI-10 / UI-07 / 記録詳細。
- wire type: `BeginStocktakeCountRequest.purpose` は `in_progress` / `independent_recount` の 2 種。`StocktakeRecovery.code` から `count_environment_unavailable` を外す（`rollback_recheck_required` は legacy 取消の保留理由として残す）。`CountRecoveryTarget.action` から legacy 用を外す。`PosStockReadiness.issues.code` から時計の値を外し、商品単位の要再確認の値を 1 つ加える（名前は Writer が既存の命名規則で決め、ADR と 32 / 41 / 55 / 73 で同じ綴りにする）。要再確認 flag の理由は 5 値（計数と前後不明の販売 / 相殺の行あり / 相殺の確認待ち〈EJ待ち〉 / 相殺の確認待ち〈登録の変化〉 / 旧記録の実測）で、UI は EJ待ちを R7 の文言（EJ の取込み機能の前後と、前回の Z004 が未受領なだけの区間）で、登録の変化を数え直しだけを案内する文言で表示する。R10 の拒否は既存 `CmdErrorKind::Validation`（field = `pos_stock_sync`）で返し、kind の enum を増やさない。
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
- 要再確認が計数後に売れた商品だけに付き、数量 0 の行は R9 の EJ の条件で分かれるか。相殺の確認待ちが確定を止め、EJ待ちは数え直しか完全な EJ・前回の Z004 の取込みでだけ、登録の変化は数え直し（最初の区間によるものは直前の Z004 の受領による再評価も）でだけ解消するか。再評価が帰属できない行と前回の証明を行の有無より先に判定するか。名称の重なりと対応が変わった名称の行が区間全体でなく候補の商品に局所化されるか。確認待ちを警告だけで確定させる経路がないか。
- `ej_unverified` の間は在庫連動を有効にできないこと（R10）が、Ordinary Operation の ㉘ 単体の行と一致し、EJ ありの歩き方で複数日の棚卸しが確定に届くか。
- Ordinary Operation の各行が成立するか（Plan Review は冒頭で `成立 / 具体的な反例あり / 外部前提が未確認` を答える）。

## Spec Contract

Contract ID: SPEC-STK-TIME-REV-2026-09-23

- R1（OS 監視の撤去）: 計数 context の失効は、商品の切替・画面離脱・abandon・アプリの終了（未保存 token は復元しない）・DB 接続の交換（DB 世代）と、保存 TX での商品 revision・所有者・親状態の不一致に限る。sleep・蓋閉じ・OS の時刻変更では失効させない。MNT の suspend/resume と時刻変更の通知、環境の世代番号、wall-clock と monotonic 時計の差の検査、監視不成立での計数停止、非 Windows での計数不可、そのための native probe と L3 項目を撤去する。S（開始）と E（保存）はアプリの時計で記録を続けるが、前後判定・失効に使わない。
- R2（PC 時計による比較の撤去）: 実測側の PC 時計 epoch（time_basis_id）、POS 時刻基準の表とその認定 gate、source の基準 FK・時刻証拠の状態と境界、境界の導出・昇格・失効の伝播、因果矛盾の検査と信用失効の証拠 TX、準備照会の時計 issue、精算時刻の精度の保存、D4 表の時刻による 2 行、D5 と外部 probe 表の時計の条件を撤去する。精算日時（settled_at）は識別と表示のメタとして抽出・保存を続ける。D4 の分類は `pos_stock_sync=false` → 売上のみ、NeverObserved → 通常、LegacyObserved → 判定不能、受領が計数開始前（`source.id <= source_cursor`）→ 実測前、それ以外 → 判定不能とする。判定不能を実測前・実測後へ分ける方法（EJ の取引単位の判定、番号印字）は次の design lane が決める。
- R3（判定不能の一本化）: 一意の商品の判定不能は、最新の実測の所属（進行中の棚卸し・確定済みの棚卸し・独立再実測・legacy）によらず Z004 の在庫変動を通常適用する。要再確認 flag は (商品, 資料) 単位で、作成した import への参照と理由とともに同じ業務 TX で保存する。理由は 5 値: 計数と前後不明の販売（数量が 0 でない行。TD-024 の数えた後に売れた商品に当たり、計数前の販売で二重に減算された場合も含むため前後不明と呼ぶ）、相殺の行あり（R9）、相殺の確認待ち（EJ待ち、R9）、相殺の確認待ち（登録の変化、R9。数え直しで解消し、最初の区間によるものだけは直前の settlement_no の Z004 の受領でも再評価する）、旧記録の実測（LegacyObserved の行。数量によらず付け、legacy の基準は新しい実測で置き換えるまで解消しない）。数量・金額とも 0 の行は R9 に従う。進行中の棚卸しに最新の実測がある商品は、未解消の flag がある間は force_fill でも確定できない。確定済み・独立再実測に属する商品の flag は取込みを止めず、商品単位の準備 issue（回復先 = active 明細、なければ独立再実測）と取込み結果で示す。flag の解消は、当該資料を計数開始前に受領していた新しい実測の保存（active 明細への measured 保存、または独立再実測）か、当該 import の取消に限る。相殺の確認待ち（EJ待ち）だけは、R9 の条件を満たす EJ か前回の Z004 の取込みでも再評価する（R9。帰属できない行か前回を証明できなければ登録の変化へ変わり、どちらも無く完全なときだけ、行がなければ解消、行があれば相殺の行ありになる）。相殺の確認待ち（登録の変化）は EJ の再評価の対象にしない（最初の区間によるものは直前の settlement_no の Z004 の受領で再評価する、R9）。file 全体の保留は、在庫連動の候補が複数ある共有 JAN 行で全候補の実測前を証明できない場合だけに残し、保留集合の再生成（同じ file の再選択と再 preview）もその場合に限る。`pos_sync_disabled_revision` と `sync_disabled_unreconciled` は、共有 JAN 行の保留を非連動化で痕跡なく抜ける経路を塞ぐものとして維持する。ADR :320 の JAN 変更の受容 risk は、一意の商品では保留がないため迂回にならないことと、共有 JAN 行で残る商品同定の限界（DATA-2）に書き直す。数値例（確定済み P、帳簿 10、現物 8 へ収束）: 実測後に 2 個販売 → 適用で 8 + flag → 数え直し N=8, L=8 で補正 0。実測前に 2 個販売 → 確定補正 -2 で 8 → 適用で 6 + flag → 数え直し N=8, L=6 で補正 +2。数え直し前に取消 → 通常の戻しで 8、flag 解消。数え直し後に取消 → 戻し +2 と補償 -2 が相殺して 8。
- R4（legacy 専用復旧の撤去）: begin の legacy 用 purpose、再実測の legacy 用 reason、回復 action の legacy 用の値、active 明細を N/N へ付け替える再基準化、`rebased_from_recount_id`、`rebase:` の内部 request ID 空間、D9 の「旧取込みの取消を保留」の専用再確認を撤去する。legacy 分類、`stocktake_legacy_movement_ceiling`、`reconciliation_version`、legacy 観測の判定不能、取消の保留（void 前に全体を停止し `rollback_recheck_required` で対象を返す）は維持する。保留の解除は、対象商品に新しい適用済み実測を作ってから（active 明細があればその計数と確定、なければ独立再実測）取消を再試行する。新方式の pending だけでは解除しない（ADR :188 の例は維持）。
- R5（但し書きの書き分け）: 各 source の冒頭にある「〜は ADR の適用範囲の但し書きにより ㉘ の実装対象外」の行を削除し、本文を改訂後の契約だけの肯定形にする。ADR の「適用範囲の但し書き」見出しは既存リンクの着地点として残し、中身を「2026-09-23 の改訂で外したもの・理由・次の design lane が決めること」の短い節に置き換える。
- R6（layout B）: ADR D3 に、Z004 の parser は従来 shape と layout A だけを受理し layout B は未対応で安全停止すること（23、backlog :36）、layout B に対応するときは同じ精算の A/B が別 hash となり精算同一性 guard で拒否されるため、その lane で同一性の比較方法を決め直すことを書く。`project-memory.md` :40 は layout A/B の観測と「REQ-401 の parser は両方を受理する」要件が日報（Z001/Z002/Z005）のものであることを明示し、Z004 は layout A だけを受理済みで layout B は未対応（台帳 L-031: Z004 でも両方を受け付ける方針、B は未対応）と書き分ける。:190 も同じ区別を 1 句で加える。
- R7（㉘ への引継ぎ）: ADR に「㉘ への引継ぎ」節を置き、archive packet の申し送りと archive Matrix の該当行より、この節と本 lane の Matrix を優先すると書く。担当を次のとおり列挙する。順序: R10（有効化の拒否と `ej_unverified` の常時返却）は、在庫連動付きの Z004 業務 commit を再開する ㉘ の lane より遅れて入れてはならない（同じ lane か、それより前の lane で入れる）。㉘（最初の lane 以降の runtime lane）: R1〜R4 の後に残る契約、flag の 5 理由と理由の遷移（EJ待ち → 登録の変化 / 解消 / 相殺の行あり の順で判定、登録の変化 → 数え直しで解消、最初の区間の登録の変化 → 直前の settlement_no の Z004 の受領で再評価）、Z004 の取込みの時点での最初の区間の判定（その machine_no の Z004 の受領の有無で決め、EJ の有無より先に行う。R9）と settlement_no の戻りの判定（受領済みの最大より小さい settlement_no は登録の変化、以後の前回の候補は戻った後の受領に限る）、EJ の期間の証拠を受け取る BIZ の interface（精算の同一性・完全性と、登録の変化〈帰属できない行・前回を証明できない〉か前回の Z004 が未受領か、商品別の行の有無〈名称が重なる行は候補の商品全てを行ありとする〉を受け取り、EJ待ちの flag を EJ か前回の Z004 の受領時に、最初の区間の登録の変化を直前の Z004 の受領時に再評価する）とその呼出し、R10 の有効化の拒否・既定値・preflight・`ej_unverified` の常時返却、`src-tauri/src/biz/csv_import_service/parse.rs:94` が数量・金額とも 0 の行を商品照合の前に捨てる現行の修正（backlog :48。R9 の判定と 23 :9 の保持に必要）、bindings・error kind・mock の同期。EJ parser lane: EJ の取込み・解析、受領した Z004 ごとのスキャニングコードと名称の組の保持（売上値と file 本体は複製しない）と対応が変わった名称の集合の算出、行の分類（R9 の商品の行・部門売り・明細でない行・帰属できない行。帰属できない行は前回の Z004 が受領済みのときだけ判定する）と名称が重なる行の候補の商品の算出、合計の照合の単位（連結成分、部門名とも一致する名称の除外、slot 単位の Z004 側の合計、clear 行で消えた code を含む単位の除外）、精算区間ごとの完全性（D5。登録の変化による確認待ちをほかの不完全と区別して返し、前回の Z004 が未受領なだけの区間と、区間の開始の証拠が EJ に無い不完全を示すことを含む）と商品別の行の有無を interface の形で返すこと、日次取込みの UI。次の design lane: 取引単位の前後判定（番号印字 + EJ）、精算系列と同一性 guard の比較方法。UI の文言: EJ の取込み機能がない間は、相殺の確認待ち（EJ待ち）に「この日の電子ジャーナルがないため、売上と返品の相殺を確かめられません。今の数を確認してください」と数え直しだけを案内し、実行できない取込みを案内しない。EJ の取込み機能が入った後は「電子ジャーナルを取り込むか、今の数を確認してください」とし、そのうち前回の Z004 が未受領なだけの区間は「前回の精算の商品別CSV（電子ジャーナルがまだならそれも）を取り込むか、今の数を確認してください」とする（Gated Amendment 3 の補足）。相殺の確認待ち（登録の変化）は、いつも「レジの商品の登録が変わったため、売上と返品の相殺を確かめられません。今の数を確認してください」と数え直しだけを案内する（R10 により、取込み機能の前に在庫連動は有効にならないため、前者は開発・試験 DB でだけ現れる）。
- R8（台帳の owner 回答の要旨）: 公開 repository には要旨だけを置く（L-296）。ADR Context に次を加える。L-098 = 棚卸しは、いつ数えても年末時点へ数量を繰り越せることを中心に設計し、商品別に記録できた入出庫は自動で反映し、記録できない分だけ店の訂正を受け、二つを重ねて減算しない。古い実測数のままの評価額は年末時点の要求と別物になる（D1 の snapshot 補正と確定後評価額の根拠）。L-095 = 確定は snapshot 方式で、数えた時点の帳簿と現物の差だけを現在庫へ加減する（例: 帳簿 10・実測 8、その後入庫 5・販売 2 なら確定時は 11）。L-097 = 実測に反映済みの販売を後着の Z004 で再び引かない。対象は Z004 で、在庫を動かさない日報とは分けてよい。L-054 = PC の時計は電波同期だろうという owner の見立て（推測）と、レジ時計の管理は不明であること（取扱説明書では月差 ±40 秒・手動設定）。PC 時計による比較を捨てた経緯の一部として置く。Rejected Options に次を加える。L-096（開店前の計数は同日の販売を計数後、閉店後は計数前とみなす日付と時間帯の規則。営業中は日付では決まらず、L-100 で `<=` の一律適用は不承認）。L-099（数えたら入出庫の前に保存し、売れた後に数え直すときは実数を入れる、という運用の約束。L-103 と D1 の「今から数える → 保存」に置き換え、運用に頼らない L-104 とも合わない）。L-098 は台帳が decision-log を候補に挙げている（旧 D-090 の予定が未実行。現在の D-090 は別件）。本 lane は ADR Context に置き、decision-log の D 化が要るなら decision-log を持つ docs 復元 lane の判断とする。 TD-025 の扱い: Context に、owner の見立てでは「今から数える」を押してから棚へ行って数える流れは成り立つこと（2026-09-24）、1 商品ごとに机と棚を 1 往復する順序で今の Excel の運用とは逆になること、この順序は外部前提として残ることを置く。同じ回答の提案（棚卸し画面を開いた・閉じたことを記録し、その時点の状態を保存する）は一部採用とし、Rejected Options と次の design lane の入力に書く。安全の仕組みとしては採らない（計数 context は商品ごとの begin で受領上限と版を固定し、画面離脱で失効する。画面を開いた時点の全商品の状態は各商品の計数より古く、それで保存・判定すると ADR が退けた全商品一括の基準に戻る。時刻による比較も捨てた）。一方、計数の作業のまとまり（その日の開始と終了）の境界を残す考えは、次の design lane の候補（番号印字を作業の開始と終了に 1 回ずつ打ち、EJ の取引順で挟む案、2026-09-23 のレビュー）と同じ形なので、その lane へ渡す。㉘ に画面の開閉の記録を加えない。TD-023（評価額の丸め）は ADR の評価額の式（D1 :51）の丸めを変えないため本 ADR には置かない（docs 復元 lane が記録する）。
- R9（売上と返品の相殺への対策、TD-024）: 以下が現行の規則（Gated Amendment 3 の補足 3 までを反映。ADR D4「売上と返品の相殺」と D5 に置く）。置き換えた旧案と理由は末尾の「経緯」にまとめる。
  - 前提: Z004 は活動のない商品の行も数量 0 で出すため（Contract Probe）、数量 0 の行だけでは「動きなし」と「同じ精算内で売れて戻った」を区別できない。計数の前に売れて計数の後に返品されると、Z004 の純数量は 0 のまま帳簿が現物より 1 少なくなる（逆も同じ）。
  - 行ごとの判定: 数えた商品（判定不能の対象）の行のうち、数量 0 で金額が 0 でない行は動きの証拠なので、EJ を待たずに「相殺の行あり」とする。数量・金額とも 0 の行は同じ精算区間の EJ で判定し、完全な EJ の区間に当該商品を候補に含む明細の行（販売・戻・訂正・取消）が 1 つもなければ flag を付けず、1 つでもあれば「相殺の行あり」とする。行の有無だけを見るので区間の中の前後を問わず、時刻や番号印字による取引単位の前後判定を要しない。外部前提「未精算の売上がある PLU を PLU 書出しの clear 行で消せるか」が真の場合は、数えた商品のうち今回の Z004 に行がなく前回の Z004 にはある code の商品（廃番・code 変更の書出しの当日に売れて、未精算の売上ごと消えた商品を含む）を、数量・金額とも 0 の行として EJ で判定する（偽ならレジが clear を拒み、その商品は今回の Z004 に残るので、この規則は要らない。Gated Amendment 3 の補足 3、F5）。
  - EJ の明細の行の分類: 一致は、今回の Z004 の商品の名称（当該スロットの「キャラクター」欄。レジ側の名称で、今のマスタ名ではない）、部門名、前回の Z004 から対応が変わった名称を合わせて数える。(1) 商品の行 = 商品の名称か対応が変わった名称に一致する明細の行。候補の商品は、今回の Z004 でその名称を持つ商品（対応が変わった名称では、前回と今回の Z004 でその名称を持つ商品の和）。候補が 1 つで部門名とも一致しなければ、その商品の行である。複数の商品に一致する行（16 バイトの切り詰めによる同名を含む）、商品の名称と部門名の両方に一致する行（部門売りへ先に分類するとその商品の相殺を見逃すため）、対応が変わった名称の行は、候補の商品全ての行として扱い、区間を不完全にしない（名称の重なりの局所化）。(2) 部門売り = 部門名だけに一致する明細の行。既知の行として商品の判定から外し、区間を不完全にしない（店の日々のレジ登録は部門キーと金額が常態、台帳 L-001 / L-005 / L-088 / L-092）。(3) 明細でない行 = 合計・支払・税などの明細でない行。既知の行として外す。(4) 帰属できない行 = 明細の形で、どの商品の名称にも部門名にも前回の Z004 の名称にも一致しない行。どれにも一致しない行の判定は、前回の Z004 が受領済みのときだけ行う（前回の名称が分からないと帰属できるかを決められないため）。未受領の間は行の内容によらず EJ待ちとする（F2）。
  - 対応が変わった名称: スキャニングコードと名称の組の集合差 `{名称 | (コード, 名称) ∈ 前回 − 今回}`（消えた・別のコードへ移った・載るコードの組が変わった名称）。名称をキーにした対応表で比べると同名の 2 組が潰れるため、組の集合で比べる。レジ側の実際の状態を比べるので、アプリ側の書出し確認の時刻や受領順を使わない。価格だけ・廃番・名称変更・新しい名称の追加の書出しは、変わった名称の行があればその候補に相殺の行ありを付けるだけで、区間を確認待ちにしない。
  - 「前回」: 同じ machine_no の直前の settlement_no の Z004 で、EJ の区間の開始と連続（D5）が証明できるものに限り、受領順では選ばない。最初の区間と未受領の見分け方: その machine_no の Z004 をアプリが一度も受領していなければ最初の区間（前回が存在しない扱い）、受領したことがあり直前の settlement_no の Z004 だけが無ければ未受領とする。最初の区間の判定は EJ の有無より先に行い、Z004 の取込みの時点で登録の変化にする（EJ の取込みを案内しない）。settlement_no の戻り: 同じ machine_no で受領済みの最大の settlement_no より小さい settlement_no の Z004 は、前回を証明できない扱い（登録の変化）とし、以後の「前回」の候補は戻った後に受領した Z004 に限る（レジ入替・番号 reset の後に、戻る前の Z004 を前回と取り違えないため。F3）。
  - 完全な EJ（D5 の全条件）: Z004 と同じ精算であること（machine_no・settlement_no の一致）、精算の開始と終了・取引一連番号の連続・分割 file の続きがそろうこと、商品別の符号付き合計が同じ Z004 と一致すること。合計の照合は、候補の集合でつながる名称と商品をまとめた単位（連結成分）ごとに、その単位の EJ の行の符号付き合計とその単位の商品の Z004 の数量の合計を比べる（区間の途中の名称変更・入替えで前後に売れた場合に不一致にしない。名称が一意で部門名と重ならない商品では、単位はその商品だけ）。部門名とも一致する名称の行は部門売りと区別できないので、商品別の符号付き合計の照合から外す（その名称を含む単位は合計を照合しない。その名称の行が 1 つでもあれば候補は相殺の行ありになるので、見逃しにはならない）。Z004 側の合計は slot（code）単位で数え、アプリの商品に対応しない slot も含める。F5 の外部前提が真の場合は、今回の Z004 に行のない code（前回の Z004 にはある code）の商品を含む単位は合計を照合しない（未精算の売上が clear で Z004 から落ちうるため）。
  - 区間全体の確認待ち（次の 2 種に限る。対象はその区間で数量・金額とも 0 の数えた商品の全て。今回の Z004 に行がない商品〈PLU 未登録の商品〉は含まない。F5 の前回の Z004 にはある code の商品だけは例外として含む）:
    - 相殺の確認待ち（EJ待ち、`offset_check_pending`）: 区間の EJ が取り込まれていない・完全でない場合と、前回の Z004 が未受領なだけの場合。区間の EJ か前回の Z004 が後から取り込まれた時点で BIZ が次の順で再評価する（F6）。まず帰属できない行の有無（前回の Z004 が受領済みのときだけ判定する、F2）と前回の証明を判定し、帰属できない行があるか前回を証明できなければ登録の変化へ変える。どちらも無く、それ以外の理由で完全でなければ EJ待ちのまま残す。どちらも無く完全なときだけ、当該商品を候補に含む行の有無で決め、なければ解消、あれば相殺の行ありとする。
    - 相殺の確認待ち（登録の変化、`offset_mapping_changed`）: 区間の EJ に帰属できない行がある場合と、前回を証明できない場合（最初の区間と、前回の Z004 はあるが区間の開始と連続を証明できない場合）。前回を証明できないとは、EJ に区間の開始の証拠はあるが受領済みの前回の Z004 と一致しない場合をいう。開始の証拠が EJ に無い場合は不完全（EJ待ち）とする（F4）。EJ を取り込み直しても解消しないので、EJ の再評価の対象にしない。ただし前回が存在しない（最初の区間）による登録の変化は、直前の settlement_no の Z004 を受領した時点で EJ待ちと同じく再評価し、その文言は数え直しだけでなく「直前の精算の商品別 CSV を取り込むか、今の数を確認してください」の趣旨で直前の Z004 の取込みも案内する（Coordinator の裁定 2026-09-24。数え直しだけを案内すると、取込みで解消する区間で余分な数え直しを招くため）（今日の Z004 と EJ を先に取り込み、直前の Z004 を後から取り込んだ場合に、受領順で判定を凍結しないため。F1）。文言は数え直しだけを案内する。
    - 2 種とも他の理由と同じく進行中の確定を止め、準備表示に出て、数え直しで解消する。どちらも EJ や前回の Z004 の取込みに失敗した日と、レジの登録を前回と今回の Z004 から説明できない区間だけの例外の保守的な扱いで、通常は R10 により EJ がそろい、PLU 書出しや名称の重なりでは確認待ちにならない。
  - 準備表示の理由と文言: 40 / 41 の数え直し対象に型付きの理由を加える。1 商品に理由の違う flag が複数あるときは、相殺の確認待ち 2 種以外が 1 つでもあれば「取り込んだ後に数の再確認が必要です」、確認待ちだけで登録の変化が 1 つでもあれば数え直しだけを案内する文言、全てが EJ待ちのときだけ EJ待ちの文言（R7）を示す。EJ待ちの中では、EJ が無い・不完全の側が 1 つでもあれば EJ の取込みを案内する文言、全てが前回の Z004 の未受領のときだけ前回の商品別 CSV の取込みを案内する文言とする。
  - 受け入れる限界（ADR Consequences に書く）: (a) 1 つの区間の中で書出しが 2 回以上レジに反映された場合（名称が変わって元へ戻る場合を含む）は、途中だけに使われた名称を検出しない。途中の名称がどの名称にも一致しなければ帰属できない行として登録の変化になるが、今回の別のコードの名称と一致したときはその名称の候補だけに帰属し、本当の商品の相殺を見逃すか、別の商品に誤った相殺の行ありを付ける。反映が区間に 1 回以下なら行の本当の商品は候補に含まれ、見逃しは起きない（Fable 5.1 の相談、2026-09-24）。店は書出しを 1 日に何度もレジへ反映する運用ではないため受け入れる。塞ぐ案（アプリが書き出した組のうち今回の Z004 にないものの名称も対応が変わった名称に含める）は、履歴の範囲を決めないと名称を別の商品へ使い回したときに区間が不完全のままになるため採らず、ADR の Revisit Trigger に書く。(b) 名称が重なる行の候補は余分に広がり、動きのない商品にも数え直しが要ることがある（見逃さないための費用）。(c) 部門名は Z004 どうしの比較に含めない。区間の途中で部門名が変わり、旧部門名が今回の商品の名称と一致するとその商品に誤った相殺の行ありが付き、どの商品の名称にも部門名にも一致しなければ、その行は帰属できない行として区間が登録の変化になる。どちらも見逃しではなく数え直しが増える側なので受け入れる。(d) PLU 商品を部門キーで売った分は Z004 にも EJ の商品の行にも現れず見えない（既存の残存限界）。
  - 運用の前提と別 lane: 本番で最初の計数を始める前に、その直前の精算の Z004 を取り込んでおく（最初の区間は登録の変化になり、「前回」は直前の settlement_no なので、それより古い Z004 では足りない）。ADR Consequences と Ordinary Operation に書く。名称の重なりの検知（PLU 書出しの時点と準備照会で、切り詰めた後の名称が他の商品や部門名と重なることを知らせる）と登録名の付け直しの支援は、PLU 書出し側の別の lane とし、R10 (a) の解除の条件に含める（TD-027 / TD-028）。
  - 不採用: (a) 数量 0 の行を全て要再確認にする（L-101 (1)。TD-024 で置換）。(b) 対策なしで残存 risk として受け入れる（owner が対策を講じたいとした）。(c) 確認待ちを警告だけにして確定を通す（利用者の注意に頼る。TD-007 / L-104）。(d) 数量 0 の行そのものを相殺の兆候とみなす（活動のない商品の行も出るので全商品に付くのと同じ）。
  - 実機・承認済みサンプルで確かめる外部前提（崩れた場合は、帰属できない行か合計の不一致として確認待ちへ倒れる）: 戻の行に商品名が載るか（EJ に返品モードの取引があることはサンプルで確認済み、ADR Evidence :339）。訂正・取消の行の形と、店がそれらを使うか（TD-026）。値引き（％－キー）の行の形と分類（TD-026）。EJ の精算区間と Z004 の対応（D5）。16 バイトのレジ名称の重なりの程度（重なると候補の商品が余分に相殺の行ありになる）。締めの時点で同じ日の EJ を SD から取れること（TD-014）。未精算の売上がある PLU を PLU 書出しの clear 行で消せるか（消せると計数後の販売が Z004 から落ちうる。真なら行ごとの判定と完全な EJ の F5 の規則を当て、偽なら不要）。Z004 の settlement_no は Z004 ごとに 1 ずつ増える（他の Z 帳票と共有のカウンタでない。「前回」を直前の settlement_no で決める前提、F3）。
  - 経緯: 起票時の R9 は完全な EJ と行の有無で分け、EJ が無い・不完全・特定不能なら区間の数えた商品を全て確認待ちにした。その後の Final Review broad で、区間全体を確認待ちにする条件が動きのない数えた商品を全て確認待ちにして TD-024 と矛盾することが続けて見つかり、次のとおり置き換えた。(Gated Amendment 1 で置き換えた旧案: 前回の Z004 の取込みより後に PLU の書出しがないことを完全な EJ の条件にする。価格改定の書出しのたびに次の区間全体を不完全にした。broad 1 回目 P2-1 / P3-1) (Gated Amendment 2 で置き換えた旧案: 前回と今回の Z004 のスロットと名称の対応が変わっていないことを条件にする。廃番・名称変更の書出しのたびに区間全体を不完全にした。broad 2 回目 P2-1 / P3-1) (Gated Amendment 3 で置き換えた旧案: 対応が変わった名称の明細の行、複数の商品の名称に一致する行、部門名と同じ名称の商品の行を帰属できない行として区間全体を不完全にし、名称が一意でない区間の数えた商品を全て確認待ちにする。16 バイトの切り詰めや部門名との一致で名称が重なる商品が売れるたびに区間全体が確認待ちになり、EJ の再取込みでも解消しなかった。broad 3 回目 P2-1、owner 判断 TD-027 で候補の商品に局所化) (Gated Amendment 3 とその補足で置き換えた旧案: 前回を証明できない区間は全て不完全とする。前回の Z004 が未受領なだけの区間は EJ待ち、前回が存在しない最初の区間は登録の変化とした。broad 3 回目 P3-1 / P3-2) Gated Amendment 3 の補足 2 で、合計の照合の単位（部門名とも一致する名称の除外、連結成分）と最初の区間・未受領の見分け方、部門名の変更による登録の変化の受入れを加えた（GA3 の closure 確認 N1 / N2 / N3 / N6）。Gated Amendment 3 の補足 3 で、最初の区間の登録の変化の直前の Z004 による再評価、前回の Z004 が未受領の間の帰属できない行の扱い、settlement_no の戻り、前回を証明できない場合と不完全の区別、clear 行で消えた code の商品の扱い、再評価の判定の順序を加えた（相談役 Fable 5.1 の検討 F1〜F6。中核の規則に相殺の見逃しの反例はなかった）。
- R10（在庫連動の有効化の条件）: ADR Consequences :316 の方針（PLU の本番は EJ の取得・欠落時の拒否・再実測による復旧を実機で確かめてから有効化する）を仕組みにする。(a) 準備照会は、㉘ の build では DB を入力にせず `ej_unverified` を常に返す。これを外すのは、EJ の日次取込みと R9 を実装する lane の code 変更だけで、その lane の merge 条件は 32 の外部 probe 表の EJ 3 行（EJ 完全性・EJ 復元・商品同定）について owner-operated gate の証拠があること。解除の条件には、PLU 書出しの時点と準備照会で切り詰め後の名称が他の商品や部門名と重なることを知らせる検知と、登録名の付け直しの支援が入っていることも含める（owner 判断 2026-09-24、TD-027 / TD-028: 店は色違いや同名の商品が多く、これからアプリで手芸用品を PLU に登録すると名称の重なりは少なくないと見込まれ、重なりが多いと相殺の判定で候補の商品の数え直しが増えるため、PLU の本番より前に必須。現状の PLU の登録名は判断材料にならない）。S4 で 32 の同じ表の EJ 復元と商品同定の行に、R9 の行の分類（商品の行・部門売り・明細でない行・帰属できない行）と値引きの行（％－キー、TD-026）の分類を観測対象として加え、解除の証拠に含める（Plan Review round 3 N3）。DB の flag、設定 key、確認 checkbox、EJ を 1 回取り込んだ事実では外れない（D5 :153 の parser の導入日や設定 flag で満たした扱いにしない、と同じ趣旨）。外した後に EJ が欠けた日は R9 の確認待ちだけで扱う。(b) `ej_unverified` の間、BIZ-01 は在庫連動の false→true の遷移と、新規作成の商品・商品一括 import の新規行での true の設定を拒否する。true→true（既存の有効設定のままの更新）は許可し、既存の有効設定は本番前 preflight に対象を示す（自動で書き換えない）。既定値は BIZ が false にする（`30` の一括 import の省略時）。`51` の pcs 商品の提案値は UI が計算する（51 :126）ため、51 の proposed 節に「UI は `get_pos_stock_readiness` が `ej_unverified` を返す間、pcs 商品の提案値を false にする」を書く（Plan Review round 3 N2）。DB の `DEFAULT 1`（master-tables :42）は変えない。(c) 拒否は既存の `CmdErrorKind::Validation` と field `pos_stock_sync` で返し、message は BIZ が作る。51（UI-01b）は在庫連動の checkbox の近くに「電子ジャーナルの毎日の取込みが使えるようになるまで、在庫連動は有効にできません」を表示し、入力を保持する。60（商品一括 import）は既存の行単位の validation と同じく当該行を error 行として示し（同じ文言）、他の正常行の取込みは続ける（TX 全体は拒否しない）。(d) R10 を外した後、在庫連動したことのない商品を初めて true にするとき、在庫連動なしで取り込んだ売上がその商品にあれば、その最後の売上の資料を計数開始前に受領していた（`source_id <= source_cursor`）適用済み実測を要求し、未達なら `recount_required` で拒否する（30 :11 の再有効化の規則と同じ趣旨の、より強い基準を初回に当てる（2 回目 P3-5）。初導入で売上だけの期間に本番の販売がなければ該当しない。Gated Amendment 1、Final Review broad P3-2: 旧文の「true 化より後の適用済み実測」は、拒否と読むと永久に有効化できず、許可と読むと実測を強制する仕組みがなかった）。(e) ㉘ の test と Windows L3 (c) の在庫連動商品は、既存の test 用 seed（`src-tauri/src/db/test_support.rs`、`src-tauri/src/biz/csv_import_service/test_support.rs`）と、それで作った L3 用 fixture DB の既存の有効設定（true→true）で用意し、UI の有効化操作には頼らない。根拠: D-070（v1.0 は自動在庫連動の完成を待つ、owner 2026-09-22 の再確認）と、EJ がないと複数日の棚卸しが毎晩の要再確認で確定に届かないこと（Plan Review round 1 P1-1）。

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
| SPEC-STK-TIME-REV-2026-09-23 R10 | S1 / S4 | AC10、Matrix M10 | 有効化の拒否が checkbox や設定 key で外れないか | Contract Audit |
| SPEC-STK-TIME-REV-2026-09-23 R8 | S1 | Matrix M8 | 要旨だけで原文を置かない、置き場所 | Contract Audit |
| REQ-205 / REQ-401 | S1〜S8 | AC6 | 要求 token の不変 | `rg -o 'REQ-[0-9]+'` の比較 |

## Data Safety

- commit しないもの: 実 POS の CSV・EJ・DB・backup・receipt、店舗の実値。回答台帳とレビューの原文（`.local/` と個人領域に置いたまま。本 packet は台帳の番号と要旨だけを引く）。
- local-only: `.local/reports/store-premises/`、`.local/consultations/`、session 535b4afb の subagent 記録。
- synthetic-only: `scripts/probes/stocktake_time_model.py` の合成値。

## Owner Answers

起票中に owner へ確認した 2 問と回答（2026-09-24、台帳 追補3）。反映先は Spec Contract。

- Q1 →TD-025: owner の見立てでは、「今から数える」を押してから棚へ行って数え、机へ戻って保存する流れは成り立つ。棚卸し画面の開閉を記録してその時点の状態を保存する案も出た → R8（一部採用、次の design lane へ）。
- Q2 →TD-024: 要再確認は数えた後に売れた商品だけに付け、売上 0 の行には付けない。売上と返品の相殺で 1 つずれる余地には対策を講じたい → R3 / R9 / R10。

## Implementation Results

Fill after implementation.

Do not transcribe exact-HEAD SHA or test counts here (D-035/D-038 Evidence Ownership). Record a qualitative summary and the PR link only.

## Review Response

- Findings Freeze: not yet frozen; post-freeze exceptions: none.

### Plan Review round 1（2026-09-24、Opus 5.5 fresh、対象 plan-first `c2926c6f`、裁定 Coordinator）

- 冒頭の判定: 具体的な反例あり（EJ の取込みがない ㉘ 単体では、毎晩の Z004 が数えた全 PLU 商品に要再確認か確認待ちを付け直し、複数日の棚卸しが確定に届かない）。P1 1 / P2 4 / P3 9。
- P1-1 = 採用、案 (a) を仕組みとして採る → R10（`ej_unverified` が残る間は在庫連動の有効化を拒否）、Ordinary Operation の EJ ありを通常の歩き方に書き直し、㉘ 単体の状態の行を追加、Ledger / Matrix M10 / AC10。根拠 D-070 と初導入。
- P2-1 = 採用 → EJ なしで全ての 0 行が確認待ちになる場合を「その日の EJ の取込みに失敗・欠落した例外」に限定（R9）。Owner Answers Q2 を台帳の強さ（講じたい）へ戻した。
- P2-2 = 採用 → R9 の完全な EJ を D5 の全条件で定義（同じ精算、D5 :159 の商品別合計、D5 :160 の帰属できない行）、照合はスロットの「キャラクター」欄で 5000 スロットと部門名に対し一意。帰属できない行があれば区間の 0 行を全て確認待ち。AC5 に (d) と mutation (v)。
- P2-3 = 採用 → AC2 (iii) の和文・別表記の検索、除外、改訂前 19 file・90 行を実測して記録。
- P2-4 = 採用 → R7 に ㉘ / EJ parser lane / 次の design lane の担当、parse.rs:94 の修正、EJ 取込み機能がない間の UI 文言。
- P3-1〜9 = 全件採用 → 行 100 の例を同じ日の販売と返品の間で数える例へ、TD-025 を見立てへ弱め往復の順序を明記、確定後の準備表示の規模、戻の行の商品名は未確認と書き分け、数量 0・金額あり → 相殺の行あり、Test Plan の mutation 数と S8 の R9、Ledger の D7 行と S1 の Consequences :314、L-098 / L-099 の括弧を外した要旨、flag の理由を「計数と前後不明の販売」へ改名し legacy の理由を明記。

### Plan Review round 2（2026-09-24、Opus 5.5 fresh、対象 `a7841609`、裁定 Coordinator）

- 冒頭の判定: 具体的な反例あり（店の日々のレジ登録は部門キーと金額なので、R9 を文字どおり実装すると部門売りの行で毎日の EJ 区間が不完全になり、複数日の棚卸しが確定できない）。P1 1 / P2 2 / P3 7。いずれも round 1 で加えた R9 / R10 への指摘。round 1 の P2-1 / P2-3 / P2-4 は閉鎖を確認。
- P1-A = 採用 → R9 で EJ の行を 4 つに分類（商品の行・部門売り・明細でない行・帰属できない行）。部門売りと明細でない行では区間を不完全にしない。PLU 商品を部門キーで売った分が見えないことを既存の残存限界として ADR へ。値引き行（TD-026）を外部前提へ。AC5 (d) に部門売りの assert。
- P2-A = 採用 → R10 (b)(c)(e): 拒否は false→true と新規 true だけ、true→true は許可、`ej_unverified` の間の既定値・提案値は BIZ が false、DB の DEFAULT 1 は不変。拒否は既存 `validation`・field `pos_stock_sync`、51 / 60 の文言、60 は行単位の error で TX 全体は拒否しない。Scope に 40 / 51 / 60 / master-tables の節を追加、AC10 を拡張。㉘ の test と L3 の在庫連動商品は既存の seed と fixture DB の true→true で用意。
- P2-B = 採用 → R10 (a): ㉘ の build では `ej_unverified` を常に返し、外すのは EJ 日次取込みと R9 の lane の code 変更だけ、その merge 条件は 32 の EJ 3 行の owner-operated gate の証拠。外した後の EJ 欠落日は R9 の確認待ちだけ。
- P3-1〜7 = 全件採用 → Matrix の Residual を R7 / R10 に合わせる、Boundary の UI 文言を R7 に合わせる、行 98 の在庫連動と PLU 対象の区別、行 103 の R10 の説明、AC2 (iii) で R1 の肯定文を除く方法、R10 (d) 初回の有効化の実測基準、R9 の PLU 書出し後の区間を不完全とする受領順の条件、R7 の R10 の順序。

### Plan Review round 3（2026-09-24、Opus 5.5 fresh、対象 `111105be`、裁定 Coordinator、round 天井）

- 冒頭の判定: 行 95 / 98 は外部前提が未確認（TD-025 は owner の見立て、R9 の EJ の行の形は実機未確認 TD-014 / TD-026）、他の行は成立。複数日の数値例は手計算で確定に届くことを確認。P1 0 / P2 0 / P3 3。round 2 の P1-A / P2-A / P2-B / P3 全件の閉鎖を確認。
- N1 = 採用 → round 2 で Scope を広げた後の数字と一覧を直した（AC2 (iii) の file 数と増えた file の扱い、Required Design Artifacts の master-tables / 51 / 60、R と M の範囲、Matrix の Adjacent Pattern Audit）。
- N2 = 採用 → R10 (b): 51 の提案値は UI が準備照会の `ej_unverified` から false にすることを明記。
- N3 = 採用 → R10 (a): 32 の外部 probe 表の EJ 復元・商品同定の行に R9 の行の分類と値引きの行の分類を加え、解除の証拠に含める。
- 通過: P1/P2 = 0。round 天井 3 に到達し、次 round を開始しない。

### Final Review broad（2026-09-24、Opus 5.5 fresh、対象 `02574656`、裁定 Coordinator）

- 冒頭の判定: 行 101 / 103 は具体的な反例あり（PLU 書出しの翌日、動きのない数えた商品が全て相殺の確認待ちになる）、行 96 / 99 は外部前提が未確認、他は成立。R1〜R10 は反映済み、AC1〜AC10 は期待どおり、合成モデルの mutation は reviewer の追加 12 種のうち 11 種が red（残る 1 種は版の検査で実害なし）。P1 0 / P2 1 / P3 5。
- P2-1 = 採用、案 (a) → Gated Amendment 1 で R9 の条件を Z004 どうしのスロットと名称の対応の比較へ置き換え（価格だけ・名称の追加では不完全にしない）。案 (b)（記述を直して受容する）は TD-024（要再確認は数えた後に売れた商品だけ）と矛盾するため採らない。
- P3-1 = 採用 → 同じ置き換えで閉じる（レジ側の実際の状態を比べ、アプリ側の書出し確認の時刻差に依らない）。区間内で名称が変わって戻る場合を残る限界として ADR へ。
- P3-2 = 採用 → R10 (d) を `source_id <= source_cursor` の適用済み実測と `recount_required` の拒否へ。
- P3-3 = 採用 → 40 / 41 の数え直し対象に型付きの理由、複数の理由の優先順位。
- P3-4 = 採用 → ADR に準備 issue の code 名 `recount_after_import` を書く。
- P3-5 = 採用 → `docs/architecture/biz-task-specs.md` の PLU 書出しの記述に、R9 の条件が PLU 書出しの意味を変えないことを合わせる（旧案の受領上限の記録は不要になる）。

### Final Review broad 2 回目（2026-09-24、Opus 5.5 fresh、対象 `9c901ea2`、裁定 Coordinator）

- 冒頭の判定: 行 102〜104 は具体的な反例あり（廃番・名称変更の書出しの翌日）、行 97 / 100 は外部前提が未確認、他は成立。R1〜R10 と GA1 は反映済みで文書間も一致、合成モデルの mutation は reviewer の追加分を含めて 1 種（等価変異）を除き red。P1 0 / P2 1 / P3 5。
- P2-1 = 採用 → Gated Amendment 2 で区間単位の判定を名称単位へ細かくする（変わった名称の行が区間にあるときだけ不完全）。GA1 を維持して受容を求める案は TD-024 と矛盾するため採らない。
- P3-1 = 採用 → 「前回」を同じ machine_no の直前の settlement_no で EJ の連続が証明できる Z004 に限り、対応の単位をスキャニングコードと名称の組にする。
- P3-2 = 採用 → 最初の計数の前に Z004 を取り込んでおくことを ADR Consequences と Ordinary Operation へ。
- P3-3 = 採用 → R7 から受領上限の記録を外し、EJ parser lane に Z004 ごとの組の保持と変わった名称の集合の算出を加えた（GA1 の sweep 漏れ）。
- P3-4 = 採用 → flag の理由を 5 値にし、取込み漏れと対応の変化の確認待ちを分け、優先順位を定めた。
- P3-5 = 採用 → R10 (d) の括弧を直す。再有効化の規則（30 :11）の既存の穴（在庫連動をやめた後の売上だけの取込み）は本 lane の Non-scope のため closeout で backlog へ。

### Final Review broad 3 回目（2026-09-24、Opus 5.5 fresh、対象 `4913921d`、round 天井、裁定 Coordinator と owner）

- 冒頭の判定: 行 104 は具体的な反例あり（名称が重なる商品が売れた日）、行 99 / 102 は外部前提が未確認、他は成立。R1〜R10、GA1 / GA2 は反映済みで文書間も一致。Writer の解釈 (a)(b)(d)(e)(f) は妥当、(c) は P2-1 に含む。P1 0 / P2 1 / P3 6。
- P2-1 = round 天井のため owner へ disposition。owner 判断（2026-09-24）: 候補の商品だけに絞るのが必要で、PLU での名称の重なりを検知できるならそのほうがよく、登録名の付け直しもできるようにする。16 バイトで重ならない名称を店に付けてもらう運用は難しい → Gated Amendment 3 で局所化（本 PR）、検知と付け直しの支援は PLU 書出し側の別 lane として closeout で backlog へ。
- P3-1 / P3-2 / P3-5 / P3-6 = 採用、GA3 で R9 へ。P3-3 = 採用、GA3 で packet と Matrix を sweep。P3-4 = 採用、AC5 (g) と mutation (x)。

### GA3 closure 確認（2026-09-24、Opus 5.5 fresh、対象 `8a91e26c`、裁定 Coordinator）

- 冒頭の判定: GA3 の差分（名称の重なりと対応が変わった名称の行の局所化、区間全体の確認待ちの 2 種、前回の Z004 が未受領なだけの区間の EJ待ち）は ADR と source に反映済み。合成モデルの (g) は空の oracle でない。Writer の解釈 (a)(c)〜(g) は妥当、(b) は N1 / N2 で修正。P1 0 / P2 1 / P3 5。
- N1（P2）= 採用 → R9: 部門名とも一致する名称の行は部門売りと区別できないので、商品別の符号付き合計の照合から外す（その名称の行があれば候補は相殺の行ありになり、見逃しにはならない）。AC5 (h) と mutation (xi)。
- N2（P3）= 採用 → R9: 名称が重なる・対応が変わった名称の合計の照合を、候補の集合でつながる名称と商品の単位（連結成分）で行う。AC5 (h) と mutation (xii)。
- N3（P3）= 採用 → R9: その machine_no の Z004 を一度も受領していなければ最初の区間（登録の変化）、受領したことがあり直前の settlement_no の Z004 だけが無ければ未受領（EJ待ち）。最初の区間の判定は EJ の有無より先に行う。R7 の ㉘ の担当に加えた。AC5 (h) と mutation (xiii)。
- N4（P3）= 採用 → 台帳に TD-028 を追記済み（owner の追加の判断: 同名の重なりは少ないとは言えず、検知と付け直しはどのみち必須。現状 PLU はまともに使えていない）。R10 (a) の出典を TD-027 / TD-028 とした。
- N5（P3）= 採用 → 本補足で packet の GA 前の文を sweep した（R9 を現行の規則で書き直し、旧案は経緯の括弧へ。R3 / R7 / Ordinary Operation / AC5 / AC9 / Contract Probe / Boundary / Review Focus / Test Plan、Matrix の M9 と flag の行）。
- N6（P3）= 採用 → R9 の受け入れる限界 (c): 区間の途中で部門名が変わり旧部門名がどの名称にも一致しない行は、帰属できない行として登録の変化になる（部門名は Z004 どうしの比較に含めない）。見逃しではないので受け入れる。

### 相談役の検討（2026-09-24、Fable 5.1、read-only、対象 `29f49267`）

- 結論: 中核の規則（候補の商品への局所化・合計の照合の連結成分・部門名とも一致する名称の除外）に、相殺の見逃しの反例はない。次の F1〜F6 と明確化 2 点で塞ぐ余地があるとした。裁定 Coordinator、全件採用（Gated Amendment 3 の補足 3）。
- F1（最初の区間の判定が受領順に凍結する）= 採用 → R9 の登録の変化: 最初の区間による登録の変化は、直前の settlement_no の Z004 の受領で EJ待ちと同じく再評価する。AC5 (i) と mutation (xiv)。
- F2（前回の Z004 が未受領のまま帰属できない行を判定する）= 採用 → R9 の行の分類 (4): 帰属できない行の判定は前回の Z004 が受領済みのときだけ行い、未受領の間は EJ待ち。AC5 (i) と mutation (xv)。
- F3（settlement_no の戻り）= 採用 → R9 の「前回」: 受領済みの最大より小さい settlement_no は前回を証明できない扱い（登録の変化）、以後の前回の候補は戻った後の受領に限る。外部前提に settlement_no が Z004 ごとに 1 ずつ増えることを加えた。AC5 (i) と mutation (xvi)。
- F4（EJ の先頭欠けが前回を証明できないに落ちる）= 採用 → R9 の登録の変化: 前回を証明できないは、開始の証拠が受領済みの前回と一致しない場合に限り、開始の証拠が無ければ不完全（EJ待ち）。AC5 (i) の assert。
- F5（廃番・code 変更の書出しの当日に売れ、clear 行で未精算の売上が落ちる）= 採用 → R9 の行ごとの判定と完全な EJ: clear 行の外部前提が真の場合に、今回の Z004 に行がなく前回にはある code の数えた商品を数量・金額とも 0 の行として EJ で判定し、その code を含む単位は合計を照合しない。偽なら不要。AC5 (i) の assert。
- F6（判定の順序）= 採用 → R9 の EJ待ちの再評価: 帰属できない行と前回の証明を先に判定し、どちらも無いときだけ行の有無で解消か相殺の行ありを決める。R3 / R7 の遷移の記述も同じ順にした。AC5 (i) と mutation (xvii)。
- 明確化 = 採用 → R9 の区間全体の確認待ち: 対象に今回の Z004 に行がない商品（PLU 未登録の商品）を含まない（F5 の商品だけ例外）。R9 の完全な EJ: Z004 側の合計は slot（code）単位で、アプリの商品に対応しない slot も含める。
