## 15. BIZ-03: Z004商品別CSV取込みパイプライン

### 時点証拠契約（proposed・未実装）

SPEC-STK-TIME-D2〜D6 / D8。以下の現行parse/commit/rollbackから変わる契約を本節にまとめる。日報bundle・売上の集計日・既存のactive hash拒否は維持し、同日追加確認は下記の精算同一性guard（識別メタ不足の拒否を含む）を通過した別精算の追加に限定する。同一精算の別hashや、メタ不足で同一性未確認の同日追加を確認操作で許可しない。

#### 受領・previewの内部型

本番前のread-only照会は `get_pos_stock_readiness(conn) -> Result<PosStockReadiness, BizError>` とする。PosStockReadinessはready: boolとissuesを持ち、issueはcode（shared_jan / legacy_basis / ej_unverified / no_count_target / import_identity_missing / settlement_missing / sync_disabled_unreconciled / recount_after_importのgenerated enum）、CountRecoveryTargetの集合、settlement_dates: Vec<String>、source_ids: Vec<i64>、利用者向け説明を持つ。readyはissuesが空の場合だけtrue。全在庫連動商品に加え非連動化の未調整記録と同一性拒否sourceを連動/廃番設定で除外せず、現在の証拠状態を照会し、明細なし・auto_filled・legacyを区別する。確認checkboxを保存するAPIではなく、file固有のcommit可否は下記の分類で決める。

ej_unverifiedは、EJの日次取込みと下記の相殺の判定を持たないbuild（㉘）では、DBを入力にせず常に返す（[ADR D4](../adr/2026-09-18-stocktake-time-evidence.md)の在庫連動の有効化の条件）。これを外すのは、EJの日次取込みと相殺の判定を実装するlaneのcode変更だけで、そのlaneのmerge条件は下記の外部probe表のEJ完全性・EJ復元・商品同定の3行についてowner-operated gateの証拠があること。DBのflag、設定key、確認checkbox、EJを1回取り込んだ事実では外れない。外した後にEJが欠けた日は、相殺の確認待ちだけで扱う。BIZ-01は同じ判定を使い、ej_unverifiedの間は在庫連動の有効化を拒否し、既定値をfalseにする（[30](30-biz-product-service.md)）。このissueのtargets・日付・source_idsは空。

recount_after_importは、未解消の要再確認flagを持つ商品ごとに1件返す。targetsは回復先（active_count / independent_recount / no_count_target）の当該1要素、source_idsとsettlement_datesはその商品の未解消flagの資料IDと精算日（各昇順・重複なし）とする。targetsの要素はその商品の未解消flagの理由を型で持つ（[40](40-cmd-product.md)のrecount_reasons）。利用者向け説明はBIZがflagの理由から作る。計数と前後不明の販売・相殺の行あり・旧記録の実測は「取り込んだ後に数の再確認が必要です」。相殺の確認待ちは、EJの取込み機能がない間は「この日の電子ジャーナルがないため、売上と返品の相殺を確かめられません。今の数を確認してください」、取込み機能が入った後は「電子ジャーナルを取り込むか、今の数を確認してください」とする。ただし前回のZ004からスロットと名称の対応が変わった区間（最初の区間を含む）の確認待ちは、EJを取り込み直しても解消しないので、取込み機能が入った後も「レジの商品の登録が変わったため、売上と返品の相殺を確かめられません。今の数を確認してください」とする。1商品に理由の違うflagが複数あるときは、相殺の確認待ち以外が一つでもあれば「取り込んだ後に数の再確認が必要です」とし、相殺の確認待ちの説明は全てのflagが相殺の確認待ちのときだけにする。取込みを止めるissueではなく、進行中の棚卸しに属する商品では確定を止める。

import_identity_missingは全日付のactive Z004 import（completed / completed_partial）を対象に、sourceなし、またはmachine_no / settlement_noの片方でも欠落を検出して返す。在庫連動商品がなくても走査し、移行前importとhashからbackfillされたメタなしsourceも除外しない。settlement_datesは該当精算日の重複なし昇順一覧（YYYY-MM-DD）、このissueのCountRecoveryTargetは空。recount_after_import以外の商品向けissueのsettlement_datesは空とし、偽のitem IDやmessage解析で日付を運ばない。取消済みだけの日付はこのissueの対象外だが、全受領sourceの別hash衝突guardは維持する。該当日は準備未完の理由となり、同日追加は下記guardで引き続き拒否する。preflight結果をcommit許可のtokenにせず、照会時の申告や初導入の前提でTX再検査を省略しない。

sync_disabled_unreconciledは、pos_sync_disabled_revisionより後の適用済み新方式実測がない商品を、非連動/廃番も含めて返す。商品単位でissueを返し、targetsはactive_count/independent_recount/no_count_targetの当該1要素、日付/source_idsは空。active_countの説明は、measured pendingのobservation_revisionが切替版より後なら「棚卸しを確定すると、在庫数に反映されます。それまでは未調整です」とする。切替前/同版/版なし・未計数/auto_filled/legacyなら「在庫連動をやめた後に、もう一度この商品を数えてください」とする。切替前に保存したpendingを確定してもissueは残り、independent_recountなら「今の数を確認してください」、no_count_targetなら「棚卸しを始めると、この商品を数えられます」と説明する。既存issueの利用者向け説明をBIZで生成し、51/73も準備照会でこの説明を取得する。action/codeやwireの版fieldは増やさない。held履歴は参照せず商品側の切替記録から導出する。確認checkboxや売上取込み/取消で解消しない。

settlement_missingは、sourceの同一性拒否記録があり、そのsourceのactive importがない場合だけ返す。source単位でissueを作り、source_idsとsettlement_datesは同じsourceのID/保存済み精算日の各1要素、targetsは空。issueはsource ID昇順にする。同じ精算日でもsource間で集約しない。既存の利用者向け説明は当該sourceのidentity_rejection_codeから生成し、identity_conflictなら「同じ精算と思われる別の資料があります」、missing_identityなら「精算を識別する情報が足りません」とする。recount_after_import以外の他issueのsource_idsは空。別hashの既存取込みがあってもその資料を採用できたとは扱わない。未提出資料や番号の穴から生成しない。ready=falseでもfile個別の受領/再実測/commitの入口は閉ざさず、当該fileのguardで可否を決める。再実測ではissueが残り、当該sourceのactive import成立時だけ表示対象から外す。

parse_and_validateは受領TXを作るためmutable DB接続を受ける。構文・種別・サイズ/行数を検証した後、hash一意なsource受領をcommitし、そのIDでpreviewを構築する。受領失敗時は証拠付きpreviewを返さない。previewで売上・在庫・要再確認flagをcommitせず、資料の受領と同一性拒否の証拠だけを保存する。

