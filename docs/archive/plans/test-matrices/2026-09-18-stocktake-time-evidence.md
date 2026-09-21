# Test Design Matrix: 棚卸しと後着売上の時点証拠

## Risk

Risk: R3（対象契約のimpact）。現在の作業はdesign-only。以下のruntime検証は未実施であり、設計モデルのPASSを代用しない。

[ADRの適用範囲の但し書き](../../../adr/2026-09-18-stocktake-time-evidence.md#適用範囲の但し書き)に従い、時刻経路は確定していない・㉘の実装対象外とする。以下の印はoracleを削除せず次のdesign laneで置き換える対象を示す。混在行は時刻部分のみを除外し、受領順・context失効・拒否・回復などの確定部分の検証を維持する。後述の配線・mutation・lifecycleにも同じ区分を適用する。

## Contracts Under Test

- REQ-205 / REQ-401、[時点証拠ADR](../../../adr/2026-09-18-stocktake-time-evidence.md) SPEC-STK-TIME-D1〜D9。
- D-D1 / D-D2: snapshot差分でカウント後の移動を保存する。
- D-051: 現在庫と有効movement合計の不変条件。INV-2はBIZ/IOの算出・永続化責任を定める。

## 詳細sourceとの対応（発注65）

以下の「時点証拠契約（proposed・未実装）」をruntime検証の入力とする。ADRの設計モデルと実際のDB/wire/UI配線は別の証拠である。

| 契約 | source | この同期で確認する境界 |
|---|---|---|
| D1 | 20/21/30/31/35/36/42/43、master/transaction、MNT task | 数量と版の更新口、数量なしの版更新、contextの保管と意味、PC時計epochの発番/保存/比較、DB/OS失効、1商品TX （時刻部分は㉘対象外） |
| D2 / D3 | 23/24/32/41、pos | sourceと業務commitの分離、任意メタ、開始cursor、時刻対応・失効の独立TX （時刻部分は㉘対象外） |
| D4 | 30/32/35/41/55、tracking | 全候補・0行・legacyの所属・flagとfile保留・本番準備照会 （時刻部分は㉘対象外） |
| D5 | 23/32の外部probe表 | series/時計/開始と終了/続き/点数と純量/商品同定の成立前は自動分割不可 （時刻部分は㉘対象外） |
| D6 | 20/24/32/35、tracking | movement ID・最初の有効吸収先・legacy停止と明示再実測 |
| D7 / D8 | 20/21/35/40/42/65、DB詳細 | kindとrecount参照、旧headerの非遡及、要求ID再送、生成error/wire、移行失敗時rollback （時刻部分は㉘対象外） |
| D9 | 55/65/73、SCREEN_DESIGN/UI_TECH_STACK、UI task | 差0商品の訂正到達、IME/focus、中断/再開、型付き回復、D-052 consumer導出 |

## Failure Modes

- 不明な始端、保存時刻だけ、任意の時間幅で誤った前後を確定する。
- 古い入力、同秒操作、ABA、再送を新しい実測として適用する。
- 受領済み資料と取込み済み売上、資料の欠落と現在庫復旧を混同する。
- 取消が実測で吸収された数量を二重に戻す。
- 旧snapshotを新方式へ無検証で流す。

## Test Matrix

㉘の準備表示はclock_unverifiedを返さず表示しないことを確認する。これを準備済み・恒常運用成立の証明にはしない。

名前はruntimeで追加する予定名。既存の実装テストとして存在・成功を主張しない。

| Contract | Failure Mode | Test Type | Test Name / oracle | Would fail if... |
|---|---|---|---|---|
| D1 | 計数中の移動、減算後加算で同じ数量 | state / TX | `req205_count_revision_aba` / 書込み0で拒否、新contextなら保存可 | 数量だけを比較する、60分を過ぎると許可する |
| D1 / D8 | 数量書込みの一経路だけ版が進まない | repo / integration / static | `req205_stock_revision_all_writers` / 共通入出庫・取消戻し・確定補正・fix_integrityの各成功で旧context拒否。update_stock_quantityの同量更新も増分、overflowはTX全体write0。ProductUpdatesの在庫更新欄・SQLは撤去 | BIZの任意呼出しに増分責任を残す、別SQLで数量だけ更新する |
| D1 / D8 | 数量不変の基準・flag・設定・状態変更が版を変えない | state / TX | `req205_stock_revision_non_quantity` / 差0実測、snapshot補正、flag更新、pos_stock_sync変更、純量0取消、差0確定で旧context拒否。故障時は状態と版が共に戻る | 数量更新関数だけで全状態を保護した扱いにする |
| D1 | 画面切替・再起動・sleep・時刻変更・監視登録失敗 | UI / state / native | `count_context_invalidation` / generation不一致、時計経過差の許容差超過、通知登録失敗で保存不可 | 商品revisionだけで検出できると思う、Instantだけでsleepを検知する、stale値を新時刻で再送する |
| D1 / D9 | 監視不成立を時刻証拠なしの計数で迂回する | state / UI / native | `req205_count_monitor_unavailable` / begin/未保存saveを拒否、保存済み要求の照会は維持。停止理由と再起動/担当者への案内、復旧後は新tokenのみ | time_basis_id=NULLでcontext失効の安全条件まで外す、データを消してやり直させる |
| D1 | 確定で後続移動を消す、古いNで評価する | integration / numeric | `req205_complete_snapshot_and_valuation` / L10,N8→入庫5→販売2→確定在庫11、原価Cならtotal_cost=11C。L10,N3→販売5→確定在庫-2、評価数量0 | stock_after=Nへ上書き、total_cost=古いN×C、負在庫を0へ変更する |
| D1 | 応答喪失と同じ保存の再送 | integration | `req205_count_save_idempotency` / 補正と実測は一度だけ | 同じ要求で新たな補正を作る |
| D1 / D8 | lookup済みcontextがDB交換後に保存される | integration / native | `req205_count_context_db_generation` / 復元前tokenで新規write0、復元後DBに保存済み要求があればreplayedのみ | cache消去だけでclone済みcontextの失効を代替する |
| D2 | 受領と計数開始の順序 | boundary | `req401_receipt_before_count_start` / 開始前だけスキップ証拠になる | source_cursorを保存時に取得する |
| D2 | 時計異常・時刻なし・初回 | recovery | `req401_recount_after_received_source` / 受領→新実測→commitで現在庫不変 | 時計修正だけで古い日時を信用する、復旧不能にする |
| D3 **時刻経路は㉘対象外** | 初回の開始不明 | negative | `req401_unknown_start_no_midnight` / before証拠がなければunknown | 前日0時を補完する |
| D3 **時刻経路は㉘対象外** | 逆順・欠番・reset・同じ分の精算 | compatibility | `req401_settlement_series_uncertainty` / 証拠のある境界だけ使用 | 受領順を精算順にする、同時刻を即正常/即異常と断定する |
| D3 **時刻部分は㉘対象外** | 同じ精算の別hash | duplicate / TX | `req401_settlement_identity_conflict` / previewとcommitの両方でsource_identity_conflict。h1で10→7、h2の追加確認trueでも売上/在庫7を維持。preview後の別hash受領、未取込み/取消済みsourceも検査。検証済み別reset系列は区別 | hash差や追加同意、取消、再実測で衝突を解除する、生の番号へ一律UNIQUEを張る |
| D3 | 識別メタ欠落を候補なしとして同日追加する | duplicate / TX / compatibility | `req401_same_day_missing_identity_rejected` / h1で在庫10→7、同日activeがcompleted / completed_partialの各場合でh2のmachine_noのみNULL・settlement_noのみNULL・両方NULLをpreview/commitでsource_identity_conflict。追加確認false/trueとも売上はh1分だけ・在庫7・追加import/movement/flag/revisionのwriteなし、受領は保持。h2が完全でも既存側が各NULLまたはsource取得不可なら同じ拒否。両側完全かつ別精算と判別できれば既存の追加確認後に成功 | NULL一致検索/INNER JOINで候補0件へ落とす、片側だけ検査する、確認trueで解除する |
| D3 | 同日active条件の取り違え・preview後の追加 | state / TX | 同testで初回・他日activeだけ・同日取消済みだけはメタ不足の追加guardでは拒否しない（全受領sourceの別hash衝突等は維持）。preview後に同日activeが増えた場合も業務writeなしで拒否し、既存snapshot変更で再previewを要求した場合はその再previewでメタ不足拒否を確認 | 取消済みをactiveへ含める、preview時の集合だけでcommitする、メタあり別hash衝突まで解除する |
| D3 / D9 | 拒否した売上を再実測で復旧済みにする | UI / recovery | `req401_identity_conflict_recovery_limit` / 誤版取消後の訂正版・系列未証明reset・メタ不足同日追加に未取込み売上と在庫反映なしの制限を表示。記録ハブ/元資料の確認と、画面では解決不可の案内。再実測後も売上欠落表示を維持 | 計数ボタン・追加確認・正しい既存取込みの取消で解除を促す、時刻待ち/再起動を解決策にする |
| D3 / D8 | 移行前importを候補から落とす/確認で許可する | migration / TX | `req401_pre_migration_import_identity_guard` / sourceなしの旧active importを移行し、sourceなしのまま/メタNULLのsourceへhash backfillした各形で、メタ完備の同日別精算をpreview/commitとも拒否。completed / completed_partial、当日追加/過去日後追い、追加確認trueでも新しい売上・在庫・importのwriteなし。元売上/在庫/履歴も不変。原本layout Aだったケースも対象 | 従来shapeだけの費用とみなす、legacyだけ確認で通す、imported_atを精算時刻へ流用する、migrationで旧履歴を削除する |
| D3 / D8 / D9 | 旧取込みの行き止まりを本番前に表示しない | integration / wire / UI | `req401_import_identity_preflight_dates` / 複数日のsourceなし・片方/両方メタ欠落のactiveを、import_identity_missing + 重複なし昇順settlement_datesで返してready=false。連動商品なしでも検出、取消済みだけの日付は除外。CMD/bindings/UIに全日付と準備未完/解決不可の案内が届き、CountRecoveryTargetは空。空の初導入DBではこのissueなし、他issueがあればready=falseを維持 | 商品だけ走査する、INNER JOINで旧importを落とす、message解析/偽item IDで表示する、初導入申告で検査を省略する |
| D3 / D8 | 初導入条件を過去日取込み禁止へ変える | integration / positive | `req401_new_metadata_late_import_allowed` / メタ完備の別精算どうしで、同日active追加確認後に過去日の後追いcommit成功。本番開始日/最終取込み日より前も対象。他のguardは成立済み、未実測の一意連動商品なら売上と在庫減算を一度だけ保存。受領sourceへ原本のmachine_no / settlement_no / settled_atが保存されていることも確認。全く同じfileの再送は拒否 | 日付で足切りする、DB列だけ追加して抽出/保存を忘れる、同日を一律拒否する |
| D3 **時刻経路は㉘対象外** | 不正/欠落/期限切れTimeEvidenceを使用する | negative / boundary | `req401_time_evidence_validation` / 不正JSON、必須値欠落、負の誤差、粒度0、逆転期間、不在参照は自動分類不可。`req401_time_evidence_expiry` / valid_until内・一致・超過を検査、超過はunverified。受領cursorのBeforeは維持 | state='verified'だけを見る、不正値を既定値で補完する、失効後も信頼する |
| D3 **時刻経路は㉘対象外** | 通常操作がverifiedを作る | authority / state | `req401_time_evidence_promotion` / 通常preview/commit・追加確認・汎用設定キーから基準の認定/任意source昇格は不可。owner-operated gate成立済み証拠の内部反映だけが基準をverifiedへ認定。sourceは別行の導出条件が必須、invalid/expiredは再検証した新基準IDが必要 | 利用者の時計合わせ済みcheckboxや設定変更で過去を信用する |
| D3 **時刻経路は㉘対象外** | 認定済み基準が日々のfile境界へ接続されない | integration / positive | `req401_file_bounds_producer` / 合成ms、verified基準B（期間0..1000、変換0、誤差1、粒度1、現在500）と証明済み同系列の前回settled_at=50・今回100からlower=49/upper=102と前回ID/BのFKを保存。受領cursorによる証明なし・B.pc_clock_epoch・count.time_basis_id・現在epochが一致するcount窓200..201ならBefore、20..21ならAfter。0売上/取消済みの前回でも同値。preview/commitで同じ結果 | settled_atを保存するだけ、基準とfile境界を混同する、consumerだけ実装する |
| D3 **時刻経路は㉘対象外** | 基準verifiedだけで全sourceを信用する | negative / authority | `req401_file_bounds_not_derived` / 同Bでも系列未証明/reset不明/今回machine・番号・日時・精度の欠落/対象違い/期間外/基準候補が一意でない場合は境界なし・unverified。前回だけ不在ならupper=102、lower/predecessor=NULL、count20..21はUnknown、200..201はBefore。実測epoch不一致/NULL、基準pc_clock_epochの欠落/不正/現在epoch不一致も時刻分類不可。POS基準の適用期間を実測窓へ課さない | stateだけコピー、初回を0時で補完、別時計のcountへ比較する |
| D1 / D3 / D4 / D8 **時刻経路は㉘対象外** | 実測をPOS基準FKへ結合し世代更新で比較不能にする | state / TX / integration | `req401_pc_epoch_across_basis_renewal` / MNTの合成UUID e1をbeginで固定し、save TXでitem/recountへ保存。POS基準が0件/複数でも実測保存可。gate認定TXがpc_clock_epoch=e1を保存しsource JOINで取得。基準B1期限更新/reset後のB2（期間100..1000、epoch=e1、変換0/誤差1/粒度1、現在500）、同系列の前回150/今回200からlower=149/upper=202と既存count20..21（e1、受領Beforeなし）はAfter、count250..251はBefore。count窓がPOS期間外でも可。MNT起動・時刻変更・sleep復帰・監視喪失/復旧・経過差異常・DB交換でe2となれば旧countとの時刻判定はUnknown、受領Beforeは維持。基準epoch欠落/不正/不一致はverifiedでも不可、準備照会はclock_unverified。begin後のepoch変化はsave write0、gateの時計測定開始から認定直前までのepoch変化は認定write0、保存故障は証拠/数量を全rollback。NULLを新measuredへ保存しない | POS基準IDで実測を選ぶ、実測窓にPOS期間を課す、epochを使い回す、旧基準のepochを通常操作で付け替える、保存側やJOINを欠く |
| D3 **時刻経路は㉘対象外** | 昇格と失効の伝播が非対称 | state / TX | `req401_file_bounds_propagation` / 未認定で受領済みの適格sourceだけ基準認定時に導出。今回を先に受領→前回後着でlower=NULL→49。基準invalid時に同B全source降格、受領Beforeは維持。現在1000は期限内、1001は使用不可。失効/昇格の保存失敗は時刻分類・業務writeなし、再検証は新Bで再導出 | 無条件一括昇格、受領順を系列順にする、片方だけ失効、業務rollbackで信用が復活 |
| D3 / D9 | 拒否資料が再起動/再実測で消える | persistence / wire / UI | `req401_rejected_settlement_visible` / 精算日Dの別hash拒否・メタ不足同日追加それぞれでsourceへ初回拒否を保存。activeなしならissues=[settlement_missing(source_ids=[S], settlement_dates=[D])]（他issueなしfixture）、ready=false、stock_reviewに欠落warningなし。現在庫10→再実測8後も同issue、再起動後も同値。当該Sの正当なactive成立時のみ対象外、取消後は再表示。S3（2026-09-10、identity_conflict）とS7（2026-09-12、missing_identity）はsource ID順の別issueで各ID/日付1要素となり、55までそれぞれ「同じ精算と思われる別の資料があります」/「精算を識別する情報が足りません」の対応が保持される。同日でも集約しない。未提出/欠番だけならissueなし（系列verifiedでも同じ）、全精算完備とは表示しない | 拒否を記録せずpreview cacheだけ使う、数量補正で資料不足を解決、番号の穴から未検証の欠落を推定 |
| D3 | 0売上・取消済み資料 | persistence | `req401_source_survives_zero_and_rollback` / 受領事実を維持 | 0件guard/取消で境界の事実を失う |
| D3 / D4 **時刻経路は㉘対象外** | 受領順beforeと信頼済み時計afterが矛盾 | model / integration | `check_counterexamples` / 開始の最遅候補より後、かつEより前の下限で時計を無効化。開始の誤差範囲内・接触は無効化しない。`check_diagnostic_order` / legacyでも区間逆転検査が先行。runtime `req401_clock_causal_conflict`で他fileへの失効伝播、受領beforeの維持を検証 | Eまで検出を遅らせる、拡張後の最早始端と比較する、早期returnで検査を迂回する、同じ時計対応を別fileで信用する |
| D3 **時刻経路は㉘対象外** | held/業務TX失敗で時計失効が消える | TX / recovery | `req401_clock_invalidation_survives_rejected_commit` / commit時に新発見した矛盾を別の証拠TXで保持し、次fileもその対応を使用不可。失効保存失敗では利用停止・write0 | 信用の失効を業務rollbackへ巻き込む、invalidで再試行ループする |
| D4 **時刻経路は㉘対象外** | 実測窓と精算区間の接触・包含 | boundary / model | `check_bounds` / before・afterと断定した全組がoracleと一致 | SでなくEでbeforeを判定する、接触を確定扱いする |
| D4 | 日跨ぎ・精算後販売 | regression | `req401_sale_after_settlement_before_count` / unknown→再実測 | 日付が翌日なので通常適用する |
| D4 **時刻部分は㉘対象外** | 日計0、実測前販売・実測後返品 | regression | `req401_zero_net_nonzero_after_count` / 現物との差を残さない | ゼロ行を判定前に捨てる |
| D4 | 共有JAN、未実測と実測済み・在庫非連動候補の混在 | negative / model / integration | `check_counterexamples`、runtime `req401_shared_jan_all_candidates` / 一意でない在庫の自動配賦を正しい扱いにしない | 先頭候補だけで再確認を閉じる、在庫連動候補が一つなら共有を見逃す |
| D4 / D5 **時刻部分は㉘対象外** | 共有JANや時計/EJ未検証を本番準備済みと表示 | state / UI | `pos_stock_readiness_preflight` / 自動連動できない条件を有効化前に表示し、値の無断変更なし | 恒久的に保留する設定を通常利用可能と扱う |
| D4 | 曖昧JANを警告だけで保存する | write / TX | `req401_ambiguous_jan_sync_rejected` / create・update・商品一括importそれぞれで曖昧な連動有効化/新しい共有を拒否、TX全体write0、既存pos_stock_sync不変。batch内共有・preview後の別商品追加・非連動との共有も検査 | preview表示だけ実装しcommitを通す、拒否商品のみskipして他行を書き込む |
| D4 / D9 | 非連動化でheldを無記録に解除する | state / TX / UI | `req401_sync_disable_retains_recovery` / 完了済みP在庫10、後着F販売2でheld→Pをoff。変更後revisionを商品に保存、在庫10/既存flag不変、issue=sync_disabled_unreconciled。再preview ready→売上のみcommitしても在庫10・issue/結果warning保持。新しい独立再実測8で在庫8・issue解消、切替記録は保持。再起動/廃番/取消/同意/再有効化未遂でも消えない。新規false/false→falseは新記録なし、再度true→falseは新しい版 | held履歴だけ検査して未記録商品を見逃す、readyを在庫調整済みにする、設定値だけでissueを隠す |
| D4 / D9 | pending保存や旧実測で非連動化の未調整を解消する | integration / UI | 同testでactiveへN8保存時は在庫10/issue保持、確定で在庫8/issue解消。切替前の実測/auto_filledは解消しない。r1保存→切替r2>r1ではactive_countの説明が数え直しを指し、r1のまま確定してもissueが残りindependent_recountへ移る。r2後のmeasured pendingだけ確定で反映される説明となる。同版/版なしも数え直しを指す。商品ごとのtargets1要素と説明を準備照会→41→51/73で保ち、混在商品で案内が入れ替わらない。取得失敗時は未調整/再試行で、確定すれば解消とは表示しない。既存import flagは受領条件で別途解除必須。明細なしはno_count_targetと棚卸し開始の案内、偽明細なし。開始後のrefetchでactive_countに変わるが、未実測のままissueは消えない。設定/版/切替記録の各保存故障で全write rollback。update/商品一括importとも同じ共通書込み経路・記録・操作前警告・保存後/再訪導線。静的点検で汎用pos_stock_syncの直接set分岐が残らない | snapshotだけで現在庫修正済みにする、確定をissueで循環拒否、batch経路やfailureで記録を落とす |
| D4 / D9 | master write拒否を保存成功に見せる | UI | `req401_master_sync_guard_ui` / 51/60でstocktake_guard+shared_jan_unresolvedの対象表示、入力/選択保持、成功遷移なし、自動off/自動再送なし | messageを解析する、拒否後に値を落とす/成功toastを出す |
| D4 | flag残存とforce_fill | state | `req205_recount_flag_blocks_complete` / 確定拒否 | 補完で未解決を隠す |
| D4 / D8 | activeなlegacyを一律file保留へ変える | state / integration | `req401_active_legacy_import_recheck` / Unknown後もactive所属なら通常適用+flag、完了所属はheld。旧activeの確定は新実測まで不可 | kindと所属を混同し、ADRにない一律heldを追加する |
| D4 | preview→commitで新実測・取消・資料追加 | TX | `req401_commit_rechecks_evidence` / 現在の証拠で再判定 | preview結果を確定値として使う |
| D5 **時刻部分は㉘対象外** | EJの先頭・末尾・中間・続きの欠落 | parser / integration | `req401_ej_coverage_boundaries` / 不完全な自動分割は拒否 | 存在するfileだけで完全とする |
| D5 **時刻部分は㉘対象外** | 相殺する読み落とし、未知形式、名称変更/衝突 | parser / negative | `req401_ej_per_receipt_validation` / 判定不能を残す | 日計純数量だけで検算する、未知行を無視する |
| D6 | 同秒のimport→countとcount→import、pending→complete→cancel | sequence / model | `check_lifecycle`、runtime `req401_rollback_count_cursor` / 確定後の取消でも新しい実測と後続移動を維持 | timestampの不等号だけで先後を決める、確定後もpending補正をする |
| D6 | 反復count、複数再実測、後続active | regression / model | `check_lifecycle`、runtime `req205_req401_rollback_first_absorber` | supersededなpendingを使う、複数の観測へ重ねて補償する |
| D6 / D8 **時刻部分は㉘対象外** | legacyの吸収不明を通常取消へ落とす、旧pendingの証拠を残す | regression / model | `check_legacy_recovery` / activeなし・未計数・measured、migration時点のpendingを検証。取消前write0、再確認後の取消とactive確定で二重補正なし。後着fileは新しいRの時点窓で判定 | pendingだけで旧確定済みの吸収不明を解除する、未計数activeのN/N更新を落とす、古い差異や時点証拠を残す |
| D6 | 商品別取消純量0のlegacy例外、取消で独立再実測を消す | model / integration | `check_migration_and_fill` / 純量0取消の在庫不変・版更新・movement無効化。`check_lifecycle` / 独立再実測とその補正を保持。runtimeでflag処理と単一TXも検証 | 相殺する明細を個別にlegacy保留する、再実測補正をimportへ関連付ける |
| D6 | 同importの明細ごとに補償を増やす | model / integration / numeric | `check_lifecycle`、 `req401_rollback_compensation_grouped` / 同商品の取消quantity=-3,+1はSUM=-2、適用済み吸収先へ補償-2を1本だけ作り現在庫不変。-2,+2は補償0本 | 複数実測/複数明細へ二重補償、純量0のmovement作成 |
| D7 | 過去の記録詳細からactiveを迂回 | negative | `req205_recount_active_owner_guard` / active明細へ案内 | 現在庫だけ補正し古いpending差異を残す |
| D7 | 確定後もactiveのguardが残り独立再実測へ戻れない | model / integration | `check_lifecycle` / pending→complete→独立再実測が成功し新しい実数へ補正 | completeでactiveの所有を解除しない |
| D7 | 同秒の確定・取消補償・再実測 | report | `req205_stocktake_movement_kind` / 確定差異件数は不変 | created_atで補正区分を推定する |
| D7 / D8 | 旧完了記録と新式の差異表示を混同する | wire / UI | `req205_legacy_new_record_display` / header.reconciliation_versionをIO→BIZ→CMD→UIで保持。旧完了0の値は不変、新completion補正N-L・差L-N。移行中activeの新measuredは新式 | 版を日時から推定、旧記録の評価を再計算、親が0なので新実測まで旧live式にする |
| D8 | 旧active snapshot、旧completed、NULL証拠、自動補完との区別 | model / migration | `check_migration_and_fill`、runtime `req205_legacy_count_requires_recount` / 両NULL→uncounted、0/0で数量あり・時刻NULL→auto_filled、両あり→legacy。数量8・時刻NULL・snapshot0はlegacy。ledgerでも自動補完→移行→取消が保留されない。履歴・評価額保持、旧activeの確定拒否 | auto_filledをlegacyへ落とす、actual=0の条件を落とす、現在の廃番フラグで旧種別を推定する、旧force_fillを実測扱いする |
| D8 | migration後に旧writerが新規入力を無証拠で保存する | migration / wiring | `req205_count_schema_writer_atomic_rollout` / 新schemaにkindのDEFAULTなし、kind省略INSERT失敗。start・商品追加/一括import・force_fill・各saveがkindを明示。旧update_countが公開登録に存在しない同一releaseで新UIへ切替 | DBだけ先行稼働、DEFAULT=uncountedで旧書込みを未実測に見せる |
| D1 / D4 | force_fillを実測と扱う、負在庫を0へ変える | model / integration | `check_migration_and_fill`、runtime `req205_force_fill_no_evidence` / N=L=max(book,0)、補正0、cursorなし、実測基準を上書きせずflag解消不可 | 補完で吸収先を作る、旧実測を隠す、負在庫を修正する |
| D9 | 保留→一部保存→中断→再開 | native / integration | L3: 同じfileの再選択・再previewで残る集合を再生成。未保存だけ再確認、保存済み在庫を再適用しない | 保留集合がDBにあると仮定する、source metadataから商品明細を復元する |
| D8 / D9 | errorのmessage解析、対象なしを偽IDで解除 | wire / UI | `req205_recovery_wire_contract` / 40のkind/code/actionを生成型で伝播、null対象は解除不可、saved/replayedは成功。全constructor/unwrapResult/mockでpayloadを保持 | 生成型とUI分岐がずれる、回復対象を文字列から抜く |
| D9 | 旧live差異やauto入力を実測として表示する | UI / numeric | `req205_count_snapshot_labels` / 一覧・選択商品・保存結果でL10,live5,N8の差は+2。未実測の実測基準/差/日時は「—」、auto_filledは「自動入力」と区別し実測日時を捏造しない | live-N=-3を表示、補完をmeasured扱い、kindを無視 |

### 既存テストの移行先（runtime申し送り）

既存テストは削除/skipで回避せず、現行契約を守る部分と新式へ置き換えるoracleを分ける。本runはdocだけでtestを変更しない。

識別メタ欠落の同日追加guardは上記runtime TX/UI oracleで検証する。既存合成モデルはsourceメタとactive import集合をモデル化していないため、そのPASSをこのguardの実装証明にしない。従来shapeのparse受理と追加commit許可も別に検証する。

- stocktake_service.rsの `test_update_count_req205_dynamic_difference`: 計数前10→15、N12の差3は維持。新contextでL15が保存され、保存後movementで差が動かないことを加える。旧指示の3→-2は採らない。
- `test_complete_req205_stock_after_equals_actual`: 後続移動なしの7は維持し、後続movementがある場合のN-L適用を追加する。
- `test_complete_req205_force_fill_sets_actual_to_system_stock`: 値5だけでなくauto_filled・証拠なし・補正0を検証する。
- `test_complete_req205_force_fill_negative_stock_clamped_to_zero`: N=L=0・補正0・現在庫-3保持へ変更する。旧在庫0への上書きassertは新契約と衝突する。
- `src/features/stocktake/lib/stocktake-formatters.test.ts` と `StocktakePage.test.tsx` のlive在庫由来の差/主列assert: Lとliveを異なるfixtureにしてL-Nと「カウント時在庫」を確認する。既存の未入力/日時/focus検証は維持する。
- `cross_feature_tests.rs` の `diagnostic_cross_feature_req205_count_then_movement` / `diagnostic_cross_feature_req205_req401_late_import`: context・受領/区間の新fixtureへ移し、既知不具合の解消を正規回帰として実行する。ignoreを外すだけで時刻証拠を捏造しない。

## State Lifecycle Matrix

| State / subject | Initial | Pending | Success | Invalidate | Refetch | Revisit | Restart | Failure | Retry | Evidence |
|---|---|---|---|---|---|---|---|---|---|---|
| 計数context | なし | 開始・数量未保存 | 1商品TX | 商品/画面/版/時計変化 | stale入力を戻さない | 新context | 未保存は失効 | 書込み0 | 再計数 | D1、runtime未実施 |
| 独立再実測 | なし | 計数中 | 記録と補正が同時保存 | import取消で消えない | DBが正 | 記録詳細から新実測 | 保存済み保持 | TX rollback | 保存要求の重複防止 | D7、runtime未実施 |
| 資料受領 | 未受領 | 構文検証 | hash一意の受領記録 | 時刻証拠だけ失効可 | 受領と売上を区別 | 同hashは同ID | 保持 | 不正形式は証拠にしない | 同hash冪等 | D2/D3、runtime未実施 |
| PC時計epoch **㉘対象外** | MNTが起動時発番 | beginで固定 | save TXで実測へ保存 | D1の時計/監視/DB変化で更新 | 現在epochとPOS基準/実測を照合 | 連続性を再検査 | 新UUID、旧証拠へ付替えない | save拒否または時刻Unknown | 受領後の新実測、新gate認定 | D1/D3、runtime未実施 |
| 時刻基準/file境界 **㉘対象外** | 未認定/未導出 | gate認定とBIZ導出を分離 | 適格sourceのみverified | 基準と参照sourceを降格 | 基準JOIN再検査 | 現在証拠で分類 | 保存済み基準/境界 | 伝播失敗は業務拒否 | 新基準で再検証 | D3、runtime未実施 |
| 拒否された未取込み資料 | 記録なし | 同一性guard拒否 | 拒否証拠保存 | 当該sourceのactive成立で非表示 | issuesを再照会 | 表示維持 | 証拠から再表示 | 記録失敗も業務拒否 | 正当な取込み以外で解除しない | D3/D9、runtime未実施 |
| 非連動化の未調整 | 記録なし | true→false | 商品に版を保存 | 新しい適用済み実測で解消 | 非連動/廃番も照会 | 商品/準備表示 | 記録維持 | 設定/版/記録を一括rollback | 通常計数/確定または独立再実測 | D4/D9、runtime未実施 |
| import | 未取込み | preview/保留 | 売上と許可された在庫 | 新状態で再判定 | flagはDB、保留は再生成 | 重複拒否 | 同じfileを再選択しpreview再作成 | 業務write0 | 再実測後commit | D4、runtime未実施 |

## Adjacent Pattern Audit

| Source pattern / contract | Repository sites inspected | Ported sites | Explicit exclusions and reason | Test / evidence |
|---|---|---|---|---|
| 商品単位のcount、IME、Enter | 73 UI-10-D2、stocktake_service/update_count | 通常計数・保留解除・記録詳細の訂正 | 新しい装飾/共有widgetは不要 | runtimeとnative L3は未実施 |
| import TXと重複検査 | csv_import_service/commit.rs、rollback.rs、32 §15.4/15.5 | 時点判定の直前・TX内 | 日報bundleは在庫を動かさないため不変 | runtime未実施 |
| 数量UPDATEと版の増分 | inventory_repo/update_stock_quantity、common.rs、commit.rs、stocktake_service.rs、integrity_service.rs、product_repo/ProductUpdates | 既存商品の数量更新は共通repo内で版を強制、汎用更新型の数量欄撤去 | 新商品INSERTは既存contextなし。DB復元は全context失効で別検証 | runtime未実施、modelは実際のSQL経路を検証しない |

## Negative Paths

- missing / invalid input: 数量なし・負数、失効context、商品/親の不一致は書込み0。
- duplicate / ambiguous input: 同じ保存要求、同じhash、同じ精算の別hash、共有JANを別々に検証。
- unknown reference / dependency: legacy証拠、時計/EJ不明は通常適用に補完しない。未実測商品との区別を検証。
- permission / write failure: count記録・補正・flag・revisionの各段で故障を注入しTX全体が戻る。
- dry-run side effect: previewは資料受領・時刻証拠・同一性拒否の証拠だけを保存し、売上・在庫を変更しない。UIも取込み完了と表示しない。

## Boundary Checks

- threshold / precision: 境界接触、POSの分精度、検証済み時計誤差幅、同秒のアプリ操作。
- null / default: 始端なし・終端なし・時計未検証・旧実測を別々に扱う。
- empty / non-empty: 売上0でも判定対象あり、解消後の対象0、対象も証拠用途もないfile。
- min / max: 非負actual_count、加減算overflow、revision/cursorの範囲、wireに生の巨大整数を渡さない。
- status / token: superseded pending / active / completed / recount。clientがcursorを改竄しても採用しない。

## Compatibility Checks

- 既存帳票の構文受理と正規化は維持。時刻証拠だけの不足は受領後の再実測で復旧可能だが、識別メタ不足の同日追加拒否は別であり再実測で解除しない。共有JANの先頭商品へ在庫を自動配賦する動作は意図的に変わる。自動在庫連動の本番前preflightで検出し、未対応の解除を可能と表示しない。
- 旧DBは履歴・評価額を保持。未検証metadataを補完して自動で有効化しない。
- 旧観測があるDBのpreflightはlegacy基準の在庫連動商品を件数・一覧で示す。auto_filled自体はlegacy件数へ加算しないが、別の有効なlegacy基準は隠さない。初導入の本番には旧履歴なし（owner確認日と回答の要旨はproject-memory）であり、存在しない本番DBの件数調査/再実測を要求しない。開発・試験/将来の更新で旧観測があれば作業量を確認し、拒否/移行/legacy取消のテストを維持する。
- 取込み側も初導入は新メタの抽出から保存までを実装した新形式で開始し、メタなし旧試験履歴を持ち込まない。既存行があれば上記のpreflight日付表示と拒否を維持する。開発・試験DBの整合した作り直しは本run外であり、試験で実DBを削除/補完しない。後追い可能性は正のoracleで固定する。
- 日報取込み、PLU書出し、商品単位でない売上の意味は変えない。

## Data Safety Checks

- 合成値のみ。実JAN・商品名・数量・金額・rawファイルをfixtureへ転記しない。
- source受領表にはhashと必要なメタ情報だけ。実データの原本を監査用に複製しない。
- DB/backup/secretを読み書きするprobeは禁止。本モデルは外部ファイル入力なし。

## Main Wiring / Integration Checks

- previewとcommitが同じBIZ判定を使い、commitのTX内再検証を省略しない。
- 通常計数・再実測・記録詳細が同じcontext検査を通る。実測のTEXT epochとPOS基準INTEGER FKを区別し、TimeBasis.pc_clock_epochをproducer/保存/JOIN/現在epoch照合まで配線する。
- 取消がcursor・flag・revisionへ接続され、結果と履歴がUIまで届く。
- bindings / traceability / command登録はruntime laneで同期する。
- 新command（begin/save/abandon・準備照会）、旧update_count登録撤去、共通errorのconstructor/enum/bindings/unwrapResult/consumer、補正kindの一覧/詳細への伝播を同じruntime変更で確認する。このdocs同期では登録・生成を行わない。

## Mutation-style Adequacy Questions

- SをEへ置換、境界 `<` を `<=` に変更するとモデルの対応assertが落ちるか。未知の始端への仮値挿入はruntime `req401_unknown_start_no_midnight`、受領cursorの保存時更新はruntime `req401_receipt_before_count_start`へ割り当てる。モデルは境界/cursorの生成処理を持たず、この生成契約を検証したとは扱わない。
- snapshotの取消補正を削除、最初の吸収先を最後へ変更、全観測へ補償するとライフサイクル検証が落ちるか。auto_filledをlegacyへ分類、新pendingでlegacy取消を許可、計数側の粒度拡張・時計矛盾検出を除去しても落ちるか。
- legacyの早期return後へ時計検査を移す、因果矛盾の閾値を開始最遅候補からEまたは開始最早候補へ変える、completeのactive解除・migrationのactual=0条件を落とすと、対応assertが落ちるか。
- 数量だけで版を比較、同秒で区分を推定、0行を除外、共有JANを先頭だけに縮退するとruntimeの該当検証が落ちるか。

## Residual Test Gaps

実測後の販売を時刻でAfterと判定する経路は㉘では未実装となり、受領順のBefore以外の実測済み商品は判定不能から既存の保留 / 再実測へ回るため、日次の恒常運用の成立は次のdesign laneに残る。

モデルは数学と順序の限定検証。Rust/SQLite/Tauri/Reactの配線、migration故障注入、実機の精算系列・EJ・時計、物理的な計数、Windows native L3は未実施。Plan Gate前に外部前提のprobeを確認し、runtime完了前に対応する検証を実施する。

発注65ではsourceの具体化と既存モデル/文書検査のみを実行する。上記の追加予定テストを存在・成功済みとは扱わない。外部probeの正本は32の表、native自動probeとoperatorの観察の分担は42/73で固定する。参照明細のない共有JAN候補、紙の過去値の真偽、未提出資料の存在は引き続きモデルで証明できない。
