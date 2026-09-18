# Plan Packet: ㉗ 棚卸しと後着売上の時点証拠（STK-1 / STK-2、design-only、R3）

2026-09-16起票、2026-09-18にownerがCodexへ設計を委任。起票時の資料と旧案は内容commit feeb3fe9、および本書末尾の非遡及なReview Responseで追跡できる。現在の設計案は [時点証拠ADR](../adr/2026-09-18-stocktake-time-evidence.md) に一本化する。旧案の実装指示や数値oracleを現在の契約として使わない。

## Workflow State

- Evidence Mode: github
- Phase: design
- Risk: R3
- Execution Mode: codex-only
- Plan Commit: pending
- Amendments: none
- Coordinator: Codex（ownerの明示した設計委任による起草・統合。Human Gateと正式なreview承認は代行しない）
- Writer: Codex（このturnは設計文書と合成モデルのみ。runtimeは未着手）
- Plan Reviewer: Sonnet + Opus（非Codex vendorのfresh context。今回の統合案の正式Plan Gateは未実施）
- Final Reviewer: Sonnet + Opus（Writerと独立したfresh context）
- Final Review Minimum: 2
- Human Gate: ready,merge

ownerの今回の指示は設計の引継ぎを許可する。実装開始・Ready・mergeの許可には読み替えない。現在のsource docsは現行実装の契約を保持し、改訂候補はADRへ案内する。詳細シグネチャ・migration・UI契約の同期と独立Plan Gateが揃うまでPhaseを前進させない。設計の技術的選択は委任範囲で詰め、未確認の店舗運用・ハードウェア事実を受容済みにしない。

遷移記録（append-only）:
- kickoff → spec-check → design（`24294ec4`）: Risk R2（docs-only。BIZ-06 / BIZ-03 / UI-10 の設計正本と decision-log を更新し、runtime 契約はこの lane では変えない）。Design Phase = 本 packet で方式を比較し Coordinator 既定案を置く。owner 回答待ちのため plan-draft へは進めない（DEV_WORKFLOW「design → plan-draft: no unresolved design questions」）。
- design → plan-draft → plan-gate（本 commit）: owner 回答（Q1 / Q3 candidate 採用、反例 2 件）と Opus 設計レビュー round 0 を `fd28766d` で反映、Q2 は店の回答「時間帯は関係なし、売れたらその場で訂正」で (b) `<=` に確定（未解決の設計質問なし）。docs-only R2 のため Test Matrix は本 packet の AC1〜AC9。Plan Review は Sonnet + Opus の独立 fresh context。
- plan-gate → design（state-backtrack、2026-09-17）: owner が Q2「同日販売はカウント前扱い `<=`」の一律適用を不承認（「実測の再入力と、販売に伴う数量訂正を区別し、記録済み入出庫・POS 販売・返品を混ぜても重複や欠落が起きない契約を先に定める」）。未解決の設計質問が復活したため design へ戻す。Plan Review は round 天井 3 に到達済み（round 1 Sonnet / Opus、round 2〜3 Sonnet closure）で disposition = owner escalation。設計確定後の plan-gate は D-D4 / Q2 の契約本体が変わるため新しい rally として round を再計上する。
- design → plan-draft → plan-gate（本 commit、2026-09-18）: 未解決の設計質問を解消。Q2 = owner 回答 2026-09-18（決めること 3 点: ゼロ行を含む保守案 / 余裕幅 10 分・条件付き / 完了済みへの後着は判定不能なら取込み全体を保留）と保留の出口の方向指示（現物数の入力・保存を新しい基準にする。確認チェックだけ・既存導線前提は不可）を D-D4 同日規則 / D-D8 / D-D9 へ反映。D-D9 の解除方式は Coordinator 案で、Plan Review の検証対象に置く。子 ID の衝突（`BIZ-03-D1` は 32 で使用済み）を D2〜D5 へ振り直し。Plan Review は新しい rally（round 1 から、Sonnet + Opus の独立 fresh context）。
- plan-gate → design（state-backtrack、2026-09-18）: owner は Plan Gate と介入上限 8 を承認したうえで、同じ発言で設計要求を追加した =「仕組みで守る = 人が間違えた場合に検知・停止・訂正できる設計。設計で防げるのに運用へ委ねている部分を先に塞ぎ、そのうえで残存リスクを提示する」「EJ は PLU 販売の本番開始の前提、欠落・不完全・判定不能は実行拒否まで」「保留解除後でも誤った再実測を訂正できる導線」。D-D4 の判定の土台（日付比較）が変わる案を含むため、未解決の設計質問ありとして design へ戻す。Plan Commit は pending のまま。案は「設計判断」節の D-D10 候補、owner 回答後に D-D4 / D-D8 / D-D9 / Scope / AC を同期して新しい rally で Plan Review。

引継ぎ（phase変更なし、2026-09-18）: owner「普通に君に設計任せる」を受領。反例ごとの条件追加を止め、時点証拠・復旧・保存順序をADRへ統合する。新しいsource契約はDB/command/保存・訂正の操作を直接定めるため、影響基準でRiskをR3へ更新しMatrixを作成する。旧rallyの評価はその対象commitに対する履歴として保持し、新案の承認には流用しない。

## Owner Effort Budget

- 介入回数上限: 8（既存のowner承認を維持）
- 介入実績: 旧packetの記録7/8に今回の設計委任を加え8/8として扱う。このturnでは追加の選択・承認質問を出さない。後段の新たなHuman Gate依頼前に予算を明示して調整する
- 実働時間上限: 60分（既存承認。ownerの実測作業時間は未実測）
- relay往復上限: 2（ownerを伝書鳩にせず、read-only reviewは担当が回収する）
- Plan Review round 天井: 3。今回の統合案の正式rallyは未開始。早期の設計点検をPlan Gateの承認と呼ばない

このturnの最小完了経路は、設計案・反例検証・残る外部検証条件をレビュー可能な形で渡すこと。追加の証跡儀式やruntime実装へ広げない。

## Consultation Relay

- Review Order Artifact: 設計点検はADR・Matrix・合成モデルを指定したread-only依頼。正式Plan Gate発注はplan-draft完成後
- Review Order Ref: pending（正式Plan Gate未実施）

## Risk