CachedPreviewへsource_idと、在庫判定用行（source_line_no / normalized_jan / quantity / amount / 全候補product_codeとpos_stock_sync）を加える。これは照合の再検証に必要な内部データであり、表示専用の名称をcacheへ複製するためではない。売上行と証拠行を分け、正常JANの0/0行も全候補照合に通す。0/0行そのものはsale_recordsや通常在庫movementを作らない。

PreviewDataへstock_reviewを追加する。statusはready / recount_after_import / held、targetsは[回復対象型](40-cmd-product.md)、warningsは非連動化後の未調整の説明とする。精算の欠落状態はPosStockReadiness.issuesのsettlement_missingだけが所有する。heldは共有JAN行によるfile全体の業務commit不可、recount_after_importは最新の実測の所属によらず要再確認flagを残す取込みが可能、readyは現在の証拠で要再確認・保留の対象なしを表す。資料受領を取込み成功と表示しない。

#### 一つの分類関数とcommit

分類の内部入力はsourceの受領ID、商品候補、最新の有効観測（kind・所属・source_cursor）、行の数量・金額、同じ精算区間のEJの証拠（下記。なければなし）。出力はBefore / After / Unknownと、Unknownの場合のflagの理由（またはflagなし）。時刻・精算日時は入力にしない。

1. 下記の精算同一性guardを、legacyや受領済みの早期returnより前に検査する。
2. 共有JANの行全体guardを先に選ぶ。非連動との共有も含め、全在庫連動候補について後述の個別分類を計算し、全てBeforeの場合だけ在庫を全スキップしてcommit可能。他はfile全体をheldにし、先頭商品への通常適用へ進まない。全候補が非連動なら在庫分類は不要だが、非連動化の未調整表示は省略しない。売上の既存先頭紐付けはcommit可能な場合だけ維持する。
3. 一意な行または共有JAN内の候補の個別分類: 非連動は売上のみ。ただし該当候補にsync_disabled_unreconciledがあれば、共有JANの全非連動経路も含めstock_reviewへ未調整のtargets/warningsを残す（これだけではheldにしない）。実測履歴のないNeverObservedはAfter、LegacyObservedはUnknown。auto_filledは新しい実測基準を作らず、それ以前の有効観測を隠さない。ここでは分類だけ行い、共有行の一部を先に適用しない。
4. 有効な実測で `source.id <= source_cursor`ならBefore。それ以外はUnknown。保存Eや精算日時によるBefore/Afterや仮の始端は使わない。Unknownを実測前・実測後へ分ける方法（EJの取引単位の判定、番号印字）は次のdesign laneが決め、ここでは扱わない。
5. 一意の商品のUnknownは、最新の実測の所属（進行中の棚卸し・確定済みの棚卸し・独立再実測・legacy）によらず通常適用し、同じ業務TXで(商品, 資料)単位の要再確認flagを作成import・理由とともに保存する。理由は、LegacyObservedの行なら数量によらず旧記録の実測、数量が0でない行なら計数と前後不明の販売、数量0で金額が0でない行なら相殺の行あり、数量・金額とも0の行なら次の相殺の判定による。進行中の棚卸しに最新の実測がある商品は、未解消のflagがある間force_fillでも確定できない（[35](35-biz-stocktake-service.md)）。確定済み・独立再実測に属する商品のflagは取込みを止めず、商品単位の準備issue（recount_after_import）と取込み結果で示す。flagの解消は、当該資料を計数開始前に受領していた新しい実測の保存（active明細へのmeasured保存、または独立再実測）か、当該importの取消に限る。復旧は現在のactive明細を優先し、なければ完了済み明細に対する独立再実測へ案内する。対象明細なしは未対応として示す。legacyというkindだけで保留へ変えない。旧activeの確定拒否はD8の別条件として維持する。file全体の保留は2.の共有JAN行だけである。
6. 売上と返品の相殺の判定: 数量・金額とも0の、Unknownの商品（数えた商品）の行は、同じ精算区間の完全なEJ（ADR D5の完全性の全条件）に当該商品の行（販売・戻・訂正・取消）が一つもなければflagを付けず、一つでもあれば相殺の行ありとする。EJがない・不完全（前回のZ004からスロットと名称の対応が変わった区間と、前回のZ004がない最初の区間を含む）・名称を一意に特定できない場合は、その区間の数量・金額とも0の数えた商品を全て相殺の確認待ちにする。相殺の確認待ちは進行中の確定を止め、準備表示に出る。区間の中の前後は問わず、時刻を使わない。

EJの証拠は、EJ parser laneがEJの取込み・解析と行の分類（商品の行・部門売り・明細でない行・帰属できない行）を行い、精算区間ごとにZ004との同一精算か・完全性（ADR D5）・商品別の行の有無をBIZへinterfaceの形で渡す。BIZはこのinterfaceで受けた証拠だけを使い、EJの行を自分で解釈しない。区間の完全なEJが後から取り込まれたら、BIZは同じ資料の相殺の確認待ちのflagを同じ業務TXで再評価し、行がなければ解消、あれば相殺の行ありへ変える。数え直しでも解消する。スロットと名称の対応が変わった区間はEJを取り込み直しても完全にならず、数え直しでだけ解消する。

精算同一性guardはBIZがpreviewとcommit TXの両方でproduceする。同じ帳票種別についてmachine_no / settlement_noが一致する別hashの受領済みsourceを照合し、同一精算の候補衝突として `source_identity_conflict` で業務write前にfile全体を拒否する。精算系列（番号のリセット区間）を証明する手段はないため、別系列と推測して通さない。比較対象はactive importだけに限定せず、未取込み/取消済みsourceも含む。生の番号組の一致に一律UNIQUEは張らず、衝突の判定はBIZが行う。

同一性guardが拒否を確定したら、BIZは業務write前にそのTXを戻し、DB lockを保持した独立証拠TXで対象sourceへ初回のidentity_rejection_code/identity_rejected_atを保存してからerrorを返す。previewの拒否も同じ経路。受領済み・拒否証拠は再起動や業務失敗でも残り、保存失敗はDB errorとして返す（業務writeは行わない）。UIは拒否応答後に準備照会をrefetchする。

識別メタ不足も同じguardで拒否する。同じsettlement_dateのactive import（completed / completed_partial）を全件取得し、その集合が空でなく、取込み対象sourceまたは比較先のいずれかでmachine_no / settlement_noが揃わなければ、同一性未確認としてsource_identity_conflictを返す。両方NULL、machine_noだけNULL、settlement_noだけNULLは同じ扱い。比較先sourceの欠落も未確認であり、メタ一致検索やINNER JOINで候補0件へ落とさず、仮キーで埋めない。additional_import_confirmed=trueでも業務write前にfile全体を拒否する。同日activeがない場合（初回、他日のactiveだけ、同日が取消済みだけ）はこの追加条件では拒否しないが、全受領sourceとの別hash衝突・active hash拒否・時点分類等の他のguardは省略しない。従来shapeのparse受理は、同日追加commitの許可を意味しない。

同日追加確認、受領後の再実測、元importの取消は同一精算別hashの関係を解決した証拠にならない。通常の同hash再取込みも別hash衝突がなければ可能という条件付きで、他方の受領を消して解除しない。衝突資料のどちらを採用するかを決める操作と既存sourceのメタ補完は本scopeにない。誤った版を取消しても訂正版は拒否されたままで、その精算の売上が欠落し、当該取込みによる在庫減算も行われない。番号resetの別系列も証明できないため同じ制限を受ける。メタ不足の同日追加も上記の拒否条件が残る間は取り込めない。再実測は現在庫を直すだけで売上欠落を復旧しない。利用者には[UI-07の確認・制限案内](55-ui-csv-import.md)を返す。

初導入の本番は[ADR D3 / D8](../adr/2026-09-18-stocktake-time-evidence.md)に従い、新しい識別メタの抽出→受領→保存を実装・検証してから開始し、メタを持たない旧Z004試験履歴を持ち込まない。これは旧行の存在時に拒否を外す例外ではない。原本layout Aでも移行前importはメタ不足になり得るため、preflightで日付を表示する。過去日の後追いは新形式どうしで他のguardを満たせば追加でき、本番開始日/最終取込み日による足切りは置かない。旧DBのlegacy実測・取消の保留も将来の更新/試験用に維持し、初導入にその本番履歴があると仮定しない。

commitは既存のhash・同日active ID snapshotを再検査した同じTXで、精算同一性guard（同日active全件の識別メタ不足を含む）、JAN候補・連動設定・現在の証拠を取り直す。preview後の別hash受領・同日active追加も検出する。マスタ候補がpreviewと変わったら再previewを要求する。heldまたはsource_identity_conflictなら業務write前に全体を拒否し、source受領は残す。通る場合だけsource参照付きimport・売上・許可されたmovement・flag・revisionをまとめて保存する。成功結果のrecount_targets/warningsは実際に保存したimport flagに加え、TX時点の非連動化の未調整対象からも生成する。売上のみ成功を在庫調整済みと表示せず、永続issueは商品側が所有する。UI申告のskip集合や再実測値は入力に持たない。

Beforeの販売/返品はどちらも在庫を動かさない。After（NeverObserved）とUnknownは売上・在庫ともZ004の純数量で通常適用する。全行0でも再確認・相殺の判定の用途があるfileは売上0で完了でき、解消後の再previewで0件guardへ戻さない。用途も対象もないfileは現行の空対象拒否を維持する。

#### 取消と保留の復旧

rollbackは対象importのstatus・有効movement ID・flagを同じTXで読み、legacy上限（`stocktake_legacy_movement_ceiling`）以下の取消で適用済み吸収先が分からない商品があれば、void前に全体を停止する。商品別純量0の例外でもflag・履歴・revisionを処理する。UIへrollback_recheck_requiredと対象（回復先はactive_count、なければindependent_recount）を返す。保留の解除は、対象商品に新しい適用済み実測（active明細があればその計数と確定、なければ独立再実測）ができた後に、同じimportの取消を再試行することで行う。新方式のpendingだけでは解除しない。取消のための専用の用途・理由・actionは設けない。旧完了記録の表示はreconciliation_version=0の意味で維持する。

停止条件がなければ、現在も効力を持つ最初の吸収先を商品内の観測順で選ぶ。pendingなら通常戻しと同じTXでLから取消quantityを引く。適用済みなら通常戻しを同額のrollback_compensationで打ち消す。吸収先なしは通常戻しのみ。N/S/E・cursor・観測順を取消日時で置換しない。二度目の取消は副作用なし。source・独立recount・確定済み評価額を消さず、元importが作成したflagだけ解消する。

対象importは単一TXなので、実測が同import内のmovementの途中へ入ることはない。商品ごとに取消quantityをchecked SUMし、適用済み吸収先へのrollback_compensationは非0なら商品ごと1本、純量0なら作らない。pendingのL補正も同じ純量を使い、行ごとの重複補償や複数観測への補償を行わない。

共有JAN行の保留集合はpreviewの導出結果。中断/再起動後は同fileを再選択して再生成する。保存済みの個別実測はDBに残り、未保存の数量は持ち越さない。拒否された未取込み資料のsettlement_missingは現在庫を数え直しても消さず、未取込み売上を0と認定しない。

#### 外部probeと本番条件

本runでは実機検証を行っていない。以下の成立が証明されるまで、その外部証拠に依存する判定を有効にしない（ej_unverifiedを外さない）。受領後の新しい実測は引き続き復旧手段であり、恒常的なPLU本番運用の代替と説明しない。

| 前提 | 外部probeで観測するもの | 成立時の許可 / 不成立時 |
|---|---|---|
| 精算系列 | 同機の連続精算・0売上・同日複数・日跨ぎ・番号reset、EJの精算区間とZ004の対応 | 同じ精算と対応づけられた区間だけ相殺の判定に使う。reset後の系列は証明できないので、同番の別hashは衝突として拒否 |
| EJ完全性 | 精算の開始/終了、取引一連番号、分割fileの必要な続き、先頭/末尾/途中欠落、Z004との同一精算（machine_no・settlement_no）、商品別の符号付き合計の一致、前回と今回のZ004のスロットとレジ側の名称の対応（価格だけの変更・新しい名称の追加との区別、前回のZ004がない最初の区間）、締めの時点で同じ日のEJをSDから取れるか | 対応が完全な区間だけ相殺の判定に使う。存在する末尾fileだけで完結と推測しない。不完全なら相殺の確認待ち |
| EJ復元 | 通常/返品（戻の行に商品名が載るか）、数量×単価、名称反復、訂正/取消の行の形と店が使うか、値引き（％－キー）の行の形、未知行、取引内点数・商品別符号付き合計、行の分類（商品の行・部門売り・合計や支払などの明細でない行・帰属できない行） | Z004純合計一致は必要条件のみ。未知形式・帰属できない行・相殺する欠落があれば区間を不完全とし、相殺の確認待ち |
| 商品同定 | 出力時の名称（Z004の当該スロットのキャラクター欄）、改名、共有/衝突、部門名との一致、16バイトのレジ名称の一意性、JAN候補、行の分類（商品の行・部門売り・帰属できない行）と値引きの行がどの分類に入るか | 一意に帰属できた商品の行と、部門名に一意に一致する部門売りの行だけを既知とする。不明は帰属できない行として区間を不完全にする。現在のマスタ名だけで過去を推定しない |

EJ取得・完全性不成立時の拒否・再実測復旧まで確認してからPLU本番へ進む。sampleの形状観察済みと、系列/全取引形状の未検証を分ける。EJ完全性・EJ復元・商品同定の3行のowner-operated gateの証拠が、ej_unverifiedを外すlaneのmerge条件になる。追加の採取・レジ操作は別のowner-operated gateで行い、このdocs同期をその許可にしない。