Risk: R3

Reason: 現在のdiffは設計文書と合成probeのみだが、定める契約はDBの永続化・POS取込み・command token・棚卸し保存・訂正・移行に及ぶ。Riskはfile種別でなく影響で判定する。runtime lane㉘もR3で、別のplan-first commitと必要な実装検証を持つ。

## Goal

Goal Invariant: 実測より後の記録済み入出庫を棚卸し確定で消さず、実測へ含まれた後着売上を二重に反映しない。アプリが検知できる状態変化は保存前に止め、前後を証明できない取込みは再確認へ回し、誤った実測は後から現在の現物で訂正できる。提供されていない事実を正しいと推測しない。

### 最小完了条件

- 実測・受領・精算区間・在庫ledgerの意味と前後判定が、ADRだけで追える。
- 通常、初回、時計不明、EJ不完全、同秒、取消、途中再開、旧DBについて拒否と復旧が定義される。
- 設計モデルが主要な数値反例を再現し、採用案のassertが通る。
- Matrixがruntimeで必要な検証と、モデルでは証明できない境界を分ける。
- 本書・Plans・source docの案内が、現行実装と提案を混同させない。

### 失敗定義

未検証の時刻へ仮値を入れる、安全を任意の60分や確認チェックで保証する、同秒の順序をtimestampで決める、旧snapshotを新方式へ読み替える、Plan Gate前にruntimeを書く、未実施のレビュー・実機検証を完了と表現すること。

### 非目的

棚卸し確定の取消、過去評価額の自動訂正、部門売りの商品配賦、DATA-2全体の解消、実POSデータのgit格納、実機への書込み、Ready/merge。

## 設計判断と保持する合意

現在の詳細はADRのSPEC-STK-TIME-D1〜D9を正とする。

| 既存判断 | 現在の扱い |
|---|---|
| D-D1 / D-D2 | 実測時snapshot、補正N-Lを維持。計数contextと版・cursorを加える |
| D-D3 | カウント時在庫・入力値・差を維持。古い入力を現在の実測として再送しない |
| D-D4 | 日付/保存時刻だけの比較を廃止する案。受領順と証明済みの時間範囲で分類 |
| D-D5 | 最初の有効な吸収先を補正する方針を維持。秒精度timestampでなくledger cursorと実測順序 |
| D-D6 / D-D7 | durable判断はsourceへ。過去評価額は非遡及、現在庫復旧と区別 |
| D-D8 | 要再確認は永続化し、force_fillで迂回不可。ゼロ行も検査 |
| D-D9 | 商品ごとの独立再実測を維持。取消で消さず、過去の記録からも訂正可能 |
| D-D10 | 仮始端・一律60分・大差閾値を安全条件にする案は不採用候補。ADRの証拠・拒否・復旧に統合 |

共有JANは行単位で先に検査し、全在庫連動候補が実測前と証明できる場合だけ在庫を全スキップしてcommit可能とする案。未実測の候補へ先頭配賦してから他の商品だけ再確認する経路は採らない。参照できる棚卸し明細がない候補の手軽な解除は現行の限定APIでは未対応であり、DATA-2側との接続が残る制限。架空の明細や自動の全店棚卸しで隠さない。

## Scope

本turnのwrite範囲:

- S1: docs/adr/2026-09-18-stocktake-time-evidence.md とADR index。技術判断・拒否理由・復旧・データ意味を統合する。
- S2: 本packet、docs/plans/test-matrices/2026-09-18-stocktake-time-evidence.md、Plans.md。現在地と検証契約を同期する。
- S3: scripts/probes/stocktake_time_model.py。合成値だけの設計probe。production moduleとして利用しない。
- S4: 関係するfunction-design 23 / 32 / 35 / 55 / 73、DB tracking / pos、親indexへproposed ADRの案内を付ける。本文の現行実装契約を新方式実装済みに書き換えない。

次のdesign出力: ADRに沿って20 / 21 / 23 / 24 / 32 / 35 / 36 / 41 / 42 / 55 / 65 / 73、DB/architectureの詳細契約を同期し、EJ本番条件の外部probeを整理してplan-draftへ。現在のADRの命名をruntimeの既存関数が実装済みである証拠にしない。

## Non-scope

- src-tauri、src、migration、bindings、traceabilityの変更。
- GitHub操作、実機操作、実データの読取り拡大・複製。
- workflowそのものの変更、過去rallyの書換え、無関係なcleanup。

## Acceptance Criteria

このdesign引継ぎのAC。旧案の正規表現件数を新設計へ流用しない。

- AC1: `rg '^### SPEC-STK-TIME-D' docs/adr/2026-09-18-stocktake-time-evidence.md` の出力にD1〜D9がある。実測窓、資料受領、未知の境界、保留と再確認、訂正、取消、legacyの意味は独立設計点検で確認する。
- AC2: `python3 scripts/probes/stocktake_time_model.py` がexit 0でPASSを出力し、before/afterの断定が合成oracleに反しない。モデルのPASSは実装テストと別に扱う。
- AC3: `rg '^## (Test Matrix|State Lifecycle Matrix|Residual Test Gaps)' docs/plans/test-matrices/2026-09-18-stocktake-time-evidence.md` が各見出しを出力する。契約・失敗とruntime/native/外部probeの境界は独立設計点検で確認する。
- AC4: `git diff --name-only -- src src-tauri migrations` の出力が空。全変更がScopeの設計・案内・モデルに属することを確認する。
- AC5: bash scripts/doc-consistency-check.sh --target plan とfullがERRORなし、git diff --checkが成功。
- AC6: `rg '^### Codex設計引継ぎと早期点検' docs/plans/2026-09-16-stocktake-count-baseline.md` が記録見出しを出力する。指摘の反例と修正先を同節で追跡する。正式Plan Gateはsourceの詳細同期とplan-first commit後に別途行う。

## Design Sources

- 要求: REQ-205 / REQ-401、docs/spec/requirements.md / requirements-coverage.md。
- 新案: ADR SPEC-STK-TIME-D1〜D9（proposed）。
- 現行契約: 35 / 32 / 23 / 31 / 36、tracking / pos、73 / 55。変更予定との違いをADRとScopeで示す。
- 境界: UI → CMD → BIZ → IO/MNT、INV-2、D-051、D-025。
- 旧案の事実調査: feeb3fe9の起票時実測、承認済みEJサンプルの匿名化構造所見。raw値は持ち込まない。