計画中の改訂: [棚卸しと後着売上の時点証拠](../adr/2026-09-18-stocktake-time-evidence.md) D2〜D6（proposed）。資料受領と売上commitの分離、区間の証拠、共有JANの保留、取消順序を定める。以下の本文は現行実装契約であり、新方式の実装済み仕様ではない。

> **2026-08-01 evidence sync**: 本書は既存の Z004-only product-sales import pipeline の実装契約を記録する。current operation の日報主入力 `Z001`/`Z002`/`Z005` は [37-biz-daily-report-import-service.md](37-biz-daily-report-import-service.md) のBIZ-08で扱う。集計日報データは `daily_report_imports` / `daily_report_*_lines` に保存し、item-level `sale_records` / `inventory_movements` へ擬似展開しない。Z004側はsale_records作成、`pos_stock_sync`在庫増減、重複・rollbackまで実装済み。2026-07-06店舗採取layout AはIO-02が二形状対応済み（SPEC-Z4A-D1〜D7）。field readinessは実データend-to-end再検証（CSV-09/10）を待つ。

### 15.1 モジュール構成

```
src-tauri/src/
  biz/
    mod.rs                   -- pub mod csv_import_service を追加
    product_service.rs       -- 既存（BIZ-01）
    inventory_service/       -- 既存（BIZ-02、ディレクトリモジュール）
    csv_import_service.rs    -- CSV取込みの業務ロジック（本セクション）
```

単一ファイルで開始。肥大化したら inventory_service と同様にディレクトリ分割する。

---

### 15.2 型定義

#### CsvParseAndValidateRequest構造体

- file_bytes: Vec\<u8\>（Z004ファイルの生バイト列）
- filename: String（ファイル名。csv_imports.filename に記録する表示用）

#### ParseValidateResult構造体

- preview_data: PreviewData
- preview_token: String（UUID v4。CMD層がキャッシュキーとして使用）
- matched_rows: Vec\<MatchedRow\>（CMD層がキャッシュに保存する。フロントエンドには返さない）
- error_rows: Vec\<ErrorRow\>（同上）

#### PreviewData構造体

- file_info: FileInfo
- matched_summary: MatchedSummary
- error_summary: ErrorSummary
- duplicate_check: DuplicateCheck
- preview_created_at: String（YYYY-MM-DDTHH:MM:SS）

※ preview_token は ParseValidateResult のトップレベルにのみ保持する。PreviewData はフロントエンドに表示するデータのみを含む。フロントエンドは ParseValidateResult.preview_token を commit 時に送り返す。

#### FileInfo構造体

- filename: String
- settlement_date: String（YYYY-MM-DD）
- file_hash: String（SHA-256 hex、小文字64文字）

#### MatchedSummary構造体

- count: usize（紐付け成功件数）
- total_amount: i64（matched_rows の amount 合計）
- warnings: Vec\<String\>（グループコード商品の紐付け警告等）

#### ErrorSummary構造体

- count: usize（エラー行の総数）
- items: Vec\<ErrorRow\>（最大100件。超過時は件数のみ。UI表示の上限）

#### DuplicateCheck構造体

- status: DuplicateStatus
- same_date_imports: Vec\<SameDateCsvImportSummary\>（active importを `imported_at DESC, id DESC` で全件）

#### SameDateCsvImportSummary構造体

- id: i64
- filename: String
- total_items: i64
- total_amount: i64
- imported_at: String

#### DuplicateStatus列挙型

```
enum DuplicateStatus {
    NoDuplicate,
    AdditionalImportConfirmationRequired,
}
```

※ 同一file_hashのactive importはparse_and_validate内で即 `BizError::ImportError` を返すため、enumには含めない。同日別hashは独立入力であり、既存importを残したまま追加する前に利用者確認を要求する。

#### MatchedRow構造体（サーバ側キャッシュに保持、フロントエンドには送らない）

- line_no: usize（Z004の行番号。1始まり）
- product_code: String（紐付いた商品コード）
- quantity: i32（売上帳票視点の値。正=販売、負=返品）
- amount: i32
- pos_stock_sync: bool（紐付いた商品の pos_stock_sync フラグ）

#### ErrorRow構造体

- line_no: usize
- normalized_jan: Option\<String\>（JAN正規化前にエラーならNone）
- name: String
- raw_quantity: String
- raw_amount: String
- error_type: String（"unmatched_product" / "invalid_format" / "invalid_jan" / "invalid_number"）
- error_message: String（利用者向け日本語メッセージ）

**enum 契約化（D-061）**: `error_type` の4値は IO の `ParseErrorType` 3 variant + BIZ 生成 `unmatched_product` を合成した `CsvImportErrorType` generated enum で表す。IO→wire 変換は明示 match とし、値・利用者向け文言は不変。

#### CommitRequest構造体

- additional_import_confirmed: bool（同日別hashの追加確認済みフラグ）
- cached_data: CachedPreview（CMD層がキャッシュから復元したデータ。matched_rows, error_rows, preview_data を含む）

**BIZ-03-D1（commit最小内部契約）**:

- `MatchedRow` はcommitが在庫・売上・監査行の生成に使う `line_no` / `product_code` / `quantity` / `amount` / `pos_stock_sync` だけを保持する。表示専用のJAN・商品名を30分cacheへ複製しない。
- `CommitRequest` はBIZが判断に使う `additional_import_confirmed` と、CMDがtokenで復元済みの `cached_data` だけを受け取る。tokenのUUID検証・cache対応確認・TTL・成功時削除はCMD-07の責務であり、BIZ requestへ再格納しない。

#### ImportResult構造体

- csv_import_id: i64
- status: CsvImportStatus（"completed" / "completed_partial"。rollback 後の "rolled_back" と同じ generated enum。値・分岐は不変）
- total_items: i64
- total_amount: i64
- skipped_count: i64

#### RollbackResult構造体

- success: bool
- voided_sale_count: u64
- voided_movement_count: usize
- stock_corrections: Vec\<StockCorrection\>

#### StockCorrection構造体

- product_code: String
- old_stock: i64
- new_stock: i64

#### CachedPreview構造体（サーバ側メモリキャッシュ）

- created_at: std::time::Instant（キャッシュ作成時刻。有効期限判定に使用）
- matched_rows: Vec\<MatchedRow\>
- error_rows: Vec\<ErrorRow\>
- preview_data: PreviewData（フロントエンドに返した内容のコピー）
- active_same_date_import_ids: Vec\<i64\>（parse時のactive import IDを `imported_at DESC, id DESC` で保持するcommit再検証snapshot）

---

### 15.3 parse_and_validate（Stage 1+2+3）

**関数要求**: Z004ファイルを解析し、マスタ照合後のプレビューデータを返す。業務テーブルへの書き込みなし（parse失敗時のoperation_log記録は例外）。preview_token を生成して返す（キャッシュ保存はCMD層の責務）

**シグネチャ**:
```
fn parse_and_validate(
    conn: &DbConnection,
    req: CsvParseAndValidateRequest,
) -> Result<ParseValidateResult, BizError>
```

**前提条件**: 業務テーブル（csv_imports, sale_records等）への書き込みなし。ただし**parse失敗時のoperation_log記録は例外**（system_repo::insert_operation_logを呼ぶ。ログ記録失敗は警告のみで処理続行）。conn は &DbConnection（operation_logの書き込みはautocommit）。キャッシュはBIZ層で保持しない（ロック区間最小化のためCMD層がAppStateで管理）

**処理ステップ**:

1. **サイズガード**
   - req.file_bytes.len() > constants::CSV_IMPORT_FILE_SIZE_LIMIT → BizError::ImportError("ファイルサイズが上限（20MB）を超えています")
2. **Stage 1: Parse**（IO-02 委譲）
   - io::z004_parser::parse_z004(&req.file_bytes) を呼び出し
   - Err(Z004ParseError) → system_repo::insert_operation_log(conn, &NewOperationLog { operation_type: "csv_import_parse_failed", summary: エラーメッセージ, detail_json: None }) → BizError::ImportError に変換
     - DecodeFailed → "Z004ファイルの解析に失敗しました: CP932デコードエラー"
     - NoDataLines → "Z004ファイルの解析に失敗しました: データ行がありません"
     - NoSettlementDate → "Z004ファイルの解析に失敗しました: 精算日を抽出できません"
   - Ok(parse_result) → parsed_rows が 0件かつ parse_errors が非空 → system_repo::insert_operation_log(conn, &NewOperationLog { operation_type: "csv_import_parse_failed", summary: "有効なデータがありません", detail_json: None }) → BizError::ImportError("有効なデータがありません")
3. **行数ガード**
   - parse_result.total_data_lines > constants::CSV_IMPORT_LINE_LIMIT → BizError::ImportError("データ行数が上限（10,000行）を超えています")
4. **Stage 2: Validate**
   a. 空レコード除外（エラーにもカウントしない）
      - quantity == 0 かつ amount == 0（PLU登録あるが当日販売なしのスロット）
      - ※ 全桁ゼロJAN（"0000000000000"）はIO-02 parse_data_lineで除外済み（Ok(None)返却）。BIZ-03では重複チェック不要
   b. 実データ行のマスタ照合: 各行について
      - product_repo::find_by_jan_code(conn, &normalized_jan) を呼び出し
      - ヒット1件 → MatchedRow { line_no, product_code, quantity, amount, pos_stock_sync: product.pos_stock_sync }
      - ヒット0件 → ErrorRow { line_no, normalized_jan: Some(normalized_jan), name, raw_quantity: quantity.to_string(), raw_amount: amount.to_string(), error_type: "unmatched_product", error_message: "JAN {jan} に該当する商品がありません" }
      - ヒット複数件 → ORDER BY product_code ASC で先頭を採用。warnings に "JAN {jan} は複数商品に紐付いています（{code} を使用）" を追加
   c. parse_result.parse_errors を ErrorRow にマージ
      - ParseErrorType → error_type 文字列変換: InvalidFormat → "invalid_format", InvalidJan → "invalid_jan", InvalidNumber → "invalid_number"
      - Option→String 変換規約: ParseError.raw_name/raw_quantity/raw_amount が None の場合、空文字列に変換する。None は error_type が invalid_format の場合にのみ発生する（フィールド分割前のエラーで値が取得できなかった）。Z004のフィールドは実運用で空文字にならないため、空文字はパース前エラーと判別可能。DB保存（csv_import_errors）は空文字のまま、UI表示時に error_type が invalid_format なら「(不明)」等に置換する
   d. 実質0件ガード
      - matched_rows.is_empty() && error_rows.is_empty() → BizError::ImportError("取込み対象のデータがありません")
5. **Stage 3: Preview**
   a. file_hash 重複チェック:
      - sales_repo::find_blocking_import_by_file_hash(conn, &parse_result.file_hash) → Some → BizError::ImportError("このファイルは取込み済みです（取込みID: {id}、取込み日: {imported_at}）")
   b. settlement_date 同日チェック:
      - sales_repo::find_imports_by_settlement_date(conn, &parse_result.settlement_date) を呼び、active importを `imported_at DESC, id DESC` で全件取得する
      - 非空 → `DuplicateCheck { status: AdditionalImportConfirmationRequired, same_date_imports: 全件のSameDateCsvImportSummary }`
      - 空 → `DuplicateCheck { status: NoDuplicate, same_date_imports: [] }`
      - 全件のIDを同じ順序で `CachedPreview.active_same_date_import_ids` に保持する
   c. PreviewData 構築
      - matched_summary: count = matched_rows.len(), total_amount = matched_rows.iter().map(|r| r.amount as i64).sum(), warnings
      - error_summary: count = error_rows.len(), items = error_rows の先頭100件
6. **preview_token 生成**: UUID v4
7. ParseValidateResult { preview_data, preview_token, matched_rows, error_rows } を返す
   - CMD層がこの戻り値を受け取り、preview_tokenをキーとしてAppState.preview_cacheに保存する（17.5節参照）

**エラーハンドリング**:
- IO-02 parse失敗 → BizError::ImportError（operation_log記録後に変換）
- 全行パースエラー → BizError::ImportError("有効なデータがありません")
- 空レコード除外後0件 → BizError::ImportError("取込み対象のデータがありません")
- サイズ上限超過 → BizError::ImportError
- 行数上限超過（total_data_lines > constants::CSV_IMPORT_LINE_LIMIT）→ BizError::ImportError
- file_hash 重複ブロック → BizError::ImportError
- DB読み取り失敗（マスタ照合等）→ BizError::DatabaseError(DbError)

**入力例**:
```
req: CsvParseAndValidateRequest {
    file_bytes: [CP932バイト列...],
    filename: "Z004_260321",
}
```

**出力例**:
```
Ok(ParseValidateResult {
    preview_data: PreviewData {
        file_info: FileInfo {
            filename: "Z004_260321",
            settlement_date: "2026-03-21",
            file_hash: "a1b2c3d4e5f6...",
        },
        matched_summary: MatchedSummary {
            count: 45,
            total_amount: 28500,
            warnings: [],
        },
        error_summary: ErrorSummary {
            count: 3,
            items: [
                ErrorRow { line_no: 12, normalized_jan: Some("4973167064078"), name: "ﾎﾞﾀﾝ ﾊﾞﾗ", ..., error_type: "unmatched_product", error_message: "JAN 4973167064078 に該当する商品がありません" },
                ...
            ],
        },
        duplicate_check: DuplicateCheck { status: NoDuplicate, same_date_imports: [] },
        preview_created_at: "2026-03-21T19:30:00",
    },
    preview_token: "550e8400-e29b-41d4-a716-446655440000",
})
```

---

### 15.4 commit_csv_import（Stage 4）

**関数要求**: プレビュー済みデータをDBに書き込む。CMD層から受け取ったキャッシュデータを使いTX内で一括実行する