## Required Design Artifacts

| Area | Artifact | Status |
|---|---|---|
| 時点・順序・復旧 | ADR | proposed、新案 |
| DB / TX / migration | ADR D8、tracking / posへの案内 | 詳細SQLとmigrationは次の設計同期、未実装 |
| CMD / DTO / token | ADR D1 / D8 / D9、Matrix | begin / save / abandonとwireの意味を規定。型・登録のruntime実装は未着手 |
| operator flow | ADR D9、55 / 73への案内 | native L3はruntimeで実施 |
| POS / EJ / 時計 | ADR D2〜D5、Contract Probe | 未確認条件では時刻による自動分類を許可しない |
| 検証 | Matrix、合成モデル | 設計probeとruntime検証を区別 |

## Registration / Generation Obligations

このturnは新CMD・Rust関数・schemaの実装なし。bindings / route tree / traceabilityは生成しない。runtimeではcommand登録、生成binding、schema migration、REQ test traceability、record detailのkind伝播を必須とする。

## Design Intent Trace

| Spec | Source / decision | Why | Future implementation | Verification |
|---|---|---|---|---|
| REQ-205 | D1 / D7 / D8 | stale入力、同秒、旧snapshotを誤適用しない | BIZ-06 / IO / CMD-10 / UI-10 | Matrixの保存・訂正・migration |
| REQ-401 | D2 / D3 / D4 | 知らない前後を推測しない | IO-02 / BIZ-03 / CMD-07 / UI-07 | Matrixの受領・区間・0行・共有JAN |
| REQ-205 / REQ-401 | D6 | 実測へ吸収した数量を二重に戻さない | rollback / stocktake repo | 合成モデル、runtime TX検証 |
| REQ-401 | D5 | 不完全なEJで自動分割しない | 別EJ lane | 合成fixture、sanitized sample、native gate |

## Design Intent Audit

- 現行実装とproposed設計を明示して区別する。
- durableな新判断はADRに置く。packetはscopeと状態を所有する。
- D-D1/D-D2の算術とD-D5の吸収先はモデルで検算し、任意の値へoracleを寄せない。
- 実POSの時刻・完全性・計数そのものをアプリが直接観測したと主張しない。

## Impact Review Lenses

- Adapter/core: IOはraw metadata、BIZは証拠・時点分類。未知形式を正常扱いしない。
- Fact/decision: sampleの形状は確認済み。精算reset系列と実時計の適用範囲は未確認。
- Lifecycle/retry: 受領・preview・保留・計数・保存・中断・取消・再取込みをMatrixで追う。
- Operator: 商品ごとの即保存と、失敗後の次の一手。色だけで状態を示さない。
- Replacement: EJやレジが変わっても、受領証拠と実測窓のBIZ契約を維持。
- Data safety: 合成モデルのみ。実データ・DB・backupを使わない。
- Reporting: 現在庫の復旧、売上欠落、過去評価額を区別。
- Manual: UI-07/UI-10/記録詳細のnative L3と、POS時刻・系列probeは未実施。

## Design Readiness

Status: design。レビュー可能な統合案を作成した段階で、実装readyではない。

必要な残作業は、独立設計点検の反映、sourceの詳細契約への展開、外部時刻を信用する条件のprobe、正式Plan Gate。参照明細のない共有JAN候補の復旧制限と、物理的な計数の真偽は隠さない。新しいownerの運用判断を受容済みにしない。

## Contract Probe

- 合成モデル: python3 scripts/probes/stocktake_time_model.py。実行結果はReview Responseに記録する。
- 既存実装確認: movements.idはDBで採番、同秒timestampでは順序不能。snapshotとcursorの同TX保存が必要。
- 外部: Z004のメタ項目、EJの分精度・取引番号・点数欄・精算境界を既存所見で確認。精算番号のreset系列・時計差の保証期間・EJ全形式は未検証。これらが証明されるまで対応する自動分類を有効にしない。
- 安全なfallback: 資料を受領してからの新しい実測。仮時刻、任意の時間幅、EJ合計だけの安全宣言は使わない。

## Test Design Matrix

[Test Design Matrix](test-matrices/2026-09-18-stocktake-time-evidence.md)。対象契約、失敗条件、状態遷移、モデルとruntime検証の境界を記録する。

## Contract Coverage Ledger

詳細は [Test Design Matrix](test-matrices/2026-09-18-stocktake-time-evidence.md)。

| Contract | Future target | Automated evidence | Native / external |
|---|---|---|---|
| D1 | 計数context・保存・revision | ABA、失効、再送、snapshot | UI-10 / 保留 / 訂正 |
| D2〜D4 | source受領・区間・commit | 受領順、未知境界、0行、共有JAN | 実ファイル系列 |
| D5 | EJ adapter | 境界欠落・未知行・数量検算 | 本番有効化probe |
| D6 | rollback | 同秒、反復実測、最初の吸収先 | 対象外 |
| D7〜D9 | 訂正・詳細・旧DB | 所有者guard、kind、migration | 再開・再実測のL3 |

## Test Plan

- 設計probe: Python標準ライブラリのみ。外部入力なし。
- docs: plan / full、diff --check。
- runtime test: Matrixの予定名。未実施であり、本turnでRust/frontend全量を回して実装済みの証拠にしない。
- read-only独立設計点検: 反例と最小修正を求める。正式Plan Gateと区別。

## Boundary / Wire Contract

- 現在のwireは変更しない。新案ではUIはopaque count tokenと数量だけを送る。
- source/revision/cursor/日時の任意指定をUIから受け付けない。
- previewは資料受領を保存し得るが、売上・在庫をcommitしない。
- 保存と取消のtransaction、request重複、record kindのproducer/consumerをruntime packetで固定する。

## Review Focus

- 受領IDを保存時に取り直していないか。
- 保存時刻Eだけでbeforeを判定していないか。
- 未知の始端、legacy、共有JANを通常適用へ落としていないか。
- 取消で吸収先を二度補正しないか。同秒と0差の実測を区別できるか。
- 現在庫の復旧を売上欠落・過去評価額の解決と言っていないか。
- 新機能の対象・migration・UI復旧を既存のscopeと混同していないか。