**シグネチャ**:
```
fn commit_csv_import(
    conn: &mut DbConnection,
    req: CommitRequest,
) -> Result<ImportResult, BizError>
```

注: キャッシュ復元・有効期限チェック・トークン削除はCMD層の責務（41-cmd-pos.md 17.5節参照）。BIZ層はCMD層が復元済みのデータ（CommitRequest.cached_data）を受け取る。

**処理ステップ**:

1. **ローカル変数の導出と確認フラグ整合**（req.cached_data から展開）
   - let cached = req.cached_data
   - let matched_rows = &cached.matched_rows
   - let error_rows = &cached.error_rows
   - let file_hash = &cached.preview_data.file_info.file_hash
   - let settlement_date = &cached.preview_data.file_info.settlement_date
   - let filename = &cached.preview_data.file_info.filename
   - cached statusが `NoDuplicate` なら `additional_import_confirmed=false`、`AdditionalImportConfirmationRequired` なら `true` のみ許可する。不一致は `BizError::ValidationFailed` とし、DBへ書き込まない
2. **TX開始**（conn.transaction()。RAII Drop で自動 ROLLBACK）
3. **file_hash 重複再チェック**（TX内、TOCTOU防止。snapshot再取得より先に行う）
   - sales_repo::find_blocking_import_by_file_hash(&tx, file_hash) → Some → BizError::ImportError("このファイルは既に取込み済みです")
4. **同日active ID snapshot再検証**（TX内）
   - `find_imports_by_settlement_date(&tx, settlement_date)` を再実行し、`imported_at DESC, id DESC` のID列を作る
   - cachedの `active_same_date_import_ids` と完全一致しない場合は副作用なしでROLLBACKし、`BizError::ImportError("同日の取込み状況が変わりました。再度プレビューしてください")` を返す
   - 一致した場合だけ続行する。既存import、sale_records、inventory_movementsは変更しない
5. **csv_imports 仮INSERT**
   - sales_repo::insert_csv_import(&tx, &NewCsvImport { filename, settlement_date, file_hash, total_items: 0, total_amount: 0, skipped_count: 0, status: "completed" }) → import_id
6. **matched_rows の各行を処理**（stock_warnings を蓄積）
   a. sales_repo::insert_sale_record(&tx, &NewSaleRecord { csv_import_id: Some(import_id), product_code: row.product_code, sale_date: settlement_date, quantity: row.quantity as i64, amount: row.amount as i64, source: "auto", source_line_no: Some(row.line_no as i64), reason: None, note: None })
   b. row.pos_stock_sync == true の場合:
      - inventory_quantity = -(row.quantity as i64)（INV-1: 売上帳票視点→在庫視点。常に符号反転）
      - inventory_service::apply_stock_change(&tx, &row.product_code, inventory_quantity, MovementType::SaleAuto, ReferenceType::CsvImport, import_id, None)
      - outcome.negative_stock_warning == true → stock_warnings に "商品 {product_code} の在庫がマイナスになりました（在庫: {stock_after}）" を追加
   c. row.pos_stock_sync == false → sale_records のみ作成。在庫は動かさない
7. **error_rows の記録**（error_rows が非空の場合）
   - ErrorRow → NewCsvImportError に変換
   - sales_repo::insert_csv_import_errors(&tx, &errors)
8. **集計値の確定**
   - total_items = matched_rows.len() as i64
   - total_amount = matched_rows.iter().map(|r| r.amount as i64).sum()
   - skipped_count = error_rows.len() as i64
   - status = if error_rows.is_empty() { "completed" } else { "completed_partial" }
   - sales_repo::update_csv_import_totals(&tx, import_id, total_items, total_amount, skipped_count, status)
9. **COMMIT**（tx.commit()）
10. **TX外: 操作ログ記録**
    - system_repo::insert_operation_log(conn, &NewOperationLog { operation_type: "csv_import", summary: "CSV取込み完了: {filename}（{total_items}件, ¥{total_amount}）", detail_json: Some(detail_json) })
    - detail_json: { "import_id": import_id, "filename": filename, "settlement_date": settlement_date, "total_items": total_items, "total_amount": total_amount, "skipped_count": skipped_count, "status": status }
    - 操作ログ記録失敗は警告のみ（業務処理のcommitは完了済み）
11. ImportResult { csv_import_id: import_id, status, total_items, total_amount, skipped_count } を返す
    - CMD層がOk受信後にpreview_cacheからtoken削除（41-cmd-pos.md 17.5節参照）

**TX境界**: ステップ2〜9が1TX。file_hashとactive same-date snapshotの再検証から新規行の保存までを同じTXに置く。操作ログ記録（ステップ10）はTX外。

**TX失敗時**: TX ROLLBACK → csv_imports レコードなし。TX 外で system_repo::insert_operation_log(conn, &NewOperationLog { operation_type: "csv_import_failed", summary: "CSV取込みに失敗しました: {error}", detail_json: None }) を記録。CMD層はErr受信時にキャッシュを削除しない（利用者が再試行可能にするため）。

**符号変換ルール（INV-1準拠）**:
- row.quantity（売上帳票視点）: +3 = 3個販売、-1 = 1個返品
- inventory_quantity（在庫視点）: -3 = 在庫3個減、+1 = 在庫1個増
- 変換式: inventory_quantity = -row.quantity（常に符号反転）

**入力例**:
```
req: CommitRequest {
    additional_import_confirmed: false,
    cached_data: CachedPreview { matched_rows: [...], error_rows: [...], preview_data: PreviewData { ... } },
}
```

**出力例**:
```
Ok(ImportResult {
    csv_import_id: 1,
    status: "completed_partial",
    total_items: 45,
    total_amount: 28500,
    skipped_count: 3,
})
```

---

### 15.5 rollback_csv_import

**関数要求**: 指定 csv_import IDだけを論理無効化し、当該import由来の在庫だけを補正する。冪等（既に rolled_back なら何もせず成功を返す）。同一settlement_dateの他importは残す。

**シグネチャ**:
```
fn rollback_csv_import(
    conn: &mut DbConnection,
    csv_import_id: i64,
) -> Result<RollbackResult, BizError>
```

**処理ステップ**:

1. **対象確認**
   - sales_repo::find_csv_import_by_id(conn, csv_import_id) を呼び出し
   - None → BizError::NotFound("CSV取込み記録が見つかりません: ID {csv_import_id}")
   - Some(import) で import.status == "rolled_back" → RollbackResult { success: true, voided_sale_count: 0, voided_movement_count: 0, stock_corrections: [] } を即リターン（冪等）
2. **TX開始**（conn.transaction()）
3. **sale_records の無効化**
   - sales_repo::void_sale_records_by_import(&tx, csv_import_id) → voided_sale_count
4. **inventory_movements の無効化と在庫補正データ取得**
   - sales_repo::void_movements_by_reference(&tx, "csv_import", csv_import_id) → voided_movements: Vec\<VoidedMovement\>