## 後続 runtime lane ㉘ への申し送り

旧案のfile:line指示はfeeb3fe9の履歴。新しいruntimeのscopeはADRとMatrixを元に起こし直す。

- source受領の永続化、productsのrevision、count/recountの開始・終了・cursor・request識別子、明示的movement kind。
- 数量更新の版増分はinventory_repo::update_stock_quantity内部で強制する。既存caller = inventory_service/common.rs、csv_import_service/commit.rsの取消戻し、stocktake_service.rsの確定補正、integrity_service.rsのfix_integrity。未使用のProductUpdates.stock_quantity分岐も撤去し、数量以外の基準・flag・設定・純量0取消・差0確定は同TX内で共通の版更新処理を使う。Matrixで各経路・overflow・TX rollbackを確認する。
- 旧明細はuncounted / auto_filled / legacyへ分類し、旧force_fillはlegacyのまま。0/0の廃番自動入力をlegacy件数へ加算しない。既知producerに一致しない形は保守的にlegacyとして表示する。
- BIZ内の計数context検査、同一判定関数を使うpreview/commit、取消の吸収先探索。
- UI-07/UI-10/記録詳細の即保存・再開・訂正、既存IME/Enter/focus/returnToを維持。
- legacy migration、全行0、共有JAN、逆順資料、時計異常、EJ欠落を負の経路として実装前にfixture化。
- EJはPLU本番前提。取得失敗で再実測の復旧まで閉ざさず、自動分割の許可と区別する。
- 本packetのdesignはruntime実装許可ではない。

## Spec Contract

Contract ID: SPEC-STK-TIME-EVIDENCE

- 根拠を持つbefore/afterだけを確定し、unknownを推測で埋めない。
- 実測は商品単位の即保存。任意の古い値の再送で新しい基準を作らない。
- snapshot差分は後続movementを保存し、取消は吸収済み数量を二重に戻さない。
- 復旧の新しい現物確認は過去の売上・評価額を自動で書き換えない。

## Trace Matrix

| Spec | Scope | Evidence | Review |
|---|---|---|---|
| SPEC-STK-TIME-EVIDENCE | S1 / S2 / S3 | AC1〜AC3、Matrix | 時点・順序・復旧 |
| REQ-205 | S1 / S4 | AC1 / AC4 / AC5 | snapshot・訂正・legacy |
| REQ-401 | S1 / S4 | AC1 / AC4 / AC5 | 受領・区間・EJ・共有JAN |

## Data Safety

このturnは合成値のみ。実POSファイル・DB・backup・secretを読み込むprobeは作らない。外部reviewへ渡すのは設計・合成モデルだけ。設計案はローカルのcontent commitに記録し、push・PR操作・実機の変更は行わない。

## Implementation Results

未実装。設計モデルのPASSをruntime completionと呼ばない。


## Review Response

- Findings Freeze: 2026-09-19の統合案broad（対象4319fe36、Sonnet + Opus）で指摘集合を固定。以降は本指摘のclosure確認。post-freeze exceptions: none.

### 統合案broadへの対応（2026-09-19、design、closure未確認）

- ownerから受領したread-only結果: 対象4319fe36、SonnetはP1/P2なし・P3あり、OpusはP2ありのためpassでない。原文はcanonical checkoutのignored `.local/reports/stocktake-time-evidence/design-review-2026-09-19.md`。早期点検や今回の修正を正式Plan Gateの承認へ読み替えない。
- Opus P2-1（bug / 契約不足）採用: D1/D8で数量更新と版増分をupdate_stock_quantityへ集約。現行callerを検索し、共通入出庫・取消戻し・確定補正・fix_integrityを確認。関連するProductUpdates.stock_quantityは業務callerで未使用だが迂回可能なので、runtimeで撤去する契約を追加。数量を変えない状態更新の版増分も明記し、Matrixで別に検証する。
- Opus P2-2（migration drift）採用: start_stocktakeの0/0自動入力、insertでcounted_at省略、通常保存と旧force_fillでcounted_at設定を確認。`rg -n 'counted_at' src-tauri/src/db/schema_v{1,2,3,4,5,6}.rs` → schema_v1.rsの列定義だけ。登録済みmigrationでの後付けなし。通常形は3分類、矛盾形はlegacy + 表示。auto_filled自体は基準にもlegacy件数にも使わないが、別の旧実測は隠さない。
- Opus P3-1（復旧負担）一部採用: 見え方は明記、pendingだけで旧取消を解除する案は不採用。10→販売-2→旧実測8確定→新pending8では、通常取消直後の現在庫が10になる。後の確定で8へ戻せても、その間の誤在庫を許可しない。再確認の差は再実測区分で残し、N/N明細を確定差異件数へ水増ししない。
- Opus P3-2/3/4（lifecycle / drift）採用: 保留は同file再選択・再previewで再生成し、新tableを増やさない。受領順と時計の矛盾を早期return前に検査して時計対応を無効化し、受領による復旧は維持。復旧導線は未計数も含め進行中明細を優先する。
- Opus P3-5（test gap）採用: pending→complete→cancel、force_fill、計数側の粒度拡張、純量0取消、独立再実測の取消耐性、migration種別、未計数activeのlegacy復旧を合成モデルへ追加。SQL/Tauri/UIやflag永続化はモデルの証明範囲外としてMatrixへ残す。
- Opus P3-6（過剰設計候補）は削除不採用、理由追記: header世代は確定時の式・表示の意味を保持し、後から変わる明細kindでは代替しない。abandonはUIの切替・離脱をBIZへ伝える失効操作であり、timeoutと異なる。
- Sonnet P3-1/2（表記drift）採用: MatrixのSUM不変条件はD-051、INV-2は層の責任と分離。REQ-401の経路はCMD-07を明記。
- 検証: `python3 scripts/probes/stocktake_time_model.py` → `PASS: temporal bounds, causal receipt, clock conflict, zero-net split, revision, count/rollback lifecycle, legacy recovery, migration kinds, force_fill`。`runpy.run_path`で読み込んだモデルの関数をメモリ内だけで置換し、auto分類喪失・時計検査除去・精度拡張除去・pendingによるlegacy取消解除でそれぞれRED、元の関数へ戻して全check GREENを確認。P3-1のガードを外した検算は「取消直後10、後の確定8（現物8）」を再現した。
- `bash scripts/doc-consistency-check.sh` → ERRORなし、既存履歴のPK6 WARN 3件のみ。`bash scripts/doc-consistency-check.sh --target plan` → 同じ結果を確認。`git diff --check` 成功、`bash scripts/check-workflow-git.sh` → PK5/STATECAP OK。`git diff --name-only -- src src-tauri migrations` → 空。runtime・source詳細展開・正式Plan Gateは未実施、phaseはdesignを維持する。

### Codex設計引継ぎと早期点検（2026-09-18〜19、design、正式Plan Gateではない）

- ownerの設計委任を受け、旧案のprospectiveなScope/AC/実装指示をADR・Matrixへ置き換えた。以下の過去rallyは対象commit当時の履歴として変更しない。
- read-onlyの独立計算点検で、同秒の取消順序、旧active snapshotの移行、補正区分の時刻推定を確認。cursor・商品単位の観測順序・legacy移行・明示的kindを新案へ採用した。
- Sonnet早期点検: 時計変更/sleepの失効機構が未記載という指摘に、Windows通知generationとmonotonic/wall-clock差の検査、native gateを追記。legacyのUI案内と両cursorの明記も反映。レビューは読取りのみで、モデル実行はRootが担当した。
- Opus早期点検とclosure: 共有JANは本番前の不適合設定検査とwhole-file holdの既存owner判断を前提に、P1としてはclosedと再評価された。kindの明示、legacy取消の停止と再確認、継続的な再確認負担、時計誤差を拡張した境界、観測順序、旧pendingの移行を順に反映した。行単位の部分commit案は採用していない。
- 最終closureで、新しい再確認から派生するactive基準のS/E・source_cursor等の引継ぎ、旧DB移行直後の大量保留preflightについてclosedとの評価を得た。残った再有効化の再確認経路は、measured保存が必要・明細なしは既知の非対応範囲・checkbox代替不可と明記して一括是正した。request IDは公開tokenと同一、派生basisは内部専用IDとして確定した。round上限に従い追加のrallyは行わず、正式Plan Gateで文面を確認する。
- 検証command: `python3 scripts/probes/stocktake_time_model.py` → `PASS: temporal bounds, causal receipt, zero-net split, revision, count/rollback lifecycle, legacy recovery`。合成モデルの結果であり、Rust/SQLite/nativeの実装済み証拠ではない。
- 保存時刻だけでbeforeとする変異、および取消の吸収補正を除く変異をメモリ内で注入し、対応assertの失敗を確認。元の関数へ戻すと成功した。trackedモデルは改変した状態にしない。
- Windows通知とRustの時計仕様はADRの一次資料で確認した。実機での登録・通知順序、レジ時計、精算系列、EJ全形状、migration故障注入、正式Plan Gateは未実施。
- 未確認の店の運用や本番移行の件数を受容済みにせず、runtimeには着手していない。Ready・merge・GitHub mutationは行っていない。

### owner 回答（2026-09-16、design）

- Q1 = (a) candidate 採用 / Q3 = (a) candidate 採用 / Q2 = precondition-dependent（店の聞き取り待ち）。反例 2 件（force_fill は実測でない / 確定後の CSV 取消で二重に戻る）→ D-D1 / D-D5 を改訂。UI-10-D2 の「商品単位で記録されていない販売は自動補正できない」制約は残す。Writer は Codex（owner「Codex に回したほうが質良い」）

### Design Review round 0（2026-09-16、design、Opus、裁定 Coordinator。Plan Review round には数えない）

- P1 F1（force_fill が `counted_at` を書き D-D4 の境界になる → 後着販売を skip して過大）= accept → D-D1（`counted_at` NULL）、F13 の廃番自動入力も同じ扱い
- P2 F2（完了済み棚卸し後の取消で void 分が二重に戻る）= accept → D-D5 (ii) 打ち消し movement / F3（commit 結果に warning 欄が無い）= accept → preview 段階の既存 `warnings` に載せ wire 不変、S3 に §15.3 / F4（AC8 の帰属）= accept → `check_template_conformance`（full）へ / F5（73 §73.9 の参照誤り）= accept → 32 §15.3 へ / F6（確定後の負在庫）= accept → D-D2 に方針を明記、`stock_after` 既存列で表示 / F7（既存 green test の反転漏れ）= accept → 申し送りに 4 件 / F8（`VoidedMovement` に `created_at` が無い）= accept → `csv_imports.imported_at` 1 点で比較 / F9（Plans.md の「Human Gate に置く」表記）= accept → 本 commit で Plans.md を是正
- Q2 確定（2026-09-16、店の回答 owner 伝聞「時間帯関係なし、カウント済みでも売れたらそこで数量訂正」）= (b) `<=`。Coordinator の一時案「(a) 誤差が目に見える向き」は、訂正運用の下では訂正済み販売を二重に引くため撤回
- P3 F10（行番号 2 件）/ F11（AC9 の regex）/ F12（AC7 の pathspec）/ F14（Q3 の「1 query」表現）/ F15（Q2 の「前日分取込み」前提を外す）/ F16（日付 / 時刻の橋渡し不変条件）/ F17（SQL の比較形）/ F18（fix_integrity 対象外 1 行）/ F19（backlog の「日報取込み」表記）/ F20（Q1 に「確定後の在庫は数えた数と一致しない」）/ F21（35 §20.6a の設計ノート）= すべて accept、本 commit で反映
- 反例なし（F0）: 恒等式と数値例 3 本、順列 7 系列。壊れたのは F1 のみ
- 判定: owner 回答と本 review を反映した改訂版で、Q2 の聞き取り後に plan-draft → plan-gate（Sonnet + Opus の Plan Review）へ

### owner 追加指示（2026-09-16、plan-gate 中）

- 「日報は既存の置換方針を完成させる。棚卸しは『いつ数えても年末時点へ数量を繰り越せる』ことを中心に設計する。商品別に記録できた入出庫は自動反映し、記録できない部分だけ店の訂正を受ける。その二つを重ねて減算しない契約を作る。在庫の snapshot 補正が正しくても、評価額を各商品の古い実測数のまま合計すると年末時点の要求とは別物になる」→ Goal Invariant を言い直し、D-D7（評価数量 = 確定時点在庫）を新設、`total_cost` 据え置きの記述を撤回。日報は Non-scope に明記