5. **在庫補正**（product_code でグループ化して集計）
   a. voided_movements を product_code でグループ化
   b. 各 product_code について: correction = voided_movements の quantity を合算し符号反転
      - 例: quantity = -3（販売で3個減）が void → correction = +3（3個戻す）
      - 例: quantity = +1（返品で1個増）が void → correction = -1（1個引く）
      - 計算式: correction = -SUM(voided.quantity)  ※同一product_codeの全movementを合算
   c. product_repo::find_by_product_code(&tx, &product_code) → product
   d. new_stock = product.stock_quantity + correction
   e. inventory_repo::update_stock_quantity(&tx, &product_code, new_stock)
   f. stock_corrections に StockCorrection { product_code, old_stock: product.stock_quantity, new_stock } を追加
6. **csv_imports の status 更新**
   - sales_repo::update_csv_import_status(&tx, csv_import_id, "rolled_back")
   - settlement_dateを条件にせず、指定IDだけを更新する。同日の他importは変更しない
7. **COMMIT**（tx.commit()）
8. **TX外: 操作ログ記録**
   - system_repo::insert_operation_log(conn, &NewOperationLog { operation_type: "csv_rollback", summary: "CSV取込みを取消しました: ID {csv_import_id}", detail_json: Some(detail_json) })
   - detail_json: { "csv_import_id": csv_import_id, "voided_sale_count": voided_sale_count, "voided_movement_count": voided_movements.len(), "stock_corrections": [...] }
9. RollbackResult { success: true, voided_sale_count, voided_movement_count: voided_movements.len(), stock_corrections } を返す

**在庫補正の詳細**:
- movement.quantity = -3（販売で在庫3個減）→ void 後の在庫補正 = +3（3個戻す）
- movement.quantity = +1（返品で在庫1個増）→ void 後の在庫補正 = -1（1個引く）
- 同一 product_code に複数の voided_movement がある場合は合算してから1回の update_stock_quantity で更新する

**設計判断 — apply_stock_change を使わない理由**: ロールバックは「元の movement を取り消す」操作であり、新しい inventory_movements レコードを追加しない。apply_stock_change は movement を追加する関数のため、ここでは直接 update_stock_quantity を使う。void 対象の movement が取消の記録として残る（is_voided=1）。

**入力例**:
```
csv_import_id: 5
```

**出力例**:
```
Ok(RollbackResult {
    success: true,
    voided_sale_count: 45,
    voided_movement_count: 42,  // pos_stock_sync=0 の3件は movement がないため45-3=42
    stock_corrections: [
        StockCorrection { product_code: "4976383262108", old_stock: 14, new_stock: 17 },
        StockCorrection { product_code: "4976383262207", old_stock: 2, new_stock: 10 },
        StockCorrection { product_code: "4973167902615", old_stock: 6, new_stock: 5 },
    ],
})
```

---

### 15.6 list_csv_imports

**関数要求**: csv_imports 一覧をimport単位で返す。CMD 経由のラッパー（repo 直呼び防止）。同日複数importをcollapseせず、repoの `settlement_date DESC, imported_at DESC, id DESC` 順を維持する。

**シグネチャ**:
```
fn list_csv_imports(
    conn: &DbConnection,
    page: u32,
    per_page: u32,
) -> Result<PaginatedResult<CsvImport>, BizError>
```

**処理ステップ**:
1. page < 1 || per_page < 1 || per_page > 100 → BizError::ValidationFailed("ページパラメータが不正です")
2. sales_repo::list_csv_imports(conn, page, per_page) を呼び出し
3. DbError → BizError::DatabaseError に変換して返す

---

### 15.6a get_csv_import_record

**関数要求**: CSV取込み記録詳細を wire DTO として返す。[31-biz-inventory-service.md](31-biz-inventory-service.md) §12.6a 業務記録詳細 read 関数と同じ read-only パターンで、movements への source link 補完と NotFound 変換を BIZ が担う。CSV取込み詳細画面（`/csv-import/records/$importId`、[65-inventory-record-traceability.md](65-inventory-record-traceability.md) §65.3 / §65.5）用

**シグネチャ**:
```
fn get_csv_import_record(
    conn: &DbConnection,
    import_id: i64,
) -> Result<CsvImportRecordDetail, BizError>
```

**CsvImportRecordDetail構造体**（wire DTO。CSV import family の他 wire 型と同じく BIZ-03 が所有する）:
- id: i64, filename: String, settlement_date: String, total_items: i64, total_amount: i64, skipped_count: i64, status: CsvImportStatus, imported_at: String
- items: Vec\<CsvImportRecordDetailItem\>（IO 型を再利用、[24-io-csv-import-repo.md](24-io-csv-import-repo.md) §14.13a）
- error_rows: Vec\<ErrorRow\>（§15.2 既存 wire 型を再利用し、取込みプレビューのエラー表示と同一意味論にする）
- movements: Vec\<MovementRecord\>（source 補完済み）

file_hash は重複取込み判定の内部値であり operator 向け情報ではないため wire DTO に載せない。

**処理ステップ**:
1. sales_repo::get_csv_import_record_detail(conn, import_id) を呼ぶ。IO 層の NotFound は「CSV取込み記録が見つかりません」を含む BizError::NotFound、その他の IO エラーは BizError::DatabaseError に変換する
2. sales_repo::list_csv_import_error_rows(conn, import_id) を呼ぶ
3. エラー行を ErrorRow へ写像する（line_no=source_line_no、name=raw_name、error_type は raw TEXT から `CsvImportErrorType` へ変換。DB CHECK により4値保証のため想定外値は BizError::DatabaseError で fail-fast）
4. movements の各行に `biz::inventory_service` の `resolve_movement_source` と同一実装で source(label, route) を補完する（label/route 規則の独自複製を作らず、共有関数を再利用する）。共有のため `inventory_service/mod.rs` へ `pub(crate) use list::resolve_movement_source;` の re-export を 1 行追加する（`mod list` は private のため sibling module から現状 unreachable。同 file の `pub(crate) use common::apply_stock_change` と同型の既存慣習）
5. CsvImportRecordDetail を構成して返す

---

### 15.7 非目的

このモジュールが**やらないこと**を明示する。責務境界の誤解を防ぐため。

| やらないこと | 理由 | 責務を持つモジュール |
|------------|------|-----------------|
| 物理DELETE | 全 void 処理は is_voided=1。hard delete 禁止 | — |
| IO-04 フォーマット処理（PLU TSV生成） | BIZ-04 の責務 | BIZ-04 |
| INV-5 idempotency_key パターン | BIZ-03 は file_hash 自然冪等性を使用（INV-6） | BIZ-02 の各 create 関数 |
| フロントエンド状態管理 | preview_data の表示制御、ボタン disabled 等 | UI-07 |
| Z004 ファイルの解析 | 純関数として IO-02 に分離済み | IO-02 z004_parser |
| file_hash の算出 | IO-02 が parse_z004 内で実行 | IO-02 z004_parser |
| CSV フィールドのパース | IO-02 の責務 | IO-02 z004_parser |