### Plan Review round 1（2026-09-16、plan-gate、Sonnet、裁定 Coordinator）

- reviewer 実施: 起票時実測の file:line / `rg -c` を全数実物と突合し一致、AC7 の diff 3 file を確認、doc check（plan / full）ERROR 0 と check-workflow-git PASS を実行、D-D1〜D-D5 の算術と Q2 `<=` の反例を独立再現、INV-3 が一般方針であることを `10-common-rules.md:24` で確認
- P2（20 §2.11a `:878` と 65 `:267` が「差異は補正 movement の quantity、snapshot 差では定義しない」「開始時システム在庫」の旧契約のままで Scope 外、AC も検出しない）= accept → S7 / S8a に追加、AC2b を新設
- P3（35 §20.8 INV-3 行 `:451`「stock_after < 0 にはならない」が D-D2 と矛盾するのに S2 が名指ししていない）= accept → S2 に明記、AC2b に oracle
- 判定: round 1 は通過不可（P2 1）。本 commit で是正し、Opus round 1 と Sonnet closure で確認する

### Plan Review round 1 / 2 pass 目（2026-09-16、plan-gate、Opus、裁定 Coordinator）

- reviewer 実施: 起票時実測と `rg -c` baseline を全数一致、AC7 = 0、AC8 の 3 gate を実行（plan / full ERROR 0、workflow-git PASS）、design_compliance_test が未実装関数を red にしないことを確認、D-D1〜D-D7 の 9 系列を独立追跡（整合性は D-D5 (ii) を含めて保たれる）、Scope 過不足（FUNCTION_DESIGN / DB_DESIGN / 41 / 44 / 55 / 90 / requirements-coverage は除外妥当）
- P2-1（73 UI-10-D10 `:100` / §73.10 `:224` の `current_stock - actual_count` と D-D3 の衝突、UI-10-D10 の「同一ソース」根拠に未回答）= accept → D-D3 を「在庫列をカウント時在庫へ戻し差異と同一ソース、UI-10-D10 を UI-10-D14 で supersede」に、S4 に `:100` `:224` `:347`、AC4 に oracle
- P2-2（旧記述 sweep 漏れ 5 箇所: 35 `:36` `:45` `:204` §20.9、biz-task-specs `:476`）= accept → S2 / S6 に追記、AC2b を拡張
- P2-3（packet 内の `total_cost` 据え置き文 2 箇所）= accept → Lenses 行と Q1 を D-D7 準拠に
- P2-4（D-D5 (ii) の打ち消し movement が記録詳細に別行で出て「同値」が普遍でない）= accept → D-D5 に記録詳細での見え方と同値の範囲を明記、S7 / S8a の文言を限定
- P2-5（削除 oracle と撤回記録の書き方の衝突）= accept → AC 前文に 1 文
- P2-6（owner 追加指示を decision point として未計上）= accept → 介入 2/4（上限 3 → 4、理由付き）、Plans.md 同期
- P2-7（翌日入力の残差が過小）= accept → Q2 の残差記述を是正、運用ルールに「数えたその場で入力する」を追加
- P3-1（D-D7 の子 ID 欠落）= accept → BIZ-06-D4 を採番し Trace / Ledger / Spec / Readiness / Writer 行へ / P3-2（D-D7 の位置）= accept → D-D6 の後ろへ / P3-3（打ち消し量の粒度）= accept → 商品ごと SUM で 1 本 / P3-4（AC2b の 35 向け oracle が空撃ち）= accept → `採用しない` = 0 へ / P3-5（backlog の STK-1 行が stale）= accept → 本 commit / P3-6（行番号 `:52` `:124`）= accept
- 判定: round 1 は通過不可（P2 7）。本 commit で是正し、round 2 = Sonnet closure（両 pass の指摘の閉じ方を確認）

### Plan Review round 2（2026-09-16、closure、Sonnet、裁定 Coordinator）

- round 1 の Sonnet P2 / P3、Opus P2-1〜P2-7 / P3-1〜P3-6 = すべて closed（AC baseline 全件一致、doc check plan / full ERROR 0、workflow-git PASS、design_compliance_test PASS を reviewer が実行）
- 新規 P2（S4 の UI-10-D14 説明に「『現在在庫』列は維持」が残り D-D3 の棄却案と literal 一致）= accept → 本 commit で「カウント時在庫に一本化」へ
- 新規 P3（AC2b の `動的計算` baseline が `:218` だが実物は `:217` の見出し）= accept → baseline と S2 を訂正
- 判定: 通過不可（新規 P2 1）。本 commit で是正し round 3 = closure（天井 3 の最終回）

### Plan Review round 3（2026-09-17、closure、Sonnet、裁定 Coordinator）

- round 2 P2 / P3、owner 追加指摘 3 件 = closed（AC baseline 全件一致、doc check plan / full ERROR 0、workflow-git PASS）
- 新規 P2（未実測「—」/ 自動補完注記の表示契約に AC oracle が無く、Spec Contract / 申し送りにも未反映）= accept → AC4 に 2 oracle、Spec Contract と申し送りに 1 行ずつ（本 commit）
- reviewer 判定は「通過不可（新規 P2 1）」、round 天井到達。同日に owner が Q2 を不承認したため disposition = owner escalation → `state-backtrack plan-gate->design`（`9a02f8f9`）。本 rally はここで閉じ、設計確定後の plan-gate は新しい rally

### owner 判断（2026-09-17、Q2 不承認と方式の評価）