---

### 15.8 対応不変条件

| 不変条件 | 本モジュールでの対応 |
|---------|-----------------|
| INV-1: quantity 符号変換 | commit_csv_import のステップ7b で inventory_quantity = -row.quantity。売上帳票視点→在庫視点の符号反転を BIZ 層で実施 |
| INV-2: stock_after 算出 | apply_stock_change 経由（commit 時）。rollback 時は直接 update_stock_quantity |
| INV-3: 負在庫ポリシー | commit 時に apply_stock_change が negative_stock_warning を返す。警告をstock_warningsに蓄積するが処理は続行 |
| INV-4: is_voided 使用範囲 | rollback_csv_import で void_sale_records_by_import, void_movements_by_reference を呼び出し。is_voided=1 を設定するのはロールバック時のみ |
| INV-6: file_hash 自然冪等性 | parse_and_validate のステップ5a で find_blocking_import_by_file_hash。commit_csv_import のステップ5で TX 内再チェック（TOCTOU 防止） |
| INV-7: csv_import 参照の movements は sale_auto 限定 | commit_csv_import のステップ7b で MovementType::SaleAuto 固定。void_movements_by_reference は reference_type のみで絞り込み（movement_type 条件は冗長） |
| INV-8: products 物理 DELETE 禁止 | 本モジュールは products を UPDATE のみ（stock_quantity）。DELETE 操作なし |

---

### 15.9 preview キャッシュ管理

**所有責務**: CMD層（AppState.preview_cache: Mutex\<HashMap\<String, CachedPreview\>\>）が所有。BIZ層はキャッシュを直接操作しない（ロック区間最小化のため。41-cmd-pos.md 17.3節参照）。

**ライフサイクル**（CMD層が管理）:
- **作成**: CMD層が parse_and_validate の戻り値を受け取り cache.insert
- **消費**: CMD層が commit_csv_import の Ok 受信後に cache.remove
- **有効期限**: CMD層が commit 前に created_at.elapsed() > 30分 をチェック → 期限切れなら cache.remove してCmdError返却
- **アプリ再起動**: 全キャッシュ消失（永続化しない。Preview → Commit は1セッション内で完結する前提）

**設計判断**:
- HashMap の容量: 1人運用のため同時 preview 数は最大1件。HashMap 容量は問題にならない
- **上限**: エントリ数上限10件（constants::PREVIEW_CACHE_LIMIT）。insert 前に len >= 10 なら最も古いエントリ（created_at が最小）を1件削除してから insert する（FIFO）。削除されたトークンで commit が呼ばれた場合、CMD層が「プレビューが見つかりません」CmdError を返す
- 永続化しない理由: Preview データには matched_rows（商品在庫のスナップショットを含む）があり、時間が経つと実際の在庫と乖離する。再起動後は再度 parse_and_validate を実行するのが正しい
- 30分の根拠: 利用者がプレビュー確認→取り込み判断に十分な時間。長すぎると在庫の乖離リスクが高まる
- **commit失敗時**: CMD層は通常の失敗ではキャッシュを削除せず、同一tokenで再試行可能にする。ただしactive same-date snapshot不一致は同じpreviewでは解消できないため、CMD層がtokenを削除し、新しいpreviewを要求する
- **ライフサイクル規約まとめ**: (1) ワンタイム: commit 成功時に即削除、同一トークンでの再 commit は不可 (2) 揮発: アプリ再起動で全消失、再起動後のトークンは必ず無効 (3) トークン不存在（削除済み/再起動後/追い出し）: CmdError kind="import_error" message="プレビューが見つかりません。再度ファイルを選択してください" (4) 期限切れ: CmdError kind="import_error" message="プレビューの有効期限が切れました（30分）。再度ファイルを選択してください" → UIは「ファイル選択」画面に戻す導線を表示
- **architecture/biz-task-specs.md との差異**: 関数設計でpreview_token方式に変更した。理由: Preview結果をフロントエンドに渡して再送信させると、データ量が大きく改ざんリスクもある。preview_token方式ではサーバ側キャッシュからmatched_rowsを復元するため安全。architecture/biz-task-specs.md と整合済み（本PR内で更新）

**キャッシュの所有権**: Tauri の State\<Mutex\<HashMap\<...\>\>\> で管理。CMD層がlock→操作→unlockを行い、BIZ層にはキャッシュを渡さない（ロック区間最小化）。

---

### 15.10 BizError 追加バリアント

BIZ-03 で新たに使用する BizError バリアントの確認:

```
enum BizError {
    ValidationFailed(String),   // 既存
    NotFound(String),           // 既存 — rollback 時の csv_import 不存在
    DuplicateProductCode(String), // 既存（本モジュールでは不使用）
    DatabaseError(DbError),     // 既存
    ImportError(String),        // 既存 — parse失敗、同一hashブロック、snapshot不一致等
    IdempotencyConflict(String), // 既存（本モジュールでは不使用。INV-6方式）
}
```

**ImportError の使い分け（BIZ層）**:
- ファイル形式の問題（parse 失敗、サイズ超過）→ ImportError
- 重複ブロック（file_hash 一致で取込み済み）→ ImportError
- duplicate status と `additional_import_confirmed` の不一致 → ValidationFailed
- active same-date snapshot不一致 → ImportError("同日の取込み状況が変わりました。再度プレビューしてください")
- マスタ未登録（error_rows で表現）→ エラーではなくプレビューの一部として返す
- ※ キャッシュ問題（token不正、有効期限切れ、不存在）はCMD層の責務。BIZ層には到達しない

---

### 更新履歴

| 日付 | PR | 内容 |
|------|-----|------|
| 2026-04-11 | PR #14 | 初版作成（BIZ-03 CSV取込みパイプライン: parse_and_validate / commit_csv_import / rollback_csv_import / list_csv_imports） |
| 2026-04-11 | PR #14 | 設計書定義に対し実装欠落していた sales_repo::find_csv_import_by_id を併せて実装。rollback_csv_import のステップ1（対象確認）が当初は別アプローチで検討されたが、設計書に明記された find_csv_import_by_id を採用 |
| 2026-04-13 | PR #22 | preview キャッシュ管理の所有責務を明確化（BIZ層→CMD層）。ロック区間最小化のため CachedPreview を CMD層 AppState に保持し、commit時に BIZ層へ渡す |
| 2026-08-03 | CSV取込み詳細 Design Phase | §15.6a get_csv_import_record を追加（CSV取込み詳細画面用 wire DTO、31 §12.6a read-only パターン、ErrorRow 再利用、resolve_movement_source 共有） |
| 2026-08-16 | PR #79 | SPEC-SDI-D1〜D8: 同日別hashを追加取込みとし、全件summary、追加確認flag、TX内snapshot再検証、insert-only commit、per-import rollbackを正本化。 |