- 「`<=` の一律適用は現段階では承認しない。実測の再入力と、販売に伴う数量訂正を区別し、記録済み入出庫・POS 販売・返品を混ぜても、重複や欠落が起きない契約を先に定める」。反例 = 引き算訂正で記録済み入庫が消える / 返品の増加を落とす経路 / `<` に戻しても解決しない
- 骨子の評価: ① 実測の再入力と販売訂正の分離 = 賛成（店には手作業を終える変更として説明）/ ② 自動繰り越し = 条件付き賛成（実測より後に発生し実測数に未含有の増減に限る。PLU 未移行商品は自動追跡の対象外）/ ③ (i) 不採用、(ii) 第一候補（商品・数量・取引時刻・返品／取消を復元でき前後を判定できること。判定不能は残す）、(iii) 条件付き代替（再確認状態の永続化、未解消なら force_fill でも確定不可、同日追加取込み・取消の再確認条件）。`sale_date` は精算日で、日跨ぎ精算では「対象期間が実測の前後どちらか確定できる」前提が要る
- 推奨: (ii) の実データでの成立確認を先に行い、判別できない部分だけ必須の再確認へ回す → D-D1 / D-D2 / D-D4 / Q2 を改訂、次の行動 = EJ の採取と形状確認。介入 3/4
- Coordinator が field-check の公式マニュアルで EJ の存在（`Ejyymmdd.TXT`、取引ごとの時刻と PLU 行、売上 /EJ 保存設定）を確認し、起票時実測へ追記。sample 未採取

### owner 追加指摘（2026-09-16、round 2 と同時）

- 在庫列の変更（カウント時在庫へ）と介入 2/4 の計上 = 賛成。Q2 の同日販売ルール全体への承認は分けて扱う（owner 承認待ちとして Q2 に明記）
- P2（未カウント行の表示条件）= accept → D-D1 / D-D3 に「未実測は『—』、自動補完は注記で区別」/ P2（S4 の逆指示）= accept（round 2 P2 と同件）/ P2（「その場」≠「当日中」、10 → 8 → 古い 10 入力で確定 10 に戻る反例）= accept → 運用ルールを owner の文言に置換、残差記述を是正 / 「現在在庫は在庫照会で確認できる」の言い方 = accept

### Plan Review 新 rally round 1（2026-09-18、plan-gate、Sonnet + Opus 独立 fresh context、対象 `75dcf494`、裁定 Coordinator）

- P1 なし。Sonnet P2 2 / P3 2、Opus P2 5 / P3 6。全件 accept（Sonnet P2-2 の「対称の分岐を足す」案だけ reject、理由付きで据え置きを明記）
- Opus P2-1（Tz なし file の同日解除で二重減算）→ D-D9: スキップ対象 = 保留対象集合、Tz なしは `date(C') > D` / P2-2（段 0 の日跨ぎ精算の前提が source docs に落ちない）→ D-D4、S1、S4、AC10 / P2-3（preview cache の TTL と入力の喪失）→ S3 §15.9、S11 / P2-4（記録詳細に区分の器が無い）→ S7、S8a / P2-5（段 1 は保存時刻基準で非保守的）→ D-D4 に前提と破れたときの向きを明記、運用文言を「精算後に数え始め」へ。owner が受容する残存リスクとして提示する
- Sonnet P2-1（Risk）→ R2 維持を tie-break 規則への反論付きで裁定（Opus も R2 妥当）/ P2-2（対称の分岐）→ reject: Z004 は期間の終わりしか持たず最初の販売時刻が分からない。既知の受容済みトレードオフとして D-D4 に明記 / P3（ゼロ行の照合規則）→ D-D8 / P3（二重入力）→ D-090 Revisit
- Opus P3-1（列挙の追随）/ P3-2（見出しの D-D8 表記）/ P3-3（保留の放置）/ P3-4（精算前の解除で再保留）/ P3-5（エラー契約の oracle）/ P3-6（Plans.md の撤回済み表現）→ 反映
- 反例にならなかったもの（両 reviewer が独立に追跡）: D-D8 の再保存と取消・追加取込みの順列、D-D9 の reference を完了済み棚卸しにする判断、別の進行中棚卸しがある場合の分岐、解除した取込みの取消 → 再取込み、`stock_quantity = SUM(movement)`、保留放置のまま後続日の取込み
- 残る不確実性: レジ時計と PC 時計の実差は未実測 / 従来 shape（Tz なし）の Z004 が現運用で出るかは未確認

### Plan Review 新 rally round 2（closure、2026-09-18、対象 `3220c92c`、裁定 Coordinator）

- Opus = 通過可。round 1 の P2 5 / P3 6 は全件 closed、新規 P1 / P2 なし、修正が生んだ反例なし。P2-5（段 1 の保存時刻基準）は「運用条件 + 破れたときの向きの明記」で不足なしと判定。新規 P3 3 件（S3 §15.4 の指示に D-D9 の新規則が無い / §15.9 の「再起動後も入力保持」は不成立 / `corrected_count` の置き場と述語）= accept、本 commit で反映。任意提案「warning を段 0 / 段 1 由来で分ける」= 採用（既存 warnings 経路だけで段 1 の効きを可視化できる）
- Sonnet = round 1 の P2 2 / P3 2 は全件 closed、対称の分岐の reject に反論なし（Z004 は累計帳票で取引時刻を持つのは EJ だけ）。新規 P2 1（申し送りと Ledger に round 1 の新決定 3 つが未反映 = Goal 最小完了条件 (6) に関わる）/ P3 1（S7 の引用が rally を跨いで曖昧）= accept、本 commit で反映
- 本 commit の修正は Writer への指示と申し送りの同期だけで、契約本体（D-D4 / D-D8 / D-D9）は round 1 反映後から変えていない（warning の件数分けを除く）

### owner review（2026-09-18、plan-gate、対象 `3220c92c` 時点の読み。裁定 Coordinator）

- 残存リスク（段 1 の保存時刻基準）= precondition-dependent の受容候補。条件「実測から保存まで対象商品の数量を動かさない、動いたら再確認する」を現場で守れること。補正 2 点 = 「精算後に数え始める」だけでは足りない（精算後にも販売・返品・入庫は起こる）/ 誤差は過大・過小の両方向 → D-D4、S1、S4 に反映。派生して段 0 の穴（精算後〜実測の POS 販売は翌日付の Z004 に入り通常適用で二重減算）を Coordinator が特定し、前提と運用条件として D-D4 に明記
- P2-1 全商品一括保存と「その場で保存」が両立しない = accept。保存単位の選択（案 A / 案 B）を「D-D9 の未決」に置き owner 判断待ち。**Plan Gate の承認依頼はこの決定と反映、closure の後**
- P2-2 共有 JAN のゼロ行が対象から消える = accept → D-D8（候補の全商品を判定対象、ゼロ行・非ゼロ行とも）。round 1 Sonnet P3 への Coordinator 対応「複数件は対象から外す」は ① の合意と衝突していたため撤回
- P2-3 ゼロ行だけの file が `parse.rs:156` の 0 件ガードで止まる = accept（実物確認）→ D-D8、S3、Ledger、AC10、申し送り
- P2-4 画面 state では再起動後の入力保持にならない = accept。`19b29673` で「再起動では入力やり直し」へ修正済み。「復元した値を無条件に再送しない」は P2-1 と同根で「D-D9 の未決」に含めた（案 B なら論点ごと消える）
- Sonnet の対称の分岐を採らない判断 = owner も賛成

### owner 決定（2026-09-18、plan-gate、D-D9 の保存単位）と反映

- **案 B を採用**: 商品ごとに実測と補正を保存し、取込み本体から分離する（「保存値は保存時点の現物数」の原則に合う）。D-D9 を書き換え、案 A は棄却へ移した
- owner が設計と検証に含めるよう指定した 4 点と置き場: (1) 通常の commit 時の最新状態確認と重複防止は維持 → D-D9「commit 時の確認は維持する」、S3 §15.4、Ledger / (2) 取込み前の再実測を未作成の `csv_import_id` へ依存させない → `stocktake_recounts` から `csv_import_id` を外し、movement の note も取込み id を持たない、S5、Ledger / (3) ゼロ行だけの file も再実測後の再 preview から完了できる → D-D8 の 0 件ガードを「棚卸しの境界判定に掛かった行がある file は通す」に定義し直し（再実測後は再確認対象・保留対象とも 0 になるため、前の規則のままでは拒否されていた）、Ledger / (4) 一部保存後の入出庫・中断・再起動で保存済みの補正が失われない → D-D9（1 商品 1 TX、基準在庫は保存時点）、S11、Ledger
- 案 B で論点ごと消えたもの: `CommitRequest.recounts`、保留対象集合の TX 内再検証、入力値の画面 state 保持と cache の TTL（新 rally Opus round 1 P2-3、round 2 P3-2）、「スキップ対象 = 保留対象集合」と Tz なし file の解除条件の BizError（Opus round 1 P2-1 は「条件を満たさない再実測では保留が外れない」で構造上塞がる）
- 精算後の販売が翌日付の Z004 に入る問題 = 保存単位とは別の運用条件として D-D4 に置く。現場で守れることが条件で、**現時点で受容済みとは書かない**（owner 2026-09-18）
- EJ lane への申し送りに「翌日付の精算区間が実測時点をまたぐ場合も判定する」を追加（owner 2026-09-18）
- 契約が動いたため、変更箇所に絞った closure を再度掛ける（round 3 = 天井）

### Plan Review 新 rally round 3（closure、天井、2026-09-18、対象 `02ca6dec`、裁定 Coordinator）

- Opus = 通過可。新規 P1 / P2 なし。案 B の D-D9 を状態機械として下の系列を追跡し反例なし（余裕幅未満の再実測 / Tz なし file の同日再実測 / 同日の追加取込み / 再実測後〜commit の販売・入出庫 / 一部保存後の中断・再起動 / 保存後に取込みをやめる / 別の進行中棚卸しが後から始まる / preview → commit で持ち主が変わる / 同一商品の再実測 2 回 / 保留中に別日の file を取り込む）。owner 指定の各点は契約と Ledger の両方に所在を確認。実質ゼロ件ガード（`parse.rs:156`、reviewer が現物確認）の新定義は無関係な空 file を通さず、通すべき file を止めない。段 0 の前提の反例を合成値で独立に再現し（在庫が現物より過小になる向き）、現行の扱いを proportionate と判定。P3 は全件 accept、本 commit で反映（段 0 の前提と両方向の oracle / 売上 0 件の取込みの一覧表示 / 共有 JAN が保留側にも効くこと）
- Sonnet = 通過可。round 2 の P2 / P3 は closed。案 A 由来の記述の残存は棄却理由・起案時の記録 block・履歴だけ。AC の baseline は全件一致、`BIZ-06-D6` の衝突なし。P3（新しい関数の名前と節番号が未指定）= accept、`record_stocktake_recount` / §20.4.1 を S2 に明記
- 本 commit の修正は oracle・表示規則・命名の追記だけで、契約本体（D-D4 / D-D8 / D-D9）は `02ca6dec` から変えていない。rally は天井の round 3 で close。次 = owner の Plan Gate 承認
- 残る不確実性（owner へ提示）: 段 0 / 段 1 の前提は現場で守れることが条件で、受容済みではない / レジ時計と PC 時計の実差は未実測 / 従来 shape（Tz なし）の Z004 が現運用で出るかは未確認

### owner Plan Gate 承認（2026-09-18）

- owner が Plan Gate を承認、介入上限 8 への再改訂も承認。Plan Commit の確定と state 遷移は、下の「仕組みで守る」への回答を packet に入れてから行う（確定後の追記は Amendment になるため）
- owner の懸念: 段 0 / 段 1 の前提は「仕組み的に守らざるを得ない形にしないとヒューマンエラーで容易に壊れる」。Coordinator の整理 = app が持つ事実は app の時計・取込みの順序・記録済み movement だけで、POS の取引時刻を持たない。前提を仕組みに変えられるのは取引時刻を持つ EJ（段 2）だけ。EJ の位置づけ（任意の部品か、PLU 販売の本番開始の前提条件か）は owner 回答待ち
- 未確認 2 点の解消: レジ時計 = 説明書に月差 ± 40 秒・手動設定のみ（Contract Probe に記載）/ 従来 shape の Z004 = app が当初の仕様から想定した形（1 行目が日付だけ）で、実機から採った file では観測されていない。CV17 の SD 取込みで `EcrDatas` に残る実 file はメタ 6 行 + header の layout A で、6 行目に時刻を持つ（field-check `summaries/2026-07-06-z00x-shape-analysis.md`、23 `:5`）。PC ツールで取り込んだ Z004 をそのまま使えばよく、別の書出しは要らない。従来 shape が来ても段 3 へ落ちるため安全側
